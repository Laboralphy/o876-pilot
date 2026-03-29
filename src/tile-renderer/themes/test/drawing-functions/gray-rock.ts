import type { IDrawingFunction } from '../../../IDrawingFunction';

/**
 * Draws a simple old-school bi-color rocky tile.
 *
 * Technique:
 *  1. Fill the tile with a mid-grey base.
 *  2. Scatter a handful of irregular dark polygons (shadow faces).
 *  3. Scatter a handful of irregular light polygons (highlight faces).
 * All polygon vertices are jittered with the RNG so each tile looks unique.
 */
export const drawGrayRock: IDrawingFunction = (ctx, tileSize, rng) => {
    const s = tileSize;

    // ── 1. Base fill ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 0, s, s);

    // ── helpers ───────────────────────────────────────────────────────────────

    /** Draw a filled irregular polygon from a seed point + N jittered vertices. */
    const polygon = (cx: number, cy: number, radius: number, sides: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = ((Math.PI * 2) / sides) * i + rng.nextFloat(-0.4, 0.4);
            const r = radius * rng.nextFloat(0.55, 1.0);
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    };

    // ── 2. Dark shadow faces ──────────────────────────────────────────────────
    const darkCount = rng.nextInt(3, 6);
    for (let i = 0; i < darkCount; i++) {
        const cx = rng.nextFloat(s * 0.1, s * 0.9);
        const cy = rng.nextFloat(s * 0.1, s * 0.9);
        const r = rng.nextFloat(s * 0.12, s * 0.32);
        const sides = rng.nextInt(4, 7);
        polygon(cx, cy, r, sides, '#4a4a4a');
    }

    // ── 3. Light highlight faces ──────────────────────────────────────────────
    const lightCount = rng.nextInt(2, 5);
    for (let i = 0; i < lightCount; i++) {
        const cx = rng.nextFloat(s * 0.1, s * 0.9);
        const cy = rng.nextFloat(s * 0.1, s * 0.9);
        const r = rng.nextFloat(s * 0.08, s * 0.22);
        const sides = rng.nextInt(3, 6);
        polygon(cx, cy, r, sides, '#b0b0b0');
    }
};
