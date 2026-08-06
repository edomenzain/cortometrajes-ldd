import { Routes } from '@angular/router';
import { sesionActiva, soloAdmin, soloInvitado, soloJuez } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'resultados' },
  {
    path: 'login',
    canActivate: [soloInvitado],
    loadComponent: () => import('./pages/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'dashboard',
    canActivate: [soloAdmin],
    loadComponent: () => import('./pages/dashboard/dashboard-page').then((m) => m.DashboardPage),
  },
  {
    path: 'cortometrajes',
    canActivate: [soloAdmin],
    loadComponent: () => import('./pages/cortometrajes/cortometrajes-page').then((m) => m.CortometrajesPage),
  },
  {
    path: 'formulario',
    canActivate: [soloAdmin],
    loadComponent: () => import('./pages/formulario/formulario-page').then((m) => m.FormularioPage),
  },
  {
    path: 'jueces',
    canActivate: [soloAdmin],
    loadComponent: () => import('./pages/jueces/jueces-page').then((m) => m.JuecesPage),
  },
  {
    path: 'premiaciones',
    canActivate: [soloAdmin],
    loadComponent: () => import('./pages/premiaciones/premiaciones-page').then((m) => m.PremiacionesPage),
  },
  {
    path: 'evaluar',
    canActivate: [soloJuez],
    loadComponent: () => import('./pages/evaluar/evaluar-lista').then((m) => m.EvaluarLista),
  },
  {
    path: 'evaluar/:id',
    canActivate: [soloJuez],
    loadComponent: () => import('./pages/evaluar/evaluar-form').then((m) => m.EvaluarForm),
  },
  {
    path: 'resultados',
    canActivate: [sesionActiva],
    loadComponent: () => import('./pages/resultados/resultados-page').then((m) => m.ResultadosPage),
  },
  { path: '**', redirectTo: 'resultados' },
];
