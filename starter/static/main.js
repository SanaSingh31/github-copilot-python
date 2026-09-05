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
  const timer = document.getElementById("timer");

  if (!timer) {
    return;
  }

  const minutes = Math.floor(secondsElapsed / 60);
  const seconds = secondsElapsed % 60;

  timer.innerText =
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
  const difficulty = document.getElementById("difficulty");

  return difficulty ? difficulty.value : "Medium";
}


// ==============================
// SUDOKU BOARD
// ==============================

function createBoardElement() {
  const boardDiv = document.getElementById("sudoku-board");

  if (!boardDiv) {
    console.error("Sudoku board element was not found.");
    return;
  }

  boardDiv.innerHTML = "";

  for (let row = 0; row < SIZE; row++) {
    const rowDiv = document.createElement("div");

    rowDiv.className = "sudoku-row";

    for (let col = 0; col < SIZE; col++) {
      const input = document.createElement("input");

      input.type = "text";
      input.maxLength = 1;
      input.inputMode = "numeric";

      input.className = "sudoku-cell";

      input.dataset.row = row;
      input.dataset.col = col;

      /*
       * Alternate the nine 3x3 Sudoku blocks.
       *
       * Pattern:
       * SHADE | PLAIN | SHADE
       * PLAIN | SHADE | PLAIN
       * SHADE | PLAIN | SHADE
       *
       * This is based on the block coordinates rather
       * than the individual cell coordinates.
       */
      const boxRow = Math.floor(row / 3);
      const boxCol = Math.floor(col / 3);

      const isShaded = (boxRow + boxCol) % 2 === 0;

      input.classList.add(
        isShaded ? "box-shade" : "box-plain"
      );

      rowDiv.appendChild(input);
    }

    boardDiv.appendChild(rowDiv);
  }
}


// ==============================
// EVENT DELEGATION
// ==============================

function handleBoardInput(event) {
  const input = event.target;

  if (!input.classList.contains("sudoku-cell")) {
    return;
  }

  handleInput(input);
}


function handleInput(input) {
  if (input.disabled) {
    return;
  }

  // Allow only numbers 1-9.
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

    // Check same row.
    if (otherRow === row) {
      return true;
    }

    // Check same column.
    if (otherCol === col) {
      return true;
    }

    // Check same 3x3 block.
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

  const boardDiv = document.getElementById("sudoku-board");

  if (!boardDiv) {
    return;
  }

  // Event delegation:
  // One input listener handles all Sudoku cells.
  boardDiv.addEventListener("input", handleBoardInput);

  const inputs = boardDiv.querySelectorAll(".sudoku-cell");

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const index = row * SIZE + col;
      const input = inputs[index];
      const value = puzzle[row][col];

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
    solution = data.solution || [];

    renderPuzzle(data.puzzle, data.solution);

    hintsUsed = 0;

    startTimer();

    showMessage("", false);

  } catch (error) {
    console.error("New game error:", error);

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

  if (inputs.length !== SIZE * SIZE) {
    showMessage(
      "The Sudoku board is not ready.",
      true
    );

    return;
  }

  const board = [];

  for (let row = 0; row < SIZE; row++) {
    board[row] = [];

    for (let col = 0; col < SIZE; col++) {
      const index = row * SIZE + col;
      const value = inputs[index].value;

      board[row][col] = value ? Number(value) : 0;
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

    for (let index = 0; index < inputs.length; index++) {
      const input = inputs[index];

      if (input.disabled) {
        continue;
      }

      input.classList.remove("incorrect");

      if (incorrect.has(index)) {
        input.classList.add("incorrect");
      }
    }

    if (incorrect.size === 0) {
      gameCompleted = true;

      stopTimer();

      showMessage(
        "Congratulations! You solved the puzzle in " +
        formatTime(secondsElapsed) +
        " using " +
        hintsUsed +
        " hint(s)!",
        false
      );

      showNameForm();

    } else {
      showMessage(
        "Some cells are incorrect. Please check the highlighted cells.",
        true
      );
    }

  } catch (error) {
    console.error("Check solution error:", error);

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
  if (gameCompleted) {
    return;
  }

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

    /*
     * Keep the 3x3 block class and add the hint class.
     * CSS will preserve the block shading while visually
     * distinguishing the hinted cell.
     */
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
    console.error("Hint error:", error);

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

  let scores = [];

  try {
    scores = JSON.parse(
      localStorage.getItem("sudokuLeaderboard") || "[]"
    );

    if (!Array.isArray(scores)) {
      scores = [];
    }

  } catch (error) {
    console.error("Unable to read leaderboard:", error);
    scores = [];
  }

  scores.push({
    name: name,
    time: secondsElapsed,
    difficulty: getDifficulty(),
    hints: hintsUsed
  });

  // Fastest times first.
  scores.sort((a, b) => a.time - b.time);

  // Keep only the top 10 scores.
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

  let scores = [];

  try {
    scores = JSON.parse(
      localStorage.getItem("sudokuLeaderboard") || "[]"
    );

    if (!Array.isArray(scores)) {
      scores = [];
    }

  } catch (error) {
    console.error("Unable to read leaderboard:", error);
    scores = [];
  }

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

    const newGameButton =
      document.getElementById("new-game");

    if (newGameButton) {
      newGameButton.addEventListener(
        "click",
        newGame
      );
    }


    const checkButton =
      document.getElementById("check-solution");

    if (checkButton) {
      checkButton.addEventListener(
        "click",
        checkSolution
      );
    }


    const hintButton =
      document.getElementById("hint");

    if (hintButton) {
      hintButton.addEventListener(
        "click",
        hint
      );
    }


    const darkModeButton =
      document.getElementById("dark-mode");

    if (darkModeButton) {
      darkModeButton.addEventListener(
        "click",
        toggleDarkMode
      );
    }


    // Name form submit.
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