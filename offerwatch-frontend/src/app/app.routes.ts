import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppLayoutComponent } from './layout/app-layout';

export const routes: Routes = [
  // ── Public auth routes (no layout) ──────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent)
  },

  // ── Authenticated routes (wrapped in shared layout) ──────────────────────
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('./features/stats/stats').then(m => m.StatsComponent),
      },
      {
        path: 'interview-prep',
        loadComponent: () =>
          import('./features/interview-prep/interview-prep').then(m => m.InterviewPrepComponent),
      },
      {
        path: 'behavioral-stories',
        loadComponent: () =>
          import('./features/behavioral-stories/behavioral-stories').then(m => m.BehavioralStoriesComponent),
      },
      {
        path: 'applications/:id',
        loadComponent: () =>
          import('./features/application-detail/application-detail')
            .then(m => m.ApplicationDetailComponent),
      },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────────────────────
  { path: '**', redirectTo: 'dashboard' },
];
