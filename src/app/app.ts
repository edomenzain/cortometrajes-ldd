import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { TemaService } from './services/tema.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly tema = inject(TemaService);
  private readonly router = inject(Router);

  protected readonly enlaces = computed(() => {
    if (this.auth.esAdmin()) {
      return [
        { ruta: '/cortometrajes', etiqueta: 'Cortometrajes' },
        { ruta: '/formulario', etiqueta: 'Formulario de evaluación' },
        { ruta: '/jueces', etiqueta: 'Jueces' },
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

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
