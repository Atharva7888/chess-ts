//filter.ts
import {
    type Position,
    Unit,
    PawnMovement,
    type Colour,
} from "../data/data";
import {
    GameState
} from "../data/gameState"
import {
    OccupancyPackage,
    PositionPackage,
    type PawnPackage
} from "./engine"


export class filter{

    private gameState:GameState;
    constructor(gameState:GameState){
        this.gameState = gameState;
    }
    
    ///filter 1
    public occupancyFilter(unit:Unit, positions:Position[]):OccupancyPackage{

        //create occupancy
        const occupancyPackage:OccupancyPackage = new OccupancyPackage();

        //clear the candidates that has occupancy on them
        for (let i = 0; i < positions.length; i++){
            let candidateUnit = this.gameState.getUnitAt(positions[i]);
            
            //if candidate position is empty
            if (!candidateUnit){
                occupancyPackage.empty.push(positions[i]);
            }
            else if (candidateUnit.colour===unit.colour){//if friendly on candidatie pos
                occupancyPackage.friendly.push(positions[i]);
            }
            else { //if enemy on candidate pos
                occupancyPackage.enemy.push(positions[i]);
            }

        }

        return occupancyPackage;
    }

    //filter 2
    public blockFilter(_package:OccupancyPackage,vectors:Position[],unit:Unit):Position[]{
        let positions:Position[] = [];
        let northVectors: Position[] = [];
        let eastVectors: Position[] = [];
        let southVectors: Position[] = [];
        let westVectors: Position[] = [];

        let northEastVectors: Position[] = [];
        let northWestVectors: Position[] = [];
        let southEastVectors: Position[] = [];
        let southWestVectors: Position[] = [];

        let jumpVectors:Position[] = [];

        if (unit.movements.some(movement => movement instanceof PawnMovement)){
            positions = this.PawnConditionalFilter(vectors, unit, _package);
            return positions;
        }


        //sorting them vectors
        for (let i = 0; i < vectors.length; i++){
            const p:Position = vectors[i];

            const isKnightJump = (Math.abs(p.x) === 1 && Math.abs(p.y) === 2) ||
            (Math.abs(p.x) === 2 && Math.abs(p.y) === 1);
            if (isKnightJump){jumpVectors.push(vectors[i]);}
            else if (p.x === 0 && p.y > 0){northVectors.push(vectors[i]);}
            else if (p.x===0 && p.y < 0){southVectors.push(vectors[i]);}
            else if (p.x > 0 && p.y===0){eastVectors.push(vectors[i]);}
            else if (p.x < 0 && p.y===0){westVectors.push(vectors[i]);}
            else if (p.x>0 && p.y>0){northEastVectors.push(vectors[i]);}
            else if (p.x<0 && p.y<0){southWestVectors.push(vectors[i]);}
            else if (p.x<0 && p.y>0){northWestVectors.push(vectors[i]);}
            else if (p.x>0 && p.y<0){southEastVectors.push(vectors[i]);}
        }
        //sorting them from nearest to farthest positions from the origin
        let a: Position[][] = [
            northVectors.sort((a, b) => a.y - b.y),
            southVectors.sort((a, b) => b.y - a.y),
            eastVectors.sort((a, b) => a.x - b.x),
            westVectors.sort((a, b) => b.x - a.x),
            northEastVectors.sort((a, b) => a.x - b.x),
            northWestVectors.sort((a, b) => b.x - a.x),
            southEastVectors.sort((a, b) => a.x - b.x),
            southWestVectors.sort((a, b) => b.x - a.x),
        ]

        //convert the vectors in 'a' into positions
        for (let i = 0; i < a.length; i++){
            a[i] = a[i].map(pos => ({x: pos.x + unit.position.x,y: pos.y + unit.position.y}));
        }
        
        a = this.blockCutter(a, _package);
        positions = a.flat();
        positions.push(...this.jumpConditionalFilter(jumpVectors, unit, _package));
        return positions;
    }

    //filter 3
    private blockCutter(a:Position[][], _package:OccupancyPackage):Position[][]{
        
        for (let i = 0; i < a.length; i++){//loop through arrays in a
            let blocked:boolean = false;

            for (let j = 0; j < a[i].length; j++){//loop through each pos in the array

                for (let k = 0; k < _package.friendly.length; k++){//loop through friendly pos
                    //find the nearest friendly position
                    if (a[i][j].x===_package.friendly[k].x && a[i][j].y===_package.friendly[k].y){
                        //found the nearest friendly position
                        a[i].splice(j);
                        blocked = true;
                        break;
                    }
                }
                if (!blocked){
                    for (let k = 0; k < _package.enemy.length; k++){//loop through enemy pos
                        //find the nearest enemy position
                        if (a[i][j].x===_package.enemy[k].x && a[i][j].y===_package.enemy[k].y){
                            //found the nearest friendly position
                            a[i].splice(j+1);
                            blocked = true;
                            break;
                        }
                    }
                }
                if (blocked){break;}
            }
  
        }

        return a;
    }

