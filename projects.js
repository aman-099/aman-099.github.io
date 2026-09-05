/* ============================================================
   PROJECTS PAGE — data-driven full catalog + detail modal
   ============================================================ */

(function () {
  "use strict";

  if (!window.DATA) {
    document.body.innerHTML = '<p style="color:#3ddc84;padding:40px;font-family:monospace">Failed to load data.js</p>';
    return;
  }
  const data = window.DATA;

  /* ============================================================
     SVG ICONS
     ============================================================ */
  const icons = {
    github: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`,
    arrow: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 11L11 3m0 0H4m7 0v7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };

  /* ============================================================
     PLAY STORE CONFIG (same as homepage)
     ============================================================ */
  const PLAY_STORE_WORKER = "https://playstore-proxy.sc6293270.workers.dev"; // Cloudflare Worker proxy
  const CACHE_TTL = 3600000;

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

  function getCachedPs(appId) {
    try {
      const raw = sessionStorage.getItem("ps_" + appId);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (Date.now() - d.ts > CACHE_TTL) return null;
      return d.data;
    } catch { return null; }
  }

  function setCachedPs(appId, data) {
    try { sessionStorage.setItem("ps_" + appId, JSON.stringify({ ts: Date.now(), data })); } catch {}
  }

  async function fetchPlayStoreData(appId) {
    if (!PLAY_STORE_WORKER || !appId) return null;
    const cached = getCachedPs(appId);
    if (cached) return cached;
    try {
      const res = await fetch(PLAY_STORE_WORKER + "?id=" + encodeURIComponent(appId));
      if (!res.ok) return null;
      const d = await res.json();
      const result = {
        icon: d.icon || null,
        rating: d.score || null,
        ratingCount: d.reviews || null,
        downloads: d.installs || null,
        screenshots: (d.screenshots || []).slice(0, 6),
      };
      setCachedPs(appId, result);
      return result;
    } catch { return null; }
  }

  const psDataMap = {};

  /* ============================================================
     GRADIENT MAP (matches homepage)
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
     RENDER: LOGO
     ============================================================ */
  function renderLogo() {
    const logo = document.getElementById("nav-logo");
    if (!logo) return;
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
  }

  /* ============================================================
     RENDER: PROJECT CARDS
     ============================================================ */
  function projectCard(p, idx) {
    const grad = thumbGradients[p.thumb.grad] || thumbGradients[1];
    const catLabel = categoryLabels[p.category] || p.category.toUpperCase();
    const appId = extractAppId(p);

    const iconHtml = appId
      ? `<div class="proj-icon" data-app-id="${appId}"><div class="proj-icon-loading" style="background:${grad}"><span class="thumb-glyph mono">${p.thumb.glyph}</span></div><div class="proj-store-info" data-app-id="${appId}"></div></div>`
      : `<div class="thumb" style="background:${grad}"><span class="thumb-glyph mono">${p.thumb.glyph}</span><span class="thumb-chip mono">${catLabel}</span></div>`;

    const hasGithub = p.links.github && p.links.github !== "#";
    const hasLive = p.links.live && p.links.live !== "#";
    const linksHtml = (hasGithub || hasLive) ? `
      <div class="proj-links">
        ${hasGithub ? `<a href="${p.links.github}" class="proj-link mono" target="_blank" rel="noopener" data-stop>GITHUB ${icons.arrow}</a>` : ""}
        ${hasLive ? `<a href="${p.links.live}" class="proj-link mono" target="_blank" rel="noopener" data-stop>LIVE DEMO ${icons.arrow}</a>` : ""}
      </div>` : "";

    return `
      <article class="glass card card-project" data-category="${p.category}" data-project-id="${p.id}" data-app-id="${appId || ""}" style="--i:${idx}">
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

  function renderProjects() {
    const grid = document.getElementById("project-grid");
    if (!grid) return;
    grid.innerHTML = data.projects.map((p, i) => projectCard(p, i)).join("");

    const cats = data.categories || ["all", "android", "web", "open-source"];
    document.getElementById("filter-bar").innerHTML = cats.map(c =>
      `<button class="filter-pill${c === "all" ? " active" : ""}" data-filter="${c}">${c.toUpperCase()}</button>`
    ).join("");
  }

  /* ============================================================
     SCROLL LOCK (preserves position — avoids Android reflow/zoom)
     ============================================================ */
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
      window.scrollTo(0, top);
    };
    return {
      lock() { if (count === 0) apply(); count += 1; },
      unlock() {
        count = Math.max(0, count - 1);
        if (count === 0) release();
      },
    };
  })();

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
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

  /* ============================================================
     FILTER
     ============================================================ */
  function initFilter() {
    const filterBar = document.getElementById("filter-bar");
    const grid = document.getElementById("project-grid");
    if (!filterBar || !grid) return;
    filterBar.addEventListener("click", (e) => {
      const pill = e.target.closest(".filter-pill");
      if (!pill) return;
      filterBar.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const filter = pill.dataset.filter;
      const before = () => {
        grid.querySelectorAll(".card-project").forEach(card => {
          if (card.classList.contains("is-hidden")) card.classList.remove("is-hidden");
        });
        grid.classList.add("is-switching");
      };
      before();
      setTimeout(() => {
        grid.querySelectorAll(".card-project").forEach(card => {
          const show = filter === "all" || card.dataset.category === filter;
          card.classList.toggle("is-hidden", !show);
        });
        grid.classList.remove("is-switching");
      }, 150);
    });
  }

  /* ============================================================
     DETAIL MODAL
     ============================================================ */
  const modal = document.getElementById("project-modal");
  const modalBody = document.getElementById("modal-body");
  const modalCategory = document.getElementById("modal-category");
  const modalBackdrop = document.getElementById("modal-backdrop");
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
    const glyph = p.thumb ? p.thumb.glyph : "PS";
    const hasScreenshots = !!(ps && ps.screenshots && ps.screenshots.length);
    const thumbHtml = hasScreenshots
      ? ""
      : `<div class="modal-thumb" style="background:${grad}"><span class="modal-glyph mono">${glyph}</span></div>`;

    let ratingHtml = "";
    if (ps && ps.rating) {
      const stars = Math.round(ps.rating * 2) / 2;
      const full = Math.floor(stars);
      const half = stars % 1 >= 0.5 ? 1 : 0;
      const empty = 5 - full - half;
      const starsStr = "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
      const downloadsStr = formatDownloads(ps.downloads);
      ratingHtml = `
        <div class="modal-store-stats">
          ${ps.rating ? `<span class="modal-rating"><span class="stars">${starsStr}</span> <span class="mono">${ps.rating.toFixed(1)}</span> ${ps.ratingCount ? `<span class="review-count mono">(${Number(ps.ratingCount).toLocaleString()} reviews)</span>` : ""}</span>` : ""}
          ${downloadsStr ? `<span class="modal-downloads mono">${downloadsStr} downloads</span>` : ""}
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

  function initModal() {
    const grid = document.getElementById("project-grid");
    if (!grid) return;
    grid.addEventListener("click", (e) => {
      if (e.target.closest("[data-stop]")) return;
      const card = e.target.closest(".card-project");
      if (card && card.dataset.projectId) openModal(card.dataset.projectId);
    });
    if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
    if (modalBack) modalBack.addEventListener("click", closeModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  /* ============================================================
     SCROLL PROGRESS + NAV STATE + BACK TO TOP
     ============================================================ */
  function initScrollChrome() {
    const progress = document.getElementById("scroll-progress");
    const nav = document.getElementById("nav");
    const backTop = document.getElementById("back-top");

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
    if (backTop) backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ============================================================
     MAGNETIC HOVER (desktop only)
     ============================================================ */
  function initMagnetic() {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isTouch || !window.gsap) return;
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

  /* ============================================================
     PLAY STORE LIVE DATA
     ============================================================ */
  (async function loadPlayStoreData() {
    if (!PLAY_STORE_WORKER) return;
    const androidProjects = data.projects.filter(p => extractAppId(p));
    if (!androidProjects.length) return;
    const results = await Promise.allSettled(
      androidProjects.map(async (p) => {
        const appId = extractAppId(p);
        const psData = await fetchPlayStoreData(appId);
        if (!psData) return;
        psDataMap[p.id] = psData;
        const iconEl = document.querySelector(`.proj-icon[data-app-id="${appId}"]`);
        if (iconEl && psData.icon) {
          iconEl.innerHTML = `
            <img class="proj-icon-bg" src="${psData.icon}" alt="" aria-hidden="true" />
            <div class="proj-icon-shade"></div>
            <span class="proj-icon-frame">
              <img class="proj-icon-img" src="${psData.icon}" alt="${p.title} icon" loading="lazy" />
            </span>
            <div class="proj-store-info" data-app-id="${appId}"></div>
          `;
        }
        const infoEl = document.querySelector(`.proj-store-info[data-app-id="${appId}"]`);
        if (infoEl) {
          const stars = psData.rating ? Math.round(psData.rating * 2) / 2 : 0;
          const full = Math.floor(stars);
          const half = stars % 1 >= 0.5 ? 1 : 0;
          const empty = 5 - full - half;
          const starsStr = "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
          const dl = formatDownloads(psData.downloads);
          let html = "";
          if (psData.rating) html += `<span class="proj-rating">${starsStr} ${psData.rating.toFixed(1)}</span>`;
          if (dl) html += `<span class="proj-downloads">${dl}</span>`;
          infoEl.innerHTML = html;
        }
      })
    );
  })();

  /* ============================================================
     BOOT
     ============================================================ */
  renderLogo();
  renderProjects();
  initScrollReveal();
  initFilter();
  initModal();
  initScrollChrome();
  initMagnetic();

  /* Animate skill-style bars if present (future-proof) */
  document.querySelectorAll(".bar-fill").forEach((el) => {
    const level = parseInt(el.dataset.level, 10) || 0;
    el.style.width = level + "%";
  });
})();