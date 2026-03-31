import DATA from '../data/levels/level-01.json';
import { TypicalScene } from './TypicalScene';

export class Level01 extends TypicalScene {
    constructor() {
        super({ level: DATA });
    }
}
