import { TileDefinition } from './tile-definition';
import { WordGeneratorAbstract } from './WorldGeneratorAbstract';

export class MyWordGenerator extends WordGeneratorAbstract<TileDefinition> {
    private totalWeight: number = 0;
    constructor(tileData: TileDefinition[], worldWidth: number, worldHeight: number) {
        super(tileData, worldWidth, worldHeight);
        this.totalWeight = tileData.reduce(
            (totalWeight: number, tile: TileDefinition) => totalWeight + tile.weight,
            0
        );
    }

    initMapDataCell(): number {
        let r = Math.random() * this.totalWeight;
        for (const t of this.tileData.values()) {
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