    //filter 4
    private jumpConditionalFilter(vectors:Position[], unit:Unit, 
        _package:OccupancyPackage):Position[]
    { 
        let positions:Position[] = [];

        for (let i = 0; i < vectors.length; i++){
            const jumpPos:Position = {
                x: unit.position.x + vectors[i].x,
                y: unit.position.y + vectors[i].y
            };

            let isFriendly:boolean = false;

            for (let j = 0; j < _package.friendly.length; j++){
                if (
                    jumpPos.x === _package.friendly[j].x &&
                    jumpPos.y === _package.friendly[j].y
                )
                {
                    isFriendly = true;
                    break;
                }
            }
            if (!isFriendly){positions.push(jumpPos);}
        }

        return positions;
    }

    //filter 5
    private PawnConditionalFilter(vectors: Position[],unit: Unit,_package: OccupancyPackage):
        Position[] {

        const positions: Position[] = [];

        const pawnPackage: PawnPackage = {
            forward: [],
            doubleForward: [],
            captures: []
        };

        // classify vectors
        for (const v of vectors) {
            if (unit.colour === "white") {

                if (v.x === 0 && v.y === 1) {pawnPackage.forward.push(v);}
                else if (v.x === 0 && v.y === 2) {pawnPackage.doubleForward.push(v);}
                else if (
                    (v.x === -1 && v.y === 1) ||
                    (v.x === 1 && v.y === 1)
                ) {pawnPackage.captures.push(v);}

            }
            else {
                if (v.x === 0 && v.y === -1) {pawnPackage.forward.push(v);}
                else if (v.x === 0 && v.y === -2) {pawnPackage.doubleForward.push(v);}
                else if (
                    (v.x === -1 && v.y === -1) ||
                    (v.x === 1 && v.y === -1)
                ) {pawnPackage.captures.push(v);}
            }
        }

        // forwad
        if (pawnPackage.forward.length > 0) {
            const v = pawnPackage.forward[0];

            const forward: Position = {
                x: unit.position.x + v.x,
                y: unit.position.y + v.y
            };

            const occupied =
                _package.friendly.some(p =>p.x === forward.x && p.y === forward.y) ||
                _package.enemy.some(p =>p.x === forward.x && p.y === forward.y);

            if (!occupied) {
                positions.push(forward);

                // double step
                if (pawnPackage.doubleForward.length > 0) {

                    const v2 = pawnPackage.doubleForward[0];

                    const doubleForward: Position = {
                        x: unit.position.x + v2.x,
                        y: unit.position.y + v2.y
                    };

                    const occupiedAt2 =_package.friendly.some(p =>p.x === doubleForward.x &&
                            p.y === doubleForward.y
                        ) ||
                        _package.enemy.some(p =>p.x === doubleForward.x &&p.y === doubleForward.y);

                    if (!occupiedAt2) {
                        positions.push(doubleForward);
                    }
                }
            }
        }

        // capture
        for (const v of pawnPackage.captures) {

            const capture: Position = {
                x: unit.position.x + v.x,
                y: unit.position.y + v.y
            };

            const enemyExists = _package.enemy.some(p =>
                p.x === capture.x &&
                p.y === capture.y
            );

            if (enemyExists) {
                positions.push(capture);
            }
        }

        return positions;
    }

    //filter 6
    public isKingCheck(turn:Colour, posPacks:PositionPackage[]):boolean{
        const king = this.gameState.getUnitByPieceType("king", turn);
        if (!king){throw new Error(`${turn} king not found`);}
        for (let i = 0; i < posPacks.length; i++){
            for (let j = 0; j < posPacks[i].positions.length; j++){
                if (
                    king.position.x === posPacks[i].positions[j].x &&
                    king.position.y === posPacks[i].positions[j].y
                ){return true;}
            }
        }

        return false;
    }

    //filter 7
    public whichPiecesThreateningKing(turn:Colour, posPacks:PositionPackage[]):PositionPackage[]{
        let unitsThreateningKing:PositionPackage[] = [];
        const king = this.gameState.getUnitByPieceType("king", turn);
        if (!king){throw new Error(`${turn} king not found`);}

        for (let i = 0; i < posPacks.length; i++){
            for (let j = 0; j < posPacks[i].positions.length; j++){
                if (
                    king.position.x === posPacks[i].positions[j].x &&
                    king.position.y === posPacks[i].positions[j].y
                )
                {unitsThreateningKing.push(posPacks[i]); break;}
            }
        }

        return unitsThreateningKing;
    }

