import * as THREE from './vendor/three.module.js';
import { loadSave, saveState } from './storage.js';
import { SKINS, getSkin } from './skins.js';
import { createMinifigure, applySkin, animateMinifigure } from './player.js';
import { buildLevel, updateLevel, LEVELS } from './level.js';
import { initTouchControls, touchAxes } from './touch.js';

// ——— State ———
let save = loadSave();
let mode = 'title'; // title | playing | paused | shop | win
let runCoins = 0;
let checkpointIndex = 0; // 0 = start
let spawnPos = new THREE.Vector3();
let shopReturnMode = 'playing';
let selectedLevelId = 'L01';

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
let groundedIce = false;
let slideZ = 0;
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
  levelLabel: document.getElementById('level-label'),
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

// Level + player. buildLevel(id) is the only level entry main uses.
let level = null;
let player = createMinifigure(save.equippedSkin);
scene.add(player);
const hazardPos = new THREE.Vector3();

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
function requestJump() {
  jumpBuffered = 0.15;
}

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') {
    e.preventDefault();
    requestJump();
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
document.getElementById('btn-levels-pause').addEventListener('click', () => setMode('title'));
document.getElementById('btn-levels-win').addEventListener('click', () => setMode('title'));

const touchUi = initTouchControls({
  onJump: () => { if (mode === 'playing') requestJump(); },
  onShop: () => { if (mode === 'playing' || mode === 'paused' || mode === 'win') openShop(); },
  onPause: () => {
    if (mode === 'playing') setMode('paused');
    else if (mode === 'paused') setMode('playing');
  },
});

// ——— UI helpers ———
function setMode(m) {
  mode = m;
  el.title.classList.toggle('hidden', m !== 'title');
  el.pause.classList.toggle('hidden', m !== 'paused');
  el.shop.classList.toggle('hidden', m !== 'shop');
  el.win.classList.toggle('hidden', m !== 'win');
  el.hud.classList.toggle('hidden', m === 'title');
  document.body.classList.toggle('is-playing', m === 'playing');
  touchUi.setActive(m === 'playing');
  if (m === 'title') renderLevelSelect();
  if (m === 'playing') clock.getDelta(); // flush
}

function updateCoinHUD() {
  el.coinCount.textContent = String(save.coins);
  el.shopCoins.textContent = String(save.coins);
}

function updateCPLabel() {
  const total = level?.checkpoints?.length ?? 0;
  el.checkpointLabel.textContent = `CP ${checkpointIndex}/${total}`;
}

function updateLevelLabel() {
  if (!el.levelLabel || !level?.meta) return;
  el.levelLabel.textContent = `${level.meta.label} · ${level.meta.name}`;
}

function isLevelUnlocked(id) {
  const index = LEVELS.findIndex((lv) => lv.id === id);
  if (index <= 0) return true;
  return save.clearedLevels.includes(LEVELS[index - 1].id);
}

function renderLevelSelect() {
  const root = document.getElementById('level-select');
  if (!root) return;
  root.innerHTML = '';
  for (const lv of LEVELS) {
    const open = isLevelUnlocked(lv.id);
    const cleared = save.clearedLevels.includes(lv.id);
    const best = save.bestCoins[lv.id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'level-btn' + (lv.id === selectedLevelId ? ' selected' : '') + (open ? '' : ' locked');
    btn.disabled = !open;
    btn.setAttribute('aria-pressed', lv.id === selectedLevelId ? 'true' : 'false');
    btn.dataset.level = lv.id;
    const prev = LEVELS[LEVELS.findIndex((item) => item.id === lv.id) - 1];
    const lock = open || !prev
      ? ''
      : `<span class="level-lock">通关「${prev.name}」后解锁 · Clear ${prev.nameEn} first</span>`;
    const badge = cleared ? '<span class="level-badge">已通关 Cleared</span>' : '';
    const bestText = Number.isFinite(best) ? `<span class="level-best">Best ${best} · 最佳 ${best}</span>` : '';
    btn.innerHTML = `<span class="level-kicker">${lv.label}</span><span class="level-name">${lv.name}</span><span class="level-en">${lv.nameEn}</span>${badge}${bestText}${lock}`;
    btn.addEventListener('click', () => {
      if (!isLevelUnlocked(lv.id)) return;
      if (lv.id !== selectedLevelId) mountLevel(lv.id);
    });
    root.appendChild(btn);
  }
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

function recordLevelClear() {
  const id = level?.meta?.id || selectedLevelId;
  if (!save.clearedLevels.includes(id)) save.clearedLevels.push(id);
  const prev = Number.isFinite(save.bestCoins[id]) ? save.bestCoins[id] : -1;
  if (runCoins > prev) save.bestCoins[id] = runCoins;
  saveState(save);
  renderLevelSelect();
}

function restartRun() {
  mountLevel(selectedLevelId);
  runCoins = 0;
  applySkin(player, save.equippedSkin);
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
  recordLevelClear();
  const id = level?.meta?.id || selectedLevelId;
  const best = save.bestCoins[id];
  const name = level?.meta ? `${level.meta.name} / ${level.meta.nameEn}` : id;
  el.winStats.textContent = `${name} · This run: +${runCoins} · Best ${best} · Total: ${save.coins}  |  本局 +${runCoins} · 最佳 ${best} · 总计 ${save.coins}`;
  setMode('win');
}

// ——— Physics / collision ———
function getMoveInput() {
  let x = 0;
  let z = 0;
  // Camera looks along +Z, so screen-left is +X (opposite of default Three.js view).
  // The on-screen stick writes the same axes into touchAxes.
  if (keys['KeyA'] || keys['ArrowLeft']) x += 1;
  if (keys['KeyD'] || keys['ArrowRight']) x -= 1;
  if (keys['KeyW'] || keys['ArrowUp']) z += 1;
  if (keys['KeyS'] || keys['ArrowDown']) z -= 1;
  x += touchAxes.x;
  z += touchAxes.z;
  const len = Math.hypot(x, z);
  if (len > 1) { x /= len; z /= len; }
  return { x, z };
}

function resolvePlatforms(dt) {
  grounded = false;
  groundedIce = false;
  slideZ = 0;
  const px = player.position.x;
  const pz = player.position.z;
  const py = player.position.y;
  let bestTop = -Infinity;
  let bestPlat = null;
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
        if (top > bestTop) {
          bestTop = top;
          bestPlat = plat;
          onAny = true;
        }
      }
    }
  }

  if (onAny) {
    player.position.y = bestTop;
    velocity.y = 0;
    grounded = true;
    coyote = 0.12;
    groundedIce = !!bestPlat.userData.ice;
    slideZ = bestPlat.userData.slideZ || 0;
  }
}

