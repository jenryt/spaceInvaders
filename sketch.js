const TEXT_COLOR = "white";
const SCORE_SIZE = 27;
const GUN_SPEED = 4;
const BULLET_SPEED = 7;
const BOMB_SPEED = 3;
const ALIEN_INIT_X = 40;
const ALIEN_INIT_Y = 60;
const ALIEN_INIT_SPEED = 1;
const ALIEN_STEP = 54;
const GAME_Y_MAX = 634; // the max of y where game object can go
const BARRIER_SPEED = 1.2;
const OVERLAP_MARGIN = 7.5; // Shrinks each object’s collision boundary by 7.5 * 2 px on each side

// === Assets ===
let backgroundImg, alienImg, bombImg, gunImg, bulletImg, barrierImg;

// === Canvas/UI setup ===
let score, scoreTxt;
let pauseBtn, restartBtn;

// === Touch capable setup ====
let leftBtn, rightBtn, fireBtn;
let scaleFactor;

// === Game objects ===
let alien, bomb, gun, bullet, barrier;

// === Timers ===
let alienHitTime = 0;
let gameOverTime = 0;

// === Flags ===
let isGameOver = false;
let confirmShown = false;
let isPaused = false;

// === Touch capable flags ===
let mvLeft = false;
let mvRight = false;
let firing = false;

function preload() {
  backgroundImg = loadImage("assets/galaxy_grassField.png");
  alienImg = loadImage("assets/alien.png");
  bombImg = loadImage("assets/hayBale.png");
  gunImg = loadImage("assets/guineaPig.png");
  bulletImg = loadImage("assets/guineaPigPoop.png");
  barrierImg = loadImage("assets/blueCloud.png");
}

function setup() {
  console.log(navigator.userAgent);
  console.log("isTouchCapable? " + isTouchCapable());
  // getScaleFactor();
  scaleFactor = min(windowWidth / 540, windowHeight / 720);
  createCanvas(540 * scaleFactor, 720 * scaleFactor);

  restartBtn = createButton('<i class="fa-solid fa-rotate-right "></i>');
  btnStyle(restartBtn, 25, 20, 30, 30);

  pauseBtn = createButton('<i class="fa-solid fa-pause "></i>');
  btnStyle(pauseBtn, 65, 20, 30, 30);

  restartBtn.mousePressed(() => {
    resetGame();
    loop();
  });

  pauseBtn.mousePressed(() => {
    togglePause();
  });

  if (isTouchCapable()) {
    document.oncontextmenu = () => false;

    // create left, right, and fire button
    leftBtn = createButton('<i class="fa-solid fa-arrow-left "></i>');
    touchBtnStyle(leftBtn, 180, GAME_Y_MAX + 40, 40, 40);

    fireBtn = createButton('<i class="fa-solid fa-meteor "></i>');
    touchBtnStyle(fireBtn, 250, GAME_Y_MAX + 40, 40, 40);

    rightBtn = createButton('<i class="fa-solid fa-arrow-right "></i>');
    touchBtnStyle(rightBtn, 320, GAME_Y_MAX + 40, 40, 40);

    leftBtn.mousePressed(() => (mvLeft = true));
    leftBtn.mouseReleased(() => (mvLeft = false));
    leftBtn.touchStarted(() => (mvLeft = true));
    leftBtn.touchEnded(() => (mvLeft = false));

    rightBtn.mousePressed(() => (mvRight = true));
    rightBtn.mouseReleased(() => (mvRight = false));
    rightBtn.touchStarted(() => (mvRight = true));
    rightBtn.touchEnded(() => (mvRight = false));

    fireBtn.mousePressed(() => (firing = true));
    fireBtn.mouseReleased(() => (firing = false));
    fireBtn.touchStarted(() => (firing = true));
    fireBtn.touchEnded(() => (firing = false));
  }

  resetGame();
}

