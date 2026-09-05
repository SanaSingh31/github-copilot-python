import copy
import random

SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True


def find_empty_cell(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col
    return None


def count_solutions(board, limit=2):
    working_board = deep_copy(board)

    def backtrack():
        empty_cell = find_empty_cell(working_board)
        if empty_cell is None:
            return 1

        row, col = empty_cell
        solution_count = 0
        for candidate in range(1, SIZE + 1):
            if not is_safe(working_board, row, col, candidate):
                continue

            working_board[row][col] = candidate
            solution_count += backtrack()
            working_board[row][col] = EMPTY

            if solution_count >= limit:
                return solution_count

        return solution_count

    return backtrack()


def remove_cells(board, clues):
    attempts = SIZE * SIZE - clues
    while attempts > 0:
        row = random.randrange(SIZE)
        col = random.randrange(SIZE)
        if board[row][col] != EMPTY:
            board[row][col] = EMPTY
            attempts -= 1


def _remove_cells_preserving_uniqueness(board, clues):
    cells = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(cells)

    for row, col in cells:
        if sum(cell != EMPTY for current_row in board for cell in current_row) <= clues:
            break

        value = board[row][col]
        board[row][col] = EMPTY
        if count_solutions(board, limit=2) != 1:
            board[row][col] = value

    filled_cells = sum(cell != EMPTY for row in board for cell in row)
    if filled_cells != clues:
        raise RuntimeError("Unable to generate a unique puzzle at this difficulty")


def generate_puzzle(clues=35, difficulty=None):
    clue_counts = {"Easy": 45, "Medium": 35, "Hard": 28}
    if difficulty is not None:
        if difficulty not in clue_counts:
            raise ValueError("difficulty must be Easy, Medium, or Hard")
        clues = clue_counts[difficulty]
    elif clues not in clue_counts.values():
        raise ValueError("clues must be 45, 35, or 28")

    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    _remove_cells_preserving_uniqueness(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution
