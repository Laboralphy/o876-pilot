import { drawSpreadStars } from './drawing-functions/draw-spread-stars';
import { drawNebula } from './drawing-functions/draw-nebula';
import { TileRenderer } from '../../TileRenderer';
import { AstroTileDefinition } from './AstroTileDefinition';
import { IDrawingFunction } from './IDrawingFunction';
import { createRNGFromString } from '../../../libs/mulberry32';

const TILES: AstroTileDefinition[] = [
    {
        id: 10,
        renderer: 'drawSpreadStars',
        color: 0x0d1b2e,
        accent: 0x1a3a5c,
    },
    {
        id: 11,
        renderer: 'drawSpreadStars',
        color: 0x0d1b2e,
        accent: 0x1a3a5c,
    },
    {
        id: 12,
        renderer: 'drawSpreadStars',
        color: 0x0d1b2e,
        accent: 0x1a3a5c,
    },
    {
        id: 13,
        renderer: 'drawSpreadStars',
        color: 0x0d1b2e,
        accent: 0x1a3a5c,
    },
    {
        id: 20,
        renderer: 'drawNebula',
        color: 0x1a3358,
        accent: 0x2d5a8e,
    },
    {
        id: 21,
        renderer: 'drawNebula',
        color: 0x1a3358,
        accent: 0x2d5a8e,
    },
    {
        id: 22,
        renderer: 'drawNebula',
        color: 0x1a3358,
        accent: 0x2d5a8e,
    },
    {
        id: 23,
        renderer: 'drawNebula',
        color: 0x1a3358,
        accent: 0x2d5a8e,
    },
];

export class DeepSpaceTileRenderer extends TileRenderer<AstroTileDefinition> {
    renderers: Record<string, IDrawingFunction> = {
        drawSpreadStars,
        drawNebula,
    };
    constructor() {
        super(TILES, 128);
    }

    drawTile(ctx: CanvasRenderingContext2D, tile: AstroTileDefinition, tileSize: number) {
        if (tile.renderer in this.renderers) {
            this.renderers[tile.renderer](
                ctx,
                createRNGFromString(Math.random().toString()),
                tile,
                tileSize
            );
        }
    }
}
