// ── Question Bank, part 2 ── sets added for the 2026–2027 coverage ──
// Q7 (L 4-3), Q9 (L 4-5) and Q10 (L 4-6). Loaded after questionBank.js and
// uses its helpers (rat, lin, lineY, buildMCQ, …) and its runner.

// ═══════════════════════════════════════════════════════════
// Q7 · L 4-3 · Graph and interpret linear functions (p.236, Ex. 37–39)
// ═══════════════════════════════════════════════════════════
(function() {
  const R = rat;
  const L = (m, b, why) => EQ(lineY(m, b), why);
  const BOOK = [[2, -3], [-3, 2], [-1, -1], [3, 1], [2, 1]];           // booklet (slope, intercept) pairs
  const inBook = (m, b) => BOOK.some(([bm, bb]) => bm === m && bb === b);

  // Graph → equation. The graph shows the y-intercept and one more point.
  function graphEq(r, level, slopes) {
    const m = r.pick(slopes), b = r.nz(-4, 4), t = (m.d === 1 && Math.abs(m.n) === 1) ? 2 : 1;
    const x2 = m.d * t, y2 = b + m.n * t;
    if (Math.abs(y2) > 4 || x2 > 4 || inBook(m.v, b)) return null;
    const pts = [[0, b], [x2, y2]];
    return { level, stem: 'Which equation matches the graph?', text: 'Which equation matches the graph?' + GRAPH.lineThroughPoints(pts),
      sig: `${lineY(m, rI(b))} ${x2} ${y2}`, correct: `$${lineY(m, rI(b))}$`, cv: lineY(m, rI(b)),
      wrongs: [m.d === 1 ? L(rI(b), rI(m.n), 'Swapped the slope and the $y$-intercept.') : null,
        L(m, rI(-b), `The line crosses the $y$-axis at $${b}$, so $b=${b}$.`),
        L(rat(-m.n, m.d), rI(b), `The line ${m.n > 0 ? 'rises' : 'falls'} from left to right, so the slope is ${m.n > 0 ? 'positive' : 'negative'}.`),
        L(rat(m.d, m.n), rI(b), 'Used run over rise. Slope is rise over run.'),
        L(rat(-m.n, m.d), rI(-b), 'Both the slope and the $y$-intercept have the wrong sign.')],
      steps: [`The line crosses the $y$-axis at $(0, ${b})$, so $b=${b}$.`,
        `From $(0, ${b})$ to $(${x2}, ${y2})$: rise $${y2 - b}$, run $${x2}$, so $m=${rs(m)}$.`, `$${lineY(m, rI(b))}$`],
      verify: { k: 'line', through: pts } };
  }

  // Equation → graph (four small graphs)
  function whichGraph(r, level, sign) {
    const m = sign * r.nextInt(1, 3), b = r.nz(-2, 2);
    if (m === b || inBook(m, b) || Math.abs(m + b) > 4 || Math.abs(b - m) > 4) return null;
    const G = (pts, why) => [GRAPH.lineThroughPoints(pts, -5, 5, true), why, pts];
    const eq = lineY(rI(m), rI(b)), c = G([[0, b], [1, b + m]]);
    const stem = `Which graph shows $${eq}$?`;
    return { level, stem, sig: stem, correct: c[0], cv: c[2],
      wrongs: [G([[0, m], [1, m + b]], `This line has $y$-intercept $${m}$ and slope $${b}$: the two numbers are swapped.`),
        G([[0, b], [1, b - m]], `This line ${m > 0 ? 'falls' : 'rises'}, but a slope of $${m}$ means it ${m > 0 ? 'rises' : 'falls'} from left to right.`),
        G([[0, -b], [1, m - b]], `This line crosses the $y$-axis at $${-b}$, not at $${b}$.`)],
      steps: [`$b=${b}$: the line crosses the $y$-axis at $(0, ${b})$.`,
        `$m=${m}$: from there, go right 1 and ${m > 0 ? 'up' : 'down'} ${Math.abs(m)} to reach $(1, ${b + m})$.`],
      verify: { k: 'graphline', eq } };
  }

  // Real-world situations: y = (rate)x + (fixed fee)
  const CTX = [
    { name: 'Streaming', y: 'c', x: 'p', what: 'premium channels', rate: 'cost per premium channel', fee: 'basic monthly fee', count: 'number of premium channels',
      a: r => r.nextInt(4, 12), b: r => r.nextInt(9, 25), k: r => r.nextInt(2, 6), ask: k => `What is the monthly cost with ${k} premium channels?` },
    { name: 'Car care', y: 'y', x: 'x', what: 'gallons of gas', rate: 'price per gallon of gas', fee: 'price of the car wash', count: 'number of gallons',
      a: r => r.nextInt(215, 395) / 100, b: r => r.nextInt(4, 9), k: r => r.nextInt(5, 12), ask: k => `Find the cost of a car wash and ${k} gallons of gas.` },
    { name: 'Taxi', y: 'c', x: 'm', what: 'miles travelled', rate: 'cost per mile', fee: 'starting fee', count: 'number of miles',
      a: r => r.nextInt(2, 5), b: r => r.nextInt(6, 12), k: r => r.nextInt(4, 15), ask: k => `What is the cost of a ${k}-mile ride?` },
    { name: 'Gym', y: 'c', x: 'm', what: 'months', rate: 'monthly fee', fee: 'joining fee', count: 'number of months',
      a: r => r.nextInt(15, 40), b: r => r.nextInt(45, 90), k: r => r.nextInt(3, 12), ask: k => `What is the total cost for ${k} months?` },
    { name: 'Bike rental', y: 'c', x: 'h', what: 'hours', rate: 'cost per hour', fee: 'fixed rental fee', count: 'number of hours',
      a: r => r.nextInt(3, 9), b: r => r.nextInt(10, 20), k: r => r.nextInt(2, 8), ask: k => `What is the cost of renting a bike for ${k} hours?` }
  ];
  function situation(r) {
    const c = r.pick(CTX), a = c.a(r), b = c.b(r);
    if (a === b || (a === 8 && b === 13)) return null;
    return { c, a, b, eq: `${c.y}=${num(a)}${c.x}+${b}`, intro: `<b>${c.name}:</b> $${c.y}=${num(a)}${c.x}+${b}$, where $${c.x}$ = ${c.what}.` };
  }
  function meaning(r, level, which) {
    const s = situation(r); if (!s) return null;
    const { c, a, b } = s, n = which === 'fee' ? b : num(a), ans = c[which], F = (t, why) => [t, why, t];
    return { level, stem: `${s.intro} What does $${n}$ represent?`, correct: ans, cv: ans,
      wrongs: [which === 'fee' ? F(c.rate, `The rate is the number multiplied by $${c.x}$, which is $${num(a)}$.`) : F(c.fee, `The fixed amount is the number added on, which is $${b}$.`),
        F(c.count, `The ${c.count} is the variable $${c.x}$.`), F('total cost', `The total cost is the variable $${c.y}$.`)],
      steps: which === 'fee'
        ? [`In $y=mx+b$, $b$ is the $y$-intercept: the value when $${c.x}=0$.`, `$${b}$ is added no matter what $${c.x}$ is, so it is the ${c.fee}.`]
        : [`In $y=mx+b$, $m$ is the slope: the rate of change.`, `Each extra one of the ${c.what} adds $${num(a)}$, so it is the ${c.rate}.`],
      verify: { k: 'fact', answer: ans } };
  }
  function evaluate(r, level) {
    const s = situation(r); if (!s) return null;
    const { c, a, b } = s, k = c.k(r), total = a * k + b;
    const M = v => Number.isInteger(Math.round(v * 100) / 100) ? String(Math.round(v)) : v.toFixed(2);
    const O = (v, why) => [`$\\$${M(v)}$`, why, Math.round(v * 100) / 100];
    return { level, stem: `${s.intro} ${c.ask(k)}`, correct: `$\\$${M(total)}$`, cv: Math.round(total * 100) / 100,
      wrongs: [O(a * k, `Forgot to add the ${c.fee} of $\\$${b}$.`), O((a + b) * k, 'Added before multiplying. Multiply first, then add.'),
        O(b * k + a, `Multiplied the wrong number: $${c.x}$ is multiplied by $${num(a)}$.`), O(a + b + k, 'Added all the numbers instead of substituting.')],
      steps: [`Substitute $${c.x}=${k}$: $${c.y}=${num(a)}(${k})+${b}$.`, `$${c.y}=${M(a * k)}+${b}=${M(total)}$, so the cost is $\\$${M(total)}$.`],
      verify: { k: 'fn', f: `${num(a)}x+${b}`, at: k } };
  }

  buildMCQ(7, {
    instr: 'Use the graph or the situation to choose the correct answer.',
    tips: ['In $y=mx+b$, $b$ is where the line crosses the $y$-axis and $m$ is the slope (rise over run).',
      'In a real situation, $b$ is the starting or fixed amount and $m$ is the rate: the amount added for each extra unit.'],
    patterns: [
      r => graphEq(r, 1, [rI(2), rI(3), rI(1)]), r => whichGraph(r, 1, 1), r => meaning(r, 1, 'fee'), r => meaning(r, 1, 'rate'),
      r => graphEq(r, 2, [rI(-2), rI(-3), rI(-1)]), r => whichGraph(r, 2, -1), r => evaluate(r, 2), r => graphEq(r, 2, [rI(4), rI(-4), rI(3)]),
      r => graphEq(r, 3, [R(1, 2), R(1, 3), R(3, 2), R(2, 3)]), r => evaluate(r, 2), r => graphEq(r, 3, [R(-1, 2), R(-2, 3), R(-3, 2), R(-1, 3)])
    ]
  });
})();

