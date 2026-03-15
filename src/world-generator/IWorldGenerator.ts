export interface IWorldGenerator<T> {
    generate(): T[][];
    get width(): number;
    get height(): number;
}
