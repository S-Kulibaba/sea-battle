import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Языковые ресурсы
const resources = {
  en: {
    translation: {
      "sea_battle": "Sea Battle",
      "your_turn": "Your turn",
      "opponent_turn": "Opponent's turn",
      "miss": "Miss",
      "hit": "Hit",
      "nickname": "Player: {{nickname}}",
      "ship_carrier": "Carrier",
      "ship_battleship": "Battleship",
      "ship_submarine": "Submarine",
      "ship_destroyer": "Destroyer",
      "ship_patrol_boat": "Patrol Boat",
      "ready": "Ready!",
      "enter_nickname": "Enter your nickname",
      "placeholder_nickname": "Your nickname",
      "save": "Save",
      "enter_code": "Code",
      "connection_failed": "Connection failed. Please try again.",
      "connect": "Connect!",
      "game_created": "Perfect! Your game is created!",
      "waiting_room_code": "Waiting for room code...",
      "copied": "Copied!",
      "create_game": "Create Game",
      "connect_game": "Connect Game",
      "win_message": "Congratulations! You sank all opponent ships.",
      "lose_message": "All your ships have been destroyed.",
      "win": "Win!",
      "lose": "Lose!",
      "back_to_menu": "Back to menu"
    }
  },
  ru: {
    translation: {
      "sea_battle": "Морской бой",
      "your_turn": "Ваш ход",
      "opponent_turn": "Ход оппонента",
      "miss": "Промах",
      "hit": "Попадание",
      "nickname": "Игрок: {{nickname}}",
      "ship_carrier": "Авианосец",
      "ship_battleship": "Линкор",
      "ship_submarine": "Подводная лодка",
      "ship_destroyer": "Эсминец",
      "ship_patrol_boat": "Катер",
      "ready": "Готов!",
      "enter_nickname": "Введите ваш никнейм",
      "placeholder_nickname": "Ваш никнейм",
      "save": "Сохранить",
      "enter_code": "Код",
      "connection_failed": "Не удалось подключиться. Пожалуйста, попробуйте снова.",
      "connect": "Подключиться!",
      "game_created": "Отлично! Ваша игра создана!",
      "waiting_room_code": "Ожидаем код комнаты...",
      "copied": "Скопировано!",
      "create_game": "Создать игру",
      "connect_game": "Подключиться",
      "win_message": "Поздравляем! Вы потопили все корабли противника.",
      "lose_message": "Ваши корабли уничтожены.",
      "win": "Победа!",
      "lose": "Поражение!",
      "back_to_menu": "Назад в меню"
    }
  }
};

// Инициализация i18next
i18n
  .use(LanguageDetector) // Автоопределение языка
  .use(initReactI18next) // Подключение i18next к React
  .init({
    resources,
    fallbackLng: 'en', // Язык по умолчанию
    interpolation: {
      escapeValue: false, // Для безопасности (React автоматически экранирует HTML)
    }
  });

export default i18n;
