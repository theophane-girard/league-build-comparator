import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { ChampionDetail, ChampionSummary, ChampionSpell, ChampionPassive, SpellModifier, SpellLevelingEntry } from '@/features/build-calculator/models/champion.model';
import type { Item } from '@/features/build-calculator/models/item.model';
import {
  buildActiveEffects,
  buildPassiveEffects,
  classifyItemProfiles,
  computeConditionalBonus,
} from '@/shared/utils/item-profile';

const BASE_URL = 'https://ddragon.leagueoflegends.com';

export interface DdragonLocale {
  code: string;
  label: string;
}

export const DDRAGON_LOCALES: DdragonLocale[] = [
  { code: 'en_US', label: 'English' },
  { code: 'fr_FR', label: 'Français' },
  { code: 'de_DE', label: 'Deutsch' },
  { code: 'es_ES', label: 'Español' },
  { code: 'it_IT', label: 'Italiano' },
  { code: 'pt_BR', label: 'Português' },
  { code: 'ru_RU', label: 'Русский' },
  { code: 'ko_KR', label: '한국어' },
  { code: 'ja_JP', label: '日本語' },
  { code: 'zh_CN', label: '中文' },
];

interface ChampionSummaryRaw {
  id: string;
  key: string;
  name: string;
  title: string;
  image: ChampionSummary['image'];
}

interface ChampionPassiveRaw {
  name: string;
  description: string;
  image: ChampionDetail['image'];
}

interface ChampionDetailRaw {
  id: string;
  key: string;
  name: string;
  title: string;
  image: ChampionDetail['image'];
  stats: ChampionDetail['stats'];
  tags: string[];
  lore: string;
  passive: ChampionPassiveRaw;
}

interface MerakiSpellModifier {
  values: number[];
  units: string[];
}

interface MerakiSpellLevelingEntry {
  attribute: string;
  modifiers: MerakiSpellModifier[];
}

interface MerakiSpellEffect {
  description: string;
  leveling: MerakiSpellLevelingEntry[];
}

interface MerakiSpell {
  name: string;
  blurb: string;
  effects: MerakiSpellEffect[];
  cooldown: { modifiers: MerakiSpellModifier[] } | null;
  damageType: string | null;
}

interface MerakiChampionData {
  abilities: {
    P: MerakiSpell[];
    Q: MerakiSpell[];
    W: MerakiSpell[];
    E: MerakiSpell[];
    R: MerakiSpell[];
  };
  passive: { name: string; description: string };
}

const MERAKI_CHAMPIONS_URL = '/meraki-champions.json';
const MERAKI_ITEMS_URL = '/meraki-items.json';

// ---------------------------------------------------------------------------
// DDragon item raw types
// ---------------------------------------------------------------------------

interface ItemRaw {
  name: string;
  description: string;
  plaintext: string;
  image: Item['image'];
  gold: Item['gold'];
  tags: string[];
  stats: Item['stats'];
  depth?: number;
  from?: string[];
  into?: string[];
  maps?: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// Meraki item raw types
// ---------------------------------------------------------------------------

type MerakiStatEntry = { flat: number; percent: number; perLevel: number; percentPerLevel: number; percentBase: number; percentBonus: number };
type MerakiItemStats = Record<string, MerakiStatEntry>;

interface MerakiPassiveRaw {
  name: string;
  effects: string;
  unique: boolean;
  mythic: boolean;
  range: number | null;
  cooldown: number | null;
  stats: MerakiItemStats;
}

interface MerakiActiveRaw {
  unique: boolean;
  name: string;
  effects: string;
  range: number | null;
  cooldown: number | null;
  stats?: MerakiItemStats;
}

interface MerakiItemRaw {
  id: number;
  name: string;
  tier: number;
  rank: string[];
  removed: boolean;
  noEffects: boolean;
  buildsFrom: number[];
  buildsInto: number[];
  stats: MerakiItemStats;
  passives: MerakiPassiveRaw[];
  active: MerakiActiveRaw[];
  shop: {
    prices: { total: number; combined: number; sell: number };
    purchasable: boolean;
    tags: string[];
  };
  maps?: string[];
  iconOverlay: boolean;
}

@Injectable({ providedIn: 'root' })
export class DdragonService {
  private readonly http = inject(HttpClient);

