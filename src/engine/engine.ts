// engine.ts

import {
    type Position,
    Unit,
    type Colour,
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

export interface MoveOption {
    position: Position;
    type: "move" | "capture";
}

export class PositionPackage{
    public unit:Unit;
    public positions:Position[];

    constructor(unit:Unit, poitions:Position[]){
        this.unit = unit;
        this.positions = poitions;
    }
}

export class Engine {
    //vars
    private gameState: GameState;
    private Turn: Colour = "white";
    private _filter: filter;
    private currentSelectedUnit: Unit | undefined = undefined;
    private hasSelected: boolean = false;
    private possiblePositions: Position[] = [];
    public isKingChecked = false;

    public getSelectedUnit(): Unit | undefined {return this.currentSelectedUnit;}
    public getPossiblePositions(): Position[] {return this.possiblePositions;}
    public isSelected(): boolean {return this.hasSelected;}
    public readGameState():GameState{return this.gameState;}

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this._filter = new filter(gameState, );
    }

    //Interface calls this function to tell it this position has been selected
    public SelectUnit(pos: Position): void {this.Orchestrator(pos);}

    //checks if it is first selection or second selection
    //first selection: valid unit selection
    //second selection: valid move of that unit selection
    private Orchestrator(pos: Position): boolean {
        //first selection
        if (!this.hasSelected) {
            return this.handleInitialSelection(pos);
        }

        //second selection
        return this.handleSelectedUnitAction(pos);
    }

    //checks if the passed unit is valid according to turn
    private validateUnit(unit: Unit): boolean {return unit.colour === this.Turn;}

    //handles first selection, takes position and returns if the first selected unit
    //has been selected (true) or not (false)
    private handleInitialSelection(pos: Position): boolean {
        
        //get the unit located at that position from gamestate
        const clickedUnit = this.gameState.getUnitAt(pos);

        //if no unit exists at that place i.e. Player selected an empty square, throw error
        if (!clickedUnit) {console.log("No unit on this place!"); return false;}

        //jmp to validate unit to check if the unit selected is valid according to turn
        if (!this.validateUnit(clickedUnit)) {
            console.log("Wrong unit selected at your turn");
            return false;
        }

        //check if the unit can be selected according to the rules
        if (!this.canSelectUnit(clickedUnit)) {return false;}

        //if all conditions pass, select the unit and return true
        this.selectUnit(clickedUnit);
        return true;
    }

    //this function checks if the given unit can be selected validly
    private canSelectUnit(unit: Unit): boolean {

        //jmp to validate unit to check if the unit selected is valid according to turn
        if (!this.validateUnit(unit)) {return false;}

        //if king is not checked------------------------------------------------------
        //if player's king is not checked then return true, unit can be selected 
        if (!this.isKingChecked) {return true;}

        //if king is checked-----------------------------------------------------------
        //verify only king can be selected or else return false
        //since king is allowed to move during check
        if (unit.pieceType === "king") {return true;}
        
        //if an other unit can kill the checker, then allow it to be selected during check
        if (this.canUnitCaptureChecker(unit)) {return true;}

        //if an other unit can block the checker's path, allow it to be selected
        if (this.canUnitBlockChecker(unit)) {return true;}

        //else return false by default
        return false;
    }

    //this is like a setter function
    //after the unit has passed all test and can be selected validly
    //we set the unit as selected
    private selectUnit(unit: Unit): void {
        //set the current selected unit as the valid unit during first selection
        this.currentSelectedUnit = unit;

        //generate and save all possible positions of the unit
        this.possiblePositions = this.generateSelectionPositions(unit);

        //set hasSelected true, which tells system first selection is done and now
        //do second selection
        this.hasSelected = true;
    }

    //for second selection
    private handleSelectedUnitAction(pos: Position): boolean {

        const clickedUnit = this.gameState.getUnitAt(pos);

        if (!clickedUnit) {return this.handleEmptySquare(pos);}

        if (this.validateUnit(clickedUnit)) {return this.handleFriendlyUnit(clickedUnit);}

        return this.handleEnemyUnit(pos);
    }

    private handleEmptySquare(pos: Position): boolean {

        if (!this.isPossiblePosition(pos)) {
            console.log("Invalid move!");
            this.ClearSelection();
            return false;
        }

        this.gameState.moveUnit(this.currentSelectedUnit!.position,pos);

        this.finishMove();

        return true;
    }

    //check if the calculated positions are possible or not one at time
    private isPossiblePosition(pos: Position): boolean {

        for (const possible of this.possiblePositions) {

            if (
                possible.x === pos.x &&
                possible.y === pos.y
            ) {return true;}
        }

        return false;
    }

    //if friendly unit selected at your second selection
    private handleFriendlyUnit(unit: Unit): boolean {

        if (!this.canSelectUnit(unit)) {
            console.log("This unit cannot respond to the check.");
            this.ClearSelection();
            return false;
        }

        this.selectUnit(unit);

        return true;
    }

    private handleEnemyUnit(pos: Position): boolean {

        if (!this.isPossiblePosition(pos)) {
            console.log("Invalid move!");
            this.ClearSelection();
            return false;
        }

        this.gameState.removeUnitAt(pos);
        this.gameState.moveUnit(this.currentSelectedUnit!.position,pos);
        this.finishMove();

        return true;
    }

    private finishMove(): void {

        this.ClearSelection();

        if (this.Turn === "white") {
            this.Turn = "black";
        } else {
            this.Turn = "white";
        }

        this.updateKingCheck();
    }

    //generates all the possible positions ignoring every lawas
    public generatePossiblePositions(unit: Unit): Position[] {
        //step 1: Generate raw movement positions
        const rawPositions = this.returnPossiblePositions(unit);

        //step 2: Determine what occupies those positions
        const occupancyPackage = this._filter.occupancyFilter(unit, rawPositions);

        //step 3: Convert positions into movement vectors
        const vectors: Position[] = [];

        for (const position of rawPositions) {
            vectors.push({
                x: position.x - unit.position.x,
                y: position.y - unit.position.y
            });
        }

        //step 4: Apply blocking and piece-specific rules
        const legalPositions = this._filter.blockFilter(
            occupancyPackage,
            vectors,
            unit
        );

        return legalPositions;

    }

    private returnPossiblePositions(unit: Unit): Position[] {

        let positions: Position[] = [];

        console.log("Selected unit:", unit);
        console.log("Movement count:", unit.movements.length);

        for (let i = 0; i < unit.movements.length; i++) {
            const returnedPositions =unit.movements[i].returnPositions(unit.position,unit.colour);

            console.log("Movement returned:", returnedPositions);
            positions.push(...returnedPositions);
        }

        return positions;
    }

    private ClearSelection():void{
        this.currentSelectedUnit = undefined;
        this.possiblePositions = [];
        this.hasSelected = false;
    }


    public generateUnitPositions(unit:Unit):PositionPackage{
        if (!unit){throw new Error(`${unit} not found`);}

        const positions:Position[] = this.generatePossiblePositions(unit);
        
        const positionPackage = new PositionPackage(unit, positions);

        return positionPackage;
    }

    public generateTeamPositions(colour:Colour):PositionPackage[]{
        
        const positionPackages:PositionPackage[] = [];

        for (let i = 0; i < this.gameState.getUnits().length; i++){
            if (this.gameState.getUnits()[i].colour===colour){
                const unit = this.gameState.getUnits()[i];
                const positions = this.generatePossiblePositions(unit);
                const pack = new PositionPackage(
                    unit,
                    positions
                );
                positionPackages.push(pack);
            }
        }

        return positionPackages;
    }

    public updateKingCheck(): void {

        const enemyColour: Colour = this.Turn === "white" ? "black" : "white";

        const enemyPositions = this.generateTeamPositions(enemyColour);

        this.isKingChecked =this._filter.isKingCheck(this.Turn,enemyPositions);
        console.log("KIng checked", this.isKingChecked);

        if (this.isKingChecked){
            const unitsCanCapture = this.getUnitsCanCaptureChecker();
            console.log("Units that can capture: ", unitsCanCapture);
        }
    }

    public getPiecesThreatingKing():PositionPackage[]{
        const enemyColour:Colour = this.Turn === "white"? "black":"white";
        const enemyPositions = this.generateTeamPositions(enemyColour);

        return this._filter.whichPiecesThreateningKing(this.Turn, enemyPositions)
    }

    //get the units that can kill checker guy
    public getUnitsCanCaptureChecker():PositionPackage[]{
        const enemyColour: Colour =
        this.Turn === "white" ? "black" : "white";

        const enemyPositions = this.generateTeamPositions(enemyColour);


        const threateningPieces = this._filter.whichPiecesThreateningKing(
                this.Turn,
                enemyPositions
            );

        const friendlyPositions =this.generateTeamPositions(this.Turn);

        const unitsCanCapture =this._filter.whichUnitsCanCaptureAttackingUnit(
                threateningPieces,
                friendlyPositions
            );

        return unitsCanCapture;
    }

    private generateSelectionPositions(unit: Unit): Position[] {
       
        let positions = this.generatePossiblePositions(unit);

        if (!this.isKingChecked) {return positions;}

        const enemyColour: Colour =unit.colour === "white" ? "black" : "white";

        const enemyPositions = this.generateTeamPositions(enemyColour);

        if (unit.pieceType === "king") {
            return this._filter.filterKingPositions(
                positions,
                enemyPositions
            );
        }

        const captureOptions = this.getUnitsCanCaptureChecker();

        const blockOptions = this.getUnitsCanBlockChecker();

        const allowedPositions: Position[] = [];

        //this unit's checker-capture positions is added
        for (let i = 0; i < captureOptions.length; i++) {
            if (captureOptions[i].unit === unit) {
                allowedPositions.push(
                    ...captureOptions[i].positions
                );
            }
        }

        //this unit's blocking positions is added
        for (let i = 0; i < blockOptions.length; i++) {
            if (blockOptions[i].unit === unit) {
                allowedPositions.push(
                    ...blockOptions[i].positions
                );
            }
        }

        return allowedPositions;
    }

    private canUnitCaptureChecker(unit:Unit):boolean{
        
       const unitsCanCapture = this.getUnitsCanCaptureChecker();

        for (let i = 0; i < unitsCanCapture.length; i++) {
            if (unitsCanCapture[i].unit === unit) {
                return true;
            }
        }

        return false;
    }

    public getUnitsCanBlockChecker(): PositionPackage[] {
        const threateningPieces =this.getPiecesThreatingKing();

        const friendlyPositions = this.generateTeamPositions(this.Turn);

        return this._filter.whichUnitsMovesBlocksKingCheck(
            this.Turn,
            threateningPieces,
            friendlyPositions
        );
    }

    private canUnitBlockChecker(unit: Unit): boolean {

        const unitsCanBlock =this.getUnitsCanBlockChecker();

        for (let i = 0; i < unitsCanBlock.length; i++) {
            if (unitsCanBlock[i].unit === unit) {return true;}
        }

        return false;
    }
        
    
}