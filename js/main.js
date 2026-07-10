// Advanced Autoponics — Hut8-inspired interactions

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const menuBtn = document.getElementById("menuBtn");
const siteNav = document.getElementById("siteNav");
const navBackdrop = document.getElementById("navBackdrop");
const navLinks = document.querySelectorAll("[data-nav]");

let navScrollY = 0;

function setNavOpen(open) {
  if (!menuBtn || !siteNav) return;

  if (open) {
    navScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = `-${navScrollY}px`;
  }

  siteNav.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  document.body.classList.toggle("nav-open", open);

  if (navBackdrop) {
    navBackdrop.hidden = !open;
    navBackdrop.classList.toggle("visible", open);
  }

  if (!open) {
    document.body.style.top = "";
    window.scrollTo(0, navScrollY);
  } else {
    const firstLink = siteNav.querySelector("a");
    firstLink?.focus({ preventScroll: true });
  }
}

if (menuBtn && siteNav) {
  menuBtn.addEventListener("click", () => {
    setNavOpen(!siteNav.classList.contains("open"));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setNavOpen(false));
  });

  navBackdrop?.addEventListener("click", () => setNavOpen(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && siteNav.classList.contains("open")) {
      setNavOpen(false);
      menuBtn.focus();
    }
  });
}

// Active nav on scroll
const sectionIds = ["connectivity", "platform", "geminy", "problem", "solution", "delivery", "insights", "contact"];
const sections = sectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);

function setActiveNav(id) {
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    const isActive = href === `#${id}`;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

if (sections.length && navLinks.length && "IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) {
        setActiveNav(visible[0].target.id);
      }
    },
    { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.15, 0.35, 0.55] }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

// Scroll progress + circuit indicator
const scrollProgress = document.getElementById("scrollProgress");
const scrollBar = scrollProgress?.querySelector(".scroll-progress-bar");

function getScrollFraction() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  return docHeight > 0 ? window.scrollY / docHeight : 0;
}

function updateScrollProgress() {
  if (!scrollBar) return;
  scrollBar.style.width = `${getScrollFraction() * 100}%`;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();

// Scroll-driven circuit trace (logo-inspired)
const scrollCircuit = document.getElementById("scrollCircuit");
const circuitTrunkTrack = document.getElementById("circuitTrunkTrack");
const circuitTrunkActive = document.getElementById("circuitTrunkActive");
const circuitBranchesTrack = document.getElementById("circuitBranchesTrack");
const circuitBranchesActive = document.getElementById("circuitBranchesActive");
const circuitDot = document.getElementById("circuitDot");
const circuitDotGlow = document.getElementById("circuitDotGlow");

const circuitSectionIds = [
  "connectivity",
  "platform",
  "geminy",
  "problem",
  "solution",
  "delivery",
  "insights",
  "contact",
];

const TRUNK_X = 14;
const BRANCH_LEN = 16;
const NODE_R = 3;

let circuitLayout = null;

function buildCircuitLayout() {
  if (!scrollCircuit) return null;

  const docHeight = document.documentElement.scrollHeight;
  const circuitHeight = scrollCircuit.offsetHeight;

  if (circuitHeight <= 0 || docHeight <= 0) return null;

  const trunkStart = 8;
  const trunkEnd = circuitHeight - 8;
  const trunkSpan = trunkEnd - trunkStart;

  const branches = circuitSectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .map((section, index) => {
      const sectionY = section.offsetTop + section.offsetHeight * 0.2;
      const y = trunkStart + (sectionY / docHeight) * trunkSpan;
      return {
        id: section.id,
        y: Math.max(trunkStart + 16 + index * 2, Math.min(trunkEnd - 4, y)),
        frac: sectionY / docHeight,
      };
    });

  return { trunkStart, trunkEnd, trunkSpan, branches, circuitHeight };
}

function branchPath(y, index) {
  const stub = index % 2 === 1 ? 6 : 0;
  const startY = y - stub;
  return {
    d: stub
      ? `M ${TRUNK_X} ${y} V ${startY} H ${TRUNK_X + BRANCH_LEN}`
      : `M ${TRUNK_X} ${y} H ${TRUNK_X + BRANCH_LEN}`,
    nodeX: TRUNK_X + BRANCH_LEN,
    nodeY: startY,
  };
}

function renderCircuitPaths() {
  if (!circuitLayout || !circuitTrunkTrack) return;

  const { trunkStart, trunkEnd, branches } = circuitLayout;

  const trunkD = `M ${TRUNK_X} ${trunkStart} V ${trunkEnd}`;
  circuitTrunkTrack.setAttribute("d", trunkD);
  circuitTrunkActive?.setAttribute("d", trunkD);

  circuitBranchesTrack.innerHTML = "";
  circuitBranchesActive.innerHTML = "";

  branches.forEach((branch, i) => {
    const { d, nodeX, nodeY } = branchPath(branch.y, i);

    [circuitBranchesTrack, circuitBranchesActive].forEach((group) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("class", "scroll-circuit-branch");
      path.dataset.section = branch.id;
      group.appendChild(path);

      const node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      node.setAttribute("cx", String(nodeX));
      node.setAttribute("cy", String(nodeY));
      node.setAttribute("r", String(NODE_R));
      node.setAttribute("class", "scroll-circuit-node");
      node.dataset.section = branch.id;
      group.appendChild(node);
    });
  });
}

