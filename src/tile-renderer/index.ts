import { AstroTileRenderer } from './themes/astro/AstroTileRenderer';
import { ITileRenderer } from './ITileRenderer';
import { ISeededRNG } from '../libs/mulberry32/ISeededRNG';
import { DeeperSpaceTileRenderer } from './themes/astro/DeeperSpaceTileRenderer';
import { DeepSpaceTileRenderer } from './themes/astro/DeepSpaceTileRenderer';

export const TILE_RENDERERS = {
    astro: AstroTileRenderer,
    deepspace: DeepSpaceTileRenderer,
    deeperspace: DeeperSpaceTileRenderer,
};

export function createTileRenderer(
    theme: string,
    tileSize: number,
    rng: ISeededRNG
): ITileRenderer {
    function buildTileRenderer(
        theme: keyof typeof TILE_RENDERERS,
        tileSize: number,
        rng: ISeededRNG
    ): ITileRenderer {
        return new TILE_RENDERERS[theme](tileSize, rng);
    }
    if (theme in TILE_RENDERERS) {
        return buildTileRenderer(theme as keyof typeof TILE_RENDERERS, tileSize, rng);
    } else {
        throw new ReferenceError(`Unknown tile renderer: ${theme}`);
    }
}
