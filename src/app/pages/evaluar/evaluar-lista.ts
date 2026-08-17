import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';
import { RedSocial } from '../../models/cortometraje.model';
import { idDeYoutube } from '../../shared/youtube';
import { Skeleton } from '../../shared/skeleton';
import { RedSocialIcono } from '../../shared/red-social-icono';
import { colorRedSocial, etiquetaRedSocial } from '../../shared/red-social';

@Component({
  selector: 'app-evaluar-lista',
  imports: [RouterLink, Skeleton, RedSocialIcono],
  templateUrl: './evaluar-lista.html',
})
export class EvaluarLista {
  private readonly auth = inject(AuthService);
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly evaluaciones = inject(EvaluacionesService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly lista = this.cortometrajes.cortometrajes;
  protected readonly cargando = this.cortometrajes.cargando;
  protected readonly filasEsqueleto = [0, 1, 2];

  protected urlEmbed(youtubeUrl: string | undefined): SafeResourceUrl | null {
    const videoId = idDeYoutube(youtubeUrl);
    if (!videoId) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }

  protected etiquetaRedSocial(valor: RedSocial): string {
    return etiquetaRedSocial(valor);
  }

  protected colorRedSocial(valor: RedSocial): string {
    return colorRedSocial(valor);
  }

  protected yaEvaluado(cortometrajeId: string): boolean {
    const juezId = this.auth.usuarioActual()?.id;
    return juezId ? this.evaluaciones.yaEvaluo(juezId, cortometrajeId) : false;
  }
}
