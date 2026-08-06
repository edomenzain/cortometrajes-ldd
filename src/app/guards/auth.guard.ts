import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const sesionActiva: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.usuarioActual() ? true : router.parseUrl('/login');
};

export const soloAdmin: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.usuarioActual()) return router.parseUrl('/login');
  return auth.esAdmin() ? true : router.parseUrl('/resultados');
};

export const soloJuez: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.usuarioActual()) return router.parseUrl('/login');
  return auth.esJuez() ? true : router.parseUrl('/resultados');
};
