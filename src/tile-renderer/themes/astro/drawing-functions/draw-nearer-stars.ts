import { AstroTileDefinition } from '../AstroTileDefinition';
import { hexstr } from '../../../../libs/hexstr';
import { ISeededRNG } from '../../../../libs/mulberry32/ISeededRNG';

export function drawNearerStars(
    ctx: CanvasRenderingContext2D,
    tile: AstroTileDefinition,
    tileSize: number,
    rng: ISeededRNG
) {
    ctx.clearRect(0, 0, tileSize, tileSize);
    for (let i = 0; i < 8; i++) {
        if (rng.nextBool(0.5)) {
            ctx.fillStyle = hexstr(tile.color);
        } else {
            ctx.fillStyle = hexstr(tile.accent);
        }
        const r = Math.random() * 1.4 + 0.3;
        ctx.beginPath();
        ctx.arc(rng.nextInt(0, tileSize - 1), rng.nextInt(0, tileSize - 1), r, 0, Math.PI * 2);
        ctx.fill();
    }
    // 1 étoile brillante occasionnelle
    if (Math.random() < 0.3) {
        ctx.fillStyle = '#ffffffcc';
        ctx.beginPath();
        ctx.arc(rng.nextInt(0, tileSize - 1), rng.nextInt(0, tileSize - 1), 1.2, 0, Math.PI * 2);
        ctx.fill();
    }
}
