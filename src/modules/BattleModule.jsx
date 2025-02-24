import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { sendMessage, addOnMessageCallback } from "../socket";
import { useTranslation } from "react-i18next";

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const GameBoard = ({ nickname, board, isOpponent, isCurrentTurn, onCellClick }) => {
    const { t } = useTranslation();
    const getCellColor = (value) => {
        if (isOpponent) {
            switch (value) {
                case 3: return 'bg-yellow-300'; // Промах
                case 4: return 'bg-red-500';  // Попадание
                default: return '';
            }
        } else {
            switch (value) {
                case 1: return 'bg-gray-500';
                case 2: return 'bg-blue-500';
                case 3: return 'bg-yellow-300'; // Промах
                case 4: return 'bg-red-500';  // Попадание
                default: return '';
            }
        }
    };

    return (
        <div className="flex flex-col items-center">
            <h3 className="mb-2 font-bold">{t('nickname', { nickname })}</h3> {/* Перевод */}
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
                            role="button"
                            key={`${letter}${number}`}
                            className={`w-10 h-10 border border-black flex justify-center items-center ${getCellColor(board[rowIndex][colIndex])} ${isOpponent && isCurrentTurn ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                            onClick={() => isOpponent && isCurrentTurn && onCellClick(rowIndex, colIndex)}
                        ></div>
                    ))}
                </div>
            ))}
        </div>
    );
};

const BattleModule = () => {
    const { t } = useTranslation();
    const [playerNicknames, setPlayerNicknames] = useState({ current: '', opponent: '' });
    const [currentPlayerBoard, setCurrentPlayerBoard] = useState(Array(10).fill(null).map(() => Array(10).fill(0)));
    const [visibleOpponentBoard, setVisibleOpponentBoard] = useState(Array(10).fill(null).map(() => Array(10).fill(0)));
    const [currentTurn, setCurrentTurn] = useState('');
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
        } else {
            console.error('No token or room code found in cookies');
        }
    };

    const requestVisibleOpponentBoard = () => {
        const token = Cookies.get('token');
    
        if (token && roomCode && savedNickname) {
            sendMessage({
                type: 'getVisibleOpponentBoard',
                code: roomCode,
                nickname: savedNickname,
                token,
            });
        } else {
            console.error('No token, room code, or nickname found in cookies');
        }
    };

    const requestCurrentTurn = () => {
        if (savedNickname && roomCode) {
            sendMessage({
                type: 'getCurrentTurn',
                code: roomCode,
                nickname: savedNickname,
            });
        } else {
            console.error('No nickname or room code found in cookies');
        }
    };

    useEffect(() => {
        sendMessage({
            type: 'getPlayers',
            roomCode,
            nickname: savedNickname,
        });
        addOnMessageCallback(handleMessage);

        return () => addOnMessageCallback(null);
    }, [savedNickname, roomCode]);

    const handleMessage = (data) => {
        if (data.type === 'playersData') {
            const players = data.players;
            const opponentNickname = players.find(player => player !== savedNickname);
            setPlayerNicknames({ current: savedNickname, opponent: opponentNickname });
            requestBoard(savedNickname);
            requestVisibleOpponentBoard();
            requestCurrentTurn();
        } else if (data.type === 'boardData' && data.nickname === savedNickname) {
            setCurrentPlayerBoard(data.board);
        } else if (data.type === 'visibleOpponentBoardData') {
            setVisibleOpponentBoard(data.board);
        } else if (data.type === 'currentTurn') {
            setCurrentTurn(data.turn);
        } else if (data.type === 'shotResult') {
            const { shooterNickname, row, col, hitStatus, nextTurn } = data;
            
            if (shooterNickname === savedNickname) {
                // Обновляем видимую доску оппонента
                setVisibleOpponentBoard(prevBoard => {
                    const newBoard = [...prevBoard];
                    newBoard[row][col] = hitStatus === 'hit' ? 4 : 3;
                    return newBoard;
                });
            } else {
                // Обновляем свою доску
                setCurrentPlayerBoard(prevBoard => {
                    const newBoard = [...prevBoard];
                    newBoard[row][col] = hitStatus === 'hit' ? 4 : 3;
                    return newBoard;
                });
            }
            
            setCurrentTurn(nextTurn);
        }
    };

    const handleCellClick = (row, col) => {
        if (currentTurn === savedNickname) {
            sendMessage({
                type: 'shoot',
                row,
                col,
                roomCode,
                nickname: savedNickname,
            });
        }
    };


    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">{t('sea_battle')}</h2>
            <div className="mb-4">
                {currentTurn === savedNickname ? (
                    <p className="text-green-500 font-bold">{t('your_turn')}</p>
                ) : (
                    <p className="text-red-500 font-bold">{t('opponent_turn')}</p>
                )}
            </div>
            <div className="flex justify-around w-full">
                <GameBoard 
                    nickname={playerNicknames.current} 
                    board={currentPlayerBoard || Array(10).fill(null).map(() => Array(10).fill(0))}
                    isOpponent={false}
                    isCurrentTurn={currentTurn === savedNickname}
                    onCellClick={() => {}}
                />
                <GameBoard 
                    nickname={playerNicknames.opponent} 
                    board={visibleOpponentBoard}
                    isOpponent={true}
                    isCurrentTurn={currentTurn === savedNickname}
                    onCellClick={handleCellClick}
                />
            </div>
        </div>
    );
};

export default BattleModule;