const TEXT_COLOR = "white";
const SCORE_SIZE = 27;
const GUN_SPEED = 4;
const BULLET_SPEED = 7;
const BOMB_SPEED = 3;
const ALIEN_INIT_X = 40;
const ALIEN_INIT_Y = 60;
const ALIEN_INIT_SPEED = 1;

let backgroundImg, alienImg, bombImg, gunImg, bulletImg, barrierImg;
let score, scoreTxt, alien, bomb, gun, bullet, barrier;
let alienHitTime = 0;
let isGameOver = false;
let gameOverTime = 0;

function preload() {
  backgroundImg = loadImage("assets/galaxy_grassField.png");
  alienImg = loadImage("assets/alien.png");
  bombImg = loadImage("assets/hayBale.png");
  gunImg = loadImage("assets/guineaPig.png");
  bulletImg = loadImage("assets/guineaPigPoop.png");
  barrierImg = loadImage("assets/blueCloud.png");
}

function setup() {
  createCanvas(540, 720);
  resetGame();
}

// ct.image() -> image(img, x, y)
// ct.image(img, x, y, size) -> image(img, x, y, width, height);
function draw() {
  background(backgroundImg);
  //   console.log("alienHit:", alien.hit, "alien.visible:", alien.visible);

  handleAlien();
  handleGun();
  handleBomb();
  handleBullet();

  image(
    barrierImg,
    barrier.x - barrier.w / 2,
    barrier.y - barrier.h / 2,
    barrier.w,
    barrier.h
  ); // Setting a barrier that is horizontally centered, and a little above the gun

  // Update score
  textSize(scoreTxt.size);
  fill(TEXT_COLOR);
  textAlign(RIGHT, TOP);
  text(score, scoreTxt.x, scoreTxt.y); // Initialize the scoreText on top right corner wirh the iniitial content of zero.

  // Check if play again
  if (isGameOver && millis() - gameOverTime > 500) {
    isGameOver = false;
    playAgain();
  }
}

