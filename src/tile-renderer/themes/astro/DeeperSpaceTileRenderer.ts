import { TileRenderer } from '../../TileRenderer';
import { AstroTileDefinition } from './AstroTileDefinition';
import { IDrawingFunction } from './IDrawingFunction';
import { ISeededRNG } from '../../../libs/mulberry32/ISeededRNG';
import { drawDeeperStars } from './drawing-functions/draw-deeper-stars';
import { drawNearerStars } from './drawing-functions/draw-nearer-stars';

const TILES: AstroTileDefinition[] = [
    { id: 20, renderer: 'drawDeeperStars', color: 0x070d1a, accent: 0x1a3358 }, // cold blue
    { id: 21, renderer: 'drawDeeperStars', color: 0x090f1c, accent: 0x1e3d6a }, // blue
    { id: 22, renderer: 'drawDeeperStars', color: 0x08091a, accent: 0x1a2a52 }, // blue-purple
    { id: 23, renderer: 'drawDeeperStars', color: 0x06101a, accent: 0x143a4a }, // teal-blue
    { id: 24, renderer: 'drawDeeperStars', color: 0x0a0814, accent: 0x28164a }, // deep purple
    { id: 25, renderer: 'drawDeeperStars', color: 0x0c0a08, accent: 0x302010 }, // dim amber
    { id: 26, renderer: 'drawDeeperStars', color: 0x100808, accent: 0x3a1818 }, // very dim red
    { id: 27, renderer: 'drawDeeperStars', color: 0x081010, accent: 0x183838 }, // dark teal
];

export class DeeperSpaceTileRenderer extends TileRenderer<AstroTileDefinition> {
    renderers: Record<string, IDrawingFunction> = {
        drawNearerStars,
        drawDeeperStars,
    };

    constructor(tileSize: number, rng: ISeededRNG) {
        super(TILES, tileSize, rng);
    }

    drawTile(
        ctx: CanvasRenderingContext2D,
        tile: AstroTileDefinition,
        tileSize: number,
        rng: ISeededRNG
    ) {
        if (tile.renderer in this.renderers) {
            this.renderers[tile.renderer](ctx, tile, tileSize, rng);
        }
    }
}
