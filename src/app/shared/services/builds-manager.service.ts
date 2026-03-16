import { computed, inject, Injectable, signal } from '@angular/core';

import type { SavedBuild } from '@/features/build-calculator/models/build.model';
import { BuildCalculatorService } from './build-calculator.service';

@Injectable({ providedIn: 'root' })
export class BuildsManagerService {
  private readonly buildCalc = inject(BuildCalculatorService);

  readonly savedBuilds = signal<SavedBuild[]>([]);
  readonly editingBuildId = signal<string | null>(null);

  readonly canSave = computed(
    () => this.buildCalc.selectedChampion() !== null && this.buildCalc.finalStats() !== null,
  );

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
    const champion = this.buildCalc.selectedChampion();
    const finalStats = this.buildCalc.finalStats();
    const baseStats = this.buildCalc.baseStats();
    if (!champion || !finalStats || !baseStats) return;

    const items = [...this.buildCalc.selectedItems()];
    const totalGold = items.reduce((sum, item) => sum + (item?.gold.total ?? 0), 0);
    const editingId = this.editingBuildId();

    if (editingId) {
      this.savedBuilds.update(list =>
        list.map(b =>
          b.id === editingId
            ? { ...b, champion, level: this.buildCalc.selectedLevel(), items, baseStats, finalStats, totalGold }
            : b,
        ),
      );
      this.editingBuildId.set(null);
    } else {
      const n = this.savedBuilds().length + 1;
      const build: SavedBuild = {
        id: `build-${Date.now()}`,
        name: `Build ${n}`,
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
