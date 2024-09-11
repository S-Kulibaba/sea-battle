let socket;

export const connectToServer = (onRoomCodeReceived) => {
    socket = new WebSocket('ws://localhost:8080'); // Адрес сервера WebSocket

    socket.onopen = () => {
        console.log('Connected to the server');
    };

    socket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.type === 'roomCode') {
            onRoomCodeReceived(data.roomCode);  // Передаем сгенерированный код обратно в компонент
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
