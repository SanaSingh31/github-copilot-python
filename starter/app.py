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


if __name__ == "__main__":
    app.run(debug=True)