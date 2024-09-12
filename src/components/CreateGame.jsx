import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { connectToServer  } from "../socket";

const CreateGame = () => {
    const [copied, setCopied] = useState(false);
    const [roomCode, setRoomCode] = useState('');  // Изначально код пустой
    const gameStart = false;  // Статус игры
    const navigate = useNavigate();

    // Подключение к серверу при монтировании компонента
    useEffect(() => {
        const storedNickname = localStorage.getItem('nickname');
        
        connectToServer(storedNickname, (code, token, gameStart) => {
            setRoomCode(code);  // Устанавливаем код комнаты по получению

            // Если статус игры true, делаем навигацию на страницу игры
            if (gameStart && token) {
                console.log('Navigating to game with room code: ', code, "token", token);
                localStorage.setItem('token', token);
                navigate(`/game/${code}`);
            }
        });

    }, [navigate]);

    const copyCode = () => {
        navigator.clipboard.writeText(roomCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const goBack = () => {
        navigate('/');
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center">
            <h1 className="font-fo uppercase fw-400 text-4xl mb-[20px]">Sea Battle!</h1>
            <div className="w-[480px] h-[240px] border border-black rounded-[10px] flex justify-center relative">
                <div className="flex flex-col items-center justify-center">
                    <i className="fa-solid fa-arrow-left fa-black fa-xl m-[20px] cursor-pointer absolute top-0 left-[10px]" onClick={goBack}></i>
                    <div className="h-[90%] flex flex-col items-center justify-center relative">
                        <h2 className="font-fo uppercase fw-400 text-xl">
                            Perfect! Your game is created!
                        </h2>
                        <div className="flex cursor-pointer" onClick={copyCode}>
                            <span className="font-fo uppercase fw-400 text-3xl mt-[40px] falling-number">
                                {roomCode || 'Waiting for room code...'}
                            </span>
                        </div>
                        {copied && <p className="text-green-500 font-fo absolute bottom-0">Copied!</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateGame;
