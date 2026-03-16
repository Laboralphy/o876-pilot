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
        if (y < this.cellMap.length && x < this.cellMap[y].length) {
            this.cellMap[y][x] = value;
        }
    }

    getCellValue(x: number, y: number): number | undefined {
        if (y < this.cellMap.length && x < this.cellMap[y].length) {
            return this.cellMap[y][x];
        } else {
            return undefined;
        }
    }

    getNeighbors(x: number, y: number): NeighborCell[] {
        const raw = this.cellMap;
        const neighbors: NeighborCell[] = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy,
                    nx = x + dx;
                if (ny >= 0 && ny < this.worldHeight && nx >= 0 && nx < this.worldWidth) {
                    neighbors.push({ dx, dy, value: raw[ny][nx] });
                }
            }
        }
        return neighbors;
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
