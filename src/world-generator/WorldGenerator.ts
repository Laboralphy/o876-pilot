import { IWorldGenerator } from './IWorldGenerator';
import { NumberGrid } from '../libs/grid/NumberGrid';

export abstract class WordGenerator extends NumberGrid implements IWorldGenerator {
    /**
     * Start generating world, filling the cell map with number values
     */
    abstract generate(): number[][];
}
