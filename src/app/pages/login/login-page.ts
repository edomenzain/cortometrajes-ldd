import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, form, required } from '@angular/forms/signals';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormField],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly modelo = signal({ email: '', password: '' });
  protected readonly f = form(this.modelo, (path) => {
    required(path.email, { message: 'El email es obligatorio' });
    required(path.password, { message: 'La contraseña es obligatoria' });
  });

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async iniciarSesion(): Promise<void> {
    if (!this.f().valid()) {
      this.f().markAsTouched();
      return;
    }
    this.error.set(null);
    this.enviando.set(true);
    const { email, password } = this.modelo();
    const ok = await this.auth.iniciarSesion(email, password);
    this.enviando.set(false);
    if (!ok) {
      this.error.set('Email o contraseña incorrectos.');
      return;
    }
    const destino = this.auth.esAdmin() ? '/dashboard' : '/evaluar';
    this.router.navigateByUrl(destino);
  }
}
