/** Brick · 关卡 defs（供 level.js / 选关接入） */
export const LEVEL_CATALOG = [
  { id: 'L01', nameZh: '沙漠地图', nameEn: 'Desert', theme: 'desert' },
  { id: 'L02', nameZh: '阿伦戴尔', nameEn: 'Arendelle', theme: 'arendelle' },
];

export const THEME_COLORS = {
  desert: [0xf39c12, 0xe67e22, 0xd35400, 0xc0392b, 0xe74c3c, 0xf5b041, 0xdc7633],
  arendelle: [0x5dade2, 0xaed6f1, 0xe67e22, 0xf5d76e, 0x85929e, 0xd6eaf8, 0xc0392b],
};

/** L02 阿伦戴尔：码头街 → 雪镇 → 冰湖城堡；kind 供换色 */
export const ARENDELLE_DEFS = [
  {
    "z": 0,
    "x": 0,
    "y": 0,
    "w": 8,
    "d": 10,
    "kind": "wood"
  },
  {
    "z": 12,
    "x": 0,
    "y": 0,
    "w": 6,
    "d": 8,
    "kind": "wood"
  },
  {
    "z": 22,
    "x": 1.2,
    "y": 0.2,
    "w": 5,
    "d": 6,
    "kind": "snow"
  },
  {
    "z": 30,
    "x": 0,
    "y": 0.4,
    "w": 4.5,
    "d": 6,
    "kind": "wood",
    "checkpoint": true
  },
  {
    "z": 38,
    "x": -1,
    "y": 0.5,
    "w": 4.5,
    "d": 5,
    "kind": "snow"
  },
  {
    "z": 45,
    "x": 1.5,
    "y": 0.6,
    "w": 4,
    "d": 5,
    "kind": "ice"
  },
  {
    "z": 52,
    "x": -1.5,
    "y": 1.0,
    "w": 3.8,
    "d": 4,
    "kind": "snow"
  },
  {
    "z": 60,
    "x": 0,
    "y": 0.8,
    "w": 6,
    "d": 5,
    "kind": "snow",
    "checkpoint": true
  },
  {
    "z": 68,
    "x": 0,
    "y": 1.0,
    "w": 4,
    "d": 4,
    "kind": "ice"
  },
  {
    "z": 74,
    "x": 0,
    "y": 1.2,
    "w": 5,
    "d": 4,
    "kind": "snow"
  },
  {
    "z": 80,
    "x": 2,
    "y": 1.4,
    "w": 3.5,
    "d": 4,
    "kind": "ice"
  },
  {
    "z": 87,
    "x": -1,
    "y": 1.6,
    "w": 4,
    "d": 4,
    "kind": "wood"
  },
  {
    "z": 95,
    "x": 0,
    "y": 2.0,
    "w": 3.2,
    "d": 4,
    "kind": "ice"
  },
  {
    "z": 102,
    "x": 0,
    "y": 2.2,
    "w": 6,
    "d": 5,
    "kind": "snow",
    "checkpoint": true
  },
  {
    "z": 110,
    "x": 0,
    "y": 2.4,
    "w": 5,
    "d": 5,
    "kind": "snow"
  },
  {
    "z": 118,
    "x": 0,
    "y": 2.2,
    "w": 8,
    "d": 6,
    "kind": "ice",
    "finish": true
  }
];
