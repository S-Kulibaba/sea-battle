import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import NicknameForm from '../modules/NicknameForm';
import { useTranslation } from 'react-i18next'; // Импортируем хук useTranslation

const MainMenu = () => {
  const { t } = useTranslation(); // Используем хук для перевода
  const [isNicknameSet, setIsNicknameSet] = useState(false);

  useEffect(() => {
    const storedNickname = Cookies.get('nickname');
    if (storedNickname) {
      setIsNicknameSet(true);
    }
  }, []);

  const handleSaveNickname = (nickname) => {
    Cookies.set('nickname', nickname, { expires: 7 }); // Устанавливаем куки на 7 дней
    setIsNicknameSet(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <h1 className="font-fo uppercase fw-400 text-4xl mb-[20px]">{t('sea_battle')}</h1>
      <div className="w-[480px] h-[240px] border border-black rounded-[10px] flex justify-center relative">
        <div className="flex flex-col items-center justify-center">
          {isNicknameSet ? (
            <div className="flex">
              <Link to="/create">
                <button className="h-[47px] w-[117px] m-[10px] font-fo btn">
                  {t('create_game')}
                </button>
              </Link>
              <Link to="/connect">
                <button className="h-[47px] w-[117px] m-[10px] font-fo btn">
                  {t('connect_game')}
                </button>
              </Link>
            </div>
          ) : (
            <NicknameForm onSave={handleSaveNickname} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
