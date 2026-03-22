const STANDARD_TAGS = /^(br|span|div|p|b|i|strong|em)$/i;

export function formatItemDescription(raw: string): string {
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
