import React, { useState, useEffect } from 'react';
import { shipsPreset } from '../shipsPreset'; // Убедитесь, что путь к модулю правильный
import { ControlPanel } from './ControlPanel';

// Создаем массивы для осей
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

// Начальное состояние поля
const initialField = Array(10).fill(null).map(() => Array(10).fill(0));

// Функция для поиска соседних ячеек и обновления их на 2
const updateNeighbors = (field, row, col) => {
    const directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0], // Right, Down, Left, Up
        [1, 1], [1, -1], [-1, 1], [-1, -1] // Diagonals
    ];

    const isInBounds = (r, c) => r >= 0 && r < 10 && c >= 0 && c < 10;

    const newField = field.map(row => row.slice()); // Клонируем поле

    // Проверяем горизонтальные и вертикальные соседи
    const horizontalDirections = [[0, 1], [0, -1]];
    const verticalDirections = [[1, 0], [-1, 0]];

    // Проверяем горизонтальные соседи
    for (const [dr, dc] of horizontalDirections) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (isInBounds(newRow, newCol) && newField[newRow][newCol] === 0) {
            newField[newRow][newCol] = 2; // Закрашиваем в голубой цвет
        }
    }

    // Проверяем вертикальные соседи
    for (const [dr, dc] of verticalDirections) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (isInBounds(newRow, newCol) && newField[newRow][newCol] === 0) {
            newField[newRow][newCol] = 2; // Закрашиваем в голубой цвет
        }
    }

    return newField;
};

const ShipPlacement = () => {
    const [field, setField] = useState(initialField);
    const [clickCount, setClickCount] = useState(0);
    const [direction, setDirection] = useState(null); // 'horizontal', 'vertical', or null
    const [selectedShip, setSelectedShip] = useState(null); // Выбранный корабль
    const [ships, setShips] = useState(
        shipsPreset.map(ship => ({ ...ship, placed: 0 }))
    ); // Массив кораблей с состоянием размещения
    const [nickname, setNickname] = useState(null); // Состояние для никнейма

    const maxClicks = selectedShip ? selectedShip.size : 0; // Максимальное количество кликов

    useEffect(() => {
        const storedNickname = localStorage.getItem('nickname');
        if (storedNickname) {
            setNickname(storedNickname);
        }
    }, [])

    useEffect(() => {
        if (clickCount >= maxClicks && maxClicks > 0) {
            // Найти все ячейки со значением 1 и обновить их соседей
            const updatedField = field.flatMap((row, rIndex) =>
                row.map((cell, cIndex) => cell === 1 ? [rIndex, cIndex] : null)
            ).filter(Boolean);

            let newField = field;
            updatedField.forEach(([row, col]) => {
                newField = updateNeighbors(newField, row, col);
            });

            setField(newField);

            // Сброс состояния после размещения корабля
            setSelectedShip(null);
            setDirection(null);
            setClickCount(0);
            
            // Обновляем состояние кораблей
            setShips(prevShips => 
                prevShips.map(ship => 
                    ship.name === selectedShip.name
                        ? { ...ship, placed: ship.placed + 1 }
                        : ship
                )
            );
        }
    }, [clickCount, maxClicks, field, selectedShip]); // Добавлены зависимости

    const handleClick = (rowIndex, colIndex) => {
        if (!selectedShip) return; // Если корабль не выбран, ничего не делаем
        if (clickCount >= maxClicks) return; // Если количество кликов достигло лимита, ничего не делаем
        if (field[rowIndex][colIndex] !== 0) return; // Проверяем, что ячейка пуста

        // Определяем направление кликов после второго клика
        if (clickCount === 1 && direction === null) {
            const [firstRow, firstCol] = JSON.parse(localStorage.getItem('firstClickCoords'));

            // Определяем направление
            const isHorizontal = rowIndex === firstRow;
            setDirection(isHorizontal ? 'horizontal' : 'vertical');
        }

        // Блокируем клики в противоположном направлении
        if (direction === 'horizontal' && rowIndex !== JSON.parse(localStorage.getItem('firstClickCoords'))[0]) return;
        if (direction === 'vertical' && colIndex !== JSON.parse(localStorage.getItem('firstClickCoords'))[1]) return;

        // Обновляем состояние поля
        const newField = field.map((row, rIndex) =>
            row.map((cell, cIndex) => 
                rIndex === rowIndex && cIndex === colIndex ? 1 : cell
            )
        );

        setField(newField);
        setClickCount(clickCount + 1);

        // Сохраняем координаты клика
        if (clickCount === 0) {
            localStorage.setItem('firstClickCoords', JSON.stringify([rowIndex, colIndex]));
        }
    };

    const handleReadyClick = () => {
        const shipsData = ships.map(ship => ({
            name: ship.name,
            remaining: ship.quantity - ship.remaining
        }));
    };

    return (
        <div className="relative mt-20 flex flex-col items-center">
            {/* Заголовки столбцов (буквы) */}
            <div className="flex">
                {/* Пустая ячейка в верхнем левом углу */}
                <div className="w-10 h-10"></div>
                {letters.map((letter) => (
                    <div key={letter} className="w-10 h-10 flex justify-center items-center font-bold">
                        {letter}
                    </div>
                ))}
            </div>

            {/* Рендерим строки */}
            {numbers.map((number, rowIndex) => (
                <div key={number} className="flex">
                    {/* Заголовок строки (цифры) */}
                    <div className="w-10 h-10 flex justify-center items-center font-bold">
                        {number}
                    </div>
                    {/* Рендерим ячейки строки */}
                    {letters.map((letter, colIndex) => (
                        <div
                            key={`${letter}${number}`}
                            className={`w-10 h-10 border border-black flex justify-center items-center ${field[rowIndex][colIndex] === 1 ? 'bg-gray-500' : field[rowIndex][colIndex] === 2 ? 'bg-blue-500' : ''}`}
                            onClick={() => handleClick(rowIndex, colIndex)}
                        >
                            {/* Здесь можно добавить функционал для кликабельности ячеек */}
                        </div>
                    ))}
                </div>
            ))}
            <ControlPanel 
                setSelectedShip={setSelectedShip}
                ships={ships}
                setShips={setShips}
                onReadyClick={handleReadyClick}
            />
        </div>
    );
};
export default ShipPlacement;
