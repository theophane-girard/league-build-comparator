import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ZardPopoverDirective, ZardPopoverComponent } from '@/shared/components/popover';
import type { DamageStats } from '@/shared/utils/damage-calculator';

function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}

function fmtCoeff(c: number): string {
  return (c * 100).toFixed(0) + '%';
}

@Component({
  selector: 'app-formula-hint',
  imports: [ZardPopoverDirective, ZardPopoverComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #hintContent>
      <z-popover class="w-80 p-3 space-y-3 text-xs">

        <!-- Auto-attack DPS -->
        <div>
          <p class="font-semibold text-foreground mb-1">Auto Attack DPS</p>
          @if (stats(); as s) {
            <p class="text-muted-foreground font-mono">
              AD × AS × (1 + crit% × 0.75)
            </p>
            <p class="font-mono text-foreground">= {{ fmt(s.autoAttackDps) }}/s</p>
          }
        </div>

        <!-- Spell breakdowns -->
        @if (stats(); as s) {
          @for (spell of s.spellBreakdowns; track spell.name) {
            @if (spell.baseDamage > 0 || spell.ratios.length > 0) {
              <div class="border-t border-border pt-2">
                <p class="font-semibold text-foreground">{{ spell.name }} <span class="text-muted-foreground font-normal">(rank {{ spell.rank }})</span></p>
                <div class="mt-1 space-y-0.5 text-muted-foreground font-mono">
                  @if (spell.baseDamage > 0) {
                    <p>Base: {{ fmt(spell.baseDamage) }}</p>
                  }
                  @for (r of spell.ratios; track r.stat) {
                    <p>+ {{ fmtCoeff(r.coeff) }} × {{ r.stat }}({{ fmt(r.statValue) }}) = {{ fmt(r.contribution) }}</p>
                  }
                </div>
                <div class="flex justify-between mt-1">
                  <span class="text-foreground font-semibold">= {{ fmt(spell.total) }}</span>
                  <span class="text-muted-foreground">{{ fmt(spell.total / spell.cooldown) }}/s (cd: {{ spell.cooldown }}s)</span>
                </div>
              </div>
            }
          }

          <!-- Totals -->
          <div class="border-t border-border pt-2 space-y-1">
            <div class="flex justify-between font-semibold text-foreground">
              <span>Burst</span>
              <span>{{ fmt(s.burst) }}</span>
            </div>
            <div class="flex justify-between font-semibold text-foreground">
              <span>DPS</span>
              <span>{{ fmt(s.dps) }}/s</span>
            </div>
          </div>

          <p class="text-muted-foreground/70 border-t border-border pt-2">
            ⚠ Approx. — base cooldowns, no AH/CDR, passives excluded
          </p>
        }
      </z-popover>
    </ng-template>

    <button
      type="button"
      class="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      zPopover
      [zContent]="hintContent"
      zTrigger="click"
      zPlacement="top"
      aria-label="Formula breakdown"
      aria-haspopup="true"
    >i</button>
  `,
})
export class FormulaHintComponent {
  readonly stats = input.required<DamageStats | null | undefined>();

  protected readonly fmt = fmt;
  protected readonly fmtCoeff = fmtCoeff;
}
