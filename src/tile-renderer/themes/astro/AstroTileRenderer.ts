import { drawCrackedBlock } from './renderers/draw-cracked-block';
import { drawAsteroid } from './renderers/draw-asteroid';
import { drawGoldCrystal } from './renderers/draw-gold-crystal';
import { drawSpaceAnomaly } from './renderers/draw-space-anomaly';
import { TileRenderer } from '../../TileRenderer';
import { AstroTileDefinition } from './AstroTileDefinition';
import { IAstroRenderer } from './IAstroRenderer';
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
        id: 4,
        renderer: 'drawSpaceAnomaly',
        color: 0x2a0a4a,
        accent: 0x5a1a8a,
    },
];

export class AstroTileRenderer extends TileRenderer<AstroTileDefinition> {
    renderers: Record<string, IAstroRenderer> = {
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
