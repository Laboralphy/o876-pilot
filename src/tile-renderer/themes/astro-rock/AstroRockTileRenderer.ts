import { TileRenderer } from '../../TileRenderer';
import { drawAstroRock } from './drawing-functions/astro-rock';
import { TileDefinition } from '../../ITileRenderer';
import { TILE_DATA } from './tile-data';
import { ISeededRNG } from '../../../libs/mulberry32/ISeededRNG';
import { ITextureSource } from '../../ITextureSource';
import { drawGrayRock } from './drawing-functions/gray-rock';
import { drawDarkerAstroRock } from './drawing-functions/darker-astro-rock';

export class AstroRockTileRenderer extends TileRenderer<TileDefinition> {
    constructor(tileSize: number, rng: ISeededRNG, textureSource: ITextureSource) {
        super(TILE_DATA, tileSize, rng, textureSource);
    }

    setup(): void {
        this.declareDrawingFunction('astro-rock', drawAstroRock);
        this.declareDrawingFunction('gray-rock', drawGrayRock);
        this.declareDrawingFunction('darker-astro-rock', drawDarkerAstroRock);
    }
}
