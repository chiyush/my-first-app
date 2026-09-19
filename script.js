const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const livesElement = document.querySelector("#lives");
const messageElement = document.querySelector("#message");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const restartButton = document.querySelector("#restartButton");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 3600;
const gravity = 0.65;
const keys = {};
let score = 0;
let lives = 3;
let cameraX = 0;
let state = "playing";
let lastTime = 0;
let player;
let platforms;
let coins;
let enemies;
let gameTime = 0;
let particles;

const levelPlatforms = [
  [0, 470, 700, 70], [820, 400, 260, 30], [1190, 470, 500, 70],
  [1780, 390, 250, 30], [2120, 470, 480, 70], [2700, 410, 260, 30],
  [3100, 470, 500, 70], [540, 350, 140, 25], [1450, 340, 150, 25],
  [2350, 330, 150, 25], [2900, 300, 150, 25]
];

function resetGame() {
  score = 0; lives = 3; cameraX = 0; gameTime = 0; state = "playing"; particles = [];
  player = { x: 90, y: 380, width: 30, height: 42, vx: 0, vy: 0, grounded: false };
  platforms = levelPlatforms.map(([x, y, width, height]) => ({ x, y, width, height }));
  coins = [[350, 420], [590, 300], [930, 350], [1330, 420], [1530, 290], [1900, 340],
    [2250, 420], [2420, 280], [2780, 360], [2960, 250], [3300, 420]]
    .map(([x, y]) => ({ x, y, size: 14, collected: false }));
  enemies = [[470, 428], [1350, 428], [1535, 298], [2290, 428], [2790, 368], [3210, 428]]
    .map(([x, y]) => ({ x, y, width: 30, height: 30, vx: 0.7, startX: x }));
  overlay.classList.add("hidden");
  updateHud("脱出ゲートを目指そう！");
}

function updateHud(message) {
  scoreElement.textContent = score;
  livesElement.textContent = lives;
  messageElement.textContent = message;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
}

function update(delta) {
  if (state !== "playing") return;
  const direction = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
  player.vx += direction * 0.7 * delta;
  player.vx *= direction ? 0.88 : 0.78;
  player.vx = Math.max(-5, Math.min(5, player.vx));
  player.vy += gravity * delta;
  player.x += player.vx * delta;
  player.y += player.vy * delta;
  player.grounded = false;

  for (const platform of platforms) {
    if (player.vy >= 0 && player.x + player.width > platform.x && player.x < platform.x + platform.width &&
      player.y + player.height >= platform.y && player.y + player.height - player.vy * delta <= platform.y) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.grounded = true;
    }
  }
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x));
  for (const coin of coins) {
    if (!coin.collected && rectsOverlap(player, { x: coin.x - coin.size, y: coin.y - coin.size, width: coin.size * 2, height: coin.size * 2 })) {
      coin.collected = true; score++; burst(coin.x, coin.y, "#27f5e6", 10); updateHud(`${score} DATAを回収`);
    }
  }
  for (const enemy of enemies) {
    enemy.x += enemy.vx * delta;
    if (Math.abs(enemy.x - enemy.startX) > 55) enemy.vx *= -1;
    if (rectsOverlap(player, enemy)) {
      if (player.vy > 0 && player.y + player.height - enemy.y < 18) {
        enemy.x = -100; player.vy = -9; score += 2; burst(enemy.x, enemy.y, "#ff2d9a", 20); updateHud("ドローンを無力化！");
      } else loseLife();
    }
  }
  if (player.y > HEIGHT + 100) loseLife();
  updateParticles(delta);
  cameraX += (player.x - cameraX - WIDTH * 0.35) * 0.08;
  cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, cameraX));
  if (player.x > 3480) finishGame();
}

function loseLife() {
  if (state !== "playing") return;
  lives--;
  if (lives <= 0) {
    state = "over"; burst(player.x, player.y, "#ff416c", 28); showOverlay("SYSTEM FAILURE", "接触エラーが発生しました。再起動してください。"); return;
  }
  player.x = Math.max(40, player.x - 180); player.y = 250; player.vy = 0;
  updateHud("ぶつかった！ 残り " + lives + " ライフ");
}

function finishGame() {
  state = "won";
  burst(player.x, player.y, "#c7ff4a", 36);
  showOverlay("ESCAPE SUCCESS", `回収データ：${score}　セクター脱出成功！`);
}

function burst(x, y, color, amount) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 18 + Math.random() * 20, maxLife: 38, color, size: 2 + Math.random() * 3 });
  }
}

function updateParticles(delta) {
  for (const particle of particles) {
    particle.x += particle.vx * delta; particle.y += particle.vy * delta;
    particle.vy += 0.08 * delta; particle.life -= delta;
  }
  particles = particles.filter((particle) => particle.life > 0);
}

