import { Injectable, effect, signal } from '@angular/core';
import { Premiacion } from '../models/premiacion.model';

const STORAGE_KEY = 'ldd.premiaciones';

@Injectable({ providedIn: 'root' })
export class PremiacionesService {
  private readonly _premiaciones = signal<Premiacion[]>(this.leerAlmacenamiento());
  readonly premiaciones = this._premiaciones.asReadonly();

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._premiaciones()));
    });
  }

  agregar(nombre: string): void {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    this._premiaciones.update((lista) => [...lista, { id: crypto.randomUUID(), nombre: nombreLimpio }]);
  }

  eliminar(id: string): void {
    this._premiaciones.update((lista) => lista.filter((p) => p.id !== id));
  }

  porId(id: string): Premiacion | undefined {
    return this._premiaciones().find((p) => p.id === id);
  }

  private leerAlmacenamiento(): Premiacion[] {
    try {
      const crudo = localStorage.getItem(STORAGE_KEY);
      return crudo ? (JSON.parse(crudo) as Premiacion[]) : [];
    } catch {
      return [];
    }
  }
}
