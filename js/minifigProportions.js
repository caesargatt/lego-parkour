/** Pix · 罗布 R6 方块人（与 js/player.js 一致，脚底 pivot） */
export const MINIFIG = {
  style: 'roblox-r6',
  height: 1.95,
  leg: { w: 0.34, h: 0.65, d: 0.34, x: 0.2, y: 0.325 },
  hip: { w: 0.86, h: 0.14, d: 0.44, y: 0.7 },
  torso: { w: 0.86, h: 0.62, d: 0.44, y: 1.08 },
  arm: { w: 0.3, h: 0.62, d: 0.3, x: 0.58, y: 1.08 },
  hand: { w: 0.32, h: 0.28, d: 0.32, x: 0.58, y: 0.68 },
  head: { w: 0.7, h: 0.7, d: 0.7, y: 1.82 },
  hair: { w: 0.74, h: 0.16, d: 0.74, y: 2.22 },
};

export const DEFAULT_MAT = { roughness: 0.72, metalness: 0.04 };
export const GLOSSY_MAT = { roughness: 0.22, metalness: 0.78 };
