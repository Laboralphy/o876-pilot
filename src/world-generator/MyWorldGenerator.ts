import { WordGeneratorAbstract } from './WorldGeneratorAbstract';

type T01Cell = {
    id: number;
    weight: number;
    solid: boolean;
};

export class MyWordGenerator extends WordGeneratorAbstract<T01Cell> {
    private totalWeight: number = 0;
    constructor(cellData: T01Cell[], worldWidth: number, worldHeight: number) {
        super(cellData, worldWidth, worldHeight);
        this.totalWeight = cellData.reduce(
            (totalWeight: number, cell: T01Cell) => totalWeight + cell.weight,
            0
        );
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
        this.initMapData();
        const raw = this._mapData;

        this._mapData = raw.map((row, y) =>
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
        );
    }
}
