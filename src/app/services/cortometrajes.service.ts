import { Injectable, computed, inject, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CampanaMarketing, Cortometraje } from '../models/cortometraje.model';
import { PeriodosService } from './periodos.service';

const COLECCION = 'cortometrajes';

@Injectable({ providedIn: 'root' })
export class CortometrajesService {
  private readonly periodos = inject(PeriodosService);

  private readonly _cortometrajes = signal<Cortometraje[]>([]);
  readonly cortometrajes = computed(() => {
    const periodoId = this.periodos.seleccionado()?.id;
    return this._cortometrajes().filter((c) => c.periodoId === periodoId);
  });

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

  agregar(datos: {
    titulo: string;
    descripcion: string;
    director: string;
    youtubeUrl?: string;
    campanas: CampanaMarketing[];
  }): void {
    const periodoId = this.periodos.seleccionado()?.id;
    if (!periodoId) return;
    const nuevo: Record<string, unknown> = {
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      director: datos.director.trim(),
      periodoId,
      creadoEn: Date.now(),
    };
    const youtubeUrl = datos.youtubeUrl?.trim();
    if (youtubeUrl) nuevo['youtubeUrl'] = youtubeUrl;
    if (datos.campanas.length > 0) nuevo['campanasMarketing'] = datos.campanas;
    addDoc(collection(db, COLECCION), nuevo);
  }

  editar(
    id: string,
    datos: {
      titulo: string;
      descripcion: string;
      director: string;
      youtubeUrl?: string;
      campanas: CampanaMarketing[];
    },
  ): void {
    const cambios: Record<string, unknown> = {
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion.trim(),
      director: datos.director.trim(),
      youtubeUrl: datos.youtubeUrl?.trim() || null,
      campanasMarketing: datos.campanas.length > 0 ? datos.campanas : null,
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
