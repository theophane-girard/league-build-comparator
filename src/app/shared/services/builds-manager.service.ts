import { computed, inject, Injectable, signal } from '@angular/core';

import type { SavedBuild } from '@/features/build-calculator/models/build.model';
import { BuildCalculatorService } from './build-calculator.service';

@Injectable({ providedIn: 'root' })
export class BuildsManagerService {
  private readonly buildCalc = inject(BuildCalculatorService);

  readonly savedBuilds = signal<SavedBuild[]>([]);
  readonly builderModalOpen = signal(false);

  readonly canSave = computed(
    () => this.buildCalc.selectedChampion() !== null && this.buildCalc.finalStats() !== null,
  );

  readonly buildCount = computed(() => this.savedBuilds().length);

  openBuilderModal(prefillBuild?: SavedBuild): void {
    if (prefillBuild) {
      this.buildCalc.prefillFromBuild(prefillBuild);
    } else {
      this.buildCalc.clearBuild();
    }
    this.builderModalOpen.set(true);
  }

  closeBuilderModal(): void {
    this.builderModalOpen.set(false);
    this.buildCalc.closeItemPicker();
    this.buildCalc.clearBuild();
  }

  saveBuild(): void {
    const champion = this.buildCalc.selectedChampion();
    const finalStats = this.buildCalc.finalStats();
    const baseStats = this.buildCalc.baseStats();
    if (!champion || !finalStats || !baseStats) return;

    const n = this.savedBuilds().length + 1;
    const build: SavedBuild = {
      id: `build-${Date.now()}`,
      name: `Build ${n}`,
      champion,
      level: this.buildCalc.selectedLevel(),
      items: [...this.buildCalc.selectedItems()],
      baseStats,
      finalStats,
    };
    this.savedBuilds.update(list => [...list, build]);
    this.closeBuilderModal();
  }

  removeBuild(id: string): void {
    this.savedBuilds.update(list => list.filter(b => b.id !== id));
  }
}
