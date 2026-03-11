import { TileDefinition } from './tiles';
import { hexstr } from '../../../libs/hexstr';

export function drawNebula(ctx: CanvasRenderingContext2D, tile: TileDefinition, tileSize: number) {
    ctx.fillStyle = hexstr(tile.color);
    ctx.fillRect(0, 0, tileSize, tileSize);
    const g = ctx.createRadialGradient(
        tileSize / 2,
        tileSize / 2,
        2,
        tileSize / 2,
        tileSize / 2,
        tileSize * 0.72
    );
    g.addColorStop(0, hexstr(tile.accent) + 'dd');
    g.addColorStop(0.5, hexstr(tile.accent) + '55');
    g.addColorStop(1, hexstr(tile.color) + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, tileSize, tileSize);
    // petites étoiles
    ctx.fillStyle = '#ffffffaa';
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * tileSize, Math.random() * tileSize, 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
}
