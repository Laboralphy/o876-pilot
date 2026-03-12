import { WordGenerator } from './WorldGenerator';

export type T01Cell = {
    id: number;
    weight: number;
};

const CELLS: T01Cell[] = [
    {
        id: 0,
        weight: 65,
    },
    {
        id: 1,
        weight: 18,
    },
    {
        id: 2,
        weight: 10,
    },
    {
        id: 3,
        weight: 5,
    },
    {
        id: 4,
        weight: 2,
    },
];

export class T01WorldGenerator extends WordGenerator {
    private totalWeight: number = 0;
    private cellData = new Map<number, T01Cell>();
    constructor(worldWidth: number, worldHeight: number) {
        super(worldWidth, worldHeight);
    }

    private initMapDataCell(): number {
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

        for (let y = 0, maxy = this.mapData.length; y < maxy; y++) {
            for (let x = 0, maxx = this.mapData[y].length; x < maxx; x++) {
                const id = this.mapData[y][x];
                if (Math.random() > 0.4) {
                    continue;
                }
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
                this.mapData[y][x] = best;
            }
        }
        return this.mapData;
    }
}
