import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ZardIconComponent } from '@/shared/components/icon';
import { BuildsManagerService } from '@/shared/services/builds-manager.service';
import { SavedBuildItemComponent } from './saved-build-item.component';

@Component({
  selector: 'app-saved-builds-panel',
  imports: [ZardIconComponent, SavedBuildItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './saved-builds-panel.component.html',
})
export class SavedBuildsPanelComponent {
  protected readonly manager = inject(BuildsManagerService);
}
