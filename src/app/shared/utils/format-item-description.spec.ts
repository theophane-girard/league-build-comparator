import { describe, it, expect } from 'vitest';
import { formatMerakiEffects, formatItemDescription } from './format-item-description';
import type { Item } from '@/features/build-calculator/models/item.model';

const makeItem = (overrides: Partial<Item> = {}): Item => ({
  id: '1',
  name: 'Test Item',
  description: '',
  plaintext: '',
  image: { full: '', sprite: '', group: '', x: 0, y: 0, w: 0, h: 0 },
  gold: { base: 0, purchasable: true, total: 0, sell: 0 },
  tags: [],
  stats: {},
  ...overrides,
});

// ---------------------------------------------------------------------------
// formatMerakiEffects
// ---------------------------------------------------------------------------
describe('formatMerakiEffects', () => {
  it('replaces {{fd|X}} with the plain number', () => {
    expect(formatMerakiEffects('Cooldown: {{fd|60}} seconds')).toContain('60');
    expect(formatMerakiEffects('Cooldown: {{fd|60}} seconds')).not.toContain('{{fd|');
  });

  it('renders {{as|X% AP}} with colored span', () => {
    const result = formatMerakiEffects('deals {{as|80% AP}} damage');
    expect(result).toContain('80%');
    expect(result).toContain('AP');
    expect(result).toContain('color:');
  });

  it('renders {{as|X% bonus AD}} with AD color', () => {
    const result = formatMerakiEffects('{{as|100% bonus AD}}');
    expect(result).toContain('100%');
    expect(result).toContain('#c86c37'); // AD color
  });

  it('strips {{tt|...}} tooltip templates, keeping first arg', () => {
    const result = formatMerakiEffects('{{tt|most wounded|Lowest health percent}} enemy');
    expect(result).toContain('most wounded');
    expect(result).not.toContain('{{tt|');
  });

  it('strips {{pp|...}} and other nested templates', () => {
    const result = formatMerakiEffects('deals {{pp|100 to 300|1;8}} damage');
    expect(result).not.toContain('{{pp|');
    expect(result).not.toContain('{{');
  });

  it('converts wiki bold markers to <strong>', () => {
    const result = formatMerakiEffects("'''bonus''' AD");
    expect(result).toContain('<strong>bonus</strong>');
  });

  it('strips [[wiki links]] keeping display text', () => {
    const result = formatMerakiEffects('[[Dash|dashes]] to target');
    expect(result).toContain('dashes');
    expect(result).not.toContain('[[');
  });

  it('returns plain text unchanged when no templates', () => {
    const text = 'Deals damage to nearby enemies.';
    expect(formatMerakiEffects(text)).toBe(text);
  });
});

// ---------------------------------------------------------------------------
// formatItemDescription
// ---------------------------------------------------------------------------
describe('formatItemDescription', () => {
  it('strips <mainText> wrapper tags', () => {
    const result = formatItemDescription('<mainText>Hello</mainText>');
    expect(result).not.toContain('<mainText>');
    expect(result).toContain('Hello');
  });

  it('colorizes <stats> section', () => {
    const raw = '<mainText><stats><attention>+50</attention> Armor<br></stats></mainText>';
    const result = formatItemDescription(raw);
    expect(result).toContain('color:');
    expect(result).toContain('50');
    expect(result).toContain('Armor');
  });

  it('renders <passive> tag with italic gold color', () => {
    const result = formatItemDescription('<passive>Passive</passive>: effect');
    expect(result).toContain('font-style:italic');
    expect(result).toContain('color:#c8aa6e');
  });

  it('renders <active> tag with italic gold color', () => {
    const result = formatItemDescription('<active>Active</active>: effect');
    expect(result).toContain('font-style:italic');
  });

  it('renders <physicalDamage> tag with orange color', () => {
    const result = formatItemDescription('<physicalDamage>100</physicalDamage>');
    expect(result).toContain('#c86c37');
  });

  it('renders <magicDamage> tag with blue color', () => {
    const result = formatItemDescription('<magicDamage>100</magicDamage>');
    expect(result).toContain('#7ec4e4');
  });

  it('collapses multiple consecutive <br> into one', () => {
    const result = formatItemDescription('A<br><br><br>B');
    const brCount = (result.match(/<br>/gi) ?? []).length;
    expect(brCount).toBe(1);
  });

  it('strips unknown DDragon tags', () => {
    const result = formatItemDescription('<unknownTag>content</unknownTag>');
    expect(result).not.toContain('<unknownTag>');
    expect(result).toContain('content');
  });

  it('appends Meraki active effects section when item has activeEffects', () => {
    const item = makeItem({
      activeEffects: [{
        name: 'Cloudburst',
        effects: 'deals {{as|80% bonus AD}} damage',
        cooldown: 60,
        ratios: [{ coeff: 0.8, stat: 'bonusAD' }],
      }],
    });
    const result = formatItemDescription('<mainText>Stats</mainText>', item);
    expect(result).toContain('Cloudburst');
  });

  it('appends Meraki passive effects section when item has passiveEffects', () => {
    const item = makeItem({
      passiveEffects: [{
        name: 'Spellblade',
        effects: 'deals {{as|150% base AD}}',
        unique: true,
        ratios: [{ coeff: 1.5, stat: 'baseAD' }],
        procCooldown: 1.5,
      }],
    });
    const result = formatItemDescription('<mainText>Stats</mainText>', item);
    expect(result).toContain('Spellblade');
  });

  it('works without an item argument', () => {
    expect(() => formatItemDescription('<mainText>Hello</mainText>')).not.toThrow();
  });
});
