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
  clearedLevels: [],
  bestCoins: {},
};

function mapId(id) {
  const s = String(id || 'classic');
  return LEGACY_MAP[s] || s;
}

function blankSave() {
  return {
    coins: 0,
    unlockedSkins: ['classic'],
    equippedSkin: 'classic',
    clearedLevels: [],
    bestCoins: {},
  };
}

function asRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function sanitizeCoins(value) {
  const n = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function sanitizeUnlocked(value) {
  if (!Array.isArray(value)) return ['classic'];
  const ids = [];
  for (const item of value) {
    if (typeof item !== 'string' && typeof item !== 'number') continue;
    const id = mapId(item);
    if (!id) continue;
    ids.push(id);
  }
  if (!ids.length) return ['classic'];
  return [...new Set(['classic', ...ids])];
}

function sanitizeEquipped(value, unlocked) {
  const raw = typeof value === 'string' || typeof value === 'number' ? value : 'classic';
  const equipped = mapId(raw);
  if (!unlocked.includes(equipped)) return 'classic';
  return equipped;
}

function sanitizeLevelId(id) {
  if (typeof id !== 'string') return '';
  const s = id.trim();
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(s)) return '';
  return s;
}

function sanitizeCleared(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    const id = sanitizeLevelId(item);
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

function sanitizeBestCoins(value) {
  const src = asRecord(value);
  const out = Object.create(null);
  for (const key of Object.keys(src)) {
    const id = sanitizeLevelId(key);
    if (!id) continue;
    const n = typeof src[key] === 'number' || typeof src[key] === 'string' ? Number(src[key]) : NaN;
    if (!Number.isFinite(n)) continue;
    out[id] = Math.max(0, Math.floor(n));
  }
  return out;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankSave();
    const parsed = JSON.parse(raw);
    const data = asRecord(parsed);
    const unlocked = sanitizeUnlocked(data.unlockedSkins);
    return {
      coins: sanitizeCoins(data.coins),
      unlockedSkins: unlocked,
      equippedSkin: sanitizeEquipped(data.equippedSkin, unlocked),
      clearedLevels: sanitizeCleared(data.clearedLevels),
      bestCoins: sanitizeBestCoins(data.bestCoins),
    };
  } catch {
    return blankSave();
  }
}

export function saveState(state) {
  const src = asRecord(state);
  const unlocked = sanitizeUnlocked(src.unlockedSkins);
  const payload = {
    coins: sanitizeCoins(src.coins),
    unlockedSkins: unlocked,
    equippedSkin: sanitizeEquipped(src.equippedSkin, unlocked),
    clearedLevels: sanitizeCleared(src.clearedLevels),
    bestCoins: sanitizeBestCoins(src.bestCoins),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export { STORAGE_KEY, DEFAULT, LEGACY_MAP };
