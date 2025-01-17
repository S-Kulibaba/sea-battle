import { switchTurn, rooms } from "../src/gameLogic";

describe("switchTurn", () => {
  beforeEach(() => {
    // Clear the rooms object before each test
    Object.keys(rooms).forEach((key) => delete rooms[key]);
  });

  test("should switch turn to another player correctly", () => {
    // Arrange
    const roomCode = "1234";
    const player1 = "Alice";
    const player2 = "Bob";

    rooms[roomCode] = {
      [player1]: {
        turn: player1,
        board: null,
        token: null,
        ready: false,
        gameStage: "battle",
      },
      [player2]: {
        turn: player1,
        board: null,
        token: null,
        ready: false,
        gameStage: "battle",
      },
    };

    // Act
    const nextPlayer = switchTurn(roomCode, player1);

    // Assert
    expect(nextPlayer).toBe(player2);
    expect(rooms[roomCode][player1].turn).toBe(player2);
  });

  test("should switch turn back to first player", () => {
    // Arrange
    const roomCode = "1234";
    const player1 = "Alice";
    const player2 = "Bob";

    rooms[roomCode] = {
      [player1]: {
        turn: player2,
        board: null,
        token: null,
        ready: false,
        gameStage: "battle",
      },
      [player2]: {
        turn: player2,
        board: null,
        token: null,
        ready: false,
        gameStage: "battle",
      },
    };

    // Act
    const nextPlayer = switchTurn(roomCode, player2);

    // Assert
    expect(nextPlayer).toBe(player1);
    expect(rooms[roomCode][player2].turn).toBe(player1);
  });

  test("should handle non-existent room", () => {
    // Arrange
    const roomCode = "nonexistent";
    const player = "Alice";

    // Act & Assert
    expect(() => switchTurn(roomCode, player)).toThrow(
      "Cannot convert undefined or null to object"
    );
  });

  test("should return null for room with single player", () => {
    // Arrange
    const roomCode = "1234";
    const player1 = "Alice";

    rooms[roomCode] = {
      [player1]: {
        turn: player1,
        board: null,
        token: null,
        ready: false,
        gameStage: "battle",
      },
    };

    // Act
    const nextPlayer = switchTurn(roomCode, player1);

    // Assert
    expect(nextPlayer).toBeNull();
    expect(rooms[roomCode][player1].turn).toBe(player1); // значение turn не должно меняться
  });
});
