const symbols = [
    "Trident.png",
    "statue.png",
    "Tresort.png",
    "roue.png",
    "nymphe.png",
    "dauphin.png",
    "couronne.png",
    "coquillage.png",
    "chariot.png",
    "poseidon.png"
];

const baseSymbolValues = {
    "Trident.png": 120,      // Low value
    "statue.png": 160,       // Low value
    "Tresort.png": 0,        // No value
    "roue.png": 80,          // Medium value
    "poseidon.png": 1000,    // High value (with multiplier)
    "nymphe.png": 50,        // Medium value
    "dauphin.png": 60,       // High value
    "couronne.png": 210,     // High value
    "coquillage.png": 80,    // High value
    "chariot.png": 220       // High value
};

let balance = 10000;
let lastGain = 0;
let bet = 100;
let autoSpinCount = 0;
let autoSpinInterval = null;
let currentMultiplier = 0;

const cells = document.querySelectorAll(".cell");
const balanceSpan = document.getElementById("balance");
const lastGainSpan = document.getElementById("lastGain");
const betSpan = document.getElementById("bet");
const multiplierDisplay = document.getElementById("multiplierDisplay"); // New multiplier display
const spinButton = document.getElementById("spinButton");
const increaseBetButton = document.getElementById("increaseBet");
const decreaseBetButton = document.getElementById("decreaseBet");
const gainAnimation = document.getElementById("gainAnimation");
const jackpotBanner = document.createElement('div'); // Create jackpot banner
const multiplierAura = document.createElement('div'); // Create multiplier aura
const treasureMessage = document.createElement('div'); // Create treasure message

// Setup jackpot banner
jackpotBanner.className = 'jackpot-banner';
jackpotBanner.textContent = 'Jackpot!';
document.body.appendChild(jackpotBanner);

// Setup multiplier aura
multiplierAura.className = 'multiplier-aura';
document.body.appendChild(multiplierAura);

// Setup treasure message
treasureMessage.className = 'treasure-message';
treasureMessage.textContent = 'Congratulations! You\'ve collected 4 treasures and unlocked the bonus game!';
document.body.appendChild(treasureMessage);
treasureMessage.style.display = 'none';

spinButton.addEventListener("click", spin);
increaseBetButton.addEventListener("click", () => adjustBet(10));
decreaseBetButton.addEventListener("click", () => adjustBet(-10));

function adjustBet(amount) {
    bet = Math.max(10, bet + amount);
    betSpan.textContent = bet;
}

function spin() {
    if (balance < bet) {
        alert("Not enough balance to spin");
        return;
    }
    balance -= bet;
    balanceSpan.textContent = balance;
    clearHighlights();
    clearSplashes();
    cells.forEach(cell => cell.classList.add("spinning"));
    multiplierDisplay.textContent = 'X0'; // Reset the multiplier display
    hideJackpotBanner(); // Hide the jackpot banner
    hideMultiplierAura(); // Hide the multiplier aura

    const grid = [];
    let poseidonMultiplier = 0; // Reset the multiplier for each spin
    let treasureCount = 0;
    let delay = 0; // Initialize delay for staggered stop

    cells.forEach(cell => cell.classList.remove("stopped"));

    function revealSymbol(index) {
        if (index >= cells.length) {
            setTimeout(() => {
                multiplierDisplay.textContent = `X${poseidonMultiplier}`; // Update the multiplier display

                lastGain = checkWinnings(grid, poseidonMultiplier, treasureCount);
                if (lastGain > 300) {
                    showGainAnimation(lastGain, () => {
                        lastGainSpan.textContent = lastGain;
                        setTimeout(() => {
                            lastGainSpan.classList.add("shockwave");
                            setTimeout(() => {
                                lastGainSpan.classList.remove("shockwave");
                            }, 3000);
                        }, 500); // Delay before showing the shockwave effect
                    });
                    showJackpotBanner(); // Show the jackpot banner
                    shootCoins(); // Start shooting coins
                } else {
                    lastGainSpan.textContent = lastGain;
                }
                balance += lastGain;
                balanceSpan.textContent = balance;

                if (treasureCount >= 4) {
                    setTimeout(() => {
                        showTreasureMessage();
                    }, 500); // Delay before showing the treasure message
                }

                if (autoSpinCount > 0) {
                    autoSpinCount--;
                    if (autoSpinCount === 0) {
                        clearInterval(autoSpinInterval);
                        autoSpinInterval = null;
                    }
                }
            }, 500);
            return;
        }

        let symbol = getRandomSymbol();
        let cell = cells[index];
        if (symbol === "poseidon.png") {
            let currentSymbolMultiplier = getPoseidonMultiplier();
            poseidonMultiplier += currentSymbolMultiplier; // Add to the total multiplier
            cell.innerHTML = `<img src="images/${symbol}" alt="${symbol}"><span class="multiplier">x${currentSymbolMultiplier}</span>`;
            animateMultiplier(cell, currentSymbolMultiplier); // Animate the multiplier
        } else {
            cell.innerHTML = `<img src="images/${symbol}" alt="${symbol}">`;
        }
        if (symbol === "Tresort.png") {
            treasureCount++;
        }

        const row = Math.floor(index / 4);
        if (!grid[row]) grid[row] = [];
        grid[row].push(symbol);

        cell.classList.remove("spinning");
        cell.classList.add("stopped");

        setTimeout(() => {
            revealSymbol(index + 1);
        }, 300); // Adjust delay for next cell
    }

    revealSymbol(0); // Start revealing symbols from the first cell
}

