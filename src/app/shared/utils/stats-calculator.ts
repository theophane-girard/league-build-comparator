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
    lethality: 0,
    armorPenPercent: 0,
    magicPenFlat: 0,
    magicPenPercent: 0,
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
    bonuses.lethality += item.lethality ?? 0;
    bonuses.armorPenPercent += item.armorPenPercent ?? 0;
    bonuses.magicPenFlat += item.magicPenFlat ?? 0;
    bonuses.magicPenPercent += item.magicPenPercent ?? 0;
  }

  return bonuses;
}

/** Returns the extra bonuses from conditional items that have been toggled ON */
export function sumConditionalBonuses(
  items: Item[],
  itemToggles: Map<string, boolean>,
  itemBonuses: ItemBonuses,
): Partial<ItemBonuses> {
  const result: Partial<ItemBonuses> = {};

  for (const item of items) {
    if (!item.profiles?.includes('conditional')) continue;
    if (!item.conditionalBonus) continue;
    if (itemToggles.get(`${item.id}_conditional`) !== true) continue;

    const cb = item.conditionalBonus;
    if (cb.hp) result.hp = (result.hp ?? 0) + cb.hp;
    if (cb.armor) result.armor = (result.armor ?? 0) + cb.armor;
    if (cb.magicResist) result.magicResist = (result.magicResist ?? 0) + cb.magicResist;
    if (cb.attackDamage) result.attackDamage = (result.attackDamage ?? 0) + cb.attackDamage;
    if (cb.abilityPower) result.abilityPower = (result.abilityPower ?? 0) + cb.abilityPower;
    if (cb.critChance) result.critChance = (result.critChance ?? 0) + cb.critChance;
    if (cb.attackSpeedBonus) result.attackSpeedBonus = (result.attackSpeedBonus ?? 0) + cb.attackSpeedBonus;
    if (cb.armorRatio) result.armor = (result.armor ?? 0) + cb.armorRatio * itemBonuses.armor;
    if (cb.magicResistRatio) result.magicResist = (result.magicResist ?? 0) + cb.magicResistRatio * itemBonuses.magicResist;
    if (cb.hpRatio) result.hp = (result.hp ?? 0) + cb.hpRatio * itemBonuses.hp;
    if (cb.attackDamageRatio) result.attackDamage = (result.attackDamage ?? 0) + cb.attackDamageRatio * itemBonuses.attackDamage;
    if (cb.abilityPowerRatio) result.abilityPower = (result.abilityPower ?? 0) + cb.abilityPowerRatio * itemBonuses.abilityPower;
  }

  return result;
}

export function combineStats(base: BaseStats, bonuses: ItemBonuses): FinalStats {
  const hp = base.hp + bonuses.hp;
  const armor = base.armor + bonuses.armor;
  const magicResist = base.magicResist + bonuses.magicResist;

  return {
    hp,
    mp: base.mp + bonuses.mp,
    armor,
    magicResist,
    attackDamage: base.attackDamage + bonuses.attackDamage,
    abilityPower: bonuses.abilityPower,
    attackSpeed: base.attackSpeed * (1 + bonuses.attackSpeedBonus),
    attackRange: base.attackRange,
    movementSpeed: base.movementSpeed + bonuses.movementSpeed,
    critChance: Math.min(100, base.critChance + bonuses.critChance),
    lethality: bonuses.lethality,
    armorPenPercent: bonuses.armorPenPercent,
    magicPenFlat: bonuses.magicPenFlat,
    magicPenPercent: bonuses.magicPenPercent,
    physicalDamageReduction: (armor / (100 + armor)) * 100,
    magicalDamageReduction: (magicResist / (100 + magicResist)) * 100,
    effectiveHpPhysical: hp * (100 + armor) / 100,
    effectiveHpMagical: hp * (100 + magicResist) / 100,
  };
}
