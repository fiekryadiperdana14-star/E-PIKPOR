import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SimulationService } from '../../../core/services/simulation.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { SimulationInput } from '../../../shared/models/simulation.model';
import type { Spesialisasi } from '../../../shared/models/user.model';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-simulation-input',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  template: `
    <div class="page-container" id="simulation-input-page">
      <div class="page-header animate-fade-in">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">{{ languageService.t('sim.input.title') }}</h1>
            <p class="page-subtitle">{{ languageService.t('sim.input.subtitle') }}</p>
          </div>
          <button type="button" class="btn btn-secondary" (click)="showTemplateModal.set(true)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            {{ languageService.t('sim.input.btn.template') }}
          </button>
        </div>
      </div>

      @if (isProcessing()) {
        <!-- Processing State -->
        <div class="processing-overlay">
          <div class="processing-card glass-card animate-scale-in">
            <app-loading-spinner [message]="processingMessage()" />

            <div class="progress-steps">
              @for (step of processingSteps; track step.key; let i = $index) {
                <div class="progress-step" [class.active]="i <= currentStep()" [class.done]="i < currentStep()">
                  <div class="step-indicator">
                    @if (i < currentStep()) {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    } @else if (i === currentStep()) {
                      <div class="step-pulse"></div>
                    } @else {
                      <span>{{ i + 1 }}</span>
                    }
                  </div>
                  <span class="step-label">{{ languageService.t(step.key) }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Input Form -->
      <form (ngSubmit)="onSubmit()" class="sim-form animate-fade-in" style="animation-delay: 0.1s">
        <div class="form-grid">
          <!-- Judul -->
          <div class="form-group form-full">
            <label class="form-label" for="judul">{{ languageService.t('sim.input.label.judul') }}</label>
            <input
              id="judul"
              type="text"
              class="form-input"
              [(ngModel)]="judul"
              name="judul"
              [placeholder]="languageService.t('sim.input.placeholder.judul')"
              required
            />
          </div>

          <!-- Spesialisasi -->
          <div class="form-group">
            <label class="form-label" for="spesialisasi">{{ languageService.t('sim.input.label.spesialisasi') }}</label>
            <select id="spesialisasi" class="form-select" [(ngModel)]="spesialisasi" name="spesialisasi" required>
              <option value="" disabled>{{ languageService.t('sim.input.select.default') }}</option>
              <option value="sabhara">Sabhara — Samapta Bhayangkara</option>
              <option value="reserse">Reserse — Kriminal</option>
              <option value="intel">Intel — Intelijen Keamanan</option>
              <option value="lantas">Lalu Lintas — Polantas</option>
              <option value="binmas">Binmas — Pembinaan Masyarakat</option>
            </select>
          </div>

          <!-- Narasi Kasus -->
          <div class="form-group form-full">
            <label class="form-label" for="narasi">
              {{ languageService.t('sim.input.label.narasi') }}
              <span class="char-count" [class.warn]="narasiKasus.length > 2000">
                {{ narasiKasus.length }} / 3000
              </span>
            </label>
            <textarea
              id="narasi"
              class="form-textarea"
              [(ngModel)]="narasiKasus"
              name="narasiKasus"
              rows="8"
              placeholder="Tuliskan narasi kasus dunia nyata secara detail. Contoh:&#10;&#10;Pada tanggal 15 Maret 2025 pukul 23.45 WIB, telah terjadi kecelakaan lalu lintas di Jl. Raya Sudirman KM 5. Sebuah kendaraan sedan Toyota Camry bernopol B 1234 XYZ menabrak pembatas jalan dan menghantam warung pinggir jalan. Pengemudi diduga dalam keadaan mabuk karena ditemukan beberapa botol minuman keras di dalam kendaraan. Akibat kejadian tersebut, 2 orang pejalan kaki mengalami luka berat dan 1 orang korban meninggal dunia di tempat kejadian."
              required
              maxlength="3000"
            ></textarea>
          </div>
        </div>

        <!-- Submit -->
        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary btn-lg"
            [disabled]="!isFormValid() || isProcessing()"
            id="btn-generate"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
            </svg>
            {{ languageService.t('sim.input.btn.generate') }}
          </button>
          <p class="form-hint">
            {{ languageService.t('sim.input.hint') }}
          </p>
        </div>
      </form>

      @if (errorMessage()) {
        <div class="error-banner glass-card animate-fade-in" id="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <div>
            <strong>{{ languageService.t('sim.input.error.title') }}</strong>
            <p>{{ errorMessage() }}</p>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="errorMessage.set('')">Tutup</button>
        </div>
      }

      <!-- Template Modal -->
      @if (showTemplateModal()) {
        <div class="modal-overlay animate-fade-in" (click)="showTemplateModal.set(false)">
          <div class="modal-card glass-card animate-scale-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ languageService.t('sim.input.modal.title') }}</h3>
              <button class="btn-close" (click)="showTemplateModal.set(false)">×</button>
            </div>
            
            <div class="modal-body">
              <div class="template-tabs">
                @for (spec of templateCategories; track spec) {
                  <button 
                    class="tab-btn" 
                    [class.active]="selectedTemplateSpec() === spec"
                    (click)="selectedTemplateSpec.set(spec)">
                    {{ spec | titlecase }}
                  </button>
                }
              </div>

              <div class="template-list">
                @for (temp of getTemplatesBySpec(); track temp.judul) {
                  <div class="template-item" (click)="selectTemplate(temp)">
                    <div class="temp-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                    </div>
                    <div class="temp-content">
                      <h5>{{ temp.judul }}</h5>
                      <p>{{ temp.narasi | slice:0:120 }}...</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-md);
    }

    @media (max-width: 600px) {
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }
      
      .header-content .btn {
        width: 100%;
        justify-content: center;
      }
    }

    .sim-form {
      max-width: 800px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
    }

    .form-full {
      grid-column: 1 / -1;
    }

    .char-count {
      float: right;
      font-weight: 400;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .char-count.warn {
      color: var(--color-accent-gold);
    }

    .form-actions {
      margin-top: var(--spacing-xl);
    }

    .form-hint {
      margin-top: var(--spacing-sm);
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    /* Processing Overlay */
    .processing-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(10, 15, 30, 0.85);
      backdrop-filter: blur(8px);
      z-index: 500;
    }

    .processing-card {
      width: 90%;
      max-width: 480px;
      padding: var(--spacing-2xl);
      text-align: center;
    }

    .processing-card:hover {
      transform: none;
    }

    .progress-steps {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      margin-top: var(--spacing-xl);
      text-align: left;
    }

    .progress-step {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      opacity: 0.35;
      transition: all var(--transition-normal);
    }

    .progress-step.active {
      opacity: 1;
    }

    .progress-step.done {
      opacity: 0.7;
    }

    .step-indicator {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(59, 130, 246, 0.12);
      color: var(--color-accent-blue-light);
      flex-shrink: 0;
    }

    .progress-step.done .step-indicator {
      background: rgba(16, 185, 129, 0.15);
      color: var(--color-accent-green);
    }

    .step-pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-accent-blue);
      animation: pulse 1s ease-in-out infinite;
    }

    .step-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    .progress-step.active .step-label {
      color: var(--color-text-primary);
    }

    /* Error */
    .error-banner {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      margin-top: var(--spacing-lg);
      border-color: rgba(239, 68, 68, 0.3);
      color: var(--color-accent-red);
      max-width: 800px;
    }

    .error-banner:hover {
      transform: none;
    }

    .error-banner p {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      margin-top: 2px;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }
      
      .sim-form {
        max-width: 100%;
      }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-md);
    }

    .modal-card {
      width: 100%;
      max-width: 700px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      padding: 0 !important;
      overflow: hidden;
      border-radius: var(--border-radius-lg);
    }

    .modal-header {
      padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
    }

    .modal-header h3 {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      color: var(--color-text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }

    .modal-body {
      padding: var(--spacing-lg);
      overflow-y: auto;
    }

    @media (max-width: 480px) {
      .modal-body {
        padding: var(--spacing-md);
      }
    }

    .template-tabs {
      display: flex;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-lg);
      overflow-x: auto;
      padding-bottom: var(--spacing-xs);
    }

    .tab-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--color-text-secondary);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8125rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-fast);
    }

    .tab-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .tab-btn.active {
      background: var(--color-accent-blue);
      border-color: var(--color-accent-blue);
      color: white;
    }

    .template-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .template-item {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: var(--border-radius-md);
      cursor: pointer;
      transition: all var(--transition-normal);
    }

    .template-item:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(59, 130, 246, 0.3);
      transform: translateY(-2px);
    }

    .temp-icon {
      width: 40px;
      height: 40px;
      background: rgba(59, 130, 246, 0.1);
      color: var(--color-accent-blue-light);
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .temp-content h5 {
      font-size: 0.9375rem;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .temp-content p {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      line-height: 1.4;
    }
  `],
})
export class SimulationInputComponent implements OnInit {
  judul = '';
  narasiKasus = '';
  spesialisasi: Spesialisasi | '' = '';

  isProcessing = signal(false);
  currentStep = signal(0);
  processingMessage = signal('');
  errorMessage = signal('');

  showTemplateModal = signal(false);
  selectedTemplateSpec = signal<Spesialisasi>('lantas');
  templateCategories: Spesialisasi[] = ['sabhara', 'reserse', 'intel', 'lantas', 'binmas'];

  allTemplates = [
    // LANTAS
    {
      spec: 'lantas',
      judul: 'Penanganan Kecelakaan Maut Bus Pariwisata di Ciater',
      narasi: 'Pada hari Minggu, 10 Mei 2026, di jalur turunan curam Kecamatan Ciater, Kabupaten Subang, Provinsi Jawa Barat, sebuah bus pariwisata yang mengangkut rombongan pelajar mengalami rem blong dan menabrak tiga kendaraan roda empat serta belasan sepeda motor dari arah berlawanan. Akibat insiden tersebut, arus lalu lintas lumpuh total. Personel Satlantas segera tiba di lokasi untuk melakukan Tindakan Pertama di Tempat Kejadian Perkara (TPTKP). Petugas dengan sigap mengevakuasi korban yang terjepit badan bus, memberlakukan rekayasa lalu lintas contraflow darurat untuk mengurai kemacetan parah, dan langsung menggelar olah TKP menggunakan metode Traffic Accident Analysis (TAA) untuk mengamankan bukti fisik di lapangan.'
    },
    {
      spec: 'lantas',
      judul: 'Pembubaran Balap Liar dan Penutupan Jalan di Sidoarjo',
      narasi: 'Pada hari Sabtu, 18 April 2026 dini hari, di sepanjang Jalan Lingkar Timur, Kabupaten Sidoarjo, Provinsi Jawa Timur, ratusan pemuda geng motor melakukan pemblokiran jalan secara paksa untuk menggelar aksi balap liar yang sangat meresahkan warga sekitar. Merespons laporan tersebut, tim gabungan Satlantas and Sabhara melakukan pengepungan taktis dari dua ujung jalan. Mengetahui kedatangan polisi, para pelaku panik melarikan diri, bahkan beberapa di antaranya nekat menabrakkan motornya ke arah barikade petugas. Dengan tindakan tegas, petugas berhasil melumpuhkan para pelaku dan menyita puluhan unit sepeda motor bodong berknalpot brong.'
    },
    {
      spec: 'lantas',
      judul: 'Pengawalan Darurat Armada Pemadam Kebakaran di Jalur Puncak',
      narasi: 'Pada hari Jumat, 24 April 2026, di tengah padatnya arus lalu lintas libur panjang di Jalur Raya Puncak, Kabupaten Bogor, Provinsi Jawa Barat, iring-iringan armada pemadam kebakaran terjebak kemacetan parah saat menuju lokasi kebakaran pasar tradisional. Unit Turjawali Satlantas yang sedang berpatroli segera mengambil alih situasi dengan melakukan diskresi kepolisian. Menggunakan sepeda motor pengawal, petugas bermanuver membelah antrean panjang, secara dinamis memaksa kendaraan pribadi untuk menepi, dan membuka jalur khusus sehingga armada pemadam berhasil menembus kemacetan dan tiba di lokasi kebakaran tepat waktu.'
    },
    {
      spec: 'lantas',
      judul: 'Pengejaran Pelaku Tabrak Lari Ugal-ugalan di Tol Dalam Kota',
      narasi: 'Pada hari Rabu, 13 Mei 2026, di ruas Jalan Tol Dalam Kota (Cawang arah Grogol), DKI Jakarta, seorang pengemudi mobil SUV mewah melarikan diri dengan kecepatan tinggi setelah menabrak pengendara motor hingga tewas di jalur arteri. Unit Patroli Jalan Raya (PJR) Satlantas yang menerima laporan langsung melakukan pengejaran di dalam ruas tol. Melalui koordinasi radio yang cepat, petugas memblokir akses gerbang tol keluar dan mengeksekusi teknik penghadangan paksa (roadblock). Pengemudi yang terindikasi di bawah pengaruh alkohol tersebut sempat menolak keluar dari kabin dan mengunci pintu, sehingga petugas terpaksa memecahkan kaca jendela untuk menarik paksa dan mengamankan pelaku.'
    },

    // BINMAS
    {
      spec: 'binmas',
      judul: 'Mediasi dan Pembinaan Remaja Terlibat Tawuran di Bekasi',
      narasi: 'Pada hari Senin, 20 April 2026, di sebuah lingkungan padat penduduk wilayah Kota Bekasi, Jawa Barat, terjadi ketegangan antara warga setempat dan keluarga dari delapan remaja yang baru saja diamankan karena membawa senjata tajam untuk tawuran. Warga yang tersulut emosi berkumpul dan nyaris melakukan persekusi terhadap keluarga pelaku yang dianggap meresahkan lingkungan. Petugas Bhabinkamtibmas dan anggota Satbinmas segera tiba di lokasi untuk menenangkan kerumunan massa, memfasilitasi mediasi secara langsung antara tokoh masyarakat, perangkat RT/RW, dan orang tua pelaku, serta memberikan penyuluhan hukum yang tegas sehingga konflik sosial dan aksi main hakim sendiri berhasil dicegah.'
    },
    {
      spec: 'binmas',
      judul: 'Mediasi Ketegangan Konflik Agraria Warga Bukit Bakar',
      narasi: 'Pada hari Kamis, 9 April 2026, bertempat di balai Desa Bukit Bakar, Kabupaten Tanjung Jabung Barat, Provinsi Jambi, terjadi eskalasi ketegangan antara ratusan anggota kelompok tani dan perwakilan perusahaan kelapa sawit akibat pemutusan akses jalan desa dan penggusuran lahan garapan. Warga yang emosional memblokade area balai desa dan mengancam akan merusak fasilitas operasional perusahaan. Personel Satbinmas turun ke lokasi, bertindak sebagai mediator yang netral di tengah kerumunan yang terisolasi, berhasil meredam amarah warga agar tidak bertindak anarkis, dan mengarahkan penyelesaian sengketa lahan tersebut melalui jalur musyawarah formal bersama pemerintah daerah.'
    },
    {
      spec: 'binmas',
      judul: 'Fasilitasi Ikrar Damai Konflik Antarkelompok di Kwamki Narama',
      narasi: 'Pada hari Senin, 12 Januari 2026, di kawasan Kwamki Narama, Kabupaten Mimika, Provinsi Papua Tengah, aparat Satbinmas diterjunkan untuk mengawal prosesi ikrar damai pasca-konflik komunal antar-kubu warga yang sebelumnya memakan korban jiwa. Di tengah berlangsungnya prosesi, muncul provokasi dari sekelompok oknum warga yang belum puas dengan hasil kesepakatan dan mencoba memicu keributan kembali. Personel Satbinmas segera merespons dengan menggalang tokoh adat, kepala suku, dan tokoh pemuda setempat, melakukan pendekatan kultural secara persuasif di titik-titik kerumunan, sehingga provokasi berhasil diredam dan bentrokan susulan dapat digagalkan.'
    },
    {
      spec: 'binmas',
      judul: 'Edukasi Cegah Persekusi dan Hoaks Kejahatan di Neglasari',
      narasi: 'Pada hari Senin, 25 Mei 2026, di lingkungan pemukiman Kecamatan Neglasari, Kota Tangerang, Provinsi Banten, beredar informasi hoaks berantai melalui grup percakapan mengenai ancaman serangan dari kelompok geng motor. Isu tak berdasar ini memicu kepanikan luar biasa yang membuat puluhan warga mempersenjatai diri dengan senjata tajam saat melakukan siskamling. Menanggapi situasi genting ini, personel Binmas bergerak cepat melakukan intervensi darurat dari rumah ke rumah (door-to-door) dan mengumpulkan perangkat desa. Petugas mengklarifikasi informasi palsu tersebut, melucuti senjata tajam secara persuasif, memberikan peringatan keras terkait bahaya persekusi, dan menata ulang sistem keamanan lingkungan agar berkoordinasi langsung dengan pihak kepolisian.'
    },

    // SABHARA
    {
      spec: 'sabhara',
      judul: 'Penanganan Tawuran Massal Berdarah di Belawan',
      narasi: 'Pada hari Selasa, 10 Maret 2026, di kawasan pemukiman padat pesisir Kecamatan Medan Belawan, Kota Medan, Provinsi Sumatera Utara, pecah aksi tawuran massal bersenjata tajam dan petasan yang melibatkan dua kelompok pemuda lintas lingkungan. Bentrokan yang berlangsung hingga dini hari tersebut menyebabkan beberapa rumah warga rusak terbakar dan memblokade akses jalan utama pelabuhan. Personel Satuan Sabhara yang tiba di lokasi segera membentuk formasi sekat berlapis, menembakkan gas air mata untuk membubarkan konsentrasi massa yang agresif, mengamankan belasan provokator beserta puluhan senjata tajam rakitan, serta mendirikan posko pengamanan statis guna mencegah bentrokan susulan.'
    },
    {
      spec: 'sabhara',
      judul: 'Pengamanan Unjuk Rasa Anarkis di Blok Rokan',
      narasi: 'Pada hari Rabu, 1 April 2026, bertempat di depan pintu gerbang utama fasilitas industri strategis nasional Blok Rokan, Kecamatan Mandau, Kabupaten Bengkalis, Provinsi Riau, terjadi aksi unjuk rasa ratusan mantan pekerja yang berujung anarkis. Massa yang emosional mulai melakukan pembakaran ban, merusak pagar pembatas objek vital, dan melempari petugas keamanan dengan batu. Menghadapi situasi tersebut, pasukan Dalmas Satuan Sabhara dikerahkan ke titik penumpukan massa untuk melakukan pengondisian. Petugas mengaktifkan formasi Dalmas Lanjut dengan tameng dan kendaraan pengurai massa (Water Cannon) guna mendorong mundur demonstran secara tegas tanpa menggunakan kekerasan mematikan.'
    },
    {
      spec: 'sabhara',
      judul: 'Penggerebekan Sarang Judi dan Premanisme di Kampung Dalam',
      narasi: 'Pada hari Sabtu, 25 April 2026, di wilayah Kampung Dalam, Kecamatan Senapelan, Kota Pekanbaru, Provinsi Riau, Tim Patroli Perintis Presisi Satuan Sabhara melakukan operasi penyisiran mendadak terhadap indikasi maraknya premanisme dan lapak judi dadu terorganisir yang meresahkan warga. Saat petugas mengepung lokasi, beberapa pelaku perjudian mencoba melarikan diri melintasi atap rumah warga dan melakukan perlawanan fisik dengan melempar botol kaca ke arah petugas. Personel Sabhara bergerak taktis melakukan pengejaran, melumpuhkan para pelaku dengan teknik bela diri Polri, serta menyita seluruh mesin judi ketangkasan beserta senjata tajam sebagai barang bukti.'
    },
    {
      spec: 'sabhara',
      judul: 'Evakuasi Darurat Korban Banjir Bandang di Kutai Timur',
      narasi: 'Pada hari Senin, 11 Mei 2026, menyusul jebolnya tanggul sungai akibat curah hujan ekstrem di wilayah Kecamatan Sangatta Utara, Kabupaten Kutai Timur, Provinsi Kalimantan Timur, ratusan rumah warga terendam banjir bandang dengan ketinggian air mencapai 1,5 meter secara mendadak. Arus air yang sangat deras menjebak puluhan lansia dan anak-anak di dalam rumah mereka. Unit SAR Satuan Sabhara segera diterjunkan ke lokasi banjir dengan membawa perahu karet dan perlengkapan penyelamatan. Petugas menerobos arus banjir yang pekat untuk mengevakuasi para korban ke tempat pengungsian yang lebih aman, serta melakukan penyisiran rumah kosong guna mengantisipasi aksi penjarahan.'
    },

    // RESERSE
    {
      spec: 'reserse',
      judul: 'Penangkapan Pelaku Pembunuhan Wanita di Cipocok Jaya',
      narasi: 'Pada hari Jumat, 22 Mei 2026 dini hari, Satreskrim Polresta Serang Kota bersama tim gabungan melakukan pengejaran dan penangkapan terhadap seorang pria berinisial AS (47) yang melarikan diri ke Tangerang Selatan. AS merupakan buron tersangka pembunuhan berencana seorang wanita yang jasadnya ditemukan tewas tergantung dengan sejumlah luka tidak wajar di sebuah kebun milik warga di Kecamatan Cipocok Jaya, Kota Serang, Banten, pada Senin, 18 Mei 2026. Petugas berhasil menyergap dan melumpuhkan pelaku saat sedang bersembunyi di rumah saudaranya, mengamankan barang bukti berupa handphone milik korban yang sempat dijarah, and langsung membawa tersangka ke markas komando untuk proses penyidikan.'
    },
    {
      spec: 'reserse',
      judul: 'Penyergapan Pelaku Curanmor Asrama di Tanjung Morawa',
      narasi: 'Pada hari Senin, 25 Mei 2026, sekitar pukul 12.00 WIB, Unit Reskrim Polsek Tanjung Morawa, Polresta Deli Serdang, Provinsi Sumatera Utara, melakukan penyergapan terhadap seorang tersangka curanmor berinisial TW (30) di Jalan Medan–Tanjung Morawa Km 15, tepatnya di depan Masjid Ubbudiyah PTPN II. Tindakan ini merupakan hasil pengembangan cepat dari laporan pencurian sepeda motor di asrama mahasiswa yang berhasil teridentifikasi melalui rekaman CCTV. Tim reserse yang telah memetakan rute pelarian pelaku langsung memblokir akses jalan raya saat pelaku melintas, dan berhasil meringkusnya beserta barang bukti kendaraan curian sebelum pelaku sempat menjualnya ke penadah.'
    },
    {
      spec: 'reserse',
      judul: 'Pelumpuhan Residivis Perampokan Angkot Morina 81 Belawan',
      narasi: 'Pada hari Kamis, 14 Mei 2026, Tim Jatanras Polda Sumut bersama Satreskrim Polres Pelabuhan Belawan, Kota Medan, Provinsi Sumatera Utara, melakukan operasi penangkapan terhadap komplotan perampok bersenjata tajam yang kerap meneror penumpang angkutan umum (Angkot) Morina 81. Saat digerebek di lokasi persembunyiannya, tersangka utama yang berinisial EN alias Tato menolak menyerah, memberikan perlawanan fisik yang membahayakan petugas, dan mencoba merebut senjata api milik anggota. Menghadapi ancaman mematikan tersebut, petugas mengambil tindakan tegas dan terukur dengan melepaskan tembakan untuk melumpuhkan tersangka yang ternyata merupakan residivis kelas kakap.'
    },
    {
      spec: 'reserse',
      judul: 'Penggerebekan Sarang Pengedar Narkotika di Purwakarta',
      narasi: 'Pada hari Selasa, 3 Maret 2026, Satresnarkoba Polres Purwakarta, Jawa Barat, mengeksekusi operasi penggerebekan serentak terhadap sebuah bangunan yang teridentifikasi sebagai sarang transaksi dan peredaran narkotika. Operasi penindakan taktis ini mewajibkan anggota reserse mendobrak pintu utama secara paksa (Close Quarter Battle) karena tersangka mengunci diri dari dalam. Menyadari kedatangan petugas, beberapa tersangka berupaya menghancurkan barang bukti dengan membuang sabu ke dalam saluran air dan mencoba kabur melewati atap bangunan. Namun, perimeter wilayah yang sudah dikepung ketat oleh anggota reserse memastikan seluruh tersangka berhasil diringkus tanpa ampun beserta barang bukti paket sabu siap edar.'
    },

    // INTEL
    {
      spec: 'intel',
      judul: 'Deteksi Dini Rencana Provokasi Kampanye Pilkada di Makassar',
      narasi: 'Pada hari Kamis, 16 April 2026, di sebuah ruko tertutup di kawasan Kecamatan Panakkukang, Kota Makassar, Provinsi Sulawesi Selatan, Unit Intelkam mendeteksi adanya pertemuan rahasia sekelompok simpatisan radikal yang merencanakan kampanye hitam dan sabotase fisik terhadap konvoi pasangan calon wali kota. Personel intelijen yang melakukan penyamaran (undercover) berhasil menyusup ke area sekitar ruko, mendokumentasikan wajah para provokator utama, dan menyadap skema rute penghadangan yang mereka buat. Informasi matang tersebut langsung disuplai ke pimpinan sebagai produk intelijen kilat, sehingga aparat keamanan dapat melakukan cegah tangkal dan mengubah rute konvoi sebelum bentrokan terjadi.'
    },
    {
      spec: 'intel',
      judul: 'Penyelidikan Penimbunan Komoditas Pangan di Pelabuhan Tanjung Perak',
      narasi: 'Pada hari Senin, 9 Maret 2026, menjelang bulan suci Ramadan, tim Intelijen Ekonomi melakukan pengawasan tertutup di sekitar area pergudangan Pelabuhan Tanjung Perak, Kota Surabaya, Provinsi Jawa Timur. Penyelidikan dipicu oleh kelangkaan minyak goreng bersubsidi secara mendadak di pasaran. Agen intelijen berpakaian preman memantau pola pergerakan truk ekspedisi pada tengah malam dan mengidentifikasi sebuah gudang tak berizin yang melakukan bongkar muat secara sembunyi-sembunyi. Petugas berhasil mencatat nomor polisi kendaraan, menggalang informan dari kuli angkut untuk memastikan isi muatan, dan memberikan rekomendasi A1 kepada Satgas Pangan untuk segera melakukan penyegelan sebelum harga pasar semakin melonjak.'
    },
    {
      spec: 'intel',
      judul: 'Pengawasan Senyap Transaksi Senjata Ilegal di Poso',
      narasi: 'Pada hari Rabu, 6 Mei 2026, di sebuah desa pesisir Kecamatan Poso Pesisir Utara, Kabupaten Poso, Provinsi Sulawesi Tengah, Satintelkam melakukan pengintaian (surveillance) terhadap aktivitas mencurigakan seorang residivis yang diduga bertindak sebagai kurir senjata rakitan untuk kelompok sel tidur teroris. Anggota intelijen melakukan pembuntutan jarak jauh melintasi jalur perbukitan dan pasar tradisional tanpa memancing kecurigaan target (counter-surveillance). Hasil pengamatan visual dan pelacakan titik koordinat pertemuan target dengan pemasok senjata tersebut kemudian dipetakan secara detail, membuka jalan bagi tim penindak (Densus 88) untuk mengepung lokasi secara presisi keesokan harinya.'
    },
    {
      spec: 'intel',
      judul: 'Pemetaan dan Penggalangan Rencana Blokade Tol Cikarang',
      narasi: 'Pada hari Jumat, 1 Mei 2026, bertepatan dengan peringatan Hari Buruh Internasional, di Kawasan Industri Cikarang, Kabupaten Bekasi, Provinsi Jawa Barat, intelijen mendeteksi adanya elemen buruh garis keras yang membelot dari kesepakatan awal dan bersiap melakukan blokade total di ruas Jalan Tol Jakarta-Cikampek. Sebelum pergerakan massa membesar, personel Satintelkam segera melakukan pendekatan persuasif dan penggalangan (gal) kepada tokoh sentral atau koordinator lapangan (Korlap) serikat pekerja tersebut. Melalui negosiasi taktis dan penyampaian konsekuensi hukum yang tegas di lapangan, agen intelijen berhasil meredam eskalasi, memecah konsolidasi massa yang anarkis, dan mengarahkan mereka kembali ke titik kumpul yang sah tanpa melumpuhkan urat nadi ekonomi nasional.'
    }
  ];

  processingSteps = [
    { key: 'sim.input.step1', duration: 1500 },
    { key: 'sim.input.step2', duration: 2000 },
    { key: 'sim.input.step3', duration: 3000 },
    { key: 'sim.input.step4', duration: 5000 },
    { key: 'sim.input.step5', duration: 1000 },
  ];

  constructor(
    private simulationService: SimulationService,
    private router: Router,
    private route: ActivatedRoute,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // Pre-fill spesialisasi from query param
    this.route.queryParams.subscribe(params => {
      if (params['spec']) {
        this.spesialisasi = params['spec'];
        this.selectedTemplateSpec.set(params['spec'] as Spesialisasi);
      }
    });
  }

  getTemplatesBySpec() {
    return this.allTemplates.filter(t => t.spec === this.selectedTemplateSpec());
  }

  selectTemplate(temp: any) {
    this.judul = temp.judul;
    this.narasiKasus = temp.narasi;
    this.spesialisasi = temp.spec;
    this.showTemplateModal.set(false);
  }

  isFormValid(): boolean {
    return this.judul.trim().length > 0 &&
           this.narasiKasus.trim().length >= 20 &&
           this.spesialisasi !== '';
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.isProcessing()) return;

    this.isProcessing.set(true);
    this.errorMessage.set('');
    this.currentStep.set(0);

    // Animate through processing steps
    this.animateProcessingSteps();

    const input: SimulationInput = {
      judul: this.judul.trim(),
      narasiKasus: this.narasiKasus.trim(),
      spesialisasi: this.spesialisasi as Spesialisasi,
      language: this.languageService.currentLang(),
    };

    this.simulationService.createSimulation(input).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        if (res.success && res.data) {
          this.router.navigate(['/simulation/result', res.data.simulationId]);
        }
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.errorMessage.set(
          err.error?.message || 'Terjadi kesalahan saat memproses simulasi. Coba lagi.'
        );
      },
    });
  }

  private animateProcessingSteps(): void {
    let step = 0;
    this.processingMessage.set(this.languageService.t(this.processingSteps[0].key));

    const advance = () => {
      if (step < this.processingSteps.length - 1 && this.isProcessing()) {
        step++;
        this.currentStep.set(step);
        this.processingMessage.set(this.languageService.t(this.processingSteps[step].key));
        setTimeout(advance, this.processingSteps[step].duration);
      }
    };

    setTimeout(advance, this.processingSteps[0].duration);
  }
}
