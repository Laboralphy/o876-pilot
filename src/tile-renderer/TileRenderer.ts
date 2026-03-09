import { ITileRenderer } from './ITileRenderer';

type TileDefRenderer = {
    renderer: string;
};

type RendererFunction<T extends TileDefRenderer> = (
    ctx: CanvasRenderingContext2D,
    tile: T,
    tileSize: number
) => void;

export class TileRenderer<T extends TileDefRenderer> implements ITileRenderer<T> {
    private readonly tileData: T[];
    private readonly tileSize: number;
    private readonly renderers: Record<string, RendererFunction<T>>;
    constructor(tileData: T[], tileSize: number, renderers: Record<string, RendererFunction<T>>) {
        this.tileData = tileData;
        this.tileSize = tileSize;
        this.renderers = renderers;
        this.buildTileset(this.tileData, this.tileSize);
    }

    drawTile(ctx: CanvasRenderingContext2D, tile: T, ox: number, oy: number, tileSize: number) {
        if (this.hasRenderer(tile.renderer)) {
            ctx.save();
            ctx.translate(ox, oy);
            ctx.beginPath();
            ctx.rect(0, 0, tileSize, tileSize);
            ctx.clip();
            this.renderers[tile.renderer](ctx, tile, tileSize);
            ctx.strokeStyle = '#ffffff07';
            ctx.lineWidth = 1;
            ctx.strokeRect(0.5, 0.5, tileSize - 1, tileSize - 1);
            ctx.restore();
        }
    }

    hasRenderer(renderer: string): boolean {
        return renderer in this.renderers;
    }

    buildTileset(tiles: T[], tileSize: number): HTMLCanvasElement {
        const tileCount = tiles.length;
        const tilesetWidth = Math.ceil(Math.sqrt(tileCount));
        const canvas = document.createElement('canvas');
        canvas.width = tilesetWidth * tileSize;
        canvas.height = tilesetWidth * tileSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error("Can't get tileset canvas rendering 2D context");
        }
        let oy: number = 0;
        let ox: number = 0;
        tiles.forEach((tile) => {
            this.drawTile(ctx, tile, ox, oy, tileSize);
            ox += tileSize;
            if (ox >= canvas.width) {
                ox = 0;
                oy += tileSize;
            }
        });
        return canvas;
    }
}
