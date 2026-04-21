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

// 当前难度
let currentDifficulty = 'beginner';

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

// localStorage 键名
const BEST_TIMES_KEY = 'minesweeper_best_times';
const THEME_KEY = 'minesweeper_theme';
const GAME_STATS_KEY = 'minesweeper_game_stats';

// 获取游戏统计
function getGameStats() {
    const stored = localStorage.getItem(GAME_STATS_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return {
        beginner: { games: 0, wins: 0 },
        intermediate: { games: 0, wins: 0 },
        expert: { games: 0, wins: 0 },
        custom: { games: 0, wins: 0 }
    };
}

// 保存游戏统计
function saveGameStats(stats) {
    localStorage.setItem(GAME_STATS_KEY, JSON.stringify(stats));
}

// 更新游戏统计
function updateGameStats(difficulty, win) {
    const stats = getGameStats();
    const key = difficulty;
    
    if (stats[key]) {
        stats[key].games++;
        if (win) {
            stats[key].wins++;
        }
        saveGameStats(stats);
    }
    
    updateStatsDisplay();
}

// 清空游戏统计
function clearGameStats() {
    const stats = {
        beginner: { games: 0, wins: 0 },
        intermediate: { games: 0, wins: 0 },
        expert: { games: 0, wins: 0 },
        custom: { games: 0, wins: 0 }
    };
    saveGameStats(stats);
    updateStatsDisplay();
}

// 计算胜率
function calculateWinRate(games, wins) {
    if (games === 0) return '-';
    return ((wins / games) * 100).toFixed(1) + '%';
}

// 更新统计显示
function updateStatsDisplay() {
    const stats = getGameStats();
    const difficulties = ['beginner', 'intermediate', 'expert', 'custom'];
    
    difficulties.forEach(difficulty => {
        const stat = stats[difficulty];
        const gamesElement = document.getElementById(`${difficulty}-games`);
        const winsElement = document.getElementById(`${difficulty}-wins`);
        const winrateElement = document.getElementById(`${difficulty}-winrate`);
        
        if (gamesElement) gamesElement.textContent = stat.games;
        if (winsElement) winsElement.textContent = stat.wins;
        if (winrateElement) winrateElement.textContent = calculateWinRate(stat.games, stat.wins);
    });
}

// 获取最佳成绩
function getBestTimes() {
    const stored = localStorage.getItem(BEST_TIMES_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return {
        beginner: null,
        intermediate: null,
        expert: null
    };
}

// 保存最佳成绩
function saveBestTimes(times) {
    localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(times));
}

// 检查并更新最佳成绩
function checkAndUpdateBestTime(difficulty, time) {
    if (difficulty === 'custom') {
        return { isNewRecord: false };
    }
    
    const bestTimes = getBestTimes();
    const currentBest = bestTimes[difficulty];
    
    if (currentBest === null || time < currentBest) {
        const wasRecord = currentBest !== null;
        bestTimes[difficulty] = time;
        saveBestTimes(bestTimes);
        return { 
            isNewRecord: true, 
            previousBest: wasRecord ? currentBest : null 
        };
    }
    
    return { 
        isNewRecord: false, 
        previousBest: currentBest 
    };
}

// DOM 元素
const gameBoard = document.getElementById('game-board');
const mineCountElement = document.getElementById('mine-count');
const timerElement = document.getElementById('timer');
const restartButton = document.getElementById('restart-btn');
const gameMessage = document.getElementById('game-message');
const difficultySelector = document.getElementById('difficulty');
const customDifficulty = document.getElementById('custom-difficulty');
const customRowsInput = document.getElementById('custom-rows');
const customColsInput = document.getElementById('custom-cols');
const customMinesInput = document.getElementById('custom-mines');
const confirmCustomBtn = document.getElementById('confirm-custom');
const customError = document.getElementById('custom-error');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

// 获取主题
function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
}

// 保存主题
function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
}

// 应用主题
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-theme');
        themeIcon.textContent = '🌙';
    }
}

// 切换主题
function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    saveTheme(newTheme);
    applyTheme(newTheme);
}

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
    if (gameOver || gameWon || board[row][col].isFlagged) {
        return;
    }
    
    if (firstClick) {
        firstClick = false;
        placeMines(row, col);
        startTimer();
    }
    
    if (board[row][col].isRevealed) {
        if (board[row][col].adjacentMines > 0) {
            const flagCount = countAdjacentFlags(row, col);
            if (flagCount === board[row][col].adjacentMines) {
                chordClick(row, col);
            }
        }
        return;
    }
    
    revealCell(row, col, true);
    checkWin();
}

// 计算周围插旗数量
function countAdjacentFlags(row, col) {
    let count = 0;
    
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (isValidCell(newRow, newCol) && board[newRow][newCol].isFlagged) {
                count++;
            }
        }
    }
    
    return count;
}

