import { Injectable, computed, inject, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Premiacion } from '../models/premiacion.model';
import { PeriodosService } from './periodos.service';

const COLECCION = 'premiaciones';

@Injectable({ providedIn: 'root' })
export class PremiacionesService {
  private readonly periodos = inject(PeriodosService);

  private readonly _premiaciones = signal<Premiacion[]>([]);
  readonly premiaciones = computed(() => {
    const periodoId = this.periodos.seleccionado()?.id;
    return this._premiaciones().filter((p) => p.periodoId === periodoId);
  });

  private readonly _cargando = signal(true);
  readonly cargando = this._cargando.asReadonly();

  constructor() {
    onSnapshot(
      collection(db, COLECCION),
      (snap) => {
        this._premiaciones.set(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Premiacion));
        this._cargando.set(false);
      },
      (error) => {
        console.error('Error al escuchar premiaciones en tiempo real', error);
        this._cargando.set(false);
      },
    );
  }

  agregar(nombre: string): void {
    const periodoId = this.periodos.seleccionado()?.id;
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio || !periodoId) return;
    addDoc(collection(db, COLECCION), { nombre: nombreLimpio, periodoId });
  }

  editar(id: string, nombre: string): void {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    updateDoc(doc(db, COLECCION, id), { nombre: nombreLimpio });
  }

  eliminar(id: string): void {
    deleteDoc(doc(db, COLECCION, id));
  }

  porId(id: string): Premiacion | undefined {
    return this._premiaciones().find((p) => p.id === id);
  }
}
