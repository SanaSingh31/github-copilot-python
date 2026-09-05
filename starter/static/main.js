const SIZE = 9;

let puzzle = [];
let solution = [];
let timerInterval = null;
let secondsElapsed = 0;
let hintsUsed = 0;
let gameCompleted = false;


// ==============================
// TIMER
// ==============================

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


function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );
}


// ==============================
// DIFFICULTY
// ==============================

function getDifficulty() {
  return document.getElementById("difficulty").value;
}


// ==============================
// SUDOKU BOARD
// ==============================

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


// ==============================
// USER INPUT / CONFLICT CHECK
// ==============================

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

    // Same row or column
    if (otherRow === row || otherCol === col) {
      return true;
    }

    // Same 3x3 block
    const sameBlock =
      Math.floor(otherRow / 3) === Math.floor(row / 3) &&
      Math.floor(otherCol / 3) === Math.floor(col / 3);

    if (sameBlock) {
      return true;
    }
  }

  return false;
}


// ==============================
// RENDER PUZZLE
// ==============================

function renderPuzzle(puz, sol) {
  puzzle = puz;
  solution = sol || [];

  createBoardElement();

  const inputs = document.querySelectorAll(".sudoku-cell");

  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;

      const input = inputs[idx];
      const value = puzzle[i][j];

      input.classList.remove(
        "prefilled",
        "hint-cell",
        "incorrect",
        "conflict-error"
      );

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


// ==============================
// NEW GAME
// ==============================

async function newGame() {
  gameCompleted = false;

  hideNameForm();

  const difficulty = getDifficulty();

  try {
    const response = await fetch(
      "/new?difficulty=" + encodeURIComponent(difficulty)
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      showMessage(
        data.error || "Unable to start a new game.",
        true
      );

      return;
    }

    puzzle = data.puzzle;
    solution = data.solution;

    renderPuzzle(data.puzzle, data.solution);

    hintsUsed = 0;

    startTimer();

    showMessage("", false);

  } catch (error) {
    console.error(error);

    showMessage(
      "Unable to connect to the server.",
      true
    );
  }
}


// ==============================
// CHECK SOLUTION
// ==============================

async function checkSolution() {
  if (gameCompleted) {
    return;
  }

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

  try {
    const response = await fetch("/check", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        board: board
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      showMessage(
        data.error || "Unable to check the solution.",
        true
      );

      return;
    }

    const incorrect = new Set(
      data.incorrect.map(
        position =>
          position[0] * SIZE + position[1]
      )
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

    // Correct solution
    if (incorrect.size === 0) {
      gameCompleted = true;

      stopTimer();

      showMessage(
        "Congratulations! You solved it!",
        false
      );

      showNameForm();

    } else {
      showMessage(
        "Some cells are incorrect.",
        true
      );
    }

  } catch (error) {
    console.error(error);

    showMessage(
      "Unable to check the solution.",
      true
    );
  }
}


// ==============================
// HINT
// ==============================

async function hint() {
  try {
    const response = await fetch("/hint", {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      showMessage(
        data.error || "Unable to provide a hint.",
        true
      );

      return;
    }

    if (data.message) {
      showMessage(data.message, false);
      return;
    }

    const inputs = document.querySelectorAll(".sudoku-cell");

    const index =
      data.row * SIZE + data.col;

    const input = inputs[index];

    if (!input) {
      showMessage(
        "Unable to find the hint cell.",
        true
      );

      return;
    }

    if (input.disabled) {
      showMessage(
        "That cell is already filled.",
        true
      );

      return;
    }

    input.value = data.value;

    input.disabled = true;

    input.classList.add("hint-cell");

    input.classList.remove(
      "incorrect",
      "conflict-error"
    );

    hintsUsed++;

    showMessage(
      "Hint used!",
      false
    );

  } catch (error) {
    console.error(error);

    showMessage(
      "Unable to connect to the server.",
      true
    );
  }
}


// ==============================
// NAME FORM
// ==============================

function showNameForm() {
  const form = document.getElementById("name-form");

  if (!form) {
    console.error("Name form not found in HTML.");
    return;
  }

  form.style.display = "block";

  const nameInput =
    document.getElementById("player-name");

  if (nameInput) {
    nameInput.value = "";
    nameInput.focus();
  }
}


function hideNameForm() {
  const form = document.getElementById("name-form");

  if (form) {
    form.style.display = "none";
  }
}


function saveScore(event) {
  event.preventDefault();

  const nameInput =
    document.getElementById("player-name");

  if (!nameInput) {
    return;
  }

  const name = nameInput.value.trim();

  if (!name) {
    showMessage(
      "Please enter your name.",
      true
    );

    nameInput.focus();

    return;
  }

  const scores = JSON.parse(
    localStorage.getItem("sudokuLeaderboard") || "[]"
  );

  scores.push({
    name: name,
    time: secondsElapsed,
    difficulty: getDifficulty(),
    hints: hintsUsed
  });

  // Fastest times first
  scores.sort((a, b) => a.time - b.time);

  // Keep only top 10
  const topScores = scores.slice(0, 10);

  localStorage.setItem(
    "sudokuLeaderboard",
    JSON.stringify(topScores)
  );

  hideNameForm();

  renderLeaderboard();

  showMessage(
    "Score saved to the leaderboard!",
    false
  );
}


// ==============================
// LEADERBOARD
// ==============================

function renderLeaderboard() {
  const body =
    document.getElementById("leaderboard-body");

  if (!body) {
    return;
  }

  body.innerHTML = "";

  const scores = JSON.parse(
    localStorage.getItem("sudokuLeaderboard") || "[]"
  );

  scores.forEach((score, index) => {
    const row = document.createElement("tr");

    const rankCell = document.createElement("td");
    rankCell.innerText = index + 1;

    const nameCell = document.createElement("td");
    nameCell.innerText = score.name;

    const timeCell = document.createElement("td");
    timeCell.innerText = formatTime(score.time);

    const difficultyCell = document.createElement("td");
    difficultyCell.innerText = score.difficulty;

    const hintsCell = document.createElement("td");
    hintsCell.innerText = score.hints;

    row.appendChild(rankCell);
    row.appendChild(nameCell);
    row.appendChild(timeCell);
    row.appendChild(difficultyCell);
    row.appendChild(hintsCell);

    body.appendChild(row);
  });
}


// ==============================
// MESSAGE
// ==============================

function showMessage(message, error) {
  const element =
    document.getElementById("message");

  if (!element) {
    return;
  }

  element.innerText = message;

  element.className =
    error
      ? "error-message"
      : "success-message";
}


// ==============================
// DARK MODE
// ==============================

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


// ==============================
// PAGE INITIALIZATION
// ==============================

window.addEventListener(
  "DOMContentLoaded",
  () => {

    document
      .getElementById("new-game")
      .addEventListener(
        "click",
        newGame
      );


    document
      .getElementById("check-solution")
      .addEventListener(
        "click",
        checkSolution
      );


    document
      .getElementById("hint")
      .addEventListener(
        "click",
        hint
      );


    document
      .getElementById("dark-mode")
      .addEventListener(
        "click",
        toggleDarkMode
      );


    // Name form submit
    const nameForm =
      document.getElementById("name-form");

    if (nameForm) {
      nameForm.addEventListener(
        "submit",
        saveScore
      );
    }


    loadDarkMode();

    renderLeaderboard();

    newGame();
  }
);