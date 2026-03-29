import { ISeededRNG } from '../libs/mulberry32/ISeededRNG';

export interface IDrawingFunction {
    (ctx: CanvasRenderingContext2D, tileSize: number, rng: ISeededRNG): void;
}
