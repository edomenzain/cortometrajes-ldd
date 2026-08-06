import { Injectable, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Premiacion } from '../models/premiacion.model';

const COLECCION = 'premiaciones';

@Injectable({ providedIn: 'root' })
export class PremiacionesService {
  private readonly _premiaciones = signal<Premiacion[]>([]);
  readonly premiaciones = this._premiaciones.asReadonly();

  constructor() {
    onSnapshot(collection(db, COLECCION), (snap) => {
      this._premiaciones.set(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Premiacion));
    });
  }

  agregar(nombre: string): void {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    addDoc(collection(db, COLECCION), { nombre: nombreLimpio });
  }

  eliminar(id: string): void {
    deleteDoc(doc(db, COLECCION, id));
  }

  porId(id: string): Premiacion | undefined {
    return this._premiaciones().find((p) => p.id === id);
  }
}
