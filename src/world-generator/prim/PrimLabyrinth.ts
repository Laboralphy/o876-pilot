import type { ISeededRNG } from '../../libs/mulberry32/ISeededRNG';
import { Room, Direction } from './Room';

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

// ─── PrimLabyrinth ───────────────────────────────────────────────────────────

/**
 * Generates a perfect maze (no loops, every room reachable) using randomised
 * Prim's algorithm.
 *
 * Usage:
 *   const lab = new PrimLabyrinth(20, 15, rng).generate();
 *   const room = lab.roomAt(3, 2);
 *   room?.set('type', 'boss');
 *   const grid = lab.toGrid(); // number[][] for tile rendering
 */
export class PrimLabyrinth {
    private readonly _rooms: Room[][];
    private _startRoom: Room | undefined;

    constructor(
        private readonly _width: number,
        private readonly _height: number,
        private readonly _rng: ISeededRNG
    ) {
        this._rooms = Array.from({ length: _height }, (_, y) =>
            Array.from({ length: _width }, (_, x) => new Room(x, y))
        );
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    /** Full 2-D grid of rooms, indexed as [y][x]. */
    get rooms(): Room[][] {
        return this._rooms;
    }

    /** The room chosen as the algorithm's seed (set after `generate()`). */
    get startRoom(): Room | undefined {
        return this._startRoom;
    }

    roomAt(x: number, y: number): Room | undefined {
        return this._rooms[y]?.[x];
    }

    // ── Iteration helpers ─────────────────────────────────────────────────────

    forEach(fn: (room: Room, x: number, y: number) => void): void {
        for (let y = 0; y < this._height; y++) {
            for (let x = 0; x < this._width; x++) {
                fn(this._rooms[y][x], x, y);
            }
        }
    }

    /** All rooms with exactly one passage — natural spots for loot or enemies. */
    deadEnds(): Room[] {
        const result: Room[] = [];
        this.forEach((room) => {
            if (room.isDeadEnd()) result.push(room);
        });
        return result;
    }

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

    // ── Export ────────────────────────────────────────────────────────────────

    /**
     * Converts the labyrinth into a "doubled-grid" cell map suitable for tile
     * rendering.  Output dimensions: (2·width + 1) × (2·height + 1).
     *
     *   Room  (rx, ry)  → tile (2rx+1, 2ry+1)
     *   E-passage       → tile (2rx+2, 2ry+1)
     *   S-passage       → tile (2rx+1, 2ry+2)
     *   Everything else → wall
     *
     * @param wallValue  Cell value for solid walls   (default 1)
     * @param floorValue Cell value for rooms/passages (default 0)
     */
    toGrid(wallValue = 1, floorValue = 0): number[][] {
        const gridW = this._width * 2 + 1;
        const gridH = this._height * 2 + 1;
        const grid: number[][] = Array.from({ length: gridH }, () =>
            new Array<number>(gridW).fill(wallValue)
        );

        for (let ry = 0; ry < this._height; ry++) {
            for (let rx = 0; rx < this._width; rx++) {
                const room = this._rooms[ry][rx];
                const tx = rx * 2 + 1;
                const ty = ry * 2 + 1;
                grid[ty][tx] = floorValue;
                if (room.hasPassage('E')) grid[ty][tx + 1] = floorValue;
                if (room.hasPassage('S')) grid[ty + 1][tx] = floorValue;
            }
        }

        return grid;
    }

    /**
     * Converts using a custom encoder function, giving full control over cell
     * values per room.  Wall cells between rooms are always `wallValue`.
     *
     * Example — encode room type from attributes:
     *   lab.toGridWith(wallValue, (room) => room.get<number>('cellId') ?? 0)
     */
    toGridWith(wallValue: number, encoder: (room: Room) => number): number[][] {
        const gridW = this._width * 2 + 1;
        const gridH = this._height * 2 + 1;
        const grid: number[][] = Array.from({ length: gridH }, () =>
            new Array<number>(gridW).fill(wallValue)
        );

        for (let ry = 0; ry < this._height; ry++) {
            for (let rx = 0; rx < this._width; rx++) {
                const room = this._rooms[ry][rx];
                const tx = rx * 2 + 1;
                const ty = ry * 2 + 1;
                grid[ty][tx] = encoder(room);
                if (room.hasPassage('E')) {
                    grid[ty][tx + 1] = encoder(room);
                }
                if (room.hasPassage('S')) {
                    grid[ty + 1][tx] = encoder(room);
                }
            }
        }

        return grid;
    }
}
