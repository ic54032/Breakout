const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = 850;
const CANVAS_HEIGHT = 700;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const TOTAL_BRICKS = BRICK_ROWS * BRICK_COLS;
const BRICK_WIDTH = 72;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 8;
const BRICK_OFFSET_TOP = 60;
const totalBrickWidth = BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_PADDING;
const BRICK_OFFSET_LEFT = (CANVAS_WIDTH - totalBrickWidth) / 2;
const BALL_SIZE = 8;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 12;
const PADDLE_Y_OFFSET = 30;
let ballX, ballY, ballDx, ballDy;
let paddleX;
let rightPressed = false;
let leftPressed = false;
let bricks = [];
let score = 0;
let highScore = 0;
let gameStarted = false;
let animationId;
let initialBallSpeed = 3;
let isGameOver = false;
let gameMessage = '';
const FRAME_DURATION = 1000 / 60;
let loopTimer = null;

let brickRowColors = [
    'rgb(153,51,0)',
    'rgb(255,0,0)',
    'rgb(255,153,204)',
    'rgb(0,255,0)',
    'rgb(255,255,153)'
];

function init() {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    loadHighScore();
    paddleX = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    resetBall(true);
    buildBricks();
    bindEvents();
    drawFrame();
}

function buildBricks() {
    bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
        bricks[r] = [];
        for (let c = 0; c < BRICK_COLS; c++) {
            bricks[r][c] = { x: 0, y: 0, status: 1, color: brickRowColors[r] };
        }
    }
}

function resetBall(init = false) {
    ballX = paddleX + PADDLE_WIDTH / 2 - BALL_SIZE / 2;
    ballY = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT - BALL_SIZE;
    let dir = Math.random() < 0.5 ? -1 : 1;
    ballDx = dir * initialBallSpeed;
    ballDy = -initialBallSpeed;
    gameStarted = init ? false : true;
    isGameOver = false;
}

function saveHighScore() {
    try {
        localStorage.setItem('breakout_highscore', String(highScore));
    } catch (e) { }
}

function loadHighScore() {
    try {
        let v = localStorage.getItem('breakout_highscore');
        if (v !== null) highScore = parseInt(v, 10) || 0;
    } catch (e) { highScore = 0; }
}

function collisionDetection() {
    if (ballX + ballDx < 0) {
        ballDx = -ballDx;
        ballX = 0;
    } else if (ballX + BALL_SIZE + ballDx > CANVAS_WIDTH) {
        ballDx = -ballDx;
        ballX = CANVAS_WIDTH - BALL_SIZE;
    }
    if (ballY + ballDy < 0) {
        ballDy = -ballDy;
        ballY = 0;
    }

    let paddleTop = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT;
    if (ballY + BALL_SIZE + ballDy >= paddleTop) {
        if (ballX + BALL_SIZE > paddleX && ballX < paddleX + PADDLE_WIDTH) {
            let hitPos = (ballX + BALL_SIZE / 2) - (paddleX + PADDLE_WIDTH / 2);
            let norm = hitPos / (PADDLE_WIDTH / 2);
            ballDx = norm * Math.abs(initialBallSpeed);
            ballDy = -Math.abs(ballDy);
            return;
        }
    }

    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            let b = bricks[r][c];
            if (b.status === 1) {
                let bx = BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING);
                let by = BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING);
                if (ballX + BALL_SIZE > bx && ballX < bx + BRICK_WIDTH && ballY + BALL_SIZE > by && ballY < by + BRICK_HEIGHT) {
                    let prevY = ballY - ballDy;
                    if (prevY + BALL_SIZE <= by || prevY >= by + BRICK_HEIGHT) {
                        ballDy = -ballDy;
                    } else {
                        ballDx = -ballDx;
                    }
                    b.status = 0;
                    score += 1;
                    if (score > highScore) {
                        highScore = score;
                        saveHighScore();
                    }
                    if (score === TOTAL_BRICKS) {
                        victory();
                    }
                }
            }
        }
    }
}

function update() {
    if (!gameStarted || isGameOver) return;
    let paddleSpeed = 7;
    if (rightPressed) paddleX += paddleSpeed;
    if (leftPressed) paddleX -= paddleSpeed;
    if (paddleX < 0) paddleX = 0;
    if (paddleX + PADDLE_WIDTH > CANVAS_WIDTH) paddleX = CANVAS_WIDTH - PADDLE_WIDTH;
    ballX += ballDx;
    ballY += ballDy;
    collisionDetection();
    if (ballY > CANVAS_HEIGHT) {
        gameOver();
    }
}

