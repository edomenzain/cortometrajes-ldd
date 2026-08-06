import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

function esperarSemilla(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('logs in the seeded admin with correct credentials', async () => {
    const auth = TestBed.inject(AuthService);
    await esperarSemilla();
    const ok = await auth.iniciarSesion('admin@ldd.mx', 'admin123');
    expect(ok).toBe(true);
    expect(auth.esAdmin()).toBe(true);
  });

  it('rejects wrong credentials', async () => {
    const auth = TestBed.inject(AuthService);
    await esperarSemilla();
    const ok = await auth.iniciarSesion('admin@ldd.mx', 'incorrecta');
    expect(ok).toBe(false);
    expect(auth.usuarioActual()).toBeNull();
  });

  it('adds a juez and rejects a duplicate email', async () => {
    const auth = TestBed.inject(AuthService);
    const primero = await auth.agregarJuez({ nombre: 'Ana', email: 'ana@ldd.mx', password: '123456' });
    expect(primero.ok).toBe(true);

    const duplicado = await auth.agregarJuez({ nombre: 'Otra Ana', email: 'ANA@ldd.mx', password: '654321' });
    expect(duplicado.ok).toBe(false);
    expect(auth.jueces().length).toBe(1);
  });

  it('logs out on cerrarSesion', async () => {
    const auth = TestBed.inject(AuthService);
    await esperarSemilla();
    await auth.iniciarSesion('admin@ldd.mx', 'admin123');
    auth.cerrarSesion();
    expect(auth.usuarioActual()).toBeNull();
  });
});
