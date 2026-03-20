import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ZardIconComponent } from '@/shared/components/icon';
import { BuildsManagerService } from '@/shared/services/builds-manager.service';
import { SavedBuildItemComponent } from './saved-build-item.component';

@Component({
  selector: 'app-saved-builds-panel',
  imports: [ZardIconComponent, SavedBuildItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-4 overflow-x-auto pb-2" role="list" aria-label="Saved builds">
      @for (build of manager.savedBuilds(); track build.id) {
        <app-saved-build-item [build]="build" />
      }

      <!-- Add build placeholder -->
      <button
        type="button"
        class="shrink-0 w-52 min-h-[136px] rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        aria-label="Add a new build"
        (click)="manager.openNewBuild()"
      >
        <i z-icon zType="plus" zSize="lg"></i>
      </button>
    </div>
  `,
})
export class SavedBuildsPanelComponent {
  protected readonly manager = inject(BuildsManagerService);
}
