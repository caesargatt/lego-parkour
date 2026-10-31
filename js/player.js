import * as THREE from './vendor/three.module.js';
import { getSkin } from './skins.js';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: opts.metalness ?? 0.08,
    roughness: opts.roughness ?? 0.65,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

/**
 * 罗布乐思（Roblox）R6 方块人：大方头 + 方块四肢。
 * 脚底 pivot；视觉总高约 1.95，对齐 physics PLAYER_HEIGHT≈1.9。
 */
export function createMinifigure(skinId = 'classic') {
  const skin = getSkin(skinId);
  const root = new THREE.Group();
  root.name = 'player';
  const parts = {};

  // Legs
  const legGeo = new THREE.BoxGeometry(0.34, 0.65, 0.34);
  const leftLeg = new THREE.Mesh(legGeo, mat(skin.legs, skin));
  leftLeg.position.set(-0.2, 0.325, 0);
  leftLeg.castShadow = true;
  const rightLeg = new THREE.Mesh(legGeo, mat(skin.legs, skin));
  rightLeg.position.set(0.2, 0.325, 0);
  rightLeg.castShadow = true;
  root.add(leftLeg, rightLeg);
  parts.leftLeg = leftLeg;
  parts.rightLeg = rightLeg;

  // Hip band (reads as pant waist)
  const hip = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.14, 0.44),
    mat(skin.legs, skin)
  );
  hip.position.set(0, 0.7, 0);
  hip.castShadow = true;
  root.add(hip);
  parts.hip = hip;

  // Torso — wide block
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.62, 0.44),
    mat(skin.torso, skin)
  );
  torso.position.set(0, 1.08, 0);
  torso.castShadow = true;
  root.add(torso);
  parts.torso = torso;

  // Shirt print / accent
  const print = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.36, 0.06),
    mat(skin.accent, { ...skin, metalness: (skin.metalness || 0) + 0.08 })
  );
  print.position.set(0, 1.1, 0.24);
  root.add(print);
  parts.print = print;

  // Arms
  const armGeo = new THREE.BoxGeometry(0.3, 0.62, 0.3);
  const leftArm = new THREE.Mesh(armGeo, mat(skin.arms, skin));
  leftArm.position.set(-0.58, 1.08, 0);
  leftArm.castShadow = true;
  const rightArm = new THREE.Mesh(armGeo, mat(skin.arms, skin));
  rightArm.position.set(0.58, 1.08, 0);
  rightArm.castShadow = true;
  root.add(leftArm, rightArm);
  parts.leftArm = leftArm;
  parts.rightArm = rightArm;

  // Block hands
  const handGeo = new THREE.BoxGeometry(0.32, 0.28, 0.32);
  const leftHand = new THREE.Mesh(handGeo, mat(skin.hands, skin));
  leftHand.position.set(-0.58, 0.68, 0);
  leftHand.castShadow = true;
  const rightHand = new THREE.Mesh(handGeo, mat(skin.hands, skin));
  rightHand.position.set(0.58, 0.68, 0);
  rightHand.castShadow = true;
  root.add(leftHand, rightHand);
  parts.leftHand = leftHand;
  parts.rightHand = rightHand;

  // Neck stub (hidden under head)
  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.1, 0.28),
    mat(skin.head, skin)
  );
  neck.position.set(0, 1.42, 0);
  root.add(neck);
  parts.neck = neck;

  // Big cubic head — Roblox signature
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    mat(skin.head, skin)
  );
  head.position.set(0, 1.82, 0);
  head.castShadow = true;
  root.add(head);
  parts.head = head;

  // Face: simple black eyes + smile (Roblox-ish)
  const eyeMat = mat(0x1a1a1a, { roughness: 0.95, metalness: 0 });
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), eyeMat);
  eyeL.position.set(-0.14, 1.88, 0.36);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), eyeMat);
  eyeR.position.set(0.14, 1.88, 0.36);
  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), eyeMat);
  smile.position.set(0, 1.68, 0.36);
  root.add(eyeL, eyeR, smile);
  parts.eyeL = eyeL;
  parts.eyeR = eyeR;
  parts.smile = smile;

  // Hair / hat plate on top of cube head
  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(0.74, 0.16, 0.74),
    mat(skin.hair, skin)
  );
  hair.position.set(0, 2.22, 0);
  hair.castShadow = true;
  root.add(hair);
  parts.hair = hair;

  // Tiny top accent (kept for applySkin knob slot)
  const knob = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.08, 0.2),
    mat(skin.hair, skin)
  );
  knob.position.set(0, 2.34, 0);
  root.add(knob);
  parts.knob = knob;

  root.userData.parts = parts;
  root.userData.skinId = skinId;
  root.userData.height = 1.95;
  syncFigure(root, skin);

  return root;
}

