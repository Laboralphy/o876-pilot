import { describe, expect, it } from 'vitest';
import { ConwayGrid, ALIVE, DEAD } from '../src/libs/conway/ConwayGrid';
import {
    CONWAY_CLASSIC,
    CONWAY_HIGHLIFE,
    CONWAY_MAZE,
    type ConwayRules,
} from '../src/libs/conway/ConwayRules';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a ConwayGrid from a 2-D array of 0/1 values. */
function fromPattern(pattern: number[][]): ConwayGrid {
    const h = pattern.length;
    const w = pattern[0].length;
    const g = new ConwayGrid(w, h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            g.setCellValue(x, y, pattern[y][x]);
        }
    }
    return g;
}

/** Dump a ConwayGrid into a 2-D array for easy comparison. */
function toPattern(g: ConwayGrid): number[][] {
    return Array.from({ length: g.height }, (_, y) =>
        Array.from({ length: g.width }, (_, x) => g.getCellValue(x, y) ?? DEAD)
    );
}

const _ = DEAD;
const X = ALIVE;

// ─── Construction ─────────────────────────────────────────────────────────────

describe('ConwayGrid construction', () => {
    it('initialises all cells as dead', () => {
        const g = new ConwayGrid(5, 4);
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 5; x++) {
                expect(g.getCellValue(x, y)).toBe(DEAD);
            }
        }
    });

    it('reports correct width and height', () => {
        const g = new ConwayGrid(7, 3);
        expect(g.width).toBe(7);
        expect(g.height).toBe(3);
    });

    it('getCellValue returns undefined for out-of-bounds', () => {
        const g = new ConwayGrid(3, 3);
        expect(g.getCellValue(-1, 0)).toBeUndefined();
        expect(g.getCellValue(0, -1)).toBeUndefined();
        expect(g.getCellValue(3, 0)).toBeUndefined();
        expect(g.getCellValue(0, 3)).toBeUndefined();
    });
});

// ─── Classic Game of Life patterns ───────────────────────────────────────────

describe('Classic rules — still lifes (should not change after step)', () => {
    it('Block (2×2) remains unchanged', () => {
        // . . . .
        // . X X .
        // . X X .
        // . . . .
        const g = fromPattern([
            [_, _, _, _],
            [_, X, X, _],
            [_, X, X, _],
            [_, _, _, _],
        ]);
        g.step();
        expect(toPattern(g)).toEqual([
            [_, _, _, _],
            [_, X, X, _],
            [_, X, X, _],
            [_, _, _, _],
        ]);
    });

    it('Beehive remains unchanged', () => {
        // . . . . .
        // . . X X .
        // . X . . X  ← note: standard beehive
        // . . X X .
        // . . . . .
        const g = fromPattern([
            [_, _, _, _, _],
            [_, _, X, X, _],
            [_, X, _, _, X],
            [_, _, X, X, _],
            [_, _, _, _, _],
        ]);
        const before = toPattern(g);
        g.step();
        expect(toPattern(g)).toEqual(before);
    });
});

describe('Classic rules — oscillators', () => {
    it('Blinker (period 2) alternates between horizontal and vertical', () => {
        // Horizontal blinker:
        // . . . . .
        // . X X X .
        // . . . . .
        const horizontal = [
            [_, _, _, _, _],
            [_, X, X, X, _],
            [_, _, _, _, _],
        ];
        // Vertical blinker:
        // . . . . .
        // . . X . .
        // . . X . .
        // . . X . .
        // . . . . .
        // (but our grid is 5×3, so vertical stays within bounds as 3-tall)
        const g = fromPattern(horizontal);
        g.step(); // → vertical
        expect(toPattern(g)).toEqual([
            [_, _, X, _, _],
            [_, _, X, _, _],
            [_, _, X, _, _],
        ]);
        g.step(); // → horizontal again
        expect(toPattern(g)).toEqual(horizontal);
    });

    it('Toad (period 2) returns to original after 2 steps', () => {
        const toad = [
            [_, _, _, _, _, _],
            [_, _, X, X, X, _],
            [_, X, X, X, _, _],
            [_, _, _, _, _, _],
        ];
        const g = fromPattern(toad);
        g.step(2);
        expect(toPattern(g)).toEqual(toad);
    });
});

