// ==========================================
// 1. CONFIGURATION DU JEU ET CALENDRIER
// ==========================================
const MAX_ATTEMPTS = 6;
const STORAGE_KEY = "sutom_daily_game";
const STREAK_KEY = "sutom_user_streak";
const STATS_KEY = "sutom_user_stats";

const START_DATE = new Date("2026-10-27");

const WORD_CALENDAR = {
"2026-10-27": "36+21=57",
"2026-10-28": "50+25-10=65",
"2026-10-29": "124+6=130",
"2026-10-30": "80/4-5=15",
"2026-10-31": "100-30+8=78",
"2026-11-01": "15+152=167",
"2026-11-02": "72/8+9=18",
"2026-11-03": "45+20-15=50",
"2026-11-04": "64/8*2=16",
"2026-11-05": "30*3-10=80",
"2026-11-06": "90/3+5=35",
"2026-11-07": "12+18*2=48",
"2026-11-08": "56/7+4=12",
"2026-11-09": "75-25+10=60",
"2026-11-10": "24*3-12=60",
"2026-11-11": "81/9+2=11",
"2026-11-12": "40+20-5=55",
"2026-11-13": "15*4-10=50",
"2026-11-14": "96/6+4=20",
"2026-11-15": "33+22-11=44",
"2026-11-16": "14*5-10=60",
"2026-11-17": "48/6+7=15",
"2026-11-18": "60-20+5=45",
"2026-11-19": "11*6+4=70",
"2026-11-20": "88/8+2=13",
"2026-11-21": "25+25-10=40",
"2026-11-22": "16*3+2=50",
"2026-11-23": "95/5-5=14",
"2026-11-24": "35+15-10=40",
"2026-11-25": "13*4+8=60",
"2026-11-26": "70/7+3=13",
"2026-11-27": "50-20+15=45",
"2026-11-28": "15*5-5=70",
"2026-11-29": "84/4+6=27",
"2026-11-30": "42+18-10=50",
"2026-12-01": "18*3-4=50",
"2026-12-02": "90/9+1=11",
"2026-12-03": "32+18-5=45",
"2026-12-04": "12*5-10=50",
"2026-12-05": "65/5+2=15",
"2026-12-06": "44-14+20=50",
"2026-12-07": "16*4-4=60",
"2026-12-08": "72/9+5=13",
"2026-12-09": "27+23-10=40",
"2026-12-10": "14*4+4=60",
"2026-12-11": "91/7-3=10",
"2026-12-12": "55-25+10=40",
"2026-12-13": "19*3-7=50",
"2026-12-14": "63/9+8=15",
"2026-12-15": "38+12-10=40",
"2026-12-16": "17*3+9=60",
"2026-12-17": "96/8-2=10",
"2026-12-18": "45-15+20=50",
"2026-12-19": "11*5+5=60",
"2026-12-20": "85/5-2=15",
"2026-12-21": "29+21-10=40",
"2026-12-22": "15*4+5=65",
"2026-12-23": "78/6-3=10",
"2026-12-24": "60-30+15=45",
"2026-12-25": "22*3-6=60",
"2026-12-26": "92/4-3=20",
"2026-12-27": "34+16-10=40",
"2026-12-28": "13*5-5=60",
"2026-12-29": "88/4-2=20",
"2026-12-30": "45+15-10=50",
"2026-12-31": "20*3-10=50"
};

const FALLBACK_WORD = "SUTOM";

const KEYBOARD_LAYOUT = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["ENTER", "+", "-", "*", "/", "=", "BACKSPACE"],
];

// ==========================================
// 2. VARIABLES D'ÉTAT GLOBALES
// ==========================================
let currentDayIndex = -1;
let SECRET_WORD = "";
let WORD_LENGTH = 0;
let currentAttempt = 0;
let currentGuess = "";
let gameOver = false;
let guessesHistory = [];
let keyStateMap = {};

// Éléments du DOM
const grid = document.getElementById("grid");
const messageEl = document.getElementById("message");
const dayNumberEl = document.getElementById("day-number");
const shareBtn = document.getElementById("share-btn");
const streakCountEl = document.getElementById("streak-count");
const keyboardEl = document.getElementById("keyboard");

// ==========================================
// 3. GESTION DES STATISTIQUES ET SÉRIE
// ==========================================
function getStats() {
  const saved = localStorage.getItem(STATS_KEY);
  if (!saved) {
    return {
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    };
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } };
  }
}

