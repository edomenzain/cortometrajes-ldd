import { Injectable, computed, inject, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Evaluacion } from '../models/evaluacion.model';
import { PeriodosService } from './periodos.service';

const COLECCION = 'evaluaciones';

@Injectable({ providedIn: 'root' })
export class EvaluacionesService {
  private readonly periodos = inject(PeriodosService);

  private readonly _evaluaciones = signal<Evaluacion[]>([]);
  readonly evaluaciones = computed(() => {
    const periodoId = this.periodos.seleccionado()?.id;
    return this._evaluaciones().filter((e) => e.periodoId === periodoId);
  });

  private readonly _cargando = signal(true);
  readonly cargando = this._cargando.asReadonly();

  constructor() {
    onSnapshot(
      collection(db, COLECCION),
      (snap) => {
        this._evaluaciones.set(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evaluacion));
        this._cargando.set(false);
      },
      (error) => {
        console.error('Error al escuchar evaluaciones en tiempo real', error);
        this._cargando.set(false);
      },
    );
  }

  agregar(datos: {
    cortometrajeId: string;
    juezId: string;
    jurado: string;
    puntuaciones: Record<string, number>;
    comentario: string;
  }): void {
    const periodoId = this.periodos.seleccionado()?.id;
    if (!periodoId) return;
    const nueva: Omit<Evaluacion, 'id'> = {
      periodoId,
      cortometrajeId: datos.cortometrajeId,
      juezId: datos.juezId,
      jurado: datos.jurado.trim(),
      puntuaciones: datos.puntuaciones,
      comentario: datos.comentario.trim(),
      creadoEn: Date.now(),
    };
    addDoc(collection(db, COLECCION), nueva);
  }

  eliminar(id: string): void {
    deleteDoc(doc(db, COLECCION, id));
  }

  porCortometraje(cortometrajeId: string): Evaluacion[] {
    return this.evaluaciones().filter((e) => e.cortometrajeId === cortometrajeId);
  }

  porJuez(juezId: string): Evaluacion[] {
    return this.evaluaciones().filter((e) => e.juezId === juezId);
  }

  yaEvaluo(juezId: string, cortometrajeId: string): boolean {
    return this.evaluaciones().some((e) => e.juezId === juezId && e.cortometrajeId === cortometrajeId);
  }
}
