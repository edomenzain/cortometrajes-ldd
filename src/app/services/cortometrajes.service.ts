import { Injectable, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Cortometraje } from '../models/cortometraje.model';

const COLECCION = 'cortometrajes';

@Injectable({ providedIn: 'root' })
export class CortometrajesService {
  private readonly _cortometrajes = signal<Cortometraje[]>([]);
  readonly cortometrajes = this._cortometrajes.asReadonly();

  constructor() {
    onSnapshot(collection(db, COLECCION), (snap) => {
      this._cortometrajes.set(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Cortometraje));
    });
  }

  agregar(datos: { titulo: string; descripcion: string; youtubeUrl?: string }): void {
    const nuevo: Record<string, unknown> = {
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      creadoEn: Date.now(),
    };
    const youtubeUrl = datos.youtubeUrl?.trim();
    if (youtubeUrl) nuevo['youtubeUrl'] = youtubeUrl;
    addDoc(collection(db, COLECCION), nuevo);
  }

  eliminar(id: string): void {
    deleteDoc(doc(db, COLECCION, id));
  }

  porId(id: string): Cortometraje | undefined {
    return this._cortometrajes().find((c) => c.id === id);
  }
}
