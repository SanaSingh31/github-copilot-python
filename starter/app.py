from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Keep the current puzzle and its solution in memory.
CURRENT = {
    "puzzle": None,
    "solution": None,
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

    CURRENT["puzzle"] = puzzle
    CURRENT["solution"] = solution

    return jsonify({"puzzle": puzzle})


@app.route("/check", methods=["POST"])
def check_solution():
    data = request.get_json()
    board = data.get("board")
    solution = CURRENT.get("solution")

    if solution is None:
        return jsonify({"error": "No game in progress"}), 400

    incorrect = []

    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if board[row][col] != solution[row][col]:
                incorrect.append([row, col])

    return jsonify({"incorrect": incorrect})


@app.route("/hint", methods=["POST"])
def get_hint():
    puzzle = CURRENT.get("puzzle")
    solution = CURRENT.get("solution")

    if puzzle is None or solution is None:
        return jsonify({"error": "No game in progress"}), 400

    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            if puzzle[row][col] == sudoku_logic.EMPTY:
                value = solution[row][col]

                # Mark the hinted cell as filled in the current puzzle
                puzzle[row][col] = value

                return jsonify({
                    "row": row,
                    "col": col,
                    "value": value,
                })

    return jsonify({"message": "There are no empty cells left"})


if __name__ == "__main__":
    app.run(debug=True)