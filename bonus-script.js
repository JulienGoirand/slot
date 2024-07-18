document.addEventListener("DOMContentLoaded", () => {
    const symbols = [
        "posidonb.png",
        "chariotb.png",
        "coquillageb.png",
        "couronneb.png",
        "dauphinb.png",
        "statueb.png",
        "nympheb.png",
        "tridentb.png",
        "roueb.png"
    ];

    const baseSymbolValues = {
        "posidonb.png": 1000,
        "chariotb.png": 220,
        "coquillageb.png": 80,
        "couronneb.png": 210,
        "dauphinb.png": 60,
        "statueb.png": 160,
        "nympheb.png": 50,
        "tridentb.png": 120,
        "roueb.png": 80
    };

    let balance = 10000;
    let freeSpins = 10;
    let gain = 0;
    let poseidonPositions = [];
    let totalPoseidonMultiplier = 0;

    // Get the bet amount from localStorage
    const betAmount = localStorage.getItem('betAmount') || 100;

    const spinButton = document.getElementById('spinButton');
    const freeSpinsSpan = document.getElementById('freeSpins');
    const gainSpan = document.getElementById('gain');

    spinButton.addEventListener('click', spin);

    function spin() {
        if (freeSpins > 0) {
            freeSpins--;
            freeSpinsSpan.textContent = freeSpins;

            clearHighlights(); // Clear previous highlights

            const grid = [];
            const cells = document.querySelectorAll('.slot-cell');
            let poseidonMultiplier = 0;

            cells.forEach((cell, index) => {
                cell.classList.add("spinning");

                const row = Math.floor(index / 6);
                const col = index % 6;
                const position = [row, col];

                let symbol;
                if (poseidonPositions.some(pos => pos[0] === row && pos[1] === col)) {
                    symbol = "posidonb.png";
                } else {
                    symbol = getRandomSymbol();
                    if (symbol === "posidonb.png" && poseidonPositions.length < 6) {
                        poseidonPositions.push(position);
                    } else if (symbol === "posidonb.png" && poseidonPositions.length >= 6) {
                        symbol = getRandomNonPoseidonSymbol();
                    }
                }

                setTimeout(() => {
                    cell.classList.remove("spinning");
                    if (symbol === "posidonb.png") {
                        const multiplier = getPoseidonMultiplier();
                        poseidonMultiplier += multiplier;
                        totalPoseidonMultiplier += multiplier;
                        cell.innerHTML = `<img src="images/${symbol}" alt="${symbol}"><span class="multiplier">x${multiplier}</span>`;
                    } else {
                        cell.innerHTML = `<img src="images/${symbol}" alt="${symbol}">`;
                    }

                    const column = Math.floor(index / 3);
                    if (!grid[column]) grid[column] = [];
                    grid[column].push(symbol);
                }, index * 100); // Add delay for staggered animation
            });

            setTimeout(() => {
                let spinGain = checkWinnings(grid, poseidonMultiplier);
                gain += spinGain;
                gainSpan.textContent = gain;

                // Animate spin (example: highlight all cells briefly)
                cells.forEach(cell => {
                    cell.classList.add('highlight');
                    setTimeout(() => cell.classList.remove('highlight'), 500);
                });

                if (freeSpins === 0) {
                    // Handle end of free spins and redirect to main game
                    alert("No more free spins left!");
                    setTimeout(() => {
                        window.location.href = 'index.html'; // Replace 'index.html' with the actual path to your main game HTML file
                    }, 1000); // Redirect after a short delay
                }
            }, cells.length * 100);
        } else {
            alert("No more free spins left!");
        }
    }

    function getRandomSymbol() {
        const random = Math.random();
        if (random < 0.01) return "posidonb.png"; // 1% chance for Poseidon
        return symbols[Math.floor(random * (symbols.length - 1))];
    }

    function getRandomNonPoseidonSymbol() {
        const nonPoseidonSymbols = symbols.filter(symbol => symbol !== "posidonb.png");
        return nonPoseidonSymbols[Math.floor(Math.random() * nonPoseidonSymbols.length)];
    }

    function getPoseidonMultiplier() {
        const random = Math.random();
        if (random < 0.6) return 2;
        if (random < 0.8) return 5;
        if (random < 0.95) return 10;
        if (random < 0.99) return 20;
        return 100;
    }

    function checkWinnings(grid, poseidonMultiplier) {
        let totalGain = 0;

        function calculateLineGain(line) {
            let lineGain = 0;
            line.forEach(symbol => {
                lineGain += baseSymbolValues[symbol] * (betAmount / 100); // Adjust gain calculation
            });
            return lineGain;
        }

        // Check rows
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                if (grid[j][i] !== "posidonb.png" && grid[j][i] === grid[j + 1][i] && grid[j][i] === grid[j + 2][i]) {
                    highlightCells([[j, i], [j + 1, i], [j + 2, i]]);
                    totalGain += calculateLineGain([grid[j][i], grid[j + 1][i], grid[j + 2][i]]);
                }
            }
        }

        // Check columns
        for (let j = 0; j < 6; j++) {
            if (grid[j][0] !== "posidonb.png" && grid[j][0] === grid[j][1] && grid[j][0] === grid[j][2]) {
                highlightCells([[j, 0], [j, 1], [j, 2]]);
                totalGain += calculateLineGain([grid[j][0], grid[j][1], grid[j][2]]);
            }
        }

        // Check adjacent symbols
        for (let col = 0; col < 6; col++) {
            for (let row = 0; row < 3; row++) {
                const symbol = grid[col][row];
                if (symbol !== "posidonb.png") {
                    const adjSymbols = getAdjacentSymbols(grid, col, row);
                    const sameAdjSymbols = adjSymbols.filter(adj => adj === symbol);
                    if (sameAdjSymbols.length >= 2) {
                        highlightCells([[col, row], ...getAdjacentPositions(col, row)]);
                        totalGain += calculateLineGain([symbol]) * 0.5; // Gain divided by two for adjacent symbols
                    }
                }
            }
        }

        // Apply Poseidon multipliers to the total gain
        if (poseidonMultiplier > 0) {
            totalGain *= poseidonMultiplier;
        }

        return totalGain;
    }

    function getAdjacentSymbols(grid, col, row) {
        const adjSymbols = [];
        if (col > 0) adjSymbols.push(grid[col - 1][row]);
        if (col < 5) adjSymbols.push(grid[col + 1][row]);
        if (row > 0) adjSymbols.push(grid[col][row - 1]);
        if (row < 2) adjSymbols.push(grid[col][row + 1]);
        return adjSymbols;
    }

    function getAdjacentPositions(col, row) {
        const adjPositions = [];
        if (col > 0) adjPositions.push([col - 1, row]);
        if (col < 5) adjPositions.push([col + 1, row]);
        if (row > 0) adjPositions.push([col, row - 1]);
        if (row < 2) adjPositions.push([col, row + 1]);
        return adjPositions;
    }

    function highlightCells(cellsToHighlight) {
        cellsToHighlight.forEach(([col, row]) => {
            const index = col * 3 + row;
            const cell = document.querySelectorAll('.slot-cell')[index];
            cell.classList.add('highlight');
            applySplashAnimation(cell); // Apply splash animation
        });
    }

    function applySplashAnimation(cell) {
        const splash = document.createElement('div');
        splash.classList.add('splash');
        splash.style.animationDelay = `${Math.random() * 0.5}s`; // Random delay to avoid all splashes coming from the same place
        cell.appendChild(splash);
    }

    function clearHighlights() {
        const cells = document.querySelectorAll('.slot-cell');
        cells.forEach(cell => {
            cell.classList.remove('highlight');
            const splash = cell.querySelector('.splash');
            if (splash) splash.remove();
        });
    }
});
