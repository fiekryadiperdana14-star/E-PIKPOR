/**
 * Keyword Extractor Utility
 * Mengekstrak kata kunci hukum dari narasi teks Bahasa Indonesia
 */

/**
 * Kamus kata kunci hukum berdasarkan kategori tindak pidana
 */
const LEGAL_KEYWORDS = {
  kecelakaan: ['kecelakaan', 'laka', 'tabrakan', 'tabrak lari', 'korban meninggal', 'luka berat', 'luka ringan'],
  mabuk: ['mabuk', 'alkohol', 'minuman keras', 'miras', 'narkotika', 'narkoba', 'obat terlarang', 'psikotropika'],
  pencurian: ['curi', 'pencurian', 'merampas', 'mengambil', 'mencuri', 'maling'],
  pembunuhan: ['bunuh', 'pembunuhan', 'membunuh', 'menganiaya', 'penganiayaan', 'pembunuhan berencana'],
  penipuan: ['tipu', 'penipuan', 'menipu', 'penggelapan', 'menggelapkan', 'fraud'],
  pengrusakan: ['rusak', 'merusak', 'pengrusakan', 'membakar', 'pembakaran'],
  kekerasan: ['kekerasan', 'pukul', 'memukul', 'menghajar', 'menyerang', 'serangan', 'KDRT'],
  senjata: ['senjata', 'senjata api', 'senpi', 'sajam', 'senjata tajam', 'bom', 'peledak'],
  terorisme: ['teror', 'terorisme', 'teroris', 'radikal', 'radikalisme', 'bom bunuh diri'],
  korupsi: ['korupsi', 'suap', 'gratifikasi', 'pencucian uang', 'money laundering'],
  narkotika: ['narkotika', 'narkoba', 'ganja', 'sabu', 'ekstasi', 'heroin', 'kokain', 'bandar narkoba'],
  lalu_lintas: ['lalu lintas', 'melanggar rambu', 'SIM', 'STNK', 'ugal-ugalan', 'balap liar', 'kebut-kebutan'],
  seksual: ['perkosaan', 'pelecehan', 'pencabulan', 'kesusilaan', 'asusila'],
  cyber: ['hacking', 'peretasan', 'cyber', 'online', 'digital', 'media sosial', 'hoax', 'ujaran kebencian'],
};

/**
 * Stopwords Bahasa Indonesia (kata yang diabaikan)
 */
const STOPWORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'ini', 'itu', 'dengan', 'untuk', 'pada',
  'adalah', 'sebagai', 'dalam', 'tidak', 'akan', 'tetapi', 'juga', 'sudah',
  'telah', 'oleh', 'karena', 'sehingga', 'namun', 'atau', 'saat', 'ketika',
  'setelah', 'sebelum', 'agar', 'supaya', 'maka', 'lalu', 'kemudian',
  'dapat', 'bisa', 'harus', 'perlu', 'ada', 'ia', 'dia', 'mereka', 'kami',
  'kita', 'saya', 'anda', 'tersebut', 'bahwa', 'seperti', 'hingga', 'antara',
  'sang', 'si', 'para', 'se', 'seorang', 'satu', 'dua', 'tiga',
  'hari', 'tanggal', 'bulan', 'tahun', 'pukul', 'wib', 'wit', 'wita', 'terjadi', 'terdapat',
  'adanya', 'melaporkan', 'laporan', 'kejadian', 'sekira', 'lokasi', 'tempat', 'tkp',
]);

/**
 * Ekstrak kata kunci dari narasi teks
 * @param {string} text - Narasi kasus
 * @returns {object} { keywords: string[], categories: string[], searchQuery: string }
 */
function extractKeywords(text) {
  if (!text || typeof text !== 'string') {
    return { keywords: [], categories: [], searchQuery: '' };
  }

  const normalizedText = text.toLowerCase().trim();
  const foundKeywords = [];
  const foundCategories = new Set();

  // Cari kata kunci yang cocok dari kamus
  for (const [category, keywords] of Object.entries(LEGAL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
        foundCategories.add(category);
      }
    }
  }

  // Ekstrak kata-kata penting lainnya (bukan stopword, panjang > 3 karakter)
  const words = normalizedText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !STOPWORDS.has(word));

  // Hapus duplikat dan gabungkan
  const uniqueKeywords = [...new Set([...foundKeywords, ...words.slice(0, 10)])];

  // Buat search query untuk Pasal.id
  const searchQuery = foundKeywords.length > 0
    ? foundKeywords.slice(0, 5).join(' ')
    : words.slice(0, 5).join(' ');

  return {
    keywords: uniqueKeywords,
    categories: [...foundCategories],
    searchQuery: searchQuery,
  };
}

module.exports = { extractKeywords, LEGAL_KEYWORDS };
