import * as THREE from './vendor/three.module.js';
import { loadSave, saveState } from './storage.js';
import { SKINS, getSkin } from './skins.js';
import { createMinifigure, applySkin, animateMinifigure } from './player.js';
import { buildLevel, updateLevel } from './level.js';

// ——— State ———
let save = loadSave();
let mode = 'title'; // title | playing | paused | shop | win
let runCoins = 0;
let checkpointIndex = 0; // 0 = start
let spawnPos = new THREE.Vector3();
let shopReturnMode = 'playing';

const keys = {};
const clock = new THREE.Clock();
let elapsed = 0;

// Physics
const GRAVITY = -28;
const JUMP_V = 11.5;
const MOVE_SPEED = 9;
const AIR_CONTROL = 0.65;
const PLAYER_RADIUS = 0.35;
const PLAYER_HEIGHT = 2.0;

const velocity = new THREE.Vector3();
let grounded = false;
let jumpBuffered = 0;
let coyote = 0;

// ——— DOM ———
const canvas = document.getElementById('game-canvas') || document.getElementById('game');
if (!canvas) throw new Error('Missing #game-canvas');
canvas.removeAttribute('width');
canvas.removeAttribute('height');

const el = {
  title: document.getElementById('title-screen'),
  hud: document.getElementById('hud'),
  pause: document.getElementById('pause-screen'),
  shop: document.getElementById('shop-screen'),
  win: document.getElementById('win-screen'),
  coinCount: document.getElementById('coin-count'),
  shopCoins: document.getElementById('shop-coins'),
  skinList: document.getElementById('skin-list'),
  checkpointLabel: document.getElementById('checkpoint-label'),
  winStats: document.getElementById('win-stats'),
  coinBadge: document.querySelector('.coin-badge') || null,
};

// ——— Three.js ———
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87b8e8, 40, 160);