// 和弦点击：翻开周围未标记的格子
function chordClick(row, col) {
    let hitMine = false;
    
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (isValidCell(newRow, newCol) && 
                !board[newRow][newCol].isFlagged && 
                !board[newRow][newCol].isRevealed) {
                revealCell(newRow, newCol, true);
                if (board[newRow][newCol].isMine) {
                    hitMine = true;
                }
            }
        }
    }
    
    if (!hitMine) {
        checkWin();
    }
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
    
    updateGameStats(currentDifficulty, win);
    
    if (!win) {
        revealAllMines();
        showGameMessage('游戏失败！踩到地雷了。', false);
    } else {
        autoFlagRemainingMines();
        const recordInfo = checkAndUpdateBestTime(currentDifficulty, timer);
        showGameMessage('恭喜你，游戏胜利！', true, timer, recordInfo);
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
function showGameMessage(message, isWin, currentTime = null, recordInfo = null) {
    gameMessage.classList.add('show');
    gameMessage.classList.remove('win', 'lose');
    gameMessage.classList.add(isWin ? 'win' : 'lose');
    
    if (isWin && currentTime !== null) {
        let html = `<div class="win-main">${message}</div>`;
        html += `<div class="win-time">本次用时: <span class="time-value">${currentTime}</span> 秒</div>`;
        
        if (currentDifficulty !== 'custom') {
            const bestTimes = getBestTimes();
            const bestTime = bestTimes[currentDifficulty];
            if (bestTime !== null) {
                html += `<div class="win-best">当前最佳: <span class="time-value">${bestTime}</span> 秒</div>`;
            }
        }
        
        if (recordInfo && recordInfo.isNewRecord) {
            if (recordInfo.previousBest !== null) {
                html += `<div class="new-record">🎊 新纪录！比之前快了 ${recordInfo.previousBest - currentTime} 秒！</div>`;
            } else {
                html += `<div class="new-record">🎊 新纪录！这是你第一次完成该难度！</div>`;
            }
        } else if (currentDifficulty === 'custom') {
            html += `<div class="custom-note">自定义难度不计入最佳成绩</div>`;
        }
        
        gameMessage.innerHTML = html;
    } else {
        gameMessage.textContent = message;
    }
}

// 隐藏游戏消息
function hideGameMessage() {
    gameMessage.classList.remove('show');
}

// 切换难度
function changeDifficulty(difficulty) {
    hideCustomError();
    
    currentDifficulty = difficulty;
    
    if (difficulty === 'custom') {
        showCustomDifficulty();
        return;
    }
    
    hideCustomDifficulty();
    
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

// 显示自定义难度输入框
function showCustomDifficulty() {
    customDifficulty.classList.remove('hidden');
}

// 隐藏自定义难度输入框
function hideCustomDifficulty() {
    customDifficulty.classList.add('hidden');
}

// 显示自定义错误信息
function showCustomError(message) {
    customError.textContent = message;
    customError.classList.remove('hidden');
}

// 隐藏自定义错误信息
function hideCustomError() {
    customError.classList.add('hidden');
}

// 计算格子尺寸（根据行列数动态调整）
// 确保：随着行列数增加，棋盘总面积不会缩小
function calculateCellSize(rows, cols) {
    const maxCellSize = 36;
    const minCellSize = 16;
    const maxCells = Math.max(rows, cols);
    
    // 每6个格子减少1个像素，下降速度足够慢
    // 确保在常用范围内（maxCells ≤ 31）棋盘大小严格递增
    // 验证：
    // 10×10: 36 - floor(9/6) = 35px → 10×35 = 350px
    // 11×11: 36 - floor(10/6) = 35px → 11×35 = 385px ✓
    // 16×16: 36 - floor(15/6) = 34px → 16×34 = 544px ✓
    // 20×20: 36 - floor(19/6) = 33px → 20×33 = 660px ✓
    // 30×30: 36 - floor(29/6) = 32px → 30×32 = 960px ✓
    // 50×50: 36 - floor(49/6) = 28px → 50×28 = 1400px
    
    let cellSize = maxCellSize - Math.floor((maxCells - 1) / 6);
    cellSize = Math.max(minCellSize, cellSize);
    
    return cellSize;
}

// 确认自定义难度
function confirmCustomDifficulty() {
    hideCustomError();
    
    const rows = parseInt(customRowsInput.value);
    const cols = parseInt(customColsInput.value);
    const mines = parseInt(customMinesInput.value);
    
    if (isNaN(rows) || rows < 1 || rows > 50) {
        showCustomError('行数必须在 1-50 之间');
        return;
    }
    
    if (isNaN(cols) || cols < 1 || cols > 50) {
        showCustomError('列数必须在 1-50 之间');
        return;
    }
    
    if (isNaN(mines) || mines < 1) {
        showCustomError('地雷数必须大于 0');
        return;
    }
    
    const totalCells = rows * cols;
    if (mines >= totalCells) {
        showCustomError(`地雷数不能超过格子总数 (${totalCells - 1})`);
        return;
    }
    
    currentDifficulty = 'custom';
    ROWS = rows;
    COLS = cols;
    MINES = mines;
    CELL_SIZE = calculateCellSize(rows, cols);
    
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
confirmCustomBtn.addEventListener('click', confirmCustomDifficulty);
themeToggle.addEventListener('click', toggleTheme);

const clearStatsBtn = document.getElementById('clear-stats-btn');
if (clearStatsBtn) {
    clearStatsBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有游戏统计吗？')) {
            clearGameStats();
        }
    });
}

// 初始化主题
applyTheme(getTheme());

// 初始化统计显示
updateStatsDisplay();

// 初始化游戏
initGame();
