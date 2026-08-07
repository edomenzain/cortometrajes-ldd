import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Unsubscribe, collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { VotoPublico } from '../models/voto-publico.model';
import { PeriodosService } from './periodos.service';

const COLECCION = 'votosPublico';
const CLAVE_VOTANTE = 'votante-id';
const COLECCION_ESTADO = 'configuracionVotacion';

@Injectable({ providedIn: 'root' })
export class VotosPublicosService {
  private readonly periodos = inject(PeriodosService);

  private readonly _votos = signal<VotoPublico[]>([]);

  private readonly _votanteId = signal(this.obtenerVotanteId());
  readonly votanteId = this._votanteId.asReadonly();

  readonly votos = computed(() => {
    const periodoId = this.periodos.seleccionado()?.id;
    return this._votos().filter((v) => v.periodoId === periodoId);
  });

  readonly yaVoto = computed(() => this.votos().some((v) => v.votanteId === this._votanteId()));
  readonly miVoto = computed(() => this.votos().find((v) => v.votanteId === this._votanteId()));

  readonly conteoPorCortometraje = computed<Record<string, number>>(() => {
    const conteo: Record<string, number> = {};
    for (const voto of this.votos()) {
      conteo[voto.cortometrajeId] = (conteo[voto.cortometrajeId] ?? 0) + 1;
    }
    return conteo;
  });

  readonly totalVotos = computed(() => this.votos().length);

  private readonly _cargando = signal(true);
  readonly cargando = this._cargando.asReadonly();

  private readonly _abierta = signal(false);
  readonly abierta = this._abierta.asReadonly();

  private desuscribirEstado: Unsubscribe | null = null;
  private periodoEstadoActual: string | null = null;

  constructor() {
    onSnapshot(
      collection(db, COLECCION),
      (snap) => {
        this._votos.set(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VotoPublico));
        this._cargando.set(false);
      },
      (error) => {
        console.error('Error al escuchar votos del público en tiempo real', error);
        this._cargando.set(false);
      },
    );

    effect(() => {
      const periodoId = this.periodos.seleccionado()?.id ?? null;
      if (periodoId === this.periodoEstadoActual) return;
      this.periodoEstadoActual = periodoId;
      this.desuscribirEstado?.();
      this.desuscribirEstado = null;

      if (!periodoId) {
        this._abierta.set(false);
        return;
      }
      this.desuscribirEstado = onSnapshot(
        doc(db, COLECCION_ESTADO, periodoId),
        (snap) => {
          this._abierta.set(snap.data()?.['abierta'] === true);
        },
        (error) => {
          console.error('Error al escuchar el estado de la votación', error);
        },
      );
    });
  }

  async votar(cortometrajeId: string): Promise<void> {
    const periodoId = this.periodos.seleccionado()?.id;
    if (!periodoId || this.yaVoto() || !this._abierta()) return;
    const voto: Omit<VotoPublico, 'id'> = {
      periodoId,
      votanteId: this._votanteId(),
      cortometrajeId,
      creadoEn: Date.now(),
    };
    await setDoc(doc(db, COLECCION, `${periodoId}_${this._votanteId()}`), voto);
  }

  async iniciarVotacion(): Promise<void> {
    const periodoId = this.periodos.seleccionado()?.id;
    if (!periodoId) return;
    await setDoc(doc(db, COLECCION_ESTADO, periodoId), { abierta: true });
  }

  async detenerVotacion(): Promise<void> {
    const periodoId = this.periodos.seleccionado()?.id;
    if (!periodoId) return;
    await setDoc(doc(db, COLECCION_ESTADO, periodoId), { abierta: false });
  }

  private obtenerVotanteId(): string {
    const existente = localStorage.getItem(CLAVE_VOTANTE);
    if (existente) return existente;
    const nuevo = crypto.randomUUID();
    localStorage.setItem(CLAVE_VOTANTE, nuevo);
    return nuevo;
  }
}
