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
      coin.collected = true; score++; burst(coin.x, coin.y, "#ffd447", 8); updateHud(`${score}個目のコイン！`);
    }
  }
  for (const enemy of enemies) {
    enemy.x += enemy.vx * delta;
    if (Math.abs(enemy.x - enemy.startX) > 55) enemy.vx *= -1;
    if (rectsOverlap(player, enemy)) {
      if (player.vy > 0 && player.y + player.height - enemy.y < 18) {
        enemy.x = -100; player.vy = -9; score += 2; burst(enemy.x, enemy.y, "#d94b6a", 14); updateHud("敵を踏んだ！");
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
    state = "over"; showOverlay("ゲームオーバー", "敵にぶつかってしまった！ もう一度挑戦しよう。"); return;
  }
  player.x = Math.max(40, player.x - 180); player.y = 250; player.vy = 0;
  updateHud("ぶつかった！ 残り " + lives + " ライフ");
}

function finishGame() {
  state = "won";
  burst(player.x, player.y, "#62c370", 24);
  showOverlay("STAGE CLEAR!", `スコア：${score}　おめでとう！`);
}

function showOverlay(title, text) {
  overlayTitle.textContent = title; overlayText.textContent = text; overlay.classList.remove("hidden");
}

function burst(x, y, color, amount) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 18 + Math.random() * 16, color });
  }
}

function updateParticles(delta) {
  for (const particle of particles) {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.vy += 0.1 * delta;
    particle.life -= delta;
  }
  particles = particles.filter((particle) => particle.life > 0);
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#273469"; ctx.fillRect(0, 0, WIDTH, 360);
  ctx.fillStyle = "#10152b"; ctx.fillRect(0, 360, WIDTH, HEIGHT - 360);
  ctx.save(); ctx.translate(-cameraX, 0);
  drawBackground();
  for (const platform of platforms) {
    ctx.fillStyle = "#8b4b35"; ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#62c370"; ctx.fillRect(platform.x, platform.y, platform.width, 7);
    ctx.fillStyle = "#a86443";
    for (let brickX = platform.x + 8; brickX < platform.x + platform.width - 5; brickX += 32) {
      ctx.fillRect(brickX, platform.y + 14, 22, 5);
    }
  }
  for (const coin of coins) if (!coin.collected) {
    const frame = Math.floor(gameTime / 8) % 2;
    ctx.fillStyle = "#ffd447"; ctx.fillRect(coin.x - 10, coin.y - 10, 20, 20);
    ctx.fillStyle = "#fff4c2"; ctx.fillRect(coin.x - 4, coin.y - 7, 5, 5);
    if (frame) ctx.fillStyle = "#d99435"; ctx.fillRect(coin.x + 4, coin.y - 4, 4, 11);
  }
  for (const enemy of enemies) if (enemy.x > -50) {
    ctx.fillStyle = "#d94b6a"; ctx.fillRect(enemy.x + 4, enemy.y + 8, 22, 20);
    ctx.fillStyle = "#f27c61"; ctx.fillRect(enemy.x + 8, enemy.y + 3, 14, 8);
    ctx.fillStyle = "#10152b"; ctx.fillRect(enemy.x + 8, enemy.y + 12, 5, 5); ctx.fillRect(enemy.x + 18, enemy.y + 12, 5, 5);
    ctx.fillStyle = "#fff4c2"; ctx.fillRect(enemy.x + 9, enemy.y + 13, 3, 3); ctx.fillRect(enemy.x + 19, enemy.y + 13, 3, 3);
    ctx.fillStyle = "#8b4b35"; ctx.fillRect(enemy.x, enemy.y + 28, 30, 4);
  }
  ctx.fillStyle = "#fff4c2"; ctx.fillRect(3480, 300, 8, 170);
  ctx.fillStyle = "#d94b6a";
  ctx.beginPath(); ctx.moveTo(3488, 305); ctx.lineTo(3560, 330); ctx.lineTo(3488, 355); ctx.fill();
  drawPlayer();
  drawParticles();
  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = "#ffd447";
  ctx.fillRect(720, 70, 36, 36);
  ctx.fillStyle = "#fff4c2";
  ctx.fillRect(728, 78, 8, 8);
  ctx.fillStyle = "#1c2857";
  for (let x = -100; x < WORLD_WIDTH; x += 260) {
    const hillHeight = 75 + ((x * 17) % 80);
    ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x + 130, 470 - hillHeight); ctx.lineTo(x + 300, 470); ctx.fill();
  }
  ctx.fillStyle = "#62c370";
  for (let x = 40; x < WORLD_WIDTH; x += 190) {
    ctx.fillRect(x, 438, 8, 32); ctx.fillRect(x - 8, 430, 24, 8);
    ctx.fillStyle = "#3d8f59"; ctx.fillRect(x - 13, 422, 34, 9); ctx.fillStyle = "#62c370";
  }
  ctx.fillStyle = "#fff4c2";
  for (let x = 80; x < WORLD_WIDTH; x += 180) {
    ctx.fillRect(x, 145 + (x % 80), 6, 6);
    ctx.fillRect(x + 10, 145 + (x % 80), 6, 6);
  }
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / 34);
    ctx.fillStyle = particle.color;
    ctx.fillRect(Math.floor(particle.x), Math.floor(particle.y), 5, 5);
  }
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  const bob = player.grounded ? Math.floor(Math.sin(gameTime * 0.12) * 1.5) : 0;
  const x = Math.floor(player.x);
  const y = Math.floor(player.y + bob);
  ctx.fillStyle = "#10152b";
  ctx.fillRect(x + 3, y + 5, 24, 37);
  ctx.fillStyle = "#4f8cff";
  ctx.fillRect(x + 5, y + 7, 20, 27);
  ctx.fillStyle = "#fff4c2";
  ctx.fillRect(x + 8, y + 5, 14, 8);
  ctx.fillStyle = "#273469";
  ctx.fillRect(x + 8, y + 14, 14, 6);
  ctx.fillStyle = "#ffd447";
  ctx.fillRect(x + 10, y + 15, 3, 3); ctx.fillRect(x + 18, y + 15, 3, 3);
  ctx.fillStyle = "#d94b6a";
  ctx.fillRect(x, y + 23, 6, 10);
  ctx.fillStyle = "#273469";
  ctx.fillRect(x + 6, y + 34, 7, 8); ctx.fillRect(x + 18, y + 34, 7, 8);
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
