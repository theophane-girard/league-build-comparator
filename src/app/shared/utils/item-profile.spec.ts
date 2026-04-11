import { describe, it, expect } from 'vitest';
import {
  parseEffectRatios,
  classifyItemProfiles,
  buildActiveEffects,
  buildPassiveEffects,
  computeConditionalBonus,
} from './item-profile';

// ---------------------------------------------------------------------------
// parseEffectRatios
// ---------------------------------------------------------------------------
describe('parseEffectRatios', () => {
  it('parses AP ratio', () => {
    const ratios = parseEffectRatios('deals {{as|80% AP}} magic damage');
    expect(ratios).toHaveLength(1);
    expect(ratios[0]).toEqual({ coeff: 0.8, stat: 'AP' });
  });

  it('parses bonus AD ratio', () => {
    const ratios = parseEffectRatios('{{as|120% bonus AD}} physical damage');
    expect(ratios).toHaveLength(1);
    expect(ratios[0]).toEqual({ coeff: 1.2, stat: 'bonusAD' });
  });

  it('parses base AD ratio', () => {
    const ratios = parseEffectRatios('{{as|100% base attack damage}}');
    expect(ratios).toHaveLength(1);
    expect(ratios[0]).toEqual({ coeff: 1.0, stat: 'baseAD' });
  });

  it('parses max HP ratio', () => {
    const ratios = parseEffectRatios('{{as|6% maximum health}} damage');
    expect(ratios).toHaveLength(1);
    expect(ratios[0]).toEqual({ coeff: 0.06, stat: 'maxHP' });
  });

  it('parses armor ratio', () => {
    const ratios = parseEffectRatios('{{as|50% armor}}');
    expect(ratios).toHaveLength(1);
    expect(ratios[0]).toEqual({ coeff: 0.5, stat: 'armor' });
  });

  it('parses magic resist ratio', () => {
    const ratios = parseEffectRatios('{{as|30% magic resist}}');
    expect(ratios).toHaveLength(1);
    expect(ratios[0]).toEqual({ coeff: 0.3, stat: 'magicResist' });
  });

  it('returns multiple ratios from one text', () => {
    const ratios = parseEffectRatios('{{as|60% AP}} + {{as|40% bonus AD}}');
    expect(ratios).toHaveLength(2);
    expect(ratios.map(r => r.stat)).toContain('AP');
    expect(ratios.map(r => r.stat)).toContain('bonusAD');
  });

  it('ignores label-only as tags (no leading digit)', () => {
    const ratios = parseEffectRatios('{{as|bonus physical damage}}');
    expect(ratios).toHaveLength(0);
  });

  it('returns empty array for text without ratios', () => {
    expect(parseEffectRatios('Deals damage to nearby enemies.')).toHaveLength(0);
  });

  it('strips wiki bold markers from stat name', () => {
    const ratios = parseEffectRatios("{{as|80% '''bonus''' AD}}");
    expect(ratios[0]?.stat).toBe('bonusAD');
  });

  it('parses (+ X% stat) format — Hextech Gunblade style', () => {
    const ratios = parseEffectRatios('dealing damage {{as|(+ 30% AP)}} magic damage');
    expect(ratios).toHaveLength(1);
    expect(ratios[0]).toEqual({ coeff: 0.3, stat: 'AP' });
  });

  it('parses (+ X% bonus AD) format', () => {
    const ratios = parseEffectRatios("gain {{as|(+ 10% '''bonus''' AD)}} ability haste");
    expect(ratios).toHaveLength(1);
    expect(ratios[0]).toEqual({ coeff: 0.1, stat: 'bonusAD' });
  });

  it('parses mixed flat and (+ X%) formats in one text', () => {
    // Stormsurge: {{as|125|magic damage}} {{as|(+ 25% AP)}}
    const ratios = parseEffectRatios('deal {{as|125|magic damage}} {{as|(+ 25% AP)}} magic damage');
    expect(ratios).toHaveLength(1);
    expect(ratios[0]).toEqual({ coeff: 0.25, stat: 'AP' });
  });
});

