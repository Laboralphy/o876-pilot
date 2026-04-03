import { PatternMapRefiner } from '../src/libs/pattern-map-refiner/PatternMapRefiner';
import { NumberGrid } from '../src/libs/grid/NumberGrid';
import { describe, expect, it } from 'vitest';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Build a NumberGrid from a 2-D array (row-major). */
function gridFrom(data: number[][]): NumberGrid {
    const h = data.length;
    const w = data[0]?.length ?? 0;
    const g = new NumberGrid(w, h);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            g.setCellValue(x, y, data[y][x]);
        }
    }
    return g;
}

/** Dump a NumberGrid back to a 2-D array for easy assertions. */
function gridToArray(g: NumberGrid): number[][] {
    return Array.from({ length: g.height }, (_, y) =>
        Array.from({ length: g.width }, (_, x) => g.getCellValue(x, y) ?? -1)
    );
}

// ── searchAllPatterns ─────────────────────────────────────────────────────────

describe('PatternMapRefiner.searchAllPatterns', () => {
    it('returns empty list when pattern is empty', () => {
        const grid = gridFrom([[0, 1]]);
        const refiner = new PatternMapRefiner({ '.': [0] }, grid);
        expect(refiner.searchAllPatterns([])).toEqual([]);
    });

    it('returns empty list when pattern row is empty string', () => {
        const grid = gridFrom([[0, 1]]);
        const refiner = new PatternMapRefiner({ '.': [0] }, grid);
        expect(refiner.searchAllPatterns([''])).toEqual([]);
    });

    it('finds a single-cell pattern', () => {
        const grid = gridFrom([
            [0, 1, 0],
            [1, 0, 1],
        ]);
        const refiner = new PatternMapRefiner({ '*': [1] }, grid);
        const hits = refiner.searchAllPatterns(['*']);
        expect(hits).toEqual(
            expect.arrayContaining([
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: 2, y: 1 },
            ])
        );
        expect(hits).toHaveLength(3);
    });

    it('finds a 2×2 pattern at correct positions', () => {
        // pattern ['..', '.*']:
        //   x=0,y=0 → (0,0)=0 (1,0)=0 (0,1)=0 (1,1)=1 ✓
        //   x=2,y=0 → (2,0)=0 (3,0)=0 (2,1)=0 (3,1)=2 ✓
        //   x=1,y=0 → (1,1)=1 is NOT in [0] for '.', no match
        const grid = gridFrom([
            [0, 0, 0, 0],
            [0, 1, 0, 2],
        ]);
        const palette = { '.': [0], '*': [1, 2, 3] };
        const refiner = new PatternMapRefiner(palette, grid);
        const hits = refiner.searchAllPatterns(['..', '.*']);
        expect(hits).toEqual(
            expect.arrayContaining([
                { x: 0, y: 0 },
                { x: 2, y: 0 },
            ])
        );
        expect(hits).toHaveLength(2);
    });

    it('does not report a match when a cell value is absent from the palette list', () => {
        const grid = gridFrom([[0, 2]]);
        const refiner = new PatternMapRefiner({ '*': [1] }, grid);
        // value 2 is not in [1], so no match
        expect(refiner.searchAllPatterns(['*'])).toHaveLength(0);
    });

    it('wildcard char "?" matches any value', () => {
        const grid = gridFrom([[0, 5, 99]]);
        const refiner = new PatternMapRefiner({}, grid);
        const hits = refiner.searchAllPatterns(['?']);
        expect(hits).toHaveLength(3);
    });

    it('char absent from palette acts as wildcard', () => {
        const grid = gridFrom([[1, 2, 3]]);
        const refiner = new PatternMapRefiner({}, grid); // palette has no 'X'
        const hits = refiner.searchAllPatterns(['X']);
        expect(hits).toHaveLength(3);
    });

    it('palette char matching multiple values finds all of them', () => {
        const grid = gridFrom([[0, 1, 2, 3, 4]]);
        const refiner = new PatternMapRefiner({ '*': [1, 2, 3] }, grid);
        const hits = refiner.searchAllPatterns(['*']);
        expect(hits).toEqual(
            expect.arrayContaining([
                { x: 1, y: 0 },
                { x: 2, y: 0 },
                { x: 3, y: 0 },
            ])
        );
        expect(hits).toHaveLength(3);
    });

    it('returns empty list when pattern is larger than the grid', () => {
        const grid = gridFrom([[0, 0]]);
        const refiner = new PatternMapRefiner({ '.': [0] }, grid);
        expect(refiner.searchAllPatterns(['...'])).toHaveLength(0);
    });

    it('finds a tall (3-row) pattern', () => {
        const grid = gridFrom([[1], [1], [1], [0]]);
        const refiner = new PatternMapRefiner({ '#': [1] }, grid);
        const hits = refiner.searchAllPatterns(['#', '#', '#']);
        expect(hits).toEqual([{ x: 0, y: 0 }]);
    });

    it('does not find a match when one cell mismatches', () => {
        const grid = gridFrom([
            [0, 0],
            [0, 9], // 9 is not in palette for '*'
        ]);
        const refiner = new PatternMapRefiner({ '.': [0], '*': [1, 2] }, grid);
        expect(refiner.searchAllPatterns(['..', '.*'])).toHaveLength(0);
    });

    it('returns all occurrences including overlapping ones', () => {
        // Three overlapping matches of pattern '00' in a row of five zeros
        const grid = gridFrom([[0, 0, 0, 0, 0]]);
        const refiner = new PatternMapRefiner({ '.': [0] }, grid);
        const hits = refiner.searchAllPatterns(['..']);
        expect(hits).toHaveLength(4);
    });
});

