const SIZE = 9;

let puzzle = [];
let solution = [];
let timerInterval = null;
let secondsElapsed = 0;
let hintsUsed = 0;

function startTimer() {
  stopTimer();

  secondsElapsed = 0;
  updateTimer();

  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimer() {
  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;

  document.getElementById("timer").innerText =
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");
}

function getDifficulty() {
  return document.getElementById("difficulty").value;
}

function createBoardElement() {
  const boardDiv = document.getElementById("sudoku-board");
  boardDiv.innerHTML = "";

  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "sudoku-row";

    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement("input");

      input.type = "text";
      input.maxLength = 1;
      input.inputMode = "numeric";
      input.className = "sudoku-cell";

      input.dataset.row = i;
      input.dataset.col = j;

      if ((Math.floor(i / 3) + Math.floor(j / 3)) % 2 === 0) {
        input.classList.add("shaded-block");
      }

      input.addEventListener("input", handleInput);

      rowDiv.appendChild(input);
    }

    boardDiv.appendChild(rowDiv);
  }
}

function handleInput(event) {
  const input = event.target;

  input.value = input.value.replace(/[^1-9]/g, "");

  input.classList.remove("conflict-error");

  if (input.value === "") {
    return;
  }

  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);
  const value = Number(input.value);

  if (hasConflict(row, col, value)) {
    input.classList.add("conflict-error");
  }
}

function hasConflict(row, col, value) {
  const inputs = document.querySelectorAll(".sudoku-cell");

  for (const input of inputs) {
    const otherRow = Number(input.dataset.row);
    const otherCol = Number(input.dataset.col);

    if (otherRow === row && otherCol === col) {
      continue;
    }

    if (Number(input.value) !== value) {
      continue;
    }

    if (otherRow === row || otherCol === col) {
      return true;
    }

    const sameBlock =
      Math.floor(otherRow / 3) === Math.floor(row / 3) &&
      Math.floor(otherCol / 3) === Math.floor(col / 3);

    if (sameBlock) {
      return true;
    }
  }

  return false;
}

function renderPuzzle(puz, sol) {
  puzzle = puz;
  solution = sol;

  createBoardElement();

  const inputs = document.querySelectorAll(".sudoku-cell");

  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const input = inputs[idx];
      const value = puzzle[i][j];

      if (value !== 0) {
        input.value = value;
        input.disabled = true;
        input.classList.add("prefilled");
      } else {
        input.value = "";
        input.disabled = false;
      }
    }
  }
}

async function newGame() {
  const difficulty = getDifficulty();

  const response = await fetch(
    "/new?difficulty=" + encodeURIComponent(difficulty)
  );

  const data = await response.json();

  if (data.error) {
    showMessage(data.error, true);
    return;
  }

  puzzle = data.puzzle;
  solution = data.solution;

  renderPuzzle(data.puzzle, data.solution);

  hintsUsed = 0;
  startTimer();

  hideScoreForm();
  showMessage("", false);
}

async function checkSolution() {
  const inputs = document.querySelectorAll(".sudoku-cell");
  const board = [];

  for (let i = 0; i < SIZE; i++) {
    board[i] = [];

    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const value = inputs[idx].value;

      board[i][j] = value ? Number(value) : 0;
    }
  }

  const response = await fetch("/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ board })
  });

  const data = await response.json();

  if (data.error) {
    showMessage(data.error, true);
    return;
  }

  const incorrect = new Set(
    data.incorrect.map(position => position[0] * SIZE + position[1])
  );

  for (let idx = 0; idx < inputs.length; idx++) {
    const input = inputs[idx];

    if (input.disabled) {
      continue;
    }

    input.classList.remove("incorrect");

    if (incorrect.has(idx)) {
      input.classList.add("incorrect");
    }
  }

  if (incorrect.size === 0) {
    stopTimer();

    showMessage("Congratulations! You solved it!", false);

    showScoreForm();
  } else {
    showMessage("Some cells are incorrect.", true);
  }
}

function hint() {
  const inputs = document.querySelectorAll(".sudoku-cell");

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];

    if (!input.disabled && solution.length > 0) {
      const row = Number(input.dataset.row);
      const col = Number(input.dataset.col);

      input.value = solution[row][col];
      input.disabled = true;
      input.classList.add("hint-cell");

      hintsUsed++;
      return;
    }
  }

  showMessage(
    "Hints are available after the solution is loaded.",
    true
  );
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );
}

function showScoreForm() {
  const form = document.getElementById("score-form");
  const nameInput = document.getElementById("player-name");

  form.hidden = false;
  nameInput.focus();
}

function hideScoreForm() {
  const form = document.getElementById("score-form");
  const nameInput = document.getElementById("player-name");

  form.hidden = true;
  nameInput.value = "";
}

function saveScore(event) {
  event.preventDefault();

  const nameInput = document.getElementById("player-name");
  const name = nameInput.value.trim();

  const scores = JSON.parse(
    localStorage.getItem("sudokuLeaderboard") || "[]"
  );

  scores.push({
    name: name,
    time: secondsElapsed,
    difficulty: getDifficulty(),
    hints: hintsUsed
  });

  scores.sort((a, b) => a.time - b.time);

  localStorage.setItem(
    "sudokuLeaderboard",
    JSON.stringify(scores.slice(0, 10))
  );

  hideScoreForm();
  renderLeaderboard();
}

function renderLeaderboard() {
  const body = document.getElementById("leaderboard-body");

  body.innerHTML = "";

  const scores = JSON.parse(
    localStorage.getItem("sudokuLeaderboard") || "[]"
  );

  scores.forEach((score, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(score.name)}</td>
      <td>${formatTime(score.time)}</td>
      <td>${escapeHtml(score.difficulty)}</td>
      <td>${score.hints}</td>
    `;

    body.appendChild(row);
  });
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function showMessage(message, error) {
  const element = document.getElementById("message");

  element.innerText = message;
  element.className = error ? "error-message" : "success-message";
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");

  localStorage.setItem(
    "sudokuDarkMode",
    document.body.classList.contains("dark-mode")
  );
}

function loadDarkMode() {
  const enabled =
    localStorage.getItem("sudokuDarkMode") === "true";

  if (enabled) {
    document.body.classList.add("dark-mode");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("new-game")
    .addEventListener("click", newGame);

  document
    .getElementById("check-solution")
    .addEventListener("click", checkSolution);

  document
    .getElementById("hint")
    .addEventListener("click", hint);

  document
    .getElementById("dark-mode")
    .addEventListener("click", toggleDarkMode);

  document
    .getElementById("score-form")
    .addEventListener("submit", saveScore);

  loadDarkMode();
  renderLeaderboard();
  newGame();
});