function updateScrollCircuit() {
  if (!scrollCircuit || !circuitLayout || reduceMotion) return;

  const { trunkStart, trunkSpan, branches } = circuitLayout;
  const progress = getScrollFraction();
  const dotY = trunkStart + progress * trunkSpan;

  if (circuitTrunkActive) {
    circuitTrunkActive.style.strokeDasharray = `${trunkSpan}`;
    circuitTrunkActive.style.strokeDashoffset = `${trunkSpan * (1 - progress)}`;
  }

  if (circuitDot) {
    circuitDot.setAttribute("cx", String(TRUNK_X));
    circuitDot.setAttribute("cy", String(dotY));
  }

  if (circuitDotGlow) {
    circuitDotGlow.setAttribute("cx", String(TRUNK_X));
    circuitDotGlow.setAttribute("cy", String(dotY));
  }

  const activeBranches = circuitBranchesActive?.querySelectorAll(
    "[data-section]"
  );

  activeBranches?.forEach((el) => {
    const sectionId = el.dataset.section;
    const branch = branches.find((b) => b.id === sectionId);
    if (!branch) return;

    const isActive = progress >= branch.frac - 0.02;
    el.style.opacity = isActive ? "1" : "0";

    if (el.tagName === "path" && isActive) {
      const len = el.getTotalLength?.() || BRANCH_LEN + 6;
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = "0";
    }
  });
}

function initScrollCircuit() {
  if (!scrollCircuit || reduceMotion) {
    scrollCircuit?.remove();
    return;
  }

  const mobileQuery = window.matchMedia("(max-width: 900px)");

  function refresh() {
    if (mobileQuery.matches) return;
    circuitLayout = buildCircuitLayout();
    renderCircuitPaths();
    updateScrollCircuit();
  }

  refresh();

  window.addEventListener("scroll", updateScrollCircuit, { passive: true });
  window.addEventListener("resize", refresh, { passive: true });
  window.addEventListener("load", refresh);

  mobileQuery.addEventListener("change", (e) => {
    if (e.matches) {
      scrollCircuit.style.display = "none";
    } else {
      scrollCircuit.style.display = "";
      refresh();
    }
  });
}

initScrollCircuit();

// Global map — centered digital Earth (Cloudflare cleanliness, AA brand)
const SVG_NS = "http://www.w3.org/2000/svg";

// Orthographic projection: lon/lat → sphere surface (null if behind).
function projectOrtho(lon, lat, cx, cy, r, rotLon = -15, rotLat = 8) {
  const λ = ((lon + rotLon) * Math.PI) / 180;
  const φ = ((lat + rotLat) * Math.PI) / 180;
  const cosφ = Math.cos(φ);
  const x3 = cosφ * Math.sin(λ);
  const y3 = Math.sin(φ);
  const z3 = cosφ * Math.cos(λ);
  if (z3 < -0.02) return null;
  return {
    x: cx + r * x3,
    y: cy - r * y3,
    z: z3,
  };
}

