import type { ISeededRNG } from '../mulberry32/ISeededRNG';
import { Room, Direction } from './Room';
import { NumberGrid } from '../grid/NumberGrid';
import type { IDaedalus } from './IDaedalus';

// ─── Direction helpers ───────────────────────────────────────────────────────

type DirSpec = { dx: number; dy: number; opposite: Direction };

const DIRS: Record<Direction, DirSpec> = {
    N: { dx: 0, dy: -1, opposite: 'S' },
    S: { dx: 0, dy: +1, opposite: 'N' },
    E: { dx: +1, dy: 0, opposite: 'W' },
    W: { dx: -1, dy: 0, opposite: 'E' },
};

const DIR_KEYS = Object.keys(DIRS) as Direction[];

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
export class Daedalus implements IDaedalus {
    protected readonly _rooms: Room[][];

    constructor(
        protected readonly _width: number,
        protected readonly _height: number,
        protected readonly _rng: ISeededRNG
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

    // ── Passage manipulation ──────────────────────────────────────────────────

    /**
     * Opens a two-way passage between room (x, y) and its neighbor in the
     * given direction. Both rooms are updated. Out-of-bounds neighbours are
     * silently ignored.
     */
    openPassage(x: number, y: number, direction: Direction): void {
        const room = this.roomAt(x, y);
        if (!room) return;
        const { dx, dy, opposite } = DIRS[direction];
        const neighbor = this.roomAt(x + dx, y + dy);
        if (!neighbor) return;
        room.passages.add(direction);
        room.adjacentRooms.set(direction, neighbor);
        neighbor.passages.add(opposite);
        neighbor.adjacentRooms.set(direction, room);
    }

    /**
     * Closes the two-way passage between room (x, y) and its neighbor in the
     * given direction. Both rooms are updated. Out-of-bounds neighbours are
     * silently ignored.
     */
    closePassage(x: number, y: number, direction: Direction): void {
        const room = this.roomAt(x, y);
        if (!room) return;
        const { dx, dy, opposite } = DIRS[direction];
        const neighbor = this.roomAt(x + dx, y + dy);
        if (!neighbor) return;
        room.passages.delete(direction);
        room.adjacentRooms.delete(direction);
        neighbor.passages.delete(opposite);
        neighbor.adjacentRooms.delete(direction);
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
    toGrid(wallValue = 1, floorValue = 0): NumberGrid {
        const gridW = this._width * 2 + 1;
        const gridH = this._height * 2 + 1;
        const grid = new NumberGrid(gridW, gridH);
        grid.walkCells(() => wallValue);

        for (let ry = 0; ry < this._height; ry++) {
            for (let rx = 0; rx < this._width; rx++) {
                const room = this._rooms[ry][rx];
                const tx = rx * 2 + 1;
                const ty = ry * 2 + 1;
                grid.setCellValue(tx, ty, floorValue);
                if (room.hasPassage('E')) grid.setCellValue(tx + 1, ty, floorValue);
                if (room.hasPassage('S')) grid.setCellValue(tx, ty + 1, floorValue);
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
    toGridWith(wallValue: number, encoder: (room: Room) => number): NumberGrid {
        const gridW = this._width * 2 + 1;
        const gridH = this._height * 2 + 1;
        const grid = new NumberGrid(gridW, gridH);
        grid.walkCells(() => wallValue);

        for (let ry = 0; ry < this._height; ry++) {
            for (let rx = 0; rx < this._width; rx++) {
                const room = this._rooms[ry][rx];
                const tx = rx * 2 + 1;
                const ty = ry * 2 + 1;
                grid.setCellValue(tx, ty, encoder(room));
                if (room.hasPassage('E')) {
                    grid.setCellValue(tx + 1, ty, encoder(room));
                }
                if (room.hasPassage('S')) {
                    grid.setCellValue(tx, ty + 1, encoder(room));
                }
            }
        }

        return grid;
    }
}
