import { ITileRenderer } from './ITileRenderer';
import { ISeededRNG } from '../libs/mulberry32/ISeededRNG';
import { ITextureSource } from './ITextureSource';
import { TILE_RENDERERS } from './renderer-registry';

export function createTileRenderer(
    textureSource: ITextureSource,
    theme: string,
    tileSize: number,
    rng: ISeededRNG
): ITileRenderer {
    if (theme in TILE_RENDERERS) {
        return new TILE_RENDERERS[theme](textureSource, tileSize, rng);
    }
    throw new ReferenceError(`Unknown tile renderer: ${theme}`);
}
