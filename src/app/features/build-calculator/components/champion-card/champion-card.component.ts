import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { BuildCalculatorService } from '@/shared/services/build-calculator.service';
import { DdragonService } from '@/shared/services/ddragon.service';

@Component({
  selector: 'app-champion-card',
  imports: [ZardButtonComponent, ZardIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (build.selectedChampion(); as champion) {
      <div class="flex items-center gap-4 p-4 rounded-lg border bg-card">
        <img
          [src]="ddragon.getChampionImageUrl(champion.image.full)"
          [alt]="champion.name"
          width="64"
          height="64"
          class="w-16 h-16 rounded-lg object-cover"
        />
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-lg leading-tight">{{ champion.name }}</p>
          <p class="text-sm text-muted-foreground capitalize">{{ champion.title }}</p>
          @if (champion.tags?.length) {
            <div class="flex gap-1 mt-1">
              @for (tag of champion.tags; track tag) {
                <span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{{ tag }}</span>
              }
            </div>
          }
        </div>
        <button
          z-button
          zType="ghost"
          zSize="sm"
          type="button"
          aria-label="Clear champion selection"
          (click)="build.clearBuild()"
        >
          <i z-icon zType="x"></i>
        </button>
      </div>
    }
  `,
})
export class ChampionCardComponent {
  protected readonly build = inject(BuildCalculatorService);
  protected readonly ddragon = inject(DdragonService);
}
