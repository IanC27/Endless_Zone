let highScore = 0;
let tries = 0;
class Play extends Phaser.Scene {
    constructor() {
        super("play");
    }

    preload() {
        this.load.image('field', 'assets/field600.png');
        this.load.image('gg', 'assets/gameover.png');
        this.load.image('runner', 'assets/player_sprite.png');
        this.load.image('defender', 'assets/defender.png');
        this.load.image('fans', 'assets/fans.png');
        this.load.image('trash', 'assets/trash.png');

        this.load.audio('startup', 'assets/up.mp3');
        this.load.audio('oof', 'assets/oof.mp3');
        this.load.audio('down', 'assets/down.mp3')
    }

    create() {
        this.scrollingField = this.add.tileSprite(0, 0, 0, 0, 'field')
            .setOrigin(0, 0);
            
        this.PLAYER_VELOCITY = game.config.height / 2
        this.scrollSpeed = game.config.height / 2;

        // create simple cursor input
        cursors = this.input.keyboard.createCursorKeys();
        //WASD KEYS
        keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        // extra key for debug stuff TODO: REMOVE/DISABLE BEFORE FINAL SUBMISSION
        keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
        keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        // physics sprite
        this.player = this.physics.add.sprite(game.config.width / 2, game.config.height / 2, 'runner')
            .setOrigin(0.5, 1)
            .setScale(game.config.width / 800, game.config.height / 800);
        // scale sprite such that it is always the same relative to screen size
        this.player.displayWidth = game.config.width / 10;
        this.player.displayHeight = game.config.height / 5;

        this.player.setCollideWorldBounds(true);

        this.centerDistance = 0;
        this.obstacles = this.physics.add.group({
            runChildUpdate: true
        });

        //this.physics.add.collider(this.player, this.defenders);

        this.physics.add.overlap(this.player, this.obstacles, this.setGameOver, null, this);

        //set game over initially to false
        this.gameOver = false;

        this.p1Score = 0;

        // display score
        let scoreConfig = {
            fontFamily: 'Stencil Std, fantasy',
            fontSize: '56px',
            //backgroundColor: '#013220',
            strokeThickness: 4,
            stroke: '013220',
            color: '#FFFFFF',
            align: 'right',
            padding: {
                top: 5,
                bottom: 5,
            },
        }
        this.p1Score = 0;
        this.scoreLeft = this.add.text(0, 0, 'SCORE: ' + this.p1Score, scoreConfig);


        // scale difficulty through multiple waves based on distance traveled
        // wavse dont do anything yet
        this.wave = 0;
        this.obstacleSpeed = 300;    // defenders start at 300
        this.obstacleSpeedMultiplier = 1;
        this.nextWaveThreshold = 50; // starting at 100 yards
        this.obstacleSpawnDelay = 4000; // initial time between obstacles appearing in ms
        this.obstacleSpawnTimer = this.obstacleSpawnDelay;
        this.sound.play('startup');
    }



    update(time, delta) {

        if (!this.gameOver) {
            this.player.setVelocity(0);

            // starting speed is 10yards/s, or 1 screen length
            this.scrollingField.tilePositionY -= this.scrollSpeed * (delta / 1000); // normalize scroll speed to pixels per second
            this.centerDistance += (this.scrollSpeed * (delta / 1000) / (game.config.height / 10)); // total distance the screen has scrolled so far, in yards
            //console.log(this.centerDistance);

            // increasing challenge
            if (this.centerDistance > this.nextWaveThreshold) {
                this.wave++
                this.nextWaveThreshold += 50;
                //console.log(this.nextWaveThreshold);
                
                // increase speed up to 600 (10y/s), at first, then start increasing obstacle spawning rate
                if(this.scrollSpeed < 600){
                    this.obstacleSpeedMultiplier += 0.05
                    this.scrollSpeed += 50
                } else {
                    this.obstacleSpawnDelay *= 0.975;
                }
                
                console.log(this.scrollSpeed);
                //console.log(this.obstacleSpeedMultiplier);
                // obstacles appear a little more frequently and move a little faster

            }

            //obstacle spawning
            this.obstacleSpawnTimer -= delta;
            if (this.obstacleSpawnTimer <= 0) {
                this.obstacleSpawnTimer = this.obstacleSpawnDelay;
                switch(randomInt(3)){
                    case 0:
                        this.spawnDefender(this.obstacleSpeedMultiplier);
                        break;
                    case 1:
                        this.spawnFans(this.obstacleSpeedMultiplier);
                        break;
                    case 2:
                        this.spawnTrash();
                        break;
                    default:
                        break;
                }
                
            }

            //score display
            this.p1Score = Math.floor(this.centerDistance);
            this.scoreLeft.text = 'SCORE: ' + this.p1Score + " YARDS";

            // polling controls
            if (cursors.left.isDown || keyA.isDown) {
                this.player.setVelocityX(-this.PLAYER_VELOCITY);
            } else if (cursors.right.isDown || keyD.isDown) {
                this.player.setVelocityX(this.PLAYER_VELOCITY);
            }
            if (cursors.up.isDown || keyW.isDown) {
                this.player.setVelocityY(-this.PLAYER_VELOCITY);
            } else if (cursors.down.isDown || keyS.isDown) {
                this.player.setVelocityY(this.PLAYER_VELOCITY);
            }

            if (Phaser.Input.Keyboard.JustDown(keyJ)) {
                this.spawnTrash();
            }


        }

        if (this.gameOver) {
            
        }

        if (this.gameOver && Phaser.Input.Keyboard.JustDown(keyR)) {
            this.scene.restart();
        }
    }