function showOverlay(title, text) {
  overlayTitle.textContent = title; overlayText.textContent = text; overlay.classList.remove("hidden");
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#080b24"); sky.addColorStop(0.5, "#172259"); sky.addColorStop(1, "#5c286e");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.save(); ctx.translate(-cameraX, 0);
  drawBackground();
  drawGrid();
  for (const platform of platforms) {
    ctx.shadowColor = "#42f5d455"; ctx.shadowBlur = 14;
    const platformGradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
    platformGradient.addColorStop(0, "#243f77"); platformGradient.addColorStop(1, "#111831");
    ctx.fillStyle = platformGradient; ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#5af5cf"; ctx.fillRect(platform.x, platform.y, platform.width, 5);
    ctx.fillStyle = "#b1fff0"; ctx.fillRect(platform.x + 8, platform.y + 2, Math.min(34, platform.width - 16), 2);
  }
  for (const coin of coins) if (!coin.collected) {
    const pulse = Math.sin(gameTime * 0.08 + coin.x) * 2;
    ctx.shadowColor = "#ffe16b"; ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffe16b"; ctx.beginPath(); ctx.arc(coin.x, coin.y, coin.size + pulse * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = "#fff8c7"; ctx.fillRect(coin.x - 2, coin.y - 8, 4, 8);
  }
  for (const enemy of enemies) if (enemy.x > -50) {
    ctx.shadowColor = "#ff3d8d"; ctx.shadowBlur = 16;
    const enemyGradient = ctx.createLinearGradient(enemy.x, enemy.y, enemy.x, enemy.y + enemy.height);
    enemyGradient.addColorStop(0, "#ff6cab"); enemyGradient.addColorStop(1, "#9e246d");
    ctx.fillStyle = enemyGradient; ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.shadowBlur = 0; ctx.fillStyle = "#251337";
    ctx.fillRect(enemy.x + 6, enemy.y + 7, 5, 6); ctx.fillRect(enemy.x + 19, enemy.y + 7, 5, 6);
    ctx.fillStyle = "#ffd0e5"; ctx.fillRect(enemy.x + 7, enemy.y + 8, 3, 2); ctx.fillRect(enemy.x + 20, enemy.y + 8, 3, 2);
  }
  ctx.shadowColor = "#ffd15c"; ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffd15c"; ctx.fillRect(3480, 300, 8, 170);
  ctx.shadowBlur = 0; ctx.fillStyle = "#ff4fa3";
  ctx.beginPath(); ctx.moveTo(3488, 305); ctx.lineTo(3560, 330); ctx.lineTo(3488, 355); ctx.fill();
  drawPlayer();
  drawParticles();
  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = "#d9e7ff";
  ctx.shadowColor = "#b7c9ff"; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(720, 105, 46, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = "#7280c8";
  ctx.beginPath(); ctx.arc(742, 94, 46, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#151b4b";
  for (let x = -100; x < WORLD_WIDTH; x += 260) {
    const height = 90 + (x * 17 % 130);
    ctx.fillRect(x, 470 - height, 170, height);
    ctx.fillStyle = "#33418a";
    for (let windowY = 490 - height; windowY < 460; windowY += 24) {
      ctx.fillRect(x + 18, windowY, 5, 8); ctx.fillRect(x + 42, windowY, 5, 8);
    }
    ctx.strokeStyle = "#ff2d9a55"; ctx.lineWidth = 2;
    for (let x = 180; x < WORLD_WIDTH; x += 510) {
      ctx.beginPath(); ctx.moveTo(x, 170); ctx.lineTo(x + 190, 230); ctx.lineTo(x + 300, 155); ctx.stroke();
    }
    ctx.fillStyle = "#151b4b";
  }
  ctx.fillStyle = "#8ce8ff";
  for (let x = 80; x < WORLD_WIDTH; x += 210) {
    ctx.globalAlpha = 0.4 + ((x / 210) % 3) * 0.2;
    ctx.beginPath(); ctx.arc(x, 80 + (x % 90), 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGrid() {
  ctx.strokeStyle = "#27f5e61f"; ctx.lineWidth = 1;
  for (let x = -100; x < WORLD_WIDTH; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x + 90, HEIGHT); ctx.stroke();
  }
  for (let y = 480; y < HEIGHT; y += 18) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_WIDTH, y); ctx.stroke();
  }
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.shadowColor = particle.color; ctx.shadowBlur = 12;
    ctx.fillStyle = particle.color; ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function drawPlayer() {
  const bob = player.grounded ? Math.sin(gameTime * 0.12) * 1.5 : 0;
  const x = player.x;
  const y = player.y + bob;
  ctx.shadowColor = "#756dff"; ctx.shadowBlur = 20;
  ctx.fillStyle = "#5d55db";
  ctx.beginPath(); ctx.roundRect(x + 2, y + 7, player.width - 4, player.height - 6, 8); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#a9a5ff";
  ctx.beginPath(); ctx.arc(x + player.width / 2, y + 10, 13, Math.PI, 0); ctx.fill();
  ctx.fillStyle = "#17204d";
  ctx.fillRect(x + 5, y + 12, 20, 8);
  ctx.fillStyle = "#bdfcff";
  ctx.fillRect(x + 8, y + 14, 5, 3); ctx.fillRect(x + 18, y + 14, 5, 3);
  ctx.fillStyle = "#ff6db1";
  ctx.fillRect(x - 4, y + 20, 7, 13);
  ctx.fillStyle = "#3633a0";
  ctx.fillRect(x + 5, y + player.height - 4, 8, 7); ctx.fillRect(x + 18, y + player.height - 4, 8, 7);
}

function loop(time) {
  const delta = Math.min((time - lastTime) / 16.67 || 1, 2);
  lastTime = time; gameTime += delta; update(delta); draw(); requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
  if (["ArrowLeft", "ArrowRight", " ", "a", "d"].includes(event.key)) event.preventDefault();
  if ((event.key === " " || event.key === "ArrowUp" || event.key === "w") && player.grounded && state === "playing") player.vy = -12;
});
window.addEventListener("keyup", (event) => { keys[event.key] = false; });
restartButton.addEventListener("click", resetGame);
resetGame();
requestAnimationFrame(loop);
