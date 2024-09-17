let socket;
let onMessageCallback;
let isConnected = false;
let messageQueue = [];

export const connectToServer = (nickname, onRoomCodeReceived, roomCode = null) => {
    return new Promise((resolve, reject) => {
        socket = new WebSocket('ws://localhost:8080');
        
        socket.onopen = () => {
            console.log('Connected to the server');
            isConnected = true;
            
            if (roomCode) {
                sendMessage({ type: 'joinRoom', nickname, roomCode });
            } else {
                sendMessage({ type: 'nickname', nickname });
            }

            // Отправляем сообщения из очереди
            while (messageQueue.length > 0) {
                const message = messageQueue.shift();
                sendMessage(message);
            }

            resolve();
        };

        socket.onmessage = (message) => {
            const data = JSON.parse(message.data);
            switch (data.type) {
                case 'roomCode':
                    onRoomCodeReceived(data.roomCode, false);
                    break;
                case 'joined':
                    if (data.success) {
                        onRoomCodeReceived(data.roomCode, data.token);
                    }
                    break;
                case 'error':
                    console.error('Error from server: ', data.message);
                    onRoomCodeReceived(null);
                    break;
                case 'gameStart':
                    onRoomCodeReceived(data.roomCode, data.token, true);
                    break;
                case 'bothPlayersReady':  // Новый случай для обработки готовности обоих игроков
                    console.log('Both players are ready');
                    if (onMessageCallback) {
                        onMessageCallback(data);
                    }
                    break;
                case 'boardData':
                    if (onMessageCallback) {
                        onMessageCallback(data);
                    }
                    break;
                default:
                    console.warn('Unknown data type: ', data.type);
            }
            
            
            if (onMessageCallback) {
                onMessageCallback(data);
            }

            console.log('Message from server: ', message.data);
        };

        socket.onclose = () => {
            console.log('Disconnected from the server');
            isConnected = false;
        };

        socket.onerror = (error) => {
            console.error('WebSocket error: ', error);
            isConnected = false;
            reject(error);
        };
    });
};

export const sendMessage = (message) => {
    if (isConnected && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
        console.log('Message sent:', message);
    } else {
        console.log('WebSocket is not open. Queueing message:', message);
        messageQueue.push(message);
    }
};

export const setOnMessageCallback = (callback) => {
    onMessageCallback = callback;
};

export const closeConnection = () => {
    if (socket) {
        socket.close();
    }
    isConnected = false;
};

export const getConnectionStatus = () => {
    return isConnected;
};