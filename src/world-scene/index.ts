import Phaser from 'phaser';
import { IWorldGenerator } from '../world-generator/IWorldGenerator';
import { ITileRenderer } from '../tile-renderer/ITileRenderer';
import { T01WorldGenerator } from '../world-generator/t01/T01WorldGenerator';
import { TileRenderer } from '../tile-renderer/TileRenderer';
import { AstroTileRenderer } from '../tile-renderer/themes/astro';

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
    scrollFactor: number;
};

export type WorldSceneOptions = {
    key: string;
    game: Phaser.Game;
    layers: LayerDefinition[];
};

export class WorldScene extends Phaser.Scene {
    private readonly tilemaps = new Map<number, Phaser.Tilemaps.Tilemap>();
    private readonly layers = new Map<number, AnyLayer>();
    private readonly textures: Phaser.Textures.TextureManager;
    private readonly game: Phaser.Game;
    private readonly layerDefinitions: LayerDefinition[];

    constructor(options: WorldSceneOptions) {
        super({ key: options.key });
        this.game = options.game;
        this.layerDefinitions = options.layers;
        this.textures = new Phaser.Textures.TextureManager(this.game);
    }

    create() {
        this._buildTilemap();
        this._setupCamera();
        this._setupInput();
        this._buildDebugUI();
        this._updateHUD();
    }

    preload() {
        const wg = new T01WorldGenerator(200, 200);
        const tr = new AstroTileRenderer();
        this._buildLayer(0, wg, tr, 1);
    }

    private _buildLayer(n: number, wg: IWorldGenerator, tr: ITileRenderer, nScrollFactor: number) {
        const idTileset = 'tileset-' + n.toString();
        const mapData = wg.generateMapData();
        const tilesetCanvas = tr.buildTileset();
        this.textures.addCanvas(idTileset, tilesetCanvas);
        const tilemap = this.make.tilemap({
            data: mapData,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize,
        });
        tilemap.addTilesetImage(
            idTileset, // logical name, used by layers to render image
            idTileset, // texture key in phaser cache
            this.tileSize,
            this.tileSize,
            0, // tile margin
            0 // tile spacing
        );
        const layer = tilemap.createLayer(
            0, // in map layer index
            idTileset, // used tileset (referenced by logical name)
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

    private _destroyTilemap(n: number) {
        const tm = this.tilemaps.get(n);
        if (tm) {
            tm.destroy();
            this.tilemaps.delete(n);
        }
    }

    _setupCamera() {
        this.cameras.main
            .setBounds(0, 0, this.worldWidth * this.tileSize, this.worldHeight * this.tileSize)
            .setBackgroundColor(0x07090f)
            .centerOn((this.worldWidth * this.tileSize) / 2, (this.worldHeight * this.tileSize) / 2)
            .setZoom(1);
    }
}
