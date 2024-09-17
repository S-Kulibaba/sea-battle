import React, { useState, useEffect } from "react";
import ShipPlacement from "../modules/ShipPlacement";
import BattleModule from "../modules/BattleModule";
import { setOnMessageCallback } from "../socket";

const Game = () => {
  // Состояние для флага отображения компонента размещения кораблей
  const [showShipPlacement, setShowShipPlacement] = useState(true);
  const [showBattle, setShowBattle] = useState(false);
  
  // Состояние для сохранения никнеймов игроков
  const [playerNicknames, setPlayerNicknames] = useState([]);

  useEffect(() => {
    // Устанавливаем callback для получения сообщений
    setOnMessageCallback((data) => {
      if (data.type === 'bothPlayersReady') {
        // Сохраняем никнеймы игроков
        setPlayerNicknames(data.players);
        
        // Скрываем компонент размещения кораблей и отображаем компонент боя
        setShowShipPlacement(false);
        setShowBattle(true);
      }
    });
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      {showShipPlacement && <ShipPlacement />}
      {showBattle && <BattleModule players={playerNicknames} />}  {/* Передаем никнеймы игроков в BattleModule */}
    </div>
  );
};

export default Game;
