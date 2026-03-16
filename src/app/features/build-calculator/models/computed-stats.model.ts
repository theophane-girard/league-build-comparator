export interface BaseStats {
  hp: number;
  mp: number;
  armor: number;
  magicResist: number;
  attackDamage: number;
  attackSpeed: number;
  attackRange: number;
  movementSpeed: number;
  critChance: number;
}

export interface ItemBonuses {
  hp: number;
  mp: number;
  armor: number;
  magicResist: number;
  attackDamage: number;
  abilityPower: number;
  movementSpeed: number;
  critChance: number;
  attackSpeedBonus: number;
}

export interface FinalStats extends BaseStats {
  abilityPower: number;
  /** Percentage of physical damage mitigated: armor / (100 + armor) × 100 */
  physicalDamageReduction: number;
  /** Percentage of magic damage mitigated: magicResist / (100 + magicResist) × 100 */
  magicalDamageReduction: number;
  /** Effective HP against physical damage: hp × (100 + armor) / 100 */
  effectiveHpPhysical: number;
  /** Effective HP against magic damage: hp × (100 + magicResist) / 100 */
  effectiveHpMagical: number;
}
