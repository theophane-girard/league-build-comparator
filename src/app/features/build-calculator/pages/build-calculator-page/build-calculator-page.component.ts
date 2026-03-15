import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSelectComponent, ZardSelectItemComponent } from '@/shared/components/select';
import { STAT_DEFS } from '../../components/builds-comparison/builds-comparison.component';
import { BuildCalculatorService } from '@/shared/services/build-calculator.service';
import { BuildsManagerService } from '@/shared/services/builds-manager.service';
import { DdragonService, DDRAGON_LOCALES } from '@/shared/services/ddragon.service';
import { ThemeService } from '@/shared/services/theme.service';
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
    ZardButtonComponent,
    ZardIconComponent,
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
  templateUrl: './build-calculator-page.component.html',
})
export class BuildCalculatorPageComponent {
  protected readonly build = inject(BuildCalculatorService);
  protected readonly manager = inject(BuildsManagerService);
  protected readonly theme = inject(ThemeService);
  protected readonly ddragon = inject(DdragonService);
  protected readonly locales = DDRAGON_LOCALES;
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

  protected onLocaleChange(code: string): void {
    this.ddragon.setLocale(code);
  }
}
