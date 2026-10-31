import * as THREE from './vendor/three.module.js';
import { ARENDELLE_DEFS } from './levelData.js';

const PLATFORM_COLORS = [0xf39c12, 0xe67e22, 0x1abc9c, 0x3498db, 0x9b59b6, 0xe74c3c, 0x2ecc71];
export const LEVELS = [
  { id: 'L01', label: 'Level 1', name: '沙漠', nameEn: 'Desert' },
  { id: 'L02', label: 'Level 2', name: '阿伦戴尔', nameEn: 'Arendelle' },
];

const THEME_DESERT = {
  fog: 0x87b8e8,
  fogNear: 40,
  fogFar: 160,
  skyTop: 0x4a90d9,
  skyBottom: 0xffd4a8,
  hemiSky: 0xffe8c8,
  hemiGround: 0x6b4a8a,
  hemiIntensity: 0.7,
  sun: 0xfff0dd,
  sunIntensity: 1.35,
  fill: 0xaaccff,
  fillIntensity: 0.35,
};

const THEME_SNOW = {
  fog: 0xc5d4e4,
  fogNear: 28,
  fogFar: 155,
  skyTop: 0x16325c,
  skyBottom: 0xd7e6f2,
  hemiSky: 0xc5d8ee,
  hemiGround: 0x8aa4c0,
  hemiIntensity: 0.85,
  sun: 0xd4e4ff,
  sunIntensity: 0.95,
  fill: 0xffc48a,
  fillIntensity: 0.32,
};

/** Desert course. Numbers are the original parkour; y is the top surface. */
const L01_DEFS = [
  { z: 0, x: 0, y: 0, w: 8, d: 10 },
  { z: 12, x: 0, y: 0, w: 5, d: 5 },
  { z: 20, x: 1.5, y: 0.3, w: 4, d: 4 },
  { z: 28, x: -1, y: 0, w: 4.5, d: 4 },
  { z: 36, x: 0, y: 0.2, w: 6, d: 5, checkpoint: true },
  { z: 44, x: 2, y: 0.5, w: 3.5, d: 3.5 },
  { z: 51, x: -1.5, y: 0.8, w: 3.2, d: 3.2 },
  { z: 58, x: 0.5, y: 1.0, w: 3, d: 3 },
  { z: 65, x: -2, y: 0.6, w: 4, d: 3.5 },
  { z: 73, x: 0, y: 0.4, w: 3, d: 3, moving: true, amp: 1.2 },
  { z: 81, x: 2, y: 0.8, w: 2.8, d: 2.8, moving: true, amp: 1.5 },
  { z: 90, x: 0, y: 1.0, w: 6, d: 5, checkpoint: true },
  { z: 96, x: 0, y: 1.0, w: 5, d: 4 },
  { z: 103, x: -2.5, y: 1.2, w: 3, d: 3 },
  { z: 110, x: 0, y: 1.5, w: 2.8, d: 2.8 },
  { z: 117, x: 2.5, y: 1.8, w: 2.6, d: 2.6 },
  { z: 124, x: 0, y: 2.0, w: 2.5, d: 2.5 },
  { z: 131, x: 0, y: 1.5, w: 4.5, d: 3.5 },
  { z: 138, x: -1.5, y: 1.6, w: 3.2, d: 2.8 },
  { z: 146, x: 1, y: 1.2, w: 2.8, d: 2.5, moving: true, amp: 1.8 },
  { z: 155, x: 0, y: 1.0, w: 6, d: 5, checkpoint: true },
  { z: 164, x: -2, y: 1.4, w: 2.6, d: 2.6 },
  { z: 171, x: 2, y: 1.8, w: 2.4, d: 2.4 },
  { z: 178, x: 0, y: 2.2, w: 2.4, d: 2.4 },
  { z: 185, x: -2.2, y: 2.5, w: 2.3, d: 2.3 },
  { z: 192, x: 1.5, y: 2.8, w: 2.2, d: 2.2 },
  { z: 199, x: 0, y: 3.0, w: 2.5, d: 2.5, moving: true, amp: 1.4 },
  { z: 208, x: 0, y: 2.5, w: 5, d: 4 },
  { z: 217, x: 0, y: 2.2, w: 4, d: 4 },
  { z: 226, x: 0, y: 2.0, w: 8, d: 8, finish: true },
];

