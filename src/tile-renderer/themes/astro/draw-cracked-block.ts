import { TileDefinition } from './tiles';
import { hexstr } from '../../../libs/hexstr';

export function drawCrackedBlock(
    ctx: CanvasRenderingContext2D,
    tile: TileDefinition,
    tileSize: number
) {
    ctx.fillStyle = hexstr(tile.color);
    ctx.fillRect(0, 0, tileSize, tileSize);
    ctx.fillStyle = hexstr(tile.accent);
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(
            Math.random() * tileSize * 0.55 + tileSize * 0.1,
            Math.random() * tileSize * 0.55 + tileSize * 0.1,
            Math.random() * 22 + 10,
            Math.random() * 16 + 8
        );
    }
    ctx.strokeStyle = hexstr(tile.color) + 'bb';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * tileSize, Math.random() * tileSize);
        ctx.lineTo(Math.random() * tileSize, Math.random() * tileSize);
        ctx.stroke();
    }
}
