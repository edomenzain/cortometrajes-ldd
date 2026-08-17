import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

function esperarListo(auth: AuthService): Promise<void> {
  if (auth.listo()) return Promise.resolve();
  return firstValueFrom(toObservable(auth.listo).pipe(filter(Boolean), take(1))).then(() => undefined);
}

export const sesionActiva: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await esperarListo(auth);
  return auth.usuarioActual() ? true : router.parseUrl('/login');
};

export const soloInvitado: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await esperarListo(auth);
  if (!auth.usuarioActual()) return true;
  return router.parseUrl(auth.esAdmin() ? '/dashboard' : '/evaluar');
};

export const soloAdmin: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await esperarListo(auth);
  if (!auth.usuarioActual()) return router.parseUrl('/login');
  return auth.esAdmin() ? true : router.parseUrl('/resultados');
};

export const soloJuez: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await esperarListo(auth);
  if (!auth.usuarioActual()) return router.parseUrl('/login');
  return auth.esJuez() ? true : router.parseUrl('/resultados');
};

export const resultadosGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await esperarListo(auth);
  if (!auth.usuarioActual()) return router.parseUrl('/login');
  return auth.esJuez() ? router.parseUrl('/evaluar') : true;
};
