const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

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
    const roomCode = generateRoomCode();  // Генерируем код комнаты
    
    // Создаем комнату с никнеймом в качестве ключа и пустым объектом в качестве значения
    rooms[roomCode] = {
        [nickname]: { token: null, board: null, ready: false }  // Добавляем поле для токена у игрока
    };

    // Сохраняем соединение для каждого игрока
    playerConnections[roomCode] = {
        [nickname]: ws
    };

    console.log(`Room created: ${roomCode} by ${nickname}`);
    console.log(rooms);  // Для отладки, чтобы увидеть структуру комнат

    return roomCode;  // Возвращаем код созданной комнаты
};

// Функция для подключения к существующей комнате
const joinRoom = (roomCode, nickname, ws) => {
    if (rooms[roomCode]) {
        // Проверяем, не существует ли уже игрока с таким никнеймом в комнате
        if (!rooms[roomCode][nickname]) {
            // Добавляем второго игрока в комнату
            rooms[roomCode][nickname] = { token: null, board: null, ready: false };

            // Сохраняем соединение для второго игрока
            playerConnections[roomCode][nickname] = ws;

            console.log(`${nickname} joined room ${roomCode}`);
            console.log(rooms);

            // Отправляем подтверждение успешного подключения
            ws.send(JSON.stringify({ type: 'joined', success: true, roomCode }));

            // Проверяем, если в комнате два игрока, начинаем игру
            if (Object.keys(rooms[roomCode]).length === 2) {
                startGame(roomCode);
            }
        } else {
            // Отправляем сообщение об ошибке, если игрок с таким ником уже есть
            ws.send(JSON.stringify({ type: 'error', message: 'Nickname already exists in the room.' }));
        }
    } else {
        // Отправляем сообщение об ошибке, если комната не найдена
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found.' }));
    }
};

// Генерируем токен
const generateRandomToken = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Функция для запуска игры, когда в комнате два игрока
const startGame = (roomCode) => {
    const players = Object.keys(rooms[roomCode]);
    const token = generateRandomToken();
    
    // Добавляем токен каждому игроку в комнате
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
            
            const playerNicknames = Object.keys(players);  // Получаем ники игроков

            Object.keys(players).forEach(player => {
                const ws = playerConnections[roomCode][player];
                if (ws) {
                    ws.send(JSON.stringify({
                        type: 'bothPlayersReady',
                        message: 'Both players are ready.',
                        roomCode: roomCode,  // Отправляем номер комнаты
                        players: playerNicknames  // Отправляем список никнеймов игроков
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

// Добавим обработку запроса доски
const getBoard = (roomCode, nickname, token) => {
    if (rooms[roomCode] && rooms[roomCode][nickname] && rooms[roomCode][nickname].token === token) {
        const board = rooms[roomCode][nickname].board;
        console.log(`Sending board for ${nickname} in room ${roomCode}:`);
        return board;
    }
    return null;
};

server.on('connection', (ws) => {
    console.log('Client connected');

    // Обработка сообщений от клиента
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'nickname') {
            console.log(`Nickname received: ${data.nickname}`);
            
            // Создаем новую комнату и получаем ее код
            const roomCode = createRoom(data.nickname, ws);
            
            // Отправляем сгенерированный код клиенту
            ws.send(JSON.stringify({ type: 'roomCode', roomCode }));
        } else if (data.type === 'joinRoom') {
            console.log(`Join room request: ${data.nickname} to room ${data.roomCode}`);
            
            // Подключаем игрока к существующей комнате
            joinRoom(data.roomCode, data.nickname, ws);
        } else if (data.type === 'boardUpdate') {
            console.log(`Board update received from ${data.nickname} in room ${data.code}`);
            const success = updateBoard(data.code, data.nickname, data.token, data.board);
            if (success) {
                ws.send(JSON.stringify({ type: 'boardUpdateConfirmation', message: 'Board updated successfully' }));
                const updateReady = updatePlayerReadyStatus(data.code, data.nickname, data.token);
                if (updateReady) {
                    ws.send(JSON.stringify({ type: 'readyConfirmation', message: 'Player is now ready' }));
                } else {
                    ws.send(JSON.stringify({ type: 'error', message: 'Failed to set player as ready. Invalid room, nickname, or token.' }));
                }
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Failed to update board. Invalid room, nickname, or token.' }));
            }
        } else if (data.type === 'getBoard') {
            console.log(`Board request received from ${data.nickname} in room ${data.code}`);
            const board = getBoard(data.code, data.nickname, data.token);
            const nickname = data.nickname
            if (board) {
                ws.send(JSON.stringify({ type: 'boardData', nickname, board }));
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Failed to retrieve board. Invalid room, nickname, or token.' }));
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
