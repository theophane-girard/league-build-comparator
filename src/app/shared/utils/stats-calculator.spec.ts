import { describe, it, expect } from 'vitest';
import { calculateBaseStats, sumItemStats, sumConditionalBonuses, combineStats } from './stats-calculator';
import type { ChampionStats } from '@/features/build-calculator/models/champion.model';
import type { Item } from '@/features/build-calculator/models/item.model';
import type { BaseStats, ItemBonuses } from '@/features/build-calculator/models/computed-stats.model';

const BASE_CHAMPION_STATS: ChampionStats = {
  hp: 600,
  hpperlevel: 100,
  mp: 300,
  mpperlevel: 40,
  armor: 30,
  armorperlevel: 4,
  spellblock: 32,
  spellblockperlevel: 1.25,
  attackdamage: 55,
  attackdamageperlevel: 3,
  attackspeed: 0.65,
  attackspeedperlevel: 2,
  // attackspeed field exists but not attackspeed in ChampionStats directly
  attackrange: 525,
  movespeed: 325,
  crit: 0,
  critperlevel: 0,
  hpregen: 0,
  hpregenperlevel: 0,
  mpregen: 0,
  mpregenperlevel: 0,
};

const makeItem = (overrides: Partial<Item['stats']> = {}): Item => ({
  id: '1',
  name: 'Test Item',
  description: '',
  plaintext: '',
  image: { full: '', sprite: '', group: '', x: 0, y: 0, w: 0, h: 0 },
  gold: { base: 0, purchasable: true, total: 0, sell: 0 },
  tags: [],
  stats: overrides,
});

// ---------------------------------------------------------------------------
// calculateBaseStats
// ---------------------------------------------------------------------------
describe('calculateBaseStats', () => {
  it('returns correct stats at level 1', () => {
    const stats = calculateBaseStats(BASE_CHAMPION_STATS, 1);
    expect(stats.hp).toBe(600);
    expect(stats.mp).toBe(300);
    expect(stats.armor).toBe(30);
    expect(stats.magicResist).toBe(32);
    expect(stats.attackDamage).toBe(55);
    expect(stats.attackRange).toBe(525);
    expect(stats.movementSpeed).toBe(325);
  });

  it('scales stats correctly at level 10', () => {
    const stats = calculateBaseStats(BASE_CHAMPION_STATS, 10);
    expect(stats.hp).toBe(600 + 100 * 9);      // 1500
    expect(stats.mp).toBe(300 + 40 * 9);        // 660
    expect(stats.armor).toBe(30 + 4 * 9);       // 66
    expect(stats.attackDamage).toBe(55 + 3 * 9); // 82
  });

  it('scales attack speed as a percentage bonus', () => {
    const stats = calculateBaseStats(BASE_CHAMPION_STATS, 1);
    expect(stats.attackSpeed).toBeCloseTo(0.65);
    const stats10 = calculateBaseStats(BASE_CHAMPION_STATS, 10);
    // attackspeed * (1 + attackspeedperlevel * (lvl-1) / 100)
    expect(stats10.attackSpeed).toBeCloseTo(0.65 * (1 + 2 * 9 / 100));
  });

  it('clamps level below 1 to 1', () => {
    expect(calculateBaseStats(BASE_CHAMPION_STATS, 0).hp).toBe(600);
    expect(calculateBaseStats(BASE_CHAMPION_STATS, -5).hp).toBe(600);
  });

  it('clamps level above 18 to 18', () => {
    const capped = calculateBaseStats(BASE_CHAMPION_STATS, 18);
    const over = calculateBaseStats(BASE_CHAMPION_STATS, 99);
    expect(over.hp).toBe(capped.hp);
    expect(over.attackDamage).toBe(capped.attackDamage);
  });
});

