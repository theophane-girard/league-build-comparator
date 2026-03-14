import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ZardSegmentedComponent } from '@/shared/components/segmented';
import type { SegmentedOption } from '@/shared/components/segmented';
import { BuildCalculatorService } from '@/shared/services/build-calculator.service';

@Component({
  selector: 'app-level-selector',
  imports: [ZardSegmentedComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3">
      <span class="text-sm font-medium text-muted-foreground shrink-0">Level</span>
      <z-segmented
        [zOptions]="levelOptions()"
        [zDefaultValue]="build.selectedLevel().toString()"
        zAriaLabel="Champion level selector"
        (zChange)="onLevelChange($event)"
      />
    </div>
  `,
})
export class LevelSelectorComponent {
  protected readonly build = inject(BuildCalculatorService);

  protected readonly levelOptions = computed((): SegmentedOption[] =>
    Array.from({ length: 18 }, (_, i) => ({
      value: (i + 1).toString(),
      label: (i + 1).toString(),
    }))
  );

  protected onLevelChange(value: string): void {
    this.build.setLevel(parseInt(value, 10));
  }
}
