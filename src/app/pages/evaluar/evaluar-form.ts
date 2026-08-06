import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { FormularioService } from '../../services/formulario.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';
import { SelectorPuntuacion } from '../../shared/selector-puntuacion';

@Component({
  selector: 'app-evaluar-form',
  imports: [RouterLink, SelectorPuntuacion],
  templateUrl: './evaluar-form.html',
})
export class EvaluarForm {
  readonly id = input.required<string>();

  private readonly auth = inject(AuthService);
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly formulario = inject(FormularioService);
  private readonly evaluaciones = inject(EvaluacionesService);
  private readonly router = inject(Router);

  protected readonly juez = this.auth.usuarioActual;
  protected readonly cortometraje = computed(() => this.cortometrajes.porId(this.id()));
  protected readonly secciones = this.formulario.secciones;

  protected readonly yaEvaluado = computed(() => {
    const juezId = this.juez()?.id;
    return juezId ? this.evaluaciones.yaEvaluo(juezId, this.id()) : false;
  });

  protected readonly comentario = signal('');
  protected readonly puntuaciones = signal<Record<string, number>>({});
  protected readonly intentoEnviar = signal(false);

  protected readonly modoVista = signal<'pasos' | 'completo'>('pasos');
  protected readonly pasoActual = signal(0);

  private readonly totalCriterios = computed(() =>
    this.secciones().reduce((total, s) => total + s.criterios.length, 0),
  );

  protected readonly faltanPuntuaciones = computed(
    () => Object.keys(this.puntuaciones()).length < this.totalCriterios(),
  );

  protected readonly faltaComentario = computed(() => this.comentario().trim().length === 0);

  protected readonly seccionesConEstado = computed(() => {
    const puntuaciones = this.puntuaciones();
    return this.secciones().map((seccion) => ({
      seccion,
      completa: seccion.criterios.every((c) => puntuaciones[c.id] !== undefined),
    }));
  });

  protected readonly esUltimoPaso = computed(() => this.pasoActual() === this.secciones().length - 1);

  protected readonly promedio = computed(() => {
    const valores = Object.values(this.puntuaciones());
    if (valores.length === 0) return 0;
    return valores.reduce((a, b) => a + b, 0) / valores.length;
  });

  protected establecerPuntuacion(criterioId: string, valor: number): void {
    this.puntuaciones.update((actual) => ({ ...actual, [criterioId]: valor }));
  }

  protected cambiarModoVista(modo: 'pasos' | 'completo'): void {
    this.modoVista.set(modo);
  }

  protected irAPaso(indice: number): void {
    this.pasoActual.set(indice);
  }

  protected pasoAnterior(): void {
    this.pasoActual.update((p) => Math.max(0, p - 1));
  }

  protected pasoSiguiente(): void {
    this.pasoActual.update((p) => Math.min(this.secciones().length - 1, p + 1));
  }

  protected enviar(): void {
    this.intentoEnviar.set(true);
    const juez = this.juez();
    if (!juez || this.faltanPuntuaciones() || this.faltaComentario()) return;

    this.evaluaciones.agregar({
      cortometrajeId: this.id(),
      juezId: juez.id,
      jurado: juez.nombre,
      puntuaciones: this.puntuaciones(),
      comentario: this.comentario(),
    });
    this.router.navigate(['/resultados']);
  }
}
