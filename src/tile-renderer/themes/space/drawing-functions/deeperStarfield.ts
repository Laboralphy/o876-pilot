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
export const drawDeeperStarfield: IDrawingFunction = (ctx, tileSize, rng) => {
    const s = tileSize;

    // ── 1. Background ─────────────────────────────────────────────────────────
    const bgHue = rng.nextInt(210, 240);
    const bgLight = rng.nextInt(2, 6);
    ctx.fillStyle = `hsl(${bgHue}, 30%, ${bgLight}%)`;
    ctx.fillRect(0, 0, s, s);

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
    const smallCount = rng.nextInt(18, 35);
    for (let i = 0; i < smallCount; i++) {
        const x = rng.nextFloat(0, s);
        const y = rng.nextFloat(0, s);
        const r = rng.nextFloat(0.4, 0.9);
        const alpha = rng.nextFloat(0.35, 0.75);
        dot(x, y, r, starColor(alpha * 0.75));
    }

    // ── 3. Medium stars ───────────────────────────────────────────────────────
    const medCount = rng.nextInt(3, 8);
    for (let i = 0; i < medCount; i++) {
        const x = rng.nextFloat(0, s);
        const y = rng.nextFloat(0, s);
        const r = rng.nextFloat(1.0, 1.6);
        const alpha = rng.nextFloat(0.6, 0.9);
        dot(x, y, r, starColor(alpha * 0.75));
    }
};
