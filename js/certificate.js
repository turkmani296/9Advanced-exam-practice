// ── Certificate Generator ──────────────────────────────────
const CertificateGen = (() => {
  
  function generateCertificateHTML(data) {
    // data: { studentName, lessonNumber, scorePct, date, teacherName, schoolName }
    const dateStr = data.date || new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return `
    <div class="certificate-page" id="cert-${data.lessonNumber}">
      <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" viewBox="0 0 1123 794" preserveAspectRatio="none">
        <!-- Outer border -->
        <rect x="16" y="16" width="1091" height="762" rx="8" fill="none" stroke="#12343b" stroke-width="2.5"/>
        <!-- Inner border -->
        <rect x="24" y="24" width="1075" height="746" rx="6" fill="none" stroke="#d4a843" stroke-width="1.5"/>
        <!-- Second gold line -->
        <rect x="30" y="30" width="1063" height="734" rx="4" fill="none" stroke="#d4a843" stroke-width="0.5"/>
        <!-- Corner ornaments -->
        ${cornerOrnament(40, 40)}
        ${cornerOrnament(1083, 40, true, false)}
        ${cornerOrnament(40, 754, false, true)}
        ${cornerOrnament(1083, 754, true, true)}
      </svg>
      
      <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;padding:50px 80px 40px;box-sizing:border-box;">
        <!-- Logos -->
        <div style="display:flex;align-items:center;justify-content:space-between;width:100%;margin-bottom:16px;">
          <img src="assets/school-logo.png" style="height:40px;object-fit:contain;" alt="School Logo">
          <img src="assets/math-logo-trimmed.png" style="height:56px;object-fit:contain;" alt="Math Logo">
        </div>
        
        <!-- Title -->
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:32px;color:#12343b;letter-spacing:3px;margin:12px 0 4px;text-transform:uppercase;">
          Certificate of Mastery
        </h1>
        <div style="width:180px;height:2px;background:linear-gradient(90deg,transparent,#d4a843,transparent);margin-bottom:20px;"></div>
        
        <!-- Presented to -->
        <p style="font-family:Georgia,serif;font-size:15px;color:#5b6f74;margin-bottom:8px;">This certificate is proudly presented to</p>
        
        <!-- Student name -->
        <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:36px;color:#12343b;margin-bottom:4px;font-style:italic;">
          ${escapeHTML(data.studentName)}
        </h2>
        <div style="width:300px;height:1px;background:#d4a843;margin-bottom:16px;"></div>
        
        <!-- Lesson -->
        <p style="font-size:14px;color:#5b6f74;margin-bottom:4px;">for mastering</p>
        <h3 style="font-family:Georgia,serif;font-size:26px;color:#12343b;margin-bottom:8px;">
          Lesson ${escapeHTML(data.lessonNumber)}
        </h3>
        <p style="font-size:13px;color:#9a9488;margin-bottom:6px;">Grade 9 Advanced Mathematics · Reveal Integrated 1</p>
        
        <!-- Score -->
        <div style="background:#f5f0e8;border-radius:8px;padding:6px 20px;margin-bottom:16px;">
          <span style="font-size:18px;font-weight:700;color:#12343b;">${data.scorePct}%</span>
        </div>

        <!-- Seal/Rosette -->
        <div style="position:absolute;right:100px;top:50%;transform:translateY(-50%);">
          ${sealSVG()}
        </div>
        
        <!-- Bottom section -->
        <div style="margin-top:auto;width:100%;display:flex;align-items:flex-end;justify-content:space-between;">
          <div style="text-align:center;flex:1;">
            <p style="font-size:12px;color:#9a9488;margin-bottom:4px;">${dateStr}</p>
            <div style="width:200px;border-top:1px solid #12343b;margin:0 auto 4px;"></div>
            <p style="font-size:12px;color:#5b6f74;">Date</p>
          </div>
          <div style="text-align:center;flex:1;">
            <p style="font-size:14px;color:#12343b;font-weight:600;margin-bottom:4px;">${escapeHTML(data.teacherName)}</p>
            <div style="width:200px;border-top:1px solid #12343b;margin:0 auto 4px;"></div>
            <p style="font-size:12px;color:#5b6f74;">${escapeHTML(data.schoolName)}</p>
          </div>
          <div style="flex:0 0 auto;padding-left:16px;">
            <div style="background:white;border-radius:8px;padding:4px 8px;box-shadow:0 1px 4px rgba(0,0,0,0.1);">
              <img src="assets/banner.jpg" style="height:32px;object-fit:contain;" alt="Banner">
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function cornerOrnament(cx, cy, flipX = false, flipY = false) {
    const sx = flipX ? -1 : 1;
    const sy = flipY ? -1 : 1;
    return `<g transform="translate(${cx},${cy}) scale(${sx},${sy})">
      <path d="M0,0 L20,0 M0,0 L0,20" stroke="#d4a843" stroke-width="2" fill="none"/>
      <circle cx="0" cy="0" r="3" fill="#d4a843"/>
      <path d="M4,4 L14,4 M4,4 L4,14" stroke="#12343b" stroke-width="0.8" fill="none"/>
    </g>`;
  }

  function sealSVG() {
    const r = 45;
    let points = '';
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI * 2) / 24;
      const radius = i % 2 === 0 ? r : r - 8;
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      points += (i === 0 ? 'M' : 'L') + x + ',' + y;
    }
    points += 'Z';
    return `<svg width="100" height="100" viewBox="0 0 100 100">
      <path d="${points}" fill="none" stroke="#d4a843" stroke-width="2"/>
      <circle cx="50" cy="50" r="32" fill="none" stroke="#12343b" stroke-width="1"/>
      <circle cx="50" cy="50" r="28" fill="none" stroke="#d4a843" stroke-width="0.5"/>
      <text x="50" y="46" text-anchor="middle" font-size="10" fill="#12343b" font-family="Georgia,serif">★</text>
      <text x="50" y="58" text-anchor="middle" font-size="7" fill="#12343b" font-family="Georgia,serif" font-weight="700">MASTERY</text>
    </svg>`;
  }

  function escapeHTML(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  async function downloadPNG(lessonNumber) {
    const el = document.getElementById('cert-' + lessonNumber);
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#fffff8' });
      const link = document.createElement('a');
      link.download = `Certificate_Lesson_${lessonNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      // Fallback: print
      window.print();
    }
  }

  async function downloadPDF(lessonNumber) {
    // Use print as fallback for PDF generation
    printCert(lessonNumber);
  }

  function printCert(lessonNumber) {
    const el = document.getElementById('cert-' + lessonNumber);
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Certificate</title>
      <style>
        body { margin:0; padding:0; background:#fffff8; }
        @page { size: A4 landscape; margin:0; }
        .certificate-page { width:297mm; height:210mm; }
        img { max-width:100%; }
      </style></head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  }

  return { generateCertificateHTML, downloadPNG, downloadPDF, printCert };
})();

// ── Confetti ──────────────────────────────────────────
const Confetti = (() => {
  let particles = [];
  let animId = null;

  function launch(duration = 3000) {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#d4a843', '#d9783a', '#1f7a85', '#12343b', '#3a9a5c'];
    particles = [];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    const start = Date.now();
    function animate() {
      const elapsed = Date.now() - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (elapsed > duration) {
        // Fade out
        particles.forEach(p => { p.opacity -= 0.02; });
        if (particles[0].opacity <= 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
        }
      }
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.vy += 0.05;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      animId = requestAnimationFrame(animate);
    }
    animate();
  }

  return { launch };
})();