// Landmass samples — city-light clusters forming readable continents.
const CONTINENT_SAMPLES = {
  na: [
    [-130, 55], [-125, 52], [-120, 50], [-115, 48], [-110, 52], [-105, 55],
    [-100, 52], [-95, 50], [-90, 52], [-85, 48], [-80, 46], [-75, 45], [-70, 48],
    [-125, 45], [-120, 42], [-115, 40], [-110, 42], [-105, 40], [-100, 42],
    [-95, 40], [-90, 42], [-85, 40], [-80, 42], [-75, 40], [-70, 42],
    [-120, 36], [-115, 34], [-110, 35], [-105, 32], [-100, 35], [-95, 32],
    [-90, 35], [-85, 33], [-80, 30], [-80, 35], [-75, 35], [-100, 30],
    [-98, 38], [-95, 45], [-88, 38], [-82, 38], [-78, 38], [-122, 38],
    [-112, 45], [-102, 48], [-92, 45], [-87, 45], [-100, 55], [-110, 58],
    [-118, 48], [-108, 38], [-96, 36], [-86, 36], [-76, 42], [-68, 46],
  ],
  sa: [
    [-78, 8], [-74, 4], [-70, 2], [-68, -2], [-65, 0], [-62, -4],
    [-75, -5], [-70, -8], [-65, -8], [-60, -5], [-55, -8], [-50, -10],
    [-72, -12], [-68, -15], [-62, -15], [-58, -12], [-55, -16], [-50, -18],
    [-70, -20], [-65, -22], [-60, -22], [-55, -24], [-50, -22], [-48, -18],
    [-68, -28], [-62, -30], [-58, -32], [-55, -30], [-52, -28], [-70, -35],
    [-65, -38], [-60, -40], [-55, -38], [-72, -18], [-66, -25], [-58, -28],
  ],
  eu: [
    [-9, 40], [-6, 42], [-3, 44], [0, 43], [2, 46], [5, 45], [8, 44],
    [-8, 52], [-4, 52], [0, 52], [4, 51], [8, 50], [12, 49], [16, 48],
    [0, 48], [4, 48], [8, 48], [12, 52], [16, 52], [20, 52], [24, 50],
    [8, 54], [12, 56], [16, 55], [20, 48], [22, 45], [10, 46], [14, 47],
    [6, 52], [18, 50], [2, 50], [25, 47], [-2, 55], [10, 58],
  ],
  af: [
    [-5, 32], [0, 30], [5, 32], [10, 30], [15, 28], [20, 28], [25, 30],
    [0, 25], [5, 22], [10, 22], [15, 20], [20, 22], [25, 18], [30, 20],
    [5, 15], [10, 12], [15, 12], [20, 10], [25, 10], [30, 8], [35, 5],
    [8, 5], [12, 2], [18, 0], [22, -2], [28, 0], [32, -4], [10, -5],
    [15, -8], [20, -10], [25, -12], [30, -15], [18, -18], [25, -20],
    [30, -22], [22, -25], [28, -28], [32, -25], [12, 18], [22, 15], [28, 12],
  ],
  as: [
    [45, 40], [50, 42], [55, 42], [60, 45], [65, 42], [70, 40], [75, 42],
    [80, 38], [85, 40], [90, 42], [95, 40], [100, 42], [105, 40], [110, 42],
    [115, 40], [120, 42], [125, 40], [130, 38], [135, 36], [70, 32],
    [75, 30], [80, 28], [85, 30], [90, 28], [95, 30], [100, 28], [105, 28],
    [110, 30], [115, 28], [120, 30], [125, 32], [100, 22], [105, 20],
    [110, 22], [115, 22], [55, 35], [65, 35], [78, 35], [88, 35], [98, 35],
    [108, 35], [118, 35], [128, 35], [140, 38], [75, 45], [90, 48], [105, 48],
  ],
  au: [
    [115, -22], [120, -20], [125, -22], [130, -20], [135, -22], [140, -22],
    [145, -24], [150, -26], [115, -28], [120, -28], [125, -28], [130, -28],
    [135, -28], [140, -30], [145, -32], [150, -32], [145, -36], [140, -36],
    [135, -34], [130, -32], [125, -32], [122, -26], [138, -26], [148, -28],
  ],
};

