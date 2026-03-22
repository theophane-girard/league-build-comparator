import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ItemSlotComponent } from '../item-slot/item-slot.component';
import type { Item } from '../../models/item.model';

interface MapType {
  id: string;
  label: string;
}

@Component({
  selector: 'app-item-picker-header',
  imports: [ZardButtonComponent, ZardIconComponent, ItemSlotComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <header class="flex items-center justify-between gap-6 px-6 py-4 border-b border-border shrink-0">
      <div class="flex items-center gap-3" role="group" aria-label="Item slots">
        @for (item of localItems(); track $index) {
          <div [class]="$index === activeSlotIndex() ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg' : ''">
            <app-item-slot
              [item]="item"
              [index]="$index"
              (slotClick)="slotClick.emit($event)"
              (clearClick)="clearClick.emit($event)"
            />
          </div>
        }
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-1.5" role="group" aria-label="Map filter">
          @for (map of mapTypes(); track map.id) {
            <button
              type="button"
              class="cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md border transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              [class]="selectedMapId() === map.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'"
              [attr.aria-pressed]="selectedMapId() === map.id"
              [attr.aria-label]="map.label + ' map filter'"
              (click)="mapFilterChange.emit(map.id)"
            >
              {{ map.label }}
            </button>
          }
        </div>

        @if (canSaveBuild()) {
          <button z-button type="button" aria-label="Save build" (click)="saveBuild.emit()">
            <i z-icon zType="save"></i>
            Add Build
          </button>
        }

        <button z-button type="button" zType="secondary" aria-label="Close item picker" (click)="close.emit()">
          <i z-icon zType="x"></i>
        </button>
      </div>
    </header>
  `,
})
export class ItemPickerHeaderComponent {
  readonly localItems = input.required<(Item | null)[]>();
  readonly activeSlotIndex = input.required<number>();
  readonly mapTypes = input.required<MapType[]>();
  readonly selectedMapId = input.required<string>();
  readonly canSaveBuild = input<boolean>(false);

  readonly slotClick = output<number>();
  readonly clearClick = output<number>();
  readonly mapFilterChange = output<string>();
  readonly saveBuild = output<void>();
  readonly close = output<void>();
}
