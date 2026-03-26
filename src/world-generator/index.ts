import { ISeededRNG } from '../libs/mulberry32/ISeededRNG';
import { IWorldGenerator } from './IWorldGenerator';
import { CrackPlanetWG } from './weighted-random-cells/CrackPlanetWG';
import { DeepSpaceWG } from './weighted-random-cells/DeepSpaceWG';
import { PrimMazeWG } from './prim-maze';
import { ZeroWG } from './total-zero';

export const WORLD_GENERATORS = {
    crackplanet: CrackPlanetWG,
    deepspace: DeepSpaceWG,
    deeperspace: ZeroWG,
    prim: PrimMazeWG,
};

export function createWorldGenerator(
    theme: string,
    width: number,
    height: number,
    rng: ISeededRNG
): IWorldGenerator {
    function buildWorldGenerator(
        theme: keyof typeof WORLD_GENERATORS,
        width: number,
        height: number,
        rng: ISeededRNG
    ): IWorldGenerator {
        return new WORLD_GENERATORS[theme](rng, width, height);
    }
    if (theme in WORLD_GENERATORS) {
        return buildWorldGenerator(theme as keyof typeof WORLD_GENERATORS, width, height, rng);
    } else {
        throw new ReferenceError(`Unknown world generator: ${theme}`);
    }
}
