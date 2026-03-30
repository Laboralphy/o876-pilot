export interface IGrid<T> {
    get width(): number;
    get height(): number;
    setCellValue(x: number, y: number, value: T): void;
    getCellValue(x: number, y: number): T | undefined;
}
