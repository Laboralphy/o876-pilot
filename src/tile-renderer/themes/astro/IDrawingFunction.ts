import { AstroTileDefinition } from './AstroTileDefinition';
import { ISeededRNG } from '../../../libs/mulberry32/ISeededRNG';

export interface IDrawingFunction {
    (
        ctx: CanvasRenderingContext2D,
        tile: AstroTileDefinition,
        tileSize: number,
        rng: ISeededRNG
    ): void;
}
