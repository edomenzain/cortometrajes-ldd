import { Component, computed, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-selector-puntuacion',
  template: `
    <div class="flex flex-col gap-2">
      <div
        class="flex flex-wrap items-center gap-1.5"
        role="radiogroup"
        [attr.aria-label]="etiqueta()"
        (mouseleave)="previsualizacion.set(null)"
      >
        @for (n of puntos; track n) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="valor() === n"
            [attr.aria-label]="n + ' de 10'"
            (click)="valorChange.emit(n)"
            (mouseenter)="previsualizacion.set(n)"
            (focus)="previsualizacion.set(n)"
            (blur)="previsualizacion.set(null)"
            class="flex size-9 cursor-pointer items-center justify-center rounded-md transition-transform duration-100 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            [class]="n === 0 && (valor() === 0 || previsualizacion() === 0) ? 'text-red-500 ring-1 ring-inset ring-red-500 rounded-full' : n <= nivelMostrado() ? colorNivel() : 'text-muted-foreground/40'"
          >
            @if (n === 0) {
              <span class="text-sm font-semibold">0</span>
            } @else {
              <svg
                viewBox="0 0 24 24"
                class="size-6"
                [attr.fill]="n <= nivelMostrado() ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  d="M12 2.5l2.9 6.06 6.6.79-4.87 4.55 1.29 6.6L12 17.3l-5.92 3.2 1.29-6.6-4.87-4.55 6.6-.79z"
                  stroke-linejoin="round"
                />
              </svg>
            }
          </button>
        }
      </div>
      <p class="text-sm text-muted-foreground">
        @if (previsualizacion() !== null || valor() !== null) {
          <span class="font-semibold" [class]="colorNivel()">{{ nivelMostrado() }}</span> / 10
        } @else {
          Sin calificar
        }
      </p>
    </div>
  `,
})
export class SelectorPuntuacion {
  readonly etiqueta = input.required<string>();
  readonly valor = input<number | null>(null);
  readonly valorChange = output<number>();
  protected readonly puntos = Array.from({ length: 11 }, (_, i) => i);
  protected readonly previsualizacion = signal<number | null>(null);
  protected readonly nivelMostrado = computed(() => this.previsualizacion() ?? this.valor() ?? 0);

  protected readonly colorNivel = computed(() => {
    const n = this.nivelMostrado();
    if (n <= 3) return 'text-red-500';
    if (n <= 6) return 'text-amber-500';
    if (n <= 8) return 'text-lime-500';
    return 'text-emerald-500';
  });
}
