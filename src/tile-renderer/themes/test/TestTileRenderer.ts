import { TileRenderer } from '../../TileRenderer';
import { drawGrayRock } from './drawing-functions/gray-rock';
import { TileDefinition } from '../../ITileRenderer';
import { TILE_DATA } from './tile-data';
import { ISeededRNG } from '../../../libs/mulberry32/ISeededRNG';
import { ITextureSource } from '../../ITextureSource';

export class TestTileRenderer extends TileRenderer<TileDefinition> {
    constructor(textureSource: ITextureSource, tileSize: number, rng: ISeededRNG) {
        super(TILE_DATA, tileSize, rng, textureSource);
    }

    setup(): void {
        this.declareDrawingFunction('rock', drawGrayRock);
    }
}
