import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardPopoverDirective, ZardPopoverComponent } from '@/shared/components/popover';
import { BuildsManagerService } from '@/shared/services/builds-manager.service';
import { DdragonService } from '@/shared/services/ddragon.service';
import { formatItemDescription } from '@/shared/utils/format-item-description';
import { formatSpellDescription } from '@/shared/utils/format-spell-description';
import { calculateBaseStats, combineStats, sumItemStats } from '@/shared/utils/stats-calculator';
import type { FinalStats } from '../../models/computed-stats.model';
import type { ChampionSpell } from '../../models/champion.model';
import type { Item } from '../../models/item.model';
import type { SavedBuild } from '../../models/build.model';

const SPELL_KEYS = ['Q', 'W', 'E', 'R'] as const;
const SPELL_MAX_RANKS = [5, 5, 5, 3] as const;

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

      <!-- Spells -->
      @if (build().champion; as champion) {
        @if (champion.spells.length) {
          <div class="border-t border-border pt-2">
            <div class="flex justify-between gap-0.5">

              <!-- Passive -->
              <div class="flex flex-col items-center gap-0.5">
                <div class="h-4"></div>
                <ng-template #passiveTooltip>
                  <z-popover class="w-64 p-3">
                    <p class="font-semibold text-sm mb-1">{{ champion.passive.name }}</p>
                    <p class="text-xs text-muted-foreground leading-relaxed">{{ champion.passive.description }}</p>
                  </z-popover>
                </ng-template>
                <div
                  class="w-8 h-8 rounded border border-border/60 overflow-hidden cursor-default bg-muted/40"
                  [attr.aria-label]="champion.passive.name"
                  zPopover
                  [zContent]="passiveTooltip"
                  zTrigger="hover"
                  zPlacement="top"
                >
                  <img
                    [src]="ddragon.getPassiveImageUrl(champion.passive.image.full)"
                    [alt]="champion.passive.name"
                    width="32"
                    height="32"
                    class="w-full h-full object-cover"
                  />
                </div>
                <span class="text-[10px] text-muted-foreground leading-none">P</span>
                <div class="h-4"></div>
              </div>

              <!-- Q W E R -->
              @for (spell of champion.spells; let i = $index; track i) {
                @let rank = spellLevels()[i];
                @let maxRank = spellMaxRanks[i];
                @let spellKey = spellKeys[i];
                <div class="flex flex-col items-center gap-0.5">
                  <!-- + button -->
                  <button
                    type="button"
                    class="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold leading-none transition-colors"
                    [class]="rank < maxRank
                      ? 'text-primary hover:bg-primary/20 cursor-pointer'
                      : 'text-muted-foreground/30 cursor-not-allowed'"
                    [disabled]="rank >= maxRank"
                    [attr.aria-label]="'Increase ' + spellKey + ' level'"
                    (click)="increaseSpellLevel(i)"
                  >+</button>

                  <!-- Spell icon with tooltip -->
                  <ng-template #spellTooltip>
                    <z-popover class="w-72 p-3">
                      <div class="flex items-center gap-2 mb-2">
                        @if (spell.icon) {
                          <img
                            [src]="spell.icon"
                            [alt]="spell.name"
                            width="32"
                            height="32"
                            class="w-8 h-8 rounded shrink-0"
                          />
                        }
                        <div>
                          <p class="font-semibold text-sm leading-tight">{{ spell.name }}</p>
                          <p class="text-[10px] text-muted-foreground">{{ spellKey }} · Rank {{ rank }}/{{ maxRank }}</p>
                        </div>
                      </div>
                      @if (finalStats()) {
                        <div
                          class="text-xs leading-relaxed"
                          [innerHTML]="getSpellDescription(spell, rank)"
                        ></div>
                      } @else {
                        <p class="text-xs text-muted-foreground">{{ spell.description }}</p>
                      }
                    </z-popover>
                  </ng-template>
                  <div
                    class="w-8 h-8 rounded border overflow-hidden cursor-default bg-muted/40 transition-colors"
                    [class]="spell.damageType === 'physical' ? 'border-orange-500/50'
                           : spell.damageType === 'magical' ? 'border-purple-500/50'
                           : 'border-border/60'"
                    [attr.aria-label]="spell.name + ' rank ' + rank"
                    zPopover
                    [zContent]="spellTooltip"
                    zTrigger="hover"
                    zPlacement="top"
                  >
                    @if (spell.icon) {
                      <img
                        [src]="spell.icon"
                        [alt]="spell.name"
                        width="32"
                        height="32"
                        class="w-full h-full object-cover"
                      />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                        {{ spellKey }}
                      </div>
                    }
                  </div>

                  <!-- Rank number -->
                  <span class="text-[10px] font-semibold leading-none tabular-nums"
                    [class]="rank === maxRank ? 'text-primary' : 'text-muted-foreground'">
                    {{ rank }}
                  </span>

                  <!-- - button -->
                  <button
                    type="button"
                    class="w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold leading-none transition-colors"
                    [class]="rank > 1
                      ? 'text-primary hover:bg-primary/20 cursor-pointer'
                      : 'text-muted-foreground/30 cursor-not-allowed'"
                    [disabled]="rank <= 1"
                    [attr.aria-label]="'Decrease ' + spellKey + ' level'"
                    (click)="decreaseSpellLevel(i)"
                  >−</button>
                </div>
              }
            </div>
          </div>
        }
      }

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
  protected readonly spellLevels = signal([1, 1, 1, 1]);

  protected readonly spellKeys = SPELL_KEYS;
  protected readonly spellMaxRanks = SPELL_MAX_RANKS;

  protected readonly finalStats = computed((): FinalStats | null => {
    const b = this.build();
    if (b.finalStats) return b.finalStats;
    if (!b.champion) return null;
    const base = calculateBaseStats(b.champion.stats, b.level);
    const validItems = b.items.filter((i): i is Item => i !== null);
    const bonuses = sumItemStats(validItems);
    return combineStats(base, bonuses);
  });

  private readonly bonusAD = computed(() => {
    const b = this.build();
    const fs = this.finalStats();
    if (!fs || !b.champion) return 0;
    const base = b.baseStats ?? calculateBaseStats(b.champion.stats, b.level);
    return fs.attackDamage - base.attackDamage;
  });

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

  protected increaseSpellLevel(index: number): void {
    const max = SPELL_MAX_RANKS[index];
    this.spellLevels.update(levels => {
      const next = [...levels];
      next[index] = Math.min(max, next[index] + 1);
      return next;
    });
  }

  protected decreaseSpellLevel(index: number): void {
    this.spellLevels.update(levels => {
      const next = [...levels];
      next[index] = Math.max(1, next[index] - 1);
      return next;
    });
  }

  protected getItemDescription(item: Item): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(formatItemDescription(item.description, item));
  }

  protected getSpellDescription(spell: ChampionSpell, rank: number): SafeHtml {
    const fs = this.finalStats();
    if (!fs) return this.sanitizer.bypassSecurityTrustHtml(spell.description);
    return this.sanitizer.bypassSecurityTrustHtml(
      formatSpellDescription(spell, rank, fs, this.bonusAD()),
    );
  }
}
