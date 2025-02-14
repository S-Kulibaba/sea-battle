import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { connectToServer, sendMessage, addOnMessageCallback } from "../socket";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next"; // Импортируем хук useTranslation

const CreateGame = () => {
    const { t } = useTranslation(); // Используем хук для перевода
    const [copied, setCopied] = useState(false);
    const [roomCode, setRoomCode] = useState('');  // Изначально код пустой
    const navigate = useNavigate();

    // Подключение к серверу при монтировании компонента
    useEffect(() => {
        const storedNickname = Cookies.get('nickname');
        
        connectToServer()
            .then(() => {
                // После подключения отправляем запрос на создание комнаты
                sendMessage({ type: 'createRoom', nickname: storedNickname });
            })
            .catch((error) => {
                console.error("Failed to connect to server:", error);
            });

        // Обработка входящих сообщений о коде комнаты и статусе игры
        const handleMessage = (data) => {
            if (data.type === 'roomCode') {
                setRoomCode(data.roomCode);  // Устанавливаем код комнаты по получению
            }

            if (data.type === 'gameStart' && data.token) {
                console.log('Navigating to game with room code: ', data.roomCode, "token", data.token);
                Cookies.set('token', data.token, { expires: 7 }); // Устанавливаем куки на 7 дней
                Cookies.set('roomCode', data.roomCode, { expires: 7 });
                navigate(`/game/${data.roomCode}`);
            }
        };

        // Устанавливаем обработчик сообщений
        addOnMessageCallback(handleMessage);

    }, [navigate]);

    const copyCode = () => {
        const textArea = document.createElement("textarea");
        textArea.value = roomCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
    
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const goBack = () => {
        navigate('/');
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center">
            <h1 className="font-fo uppercase fw-400 text-4xl mb-[20px]">{t('sea_battle')}</h1>
            <div className="w-[480px] h-[240px] border border-black rounded-[10px] flex justify-center relative">
                <div className="flex flex-col items-center justify-center">
                    <i className="fa-solid fa-arrow-left fa-black fa-xl m-[20px] cursor-pointer absolute top-0 left-[10px]" onClick={goBack}></i>
                    <div className="h-[90%] flex flex-col items-center justify-center relative">
                        <h2 className="font-fo uppercase fw-400 text-xl">
                            {t('game_created')}
                        </h2>
                        <div className="flex cursor-pointer" onClick={copyCode}>
                            <span className="font-fo uppercase fw-400 text-3xl mt-[40px] falling-number">
                                {roomCode || t('waiting_room_code')}
                            </span>
                        </div>
                        {copied && <p className="text-green-500 font-fo absolute bottom-0">{t('copied')}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateGame;