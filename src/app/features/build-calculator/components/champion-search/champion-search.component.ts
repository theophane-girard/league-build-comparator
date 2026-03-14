import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';

import { ZardCommandImports } from '@/shared/components/command';
import { BuildCalculatorService } from '@/shared/services/build-calculator.service';
import { DdragonService } from '@/shared/services/ddragon.service';

@Component({
  selector: 'app-champion-search',
  imports: [...ZardCommandImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './champion-search.component.html',
})
export class ChampionSearchComponent implements OnInit {
  protected readonly ddragon = inject(DdragonService);
  protected readonly build = inject(BuildCalculatorService);

  async ngOnInit(): Promise<void> {
    await this.ddragon.loadChampions();
  }

  async onChampionSelect(championId: unknown): Promise<void> {
    const id = championId as string;
    const detail = await this.ddragon.loadChampionDetail(id);
    this.build.selectChampion(detail);
  }
}
