/* =========================================================
   RIZIN KHADER — DEEP SPACE OBSERVATORY
   Cosmic canvas engine: parallax starfield, galactic core,
   drifting nebulae, constellation web, comets & orbital HUD.
   ========================================================= */

const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

let width, height, dpr;
let time = 0;

const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
let scrollY = 0;

/* ---------- Palette ---------- */
const COL = {
  azure: [77, 124, 254],
  cyan: [34, 211, 238],
  gold: [255, 210, 125],
  white: [232, 236, 247],
};
const rgba = (c, a) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;

/* ---------- Layers of stars (parallax) ---------- */
const layers = [
  { count: 90, speed: 0.006, size: [0.4, 0.9], depth: 6, stars: [] },
  { count: 70, speed: 0.014, size: [0.7, 1.4], depth: 16, stars: [] },
  { count: 40, speed: 0.028, size: [1.0, 2.1], depth: 34, stars: [] },
];

/* ---------- Bright constellation nodes ---------- */
let nodes = [];
const NODE_COUNT = 42;

/* ---------- Nebula clouds ---------- */
let nebulae = [];

/* ---------- Comets ---------- */
const comets = [];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function seed() {
  layers.forEach((layer) => {
    layer.stars = [];
    for (let i = 0; i < layer.count; i++) {
      layer.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: rand(layer.size[0], layer.size[1]),
        base: rand(0.2, 0.7),
        tw: rand(0.005, 0.02),
        dir: Math.random() > 0.5 ? 1 : -1,
        phase: Math.random() * Math.PI * 2,
        warm: Math.random() > 0.82,
      });
    }
  });

  nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: rand(0.8, 1.8),
      base: rand(0.4, 0.9),
      tw: rand(0.006, 0.018),
      dir: Math.random() > 0.5 ? 1 : -1,
      warm: Math.random() > 0.7,
    });
  }

  nebulae = [
    { x: 0.78, y: 0.32, r: 0.55, c: COL.azure, a: 0.16, dx: 0.00002, dy: 0.000015 },
    { x: 0.68, y: 0.28, r: 0.36, c: COL.cyan, a: 0.12, dx: -0.000018, dy: 0.00002 },
    { x: 0.15, y: 0.75, r: 0.42, c: COL.azure, a: 0.1, dx: 0.000015, dy: -0.00001 },
    { x: 0.85, y: 0.3, r: 0.2, c: COL.gold, a: 0.07, dx: 0, dy: 0.00001 },
  ];
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seed();
}

