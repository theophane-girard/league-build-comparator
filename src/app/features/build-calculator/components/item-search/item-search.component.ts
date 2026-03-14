import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';

import { ZardComboboxComponent, type ZardComboboxOption } from '@/shared/components/combobox';
import { BuildCalculatorService } from '@/shared/services/build-calculator.service';
import { DdragonService } from '@/shared/services/ddragon.service';

@Component({
  selector: 'app-item-search',
  imports: [ZardComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <z-combobox
      zWidth="full"
      [placeholder]="'Select an item for slot ' + ((build.activeSlotIndex() ?? 0) + 1) + '...'"
      searchPlaceholder="Search items..."
      ariaLabel="Item selection"
      [options]="options()"
      (zValueChange)="onSelect($event)"
    />
  `,
})
export class ItemSearchComponent implements OnInit {
  protected readonly build = inject(BuildCalculatorService);
  private readonly ddragon = inject(DdragonService);

  protected readonly options = computed((): ZardComboboxOption[] =>
    this.ddragon.items().map(i => ({ value: i.id, label: i.name })),
  );

  async ngOnInit(): Promise<void> {
    await this.ddragon.loadItems();
  }

  onSelect(id: string | null): void {
    if (!id) return;
    const slot = this.build.activeSlotIndex();
    if (slot === null) return;
    const item = this.ddragon.items().find(i => i.id === id);
    if (!item) return;
    this.build.setItemInSlot(slot, item);
  }
}