function getRandomSymbol() {
    const random = Math.random();
    // Make Poseidon very rare
    if (random < 0.01) return "poseidon.png";
    return symbols[Math.floor(random * (symbols.length - 1))];
}

function getPoseidonMultiplier() {
    const random = Math.random();
    if (random < 0.6) return 2;
    if (random < 0.8) return 5;
    if (random < 0.95) return 10;
    if (random < 0.99) return 20;
    return 100;
}

function checkWinnings(grid, poseidonMultiplier, treasureCount) {
    let totalGain = 0;
    const symbolValues = calculateSymbolValues(bet);

    function calculateLineGain(line) {
        let lineGain = 0;
        line.forEach(symbol => {
            lineGain += symbolValues[symbol];
        });
        return lineGain;
    }

    // Check rows
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
            if (grid[i][j] === grid[i][j + 1] && grid[i][j] === grid[i][j + 2]) {
                highlightCells([[i, j], [i, j + 1], [i, j + 2]]);
                totalGain += calculateLineGain([grid[i][j], grid[i][j + 1], grid[i][j + 2]]);
            }
        }
    }

    // Check columns
    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 2; i++) {
            if (grid[i][j] === grid[i + 1][j] && grid[i][j] === grid[i + 2][j]) {
                highlightCells([[i, j], [i + 1, j], [i + 2, j]]);
                totalGain += calculateLineGain([grid[i][j], grid[i + 1][j], grid[i + 2][j]]);
            }
        }
    }

    // Check diagonals
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            if (grid[i][j] === grid[i + 1][j + 1] && grid[i][j] === grid[i + 2][j + 2]) {
                highlightCells([[i, j], [i + 1, j + 1], [i + 2, j + 2]]);
                totalGain += calculateLineGain([grid[i][j], grid[i + 1][j + 1], grid[i + 2][j + 2]]);
            }
            if (grid[i + 2][j] === grid[i + 1][j + 1] && grid[i + 2][j] === grid[i][j + 2]) {
                highlightCells([[i + 2, j], [i + 1, j + 1], [i, j + 2]]);
                totalGain += calculateLineGain([grid[i + 2][j], grid[i + 1][j + 1], grid[i][j + 2]]);
            }
        }
    }

    if (poseidonMultiplier > 0) {
        totalGain *= poseidonMultiplier; // Apply the total multiplier to the gain
        showMultiplierAura(); // Show the multiplier aura
    }

    return totalGain;
}

function calculateSymbolValues(bet) {
    const symbolValues = {};
    for (const symbol in baseSymbolValues) {
        symbolValues[symbol] = baseSymbolValues[symbol] * (bet / 100);
    }
    return symbolValues;
}

function highlightCells(cellsToHighlight) {
    cellsToHighlight.forEach(([row, col]) => {
        const cell = cells[row * 4 + col];
        cell.classList.add("highlight");
        applySplashAnimation([cell]); // Apply splash animation to highlighted cells
    });
}

