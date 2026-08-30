//data.ts

export interface Position{
    x: number;
    y: number;
}

export type Colour = "black" | "white";

function isValidPosition(pos:Position):boolean{
        if (pos.x >= 0 && pos.y < 8 && pos.x < 8 && pos.y >= 0){
            return true;
        }
        return false;
}
//MOvements
abstract class Movement{
    abstract returnPositions(currentPosition: Position, colour:Colour): Position[];
}

export class HorizontalMovement extends Movement{
    override returnPositions(currentPosition:Position): Position[]{
        let possiblePositions: Position[] = [];

        //to right
        for (let i=currentPosition.x+1; i < 8; i++){
            let position: Position = {x: i, y: currentPosition.y};
            possiblePositions.push(position);
        }
        //to left
        for (let i=currentPosition.x-1; i >= 0; i--){
            let position: Position = {x: i, y: currentPosition.y};
            possiblePositions.push(position);
        }
        return possiblePositions;
    }
}

export class VerticalMovement extends Movement{
    override returnPositions(currentPosition:Position): Position[]{
        let possiblePositions: Position[] = [];

        //to top (from player side)
        for (let i=currentPosition.y+1; i < 8; i++){
            let position: Position = {x: currentPosition.x, y: i};
            possiblePositions.push(position);
        }
        //to bottom (from player side)
        for (let i=currentPosition.y-1; i >= 0; i--){
            let position: Position = {x: currentPosition.x, y: i};
            possiblePositions.push(position);
        }
        return possiblePositions;
    }
}

export class KingMovement extends Movement{
    override returnPositions(currentPosition:Position):Position[]{
        let possiblePositions: Position[] = [];
        
        let candidates:Position[] = [
            {x:currentPosition.x+1, y:currentPosition.y},
            {x:currentPosition.x-1, y:currentPosition.y},
            {x:currentPosition.x, y:currentPosition.y+1},
            {x:currentPosition.x, y:currentPosition.y-1},

            {x:currentPosition.x+1, y:currentPosition.y+1},
            {x:currentPosition.x-1, y:currentPosition.y+1},
            {x:currentPosition.x+1, y:currentPosition.y-1},
            {x:currentPosition.x-1, y:currentPosition.y-1}
        ];

        for (let i = 0; i < candidates.length; i++){
            if (isValidPosition(candidates[i])){
                possiblePositions.push(candidates[i]);
            }
        }

        return possiblePositions;
    }
}

export class DiagonalMovement extends Movement{
    override returnPositions(currentPosition:Position): Position[]{
        let possiblePositions: Position[] = [];

        //diagonaly top right (from player side)
        for (let i=1; (currentPosition.x+i<8 && currentPosition.y+i<8); i++){
            let position: Position = {x: currentPosition.x+i, y: currentPosition.y+i};
            possiblePositions.push(position);
        }
        //diagonally bottom left (from player side)
        for (let i=1; (currentPosition.x-i>=0 && currentPosition.y-i>=0); i++){
            let position: Position = {x: currentPosition.x-i, y: currentPosition.y-i};
            possiblePositions.push(position);
        }
        //diagonally top left
        for (let i=1; (currentPosition.x-i>=0 && currentPosition.y+i<8); i++){
            let position: Position = {x: currentPosition.x-i, y: currentPosition.y+i};
            possiblePositions.push(position);
        }
        //diagonally bottom right
        for (let i=1; (currentPosition.x+i<8 && currentPosition.y-i>=0); i++){
            let position: Position = {x: currentPosition.x+i, y: currentPosition.y-i};
            possiblePositions.push(position);
        }
        return possiblePositions;
    }
}

export class KnightMovement extends Movement{
    override returnPositions(currentPosition:Position): Position[]{
        let possiblePositions: Position[] = [];

        let candidates:Position[] = [
            {x:currentPosition.x+1, y:currentPosition.y+2},
            {x:currentPosition.x-1, y:currentPosition.y-2},
            {x:currentPosition.x+1, y:currentPosition.y-2},
            {x:currentPosition.x-1, y:currentPosition.y+2},

            {x:currentPosition.x+2, y:currentPosition.y+1},
            {x:currentPosition.x-2, y:currentPosition.y-1},
            {x:currentPosition.x+2, y:currentPosition.y-1},
            {x:currentPosition.x-2, y:currentPosition.y+1}
        ];
        
        for (let i = 0; i < candidates.length; i++){
            if (isValidPosition(candidates[i])){
                possiblePositions.push(candidates[i]);
            }
        }
        
        return possiblePositions;
    }

    
}

export class PawnMovement extends Movement{
    returnPositions(currentPosition:Position, colour:Colour): Position[]{
        let possiblePositions: Position[] = [];

        //for white pawn
        if (colour==="white")
        {
            let candidates:Position[] = [
                {x:currentPosition.x, y:currentPosition.y+1},
                {x:currentPosition.x-1, y:currentPosition.y+1},
                {x:currentPosition.x+1, y:currentPosition.y+1}
            ];
            for (let i = 0; i < candidates.length; i++){
                if (isValidPosition(candidates[i])){
                    possiblePositions.push(candidates[i]);
                }
            }
            let doubleStep: Position = {x:currentPosition.x, y:currentPosition.y+2}; 
            if (currentPosition.y===1 && 
                isValidPosition(doubleStep)){
                possiblePositions.push(doubleStep);
            }
        }
        //for black pawn
        if (colour==="black")
        {
            let candidates:Position[] = [
                {x:currentPosition.x, y:currentPosition.y-1},
                {x:currentPosition.x-1, y:currentPosition.y-1},
                {x:currentPosition.x+1, y:currentPosition.y-1}
            ];

            for (let i = 0; i < candidates.length; i++){
                if (isValidPosition(candidates[i])){
                    possiblePositions.push(candidates[i]);
                }
            }

            let doubleStep: Position = {x:currentPosition.x, y:currentPosition.y-2}; 
            if (currentPosition.y===6 && isValidPosition(doubleStep)){
                possiblePositions.push(doubleStep);
            }
        }
        return possiblePositions;
    }
}

//unit classes
export class Unit{
    public position: Position;
    public colour: Colour;
    public movements: Movement[] = [];

    constructor(position: Position, colour: Colour){
        this.position = position;
        this.colour = colour;
    }
}




