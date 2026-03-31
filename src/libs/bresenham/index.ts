/**
 * Bresenham's line algorithm.
 *
 * Walks every integer pixel on the line from (xFrom, yFrom) to (xTo, yTo),
 * inclusive of both endpoints, and calls `callback` with each coordinate.
 *
 * The algorithm handles all octants (any direction, any slope).
 */
export function line(
    xFrom: number,
    yFrom: number,
    xTo: number,
    yTo: number,
    callback: (x: number, y: number) => void
): void {
    let x = xFrom;
    let y = yFrom;

    const dx = Math.abs(xTo - xFrom);
    const dy = Math.abs(yTo - yFrom);
    const sx = xFrom < xTo ? 1 : -1;
    const sy = yFrom < yTo ? 1 : -1;

    let err = dx - dy;

    while (true) {
        callback(x, y);

        if (x === xTo && y === yTo) break;

        const e2 = 2 * err;

        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }

        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
}