function recordGameResult(hasWon, attemptCount) {
  const { dayNumber } = getDayInfo();
  if (localStorage.getItem(`stats_recorded_${dayNumber}`)) return; // Évite d'enregistrer deux fois le même jour

  const stats = getStats();
  stats.played += 1;

  if (hasWon) {
    stats.wins += 1;
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.maxStreak) {
      stats.maxStreak = stats.currentStreak;
    }
    stats.guesses[attemptCount] = (stats.guesses[attemptCount] || 0) + 1;
  } else {
    stats.currentStreak = 0; // Réinitialise la série en cas de défaite
  }

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  localStorage.setItem(`stats_recorded_${dayNumber}`, "true");
  
  // Synchronise aussi l'ancienne clé STREAK_KEY pour la barre de titre
  localStorage.setItem(STREAK_KEY, JSON.stringify({ count: stats.currentStreak, lastDayPlayed: currentDayIndex }));

  updateStatsDisplay();
}

function updateStatsDisplay() {
  const stats = getStats();

  if (streakCountEl) streakCountEl.textContent = stats.currentStreak;

  const playedEl = document.getElementById("stat-played");
  const winrateEl = document.getElementById("stat-winrate");
  const streakEl = document.getElementById("stat-streak");
  const maxStreakEl = document.getElementById("stat-max-streak");

  if (playedEl) playedEl.textContent = stats.played;
  if (winrateEl) {
    const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
    winrateEl.textContent = `${winRate}%`;
  }
  if (streakEl) streakEl.textContent = stats.currentStreak;
  if (maxStreakEl) maxStreakEl.textContent = stats.maxStreak;

  // Histogramme
  const distContainer = document.getElementById("guess-distribution");
  if (!distContainer) return;
  distContainer.innerHTML = "";

  const maxVal = Math.max(...Object.values(stats.guesses), 1);

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const count = stats.guesses[i] || 0;
    const percentage = Math.max((count / maxVal) * 100, 7);

    const row = document.createElement("div");
    row.className = "dist-row";
    row.innerHTML = `
      <span>${i}</span>
      <div class="dist-bar-container">
        <div class="dist-bar ${count === 0 ? 'zero' : ''}" style="width: ${count === 0 ? '100%' : percentage + '%'}">
          ${count}
        </div>
      </div>
    `;
    distContainer.appendChild(row);
  }
}

// ==========================================
// 4. FONCTIONS DATES & SAUVEGARDE
// ==========================================
function getFormattedDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayInfo() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateKey = getFormattedDate(today);
  const start = new Date(START_DATE);
  start.setHours(0, 0, 0, 0);
  
  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const dayNumber = Math.max(1, diffDays + 1);

  const word = WORD_CALENDAR[dateKey] || FALLBACK_WORD;

  return { dayNumber, word, diffDays };
}

function saveGameState() {
  const gameState = {
    dayIndex: currentDayIndex,
    guesses: Array.from(grid.children)
      .slice(0, currentAttempt)
      .map(row => Array.from(row.children).map(cell => cell.textContent).join("")),
    gameOver: gameOver,
    hasWon: currentGuess === SECRET_WORD
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function loadGameState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    const gameState = JSON.parse(saved);
    if (gameState.dayIndex === currentDayIndex) {
      return gameState;
    }
  } catch (e) {
    console.error("Erreur de lecture de la sauvegarde", e);
  }
  return null;
}

// ==========================================
// 5. INITIALISATION DU JEU & CLAVIER
// ==========================================
function setupDailyGame() {
  const { dayNumber, word, diffDays } = getDayInfo();

  if (currentDayIndex === diffDays) return;

  currentDayIndex = diffDays;
  SECRET_WORD = word.toUpperCase();
  WORD_LENGTH = SECRET_WORD.length;
  currentAttempt = 0;
  currentGuess = "";
  gameOver = false;
  guessesHistory = [];
  keyStateMap = {};

  if (dayNumberEl) dayNumberEl.textContent = `n°${dayNumber}`;
  if (shareBtn) shareBtn.style.display = "none";

  initGrid();
  createKeyboard();
  setMessage("");
  updateStatsDisplay();

  const savedState = loadGameState();
  if (savedState) {
    savedState.guesses.forEach(guess => {
      currentGuess = guess;
      submitGuess(true);
    });

    if (savedState.gameOver) {
      gameOver = true;
      if (savedState.hasWon) {
        setMessage("Gagné ! 🎉");
      } else {
        setMessage(`Perdu ! Le calcul était : ${SECRET_WORD}`);
      }
      showShareButton();
    }
  }
}

