//描画

//全体描画
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (field[y][x]) drawBlock(x, y, field[y][x]);
        }
    }

    const ghostY = calculateGhostY();
    const ghostColor = "rgba(255, 255, 255, 0.2)";

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (currentBlock[i][j]) {
                let drawCellX = currentX + j;
                let drawCellY = ghostY + i;
                if (drawCellY >= 0 && drawCellY < ROWS &&
                    drawCellX >= 0 && drawCellX < COLS) {
                    drawBlock(drawCellX, drawCellY, ghostColor);
                }
            }
        }
    }


    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (currentBlock[i][j]) {
                drawBlock(currentX + j, currentY + i, currentColor);
            }
        }
    }

    drawGrid();
    drawHold();
    drawNext();
}

//ミノ表示
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
}

//ホールド
function drawHold() {
    const holdCanvas = document.getElementById("holdBox");
    const holdCtx = holdCanvas.getContext("2d");
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);

    if (holdBlock == null) return;

    const block = BLOCKS[holdBlock].shape;
    const color = BLOCKS[holdBlock].color;
    const blockSize = 24;

    let minX = 4, maxX = -1, minY = 4, maxY = -1;
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (block[i][j]) {
                if (j < minX) minX = j;
                if (j > maxX) maxX = j;
                if (i < minY) minY = i;
                if (i > maxY) maxY = i;
            }
        }
    }

    const blockWidth = (maxX - minX + 1);
    const blockHeight = (maxY - minY + 1);

    const offsetX = (holdCanvas.width - blockSize * blockWidth) / 2;
    const offsetY = (holdCanvas.height - blockSize * blockHeight) / 2;

    for (let i = minY; i <= maxY; i++) {
        for (let j = minX; j <= maxX; j++) {
            if (block[i][j]) {
                holdCtx.fillStyle = color;
                holdCtx.fillRect(
                    offsetX + (j - minX) * blockSize,
                    offsetY + (i - minY) * blockSize,
                    blockSize - 1,
                    blockSize - 1
                );
            }
        }
    }
}

//次の落下ミノ
function drawNext() {
    const nextCanvas = document.getElementById("nextTetrisBox");
    const nextCtx = nextCanvas.getContext("2d");
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    const blockSize = 24;
    const sectionHeight = nextCanvas.height / 3;

    nextQueue.forEach((shapeIndex, idx) => {
        const block = BLOCKS[shapeIndex].shape;
        const color = BLOCKS[shapeIndex].color;

        let minX = 4, maxX = -1, minY = 4, maxY = -1;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (block[i][j]) {
                    minX = Math.min(minX, j);
                    maxX = Math.max(maxX, j);
                    minY = Math.min(minY, i);
                    maxY = Math.max(maxY, i);
                }
            }
        }

        const blockWidth = (maxX - minX + 1) * blockSize;
        const blockHeight = (maxY - minY + 1) * blockSize;


        const offsetX = (nextCanvas.width - blockWidth) / 2;

        const areaTop = idx * sectionHeight;
        const offsetY = areaTop + (sectionHeight - blockHeight) / 2;

        for (let i = minY; i <= maxY; i++) {
            for (let j = minX; j <= maxX; j++) {
                if (block[i][j]) {
                    nextCtx.fillStyle = color;
                    nextCtx.fillRect(
                        offsetX + (j - minX) * blockSize,
                        offsetY + (i - minY) * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            }
        }
    });
}

//内部枠線
function drawGrid() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }

    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
    }
}

//影描画計算
function calculateGhostY() {
    let testY = currentY;
    while (!collision(currentBlock, currentX, testY + 1)) {
        testY++;
    }
    return testY;
}