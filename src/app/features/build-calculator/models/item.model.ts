export interface ItemGold {
  base: number;
  purchasable: boolean;
  total: number;
  sell: number;
}

export interface ItemImage {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ItemStats {
  FlatHPPoolMod?: number;
  FlatMPPoolMod?: number;
  FlatArmorMod?: number;
  FlatSpellBlockMod?: number;
  FlatPhysicalDamageMod?: number;
  FlatMagicDamageMod?: number;
  FlatMovementSpeedMod?: number;
  FlatCritChanceMod?: number;
  PercentAttackSpeedMod?: number;
  FlatHPRegenMod?: number;
  PercentLifeStealMod?: number;
  PercentMovementSpeedMod?: number;
}

/** Profile classification for Meraki-enriched items */
export type ItemProfile = 'activeDamage' | 'passiveDamage' | 'conditional';

export interface ParsedEffectRatio {
  coeff: number;
  stat: 'AD' | 'baseAD' | 'bonusAD' | 'AP' | 'armor' | 'magicResist' | 'maxHP';
}

export interface ItemActiveEffect {
  name: string;
  effects: string;
  cooldown: number | null;
  ratios: ParsedEffectRatio[];
}

export interface ItemPassiveEffect {
  name: string;
  effects: string;
  unique: boolean;
  ratios: ParsedEffectRatio[];
  procCooldown: number | null;
}

export interface ItemConditionalBonus {
  /** Flat bonuses (applied as-is) */
  hp?: number;
  armor?: number;
  magicResist?: number;
  attackDamage?: number;
  abilityPower?: number;
  critChance?: number;
  attackSpeedBonus?: number;
  /** Ratio bonuses: bonus = ratio × total bonus stat from all items */
  armorRatio?: number;
  magicResistRatio?: number;
  hpRatio?: number;
  attackDamageRatio?: number;
  abilityPowerRatio?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  plaintext: string;
  image: ItemImage;
  gold: ItemGold;
  tags: string[];
  /** Meraki shop role tags e.g. MAGE, TANK, MARKSMAN — present after Meraki data is loaded */
  roleTags?: string[];
  stats: ItemStats;
  depth?: number;
  from?: string[];
  into?: string[];
  maps?: Record<string, boolean>;
  /** Meraki enrichment — present after Meraki data is loaded */
  profiles?: ItemProfile[];
  activeEffects?: ItemActiveEffect[];
  passiveEffects?: ItemPassiveEffect[];
  conditionalBonus?: ItemConditionalBonus;
  /** Penetration stats from Meraki (not present in DDragon item.stats) */
  lethality?: number;
  armorPenPercent?: number;
  magicPenFlat?: number;
  magicPenPercent?: number;
}
