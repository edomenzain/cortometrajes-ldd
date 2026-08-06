import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';

@Component({
  selector: 'app-evaluar-lista',
  imports: [RouterLink],
  templateUrl: './evaluar-lista.html',
})
export class EvaluarLista {
  private readonly auth = inject(AuthService);
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly evaluaciones = inject(EvaluacionesService);
  protected readonly lista = this.cortometrajes.cortometrajes;

  protected totalEvaluaciones(cortometrajeId: string): number {
    return this.evaluaciones.porCortometraje(cortometrajeId).length;
  }

  protected yaEvaluado(cortometrajeId: string): boolean {
    const juezId = this.auth.usuarioActual()?.id;
    return juezId ? this.evaluaciones.yaEvaluo(juezId, cortometrajeId) : false;
  }
}