// Sky gradient via large sphere
const skyGeo = new THREE.SphereGeometry(300, 32, 16);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    topColor: { value: new THREE.Color(0x4a90d9) },
    bottomColor: { value: new THREE.Color(0xffd4a8) },
    offset: { value: 20 },
    exponent: { value: 0.5 },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPosition = wp.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      float t = max(pow(max(h, 0.0), exponent), 0.0);
      gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
    }
  `,
});
skyMat.uniforms.bottomColor.value = new THREE.Color(0xffd4a8);
scene.add(new THREE.Mesh(skyGeo, skyMat));

// Lights
const hemi = new THREE.HemisphereLight(0xffe8c8, 0x6b4a8a, 0.7);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0dd, 1.35);
sun.position.set(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 120;
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.bias = -0.001;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xaaccff, 0.35);
fill.position.set(-20, 15, -10);
scene.add(fill);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 6, -8);

// Level + player
let level = buildLevel();
scene.add(level.group);

let player = createMinifigure(save.equippedSkin);
scene.add(player);

spawnPos.copy(level.startPos);
player.position.copy(spawnPos);

const camTarget = new THREE.Vector3();
const camDesired = new THREE.Vector3();

// Particles for coin pickup
const pickupBursts = [];

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);

// ——— Input ———
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') {
    e.preventDefault();
    jumpBuffered = 0.15;
  }
  if (e.code === 'KeyB') {
    if (mode === 'playing' || mode === 'paused' || mode === 'win') openShop();
    else if (mode === 'shop') closeShop();
  }
  if (e.code === 'Escape') {
    if (mode === 'playing') setMode('paused');
    else if (mode === 'paused') setMode('playing');
    else if (mode === 'shop') closeShop();
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

document.getElementById('btn-start').addEventListener('click', (e) => {
  e.preventDefault();
  try { startGame(); } catch (err) { console.error(err); alert('启动失败: ' + err); }
});
document.getElementById('btn-resume').addEventListener('click', () => setMode('playing'));
document.getElementById('btn-open-shop').addEventListener('click', () => openShop());
document.getElementById('btn-shop').addEventListener('click', () => openShop());
document.getElementById('btn-close-shop').addEventListener('click', () => closeShop());
document.getElementById('btn-pause').addEventListener('click', () => setMode('paused'));
document.getElementById('btn-restart-pause').addEventListener('click', () => restartRun());
document.getElementById('btn-restart-win').addEventListener('click', () => restartRun());
document.getElementById('btn-shop-win').addEventListener('click', () => openShop());

// ——— UI helpers ———
function setMode(m) {
  mode = m;
  el.title.classList.toggle('hidden', m !== 'title');
  el.pause.classList.toggle('hidden', m !== 'paused');
  el.shop.classList.toggle('hidden', m !== 'shop');
  el.win.classList.toggle('hidden', m !== 'win');
  el.hud.classList.toggle('hidden', m === 'title');
  if (m === 'playing') clock.getDelta(); // flush
}

function updateCoinHUD() {
  el.coinCount.textContent = String(save.coins);
  el.shopCoins.textContent = String(save.coins);
}

function updateCPLabel() {
  el.checkpointLabel.textContent = `CP ${checkpointIndex}/3`;
}

function floatText(x, y, text) {
  const div = document.createElement('div');
  div.className = 'float-text';
  div.textContent = text;
  div.style.left = `${x}px`;
  div.style.top = `${y}px`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 800);
}

function openShop() {
  shopReturnMode = mode === 'shop' ? 'playing' : (mode === 'win' ? 'win' : (mode === 'paused' ? 'paused' : 'playing'));
  renderShop();
  setMode('shop');
}

function closeShop() {
  setMode(shopReturnMode === 'shop' ? 'playing' : shopReturnMode);
}

function renderShop() {
  updateCoinHUD();
  el.skinList.innerHTML = '';
  for (const skin of SKINS) {
    const unlocked = save.unlockedSkins.includes(skin.id);
    const equipped = save.equippedSkin === skin.id;
    const row = document.createElement('div');
    row.className = 'skin-row' + (equipped ? ' equipped' : '');
    const swatch = document.createElement('div');
    swatch.className = 'skin-swatch';
    swatch.style.background = `linear-gradient(135deg, #${skin.torso.toString(16).padStart(6, '0')}, #${skin.legs.toString(16).padStart(6, '0')})`;
    const info = document.createElement('div');
    info.className = 'skin-info';
    info.innerHTML = `<div class="skin-name">${skin.name}</div><div class="skin-price">${unlocked ? (equipped ? 'Equipped / 已装备' : 'Owned / 已拥有') : `Price / 价格: ${skin.price} ●`}</div>`;
    const btn = document.createElement('button');
    btn.className = 'btn small';
    if (equipped) {
      btn.textContent = '✓';
      btn.disabled = true;
    } else if (unlocked) {
      btn.textContent = 'Equip / 装备';
      btn.addEventListener('click', () => {
        save.equippedSkin = skin.id;
        applySkin(player, skin.id);
        saveState(save);
        renderShop();
      });
    } else {
      btn.textContent = `Buy / 购买`;
      btn.disabled = save.coins < skin.price;
      btn.addEventListener('click', () => {
        if (save.coins < skin.price) return;
        save.coins -= skin.price;
        save.unlockedSkins.push(skin.id);
        save.equippedSkin = skin.id;
        applySkin(player, skin.id);
        saveState(save);
        updateCoinHUD();
        renderShop();
      });
    }
    row.append(swatch, info, btn);
    el.skinList.appendChild(row);
  }
}

function startGame() {
  restartRun();
  setMode('playing');
}

function restartRun() {
  // Rebuild level so coins reset
  scene.remove(level.group);
  level = buildLevel();
  scene.add(level.group);
  runCoins = 0;
  checkpointIndex = 0;
  spawnPos.copy(level.startPos);
  player.position.copy(spawnPos);
  velocity.set(0, 0, 0);
  grounded = false;
  applySkin(player, save.equippedSkin);
  updateCPLabel();
  updateCoinHUD();
  setMode('playing');
}