// ---------------------------------------------------------------------------
// classifyItemProfiles
// ---------------------------------------------------------------------------
describe('classifyItemProfiles', () => {
  it('returns activeDamage when active effects exist', () => {
    const profiles = classifyItemProfiles(
      [],
      [{ name: 'Cloudburst', effects: 'deals {{as|80% bonus AD}} damage' }],
    );
    expect(profiles).toContain('activeDamage');
  });

  it('returns passiveDamage for spellblade passive with scaling', () => {
    const profiles = classifyItemProfiles(
      [{ name: 'Spellblade', effects: 'deals {{as|150% base attack damage}}' }],
      [],
    );
    expect(profiles).toContain('passiveDamage');
  });

  it('does not return passiveDamage for non-spellblade passives', () => {
    const profiles = classifyItemProfiles(
      [{ name: 'Immolate', effects: 'deals {{as|20% AP}} damage' }],
      [],
    );
    expect(profiles).not.toContain('passiveDamage');
  });

  it('returns conditional for stacking passives', () => {
    const profiles = classifyItemProfiles(
      [{ name: 'Seeping Venom', effects: 'Gain stacking bonus armor' }],
      [],
    );
    expect(profiles).toContain('conditional');
  });

  it('returns empty array when no relevant effects', () => {
    expect(classifyItemProfiles([], [])).toEqual([]);
  });

  it('can return multiple profiles', () => {
    const profiles = classifyItemProfiles(
      [{ name: 'Spellblade', effects: 'deals {{as|150% base attack damage}} at maximum stacks' }],
      [{ name: 'Activate', effects: 'deals {{as|100% AP}}' }],
    );
    expect(profiles).toContain('activeDamage');
    expect(profiles).toContain('passiveDamage');
    expect(profiles).toContain('conditional');
  });
});

// ---------------------------------------------------------------------------
// buildActiveEffects
// ---------------------------------------------------------------------------
describe('buildActiveEffects', () => {
  it('builds active effects with ratios', () => {
    const effects = buildActiveEffects([
      { name: 'Activate', effects: 'deals {{as|80% AP}} magic damage', cooldown: 60, range: 700 },
    ]);
    expect(effects).toHaveLength(1);
    expect(effects[0].name).toBe('Activate');
    expect(effects[0].cooldown).toBe(60);
    expect(effects[0].ratios).toHaveLength(1);
    expect(effects[0].ratios[0].stat).toBe('AP');
  });

  it('excludes actives with empty effects', () => {
    const effects = buildActiveEffects([
      { name: 'Empty', effects: '', cooldown: null, range: null },
    ]);
    expect(effects).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(buildActiveEffects([])).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// buildPassiveEffects
// ---------------------------------------------------------------------------
describe('buildPassiveEffects', () => {
  it('includes spellblade passive with scaling ratio', () => {
    const effects = buildPassiveEffects([
      { name: 'Spellblade', effects: 'deals {{as|150% base attack damage}}', unique: true },
    ]);
    expect(effects).toHaveLength(1);
    expect(effects[0].ratios[0].stat).toBe('baseAD');
    expect(effects[0].unique).toBe(true);
  });

  it('excludes non-spellblade passives', () => {
    const effects = buildPassiveEffects([
      { name: 'Sunfire', effects: 'deals {{as|20% AP}} damage', unique: false },
    ]);
    expect(effects).toHaveLength(0);
  });

  it('parses proc cooldown from effects text', () => {
    const effects = buildPassiveEffects([
      { name: 'Spellblade', effects: 'Cooldown: {{fd|1.5}} seconds {{as|150% base AD}}', unique: true },
    ]);
    expect(effects[0].procCooldown).toBe(1.5);
  });

  it('defaults proc cooldown to 1.5 when not found', () => {
    const effects = buildPassiveEffects([
      { name: 'Spellblade', effects: 'deals {{as|150% base attack damage}}', unique: true },
    ]);
    expect(effects[0].procCooldown).toBe(1.5);
  });
});

// ---------------------------------------------------------------------------
// computeConditionalBonus
// ---------------------------------------------------------------------------
describe('computeConditionalBonus', () => {
  it('returns empty object for non-conditional passives', () => {
    const result = computeConditionalBonus([
      { name: 'Passive', effects: 'Deals damage to nearby enemies.' },
    ]);
    expect(result).toEqual({});
  });

  it('computes armor ratio for armor stacking effects', () => {
    const result = computeConditionalBonus([
      { name: 'Stacking', effects: 'Gain stacking bonus by 10% armor at maximum stacks' },
    ]);
    expect(result.armorRatio).toBeCloseTo(0.1);
  });

  it('computes magic resist ratio for MR stacking effects', () => {
    const result = computeConditionalBonus([
      { name: 'Stacking', effects: 'Gain stacking bonus by 15% magic resist at max stacks' },
    ]);
    expect(result.magicResistRatio).toBeCloseTo(0.15);
  });

  it('handles both armor and MR in same passive', () => {
    const result = computeConditionalBonus([
      { name: 'Stacking', effects: 'Gain by 10% armor and magic resist stacking' },
    ]);
    expect(result.armorRatio).toBeCloseTo(0.1);
    expect(result.magicResistRatio).toBeCloseTo(0.1);
  });
});
