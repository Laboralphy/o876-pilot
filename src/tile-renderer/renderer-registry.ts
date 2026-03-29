import { ISeededRNG } from '../libs/mulberry32/ISeededRNG';
import { ITextureSource } from './ITextureSource';
import { ITileRenderer } from './ITileRenderer';
import { TestTileRenderer } from './themes/test/TestTileRenderer';

export type TileRendererConstructor = new (
    textureSource: ITextureSource,
    tileSize: number,
    rng: ISeededRNG
) => ITileRenderer;

export const TILE_RENDERERS: Record<string, TileRendererConstructor> = {
    test: TestTileRenderer,
};