const REGION_HUBS = {
  na: { lon: -98, lat: 40 },
  sa: { lon: -60, lat: -18 },
  eu: { lon: 10, lat: 50 },
  af: { lon: 18, lat: 5 },
  as: { lon: 105, lat: 32 },
  au: { lon: 134, lat: -25 },
};

const REGION_CONNECTIONS = [
  { from: "na", to: "eu", active: true },
  { from: "na", to: "as", active: true },
  { from: "eu", to: "as", active: true },
];

const HERO_CONNECTIONS = 3;

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildGlobeGrid(group, cx, cy, r) {
  if (!group) return;
  group.innerHTML = "";

  const sphere = document.createElementNS(SVG_NS, "circle");
  sphere.setAttribute("cx", String(cx));
  sphere.setAttribute("cy", String(cy));
  sphere.setAttribute("r", String(r));
  sphere.setAttribute("class", "globe-sphere");
  sphere.setAttribute("fill", "url(#globeSphereFillHero)");
  group.appendChild(sphere);

  const outline = document.createElementNS(SVG_NS, "circle");
  outline.setAttribute("cx", String(cx));
  outline.setAttribute("cy", String(cy));
  outline.setAttribute("r", String(r));
  outline.setAttribute("class", "globe-outline");
  group.appendChild(outline);

  const ringCount = 3;
  const meridianCount = 4;

  for (let i = 1; i <= ringCount; i++) {
    const t = (i / (ringCount + 1)) * 0.92;
    const ring = document.createElementNS(SVG_NS, "ellipse");
    ring.setAttribute("cx", String(cx));
    ring.setAttribute("cy", String(cy));
    ring.setAttribute("rx", String(r * Math.sqrt(1 - t * t)));
    ring.setAttribute("ry", String(r * t));
    ring.setAttribute("class", "globe-ring");
    group.appendChild(ring);
  }

  for (let m = 0; m < meridianCount; m++) {
    const phase = ((m + 0.5) / meridianCount) * Math.PI;
    const path = document.createElementNS(SVG_NS, "path");
    const pts = [];
    for (let a = 0; a <= 32; a++) {
      const t = a / 32;
      const lat = (t - 0.5) * Math.PI;
      const x = cx + Math.sin(phase) * r * Math.cos(lat);
      const y = cy + r * Math.sin(lat);
      pts.push(`${a === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    path.setAttribute("d", pts.join(" "));
    path.setAttribute("class", "globe-meridian");
    group.appendChild(path);
  }
}

function buildContinentDots(group, cx, cy, r) {
  if (!group) return;
  group.innerHTML = "";

  const rand = seededRandom(42);

  Object.values(CONTINENT_SAMPLES).forEach((samples) => {
    samples.forEach(([lon, lat], i) => {
      if (i % 2 !== 0) return;
      const p = projectOrtho(lon, lat, cx, cy, r);
      if (!p || p.z < 0.05) return;

      const brightness = 0.48 + p.z * 0.48;
      const size = 0.75 * (0.8 + rand() * 1.2) * (0.75 + p.z * 0.45);

      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", p.x.toFixed(1));
      dot.setAttribute("cy", p.y.toFixed(1));
      dot.setAttribute("r", size.toFixed(2));
      dot.setAttribute("class", "globe-dot");
      dot.setAttribute("fill", `rgba(110,193,119,${Math.min(0.98, brightness).toFixed(2)})`);
      group.appendChild(dot);
    });
  });
}

function curveBetween(a, b, liftScale = 0.32) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const lift = Math.min(dist * liftScale, 72);
  const sway = (dy / dist) * lift * 0.18;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${(mx - sway).toFixed(1)} ${(my - lift).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

function getHubPoints(cx, cy, r) {
  const hubs = {};
  Object.entries(REGION_HUBS).forEach(([id, { lon, lat }]) => {
    const p = projectOrtho(lon, lat, cx, cy, r);
    if (p && p.z > 0.05) hubs[id] = p;
  });
  return hubs;
}

function renderGlobalMap(container) {
  const gridGroup = container.querySelector("[data-globe-grid]");
  const continentsGroup = container.querySelector("[data-globe-continents]");
  const linesGroup = container.querySelector("[data-global-lines]");
  const nodesGroup = container.querySelector("[data-global-nodes]");
  if (!gridGroup || !linesGroup || !nodesGroup) return;

  const cx = 520;
  const cy = 250;
  const r = 168;

  buildGlobeGrid(gridGroup, cx, cy, r);
  if (continentsGroup) {
    buildContinentDots(continentsGroup, cx, cy, r);
  }

  linesGroup.innerHTML = "";
  nodesGroup.innerHTML = "";

  const hubs = getHubPoints(cx, cy, r);
  const connections = REGION_CONNECTIONS.slice(0, HERO_CONNECTIONS);

  connections.forEach((conn, index) => {
    const from = hubs[conn.from];
    const to = hubs[conn.to];
    if (!from || !to) return;

    const d = curveBetween(from, to, 0.28);

    const track = document.createElementNS(SVG_NS, "path");
    track.setAttribute("d", d);
    track.setAttribute("class", "global-line global-line--active");
    linesGroup.appendChild(track);

    if (!reduceMotion) {
      const pulse = document.createElementNS(SVG_NS, "path");
      pulse.setAttribute("d", d);
      pulse.setAttribute("class", "global-line-pulse");
      pulse.style.setProperty("--pulse-duration", `${4.2 + (index % 3) * 0.8}s`);
      pulse.style.setProperty("--pulse-delay", `${index * 0.9}s`);
      linesGroup.appendChild(pulse);
    }
  });

  ["na", "eu", "as"].forEach((id) => {
    const hub = hubs[id];
    if (!hub) return;
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", hub.x.toFixed(1));
    circle.setAttribute("cy", hub.y.toFixed(1));
    circle.setAttribute("r", "2.4");
    circle.setAttribute("class", "global-node global-node--facility");
    nodesGroup.appendChild(circle);
  });
}

function initGlobalMaps() {
  const maps = document.querySelectorAll("[data-global-map]");
  if (!maps.length) return;

  maps.forEach(renderGlobalMap);

  function armPulseAnimations(scope = document) {
    scope.querySelectorAll(".global-line-pulse").forEach((el) => {
      const len = el.getTotalLength?.();
      if (len && Number.isFinite(len)) {
        const dash = Math.max(14, Math.min(28, len * 0.1));
        el.style.setProperty("--line-length", String(len));
        el.style.setProperty("--pulse-dash", String(dash));
        el.style.strokeDasharray = `${dash} ${len}`;
        el.style.strokeDashoffset = String(len);
      }
      el.classList.add("is-animating");
    });
  }

  if (!reduceMotion) {
    requestAnimationFrame(() => armPulseAnimations());
  }

  let resizeTimer;
  function rerender() {
    maps.forEach(renderGlobalMap);
    if (!reduceMotion) {
      requestAnimationFrame(() => armPulseAnimations());
    }
  }

  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rerender, 120);
    },
    { passive: true }
  );
}

initGlobalMaps();

function prefersReducedData() {
  try {
    if (navigator.connection?.saveData) return true;
    const reducedData = window.matchMedia("(prefers-reduced-data: reduce)");
    if (reducedData.matches) return true;
  } catch {
    /* matchMedia / connection may be unavailable */
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const effectiveType = connection?.effectiveType;
  if (effectiveType === "slow-2g" || effectiveType === "2g") return true;

  return false;
}

function pauseAmbientVideo(video) {
  video.pause();
  try {
    video.currentTime = 0;
  } catch {
    /* ignore seek failures before metadata */
  }
  video.removeAttribute("autoplay");
  video.classList.add("is-paused-data");
  video.closest(".hero-video-bg, .connectivity-video-frame")?.classList.add("has-poster");
}

function playAmbientVideo(video) {
  video.classList.remove("is-paused-data");
  video.closest(".hero-video-bg, .connectivity-video-frame")?.classList.remove("has-poster");
  video.setAttribute("autoplay", "");
  const playPromise = video.play();
  if (playPromise?.catch) playPromise.catch(() => {});
}

function initAmbientVideo(videoId) {
  const video = document.getElementById(videoId);
  if (!video) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = prefersReducedData();
  const isMobileViewport = window.matchMedia("(max-width: 900px)").matches;

  // On constrained networks (or Save-Data), skip autoplay of large ambient loops.
  if (saveData) {
    pauseAmbientVideo(video);
    video.preload = "none";
    return;
  }

  function syncMotionPreference() {
    if (motionQuery.matches) {
      pauseAmbientVideo(video);
    } else {
      playAmbientVideo(video);
    }
  }

  if (isMobileViewport && videoId === "heroVideo" && "IntersectionObserver" in window) {
    video.preload = "metadata";
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (motionQuery.matches) {
            pauseAmbientVideo(video);
            return;
          }
          if (entry.isIntersecting) {
            playAmbientVideo(video);
          } else {
            video.pause();
          }
        });
      },
      { rootMargin: "80px 0px", threshold: 0.05 }
    );
    io.observe(video);
  } else {
    syncMotionPreference();
  }

  if (motionQuery.addEventListener) {
    motionQuery.addEventListener("change", syncMotionPreference);
  } else if (motionQuery.addListener) {
    motionQuery.addListener(syncMotionPreference);
  }
}

function initConnectivityVideo() {
  initAmbientVideo("connectivityVideo");
}

function initHeroVideo() {
  initAmbientVideo("heroVideo");
}

initConnectivityVideo();
initHeroVideo();

// Hero mouse-reactive glow + subtle parallax
const hero = document.getElementById("hero");
const heroGlow = document.getElementById("heroGlow");
const heroAtmosphere = hero?.querySelector(".hero-atmosphere");

if (heroGlow && hero && finePointer && !reduceMotion) {
  let glowX = 0;
  let glowY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId = null;

  function animateGlow() {
    glowX += (targetX - glowX) * 0.08;
    glowY += (targetY - glowY) * 0.08;
    heroGlow.style.left = `${glowX}px`;
    heroGlow.style.top = `${glowY}px`;
    rafId = requestAnimationFrame(animateGlow);
  }

  hero.addEventListener("mouseenter", () => {
    heroGlow.classList.add("is-active");
    if (!rafId) rafId = requestAnimationFrame(animateGlow);
  });

  hero.addEventListener("mouseleave", () => {
    heroGlow.classList.remove("is-active");
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });

  hero.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
  });

  window.addEventListener(
    "scroll",
    () => {
      if (!heroAtmosphere) return;
      const offset = Math.min(window.scrollY * 0.15, 80);
      heroAtmosphere.style.transform = `translateY(${offset}px)`;
    },
    { passive: true }
  );
}

// Scroll reveals
const reveals = document.querySelectorAll(".reveal");

function revealElement(el) {
  el.classList.add("is-visible");
}

function revealHashTarget() {
  const id = location.hash.slice(1);
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  target.querySelectorAll(".reveal").forEach(revealElement);
  if (target.classList.contains("reveal")) revealElement(target);
}

if (reveals.length && "IntersectionObserver" in window) {
  if (reduceMotion) {
    reveals.forEach(revealElement);
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElement(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "40px 0px 0px 0px" }
    );

    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 0.06}s`;
      const rect = el.getBoundingClientRect();
      const alreadyVisible = rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
      if (alreadyVisible) {
        revealElement(el);
      } else {
        io.observe(el);
      }
    });
  }
} else {
  reveals.forEach(revealElement);
}