describe('Classic rules — extinction and growth', () => {
    it('single live cell dies (underpopulation)', () => {
        const g = fromPattern([
            [_, _, _],
            [_, X, _],
            [_, _, _],
        ]);
        g.step();
        expect(toPattern(g)).toEqual([
            [_, _, _],
            [_, _, _],
            [_, _, _],
        ]);
    });

    it('two adjacent cells both die (underpopulation)', () => {
        const g = fromPattern([
            [_, _, _, _],
            [_, X, X, _],
            [_, _, _, _],
        ]);
        g.step();
        expect(toPattern(g)).toEqual([
            [_, _, _, _],
            [_, _, _, _],
            [_, _, _, _],
        ]);
    });

    it('cell with 4 neighbours dies (overpopulation)', () => {
        // Centre cell has exactly 4 live neighbours → dies
        const g = fromPattern([
            [_, X, _],
            [X, X, X],
            [_, X, _],
        ]);
        g.step();
        // Centre dies; corners with exactly 3 neighbours (from the plus) are born
        expect(g.getCellValue(1, 1)).toBe(DEAD);
    });

    it('dead cell with exactly 3 live neighbours is born', () => {
        // Three cells in an L — the empty corner becomes alive
        const g = fromPattern([
            [X, X, _],
            [X, _, _],
            [_, _, _],
        ]);
        g.step();
        expect(g.getCellValue(1, 1)).toBe(ALIVE);
    });
});

describe('Classic rules — step(n)', () => {
    it('step(0) leaves the grid unchanged', () => {
        const g = fromPattern([
            [_, _, _, _, _],
            [_, X, X, X, _],
            [_, _, _, _, _],
        ]);
        const before = toPattern(g);
        g.step(0);
        expect(toPattern(g)).toEqual(before);
    });

    it('step(2) equals calling step() twice', () => {
        const pattern = [
            [_, _, _, _, _],
            [_, X, X, X, _],
            [_, _, _, _, _],
        ];
        const g1 = fromPattern(pattern);
        g1.step();
        g1.step();

        const g2 = fromPattern(pattern);
        g2.step(2);

        expect(toPattern(g2)).toEqual(toPattern(g1));
    });
});

// ─── Border behaviour ─────────────────────────────────────────────────────────

describe('Border behaviour (out-of-bounds = dead)', () => {
    it('a live cell on the edge with no in-bounds neighbours dies', () => {
        const g = new ConwayGrid(3, 3);
        g.setCellValue(0, 0, ALIVE); // top-left corner, only 3 possible neighbours
        g.step();
        // With only 3 possible in-bounds neighbours all dead, it dies
        expect(g.getCellValue(0, 0)).toBe(DEAD);
    });

    it('three cells at the edge can produce a birth', () => {
        // Row of 3 at y=0 — the cell at (1,1) sees 3 live neighbours and is born
        const g = fromPattern([
            [X, X, X],
            [_, _, _],
            [_, _, _],
        ]);
        g.step();
        expect(g.getCellValue(1, 1)).toBe(ALIVE);
    });
});

// ─── Custom rules ─────────────────────────────────────────────────────────────

