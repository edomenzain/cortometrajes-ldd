import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { PeriodosService } from '../../services/periodos.service';
import { Skeleton } from '../../shared/skeleton';
import { FieldError } from '../../shared/field-error';
import { ConfirmService } from '../../shared/confirm.service';

interface ModeloPeriodo {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

const MODELO_VACIO: ModeloPeriodo = { nombre: '', fechaInicio: '', fechaFin: '' };

@Component({
  selector: 'app-periodos-page',
  imports: [FormField, Skeleton, FieldError],
  templateUrl: './periodos-page.html',
})
export class PeriodosPage {
  private readonly periodosService = inject(PeriodosService);
  private readonly confirmar = inject(ConfirmService);

  protected readonly lista = this.periodosService.ordenados;
  protected readonly cargando = this.periodosService.cargando;
  protected readonly activoId = computed(() => this.periodosService.activo()?.id);
  protected readonly seleccionadoId = computed(() => this.periodosService.seleccionado()?.id);
  protected readonly filasEsqueleto = [0, 1, 2];

  protected readonly modelo = signal<ModeloPeriodo>({ ...MODELO_VACIO });
  protected readonly f = form(this.modelo, (path) => {
    required(path.nombre, { message: 'El nombre es obligatorio' });
    required(path.fechaInicio, { message: 'La fecha de inicio es obligatoria' });
    required(path.fechaFin, { message: 'La fecha de fin es obligatoria' });
  });
  protected readonly errorRango = signal<string | null>(null);

  protected readonly editandoId = signal<string | null>(null);
  protected readonly modeloEdicion = signal<ModeloPeriodo>({ ...MODELO_VACIO });
  protected readonly fEdicion = form(this.modeloEdicion, (path) => {
    required(path.nombre, { message: 'El nombre es obligatorio' });
    required(path.fechaInicio, { message: 'La fecha de inicio es obligatoria' });
    required(path.fechaFin, { message: 'La fecha de fin es obligatoria' });
  });
  protected readonly errorRangoEdicion = signal<string | null>(null);

  protected guardar(): void {
    if (!this.f().valid()) {
      this.f().markAsTouched();
      return;
    }
    const datos = this.modelo();
    const fechaInicio = new Date(datos.fechaInicio).getTime();
    const fechaFin = new Date(datos.fechaFin).getTime();
    if (fechaFin < fechaInicio) {
      this.errorRango.set('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    this.errorRango.set(null);
    this.periodosService.agregar({ nombre: datos.nombre, fechaInicio, fechaFin });
    this.modelo.set({ ...MODELO_VACIO });
  }

  protected editar(id: string): void {
    const periodo = this.periodosService.porId(id);
    if (!periodo) return;
    this.modeloEdicion.set({
      nombre: periodo.nombre,
      fechaInicio: this.aFechaInput(periodo.fechaInicio),
      fechaFin: this.aFechaInput(periodo.fechaFin),
    });
    this.errorRangoEdicion.set(null);
    this.editandoId.set(id);
  }

  protected guardarEdicion(id: string): void {
    if (!this.fEdicion().valid()) {
      this.fEdicion().markAsTouched();
      return;
    }
    const datos = this.modeloEdicion();
    const fechaInicio = new Date(datos.fechaInicio).getTime();
    const fechaFin = new Date(datos.fechaFin).getTime();
    if (fechaFin < fechaInicio) {
      this.errorRangoEdicion.set('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    this.errorRangoEdicion.set(null);
    this.periodosService.editar(id, { nombre: datos.nombre, fechaInicio, fechaFin });
    this.editandoId.set(null);
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  protected async eliminar(id: string, nombre: string): Promise<void> {
    const confirmado = await this.confirmar.pedir(`¿Eliminar el periodo "${nombre}"?`, {
      textoAceptar: 'Eliminar',
      destructivo: true,
    });
    if (confirmado) {
      this.periodosService.eliminar(id);
    }
  }

  protected seleccionar(id: string): void {
    this.periodosService.seleccionar(id);
  }

  protected formatearFecha(ms: number): string {
    return new Date(ms).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  private aFechaInput(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
  }
}
