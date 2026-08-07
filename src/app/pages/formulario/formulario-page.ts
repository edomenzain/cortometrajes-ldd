import { Component, computed, inject } from '@angular/core';
import { FormularioService } from '../../services/formulario.service';
import { PremiacionesService } from '../../services/premiaciones.service';
import { Skeleton } from '../../shared/skeleton';

@Component({
  selector: 'app-formulario-page',
  imports: [Skeleton],
  templateUrl: './formulario-page.html',
})
export class FormularioPage {
  private readonly formulario = inject(FormularioService);
  private readonly premiacionesService = inject(PremiacionesService);
  protected readonly secciones = this.formulario.secciones;
  protected readonly premiaciones = this.premiacionesService.premiaciones;
  protected readonly cargando = computed(() => this.formulario.cargando() || this.premiacionesService.cargando());
  protected readonly filasEsqueleto = [0, 1, 2];

  protected agregarSeccion(input: HTMLInputElement): void {
    this.formulario.agregarSeccion(input.value);
    input.value = '';
    input.focus();
  }

  protected eliminarSeccion(seccionId: string): void {
    this.formulario.eliminarSeccion(seccionId);
  }

  protected agregarCriterio(seccionId: string, input: HTMLInputElement): void {
    this.formulario.agregarCriterio(seccionId, input.value);
    input.value = '';
    input.focus();
  }

  protected eliminarCriterio(seccionId: string, criterioId: string): void {
    this.formulario.eliminarCriterio(seccionId, criterioId);
  }

  protected alternarPremiacion(seccionId: string, premiacionId: string, seleccionada: boolean): void {
    this.formulario.alternarPremiacion(seccionId, premiacionId, seleccionada);
  }
}
