"""Game service functions for managing Sudoku game state."""

from typing import Any

import sudoku_logic


def create_game(difficulty: str = "Medium") -> tuple[list[list[int]], list[list[int]]]:
    """Generate a new Sudoku puzzle and its solution.

    Args:
        difficulty: Difficulty level: Easy, Medium, or Hard.

    Returns:
        A tuple containing the puzzle and its complete solution.

    Raises:
        ValueError: If the difficulty is not supported.
        RuntimeError: If a unique puzzle cannot be generated.
    """
    return sudoku_logic.generate_puzzle(difficulty=difficulty)


def find_hint(
    puzzle: list[list[int]],
    solution: list[list[int]],
    hinted: set[tuple[int, int]],
) -> dict[str, Any]:
    """Find the next available hint.

    A cell is eligible when it is empty in the original puzzle and
    has not already been provided as a hint.
    """
    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if puzzle[row][col] != sudoku_logic.EMPTY:
                continue

            if (row, col) in hinted:
                continue

            hinted.add((row, col))

            return {
                "row": row,
                "col": col,
                "value": solution[row][col],
            }

    return {
        "message": "There are no more hints available"
    }


def check_board(
    board: list[list[int]],
    solution: list[list[int]],
) -> list[list[int]]:
    """Return the positions where the board differs from the solution."""
    incorrect = []

    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if board[row][col] != solution[row][col]:
                incorrect.append([row, col])

    return incorrect