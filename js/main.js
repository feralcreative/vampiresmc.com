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
  let overscrollAccum = 0; // accumulated delta past panel boundary before flipping

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
          // Direct assignment — no smooth, so rapid trackpad events feel native
          // and scrollTop stays in sync for accurate atBottom/atTop checks.
          currentPanel.scrollTop += delta;
          overscrollAccum = 0;
          return;
        }
        // At the boundary — require deliberate overscroll before flipping panel.
        overscrollAccum += Math.abs(delta);
        if (overscrollAccum < 200) return;
      }

      overscrollAccum = 0;
      wheelLocked = true;
      goToPanel(targetIdx + (delta > 0 ? 1 : -1));
      setTimeout(() => {
        wheelLocked = false;
      }, 800);
    },
    { passive: false },
  );

  // ------------------------------------------
  // Touch — vertical swipe navigates panels,
  // mirrors wheel handler overflow behaviour
  // ------------------------------------------
  let touchStartX = 0;
  let touchStartY = 0;
  let touchPanelScrollStart = 0;

  scrollContainer.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchPanelScrollStart = panels[targetIdx].scrollTop;
  }, { passive: true });

  scrollContainer.addEventListener("touchmove", (e) => {
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dy) <= Math.abs(dx)) return; // horizontal — leave to native
    e.preventDefault(); // block native vertical scroll on the container
    const panel = panels[targetIdx];
    if (panel.scrollHeight > panel.clientHeight + 1) {
      panel.scrollTop = Math.max(
        0,
        Math.min(panel.scrollHeight - panel.clientHeight, touchPanelScrollStart - dy)
      );
    }
  }, { passive: false });

  scrollContainer.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 40) return; // tap, not a swipe
    if (Math.abs(dx) >= Math.abs(dy)) return; // horizontal — native handles it

    const panel = panels[targetIdx];
    const overflows = panel.scrollHeight > panel.clientHeight + 1;
    if (overflows) {
      const atBottom = panel.scrollTop >= panel.scrollHeight - panel.clientHeight - 1;
      const atTop = panel.scrollTop <= 0;
      if (dy < 0 && !atBottom) return; // still content below
      if (dy > 0 && !atTop) return;    // still content above
    }

    goToPanel(targetIdx + (dy < 0 ? 1 : -1));
  }, { passive: true });

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
  // Background image slideshows — hardcoded per section
  // ------------------------------------------
  const SLIDESHOW_INTERVAL = 6000; // ms between crossfades

  const HERO_MANIFEST = {
    home:    ["vmc-hero-03-home.jpg","vmc-hero-04-home.jpg","vmc-hero-18-home.jpg","vmc-hero-19-home.jpg","vmc-hero-23-home.jpg"],
    about:   ["vmc-hero-06-about.jpg","vmc-hero-09-about.jpg","vmc-hero-12-about.jpg","vmc-hero-14-about.jpg","vmc-hero-15-about.jpg"],
    events:  ["vmc-hero-08-events.jpg","vmc-hero-10-events.jpg","vmc-hero-11-events.jpg","vmc-hero-20-events.jpg"],
    fans:    ["vmc-hero-01-fans.jpg","vmc-hero-05-fans.jpg","vmc-hero-17-fans.jpg"],
    contact: ["vmc-hero-16-contact.jpg"],
  };

  [...document.querySelectorAll(".panel-bg[data-slideshow]")].forEach((bg) => {
    const section = bg.dataset.slideshow;
    const files = HERO_MANIFEST[section] || [];
    if (files.length === 0) return;

    // Populate the container with one <img> per file. First image
    // gets `.active`; first is eager, the rest lazy.
    const frag = document.createDocumentFragment();
    files.forEach((file, idx) => {
      const img = document.createElement("img");
      img.src = `images/heroes/${section}/${file}`;
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.loading = idx === 0 ? "eager" : "lazy";
      if (idx === 0) img.className = "active";
      frag.appendChild(img);
    });
    bg.appendChild(frag);

    // Single-image sections stay static.
    if (files.length < 2) return;

    const imgs = [...bg.querySelectorAll("img")];
    let current = 0;
    setInterval(() => {
      imgs[current].classList.remove("active");
      current = (current + 1) % imgs.length;
      imgs[current].classList.add("active");
    }, SLIDESHOW_INTERVAL);
  });

  // ------------------------------------------
  // Events — render from events.json
  // ------------------------------------------
  // Fetches a same-origin JSON file, filters out events whose end date
  // has already passed, sorts chronologically, and renders into the
  // existing .event-cards grid. Empty state shows when no upcoming
  // events remain (handled via a sibling [data-events-empty] element).
  //
  // Event schema (events.json is an array of these):
  //   {
  //     "title":        "32nd Annual Rally",
  //     "startDate":    "2026-06-12",          // ISO YYYY-MM-DD (local)
  //     "endDate":      "2026-06-14",          // optional; defaults to startDate
  //     "startTime":    "17:00",               // 24h HH:MM, local (America/Los_Angeles)
  //     "ksuTime":      "19:30",               // optional; display-only "kick stands up"
  //     "endTime":      "12:00",               // 24h HH:MM, local
  //     "locationName": "Harvey West Park",    // optional; venue/meeting point name
  //     "location":     "123 Main St, …",      // street address of meeting point
  //     "description":  "…",                   // optional, 1–2 sentences
  //     "url":          "https://…"            // optional; "More Info" link
  //   }
  const EVENTS_LIMIT = 6;
  const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Parse "YYYY-MM-DD" as a *local* date to avoid UTC midnight off-by-one.
  function parseLocalDate(iso) {
    if (!iso || typeof iso !== "string") return null;
    const parts = iso.split("-").map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function formatDateRange(start, end) {
    if (!start) return "";
    if (!end || end.getTime() === start.getTime()) {
      return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
    }
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    }
    if (sameYear) {
      return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} – ${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }

  // "19:00" -> "7:00 PM". Returns "" for invalid input.
  function formatTime12(hhmm) {
    if (!hhmm || typeof hhmm !== "string") return "";
    const [h, m] = hhmm.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return "";
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  }

  // ("2026-06-12", "17:00") -> "20260612T170000". Naked datetime (no Z),
  // consumed with an explicit TZID (ICS) or ctz parameter (Google).
  function toCalDateTime(dateIso, timeHhmm) {
    const date = (dateIso || "").replace(/-/g, "");
    const time = (timeHhmm || "00:00").replace(":", "") + "00";
    return `${date}T${time}`;
  }

  // RFC 5545 text escaping for ICS field values.
  function escapeIcs(text) {
    if (!text) return "";
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  // RFC 5545 §3.1 line folding: lines >75 octets split with CRLF + space.
  function foldIcsLine(line) {
    if (line.length <= 75) return line;
    const chunks = [];
    let i = 0;
    while (i < line.length) {
      chunks.push((i === 0 ? "" : " ") + line.slice(i, i + (i === 0 ? 75 : 74)));
      i += i === 0 ? 75 : 74;
    }
    return chunks.join("\r\n");
  }

  // "Harvey West Park, 123 Main St, …" — whichever fields exist.
  function formatLocation(evt) {
    const parts = [];
    if (evt.locationName) parts.push(evt.locationName);
    if (evt.location) parts.push(evt.location);
    return parts.join(", ");
  }

  // URL-safe slug for filenames and UIDs.
  function slugify(text) {
    return String(text || "event")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "event";
  }

  // Calendar event titles are namespaced so they're recognizable in a
  // crowded calendar. Card display titles are unchanged.
  function calTitle(evt) {
    return `Vampires MC - ${evt.title || "Event"}`;
  }

  function buildGoogleCalUrl(evt) {
    const start = toCalDateTime(evt.startDate, evt.startTime);
    const end = toCalDateTime(evt.endDate || evt.startDate, evt.endTime);
    const details = [evt.description, evt.url].filter(Boolean).join("\n\n");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: calTitle(evt),
      dates: `${start}/${end}`,
      details,
      location: formatLocation(evt),
      ctz: "America/Los_Angeles",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function buildIcsDataUrl(evt) {
    const start = toCalDateTime(evt.startDate, evt.startTime);
    const end = toCalDateTime(evt.endDate || evt.startDate, evt.endTime);
    const uid = `${slugify(evt.title)}-${evt.startDate || ""}@vampiresmc.com`;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const dtstamp =
      `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
      `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Vampires MC//vampiresmc.com//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;TZID=America/Los_Angeles:${start}`,
      `DTEND;TZID=America/Los_Angeles:${end}`,
      `SUMMARY:${escapeIcs(calTitle(evt))}`,
      `DESCRIPTION:${escapeIcs(evt.description || "")}${evt.url ? `\\n\\n${escapeIcs(evt.url)}` : ""}`,
      `LOCATION:${escapeIcs(formatLocation(evt))}`,
    ];
    if (evt.url) lines.push(`URL:${evt.url}`);
    lines.push("END:VEVENT", "END:VCALENDAR");
    const ics = lines.map(foldIcsLine).join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  }

  function renderEventCard(evt) {
    const start = parseLocalDate(evt.startDate);
    const end = parseLocalDate(evt.endDate) || start;
    const card = document.createElement("div");
    card.className = "event-card";
    const body = document.createElement("div");
    body.className = "event-card-body";

    const title = document.createElement("h3");
    title.className = "event-card-title";
    title.textContent = evt.title || "Untitled event";
    body.appendChild(title);

    const date = document.createElement("p");
    date.className = "event-card-date";
    date.textContent = formatDateRange(start, end);
    body.appendChild(date);

    const displayName = evt.locationName || evt.location;
    if (displayName) {
      const locName = document.createElement("p");
      locName.className = "event-card-location-name";
      if (evt.location) {
        const mapLink = document.createElement("a");
        mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}`;
        mapLink.target = "_blank";
        mapLink.rel = "noopener noreferrer";
        mapLink.textContent = displayName;
        locName.appendChild(mapLink);
      } else {
        locName.textContent = displayName;
      }
      body.appendChild(locName);
    }

    if (evt.startTime) {
      const ksu = document.createElement("p");
      ksu.className = "event-card-ksu";
      const meet = formatTime12(evt.startTime);
      ksu.textContent = evt.ksuTime
        ? `Meet ${meet} · KSU ${formatTime12(evt.ksuTime)}`
        : `Meet ${meet}`;
      body.appendChild(ksu);
    }

    if (evt.description) {
      const desc = document.createElement("p");
      desc.className = "event-card-desc";
      desc.textContent = evt.description;
      body.appendChild(desc);
    }

    const actions = document.createElement("div");
    actions.className = "event-card-actions";

    if (evt.url) {
      const link = document.createElement("a");
      link.className = "btn btn-primary";
      link.href = evt.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "More Info";
      actions.appendChild(link);
    }

    if (evt.startTime && evt.endTime && evt.startDate) {
      const details = document.createElement("details");
      details.className = "event-card-cal";

      const summary = document.createElement("summary");
      summary.className = "btn btn-primary";
      summary.setAttribute("aria-label", "Add to calendar");
      summary.title = "Add to calendar";
      const icon = document.createElement("i");
      icon.className = "fa-regular fa-calendar-plus";
      icon.setAttribute("aria-hidden", "true");
      summary.appendChild(icon);
      details.appendChild(summary);

      const menu = document.createElement("div");
      menu.className = "event-card-cal-menu";
      menu.hidden = true;

      const gcal = document.createElement("a");
      gcal.href = buildGoogleCalUrl(evt);
      gcal.target = "_blank";
      gcal.rel = "noopener noreferrer";
      gcal.textContent = "Google Calendar";
      menu.appendChild(gcal);

      const icsUrl = buildIcsDataUrl(evt);
      const icsName = `vampiresmc-${slugify(evt.title)}.ics`;

      const apple = document.createElement("a");
      apple.href = icsUrl;
      apple.download = icsName;
      apple.textContent = "Apple Calendar";
      menu.appendChild(apple);

      const outlook = document.createElement("a");
      outlook.href = icsUrl;
      outlook.download = icsName;
      outlook.textContent = "Outlook";
      menu.appendChild(outlook);

      // Append menu to <body> so it escapes all stacking contexts
      // (backdrop-filter on .event-card creates a containing block
      // that traps position:fixed children).
      document.body.appendChild(menu);

      details.addEventListener("toggle", () => {
        if (details.open) {
          const r = summary.getBoundingClientRect();
          menu.style.top = `${r.bottom + 4}px`;
          menu.style.right = `${window.innerWidth - r.right}px`;
          menu.style.left = "auto";
          menu.hidden = false;
        } else {
          menu.hidden = true;
        }
      });

      actions.appendChild(details);
    }

    if (actions.childNodes.length > 0) body.appendChild(actions);

    card.appendChild(body);
    return card;
  }

  (async () => {
    const listEl = document.querySelector("[data-events-list]");
    const emptyEl = document.querySelector("[data-events-empty]");
    if (!listEl) return;

    const showEmpty = () => {
      if (emptyEl) emptyEl.hidden = false;
    };

    try {
      const res = await fetch("events.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(`events.json ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("events.json must be an array");

      // Filter to events whose end date is today or later, sort ascending.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = data
        .map((evt) => {
          const start = parseLocalDate(evt.startDate);
          const end = parseLocalDate(evt.endDate) || start;
          return { evt, start, end };
        })
        .filter(({ start, end }) => start && end && end >= today)
        .sort((a, b) => a.start - b.start)
        .slice(0, EVENTS_LIMIT);

      if (upcoming.length === 0) {
        showEmpty();
        return;
      }

      const frag = document.createDocumentFragment();
      upcoming.forEach(({ evt }) => frag.appendChild(renderEventCard(evt)));
      listEl.appendChild(frag);

      // Close any open calendar dropdown when clicking outside it.
      // Menu lives in <body>, so check both the <details> and the menu.
      // Use mousedown instead of click so the handler fires before the
      // summary's default toggle action, avoiding a race where the same
      // click opens the details then immediately closes it.
      document.addEventListener("mousedown", (e) => {
        listEl.querySelectorAll(".event-card-cal[open]").forEach((d) => {
          const menu = document.body.querySelector(".event-card-cal-menu:not([hidden])");
          if (!d.contains(e.target) && (!menu || !menu.contains(e.target))) {
            d.open = false;
          }
        });
      });
    } catch (_) {
      showEmpty();
    }
  })();

  // ------------------------------------------
  // Discord — live member count (gated to >= 10 online)
  // ------------------------------------------
  // Fetches Discord's public widget.json and animates the online count
  // into place via GSAP. Hidden entirely below the threshold so small
  // numbers never undersell the club.
  const DISCORD_GUILD_ID = "1482893284711076042";
  const DISCORD_INVITE_URL = "https://discord.gg/5wqFRxqzxN";
  const DISCORD_COUNT_THRESHOLD = 10;

  (async () => {
    const countEl = document.querySelector("[data-discord-count]");
    const countWrap = document.querySelector("[data-discord-count-wrap]");
    if (!countEl || !countWrap) return;
    try {
      const res = await fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`);
      if (!res.ok) return;
      const data = await res.json();
      const target = data.presence_count || 0;
      if (target < DISCORD_COUNT_THRESHOLD) return;
      countWrap.hidden = false;
      const proxy = { n: 0 };
      gsap.to(proxy, {
        n: target,
        duration: 1.4,
        ease: "power2.out",
        onUpdate() {
          countEl.textContent = Math.round(proxy.n);
        },
      });
    } catch (_) {
      /* silent — counter stays hidden on network/API failure */
    }
  })();

  // ------------------------------------------
  // Discord — desktop→mobile QR handoff
  // ------------------------------------------
  // Renders a QR code for the permanent Discord invite into the card's
  // QR slot. Hidden via CSS below the md breakpoint. Depends on the
  // node-qrcode browser build loaded via CDN in index.html (global
  // `QRCode` with a Promise-returning `toString` method).
  (function renderDiscordQr() {
    const slot = document.querySelector("[data-discord-qr]");
    if (!slot) return;
    if (typeof QRCode === "undefined" || typeof QRCode.toString !== "function") return;
    QRCode.toString(
      DISCORD_INVITE_URL,
      {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 0,
        color: { dark: "#0b0b0b", light: "#ffffff" },
      },
      (err, svg) => {
        if (err || !svg) return;
        const caption = slot.querySelector(".discord-card__qr-caption");
        slot.insertAdjacentHTML("afterbegin", svg);
        if (caption) slot.appendChild(caption);
      },
    );
  })();

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
