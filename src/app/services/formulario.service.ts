import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Seccion } from '../models/formulario.model';
import { PeriodosService } from './periodos.service';

const COLECCION = 'formulario';

const SECCIONES_INICIALES: Omit<Seccion, 'id' | 'periodoId'>[] = [
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
  private readonly periodos = inject(PeriodosService);

  private readonly _secciones = signal<Seccion[]>([]);
  readonly secciones = computed(() => {
    const periodoId = this.periodos.seleccionado()?.id;
    return this._secciones().filter((s) => s.periodoId === periodoId);
  });

  private readonly sembrados = new Set<string>();

  private readonly _cargando = signal(true);
  readonly cargando = this._cargando.asReadonly();

  constructor() {
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

    effect(() => {
      const periodoId = this.periodos.seleccionado()?.id;
      if (periodoId) this.sembrarSiVacio(periodoId);
    });
  }

  agregarSeccion(nombre: string): void {
    const periodoId = this.periodos.seleccionado()?.id;
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio || !periodoId) return;
    addDoc(collection(db, COLECCION), { nombre: nombreLimpio, criterios: [], premiacionIds: [], periodoId });
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

  private async sembrarSiVacio(periodoId: string): Promise<void> {
    if (this.sembrados.has(periodoId)) return;
    this.sembrados.add(periodoId);
    const snap = await getDocs(query(collection(db, COLECCION), where('periodoId', '==', periodoId)));
    if (!snap.empty) return;
    for (const seccion of SECCIONES_INICIALES) {
      await addDoc(collection(db, COLECCION), { ...seccion, periodoId });
    }
  }
}
