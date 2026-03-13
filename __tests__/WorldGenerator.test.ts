import { describe, expect, it } from 'vitest';
import { T01WordGenerator } from '../src/src/world-generator/t01';

describe('WorldGenerator', () => {
    it('should produce a 20x20 map with only 0 or 1', () => {
        const CELLS = [
            {
                id: 0,
                solid: false,
                weight: 40,
            },
            {
                id: 1,
                solid: true,
                weight: 2,
            },
        ];
        const wg = new T01WordGenerator(20, 20);
        CELLS.forEach((cell) => {
            wg.cellData.set(cell.id, cell);
        });
        wg.generateMapData();
        expect(wg.mapData.length).toBe(20);
        expect(wg.mapData.every((row) => row.length === 20)).toBe(true);
        expect(wg.mapData.every((row) => row.every((cell) => cell === 1 || cell === 0))).toBe(true);
    });
});
