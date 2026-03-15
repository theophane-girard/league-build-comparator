import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { CdkTrapFocus } from '@angular/cdk/a11y';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import type { ZardIcon } from '@/shared/components/icon';
import { ZardInputDirective } from '@/shared/components/input';
import { DdragonService } from '@/shared/services/ddragon.service';
import { ItemSlotComponent } from '../item-slot/item-slot.component';
import type { Item } from '../../models/item.model';
import { ZardInputGroupComponent } from '@/shared/components/input-group';

interface ItemCategory {
  id: string;
  label: string;
  icon: ZardIcon;
  tags: string[];
}

interface MapType {
  id: string;
  label: string;
}

const MAP_TYPES: MapType[] = [
  { id: '11', label: 'Summoner\'s Rift' },
  { id: '12', label: 'ARAM' },
  { id: '30', label: 'Arena' },
];

const ITEM_CATEGORIES: ItemCategory[] = [
  { id: 'damage', label: 'Attack Damage', icon: 'swords', tags: ['Damage'] },
  { id: 'magic', label: 'Ability Power', icon: 'sparkles', tags: ['SpellDamage'] },
  { id: 'defense', label: 'Defense', icon: 'shield', tags: ['Armor', 'SpellBlock'] },
  { id: 'health', label: 'Health', icon: 'heart-pulse', tags: ['Health'] },
  { id: 'mana', label: 'Mana', icon: 'droplets', tags: ['Mana', 'ManaRegen'] },
  { id: 'attack-speed', label: 'Attack Speed', icon: 'activity', tags: ['AttackSpeed'] },
  { id: 'critical', label: 'Critical Strike', icon: 'crosshair', tags: ['CriticalStrike'] },
  { id: 'lifesteal', label: 'Life Steal', icon: 'heart', tags: ['LifeSteal'] },
  { id: 'boots', label: 'Boots', icon: 'footprints', tags: ['Boots'] },
  { id: 'ability-haste', label: 'Ability Haste', icon: 'hourglass', tags: ['CooldownReduction'] },
];

const STAT_LABELS: Record<string, { name: string; percent?: boolean }> = {
  FlatHPPoolMod: { name: 'Health' },
  FlatMPPoolMod: { name: 'Mana' },
  FlatArmorMod: { name: 'Armor' },
  FlatSpellBlockMod: { name: 'Magic Resistance' },
  FlatPhysicalDamageMod: { name: 'Attack Damage' },
  FlatMagicDamageMod: { name: 'Ability Power' },
  FlatMovementSpeedMod: { name: 'Movement Speed' },
  FlatCritChanceMod: { name: 'Critical Strike Chance', percent: true },
  PercentAttackSpeedMod: { name: 'Attack Speed', percent: true },
  FlatHPRegenMod: { name: 'Health Regen' },
  PercentLifeStealMod: { name: 'Life Steal', percent: true },
  PercentMovementSpeedMod: { name: 'Move Speed', percent: true },
};