// ═══════════════════════════════════════════════════════════
// Q9 · L 4-5 · Construct arithmetic sequences (p.255, Ex. 1–8)
// ═══════════════════════════════════════════════════════════
(function() {
  const BOOK = ['-3,4', '15,-2', '7,3', '3,4', '22,-2.5', '-3,-5', '-2,5', '-12.3,2.6'];     // booklet (first term, d)
  const D = (x, kind) => kind === 'frac' ? ts(x) : num(x.v);
  const list = (terms, kind) => terms.map(x => D(x, kind)).join(',\\ ') + ',\\ \\ldots';
  const vals = terms => terms.map(x => x.v);
  // first four terms; kind: 'int' | 'dec' | 'frac'; sign: +1, −1 or 0 (either)
  function seq(r, kind, sign, minD) {
    const q = kind === 'dec' ? 10 : kind === 'frac' ? r.pick([2, 3, 4]) : 1;
    const s = sign || r.sign();
    const dn = s * (kind === 'dec' ? r.nextInt(11, 45) : kind === 'frac' ? r.pick([1, 3, 5].filter(x => gcd(x, q) === 1)) : r.nextInt(minD || 2, 9));
    const an = kind === 'dec' ? r.nextInt(-150, 250) : kind === 'frac' ? r.pick([1, 3, 5, 7].filter(x => gcd(x, q) === 1)) * r.sign() : r.nextInt(-15, 25);
    if (kind === 'dec' && (dn % 10 === 0 || an % 10 === 0)) return null;
    const a1 = rat(an, q), d = rat(dn, q);
    if (BOOK.includes(`${a1.v},${d.v}`)) return null;
    return { a1, d, q, kind, terms: [0, 1, 2, 3].map(i => rAdd(a1, rMul(d, rI(i)))) };
  }

  function isArith(r, level, kind, sign, yes) {
    const s = seq(r, kind, sign); if (!s) return null;
    const { d, q } = s, terms = s.terms.slice();
    if (!yes) { const i = r.pick([2, 3]); terms[i] = rAdd(terms[i], rat(r.pick([-2, -1, 1, 2]), q)); }
    const diffs = [1, 2, 3].map(i => rSub(terms[i], terms[i - 1]));
    const Y = (dd, why) => [`Yes, $d=${D(dd, kind)}$`, why, { yes: true, d: dd.v }];
    const NO = why => ['No, the difference is not constant', why, { yes: false }];
    const show = diffs.map((df, i) => `$${D(terms[i + 1], kind)}-${terms[i].v < 0 ? `(${D(terms[i], kind)})` : D(terms[i], kind)}=${D(df, kind)}$`).join(', ');
    const c = yes ? Y(d) : NO();
    return { level, stem: `Is the sequence $${list(terms, kind)}$ arithmetic?`, correct: c[0], cv: c[2],
      wrongs: yes
        ? [Y(rat(-d.n, d.d), 'Subtract in order: each term minus the term before it.'), NO(`Every difference is $${D(d, kind)}$, so it is constant.`), Y(rMul(d, rI(2)), 'That is the difference between terms that are two apart.')]
        : [Y(diffs[0], `Only the first difference is $${D(diffs[0], kind)}$. Check every pair of terms.`), Y(rat(-diffs[0].n, diffs[0].d), 'The differences are not all the same, so the sequence is not arithmetic.'), Y(diffs[2], `Only the last difference is $${D(diffs[2], kind)}$. Check every pair of terms.`)],
      steps: [`Subtract each term from the next one: ${show}.`, yes ? `The difference is always $${D(d, kind)}$, so the sequence is arithmetic with $d=${D(d, kind)}$.` : 'The differences are not all equal, so the sequence is not arithmetic.'],
      verify: { k: 'arith', terms: vals(terms) } };
  }

  function nextThree(r, level, kind, sign) {
    const s = seq(r, kind, sign, 3); if (!s) return null;
    const { d, q, terms } = s, a4 = terms[3], u = rat(Math.sign(d.n), q);
    const run = (step, grow) => [1, 2, 3].map(k => rAdd(rAdd(a4, rMul(step, rI(k))), rMul(grow || rI(0), rI(k - 1))));
    const O = (arr, why) => [`$${arr.map(x => D(x, kind)).join(',\\ ')}$`, why, vals(arr)];
    const c = O(run(d));
    return { level, stem: `What are the next three terms of $${list(terms, kind)}$?`, correct: c[0], cv: c[2],
      wrongs: [O(run(rSub(d, u)), `The common difference is $${D(d, kind)}$, not $${D(rSub(d, u), kind)}$.`),
        O(run(d, u), 'The difference must stay the same every time.'),
        O(run(u), `Added $${D(u, kind)}$ each time instead of the common difference $${D(d, kind)}$.`),
        O(run(rat(-d.n, d.d)), 'Went in the wrong direction: check the sign of the common difference.')],
      steps: [`Common difference: $${D(terms[1], kind)}-${terms[0].v < 0 ? `(${D(terms[0], kind)})` : D(terms[0], kind)}=${D(d, kind)}$.`,
        `Keep adding $${D(d, kind)}$: $${c[2].map(num).join(',\\ ')}$.`],
      verify: { k: 'seqnext', terms: vals(terms) } };
  }

  function commonDiff(r, level, kind, sign) {
    const s = seq(r, kind, sign); if (!s) return null;
    const { d, q, terms } = s, N = (x, why) => [`$${D(x, kind)}$`, why, x.v];
    return { level, stem: `What is the common difference of $${list(terms, kind)}$?`, correct: `$${D(d, kind)}$`, cv: d.v,
      wrongs: [N(rat(-d.n, d.d), `Subtract in order: second term minus first term. The terms are ${d.n > 0 ? 'increasing' : 'decreasing'}.`),
        N(rMul(d, rI(2)), 'That is the difference between terms that are two apart.'),
        N(rAdd(d, rat(Math.sign(d.n) * (kind === 'dec' ? 10 : 1), q)), 'Subtraction error: check with two neighbouring terms.'),
        N(terms[0], 'That is the first term, not the common difference.')],
      steps: [`$d=a_2-a_1=${D(terms[1], kind)}-${terms[0].v < 0 ? `(${D(terms[0], kind)})` : D(terms[0], kind)}=${D(d, kind)}$`, `Check: $${D(terms[2], kind)}-${terms[1].v < 0 ? `(${D(terms[1], kind)})` : D(terms[1], kind)}=${D(d, kind)}$.`],
      verify: { k: 'seqd', terms: vals(terms) } };
  }

  function equation(r, level, sign) {
    const s = seq(r, 'int', sign); if (!s) return null;
    const a1 = s.a1.n, d = s.d.n, c = a1 - d; if (c === 0 || a1 === d || a1 === 0) return null;
    const F = (dd, cc, why) => [`$a_n=${lin(dd, 'n', cc)}$`, why, lin(dd, 'n', cc)];
    return { level, stem: `Which equation gives the $n$th term of $${list(s.terms, 'int')}$?`, correct: `$a_n=${lin(d, 'n', c)}$`, cv: lin(d, 'n', c),
      wrongs: [F(d, a1, `Used $a_1$ as the constant. $a_1+(n-1)d$ simplifies to $dn+(a_1-d)$.`),
        F(-d, a1 + d, `The terms ${d > 0 ? 'increase' : 'decrease'} by ${Math.abs(d)}, so the coefficient of $n$ is $${d}$.`),
        F(a1, d, 'Swapped the first term and the common difference.'),
        F(d, a1 + d, 'Sign error when simplifying $a_1-d$.')],
      steps: [`$a_1=${a1}$ and $d=${d}$.`, `$a_n=a_1+(n-1)d=${a1}+(n-1)(${d})$`, `$a_n=${lin(d, 'n', c)}$. Check: $n=1$ gives $${a1}$.`],
      verify: { k: 'seqeq', terms: vals(s.terms) } };
  }

  function nthTerm(r, level, sign) {
    const s = seq(r, 'int', sign); if (!s) return null;
    const a1 = s.a1.n, d = s.d.n, n = r.nextInt(6, 20), ans = a1 + (n - 1) * d;
    const N = (x, why) => [`$${x}$`, why, x];
    return { level, stem: `What is the ${n}th term of $${list(s.terms, 'int')}$?`, correct: `$${ans}$`, cv: ans,
      wrongs: [N(a1 + n * d, `Used $n$ instead of $n-1$: the first term already counts as term 1.`),
        N(a1 + (n - 2) * d, 'Stopped one term too early.'), N(n * d, 'Forgot the first term.'), N(a1 + (n - 1) + d, 'Multiply $(n-1)$ by $d$; do not add them.')],
      steps: [`$a_1=${a1}$, $d=${d}$.`, `$a_{${n}}=a_1+(n-1)d=${a1}+(${n - 1})(${d})=${ans}$`],
      verify: { k: 'seqterm', terms: vals(s.terms), n } };
  }

  buildMCQ(9, {
    instr: 'Decide whether the sequence is arithmetic, or find its terms.',
    tips: ['A sequence is arithmetic when the difference between consecutive terms is always the same. Subtract each term from the next one.',
      'That constant difference is $d$. The $n$th term is $a_n=a_1+(n-1)d$.'],
    patterns: [
      r => isArith(r, 1, 'int', 1, true), r => isArith(r, 1, 'int', 1, false), r => isArith(r, 1, 'int', -1, true), r => nextThree(r, 1, 'int', 1),
      r => isArith(r, 2, 'dec', 1, true), r => isArith(r, 2, 'frac', 1, false), r => isArith(r, 2, 'int', -1, false), r => commonDiff(r, 2, 'dec', -1),
      r => isArith(r, 2, 'frac', 1, true), r => nextThree(r, 2, 'int', -1), r => equation(r, 3, 0), r => nthTerm(r, 3, 0)
    ]
  });
})();

