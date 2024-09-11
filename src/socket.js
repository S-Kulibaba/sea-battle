let socket;

export const connectToServer = (nickname, onRoomCodeReceived, roomCode = null) => {
    socket = new WebSocket('ws://localhost:8080'); // Адрес сервера WebSocket

    socket.onopen = () => {
        console.log('Connected to the server');
        
        if (roomCode) {
            // Если передан код комнаты, отправляем запрос на подключение к комнате
            socket.send(JSON.stringify({ type: 'joinRoom', nickname, roomCode }));
        } else {
            // Если код комнаты не передан, создаем новую комнату
            socket.send(JSON.stringify({ type: 'nickname', nickname }));
        }
    };

    socket.onmessage = (message) => {
        const data = JSON.parse(message.data);

        if (data.type === 'roomCode') { // code generation
            onRoomCodeReceived(data.roomCode, false);  // Передаем сгенерированный код обратно в компонент
        } else if (data.type === 'joined' && data.success) { // player connecting
            onRoomCodeReceived(data.roomCode);  // Подтверждаем подключение к комнате
        } else if (data.type === 'error') { // erre
            console.error('Error from server: ', data.message);  // Обрабатываем ошибки
            onRoomCodeReceived(null);  // Сообщаем, что подключение не удалось
        } if (data.type === 'gameStart') { // game start
            onRoomCodeReceived(data.roomCode, true);  // Передаем код комнаты и статус игры (true)
        }

        console.log('Message from server: ', message.data);
    };

    socket.onclose = () => {
        console.log('Disconnected from the server');
    };

    socket.onerror = (error) => {
        console.error('WebSocket error: ', error);
    };
};

export const closeConnection = () => {
    if (socket) {
        socket.close();
    }
};