@Component({
  selector: 'app-item-picker-modal',
  imports: [
    ZardButtonComponent,
    ZardIconComponent,
    ZardInputDirective,
    ItemSlotComponent,
    CdkTrapFocus,
    ZardInputGroupComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-picker-modal.component.html',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class ItemPickerModalComponent implements OnInit, OnDestroy {
  protected readonly ddragon = inject(DdragonService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sanitizer = inject(DomSanitizer);

  readonly slotIndex = input.required<number>();
  readonly initialItems = input.required<(Item | null)[]>();
  readonly canSaveBuild = input<boolean>(false);

  readonly closed = output<(Item | null)[]>();
  readonly buildSaved = output<(Item | null)[]>();

  protected readonly categories = ITEM_CATEGORIES;
  protected readonly mapTypes = MAP_TYPES;

  protected readonly activeSlotIndex = signal(0);
  protected readonly localItems = signal<(Item | null)[]>([null, null, null, null, null, null]);
  protected readonly previewedItem = signal<Item | null>(null);
  protected readonly searchText = signal('');
  protected readonly activeFilters = signal<Set<string>>(new Set());
  protected readonly selectedMapId = signal('11');

  protected readonly filteredItems = computed(() => {
    const mapId = this.selectedMapId();
    let items = this.ddragon.items().filter((i) => i.maps?.[mapId] === true);

    const search = this.searchText().toLowerCase().trim();
    if (search) {
      items = items.filter((i) => i.name.toLowerCase().includes(search));
    }
    const filters = this.activeFilters();
    if (filters.size > 0) {
      const activeTags = ITEM_CATEGORIES
        .filter((c) => filters.has(c.id))
        .flatMap((c) => c.tags);
      items = items.filter((i) => i.tags.some((t) => activeTags.includes(t)));
    }
    return items;
  });

  protected readonly previewedComponents = computed((): Item[] => {
    const item = this.previewedItem();
    if (!item?.from?.length) return [];
    const byId = this.ddragon.rawItemsById();
    return item.from.map((id) => byId.get(id)).filter((i): i is Item => i !== undefined);
  });

  protected readonly parentSuggestions = computed((): Item[] => {
    const item = this.previewedItem();
    if (!item?.into?.length) return [];
    const byId = this.ddragon.rawItemsById();
    return item.into.map((id) => byId.get(id)).filter((i): i is Item => i !== undefined);
  });

  protected readonly previewedStats = computed((): string[] => {
    const item = this.previewedItem();
    if (!item) return [];
    return Object.entries(item.stats)
      .filter(([, value]) => value !== undefined && value > 0)
      .map(([key, value]) => {
        const meta = STAT_LABELS[key];
        if (!meta) return null;
        const formatted = meta.percent ? `${Math.round((value ?? 0) * 100)}%` : `${value}`;
        return `+${formatted} ${meta.name}`;
      })
      .filter((s): s is string => s !== null);
  });

  protected readonly previewedDescription = computed((): SafeHtml => {
    const item = this.previewedItem();
    if (!item?.description) return '';
    return this.sanitizer.bypassSecurityTrustHtml(
      this.formatItemDescription(item.description)
    );
  });

  async ngOnInit(): Promise<void> {
    this.activeSlotIndex.set(this.slotIndex());
    this.localItems.set([...this.initialItems()]);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
    await this.ddragon.loadItems();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  protected setActiveSlot(index: number): void {
    this.activeSlotIndex.set(index);
  }

  protected clearSlot(index: number): void {
    this.localItems.update((items) => {
      const next = [...items];
      next[index] = null;
      return next;
    });
  }

  protected toggleFilter(filterId: string): void {
    this.activeFilters.update((filters) => {
      const next = new Set(filters);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  }

  protected clearFilters(): void {
    this.activeFilters.set(new Set());
  }

  protected setMapFilter(mapId: string): void {
    this.selectedMapId.set(mapId);
    this.previewedItem.set(null);
  }

  protected onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  private formatItemDescription(raw: string): string {
    const STANDARD_TAGS = /^(br|span|div|p|b|i|strong|em)$/i;
    return raw
      .replace(/<\/?mainText>/g, '')
      .replace(/<stats>([\s\S]*?)<\/stats>/g,
        '<div style="margin-bottom:.5rem">$1</div>')
      .replace(/<attention>([\s\S]*?)<\/attention>/g,
        '<span style="color:#c89b3c;font-weight:700">$1</span>')
      .replace(/<passive>([\s\S]*?)<\/passive>/g,
        '<span style="color:#c8aa6e;font-style:italic;font-weight:600">$1</span>')
      .replace(/<active>([\s\S]*?)<\/active>/g,
        '<span style="color:#c8aa6e;font-style:italic;font-weight:600">$1</span>')
      .replace(/<unique>([\s\S]*?)<\/unique>/g,
        '<span style="color:#c8aa6e;font-weight:600">$1</span>')
      .replace(/<physicalDamage>([\s\S]*?)<\/physicalDamage>/g,
        '<span style="color:#c86c37">$1</span>')
      .replace(/<magicDamage>([\s\S]*?)<\/magicDamage>/g,
        '<span style="color:#7ec4e4">$1</span>')
      .replace(/<trueDamage>([\s\S]*?)<\/trueDamage>/g,
        '<span style="font-weight:700">$1</span>')
      .replace(/<OnHit>([\s\S]*?)<\/OnHit>/g,
        '<span style="color:#e8834b">$1</span>')
      .replace(/<speed>([\s\S]*?)<\/speed>/g,
        '<span style="color:#71c56d">$1</span>')
      .replace(/<healing>([\s\S]*?)<\/healing>/g,
        '<span style="color:#71c56d">$1</span>')
      .replace(/<shield>([\s\S]*?)<\/shield>/g,
        '<span style="color:#7ec4e4">$1</span>')
      .replace(/<scaleAD>([\s\S]*?)<\/scaleAD>/g,
        '<span style="color:#c86c37">$1</span>')
      .replace(/<scaleAP>([\s\S]*?)<\/scaleAP>/g,
        '<span style="color:#9e6fce">$1</span>')
      .replace(/<ornnBonus>([\s\S]*?)<\/ornnBonus>/g,
        '<span style="color:#7ec4e4">$1</span>')
      .replace(/<lifeSteal>([\s\S]*?)<\/lifeSteal>/g,
        '<span style="color:#ff6161">$1</span>')
      .replace(/<(?:keyword|rarity)\w*>([\s\S]*?)<\/(?:keyword|rarity)\w*>/g,
        '<span style="color:#c8aa6e">$1</span>')
      .replace(/<\/?(br)[^>]*>/gi, '<br>')
      .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tag) =>
        STANDARD_TAGS.test(tag) ? match : ''
      );
  }

  protected selectItemFromList(item: Item): void {
    this.previewedItem.set(item);
  }

  protected previewComponent(comp: Item): void {
    this.previewedItem.set(comp);
  }

  protected addItem(): void {
    const item = this.previewedItem();
    if (!item) return;
    const index = this.activeSlotIndex();
    this.localItems.update((items) => {
      const next = [...items];
      next[index] = item;
      return next;
    });
    const nextEmpty = this.localItems().findIndex((i) => i === null);
    if (nextEmpty !== -1) {
      this.activeSlotIndex.set(nextEmpty);
    }
  }

  protected saveBuildClick(): void {
    this.buildSaved.emit(this.localItems());
  }

  protected close(): void {
    this.closed.emit(this.localItems());
  }
}
