const WebSocket = require("ws");
const https = require("https");
const fs = require("fs");
const gameLogic = require("./src/gameLogic");

// Создаём самоподписанный сертификат или используем существующий
const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

// Создаём HTTP сервер с SSL
// const httpsServer = https.createServer(options);

// Создаём WS сервер без SSL для локальной разработки
const wsServer = new WebSocket.Server({ port: 8443 });

// Создаём WSS сервер с SSL
// const wssServer = new WebSocket.Server({
//   server: httpsServer,
// });

// Запускаем HTTPS сервер на порту 8443
// httpsServer.listen(8443);

// Функция для обработки соединений - одинаковая для обоих серверов
function handleConnection(ws) {
  console.log("Client connected");

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "createRoom") {
      console.log(`Nickname received: ${data.nickname}`);
      const roomCode = gameLogic.createRoom(data.nickname, ws);
      ws.send(JSON.stringify({ type: "roomCode", roomCode }));
    } else if (data.type === "joinRoom") {
      console.log(
        `Join room request: ${data.nickname} to room ${data.roomCode}`
      );
      gameLogic.joinRoom(data.roomCode, data.nickname, ws);
    } else if (data.type === "boardUpdate") {
      console.log(
        `Board update received from ${data.nickname} in room ${data.code}`
      );
      const success = gameLogic.updateBoard(
        data.code,
        data.nickname,
        data.token,
        data.board
      );
      if (success) {
        ws.send(
          JSON.stringify({
            type: "boardUpdateConfirmation",
            message: "Board updated successfully",
          })
        );
        const updateReady = gameLogic.updatePlayerReadyStatus(
          data.code,
          data.nickname,
          data.token
        );
        if (updateReady) {
          ws.send(
            JSON.stringify({
              type: "readyConfirmation",
              message: "Player is now ready",
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              type: "error",
              message:
                "Failed to set player as ready. Invalid room, nickname, or token.",
            })
          );
        }
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              "Failed to update board. Invalid room, nickname, or token.",
          })
        );
      }
    } else if (data.type === "getBoard") {
      console.log(
        `Board request received from ${data.nickname} in room ${data.code}`
      );
      const board = gameLogic.getBoard(data.code, data.nickname, data.token);
      const nickname = data.nickname;
      if (board) {
        ws.send(JSON.stringify({ type: "boardData", nickname, board }));
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              "Failed to retrieve board. Invalid room, nickname, or token.",
          })
        );
      }
    } else if (data.type === "attemptReconnect") {
      console.log(
        `Reconnect attempt from ${data.nickname} in room ${data.roomCode}`
      );
      const success = gameLogic.attemptReconnect(
        data.roomCode,
        data.nickname,
        data.token,
        ws
      );
      if (success) {
        ws.send(
          JSON.stringify({
            type: "reconnectSuccess",
            message: "Reconnect successful",
            roomCode: data.roomCode,
            nickname: data.nickname,
          })
        );
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Reconnect failed. Invalid room, nickname, or token.",
          })
        );
      }
    } else if (data.type === "getGameStage") {
      console.log(
        `Game stage request from ${data.nickname} in room ${data.roomCode}`
      );
      const gameStage = gameLogic.getGameStage(data.roomCode, data.nickname);
      if (gameStage) {
        ws.send(JSON.stringify({ type: "gameStageData", gameStage }));
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Failed to retrieve game stage. Invalid room or nickname.",
          })
        );
      }
    } else if (data.type === "getPlayers") {
      console.log(
        `Players request from ${data.nickname} in room ${data.roomCode}`
      );
      const players = gameLogic.getPlayers(data.roomCode);
      if (players) {
        ws.send(JSON.stringify({ type: "playersData", players }));
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Failed to retrieve players. Invalid room.",
          })
        );
      }
    } else if (data.type === "startGame") {
      console.log(
        `Start game request from ${data.nickname} in room ${data.roomCode}`
      );
      const firstPlayer = gameLogic.determineFirstTurn(data.roomCode);
      broadcastToRoom(data.roomCode, { type: "gameStarted", firstPlayer });
    } else if (data.type === "sendOpponentBoard") {
      const visibleOpponentBoard = gameLogic.updateVisibleOpponentBoard(
        data.roomCode,
        data.nickname,
        data.opponentBoard
      );
      if (visibleOpponentBoard) {
        ws.send(
          JSON.stringify({
            type: "opponentBoardInit",
            message: "Opponent's board added successfully!",
          })
        );
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Something went wrong with opponent board",
            data,
          })
        );
      }
    } else if (data.type === "getCurrentTurn") {
      const currentTurn = gameLogic.getCurrentTurn(data.code, data.nickname);
      if (currentTurn) {
        ws.send(JSON.stringify({ type: "currentTurn", turn: currentTurn }));
      }
    } else if (data.type === "shoot") {
      console.log("Shooting:", data);

      const shootResult = gameLogic.shoot(
        data.row,
        data.col,
        data.roomCode,
        data.nickname
      );

      if (shootResult) {
        const room = gameLogic.getRoom(data.roomCode);

        if (room) {
          const playerNicknames = Object.keys(room);
          const opponentNickname = playerNicknames.find(
            (player) => player !== shootResult.shooterNickname
          );
          const opponentBoard = room[opponentNickname].board;
          const remainingShips = opponentBoard.flat().includes(1);

          if (!remainingShips) {
            playerNicknames.forEach((player) => {
              const playerWs =
                gameLogic.playerConnections[data.roomCode][player];
              if (playerWs) {
                const message = {
                  type: "gameOver",
                  winner: shootResult.shooterNickname,
                  loser: opponentNickname,
                };
                playerWs.send(JSON.stringify(message));
              }
            });
          } else {
            playerNicknames.forEach((player) => {
              const playerWs =
                gameLogic.playerConnections[data.roomCode][player];
              if (playerWs) {
                const message = {
                  type: "shotResult",
                  shooterNickname: shootResult.shooterNickname,
                  row: shootResult.row,
                  col: shootResult.col,
                  hitStatus: shootResult.hitStatus,
                  nextTurn: shootResult.nextTurn,
                };
                playerWs.send(JSON.stringify(message));
              } else {
                console.error(
                  `Socket not found for player ${player} in room ${data.roomCode}`
                );
              }
            });
          }
        } else {
          console.error(`Room ${data.roomCode} not found`);
        }
      } else {
        console.error("Failed to process shot");
      }
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
}

// Применяем обработчик к обоим серверам
wsServer.on("connection", handleConnection);
// wssServer.on("connection", handleConnection);

console.log("WebSocket servers running on:");
console.log("ws://localhost:8080 (unsecure)");
console.log("wss://localhost:8443 (secure)");
