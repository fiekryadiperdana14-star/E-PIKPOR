/**
 * Simulation Controller
 * Handle pembuatan dan riwayat simulasi RBT
 */
const { processSimulation, getSimulationHistory, getSimulationDetail, getSimulationStats: getSimulationStatsService, saveEvaluation, getRecentLegalReferences } = require('../services/simulation.service');

/**
 * POST /api/simulations
 * Membuat simulasi RBT baru
 * Body: { judul: string, narasiKasus: string, spesialisasi: string }
 * 
 * Flow berantai (chain):
 * 1. Terima input dari client
 * 2. Ekstrak kata kunci
 * 3. Fetch ke Pasal.id API
 * 4. Fetch ke Gemini AI API
 * 5. Simpan ke MySQL
 * 6. Return respons
 */
async function createSimulation(req, res, next) {
  try {
    const { judul, narasiKasus, spesialisasi, language } = req.body;
    const userId = req.user.userId;
    const lang = (language === 'en') ? 'en' : 'id'; // Sanitize: only 'id' or 'en'

    // Validasi input
    if (!judul || !narasiKasus || !spesialisasi) {
      return res.status(400).json({
        success: false,
        message: 'Judul, narasi kasus, dan spesialisasi wajib diisi.',
      });
    }

    const validSpesialisasi = ['sabhara', 'reserse', 'intel', 'lantas', 'binmas'];
    if (!validSpesialisasi.includes(spesialisasi)) {
      return res.status(400).json({
        success: false,
        message: `Spesialisasi tidak valid. Pilihan: ${validSpesialisasi.join(', ')}`,
      });
    }

    if (narasiKasus.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Narasi kasus terlalu pendek. Minimal 20 karakter.',
      });
    }

    // Jalankan proses simulasi chain (Pasal.id -> Gemini -> MySQL)
    console.log(`[CTRL] Starting simulation for user ${userId}: "${judul}" [lang: ${lang}]`);
    const result = await processSimulation(userId, judul, narasiKasus, spesialisasi, lang);

    return res.status(201).json({
      success: true,
      message: 'Simulasi RBT berhasil dibuat.',
      data: result,
    });

  } catch (error) {
    console.error('[CTRL] Simulation creation failed:', error.message);
    next(error);
  }
}

/**
 * GET /api/simulations
 * Ambil riwayat simulasi user
 * Query: ?page=1&limit=10&spesialisasi=reskrim
 */
async function listSimulations(req, res, next) {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const spesialisasi = req.query.spesialisasi || null;

    const result = await getSimulationHistory(userId, page, limit, spesialisasi);

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/simulations/:id
 * Ambil detail simulasi lengkap
 */
async function getSimulation(req, res, next) {
  try {
    const simulationId = parseInt(req.params.id);
    const userId = req.user.userId;
    const lang = req.query.lang || 'id';

    if (!simulationId) {
      return res.status(400).json({
        success: false,
        message: 'ID simulasi tidak valid.',
      });
    }

    const simulation = await getSimulationDetail(simulationId, userId, lang);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulasi tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: simulation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/simulations/stats
 * Ambil statistik dashboard simulasi
 */
async function getSimulationStats(req, res, next) {
  try {
    const userId = req.user.userId;
    const stats = await getSimulationStatsService(userId);
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/simulations/:id/evaluate
 * Menyimpan hasil evaluasi mandiri simulasi RBT
 */
async function evaluateSimulation(req, res, next) {
  try {
    const simulationId = parseInt(req.params.id);
    const userId = req.user.userId;

    if (!simulationId) {
      return res.status(400).json({
        success: false,
        message: 'ID simulasi tidak valid.',
      });
    }
    
    await saveEvaluation(simulationId, userId, req.body);
    
    return res.status(200).json({
      success: true,
      message: 'Evaluasi berhasil disimpan',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/simulations/legal-references
 * Ambil referensi hukum terbaru yang pernah ditemukan dari Pasal.id
 */
async function getLegalReferences(req, res, next) {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await getRecentLegalReferences(userId, limit);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/simulations/test-pasal
 * Test integrasi Pasal.id API secara langsung (Direct Call)
 */
async function testPasalIntegration(req, res, next) {
  try {
    const query = req.query.q || 'pencurian';
    const { searchLegalArticles } = require('../services/pasal.service');
    
    console.log(`[TEST] Testing Pasal.id integration with query: "${query}"`);
    const results = await searchLegalArticles(query, 'Ini adalah simulasi test untuk verifikasi API.');
    
    return res.status(200).json({
      success: true,
      query,
      results_count: results.length,
      data: results
    });
  } catch (error) {
    console.error('[TEST] Pasal.id integration test failed:', error.message);
    next(error);
  }
}

module.exports = { 
  createSimulation, 
  listSimulations, 
  getSimulation, 
  getSimulationStats, 
  evaluateSimulation,
  getLegalReferences,
  testPasalIntegration
};
