import { AstroTileDefinition } from './AstroTileDefinition';
import { ISeededRNG } from '../../../libs/mulberry32/ISeededRNG';

export interface IDrawingFunction {
    (
        ctx: CanvasRenderingContext2D,
        rng: ISeededRNG,
        tile: AstroTileDefinition,
        tileSize: number
    ): void;
}
