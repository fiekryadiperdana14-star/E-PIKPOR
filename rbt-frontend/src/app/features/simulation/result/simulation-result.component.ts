import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SimulationService } from '../../../core/services/simulation.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Simulation } from '../../../shared/models/simulation.model';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-simulation-result',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, FormsModule],
  template: `
    <div class="page-container" id="simulation-result-page">
      @if (loading()) {
        <app-loading-spinner [message]="lang.t('sim.result.label.loading')" />
      }

      @if (translating()) {
        <div class="translating-banner">
          <div class="translating-spinner"></div>
          <span>{{ lang.currentLang() === 'en' ? 'Translating to English, please wait...' : 'Memuat versi Bahasa Indonesia...' }}</span>
        </div>
      }

      @if (!loading() && simulation()) {
        <!-- Header -->
        <div class="result-header animate-fade-in">
          <div class="header-top">
            <a routerLink="/history" class="btn btn-secondary btn-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12,19 5,12 12,5"/>
              </svg>
              {{ lang.t('sim.result.back') }}
            </a>
            <span class="badge" [ngClass]="getSpecBadgeClass(simulation()!.spesialisasi)">
              {{ simulation()!.spesialisasi | uppercase }}
            </span>
          </div>
          <h1 class="page-title">{{ simulation()!.judul }}</h1>
          <p class="result-date">Dibuat: {{ simulation()!.created_at | date:'dd MMMM yyyy, HH:mm' }} WIB</p>
        </div>

        <!-- Tab Navigation -->
        <div class="tab-nav animate-fade-in" style="animation-delay:0.1s">
          <button class="tab-btn" [class.active]="activeTab() === 'scenario'" (click)="activeTab.set('scenario')" id="tab-scenario">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
            </svg>
            {{ lang.t('sim.result.tab.scenario') }}
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'legal'" (click)="activeTab.set('legal')" id="tab-legal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            {{ lang.t('sim.result.tab.legal') }}
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'narasi'" (click)="activeTab.set('narasi')" id="tab-narasi">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            {{ lang.t('sim.result.tab.narasi') }}
          </button>
        </div>

        <!-- Tab Content: Skenario RBT -->
        @if (activeTab() === 'scenario') {
          <div class="tab-content animate-fade-in">
            @if (result(); as r) {
              <!-- Scenario Summary -->
              <div class="result-card glass-card">
                <div class="card-label">{{ lang.t('sim.result.label.ringkasan') }}</div>
                <h2>{{ getScenarioTitle(r) }}</h2>
                <p class="card-body">{{ getScenarioSummary(r) }}</p>

                <div class="meta-row">
                  <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <span>{{ r.durasi_estimasi || '-' }}</span>
                  </div>
                  <div class="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                    <span class="badge" [ngClass]="getDifficultyBadge(r.tingkat_kesulitan)">
                      {{ r.tingkat_kesulitan | uppercase }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Tujuan Pelatihan -->
              <div class="result-card glass-card">
                <div class="card-label">{{ lang.t('sim.result.label.tujuan') }}</div>
                <p class="card-body">{{ r.tujuan_pelatihan }}</p>
              </div>

              <!-- Peralatan -->
              <div class="result-card glass-card">
                <div class="card-label">{{ lang.t('sim.result.label.peralatan') }}</div>
                <p class="card-body">{{ r.peralatan }}</p>
              </div>

              <!-- Langkah-Langkah -->
              <div class="result-card glass-card">
                <div class="card-label">{{ lang.t('sim.result.label.langkah') }}</div>
                <div class="steps-timeline">
                  @for (step of getSteps(r); track step.fase; let i = $index) {
                    <div class="timeline-item" [style.animation-delay]="(i * 0.1) + 's'">
                      <div class="timeline-marker">
                        <span>{{ i + 1 }}</span>
                      </div>
                      <div class="timeline-content">
                        <div class="timeline-header">
                          <h3>{{ step.fase }}</h3>
                          <span class="badge badge-blue">{{ step.durasi }}</span>
                        </div>
                        <ul class="activity-list">
                          @for (act of step.aktivitas; track act) {
                            <li>{{ act }}</li>
                          }
                        </ul>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Kriteria Evaluasi -->
              <div class="result-card glass-card">
                <div class="card-label">{{ lang.t('sim.result.label.evaluasi') }}</div>
                <div class="eval-grid">
                  @for (criteria of getEvalCriteria(r); track criteria.kriteria) {
                    <div class="eval-item">
                      <div class="eval-header">
                        <span class="eval-name">
                          <label class="checkbox-container">
                            <input type="checkbox"
                                   [checked]="isChecked(criteria.kriteria)"
                                   (change)="toggleCheck(criteria.kriteria)"
                                   [disabled]="savedScore() !== null">
                            <span class="checkmark"></span>
                            {{ criteria.kriteria }}
                          </label>
                        </span>
                        <span class="eval-weight">{{ criteria.bobot }}%</span>
                      </div>
                      <div class="eval-bar">
                        <div class="eval-bar-fill" [style.width]="criteria.bobot + '%'" [style.background]="isChecked(criteria.kriteria) ? 'var(--color-accent-green)' : 'var(--gradient-primary)'"></div>
                      </div>
                      <p class="eval-desc">{{ criteria.deskripsi }}</p>
                    </div>
                  }
                </div>
                
                @if (savedScore() === null) {
                  <!-- Form Penilaian Tambahan & Evaluasi Mandiri -->
                  <div class="eval-form-group" style="margin-top:20px;">
                    <label style="display:block;margin-bottom:8px;font-weight:600;font-size:0.875rem;">{{ lang.t('sim.result.eval.extra') }}</label>
                    <input type="number" [(ngModel)]="penilaianTambahan" class="eval-input" min="0" max="20" style="width:100%;padding:10px;border-radius:4px;border:1px solid var(--border-color);background:rgba(0,0,0,0.2);color:white;" />
                  </div>
                  <div class="eval-form-group" style="margin-top:16px;">
                    <label style="display:block;margin-bottom:8px;font-weight:600;font-size:0.875rem;">{{ lang.t('sim.result.eval.self') }}</label>
                    <textarea [(ngModel)]="evaluasiMandiri" class="eval-input" rows="4" [placeholder]="lang.t('sim.result.eval.placeholder')" style="width:100%;padding:10px;border-radius:4px;border:1px solid var(--border-color);background:rgba(0,0,0,0.2);color:white;resize:vertical;"></textarea>
                  </div>

                  <div class="eval-actions" style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid var(--border-color);">
                    <div class="progress-info" style="font-size:1.1rem;">
                       <strong>{{ lang.t('sim.result.eval.progress') }}</strong> <span style="color:var(--color-accent-blue-light);font-weight:bold;">{{ getProgressPercentage() }}%</span>
                    </div>
                    <button class="btn btn-primary" (click)="saveEvaluation()" [disabled]="isEvaluating()">
                      {{ isEvaluating() ? lang.t('sim.result.eval.saving') : lang.t('sim.result.eval.save') }}
                    </button>
                  </div>
                } @else {
                  <div class="eval-result-card" style="margin-top:20px;padding:20px;background:rgba(16,185,129,0.1);border:1px solid var(--color-accent-green);border-radius:8px;text-align:center;">
                    <h3 style="color:var(--color-accent-green);margin-bottom:10px;">{{ lang.t('sim.result.eval.score.title') }}</h3>
                    <div class="score-display" style="font-size:3rem;font-weight:bold;margin-bottom:15px;color:white;">
                       {{ savedScore() }}
                    </div>
                    <div style="text-align:left;font-size:0.875rem;">
                      <p style="margin-bottom:8px;"><strong>{{ lang.t('sim.result.eval.extra.label') }}</strong> <span style="float:right;font-weight:bold;">{{ result().penilaian_tambahan || penilaianTambahan() }}</span></p>
                      <p style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.1);"><strong>{{ lang.t('sim.result.eval.self.label') }}</strong><br/><span style="color:var(--color-text-secondary);display:inline-block;margin-top:4px;">{{ result().evaluasi_mandiri || evaluasiMandiri() }}</span></p>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-state glass-card">
                <p>{{ lang.t('sim.result.empty.scenario') }}</p>
              </div>
            }
          </div>
        }

        <!-- Tab Content: Dasar Hukum -->
        @if (activeTab() === 'legal') {
          <div class="tab-content animate-fade-in">
            @if (legalRefs().length > 0) {
              @for (ref of legalRefs(); track ref.id) {
                <div class="legal-accordion-item glass-card" [class.is-expanded]="expandedLegalId() === ref.id">
                  <div class="accordion-header" (click)="toggleLegalExpand(ref.id)">
                    <div class="header-info">
                      <div class="pasal-badge-wrap">
                        <span class="pasal-badge">{{ ref.pasal_number || ref.pasal }}</span>
                      </div>
                      <div class="title-wrap">
                        <h3 class="legal-title">{{ ref.undang_undang || ref.undangUndang }}</h3>
                      </div>
                    </div>
                    <div class="expand-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6,9 12,15 18,9"/>
                      </svg>
                    </div>
                  </div>
                  
                  <div class="accordion-content">
                    <div class="content-inner">
                      <div class="description-section">
                        @if (ref.judul_pasal || ref.judulPasal) {
                          <h4 class="judul-pasal-text">{{ ref.judul_pasal || ref.judulPasal }}</h4>
                        }
                        <h4 class="section-label">{{ lang.t('sim.result.legal.desc') }}</h4>
                        <p class="legal-desc">{{ ref.deskripsi }}</p>
                      </div>
                      
                      @if (ref.ancaman_pidana || ref.ancamanPidana) {
                        <div class="penalty-section">
                          <div class="penalty-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          </div>
                          <div class="penalty-details">
                            <span class="penalty-label">{{ lang.t('sim.result.legal.penalty') }}</span>
                            <p class="penalty-text">{{ ref.ancaman_pidana || ref.ancamanPidana }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            } @else {
              <div class="empty-state glass-card">
                <p>{{ lang.t('sim.result.empty.legal') }}</p>
              </div>
            }
          </div>
        }

        <!-- Tab Content: Narasi Kasus -->
        @if (activeTab() === 'narasi') {
          <div class="tab-content animate-fade-in">
            <div class="result-card glass-card">
              <div class="card-label">{{ lang.t('sim.result.label.narasi') }}</div>
              <p class="card-body narasi-text">{{ simulation()!.narasi_kasus }}</p>
            </div>

            @if (simulation()!.kata_kunci) {
              <div class="result-card glass-card">
                <div class="card-label">{{ lang.t('sim.result.label.keywords') }}</div>
                <div class="keywords-wrap">
                  @for (kw of getKeywords(); track kw) {
                    <span class="keyword-tag">{{ kw }}</span>
                  }
                </div>
              </div>
            }
          </div>
        }
      }

      @if (!simulation() && !loading() && !translating()) {
        <div class="empty-state glass-card animate-fade-in">
          <h3>{{ lang.t('sim.result.not.found') }}</h3>
          <p>{{ lang.t('sim.result.not.found.desc') }}</p>
          <a routerLink="/dashboard" class="btn btn-primary" style="margin-top: 16px;">{{ lang.t('sim.result.back.dashboard') }}</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .result-header {
      margin-bottom: var(--spacing-xl);
    }

    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-md);
    }

    .result-date {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    /* Tabs */
    .tab-nav {
      display: flex;
      gap: 4px;
      margin-bottom: var(--spacing-lg);
      background: rgba(17, 24, 39, 0.5);
      padding: 4px;
      border-radius: var(--border-radius-md);
      border: 1px solid var(--border-color);
      overflow-x: auto;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      background: transparent;
      color: var(--color-text-secondary);
      border-radius: var(--border-radius-sm);
      font-weight: 600;
      font-size: 0.8125rem;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }

    .tab-btn:hover {
      background: rgba(59, 130, 246, 0.06);
      color: var(--color-text-primary);
    }

    .tab-btn.active {
      background: rgba(59, 130, 246, 0.12);
      color: var(--color-accent-blue-light);
    }

    /* Cards */
    .tab-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      max-width: 900px;
    }

    .result-card {
      padding: var(--spacing-lg);
    }

    .result-card:hover {
      transform: none;
    }

    .card-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--color-accent-blue-light);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: var(--spacing-sm);
    }

    .result-card h2 {
      margin-bottom: var(--spacing-sm);
    }

    .card-body {
      color: var(--color-text-secondary);
      font-size: 0.9375rem;
      line-height: 1.7;
      white-space: pre-line;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--border-color);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
    }

    /* Timeline */
    .steps-timeline {
      display: flex;
      flex-direction: column;
      gap: 0;
      margin-top: var(--spacing-sm);
    }

    .timeline-item {
      display: flex;
      gap: var(--spacing-md);
      position: relative;
      padding-bottom: var(--spacing-lg);
      animation: fadeIn 0.4s ease forwards;
    }

    .timeline-item:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 17px;
      top: 38px;
      bottom: 0;
      width: 2px;
      background: var(--border-color);
    }

    .timeline-marker {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(59, 130, 246, 0.12);
      border: 2px solid rgba(59, 130, 246, 0.3);
      color: var(--color-accent-blue-light);
      font-weight: 800;
      font-size: 0.8125rem;
      flex-shrink: 0;
      z-index: 1;
    }

    .timeline-content {
      flex: 1;
      min-width: 0;
    }

    .timeline-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .timeline-header h3 {
      font-size: 0.9375rem;
    }

    .activity-list {
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .activity-list li {
      position: relative;
      padding-left: 18px;
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
    }

    .activity-list li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-accent-cyan);
    }

    /* Evaluation */
    .eval-grid {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      margin-top: var(--spacing-sm);
    }

    .eval-item {
      padding: var(--spacing-md);
      background: rgba(59, 130, 246, 0.03);
      border-radius: var(--border-radius-sm);
      border: 1px solid rgba(59, 130, 246, 0.08);
    }

    .eval-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .eval-name {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .eval-weight {
      font-weight: 800;
      font-size: 0.875rem;
      color: var(--color-accent-blue-light);
      font-family: var(--font-heading);
    }

    .eval-bar {
      height: 4px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .eval-bar-fill {
      height: 100%;
      background: var(--gradient-primary);
      border-radius: 2px;
      transition: width 0.8s ease;
    }

    .eval-desc {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    /* Accordion Legal Style */
    .legal-accordion-item {
      margin-bottom: var(--spacing-sm);
      overflow: hidden;
      border: 1px solid var(--border-color);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .legal-accordion-item.is-expanded {
      border-color: var(--color-accent-blue);
      background: rgba(59, 130, 246, 0.03);
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    }

    .accordion-header {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.3s;
    }

    .is-expanded .accordion-header {
      border-color: rgba(255, 255, 255, 0.05);
    }

    .expand-icon {
      color: var(--color-text-muted);
      transition: transform 0.3s ease;
      flex-shrink: 0;
    }

    .is-expanded .expand-icon {
      transform: rotate(180deg);
      color: var(--color-accent-blue-light);
    }

    .accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .is-expanded .accordion-content {
      max-height: 2000px;
    }

    .content-inner {
      padding: 0 var(--spacing-md) var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .section-label {
      font-size: 0.625rem;
      font-weight: 700;
      color: var(--color-accent-gold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .legal-desc {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
    }

    .judul-pasal-text {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-sm);
      line-height: 1.4;
    }

    .penalty-text {
      font-size: 0.8125rem;
      color: var(--color-text-primary);
      font-weight: 500;
      line-height: 1.5;
    }

    .keywords-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: var(--spacing-sm);
    }

    .keyword-tag {
      display: inline-flex;
      padding: 4px 12px;
      background: rgba(6, 182, 212, 0.1);
      color: var(--color-accent-blue-light);
      border-radius: var(--border-radius-full);
      font-size: 0.725rem;
      font-weight: 600;
      border: 1px solid rgba(59, 130, 246, 0.1);
    }

    .keyword-tag {
      display: inline-flex;
      padding: 4px 12px;
      background: rgba(6, 182, 212, 0.1);
      color: var(--color-accent-cyan);
      border-radius: var(--border-radius-full);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .narasi-text {
      white-space: pre-wrap;
    }

    .empty-state {
      text-align: center;
      padding: var(--spacing-2xl);
      color: var(--color-text-secondary);
    }

    .empty-state:hover {
      transform: none;
    }

    .checkbox-container {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    .checkbox-container input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }
    .checkmark {
      height: 18px;
      width: 18px;
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .checkbox-container:hover input ~ .checkmark {
      background-color: rgba(255, 255, 255, 0.2);
    }
    .checkbox-container input:checked ~ .checkmark {
      background-color: var(--color-accent-blue);
      border-color: var(--color-accent-blue);
    }
    .checkmark:after {
      content: "";
      display: none;
    }
    .checkbox-container input:checked ~ .checkmark:after {
      display: block;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      margin-bottom: 2px;
    }
    .eval-input:focus {
      outline: none;
      border-color: var(--color-accent-blue-light) !important;
    }

    @media (max-width: 600px) {
      .page-container {
        padding: 12px;
      }
      
      .page-title {
        font-size: 1.35rem;
        line-height: 1.2;
      }

      .result-header {
        margin-bottom: var(--spacing-lg);
      }

      .tab-nav {
         margin: 0 -4px var(--spacing-lg);
         border-radius: 0;
         border-left: none;
         border-right: none;
      }

      .tab-btn {
        padding: 12px 14px;
        font-size: 0.75rem;
        flex: 1;
        justify-content: center;
      }

      .tab-btn span {
        display: none;
      }

      .accordion-header {
        padding: 16px;
        align-items: flex-start;
      }

      .header-info {
        flex-direction: column-reverse;
        align-items: flex-start;
        gap: 6px;
      }

      .pasal-badge {
        font-size: 0.625rem;
        padding: 2px 8px;
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: var(--color-accent-blue-light);
        box-shadow: none;
      }

      .legal-title {
        font-size: 0.9375rem;
        font-weight: 700;
        line-height: 1.3;
        color: var(--color-text-primary);
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
      }
      
      .judul-pasal-text {
        font-size: 0.8125rem;
        color: var(--color-accent-gold);
        margin-bottom: 12px;
      }

      .content-inner {
        padding: 16px;
      }

      .section-label {
        font-size: 0.6rem;
      }

      .legal-desc {
        font-size: 0.75rem;
      }

      .penalty-section {
        padding: 10px;
        gap: 10px;
      }
      
      .penalty-text {
        font-size: 0.75rem;
      }
      
      .eval-actions {
        flex-direction: column;
        gap: 16px;
        align-items: stretch !important;
      }
      
      .eval-actions .btn {
        width: 100%;
        order: 1;
      }
      
      .progress-info {
        order: 2;
        text-align: center;
      }
    }

    @media (max-width: 768px) {
      .header-top {
        flex-direction: column-reverse;
        align-items: flex-start;
        gap: 12px;
      }

      .page-title {
        font-size: 1.5rem;
      }

      .result-card {
        padding: var(--spacing-md);
      }

      .meta-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }

    /* Translating banner */
    .translating-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: var(--border-radius-md);
      margin-bottom: var(--spacing-lg);
      color: var(--color-accent-blue-light);
      font-size: 0.875rem;
      font-weight: 500;
      animation: fadeIn 0.3s ease;
    }

    .translating-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(59, 130, 246, 0.3);
      border-top-color: var(--color-accent-blue-light);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class SimulationResultComponent implements OnInit {
  simulation = signal<Simulation | null>(null);
  result = signal<any>(null);
  legalRefs = signal<any[]>([]);
  loading = signal(true);
  translating = signal(false);
  activeTab = signal<'scenario' | 'legal' | 'narasi'>('scenario');

  checkedEvaluations = signal<Record<string, boolean>>({});
  penilaianTambahan = signal<number>(0);
  evaluasiMandiri = signal<string>('');
  isEvaluating = signal<boolean>(false);
  savedScore = signal<number | null>(null);
  expandedLegalId = signal<number | null>(null);

  private currentSimId: number | null = null;
  private isFirstLoad = true;

  constructor(
    private route: ActivatedRoute,
    private simulationService: SimulationService,
    public lang: LanguageService
  ) {
    effect(() => {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      const activeLang = this.lang.currentLang(); // reactive dependency
      if (id) {
        const isLangSwitch = (this.currentSimId === id) && !this.isFirstLoad;
        this.currentSimId = id;
        this.isFirstLoad = false;
        this.loadSimulation(id, activeLang, isLangSwitch);
      }
    });
  }

  ngOnInit(): void {
    // Handled reactively by the effect
  }

  loadSimulation(id: number, activeLang: string = 'id', isLangSwitch = false): void {
    if (isLangSwitch) {
      // Show subtle translating banner; don't clear existing simulation content
      this.translating.set(true);
    } else {
      this.loading.set(true);
    }
    this.simulationService.getSimulationDetail(id, activeLang).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.simulation.set(res.data);
          this.result.set(res.data.result || null);
          this.legalRefs.set(res.data.legalReferences || []);
          
          const r = res.data.result;
          if (r && r.skor_akhir !== null && r.skor_akhir !== undefined) {
            this.savedScore.set(r.skor_akhir);
            this.penilaianTambahan.set(r.penilaian_tambahan || 0);
            this.evaluasiMandiri.set(r.evaluasi_mandiri || '');
            if (r.checked_evaluations) {
              const checks = typeof r.checked_evaluations === 'string' ? JSON.parse(r.checked_evaluations) : r.checked_evaluations;
              this.checkedEvaluations.set(checks || {});
            }
          } else {
            this.savedScore.set(null);
            this.penilaianTambahan.set(0);
            this.evaluasiMandiri.set('');
            this.checkedEvaluations.set({});
          }
        }
        this.loading.set(false);
        this.translating.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.translating.set(false);
      },
    });
  }

  getScenarioTitle(r: any): string {
    if (r.skenario_rbt) {
      const parsed = typeof r.skenario_rbt === 'string' ? JSON.parse(r.skenario_rbt) : r.skenario_rbt;
      return parsed.judul || this.simulation()?.judul || '';
    }
    return this.simulation()?.judul || '';
  }

  getScenarioSummary(r: any): string {
    if (r.skenario_rbt) {
      const parsed = typeof r.skenario_rbt === 'string' ? JSON.parse(r.skenario_rbt) : r.skenario_rbt;
      return parsed.ringkasan || '';
    }
    return '';
  }

  getSteps(r: any): any[] {
    if (r.langkah_langkah) {
      return typeof r.langkah_langkah === 'string' ? JSON.parse(r.langkah_langkah) : r.langkah_langkah;
    }
    return [];
  }

  getEvalCriteria(r: any): any[] {
    if (r.evaluasi_kriteria) {
      return typeof r.evaluasi_kriteria === 'string' ? JSON.parse(r.evaluasi_kriteria) : r.evaluasi_kriteria;
    }
    return [];
  }

  getKeywords(): string[] {
    const sim = this.simulation();
    if (!sim?.kata_kunci) return [];
    return typeof sim.kata_kunci === 'string' ? JSON.parse(sim.kata_kunci as any) : sim.kata_kunci;
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

  getDifficultyBadge(level: string): string {
    const map: Record<string, string> = {
      dasar: 'badge-green', menengah: 'badge-gold', lanjutan: 'badge-red',
    };
    return map[level] || 'badge-blue';
  }

  isChecked(kriteria: string): boolean {
    return !!this.checkedEvaluations()[kriteria];
  }

  toggleCheck(kriteria: string): void {
    if (this.savedScore() !== null) return;
    const current = { ...this.checkedEvaluations() };
    current[kriteria] = !current[kriteria];
    this.checkedEvaluations.set(current);
  }

  getProgressPercentage(): number {
    const r = this.result();
    if (!r) return 0;
    const criteriaList = this.getEvalCriteria(r);
    let total = 0;
    for (const c of criteriaList) {
      if (this.isChecked(c.kriteria)) {
        total += Number(c.bobot) || 0;
      }
    }
    return Math.min(100, Math.round(total));
  }

  saveEvaluation(): void {
    const sim = this.simulation();
    if (!sim) return;
    
    this.isEvaluating.set(true);
    const cb = this.getProgressPercentage();
    const pt = Number(this.penilaianTambahan()) || 0;
    const finalScore = cb + pt;

    const payload = {
      skor_akhir: finalScore,
      penilaian_tambahan: pt,
      evaluasi_mandiri: this.evaluasiMandiri(),
      checked_evaluations: this.checkedEvaluations()
    };

    this.simulationService.saveEvaluation(sim.id, payload).subscribe({
      next: (res) => {
        this.isEvaluating.set(false);
        this.savedScore.set(finalScore);
        const curResult = this.result();
        this.result.set({
          ...curResult,
          skor_akhir: finalScore,
          penilaian_tambahan: pt,
          evaluasi_mandiri: this.evaluasiMandiri(),
          checked_evaluations: this.checkedEvaluations()
        });
      },
      error: (err) => {
        this.isEvaluating.set(false);
        alert('Gagal menyimpan evaluasi: ' + (err.error?.message || 'Error'));
      }
    });
  }

  toggleLegalExpand(id: number): void {
    if (this.expandedLegalId() === id) {
      this.expandedLegalId.set(null);
    } else {
      this.expandedLegalId.set(id);
    }
  }
}
