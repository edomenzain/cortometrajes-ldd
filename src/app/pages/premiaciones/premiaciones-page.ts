import { Component, inject, signal } from '@angular/core';
import { PremiacionesService } from '../../services/premiaciones.service';
import { FormularioService } from '../../services/formulario.service';
import { Skeleton } from '../../shared/skeleton';
import { ConfirmService } from '../../shared/confirm.service';

@Component({
  selector: 'app-premiaciones-page',
  imports: [Skeleton],
  templateUrl: './premiaciones-page.html',
})
export class PremiacionesPage {
  private readonly premiacionesService = inject(PremiacionesService);
  private readonly formulario = inject(FormularioService);
  private readonly confirmar = inject(ConfirmService);

  protected readonly premiaciones = this.premiacionesService.premiaciones;
  protected readonly cargando = this.premiacionesService.cargando;
  protected readonly filasEsqueleto = [0, 1, 2];

  protected readonly editandoId = signal<string | null>(null);

  protected agregar(input: HTMLInputElement): void {
    this.premiacionesService.agregar(input.value);
    input.value = '';
    input.focus();
  }

  protected editar(id: string): void {
    this.editandoId.set(id);
  }

  protected guardarEdicion(id: string, input: HTMLInputElement): void {
    this.premiacionesService.editar(id, input.value);
    this.editandoId.set(null);
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  protected async eliminar(id: string, nombre: string): Promise<void> {
    const confirmado = await this.confirmar.pedir(`¿Eliminar la premiación "${nombre}"?`, {
      textoAceptar: 'Eliminar',
      destructivo: true,
    });
    if (confirmado) {
      this.premiacionesService.eliminar(id);
      this.formulario.quitarPremiacionDeSecciones(id);
    }
  }
}
