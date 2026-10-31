import * as THREE from './vendor/three.module.js';

const PLATFORM_COLORS = [0xf39c12, 0xe67e22, 0x1abc9c, 0x3498db, 0x9b59b6, 0xe74c3c, 0x2ecc71];

function platformMat(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1 });
}

function makePlatform(w, h, d, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), platformMat(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const studMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15 });
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

/** Build ~50s parkour course along +Z. Returns { group, platforms, coins, checkpoints, finish, startPos } */
export function buildLevel() {
  const group = new THREE.Group();
  const platforms = [];
  const coins = [];
  const checkpoints = [];

  const voidPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 400),
    new THREE.MeshStandardMaterial({
      color: 0x2c1a4a, roughness: 1, metalness: 0, transparent: true, opacity: 0.35,
    })
  );
  voidPlane.rotation.x = -Math.PI / 2;
  voidPlane.position.set(0, -8, 80);
  voidPlane.receiveShadow = true;
  group.add(voidPlane);

  const defs = [
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

  let colorIdx = 0;
  defs.forEach((def, i) => {
    const h = def.h ?? 0.6;
    const color = PLATFORM_COLORS[colorIdx++ % PLATFORM_COLORS.length];
    const mesh = makePlatform(def.w, h, def.d, color);
    const topY = def.y;
    mesh.position.set(def.x, topY - h / 2, def.z);
    mesh.userData = {
      halfW: def.w / 2, halfD: def.d / 2, halfH: h / 2, topY,
      baseX: def.x, baseY: topY, baseZ: def.z,
      moving: !!def.moving, amp: def.amp || 0, phase: i * 0.7,
    };
    group.add(mesh);
    platforms.push(mesh);

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
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.45, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x2ecc71, emissive: 0x27ae60, emissiveIntensity: 0.3 })
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

    if (def.finish) {
      const archMat = new THREE.MeshStandardMaterial({
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
        new THREE.MeshStandardMaterial({ color: 0xe74c3c, emissive: 0xc0392b, emissiveIntensity: 0.25 })
      );
      banner.position.set(def.x, topY + 3.3, def.z + 1.15);
      group.add(banner);
    }
  });

  const finishDef = defs[defs.length - 1];
  const finish = {
    position: new THREE.Vector3(finishDef.x, finishDef.y, finishDef.z),
    radius: 3.5,
  };
  const startPos = new THREE.Vector3(0, 0.6, -2);
  return { group, platforms, coins, checkpoints, finish, startPos };
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
}
