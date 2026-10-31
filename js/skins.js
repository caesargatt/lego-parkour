/** Locked skin contract (COO): classic / red_brick / blue_knight / gold_chrome / neon.
 *  Prices stay 0 / 35 / 80 / 150 / 220. Do not rename those ids.
 *  elsa is an extra shop skin at exactly 180 (between gold_chrome and neon).
 *  Pix can recolor / reshape Elsa by editing the `elsa` object only.
 *  player.js reads those params when `figure === 'elsa'`.
 *
 *  Braid: character left is local -X (same side as leftArm). This rig's left arm
 *  outer face is about x=-0.73, so |x|=0.62 would sit inside the arm. braidX
 *  defaults further out so the chain clears the arm, including during the swing.
 */
export const SKINS = [
  {
    id: 'classic',
    name: '经典',
    price: 0,
    // yellow torso + blue pants (Pix)
    torso: 0xf5cd30,
    legs: 0x0a70d6,
    arms: 0xf5cd30,
    hands: 0xf5cd30,
    head: 0xf5cd30,
    hair: 0xd4a017,
    accent: 0xffffff,
    metalness: 0.05,
    roughness: 0.7,
  },
  {
    id: 'red_brick',
    name: '红砖',
    price: 35,
    torso: 0xc0392b,
    legs: 0x1a1a1a,
    arms: 0xe74c3c,
    hands: 0xf5cd30,
    head: 0xf5cd30,
    hair: 0x1a1a1a,
    accent: 0xffeb3b,
    metalness: 0.1,
    roughness: 0.65,
  },
  {
    id: 'blue_knight',
    name: '蓝骑士',
    price: 80,
    torso: 0x1a5276,
    legs: 0x154360,
    arms: 0x3498db,
    hands: 0xf5cd30,
    head: 0xf5cd30,
    hair: 0xecf0f1,
    accent: 0x1abc9c,
    metalness: 0.25,
    roughness: 0.45,
  },
  {
    id: 'gold_chrome',
    name: '镀金',
    price: 150,
    torso: 0xd4af37,
    legs: 0xb8860b,
    arms: 0xffd700,
    hands: 0xffec8b,
    head: 0xffec8b,
    hair: 0xb8860b,
    accent: 0xfff8dc,
    metalness: 0.85,
    roughness: 0.2,
  },
  {
    id: 'elsa',
    name: '艾莎女王',
    price: 180,
    // Shop swatch + standard body slots. Warm skin, ice dress, platinum hair.
    torso: 0x6fc0ea,
    legs: 0x4fa3d9,
    arms: 0xbfe6fa,
    hands: 0xfce3d2,
    head: 0xfce3d2,
    hair: 0xf3e7c4,
    accent: 0xe7f6ff,
    metalness: 0.12,
    roughness: 0.55,
    figure: 'elsa',
    elsa: {
      // Pix palette. player.js builds the gown / cape / braid / quiff from these.
      skin: 0xfce3d2,
      hair: 0xf3e7c4,
      torso: 0x6fc0ea,
      arms: 0xbfe6fa,
      gownTop: 0x4fa3d9,
      gownHem: 0x9fd8f2,
      cape: 0xbfe6fa,
      capeOpacity: 0.45,
      eyeshadow: 0xd7b4e8,
      snowflake: 0xf4fbff,
      bodiceMetalness: 0.62,
      bodiceRoughness: 0.28,
      bodiceEmissive: 0x7ec8ea,
      bodiceEmissiveIntensity: 0.2,
      gownMetalness: 0.4,
      gownRoughness: 0.32,
      gownEmissiveIntensity: 0.14,
      // Left-side chain in minifig root space (feet at y=0). Visual only.
      // |x|≈0.62 would intersect this rig's left arm (outer face ≈ -0.73).
      braidX: -0.86,
      braidZ: 0.05,
      braidTopY: 2.1,
      braidBotY: 1.2,
      braidBlocks: 5,
      braidSize: 0.11,
      braidSway: 0.16,
      quiffTilt: 0.55,
      quiffZ: -0.2,
      capeWidth: 1.05,
      capeHeight: 1.15,
    },
  },
  {
    id: 'neon',
    name: '霓虹',
    price: 220,
    torso: 0x39ff14,
    legs: 0x1a1a2e,
    arms: 0xff00aa,
    hands: 0xf5cd30,
    head: 0xf5cd30,
    hair: 0x9b59b6,
    accent: 0x00ffff,
    metalness: 0.35,
    roughness: 0.35,
    emissive: 0x39ff14,
    emissiveIntensity: 0.25,
  },
];

export function getSkin(id) {
  return SKINS.find((s) => s.id === id) || SKINS[0];
}
