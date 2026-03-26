import { WeightedRandomCells } from './WeightedRandomCells';
import { ISeededRNG } from '../../libs/mulberry32/ISeededRNG';

export class CrackPlanetWG extends WeightedRandomCells {
    constructor(rng: ISeededRNG, worldWidth: number, worldHeight: number) {
        super(
            [
                {
                    id: 0,
                    weight: 65,
                },
                {
                    id: 11,
                    weight: 18,
                },
                {
                    id: 12,
                    weight: 10,
                },
                {
                    id: 13,
                    weight: 5,
                },
                {
                    id: 4,
                    weight: 2,
                },
            ],
            worldWidth,
            worldHeight,
            rng
        );
    }
}
