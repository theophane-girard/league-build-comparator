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
}
