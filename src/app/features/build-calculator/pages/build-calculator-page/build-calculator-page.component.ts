import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import { STAT_DEFS } from '../../components/builds-comparison/builds-comparison.component';
import { BuildCalculatorService } from '@/shared/services/build-calculator.service';
import { BuildsManagerService } from '@/shared/services/builds-manager.service';
import { ChampionSearchComponent } from '../../components/champion-search/champion-search.component';
import { ChampionCardComponent } from '../../components/champion-card/champion-card.component';
import { LevelSelectorComponent } from '../../components/level-selector/level-selector.component';
import { ItemPickerModalComponent } from '../../components/item-picker-modal/item-picker-modal.component';
import { SavedBuildsPanelComponent } from '../../components/saved-builds-panel/saved-builds-panel.component';
import { BuildsComparisonComponent } from '../../components/builds-comparison/builds-comparison.component';
import type { Item } from '../../models/item.model';

@Component({
  selector: 'app-build-calculator-page',
  imports: [
    ZardSelectComponent,
    ZardSelectItemComponent,
    ChampionSearchComponent,
    ChampionCardComponent,
    LevelSelectorComponent,
    ItemPickerModalComponent,
    SavedBuildsPanelComponent,
    BuildsComparisonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="min-h-screen bg-background p-6" aria-label="LoL Build Calculator">
      <div class="max-w-5xl mx-auto space-y-6">

        <section aria-label="Champion and level selection" class="flex flex-col gap-2 space-y-3">
          <h2 class="text-lg font-semibold">Champion</h2>
          <app-champion-search />
          @if (build.selectedChampion()) {
            <app-champion-card />
            <app-level-selector />
          }
        </section>

        <section aria-label="Saved builds" class="space-y-3">
          <h2 class="text-lg font-semibold">Builds</h2>
          <app-saved-builds-panel />
        </section>

        <section aria-label="Stats comparison" class="space-y-3">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-semibold shrink-0">Stats Comparison</h2>
            <z-select
              [zMultiple]="true"
              [zValue]="selectedStatKeys()"
              zPlaceholder="Filter stats..."
              aria-label="Filter stats to display"
              (zSelectionChange)="selectedStatKeys.set($any($event))"
              class="min-w-56"
            >
              @for (opt of statOptions; track opt.value) {
                <z-select-item [zValue]="opt.value">{{ opt.label }}</z-select-item>
              }
            </z-select>
          </div>
          <app-builds-comparison [selectedStatKeys]="selectedStatKeys()" />
        </section>

      </div>
    </main>

    @if (build.activeSlotIndex() !== null) {
      <app-item-picker-modal
        [slotIndex]="build.activeSlotIndex()!"
        [initialItems]="build.selectedItems()"
        [canSaveBuild]="true"
        (closed)="onModalClose($event)"
        (buildSaved)="onBuildSaved($event)"
      />
    }
  `,
})
export class BuildCalculatorPageComponent {
  protected readonly build = inject(BuildCalculatorService);
  protected readonly manager = inject(BuildsManagerService);
  protected readonly statOptions = STAT_DEFS.map(d => ({ value: d.key, label: d.label }));
  protected readonly selectedStatKeys = signal<string[]>(STAT_DEFS.map(d => d.key));

  protected onModalClose(items: (Item | null)[]): void {
    this.build.applyItems(items);
  }

  protected onBuildSaved(items: (Item | null)[]): void {
    this.build.applyItems(items);
    this.manager.saveBuild();
    this.build.closeItemPicker();
  }
}
