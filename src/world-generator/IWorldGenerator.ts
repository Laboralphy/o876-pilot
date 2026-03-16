export interface IWorldGenerator {
    generate(): number[][];
    get width(): number;
    get height(): number;
}
