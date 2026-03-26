import { WordGenerator } from '../WorldGenerator';
import { ISeededRNG } from '../../libs/mulberry32/ISeededRNG';

/**
 * Fills every cell with 0. Not really a generator — tile selection
 * is delegated to the layer builder.
 */
export class ZeroWG extends WordGenerator {
    constructor(
        protected readonly rng: ISeededRNG,
        worldWidth: number,
        worldHeight: number
    ) {
        super(worldWidth, worldHeight);
    }

    generate(): number[][] {
        this.walkCells(() => 0);
        return this.cellMap;
    }
}
