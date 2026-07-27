import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SimulationService } from '../../core/services/simulation.service';
import { Simulation } from '../../shared/models/simulation.model';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container" id="dashboard-page">
      <!-- Welcome Section -->
      <div class="welcome-section animate-fade-in">
        <div class="welcome-text">
          <h1 class="page-title">{{ lang.t('dash.welcome', { name: getUserFirstName() }) }}</h1>
          <p class="page-subtitle">{{ lang.t('dash.subtitle') }}</p>
        </div>
        <a routerLink="/simulation" class="btn btn-primary btn-lg" id="btn-new-sim">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {{ lang.t('dash.btn.new') }}
        </a>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card glass-card animate-fade-in" style="animation-delay: 0.1s" id="stat-total">
          <div class="stat-icon stat-icon-blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalSimulations }}</span>
            <span class="stat-label">{{ lang.t('dash.stat.total') }}</span>
          </div>
        </div>

        <div class="stat-card glass-card animate-fade-in" style="animation-delay: 0.2s" id="stat-completed">
          <div class="stat-icon stat-icon-green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ completedCount }}</span>
            <span class="stat-label">{{ lang.t('dash.stat.completed') }}</span>
          </div>
        </div>

        <div class="stat-card glass-card animate-fade-in" style="animation-delay: 0.3s" id="stat-processing">
          <div class="stat-icon stat-icon-gold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ processingCount }}</span>
            <span class="stat-label">{{ lang.t('dash.stat.processing') }}</span>
          </div>
        </div>
      </div>

      <!-- Specialization Cards -->
      <div class="section-header animate-fade-in" style="animation-delay: 0.4s">
        <h2>{{ lang.t('dash.spec.title') }}</h2>
        <p class="page-subtitle">{{ lang.t('dash.spec.subtitle') }}</p>
      </div>

      <div class="spec-grid">
        <a routerLink="/simulation" [queryParams]="{ spec: 'sabhara' }"
           class="spec-card glass-card animate-fade-in" style="animation-delay: 0.5s" id="spec-sabhara">
          <div class="spec-icon spec-icon-blue">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
               <path d="M12 8v4l3 3"/>
             </svg>
          </div>
          <h3>{{ lang.t('dash.spec.sabhara.title') }}</h3>
          <p>{{ lang.t('dash.spec.sabhara.desc') }}</p>
        </a>

        <a routerLink="/simulation" [queryParams]="{ spec: 'reserse' }" 
           class="spec-card glass-card animate-fade-in" style="animation-delay: 0.6s" id="spec-reserse">
          <div class="spec-icon spec-icon-red">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
          <h3>{{ lang.t('dash.spec.reserse.title') }}</h3>
          <p>{{ lang.t('dash.spec.reserse.desc') }}</p>
        </a>

        <a routerLink="/simulation" [queryParams]="{ spec: 'intel' }"
           class="spec-card glass-card animate-fade-in" style="animation-delay: 0.7s" id="spec-intel">
          <div class="spec-icon spec-icon-gold">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <h3>{{ lang.t('dash.spec.intel.title') }}</h3>
          <p>{{ lang.t('dash.spec.intel.desc') }}</p>
        </a>

        <a routerLink="/simulation" [queryParams]="{ spec: 'lantas' }"
           class="spec-card glass-card animate-fade-in" style="animation-delay: 0.8s" id="spec-lantas">
          <div class="spec-icon spec-icon-green">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <circle cx="12" cy="7" r="2" fill="currentColor"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="17" r="2"/>
            </svg>
          </div>
          <h3>{{ lang.t('dash.spec.lantas.title') }}</h3>
          <p>{{ lang.t('dash.spec.lantas.desc') }}</p>
        </a>

        <a routerLink="/simulation" [queryParams]="{ spec: 'binmas' }"
           class="spec-card glass-card animate-fade-in" style="animation-delay: 0.9s" id="spec-binmas">
          <div class="spec-icon spec-icon-purple">
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
               <circle cx="9" cy="7" r="4"></circle>
               <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
               <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
             </svg>
          </div>
          <h3>{{ lang.t('dash.spec.binmas.title') }}</h3>
          <p>{{ lang.t('dash.spec.binmas.desc') }}</p>
        </a>
      </div>

      <!-- Recent Simulations -->
      @if (recentSimulations.length > 0) {
        <div class="section-header animate-fade-in" style="animation-delay: 1s">
          <h2>{{ lang.t('dash.recent.title') }}</h2>
          <a routerLink="/history" class="btn btn-secondary btn-sm">{{ lang.t('dash.recent.all') }}</a>
        </div>

        <div class="recent-list">
          @for (sim of recentSimulations; track sim.id) {
            <a [routerLink]="['/simulation/result', sim.id]" class="recent-item glass-card animate-fade-in">
              <div class="recent-info">
                <h4>{{ sim.judul }}</h4>
                <p>{{ sim.narasi_kasus | slice:0:100 }}...</p>
              </div>
              <div class="recent-meta">
                <span class="badge" [ngClass]="getSpecBadgeClass(sim.spesialisasi)">{{ sim.spesialisasi }}</span>
                <span class="recent-date">{{ sim.created_at | date:'dd MMM yyyy' }}</span>
              </div>
            </a>
          }
        </div>
      }

      <!-- Legal References Mini Dashboard (Pasal.id) -->
      <div class="section-header animate-fade-in" style="margin-top: var(--spacing-2xl); animation-delay: 1.1s">
        <div class="header-with-badge">
          <h2>{{ lang.t('dash.legal.title') }}</h2>
          <span class="badge badge-gold">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Pasal.id Verified
          </span>
        </div>
      </div>

      <div class="legal-mini-grid animate-fade-in" style="animation-delay: 1.2s">
        @if (recentLegalRefs.length > 0) {
          @for (ref of recentLegalRefs; track ref.id) {
            <div class="legal-mini-card glass-card">
              <div class="legal-card-tag">{{ ref.pasal_number }}</div>
              <h4 class="legal-card-title">{{ ref.undang_undang | slice:0:50 }}{{ ref.undang_undang.length > 50 ? '...' : '' }}</h4>
              <p class="legal-card-desc">{{ ref.deskripsi | slice:0:100 }}...</p>
              <div class="legal-card-footer">
                <span class="source-sim">Kasus: {{ ref.simulasi_judul | slice:0:25 }}...</span>
              </div>
            </div>
          }
        } @else {
          <div class="empty-legal glass-card">
            <p>{{ lang.t('dash.legal.empty') }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .welcome-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-xl);
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-2xl);
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: var(--border-radius-md);
      flex-shrink: 0;
    }

    .stat-icon-blue { background: rgba(59, 130, 246, 0.12); color: var(--color-accent-blue-light); }
    .stat-icon-green { background: rgba(16, 185, 129, 0.12); color: var(--color-accent-green); }
    .stat-icon-gold { background: rgba(245, 158, 11, 0.12); color: var(--color-accent-gold); }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-family: var(--font-heading);
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-text-primary);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-md);
    }

    .spec-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-2xl);
    }

    .spec-card {
      padding: var(--spacing-lg);
      text-decoration: none;
      cursor: pointer;
    }

    .spec-card h3 {
      font-size: 1rem;
      margin: var(--spacing-md) 0 var(--spacing-xs);
    }

    .spec-card p {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    .spec-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      border-radius: var(--border-radius-md);
    }

    .spec-icon-blue { background: rgba(59, 130, 246, 0.12); color: var(--color-accent-blue-light); }
    .spec-icon-red { background: rgba(239, 68, 68, 0.12); color: var(--color-accent-red); }
    .spec-icon-green { background: rgba(16, 185, 129, 0.12); color: var(--color-accent-green); }
    .spec-icon-purple { background: rgba(139, 92, 246, 0.12); color: var(--color-accent-purple); }
    .spec-icon-gold { background: rgba(245, 158, 11, 0.12); color: var(--color-accent-gold); }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .recent-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md) var(--spacing-lg);
      text-decoration: none;
      cursor: pointer;
      gap: var(--spacing-md);
    }

    .recent-info h4 {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .recent-info p {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
    }

    .recent-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-shrink: 0;
    }

    .recent-date {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      white-space: nowrap;
    }

    @media (max-width: 768px) {
      .spec-grid {
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-sm);
      }

      .recent-item {
        flex-direction: column;
        align-items: flex-start;
        padding: var(--spacing-md);
      }
      
      .stat-card {
        padding: var(--spacing-md);
      }
    }

    @media (max-width: 480px) {
      .spec-grid {
        grid-template-columns: 1fr;
      }
      
      .welcome-section {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
      }
      
      .welcome-section .btn {
        width: 100%;
      }
      
      .page-title {
        font-size: 1.5rem;
      }
    }

    /* Legal Mini Dashboard Styles */
    .header-with-badge {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .legal-mini-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-2xl);
    }

    .legal-mini-card {
      padding: var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      border-left: 3px solid var(--color-accent-gold);
    }

    .legal-card-tag {
      font-size: 0.625rem;
      font-weight: 700;
      color: var(--color-accent-gold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .legal-card-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 2px 0;
    }

    .legal-card-desc {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      line-height: 1.5;
      flex-grow: 1;
    }

    .legal-card-footer {
      margin-top: var(--spacing-sm);
      padding-top: var(--spacing-xs);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .source-sim {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      font-style: italic;
    }

    .empty-legal {
      grid-column: 1 / -1;
      padding: var(--spacing-xl);
      text-align: center;
      color: var(--color-text-secondary);
      font-size: 0.875rem;
    }
  `],
})
export class DashboardComponent implements OnInit {
  totalSimulations = 0;
  completedCount = 0;
  processingCount = 0;
  recentSimulations: Simulation[] = [];
  recentLegalRefs: any[] = [];

  constructor(
    public auth: AuthService,
    private simulationService: SimulationService,
    private cdr: ChangeDetectorRef,
    public lang: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // 1. Ambil data history untuk list terbaru
    this.simulationService.getSimulations(1, 5).subscribe({
      next: (res: any) => {
        this.recentSimulations = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.recentSimulations = [];
        this.cdr.detectChanges();
      }
    });

    // 2. Ambil data statistik dari endpoint stats baru
    this.simulationService.getSimulationStats().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.totalSimulations = res.data.total;
          this.completedCount = res.data.completed;
          this.processingCount = res.data.processing;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.totalSimulations = 0;
        this.completedCount = 0;
        this.processingCount = 0;
        this.cdr.detectChanges();
      }
    });

    // 3. Ambil rujukan hukum terbaru (Mini Dashboard Pasal.id)
    this.simulationService.getLegalReferences(4).subscribe({
      next: (res: any) => {
        this.recentLegalRefs = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.recentLegalRefs = [];
        this.cdr.detectChanges();
      }
    });
  }

  getSpecBadgeClass(spec: string): string {
    const map: Record<string, string> = {
      sabhara: 'badge-blue',
      reserse: 'badge-red',
      intel: 'badge-gold',
      lantas: 'badge-green',
      binmas: 'badge-purple',
    };
    return map[spec] || 'badge-blue';
  }

  getUserFirstName(): string {
    const user = this.auth.user();
    if (!user?.name) return '';
    return user.name.split(' ')[0];
  }
}
