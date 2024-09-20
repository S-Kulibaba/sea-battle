const WebSocket = require('ws');

// Объект для хранения всех комнат
const rooms = {};

// Объект для хранения WebSocket соединений каждого игрока
const playerConnections = {};

// Функция для генерации случайного кода комнаты
const generateRoomCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// Функция для создания новой комнаты
const createRoom = (nickname, ws) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
        [nickname]: { 
            token: null, 
            board: null, 
            visibleOpponentBoard: Array(10).fill().map(() => Array(10).fill(0)),
            ready: false, 
            gameStage: 'placing' 
        }
    };
    playerConnections[roomCode] = {
        [nickname]: ws
    };
    console.log(`Room created: ${roomCode} by ${nickname}`);
    console.log(rooms);
    return roomCode;
};

// Функция для подключения к существующей комнате
const joinRoom = (roomCode, nickname, ws) => {
    if (rooms[roomCode]) {
        if (!rooms[roomCode][nickname]) {
            rooms[roomCode][nickname] = { 
                token: null, 
                board: null, 
                visibleOpponentBoard: Array(10).fill().map(() => Array(10).fill(0)),
                ready: false, 
                gameStage: 'placing' 
            };
            playerConnections[roomCode][nickname] = ws;
            console.log(`${nickname} joined room ${roomCode}`);
            console.log(rooms);
            ws.send(JSON.stringify({ type: 'joined', success: true, roomCode }));
            if (Object.keys(rooms[roomCode]).length === 2) {
                startGame(roomCode);
            }
        } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Nickname already exists in the room.' }));
        }
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found.' }));
    }
};

// Генерируем токен
const generateRandomToken = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Функция для обнаружения кораблей

const detectShips = (board) => {
    const ships = [];
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            if (board[i][j] === 1) {
                ships.push([i, j]);
            }
        }
    }
    return ships;
};

// Функция для случайного выбора игрока для первого хода
const chooseFirstPlayer = (players) => {
    const randomIndex = Math.floor(Math.random() * players.length);
    return players[randomIndex];
};

const startGame = (roomCode) => {
    const players = Object.keys(rooms[roomCode]);
    const token = generateRandomToken();

    // Устанавливаем токен для каждого игрока
    players.forEach(player => {
        rooms[roomCode][player].token = token;
    });

    const firstPlayer = chooseFirstPlayer(players);

    // Сохраняем информацию о первом ходе в комнату
    // rooms[roomCode][player].turn = firstPlayer;

    players.forEach((player) => {
        const ws = playerConnections[roomCode][player];
        rooms[roomCode][player].turn = firstPlayer;
        if (ws) {
            ws.send(JSON.stringify({ type: 'gameStart', message: 'Game is starting!', players, roomCode, token }));
        }
    });
    console.log(`Game started in room ${roomCode} with players: ${players.join(', ')}. Token: ${token}`);
};


const updateBoard = (roomCode, nickname, token, board) => {
    if (rooms[roomCode] && rooms[roomCode][nickname] && rooms[roomCode][nickname].token === token) {
        rooms[roomCode][nickname].board = board;
        console.log(`Updated board for ${nickname} in room ${roomCode}:`);
        console.log(JSON.stringify(rooms[roomCode], null, 2));
        return true;
    }
    return false;
};

const checkBothPlayersReady = (roomCode) => {
    const players = rooms[roomCode];
    if (players) {
        const allReady = Object.values(players).every(player => player.ready);
        if (allReady) {
            console.log(`Both players in room ${roomCode} are ready. Starting the game.`);
            const playerNicknames = Object.keys(players);
            
            // Выбираем первого игрока, если еще не выбран
            if (!rooms[roomCode].turn) {
                rooms[roomCode].turn = chooseFirstPlayer(playerNicknames);
            }
            
            playerNicknames.forEach(player => {
                players[player].gameStage = 'battle';
                const ws = playerConnections[roomCode][player];
                if (ws) {
                    ws.send(JSON.stringify({
                        type: 'bothPlayersReady',
                        message: 'Both players are ready. Game is starting!',
                        roomCode: roomCode,
                        players: playerNicknames,
                        gameStage: 'battle',
                        firstPlayer: rooms[roomCode].turn
                    }));
                }
            });
        } else {
            console.log(`Waiting for both players to be ready in room ${roomCode}.`);
        }
    } else {
        console.log(`Room ${roomCode} not found.`);
    }
};

const updatePlayerReadyStatus = (roomCode, nickname, token) => {
    if (rooms[roomCode] && rooms[roomCode][nickname] && rooms[roomCode][nickname].token === token) {
        rooms[roomCode][nickname].ready = true;
        console.log(`${nickname} in room ${roomCode} is now ready.`);
        checkBothPlayersReady(roomCode);
        return true;
    }
    return false;
};

