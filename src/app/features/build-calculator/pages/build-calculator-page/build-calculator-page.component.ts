import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSegmentedComponent } from '@/shared/components/segmented';
import type { SegmentedOption } from '@/shared/components/segmented';
import { BuildCalculatorService } from '@/shared/services/build-calculator.service';
import { BuildsManagerService } from '@/shared/services/builds-manager.service';
import { ThemeService } from '@/shared/services/theme.service';
import { ChampionSearchComponent } from '../../components/champion-search/champion-search.component';
import { ChampionCardComponent } from '../../components/champion-card/champion-card.component';
import { LevelSelectorComponent } from '../../components/level-selector/level-selector.component';
import { ItemGridComponent } from '../../components/item-grid/item-grid.component';
import { ItemPickerModalComponent } from '../../components/item-picker-modal/item-picker-modal.component';
import { StatsPanelComponent } from '../../components/stats-panel/stats-panel.component';
import { SavedBuildsPanelComponent } from '../../components/saved-builds-panel/saved-builds-panel.component';
import { BuildsComparisonComponent } from '../../components/builds-comparison/builds-comparison.component';
import type { Item } from '../../models/item.model';

@Component({
  selector: 'app-build-calculator-page',
  imports: [
    ZardButtonComponent,
    ZardIconComponent,
    ZardSegmentedComponent,
    ChampionSearchComponent,
    ChampionCardComponent,
    LevelSelectorComponent,
    ItemGridComponent,
    ItemPickerModalComponent,
    StatsPanelComponent,
    SavedBuildsPanelComponent,
    BuildsComparisonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './build-calculator-page.component.html',
})
export class BuildCalculatorPageComponent {
  protected readonly build = inject(BuildCalculatorService);
  protected readonly manager = inject(BuildsManagerService);
  protected readonly theme = inject(ThemeService);

  protected onModalClose(items: (Item | null)[]): void {
    this.build.applyItems(items);
  }

  protected readonly tabOptions = computed((): SegmentedOption[] => [
    { value: 'builder', label: 'Builder' },
    {
      value: 'comparison',
      label: `Comparison${this.manager.buildCount() > 0 ? ` (${this.manager.buildCount()})` : ''}`,
    },
  ]);
}
