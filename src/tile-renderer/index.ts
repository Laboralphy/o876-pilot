import { AstroTileRenderer } from './themes/astro/AstroTileRenderer';
import { DeepSpaceTileRenderer } from './themes/astro/DeepSpaceTileRenderer';
import { ITileRenderer } from './ITileRenderer';

export const TILE_RENDERERS = {
    astro: AstroTileRenderer,
    deepspace: DeepSpaceTileRenderer,
};

export function createTileRenderer(theme: keyof typeof TILE_RENDERERS): ITileRenderer {
    return new TILE_RENDERERS[theme]();
}