// ---------------------------------------------------------------------------
// sumItemStats
// ---------------------------------------------------------------------------
describe('sumItemStats', () => {
  it('returns zeroed bonuses for empty list', () => {
    const result = sumItemStats([]);
    expect(result.hp).toBe(0);
    expect(result.mp).toBe(0);
    expect(result.attackDamage).toBe(0);
    expect(result.abilityPower).toBe(0);
    expect(result.armor).toBe(0);
    expect(result.magicResist).toBe(0);
  });

  it('sums HP from multiple items', () => {
    const items = [
      makeItem({ FlatHPPoolMod: 300 }),
      makeItem({ FlatHPPoolMod: 200 }),
    ];
    expect(sumItemStats(items).hp).toBe(500);
  });

  it('sums all stat types correctly', () => {
    const item = makeItem({
      FlatHPPoolMod: 500,
      FlatMPPoolMod: 300,
      FlatArmorMod: 20,
      FlatSpellBlockMod: 40,
      FlatPhysicalDamageMod: 60,
      FlatMagicDamageMod: 80,
      FlatMovementSpeedMod: 10,
      FlatCritChanceMod: 0.2,
      PercentAttackSpeedMod: 0.25,
    });
    const result = sumItemStats([item]);
    expect(result.hp).toBe(500);
    expect(result.mp).toBe(300);
    expect(result.armor).toBe(20);
    expect(result.magicResist).toBe(40);
    expect(result.attackDamage).toBe(60);
    expect(result.abilityPower).toBe(80);
    expect(result.movementSpeed).toBe(10);
    expect(result.critChance).toBeCloseTo(20);   // 0.2 * 100
    expect(result.attackSpeedBonus).toBe(0.25);
  });

  it('treats missing stat fields as 0', () => {
    const item = makeItem({ FlatHPPoolMod: 100 });
    const result = sumItemStats([item]);
    expect(result.mp).toBe(0);
    expect(result.armor).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// combineStats
// ---------------------------------------------------------------------------
describe('combineStats', () => {
  const base: BaseStats = {
    hp: 1000,
    mp: 400,
    armor: 50,
    magicResist: 40,
    attackDamage: 80,
    attackSpeed: 0.7,
    attackRange: 500,
    movementSpeed: 325,
    critChance: 0,
  };

  const bonuses: ItemBonuses = {
    hp: 400,
    mp: 200,
    armor: 30,
    magicResist: 20,
    attackDamage: 40,
    abilityPower: 100,
    movementSpeed: 0,
    critChance: 25,
    attackSpeedBonus: 0.3,
  };

  it('adds flat bonuses to base stats', () => {
    const result = combineStats(base, bonuses);
    expect(result.hp).toBe(1400);
    expect(result.mp).toBe(600);
    expect(result.armor).toBe(80);
    expect(result.magicResist).toBe(60);
    expect(result.attackDamage).toBe(120);
    expect(result.abilityPower).toBe(100);
  });

  it('applies attack speed as percentage bonus', () => {
    const result = combineStats(base, bonuses);
    expect(result.attackSpeed).toBeCloseTo(0.7 * (1 + 0.3));
  });

  it('caps crit chance at 100', () => {
    const highCritBonuses: ItemBonuses = { ...bonuses, critChance: 150 };
    expect(combineStats(base, highCritBonuses).critChance).toBe(100);
  });

  it('calculates physical damage reduction correctly', () => {
    const result = combineStats(base, bonuses);
    const armor = 80;
    expect(result.physicalDamageReduction).toBeCloseTo((armor / (100 + armor)) * 100);
  });

  it('calculates effective HP (physical) correctly', () => {
    const result = combineStats(base, bonuses);
    expect(result.effectiveHpPhysical).toBeCloseTo(1400 * (100 + 80) / 100);
  });

  it('calculates effective HP (magical) correctly', () => {
    const result = combineStats(base, bonuses);
    expect(result.effectiveHpMagical).toBeCloseTo(1400 * (100 + 60) / 100);
  });
});

// ---------------------------------------------------------------------------
// sumConditionalBonuses
// ---------------------------------------------------------------------------
describe('sumConditionalBonuses', () => {
  const baseItemBonuses: ItemBonuses = {
    hp: 0, mp: 0, armor: 100, magicResist: 60,
    attackDamage: 0, abilityPower: 0, movementSpeed: 0,
    critChance: 0, attackSpeedBonus: 0,
  };

  it('returns empty object when no conditional items', () => {
    const result = sumConditionalBonuses([], new Map(), baseItemBonuses);
    expect(result).toEqual({});
  });

  it('ignores items without conditional profile', () => {
    const item = makeItem({ FlatHPPoolMod: 500 });
    item.profiles = ['activeDamage'];
    const result = sumConditionalBonuses([item], new Map([[`${item.id}_conditional`, true]]), baseItemBonuses);
    expect(result).toEqual({});
  });

  it('ignores conditional items that are not toggled on', () => {
    const item = makeItem();
    item.profiles = ['conditional'];
    item.conditionalBonus = { armorRatio: 0.1 };
    const result = sumConditionalBonuses([item], new Map(), baseItemBonuses);
    expect(result).toEqual({});
  });

  it('applies flat armor bonus when toggled on', () => {
    const item = makeItem();
    item.profiles = ['conditional'];
    item.conditionalBonus = { armor: 20 };
    const result = sumConditionalBonuses([item], new Map([[`${item.id}_conditional`, true]]), baseItemBonuses);
    expect(result.armor).toBe(20);
  });

  it('applies armor ratio bonus based on item bonuses', () => {
    const item = makeItem();
    item.profiles = ['conditional'];
    item.conditionalBonus = { armorRatio: 0.1 };
    const result = sumConditionalBonuses([item], new Map([[`${item.id}_conditional`, true]]), baseItemBonuses);
    expect(result.armor).toBeCloseTo(10); // 0.1 * 100
  });
});
