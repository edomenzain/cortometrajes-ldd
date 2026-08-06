import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';
import { FormularioService } from '../../services/formulario.service';
import { PremiacionesService } from '../../services/premiaciones.service';

interface ProgresoJuez {
  id: string;
  nombre: string;
  evaluados: number;
  total: number;
  porcentaje: number;
}

interface ProgresoCortometraje {
  id: string;
  titulo: string;
  evaluadoPor: number;
  totalJueces: number;
  porcentaje: number;
  promedio: number;
}

interface Actividad {
  id: string;
  jurado: string;
  cortometraje: string;
  fecha: string;
}

interface LiderPremiacion {
  id: string;
  nombre: string;
  titulo: string | null;
  promedio: number;
  totalEvaluaciones: number;
}

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.html',
})
export class DashboardPage {
  private readonly auth = inject(AuthService);
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly evaluaciones = inject(EvaluacionesService);
  private readonly formulario = inject(FormularioService);
  private readonly premiacionesService = inject(PremiacionesService);

  protected readonly totalPremiaciones = computed(() => this.premiacionesService.premiaciones().length);

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

  protected readonly lideresPorPremiacion = computed<LiderPremiacion[]>(() => {
    const mapa = this.criterioAPremiaciones();
    const evaluacionesTodas = this.evaluaciones.evaluaciones();
    return this.premiacionesService.premiaciones().map((premiacion) => {
      const ranking = this.cortometrajes
        .cortometrajes()
        .map((corto) => {
          const propias = evaluacionesTodas.filter((e) => e.cortometrajeId === corto.id);
          const promedios = propias
            .map((e) => {
              const valores = Object.entries(e.puntuaciones)
                .filter(([criterioId]) => (mapa.get(criterioId) ?? []).includes(premiacion.id))
                .map(([, valor]) => valor);
              return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
            })
            .filter((valor): valor is number => valor !== null);
          const promedio = promedios.length ? promedios.reduce((a, b) => a + b, 0) / promedios.length : 0;
          return { titulo: corto.titulo, promedio, totalEvaluaciones: promedios.length };
        })
        .sort((a, b) => b.promedio - a.promedio);
      const ganador = ranking.find((item) => item.totalEvaluaciones > 0);
      return {
        id: premiacion.id,
        nombre: premiacion.nombre,
        titulo: ganador?.titulo ?? null,
        promedio: ganador?.promedio ?? 0,
        totalEvaluaciones: ganador?.totalEvaluaciones ?? 0,
      };
    });
  });

  protected readonly totalJueces = computed(() => this.auth.jueces().length);
  protected readonly totalCortos = computed(() => this.cortometrajes.cortometrajes().length);

  protected readonly totalEsperado = computed(() => this.totalJueces() * this.totalCortos());
  protected readonly totalRealizado = computed(() => this.evaluaciones.evaluaciones().length);

  protected readonly porcentajeGeneral = computed(() => {
    const esperado = this.totalEsperado();
    return esperado === 0 ? 0 : Math.round((this.totalRealizado() / esperado) * 100);
  });

  protected readonly porJuez = computed<ProgresoJuez[]>(() => {
    const cortos = this.totalCortos();
    return this.auth
      .jueces()
      .map((juez) => {
        const evaluados = this.evaluaciones.porJuez(juez.id).length;
        return {
          id: juez.id,
          nombre: juez.nombre,
          evaluados,
          total: cortos,
          porcentaje: cortos === 0 ? 0 : Math.round((evaluados / cortos) * 100),
        };
      })
      .sort((a, b) => b.porcentaje - a.porcentaje);
  });

  protected readonly porCortometraje = computed<ProgresoCortometraje[]>(() => {
    const jueces = this.totalJueces();
    return this.cortometrajes
      .cortometrajes()
      .map((corto) => {
        const propias = this.evaluaciones.porCortometraje(corto.id);
        const promedios = propias.map((e) => {
          const valores = Object.values(e.puntuaciones);
          return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
        });
        const promedio = promedios.length ? promedios.reduce((a, b) => a + b, 0) / promedios.length : 0;
        return {
          id: corto.id,
          titulo: corto.titulo,
          evaluadoPor: propias.length,
          totalJueces: jueces,
          porcentaje: jueces === 0 ? 0 : Math.round((propias.length / jueces) * 100),
          promedio,
        };
      })
      .sort((a, b) => a.porcentaje - b.porcentaje);
  });

  protected readonly actividadReciente = computed<Actividad[]>(() =>
    [...this.evaluaciones.evaluaciones()]
      .sort((a, b) => b.creadoEn - a.creadoEn)
      .slice(0, 8)
      .map((evaluacion) => ({
        id: evaluacion.id,
        jurado: evaluacion.jurado,
        cortometraje: this.cortometrajes.porId(evaluacion.cortometrajeId)?.titulo ?? 'Cortometraje eliminado',
        fecha: new Date(evaluacion.creadoEn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      })),
  );
}