revealHashTarget();
window.addEventListener("hashchange", revealHashTarget);

// Issue list staggered reveal
const issueList = document.querySelector("[data-stagger]");
if (issueList) {
  issueList.querySelectorAll(".issue").forEach((issue, i) => {
    issue.style.setProperty("--stagger", String(i));
  });
}

// Platform layer accordion (mobile)
const layers = document.querySelectorAll("[data-layer]");
const mobileLayerQuery = window.matchMedia("(max-width: 900px)");

function isMobileLayers() {
  return mobileLayerQuery.matches;
}

layers.forEach((layer) => {
  const toggle = layer.querySelector(".layer-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    if (!isMobileLayers()) return;

    const expanded = layer.classList.toggle("is-expanded");
    toggle.setAttribute("aria-expanded", String(expanded));

    if (expanded) {
      layers.forEach((other) => {
        if (other !== layer) {
          other.classList.remove("is-expanded");
          other.querySelector(".layer-toggle")?.setAttribute("aria-expanded", "false");
        }
      });
    }
  });
});

mobileLayerQuery.addEventListener("change", () => {
  layers.forEach((layer) => {
    layer.classList.remove("is-expanded");
    layer.querySelector(".layer-toggle")?.setAttribute("aria-expanded", "false");
  });
});

// Geminy live sensor readouts
const sensorConfig = {
  ph: { min: 5.6, max: 6.2, decimals: 2, step: 0.04 },
  ec: { min: 1.6, max: 2.1, decimals: 2, step: 0.03 },
  temp: { min: 70, max: 75, decimals: 1, step: 0.3 },
  rh: { min: 58, max: 72, decimals: 0, step: 1 },
};

