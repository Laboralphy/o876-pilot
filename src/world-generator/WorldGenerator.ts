import { IWorldGenerator } from './IWorldGenerator';

type NeighborCell = { dx: number; dy: number; value: number };

export abstract class WordGenerator implements IWorldGenerator {
    public readonly cellMap: number[][] = [];

    protected constructor(
        protected readonly worldWidth: number,
        protected readonly worldHeight: number
    ) {
        for (let y = 0; y < worldHeight; ++y) {
            const row: number[] = [];
            for (let x = 0; x < worldWidth; ++x) {
                row.push(0);
            }
            this.cellMap.push(row);
        }
    }

    get width(): number {
        return this.worldWidth;
    }

    get height(): number {
        return this.worldHeight;
    }

    setCellValue(x: number, y: number, value: number): void {
        if (x >= 0 && y >= 0 && y < this.cellMap.length && x < this.cellMap[y].length) {
            this.cellMap[y][x] = value;
        }
    }

    getCellValue(x: number, y: number): number | undefined {
        if (x >= 0 && y >= 0 && y < this.cellMap.length && x < this.cellMap[y].length) {
            return this.cellMap[y][x];
        } else {
            return undefined;
        }
    }

    getNeighbors(x: number, y: number): NeighborCell[] {
        const neighbors: NeighborCell[] = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy,
                    nx = x + dx;
                const value = this.getCellValue(nx, ny);
                if (value !== undefined) {
                    neighbors.push({ dx, dy, value });
                }
            }
        }
        return neighbors;
    }

    /**
     * Copies a rectangular area from wgSource into this instance.
     * Works correctly when wgSource === this (self-copy), even with
     * overlapping source and destination regions.
     * Source or destination cells outside bounds are silently skipped.
     */
    copyArea(
        wgSource: IWorldGenerator,
        xFrom: number,
        yFrom: number,
        width: number,
        height: number,
        xTo: number,
        yTo: number
    ): void {
        // Snapshot source area first so self-copies with overlapping regions
        // read from the original state, not partially-written destination.
        const snap: Array<{ dx: number; dy: number; value: number }> = [];
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const value = wgSource.getCellValue(xFrom + dx, yFrom + dy);
                if (value !== undefined) {
                    snap.push({ dx, dy, value });
                }
            }
        }
        for (const { dx, dy, value } of snap) {
            this.setCellValue(xTo + dx, yTo + dy, value);
        }
    }

    walkCells(walker: (x: number, y: number, value: number) => number) {
        for (let y = 0, h = this.worldHeight; y < h; ++y) {
            for (let x = 0, w = this.worldWidth; x < w; ++x) {
                const value = this.getCellValue(x, y);
                if (value !== undefined) {
                    this.setCellValue(x, y, walker(x, y, value));
                }
            }
        }
    }

    /**
     * Start generating world, filling the cell map with number values
     */
    abstract generate(): number[][];
}
