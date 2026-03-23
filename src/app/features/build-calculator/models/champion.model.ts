export interface SpellModifier {
  values: number[];
  units: string[];  // e.g. "", "% AP", "% AD", "% Bonus AD", "% Maximum Health"
}

export interface SpellLevelingEntry {
  attribute: string;  // e.g. "Total Damage", "Damage Per Pass"
  modifiers: SpellModifier[];
}

export interface ChampionSpell {
  name: string;
  description: string;
  cooldown: number[];
  leveling: SpellLevelingEntry[];
  damageType: string | null;
}

export interface ChampionPassive {
  name: string;
  description: string;
  image: ChampionImage;
}

export interface ChampionStats {
  hp: number;
  hpperlevel: number;
  mp: number;
  mpperlevel: number;
  movespeed: number;
  armor: number;
  armorperlevel: number;
  spellblock: number;
  spellblockperlevel: number;
  attackrange: number;
  hpregen: number;
  hpregenperlevel: number;
  mpregen: number;
  mpregenperlevel: number;
  crit: number;
  critperlevel: number;
  attackdamage: number;
  attackdamageperlevel: number;
  attackspeedperlevel: number;
  attackspeed: number;
}

export interface ChampionImage {
  full: string;
  sprite: string;
  group: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChampionSummary {
  id: string;
  key: string;
  name: string;
  title: string;
  image: ChampionImage;
}

export interface ChampionDetail extends ChampionSummary {
  stats: ChampionStats;
  tags: string[];
  lore: string;
  spells: ChampionSpell[];
  passive: ChampionPassive;
}
