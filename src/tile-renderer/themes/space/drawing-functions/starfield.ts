import type { IDrawingFunction } from '../../../IDrawingFunction';

/**
 * Draws a randomised starfield on a deep-space background.
 *
 * Technique:
 *  1. Fill with a near-black background with a faint colour tint.
 *  2. Scatter many small dim stars (radius 0.4–0.9 px).
 *  3. Scatter a few medium stars (radius 1–1.6 px).
 *  4. Place 0–2 bright stars with a soft radial glow.
 * Star colours span blue-white, pure white, and warm yellow-white.
 */
export const drawStarfield: IDrawingFunction = (ctx, tileSize, rng) => {
    const s = tileSize;

    // ── 1. Background ─────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, s, s);

    // ── helpers ───────────────────────────────────────────────────────────────

    /** Star colour: blue-white, pure white, or warm yellow-white. */
    const starColor = (alpha: number): string => {
        const roll = rng.nextInt(0, 2);
        if (roll === 0) return `rgba(200, 220, 255, ${alpha})`; // blue-white
        if (roll === 1) return `rgba(255, 255, 255, ${alpha})`; // white
        return `rgba(255, 245, 200, ${alpha})`; // warm white
    };

    /** Draw a single filled circle. */
    const dot = (x: number, y: number, r: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    };

    // ── 2. Small dim stars ────────────────────────────────────────────────────
    const smallCount = rng.nextInt(2, 8);
    for (let i = 0; i < smallCount; i++) {
        const x = rng.nextFloat(0, s);
        const y = rng.nextFloat(0, s);
        const r = rng.nextFloat(0.4, 0.9);
        const alpha = rng.nextFloat(0.35, 0.75);
        dot(x, y, r, starColor(alpha));
    }

    // ── 3. Medium stars ───────────────────────────────────────────────────────
    const medCount = rng.nextInt(1, 4);
    for (let i = 0; i < medCount; i++) {
        const x = rng.nextFloat(0, s);
        const y = rng.nextFloat(0, s);
        const r = rng.nextFloat(1.0, 1.6);
        const alpha = rng.nextFloat(0.6, 0.9);
        dot(x, y, r, starColor(alpha));
    }

    // ── 4. Bright stars with glow ─────────────────────────────────────────────
    const brightCount = rng.nextInt(0, 2);
    for (let i = 0; i < brightCount; i++) {
        const x = rng.nextFloat(s * 0.1, s * 0.9);
        const y = rng.nextFloat(s * 0.1, s * 0.9);
        const r = rng.nextFloat(1.5, 2.5);

        // Soft glow using a radial gradient
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        glow.addColorStop(0, starColor(0.9));
        glow.addColorStop(0.3, starColor(0.3));
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        dot(x, y, r, starColor(1.0));
    }
};
