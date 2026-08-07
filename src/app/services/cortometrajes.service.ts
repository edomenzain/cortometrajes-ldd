import { Injectable, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Cortometraje } from '../models/cortometraje.model';

const COLECCION = 'cortometrajes';

@Injectable({ providedIn: 'root' })
export class CortometrajesService {
  private readonly _cortometrajes = signal<Cortometraje[]>([]);
  readonly cortometrajes = this._cortometrajes.asReadonly();

  private readonly _cargando = signal(true);
  readonly cargando = this._cargando.asReadonly();

  constructor() {
    onSnapshot(
      collection(db, COLECCION),
      (snap) => {
        this._cortometrajes.set(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Cortometraje));
        this._cargando.set(false);
      },
      (error) => {
        console.error('Error al escuchar cortometrajes en tiempo real', error);
        this._cargando.set(false);
      },
    );
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

  editar(id: string, datos: { titulo: string; descripcion: string; youtubeUrl?: string }): void {
    const cambios: Record<string, unknown> = {
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      youtubeUrl: datos.youtubeUrl?.trim() || null,
    };
    updateDoc(doc(db, COLECCION, id), cambios);
  }

  eliminar(id: string): void {
    deleteDoc(doc(db, COLECCION, id));
  }

  porId(id: string): Cortometraje | undefined {
    return this._cortometrajes().find((c) => c.id === id);
  }
}
