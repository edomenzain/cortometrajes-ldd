import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { DOCUMENT } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { CampanaMarketing, RedSocial } from '../../models/cortometraje.model';
import { idDeYoutube } from '../../shared/youtube';
import { Skeleton } from '../../shared/skeleton';
import { FieldError } from '../../shared/field-error';
import { RedSocialIcono } from '../../shared/red-social-icono';
import { REDES_SOCIALES, colorRedSocial, etiquetaRedSocial } from '../../shared/red-social';

@Component({
  selector: 'app-cortometrajes-page',
  imports: [FormField, Skeleton, FieldError, RedSocialIcono],
  templateUrl: './cortometrajes-page.html',
})
export class CortometrajesPage {
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly document = inject(DOCUMENT);
  protected readonly lista = this.cortometrajes.cortometrajes;
  protected readonly cargando = this.cortometrajes.cargando;
  protected readonly filasEsqueleto = [0, 1, 2];
  protected readonly redesSociales = REDES_SOCIALES;

  protected readonly modelo = signal({ titulo: '', descripcion: '', director: '', youtubeUrl: '' });
  protected readonly f = form(this.modelo, (path) => {
    required(path.titulo, { message: 'El título es obligatorio' });
    required(path.descripcion, { message: 'La descripción es obligatoria' });
    required(path.director, { message: 'El director es obligatorio' });
  });
  protected readonly campanas = signal<CampanaMarketing[]>([]);
  protected readonly campanaRedSocial = signal<RedSocial | ''>('');
  protected readonly campanaLiga = signal('');
  protected readonly campanaLigaError = signal<string | null>(null);
  protected readonly redesDisponibles = computed(() =>
    this.redesSociales.filter((r) => !this.campanas().some((c) => c.redSocial === r.valor)),
  );

  protected readonly editandoId = signal<string | null>(null);

  protected etiquetaRedSocial(valor: RedSocial): string {
    return etiquetaRedSocial(valor);
  }

  protected colorRedSocial(valor: RedSocial | ''): string {
    return colorRedSocial(valor);
  }

  protected actualizarCampanaRedSocial(evento: Event): void {
    this.campanaRedSocial.set((evento.target as HTMLSelectElement).value as RedSocial | '');
  }

  protected actualizarCampanaLiga(evento: Event): void {
    this.campanaLiga.set((evento.target as HTMLInputElement).value);
    this.campanaLigaError.set(null);
  }

  private ligaValida(liga: string): boolean {
    try {
      const url = new URL(liga);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  protected urlEmbed(youtubeUrl: string | undefined): SafeResourceUrl | null {
    const videoId = idDeYoutube(youtubeUrl);
    if (!videoId) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }

  protected agregarCampana(): void {
    const redSocial = this.campanaRedSocial();
    const liga = this.campanaLiga().trim();
    if (!redSocial || !liga) return;
    if (!this.ligaValida(liga)) {
      this.campanaLigaError.set('Ingresa una liga válida (debe iniciar con http:// o https://).');
      return;
    }
    this.campanas.update((actuales) => [...actuales, { redSocial, liga }]);
    this.campanaRedSocial.set('');
    this.campanaLiga.set('');
    this.campanaLigaError.set(null);
  }

  protected quitarCampana(index: number): void {
    this.campanas.update((actuales) => actuales.filter((_, i) => i !== index));
  }

  private limpiarFormulario(): void {
    this.modelo.set({ titulo: '', descripcion: '', director: '', youtubeUrl: '' });
    this.campanas.set([]);
    this.campanaRedSocial.set('');
    this.campanaLiga.set('');
    this.campanaLigaError.set(null);
    this.editandoId.set(null);
  }

  protected guardar(): void {
    if (!this.f().valid()) {
      this.f().markAsTouched();
      return;
    }
    const id = this.editandoId();
    if (id) {
      this.cortometrajes.editar(id, { ...this.modelo(), campanas: this.campanas() });
    } else {
      this.cortometrajes.agregar({ ...this.modelo(), campanas: this.campanas() });
    }
    this.limpiarFormulario();
  }

  protected editar(id: string): void {
    const corto = this.cortometrajes.porId(id);
    if (!corto) return;
    this.modelo.set({
      titulo: corto.titulo,
      descripcion: corto.descripcion,
      director: corto.director,
      youtubeUrl: corto.youtubeUrl ?? '',
    });
    this.campanas.set(corto.campanasMarketing ?? []);
    this.campanaRedSocial.set('');
    this.campanaLiga.set('');
    this.campanaLigaError.set(null);
    this.editandoId.set(id);
    this.document.getElementById('formulario-cortometraje')?.scrollIntoView({ behavior: 'smooth' });
  }

  protected cancelarEdicion(): void {
    this.limpiarFormulario();
  }

  protected eliminar(id: string): void {
    this.cortometrajes.eliminar(id);
  }
}
