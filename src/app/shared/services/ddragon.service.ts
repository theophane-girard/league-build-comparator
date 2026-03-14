import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { ChampionDetail, ChampionSummary } from '@/features/build-calculator/models/champion.model';
import type { Item } from '@/features/build-calculator/models/item.model';

const BASE_URL = 'https://ddragon.leagueoflegends.com';

interface ChampionSummaryRaw {
  id: string;
  key: string;
  name: string;
  title: string;
  image: ChampionSummary['image'];
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
}

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
}

@Injectable({ providedIn: 'root' })
export class DdragonService {
  private readonly http = inject(HttpClient);

  readonly version = signal<string | null>(null);
  readonly champions = signal<ChampionSummary[]>([]);
  readonly items = signal<Item[]>([]);
  readonly championDetailCache = signal<Map<string, ChampionDetail>>(new Map());

  private versionLoaded = false;
  private championsLoaded = false;
  private itemsLoaded = false;

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
        `${BASE_URL}/cdn/${v}/data/en_US/champion.json`
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

  async loadChampionDetail(id: string): Promise<ChampionDetail> {
    const cache = this.championDetailCache();
    if (cache.has(id)) return cache.get(id)!;

    const v = await this.loadVersion();
    const data = await firstValueFrom(
      this.http.get<{ data: Record<string, ChampionDetailRaw> }>(
        `${BASE_URL}/cdn/${v}/data/en_US/champion/${id}.json`
      )
    );
    const raw = data.data[id];
    const detail: ChampionDetail = {
      id: raw.id,
      key: raw.key,
      name: raw.name,
      title: raw.title,
      image: raw.image,
      stats: raw.stats,
      tags: raw.tags,
      lore: raw.lore,
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
    const data = await firstValueFrom(
      this.http.get<{ data: Record<string, ItemRaw> }>(
        `${BASE_URL}/cdn/${v}/data/en_US/item.json`
      )
    );
    const list: Item[] = Object.entries(data.data)
      .filter(([, item]) =>
        item.gold.purchasable &&
        item.gold.total > 0 &&
        (item.depth === undefined || item.depth >= 2) &&
        item.tags?.length > 0 &&
        Object.keys(item.stats).length > 0
      )
      .map(([id, item]) => ({
        id,
        name: item.name,
        description: item.description,
        plaintext: item.plaintext,
        image: item.image,
        gold: item.gold,
        tags: item.tags,
        stats: item.stats,
        depth: item.depth,
        from: item.from,
        into: item.into,
      }));
    this.items.set(list);
    this.itemsLoaded = true;
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
