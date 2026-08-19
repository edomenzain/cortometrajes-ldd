import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import QRCode from 'qrcode';
import { Cortometraje, RedSocial } from '../../models/cortometraje.model';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { VotosPublicosService } from '../../services/votos-publicos.service';
import { Skeleton } from '../../shared/skeleton';
import { ConfirmService } from '../../shared/confirm.service';
import { RedSocialIcono } from '../../shared/red-social-icono';
import { colorRedSocial, etiquetaRedSocial } from '../../shared/red-social';
import { idDeYoutube } from '../../shared/youtube';
import { lanzarConfeti } from '../../shared/confeti';

interface ResultadoVoto {
  cortometrajeId: string;
  titulo: string;
  votos: number;
  porcentaje: number;
}

@Component({
  selector: 'app-votacion-publico-page',
  imports: [Skeleton, RedSocialIcono],
  templateUrl: './votacion-publico-page.html',
})
export class VotacionPublicoPage {
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly votosPublicos = inject(VotosPublicosService);
  private readonly confirmar = inject(ConfirmService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly cargando = computed(() => this.cortometrajes.cargando() || this.votosPublicos.cargando());
  protected readonly filasEsqueleto = [0, 1, 2, 3];

  protected readonly totalVotos = this.votosPublicos.totalVotos;
  protected readonly abierta = this.votosPublicos.abierta;
  protected readonly cambiandoEstado = signal(false);
  protected readonly urlVotacion = `${location.origin}${location.pathname}#/votar`;
  protected readonly qrDataUrl = signal<string | null>(null);

  protected readonly totalVotosMostrado = signal(0);
  protected readonly pantallaCompleta = signal(false);
  private readonly contenedor = viewChild<ElementRef<HTMLElement>>('contenedor');
  private readonly filas = viewChildren<ElementRef<HTMLElement>>('fila');
  private posicionesPrevias = new Map<string, { top: number; left: number }>();
  private modoAnterior: boolean | null = null;

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

  protected readonly ganador = computed<Cortometraje | undefined>(() => {
    const [primero] = this.resultados();
    if (!primero || primero.votos === 0) return undefined;
    return this.cortometrajes.cortometrajes().find((c) => c.id === primero.cortometrajeId);
  });

  protected readonly mostrarGanador = signal(false);
  private canvasConfeti = viewChild<ElementRef<HTMLCanvasElement>>('canvasConfeti');
  private detenerConfeti: (() => void) | null = null;

  constructor() {
    QRCode.toDataURL(this.urlVotacion, { width: 320, margin: 1 }).then((url) => this.qrDataUrl.set(url));

    const alCambiarPantallaCompleta = () => this.pantallaCompleta.set(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', alCambiarPantallaCompleta);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('fullscreenchange', alCambiarPantallaCompleta));

    effect(() => {
      const objetivo = this.totalVotos();
      const inicio = untracked(this.totalVotosMostrado);
      if (objetivo === inicio) return;
      const duracion = 700;
      const t0 = performance.now();
      const animar = (t: number) => {
        const progreso = Math.min((t - t0) / duracion, 1);
        this.totalVotosMostrado.set(Math.round(inicio + (objetivo - inicio) * progreso));
        if (progreso < 1) requestAnimationFrame(animar);
      };
      requestAnimationFrame(animar);
    });

    // Anima el reacomodo del ranking (FLIP) cuando cambia el orden de las filas.
    afterRenderEffect(() => {
      const modoGrid = this.pantallaCompleta();
      const reduceMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const cambioDeModo = this.modoAnterior !== null && this.modoAnterior !== modoGrid;
      this.modoAnterior = modoGrid;
      const filas = this.filas();
      const posicionesNuevas = new Map<string, { top: number; left: number }>();
      for (const fila of filas) {
        const id = fila.nativeElement.dataset['id'];
        if (id) {
          const rect = fila.nativeElement.getBoundingClientRect();
          posicionesNuevas.set(id, { top: rect.top, left: rect.left });
        }
      }
      if (!reduceMovimiento && !cambioDeModo) {
        for (const fila of filas) {
          const id = fila.nativeElement.dataset['id'];
          if (!id) continue;
          const antes = this.posicionesPrevias.get(id);
          const ahora = posicionesNuevas.get(id);
          if (antes === undefined || ahora === undefined) continue;
          const deltaX = antes.left - ahora.left;
          const deltaY = antes.top - ahora.top;
          if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
            fila.nativeElement.animate(
              [{ transform: `translate(${deltaX}px, ${deltaY}px)` }, { transform: 'translate(0, 0)' }],
              { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
            );
          }
        }
      }
      this.posicionesPrevias = posicionesNuevas;
    });

    // Al cerrar la votación (transición abierta → cerrada) se revela al ganador con confeti.
    let abiertaAnterior: boolean | null = null;
    effect(() => {
      const abiertaAhora = this.abierta();
      const anterior = abiertaAnterior;
      abiertaAnterior = abiertaAhora;
      if (anterior === true && abiertaAhora === false && untracked(this.ganador) !== undefined) {
        this.mostrarGanador.set(true);
      }
    });

    afterRenderEffect(() => {
      const canvas = this.canvasConfeti()?.nativeElement;
      if (this.mostrarGanador() && canvas) {
        this.detenerConfeti?.();
        this.detenerConfeti = lanzarConfeti(canvas);
      } else {
        this.detenerConfeti?.();
        this.detenerConfeti = null;
      }
    });

    // Bloquea el scroll de fondo mientras el modal del ganador está abierto.
    effect(() => {
      document.body.style.overflow = this.mostrarGanador() ? 'hidden' : '';
    });

    inject(DestroyRef).onDestroy(() => {
      this.detenerConfeti?.();
      document.body.style.overflow = '';
    });
  }

  protected cerrarGanador(): void {
    this.mostrarGanador.set(false);
  }

  protected etiquetaRedSocial(valor: RedSocial): string {
    return etiquetaRedSocial(valor);
  }

  protected colorRedSocial(valor: RedSocial): string {
    return colorRedSocial(valor);
  }

  protected urlEmbed(youtubeUrl: string | undefined): SafeResourceUrl | null {
    const videoId = idDeYoutube(youtubeUrl);
    if (!videoId) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }

  protected async alternarPantallaCompleta(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await this.contenedor()?.nativeElement.requestFullscreen();
    }
  }

  protected async alternarVotacion(): Promise<void> {
    const abriendo = !this.abierta();
    // En pantalla completa el diálogo de confirmación no se ve (queda fuera del elemento
    // fullscreen), así que se omite y se aplica el cambio directamente.
    if (!this.pantallaCompleta()) {
      const confirmado = await this.confirmar.pedir(
        abriendo ? '¿Iniciar la votación del público?' : '¿Detener la votación del público? Nadie podrá votar hasta que la reinicies.',
        { textoAceptar: abriendo ? 'Iniciar' : 'Detener', destructivo: !abriendo },
      );
      if (!confirmado) return;
    }

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
