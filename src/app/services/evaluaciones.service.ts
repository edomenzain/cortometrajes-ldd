import { Injectable, effect, signal } from '@angular/core';
import { Evaluacion } from '../models/evaluacion.model';

const STORAGE_KEY = 'ldd.evaluaciones';

@Injectable({ providedIn: 'root' })
export class EvaluacionesService {
  private readonly _evaluaciones = signal<Evaluacion[]>(this.leerAlmacenamiento());
  readonly evaluaciones = this._evaluaciones.asReadonly();

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._evaluaciones()));
    });
    window.addEventListener('storage', (evento) => {
      if (evento.key === STORAGE_KEY) {
        this._evaluaciones.set(this.leerAlmacenamiento());
      }
    });
  }

  agregar(datos: {
    cortometrajeId: string;
    juezId: string;
    jurado: string;
    puntuaciones: Record<string, number>;
    comentario: string;
  }): void {
    const nueva: Evaluacion = {
      id: crypto.randomUUID(),
      cortometrajeId: datos.cortometrajeId,
      juezId: datos.juezId,
      jurado: datos.jurado.trim(),
      puntuaciones: datos.puntuaciones,
      comentario: datos.comentario.trim(),
      creadoEn: Date.now(),
    };
    this._evaluaciones.update((lista) => [...lista, nueva]);
  }

  eliminar(id: string): void {
    this._evaluaciones.update((lista) => lista.filter((e) => e.id !== id));
  }

  porCortometraje(cortometrajeId: string): Evaluacion[] {
    return this._evaluaciones().filter((e) => e.cortometrajeId === cortometrajeId);
  }

  porJuez(juezId: string): Evaluacion[] {
    return this._evaluaciones().filter((e) => e.juezId === juezId);
  }

  yaEvaluo(juezId: string, cortometrajeId: string): boolean {
    return this._evaluaciones().some((e) => e.juezId === juezId && e.cortometrajeId === cortometrajeId);
  }

  private leerAlmacenamiento(): Evaluacion[] {
    try {
      const crudo = localStorage.getItem(STORAGE_KEY);
      return crudo ? (JSON.parse(crudo) as Evaluacion[]) : [];
    } catch {
      return [];
    }
  }
}
