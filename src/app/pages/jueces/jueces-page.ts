import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { AuthService } from '../../services/auth.service';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { EvaluacionesService } from '../../services/evaluaciones.service';

interface FilaJuez {
  id: string;
  nombre: string;
  email: string;
  evaluados: number;
  total: number;
  pendientes: string[];
}

@Component({
  selector: 'app-jueces-page',
  imports: [FormField],
  templateUrl: './jueces-page.html',
})
export class JuecesPage {
  private readonly auth = inject(AuthService);
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly evaluaciones = inject(EvaluacionesService);

  protected readonly modelo = signal({ nombre: '', email: '', password: '' });
  protected readonly f = form(this.modelo, (path) => {
    required(path.nombre, { message: 'El nombre es obligatorio' });
    required(path.email, { message: 'El email es obligatorio' });
    required(path.password, { message: 'La contraseña es obligatoria' });
  });

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly filas = computed<FilaJuez[]>(() => {
    const cortos = this.cortometrajes.cortometrajes();
    return this.auth.jueces().map((juez) => {
      const propias = this.evaluaciones.porJuez(juez.id);
      const evaluadosIds = new Set(propias.map((e) => e.cortometrajeId));
      return {
        id: juez.id,
        nombre: juez.nombre,
        email: juez.email,
        evaluados: evaluadosIds.size,
        total: cortos.length,
        pendientes: cortos.filter((c) => !evaluadosIds.has(c.id)).map((c) => c.titulo),
      };
    });
  });

  protected async agregar(): Promise<void> {
    if (!this.f().valid()) {
      this.f().markAsTouched();
      return;
    }
    this.error.set(null);
    this.enviando.set(true);
    const resultado = await this.auth.agregarJuez(this.modelo());
    this.enviando.set(false);
    if (!resultado.ok) {
      this.error.set(resultado.error ?? 'No se pudo agregar el juez.');
      return;
    }
    this.modelo.set({ nombre: '', email: '', password: '' });
  }

  protected eliminar(id: string, nombre: string): void {
    const tieneEvaluaciones = this.evaluaciones.porJuez(id).length > 0;
    const aviso = tieneEvaluaciones
      ? `${nombre} ya tiene evaluaciones registradas. ¿Eliminarlo de todas formas?`
      : `¿Eliminar a ${nombre}?`;
    if (confirm(aviso)) {
      this.auth.eliminarJuez(id);
    }
  }
}