export function applySkin(root, skinId) {
  const skin = getSkin(skinId);
  const p = root.userData.parts;
  if (!p) return;

  const assign = (mesh, color, extra = {}) => {
    if (!mesh) return;
    mesh.material.color.setHex(color);
    mesh.material.metalness = skin.metalness ?? 0.08;
    mesh.material.roughness = skin.roughness ?? 0.65;
    if (skin.emissive != null) {
      mesh.material.emissive.setHex(extra.emissive ?? skin.emissive ?? 0);
      mesh.material.emissiveIntensity = extra.emissiveIntensity ?? skin.emissiveIntensity ?? 0;
    } else {
      mesh.material.emissive.setHex(0);
      mesh.material.emissiveIntensity = 0;
    }
  };

  assign(p.torso, skin.torso, { emissive: skin.emissive, emissiveIntensity: skin.emissiveIntensity });
  assign(p.leftArm, skin.arms, { emissive: skin.emissive, emissiveIntensity: (skin.emissiveIntensity || 0) * 0.5 });
  assign(p.rightArm, skin.arms, { emissive: skin.emissive, emissiveIntensity: (skin.emissiveIntensity || 0) * 0.5 });
  assign(p.leftLeg, skin.legs);
  assign(p.rightLeg, skin.legs);
  assign(p.hip, skin.legs);
  assign(p.leftHand, skin.hands);
  assign(p.rightHand, skin.hands);
  assign(p.head, skin.head);
  assign(p.neck, skin.head);
  assign(p.hair, skin.hair);
  assign(p.knob, skin.hair);
  assign(p.print, skin.accent);

  root.userData.skinId = skinId;
  syncFigure(root, skin);
}

export function animateMinifigure(root, moving, grounded, dt, time) {
  const p = root.userData.parts;
  if (!p) return;
  const swing = moving && grounded ? Math.sin(time * 12) * 0.45 : 0;
  const armSwing = moving && grounded ? Math.sin(time * 12) * 0.55 : 0;
  p.leftLeg.rotation.x = swing;
  p.rightLeg.rotation.x = -swing;
  p.leftArm.rotation.x = -armSwing;
  p.rightArm.rotation.x = armSwing;
  if (!grounded) {
    p.leftArm.rotation.x = -0.8;
    p.rightArm.rotation.x = -0.8;
    p.leftLeg.rotation.x = 0.3;
    p.rightLeg.rotation.x = -0.15;
  }
  animateElsa(root, moving, grounded, time);
}

/**
 * Elsa-only geometry. Other skins never take this path.
 * Params live on the skin entry (`skin.elsa`) so colors and braid placement
 * can change without editing this file. Nothing here is part of the hit box:
 * player height stays 1.95 and physics keeps using its own constants.
 */
function elsaConfig(skin) {
  const e = (skin && skin.elsa) || {};
  const num = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
  return {
    hair: e.hair ?? skin.hair ?? 0xf3e7c4,
    gownTop: e.gownTop ?? 0x4fa3d9,
    gownHem: e.gownHem ?? 0x9fd8f2,
    cape: e.cape ?? 0xbfe6fa,
    capeOpacity: num(e.capeOpacity, 0.45),
    eyeshadow: e.eyeshadow ?? 0xd7b4e8,
    snowflake: e.snowflake ?? 0xf4fbff,
    bodiceMetalness: num(e.bodiceMetalness, 0.62),
    bodiceRoughness: num(e.bodiceRoughness, 0.28),
    bodiceEmissive: e.bodiceEmissive ?? 0x7ec8ea,
    bodiceEmissiveIntensity: num(e.bodiceEmissiveIntensity, 0.2),
    gownMetalness: num(e.gownMetalness, 0.4),
    gownRoughness: num(e.gownRoughness, 0.32),
    gownEmissiveIntensity: num(e.gownEmissiveIntensity, 0.14),
    braidX: num(e.braidX, -0.86),
    braidZ: num(e.braidZ, 0.05),
    braidTopY: num(e.braidTopY, 2.1),
    braidBotY: num(e.braidBotY, 1.2),
    braidBlocks: Math.max(4, Math.min(5, Math.floor(num(e.braidBlocks, 5)))),
    braidSize: num(e.braidSize, 0.11),
    braidSway: num(e.braidSway, 0.16),
    quiffTilt: num(e.quiffTilt, 0.55),
    quiffZ: num(e.quiffZ, -0.2),
    capeWidth: num(e.capeWidth, 1.05),
    capeHeight: num(e.capeHeight, 1.15),
  };
}

