export interface ITileRenderer {
    get tileSize(): number;
    buildTileset(): HTMLCanvasElement;
    getTileIndexRegistry(): Map<number, number>;
}
