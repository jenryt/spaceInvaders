class SpaceInvader
{
	// Constants
	final double SCORE_SIZE = 10;
	final double GUN_SPEED = 1.0;
	final double BULLET_SPEED = 0.7;
	final double BOMB_SPEED = 0.3;
	final String TEXT_COLOR = "white";

	// Declaring game objects: alien, gun, bullet, barrier, bomb, and score text.
	GameObj alien;
	GameObj gun;
	GameObj bullet;
	GameObj barrier;
	GameObj bomb;
	GameObj scoreText;

	// State variables
	boolean bulletInAct = false; // true if the bullet is fired and in action.
	boolean alienHit = false; // true if the alien got hit.
	boolean bombInAct = false; // true if the bomb is dropped and in action.
	boolean barrierHit = false; // true if barrier got hit -> bullet/bomb deleted without further action.
	
	int alienHitTime; // Time when alien is hit
	int score; // Player's score

	double initAlienSpeed = 0.2; // Initial speed of the alien
	double alienCurrSpeed; // Current speed of the alien
	
	public void start()
	{
		// Setting up the game environment
		ct.setTitle("WHEEK Space Invader"); // Setting app title to "WHEEK Space Invader" (WHEEK is the sound that guinea pigs make.)
		ct.setBackImage("galaxy_grassField.png"); // Setting background image.

		// Score
		scoreText = ct.text("0", 95, 5, SCORE_SIZE, TEXT_COLOR); // Initialize the scoreText on top right corner wirh the iniitial content of zero.
		score = 0;

		// Alien setup
		alien = ct.image("alien.png", 6, 10, 12); // Initialize alien to a image with size 12, starting at (6,10)
		// alien.setXSpeed(ct.random(1, 3) * 0.1); // Set alien's horizontal traveling speed randomly between 0.1 to 0.3
		alien.setXSpeed(initAlienSpeed); // Set alien's horizontal traveling speed to 0.2
		
		// Gun setup
		gun = ct.image("guineaPig.png", 6, 95, 9);
		
		// Bullet setup (initiallu null)
		bullet = null;

		// Barrier setup
		barrier = ct.image("blueCloud.png", 50, 72, 15); // Setting a barrier that is horizontally centered, and a little above the gun
		barrier.setSize(15,9); // Adjust the size of the barrier
		
		// Bomb setup (initiallu null)
		bomb = null;
	}

	public void update()
	{
		/* Alien movement
		 * When alien reach the edge on x-axis, reverse the traveling direction,
		 * lower by 9 on the y-axis (closer to gun),
		 * and increase the traveling spped by 1.2 times.
		 */
		alienCurrSpeed = Math.abs(alien.getXSpeed()); // Get the absolute value of the current x speed of the alien.

		if (alien.x > 94 || alien.x < 6)
		{
			alien.setXSpeed( -alien.getXSpeed() * 1.2); // Increse speed by 20% of its current speed and reverse travel direction
			alien.y += 9; // Move alien downward toward the gun
		}

		// Check if alien hits the gun (Game over)
		if (alien.hit(gun))
		{
			ct.text("GAME OVER!", 50, 30, 15, TEXT_COLOR);
			if (ct.inputYesNo( "Would you like to play again?" ))
				ct.restart();
			else
				ct.stop();
		}

		// Gun movement with edge detection and vibration effect
		if (ct.keyPressed("right"))
			if (gun.x >= 94)
			{
				gun.x = 94;
				gun.x += (ct.random(-1, 1)) / 100.0; // Vibration effect to remind users that they have reach the right edge
			}
			else
				gun.x += GUN_SPEED; // Move the gun to the right
		if (ct.keyPressed("left"))
			if (gun.x <= 6)
			{	
				gun.x = 6;
				gun.x += (ct.random(-1, 1)) / 100.0; // Vibration effect to remind users that they have reach the left edge
			}
			else
				gun.x -= GUN_SPEED; // Move the gun to the left
		
		/* Firing logic: 
		 * When "space" is pressed and bullet is not in action,
		 * the bullet's x coordinate is set to gun's x coordinate at the moment "space" is pressed.
		 * bulletInAct then being set to true
		 */
		if (ct.keyPressed("space") && !bulletInAct)
		{
			bullet = ct.image("guineaPigPoop.png", gun.x, gun.y - 6, 6); // Initialize the bullet and position above the gun.
			bulletInAct = true; // Set bulletInAct to true when a bullet is shot 	
		}
		
		// Bullet movement
		if (bulletInAct && bullet != null)
		{
			bullet.setYSpeed(-BULLET_SPEED); // Bullet travel straight upward toward the alien
			// Behavior if bullet goes off the screen
			if (bullet.y < 0)
			{
				bulletInAct = false;
				bullet.delete();
				bullet = null;
			}
			// Behavior if bullet hits the barrier
			else if (bullet.hit(barrier))
			{
				ct.println("Oops! your bullet hits the barrier. Fire again!"); 
				bulletInAct = false;
				bullet.delete();
				bullet = null;
				barrierHit = true;
			}
			/* Scoring logic
			 * If the bullet hits the alien,
			 * score will increase by one, and the bullet will reset to null
			 * If the bullet does not hit the alien, score remain unchanged.
		 	 */
			else if (bullet.hit(alien))
			{
				ct.println("Scored! You just shot the alien!"); 
				score ++; // Increase the score by 1 everytime bullet hits the alien
				scoreText.setText(ct.formatInt(score)); // Update the scoreText to align with score
				bulletInAct = false;
				bullet.delete();
				bullet = null;
				alienHit = true;
				alienHitTime = ct.getTimer(); // Recording the hit time when alien get hit for later use.
			}
		}

		/*
		 * Alien's behavior when being hit
		 * Alien will temporary disappear and reappear soon after disappearing.
		 * Alien will return to the top left initial postion, 
		 * and its travel speed will be reset to its initial travel speed.
		 */
		if (alienHit)
		{
			alien.x = 6; // Set alien back to initial position where x = 6.
			alien.y = 10; // Set alien back to initial position where y = 10.
			alien.setXSpeed(initAlienSpeed); // Set alien's travel speed to its initial travel speed.
			alien.visible = false; // Set the alien.visible to false to make alien disappear.
		}

		// Delay by 0.5 second to make alien reappear after being hit
		if (alienHit && ct.getTimer() - alienHitTime > 500)
		{
			alien.visible = true;
			alienHit = false;
		}
		
		// When alien cruise over gun by +- 2 pixel on gun's x coordinate, drop the bomb
		if (alien.x > gun.x - 2 && alien.x < gun.x+2 && !bombInAct)
		{
			ct.println("alien over head!");
			bomb = ct.image("hayBale.png", alien.x, alien.y + 6, 6);
			bombInAct = true;
		}
		// Bomb movement
		else if (bombInAct && bomb != null)
		{
			bomb.setYSpeed(BOMB_SPEED); // Bomb travel downward toward gun.
			if (bomb.y > 100) // Bomb delete when it goes off the screen.
			{
				bombInAct = false;
				bomb.delete();
				bomb = null;
			}
			else if (bomb.hit(barrier)) // Bomb is deleted when it hits the barrier.
			{
				ct.println("The bomb hits the barrier. You're safe!"); 
				bombInAct = false;
				bomb.delete();
				bomb = null;
				barrierHit = true;
			}
			else if (bomb.hit(gun)) // Game over when the bomb hits the gun.
			{
				ct.text("GAME OVER!", 50, 30, 15, TEXT_COLOR);
				if (ct.inputYesNo( "Would you like to play again?" )) // Asking users whether or not to restart the game
					ct.restart(); // If users click yes to play agian, restart the app.
				else
					ct.stop(); // If users click no, end the app.
			}
		}
	}
}

/**
 * Game Background:
 * 
 * In a lush green field under a clear blue sky, there lives a happy guinea pig family.
 * Their days are filled with joy and an abundance of hay to munch on. One day, three aliens open a 
 * black hole in the sky, threatening to take over the green land and the piggies' home.
 * 
 * Determined to defend their home, the guinea pig family sends their most poop-productive soldier into battle.
 * Using their natural talent, the brave soldier aims to shoot poop at the aliens. The more poop that hits 
 * the aliens, the more "wheekified" they become, becoming more guinea pig-like and more likely to make 
 * peaceful contact with the guinea pig family.
 * 
 * Your mission is to help the guinea pig soldier shoot as much poop at the aliens as possible. However, be 
 * wary of the hay bales dropped by the aliens. These hay bales are the guinea pigs' favorite food and can 
 * distract the soldier, causing them to lose focus on their mission.
 * 
 * Additionally, make sure to take shelter from the blue cloud. However, this cloud absorbs both the hay bales 
 * and the poop, preventing them from reaching their targets.
 */