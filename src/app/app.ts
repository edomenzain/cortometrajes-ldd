import { Component, computed, inject, signal } from '@angular/core';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { TemaService } from './services/tema.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  host: {
    '(document:click)': 'cerrarMenuUsuario()',
  },
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly tema = inject(TemaService);
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
        { ruta: '/jueces', etiqueta: 'Jueces' },
        { ruta: '/premiaciones', etiqueta: 'Premiaciones' },
        { ruta: '/resultados', etiqueta: 'Resultados' },
      ];
    }
    if (this.auth.esJuez()) {
      return [
        { ruta: '/evaluar', etiqueta: 'Evaluar' },
        { ruta: '/resultados', etiqueta: 'Resultados' },
      ];
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

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