function updatePlayer(dt) {
  const input = getMoveInput();
  const icy = grounded && groundedIce;
  const control = grounded ? (icy ? 0.42 : 1) : AIR_CONTROL;
  const response = icy ? 3.6 : 12;
  const targetVx = input.x * MOVE_SPEED;
  const targetVz = input.z * MOVE_SPEED;
  velocity.x += (targetVx - velocity.x) * Math.min(1, response * control * dt);
  velocity.z += (targetVz - velocity.z) * Math.min(1, response * control * dt);
  if (grounded && slideZ) velocity.z += slideZ * dt;

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
  if (player.position.y < -6 || hurtByHazard()) {
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

function hurtByHazard() {
  const list = level?.obstacles;
  if (!list || !list.length) return false;
  const py = player.position.y;
  for (const ob of list) {
    ob.getWorldPosition(hazardPos);
    const r = ob.userData.hitRadius || 0.4;
    const dx = player.position.x - hazardPos.x;
    const dz = player.position.z - hazardPos.z;
    if (dx * dx + dz * dz > r * r) continue;
    const half = ob.userData.halfH || 0.4;
    if (py < hazardPos.y + half && py + 0.9 > hazardPos.y - half) return true;
  }
  return false;
}

function disposeObject3D(root) {
  const seen = new Set();
  root.traverse((obj) => {
    if (obj.geometry && !seen.has(obj.geometry)) {
      seen.add(obj.geometry);
      obj.geometry.dispose();
    }
    const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
    for (const material of mats) {
      if (material && !seen.has(material)) {
        seen.add(material);
        material.dispose();
      }
    }
  });
}

function applyLevelTheme(theme) {
  if (!theme) return;
  scene.fog.color.setHex(theme.fog);
  scene.fog.near = theme.fogNear;
  scene.fog.far = theme.fogFar;
  skyMat.uniforms.topColor.value.setHex(theme.skyTop);
  skyMat.uniforms.bottomColor.value.setHex(theme.skyBottom);
  hemi.color.setHex(theme.hemiSky);
  hemi.groundColor.setHex(theme.hemiGround);
  hemi.intensity = theme.hemiIntensity;
  sun.color.setHex(theme.sun);
  sun.intensity = theme.sunIntensity;
  fill.color.setHex(theme.fill);
  fill.intensity = theme.fillIntensity;
}

function mountLevel(id) {
  const known = LEVELS.some((lv) => lv.id === id);
  const nextId = known && isLevelUnlocked(id) ? id : LEVELS[0].id;
  selectedLevelId = nextId;
  if (level) {
    scene.remove(level.group);
    disposeObject3D(level.group);
  }
  level = buildLevel(selectedLevelId);
  scene.add(level.group);
  applyLevelTheme(level.theme);
  checkpointIndex = 0;
  spawnPos.copy(level.startPos);
  if (player) player.position.copy(spawnPos);
  velocity.set(0, 0, 0);
  grounded = false;
  groundedIce = false;
  slideZ = 0;
  updateCPLabel();
  updateLevelLabel();
  renderLevelSelect();
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
mountLevel(selectedLevelId);
applySkin(player, save.equippedSkin);
setMode('title');
frame();

// Expose for debug
window.__legoParkour = {
  save,
  restartRun,
  getSkin,
  player,
  camera,
  getState: () => ({
    mode,
    x: player.position.x,
    y: player.position.y,
    z: player.position.z,
    vy: velocity.y,
    ax: touchAxes.x,
    az: touchAxes.z,
    levelId: selectedLevelId,
    levelName: level?.meta?.name || '',
    platforms: level?.platforms?.length || 0,
    cleared: save.clearedLevels.slice(),
  }),
};
