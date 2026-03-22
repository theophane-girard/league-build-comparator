import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardPopoverDirective, ZardPopoverComponent } from '@/shared/components/popover';
import { BuildsManagerService } from '@/shared/services/builds-manager.service';
import { DdragonService } from '@/shared/services/ddragon.service';
import { formatItemDescription } from '@/shared/utils/format-item-description';
import type { Item } from '../../models/item.model';
import type { SavedBuild } from '../../models/build.model';


@Component({
  selector: 'app-saved-build-item',
  imports: [ZardButtonComponent, ZardIconComponent, ZardPopoverDirective, ZardPopoverComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="shrink-0 w-52 rounded-lg border bg-card p-3 space-y-2"
      role="listitem"
      [attr.aria-label]="build().name"
    >
      <!-- Champion info -->
      <div class="flex items-center gap-2">
        @if (build().champion) {
          <img
            [src]="ddragon.getChampionImageUrl(build().champion!.image.full)"
            [alt]="build().champion!.name"
            width="36"
            height="36"
            class="w-9 h-9 rounded object-cover shrink-0"
          />
        } @else {
          <div class="w-9 h-9 rounded bg-muted/60 shrink-0 flex items-center justify-center" aria-hidden="true">
            <i z-icon zType="user"></i>
          </div>
        }
        <div class="min-w-0">
          <p class="font-semibold text-sm truncate">{{ build().name }}</p>
          <p class="text-xs text-muted-foreground truncate">
            {{ build().champion ? build().champion!.name + ' · Lvl ' + build().level : 'No champion' }}
          </p>
        </div>
      </div>

      <!-- Items -->
      <div class="flex gap-1 flex-wrap" aria-label="Items">
        @for (item of build().items; track $index) {
          @if (item) {
            <ng-template #itemTooltip>
              <z-popover class="w-56 p-3">
                <div class="flex items-center gap-2 mb-2">
                  <img
                    [src]="ddragon.getItemImageUrl(item.id)"
                    [alt]="item.name"
                    width="40"
                    height="40"
                    class="w-10 h-10 rounded shrink-0"
                  />
                  <div class="min-w-0">
                    <p class="font-semibold text-sm leading-tight">{{ item.name }}</p>
                    <p class="text-xs text-yellow-500">{{ item.gold.total }} gold</p>
                  </div>
                </div>
                @if (item.description) {
                  <div
                    class="text-xs leading-relaxed text-muted-foreground border-t border-border pt-2 mt-1"
                    [innerHTML]="getItemDescription(item)"
                  ></div>
                }
              </z-popover>
            </ng-template>
            <div
              class="w-7 h-7 rounded border bg-muted/40 overflow-hidden cursor-default"
              [attr.aria-label]="item.name"
              zPopover
              [zContent]="itemTooltip"
              zTrigger="hover"
              zPlacement="top"
            >
              <img
                [src]="ddragon.getItemImageUrl(item.id)"
                [alt]="item.name"
                width="28"
                height="28"
                class="w-full h-full object-cover"
              />
            </div>
          } @else {
            <div
              class="w-7 h-7 rounded border bg-muted/40 overflow-hidden flex items-center justify-center"
              aria-label="Empty slot"
            ></div>
          }
        }
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <button
          z-button
          zType="outline"
          zSize="sm"
          type="button"
          class="flex-1"
          [attr.aria-label]="'View ' + build().name"
          (click)="manager.openEditBuild(build())"
        >
          <i z-icon zType="eye"></i>
        </button>
        <button
          z-button
          zType="outline"
          zSize="sm"
          type="button"
          [attr.aria-label]="'Duplicate ' + build().name"
          (click)="manager.openNewBuild(build())"
        >
          <i z-icon zType="copy"></i>
        </button>
        <button
          z-button
          zType="destructive"
          zSize="sm"
          type="button"
          [attr.aria-label]="'Delete ' + build().name"
          (click)="manager.removeBuild(build().id)"
        >
          <i z-icon zType="trash"></i>
        </button>
      </div>
    </article>
  `,
})
export class SavedBuildItemComponent {
  protected readonly manager = inject(BuildsManagerService);
  protected readonly ddragon = inject(DdragonService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly build = input.required<SavedBuild>();

  protected getItemDescription(item: Item): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(formatItemDescription(item.description));
  }

}
