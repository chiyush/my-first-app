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

const levelPlatforms = [
  [0, 470, 700, 70], [820, 400, 260, 30], [1190, 470, 500, 70],
  [1780, 390, 250, 30], [2120, 470, 480, 70], [2700, 410, 260, 30],
  [3100, 470, 500, 70], [540, 350, 140, 25], [1450, 340, 150, 25],
  [2350, 330, 150, 25], [2900, 300, 150, 25]
];

function resetGame() {
  score = 0; lives = 3; cameraX = 0; state = "playing";
  player = { x: 90, y: 380, width: 30, height: 42, vx: 0, vy: 0, grounded: false };
  platforms = levelPlatforms.map(([x, y, width, height]) => ({ x, y, width, height }));
  coins = [[350, 420], [590, 300], [930, 350], [1330, 420], [1530, 290], [1900, 340],
    [2250, 420], [2420, 280], [2780, 360], [2960, 250], [3300, 420]]
    .map(([x, y]) => ({ x, y, size: 14, collected: false }));
  enemies = [[470, 428], [1350, 428], [1535, 298], [2290, 428], [2790, 368], [3210, 428]]
    .map(([x, y]) => ({ x, y, width: 30, height: 30, vx: 1.2, startX: x }));
  overlay.classList.add("hidden");
  updateHud("ゴールを目指そう！");
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
      coin.collected = true; score++; updateHud(`${score}個の星をゲット！`);
    }
  }
  for (const enemy of enemies) {
    enemy.x += enemy.vx * delta;
    if (Math.abs(enemy.x - enemy.startX) > 55) enemy.vx *= -1;
    if (rectsOverlap(player, enemy)) {
      if (player.vy > 0 && player.y + player.height - enemy.y < 18) {
        enemy.x = -100; player.vy = -9; score += 2; updateHud("敵を踏んだ！");
      } else loseLife();
    }
  }
  if (player.y > HEIGHT + 100) loseLife();
  cameraX += (player.x - cameraX - WIDTH * 0.35) * 0.08;
  cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, cameraX));
  if (player.x > 3480) finishGame();
}

function loseLife() {
  if (state !== "playing") return;
  lives--;
  if (lives <= 0) {
    state = "over"; showOverlay("GAME OVER", "星を集めて、もう一度挑戦しよう。"); return;
  }
  player.x = Math.max(40, player.x - 180); player.y = 250; player.vy = 0;
  updateHud("ぶつかった！ 残り " + lives + " ライフ");
}

function finishGame() {
  state = "won";
  showOverlay("STAGE CLEAR!", `集めた星：${score}　おめでとう！`);
}

function showOverlay(title, text) {
  overlayTitle.textContent = title; overlayText.textContent = text; overlay.classList.remove("hidden");
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#151532"); sky.addColorStop(1, "#4c2773");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.save(); ctx.translate(-cameraX, 0);
  drawBackground();
  for (const platform of platforms) {
    ctx.fillStyle = "#30215c"; ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#65e6b5"; ctx.fillRect(platform.x, platform.y, platform.width, 7);
  }
  for (const coin of coins) if (!coin.collected) {
    ctx.fillStyle = "#ffe16b"; ctx.beginPath(); ctx.arc(coin.x, coin.y, coin.size, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff4b0"; ctx.fillRect(coin.x - 2, coin.y - 8, 4, 8);
  }
  for (const enemy of enemies) if (enemy.x > -50) {
    ctx.fillStyle = "#ff5f85"; ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.fillStyle = "#201635"; ctx.fillRect(enemy.x + 6, enemy.y + 7, 5, 6); ctx.fillRect(enemy.x + 19, enemy.y + 7, 5, 6);
  }
  ctx.fillStyle = "#ffcf5c"; ctx.fillRect(3480, 300, 8, 170);
  ctx.fillStyle = "#ff5fa2"; ctx.beginPath(); ctx.moveTo(3488, 305); ctx.lineTo(3560, 330); ctx.lineTo(3488, 355); ctx.fill();
  ctx.fillStyle = "#7e6bff"; ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = "#f8f7ff"; ctx.fillRect(player.x + 7, player.y + 9, 6, 7); ctx.fillRect(player.x + 20, player.y + 9, 6, 7);
  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = "#27204c";
  for (let x = -100; x < WORLD_WIDTH; x += 260) {
    ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x + 130, 250); ctx.lineTo(x + 300, 470); ctx.fill();
  }
  ctx.fillStyle = "#f8d675";
  for (let x = 80; x < WORLD_WIDTH; x += 210) { ctx.beginPath(); ctx.arc(x, 80 + (x % 90), 2, 0, Math.PI * 2); ctx.fill(); }
}

function loop(time) {
  const delta = Math.min((time - lastTime) / 16.67 || 1, 2);
  lastTime = time; update(delta); draw(); requestAnimationFrame(loop);
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
