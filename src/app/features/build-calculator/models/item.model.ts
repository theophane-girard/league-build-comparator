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

export interface Item {
  id: string;
  name: string;
  description: string;
  plaintext: string;
  image: ItemImage;
  gold: ItemGold;
  tags: string[];
  stats: ItemStats;
  depth?: number;
  from?: string[];
  into?: string[];
}
