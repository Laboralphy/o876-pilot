type NeighborCell<T> = { dx: number; dy: number; value: T };

export abstract class WordGenerator<T> {
    public readonly cellMap: T[][] = [];

    protected constructor(
        public readonly worldWidth: number,
        public readonly worldHeight: number
    ) {
        for (let y = 0; y < worldHeight; ++y) {
            const row: T[] = [];
            for (let x = 0; x < worldWidth; ++x) {
                row.push(this.nullValue());
            }
            this.cellMap.push(row);
        }
    }

    setCellValue(x: number, y: number, value: T): void {
        if (y < this.cellMap.length && x < this.cellMap[y].length) {
            this.cellMap[y][x] = value;
        }
    }

    getCellValue(x: number, y: number): T | undefined {
        if (y < this.cellMap.length && x < this.cellMap[y].length) {
            return this.cellMap[y][x];
        } else {
            return undefined;
        }
    }

    getNeighbors(x: number, y: number): NeighborCell<T>[] {
        const raw = this.cellMap;
        const neighbors: NeighborCell<T>[] = [];
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

    walkCells(walker: (x: number, y: number, value: T) => T) {
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
     * Return a null value of type T
     */
    abstract nullValue(): T;

    /**
     * Start generating world, filling the cell map with T values
     */
    abstract generate(): void;
}
