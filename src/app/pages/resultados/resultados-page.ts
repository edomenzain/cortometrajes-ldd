import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';
import { FormularioService } from '../../services/formulario.service';
import { PremiacionesService } from '../../services/premiaciones.service';
import { VotosPublicosService } from '../../services/votos-publicos.service';
import { Skeleton } from '../../shared/skeleton';

interface FilaReporte {
  seccion: string;
  criterio: string;
  promedio: number;
}

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

  protected async generarReporte(cortometrajeId: string): Promise<void> {
    const corto = this.cortometrajes.cortometrajes().find((c) => c.id === cortometrajeId);
    if (!corto) return;

    const usuario = this.auth.usuarioActual();
    const todas = this.evaluaciones.evaluacionesParaPremiacion();
    const evaluacionesTodas = usuario?.rol === 'admin' ? todas : todas.filter((e) => e.juezId === usuario?.id);
    const evaluaciones = evaluacionesTodas.filter((e) => e.cortometrajeId === corto.id);
    if (evaluaciones.length === 0) return;

    const filas: FilaReporte[] = [];
    for (const seccion of this.formulario.secciones()) {
      for (const criterio of seccion.criterios) {
        const valores = evaluaciones
          .map((e) => e.puntuaciones[criterio.id])
          .filter((v): v is number => v !== undefined);
        const promedio = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
        filas.push({ seccion: seccion.nombre, criterio: criterio.texto, promedio });
      }
    }

    const promedioGeneral =
      evaluaciones.reduce((suma, e) => {
        const valores = Object.values(e.puntuaciones);
        return suma + (valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0);
      }, 0) / evaluaciones.length;

    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Reporte de evaluación: ${corto.titulo}`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-MX')}`, 14, 24);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Promedio general: ${promedioGeneral.toFixed(2)} / 10`, 14, 34);
    doc.text(`Total de evaluaciones: ${evaluaciones.length}`, 14, 40);

    autoTable(doc, {
      startY: 46,
      head: [['Sección', 'Criterio', 'Promedio']],
      body: filas.map((fila) => [fila.seccion, fila.criterio, fila.promedio.toFixed(2)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [51, 51, 51] },
    });

    const comentarios = evaluaciones
      .map((e, i) => ({ juez: `Juez ${i + 1}`, comentario: e.comentario.trim() }))
      .filter((c) => c.comentario.length > 0);

    let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    doc.setFontSize(13);
    doc.text('Comentarios anónimos', 14, y);
    y += 8;
    doc.setFontSize(10);

    if (comentarios.length === 0) {
      doc.setTextColor(100);
      doc.text('Sin comentarios registrados.', 14, y);
    } else {
      for (const c of comentarios) {
        if (y > 280) {
          doc.addPage();
          y = 18;
        }
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(`${c.juez}:`, 14, y);
        doc.setFont('helvetica', 'normal');
        const lineas = doc.splitTextToSize(c.comentario, 180);
        doc.text(lineas, 14, y + 5);
        y += 5 + lineas.length * 5 + 4;
      }
    }

    doc.save(`reporte-${corto.titulo.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`);
  }

  private calcularRanking(
    filtrarPuntuaciones: (puntuaciones: Record<string, number>) => [string, number][],
  ): Ranking[] {
    const usuario = this.auth.usuarioActual();
    const todas = this.evaluaciones.evaluacionesParaPremiacion();
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
