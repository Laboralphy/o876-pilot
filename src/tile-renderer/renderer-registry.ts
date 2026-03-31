import { ISeededRNG } from '../libs/mulberry32/ISeededRNG';
import { ITextureSource } from './ITextureSource';
import { ITileRenderer } from './ITileRenderer';
import { SpaceTileRenderer } from './themes/space/SpaceTileRenderer';
import { AstroRockTileRenderer } from './themes/astro-rock/AstroRockTileRenderer';

export type TileRendererConstructor = new (
    tileSize: number,
    rng: ISeededRNG,
    textureSource: ITextureSource
) => ITileRenderer;

export const TILE_RENDERERS: Record<string, TileRendererConstructor> = {
    space: SpaceTileRenderer,
    'astro-rock': AstroRockTileRenderer,
};
