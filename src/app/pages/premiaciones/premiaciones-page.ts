import { Component, inject } from '@angular/core';
import { PremiacionesService } from '../../services/premiaciones.service';
import { FormularioService } from '../../services/formulario.service';

@Component({
  selector: 'app-premiaciones-page',
  templateUrl: './premiaciones-page.html',
})
export class PremiacionesPage {
  private readonly premiacionesService = inject(PremiacionesService);
  private readonly formulario = inject(FormularioService);

  protected readonly premiaciones = this.premiacionesService.premiaciones;

  protected agregar(input: HTMLInputElement): void {
    this.premiacionesService.agregar(input.value);
    input.value = '';
    input.focus();
  }

  protected eliminar(id: string, nombre: string): void {
    if (confirm(`¿Eliminar la premiación "${nombre}"?`)) {
      this.premiacionesService.eliminar(id);
      this.formulario.quitarPremiacionDeSecciones(id);
    }
  }
}
