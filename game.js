// Grab canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Canvas dimensions doubled
const WIDTH = canvas.width;   // 2048
const HEIGHT = canvas.height; // 1152

// Make the "floor" the very bottom of the canvas
const FLOOR = HEIGHT; 

// We'll scale the character by 2x (adjust as needed)
const SCALE = 2; 

// Gravity
const GRAVITY = 0.5;

// Background layers
const backgroundLayers = [
  "assets/background/1.png",
  "assets/background/2.png",
  "assets/background/3.png",
  "assets/background/4.png"
];
let bgImages = [];
let bgPositions = [];

/**
 * Character sprite data
 * (Adjust frames/frameWidth/frameHeight to match your actual sprite sheets.)
 */
const characterSprites = {
  idle: {
    src: "assets/character/Idle.png",
    frames: 6,
    currentFrame: 0,
    frameWidth: 128,
    frameHeight: 128,
    frameSpeed: 8
  },
  walk: {
    src: "assets/character/Walk.png",
    frames: 10,
    currentFrame: 0,
    frameWidth: 128,
    frameHeight: 128,
    frameSpeed: 8
  },
  run: {
    src: "assets/character/Run.png",
    frames: 10,
    currentFrame: 0,
    frameWidth: 128,
    frameHeight: 128,
    frameSpeed: 5
  },
  jump: {
    src: "assets/character/Hurt.png",
    frames: 3,
    currentFrame: 0,
    frameWidth: 128,
    frameHeight: 128,
    frameSpeed: 5
  },
  attack: {
    src: "assets/character/Attack.png",
    frames: 4,
    currentFrame: 0,
    frameWidth: 128,
    frameHeight: 128,
    frameSpeed: 5
  },
  hurt: {
    src: "assets/character/Hurt.png",
    frames: 3,
    currentFrame: 0,
    frameWidth: 128,
    frameHeight: 128,
    frameSpeed: 5
  },
  dead: {
    src: "assets/character/Dead.png",
    frames: 5,
    currentFrame: 0,
    frameWidth: 128,
    frameHeight: 128,
    frameSpeed: 5
  }
};

// Loaded sprite images
let loadedSprites = {};

// Character state
let character = {
  x: 100,
  y: FLOOR,     // The bottom of the sprite is at FLOOR
  vx: 0,
  vy: 0,
  speedWalk: 3, // walk speed
  speedRun: 6,  // run speed
  jumping: false,
  currentAction: "idle",
  frameCount: 0
};

// Input flags
let keys = {
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
  KeyA: false,
  KeyD: false
};

// ----------------------------------------------------------
// 1) LOAD ASSETS
// ----------------------------------------------------------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
}

async function loadAllAssets() {
  // Load background images
  for (let i = 0; i < backgroundLayers.length; i++) {
    let img = await loadImage(backgroundLayers[i]);
    bgImages.push(img);
    bgPositions.push(0);
  }
  // Load character sprites
  for (const [action, spriteData] of Object.entries(characterSprites)) {
    loadedSprites[action] = await loadImage(spriteData.src);
  }
}

// ----------------------------------------------------------
// 2) INPUT LISTENERS
// ----------------------------------------------------------
window.addEventListener("keydown", (e) => {
  if (e.code in keys) {
    keys[e.code] = true;
  }
});
window.addEventListener("keyup", (e) => {
  if (e.code in keys) {
    keys[e.code] = false;
  }
});

