import { Component, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';
import { FormularioService } from '../../services/formulario.service';
import { PremiacionesService } from '../../services/premiaciones.service';
import { VotosPublicosService } from '../../services/votos-publicos.service';
import { ConfirmService } from '../../shared/confirm.service';
import { Skeleton } from '../../shared/skeleton';

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

interface JuezDuplicado {
  id: string;
  nombre: string;
  cantidad: number;
}

interface LiderPremiacion {
  id: string;
  nombre: string;
  titulo: string | null;
  promedio: number;
  totalEvaluaciones: number;
}

interface VotoPublicoResultado {
  cortometrajeId: string;
  titulo: string;
  votos: number;
  porcentaje: number;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [Skeleton],
  templateUrl: './dashboard-page.html',
})
export class DashboardPage {
  private readonly auth = inject(AuthService);
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly evaluaciones = inject(EvaluacionesService);
  private readonly formulario = inject(FormularioService);
  private readonly premiacionesService = inject(PremiacionesService);
  private readonly votosPublicos = inject(VotosPublicosService);
  private readonly confirmar = inject(ConfirmService);

  protected readonly limpiandoDuplicados = signal(false);
  protected readonly barrasVisibles = signal(false);

  constructor() {
    effect(() => {
      if (!this.cargando()) {
        setTimeout(() => this.barrasVisibles.set(true), 50);
      }
    });
  }

  protected readonly cargando = computed(
    () =>
      this.auth.cargandoUsuarios() ||
      this.cortometrajes.cargando() ||
      this.evaluaciones.cargando() ||
      this.formulario.cargando() ||
      this.premiacionesService.cargando() ||
      this.votosPublicos.cargando(),
  );

  protected readonly totalPremiaciones = computed(() => this.premiacionesService.premiaciones().length);

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
    const evaluacionesTodas = this.evaluaciones.evaluacionesParaPremiacion();
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
  protected readonly totalRealizado = computed(() => this.evaluaciones.evaluacionesUnicas().length);

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

  protected readonly evaluacionesDuplicadas = computed<JuezDuplicado[]>(() => {
    const conteoPorJuez = new Map<string, { nombre: string; duplicadas: number }>();
    const vistos = new Map<string, number>();
    for (const e of this.evaluaciones.evaluaciones()) {
      const clave = `${e.juezId}::${e.cortometrajeId}`;
      const veces = (vistos.get(clave) ?? 0) + 1;
      vistos.set(clave, veces);
      if (veces > 1) {
        const actual = conteoPorJuez.get(e.juezId) ?? { nombre: e.jurado, duplicadas: 0 };
        actual.duplicadas += 1;
        conteoPorJuez.set(e.juezId, actual);
      }
    }
    return [...conteoPorJuez.entries()]
      .map(([id, { nombre, duplicadas }]) => ({ id, nombre, cantidad: duplicadas }))
      .sort((a, b) => b.cantidad - a.cantidad);
  });

  protected readonly totalEvaluacionesDuplicadas = computed(() =>
    this.evaluacionesDuplicadas().reduce((total, j) => total + j.cantidad, 0),
  );

  protected async limpiarDuplicados(): Promise<void> {
    const total = this.totalEvaluacionesDuplicadas();
    if (total === 0) return;
    const confirmado = await this.confirmar.pedir(
      `Se eliminarán ${total} evaluación(es) duplicada(s), dejando solo la más antigua de cada juez/cortometraje. Esta acción no se puede deshacer.`,
      { textoAceptar: 'Limpiar duplicados', destructivo: true },
    );
    if (!confirmado) return;
    this.limpiandoDuplicados.set(true);
    try {
      await this.evaluaciones.limpiarDuplicados();
    } finally {
      this.limpiandoDuplicados.set(false);
    }
  }

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
