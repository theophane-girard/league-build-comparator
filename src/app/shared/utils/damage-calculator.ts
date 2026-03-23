import type { ChampionSpell, SpellLevelingEntry } from '@/features/build-calculator/models/champion.model';
import type { BaseStats, FinalStats } from '@/features/build-calculator/models/computed-stats.model';

export interface SpellRatioContribution {
  stat: string;
  coeff: number;
  statValue: number;
  contribution: number;
}

export interface SpellDamageBreakdown {
  name: string;
  rank: number;
  baseDamage: number;
  ratios: SpellRatioContribution[];
  total: number;
  cooldown: number;
}

export interface DamageStats {
  burst: number;
  dps: number;
  autoAttackDps: number;
  spellBreakdowns: SpellDamageBreakdown[];
}

/** Extracts the stat label from a Meraki unit string, e.g. "% AP" → "AP" */
function unitLabel(unit: string): string {
  return unit.replace(/^%\s*/, '').trim();
}

/** Maps a Meraki unit string to the corresponding stat value */
function statValueForUnit(unit: string, stats: FinalStats, bonusAD: number): number {
  const u = unit.toLowerCase().trim();
  if (u === '% ap') return stats.abilityPower;
  if (u.includes('bonus ad') || u.includes('bonus attack damage')) return bonusAD;
  if (u === '% ad' || u.includes('attack damage')) return stats.attackDamage;
  if (u.includes('bonus armor')) return stats.armor;
  if (u.includes('armor')) return stats.armor;
  if (u.includes('magic resist') || u.includes('mr')) return stats.magicResist;
  if (u.includes('maximum health') || u.includes('max health') || u.includes('max hp')) return stats.hp;
  if (u.includes('bonus health') || u.includes('bonus hp')) return stats.hp;
  if (u.includes('maximum mana') || u.includes('max mana')) return stats.mp;
  return 0;
}

/**
 * Picks the best leveling entry to represent this spell's damage.
 * Prefers entries with "Total" in their attribute name, then picks
 * the entry with the highest flat base value at the given rank.
 */
function findPrimaryLeveling(
  leveling: SpellLevelingEntry[] | null | undefined,
  rankIndex: number,
): SpellLevelingEntry | null {
  if (!leveling?.length) return null;

  const isDamaging = (l: SpellLevelingEntry): boolean =>
    l.modifiers.some(m => {
      const unit = m.units[rankIndex] ?? m.units[0] ?? '';
      const val = m.values[rankIndex] ?? 0;
      return (unit === '' && val > 0) || unit.includes('%');
    });

  const damaging = leveling.filter(isDamaging);
  if (!damaging.length) return null;

  const totalEntries = damaging.filter(l =>
    l.attribute.toLowerCase().includes('total'),
  );
  const candidates = totalEntries.length ? totalEntries : damaging;

  return candidates.reduce((best, curr) => {
    const flatOf = (l: SpellLevelingEntry): number =>
      l.modifiers.find(m => (m.units[rankIndex] ?? '') === '')?.values[rankIndex] ?? 0;
    return flatOf(curr) > flatOf(best) ? curr : best;
  });
}

function calculateSpellBreakdown(
  spell: ChampionSpell,
  rank: number,
  stats: FinalStats,
  bonusAD: number,
): SpellDamageBreakdown {
  const idx = Math.max(0, rank - 1);
  // spell.leveling may be absent on stale cached data from a previous code format
  const leveling = findPrimaryLeveling((spell as { leveling?: SpellLevelingEntry[] }).leveling, idx);

  let baseDamage = 0;
  const ratios: SpellRatioContribution[] = [];

  if (leveling) {
    for (const modifier of leveling.modifiers) {
      const unit = modifier.units[idx] ?? modifier.units[0] ?? '';
      const value = modifier.values[idx] ?? 0;

      if (unit === '') {
        baseDamage += value;
      } else if (unit.includes('%') && value > 0) {
        const coeff = value / 100;
        const statValue = statValueForUnit(unit, stats, bonusAD);
        ratios.push({
          stat: unitLabel(unit),
          coeff,
          statValue,
          contribution: coeff * statValue,
        });
      }
    }
  }

  const total = baseDamage + ratios.reduce((s, r) => s + r.contribution, 0);
  const cooldown = spell.cooldown[idx] ?? spell.cooldown[0] ?? 1;

  return { name: spell.name, rank, baseDamage, ratios, total, cooldown };
}

export function calculateDamageStats(
  spells: ChampionSpell[],
  spellRanks: [number, number, number, number],
  finalStats: FinalStats,
  baseStats: BaseStats,
): DamageStats {
  const bonusAD = finalStats.attackDamage - baseStats.attackDamage;

  const spellBreakdowns = spells.slice(0, 4).map((spell, i) => {
    const rank = Math.max(1, spellRanks[i] ?? 1);
    return calculateSpellBreakdown(spell, rank, finalStats, bonusAD);
  });

  const critMultiplier = 1 + (finalStats.critChance / 100) * 0.75;
  const autoAttackDps = finalStats.attackDamage * finalStats.attackSpeed * critMultiplier;

  const burst = spellBreakdowns.reduce((s, b) => s + b.total, 0);
  const spellDps = spellBreakdowns.reduce(
    (s, b) => s + (b.cooldown > 0 ? b.total / b.cooldown : 0),
    0,
  );

  return { burst, dps: autoAttackDps + spellDps, autoAttackDps, spellBreakdowns };
}
