import type { Item, ParsedEffectRatio } from '@/features/build-calculator/models/item.model';

const STANDARD_TAGS = /^(br|span|div|p|b|i|strong|em)$/i;

const RATIO_STAT_COLORS: Record<ParsedEffectRatio['stat'], string> = {
  AD:          '#c86c37',
  baseAD:      '#c86c37',
  bonusAD:     '#c86c37',
  AP:          '#9e6fce',
  armor:       '#c89b3c',
  magicResist: '#7ec4e4',
  maxHP:       '#71c56d',
};

// Ordered from most-specific to least-specific to avoid wrong matches
const STAT_LINE_COLORS: Array<[RegExp, string]> = [
  [/ability power/i,                  '#9e6fce'],  // AP — purple
  [/attack damage/i,                  '#c86c37'],  // AD — orange
  [/health regen/i,                   '#71c56d'],  // HP regen — green
  [/mana regen/i,                     '#4a9eff'],  // Mana regen — blue
  [/health|max hp/i,                  '#71c56d'],  // HP — green
  [/mana|max mp/i,                    '#4a9eff'],  // Mana — blue
  [/armor/i,                          '#c89b3c'],  // Armor — gold
  [/magic resist/i,                   '#7ec4e4'],  // MR — light blue
  [/attack speed/i,                   '#f0e68c'],  // Attack Speed — light yellow
  [/movement speed/i,                 '#71c56d'],  // Move Speed — green
  [/crit(?:ical)?(?:\s+(?:chance|strike))?/i, '#f4d03f'], // Crit — yellow
  [/omnivamp|life steal/i,            '#ff6161'],  // Lifesteal/Omnivamp — red
  [/ability haste/i,                  '#87ceeb'],  // AH — sky blue
  [/lethality|armor pen(?:etration)?/i, '#c86c37'], // Lethality — orange
  [/magic pen(?:etration)?/i,         '#9e6fce'],  // Magic pen — purple
];

function getStatColor(statName: string): string {
  for (const [pattern, color] of STAT_LINE_COLORS) {
    if (pattern.test(statName)) return color;
  }
  return '#c89b3c';
}

function colorizeStatLine(line: string): string {
  const nameMatch = line.match(/<\/attention>\s*([\s\S]*?)$/i);
  const statName = nameMatch ? nameMatch[1].trim() : line;
  const color = getStatColor(statName);
  const processedLine = line
    .replace(/<attention>([\s\S]*?)<\/attention>/gi,
      `<span style="color:${color};font-weight:700">$1</span>`)
    .replace(/<\/?attention>/gi, '');
  return `<span style="color:${color}">${processedLine}</span>`;
}

function colorizeStatsSection(raw: string): string {
  return raw
    .split(/<br\s*\/?>/i)
    .filter(l => l.trim())
    .map(colorizeStatLine)
    .join('<br>');
}

