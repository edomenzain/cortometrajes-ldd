import { Injectable, computed, effect, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Periodo } from '../models/periodo.model';

const COLECCION = 'periodos';
const CLAVE_SELECCIONADO = 'ldd.periodo-seleccionado';

@Injectable({ providedIn: 'root' })
export class PeriodosService {
  private readonly _periodos = signal<Periodo[]>([]);
  readonly periodos = this._periodos.asReadonly();

  private readonly _cargando = signal(true);
  readonly cargando = this._cargando.asReadonly();

  private readonly _seleccionadoId = signal<string | null>(localStorage.getItem(CLAVE_SELECCIONADO));

  readonly ordenados = computed(() => [...this._periodos()].sort((a, b) => b.fechaInicio - a.fechaInicio));

  /** Periodo cuya ventana de fechas cubre hoy; si ninguno, el más reciente. */
  readonly activo = computed<Periodo | undefined>(() => {
    const ahora = Date.now();
    return this._periodos().find((p) => p.fechaInicio <= ahora && ahora <= p.fechaFin) ?? this.ordenados()[0];
  });

  readonly seleccionado = computed<Periodo | undefined>(() => {
    const id = this._seleccionadoId();
    const elegido = id ? this._periodos().find((p) => p.id === id) : undefined;
    return elegido ?? this.activo();
  });

  constructor() {
    onSnapshot(
      collection(db, COLECCION),
      (snap) => {
        this._periodos.set(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Periodo));
        this._cargando.set(false);
      },
      (error) => {
        console.error('Error al escuchar periodos en tiempo real', error);
        this._cargando.set(false);
      },
    );

    effect(() => {
      const id = this._seleccionadoId();
      if (id) localStorage.setItem(CLAVE_SELECCIONADO, id);
      else localStorage.removeItem(CLAVE_SELECCIONADO);
    });
  }

  seleccionar(id: string): void {
    this._seleccionadoId.set(id);
  }

  agregar(datos: { nombre: string; fechaInicio: number; fechaFin: number }): void {
    const nombre = datos.nombre.trim();
    if (!nombre) return;
    addDoc(collection(db, COLECCION), {
      nombre,
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin,
      creadoEn: Date.now(),
    });
  }

  editar(id: string, datos: { nombre: string; fechaInicio: number; fechaFin: number }): void {
    const nombre = datos.nombre.trim();
    if (!nombre) return;
    updateDoc(doc(db, COLECCION, id), {
      nombre,
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin,
    });
  }

  eliminar(id: string): void {
    deleteDoc(doc(db, COLECCION, id));
    if (this._seleccionadoId() === id) this._seleccionadoId.set(null);
  }

  porId(id: string): Periodo | undefined {
    return this._periodos().find((p) => p.id === id);
  }
}
