import Phaser from 'phaser';
import { MyWordGenerator } from '../world-generator/MyWorldGenerator';
import { TileDefinition } from '../tile-renderer/themes/astro/tile-definition';

export type WorldSceneOptions = {
    key: string;
    game: Phaser.Game;
    tileSize: number;
    worldWidth: number;
    worldHeight: number;
    tiles: TileDefinition[];
};

export class WorldScene extends Phaser.Scene {
    private readonly worldGenerator: MyWordGenerator;
    private _map: Phaser.Tilemaps.Tilemap | null = null;
    private layer: Phaser.Tilemaps.TilemapLayer | null = null;
    private readonly textures: Phaser.Textures.TextureManager;
    private readonly game: Phaser.Game;
    private readonly tileSize: number;
    private readonly worldWidth: number;
    private readonly worldHeight: number;
    private readonly tiles: TileDefinition[];

    constructor(options: WorldSceneOptions) {
        super({ key: options.key });
        this.game = options.game;
        this.tileSize = options.tileSize;
        this.worldWidth = options.worldWidth;
        this.worldHeight = options.worldHeight;
        this.tiles = options.tiles;
        this.worldGenerator = new MyWordGenerator(this.tiles, this.worldWidth, this.worldHeight);
        this.textures = new Phaser.Textures.TextureManager(this.game);
    }

    get map(): Phaser.Tilemaps.Tilemap {
        if (!this._map) {
            throw new Error('Map not loaded yet');
        }
        return this._map;
    }

    preload() {
        const tilesetCanvas = buildTileset(this.tiles);
        this.textures.addCanvas('tileset', tilesetCanvas);
        this.worldGenerator.generateMapData();
    }

    private _destroyTilemap() {
        if (this._map) {
            this._map.destroy();
            this._map = null;
        }
    }

    _buildTilemap() {
        this._destroyTilemap();
        // 1. [y][x] to access tile x, y
        this._map = this.make.tilemap({
            data: this.worldGenerator.mapData,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize,
        });

        // 2. Enregistrement du tileset atlas
        //    Paramètres : (nom logique, clé texture, largeur tile, hauteur tile)
        //    Phaser calcule automatiquement les UV de chaque tile :
        //    tile N → rect { x: N*64, y: 0, w: 64, h: 64 } dans la texture
        this.map.addTilesetImage(
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
        const layer = this.map.createLayer(
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
        this.tiles.forEach((t) => {
            if (t.solid) {
                this.map.setCollision(t.id);
            }
        });
    }

    _setupCamera() {
        this.cameras.main
            .setBounds(0, 0, this.worldWidth * this.tileSize, this.worldHeight * this.tileSize)
            .setBackgroundColor(0x07090f)
            .centerOn((this.worldWidth * this.tileSize) / 2, (this.worldHeight * this.tileSize) / 2)
            .setZoom(1);
    }
}
