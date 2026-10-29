# Grade 9 Advanced Mathematics · End-of-Term 1 Practice Web App
**Reveal Integrated 1 · UAE Ministry of Education**
**Zayed Educational Complex – Suhaila | Mr. Mohamad Turkmani**

A minimalistic, high-performance, responsive web application built for Grade 9 Advanced Mathematics students to prepare for their End-of-Term 1 examination.

---

## 🌟 Key Features

1. **Complete 265-Question Bank (Chronologically Ordered by Lesson)**:
   - **20 MCQ Tiles (Q1–Q20)**: Each tile contains **12 parameterized questions** (240 questions total).
   - **5 FRQ Tiles (Q21–Q25)**: Each tile contains **5 multi-part parameterized questions** (25 questions total).
   - **Lesson-by-Lesson Progression**: Questions are ordered strictly from Chapter 2 to Chapter 6 (Lesson 2-1 through Lesson 6-4).
   - **Dynamic Regeneration**: Clicking *"Retry with new numbers"* generates fresh random parameters following the exact textbook patterns.
   - **Booklet contexts**: Word problems keep the contexts and units of the approved Question Booklet (e.g. °F, lb/oz, \$) with new numbers.
2. **Instant Feedback, Self-Grading & Hints**:
   - Instant visual grading upon selection for MCQ.
   - **FRQ Self-Assessment**: The answer and full model solution start hidden behind an *"👁️ Show Answer & Model Solution"* button. Once revealed, students compare their solution and select either the **Green button** (*"✓ I solved it correctly"*, +1.0 pt) or the **Red button** (*"✗ I got it wrong"*, 0.0 pts) to record their score out of 5 and unlock navigation.
   - 3 progressive hints per question. **Hint 3 shows a fully worked similar example with different numbers** (never reveals the current question's answer).
   - Detailed mathematical explanations rendered with KaTeX.
   - Plausible MCQ distractors with detailed *"Why this is wrong"* notes.
3. **Interactive Mathematics Tools**:
   - Built-in floating **Scientific Calculator** available on every practice screen.
   - Dynamic **Number Line Visualizer** for compound inequalities with open/closed circles and interval shading.
   - Dynamic **Cartesian Coordinate Grid** with $x$- and $y$-intercepts and plotted linear functions.
4. **Lesson Mastery & Printable Certificates**:
   - Questions grouped into curriculum lessons (e.g. Lesson 5-2, Lesson 2-4, Lesson 6-3, etc.).
   - Master a lesson by achieving $> 80\%$ score across its sets.
   - Celebratory confetti and elegant **A4 Landscape Certificate of Mastery** featuring official school wordmarks and mathematics exam branding.
   - Certificate export options: **Download PDF**, **Download PNG**, and **Print**.
5. **Session-Only Student State**:
   - Student enters their name once per session (Arabic and English supported).
   - Progress and scores are stored in `sessionStorage` (no logins, accounts, or backend required).
   - *"Change student"* link resets the session cleanly.

---

## 📐 Question Blueprint (Ordered by Lesson)

### Multiple Choice Questions (MCQ 1–20)
| Tile | Pages | Lesson | Topic & Learning Outcome |
| :---: | :---: | :---: | :--- |
| **Q1** | 71 | L 2-1 | Translate sentences into algebraic equations |
| **Q2** | 88 | L 2-3 | Solve equations involving more than one operation |
| **Q3** | 97 | L 2-4 | Solve equations with variable on each side (incl. identities & no solution) |
| **Q4** | 106 | L 2-5 | Solve absolute value equations |
| **Q5** | 113 | L 2-6 | Solve proportions using cross-multiplication |
| **Q6** | 227 | L 4-2 | Find the slope of a line from two points or tables |
| **Q7** | 235 | L 4-3 | Rewrite linear equations in slope-intercept form ($y = mx + b$) |
| **Q8** | 248 | L 4-4 | Apply dilations (stretches/compressions) to linear functions |
| **Q9** | 261 | L 4-6 | Graph and interpret step functions |
| **Q10** | 265 | L 4-6 | Identify and evaluate step functions (greatest integer $\lfloor x \rfloor$) |
| **Q11** | 267 | L 4-7 | Apply translations to absolute value functions ($g(x) = \|x - h\| + k$) |
| **Q12** | 277 | L 4-7 | Graph absolute value functions (vertex, axis of symmetry, domain/range) |
| **Q13** | 293 | L 5-1 | Slope-intercept form given slope and one point |
| **Q14** | 297, 303 | L 5-2 | Point-slope form given two points ($y - y_1 = m(x - x_1)$) |
| **Q15** | 304 | L 5-2 | Equation of a line through a given point, parallel to a given line |
| **Q16** | 304, 305 | L 5-2 | Create and identify equations of parallel or perpendicular lines |
| **Q17** | 331 | L 5-6 | Construct the inverses of relations and linear functions ($f^{-1}(x)$) |
| **Q18** | 347 | L 6-1 | Solve linear inequalities by using subtraction |
| **Q19** | 354 | L 6-2 | Solve multi-step linear inequalities (with sign reversal) |
| **Q20** | 371 | L 6-4 | Solve and graph absolute value inequalities ($<, \leq$) |

### Free Response Questions (FRQ 21–25)
| Tile | Pages | Lesson | Topic & Learning Outcome |
| :---: | :---: | :---: | :--- |
| **Q21** | 97, 363 | L 2-4, 6-3 | 3 Distributive Property equations + 2 compound "and" inequalities (with number line) |
| **Q22** | 120, 126 | L 2-7 | Solve equations for specific variables (budget formulas, parts a/b/c) |
| **Q23** | 216 | L 4-1 | Graph linear functions using $x$- and $y$-intercepts on coordinate grid |
| **Q24** | 256 | L 4-5 | Apply the arithmetic sequence formula ($a_n = a_1 + (n - 1)d$), parts a/b/c |
| **Q25** | 301, 302 | L 5-2 | Create and identify equations of parallel or perpendicular lines |

### Where the questions come from
The questions follow the teacher's approved Question Booklet (`question_bank.json`). Each booklet question is a
*pattern*: the site keeps its structure and kinds of distractors but always uses **different numbers**
(`js/bookletSignatures.js` lists the booklet's numbers so they are never repeated). Every generated question is
re-checked by an independent answer checker (`js/verify.js`) before it is shown, so exactly one option is correct.

---

## 📁 Project Structure

```
Project Final EOT WEB/
├── index.html               # Main application entry point
├── README.md                # Documentation and deployment guide
├── css/
│   └── style.css            # Responsive styling, color variables, certificate layout
├── js/
│   ├── config.js            # School, teacher, and blueprint configuration
│   ├── graphs.js            # SVG drawings: lines, V graphs, step graphs, number lines
│   ├── verify.js            # Independent answer checker (recomputes every answer)
│   ├── bookletSignatures.js # Numbers used in the booklet (generated; never reused)
│   ├── questionBank.js      # Complete bank of 265 parameterized questions (Q1–Q25)
│   ├── calculator.js        # Built-in scientific calculator module
│   ├── certificate.js       # Certificate generation, PNG/PDF export & confetti
│   └── app.js               # Application router, state manager, interactive tools
└── assets/
    ├── math-logo.jpg        # Mathematics Exam logo (raw)
    ├── math-logo-trimmed.png# Mathematics Exam logo (trimmed border)
    ├── school-logo.png      # Zayed Educational Complex wordmark
    └── banner.jpg           # Official school year slogan banner
```

---

## 🚀 Setup & Local Running

The web app is completely client-side and requires **no build step, no npm packages, and no backend**.

### Option 1: Direct File Opening
Double-click `index.html` in your file explorer to open it directly in any modern web browser.

### Option 2: Local HTTP Server (Recommended)
Using Python:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

Using Node.js:
```bash
npx serve .
```

---

## 🌐 Free Hosting / GitHub Pages Deployment

1. Create a new repository on [GitHub](https://github.com/).
2. Push all files from this folder into the `main` branch.
3. In your repository on GitHub, navigate to **Settings** → **Pages**.
4. Under **Source**, select **Deploy from a branch**, choose `main` and `/ (root)`, then click **Save**.
5. Your practice app will be live globally within seconds at:
   `https://<your-username>.github.io/<repository-name>/`