function initGrid() {
  grid.innerHTML = ""; 

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const row = document.createElement("div");
    row.className = "row";
    row.style.gridTemplateColumns = `repeat(${WORD_LENGTH}, 1fr)`;

    for (let j = 0; j < WORD_LENGTH; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      row.appendChild(cell);
    }
    grid.appendChild(row);
  }
}

function createKeyboard() {
  if (!keyboardEl) return;
  keyboardEl.innerHTML = "";

  KEYBOARD_LAYOUT.forEach(rowKeys => {
    const rowEl = document.createElement("div");
    rowEl.className = "keyboard-row";

    rowKeys.forEach(key => {
      const keyBtn = document.createElement("button");
      keyBtn.className = "key";
      keyBtn.dataset.key = key;

      if (key === "ENTER") {
        keyBtn.textContent = "ENTRÉE";
        keyBtn.classList.add("key-large");
      } else if (key === "BACKSPACE") {
        keyBtn.textContent = "⌫";
        keyBtn.classList.add("key-large");
      } else {
        keyBtn.textContent = key;
      }

      keyBtn.addEventListener("click", () => handleInput(key));
      rowEl.appendChild(keyBtn);
    });

    keyboardEl.appendChild(rowEl);
  });
}

function updateKeyboardColors() {
  if (!keyboardEl) return;
  const keys = keyboardEl.querySelectorAll(".key");

  keys.forEach(keyBtn => {
    const keyVal = keyBtn.dataset.key;
    const state = keyStateMap[keyVal];

    if (state) {
      keyBtn.classList.remove("correct", "present", "absent");
      keyBtn.classList.add(state);
    }
  });
}

function updateRow() {
  setMessage("");
  const row = grid.children[currentAttempt];
  for (let i = 0; i < WORD_LENGTH; i++) {
    const cell = row.children[i];
    const prevChar = cell.textContent;
    const newChar = currentGuess[i] || "";

    cell.textContent = newChar;

    if (newChar !== "" && prevChar === "") {
      cell.classList.add("pop");
      setTimeout(() => cell.classList.remove("pop"), 100);
    }
  }
}

function triggerShake() {
  const row = grid.children[currentAttempt];
  row.classList.add("shake");
  setTimeout(() => row.classList.remove("shake"), 400);
}

// ==========================================
// 6. GESTION DES ENTRÉES & DU REPLAY
// ==========================================
function handleInput(key) {
  if (gameOver) return;

  const upperKey = key.toUpperCase();

  if (upperKey === "ENTER") {
    if (currentGuess.length === WORD_LENGTH) {
      submitGuess();
    } else {
      triggerShake();
      setMessage(`Le mot doit faire ${WORD_LENGTH} lettres !`);
    }
  } else if (upperKey === "BACKSPACE") {
    currentGuess = currentGuess.slice(0, -1);
    updateRow();
  } else if (/^[0-9+\-*/=]$/.test(upperKey) && currentGuess.length < WORD_LENGTH) {
    currentGuess += upperKey;
    updateRow();
  }
}

document.addEventListener("keydown", (e) => {
  handleInput(e.key);
});