function disposeTree(obj) {
  const seen = new Set();
  obj.traverse((node) => {
    if (node.geometry && !seen.has(node.geometry)) {
      seen.add(node.geometry);
      node.geometry.dispose();
    }
    const mats = node.material
      ? (Array.isArray(node.material) ? node.material : [node.material])
      : [];
    for (const material of mats) {
      if (material && !seen.has(material)) {
        seen.add(material);
        material.dispose();
      }
    }
  });
}

function clearElsa(root) {
  const group = root.userData.elsaGroup;
  if (!group) return;
  root.remove(group);
  disposeTree(group);
  root.userData.elsaGroup = null;
  root.userData.elsa = null;
}

function makeSequin(color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.09, 0.02),
    new THREE.MeshBasicMaterial({ color })
  );
  mesh.rotation.z = Math.PI / 4;
  return mesh;
}

function buildElsaGroup(skin) {
  const e = elsaConfig(skin);
  const group = new THREE.Group();
  group.name = 'elsa-figure';

  const hairMat = new THREE.MeshStandardMaterial({
    color: e.hair,
    metalness: 0.18,
    roughness: 0.5,
    emissive: e.hair,
    emissiveIntensity: 0.22,
  });
  const gownMat = (color) => new THREE.MeshStandardMaterial({
    color,
    metalness: e.gownMetalness,
    roughness: e.gownRoughness,
    emissive: color,
    emissiveIntensity: e.gownEmissiveIntensity,
  });

  // Swept-back quiff. The default hair plate and top knob stay hidden.
  const crown = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.5), hairMat);
  crown.position.set(0, 2.16, -0.06);
  crown.castShadow = true;
  const sweep = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.46), hairMat);
  sweep.position.set(0, 2.3, e.quiffZ);
  sweep.rotation.x = e.quiffTilt;
  sweep.castShadow = true;
  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.16), hairMat);
  lip.position.set(0, 2.22, 0.12);
  lip.rotation.x = -0.35;
  lip.castShadow = true;
  group.add(crown, sweep, lip);

  // Side braid: vertical chain on the character's left, outside the arm.
  const braid = new THREE.Group();
  braid.name = 'elsa-braid';
  braid.position.set(e.braidX, e.braidTopY, e.braidZ);
  const span = Math.max(0.4, e.braidTopY - e.braidBotY);
  const blockH = (span / e.braidBlocks) * 0.78;
  const blockGeo = new THREE.BoxGeometry(e.braidSize, blockH, e.braidSize);
  for (let i = 0; i < e.braidBlocks; i++) {
    const block = new THREE.Mesh(blockGeo, hairMat);
    block.position.y = -((i + 0.5) * span / e.braidBlocks);
    block.castShadow = true;
    braid.add(block);
  }
  group.add(braid);

  // Two-tone flared gown. Legs stay in the rig but are hidden.
  const upper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.62, 0.5, 6),
    gownMat(e.gownTop)
  );
  upper.position.y = 0.71;
  upper.castShadow = true;
  const lower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.74, 0.46, 6),
    gownMat(e.gownHem)
  );
  lower.position.y = 0.25;
  lower.castShadow = true;
  group.add(upper, lower);
  for (let i = 0; i < 4; i++) {
    const flake = makeSequin(e.snowflake);
    const a = (i / 4) * Math.PI * 2 + 0.4;
    flake.position.set(Math.cos(a) * 0.68, -0.2, Math.sin(a) * 0.68);
    lower.add(flake);
  }

  // Sheer cape, pivoted at the shoulders so the run sway trails backward.
  const capePivot = new THREE.Group();
  capePivot.name = 'elsa-cape';
  capePivot.position.set(0, 1.42, -0.32);
  const cape = new THREE.Mesh(
    new THREE.PlaneGeometry(e.capeWidth, e.capeHeight),
    new THREE.MeshBasicMaterial({
      color: e.cape,
      transparent: true,
      opacity: e.capeOpacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  cape.position.y = -e.capeHeight / 2;
  capePivot.add(cape);
  for (let i = 0; i < 3; i++) {
    const flake = makeSequin(e.snowflake);
    flake.position.set((i - 1) * 0.28, -e.capeHeight * 0.72, -0.02);
    cape.add(flake);
  }
  group.add(capePivot);

  // Light purple eyeshadow. The block eyes and smile stay as they are.
  const shadowMat = mat(e.eyeshadow, { roughness: 0.55, metalness: 0.05 });
  const shadowGeo = new THREE.BoxGeometry(0.16, 0.045, 0.03);
  const shadowL = new THREE.Mesh(shadowGeo, shadowMat);
  shadowL.position.set(-0.14, 1.955, 0.37);
  const shadowR = new THREE.Mesh(shadowGeo, shadowMat);
  shadowR.position.set(0.14, 1.955, 0.37);
  group.add(shadowL, shadowR);

  const chest = new THREE.Group();
  chest.position.set(0, 1.12, 0.28);
  chest.add(makeSequin(e.snowflake));
  group.add(chest);

  // Pooled jump ring. Hidden until the figure leaves the ground.
  const jumpRing = new THREE.Group();
  jumpRing.name = 'elsa-jump';
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.025, 6, 12),
    new THREE.MeshBasicMaterial({ color: e.cape, transparent: true, opacity: 0.8 })
  );
  torus.rotation.x = Math.PI / 2;
  jumpRing.add(torus);
  const crystalMat = new THREE.MeshBasicMaterial({ color: e.snowflake });
  for (let i = 0; i < 6; i++) {
    const crystal = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.06), crystalMat);
    const a = (i / 6) * Math.PI * 2;
    crystal.position.set(Math.cos(a) * 0.42, 0.06, Math.sin(a) * 0.42);
    jumpRing.add(crystal);
  }
  jumpRing.position.y = 0.03;
  jumpRing.visible = false;
  group.add(jumpRing);

  group.userData.anim = {
    braid,
    cape: capePivot,
    jumpRing,
    sway: e.braidSway,
  };
  return group;
}

