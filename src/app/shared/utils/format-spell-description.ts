import type { ChampionSpell, SpellLevelingEntry } from '@/features/build-calculator/models/champion.model';
import type { FinalStats } from '@/features/build-calculator/models/computed-stats.model';

// Colors matching the item formatter palette
const COLOR_AD = '#c86c37';
const COLOR_AP = '#9e6fce';
const COLOR_ARMOR = '#c89b3c';
const COLOR_MR = '#7ec4e4';
const COLOR_HP = '#71c56d';
const COLOR_FLAT = '#e2e8f0';

function getUnitColor(unit: string): string {
  const u = unit.toLowerCase();
  if (u.includes('ap') || u.includes('ability power')) return COLOR_AP;
  if (u.includes('armor') && !u.includes('pen')) return COLOR_ARMOR;
  if (u.includes('magic resist') || u === '% mr') return COLOR_MR;
  if (u.includes('health') || u.includes('hp')) return COLOR_HP;
  if (u.includes('ad') || u.includes('attack damage')) return COLOR_AD;
  return COLOR_FLAT;
}

function resolveStatValue(unit: string, stats: FinalStats, bonusAD: number): number {
  const u = unit.toLowerCase().trim();
  if (u.includes('ap') || u.includes('ability power')) return stats.abilityPower;
  if (u.includes('bonus') && (u.includes('ad') || u.includes('attack damage'))) return bonusAD;
  if (u.includes('base') && (u.includes('ad') || u.includes('attack damage'))) return stats.attackDamage - bonusAD;
  if (u.includes('ad') || u.includes('attack damage')) return stats.attackDamage;
  if (u.includes('health') || u.includes('hp')) return stats.hp;
  if (u.includes('armor') && !u.includes('pen')) return stats.armor;
  if (u.includes('magic resist') || u.includes('mr')) return stats.magicResist;
  return 0;
}

function formatLevelingEntry(
  entry: SpellLevelingEntry,
  rankIndex: number,
  stats: FinalStats,
  bonusAD: number,
): string {
  const parts: string[] = [];
  let calculatedTotal = 0;
  let hasScaling = false;

  for (const mod of entry.modifiers) {
    const value = mod.values[rankIndex];
    const unit = mod.units[rankIndex] ?? '';
    if (value === undefined) continue;

    const isFlat = !unit.trim();
    if (isFlat) {
      parts.push(`<span style="color:${COLOR_FLAT};font-weight:600">${value}</span>`);
      calculatedTotal += value;
    } else {
      hasScaling = true;
      const color = getUnitColor(unit);
      const statVal = resolveStatValue(unit, stats, bonusAD);
      calculatedTotal += (value / 100) * statVal;
      parts.push(`<span style="color:${color};font-weight:600">${value}${unit}</span>`);
    }
  }

  if (!parts.length) return '';

  const totalSpan = hasScaling
    ? ` <span style="color:rgba(255,255,255,0.45);font-size:0.7rem">(= ${Math.round(calculatedTotal)})</span>`
    : '';

  return (
    `<div style="display:flex;align-items:baseline;gap:.25rem;margin-top:.15rem">` +
    `<span style="color:rgba(255,255,255,0.5);font-size:0.7rem;white-space:nowrap">${entry.attribute}:</span>` +
    `<span>${parts.join('<span style="color:rgba(255,255,255,0.4)"> + </span>')}</span>` +
    `${totalSpan}` +
    `</div>`
  );
}

export function formatSpellDescription(
  spell: ChampionSpell,
  rank: number,
  stats: FinalStats,
  bonusAD: number,
): string {
  const rankIndex = Math.max(0, rank - 1);

  const descHtml = spell.description
    ? `<p style="color:rgba(255,255,255,0.75);font-size:0.75rem;line-height:1.4;margin-bottom:.35rem">${spell.description}</p>`
    : '';

  const cooldown = spell.cooldown[rankIndex];
  const cooldownHtml = cooldown != null
    ? `<p style="color:rgba(255,255,255,0.45);font-size:0.7rem;margin-bottom:.25rem">Cooldown: ${cooldown}s</p>`
    : '';

  const levelingRows = spell.leveling
    .map(entry => formatLevelingEntry(entry, rankIndex, stats, bonusAD))
    .filter(Boolean)
    .join('');

  const levelingHtml = levelingRows
    ? `<div style="border-top:1px solid rgba(255,255,255,.1);padding-top:.3rem;margin-top:.1rem">${levelingRows}</div>`
    : '';

  return descHtml + cooldownHtml + levelingHtml;
}