function submitGuess(isRestoring = false) {
  const row = grid.children[currentAttempt];
  const targetLetters = SECRET_WORD.split("");
  const guessLetters = currentGuess.split("");
  const result = Array(WORD_LENGTH).fill("absent");

  // Pass 1: Bien placées (orange)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = "correct";
      targetLetters[i] = null;
    }
  }

  // Pass 2: Mal placées (vert)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] !== "correct") {
      const index = targetLetters.indexOf(guessLetters[i]);
      if (index !== -1) {
        result[i] = "present";
        targetLetters[index] = null;
      }
    }
  }

  // Application aux cases et clavier
  for (let i = 0; i < WORD_LENGTH; i++) {
    const cell = row.children[i];
    const letter = guessLetters[i];
    const status = result[i];

    cell.textContent = letter;

    if (!isRestoring) {
      setTimeout(() => {
        cell.classList.add("flip", status);
      }, i * 200);
    } else {
      cell.classList.add(status);
    }

    const currentState = keyStateMap[letter];
    if (status === "correct") {
      keyStateMap[letter] = "correct";
    } else if (status === "present" && currentState !== "correct") {
      keyStateMap[letter] = "present";
    } else if (status === "absent" && !currentState) {
      keyStateMap[letter] = "absent";
    }
  }

  const colorDelay = isRestoring ? 0 : WORD_LENGTH * 200;
  setTimeout(updateKeyboardColors, colorDelay);

  // Historique d'émojis
  const emojiMap = { correct: "🟧", present: "🟩", absent: "⬛" };
  const rowEmojis = result.map(type => emojiMap[type]).join("");
  guessesHistory.push(rowEmojis);

  // ==========================================
  // CONDITIONS DE FIN (VICTOIRE / DÉFAITE)
  // ==========================================
  if (currentGuess === SECRET_WORD) {
    gameOver = true;
    if (!isRestoring) {
      recordGameResult(true, currentAttempt + 1); // Victoire
    }

    setTimeout(() => {
      row.classList.add("win");
      if (!isRestoring) setMessage("Gagné ! 🎉");
      showShareButton();
    }, colorDelay);

  } else if (currentAttempt === MAX_ATTEMPTS - 1) {
    gameOver = true;
    if (!isRestoring) {
      recordGameResult(false, MAX_ATTEMPTS); // Défaite
    }

    setTimeout(() => {
      if (!isRestoring) setMessage(`Perdu ! Le mot était : ${SECRET_WORD}`);
      showShareButton();
    }, colorDelay);

  } else {
    currentAttempt++;
    currentGuess = "";
  }

  if (!isRestoring) {
    saveGameState();
  }
}

function setMessage(msg) {
  if (messageEl) messageEl.textContent = msg;
}

// ==========================================
// 7. PARTAGE DE SCORE
// ==========================================
function generateShareText() {
  const { dayNumber } = getDayInfo();
  const stats = getStats();
  const score = (currentGuess === SECRET_WORD) ? guessesHistory.length : "X";
  
  let text = `Mutos n°${dayNumber} ${score}/${MAX_ATTEMPTS} 📅 Série : ${stats.currentStreak} j\n\n`;
  text += guessesHistory.join("\n");
  text += `\n\nJouer : ${window.location.href}`;
  
  return text;
}

function showShareButton() {
  if (!shareBtn) return;
  shareBtn.style.display = "inline-block";
  
  shareBtn.onclick = async () => {
    const textToCopy = generateShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({ text: textToCopy });
      } catch (err) {
        // Annulé par l'utilisateur
      }
    } else if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setMessage("Score copié dans le presse-papier ! 📋");
      }).catch(() => {
        fallbackCopyTextToClipboard(textToCopy);
      });
    } else {
      fallbackCopyTextToClipboard(textToCopy);
    }
  };
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand("copy");
    setMessage("Score copié dans le presse-papier ! 📋");
  } catch (err) {
    setMessage("Erreur lors de la copie du score.");
  }
  document.body.removeChild(textArea);
}

// ==========================================
// 8. INITIALISATION DES MODALES ET DÉMARRAGE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // RÈGLES
  const rulesBtn = document.getElementById("rules-btn");
  const rulesModal = document.getElementById("rules-modal");
  const closeRules = document.getElementById("close-rules");

  if (rulesBtn && rulesModal && closeRules) {
    rulesBtn.addEventListener("click", () => rulesModal.classList.add("active"));
    closeRules.addEventListener("click", () => rulesModal.classList.remove("active"));
    window.addEventListener("click", (e) => {
      if (e.target === rulesModal) rulesModal.classList.remove("active");
    });
  }

  // STATISTIQUES
  const statsBtn = document.getElementById("stats-btn");
  const statsModal = document.getElementById("stats-modal");
  closeStats = document.getElementById("close-stats");

  if (statsBtn && statsModal && closeStats) {
    statsBtn.addEventListener("click", () => {
      updateStatsDisplay();
      statsModal.classList.add("active");
    });

    closeStats.addEventListener("click", () => statsModal.classList.remove("active"));
    window.addEventListener("click", (e) => {
      if (e.target === statsModal) statsModal.classList.remove("active");
    });
  }
});

// Lancement du jeu
setupDailyGame();
setInterval(setupDailyGame, 60000);
