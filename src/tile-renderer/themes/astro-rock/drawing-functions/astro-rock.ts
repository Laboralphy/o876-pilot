import type { IDrawingFunction } from '../../../IDrawingFunction';

/**
 * Draws a reddish-brown asteroid rock tile — rusty, iron-rich surface.
 *
 * Technique:
 *  1. Fill the tile with a mid reddish-brown base.
 *  2. Scatter irregular dark polygons (deep crevices / shadow faces).
 *  3. Scatter irregular warm-highlight polygons (oxidised mineral facets).
 */
export const drawAstroRock: IDrawingFunction = (ctx, tileSize, rng) => {
    const s = tileSize;

    // ── 1. Base fill ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#6b3a2a';
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

    // ── 2. Dark crevice faces ─────────────────────────────────────────────────
    const darkCount = rng.nextInt(3, 6);
    for (let i = 0; i < darkCount; i++) {
        const cx = rng.nextFloat(s * 0.1, s * 0.9);
        const cy = rng.nextFloat(s * 0.1, s * 0.9);
        const r = rng.nextFloat(s * 0.12, s * 0.32);
        const sides = rng.nextInt(4, 7);
        polygon(cx, cy, r, sides, '#3d1f14');
    }

    // ── 3. Warm mineral highlight faces ──────────────────────────────────────
    const lightCount = rng.nextInt(2, 5);
    for (let i = 0; i < lightCount; i++) {
        const cx = rng.nextFloat(s * 0.1, s * 0.9);
        const cy = rng.nextFloat(s * 0.1, s * 0.9);
        const r = rng.nextFloat(s * 0.08, s * 0.22);
        const sides = rng.nextInt(3, 6);
        polygon(cx, cy, r, sides, '#c4845a');
    }
};
