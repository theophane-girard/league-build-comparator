import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import type { SafeHtml } from '@angular/platform-browser';

import { ZardIconComponent } from '@/shared/components/icon';
import { DdragonService } from '@/shared/services/ddragon.service';
import type { Item } from '../../models/item.model';

@Component({
  selector: 'app-item-detail-panel',
  imports: [ZardIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <main class="flex-1 flex flex-col items-center overflow-y-auto p-8" aria-label="Item details">

      @if (item(); as item) {
        <div class="w-full max-w-md flex flex-col gap-6">

          @if (parentSuggestions().length > 0) {
            <section aria-label="Builds into">
              <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Builds Into</p>
              <div class="flex gap-2 flex-wrap">
                @for (parent of parentSuggestions(); track parent.id) {
                  <button
                    type="button"
                    class="cursor-pointer w-14 h-14 rounded border border-border hover:border-primary/70 transition-colors
                           overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    [attr.aria-label]="'Preview ' + parent.name"
                    [title]="parent.name"
                    (click)="itemSelect.emit(parent)"
                  >
                    <img
                      [src]="ddragon.getItemImageUrl(parent.id)"
                      [alt]="parent.name"
                      width="56"
                      height="56"
                      class="w-full h-full object-cover"
                    />
                  </button>
                }
              </div>
            </section>
          }

          @if (previewedComponents().length > 0) {
            <section class="flex flex-col items-center" aria-label="Item recipe">
              <div class="flex flex-col items-center">
                <div class="w-20 h-20 rounded-lg border-2 border-primary overflow-hidden bg-muted">
                  <img
                    [src]="ddragon.getItemImageUrl(item.id)"
                    [alt]="item.name"
                    width="80"
                    height="80"
                    class="w-full h-full object-cover"
                  />
                </div>
                <span class="text-sm text-muted-foreground mt-1">{{ item.gold.total }}</span>
              </div>

              <div class="w-px h-6 bg-border/60 my-1"></div>

              <div class="flex gap-8" role="group" aria-label="Required components">
                @for (comp of previewedComponents(); track comp.id) {
                  <div class="flex flex-col items-center">
                    <div class="w-px h-6 bg-border/60 mb-1"></div>
                    <button
                      type="button"
                      class="cursor-pointer w-14 h-14 rounded border border-border hover:border-primary/70 transition-colors
                             overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      [attr.aria-label]="'Preview component: ' + comp.name"
                      [title]="comp.name"
                      (click)="itemSelect.emit(comp)"
                    >
                      <img
                        [src]="ddragon.getItemImageUrl(comp.id)"
                        [alt]="comp.name"
                        width="56"
                        height="56"
                        class="w-full h-full object-cover"
                      />
                    </button>
                    <span class="text-xs text-muted-foreground mt-1">{{ comp.gold.total }}</span>
                  </div>
                }
              </div>
            </section>
          }

          <section
            class="rounded-lg border border-border bg-card p-5 flex flex-col gap-4"
            aria-label="Selected item details"
          >
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded border border-border overflow-hidden shrink-0">
                <img
                  [src]="ddragon.getItemImageUrl(item.id)"
                  [alt]="item.name"
                  width="48"
                  height="48"
                  class="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 class="font-semibold text-base leading-tight">{{ item.name }}</h3>
                <div class="flex items-center gap-1 mt-0.5">
                  <i z-icon zType="circle-dollar-sign" class="w-3.5 h-3.5 text-yellow-500"></i>
                  <span class="text-sm text-muted-foreground">{{ item.gold.total }} gold</span>
                </div>
              </div>
            </div>

            <div
              class="text-sm leading-relaxed text-muted-foreground border-t border-border pt-3"
              [innerHTML]="previewedDescription()"
            ></div>
          </section>

        </div>

      } @else {
        <div class="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground" aria-live="polite">
          <i z-icon zType="search" class="w-12 h-12 opacity-30"></i>
          <p class="text-sm">Select an item from the list to see details</p>
        </div>
      }

    </main>
  `,
})
export class ItemDetailPanelComponent {
  protected readonly ddragon = inject(DdragonService);

  readonly item = input<Item | null>(null);
  readonly parentSuggestions = input.required<Item[]>();
  readonly previewedComponents = input.required<Item[]>();
  readonly previewedDescription = input.required<SafeHtml>();

  readonly itemSelect = output<Item>();
}
