import { IGrid } from './IGrid';

export type NeighborCell<T> = { dx: number; dy: number; value: T };

export abstract class Grid<T> implements IGrid<T> {
    public readonly cellMap: T[][] = [];

    protected constructor(
        protected readonly _width: number,
        protected readonly _height: number
    ) {
        for (let y = 0; y < _height; ++y) {
            const row: T[] = [];
            for (let x = 0; x < _width; ++x) {
                row.push(this.createCell(x, y));
            }
            this.cellMap.push(row);
        }
    }

    // ── Abstract cell lifecycle ───────────────────────────────────────────────

    /** Create a new default cell value (used to initialise the grid). */
    abstract createCell(x: number, y: number): T;

    /** Called when a cell value is replaced or the grid is torn down. */
    abstract discardCell(value: T): void;

    /** Return a copy of the given cell value (used for snapshotting). */
    abstract copyCell(value: T): T;

    // ── IGrid ─────────────────────────────────────────────────────────────────

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    setCellValue(x: number, y: number, value: T): void {
        if (x >= 0 && y >= 0 && y < this.cellMap.length && x < this.cellMap[y].length) {
            this.discardCell(this.cellMap[y][x]);
            this.cellMap[y][x] = value;
        }
    }

    getCellValue(x: number, y: number): T | undefined {
        if (x >= 0 && y >= 0 && y < this.cellMap.length && x < this.cellMap[y].length) {
            return this.cellMap[y][x];
        }
        return undefined;
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    getNeighbors(x: number, y: number): NeighborCell<T>[] {
        const neighbors: NeighborCell<T>[] = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                const value = this.getCellValue(nx, ny);
                if (value !== undefined) {
                    neighbors.push({ dx, dy, value });
                }
            }
        }
        return neighbors;
    }

    /**
     * Copies a rectangular area from source into this instance.
     * Works correctly when source === this (self-copy with overlapping regions).
     * Out-of-bounds source/destination cells are silently skipped.
     */
    copyArea(
        source: IGrid<T>,
        xFrom: number,
        yFrom: number,
        width: number,
        height: number,
        xTo: number,
        yTo: number
    ): void {
        const snap: Array<{ dx: number; dy: number; value: T }> = [];
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const value = source.getCellValue(xFrom + dx, yFrom + dy);
                if (value !== undefined) {
                    snap.push({ dx, dy, value: this.copyCell(value) });
                }
            }
        }
        for (const { dx, dy, value } of snap) {
            this.setCellValue(xTo + dx, yTo + dy, value);
        }
    }

    /** Return a deep copy of this grid as a new instance of the same concrete type. */
    abstract clone(): this;

    walkCells(walker: (x: number, y: number, value: T) => T): void {
        const oClone: T[][] = [];
        for (let y = 0; y < this._height; ++y) {
            const oRow: T[] = [];
            for (let x = 0; x < this._width; ++x) {
                const c = this.getCellValue(x, y);
                if (c !== undefined) {
                    oRow.push(this.copyCell(c));
                }
            }
            oClone.push(oRow);
        }
        for (let y = 0; y < this._height; ++y) {
            for (let x = 0; x < this._width; ++x) {
                const value = oClone[y]?.[x];
                if (value !== undefined) {
                    this.setCellValue(x, y, walker(x, y, value));
                }
            }
        }
    }
}
