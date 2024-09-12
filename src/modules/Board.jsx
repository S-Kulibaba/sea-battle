import React from "react";

const letters = Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i));
const numbers = Array.from({ length: 10 }, (_, i) => i + 1);

const Board = ({ grid }) => {
  return (
    <div className="flex flex-col">
      {/* Строка с буквами (A-J) */}
      <div className="flex font-bold">
        <div className="w-[40px] h-[40px] border border-solid border-[#333333] flex justify-center align-center"></div>
        {letters.map((letter, index) => (
          <div key={index} className="w-[40px] h-[40px] border border-solid border-[#333333] flex justify-center align-center">{letter}</div>
        ))}
      </div>
      
      {/* Основная доска */}
      {numbers.map((number, rowIndex) => (
        <div key={rowIndex} className="flex">
          <div className="w-[40px] h-[40px] border border-solid border-[#333333] flex justify-center align-center">{number}</div>
          {grid[rowIndex].map((cell, colIndex) => (
            <div key={colIndex} className="w-[40px] h-[40px] border border-solid border-[#333333] flex justify-center align-center">{cell}</div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
