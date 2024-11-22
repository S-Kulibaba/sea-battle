const WebSocket = require('ws');
const cron = require('node-cron');

// Объект для хранения всех комнат
const rooms = {};

// Объект для хранения WebSocket соединений каждого игрока
const playerConnections = {};

// Функция для генерации случайного кода комнаты
const generateRoomCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
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

// Add a new property to store last activity time for each player in a room
const updateLastActivity = (roomCode, nickname) => {
    if (rooms[roomCode] && rooms[roomCode][nickname]) {
        rooms[roomCode][nickname].lastActivity = Date.now();
    }
};

// Modify existing functions to update last activity
const wrapWithActivityUpdate = (func) => {
    return (roomCode, nickname, ...args) => {
        const result = func(roomCode, nickname, ...args);
        updateLastActivity(roomCode, nickname);
        return result;
    };
};

// Function to clean up inactive rooms
const cleanupInactiveRooms = () => {
    const now = Date.now();
    const inactivityThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds

    Object.keys(rooms).forEach(roomCode => {
        const room = rooms[roomCode];
        const players = Object.keys(room);
        
        const allInactive = players.every(player => 
            now - room[player].lastActivity > inactivityThreshold
        );

        if (allInactive) {
            console.log(`Removing inactive room: ${roomCode}`);
            delete rooms[roomCode];
            delete playerConnections[roomCode];
        }
    });
};

// Schedule the cleanup task to run every 5 minutes
cron.schedule('*/5 * * * *', cleanupInactiveRooms);

// Функция для создания новой комнаты
const createRoom = (nickname, ws) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
        [nickname]: { 
            token: null, 
            board: null, 
            visibleOpponentBoard: Array(10).fill().map(() => Array(10).fill(0)),
            ready: false, 
            gameStage: 'placing',
            lastActivity: Date.now() 
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
                gameStage: 'placing',
                lastActivity: Date.now() 
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

const startGame = (roomCode) => {
    const players = Object.keys(rooms[roomCode]);
    const token = generateRandomToken();

    // Устанавливаем токен для каждого игрока
    players.forEach(player => {
        rooms[roomCode][player].token = token;
    });

    const firstPlayer = chooseFirstPlayer(players);

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
        
        if (board) {
            rooms[roomCode][nickname].gameStage = 'battle';
            console.log(`Game stage for ${nickname} in room ${roomCode} set to battle`);
        }
        
        console.log(`Sending board for ${nickname} in room ${roomCode}:`);
        const ships = detectShips(board);
        console.log(`Detected ships for ${nickname}:`, ships);
        
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
    if (rooms[roomCode] && rooms[roomCode][nickname]) {
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
    const currentTurnPlayer = rooms[roomCode][nickname].turn;
    const nextTurnPlayer = players.find(player => player !== currentTurnPlayer);
    rooms[roomCode][nickname].turn = nextTurnPlayer;
    console.log(`Turn switched in room ${roomCode}. Now it's ${nextTurnPlayer}'s turn.`);
    return nextTurnPlayer;
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
        opponentBoard[row][col] = 3;  // Mark as missed shot
        playerVisibleOpponentBoard[row][col] = 3;
        hitStatus = 'miss';
    } else if (cellValue === 1) {
        opponentBoard[row][col] = 4;  // Mark as hit ship
        playerVisibleOpponentBoard[row][col] = 4;
        hitStatus = 'hit';
    } else {
        console.log(`Invalid shot: Cell already shot at (${row}, ${col}).`);
        return null;
    }

    // Check if opponent has any ships left
    const opponentHasShips = opponentBoard.some(row => row.includes(1));

    if (!opponentHasShips) {
        // No ships left, the player has won
        console.log(`Player ${playerNickname} has won!`);
        return {
            shooterNickname: playerNickname,
            opponentNickname,
            row,
            col,
            hitStatus,
            nextTurn: null,  // Game ends, no next turn
            winner: playerNickname,
            loser: opponentNickname
        };
    }

    // If there are still ships left, continue the game
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

// Wrap functions with activity update
const wrappedJoinRoom = wrapWithActivityUpdate(joinRoom);
const wrappedUpdateBoard = wrapWithActivityUpdate(updateBoard);
const wrappedUpdatePlayerReadyStatus = wrapWithActivityUpdate(updatePlayerReadyStatus);
const wrappedGetBoard = wrapWithActivityUpdate(getBoard);
const wrappedAttemptReconnect = wrapWithActivityUpdate(attemptReconnect);
const wrappedGetGameStage = wrapWithActivityUpdate(getGameStage);
const wrappedUpdateVisibleOpponentBoard = wrapWithActivityUpdate(updateVisibleOpponentBoard);
const wrappedGetCurrentTurn = wrapWithActivityUpdate(getCurrentTurn);
const wrappedShoot = wrapWithActivityUpdate(shoot);

module.exports = {
    playerConnections,
    createRoom,
    joinRoom: wrappedJoinRoom,
    updateBoard: wrappedUpdateBoard,
    updatePlayerReadyStatus: wrappedUpdatePlayerReadyStatus,
    getBoard: wrappedGetBoard,
    attemptReconnect: wrappedAttemptReconnect,
    getGameStage: wrappedGetGameStage,
    getPlayers,
    getCurrentTurn: wrappedGetCurrentTurn,
    updateVisibleOpponentBoard: wrappedUpdateVisibleOpponentBoard,
    shoot: wrappedShoot,
    getRoom
};