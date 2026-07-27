import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../../core/services/sidebar.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" id="main-sidebar">
      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="nav-section-label">{{ lang.t('sidebar.menu') }}</span>

          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" id="nav-dashboard">
            <div class="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <span class="nav-label">{{ lang.t('sidebar.dashboard') }}</span>
          </a>

          <a routerLink="/simulation" routerLinkActive="active" class="nav-item" id="nav-simulation">
            <div class="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
              </svg>
            </div>
            <span class="nav-label">{{ lang.t('sidebar.simulation') }}</span>
          </a>

          <a routerLink="/history" routerLinkActive="active" class="nav-item" id="nav-history">
            <div class="nav-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </div>
            <span class="nav-label">{{ lang.t('sidebar.history') }}</span>
          </a>
        </div>

        <div class="nav-section">
          <span class="nav-section-label">{{ lang.t('sidebar.specializations') }}</span>

          <div class="spec-badges">
            <span class="spec-badge spec-sabhara">Sabhara</span>
            <span class="spec-badge spec-reserse">Reserse</span>
            <span class="spec-badge spec-intel">Intel</span>
            <span class="spec-badge spec-lantas">Lantas</span>
            <span class="spec-badge spec-binmas">Binmas</span>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <!-- Language Switcher -->
        <div class="lang-switcher-wrapper">
          <span class="lang-label">{{ lang.t('sidebar.language') }}</span>
          <div class="lang-switcher">
            <button
              [class.active]="lang.currentLang() === 'id'"
              (click)="lang.setLanguage('id')"
              class="lang-btn"
              id="lang-btn-id"
            >ID</button>
            <button
              [class.active]="lang.currentLang() === 'en'"
              (click)="lang.setLanguage('en')"
              class="lang-btn"
              id="lang-btn-en"
            >EN</button>
          </div>
        </div>

        <div class="footer-brand">
          <span class="footer-text">SPN Polda Sumut</span>
          <span class="footer-version">v1.0.0</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: calc(100vh - var(--navbar-height));
      position: fixed;
      top: var(--navbar-height);
      left: 0;
      background: rgba(10, 15, 30, 0.6);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow-y: auto;
      z-index: 90;
      transition: transform var(--transition-normal);
    }

    .sidebar-nav {
      padding: var(--spacing-lg) var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .nav-section-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--color-text-muted);
      letter-spacing: 0.1em;
      padding: 0 var(--spacing-md);
      margin-bottom: var(--spacing-sm);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: 10px var(--spacing-md);
      border-radius: var(--border-radius-sm);
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all var(--transition-fast);
      position: relative;
    }

    .nav-item:hover {
      background: rgba(59, 130, 246, 0.08);
      color: var(--color-text-primary);
    }

    .nav-item.active {
      background: rgba(59, 130, 246, 0.12);
      color: var(--color-accent-blue-light);
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: var(--gradient-primary);
      border-radius: 0 2px 2px 0;
    }

    .nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .nav-label {
      white-space: nowrap;
    }

    .spec-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 var(--spacing-md);
    }

    .spec-badge {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: var(--border-radius-full);
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .spec-sabhara {
      background: rgba(59, 130, 246, 0.12);
      color: var(--color-accent-blue-light);
    }
    .spec-reserse {
      background: rgba(239, 68, 68, 0.12);
      color: var(--color-accent-red);
    }
    .spec-intel {
      background: rgba(245, 158, 11, 0.12);
      color: var(--color-accent-gold);
    }
    .spec-lantas {
      background: rgba(16, 185, 129, 0.12);
      color: var(--color-accent-green);
    }
    .spec-binmas {
      background: rgba(139, 92, 246, 0.12);
      color: var(--color-accent-purple);
    }

    /* Language Switcher */
    .lang-switcher-wrapper {
      padding: 0 var(--spacing-sm);
      margin-bottom: var(--spacing-md);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .lang-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--color-text-muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .lang-switcher {
      display: flex;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-full);
      padding: 2px;
      gap: 2px;
    }

    .lang-btn {
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-size: 0.725rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: var(--border-radius-full);
      transition: all var(--transition-fast);
      cursor: pointer;
      letter-spacing: 0.04em;
    }

    .lang-btn:hover {
      color: var(--color-text-primary);
    }

    .lang-btn.active {
      background: var(--gradient-primary);
      color: #fff;
      box-shadow: var(--shadow-sm);
    }

    .sidebar-footer {
      padding: var(--spacing-md);
      border-top: 1px solid var(--border-color);
    }

    .footer-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--spacing-sm);
    }

    .footer-text {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .footer-version {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        width: 280px;
        z-index: 1000;
        height: 100vh;
        top: 0;
        background: rgba(10, 15, 30, 0.98);
        box-shadow: none;
      }

      :host-context(.sidebar-open) .sidebar {
        transform: translateX(0);
        box-shadow: 20px 0 50px rgba(0, 0, 0, 0.5);
      }
    }
  `],
})
export class SidebarComponent {
  constructor(
    public sidebar: SidebarService,
    public lang: LanguageService
  ) {}
}
