// ── Answer checker ──────────────────────────────────────────
// Independently recomputes each generated question from its LaTeX and
// confirms the stored answer is the only correct option. questionBank.js
// regenerates any instance that fails, so students never see a bad question.
const QCHECK = (function() {
  const EPS = 1e-7;
  const near = (a, b, e) => Math.abs(a - b) <= (e ?? EPS);

  // ── LaTeX → JS compiler ──────────────────────────────────
  function braceArg(s, i) {
    while (s[i] === ' ') i++;
    if (s[i] !== '{') return [s[i], i + 1];
    let depth = 0, j = i;
    for (; j < s.length; j++) {
      if (s[j] === '{') depth++;
      else if (s[j] === '}' && --depth === 0) break;
    }
    return [s.slice(i + 1, j), j + 1];
  }
  function expandFracs(s) {
    let out = '', i = 0;
    while (i < s.length) {
      const m = s.slice(i).match(/^\\[dt]?frac/);
      if (m) {
        const [a, i1] = braceArg(s, i + m[0].length);
        const [b, i2] = braceArg(s, i1);
        out += `((${expandFracs(a)})/(${expandFracs(b)}))`;
        i = i2;
      } else { out += s[i]; i++; }
    }
    return out;
  }
  function tokenize(tex) {
    let s = expandFracs(String(tex).replace(/\$/g, ''));
    s = s.replace(/\\left|\\right|\\,|\\;|\\!|\\displaystyle/g, '')
      .replace(/\\cdot|\\times/g, '*').replace(/−/g, '-').replace(/⟦/g, '\\llbracket').replace(/⟧/g, '\\rrbracket')
      .replace(/\\llbracket/g, 'F').replace(/\\rrbracket/g, ']')
      .replace(/\\leq?/g, '≤').replace(/\\geq?/g, '≥').replace(/<=/g, '≤').replace(/>=/g, '≥')
      .replace(/\{/g, '(').replace(/\}/g, ')');
    const toks = [];
    for (let i = 0; i < s.length;) {
      const c = s[i];
      if (c === ' ') { i++; continue; }
      const num = s.slice(i).match(/^\d+(\.\d+)?|^\.\d+/);
      if (num) { toks.push({ t: 'num', v: num[0] }); i += num[0].length; continue; }
      if (c === 'F') { toks.push({ t: 'fopen' }); i++; continue; }
      if (c === ']') { toks.push({ t: 'rp' }); i++; continue; }
      if (/[a-zA-Z]/.test(c)) { toks.push({ t: 'id', v: c }); i++; continue; }
      if ('+-*/'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
      if ('<>≤≥='.includes(c)) { toks.push({ t: 'cmp', v: c }); i++; continue; }
      if (c === '(') { toks.push({ t: 'lp' }); i++; continue; }
      if (c === ')') { toks.push({ t: 'rp' }); i++; continue; }
      if (c === '|') { toks.push({ t: 'bar' }); i++; continue; }
      throw new Error('Unexpected "' + c + '" in ' + tex);
    }
    // resolve | into open/close: it closes only when an absolute value is open
    // and the previous token ends a value
    let openBars = 0;
    toks.forEach((tk, i) => {
      if (tk.t !== 'bar') return;
      const p = toks[i - 1];
      const closes = openBars > 0 && p && ['num', 'id', 'rp'].includes(p.t);
      tk.t = closes ? 'rp' : 'aopen';
      openBars += closes ? -1 : 1;
    });
    return toks;
  }
  function emit(toks) {
    let out = '', prev = null;
    for (const tk of toks) {
      const startsValue = ['num', 'id', 'lp', 'fopen', 'aopen'].includes(tk.t);
      if (prev && ['num', 'id', 'rp'].includes(prev.t) && startsValue) out += '*';
      if (tk.t === 'num') out += tk.v;
      else if (tk.t === 'id') out += `V.${tk.v}`;
      else if (tk.t === 'fopen') out += 'Math.floor(';
      else if (tk.t === 'aopen') out += 'Math.abs(';
      else if (tk.t === 'lp') out += '(';
      else if (tk.t === 'rp') out += ')';
      else if (tk.t === 'op') out += tk.v;
      prev = tk;
    }
    return out;
  }
  // Split a token list at comparison operators → { parts: [fn...], ops: [...] }
  function compileChain(tex) {
    const toks = tokenize(tex);
    const parts = [[]], ops = [];
    let depth = 0;
    toks.forEach(tk => {
      if (['lp', 'fopen', 'aopen'].includes(tk.t)) depth++;
      if (tk.t === 'rp') depth--;
      if (tk.t === 'cmp' && depth === 0) { ops.push(tk.v); parts.push([]); }
      else parts[parts.length - 1].push(tk);
    });
    return { parts: parts.map(p => new Function('V', 'return (' + emit(p) + ');')), ops };
  }
  const CMP = { '<': (a, b) => a < b - 1e-12, '>': (a, b) => a > b + 1e-12, '≤': (a, b) => a <= b + 1e-12, '≥': (a, b) => a >= b - 1e-12, '=': (a, b) => near(a, b, 1e-9) };
  function expr(tex) { const c = compileChain(tex); return c.parts[0]; }
  function eqFn(tex) { // lhs - rhs
    const c = compileChain(tex);
    if (c.ops.length !== 1 || c.ops[0] !== '=') throw new Error('Not an equation: ' + tex);
    return V => c.parts[0](V) - c.parts[1](V);
  }
  // Predicate: chains joined by " or " / " and " (also \text{ or })
  function predicate(tex) {
    if (tex === 'none') return () => false;
    if (tex === 'all') return () => true;
    const s = String(tex).replace(/\$/g, '').replace(/\\text\{\s*(or|and)\s*\}/g, ' $1 ');
    const ors = s.split(/\s+or\s+/).map(part => part.split(/\s+and\s+/).map(ch => {
      const c = compileChain(ch);
      return V => c.ops.every((op, i) => CMP[op](c.parts[i](V), c.parts[i + 1](V)));
    }));
    return V => ors.some(ands => ands.every(f => f(V)));
  }

  // ── Numeric helpers ──────────────────────────────────────
  function roots(f, v, extra) {
    const at = x => { const V = {}; V[v] = x; return f(V); };
    const found = [];
    const add = x => { if (isFinite(x) && Math.abs(at(x)) < 1e-6 && !found.some(r => near(r, x, 1e-6))) found.push(x); };
    (extra || []).forEach(x => typeof x === 'number' && add(x));
    let px = -200, pf = at(px);
    for (let x = -200 + 0.1; x <= 200; x += 0.1) {
      const fx = at(x);
      if (isFinite(fx) && Math.abs(fx) < 1e-9) add(x);
      if (isFinite(fx) && isFinite(pf) && pf * fx < 0) {
        let a = px, b = x, fa = pf;
        for (let k = 0; k < 80; k++) { const m = (a + b) / 2, fm = at(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
        const r = (a + b) / 2;
        const rr = Math.round(r * 1e6) / 1e6;
        add(Math.abs(at(rr)) < Math.abs(at(r)) ? rr : r);
      }
      px = x; pf = fx;
    }
    return found;
  }
  function lineCoeffs(tex) { // A x + B y + C = 0 from an equation in x, y
    const f = eqFn(tex);
    const F = (x, y) => f({ x, y });
    const C0 = F(0, 0), A = F(1, 0) - C0, B = F(0, 1) - C0;
    [[2, 3], [-5, 7], [11, -4]].forEach(([x, y]) => { if (!near(F(x, y), A * x + B * y + C0, 1e-6)) throw new Error('Not linear: ' + tex); });
    return [A, B, C0];
  }
  const sameLine = (l1, l2) => near(l1[0] * l2[1], l1[1] * l2[0], 1e-6) && near(l1[0] * l2[2], l1[2] * l2[0], 1e-6) && near(l1[1] * l2[2], l1[2] * l2[1], 1e-6);
  const slopeOfLine = l => near(l[1], 0) ? 'undef' : -l[0] / l[1];
  const onLine = (l, [x, y]) => near(l[0] * x + l[1] * y + l[2], 0, 1e-6);
  const sameSet = (a, b) => a.length === b.length && a.every(x => b.some(y => near(x, y, 1e-6)));
  const samePairs = (a, b) => a.length === b.length && a.every(p => b.some(q => near(p[0], q[0]) && near(p[1], q[1])));
  function absVertex(f) { // vertex of an absolute value V given as V=>value of x
    let best = null;
    for (let x = -30; x <= 30; x += 0.5) { const y = f({ x }); if (!best || y < best[1] - 1e-9) best = [x, y]; }
    return best;
  }
  function relation(e1, e2) {
    const a = lineCoeffs(e1), b = lineCoeffs(e2);
    if (sameLine(a, b)) return 'same line';
    const m1 = slopeOfLine(a), m2 = slopeOfLine(b);
    if (m1 === 'undef' || m2 === 'undef') return m1 === m2 ? 'parallel' : ((m1 === 'undef' ? near(m2, 0) : near(m1, 0)) ? 'perpendicular' : 'neither');
    if (near(m1, m2)) return 'parallel';
    if (near(m1 * m2, -1)) return 'perpendicular';
    return 'neither';
  }

  // ── Option judges: return true when the option value is a correct answer ──
  const JUDGE = {
    eq(spec, val) {
      const f = eqFn(spec.eq);
      const nums = [].concat(val).filter(x => typeof x === 'number');
      const rs = roots(f, spec.v, nums);
      if (val === 'none') return rs.length === 0;
      if (Array.isArray(val)) return sameSet(val, rs);
      if (spec.tol) return rs.length === 1 && Math.abs(rs[0] - val) <= spec.tol + 1e-9;
      return rs.length === 1 && near(rs[0], val, 1e-6);
    },
    ineq(spec, val) {
      const stem = spec.js ? new Function('V', 'return (' + spec.js + ');') : predicate(spec.ineq);
      const opt = predicate(val);
      const pts = new Set();
      for (let x = -80; x <= 80; x += 0.25) pts.add(x);
      (String(spec.ineq || spec.js || '') + ' ' + val).replace(/\\[dt]?frac\{(\d+)\}\{(\d+)\}/g, (m, a, b) => ` ${a / b} `)
        .match(/\d+(\.\d+)?/g)?.forEach(n => { const k = +n; [k, -k, k / 2, -k / 2, k / 3, -k / 3].forEach(c => [c, c - 1e-6, c + 1e-6].forEach(p => pts.add(p))); });
      for (const x of pts) { const V = {}; V[spec.v] = x; if (stem(V) !== opt(V)) return false; }
      return true;
    },
    line(spec, val) {
      const l = lineCoeffs(val), t = spec;
      if (t.through && !t.through.every(p => onLine(l, p))) return false;
      if (t.slope !== undefined) { const m = slopeOfLine(l); if (t.slope === 'undef' ? m !== 'undef' : (m === 'undef' || !near(m, t.slope, 1e-6))) return false; }
      if (t.parallelTo) { const m = slopeOfLine(l), m2 = slopeOfLine(lineCoeffs(t.parallelTo)); if (m === 'undef' ? m2 !== 'undef' : (m2 === 'undef' || !near(m, m2, 1e-6))) return false; }
      if (t.perpTo) { const m = slopeOfLine(l), m2 = slopeOfLine(lineCoeffs(t.perpTo)); if (m === 'undef' || m2 === 'undef' || !near(m * m2, -1, 1e-6)) return false; }
      if (t.same && !sameLine(l, lineCoeffs(t.same))) return false;
      return true;
    },
    slope(spec, val) {
      const [[x1, y1], [x2, y2]] = spec.pts;
      if (x1 === x2) return val === 'undef';
      return typeof val === 'number' && near(val, (y2 - y1) / (x2 - x1), 1e-9);
    },
    fn(spec, val) { return typeof val === 'number' && near(expr(spec.f)({ x: spec.at }), val, 1e-9); },
    dil(spec, v) {
      const slope = v.dir === 'v' ? v.f : 1 / v.f;
      const consistent = (v.kind === 'stretch') === (v.f > 1) && v.steep === (slope > 1);
      return consistent && near(slope, spec.a, 1e-9);
    },
    absdesc(spec, v) { const [h, k] = absVertex(expr(spec.g)); return near(v.dx, h) && near(v.dy, k); },
    absvertex(spec, v) { const [h, k] = absVertex(expr(spec.g)); return near(v[0], h) && near(v[1], k); },
    absfn(spec, v) { // option is a function; target vertex (h,k) with slope ±1
      const f = expr(v), [h, k] = absVertex(f);
      return near(h, spec.vh) && near(k, spec.vk) && near(f({ x: h + 1 }) - k, 1) && near(f({ x: h - 1 }) - k, 1);
    },
    stepgraph(spec, v) {
      if (v.rev) return false;
      const a = expr(spec.f), b = expr(v.f);
      for (let x = -6; x <= 6; x += 0.125) if (!near(a({ x }), b({ x }))) return false;
      return true;
    },
    steptrans(spec, v) {
      const g = expr(spec.g), f = expr(spec.f);
      for (let x = -6; x <= 6; x += 0.125) {
        const t = (v.scale ?? 1) * f({ x: x - (v.dx ?? 0) }) + (v.dy ?? 0);
        if (!near(g({ x }), t)) return false;
      }
      return true;
    },
    noton(spec, p) { return !near(expr(spec.f)({ x: p[0] }), p[1]); },
    fact(spec, val) { return val === spec.answer; },
    range(spec, v) { return near(v[0], spec.c - spec.r, 1e-9) && near(v[1], spec.c + spec.r, 1e-9); },
    online(spec, v) {
      const y = expr(spec.f)({ x: spec.pt[0] });
      return near(v.y, y) && v.yes === near(y, spec.pt[1]);
    },
    collinear(spec, p) {
      const [[x1, y1], [x2, y2]] = spec.pts;
      return near((x2 - x1) * (p[1] - y1), (y2 - y1) * (p[0] - x1));
    },
    rel(spec, val) { return relation(spec.e1, spec.e2) === val; },
    inv(spec, val) { return samePairs(val, spec.rel.map(([x, y]) => [y, x])); },
    set(spec, val) { return Array.isArray(val) && sameSet(val, spec.ans); },
    translate(spec, val) { return val === spec.eq; }
  };
  // For translations we cannot recompute the meaning, but no distractor may
  // be an equivalent equation (same solution set as the correct one).
  function equivalentEq(a, b, v) {
    const ra = roots(eqFn(a), v), rb = roots(eqFn(b), v);
    return sameSet(ra, rb);
  }

  function checkMCQ(q) {
    const spec = q.verify;
    if (!spec || !JUDGE[spec.k]) return { ok: false, msg: 'no verify spec' };
    const texts = q.options.map(o => o.text);
    if (new Set(texts).size !== 4) return { ok: false, msg: 'duplicate options' };
    try {
      const flags = q.options.map(o => JUDGE[spec.k](spec, o.val));
      const nCorrect = flags.filter(Boolean).length;
      const idx = q.options.findIndex(o => o.correct);
      if (nCorrect !== 1 || !flags[idx]) return { ok: false, msg: `judge says correct=[${flags}] stored=${idx}` };
      if (spec.k === 'translate') {
        const c = q.options[idx].val;
        for (const o of q.options) if (!o.correct && equivalentEq(o.val, c, spec.v)) return { ok: false, msg: 'equivalent distractor ' + o.val };
      }
    } catch (e) { return { ok: false, msg: 'error: ' + e.message }; }
    return { ok: true };
  }
  // FRQ: each entry is { k, ...spec, val } and must judge true
  function checkFRQ(q) {
    try {
      for (const c of q.verify || []) {
        if (c.k === 'num') { if (!near(c.val, c.expect, 1e-9)) return { ok: false, msg: `num ${c.val} != ${c.expect}` }; continue; }
        if (c.k === 'formula') { // two expressions agree for random values of the variables
          const a = expr(c.a), b = expr(c.b);
          for (let t = 0; t < 6; t++) { const V = {}; c.vars.forEach((v, i) => V[v] = 1.7 + t * 1.3 + i * 2.1); if (!near(a(V), b(V), 1e-6)) return { ok: false, msg: 'formula mismatch ' + c.a }; }
          continue;
        }
        if (c.k === 'intercepts') {
          const l = lineCoeffs(c.eq);
          if (!near(-l[2] / l[0], c.val[0], 1e-9) || !near(-l[2] / l[1], c.val[1], 1e-9)) return { ok: false, msg: 'intercepts ' + c.eq };
          continue;
        }
        if (!JUDGE[c.k](c, c.val)) return { ok: false, msg: `frq ${c.k} failed ${JSON.stringify(c.val)}` };
      }
    } catch (e) { return { ok: false, msg: 'error: ' + e.message }; }
    return { ok: true };
  }

  return { checkMCQ, checkFRQ, expr, eqFn, predicate, lineCoeffs, relation };
})();
if (typeof module !== 'undefined') module.exports = QCHECK;
