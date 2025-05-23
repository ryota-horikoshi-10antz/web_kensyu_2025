// ブロック定義（4x4）(shape, color)
const BLOCKS = [
    // I
    {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: "cyan"
    },
    // O
    {
        shape: [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        color: "yellow"
    },
    // T
    {
        shape: [
            [0, 0, 0, 0],
            [0, 1, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        color: "purple"
    },
    // L
    {
        shape: [
            [0, 0, 0, 0],
            [0, 0, 1, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        color: "orange"
    },
    // J
    {
        shape: [
            [0, 0, 0, 0],
            [1, 0, 0, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        color: "blue"
    },
    // S
    {
        shape: [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [1, 1, 0, 0],
            [0, 0, 0, 0]
        ],
        color: "green"
    },
    // Z
    {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0]
        ],
        color: "red"
    },
];

// ミノ時計回り
function rightRotateBlock(block) {
    const size = block.length;
    const newBlock = [];
    for (let y = 0; y < size; y++) {
        newBlock[y] = [];
        for (let x = 0; x < size; x++) {
            newBlock[y][x] = block[size - x - 1][y];
        }
    }
    return newBlock;
}

// ミノ反時計回り
function leftRotateBlock(block) {
    const size = block.length;
    const newBlock = [];
    for (let y = 0; y < size; y++) {
        newBlock[y] = [];
        for (let x = 0; x < size; x++) {
            newBlock[y][x] = block[x][size - y - 1];
        }
    }
    return newBlock;
}

