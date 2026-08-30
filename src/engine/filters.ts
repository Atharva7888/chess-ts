//filter.ts
import {
    type Position,
    Unit,
    PawnMovement
} from "../data/data";
import {
    GameState
} from "../data/gameState"
import {
    OccupancyPackage,
    type PawnPackage
} from "./engine"

export class filter{

    private gameState:GameState;
    constructor(gameState:GameState){
        this.gameState = gameState;
    }
    
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
            if (p.x === 0 && p.y > 0){northVectors.push(vectors[i]);}
            else if (p.x===0 && p.y < 0){southVectors.push(vectors[i]);}
            else if (p.x > 0 && p.y===0){eastVectors.push(vectors[i]);}
            else if (p.x < 0 && p.y===0){westVectors.push(vectors[i]);}
            else if (p.x>0 && p.y>0){northEastVectors.push(vectors[i]);}
            else if (p.x<0 && p.y<0){southWestVectors.push(vectors[i]);}
            else if (p.x<0 && p.y>0){northWestVectors.push(vectors[i]);}
            else if (p.x>0 && p.y<0){southEastVectors.push(vectors[i]);}
            else if (
                (p.x===-1 && p.y===-2) ||
                (p.x===1 && p.y===2) ||
                (p.x===2 && p.y===1) ||
                (p.x===-2 && p.y===-1)
            ){jumpVectors.push(vectors[i]);}
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

    private PawnConditionalFilter(vectors:Position[], unit:Unit, _package:OccupancyPackage):Position[]{
        let positions:Position[] = [];
        const pawnPackage:PawnPackage = {
            forward:[],
            doubleForward:[],
            captures:[]
        };

        for (let i = 0; i < vectors.length; i++){
            const v = vectors[i];
            if (unit.colour==='white'){
                if (v.x===0 && v.y===1){pawnPackage.forward.push(v);}
                else if (v.x===0 && v.y===2){pawnPackage.doubleForward.push(v);}
                else if (
                    (v.x===-1 && v.y===1) ||
                    (v.x===1 && v.y===1)
                ){pawnPackage.captures.push(v);}
            }
            else if (unit.colour==='black') {
                if (v.x===0 && v.y===-1){pawnPackage.forward.push(v);}
                else if (v.x===0 && v.y===-2){pawnPackage.doubleForward.push(v);}
                else if (
                    (v.x===-1 && v.y===-1) ||
                    (v.x===1 && v.y===-1)
                ) {pawnPackage.captures.push(v);}
            }
        }

        if (pawnPackage.forward.length > 0){
            // Check whether the one-step square is occupied
            let occupiedAt1 = false;
            for (let i=0; i < _package.friendly.length; i++) {
                if (
                    _package.friendly[i].x === pawnPackage.forward[0].x &&
                    _package.friendly[i].y === pawnPackage.forward[0].y
                ) {
                    occupiedAt1 = true;
                    break;
                }
            }
            if (!occupiedAt1) {
                for (let i = 0; i < _package.enemy.length; i++) {
                    if (
                        _package.enemy[i].x === pawnPackage.forward[0].x &&
                        _package.enemy[i].y === pawnPackage.forward[0].y
                    ) {
                        occupiedAt1 = true;
                        break;
                    }
                }
            }
            if (!occupiedAt1) {
                positions.push(pawnPackage.forward[0]);
            }
            //check for doublr step
            if (!occupiedAt1 && pawnPackage.doubleForward.length > 0) {
                let occupiedAt2 = false;
                for (let i = 0; i < _package.friendly.length; i++) {
                    if (
                        _package.friendly[i].x === pawnPackage.doubleForward[0].x &&
                        _package.friendly[i].y === pawnPackage.doubleForward[0].y
                    ) {
                        occupiedAt2 = true;
                        break;
                    }
                }
                if (!occupiedAt2) {
                    for (let i=0; i < _package.enemy.length; i++) {
                        if (
                            _package.enemy[i].x === pawnPackage.doubleForward[0].x &&
                            _package.enemy[i].y === pawnPackage.doubleForward[0].y
                        ) {
                            occupiedAt2 = true;
                            break;
                        }
                    }
                }
                if (!occupiedAt2) {positions.push(pawnPackage.doubleForward[0]);}
            }
        }
        if (pawnPackage.captures.length > 0){
            //check if either diagonal has enemy
            for (let j=0; j < pawnPackage.captures.length; j++) {

                for (let i=0; i < _package.enemy.length; i++) {

                    if (
                        pawnPackage.captures[j].x===_package.enemy[i].x &&
                        pawnPackage.captures[j].y===_package.enemy[i].y
                    ) {
                        positions.push(pawnPackage.captures[j]);
                        break;
                    }
                }
            }
        }
        
        return positions;
    }
}