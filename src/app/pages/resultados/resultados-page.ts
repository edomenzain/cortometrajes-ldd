import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';
import { FormularioService } from '../../services/formulario.service';
import { PremiacionesService } from '../../services/premiaciones.service';
import { VotosPublicosService } from '../../services/votos-publicos.service';
import { Skeleton } from '../../shared/skeleton';

interface Ranking {
  cortometrajeId: string;
  titulo: string;
  promedio: number;
  totalEvaluaciones: number;
}

interface ItemPodio extends Ranking {
  puesto: number;
}

interface ResultadoPremiacion {
  id: string;
  nombre: string;
  ranking: Ranking[];
  ganador: Ranking | undefined;
}

interface VotoPublicoResultado {
  cortometrajeId: string;
  titulo: string;
  votos: number;
  porcentaje: number;
}

@Component({
  selector: 'app-resultados-page',
  imports: [Skeleton],
  templateUrl: './resultados-page.html',
})
export class ResultadosPage {
  private readonly auth = inject(AuthService);
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly evaluaciones = inject(EvaluacionesService);
  private readonly formulario = inject(FormularioService);
  private readonly premiacionesService = inject(PremiacionesService);
  private readonly votosPublicos = inject(VotosPublicosService);

  protected readonly cargando = computed(
    () =>
      this.cortometrajes.cargando() ||
      this.evaluaciones.cargando() ||
      this.formulario.cargando() ||
      this.premiacionesService.cargando() ||
      this.votosPublicos.cargando(),
  );
  protected readonly filasEsqueleto = [0, 1, 2];

  protected readonly totalVotosPublico = this.votosPublicos.totalVotos;

  protected readonly votosPublicoResultados = computed<VotoPublicoResultado[]>(() => {
    const conteo = this.votosPublicos.conteoPorCortometraje();
    const total = this.totalVotosPublico();
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

  protected readonly ranking = computed<Ranking[]>(() =>
    this.calcularRanking((puntuaciones) => Object.entries(puntuaciones)),
  );

  protected readonly podio = computed<ItemPodio[]>(() =>
    this.ranking()
      .slice(0, 3)
      .map((item, i) => ({ ...item, puesto: i + 1 })),
  );

  private readonly criterioAPremiaciones = computed(() => {
    const mapa = new Map<string, string[]>();
    for (const seccion of this.formulario.secciones()) {
      if (seccion.premiacionIds.length === 0) continue;
      for (const criterio of seccion.criterios) {
        mapa.set(criterio.id, seccion.premiacionIds);
      }
    }
    return mapa;
  });

  protected readonly resultadosPorPremiacion = computed<ResultadoPremiacion[]>(() => {
    const mapa = this.criterioAPremiaciones();
    return this.premiacionesService.premiaciones().map((premiacion) => {
      const ranking = this.calcularRanking((puntuaciones) =>
        Object.entries(puntuaciones).filter(([criterioId]) => (mapa.get(criterioId) ?? []).includes(premiacion.id)),
      );
      return {
        id: premiacion.id,
        nombre: premiacion.nombre,
        ranking,
        ganador: ranking.find((item) => item.totalEvaluaciones > 0),
      };
    });
  });

  private calcularRanking(
    filtrarPuntuaciones: (puntuaciones: Record<string, number>) => [string, number][],
  ): Ranking[] {
    const usuario = this.auth.usuarioActual();
    const todas = this.evaluaciones.evaluaciones();
    const evaluacionesTodas = usuario?.rol === 'admin' ? todas : todas.filter((e) => e.juezId === usuario?.id);
    return this.cortometrajes
      .cortometrajes()
      .map((corto) => {
        const propias = evaluacionesTodas.filter((e) => e.cortometrajeId === corto.id);
        const promedios = propias
          .map((e) => {
            const valores = filtrarPuntuaciones(e.puntuaciones).map(([, valor]) => valor);
            return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
          })
          .filter((valor): valor is number => valor !== null);
        const promedio = promedios.length ? promedios.reduce((a, b) => a + b, 0) / promedios.length : 0;
        return {
          cortometrajeId: corto.id,
          titulo: corto.titulo,
          promedio,
          totalEvaluaciones: promedios.length,
        };
      })
      .sort((a, b) => b.promedio - a.promedio);
  }
}
