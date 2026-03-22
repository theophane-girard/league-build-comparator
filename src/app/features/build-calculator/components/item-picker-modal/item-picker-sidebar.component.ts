import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';

import { ZardIconComponent } from '@/shared/components/icon';
import type { ZardIcon } from '@/shared/components/icon';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardInputGroupComponent } from '@/shared/components/input-group';
import { DdragonService } from '@/shared/services/ddragon.service';
import type { Item } from '../../models/item.model';

interface ItemCategory {
  id: string;
  label: string;
  icon: ZardIcon;
}

@Component({
  selector: 'app-item-picker-sidebar',
  imports: [ZardIconComponent, ZardInputDirective, ZardInputGroupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="w-120 flex flex-col border-r border-border shrink-0" aria-label="Item filters and list">

      <div class="p-3 border-b border-border">
        <div class="relative">
          <ng-template #searchIcon><z-icon zType="search" /></ng-template>
          <z-input-group [zAddonBefore]="searchIcon" [zAddonAfter]="filteredItems().length + ' results'" class="mb-4">
            <input
              z-input
              type="text"
              placeholder="Search items..."
              [value]="searchText()"
              (input)="onSearchInput($event)"
              class="pl-9 w-full"
              aria-label="Search items"
            />
          </z-input-group>
        </div>
      </div>

      <section class="flex flex-1 min-h-0" aria-label="Item list and filters">
        <div class="p-2 border-r border-border flex flex-col gap-0.5 shrink-0" role="group" aria-label="Item categories">
          <button
            type="button"
            class="cursor-pointer flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            [class]="activeFilters().size === 0
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
            [attr.aria-pressed]="activeFilters().size === 0"
            aria-label="All items"
            (click)="filterClear.emit()"
          >
            <i z-icon zType="layout-dashboard" class="w-4 h-4 shrink-0"></i>
            <span>All</span>
          </button>
          @for (cat of categories(); track cat.id) {
            <button
              type="button"
              class="cursor-pointer flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              [class]="activeFilters().has(cat.id)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              [attr.aria-pressed]="activeFilters().has(cat.id)"
              [attr.aria-label]="cat.label + ' filter'"
              (click)="filterToggle.emit(cat.id)"
            >
              <i z-icon [zType]="cat.icon" class="w-4 h-4 shrink-0"></i>
              <span>{{ cat.label }}</span>
            </button>
          }
        </div>

        <div class="flex-1 overflow-y-auto p-2" aria-label="Item list">
          @if (filteredItems().length === 0) {
            <p class="text-center text-sm text-muted-foreground py-8">No items found</p>
          } @else {
            <div class="grid grid-cols-5 gap-1.5">
              @for (item of filteredItems(); track item.id) {
                <button
                  type="button"
                  class="cursor-pointer w-full aspect-square rounded border transition-colors overflow-hidden
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  [class]="previewedItemId() === item.id
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-border hover:border-primary/70'"
                  [attr.aria-label]="item.name + ', cost: ' + item.gold.total + ' gold'"
                  [attr.aria-pressed]="previewedItemId() === item.id"
                  [title]="item.name"
                  (click)="itemSelect.emit(item)"
                >
                  <img
                    [src]="ddragon.getItemImageUrl(item.id)"
                    [alt]="item.name"
                    width="48"
                    height="48"
                    class="w-full h-full object-cover"
                  />
                </button>
              }
            </div>
          }
        </div>
      </section>

    </aside>
  `,
})
export class ItemPickerSidebarComponent {
  protected readonly ddragon = inject(DdragonService);

  readonly filteredItems = input.required<Item[]>();
  readonly previewedItemId = input<string | undefined>(undefined);
  readonly searchText = input.required<string>();
  readonly categories = input.required<ItemCategory[]>();
  readonly activeFilters = input.required<Set<string>>();

  readonly searchChange = output<string>();
  readonly filterToggle = output<string>();
  readonly filterClear = output<void>();
  readonly itemSelect = output<Item>();

  protected onSearchInput(event: Event): void {
    this.searchChange.emit((event.target as HTMLInputElement).value);
  }
}
