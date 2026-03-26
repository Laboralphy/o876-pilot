export interface IWorldGenerator {
    generate(): number[][];
    get width(): number;
    get height(): number;
    setCellValue(x: number, y: number, value: number): void;
    getCellValue(x: number, y: number): number | undefined;
}