  readonly locale = signal<string>('en_US');
  readonly version = signal<string | null>(null);
  readonly champions = signal<ChampionSummary[]>([]);
  readonly items = signal<Item[]>([]);
  readonly rawItemsById = signal<Map<string, Item>>(new Map());
  readonly championDetailCache = signal<Map<string, ChampionDetail>>(new Map());

  private versionLoaded = false;
  private championsLoaded = false;
  private itemsLoaded = false;
  private merakiChampionsCache: Record<string, MerakiChampionData> | null = null;
  private merakiChampionsLoading: Promise<Record<string, MerakiChampionData> | null> | null = null;

  async loadVersion(): Promise<string> {
    if (this.versionLoaded && this.version()) {
      return this.version()!;
    }
    const versions = await firstValueFrom(
      this.http.get<string[]>(`${BASE_URL}/api/versions.json`)
    );
    const v = versions[0];
    this.version.set(v);
    this.versionLoaded = true;
    return v;
  }

  async loadChampions(): Promise<void> {
    if (this.championsLoaded) return;
    const v = await this.loadVersion();
    const data = await firstValueFrom(
      this.http.get<{ data: Record<string, ChampionSummaryRaw> }>(
        `${BASE_URL}/cdn/${v}/data/${this.locale()}/champion.json`
      )
    );
    const list = Object.values(data.data).map(c => ({
      id: c.id,
      key: c.key,
      name: c.name,
      title: c.title,
      image: c.image,
    }));
    this.champions.set(list);
    this.championsLoaded = true;
  }

  private loadMerakiChampions(): Promise<Record<string, MerakiChampionData> | null> {
    if (this.merakiChampionsCache !== null) return Promise.resolve(this.merakiChampionsCache);
    if (this.merakiChampionsLoading) return this.merakiChampionsLoading;
    this.merakiChampionsLoading = firstValueFrom(
      this.http.get<Record<string, MerakiChampionData>>(MERAKI_CHAMPIONS_URL)
    ).then(data => {
      this.merakiChampionsCache = data;
      return data;
    }).catch((err: unknown) => {
      console.error('[Meraki] Could not load champion data:', err);
      return null;
    });
    return this.merakiChampionsLoading;
  }

  async loadChampionDetail(id: string): Promise<ChampionDetail> {
    const cache = this.championDetailCache();
    if (cache.has(id)) return cache.get(id)!;

    const v = await this.loadVersion();
    const [data, merakiChampions] = await Promise.all([
      firstValueFrom(
        this.http.get<{ data: Record<string, ChampionDetailRaw> }>(
          `${BASE_URL}/cdn/${v}/data/${this.locale()}/champion/${id}.json`
        )
      ),
      this.loadMerakiChampions(),
    ]);
    const merakiData = merakiChampions?.[id] ?? null;
    const raw = data.data[id];

    const mapMerakiSpell = (s: MerakiSpell): ChampionSpell => ({
      name: s.name ?? '',
      description: s.blurb ?? '',
      cooldown: s.cooldown?.modifiers?.[0]?.values ?? [],
      leveling: (s.effects ?? []).flatMap(e => e.leveling ?? []).map((l): SpellLevelingEntry => ({
        attribute: l.attribute ?? '',
        modifiers: (l.modifiers ?? []).map((m): SpellModifier => ({
          values: m.values ?? [],
          units: m.units ?? [],
        })),
      })),
      damageType: s.damageType ?? null,
    });

    const spells: ChampionSpell[] = merakiData
      ? (['Q', 'W', 'E', 'R'] as const).map(key => {
          const spell = merakiData.abilities[key]?.[0];
          return spell ? mapMerakiSpell(spell) : null;
        }).filter((s): s is ChampionSpell => s !== null)
      : [];

    const mapPassive = (p: ChampionPassiveRaw): ChampionPassive => ({
      name: p.name,
      description: p.description,
      image: p.image,
    });
    const detail: ChampionDetail = {
      id: raw.id,
      key: raw.key,
      name: raw.name,
      title: raw.title,
      image: raw.image,
      stats: raw.stats,
      tags: raw.tags,
      lore: raw.lore,
      spells,
      passive: mapPassive(raw.passive),
    };
    this.championDetailCache.update(m => {
      const next = new Map(m);
      next.set(id, detail);
      return next;
    });
    return detail;
  }

