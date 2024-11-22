import Cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';

export const GameOverModule = ({ result }) => {
  const { t } = useTranslation();
  const nickname = Cookies.get('nickname');
  const isWinner = result.winner === nickname;

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <h1 className="font-fo uppercase fw-400 text-4xl mb-[20px]">
        {t(isWinner ? 'win' : 'lose')}
      </h1>
      <div className="w-[480px] h-[240px] border border-black rounded-[10px] flex flex-col items-center justify-center space-y-6 relative">
        <p className="text-center font-fo text-xl">
          {t(isWinner ? 'win_message' : 'lose_message')}
        </p>
        <button
          onClick={() => (window.location.href = '/')}
          className="h-[47px] w-[117px] font-fo btn"
        >
          {t('back_to_menu')}
        </button>
      </div>
    </div>
  );
};
