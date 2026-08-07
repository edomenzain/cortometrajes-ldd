import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  template: `<div class="animate-pulse rounded-md bg-muted" [class]="clase()" aria-hidden="true"></div>`,
})
export class Skeleton {
  readonly clase = input('h-4 w-full');
}
