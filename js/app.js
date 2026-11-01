// ── Main Application ───────────────────────────────────────
(() => {
  'use strict';

  // ── Teacher & Student Activity Tracker (localStorage + Firebase Cloud Sync) ──
  const TRACKER_KEY = 'eot_teacher_tracker_v1';
  const TEACHER_CODE = '5113';

  // ── Firebase Real-time Cloud Sync Engine ──────────────
  let fbDb = null;
  let isCloudActive = false;

  function initFirebaseSync() {
    const cfg = (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey ? FIREBASE_CONFIG : null) || 
                (typeof firebaseConfig !== 'undefined' && firebaseConfig && firebaseConfig.apiKey ? firebaseConfig : null);

    if (typeof firebase !== 'undefined' && cfg && cfg.apiKey) {
      try {
        if (!cfg.databaseURL && cfg.projectId) {
          cfg.databaseURL = `https://${cfg.projectId}-default-rtdb.firebaseio.com`;
        }
        if (!firebase.apps || !firebase.apps.length) {
          firebase.initializeApp(cfg);
        }
        fbDb = firebase.database();
        isCloudActive = true;

        // Real-time listener: pull all students from the cloud database
        fbDb.ref('eot_students').on('value', (snapshot) => {
          const cloudData = snapshot.val();
          if (cloudData) {
            const localData = Tracker.getData();
            Object.keys(cloudData).forEach(k => {
              const s = cloudData[k];
              if (s && s.name) {
                localData.students[s.name] = s;
              }
            });
            Tracker.saveData(localData, false);
            if (state.currentScreen === 'teacher-dashboard') {
              render();
            }
          }
        }, (err) => {
          console.warn('Firebase cloud sync notice:', err);
        });

        // Push any existing local students to cloud so they sync to other devices immediately
        const existingData = Tracker.getData();
        if (existingData && existingData.students) {
          Object.values(existingData.students).forEach(s => pushStudentToCloud(s));
        }
      } catch (err) {
        console.warn('Firebase init notice:', err);
      }
    }
  }

  function pushStudentToCloud(student) {
    if (!isCloudActive || !fbDb || !student || !student.name) return;
    try {
      // Firebase keys cannot contain '.', '#', '$', '/', '[', or ']'
      const safeKey = encodeURIComponent(student.name.trim()).replace(/\./g, '%2E');
      fbDb.ref('eot_students/' + safeKey).set(student);
    } catch (e) {
      console.warn('Cloud sync error:', e);
    }
  }

  const Tracker = {
    getData() {
      try {
        const d = localStorage.getItem(TRACKER_KEY);
        return d ? JSON.parse(d) : { students: {} };
      } catch { return { students: {} }; }
    },
    saveData(data, syncToCloud = false) {
      try {
        localStorage.setItem(TRACKER_KEY, JSON.stringify(data));
      } catch (e) { console.error('Tracker save error', e); }
    },
    getStudent(name) {
      if (!name) return null;
      const data = this.getData();
      return data.students[name.trim()] || null;
    },
    loginStudent(name) {
      if (!name) return null;
      const clean = name.trim();
      const data = this.getData();
      const now = new Date().toISOString();
      const displayTime = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      if (!data.students[clean]) {
        data.students[clean] = {
          name: clean,
          firstSeen: now,
          firstSeenDisplay: displayTime,
          lastSeen: now,
          lastSeenDisplay: displayTime,
          visits: 1,
          tileAttempts: {},
          history: [],
          certificates: [],
          activities: [
            { type: 'login', text: 'First login to practice platform', time: displayTime }
          ]
        };
      } else {
        const s = data.students[clean];
        s.lastSeen = now;
        s.lastSeenDisplay = displayTime;
        s.visits = (s.visits || 1) + 1;
        s.activities = s.activities || [];
        s.activities.unshift({ type: 'login', text: `Session access (visit #${s.visits})`, time: displayTime });
      }
      this.saveData(data);
      pushStudentToCloud(data.students[clean]);
      return data.students[clean];
    },
    recordAttempt(name, tileNum, score, total, type) {
      if (!name) return 1;
      const clean = name.trim();
      const data = this.getData();
      if (!data.students[clean]) this.loginStudent(clean);
      const s = data.students[clean];

      s.tileAttempts = s.tileAttempts || {};
      const attemptNum = (s.tileAttempts[tileNum] || 0) + 1;
      s.tileAttempts[tileNum] = attemptNum;

      const dateStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;

      s.history = s.history || [];
      s.history.unshift({
        tile: tileNum,
        type: type,
        score: score,
        total: total,
        pct: pct,
        attemptNumber: attemptNum,
        date: dateStr
      });

      s.activities = s.activities || [];
      s.activities.unshift({
        type: 'attempt',
        text: `Completed Q${tileNum} (${type.toUpperCase()}) — Score: ${score}/${total} (${pct}%) [Attempt #${attemptNum}]`,
        time: dateStr
      });

      this.saveData(data);
      pushStudentToCloud(s);
      return attemptNum;
    },
    recordCertificate(name, lesson, scorePct, attemptNum) {
      if (!name) return;
      const clean = name.trim();
      const data = this.getData();
      if (!data.students[clean]) this.loginStudent(clean);
      const s = data.students[clean];

      s.certificates = s.certificates || [];
      const dateStr = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
      const timeStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

      const existing = s.certificates.find(c => c.lesson === lesson);
      if (!existing) {
        s.certificates.push({
          lesson,
          scorePct,
          attemptNumber: attemptNum || 1,
          date: dateStr
        });
      }

      s.activities = s.activities || [];
      s.activities.unshift({
        type: 'certificate',
        text: `Mastered Lesson ${lesson} (${scorePct}%) [Attempt #${attemptNum || 1}]`,
        time: timeStr
      });

      this.saveData(data);
      pushStudentToCloud(s);
    },
    clearAll() {
      this.saveData({ students: {} });
      if (isCloudActive && fbDb) {
        try {
          fbDb.ref('eot_students').remove();
        } catch (e) {
          console.warn('Cloud remove error:', e);
        }
      }
    }
  };

  // ── State ──────────────────────────────────────────
  const STATE_KEY = 'eot_math_state';
  let state = loadState();

  function defaultState() {
    return {
      studentName: '',
      currentScreen: 'entry', // starts with mandatory name requirement screen
      currentSection: null,     // 'mcq' | 'frq'
      currentTile: null,
      currentQuestionIndex: 0,
      currentSeed: Date.now(),
      // per-tile: { [tile]: { answers: [], score: null, total: null, completed: false, seed, attemptNumber } }
      tileProgress: {},
      // certificates earned: [{ lesson, score, scorePct, date, attemptNumber }]
      certificates: [],
      // mastery check context
      masteryContext: null,
    };
  }

  function loadState() {
    try {
      const s = sessionStorage.getItem(STATE_KEY);
      return s ? { ...defaultState(), ...JSON.parse(s) } : defaultState();
    } catch { return defaultState(); }
  }

  function saveState() {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  // ── Router ─────────────────────────────────────────
  function render() {
    const app = document.getElementById('app');
    if (!state.studentName && state.currentScreen !== 'teacher-dashboard') {
      state.currentScreen = 'entry';
    }
    switch (state.currentScreen) {
      case 'entry': app.innerHTML = renderEntry(); bindEntry(); break;
      case 'landing': app.innerHTML = renderLanding(); bindLanding(); break;
      case 'list': app.innerHTML = renderList(); bindList(); break;
      case 'practice': app.innerHTML = renderPractice(); bindPractice(); break;
      case 'results': app.innerHTML = renderResults(); bindResults(); break;
      case 'certificates': app.innerHTML = renderCertificates(); bindCertificates(); break;
      case 'certificate-view': app.innerHTML = renderCertificateView(); bindCertificateView(); break;
      case 'mastery': app.innerHTML = renderMastery(); bindMastery(); break;
      case 'teacher-dashboard': app.innerHTML = renderTeacherDashboard(); bindTeacherDashboard(); break;
    }
    // Render KaTeX
    if (window.renderMathInElement) {
      renderMathInElement(app, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false
      });
    }
    saveState();
  }

  // ── Helpers ────────────────────────────────────────
  function getTileInfo(tileNum) {
    return TILE_BLUEPRINT.find(t => t.tile === tileNum);
  }

  function getTileStatus(tileNum) {
    const p = state.tileProgress[tileNum];
    if (!p) return 'not-started';
    if (p.completed) return 'completed';
    if (p.answers && p.answers.length > 0) return 'in-progress';
    return 'not-started';
  }

  function getTileScore(tileNum) {
    const p = state.tileProgress[tileNum];
    if (!p || !p.completed) return null;
    return { score: p.score, total: p.total };
  }

  function isLessonMastered(lesson) {
    const tiles = LESSON_GROUPS[lesson];
    if (!tiles) return false;
    // All tiles in lesson must be completed
    const allCompleted = tiles.every(t => {
      const p = state.tileProgress[t];
      return p && p.completed;
    });
    if (!allCompleted) return false;
    // Calculate lesson score
    const { score, total } = getLessonScore(lesson);
    return total > 0 && (score / total) >= CONFIG.MASTERY_THRESHOLD;
  }

  function getLessonScore(lesson) {
    const tiles = LESSON_GROUPS[lesson];
    if (!tiles) return { score: 0, total: 0 };
    let totalScore = 0, totalPossible = 0;
    tiles.forEach(t => {
      const p = state.tileProgress[t];
      if (p && p.completed) {
        totalScore += p.score;
        totalPossible += p.total;
      }
    });
    return { score: totalScore, total: totalPossible };
  }

  function isLessonComplete(lesson) {
    const tiles = LESSON_GROUPS[lesson];
    if (!tiles) return false;
    return tiles.every(t => {
      const p = state.tileProgress[t];
      return p && p.completed;
    });
  }

  function getTileLessons(tileNum) {
    const info = getTileInfo(tileNum);
    return info ? info.lessons.split(',').map(s => s.trim()) : [];
  }

  function generateQuestions(tileNum, seed) {
    const bank = QUESTION_BANK[tileNum];
    if (!bank) return [];
    return bank.questions.map((q, i) => {
      try {
        return { ...q.generate(seed + i * 7), templateIndex: i, id: q.id };
      } catch (e) {
        console.error(`Error generating Q${tileNum} template ${i}:`, e);
        return null;
      }
    }).filter(Boolean);
  }

  // ── ENTRY SCREEN (Mandatory Name / Secret Code) ────
  function renderEntry() {
    return `
    <div class="entry-screen">
      <div class="entry-card">
        <div class="entry-logos">
          <img src="assets/math-logo-trimmed.png" alt="Mathematics Exam" class="logo-math">
          <div class="logo-school-wrap">
            <img src="assets/school-logo.png" alt="Zayed Educational Complex" class="logo-school">
          </div>
        </div>
        <div class="entry-header">
          <h1 class="entry-title">End of Term Exam Practice</h1>
          <p class="entry-subtitle">Grade 9 Advanced Mathematics · Reveal Integrated 1</p>
          <span class="entry-school-badge">${CONFIG.SCHOOL_NAME}</span>
        </div>
        <div class="entry-form">
          <label for="entry-name-input" class="entry-label">Enter your name to start practice:</label>
          <div class="entry-input-wrap">
            <input type="text" id="entry-name-input" class="entry-input" placeholder="Your Full Name / اكتب اسمك هنا" autocomplete="name" dir="auto" autofocus>
            <span class="entry-input-icon">✏️</span>
          </div>
          <p class="entry-hint" id="entry-hint">All attempts and certificates will be saved under your name.</p>
          <button id="entry-start-btn" class="btn btn-primary entry-start-btn" disabled>
            Start Practice →
          </button>
        </div>
        <div class="entry-footer">
          <span class="teacher-credit">Instructor: <strong>${CONFIG.TEACHER_NAME}</strong></span>
          <button type="button" class="teacher-portal-link" id="entry-teacher-btn">🔒 Teacher Portal</button>
        </div>
      </div>
    </div>`;
  }

  function bindEntry() {
    const input = document.getElementById('entry-name-input');
    const btn = document.getElementById('entry-start-btn');
    if (!input || !btn) return;

    if (typeof input.focus === 'function') {
      try { input.focus(); } catch (e) {}
    }

    input.addEventListener('input', () => {
      const val = input.value.trim();
      btn.disabled = val.length < 2;
    });

    const submitEntry = () => {
      const val = input.value.trim();
      if (val === TEACHER_CODE) {
        input.value = '';
        state.currentScreen = 'teacher-dashboard';
        render();
      } else if (val.length >= 2) {
        loginStudent(val);
        state.currentScreen = 'landing';
        render();
      }
    };

    btn.addEventListener('click', submitEntry);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !btn.disabled) submitEntry();
    });

    document.getElementById('entry-teacher-btn')?.addEventListener('click', () => {
      openTeacherModal();
    });
  }

  function loginStudent(name) {
    state.studentName = name.trim();
    const student = Tracker.loginStudent(state.studentName);
    if (student) {
      // Restore student's certificates if any
      if (student.certificates && student.certificates.length > 0) {
        state.certificates = student.certificates.map(c => ({
          lesson: c.lesson,
          scorePct: c.scorePct,
          attemptNumber: c.attemptNumber || 1,
          date: c.date,
          studentName: state.studentName,
          teacherName: CONFIG.TEACHER_NAME,
          schoolName: CONFIG.SCHOOL_NAME,
        }));
      }
    }
    saveState();
  }

  // ── LANDING ────────────────────────────────────────
  function renderLanding() {
    const student = Tracker.getStudent(state.studentName);
    const completedCount = student?.history ? new Set(student.history.map(h => h.tile)).size : 0;
    const certsCount = student?.certificates ? student.certificates.length : state.certificates.length;
    const latestAttempt = student?.history?.[0]?.attemptNumber || 0;

    return `
    <div class="landing">
      <header class="landing-header">
        <div class="landing-title">
          <h1>End of Term</h1>
          <p class="subtitle">Grade 9 Advanced Mathematics · Term 1</p>
        </div>
        <img src="assets/math-logo-trimmed.png" alt="Mathematics Exam" class="logo-math">
        <div class="logo-school-wrap">
          <img src="assets/school-logo.png" alt="Zayed Educational Complex" class="logo-school">
        </div>
      </header>
      <div class="landing-cards">
        <button class="landing-card" id="card-mcq" tabindex="0" aria-label="Multiple Choice Questions 1 to 20">
          <span class="card-icon">📝</span>
          <span class="card-type">MCQ</span>
          <span class="card-range">1 – 20</span>
        </button>
        <button class="landing-card" id="card-frq" tabindex="0" aria-label="Free Response Questions 21 to 25">
          <span class="card-icon">✏️</span>
          <span class="card-type">FRQ</span>
          <span class="card-range">21 – 25</span>
        </button>
      </div>
      <footer class="landing-footer">
        <div class="footer-profile-col">
          <button class="student-profile-pill" id="open-student-profile" title="View my progress, attempts and certificates">
            <span class="profile-avatar">👤</span>
            <div class="profile-info">
              <span class="profile-name">${escapeHTML(state.studentName)}</span>
              <span class="profile-meta">
                <span>${completedCount} completed</span> • 
                <span>${certsCount} certs</span>
                ${latestAttempt > 0 ? `<small class="attempt-badge">Att. #${latestAttempt}</small>` : ''}
              </span>
            </div>
          </button>
        </div>
        <div class="footer-teacher-col">
          <p class="teacher-name">${CONFIG.TEACHER_NAME}</p>
          <button type="button" class="landing-teacher-portal-btn" id="landing-teacher-btn" title="Open Teacher Portal">🔒 Teacher Portal</button>
        </div>
        <div class="banner-wrap">
          <img src="assets/banner.jpg" alt="School Banner" class="banner-img">
        </div>
      </footer>
    </div>`;
  }

  function bindLanding() {
    document.getElementById('card-mcq')?.addEventListener('click', () => openSection('mcq'));
    document.getElementById('card-frq')?.addEventListener('click', () => openSection('frq'));
    document.getElementById('open-student-profile')?.addEventListener('click', () => showStudentProfileModal());
    document.getElementById('landing-teacher-btn')?.addEventListener('click', () => openTeacherModal());
  }

  function openSection(section) {
    state.currentSection = section;
    state.currentScreen = 'list';
    render();
  }

  function showStudentProfileModal() {
    const modal = document.getElementById('profile-modal');
    const content = document.getElementById('profile-modal-content');
    const closeBtn = document.getElementById('close-profile-modal');
    if (!modal || !content) return;

    const student = Tracker.getStudent(state.studentName) || {
      name: state.studentName,
      history: [],
      certificates: state.certificates,
      firstSeenDisplay: 'Today',
      lastSeenDisplay: 'Today',
      visits: 1
    };

    const completedTiles = student.history || [];
    const certs = student.certificates || state.certificates || [];

    content.innerHTML = `
      <div class="profile-modal-body">
        <div class="profile-header-card">
          <div class="profile-avatar-lg">👤</div>
          <div>
            <h2 class="profile-student-title">${escapeHTML(student.name)}</h2>
            <div class="profile-time-info">
              <span>First session: ${student.firstSeenDisplay || 'Today'}</span> • 
              <span>Sessions: <strong>${student.visits || 1}</strong></span>
            </div>
          </div>
        </div>

        <div class="profile-stats-grid">
          <div class="stat-box">
            <span class="stat-number">${new Set(completedTiles.map(h => h.tile)).size} / 25</span>
            <span class="stat-desc">Sets Completed</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">${completedTiles.length}</span>
            <span class="stat-desc">Total Attempts</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">${certs.length}</span>
            <span class="stat-desc">Certificates</span>
          </div>
        </div>

        <div class="profile-section">
          <h4 class="profile-section-title">Certificates Earned:</h4>
          ${certs.length > 0 ? `
            <div class="profile-certs-grid">
              ${certs.map(c => `
                <div class="profile-cert-card">
                  <span class="cert-star">★</span>
                  <div class="cert-card-text">
                    <strong>Lesson ${c.lesson} Mastery</strong> (${c.scorePct}%)
                    <small class="attempt-badge">Attempt #${c.attemptNumber || 1}</small>
                    <div class="cert-date">${c.date}</div>
                  </div>
                  <button class="btn btn-secondary btn-sm profile-open-cert" data-lesson="${c.lesson}" data-score="${c.scorePct}">View</button>
                </div>
              `).join('')}
            </div>
          ` : '<p class="profile-empty-text">No certificates earned yet. Achieve ≥ 80% on a lesson to earn your certificate!</p>'}
        </div>

        <div class="profile-section">
          <h4 class="profile-section-title">Completed Practice Sets History:</h4>
          ${completedTiles.length > 0 ? `
            <div class="profile-history-list">
              ${completedTiles.map(h => {
                const info = getTileInfo(h.tile);
                return `
                <div class="profile-history-row">
                  <div class="history-q-col">
                    <span class="history-q-badge">Q${h.tile}</span>
                    <div>
                      <span class="history-q-type">${h.type.toUpperCase()} · P.${info ? info.pages : ''} · L ${info ? info.lessons : ''}</span>
                      <div class="history-q-date">${h.date}</div>
                    </div>
                  </div>
                  <div class="history-score-col">
                    <span class="history-score-num">${h.score}/${h.total} (${h.pct}%)</span>
                    <small class="attempt-badge">Attempt #${h.attemptNumber}</small>
                  </div>
                </div>`;
              }).join('')}
            </div>
          ` : '<p class="profile-empty-text">No practice sets completed yet. Choose MCQ or FRQ to start!</p>'}
        </div>

        <div class="profile-modal-actions">
          <button class="btn btn-primary" id="profile-close-btn">Close</button>
          <button class="btn btn-secondary" id="profile-switch-btn">Switch Student</button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');

    const closeModal = () => modal.classList.add('hidden');
    closeBtn.onclick = closeModal;
    document.getElementById('profile-close-btn').onclick = closeModal;

    document.getElementById('profile-switch-btn').onclick = () => {
      closeModal();
      state.studentName = '';
      state.currentScreen = 'entry';
      render();
    };

    content.querySelectorAll('.profile-open-cert').forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal();
        const lesson = btn.dataset.lesson;
        const scorePct = parseInt(btn.dataset.score);
        state.masteryContext = { lesson, scorePct, mastered: true };
        state.currentScreen = 'certificate-view';
        render();
      });
    });
  }

  // ── TEACHER PASSCODE MODAL (Discreet & Masked) ──────
  function openTeacherModal() {
    const modal = document.getElementById('teacher-modal');
    const input = document.getElementById('teacher-passcode-input');
    const errorMsg = document.getElementById('teacher-auth-error');
    const closeBtn = document.getElementById('close-teacher-modal');
    const cancelBtn = document.getElementById('cancel-teacher-modal');
    const form = document.getElementById('teacher-auth-form');
    const toggleBtn = document.getElementById('toggle-teacher-passcode');

    if (!modal || !input) return;

    // Reset input state
    input.value = '';
    input.type = 'password';
    if (toggleBtn) toggleBtn.textContent = '👁️';
    if (errorMsg) errorMsg.classList.add('hidden');

    modal.classList.remove('hidden');
    setTimeout(() => {
      try { input.focus(); } catch (e) {}
    }, 60);

    const closeModal = () => {
      modal.classList.add('hidden');
      input.value = '';
      if (errorMsg) errorMsg.classList.add('hidden');
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    if (toggleBtn) {
      toggleBtn.onclick = () => {
        if (input.type === 'password') {
          input.type = 'text';
          toggleBtn.textContent = '🙈';
        } else {
          input.type = 'password';
          toggleBtn.textContent = '👁️';
        }
      };
    }

    const verifyPasscode = () => {
      const val = input.value.trim();
      if (val === TEACHER_CODE) {
        closeModal();
        state.currentScreen = 'teacher-dashboard';
        render();
      } else {
        if (errorMsg) {
          errorMsg.classList.remove('hidden');
          errorMsg.style.animation = 'none';
          void errorMsg.offsetWidth;
          errorMsg.style.animation = 'shake 0.3s ease';
        }
        input.value = '';
        input.focus();
      }
    };

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        verifyPasscode();
        return false;
      };
    }
  }

  // ── QUESTION LIST ──────────────────────────────────
  function renderList() {
    const isMCQ = state.currentSection === 'mcq';
    const tiles = TILE_BLUEPRINT.filter(t => t.type === (isMCQ ? 'mcq' : 'frq'));
    const title = isMCQ ? 'MCQ 1–20' : 'FRQ 21–25';

    let tilesHTML = tiles.map(t => {
      const status = getTileStatus(t.tile);
      const scoreData = getTileScore(t.tile);
      const lessons = t.lessons.split(',').map(s => s.trim());
      const starred = lessons.some(l => isLessonMastered(l));
      const outcomeHTML = CONFIG.SHOW_OUTCOME_NAMES ? `<div class="tile-outcome">${t.outcome}</div>` : '';

      return `
      <button class="tile" data-tile="${t.tile}" tabindex="0" aria-label="Question ${t.tile}">
        ${starred ? '<span class="tile-star" title="Lesson mastered">★</span>' : ''}
        <div class="tile-q">Q${t.tile}</div>
        ${outcomeHTML}
        <div class="tile-meta">
          <span>P.${t.pages}</span>
          <span>L ${t.lessons}</span>
        </div>
        ${scoreData ? `<span class="tile-score">${formatScore(scoreData.score)}/${scoreData.total}</span>` : ''}
        <span class="tile-status ${status}"></span>
      </button>`;
    }).join('');

    return `
    <div class="list-screen">
      <header class="section-header">
        <button class="back-btn" id="back-to-landing" aria-label="Back to home">←</button>
        <h2 class="section-title">${title}</h2>
        <div class="student-info">
          <span class="student-name">${escapeHTML(state.studentName)}</span>
          <a class="change-student" id="change-student">Change student</a>
        </div>
        <button class="cert-btn" id="open-certs">🏅 Certificates</button>
      </header>
      <div class="tile-grid">${tilesHTML}</div>
    </div>`;
  }

  function bindList() {
    document.getElementById('back-to-landing').addEventListener('click', () => {
      state.currentScreen = 'landing';
      render();
    });
    document.getElementById('change-student').addEventListener('click', () => {
      state.studentName = '';
      state.currentScreen = 'entry';
      render();
    });
    document.getElementById('open-certs').addEventListener('click', () => {
      state.currentScreen = 'certificates';
      render();
    });
    document.querySelectorAll('.tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const tileNum = parseInt(tile.dataset.tile);
        startPractice(tileNum);
      });
    });
  }

  function startPractice(tileNum, newSeed) {
    const seed = newSeed || Date.now();
    state.currentTile = tileNum;
    state.currentSeed = seed;
    state.currentQuestionIndex = 0;

    // Initialize or reset tile progress
    state.tileProgress[tileNum] = {
      answers: [],
      revealed: {},
      userInputs: {},
      score: null,
      total: null,
      completed: false,
      seed: seed,
    };

    state.currentScreen = 'practice';
    render();
  }

  function isAnswered(ans) {
    return ans != null;
  }

  function countAnswered(progress) {
    return (progress.answers || []).filter(isAnswered).length;
  }

  // ── PRACTICE SET ───────────────────────────────────
  function renderPractice() {
    const tileNum = state.currentTile;
    const info = getTileInfo(tileNum);
    const questions = generateQuestions(tileNum, state.currentSeed);
    const qi = state.currentQuestionIndex;
    const total = questions.length;
    const q = questions[qi];
    const progress = state.tileProgress[tileNum];
    const answered = progress.answers[qi];

    if (!q) return `<div class="question-card"><p>Question data unavailable. Please go back and try again.</p>
      <button class="btn btn-primary" id="back-to-list-err">Back to list</button></div>`;

    const pct = ((qi + 1) / total * 100).toFixed(0);
    const outcomeLabel = CONFIG.SHOW_OUTCOME_NAMES ? ` · ${info.outcome}` : '';
    const answeredCount = countAnswered(progress);
    const minToSubmit = CONFIG.MIN_QUESTIONS_TO_SUBMIT;

    let questionBody = '';
    if (info.type === 'mcq') {
      questionBody = renderMCQQuestion(q, answered, qi);
    } else {
      questionBody = renderFRQQuestion(q, answered, qi, tileNum);
    }

    return `
    <div class="practice-screen">
      <header class="section-header">
        <button class="back-btn" id="back-to-list" aria-label="Back to list">←</button>
        <h2 class="section-title">Q${tileNum} · P.${info.pages} · L ${info.lessons}${outcomeLabel}</h2>
        <div class="student-info">
          <span class="student-name">${escapeHTML(state.studentName)}</span>
        </div>
        <button class="calc-toggle-btn" id="open-calc">🧮 Calculator</button>
      </header>
      <div class="practice-header-info">
        <span class="q-label">Question ${qi + 1} of ${total}</span>
        <div class="progress-wrap">
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span class="progress-text">${pct}%</span>
        </div>
      </div>
      <div class="question-card">
        <div class="question-text">${q.text || ''}</div>
        ${questionBody}
        ${renderHints(q, qi)}
        ${info.type === 'mcq' && answered != null ? renderExplanation(q) : ''}
      </div>
      <div class="question-nav">
        <button class="nav-btn nav-btn-prev" id="prev-q" ${qi === 0 ? 'disabled' : ''}>← Previous</button>
        <div class="question-nav-right">
          ${answeredCount < total
            ? `<button class="nav-btn nav-btn-submit" id="submit-early" ${answeredCount < minToSubmit ? `disabled title="Answer at least ${minToSubmit} questions to submit early"` : ''}>Submit early</button>`
            : ''
          }
          ${qi < total - 1
            ? `<button class="nav-btn nav-btn-next" id="next-q" ${answered == null ? 'disabled' : ''}>Next →</button>`
            : `<button class="nav-btn nav-btn-next btn-accent" id="finish-set" ${answered == null ? 'disabled' : ''}>Finish</button>`
          }
        </div>
      </div>
    </div>`;
  }

  function renderMCQQuestion(q, answered, qi) {
    if (!q.options) return '<p>No options available</p>';
    return `<div class="mcq-options">
      ${q.options.map((opt, oi) => {
        let cls = 'mcq-option';
        let feedbackHTML = '';
        if (answered != null) {
          cls += ' locked';
          if (opt.correct) cls += ' correct';
          else if (answered === oi) cls += ' wrong';
          if (answered === oi && !opt.correct) {
            feedbackHTML = `<div class="option-feedback wrong-fb">${opt.whyWrong || 'Incorrect'}</div>`;
          } else if (opt.correct) {
            feedbackHTML = `<div class="option-feedback correct-fb">✓ Correct answer</div>`;
          }
        }
        return `<button class="${cls}" data-qi="${qi}" data-oi="${oi}" tabindex="0">
          <span class="option-letter">${opt.letter}</span>
          <div>
            <span class="option-text">${opt.text}</span>
            ${feedbackHTML}
          </div>
        </button>`;
      }).join('')}
    </div>`;
  }

  function renderNumberLineSVG(cfg) {
    if (!cfg) return '';
    const min = cfg.min ?? -6;
    const max = cfg.max ?? 6;
    const width = 500, height = 70;
    const padX = 40;
    const lineY = 32;
    const scale = (width - 2 * padX) / (max - min);
    const toPx = (v) => padX + (v - min) * scale;

    let ticks = '';
    for (let v = min; v <= max; v++) {
      const x = toPx(v);
      ticks += `<line x1="${x}" y1="${lineY - 6}" x2="${x}" y2="${lineY + 6}" stroke="#1b2a4a" stroke-width="1.5"/>
                <text x="${x}" y="${lineY + 22}" text-anchor="middle" font-size="12" fill="#1b2a4a" font-family="Inter,sans-serif">${v}</text>`;
    }

    let shade = '';
    if (cfg.shadeBetween && cfg.p1 != null && cfg.p2 != null) {
      const x1 = toPx(cfg.p1);
      const x2 = toPx(cfg.p2);
      shade = `<line x1="${x1}" y1="${lineY}" x2="${x2}" y2="${lineY}" stroke="#5ba4a4" stroke-width="7" stroke-linecap="round"/>`;
    }

    let points = '';
    if (cfg.p1 != null) {
      const x1 = toPx(cfg.p1);
      const isClosed = cfg.p1Type === 'closed';
      points += `<circle cx="${x1}" cy="${lineY}" r="6" fill="${isClosed ? '#1b2a4a' : '#ffffff'}" stroke="#1b2a4a" stroke-width="2.5"/>`;
    }
    if (cfg.p2 != null) {
      const x2 = toPx(cfg.p2);
      const isClosed = cfg.p2Type === 'closed';
      points += `<circle cx="${x2}" cy="${lineY}" r="6" fill="${isClosed ? '#1b2a4a' : '#ffffff'}" stroke="#1b2a4a" stroke-width="2.5"/>`;
    }

    return `
    <div class="number-line-container" style="margin:16px 0;text-align:center;">
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="max-width:${width}px;background:#faf9f7;border:1px solid #e0dbd2;border-radius:8px;box-shadow:var(--shadow);">
        <defs>
          <marker id="arrow-left" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 10 0 L 0 5 L 10 10 z" fill="#1b2a4a"/>
          </marker>
          <marker id="arrow-right" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#1b2a4a"/>
          </marker>
        </defs>
        <line x1="15" y1="${lineY}" x2="${width - 15}" y2="${lineY}" stroke="#1b2a4a" stroke-width="2" marker-start="url(#arrow-left)" marker-end="url(#arrow-right)"/>
        ${ticks}
        ${shade}
        ${points}
      </svg>
    </div>`;
  }

  function renderCoordGridSVG(cfg) {
    if (!cfg) return '';
    const size = 300;
    const min = -6, max = 6;
    const pad = 24;
    const innerSize = size - 2 * pad;
    const scale = innerSize / (max - min);
    const toPx = (x) => pad + (x - min) * scale;
    const toPy = (y) => pad + (max - y) * scale;

    let gridLines = '';
    for (let v = min; v <= max; v++) {
      const px = toPx(v);
      const py = toPy(v);
      gridLines += `<line x1="${px}" y1="${pad}" x2="${px}" y2="${size - pad}" stroke="#e0dbd2" stroke-width="1"/>`;
      gridLines += `<line x1="${pad}" y1="${py}" x2="${size - pad}" y2="${py}" stroke="#e0dbd2" stroke-width="1"/>`;
    }

    const originX = toPx(0);
    const originY = toPy(0);

    let labels = '';
    [-4, -2, 2, 4].forEach(v => {
      labels += `<text x="${toPx(v)}" y="${originY + 14}" text-anchor="middle" font-size="10" fill="#6e685e">${v}</text>`;
      labels += `<text x="${originX - 10}" y="${toPy(v) + 4}" text-anchor="end" font-size="10" fill="#6e685e">${v}</text>`;
    });

    let plots = '';
    if (cfg.p1) {
      const [x1, y1] = cfg.p1;
      plots += `<circle cx="${toPx(x1)}" cy="${toPy(y1)}" r="5" fill="#1b2a4a"/>`;
      plots += `<text x="${toPx(x1) + 8}" y="${toPy(y1) - 6}" font-size="11" font-weight="600" fill="#1b2a4a">(${x1}, ${y1})</text>`;
    }
    if (cfg.p2) {
      const [x2, y2] = cfg.p2;
      plots += `<circle cx="${toPx(x2)}" cy="${toPy(y2)}" r="5" fill="#e8854a"/>`;
      plots += `<text x="${toPx(x2) + 8}" y="${toPy(y2) - 6}" font-size="11" font-weight="600" fill="#e8854a">(${x2}, ${y2})</text>`;
    }

    let linePath = '';
    if (cfg.line && cfg.p1 && cfg.p2) {
      const [x1, y1] = cfg.p1;
      const [x2, y2] = cfg.p2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      if (dx !== 0) {
        const m = dy / dx;
        const b = y1 - m * x1;
        const xStart = min;
        const yStart = m * xStart + b;
        const xEnd = max;
        const yEnd = m * xEnd + b;
        linePath = `<line x1="${toPx(xStart)}" y1="${toPy(yStart)}" x2="${toPx(xEnd)}" y2="${toPy(yEnd)}" stroke="#5ba4a4" stroke-width="2.5"/>`;
      }
    }

    return `
    <div class="coord-grid-container" style="margin:16px 0;text-align:center;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="background:#faf9f7;border:1px solid #e0dbd2;border-radius:8px;box-shadow:var(--shadow);">
        ${gridLines}
        <line x1="${pad}" y1="${originY}" x2="${size - pad}" y2="${originY}" stroke="#1b2a4a" stroke-width="2"/>
        <line x1="${originX}" y1="${size - pad}" x2="${originX}" y2="${pad}" stroke="#1b2a4a" stroke-width="2"/>
        <text x="${size - pad + 12}" y="${originY + 4}" font-size="12" font-weight="700" fill="#1b2a4a">x</text>
        <text x="${originX}" y="${pad - 8}" font-size="12" font-weight="700" fill="#1b2a4a" text-anchor="middle">y</text>
        ${labels}
        ${linePath}
        ${plots}
      </svg>
    </div>`;
  }

  function cleanStepLabel(label) {
    if (!label) return '';
    return label
      .replace(/\[\d+(\.\d+)?\s*points?\]\s*—\s*/gi, '')
      .replace(/\[\d+(\.\d+)?\s*point\]\s*—\s*/gi, '')
      .replace(/—\s*/g, ': ')
      .trim();
  }

  function formatAnswerMath(str) {
    if (!str) return '';
    const s = String(str).trim();
    if (s.includes('$')) return s;
    if (s.length > 25 && !/[\\=]/.test(s)) return escapeHTML(s);
    return `$${s}$`;
  }

  function renderFRQQuestion(q, answered, qi, tileNum) {
    const progress = state.tileProgress[tileNum] || {};
    const isRevealed = !!(progress.revealed && progress.revealed[qi]);
    const isGraded = answered != null && answered.selfGrade != null;
    const isCorrect = isGraded && answered.selfGrade === 'correct';
    const isWrong = isGraded && answered.selfGrade === 'wrong';

    let visualToolHTML = '';
    if (q.hasNumberLine && q.numberLineConfig) {
      visualToolHTML = renderNumberLineSVG(q.numberLineConfig);
    }
    if (q.hasCoordGrid && q.coordConfig) {
      visualToolHTML = renderCoordGridSVG(q.coordConfig);
    }

    // Hidden vs Revealed Section
    let revealSectionHTML = '';
    if (!isRevealed) {
      revealSectionHTML = `
      <div class="frq-reveal-container">
        <button class="btn btn-reveal-solution" id="frq-reveal-btn" data-qi="${qi}" tabindex="0">
          <span class="reveal-btn-icon">👁️</span> Show Answer & Model Solution
        </button>
        <p class="frq-reveal-note">Solve the question on paper first, then reveal the answer to grade your work.</p>
      </div>`;
    } else {
      const answersListHTML = q.fields ? q.fields.map(f => `
        <div class="frq-answer-item">
          <div class="frq-step-title">${cleanStepLabel(f.label)}</div>
          <div class="frq-step-val">${formatAnswerMath(f.correctDisplay || f.correct)}</div>
        </div>
      `).join('') : '';

      revealSectionHTML = `
      <div class="frq-solution-revealed" id="frq-solution-revealed">
        <div class="frq-solution-header">
          <span class="solution-header-badge">🎯 Correct Answer & Model Solution</span>
        </div>

        ${answersListHTML ? `
          <div class="frq-answers-card">
            <h4 class="frq-answers-heading">Final Answers:</h4>
            <div class="frq-answers-grid">${answersListHTML}</div>
          </div>
        ` : ''}

        ${q.modelSolution ? `
          <div class="frq-steps-card">
            <h4 class="frq-steps-heading">Step-by-Step Solution:</h4>
            <div class="frq-steps-content">${q.modelSolution}</div>
          </div>
        ` : ''}

        ${q.explanation ? `
          <div class="frq-explanation-card">
            <h4 class="frq-explanation-heading">Explanation & Notes:</h4>
            <div class="frq-explanation-content">${q.explanation}</div>
          </div>
        ` : ''}

        <div class="frq-self-grade-container">
          <div class="frq-self-grade-prompt">
            <h3 class="self-grade-heading">Did you solve this question correctly?</h3>
            <p class="self-grade-caption">Compare your steps with the solution above and tap one of the buttons below to grade yourself:</p>
          </div>

          <div class="frq-grade-buttons">
            <button class="self-grade-btn grade-btn-correct ${isCorrect ? 'selected' : ''}" id="grade-correct-btn" data-qi="${qi}" tabindex="0" aria-label="I solved it correctly">
              <span class="grade-symbol">✓</span>
              <span class="grade-btn-text">I solved it correctly</span>
              <span class="grade-points-tag">+1.0 pt</span>
            </button>

            <button class="self-grade-btn grade-btn-wrong ${isWrong ? 'selected' : ''}" id="grade-wrong-btn" data-qi="${qi}" tabindex="0" aria-label="I got it wrong">
              <span class="grade-symbol">✗</span>
              <span class="grade-btn-text">I got it wrong</span>
              <span class="grade-points-tag">0.0 pts</span>
            </button>
          </div>

          ${isGraded ? `
            <div class="grade-confirmation ${isCorrect ? 'conf-correct' : 'conf-wrong'}">
              <span class="conf-icon">${isCorrect ? '✓' : '✗'}</span>
              <span class="conf-text">
                ${isCorrect 
                  ? 'Self-assessment saved: <strong>Correct (1.0 / 1.0 pt)</strong>. Click <strong>Next →</strong> below to proceed.' 
                  : 'Self-assessment saved: <strong>Incorrect (0.0 / 1.0 pt)</strong>. Review the steps above, then click <strong>Next →</strong> to proceed.'}
              </span>
            </div>
          ` : `
            <div class="grade-instruction-note">
              👉 Tap <strong>"I solved it correctly"</strong> (Green) or <strong>"I got it wrong"</strong> (Red) to record your score and unlock the Next button.
            </div>
          `}
        </div>
      </div>`;
    }

    return `<div class="frq-fields">${visualToolHTML}${revealSectionHTML}</div>`;
  }

  function renderHints(q, qi) {
    if (!q.hints || q.hints.length === 0) return '';
    const key = `hints_${state.currentTile}_${qi}`;
    const revealed = state[key] || 0;

    let html = '<div class="hints-section">';
    for (let i = 0; i < q.hints.length; i++) {
      if (i <= revealed) {
        html += `<button class="hint-btn ${i < revealed ? 'active' : ''}" data-hint="${i}" data-qi="${qi}">
          Hint ${i + 1}
        </button>`;
      }
    }
    // Show currently revealed hint content
    if (revealed > 0) {
      html += `<div class="hint-content">${q.hints[revealed - 1]}</div>`;
    }
    html += '</div>';
    return html;
  }

  function renderExplanation(q) {
    if (!q.explanation) return '';
    return `<div class="explanation-box"><h4>Explanation</h4>${q.explanation}</div>`;
  }

  function bindPractice() {
    const backBtn = document.getElementById('back-to-list');
    const backErrBtn = document.getElementById('back-to-list-err');
    if (backBtn) backBtn.addEventListener('click', () => {
      state.currentScreen = 'list';
      render();
    });
    if (backErrBtn) backErrBtn.addEventListener('click', () => {
      state.currentScreen = 'list';
      render();
    });

    // Calculator
    const calcBtn = document.getElementById('open-calc');
    if (calcBtn) calcBtn.addEventListener('click', () => Calculator.toggle());
    document.getElementById('close-calc').addEventListener('click', () => Calculator.toggle());

    // MCQ options
    document.querySelectorAll('.mcq-option:not(.locked)').forEach(opt => {
      opt.addEventListener('click', () => {
        const qi = parseInt(opt.dataset.qi);
        const oi = parseInt(opt.dataset.oi);
        handleMCQAnswer(qi, oi);
      });
    });

    // FRQ Reveal Answer button
    const revealBtn = document.getElementById('frq-reveal-btn');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        const tileNum = state.currentTile;
        const qi = state.currentQuestionIndex;
        const progress = state.tileProgress[tileNum];
        if (!progress.revealed) progress.revealed = {};
        progress.revealed[qi] = true;
        saveState();
        render();
        setTimeout(() => {
          const el = document.getElementById('frq-solution-revealed');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 60);
      });
    }

    // FRQ Self-Grade Green (Correct) button
    const gradeCorrectBtn = document.getElementById('grade-correct-btn');
    if (gradeCorrectBtn) {
      gradeCorrectBtn.addEventListener('click', () => {
        const tileNum = state.currentTile;
        const qi = state.currentQuestionIndex;
        const progress = state.tileProgress[tileNum];
        progress.answers[qi] = { selfGrade: 'correct', pointsEarned: 1, pointsPossible: 1 };
        saveState();
        render();
      });
    }

    // FRQ Self-Grade Red (Wrong) button
    const gradeWrongBtn = document.getElementById('grade-wrong-btn');
    if (gradeWrongBtn) {
      gradeWrongBtn.addEventListener('click', () => {
        const tileNum = state.currentTile;
        const qi = state.currentQuestionIndex;
        const progress = state.tileProgress[tileNum];
        progress.answers[qi] = { selfGrade: 'wrong', pointsEarned: 0, pointsPossible: 1 };
        saveState();
        render();
      });
    }

    // Hints
    document.querySelectorAll('.hint-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const hintIdx = parseInt(btn.dataset.hint);
        const qi = parseInt(btn.dataset.qi);
        const key = `hints_${state.currentTile}_${qi}`;
        const current = state[key] || 0;
        if (hintIdx === current && current < 3) {
          state[key] = current + 1;
          render();
        } else if (hintIdx < current) {
          state[key] = hintIdx + 1;
          render();
        }
      });
    });

    // Navigation
    const prevBtn = document.getElementById('prev-q');
    const nextBtn = document.getElementById('next-q');
    const finishBtn = document.getElementById('finish-set');

    if (prevBtn) prevBtn.addEventListener('click', () => {
      state.currentQuestionIndex = Math.max(0, state.currentQuestionIndex - 1);
      render();
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      state.currentQuestionIndex++;
      render();
    });
    if (finishBtn) finishBtn.addEventListener('click', () => finishSet());
    document.getElementById('submit-early')?.addEventListener('click', () => finishSet());
  }

  function handleMCQAnswer(qi, oi) {
    const progress = state.tileProgress[state.currentTile];
    if (progress.answers[qi] != null) return; // Already answered
    progress.answers[qi] = oi;
    saveState();
    render();
  }

  function finishSet() {
    const tileNum = state.currentTile;
    const info = getTileInfo(tileNum);
    const questions = generateQuestions(tileNum, state.currentSeed);
    const progress = state.tileProgress[tileNum];

    // Calculate score: 1 point per answered question (a set submitted early
    // is marked out of the questions the student actually answered)
    let totalScore = 0;
    const totalPossible = countAnswered(progress);
    progress.setSize = questions.length; // 12 for MCQ, 5 for FRQ

    questions.forEach((q, i) => {
      const ans = progress.answers[i];
      if (ans == null) return;
      if (info.type === 'mcq') {
        // MCQ: 1 point if first answer is correct
        if (q.options && q.options[ans] && q.options[ans].correct) totalScore += 1;
      } else {
        // FRQ: use pointsEarned from selfGrade (1 for correct, 0 for wrong)
        if (ans && ans.pointsEarned != null) totalScore += ans.pointsEarned;
      }
    });

    progress.score = totalScore;
    progress.total = totalPossible;
    progress.completed = true;

    // Record attempt in persistent tracker
    const attemptNum = Tracker.recordAttempt(
      state.studentName,
      tileNum,
      totalScore,
      totalPossible,
      info.type
    );
    progress.attemptNumber = attemptNum;

    // Check lesson mastery
    const lessons = getTileLessons(tileNum);
    let masteryTriggered = false;
    
    for (const lesson of lessons) {
      if (isLessonComplete(lesson)) {
        const ls = getLessonScore(lesson);
        const scorePct = ls.total > 0 ? Math.round((ls.score / ls.total) * 100) : 0;
        const mastered = ls.total > 0 && (ls.score / ls.total) >= CONFIG.MASTERY_THRESHOLD;

        if (mastered) {
          Tracker.recordCertificate(state.studentName, lesson, scorePct, attemptNum);
          if (!state.certificates.find(c => c.lesson === lesson)) {
            state.certificates.push({
              lesson,
              score: ls.score,
              total: ls.total,
              scorePct,
              attemptNumber: attemptNum,
              date: new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
            });
          }
          state.masteryContext = { lesson, scorePct, attemptNumber: attemptNum, mastered: true };
          masteryTriggered = true;
        } else {
          state.masteryContext = { lesson, scorePct, attemptNumber: attemptNum, mastered: false, target: Math.round(CONFIG.MASTERY_THRESHOLD * 100) };
          masteryTriggered = true;
        }
      }
    }

    state.currentScreen = masteryTriggered ? 'mastery' : 'results';
    saveState();
    render();
  }

  // ── RESULTS ────────────────────────────────────────
  function renderResults() {
    const tileNum = state.currentTile;
    const progress = state.tileProgress[tileNum];
    const info = getTileInfo(tileNum);
    const questions = generateQuestions(tileNum, state.currentSeed);
    const score = progress.score;
    const total = progress.total;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    
    let msg = pct >= 90 ? 'Excellent work! 🌟' : pct >= 70 ? 'Great job! Keep it up! 💪' : pct >= 50 ? 'Good effort! Review the explanations.' : 'Keep practising — you\'ll get there! 📚';

    let reviewHTML = questions.map((q, i) => {
      const ans = progress.answers[i];
      if (!isAnswered(ans)) return ''; // not reached before submitting early
      let mark = 'wrong';
      let markText = '✗ 0/1';
      
      if (info.type === 'mcq') {
        if (ans != null && q.options && q.options[ans] && q.options[ans].correct) {
          mark = 'correct'; markText = '✓ Correct (1/1)';
        } else {
          markText = '✗ Incorrect (0/1)';
        }
      } else {
        if (ans && ans.pointsEarned != null) {
          if (ans.pointsEarned >= 1) { 
            mark = 'correct'; 
            markText = '✓ Correct (1/1)'; 
          } else { 
            mark = 'wrong'; 
            markText = '✗ Incorrect (0/1)'; 
          }
        }
      }

      return `<div class="review-item">
        <div class="review-q-header">
          <span class="review-q-num">Question ${i + 1}</span>
          <span class="review-mark ${mark}">${markText}</span>
        </div>
        <div class="question-text" style="font-size:0.95rem;">${q.text || ''}</div>
        ${info.type === 'frq' && q.fields ? `
          <div class="review-answers-box" style="margin-top:10px;padding:12px;background:#faf8f3;border-radius:6px;border-left:3px solid var(--teal);">
            <strong style="color:var(--navy);font-size:0.9rem;">Expected Answers:</strong>
            <ul style="margin:6px 0 0 18px;font-size:0.9rem;color:var(--gray-700);">
              ${q.fields.map(f => `<li><strong>${cleanStepLabel(f.label)}:</strong> ${formatAnswerMath(f.correctDisplay || f.correct)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${q.modelSolution ? `<div class="explanation-box" style="margin-top:8px;"><h4>Model Solution</h4>${q.modelSolution}</div>` : ''}
        ${q.explanation ? `<div class="explanation-box" style="margin-top:8px;"><h4>Explanation</h4>${q.explanation}</div>` : ''}
      </div>`;
    }).join('');

    return `
    <div class="results-screen">
      <header class="section-header">
        <button class="back-btn" id="back-to-list" aria-label="Back to list">←</button>
        <h2 class="section-title">Results · Q${tileNum}</h2>
      </header>
      <div class="results-card">
        <div class="results-score">
          ${formatScore(score)} / ${total}
          <div style="margin-top:6px;"><small class="attempt-badge">Attempt #${progress.attemptNumber || 1}</small></div>
        </div>
        <div class="results-pct">${pct}%</div>
        <div class="results-msg">${msg}</div>
        ${total < questions.length ? `<p class="results-early-note">Submitted early: ${total} of ${questions.length} questions answered.</p>` : ''}
        <div class="results-actions">
          <button class="btn btn-accent" id="retry-btn">🔄 Retry with new numbers</button>
          <button class="btn btn-secondary" id="print-btn">🖨 Print / Save as PDF</button>
          <button class="btn btn-primary" id="back-list-btn">← Back to list</button>
        </div>
      </div>
      <div class="results-review">${reviewHTML}</div>
    </div>`;
  }

  function bindResults() {
    document.getElementById('back-to-list')?.addEventListener('click', () => {
      state.currentScreen = 'list';
      render();
    });
    document.getElementById('retry-btn')?.addEventListener('click', () => {
      startPractice(state.currentTile, Date.now());
    });
    document.getElementById('print-btn')?.addEventListener('click', () => window.print());
    document.getElementById('back-list-btn')?.addEventListener('click', () => {
      state.currentScreen = 'list';
      render();
    });
  }

  // ── MASTERY ────────────────────────────────────────
  function renderMastery() {
    const ctx = state.masteryContext;
    if (!ctx) { state.currentScreen = 'results'; render(); return ''; }

    if (ctx.mastered) {
      // Show certificate
      setTimeout(() => Confetti.launch(3000), 300);
      const certData = {
        studentName: state.studentName,
        lessonNumber: ctx.lesson,
        scorePct: ctx.scorePct,
        teacherName: CONFIG.TEACHER_NAME,
        schoolName: CONFIG.SCHOOL_NAME,
      };
      return `
      <div class="mastery-screen">
        <header class="section-header">
          <button class="back-btn" id="back-to-results" aria-label="Back">←</button>
          <h2 class="section-title">🎉 Lesson ${ctx.lesson} Mastered!</h2>
        </header>
        <div class="mastery-msg">
          <h3>Congratulations! 🌟</h3>
          <p>You mastered Lesson ${ctx.lesson} with a score of ${ctx.scorePct}%!</p>
          <div class="results-actions">
            <button class="btn btn-gold" id="view-cert">🏅 View Certificate</button>
            <button class="btn btn-primary" id="back-list-btn">← Back to list</button>
          </div>
        </div>
      </div>`;
    } else {
      const lessonTiles = LESSON_GROUPS[ctx.lesson] || [];
      const retryBtns = lessonTiles.map(t => {
        const p = state.tileProgress[t];
        const tScore = p ? `${formatScore(p.score)}/${p.total}` : 'Not attempted';
        return `<button class="btn btn-accent retry-tile-btn" data-tile="${t}">Retry Q${t} (${tScore})</button>`;
      }).join('');

      return `
      <div class="mastery-screen">
        <header class="section-header">
          <button class="back-btn" id="back-to-results" aria-label="Back">←</button>
          <h2 class="section-title">Lesson ${ctx.lesson}</h2>
        </header>
        <div class="mastery-msg">
          <h3>Almost there! 💪</h3>
          <p>Your lesson score is ${ctx.scorePct}%. You need more than ${ctx.target}% to earn mastery.</p>
          <p>Try these sets again to improve:</p>
          <div class="mastery-retry-btns">${retryBtns}</div>
          <div style="margin-top:16px;">
            <button class="btn btn-primary" id="back-list-btn">← Back to list</button>
          </div>
        </div>
      </div>`;
    }
  }

  function bindMastery() {
    document.getElementById('back-to-results')?.addEventListener('click', () => {
      state.currentScreen = 'results';
      render();
    });
    document.getElementById('view-cert')?.addEventListener('click', () => {
      const ctx = state.masteryContext;
      if (ctx) {
        state.currentScreen = 'certificate-view';
        render();
      }
    });
    document.getElementById('back-list-btn')?.addEventListener('click', () => {
      state.currentScreen = 'list';
      render();
    });
    document.querySelectorAll('.retry-tile-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        startPractice(parseInt(btn.dataset.tile), Date.now());
      });
    });
  }

  // ── CERTIFICATE VIEW ──────────────────────────────
  function renderCertificateView() {
    const ctx = state.masteryContext;
    if (!ctx) { state.currentScreen = 'list'; render(); return ''; }

    const certData = {
      studentName: state.studentName,
      lessonNumber: ctx.lesson,
      scorePct: ctx.scorePct,
      teacherName: CONFIG.TEACHER_NAME,
      schoolName: CONFIG.SCHOOL_NAME,
    };

    return `
    <div class="certificate-screen">
      <header class="section-header">
        <button class="back-btn" id="back-to-mastery" aria-label="Back">←</button>
        <h2 class="section-title">Certificate · Lesson ${ctx.lesson}</h2>
        <div class="results-actions">
          <button class="btn btn-secondary" id="cert-pdf">📄 Download PDF</button>
          <button class="btn btn-secondary" id="cert-png">🖼 Download PNG</button>
          <button class="btn btn-secondary" id="cert-print">🖨 Print</button>
          <button class="btn btn-primary" id="back-list-btn">← Back to list</button>
        </div>
      </header>
      <div style="overflow-x:auto;padding:24px 0;">
        ${CertificateGen.generateCertificateHTML(certData)}
      </div>
    </div>`;
  }

  function bindCertificateView() {
    document.getElementById('back-to-mastery')?.addEventListener('click', () => {
      state.currentScreen = 'mastery';
      render();
    });
    document.getElementById('cert-pdf')?.addEventListener('click', () => {
      const lesson = state.masteryContext?.lesson;
      if (lesson) CertificateGen.downloadPDF(lesson);
    });
    document.getElementById('cert-png')?.addEventListener('click', () => {
      const lesson = state.masteryContext?.lesson;
      if (lesson) CertificateGen.downloadPNG(lesson);
    });
    document.getElementById('cert-print')?.addEventListener('click', () => {
      const lesson = state.masteryContext?.lesson;
      if (lesson) CertificateGen.printCert(lesson);
    });
    document.getElementById('back-list-btn')?.addEventListener('click', () => {
      state.currentScreen = 'list';
      render();
    });
  }

  // ── CERTIFICATES LIST ─────────────────────────────
  function renderCertificates() {
    const certs = state.certificates;
    let list = '';
    if (certs.length === 0) {
      list = '<p style="text-align:center;color:var(--gray-400);padding:40px;">No certificates earned yet. Master a lesson to earn one!</p>';
    } else {
      list = certs.map(c => `
        <div class="cert-item">
          <div class="cert-item-info">
            <h4>🏅 Lesson ${c.lesson} Mastered</h4>
            <p>Score: ${c.scorePct}% · <small class="attempt-badge">Attempt #${c.attemptNumber || 1}</small> · ${c.date}</p>
          </div>
          <div class="cert-item-actions">
            <button class="btn btn-secondary btn-sm cert-view-btn" data-lesson="${c.lesson}" data-score="${c.scorePct}">View</button>
            <button class="btn btn-secondary btn-sm cert-pdf-btn" data-lesson="${c.lesson}">PDF</button>
            <button class="btn btn-secondary btn-sm cert-png-btn" data-lesson="${c.lesson}" data-score="${c.scorePct}">PNG</button>
            <button class="btn btn-secondary btn-sm cert-print-btn" data-lesson="${c.lesson}">Print</button>
          </div>
        </div>
      `).join('');
    }

    return `
    <div class="certificates-screen">
      <header class="section-header">
        <button class="back-btn" id="back-to-list" aria-label="Back">←</button>
        <h2 class="section-title">Certificates</h2>
      </header>
      <div class="cert-list">${list}</div>
    </div>`;
  }

  function bindCertificates() {
    document.getElementById('back-to-list')?.addEventListener('click', () => {
      state.currentScreen = 'list';
      render();
    });
    document.querySelectorAll('.cert-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lesson = btn.dataset.lesson;
        const scorePct = parseInt(btn.dataset.score);
        state.masteryContext = { lesson, scorePct, mastered: true };
        state.currentScreen = 'certificate-view';
        render();
      });
    });
    document.querySelectorAll('.cert-pdf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lesson = btn.dataset.lesson;
        printCertWithContainer(lesson);
      });
    });
    document.querySelectorAll('.cert-png-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const lesson = btn.dataset.lesson;
        const scorePct = parseInt(btn.dataset.score);
        const certData = {
          studentName: state.studentName,
          lessonNumber: lesson,
          scorePct,
          teacherName: CONFIG.TEACHER_NAME,
          schoolName: CONFIG.SCHOOL_NAME,
        };
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.innerHTML = CertificateGen.generateCertificateHTML(certData);
        document.body.appendChild(container);
        await CertificateGen.downloadPNG(lesson);
        container.remove();
      });
    });
    document.querySelectorAll('.cert-print-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lesson = btn.dataset.lesson;
        printCertWithContainer(lesson);
      });
    });
  }

  function printCertWithContainer(lesson) {
    const cert = state.certificates.find(c => c.lesson === lesson);
    const scorePct = cert ? cert.scorePct : 100;
    const certData = {
      studentName: state.studentName,
      lessonNumber: lesson,
      scorePct,
      teacherName: CONFIG.TEACHER_NAME,
      schoolName: CONFIG.SCHOOL_NAME,
    };
    const container = document.createElement('div');
    container.innerHTML = CertificateGen.generateCertificateHTML(certData);
    document.body.appendChild(container);
    CertificateGen.printCert(lesson);
    setTimeout(() => container.remove(), 1000);
  }

  // ── TEACHER DASHBOARD ────────────────────────────────
  function renderTeacherDashboard() {
    const data = Tracker.getData();
    const students = Object.values(data.students || {});
    
    const totalStudents = students.length;
    let totalAttempts = 0;
    let totalCertificates = 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    let activeToday = 0;

    students.forEach(s => {
      totalAttempts += (s.history ? s.history.length : 0);
      totalCertificates += (s.certificates ? s.certificates.length : 0);
      if (s.lastSeen && s.lastSeen.startsWith(todayStr)) activeToday++;
    });

    let studentsHTML = '';
    if (students.length === 0) {
      studentsHTML = `
      <div class="teacher-empty-card">
        <span class="empty-icon">👥</span>
        <h3>No student activity recorded yet</h3>
        <p>When students access the website and complete practice sets, their access timestamps, questions, scores, and certificates will appear here grouped under each student's name.</p>
      </div>`;
    } else {
      studentsHTML = students.map((s, idx) => {
        const historyCount = s.history ? s.history.length : 0;
        const certCount = s.certificates ? s.certificates.length : 0;

        const attemptsHTML = (s.history && s.history.length > 0) ? `
          <div class="teacher-attempts-grid">
            ${s.history.map(h => {
              const info = getTileInfo(h.tile);
              return `
              <div class="teacher-attempt-chip">
                <span class="chip-q">Q${h.tile} (${h.type.toUpperCase()})</span>
                <span class="chip-score">${h.score}/${h.total} (${h.pct}%)</span>
                <small class="attempt-badge">Attempt #${h.attemptNumber}</small>
                <span class="chip-time">${h.date}</span>
              </div>`;
            }).join('')}
          </div>
        ` : '<p class="teacher-subtext">No question sets completed yet.</p>';

        const certsHTML = (s.certificates && s.certificates.length > 0) ? `
          <div class="teacher-certs-row">
            ${s.certificates.map(c => `
              <div class="teacher-cert-badge">
                <span class="cert-star">★</span>
                <span><strong>Lesson ${c.lesson}</strong> (${c.scorePct}%)</span>
                <small class="attempt-badge">Attempt #${c.attemptNumber || 1}</small>
                <span class="cert-date">${c.date}</span>
                <button class="btn btn-secondary btn-sm teacher-view-cert" data-student="${escapeAttr(s.name)}" data-lesson="${c.lesson}" data-score="${c.scorePct}">View</button>
              </div>
            `).join('')}
          </div>
        ` : '<p class="teacher-subtext">No certificates earned yet.</p>';

        const activityRows = (s.activities || []).map(a => `
          <div class="activity-timeline-item">
            <span class="activity-time">${a.time}</span>
            <span class="activity-text">${escapeHTML(a.text)}</span>
          </div>
        `).join('');

        return `
        <div class="teacher-student-card" data-name="${escapeAttr(s.name.toLowerCase())}">
          <div class="teacher-student-header">
            <div class="student-profile-title">
              <span class="student-idx">#${idx + 1}</span>
              <span class="student-icon">👤</span>
              <div>
                <h3 class="teacher-student-name">${escapeHTML(s.name)}</h3>
                <div class="teacher-meta-row">
                  <span>🕒 First: <strong>${s.firstSeenDisplay || 'N/A'}</strong></span>
                  <span>• Last active: <strong>${s.lastSeenDisplay || 'N/A'}</strong></span>
                  <span>• <strong>${s.visits || 1}</strong> session(s)</span>
                </div>
              </div>
            </div>
            <div class="teacher-summary-badges">
              <span class="summary-badge sets-badge">📝 ${historyCount} sets</span>
              <span class="summary-badge certs-badge">🏅 ${certCount} certs</span>
            </div>
          </div>

          <div class="teacher-student-content">
            <div class="teacher-block">
              <h4 class="teacher-block-heading">Question Sets Attempted:</h4>
              ${attemptsHTML}
            </div>

            <div class="teacher-block">
              <h4 class="teacher-block-heading">Certificates Earned:</h4>
              ${certsHTML}
            </div>

            <details class="teacher-activity-details">
              <summary class="teacher-details-summary">View Full Activity Log (${(s.activities || []).length} events)</summary>
              <div class="activity-timeline-box">${activityRows}</div>
            </details>
          </div>
        </div>`;
      }).join('');
    }

    return `
    <div class="teacher-screen">
      <header class="section-header teacher-navbar">
        <button class="back-btn" id="teacher-exit-btn" aria-label="Exit dashboard">← Exit to Practice</button>
        <div class="teacher-header-center">
          <div class="teacher-title-row">
            <h2 class="section-title">👨‍🏫 Teacher Portal · Mr. Mohamad Turkmani</h2>
            <span class="cloud-status-badge ${isCloudActive ? 'cloud-online' : 'cloud-offline'}" title="${isCloudActive ? 'Live Real-time Cloud Sync is active across all devices' : 'Using Local Browser Storage. Paste Firebase keys in js/config.js to sync across PC and phone'}">
              ${isCloudActive ? '🟢 Live Cloud Sync' : '📱 Local Storage Mode'}
            </span>
          </div>
          <p class="section-subtitle">Zayed Educational Complex – Suhaila · Student Activity & Mastery Tracker</p>
        </div>
        <div class="teacher-top-actions">
          <button class="btn btn-secondary btn-sm" id="teacher-csv-btn">📥 Export CSV</button>
          <button class="btn btn-secondary btn-sm" id="teacher-print-btn">🖨️ Print Report</button>
          <button class="btn btn-danger btn-sm" id="teacher-reset-btn">🗑️ Reset Data</button>
        </div>
      </header>

      <div class="teacher-stats-bar">
        <div class="teacher-stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-data">
            <span class="stat-large-num">${totalStudents}</span>
            <span class="stat-caption">Students Accessed</span>
          </div>
        </div>
        <div class="teacher-stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-data">
            <span class="stat-large-num">${totalAttempts}</span>
            <span class="stat-caption">Practice Sets Finished</span>
          </div>
        </div>
        <div class="teacher-stat-card">
          <div class="stat-icon">🏅</div>
          <div class="stat-data">
            <span class="stat-large-num">${totalCertificates}</span>
            <span class="stat-caption">Certificates Awarded</span>
          </div>
        </div>
        <div class="teacher-stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-data">
            <span class="stat-large-num">${activeToday}</span>
            <span class="stat-caption">Active Today</span>
          </div>
        </div>
      </div>

      <div class="teacher-search-section">
        <input type="text" id="teacher-search-box" placeholder="🔍 Search student name..." class="teacher-search-field">
      </div>

      <div class="teacher-students-container" id="teacher-cards-wrap">
        ${studentsHTML}
      </div>
    </div>`;
  }

  function bindTeacherDashboard() {
    document.getElementById('teacher-exit-btn')?.addEventListener('click', () => {
      state.currentScreen = state.studentName ? 'landing' : 'entry';
      render();
    });

    // Search filter
    const searchBox = document.getElementById('teacher-search-box');
    if (searchBox) {
      searchBox.addEventListener('input', () => {
        const query = searchBox.value.trim().toLowerCase();
        document.querySelectorAll('.teacher-student-card').forEach(card => {
          const name = card.dataset.name || '';
          card.style.display = name.includes(query) ? '' : 'none';
        });
      });
    }

    // Export CSV
    document.getElementById('teacher-csv-btn')?.addEventListener('click', () => {
      const data = Tracker.getData();
      const students = Object.values(data.students || {});
      if (students.length === 0) {
        alert('No student records to export.');
        return;
      }
      let csv = 'Student Name,First Accessed,Last Active,Visits,Completed Sets,Certificates Count,Attempts Details\n';
      students.forEach(s => {
        const setsCount = s.history ? s.history.length : 0;
        const certsCount = s.certificates ? s.certificates.length : 0;
        const details = (s.history || []).map(h => `Q${h.tile}:${h.score}/${h.total}(Att#${h.attemptNumber})`).join('; ');
        csv += `"${(s.name || '').replace(/"/g, '""')}","${s.firstSeenDisplay || ''}","${s.lastSeenDisplay || ''}",${s.visits || 1},${setsCount},${certsCount},"${details}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EOT_Grade9_Math_Tracker_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    // Print
    document.getElementById('teacher-print-btn')?.addEventListener('click', () => window.print());

    // Reset Data
    document.getElementById('teacher-reset-btn')?.addEventListener('click', () => {
      const conf = prompt('⚠️ Type RESET to clear all student activity records:');
      if (conf === 'RESET') {
        Tracker.clearAll();
        render();
      }
    });

    // View Certificate from teacher dashboard
    document.querySelectorAll('.teacher-view-cert').forEach(btn => {
      btn.addEventListener('click', () => {
        const studentName = btn.dataset.student;
        const lesson = btn.dataset.lesson;
        const scorePct = parseInt(btn.dataset.score);
        state.studentName = studentName;
        state.masteryContext = { lesson, scorePct, mastered: true };
        state.currentScreen = 'certificate-view';
        render();
      });
    });
  }

  // ── Utility ────────────────────────────────────────
  function formatScore(n) {
    if (n == null) return '0';
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  function escapeHTML(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(s) {
    return (s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Init ───────────────────────────────────────────
  function init() {
    initFirebaseSync();
    render();
    Calculator.init();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const calcModal = document.getElementById('calc-modal');
        if (calcModal && !calcModal.classList.contains('hidden')) {
          calcModal.classList.add('hidden');
        }
      }
    });
  }

  // Wait for DOM + KaTeX
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
