// --------- Ultra-optimized connector helpers ---------

export function getCenter(o) {
  if (!o) return { x: 0, y: 0 };

  if (o.type === "sticky" || o.type === "rect") {
    return { x: o.x + o.width / 2, y: o.y + o.height / 2 };
  }

  if (o.type === "circle") {
    return { x: o.x, y: o.y };
  }

  return { x: o.x, y: o.y };
}

// ---- rectangle intersection (fast version) ----
function intersectRect(cx, cy, tx, ty, rect) {
  const dx = tx - cx;
  const dy = ty - cy;

  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;

  const t = [];

  if (dx !== 0) {
    const t1 = (left - cx) / dx;
    const y1 = cy + t1 * dy;
    if (t1 > 0 && y1 >= top && y1 <= bottom) t.push({ t: t1, x: left, y: y1 });

    const t2 = (right - cx) / dx;
    const y2 = cy + t2 * dy;
    if (t2 > 0 && y2 >= top && y2 <= bottom) t.push({ t: t2, x: right, y: y2 });
  }

  if (dy !== 0) {
    const t3 = (top - cy) / dy;
    const x3 = cx + t3 * dx;
    if (t3 > 0 && x3 >= left && x3 <= right) t.push({ t: t3, x: x3, y: top });

    const t4 = (bottom - cy) / dy;
    const x4 = cx + t4 * dx;
    if (t4 > 0 && x4 >= left && x4 <= right) t.push({ t: t4, x: x4, y: bottom });
  }

  if (t.length === 0) return { x: cx, y: cy };

  t.sort((a, b) => a.t - b.t);
  return t[0];
}

// ---- circle intersection (fast version) ----
function intersectCircle(cx, cy, tx, ty, r) {
  const dx = tx - cx;
  const dy = ty - cy;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: cx, y: cy };

  const ux = dx / len;
  const uy = dy / len;

  return { x: cx + ux * r, y: cy + uy * r };
}

// -------- MAIN API --------
export function connectPoints(start, end) {
  if (!start || !end) return [0, 0, 0, 0];

  const cs = getCenter(start);
  const ce = getCenter(end);

  let p1, p2;

  if (start.type === "sticky" || start.type === "rect") {
    p1 = intersectRect(cs.x, cs.y, ce.x, ce.y, {
      x: start.x,
      y: start.y,
      width: start.width,
      height: start.height,
    });
  } else if (start.type === "circle") {
    p1 = intersectCircle(cs.x, cs.y, ce.x, ce.y, start.radius);
  } else {
    p1 = cs;
  }

  if (end.type === "sticky" || end.type === "rect") {
    p2 = intersectRect(ce.x, ce.y, cs.x, cs.y, {
      x: end.x,
      y: end.y,
      width: end.width,
      height: end.height,
    });
  } else if (end.type === "circle") {
    p2 = intersectCircle(ce.x, ce.y, cs.x, cs.y, end.radius);
  } else {
    p2 = ce;
  }

  return [p1.x, p1.y, p2.x, p2.y];
}
