/**
 * Generates a single 8×8 exhaust particle glyph on an HTML canvas.
 *
 * Visual design: hot blue-white plasma core fading to an orange-amber outer
 * ring — mimics a thruster exhaust plume in pixel-art style.
 * Alpha and scale are animated at runtime by ExhaustSystem; the texture
 * itself is static.
 */
export function createExhaustTexture(): HTMLCanvasElement {
    const SIZE = 8;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Core — hot white-blue plasma
    ctx.fillStyle = 'rgba(210, 235, 255, 1.0)';
    ctx.fillRect(3, 3, 2, 2);

    // Inner ring — blue
    ctx.fillStyle = 'rgba(100, 160, 255, 0.75)';
    ctx.fillRect(2, 3, 1, 2);
    ctx.fillRect(5, 3, 1, 2);
    ctx.fillRect(3, 2, 2, 1);
    ctx.fillRect(3, 5, 2, 1);

    // Outer ring — orange-amber (cooler exhaust)
    ctx.fillStyle = 'rgba(255, 140, 30, 0.45)';
    ctx.fillRect(1, 3, 1, 2);
    ctx.fillRect(6, 3, 1, 2);
    ctx.fillRect(3, 1, 2, 1);
    ctx.fillRect(3, 6, 2, 1);
    ctx.fillRect(2, 2, 1, 1);
    ctx.fillRect(5, 2, 1, 1);
    ctx.fillRect(2, 5, 1, 1);
    ctx.fillRect(5, 5, 1, 1);

    return canvas;
}
