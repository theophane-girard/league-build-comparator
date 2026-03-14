import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';

import { ZardComboboxComponent, type ZardComboboxOption } from '@/shared/components/combobox';
import { BuildCalculatorService } from '@/shared/services/build-calculator.service';
import { DdragonService } from '@/shared/services/ddragon.service';

@Component({
  selector: 'app-champion-search',
  imports: [ZardComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <z-combobox
      zWidth="full"
      placeholder="Select a champion..."
      searchPlaceholder="Search champions..."
      ariaLabel="Champion selection"
      [options]="options()"
      (zValueChange)="onSelect($event)"
    />
  `,
})
export class ChampionSearchComponent implements OnInit {
  private readonly ddragon = inject(DdragonService);
  private readonly build = inject(BuildCalculatorService);

  protected readonly options = computed((): ZardComboboxOption[] =>
    this.ddragon.champions().map(c => ({ value: c.id, label: c.name })),
  );

  async ngOnInit(): Promise<void> {
    await this.ddragon.loadChampions();
  }

  async onSelect(id: string | null): Promise<void> {
    if (!id) return;
    const detail = await this.ddragon.loadChampionDetail(id);
    this.build.selectChampion(detail);
  }
}
