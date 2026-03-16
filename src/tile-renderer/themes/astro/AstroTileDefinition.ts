import { TileDefinition } from '../../ITileRenderer';

export type AstroTileDefinition = TileDefinition & {
    renderer: string;
    color: number;
    accent: number;
    variation?: number;
};
