export interface ITileRenderer<T> {
    drawTile(
        ctx: CanvasRenderingContext2D,
        tile: T,
        ox: number,
        oy: number,
        tileSize: number
    ): void;
    hasRenderer(renderer: string): boolean;
}
