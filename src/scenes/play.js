class Play extends Phaser.Scene {
    constructor() {
        super("play");
    }

    preload() {
        this.load.image('field', 'assets/field.png');
        this.load.image('gg', 'assets/gameover.png');
        this.load.image('runner', 'assets/runningback.png');
        this.load.image('defender', 'assets/defender.png');
    }

    create() {
        this.scrollingField = this.add.tileSprite(0, 0, game.config.width, game.config.height, 'field')
            .setOrigin(0, 0);
        this.PLAYER_VELOCITY = game.config.height / 2
        this.scrollSpeed = game.config.height;

        // create simple cursor input
        cursors = this.input.keyboard.createCursorKeys();
        // extra key for debug stuff
        keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
        keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        // physics sprite
        this.player = this.physics.add.sprite(game.config.width / 2, game.config.height/2, 'runner')
            .setOrigin(0.5, 1)
            .setScale(game.config.width / 800, game.config.height / 800); 
            // scale sprite such that it is always the same relative to screen size
        this.player.setCollideWorldBounds(true);
    
        this.centerDistance = 0;
        this.defenders = this.physics.add.group({
            runChildUpdate: true
        });

        //this.physics.add.collider(this.player, this.defenders);

        this.physics.add.overlap(this.player, this.defenders, this.setGameOver, null, this);
        //this.lastYardline = 0;

        //set game over initially to false
        this.gameOver = false;

        this.p1Score = 0;

        // display score
        let scoreConfig = {
            fontFamily: 'Stencil Std, fantasy',
            fontSize: '56px',
            backgroundColor: '#013220',
            color: '#FFFFFF',
            align: 'right',
            padding: {
                top: 5,
                bottom: 5,
            },
        }
        this.p1Score = 0; 
        this.scoreLeft = this.add.text(0, 0, 'SCORE: ' + this.p1Score, scoreConfig);
    }



    update(time, delta) {
        // starting speed is 10yards/s, or 1 screen length
        this.scrollingField.tilePositionY -= this.scrollSpeed * (delta / 1000); // normalize scroll speed to pixels per second
        this.centerDistance += (this.scrollSpeed * (delta / 1000)) / (this.scrollSpeed / 10); // total distance the screen has scrolled so far, in yards
        //console.log(this.centerDistance);
        
        this.player.setVelocity(0);

        if (cursors.left.isDown) {
            this.player.setVelocityX(-this.PLAYER_VELOCITY);
        } else if (cursors.right.isDown) {
            this.player.setVelocityX(this.PLAYER_VELOCITY);
        }
        if (cursors.up.isDown) {
            this.player.setVelocityY(-this.PLAYER_VELOCITY);
        } else if (cursors.down.isDown) {
            this.player.setVelocityY(this.PLAYER_VELOCITY);
        }

        if (Phaser.Input.Keyboard.JustDown(keyJ)) {
            this.spawnDefender(300);
        }
        
        if(!this.gameOver){
            this.p1Score = Math.floor(this.centerDistance);
            this.scoreLeft.text = 'SCORE: ' + this.p1Score + " YARDS";
        }
        let gameoverConfig = {
            fontFamily: 'Stencil Std, fantasy',
            fontSize: '100px',
            color: '#FFFFFF',
            align: 'right',
            padding: {
                top: 5,
                bottom: 5,
            },
        }
 
       if(this.gameOver){
            this.gameoverScreen = this.add.tileSprite(0, 0, game.config.width, game.config.height, 'gg').setOrigin(0, 0);
            this.add.text(game.config.width/2, game.config.height/6, 'GAME OVER', gameoverConfig).setOrigin(0.5);
            gameoverConfig.fontSize = '80px';
            this.add.text(game.config.width/2, game.config.height/2, 'SCORE: ' + this.p1Score + ' YARDS', gameoverConfig).setOrigin(0.5);
            gameoverConfig.fontSize = '45px';
            this.add.text(game.config.width/2, game.config.height - 100, 'Press (R) to Restart', gameoverConfig).setOrigin(0.5);
        }

        if(this.gameOver && Phaser.Input.Keyboard.JustDown(keyR)) {
            this.scene.restart();
        }
    }


    // put a defender on the screen with given horizontal speed coming from a random side of the screen
    spawnDefender(speed) {
        let startingX, direction;
        if (Math.random() >= 0.5) {
            startingX = -10;
            direction = 1;
        } else {
            startingX = game.config.width + 10;
            direction = -1;
        }
        let startingY = randomRange(-game.config.height / 2, game.config.height / 2);
        this.defenders.add (new Defender (this, startingX, startingY, 'defender', 0, speed * direction ), true); //second arg must be true to add object to display list i guess
    }
    setGameOver() {
        this.gameOver = true;

        console.log('game over');
    }

    
}

// get a random value in the range (works for negatives)
function randomRange(min, max) {
    let range = max - min;
    let val = Math.random() * range
    return val + min;
}