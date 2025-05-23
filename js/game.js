// ミノ操作等プレイ画面
const COLS = 10;//プレイエリアサイズ
const ROWS = 20;
const BLOCK_SIZE = 30;
const INITIAL_DROP_INTERVAL = 500;     // 初期落下間隔
const MIN_DROP_INTERVAL = 50;          // 最速の落下間隔
const DROP_INTERVAL_DECREMENT = 30;    // 速度変更での短縮時間
const SCORE_INCREMENT_FOR_SPEED_CHANGE = 500; // 速度が変わるスコアのタイミング

let canvas, ctx;
let field;
let currentBlock;
let currentX, currentY;
let currentShape;
let score;
let dropTimer;
let holdBlock = null;
let canHold = true;
let nextQueue = [];
let bag = [];

//初期化
function startGame() {
    canvas = document.getElementById("tetrisCanvas");
    ctx = canvas.getContext("2d");
    field = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    score = 0;
    holdBlock = null;
    canHold = true;
    nextQueue = [];
    bag = [];

    refillBag();

    for (let i = 0; i < 3; i++) {
        if (bag.length == 0) {
            refillBag();
        }
        nextQueue.push(bag.shift());
    }

    spawnBlock();

    updateScore(score);
    currentDropInterval = INITIAL_DROP_INTERVAL;
    if (dropTimer) {
        clearInterval(dropTimer);
    }
    draw();
    dropTimer = setInterval(update, currentDropInterval);
    document.addEventListener("keydown", handleKey);
}

//新規ミノ表示
function spawnBlock() {
    if (nextQueue.length == 0) {
        console.error("nextQueueが空です。bagから補充します。");
        if (bag.length < 3) refillBag();
        for (let i = 0; i < 3; i++) {
            if (bag.length == 0) refillBag();
            nextQueue.push(bag.shift());
        }
        if (nextQueue.length == 0) {
            gameOver();
            return;
        }
    }
    currentShape = nextQueue.shift();

    currentBlock = BLOCKS[currentShape].shape;
    currentColor = BLOCKS[currentShape].color;
    currentX = Math.floor((COLS - 4) / 2);
    currentY = -1;
    canHold = true;

    if (bag.length == 0) {
        refillBag();
    }
    nextQueue.push(bag.shift());

    if (bag.length == 0) {
        refillBag();
    }

    if (collision(currentBlock, currentX, currentY)) {
        gameOver();
        return;
    }
}

//ミノランダム
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//7つを１つのバッグに入れ、その中から取り出す
function refillBag() {
    const newBag = [0, 1, 2, 3, 4, 5, 6];
    shuffle(newBag);
    bag.push(...newBag);
}

//キュー更新
function updateNextQueue() {
    while (bag.length < 10) {
        refillBag();
    }
    nextQueue = bag.slice(0, 3);
    drawNext();
}

//ミノ落下
function update() {
    if (!collision(currentBlock, currentX, currentY + 1)) {
        currentY++;
    } else {
        mergeBlock();
        spawnBlock();
        clearLines();
    }
    draw();
}

//落下スピード管理
function updateGameSpeed() {
    let scoreInCycle = score % ((INITIAL_DROP_INTERVAL - MIN_DROP_INTERVAL) / DROP_INTERVAL_DECREMENT + 1) * SCORE_INCREMENT_FOR_SPEED_CHANGE;
    let stepsTaken = Math.floor(scoreInCycle / SCORE_INCREMENT_FOR_SPEED_CHANGE);
    let newInterval = INITIAL_DROP_INTERVAL - (stepsTaken * DROP_INTERVAL_DECREMENT);

    if (newInterval !== currentDropInterval) {
        currentDropInterval = newInterval;
        clearInterval(dropTimer);
        dropTimer = setInterval(update, currentDropInterval);
    }
}

