# Grade 9 Advanced Mathematics · End-of-Term 1 Practice Web App
**Reveal Integrated 1 · UAE Ministry of Education · Academic Year 2026–2027**
**Zayed Educational Complex – Suhaila | Mr. Mohamad Turkmani**

A responsive practice site that follows the End of Term 1 coverage sheet: one practice set per exam question (Q1–Q25).

---

## Key features

1. **A 30-question bank for every multiple-choice question (Q1–Q20)**
   - Each set has a fixed bank of **30 exam-style questions** (600 in total).
   - Every time a student opens a set they get **5 questions drawn at random**, each from a different question pattern, ordered easy → hard.
   - "Try 5 new questions" draws another five.
   - Every bank question follows a pattern from the teacher's Question Booklet: same structure and same kind of distractors, different numbers.
2. **Written-answer sets (Q21–Q25)**: each has a fixed bank of **10 questions** and every visit draws **2 at random**, with a hidden model solution and self-marking. Q21 has two tiles, one per part: Part 1 (Lesson 2-4) is listed under Module 2 and Part 2 (Lesson 6-3) under Module 6.
3. **Feedback and hints**: instant marking, a "why this is wrong" note on every distractor, three hints (the third is a worked example with different numbers) and a full explanation.
4. **Tools**: scientific calculator, number line and coordinate grid.
5. **Lesson mastery and certificates**: score at least 80% across a lesson's sets to earn a printable certificate.
6. **Teacher portal** with student activity (local storage + Firebase sync).

The sizes are in `js/config.js`: `MCQ_SET_SIZE` (5), `MCQ_BANK_SIZE` (30), `FRQ_SET_SIZE` (2) and `FRQ_BANK_SIZE` (10). A set is marked when the student reaches the last question and presses Finish; there is no early submit.
`SHOW_OUTCOME_NAMES` switches the topic names on the tiles on or off.

---

## Question blueprint

### Multiple choice (Q1–Q20)
| Q | Lesson | Learning outcome | Reveal |
| :---: | :---: | :--- | :--- |
| Q1 | 2-1 | Translate sentences into equations | p. 71 · Ex. 1–4 |
| Q2 | 2-3 | Solve equations with more than one operation | p. 88 · Ex. 1–12 |
| Q3 | 2-4 | Solve equations with the variable on each side | p. 97 · Ex. 1–6 |
| Q4 | 2-5 | Solve absolute value equations | p. 106 · Ex. 19–23 |
| Q5 | 2-6 | Solve proportions | p. 113 · Ex. 19–26 |
| Q6 | 4-2 | Find the slope of a line | p. 227 · Ex. 50–52 |
| Q7 | 4-3 | Graph and interpret linear functions | p. 236 · Ex. 37–39 |
| Q8 | 4-4 | Apply dilations to linear functions | p. 248 · Ex. 10–15 |
| Q9 | 4-5 | Construct arithmetic sequences | p. 255 · Ex. 1–8 |
| Q10 | 4-6 | Identify and graph piecewise functions | p. 259 · Example 1 |
| Q11 | 4-6 | Identify and graph step functions | p. 261 · Example 2 |
| Q12 | 4-7 | Translate absolute value functions | p. 267 · Example 1 |
| Q13 | 4-7 | Graph absolute value functions | pp. 269, 277 · Ex. 7–12 |
| Q14 | 5-1 | Write y = mx + b from the slope and one point | p. 293 · Ex. 33–42 |
| Q15 | 5-2 | Write point-slope form from two points | pp. 297, 303 · Ex. 4–7 |
| Q16 | 5-2 | Parallel or perpendicular line through a point | pp. 300–304 · Ex. 25–30 |
| Q17 | 5-6 | Construct the inverses of relations | p. 331 · Ex. 4–9 |
| Q18 | 6-1 | Graph the solutions of an inequality | p. 347 · Ex. 7–12 |
| Q19 | 6-2 | Solve inequalities with more than one operation | pp. 352, 354 · Ex. 16–21 |
| Q20 | 6-4 | Solve and graph absolute value inequalities | p. 371 · Ex. 1–10 |

### Written answer (Q21–Q25)
| Q | Lesson | Learning outcome | Reveal |
| :---: | :---: | :--- | :--- |
| Q21 · Part 1 | 2-4 | Solve equations using the Distributive Property | p. 97 · Ex. 7–16 |
| Q21 · Part 2 | 6-3 | Solve and graph compound inequalities with *and* | p. 363 |
| Q22 | 2-7 | Solve equations for a specific variable | pp. 120, 126 |
| Q23 | 4-1 | Graph lines using the x- and y-intercepts | p. 216 · Ex. 9–14 |
| Q24 | 4-5 | Apply the arithmetic sequence formula | p. 256 · Ex. 23–26 |
| Q25 | 5-2 | Create and identify parallel or perpendicular lines | pp. 301–306 |

### How the questions are checked
Every bank question is recomputed by an independent answer checker (`js/verify.js`) before it is used: exactly one option must be correct and no distractor may be equivalent to it. A question that fails is thrown away and regenerated.

---

## Project structure

```
├── index.html
├── serve.ps1                 # local preview server for Windows (no Python or Node needed)
├── css/style.css             # colours (variables at the top), layout, certificate
├── js/
│   ├── config.js             # school, teacher, set sizes, tile blueprint, lesson groups
│   ├── graphs.js             # SVG drawings: lines, V graphs, steps, piecewise, number lines
│   ├── verify.js             # independent answer checker
│   ├── bookletSignatures.js  # numbers used in the booklet (never reused)
│   ├── questionBank.js       # runner + sets Q1–Q6, Q8, Q11–Q25
│   ├── questionBankExtra.js  # sets Q7, Q9, Q10
│   ├── calculator.js, certificate.js, app.js
└── assets/                   # logos and banner
```

## Running locally
Double-click `index.html`, or start the preview server:

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open `http://localhost:8123`.

## Hosting (GitHub Pages)
Push the folder to a GitHub repository, then **Settings → Pages → Deploy from a branch → main / (root)**.
