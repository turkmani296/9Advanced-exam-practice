# Question update report

**Date:** 29 October 2026
**Source:** `question_bank.json` (teacher's approved Question Booklet)
**Result:** all 25 sets rebuilt: 20 × 12 MCQ and 5 × 5 FRQ (265 questions).

Every question on the site was replaced. The old generators covered some off-outcome items, such as "Why is it called a step function?". Each set now follows only its booklet learning outcome.

## How the new questions work

- **Patterns, not copies.** Each booklet question is turned into a pattern. The pattern keeps the structure, the wording style and the same kind of distractors, but every visit uses new numbers. "Retry with new numbers" still works.
- **Booklet numbers are never reused.** `js/bookletSignatures.js` lists the numbers of all 292 booklet questions. Any generated question with the same numbers as a booklet question is thrown away and regenerated.
- **Every answer is checked by computing it.** `js/verify.js` reads each question's math and solves it on its own: equations, inequalities, slopes, lines, step functions, inverses and dilations. A question is shown only when exactly one option is correct and no distractor is equivalent to it. This includes:
  - the Q8 stretch/compression pair,
  - the same line written with the other point (Q14),
  - ⟦x+h⟧ "shifted left" versus "shifted up" (Q9).
- **Balanced answers.** In every 12-question set, A, B, C and D are each the correct letter exactly 3 times.
- **Easy → hard.** Within each set, questions go from level 1 to level 3.
- **Hints.** Hints 1–2 give the method. Hint 3 is a fully worked example of the same pattern with different numbers.
- **Graphs** are drawn as SVG (`js/graphs.js`):
  - lines through two labelled points (Q6),
  - V graphs (Q12),
  - number-line rays (Q18),
  - step graphs with closed/open dots, including the reversed-dots distractor (Q9).
- **Written-answer graphs.** The answer graphs for Q21, Q23 and Q24 appear in the model solution. Students get a blank number line (Q21) or a blank grid (Q23) to work on.

## Set by set

| Set | Lesson | Replaced | Bank → site | Notes |
|---|---|---|---|---|
| Q1 | 2-1 | 12/12 | 12 → 12 | All bank patterns used |
| Q2 | 2-3 | 12/12 | 18 → 12 | The 12 textbook patterns (Ex. 1–12); new-practice ones not needed |
| Q3 | 2-4 | 12/12 | 18 → 12 | 6 textbook + 6 new practice |
| Q4 | 2-5 | 12/12 | 12 → 12 | All bank patterns (6 word problems + 6 equations) |
| Q5 | 2-6 | 12/12 | 16 → 12 | 8 textbook + 4 new practice |
| Q6 | 4-2 | 12/12 | 16 → 12 | 3 textbook graphs + 4 new graphs + 5 point pairs (incl. zero and undefined slope) |
| Q7 | 4-3 | 12/12 | 14 → 12 | 8 textbook + 4 new practice |
| Q8 | 4-4 | 12/12 | 10 → 12 | **+2 new:** vertical compression with a decimal factor; horizontal compression with a fraction > 1 |
| Q9 | 4-6 | 12/12 | 8 → 12 | **+4 new:** a second translation question (right shift), a third graph-choice question, an evaluation with a negative input, a second "not on the graph" question |
| Q10 | 4-6 | 12/12 | 12 → 12 | All bank patterns |
| Q11 | 4-7 | 12/12 | 10 → 12 | **+2 new:** a second "which function is the translation" (left and up); a second vertex question |
| Q12 | 4-7 | 12/12 | 12 → 12 | All bank patterns (graph → equation) |
| Q13 | 5-1 | 12/12 | 12 → 12 | All bank patterns |
| Q14 | 5-2 | 12/12 | 10 → 12 | **+2 new:** two more two-point → point-slope questions (fraction and negative-fraction slopes) |
| Q15 | 5-2 | 12/12 | 10 → 12 | **+2 new:** a fraction slope; a given line in standard form |
| Q16 | 5-2 | 12/12 | 13 → 12 | Dropped Ex. 35 (a second "neither" pair, same as Ex. 34) |
| Q17 | 5-6 | 12/12 | 8 → 12 | **+4 new:** a second inverse-of-a-point, range of the inverse, two more relations (mixed order; decimals) |
| Q18 | 6-1 | 12/12 | 14 → 12 | 6 textbook graphs + 6 new practice |
| Q19 | 6-2 | 12/12 | 14 → 12 | Dropped Ex. 15 and Ex. 21 (same structure as Ex. 14 and Ex. 16) |
| Q20 | 6-4 | 12/12 | 14 → 12 | 10 textbook + 2 new practice (both "<") |
| Q21 | 2-4, 6-3 | 5/5 | 12 + 8 → 3 + 2 | 3 Distributive Property (Ex. 7, 9, 16) + 2 compound "and" (Ex. 5, 7) with a number line |
| Q22 | 2-7 | 5/5 | 6 → 5 | 3 textbook budget problems (a/b/c) + new practice L1 and L3; dropped the fruit problem (L2) |
| Q23 | 4-1 | 5/5 | 6 → 5 | Ex. 9, 10, 11, 12, 14 (the five equation forms). Coordinate grid + both intercepts |
| Q24 | 4-5 | 5/5 | 6 → 5 | 4 textbook (a/b/c) + savings; dropped the training problem |
| Q25 | 5-2 | 5/5 | 6 → 5 | Parallel (L1), perpendicular to standard form (L2), 2 classify questions (L2), perpendicular to slope-intercept (L3) |

## Things to know

1. **Written-answer sets renumbered to match the booklet.** Q21 = Distributive + compound, Q22 = formulas, Q23 = intercepts, Q24 = sequences, Q25 = parallel/perpendicular. I updated `js/config.js` (tiles and lesson-mastery groups). Saved progress or certificates from before this change are still filed under the old Q21–Q25 numbers, so they now point to different topics.
2. **Units follow the booklet** (°F, lb/oz, \$), not the metric/AED style the old site used. I updated the README to match.
3. **Q23 has no level-3 questions**, because the booklet has none. Intercepts stay within −6…6 so they fit the site's grid. The booklet's Ex. 14 had a y-intercept of 8.
4. **Q25 classify questions** pick parallel, perpendicular or neither at random, so the answer is not always "neither".
5. **Q10:** the booklet uses one function for Ex. 18a–d. The site uses a fresh function for each question.
6. **Q21 order** is Distributive (L1), Distributive (L2), compound (L2), compound (L2), Distributive (L3), to keep easy → hard.

## Files changed

- `js/questionBank.js`: rewritten (all 25 sets).
- `js/graphs.js`, `js/verify.js`, `js/bookletSignatures.js`: new.
- `js/config.js`: Q21–Q25 tile labels and lesson groups.
- `index.html`: loads the three new scripts. No layout or styling changes; `app.js` and `style.css` are unchanged.
- `README.md`: blueprint table and file list.
- `.claude/launch.json`: local preview configuration used for testing. It can be deleted.

Correction (1 November 2026): the backups of the original files were kept in a temporary folder that has since been cleared, so they no longer exist.
