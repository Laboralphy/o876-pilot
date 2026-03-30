import { TileRenderer } from '../../TileRenderer';
import { drawStarfield } from './drawing-functions/starfield';
import { TileDefinition } from '../../ITileRenderer';
import { TILE_DATA } from './tile-data';
import { ISeededRNG } from '../../../libs/mulberry32/ISeededRNG';
import { ITextureSource } from '../../ITextureSource';
import { drawDeeperStarfield } from './drawing-functions/deeperStarfield';

export class SpaceTileRenderer extends TileRenderer<TileDefinition> {
    constructor(tileSize: number, rng: ISeededRNG, textureSource: ITextureSource) {
        super(TILE_DATA, tileSize, rng, textureSource);
    }

    setup(): void {
        this.declareDrawingFunction('starfield', drawStarfield);
        this.declareDrawingFunction('deeper-starfield', drawDeeperStarfield);
    }
}
