import { Injectable, computed, inject, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Evaluacion } from '../models/evaluacion.model';
import { CortometrajesService } from './cortometrajes.service';
import { PeriodosService } from './periodos.service';

const COLECCION = 'evaluaciones';

@Injectable({ providedIn: 'root' })
export class EvaluacionesService {
  private readonly periodos = inject(PeriodosService);
  private readonly cortometrajesService = inject(CortometrajesService);

  private readonly _evaluaciones = signal<Evaluacion[]>([]);
  readonly evaluaciones = computed(() => {
    const periodoId = this.periodos.seleccionado()?.id;
    return this._evaluaciones().filter((e) => e.periodoId === periodoId);
  });

  /**
   * Evaluaciones sin duplicados: una sola por juez/cortometraje, conservando la más antigua
   * (mismo criterio que `limpiarDuplicados`). Todos los cálculos deben partir de aquí, no de
   * `evaluaciones()`, para que las duplicadas no inflen avances ni promedios.
   */
  readonly evaluacionesUnicas = computed(() => {
    const porClave = new Map<string, Evaluacion>();
    for (const e of this.evaluaciones()) {
      const clave = `${e.juezId}::${e.cortometrajeId}`;
      const actual = porClave.get(clave);
      if (!actual || e.creadoEn < actual.creadoEn) {
        porClave.set(clave, e);
      }
    }
    return [...porClave.values()];
  });

  /**
   * Solo evaluaciones de jueces que ya calificaron el 100% de los cortometrajes del periodo.
   * Un juez con evaluaciones incompletas no debe afectar puntuaciones finales/premiaciones.
   */
  readonly evaluacionesParaPremiacion = computed(() => {
    const totalCortos = this.cortometrajesService.cortometrajes().length;
    if (totalCortos === 0) return [];
    const unicas = this.evaluacionesUnicas();
    const cortosPorJuez = new Map<string, Set<string>>();
    for (const e of unicas) {
      const set = cortosPorJuez.get(e.juezId) ?? new Set<string>();
      set.add(e.cortometrajeId);
      cortosPorJuez.set(e.juezId, set);
    }
    return unicas.filter((e) => (cortosPorJuez.get(e.juezId)?.size ?? 0) === totalCortos);
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

  async agregar(datos: {
    cortometrajeId: string;
    juezId: string;
    jurado: string;
    puntuaciones: Record<string, number>;
    comentario: string;
  }): Promise<boolean> {
    const periodoId = this.periodos.seleccionado()?.id;
    if (!periodoId) return false;
    if (this.yaEvaluo(datos.juezId, datos.cortometrajeId)) return false;
    const nueva: Omit<Evaluacion, 'id'> = {
      periodoId,
      cortometrajeId: datos.cortometrajeId,
      juezId: datos.juezId,
      jurado: datos.jurado.trim(),
      puntuaciones: datos.puntuaciones,
      comentario: datos.comentario.trim(),
      creadoEn: Date.now(),
    };
    await addDoc(collection(db, COLECCION), nueva);
    return true;
  }

  eliminar(id: string): void {
    deleteDoc(doc(db, COLECCION, id));
  }

  porCortometraje(cortometrajeId: string): Evaluacion[] {
    return this.evaluacionesUnicas().filter((e) => e.cortometrajeId === cortometrajeId);
  }

  porJuez(juezId: string): Evaluacion[] {
    return this.evaluacionesUnicas().filter((e) => e.juezId === juezId);
  }

  yaEvaluo(juezId: string, cortometrajeId: string): boolean {
    return this.evaluaciones().some((e) => e.juezId === juezId && e.cortometrajeId === cortometrajeId);
  }

  /**
   * Elimina evaluaciones duplicadas (mismo juez y cortometraje), conservando la más antigua de cada grupo.
   */
  async limpiarDuplicados(): Promise<number> {
    const porClave = new Map<string, Evaluacion[]>();
    for (const e of this.evaluaciones()) {
      const clave = `${e.juezId}::${e.cortometrajeId}`;
      const grupo = porClave.get(clave) ?? [];
      grupo.push(e);
      porClave.set(clave, grupo);
    }
    const aEliminar: string[] = [];
    for (const grupo of porClave.values()) {
      if (grupo.length <= 1) continue;
      const [, ...resto] = [...grupo].sort((a, b) => a.creadoEn - b.creadoEn);
      aEliminar.push(...resto.map((e) => e.id));
    }
    await Promise.all(aEliminar.map((id) => deleteDoc(doc(db, COLECCION, id))));
    return aEliminar.length;
  }
}