//操作
function handleKey(e) {
    let rotated;
    switch (e.key) {
        case "a":
            if (!collision(currentBlock, currentX - 1, currentY)) {
                playSound("move");
                currentX--;
            }
            break;
        case "d":
            if (!collision(currentBlock, currentX + 1, currentY)) {
                playSound("move");
                currentX++;
            }
            break;
        case "s":
            if (!collision(currentBlock, currentX, currentY + 1)) {
                currentY++;
            }
            break;
        case "w":
            hardDrop();
            break;
        case "ArrowRight":
            rotated = rightRotateBlock(currentBlock);
            playSound("rotate");
            tryWallKicks(rotated);
            break;
        case "ArrowLeft":
            rotated = leftRotateBlock(currentBlock);
            playSound("rotate");
            tryWallKicks(rotated);
            break;
        case "ArrowUp":
            holdCurrentBlock();
            break;
    }
    draw();
}

//ハードドロップ
function hardDrop() {
    playSound("drop");
    while (!collision(currentBlock, currentX, currentY + 1)) {
        currentY++;
    }
    mergeBlock();
    spawnBlock();
    clearLines();

    draw();
}

//衝突判定
function collision(block, x, y) {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (block[i][j]) {
                let nx = x + j;
                let ny = y + i;
                if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && field[ny][nx])) {
                    return true;
                }
            }
        }
    }
    return false;
}

//ミノ設置
function mergeBlock() {
    playSound("put");

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (currentBlock[i][j]) {
                if (currentY + i < 0) {
                    gameOver();
                    return;
                }
            }
        }
    }

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (currentBlock[i][j]) {
                let ny = currentY + i;
                let nx = currentX + j;
                if (ny < ROWS && nx >= 0 && nx < COLS) {
                    field[ny][nx] = currentColor;
                }
            }
        }
    }
}

//ミノ削除
function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (field[y].every(cell => cell != null && cell != 0)) {
            field.splice(y, 1);
            field.unshift(Array(COLS).fill(null));
            linesCleared++;
            y++;
        }
    }

    if (linesCleared > 0) {
        let pointsEarned = 0;
        playSound("clear");
        switch (linesCleared) {
            case 1:
                pointsEarned = 100;
                break;
            case 2:
                pointsEarned = 300;
                break;
            case 3:
                pointsEarned = 500;
                break;
            case 4:
                pointsEarned = 800;
                break;
            default:
                if (linesCleared > 4) {
                    pointsEarned = 800;
                }
                break;
        }
        score += pointsEarned;
        updateScore(score);
        updateGameSpeed();
    }
}

//壁際回転
function tryWallKicks(rotatedShape) {
    let kickTests;
    if (currentShape == 1) { //Oのとき
        if (!collision(rotatedShape, currentX, currentY)) {
            currentBlock = rotatedShape;
        }
        return;
    }

    if (currentShape == 0) {
        kickTests = [//Iのとき
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: -2, y: 0 },
            { x: 2, y: 0 }
        ];
    } else {//その他
        kickTests = [
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];
    }

    for (const kick of kickTests) {
        const newX = currentX + kick.x;
        const newY = currentY + kick.y;
        if (!collision(rotatedShape, newX, newY)) {
            currentBlock = rotatedShape;
            currentX = newX;
            currentY = newY;
            return;
        }
    }
}

//ゲームオーバー管理
function gameOver() {
    clearInterval(dropTimer);
    document.removeEventListener("keydown", handleKey);
    showGameOver();
}

//ホールド管理
function holdCurrentBlock() {
    if (!canHold) return;

    if (holdBlock == null) {
        holdBlock = currentShape;
        spawnBlock();
    } else {
        let temp = currentShape;
        currentShape = holdBlock;
        currentBlock = BLOCKS[currentShape].shape;
        currentColor = BLOCKS[currentShape].color;
        holdBlock = temp;
        currentX = Math.floor((COLS - 4) / 2);
        currentY = 0;
    }

    playSound("hold");
    canHold = false;
    draw();
}