const sensorValues = {};
const sensorEls = document.querySelectorAll("[data-sensor]");

sensorEls.forEach((el) => {
  const key = el.dataset.sensor;
  const cfg = sensorConfig[key];
  if (!cfg) return;
  const parsed = parseFloat(el.textContent);
  sensorValues[key] = {
    current: parsed,
    target: parsed,
    el,
    unit: el.dataset.unit || "",
    cfg,
  };
});

function lerpSensor(key) {
  const s = sensorValues[key];
  if (!s) return;
  const diff = s.target - s.current;
  if (Math.abs(diff) < s.cfg.step * 0.1) {
    s.current = s.target;
  } else {
    s.current += diff * 0.12;
  }
  const formatted = s.current.toFixed(s.cfg.decimals);
  s.el.textContent = `${formatted}${s.unit}`;
}

function pickNewTarget(key) {
  const s = sensorValues[key];
  if (!s) return;
  const { min, max, step } = s.cfg;
  let next = s.current + (Math.random() - 0.5) * step * 4;
  next = Math.max(min, Math.min(max, next));
  s.target = Math.round(next / step) * step;
  s.el.classList.add("is-updating");
  setTimeout(() => s.el.classList.remove("is-updating"), 600);
}

const sensorTime = document.getElementById("sensorTime");

function updateSensorTime() {
  if (!sensorTime) return;
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  sensorTime.textContent = `${h}:${m}:${s}`;
  sensorTime.setAttribute("datetime", now.toISOString());
}

if (sensorEls.length && !reduceMotion) {
  updateSensorTime();
  setInterval(updateSensorTime, 1000);

  setInterval(() => {
    Object.keys(sensorValues).forEach(lerpSensor);
  }, 80);

  setInterval(() => {
    const keys = Object.keys(sensorValues);
    const key = keys[Math.floor(Math.random() * keys.length)];
    pickNewTarget(key);
  }, 2800);

  setInterval(() => {
    Object.keys(sensorValues).forEach(pickNewTarget);
  }, 9000);
} else if (sensorTime) {
  updateSensorTime();
}

// Deliver card tilt
const tiltCards = document.querySelectorAll("[data-tilt]");

if (tiltCards.length && finePointer && !reduceMotion) {
  tiltCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateX(${y * -3}deg) rotateY(${x * 3}deg) translateY(-2px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

// Magnetic CTA buttons
const magneticBtns = document.querySelectorAll("[data-magnetic]");

if (magneticBtns.length && finePointer && !reduceMotion) {
  magneticBtns.forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}
