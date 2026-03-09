type NeighborCell = { dx: number; dy: number; value: number };

export abstract class WordGenerator {
    public readonly mapData: number[][] = [];

    protected constructor(
        private readonly worldWidth: number,
        private readonly worldHeight: number
    ) {
        this.initMapData();
    }

    initMapData(): void {
        this.mapData.splice(0, this.mapData.length);
        for (let y = 0; y < this.worldHeight; ++y) {
            const row: number[] = [];
            for (let x = 0; x < this.worldWidth; ++x) {
                row.push(0);
            }
            this.mapData.push(row);
        }
    }

    getNeighbors(x: number, y: number): NeighborCell[] {
        const raw = this.mapData;
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

    walkMapData(walker: (x: number, y: number) => number) {
        for (let y = 0; y < this.worldHeight; ++y) {
            for (let x = 0; x < this.worldWidth; ++x) {
                walker(x, y);
            }
        }
    }

    abstract generateMapData(): void;
}
