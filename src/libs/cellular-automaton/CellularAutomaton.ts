import { WordGenerator } from '../../world-generator/WorldGenerator';
import type { ISeededRNG } from '../mulberry32/ISeededRNG';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_NOISE    = 0.45; // default fill ratio if generateNoise() not called explicitly
const CA_ITERATIONS    = 5;    // number of cellular-automaton steps
const SOLID_THRESHOLD  = 5;    // solid neighbour count (out of 8) at which a cell becomes solid

export const CA_FLOOR = 0;
export const CA_WALL  = 1;

// ─── CellularAutomaton ────────────────────────────────────────────────────────

/**
 * Cellular-automaton world generator that produces organic, cave-like maps.
 *
 * Typical usage
 * -------------
 *   const ca = new CellularAutomaton(rng, 80, 50);
 *   ca.carvePassage(0, 24, 1, 3);   // opening on the left border
 *   ca.carvePassage(79, 24, 1, 3);  // opening on the right border
 *   ca.generateNoise(0.45);
 *   ca.generate();
 *
 * Calling generate() without generateNoise() first auto-applies DEFAULT_NOISE.
 *
 * Cell values
 * -----------
 *   CA_FLOOR = 0   open / walkable
 *   CA_WALL  = 1   solid wall
 */
export class CellularAutomaton extends WordGenerator {
    private readonly _rng: ISeededRNG;
    /** Cell keys (y * width + x) that the automaton must never overwrite. */
    private readonly _protected = new Set<number>();
    private _noiseApplied = false;

    constructor(rng: ISeededRNG, width: number, height: number) {
        super(width, height);
        this._rng = rng;
    }

    // ── Initialisation ────────────────────────────────────────────────────────

    /**
     * Fills the map with random noise.
     * @param percent  Probability [0–1] that each cell starts as solid.
     */
    generateNoise(percent: number): void {
        this.walkCells((_x, _y, _v) =>
            this._rng.nextBool(percent) ? CA_WALL : CA_FLOOR
        );
        this._noiseApplied = true;
    }

    /**
     * Marks a rectangular area as a permanent floor passage.
     * Protected cells are set to CA_FLOOR and will never be overwritten by
     * the automaton — use this to guarantee open entry/exit corridors through
     * the border walls.
     */
    carvePassage(x: number, y: number, width: number, height: number): void {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const px = x + dx;
                const py = y + dy;
                this.setCellValue(px, py, CA_FLOOR);
                this._protected.add(py * this.width + px);
            }
        }
    }

    // ── Generation ────────────────────────────────────────────────────────────

    /**
     * Runs the cellular automaton and returns the finished cell map.
     * If generateNoise() has not been called yet, applies DEFAULT_NOISE first.
     */
    generate(): number[][] {
        if (!this._noiseApplied) {
            this.generateNoise(DEFAULT_NOISE);
        }
        for (let i = 0; i < CA_ITERATIONS; i++) {
            this._step();
        }
        // Guarantee that all carved passages survived the automaton.
        for (const key of this._protected) {
            const x = key % this.width;
            const y = Math.floor(key / this.width);
            this.setCellValue(x, y, CA_FLOOR);
        }
        return this.cellMap;
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    /**
     * One CA step: evaluates every non-protected cell against its 8 neighbours.
     * Out-of-bounds neighbours count as solid, keeping the border as a wall.
     * Changes are applied from a snapshot so no cascade occurs within a step.
     */
    private _step(): void {
        const snap = this.cellMap.map((row) => row.slice());
        const W = this.width;
        const H = this.height;

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                if (this._protected.has(y * W + x)) continue;

                let solid = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const ny = y + dy;
                        const nx = x + dx;
                        if (
                            ny < 0 || ny >= H ||
                            nx < 0 || nx >= W ||
                            snap[ny][nx] === CA_WALL
                        ) {
                            solid++;
                        }
                    }
                }

                this.setCellValue(x, y, solid >= SOLID_THRESHOLD ? CA_WALL : CA_FLOOR);
            }
        }
    }
}
