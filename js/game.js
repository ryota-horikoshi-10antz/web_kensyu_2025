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

//ミノの順番管理
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//7つのミノを袋に入れ、その中からランダムで出す
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

//ミノ落下スピード変更
function updateGameSpeed() {
    const scoreInCycle = score % ((INITIAL_DROP_INTERVAL - MIN_DROP_INTERVAL) / DROP_INTERVAL_DECREMENT + 1) * SCORE_INCREMENT_FOR_SPEED_CHANGE;
    const stepsTaken = Math.floor(scoreInCycle / SCORE_INCREMENT_FOR_SPEED_CHANGE);
    const newInterval = INITIAL_DROP_INTERVAL - (stepsTaken * DROP_INTERVAL_DECREMENT);

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

//壁端でのミノの回転操作
function tryWallKicks(rotatedShape) {
    let kickTests;
    if (currentShape == 1) { //Oのとき
        if (!collision(rotatedShape, currentX, currentY)) {
            currentBlock = rotatedShape;
        }
        return;
    }

    if (currentShape == 0) {//Iのとき
        kickTests = [
            { x: 0, y: 0 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: -2, y: 0 },
            { x: 2, y: 0 }
        ];
    } else {//I,O以外
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





// //描画全体
// function draw() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     for (let y = 0; y < ROWS; y++) {
//         for (let x = 0; x < COLS; x++) {
//             if (field[y][x]) drawBlock(x, y, field[y][x]);
//         }
//     }

//     const ghostY = calculateGhostY();
//     const ghostColor = "rgba(255, 255, 255, 0.2)";

//     for (let i = 0; i < 4; i++) {
//         for (let j = 0; j < 4; j++) {
//             if (currentBlock[i][j]) {
//                 let drawCellX = currentX + j;
//                 let drawCellY = ghostY + i;

//                 if (drawCellY >= 0 && drawCellY < ROWS &&
//                     drawCellX >= 0 && drawCellX < COLS) {
//                     drawBlock(drawCellX, drawCellY, ghostColor);
//                 }
//             }
//         }
//     }

//     for (let i = 0; i < 4; i++) {
//         for (let j = 0; j < 4; j++) {
//             if (currentBlock[i][j]) {
//                 drawBlock(currentX + j, currentY + i, currentColor);
//             }
//         }
//     }

//     drawGrid();
//     drawHold();
//     drawNext();
// }

// //ミノ表示
// function drawBlock(x, y, color) {
//     ctx.fillStyle = color;
//     ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
// }

// //落下予測表示
// function calculateGhostY() {
//     let testY = currentY;
//     while (!collision(currentBlock, currentX, testY + 1)) {
//         testY++;
//     }
//     return testY;
// }

// //ホールド表示
// function drawHold() {
//     const holdCanvas = document.getElementById("holdBox");
//     const holdCtx = holdCanvas.getContext("2d");
//     holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);

//     if (holdBlock == null) return;

//     const block = BLOCKS[holdBlock].shape;
//     const color = BLOCKS[holdBlock].color;
//     const blockSize = 24;

//     let minX = 4, maxX = -1, minY = 4, maxY = -1;
//     for (let i = 0; i < 4; i++) {
//         for (let j = 0; j < 4; j++) {
//             if (block[i][j]) {
//                 if (j < minX) minX = j;
//                 if (j > maxX) maxX = j;
//                 if (i < minY) minY = i;
//                 if (i > maxY) maxY = i;
//             }
//         }
//     }

//     const blockWidth = (maxX - minX + 1);
//     const blockHeight = (maxY - minY + 1);

//     const offsetX = (holdCanvas.width - blockSize * blockWidth) / 2;
//     const offsetY = (holdCanvas.height - blockSize * blockHeight) / 2;

//     for (let i = minY; i <= maxY; i++) {
//         for (let j = minX; j <= maxX; j++) {
//             if (block[i][j]) {
//                 holdCtx.fillStyle = color;
//                 holdCtx.fillRect(
//                     offsetX + (j - minX) * blockSize,
//                     offsetY + (i - minY) * blockSize,
//                     blockSize - 1,
//                     blockSize - 1
//                 );
//             }
//         }
//     }
// }

// //次に落下するミノの表示
// function drawNext() {
//     const nextCanvas = document.getElementById("nextTetrisBox");
//     const nextCtx = nextCanvas.getContext("2d");
//     nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

//     const blockSize = 24;
//     const sectionHeight = nextCanvas.height / 3;

//     nextQueue.forEach((shapeIndex, idx) => {
//         const block = BLOCKS[shapeIndex].shape;
//         const color = BLOCKS[shapeIndex].color;

//         let minX = 4, maxX = -1, minY = 4, maxY = -1;
//         for (let i = 0; i < 4; i++) {
//             for (let j = 0; j < 4; j++) {
//                 if (block[i][j]) {
//                     minX = Math.min(minX, j);
//                     maxX = Math.max(maxX, j);
//                     minY = Math.min(minY, i);
//                     maxY = Math.max(maxY, i);
//                 }
//             }
//         }

//         const blockWidth = (maxX - minX + 1) * blockSize;
//         const blockHeight = (maxY - minY + 1) * blockSize;
//         const offsetX = (nextCanvas.width - blockWidth) / 2;
//         const areaTop = idx * sectionHeight;
//         const offsetY = areaTop + (sectionHeight - blockHeight) / 2;

//         for (let i = minY; i <= maxY; i++) {
//             for (let j = minX; j <= maxX; j++) {
//                 if (block[i][j]) {
//                     nextCtx.fillStyle = color;
//                     nextCtx.fillRect(
//                         offsetX + (j - minX) * blockSize,
//                         offsetY + (i - minY) * blockSize,
//                         blockSize - 1,
//                         blockSize - 1
//                     );
//                 }
//             }
//         }
//     });
// }

// //内部枠線表示
// function drawGrid() {
//     ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
//     ctx.lineWidth = 1;

//     for (let x = 0; x <= COLS; x++) {
//         ctx.beginPath();
//         ctx.moveTo(x * BLOCK_SIZE, 0);
//         ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
//         ctx.stroke();
//     }

//     for (let y = 0; y <= ROWS; y++) {
//         ctx.beginPath();
//         ctx.moveTo(0, y * BLOCK_SIZE);
//         ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
//         ctx.stroke();
//     }
// }