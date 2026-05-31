// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let level = 1;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let gameSpeed = 100;
let lastMoveTime = 0;

// DOM elements
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const highScoreDisplay = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreDisplay = document.getElementById('finalScore');
const newHighScoreMsg = document.getElementById('newHighScore');
const restartBtn = document.getElementById('restartBtn');

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);
restartBtn.addEventListener('click', () => {
    gameOverModal.classList.add('hidden');
    resetGame();
    startGame();
});

document.addEventListener('keydown', handleKeyInput);
canvas.addEventListener('mousemove', handleMouseInput);

// Initialize high score display
highScoreDisplay.textContent = highScore;

// Main game loop
function gameLoop() {
    if (gameRunning && !gamePaused) {
        const now = Date.now();
        if (now - lastMoveTime > gameSpeed) {
            update();
            lastMoveTime = now;
        }
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Apply next direction
    direction = { x: nextDirection.x, y: nextDirection.y };
    
    // Calculate new head position
    const head = snake[0];
    const newHead = {
        x: (head.x + direction.x + tileCount) % tileCount,
        y: (head.y + direction.y + tileCount) % tileCount
    };

    // Check wall collision (if walls are enabled)
    if (newHead.x < 0 || newHead.x >= tileCount || newHead.y < 0 || newHead.y >= tileCount) {
        endGame();
        return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        endGame();
        return;
    }

    // Add new head
    snake.unshift(newHead);

    // Check food collision
    if (newHead.x === food.x && newHead.y === food.y) {
        score += 10 * level;
        updateLevel();
        generateFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }

    scoreDisplay.textContent = score;
}

// Draw game state
function draw() {
    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (optional - light grid lines)
    drawGrid();

    // Draw walls (border)
    drawWalls();

    // Draw snake
    drawSnake();

    // Draw food
    drawFood();

    // Draw pause overlay
    if (gamePaused) {
        drawPauseOverlay();
    }
}

// Draw grid
function drawGrid() {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= tileCount; i++) {
        const pos = i * gridSize;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
    }
}

// Draw walls
function drawWalls() {
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw warning zone
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gridSize / 2, gridSize / 2, canvas.width - gridSize, canvas.height - gridSize);
}

// Draw snake
function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;

        if (index === 0) {
            // Head - bright green with gradient
            const gradient = ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
            gradient.addColorStop(0, '#00ff00');
            gradient.addColorStop(1, '#00cc00');
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);

            // Draw eyes
            drawSnakeEyes(x, y);
        } else {
            // Body - gradient green
            const gradient = ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
            gradient.addColorStop(0, '#00dd00');
            gradient.addColorStop(1, '#00aa00');
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
        }

        // Border
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
    });
}

// Draw snake eyes
function drawSnakeEyes(x, y) {
    ctx.fillStyle = '#000000';
    const eyeSize = 3;
    const offset = 6;

    if (direction.x === 1) {
        // Eyes facing right
        ctx.fillRect(x + offset + 3, y + 5, eyeSize, eyeSize);
        ctx.fillRect(x + offset + 3, y + 12, eyeSize, eyeSize);
    } else if (direction.x === -1) {
        // Eyes facing left
        ctx.fillRect(x + offset - 6, y + 5, eyeSize, eyeSize);
        ctx.fillRect(x + offset - 6, y + 12, eyeSize, eyeSize);
    } else if (direction.y === -1) {
        // Eyes facing up
        ctx.fillRect(x + 5, y + offset - 6, eyeSize, eyeSize);
        ctx.fillRect(x + 12, y + offset - 6, eyeSize, eyeSize);
    } else if (direction.y === 1) {
        // Eyes facing down
        ctx.fillRect(x + 5, y + offset + 3, eyeSize, eyeSize);
        ctx.fillRect(x + 12, y + offset + 3, eyeSize, eyeSize);
    }
}

// Draw food
function drawFood() {
    const x = food.x * gridSize;
    const y = food.y * gridSize;

    // Draw apple/food with gradient
    const gradient = ctx.createRadialGradient(x + gridSize / 2, y + gridSize / 2, 2, x + gridSize / 2, y + gridSize / 2, gridSize / 2);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#ff0000');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + gridSize / 2, y + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(x + gridSize / 3, y + gridSize / 3, gridSize / 4, 0, Math.PI * 2);
    ctx.fill();
}

// Draw pause overlay
function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '20px Arial';
    ctx.fillText('Press SPACE to resume', canvas.width / 2, canvas.height / 2 + 20);
}

// Generate random food position
function generateFood() {
    let newFood;
    let collision = false;

    do {
        collision = false;
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };

        // Ensure food doesn't spawn on snake
        if (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
            collision = true;
        }
    } while (collision);

    food = newFood;
}

// Handle keyboard input
function handleKeyInput(e) {
    if (!gameRunning && e.code !== 'Space') return;

    switch (e.code) {
        case 'ArrowUp':
            e.preventDefault();
            if (direction.y === 0) {
                nextDirection = { x: 0, y: -1 };
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (direction.y === 0) {
                nextDirection = { x: 0, y: 1 };
            }
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (direction.x === 0) {
                nextDirection = { x: -1, y: 0 };
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (direction.x === 0) {
                nextDirection = { x: 1, y: 0 };
            }
            break;
        case 'Space':
            e.preventDefault();
            if (gameRunning) {
                togglePause();
            }
            break;
    }
}

// Handle mouse input
function handleMouseInput(e) {
    if (!gameRunning || gameOver) return;

    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const centerY = canvas.height / 2;

    if (mouseY < centerY - 20 && direction.y === 0) {
        nextDirection = { x: 0, y: -1 };
    } else if (mouseY > centerY + 20 && direction.y === 0) {
        nextDirection = { x: 0, y: 1 };
    }
}

// Start game
function startGame() {
    if (gameRunning) return;

    gameRunning = true;
    gameOver = false;
    gamePaused = false;
    gameOverModal.classList.add('hidden');
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    gameLoop();
}

// Toggle pause
function togglePause() {
    if (!gameRunning) return;

    gamePaused = !gamePaused;
    pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
}

// Reset game
function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    level = 1;
    gameRunning = false;
    gamePaused = false;
    gameOver = false;
    gameSpeed = 100;
    lastMoveTime = 0;

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
    pauseBtn.textContent = 'Pause';
    startBtn.disabled = false;
    pauseBtn.disabled = true;

    generateFood();
    draw();
}

// End game
function endGame() {
    gameRunning = false;
    gameOver = true;
    pauseBtn.disabled = true;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreDisplay.textContent = highScore;
        newHighScoreMsg.classList.remove('hidden');
    } else {
        newHighScoreMsg.classList.add('hidden');
    }

    finalScoreDisplay.textContent = score;
    gameOverModal.classList.remove('hidden');
}

// Update level based on score
function updateLevel() {
    const newLevel = Math.floor(score / 50) + 1;
    if (newLevel > level) {
        level = newLevel;
        gameSpeed = Math.max(50, 100 - (level - 1) * 10);
        levelDisplay.textContent = level;
    }
}

// Initialize game
resetGame();
draw();
      
