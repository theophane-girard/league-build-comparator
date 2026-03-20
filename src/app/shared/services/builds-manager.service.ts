import { computed, effect, inject, Injectable, signal } from '@angular/core';

import type { Item } from '@/features/build-calculator/models/item.model';
import type { SavedBuild } from '@/features/build-calculator/models/build.model';
import { calculateBaseStats, combineStats, sumItemStats } from '@/shared/utils/stats-calculator';
import { BuildCalculatorService } from './build-calculator.service';

@Injectable({ providedIn: 'root' })
export class BuildsManagerService {
  private readonly buildCalc = inject(BuildCalculatorService);

  readonly savedBuilds = signal<SavedBuild[]>([]);
  readonly editingBuildId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const champion = this.buildCalc.selectedChampion();
      if (!champion) return;
      this.savedBuilds.update(builds =>
        builds.map(build => {
          if (build.champion) return build;
          const baseStats = calculateBaseStats(champion.stats, build.level);
          const itemBonuses = sumItemStats(build.items.filter((i): i is Item => i !== null));
          const finalStats = combineStats(baseStats, itemBonuses);
          return { ...build, champion, baseStats, finalStats };
        }),
      );
    });
  }

  readonly canSave = computed(() => true);

  readonly buildCount = computed(() => this.savedBuilds().length);

  openNewBuild(prefillBuild?: SavedBuild): void {
    this.editingBuildId.set(null);
    if (prefillBuild) {
      this.buildCalc.prefillFromBuild(prefillBuild);
    } else {
      this.buildCalc.clearItems();
    }
    this.buildCalc.openItemPicker(0);
  }

  openEditBuild(build: SavedBuild): void {
    this.editingBuildId.set(build.id);
    this.buildCalc.prefillFromBuild(build);
    this.buildCalc.openItemPicker(0);
  }

  saveBuild(): void {
    const champion = this.buildCalc.selectedChampion() ?? undefined;
    const finalStats = this.buildCalc.finalStats() ?? undefined;
    const baseStats = this.buildCalc.baseStats() ?? undefined;

    const items = [...this.buildCalc.selectedItems()];
    const totalGold = items.reduce((sum, item) => sum + (item?.gold.total ?? 0), 0);
    const editingId = this.editingBuildId();
    const itemNames = items.filter(i => i !== null).map(i => i!.name);
    const name = itemNames.length > 0 ? itemNames.join(' - ') : `Build ${this.savedBuilds().length + 1}`;

    if (editingId) {
      this.savedBuilds.update(list =>
        list.map(b =>
          b.id === editingId
            ? { ...b, name, champion, level: this.buildCalc.selectedLevel(), items, baseStats, finalStats, totalGold }
            : b,
        ),
      );
      this.editingBuildId.set(null);
    } else {
      const build: SavedBuild = {
        id: `build-${Date.now()}`,
        name,
        champion,
        level: this.buildCalc.selectedLevel(),
        items,
        baseStats,
        finalStats,
        totalGold,
      };
      this.savedBuilds.update(list => [...list, build]);
    }
  }

  removeBuild(id: string): void {
    this.savedBuilds.update(list => list.filter(b => b.id !== id));
  }
}
