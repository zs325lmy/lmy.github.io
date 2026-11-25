/* ============================================================
   Interaction layer — nav state, scroll reveal, active section,
   reading progress, pointer spotlight. No dependencies.
   ============================================================ */
(function () {
  "use strict";

  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  var progressBar = document.querySelector(".progress i");
  var spotlight = document.querySelector(".spotlight");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- sticky nav + reading progress ---------- */
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (nav) nav.classList.toggle("is-scrolled", y > 24);
    if (progressBar) {
      progressBar.style.width = (docHeight > 0 ? Math.min(y / docHeight, 1) * 100 : 0) + "%";
    }
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- active section in nav ---------- */
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var sections = navAnchors
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var visible = {};

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });

      var bestId = null;
      var bestRatio = 0;
      Object.keys(visible).forEach(function (id) {
        if (visible[id] > bestRatio) { bestRatio = visible[id]; bestId = id; }
      });

      navAnchors.forEach(function (a) {
        a.classList.toggle("is-active", bestId !== null && a.getAttribute("href") === "#" + bestId);
      });
    }, { rootMargin: "-30% 0px -45% 0px", threshold: [0, 0.15, 0.35, 0.6, 1] });

    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- mobile menu ---------- */
  function closeMenu() {
    if (!links || !toggle) return;
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "打开菜单");
    document.body.classList.remove("is-locked");
  }

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
      document.body.classList.toggle("is-locked", open);
    });

    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* ---------- pointer spotlight (desktop only) ---------- */
  if (spotlight && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    var sx = window.innerWidth / 2;
    var sy = window.innerHeight / 3;
    var cx = sx;
    var cy = sy;

    window.addEventListener("pointermove", function (e) {
      sx = e.clientX;
      sy = e.clientY;
      spotlight.style.opacity = "1";
    }, { passive: true });

    (function loop() {
      cx += (sx - cx) * 0.08;
      cy += (sy - cy) * 0.08;
      spotlight.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      window.requestAnimationFrame(loop);
    })();
  }

  /* ---------- year stamp ---------- */
  var stamp = document.querySelector("[data-year]");
  if (stamp) stamp.textContent = String(new Date().getFullYear());
})();
