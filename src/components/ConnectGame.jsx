import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectToServer, closeConnection } from "../socket";
import Cookies from "js-cookie";

const ConnectGame = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [code, setCode] = useState("");
    const navigate = useNavigate();

    const handleConnectClick = () => {
        const nickname = Cookies.get('nickname');  // Предположим, что никнейм уже сохранен в локальном хранилище

        if (code.trim() === "" || !nickname) {
            setError(true);
            return;
        }

        setLoading(true);
        setError(false);

        // Подключаемся к серверу и отправляем запрос на присоединение к комнате
        connectToServer(nickname, (roomCode, token) => {
            if (roomCode === code && token) {
                console.log('token', token);
                Cookies.set('token', token, { expires: 7 }); // Устанавливаем куки на 7 дней
                Cookies.set('roomCode', roomCode, { expires: 7 });
                // Если сервер успешно подключил к комнате, перенаправляем пользователя
                navigate(`/game/${roomCode}`);
            } else {
                // Если подключение не удалось, выводим ошибку
                setLoading(false);
                setError(true);
            }
        }, code);  // Передаем код комнаты в функцию подключения
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
                    <div className="h-[90%] flex flex-col items-center justify-center">
                        {loading ? (
                            <div className="loader" role="status"></div>
                        ) : (
                            <>
                                <input
                                    className={`w-[117px] h-[50px] text-center font-fo text-2xl border ${error ? 'border-red-500' : 'border-black'} rounded-[50px]`}
                                    type="text"
                                    placeholder="Code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                />
                                {error && <p className="text-red-500 font-fo mt-2">Connection failed. Please try again.</p>}
                            </>
                        )}
                        <button
                            className={`h-[47px] w-[117px] ${error ? 'mt-[15px]' : 'mt-[40px]'} font-fo btn`}
                            onClick={handleConnectClick}
                            disabled={loading} // Отключаем кнопку при загрузке
                        >
                            Connect!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectGame;
