import Phaser from 'phaser';
import { T01WorldGenerator } from '../world-generator/t01/T01WorldGenerator';
import { AstroTileRenderer } from '../tile-renderer/themes/astro';
import { IWorldGenerator } from '../world-generator/IWorldGenerator';
import { ITileRenderer } from '../tile-renderer/ITileRenderer';

type AnyLayer =
    | Phaser.GameObjects.Layer
    | Phaser.Tilemaps.TilemapLayer
    | Phaser.GameObjects.TileSprite;

export type LayerDefinition = {
    worldGenerator: IWorldGenerator;
    tileRenderer: ITileRenderer;
    tileSize: number;
    worldWidth: number;
    worldHeight: number;
};

export type WorldSceneOptions = {
    key: string;
    game: Phaser.Game;
    tileSize: number;
    worldWidth: number;
    worldHeight: number;
};

export class WorldScene extends Phaser.Scene {
    private readonly tilemaps = new Map<number, Phaser.Tilemaps.Tilemap>();
    private readonly layers = new Map<number, AnyLayer>();
    private readonly textures: Phaser.Textures.TextureManager;
    private readonly game: Phaser.Game;
    private readonly tileSize: number;
    private readonly worldWidth: number;
    private readonly worldHeight: number;

    constructor(options: WorldSceneOptions) {
        super({ key: options.key });
        this.game = options.game;
        this.tileSize = options.tileSize;
        this.worldWidth = options.worldWidth;
        this.worldHeight = options.worldHeight;
        this.textures = new Phaser.Textures.TextureManager(this.game);
    }

    create() {}

    private _buildLayer(n: number, wg: IWorldGenerator, tr: ITileRenderer, nScrollFactor: number) {
        const mapData = wg.generateMapData();
        const tilesetCanvas = tr.buildTileset();
        this.textures.addCanvas('tileset-' + n, tilesetCanvas);
        const tilemap = this.make.tilemap({
            data: mapData,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize,
        });
        tilemap.addTilesetImage(
            'tileset-' + n, // logical name, used by layers to render image
            'tileset-' + n, // texture key in phaser cache
            this.tileSize,
            this.tileSize,
            0, // tile margin
            0 // tile spacing
        );
        const layer = tilemap.createLayer(
            0, // in map layer index
            'tileset', // used tileset (referenced by logical name)
            0, // in world x pos
            0 // in world y pos
        );
        if (!layer) {
            throw new Error('Could not build tilemap layer');
        }
        this._destroyTilemap(n);
        this.tilemaps.set(n, tilemap);
        layer.setScrollFactor(nScrollFactor);
        this.layers.set(n, layer);
    }

    /**
     * Preloading Scene:
     * 1) building textures
     * 2) generating world
     */
    preload() {
        const tilesetCanvas = this.tileRenderer.buildTileset();
        this.textures.addCanvas('tileset', tilesetCanvas);
        this.mapData = this.worldGenerator.generateMapData();
    }

    private _destroyTilemap(n: number) {
        const tm = this.tilemaps.get(n);
        if (tm) {
            tm.destroy();
            this.tilemaps.delete(n);
        }
    }

    private _buildTilemap() {
        this._destroyTilemap();
        // 1. [y][x] to access tile x, y
        this.tilemap = this.make.tilemap({
            data: this.worldGenerator.mapData,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize,
        });

        // 2. Enregistrement du tileset atlas
        //    Paramètres : (nom logique, clé texture, largeur tile, hauteur tile)
        //    Phaser calcule automatiquement les UV de chaque tile :
        //    tile N → rect { x: N*64, y: 0, w: 64, h: 64 } dans la texture
        this.tilemap.addTilesetImage(
            'tileset', // logical name, used by layers to render image
            'tileset', // texture key in phaser cache
            this.tileSize,
            this.tileSize,
            0, // tile margin
            0 // tile spacing
        );

        // 3. Creating  StaticTilemapLayer
        //    → optimized WebGL rendering in one draw call
        //    → auto frustum culling (only visible tiles are rendered)
        //    → data uploaded in GPU at one time
        const layer = this.tilemap.createLayer(
            0, // in map layer index
            'tileset', // used tileset (referenced by logical name)
            0, // in world x pos
            0 // in world y pos
        );
        if (!layer) {
            throw new Error('Could not build tilemap layer');
        }
        this.layer = layer;

        // 4. Setting collision tiles
        // this.tiles.forEach((t) => {
        //     if (t.solid) {
        //         this.map.setCollision(t.id);
        //     }
        // });
    }

    _setupCamera() {
        this.cameras.main
            .setBounds(0, 0, this.worldWidth * this.tileSize, this.worldHeight * this.tileSize)
            .setBackgroundColor(0x07090f)
            .centerOn((this.worldWidth * this.tileSize) / 2, (this.worldHeight * this.tileSize) / 2)
            .setZoom(1);
    }
}