function clearHighlights() {
    cells.forEach(cell => cell.classList.remove("highlight"));
}

function clearSplashes() {
    const splashes = document.querySelectorAll('.splash');
    splashes.forEach(splash => splash.remove());
}

function showWinAnimation() {
    cells.forEach(cell => {
        if (cell.classList.contains("highlight")) {
            cell.classList.add("win-animation");
            setTimeout(() => cell.classList.remove("win-animation"), 1000);
        }
    });
}

function showGainAnimation(amount, callback) {
    let currentAmount = 0;
    gainAnimation.textContent = currentAmount;
    gainAnimation.style.display = "block";

    const increment = Math.ceil(amount / 200); // Slower increment for animation
    const interval = setInterval(() => {
        currentAmount += increment;
        if (currentAmount >= amount) {
            currentAmount = amount;
            clearInterval(interval);
            setTimeout(() => {
                gainAnimation.style.display = 'none';
                callback();
            }, 3000); // Display the final amount for 3 seconds
        }
        gainAnimation.textContent = currentAmount;
    }, 20); // Slower interval for animation
}

function animateMultiplier(cell, multiplier) {
    const multiplierElement = document.createElement('div');
    multiplierElement.className = 'multiplier-animation';
    multiplierElement.textContent = `x${multiplier}`;
    document.body.appendChild(multiplierElement);

    const rect = cell.getBoundingClientRect();
    multiplierElement.style.left = `${rect.left + rect.width / 2}px`;
    multiplierElement.style.top = `${rect.top + rect.height / 2}px`;

    multiplierElement.addEventListener('animationend', () => {
        multiplierElement.remove();
    });
}

function applySplashAnimation(cells) {
    cells.forEach(cell => {
        const splash = document.createElement('div');
        splash.classList.add('splash');
        splash.style.animationDelay = `${Math.random() * 0.5}s`; // Random delay to avoid all splashes coming from the same place
        cell.appendChild(splash);

        // No need to remove the splash element as it should persist
    });
}

function shootCoins() {
    for (let i = 0; i < 30; i++) {
        const coin = document.createElement('div');
        coin.className = 'coins';
        coin.style.left = `${Math.random() * 100}%`;
        coin.style.animationDuration = `${2 + Math.random() * 3}s`; // Random duration between 2 and 5 seconds
        document.body.appendChild(coin);

        setTimeout(() => {
            coin.remove();
        }, 5000); // Remove coins after 5 seconds
    }
}

function showJackpotBanner() {
    jackpotBanner.style.display = 'block';
    setTimeout(() => {
        jackpotBanner.style.display = 'none';
    }, 3000); // Hide the banner after 3 seconds
}

function hideJackpotBanner() {
    jackpotBanner.style.display = 'none';
}

function showMultiplierAura() {
    multiplierAura.style.display = 'block';
    setTimeout(() => {
        multiplierAura.style.display = 'none';
    }, 3000); // Hide the aura after 3 seconds
}

function hideMultiplierAura() {
    multiplierAura.style.display = 'none';
}

function showTreasureMessage() {
    treasureMessage.style.display = 'block';
    treasureMessage.classList.add('show'); // Add CSS animation class
    localStorage.setItem('betAmount', bet); // Store the current bet amount
    setTimeout(() => {
        treasureMessage.style.display = 'none';
        window.location.href = 'bonus.html'; // Redirect to the bonus game
    }, 3000); // Show the message for 3 seconds
}

document.getElementById('decreaseSize').addEventListener('click', () => adjustSize(-10));
document.getElementById('increaseSize').addEventListener('click', () => adjustSize(10));

function adjustSize(amount) {
    const grid = document.querySelector('.grid');
    const cells = document.querySelectorAll('.cell');
    const currentWidth = parseInt(getComputedStyle(cells[0]).width);
    const newWidth = Math.max(50, currentWidth + amount); // Ensure minimum size

    grid.style.gridTemplateColumns = `repeat(4, ${newWidth}px)`;
    grid.style.gridTemplateRows = `repeat(4, ${newWidth}px)`;
    cells.forEach(cell => {
        cell.style.width = `${newWidth}px`;
        cell.style.height = `${newWidth}px`;
    });
}
