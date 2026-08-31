import pytest

import sudoku_logic


SIZE = sudoku_logic.SIZE
EMPTY = sudoku_logic.EMPTY


def assert_valid_complete_board(board):
    assert isinstance(board, list)
    assert len(board) == SIZE
    for row in board:
        assert isinstance(row, list)
        assert len(row) == SIZE
        assert sorted(row) == list(range(1, SIZE + 1))

    for col in range(SIZE):
        column_values = [board[row][col] for row in range(SIZE)]
        assert sorted(column_values) == list(range(1, SIZE + 1))

    for row_block in range(0, SIZE, 3):
        for col_block in range(0, SIZE, 3):
            values = []
            for row in range(row_block, row_block + 3):
                for col in range(col_block, col_block + 3):
                    values.append(board[row][col])
            assert sorted(values) == list(range(1, SIZE + 1))


def test_create_empty_board_returns_9x9_zero_grid():
    board = sudoku_logic.create_empty_board()

    assert len(board) == SIZE
    for row in board:
        assert len(row) == SIZE
        assert row == [EMPTY] * SIZE


def test_is_safe_rejects_conflicts_in_row_column_and_box():
    board = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ]

    assert sudoku_logic.is_safe(board, 0, 2, 5) is False
    assert sudoku_logic.is_safe(board, 0, 2, 1) is True
    assert sudoku_logic.is_safe(board, 2, 0, 6) is False
    assert sudoku_logic.is_safe(board, 2, 2, 2) is True


def test_fill_board_solves_empty_grid_into_valid_completed_board():
    board = sudoku_logic.create_empty_board()
    solved = sudoku_logic.fill_board(board)

    assert solved is True
    assert_valid_complete_board(board)


def test_generate_puzzle_returns_board_dimensions_and_valid_solution_structure():
    puzzle, solution = sudoku_logic.generate_puzzle(clues=35)

    assert isinstance(puzzle, list)
    assert len(puzzle) == SIZE
    assert all(len(row) == SIZE for row in puzzle)

    assert isinstance(solution, list)
    assert len(solution) == SIZE
    assert all(len(row) == SIZE for row in solution)

    assert_valid_complete_board(solution)


def test_generate_puzzle_has_expected_number_of_clues():
    for clues in (17, 25, 35, 45):
        puzzle, _ = sudoku_logic.generate_puzzle(clues=clues)
        filled_cells = sum(cell != EMPTY for row in puzzle for cell in row)
        assert filled_cells == clues


def test_generate_puzzle_produces_valid_puzzle_with_zeroes_for_blanks():
    puzzle, _ = sudoku_logic.generate_puzzle(clues=30)

    assert any(cell == EMPTY for row in puzzle for cell in row)
    assert all(0 <= value <= 9 for row in puzzle for value in row)
