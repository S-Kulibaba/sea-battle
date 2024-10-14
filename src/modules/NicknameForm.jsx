import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const NicknameForm = ({ onSave }) => {
  const { t } = useTranslation(); // Подключаем хук для переводов
  const [nickname, setNickname] = useState('');

  const handleSave = () => {
    if (nickname.trim()) {
      onSave(nickname);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="font-fo text-2xl mb-[10px]">{t('enter_nickname')}</h2>
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="h-[40px] w-[200px] border rounded-[5px] mb-[10px] px-[10px]"
        placeholder={t('placeholder_nickname')}
      />
      <button
        onClick={handleSave}
        className="h-[40px] w-[100px] font-fo btn"
      >
        {t('save')}
      </button>
    </div>
  );
};

export default NicknameForm;
