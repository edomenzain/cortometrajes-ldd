import { Injectable, effect, signal } from '@angular/core';
import { Cortometraje } from '../models/cortometraje.model';

const STORAGE_KEY = 'ldd.cortometrajes';

@Injectable({ providedIn: 'root' })
export class CortometrajesService {
  private readonly _cortometrajes = signal<Cortometraje[]>(this.leerAlmacenamiento());
  readonly cortometrajes = this._cortometrajes.asReadonly();

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._cortometrajes()));
    });
  }

  agregar(datos: { titulo: string; descripcion: string; youtubeUrl?: string }): void {
    const nuevo: Cortometraje = {
      id: crypto.randomUUID(),
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      youtubeUrl: datos.youtubeUrl?.trim() || undefined,
      creadoEn: Date.now(),
    };
    this._cortometrajes.update((lista) => [...lista, nuevo]);
  }

  eliminar(id: string): void {
    this._cortometrajes.update((lista) => lista.filter((c) => c.id !== id));
  }

  porId(id: string): Cortometraje | undefined {
    return this._cortometrajes().find((c) => c.id === id);
  }

  private leerAlmacenamiento(): Cortometraje[] {
    try {
      const crudo = localStorage.getItem(STORAGE_KEY);
      return crudo ? (JSON.parse(crudo) as Cortometraje[]) : [];
    } catch {
      return [];
    }
  }
}
