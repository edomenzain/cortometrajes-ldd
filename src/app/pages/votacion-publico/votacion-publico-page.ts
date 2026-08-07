import { Component, computed, inject, signal } from '@angular/core';
import QRCode from 'qrcode';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { VotosPublicosService } from '../../services/votos-publicos.service';
import { Skeleton } from '../../shared/skeleton';
import { ConfirmService } from '../../shared/confirm.service';

interface ResultadoVoto {
  cortometrajeId: string;
  titulo: string;
  votos: number;
  porcentaje: number;
}

@Component({
  selector: 'app-votacion-publico-page',
  imports: [Skeleton],
  templateUrl: './votacion-publico-page.html',
})
export class VotacionPublicoPage {
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly votosPublicos = inject(VotosPublicosService);
  private readonly confirmar = inject(ConfirmService);

  protected readonly cargando = computed(() => this.cortometrajes.cargando() || this.votosPublicos.cargando());
  protected readonly filasEsqueleto = [0, 1, 2, 3];

  protected readonly totalVotos = this.votosPublicos.totalVotos;
  protected readonly abierta = this.votosPublicos.abierta;
  protected readonly cambiandoEstado = signal(false);
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

  protected async alternarVotacion(): Promise<void> {
    const abriendo = !this.abierta();
    const confirmado = await this.confirmar.pedir(
      abriendo ? '¿Iniciar la votación del público?' : '¿Detener la votación del público? Nadie podrá votar hasta que la reinicies.',
      { textoAceptar: abriendo ? 'Iniciar' : 'Detener', destructivo: !abriendo },
    );
    if (!confirmado) return;

    this.cambiandoEstado.set(true);
    try {
      if (abriendo) {
        await this.votosPublicos.iniciarVotacion();
      } else {
        await this.votosPublicos.detenerVotacion();
      }
    } finally {
      this.cambiandoEstado.set(false);
    }
  }
}
