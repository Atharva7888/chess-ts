//main.ts
import { GameState } from "./data/gameState";
import { Engine } from "./engine/engine";
import { Interface } from "./ui/interface";

const board = document.getElementById("board");

if (!board) {
    throw new Error("Board element not found");
}

const gameState:GameState = new GameState();
const engine:Engine = new Engine(gameState);
const _interface:Interface = new Interface(engine);

//generating and rendering the chess board
for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.addEventListener("click", () => {
        console.log("Clicked:", x, y);
        _interface.SelectSquare(x, y);
    });
      
      if ((x + y) % 2 === 0) {square.classList.add("light");}
      else {square.classList.add("dark");}
      
      board.appendChild(square);
    }
}