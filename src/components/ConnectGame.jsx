import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { connectToServer, sendMessage, setOnMessageCallback } from "../socket";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next"; // Импортируем хук useTranslation

const ConnectGame = () => {
    const { t } = useTranslation(); // Используем хук для перевода
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [code, setCode] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        // Устанавливаем обработчик сообщений с сервера
        const handleMessage = (data) => {
            if (data.type === 'gameStart' && data.token) {
                // Сохраняем токен и код комнаты в куки
                Cookies.set('token', data.token, { expires: 7 });
                Cookies.set('roomCode', data.roomCode, { expires: 7 });
                // Перенаправляем на страницу игры
                navigate(`/game/${data.roomCode}`);
            } else {
                // В случае ошибки или другого сообщения
                setLoading(false);
                setError(true);
            }
        };

        setOnMessageCallback(handleMessage);

        return () => {
            // Очищаем обработчик сообщений при размонтировании компонента
            setOnMessageCallback(null);
        };
    }, [navigate]);

    const handleConnectClick = () => {
        const nickname = Cookies.get('nickname');  // Предположим, что никнейм уже сохранен в куках

        if (code.trim() === "" || !nickname) {
            setError(true);
            return;
        }

        setLoading(true);
        setError(false);

        // Подключаемся к серверу
        connectToServer()
            .then(() => {
                // После успешного подключения отправляем запрос на присоединение к комнате
                sendMessage({ type: 'joinRoom', nickname, roomCode: code });
            })
            .catch(() => {
                setLoading(false);
                setError(true);
            });
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
                    <div className="h-[90%] flex flex-col items-center justify-center">
                        {loading ? (
                            <div className="loader" role="status"></div>
                        ) : (
                            <>
                                <input
                                    className={`w-[117px] h-[50px] text-center font-fo text-2xl border ${error ? 'border-red-500' : 'border-black'} rounded-[50px]`}
                                    type="text"
                                    placeholder={t('enter_code')}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                                {error && <p className="text-red-500 font-fo mt-2">{t('connection_failed')}</p>}
                            </>
                        )}
                        <button
                            className={`h-[47px] w-[117px] ${error ? 'mt-[15px]' : 'mt-[40px]'} font-fo btn`}
                            onClick={handleConnectClick}
                            disabled={loading} // Отключаем кнопку при загрузке
                        >
                            {t('connect')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectGame;