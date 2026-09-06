//ai.ts

import { Unit, type Colour, type PieceType, type Position } from "../data/data";
import { GameState } from "../data/gameState";
import { Engine } from "../engine/engine";




export class AIModule{
    private engine:Engine;
    private gameState: GameState;
    constructor(engine:Engine, gameState:GameState){
        this.engine = engine;
        this.gameState = gameState;
    }

    
}