// ----------------------------------------------------------
// 3) UPDATE LOGIC
// ----------------------------------------------------------
function update() {
  // Reset horizontal velocity
  character.vx = 0;

  // Check if user wants to run (KeyD) or walk
  const isRunning = keys.KeyD;

  // If we press left or right, choose walk or run accordingly
  if (keys.ArrowLeft) {
    character.vx = isRunning ? -character.speedRun : -character.speedWalk;
    character.currentAction = isRunning ? "run" : "walk";
  }
  if (keys.ArrowRight) {
    character.vx = isRunning ? character.speedRun : character.speedWalk;
    character.currentAction = isRunning ? "run" : "walk";
  }

  // Jump (space)
  if (keys.Space && !character.jumping) {
    character.vy = -10;
    character.jumping = true;
    character.currentAction = "jump";
  }
  // Attack (A), only if not jumping (to demonstrate priority)
  else if (keys.KeyA && !character.jumping) {
    character.currentAction = "attack";
  }
  // If no horizontal movement & not jumping/attacking => idle
  else if (!keys.ArrowLeft && !keys.ArrowRight && !character.jumping && !keys.KeyA) {
    character.currentAction = "idle";
  }

  // Apply gravity
  character.vy += GRAVITY;

  // Update position
  character.x += character.vx;
  character.y += character.vy;

  // Floor collision
  if (character.y > FLOOR) {
    character.y = FLOOR;
    character.vy = 0;
    character.jumping = false;
  }

  // Enforce horizontal boundaries (using scaled sprite width)
  const spriteData = characterSprites[character.currentAction];
  const scaledWidth = spriteData.frameWidth * SCALE;

  if (character.x < 0) character.x = 0;
  if (character.x > WIDTH - scaledWidth) {
    character.x = WIDTH - scaledWidth;
  }

  // Parallax background
  for (let i = 0; i < bgPositions.length; i++) {
    const layerSpeed = 0.2 * (i + 1);
    bgPositions[i] -= character.vx * layerSpeed;
    if (bgPositions[i] <= -WIDTH) {
      bgPositions[i] = 0;
    }
    if (bgPositions[i] >= WIDTH) {
      bgPositions[i] = 0;
    }
  }

  // Update animation frames
  handleAnimation();
}

function handleAnimation() {
  const action = character.currentAction;
  const spriteData = characterSprites[action];

  character.frameCount++;
  if (character.frameCount >= spriteData.frameSpeed) {
    spriteData.currentFrame = (spriteData.currentFrame + 1) % spriteData.frames;
    character.frameCount = 0;
  }
}

// ----------------------------------------------------------
// 4) DRAW
// ----------------------------------------------------------
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Draw background layers
  for (let i = 0; i < bgImages.length; i++) {
    const img = bgImages[i];
    const pos = bgPositions[i];
    ctx.drawImage(img, pos, 0, WIDTH, HEIGHT);
    ctx.drawImage(img, pos + WIDTH, 0, WIDTH, HEIGHT);
  }

  // Draw character
  const action = character.currentAction;
  const spriteData = characterSprites[action];
  const spriteSheet = loadedSprites[action];

  // Source slice on sprite sheet
  const frameX = spriteData.currentFrame * spriteData.frameWidth;
  const frameY = 0; // single row

  // We'll draw the character at 2x scale
  const drawWidth = spriteData.frameWidth * SCALE;
  const drawHeight = spriteData.frameHeight * SCALE;

  // Flip horizontally if moving left
  const flip = (character.vx < 0);

  ctx.save();
  if (flip) {
    // Translate to the center so we can flip around the sprite
    ctx.translate(character.x + drawWidth / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-character.x - drawWidth / 2, 0);
  }

  // Because the "character.y" is the bottom of the sprite,
  // draw the sprite so its bottom aligns with y.
  ctx.drawImage(
    spriteSheet,
    frameX, frameY,
    spriteData.frameWidth, spriteData.frameHeight,
    character.x,
    character.y - drawHeight,
    drawWidth, drawHeight
  );
  ctx.restore();
}

// ----------------------------------------------------------
// 5) MAIN LOOP
// ----------------------------------------------------------
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// ----------------------------------------------------------
// STARTUP
// ----------------------------------------------------------
loadAllAssets()
  .then(() => {
    gameLoop();
  })
  .catch((err) => {
    console.error("Error loading assets:", err);
  });
