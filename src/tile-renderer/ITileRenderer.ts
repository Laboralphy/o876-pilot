import { ISeededRNG } from '../libs/mulberry32/ISeededRNG';

export type TileDefinition = {
    id: number;
};

export interface ITileRenderer {
    buildTileset(tileSize: number, rng: ISeededRNG): HTMLCanvasElement;
    getTileIndexRegistry(): Map<number, number>;
}
