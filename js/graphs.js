// ── Graph drawing (inline SVG) ─────────────────────────────
// Used by questionBank.js to draw graphs inside question stems, MCQ options
// and FRQ model solutions. Every function returns an SVG string.
const GRAPH = (function() {
  const C = { ink: '#1b2a4a', grid: '#e0dbd2', bg: '#faf9f7', line: '#5ba4a4', accent: '#e8854a', muted: '#6e685e' };

  function open(w, h, maxW) {
    return `<svg class="q-graph" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${maxW}px;display:block;margin:8px auto;background:${C.bg};border:1px solid ${C.grid};border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
  }
  const fmt = v => Math.round(v * 100) / 100;

  // Square coordinate grid from min..max on both axes
  function grid(min, max, size, labelEvery) {
    const pad = 22, inner = size - 2 * pad, sc = inner / (max - min);
    const X = x => pad + (x - min) * sc;
    const Y = y => pad + (max - y) * sc;
    let s = '';
    for (let v = min; v <= max; v++) {
      s += `<line x1="${X(v)}" y1="${pad}" x2="${X(v)}" y2="${size - pad}" stroke="${C.grid}" stroke-width="1"/>`;
      s += `<line x1="${pad}" y1="${Y(v)}" x2="${size - pad}" y2="${Y(v)}" stroke="${C.grid}" stroke-width="1"/>`;
    }
    s += `<line x1="${pad - 8}" y1="${Y(0)}" x2="${size - pad + 8}" y2="${Y(0)}" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += `<line x1="${X(0)}" y1="${size - pad + 8}" x2="${X(0)}" y2="${pad - 8}" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += `<text x="${size - 8}" y="${Y(0) + 4}" font-size="11" font-style="italic" fill="${C.ink}">x</text>`;
    s += `<text x="${X(0) + 5}" y="12" font-size="11" font-style="italic" fill="${C.ink}">y</text>`;
    const step = labelEvery || 1;
    for (let v = min; v <= max; v++) {
      if (v === 0 || v % step !== 0) continue;
      s += `<text x="${X(v)}" y="${Y(0) + 11}" text-anchor="middle" font-size="8.5" fill="${C.muted}">${v}</text>`;
      s += `<text x="${X(0) - 4}" y="${Y(v) + 3}" text-anchor="end" font-size="8.5" fill="${C.muted}">${v}</text>`;
    }
    return { s, X, Y };
  }

  // Clip the infinite line through p and q to the box [min,max]²
  function clipLine(p, q, min, max) {
    const dx = q[0] - p[0], dy = q[1] - p[1];
    let t0 = -1e9, t1 = 1e9;
    const lim = (pp, d) => {
      if (d === 0) return pp >= min && pp <= max;
      let a = (min - pp) / d, b = (max - pp) / d;
      if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
      return t0 <= t1;
    };
    if (!lim(p[0], dx) || !lim(p[1], dy)) return null;
    return [[p[0] + t0 * dx, p[1] + t0 * dy], [p[0] + t1 * dx, p[1] + t1 * dy]];
  }

  function dot(X, Y, x, y, filled, color) {
    return `<circle cx="${fmt(X(x))}" cy="${fmt(Y(y))}" r="4" fill="${filled ? (color || C.ink) : C.bg}" stroke="${color || C.ink}" stroke-width="2"/>`;
  }

  // A line through two points, both points labelled (grid -5..5)
  function lineThroughPoints(points, min, max) {
    min = min ?? -5; max = max ?? 5;
    const size = 260, g = grid(min, max, size);
    let s = open(size, size, 280) + g.s;
    const seg = clipLine(points[0], points[1], min, max);
    if (seg) s += `<line x1="${fmt(g.X(seg[0][0]))}" y1="${fmt(g.Y(seg[0][1]))}" x2="${fmt(g.X(seg[1][0]))}" y2="${fmt(g.Y(seg[1][1]))}" stroke="${C.line}" stroke-width="2.5"/>`;
    points.forEach(([x, y]) => {
      s += dot(g.X, g.Y, x, y, true);
      const right = x < max - 2;
      s += `<text x="${fmt(g.X(x) + (right ? 7 : -7))}" y="${fmt(g.Y(y) - 7)}" text-anchor="${right ? 'start' : 'end'}" font-size="10.5" font-weight="700" fill="${C.ink}" stroke="${C.bg}" stroke-width="3" paint-order="stroke">(${x}, ${y})</text>`;
    });
    return s + '</svg>';
  }

  // y = |x - h| + k on a -6..6 grid
  function absoluteValueV(h, k, min, max) {
    min = min ?? -6; max = max ?? 6;
    const size = 260, g = grid(min, max, size, 2);
    let s = open(size, size, 280) + g.s;
    const l = clipLine([h, k], [h - 1, k + 1], min, max);
    const r = clipLine([h, k], [h + 1, k + 1], min, max);
    const top = seg => seg[0][1] > seg[1][1] ? seg[0] : seg[1];
    const pts = [top(l), [h, k], top(r)];
    s += `<polyline points="${pts.map(p => `${fmt(g.X(p[0]))},${fmt(g.Y(p[1]))}`).join(' ')}" fill="none" stroke="${C.line}" stroke-width="2.5"/>`;
    s += dot(g.X, g.Y, h, k, true);
    return s + '</svg>';
  }

  // Greatest integer step graph of y = ⟦x + h⟧ (closed left / open right unless reversed)
  function greatestIntegerSteps(h, reversed, min, max) {
    min = min ?? -4; max = max ?? 4;
    const size = 190, g = grid(min, max, size, 2);
    let s = open(size, size, 210) + g.s;
    for (let n = min - 1; n <= max; n++) {
      const x0 = n - h, x1 = n - h + 1;
      if (n < min || n > max || x1 <= min || x0 >= max) continue;
      const a = Math.max(x0, min), b = Math.min(x1, max);
      s += `<line x1="${fmt(g.X(a))}" y1="${fmt(g.Y(n))}" x2="${fmt(g.X(b))}" y2="${fmt(g.Y(n))}" stroke="${C.line}" stroke-width="2.5"/>`;
      if (x0 >= min) s += dot(g.X, g.Y, x0, n, !reversed);
      if (x1 <= max) s += dot(g.X, g.Y, x1, n, !!reversed);
    }
    return s + '</svg>';
  }

  function numberLineBase(min, max) {
    const w = 460, h = 64, pad = 30, y = 28, sc = (w - 2 * pad) / (max - min);
    const X = v => pad + (v - min) * sc;
    let s = open(w, h, 480);
    s += `<line x1="8" y1="${y}" x2="${w - 8}" y2="${y}" stroke="${C.ink}" stroke-width="1.6"/>`;
    s += `<polygon points="4,${y} 12,${y - 5} 12,${y + 5}" fill="${C.ink}"/><polygon points="${w - 4},${y} ${w - 12},${y - 5} ${w - 12},${y + 5}" fill="${C.ink}"/>`;
    for (let v = min; v <= max; v++) {
      s += `<line x1="${fmt(X(v))}" y1="${y - 5}" x2="${fmt(X(v))}" y2="${y + 5}" stroke="${C.ink}" stroke-width="1.2"/>`;
      s += `<text x="${fmt(X(v))}" y="${y + 20}" text-anchor="middle" font-size="11" fill="${C.ink}">${v}</text>`;
    }
    return { s, X, y, w };
  }
  function nlDot(X, y, v, closed) {
    return `<circle cx="${fmt(X(v))}" cy="${y}" r="5.5" fill="${closed ? C.ink : C.bg}" stroke="${C.ink}" stroke-width="2.2"/>`;
  }

  // Number line over range with an open/closed dot at point and a ray left/right
  function numberLineRay(range, point, dotType, direction) {
    const b = numberLineBase(range[0], range[1]);
    let s = b.s;
    const end = direction === 'left' ? 10 : b.w - 10;
    s += `<line x1="${fmt(b.X(point))}" y1="${b.y}" x2="${end}" y2="${b.y}" stroke="${C.line}" stroke-width="5"/>`;
    s += direction === 'left'
      ? `<polygon points="2,${b.y} 13,${b.y - 7} 13,${b.y + 7}" fill="${C.line}"/>`
      : `<polygon points="${b.w - 2},${b.y} ${b.w - 13},${b.y - 7} ${b.w - 13},${b.y + 7}" fill="${C.line}"/>`;
    s += nlDot(b.X, b.y, point, dotType === 'closed');
    return s + '</svg>';
  }

  // Number line with a shaded segment lo..hi (solution of an "and" inequality)
  function numberLineSegment(min, max, lo, loClosed, hi, hiClosed) {
    const b = numberLineBase(min, max);
    let s = b.s;
    s += `<line x1="${fmt(b.X(lo))}" y1="${b.y}" x2="${fmt(b.X(hi))}" y2="${b.y}" stroke="${C.line}" stroke-width="5"/>`;
    s += nlDot(b.X, b.y, lo, loClosed) + nlDot(b.X, b.y, hi, hiClosed);
    return s + '</svg>';
  }

  // Line through the two intercepts on a -6..6 grid, intercepts labelled
  function interceptLine(xInt, yInt, xLabel, yLabel) {
    const size = 280, g = grid(-6, 6, size, 2);
    let s = open(size, size, 300) + g.s;
    const seg = clipLine([xInt, 0], [0, yInt], -6, 6);
    if (seg) s += `<line x1="${fmt(g.X(seg[0][0]))}" y1="${fmt(g.Y(seg[0][1]))}" x2="${fmt(g.X(seg[1][0]))}" y2="${fmt(g.Y(seg[1][1]))}" stroke="${C.line}" stroke-width="2.5"/>`;
    s += dot(g.X, g.Y, xInt, 0, true, C.accent) + dot(g.X, g.Y, 0, yInt, true, C.accent);
    const xRight = xInt < 3;
    s += `<text x="${fmt(g.X(xInt) + (xRight ? 6 : -6))}" y="${fmt(g.Y(0) - 7)}" text-anchor="${xRight ? 'start' : 'end'}" font-size="10.5" font-weight="700" fill="${C.accent}" stroke="${C.bg}" stroke-width="3" paint-order="stroke">${xLabel}</text>`;
    s += `<text x="${fmt(g.X(0) + 6)}" y="${fmt(g.Y(yInt) + (yInt > 4 ? 14 : -7))}" font-size="10.5" font-weight="700" fill="${C.accent}" stroke="${C.bg}" stroke-width="3" paint-order="stroke">${yLabel}</text>`;
    return s + '</svg>';
  }

  // Discrete points (n, a_n) for an arithmetic sequence
  function sequencePoints(points, xLabel, yLabel) {
    const w = 320, h = 220, padL = 46, padB = 34, padT = 14, padR = 14;
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const xMax = Math.max(...xs) + 1;
    const yMaxRaw = Math.max(...ys, 0), yMinRaw = Math.min(...ys, 0);
    const niceStep = r => { const m = Math.pow(10, Math.floor(Math.log10(r))); return [1, 2, 2.5, 5, 10].map(k => k * m).find(k => r / k <= 5) || 10 * m; };
    const step = niceStep((yMaxRaw - yMinRaw) || 1);
    const yMax = Math.ceil(yMaxRaw / step) * step, yMin = Math.floor(yMinRaw / step) * step;
    const X = x => padL + x * (w - padL - padR) / xMax;
    const Y = y => padT + (yMax - y) * (h - padT - padB) / ((yMax - yMin) || 1);
    let s = open(w, h, 340);
    for (let v = yMin; v <= yMax + 1e-9; v += step) {
      s += `<line x1="${padL}" y1="${fmt(Y(v))}" x2="${w - padR}" y2="${fmt(Y(v))}" stroke="${C.grid}"/>`;
      s += `<text x="${padL - 5}" y="${fmt(Y(v) + 3)}" text-anchor="end" font-size="9" fill="${C.muted}">${fmt(v)}</text>`;
    }
    for (let x = 1; x < xMax; x++) s += `<text x="${fmt(X(x))}" y="${h - padB + 13}" text-anchor="middle" font-size="9" fill="${C.muted}">${x}</text>`;
    s += `<line x1="${padL}" y1="${fmt(Y(Math.max(yMin, 0)))}" x2="${w - padR}" y2="${fmt(Y(Math.max(yMin, 0)))}" stroke="${C.ink}" stroke-width="1.5"/>`;
    s += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="${C.ink}" stroke-width="1.5"/>`;
    s += `<text x="${(w + padL) / 2}" y="${h - 4}" text-anchor="middle" font-size="10" fill="${C.ink}">${xLabel}</text>`;
    s += `<text x="10" y="${h / 2}" text-anchor="middle" font-size="10" fill="${C.ink}" transform="rotate(-90 10 ${h / 2})">${yLabel}</text>`;
    points.forEach(([x, y]) => { s += `<circle cx="${fmt(X(x))}" cy="${fmt(Y(y))}" r="4" fill="${C.ink}"/>`; });
    return s + '</svg>';
  }

  return { lineThroughPoints, absoluteValueV, greatestIntegerSteps, numberLineRay, numberLineSegment, interceptLine, sequencePoints };
})();
