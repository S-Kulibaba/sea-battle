let socket;
let onMessageCallbacks = [];
let onDisconnectCallback;
let isConnected = false;
let messageQueue = [];

const SERVER_URL = process.env.REACT_APP_WS_SERVER_URL || "ws://localhost:8080";
console.log(SERVER_URL);

export const connectToServer = () => {
  return new Promise((resolve, reject) => {
    socket = new WebSocket(SERVER_URL);

    socket.onopen = () => {
      console.log("Connected to the server");
      isConnected = true;

      // Отправляем сообщения из очереди
      while (messageQueue.length > 0) {
        const message = messageQueue.shift();
        sendMessage(message);
      }

      resolve();
    };

    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);

      for (let i = 0; i < onMessageCallbacks.length; i++) {
        onMessageCallbacks[i](data);
      }
      // if (onMessageCallbacks.length > 0) {
      //     onMessageCallbacks(data);
      // }
      console.log("Message from server: ", message.data);
    };

    socket.onclose = () => {
      console.log("Disconnected from the server");
      isConnected = false;
    };

    socket.onerror = (error) => {
      console.error("WebSocket error: ", error);
      isConnected = false;
      reject(error);
    };
  });
};

export const sendMessage = (message) => {
  if (isConnected && socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
    console.log("Message sent:", message);
  } else {
    console.log("WebSocket is not open. Queueing message:", message);
    messageQueue.push(message);
  }
};

export const addOnMessageCallback = (callback) => {
  if (callback != null) {
    onMessageCallbacks.push(callback);
  }
};

export const setOnDisconnectCallback = (callback) => {
  onDisconnectCallback = callback;
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
