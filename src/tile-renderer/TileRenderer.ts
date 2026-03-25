import { ITileRenderer, TileDefinition } from './ITileRenderer';
import { ISeededRNG } from '../libs/mulberry32/ISeededRNG';

export abstract class TileRenderer<T extends TileDefinition> implements ITileRenderer {
    protected constructor(
        private readonly _tileData: T[],
        protected readonly _tileSize: number,
        protected readonly rng: ISeededRNG,
        protected readonly options: Record<string, unknown> = {}
    ) {}

    get tileSize(): number {
        return this._tileSize;
    }

    getTileIndexRegistry(): Map<number, number> {
        const registry = new Map<number, number>();
        this._tileData.forEach((tile, index) => {
            registry.set(tile.id, index);
        });
        return registry;
    }

    abstract drawTile(
        ctx: CanvasRenderingContext2D,
        tile: T,
        tileSize: number,
        rng: ISeededRNG
    ): void;

    private renderTile(ctx: CanvasRenderingContext2D, tile: T, ox: number, oy: number) {
        const tileSize = this._tileSize;
        const rng = this.rng;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.beginPath();
        ctx.rect(0, 0, tileSize, tileSize);
        ctx.clip();
        this.drawTile(ctx, tile, tileSize, rng);
        ctx.restore();
    }

    buildTileset(): HTMLCanvasElement {
        const tileSize = this._tileSize;
        // 1px extrusion border around each tile: prevents seam glitches on
        // parallax layers where scrollFactor < 1 produces fractional UV offsets.
        // Phaser must be told margin=1, spacing=2 to match this layout.
        const BORDER = 1;
        const slotSize = tileSize + BORDER * 2;
        const tiles = this._tileData;
        const tileCount = tiles.length;
        const cols = Math.ceil(Math.sqrt(tileCount));
        const canvas = document.createElement('canvas');
        canvas.width = cols * slotSize;
        canvas.height = cols * slotSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error("Can't get tileset canvas rendering 2D context");
        }

        // Render each tile into a temp canvas first, then copy with extruded edges.
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = tileSize;
        tempCanvas.height = tileSize;
        const tempCtx = tempCanvas.getContext('2d')!;

        let col = 0;
        let row = 0;
        tiles.forEach((tile) => {
            tempCtx.clearRect(0, 0, tileSize, tileSize);
            this.renderTile(tempCtx, tile, 0, 0);

            const ox = col * slotSize;
            const oy = row * slotSize;

            // Tile content
            ctx.drawImage(tempCanvas, ox + BORDER, oy + BORDER);
            // Top edge
            ctx.drawImage(tempCanvas, 0, 0, tileSize, BORDER, ox + BORDER, oy, tileSize, BORDER);
            // Bottom edge
            ctx.drawImage(tempCanvas, 0, tileSize - BORDER, tileSize, BORDER, ox + BORDER, oy + BORDER + tileSize, tileSize, BORDER);
            // Left edge
            ctx.drawImage(tempCanvas, 0, 0, BORDER, tileSize, ox, oy + BORDER, BORDER, tileSize);
            // Right edge
            ctx.drawImage(tempCanvas, tileSize - BORDER, 0, BORDER, tileSize, ox + BORDER + tileSize, oy + BORDER, BORDER, tileSize);
            // Corners
            ctx.drawImage(tempCanvas, 0, 0, BORDER, BORDER, ox, oy, BORDER, BORDER);
            ctx.drawImage(tempCanvas, tileSize - BORDER, 0, BORDER, BORDER, ox + BORDER + tileSize, oy, BORDER, BORDER);
            ctx.drawImage(tempCanvas, 0, tileSize - BORDER, BORDER, BORDER, ox, oy + BORDER + tileSize, BORDER, BORDER);
            ctx.drawImage(tempCanvas, tileSize - BORDER, tileSize - BORDER, BORDER, BORDER, ox + BORDER + tileSize, oy + BORDER + tileSize, BORDER, BORDER);

            col++;
            if (col >= cols) {
                col = 0;
                row++;
            }
        });
        return canvas;
    }
}
