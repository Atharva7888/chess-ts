//data.ts

export interface Position{
    x: number;
    y: number;
}

export type Colour = "black" | "white";

export type PieceType = 
    |"rook"
    |"knight"
    |"bishop"
    |"queen"
    |"king"
    |"pawn";

function isValidPosition(pos:Position):boolean{
        if (pos.x >= 0 && pos.y < 8 && pos.x < 8 && pos.y >= 0){
            return true;
        }
        return false;
}
//MOvements
export abstract class Movement{
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

export class PawnMovement extends Movement {
    returnPositions(currentPosition: Position,colour: Colour): Position[] {

        const possiblePositions: Position[] = [];
        // white pawm
        if (colour === "white") {
            const candidates: Position[] = [
                {
                    x: currentPosition.x,
                    y: currentPosition.y + 1
                },
                {
                    x: currentPosition.x - 1,
                    y: currentPosition.y + 1
                },
                {
                    x: currentPosition.x + 1,
                    y: currentPosition.y + 1
                }
            ];

            console.log("White Pawn:", currentPosition);
            console.log("Candidates:", candidates);

            for (const candidate of candidates) {
                console.log(
                    "Candidate:",candidate,
                    "valid:",isValidPosition(candidate)
                );

                if (isValidPosition(candidate)) {possiblePositions.push(candidate);}
            }

            // white initial double step
            const doubleStep: Position = {
                x: currentPosition.x,
                y: currentPosition.y + 2
            };

            if (currentPosition.y === 1 && isValidPosition(doubleStep)) {
                possiblePositions.push(doubleStep);
            }
        }

        //black pawn
        else if (colour === "black") {
            const candidates: Position[] = [
                {
                    x: currentPosition.x,
                    y: currentPosition.y - 1
                },
                {
                    x: currentPosition.x - 1,
                    y: currentPosition.y - 1
                },
                {
                    x: currentPosition.x + 1,
                    y: currentPosition.y - 1
                }
            ];

            console.log("Black Pawn:", currentPosition);
            console.log("Candidates:", candidates);

            for (const candidate of candidates) {

                console.log(
                    "Candidate:",candidate,
                    "valid:",isValidPosition(candidate)
                );

                if (isValidPosition(candidate)) {possiblePositions.push(candidate);}
            }

            // blacks initial double step
            const doubleStep: Position = {
                x: currentPosition.x,
                y: currentPosition.y - 2
            };

            if (currentPosition.y === 6 && isValidPosition(doubleStep)
            ) {possiblePositions.push(doubleStep);}
        }

        return possiblePositions;
    }
}

//unit classes
export class Unit{
    public position: Position;
    public colour: Colour;
    public movements: Movement[] = [];
    public pieceType:PieceType;

    constructor(position: Position, colour: Colour, pieceType:PieceType){
        this.position = position;
        this.colour = colour;
        this.pieceType = pieceType;
    }
}




