class StarScene extends Phaser.Scene {
	constructor() {
		super({
			key: 'StarScene',
			physics: {
				arcade: {
					gravity: {
						y: 300
					},
					//debug: true
				},
			}			
		});

		this.stars;
		this.bg;
		this.bombs;
		this.platforms;
		this.cursors;
		this.score = 0;
		this.isPlayerAlive = true;
		this.scoreText;
		this.livesText;
		this.lives = 3;
		this.level = 1;
		this.music;		
	}

	preload() {
		this.load.image('sky', 'assets/sky.png');
		this.load.image('ground', 'assets/ground.png');
		this.load.image('platform', 'assets/platform.png');
		this.load.image('star', 'assets/Rice.png');
		this.load.image('bomb', 'assets/bomb.png');
		this.load.spritesheet('playerStar', 'assets/dude.png', {
			frameWidth: 36,
			frameHeight: 48
		});
		this.load.image('backgroundStar', 'assets/Soup.png');	
		this.load.audio('music08', ['assets/08.mp3']); 
		this.load.audio('yoshiSwallow', ['assets/yoshiSwallow.wav']);			
	}

	create() {
		//  A simple background for our game
		this.bg = this.add.sprite(0, 0, 'backgroundStar');
		this.bg.setOrigin(0, 0);
		this.music = this.sound.add('music08');
		this.music.play();	
		this.music.loop = true;
		this.sfx = this.sound.add('yoshiSwallow');
		//  The this.platforms group contains the ground and the 2 ledges we can jump on
		this.platforms = this.physics.add.staticGroup();

		//  Here we create the ground.
		//  Scale it to fit the width of the game (the original sprite is 400x32 in size)
		this.platforms.create(640, 688, 'ground').setScale(2).refreshBody();

		//  Now let's create some ledges
		
		for(let i=0; i<4; i++)
		{
			this.platforms.create(640+(Math.cos(Math.PI*i)*100*this.level), 608-(i*96), 'platform');
		}
		/*this.platforms.create(600, 400, 'ground');
		this.platforms.create(50, 250, 'ground');
		this.platforms.create(750, 220, 'ground');*/

		// The player and its settings
		this.player = this.physics.add.sprite(100, 450, 'playerStar');

		//  this.player physics properties. Give the little guy a slight bounce.
		this.player.setBounce(0.2);
		this.player.setCollideWorldBounds(true);

		//  Our this.player animations, turning, walking left and walking right.
		this.anims.create({
			key: 'left',
			frames: this.anims.generateFrameNumbers('playerStar', {
				start: 0,
				end: 3
			}),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'turn',
			frames: [{
				key: 'playerStar',
				frame: 4
			}],
			frameRate: 20
		});

		this.anims.create({
			key: 'right',
			frames: this.anims.generateFrameNumbers('playerStar', {
				start: 5,
				end: 8
			}),
			frameRate: 10,
			repeat: -1
		});

		//  Input Events
		this.cursors = this.input.keyboard.createCursorKeys();
        this.skipKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.bSkip = true;
		//  Some this.stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
		this.stars = this.physics.add.group({
			key: 'star',
			repeat: 11,
			setXY: {
				x: 80,
				y: 0,
				stepX: 100
			}
		});

		this.stars.children.iterate(function(child) {

			//  Give each star a slightly different bounce
			child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

		});

		this.bombs = this.physics.add.group();

		let x = (this.player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
		let bomb = this.bombs.create(x, 16, 'bomb');
		bomb.setBounce(1);
		bomb.setCollideWorldBounds(true);
		bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
		bomb.allowGravity = false;		

		this.scoreText = this.add.text(0, 0, 'FULL : '+this.score+'%', { fontFamily: "Nintendo NES Font", fontSize: 32, color: "#ff0000" });
		this.scoreText.setStroke('#0000ff', 8);

		this.livesText = this.add.text(0, 48, 'VEGAN SUPERPOWERS : '+this.lives, { fontFamily: "Nintendo NES Font", fontSize: 32, color: "#ff0000" });
		this.livesText.setStroke('#0000ff', 8);

		//  Collide the this.player and the this.stars with the this.platforms
		this.physics.add.collider(this.player, this.platforms);
		this.physics.add.collider(this.stars, this.platforms);
		this.physics.add.collider(this.bombs, this.platforms);

		//  Checks to see if the this.player overlaps with any of the this.stars, if he does call the collectStar function
		this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

		this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
		
		// player is alive
		this.isPlayerAlive = true;
		
	}

	update(time, delta) {
		if (!this.isPlayerAlive) {
			return;
		}

		if(this.bSkip)
		{
			if (this.skipKey.isDown) {
				this.bSkip = false;
                this.isPlayerAlive = false;
                this.gameOver(true);
			}
		}		

		if (this.cursors.left.isDown) {
			this.player.setVelocityX(-160);

			this.player.anims.play('left', true);
		} else if (this.cursors.right.isDown) {
			this.player.setVelocityX(160);

			this.player.anims.play('right', true);
		} else {
			this.player.setVelocityX(0);

			this.player.anims.play('turn');
		}

		if (this.cursors.up.isDown && this.player.body.touching.down) {
			this.player.setVelocityY(-330);
		}
	}

	collectStar(player, star) {
		star.disableBody(true, true);
		this.sfx.play();
		//  Add and update the this.score
		this.score += 1;
		this.scoreText.setText('FULL : ' + (Math.ceil((this.score/30)*100)+'%'));
		if(this.score == 30)
			this.gameOver(true);
		if (this.stars.countActive(true) === 0) {

			this.level += 1;
			let platforms = this.platforms.getChildren();
			let numPlatforms = platforms.length;		
	
			for (let i = 1; i < numPlatforms; i++) {
				platforms[numPlatforms-i].destroy();
			}

			for(let i=0; i<4; i++)
			{
				this.platforms.create(640+(Math.cos(Math.PI*i)*100*this.level), 608-(i*96), 'platform');
			}
			this.physics.add.collider(this.player, this.platforms);
			this.physics.add.collider(this.stars, this.platforms);
			this.physics.add.collider(this.bombs, this.platforms);			

			//this.gameOver();
			//  A new batch of this.stars to collect
			this.stars.children.iterate(function(child) {

				child.enableBody(true, child.x, 0, true, true);

			});

			let x = (this.player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

			let bomb = this.bombs.create(x, 16, 'bomb');
			bomb.setBounce(1);
			bomb.setCollideWorldBounds(true);
			bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
			bomb.allowGravity = false;

		}
	}

	hitBomb(player, bomb) {
		if(this.isPlayerAlive)
		{
			this.lives = this.lives - 1;
			this.livesText.setText('VEGAN SUPERPOWERS : ' + this.lives);
			this.player.setTint(0xff0000);
			this.isPlayerAlive = false;
			this.player.anims.play('turn');
			if(this.lives==0)
				this.gameOver(false);
			else
			{
				this.cameras.main.shake(500);
				this.time.delayedCall(600, function() {
					this.cameras.main.resetFX();
					this.player.setTint(0xffffff);
					this.isPlayerAlive = true;			
				}, [], this);
			}
		}
	}
	
    gameOver(bVictory) {
		// flag to set player is dead
		//this.isPlayerAlive = false;

		// shake the camera
		this.cameras.main.shake(500);

		// fade camera
		/*this.time.delayedCall(250, function() {
			this.cameras.main.fade(250);
        }, [], this);*/
		victories[currentScene] = bVictory;
		score[currentScene] = this.lives * 10 + this.score*15;
        currentScene += 1;
        let insScene = this.scene.get('InstructionsScene');
        this.scene.setVisible(true, insScene);  
		bInstructions = true;
		this.music.stop();
        insScene.nextScene();

		this.time.delayedCall(transitionTime, function() {
			this.music.stop();
            this.scene.setVisible(false, insScene);
            this.scene.switch(order[currentScene]);
		}, [], this);

		// reset camera effects
		/*this.time.delayedCall(600, function() {
			this.cameras.main.resetFX();
		}, [], this);*/
	}   	

}