function resetGame() {
  // Score
  score = 0;
  scoreTxt = {
    x: 510,
    y: 20,
    size: SCORE_SIZE,
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
  gun = { x: 35, y: 684, w: 70, h: 72, xMin: 35, xMax: 505, hit: false };

  // Bullet
  resetBullet();
  // Barrier
  barrier = { x: 270, y: 500, w: 80, h: 54, hit: false };
}

function handleAlien() {
  // Alien setup
  alien.x += alien.speed; // Set alien's horizontal traveling speed to 0.2
  console.log("speed no turn" + alien.speed);

  /* Alien movement
   * When alien reach the edge on x-axis, reverse the traveling direction,
   * lower by 9 on the y-axis (closer to gun),
   * and increase the traveling spped by 1.2 times.
   */
  if (alien.x > alien.xMax || alien.x < alien.xMin) {
    alien.speed = -alien.speed * 1.2;
    alien.y += 54;
    console.log("speed after turn" + alien.speed);
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
    handleAlienReappear();
    console.log("speed after reappear" + alien.speed);
  }

  // Check if alien hits the gun (Game over)
  if (hit(alien, gun)) {
    isGameOver = true;
    gameOverTime = millis();
    gameOverTxt();
  }
}

function handleGun() {
  // Gun setup
  // Gun movement with edge detection and vibration effect
  if (keyIsDown(RIGHT_ARROW))
    if (gun.x >= gun.xMax) {
      gun.x = gun.xMax;
      gun.x += random(-1, 1); // Vibration effect to remind users that they have reach the right edge
    } else gun.x += GUN_SPEED; // Move the gun to the right

  if (keyIsDown(LEFT_ARROW))
    if (gun.x <= gun.xMin) {
      gun.x = gun.xMin;
      gun.x += random(-1, 1); // Vibration effect to remind users that they have reach the left edge
    } else gun.x -= GUN_SPEED; // Move the gun to the left

  image(gunImg, gun.x - gun.w / 2, gun.y - gun.h / 2, gun.w, gun.h);
}

function handleBomb() {
  // When alien cruise over gun, drop the bomb
  if (alien.visible && !bomb.inAction && overHead(alien, gun)) {
    bomb.x = alien.x;
    bomb.y = alien.y + 36;
    bomb.inAction = true;
  }
  // Bomb movement
  if (bomb != null && bomb.inAction) {
    bomb.y += BOMB_SPEED; // Bomb travel downward toward gun.
    image(bombImg, bomb.x - bomb.w / 2, bomb.y - bomb.h / 2, bomb.w, bomb.h);

    if (bomb.y > height) {
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
      gameOverTxt();
    }
  }
}

function handleBullet() {
  /* Firing logic:
   * When space-key is pressed and bullet is not in action,
   * the bullet's x coordinate is set to gun's x coordinate at the moment "space" is pressed.
   * bulletInAct then being set to true
   */
  if (keyIsDown(32) && !bullet.inAction) {
    bullet.x = gun.x;
    bullet.y = gun.y - gun.h / 2;
    bullet.inAction = true; // Set bulletInAct to true when a bullet is shot
    console.log(bullet == null);
  }

  // Bullet movement
  if (bullet != null && bullet.inAction) {
    bullet.y -= BULLET_SPEED; // Bullet travel straight upward toward the alien
    push();
    translate(bullet.x, bullet.y);
    rotate(HALF_PI); // to rotate the image by 90°
    image(bulletImg, -bullet.w / 2, -bullet.h / 2, bullet.w, bullet.h); // Initialize the bullet and position above the gun.
    pop();

    // Behavior if bullet goes off the screen
    if (bullet.y < 0) {
      bullet.inAction = false;
      bullet = null;
      resetBullet();
    }
    // Behavior if bullet hits the barrier
    else if (hit(bullet, barrier)) {
      bullet.inAction = false;
      bullet = null;
      barrier.hit = true;
      resetBullet();
    } else if (hit(bullet, alien)) {
      alienHitTime = millis(); // Recording the hit time when alien get hit for later use.
      console.log("in handleBullet - alien hit time: " + alienHitTime);
      /* Scoring logic
       * If the bullet hits the alien,
       * score will increase by one, and the bullet will reset to null
       */
      score++; // Increase the score by 1 everytime bullet hits the alien
      bullet.inAction = false;
      bullet = null;
      alien.hit = true;
      alien.visible = false; // Set the alien.visible to false to make alien disappear.
      resetBullet();
    }
  }
}

function playAgain() {
  let playAgain = confirm("Would you like to play again?");
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
  text("GAME OVER!", 0.5 * width, 0.3 * height);
  pop();
}

function resetBullet() {
  bullet = { x: 0, y: 0, w: 40, h: 36, inAction: false };
}

function resetBomb() {
  bomb = { x: 0, y: 0, w: 40, h: 36, inAction: false };
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

// Utility functions
function hit(obj1, obj2) {
  // set boundary for obj1
  let left1 = obj1.x - obj1.w / 2;
  let right1 = obj1.x + obj1.w / 2;
  let top1 = obj1.y - obj1.h / 2;
  let bottom1 = obj1.y + obj1.h / 2;

  // set boundary for obj2
  let left2 = obj2.x - obj2.w / 2;
  let right2 = obj2.x + obj2.w / 2;
  let top2 = obj2.y - obj2.h / 2;
  let bottom2 = obj2.y + obj2.h / 2;

  let horizontalOverlap = right1 >= left2 && left1 <= right2;
  let verticalOverlap = bottom1 >= top2 && top1 <= bottom2;

  return horizontalOverlap && verticalOverlap;
}

// When two objects’ x-ranges overlap
function overHead(obj1, obj2) {
  let left1 = obj1.x - obj1.w / 2;
  let right1 = obj1.x + obj1.w / 2;

  let left2 = obj2.x - obj2.w / 2;
  let right2 = obj2.x + obj2.w / 2;

  return right1 >= left2 && left1 <= right2;
}
