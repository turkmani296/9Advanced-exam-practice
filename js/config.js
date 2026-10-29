// ── Configuration ──────────────────────────────────────────
const CONFIG = {
  TEACHER_NAME: "Mr. Mohamad Turkmani",
  SCHOOL_NAME: "Zayed Educational Complex – Suhaila",
  MASTERY_THRESHOLD: 0.80,
  SHOW_OUTCOME_NAMES: false,
  MCQ_SET_SIZE: 12,
  FRQ_SET_SIZE: 5,
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

// ── Tile Blueprint (Ordered chronologically from first lesson to last lesson) ──
const TILE_BLUEPRINT = [
  // MCQ tiles Q1–Q20 (Ordered: L 2-1 -> L 2-3 -> L 2-4 -> L 2-5 -> L 2-6 -> L 4-2 -> L 4-3 -> L 4-4 -> L 4-6 -> L 4-7 -> L 5-1 -> L 5-2 -> L 5-6 -> L 6-1 -> L 6-2 -> L 6-4)
  { tile: 1,  type: "mcq", pages: "71",       lessons: "2-1", outcome: "Translate sentences into equations" },
  { tile: 2,  type: "mcq", pages: "88",       lessons: "2-3", outcome: "Solve multi-step equations" },
  { tile: 3,  type: "mcq", pages: "97",       lessons: "2-4", outcome: "Solve equations with variables on each side" },
  { tile: 4,  type: "mcq", pages: "106",      lessons: "2-5", outcome: "Solve absolute value equations" },
  { tile: 5,  type: "mcq", pages: "113",      lessons: "2-6", outcome: "Solve proportions" },
  { tile: 6,  type: "mcq", pages: "227",      lessons: "4-2", outcome: "Find slope of a line" },
  { tile: 7,  type: "mcq", pages: "235",      lessons: "4-3", outcome: "Rewrite in slope-intercept form" },
  { tile: 8,  type: "mcq", pages: "248",      lessons: "4-4", outcome: "Dilations of linear functions" },
  { tile: 9,  type: "mcq", pages: "261",      lessons: "4-6", outcome: "Graph step functions" },
  { tile: 10, type: "mcq", pages: "265",      lessons: "4-6", outcome: "Identify step functions" },
  { tile: 11, type: "mcq", pages: "267",      lessons: "4-7", outcome: "Translations of absolute value functions" },
  { tile: 12, type: "mcq", pages: "277",      lessons: "4-7", outcome: "Graph absolute value functions" },
  { tile: 13, type: "mcq", pages: "293",      lessons: "5-1", outcome: "Slope-intercept from slope and point" },
  { tile: 14, type: "mcq", pages: "297, 303", lessons: "5-2", outcome: "Point-slope form from two points" },
  { tile: 15, type: "mcq", pages: "304",      lessons: "5-2", outcome: "Equation through a point parallel to a line" },
  { tile: 16, type: "mcq", pages: "304, 305", lessons: "5-2", outcome: "Parallel and perpendicular line equations" },
  { tile: 17, type: "mcq", pages: "331",      lessons: "5-6", outcome: "Inverses of relations" },
  { tile: 18, type: "mcq", pages: "347",      lessons: "6-1", outcome: "Solve inequalities by subtraction" },
  { tile: 19, type: "mcq", pages: "354",      lessons: "6-2", outcome: "Solve multi-step inequalities" },
  { tile: 20, type: "mcq", pages: "371",      lessons: "6-4", outcome: "Solve absolute value inequalities (<)" },
  // FRQ tiles Q21–Q25 (numbered as in the teacher's Question Booklet)
  { tile: 21, type: "frq", pages: "97, 363",  lessons: "2-4, 6-3", outcome: "Distributive Property & compound inequalities" },
  { tile: 22, type: "frq", pages: "120, 126", lessons: "2-7", outcome: "Solve equations for specific variables" },
  { tile: 23, type: "frq", pages: "216",      lessons: "4-1", outcome: "Graph using intercepts" },
  { tile: 24, type: "frq", pages: "256",      lessons: "4-5", outcome: "Arithmetic sequence formula" },
  { tile: 25, type: "frq", pages: "301, 302", lessons: "5-2", outcome: "Parallel and perpendicular lines" },
];

// ── Lesson Groups (for mastery) ────────────────────────────
const LESSON_GROUPS = {
  "2-1": [1],
  "2-3": [2],
  "2-4": [3, 21],   // Q21 Distributive Property questions
  "2-5": [4],
  "2-6": [5],
  "2-7": [22],
  "4-1": [23],
  "4-2": [6],
  "4-3": [7],
  "4-4": [8],
  "4-5": [24],
  "4-6": [9, 10],
  "4-7": [11, 12],
  "5-1": [13],
  "5-2": [14, 15, 16, 25],
  "5-6": [17],
  "6-1": [18],
  "6-2": [19],
  "6-3": [21],       // Q21 compound inequality questions
  "6-4": [20],
};
