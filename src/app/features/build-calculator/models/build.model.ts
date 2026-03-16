import type { ChampionDetail } from './champion.model';
import type { Item } from './item.model';
import type { BaseStats, FinalStats } from './computed-stats.model';

export interface SavedBuild {
  id: string;
  name: string;
  champion: ChampionDetail;
  level: number;
  items: (Item | null)[];
  baseStats: BaseStats;
  finalStats: FinalStats;
  totalGold: number;
}
