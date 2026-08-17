import { Component, computed, inject, signal } from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { PeriodosService } from './services/periodos.service';
import { TemaService } from './services/tema.service';
import { ConfirmDialog } from './shared/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialog],
  templateUrl: './app.html',
  host: {
    '(document:click)': 'cerrarMenuUsuario()',
  },
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly tema = inject(TemaService);
  protected readonly periodos = inject(PeriodosService);
  private readonly router = inject(Router);

  protected readonly menuMovilAbierto = signal(false);
  protected readonly menuUsuarioAbierto = signal(false);

  protected readonly iniciales = computed(() => {
    const nombre = this.auth.usuarioActual()?.nombre ?? '';
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('');
  });

  protected readonly enlaces = computed(() => {
    if (this.auth.esAdmin()) {
      return [
        { ruta: '/dashboard', etiqueta: 'Panel' },
        { ruta: '/cortometrajes', etiqueta: 'Cortometrajes' },
        { ruta: '/formulario', etiqueta: 'Formulario de evaluación' },
        { ruta: '/premiaciones', etiqueta: 'Premiaciones' },
        { ruta: '/votacion-publico', etiqueta: 'Votación del público' },
        { ruta: '/resultados', etiqueta: 'Resultados' },
      ];
    }
    if (this.auth.esJuez()) {
      return [{ ruta: '/evaluar', etiqueta: 'Evaluar' }];
    }
    return [];
  });

  constructor() {
    this.router.events.pipe(filter((evento) => evento instanceof NavigationStart)).subscribe(() => {
      this.menuMovilAbierto.set(false);
      this.menuUsuarioAbierto.set(false);
    });
  }

  protected alternarMenuMovil(): void {
    this.menuMovilAbierto.update((abierto) => !abierto);
  }

  protected alternarMenuUsuario(evento: MouseEvent): void {
    evento.stopPropagation();
    this.menuUsuarioAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenuUsuario(): void {
    this.menuUsuarioAbierto.set(false);
  }

  protected cambiarPeriodo(evento: Event): void {
    const id = (evento.target as HTMLSelectElement).value;
    if (id) this.periodos.seleccionar(id);
  }

  protected async cerrarSesion(): Promise<void> {
    await this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
