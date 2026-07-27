import { Injectable, signal, computed } from '@angular/core';

export type LanguageCode = 'id' | 'en';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private currentLangSignal = signal<LanguageCode>('id');
  readonly currentLang = this.currentLangSignal.asReadonly();

  constructor() {
    this.loadStoredLang();
  }

  private loadStoredLang(): void {
    const stored = localStorage.getItem('rbt_language') as LanguageCode;
    if (stored === 'id' || stored === 'en') {
      this.currentLangSignal.set(stored);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language || '';
      if (browserLang.toLowerCase().startsWith('en')) {
        this.currentLangSignal.set('en');
      } else {
        this.currentLangSignal.set('id');
      }
    }
  }

  setLanguage(lang: LanguageCode): void {
    this.currentLangSignal.set(lang);
    localStorage.setItem('rbt_language', lang);
  }

  toggleLanguage(): void {
    const newLang = this.currentLangSignal() === 'id' ? 'en' : 'id';
    this.setLanguage(newLang);
  }

  // Dictionary of translations
  private dictionary: Record<LanguageCode, Record<string, string>> = {
    id: {
      // Navbar & General
      'nav.brand.title': 'RBT Simulation',
      'nav.brand.accent': 'SPN Polda Sumut',
      'nav.logout': 'Keluar',
      'nav.btn.dashboard': 'Buka Dashboard',
      'nav.btn.login': 'Masuk ke Sistem',

      // Sidebar
      'sidebar.menu': 'MENU UTAMA',
      'sidebar.dashboard': 'Dashboard',
      'sidebar.simulation': 'Simulasi Baru',
      'sidebar.history': 'Riwayat',
      'sidebar.specializations': 'SPESIALISASI',
      'sidebar.language': 'Bahasa',

      // Landing Hero
      'landing.hero.badge': 'Platform Simulasi RBT Berbasis Kecerdasan Buatan (AI)',
      'landing.hero.title1': 'Membentuk Personil Polri Presisi &',
      'landing.hero.title2': 'Taktis',
      'landing.hero.description': 'Reality-Based Training (RBT) Simulation dirancang khusus untuk melatih siswa dan personil SPN Polda Sumatera Utara dalam menganalisis kasus, menerapkan pasal hukum secara tepat, dan mengambil keputusan taktis yang aman di lapangan.',
      'landing.hero.btn.start': 'Mulai Sekarang',
      'landing.hero.btn.features': 'Pelajari Fitur',
      'landing.hero.emblem.title': 'POLDA SUMATERA UTARA',
      'landing.hero.emblem.subtitle': 'SEKOLAH POLISI NEGARA',

      // Landing Features (5 Fungsi)
      'landing.features.title': '5 Fungsi Teknis Kepolisian',
      'landing.features.subtitle': 'Simulasi dirancang berdasarkan modul Prolat 5 Fungsi Teknis Kepolisian untuk melatih spesialisasi di lapangan.',
      
      'landing.features.sabhara.title': 'Sabhara',
      'landing.features.sabhara.desc': 'Simulasi tindakan pencegahan preventif, penyelamatan, ketertiban umum, pengamanan unjuk rasa, serta pengendalian massa.',
      
      'landing.features.reserse.title': 'Reserse',
      'landing.features.reserse.desc': 'Menguji ketepatan penerapan pasal KUHP, penyusunan berkas perkara, dan analisis skenario penyelidikan/penyidikan tindak pidana kriminal.',
      
      'landing.features.intel.title': 'Intelijen Keamanan',
      'landing.features.intel.desc': 'Deteksi dini, analisis potensi ancaman dan gangguan keamanan, serta pengambilan keputusan strategis intelijen.',
      
      'landing.features.lantas.title': 'Lalu Lintas',
      'landing.features.lantas.desc': 'Simulasi penanganan TKP kecelakaan lalu lintas, pengaturan jalan, serta penegakan hukum pelanggaran berkendara secara aman.',
      
      'landing.features.binmas.title': 'Pembinaan Masyarakat',
      'landing.features.binmas.desc': 'Melatih teknik mediasi perselisihan warga, problem solving sosial, komunikasi persuasif, dan pemolisian komunitas.',

      // Landing Flow
      'landing.flow.title': 'Alur Pelatihan Simulasi',
      'landing.flow.subtitle': 'Bagaimana platform RBT membantu meningkatkan kompetensi hukum dan taktis.',
      'landing.flow.step1.num': '01',
      'landing.flow.step1.title': 'Pilih Fungsi',
      'landing.flow.step1.desc': 'Pilih salah satu fungsi teknis kepolisian yang ingin disimulasikan sesuai dengan modul pelatihan.',
      'landing.flow.step2.num': '02',
      'landing.flow.step2.title': 'Analisis Skenario',
      'landing.flow.step2.desc': 'AI akan membangkitkan skenario kasus unik yang realistis lengkap dengan detail kejadian di lapangan.',
      'landing.flow.step3.num': '03',
      'landing.flow.step3.title': 'Tindakan & Pasal',
      'landing.flow.step3.desc': 'Tentukan tindakan taktis kepolisian yang aman dan pilih pasal-pasal hukum yang paling tepat untuk kasus tersebut.',
      'landing.flow.step4.num': '04',
      'landing.flow.step4.title': 'Evaluasi Instan',
      'landing.flow.step4.desc': 'Sistem AI akan memberikan skor kelayakan tindakan, koreksi pasal hukum, serta ulasan mendalam untuk evaluasi.',

      // Landing Footer
      'landing.footer.text': '© 2026 RBT Simulation — Sekolah Polisi Negara (SPN) Polda Sumatera Utara.',
      'landing.footer.sub': 'Dirancang untuk kebutuhan pendidikan dan pelatihan internal Kepolisian Republik Indonesia.',

      // Login Card
      'login.title': 'RBT Simulation',
      'login.subtitle': 'SPN Polda Sumatera Utara',
      'login.card.title': 'Masuk ke Sistem',
      'login.card.subtitle': 'Gunakan akun Google resmi untuk mengakses platform simulasi RBT',
      'login.card.dev_divider': 'atau untuk testing',
      'login.card.dev_btn': 'Masuk sebagai Demo (Dev Mode)',
      'login.card.restricted': 'Akses terbatas untuk Gadik dan peserta Prolat',
      'login.feature.ai': 'Analisis Hukum AI',
      'login.feature.rbt': 'Skenario RBT',
      'login.feature.law': 'Basis Pasal Hukum',

      // Simulation Input Page
      'sim.input.title': 'Buat Simulasi RBT Baru',
      'sim.input.subtitle': 'Masukkan narasi kasus untuk menghasilkan skenario pelatihan taktis',
      'sim.input.btn.template': 'Pilih Template',
      'sim.input.label.judul': 'Judul Simulasi',
      'sim.input.label.spesialisasi': 'Unit Spesialisasi',
      'sim.input.label.narasi': 'Narasi Kasus',
      'sim.input.placeholder.judul': 'Contoh: Penanganan Kecelakaan Lalu Lintas Akibat Mabuk',
      'sim.input.select.default': 'Pilih spesialisasi...',
      'sim.input.btn.generate': 'Generate Skenario RBT',
      'sim.input.hint': 'Sistem akan menganalisis dasar hukum via Pasal.id dan menghasilkan skenario RBT via AI',
      'sim.input.error.title': 'Gagal memproses simulasi',
      'sim.input.error.default': 'Terjadi kesalahan saat memproses simulasi. Coba lagi.',
      'sim.input.modal.title': 'Pilih Template Simulasi',
      'sim.input.step1': 'Menganalisis narasi kasus...',
      'sim.input.step2': 'Mengekstrak kata kunci hukum...',
      'sim.input.step3': 'Mencari dasar hukum di Pasal.id...',
      'sim.input.step4': 'Membuat skenario RBT via Gemini AI...',
      'sim.input.step5': 'Menyimpan hasil simulasi...',

      // Simulation Result Page
      'sim.result.back': 'Kembali',
      'sim.result.tab.scenario': 'Skenario RBT',
      'sim.result.tab.legal': 'Dasar Hukum',
      'sim.result.tab.narasi': 'Narasi Kasus',
      'sim.result.label.ringkasan': 'Ringkasan Skenario',
      'sim.result.label.tujuan': 'Tujuan Pelatihan',
      'sim.result.label.peralatan': 'Peralatan yang Dibutuhkan',
      'sim.result.label.langkah': 'Langkah-Langkah Simulasi',
      'sim.result.label.evaluasi': 'Kriteria Evaluasi',
      'sim.result.label.narasi': 'Narasi Kasus Asli',
      'sim.result.label.keywords': 'Kata Kunci Terdeteksi',
      'sim.result.label.difficulty': 'Tingkat Kesulitan',
      'sim.result.label.loading': 'Memuat detail simulasi...',
      'sim.result.empty.scenario': 'Hasil skenario RBT belum tersedia.',
      'sim.result.empty.legal': 'Referensi hukum tidak ditemukan.',
      'sim.result.not.found': 'Simulasi tidak ditemukan',
      'sim.result.not.found.desc': 'Data simulasi tidak tersedia atau Anda tidak memiliki akses.',
      'sim.result.back.dashboard': 'Kembali ke Dashboard',
      'sim.result.legal.desc': 'Deskripsi & Analisis',
      'sim.result.legal.penalty': 'Ancaman Pidana',
      'sim.result.eval.extra': 'Penilaian Tambahan (0-100)',
      'sim.result.eval.self': 'Evaluasi Mandiri',
      'sim.result.eval.placeholder': 'Masukkan evaluasi...',
      'sim.result.eval.progress': 'Total Progress:',
      'sim.result.eval.save': 'Simpan Evaluasi',
      'sim.result.eval.saving': 'Menyimpan...',
      'sim.result.eval.score.title': 'Nilai Hasil Simulasi RBT',
      'sim.result.eval.extra.label': 'Penilaian Tambahan:',
      'sim.result.eval.self.label': 'Evaluasi Mandiri:',
      'sim.result.difficulty.dasar': 'DASAR',
      'sim.result.difficulty.menengah': 'MENENGAH',
      'sim.result.difficulty.lanjutan': 'LANJUTAN',

      // Dashboard Page
      'dash.welcome': 'Selamat Datang, {{name}}!',
      'dash.subtitle': 'Panel kontrol simulasi Reality-Based Training — SPN Polda Sumatera Utara',
      'dash.btn.new': 'Simulasi Baru',
      'dash.stat.total': 'Total Simulasi',
      'dash.stat.completed': 'Selesai',
      'dash.stat.processing': 'Diproses',
      'dash.spec.title': 'Prolat 5 Fungsi Teknis - Spesialisasi',
      'dash.spec.subtitle': 'Pilih unit spesialisasi untuk memulai simulasi RBT',
      'dash.spec.sabhara.title': 'Sabhara',
      'dash.spec.sabhara.desc': 'Samapta Bhayangkara — Penyelamatan & ketertiban umum',
      'dash.spec.reserse.title': 'Reserse',
      'dash.spec.reserse.desc': 'Kriminal — Penyelidikan & penyidikan tindak pidana',
      'dash.spec.intel.title': 'Intel',
      'dash.spec.intel.desc': 'Intelijen Keamanan — Deteksi dini & analisis potensi gangguan',
      'dash.spec.lantas.title': 'Lalu Lintas',
      'dash.spec.lantas.desc': 'Keamanan & Keselamatan — Tertib & lancar lalu lintas',
      'dash.spec.binmas.title': 'Binmas',
      'dash.spec.binmas.desc': 'Pembinaan Masyarakat — Mediasi Warga & komunitas',
      'dash.recent.title': 'Simulasi Terbaru',
      'dash.recent.all': 'Lihat Semua',
      'dash.legal.title': 'Rujukan Hukum Terbaru',
      'dash.legal.empty': 'Belum ada rujukan hukum yang terdeteksi dari simulasi.',

      // History Page
      'history.title': 'Riwayat Simulasi',
      'history.subtitle': 'Daftar semua simulasi RBT yang pernah dibuat',
      'history.btn.new': 'Simulasi Baru',
      'history.filter.spec': 'Spesialisasi',
      'history.filter.all': 'Semua',
      'history.table.title': 'Judul Simulasi',
      'history.table.spec': 'Spesialisasi',
      'history.table.status': 'Status',
      'history.table.level': 'Tingkat',
      'history.table.date': 'Tanggal',
      'history.table.action': 'Aksi',
      'history.btn.view': 'Lihat',
      'history.pagination.prev': '← Sebelumnya',
      'history.pagination.next': 'Selanjutnya →',
      'history.pagination.info': 'Halaman {{page}} dari {{total}}',
      'history.status.completed': 'Selesai',
      'history.status.processing': 'Diproses',
      'history.status.failed': 'Gagal',
      'history.empty.title': 'Belum ada simulasi',
      'history.empty.desc': 'Buat simulasi RBT pertama Anda untuk mulai berlatih.',
      'history.empty.btn': 'Mulai Simulasi',
    },
    en: {
      // Navbar & General
      'nav.brand.title': 'RBT Simulation',
      'nav.brand.accent': 'SPN Polda Sumut',
      'nav.logout': 'Sign Out',
      'nav.btn.dashboard': 'Dashboard',
      'nav.btn.login': 'Sign In',

      // Sidebar
      'sidebar.menu': 'MAIN MENU',
      'sidebar.dashboard': 'Dashboard',
      'sidebar.simulation': 'New Simulation',
      'sidebar.history': 'History',
      'sidebar.specializations': 'SPECIALIZATIONS',
      'sidebar.language': 'Language',

      // Landing Hero
      'landing.hero.badge': 'AI-Powered RBT Simulation Platform',
      'landing.hero.title1': 'Shaping Precise &',
      'landing.hero.title2': 'Tactical Police',
      'landing.hero.description': 'Reality-Based Training (RBT) Simulation is specifically designed to train students and personnel of SPN Polda North Sumatra in analyzing cases, applying legal articles accurately, and making safe tactical decisions in the field.',
      'landing.hero.btn.start': 'Get Started',
      'landing.hero.btn.features': 'Explore Features',
      'landing.hero.emblem.title': 'NORTH SUMATRA REGIONAL POLICE',
      'landing.hero.emblem.subtitle': 'STATE POLICE ACADEMY',

      // Landing Features (5 Fungsi)
      'landing.features.title': '5 Technical Police Functions',
      'landing.features.subtitle': 'Simulations designed based on Prolat modules of the 5 Technical Police Functions to train field specializations.',
      
      'landing.features.sabhara.title': 'Sabhara (Public Order)',
      'landing.features.sabhara.desc': 'Simulation of preventive actions, rescue, public order, protest management, and crowd control.',
      
      'landing.features.reserse.title': 'Reserse (Criminal Investigation)',
      'landing.features.reserse.desc': 'Testing the accuracy of applying criminal law codes, drafting investigation case files, and analyzing criminal scenario investigations.',
      
      'landing.features.intel.title': 'Security Intelligence',
      'landing.features.intel.desc': 'Early detection, threat and security disruption potential analysis, and strategic intelligence decision making.',
      
      'landing.features.lantas.title': 'Traffic Patrol',
      'landing.features.lantas.desc': 'Simulation of traffic accident scene management, traffic control, and safe law enforcement of traffic violations.',
      
      'landing.features.binmas.title': 'Community Policing',
      'landing.features.binmas.desc': 'Training citizen dispute mediation techniques, social problem solving, persuasive communication, and community policing.',

      // Landing Flow
      'landing.flow.title': 'Simulation Training Workflow',
      'landing.flow.subtitle': 'How the RBT platform helps improve legal competence and tactical skills.',
      'landing.flow.step1.num': '01',
      'landing.flow.step1.title': 'Select Function',
      'landing.flow.step1.desc': 'Select one of the technical policing functions you want to simulate according to the training module.',
      'landing.flow.step2.num': '02',
      'landing.flow.step2.title': 'Analyze Scenario',
      'landing.flow.step2.desc': 'AI will generate a unique, realistic case scenario complete with field incident details.',
      'landing.flow.step3.num': '03',
      'landing.flow.step3.title': 'Action & Article',
      'landing.flow.step3.desc': 'Determine safe tactical police action and choose the most appropriate legal articles for the case.',
      'landing.flow.step4.num': '04',
      'landing.flow.step4.title': 'Instant Evaluation',
      'landing.flow.step4.desc': 'The AI system will provide action feasibility scores, legal article corrections, and detailed feedback reviews.',

      // Landing Footer
      'landing.footer.text': '© 2026 RBT Simulation — Sekolah Polisi Negara (SPN) Polda Sumatera Utara.',
      'landing.footer.sub': 'Designed for the education and training needs of the Indonesian National Police.',

      // Login Card
      'login.title': 'RBT Simulation',
      'login.subtitle': 'SPN Polda North Sumatra',
      'login.card.title': 'Sign In to System',
      'login.card.subtitle': 'Use your official Google account to access the RBT simulation platform',
      'login.card.dev_divider': 'or for testing',
      'login.card.dev_btn': 'Sign in as Demo (Dev Mode)',
      'login.card.restricted': 'Restricted access for instructors and Prolat participants',
      'login.feature.ai': 'AI Legal Analysis',
      'login.feature.rbt': 'RBT Scenarios',
      'login.feature.law': 'Legal Articles Base',

      // Simulation Input Page
      'sim.input.title': 'Create New RBT Simulation',
      'sim.input.subtitle': 'Enter a case narrative to generate a tactical training scenario',
      'sim.input.btn.template': 'Choose Template',
      'sim.input.label.judul': 'Simulation Title',
      'sim.input.label.spesialisasi': 'Specialization Unit',
      'sim.input.label.narasi': 'Case Narrative',
      'sim.input.placeholder.judul': 'Example: Handling a Traffic Accident Due to DUI',
      'sim.input.select.default': 'Select specialization...',
      'sim.input.btn.generate': 'Generate RBT Scenario',
      'sim.input.hint': 'The system will analyze legal references via Pasal.id and generate an RBT scenario via AI',
      'sim.input.error.title': 'Failed to process simulation',
      'sim.input.error.default': 'An error occurred while processing the simulation. Please try again.',
      'sim.input.modal.title': 'Choose a Simulation Template',
      'sim.input.step1': 'Analyzing case narrative...',
      'sim.input.step2': 'Extracting legal keywords...',
      'sim.input.step3': 'Searching legal references on Pasal.id...',
      'sim.input.step4': 'Generating RBT scenario via Gemini AI...',
      'sim.input.step5': 'Saving simulation results...',

      // Simulation Result Page
      'sim.result.back': 'Back',
      'sim.result.tab.scenario': 'RBT Scenario',
      'sim.result.tab.legal': 'Legal Basis',
      'sim.result.tab.narasi': 'Case Narrative',
      'sim.result.label.ringkasan': 'Scenario Summary',
      'sim.result.label.tujuan': 'Training Objectives',
      'sim.result.label.peralatan': 'Required Equipment',
      'sim.result.label.langkah': 'Simulation Steps',
      'sim.result.label.evaluasi': 'Evaluation Criteria',
      'sim.result.label.narasi': 'Original Case Narrative',
      'sim.result.label.keywords': 'Detected Keywords',
      'sim.result.label.difficulty': 'Difficulty Level',
      'sim.result.label.loading': 'Loading simulation details...',
      'sim.result.empty.scenario': 'RBT scenario results are not yet available.',
      'sim.result.empty.legal': 'Legal references not found.',
      'sim.result.not.found': 'Simulation not found',
      'sim.result.not.found.desc': 'Simulation data is unavailable or you do not have access.',
      'sim.result.back.dashboard': 'Back to Dashboard',
      'sim.result.legal.desc': 'Description & Analysis',
      'sim.result.legal.penalty': 'Criminal Penalty',
      'sim.result.eval.extra': 'Additional Assessment (0-100)',
      'sim.result.eval.self': 'Self-Evaluation',
      'sim.result.eval.placeholder': 'Enter evaluation...',
      'sim.result.eval.progress': 'Total Progress:',
      'sim.result.eval.save': 'Save Evaluation',
      'sim.result.eval.saving': 'Saving...',
      'sim.result.eval.score.title': 'RBT Simulation Score',
      'sim.result.eval.extra.label': 'Additional Assessment:',
      'sim.result.eval.self.label': 'Self-Evaluation:',
      'sim.result.difficulty.dasar': 'BASIC',
      'sim.result.difficulty.menengah': 'INTERMEDIATE',
      'sim.result.difficulty.lanjutan': 'ADVANCED',

      // Dashboard Page
      'dash.welcome': 'Welcome, {{name}}!',
      'dash.subtitle': 'Reality-Based Training Simulation Control Panel — SPN Polda North Sumatra',
      'dash.btn.new': 'New Simulation',
      'dash.stat.total': 'Total Simulations',
      'dash.stat.completed': 'Completed',
      'dash.stat.processing': 'Processing',
      'dash.spec.title': 'Prolat 5 Technical Functions - Specializations',
      'dash.spec.subtitle': 'Select a specialization unit to start the RBT simulation',
      'dash.spec.sabhara.title': 'Sabhara (Public Order)',
      'dash.spec.sabhara.desc': 'Public Order & Preventive Rescue actions',
      'dash.spec.reserse.title': 'Reserse (Investigation)',
      'dash.spec.reserse.desc': 'Criminal Investigation & Case Management',
      'dash.spec.intel.title': 'Intel (Intelligence)',
      'dash.spec.intel.desc': 'Security Intelligence — Threat analysis & early detection',
      'dash.spec.lantas.title': 'Lalu Lintas (Traffic)',
      'dash.spec.lantas.desc': 'Traffic Safety & Law Enforcement actions',
      'dash.spec.binmas.title': 'Binmas (Community)',
      'dash.spec.binmas.desc': 'Community Policing & Citizen mediation',
      'dash.recent.title': 'Recent Simulations',
      'dash.recent.all': 'View All',
      'dash.legal.title': 'Latest Legal References',
      'dash.legal.empty': 'No legal references detected from simulations yet.',

      // History Page
      'history.title': 'Simulation History',
      'history.subtitle': 'List of all generated RBT simulations',
      'history.btn.new': 'New Simulation',
      'history.filter.spec': 'Specialization',
      'history.filter.all': 'All',
      'history.table.title': 'Simulation Title',
      'history.table.spec': 'Specialization',
      'history.table.status': 'Status',
      'history.table.level': 'Level',
      'history.table.date': 'Date',
      'history.table.action': 'Action',
      'history.btn.view': 'View',
      'history.pagination.prev': '← Previous',
      'history.pagination.next': 'Next →',
      'history.pagination.info': 'Page {{page}} of {{total}}',
      'history.status.completed': 'Completed',
      'history.status.processing': 'Processing',
      'history.status.failed': 'Failed',
      'history.empty.title': 'No simulations yet',
      'history.empty.desc': 'Create your first RBT simulation to start training.',
      'history.empty.btn': 'Start Simulation',
    }
  };

  /**
   * Translate a key with optional fallback and parameter interpolation.
   */
  t(key: string, params?: Record<string, string | number>): string {
    const lang = this.currentLangSignal();
    const dictionary = this.dictionary[lang];
    let translation = key;
    
    if (dictionary && dictionary[key]) {
      translation = dictionary[key];
    } else {
      const fallback = this.dictionary['id'][key];
      if (fallback) {
        translation = fallback;
      }
    }
    
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(params[paramKey]));
      });
    }
    
    return translation;
  }
}
