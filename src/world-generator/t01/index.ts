import { WordGenerator } from '../WorldGenerator';
import { CELLS } from './cells';

export type T01Cell = {
    id: number;
    weight: number;
};

export class T01WordGenerator extends WordGenerator {
    private totalWeight: number = 0;
    private cellData = new Map<number, T01Cell>();
    constructor(worldWidth: number, worldHeight: number) {
        super(worldWidth, worldHeight);
    }

    initMapDataCell(): number {
        let r = Math.random() * this.totalWeight;
        for (const t of this.cellData.values()) {
            r -= t.weight;
            if (r <= 0) {
                return t.id;
            }
        }
        return 0;
    }

    generateMapData() {
        CELLS.forEach((cell) => {
            this.cellData.set(cell.id, cell);
        });
        this.totalWeight = CELLS.reduce(
            (totalWeight: number, cell: T01Cell) => totalWeight + cell.weight,
            0
        );
        this.walkMapData(() => this.initMapDataCell());
        const raw = this.mapData;

        this.mapData.splice(0, this.mapData.length);
        raw.map((row, y) =>
            row.map((id, x) => {
                if (Math.random() > 0.4) return id;
                const neighbors = this.getNeighbors(x, y);
                const freq = new Map<number, number>();
                let best = id,
                    bestC = 0;
                for (const { value: n } of neighbors) {
                    freq.set(n, (freq.get(n) ?? 0) + 1);
                    const freqn = freq.get(n) ?? 1;
                    if (freqn > bestC) {
                        bestC = freqn;
                        best = n;
                    }
                }
                return best;
            })
        ).forEach((row) => {
            this.mapData.push(row);
        });
    }
}
