// engine.ts

import {
    type Position,
    Unit,
    type Colour,
    HorizontalMovement,
    VerticalMovement,
    DiagonalMovement,
} from "../data/data";
import {
    GameState
} from "../data/gameState";
import {
    filter
} from "./filters";


type GameStatus = 
    |"playing"
    |"check"
    |"checkmate"
    |"stalemate"

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
    private gameStatus:GameStatus = "playing";
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

        if (!this.validateUnit(unit)) {
            return false;
        }

        const legalPositions =this.generateLegalPositions(unit);

        return legalPositions.length > 0;
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

        const unit = this.currentSelectedUnit!;

        if (
            unit.pieceType === "king" &&
            Math.abs(pos.x - unit.position.x) === 2
        ) {
            const kingside = pos.x > unit.position.x;

            this.performCastling(unit, kingside);
        } else {
            this.gameState.moveUnit(
                unit.position,
                pos
            );

            unit.hasMoved = true;
        }

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
        
        const unit = this.currentSelectedUnit!;

        if (
            unit.pieceType === "king" &&
            Math.abs(pos.x - unit.position.x) === 2
        ) {
            const kingside = pos.x > unit.position.x;

            this.performCastling(unit, kingside);
        } else {
            this.gameState.moveUnit(
                unit.position,
                pos
            );

            unit.hasMoved = true;
        }

        this.finishMove();

        return true;
    }

    private finishMove(): void {

        this.checkPromotion();
        this.ClearSelection();

        if (this.Turn === "white") {
            this.Turn = "black";
        } else {
            this.Turn = "white";
        }

        this.updateKingCheck();

        this.updateGameStatus();
        console.log("Game status:", this.gameStatus);
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

    public generateAttackPositions(unit:Unit){
        if (unit.pieceType==="pawn"){
            return this.generatePawnAttackPositions(unit);
        }
        if (unit.pieceType==="king"){
            return this.generateKingAttackPositions(unit);
        }
        return this.generatePossiblePositions(unit);
    }

    private generatePawnAttackPositions(unit:Unit):Position[]{
        const attacks:Position[] = [];
        const direction = unit.colour === "white"? 1: -1;
        const leftAttackPOs = {
            x:unit.position.x - 1,
            y:unit.position.y + direction
        };

        const rightAttackPos = {
            x:unit.position.x+1,
            y:unit.position.y + direction
        };

        attacks.push(leftAttackPOs);
        attacks.push(rightAttackPos);
        return attacks;
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

    private generateTeamAttackPositions(colour:Colour):PositionPackage[]{
        
        const positionPackages:PositionPackage[] = [];
        const units = this.gameState.getUnits();

        for (let i=0; i < units.length; i++){
            const unit = units[i];

            if (unit.colour !== colour){continue;}

            const positions = this.generateAttackPositions(unit);
            const pack = new PositionPackage(unit, positions);
            positionPackages.push(pack);
        }
        return positionPackages;
    }

    private generateKingAttackPositions(unit:Unit):Position[]{
        const attacks:Position[] = [];

        const directions = [
            { x: -1, y: -1 },
            { x:  0, y: -1 },
            { x:  1, y: -1 },
            { x: -1, y:  0 },
            { x:  1, y:  0 },
            { x: -1, y:  1 },
            { x:  0, y:  1 },
            { x:  1, y:  1 }
        ];

        for (let i = 0; i < directions.length; i++){
            attacks.push({
                x:unit.position.x + directions[i].x,
                y:unit.position.y + directions[i].y
            });
        }

        return attacks;
    }

    public updateKingCheck(): void {

        const enemyColour: Colour = this.Turn === "white" ? "black" : "white";

        const enemyPositions = this.generateTeamAttackPositions(enemyColour);

        this.isKingChecked =this._filter.isKingCheck(this.Turn,enemyPositions);
        console.log("KIng checked", this.isKingChecked);
    }


    public getPiecesThreatingKing():PositionPackage[]{
        const enemyColour:Colour = this.Turn === "white"? "black":"white";
        const enemyPositions = this.generateTeamPositions(enemyColour);

        return this._filter.whichPiecesThreateningKing(this.Turn, enemyPositions)
    }

    private generateSelectionPositions(unit: Unit): Position[] {
       
        const positions =this.generateLegalPositions(unit);

        console.log(
            "Legal positions:",
            unit,
            positions
        );

        return positions;
    }

    private isMoveLegal(unit:Unit, destination:Position):boolean{
        
        const originalPos = {x:unit.position.x, y:unit.position.y};

        const capturedUnit = this.gameState.getUnitAt(destination);

        //we need to remove captured pieces temp
        if (capturedUnit && capturedUnit.pieceType==="king"){return false;}

        //temporarily make the move
        unit.position = destination;
        const enemyColour: Colour = unit.colour === "white" ? "black" : "white";
        const enemyPositions =this.generateTeamAttackPositions(enemyColour);

        const kingIsAttacked = this._filter.isKingCheck(unit.colour, enemyPositions);

        //restore original pos
        unit.position = originalPos;

        //restore capture position
        if (capturedUnit){this.gameState.addUnit(capturedUnit);}

        return !kingIsAttacked;
    }

    private generateLegalPositions(unit:Unit):Position[]{
        
        const candidatePOsitions = this.generatePossiblePositions(unit);

        if (unit.pieceType === "king"){
            if (this.canCastle(unit, true)){
                candidatePOsitions.push({
                    x:6,
                    y:unit.position.y
                });
            }
            if (this.canCastle(unit, false)){
                candidatePOsitions.push({
                    x:2,
                    y:unit.position.y
                });
            }
        }

        const legalPositions:Position[] = [];

        for (let i=0; i < candidatePOsitions.length; i++){
            if (this.isMoveLegal(unit, candidatePOsitions[i])){
                legalPositions.push(candidatePOsitions[i]);
            }
        }
        return legalPositions;
    }

    private hasAnyLegalMove(colour:Colour):boolean{
        const units =this.gameState.getUnits();

        for (let i = 0; i < units.length; i++) {

            const unit = units[i];

            if (unit.colour !== colour) {continue;}

            const legalPositions =this.generateLegalPositions(unit);

            if (legalPositions.length > 0) {return true;}
        }

        return false;
    }

    private isKingAttacked(colour: Colour): boolean {

        const enemyColour: Colour =colour === "white" ? "black" : "white";

        const enemyPositions =this.generateTeamAttackPositions(enemyColour);

        return this._filter.isKingCheck(colour,enemyPositions);
    }

    private updateGameStatus(): void {

        const colour = this.Turn;

        if (this.isCheckmate(colour)) {this.gameStatus = "checkmate"; return;}
        if (this.isStalemate(colour)) {this.gameStatus = "stalemate"; return;}
        if (this.isKingAttacked(colour)) {this.gameStatus = "check"; return;}

        this.gameStatus = "playing";
    }

    private checkPromotion(): void {
        const unit = this.currentSelectedUnit;

        if (!unit) {
            return;
        }

        if (unit.pieceType !== "pawn") {
            return;
        }

        if ((unit.colour === "white" && unit.position.y === 7) ||
            (unit.colour === "black" && unit.position.y === 0)) {
            this.promoteToQueen(unit);
        }
    }

    private promoteToQueen(unit:Unit):boolean{
        if (unit.pieceType !== "pawn"){return false;}
        
        const queen = new Unit(unit.position,unit.colour,"queen");
        queen.movements.push(new HorizontalMovement(), new VerticalMovement(), 
        new DiagonalMovement());

        this.gameState.replaceUnit(unit, queen);
        return true;
    }

    private getCastlingRook(king: Unit,kingside: boolean): Unit | undefined {

        const y = king.position.y;

        const rookX = kingside ? 7 : 0;

        const rook = this.gameState.getUnitAt({x: rookX,y: y});

        if (!rook) {return undefined;}

        if (rook.colour !== king.colour) {return undefined;}

        if (rook.pieceType !== "rook") {return undefined;}

        return rook;
    }

    private canCastle(king: Unit,kingside: boolean): boolean {

        if (king.hasMoved) {return false;}

        const rook = this.getCastlingRook(king,kingside);

        if (!rook) {return false;}

        if (rook.hasMoved) {return false;}

        if (!this.areCastlingSquaresEmpty(king, kingside)){return false;}

        //king cannot castle while currently check
        if (this.isKingAttacked(king.colour)){return false;}

        const y = king.position.y;

        const transitionPos = {
            x:kingside?5:3,
            y:y
        };

        const destinationPos = {
            x:kingside?6:2,
            y: y
        };

        //king cannot pass during check
        if (this.isPositionAttacked(transitionPos, king.colour)){return false;}
        if (this.isPositionAttacked(destinationPos, king.colour)){return false;}

        return true;
    }

    private isPositionAttacked(position: Position,colour: Colour): boolean {

        const enemyColour: Colour =colour === "white" ? "black" : "white";

        const enemyPackages =this.generateTeamAttackPositions(enemyColour);

        for (const pack of enemyPackages) {
            for (const attackedPosition of pack.positions) {

                if (
                    attackedPosition.x === position.x &&
                    attackedPosition.y === position.y
                ) {return true;}
            }
        }

        return false;
    }

    private areCastlingSquaresEmpty(king: Unit,kingside: boolean): boolean {

        const y = king.position.y;

        if (kingside) {
            const f = this.gameState.getUnitAt({ x: 5, y: y });
            const g = this.gameState.getUnitAt({ x: 6, y: y });
            return !f && !g;
        }

        const b = this.gameState.getUnitAt({ x: 1, y: y });
        const c = this.gameState.getUnitAt({ x: 2, y: y });
        const d = this.gameState.getUnitAt({ x: 3, y: y });

        return !b && !c && !d;
    }

    private performCastling(king: Unit, kingside: boolean): void {
    const rook = this.getCastlingRook(king, kingside);

        if (!rook) {return;}

        const y = king.position.y;

        const kingDestination: Position = {x: kingside ? 6:2,y: y};

        const rookDestination: Position = {x: kingside ? 5 : 3,y: y};

        this.gameState.moveUnit(king.position,kingDestination);

        this.gameState.moveUnit(rook.position,rookDestination);

        king.hasMoved = true;
        rook.hasMoved = true;
    }
    
    private isCheckmate(colour:Colour){
        if (!this.isKingAttacked(colour)){return false;}

        return !this.hasAnyLegalMove(colour);
    }

    private isStalemate(colour:Colour){
        if (this.isKingAttacked(colour)){return false;}

        return !this.hasAnyLegalMove(colour);
    }
    
}