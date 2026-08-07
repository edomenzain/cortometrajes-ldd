import { Component, computed, inject } from '@angular/core';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { VotosPublicosService } from '../../services/votos-publicos.service';
import { Skeleton } from '../../shared/skeleton';
import { ConfirmService } from '../../shared/confirm.service';

@Component({
  selector: 'app-votar-publico-page',
  imports: [Skeleton],
  templateUrl: './votar-publico-page.html',
})
export class VotarPublicoPage {
  private readonly votosPublicosService = inject(VotosPublicosService);
  private readonly cortometrajesService = inject(CortometrajesService);
  private readonly confirmar = inject(ConfirmService);
  protected readonly cortometrajes = this.cortometrajesService.cortometrajes;
  protected readonly cargando = computed(
    () => this.cortometrajesService.cargando() || this.votosPublicosService.cargando(),
  );
  protected readonly filasEsqueleto = [0, 1, 2, 3];

  protected readonly yaVoto = this.votosPublicosService.yaVoto;
  protected readonly miVoto = this.votosPublicosService.miVoto;
  protected readonly abierta = this.votosPublicosService.abierta;

  protected async votar(cortometrajeId: string, titulo: string): Promise<void> {
    const confirmado = await this.confirmar.pedir(`¿Seguro que quieres votar por "${titulo}"? No podrás cambiar tu voto.`, {
      textoAceptar: 'Votar',
    });
    if (confirmado) {
      this.votosPublicosService.votar(cortometrajeId);
    }
  }
}
