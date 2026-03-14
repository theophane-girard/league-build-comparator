import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';

import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import type { ZardIcon } from '@/shared/components/icon';
import { ZardInputDirective } from '@/shared/components/input';
import { DdragonService } from '@/shared/services/ddragon.service';
import { ItemSlotComponent } from '../item-slot/item-slot.component';
import type { Item } from '../../models/item.model';

interface ItemCategory {
  id: string;
  label: string;
  icon: ZardIcon;
  tags: string[];
}

const ITEM_CATEGORIES: ItemCategory[] = [
  { id: 'all', label: 'All', icon: 'layout-dashboard', tags: [] },
  { id: 'damage', label: 'Attack Damage', icon: 'swords', tags: ['Damage'] },
  { id: 'magic', label: 'Ability Power', icon: 'sparkles', tags: ['SpellDamage'] },
  { id: 'defense', label: 'Defense', icon: 'shield', tags: ['Armor', 'SpellBlock'] },
  { id: 'health', label: 'Health', icon: 'heart-pulse', tags: ['Health'] },
  { id: 'mana', label: 'Mana', icon: 'droplets', tags: ['Mana', 'ManaRegen'] },
  { id: 'attack-speed', label: 'Attack Speed', icon: 'activity', tags: ['AttackSpeed'] },
  { id: 'critical', label: 'Critical Strike', icon: 'crosshair', tags: ['CriticalStrike'] },
  { id: 'lifesteal', label: 'Life Steal', icon: 'heart', tags: ['LifeSteal'] },
  { id: 'boots', label: 'Boots', icon: 'footprints', tags: ['Boots'] },
  { id: 'jungle', label: 'Jungle', icon: 'zap', tags: ['Jungle'] },
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
  imports: [ZardButtonComponent, ZardIconComponent, ZardInputDirective, ItemSlotComponent, CdkTrapFocus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-picker-modal.component.html',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class ItemPickerModalComponent implements OnInit {
  protected readonly ddragon = inject(DdragonService);

  readonly slotIndex = input.required<number>();
  readonly initialItems = input.required<(Item | null)[]>();

  readonly closed = output<(Item | null)[]>();

  protected readonly categories = ITEM_CATEGORIES;

  protected readonly activeSlotIndex = signal(0);
  protected readonly localItems = signal<(Item | null)[]>([null, null, null, null, null, null]);
  protected readonly previewedItem = signal<Item | null>(null);
  protected readonly searchText = signal('');
  protected readonly activeFilter = signal('all');

  protected readonly filteredItems = computed(() => {
    let items = this.ddragon.items();
    const search = this.searchText().toLowerCase().trim();
    if (search) {
      items = items.filter(i => i.name.toLowerCase().includes(search));
    }
    const filterId = this.activeFilter();
    if (filterId !== 'all') {
      const category = ITEM_CATEGORIES.find(c => c.id === filterId);
      if (category) {
        items = items.filter(i => i.tags.some(t => category.tags.includes(t)));
      }
    }
    return items;
  });

  protected readonly previewedComponents = computed((): Item[] => {
    const item = this.previewedItem();
    if (!item?.from?.length) return [];
    const byId = this.ddragon.rawItemsById();
    return item.from.map(id => byId.get(id)).filter((i): i is Item => i !== undefined);
  });

  protected readonly parentSuggestions = computed((): Item[] => {
    const item = this.previewedItem();
    if (!item?.into?.length) return [];
    const byId = this.ddragon.rawItemsById();
    return item.into.map(id => byId.get(id)).filter((i): i is Item => i !== undefined);
  });

  protected readonly previewedStats = computed((): string[] => {
    const item = this.previewedItem();
    if (!item) return [];
    return Object.entries(item.stats)
      .filter(([, value]) => value !== undefined && value > 0)
      .map(([key, value]) => {
        const meta = STAT_LABELS[key];
        if (!meta) return null;
        const formatted = meta.percent
          ? `${Math.round((value ?? 0) * 100)}%`
          : `${value}`;
        return `+${formatted} ${meta.name}`;
      })
      .filter((s): s is string => s !== null);
  });

  async ngOnInit(): Promise<void> {
    this.activeSlotIndex.set(this.slotIndex());
    this.localItems.set([...this.initialItems()]);
    await this.ddragon.loadItems();
  }

  protected setActiveSlot(index: number): void {
    this.activeSlotIndex.set(index);
  }

  protected clearSlot(index: number): void {
    this.localItems.update(items => {
      const next = [...items];
      next[index] = null;
      return next;
    });
  }

  protected setFilter(filterId: string): void {
    this.activeFilter.set(filterId);
    this.searchText.set('');
  }

  protected onSearchInput(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
    this.activeFilter.set('all');
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
    this.localItems.update(items => {
      const next = [...items];
      next[index] = item;
      return next;
    });
    const nextEmpty = this.localItems().findIndex(i => i === null);
    if (nextEmpty !== -1) {
      this.activeSlotIndex.set(nextEmpty);
    }
  }

  protected close(): void {
    this.closed.emit(this.localItems());
  }
}
