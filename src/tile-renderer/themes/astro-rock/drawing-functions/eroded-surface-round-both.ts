import type { IDrawingFunction } from '../../../IDrawingFunction';
import { drawErodedSurface } from './eroded-surface';

/**
 * Eroded-surface tile with both upper corners rounded at 15 % radius.
 * The rounded areas are transparent, revealing the layer beneath (space).
 */
export const drawErodedSurfaceRoundBoth: IDrawingFunction = (ctx, tileSize, rng) => {
    const s = tileSize;
    const r = s * 0.15;

    ctx.save();

    // Clip path: full tile with both upper corners replaced by arcs.
    ctx.beginPath();
    ctx.moveTo(r, 0);                                        // top edge starts after left arc
    ctx.lineTo(s - r, 0);                                    // top edge up to right arc
    ctx.arc(s - r, r, r, Math.PI * 1.5, 0);                 // upper-right arc
    ctx.lineTo(s, s);                                        // bottom-right
    ctx.lineTo(0, s);                                        // bottom-left
    ctx.lineTo(0, r);                                        // left edge up to left arc
    ctx.arc(r, r, r, Math.PI, Math.PI * 1.5);               // upper-left arc
    ctx.closePath();
    ctx.clip();

    drawErodedSurface(ctx, tileSize, rng);

    ctx.restore();
};
