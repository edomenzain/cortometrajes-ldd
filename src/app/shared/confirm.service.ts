import { Injectable, signal } from '@angular/core';

export interface SolicitudConfirmacion {
  mensaje: string;
  textoAceptar: string;
  destructivo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly solicitud = signal<SolicitudConfirmacion | null>(null);
  private resolver: ((valor: boolean) => void) | null = null;

  pedir(mensaje: string, opciones?: { textoAceptar?: string; destructivo?: boolean }): Promise<boolean> {
    this.solicitud.set({
      mensaje,
      textoAceptar: opciones?.textoAceptar ?? 'Aceptar',
      destructivo: opciones?.destructivo ?? false,
    });
    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  aceptar(): void {
    this.resolver?.(true);
    this.cerrar();
  }

  cancelar(): void {
    this.resolver?.(false);
    this.cerrar();
  }

  private cerrar(): void {
    this.solicitud.set(null);
    this.resolver = null;
  }
}
