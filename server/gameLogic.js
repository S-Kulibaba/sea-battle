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
        [nickname]: { token: null, board: null, ready: false }
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
            rooms[roomCode][nickname] = { token: null, board: null, ready: false };
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

// Функция для запуска игры, когда в комнате два игрока
const startGame = (roomCode) => {
    const players = Object.keys(rooms[roomCode]);
    const token = generateRandomToken();
    players.forEach(player => {
        rooms[roomCode][player].token = token;
    });
    players.forEach((player) => {
        const ws = playerConnections[roomCode][player];
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
            console.log(`Both players in room ${roomCode} are ready.`);
            const playerNicknames = Object.keys(players);
            Object.keys(players).forEach(player => {
                const ws = playerConnections[roomCode][player];
                if (ws) {
                    ws.send(JSON.stringify({
                        type: 'bothPlayersReady',
                        message: 'Both players are ready.',
                        roomCode: roomCode,
                        players: playerNicknames
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

module.exports = {
    createRoom,
    joinRoom,
    updateBoard,
    updatePlayerReadyStatus,
    getBoard,
    attemptReconnect
};