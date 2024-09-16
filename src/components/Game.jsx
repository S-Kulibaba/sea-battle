import React, { useState, useEffect } from "react";
import ShipPlacement from "../modules/ShipPlacement";
import BattleModule from "../modules/BattleModule";
import { setOnMessageCallback } from "../socket";

const Game = () => {
  // Состояние для флага отображения компонента размещения кораблей
  const [showShipPlacement, setShowShipPlacement] = useState(true); // Установите начальное значение в true или false в зависимости от ваших требований
  const [showBattle, setShowBattle] = useState(false)

  useEffect(() => {
    // Устанавливаем callback для получения сообщений
    setOnMessageCallback((data) => {
      if (data.type === 'bothPlayersReady') {
        // Скрываем компонент размещения кораблей, когда оба игрока готовы
        setShowShipPlacement(false);
        setShowBattle(true);
      }
    });
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      {showShipPlacement && <ShipPlacement />}
      {showBattle && <BattleModule/>}
    </div>
  );
};

export default Game;
