/* ============================================================
   ANDROID DEV PORTFOLIO — data-driven, JSON-fed
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Load data ---------- */
  if (!window.DATA) {
    document.body.innerHTML = '<p style="color:#3ddc84;padding:40px;font-family:monospace">Failed to load data.js</p>';
    return;
  }
  const data = window.DATA;

  /* ============================================================
     SVG ICONS (inline, no external deps)
     ============================================================ */
  const icons = {
    github: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`,
    linkedin: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.15C0 .51.51 0 1.15 0h13.7C15.49 0 16 .51 16 1.15v13.7c0 .64-.51 1.15-1.15 1.15H1.15C.51 16 0 15.49 0 14.85V1.15zM4.75 13.5V6H2.25v7.5h2.5zM3.5 4.9a1.45 1.45 0 1 0 0-2.9 1.45 1.45 0 0 0 0 2.9zm10 8.6v-4.1c0-2.2-1.17-3.22-2.73-3.22-1.26 0-1.82.69-2.14 1.18V6H6.13v7.5h2.5v-4.15c0-1.1.2-2.16 1.57-2.16 1.34 0 1.36 1.25 1.36 2.23v4.08h2.94z"/></svg>`,
    playstore: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M.93 1.1C.37 1.76.05 2.66.05 3.7v8.6c0 1.04.32 1.94.88 2.6l.08.08L8.6 8.64V7.36L.93 1.1zM9.42 8.56v-1.47l-.65-.58h-.06L1.55.64C1.87.4 2.29.26 2.78.26h-.01l.44.27 6.98 6.23.23.2.07.03-1.07 1.57zM10.42 7.98l1.55-1.37-3.22-2.85.48-.42L10.42 7.98 10.42 7.98zM1.63.91c.31-.24.73-.4 1.26-.4.02 0 .04.01.06.02l4.79 4.02-.68.66L1.62.91zM10.42 7.98v.02l-1.17 1.44.53.47 3.62 3.22c.41-.34.6-.94.59-1.72l.02-4.64c0-.48-.13-.87-.4-1.15l-.55.49-2.62 2.87zM9.93 9.94l-1.32 1.16L.95 15.04l-.07.07c.21.16.47.25.76.25.53 0 1.06-.2 1.45-.58l7.35-6.51-1.51-1.33v0L9.93 9.94z"/></svg>`,
    arrow: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 11L11 3m0 0H4m7 0v7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    play: `<svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 1l8 5-8 5V1z" fill="currentColor"/></svg>`,
    chevUp: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 11l5-5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };

  /* ============================================================
     PLAY STORE CONFIG
     ============================================================ */
  const PLAY_STORE_WORKER = "https://playstore-proxy.sc6293270.workers.dev"; // Cloudflare Worker proxy
  const CACHE_TTL = 3600000; // 1 hour in ms

  function extractAppId(p) {
    if (!p) return null;
    if (p.playStoreAppId) return p.playStoreAppId;
    if (!p.playStoreUrl) return null;
    try {
      const u = new URL(p.playStoreUrl);
      return u.searchParams.get("id") || null;
    } catch { return null; }
  }

  function formatDownloads(n) {
    if (!n) return null;
    const num = typeof n === "string" ? parseInt(n.replace(/[+,]/g, ""), 10) : n;
    if (isNaN(num)) return null;
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B+";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M+";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
    return num + "+";
  }

  /* ---------- SVG star row (proper stars, half-star aware) ---------- */
  let starGradId = 0;
  function starRow(rating) {
    const half = Math.round(rating * 2) / 2;
    let out = `<span class="stars-row" aria-label="${rating.toFixed(1)} out of 5">`;
    for (let i = 1; i <= 5; i++) {
      const f = Math.max(0, Math.min(1, half - (i - 1)));
      const id = "sg" + (starGradId++);
      out += `
        <svg class="star" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
              <stop offset="${f * 100}%" stop-color="currentColor"/>
              <stop offset="${f * 100}%" stop-color="rgba(228,242,233,0.16)"/>
            </linearGradient>
          </defs>
          <path d="M12 2.6l2.75 5.6 6.25.9-4.5 4.4 1.05 6.15L12 16.9l-5.55 2.95 1.05-6.15-4.5-4.4 6.25-.9z" fill="url(#${id})" stroke="rgba(228,242,233,0.28)" stroke-width="0.6"/>
        </svg>`;
    }
    return out + "</span>";
  }

  /* ---------- Animated count-up (premium feel) ---------- */
  function animateCount(el, target, opts) {
    if (!el || isNaN(target)) return;
    const dec = (opts && opts.decimals) || 0;
    const fmt = (opts && opts.format) || ((n) => n.toFixed(dec));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !window.requestAnimationFrame) {
      el.textContent = fmt(target);
      return;
    }
    const dur = 900;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function getCachedPs(appId) {
    try {
      const raw = sessionStorage.getItem("ps2_" + appId);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (Date.now() - d.ts > CACHE_TTL) return null;
      return d.data;
    } catch { return null; }
  }

  function setCachedPs(appId, data) {
    try { sessionStorage.setItem("ps2_" + appId, JSON.stringify({ ts: Date.now(), data })); } catch {}
  }

  async function fetchPlayStoreData(appId) {
    if (!PLAY_STORE_WORKER || !appId) return null;
    const cached = getCachedPs(appId);
    if (cached) return cached;
    try {
      const res = await fetch(PLAY_STORE_WORKER + "?id=" + encodeURIComponent(appId));
      if (!res.ok) return null;
      const d = await res.json();
      const r = parseFloat(d.rating);
      const result = {
        icon: d.logo || null,
        rating: isNaN(r) ? null : r,
        ratingCount: d.noOfUsersRated || d.reviews || null,
        downloads: d.downloadsExact || d.downloads || null,
        screenshots: (d.screenshots || []).slice(0, 6),
      };
      setCachedPs(appId, result);
      return result;
    } catch { return null; }
  }

  /* store fetched Play Store data per project id */
  const psDataMap = {};

  /* ============================================================
     GRADIENT MAP for project thumbnails
     ============================================================ */
  const thumbGradients = {
    1:  "radial-gradient(circle at 30% 20%, rgba(61,220,132,0.28), transparent 60%), radial-gradient(circle at 75% 80%, rgba(45,212,191,0.22), transparent 55%), #0c130f",
    2:  "radial-gradient(circle at 65% 25%, rgba(45,212,191,0.28), transparent 55%), radial-gradient(circle at 25% 85%, rgba(34,197,94,0.24), transparent 55%), #0c130f",
    3:  "radial-gradient(circle at 40% 30%, rgba(34,197,94,0.26), transparent 55%), radial-gradient(circle at 80% 70%, rgba(61,220,132,0.2), transparent 55%), #0c130f",
    4:  "radial-gradient(circle at 50% 20%, rgba(102,126,234,0.3), transparent 55%), radial-gradient(circle at 70% 80%, rgba(118,75,162,0.25), transparent 55%), #0c130f",
    5:  "radial-gradient(circle at 30% 60%, rgba(79,172,254,0.28), transparent 55%), radial-gradient(circle at 80% 30%, rgba(0,242,254,0.22), transparent 55%), #0c130f",
    6:  "radial-gradient(circle at 60% 30%, rgba(67,233,123,0.26), transparent 55%), radial-gradient(circle at 30% 70%, rgba(56,249,215,0.22), transparent 55%), #0c130f",
    7:  "radial-gradient(circle at 40% 40%, rgba(250,112,154,0.26), transparent 55%), radial-gradient(circle at 75% 75%, rgba(254,225,64,0.2), transparent 55%), #0c130f",
    8:  "radial-gradient(circle at 55% 25%, rgba(161,140,209,0.28), transparent 55%), radial-gradient(circle at 30% 80%, rgba(251,194,235,0.22), transparent 55%), #0c130f",
    9:  "radial-gradient(circle at 45% 35%, rgba(252,203,144,0.26), transparent 55%), radial-gradient(circle at 70% 70%, rgba(213,126,235,0.22), transparent 55%), #0c130f",
    10: "radial-gradient(circle at 35% 45%, rgba(224,195,252,0.26), transparent 55%), radial-gradient(circle at 75% 65%, rgba(142,197,252,0.22), transparent 55%), #0c130f",
  };

  const categoryLabels = {
    "android": "APP · ANDROID",
    "web": "APP · WEB",
    "open-source": "OPEN SOURCE",
  };

  /* ============================================================
     RENDER: NAV
     ============================================================ */
  function renderNav() {
    const logo = document.getElementById("nav-logo");
    const navLinks = document.getElementById("nav-links");
    const mobileMenu = document.getElementById("mobile-menu");

    logo.innerHTML = `
      <span class="logo-mark">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="15" rx="6" stroke="currentColor" stroke-width="2" />
          <rect x="6.5" y="8.5" width="2.6" height="4" fill="currentColor" />
          <rect x="14.9" y="8.5" width="2.6" height="4" fill="currentColor" />
          <path d="M4.5 2l3 3M19.5 2l-3 3" stroke="currentColor" stroke-width="2" />
          <path d="M7.5 14h.01M16.5 14h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        </svg>
      </span>
      <span class="logo-text">${data.personal.name}<span class="logo-dot">_dev</span></span>
    `;

    const sections = [
      { label: "About", href: "#about" },
      { label: "Skills", href: "#skills" },
      { label: "Experience", href: "#experience" },
      { label: "Work", href: "#work" },
      { label: "Contact", href: "#contact" },
    ];

    navLinks.innerHTML = sections.map(s =>
      `<a href="${s.href}" class="nav-pill">${s.label}</a>`
    ).join("");

    mobileMenu.innerHTML = sections.map(s =>
      `<a href="${s.href}" class="mob-link">${s.label}</a>`
    ).join("") + `<a href="#contact" class="btn btn-primary mob-cta">Hire Me</a>`;
  }

  /* ============================================================
     RENDER: HERO
     ============================================================ */
  function renderHero() {
    const h = data.hero;

    /* LEFT */
    document.getElementById("hero-left").innerHTML = `
      <div class="hero-kicker glass-soft">
        <span class="status-dot"></span>
        <span class="mono">${h.kicker}</span>
      </div>
      <h1 class="hero-title">
        <span class="line">${h.titleLine1}</span>
        <span class="line line-accent grad-text">${h.titleLine2}<i>.</i></span>
      </h1>
      ${h.typerWords && h.typerWords.length ? `
        <p class="hero-tagline mono">
          <span>${h.taglinePrefix || "BUILT WITH"}</span>
          <span class="typer-wrap">
            <span class="typer" data-words='${JSON.stringify(h.typerWords)}'></span>
            <span class="typer-caret"></span>
          </span>
        </p>` : ""}
      <p class="hero-subtitle">${h.subtitle}</p>
      <div class="hero-actions">
        <a href="#work" class="btn btn-primary magnetic"><span>VIEW WORK</span> ${icons.arrow}</a>
        <a href="#contact" class="btn btn-ghost magnetic">Let's Talk</a>
      </div>
      <a href="#about" class="scroll-cue mono">
        <span>SCROLL</span>
        <span class="cue-line"></span>
      </a>
    `;

    /* CENTER */
    document.getElementById("hero-center").innerHTML = `
      <div class="hero-visual-wrap">
        <div class="orbit-frame" aria-hidden="true"></div>
        <div class="visual-glow" aria-hidden="true"></div>
        <div class="hero-visual" id="reveal-frame">
          <div class="hero-img base-layer">
            <img src="assets/placeholder-masked.jpg" alt="Developer avatar in stealth mode" draggable="false" loading="eager" />
          </div>
          <div class="hero-img reveal-layer" data-reveal-layer>
            <img src="assets/placeholder-unmasked.png" alt="Developer avatar revealed" draggable="false" loading="eager" />
          </div>
          <a href="#work" class="trailer-pill glass magnetic">
            <span class="play-ic">${icons.play}</span>
            <span class="trailer-text">
              <span class="mono">DEV LOG / 01</span>
              <span>WATCH SHOWREEL</span>
            </span>
            <span class="trailer-time mono">1:24</span>
          </a>
          <div class="hero-status mono glass-soft">
            ${h.statusChips.map((c, i) => i > 0 ? `<span class="sep">/</span><span>${c}</span>` : `<span>${c}</span>`).join("")}
          </div>
        </div>
        <div class="float-chip chip-1 glass-soft mono">${h.floatChips[0]}</div>
        <div class="float-chip chip-2 glass-soft mono">${h.floatChips[1]}</div>
        <div class="float-chip chip-3 glass-soft mono">${h.floatChips[2]}</div>
      </div>
    `;

    /* RIGHT */
    document.getElementById("hero-right").innerHTML = `
      <div class="hero-stats-vertical">
        ${h.stats.map(s => `
          <div class="stat-v">
            <span class="stat-num grad-text">${s.value}</span>
            <span class="mono stat-lab">${s.label}</span>
          </div>
        `).join("")}
      </div>
      <div class="hero-chips-right">
        ${h.techChips.map(c => `<div class="chip-right glass-soft mono">${c}</div>`).join("")}
      </div>
    `;
  }

  /* ============================================================
     RENDER: ABOUT
     ============================================================ */
  function renderAbout() {
    const p = data.personal;
    document.getElementById("about-grid").innerHTML = `
      <div class="about-body" data-scroll>
        ${p.bio.map(para => `<p>${para}</p>`).join("")}
        <div class="chips">
          ${data.hero.techChips.map(c => `<span class="chip mono">${c}</span>`).join("")}
        </div>
      </div>
      <div class="about-panel glass" data-scroll>
        <div class="kp-row"><span class="mono kp-key">NAME</span><span>${p.name}</span></div>
        <div class="kp-row"><span class="mono kp-key">ROLE</span><span>${p.role}</span></div>
        <div class="kp-row"><span class="mono kp-key">BASE</span><span>${p.location}</span></div>
        <div class="kp-row"><span class="mono kp-key">EDUCATION</span><span>${p.education}</span></div>
        <div class="kp-row"><span class="mono kp-key">STATUS</span><span class="ok">● ${p.status}</span></div>
      </div>
    `;
  }

  /* ============================================================
     RENDER: SKILLS
     ============================================================ */
  function renderSkills() {
    document.getElementById("skills-grid").innerHTML = data.skills.map(s => `
      <div class="glass card" data-scroll>
        <span class="card-ic mono">${s.icon}</span>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </div>
    `).join("");

    const bars = data.proficiency;
    document.getElementById("bars-panel").innerHTML = `
      <h3 class="bars-title mono">PROFICIENCY</h3>
      ${bars.map(b => `
        <div class="bar-row">
          <div class="bar-top"><span>${b.label}</span><span class="mono">${b.level}%</span></div>
          <div class="bar"><span class="bar-fill" data-level="${b.level}"></span></div>
        </div>
      `).join("")}
    `;
  }

  /* ============================================================
     RENDER: EXPERIENCE
     ============================================================ */
  function renderExperience() {
    document.getElementById("timeline").innerHTML = data.experience.map((e, i) => {
      const g = thumbGradients[String((i % 10) + 1)] || thumbGradients[1];
      const cparts = (e.company || "").split("|");
      const cname = (cparts[0] || e.company || "").trim();
      const cloc = cparts[1] ? cparts[1].trim() : "";
      const initials = cname
        .replace(/[^A-Za-z ]/g, " ")
        .split(/\s+/)
        .filter(w => w.length && !/^(and|the|off?|of|co)$/i.test(w))
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join("") || (cname[0] || "ER").toUpperCase();
      return `
        <div class="tl-item" data-scroll>
          <div class="tl-dot"></div>
          <div class="glass tl-card">
            <div class="tl-row">
              <span class="tl-role">${e.role}</span>
              <span class="mono tl-date">${e.date}</span>
            </div>
            <div class="tl-company-row">
              <span class="tl-logo" style="--lg:${g}">${initials}</span>
              <span class="tl-company">${cname}<span class="tl-company-dot">.</span>${cloc ? `<span class="tl-company-loc"> · ${cloc}</span>` : ""}</span>
            </div>
            <p>${e.desc}</p>
          </div>
        </div>
      `;
    }).join("");
  }

  /* ============================================================
     RENDER: PROJECT CARD (shared HTML for featured + overlay)
     ============================================================ */
  function projectCard(p, inOverlay, idx) {
    const grad = thumbGradients[p.thumb.grad] || thumbGradients[1];
    const catLabel = categoryLabels[p.category] || p.category.toUpperCase();
    const appId = extractAppId(p);
    const dataAttrs = inOverlay
      ? `data-category="${p.category}" data-project-id="${p.id}"${appId ? ` data-app-id="${appId}"` : ""}`
      : `data-project-id="${p.id}"${appId ? ` data-app-id="${appId}"` : ""}`;
    const clickable = inOverlay ? ` style="cursor:pointer;--i:${idx || 0}"` : '';

    const iconHtml = appId
      ? `<div class="proj-icon" data-app-id="${appId}"><div class="proj-icon-loading" style="background:${grad}"><span class="thumb-glyph mono">${p.thumb.glyph}</span></div><div class="proj-store-info" data-app-id="${appId}"></div><div class="proj-downloads-info" data-app-id="${appId}"></div></div>`
      : `<div class="thumb" style="background:${grad}"><span class="thumb-glyph mono">${p.thumb.glyph}</span><span class="thumb-chip mono">${catLabel}</span></div>`;

    const hasGithub = p.links.github && p.links.github !== "#";
    const hasLive = p.links.live && p.links.live !== "#";
    const linksHtml = (hasGithub || hasLive) ? `
      <div class="proj-links">
        ${hasGithub ? `<a href="${p.links.github}" class="proj-link mono" target="_blank" rel="noopener" data-stop>GITHUB ${icons.arrow}</a>` : ""}
        ${hasLive ? `<a href="${p.links.live}" class="proj-link mono" target="_blank" rel="noopener" data-stop>LIVE DEMO ${icons.arrow}</a>` : ""}
      </div>` : "";

    return `
      <article class="glass card card-project" ${dataAttrs}${clickable}>
        ${iconHtml}
        <div class="proj-body">
          <h3>${p.title}</h3>
          <p>${p.desc}</p>
          <div class="chips">${p.tags.map(t => `<span class="chip mono">${t}</span>`).join("")}</div>
          ${linksHtml}
        </div>
      </article>
    `;
  }

  /* ============================================================
     RENDER: PROJECTS (featured grid + overlay)
     ============================================================ */
  function renderProjects() {
    const featured = data.projects.filter(p => p.featured);

    document.getElementById("project-grid").innerHTML = featured.map(p => projectCard(p, false)).join("");
  }

  /* ============================================================
     RENDER: CONTACT
     ============================================================ */
  function renderContact() {
    const p = data.personal;
    const socialSvg = { github: icons.github, linkedin: icons.linkedin, playstore: icons.playstore };

    document.getElementById("contact").innerHTML = `
      <div class="contact-panel glass" data-scroll>
        <span class="mono section-tag">05 / CONTACT</span>
        <h2 class="contact-title">LET'S BUILD<br/>SOMETHING<span class="grad-text">.</span></h2>
        <p class="contact-sub">
          Open to full-time roles, freelance Android work and interesting side projects.
          My inbox is always open — I usually reply within 24 hours.
        </p>
        <form class="contact-form" id="contact-form" novalidate>
          <div class="field-row">
            <input class="field-input" type="text" name="name" placeholder="Your name" required aria-label="Your name" />
            <input class="field-input" type="email" name="email" placeholder="${p.email}" required aria-label="Your email" />
          </div>
          <textarea class="field-input field-area" name="message" rows="3" placeholder="Tell me about your project…" required aria-label="Message"></textarea>
          <button class="btn btn-primary magnetic" type="submit"><span>Send Message</span></button>
        </form>
        <div class="contact-alternate mono">
          <span>or email me directly</span>
          <a href="mailto:${p.email}">${p.email}</a>
        </div>
        <div class="contact-social">
          ${data.socials.map(s => `
            <a href="${s.url}" class="social-link mono" aria-label="${s.name}" ${s.url !== "#" ? 'target="_blank" rel="noopener"' : ""}>
              ${socialSvg[s.icon] || ""}
              ${s.name.toUpperCase()}
            </a>
          `).join("")}
        </div>
      </div>
    `;
  }

  /* ============================================================
     RENDER: FOOTER
     ============================================================ */
  function renderFooter() {
    document.getElementById("foot").innerHTML = `
      <span class="mono">&copy; 2026 ${data.personal.name} — All systems nominal</span>
      <div class="foot-links mono">
        <a href="#about">About</a>
        <a href="#skills">Skills</a>
        <a href="#experience">Experience</a>
        <a href="#work">Work</a>
      </div>
      <button class="back-top" id="back-top" aria-label="Back to top">${icons.chevUp}</button>
    `;
  }

  /* ============================================================
     RENDER ALL
     ============================================================ */
  renderNav();
  renderHero();
  renderAbout();
  renderSkills();
  renderExperience();
  renderProjects();
  renderContact();
  renderFooter();

  /* ============================================================
     INTERACTIONS
     ============================================================ */

  const isTouch =
    window.matchMedia("(hover: none), (pointer: coarse)").matches ||
    "ontouchstart" in window;

  /* ---------- Spotlight reveal ---------- */
  const frame = document.getElementById("reveal-frame");
  if (frame) {
    const setSpot = (x, y) => {
      frame.style.setProperty("--x", x + "px");
      frame.style.setProperty("--y", y + "px");
    };

    if (!isTouch) {
      let targetX = 0, targetY = 0, curX = 0, curY = 0, raf = null;

      const mapToFrame = (clientX, clientY) => {
        const rect = frame.getBoundingClientRect();
        return { x: clientX - rect.left, y: clientY - rect.top };
      };

      const loop = () => {
        curX += (targetX - curX) * 0.16;
        curY += (targetY - curY) * 0.16;
        setSpot(curX, curY);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      frame.addEventListener("pointerenter", () => (frame.dataset.hover = "true"));
      frame.addEventListener("pointermove", (e) => {
        const p = mapToFrame(e.clientX, e.clientY);
        targetX = p.x;
        targetY = p.y;
        setSpot(p.x, p.y);
      });
      frame.addEventListener("pointerleave", () => delete frame.dataset.hover);
    } else {
      frame.dataset.hover = "true";
      let drag = false, idleRaf = null, idlePhase = 0;

      function stopIdle() {
        if (idleRaf) cancelAnimationFrame(idleRaf);
        idleRaf = null;
      }
      function startIdle() {
        stopIdle();
        const rect = frame.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 3;
        const loop = () => {
          idlePhase += 0.02;
          const r = rect.width * 0.16 + Math.sin(idlePhase) * 12;
          setSpot(cx + Math.cos(idlePhase * 1.3) * rect.width * 0.12, cy);
          frame.style.setProperty("--mask-radius", Math.max(60, r) + "px");
          idleRaf = requestAnimationFrame(loop);
        };
        idleRaf = requestAnimationFrame(loop);
      }

      function moveSpot(e) {
        const rect = frame.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setSpot(x, y);
      }

      frame.addEventListener("pointerdown", (e) => {
        drag = true;
        stopIdle();
        frame.setPointerCapture(e.pointerId);
        moveSpot(e);
        frame.style.setProperty("--mask-radius", "150px");
      });
      frame.addEventListener("pointermove", (e) => { if (drag) moveSpot(e); });
      const end = () => { drag = false; startIdle(); };
      frame.addEventListener("pointerup", end);
      frame.addEventListener("pointercancel", end);
      startIdle();
    }
  }

  /* ---------- Custom cursor ---------- */
  if (!isTouch) {
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (dot && ring && window.gsap) {
      document.body.classList.add("custom-cursor");
      const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2" });
      const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2" });
      const ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3" });
      const ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3" });
      window.addEventListener("pointermove", (e) => {
        dotX(e.clientX); dotY(e.clientY);
        ringX(e.clientX); ringY(e.clientY);
      });
      const actives = gsap.utils.toArray("a, .btn, button");
      actives.forEach((el) => {
        el.addEventListener("pointerenter", () => ring.classList.add("is-active"));
        el.addEventListener("pointerleave", () => ring.classList.remove("is-active"));
      });
    } else if (dot && ring) {
      dot.style.display = "none";
      ring.style.display = "none";
    }
  }

  /* ---------- Magnetic hover ---------- */
  if (!isTouch && window.gsap) {
    gsap.utils.toArray(".magnetic").forEach((el) => {
      const strength = 0.3;
      const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Hero entrance ---------- */
  if (window.gsap) {
    gsap.from("#hero-left > *", {
      y: 26, opacity: 0, duration: 0.65, stagger: 0.08, ease: "power3.out", delay: 0,
    });
    gsap.from(".hero-visual-wrap", {
      scale: 0.96, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.08,
    });
    gsap.from("#hero-right > *", {
      y: 20, opacity: 0, duration: 0.65, stagger: 0.1, ease: "power3.out", delay: 0.14,
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initScrollReveal() {
    const els = document.querySelectorAll("[data-scroll]");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      els.forEach((el) => io.observe(el));
    } else {
      els.forEach((el) => el.classList.add("in-view"));
    }
  }
  initScrollReveal();

  /* ---------- Skill bars ---------- */
  const barFill = document.querySelectorAll(".bar-fill");
  const animateBars = (el) => {
    const level = parseInt(el.dataset.level, 10) || 0;
    const label = el.closest(".bar-row") ? el.closest(".bar-row").querySelector(".bar-top .mono") : null;
    if (prefersReduced) {
      el.style.width = level + "%";
      if (label) label.textContent = level + "%";
      return;
    }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1000, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.style.width = eased * level + "%";
      if (label) label.textContent = Math.round(eased * level) + "%";
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (barFill.length && "IntersectionObserver" in window) {
    const bio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateBars(entry.target);
          bio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    barFill.forEach((b) => bio.observe(b));
  }

  /* ---------- Scroll progress + nav state + back-to-top ---------- */
  const progress = document.getElementById("scroll-progress");
  const nav = document.getElementById("nav");
  const backTop = document.getElementById("back-top");
  const navPills = document.querySelectorAll(".nav-pill");

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const st = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = (max > 0 ? (st / max) * 100 : 0) + "%";
      if (nav) nav.classList.toggle("scrolled", st > 20);
      if (backTop) backTop.classList.toggle("visible", st > 500);
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* Active nav pill */
  const navPillsArr = Array.from(navPills);

  /* Sliding nav indicator */
  const navLinksEl = document.getElementById("nav-links");
  const navInd = document.createElement("span");
  navInd.className = "nav-indicator";
  navInd.setAttribute("aria-hidden", "true");
  if (navLinksEl) navLinksEl.appendChild(navInd);
  function moveNavInd() {
    const active = navLinksEl ? navLinksEl.querySelector(".nav-pill.active") : null;
    if (!active || window.innerWidth <= 900) {
      navInd.classList.remove("on");
      return;
    }
    navInd.classList.add("on");
    navInd.style.left = active.offsetLeft + "px";
    navInd.style.width = active.offsetWidth + "px";
  }
  window.addEventListener("resize", moveNavInd);
  window.addEventListener("load", moveNavInd);
  moveNavInd();
  if (navPillsArr.length && "IntersectionObserver" in window) {
    const sections = navPillsArr
      .map((p) => document.querySelector(p.getAttribute("href")))
      .filter(Boolean);
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navPillsArr.forEach((p) =>
              p.classList.toggle("active", p.getAttribute("href") === "#" + entry.target.id)
            );
            moveNavInd();
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById("nav-burger");
  const menu = document.getElementById("mobile-menu");

  /* Scroll-lock that preserves position + compensates the scrollbar.
     Locking via position:fixed avoids the Android Chrome reflow/zoom
     glitch caused by toggling body overflow on a 100vh layout. */
  const scrollLock = (() => {
    let count = 0;
    let top = 0;
    let pad = 0;
    const apply = () => {
      top = window.scrollY || document.documentElement.scrollTop || 0;
      pad = window.innerWidth - document.documentElement.clientWidth;
      const el = document.body;
      el.style.position = "fixed";
      el.style.top = "-" + top + "px";
      el.style.left = "0";
      el.style.right = "0";
      el.style.width = "100%";
      el.style.overflow = "hidden";
      if (pad > 0) el.style.paddingRight = pad + "px";
    };
    const release = () => {
      document.body.style.cssText = "";
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      window.scrollTo(0, top);
      html.style.scrollBehavior = prev;
    };
    return {
      lock() { if (count === 0) apply(); count += 1; },
      unlock() {
        count = Math.max(0, count - 1);
        if (count === 0) release();
      },
    };
  })();

  function setMenu(open) {
    if (!burger || !menu) return;
    menu.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    open ? scrollLock.lock() : scrollLock.unlock();
  }

  if (burger && menu) {
    burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenu(false);
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  /* ---------- Open detail modal from the featured grid ---------- */
  const projectGrid = document.getElementById("project-grid");
  if (projectGrid) {
    projectGrid.addEventListener("click", (e) => {
      if (e.target.closest("[data-stop]")) return;
      const card = e.target.closest(".card-project");
      if (card && card.dataset.projectId) {
        openModal(card.dataset.projectId);
      }
    });
  }

  /* ---------- Project detail modal ---------- */
  const modal = document.getElementById("project-modal");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalBody = document.getElementById("modal-body");
  const modalCategory = document.getElementById("modal-category");
  const modalBack = document.getElementById("modal-back");
  const modalCloseBtn = document.getElementById("modal-close");

  function openModal(projectId) {
    const p = data.projects.find(proj => proj.id === projectId);
    if (!p || !modal) return;
    const grad = thumbGradients[p.thumb.grad] || thumbGradients[1];
    const catLabel = categoryLabels[p.category] || p.category.toUpperCase();
    const ps = psDataMap[projectId];

    let screenshotsHtml = "";
    if (ps && ps.screenshots.length) {
      screenshotsHtml = `
        <div class="modal-screenshots">
          <h4 class="mono modal-ss-title">SCREENSHOTS</h4>
          <div class="screenshots-scroll">
            ${ps.screenshots.map((url, i) => `<img class="screenshot-img" src="${url}" alt="Screenshot ${i + 1}" loading="lazy" />`).join("")}
          </div>
        </div>`;
    }
    const glyph = p.thumb.glyph || "PS";
    const thumbHtml = (ps && ps.screenshots && ps.screenshots.length)
      ? ""
      : `<div class="modal-thumb" style="background:${grad}"><span class="modal-glyph mono">${glyph}</span></div>`;

    let ratingHtml = "";
    if (ps && ps.rating) {
      const downloadsStr = formatDownloads(ps.downloads);
      ratingHtml = `
        <div class="modal-store-stats">
          ${ps.rating
            ? `<span class="modal-rating">${starRow(ps.rating)}<span class="modal-rating-num mono">0.0</span> ${ps.ratingCount ? `<span class="review-count mono">(${Number(ps.ratingCount).toLocaleString()} reviews)</span>` : ""}</span>`
            : ""}
          ${downloadsStr ? `<span class="modal-downloads mono" data-modal-dl>0 downloads</span>` : ""}
        </div>`;
    }

    modalCategory.textContent = catLabel;
    modalBody.innerHTML = `
      ${thumbHtml}
      ${screenshotsHtml}
      <h2 class="modal-proj-title">${p.title}</h2>
      ${ratingHtml}
      <p class="modal-proj-desc">${p.longDesc}</p>
      <div class="modal-tags chips">${p.tags.map(t => `<span class="chip mono">${t}</span>`).join("")}</div>
      <div class="modal-links">
        ${p.links.github && p.links.github !== "#" ? `<a href="${p.links.github}" class="btn btn-ghost magnetic" target="_blank" rel="noopener">${icons.github} GITHUB</a>` : ""}
        ${p.links.live && p.links.live !== "#" ? `<a href="${p.links.live}" class="btn btn-primary magnetic" target="_blank" rel="noopener">${icons.arrow} LIVE DEMO</a>` : ""}
      </div>
    `;
    if (ps && ps.rating) {
      animateCount(modalBody.querySelector(".modal-rating-num"), ps.rating, { decimals: 1 });
      const dlNode = modalBody.querySelector("[data-modal-dl]");
      const dlRaw = (ps.downloads ? parseInt(String(ps.downloads).replace(/[^0-9]/g, ""), 10) : 0) || 0;
      if (dlNode && dlRaw) {
        dlNode.textContent = "0 downloads";
        animateCount(dlNode, dlRaw, { format: (n) => formatDownloads(n) + " downloads" });
      }
    }
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    scrollLock.lock();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    scrollLock.unlock();
  }

  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
  if (modalBack) modalBack.addEventListener("click", closeModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);

  /* ESC closes the detail modal */
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  /* ============================================================
     EFFECTS PACK — hero, glow, particles, marquee
     ============================================================ */
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hoverOK = !isTouch && window.matchMedia("(hover: hover)").matches;

  /* ---------- Hero title: split into chars ---------- */
  function splitHeroTitle() {
    document.querySelectorAll(".hero-title .line").forEach((line) => {
      const walk = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === 3) {
            const frag = document.createDocumentFragment();
            Array.from(child.textContent).forEach((c) => {
              const s = document.createElement("span");
              s.className = "ch";
              s.textContent = c;
              frag.appendChild(s);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1) {
            walk(child);
          }
        });
      };
      walk(line);
    });
  }
  splitHeroTitle();

  /* ---------- Tagline typewriter: types & deletes words char by char ---------- */
  (function initTypewriter() {
    const el = document.querySelector(".typer");
    if (!el) return;
    let words = [];
    try { words = JSON.parse(el.dataset.words || "[]"); } catch {}
    if (!words.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = words[0];
      return;
    }
    const elCaret = document.querySelector(".typer-caret");
    let wi = 0, ci = 0, deleting = false;
    const typeMs = 80, delMs = 45, hold = 1900;
    const tick = () => {
      const word = words[wi];
      el.textContent = word.slice(0, ci);
      if (!deleting) {
        if (ci < word.length) {
          ci += 1;
          setTimeout(tick, typeMs);
        } else {
          deleting = true;
          setTimeout(tick, hold);
        }
      } else {
        if (ci > 0) {
          ci -= 1;
          setTimeout(tick, delMs);
        } else {
          deleting = false;
          wi = (wi + 1) % words.length;
          setTimeout(tick, 250);
        }
      }
    };
    setTimeout(tick, 1300);
  })();

  if (window.gsap && !prefersReduced) {
    gsap.from(".hero-title .ch", {
      yPercent: 115, opacity: 0, duration: 0.6, stagger: 0.028,
      ease: "power3.out", delay: 0.05,
    });
  }

  /* ---------- Hero stats: count-up ---------- */
  function countUp(el, target, decimals, suffix, dur) {
    if (prefersReduced || !window.gsap) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: dur || 1.2, delay: 0.3, ease: "power2.out",
      onUpdate: () => { el.textContent = obj.v.toFixed(decimals) + suffix; },
    });
  }
  document.querySelectorAll(".stat-num").forEach((el) => {
    const m = (el.textContent || "").trim().match(/^([\d.]+)(.*)$/);
    if (!m) return;
    const numStr = m[1];
    const decimals = (numStr.split(".")[1] || "").length;
    countUp(el, parseFloat(numStr), decimals, m[2] || "", 1.2);
  });

  /* ---------- Hero visual: 3D tilt toward cursor ---------- */
  if (hoverOK && window.gsap && !prefersReduced) {
    const wrap = document.querySelector(".hero-visual-wrap");
    if (wrap) {
      gsap.set(wrap, { transformPerspective: 1000 });
      let raf = null;
      wrap.addEventListener("pointermove", (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = wrap.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(wrap, { rotateY: px * 10, rotateX: -py * 10, duration: 0.5, ease: "power2.out" });
          raf = null;
        });
      });
      wrap.addEventListener("pointerleave", () => {
        gsap.to(wrap, { rotateX: 0, rotateY: 0, duration: 0.7, ease: "elastic.out(1, 0.6)" });
      });
    }
  }

  /* ---------- Ambient glow follows cursor ---------- */
  if (hoverOK && !prefersReduced) {
    const glow = document.getElementById("ambient-glow");
    if (glow) {
      let gx = window.innerWidth / 2, gy = window.innerHeight * 0.3;
      let tx = gx, ty = gy, raf = null;
      window.addEventListener("pointermove", (e) => {
        tx = e.clientX; ty = e.clientY;
        if (!raf) {
          raf = requestAnimationFrame(function loop() {
            gx += (tx - gx) * 0.08;
            gy += (ty - gy) * 0.08;
            glow.style.setProperty("--gx", gx + "px");
            glow.style.setProperty("--gy", gy + "px");
            if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) {
              raf = requestAnimationFrame(loop);
            } else {
              raf = null;
            }
          });
        }
      }, { passive: true });
    }
  }

  /* ---------- Hero floating particles ---------- */
  if (!isTouch && !prefersReduced) {
    const hero = document.querySelector(".hero");
    if (hero) {
      const box = document.createElement("div");
      box.className = "particles";
      box.setAttribute("aria-hidden", "true");
      const colors = ["#3ddc84", "#2dd4bf", "#a7f3d0"];
      for (let i = 0; i < 16; i++) {
        const p = document.createElement("span");
        p.className = "particle";
        const size = 2 + Math.random() * 2.5;
        p.style.cssText = `left:${5 + Math.random() * 90}%;top:${10 + Math.random() * 80}%;width:${size}px;height:${size}px;background:${colors[i % 3]};animation-duration:${7 + Math.random() * 7}s;animation-delay:-${Math.random() * 10}s;`;
        box.appendChild(p);
      }
      hero.insertBefore(box, hero.firstChild);
    }
  }

  /* ---------- Tech marquee (data-driven) ---------- */
  (function renderMarquee() {
    const chips = (data.hero && data.hero.techChips) || [];
    if (!chips.length) return;
    const half = `<div class="marquee-half" aria-hidden="true">${chips.concat(chips, chips).map((c) => `<span class="mq-item mono">${c}</span><span class="mq-star">✦</span>`).join("")}</div>`;
    const mq = document.createElement("div");
    mq.className = "marquee";
    mq.setAttribute("aria-hidden", "true");
    mq.innerHTML = `<div class="marquee-track">${half}${half}</div>`;
    const main = document.querySelector("main");
    const about = document.getElementById("about");
    if (main && about) main.insertBefore(mq, about);
  })();

  /* ============================================================
     EFFECTS PACK — cards, stagger, timeline
     ============================================================ */

  /* ---------- Cards: cursor spotlight + 3D tilt toward hover ---------- */
  if (hoverOK && window.gsap && !prefersReduced) {
    document.querySelectorAll(".card, .card-project, .tl-card").forEach((card) => {
      card.classList.add("tilt");
      gsap.set(card, { transformPerspective: 900 });
      let raf = null;
      /* hand transform over to GSAP on first hover so CSS transitions don't fight it */
      card.addEventListener("pointerenter", () => {
        card.style.transition = "opacity 0.8s cubic-bezier(0.2,0.8,0.2,1), border-color 0.35s, box-shadow 0.35s";
      }, { once: true });
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, { rotateY: px * 7, rotateX: -py * 7, y: -6, scale: 1.015, duration: 0.4, ease: "power2.out" });
          raf = null;
        });
      });
      card.addEventListener("pointerleave", () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, y: 0, scale: 1, duration: 0.6, ease: "power3.out" });
      });
    });
  }

  /* ---------- Grid entrance stagger ---------- */
  document.querySelectorAll("#skills-grid .card, #project-grid .card-project").forEach((el, i) => {
    el.style.transitionDelay = ((i % 3) * 70) + "ms";
    el.addEventListener("pointerenter", () => { el.style.transitionDelay = "0ms"; }, { once: true });
  });

  /* ---------- Timeline scroll progress ---------- */
  (function timelineProgress() {
    const tl = document.getElementById("timeline");
    if (!tl || prefersReduced) return;
    const prog = document.createElement("span");
    prog.className = "tl-progress";
    prog.setAttribute("aria-hidden", "true");
    tl.appendChild(prog);
    let tick = false;
    const update = () => {
      tick = false;
      const r = tl.getBoundingClientRect();
      const p = (window.innerHeight * 0.65 - r.top) / r.height;
      tl.style.setProperty("--tlp", Math.min(1, Math.max(0, p)).toFixed(3));
    };
    window.addEventListener("scroll", () => {
      if (!tick) { tick = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ---------- Contact form (FormSubmit AJAX -> email) ---------- */
  const form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      const original = btn.innerHTML;
      const fd = new FormData(form);
      fd.append("_subject", "New message from aman-099.github.io");
      fd.append("_template", "table");
      fd.append("_captcha", "false");
      btn.innerHTML = "Sending…";
      btn.disabled = true;
      fetch("https://formsubmit.co/ajax/" + encodeURIComponent(data.personal.email), {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      })
        .then(res => res.json())
        .then(d => {
          if (d && d.success === true) {
            btn.innerHTML = "✓ Sent — I'll reply soon";
            form.querySelectorAll(".field-input").forEach((f) => (f.value = ""));
          } else {
            throw new Error("FormSubmit rejected");
          }
        })
        .catch(() => {
          btn.innerHTML = "⚠ Couldn't send — email me below";
        })
        .finally(() => {
          btn.style.opacity = "0.9";
          setTimeout(() => {
            btn.innerHTML = original;
            btn.disabled = false;
            btn.style.opacity = "";
          }, 3500);
        });
    });
  }
  /* ---------- Play Store live data ---------- */
  (async function loadPlayStoreData() {
    if (!PLAY_STORE_WORKER) return;
    const androidProjects = data.projects.filter(p => extractAppId(p));
    if (!androidProjects.length) return;

    const results = await Promise.allSettled(
      androidProjects.map(async (p) => {
        const appId = extractAppId(p);
        let psData = await fetchPlayStoreData(appId);
        if (!psData || !psData.icon) {
          psData = p.playStore
            ? {
                icon: p.playStore.icon || null,
                rating: p.playStore.rating || null,
                ratingCount: p.playStore.ratingCount || null,
                downloads: p.playStore.downloads || null,
                screenshots: [],
              }
            : null;
        }
        if (psData) {
          psDataMap[p.id] = psData;
          /* Update card icon */
          const iconEl = document.querySelector(`.proj-icon[data-app-id="${appId}"]`);
          if (iconEl && psData.icon) {
            iconEl.innerHTML = `
              <img class="proj-icon-bg" src="${psData.icon}" alt="" aria-hidden="true" />
              <div class="proj-icon-shade"></div>
              <div class="proj-store-info" data-app-id="${appId}"></div>
              <span class="proj-icon-frame">
                <img class="proj-icon-img" src="${psData.icon}" alt="${p.title} icon" loading="lazy" />
              </span>
              <div class="proj-downloads-info" data-app-id="${appId}"></div>
            `;
          }
          /* Update card store info — rating left, downloads right */
          const infoEl = document.querySelector(`.proj-store-info[data-app-id="${appId}"]`);
          if (infoEl && psData.rating) {
            const rated = formatDownloads(psData.ratingCount);
            infoEl.innerHTML =
              `<span class="proj-rating">${starRow(psData.rating)}<span class="proj-rating-num">0.0</span></span>` +
              (rated ? `<span class="proj-rating-count">${rated} ratings</span>` : "");
            animateCount(infoEl.querySelector(".proj-rating-num"), psData.rating, { decimals: 1 });
          }
          const dlEl = document.querySelector(`.proj-downloads-info[data-app-id="${appId}"]`);
          if (dlEl && psData.downloads) {
            const rawDl = parseInt(String(psData.downloads).replace(/[^0-9]/g, ""), 10) || 0;
            dlEl.innerHTML =
              `<span class="proj-downloads">0</span><span class="proj-downloads-label">DOWNLOADS</span>`;
            animateCount(dlEl.querySelector(".proj-downloads"), rawDl, {
              format: (n) => (n === 0 ? "0" : formatDownloads(n)),
            });
          }
        }
      })
    );
  })();

})();
