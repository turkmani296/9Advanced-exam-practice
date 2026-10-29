// ── Question Bank ── EOT Grade 9 Advanced Mathematics ──────
// Built from the teacher's approved Question Booklet (question_bank.json).
// Each set lists its patterns from easy to hard. A pattern is a function of a
// seeded RNG that returns one question with new numbers. The runner:
//   • rejects any instance whose numbers repeat a booklet question,
//   • rejects any instance that fails the independent answer check (verify.js),
//   • places the correct letters so each 12-question set uses A–D three times each,
//   • builds hint 3 as a fully worked example with different numbers.
// 20 MCQ sets × 12 + 5 FRQ sets × 5 = 265 questions.

// ── Seeded RNG ─────────────────────────────────────────────
function seededRandom(seed) {
  let s = Math.abs(seed | 0) || 1;
  function next() {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  }
  return {
    next,
    nextInt(min, max) { return min + Math.floor(next() * (max - min + 1)); },
    pick(arr) { return arr[Math.floor(next() * arr.length)]; },
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    nz(min, max) { let v; do { v = min + Math.floor(next() * (max - min + 1)); } while (v === 0); return v; },
    sign() { return next() < 0.5 ? -1 : 1; }
  };
}

// ── Formatting helpers ─────────────────────────────────────
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); return b === 0 ? a : gcd(b, a % b); }
const VARS = ['x', 'y', 'n', 'm', 'k', 'a', 'p', 't', 'w', 'd', 'z', 'r', 'b', 'c', 'g', 'h', 'q', 's', 'v'];
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function words(n) {
  if (n < 0) return 'negative ' + words(-n);
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
}
const cap = s => s[0].toUpperCase() + s.slice(1);
const pm = n => n < 0 ? `-${-n}` : `+${n}`;                       // "+5" / "-5"
function num(x) { const v = Math.round(x * 10000) / 10000; return String(Object.is(v, -0) ? 0 : v); }
function num2(x) { const v = Math.round(x * 100) / 100; return String(Object.is(v, -0) ? 0 : v); }
// a·v as the leading term
function lead(a, v) { return a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`; }
// a·v as a following term
function next(a, v) { return a === 1 ? `+${v}` : a === -1 ? `-${v}` : a < 0 ? `${a}${v}` : `+${a}${v}`; }
// a·v + b
function lin(a, v, b) { if (a === 0) return String(b); return lead(a, v) + (b ? pm(b) : ''); }
// b + a·v (constant first)
function linC(b, a, v) { return String(b) + next(a, v); }

// Rationals {n, d, v}
function rat(n, d = 1) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g, v: n / d };
}
const rAdd = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
const rSub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
const rMul = (a, b) => rat(a.n * b.n, a.d * b.d);
const rDiv = (a, b) => rat(a.n * b.d, a.d * b.n);
const rI = n => rat(n, 1);
function rs(r, cmd) { // LaTeX for a rational
  cmd = cmd || '\\dfrac';
  if (r.d === 1) return String(r.n);
  return (r.n < 0 ? '-' : '') + `${cmd}{${Math.abs(r.n)}}{${r.d}}`;
}
const ts = r => rs(r, '\\tfrac');
// rational coefficient term for a variable
function rLead(m, v) { if (m.n === 0) return ''; if (m.d === 1) return lead(m.n, v); return `${ts(m)}${v}`; }
function rNext(c) { if (c.n === 0) return ''; return c.n < 0 ? `-${ts(rat(-c.n, c.d))}` : `+${ts(c)}`; }
// y = m x + b with rational m, b
function lineY(m, b) {
  if (m.n === 0) return `y=${ts(b)}`;
  return `y=${rLead(m, 'x')}${rNext(b)}`;
}
// value option for a solution v = r
function sol(v, r) { return `$${v}=${rs(r)}$`; }
function setTex(vals) {
  if (!vals.length) return '$\\varnothing$';
  const s = [...vals].sort((a, b) => a.v - b.v).map(r => ts(r));
  return vals.length > 1 && s.some(t => t.includes('frac')) ? `$\\left\\{${s.join(', ')}\\right\\}$` : `$\\{${s.join(', ')}\\}$`;
}

// ── Runner ─────────────────────────────────────────────────
const QUESTION_BANK = {};
const LETTERS = ['A', 'B', 'C', 'D'];
const BOOK_SIGS = (typeof BOOKLET_SIGNATURES !== 'undefined') ? BOOKLET_SIGNATURES : {};
// Signature: sorted list of every number in the stem and correct answer.
// Two questions with the same signature use the same numbers.
function numSig(s) {
  return (String(s).replace(/<svg[\s\S]*?<\/svg>/g, '').match(/-?\d+(?:\.\d+)?/g) || [])
    .map(Number).sort((a, b) => a - b).join(',');
}
const sigOf = q => numSig(q.sig !== undefined ? q.sig : `${q.stem} ${q.correct}`);
const mod = x => ((x % 2147483647) + 2147483647) % 2147483647;
// Inside $…$, write "<" as \lt so the HTML parser cannot read "<x" as a tag
function safeMath(s) {
  if (typeof s !== 'string') return s;
  let out = '', inMath = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '$' && s[i - 1] !== '\\') inMath = !inMath;
    out += (inMath && c === '<') ? '\\lt ' : c;
  }
  return out;
}
const INSTR = t => `<span style="display:block;font-size:.85rem;color:#6e685e;margin-bottom:6px">${t}</span>`;

// Balanced correct-letter positions for a set (each letter used n/4 times)
function slotFor(tile, setSeed, i, n) {
  const r = seededRandom(mod(setSeed) + tile * 7919);
  const arr = [];
  for (let k = 0; k < n; k++) arr.push(k % 4);
  return r.shuffle(arr)[i];
}

function mcqInstance(tile, pat, base, avoidSig, avoidText) {
  for (let t = 0; t < 120; t++) {
    let q;
    try { q = pat(seededRandom(mod(base + t * 7919))); } catch (e) { continue; }
    if (!q) continue;
    const sig = sigOf(q);
    if ((BOOK_SIGS[tile] || []).includes(sig) || sig === avoidSig || (avoidText && (q.text || q.stem) === avoidText)) continue;
    const chosen = [], seen = new Set([q.correct]);
    for (const w of q.wrongs) {
      if (chosen.length === 3) break;
      if (!w || seen.has(w[0])) continue;
      if (typeof q.cv === 'number' && typeof w[2] === 'number' && Math.abs(w[2] - q.cv) < 1e-9) continue;
      seen.add(w[0]);
      chosen.push(w);
    }
    if (chosen.length < 3) continue;
    const opts = [{ text: q.correct, val: q.cv, correct: true }, ...chosen.map(w => ({ text: w[0], val: w[2], correct: false }))];
    if (typeof QCHECK !== 'undefined' && !QCHECK.checkMCQ({ options: opts, verify: q.verify }).ok) continue;
    return { q, wrongs: chosen, sig };
  }
  return null;
}

function makeMCQ(tile, pat, i, n, seed, set) {
  const main = mcqInstance(tile, pat, seed * 31 + i * 1009 + tile * 97);
  if (!main) return null;
  // worked example: prefer different numbers, else at least a different question
  const exBase = seed * 17 + i * 331 + 12345;
  const ex = mcqInstance(tile, pat, exBase, main.sig) || mcqInstance(tile, pat, exBase, null, main.q.text || main.q.stem);
  const q = main.q;
  const slot = slotFor(tile, seed - i * 7, i, n);
  const wr = seededRandom(mod(seed + 77 + i)).shuffle(main.wrongs);
  const options = [];
  for (let p = 0, w = 0; p < 4; p++) {
    if (p === slot) options.push({ letter: LETTERS[p], text: safeMath(q.correct), val: q.cv, correct: true, whyWrong: '' });
    else { const [text, why, val] = wr[w++]; options.push({ letter: LETTERS[p], text: safeMath(text), val, correct: false, whyWrong: safeMath(why) }); }
  }
  const hints = [
    (q.hints && q.hints[0]) || set.tips[0],
    (q.hints && q.hints[1]) || set.tips[1],
    ex ? `<b>Worked example:</b> ${ex.q.text || ex.q.stem}<br>${ex.q.steps.join('<br>')}<br>Answer: ${ex.q.correct}` : set.tips[1]
  ].map(safeMath);
  return {
    text: safeMath(INSTR(q.instr || set.instr) + (q.text || q.stem)),
    options, hints,
    explanation: safeMath(q.steps.join('<br>')),
    verify: q.verify, level: q.level, sig: main.sig
  };
}

// The app regenerates the set on every screen render, so remember recent results
function memo(fn) {
  const cache = new Map();
  return seed => {
    if (!cache.has(seed)) {
      if (cache.size > 100) cache.clear();
      cache.set(seed, fn(seed));
    }
    return cache.get(seed);
  };
}

function buildMCQ(tile, set) {
  QUESTION_BANK[tile] = {
    tile, type: 'mcq',
    questions: set.patterns.map((pat, i) => ({
      id: `q${tile}_${i + 1}`,
      generate: memo(seed => makeMCQ(tile, pat, i, set.patterns.length, seed, set))
    }))
  };
}

function frqInstance(tile, pat, base, avoidSig) {
  for (let t = 0; t < 120; t++) {
    let q;
    try { q = pat(seededRandom(mod(base + t * 7919))); } catch (e) { continue; }
    if (!q) continue;
    const sig = numSig(`${q.stem} ${q.final}`);
    if ((BOOK_SIGS[tile] || []).includes(sig) || sig === avoidSig) continue;
    if (typeof QCHECK !== 'undefined' && !QCHECK.checkFRQ(q).ok) continue;
    return { q, sig };
  }
  return null;
}

function buildFRQ(tile, set) {
  QUESTION_BANK[tile] = {
    tile, type: 'frq',
    questions: set.patterns.map((pat, i) => ({
      id: `q${tile}_${i + 1}`,
      generate: memo(seed => {
        const main = frqInstance(tile, pat, seed * 31 + i * 1009 + tile * 97);
        if (!main) return null;
        const ex = frqInstance(tile, pat, seed * 17 + i * 331 + 12345, main.sig);
        const q = main.q;
        return {
          text: safeMath(INSTR(q.instr || set.instr) + q.text),
          fields: q.fields.map(f => ({ ...f, label: safeMath(f.label), correct: safeMath(f.correct), correctDisplay: safeMath(f.correctDisplay) })),
          modelSolution: safeMath(q.solution),
          explanation: safeMath(q.explanation),
          hints: [
            (q.hints && q.hints[0]) || set.tips[0],
            (q.hints && q.hints[1]) || set.tips[1],
            ex ? `<b>Worked example:</b> ${ex.q.text}<br>${ex.q.solution}` : set.tips[1]
          ].map(safeMath),
          hasNumberLine: !!q.numberLine, numberLineConfig: q.numberLine,
          hasCoordGrid: !!q.coordGrid, coordConfig: q.coordGrid,
          verify: q.verify, level: q.level, sig: main.sig
        };
      })
    }))
  };
}

// Option builders: [text, whyWrong, value]
const W = (v, r, why) => [sol(v, r), why, r.v];
const EQ = (eq, why) => [`$${eq}$`, why, eq];

// ═══════════════════════════════════════════════════════════
// Q1 · L 2-1 · Translate sentences into equations (p.71)
// ═══════════════════════════════════════════════════════════
(function() {
  const T = (r, level, v, stem, correct, wrongs, steps) => ({
    level, stem, correct: `$${correct}$`, cv: correct, wrongs, steps,
    verify: { k: 'translate', v, eq: correct }
  });
  const P = [
    // L1 · "b more than a number is c"
    r => { const v = r.pick(VARS), b = r.nextInt(2, 15), c = r.nextInt(b + 3, 45);
      return T(r, 1, v, `${cap(words(b))} more than a number $${v}$ is ${c}.`, `${v}+${b}=${c}`, [
        EQ(`${b}${v}=${c}`, '"More than" means add, not multiply.'),
        EQ(`${v}-${b}=${c}`, '"More than" means add — this subtracts.'),
        EQ(`${v}=${b}+${c}`, `The ${b} is added to the number, so it belongs on the same side as $${v}$.`)
      ], [`"${b} more than a number" → $${v}+${b}$.`, `"is ${c}" → $=${c}$.`, `Equation: $${v}+${b}=${c}$.`]); },
    // L1 · "b less than a number equals c"
    r => { const v = r.pick(VARS), b = r.nextInt(2, 15), c = r.nextInt(5, 45);
      return T(r, 1, v, `${cap(words(b))} less than a number $${v}$ equals ${c}.`, `${v}-${b}=${c}`, [
        EQ(`${b}-${v}=${c}`, '"Less than" reverses the order: the number comes first.'),
        EQ(`${v}+${b}=${c}`, '"Less than" means subtract, not add.'),
        EQ(`${c}-${v}=${b}`, 'The sentence starts from the number, then takes away the amount.')
      ], [`"${b} less than a number" → $${v}-${b}$ (start with the number, then subtract).`, `"equals ${c}" → $=${c}$.`, `Equation: $${v}-${b}=${c}$.`]); },
    // L2 · "a added to k times a number is the same as c"
    r => { const v = r.pick(VARS), k = r.nextInt(2, 9), a = r.nextInt(2, 12), c = r.nextInt(12, 60); if (a === k) return null;
      return T(r, 2, v, `${cap(words(a))} added to ${words(k)} times a number $${v}$ is the same as ${c}.`, `${k}${v}+${a}=${c}`, [
        EQ(`${k}(${v}+${a})=${c}`, `Only the number is multiplied by ${k}; the ${a} is added afterwards, so no brackets.`),
        EQ(`${k}+${v}+${a}=${c}`, '"Times" means multiply, not add.'),
        EQ(`${k}${v}=${a}+${c}`, `The ${a} is added to $${k}${v}$, so it stays on the left side.`)
      ], [`"${k} times a number" → $${k}${v}$.`, `"${a} added to" it → $${k}${v}+${a}$.`, `"is the same as ${c}" → $${k}${v}+${a}=${c}$.`]); },
    // L2 · "the product of k and the sum of a number and a is c"
    r => { const v = r.pick(VARS), k = r.nextInt(2, 9), a = r.nextInt(2, 9), c = r.nextInt(10, 60); if (a === k) return null;
      return T(r, 2, v, `The product of ${words(k)} and the sum of a number $${v}$ and ${words(a)} is ${words(c)}.`, `${k}(${v}+${a})=${c}`, [
        EQ(`${k}${v}+${a}=${c}`, `"The sum" must stay together in brackets before multiplying by ${k}.`),
        EQ(`${k}+(${v}+${a})=${c}`, '"Product" means multiply, not add.'),
        EQ(`${a}(${v}+${k})=${c}`, `The ${k} multiplies the sum of $${v}$ and ${a} — the numbers were swapped.`)
      ], [`"the sum of a number and ${a}" → $(${v}+${a})$.`, `"the product of ${k} and" the sum → $${k}(${v}+${a})$.`, `Equation: $${k}(${v}+${a})=${c}$.`]); },
    // L2 · "the quotient of c and v equals d minus k times v"
    r => { const v = r.pick(VARS), c = r.nextInt(10, 48), d = r.nextInt(5, 20), k = r.nextInt(2, 6);
      return T(r, 2, v, `The quotient of ${c} and $${v}$ equals ${d} minus ${k} times $${v}$.`, `\\dfrac{${c}}{${v}}=${d}-${k}${v}`, [
        EQ(`\\dfrac{${v}}{${c}}=${d}-${k}${v}`, `"The quotient of ${c} and $${v}$" puts ${c} on top.`),
        EQ(`\\dfrac{${c}}{${v}}=${k}${v}-${d}`, `"${d} minus ${k} times $${v}$" starts with ${d}.`),
        EQ(`${c}${v}=${d}-${k}${v}`, '"Quotient" means divide, not multiply.')
      ], [`"The quotient of ${c} and $${v}$" → $\\dfrac{${c}}{${v}}$.`, `"${d} minus ${k} times $${v}$" → $${d}-${k}${v}$.`, `Equation: $\\dfrac{${c}}{${v}}=${d}-${k}${v}$.`]); },
    // L2 · "k times a number decreased by b is the same as c"
    r => { const v = r.pick(VARS), k = r.nextInt(2, 9), b = r.nextInt(2, 15), c = r.nextInt(8, 50); if (b === k) return null;
      return T(r, 2, v, `${cap(words(k))} times a number $${v}$ decreased by ${b} is the same as ${c}.`, `${k}${v}-${b}=${c}`, [
        EQ(`${k}(${v}-${b})=${c}`, `Only the number is multiplied by ${k}; then ${b} is subtracted — no brackets.`),
        EQ(`${b}-${k}${v}=${c}`, `"Decreased by ${b}" means subtract ${b} from $${k}${v}$, not the other way.`),
        EQ(`${k}${v}+${b}=${c}`, '"Decreased by" means subtract, not add.')
      ], [`"${k} times a number" → $${k}${v}$.`, `"decreased by ${b}" → $${k}${v}-${b}$.`, `Equation: $${k}${v}-${b}=${c}$.`]); },
    // L2 · "the quotient of v and k is equal to a more than v"
    r => { const v = r.pick(VARS), k = r.nextInt(2, 9), a = r.nextInt(2, 12); if (a === k) return null;
      return T(r, 2, v, `The quotient of a number $${v}$ and ${words(k)} is equal to ${words(a)} more than $${v}$.`, `\\dfrac{${v}}{${k}}=${v}+${a}`, [
        EQ(`\\dfrac{${k}}{${v}}=${v}+${a}`, `"The quotient of $${v}$ and ${k}" puts $${v}$ on top.`),
        EQ(`\\dfrac{${v}}{${k}}=${a}${v}`, `"${a} more than $${v}$" means add ${a}, not multiply.`),
        EQ(`\\dfrac{${v}}{${k}}+${a}=${v}`, `The ${a} is added to $${v}$ on the right side, not to the quotient.`)
      ], [`"The quotient of $${v}$ and ${k}" → $\\dfrac{${v}}{${k}}$.`, `"${a} more than $${v}$" → $${v}+${a}$.`, `Equation: $\\dfrac{${v}}{${k}}=${v}+${a}$.`]); },
    // L2 · "k times the sum of a number and a is c"
    r => { const v = r.pick(VARS), k = r.nextInt(2, 9), a = r.nextInt(2, 12), c = r.nextInt(20, 90); if (a === k) return null;
      return T(r, 2, v, `${cap(words(k))} times the sum of a number $${v}$ and ${a} is ${c}.`, `${k}(${v}+${a})=${c}`, [
        EQ(`${k}${v}+${a}=${c}`, `"Times the sum" multiplies the whole sum, so it needs brackets.`),
        EQ(`${k}+(${v}+${a})=${c}`, '"Times" means multiply, not add.'),
        EQ(`${a}(${v}+${k})=${c}`, `The ${k} multiplies the sum of $${v}$ and ${a} — the numbers were swapped.`)
      ], [`"the sum of a number and ${a}" → $(${v}+${a})$.`, `"${k} times the sum" → $${k}(${v}+${a})$.`, `Equation: $${k}(${v}+${a})=${c}$.`]); },
    // L3 · "k times a number subtracted from c is m times the sum of a and v"
    r => { const v = r.pick(VARS), k = r.nextInt(2, 9), c = r.nextInt(30, 99), m = r.nextInt(2, 9), a = r.nextInt(2, 9); if (m === k || a === m) return null;
      return T(r, 3, v, `${cap(words(k))} times a number $${v}$ subtracted from ${c} is ${words(m)} times the sum of ${words(a)} and $${v}$.`, `${c}-${k}${v}=${m}(${a}+${v})`, [
        EQ(`${k}${v}-${c}=${m}(${a}+${v})`, `"Subtracted from ${c}" means start with ${c} and take away $${k}${v}$.`),
        EQ(`${c}-${k}${v}=${m}\\cdot ${a}+${v}`, `"${m} times the sum" needs brackets around $${a}+${v}$.`),
        EQ(`${k}(${v}-${c})=${m}(${a}+${v})`, `Only $${v}$ is multiplied by ${k}, and it is subtracted from ${c}.`)
      ], [`"${k} times a number subtracted from ${c}" → $${c}-${k}${v}$.`, `"${m} times the sum of ${a} and $${v}$" → $${m}(${a}+${v})$.`, `Equation: $${c}-${k}${v}=${m}(${a}+${v})$.`]); },
    // L3 · "k times a number subtracted from c is the same as m times v"
    r => { const v = r.pick(VARS), k = r.nextInt(2, 9), c = r.nextInt(20, 90), m = r.nextInt(2, 9); if (m === k) return null;
      return T(r, 3, v, `${cap(words(k))} times a number $${v}$ subtracted from ${c} is the same as ${words(m)} times $${v}$.`, `${c}-${k}${v}=${m}${v}`, [
        EQ(`${k}${v}-${c}=${m}${v}`, `"Subtracted from ${c}" means ${c} comes first.`),
        EQ(`${k}(${c}-${v})=${m}${v}`, `Only $${v}$ is multiplied by ${k}, not the difference.`),
        EQ(`${c}-${k}${v}=${v}+${m}`, `"${m} times $${v}$" means multiply, not add.`)
      ], [`"${k} times a number subtracted from ${c}" → $${c}-${k}${v}$.`, `"${m} times $${v}$" → $${m}${v}$.`, `Equation: $${c}-${k}${v}=${m}${v}$.`]); },
    // L3 · "the difference of c and k times a number equals the quotient of v and a"
    r => { const v = r.pick(VARS), c = r.nextInt(10, 60), k = r.nextInt(2, 5), a = r.nextInt(2, 9); if (a === k) return null;
      const kw = k === 2 ? 'twice' : `${words(k)} times`;
      return T(r, 3, v, `The difference of ${c} and ${kw} a number $${v}$ equals the quotient of $${v}$ and ${words(a)}.`, `${c}-${k}${v}=\\dfrac{${v}}{${a}}`, [
        EQ(`${k}${v}-${c}=\\dfrac{${v}}{${a}}`, `"The difference of ${c} and …" starts with ${c}.`),
        EQ(`${c}-${k}${v}=\\dfrac{${a}}{${v}}`, `"The quotient of $${v}$ and ${a}" puts $${v}$ on top.`),
        EQ(`${k}(${c}-${v})=\\dfrac{${v}}{${a}}`, `Only $${v}$ is multiplied by ${k}, not the whole difference.`)
      ], [`"The difference of ${c} and ${kw} a number" → $${c}-${k}${v}$.`, `"the quotient of $${v}$ and ${a}" → $\\dfrac{${v}}{${a}}$.`, `Equation: $${c}-${k}${v}=\\dfrac{${v}}{${a}}$.`]); },
    // L3 · "b less than the product of k and a number is m times the difference of v and e"
    r => { const v = r.pick(VARS), b = r.nextInt(2, 12), k = r.nextInt(2, 9), m = r.nextInt(2, 9), e = r.nextInt(2, 9); if (m === k || b === k || e === b) return null;
      return T(r, 3, v, `${cap(words(b))} less than the product of ${k} and a number $${v}$ is equal to ${words(m)} times the difference of $${v}$ and ${e}.`, `${k}${v}-${b}=${m}(${v}-${e})`, [
        EQ(`${b}-${k}${v}=${m}(${v}-${e})`, `"${b} less than …" means subtract ${b} from the product.`),
        EQ(`${k}(${v}-${b})=${m}(${v}-${e})`, `Only $${v}$ is multiplied by ${k}; then ${b} is subtracted.`),
        EQ(`${k}${v}-${b}=${m}${v}-${e}`, `"${m} times the difference" multiplies both terms — brackets are needed.`)
      ], [`"the product of ${k} and a number" → $${k}${v}$; "${b} less than" it → $${k}${v}-${b}$.`, `"${m} times the difference of $${v}$ and ${e}" → $${m}(${v}-${e})$.`, `Equation: $${k}${v}-${b}=${m}(${v}-${e})$.`]); }
  ];
  buildMCQ(1, {
    instr: 'Choose the equation that represents the sentence.',
    tips: ['Translate one phrase at a time: "is", "equals" and "is the same as" mean $=$.',
      '"Less than" and "subtracted from" reverse the order. "The sum/difference of …" stays together in brackets when it is multiplied.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q2 · L 2-3 · Solve multi-step equations (p.88, Ex. 1–12)
// ═══════════════════════════════════════════════════════════
(function() {
  const Q = (level, v, eq, x, wrongs, steps) => ({
    level, stem: `$${eq}$`, correct: sol(v, x), cv: x.v, wrongs, steps: [...steps, `$${v}=${rs(x)}$`],
    verify: { k: 'eq', v, eq }
  });
  const P = [
    // L1 · a v + b = c
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), x = r.nz(-9, 9), b = r.nz(-15, 15), c = a * x + b;
      return Q(1, v, `${lin(a, v, b)}=${c}`, rI(x), [
        W(v, rI(-x), 'Sign error in the last step.'),
        W(v, rat(c + b, a), `Used the wrong inverse operation on the constant: you must ${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)}.`),
        W(v, rI((c - b) * a), `Multiplied by ${a} instead of dividing.`)
      ], [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} on both sides: $${a}${v}=${c - b}$.`, `Divide both sides by ${a}.`]); },
    // L1 · c = d + a v
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), x = r.nz(-9, 9), d = r.nz(-20, 20), c = d + a * x;
      return Q(1, v, `${c}=${linC(d, a, v)}`, rI(x), [
        W(v, rI(-x), 'Sign error in the last step.'),
        W(v, rat(c + d, a), `${d > 0 ? 'Added' : 'Subtracted'} ${Math.abs(d)} instead of ${d > 0 ? 'subtracting' : 'adding'} it.`),
        W(v, rI(c - d), `Forgot to divide by ${a}.`)
      ], [`${d > 0 ? 'Subtract' : 'Add'} ${Math.abs(d)} on both sides: $${c - d}=${a}${v}$.`, `Divide both sides by ${a}.`]); },
    // L1 · c = a v - b
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), x = r.nz(-9, 9), b = r.nextInt(1, 15), c = a * x - b;
      return Q(1, v, `${c}=${a}${v}-${b}`, rI(x), [
        W(v, rat(c - b, a), `Subtracted ${b} instead of adding it.`),
        W(v, rI(-x), 'Sign error in the last step.'),
        W(v, rI(c + b), `Forgot to divide by ${a}.`)
      ], [`Add ${b} on both sides: $${c + b}=${a}${v}$.`, `Divide both sides by ${a}.`]); },
    // L1 · a v + a k = c
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), x = r.nz(-12, 12), k = r.nz(-5, 5), b = a * k, c = a * x + b;
      return Q(1, v, `${lin(a, v, b)}=${c}`, rI(x), [
        W(v, rI(c - b), `Forgot to divide by ${a}.`),
        W(v, rI(-x), 'Sign error in the last step.'),
        W(v, rat(c + b, a), `Used the wrong inverse operation on ${Math.abs(b)}.`)
      ], [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} on both sides: $${a}${v}=${c - b}$.`, `Divide both sides by ${a}.`]); },
    // L2 · v/a - b = c
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), b = r.nextInt(1, 12), c = r.nz(-10, 12), x = a * (c + b); if (x === 0) return null;
      return Q(2, v, `\\dfrac{${v}}{${a}}-${b}=${c}`, rI(x), [
        W(v, rI(a * (c - b)), `Subtracted ${b} instead of adding it.`),
        W(v, rat(c + b, a), `Divided by ${a} instead of multiplying.`),
        W(v, rI(-x), 'Sign error in the last step.')
      ], [`Add ${b} on both sides: $\\dfrac{${v}}{${a}}=${c + b}$.`, `Multiply both sides by ${a}.`]); },
    // L2 · v/(-a) - b = c
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), b = r.nextInt(1, 12), c = r.nz(-10, 12), x = -a * (c + b); if (x === 0) return null;
      return Q(2, v, `\\dfrac{${v}}{-${a}}-${b}=${c}`, rI(x), [
        W(v, rI(-x), `Multiplied by ${a} instead of $-${a}$.`),
        W(v, rI(-a * (c - b)), `Subtracted ${b} instead of adding it.`),
        W(v, rat(c + b, -a), `Divided by $-${a}$ instead of multiplying.`)
      ], [`Add ${b} on both sides: $\\dfrac{${v}}{-${a}}=${c + b}$.`, `Multiply both sides by $-${a}$.`]); },
    // L2 · b + v/a = c
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), b = r.nz(-9, 9), c = r.nz(-9, 12), x = a * (c - b); if (x === 0) return null;
      return Q(2, v, `${b}+\\dfrac{${v}}{${a}}=${c}`, rI(x), [
        W(v, rat(c - b, a), `Divided by ${a} instead of multiplying.`),
        W(v, rI(-x), 'Sign error in the last step.'),
        W(v, rI(a * (c + b)), `Used the wrong inverse operation on ${Math.abs(b)}.`)
      ], [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} on both sides: $\\dfrac{${v}}{${a}}=${c - b}$.`, `Multiply both sides by ${a}.`]); },
    // L2 · v/a + b = c (c negative)
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), b = r.nextInt(1, 12), c = r.nextInt(-20, -1), x = a * (c - b);
      return Q(2, v, `\\dfrac{${v}}{${a}}+${b}=${c}`, rI(x), [
        W(v, rI(a * (c + b)), `Added ${b} instead of subtracting it.`),
        W(v, rat(c - b, a), `Divided by ${a} instead of multiplying.`),
        W(v, rI(-x), 'Sign error in the last step.')
      ], [`Subtract ${b} on both sides: $\\dfrac{${v}}{${a}}=${c - b}$.`, `Multiply both sides by ${a}.`]); },
    // L2 · (v - b)/a = c
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), b = r.nextInt(1, 12), c = r.nz(-6, 8), x = a * c + b; if (x === 0) return null;
      return Q(2, v, `\\dfrac{${v}-${b}}{${a}}=${c}`, rI(x), [
        W(v, rI(a * c - b), `Subtracted ${b} instead of adding it.`),
        W(v, rI(c + b), `Forgot to multiply by ${a}.`),
        W(v, rI(-x), 'Sign error in the last step.')
      ], [`Multiply both sides by ${a}: $${v}-${b}=${a * c}$.`, `Add ${b} on both sides.`]); },
    // L3 · c = (d + v)/(-a)
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), d = r.nextInt(1, 12), c = r.nz(-9, 15), x = -a * c - d; if (x === 0) return null;
      return Q(3, v, `${c}=\\dfrac{${d}+${v}}{-${a}}`, rI(x), [
        W(v, rI(a * c - d), `Multiplied by ${a} instead of $-${a}$.`),
        W(v, rI(-a * c + d), `Added ${d} instead of subtracting it.`),
        W(v, rI(a * c + d), `Multiplied by ${a} instead of $-${a}$ and added ${d}.`)
      ], [`Multiply both sides by $-${a}$: $${-a * c}=${d}+${v}$.`, `Subtract ${d} on both sides.`]); },
    // L3 · c = (v - b)/a (c negative)
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), b = r.nextInt(1, 12), c = r.nextInt(-15, -2), x = a * c + b; if (x === 0) return null;
      return Q(3, v, `${c}=\\dfrac{${v}-${b}}{${a}}`, rI(x), [
        W(v, rI(a * c - b), `Subtracted ${b} instead of adding it.`),
        W(v, rI(c + b), `Forgot to multiply by ${a}.`),
        W(v, rI(-x), 'Sign error in the last step.')
      ], [`Multiply both sides by ${a}: $${a * c}=${v}-${b}$.`, `Add ${b} on both sides.`]); },
    // L3 · (d - v)/a = c
    r => { const v = r.pick(VARS), a = r.nextInt(2, 9), d = r.nextInt(5, 30), c = r.nz(-9, 9), x = d - a * c; if (x === 0) return null;
      return Q(3, v, `\\dfrac{${d}-${v}}{${a}}=${c}`, rI(x), [
        W(v, rI(d + a * c), `Sign error: $-${v}=${a * c - d}$ gives $${v}=${d - a * c}$.`),
        W(v, rI(-x), `Forgot that the variable is negative ($-${v}$).`),
        W(v, rI(d - c), `Forgot to multiply by ${a}.`)
      ], [`Multiply both sides by ${a}: $${d}-${v}=${a * c}$.`, `Subtract ${d}: $-${v}=${a * c - d}$, then divide by $-1$.`]); }
  ];
  buildMCQ(2, {
    instr: 'Solve the equation, then choose the correct solution.',
    tips: ['Undo addition or subtraction first, then undo multiplication or division.',
      'Use inverse operations on both sides, and keep track of negative signs.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q3 · L 2-4 · Variable on each side (p.97, Ex. 1–6)
// ═══════════════════════════════════════════════════════════
(function() {
  const Q = (level, v, eq, x, wrongs, steps) => ({
    level, stem: `$${eq}$`, correct: sol(v, x), cv: x.v, wrongs, steps: [...steps, `$${v}=${rs(x)}$`],
    verify: { k: 'eq', v, eq }
  });
  // a v + b = c v + d with an integer root; fmt decides how the equation is written
  function sides(r, level, aR, cR, fmt) {
    const v = r.pick(VARS), a = aR(r), c = cR(r);
    if (a === c || a === 0 || c === 0) return null;
    const x = r.nz(-9, 9), b = r.nz(-20, 20), d = (a - c) * x + b;
    if (d === 0) return null;
    return Q(level, v, fmt(v, a, b, c, d), rI(x), [
      W(v, rI(-x), 'Sign error in the last step.'),
      W(v, rat(d + b, a - c), 'Moved the constant to the other side without changing its sign.'),
      W(v, rat(d - b, a + c), 'Added the variable terms instead of subtracting them.'),
      W(v, rI(d - b), `Forgot to divide by ${a - c}.`)
    ], [`Collect the variable terms on one side: $${lin(a - c, v, b)}=${d}$.`, `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: $${a - c}${v}=${d - b}$, then divide by ${a - c}.`]);
  }
  const std = (v, a, b, c, d) => `${lin(a, v, b)}=${lin(c, v, d)}`;
  const P = [
    r => sides(r, 1, r => r.nextInt(3, 9), r => -r.nextInt(2, 6), std),
    r => sides(r, 1, r => r.nextInt(2, 6), r => -r.nextInt(2, 9), std),
    r => sides(r, 1, r => r.nextInt(5, 9), r => r.nextInt(2, 4), std),
    r => sides(r, 1, r => r.nextInt(3, 7), () => 1, std),
    r => sides(r, 2, r => r.nextInt(2, 5), r => r.nextInt(6, 9), (v, a, b, c, d) => `${b}${next(a, v)}=${lin(c, v, d)}`),
    r => sides(r, 2, () => -1, r => r.nextInt(2, 6), (v, a, b, c, d) => `${b}-${v}=${lin(c, v, d)}`),
    r => sides(r, 2, r => -r.nextInt(2, 5), r => r.nextInt(2, 6), std),
    r => sides(r, 2, r => -r.nextInt(2, 5), r => r.nextInt(2, 6), (v, a, b, c, d) => `${b}${next(a, v)}=${lin(c, v, d)}`),
    // L3 · (v + p)/q = v/s with q = s·m
    r => { const v = r.pick(VARS), s = r.nextInt(2, 5), m = r.nextInt(2, 4), q = s * m, x = r.nz(-6, 6), p = x * (m - 1); if (p === 0) return null;
      const eq = `\\dfrac{${lin(1, v, p)}}{${q}}=\\dfrac{${v}}{${s}}`;
      return Q(3, v, eq, rI(x), [
        W(v, rI(-x), 'Sign error in the last step.'),
        W(v, rI(p), 'The constant is not the solution — cross-multiply first.'),
        W(v, rat(s * p, q + s), 'Added the variable terms instead of subtracting them.'),
        W(v, rat(p, m + 1), 'Cross-multiplied, then made a sign error collecting terms.')
      ], [`Cross-multiply: $${s}(${lin(1, v, p)})=${q}${v}$.`, `Distribute: $${s}${v}${pm(s * p)}=${q}${v}$, so $${s * p}=${q - s}${v}$.`]); },
    // L3 · (a v + p)/q = b v/s (fraction answer allowed)
    r => { const v = r.pick(VARS), a = r.nextInt(2, 5), b = r.nextInt(2, 6), p = r.nz(-15, 15), q = r.nextInt(2, 9), s = r.nextInt(2, 6);
      const den = q * b - s * a; if (den === 0 || q === s) return null;
      const x = rat(s * p, den); if (x.d > 9) return null;
      const eq = `\\dfrac{${lin(a, v, p)}}{${q}}=\\dfrac{${b}${v}}{${s}}`;
      return Q(3, v, eq, x, [
        W(v, rat(-x.n, x.d), 'Sign error in the last step.'),
        W(v, rat(s * p, q * b + s * a), 'Added the variable terms instead of subtracting them.'),
        b !== a ? W(v, rat(p, b - a), 'Ignored the denominators.') : null,
        W(v, rI(p), 'The constant is not the solution — cross-multiply first.')
      ], [`Cross-multiply: $${s}(${lin(a, v, p)})=${q}\\cdot${b}${v}$.`, `Distribute: $${s * a}${v}${pm(s * p)}=${q * b}${v}$, so $${s * p}=${den}${v}$.`]); },
    // L3 · (v + p)/q = v/s (p positive)
    r => { const v = r.pick(VARS), s = r.nextInt(2, 5), m = r.nextInt(2, 4), q = s * m, x = r.nextInt(1, 8), p = x * (m - 1);
      const eq = `\\dfrac{${v}+${p}}{${q}}=\\dfrac{${v}}{${s}}`;
      return Q(3, v, eq, rI(x), [
        W(v, rI(-x), 'Sign error in the last step.'),
        W(v, rI(p), 'The constant is not the solution — cross-multiply first.'),
        W(v, rat(s * p, q + s), 'Added the variable terms instead of subtracting them.'),
        W(v, rI(x * 2), 'Divided by the wrong coefficient at the end.')
      ], [`Cross-multiply: $${s}(${v}+${p})=${q}${v}$.`, `Distribute: $${s}${v}+${s * p}=${q}${v}$, so $${s * p}=${q - s}${v}$.`]); },
    // L3 · (a v - p)/q = v/s
    r => { const v = r.pick(VARS), a = r.nextInt(2, 4), q = r.nextInt(2, 8), s = r.nextInt(2, 5), p = r.nextInt(1, 12);
      const den = s * a - q; if (den === 0) return null;
      const x = rat(s * p, den); if (x.d !== 1 || x.n === 0) return null;
      const eq = `\\dfrac{${a}${v}-${p}}{${q}}=\\dfrac{${v}}{${s}}`;
      return Q(3, v, eq, x, [
        W(v, rI(-x.n), 'Sign error in the last step.'),
        W(v, rat(s * p, s * a + q), 'Added the variable terms instead of subtracting them.'),
        W(v, rat(p, a - 1), 'Ignored the denominators.'),
        W(v, rI(p), 'The constant is not the solution — cross-multiply first.')
      ], [`Cross-multiply: $${s}(${a}${v}-${p})=${q}${v}$.`, `Distribute: $${s * a}${v}-${s * p}=${q}${v}$, so $${den}${v}=${s * p}$.`]); }
  ];
  buildMCQ(3, {
    instr: 'Solve the equation, then choose the correct solution.',
    tips: ['Move all variable terms to one side and all constants to the other side.',
      'With fractions on both sides, cross-multiply first, then collect like terms.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q4 · L 2-5 · Absolute value equations (p.106, Ex. 19–23)
// ═══════════════════════════════════════════════════════════
(function() {
  const RNG = (lo, hi, unit) => `$${lo}${unit}\\text{ and }${hi}${unit}$`;
  const opt = (lo, hi, unit, why) => [RNG(num(lo), num(hi), unit), why, [lo, hi]];
  const S = rs => setTex(rs);
  const setOpt = (vals, why) => [S(vals), why, vals.length ? vals.map(x => x.v) : 'none'];
  const eqQ = (level, v, eq, vals, wrongs, steps) => ({
    level, stem: `$${eq}$`, correct: S(vals), cv: vals.length ? vals.map(x => x.v) : 'none', wrongs, steps,
    verify: { k: 'eq', v, eq }
  });
  const P = [
    // L1 · oven tolerance
    r => { const T = r.pick([300, 325, 350, 375, 400, 425, 450]), t = r.pick([5, 10, 15, 20, 25]);
      return { level: 1, stem: `An oven is set to $${T}^\\circ$F with a tolerance of $\\pm${t}^\\circ$F. Write and solve an absolute value equation. What are the minimum and maximum temperatures?`,
        correct: RNG(T - t, T + t, '^\\circ\\text{F}'), cv: [T - t, T + t], wrongs: [
          opt(T, T + t, '^\\circ\\text{F}', 'The set temperature is the middle, not the minimum.'),
          opt(T - 2 * t, T + 2 * t, '^\\circ\\text{F}', 'Used double the tolerance.'),
          opt(T - t, T, '^\\circ\\text{F}', 'The set temperature is the middle, not the maximum.')
        ], steps: [`$|t-${T}|=${t}$`, `$t-${T}=${t}$ gives $t=${T + t}$; $t-${T}=-${t}$ gives $t=${T - t}$.`],
        verify: { k: 'range', c: T, r: t } }; },
    // L1 · poll margin of error
    r => { const p = r.nextInt(25, 62), m = r.nextInt(2, 6);
      return { level: 1, stem: `A poll is accurate within $\\pm${m}\\%$, and $${p}\\%$ of voters chose Candidate A. Write and solve an absolute value equation. What are the minimum and maximum percents for Candidate A?`,
        correct: RNG(p - m, p + m, '\\%'), cv: [p - m, p + m], wrongs: [
          opt(p, p + m, '\\%', 'The poll result is the middle, not the minimum.'),
          opt(p - m, p, '\\%', 'The poll result is the middle, not the maximum.'),
          opt(p - 2 * m, p + 2 * m, '\\%', 'Used double the margin of error.')
        ], steps: [`$|x-${p}|=${m}$`, `$x=${p}+${m}=${p + m}$ or $x=${p}-${m}=${p - m}$.`],
        verify: { k: 'range', c: p, r: m } }; },
    // L1 · |v + b| = c
    r => { const v = r.pick(VARS), b = r.nz(-9, 9), c = r.nextInt(2, 12), A = rI(-b - c), B = rI(c - b);
      return eqQ(1, v, `|${lin(1, v, b)}|=${c}`, [A, B], [
        setOpt([B], `Only solved $${lin(1, v, b)}=${c}$; the expression can also equal $-${c}$.`),
        setOpt([rI(b - c), rI(b + c)], `Sign error: undo $${pm(b)}$ by ${b > 0 ? 'subtracting' : 'adding'} ${Math.abs(b)}.`),
        setOpt([rI(-c), rI(c)], `Forgot to undo the $${pm(b)}$ inside the absolute value.`)
      ], [`$${lin(1, v, b)}=${c}$ or $${lin(1, v, b)}=-${c}$`, `$${v}=${c - b}$ or $${v}=${-c - b}$`]); },
    // L1 · |a v - b| = c with integer roots
    r => { const v = r.pick(VARS), a = r.nextInt(2, 4), r1 = r.nz(-6, 6), r2 = r1 + 2 * r.nextInt(1, 4);
      if ((a * (r2 - r1)) % 2) return null;
      const c = a * (r2 - r1) / 2, b = a * (r1 + r2) / 2; if (b <= 0 || r2 === 0) return null;
      return eqQ(1, v, `|${a}${v}-${b}|=${c}`, [rI(r1), rI(r2)], [
        setOpt([rI(-r2), rI(-r1)], `Sign error: undo $-${b}$ by adding ${b}.`),
        setOpt([rI(r2)], `Only solved $${a}${v}-${b}=${c}$; it can also equal $-${c}$.`),
        setOpt([rat(-c, a), rat(c, a)], `Forgot to undo the $-${b}$ before dividing.`)
      ], [`$${a}${v}-${b}=${c}$ or $${a}${v}-${b}=-${c}$`, `$${a}${v}=${b + c}$ or $${a}${v}=${b - c}$`, `$${v}=${r2}$ or $${v}=${r1}$`]); },
    // L1 · |v - b| = -c (no solution)
    r => { const v = r.pick(VARS), b = r.nextInt(1, 9), c = r.nextInt(1, 9);
      return eqQ(1, v, `|${v}-${b}|=-${c}`, [], [
        setOpt([rI(b - c), rI(b + c)], 'An absolute value can never be negative, so there is no solution.'),
        setOpt([rI(b + c)], 'An absolute value can never be negative, so there is no solution.'),
        setOpt([rI(b - c)], 'An absolute value can never be negative, so there is no solution.')
      ], [`An absolute value is never negative, so $|${v}-${b}|=-${c}$ has no solution: $\\varnothing$.`]); },
    // L2 · ACT: which equation
    r => { const mu = r.nextInt(180, 240) / 10, sd = r.nextInt(40, 65) / 10;
      const E = (c, rr) => [c - rr, c + rr];
      return { level: 2, stem: `A test has a mean score of $${num(mu)}$ with a standard deviation of $${num(sd)}$. Which equation gives the scores one standard deviation from the mean?`,
        correct: `$|x-${num(mu)}|=${num(sd)}$`, cv: E(mu, sd), wrongs: [
          [`$|x-${num(sd)}|=${num(mu)}$`, 'The mean is the centre, so it goes inside the absolute value.', E(sd, mu)],
          [`$|x+${num(mu)}|=${num(sd)}$`, `The centre is ${num(mu)}, so the expression is $x-${num(mu)}$.`, E(-mu, sd)],
          [`$|x-${num(mu)}|=${num(2 * sd)}$`, 'One standard deviation means a distance of exactly one SD.', E(mu, 2 * sd)]
        ], steps: ['The distance from the mean is $|x-\\text{mean}|$.', `One standard deviation: $|x-${num(mu)}|=${num(sd)}$.`],
        verify: { k: 'range', c: mu, r: sd } }; },
    // L2 · ACT: within two standard deviations
    r => { const mu = r.nextInt(180, 240) / 10, sd = r.nextInt(40, 65) / 10;
      return { level: 2, stem: `A test has a mean score of $${num(mu)}$ with a standard deviation of $${num(sd)}$. What is the range of scores within **two** standard deviations of the mean?`.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'),
        correct: `$${num(mu - 2 * sd)}\\text{ to }${num(mu + 2 * sd)}$`, cv: [mu - 2 * sd, mu + 2 * sd], wrongs: [
          [`$${num(mu - sd)}\\text{ to }${num(mu + sd)}$`, 'That is one standard deviation, not two.', [mu - sd, mu + sd]],
          [`$${num(sd)}\\text{ to }${num(mu)}$`, 'The range is centred on the mean.', [sd, mu]],
          [`$${num(mu - sd / 2)}\\text{ to }${num(mu + sd / 2)}$`, 'Two standard deviations means $2\\times$ the SD on each side.', [mu - sd / 2, mu + sd / 2]]
        ], steps: [`$|x-${num(mu)}|=2(${num(sd)})=${num(2 * sd)}$`, `$x=${num(mu)}\\pm${num(2 * sd)}$, so $${num(mu - 2 * sd)}\\le x\\le${num(mu + 2 * sd)}$.`],
        verify: { k: 'range', c: mu, r: 2 * sd } }; },
    // L2 · |v - b| + c = d
    r => { const v = r.pick(VARS), b = r.nz(-6, 6), c = r.nextInt(1, 8), e = r.nextInt(2, 8), d = c + e;
      return eqQ(2, v, `|${lin(1, v, -b)}|+${c}=${d}`, [rI(b - e), rI(b + e)], [
        setOpt([rI(-b - e), rI(-b + e)], `Sign error: the centre is $${b}$, not $${-b}$.`),
        setOpt([rI(b - d - c), rI(b + d + c)], `Added ${c} instead of subtracting it.`),
        setOpt([rI(b + e)], 'Only found one case; there are two.')
      ], [`Subtract ${c}: $|${lin(1, v, -b)}|=${e}$`, `$${v}=${b}+${e}=${b + e}$ or $${v}=${b}-${e}=${b - e}$`]); },
    // L3 · percent of a population with margin of error
    r => { const N = r.pick([30, 40, 50, 60, 80]), p = r.nextInt(15, 35), m = r.nextInt(2, 5);
      const c = p * N / 100, rr = m * N / 100;
      return { level: 3, stem: `$${p}\\%$ of about ${N} million students chose “finding new resources”, with a margin of error of $\\pm${m}\\%$. What is the range of the number of students?`,
        correct: `$${num(c - rr)}\\text{ to }${num(c + rr)}\\text{ million}$`, cv: [c - rr, c + rr], wrongs: [
          [`$${num(c)}\\text{ to }${num(c + rr)}\\text{ million}$`, `${p}% is the centre of the range, not the minimum.`, [c, c + rr]],
          [`$${p - m}\\text{ to }${p + m}\\text{ million}$`, `These are percents — multiply by ${N} million.`, [p - m, p + m]],
          [`$${num(c - m / 10)}\\text{ to }${num(c + m / 10)}\\text{ million}$`, `The margin is ${m}% of ${N} million, not ${num(m / 10)} million.`, [c - m / 10, c + m / 10]]
        ], steps: [`$|x-${p}|=${m}$ gives $${p - m}\\%$ to $${p + m}\\%$.`, `$${(p - m) / 100}\\times${N}=${num(c - rr)}$ and $${(p + m) / 100}\\times${N}=${num(c + rr)}$ million.`],
        verify: { k: 'range', c, r: rr } }; },
    // L3 · weight within k ounces (16 oz = 1 lb)
    r => { const L = r.nextInt(20, 50), k = r.pick([4, 8, 12]), t = k / 16;
      return { level: 3, stem: `Bags of rock salt are labeled ${L} lb, and their weight is within ${k} ounces of the label ($16$ oz $=1$ lb). What are the minimum and maximum weights?`,
        correct: RNG(num(L - t), num(L + t), '\\text{ lb}'), cv: [L - t, L + t], wrongs: [
          opt(L - k, L + k, '\\text{ lb}', `${k} ounces is not ${k} pounds — convert first.`),
          opt(L - k / 10, L + k / 10, '\\text{ lb}', 'There are 16 ounces in a pound, not 10.'),
          opt(L - k / 100, L + k / 100, '\\text{ lb}', 'There are 16 ounces in a pound, not 100.')
        ], steps: [`${k} oz $=\\dfrac{${k}}{16}=${num(t)}$ lb.`, `$|w-${L}|=${num(t)}$, so $w=${num(L - t)}$ or $w=${num(L + t)}$ lb.`],
        verify: { k: 'range', c: L, r: t } }; },
    // L3 · a|v - b| = c
    r => { const v = r.pick(VARS), a = r.nextInt(2, 4), b = r.nz(-6, 6), e = r.nextInt(2, 7), c = a * e;
      return eqQ(3, v, `${a}|${lin(1, v, -b)}|=${c}`, [rI(b - e), rI(b + e)], [
        setOpt([rI(b - c), rI(b + c)], `Forgot to divide by ${a} first.`),
        setOpt([rI(b + e)], 'Only found one case; there are two.'),
        setOpt([rI(-b - e), rI(-b + e)], `Sign error: the centre is $${b}$, not $${-b}$.`)
      ], [`Divide by ${a}: $|${lin(1, v, -b)}|=${e}$`, `$${v}=${b + e}$ or $${v}=${b - e}$`]); },
    // L3 · |a v + b| - c = d (fraction answers)
    r => { const v = r.pick(VARS), a = r.nextInt(2, 5), b = r.nz(-9, 9), c = r.nextInt(1, 8), d = r.nextInt(2, 10), e = c + d;
      if (Math.abs(b) === e) return null;
      return eqQ(3, v, `|${lin(a, v, b)}|-${c}=${d}`, [rat(-b - e, a), rat(-b + e, a)], [
        setOpt([rat(-b - (d - c), a), rat(-b + (d - c), a)], `Subtracted ${c} instead of adding it.`),
        setOpt([rat(b - e, a), rat(b + e, a)], `Sign error when undoing $${pm(b)}$.`),
        setOpt([rat(-b + e, a)], 'Only found one case; there are two.')
      ], [`Add ${c}: $|${lin(a, v, b)}|=${e}$`, `$${lin(a, v, b)}=${e}$ or $${lin(a, v, b)}=-${e}$`, `$${v}=${rs(rat(e - b, a))}$ or $${v}=${rs(rat(-e - b, a))}$`]); }
  ];
  buildMCQ(4, {
    instr: 'Write the absolute value equation and solve it, then choose the correct answer.',
    tips: ['Isolate the absolute value first. Then split into two cases: the expression equals $+c$ or $-c$.',
      'For tolerance or margin problems, write $|x-\\text{centre}|=\\text{distance}$.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q5 · L 2-6 · Solve proportions (p.113, Ex. 19–26)
// ═══════════════════════════════════════════════════════════
(function() {
  const shown = x => Number(num2(x));
  const opt = (v, x, why) => [`$${v}=${num2(x)}$`, why, shown(x)];
  // (a v + b)/c = (d v + e)/f
  function prop(r, level, shape) {
    const v = r.pick(VARS);
    let { a, b, c, d, e, f } = shape(r);
    const den = f * a - c * d; if (den === 0) return null;
    const x = (c * e - f * b) / den;
    if (Math.abs(x) > 60 || x === 0) return null;
    if (level === 1 && !Number.isInteger(x)) return null;
    if (level === 2 && Math.abs(x * 100 - Math.round(x * 100)) > 1e-9) return null;
    if (level === 3 && Number.isInteger(x) && r.next() < 0.6) return null;
    const N = (p, q) => q === 1 ? lin(p, v, 0) : lin(p, v, q);
    const top1 = b === 0 ? lead(a, v) : lin(a, v, b), top2 = e === 0 ? lead(d, v) : lin(d, v, e);
    const eq = `\\dfrac{${top1}}{${c}}=\\dfrac{${top2}}{${f}}`;
    const crossWrong = (c * a - f * d) !== 0 ? (f * e - c * b) / (c * a - f * d) : null;
    return { level, stem: `$${eq}$`, correct: `$${v}=${num2(x)}$`, cv: shown(x),
      wrongs: [
        opt(v, -x, 'Sign error in the last step.'),
        crossWrong !== null ? opt(v, crossWrong, 'Cross-multiplied the wrong pairs.') : null,
        opt(v, (c * e + f * b) / den, 'Sign error when moving the constant term.'),
        (f * a + c * d) !== 0 ? opt(v, (c * e - f * b) / (f * a + c * d), 'Added the variable terms instead of subtracting them.') : null
      ],
      steps: [`Cross-multiply: $${f}(${top1})=${c}(${top2})$.`, `$${lin(f * a, v, f * b)}=${lin(c * d, v, c * e)}$`, `$${den}${v}=${c * e - f * b}$, so $${v}=${num2(x)}$${Number.isInteger(x * 100) ? '' : ' (rounded)'}.`],
      verify: { k: 'eq', v, eq, tol: 0.005 } };
  }
  // p/(g v + h) = s/(t v + u)
  function propDen(r, level, shape) {
    const v = r.pick(VARS);
    const { p, g, h, s, t, u } = shape(r);
    const den = p * t - s * g; if (den === 0) return null;
    const x = (s * h - p * u) / den;
    if (x === 0 || Math.abs(x) > 40 || Math.abs(g * x + h) < 1e-9 || Math.abs(t * x + u) < 1e-9) return null;
    if (level < 3 && !Number.isInteger(x)) return null;
    const eq = `\\dfrac{${p}}{${lin(g, v, h)}}=\\dfrac{${s}}{${lin(t, v, u)}}`;
    const wrongDen = p * g - s * t;
    return { level, stem: `$${eq}$`, correct: `$${v}=${num2(x)}$`, cv: shown(x),
      wrongs: [
        opt(v, -x, 'Sign error in the last step.'),
        wrongDen !== 0 ? opt(v, (s * u - p * h) / wrongDen, 'Cross-multiplied the wrong pairs.') : null,
        opt(v, (s * h + p * u) / den, 'Sign error when moving the constant term.'),
        opt(v, (s * h - p * u) / (p * t + s * g), 'Added the variable terms instead of subtracting them.')
      ],
      steps: [`Cross-multiply: $${p}(${lin(t, v, u)})=${s}(${lin(g, v, h)})$.`, `$${lin(p * t, v, p * u)}=${lin(s * g, v, s * h)}$`, `$${den}${v}=${s * h - p * u}$, so $${v}=${num2(x)}$${Number.isInteger(x * 100) ? '' : ' (rounded)'}.`],
      verify: { k: 'eq', v, eq, tol: 0.005 } };
  }
  const i = (r, a, b) => r.nextInt(a, b);
  const P = [
    r => prop(r, 1, r => ({ a: 1, b: 0, c: i(r, 2, 6), d: i(r, 2, 4), e: r.nz(-9, 9), f: i(r, 3, 9) })),
    r => prop(r, 1, r => ({ a: 1, b: 0, c: i(r, 2, 6), d: 1, e: r.nz(-9, 12), f: i(r, 3, 12) })),
    r => prop(r, 1, r => ({ a: 1, b: r.nz(-6, 6), c: i(r, 2, 6), d: 1, e: r.nz(-6, 6), f: i(r, 2, 6) })),
    r => prop(r, 2, r => ({ a: i(r, 2, 6), b: r.nz(-9, 9), c: i(r, 6, 15), d: i(r, 2, 7), e: r.nz(-9, 9), f: i(r, 4, 10) })),
    r => prop(r, 2, r => { const f = i(r, 2, 5); return { a: i(r, 3, 9), b: r.nz(-6, 6), c: f * i(r, 2, 3), d: i(r, 2, 6), e: r.nz(-6, 6), f }; }),
    r => prop(r, 2, r => { const c = i(r, 2, 6); return { a: i(r, 2, 4), b: r.nz(-6, 6), c, d: i(r, 2, 4), e: r.nz(-6, 6), f: c * 2 }; }),
    r => prop(r, 2, r => ({ a: 1, b: r.nz(-6, 6), c: i(r, 3, 9), d: 1, e: r.nz(-6, 6), f: i(r, 3, 9) })),
    r => prop(r, 2, r => ({ a: i(r, 2, 4), b: r.nz(-6, 6), c: i(r, 3, 7), d: 1, e: r.nz(-6, 6), f: i(r, 2, 5) })),
    r => propDen(r, 3, r => ({ p: i(r, 2, 6), g: 1, h: r.nz(-8, 8), s: i(r, 2, 6), t: i(r, 3, 6), u: r.nz(-12, 12) })),
    r => prop(r, 3, r => ({ a: i(r, 2, 6), b: r.nz(-6, 6), c: i(r, 3, 9), d: i(r, 2, 5), e: r.nz(-6, 6), f: i(r, 3, 9) })),
    r => propDen(r, 3, r => ({ p: i(r, 2, 7), g: i(r, 3, 8), h: r.nz(-6, 6), s: i(r, 2, 5), t: i(r, 2, 3), u: r.nz(-6, 6) })),
    r => propDen(r, 3, r => ({ p: i(r, 2, 8), g: 1, h: r.nz(-6, 6), s: i(r, 2, 8), t: 1, u: r.nz(-6, 6) }))
  ];
  buildMCQ(5, {
    instr: 'Solve the proportion. If necessary, round to the nearest hundredth.',
    tips: ['Cross-multiply: if $\\dfrac{a}{b}=\\dfrac{c}{d}$, then $ad=bc$. Keep each numerator in brackets.',
      'After cross-multiplying, distribute, collect the variable terms on one side and solve.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q6 · L 4-2 · Find the slope of a line (p.227, Ex. 50–52)
// ═══════════════════════════════════════════════════════════
(function() {
  const mOpt = (m, why) => [`$m=${rs(m)}$`, why, m.v];
  const UNDEF = 'undefined';
  function wrongsFor(m, dx, dy) {
    return [
      m.n !== 0 ? mOpt(rat(m.d, m.n), 'Used run over rise — slope is rise over run.') : null,
      mOpt(rat(-m.n, m.d), 'Sign error: check whether the line rises or falls from left to right.'),
      mOpt(rI(dy), 'Forgot to divide the rise by the run.'),
      mOpt(rI(dx), 'Used only the run.'),
      mOpt(rI(0), 'The line is not horizontal.')
    ];
  }
  // A line through two lattice points with slope m, drawn on a -5..5 grid
  function graphQ(r, level, slopes) {
    const m = r.pick(slopes);
    const t = r.pick([1, 1, 2]);
    const dx = m.d * t, dy = m.n * t;
    const x1 = r.nextInt(-4, 4 - dx), y1 = r.nextInt(-4, 4);
    const x2 = x1 + dx, y2 = y1 + dy;
    if (y2 < -4 || y2 > 4 || x2 > 4) return null;
    const pts = [[x1, y1], [x2, y2]];
    return { level, stem: 'Find the slope of the line shown.', text: 'Find the slope of the line shown.' + GRAPH.lineThroughPoints(pts),
      sig: `m=${rs(m)} ${x1} ${y1} ${x2} ${y2}`,
      correct: `$m=${rs(m)}$`, cv: m.v, wrongs: wrongsFor(m, dx, dy),
      steps: [`Rise: $${y2}-(${y1})=${dy}$. Run: $${x2}-(${x1})=${dx}$.`, `$m=\\dfrac{\\text{rise}}{\\text{run}}=\\dfrac{${dy}}{${dx}}=${rs(m)}$`],
      verify: { k: 'slope', pts } };
  }
  function pointsQ(r, level, slopes) {
    const m = r.pick(slopes), t = r.nextInt(1, 3);
    const dx = m.d * t * r.sign(), dy = m.n * (dx / m.d);
    const x1 = r.nextInt(-7, 7), y1 = r.nextInt(-7, 7), x2 = x1 + dx, y2 = y1 + dy;
    if (Math.abs(x2) > 9 || Math.abs(y2) > 9) return null;
    const stem = `Find the slope of the line through $(${x1},${y1})$ and $(${x2},${y2})$.`;
    return { level, stem, correct: `$m=${rs(m)}$`, cv: m.v, wrongs: wrongsFor(m, dx, dy),
      steps: [`$m=\\dfrac{y_2-y_1}{x_2-x_1}=\\dfrac{${y2}-(${y1})}{${x2}-(${x1})}=\\dfrac{${dy}}{${dx}}=${rs(m)}$`],
      verify: { k: 'slope', pts: [[x1, y1], [x2, y2]] } };
  }
  const R = (n, d) => rat(n, d);
  const P = [
    r => graphQ(r, 1, [rI(2), rI(3)]),
    r => graphQ(r, 1, [R(1, 2), R(1, 3), R(1, 4)]),
    r => graphQ(r, 1, [R(1, 2), R(2, 3), R(3, 2), R(3, 4)]),
    r => pointsQ(r, 1, [rI(2), rI(3), rI(4)]),
    r => graphQ(r, 2, [rI(-2), rI(-3), rI(-4)]),
    r => graphQ(r, 2, [rI(-1), R(-1, 2), R(-1, 3)]),
    r => graphQ(r, 2, [rI(3), rI(4), R(5, 2)]),
    r => pointsQ(r, 2, [R(1, 2), R(1, 3), R(2, 3), R(3, 4)]),
    // L2 · horizontal line (slope 0)
    r => { const x1 = r.nextInt(-8, 0), x2 = r.nextInt(1, 8), y = r.nz(-8, 8);
      return { level: 2, stem: `Find the slope of the line through $(${x1},${y})$ and $(${x2},${y})$.`, correct: '$m=0$', cv: 0,
        wrongs: [[UNDEF, 'A horizontal line has slope 0. Undefined slope is a vertical line.', 'undef'],
          mOpt(rI(x2 - x1), 'Used the run instead of rise ÷ run.'), mOpt(rI(1), 'The rise is 0, so the slope is 0.'), mOpt(rI(y), 'The $y$-value is not the slope.')],
        steps: [`$m=\\dfrac{${y}-${y < 0 ? `(${y})` : y}}{${x2}-(${x1})}=\\dfrac{0}{${x2 - x1}}=0$`, 'The line is horizontal.'],
        verify: { k: 'slope', pts: [[x1, y], [x2, y]] } }; },
    // L2 · vertical line (undefined)
    r => { const x = r.nz(-8, 8), y1 = r.nextInt(-8, 0), y2 = r.nextInt(1, 8);
      return { level: 2, stem: `Find the slope of the line through $(${x},${y1})$ and $(${x},${y2})$.`, correct: UNDEF, cv: 'undef',
        wrongs: [mOpt(rI(0), 'Slope 0 is a horizontal line; this line is vertical.'), mOpt(rI(y2 - y1), 'The run is 0, and you cannot divide by 0.'), mOpt(rat(1, y2 - y1), 'Used run over rise.')],
        steps: [`$m=\\dfrac{${y2}-(${y1})}{${x}-(${x})}=\\dfrac{${y2 - y1}}{0}$`, 'Division by 0 is undefined, so the slope is undefined (vertical line).'],
        verify: { k: 'slope', pts: [[x, y1], [x, y2]] } }; },
    r => graphQ(r, 3, [R(-3, 2), R(-2, 3), R(-3, 4), R(-4, 3)]),
    r => pointsQ(r, 3, [R(-3, 2), R(-2, 3), R(-5, 2), R(-4, 3), R(-3, 4)])
  ];
  buildMCQ(6, {
    instr: 'Find the slope of the line, then choose the correct answer.',
    tips: ['Slope $m=\\dfrac{\\text{rise}}{\\text{run}}=\\dfrac{y_2-y_1}{x_2-x_1}$.',
      'Subtract in the same order on the top and the bottom. A falling line has a negative slope.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q7 · L 4-3 · Rewrite in slope-intercept form (p.235, Ex. 1–8)
// ═══════════════════════════════════════════════════════════
(function() {
  const Y = (m, b) => lineY(m, b);
  const L = (m, b, why) => EQ(Y(m, b), why);
  function given(r, level, mSign, bSign, mLo, mHi) {
    const m = mSign * r.nextInt(mLo || 2, mHi || 9), b = bSign * r.nextInt(1, 12);
    if (Math.abs(m) === Math.abs(b)) return null;
    const M = rI(m), B = rI(b);
    return { level, stem: `Slope $${m}$, $y$-intercept $${b}$.`, correct: `$${Y(M, B)}$`, cv: Y(M, B),
      wrongs: [L(B, M, 'Swapped the slope and the $y$-intercept.'), L(M, rI(-b), 'Sign error on the $y$-intercept.'), L(rI(-m), B, 'Sign error on the slope.'), L(M, rI(0), 'Left out the $y$-intercept.')],
      steps: [`In $y=mx+b$, $m$ is the slope and $b$ is the $y$-intercept.`, `$m=${m}$, $b=${b}$: $${Y(M, B)}$`],
      verify: { k: 'line', slope: m, through: [[0, b]] } };
  }
  const P = [
    r => given(r, 1, 1, -1), r => given(r, 1, -1, 1, 2, 5), r => given(r, 1, -1, -1, 2, 5),
    r => given(r, 1, 1, 1, 2, 5), r => given(r, 1, r.sign(), 1, 6, 9), r => given(r, 1, -1, -1, 6, 9),
    // L1 · rewrite a x + y = c
    r => { const a = r.nz(-9, 9), c = r.nz(-12, 12); if (Math.abs(a) === 1 || Math.abs(a) === Math.abs(c)) return null;
      const eq = `${lin(a, 'x', 0)}+y=${c}`;
      return { level: 1, instr: 'Rewrite the equation in slope-intercept form, $y=mx+b$.', stem: `$${eq}$`, correct: `$${Y(rI(-a), rI(c))}$`, cv: Y(rI(-a), rI(c)),
        wrongs: [L(rI(a), rI(c), `Sign error: subtract $${lin(a, 'x', 0)}$ from both sides.`), L(rI(c), rI(-a), 'Swapped the slope and the $y$-intercept.'), L(rI(-a), rI(-c), 'Changed the sign of the constant by mistake.')],
        steps: [`Subtract $${lin(a, 'x', 0)}$ from both sides: $${Y(rI(-a), rI(c))}$`],
        verify: { k: 'line', same: eq } }; },
    // L2 · slope ±1
    r => { const m = r.pick([1, -1]), b = r.nz(-15, 15); if (Math.abs(b) === 1) return null;
      return { level: 2, stem: `Slope $${m}$, $y$-intercept $${b}$.`, correct: `$${Y(rI(m), rI(b))}$`, cv: Y(rI(m), rI(b)),
        wrongs: [L(rI(b), rI(m), 'Swapped the slope and the $y$-intercept.'), L(rI(m), rI(-b), 'Sign error on the $y$-intercept.'), L(rI(b), rI(0), 'Used the $y$-intercept as the slope.')],
        steps: [`$m=${m}$, $b=${b}$: $${Y(rI(m), rI(b))}$`], verify: { k: 'line', slope: m, through: [[0, b]] } }; },
    // L2 · slope 0
    r => { const b = r.nz(-12, 12);
      return { level: 2, stem: `Slope $0$, $y$-intercept $${b}$.`, correct: `$y=${b}$`, cv: `y=${b}`,
        wrongs: [EQ(`y=${b}x`, `Slope 0 means there is no $x$-term.`), EQ(`x=${b}`, '$x=b$ is a vertical line, which has undefined slope.'), EQ('y=0', 'That is the $x$-axis; the $y$-intercept is not 0.')],
        steps: [`$y=0x+${b < 0 ? `(${b})` : b}=${b}$ — a horizontal line.`], verify: { k: 'line', slope: 0, through: [[0, b]] } }; },
    // L2 · a x + b y = c with b | a and b | c
    r => { const b = r.nextInt(2, 5), a = b * r.nz(-4, 4), c = b * r.nz(-6, 6); if (Math.abs(a) === b) return null;
      const eq = `${lin(a, 'x', 0)}+${b}y=${c}`, M = rat(-a, b), B = rat(c, b);
      return { level: 2, instr: 'Rewrite the equation in slope-intercept form, $y=mx+b$.', stem: `$${eq}$`, correct: `$${Y(M, B)}$`, cv: Y(M, B),
        wrongs: [L(rI(-a), rI(c), `Forgot to divide every term by ${b}.`), L(rat(a, b), B, 'Sign error on the slope.'), L(M, rI(c), `Divided only the $x$-term by ${b}.`)],
        steps: [`Subtract $${lin(a, 'x', 0)}$: $${b}y=${lin(-a, 'x', c)}$`, `Divide every term by ${b}: $${Y(M, B)}$`], verify: { k: 'line', same: eq } }; },
    // L3 · x + b y = c → fraction slope
    r => { const b = r.nextInt(2, 6), c = b * r.nz(-5, 5), s = r.sign();
      const eq = `${s > 0 ? 'x' : '-x'}+${b}y=${c}`, M = rat(-s, b), B = rat(c, b);
      return { level: 3, instr: 'Rewrite the equation in slope-intercept form, $y=mx+b$.', stem: `$${eq}$`, correct: `$${Y(M, B)}$`, cv: Y(M, B),
        wrongs: [L(rI(-s * b), rI(c), `Multiplied by ${b} instead of dividing.`), L(rat(s, b), B, 'Sign error on the slope.'), L(rI(-s), B, `Forgot to divide the $x$-term by ${b}.`)],
        steps: [`Subtract $${s > 0 ? 'x' : '-x'}$: $${b}y=${lin(-s, 'x', c)}$`, `Divide every term by ${b}: $${Y(M, B)}$`], verify: { k: 'line', same: eq } }; },
    // L3 · b y - a x = c
    r => { const b = r.nextInt(2, 6), a = r.nextInt(1, 9), c = b * r.nz(-5, 5); if (a % b === 0 || a === 1) return null;
      const eq = `${b}y-${a}x=${c}`, M = rat(a, b), B = rat(c, b);
      return { level: 3, instr: 'Rewrite the equation in slope-intercept form, $y=mx+b$.', stem: `$${eq}$`, correct: `$${Y(M, B)}$`, cv: Y(M, B),
        wrongs: [L(rI(a), rI(c), `Forgot to divide by ${b}.`), L(rat(-a, b), B, `Sign error: add $${a}x$ to both sides.`), L(rat(b, a), B, 'Used the reciprocal of the slope.')],
        steps: [`Add $${a}x$: $${b}y=${a}x${pm(c)}$`, `Divide every term by ${b}: $${Y(M, B)}$`], verify: { k: 'line', same: eq } }; }
  ];
  buildMCQ(7, {
    instr: 'Write an equation in slope-intercept form, $y=mx+b$.',
    tips: ['In $y=mx+b$, $m$ is the slope and $b$ is the $y$-intercept.',
      'To rewrite, get $y$ alone: move the $x$-term to the other side, then divide every term by the coefficient of $y$.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q8 · L 4-4 · Dilations of linear functions (p.248, Ex. 10–15)
// ═══════════════════════════════════════════════════════════
(function() {
  // a factor shown as a fraction or a decimal
  const F = (n, d, dec) => ({ n, d, v: n / d, tex: dec ? num(n / d) : rs(rat(n, d), '\\tfrac') });
  const inv = f => F(f.d, f.n, f.tex.includes('.') && Number.isFinite(+num(f.d / f.n)) && String(num(f.d / f.n)).length <= 4);
  const D = (dir, kind, f, steep) => [`${dir === 'v' ? 'vertical' : 'horizontal'} ${kind}, factor $${f.tex}$ (${steep ? 'steeper' : 'less steep'})`, null, { dir, kind, f: f.v, steep }];
  const why = {
    vstretch: 'Multiplying the output by a number greater than 1 is a vertical stretch by that same factor.',
    vcomp: 'Multiplying the output by a number between 0 and 1 is a vertical compression by that same factor.',
    hcomp: 'Multiplying $x$ by a number greater than 1 is a horizontal compression by the reciprocal factor.',
    hstretch: 'Multiplying $x$ by a number between 0 and 1 is a horizontal stretch by the reciprocal factor.'
  };
  // g(x) = a(x): vertical dilation by factor a
  function vert(r, level, a) {
    const g = `g(x)=${a.tex}(x)`;
    let correct, wrongs, steps;
    if (a.v > 1) {
      correct = D('v', 'stretch', a, true);
      wrongs = [D('v', 'compression', inv(a), false), D('v', 'compression', a, false), D('h', 'stretch', a, false)];
      steps = [`$g(x)=a\\,f(x)$ with $a=${a.tex}>1$.`, `This is a vertical stretch by factor $${a.tex}$, so the line is steeper.`];
    } else {
      correct = D('v', 'compression', a, false);
      wrongs = [D('v', 'stretch', inv(a), true), D('v', 'compression', inv(a), false), D('h', 'compression', a, true)];
      steps = [`$g(x)=a\\,f(x)$ with $0<a=${a.tex}<1$.`, `This is a vertical compression by factor $${a.tex}$, so the line is less steep.`];
    }
    const w = a.v > 1 ? why.vstretch : why.vcomp;
    return { level, stem: `$${g}$`, correct: correct[0], cv: correct[2], wrongs: wrongs.map(x => [x[0], w, x[2]]), steps, verify: { k: 'dil', a: a.v } };
  }
  // g(x) = (a x): horizontal dilation by factor 1/a
  function horiz(r, level, a) {
    const g = `g(x)=(${a.tex}x)`, k = inv(a);
    let correct, wrongs, steps;
    if (a.v > 1) {
      correct = D('h', 'compression', k, true);
      wrongs = [D('h', 'compression', a, true), D('h', 'stretch', a, false), D('v', 'compression', k, false)];
      steps = [`$g(x)=f(ax)$ with $a=${a.tex}>1$.`, `Horizontal factor $=\\dfrac{1}{a}=${k.tex}$: a horizontal compression, so the line is steeper.`];
    } else {
      correct = D('h', 'stretch', k, false);
      wrongs = [D('h', 'stretch', a, false), D('h', 'compression', k, true), D('v', 'stretch', k, true)];
      steps = [`$g(x)=f(ax)$ with $0<a=${a.tex}<1$.`, `Horizontal factor $=\\dfrac{1}{a}=${k.tex}$: a horizontal stretch, so the line is less steep.`];
    }
    const w = a.v > 1 ? why.hcomp : why.hstretch;
    return { level, stem: `$${g}$`, correct: correct[0], cv: correct[2], wrongs: wrongs.map(x => [x[0], w, x[2]]), steps, verify: { k: 'dil', a: a.v } };
  }
  const P = [
    r => vert(r, 1, F(r.nextInt(2, 5), 1)),
    r => vert(r, 1, F(1, r.nextInt(2, 5))),
    r => { const v = r.pick([[3, 2], [5, 2], [7, 2], [5, 4], [9, 4]]); return vert(r, 1, F(v[0], v[1], true)); },
    r => vert(r, 1, F(r.nextInt(6, 9), 1)),
    r => vert(r, 1, F(1, r.nextInt(6, 9))),
    r => horiz(r, 2, F(r.nextInt(2, 5), 1)),
    r => { const v = r.pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]]); return horiz(r, 2, F(v[0], v[1])); },
    r => { const v = r.pick([[2, 5], [4, 5], [1, 4], [3, 4]]); return horiz(r, 2, F(v[0], v[1], true)); },
    r => horiz(r, 2, F(r.nextInt(6, 9), 1)),
    r => horiz(r, 2, F(1, r.nextInt(2, 9))),
    r => { const v = r.pick([[1, 4], [3, 4], [2, 5], [1, 5]]); return vert(r, 2, F(v[0], v[1], true)); },
    r => { const v = r.pick([[5, 2], [7, 2], [4, 3], [5, 3]]); return horiz(r, 2, F(v[0], v[1])); }
  ];
  buildMCQ(8, {
    instr: 'Describe the dilation of $g(x)$ compared with the parent function $f(x)=x$.',
    tips: ['$a\\,f(x)$ is a vertical dilation by factor $a$. $f(ax)$ is a horizontal dilation by factor $\\dfrac{1}{a}$.',
      'A factor greater than 1 stretches and a factor between 0 and 1 compresses. Ask: is the new line steeper or less steep than $y=x$?'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q9 · L 4-6 · Graph step functions (p.261, Example 2)
// ═══════════════════════════════════════════════════════════
const fl = h => `\\llbracket ${lin(1, 'x', h)}\\rrbracket`;         // ⟦x + h⟧
(function() {
  const N = n => `$${num(n)}$`;
  const nOpt = (n, why) => [N(n), why, n];
  const quarter = (r, lo, hi) => { let c; do { c = r.nextInt(lo * 4, hi * 4) / 4; } while (Number.isInteger(c)); return c; };
  function evalQ(r, level, lo, hi) {
    const h = r.nz(-3, 3), c = quarter(r, lo, hi), y = Math.floor(c + h);
    return { level, stem: `$${fl(h)}\\text{ at }x=${num(c)}$`, text: `Evaluate $f(x)=${fl(h)}$ at $x=${num(c)}$.`, correct: N(y), cv: y,
      wrongs: [nOpt(Math.trunc(c + h), 'Rounded toward zero. The greatest integer function always rounds down.'),
        nOpt(c + h, 'Did not round down to an integer.'), nOpt(y + 1, 'Rounded up instead of down.'), nOpt(y - 1, 'Went one integer too far down.')],
      steps: [`Inside first: $${num(c)}${pm(h)}=${num(c + h)}$.`, `Round down to the greatest integer $\\le ${num(c + h)}$: $${y}$.`],
      verify: { k: 'fn', f: fl(h), at: c } };
  }
  function graphQ(r, level, hs) {
    const h = r.pick(hs);
    const G = (hh, rev, why) => [GRAPH.greatestIntegerSteps(hh, rev), why, { f: fl(hh), rev }];
    const stem = `Which graph shows $f(x)=${fl(h)}$?`;
    return { level, stem, sig: stem, correct: GRAPH.greatestIntegerSteps(h, false), cv: { f: fl(h), rev: false },
      wrongs: [G(-h, false, `Shifted the wrong way: $${lin(1, 'x', h)}$ moves the graph ${h > 0 ? 'left' : 'right'}.`),
        G(h, true, 'The dots are reversed: each step has a closed dot on the left end and an open dot on the right end.'),
        G(0, false, 'This is the parent graph $\\llbracket x\\rrbracket$ — the shift is missing.'),
        G(h + (h > 0 ? 1 : -1), false, 'The shift is one unit too far.')],
      steps: [`$${fl(h)}$ is $\\llbracket x\\rrbracket$ shifted ${Math.abs(h)} unit${Math.abs(h) > 1 ? 's' : ''} ${h > 0 ? 'left' : 'right'}.`, `At $x=${-h}$ the value is $0$: a closed dot at $(${-h},0)$ and an open dot at $(${1 - h},0)$.`],
      verify: { k: 'stepgraph', f: fl(h) } };
  }
  function domainQ(r, level) {
    const h = r.nz(-4, 4);
    return { level, stem: `What is the <b>domain</b> of $f(x)=${fl(h)}$?`, correct: 'all real numbers', cv: 'all real numbers',
      wrongs: [['all integers', 'The outputs are integers, but you can input any real number.', 'all integers'],
        [`$x\\ge ${-h}$`, 'There is no starting point; the steps continue in both directions.', 'x≥'],
        ['whole numbers', 'You can input negatives and decimals too.', 'whole numbers']],
      steps: ['You can put any real number into $\\llbracket\\;\\rrbracket$.', 'Domain: all real numbers.'],
      verify: { k: 'fact', answer: 'all real numbers' } };
  }
  function rangeQ(r, level) {
    const h = r.nz(-4, 4);
    return { level, stem: `What is the <b>range</b> of $f(x)=${fl(h)}$?`, correct: 'all integers', cv: 'all integers',
      wrongs: [['all real numbers', 'The function rounds down, so every output is an integer.', 'all real numbers'],
        [`$y\\ge ${h}$`, 'The steps continue downward forever.', 'y≥h'], ['$y\\ge 0$', 'Negative integers are also outputs.', 'y≥0']],
      steps: ['Every output of the greatest integer function is an integer, and every integer is reached.', 'Range: all integers.'],
      verify: { k: 'fact', answer: 'all integers' } };
  }
  function transQ(r, level, sign) {
    const h = sign * r.nextInt(2, 5), a = Math.abs(h), dirH = h > 0 ? 'left' : 'right';
    const g = fl(h);
    return { level, stem: `How does the graph of $${g}$ compare with the graph of $\\llbracket x\\rrbracket$?`, correct: `${a} units ${dirH}`, cv: { dx: -h },
      wrongs: [[`${a} units ${h > 0 ? 'right' : 'left'}`, `$x${pm(h)}$ inside moves the graph the opposite way of the sign: ${dirH}.`, { dx: h }],
        h > 0 ? [`${a} units down`, 'A change inside the brackets is a horizontal shift.', { dy: -a }] : [`${a} units up`, 'A change inside the brackets is a horizontal shift.', { dy: a }],
        [`${a} times as steep`, 'Adding inside the brackets shifts the graph; it does not stretch it.', { scale: a }]],
      steps: [`$\\llbracket x${pm(h)}\\rrbracket$ replaces $x$ with $x${pm(h)}$.`, `The graph shifts ${a} units ${dirH}.`],
      verify: { k: 'steptrans', g, f: '\\llbracket x\\rrbracket' } };
  }
  function notOnQ(r, level, shifted) {
    const h = shifted ? r.nz(-2, 2) : 0, f = fl(h);
    const xs = r.shuffle([-3, -2, -1, 1, 2, 3]).slice(0, 4);
    const F = x => Math.floor(x + h);
    const n = xs[0], off = [n, n + h - 1];                     // open-dot end of the previous step
    const half = xs[1] + 0.5, neg = xs[2] - 0.5, whole = xs[3];
    const P = p => `$(${num(p[0])}, ${num(p[1])})$`;
    return { level, stem: `For $f(x)=${f}$, which point is <b>not</b> on the graph?`, correct: P(off), cv: off,
      wrongs: [[P([half, F(half)]), `$f(${num(half)})=${F(half)}$, so this point is on the graph.`, [half, F(half)]],
        [P([neg, F(neg)]), `$f(${num(neg)})=${F(neg)}$, so this point is on the graph.`, [neg, F(neg)]],
        [P([whole, F(whole)]), `$f(${whole})=${F(whole)}$ — the closed dot, so it is on the graph.`, [whole, F(whole)]]],
      steps: [`$f(${n})=${F(n)}$, not $${n + h - 1}$.`, `$(${n}, ${n + h - 1})$ is the open dot at the end of the previous step, so it is not on the graph.`],
      verify: { k: 'noton', f } };
  }
  const P = [
    r => evalQ(r, 1, 0, 3), r => evalQ(r, 1, -3, -1),
    r => graphQ(r, 2, [-1, -3]), r => graphQ(r, 2, [2, 3]),
    r => domainQ(r, 2), r => rangeQ(r, 2),
    r => transQ(r, 2, 1), r => transQ(r, 2, -1),
    r => graphQ(r, 2, [-4, 4]), r => evalQ(r, 2, -4, 4),
    r => notOnQ(r, 3, false), r => notOnQ(r, 3, true)
  ];
  buildMCQ(9, {
    instr: 'Use the greatest integer function $\\llbracket x\\rrbracket$ (round down).',
    tips: ['$\\llbracket x\\rrbracket$ is the greatest integer less than or equal to $x$: always round <b>down</b> (for $-1.5$ that is $-2$).',
      'Each step has a closed dot on its left end and an open dot on its right end. $\\llbracket x+h\\rrbracket$ shifts the steps $h$ units left.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q10 · L 4-6 · Evaluate step functions (p.265, Ex. 18a–d)
// ═══════════════════════════════════════════════════════════
(function() {
  const N = n => `$${num(n)}$`;
  const nOpt = (n, why) => [N(n), why, n];
  const dec = (r, lo, hi) => { let c; do { c = r.nextInt(lo * 20, hi * 20) / 20; } while (Number.isInteger(c)); return c; };
  // f(x) = a⟦x + h⟧ at x = c, with u = c + h inside the given range
  function scaled(r, level, name, hSign, uLo, uHi) {
    const a = r.nextInt(2, 4), h = hSign * r.nextInt(1, 3);
    const u = dec(r, uLo, uHi), c = Math.round((u - h) * 100) / 100;
    const f = `${a}${fl(h)}`, y = a * Math.floor(c + h);
    return { level, stem: `$${name}(x)=${f}$. Find $${name}(${num(c)})$.`, correct: N(y), cv: y,
      wrongs: [nOpt(a * Math.trunc(c + h), 'Rounded toward zero. The greatest integer function always rounds down.'),
        nOpt(a * (c + h), 'Did not round down before multiplying.'), nOpt(Math.floor(c + h), `Forgot to multiply by ${a}.`),
        nOpt(a * Math.floor(c), 'Ignored the shift inside the brackets.'), nOpt(a * Math.ceil(c + h), 'Rounded up instead of down.')],
      steps: [`Inside first: $${num(c)}${pm(h)}=${num(c + h)}$.`, `Round down: $\\llbracket ${num(c + h)}\\rrbracket=${Math.floor(c + h)}$.`, `Multiply: $${a}\\times${Math.floor(c + h) < 0 ? `(${Math.floor(c + h)})` : Math.floor(c + h)}=${y}$.`],
      verify: { k: 'fn', f, at: c } };
  }
  const P = [
    r => scaled(r, 1, 'f', -1, 0, 1),
    r => scaled(r, 1, 'f', -1, 1, 3),
    r => scaled(r, 1, 'g', 1, 1, 3),
    r => scaled(r, 2, 'f', -1, 5, 10),
    r => scaled(r, 2, 'g', 1, 0, 1),
    // L2 · ⟦x⟧ + k at a negative decimal
    r => { const k = r.nz(-6, 6), c = -dec(r, 0, 4), y = Math.floor(c) + k, f = `\\llbracket x\\rrbracket${pm(k)}`;
      return { level: 2, stem: `$h(x)=${f}$. Find $h(${num(c)})$.`, correct: N(y), cv: y,
        wrongs: [nOpt(Math.trunc(c) + k, 'Rounded toward zero. For negatives, rounding down moves further from zero.'), nOpt(c + k, 'Did not round down.'), nOpt(Math.floor(c) - k, `Sign error on the ${Math.abs(k)}.`), nOpt(Math.ceil(c) - k, 'Rounded up and made a sign error.')],
        steps: [`$\\llbracket ${num(c)}\\rrbracket=${Math.floor(c)}$ (round down).`, `$${Math.floor(c)}${pm(k)}=${y}$`], verify: { k: 'fn', f, at: c } }; },
    // L2 · -a⟦x⟧ at a positive decimal
    r => { const a = r.nextInt(2, 5), c = dec(r, 1, 6), y = -a * Math.floor(c), f = `-${a}\\llbracket x\\rrbracket`;
      return { level: 2, stem: `$k(x)=${f}$. Find $k(${num(c)})$.`, correct: N(y), cv: y,
        wrongs: [nOpt(-a * Math.ceil(c), 'Rounded up instead of down.'), nOpt(a * Math.floor(c), 'Lost the negative sign.'), nOpt(-a * c, 'Did not round down before multiplying.')],
        steps: [`$\\llbracket ${num(c)}\\rrbracket=${Math.floor(c)}$`, `$-${a}\\times${Math.floor(c)}=${y}$`], verify: { k: 'fn', f, at: c } }; },
    // L2 · ⟦a x⟧
    r => { const a = r.nextInt(2, 4), c = dec(r, 1, 3), y = Math.floor(a * c), f = `\\llbracket ${a}x\\rrbracket`;
      if (Number.isInteger(a * c)) return null;
      return { level: 2, stem: `$m(x)=${f}$. Find $m(${num(c)})$.`, correct: N(y), cv: y,
        wrongs: [nOpt(a * Math.floor(c), 'Rounded before multiplying — multiply inside first.'), nOpt(Math.ceil(a * c), 'Rounded up instead of down.'), nOpt(a * c, 'Did not round down.')],
        steps: [`Inside first: $${a}(${num(c)})=${num(a * c)}$.`, `Round down: $${y}$.`], verify: { k: 'fn', f, at: c } }; },
    r => scaled(r, 3, 'f', -1, -3, 0),
    r => scaled(r, 3, 'g', 1, -3, 0),
    // L3 · a⟦x - 0.5⟧ at an integer
    r => { const a = r.nextInt(2, 5), c = r.nextInt(2, 6), y = a * Math.floor(c - 0.5), f = `${a}\\llbracket x-0.5\\rrbracket`;
      return { level: 3, stem: `$q(x)=${f}$. Find $q(${c})$.`, correct: N(y), cv: y,
        wrongs: [nOpt(a * (c - 0.5), 'Did not round down before multiplying.'), nOpt(a * c, 'Ignored the $-0.5$ inside the brackets.'), nOpt(Math.floor(c - 0.5), `Forgot to multiply by ${a}.`)],
        steps: [`Inside first: $${c}-0.5=${num(c - 0.5)}$.`, `Round down: $${Math.floor(c - 0.5)}$.`, `Multiply: $${a}\\times${Math.floor(c - 0.5)}=${y}$.`], verify: { k: 'fn', f, at: c } }; },
    // L3 · ⟦x / a⟧ at a negative integer
    r => { const a = r.nextInt(2, 4), c = -r.nextInt(1, 11); if (c % a === 0) return null;
      const y = Math.floor(c / a), f = `\\llbracket \\tfrac{x}{${a}}\\rrbracket`;
      return { level: 3, stem: `$r(x)=${f}$. Find $r(${c})$.`, correct: N(y), cv: y,
        wrongs: [[`$${rs(rat(c, a))}$`, 'Did not round down.', c / a], nOpt(Math.trunc(c / a), 'Rounded toward zero. For negatives, rounding down moves further from zero.'), nOpt(-Math.floor(c / a), 'Sign error.')],
        steps: [`Inside first: $\\dfrac{${c}}{${a}}=${num(c / a)}$.`, `Round down: $${y}$.`], verify: { k: 'fn', f, at: c } }; }
  ];
  buildMCQ(10, {
    instr: 'Evaluate the step function. Work inside first, round down, then multiply.',
    tips: ['Order: calculate inside the brackets, then round <b>down</b>, then do what is outside.',
      'For negative numbers, rounding down moves away from zero: $\\llbracket -2.25\\rrbracket=-3$.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q11 · L 4-7 · Translations of absolute value functions (p.267)
// ═══════════════════════════════════════════════════════════
const absF = (h, k) => `|${h === 0 ? 'x' : lin(1, 'x', -h)}|${k ? pm(k) : ''}`;   // |x - h| + k
(function() {
  const units = n => `${n} unit${n === 1 ? '' : 's'}`;
  const H = h => h > 0 ? 'right' : 'left', V = k => k > 0 ? 'up' : 'down';
  const desc = (dx, dy) => [`${dx ? `${Math.abs(dx)} ${H(dx)}` : ''}${dx && dy ? ', ' : ''}${dy ? `${Math.abs(dy)} ${V(dy)}` : ''}`, { dx, dy }];
  const D = (dx, dy, why) => { const [t, v] = desc(dx, dy); return [t, why, v]; };
  function vShift(r, level, sign, lo, hi) {
    const k = sign * r.nextInt(lo, hi), a = Math.abs(k), g = absF(0, k);
    const T = (t, why, dx, dy) => [`${units(a)} ${t}`, why, { dx, dy }];
    return { level, stem: `$g(x)=${g}$`, correct: `${units(a)} ${V(k)}`, cv: { dx: 0, dy: k },
      wrongs: [T(V(-k), `$${pm(k)}$ outside the absolute value moves the graph ${V(k)}.`, 0, -k),
        T('left', 'A number added outside $|x|$ is a vertical shift.', -a, 0), T('right', 'A number added outside $|x|$ is a vertical shift.', a, 0)],
      steps: [`$g(x)=|x|${pm(k)}$: the change is outside the absolute value, so the shift is vertical.`, `${cap(units(a))} ${V(k)}.`],
      verify: { k: 'absdesc', g } };
  }
  function hShift(r, level, sign, lo, hi) {
    const h = sign * r.nextInt(lo, hi), a = Math.abs(h), g = absF(h, 0);
    const T = (t, why, dx, dy) => [`${units(a)} ${t}`, why, { dx, dy }];
    return { level, stem: `$g(x)=${g}$`, correct: `${units(a)} ${H(h)}`, cv: { dx: h, dy: 0 },
      wrongs: [T(H(-h), `Inside the absolute value the shift goes the opposite way of the sign: $${lin(1, 'x', -h)}$ moves ${H(h)}.`, -h, 0),
        T('up', 'A change inside $|\\;|$ is a horizontal shift.', 0, a), T('down', 'A change inside $|\\;|$ is a horizontal shift.', 0, -a)],
      steps: [`$g(x)=${g}$: the change is inside the absolute value, so the shift is horizontal (opposite to the sign).`, `${cap(units(a))} ${H(h)}.`],
      verify: { k: 'absdesc', g } };
  }
  function both(r, level, hSign, kSign) {
    const h = hSign * r.nextInt(1, 6), k = kSign * r.nextInt(1, 6); if (Math.abs(h) === Math.abs(k)) return null;
    const g = absF(h, k), [ct, cv] = desc(h, k);
    return { level, stem: `Describe $g(x)=${g}$ compared with $f(x)=|x|$.`, correct: ct, cv,
      wrongs: [D(-h, k, 'The horizontal shift goes the opposite way of the sign inside $|\\;|$.'), D(h, -k, 'The number outside $|\\;|$ shifts up when positive, down when negative.'),
        D(Math.sign(h) * Math.abs(k), Math.sign(k) * Math.abs(h), 'Swapped the horizontal and vertical amounts.'), D(-h, -k, 'Both directions are reversed.')],
      steps: [`Inside: $${lin(1, 'x', -h)}$ → ${Math.abs(h)} ${H(h)}.`, `Outside: $${pm(k)}$ → ${Math.abs(k)} ${V(k)}.`],
      verify: { k: 'absdesc', g } };
  }
  function fromWords(r, level, hSign, kSign) {
    const h = hSign * r.nextInt(1, 7), k = kSign * r.nextInt(1, 7); if (Math.abs(h) === Math.abs(k)) return null;
    const F = (hh, kk, why) => [`$g(x)=${absF(hh, kk)}$`, why, absF(hh, kk)];
    return { level, stem: `Which function is $f(x)=|x|$ translated <b>${units(Math.abs(h))} ${H(h)} and ${units(Math.abs(k))} ${V(k)}</b>?`,
      correct: `$g(x)=${absF(h, k)}$`, cv: absF(h, k),
      wrongs: [F(-h, k, `Moving ${H(h)} uses $x${h > 0 ? '-' : '+'}${Math.abs(h)}$ inside the absolute value.`), F(Math.sign(h) * Math.abs(k), Math.sign(k) * Math.abs(h), 'Swapped the horizontal and vertical amounts.'), F(h, -k, `Moving ${V(k)} means ${k > 0 ? 'adding' : 'subtracting'} ${Math.abs(k)} outside.`)],
      steps: [`${H(h) === 'right' ? 'Right' : 'Left'} ${Math.abs(h)}: replace $x$ with $${lin(1, 'x', -h)}$.`, `${V(k) === 'up' ? 'Up' : 'Down'} ${Math.abs(k)}: ${k > 0 ? 'add' : 'subtract'} ${Math.abs(k)}.`, `$g(x)=${absF(h, k)}$`],
      verify: { k: 'absfn', vh: h, vk: k } };
  }
  function vertex(r, level) {
    const h = r.nz(-6, 6), k = r.nz(-6, 6); if (Math.abs(h) === Math.abs(k)) return null;
    const g = absF(h, k), P = (x, y, why) => [`$(${x}, ${y})$`, why, [x, y]];
    return { level, stem: `What is the vertex of $g(x)=${g}$?`, correct: `$(${h}, ${k})$`, cv: [h, k],
      wrongs: [P(-h, k, 'The $x$-coordinate of the vertex has the opposite sign of the number inside.'), P(k, h, 'Swapped the coordinates.'), P(h, -k, 'The $y$-coordinate is the number outside, with its sign.'), P(-h, -k, 'Sign errors on both coordinates.')],
      steps: [`$g(x)=|x-h|+k$ has vertex $(h,k)$.`, `$${lin(1, 'x', -h)}$ gives $h=${h}$; $${pm(k)}$ gives $k=${k}$. Vertex $(${h}, ${k})$.`],
      verify: { k: 'absvertex', g } };
  }
  const P = [
    r => vShift(r, 1, -1, 1, 5), r => vShift(r, 1, 1, 1, 9), r => hShift(r, 1, 1, 1, 9), r => hShift(r, 1, -1, 2, 5),
    r => vShift(r, 2, -1, 6, 9), r => hShift(r, 2, -1, 6, 9), r => both(r, 2, 1, 1),
    r => both(r, 3, -1, -1), r => fromWords(r, 3, 1, -1), r => vertex(r, 3), r => fromWords(r, 3, -1, 1), r => vertex(r, 3)
  ];
  buildMCQ(11, {
    instr: 'Describe the translation of $g(x)$ compared with $f(x)=|x|$.',
    tips: ['A number added <b>outside</b> $|x|$ moves the graph up (+) or down (−).',
      'A number <b>inside</b> $|x-h|$ moves the graph horizontally, opposite to its sign: $|x-3|$ moves right 3, $|x+3|$ moves left 3.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q12 · L 4-7 · Graph absolute value functions (p.277, Ex. 7–12)
// ═══════════════════════════════════════════════════════════
(function() {
  function graphQ(r, level, hR, kR) {
    const h = hR(r), k = kR(r);
    if (h !== 0 && k !== 0 && Math.abs(h) === Math.abs(k)) return null;
    const cands = [[-h, k], [h, -k], [k, h], [-k, -h], [0, -h], [0, h], [k, 0], [-k, 0], [-h, -k]];
    const seen = new Set([`${h},${k}`]), wrongs = [];
    const whyFor = (hh, kk) => hh === -h && kk === k ? 'The horizontal shift is opposite to the sign inside $|\\;|$.'
      : hh === h && kk === -k ? 'The vertical shift has the wrong sign.'
        : 'The horizontal and vertical shifts are mixed up.';
    cands.forEach(([hh, kk]) => { if (!seen.has(`${hh},${kk}`)) { seen.add(`${hh},${kk}`); wrongs.push([`$y=${absF(hh, kk)}$`, whyFor(hh, kk), absF(hh, kk)]); } });
    return { level, stem: 'Which equation matches the graph?', text: 'Which equation matches the graph?' + GRAPH.absoluteValueV(h, k),
      sig: `${absF(h, k)} ${h} ${k}`, correct: `$y=${absF(h, k)}$`, cv: absF(h, k), wrongs,
      steps: [`The vertex is at $(${h}, ${k})$.`, `So $h=${h}$ and $k=${k}$: $y=|x-h|+k=${absF(h, k)}$.`],
      verify: { k: 'absfn', vh: h, vk: k } };
  }
  const z = () => 0, neg = (a, b) => r => -r.nextInt(a, b), pos = (a, b) => r => r.nextInt(a, b), pick = list => r => r.pick(list);
  const P = [
    // vertex ranges are kept apart so one set never shows the same graph twice
    r => graphQ(r, 1, neg(1, 3), z), r => graphQ(r, 1, z, neg(1, 4)), r => graphQ(r, 1, z, pos(1, 3)),
    r => graphQ(r, 2, neg(1, 3), neg(1, 3)), r => graphQ(r, 2, pick([-4, 4, 5]), z), r => graphQ(r, 2, pos(1, 4), pos(1, 3)),
    r => graphQ(r, 2, neg(1, 4), pos(1, 3)), r => graphQ(r, 2, pos(1, 3), z), r => graphQ(r, 2, z, pick([5, -5])),
    r => graphQ(r, 3, pos(2, 5), neg(1, 4)), r => graphQ(r, 3, neg(4, 5), neg(2, 5)), r => graphQ(r, 3, pos(1, 3), neg(4, 5))
  ];
  buildMCQ(12, {
    instr: 'Use the graph to choose the equation of the function.',
    tips: ['Find the vertex $(h,k)$ of the V, then use $y=|x-h|+k$.',
      'A vertex to the right means $|x-h|$; to the left means $|x+h|$. Above the $x$-axis means $+k$; below means $-k$.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q13 · L 5-1 · Slope-intercept form from slope and a point (p.293, Ex. 33–42)
// ═══════════════════════════════════════════════════════════
(function() {
  function onLine(r, level, yes) {
    const d = r.pick([1, 2, 3, 4, 5]), n = r.nz(-4, 4); if (d > 1 && gcd(n, d) !== 1) return null;
    const m = rat(n, d), b = r.nz(-10, 10), x = d * r.nz(-4, 4);
    const y = m.v * x + b, py = yes ? y : y + r.nz(-6, 6);
    const ys = -m.v * x + b;                                   // sign slip on m·x
    const rhs = lineY(m, rI(b)).slice(2);
    const O = (isYes, yy, why) => [`${isYes ? 'Yes' : 'No'}: $y=${num(yy)}$`, why, { yes: isYes, y: yy }];
    const wrongs = yes
      ? [O(false, ys, `Sign error: $${ts(m)}(${x})=${num(m.v * x)}$.`), O(false, -y, 'Sign error in the final value.'), O(true, ys, `$${ts(m)}(${x})${pm(b)}=${num(y)}$, not $${num(ys)}$.`)]
      : [O(true, py, `Substituting $x=${x}$ gives $y=${num(y)}$, not $${num(py)}$.`), O(false, ys, `Sign error: $${ts(m)}(${x})=${num(m.v * x)}$.`), O(true, y, `The computed $y=${num(y)}$ does not match the point's $y=${num(py)}$, so the answer is No.`)];
    return { level, stem: `Is $(${x},${num(py)})$ on $y=${rhs}$?`, correct: yes ? `Yes: $y=${num(py)}$` : `No: $y=${num(y)}$`, cv: { yes, y },
      wrongs, steps: [`Substitute $x=${x}$: $y=${ts(m)}(${x})${pm(b)}=${num(y)}$.`, yes ? `This equals the point's $y$-value, so the point is on the line.` : `The point has $y=${num(py)}$, so it is not on the line.`],
      verify: { k: 'online', f: rhs, pt: [x, py] } };
  }
  function another(r, level, steps) {
    const [dx, dy] = r.pick(steps), s = r.sign();
    const x1 = r.nextInt(-6, 6), y1 = r.nextInt(-6, 6), x2 = x1 + dx * s, y2 = y1 + dy * s;
    const ans = r.next() < 0.5 ? [x2 + dx * s, y2 + dy * s] : [x1 - dx * s, y1 - dy * s];
    const Pt = (p, why) => [`$(${p[0]}, ${p[1]})$`, why, p];
    return { level, stem: `Which point is also on the line through $(${x1},${y1})$ and $(${x2},${y2})$?`, correct: `$(${ans[0]}, ${ans[1]})$`, cv: ans,
      wrongs: [Pt([x2 + dx * s, y2 - dy * s], 'Changed the sign of the rise.'), Pt([x2 + dy * s, y2 + dx * s], 'Used run over rise instead of rise over run.'),
        Pt([ans[1], ans[0]], 'Swapped the $x$- and $y$-coordinates.'), Pt([x1, y2], 'This point mixes the coordinates of the two given points.'), Pt([x2 + dx * s, y2], 'Moved the run without the rise.')],
      steps: [`The slope is $\\dfrac{${y2}-(${y1})}{${x2}-(${x1})}=${rs(rat(y2 - y1, x2 - x1))}$.`, `Keep moving the same run and rise from a known point to reach $(${ans[0]}, ${ans[1]})$.`],
      verify: { k: 'collinear', pts: [[x1, y1], [x2, y2]] } };
  }
  function slopePoint(r, level) {
    const m = r.nz(-5, 5), x1 = r.nz(-5, 5), y1 = r.nz(-9, 9), b = y1 - m * x1; if (b === 0 || b === y1 || Math.abs(m) === 1) return null;
    const L = (mm, bb, why) => EQ(lineY(rI(mm), rI(bb)), why);
    return { level, instr: 'Write the equation in slope-intercept form.', stem: `Slope $${m}$, through $(${x1},${y1})$.`, correct: `$${lineY(rI(m), rI(b))}$`, cv: lineY(rI(m), rI(b)),
      wrongs: [L(m, y1, 'Used the point\'s $y$-value as the $y$-intercept.'), L(m, -b, 'Sign error when solving for $b$.'), L(y1, m, 'Swapped the slope and the $y$-value.'), L(-m, y1 + m * x1, 'Sign error on the slope.')],
      steps: [`Substitute into $y=mx+b$: $${y1}=${m}(${x1})+b$.`, `$${y1}=${m * x1}+b$, so $b=${b}$.`, `$${lineY(rI(m), rI(b))}$`],
      verify: { k: 'line', slope: m, through: [[x1, y1]] } };
  }
  const small = [[1, 1], [1, 2], [2, 1], [1, -1], [2, -1], [1, 3]], big = [[2, 3], [3, 1], [1, -2], [3, -2], [2, -3]], frac = [[3, 1], [4, -3], [3, 2], [2, -5], [3, -4]];
  const P = [
    r => onLine(r, 1, false), r => onLine(r, 1, true), r => another(r, 1, small), r => another(r, 1, small),
    r => slopePoint(r, 1), r => slopePoint(r, 1),
    r => onLine(r, 2, true), r => onLine(r, 2, false), r => another(r, 2, big), r => another(r, 2, big),
    r => another(r, 3, frac), r => another(r, 3, frac)
  ];
  buildMCQ(13, {
    instr: 'Choose the correct answer.',
    tips: ['To test a point, substitute its $x$-value into the equation and compare the $y$-value you get.',
      'Points on the same line keep the same slope: from a known point, move the same run and rise.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q14 · L 5-2 · Point-slope form from two points (pp.297, 303)
// ═══════════════════════════════════════════════════════════
// y - y1 = m(x - x1), m rational
function pointSlope(m, x1, y1) {
  const left = y1 === 0 ? 'y' : `y${pm(-y1)}`;
  const inner = x1 === 0 ? 'x' : `x${pm(-x1)}`;
  let right;
  if (m.n === 0) right = '0';
  else if (m.n === 1 && m.d === 1) right = inner;
  else if (m.n === -1 && m.d === 1) right = x1 === 0 ? '-x' : `-(${inner})`;
  else right = x1 === 0 ? `${rs(m, '\\tfrac')}x` : `${rs(m, '\\tfrac')}(${inner})`;
  return `${left}=${right}`;
}
(function() {
  function twoPoints(r, level, slopes, zero) {
    const m = r.pick(slopes), t = r.pick([1, 1, 2]);
    const x1 = zero === 'x' ? 0 : r.nz(-7, 7), y1 = zero === 'y' ? 0 : r.nz(-8, 8);
    const x2 = x1 + m.d * t, y2 = y1 + m.n * t;
    if (Math.abs(x2) > 12 || Math.abs(y2) > 25 || x1 === y1) return null;
    const E = (mm, a, b, why) => EQ(pointSlope(mm, a, b), why);
    return { level, stem: `$(${x1},${y1})$ and $(${x2},${y2})$`, text: `Write an equation in point-slope form for the line through $(${x1},${y1})$ and $(${x2},${y2})$.`,
      correct: `$${pointSlope(m, x1, y1)}$`, cv: pointSlope(m, x1, y1),
      wrongs: [E(m, -x1, y1, 'Sign error with $x_1$: the form is $x-x_1$.'), E(m, x1, -y1, 'Sign error with $y_1$: the form is $y-y_1$.'),
        E(rat(m.d, m.n), x1, y1, 'Used run over rise for the slope.'), E(rat(-m.n, m.d), x1, y1, 'Sign error on the slope.'),
        E(m, y1, x1, 'Swapped the $x$- and $y$-coordinates of the point.'), E(m, -x1, -y1, 'Both signs of the point are flipped.')],
      steps: [`$m=\\dfrac{${y2}-(${y1})}{${x2}-(${x1})}=${rs(m)}$`, `Use $(${x1},${y1})$ in $y-y_1=m(x-x_1)$: $${pointSlope(m, x1, y1)}$`, `(Using the other point, $${pointSlope(m, x2, y2)}$, is the same line.)`],
      verify: { k: 'line', through: [[x1, y1], [x2, y2]] } };
  }
  const R = rat;
  const P = [
    r => twoPoints(r, 1, [rI(1)]), r => twoPoints(r, 1, [rI(1), rI(-1)]), r => twoPoints(r, 1, [rI(2), rI(3), rI(4)]),
    r => twoPoints(r, 2, [rI(5), rI(6), rI(8)]), r => twoPoints(r, 2, [rI(-3), rI(-4), rI(-5)]), r => twoPoints(r, 2, [R(4, 3), R(3, 2), R(5, 3)]),
    r => twoPoints(r, 2, [rI(-2), rI(-3)]), r => twoPoints(r, 2, [rI(2), rI(3)], 'x'), r => twoPoints(r, 2, [R(2, 3), R(3, 4), R(5, 2)]),
    r => twoPoints(r, 3, [R(-2, 3), R(-3, 4), R(-4, 3)]), r => twoPoints(r, 3, [rI(2), rI(-2), R(3, 2)]), r => twoPoints(r, 3, [R(-3, 2), R(-5, 3), R(-2, 5)])
  ];
  buildMCQ(14, {
    instr: 'Choose an equation in point-slope form for the line through the two points.',
    tips: ['First find the slope $m=\\dfrac{y_2-y_1}{x_2-x_1}$.',
      'Then use one point in $y-y_1=m(x-x_1)$. Watch the signs: the point $(2,-7)$ gives $y+7=m(x-2)$.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q15 · L 5-2 · Line through a point parallel to a given line (p.304, Ex. 25–29)
// ═══════════════════════════════════════════════════════════
// A x + B y = C written neatly
function stdForm(A, B, C) { return `${lin(A, 'x', 0)}${next(B, 'y')}=${C}`; }
(function() {
  function parallel(r, level, slopes, std) {
    const m = r.pick(slopes), x1 = m.d * r.nz(-3, 3) * (r.next() < 0.2 ? 0 : 1), y1 = r.nz(-8, 8);
    const b = rSub(rI(y1), rMul(m, rI(x1)));
    let given, b0;
    if (std) {                                        // A x + B y = C with slope -A/B = m
      const A = -m.n, B = m.d, C = r.nz(-12, 12) * B; if (A === 0) return null;
      given = stdForm(A, B, C); b0 = rat(C, B);
    } else { b0 = rI(r.nz(-9, 9)); given = lineY(m, b0); }
    if (b0.v === b.v) return null;
    const perp = rat(-m.d, m.n);
    const L = (mm, bb, why) => EQ(lineY(mm, bb), why);
    return { level, stem: `$(${x1},${y1})$; parallel to $${given}$`, text: `Write the line through $(${x1},${y1})$ that is parallel to $${given}$.`,
      correct: `$${lineY(m, b)}$`, cv: lineY(m, b),
      wrongs: [L(m, b0, 'This is the given line itself — it does not pass through the point.'),
        L(perp, rSub(rI(y1), rMul(perp, rI(x1))), 'Used the perpendicular slope. Parallel lines have the same slope.'),
        L(m, rI(y1), 'Used the point\'s $y$-value as the $y$-intercept.'),
        L(m, rAdd(rI(y1), rMul(m, rI(x1))), 'Sign error when solving for $b$.'),
        L(rat(-m.n, m.d), rAdd(rI(y1), rMul(m, rI(x1))), 'Sign error on the slope.')],
      steps: [std ? `Rewrite $${given}$: $${lineY(m, b0)}$, so $m=${rs(m)}$.` : `The given line has slope $m=${rs(m)}$; a parallel line has the same slope.`,
        `Substitute $(${x1},${y1})$: $${y1}=${rs(m)}(${x1})+b$, so $b=${rs(b)}$.`, `$${lineY(m, b)}$`],
      verify: { k: 'line', through: [[x1, y1]], parallelTo: given } };
  }
  const R = rat;
  const P = [
    r => parallel(r, 1, [rI(1)]), r => parallel(r, 1, [rI(2), rI(3)]), r => parallel(r, 1, [rI(-4), rI(-5), rI(-6)]), r => parallel(r, 1, [rI(2), rI(4)]),
    r => parallel(r, 2, [R(-1, 2), R(-1, 3), R(-1, 4)]), r => parallel(r, 2, [rI(-2), rI(-3), rI(-4)]), r => parallel(r, 2, [R(1, 3), R(1, 2), R(1, 4)]), r => parallel(r, 2, [R(2, 3), R(3, 2)]),
    r => parallel(r, 3, [R(-3, 4), R(-2, 3), R(-4, 3)]), r => parallel(r, 3, [rI(-2), rI(-3), rI(3)], true), r => parallel(r, 3, [R(1, 2), R(-1, 2), R(1, 3)], true), r => parallel(r, 3, [R(-2, 5), R(3, 4), R(-5, 2)])
  ];
  buildMCQ(15, {
    instr: 'Choose the line in slope-intercept form through the point, parallel to the given line.',
    tips: ['Parallel lines have the <b>same</b> slope. Write the given line in $y=mx+b$ form to read its slope.',
      'Substitute the point into $y=mx+b$ with that slope and solve for $b$.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q16 · L 5-2 · Parallel or perpendicular lines (pp.304–305, Ex. 31–43)
// ═══════════════════════════════════════════════════════════
(function() {
  const RELS = ['parallel', 'perpendicular', 'neither', 'same line'];
  const relWhy = {
    parallel: 'Parallel lines have equal slopes (and different $y$-intercepts).',
    perpendicular: 'Perpendicular slopes multiply to $-1$.',
    neither: 'The slopes are not equal and their product is not $-1$.',
    'same line': 'The equations are not multiples of each other, so they are different lines.'
  };
  function relQ(level, e1, e2, rel, steps) {
    if (QCHECK.relation(e1, e2) !== rel) return null;
    return { level, instr: 'Are the lines parallel, perpendicular, or neither?', stem: `$${e1}$ and $${e2}$`, correct: rel, cv: rel,
      wrongs: RELS.filter(x => x !== rel).map(x => [x, relWhy[rel], x]), steps,
      verify: { k: 'rel', e1, e2 } };
  }
  const sl = (A, B) => rs(rat(-A, B));
  // rewrite y + k = c(a x + d) in slope-intercept form
  function rewrite(r, level, c, a, d, k) {
    const eq = `y${pm(k)}=${c.d === 1 ? (c.n === -1 ? '-' : c.n) : ts(c)}(${lin(a, 'x', d)})`;
    const m = rMul(c, rI(a)), b = rSub(rMul(c, rI(d)), rI(k));
    if (b.v === 0) return null;
    const L = (mm, bb, why) => EQ(lineY(mm, bb), why);
    return { level, instr: 'Write the equation in slope-intercept form, $y=mx+b$.', stem: `$${eq}$`, correct: `$${lineY(m, b)}$`, cv: lineY(m, b),
      wrongs: [L(m, rAdd(rMul(c, rI(d)), rI(k)), `Sign error when moving $${pm(k)}$ to the right side.`), L(m, rSub(rI(d), rI(k)), `Forgot to multiply the constant ${d} by $${rs(c)}$.`),
        L(c, b, `Forgot to multiply the $x$-term by $${rs(c)}$.`), L(rat(-m.n, m.d), b, 'Sign error on the slope.')],
      steps: [`Distribute: $y${pm(k)}=${rLead(m, 'x')}${rNext(rMul(c, rI(d)))}$`, `${k > 0 ? 'Subtract' : 'Add'} ${Math.abs(k)}: $${lineY(m, b)}$`],
      verify: { k: 'line', same: eq } };
  }
  const P = [
    // L1 · y = m x + b and m x + y = c → neither
    r => { const m = r.nextInt(2, 6) * r.sign(), b = r.nz(-9, 9), c = r.nz(-9, 9);
      return relQ(1, `y=${lin(m, 'x', b)}`, `${lead(m, 'x')}+y=${c}`, 'neither', [`Slopes: $${m}$ and $${-m}$.`, `They are not equal, and $(${m})(${-m})=${-m * m}\\ne-1$: neither.`]); },
    // L1 · y = -m x and m x + y = c → parallel
    r => { const m = r.nextInt(2, 7) * r.sign(), b = r.nz(-6, 6) * (r.next() < 0.5 ? 0 : 1), c = r.nz(-9, 9); if (c === b) return null;
      return relQ(1, `y=${lin(-m, 'x', b)}`, `${lead(m, 'x')}+y=${c}`, 'parallel', [`Slopes: $${-m}$ and $${-m}$ (rewrite: $y=${lin(-m, 'x', c)}$).`, 'Equal slopes, different intercepts: parallel.']); },
    r => rewrite(r, 1, rI(r.nextInt(2, 4)), r.nextInt(2, 4), r.nz(-5, 5), r.nz(-9, 9)),
    r => rewrite(r, 1, rI(-r.nextInt(2, 5)), 1, r.nz(-6, 6), r.nz(-9, 9)),
    // L2 · a x + b y = c and b x - a y = d → perpendicular
    r => { const a = r.nextInt(1, 7), b = r.nextInt(2, 7), c = r.nz(-15, 15), d = r.nz(-15, 15); if (a === b) return null;
      return relQ(2, stdForm(a, b, c), stdForm(b, -a, d), 'perpendicular', [`Slopes: $${sl(a, b)}$ and $${sl(b, -a)}$.`, 'Their product is $-1$: perpendicular.']); },
    // L2 · -a x + b y = c and -b x + a y = d → neither (reciprocal slopes)
    r => { const a = r.nextInt(1, 7), b = r.nextInt(2, 7), c = r.nz(-12, 12), d = r.nz(-12, 12); if (a === b) return null;
      return relQ(2, stdForm(-a, b, c), stdForm(-b, a, d), 'neither', [`Slopes: $${sl(-a, b)}$ and $${sl(-b, a)}$.`, 'They are reciprocals, not negative reciprocals, and not equal: neither.']); },
    // L2 · a x + b y = c and k a x + k b y = d → parallel
    r => { const a = r.nextInt(1, 6), b = r.nextInt(2, 9), k = r.nextInt(2, 3), c = r.nz(-40, 40), d = r.nz(-50, 50); if (d === k * c || gcd(a, b) !== 1) return null;
      return relQ(2, stdForm(a, b, c), stdForm(k * a, k * b, d), 'parallel', [`Slopes: $${sl(a, b)}$ and $${sl(k * a, k * b)}=${sl(a, b)}$.`, `Equal slopes, and $${d}\\ne${k}(${c})$, so the lines are different: parallel.`]); },
    r => { const q = r.nextInt(2, 4), s = r.sign(); return rewrite(r, 2, rat(s, q), r.nextInt(1, 5), q * r.nz(-3, 3), r.nz(-6, 6)); },
    r => rewrite(r, 2, rI(-r.nextInt(3, 8)), 1, r.nz(-9, 9), r.nz(-12, 12)),
    // L3 · standard form from intercepts
    r => { const p = r.nz(-8, 8), q = r.nz(-8, 8); if (Math.abs(p) === Math.abs(q)) return null;
      let A = q, B = p, C = p * q; const g = gcd(gcd(A, B), C); A /= g; B /= g; C /= g; if (A < 0) { A = -A; B = -B; C = -C; }
      const S = (a, b, c, why) => EQ(stdForm(a, b, c), why);
      const eq = stdForm(A, B, C);
      return { level: 3, instr: 'Write the equation in standard form, $Ax+By=C$.', stem: `$x$-intercept $${p}$, $y$-intercept $${q}$`, correct: `$${eq}$`, cv: eq,
        wrongs: [S(B, A, C, 'Swapped the coefficients — check by substituting the intercepts.'), S(A, -B, C, 'Sign error on the $y$-term.'), S(1, 1, p + q, 'Adding the intercepts does not give the line.'), S(A, B, -C, 'Sign error on the constant.')],
        steps: [`The line passes through $(${p},0)$ and $(0,${q})$: $\\dfrac{x}{${p}}+\\dfrac{y}{${q}}=1$.`, `Multiply by $${p * q}$ and simplify: $${eq}$.`],
        verify: { k: 'line', through: [[p, 0], [0, q]] } }; },
    r => { const q = r.nextInt(2, 5), p = r.nz(-4, 4); if (gcd(p, q) !== 1) return null; return rewrite(r, 3, rat(p, q), 1, r.nz(-9, 9), r.nz(-9, 9)); },
    // L3 · y + k = (p/q)(x + h) in standard form
    r => { const q = r.nextInt(2, 9), p = r.nz(-9, 9), h = r.nz(-6, 6), k = r.nz(-9, 9); if (gcd(p, q) !== 1) return null;
      const s = p < 0 ? -1 : 1, A = s * p, B = -s * q, C = s * (q * k - p * h);
      const eq = `y${pm(k)}=${ts(rat(p, q))}(${lin(1, 'x', h)})`, ans = stdForm(A, B, C);
      const S = (a, b, c, why) => EQ(stdForm(a, b, c), why);
      return { level: 3, instr: 'Write the equation in standard form, $Ax+By=C$.', stem: `$${eq}$`, correct: `$${ans}$`, cv: ans,
        wrongs: [S(A, -B, C, 'Sign error on the $y$-term when moving it to the left.'), S(A, B, -C, 'Sign error on the constant.'), S(-B, -A, C, 'Swapped the coefficients of $x$ and $y$.'), S(A, B, s * (q * k + p * h), 'Sign error when distributing.')],
        steps: [`Multiply by ${q}: $${q}(y${pm(k)})=${p}(${lin(1, 'x', h)})$`, `$${lin(q, 'y', q * k)}=${lin(p, 'x', p * h)}$`, `Move the terms: $${ans}$`],
        verify: { k: 'line', same: eq } }; }
  ];
  buildMCQ(16, {
    instr: 'Decide how the lines are related, or rewrite the equation.',
    tips: ['Rewrite each equation as $y=mx+b$ to compare slopes. For $Ax+By=C$, the slope is $-\\dfrac{A}{B}$.',
      'Equal slopes → parallel. Slopes with product $-1$ → perpendicular. Otherwise → neither.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q17 · L 5-6 · Inverses of relations (p.331, Ex. 4–9)
// ═══════════════════════════════════════════════════════════
(function() {
  const fmtSet = ps => `$\\{${ps.map(p => `(${num(p[0])},${num(p[1])})`).join(',')}\\}$`;
  const fmtStem = ps => `$\\{${ps.map(p => `(${num(p[0])},${num(p[1])})`).join(', ')}\\}$`;
  function relQ(level, rel) {
    const T = (f, why) => { const ps = rel.map(f); return [fmtSet(ps), why, ps]; };
    const inv = rel.map(([x, y]) => [y, x]);
    return { level, stem: fmtStem(rel), correct: fmtSet(inv), cv: inv,
      wrongs: [T(([x, y]) => [-x, -y], 'Changed the signs instead of switching the coordinates.'), T(([x, y]) => [-y, -x], 'Switched the coordinates but also changed their signs.'),
        T(([x, y]) => [y, -x], 'Switched the coordinates but changed a sign.'), T(([x, y]) => [x, y], 'This is the original relation.'), T(([x, y]) => [-y, x], 'Switched the coordinates but changed a sign.')],
      steps: ['The inverse switches the $x$- and $y$-coordinates of every ordered pair.', `Inverse: ${fmtSet(inv)}`],
      verify: { k: 'inv', rel } };
  }
  const linRel = (xs, m, b) => xs.map(x => [x, Math.round((m * x + b) * 100) / 100]);
  const P = [
    r => { const s = r.nextInt(-5, -2), st = r.nextInt(1, 3); return relQ(1, linRel([0, 1, 2, 3].map(i => s + st * i), r.nextInt(2, 4), r.nz(-9, 9))); },
    r => { const s = r.nextInt(2, 6), st = -r.nextInt(2, 3); return relQ(1, linRel([0, 1, 2, 3].map(i => s + st * i), r.nextInt(2, 3), r.nz(-15, 0))); },
    r => { const s = r.nextInt(3, 6); return relQ(1, linRel([0, 1, 2, 3].map(i => s - i), r.nextInt(3, 6), r.nz(-15, 0))); },
    // L1 · inverse of a point
    r => { const p = r.nz(-9, 9), q = r.nz(-9, 9); if (Math.abs(p) === Math.abs(q)) return null;
      const Pt = (a, b, why) => [`$(${a},${b})$`, why, [[a, b]]];
      return { level: 1, stem: `The inverse of the point $(${p},${q})$ is`, correct: `$(${q},${p})$`, cv: [[q, p]],
        wrongs: [Pt(-p, -q, 'Changed the signs instead of switching the coordinates.'), Pt(-q, -p, 'Switched the coordinates but also changed their signs.'), Pt(p, -q, 'The inverse switches the coordinates.'), Pt(-q, p, 'Switched the coordinates but changed a sign.')],
        steps: [`Switch the coordinates: $(${p},${q})\\to(${q},${p})$.`], verify: { k: 'inv', rel: [[p, q]] } }; },
    r => { const p = -r.nextInt(1, 9), q = -r.nextInt(1, 9); if (p === q) return null;
      const Pt = (a, b, why) => [`$(${a},${b})$`, why, [[a, b]]];
      return { level: 1, stem: `The inverse of the point $(${p},${q})$ is`, correct: `$(${q},${p})$`, cv: [[q, p]],
        wrongs: [Pt(-p, -q, 'Changed the signs instead of switching the coordinates.'), Pt(-q, -p, 'Switched the coordinates but also changed their signs.'), Pt(p, q, 'This is the original point.')],
        steps: [`Switch the coordinates: $(${p},${q})\\to(${q},${p})$.`], verify: { k: 'inv', rel: [[p, q]] } }; },
    r => { const s = -r.nextInt(1, 2); return relQ(2, linRel([0, 1, 2, 3].map(i => s - i), r.nextInt(3, 5), r.nextInt(15, 25))); },
    r => { const xs = r.shuffle([-10, -5, 3, 6, 5, -8]).slice(0, 4); return relQ(2, linRel(xs, -r.pick([0.2, 0.4]), r.nextInt(10, 15))); },
    r => { const xs = r.shuffle([-4, 8, -1, 4, 2, -3, 6]).slice(0, 4); return relQ(2, linRel(xs, r.nextInt(5, 8), -r.nextInt(14, 25))); },
    // L2 · domain / range of the inverse
    r => { const d = r.shuffle([-3, -1, 1, 2, 4, 5]).slice(0, 3).sort((a, b) => a - b), rg = r.shuffle([0, 2, 4, 6, 8, -2]).slice(0, 3).sort((a, b) => a - b);
      const S = (vals, why) => [`$\\{${vals.join(',')}\\}$`, why, vals];
      return { level: 2, stem: `A relation has domain $\\{${d.join(',')}\\}$ and range $\\{${rg.join(',')}\\}$. What is the <b>domain</b> of its inverse?`, correct: `$\\{${rg.join(',')}\\}$`, cv: rg,
        wrongs: [S(d, 'The inverse switches domain and range.'), S(rg.map(x => -x).sort((a, b) => a - b), 'The inverse switches coordinates; it does not change signs.'), ['all real numbers', 'The relation is a finite set of points.', 'all']],
        steps: ['The inverse switches $x$ and $y$, so the domain of the inverse is the range of the relation.', `Domain of the inverse: $\\{${rg.join(',')}\\}$`], verify: { k: 'set', ans: rg } }; },
    r => { const d = r.shuffle([-6, -4, -1, 0, 3, 7]).slice(0, 3).sort((a, b) => a - b), rg = r.shuffle([1, 5, 9, -3, 10]).slice(0, 3).sort((a, b) => a - b);
      const S = (vals, why) => [`$\\{${vals.join(',')}\\}$`, why, vals];
      return { level: 2, stem: `A relation has domain $\\{${d.join(',')}\\}$ and range $\\{${rg.join(',')}\\}$. What is the <b>range</b> of its inverse?`, correct: `$\\{${d.join(',')}\\}$`, cv: d,
        wrongs: [S(rg, 'The inverse switches domain and range.'), S(d.map(x => -x).sort((a, b) => a - b), 'The inverse switches coordinates; it does not change signs.'), ['all real numbers', 'The relation is a finite set of points.', 'all']],
        steps: ['The inverse switches $x$ and $y$, so the range of the inverse is the domain of the relation.', `Range of the inverse: $\\{${d.join(',')}\\}$`], verify: { k: 'set', ans: d } }; },
    r => { const xs = r.shuffle([-6, -2, 1, 3, 5, 7]).slice(0, 4); return relQ(2, linRel(xs, -r.nextInt(2, 4), r.nz(-6, 6))); },
    r => { const xs = r.shuffle([-10, -4, 2, 5, 8]).slice(0, 4); return relQ(2, linRel(xs, r.pick([0.5, 1.5, 0.3]), r.nextInt(1, 9))); }
  ];
  buildMCQ(17, {
    instr: 'Find the inverse of the relation.',
    tips: ['The inverse of a relation switches the coordinates of every ordered pair: $(x,y)\\to(y,x)$.',
      'The signs do not change. The domain of the inverse is the range of the original, and the range of the inverse is the original domain.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q18 · L 6-1 · Solve inequalities by subtraction (p.347, Ex. 7–12)
// ═══════════════════════════════════════════════════════════
const OPS = { '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge' };
const ineqTex = (v, op, b) => `${v}${OPS[op]}${typeof b === 'object' ? rs(b) : b}`;
(function() {
  const I = (v, op, b, why) => [`$${ineqTex(v, op, b)}$`, why, ineqTex(v, op, b)];
  function graphQ(r, level, dot, dir, sign) {
    const p = sign * r.nextInt(1, 6), lo = p - r.nextInt(2, 6), range = [lo, lo + 8];
    const op = dir === 'left' ? (dot === 'open' ? '<' : '<=') : (dot === 'open' ? '>' : '>=');
    const why = {
      '<': 'An open dot means $<$ or $>$ (the number is not included), and the ray points left: $<$.',
      '<=': 'A closed dot means the number is included ($\\le$ or $\\ge$), and the ray points left: $\\le$.',
      '>': 'An open dot means $<$ or $>$, and the ray points right: $>$.',
      '>=': 'A closed dot means the number is included, and the ray points right: $\\ge$.'
    }[op];
    return { level, stem: 'Write the inequality shown by the graph.', text: 'Write the inequality shown by the graph.' + GRAPH.numberLineRay(range, p, dot, dir),
      sig: `${ineqTex('x', op, p)} ${p}`, correct: `$${ineqTex('x', op, p)}$`, cv: ineqTex('x', op, p),
      wrongs: Object.keys(OPS).filter(o => o !== op).map(o => I('x', o, p, why)),
      steps: [`${dot === 'open' ? 'Open dot: $' + p + '$ is not included.' : 'Closed dot: $' + p + '$ is included.'}`, `The ray points ${dir}: $${ineqTex('x', op, p)}$.`],
      verify: { k: 'ineq', v: 'x', js: `V.x ${op} ${p}` } };
  }
  const flip = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
  // v + b op c  (or c op v + b) → v op' (c - b)
  function sub(r, level, form) {
    const v = r.pick(VARS), b = r.nz(-15, 20), c = r.nz(-20, 20), op = r.pick(['<', '<=', '>', '>=']);
    const ans = c - b;
    let stem, rop;
    if (form === 'left') { stem = `${lin(1, v, b)}${OPS[op]}${c}`; rop = op; }
    else if (form === 'right') { stem = `${c}${OPS[op]}${b}+${v}`; rop = flip[op]; }
    else { stem = `${c}${OPS[op]}${linC(b, 1, v)}`; rop = flip[op]; }
    if (ans === 0 || b === c) return null;
    return { level, stem: `$${stem}$`, correct: `$${ineqTex(v, rop, ans)}$`, cv: ineqTex(v, rop, ans),
      wrongs: [I(v, rop, c + b, `Undo $${pm(b)}$ by ${b > 0 ? 'subtracting' : 'adding'} ${Math.abs(b)}, not ${b > 0 ? 'adding' : 'subtracting'}.`),
        I(v, flip[rop], ans, 'Subtracting does not reverse the inequality sign.'),
        I(v, rop, -ans, 'Sign error in the subtraction.'),
        I(v, rop.includes('=') ? rop[0] : rop + '=', ans, 'Keep the same inequality symbol; only multiplying or dividing by a negative changes it.')],
      steps: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} on both sides.`, `$${ineqTex(v, rop, ans)}$`],
      verify: { k: 'ineq', v, ineq: stem } };
  }
  // k v ≤ b + (k-1) v → v ≤ b
  function both(r, level) {
    const v = r.pick(VARS), k = r.nextInt(2, 5), b = r.nz(-9, 9), op = r.pick(['<=', '>=', '<', '>']);
    const stem = r.next() < 0.5 ? `${k}${v}${OPS[op]}${linC(b, k - 1, v)}` : `${k}${v}${OPS[op]}${lin(k - 1, v, b)}`;
    return { level, stem: `$${stem}$`, correct: `$${ineqTex(v, op, b)}$`, cv: ineqTex(v, op, b),
      wrongs: [I(v, flip[op], b, 'Subtracting a variable term does not reverse the inequality sign.'), I(v, op, -b, 'Sign error on the constant.'),
        I(v, op, rat(b, 2 * k - 1), `Added $${lead(k - 1, v)}$ instead of subtracting it.`)],
      steps: [`Subtract $${lead(k - 1, v)}$ from both sides: $${ineqTex(v, op, b)}$.`], verify: { k: 'ineq', v, ineq: stem } };
  }
  const P = [
    r => graphQ(r, 1, 'open', 'left', -1), r => graphQ(r, 1, 'open', 'right', r.sign()), r => graphQ(r, 1, 'open', 'left', 1), r => graphQ(r, 1, 'closed', 'left', 1),
    r => sub(r, 1, 'left'), r => sub(r, 1, 'left'),
    r => graphQ(r, 2, 'closed', 'right', r.sign()), r => graphQ(r, 2, 'closed', 'left', -1), r => sub(r, 2, 'right'), r => sub(r, 2, 'leftc'),
    r => sub(r, 3, 'right'), r => both(r, 3)
  ];
  buildMCQ(18, {
    instr: 'Write the inequality shown by the graph, or solve the inequality.',
    tips: ['Open dot: $<$ or $>$. Closed dot: $\\le$ or $\\ge$. The ray shows which side the solutions are on.',
      'Undo addition by subtracting the same number on both sides. Adding or subtracting never reverses the inequality sign.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q19 · L 6-2 · Multi-step inequalities (p.354, Examples 2–3)
// ═══════════════════════════════════════════════════════════
(function() {
  const flip = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
  const I = (v, op, b, why) => [`$${ineqTex(v, op, b)}$`, why, ineqTex(v, op, b)];
  const word = { '<': 'is less than', '<=': 'is less than or equal to', '>': 'is greater than', '>=': 'is greater than or equal to' };
  const Q = (level, stem, tex, v, op, ans, wrongs, steps) => ({ level, stem, correct: `$${ineqTex(v, op, ans)}$`, cv: ineqTex(v, op, ans), wrongs, steps: [...steps, `$${ineqTex(v, op, ans)}$`], verify: { k: 'ineq', v, ineq: tex } });
  const n = 'n';
  const noFlip = 'Only reverse the sign when you multiply or divide by a negative number.';
  const mustFlip = 'Dividing or multiplying by a negative number reverses the inequality sign.';
  const P = [
    // L1 · A n - B op C
    r => { const A = r.nextInt(2, 9), x = r.nz(-6, 6), B = r.nextInt(1, 12), C = A * x - B, op = r.pick(['>=', '>', '<=']); if (C === 0) return null;
      return Q(1, `${cap(words(A))} times a number minus ${words(B)} ${word[op]} ${words(C)}.`, `${A}n-${B}${OPS[op]}${C}`, n, op, x,
        [I(n, flip[op], x, noFlip), I(n, op, rat(C - B, A), `Subtracted ${B} instead of adding it.`), I(n, op, -x, 'Sign error.')],
        [`$${A}n-${B}${OPS[op]}${C}$`, `Add ${B}: $${A}n${OPS[op]}${C + B}$. Divide by ${A}.`]); },
    // L1 · C op B + A n
    r => { const A = r.nextInt(2, 6), x = r.nz(-5, 8), B = r.nextInt(2, 20), C = B + A * x, op = r.pick(['>', '>=']); if (C <= 0) return null;
      return Q(1, `${cap(words(C))} ${word[op]} the sum of ${words(B)} and ${words(A)} times a number.`, `${C}${OPS[op]}${B}+${A}n`, n, flip[op], x,
        [I(n, op, x, 'Read the inequality carefully: the number is on the right side.'), I(n, flip[op], C - B, `Forgot to divide by ${A}.`), I(n, flip[op], rat(C + B, A), `Added ${B} instead of subtracting it.`)],
        [`$${C}${OPS[op]}${B}+${A}n$`, `Subtract ${B}: $${C - B}${OPS[op]}${A}n$. Divide by ${A}.`]); },
    // L2 · n/A - B op C
    r => { const A = r.nextInt(2, 9), B = r.nextInt(2, 15), C = r.nz(-10, 10), op = r.pick(['>', '<']), x = A * (C + B); if (x === 0) return null;
      return Q(2, `A number divided by ${words(A)} minus ${words(B)} ${word[op]} ${words(C)}.`, `\\dfrac{n}{${A}}-${B}${OPS[op]}${C}`, n, op, x,
        [I(n, op, -x, 'Sign error.'), I(n, op, rat(C + B, A), `Divided by ${A} instead of multiplying.`), I(n, flip[op], x, noFlip)],
        [`$\\dfrac{n}{${A}}-${B}${OPS[op]}${C}$`, `Add ${B}: $\\dfrac{n}{${A}}${OPS[op]}${C + B}$. Multiply by ${A}.`]); },
    // L2 · -n + B op C
    r => { const B = r.nextInt(2, 15), C = r.nz(-10, 15), op = r.pick(['<=', '<', '>=']), x = B - C; if (x === 0) return null;
      return Q(2, `The sum of the opposite of a number and ${words(B)} ${word[op]} ${words(C)}.`, `-n+${B}${OPS[op]}${C}`, n, flip[op], x,
        [I(n, op, x, mustFlip), I(n, op, C - B, `${mustFlip} Also check the sign of the answer.`), I(n, flip[op], B + C, `Undo $+${B}$ by subtracting ${B}.`)],
        [`$-n+${B}${OPS[op]}${C}$`, `Subtract ${B}: $-n${OPS[op]}${C - B}$. Divide by $-1$ and reverse the sign.`]); },
    // L2 · -a(b n + c) < d n
    r => { const a = r.nextInt(2, 4), b = r.nextInt(2, 7), c = r.nz(-6, 6), d = r.nextInt(2, 9), op = r.pick(['<', '>']);
      const ans = rat(-a * c, d + a * b); if (ans.n === 0 || d - a * b === 0) return null;
      const tex = `-${a}(${lin(b, n, c)})${OPS[op]}${d}n`;
      return Q(2, `$${tex}$`, tex, n, flip[op], ans,
        [I(n, op, ans, `The $n$-term ends up on the right side: read $${-a * c}${OPS[op]}${d + a * b}n$ from the side of $n$.`), I(n, flip[op], rat(a * c, d + a * b), 'Sign error when distributing.'), I(n, flip[op], rat(-a * c, d - a * b), 'Sign error when collecting the $n$-terms.')],
        [`Distribute: $${lin(-a * b, n, -a * c)}${OPS[op]}${d}n$`, `Add $${a * b}n$: $${-a * c}${OPS[op]}${d + a * b}n$`, `Divide by ${d + a * b}.`]); },
    // L2 · c op a(v - b) + d
    r => { const v = r.pick(VARS), a = r.nextInt(2, 5), b = r.nextInt(1, 9), x = r.nz(-6, 12), d = r.nz(-9, 9), c = a * (x - b) + d, op = r.pick(['>=', '<']);
      const tex = `${c}${OPS[op]}${a}(${v}-${b})${pm(d)}`;
      return Q(2, `$${tex}$`, tex, v, flip[op], x,
        [I(v, op, x, 'The variable is on the right side — read the inequality from the variable\'s side.'), I(v, flip[op], x - b, `Forgot to add the ${b} back.`), I(v, flip[op], rat(c - d + b, a), 'Did not distribute before solving.')],
        [`Distribute: $${c}${OPS[op]}${a}${v}${pm(-a * b + d)}$`, `$${c + a * b - d}${OPS[op]}${a}${v}$, divide by ${a}.`]); },
    // L2 · c + v op a(v + b) + d
    r => { const v = r.pick(VARS), a = r.nextInt(2, 4), b = r.nz(-5, 5), x = r.nz(-8, 8), d = r.nz(-6, 6), op = r.pick(['<=', '<']);
      const c = (a - 1) * x + a * b + d, tex = `${c}+${v}${OPS[op]}${a}(${lin(1, v, b)})${pm(d)}`;
      return Q(2, `$${tex}$`, tex, v, flip[op], x,
        [I(v, op, x, mustFlip), I(v, flip[op], -x, 'Sign error.'), I(v, flip[op], rat(b + d - c, 1 - a), `Forgot to multiply ${b} by ${a}.`)],
        [`Distribute: $${c}+${v}${OPS[op]}${a}${v}${pm(a * b + d)}$`, `$${1 - a}${v}${OPS[op]}${a * b + d - c}$`, `Divide by $${1 - a}$ and reverse the sign.`]); },
    // L3 · C op B - A n (divide by negative)
    r => { const A = r.nextInt(2, 10), x = r.nz(-6, 6), B = r.nextInt(2, 15), C = B - A * x, op = r.pick(['<', '<=']);
      return Q(3, `${cap(words(C))} ${word[op]} the difference of ${words(B)} and ${words(A)} times a number.`, `${C}${OPS[op]}${B}-${A}n`, n, op, x,
        [I(n, flip[op], x, mustFlip), I(n, op, -x, 'Sign error.'), I(n, flip[op], -x, 'Sign error and the sign was reversed incorrectly.')],
        [`$${C}${OPS[op]}${B}-${A}n$`, `Subtract ${B}: $${C - B}${OPS[op]}-${A}n$`, `Divide by $-${A}$ and reverse: $${x}${OPS[flip[op]]}n$, so`]); },
    // L3 · B - n/A op C
    r => { const A = r.nextInt(2, 5), B = r.nextInt(1, 12), C = r.nextInt(B + 1, B + 8), op = r.pick(['>=', '>']), x = A * (B - C);
      return Q(3, `${cap(words(B))} minus a number divided by ${words(A)} ${word[op]} ${words(C)}.`, `${B}-\\dfrac{n}{${A}}${OPS[op]}${C}`, n, flip[op], x,
        [I(n, op, x, mustFlip), I(n, flip[op], -x, 'Sign error.'), I(n, op, rat(B - C, A), `Divided by ${A} instead of multiplying, and did not reverse the sign.`)],
        [`Subtract ${B}: $-\\dfrac{n}{${A}}${OPS[op]}${C - B}$`, `Multiply by $-${A}$ and reverse the sign.`]); },
    // L3 · A n - B op C + D n (D > A)
    r => { const A = r.nextInt(2, 6), D = A + r.nextInt(2, 18), x = r.nz(-4, 4), B = r.nextInt(2, 9), C = (A - D) * x - B, op = r.pick(['>=', '<']);
      return Q(3, `The difference of ${words(A)} times a number and ${words(B)} ${word[op]} the sum of ${words(C)} and ${words(D)} times a number.`, `${A}n-${B}${OPS[op]}${C}+${D}n`, n, flip[op], x,
        [I(n, op, x, mustFlip), I(n, flip[op], -x, 'Sign error.'), I(n, op, -x, 'Sign error, and the sign must be reversed.')],
        [`$${A}n-${B}${OPS[op]}${C}+${D}n$`, `Subtract $${D}n$ and add ${B}: $${A - D}n${OPS[op]}${C + B}$`, `Divide by $${A - D}$ and reverse the sign.`]); },
    // L3 · a v + b > a(c + v) with b ≤ a c → no solution
    r => { const v = r.pick(VARS), a = r.nextInt(2, 6), c = r.nz(-5, 5), b = a * c - r.nextInt(0, 6), op = r.pick(['>', '>=']); if (op === '>=' && b === a * c) return null;
      const tex = `${lin(a, v, b)}${OPS[op]}${a}(${linC(c, 1, v)})`;
      return { level: 3, stem: `$${tex}$`, correct: '$\\varnothing$', cv: 'none',
        wrongs: [['all real numbers', `After subtracting $${a}${v}$, the statement $${b}${OPS[op]}${a * c}$ is false.`, 'all'], I(v, op, 0, `The variable terms cancel: $${b}${OPS[op]}${a * c}$ is false for every $${v}$.`), I(v, op, c, 'The variable terms cancel, so there is no boundary value.')],
        steps: [`Distribute: $${lin(a, v, b)}${OPS[op]}${lin(a, v, a * c)}$`, `Subtract $${a}${v}$: $${b}${OPS[op]}${a * c}$, which is false.`, 'No solution: $\\varnothing$'],
        verify: { k: 'ineq', v, ineq: tex } }; },
    // L3 · a(b - v) < c - a(v - d) with true statement → all real numbers
    r => { const v = r.pick(VARS), a = r.nextInt(2, 5), b = r.nextInt(1, 6), d = r.nextInt(1, 6), c = a * b - a * d + r.nextInt(1, 15), op = r.pick(['<', '<=']); if (c === 0) return null;
      const tex = `${a}(${b}-${v})${OPS[op]}${c}-${a}(${v}-${d})`;
      return { level: 3, stem: `$${tex}$`, correct: 'all real numbers', cv: 'all',
        wrongs: [['$\\varnothing$', `After adding $${a}${v}$, the statement $${a * b}${OPS[op]}${c + a * d}$ is true, so every number works.`, 'none'], I(v, op, rat(c + a * d - a * b, 2 * a), `The variable terms cancel; there is no boundary value.`), I(v, flip[op], rat(c - a * b, a), 'The variable terms cancel; there is no boundary value.')],
        steps: [`Distribute: $${linC(a * b, -a, v)}${OPS[op]}${linC(c + a * d, -a, v)}$`, `Add $${a}${v}$: $${a * b}${OPS[op]}${c + a * d}$, which is always true.`, 'Solution: all real numbers.'],
        verify: { k: 'ineq', v, ineq: tex } }; }
  ];
  buildMCQ(19, {
    instr: 'Write the inequality if needed, then solve it.',
    tips: ['Solve like an equation: undo addition/subtraction first, then multiplication/division.',
      'When you multiply or divide both sides by a <b>negative</b> number, reverse the inequality sign. If the variable cancels, check whether the statement left is true (all reals) or false ($\\varnothing$).'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q20 · L 6-4 · Absolute value inequalities (p.371, Ex. 1–10)
// ═══════════════════════════════════════════════════════════
(function() {
  const andT = (v, lo, hi, s) => `${rs(lo)}${s}${v}${s}${rs(hi)}`;
  const orT = (v, lo, hi, closed) => `${v}${closed ? '\\le' : '<'}${rs(lo)}\\text{ or }${v}${closed ? '\\ge' : '>'}${rs(hi)}`;
  const O = (t, why) => [`$${t}$`, why, t];
  // |a v + b| (< or ≤) c
  function less(r, level, aR, closed, bSign) {
    const v = r.pick(VARS), a = aR(r), lo = r.nextInt(-9, 3), hi = lo + 2 * r.nextInt(1, 5);
    if ((a * (hi - lo)) % 2) return null;
    const c = a * (hi - lo) / 2, b = -a * (lo + hi) / 2;
    if (b === 0 || (bSign && Math.sign(b) !== bSign)) return null;
    const s = closed ? '\\le' : '<', stem = `|${lin(a, v, b)}|${s}${c}`;
    return { level, stem: `$${stem}$`, correct: `$${andT(v, rI(lo), rI(hi), s)}$`, cv: andT(v, rI(lo), rI(hi), s),
      wrongs: [O(andT(v, rI(-hi), rI(-lo), s), `Sign error when undoing $${pm(b)}$.`), O(orT(v, rI(lo), rI(hi), closed), '"Less than" gives an <b>and</b> (between) solution, not an <b>or</b>.'),
        a > 1 ? O(andT(v, rI(-c - b), rI(c - b), s), `Forgot to divide by ${a}.`) : O(`${v}${s}${hi}`, 'This is only one of the two cases.'), O(`${v}${s}${hi}`, 'This is only one of the two cases.')],
      steps: [`$-${c}${s}${lin(a, v, b)}${s}${c}$`, `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}${a > 1 ? ` and divide by ${a}` : ''}: $${andT(v, rI(lo), rI(hi), s)}$`],
      verify: { k: 'ineq', v, ineq: stem } };
  }
  // |a v + b| (> or ≥) c
  function greater(r, level, aR, closed) {
    const v = r.pick(VARS), a = aR(r), lo = r.nextInt(-9, 3), hi = lo + 2 * r.nextInt(1, 5);
    if ((a * (hi - lo)) % 2) return null;
    const c = a * (hi - lo) / 2, b = -a * (lo + hi) / 2; if (b === 0) return null;
    const s = closed ? '\\ge' : '>', stem = `|${lin(a, v, b)}|${s}${c}`;
    return { level, stem: `$${stem}$`, correct: `$${orT(v, rI(lo), rI(hi), closed)}$`, cv: orT(v, rI(lo), rI(hi), closed),
      wrongs: [O(andT(v, rI(lo), rI(hi), closed ? '\\le' : '<'), '"Greater than" gives an <b>or</b> solution (outside), not between.'), O(orT(v, rI(-hi), rI(-lo), closed), `Sign error when undoing $${pm(b)}$.`),
        O(`${v}${s}${hi}`, 'This is only one of the two cases.'), a > 1 ? O(orT(v, rI(-c - b), rI(c - b), closed), `Forgot to divide by ${a}.`) : null],
      steps: [`$${lin(a, v, b)}${closed ? '\\le' : '<'}-${c}$ or $${lin(a, v, b)}${s}${c}$`, `Solve each: $${orT(v, rI(lo), rI(hi), closed)}$`],
      verify: { k: 'ineq', v, ineq: stem } };
  }
  function empty(r, level) {
    const v = r.pick(VARS), b = r.nz(-8, 8), c = r.nextInt(1, 9), stem = `|${lin(1, v, b)}|<-${c}`;
    return { level, stem: `$${stem}$`, correct: '$\\varnothing$', cv: 'none',
      wrongs: [O(andT(v, rI(-b - c), rI(-b + c), '<'), 'An absolute value is never negative, so it can never be less than a negative number.'), ['all real numbers', 'An absolute value is never less than a negative number.', 'all'], O(`${v}<${-b - c}`, 'An absolute value is never less than a negative number.')],
      steps: [`$|${lin(1, v, b)}|$ is always $\\ge 0$, so it can never be less than $-${c}$.`, 'No solution: $\\varnothing$'],
      verify: { k: 'ineq', v, ineq: stem } };
  }
  const one = () => 1, small = r => r.nextInt(2, 4);
  const P = [
    r => less(r, 1, one, false, 1), r => less(r, 1, one, true, 1), r => less(r, 1, one, false, -1),
    r => less(r, 2, small, true, -1), r => less(r, 2, small, false, -1), r => empty(r, 2), r => empty(r, 2),
    r => greater(r, 2, one, false), r => greater(r, 2, one, false), r => less(r, 2, small, false, 1),
    r => greater(r, 3, small, true), r => greater(r, 3, small, true)
  ];
  buildMCQ(20, {
    instr: 'Solve the inequality and choose the solution set.',
    tips: ['$|A|<c$ means $-c<A<c$ (an <b>and</b> / between solution). $|A|>c$ means $A<-c$ <b>or</b> $A>c$.',
      'An absolute value is never negative: $|A|<-c$ has no solution, and $|A|>-c$ is true for all real numbers.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// FRQ helpers
// ═══════════════════════════════════════════════════════════
const field = (label, display) => ({ label, correct: display, correctDisplay: display });
const md = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const money = c => `\\$${(c / 100).toFixed(2)}`;
const steps = list => list.join('<br>');

// ═══════════════════════════════════════════════════════════
// Q21 · L 2-4 & 6-3 · Distributive Property (3) + compound "and" inequalities (2)
// ═══════════════════════════════════════════════════════════
(function() {
  function distQ(level, v, eq, x, lines) {
    return { level, stem: `Solve $${eq}$.`, text: `Solve $${eq}$.`, final: `$${v}=${x}$`,
      fields: [field('Final answer', `$${v}=${x}$`)],
      solution: steps([`$${eq}$`, ...lines, `<b>$${v}=${x}$</b>`]),
      explanation: `Distribute, collect the $${v}$-terms on one side, then solve. Check: substituting $${v}=${x}$ makes both sides equal.`,
      verify: [{ k: 'eq', v, eq, val: x }] };
  }
  function andQ(level, v, stem, tex, lo, loC, hi, hiC, lines) {
    const ans = `${lo}${loC ? '\\le' : '<'}${v}${hiC ? '\\le' : '<'}${hi}`;
    return { level, instr: 'Solve the compound inequality, then graph the solution set on the number line.', stem, text: stem, final: `$${ans}$`,
      numberLine: { min: -10, max: 10 },
      fields: [field('Solution', `$${ans}$`), field('Graph', `${loC ? 'Closed' : 'Open'} dot at ${lo}, ${hiC ? 'closed' : 'open'} dot at ${hi}, shaded between`)],
      solution: steps([...lines, `<b>$${ans}$</b>`, GRAPH.numberLineSegment(-10, 10, lo, loC, hi, hiC)]),
      explanation: `"And" means both inequalities must be true, so the solution is the overlap: the numbers between ${lo} and ${hi}.`,
      verify: [{ k: 'ineq', v, ineq: tex, val: ans }] };
  }
  const P = [
    // L1 · a(v + b) = c(v + d)
    r => { const v = r.pick(VARS), a = r.nextInt(2, 8), c = r.nextInt(2, 8), x = r.nz(-8, 8), b = r.nz(-9, 9); if (a === c) return null;
      const t = (a - c) * x + a * b; if (t % c) return null; const d = t / c; if (d === 0 || d === b) return null;
      const eq = `${a}(${lin(1, v, b)})=${c}(${lin(1, v, d)})`;
      return distQ(1, v, eq, x, [`Distribute: $${lin(a, v, a * b)}=${lin(c, v, c * d)}$`, `Subtract $${c}${v}$: $${lin(a - c, v, a * b)}=${c * d}$`, `${a * b > 0 ? 'Subtract' : 'Add'} ${Math.abs(a * b)}: $${a - c}${v}=${c * d - a * b}$`, `Divide by ${a - c}.`]); },
    // L2 · a(v + b) - c = d - v
    r => { const v = r.pick(VARS), a = r.nextInt(2, 7), b = r.nz(-9, 9), c = r.nextInt(1, 12), x = r.nz(-8, 15), d = (a + 1) * x + a * b - c; if (d === 0) return null;
      const eq = `${a}(${lin(1, v, b)})-${c}=${d}-${v}`;
      return distQ(2, v, eq, x, [`Distribute: $${lin(a, v, a * b)}-${c}=${d}-${v}$`, `Combine: $${lin(a, v, a * b - c)}=${d}-${v}$`, `Add $${v}$: $${lin(a + 1, v, a * b - c)}=${d}$`, `$${a + 1}${v}=${d - a * b + c}$, divide by ${a + 1}.`]); },
    // L2 · L (< or ≤) a v + b (< or ≤) U
    r => { const v = r.pick(VARS), lo = r.nextInt(-8, 4), hi = lo + r.nextInt(2, 9), a = r.nextInt(2, 7), b = r.nz(-9, 9); if (hi > 8) return null;
      const loC = r.next() < 0.5, hiC = r.next() < 0.5, L = a * lo + b, U = a * hi + b;
      const tex = `${L}${loC ? '\\le' : '<'}${lin(a, v, b)}${hiC ? '\\le' : '<'}${U}`;
      return andQ(2, v, `Solve $${tex}$.`, tex, lo, loC, hi, hiC, [`$${tex}$`, `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} in all three parts: $${L - b}${loC ? '\\le' : '<'}${a}${v}${hiC ? '\\le' : '<'}${U - b}$`, `Divide all three parts by ${a}.`]); },
    // L2 · a v - b ≥ c and d v + e < f
    r => { const v = r.pick(VARS), lo = r.nextInt(-8, 3), hi = lo + r.nextInt(1, 6), a = r.nextInt(2, 7), d = r.nextInt(2, 9), b = r.nextInt(1, 9), e = r.nz(-12, 12);
      if (hi > 8) return null;
      const c = a * lo - b, f = d * hi + e;
      const i1 = `${a}${v}-${b}\\ge${c}`, i2 = `${lin(d, v, e)}<${f}`;
      return andQ(2, v, `Solve $${i1}$ and $${i2}$.`, `${i1} and ${i2}`, lo, true, hi, false,
        [`First: $${a}${v}\\ge${c + b}$, so $${v}\\ge${lo}$.`, `Second: $${d}${v}<${f - e}$, so $${v}<${hi}$.`, 'Both must be true (and).']); },
    // L3 · k v - a(v - b) = c(v - d)
    r => { const v = r.pick(VARS), k = r.nextInt(2, 6), a = r.nextInt(2, 7), c = r.nextInt(2, 5), b = r.nz(-8, 8), x = r.nz(-9, 9);
      const co = k - a - c; if (co === 0) return null; const t = co * x + a * b; if (t % c) return null; const d = -t / c; if (d === 0) return null;
      const eq = `${lead(k, v)}-${a}(${lin(1, v, -b)})=${c}(${lin(1, v, -d)})`;
      return distQ(3, v, eq, x, [`Distribute (watch the $-${a}$): $${lead(k, v)}${next(-a, v)}${pm(a * b)}=${lin(c, v, -c * d)}$`, `Combine: $${lin(k - a, v, a * b)}=${lin(c, v, -c * d)}$`, `Subtract $${c}${v}$: $${lin(co, v, a * b)}=${-c * d}$`, `$${co}${v}=${-c * d - a * b}$, divide by ${co}.`]); }
  ];
  buildFRQ(21, {
    instr: 'Solve. Show every step, then write your final answer.',
    tips: ['Distributive Property: multiply the number outside the brackets by <b>every</b> term inside, including the signs.',
      'For a compound inequality, do the same operation to every part. "And" means the solution is the overlap of both inequalities.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q22 · L 2-7 · Solve equations for specific variables (pp.120, 126)
// ═══════════════════════════════════════════════════════════
(function() {
  // Two-item budget: T = p1·x + p2·y (prices in cents)
  function budget(r, ctx) {
    const p1 = ctx.p1(r), p2 = ctx.p2(r); if (p1 === p2) return null;
    const B = ctx.B(r) * 100, given = ctx.given(r);
    const max1 = Math.floor(B / p1), max2 = Math.floor(B / p2);
    if (max1 < 2 || max2 < 2) return null;
    const rest = B - (ctx.solveFirst ? p2 : p1) * given; if (rest <= 0) return null;
    const pS = ctx.solveFirst ? p1 : p2;
    if (rest % pS === 0) return null;                       // keep "stay under budget" unambiguous
    const ans = Math.floor(rest / pS);
    let brute = 0; while (pS * (brute + 1) + (rest === 0 ? 0 : B - rest) <= B) brute++;   // count up independently
    const [x, y] = ctx.vars, sv = ctx.solveFirst ? x : y, ov = ctx.solveFirst ? y : x, pO = ctx.solveFirst ? p2 : p1;
    const pd = c => c % 100 === 0 ? String(c / 100) : (c / 100).toFixed(2);
    const formula = `${sv}=\\dfrac{T-${pd(pO)}${ov}}{${pd(pS)}}`;
    const stem = md(ctx.text(pd(p1), pd(p2), `\\$${pd(B)}`, given));
    const finalStr = `${max1} ${ctx.names[0]}/${max2} ${ctx.names[1]} max; $${formula}$; ${ans}`;
    return { level: 2, stem, text: stem, final: finalStr,
      fields: [field('a. Constraints', `At most ${max1} ${ctx.names[0]} (if no ${ctx.names[1]}) or ${max2} ${ctx.names[1]} (if no ${ctx.names[0]}); both are whole numbers $\\ge 0$, and $T\\le${`\\$${pd(B)}`}$`),
        field(`b. Solve for $${sv}$`, `$${formula}$`), field('c. Answer', `${ans} ${ctx.solveFirst ? ctx.names[0] : ctx.names[1]}`)],
      solution: steps([`<b>a.</b> $${`\\$${pd(B)}`}\\div${money(p1)}\\approx${num2(B / p1)}$ → at most ${max1} ${ctx.names[0]}. $${`\\$${pd(B)}`}\\div${money(p2)}\\approx${num2(B / p2)}$ → at most ${max2} ${ctx.names[1]}. Counts are whole numbers and the total cannot exceed $${`\\$${pd(B)}`}$.`,
        `<b>b.</b> $T=${pd(p1)}${x}+${pd(p2)}${y}$ → subtract $${pd(pO)}${ov}$, then divide by ${pd(pS)}: $${formula}$`,
        `<b>c.</b> $${sv}=\\dfrac{${pd(B)}-${pd(pO)}(${given})}{${pd(pS)}}=\\dfrac{${pd(rest)}}{${pd(pS)}}\\approx${num2(rest / pS)}$ → round <b>down</b>: <b>${ans}</b>`]),
      explanation: 'You cannot buy part of an item and you must stay within the budget, so round the answer down.',
      verify: [{ k: 'formula', a: 'T', b: ctx.solveFirst ? `${pd(p1)}\\left(\\dfrac{T-${pd(pO)}${ov}}{${pd(pS)}}\\right)+${pd(p2)}${y}` : `${pd(p1)}${x}+${pd(p2)}\\left(\\dfrac{T-${pd(pO)}${ov}}{${pd(pS)}}\\right)`, vars: ['T', x, y].filter((v, i) => i === 0 || v !== sv) },
        { k: 'num', val: ans, expect: brute }] };
  }
  const cents = (lo, hi) => r => r.nextInt(lo, hi) * 100 - r.pick([1, 51, 25, 0]);
  const P = [
    // L1 · solve a x + b y = c for y, then evaluate
    r => { const a = r.nz(-6, 6), b = r.nextInt(2, 6), k = r.nz(-5, 5), y0 = r.nz(-6, 6), c = a * k + b * y0; if (Math.abs(a) === 1 || a % b === 0) return null;
      const eq = stdForm(a, b, c), formula = `y=\\dfrac{${c}${next(-a, 'x')}}{${b}}`;
      const stem = `<b>a.</b> Solve $${eq}$ for $y$. <b>b.</b> Use your answer to find $y$ when $x=${k}$.`;
      return { level: 1, stem, text: stem, final: `$${formula}$; $y=${y0}$`,
        fields: [field('a.', `$${formula}$`), field('b.', `$y=${y0}$`)],
        solution: steps([`<b>a.</b> $${eq}$ → subtract $${lead(a, 'x')}$: $${b}y=${c}${next(-a, 'x')}$ → divide by ${b}: $${formula}$`, `<b>b.</b> $y=\\dfrac{${c}${pm(-a * k)}}{${b}}=\\dfrac{${c - a * k}}{${b}}=${y0}$`]),
        explanation: 'Treat $x$ like a number and isolate $y$ using inverse operations.',
        verify: [{ k: 'formula', a: `${lead(a, 'x')}+${b}\\left(\\dfrac{${c}${next(-a, 'x')}}{${b}}\\right)`, b: `${c}`, vars: ['x'] }, { k: 'num', val: y0, expect: (c - a * k) / b }] }; },
    r => budget(r, { vars: ['c', 'p'], names: ['cheese', 'pepperoni'], solveFirst: true, p1: cents(10, 14), p2: cents(14, 18), B: r => r.nextInt(60, 110), given: r => r.nextInt(1, 3),
      text: (a, b, B, g) => `**Pizza.** $T=${a}c+${b}p$, where $c$ = cheese pizzas and $p$ = pepperoni pizzas. **a.** Kishi has $${B}$. Describe the constraints. **b.** Solve for $c$. **c.** She buys ${g} pepperoni pizza${g > 1 ? 's' : ''}. Find the maximum number of cheese pizzas.` }),
    r => budget(r, { vars: ['p', 'f'], names: ['plain', 'flavored'], solveFirst: false, p1: cents(4, 7), p2: cents(7, 10), B: r => r.nextInt(35, 60), given: r => r.nextInt(2, 4),
      text: (a, b, B, g) => `**Coffee.** $T=${a}p+${b}f$, where $p$ = packages of plain and $f$ = packages of flavored coffee. **a.** Consuelo has $${B}$. Describe the constraints. **b.** Solve for $f$. **c.** She buys ${g} plain packages. Find the maximum number of flavored packages.` }),
    r => budget(r, { vars: ['b', 'w'], names: ['towels', 'washcloths'], solveFirst: true, p1: r => r.nextInt(5, 9) * 100, p2: r => r.nextInt(1, 3) * 100, B: r => r.nextInt(70, 120), given: r => r.nextInt(10, 25),
      text: (a, b, B, g) => `**Towels.** $T=${a}b+${b}w$, where $b$ = bath towels and $w$ = washcloths. **a.** The budget is $${B}$. Describe the constraints. **b.** Solve for $b$. **c.** She orders ${g} washcloths. How many bath towels can she order and stay under budget?` }),
    // L3 · perimeter
    r => { const l = r.nextInt(6, 20), w = r.nextInt(2, 12); if (w === l) return null; const P = 2 * l + 2 * w;
      const stem = md(`**Perimeter.** $P=2\\ell+2w$. **a.** Solve for $w$. **b.** Find the width of a rectangle with $P=${P}$ cm and $\\ell=${l}$ cm.`);
      return { level: 3, stem, text: stem, final: `$w=\\frac{P-2\\ell}{2}$; $w=${w}$ cm`,
        fields: [field('a.', '$w=\\dfrac{P-2\\ell}{2}$'), field('b.', `$w=${w}$ cm`)],
        solution: steps(['<b>a.</b> $P=2\\ell+2w$ → subtract $2\\ell$: $P-2\\ell=2w$ → divide by 2: $w=\\dfrac{P-2\\ell}{2}$', `<b>b.</b> $w=\\dfrac{${P}-2(${l})}{2}=\\dfrac{${P - 2 * l}}{2}=${w}$ cm`]),
        explanation: 'Isolate $w$ with inverse operations, then substitute the known values.',
        verify: [{ k: 'formula', a: '2l+2\\left(\\dfrac{P-2l}{2}\\right)', b: 'P', vars: ['P', 'l'] }, { k: 'num', val: w, expect: (P - 2 * l) / 2 }] }; }
  ];
  buildFRQ(22, {
    instr: 'Answer every part. Show your steps and write the final answers.',
    tips: ['To solve for one variable, treat every other letter like a number and use inverse operations.',
      'In budget problems the counts must be whole numbers, and the total must not go over the budget — round down.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q23 · L 4-1 · Graph linear functions using intercepts (p.216, Ex. 9–14)
// ═══════════════════════════════════════════════════════════
(function() {
  function interceptQ(level, eq, xi, yi, lines) {
    const X = `(${rs(xi)},0)`, Y = `(0,${yi})`;
    return { level, instr: 'Find both intercepts, then graph the equation on the grid.', stem: `Graph $${eq}$ by using the intercepts.`, text: `Graph $${eq}$ by using the intercepts.`,
      final: `$${X}$, $${Y}$`, coordGrid: {},
      fields: [field('$x$-intercept', `$${X}$`), field('$y$-intercept', `$${Y}$`), field('Graph', 'Plot both intercepts and draw the line through them')],
      solution: steps([...lines, `Plot $${X}$ and $${Y}$, then draw the line.`, GRAPH.interceptLine(xi.v, yi, `(${xi.d === 1 ? xi.n : num2(xi.v)}, 0)`, `(0, ${yi})`)]),
      explanation: 'The $x$-intercept is where $y=0$; the $y$-intercept is where $x=0$. Two points determine the line.',
      verify: [{ k: 'intercepts', eq, val: [xi.v, yi] }] };
  }
  const P = [
    // L1 · y = b + m x (integer x-intercept)
    r => { const m = r.nz(-4, 4), x0 = r.nz(-5, 5), b = -m * x0; if (Math.abs(b) > 6 || b === 0) return null;
      const eq = `y=${linC(b, m, 'x')}`;
      return interceptQ(1, eq, rI(x0), b, [`$x$-intercept: let $y=0$: $0=${linC(b, m, 'x')}$ → $x=${x0}$.`, `$y$-intercept: let $x=0$: $y=${b}$.`]); },
    // L1 · x + y = c or x - y = c
    r => { const c = r.nz(-6, 6), s = r.sign(), eq = `x${s > 0 ? '+' : '-'}y=${c}`;
      return interceptQ(1, eq, rI(c), s * c, [`$x$-intercept: let $y=0$: $x=${c}$.`, `$y$-intercept: let $x=0$: $${s > 0 ? '' : '-'}y=${c}$ → $y=${s * c}$.`]); },
    // L2 · c - y = k x  → y = c - k x
    r => { const c = r.nz(-6, 6), k = r.nz(-5, 5); if (Math.abs(k) === 1) return null; const xi = rat(c, k);
      const eq = `${c}-y=${lead(k, 'x')}`;
      return interceptQ(2, eq, xi, c, [`$x$-intercept: let $y=0$: $${c}=${lead(k, 'x')}$ → $x=${rs(xi)}$.`, `$y$-intercept: let $x=0$: $${c}-y=0$ → $y=${c}$.`]); },
    // L2 · x = a y + c
    r => { const a = r.nz(-5, 5), y0 = r.nz(-5, 5), c = -a * y0; if (Math.abs(c) > 6 || Math.abs(a) === 1) return null;
      const eq = `x=${lin(a, 'y', c)}`;
      return interceptQ(2, eq, rI(c), y0, [`$x$-intercept: let $y=0$: $x=${c}$.`, `$y$-intercept: let $x=0$: $0=${lin(a, 'y', c)}$ → $y=${y0}$.`]); },
    // L2 · y = c - k x (fraction x-intercept)
    r => { const c = r.nz(-6, 6), k = r.nextInt(2, 6), xi = rat(c, k); if (xi.d === 1) return null;
      const eq = `y=${c}-${k}x`;
      return interceptQ(2, eq, xi, c, [`$x$-intercept: let $y=0$: $0=${c}-${k}x$ → $x=${rs(xi)}$.`, `$y$-intercept: let $x=0$: $y=${c}$.`]); }
  ];
  buildFRQ(23, {
    instr: 'Find both intercepts, then graph the equation on the grid.',
    tips: ['$x$-intercept: substitute $y=0$ and solve for $x$. $y$-intercept: substitute $x=0$ and solve for $y$.',
      'Write each intercept as a point, plot both points, and draw a straight line through them.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q24 · L 4-5 · Arithmetic sequences (p.256, Ex. 23–26)
// ═══════════════════════════════════════════════════════════
(function() {
  // a_n = d·n + (a1 - d); values may be money in cents (unit 100)
  function seqQ(level, stem, a1, d, unit, ask, ansText, ansVal, expect, part, axis) {
    const f = v => unit === 100 ? num2(v / 100) : num(v);
    const c0 = a1 - d;
    const formula = `a_n=${d === 0 ? f(c0) : lin(Number(f(d)), 'n', Number(f(c0)))}`;
    const pts = [1, 2, 3, 4, 5].map(n => [n, (a1 + (n - 1) * d) / (unit === 100 ? 100 : 1)]);
    return { level, instr: 'Write the function, graph it, then answer part c. Show your steps.', stem, text: md(stem), final: `$${formula}$; ${ansText}`,
      fields: [field('a. Function', `$${formula}$`), field('b. Graph', `Points $(1, ${f(a1)})$, $(2, ${f(a1 + d)})$, $(3, ${f(a1 + 2 * d)})$, … (separate dots — do not join them)`), field('c.', ansText)],
      solution: steps([`<b>a.</b> First term $a_1=${f(a1)}$, common difference $d=${f(d)}$.`, `$a_n=a_1+(n-1)d=${f(a1)}+(n-1)(${f(d)})$, so <b>$${formula}$</b>.`,
        `<b>b.</b> Plot the terms as points:` + GRAPH.sequencePoints(pts, 'n', axis), `<b>c.</b> ${part}`]),
      explanation: 'An arithmetic sequence adds the same amount each time, so its graph is a set of points on a line.',
      verify: [{ k: 'formula', a: `${f(a1)}+(n-1)(${f(d)})`, b: formula.slice(4), vars: ['n'] }, { k: 'num', val: ansVal, expect }] };
  }
  const iter = (a1, d, n) => { let t = a1; for (let i = 1; i < n; i++) t += d; return t; };
  const P = [
    // L1 · theater rows
    r => { const a1 = r.nextInt(12, 30), d = r.nextInt(2, 4), N = r.nextInt(15, 30), last = a1 + (N - 1) * d;
      return seqQ(1, `**Theater.** ${a1} seats in row 1, ${a1 + d} in row 2, ${a1 + 2 * d} in row 3, and so on for ${N} rows. **a.** Write a function. **b.** Graph it. **c.** How many seats are in the last row?`,
        a1, d, 1, '', `${last} seats`, last, iter(a1, d, N), `$a_{${N}}=${d}(${N})${pm(a1 - d)}=${last}$ seats.`, 'seats'); },
    // L1 · downloads
    r => { const p = r.nextInt(99, 299), k = r.nextInt(6, 15); if (p % 100 === 0) return null; const total = p * k;
      return seqQ(1, `**Downloads.** 1 episode costs $${money(p)}$, 2 cost $${money(2 * p)}$, 3 cost $${money(3 * p)}$. **a.** Write a function. **b.** Graph it. **c.** What is the cost of ${k} episodes?`,
        p, p, 100, '', `$${money(total)}$`, total, iter(p, p, k), `$a_{${k}}=${num2(p / 100)}(${k})=${money(total)}$`, 'cost in dollars'); },
    // L2 · water cooler
    r => { const s = r.nextInt(4, 8), C = s * r.nextInt(16, 40), k = r.nextInt(5, Math.floor(C / s) - 2), left = C - s * k;
      return seqQ(2, `**Water.** Each cup holds ${s} oz. Wanda starts with a ${C}-oz cooler. **a.** Write a function. **b.** Graph it. **c.** How much water is left after the ${k}th cup?`,
        C - s, -s, 1, '', `${left} oz`, left, iter(C - s, -s, k), `$a_{${k}}=${C}-${s}(${k})=${left}$ oz.`, 'oz left'); },
    // L2 · savings
    r => { const a1 = r.nextInt(20, 80), d = r.nextInt(5, 25), k = r.nextInt(8, 20), t = a1 + (k - 1) * d;
      return seqQ(2, `**Savings.** Omar has $${money(a1 * 100)}$ in week 1 and adds $${money(d * 100)}$ every week: $${money(a1 * 100)}$, $${money((a1 + d) * 100)}$, $${money((a1 + 2 * d) * 100)}$, … **a.** Write a function. **b.** Graph it. **c.** How much does he have in week ${k}?`,
        a1, d, 1, '', `$${money(t * 100)}$`, t, iter(a1, d, k), `$a_{${k}}=${d}(${k})${pm(a1 - d)}=${t}$ → $${money(t * 100)}$`, 'savings in dollars'); },
    // L3 · postage (find n from a cost)
    r => { const p = r.nextInt(55, 95), e = r.nextInt(12, 25), n = r.nextInt(5, 12), cost = p + (n - 1) * e;
      let found = 1; while (iter(p, e, found) < cost) found++;
      return seqQ(3, `**Postage.** $${money(p)}$ for the first ounce, $${money(e)}$ for each extra ounce: $${money(p)}$, $${money(p + e)}$, $${money(p + 2 * e)}$, … **a.** Write a function. **b.** Graph it. **c.** How much did an envelope weigh that cost $${money(cost)}$?`,
        p, e, 100, '', `${n} oz`, n, found, `$${num2(cost / 100)}=${num2(e / 100)}n${pm(Number(num2((p - e) / 100)))}$ → $${num2((cost - p + e) / 100)}=${num2(e / 100)}n$ → $n=${n}$ oz.`, 'cost in dollars'); }
  ];
  buildFRQ(24, {
    instr: 'Write the function, graph it, then answer part c. Show your steps.',
    tips: ['Find the first term $a_1$ and the common difference $d$, then use $a_n=a_1+(n-1)d$.',
      'Simplify to $a_n=dn+(a_1-d)$. The graph is separate points, because $n$ is a whole number.'],
    patterns: P
  });
})();

// ═══════════════════════════════════════════════════════════
// Q25 · L 5-2 · Parallel and perpendicular lines (pp.301–302, Examples 8–9)
// ═══════════════════════════════════════════════════════════
(function() {
  function throughQ(level, x1, y1, given, m, kind, lines) {
    const b = rSub(rI(y1), rMul(m, rI(x1))), ans = lineY(m, b);
    const stem = `Write an equation of the line through $(${x1},${y1})$ that is <b>${kind}</b> to $${given}$.`;
    return { level, instr: 'Show every step. Write the final equation in slope-intercept form.', stem, text: stem, final: `$${ans}$`,
      fields: [field('Slope', `$m=${rs(m)}$`), field('Equation', `$${ans}$`)],
      solution: steps([...lines, `Substitute $(${x1},${y1})$ into $y=${rs(m)}x+b$: $${y1}=${rs(m)}(${x1})+b$ → $b=${rs(b)}$.`, `<b>$${ans}$</b>`]),
      explanation: kind === 'parallel' ? 'Parallel lines have the same slope.' : 'Perpendicular lines have slopes that are opposite reciprocals (their product is $-1$).',
      verify: [kind === 'parallel' ? { k: 'line', through: [[x1, y1]], parallelTo: given, val: ans } : { k: 'line', through: [[x1, y1]], perpTo: given, val: ans }] };
  }
  function classify(r, level) {
    const p = r.nz(-5, 5), q = r.nextInt(1, 5); if (gcd(p, q) !== 1 || Math.abs(p) === q) return null;
    const m1 = rat(p, q), rel = r.pick(['parallel', 'perpendicular', 'neither']);
    const m2 = rel === 'parallel' ? m1 : rel === 'perpendicular' ? rat(-q, p) : rat(q, p);
    const t1 = r.pick([1, 2]), t2 = r.pick([1, 2]);
    const A = [r.nextInt(-6, 6), r.nextInt(-6, 6)], B = [A[0] + q * t1, A[1] + p * t1];
    const E = [r.nextInt(-6, 6), r.nextInt(-6, 6)], F = [E[0] + m2.d * t2 * (r.sign()), 0]; F[1] = E[1] + m2.n * (F[0] - E[0]) / m2.d;
    const [L1, L2] = [r.pick(['A', 'C', 'J']), r.pick(['E', 'M', 'P'])];
    const N1 = [L1, String.fromCharCode(L1.charCodeAt(0) + 1)], N2 = [L2, String.fromCharCode(L2.charCodeAt(0) + 1)];
    const e1 = pointSlope(m1, A[0], A[1]), e2 = pointSlope(m2, E[0], E[1]);
    const stem = `Are $\\overleftrightarrow{${N1.join('')}}$ and $\\overleftrightarrow{${N2.join('')}}$ parallel, perpendicular, or neither? $${N1[0]}(${A})$, $${N1[1]}(${B})$, $${N2[0]}(${E})$, $${N2[1]}(${F})$.`;
    return { level, instr: 'Find both slopes, then decide. Show your steps.', stem, text: stem, final: `${rel} ($${rs(m1)}$ and $${rs(m2)}$)`,
      fields: [field(`Slope of $\\overleftrightarrow{${N1.join('')}}$`, `$${rs(m1)}$`), field(`Slope of $\\overleftrightarrow{${N2.join('')}}$`, `$${rs(m2)}$`), field('Relationship', rel)],
      solution: steps([`$m_1=\\dfrac{${B[1]}-(${A[1]})}{${B[0]}-(${A[0]})}=${rs(m1)}$`, `$m_2=\\dfrac{${F[1]}-(${E[1]})}{${F[0]}-(${E[0]})}=${rs(m2)}$`,
        rel === 'parallel' ? 'The slopes are equal: <b>parallel</b>.' : rel === 'perpendicular' ? `$${rs(m1)}\\times${rs(m2)}=-1$: <b>perpendicular</b>.` : `The slopes are not equal and $${rs(m1)}\\times${rs(m2)}=${rs(rMul(m1, m2))}\\ne-1$: <b>neither</b>.`]),
      explanation: 'Equal slopes → parallel. Product of slopes $=-1$ → perpendicular. Otherwise → neither.',
      verify: [{ k: 'rel', e1, e2, val: rel }] };
  }
  const P = [
    // L1 · parallel to y = (p/q) x + b0
    r => { const q = r.nextInt(1, 4), p = r.nz(-5, 5); if (gcd(p, q) !== 1) return null; const m = rat(p, q), b0 = r.nz(-9, 9), x1 = q * r.nz(-3, 3), y1 = r.nz(-9, 9);
      if (y1 === m.v * x1 + b0) return null; const given = lineY(m, rI(b0));
      return throughQ(1, x1, y1, given, m, 'parallel', [`The given line has slope $${rs(m)}$, so the parallel line also has $m=${rs(m)}$.`]); },
    // L2 · perpendicular to a x + b y = c
    r => { const a = r.nz(-6, 6), b = r.nextInt(1, 6), c = r.nz(-15, 15), x1 = r.nz(-6, 6), y1 = r.nz(-6, 6); if (gcd(a, b) !== 1) return null;
      const given = stdForm(a, b, c), m = rat(b, a);
      return throughQ(2, x1, y1, given, m, 'perpendicular', [`Rewrite: $${lineY(rat(-a, b), rat(c, b))}$, so the given slope is $${rs(rat(-a, b))}$.`, `The perpendicular slope is the opposite reciprocal: $m=${rs(m)}$.`]); },
    r => classify(r, 2),
    r => classify(r, 2),
    // L3 · perpendicular to y = m x + b
    r => { const m0 = r.nz(-6, 6), b0 = r.nz(-9, 9), x1 = m0 * r.nz(-2, 2), y1 = r.nz(-8, 8); if (Math.abs(m0) === 1 && r.next() < 0.5) return null;
      const given = lineY(rI(m0), rI(b0)), m = rat(-1, m0);
      return throughQ(3, x1, y1, given, m, 'perpendicular', [`The given slope is $${m0}$, so the perpendicular slope is $m=${rs(m)}$.`]); }
  ];
  buildFRQ(25, {
    instr: 'Show every step. Write the final equation in slope-intercept form.',
    tips: ['Parallel lines: same slope. Perpendicular lines: opposite reciprocal slopes (product $-1$).',
      'Find the slope you need, then substitute the point into $y=mx+b$ to find $b$.'],
    patterns: P
  });
})();
