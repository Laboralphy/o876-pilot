import type { IDrawingFunction } from '../../../IDrawingFunction';
import { drawErodedSurface } from './eroded-surface';

/**
 * Eroded-surface tile with the upper-right corner rounded at 15 % radius.
 * The rounded area is transparent, revealing the layer beneath (space).
 */
export const drawErodedSurfaceRoundRight: IDrawingFunction = (ctx, tileSize, rng) => {
    const s = tileSize;
    const r = s * 0.15;

    ctx.save();

    // Clip path: full tile with upper-right corner replaced by an arc.
    ctx.beginPath();
    ctx.moveTo(0, 0);                                        // top-left (sharp)
    ctx.lineTo(s - r, 0);                                    // top edge up to arc
    ctx.arc(s - r, r, r, Math.PI * 1.5, 0);                 // upper-right arc
    ctx.lineTo(s, s);                                        // bottom-right
    ctx.lineTo(0, s);                                        // bottom-left
    ctx.closePath();
    ctx.clip();

    drawErodedSurface(ctx, tileSize, rng);

    ctx.restore();
};
