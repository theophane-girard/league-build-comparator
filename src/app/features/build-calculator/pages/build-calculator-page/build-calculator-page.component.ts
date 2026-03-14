import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { BuildCalculatorService } from '@/shared/services/build-calculator.service';
import { ChampionSearchComponent } from '../../components/champion-search/champion-search.component';
import { ChampionCardComponent } from '../../components/champion-card/champion-card.component';
import { LevelSelectorComponent } from '../../components/level-selector/level-selector.component';
import { ItemGridComponent } from '../../components/item-grid/item-grid.component';
import { ItemSearchComponent } from '../../components/item-search/item-search.component';
import { StatsPanelComponent } from '../../components/stats-panel/stats-panel.component';

@Component({
  selector: 'app-build-calculator-page',
  imports: [
    ChampionSearchComponent,
    ChampionCardComponent,
    LevelSelectorComponent,
    ItemGridComponent,
    ItemSearchComponent,
    StatsPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './build-calculator-page.component.html',
})
export class BuildCalculatorPageComponent {
  protected readonly build = inject(BuildCalculatorService);
}
