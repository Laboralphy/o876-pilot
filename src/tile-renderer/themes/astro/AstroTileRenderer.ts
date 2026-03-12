import { drawCrackedBlock } from './draw-cracked-block';
import { drawAsteroid } from './draw-asteroid';
import { drawGoldCrystal } from './draw-gold-crystal';
import { drawSpaceAnomaly } from './draw-space-anomaly';
import { TileRenderer } from '../../TileRenderer';
import { TileDefinition, TILES } from './tiles';

export class AstroTileRenderer extends TileRenderer<TileDefinition> {
    renderers: Record<
        string,
        (ctx: CanvasRenderingContext2D, tile: TileDefinition, tileSize: number) => void
    > = {
        drawCrackedBlock,
        drawAsteroid,
        drawGoldCrystal,
        drawSpaceAnomaly,
    };
    constructor() {
        super(TILES, 64);
    }

    drawTile(ctx: CanvasRenderingContext2D, tile: TileDefinition, tileSize: number) {
        if (tile.renderer in this.renderers) {
            this.renderers[tile.renderer](ctx, tile, tileSize);
            ctx.strokeStyle = '#ffffff07';
            ctx.lineWidth = 1;
            ctx.strokeRect(0.5, 0.5, tileSize - 1, tileSize - 1);
        }
    }
}
