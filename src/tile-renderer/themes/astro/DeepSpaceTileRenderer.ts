import { drawSpreadStars } from './drawing-functions/draw-spread-stars';
import { drawNebula } from './drawing-functions/draw-nebula';
import { TileRenderer } from '../../TileRenderer';
import { AstroTileDefinition } from './AstroTileDefinition';
import { IDrawingFunction } from './IDrawingFunction';
import { ISeededRNG } from '../../../libs/mulberry32/ISeededRNG';
import { drawDeeperStars } from './drawing-functions/draw-deeper-stars';
import { drawNearerStars } from './drawing-functions/draw-nearer-stars';

const TILES: AstroTileDefinition[] = [
    { id: 10, renderer: 'drawNearerStars', color: 0x0d1b2e, accent: 0x2a5280 }, // cold blue
    { id: 11, renderer: 'drawNearerStars', color: 0x101e30, accent: 0x2e5a8a }, // blue
    { id: 12, renderer: 'drawNearerStars', color: 0x0e1230, accent: 0x28306e }, // blue-purple
    { id: 13, renderer: 'drawNearerStars', color: 0x0a1e28, accent: 0x1e5060 }, // teal-blue
    { id: 14, renderer: 'drawNearerStars', color: 0x140e20, accent: 0x3c2265 }, // deep purple
    { id: 15, renderer: 'drawNearerStars', color: 0x1a1208, accent: 0x4a3018 }, // dim amber
    { id: 16, renderer: 'drawNearerStars', color: 0x1e0e0e, accent: 0x522020 }, // dim red
    { id: 17, renderer: 'drawNearerStars', color: 0x0c1a1a, accent: 0x205050 }, // dark teal
];

export class DeepSpaceTileRenderer extends TileRenderer<AstroTileDefinition> {
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
