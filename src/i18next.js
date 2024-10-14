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
            "sea_battle": "Sea Battle!",
            "enter_code": "Code",
            "connection_failed": "Connection failed. Please try again.",
            "connect": "Connect!",
            "sea_battle": "Sea Battle!",
            "game_created": "Perfect! Your game is created!",
            "waiting_room_code": "Waiting for room code...",
            "copied": "Copied!",
            "sea_battle": "Sea Battle!",
            "create_game": "Create Game",
            "connect_game": "Connect Game"
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
        "ship_battleship": "Линкор",
        "ship_cruiser": "Крейсер",
        "ship_destroyer": "Эсминец",
        "ready": "Готов!",
        "enter_nickname": "Введите ваш никнейм",
        "placeholder_nickname": "Ваш никнейм",
        "save": "Сохранить",
        "sea_battle": "Морской бой!",
        "enter_code": "Код",
        "connection_failed": "Не удалось подключиться. Пожалуйста, попробуйте снова.",
        "connect": "Подключиться!",
        "sea_battle": "Морской бой!",
        "game_created": "Отлично! Ваша игра создана!",
        "waiting_room_code": "Ожидаем код комнаты...",
        "copied": "Скопировано!",
        "sea_battle": "Морской бой!",
        "create_game": "Создать игру",
        "connect_game": "Подключиться"
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