function platformMat(color, kind) {
  if (kind === 'ice') {
    return new THREE.MeshStandardMaterial({
      color: 0x9fd8ea,
      roughness: 0.16,
      metalness: 0.55,
      emissive: 0x6eb7d4,
      emissiveIntensity: 0.16,
    });
  }
  if (kind === 'wood') {
    return new THREE.MeshStandardMaterial({
      color: 0xc4843c,
      roughness: 0.84,
      metalness: 0.04,
    });
  }
  if (kind === 'snow') {
    return new THREE.MeshStandardMaterial({
      color: 0xf4f8fc,
      roughness: 0.74,
      metalness: 0.05,
      emissive: 0xd6eaf8,
      emissiveIntensity: 0.04,
    });
  }
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1 });
}

function makePlatform(w, h, d, color, kind) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), platformMat(color, kind));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const icy = kind === 'ice';
  const woody = kind === 'wood';
  const snowy = kind === 'snow';
  const studMat = new THREE.MeshStandardMaterial({
    color: icy ? 0xd7f4ff : woody ? 0xe0b07a : snowy ? 0xffffff : color,
    roughness: icy ? 0.2 : woody ? 0.78 : 0.5,
    metalness: icy ? 0.45 : 0.08,
    emissive: icy ? 0x9fd4ea : 0x000000,
    emissiveIntensity: icy ? 0.12 : 0,
  });
  const studGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10);
  const nx = Math.max(1, Math.floor(w / 0.7));
  const nz = Math.max(1, Math.floor(d / 0.7));
  for (let ix = 0; ix < nx; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      if ((ix + iz) % 2 !== 0 && nx * nz > 4) continue;
      const stud = new THREE.Mesh(studGeo, studMat);
      stud.position.set(
        -w / 2 + (ix + 0.5) * (w / nx),
        h / 2 + 0.04,
        -d / 2 + (iz + 0.5) * (d / nz)
      );
      stud.castShadow = true;
      mesh.add(stud);
    }
  }
  return mesh;
}

function makeCoin() {
  const group = new THREE.Group();
  const coin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.08, 20),
    new THREE.MeshStandardMaterial({
      color: 0xffd54a, metalness: 0.7, roughness: 0.25,
      emissive: 0xffa000, emissiveIntensity: 0.35,
    })
  );
  coin.rotation.x = Math.PI / 2;
  coin.castShadow = true;
  group.add(coin);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.04, 8, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffec8b, metalness: 0.8, roughness: 0.2,
      emissive: 0xffc107, emissiveIntensity: 0.2,
    })
  );
  group.add(ring);
  group.userData.spin = Math.random() * Math.PI * 2;
  return group;
}

function makeHazard(spec) {
  if (spec.kind === 'boulder') {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xd5e2ea, roughness: 0.55, metalness: 0.08 })
    );
    mesh.userData.hitRadius = 0.4;
    mesh.userData.halfH = 0.42;
    return mesh;
  }
  const mesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.86, 6),
    new THREE.MeshStandardMaterial({
      color: 0xe7f7ff,
      roughness: 0.22,
      metalness: 0.4,
      emissive: 0x8fd0ea,
      emissiveIntensity: 0.28,
    })
  );
  mesh.userData.hitRadius = 0.32;
  mesh.userData.halfH = 0.43;
  return mesh;
}

function addFinish(group, def, topY, snow) {
  const archMat = new THREE.MeshStandardMaterial(snow ? {
    color: 0xd7f1fb, metalness: 0.55, roughness: 0.22,
    emissive: 0x8ecae6, emissiveIntensity: 0.35,
  } : {
    color: 0xffd54a, metalness: 0.5, roughness: 0.3,
    emissive: 0xffa000, emissiveIntensity: 0.4,
  });
  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.4), archMat);
  leftPillar.position.set(def.x - 2.5, topY + 2, def.z + 1);
  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4, 0.4), archMat);
  rightPillar.position.set(def.x + 2.5, topY + 2, def.z + 1);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.4, 0.4), archMat);
  beam.position.set(def.x, topY + 4, def.z + 1);
  group.add(leftPillar, rightPillar, beam);
  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 1.0, 0.08),
    new THREE.MeshStandardMaterial(snow ? {
      color: 0x1b4f82, emissive: 0x163e6b, emissiveIntensity: 0.3,
    } : {
      color: 0xe74c3c, emissive: 0xc0392b, emissiveIntensity: 0.25,
    })
  );
  banner.position.set(def.x, topY + 3.3, def.z + 1.15);
  group.add(banner);
}

