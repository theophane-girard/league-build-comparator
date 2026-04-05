import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

const ITEMS_URL = 'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/items.json';
const CHAMPIONS_URL = 'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  console.log('[fetch-meraki] Downloading Meraki data...');
  mkdirSync(PUBLIC, { recursive: true });

  const [items, champions] = await Promise.all([
    fetchJson(ITEMS_URL),
    fetchJson(CHAMPIONS_URL),
  ]);

  writeFileSync(join(PUBLIC, 'meraki-items.json'), JSON.stringify(items));
  console.log(`[fetch-meraki] Saved ${Object.keys(items).length} items to public/meraki-items.json`);

  writeFileSync(join(PUBLIC, 'meraki-champions.json'), JSON.stringify(champions));
  console.log(`[fetch-meraki] Saved ${Object.keys(champions).length} champions to public/meraki-champions.json`);
}

main().catch((err) => {
  console.error('[fetch-meraki] Failed:', err.message);
  process.exit(1);
});
