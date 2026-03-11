import { drawSpreadStars } from './draw-spread-stars';
import { drawNebula } from './draw-nebula';
import { TileRenderer } from '../../TileRenderer';
import { TileDefinition, TILES } from './tiles';

export class AstroTileRenderer extends TileRenderer<TileDefinition> {
    renderers: Record<
        string,
        (ctx: CanvasRenderingContext2D, tile: TileDefinition, tileSize: number) => void
    > = {
        drawSpreadStars,
        drawNebula,
    };
    constructor() {
        super(TILES, 128);
    }

    drawTile(ctx: CanvasRenderingContext2D, tile: TileDefinition, tileSize: number) {
        if (tile.renderer in this.renderers) {
            this.renderers[tile.renderer](ctx, tile, tileSize);
        }
    }
}