function addLantern(group, x, y, z) {
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffe1a8, emissive: 0xffb347, emissiveIntensity: 0.9 })
  );
  lamp.position.set(x, y, z);
  group.add(lamp);
  const light = new THREE.PointLight(0xffb35a, 14, 9, 2);
  light.position.set(x, y, z);
  group.add(light);
}

function addCottage(group, x, z) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 1.5, 2.1),
    new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.72, metalness: 0.04 })
  );
  wall.position.set(x, 0.75, z);
  wall.castShadow = true;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.6, 1.05, 4),
    new THREE.MeshStandardMaterial({ color: 0x2f5f8a, roughness: 0.5, metalness: 0.12 })
  );
  roof.position.set(x, 1.95, z);
  roof.rotation.y = Math.PI / 4;
  const win = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xffe1b0, emissive: 0xffb347, emissiveIntensity: 0.85 })
  );
  win.position.set(x, 0.95, z + 1.08);
  group.add(wall, roof, win);
}

function addSnowDressing(group, finishZ = 118) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.8 });
  for (const x of [-3.6, 3.6]) {
    for (const z of [-3.2, 3.4]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.2, 8), wood);
      post.position.set(x, -1.3, z);
      group.add(post);
    }
  }
  addCottage(group, -6.2, 12);
  addCottage(group, 6.4, 22);
  addCottage(group, -6.5, 38);
  addLantern(group, -2.4, 1.55, 12);
  addLantern(group, 2.3, 1.5, 22);
  addLantern(group, 2.4, 1.8, 60);
  addLantern(group, -2.2, 3.3, finishZ);

  const stone = new THREE.MeshStandardMaterial({ color: 0xe7eef5, roughness: 0.62, metalness: 0.08 });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x1d4e89, roughness: 0.45, metalness: 0.2,
    emissive: 0x163e6b, emissiveIntensity: 0.15,
  });
  for (const side of [-1, 1]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.3, 6.2, 1.3), stone);
    tower.position.set(side * 5.3, 2.2 + 3.1, finishZ);
    tower.castShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.7, 4), roofMat);
    roof.position.set(side * 5.3, 2.2 + 7.0, finishZ);
    roof.rotation.y = Math.PI / 4;
    group.add(tower, roof);
  }

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 56),
    new THREE.MeshStandardMaterial({
      color: 0x6eafc8, roughness: 0.18, metalness: 0.35,
      transparent: true, opacity: 0.72,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -1.35, 50);
  group.add(water);

  const count = 280;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 1] = Math.random() * 14 + 0.4;
    positions[i * 3 + 2] = -6 + Math.random() * (finishZ + 24);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const snow = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.14, transparent: true, opacity: 0.8, depthWrite: false })
  );
  snow.frustumCulled = false;
  group.add(snow);
  return snow;
}

