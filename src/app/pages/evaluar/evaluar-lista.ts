import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';
import { idDeYoutube } from '../../shared/youtube';

@Component({
  selector: 'app-evaluar-lista',
  imports: [RouterLink],
  templateUrl: './evaluar-lista.html',
})
export class EvaluarLista {
  private readonly auth = inject(AuthService);
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly evaluaciones = inject(EvaluacionesService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly lista = this.cortometrajes.cortometrajes;

  protected urlEmbed(youtubeUrl: string | undefined): SafeResourceUrl | null {
    const videoId = idDeYoutube(youtubeUrl);
    if (!videoId) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }

  protected totalEvaluaciones(cortometrajeId: string): number {
    return this.evaluaciones.porCortometraje(cortometrajeId).length;
  }

  protected yaEvaluado(cortometrajeId: string): boolean {
    const juezId = this.auth.usuarioActual()?.id;
    return juezId ? this.evaluaciones.yaEvaluo(juezId, cortometrajeId) : false;
  }
}
