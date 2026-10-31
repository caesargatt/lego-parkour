const STORAGE_KEY = 'lego-parkour-v1';

const LEGACY_MAP = {
  free_classic: 'classic',
  skin_red_racer: 'red_brick',
  skin_blue_pilot: 'blue_knight',
  skin_gold_hero: 'gold_chrome',
};

const DEFAULT = {
  coins: 0,
  unlockedSkins: ['classic'],
  equippedSkin: 'classic',
};

function mapId(id) {
  const s = String(id || 'classic');
  return LEGACY_MAP[s] || s;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT, unlockedSkins: [...DEFAULT.unlockedSkins] };
    const data = JSON.parse(raw);
    const unlocked = Array.isArray(data.unlockedSkins) && data.unlockedSkins.length
      ? [...new Set(['classic', ...data.unlockedSkins.map(mapId)])]
      : ['classic'];
    let equipped = mapId(data.equippedSkin || 'classic');
    if (!unlocked.includes(equipped)) equipped = 'classic';
    return {
      coins: Math.max(0, Math.floor(Number(data.coins) || 0)),
      unlockedSkins: unlocked,
      equippedSkin: equipped,
    };
  } catch {
    return { ...DEFAULT, unlockedSkins: [...DEFAULT.unlockedSkins] };
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    coins: Math.max(0, Math.floor(Number(state.coins) || 0)),
    unlockedSkins: state.unlockedSkins,
    equippedSkin: state.equippedSkin,
  }));
}

export { STORAGE_KEY, DEFAULT };
