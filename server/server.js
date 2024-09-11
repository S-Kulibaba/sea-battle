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
        [nickname]: {}
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
            rooms[roomCode][nickname] = {};

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

// Функция для запуска игры, когда в комнате два игрока
const startGame = (roomCode) => {
    const players = Object.keys(rooms[roomCode]);
    
    players.forEach((player) => {
        const ws = playerConnections[roomCode][player];
        if (ws) {
            ws.send(JSON.stringify({ type: 'gameStart', message: 'Game is starting!', players, roomCode }));
        }
    });

    console.log(`Game started in room ${roomCode} with players: ${players.join(', ')}`);
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
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
