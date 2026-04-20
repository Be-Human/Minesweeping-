// 难度配置
const DIFFICULTIES = {
    beginner: { rows: 9, cols: 9, mines: 10, cellSize: 36 },
    intermediate: { rows: 16, cols: 16, mines: 40, cellSize: 28 },
    expert: { rows: 16, cols: 30, mines: 99, cellSize: 24 }
};

// 游戏配置
let ROWS = DIFFICULTIES.beginner.rows;
let COLS = DIFFICULTIES.beginner.cols;
let MINES = DIFFICULTIES.beginner.mines;
let CELL_SIZE = DIFFICULTIES.beginner.cellSize;

// 游戏状态
let board = [];
let minePositions = [];
let gameOver = false;
let gameWon = false;
let timer = 0;
let timerInterval = null;
let flagsCount = 0;
let firstClick = true;
let clickedMineRow = -1;
let clickedMineCol = -1;

// DOM 元素
const gameBoard = document.getElementById('game-board');
const mineCountElement = document.getElementById('mine-count');
const timerElement = document.getElementById('timer');
const restartButton = document.getElementById('restart-btn');
const gameMessage = document.getElementById('game-message');
const difficultySelector = document.getElementById('difficulty');

// 初始化游戏
function initGame() {
    board = [];
    minePositions = [];
    gameOver = false;
    gameWon = false;
    timer = 0;
    flagsCount = 0;
    firstClick = true;
    clickedMineRow = -1;
    clickedMineCol = -1;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    updateMineCount();
    updateTimer();
    hideGameMessage();
    
    createBoard();
    generateBoard();
}

