import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { sendMessage, setOnMessageCallback } from "../socket";

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const GameBoard = ({ nickname, board, isOpponent }) => {
    const getCellColor = (value) => {
        if (isOpponent) return ''; // Для доски противника всегда возвращаем пустую строку (нет цвета)
        switch (value) {
            case 1: return 'bg-gray-500';
            case 2: return 'bg-blue-500';
            default: return '';
        }
    };

    return (
        <div className="flex flex-col items-center">
            <h3 className="mb-2 font-bold">{nickname}</h3>
            <div className="flex">
                <div className="w-10 h-10"></div>
                {letters.map((letter) => (
                    <div key={letter} className="w-10 h-10 flex justify-center items-center font-bold">
                        {letter}
                    </div>
                ))}
            </div>
            {numbers.map((number, rowIndex) => (
                <div key={number} className="flex">
                    <div className="w-10 h-10 flex justify-center items-center font-bold">
                        {number}
                    </div>
                    {letters.map((letter, colIndex) => (
                        <div
                            key={`${letter}${number}`}
                            className={`w-10 h-10 border border-black flex justify-center items-center ${getCellColor(board[rowIndex][colIndex])}`}
                        ></div>
                    ))}
                </div>
            ))}
        </div>
    );
};

const BattleModule = () => {
    const [playerNicknames, setPlayerNicknames] = useState({ current: '', opponent: '' });
    const [currentPlayerBoard, setCurrentPlayerBoard] = useState(null);
    const savedNickname = Cookies.get('nickname');
    const roomCode = Cookies.get('roomCode');

    const requestBoard = (nickname) => {
        const token = Cookies.get('token');
    
        if (token && roomCode) {
            sendMessage({
                type: 'getBoard',
                code: roomCode,
                nickname,
                token,
            });
            console.log(`Requesting board for player: ${nickname}`);
        } else {
            console.error('No token or room code found in cookies');
        }
    };

    useEffect(() => {
        // Запрашиваем список игроков в комнате
        sendMessage({
            type: 'getPlayers',
            roomCode,
            nickname: savedNickname,
        });

        setOnMessageCallback(handleMessage);

        return () => setOnMessageCallback(null);
    }, [savedNickname, roomCode]);

    const handleMessage = (data) => {
        if (data.type === 'playersData') {
            const players = data.players;
            const opponentNickname = players.find(player => player !== savedNickname);
            setPlayerNicknames({ current: savedNickname, opponent: opponentNickname });
            requestBoard(savedNickname);
        } else if (data.type === 'boardData' && data.nickname === savedNickname) {
            setCurrentPlayerBoard(data.board);
        }
    };

    // Создаем пустую доску для инициализации
    const emptyBoard = Array(10).fill(null).map(() => Array(10).fill(0));

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">Морской бой</h2>
            <div className="flex justify-around w-full">
                <GameBoard 
                    nickname={playerNicknames.current} 
                    board={currentPlayerBoard || emptyBoard}
                    isOpponent={false}
                />
                <GameBoard 
                    nickname={playerNicknames.opponent} 
                    board={emptyBoard}
                    isOpponent={true}
                />
            </div>
        </div>
    );
};

export default BattleModule;