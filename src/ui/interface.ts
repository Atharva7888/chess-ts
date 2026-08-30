//interface.ts
import type { Position } from "../data/data";
import {
    Engine
} from "../engine/engine"

export class Interface{
    private engine:Engine;
    constructor(engine:Engine){
        this.engine = engine;
    }

    public SelectSquare(_x:number, _y:number):void{
        const pos:Position = {x:_x, y:_y};
        this.engine.SelectUnit(pos);
    }

}