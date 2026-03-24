import { WorldScene } from '../world-scene/WorldScene';
import DATA from '../data/levels/level-01.json';

export class Level01 extends WorldScene {
    constructor() {
        super({ level: DATA });
    }
}
