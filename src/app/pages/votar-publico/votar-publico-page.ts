import { Component, inject } from '@angular/core';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { VotosPublicosService } from '../../services/votos-publicos.service';

@Component({
  selector: 'app-votar-publico-page',
  templateUrl: './votar-publico-page.html',
})
export class VotarPublicoPage {
  private readonly votosPublicos = inject(VotosPublicosService);
  protected readonly cortometrajes = inject(CortometrajesService).cortometrajes;

  protected readonly yaVoto = this.votosPublicos.yaVoto;
  protected readonly miVoto = this.votosPublicos.miVoto;

  protected votar(cortometrajeId: string): void {
    this.votosPublicos.votar(cortometrajeId);
  }
}