/* ---------- Deep space base gradient ---------- */
function drawSpace() {
  const g = ctx.createLinearGradient(0, 0, width * 0.4, height);
  g.addColorStop(0, "#05060f");
  g.addColorStop(0.55, "#070912");
  g.addColorStop(1, "#04050c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

/* ---------- Nebulae (soft radial clouds) ---------- */
function drawNebulae() {
  ctx.globalCompositeOperation = "lighter";
  nebulae.forEach((n) => {
    n.x += Math.sin(time * n.dx) * 0.00008;
    n.y += Math.cos(time * n.dy) * 0.00008;
    const cx = n.x * width;
    const cy = n.y * height;
    const rad = n.r * Math.max(width, height);
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    const pulse = n.a * (0.85 + Math.sin(time * 0.004) * 0.15);
    grd.addColorStop(0, rgba(n.c, pulse));
    grd.addColorStop(0.4, rgba(n.c, pulse * 0.35));
    grd.addColorStop(1, rgba(n.c, 0));
    ctx.fillStyle = grd;
    ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  });
  ctx.globalCompositeOperation = "source-over";
}

/* ---------- Galactic core (top-right anchor) ---------- */
function drawGalaxy() {
  const cx = width * 0.8 + (mouse.x - width / 2) * 0.01;
  const cy = height * 0.34 + (mouse.y - height / 2) * 0.01 - scrollY * 0.04;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = "lighter";

  // core glow
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 160);
  core.addColorStop(0, rgba(COL.white, 0.5));
  core.addColorStop(0.15, rgba(COL.gold, 0.28));
  core.addColorStop(0.5, rgba(COL.azure, 0.12));
  core.addColorStop(1, rgba(COL.azure, 0));
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, 160, 0, Math.PI * 2);
  ctx.fill();

  // spiral arms of fine particles
  ctx.rotate(time * 0.0004);
  const arms = 2;
  const per = 220;
  for (let a = 0; a < arms; a++) {
    const off = (a / arms) * Math.PI * 2;
    for (let i = 0; i < per; i++) {
      const t = i / per;
      const ang = off + t * Math.PI * 3.2;
      const rr = t * 150;
      const spread = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const jitter = (spread - 0.5) * 22 * t;
      const px = Math.cos(ang) * rr + jitter;
      const py = Math.sin(ang) * rr * 0.42 + jitter * 0.4;
      const alpha = (1 - t) * 0.5;
      const warm = i % 9 === 0;
      ctx.fillStyle = rgba(warm ? COL.gold : COL.cyan, alpha);
      ctx.fillRect(px, py, 1.2, 1.2);
    }
  }
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

/* ---------- Orbital ring system around the core ---------- */
function drawOrbits() {
  const cx = width * 0.8 + (mouse.x - width / 2) * 0.01;
  const cy = height * 0.34 + (mouse.y - height / 2) * 0.01 - scrollY * 0.04;
  ctx.save();
  ctx.translate(cx, cy);

  const rings = [
    { r: 200, tilt: 0.34, speed: 0.00035, c: COL.azure, a: 0.28 },
    { r: 275, tilt: 0.28, speed: -0.00025, c: COL.cyan, a: 0.2 },
    { r: 360, tilt: 0.4, speed: 0.00018, c: COL.gold, a: 0.16 },
  ];

  rings.forEach((ring, idx) => {
    ctx.save();
    ctx.rotate(idx * 0.6);
    ctx.strokeStyle = rgba(ring.c, ring.a);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, ring.r, ring.r * ring.tilt, 0, 0, Math.PI * 2);
    ctx.stroke();

    // orbiting body
    const ang = time * ring.speed * 60;
    const px = Math.cos(ang) * ring.r;
    const py = Math.sin(ang) * ring.r * ring.tilt;
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 9);
    glow.addColorStop(0, rgba(ring.c, 0.9));
    glow.addColorStop(1, rgba(ring.c, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(COL.white, 0.95);
    ctx.beginPath();
    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

/* ---------- Parallax star layers ---------- */
function drawStars() {
  const px = (mouse.x - width / 2);
  const py = (mouse.y - height / 2);
  layers.forEach((layer) => {
    const ox = -px * (layer.depth / 100);
    const oy = -py * (layer.depth / 100) - scrollY * (layer.depth / 220);
    layer.stars.forEach((s) => {
      s.phase += s.tw;
      const tw = s.base + Math.sin(s.phase) * 0.3;
      let x = s.x + ox;
      let y = ((s.y + oy) % height + height) % height;
      x = ((x % width) + width) % width;
      const c = s.warm ? COL.gold : COL.white;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(c, Math.max(0, Math.min(1, tw)));
      ctx.fill();
    });
  });
}

/* ---------- Constellation web (near mouse) ---------- */
function drawConstellations() {
  const px = -(mouse.x - width / 2) * 0.03;
  const py = -(mouse.y - height / 2) * 0.03 - scrollY * 0.08;

  const pts = nodes.map((n) => {
    n.base += n.tw * n.dir;
    if (n.base <= 0.25) n.dir = 1;
    else if (n.base >= 0.95) n.dir = -1;
    return { x: ((n.x + px) % width + width) % width, y: ((n.y + py) % height + height) % height, n };
  });

  // links
  const maxD = 150;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      const d = Math.hypot(dx, dy);
      if (d < maxD) {
        const a = (1 - d / maxD) * 0.16;
        ctx.strokeStyle = rgba(COL.azure, a);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
  }

  // mouse link
  pts.forEach((p) => {
    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;
    const d = Math.hypot(dx, dy);
    if (d < 200) {
      const a = (1 - d / 200) * 0.4;
      ctx.strokeStyle = rgba(COL.cyan, a);
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.n.r, 0, Math.PI * 2);
    ctx.fillStyle = rgba(p.n.warm ? COL.gold : COL.cyan, p.n.base);
    ctx.fill();
  });
}

/* ---------- Comets ---------- */
function drawComets() {
  if (Math.random() < 0.006 && comets.length < 2) {
    const fromLeft = Math.random() > 0.5;
    comets.push({
      x: fromLeft ? -60 : width + 60,
      y: rand(0, height * 0.5),
      len: rand(140, 260),
      speed: rand(9, 16) * (fromLeft ? 1 : -1),
      vy: rand(3, 6),
      op: 1,
      w: rand(0.8, 1.8),
    });
  }
  for (let i = comets.length - 1; i >= 0; i--) {
    const m = comets[i];
    m.x += m.speed;
    m.y += m.vy;
    m.op -= 0.006;
    if (m.op <= 0 || m.x < -200 || m.x > width + 200 || m.y > height + 200) {
      comets.splice(i, 1);
      continue;
    }
    const dir = m.speed > 0 ? -1 : 1;
    const ex = m.x + dir * m.len;
    const ey = m.y - m.vy * (m.len / Math.abs(m.speed));
    const g = ctx.createLinearGradient(m.x, m.y, ex, ey);
    g.addColorStop(0, rgba(COL.white, m.op));
    g.addColorStop(0.3, rgba(COL.cyan, m.op * 0.6));
    g.addColorStop(1, rgba(COL.cyan, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = m.w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    const head = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 5);
    head.addColorStop(0, rgba(COL.white, m.op));
    head.addColorStop(1, rgba(COL.white, 0));
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function animate() {
  requestAnimationFrame(animate);
  mouse.x += (mouse.tx - mouse.x) * 0.06;
  mouse.y += (mouse.ty - mouse.y) * 0.06;

  drawSpace();
  drawNebulae();
  drawGalaxy();
  drawOrbits();
  drawStars();
  drawConstellations();
  drawComets();

  time += 1;
}

/* ---------- Events ---------- */
window.addEventListener("resize", resize);
window.addEventListener("mousemove", (e) => {
  mouse.tx = e.clientX;
  mouse.ty = e.clientY;
});
window.addEventListener("scroll", () => {
  scrollY = window.scrollY || window.pageYOffset;
});

/* ---------- Live HUD telemetry ---------- */
function updateHUD() {
  const clock = document.getElementById("hudClock");
  const fps = document.getElementById("hudScroll");
  if (clock) {
    const now = new Date();
    const utc = now.toISOString().substr(11, 8);
    clock.textContent = utc + " UTC";
  }
  if (fps) {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? Math.round((scrollY / max) * 100) : 0;
    fps.textContent = String(pct).padStart(3, "0") + "%";
  }
}
setInterval(updateHUD, 200);

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
);
revealEls.forEach((el) => io.observe(el));

/* ---------- Mobile nav ---------- */
const menuBtn = document.querySelector(".mobile-menu-btn");
const navLinks = document.querySelector(".nav-links");
if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => navLinks.classList.toggle("active"));
  document.querySelectorAll(".nav-link").forEach((l) =>
    l.addEventListener("click", () => navLinks.classList.remove("active"))
  );
}

/* ---------- Active nav on scroll ---------- */
const sections = document.querySelectorAll("main section[id]");
const navMap = {};
document.querySelectorAll(".nav-link").forEach((l) => {
  const id = l.getAttribute("href").replace("#", "");
  navMap[id] = l;
});
const navIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        Object.values(navMap).forEach((l) => l.classList.remove("current"));
        if (navMap[entry.target.id]) navMap[entry.target.id].classList.add("current");
      }
    });
  },
  { threshold: 0.4 }
);
sections.forEach((s) => navIO.observe(s));

/* ---------- Modal ---------- */
const modal = document.getElementById("projectModal");
const closeBtn = document.getElementById("closeModalBtn");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalTech = document.getElementById("modalTechStack");

document.querySelectorAll(".modal-trigger").forEach((trigger) => {
  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    modalTitle.textContent = trigger.getAttribute("data-title");
    modalDesc.textContent = trigger.getAttribute("data-desc");
    modalTech.innerHTML = "";
    trigger
      .getAttribute("data-tech")
      .split(",")
      .forEach((t) => {
        const span = document.createElement("span");
        span.textContent = t.trim();
        modalTech.appendChild(span);
      });
    modal.classList.add("show");
  });
});
if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.remove("show"));
if (modal)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("show");
  });
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal) modal.classList.remove("show");
});

/* ---------- Init ---------- */
resize();
animate();
