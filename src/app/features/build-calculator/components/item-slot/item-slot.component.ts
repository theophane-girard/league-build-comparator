import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { ZardIconComponent } from '@/shared/components/icon';
import { DdragonService } from '@/shared/services/ddragon.service';
import type { Item } from '../../models/item.model';

@Component({
  selector: 'app-item-slot',
  imports: [ZardIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative group">
      <button
        type="button"
        class="cursor-pointer w-14 h-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center
               bg-muted/30 hover:bg-muted/60 transition-colors focus-visible:outline-none
               focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
        [class]="item() ? 'border-solid border-border' : ''"
        [attr.aria-label]="item() ? 'Slot ' + (index() + 1) + ': ' + item()!.name + '. Click to change.' : 'Slot ' + (index() + 1) + ': empty. Click to add item.'"
        (click)="slotClick.emit(index())"
      >
        @if (item()) {
          <img
            [src]="ddragon.getItemImageUrl(item()!.id)"
            [alt]="item()!.name"
            width="56"
            height="56"
            class="w-full h-full object-cover"
          />
        } @else {
          <i z-icon zType="plus" class="text-muted-foreground opacity-50"></i>
        }
      </button>
      @if (item()) {
        <button
          type="button"
          class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground
                 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          [attr.aria-label]="'Remove ' + item()!.name + ' from slot ' + (index() + 1)"
          (click)="clearClick.emit(index())"
        >
          <i z-icon zType="x" class="w-3 h-3"></i>
        </button>
      }
    </div>
  `,
})
export class ItemSlotComponent {
  protected readonly ddragon = inject(DdragonService);

  readonly item = input<Item | null>(null);
  readonly index = input.required<number>();

  readonly slotClick = output<number>();
  readonly clearClick = output<number>();
}
