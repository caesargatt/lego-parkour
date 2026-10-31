/**
 * AABB 物理（Y 上、Z 前进、X 左右）
 * 平台/障碍：中心 (x,y,z) + 全边长 (sx,sy,sz)
 * 玩家：脚底 (x,y,z)，高 height，半宽 halfW / 半深 halfD
 */

export const PLAYER_HALF_W = 0.35;
export const PLAYER_HALF_D = 0.35;
export const PLAYER_HEIGHT = 1.9;

export function solidAabb(center, size) {
  const hx = size.sx / 2;
  const hy = size.sy / 2;
  const hz = size.sz / 2;
  return {
    minX: center.x - hx,
    maxX: center.x + hx,
    minY: center.y - hy,
    maxY: center.y + hy,
    minZ: center.z - hz,
    maxZ: center.z + hz,
  };
}

export function playerAabb(pos, halfW = PLAYER_HALF_W, halfD = PLAYER_HALF_D, height = PLAYER_HEIGHT) {
  return {
    minX: pos.x - halfW,
    maxX: pos.x + halfW,
    minY: pos.y,
    maxY: pos.y + height,
    minZ: pos.z - halfD,
    maxZ: pos.z + halfD,
  };
}

export function aabbOverlap(a, b) {
  return (
    a.minX < b.maxX && a.maxX > b.minX &&
    a.minY < b.maxY && a.maxY > b.minY &&
    a.minZ < b.maxZ && a.maxZ > b.minZ
  );
}

export function pointInRadius(px, pz, cx, cz, r) {
  const dx = px - cx;
  const dz = pz - cz;
  return dx * dx + dz * dz <= r * r;
}

/**
 * 轴分离解析：把玩家从 solid 里推出，优先最小穿透轴。
 * 返回 { grounded, pos }
 */
export function resolveSolids(pos, vel, solids, opts = {}) {
  const halfW = opts.halfW ?? PLAYER_HALF_W;
  const halfD = opts.halfD ?? PLAYER_HALF_D;
  const height = opts.height ?? PLAYER_HEIGHT;
  let grounded = false;
  const out = { x: pos.x, y: pos.y, z: pos.z };
  const v = { x: vel.x, y: vel.y, z: vel.z };

  // 多轮解析，处理角落
  for (let iter = 0; iter < 3; iter++) {
    const pa = playerAabb(out, halfW, halfD, height);
    let hit = false;
    for (const s of solids) {
      if (!aabbOverlap(pa, s)) continue;
      hit = true;
      const penX = Math.min(pa.maxX - s.minX, s.maxX - pa.minX);
      const penY = Math.min(pa.maxY - s.minY, s.maxY - pa.minY);
      const penZ = Math.min(pa.maxZ - s.minZ, s.maxZ - pa.minZ);

      if (penY <= penX && penY <= penZ) {
        // 垂直分离
        const fromAbove = (out.y + height / 2) >= (s.minY + s.maxY) / 2;
        if (v.y <= 0 && pa.minY < s.maxY && pa.maxY > s.maxY) {
          // 落在顶面
          out.y = s.maxY;
          v.y = 0;
          grounded = true;
        } else if (v.y > 0 && pa.maxY > s.minY && pa.minY < s.minY) {
          // 头顶撞
          out.y = s.minY - height;
          v.y = 0;
        } else if (fromAbove) {
          out.y = s.maxY;
          v.y = Math.min(0, v.y);
          grounded = true;
        } else {
          out.y = s.minY - height;
          v.y = Math.min(v.y, 0);
        }
      } else if (penX <= penZ) {
        const mid = (pa.minX + pa.maxX) / 2;
        const smid = (s.minX + s.maxX) / 2;
        if (mid < smid) out.x = s.minX - halfW;
        else out.x = s.maxX + halfW;
        v.x = 0;
      } else {
        const mid = (pa.minZ + pa.maxZ) / 2;
        const smid = (s.minZ + s.maxZ) / 2;
        if (mid < smid) out.z = s.minZ - halfD;
        else out.z = s.maxZ + halfD;
        v.z = 0;
      }
      // 更新 pa 供下一 solid
      const npa = playerAabb(out, halfW, halfD, height);
      pa.minX = npa.minX; pa.maxX = npa.maxX;
      pa.minY = npa.minY; pa.maxY = npa.maxY;
      pa.minZ = npa.minZ; pa.maxZ = npa.maxZ;
    }
    if (!hit) break;
  }

  // 脚底贴地探测（小 epsilon）
  if (!grounded && v.y <= 0) {
    const probe = playerAabb({ x: out.x, y: out.y - 0.08, z: out.z }, halfW, halfD, height);
    for (const s of solids) {
      if (
        probe.minX < s.maxX && probe.maxX > s.minX &&
        probe.minZ < s.maxZ && probe.maxZ > s.minZ &&
        probe.minY < s.maxY && out.y + 0.05 >= s.maxY - 0.02 &&
        out.y <= s.maxY + 0.12
      ) {
        out.y = s.maxY;
        v.y = 0;
        grounded = true;
        break;
      }
    }
  }

  return { pos: out, vel: v, grounded };
}
