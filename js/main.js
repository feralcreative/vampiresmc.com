// ============================================
// VAMPIRES MC — Main JavaScript
// ============================================

(function () {
  "use strict";

  const scrollContainer = document.getElementById("scroll-container");
  const panels = [...document.querySelectorAll(".panel")];
  const dots = [...document.querySelectorAll(".scroll-dot")];
  const bottomDots = [...document.querySelectorAll(".bottom-dot")];

  // ------------------------------------------
  // Panel navigation helper
  // ------------------------------------------
  let targetIdx = 0; // tracks intended destination, not scroll position

  function updateProgress(idx) {
    const value = idx / (panels.length - 1);
    const rotation = -45 * Math.pow(Math.sin(value * Math.PI), 4.64);
    document.documentElement.style.setProperty("--progress", value);
    document.documentElement.style.setProperty("--bike-rotation", `${rotation.toFixed(2)}deg`);
  }

  function goToPanel(index) {
    targetIdx = Math.max(0, Math.min(panels.length - 1, index));
    updateProgress(targetIdx);
    panels[targetIdx].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  // ------------------------------------------
  // Hash / deeplink helpers
  // ------------------------------------------
  function panelIndexForHash(hash) {
    if (!hash) return -1;
    const id = hash.replace(/^#/, "");
    return panels.findIndex((p) => p.id === id);
  }

  function updateHash(idx) {
    const id = panels[idx]?.id;
    if (!id) return;
    const hash = idx === 0 ? " " : `#${id}`;
    history.replaceState(null, "", hash.trim() || location.pathname);
  }

  // ------------------------------------------
  // Navigation dots — sync via IntersectionObserver
  // ------------------------------------------
  const panelObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = panels.indexOf(entry.target);
          dots.forEach((dot, i) => dot.classList.toggle("active", i === idx));
          bottomDots.forEach((dot, i) => dot.classList.toggle("active", i === idx));
          updateProgress(idx);
          updateHash(idx);
        }
      });
    },
    { root: scrollContainer, threshold: 0.5 },
  );

  panels.forEach((panel) => panelObserver.observe(panel));

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => goToPanel(i));
  });

  bottomDots.forEach((dot, i) => {
    dot.addEventListener("click", () => goToPanel(i));
  });

  // Keep targetIdx in sync when user swipes (mobile) or uses scrollbar
  scrollContainer.addEventListener("scrollend", () => {
    targetIdx = Math.round(scrollContainer.scrollLeft / window.innerWidth);
  });

  // ------------------------------------------
  // Wheel — redirect vertical scroll to horizontal
  // Steps one panel at a time; debounced so it
  // doesn't skip panels on fast wheels/trackpads.
  // ------------------------------------------
  let wheelLocked = false;

  scrollContainer.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (wheelLocked) return;

      // Use whichever axis has more movement
      const delta = Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 5) return; // ignore micro-movements

      // If the current panel is taller than the viewport and the scroll is
      // primarily vertical, scroll it down/up before moving to the next panel.
      const currentPanel = panels[targetIdx];
      const panelOverflows = currentPanel.scrollHeight > currentPanel.clientHeight + 1;
      if (panelOverflows && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        const atBottom = currentPanel.scrollTop >= currentPanel.scrollHeight - currentPanel.clientHeight - 1;
        const atTop = currentPanel.scrollTop <= 0;
        if ((delta > 0 && !atBottom) || (delta < 0 && !atTop)) {
          currentPanel.scrollBy({ top: delta, behavior: "smooth" });
          return;
        }
      }

      wheelLocked = true;
      goToPanel(targetIdx + (delta > 0 ? 1 : -1));
      setTimeout(() => {
        wheelLocked = false;
      }, 800);
    },
    { passive: false },
  );

  // ------------------------------------------
  // Keyboard — arrow keys
  // ------------------------------------------
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goToPanel(targetIdx + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goToPanel(targetIdx - 1);
    }
  });

  // ------------------------------------------
  // Deeplink — jump to hash on load (instant)
  // ------------------------------------------
  const initialIdx = panelIndexForHash(location.hash);
  if (initialIdx > 0) {
    panels[initialIdx].scrollIntoView({ behavior: "instant", inline: "start", block: "nearest" });
    targetIdx = initialIdx;
    updateProgress(initialIdx);
  }

  // Browser back / forward
  window.addEventListener("popstate", () => {
    const idx = panelIndexForHash(location.hash);
    if (idx >= 0) goToPanel(idx);
  });

  // ------------------------------------------
  // Hero entrance animation
  // ------------------------------------------
  const heroTitle = document.querySelectorAll(".hero-title-line");
  const heroSub = document.querySelector(".hero-subtitle");

  const heroTl = gsap.timeline({ delay: 0.3 });

  heroTl.from(heroTitle, {
    y: 60,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: "power3.out",
  });

  if (heroSub) {
    heroTl.from(heroSub, { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }
})();
