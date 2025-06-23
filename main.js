var canvas = document.getElementById("gameField");
var ctx = canvas.getContext("2d");

// Spaceship ship
class Spaceship {
    constructor(x, y, width, height, flightSpeed) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.flightSpeed = flightSpeed;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.fill();
        ctx.closePath();
    }

    moveRight() {
        this.x += this.flightSpeed;
    }

    moveLeft() {
        this.x -= this.flightSpeed;
    }
}

const playerSpaceship = new Spaceship(
    (canvas.width - 20) / 2,
    canvas.height - 30,
    20,
    10,
    0.5,
);

// class shot
class Shot {
    
    constructor(x, y, speed = 1, width = 5, height = 10) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.width = width;
        this.height = height;
        this.status = 1;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'rgb(255, 0, 0)';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.y -= this.speed;
    }
}

// Spaceship shot
var SpaceshipShotWidth = 5;
var SpaceshipShotHeight = 10;
var SpaceshipLastShotTime = 0;
var SpaceshipShotCooldown = 500;
var SpaceshipShotsArray = [];

function regShot() {
    let now = Date.now();
    if (
        SpaceshipAttackPressed && 
        now - SpaceshipLastShotTime >= SpaceshipShotCooldown
    ) {
        SpaceshipLastShotTime = now;
        const SpaceshipNewShot = new Shot(
            playerSpaceship.x + playerSpaceship.width / 2 - SpaceshipShotWidth / 2,
            playerSpaceship.y - playerSpaceship.height,
        );
        SpaceshipShotsArray.push(SpaceshipNewShot);
    }
}

function calcShot() {
    for (let p = 0; p < SpaceshipShotsArray.length; p++) {
        const SpaceshipShot = SpaceshipShotsArray[p];
        
        if (SpaceshipShot.y < 0) {
            SpaceshipShot.status = 0;
        }
        for (let r = 0; r < enemys.length; r++) {
            for (let c = 0; c < enemys[r].length; c++) {
                let enemy = enemys[r][c];
                if (
                    enemy != null &&
                    enemy.status == 1 &&
                    SpaceshipShot.y < enemy.y + enemy.height &&
                    enemy.x < SpaceshipShot.x + SpaceshipShotWidth &&
                    SpaceshipShot.x < enemy.x + enemy.width
                ) {
                    SpaceshipShot.status = 0;
                    enemy.status = 0;
                }
            }
        }
        SpaceshipShot.draw(ctx);
        SpaceshipShot.update();
    }
    SpaceshipShotsArray = SpaceshipShotsArray.filter(shot => shot.status == 1);
}

// control
var SpaceshipRightPressed = false;
var SpaceshipLeftPressed = false;
var SpaceshipAttackPressed = false;
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e) {
    if (e.keyCode == 68 || e.keyCode == 39) {
        SpaceshipRightPressed = true;
    } else if (e.keyCode == 65 || e.keyCode == 37) {
        SpaceshipLeftPressed = true;
    }
    if (e.keyCode == 32 || e.keyCode == 38 || e.keyCode == 87) {
        SpaceshipAttackPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.keyCode == 68 || e.keyCode == 39) {
        SpaceshipRightPressed = false;
    } else if (e.keyCode == 65 || e.keyCode == 37) {
        SpaceshipLeftPressed = false;
    }
    if (e.keyCode == 32 || e.keyCode == 38 || e.keyCode == 87) {
        SpaceshipAttackPressed = false;
    }
}

// enemy
class Enemy {

    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.status = 1;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "rgb(0, 0, 255)";
        ctx.fill();
        ctx.closePath();
    }
}

patterns = [
    [
        '-*-',
        '***',
        '-*-',
    ],
];

var enemys = [];

class EnemyArmy {

    constructor(shape) {
        this.shape = shape;
    }

    createArmy(enemys) {
        for (let r = 0; r < this.shape.length; r++) {
            enemys[r] = [];
            for (let c = 0; c < this.shape[r].length; c++) {
                if (this.shape[r][c] != '-') {
                    const newEnemy = new Enemy (
                        0,
                        0,
                        15,
                        15,
                    );
                    enemys[r][c] = newEnemy;
                } else {
                    enemys[r][c] = null;
                }
            }
        }
    }

    draw(ctx, enemys) {
        const enemySquadWidth = (enemys[0].length * 15) + ((enemys[0].length - 1) * 5);
        const enemySquadX = (canvas.width - enemySquadWidth) / 2;
        const enemySquadY = 10;
        for (let r = 0; r < enemys.length; r++) {
            for (let c = 0; c < enemys[r].length; c++) {
                let enemy = enemys[r][c]
                if (enemy !== null && enemy.status === 1) {
                    enemy.x = enemySquadX + c * (enemy.width + 5);
                    enemy.y = enemySquadY + r * (enemy.height + 5);
                    enemy.draw(ctx);
                }
            }
        }
    }

    move() {

    }
}

const enemyGrid = new EnemyArmy(
    patterns[0]
);
enemyGrid.createArmy(enemys)

// drawing function
function drawText(font, color, text, x, y) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    playerSpaceship.draw(ctx);
    regShot();
    enemyGrid.draw(ctx, enemys);
    calcShot();
    drawText(
        "16px Arial",
        "rgb(0, 0, 0)",
        "Bullets: " + SpaceshipShotsArray.length,
        10,
        20,
    );
    
    if (SpaceshipRightPressed && playerSpaceship.x <= canvas.width - playerSpaceship.width) {
        playerSpaceship.moveRight();
    }
    if (SpaceshipLeftPressed && playerSpaceship.x >= 0) {
        playerSpaceship.moveLeft();
    }
    requestAnimationFrame(draw);
}

draw();