function draw() {
  scale(scaleFactor);
  background(backgroundImg);

  console.log("mvLeft:", mvLeft, "mvRight:", mvRight);

  handleAlien();
  handleGun();
  handleBomb();
  handleBullet();
  handleBarrier();
  // image(
  //   barrierImg,
  //   barrier.x - barrier.w / 2,
  //   barrier.y - barrier.h / 2,
  //   barrier.w,
  //   barrier.h
  // ); // Setting a barrier that is horizontally centered, and a little above the gun

  // Update score
  textSize(scoreTxt.size);
  fill(TEXT_COLOR);
  textAlign(RIGHT, TOP);
  text(score, scoreTxt.x, scoreTxt.y); // Initialize the scoreText on top right corner wirh the iniitial content of zero.

  if (isGameOver) {
    // Check if play again
    gameOverTxt();
    if (millis() - gameOverTime > 500 && !confirmShown) {
      playAgain();
    }
  }
}

// === Game Control Functions ===
function resetGame() {
  alienHitTime = 0;
  gameOverTime = 0;

  isGameOver = false;
  confirmShown = false;
  isPaused = false;

  mvLeft = false;
  mvRight = false;
  firing = false;

  // Score
  score = 0;
  scoreTxt = {
    x: 510,
    y: 20,
    size: SCORE_SIZE * scaleFactor,
  };

  // Alien
  alienHitTime = 0;
  alien = {
    x: ALIEN_INIT_X,
    y: ALIEN_INIT_Y,
    w: 80,
    h: 50,
    speed: ALIEN_INIT_SPEED,
    xMin: 40,
    xMax: 500,
    hit: false,
    visible: true,
  };

  // Bomb
  resetBomb();

  // Gun
  gun = { x: 35, y: GAME_Y_MAX, w: 70, h: 72, xMin: 35, xMax: 505, hit: false };

  // Bullet
  resetBullet();
  // Barrier
  barrier = {
    x: 270,
    y: 500,
    w: 80,
    h: 54,
    speed: BARRIER_SPEED,
    xMin: 40,
    xMax: 500,
    hit: false,
  };
}

function playAgain() {
  let playAgain = confirm("Would you like to play again?");
  confirmShown = true;

  if (playAgain) {
    resetGame();
    loop(); // If users click yes to play agian, restart the app.
  } else {
    noLoop();
  } // If users click no, end the app.
}

function gameOverTxt() {
  push();
  textSize(60);
  fill(TEXT_COLOR);
  textAlign(CENTER, CENTER);
  text("GAME OVER!", (0.5 * width) / scaleFactor, (0.3 * height) / scaleFactor);
  pop();
}

function togglePause() {
  if (isPaused) {
    pauseBtn.html('<i class="fas fa-pause "></i>');
    loop();
  } else {
    pauseBtn.html('<i class="fas fa-play "></i>');
    noLoop();
  }
  isPaused = !isPaused;
}

// === Main Game Logic Handlers ===
function handleAlien() {
  // Alien setup
  if (!isGameOver) {
    alien.x += alien.speed; // Set alien's horizontal traveling speed to 0.2

    /* Alien movement
     * When alien reach the edge on x-axis, reverse the traveling direction,
     * lower by 9 on the y-axis (closer to gun),
     * and increase the traveling spped by 1.2 times.
     */
    if (alien.x > alien.xMax || alien.x < alien.xMin) {
      alien.speed = -alien.speed * 1.2;
      alien.y += ALIEN_STEP;
    }
  }

  if (alien.visible) {
    image(
      alienImg,
      alien.x - alien.w / 2,
      alien.y - alien.h / 2,
      alien.w,
      alien.h
    );
  } else {
    if (!isGameOver) {
      handleAlienReappear();
    }
  }

  // Check if alien hits the gun (Game over)
  if (!isGameOver && hit(alien, gun)) {
    isGameOver = true;
    gameOverTime = millis();
    // gameOverTxt();
  }
}

function handleAlienReappear() {
  /*
   * Alien's behavior when being hit
   * Alien will temporary disappear and reappear soon after disappearing.
   * Alien will return to the top left initial postion,
   * and its travel speed will be reset to its initial travel speed.
   */
  // Delay by 0.5 second to make alien reappear after being hit
  if (alien.hit && millis() - alienHitTime > 500) {
    alien.x = ALIEN_INIT_X; // Set alien back to initial position where x = 40.
    alien.y = ALIEN_INIT_Y; // Set alien back to initial position where y = 60.
    alien.speed = ALIEN_INIT_SPEED; // Set alien's travel speed to its initial travel speed.
    alien.visible = true;
    alien.hit = false;
  }
}