// ── replaceAt ─────────────────────────────────────────────────────────────────

describe('PatternMapRefiner.replaceAt', () => {
    it('replaces cells according to palette first value', () => {
        const grid = gridFrom([[0, 0, 0]]);
        const refiner = new PatternMapRefiner({ '#': [9] }, grid);
        refiner.replaceAt(1, 0, ['#']);
        expect(gridToArray(grid)).toEqual([[0, 9, 0]]);
    });

    it('leaves "?" cells unchanged', () => {
        const grid = gridFrom([[1, 2, 3]]);
        const refiner = new PatternMapRefiner({ '#': [9] }, grid);
        refiner.replaceAt(0, 0, ['?#?']);
        expect(gridToArray(grid)).toEqual([[1, 9, 3]]);
    });

    it('leaves cells unchanged for chars absent from palette', () => {
        const grid = gridFrom([[5, 5, 5]]);
        const refiner = new PatternMapRefiner({}, grid);
        refiner.replaceAt(0, 0, ['XYZ']); // none in palette
        expect(gridToArray(grid)).toEqual([[5, 5, 5]]);
    });

    it('uses the first value in the palette list when multiple values defined', () => {
        const grid = gridFrom([[0, 0]]);
        const refiner = new PatternMapRefiner({ '*': [7, 8, 9] }, grid);
        refiner.replaceAt(0, 0, ['**']);
        expect(gridToArray(grid)).toEqual([[7, 7]]);
    });

    it('applies a 2-row replacement correctly', () => {
        const grid = gridFrom([
            [0, 0],
            [0, 0],
        ]);
        const refiner = new PatternMapRefiner({ A: [1], B: [2] }, grid);
        refiner.replaceAt(0, 0, ['AB', 'BA']);
        expect(gridToArray(grid)).toEqual([
            [1, 2],
            [2, 1],
        ]);
    });

    it('does not write out-of-bounds when replacement is larger than remaining grid', () => {
        const grid = gridFrom([[0, 0, 0]]);
        const refiner = new PatternMapRefiner({ '#': [9] }, grid);
        // replaceAt x=2, pattern width=3 → only x=2 is valid
        expect(() => refiner.replaceAt(2, 0, ['###'])).not.toThrow();
        // x=2 written, x=3 and x=4 are out of bounds and silently ignored
        expect(grid.getCellValue(2, 0)).toBe(9);
        expect(grid.getCellValue(3, 0)).toBeUndefined();
    });

    it('round-trip: search then replace stamps the correct tile', () => {
        const grid = gridFrom([
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0],
        ]);
        const palette = { '.': [0], '*': [1], S: [42] };
        const refiner = new PatternMapRefiner(palette, grid);
        const hits = refiner.searchAllPatterns(['.', '*']);
        // Pattern ['.', '*'] matches at (1,0): grid[0][1]=0, grid[1][1]=1
        expect(hits).toEqual(expect.arrayContaining([{ x: 1, y: 0 }]));
        refiner.replaceAt(1, 0, ['.', 'S']);
        expect(grid.getCellValue(1, 1)).toBe(42);
        expect(grid.getCellValue(1, 0)).toBe(0); // '.' → unchanged (first value is 0)
    });

    it('searching more complexe pattern', () => {
        const grid = gridFrom([
            [0, 0, 0, 0],
            [0, 1, 0, 1],
            [0, 0, 0, 0],
        ]);
        const palette = { '.': [0], '*': [1], S: [42] };
        const refiner = new PatternMapRefiner(palette, grid);
        const hits = refiner.searchAllPatterns(['..', '.*']);
        expect(hits).toEqual(
            expect.arrayContaining([
                { x: 0, y: 0 },
                { x: 2, y: 0 },
            ])
        );
    });
    it('searching more complexe pattern with ? wildcard', () => {
        const grid = gridFrom([
            [0, 0, 0, 0],
            [0, 1, 2, 1],
            [0, 0, 0, 0],
        ]);
        const palette = { '.': [0], '*': [1], S: [42] };
        const refiner = new PatternMapRefiner(palette, grid);
        const hits = refiner.searchAllPatterns(['..', '?*']);
        expect(hits).toEqual(
            expect.arrayContaining([
                { x: 0, y: 0 },
                { x: 2, y: 0 },
            ])
        );
        const hits2 = refiner.searchAllPatterns(['..', '*?']);
        expect(hits2).toEqual(expect.arrayContaining([{ x: 1, y: 0 }]));
    });
});
