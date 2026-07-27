import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="navbar" id="main-navbar">
      <div class="navbar-left">
        <button class="menu-toggle" (click)="sidebar.toggle()" id="btn-toggle-sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div class="navbar-brand">
          <img src="SPN_PoldaSumut.png" alt="Logo" class="brand-logo" />
          <div class="brand-text">
            <span class="brand-title">{{ lang.t('nav.brand.title') }}</span>
            <span class="brand-accent">{{ lang.t('nav.brand.accent') }}</span>
          </div>
        </div>
      </div>

      <div class="navbar-right">

        @if (auth.user(); as user) {
          <div class="user-info" id="user-profile-nav">
            <img
              [src]="user.picture || 'https://ui-avatars.com/api/?name=' + user.name + '&background=3b82f6&color=fff'"
              [alt]="user.name"
              class="user-avatar"
            />
            <div class="user-details">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-role">{{ user.role | uppercase }}</span>
            </div>
          </div>
          <button class="btn-logout" (click)="auth.logout()" id="btn-logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span class="btn-logout-text">{{ lang.t('nav.logout') }}</span>
          </button>
        }
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--navbar-height);
      padding: 0 var(--spacing-lg);
      background: rgba(10, 15, 30, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .navbar-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .menu-toggle {
      display: none;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: transparent;
      color: var(--color-text-secondary);
      border-radius: var(--border-radius-sm);
      transition: all var(--transition-fast);
    }

    .menu-toggle:hover {
      background: rgba(59, 130, 246, 0.1);
      color: var(--color-text-primary);
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .brand-logo {
      height: 36px;
      width: auto;
      object-fit: contain;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }

    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--color-text-primary);
      white-space: nowrap;
    }

    .brand-accent {
      font-size: 0.875rem;
      font-weight: 700;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      white-space: nowrap;
    }

    .navbar-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }



    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid var(--border-color);
      object-fit: cover;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .user-role {
      font-size: 0.6875rem;
      color: var(--color-accent-gold);
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .btn-logout {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-accent-red);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: var(--border-radius-sm);
      font-size: 0.8125rem;
      font-weight: 600;
      transition: all var(--transition-fast);
    }

    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.4);
    }

    @media (max-width: 768px) {
      .navbar {
        padding: 0 var(--spacing-md);
      }

      .menu-toggle {
        display: flex;
      }

      .brand-title {
        font-size: 0.95rem;
      }

      .brand-accent {
        font-size: 0.75rem;
      }

      .user-details {
        display: none;
      }

      .btn-logout-text {
        display: none;
      }

      .btn-logout {
        padding: 8px;
      }
    }
  `],
})
export class NavbarComponent {
  constructor(
    public auth: AuthService,
    public sidebar: SidebarService,
    public lang: LanguageService
  ) {}

  toggleSidebar(): void {
    this.sidebar.toggle();
  }
}
