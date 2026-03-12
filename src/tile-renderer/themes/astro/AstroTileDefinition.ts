import { TileDefinition } from '../../TileRenderer';

export type AstroTileDefinition = TileDefinition & {
    renderer: string;
    color: number;
    accent: number;
};
