/**
 * Generates a single 12×12 debris particle glyph on an HTML canvas.
 *
 * Visual design: bright white-hot core fading through yellow to orange at
 * the edges. Color cycling (yellow → red → gray) is applied at runtime by
 * ExhaustSystem via sprite.setTint(); the texture itself is static white so
 * tinting multiplies cleanly.
 */
export function createDebrisTexture(): HTMLCanvasElement {
    const SIZE = 12;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Core — pure white (tint will colorise this)
    ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
    ctx.fillRect(5, 5, 2, 2);

    // Inner ring — slightly dimmer white
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(4, 5, 1, 2); // left
    ctx.fillRect(7, 5, 1, 2); // right
    ctx.fillRect(5, 4, 2, 1); // top
    ctx.fillRect(5, 7, 2, 1); // bottom
    ctx.fillRect(4, 4, 1, 1); // corners
    ctx.fillRect(7, 4, 1, 1);
    ctx.fillRect(4, 7, 1, 1);
    ctx.fillRect(7, 7, 1, 1);

    // Outer halo — soft, semi-transparent white
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(3, 5, 1, 2);
    ctx.fillRect(8, 5, 1, 2);
    ctx.fillRect(5, 3, 2, 1);
    ctx.fillRect(5, 8, 2, 1);
    ctx.fillRect(3, 4, 1, 1);
    ctx.fillRect(8, 4, 1, 1);
    ctx.fillRect(3, 7, 1, 1);
    ctx.fillRect(8, 7, 1, 1);
    ctx.fillRect(4, 3, 1, 1);
    ctx.fillRect(7, 3, 1, 1);
    ctx.fillRect(4, 8, 1, 1);
    ctx.fillRect(7, 8, 1, 1);

    return canvas;
}
