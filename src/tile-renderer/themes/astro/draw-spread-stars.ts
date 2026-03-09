import { TileDefinition } from './tile-definition';
import { hexstr } from '../../../libs/hexstr';

export function drawSpreadStars(
    ctx: CanvasRenderingContext2D,
    tile: TileDefinition,
    tileSize: number
) {
    ctx.fillStyle = hexstr(tile.color);
    ctx.fillRect(0, 0, tileSize, tileSize);
    ctx.fillStyle = hexstr(tile.accent);
    for (let i = 0; i < 8; i++) {
        const r = Math.random() * 1.4 + 0.3;
        ctx.beginPath();
        ctx.arc(Math.random() * tileSize, Math.random() * tileSize, r, 0, Math.PI * 2);
        ctx.fill();
    }
    // 1 étoile brillante occasionnelle
    if (Math.random() < 0.3) {
        ctx.fillStyle = '#ffffffcc';
        ctx.beginPath();
        ctx.arc(Math.random() * tileSize, Math.random() * tileSize, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }
}
