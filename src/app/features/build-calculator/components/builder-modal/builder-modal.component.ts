import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { BuildCalculatorService } from '@/shared/services/build-calculator.service';
import { BuildsManagerService } from '@/shared/services/builds-manager.service';
import { ChampionSearchComponent } from '../champion-search/champion-search.component';
import { ChampionCardComponent } from '../champion-card/champion-card.component';
import { LevelSelectorComponent } from '../level-selector/level-selector.component';
import { ItemGridComponent } from '../item-grid/item-grid.component';
import { StatsPanelComponent } from '../stats-panel/stats-panel.component';

@Component({
  selector: 'app-builder-modal',
  imports: [
    CdkTrapFocus,
    ZardButtonComponent,
    ZardIconComponent,
    ChampionSearchComponent,
    ChampionCardComponent,
    LevelSelectorComponent,
    ItemGridComponent,
    StatsPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './builder-modal.component.html',
})
export class BuilderModalComponent {
  protected readonly build = inject(BuildCalculatorService);
  protected readonly manager = inject(BuildsManagerService);
}
