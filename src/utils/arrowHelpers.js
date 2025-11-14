// src/utils/arrowHelpers.js
// --------- Ultra-optimized connector helpers ---------

// --- THIS IS THE CORRECTED LOGIC ---
export function getCenter(o) {
  if (!o) return { x: 0, y: 0 };

  switch (o.type) {
    // These types have (x,y) as their center
    case "circle":
    case "image":
    case "sticky":
      return { x: o.x, y: o.y };

    // These types have (x,y) as their top-left
    case "rect":
    case "text":
      return { x: o.x + (o.width || 0) / 2, y: o.y + (o.height || 0) / 2 };

    // Fallback
    default:
      return { x: o.x || 0, y: o.y || 0 };
  }
}
// --- END OF CORRECTION ---

// ---- rectangle intersection (fast version) ----
function intersectRect(cx, cy, tx, ty, rect) {
  const dx = tx - cx;
  const dy = ty - cy;
  
  if (dx === 0 && dy === 0) return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }; // Point is center, return center

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

  if (t.length === 0) return { x: cx, y: cy }; // No intersection, return center (shouldn't happen if target is outside)

  t.sort((a, b) => a.t - b.t);
  return t[0];
}

// ---- circle intersection (fast version) ----
function intersectCircle(cx, cy, tx, ty, r) {
  const dx = tx - cx;
  const dy = ty - cy;
  const len = Math.hypot(dx, dy);
  if (len === 0) return { x: cx, y: cy }; // Point is center

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

  // Calculate Start Point (p1)
  if (start.type === "sticky" || start.type === "rect" || start.type === "text" || start.type === "image") {
    // --- FIX: Use correct dimensions ---
    const width = start.type === 'image' ? start.width / 2 : (start.width || 0);
    const height = start.type === 'image' ? start.height / 2 : (start.height || 0);
    const x = start.type === 'image' || start.type === 'sticky' ? start.x - start.width / 2 : start.x;
    const y = start.type === 'image' || start.type === 'sticky' ? start.y - start.height / 2 : start.y;

    p1 = intersectRect(cs.x, cs.y, ce.x, ce.y, {
      x: x,
      y: y,
      width: start.width,
      height: start.height,
    });
  } else if (start.type === "circle") {
    p1 = intersectCircle(cs.x, cs.y, ce.x, ce.y, start.radius);
  } else {
    p1 = cs; // Fallback for point or unknown
  }

  // Calculate End Point (p2)
  if (end.type === "sticky" || end.type === "rect" || end.type === "text" || end.type === "image") {
    // --- FIX: Use correct dimensions ---
    const width = end.type === 'image' ? end.width / 2 : (end.width || 0);
    const height = end.type === 'image' ? end.height / 2 : (end.height || 0);
    const x = end.type === 'image' || end.type === 'sticky' ? end.x - end.width / 2 : end.x;
    const y = end.type === 'image' || end.type === 'sticky' ? end.y - end.height / 2 : end.y;

    p2 = intersectRect(ce.x, ce.y, cs.x, cs.y, {
      x: x,
      y: y,
      width: end.width,
      height: end.height,
    });
  } else if (end.type === "circle") {
    p2 = intersectCircle(ce.x, ce.y, cs.x, cs.y, end.radius);
  } else {
    p2 = ce; // Fallback for point or unknown
  }

  return [p1.x, p1.y, p2.x, p2.y];
}