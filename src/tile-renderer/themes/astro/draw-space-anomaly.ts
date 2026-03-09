import { TileDefinition } from './tile-definition';
import { hexstr } from '../../../libs/hexstr';

export function drawSpaceAnomaly(
    ctx: CanvasRenderingContext2D,
    tile: TileDefinition,
    tileSize: number
) {
    ctx.fillStyle = hexstr(tile.color);
    ctx.fillRect(0, 0, tileSize, tileSize);
    // ANOMALY — anneaux concentriques
    for (let r = tileSize * 0.44; r > 5; r -= 9) {
        const alpha = Math.floor((r / (tileSize * 0.44)) * 200)
            .toString(16)
            .padStart(2, '0');
        ctx.strokeStyle = hexstr(tile.accent) + alpha;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(tileSize / 2, tileSize / 2, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    const gAno = ctx.createRadialGradient(
        tileSize / 2,
        tileSize / 2,
        0,
        tileSize / 2,
        tileSize / 2,
        18
    );
    gAno.addColorStop(0, '#cc88ff');
    gAno.addColorStop(1, '#5a1a8a00');
    ctx.fillStyle = gAno;
    ctx.beginPath();
    ctx.arc(tileSize / 2, tileSize / 2, 18, 0, Math.PI * 2);
    ctx.fill();
}
