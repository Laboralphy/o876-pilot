type CellDefinition = {
    id: number;
};

type NeighborCell = { dx: number; dy: number; value: number };

export abstract class WordGeneratorAbstract<T extends CellDefinition> {
    protected readonly cellData = new Map<number, T>();
    protected readonly mapData: number[][] = [];

    protected constructor(
        cellData: T[],
        private readonly worldWidth: number,
        private readonly worldHeight: number
    ) {
        for (const cell of cellData) {
            this.cellData.set(cell.id, cell);
        }
    }

    abstract initMapDataCell(x: number, y: number): number;

    initMapData(): void {
        this._mapData.splice(0, this._mapData.length);
        for (let y = 0; y < this.worldHeight; ++y) {
            const row: number[] = [];
            for (let x = 0; x < this.worldWidth; ++x) {
                row.push(this.initMapDataCell(x, y));
            }
            this._mapData.push(row);
        }
    }

    getNeighbors(x: number, y: number): NeighborCell[] {
        const raw = this._mapData;
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

    abstract generateMapData(): void;
}
