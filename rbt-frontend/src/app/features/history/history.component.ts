import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HistoryService } from '../../core/services/history.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { Simulation } from '../../shared/models/simulation.model';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="page-container" id="history-page">
      <div class="page-header animate-fade-in">
        <div>
          <h1 class="page-title">{{ lang.t('history.title') }}</h1>
          <p class="page-subtitle">{{ lang.t('history.subtitle') }}</p>
        </div>
        <a routerLink="/simulation" class="btn btn-primary" id="btn-create-from-history">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {{ lang.t('history.btn.new') }}
        </a>
      </div>

      <!-- Filters -->
      <div class="filters animate-fade-in" style="animation-delay:0.1s">
        <div class="filter-group">
          <label class="filter-label">{{ lang.t('history.filter.spec') }}</label>
          <select class="form-select filter-select" [(ngModel)]="filterSpec" (change)="loadHistory()" id="filter-spec">
            <option value="">{{ lang.t('history.filter.all') }}</option>
            <option value="sabhara">Sabhara</option>
            <option value="reserse">Reserse</option>
            <option value="intel">Intel</option>
            <option value="lantas">Lalu Lintas</option>
            <option value="binmas">Binmas</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner [message]="lang.t('sim.result.label.loading')" />
      } @else if (simulations().length > 0) {
        <!-- History List (Table for Desktop, Cards for Mobile) -->
        <div class="history-container glass-card animate-fade-in" style="animation-delay:0.2s">
          <!-- Desktop Table -->
          <div class="desktop-only">
            <table class="data-table" id="history-table">
              <thead>
                <tr>
                  <th>{{ lang.t('history.table.title') }}</th>
                  <th>{{ lang.t('history.table.spec') }}</th>
                  <th>{{ lang.t('history.table.status') }}</th>
                  <th>{{ lang.t('history.table.level') }}</th>
                  <th>{{ lang.t('history.table.date') }}</th>
                  <th>{{ lang.t('history.table.action') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (sim of simulations(); track sim.id; let i = $index) {
                  <tr class="table-row" [style.animation-delay]="(i * 0.05) + 's'">
                    <td>
                      <div class="sim-title">{{ sim.judul }}</div>
                      <div class="sim-snippet">{{ sim.narasi_kasus | slice:0:80 }}...</div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getSpecBadge(sim.spesialisasi)">
                        {{ sim.spesialisasi }}
                      </span>
                    </td>
                    <td>
                      <span class="status-dot" [ngClass]="'status-' + sim.status"></span>
                      {{ getStatusLabel(sim.status) }}
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getDiffBadge(sim.tingkat_kesulitan || 'menengah')">
                        {{ sim.tingkat_kesulitan || '-' }}
                      </span>
                    </td>
                    <td class="date-cell">{{ sim.created_at | date:'dd/MM/yyyy' }}</td>
                    <td>
                      <a [routerLink]="['/simulation/result', sim.id]" class="btn btn-secondary btn-sm">{{ lang.t('history.btn.view') }}</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Mobile Card List -->
          <div class="mobile-only">
            <div class="card-list">
              @for (sim of simulations(); track sim.id; let i = $index) {
                <div class="history-mobile-card" [style.animation-delay]="(i * 0.05) + 's'">
                  <div class="card-header">
                    <span class="badge" [ngClass]="getSpecBadge(sim.spesialisasi)">{{ sim.spesialisasi }}</span>
                    <span class="card-date">{{ sim.created_at | date:'dd MMM yyyy' }}</span>
                  </div>
                  <div class="card-main">
                    <h4 class="card-title">{{ sim.judul }}</h4>
                    <p class="card-text">{{ sim.narasi_kasus | slice:0:100 }}...</p>
                  </div>
                  <div class="card-footer">
                    <div class="card-status">
                      <span class="status-dot" [ngClass]="'status-' + sim.status"></span>
                      {{ getStatusLabel(sim.status) }}
                    </div>
                    <a [routerLink]="['/simulation/result', sim.id]" class="btn btn-primary btn-sm">
                      {{ lang.t('history.btn.view') }}
                    </a>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination animate-fade-in">
            <button class="btn btn-secondary btn-sm" [disabled]="currentPage() <= 1" (click)="goToPage(currentPage() - 1)">
              {{ lang.t('history.pagination.prev') }}
            </button>
            <span class="page-info">
              {{ lang.t('history.pagination.info', { page: currentPage(), total: totalPages() }) }}
            </span>
            <button class="btn btn-secondary btn-sm" [disabled]="currentPage() >= totalPages()" (click)="goToPage(currentPage() + 1)">
              {{ lang.t('history.pagination.next') }}
            </button>
          </div>
        }
      } @else {
        <!-- Empty State -->
        <div class="empty-state glass-card animate-fade-in">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <h3>{{ lang.t('history.empty.title') }}</h3>
          <p>{{ lang.t('history.empty.desc') }}</p>
          <a routerLink="/simulation" class="btn btn-primary" style="margin-top: 16px;">{{ lang.t('history.empty.btn') }}</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .filters {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filter-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .filter-select {
      width: 180px;
      padding: 8px 12px;
      font-size: 0.8125rem;
    }

    /* Table & Container */
    .history-container {
      overflow: hidden;
      padding: 0;
    }

    .desktop-only { display: block; }
    .mobile-only { display: none; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    
    .data-table thead {
      background: rgba(59, 130, 246, 0.05);
    }
    
    .data-table th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 700;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table td {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      vertical-align: middle;
    }

    .table-row {
      transition: background 0.2s;
    }

    .table-row:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    /* Mobile Cards */
    .card-list {
      display: flex;
      flex-direction: column;
      gap: 1px;
      background: var(--border-color);
    }

    .history-mobile-card {
      background: var(--color-bg-primary);
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      animation: fadeIn 0.3s ease forwards;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-date {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .card-title {
      font-size: 0.9375rem;
      font-weight: 700;
      margin-bottom: 4px;
      color: var(--color-text-primary);
    }

    .card-text {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
      padding-top: var(--spacing-md);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .card-status {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      font-weight: 500;
      display: flex;
      align-items: center;
    }

    @media (max-width: 768px) {
      .desktop-only { display: none; }
      .mobile-only { display: block; }
      
      .page-header {
        flex-direction: column;
        align-items: stretch;
      }
      
      .page-header .btn {
        width: 100%;
        justify-content: center;
      }

      .filter-select {
        width: 100%;
      }
      
      .filters {
        flex-direction: column;
      }
    }
  `],
})
export class HistoryComponent implements OnInit {
  simulations = signal<Simulation[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  filterSpec = '';

  constructor(
    private historyService: HistoryService,
    public lang: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    const spec = this.filterSpec || undefined;

    this.historyService.getHistory(this.currentPage(), 10, spec).subscribe({
      next: (res) => {
        this.simulations.set(res.data || []);
        this.totalPages.set(res.pagination?.totalPages || 1);
        this.loading.set(false);
      },
      error: () => {
        this.simulations.set([]);
        this.loading.set(false);
      },
    });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadHistory();
  }

  getSpecBadge(spec: string): string {
    const map: Record<string, string> = {
      reskrim: 'badge-blue', brimob: 'badge-red', lantas: 'badge-green',
      intelkam: 'badge-purple', administrasi: 'badge-gold',
    };
    return map[spec] || 'badge-blue';
  }

  getDiffBadge(level: string): string {
    const map: Record<string, string> = {
      dasar: 'badge-green', menengah: 'badge-gold', lanjutan: 'badge-red',
    };
    return map[level] || 'badge-blue';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      completed: this.lang.t('history.status.completed'),
      processing: this.lang.t('history.status.processing'),
      failed: this.lang.t('history.status.failed'),
    };
    return map[status] || status;
  }
}
