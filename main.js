const canvas = document.getElementById("gameField");
const ctx = canvas.getContext("2d");

const playerSpaceshipColor = '#dfd8c0';
const playerSpaceshipLaserColor = '#783d35';
const enemyColor = '#4a975c';
const textColor = '#dfd8c0';

const playerSpaceshipSprite = './sprites/spaceship1.png';
const enemySprite = './sprites/enemy1.png';

function resizeCanvas(canvas) {
    const aspectRatio = 480 / 700;
    let width = window.innerWidth;
    let height = window.innerHeight;

    if (width / height > aspectRatio) {
        width = height * aspectRatio;
    } else {
        height = width / aspectRatio;
    }

    canvas.width = width;
    canvas.height = height;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
}
resizeCanvas(canvas);
window.addEventListener("resize", () => resizeCanvas(canvas))

// game object class
class GameObject {
    constructor(x, y, width, height, speed = 0, color = 'black', image = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.status = true;
        this.color = color;
        this.image = image instanceof Image ? image : null;
    }

    draw(ctx) {
        ctx.save();
        if (this.image && this.image.complete) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height)
            ctx.globalCompositeOperation = "source-atop";
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.globalCompositeOperation = "source-over";
        } else {
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.closePath();
        }
        ctx.restore()
    }

    move(dx, dy, dt) {
        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;
    }

    isColidingWith(other) {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    isOutOfBounds(canvas) {
        return (
            this.x + this.width < 0 ||
            this.x > canvas.width ||
            this.y + this.height < 0 ||
            this.y > canvas.height
        )
    }
}

class Spaceship extends GameObject {
    constructor(x, y) {
        const image = new Image();
        image.src = playerSpaceshipSprite;
        super(x, y, 32, 20, 250, playerSpaceshipColor, image);
    }

    update(input, dt, canvasWidth) {
        let dx = 0
        if (input.right && this.x <= canvasWidth - this.width) {
            dx = 1
        }
        if (input.left && this.x >= 0) {
            dx = -1
        }
        this.move(dx, 0, dt);
    }
}

class Shot extends GameObject {
    constructor(x, y) {
        super(x, y, 4, 12, 200, playerSpaceshipLaserColor);
    }

    update(dt) {
        this.move(0, -1, dt);
    }
}

class Enemy extends GameObject {
    constructor(x, y, speed = 100) {
        const image = new Image();
        image.src = enemySprite;
        super(x, y, 30, 23, speed, enemyColor, image);
    }
}

function createEnemiesTemplate() {
    let columnsMatrixMax = 6;
    let columnsMatrixMin = 2;
    let rowsMatrixMax = 4;
    let rowsMatrixMin = 3;
    let columnsMatrix = Math.floor(Math.random() * (columnsMatrixMax - columnsMatrixMin) + columnsMatrixMin);
    let rowsMatrix = Math.floor(Math.random() * (rowsMatrixMax - rowsMatrixMin) + rowsMatrixMin);

    let enemyMatrix = [];

    for (let r=0;r<rowsMatrix;r++) {
        const row = [];
        for (let c=0;c<columnsMatrix;c++) {
            const chance = Math.random();
            row.push(chance > 0.6)
        }
        enemyMatrix.push(row.concat([...row].reverse()))
    }
    return enemyMatrix;
}

class EnemyWave {
    constructor(shape, canvas, speed) {
        this.shape = shape;
        this.canvas = canvas;
        this.enemies = [];

        this.enemySpacing = 10;
        this.enemyWidth = 28;
        this.enemyHeight = 28;
        this.originX = (canvas.width - (shape[0].length * (this.enemyWidth + this.enemySpacing))) / 2;
        this.originY = 10;

        this.directionX = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.speed = speed;
        this.speedDown = 20;
        this.moveDelay = 500;
        this.lastMoveTime = 0;

        this.createWave();
    }

    createWave() {
        for (let r = 0; r < this.shape.length; r++) {
            this.enemies[r] = [];
            for (let c = 0; c < this.shape[r].length; c++) {
                if (this.shape[r][c]) {
                    const x = this.originX + c * (this.enemyWidth + this.enemySpacing);
                    const y = this.originY + r * (this.enemyHeight + this.enemySpacing);
                    this.enemies[r][c] = new Enemy(x, y, this.speed);
                } else {
                    this.enemies[r][c] = null;
                }
            }
        }
    }

    move() {
        const now = performance.now()
        if (now - this.lastMoveTime < this.moveDelay) return
        
        this.lastMoveTime = now;
        this.offsetX += this.speed * this.directionX;

        let minX = this.canvas.width;
        let maxX = -1;

        for (let r = 0; r < this.shape.length; r++) {
            for (let c = 0; c < this.shape[r].length; c++) {
                const enemy = this.enemies[r][c]
                if (enemy && enemy.status) {
                    const x = this.originX + this.offsetX + c * (this.enemyWidth + this.enemySpacing);
                    if (x < minX) minX = x;
                    if (x + this.enemyWidth > maxX) maxX = x + this.enemyWidth;
                }
            }
        }
        if (minX <= 0 || maxX >= this.canvas.width) {
            this.directionX *= -1;
            this.offsetY += this.speedDown;
        }
    }

    getAliveEnemies() {
        return this.enemies.flat().filter(enemy => enemy && enemy.status);
    }

    draw(ctx) {
        for (let r = 0; r < this.shape.length; r++) {
            for (let c = 0; c < this.shape[r].length; c++) {
                const enemy = this.enemies[r][c];
                if (enemy && enemy.status) {
                    enemy.x = this.originX + this.offsetX + c * (this.enemyWidth + this.enemySpacing);
                    enemy.y = this.originY + this.offsetY + r * (this.enemyHeight + this.enemySpacing);
                    enemy.draw(ctx);
                }
            }
        }
    }
}

