import { Injectable, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Seccion } from '../models/formulario.model';

const COLECCION = 'formulario';

const SECCIONES_INICIALES: Omit<Seccion, 'id'>[] = [
  {
    nombre: 'Guion e Historia',
    criterios: [
      { id: crypto.randomUUID(), texto: 'La historia tiene un planteamiento, desarrollo y desenlace claros' },
      { id: crypto.randomUUID(), texto: 'Los diálogos son creíbles y aportan a la narrativa' },
      { id: crypto.randomUUID(), texto: 'El tema o mensaje se transmite con claridad' },
    ],
    premiacionIds: [],
  },
  {
    nombre: 'Dirección',
    criterios: [
      { id: crypto.randomUUID(), texto: 'El ritmo narrativo mantiene el interés del espectador' },
      { id: crypto.randomUUID(), texto: 'La puesta en escena es coherente con la historia' },
    ],
    premiacionIds: [],
  },
  {
    nombre: 'Actuación',
    criterios: [
      { id: crypto.randomUUID(), texto: 'Los actores se ven creíbles' },
      { id: crypto.randomUUID(), texto: 'Los actores transmiten bien las expresiones de los personajes' },
    ],
    premiacionIds: [],
  },
  {
    nombre: 'Fotografía',
    criterios: [
      { id: crypto.randomUUID(), texto: 'La composición de los planos es adecuada' },
      { id: crypto.randomUUID(), texto: 'La iluminación refuerza el tono de la historia' },
    ],
    premiacionIds: [],
  },
  {
    nombre: 'Sonido y Edición',
    criterios: [
      { id: crypto.randomUUID(), texto: 'El audio se escucha limpio y balanceado' },
      { id: crypto.randomUUID(), texto: 'El montaje mantiene continuidad y buen ritmo' },
    ],
    premiacionIds: [],
  },
];

@Injectable({ providedIn: 'root' })
export class FormularioService {
  private readonly _secciones = signal<Seccion[]>([]);
  readonly secciones = this._secciones.asReadonly();
  private sembrando = false;

  private readonly _cargando = signal(true);
  readonly cargando = this._cargando.asReadonly();

  constructor() {
    this.sembrarSiVacio();
    onSnapshot(
      collection(db, COLECCION),
      (snap) => {
        this._secciones.set(
          snap.docs.map((d) => ({ id: d.id, ...d.data(), premiacionIds: d.data()['premiacionIds'] ?? [] }) as Seccion),
        );
        this._cargando.set(false);
      },
      (error) => {
        console.error('Error al escuchar el formulario en tiempo real', error);
        this._cargando.set(false);
      },
    );
  }

  agregarSeccion(nombre: string): void {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    addDoc(collection(db, COLECCION), { nombre: nombreLimpio, criterios: [], premiacionIds: [] });
  }

  eliminarSeccion(seccionId: string): void {
    deleteDoc(doc(db, COLECCION, seccionId));
  }

  agregarCriterio(seccionId: string, texto: string): void {
    const textoLimpio = texto.trim();
    if (!textoLimpio) return;
    const seccion = this._secciones().find((s) => s.id === seccionId);
    if (!seccion) return;
    updateDoc(doc(db, COLECCION, seccionId), {
      criterios: [...seccion.criterios, { id: crypto.randomUUID(), texto: textoLimpio }],
    });
  }

  eliminarCriterio(seccionId: string, criterioId: string): void {
    const seccion = this._secciones().find((s) => s.id === seccionId);
    if (!seccion) return;
    updateDoc(doc(db, COLECCION, seccionId), {
      criterios: seccion.criterios.filter((c) => c.id !== criterioId),
    });
  }

  alternarPremiacion(seccionId: string, premiacionId: string, seleccionada: boolean): void {
    const seccion = this._secciones().find((s) => s.id === seccionId);
    if (!seccion) return;
    const premiacionIds = seleccionada
      ? [...seccion.premiacionIds, premiacionId]
      : seccion.premiacionIds.filter((id) => id !== premiacionId);
    updateDoc(doc(db, COLECCION, seccionId), { premiacionIds });
  }

  quitarPremiacionDeSecciones(premiacionId: string): void {
    for (const seccion of this._secciones()) {
      if (!seccion.premiacionIds.includes(premiacionId)) continue;
      updateDoc(doc(db, COLECCION, seccion.id), {
        premiacionIds: seccion.premiacionIds.filter((id) => id !== premiacionId),
      });
    }
  }

  private async sembrarSiVacio(): Promise<void> {
    if (this.sembrando) return;
    this.sembrando = true;
    const snap = await getDocs(collection(db, COLECCION));
    if (!snap.empty) return;
    for (const seccion of SECCIONES_INICIALES) {
      await addDoc(collection(db, COLECCION), seccion);
    }
  }
}
