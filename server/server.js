const WebSocket = require('ws');
const gameLogic = require('./gameLogic');

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'createRoom') {
            console.log(`Nickname received: ${data.nickname}`);
            const roomCode = gameLogic.createRoom(data.nickname, ws);
            ws.send(JSON.stringify({ type: 'roomCode', roomCode }));
        } else if (data.type === 'joinRoom') {
            console.log(`Join room request: ${data.nickname} to room ${data.roomCode}`);
            gameLogic.joinRoom(data.roomCode, data.nickname, ws);
        } else if (data.type === 'boardUpdate') {
            console.log(`Board update received from ${data.nickname} in room ${data.code}`);
            const success = gameLogic.updateBoard(data.code, data.nickname, data.token, data.board);
            if (success) {
                ws.send(JSON.stringify({ type: 'boardUpdateConfirmation', message: 'Board updated successfully' }));
                const updateReady = gameLogic.updatePlayerReadyStatus(data.code, data.nickname, data.token);
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
            const board = gameLogic.getBoard(data.code, data.nickname, data.token);
            const nickname = data.nickname;
            if (board) {
                ws.send(JSON.stringify({ type: 'boardData', nickname, board }));
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Failed to retrieve board. Invalid room, nickname, or token.' }));
            }
        } else if (data.type === 'attemptReconnect') {
            console.log(`Reconnect attempt from ${data.nickname} in room ${data.roomCode}`);
            const success = gameLogic.attemptReconnect(data.roomCode, data.nickname, data.token, ws);
            if (success) {
                ws.send(JSON.stringify({ type: 'reconnectSuccess', message: 'Reconnect successful', roomCode: data.roomCode, nickname: data.nickname }));
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Reconnect failed. Invalid room, nickname, or token.' }));
            }
        } else if (data.type === 'getGameStage') {
            console.log(`Game stage request from ${data.nickname} in room ${data.roomCode}`);
            const gameStage = gameLogic.getGameStage(data.roomCode, data.nickname);
            if (gameStage) {
                ws.send(JSON.stringify({ type: 'gameStageData', gameStage }));
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Failed to retrieve game stage. Invalid room or nickname.' }));
            }
        } else if (data.type === 'getPlayers') {
            console.log(`Players request from ${data.nickname} in room ${data.roomCode}`);
            const players = gameLogic.getPlayers(data.roomCode);
            if (players) {
                ws.send(JSON.stringify({ type: 'playersData', players }));
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Failed to retrieve players. Invalid room.' }));
            } 
        }  else if (data.type === 'startGame') {
            console.log(`Start game request from ${data.nickname} in room ${data.roomCode}`);
            const firstPlayer = gameLogic.determineFirstTurn(data.roomCode);
            broadcastToRoom(data.roomCode, { type: 'gameStarted', firstPlayer });
        }
        else if (data.type === 'makeShot') {
            console.log(`Shot made by ${data.nickname} in room ${data.roomCode} at (${data.x}, ${data.y})`);
            const result = gameLogic.makeShot(data.roomCode, data.nickname, data.x, data.y);
            if (result.success) {
                const gameState = gameLogic.getGameState(data.roomCode);
                broadcastToRoom(data.roomCode, { 
                    type: 'shotResult', 
                    shooter: data.nickname,
                    x: data.x,
                    y: data.y,
                    hit: result.hit,
                    currentTurn: result.currentTurn,
                    gameState
                });
            } else {
                ws.send(JSON.stringify({ type: 'error', message: result.message }));
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');