import { ITileRenderer } from './ITileRenderer';

export type TileDefinition = {
    id: number;
};

export abstract class TileRenderer<T extends TileDefinition> implements ITileRenderer {
    protected constructor(
        private readonly _tileData: T[],
        private readonly _tileSize: number
    ) {}

    getTileIndexRegistry(): Map<number, number> {
        const registry = new Map<number, number>();
        this._tileData.forEach((tile, index) => {
            registry.set(tile.id, index);
        });
        return registry;
    }

    get tileSize(): number {
        return this._tileSize;
    }

    abstract drawTile(ctx: CanvasRenderingContext2D, tile: T, tileSize: number): void;

    private renderTile(
        ctx: CanvasRenderingContext2D,
        tile: T,
        ox: number,
        oy: number,
        tileSize: number
    ) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.beginPath();
        ctx.rect(0, 0, tileSize, tileSize);
        ctx.clip();
        this.drawTile(ctx, tile, tileSize);
        ctx.restore();
    }

    buildTileset(): HTMLCanvasElement {
        const tiles = this._tileData;
        const tileSize = this._tileSize;
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
            this.renderTile(ctx, tile, ox, oy, tileSize);
            ox += tileSize;
            if (ox >= canvas.width) {
                ox = 0;
                oy += tileSize;
            }
        });
        return canvas;
    }
}