function buildCourse(defs, meta, snow) {
  const group = new THREE.Group();
  const platforms = [];
  const coins = [];
  const checkpoints = [];
  const obstacles = [];
  const palette = PLATFORM_COLORS;

  const voidPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 400),
    new THREE.MeshStandardMaterial({
      color: snow ? 0x0e2438 : 0x2c1a4a,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: snow ? 0.55 : 0.35,
    })
  );
  voidPlane.rotation.x = -Math.PI / 2;
  voidPlane.position.set(0, -8, 80);
  voidPlane.receiveShadow = true;
  group.add(voidPlane);

  let colorIdx = 0;
  defs.forEach((def, i) => {
    const h = def.h ?? 0.6;
    const color = palette[colorIdx++ % palette.length];
    const kind = def.kind || (def.ice ? 'ice' : '');
    const mesh = makePlatform(def.w, h, def.d, color, kind);
    const topY = def.y;
    mesh.position.set(def.x, topY - h / 2, def.z);
    if (def.tilt) mesh.rotation.x = def.tilt;
    mesh.userData = {
      halfW: def.w / 2, halfD: def.d / 2, halfH: h / 2, topY,
      baseX: def.x, baseY: topY, baseZ: def.z,
      moving: !!def.moving, amp: def.amp || 0, phase: i * 0.7,
      ice: kind === 'ice',
      slideZ: def.slideZ || 0,
      center: { x: def.x, y: topY - h / 2, z: def.z },
      size: { sx: def.w, sy: h, sz: def.d },
    };
    group.add(mesh);
    platforms.push(mesh);

    if (def.hazards) {
      for (const spec of def.hazards) {
        const hazard = makeHazard(spec);
        const lift = spec.kind === 'boulder' ? 0.42 : 0.43;
        hazard.position.set(spec.ox || 0, h / 2 + lift, spec.oz || 0);
        hazard.castShadow = true;
        mesh.add(hazard);
        obstacles.push(hazard);
      }
    }

    if (i > 0 && !def.finish) {
      const nCoins = def.checkpoint ? 2 : 1;
      for (let c = 0; c < nCoins; c++) {
        const coin = makeCoin();
        const ox = (c - (nCoins - 1) / 2) * 0.9;
        coin.position.set(def.x + ox, topY + 1.1, def.z);
        coin.userData.collected = false;
        coin.userData.baseY = topY + 1.1;
        group.add(coin);
        coins.push(coin);
      }
    }

    if (def.checkpoint) {
      const flagPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xecf0f1, metalness: 0.4, roughness: 0.4 })
      );
      flagPole.position.set(def.x + def.w / 2 - 0.4, topY + 1.1, def.z);
      flagPole.castShadow = true;
      group.add(flagPole);
      const flagColor = snow ? 0x7fdbff : 0x2ecc71;
      const flagGlow = snow ? 0x4fc3f7 : 0x27ae60;
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.45, 0.05),
        new THREE.MeshStandardMaterial({ color: flagColor, emissive: flagGlow, emissiveIntensity: 0.3 })
      );
      flag.position.set(def.x + def.w / 2 - 0.05, topY + 1.9, def.z);
      group.add(flag);
      checkpoints.push({
        position: new THREE.Vector3(def.x, topY, def.z),
        index: checkpoints.length + 1,
        activated: false,
        flag,
      });
    }

    if (def.finish) addFinish(group, def, topY, snow);
  });

  const finishDef = defs[defs.length - 1];
  const finish = {
    position: new THREE.Vector3(finishDef.x, finishDef.y, finishDef.z),
    radius: 3.5,
  };
  const startPos = new THREE.Vector3(0, 0.6, -2);
  const snowPoints = snow ? addSnowDressing(group, defs[defs.length - 1].z) : null;
  return {
    group,
    platforms,
    coins,
    checkpoints,
    obstacles,
    finish,
    startPos,
    snow: snowPoints,
    theme: snow ? THEME_SNOW : THEME_DESERT,
    meta: { ...meta },
  };
}

/** Entry used by main.js. Unknown ids fall back to the desert course. */
export function buildLevel(levelId = 'L01') {
  const meta = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
  const snow = meta.id === 'L02';
  return buildCourse(snow ? ARENDELLE_DEFS : L01_DEFS, meta, snow);
}

export function updateLevel(level, time) {
  for (const p of level.platforms) {
    const u = p.userData;
    if (u.moving) {
      p.position.x = u.baseX + Math.sin(time * 1.4 + u.phase) * u.amp;
    }
  }
  for (const coin of level.coins) {
    if (coin.userData.collected) continue;
    coin.userData.spin += 0.04;
    coin.rotation.y = coin.userData.spin;
    coin.position.y = coin.userData.baseY + Math.sin(time * 3 + coin.userData.spin) * 0.15;
  }
  if (level.snow) {
    const attr = level.snow.geometry.attributes.position;
    const arr = attr.array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] -= 0.04;
      if (arr[i + 1] < 0) arr[i + 1] = 14;
    }
    attr.needsUpdate = true;
  }
}
