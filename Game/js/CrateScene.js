class CrateScene extends Phaser.Scene {
	constructor() {
		super({
			key: 'CrateScene',
			physics: {
				matter: {
					//debug: true, Interesting side effect of matter : make things roll
					gravity: { y: 0.5 }
				},
				arcade: {
					gravity: {
						y: 500
					},
					//debug: true
				},
			},				
		});	
		this.cursors;
		this.isPlayerAlive = true;
		this.scoreText;
		this.newCrateTime = 0;
		this.newDifficultyTime = 0;
		this.timing = 1125;
		this.totalTime = 0;
		this.survivalTime = 28;
		this.music;
	}

	init(){
		/*game.config.physics = {default: 'matter'}
		game.config.defaultPhysicsSystem = 'matter';*/
	}

    // function to be executed when the scene is loading
    preload(){

        // loading crate image
        this.load.image("crate", "assets/camel.jpg");
		this.load.spritesheet('dudeCrate', 'assets/dude.png', {
			frameWidth: 36,
			frameHeight: 48
		});
		this.load.image('backgroundCafe', 'assets/CafeBleu.jpg');
		this.load.audio('music07', ['assets/07.mp3']);   
		this.load.audio('fireRain', ['assets/fireRain.wav']); 					
    }

    // function to be executed once the scene has been created
    create(){
		this.music = this.sound.add('music07');
		this.music.play();		
		this.music.loop = true;
        this.sfx = this.sound.add('fireRain');		
		//  A simple background for our game
		this.bg = this.add.sprite(0, 0, 'backgroundCafe');
		this.bg.setOrigin(0, 0);
		
		//  The this.score
		this.scoreText = this.add.text(0, 0, 'NEXT UBER IN : '+this.survivalTime, { fontFamily: "Nintendo NES Font", fontSize: 32, color: "#ff0000" });
		this.scoreText.setStroke('#0000ff', 8);	
		
			// The player and its settings
		this.player = this.physics.add.sprite(100, 450, 'dudeCrate');
		this.player.setCollideWorldBounds(true);

		//  Our this.player animations, turning, walking left and walking right.
		this.anims.create({
			key: 'left',
			frames: this.anims.generateFrameNumbers('dudeCrate', {
				start: 0,
				end: 3
			}),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'turn',
			frames: [{
				key: 'dudeCrate',
				frame: 4
			}],
			frameRate: 20
		});

		this.anims.create({
			key: 'right',
			frames: this.anims.generateFrameNumbers('dudeCrate', {
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
        // setting Matter world bounds
        //this.matter.world.setBounds(0, -200, game.config.width, game.config.height + 200);

        // waiting for user input
        //this.input.on("pointerdown", function(pointer){

            // getting Matter bodies under the pointer
            //var bodiesUnderPointer = Phaser.Physics.Matter.Matter.Query.point(this.matter.world.localWorld.bodies, pointer);

            // if there isn't any body under the pointer...
            //if(bodiesUnderPointer.length == 0){

                // create a crate
                
            //}

            // this is where I wanted to remove the crate. Unfortunately I did not find a quick way to delete the Sprite
            // bound to a Matter body, so I am setting it to invisible, then remove the body.
            /*else{
                bodiesUnderPointer[0].gameObject.visible = false;
                this.matter.world.remove(bodiesUnderPointer[0])
            }*/
        //}, this);
    }
	
	getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
	}	
	
	addCrate(){
		this.physics.add.overlap(this.player,this.physics.add.sprite(this.player.x+this.getRandomInt(-200, 200), 200-this.getRandomInt(0, 200), "crate"), this.die, null, this);
	}

	die(){
		this.gameOver(false);
	}
	
    gameOver(bVictory) {
		if(this.isPlayerAlive)
		{
			// flag to set player is dead
			this.isPlayerAlive = false;

			// shake the camera
			this.cameras.main.shake(500);

			// fade camera
			/*this.time.delayedCall(250, function() {
				this.cameras.main.fade(250);
			}, [], this);*/
			victories[currentScene] = bVictory;
			score[currentScene] = Math.ceil((this.totalTime)/1000) * 50;
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
	
	update(time, delta) {
		if (!this.isPlayerAlive) {
			return;
		}

		if(this.bSkip)
		{
			if (this.skipKey.isDown) {
				this.bSkip = false;
                //this.isPlayerAlive = false;
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
		
		this.newCrateTime = this.newCrateTime + delta;
		this.totalTime = this.totalTime + delta;
		this.scoreText.setText('NEXT UBER IN : '+Math.ceil((28000 - this.totalTime)/1000));
		if(this.newCrateTime > this.timing )
		{
			this.addCrate();
			this.sfx.play();
			this.newCrateTime = 0;
		}
		this.newDifficultyTime = this.newDifficultyTime + delta;
		if(this.newDifficultyTime > 3000)
		{
			this.timing = this.timing - 125;
			this.newDifficultyTime = 0;
		}
		
		if(this.totalTime > 28000)
			this.gameOver(true);
	}
}
