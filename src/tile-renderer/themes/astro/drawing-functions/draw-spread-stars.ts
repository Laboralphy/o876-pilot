import { AstroTileDefinition } from '../AstroTileDefinition';
import { hexstr } from '../../../../libs/hexstr';
import { ISeededRNG } from '../../../../libs/mulberry32/ISeededRNG';

export function drawSpreadStars(
    ctx: CanvasRenderingContext2D,
    rng: ISeededRNG,
    tile: AstroTileDefinition,
    tileSize: number
) {
    ctx.fillStyle = hexstr(tile.color);
    ctx.fillRect(0, 0, tileSize, tileSize);
    ctx.fillStyle = hexstr(tile.accent);
    for (let i = 0; i < 8; i++) {
        const r = Math.random() * 1.4 + 0.3;
        ctx.beginPath();
        ctx.arc(rng.nextInt(0, tileSize), rng.nextInt(0, tileSize), r, 0, Math.PI * 2);
        ctx.fill();
    }
    // 1 étoile brillante occasionnelle
    if (Math.random() < 0.3) {
        ctx.fillStyle = '#ffffffcc';
        ctx.beginPath();
        ctx.arc(rng.nextInt(0, tileSize), rng.nextInt(0, tileSize), 1.2, 0, Math.PI * 2);
        ctx.fill();
    }
}