// 创建棋盘 DOM 结构
function createBoard() {
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${COLS}, ${CELL_SIZE}px)`;
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.style.width = `${CELL_SIZE}px`;
            cell.style.height = `${CELL_SIZE}px`;
            cell.style.fontSize = `${CELL_SIZE * 0.45}px`;
            
            cell.addEventListener('click', () => handleCellClick(row, col));
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                handleRightClick(row, col);
            });
            
            gameBoard.appendChild(cell);
        }
    }
}

// 生成棋盘数据
function generateBoard() {
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = {
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0
            };
        }
    }
}

// 放置地雷（避开第一次点击的位置）
function placeMines(firstRow, firstCol) {
    let minesPlaced = 0;
    
    while (minesPlaced < MINES) {
        const row = Math.floor(Math.random() * ROWS);
        const col = Math.floor(Math.random() * COLS);
        
        if (!board[row][col].isMine && !(row === firstRow && col === firstCol)) {
            board[row][col].isMine = true;
            minePositions.push({ row, col });
            minesPlaced++;
        }
    }
    
    calculateAdjacentMines();
}

// 计算每个格子周围的地雷数
function calculateAdjacentMines() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (!board[row][col].isMine) {
                board[row][col].adjacentMines = countAdjacentMines(row, col);
            }
        }
    }
}

// 计算指定格子周围的地雷数
function countAdjacentMines(row, col) {
    let count = 0;
    
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (isValidCell(newRow, newCol) && board[newRow][newCol].isMine) {
                count++;
            }
        }
    }
    
    return count;
}

// 检查坐标是否有效
function isValidCell(row, col) {
    return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

// 处理左键点击
function handleCellClick(row, col) {
    if (gameOver || gameWon || board[row][col].isFlagged || board[row][col].isRevealed) {
        return;
    }
    
    if (firstClick) {
        firstClick = false;
        placeMines(row, col);
        startTimer();
    }
    
    revealCell(row, col, true);
    checkWin();
}

// 处理右键点击（标记/取消旗子）
function handleRightClick(row, col) {
    if (gameOver || gameWon || board[row][col].isRevealed) {
        return;
    }
    
    const cell = getCellElement(row, col);
    
    if (board[row][col].isFlagged) {
        board[row][col].isFlagged = false;
        cell.classList.remove('flag');
        cell.style.fontSize = `${CELL_SIZE * 0.45}px`;
        flagsCount--;
    } else {
        if (flagsCount >= MINES) {
            return;
        }
        board[row][col].isFlagged = true;
        cell.classList.add('flag');
        cell.style.fontSize = `${CELL_SIZE * 0.55}px`;
        flagsCount++;
    }
    
    updateMineCount();
}

// 翻开格子
function revealCell(row, col, animate = false) {
    if (!isValidCell(row, col) || board[row][col].isRevealed || board[row][col].isFlagged) {
        return;
    }
    
    const cell = getCellElement(row, col);
    board[row][col].isRevealed = true;
    
    if (animate) {
        cell.classList.add('revealed', 'animated');
    } else {
        cell.classList.add('revealed');
    }
    
    if (board[row][col].isMine) {
        clickedMineRow = row;
        clickedMineCol = col;
        cell.classList.add('mine', 'clicked-mine');
        cell.textContent = '💣';
        gameOver = true;
        endGame(false);
        return;
    }
    
    if (board[row][col].adjacentMines > 0) {
        cell.textContent = board[row][col].adjacentMines;
        cell.dataset.count = board[row][col].adjacentMines;
    } else {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                revealCell(row + dr, col + dc, false);
            }
        }
    }
}

// 获取格子 DOM 元素
function getCellElement(row, col) {
    return gameBoard.children[row * COLS + col];
}

// 显示所有地雷位置和标错的旗子
function revealAllMines() {
    minePositions.forEach(pos => {
        const cell = getCellElement(pos.row, pos.col);
        if (pos.row === clickedMineRow && pos.col === clickedMineCol) {
            return;
        }
        if (!board[pos.row][pos.col].isFlagged) {
            cell.classList.add('mine');
            cell.textContent = '💣';
            cell.style.fontSize = `${CELL_SIZE * 0.55}px`;
        }
    });
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col].isFlagged && !board[row][col].isMine) {
                const cell = getCellElement(row, col);
                cell.classList.remove('flag');
                cell.classList.add('wrong-flag');
                cell.textContent = '✗';
                cell.style.fontSize = `${CELL_SIZE * 0.65}px`;
            }
        }
    }
}

// 检查胜利条件
function checkWin() {
    let revealedCount = 0;
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col].isRevealed) {
                revealedCount++;
            }
        }
    }
    
    if (revealedCount === ROWS * COLS - MINES) {
        gameWon = true;
        endGame(true);
    }
}

// 结束游戏
function endGame(win) {
    stopTimer();
    
    if (!win) {
        revealAllMines();
        showGameMessage('游戏失败！踩到地雷了。', false);
    } else {
        autoFlagRemainingMines();
        showGameMessage('恭喜你，游戏胜利！', true);
    }
}

// 自动标记剩余未插旗的地雷
function autoFlagRemainingMines() {
    minePositions.forEach(pos => {
        if (!board[pos.row][pos.col].isFlagged) {
            const cell = getCellElement(pos.row, pos.col);
            board[pos.row][pos.col].isFlagged = true;
            cell.classList.add('flag');
            cell.style.fontSize = `${CELL_SIZE * 0.55}px`;
        }
    });
    flagsCount = MINES;
    updateMineCount();
}

// 开始计时器
function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        updateTimer();
    }, 1000);
}

// 停止计时器
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// 更新剩余地雷数显示
function updateMineCount() {
    mineCountElement.textContent = MINES - flagsCount;
}

// 更新计时器显示
function updateTimer() {
    timerElement.textContent = timer;
}

// 显示游戏消息
function showGameMessage(message, isWin) {
    gameMessage.textContent = message;
    gameMessage.classList.add('show');
    gameMessage.classList.remove('win', 'lose');
    gameMessage.classList.add(isWin ? 'win' : 'lose');
}

// 隐藏游戏消息
function hideGameMessage() {
    gameMessage.classList.remove('show');
}

// 切换难度
function changeDifficulty(difficulty) {
    const config = DIFFICULTIES[difficulty];
    ROWS = config.rows;
    COLS = config.cols;
    MINES = config.mines;
    CELL_SIZE = config.cellSize;
    
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    initGame();
}

// 事件监听
restartButton.addEventListener('click', initGame);
difficultySelector.addEventListener('change', (e) => {
    changeDifficulty(e.target.value);
});

// 初始化游戏
initGame();
