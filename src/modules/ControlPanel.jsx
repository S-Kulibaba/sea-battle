import React, { useState } from 'react';
import { shipsPreset } from '../shipsPreset';

export function ControlPanel({ setSelectedShip, ships, setShips, onReadyClick }) {
    const [remainingShips, setRemainingShips] = useState(
        shipsPreset.map(ship => ({ ...ship, remaining: ship.quantity }))
    );

    const selectShip = (shipIndex) => {
        const ship = remainingShips[shipIndex];
        if (ship.remaining > 0) {
            setSelectedShip(ship);
            const updatedShips = remainingShips.map((s, index) => 
                index === shipIndex ? { ...s, remaining: s.remaining - 1 } : s
            );
            setRemainingShips(updatedShips);
        }
    };

    return (
        <div className="flex mt-5 space-x-4">
            {remainingShips.map((ship, index) => (
                <button
                    key={ship.name}
                    className='h-[47px] w-[117px] m-[10px] font-fo btn'
                    onClick={() => selectShip(index)}
                    disabled={ship.remaining === 0}
                >
                    {ship.name} ({ship.remaining})
                </button>
            ))}
            <button
                className="h-[47px] w-[117px] m-[10px] font-fo btn"
                onClick={onReadyClick} // Используем переданную функцию
            >
                Ready!
            </button>
        </div>
    );
}