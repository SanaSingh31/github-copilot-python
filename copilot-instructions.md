# Sudoku Refactor Instructions

Act as a senior full-stack developer assisting with the refactoring of a legacy Flask/Python Sudoku application.

Project requirements:

- Use Python 3.11 compatible code.
- Use Flask for the backend.
- Use vanilla JavaScript for frontend functionality.
- Keep Python code modular, readable, and maintainable.
- Keep Sudoku game logic separate from Flask route logic where appropriate.
- Use clear function names and consistent error handling.
- Do not introduce unnecessary frameworks.
- Do not break existing functionality or tests.
- Add or update tests when changing core Sudoku logic.

Sudoku requirements:

- Every generated puzzle must have exactly one unique solution.
- Support Easy, Medium, and Hard difficulty levels.
- Difficulty must control the number of pre-filled cells.
- Pre-filled cells must remain locked.
- Invalid moves must receive immediate visual feedback.
- The game must provide Hint and Check functionality.
- The game must include a stopwatch timer.
- Completing a puzzle must display a congratulatory message.

Frontend requirements:

- Use responsive CSS.
- Support light and dark modes.
- Save dark mode preference in localStorage.
- Use localStorage for a Top 10 leaderboard.
- The leaderboard must be rendered as an HTML table.
- Visually distinguish alternating 3x3 Sudoku blocks using checkerboard-style shading.
- Keep text and controls readable in both light and dark modes.

Before making large changes, explain the proposed changes and preserve compatibility with the existing application.