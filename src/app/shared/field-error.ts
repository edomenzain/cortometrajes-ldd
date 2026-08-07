import { Component } from '@angular/core';

@Component({
  selector: 'app-field-error',
  template: `
    <p class="flex items-center gap-1 text-sm text-destructive" role="alert">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5 shrink-0" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path stroke-linecap="round" d="M12 8v5" />
        <path stroke-linecap="round" d="M12 16h.01" />
      </svg>
      <ng-content />
    </p>
  `,
})
export class FieldError {}
