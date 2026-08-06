import { Component, computed, inject, signal } from '@angular/core';
import QRCode from 'qrcode';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { VotosPublicosService } from '../../services/votos-publicos.service';

interface ResultadoVoto {
  cortometrajeId: string;
  titulo: string;
  votos: number;
  porcentaje: number;
}

@Component({
  selector: 'app-votacion-publico-page',
  templateUrl: './votacion-publico-page.html',
})
export class VotacionPublicoPage {
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly votosPublicos = inject(VotosPublicosService);

  protected readonly totalVotos = this.votosPublicos.totalVotos;
  protected readonly urlVotacion = `${location.origin}${location.pathname}#/votar`;
  protected readonly qrDataUrl = signal<string | null>(null);

  protected readonly resultados = computed<ResultadoVoto[]>(() => {
    const conteo = this.votosPublicos.conteoPorCortometraje();
    const total = this.totalVotos();
    return this.cortometrajes
      .cortometrajes()
      .map((corto) => {
        const votos = conteo[corto.id] ?? 0;
        return {
          cortometrajeId: corto.id,
          titulo: corto.titulo,
          votos,
          porcentaje: total === 0 ? 0 : Math.round((votos / total) * 100),
        };
      })
      .sort((a, b) => b.votos - a.votos);
  });

  constructor() {
    QRCode.toDataURL(this.urlVotacion, { width: 320, margin: 1 }).then((url) => this.qrDataUrl.set(url));
  }
}
