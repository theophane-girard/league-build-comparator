import { ChangeDetectionStrategy, Component, ElementRef, inject, input, signal } from '@angular/core';
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
        <div class="min-w-0 flex-1">
          <!-- Editable name -->
          @if (isEditing()) {
            <input
              class="font-semibold text-sm w-full bg-transparent border-b border-primary outline-none pb-0.5"
              [value]="editingName()"
              (input)="editingName.set($any($event.target).value)"
              (blur)="saveName()"
              (keydown.enter)="saveName()"
              (keydown.escape)="isEditing.set(false)"
              aria-label="Build name"
            />
          } @else {
            <p
              class="font-semibold text-sm truncate cursor-pointer hover:text-primary transition-colors"
              [title]="build().name"
              (click)="startEditing()"
              role="button"
              tabindex="0"
              (keydown.enter)="startEditing()"
              aria-label="Rename build: {{ build().name }}"
            >{{ build().name }}</p>
          }
          <p class="text-xs text-muted-foreground truncate">
            {{ build().champion ? build().champion!.name + ' · Lvl ' + build().level : 'No champion' }}
          </p>
        </div>
      </div>

      <!-- Items -->
      <div class="grid grid-cols-6 gap-1" aria-label="Items">
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
              class="w-full aspect-square rounded border bg-muted/40 overflow-hidden cursor-default"
              [attr.aria-label]="item.name"
              zPopover
              [zContent]="itemTooltip"
              zTrigger="hover"
              zPlacement="top"
            >
              <img
                [src]="ddragon.getItemImageUrl(item.id)"
                [alt]="item.name"
                width="56"
                height="56"
                class="w-full h-full object-cover"
              />
            </div>
          } @else {
            <div
              class="w-full aspect-square rounded border bg-muted/40"
              aria-label="Empty slot"
            ></div>
          }
        }
      </div>

      <!-- Total gold -->
      <div class="flex items-center gap-1 text-xs text-yellow-500">
        <i z-icon zType="circle-dollar-sign" class="w-3.5 h-3.5"></i>
        <span>{{ build().totalGold.toLocaleString() }} gold</span>
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
  private readonly el = inject(ElementRef);

  readonly build = input.required<SavedBuild>();

  protected readonly isEditing = signal(false);
  protected readonly editingName = signal('');

  protected startEditing(): void {
    this.editingName.set(this.build().name);
    this.isEditing.set(true);
    setTimeout(() => {
      this.el.nativeElement.querySelector('input')?.focus();
    });
  }

  protected saveName(): void {
    this.manager.renameBuild(this.build().id, this.editingName());
    this.isEditing.set(false);
  }

  protected getItemDescription(item: Item): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(formatItemDescription(item.description, item));
  }
}