function respawn() {
  player.position.copy(spawnPos);
  player.position.y += 0.05;
  velocity.set(0, 0, 0);
  grounded = false;
}

function activateCheckpoint(cp) {
  if (cp.activated) return;
  cp.activated = true;
  checkpointIndex = cp.index;
  spawnPos.set(cp.position.x, cp.position.y + 0.05, cp.position.z);
  cp.flag.material.color.setHex(0xffd54a);
  cp.flag.material.emissive.setHex(0xffa000);
  updateCPLabel();
}

function collectCoin(coin) {
  if (coin.userData.collected) return;
  coin.userData.collected = true;
  coin.visible = false;
  save.coins += 1;
  runCoins += 1;
  saveState(save);
  updateCoinHUD();
  if (el.coinBadge) {
    el.coinBadge.classList.remove('pop');
    void el.coinBadge.offsetWidth;
    el.coinBadge.classList.add('pop');
  }

  // Screen float
  const v = player.position.clone();
  v.project(camera);
  const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
  floatText(sx, sy - 40, '+1');

  // Burst particles
  spawnBurst(coin.position.clone());
}

function spawnBurst(pos) {
  const n = 10;
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshStandardMaterial({
        color: 0xffd54a,
        emissive: 0xffa000,
        emissiveIntensity: 0.8,
      })
    );
    m.position.copy(pos);
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      Math.random() * 5 + 2,
      (Math.random() - 0.5) * 6
    );
    scene.add(m);
    pickupBursts.push({ mesh: m, vel, life: 0.6 });
  }
}

function win() {
  el.winStats.textContent = `This run: +${runCoins} coins · Total: ${save.coins}  |  本局 +${runCoins} · 总计 ${save.coins}`;
  setMode('win');
}

// ——— Physics / collision ———
function getMoveInput() {
  let x = 0;
  let z = 0;
  // Camera looks along +Z, so screen-left is +X (opposite of default Three.js view)
  if (keys['KeyA'] || keys['ArrowLeft']) x += 1;
  if (keys['KeyD'] || keys['ArrowRight']) x -= 1;
  if (keys['KeyW'] || keys['ArrowUp']) z += 1;
  if (keys['KeyS'] || keys['ArrowDown']) z -= 1;
  const len = Math.hypot(x, z);
  if (len > 0) { x /= len; z /= len; }
  return { x, z };
}

function resolvePlatforms(dt) {
  grounded = false;
  const px = player.position.x;
  const pz = player.position.z;
  const py = player.position.y;
  let bestTop = -Infinity;
  let onAny = false;

  for (const plat of level.platforms) {
    const u = plat.userData;
    const halfW = u.halfW + PLAYER_RADIUS * 0.3;
    const halfD = u.halfD + PLAYER_RADIUS * 0.3;
    const minX = plat.position.x - halfW;
    const maxX = plat.position.x + halfW;
    const minZ = plat.position.z - halfD;
    const maxZ = plat.position.z + halfD;

    if (px >= minX && px <= maxX && pz >= minZ && pz <= maxZ) {
      const top = plat.position.y + u.halfH;
      // Standing on top
      if (velocity.y <= 0 && py >= top - 0.35 && py <= top + 0.25) {
        if (top > bestTop) bestTop = top;
        onAny = true;
      }
    }
  }

  if (onAny) {
    player.position.y = bestTop;
    velocity.y = 0;
    grounded = true;
    coyote = 0.12;
  }
}

