import type {
  ItemActiveEffect,
  ItemConditionalBonus,
  ItemPassiveEffect,
  ItemProfile,
  ParsedEffectRatio,
} from '@/features/build-calculator/models/item.model';

type MerakiStatEntry = { flat: number; percent: number };
type MerakiItemStats = Record<string, MerakiStatEntry>;

// ---------------------------------------------------------------------------
// Effects text parsing
// ---------------------------------------------------------------------------

/** Parses {@as|X% stat} markup from Meraki effects text into scaling ratios */
export function parseEffectRatios(effects: string): ParsedEffectRatio[] {
  const ratios: ParsedEffectRatio[] = [];
  // Match {{as|X% ...}} where X starts with a digit (skip pure-label tags like {{as|bonus physical damage}})
  const regex = /\{\{as\|(\d+(?:\.\d+)?)%\s*(.*?)(?:\|[^}]*)?\}\}/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(effects)) !== null) {
    const coeff = parseFloat(match[1]) / 100;
    const desc = match[2]
      .replace(/'{3}/g, '')           // strip wiki bold '''
      .replace(/\[\[.*?\]\]/g, '')    // strip [[wiki links]]
      .toLowerCase()
      .trim();

    let stat: ParsedEffectRatio['stat'] | null = null;

    if (desc.includes('base') && (desc.includes(' ad') || desc.includes('attack damage'))) {
      stat = 'baseAD';
    } else if (desc.includes('bonus') && (desc.includes(' ad') || desc.includes('attack damage'))) {
      stat = 'bonusAD';
    } else if (desc.includes(' ap') || desc.includes('ability power')) {
      stat = 'AP';
    } else if (desc.includes('armor') && !desc.includes('penetration')) {
      stat = 'armor';
    } else if (desc.includes('magic resist') || desc === 'mr') {
      stat = 'magicResist';
    } else if ((desc.includes('max') || desc.includes('maximum')) && (desc.includes('health') || desc.includes('hp'))) {
      stat = 'maxHP';
    } else if (desc === 'ad' || desc.includes(' ad') || desc.includes('attack damage')) {
      stat = 'AD';
    }

    if (stat !== null && coeff > 0) {
      ratios.push({ coeff, stat });
    }
  }
  return ratios;
}

/** Parses {{fd|X}} formatted-decimal cooldown from effects text */
function parseProcCooldown(effects: string): number | null {
  const m = effects.match(/\{\{fd\|(\d+(?:\.\d+)?)\}\}/);
  return m ? parseFloat(m[1]) : null;
}

// ---------------------------------------------------------------------------
// Classification helpers
// ---------------------------------------------------------------------------

const CONDITIONAL_KEYWORDS = [
  'stacking', ' stack', 'at maximum stacks', 'at max stacks', 'charges', 'when fully',
];

const PASSIVE_DAMAGE_PATTERN_NAMES = ['spellblade'];

function hasScalingRatio(effects: string | null | undefined): boolean {
  if (!effects) return false;
  return /\{\{as\|\d/.test(effects);
}

function isConditionalEffects(effects: string | null | undefined): boolean {
  if (!effects) return false;
  const lower = effects.toLowerCase();
  return CONDITIONAL_KEYWORDS.some(kw => lower.includes(kw));
}

function isPassiveDamageByName(name: string | null | undefined): boolean {
  if (!name) return false;
  return PASSIVE_DAMAGE_PATTERN_NAMES.some(n => name.toLowerCase().includes(n));
}

// ---------------------------------------------------------------------------
// Public classification + builder functions
// ---------------------------------------------------------------------------

export function classifyItemProfiles(
  passives: { name: string; effects: string }[],
  active: { name: string; effects: string }[],
): ItemProfile[] {
  const profiles: ItemProfile[] = [];

  if (active.some(a => hasScalingRatio(a.effects))) {
    profiles.push('activeDamage');
  }

  if (passives.some(p => isPassiveDamageByName(p.name) && hasScalingRatio(p.effects))) {
    profiles.push('passiveDamage');
  }

  if (passives.some(p => isConditionalEffects(p.effects))) {
    profiles.push('conditional');
  }

  return profiles;
}

export function buildActiveEffects(
  actives: { name: string; effects: string; cooldown: number | null; range?: number | null }[],
): ItemActiveEffect[] {
  return actives
    .filter(a => hasScalingRatio(a.effects))
    .map(a => ({
      name: a.name,
      effects: a.effects,
      cooldown: a.cooldown,
      ratios: parseEffectRatios(a.effects),
    }))
    .filter(a => a.ratios.length > 0);
}

export function buildPassiveEffects(
  passives: { name: string; effects: string; unique: boolean }[],
): ItemPassiveEffect[] {
  return passives
    .filter(p => isPassiveDamageByName(p.name) && hasScalingRatio(p.effects))
    .map(p => ({
      name: p.name,
      effects: p.effects,
      unique: p.unique,
      ratios: parseEffectRatios(p.effects),
      procCooldown: parseProcCooldown(p.effects) ?? 1.5,
    }))
    .filter(p => p.ratios.length > 0);
}

/**
 * Estimates the max conditional bonus stats by parsing the effects text.
 * Approximation: percentage is applied against the item's own base stats,
 * not total bonus stats (which would require knowing all equipped items).
 */
export function computeConditionalBonus(
  passives: { name: string; effects: string }[],
  itemStats: MerakiItemStats,
): ItemConditionalBonus {
  const bonus: ItemConditionalBonus = {};

  for (const passive of passives) {
    if (!isConditionalEffects(passive.effects)) continue;

    const lower = passive.effects.toLowerCase();

    // Look for "by X%" or "X% bonus" patterns
    const pctMatch = lower.match(/by\s+(\d+(?:\.\d+)?)%/) ?? lower.match(/(\d+(?:\.\d+)?)%.*?(?:bonus|stacks?)/);
    if (!pctMatch) continue;
    const multiplier = parseFloat(pctMatch[1]) / 100;

    const hasArmor = lower.includes('armor');
    const hasMR = lower.includes('magic resist');

    if (hasArmor || hasMR) {
      if (hasArmor) {
        const v = getStatFlat(itemStats, 'armor');
        if (v > 0) bonus.armor = (bonus.armor ?? 0) + v * multiplier;
      }
      if (hasMR) {
        const v = getStatFlat(itemStats, 'magicresistance');
        if (v > 0) bonus.magicResist = (bonus.magicResist ?? 0) + v * multiplier;
      }
    } else if (lower.includes('crit') || lower.includes('critical')) {
      // "X% per stack, up to Y stacks" pattern
      const perStackMatch = lower.match(/(\d+(?:\.\d+)?)%[^.]*?(?:per|each)\s+stack/);
      const maxStacksMatch = lower.match(/(?:up\s+to|stacking\s+up\s+to)\s+(\d+)\s*stacks?/);
      if (perStackMatch && maxStacksMatch) {
        bonus.critChance = (bonus.critChance ?? 0) +
          parseFloat(perStackMatch[1]) * parseInt(maxStacksMatch[1]);
      }
    }
  }

  return bonus;
}

/** Case-insensitive stat lookup across Meraki's inconsistent casing */
function getStatFlat(stats: MerakiItemStats, key: string): number {
  const lower = key.toLowerCase();
  for (const k of Object.keys(stats)) {
    if (k.toLowerCase() === lower) return stats[k]?.flat ?? 0;
  }
  return 0;
}
