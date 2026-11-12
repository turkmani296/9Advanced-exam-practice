// ── Configuration ──────────────────────────────────────────
const CONFIG = {
  TEACHER_NAME: "Mr. Mohamad Turkmani",
  SCHOOL_NAME: "Zayed Educational Complex – Suhaila",
  MASTERY_THRESHOLD: 0.80,
  SHOW_OUTCOME_NAMES: true,
  MCQ_SET_SIZE: 5,              // questions drawn at random for each MCQ visit
  MCQ_BANK_SIZE: 30,            // questions in each MCQ set's bank
  FRQ_SET_SIZE: 2,              // questions drawn at random for each written-answer visit
  FRQ_BANK_SIZE: 10,            // questions in each written-answer set's bank
};

// ── Firebase Cloud Sync Configuration ────────────────────────
// Live real-time syncing across PC, phones, tablets, and students:
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA4gqMnSC5fztjXD8hjuJ4C9VcPy6VNim8",
  authDomain: "mmmxd296-github.firebaseapp.com",
  databaseURL: "https://mmmxd296-github-default-rtdb.firebaseio.com",
  projectId: "mmmxd296-github",
  storageBucket: "mmmxd296-github.firebasestorage.app",
  messagingSenderId: "990484112573",
  appId: "1:990484112573:web:983e30cd346d21a6c683d4"
};
const firebaseConfig = FIREBASE_CONFIG;

// ── Tile Blueprint (matches the End of Term 1 coverage sheet, 2026–2027) ──
const TILE_BLUEPRINT = [
  // MCQ tiles Q1–Q20
  { tile: 1,  type: "mcq", pages: "71",       lessons: "2-1", outcome: "Translate sentences into equations" },
  { tile: 2,  type: "mcq", pages: "88",       lessons: "2-3", outcome: "Solve multi-step equations" },
  { tile: 3,  type: "mcq", pages: "97",       lessons: "2-4", outcome: "Variable on each side" },
  { tile: 4,  type: "mcq", pages: "106",      lessons: "2-5", outcome: "Absolute value equations" },
  { tile: 5,  type: "mcq", pages: "113",      lessons: "2-6", outcome: "Solve proportions" },
  { tile: 6,  type: "mcq", pages: "227",      lessons: "4-2", outcome: "Find the slope of a line" },
  { tile: 7,  type: "mcq", pages: "236",      lessons: "4-3", outcome: "Graph and interpret linear functions" },
  { tile: 8,  type: "mcq", pages: "248",      lessons: "4-4", outcome: "Dilations of linear functions" },
  { tile: 9,  type: "mcq", pages: "255",      lessons: "4-5", outcome: "Construct arithmetic sequences" },
  { tile: 10, type: "mcq", pages: "259",      lessons: "4-6", outcome: "Piecewise functions" },
  { tile: 11, type: "mcq", pages: "261",      lessons: "4-6", outcome: "Step functions" },
  { tile: 12, type: "mcq", pages: "267",      lessons: "4-7", outcome: "Translate absolute value functions" },
  { tile: 13, type: "mcq", pages: "269, 277", lessons: "4-7", outcome: "Graph absolute value functions" },
  { tile: 14, type: "mcq", pages: "293",      lessons: "5-1", outcome: "y = mx + b from slope and a point" },
  { tile: 15, type: "mcq", pages: "297, 303", lessons: "5-2", outcome: "Point-slope form from two points" },
  { tile: 16, type: "mcq", pages: "300–304",  lessons: "5-2", outcome: "Parallel and perpendicular lines" },
  { tile: 17, type: "mcq", pages: "331",      lessons: "5-6", outcome: "Inverses of relations" },
  { tile: 18, type: "mcq", pages: "347",      lessons: "6-1", outcome: "Graph the solutions of an inequality" },
  { tile: 19, type: "mcq", pages: "352, 354", lessons: "6-2", outcome: "Multi-step inequalities" },
  { tile: 20, type: "mcq", pages: "371",      lessons: "6-4", outcome: "Absolute value inequalities" },
  // FRQ tiles Q21–Q25
  // Q21 has two parts in the exam, so it has two tiles: part 1 sits in Module 2, part 2 (tile 26) in Module 6
  { tile: 21, type: "frq", pages: "97",       lessons: "2-4", label: "Q21 · Part 1", outcome: "Solve equations using the Distributive Property" },
  { tile: 22, type: "frq", pages: "120, 126", lessons: "2-7", outcome: "Solve for a specific variable" },
  { tile: 23, type: "frq", pages: "216",      lessons: "4-1", outcome: "Graph using intercepts" },
  { tile: 24, type: "frq", pages: "256",      lessons: "4-5", outcome: "Arithmetic sequence formula" },
  { tile: 25, type: "frq", pages: "301–306",  lessons: "5-2", outcome: "Parallel and perpendicular lines" },
  { tile: 26, type: "frq", pages: "363",      lessons: "6-3", label: "Q21 · Part 2", outcome: "Solve and graph compound inequalities with and" },
];

// ── Module names (used to group the question list) ─────────
const MODULES = {
  "2": "Equations in One Variable",
  "4": "Linear and Nonlinear Functions",
  "5": "Creating Linear Equations",
  "6": "Linear Inequalities",
};

// ── Lesson Groups (for mastery) ────────────────────────────
const LESSON_GROUPS = {
  "2-1": [1],
  "2-3": [2],
  "2-4": [3, 21],   // Q21 part 1: Distributive Property
  "2-5": [4],
  "2-6": [5],
  "2-7": [22],
  "4-1": [23],
  "4-2": [6],
  "4-3": [7],
  "4-4": [8],
  "4-5": [9, 24],
  "4-6": [10, 11],
  "4-7": [12, 13],
  "5-1": [14],
  "5-2": [15, 16, 25],
  "5-6": [17],
  "6-1": [18],
  "6-2": [19],
  "6-3": [26],       // Q21 part 2: compound inequalities
  "6-4": [20],
};
// Display name of a tile ("Q7", or "Q21 · Part 1" for the split question)
function qLabel(tile) {
  const t = TILE_BLUEPRINT.find(x => x.tile === Number(tile));
  return (t && t.label) || `Q${tile}`;
}
