/**
 * Generates a 4-frame bullet spritesheet on an HTML canvas at runtime.
 * Each frame is 8×8 px. Total canvas: 32×8 px.
 *
 * The bolt is oriented pointing upward (-Y) so Phaser's angle property
 * rotates it correctly to match the ship's facing direction.
 *
 * Frames cycle through brightness (1.0 → 0.65 → 0.35 → 0.65) for a
 * subtle energy-pulse animation while the bullet is in flight.
 */
export function createBulletTexture(): HTMLCanvasElement {
    const FRAMES = 4;
    const W = 8;
    const H = 8;
    const canvas = document.createElement('canvas');
    canvas.width = W * FRAMES;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pulse brightness per frame
    const alphas = [1.0, 0.65, 0.35, 0.65];

    for (let f = 0; f < FRAMES; f++) {
        const a = alphas[f];
        const ox = f * W;
        const cx = ox + 3; // left edge of the 2-px-wide bolt center column

        // Tip — white flash
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        ctx.fillRect(cx, 1, 2, 1);

        // Upper body — hot yellow-white
        ctx.fillStyle = `rgba(255, 240, 60, ${a})`;
        ctx.fillRect(cx, 2, 2, 2);

        // Core — orange-yellow
        ctx.fillStyle = `rgba(255, 160, 0, ${a * 0.9})`;
        ctx.fillRect(cx, 4, 2, 2);

        // Tail — dim orange (fade-out)
        ctx.fillStyle = `rgba(220, 60, 0, ${a * 0.45})`;
        ctx.fillRect(cx, 6, 2, 1);
    }

    return canvas;
}
