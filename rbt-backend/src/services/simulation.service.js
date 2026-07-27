/**
 * Simulation Service
 * Business logic orchestrator — menggabungkan Pasal.id + Gemini + MySQL
 */
const { pool } = require('../config/db');
const { extractKeywords } = require('../utils/keyword-extractor');
const { searchLegalArticles } = require('./pasal.service');
const { generateRBTScenario } = require('./gemini.service');

/**
 * Proses simulasi RBT secara lengkap (chain request)
 * Flow: Input -> Keyword Extract -> Pasal.id -> Gemini AI -> Save MySQL -> Response
 * 
 * @param {number} userId - ID user yang membuat simulasi
 * @param {string} judul - Judul simulasi
 * @param {string} narasiKasus - Narasi kasus
 * @param {string} spesialisasi - Spesialisasi unit
 * @param {string} [language='id'] - Bahasa output ('id' | 'en')
 * @returns {object} Hasil simulasi lengkap
 */
async function processSimulation(userId, judul, narasiKasus, spesialisasi, language = 'id') {
  const connection = await pool.getConnection();
  let simulationId = null;

  try {
    // Mulai transaction untuk konsistensi data
    await connection.beginTransaction();

    // ----- STEP 1: Ekstrak Kata Kunci -----
    console.log('[SIM] Step 1: Extracting keywords...');
    const { keywords, categories, searchQuery } = extractKeywords(narasiKasus);
    console.log(`[SIM] Keywords found: ${keywords.join(', ')}`);

    // ----- STEP 2: Simpan simulasi (status: processing) -----
    console.log('[SIM] Step 2: Creating simulation record...');
    const [simResult] = await connection.execute(
      `INSERT INTO simulations (user_id, judul, narasi_kasus, kata_kunci, spesialisasi, status, language)
       VALUES (?, ?, ?, ?, ?, 'processing', ?)`,
      [userId, judul, narasiKasus, JSON.stringify(keywords), spesialisasi, language]
    );
    simulationId = simResult.insertId;
    console.log(`[SIM] Simulation created with ID: ${simulationId}`);

    // ----- STEP 3: Fetch ke Pasal.id API (+ Gemini fallback) -----
    console.log(`[SIM] Step 3: Fetching legal references for query: "${searchQuery}"...`);
    const legalReferences = await searchLegalArticles(searchQuery, narasiKasus, categories);
    console.log(`[SIM] Legal references found: ${legalReferences.length}`);

    // Simpan referensi hukum ke database
    for (const ref of legalReferences) {
      await connection.execute(
        `INSERT INTO legal_references (simulation_id, pasal_number, undang_undang, deskripsi, ancaman_pidana, raw_response)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          simulationId,
          ref.pasal,
          ref.undangUndang,
          ref.deskripsi,
          ref.ancamanPidana,
          JSON.stringify(ref),
        ]
      );
    }

    // ----- STEP 4: Fetch ke Gemini AI API -----
    console.log(`[SIM] Step 4: Generating RBT scenario via Gemini AI [language: ${language}]...`);
    const rbtScenario = await generateRBTScenario(narasiKasus, legalReferences, spesialisasi, language);
    console.log('[SIM] RBT scenario generated successfully');

    // Simpan hasil skenario ke database
    const tingkatKesulitan = ['dasar', 'menengah', 'lanjutan'].includes(rbtScenario.tingkat_kesulitan)
      ? rbtScenario.tingkat_kesulitan
      : 'menengah';

    await connection.execute(
      `INSERT INTO simulation_results 
       (simulation_id, skenario_rbt, tujuan_pelatihan, peralatan, langkah_langkah, evaluasi_kriteria, durasi_estimasi, tingkat_kesulitan, raw_gemini_response)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        simulationId,
        JSON.stringify(rbtScenario.skenario_rbt || {}),
        rbtScenario.tujuan_pelatihan || '',
        rbtScenario.peralatan || '',
        JSON.stringify(rbtScenario.langkah_langkah || []),
        JSON.stringify(rbtScenario.evaluasi_kriteria || []),
        rbtScenario.durasi_estimasi || '',
        tingkatKesulitan,
        // raw_gemini_response adalah kolom JSON — harus disimpan sebagai JSON string yang valid
        JSON.stringify(rbtScenario.rawGeminiResponse || ''),
      ]
    );

    // ----- STEP 5: Update status simulasi ke 'completed' -----
    await connection.execute(
      `UPDATE simulations SET status = 'completed' WHERE id = ?`,
      [simulationId]
    );

    // Commit transaction
    await connection.commit();
    console.log(`[SIM] Simulation ${simulationId} completed successfully`);

    // ----- STEP 6: Return respons lengkap -----
    return {
      simulationId,
      judul,
      spesialisasi,
      keywords,
      categories,
      legalReferences,
      rbtScenario: {
        skenario_rbt: rbtScenario.skenario_rbt,
        tujuan_pelatihan: rbtScenario.tujuan_pelatihan,
        peralatan: rbtScenario.peralatan,
        langkah_langkah: rbtScenario.langkah_langkah,
        evaluasi_kriteria: rbtScenario.evaluasi_kriteria,
        durasi_estimasi: rbtScenario.durasi_estimasi,
        tingkat_kesulitan: rbtScenario.tingkat_kesulitan || tingkatKesulitan,
      },
      status: 'completed',
    };

  } catch (error) {
    // Rollback jika terjadi error
    await connection.rollback();
    console.error(`[SIM] Simulation failed ERROR:`, error);

    // Update status simulasi ke 'failed' jika record sudah dibuat
    try {
      if (simulationId) {
        await connection.execute(
          `UPDATE simulations SET status = 'failed', error_message = ? WHERE id = ?`,
          [error.message, simulationId]
        );
        console.log(`[SIM] Updated simulation ${simulationId} status to failed`);
      } else {
        await connection.execute(
          `UPDATE simulations SET status = 'failed', error_message = ? WHERE user_id = ? AND judul = ? AND status = 'processing'`,
          [error.message, userId, judul]
        );
      }
    } catch (updateError) {
      console.error('[SIM] Failed to update simulation status:', updateError.message);
    }

    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Ambil riwayat simulasi berdasarkan user
 * @param {number} userId - ID user
 * @param {number} page - Halaman (default: 1)
 * @param {number} limit - Jumlah per halaman (default: 10)
 * @param {string} spesialisasi - Filter spesialisasi (opsional)
 * @returns {object} { data, total, page, totalPages }
 */
async function getSimulationHistory(userId, page = 1, limit = 10, spesialisasi = null) {
  let countQuery = 'SELECT COUNT(*) as total FROM simulations WHERE user_id = ?';
  let dataQuery = `
    SELECT s.*, sr.skenario_rbt, sr.tujuan_pelatihan, sr.durasi_estimasi, sr.tingkat_kesulitan
    FROM simulations s
    LEFT JOIN simulation_results sr ON s.id = sr.simulation_id
    WHERE s.user_id = ?
  `;
  const params = [userId];

  if (spesialisasi) {
    countQuery += ' AND spesialisasi = ?';
    dataQuery += ' AND s.spesialisasi = ?';
    params.push(spesialisasi);
  }

  dataQuery += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';

  const offset = (page - 1) * limit;

  const [countResult] = await pool.execute(countQuery, spesialisasi ? [userId, spesialisasi] : [userId]);
  const total = countResult[0].total;

  const [rows] = await pool.execute(dataQuery, [...params, String(limit), String(offset)]);

  return {
    data: rows,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Ambil detail simulasi berdasarkan ID
 * Terjemahan EN di-cache ke DB — Gemini hanya dipanggil sekali per simulasi.
 * @param {number} simulationId - ID simulasi
 * @param {number} userId - ID user (untuk validasi ownership)
 * @param {string} [language='id'] - Target language
 * @returns {object|null} Detail simulasi lengkap
 */
async function getSimulationDetail(simulationId, userId, language = 'id') {
  const [simRows] = await pool.execute(
    'SELECT * FROM simulations WHERE id = ? AND user_id = ?',
    [simulationId, userId]
  );

  if (simRows.length === 0) {
    return null;
  }

  const simulation = simRows[0];

  const [legalRows] = await pool.execute(
    'SELECT * FROM legal_references WHERE simulation_id = ?',
    [simulationId]
  );

  const [resultRows] = await pool.execute(
    'SELECT * FROM simulation_results WHERE simulation_id = ?',
    [simulationId]
  );

  const fullData = {
    ...simulation,
    legalReferences: legalRows,
    result: resultRows[0] || null,
  };

  // ─── If Indonesian (original) → return as-is ────────────────────────────
  if (language === 'id') {
    return fullData;
  }

  // ─── English requested: check DB cache first ────────────────────────────
  const hasCachedEN = (
    simulation.judul_en &&
    simulation.judul_en.trim() !== '' &&
    resultRows[0]?.result_en
  );

  if (hasCachedEN) {
    // ✅ Serve from cache — instant, no AI call
    console.log(`[SIM] ✅ EN cache hit for simulation ${simulationId} — serving from DB`);

    // Parse cached result_en
    let cachedResult = resultRows[0].result_en;
    if (typeof cachedResult === 'string') {
      try { cachedResult = JSON.parse(cachedResult); } catch (e) { cachedResult = null; }
    }

    // Parse cached legal references
    let cachedLegal = simulation.legal_references_en;
    if (typeof cachedLegal === 'string') {
      try { cachedLegal = JSON.parse(cachedLegal); } catch (e) { cachedLegal = null; }
    }

    // Parse cached kata_kunci_en
    let cachedKataKunci = simulation.kata_kunci_en;
    if (typeof cachedKataKunci === 'string') {
      try { cachedKataKunci = JSON.parse(cachedKataKunci); } catch (e) { cachedKataKunci = null; }
    }

    return {
      ...fullData,
      judul: simulation.judul_en || fullData.judul,
      narasi_kasus: simulation.narasi_kasus_en || fullData.narasi_kasus,
      kata_kunci: cachedKataKunci || fullData.kata_kunci,
      legalReferences: cachedLegal
        ? fullData.legalReferences.map((ref, idx) => ({
            ...ref,
            ...(cachedLegal[idx] || {}),
          }))
        : fullData.legalReferences,
      result: cachedResult
        ? { ...fullData.result, ...cachedResult }
        : fullData.result,
    };
  }

  // ─── EN cache miss: call Gemini ONCE, save to DB ────────────────────────
  console.log(`[SIM] 🔄 EN cache miss for simulation ${simulationId} — translating via Gemini...`);
  try {
    const { translateSimulationData } = require('./gemini.service');
    const translated = await translateSimulationData(fullData, 'en');

    // Build partial result_en object from translated.result
    const resultEn = translated.result ? {
      skenario_rbt:      translated.result.skenario_rbt      || null,
      tujuan_pelatihan:  translated.result.tujuan_pelatihan   || null,
      peralatan:         translated.result.peralatan          || null,
      langkah_langkah:   translated.result.langkah_langkah   || null,
      evaluasi_kriteria: translated.result.evaluasi_kriteria  || null,
      durasi_estimasi:   translated.result.durasi_estimasi    || null,
      tingkat_kesulitan: translated.result.tingkat_kesulitan  || null,
    } : null;

    // Save translation cache to DB
    await pool.execute(
      `UPDATE simulations
       SET judul_en = ?, narasi_kasus_en = ?, kata_kunci_en = ?, legal_references_en = ?
       WHERE id = ?`,
      [
        translated.judul || fullData.judul,
        translated.narasi_kasus || fullData.narasi_kasus,
        JSON.stringify(translated.kata_kunci || fullData.kata_kunci),
        JSON.stringify(translated.legalReferences || []),
        simulationId,
      ]
    );

    if (resultEn) {
      await pool.execute(
        `UPDATE simulation_results SET result_en = ? WHERE simulation_id = ?`,
        [JSON.stringify(resultEn), simulationId]
      );
    }

    console.log(`[SIM] ✅ EN translation cached to DB for simulation ${simulationId}`);

    // Return translated data immediately
    return {
      ...fullData,
      judul: translated.judul || fullData.judul,
      narasi_kasus: translated.narasi_kasus || fullData.narasi_kasus,
      kata_kunci: translated.kata_kunci || fullData.kata_kunci,
      legalReferences: (translated.legalReferences && Array.isArray(translated.legalReferences))
        ? fullData.legalReferences.map((ref, idx) => ({
            ...ref,
            ...(translated.legalReferences[idx] || {}),
          }))
        : fullData.legalReferences,
      result: resultEn
        ? { ...fullData.result, ...resultEn }
        : fullData.result,
    };

  } catch (transErr) {
    console.error('[SIM] ❌ Translation failed, returning original:', transErr.message);
    return fullData; // Graceful fallback: return original Indonesian data
  }
}

/**
 * Ambil statistik jumlah simulasi (total, completed, processing)
 * @param {number} userId - ID user
 * @returns {object} Statistik simulasi
 */
async function getSimulationStats(userId) {
  const [rows] = await pool.execute(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing
     FROM simulations WHERE user_id = ?`,
    [userId]
  );
  
  if (rows.length === 0) return { total: 0, completed: 0, processing: 0 };
  
  return {
    total: Number(rows[0].total) || 0,
    completed: Number(rows[0].completed) || 0,
    processing: Number(rows[0].processing) || 0,
  };
}

/**
 * Simpan hasil evaluasi simulasi RBT
 */
async function saveEvaluation(simulationId, userId, payload) {
  // Verifikasi ownership
  const [simRows] = await pool.execute(
    'SELECT * FROM simulations WHERE id = ? AND user_id = ?',
    [simulationId, userId]
  );

  if (simRows.length === 0) {
    throw new Error('Simulasi tidak ditemukan atau bukan milik Anda.');
  }

  const { skor_akhir, penilaian_tambahan, evaluasi_mandiri, checked_evaluations } = payload;
  
  await pool.execute(
    `UPDATE simulation_results 
     SET skor_akhir = ?, penilaian_tambahan = ?, evaluasi_mandiri = ?, checked_evaluations = ?
     WHERE simulation_id = ?`,
    [
      skor_akhir || 0,
      penilaian_tambahan || 0, 
      evaluasi_mandiri || '', 
      JSON.stringify(checked_evaluations || {}),
      simulationId
    ]
  );
  
  return true;
}

/**
 * Ambil referensi hukum terbaru yang ditemukan di semua simulasi user
 * @param {number} userId - ID user
 * @param {number} limit - Jumlah limit
 */
async function getRecentLegalReferences(userId, limit = 5) {
  const [rows] = await pool.execute(
    `SELECT lr.*, s.judul as simulasi_judul, s.created_at
     FROM legal_references lr
     JOIN simulations s ON lr.simulation_id = s.id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC
     LIMIT ?`,
    [userId, String(limit)]
  );
  return rows;
}

module.exports = { 
  processSimulation, 
  getSimulationHistory, 
  getSimulationDetail, 
  getSimulationStats, 
  saveEvaluation,
  getRecentLegalReferences
};
