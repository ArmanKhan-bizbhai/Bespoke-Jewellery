/* Bespoke Jewellery "Rani & Marigold": behaviour and motion.
 *
 * Two layers. The base layer (menu, anchors, collection, bag, offers deck,
 * occasion edits) works with no GSAP and no motion. The motion layer runs only
 * when GSAP and ScrollTrigger loaded and the visitor has not asked for reduced
 * motion. It owns the .motion start states in CSS, so a missing library can
 * never leave content hidden.
 */
(() => {
  "use strict";

  const root = document.documentElement;
  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const motion = !!(window.gsap && window.ScrollTrigger) && !reduceQuery.matches;

  /* Tell the inline head guard the script arrived, then take over the start states. */
  window.__aurelleReady = true;
  if (motion) gsap.registerPlugin(ScrollTrigger);
  else root.classList.remove("motion", "first-visit");

  const firstVisit = root.classList.contains("first-visit");
  try { sessionStorage.setItem("aurelle3:intro", "1"); } catch (_) { /* private mode is fine */ }

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const mod = (n, m) => ((n % m) + m) % m;
  const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

  const header = $(".site-header");
  const main = $("#main");
  const footer = $(".site-footer");
  const waFloat = $(".wa-float");

  /* ------------------------------------------------------------------ *
   * WhatsApp: one number for every chat link. It is a placeholder until the
   * business number is known; the markup carries the same number as a
   * fallback href, so replace both.
   * ------------------------------------------------------------------ */
  const WHATSAPP_NUMBER = "917906044943";
  const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  for (const link of $$("a[data-wa]")) link.href = waLink(link.dataset.wa);

  /* A swipe is at least 50px across and more across than down, so ordinary
     scrolling is never taken for one. */
  function onHorizontalSwipe(element, handler) {
    if (!element) return;
    let start = null;
    element.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      start = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    element.addEventListener("touchend", (event) => {
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = null;
      if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) handler(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* Counters roll: the old value leaves upwards, the new one rises in. A roll
     in progress simply lands on the latest value. */
  function rollNumber(el, value) {
    if (!el) return;
    const text = String(value);
    el.dataset.target = text;
    if (el.dataset.rolling === "1") return;
    if (el.textContent === text) return;
    if (!motion || !el.animate) { el.textContent = text; return; }
    el.dataset.rolling = "1";
    const out = el.animate(
      [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-100%)", opacity: 0 }],
      { duration: 160, easing: "ease-in" }
    );
    out.onfinish = () => {
      el.textContent = el.dataset.target;
      const back = el.animate(
        [{ transform: "translateY(100%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
        { duration: 460, easing: EASE_OUT }
      );
      back.onfinish = () => {
        el.dataset.rolling = "0";
        if (el.textContent !== el.dataset.target) rollNumber(el, el.dataset.target);
      };
    };
  }

  function setInert(on) {
    for (const region of [main, footer, waFloat]) if (region) region.inert = on;
  }

  /* ------------------------------------------------------------------ *
   * Anchors
   * ------------------------------------------------------------------ */
  function scrollToTarget(target) {
    const offset = (header ? header.offsetHeight : 0) + 10;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceQuery.matches ? "auto" : "smooth" });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute("href");
    if (hash.length < 2) return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    closeMenu();
    scrollToTarget(target);
    history.replaceState(null, "", hash);
  });

  /* ------------------------------------------------------------------ *
   * Header: a tinted bar with its garland once the page moves; it steps
   * away going down and returns going up.
   * ------------------------------------------------------------------ */
  let menuOpen = false;
  let bagOpen = false;
  let lastScroll = window.scrollY;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-stuck", y > 24);
    const delta = y - lastScroll;
    if (Math.abs(delta) < 8) return;
    if (!reduceQuery.matches && !menuOpen && !bagOpen) {
      if (delta > 0 && y > 360) header.classList.add("is-hidden");
      else if (delta < 0) header.classList.remove("is-hidden");
    }
    lastScroll = y;
  }

  function showHeader() {
    header.classList.remove("is-hidden");
    lastScroll = window.scrollY;
  }

  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* The marigold dot follows the section in the middle of the screen. */
  const navLinks = $$(".nav-link[data-section]");
  if ("IntersectionObserver" in window) {
    const watcher = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const link = navLinks.find((item) => item.dataset.section === entry.target.id);
        if (link) link.classList.toggle("is-current", entry.isIntersecting);
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    for (const link of navLinks) {
      const section = document.getElementById(link.dataset.section);
      if (section) watcher.observe(section);
    }
  }

  /* ------------------------------------------------------------------ *
   * Phone menu
   * ------------------------------------------------------------------ */
  const menuButton = $(".menu-toggle");
  const navigation = $(".primary-navigation");
  const menuLabel = $(".menu-toggle-label");
  let menuTimer = 0;

  function openMenu() {
    if (!menuButton || !navigation || menuOpen) return;
    menuOpen = true;
    clearTimeout(menuTimer);
    showHeader();
    menuButton.setAttribute("aria-expanded", "true");
    navigation.classList.add("is-open");
    header.classList.add("has-menu");
    root.classList.add("menu-open", "is-locked");
    if (menuLabel) menuLabel.textContent = "Close";
    setInert(true);
    const first = navigation.querySelector("a");
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 220);
  }

  function closeMenu(returnFocus) {
    if (!menuButton || !navigation || !menuOpen) return;
    menuOpen = false;
    menuButton.setAttribute("aria-expanded", "false");
    navigation.classList.remove("is-open");
    root.classList.remove("menu-open", "is-locked");
    if (menuLabel) menuLabel.textContent = "Menu";
    menuTimer = setTimeout(() => { if (!menuOpen) header.classList.remove("has-menu"); }, 760);
    setInert(false);
    if (returnFocus) menuButton.focus();
  }

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => (menuOpen ? closeMenu(true) : openMenu()));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && menuOpen) closeMenu(true); });
    matchMedia("(min-width: 900px)").addEventListener("change", (event) => { if (event.matches) closeMenu(); });
  }

  /* ------------------------------------------------------------------ *
   * Collection: search, filters, saved pieces
   * ------------------------------------------------------------------ */
  const cards = $$(".product");
  const grid = $("#product-grid");
  const search = $("#catalog-search");
  const filterList = $(".filter-list");
  const filterButtons = $$("[data-filter]");
  const filterMarker = $(".filter-marker");
  const savedOnly = $("#saved-only");
  const resultCount = $("#result-count");
  const empty = $("#catalog-empty");
  const savedCountValue = $("#saved-count");
  const savedBadge = savedCountValue ? savedCountValue.closest(".count-badge") : null;
  const savedNav = $(".saved-nav");
  const SAVED_KEY = "aurelle3:saved:v1";
  const validIds = new Set(cards.map((card) => card.dataset.id));
  let saved = new Set();
  let category = "All";
  let revealProducts = null; // supplied by the motion layer

  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    if (Array.isArray(stored)) saved = new Set(stored.filter((id) => validIds.has(id)));
  } catch (_) { /* storage can be blocked; saving then lasts for this visit */ }

  function updateSavedControls() {
    rollNumber(savedCountValue, saved.size);
    if (savedBadge) savedBadge.classList.toggle("is-filled", saved.size > 0);
    if (savedNav) savedNav.setAttribute("aria-label", saved.size === 1 ? "Browse saved pieces, 1 saved" : `Browse saved pieces, ${saved.size} saved`);
    for (const button of $$("[data-save]")) {
      const active = saved.has(button.dataset.save);
      const name = $(".product-name", button.closest(".product")).textContent;
      const label = $(".save-label", button);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", active ? `Remove ${name} from saved pieces` : `Save ${name}`);
      if (label) label.textContent = active ? "Saved" : "Save";
    }
  }

  function placeMarker() {
    const active = filterButtons.find((button) => button.classList.contains("is-active"));
    if (!active || !filterMarker) return;
    filterMarker.style.setProperty("--marker-x", `${active.offsetLeft}px`);
    filterMarker.style.setProperty("--marker-w", `${active.offsetWidth}px`);
  }

  /* Scrolls only the filter row, never the page. */
  function keepFilterInView(button) {
    if (!filterList || filterList.scrollWidth <= filterList.clientWidth) return;
    const start = button.offsetLeft - 24;
    const end = button.offsetLeft + button.offsetWidth + 24 - filterList.clientWidth;
    let left = null;
    if (filterList.scrollLeft > start) left = start;
    else if (filterList.scrollLeft < end) left = end;
    if (left !== null) filterList.scrollTo({ left: Math.max(0, left), behavior: reduceQuery.matches ? "auto" : "smooth" });
  }

  function setCategory(next) {
    category = next;
    for (const button of filterButtons) {
      const active = button.dataset.filter === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      if (active) keepFilterInView(button);
    }
    placeMarker();
  }

  function matchesFilters(card, query) {
    const byCategory = category === "All" || card.dataset.category === category;
    const bySearch = !query || card.dataset.search.toLocaleLowerCase().includes(query);
    const bySaved = !savedOnly.checked || saved.has(card.dataset.id);
    return byCategory && bySearch && bySaved;
  }

  function applyFilters() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of cards) {
      const show = matchesFilters(card, query);
      card.classList.toggle("is-filtered-out", !show);
      if (show) visible += 1;
    }
    resultCount.textContent = `Showing ${visible} ${visible === 1 ? "piece" : "pieces"}`;
    empty.hidden = visible !== 0;
  }

  /* The grid's height changes, and the pinned sections below depend on it. */
  let refreshTimer = 0;
  function refreshLayout() {
    if (!motion) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 160);
  }

  /* Filtering glides the cards to their new places with a view transition,
     where the browser has one. */
  function updateResults({ animate = true } = {}) {
    if (revealProducts) revealProducts();
    if (animate && motion && document.startViewTransition) {
      for (const card of cards) card.style.viewTransitionName = `piece-${card.dataset.id}`;
      const transition = document.startViewTransition(applyFilters);
      transition.finished.finally(() => {
        for (const card of cards) card.style.viewTransitionName = "";
        refreshLayout();
      });
    } else {
      applyFilters();
      refreshLayout();
    }
  }

  function burstPetals(button) {
    if (!motion || !button.animate) return;
    const bounds = button.getBoundingClientRect();
    const cx = bounds.left + bounds.width / 2 - 4.5;
    const cy = bounds.top + bounds.height / 2 - 6.5;
    const colours = ["var(--rani)", "var(--marigold)", "var(--rani-soft)"];
    for (let i = 0; i < 9; i += 1) {
      const petal = document.createElement("span");
      petal.className = "petal";
      petal.style.background = colours[i % colours.length];
      document.body.appendChild(petal);
      const angle = (i / 9) * Math.PI * 2 - Math.PI / 2;
      const reach = 34 + Math.random() * 20;
      const dx = Math.cos(angle) * reach;
      const dy = Math.sin(angle) * reach;
      const turn = (angle * 180) / Math.PI + 90;
      const flight = petal.animate([
        { transform: `translate(${cx}px, ${cy}px) rotate(${turn}deg) scale(0.3)`, opacity: 1 },
        { transform: `translate(${cx + dx}px, ${cy + dy}px) rotate(${turn}deg) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${cx + dx * 1.25}px, ${cy + dy * 1.25 + 16}px) rotate(${turn + 50}deg) scale(0.6)`, opacity: 0 }
      ], { duration: 720 + Math.random() * 220, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" });
      flight.onfinish = () => petal.remove();
      flight.oncancel = () => petal.remove();
    }
  }

  function toggleSaved(button) {
    const id = button.dataset.save;
    const adding = !saved.has(id);
    if (adding) saved.add(id); else saved.delete(id);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify([...saved])); } catch (_) { /* session only */ }
    updateSavedControls();
    if (!reduceQuery.matches) {
      button.classList.remove("is-toggling");
      void button.offsetWidth; // restart the pop on a quick second tap
      button.classList.add("is-toggling");
      button.addEventListener("animationend", () => button.classList.remove("is-toggling"), { once: true });
      if (adding) burstPetals(button);
    }
    if (savedOnly.checked) updateResults();
  }

  for (const button of filterButtons) {
    button.addEventListener("click", () => {
      if (button.dataset.filter === category) return;
      setCategory(button.dataset.filter);
      updateResults();
    });
  }
  search.addEventListener("input", () => updateResults({ animate: false }));
  savedOnly.addEventListener("change", () => updateResults());
  $("#clear-filters").addEventListener("click", () => {
    search.value = "";
    savedOnly.checked = false;
    setCategory("All");
    updateResults();
    search.focus();
  });

  /* Shortcuts elsewhere on the page scroll to the collection, so they filter
     without the glide (the page is moving anyway). */
  for (const link of $$("[data-select-category]")) {
    link.addEventListener("click", () => {
      search.value = "";
      savedOnly.checked = false;
      setCategory(link.dataset.selectCategory);
      updateResults({ animate: false });
    });
  }
  if (savedNav) {
    savedNav.addEventListener("click", () => {
      search.value = "";
      savedOnly.checked = true;
      setCategory("All");
      updateResults({ animate: false });
    });
  }

  function updateFilterFade() {
    if (!filterList) return;
    filterList.classList.toggle("has-less", filterList.scrollLeft > 2);
    filterList.classList.toggle("has-more", filterList.scrollLeft + filterList.clientWidth < filterList.scrollWidth - 2);
  }

  if (filterList) filterList.addEventListener("scroll", updateFilterFade, { passive: true });
  addEventListener("resize", () => { placeMarker(); updateFilterFade(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { placeMarker(); updateFilterFade(); }).catch(() => {});
  }
  updateFilterFade();

  updateSavedControls();
  setCategory("All");
  applyFilters();

  /* ------------------------------------------------------------------ *
   * The bag: it remembers pieces on this device, and that is all. No
   * prices, no order, no checkout; the list goes to WhatsApp.
   * ------------------------------------------------------------------ */
  const bagButton = $(".bag-nav");
  const bagPanel = $("#bag-panel");
  const bagScrim = $(".bag-scrim");
  const bagList = $("#bag-items");
  const bagEmpty = $("#bag-empty");
  const bagCountValue = $("#bag-count");
  const bagBadge = bagCountValue ? bagCountValue.closest(".count-badge") : null;
  const bagClose = $(".bag-close");
  const bagRequest = $(".bag-request");
  const BAG_KEY = "aurelle3:bag:v1";
  const pieces = new Map(cards.map((card) => {
    const image = $(".product-media img", card);
    return [card.dataset.id, {
      id: card.dataset.id,
      name: $(".product-name", card).textContent,
      category: card.dataset.category,
      image: image.getAttribute("src"),
      alt: image.getAttribute("alt")
    }];
  }));
  let bag = new Map();
  let bagReturnFocus = null;
  let bagTimer = 0;

  try {
    const stored = JSON.parse(localStorage.getItem(BAG_KEY) || "[]");
    if (Array.isArray(stored)) {
      for (const entry of stored) {
        if (entry && pieces.has(entry.id)) bag.set(entry.id, Math.min(9, Math.max(1, Number(entry.quantity) || 1)));
      }
    }
  } catch (_) { /* storage can be blocked; the bag then lasts for this visit */ }

  /* Rows are built from the page's own markup, but escaped anyway. */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]
    ));
  }

  function saveBag() {
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify([...bag].map(([id, quantity]) => ({ id, quantity }))));
    } catch (_) { /* session only */ }
  }

  function bagSize() {
    let total = 0;
    for (const quantity of bag.values()) total += quantity;
    return total;
  }

  function renderBag({ stagger = false } = {}) {
    const total = bagSize();
    rollNumber(bagCountValue, total);
    if (bagBadge) bagBadge.classList.toggle("is-filled", total > 0);
    if (bagButton) {
      bagButton.setAttribute("aria-label", total === 0
        ? "Open your bag, empty"
        : `Open your bag, ${total} ${total === 1 ? "piece" : "pieces"}`);
    }
    bagEmpty.hidden = total > 0;
    bagList.innerHTML = "";
    for (const [id, quantity] of bag) {
      const piece = pieces.get(id);
      const name = escapeHtml(piece.name);
      const key = escapeHtml(id);
      const item = document.createElement("li");
      item.className = "bag-item";
      item.innerHTML = `
        <img src="${escapeHtml(piece.image)}" alt="${escapeHtml(piece.alt)}" width="64" height="80" loading="lazy" decoding="async">
        <div class="bag-item-body">
          <span class="bag-item-category">${escapeHtml(piece.category)}</span>
          <span class="bag-item-name">${name}</span>
          <div class="bag-item-controls">
            <span class="quantity">
              <button type="button" data-step="-1" data-piece="${key}" aria-label="Remove one ${name}"${quantity <= 1 ? " disabled" : ""}><svg class="icon" aria-hidden="true"><use href="#i-minus" /></svg></button>
              <span class="quantity-value" aria-label="${quantity} in bag">${quantity}</span>
              <button type="button" data-step="1" data-piece="${key}" aria-label="Add one ${name}"${quantity >= 9 ? " disabled" : ""}><svg class="icon" aria-hidden="true"><use href="#i-plus" /></svg></button>
            </span>
            <button class="bag-remove" type="button" data-remove="${key}">Remove</button>
          </div>
        </div>`;
      bagList.appendChild(item);
    }
    if (bagRequest) {
      const lines = [...bag].map(([id, quantity]) => `• ${pieces.get(id).name} × ${quantity}`);
      bagRequest.href = waLink(lines.length
        ? `Hello Bespoke Jewellery, I'd like to book an appointment to see:\n${lines.join("\n")}`
        : bagRequest.dataset.wa);
    }
    for (const button of $$("[data-add]")) {
      const quantity = bag.get(button.dataset.add) || 0;
      const label = $(".add-label", button);
      if (!label || button.dataset.confirming === "1") continue;
      label.textContent = quantity > 1 ? `Add another (${quantity})` : "Add to bag";
      button.classList.toggle("is-added", quantity > 0);
    }
    if (stagger && motion && bagList.animate) {
      [...bagList.children].forEach((row, i) => {
        row.animate(
          [{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }],
          { duration: 600, delay: 140 + i * 60, easing: EASE_OUT, fill: "backwards" }
        );
      });
    }
  }

  /* The photo arcs up and drops into the bag, which gives a little shake. */
  function flyToBag(card) {
    if (!motion || !bagBadge || !card) return;
    const source = $(".product-media img", card);
    if (!source || !source.animate) return;
    const wasHidden = header.classList.contains("is-hidden");
    showHeader();
    const from = source.getBoundingClientRect();
    const to = bagBadge.getBoundingClientRect();
    const size = Math.min(from.width, 150);
    const height = size * 1.25;
    const sx = from.left + from.width / 2 - size / 2;
    const sy = from.top + from.height / 2 - height / 2;
    const ex = to.left + to.width / 2 - size / 2;
    const ey = to.top + to.height / 2 - height / 2 + (wasHidden ? header.offsetHeight : 0);
    const apexY = Math.max(10, Math.min(sy, ey) - 90);
    const ghost = document.createElement("img");
    ghost.className = "bag-fly";
    ghost.alt = "";
    ghost.src = source.currentSrc || source.src;
    ghost.style.width = `${size}px`;
    ghost.style.height = `${height}px`;
    document.body.appendChild(ghost);
    const flight = ghost.animate([
      { transform: `translate(${sx}px, ${sy}px) scale(1) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${(sx + ex) / 2}px, ${apexY}px) scale(0.55) rotate(-14deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${ex}px, ${ey}px) scale(0.1) rotate(10deg)`, opacity: 0.3 }
    ], { duration: 950, easing: "cubic-bezier(0.5, 0, 0.3, 1)" });
    flight.onfinish = () => {
      ghost.remove();
      bagButton.animate(
        [{ transform: "rotate(0)" }, { transform: "rotate(-9deg)" }, { transform: "rotate(7deg)" }, { transform: "rotate(-4deg)" }, { transform: "rotate(0)" }],
        { duration: 520, easing: "ease-in-out" }
      );
      bagBadge.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 460, easing: EASE_OUT });
    };
    flight.oncancel = () => ghost.remove();
  }

  function confirmAdd(button, piece, total) {
    const status = $("#bag-status");
    if (status) status.textContent = `${piece.name} added. ${total} ${total === 1 ? "piece" : "pieces"} in your bag.`;
    if (!button) return;
    const label = $(".add-label", button);
    if (!label) return;
    clearTimeout(Number(button.dataset.confirmTimer));
    button.dataset.confirming = "1";
    button.classList.add("is-added");
    label.textContent = "Added to bag";
    button.dataset.confirmTimer = String(setTimeout(() => {
      button.dataset.confirming = "0";
      renderBag();
    }, 1800));
  }

  function addToBag(id, card) {
    if (!pieces.has(id)) return;
    bag.set(id, Math.min(9, (bag.get(id) || 0) + 1));
    saveBag();
    renderBag();
    confirmAdd(card ? $("[data-add]", card) : null, pieces.get(id), bagSize());
    flyToBag(card);
  }

  function openBag() {
    if (!bagPanel || bagOpen) return;
    closeMenu();
    bagOpen = true;
    clearTimeout(bagTimer);
    bagReturnFocus = document.activeElement;
    showHeader();
    bagPanel.hidden = false;
    bagScrim.hidden = false;
    renderBag({ stagger: true });
    void bagPanel.offsetWidth; // start the opening transition from the closed state
    bagPanel.classList.add("is-open");
    bagScrim.classList.add("is-open");
    root.classList.add("bag-open", "is-locked");
    if (bagButton) bagButton.setAttribute("aria-expanded", "true");
    setInert(true);
    setTimeout(() => (bagClose || bagPanel).focus({ preventScroll: true }), 160);
  }

  function closeBag() {
    if (!bagPanel || !bagOpen) return;
    bagOpen = false;
    bagPanel.classList.remove("is-open");
    bagScrim.classList.remove("is-open");
    root.classList.remove("bag-open", "is-locked");
    if (bagButton) bagButton.setAttribute("aria-expanded", "false");
    setInert(false);
    bagTimer = setTimeout(() => {
      if (bagOpen) return;
      bagPanel.hidden = true;
      bagScrim.hidden = true;
    }, 700);
    if (bagReturnFocus && bagReturnFocus.focus) bagReturnFocus.focus({ preventScroll: true });
  }

  if (bagButton) bagButton.addEventListener("click", () => (bagOpen ? closeBag() : openBag()));
  if (bagClose) bagClose.addEventListener("click", closeBag);
  if (bagScrim) bagScrim.addEventListener("click", closeBag);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && bagOpen) { closeBag(); return; }
    if (event.key !== "Tab" || !bagOpen) return;
    const focusable = $$('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])', bagPanel);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    else if (event.shiftKey && (document.activeElement === first || document.activeElement === bagPanel)) { event.preventDefault(); last.focus(); }
  });

  grid.addEventListener("click", (event) => {
    const save = event.target.closest("[data-save]");
    if (save) { toggleSaved(save); return; }
    const add = event.target.closest("[data-add]");
    if (add) addToBag(add.dataset.add, add.closest(".product"));
  });

  bagList.addEventListener("click", (event) => {
    const step = event.target.closest("[data-step]");
    const remove = event.target.closest("[data-remove]");
    if (step) {
      const id = step.dataset.piece;
      const next = (bag.get(id) || 0) + Number(step.dataset.step);
      if (next < 1) bag.delete(id); else bag.set(id, Math.min(9, next));
    } else if (remove) {
      bag.delete(remove.dataset.remove);
    } else {
      return;
    }
    saveBag();
    renderBag();
    const focusTarget = $("[data-step]:not([disabled])", bagList) || bagClose;
    if (focusTarget) focusTarget.focus();
  });

  renderBag();

  /* ------------------------------------------------------------------ *
   * Categories: on a phone the rail swipes, and a thin bar shows where you are
   * ------------------------------------------------------------------ */
  const rail = $(".categories-rail");
  const railProgress = $(".rail-progress");

  function updateRailProgress() {
    if (!rail || !railProgress) return;
    const total = rail.scrollWidth || 1;
    railProgress.style.setProperty("--thumb", (rail.clientWidth / total).toFixed(4));
    railProgress.style.setProperty("--offset", (rail.scrollLeft / total).toFixed(4));
  }

  if (rail) {
    rail.addEventListener("scroll", updateRailProgress, { passive: true });
    addEventListener("resize", updateRailProgress);
    updateRailProgress();
  }

  /* ------------------------------------------------------------------ *
   * Festive offers: a fanned deck of arch cards. The ring around the pause
   * button is the clock; when it closes, the front card flies off.
   * ------------------------------------------------------------------ */
  const offersRoot = $(".hero-offers");
  const offerStage = $(".offers-stage");
  const offers = $$(".offer");
  const offerTabs = $$(".offers-tab");
  const offerControls = $(".offers-controls");
  const offerPause = $(".offers-pause");
  const offerStatus = $(".offers-status");
  const clockFill = $(".clock-fill");
  let offerIndex = 0;
  let offersPaused = false;
  let offersVisible = true;
  let offersHeld = motion; // held until the hero has played in
  let flight = null;

  function layoutDeck() {
    offers.forEach((offer, i) => {
      const pos = Math.min(3, mod(i - offerIndex, offers.length));
      const active = pos === 0;
      offer.style.setProperty("--pos", String(pos));
      offer.dataset.pos = String(pos);
      offer.classList.toggle("is-active", active);
      offer.setAttribute("aria-hidden", String(!active));
      offer.inert = !active;
    });
    offerTabs.forEach((tab, i) => {
      const active = i === offerIndex;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
  }

  function syncClock() {
    if (!offerControls) return;
    offerControls.classList.toggle("is-playing", !reduceQuery.matches && !offersPaused);
    offerControls.classList.toggle("is-held", offersHeld || !offersVisible || document.hidden);
    if (offerPause) offerPause.hidden = reduceQuery.matches;
  }

  function restartClock() {
    if (!clockFill) return;
    clockFill.style.animation = "none";
    void clockFill.getBoundingClientRect();
    clockFill.style.animation = "";
  }

  function countUp(offer) {
    const digits = $(".offer-digits", offer);
    if (!digits) return;
    const value = Number(digits.dataset.value);
    if (!motion) { digits.textContent = String(value); return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 900);
      digits.textContent = String(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const FLOWN = "translate(-118%, 6%) rotate(-16deg) scale(0.92)";

  function showOffer(target, { step, announce = false } = {}) {
    const count = offers.length;
    const next = mod(target, count);
    if (next === offerIndex) return;
    if (flight) flight.finish();
    const direction = step || (next > offerIndex ? 1 : -1);
    const outgoing = offers[offerIndex];
    const incoming = offers[next];
    offerIndex = next;

    if (motion && outgoing.animate) {
      if (direction > 0) {
        /* The front card flies off to the left, then slips in at the back. */
        const current = getComputedStyle(outgoing).transform;
        outgoing.classList.add("is-reset");
        outgoing.style.zIndex = "20";
        layoutDeck();
        flight = outgoing.animate(
          [{ transform: current, opacity: 1 }, { transform: FLOWN, opacity: 0 }],
          { duration: 640, easing: "cubic-bezier(0.55, 0, 0.45, 1)" }
        );
        const settle = () => {
          flight = null;
          outgoing.style.zIndex = "";
          outgoing.style.opacity = "0";
          void outgoing.offsetWidth;
          outgoing.classList.remove("is-reset");
          outgoing.style.opacity = "";
        };
        flight.onfinish = settle;
        flight.oncancel = settle;
      } else {
        /* Going back: the wanted card flies in from the left, onto the top. */
        incoming.classList.add("is-reset");
        layoutDeck();
        flight = incoming.animate(
          [{ transform: FLOWN, opacity: 0 }, { transform: "none", opacity: 1 }],
          { duration: 760, easing: EASE_OUT }
        );
        const settle = () => { flight = null; incoming.classList.remove("is-reset"); };
        flight.onfinish = settle;
        flight.oncancel = settle;
      }
    } else {
      layoutDeck();
    }

    countUp(incoming);
    restartClock();
    if (announce && offerStatus) {
      offerStatus.textContent = `${$(".offer-title", incoming).textContent}, offer ${next + 1} of ${count}`;
    }
  }

  function setOffersPaused(paused) {
    offersPaused = paused;
    if (offerPause) {
      offerPause.classList.toggle("is-paused", paused);
      offerPause.setAttribute("aria-label", paused ? "Play the offers" : "Pause the offers");
    }
    syncClock();
  }

  if (offersRoot && offers.length > 1) {
    layoutDeck();
    syncClock();
    offerTabs.forEach((tab, i) => tab.addEventListener("click", () => showOffer(i, { announce: true })));
    $(".offers-prev", offersRoot).addEventListener("click", () => showOffer(offerIndex - 1, { step: -1, announce: true }));
    $(".offers-next", offersRoot).addEventListener("click", () => showOffer(offerIndex + 1, { step: 1, announce: true }));
    if (offerPause) offerPause.addEventListener("click", () => setOffersPaused(!offersPaused));
    if (clockFill) {
      clockFill.addEventListener("animationend", (event) => {
        if (event.animationName === "offer-clock") showOffer(offerIndex + 1, { step: 1 });
      });
    }
    offersRoot.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.target.closest("input")) return;
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      showOffer(offerIndex + step, { step, announce: true });
    });
    onHorizontalSwipe(offerStage, (step) => showOffer(offerIndex + step, { step, announce: true }));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        offersVisible = entry.isIntersecting;
        syncClock();
      }, { threshold: 0.25 }).observe(offerStage);
    }
    document.addEventListener("visibilitychange", syncClock);
    reduceQuery.addEventListener("change", syncClock);
  }

  /* The floating chat button steps in once the offers, which carry their own
     WhatsApp links, have scrolled away above. It steps aside again over the
     occasion controls and the footer's small print, which sit in its corner. */
  if (waFloat) {
    if (offersRoot && "IntersectionObserver" in window) {
      let pastOffers = false;
      const covering = new Set();
      const syncFloat = () => waFloat.classList.toggle("is-shown", pastOffers && covering.size === 0);
      new IntersectionObserver(([entry]) => {
        pastOffers = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        syncFloat();
      }).observe(offersRoot);
      const tuck = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) covering.add(entry.target); else covering.delete(entry.target);
        }
        syncFloat();
      });
      for (const element of $$(".edits-controls, .footer-bottom")) tuck.observe(element);
    } else {
      waFloat.classList.add("is-shown");
    }
  }

  /* ------------------------------------------------------------------ *
   * Occasion edits. On a wide screen with motion the section holds and the
   * scroll moves through the edits; elsewhere the buttons and swipes do.
   * The background follows the edit: blush, rani, plum.
   * ------------------------------------------------------------------ */
  const occasions = $("#occasions");
  const edits = $$(".edit");
  const editsRegion = $(".edits");
  const editDots = $$(".edits-dot");
  const editPrev = $("#edits-prev");
  const editNext = $("#edits-next");
  const editStatus = $("#edits-status");
  const editCount = $(".count-current");
  const editNames = ["Everyday", "Celebrations", "Heirloom"];
  let editIndex = 0;
  let editTimeline = null;
  let editsPin = null; // the ScrollTrigger while the section is pinned
  let editAim = null; // the progress a button asked for, so snapping lands there
  let editAimTimer = 0;

  function updateEditControls() {
    edits.forEach((edit, i) => edit.setAttribute("aria-hidden", String(i !== editIndex)));
    editDots.forEach((dot, i) => {
      const active = i === editIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-pressed", String(active));
    });
    editPrev.disabled = editIndex === 0;
    editNext.disabled = editIndex === edits.length - 1;
    editStatus.textContent = `${editNames[editIndex]} edit, slide ${editIndex + 1} of ${edits.length}`;
    rollNumber(editCount, editIndex + 1);
  }

  function showEdit(index) {
    const target = Math.max(0, Math.min(edits.length - 1, index));
    if (target === editIndex) return;
    if (editTimeline) editTimeline.progress(1);
    const direction = target > editIndex ? 1 : -1;
    const outgoing = edits[editIndex];
    const incoming = edits[target];
    editIndex = target;
    occasions.dataset.edit = String(target);
    incoming.classList.add("is-active");
    updateEditControls();

    if (!motion) {
      outgoing.classList.remove("is-active");
      return;
    }

    const media = $(".edit-media", incoming);
    const image = $("img", incoming);
    const number = $(".edit-number", incoming);
    const copy = $$(".edit-name, .edit-title, .edit-copy p", incoming);
    const ARCH = "round 999px 999px 14px 14px";

    editTimeline = gsap.timeline({
      onComplete: () => {
        outgoing.classList.remove("is-active");
        gsap.set([outgoing, incoming], { clearProps: "opacity,visibility,zIndex" });
        gsap.set(media, { clearProps: "clipPath" });
        editTimeline = null;
      }
    })
      .set(incoming, { zIndex: 2, opacity: 1, visibility: "visible" })
      .set(outgoing, { zIndex: 1 })
      /* The new photo rises as an arch, from the bottom of its frame. */
      .fromTo(media, { clipPath: `inset(100% 0% 0% 0% ${ARCH})` }, { clipPath: `inset(0% 0% 0% 0% ${ARCH})`, duration: 1.05, ease: "expo.inOut" }, 0)
      .fromTo(image, { scale: 1.3, yPercent: 8 }, { scale: 1, yPercent: 0, duration: 1.4, ease: "expo.out" }, 0.1)
      .fromTo(number, { yPercent: 45 * direction, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out" }, 0.12)
      .fromTo(copy, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: "expo.out", stagger: 0.07 }, 0.2)
      .to(outgoing, { opacity: 0, duration: 0.45, ease: "power2.out" }, 0);
  }

  function goToEdit(index) {
    const target = Math.max(0, Math.min(edits.length - 1, index));
    if (editsPin) {
      editAim = target / (edits.length - 1);
      clearTimeout(editAimTimer);
      editAimTimer = setTimeout(() => { editAim = null; }, 1800);
      const top = editsPin.start + (editsPin.end - editsPin.start) * editAim;
      window.scrollTo({ top: Math.round(top), behavior: reduceQuery.matches ? "auto" : "smooth" });
    } else {
      showEdit(target);
    }
  }

  if (editsRegion) {
    updateEditControls();
    editPrev.addEventListener("click", () => goToEdit(editIndex - 1));
    editNext.addEventListener("click", () => goToEdit(editIndex + 1));
    for (const dot of editDots) dot.addEventListener("click", () => goToEdit(Number(dot.dataset.edit)));
    editsRegion.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      goToEdit(editIndex + (event.key === "ArrowRight" ? 1 : -1));
    });
    onHorizontalSwipe($(".edits-stage"), (step) => { if (!editsPin) showEdit(editIndex + step); });
  }

  /* ------------------------------------------------------------------ *
   * Motion layer
   * ------------------------------------------------------------------ */
  /* Wraps each word in a mask so lines can rise into place. Nested markup
     (the <em>) is kept. */
  function splitWords(element) {
    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          for (const part of child.textContent.split(/(\s+)/)) {
            if (!part) continue;
            if (/^\s+$/.test(part)) { fragment.append(part); continue; }
            const mask = document.createElement("span");
            mask.className = "line-word";
            const word = document.createElement("span");
            word.textContent = part;
            mask.append(word);
            fragment.append(mask);
          }
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      }
    };
    walk(element);
    return $$(".line-word > span", element);
  }

  /* Each word, with the space after it, gets its own highlighter stroke. */
  function markWords(element) {
    const tokens = element.textContent.match(/\S+\s*/g) || [];
    element.textContent = "";
    for (const token of tokens) {
      const span = document.createElement("span");
      span.className = "hl";
      span.textContent = token;
      element.append(span);
    }
    return $$(".hl", element);
  }

  function startMotion() {
    const mm = gsap.matchMedia();

    /* Pins first, so every trigger below is measured with their spacing. */
    mm.add("(min-width: 1000px)", () => {
      const railCards = $$(".category-card");
      root.classList.add("rail-pinned");
      const distance = () => Math.max(0, rail.scrollWidth - rail.parentElement.clientWidth);
      if (distance() < 60) {
        root.classList.remove("rail-pinned");
        gsap.set(railCards, { opacity: 1 });
        return undefined;
      }
      const travel = gsap.to(rail, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: "#categories",
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      railCards.forEach((card) => {
        gsap.fromTo($("img", card), { xPercent: -7, scale: 1.2 }, {
          xPercent: 7, scale: 1.2, ease: "none",
          scrollTrigger: { trigger: card, containerAnimation: travel, start: "left right", end: "right left", scrub: true }
        });
        gsap.fromTo(card, { opacity: 0, y: 90, rotate: 7 }, {
          opacity: 1, y: 0, rotate: 0, ease: "power2.out",
          scrollTrigger: { trigger: card, containerAnimation: travel, start: "left 100%", end: "left 62%", scrub: 0.6 }
        });
      });
      return () => root.classList.remove("rail-pinned");
    });

    mm.add("(max-width: 999px)", () => {
      ScrollTrigger.batch(".category-card", {
        start: "top 92%",
        once: true,
        onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, y: 60, rotate: 4 }, {
          opacity: 1, y: 0, rotate: 0, duration: 1, ease: "expo.out", stagger: 0.08, clearProps: "transform"
        })
      });
    });

    mm.add("(min-width: 1000px) and (min-height: 640px)", () => {
      root.classList.add("edits-pinned");
      editsPin = ScrollTrigger.create({
        trigger: occasions,
        start: "top top",
        end: () => `+=${Math.round(innerHeight * 1.6)}`,
        pin: true,
        anticipatePin: 1,
        /* Rests on one edit at a time; no inertia, so a quick scroll never skips one. */
        snap: {
          snapTo: (progress) => (editAim !== null ? editAim : Math.round(progress * (edits.length - 1)) / (edits.length - 1)),
          inertia: false,
          duration: { min: 0.25, max: 0.7 },
          delay: 0.08,
          ease: "power2.inOut"
        },
        onUpdate: (self) => {
          const i = Math.min(edits.length - 1, Math.floor(self.progress * edits.length));
          if (i !== editIndex) showEdit(i);
        }
      });
      return () => {
        editsPin = null;
        root.classList.remove("edits-pinned");
      };
    });

    /* The hero plays in: words rise, the deck is dealt, the arches draw. */
    const heroTitle = $(".hero-title");
    const heroWords = splitWords(heroTitle);
    offerStage.classList.add("is-dealing");
    const hero = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
      .fromTo(heroWords, { y: 0, yPercent: 108 }, { y: 0, yPercent: 0, duration: 1.15, stagger: 0.07 }, 0)
      .fromTo($$("[data-hero-fade]"), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, clearProps: "transform" }, 0.4)
      .fromTo(offerStage, { opacity: 0, y: 90, rotate: -5, "--fan": 0 }, { opacity: 1, y: 0, rotate: 0, duration: 1.2, clearProps: "transform" }, 0.2)
      .to(offerStage, {
        "--fan": 1,
        duration: 1.1,
        ease: "back.out(1.6)",
        onComplete: () => {
          offerStage.classList.remove("is-dealing");
          offersHeld = false;
          restartClock();
          syncClock();
        }
      }, 0.8)
      .fromTo($$(".hero-jaali path, .hero-jaali circle"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.4, ease: "power2.inOut", stagger: 0.12 }, 0.1)
      .add(() => countUp(offers[offerIndex]), 0.6);

    const intro = $(".intro");
    if (firstVisit && intro) {
      const letters = $$(".intro-word span", intro);
      gsap.timeline({
        defaults: { ease: "expo.out" },
        onComplete: () => {
          root.classList.remove("first-visit");
          intro.remove();
        }
      })
        .fromTo(letters, { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 0.7, stagger: 0.045 })
        .to(letters, { yPercent: -110, duration: 0.4, ease: "power3.in", stagger: 0.025 }, "+=0.15")
        .to($(".intro-curtain--plum", intro), { yPercent: -130, duration: 1, ease: "power4.inOut" }, "-=0.2")
        .to($(".intro-curtain--rani", intro), { yPercent: -130, duration: 1, ease: "power4.inOut" }, "<0.13")
        .add(() => hero.play(), "<0.35");
    } else {
      if (intro) intro.remove();
      hero.play();
    }

    /* Section headings and notes. */
    for (const title of $$("[data-lines]")) {
      if (title === heroTitle) continue;
      gsap.fromTo(splitWords(title), { y: 0, yPercent: 108 }, {
        yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.06,
        scrollTrigger: { trigger: title, start: "top 88%", once: true }
      });
    }
    for (const element of $$("[data-fade]")) {
      gsap.fromTo(element, { opacity: 0, y: 24 }, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out", clearProps: "transform",
        scrollTrigger: { trigger: element, start: "top 92%", once: true }
      });
    }

    /* Pieces settle in with a small turn. */
    const productTriggers = ScrollTrigger.batch(cards, {
      start: "top 90%",
      once: true,
      onEnter: (batch) => gsap.fromTo(batch, { opacity: 0, y: 56, rotate: (i) => (i % 2 ? 2.4 : -2.4) }, {
        opacity: 1, y: 0, rotate: 0, duration: 1.1, ease: "expo.out", stagger: 0.1, clearProps: "transform"
      })
    });
    /* A filter can bring up a card that has not been revealed yet. */
    revealProducts = () => {
      productTriggers.forEach((trigger) => trigger.kill());
      gsap.set(cards, { opacity: 1 });
      revealProducts = null;
    };

    /* Atelier: the arch grows in, the photo drifts, the highlighter draws. */
    const atelierMedia = $(".atelier-media");
    gsap.fromTo(atelierMedia, { scale: 0.8, rotate: -3 }, {
      scale: 1, rotate: 0, ease: "none",
      scrollTrigger: { trigger: ".atelier", start: "top 90%", end: "center 55%", scrub: 0.6 }
    });
    gsap.fromTo($("img", atelierMedia), { scale: 1.3, yPercent: -6 }, {
      scale: 1.05, yPercent: 6, ease: "none",
      scrollTrigger: { trigger: atelierMedia, start: "top bottom", end: "bottom top", scrub: true }
    });
    const statement = $("[data-highlight]");
    gsap.to(markWords(statement), {
      backgroundSize: "100% 38%", ease: "none", stagger: 0.12,
      scrollTrigger: { trigger: statement, start: "top 78%", end: "bottom 42%", scrub: 0.5 }
    });

    /* The footer wordmark rises letter by letter. */
    gsap.fromTo($$(".footer-mark span"), { y: 0, yPercent: 100 }, {
      yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.06,
      scrollTrigger: { trigger: ".footer-mark", start: "top 96%", once: true }
    });

    ScrollTrigger.sort();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    addEventListener("load", () => ScrollTrigger.refresh());
  }

  if (motion) startMotion();
})();
