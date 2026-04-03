import { TileRenderer } from '../../TileRenderer';
import { drawAstroRock } from './drawing-functions/astro-rock';
import { TileDefinition } from '../../ITileRenderer';
import { TILE_DATA } from './tile-data';
import { ISeededRNG } from '../../../libs/mulberry32/ISeededRNG';
import { ITextureSource } from '../../ITextureSource';
import { drawGrayRock } from './drawing-functions/gray-rock';
import { drawDarkerAstroRock } from './drawing-functions/darker-astro-rock';
import { drawErodedSurface } from './drawing-functions/eroded-surface';
import { drawErodedSurfaceRoundLeft } from './drawing-functions/eroded-surface-round-left';
import { drawErodedSurfaceRoundRight } from './drawing-functions/eroded-surface-round-right';
import { drawErodedSurfaceRoundBoth } from './drawing-functions/eroded-surface-round-both';

export class AstroRockTileRenderer extends TileRenderer<TileDefinition> {
    constructor(tileSize: number, rng: ISeededRNG, textureSource: ITextureSource) {
        super(TILE_DATA, tileSize, rng, textureSource);
    }

    setup(): void {
        this.declareDrawingFunction('astro-rock', drawAstroRock);
        this.declareDrawingFunction('gray-rock', drawGrayRock);
        this.declareDrawingFunction('darker-astro-rock', drawDarkerAstroRock);
        this.declareDrawingFunction('eroded-surface', drawErodedSurface);
        this.declareDrawingFunction('eroded-surface-round-left', drawErodedSurfaceRoundLeft);
        this.declareDrawingFunction('eroded-surface-round-right', drawErodedSurfaceRoundRight);
        this.declareDrawingFunction('eroded-surface-round-both', drawErodedSurfaceRoundBoth);
    }
}
