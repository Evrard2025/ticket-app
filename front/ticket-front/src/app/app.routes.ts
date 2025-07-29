import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing-page/landing-page.component').then(m => m.LandingPageComponent) },
  { path: 'events', loadComponent: () => import('./pages/event-list/event-list.component').then(m => m.EventListComponent) },
  { path: 'event/:id', loadComponent: () => import('./pages/event-detail/event-detail.component').then(m => m.EventDetailComponent) },
  { path: 'auth', loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [AuthGuard] },
  { path: 'confirmation', loadComponent: () => import('./pages/confirmation/confirmation.component').then(m => m.ConfirmationComponent), canActivate: [AuthGuard] },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [AuthGuard] },
];
