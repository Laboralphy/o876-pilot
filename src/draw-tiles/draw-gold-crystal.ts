import { TileDefinition } from '../world-generator/tile-definition';
import { hexstr } from '../libs/hexstr';

export function drawGoldCrystal(
    ctx: CanvasRenderingContext2D,
    tile: TileDefinition,
    tileSize: number
) {
    ctx.fillStyle = hexstr(tile.accent) + '55';
    ctx.fillRect(4, 4, tileSize - 8, tileSize - 8);
    const golds = ['#ffd700cc', '#ffaa00cc', '#ffe066cc', '#fff0aacc'];
    for (let i = 0; i < 6; i++) {
        ctx.fillStyle = golds[i % golds.length];
        const ox2 = Math.random() * (tileSize - 18) + 8;
        const oy2 = Math.random() * (tileSize - 18) + 8;
        ctx.save();
        ctx.translate(ox2, oy2);
        ctx.rotate(Math.random() * Math.PI);
        ctx.fillRect(-6, -3, 12, 6);
        ctx.restore();
    }
    // glow
    const gOre = ctx.createRadialGradient(
        tileSize / 2,
        tileSize / 2,
        2,
        tileSize / 2,
        tileSize / 2,
        tileSize / 2
    );
    gOre.addColorStop(0, '#ffd70055');
    gOre.addColorStop(1, 'transparent');
    ctx.fillStyle = gOre;
    ctx.fillRect(0, 0, tileSize, tileSize);
}
