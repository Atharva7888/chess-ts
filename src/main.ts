import { GameState } from "./data/gameState";
import { Engine } from "./engine/engine";
import { AIModule } from "./modules/ai";
import { Interface } from "./ui/interface";

const gameState: GameState = new GameState();
const engine: Engine = new Engine(gameState);
const aiModule:AIModule = new AIModule(engine, gameState);

const board = document.getElementById("board");

if (!board) {
    throw new Error("Board element not found");
}

// Generate the board
for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {

        const square = document.createElement("div");

        square.classList.add("square");

        square.dataset.x = x.toString();
        square.dataset.y = y.toString();

        if ((x + y) % 2 === 0) {
            square.classList.add("light");
        } else {
            square.classList.add("dark");
        }

        board.appendChild(square);
    }
}

// Create the UI
const ui = new Interface(engine, board);

// Give every square one click handler
const squares = board.querySelectorAll<HTMLElement>(".square");

squares.forEach(square => {

    square.addEventListener("click", () => {

        const x = Number(square.dataset.x);
        const y = Number(square.dataset.y);

        console.log("Clicked:", x, y);

        ui.SelectSquare(x, y);
    });

});