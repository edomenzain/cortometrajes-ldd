import { Component, computed, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { VotosPublicosService } from '../../services/votos-publicos.service';
import { Skeleton } from '../../shared/skeleton';
import { ConfirmService } from '../../shared/confirm.service';
import { RedSocial } from '../../models/cortometraje.model';
import { RedSocialIcono } from '../../shared/red-social-icono';
import { colorRedSocial, etiquetaRedSocial } from '../../shared/red-social';
import { idDeYoutube } from '../../shared/youtube';

@Component({
  selector: 'app-votar-publico-page',
  imports: [Skeleton, RedSocialIcono],
  templateUrl: './votar-publico-page.html',
})
export class VotarPublicoPage {
  private readonly votosPublicosService = inject(VotosPublicosService);
  private readonly cortometrajesService = inject(CortometrajesService);
  private readonly confirmar = inject(ConfirmService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly cortometrajes = this.cortometrajesService.cortometrajes;
  protected readonly cargando = computed(
    () => this.cortometrajesService.cargando() || this.votosPublicosService.cargando(),
  );
  protected readonly filasEsqueleto = [0, 1, 2, 3];

  protected readonly yaVoto = this.votosPublicosService.yaVoto;
  protected readonly miVoto = this.votosPublicosService.miVoto;
  protected readonly abierta = this.votosPublicosService.abierta;

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

  protected async votar(cortometrajeId: string, titulo: string): Promise<void> {
    const confirmado = await this.confirmar.pedir(`¿Seguro que quieres votar por "${titulo}"? No podrás cambiar tu voto.`, {
      textoAceptar: 'Votar',
    });
    if (confirmado) {
      this.votosPublicosService.votar(cortometrajeId);
    }
  }
}
