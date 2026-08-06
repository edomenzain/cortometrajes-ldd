import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'ldd.tema';

export type Tema = 'claro' | 'oscuro';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly _tema = signal<Tema>(this.leerInicial());
  readonly tema = this._tema.asReadonly();

  constructor() {
    effect(() => {
      const tema = this._tema();
      document.documentElement.dataset['theme'] = tema === 'oscuro' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, tema);
    });
  }

  alternar(): void {
    this._tema.update((t) => (t === 'claro' ? 'oscuro' : 'claro'));
  }

  private leerInicial(): Tema {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
      ? 'oscuro'
      : 'claro';
  }
}
