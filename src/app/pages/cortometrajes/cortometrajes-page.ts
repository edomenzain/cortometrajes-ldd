import { Component, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { idDeYoutube } from '../../shared/youtube';

@Component({
  selector: 'app-cortometrajes-page',
  imports: [FormField],
  templateUrl: './cortometrajes-page.html',
})
export class CortometrajesPage {
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly lista = this.cortometrajes.cortometrajes;

  protected readonly modelo = signal({ titulo: '', descripcion: '', youtubeUrl: '' });
  protected readonly f = form(this.modelo, (path) => {
    required(path.titulo, { message: 'El título es obligatorio' });
    required(path.descripcion, { message: 'La descripción es obligatoria' });
  });

  protected urlEmbed(youtubeUrl: string | undefined): SafeResourceUrl | null {
    const videoId = idDeYoutube(youtubeUrl);
    if (!videoId) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }

  protected guardar(): void {
    if (!this.f().valid()) {
      this.f().markAsTouched();
      return;
    }
    const datos = this.modelo();
    this.cortometrajes.agregar(datos);
    this.modelo.set({ titulo: '', descripcion: '', youtubeUrl: '' });
  }

  protected eliminar(id: string): void {
    this.cortometrajes.eliminar(id);
  }
}
