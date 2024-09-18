import React, { useState, useEffect } from 'react';
import ShipPlacement from '../modules/ShipPlacement';
import BattleModule from '../modules/BattleModule';
import { connectToServer, getConnectionStatus, setOnMessageCallback, closeConnection, sendMessage, setOnDisconnectCallback } from '../socket';
import { useParams } from 'react-router-dom';
import Cookies from 'js-cookie';

const Game = () => {
  const { code } = useParams();  // Код комнаты из URL
  const [roomCode, setRoomCode] = useState(code || null);
  const [isConnected, setIsConnected] = useState(getConnectionStatus());
  const [showShipPlacement, setShowShipPlacement] = useState(true);
  const [showBattle, setShowBattle] = useState(false);
  const [playerNicknames, setPlayerNicknames] = useState([]);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const nickname = Cookies.get('nickname');  // Получаем никнейм из куки
  const token = Cookies.get('token');  // Получаем токен из куки

  useEffect(() => {
    const maxReconnectAttempts = 5;
    const reconnectDelay = 2000;  // Интервал между попытками переподключения (2 секунды)

    const setupConnection = async () => {
      try {
        await connectToServer();  // Подключаемся к серверу
        // После успешного подключения отправляем сообщение на реконнект
        sendMessage({
          type: 'attemptReconnect',
          nickname,
          roomCode: code,
          token,
        });
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);  // Сброс количества попыток после успешного подключения
      } catch (error) {
        console.error('Connection failed:', error);
        setConnectionError('Failed to connect to the server. Retrying...');
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            setupConnection();  // Повторная попытка подключения
          }, reconnectDelay);
        } else {
          setConnectionError('Unable to reconnect after multiple attempts.');
        }
      }
    };

    if (!isConnected && reconnectAttempts < maxReconnectAttempts) {
      setupConnection();
    }

    setOnMessageCallback((data) => {
      if (data.type === 'bothPlayersReady') {
        setPlayerNicknames(data.players);
        setShowShipPlacement(false);
        setShowBattle(true);
      } else if (data.type === 'error') {
        setConnectionError(data.message);  // Устанавливаем сообщение об ошибке
      }
    });

    setOnDisconnectCallback(() => {
      console.warn('Connection lost. Attempting to reconnect...');
      setIsConnected(false);
      setConnectionError('Connection lost. Reconnecting...');
      setupConnection();  // Попытка переподключения при потере связи
    });

    return () => {
      if (isConnected) {
        closeConnection();
        setIsConnected(false);
      }
    };
  }, [isConnected, reconnectAttempts, code, nickname, token]);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      {connectionError && <p className="text-red-500">{connectionError}</p>}
      {showShipPlacement && !connectionError && <ShipPlacement />}
      {showBattle && <BattleModule players={playerNicknames} />}
    </div>
  );
};

export default Game;