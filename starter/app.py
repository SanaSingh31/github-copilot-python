"""Flask application routes for the Sudoku game."""

from flask import Flask, jsonify, render_template, request

from services.game_service import check_board, create_game, find_hint

app = Flask(__name__)


# Store the current puzzle, solution, and cells that have already received hints.
CURRENT = {
    "puzzle": None,
    "solution": None,
    "hinted": set(),
}


@app.route("/")
def index():
    """Render the Sudoku game page."""
    return render_template("index.html")


@app.route("/new")
def new_game():
    """Create and return a new Sudoku puzzle."""
    difficulty = request.args.get("difficulty", "Medium")

    # Keep compatibility with the existing /new?clues=35 test and API.
    clues = request.args.get("clues")

    if clues is not None:
        try:
            clue_count = int(clues)
        except ValueError:
            return jsonify({"error": "clues must be a valid number"}), 400

        clue_to_difficulty = {
            45: "Easy",
            35: "Medium",
            28: "Hard",
        }

        if clue_count not in clue_to_difficulty:
            return jsonify({
                "error": "clues must be 45, 35, or 28"
            }), 400

        difficulty = clue_to_difficulty[clue_count]

    try:
        puzzle, solution = create_game(difficulty)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except RuntimeError as error:
        return jsonify({"error": str(error)}), 500

    # Store the new game.
    CURRENT["puzzle"] = puzzle
    CURRENT["solution"] = solution

    # Reset the hinted cells for the new puzzle.
    CURRENT["hinted"] = set()

    return jsonify({
        "puzzle": puzzle,
    })


@app.route("/check", methods=["POST"])
def check_solution():
    """Check the player's board against the current solution."""
    data = request.get_json()

    if not data or "board" not in data:
        return jsonify({"error": "Invalid board data"}), 400

    board = data["board"]
    solution = CURRENT.get("solution")

    if solution is None:
        return jsonify({"error": "No game in progress"}), 400

    try:
        incorrect = check_board(board, solution)
    except (IndexError, TypeError):
        return jsonify({"error": "Invalid board data"}), 400

    return jsonify({
        "incorrect": incorrect
    })


@app.route("/hint", methods=["POST"])
def get_hint():
    """Provide the next available hint for the current puzzle."""
    puzzle = CURRENT.get("puzzle")
    solution = CURRENT.get("solution")

    if puzzle is None or solution is None:
        return jsonify({"error": "No game in progress"}), 400

    hinted = CURRENT.setdefault("hinted", set())

    try:
        result = find_hint(puzzle, solution, hinted)
    except (IndexError, TypeError):
        return jsonify({"error": "Unable to provide a hint"}), 500

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)