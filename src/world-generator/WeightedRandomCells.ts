import { WordGenerator } from './WorldGenerator';
import { ISeededRNG } from '../libs/mulberry32/ISeededRNG';

export type WeightedRandomCellDefinition = {
    id: number;
    weight: number;
};

/**
 * Weighted random cell generator for world generation.
 * This generator will randomly choose a cell from a weighted list of cells.
 * And will prioritize cells of the same weight in order to form clusters of cells.
 */
export class WeightedRandomCells extends WordGenerator {
    private totalWeight: number = 0;
    private cellData = new Map<number, WeightedRandomCellDefinition>();
    constructor(
        private readonly cellDefinition: WeightedRandomCellDefinition[],
        worldWidth: number,
        worldHeight: number,
        protected readonly rng: ISeededRNG
    ) {
        super(worldWidth, worldHeight);
    }

    private initMapDataCell(): number {
        let r = this.rng.nextInt(0, this.totalWeight);
        for (const t of this.cellData.values()) {
            r -= t.weight;
            if (r <= 0) {
                return t.id;
            }
        }
        return 0;
    }

    generateMapData() {
        this.cellDefinition.forEach((cell) => {
            this.cellData.set(cell.id, cell);
        });
        this.totalWeight = this.cellDefinition.reduce(
            (totalWeight: number, cell: WeightedRandomCellDefinition) => totalWeight + cell.weight,
            0
        );
        this.walkMapData(() => this.initMapDataCell());

        for (let y = 0, maxy = this.mapData.length; y < maxy; y++) {
            for (let x = 0, maxx = this.mapData[y].length; x < maxx; x++) {
                const id = this.mapData[y][x];
                if (this.rng.nextBool(0.6)) {
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
