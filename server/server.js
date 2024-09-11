const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

// Функция для генерации случайного кода комнаты
const generateRoomCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

server.on('connection', (ws) => {
    console.log('Client connected');
    
    // Генерируем код комнаты
    const roomCode = generateRoomCode();

    // Отправляем сгенерированный код клиенту
    ws.send(JSON.stringify({ type: 'roomCode', roomCode }));

    // Обработка сообщений от клиента (если нужно)
    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