function handleGun() {
  // Gun setup
  // Gun movement with edge detection and vibration effect
  if (!isGameOver) {
    if (keyIsDown(RIGHT_ARROW) || mvRight)
      if (gun.x >= gun.xMax) {
        gun.x = gun.xMax;
        gun.x += random(-1, 1); // Vibration effect to remind users that they have reach the right edge
      } else gun.x += GUN_SPEED; // Move the gun to the right

    if (keyIsDown(LEFT_ARROW) || mvLeft)
      if (gun.x <= gun.xMin) {
        gun.x = gun.xMin;
        gun.x += random(-1, 1); // Vibration effect to remind users that they have reach the left edge
      } else gun.x -= GUN_SPEED; // Move the gun to the left
  } else {
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(LEFT_ARROW) || mvRight || mvLeft) {
      gun.x += random(-1, 1);
    }
  }
  image(gunImg, gun.x - gun.w / 2, gun.y - gun.h / 2, gun.w, gun.h);
}

function handleBomb() {
  // When alien cruise over gun, drop the bomb
  if (!isGameOver && alien.visible && !bomb.inAction && overHead(alien, gun)) {
    bomb.x = alien.x;
    bomb.y = alien.y + alien.h / 2 + bomb.h / 2;
    bomb.inAction = true;
  }
  // Bomb movement
  if (bomb != null && bomb.inAction) {
    if (!isGameOver) {
      bomb.y += BOMB_SPEED; // Bomb travel downward toward gun.

      if (bomb.y > GAME_Y_MAX) {
        // Bomb delete when it goes off the screen.
        bomb.inAction = false;
        resetBomb();
      } else if (hit(bomb, barrier)) {
        // Bomb is deleted when it hits the barrier.
        bomb.inAction = false;
        resetBomb();
        barrier.hit = true;
      } else if (hit(bomb, gun)) {
        isGameOver = true;
        gameOverTime = millis();
        // gameOverTxt();
      }
    }

    image(bombImg, bomb.x - bomb.w / 2, bomb.y - bomb.h / 2, bomb.w, bomb.h);
  }
}

function handleBullet() {
  /* Firing logic:
   * When space-key is pressed and bullet is not in action,
   * the bullet's x coordinate is set to gun's x coordinate at the moment "space" is pressed.
   * bulletInAct then being set to true
   */
  if (!isGameOver && (keyIsDown(32) || firing) && !bullet.inAction) {
    bullet.x = gun.x;
    bullet.y = gun.y - gun.h / 2;
    bullet.inAction = true; // Set bulletInAct to true when a bullet is shot
  }

  // Bullet movement
  if (!isGameOver && bullet != null && bullet.inAction) {
    bullet.y -= BULLET_SPEED; // Bullet travel straight upward toward the alien
    // push();
    // translate(bullet.x, bullet.y);
    // rotate(HALF_PI); // to rotate the image by 90°
    // image(bulletImg, -bullet.w / 2, -bullet.h / 2, bullet.w, bullet.h); // Initialize the bullet and position above the gun.
    // pop();
    image(
      bulletImg,
      bullet.x - bullet.w / 2,
      bullet.y - bullet.h / 2,
      bullet.w,
      bullet.h
    ); // Initialize the bullet and position above the gun.

    // Behavior if bullet goes off the screen
    if (bullet.y < 0) {
      bullet.inAction = false;
      resetBullet();
    }
    // Behavior if bullet hits the barrier
    else if (hit(bullet, barrier)) {
      bullet.inAction = false;
      barrier.hit = true;
      resetBullet();
    } else if (hit(bullet, alien)) {
      alienHitTime = millis(); // Recording the hit time when alien get hit for later use.
      /* Scoring logic
       * If the bullet hits the alien,
       * score will increase by one, and the bullet will be reset
       */
      score++; // Increase the score by 1 everytime bullet hits the alien
      bullet.inAction = false;
      alien.hit = true;
      alien.visible = false; // Set the alien.visible to false to make alien disappear.
      resetBullet();
    }
  }
}

