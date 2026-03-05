import { TileDefinition } from '../world-generator/tile-definition';
import { hexstr } from '../libs/hexstr';
import { drawSpreadStars } from './draw-spread-stars';
import { drawNebula } from './draw-nebula';
import { drawAsteroid } from './draw-asteroid';
import { drawCrackedBlock } from './draw-cracked-block';
import { drawGoldCrystal } from './draw-gold-crystal';
import { drawSpaceAnomaly } from './draw-space-anomaly';

const TILE_SIZE = 64;

const RENDERERS: Record<
    string,
    (ctx: CanvasRenderingContext2D, tile: TileDefinition, tileSize: number) => void
> = {
    drawSpreadStars,
    drawNebula,
    drawAsteroid,
    drawCrackedBlock,
    drawGoldCrystal,
    drawSpaceAnomaly,
};

export function drawTile(
    ctx: CanvasRenderingContext2D,
    tile: TileDefinition,
    ox: number,
    oy: number
) {
    // Fond de base
    ctx.fillStyle = hexstr(tile.color);
    ctx.fillRect(ox, oy, TILE_SIZE, TILE_SIZE);

    ctx.save();
    ctx.translate(ox, oy); // on travaille en coordonnées locales à la tile
    ctx.beginPath();
    ctx.rect(0, 0, TILE_SIZE, TILE_SIZE);
    ctx.clip();

    if (tile.renderer in RENDERERS) {
        RENDERERS[tile.renderer](ctx, tile, TILE_SIZE);
    }

    ctx.strokeStyle = '#ffffff07';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    ctx.restore();
}

/**
 * Builds a new canvas, with all tiles rendered in it.
 * @param tiles
 */
export function buildTileset(tiles: TileDefinition[]): HTMLCanvasElement {
    const cols = tiles.length;
    const canvas = document.createElement('canvas');
    canvas.width = cols * TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error("Can't get tileset canvas rendering 2D context");
    }
    tiles.forEach((tile, col) => {
        const ox = col * TILE_SIZE; // offset x pour cette tile dans l'atlas
        drawTile(ctx, tile, ox, 0);
    });
    return canvas;
}
