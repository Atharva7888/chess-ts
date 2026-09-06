//gameState.ts
import {
    Unit, 
    type Position, 
    type PieceType,
    type Movement,
    HorizontalMovement, 
    VerticalMovement, 
    DiagonalMovement, 
    KnightMovement, 
    PawnMovement,
    KingMovement,
    type Colour
} from "./data";


export class GameState{
    private unitState: Unit[] = [];
    constructor(){
        const piecesSetup :{
            pos: Position;
            pieceType: PieceType;
            moves: Movement[];}[]=[
            //BACK ROW (y = 0)
            { pos: { x: 0, y: 0 }, pieceType:"rook", moves: [new HorizontalMovement(), new VerticalMovement()]}, // Rook1
            { pos: { x: 1, y: 0 }, pieceType:"knight",moves: [new KnightMovement()] },                          // Knight1
            { pos: { x: 2, y: 0 }, pieceType:"bishop",moves: [new DiagonalMovement()] },                        // Bishop1
            { pos: { x: 3, y: 0 }, pieceType:"queen",moves: [new HorizontalMovement(), new VerticalMovement(), new DiagonalMovement()] }, // Queen
            { pos: { x: 4, y: 0 }, pieceType:"king",moves: [new KingMovement()] },                            // King
            { pos: { x: 5, y: 0 }, pieceType:"bishop",moves: [new DiagonalMovement()] },                        // Bishop2
            { pos: { x: 6, y: 0 }, pieceType:"knight",moves: [new KnightMovement()] },                          // Knight2
            { pos: { x: 7, y: 0 }, pieceType:"rook",moves: [new HorizontalMovement(), new VerticalMovement()] }, // Rook2

            //PAWN ROW (y = 1)
            { pos: { x: 0, y: 1 }, pieceType:"pawn",moves: [new PawnMovement()] },
            { pos: { x: 1, y: 1 }, pieceType:"pawn",moves: [new PawnMovement()] },
            { pos: { x: 2, y: 1 }, pieceType:"pawn",moves: [new PawnMovement()] },
            { pos: { x: 3, y: 1 }, pieceType:"pawn",moves: [new PawnMovement()] },
            { pos: { x: 4, y: 1 }, pieceType:"pawn",moves: [new PawnMovement()] },
            { pos: { x: 5, y: 1 }, pieceType:"pawn",moves: [new PawnMovement()] },
            { pos: { x: 6, y: 1 }, pieceType:"pawn",moves: [new PawnMovement()] },
            { pos: { x: 7, y: 1 }, pieceType:"pawn",moves: [new PawnMovement()] }
        ];


        //adding black units
        for (let i = 0; i < piecesSetup.length; i++){

            //white states
            const p_white = new Unit(piecesSetup[i].pos, 'white', piecesSetup[i].pieceType);
            p_white.movements.push(...piecesSetup[i].moves);
            this.unitState.push(p_white);

            //black units
            let updatedPos: Position = {x:0, y: 0};
            if (piecesSetup[i].pos.y===0){
                updatedPos = {x:piecesSetup[i].pos.x, y:7};
            }
            else if (piecesSetup[i].pos.y===1){
                updatedPos = {x:piecesSetup[i].pos.x, y:6};
            }
            const p_black = new Unit(updatedPos, 'black', piecesSetup[i].pieceType);
            p_black.movements.push(...piecesSetup[i].moves);
            this.unitState.push(p_black);
        }

        

    }

    public getUnits(): readonly Unit[]{
        return this.unitState;
    }

    public getUnitAt(pos:Position):Unit | undefined{
        return this.unitState.find(u => u.position.x === pos.x && u.position.y === pos.y);
    }

    public moveUnit(from:Position, to:Position): boolean{
        const activeUnit = this.getUnitAt(from);

        if (!activeUnit) {return false;}
        activeUnit.position = to;
        return true;
    }

    public getUnitByPieceType(pt:PieceType, colour:Colour):Unit|undefined{
        for (let i = 0; i < this.unitState.length; i++){
            if (this.unitState[i].pieceType === pt && this.unitState[i].colour===colour){
                return this.unitState[i];
            }
        }
        return undefined;
    }

    public removeUnitAt(pos: Position): void {
        this.unitState = this.unitState.filter(
            unit => !(unit.position.x === pos.x && unit.position.y === pos.y)
        );
    }

    public addUnit(unit: Unit): void {this.unitState.push(unit);}

    public replaceUnit(oldUnit: Unit, newUnit: Unit): void {

        const oldUnitIndex = this.unitState.indexOf(oldUnit);

        if (oldUnitIndex === -1) {return;}

        this.unitState.splice(oldUnitIndex, 1, newUnit);
    }


}

