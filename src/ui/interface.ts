//interface.ts
import  { type Position, type Unit } from "../data/data";
import { GameState } from "../data/gameState";
import {
    Engine
} from "../engine/engine"

//importing the assets
import whiteRook from "../assets/white-rook.png";
import whiteKnight from "../assets/white-knight.png";
import whiteBishop from "../assets/white-bishop.png";
import whiteQueen from "../assets/white-queen.png";
import whiteKing from "../assets/white-king.png";
import whitePawn from "../assets/white-pawn.png";

import blackRook from "../assets/black-rook.png";
import blackKnight from "../assets/black-knight.png";
import blackBishop from "../assets/black-bishop.png";
import blackQueen from "../assets/black-queen.png";
import blackKing from "../assets/black-king.png";
import blackPawn from "../assets/black-pawn.png";


export class Interface{
    private engine:Engine;
    private board:HTMLElement;

    constructor(engine:Engine, board:HTMLElement){
        this.engine = engine;
        this.board = board;
        this.UpdateUI();
    }

    public SelectSquare(x:number, y:number):void{
        const pos:Position = {x:x, y:y};
        this.engine.SelectUnit(pos);
        this.UpdateUI();
    }

    private getSquare(x:number, y:number):HTMLElement|null{
        return document.querySelector(`.square[data-x="${x}"][data-y="${y}"]`);
    }

    private getImage(unit:Unit):string{
        if (unit.colour==='white'){
            switch (unit.pieceType){
                case "rook": return whiteRook;
                case "bishop": return whiteBishop;
                case "king": return whiteKing;
                case "knight": return whiteKnight;
                case "pawn": return whitePawn;
                case "queen": return whiteQueen;
            }
        }
        else {
            switch (unit.pieceType){
                case "rook": return blackRook;
                case "bishop": return blackBishop;
                case "king": return blackKing;
                case "knight": return blackKnight;
                case "pawn": return blackPawn;
                case "queen": return blackQueen;
            }
        }
        throw new Error("Unknown piece type");
    }

    private highlightSelectedUnit(): void {
        const selectedUnit = this.engine.getSelectedUnit();
        if (!selectedUnit) {return;}

        const square = this.getSquare(
            selectedUnit.position.x,
            selectedUnit.position.y
        );

        if (!square) {return;}

        square.classList.add("selection_highlight");
    }

    private highlightPossiblePositions(): void {
        const possiblePositions = this.engine.getPossiblePositions();

        for (const position of possiblePositions) {
            const square = this.getSquare(
                position.x,
                position.y
            );
            if (!square) {continue;}

            square.classList.add("valid_pos_highlight");
        }
    }

    public UpdateUI():void{

        const squares = this.board.querySelectorAll(".square");

        for (const square of squares) {
            square.replaceChildren();
            square.classList.remove(
                "selection_highlight",
                "valid_pos_highlight",
                "enemy_kill_highlight"
            );
        }
        
        const gameState:GameState = this.engine.readGameState();
        const units = gameState.getUnits();

        for (const unit of units){
            const square = this.getSquare(unit.position.x, unit.position.y);

            if (!square){continue;}

            const image = document.createElement("img");
            image.src = this.getImage(unit);
            image.classList.add("piece");
            square.appendChild(image);
        }

        this.highlightSelectedUnit();
        this.highlightPossiblePositions();
    }

}