    // put a defender on the screen with given horizontal speed coming from a random side of the screen
    spawnDefender(multiplier) {
        let [startingX, direction] = randomSide();
        // math to find the right starting y to actually target the player -- does not work right now
        //let v = Math.sqrt(Math.pow(this.scrollSpeed * multiplier, 2) + Math.pow(this.obstacleSpeed * multiplier, 2))
        // let b = Math.sqrt(Math.pow(this.player.x, 2) - Math.pow(v, 2))
        //let startingY = this.player.y - b
        let startingY = randomRange(- (game.config.height / 5), game.config.height / 5);
        //second arg must be true to add object to display list i guess
        this.obstacles.add(new Defender(this, startingX, startingY, 'defender', 0, this.obstacleSpeed * direction, multiplier), true); 
    }

    spawnFans(multiplier) {
        let [startingX, direction] = randomSide();
        let startingY = randomRange(- (game.config.height / 5), game.config.height / 5);
        this.obstacles.add(new Fans(this, startingX, 0, 'fans', 0, this.obstacleSpeed * direction, multiplier), true);
    }

    spawnTrash() {
        // trash will spawn at the top near the player's x position
        let startingX = randomRange(this.player.x - (game.config.width / 5), this.player.x + (game.config.width / 5));
        // limit x position to within game bounds
        startingX = Math.min(Math.max(startingX, game.config.width * (1 / 15)), game.config.width - game.config.width * (1 / 15));
        this.obstacles.add(new Trash(this, startingX, 0, 'trash', 0), true);
    }

    setGameOver() {
        this.sound.play('oof');
        this.player.stop();
        this.gameOver = true;

        this.player.disableBody();
        this.physics.world.disable(this.obstacles);
        console.log('game over');
        // show game over stuff after a couple seconds
        this.time.delayedCall(2000, () => {
            //game over display
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

            this.gameoverScreen = this.add.tileSprite(0, 0, game.config.width, game.config.height, 'gg').setOrigin(0, 0);
            this.add.text(game.config.width / 2, game.config.height / 6, 'GAME OVER', gameoverConfig).setOrigin(0.5);
            gameoverConfig.fontSize = '50px';
            tries += 1;
            this.add.text(game.config.width / 2, game.config.height / 2 - 100 , 'Total tries: ' + tries, gameoverConfig).setOrigin(0.5);
            gameoverConfig.fontSize = '70px';
            this.add.text(game.config.width / 2, game.config.height / 2, 'SCORE: ' + this.p1Score + ' YARDS', gameoverConfig).setOrigin(0.5);
            if (this.p1Score > highScore) {
                highScore = this.p1Score;
            }
            gameoverConfig.fontSize = '50px';
            this.add.text(game.config.width / 2, game.config.height / 2 + 100 , 'HIGH SCORE: ' + highScore + ' YARDS', gameoverConfig).setOrigin(0.5);
            gameoverConfig.fontSize = '45px';
            this.add.text(game.config.width / 2, game.config.height - 75, 'Press (R) to Restart', gameoverConfig).setOrigin(0.5);
            this.sound.play('down');
        });
    }


}

// return the data needed to place and orient an obstacle on one side of the screen or the other
function randomSide(){
    if (Math.random() >= 0.5) {
        return [-10, 1];
    } else {
        return [game.config.width + 10, -1];
    }
}

// get a random value in the range (works for negatives)
function randomRange(min, max) {
    let range = max - min;
    let val = Math.random() * range
    return val + min;
}

function randomInt(max){
    return Math.floor(Math.random() * max)
}