import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';

import { ZardSelectImports } from '@/shared/components/select';
import { BuildCalculatorService } from '@/shared/services/build-calculator.service';
import { DdragonService } from '@/shared/services/ddragon.service';

@Component({
  selector: 'app-item-search',
  imports: [...ZardSelectImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-search.component.html',
})
export class ItemSearchComponent implements OnInit {
  protected readonly ddragon = inject(DdragonService);
  protected readonly build = inject(BuildCalculatorService);

  async ngOnInit(): Promise<void> {
    await this.ddragon.loadItems();
  }

  onItemSelect(value: string | string[]): void {
    const id = value as string;
    const slot = this.build.activeSlotIndex();
    if (slot === null) return;
    const item = this.ddragon.items().find(i => i.id === id);
    if (!item) return;
    this.build.setItemInSlot(slot, item);
  }
}
