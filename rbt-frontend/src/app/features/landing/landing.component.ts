import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="landing-page">
      <!-- Background Effects -->
      <div class="landing-bg">
        <div class="bg-orb bg-orb-1"></div>
        <div class="bg-orb bg-orb-2"></div>
        <div class="bg-orb bg-orb-3"></div>
        <div class="bg-grid"></div>
      </div>

      <!-- Header / Top Navigation -->
      <header class="landing-header animate-fade-in">
        <div class="header-container">
          <div class="brand">
            <img src="SPN_PoldaSumut.png" alt="Logo SPN" class="brand-logo" />
            <div class="brand-text">
              <span class="brand-title">{{ lang.t('nav.brand.title') }}</span>
              <span class="brand-accent">{{ lang.t('nav.brand.accent') }}</span>
            </div>
          </div>
          
          <div class="nav-actions">
            <!-- Language Switcher -->
            <div class="lang-switcher">
              <button 
                [class.active]="lang.currentLang() === 'id'" 
                (click)="lang.setLanguage('id')"
                class="lang-btn"
                id="lang-btn-id"
              >
                ID
              </button>
              <button 
                [class.active]="lang.currentLang() === 'en'" 
                (click)="lang.setLanguage('en')"
                class="lang-btn"
                id="lang-btn-en"
              >
                EN
              </button>
            </div>
            
            <button class="btn btn-primary btn-nav" (click)="navigateToAuth()">
              {{ auth.isAuthenticated() ? lang.t('nav.btn.dashboard') : lang.t('nav.btn.login') }}
            </button>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-container">
          <div class="hero-content animate-fade-in" style="animation-delay: 0.2s">
            <div class="hero-badge">
              <span class="badge-icon">⚡</span>
              <span>{{ lang.t('landing.hero.badge') }}</span>
            </div>
            <h1 class="hero-title">
              {{ lang.t('landing.hero.title1') }} <span class="text-glow">{{ lang.t('landing.hero.title2') }}</span>
            </h1>
            <p class="hero-description">
              {{ lang.t('landing.hero.description') }}
            </p>
            <div class="hero-actions">
              <button class="btn btn-primary btn-lg btn-glow" (click)="navigateToAuth()">
                {{ auth.isAuthenticated() ? lang.t('nav.btn.dashboard') : lang.t('landing.hero.btn.start') }}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 4px;">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12,5 19,12 12,19"/>
                </svg>
              </button>
              <button class="btn btn-secondary btn-lg" (click)="scrollToFeatures()">
                {{ lang.t('landing.hero.btn.features') }}
              </button>
            </div>
          </div>

          <!-- Hero Emblem Graphic -->
          <div class="hero-graphic animate-fade-in" style="animation-delay: 0.4s">
            <div class="emblem-card glass-card">
              <div class="emblem-glow"></div>
              <img src="SPN_PoldaSumut.png" alt="Emblem SPN Polda Sumut" class="emblem-img" />
              <div class="emblem-title">{{ lang.t('landing.hero.emblem.title') }}</div>
              <div class="emblem-subtitle">{{ lang.t('landing.hero.emblem.subtitle') }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section" id="features">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">{{ lang.t('landing.features.title') }}</h2>
            <p class="section-subtitle">{{ lang.t('landing.features.subtitle') }}</p>
          </div>

          <div class="carousel-container">
            <div class="carousel-track">
              <!-- Group 1 -->
              <div class="carousel-group">
                <!-- Feature 1: Sabhara -->
                <div class="feature-card glass-card">
                  <div class="feature-icon icon-blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                      <polyline points="2 17 12 22 22 17"/>
                      <polyline points="2 12 12 17 22 12"/>
                    </svg>
                  </div>
                  <h3>{{ lang.t('landing.features.sabhara.title') }}</h3>
                  <p>{{ lang.t('landing.features.sabhara.desc') }}</p>
                </div>

                <!-- Feature 2: Reserse -->
                <div class="feature-card glass-card">
                  <div class="feature-icon icon-red">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      <line x1="11" y1="8" x2="11" y2="14"/>
                      <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                  </div>
                  <h3>{{ lang.t('landing.features.reserse.title') }}</h3>
                  <p>{{ lang.t('landing.features.reserse.desc') }}</p>
                </div>

                <!-- Feature 3: Intel -->
                <div class="feature-card glass-card">
                  <div class="feature-icon icon-gold">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <h3>{{ lang.t('landing.features.intel.title') }}</h3>
                  <p>{{ lang.t('landing.features.intel.desc') }}</p>
                </div>

                <!-- Feature 4: Lalu Lintas -->
                <div class="feature-card glass-card">
                  <div class="feature-icon icon-green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <h3>{{ lang.t('landing.features.lantas.title') }}</h3>
                  <p>{{ lang.t('landing.features.lantas.desc') }}</p>
                </div>

                <!-- Feature 5: Binmas -->
                <div class="feature-card glass-card">
                  <div class="feature-icon icon-purple">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <h3>{{ lang.t('landing.features.binmas.title') }}</h3>
                  <p>{{ lang.t('landing.features.binmas.desc') }}</p>
                </div>
              </div>

              <!-- Group 2 (Duplicate for seamless loop) -->
              <div class="carousel-group">
                <!-- Feature 1: Sabhara -->
                <div class="feature-card glass-card">
                  <div class="feature-icon icon-blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                      <polyline points="2 17 12 22 22 17"/>
                      <polyline points="2 12 12 17 22 12"/>
                    </svg>
                  </div>
                  <h3>{{ lang.t('landing.features.sabhara.title') }}</h3>
                  <p>{{ lang.t('landing.features.sabhara.desc') }}</p>
                </div>

                <!-- Feature 2: Reserse -->
                <div class="feature-card glass-card">
                  <div class="feature-icon icon-red">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      <line x1="11" y1="8" x2="11" y2="14"/>
                      <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                  </div>
                  <h3>{{ lang.t('landing.features.reserse.title') }}</h3>
                  <p>{{ lang.t('landing.features.reserse.desc') }}</p>
                </div>

                <!-- Feature 3: Intel -->
                <div class="feature-card glass-card">
                  <div class="feature-icon icon-gold">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <h3>{{ lang.t('landing.features.intel.title') }}</h3>
                  <p>{{ lang.t('landing.features.intel.desc') }}</p>
                </div>

                <!-- Feature 4: Lalu Lintas -->
                <div class="feature-card glass-card">
                  <div class="feature-icon icon-green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <h3>{{ lang.t('landing.features.lantas.title') }}</h3>
                  <p>{{ lang.t('landing.features.lantas.desc') }}</p>
                </div>

                <!-- Feature 5: Binmas -->
                <div class="feature-card glass-card">
                  <div class="feature-icon icon-purple">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <h3>{{ lang.t('landing.features.binmas.title') }}</h3>
                  <p>{{ lang.t('landing.features.binmas.desc') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How it Works Section -->
      <section class="how-it-works">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">{{ lang.t('landing.flow.title') }}</h2>
            <p class="section-subtitle">{{ lang.t('landing.flow.subtitle') }}</p>
          </div>

          <div class="steps-container">
            <div class="step-item">
              <div class="step-num">{{ lang.t('landing.flow.step1.num') }}</div>
              <h4>{{ lang.t('landing.flow.step1.title') }}</h4>
              <p>{{ lang.t('landing.flow.step1.desc') }}</p>
            </div>
            <div class="step-item">
              <div class="step-num">{{ lang.t('landing.flow.step2.num') }}</div>
              <h4>{{ lang.t('landing.flow.step2.title') }}</h4>
              <p>{{ lang.t('landing.flow.step2.desc') }}</p>
            </div>
            <div class="step-item">
              <div class="step-num">{{ lang.t('landing.flow.step3.num') }}</div>
              <h4>{{ lang.t('landing.flow.step3.title') }}</h4>
              <p>{{ lang.t('landing.flow.step3.desc') }}</p>
            </div>
            <div class="step-item">
              <div class="step-num">{{ lang.t('landing.flow.step4.num') }}</div>
              <h4>{{ lang.t('landing.flow.step4.title') }}</h4>
              <p>{{ lang.t('landing.flow.step4.desc') }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-container">
          <p>{{ lang.t('landing.footer.text') }}</p>
          <p class="footer-sub">{{ lang.t('landing.footer.sub') }}</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      position: relative;
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      min-height: 100vh;
      overflow-x: hidden;
      font-family: var(--font-body);
    }

    /* Background Orbs & Grid */
    .landing-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.6;
      animation: float 12s ease-in-out infinite;
    }

    .bg-orb-1 {
      width: 500px;
      height: 500px;
      background: rgba(59, 130, 246, 0.15);
      top: -150px;
      left: -100px;
      animation-delay: 0s;
    }

    .bg-orb-2 {
      width: 450px;
      height: 450px;
      background: rgba(6, 182, 212, 0.1);
      top: 30%;
      right: -150px;
      animation-delay: 4s;
    }

    .bg-orb-3 {
      width: 400px;
      height: 400px;
      background: rgba(139, 92, 246, 0.08);
      bottom: -100px;
      left: 20%;
      animation-delay: 8s;
    }

    .bg-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
      background-size: 80px 80px;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(30px, -30px) scale(1.05); }
    }

    /* Header Nav */
    .landing-header {
      position: sticky;
      top: 0;
      width: 100%;
      background: rgba(10, 15, 30, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      z-index: 10;
    }

    .header-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 14px var(--spacing-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .brand-logo {
      height: 42px;
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
    }

    .brand-accent {
      font-size: 0.8125rem;
      font-weight: 700;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    /* Language Switcher */
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
    }

    .lang-btn:hover {
      color: var(--color-text-primary);
    }

    .lang-btn.active {
      background: var(--gradient-primary);
      color: #fff;
      box-shadow: var(--shadow-sm);
    }

    .btn-nav {
      padding: 8px 18px;
      font-size: 0.8125rem;
    }

    /* Hero Section */
    .hero-section {
      position: relative;
      z-index: 1;
      padding: 80px 0;
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero-container {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 60px;
      align-items: center;
      padding: 0 var(--spacing-lg);
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: 6px 14px;
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.15);
      border-radius: var(--border-radius-full);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-accent-blue-light);
      margin-bottom: var(--spacing-lg);
    }

    .hero-title {
      font-family: var(--font-heading);
      font-size: 3.25rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: var(--spacing-md);
      color: var(--color-text-primary);
    }

    .text-glow {
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      position: relative;
    }

    .hero-description {
      font-size: 1.0625rem;
      color: var(--color-text-secondary);
      line-height: 1.7;
      margin-bottom: var(--spacing-xl);
      max-width: 600px;
    }

    .hero-actions {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }

    .btn-glow {
      position: relative;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
    }

    .btn-glow:hover {
      box-shadow: 0 0 25px rgba(59, 130, 246, 0.5);
    }

    /* Hero Emblem Graphic */
    .hero-graphic {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .emblem-card {
      position: relative;
      padding: var(--spacing-2xl) var(--spacing-xl);
      border-radius: var(--border-radius-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 320px;
      text-align: center;
      background: rgba(17, 24, 39, 0.55);
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .emblem-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 40px rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.4);
    }

    .emblem-glow {
      position: absolute;
      width: 140px;
      height: 140px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%);
      top: 50px;
      z-index: 0;
      pointer-events: none;
    }

    .emblem-img {
      height: 150px;
      width: auto;
      object-fit: contain;
      z-index: 1;
      margin-bottom: var(--spacing-lg);
      filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.2));
    }

    .emblem-title {
      font-family: var(--font-heading);
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--color-text-primary);
      z-index: 1;
      margin-bottom: 4px;
      letter-spacing: 0.05em;
    }

    .emblem-subtitle {
      font-size: 0.75rem;
      color: var(--color-accent-gold);
      font-weight: 700;
      z-index: 1;
      letter-spacing: 0.1em;
    }

    /* Features Section */
    .features-section {
      padding: 80px 0;
      background: rgba(17, 24, 39, 0.4);
      position: relative;
      z-index: 1;
    }

    .section-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--spacing-lg);
    }

    .section-header {
      text-align: center;
      margin-bottom: 50px;
      max-width: 650px;
      margin-left: auto;
      margin-right: auto;
    }

    .section-title {
      font-family: var(--font-heading);
      font-size: 2.25rem;
      font-weight: 800;
      margin-bottom: var(--spacing-xs);
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .section-subtitle {
      color: var(--color-text-secondary);
      font-size: 1rem;
    }

    .carousel-container {
      overflow: hidden;
      width: 100%;
      position: relative;
      padding: var(--spacing-md) 0;
    }

    .carousel-container::before,
    .carousel-container::after {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      width: 120px;
      z-index: 2;
      pointer-events: none;
    }

    .carousel-container::before {
      left: 0;
      background: linear-gradient(to right, #0a0f1e, transparent);
    }

    .carousel-container::after {
      right: 0;
      background: linear-gradient(to left, #0a0f1e, transparent);
    }

    .carousel-track {
      display: flex;
      width: max-content;
      animation: scrollMarquee 35s linear infinite;
    }

    .carousel-track:hover {
      animation-play-state: paused;
    }

    .carousel-group {
      display: flex;
      gap: var(--spacing-lg);
      padding-right: var(--spacing-lg);
    }

    .feature-card {
      width: 320px;
      flex-shrink: 0;
      padding: var(--spacing-xl);
      border-radius: var(--border-radius-lg);
      transition: all var(--transition-normal);
    }

    @keyframes scrollMarquee {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }

    .feature-card h3 {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: var(--spacing-sm);
      color: var(--color-text-primary);
    }

    .feature-card p {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
    }

    .feature-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--spacing-md);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }

    .icon-blue {
      background: rgba(59, 130, 246, 0.15);
      color: var(--color-accent-blue-light);
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .icon-cyan {
      background: rgba(6, 182, 212, 0.15);
      color: var(--color-accent-cyan);
      border: 1px solid rgba(6, 182, 212, 0.3);
    }

    .icon-red {
      background: rgba(239, 68, 68, 0.15);
      color: var(--color-accent-red);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .icon-green {
      background: rgba(16, 185, 129, 0.15);
      color: var(--color-accent-green);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .icon-purple {
      background: rgba(139, 92, 246, 0.15);
      color: var(--color-accent-purple);
      border: 1px solid rgba(139, 92, 246, 0.3);
    }

    .icon-gold {
      background: rgba(245, 158, 11, 0.15);
      color: var(--color-accent-gold-light);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    /* How It Works Section */
    .how-it-works {
      padding: 80px 0;
      position: relative;
      z-index: 1;
    }

    .steps-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--spacing-xl);
      margin-top: 40px;
    }

    .step-item {
      position: relative;
      padding: var(--spacing-md);
    }

    .step-num {
      font-family: var(--font-heading);
      font-size: 3rem;
      font-weight: 800;
      color: rgba(59, 130, 246, 0.15);
      line-height: 1;
      margin-bottom: var(--spacing-sm);
    }

    .step-item h4 {
      font-family: var(--font-heading);
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: var(--spacing-xs);
      color: var(--color-text-primary);
    }

    .step-item p {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      line-height: 1.6;
    }

    /* Footer */
    .landing-footer {
      border-top: 1px solid var(--border-color);
      padding: 40px 0;
      text-align: center;
      background: rgba(10, 15, 30, 0.9);
      position: relative;
      z-index: 1;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--spacing-lg);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .footer-sub {
      font-size: 0.75rem;
    }

    /* Responsive adjustments */
    @media (max-width: 992px) {
      .hero-container {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 40px;
      }

      .hero-description {
        margin-left: auto;
        margin-right: auto;
      }

      .hero-actions {
        justify-content: center;
      }

      .hero-title {
        font-size: 2.5rem;
      }
    }

    @media (max-width: 576px) {
      .landing-header .btn-nav {
        padding: 6px 12px;
        font-size: 0.75rem;
      }

      .hero-title {
        font-size: 2rem;
      }

      .hero-actions {
        flex-direction: column;
        width: 100%;
      }

      .hero-actions button {
        width: 100%;
      }
    }
  `]
})
export class LandingComponent {
  constructor(
    public auth: AuthService,
    private router: Router,
    public lang: LanguageService
  ) {}

  navigateToAuth(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  scrollToFeatures(): void {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
