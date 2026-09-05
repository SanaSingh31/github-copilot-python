from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Store the current puzzle, solution, and cells that have already received hints.
CURRENT = {
    "puzzle": None,
    "solution": None,
    "hinted": set(),
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/new")
def new_game():
    difficulty = request.args.get("difficulty", "Medium")

    try:
        puzzle, solution = sudoku_logic.generate_puzzle(
            difficulty=difficulty
        )
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    # Store the new game.
    CURRENT["puzzle"] = puzzle
    CURRENT["solution"] = solution

    # Reset the hinted cells for the new puzzle.
    CURRENT["hinted"] = set()

    return jsonify({
        "puzzle": puzzle,
        "solution": solution,
    })


@app.route("/check", methods=["POST"])
def check_solution():
    data = request.get_json()

    if not data or "board" not in data:
        return jsonify({"error": "Invalid board data"}), 400

    board = data["board"]
    solution = CURRENT.get("solution")

    if solution is None:
        return jsonify({"error": "No game in progress"}), 400

    incorrect = []

    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if board[row][col] != solution[row][col]:
                incorrect.append([row, col])

    return jsonify({
        "incorrect": incorrect
    })


@app.route("/hint", methods=["POST"])
def get_hint():
    puzzle = CURRENT.get("puzzle")
    solution = CURRENT.get("solution")

    if puzzle is None or solution is None:
        return jsonify({"error": "No game in progress"}), 400

    # Make sure the hinted set exists.
    hinted = CURRENT.setdefault("hinted", set())

    # Find the first empty cell that has not already been hinted.
    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):

            if puzzle[row][col] != sudoku_logic.EMPTY:
                continue

            if (row, col) in hinted:
                continue

            # Remember that this cell has already been given as a hint.
            hinted.add((row, col))

            return jsonify({
                "row": row,
                "col": col,
                "value": solution[row][col],
            })

    # All empty cells have already received hints.
    return jsonify({
        "message": "There are no more hints available"
    })


if __name__ == "__main__":
    app.run(debug=True)