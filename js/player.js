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
}
