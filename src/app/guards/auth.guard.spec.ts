import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { soloAdmin, soloJuez } from './auth.guard';

function esperarSemilla(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('auth guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('soloAdmin redirects to /login when no session', () => {
    const resultado = TestBed.runInInjectionContext(() => soloAdmin({} as never, {} as never));
    expect(resultado instanceof UrlTree).toBe(true);
    expect((resultado as UrlTree).toString()).toBe('/login');
  });

  it('soloAdmin allows the admin through', async () => {
    const auth = TestBed.inject(AuthService);
    await esperarSemilla();
    await auth.iniciarSesion('admin@ldd.mx', 'admin123');

    const resultado = TestBed.runInInjectionContext(() => soloAdmin({} as never, {} as never));
    expect(resultado).toBe(true);
  });

  it('soloJuez redirects a logged-in admin to /resultados', async () => {
    const auth = TestBed.inject(AuthService);
    await esperarSemilla();
    await auth.iniciarSesion('admin@ldd.mx', 'admin123');

    const resultado = TestBed.runInInjectionContext(() => soloJuez({} as never, {} as never));
    expect(resultado instanceof UrlTree).toBe(true);
    expect((resultado as UrlTree).toString()).toBe('/resultados');
  });
});
