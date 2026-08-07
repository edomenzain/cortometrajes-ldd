import { Injectable, computed, signal } from '@angular/core';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { VotoPublico } from '../models/voto-publico.model';

const COLECCION = 'votosPublico';
const CLAVE_VOTANTE = 'votante-id';

@Injectable({ providedIn: 'root' })
export class VotosPublicosService {
  private readonly _votos = signal<VotoPublico[]>([]);
  readonly votos = this._votos.asReadonly();

  private readonly _votanteId = signal(this.obtenerVotanteId());
  readonly votanteId = this._votanteId.asReadonly();

  readonly yaVoto = computed(() => this._votos().some((v) => v.id === this._votanteId()));
  readonly miVoto = computed(() => this._votos().find((v) => v.id === this._votanteId()));

  readonly conteoPorCortometraje = computed<Record<string, number>>(() => {
    const conteo: Record<string, number> = {};
    for (const voto of this._votos()) {
      conteo[voto.cortometrajeId] = (conteo[voto.cortometrajeId] ?? 0) + 1;
    }
    return conteo;
  });

  readonly totalVotos = computed(() => this._votos().length);

  private readonly _cargando = signal(true);
  readonly cargando = this._cargando.asReadonly();

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
  }

  async votar(cortometrajeId: string): Promise<void> {
    if (this.yaVoto()) return;
    const voto: Omit<VotoPublico, 'id'> = { cortometrajeId, creadoEn: Date.now() };
    await setDoc(doc(db, COLECCION, this._votanteId()), voto);
  }

  private obtenerVotanteId(): string {
    const existente = localStorage.getItem(CLAVE_VOTANTE);
    if (existente) return existente;
    const nuevo = crypto.randomUUID();
    localStorage.setItem(CLAVE_VOTANTE, nuevo);
    return nuevo;
  }
}
