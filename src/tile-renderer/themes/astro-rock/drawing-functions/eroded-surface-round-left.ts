import type { IDrawingFunction } from '../../../IDrawingFunction';
import { drawErodedSurface } from './eroded-surface';

/**
 * Eroded-surface tile with the upper-left corner rounded at 15 % radius.
 * The rounded area is transparent, revealing the layer beneath (space).
 */
export const drawErodedSurfaceRoundLeft: IDrawingFunction = (ctx, tileSize, rng) => {
    const s = tileSize;
    const r = s * 0.15;

    ctx.save();

    // Clip path: full tile with upper-left corner replaced by an arc.
    ctx.beginPath();
    ctx.moveTo(r, 0);                                        // top edge starts after arc
    ctx.lineTo(s, 0);                                        // top-right (sharp)
    ctx.lineTo(s, s);                                        // bottom-right
    ctx.lineTo(0, s);                                        // bottom-left
    ctx.lineTo(0, r);                                        // left edge up to arc
    ctx.arc(r, r, r, Math.PI, Math.PI * 1.5);               // upper-left arc
    ctx.closePath();
    ctx.clip();

    drawErodedSurface(ctx, tileSize, rng);

    ctx.restore();
};