function updatePlayer(dt) {
  const input = getMoveInput();
  const control = grounded ? 1 : AIR_CONTROL;
  const targetVx = input.x * MOVE_SPEED;
  const targetVz = input.z * MOVE_SPEED;
  velocity.x += (targetVx - velocity.x) * Math.min(1, 12 * control * dt);
  velocity.z += (targetVz - velocity.z) * Math.min(1, 12 * control * dt);

  // Jump
  jumpBuffered -= dt;
  coyote -= dt;
  if (jumpBuffered > 0 && (grounded || coyote > 0)) {
    velocity.y = JUMP_V;
    grounded = false;
    coyote = 0;
    jumpBuffered = 0;
  }

  velocity.y += GRAVITY * dt;
  player.position.x += velocity.x * dt;
  player.position.y += velocity.y * dt;
  player.position.z += velocity.z * dt;

  resolvePlatforms(dt);

  // Face movement
  if (Math.abs(velocity.x) + Math.abs(velocity.z) > 0.4) {
    const angle = Math.atan2(velocity.x, velocity.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, angle, 1 - Math.pow(0.001, dt));
  }

  const moving = Math.hypot(velocity.x, velocity.z) > 0.8;
  animateMinifigure(player, moving, grounded, dt, elapsed);

  // Fall
  if (player.position.y < -6) {
    respawn();
  }

  // Coins
  for (const coin of level.coins) {
    if (coin.userData.collected) continue;
    if (player.position.distanceTo(coin.position) < 1.2) {
      collectCoin(coin);
    }
  }

  // Checkpoints
  for (const cp of level.checkpoints) {
    if (!cp.activated && player.position.distanceTo(cp.position) < 3.5) {
      activateCheckpoint(cp);
    }
  }

  // Finish
  if (mode === 'playing' && player.position.distanceTo(level.finish.position) < level.finish.radius) {
    // Must be near finish platform height
    if (Math.abs(player.position.y - level.finish.position.y) < 2.5) {
      win();
    }
  }
}

function updateCamera(dt) {
  // Third-person follow from behind (toward -Z relative to course = camera behind player looking +Z)
  const behind = 8;
  const height = 5;
  camDesired.set(
    player.position.x * 0.35,
    player.position.y + height,
    player.position.z - behind
  );
  camera.position.lerp(camDesired, 1 - Math.pow(0.02, dt));
  camTarget.set(player.position.x, player.position.y + 1.2, player.position.z + 4);
  camera.lookAt(camTarget);

  // Keep sun near player for shadows
  sun.position.set(player.position.x + 30, 50, player.position.z + 20);
  sun.target.position.copy(player.position);
  sun.target.updateMatrixWorld();
}

function updateBursts(dt) {
  for (let i = pickupBursts.length - 1; i >= 0; i--) {
    const b = pickupBursts[i];
    b.life -= dt;
    b.vel.y += GRAVITY * 0.4 * dt;
    b.mesh.position.addScaledVector(b.vel, dt);
    b.mesh.scale.setScalar(Math.max(0.01, b.life / 0.6));
    if (b.life <= 0) {
      scene.remove(b.mesh);
      b.mesh.geometry.dispose();
      b.mesh.material.dispose();
      pickupBursts.splice(i, 1);
    }
  }
}

// ——— Title screen idle camera ———
function updateTitleCam(dt) {
  const t = elapsed * 0.3;
  camera.position.set(Math.sin(t) * 10, 6 + Math.sin(t * 0.5) * 1.5, -6 + Math.cos(t) * 4);
  camera.lookAt(player.position.x, player.position.y + 1, player.position.z + 2);
  player.rotation.y += dt * 0.6;
  animateMinifigure(player, false, true, dt, elapsed);
}

// ——— Loop ———
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  if (mode === 'playing') {
    updateLevel(level, elapsed);
    updatePlayer(dt);
    updateCamera(dt);
  } else if (mode === 'title') {
    updateLevel(level, elapsed);
    updateTitleCam(dt);
  } else {
    // paused / shop / win — still render, gentle idle
    updateLevel(level, elapsed);
  }

  updateBursts(dt);
  renderer.render(scene, camera);
}

// Init
updateCoinHUD();
updateCPLabel();
applySkin(player, save.equippedSkin);
setMode('title');
frame();

// Expose for debug
window.__legoParkour = { save, restartRun, getSkin };