function drawBricks() {
    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
            let b = bricks[r][c];
            if (b.status === 1) {
                let bx = BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING);
                let by = BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING);
                let grad = ctx.createLinearGradient(bx, by, bx, by + BRICK_HEIGHT);
                grad.addColorStop(0, adjustColor(b.color, 30));
                grad.addColorStop(0.5, b.color);
                grad.addColorStop(1, adjustColor(b.color, -30));
                ctx.fillStyle = b.color;
                ctx.fillRect(bx, by, BRICK_WIDTH, BRICK_HEIGHT);
                ctx.strokeStyle = adjustColor(b.color, -45);
                ctx.lineWidth = 2;
                ctx.strokeRect(bx + 1, by + 1, BRICK_WIDTH - 2, BRICK_HEIGHT - 2);
            }
        }
    }
}

function drawPaddle() {
    let px = paddleX;
    let py = CANVAS_HEIGHT - PADDLE_Y_OFFSET - PADDLE_HEIGHT;
    let grad = ctx.createLinearGradient(px, py, px, py + PADDLE_HEIGHT);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#d9d9d9');
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.strokeStyle = '#bfbfbf';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, PADDLE_WIDTH - 2, PADDLE_HEIGHT - 2);
}

function drawBall() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ballX, ballY, BALL_SIZE, BALL_SIZE);
    ctx.strokeStyle = '#ffffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(ballX + 1, ballY + 1, BALL_SIZE - 2, BALL_SIZE - 2);
}

function drawScore() {
    ctx.font = '16px Verdana, Helvetica, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + score, 12, 8);
    let hsText = 'Max: ' + highScore;
    let textWidth = ctx.measureText(hsText).width;
    ctx.fillText(hsText, CANVAS_WIDTH - textWidth - 12, 8);
}

function drawStartScreen() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Helvetica, Verdana, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BREAKOUT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    ctx.font = 'italic bold 18px Helvetica, Verdana, Arial';
    ctx.fillText('Press SPACE to begin', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
}

function gameOver() {
    isGameOver = true;
    gameStarted = false;
    stopLoop();
    gameMessage = 'GAME OVER';
    drawFrame();
}

function victory() {
    isGameOver = true;
    gameStarted = false;
    stopLoop();
    gameMessage = 'YOU WIN!';
    drawFrame();
}

function drawFrame() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBricks();
    drawPaddle();
    drawBall();
    drawScore();

    if (!gameStarted && !isGameOver && score === 0) {
        drawStartScreen();
        return;
    }

    if (isGameOver && gameMessage) {
        ctx.font = 'bold 40px Helvetica, Verdana, Arial';
        ctx.fillStyle = 'yellow';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gameMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
}

function loop() {
    if (isGameOver || !gameStarted) {
        stopLoop();
        return;
    }
    update();
    drawFrame();
}

function startLoop() {
    if (loopTimer === null) {
        loopTimer = setInterval(loop, FRAME_DURATION);
    }
}

function stopLoop() {
    if (loopTimer !== null) {
        clearInterval(loopTimer);
        loopTimer = null;
    }
}

function keyDown(e) {
    let code = e.keyCode;
    if (code === 39) rightPressed = true;
    else if (code === 37) leftPressed = true;
    else if (code === 32) {
        if (!gameStarted && !isGameOver) {
            gameStarted = true;
            startLoop();
        } else if (isGameOver) {
            score = 0;
            buildBricks();
            loadHighScore();
            paddleX = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
            resetBall(true);
            drawFrame();
            isGameOver = false;
        }
        e.preventDefault();
    }
}

function keyUp(e) {
    let code = e.keyCode;
    if (code === 39) rightPressed = false;
    else if (code === 37) leftPressed = false;
}

function bindEvents() {
    document.addEventListener('keydown', keyDown, false);
    document.addEventListener('keyup', keyUp, false);
}

function adjustColor(rgbStr, delta) {
    const parts = rgbStr.match(/\d+/g);
    if (!parts || parts.length < 3) return rgbStr;
    const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
    const [r, g, b] = parts.map(Number);
    return `rgb(${clamp(r + delta)},${clamp(g + delta)},${clamp(b + delta)})`;
}

init();