function statColor(rawDesc: string): string {
  const desc = rawDesc
    .replace(/'{3}/g, '')
    .replace(/\[\[.*?\]\]/g, '')
    .toLowerCase()
    .trim();
  if (desc === 'ap' || desc.includes(' ap') || desc.includes('ability power')) return RATIO_STAT_COLORS['AP'];
  if (desc.includes('base') && (desc.includes(' ad') || desc.includes('attack damage'))) return RATIO_STAT_COLORS['baseAD'];
  if (desc.includes('bonus') && (desc.includes(' ad') || desc.includes('attack damage'))) return RATIO_STAT_COLORS['bonusAD'];
  if (desc.includes('armor') && !desc.includes('penetration')) return RATIO_STAT_COLORS['armor'];
  if (desc.includes('magic resist') || desc === 'mr') return RATIO_STAT_COLORS['magicResist'];
  if ((desc.includes('max') || desc.includes('maximum')) && (desc.includes('health') || desc.includes('hp'))) return RATIO_STAT_COLORS['maxHP'];
  if (desc === 'ad' || desc.includes(' ad') || desc.includes('attack damage')) return RATIO_STAT_COLORS['AD'];
  return '#c89b3c';
}

/**
 * Formats Meraki wiki-markup effects text into HTML.
 * Handles nested templates, {{as|(+X% stat)}} and {{as|X% stat}} patterns.
 */
export function formatMerakiEffects(text: string): string {
  // Step 1: Replace simple substitution templates
  let result = text
    .replace(/\{\{fd\|(\d+(?:\.\d+)?)\}\}/g, '$1')
    .replace(/\{\{(?:tt|tip)\|([^|{}]*)[^{}]*\}\}/gi, '$1');

  // Step 2: Iteratively strip non-{{as|}} nested templates (handles {{pp|...}} etc.)
  let prev: string;
  do {
    prev = result;
    result = result.replace(/\{\{(?!as\|)[^{}]*\}\}/gi, '');
  } while (result !== prev);

  // Step 3: Process {{as|(+X% stat)}} and {{as|X% stat}} patterns
  result = result.replace(
    /\{\{as\|\(?[+]?\s*(\d+(?:\.\d+)?)%\s*(.*?)(?:\s*\))?(?:\|[^}]*)?\}\}/gi,
    (_, pct, rawDesc) => {
      const cleanDesc = rawDesc
        .replace(/'{3}/g, '')
        .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
        .trim();
      const color = statColor(cleanDesc);
      return `<span style="color:${color};font-weight:600">${pct}% ${cleanDesc}</span>`;
    }
  );

  // Step 4: Strip remaining label-only {{as|...}} and leftover {{ }}
  result = result
    .replace(/\{\{as\|[^{}]*\}\}/gi, '')
    .replace(/\{\{|\}\}/g, '');

  // Step 5: Wiki markup
  return result
    .replace(/'{3}(.*?)'{3}/g, '<strong>$1</strong>')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1');
}

function buildEffectsSection(item: Item): string {
  const parts: string[] = [];

  for (const eff of item.activeEffects ?? []) {
    if (!eff.effects) continue;
    parts.push(
      `<div style="margin-top:.4rem">`
      + `<span style="color:#c8aa6e;font-style:italic;font-weight:600">${eff.name || 'Active'}: </span>`
      + formatMerakiEffects(eff.effects)
      + `</div>`
    );
  }

  for (const eff of item.passiveEffects ?? []) {
    if (!eff.effects) continue;
    parts.push(
      `<div style="margin-top:.4rem">`
      + `<span style="color:#c8aa6e;font-style:italic;font-weight:600">${eff.name || 'Passive'}: </span>`
      + formatMerakiEffects(eff.effects)
      + `</div>`
    );
  }

  if (!parts.length) return '';
  return `<div style="margin-top:.2rem;border-top:1px solid rgba(255,255,255,.12);padding-top:.3rem">${parts.join('')}</div>`;
}

export function formatItemDescription(raw: string, item?: Item): string {
  // Strip DDragon active/passive descriptions that duplicate the Meraki effects section
  let rawToProcess = raw;
  if (item?.activeEffects?.length) {
    rawToProcess = rawToProcess.replace(
      /<active>[\s\S]*?<\/active>[\s\S]*?(?=<active>|<passive>|<\/mainText>|$)/gi, ''
    );
  }
  if (item?.passiveEffects?.length) {
    rawToProcess = rawToProcess.replace(
      /<passive>[\s\S]*?<\/passive>[\s\S]*?(?=<active>|<passive>|<\/mainText>|$)/gi, ''
    );
  }

  const base = rawToProcess
    .replace(/<\/?mainText>/g, '')
    .replace(/<stats>([\s\S]*?)<\/stats>/g,
      (_, content) => `<div style="margin-bottom:.5rem">${colorizeStatsSection(content)}</div>`)
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
    )
    // Collapse 2+ consecutive <br> (with optional whitespace between) into one
    .replace(/(<br\s*\/?>(\s|&nbsp;)*){2,}/gi, '<br>');

  const effectsSection = item ? buildEffectsSection(item) : '';
  const trimmedBase = effectsSection ? base.replace(/(<br\s*\/?>|\s)+$/gi, '') : base;
  return trimmedBase + effectsSection;
}
