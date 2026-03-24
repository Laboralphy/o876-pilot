export type TileDefinition = {
    id: number;
};

export interface ITileRenderer {
    get tileSize(): number;
    buildTileset(): HTMLCanvasElement;
    getTileIndexRegistry(): Map<number, number>;
}
