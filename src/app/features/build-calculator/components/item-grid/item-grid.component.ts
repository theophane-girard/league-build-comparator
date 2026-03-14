import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { BuildCalculatorService } from '@/shared/services/build-calculator.service';
import { ItemSlotComponent } from '../item-slot/item-slot.component';

@Component({
  selector: 'app-item-grid',
  imports: [ItemSlotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="group"
      aria-label="Item slots"
      class="flex flex-wrap gap-3"
    >
      @for (item of build.selectedItems(); track $index) {
        <app-item-slot
          [item]="item"
          [index]="$index"
          (slotClick)="build.openItemPicker($event)"
          (clearClick)="build.clearItemInSlot($event)"
        />
      }
    </div>
  `,
})
export class ItemGridComponent {
  protected readonly build = inject(BuildCalculatorService);
}
