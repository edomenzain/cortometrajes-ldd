import { Injectable, computed, effect, signal } from '@angular/core';
import { Usuario } from '../models/usuario.model';

const STORAGE_KEY_USUARIOS = 'ldd.usuarios';
const STORAGE_KEY_SESION = 'ldd.sesion';

const ADMIN_SEMILLA = { nombre: 'Administrador', email: 'admin@ldd.mx', password: 'admin123' };

async function hashear(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const buffer = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Autenticación local: usuarios y contraseñas (hasheadas) viven en localStorage.
 * Sirve para controlar acceso en un evento sin servidor; no reemplaza un backend real.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _usuarios = signal<Usuario[]>(this.leerUsuarios());
  private readonly _sesionId = signal<string | null>(localStorage.getItem(STORAGE_KEY_SESION));

  readonly usuarioActual = computed(() => this._usuarios().find((u) => u.id === this._sesionId()) ?? null);
  readonly esAdmin = computed(() => this.usuarioActual()?.rol === 'admin');
  readonly esJuez = computed(() => this.usuarioActual()?.rol === 'juez');
  readonly jueces = computed(() => this._usuarios().filter((u) => u.rol === 'juez'));

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(this._usuarios()));
    });
    effect(() => {
      const id = this._sesionId();
      if (id) localStorage.setItem(STORAGE_KEY_SESION, id);
      else localStorage.removeItem(STORAGE_KEY_SESION);
    });
    if (this._usuarios().length === 0) {
      this.sembrarAdmin();
    }
  }

  async iniciarSesion(email: string, password: string): Promise<boolean> {
    const hash = await hashear(password);
    const correo = email.trim().toLowerCase();
    const usuario = this._usuarios().find((u) => u.email.toLowerCase() === correo && u.hash === hash);
    if (!usuario) return false;
    this._sesionId.set(usuario.id);
    return true;
  }

  cerrarSesion(): void {
    this._sesionId.set(null);
  }

  async agregarJuez(datos: { nombre: string; email: string; password: string }): Promise<{ ok: boolean; error?: string }> {
    const nombre = datos.nombre.trim();
    const email = datos.email.trim().toLowerCase();
    if (!nombre || !email || datos.password.length < 6) {
      return { ok: false, error: 'Completa nombre, email y una contraseña de al menos 6 caracteres.' };
    }
    if (this._usuarios().some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, error: 'Ya existe un usuario con ese email.' };
    }
    const nuevo: Usuario = {
      id: crypto.randomUUID(),
      nombre,
      email,
      rol: 'juez',
      hash: await hashear(datos.password),
      creadoEn: Date.now(),
    };
    this._usuarios.update((lista) => [...lista, nuevo]);
    return { ok: true };
  }

  eliminarJuez(id: string): void {
    this._usuarios.update((lista) => lista.filter((u) => u.id !== id));
    if (this._sesionId() === id) this._sesionId.set(null);
  }

  private async sembrarAdmin(): Promise<void> {
    const admin: Usuario = {
      id: crypto.randomUUID(),
      nombre: ADMIN_SEMILLA.nombre,
      email: ADMIN_SEMILLA.email,
      rol: 'admin',
      hash: await hashear(ADMIN_SEMILLA.password),
      creadoEn: Date.now(),
    };
    this._usuarios.set([admin]);
  }

  private leerUsuarios(): Usuario[] {
    try {
      const crudo = localStorage.getItem(STORAGE_KEY_USUARIOS);
      return crudo ? (JSON.parse(crudo) as Usuario[]) : [];
    } catch {
      return [];
    }
  }
}
