import type { ISeededRNG } from '../mulberry32/ISeededRNG';
import { Room, Direction } from './Room';
import { Daedalus } from '../daedalus';
import { NumberGrid } from '../grid/NumberGrid';

// ─── Direction helpers ───────────────────────────────────────────────────────

type DirSpec = { dx: number; dy: number; opposite: Direction };

const DIRS: Record<Direction, DirSpec> = {
    N: { dx: 0, dy: -1, opposite: 'S' },
    S: { dx: 0, dy: +1, opposite: 'N' },
    E: { dx: +1, dy: 0, opposite: 'W' },
    W: { dx: -1, dy: 0, opposite: 'E' },
};

const DIR_KEYS = Object.keys(DIRS) as Direction[];

// ─── Internal types ──────────────────────────────────────────────────────────

/** A candidate wall in the frontier: the passage between `from` and `to`. */
type FrontierWall = {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    dir: Direction; // direction from `from` → `to`
};

// ─── Daedalus ───────────────────────────────────────────────────────────

/**
 * Generates a perfect maze (no loops, every room reachable) using randomised
 * Prim's algorithm.
 *
 * Usage:
 *   const lab = new Daedalus(20, 15, rng).generate();
 *   const room = lab.roomAt(3, 2);
 *   room?.set('type', 'boss');
 *   const grid = lab.toGrid(); // number[][] for tile rendering
 */
export class PrimLabyrinth extends Daedalus {
    private _startRoom: Room | undefined;

    // ── Generation ────────────────────────────────────────────────────────────

    /**
     * Runs Prim's algorithm and returns `this` for chaining.
     * Can be called multiple times to regenerate with the current RNG state.
     */
    generate(): this {
        // Reset all rooms
        this.forEach((room) => room.passages.clear());

        const inMaze = new Set<number>();
        const frontier: FrontierWall[] = [];

        // Compact integer key — faster than string keys for large grids
        const key = (x: number, y: number) => y * this._width + x;

        const addWalls = (x: number, y: number) => {
            for (const dir of DIR_KEYS) {
                const { dx, dy } = DIRS[dir];
                const nx = x + dx;
                const ny = y + dy;
                if (
                    nx >= 0 &&
                    nx < this._width &&
                    ny >= 0 &&
                    ny < this._height &&
                    !inMaze.has(key(nx, ny))
                ) {
                    frontier.push({ fromX: x, fromY: y, toX: nx, toY: ny, dir });
                }
            }
        };

        // Seed the maze at a random cell
        const sx = this._rng.nextInt(0, this._width - 1);
        const sy = this._rng.nextInt(0, this._height - 1);
        this._startRoom = this._rooms[sy][sx];
        inMaze.add(key(sx, sy));
        addWalls(sx, sy);

        while (frontier.length > 0) {
            // O(1) random removal: swap chosen wall with the last, then pop
            const idx = this._rng.nextInt(0, frontier.length - 1);
            const wall = frontier[idx];
            frontier[idx] = frontier[frontier.length - 1];
            frontier.pop();

            const { fromX, fromY, toX, toY, dir } = wall;

            // The target might have been reached by another path in the meantime
            if (inMaze.has(key(toX, toY))) continue;

            // Carve the passage in both rooms
            this._rooms[fromY][fromX].passages.add(dir);
            this._rooms[toY][toX].passages.add(DIRS[dir].opposite);

            inMaze.add(key(toX, toY));
            addWalls(toX, toY);
        }

        return this;
    }
}
