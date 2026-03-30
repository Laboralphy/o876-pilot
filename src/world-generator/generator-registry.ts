import { CrackPlanetWG } from './weighted-random-cells/CrackPlanetWG';
import { DeepSpaceWG } from './weighted-random-cells/DeepSpaceWG';
import { ZeroWG } from './total-zero';
import { PrimMazeWG } from './prim-maze';

export const WORLD_GENERATORS = {
    crackplanet: CrackPlanetWG,
    deepspace: DeepSpaceWG,
    deeperspace: ZeroWG,
    prim: PrimMazeWG,
};
