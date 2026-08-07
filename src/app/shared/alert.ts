import { Component, input } from '@angular/core';

@Component({
  selector: 'app-alert',
  template: `
    @if (mensaje()) {
      <p
        class="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        role="alert"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="mt-0.5 size-4 shrink-0" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path stroke-linecap="round" d="M12 8v5" />
          <path stroke-linecap="round" d="M12 16h.01" />
        </svg>
        <span>{{ mensaje() }}</span>
      </p>
    }
  `,
})
export class Alert {
  readonly mensaje = input<string | null | undefined>(null);
}
