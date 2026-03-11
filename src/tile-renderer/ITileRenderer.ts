export interface ITileRenderer {
    get tileSize(): number;
    buildTileset(): HTMLCanvasElement;
}
