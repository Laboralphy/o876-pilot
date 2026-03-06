import { TileDefinition } from '../world-generator/tile-definition';
import { hexstr } from '../libs/hexstr';

export function drawAsteroid(
    ctx: CanvasRenderingContext2D,
    tile: TileDefinition,
    tileSize: number
) {
    const cx = tileSize / 2,
        cy = tileSize / 2,
        baseR = tileSize * 0.33;
    ctx.fillStyle = hexstr(tile.accent);
    ctx.beginPath();
    const pts = 8;
    for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const r = baseR * (0.65 + Math.random() * 0.5);
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00000066';
    ctx.lineWidth = 2;
    ctx.stroke();
    // highlight
    ctx.fillStyle = '#ffffff1a';
    ctx.beginPath();
    ctx.arc(cx - 9, cy - 9, 7, 0, Math.PI * 2);
    ctx.fill();
}
