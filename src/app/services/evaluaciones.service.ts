import { Injectable, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Evaluacion } from '../models/evaluacion.model';

const COLECCION = 'evaluaciones';

@Injectable({ providedIn: 'root' })
export class EvaluacionesService {
  private readonly _evaluaciones = signal<Evaluacion[]>([]);
  readonly evaluaciones = this._evaluaciones.asReadonly();

  constructor() {
    onSnapshot(collection(db, COLECCION), (snap) => {
      this._evaluaciones.set(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Evaluacion));
    });
  }

  agregar(datos: {
    cortometrajeId: string;
    juezId: string;
    jurado: string;
    puntuaciones: Record<string, number>;
    comentario: string;
  }): void {
    const nueva: Omit<Evaluacion, 'id'> = {
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
    return this._evaluaciones().filter((e) => e.cortometrajeId === cortometrajeId);
  }

  porJuez(juezId: string): Evaluacion[] {
    return this._evaluaciones().filter((e) => e.juezId === juezId);
  }

  yaEvaluo(juezId: string, cortometrajeId: string): boolean {
    return this._evaluaciones().some((e) => e.juezId === juezId && e.cortometrajeId === cortometrajeId);
  }
}
