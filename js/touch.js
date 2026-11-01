/**
 * On-screen stick + jump for touch / narrow screens.
 * Movement uses the same axes as WASD in getMoveInput:
 * screen-left is +X (A), screen-up / forward is +Z (W).
 * Jump is edge-triggered, same as Space.
 */

export const touchAxes = { x: 0, z: 0 };

const DEADZONE = 0.18;

export function initTouchControls({ onJump, onShop, onPause }) {
  // iOS ignores user-scalable. These listeners only cancel the browser
  // gesture; they do not stop controls from seeing touchstart/move/end.
  installViewportGuards();

  const root = document.getElementById('touch-controls');
  const stick = document.getElementById('touch-stick');
  const base = stick?.querySelector('.touch-stick-base');
  const knob = stick?.querySelector('.touch-stick-knob');
  const jump = document.getElementById('touch-jump');
  const shop = document.getElementById('touch-shop');
  const pause = document.getElementById('touch-pause');
  if (!root || !stick || !base || !knob || !jump) {
    return { setActive() {} };
  }

  let stickPointer = null;

  function resetStick() {
    stickPointer = null;
    touchAxes.x = 0;
    touchAxes.z = 0;
    knob.style.transform = 'translate(0px, 0px)';
    stick.classList.remove('is-held');
  }

  function applyStick(clientX, clientY) {
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const max = rect.width * 0.34;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > max) {
      dx = (dx / dist) * max;
      dy = (dy / dist) * max;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;

    let nx = dx / max;
    let ny = dy / max;
    const mag = Math.hypot(nx, ny);
    if (mag < DEADZONE) {
      touchAxes.x = 0;
      touchAxes.z = 0;
      return;
    }
    const scaled = Math.min(1, (mag - DEADZONE) / (1 - DEADZONE));
    // +nx is screen-right (D → world X negative). +ny is screen-down (S → world Z negative).
    touchAxes.x = (-nx / mag) * scaled;
    touchAxes.z = (-ny / mag) * scaled;
  }

  function onStickDown(e) {
    if (stickPointer !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stickPointer = e.pointerId;
    stick.classList.add('is-held');
    stick.setPointerCapture(e.pointerId);
    e.preventDefault();
    applyStick(e.clientX, e.clientY);
  }

  function onStickMove(e) {
    if (e.pointerId !== stickPointer) return;
    e.preventDefault();
    applyStick(e.clientX, e.clientY);
  }

  function onStickUp(e) {
    if (e.pointerId !== stickPointer) return;
    resetStick();
  }

  stick.addEventListener('pointerdown', onStickDown);
  stick.addEventListener('pointermove', onStickMove);
  stick.addEventListener('pointerup', onStickUp);
  stick.addEventListener('pointercancel', onStickUp);

  bindPress(jump, () => onJump?.());
  bindPress(shop, () => onShop?.());
  bindPress(pause, () => onPause?.());

  root.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('blur', resetStick);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetStick();
  });

  function setActive(on) {
    root.classList.toggle('is-active', !!on);
    root.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (!on) resetStick();
  }

  setActive(false);
  return { setActive, resetStick };
}

let viewportGuardsInstalled = false;

function installViewportGuards() {
  if (viewportGuardsInstalled) return;
  viewportGuardsInstalled = true;

  const blockGesture = (e) => {
    e.preventDefault();
  };
  document.addEventListener('gesturestart', blockGesture, { passive: false });
  document.addEventListener('gesturechange', blockGesture, { passive: false });
  document.addEventListener('gestureend', blockGesture, { passive: false });
  document.addEventListener('dblclick', blockGesture);

  // Second tap inside 300ms is what Safari zooms on. preventDefault on
  // touchend only — jump and the stick run on their own pointer handlers.
  let lastTapAt = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTapAt <= 300) e.preventDefault();
    lastTapAt = now;
  }, { passive: false });

  // Pinch-zoom. Single-finger shop scrolling stays allowed.
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
      return;
    }
    const target = e.target;
    if (target && target.closest && target.closest('.shop-panel')) return;
    e.preventDefault();
  }, { passive: false });
}

function bindPress(el, fn) {
  if (!el) return;
  let pointerId = null;

  el.addEventListener('pointerdown', (e) => {
    if (pointerId !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerId = e.pointerId;
    el.classList.add('is-pressed');
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
    fn();
  });

  const release = (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    el.classList.remove('is-pressed');
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
}
