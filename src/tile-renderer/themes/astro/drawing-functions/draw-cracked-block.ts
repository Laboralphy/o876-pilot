import { AstroTileDefinition } from '../AstroTileDefinition';
import { hexstr } from '../../../../libs/hexstr';
import { ISeededRNG } from '../../../../libs/mulberry32/ISeededRNG';

export function drawCrackedBlock(
    ctx: CanvasRenderingContext2D,
    rng: ISeededRNG,
    tile: AstroTileDefinition,
    tileSize: number
) {
    ctx.fillStyle = hexstr(tile.color);
    ctx.fillRect(0, 0, tileSize, tileSize);
    ctx.fillStyle = hexstr(tile.accent);
    for (let i = 0; i < 6; i++) {
        ctx.fillRect(
            rng.nextInt(0, tileSize) * 0.55 + tileSize * 0.1,
            rng.nextInt(0, tileSize) * 0.55 + tileSize * 0.1,
            rng.nextInt(0, 22) + 10,
            rng.nextInt(0, 16) + 8
        );
    }
    ctx.strokeStyle = hexstr(tile.color) + 'bb';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(rng.nextInt(0, tileSize), rng.nextInt(0, tileSize));
        ctx.lineTo(rng.nextInt(0, tileSize), rng.nextInt(0, tileSize));
        ctx.stroke();
    }
}
