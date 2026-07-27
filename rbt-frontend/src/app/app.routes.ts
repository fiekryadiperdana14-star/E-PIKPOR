import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'simulation',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/simulation/input/simulation-input.component').then(m => m.SimulationInputComponent),
  },
  {
    path: 'simulation/result/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/simulation/result/simulation-result.component').then(m => m.SimulationResultComponent),
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/history/history.component').then(m => m.HistoryComponent),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
