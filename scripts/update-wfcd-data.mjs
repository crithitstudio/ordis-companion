/**
 * Update script for WFCD translation data.
 * Run: node scripts/update-wfcd-data.mjs
 * 
 * Downloads the latest translation data from WFCD GitHub repositories.
 * Prefer official Warframe API localization when available.
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'src', 'data');

const SOURCES = {
  sortieData: 'https://raw.githubusercontent.com/WFCD/warframe-worldstate-data/master/data/sortieData.json',
  languages: 'https://raw.githubusercontent.com/WFCD/warframe-worldstate-data/master/data/languages.json',
  missionTypes: 'https://raw.githubusercontent.com/WFCD/warframe-worldstate-data/master/data/missionTypes.json',
  itemsAll: 'https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/All.json'
};

async function downloadJSON(url, name) {
  console.log('Downloading ' + name + '...');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed: ' + res.status);
  return res.json();
}

async function main() {
  console.log('Updating WFCD translation data...');

  // Download sortieData
  const sortieData = await downloadJSON(SOURCES.sortieData, 'sortieData');
  writeFileSync(join(DATA_DIR, 'sortieData.json'), JSON.stringify(sortieData, null, 2));
  console.log('Saved sortieData.json');

  // Download languages
  const languages = await downloadJSON(SOURCES.languages, 'languages');
  writeFileSync(join(DATA_DIR, 'languages.json'), JSON.stringify(languages, null, 2));
  console.log('Saved languages.json');

  // Download missionTypes
  const missionTypes = await downloadJSON(SOURCES.missionTypes, 'missionTypes');
  writeFileSync(join(DATA_DIR, 'missionTypes.json'), JSON.stringify(missionTypes, null, 2));
  console.log('Saved missionTypes.json');

  // Download full items data
  console.log('Downloading items (this may take a while)...');
  const items = await downloadJSON(SOURCES.itemsAll, 'warframe-items All.json');

  // Extract itemNames (uniqueName → name mapping)
  const itemNames = {};
  for (const item of items) {
    if (item.uniqueName && item.name) {
      itemNames[item.uniqueName] = item.name;
    }
    if (item.components) {
      for (const comp of item.components) {
        if (comp.uniqueName && comp.name) {
          itemNames[comp.uniqueName] = comp.name;
        }
      }
    }
  }
  writeFileSync(join(DATA_DIR, 'itemNames.json'), JSON.stringify(itemNames));
  console.log('Saved itemNames.json (' + Object.keys(itemNames).length + ' items)');

  // Extract detailed item data (for item details modal)
  // Only include essential fields to keep file size reasonable
  const itemsData = {};
  for (const item of items) {
    if (!item.uniqueName || !item.name) continue;

    const itemData = {
      uniqueName: item.uniqueName,
      name: item.name,
      type: item.type || 'Unknown',
      category: item.category || item.productCategory || 'Unknown',
      description: item.description || '',
      wikiaUrl: item.wikiaUrl || null,
      imageName: item.imageName || null,
      tradable: item.tradable || false,
      masteryReq: item.masteryReq || 0,
      buildPrice: item.buildPrice || null,
      buildTime: item.buildTime || null,
      skipBuildTimePrice: item.skipBuildTimePrice || null,
    };

    // Add components/crafting requirements
    if (item.components && item.components.length > 0) {
      itemData.components = item.components.map(c => ({
        name: c.name,
        count: c.itemCount || 1,
        uniqueName: c.uniqueName,
        imageName: c.imageName
      }));
    }

    // Add drop locations
    if (item.drops && item.drops.length > 0) {
      itemData.drops = item.drops.slice(0, 10).map(d => ({
        location: d.location,
        type: d.type,
        chance: d.chance,
        rarity: d.rarity
      }));
    }

    itemsData[item.uniqueName] = itemData;
  }

  writeFileSync(join(DATA_DIR, 'itemsData.json'), JSON.stringify(itemsData));
  console.log('Saved itemsData.json (' + Object.keys(itemsData).length + ' items with details)');

  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });

