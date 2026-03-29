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

import type { ZardIcon } from '@/shared/components/icon';
import { DdragonService } from '@/shared/services/ddragon.service';
import { formatItemDescription } from '@/shared/utils/format-item-description';
import type { Item } from '../../models/item.model';
import { ItemPickerHeaderComponent } from './item-picker-header.component';
import { ItemPickerSidebarComponent } from './item-picker-sidebar.component';
import { ItemDetailPanelComponent } from './item-detail-panel.component';

interface ItemCategory {
  id: string;
  label: string;
  icon: ZardIcon;
  tags: string[];
}

interface RoleFilter {
  id: string;
  label: string;
  icon: ZardIcon;
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

const ROLE_FILTERS: RoleFilter[] = [
  { id: 'FIGHTER',  label: 'Fighter',  icon: 'swords'    },
  { id: 'MARKSMAN', label: 'Marksman', icon: 'crosshair' },
  { id: 'ASSASSIN', label: 'Assassin', icon: 'fan'       },
  { id: 'MAGE',     label: 'Mage',     icon: 'wand'  },
  { id: 'TANK',     label: 'Tank',     icon: 'shield'    },
  { id: 'SUPPORT',  label: 'Support',  icon: 'heart'     },
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

/** Among items with the same name, keep the one with the highest numeric ID (most map-specific/recent version). */
function dedupeByName(items: Item[]): Item[] {
  const seen = new Map<string, Item>();
  for (const item of items) {
    const existing = seen.get(item.name);
    if (!existing || Number(item.id) > Number(existing.id)) {
      seen.set(item.name, item);
    }
  }
  return [...seen.values()];
}

@Component({
  selector: 'app-item-picker-modal',
  imports: [CdkTrapFocus, ItemPickerHeaderComponent, ItemPickerSidebarComponent, ItemDetailPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      cdkTrapFocus
      cdkTrapFocusAutoCapture
      class="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Item picker"
    >
      <app-item-picker-header
        [localItems]="localItems()"
        [activeSlotIndex]="activeSlotIndex()"
        [mapTypes]="mapTypes"
        [selectedMapId]="selectedMapId()"
        [canSaveBuild]="canSaveBuild()"
        (slotClick)="setActiveSlot($event)"
        (clearClick)="clearSlot($event)"
        (mapFilterChange)="setMapFilter($event)"
        (saveBuild)="saveBuildClick()"
        (close)="close()"
      />

      <div class="flex flex-1 min-h-0">
        <app-item-picker-sidebar
          [filteredItems]="filteredItems()"
          [previewedItemId]="previewedItem()?.id"
          [searchText]="searchText()"
          [categories]="categories"
          [activeFilters]="activeFilters()"
          [roleFilters]="roleFilters"
          [activeRoleFilter]="activeRoleFilter()"
          (searchChange)="searchText.set($event)"
          (filterToggle)="toggleFilter($event)"
          (filterClear)="clearFilters()"
          (roleFilterChange)="setRoleFilter($event)"
          (itemSelect)="selectItemFromList($event)"
        />

        <app-item-detail-panel
          [item]="previewedItem()"
          [parentSuggestions]="parentSuggestions()"
          [previewedComponents]="previewedComponents()"
          [previewedDescription]="previewedDescription()"
          (itemSelect)="selectItemFromList($event)"
        />
      </div>
    </div>
  `,
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class ItemPickerModalComponent implements OnInit, OnDestroy {
  private readonly ddragon = inject(DdragonService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sanitizer = inject(DomSanitizer);

  readonly slotIndex = input.required<number>();
  readonly initialItems = input.required<(Item | null)[]>();
  readonly canSaveBuild = input<boolean>(false);

  readonly closed = output<(Item | null)[]>();
  readonly buildSaved = output<(Item | null)[]>();

  protected readonly categories = ITEM_CATEGORIES;
  protected readonly roleFilters = ROLE_FILTERS;
  protected readonly mapTypes = MAP_TYPES;

  protected readonly activeSlotIndex = signal(0);
  protected readonly localItems = signal<(Item | null)[]>([null, null, null, null, null, null]);
  protected readonly previewedItem = signal<Item | null>(null);
  protected readonly searchText = signal('');
  protected readonly activeFilters = signal<Set<string>>(new Set());
  protected readonly activeRoleFilter = signal<string | null>(null);
  protected readonly selectedMapId = signal('11');

  protected readonly filteredItems = computed(() => {
    const mapId = this.selectedMapId();
    // Filter by map then deduplicate by name, keeping highest ID (most map-specific version)
    let items = dedupeByName(this.ddragon.items().filter((i) => i.maps?.[mapId] === true));

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
    const roleId = this.activeRoleFilter();
    if (roleId) {
      items = items.filter((i) => i.roleTags?.includes(roleId) && !i.into?.length);
    }
    return items;
  });

  protected readonly previewedComponents = computed((): Item[] => {
    const item = this.previewedItem();
    if (!item?.from?.length) return [];
    const byId = this.ddragon.rawItemsById();
    const mapId = this.selectedMapId();
    const resolved = item.from.map((id) => byId.get(id)).filter((i): i is Item => i !== undefined && (i.maps?.[mapId] === true));
    return dedupeByName(resolved);
  });

  protected readonly parentSuggestions = computed((): Item[] => {
    const item = this.previewedItem();
    if (!item?.into?.length) return [];
    const byId = this.ddragon.rawItemsById();
    const mapId = this.selectedMapId();
    const resolved = item.into.map((id) => byId.get(id)).filter((i): i is Item => i !== undefined && (i.maps?.[mapId] === true));
    return dedupeByName(resolved);
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
      formatItemDescription(item.description, item)
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
    const item = this.localItems()[index];
    this.previewedItem.set(item ?? null);
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

  protected setRoleFilter(id: string | null): void {
    this.activeRoleFilter.update(current => current === id ? null : id);
  }

  protected setMapFilter(mapId: string): void {
    this.selectedMapId.set(mapId);
    this.previewedItem.set(null);
  }

  protected selectItemFromList(item: Item): void {
    this.previewedItem.set(item);
    this.placeInActiveSlot(item);
  }

  private placeInActiveSlot(item: Item): void {
    const index = this.activeSlotIndex();
    this.localItems.update((items) => {
      const next = [...items];
      next[index] = item;
      return next;
    });
  }

  protected saveBuildClick(): void {
    this.buildSaved.emit(this.localItems());
  }

  protected close(): void {
    this.closed.emit(this.localItems());
  }

}
