import React, { useState, useEffect } from 'react';
import ShipPlacement from '../modules/ShipPlacement';
import BattleModule from '../modules/BattleModule';
import { GameOverModule } from '../modules/GameOverModule';
import { connectToServer, getConnectionStatus, addOnMessageCallback, closeConnection, sendMessage, setOnDisconnectCallback } from '../socket';
import { useParams } from 'react-router-dom';
import Cookies from 'js-cookie';

const Game = () => {
  const { code } = useParams();
  const [roomCode, setRoomCode] = useState(code || null);
  const [isConnected, setIsConnected] = useState(getConnectionStatus());
  const [gameStage, setGameStage] = useState('placing');
  const [playerNicknames, setPlayerNicknames] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [gameOverData, setGameOverData] = useState(null); // Добавлено для хранения данных о завершении игры

  const nickname = Cookies.get('nickname');
  const token = Cookies.get('token');

  useEffect(() => {
    const maxReconnectAttempts = 5;
    const reconnectDelay = 2000;

    const setupConnection = async () => {
      try {
        await connectToServer();
        sendMessage({
          type: 'attemptReconnect',
          nickname,
          roomCode: code,
          token,
        });
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        
        // Запрос текущей стадии игры после успешного подключения
        sendMessage({
          type: 'getGameStage',
          roomCode: code,
          nickname,
          token,
        });
      } catch (error) {
        console.error('Connection failed:', error);
        setConnectionError('Failed to connect to the server. Retrying...');
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            setupConnection();
          }, reconnectDelay);
        } else {
          setConnectionError('Unable to reconnect after multiple attempts.');
        }
      }
    };

    if (!isConnected && reconnectAttempts < maxReconnectAttempts) {
      setupConnection();
    }

    addOnMessageCallback((data) => {
      if (data.type === 'bothPlayersReady') {
        setPlayerNicknames(data.players);
        setGameStage('battle');
      } else if (data.type === 'gameStageData') {
        setGameStage(data.gameStage);
      } else if (data.type === 'error') {
        setConnectionError(data.message);
      } else if (data.type === 'gameOver') {
        setGameStage(data.type);
        setGameOverData({
          winner: data.winner,
          loser: data.loser,
        }); // Сохраняем данные о победителе и проигравшем
      }
    });

    setOnDisconnectCallback(() => {
      console.warn('Connection lost. Attempting to reconnect...');
      setIsConnected(false);
      setConnectionError('Connection lost. Reconnecting...');
      setupConnection();
    });

    return () => {
      if (isConnected) {
        closeConnection();
        setIsConnected(false);
      }
    };
  }, [isConnected, reconnectAttempts, code, nickname, token]);

  return (
    <div className='h-screen w-screen flex items-center justify-center'>
      {connectionError && <div className="error">{connectionError}</div>}
      {gameStage === 'placing' && !connectionError && <ShipPlacement />}
      {gameStage === 'battle' && <BattleModule />}
      {gameStage === 'gameOver' && gameOverData && (
        <GameOverModule result={gameOverData} />
      )}
    </div>
  );
};

export default Game;
