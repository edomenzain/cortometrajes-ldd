import { Component, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { idDeYoutube } from '../../shared/youtube';
import { Skeleton } from '../../shared/skeleton';
import { FieldError } from '../../shared/field-error';

@Component({
  selector: 'app-cortometrajes-page',
  imports: [FormField, Skeleton, FieldError],
  templateUrl: './cortometrajes-page.html',
})
export class CortometrajesPage {
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly lista = this.cortometrajes.cortometrajes;
  protected readonly cargando = this.cortometrajes.cargando;
  protected readonly filasEsqueleto = [0, 1, 2];

  protected readonly modelo = signal({ titulo: '', descripcion: '', youtubeUrl: '' });
  protected readonly f = form(this.modelo, (path) => {
    required(path.titulo, { message: 'El título es obligatorio' });
    required(path.descripcion, { message: 'La descripción es obligatoria' });
  });

  protected readonly editandoId = signal<string | null>(null);
  protected readonly modeloEdicion = signal({ titulo: '', descripcion: '', youtubeUrl: '' });
  protected readonly fEdicion = form(this.modeloEdicion, (path) => {
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

  protected editar(id: string): void {
    const corto = this.cortometrajes.porId(id);
    if (!corto) return;
    this.modeloEdicion.set({
      titulo: corto.titulo,
      descripcion: corto.descripcion,
      youtubeUrl: corto.youtubeUrl ?? '',
    });
    this.editandoId.set(id);
  }

  protected guardarEdicion(id: string): void {
    if (!this.fEdicion().valid()) {
      this.fEdicion().markAsTouched();
      return;
    }
    this.cortometrajes.editar(id, this.modeloEdicion());
    this.editandoId.set(null);
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  protected eliminar(id: string): void {
    this.cortometrajes.eliminar(id);
  }
}
