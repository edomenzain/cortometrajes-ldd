import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CortometrajesService } from '../../services/cortometrajes.service';
import { CampanaMarketing, RedSocial } from '../../models/cortometraje.model';
import { idDeYoutube } from '../../shared/youtube';
import { Skeleton } from '../../shared/skeleton';
import { FieldError } from '../../shared/field-error';
import { RedSocialIcono } from '../../shared/red-social-icono';

export const REDES_SOCIALES: { valor: RedSocial; etiqueta: string }[] = [
  { valor: 'facebook', etiqueta: 'Facebook' },
  { valor: 'instagram', etiqueta: 'Instagram' },
  { valor: 'tiktok', etiqueta: 'TikTok' },
  { valor: 'youtube', etiqueta: 'YouTube' },
  { valor: 'x', etiqueta: 'X' },
];

@Component({
  selector: 'app-cortometrajes-page',
  imports: [FormField, Skeleton, FieldError, RedSocialIcono],
  templateUrl: './cortometrajes-page.html',
})
export class CortometrajesPage {
  private readonly cortometrajes = inject(CortometrajesService);
  private readonly sanitizer = inject(DomSanitizer);
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
  protected readonly modeloEdicion = signal({ titulo: '', descripcion: '', director: '', youtubeUrl: '' });
  protected readonly fEdicion = form(this.modeloEdicion, (path) => {
    required(path.titulo, { message: 'El título es obligatorio' });
    required(path.descripcion, { message: 'La descripción es obligatoria' });
    required(path.director, { message: 'El director es obligatorio' });
  });
  protected readonly campanasEdicion = signal<CampanaMarketing[]>([]);
  protected readonly campanaRedSocialEdicion = signal<RedSocial | ''>('');
  protected readonly campanaLigaEdicion = signal('');
  protected readonly campanaLigaErrorEdicion = signal<string | null>(null);
  protected readonly redesDisponiblesEdicion = computed(() =>
    this.redesSociales.filter((r) => !this.campanasEdicion().some((c) => c.redSocial === r.valor)),
  );

  protected etiquetaRedSocial(valor: RedSocial): string {
    return this.redesSociales.find((r) => r.valor === valor)?.etiqueta ?? valor;
  }

  protected colorRedSocial(valor: RedSocial | ''): string {
    switch (valor) {
      case 'facebook':
        return '#1877f2';
      case 'instagram':
        return 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)';
      case 'tiktok':
        return '#010101';
      case 'youtube':
        return '#ff0000';
      case 'x':
        return '#1a1a1a';
      default:
        return '#9ca3af';
    }
  }

  protected actualizarCampanaRedSocial(evento: Event): void {
    this.campanaRedSocial.set((evento.target as HTMLSelectElement).value as RedSocial | '');
  }

  protected actualizarCampanaLiga(evento: Event): void {
    this.campanaLiga.set((evento.target as HTMLInputElement).value);
    this.campanaLigaError.set(null);
  }

  protected actualizarCampanaRedSocialEdicion(evento: Event): void {
    this.campanaRedSocialEdicion.set((evento.target as HTMLSelectElement).value as RedSocial | '');
  }

  protected actualizarCampanaLigaEdicion(evento: Event): void {
    this.campanaLigaEdicion.set((evento.target as HTMLInputElement).value);
    this.campanaLigaErrorEdicion.set(null);
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

  protected agregarCampanaEdicion(): void {
    const redSocial = this.campanaRedSocialEdicion();
    const liga = this.campanaLigaEdicion().trim();
    if (!redSocial || !liga) return;
    if (!this.ligaValida(liga)) {
      this.campanaLigaErrorEdicion.set('Ingresa una liga válida (debe iniciar con http:// o https://).');
      return;
    }
    this.campanasEdicion.update((actuales) => [...actuales, { redSocial, liga }]);
    this.campanaRedSocialEdicion.set('');
    this.campanaLigaEdicion.set('');
    this.campanaLigaErrorEdicion.set(null);
  }

  protected quitarCampanaEdicion(index: number): void {
    this.campanasEdicion.update((actuales) => actuales.filter((_, i) => i !== index));
  }

  protected guardar(): void {
    if (!this.f().valid()) {
      this.f().markAsTouched();
      return;
    }
    this.cortometrajes.agregar({ ...this.modelo(), campanas: this.campanas() });
    this.modelo.set({ titulo: '', descripcion: '', director: '', youtubeUrl: '' });
    this.campanas.set([]);
    this.campanaRedSocial.set('');
    this.campanaLiga.set('');
    this.campanaLigaError.set(null);
  }

  protected editar(id: string): void {
    const corto = this.cortometrajes.porId(id);
    if (!corto) return;
    this.modeloEdicion.set({
      titulo: corto.titulo,
      descripcion: corto.descripcion,
      director: corto.director,
      youtubeUrl: corto.youtubeUrl ?? '',
    });
    this.campanasEdicion.set(corto.campanasMarketing ?? []);
    this.campanaRedSocialEdicion.set('');
    this.campanaLigaEdicion.set('');
    this.campanaLigaErrorEdicion.set(null);
    this.editandoId.set(id);
  }

  protected guardarEdicion(id: string): void {
    if (!this.fEdicion().valid()) {
      this.fEdicion().markAsTouched();
      return;
    }
    this.cortometrajes.editar(id, { ...this.modeloEdicion(), campanas: this.campanasEdicion() });
    this.editandoId.set(null);
  }

  protected cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  protected eliminar(id: string): void {
    this.cortometrajes.eliminar(id);
  }
}
