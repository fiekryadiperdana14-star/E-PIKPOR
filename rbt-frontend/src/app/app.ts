import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { SidebarService } from './core/services/sidebar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    @if (auth.isAuthenticated() && !isPublicRoute()) {
      <app-navbar />
      <div class="app-layout" [class.sidebar-open]="sidebar.isOpen()">
        <app-sidebar />
        <div class="sidebar-overlay" (click)="sidebar.close()" [class.active]="sidebar.isOpen()"></div>
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: calc(100vh - var(--navbar-height));
    }

    .main-content {
      flex: 1;
      margin-left: var(--sidebar-width);
      min-height: calc(100vh - var(--navbar-height));
      transition: margin-left var(--transition-normal);
    }

    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 85;
      opacity: 0;
      transition: opacity var(--transition-normal);
      pointer-events: none;
    }

    .sidebar-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      z-index: 85;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    }

    .sidebar-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
      }

      .sidebar-overlay {
        display: block;
      }
    }
  `],
})
export class App {
  constructor(
    public auth: AuthService,
    public sidebar: SidebarService,
    private router: Router
  ) {}

  isPublicRoute(): boolean {
    return this.router.url === '/login' || this.router.url === '/' || this.router.url === '/landing';
  }
}
