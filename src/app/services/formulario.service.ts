import { Injectable, effect, signal } from '@angular/core';
import { Seccion } from '../models/formulario.model';

const STORAGE_KEY = 'ldd.formulario';

const SECCIONES_INICIALES: Seccion[] = [
  {
    id: crypto.randomUUID(),
    nombre: 'Guion e Historia',
    criterios: [
      { id: crypto.randomUUID(), texto: 'La historia tiene un planteamiento, desarrollo y desenlace claros' },
      { id: crypto.randomUUID(), texto: 'Los diálogos son creíbles y aportan a la narrativa' },
      { id: crypto.randomUUID(), texto: 'El tema o mensaje se transmite con claridad' },
    ],
  },
  {
    id: crypto.randomUUID(),
    nombre: 'Dirección',
    criterios: [
      { id: crypto.randomUUID(), texto: 'El ritmo narrativo mantiene el interés del espectador' },
      { id: crypto.randomUUID(), texto: 'La puesta en escena es coherente con la historia' },
    ],
  },
  {
    id: crypto.randomUUID(),
    nombre: 'Actuación',
    criterios: [
      { id: crypto.randomUUID(), texto: 'Los actores se ven creíbles' },
      { id: crypto.randomUUID(), texto: 'Los actores transmiten bien las expresiones de los personajes' },
    ],
  },
  {
    id: crypto.randomUUID(),
    nombre: 'Fotografía',
    criterios: [
      { id: crypto.randomUUID(), texto: 'La composición de los planos es adecuada' },
      { id: crypto.randomUUID(), texto: 'La iluminación refuerza el tono de la historia' },
    ],
  },
  {
    id: crypto.randomUUID(),
    nombre: 'Sonido y Edición',
    criterios: [
      { id: crypto.randomUUID(), texto: 'El audio se escucha limpio y balanceado' },
      { id: crypto.randomUUID(), texto: 'El montaje mantiene continuidad y buen ritmo' },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class FormularioService {
  private readonly _secciones = signal<Seccion[]>(this.leerAlmacenamiento());
  readonly secciones = this._secciones.asReadonly();

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._secciones()));
    });
  }

  agregarSeccion(nombre: string): void {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    this._secciones.update((lista) => [...lista, { id: crypto.randomUUID(), nombre: nombreLimpio, criterios: [] }]);
  }

  eliminarSeccion(seccionId: string): void {
    this._secciones.update((lista) => lista.filter((s) => s.id !== seccionId));
  }

  agregarCriterio(seccionId: string, texto: string): void {
    const textoLimpio = texto.trim();
    if (!textoLimpio) return;
    this._secciones.update((lista) =>
      lista.map((s) =>
        s.id === seccionId
          ? { ...s, criterios: [...s.criterios, { id: crypto.randomUUID(), texto: textoLimpio }] }
          : s,
      ),
    );
  }

  eliminarCriterio(seccionId: string, criterioId: string): void {
    this._secciones.update((lista) =>
      lista.map((s) =>
        s.id === seccionId ? { ...s, criterios: s.criterios.filter((c) => c.id !== criterioId) } : s,
      ),
    );
  }

  private leerAlmacenamiento(): Seccion[] {
    try {
      const crudo = localStorage.getItem(STORAGE_KEY);
      return crudo ? (JSON.parse(crudo) as Seccion[]) : SECCIONES_INICIALES;
    } catch {
      return SECCIONES_INICIALES;
    }
  }
}