describe('setRules — custom rule variants', () => {
    it('all-dead rule keeps everything dead', () => {
        const noBirth: ConwayRules = { survival: [], birth: [] };
        const g = fromPattern([
            [_, X, _],
            [X, X, X],
            [_, X, _],
        ]);
        g.setRules(noBirth);
        g.step();
        expect(toPattern(g)).toEqual([
            [_, _, _],
            [_, _, _],
            [_, _, _],
        ]);
    });

    it('survival-always rule keeps all live cells alive', () => {
        const surviveAll: ConwayRules = {
            survival: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            birth: [],
        };
        const pattern = [
            [_, X, _],
            [_, X, _],
            [_, X, _],
        ];
        const g = fromPattern(pattern);
        g.setRules(surviveAll);
        g.step();
        // All originally-alive cells stay alive; no new births
        expect(g.getCellValue(1, 0)).toBe(ALIVE);
        expect(g.getCellValue(1, 1)).toBe(ALIVE);
        expect(g.getCellValue(1, 2)).toBe(ALIVE);
        // Cells that were dead stay dead (birth=[])
        expect(g.getCellValue(0, 0)).toBe(DEAD);
    });

    it('switching to HighLife rules allows birth on 6 neighbours', () => {
        // Classic would NOT birth a cell with 6 live neighbours; HighLife would
        const g = new ConwayGrid(5, 5, CONWAY_CLASSIC);
        // Surround (2,2) with 6 live neighbours
        g.setCellValue(1, 1, ALIVE);
        g.setCellValue(2, 1, ALIVE);
        g.setCellValue(3, 1, ALIVE);
        g.setCellValue(1, 2, ALIVE);
        g.setCellValue(3, 2, ALIVE);
        g.setCellValue(1, 3, ALIVE);
        // (2,2) is dead with 6 neighbours
        expect(g.getCellValue(2, 2)).toBe(DEAD);

        const gClassic = fromPattern(toPattern(g));
        gClassic.step();
        expect(gClassic.getCellValue(2, 2)).toBe(DEAD); // classic: no birth on 6

        g.setRules(CONWAY_HIGHLIFE);
        g.step();
        expect(g.getCellValue(2, 2)).toBe(ALIVE); // highlife: birth on 6
    });

    it('Maze rules keep a live cell alive with up to 5 neighbours', () => {
        // In CONWAY_MAZE survival includes 1–5, so a cell with 5 neighbours survives
        const g = new ConwayGrid(5, 5, CONWAY_MAZE);
        // Centre (2,2) with exactly 5 live neighbours
        g.setCellValue(2, 2, ALIVE);
        g.setCellValue(1, 1, ALIVE);
        g.setCellValue(2, 1, ALIVE);
        g.setCellValue(3, 1, ALIVE);
        g.setCellValue(1, 2, ALIVE);
        g.setCellValue(3, 2, ALIVE);
        g.step();
        expect(g.getCellValue(2, 2)).toBe(ALIVE);

        // Same 5-neighbour scenario under Classic rules: should die (overpopulation)
        const gClassic = new ConwayGrid(5, 5, CONWAY_CLASSIC);
        gClassic.setCellValue(2, 2, ALIVE);
        gClassic.setCellValue(1, 1, ALIVE);
        gClassic.setCellValue(2, 1, ALIVE);
        gClassic.setCellValue(3, 1, ALIVE);
        gClassic.setCellValue(1, 2, ALIVE);
        gClassic.setCellValue(3, 2, ALIVE);
        gClassic.step();
        expect(gClassic.getCellValue(2, 2)).toBe(DEAD);
    });
});

// ─── Preset rules sanity check ────────────────────────────────────────────────

describe('Preset ConwayRules values', () => {
    it('CONWAY_CLASSIC has survival [2,3] and birth [3]', () => {
        expect(CONWAY_CLASSIC.survival).toContain(2);
        expect(CONWAY_CLASSIC.survival).toContain(3);
        expect(CONWAY_CLASSIC.survival).not.toContain(1);
        expect(CONWAY_CLASSIC.birth).toEqual([3]);
    });

    it('CONWAY_HIGHLIFE birth includes 6', () => {
        expect(CONWAY_HIGHLIFE.birth).toContain(6);
    });

    it('CONWAY_MAZE survival includes counts 1 through 5', () => {
        for (let n = 1; n <= 5; n++) {
            expect(CONWAY_MAZE.survival).toContain(n);
        }
    });
});
