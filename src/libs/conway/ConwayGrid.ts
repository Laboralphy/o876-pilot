import { NumberGrid } from '../grid/NumberGrid';
import { CONWAY_CLASSIC, type ConwayRules } from './ConwayRules';

export const DEAD = 0;
export const ALIVE = 1;

/**
 * Conway's Game of Life grid.
 *
 * Extends Grid with a `step()` method that applies one generation using the
 * provided rules. Rules are fully customisable via ConwayRules — pass any
 * survival/birth set to emulate variants (HighLife, Maze, Diamoeba, …).
 *
 * Out-of-bounds neighbours count as dead (fixed boundary condition).
 *
 * Usage
 * -----
 *   const g = new ConwayGrid(80, 40);
 *   g.setCellValue(1, 0, ALIVE);
 *   // … seed more cells …
 *   g.step();          // advance one generation
 *   g.step(5);         // advance five generations at once
 */
export class ConwayGrid extends NumberGrid {
    private rules: ConwayRules;

    constructor(width: number, height: number, rules: ConwayRules = CONWAY_CLASSIC) {
        super(width, height);
        this.rules = rules;
    }

    clone(): this {
        const copy = new ConwayGrid(this._width, this._height, this.rules) as this;
        copy.copyArea(this, 0, 0, this._width, this._height, 0, 0);
        return copy;
    }

    /** Replace the rule set without resetting the grid. */
    setRules(rules: ConwayRules): void {
        this.rules = rules;
    }

    /** Advance the grid by `generations` steps (default 1). */
    step(generations = 1): void {
        for (let g = 0; g < generations; g++) {
            this._applyStep();
        }
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private _applyStep(): void {
        // Snapshot so all cells are evaluated against the same generation.
        const snap = this.cellMap.map((row) => row.slice());
        const W = this._width;
        const H = this._height;

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const liveNeighbours = this._countLive(snap, x, y, W, H);
                const isAlive = snap[y][x] === ALIVE;

                if (isAlive) {
                    const survives = this.rules.survival.includes(liveNeighbours);
                    this.setCellValue(x, y, survives ? ALIVE : DEAD);
                } else {
                    const born = this.rules.birth.includes(liveNeighbours);
                    this.setCellValue(x, y, born ? ALIVE : DEAD);
                }
            }
        }
    }

    private _countLive(snap: number[][], x: number, y: number, W: number, H: number): number {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < H && nx >= 0 && nx < W && snap[ny][nx] === ALIVE) {
                    count++;
                }
            }
        }
        return count;
    }
}