function syncFigure(root, skin) {
  const p = root.userData.parts;
  clearElsa(root);
  if (!p) return;
  for (const key of ['leftLeg', 'rightLeg', 'hip', 'hair', 'knob']) {
    if (p[key]) p[key].visible = true;
  }
  if (p.print) p.print.scale.set(1, 1, 1);
  if (!skin || skin.figure !== 'elsa') {
    root.userData.elsa = null;
    return;
  }

  const e = elsaConfig(skin);
  const group = buildElsaGroup(skin);
  root.add(group);
  root.userData.elsaGroup = group;
  root.userData.elsa = group.userData.anim;
  for (const key of ['leftLeg', 'rightLeg', 'hip', 'hair', 'knob']) {
    if (p[key]) p[key].visible = false;
  }
  if (p.torso) {
    p.torso.material.metalness = e.bodiceMetalness;
    p.torso.material.roughness = e.bodiceRoughness;
    p.torso.material.emissive.setHex(e.bodiceEmissive);
    p.torso.material.emissiveIntensity = e.bodiceEmissiveIntensity;
  }
  if (p.print) {
    p.print.material.emissive.setHex(e.snowflake);
    p.print.material.emissiveIntensity = 0.35;
  }
}

function animateElsa(root, moving, grounded, time) {
  const extra = root.userData.elsa;
  if (!extra) return;
  const run = moving && grounded;
  const wave = Math.sin(time * (run ? 6.5 : 2));
  extra.braid.rotation.x = wave * extra.sway * (run ? 1 : 0.35);
  extra.cape.rotation.x = (run ? 0.2 : 0.05) + wave * (run ? 0.14 : 0.04);
  extra.cape.rotation.z = Math.sin(time * 3) * 0.03;
  const airborne = !grounded;
  extra.jumpRing.visible = airborne;
  if (airborne) extra.jumpRing.rotation.y = time * 3;
}
