import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { BuildsManagerService } from '@/shared/services/builds-manager.service';
import { DdragonService } from '@/shared/services/ddragon.service';

@Component({
  selector: 'app-saved-builds-panel',
  imports: [ZardButtonComponent, ZardIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './saved-builds-panel.component.html',
})
export class SavedBuildsPanelComponent {
  protected readonly manager = inject(BuildsManagerService);
  protected readonly ddragon = inject(DdragonService);
}
