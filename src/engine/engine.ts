// engine.ts

import {
    type Position,
    Unit,
    type Colour
} from "../data/data";
import {
    GameState
} from "../data/gameState";
import {
    filter
} from "./filters";


export class OccupancyPackage {
    public empty: Position[] = [];
    public friendly: Position[] = [];
    public enemy: Position[] = [];
}

export interface PawnPackage {
    forward: Position[],
    doubleForward: Position[],
    captures: Position[]
}

export class Engine {

    private gameState: GameState;
    private Turn: Colour = "white";
    private _filter: filter;
    private currentSelectedUnit: Unit | undefined = undefined;
    private hasSelected: boolean = false;
    private possiblePositions: Position[] = [];
    private occupancyPackage: OccupancyPackage = new OccupancyPackage();

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this._filter = new filter(gameState);
    }

    private Orchestrator(pos: Position): boolean {

        let vectors: Position[] = [];
        const clickedUnit: Unit | undefined = this.gameState.getUnitAt(pos);

        //if no unit is selected
        if (!this.hasSelected) {

            //Empty square
            if (!clickedUnit) {
                console.log("No unit on this place!");
                return false;
            }

            // Enemy unit
            if (!this.validateUnit(clickedUnit)) {
                console.log("Wrong unit selected at your turn");
                return false;
            }

            // Friendly unit selected
            this.currentSelectedUnit = clickedUnit;
            this.possiblePositions = this.returnPossiblePositions(clickedUnit);
            this.occupancyPackage =this._filter.occupancyFilter(clickedUnit,this.possiblePositions);
            this.hasSelected = true;
        }
        //if unit is already selected
        else {
            if (!this.currentSelectedUnit) {
                console.log("Selection state is invalid.");
                this.ClearSelection();
                return false;
            }
            //if empty square
            if (!clickedUnit) {
                
                let posExistsInPossiblePos:boolean = false;
                for (let i =0; i < this.possiblePositions.length; i++){
                    if (
                        pos.x === this.possiblePositions[i].x &&
                        pos.y === this.possiblePositions[i].y
                    ){
                        posExistsInPossiblePos = true;
                        break;
                    }
                }

                if (posExistsInPossiblePos){
                    this.gameState.moveUnit(this.currentSelectedUnit.position, pos);
                    this.ClearSelection();
                    if (this.Turn==='white'){this.Turn='black';}
                    else {this.Turn='white';}
                    return true;
                }
                else if (!posExistsInPossiblePos){
                    console.log("Invalid move!");
                    this.ClearSelection();
                    return false;
                }
            }
            //if its a friendly unit
            else if (this.validateUnit(clickedUnit)) {
                // Replace current selection.
                this.currentSelectedUnit = clickedUnit;
                this.possiblePositions =this.returnPossiblePositions(clickedUnit);
                this.occupancyPackage = this._filter.occupancyFilter(clickedUnit,
                this.possiblePositions);

            }
            //if its enemy unit
            else {

                let posExistsInPossiblePos:boolean = false;

                for (let i =0; i < this.possiblePositions.length; i++){
                    if (
                        pos.x === this.possiblePositions[i].x &&
                        pos.y === this.possiblePositions[i].y
                    ){
                        posExistsInPossiblePos = true;
                        break;
                    }
                }
                if (posExistsInPossiblePos){
                    this.gameState.removeUnitAt(pos);
                    this.gameState.moveUnit(this.currentSelectedUnit.position, pos);
                    this.ClearSelection();
                    if (this.Turn==='white'){this.Turn='black';}
                    else {this.Turn='white';}
                    return true;
                }
                else if (!posExistsInPossiblePos){
                    console.log("Invalid move!");
                    this.ClearSelection();
                    return false;
                }
            }
        }

        //Generate vectors when valid unit is selected
        //dont generate vectors if current selected unit is not possible
        if (!this.currentSelectedUnit) {return false;}

        for (let i = 0; i < this.possiblePositions.length; i++) {
            const newVector: Position = {
                x:this.possiblePositions[i].x -this.currentSelectedUnit.position.x,
                y:this.possiblePositions[i].y -this.currentSelectedUnit.position.y
            };
            vectors.push(newVector);
        }

        //block and conditional filter 
        this.possiblePositions = this._filter.blockFilter(this.occupancyPackage,vectors,
            this.currentSelectedUnit
        );

        return true;
    }


    public SelectUnit(pos: Position): void {this.Orchestrator(pos);}

    private validateUnit(unit: Unit): boolean {return unit.colour === this.Turn;}

    private returnPossiblePositions(unit: Unit): Position[] {

        let positions: Position[] = [];

        for (let i = 0; i < unit.movements.length; i++) {
            positions.push(...unit.movements[i].returnPositions(unit.position,unit.colour));
        }

        return positions;
    }

    private ClearSelection():void{
        this.currentSelectedUnit = undefined;
        this.possiblePositions = [];
        this.occupancyPackage.empty = [];
        this.occupancyPackage.enemy = [];
        this.occupancyPackage.friendly = [];
        this.hasSelected = false;
    }
}