  async loadItems(): Promise<void> {
    if (this.itemsLoaded) return;
    const v = await this.loadVersion();

    const [ddragonData, merakiItems] = await Promise.all([
      firstValueFrom(
        this.http.get<{ data: Record<string, ItemRaw> }>(
          `${BASE_URL}/cdn/${v}/data/${this.locale()}/item.json`
        )
      ),
      firstValueFrom(
        this.http.get<Record<string, MerakiItemRaw>>(MERAKI_ITEMS_URL)
      ).catch((err: unknown) => {
        console.error('[Meraki] Could not load item enrichment data:', err);
        return null;
      }),
    ]);

    const mapEntry = ([id, item]: [string, ItemRaw]): Item => {
      const base: Item = {
        id,
        name: item.name,
        description: item.description,
        plaintext: item.plaintext,
        image: item.image,
        gold: item.gold,
        tags: item.tags ?? [],
        stats: item.stats,
        depth: item.depth,
        from: item.from,
        into: item.into,
        maps: item.maps,
      };

      if (merakiItems) {
        const meraki = merakiItems[id];
        if (meraki) {
          const passives = meraki.passives ?? [];
          const active = meraki.active ?? [];
          const profiles = classifyItemProfiles(passives, active);
          base.profiles = profiles.length > 0 ? profiles : undefined;
          base.activeEffects = buildActiveEffects(active);
          base.passiveEffects = buildPassiveEffects(passives);
          base.conditionalBonus = profiles.includes('conditional')
            ? computeConditionalBonus(passives)
            : undefined;
          base.roleTags = meraki.shop?.tags ?? [];
        }
      }

      return base;
    };

    const rawById = new Map<string, Item>();
    Object.entries(ddragonData.data).forEach(entry => rawById.set(entry[0], mapEntry(entry)));
    this.rawItemsById.set(rawById);

    const list: Item[] = Object.entries(ddragonData.data)
      .filter(([id, item]) => {
        const meraki = merakiItems?.[id];
        if (meraki?.rank?.includes('DISTRIBUTED')) return false;
        if (meraki?.tier === 4) return true; // transformation items (e.g. Seraph's Embrace, Muramana)
        return (
          item.gold.purchasable &&
          item.gold.total > 0 &&
          (item.depth === undefined || item.depth >= 2) &&
          item.tags?.length > 0 &&
          Object.keys(item.stats).length > 0
        );
      })
      .map(mapEntry);

    this.items.set(list);
    this.itemsLoaded = true;
  }

  async setLocale(code: string): Promise<void> {
    if (this.locale() === code) return;
    this.locale.set(code);
    this.championsLoaded = false;
    this.itemsLoaded = false;
    this.champions.set([]);
    this.items.set([]);
    this.rawItemsById.set(new Map());
    this.championDetailCache.set(new Map());
    await Promise.all([this.loadChampions(), this.loadItems()]);
  }

  getChampionImageUrl(imageFullName: string): string {
    const v = this.version();
    if (!v) return '';
    return `${BASE_URL}/cdn/${v}/img/champion/${imageFullName}`;
  }

  getItemImageUrl(itemId: string): string {
    const v = this.version();
    if (!v) return '';
    return `${BASE_URL}/cdn/${v}/img/item/${itemId}.png`;
  }
}
