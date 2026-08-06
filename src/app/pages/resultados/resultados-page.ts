import { Component, computed, inject } from '@angular/core';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';

interface Ranking {
  cortometrajeId: string;
  titulo: string;
  promedio: number;
  totalEvaluaciones: number;
}

interface ItemPodio extends Ranking {
  puesto: number;
}

@Component({
  selector: 'app-resultados-page',
  templateUrl: './resultados-page.html',
})
export class ResultadosPage {
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly evaluaciones = inject(EvaluacionesService);

  protected readonly ranking = computed<Ranking[]>(() => {
    const evaluacionesTodas = this.evaluaciones.evaluaciones();
    return this.cortometrajes
      .cortometrajes()
      .map((corto) => {
        const propias = evaluacionesTodas.filter((e) => e.cortometrajeId === corto.id);
        const promedios = propias.map((e) => {
          const valores = Object.values(e.puntuaciones);
          return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
        });
        const promedio = promedios.length ? promedios.reduce((a, b) => a + b, 0) / promedios.length : 0;
        return {
          cortometrajeId: corto.id,
          titulo: corto.titulo,
          promedio,
          totalEvaluaciones: propias.length,
        };
      })
      .sort((a, b) => b.promedio - a.promedio);
  });

  protected readonly podio = computed<ItemPodio[]>(() =>
    this.ranking()
      .slice(0, 3)
      .map((item, i) => ({ ...item, puesto: i + 1 })),
  );
}