function handleBarrier() {
  if (!isGameOver) {
    barrier.x += barrier.speed;
    if (barrier.x >= barrier.xMax || barrier.x <= barrier.xMin) {
      barrier.speed = -barrier.speed;
    }
  }

  image(
    barrierImg,
    barrier.x - barrier.w / 2,
    barrier.y - barrier.h / 2,
    barrier.w,
    barrier.h
  ); // Setting a barrier that is horizontally centered, and a little above the gun
}

// === Utility/ Helper Functions ===
function hit(obj1, obj2) {
  // set boundary for obj1
  let left1 = obj1.x - (obj1.w / 2 - OVERLAP_MARGIN);
  let right1 = obj1.x + (obj1.w / 2 - OVERLAP_MARGIN);
  let top1 = obj1.y - (obj1.h / 2 - OVERLAP_MARGIN);
  let bottom1 = obj1.y + (obj1.h / 2 - OVERLAP_MARGIN);

  // set boundary for obj2
  let left2 = obj2.x - (obj2.w / 2 - OVERLAP_MARGIN);
  let right2 = obj2.x + (obj2.w / 2 - OVERLAP_MARGIN);
  let top2 = obj2.y - (obj2.h / 2 - OVERLAP_MARGIN);
  let bottom2 = obj2.y + (obj2.h / 2 - OVERLAP_MARGIN);

  let horizontalOverlap = right1 >= left2 && left1 <= right2;
  let verticalOverlap = bottom1 >= top2 && top1 <= bottom2;

  return horizontalOverlap && verticalOverlap;
}

function overHead(obj1, obj2) {
  // When two objects’ x-ranges overlap
  let left1 = obj1.x - (obj1.w / 2 - OVERLAP_MARGIN);
  let right1 = obj1.x + (obj1.w / 2 - OVERLAP_MARGIN);

  let left2 = obj2.x - (obj2.w / 2 - OVERLAP_MARGIN);
  let right2 = obj2.x + (obj2.w / 2 - OVERLAP_MARGIN);

  return right1 >= left2 && left1 <= right2;
}

function resetBullet() {
  bullet = { x: 0, y: 0, w: 40, h: 36, inAction: false };
}

function resetBomb() {
  bomb = { x: 0, y: 0, w: 40, h: 36, inAction: false };
}

function isTouchCapable() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function getScaleFactor() {
  let w = windowWidth;
  let h = windowHeight;
  let targetRatio = 3 / 4;

  if (w / h > targetRatio) {
    // Too wide
    scaleFactor = windowHeight / 720;
  } else {
    // Too high
    scaleFactor = windowWidth / 540;
  }
}

// === UI/ Styling Functions ===
function btnStyle(obj, x, y, w, h) {
  let size = 1 * scaleFactor;
  obj.position(x * scaleFactor, y * scaleFactor);
  obj.size(w * scaleFactor, h * scaleFactor);
  obj.style("font-size", size + "em");
  obj.style("border", "none");
  obj.style("color", "white");
  obj.style("background-color", "rgba(255, 255, 255, 0.3)");
  obj.style("border-radius", "9px");
  obj.style("padding", "0");
  obj.style("display", "flex");
  obj.style("justify-content", "center");
  obj.style("align-items", "center");
  obj.style("text-align", "center");
}

function touchBtnStyle(obj, x, y, w, h) {
  let size = 1.5 * scaleFactor;
  obj.position(x * scaleFactor, y * scaleFactor);
  obj.size(w * scaleFactor, h * scaleFactor);
  obj.style("font-size", size + "em");
  obj.style("border", "none");
  obj.style("color", "black");
  obj.style("background-color", "rgba(255, 255, 255, 0.3)");
  obj.style("border-radius", "12px");
  obj.style("padding", "0");
  obj.style("display", "flex");
  obj.style("justify-content", "center");
  obj.style("align-items", "center");
  obj.style("text-align", "center");
}
