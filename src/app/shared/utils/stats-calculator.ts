import type { ChampionStats } from '@/features/build-calculator/models/champion.model';
import type { Item } from '@/features/build-calculator/models/item.model';
import type { BaseStats, FinalStats, ItemBonuses } from '@/features/build-calculator/models/computed-stats.model';

export function calculateBaseStats(stats: ChampionStats, level: number): BaseStats {
  const lvl = Math.max(1, Math.min(18, level));
  return {
    hp: stats.hp + stats.hpperlevel * (lvl - 1),
    mp: stats.mp + stats.mpperlevel * (lvl - 1),
    armor: stats.armor + stats.armorperlevel * (lvl - 1),
    magicResist: stats.spellblock + stats.spellblockperlevel * (lvl - 1),
    attackDamage: stats.attackdamage + stats.attackdamageperlevel * (lvl - 1),
    attackSpeed: stats.attackspeed * (1 + (stats.attackspeedperlevel * (lvl - 1)) / 100),
    attackRange: stats.attackrange,
    movementSpeed: stats.movespeed,
    critChance: stats.crit + stats.critperlevel * (lvl - 1),
  };
}

export function sumItemStats(items: Item[]): ItemBonuses {
  const bonuses: ItemBonuses = {
    hp: 0,
    mp: 0,
    armor: 0,
    magicResist: 0,
    attackDamage: 0,
    abilityPower: 0,
    movementSpeed: 0,
    critChance: 0,
    attackSpeedBonus: 0,
  };

  for (const item of items) {
    const s = item.stats;
    bonuses.hp += s.FlatHPPoolMod ?? 0;
    bonuses.mp += s.FlatMPPoolMod ?? 0;
    bonuses.armor += s.FlatArmorMod ?? 0;
    bonuses.magicResist += s.FlatSpellBlockMod ?? 0;
    bonuses.attackDamage += s.FlatPhysicalDamageMod ?? 0;
    bonuses.abilityPower += s.FlatMagicDamageMod ?? 0;
    bonuses.movementSpeed += s.FlatMovementSpeedMod ?? 0;
    bonuses.critChance += (s.FlatCritChanceMod ?? 0) * 100;
    bonuses.attackSpeedBonus += s.PercentAttackSpeedMod ?? 0;
  }

  return bonuses;
}

export function combineStats(base: BaseStats, bonuses: ItemBonuses): FinalStats {
  return {
    hp: base.hp + bonuses.hp,
    mp: base.mp + bonuses.mp,
    armor: base.armor + bonuses.armor,
    magicResist: base.magicResist + bonuses.magicResist,
    attackDamage: base.attackDamage + bonuses.attackDamage,
    abilityPower: bonuses.abilityPower,
    attackSpeed: base.attackSpeed * (1 + bonuses.attackSpeedBonus),
    attackRange: base.attackRange,
    movementSpeed: base.movementSpeed + bonuses.movementSpeed,
    critChance: Math.min(100, base.critChance + bonuses.critChance),
  };
}
