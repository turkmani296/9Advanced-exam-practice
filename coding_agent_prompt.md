# Task: replace the website's practice questions using the question bank

## Context
The website is an exam-practice site for the **Grade 9 Advanced Mathematics End of Term 1 exam**
(Reveal Math, Integrated I, 2026–2027). It has one practice set per exam question:

- **Q1–Q20 are multiple choice (MCQ).** Each set has **12 questions**, each with 4 options (A–D) and one correct answer.
- **Q21–Q25 are written answer (FRQ).** Each set has **5 questions**, each with a model final answer.

Some of the website's current questions are unrelated to the exam outcome or not important.
**Replace the questions in every set** so they match the attached question bank.

## Attached file: `question_bank.json`
It was extracted from the teacher's approved Question Booklet. Structure:

```
{
  "order": ["Q1", "Q2", ..., "Q21 (part 2)", "Q20"],
  "bank": {
    "Q1": {
      "exam_question": "Q1", "type": "MCQ",
      "lesson": "2-1 Writing and Interpreting Equations",
      "learning_outcome": "Translate sentences into equations",
      "textbook": "page 71, Exercises 1–4",
      "instruction": "...",
      "questions": [
        { "n": 1, "source": "Textbook · Ex. 1" | "new practice", "level": 1|2|3,
          "stem": "text with $LaTeX$", "graph": {...optional...},
          "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
          "answer": "B" }
      ]
    },
    "Q21": { "type": "FRQ", ..., "questions": [
        { "n": 1, "prompt": "Solve $2(r+6)=4(r+4)$.", "final_answer": "$r=-2$", "level": 1 } ] }
  }
}
```

### Format notes
- **Math:** written as LaTeX between `$…$`. Render it with KaTeX or MathJax.
  - `\llbracket x\rrbracket` is the greatest integer function ⟦x⟧, which KaTeX supports.
  - `\$` is a literal dollar sign (money).
  - `**text**` means bold.
- **Graph fields:** some stems or options are a graph instead of text. Draw them (SVG or canvas) from the data:
  - `line_through_points`: a line through the two `points` on a −5..5 grid, with both points labelled.
  - `absolute_value_V`: the graph of `function` (vertex given) on a −6..6 grid.
  - `number_line_ray`: a number line over `range`, with an `open`/`closed` dot at `point` and a ray going `left`/`right`.
  - `greatest_integer_steps`: the step graph of `function`. Use a closed dot on the left end and an open dot on the right end of each step. If `dots_reversed: true`, swap them (this is a deliberate wrong option).
- **Q21 has two parts in the bank.** `"Q21"` is the Distributive Property (Lesson 2-4) and `"Q21 (part 2)"` is compound "and" inequalities (Lesson 6-3). The exam's Q21 covers both, so build the 5 Q21 questions as **3 from "Q21" + 2 from "Q21 (part 2)"**.

## Rules
1. **Stay on topic.** Every question in a set must test exactly that set's `learning_outcome`, at the same type and difficulty as the bank questions. Remove anything unrelated.
2. **Use different numbers from the booklet.** Treat each bank question as a **pattern**: keep the structure, wording style and kind of distractors, but change the numbers. Recompute the correct answer every time.
3. **Choosing 12 MCQs (or 5 FRQs) from the bank:**
   - **Bank has more than you need:** keep the textbook-based patterns first, then choose new-practice patterns so levels 1, 2 and 3 are all represented, ordered from easy to hard.
   - **Bank has fewer than 12:** add more questions written on the **same pattern** as the existing ones. This applies to Q8 (10), Q9 (8), Q11 (10), Q14 (10), Q15 (10) and Q17 (8).
4. **Exactly one correct option.** Every MCQ has 4 options and exactly one is correct.
   - Distractors must come from realistic mistakes: a sign error, the wrong order of subtraction, missing brackets, the reciprocal factor, the wrong inverse operation, an open/closed dot mix-up, or the inequality not flipped.
   - **No distractor may be mathematically equivalent to the correct answer.** Watch for these:
     - Q8 dilations: for f(x)=x, "vertical stretch by a" and "horizontal compression by 1/a" give the same line. Never offer both.
     - Point-slope forms: the same line written with the other point is also correct.
5. **Q8 answer format:** options must include the type, the factor and the steepness, e.g. "vertical stretch, factor 5 (steeper)" or "horizontal stretch, factor 4 (less steep)". Vertical factor = a; horizontal factor = 1/a.
6. **Spread the answers.** Balance the correct letters across A–D within each set.
7. **FRQs** keep the bank's structure:
   - Q22 and Q24 have parts a/b/c.
   - Q23 needs a coordinate grid and both intercepts.
   - Q21 part 2 needs a number line.
   - Store a model final answer for each.
8. **Check every answer by computing it.** You can write a small script that solves each new question and confirms that the stored answer is the only correct option.
9. **Don't change** the site's layout, styling or logic beyond what's needed to load the new question data.

## Deliverables
- The updated question data for all 25 sets: 20 × 12 MCQ and 5 × 5 FRQ.
- A short report listing each set, how many questions were replaced, and any new patterns you added.
