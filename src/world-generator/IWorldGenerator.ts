import { IGrid } from '../libs/grid/IGrid';

export interface IWorldGenerator extends IGrid<number> {
    generate(): number[][];
    setCellValue(x: number, y: number, value: number): void;
    getCellValue(x: number, y: number): number | undefined;
}
