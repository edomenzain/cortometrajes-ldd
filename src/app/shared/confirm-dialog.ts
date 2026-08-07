import { Component, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (confirmar.solicitud(); as solicitud) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" (click)="confirmar.cancelar()"></div>
        <div
          class="relative flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-xl"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-mensaje"
        >
          <div class="flex items-start gap-3">
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-full"
              [class]="solicitud.destructivo ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'"
              aria-hidden="true"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="size-5">
                <circle cx="12" cy="12" r="9" />
                <path stroke-linecap="round" d="M12 8v5" />
                <path stroke-linecap="round" d="M12 16h.01" />
              </svg>
            </span>
            <p id="confirm-dialog-mensaje" class="pt-1.5 text-sm font-medium text-foreground">{{ solicitud.mensaje }}</p>
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              (click)="confirmar.cancelar()"
              class="inline-flex h-10 cursor-pointer items-center justify-center rounded-md px-4 text-sm font-semibold text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Cancelar
            </button>
            <button
              type="button"
              (click)="confirmar.aceptar()"
              class="inline-flex h-10 cursor-pointer items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              [class]="
                solicitud.destructivo
                  ? 'bg-destructive text-destructive-content hover:bg-destructive/90'
                  : 'bg-primary text-primary-content hover:bg-primary/90'
              "
            >
              {{ solicitud.textoAceptar }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  host: {
    '(document:keydown.escape)': 'confirmar.cancelar()',
  },
})
export class ConfirmDialog {
  protected readonly confirmar = inject(ConfirmService);
}