// ═══════════════════════════════════════════════════════════
// Q10 · L 4-6 · Identify and graph piecewise-defined functions (p.259, Example 1)
// ═══════════════════════════════════════════════════════════
(function() {
  const BOOK = ['2,4,-1,3,1', '-1,0,1,1,0'];
  // f = { m1, b1, m2, b2, c, leftClosed }; v1 / v2 are the two values at x = c
  function gen(r, shape) {
    const c = r.nextInt(-2, 2), leftClosed = shape.leftClosed ?? (r.next() < 0.5);
    const m1 = r.pick(shape.m1), m2 = r.pick(shape.m2), v1 = r.nextInt(-3, 5), v2 = r.nextInt(-3, 5);
    if (m1 === m2 || v1 === v2) return null;
    if (shape.peak && !(v1 > v2)) return null;
    if (shape.valley && !(v1 < v2)) return null;
    const f = { m1, b1: v1 - m1 * c, m2, b2: v2 - m2 * c, c, leftClosed };
    if (BOOK.includes([f.m1, f.b1, f.m2, f.b2, f.c].join(','))) return null;
    return { f, v1, v2 };
  }
  const tex = (f, name) => `${name}(x)=\\begin{cases}${lin(f.m1, 'x', f.b1)} & \\text{if } x${f.leftClosed ? '\\le' : '<'}${f.c}\\\\ ${lin(f.m2, 'x', f.b2)} & \\text{if } x${f.leftClosed ? '>' : '\\ge'}${f.c}\\end{cases}`;
  const ANY = [1, 2, 3, -1, -2], UP = [1, 2, 3], DOWN = [-1, -2, -3];
  const N = (x, why) => [`$${x}$`, why, x];
  const par = x => x < 0 ? `(${x})` : `${x}`;

  function evalQ(r, level, where, shape) {
    const g = gen(r, shape || { m1: ANY, m2: ANY }); if (!g) return null;
    const { f } = g, name = r.pick(['f', 'g', 'h']);
    const x = where === 'boundary' ? f.c : where === 'left' ? f.c - r.nextInt(1, 4) : f.c + r.nextInt(1, 4);
    const first = x < f.c || (x === f.c && f.leftClosed);
    const [m, b, mo, bo] = first ? [f.m1, f.b1, f.m2, f.b2] : [f.m2, f.b2, f.m1, f.b1];
    const ans = m * x + b, cond = first ? `x${f.leftClosed ? '\\le' : '<'}${f.c}` : `x${f.leftClosed ? '>' : '\\ge'}${f.c}`;
    return { level, stem: `For $${tex(f, name)}$, find $${name}(${x})$.`, correct: `$${ans}$`, cv: ans,
      wrongs: [N(mo * x + bo, `Used the wrong rule. $x=${x}$ satisfies $${cond}$, so use the ${first ? 'first' : 'second'} rule.`),
        b !== 0 ? N(m * x, `Forgot the constant term $${b}$.`) : null,
        N(-m * x + b, `Sign error when substituting $x=${x}$.`), N(-ans, 'Sign error in the final value.'), N(ans + m, 'Substituted the wrong $x$-value.')],
      steps: [`$x=${x}$ satisfies $${cond}$, so use the ${first ? 'first' : 'second'} rule: $${lin(m, 'x', b)}$.`,
        `$${name}(${x})=${m === 1 ? '' : m === -1 ? '-' : m}${m === 1 ? x : par(x)}${b ? pm(b) : ''}=${ans}$`],
      verify: { k: 'pw', f, at: x } };
  }

  function graphQ(r, level, shape) {
    const g = gen(r, shape); if (!g) return null;
    const { f, v1, v2 } = g, name = r.pick(['f', 'g', 'h']);
    const G = (spec, why) => [GRAPH.piecewise(spec), why, spec];
    const stem = `Which graph shows $${tex(f, name)}$?`, c = G(f);
    return { level, stem, sig: stem, correct: c[0], cv: c[2],
      wrongs: [G({ ...f, leftClosed: !f.leftClosed }, `The dots are reversed. The rule with $${f.leftClosed ? '\\le' : '\\ge'}$ includes $x=${f.c}$, so it gets the closed dot.`),
        G({ ...f, m2: -f.m2, b2: v2 + f.m2 * f.c }, `The right-hand piece has slope $${f.m2}$, so it should ${f.m2 > 0 ? 'rise' : 'fall'}.`),
        G({ ...f, m1: f.m2, b1: f.b2, m2: f.m1, b2: f.b1 }, 'The two rules are drawn on the wrong sides of the boundary.'),
        G({ ...f, m1: -f.m1, b1: v1 + f.m1 * f.c }, `The left-hand piece has slope $${f.m1}$, so it should ${f.m1 > 0 ? 'rise' : 'fall'} from left to right.`)],
      steps: [`Left of $x=${f.c}$: the line $y=${lin(f.m1, 'x', f.b1)}$, ending at $(${f.c}, ${v1})$ with ${f.leftClosed ? 'a closed' : 'an open'} dot.`,
        `Right of $x=${f.c}$: the line $y=${lin(f.m2, 'x', f.b2)}$, starting at $(${f.c}, ${v2})$ with ${f.leftClosed ? 'an open' : 'a closed'} dot.`],
      verify: { k: 'pwgraph', f } };
  }

  function domainQ(r, level) {
    const g = gen(r, { m1: ANY, m2: ANY }); if (!g) return null;
    const { f, v1 } = g, name = r.pick(['f', 'g', 'h']), F = (t, why, v) => [t, why, v];
    return { level, stem: `What is the <b>domain</b> of $${tex(f, name)}$?`, correct: 'all real numbers', cv: 'all real numbers',
      wrongs: [F(`$x${f.leftClosed ? '\\le' : '<'}${f.c}$`, 'That is only the interval of the first rule. Together the two rules cover every $x$.', 'first'),
        F(`$x${f.leftClosed ? '>' : '\\ge'}${f.c}$`, 'That is only the interval of the second rule. Together the two rules cover every $x$.', 'second'),
        F(`$y\\le ${v1}$`, 'That describes outputs ($y$-values). The domain is the set of inputs ($x$-values).', 'y')],
      steps: [`The first rule covers $x${f.leftClosed ? '\\le' : '<'}${f.c}$ and the second covers $x${f.leftClosed ? '>' : '\\ge'}${f.c}$.`, 'Together they cover every $x$: the domain is all real numbers.'],
      verify: { k: 'fact', answer: 'all real numbers' } };
  }

  // peak: rises to a closed dot, then falls from a lower open dot → range y ≤ top
  function rangeQ(r, level, peak) {
    const g = gen(r, peak ? { m1: UP, m2: DOWN, leftClosed: true, peak: true } : { m1: DOWN, m2: UP, leftClosed: true, valley: true }); if (!g) return null;
    const { f, v1, v2 } = g, name = r.pick(['f', 'g', 'h']), s = peak ? '\\le' : '\\ge', o = peak ? '\\ge' : '\\le';
    const F = (t, why, v) => [t, why, v];
    return { level, stem: `What is the <b>range</b> of $${tex(f, name)}$?`, correct: `$y${s}${v1}$`, cv: { t: peak ? 'le' : 'ge', v: v1 },
      wrongs: [F('all real numbers', `The graph never goes ${peak ? 'above' : 'below'} $y=${v1}$.`, { t: 'all' }),
        F(`$y${s}${v2}$`, `$${v2}$ is at the open dot. The ${peak ? 'highest' : 'lowest'} point is the closed dot at $(${f.c}, ${v1})$.`, { t: peak ? 'le' : 'ge', v: v2 }),
        F(`$y${o}${v1}$`, `Both pieces go ${peak ? 'down' : 'up'} from the point $(${f.c}, ${v1})$, not ${peak ? 'up' : 'down'}.`, { t: peak ? 'ge' : 'le', v: v1 })],
      steps: [`The first piece ${peak ? 'rises' : 'falls'} to $(${f.c}, ${v1})$ (closed dot). The second piece starts at $(${f.c}, ${v2})$ (open dot) and ${peak ? 'falls' : 'rises'}.`,
        `The ${peak ? 'greatest' : 'least'} $y$-value is $${v1}$, so the range is $y${s}${v1}$.`],
      verify: { k: 'pwrange', f } };
  }

  buildMCQ(10, {
    instr: 'Use the rule whose interval contains $x$. Closed dot: $\\le$, $\\ge$. Open dot: $<$, $>$.',
    tips: ['To evaluate, first decide which interval contains the $x$-value, then use only that rule.',
      'On the graph, the rule with $\\le$ or $\\ge$ gets the closed dot at the boundary; the rule with $<$ or $>$ gets the open dot.'],
    patterns: [
      r => evalQ(r, 1, 'boundary', { m1: ANY, m2: ANY, leftClosed: true }), r => evalQ(r, 1, 'right'), r => evalQ(r, 1, 'left'),
      r => graphQ(r, 2, { m1: UP, m2: DOWN }), r => domainQ(r, 2), r => evalQ(r, 2, 'boundary', { m1: ANY, m2: ANY, leftClosed: false }),
      r => graphQ(r, 2, { m1: DOWN, m2: UP }), r => evalQ(r, 2, 'left'), r => rangeQ(r, 3, true), r => graphQ(r, 2, { m1: ANY, m2: ANY }),
      r => rangeQ(r, 3, false), r => evalQ(r, 2, 'right')
    ]
  });
})();
