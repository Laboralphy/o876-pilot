import type { IDrawingFunction } from '../../../IDrawingFunction';
import { drawGrayRock } from './gray-rock';

/**
 * Draws a gray-rock tile with an eroded surface layer across the top.
 *
 * Technique:
 *  1. Draw the full gray-rock base (reuses drawGrayRock).
 *  2. Lay a jagged terrain band across the top ~25–40 % of the tile:
 *     - A sandy/dusty fill colour to suggest loose surface material.
 *     - A slightly lighter highlight strip along the very top edge.
 *     - Fine dark crack lines scratched into the band for texture detail.
 *
 * The band height and crack positions are jittered per tile via the RNG so
 * no two surface tiles look identical.
 */
export const drawErodedSurface: IDrawingFunction = (ctx, tileSize, rng) => {
    const s = tileSize;

    // ── 1. Gray-rock base ─────────────────────────────────────────────────────
    drawGrayRock(ctx, tileSize, rng);

    // ── 2. Surface band geometry ──────────────────────────────────────────────
    // Band occupies the top portion of the tile; height varies per tile.
    const bandH = Math.round(s * rng.nextFloat(0.22, 0.40));

    // Jagged lower edge: sample a few control points and connect them.
    const steps = 6;
    const stepW = s / steps;
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= steps; i++) {
        points.push({
            x: i * stepW,
            y: bandH + rng.nextFloat(-bandH * 0.25, bandH * 0.25),
        });
    }

    // ── 3. Sandy fill ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#b09060';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s, 0);
    for (let i = steps; i >= 0; i--) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // ── 4. Top highlight strip ────────────────────────────────────────────────
    // A thin lighter band along the very top edge — lit surface catching light.
    const highlightH = Math.max(2, Math.round(s * 0.06));
    ctx.fillStyle = '#d4b882';
    ctx.fillRect(0, 0, s, highlightH);

    // ── 5. Crack lines scratched into the surface band ────────────────────────
    const crackCount = rng.nextInt(2, 5);
    ctx.strokeStyle = '#7a5c30';
    ctx.lineWidth = 1;
    for (let i = 0; i < crackCount; i++) {
        const x1 = rng.nextFloat(s * 0.05, s * 0.95);
        const y1 = rng.nextFloat(0, bandH * 0.6);
        const x2 = x1 + rng.nextFloat(-s * 0.15, s * 0.15);
        const y2 = y1 + rng.nextFloat(s * 0.04, bandH * 0.5);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    // ── 6. Scattered pebble dots on the surface ───────────────────────────────
    const pebbleCount = rng.nextInt(3, 7);
    for (let i = 0; i < pebbleCount; i++) {
        const px = rng.nextFloat(s * 0.05, s * 0.95);
        const py = rng.nextFloat(highlightH, bandH * 0.75);
        const pr = rng.nextFloat(1, Math.max(2, s * 0.03));
        ctx.fillStyle = rng.nextBool(0.5) ? '#8c7050' : '#c8a878';
        ctx.beginPath();
        ctx.ellipse(px, py, pr * 1.4, pr, 0, 0, Math.PI * 2);
        ctx.fill();
    }
};
