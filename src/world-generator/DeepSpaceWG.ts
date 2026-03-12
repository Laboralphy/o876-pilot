import { WeightedRandomCells } from './WeightedRandomCells';
import { ISeededRNG } from '../libs/mulberry32/ISeededRNG';

export class DeepSpaceWG extends WeightedRandomCells {
    constructor(rng: ISeededRNG, worldWidth: number, worldHeight: number) {
        super(
            [
                {
                    id: 0,
                    weight: 75,
                },
                {
                    id: 1,
                    weight: 25,
                },
            ],
            worldWidth,
            worldHeight,
            rng
        );
    }
}
