const canvas = document.getElementById("shaderCanvas");
const ctx = canvas.getContext("2d");
const fpsText = document.getElementById("fps");
const menuButton = document.getElementById("menuButton");
const menu = document.getElementById("menu");
const buttons = document
.querySelectorAll("[data-quality]");

const graph = document.getElementById("fpsGraph");
const graphCtx = graph.getContext("2d");
const frameTimeText = document.getElementById("frameTime");

let fpsHistory = Array(45).fill(0);

const levels = [
  { name: "Ultimate High", fps: 5, detail: 100 },
  { name: "Ultra High", fps: 9, detail: 75 },
  { name: "High", fps: 15, detail: 55 },
  { name: "Mid to High", fps: 22, detail: 40 },
  { name: "Mid", fps: 30, detail: 28 },
  { name: "Low to Mid", fps: 40, detail: 19 },
  { name: "Low", fps: 50, detail: 12 },
  { name: "Potato", fps: 60, detail: 7 }
];

let selected = 0;
let lastFrame = 0;
let rotation = 0;
let fpsFrames = 0;
let fpsTimer = performance.now();

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resize();
window.addEventListener("resize", resize);

// Menu
menuButton.addEventListener("click", () => {
  menu.hidden = !menu.hidden;
});

buttons.forEach((button, index) => {
  button.addEventListener("click", () => {
    selected = index;

    buttons.forEach(b => b.classList.remove("active"));
    button.classList.add("active");

    fpsText.textContent = `FPS: ${levels[selected].fps}`;
    menu.hidden = true;
    lastFrame = 0;
  });
});

buttons[0].classList.add("active");

// Draw moving, colorful rough sphere
function drawSphere() {
  
  const w = innerWidth;
  const h = innerHeight;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w * 0.32, h * 0.19, 145);
  const detail = levels[selected].detail;

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  const gradient = ctx.createRadialGradient(
    -radius * 0.35, -radius * 0.4, 2,
    0, 0, radius
  );

  gradient.addColorStop(0, "#ffe2ff");
  gradient.addColorStop(0.2, "#d52cff");
  gradient.addColorStop(0.42, "#244fff");
  gradient.addColorStop(0.65, "#00bfa5");
  gradient.addColorStop(0.85, "#40105c");
  gradient.addColorStop(1, "#080510");

  ctx.beginPath();

  for (let i = 0; i <= detail; i++) {
    const a = i / detail * Math.PI * 2;
    const rough = 1
      + Math.sin(a * 9 + rotation * 2) * 0.035
      + Math.cos(a * 17 - rotation) * 0.025;

    const x = Math.cos(a) * radius * rough;
    const y = Math.sin(a) * radius * rough;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.shadowColor = "#a020ff";
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Surface craters
  for (let i = 0; i < detail; i++) {
    const a = i * 2.399 + rotation;
    const d = Math.sqrt((i + 0.5) / detail) * radius * 0.85;
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const r = radius * (0.015 + (i % 5) * 0.008);

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = [
      "#ff40cb", "#48f5ff", "#8c48ff",
      "#72ffc5", "#ffba52"
    ][i % 5];
    ctx.globalAlpha = 0.45 + (i % 3) * 0.15;
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
  rotation += 0.012;
}

let dragging = false;
let movedByTouch = false;

function getBallPosition(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

canvas.style.touchAction = "none";

canvas.addEventListener("pointerdown", (e) => {
  const pos = getBallPosition(e);
  const dx = pos.x - ballX;
  const dy = pos.y - ballY;

  const radius = Math.min(
    innerWidth * 0.32,
    innerHeight * 0.19,
    145
  );

  if (dx * dx + dy * dy <= radius * radius) {
    dragging = true;
    movedByTouch = true;
    velocityX = 0;
    velocityY = 0;
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;

  const pos = getBallPosition(e);
  const radius = Math.min(
    innerWidth * 0.32,
    innerHeight * 0.19,
    145
  );

  ballX = Math.max(radius, Math.min(innerWidth - radius, pos.x));
  ballY = Math.max(radius, Math.min(innerHeight - radius, pos.y));
});

canvas.addEventListener("pointerup", () => {
  dragging = false;
});

canvas.addEventListener("pointercancel", () => {
  dragging = false;
});

// FPS is intentionally simulated
function animate(now) {
  requestAnimationFrame(animate);

  const target = levels[selected].fps;
  if (now - lastFrame < 1000 / target) return;

  lastFrame = now;
  drawSphere();
  fpsFrames++;



if (now - fpsTimer >= 80) {
  const variation = Math.random() * 8 - 4;
  const displayedFPS = Math.max(
    1,
    Math.round(target + variation)
  );

  fpsText.textContent = `FPS: ${displayedFPS}`;

  const frameTime = 1000 / displayedFPS;
  frameTimeText.textContent =
    `FRAME TIME: ${frameTime.toFixed(1)} ms`;

  fpsHistory.push(displayedFPS);
  fpsHistory.shift();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = graph.clientWidth;
  const height = graph.clientHeight;

  if (
    graph.width !== Math.floor(width * dpr) ||
    graph.height !== Math.floor(height * dpr)
  ) {
    graph.width = Math.floor(width * dpr);
    graph.height = Math.floor(height * dpr);
  }

  graphCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  graphCtx.clearRect(0, 0, width, height);

  graphCtx.strokeStyle = "#292929";
  graphCtx.lineWidth = 1;
  graphCtx.beginPath();
  graphCtx.moveTo(0, height / 2);
  graphCtx.lineTo(width, height / 2);
  graphCtx.stroke();

  graphCtx.strokeStyle = "#fff";
  graphCtx.lineWidth = 1.5;
  graphCtx.beginPath();

  fpsHistory.forEach((value, index) => {
    const x = index / (fpsHistory.length - 1) * width;
    const y = height - (value / 70) * height;
    if (index === 0) graphCtx.moveTo(x, y);
    else graphCtx.lineTo(x, y);
  });

  graphCtx.stroke();

  fpsTimer = now;
}

}

fpsText.textContent = `FPS: ${levels[selected].fps}`;
requestAnimationFrame(animate);