const getBoard = (roomCode, nickname, token) => {
    if (rooms[roomCode] && rooms[roomCode][nickname] && rooms[roomCode][nickname].token === token) {
        const board = rooms[roomCode][nickname].board;
        
        // Проверяем, есть ли доска, и обновляем состояние gameStage на 'battle'
        if (board) {
            rooms[roomCode][nickname].gameStage = 'battle';
            console.log(`Game stage for ${nickname} in room ${roomCode} set to`);
        }
        
        console.log(`Sending board for ${nickname} in room ${roomCode}:`);
        const ships = detectShips(board);
        console.log(`Detected ships for ${nickname}:`, ships);
        
        // Возвращаем доску и текущее состояние gameStage
        // return { board, gameStage: rooms[roomCode][nickname].gameStage };
        return board;
    }
    return null;
};


const attemptReconnect = (roomCode, nickname, token, ws) => {
    if (rooms[roomCode] && rooms[roomCode][nickname] && rooms[roomCode][nickname].token === token) {
        console.log(`Reconnect successful for ${nickname} in room ${roomCode}`);
        playerConnections[roomCode][nickname] = ws;
        return true;
    }
    console.error(`Reconnect failed for ${nickname} in room ${roomCode}. Invalid room, nickname, or token.`);
    return false;
};

const getGameStage = (roomCode, nickname) => {
    if (rooms[roomCode] && rooms[roomCode][nickname]) {
        const stage = rooms[roomCode][nickname].gameStage;
        console.log(stage);
        return stage;
    } else {
        console.error(`Room ${roomCode} or player ${nickname} not found`);
        return null;
    }
}

const getPlayers = (roomCode) => {
    if (rooms[roomCode]) {
        return Object.keys(rooms[roomCode]);
    }
    return null;
};

const updateVisibleOpponentBoard = (roomCode, nickname, opponentBoard) => {
    // Проверяем, существует ли комната и игрок с таким ником
    if (rooms[roomCode] && rooms[roomCode][nickname]) {
        // Добавляем или обновляем поле visibleOpponentBoard
        rooms[roomCode][nickname].visibleOpponentBoard = opponentBoard;
        console.log(`Updated visible opponent board for ${nickname} in room ${roomCode}:`);
        console.log(opponentBoard);
        return true;
    } else {
        console.error(`Room ${roomCode} or player ${nickname} not found`);
        return false;
    }
};

const getCurrentTurn = (roomCode, nickname) => {
    if (rooms[roomCode] && rooms[roomCode][nickname]) {
        const currentTurnPlayer = rooms[roomCode][nickname].turn;
        console.log(`Current turn in room ${roomCode} belongs to ${currentTurnPlayer}`);
        return currentTurnPlayer;
    } else {
        console.error(`Room ${roomCode} or player ${nickname} not found`);
        return null;
    }
};


const switchTurn = (roomCode, nickname) => {
    const players = Object.keys(rooms[roomCode]);

    // Получаем текущего игрока, который ходит
    const currentTurnPlayer = rooms[roomCode][nickname].turn;

    // Определяем, кто из игроков не ходит
    const nextTurnPlayer = players.find(player => player !== currentTurnPlayer);

    // Переключаем ход на другого игрока
    rooms[roomCode][nickname].turn = nextTurnPlayer;

    console.log(`Turn switched in room ${roomCode}. Now it's ${nextTurnPlayer}'s turn.`);
    return nextTurnPlayer
};

const shoot = (row, col, roomCode, playerNickname) => {
    const room = rooms[roomCode];

    if (!room) {
        console.error(`Room with code ${roomCode} not found.`);
        return null;
    }

    const opponentNickname = Object.keys(room).find(player => player !== playerNickname);

    if (!opponentNickname) {
        console.error('Opponent not found.');
        return null;
    }

    const opponentBoard = room[opponentNickname].board;
    const playerVisibleOpponentBoard = room[playerNickname].visibleOpponentBoard;

    const cellValue = opponentBoard[row][col];

    let hitStatus;
    if (cellValue === 0 || cellValue === 2) {
        // Промах
        opponentBoard[row][col] = 3;
        playerVisibleOpponentBoard[row][col] = 3;
        hitStatus = 'miss';
    } else if (cellValue === 1) {
        // Попадание
        opponentBoard[row][col] = 4;
        playerVisibleOpponentBoard[row][col] = 4;
        hitStatus = 'hit';
    } else {
        console.log(`Invalid shot: Cell already shot at (${row}, ${col}).`);
        return null;
    }

    const nextTurn = hitStatus === 'hit' ? playerNickname : opponentNickname;

    return {
        shooterNickname: playerNickname,
        opponentNickname,
        row,
        col,
        hitStatus,
        nextTurn
    };
};

const getRoom = (roomCode) => {
    if (rooms[roomCode]) {
        return rooms[roomCode];
    } else {
        console.error(`Room with code ${roomCode} not found.`);
        return null;
    }
};


module.exports = {
    playerConnections,
    createRoom,
    joinRoom,
    updateBoard,
    updatePlayerReadyStatus,
    getBoard,
    attemptReconnect,
    getGameStage,
    getPlayers,
    getCurrentTurn,
    updateVisibleOpponentBoard,
    shoot,
    getRoom  // Add the getRoom function here
};
