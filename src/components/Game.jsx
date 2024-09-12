import React, { useState } from "react";
import Board from "../modules/Board";

const emptyGrid = Array(10).fill(null).map(() => Array(10).fill(''));

const Game = () => {
  const [isEnemyBoardVisible, setEnemyBoardVisible] = useState(false);

  const toggleEnemyBoardVisibility = () => {
    setEnemyBoardVisible(!isEnemyBoardVisible);
  };

  return (
    <div>
      <h1>Морской бой</h1>
      
      {/* Доска игрока */}
      <div className="h-screen w-screen items-center flex justify-center">
        <div>
            <h2>Your desk</h2>
            <Board grid={emptyGrid} />
        </div>
        
        {/* Доска противника */}
        {isEnemyBoardVisible && (
            <div className="ml-[20px]">
                <h2>Opponent's desk</h2>
                <Board grid={emptyGrid} />
            </div>
        )}

        <button onClick={toggleEnemyBoardVisibility}>
            {isEnemyBoardVisible ? "Скрыть доску противника" : "Показать доску противника"}
        </button>
      </div>
    </div>
  );
};

export default Game;
