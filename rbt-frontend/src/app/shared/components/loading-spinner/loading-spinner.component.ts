import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" [class.fullscreen]="fullscreen" id="loading-spinner">
      <div class="spinner-wrapper">
        <div class="spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        @if (message) {
          <p class="loading-message">{{ message }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl);
    }

    .loading-container.fullscreen {
      position: fixed;
      inset: 0;
      background: rgba(10, 15, 30, 0.8);
      backdrop-filter: blur(8px);
      z-index: 1000;
    }

    .spinner-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .spinner {
      width: 48px;
      height: 48px;
      position: relative;
    }

    .spinner-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid transparent;
    }

    .spinner-ring:nth-child(1) {
      border-top-color: var(--color-accent-blue);
      animation: spin 1s linear infinite;
    }

    .spinner-ring:nth-child(2) {
      inset: 4px;
      border-right-color: var(--color-accent-cyan);
      animation: spin 0.8s linear infinite reverse;
    }

    .spinner-ring:nth-child(3) {
      inset: 8px;
      border-bottom-color: var(--color-accent-gold);
      animation: spin 1.2s linear infinite;
    }

    .loading-message {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      text-align: center;
      animation: pulse 1.5s ease-in-out infinite;
    }
  `],
})
export class LoadingSpinnerComponent {
  @Input() message: string = '';
  @Input() fullscreen: boolean = false;
}