// drawing function
function drawText(font, color, text, x, y, align='left') {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.tectAlign = align;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fillText(text, x, y);
    ctx.restore();
}

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.isGameOver = false;

        this.lastFrameTime = performance.now();
        this.deltaTime = 0;

        this.playerSpaceship = new Spaceship(
            (canvas.width - 20) / 2,
            canvas.height - 30,
        );
        this.enemyWave = new EnemyWave(createEnemiesTemplate(), this.canvas, 20);

        this.lastShotTime = 0;
        this.shotCooldown = 500;
        this.shots = [];

        this.rightPressed = false;
        this.leftPressed = false;

        document.addEventListener("keydown", this.keyDownHandler.bind(this));
        document.addEventListener("keyup", this.keyUpHandler.bind(this));
        this.canvas.addEventListener("touchstart", (e) => this.handleTouch(e));
        this.canvas.addEventListener("touchmove", (e) => this.handleTouch(e));
        this.canvas.addEventListener("touchend", () => this.stopMoving());
        this.canvas.addEventListener("touchcancel", () => this.stopMoving());

        this.enemiesKillCount = 0;
        this.waveCount = 0;
    }

    keyDownHandler(e) {
        if (e.key == "d" || e.key == "ArrowRight") {
            this.rightPressed = true;
        } else if (e.key == "a" || e.key == "ArrowLeft") {
            this.leftPressed = true;
        }
    }

    keyUpHandler(e) {
        if (e.key == "d" || e.key == "ArrowRight") {
            this.rightPressed = false;
        } else if (e.key == "a" || e.key == "ArrowLeft") {
            this.leftPressed = false;
        }
    }

    handleTouch(e) {
        e.preventDefault()
        const touch = e.touches[0];
        if (!touch) return

        const middle = this.canvas.width / 2;

        if (touch.clientX < middle) {
            this.leftPressed = true;
            this.rightPressed = false;
        } else {
            this.rightPressed = true;
            this.leftPressed = false;
        }
    }

    stopMoving() {
        this.rightPressed = false;
        this.leftPressed = false;
    }

    update(dt) {
        // check game over
        for (const enemy of this.enemyWave.getAliveEnemies()) {
            if (this.playerSpaceship.isColidingWith(enemy) || enemy.y + enemy.height >= this.canvas.height) {
                this.gameOver()
            }
        }

        // player shot
        const now = performance.now();
        if (now - this.lastShotTime  >= this.shotCooldown) {
            this.lastShotTime = now;
            const shot = new Shot(
                this.playerSpaceship.x + this.playerSpaceship.width / 2 - 2,
                this.playerSpaceship.y - 10,
            );
            this.shots.push(shot);
        }

        // enemy hit check
        for (const shot of this.shots) {
            shot.update(dt);
            for (const enemy of this.enemyWave.getAliveEnemies()) {
                if (shot.isColidingWith(enemy)) {
                    shot.status = false;
                    enemy.status = false;
                    this.enemiesKillCount += 1;
                }
            }
        }

        this.shots = this.shots.filter(shot => shot.status && !shot.isOutOfBounds(this.canvas));

        // player move
        this.playerSpaceship.update(
            { left: this.leftPressed, right: this.rightPressed },
            dt,
            this.canvas.width,
        )

        // enemy move
        this.enemyWave.move();

        //count waves
        if (this.enemyWave.getAliveEnemies().length == 0) {
            this.waveCount += 1;
            this.enemyWave = new EnemyWave(createEnemiesTemplate(), this.canvas, 30);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.playerSpaceship.draw(this.ctx);
        for (const shot of this.shots) {
            shot.draw(this.ctx);
        }
        this.enemyWave.draw(this.ctx);

        drawText("14px 'Press Start 2P'", textColor, `wave:${this.waveCount}`, 10, 30)
        drawText("14px 'Press Start 2P'", textColor, `points:${this.enemiesKillCount}`, 10, 60)
    }

    gameLoop() {
        const now = performance.now();
        this.deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        if (this.isGameOver) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            drawText("20px 'Press Start 2P'", textColor, `game over`, this.canvas.width / 2, this.canvas.height / 2, "center")
            drawText("10px 'Press Start 2P'", textColor, `Press any key or tap to restart`, this.canvas.width / 2, this.canvas.height / 2 + 40, "center")
            return
        }
        
        this.update(this.deltaTime);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    gameOver() {
        this.isGameOver = true;

        const restartHandler = () => {
            this.restart();
            document.removeEventListener("keydown", restartHandler);
            this.canvas.removeEventListener("click", restartHandler);
            this.canvas.removeEventListener("touchstart", restartHandler);
        };

        document.addEventListener("keydown", restartHandler);
        this.canvas.addEventListener("click", restartHandler);
        this.canvas.addEventListener("touchstart", restartHandler);
    }

    start() {
        this.lastFrameTime = performance.now()
        this.gameLoop();
    }

    restart() {
        this.isGameOver = false;
        this.enemiesKillCount = 0;
        this.waveCount = 0;
        this.lastShotTime = 0;
        this.shots = [];
        this.playerSpaceship = new Spaceship(
            (canvas.width - 20) / 2,
            canvas.height - 30,
        );
        this.enemyWave = new EnemyWave(createEnemiesTemplate(), this.canvas, 20);
        this.start()
    }
}

const game = new GameEngine(canvas);
game.start();