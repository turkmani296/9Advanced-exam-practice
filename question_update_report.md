# Question update report

**Date:** 12 November 2026
**Sources:** `exam_coverage.pdf` and `booklet_questions (3).pdf` (End of Term 1, 2026–2027).
`booklet_explanations (2).pdf` was **not** read for this update.

## What changed

1. **Sets renumbered to the new coverage sheet.**

| Set | Lesson | Before | Now |
|---|---|---|---|
| Q7 | 4-3 | Rewrite in slope-intercept form | **New:** graph ↔ equation, meaning of slope and intercept, evaluate a situation |
| Q9 | 4-5 | Step function graphs | **New:** is it arithmetic, next terms, common difference, nth-term equation, nth term |
| Q10 | 4-6 | Evaluate scaled step functions | **New:** piecewise functions: evaluate, choose the graph, domain, range |
| Q11 | 4-6 | (was Q9) | Step functions: graph, evaluate, domain, range, shift, point not on the graph |
| Q12 | 4-7 | (was Q11) | Translations of absolute value functions |
| Q13 | 4-7 | (was Q12) | Graph → equation of an absolute value function |
| Q14 | 5-1 | (was Q13) | Point on a line, another point on the line, slope and a point |
| Q15 | 5-2 | (was Q14) | Point-slope form from two points |
| Q16 | 5-2 | Classify lines / rewrite equations | **Changed:** line through a point, parallel **or perpendicular** to a given line |
| Q18 | 6-1 | Graphs + solve by subtraction | **Changed:** graph → inequality, inequality → graph, solve then choose the graph |
| Q25 | 5-2 | 5 patterns | **Changed:** Ex. 8, Ex. 9, Ex. 29 (parallel and perpendicular), Ex. 33 (standard-form pair), Ex. 50 (check a claim) |

   Small additions: Q2 (`b − av = c`, `b − v/a = c`, `(av − b)/k = c`), Q4 ("give or take"), Q20 (`|x| > c` and the all-real-numbers case).
   Removed because the booklet no longer has them: the old slope-intercept rewriting set, scaled step functions, classify/standard-form MCQs.

2. **30-question bank, 5 at random.** Each MCQ set builds a fixed bank of 30 questions from its booklet patterns (each pattern is used 2–3 times with different numbers, never the same question twice). Each visit draws 5 from 5 different patterns.

3. **Checked by computing.** All 600 bank questions pass the answer checker: one correct option, no equivalent distractor. Correct letters are spread 8 / 8 / 7 / 7 over A–D in every bank.

## Things to know

- **Saved progress** from before this change is filed under the old question numbers.
- **Booklet numbers.** `bookletSignatures.js` still holds the previous booklet's numbers and is mapped to the new set numbers. The new sets (Q7, Q9, Q10, Q16) avoid the booklet's own numbers with their own short lists.
- **Q23** still uses a −6…6 grid; the new booklet prints −8…8.
- **Q25 Ex. 52** (explain without finding slopes) is not included, because it has no numerical answer to self-mark.
- **Topic names on the tiles** are now switched on (`SHOW_OUTCOME_NAMES` in `js/config.js`).

## Update 2 (12 November 2026)

- **Written-answer sets** now work like the MCQ sets: a fixed bank of 10 questions each, 2 drawn at random per visit.
- **Q21 is split into two tiles.** Part 1 (Distributive Property, Lesson 2-4) is under Module 2. Part 2 (compound inequalities, Lesson 6-3) is under Module 6 and is stored as tile 26. Earlier Q21 attempts are shown under Part 1.
- Four patterns were added so each part has enough variety: `a(bv − c) = d(ev + f)`, `k − a(v + b) = v − d`, two simple inequalities joined by *and*, and a pair where dividing by a negative reverses the sign.
- **Submit early is removed.** A set is marked only when the student finishes it.
- Fixed: the compound-inequality answer was written as `\lev` (no space), which KaTeX could not display.