    //filter 8
    public whichPiecesThreateningPosition(position: Position,posPacks: PositionPackage[]): PositionPackage[] {

        const unitsThreateningPosition: PositionPackage[] = [];

        for (let i = 0; i < posPacks.length; i++) {

            for (let j = 0; j < posPacks[i].positions.length; j++) {

                if (
                    position.x === posPacks[i].positions[j].x &&
                    position.y === posPacks[i].positions[j].y
                ) {
                    unitsThreateningPosition.push(posPacks[i]);
                    break;
                }
            }
        }

        return unitsThreateningPosition;
    }

    //filter 9
    public whichUnitsMovesBlocksKingCheck(turn:Colour, 
        unitsThreateningKing:PositionPackage[], friendlyPositions:PositionPackage[]):PositionPackage[]{
        
        const unitsThatCanBlock: PositionPackage[] = [];

        // Double check cannot be blocked.
        if (unitsThreateningKing.length !== 1) {return unitsThatCanBlock;}

        const king = this.gameState.getUnitByPieceType("king", turn);

        if (!king) {throw new Error(`${turn} king not found`);}

        const checker = unitsThreateningKing[0].unit;

        // Only sliding pieces can be blocked.
        if (
            checker.pieceType !== "rook" &&
            checker.pieceType !== "bishop" &&
            checker.pieceType !== "queen"
        ) {return unitsThatCanBlock;}

        const dx = Math.sign(king.position.x - checker.position.x);
        const dy = Math.sign(king.position.y - checker.position.y);

        const blockingPositions: Position[] = [];

        let x = checker.position.x + dx;
        let y = checker.position.y + dy;

        while (
            x !== king.position.x ||
            y !== king.position.y
        ) {
            blockingPositions.push({ x, y });

            x += dx;
            y += dy;
        }

        for (let i = 0; i < friendlyPositions.length; i++) {

            const friendlyPackage = friendlyPositions[i];

            // King is handled separately.
            if (friendlyPackage.unit.pieceType === "king") {continue;}

            const validBlockingPositions: Position[] = [];

            for (let j = 0; j < friendlyPackage.positions.length; j++) {

                const position = friendlyPackage.positions[j];

                for (let k = 0; k < blockingPositions.length; k++) {

                    if (
                        position.x === blockingPositions[k].x &&
                        position.y === blockingPositions[k].y
                    ) {
                        validBlockingPositions.push(position);
                        break;
                    }
                }
            }

            if (validBlockingPositions.length > 0) {
                unitsThatCanBlock.push(
                    new PositionPackage(
                        friendlyPackage.unit,
                        validBlockingPositions
                    )
                );
            }
        }

        return unitsThatCanBlock;
    }

    public filterKingPositions(positions: Position[],enemyPositions:PositionPackage[]):
    Position[] {
        const safePositions: Position[] = [];

        for (let i = 0; i < positions.length; i++) {

            const threats =
                this.whichPiecesThreateningPosition(
                    positions[i],
                    enemyPositions
                );

            if (threats.length === 0) {
                safePositions.push(positions[i]);
            }
        }

        return safePositions;
    }

    public whichUnitsCanCaptureAttackingUnit(
    threateningPieces: PositionPackage[],
    friendlyPositions: PositionPackage[]
    ): PositionPackage[] {

        const attackers: PositionPackage[] = [];

        for (let i = 0; i < friendlyPositions.length; i++) {

            const friendlyUnit = friendlyPositions[i];

            for (let j = 0; j < threateningPieces.length; j++) {

                const checkerPosition =
                    threateningPieces[j].unit.position;

                for (let k = 0; k < friendlyUnit.positions.length; k++) {

                    if (
                        friendlyUnit.positions[k].x === checkerPosition.x &&
                        friendlyUnit.positions[k].y === checkerPosition.y
                    ) {
                        attackers.push(friendlyUnit);
                        break;
                    }
                }

                //this unit already proved it can capture a checker
                if (attackers.includes(friendlyUnit)) {
                    break;
                }
            }
        }

        return attackers;
    }
    //this syntax positioning pmo
    public filterCapturePositions(
        positions:Position[],
        threateningPieces:PositionPackage[]
    ):Position[]{
        const capturePositions:Position[] = [];

        for (let i =0; i < threateningPieces.length; i++){
            const checkerPos = threateningPieces[i].unit.position;
            for (let j = 0; j < positions.length; j++){
                if (
                    positions[j].x === checkerPos.x &&
                    positions[j].y === checkerPos.y
                ){capturePositions.push(positions[j]);}
            }
        }

        return capturePositions;
    }
   
}