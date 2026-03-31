import type { IDrawingFunction } from '../../../IDrawingFunction';

/**
 * Draws a darker asteroid rock tile — charred, deep-shadow surface.
 *
 * Technique:
 *  1. Fill the tile with a very dark brownish-black base.
 *  2. Scatter irregular very dark polygons (deep voids / pitch-black crevices).
 *  3. Scatter rare dim reddish highlight polygons (faint ember-like facets).
 */
export const drawDarkerAstroRock: IDrawingFunction = (ctx, tileSize, rng) => {
    const s = tileSize;

    // ── 1. Base fill ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#2e1a11';
    ctx.fillRect(0, 0, s, s);

    // ── helpers ───────────────────────────────────────────────────────────────

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

    // ── 2. Deep void faces ────────────────────────────────────────────────────
    const darkCount = rng.nextInt(3, 6);
    for (let i = 0; i < darkCount; i++) {
        const cx = rng.nextFloat(s * 0.1, s * 0.9);
        const cy = rng.nextFloat(s * 0.1, s * 0.9);
        const r = rng.nextFloat(s * 0.12, s * 0.32);
        const sides = rng.nextInt(4, 7);
        polygon(cx, cy, r, sides, '#160c07');
    }

    // ── 3. Dim ember highlight faces ──────────────────────────────────────────
    const lightCount = rng.nextInt(2, 4);
    for (let i = 0; i < lightCount; i++) {
        const cx = rng.nextFloat(s * 0.1, s * 0.9);
        const cy = rng.nextFloat(s * 0.1, s * 0.9);
        const r = rng.nextFloat(s * 0.06, s * 0.16);
        const sides = rng.nextInt(3, 6);
        polygon(cx, cy, r, sides, '#6b3020');
    }
};
