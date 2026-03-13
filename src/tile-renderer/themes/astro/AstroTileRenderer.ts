import { drawCrackedBlock } from './drawing-functions/draw-cracked-block';
import { drawAsteroid } from './drawing-functions/draw-asteroid';
import { drawGoldCrystal } from './drawing-functions/draw-gold-crystal';
import { drawSpaceAnomaly } from './drawing-functions/draw-space-anomaly';
import { TileRenderer } from '../../TileRenderer';
import { AstroTileDefinition } from './AstroTileDefinition';
import { IDrawingFunction } from './IDrawingFunction';
import { createRNGFromString } from '../../../libs/mulberry32';

const TILES: AstroTileDefinition[] = [
    {
        id: 0,
        renderer: '',
        color: 0,
        accent: 0,
    },
    {
        id: 10,
        renderer: 'drawAsteroid',
        color: 0x2a4a35,
        accent: 0x4a7a5a,
    },
    {
        id: 11,
        renderer: 'drawAsteroid',
        color: 0x2a4a35,
        accent: 0x4a7a5a,
    },
    {
        id: 12,
        renderer: 'drawAsteroid',
        color: 0x2a4a35,
        accent: 0x4a7a5a,
    },
    {
        id: 13,
        renderer: 'drawAsteroid',
        color: 0x2a4a35,
        accent: 0x4a7a5a,
    },
    {
        id: 20,
        renderer: 'drawCrackedBlock',
        color: 0x4a3218,
        accent: 0x8a5a2a,
    },
    {
        id: 21,
        renderer: 'drawCrackedBlock',
        color: 0x4a3218,
        accent: 0x8a5a2a,
    },
    {
        id: 22,
        renderer: 'drawCrackedBlock',
        color: 0x4a3218,
        accent: 0x8a5a2a,
    },
    {
        id: 23,
        renderer: 'drawCrackedBlock',
        color: 0x4a3218,
        accent: 0x8a5a2a,
    },
    {
        id: 3,
        renderer: 'drawGoldCrystal',
        color: 0x6a5010,
        accent: 0xc8a020,
    },
    {
        id: 40,
        renderer: 'drawSpaceAnomaly',
        color: 0x2a0a4a,
        accent: 0x5a1a8a,
        variation: 1,
    },
    {
        id: 41,
        renderer: 'drawSpaceAnomaly',
        color: 0x2a0a4a,
        accent: 0x5a1a8a,
        variation: 0.9,
    },
    {
        id: 42,
        renderer: 'drawSpaceAnomaly',
        color: 0x2a0a4a,
        accent: 0x5a1a8a,
        variation: 0.85,
    },
    {
        id: 43,
        renderer: 'drawSpaceAnomaly',
        color: 0x2a0a4a,
        accent: 0x5a1a8a,
        variation: 0.9,
    },
];

export class AstroTileRenderer extends TileRenderer<AstroTileDefinition> {
    renderers: Record<string, IDrawingFunction> = {
        drawCrackedBlock,
        drawAsteroid,
        drawGoldCrystal,
        drawSpaceAnomaly,
    };
    constructor() {
        super(TILES, 64);
    }

    drawTile(ctx: CanvasRenderingContext2D, tile: AstroTileDefinition, tileSize: number) {
        if (tile.renderer in this.renderers) {
            this.renderers[tile.renderer](
                ctx,
                createRNGFromString(Math.random().toString()),
                tile,
                tileSize
            );
            ctx.strokeStyle = '#ffffff07';
            ctx.lineWidth = 1;
            ctx.strokeRect(0.5, 0.5, tileSize - 1, tileSize - 1);
        }
    }
}
