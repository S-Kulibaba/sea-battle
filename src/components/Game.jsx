import React, { useState } from "react";
import ShipPlacement from "../modules/ShipPlacement";

const Game = () => {
  // Состояние для флага отображения компонента размещения кораблей
  const [showShipPlacement, setShowShipPlacement] = useState(true); // Установите начальное значение в true или false в зависимости от ваших требований

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      {showShipPlacement && <ShipPlacement />}
    </div>
  );
};

export default Game;
