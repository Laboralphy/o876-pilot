import Phaser from 'phaser';
import { IWorldGenerator } from '../world-generator/IWorldGenerator';
import { ITileRenderer } from '../tile-renderer/ITileRenderer';

type AnyLayer =
    | Phaser.GameObjects.Layer
    | Phaser.Tilemaps.TilemapLayer
    | Phaser.GameObjects.TileSprite;

export type LayerDefinition = {
    worldGenerator: IWorldGenerator; // instance of world generator
    tileRenderer: ITileRenderer; // instance of tile renderer
    tileSize: number; // size of a tile in pixels
    tilesetWidth: number; // number of tiles in a row
    tilesetHeight: number; // number of tiles in a column
    scrollFactor: number; // 1 = scroll with camera, 0 = no scroll, 0.5 = parallax scrolling, all values accepted
};

export type WorldSceneOptions = {
    key: string; // scene key, used to orchestrate between scenes
    layers: LayerDefinition[]; // list of layer definitions
};

const CAM_SPEED = 400; // px/s

type Controls = {
    thrust: Phaser.Input.Keyboard.Key;
    rotateCW: Phaser.Input.Keyboard.Key;
    rotateCCW: Phaser.Input.Keyboard.Key;
    fire: Phaser.Input.Keyboard.Key;
    altFire: Phaser.Input.Keyboard.Key;
    boost: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
};

export class WorldScene extends Phaser.Scene {
    protected readonly tilemaps = new Map<number, Phaser.Tilemaps.Tilemap>();
    protected readonly layers = new Map<number, AnyLayer>();
    protected readonly layerDefinitions: LayerDefinition[];
    protected worldWidth: number = 0; // in pixels
    protected worldHeight: number = 0; // in pixels
    protected controls: Controls | undefined = undefined;
    protected debugText: Phaser.GameObjects.Text | undefined;

    constructor(options: WorldSceneOptions) {
        super({ key: options.key });
        this.layerDefinitions = options.layers;
        const { width, height } = this._computeWorldSize();
        this.worldWidth = width;
        this.worldHeight = height;
    }

    /**
     * Compute maximum world size based on layer definitions
     * World size is the maximum dimensions of all layers combined
     * @private
     */
    private _computeWorldSize() {
        return {
            width: this.layerDefinitions.reduce(
                (w, ld) => Math.max(w, ld.tilesetWidth * ld.tileSize),
                0
            ),
            height: this.layerDefinitions.reduce(
                (h, ld) => Math.max(h, ld.tilesetHeight * ld.tileSize),
                0
            ),
        };
    }

    private _buildLayer(n: number, ld: LayerDefinition) {
        const idTileset = 'tileset-' + n.toString();
        const mapData = ld.worldGenerator.generateMapData();
        const tilesetCanvas = ld.tileRenderer.buildTileset();
        this.textures.addCanvas(idTileset, tilesetCanvas);

        // Tilemap
        const tilemap = this.make.tilemap({
            data: mapData,
            tileWidth: ld.tileSize,
            tileHeight: ld.tileSize,
        });
        const tileset = tilemap.addTilesetImage(
            idTileset, // logical name, used by layers to render image
            idTileset, // texture key in phaser cache
            ld.tileSize,
            ld.tileSize,
            0, // tile margin
            0 // tile spacing
        );

        if (!tileset) {
            throw new Error('Could not build tileset');
        }

        this._destroyTilemap(n);
        this.tilemaps.set(n, tilemap);

        // Layer
        const layer = tilemap.createLayer(
            0, // in map layer index
            tileset, // used tileset (referenced by logical name)
            0, // in world x pos
            0 // in world y pos
        );
        if (!layer) {
            throw new Error('Could not build tilemap layer');
        }
        layer.setScrollFactor(ld.scrollFactor);
        this.layers.set(n, layer);
    }

    private _destroyTilemap(n: number) {
        const tm = this.tilemaps.get(n);
        if (tm) {
            tm.destroy();
            this.tilemaps.delete(n);
        }
    }

    private _setupCamera() {
        this.cameras.main
            .setBounds(0, 0, this.worldWidth, this.worldHeight)
            .setBackgroundColor(0x07090f)
            .centerOn(this.worldWidth / 2, this.worldHeight / 2)
            .setZoom(1);
    }

    private _setupInput() {
        // Zoom molette
        // this.input.on('wheel', (_, __, ___, deltaY) => {
        //     const cam = this.cameras.main;
        //     const zoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, CAM_ZOOM_MIN, CAM_ZOOM_MAX);
        //     cam.setZoom(zoom);
        //     this._updateHUD();
        // });
        // Zoom clavier
        // this.input.keyboard.on('keydown-PLUS', () => this._zoom(+0.1));
        // this.input.keyboard.on('keydown-MINUS', () => this._zoom(-0.1));
        // this.input.keyboard.on('keydown-NUMPAD_ADD', () => this._zoom(+0.1));
        // this.input.keyboard.on('keydown-NUMPAD_SUBTRACT', () => this._zoom(-0.1));
        //
        // Régénération
        // this.input.keyboard.on('keydown-R', () => this._regenerate());
        this.controls = this.input.keyboard!.addKeys({
            thrust: Phaser.Input.Keyboard.KeyCodes.Z,
            rotateCW: Phaser.Input.Keyboard.KeyCodes.D,
            rotateCCW: Phaser.Input.Keyboard.KeyCodes.Q,
            fire: Phaser.Input.Keyboard.KeyCodes.F,
            altFire: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            boost: Phaser.Input.Keyboard.KeyCodes.SPACE,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        }) as typeof this.controls;
    }

    _handleCamera(delta: number) {
        const cam = this.cameras.main;
        const speed = (CAM_SPEED / cam.zoom) * (delta / 1000);
        const { left, right, up, down } = this.controls!;

        if (left.isDown) {
            cam.scrollX -= speed;
        }
        if (right.isDown) {
            cam.scrollX += speed;
        }
        if (up.isDown) {
            cam.scrollY -= speed;
        }
        if (down.isDown) {
            cam.scrollY += speed;
        }
    }

    _buildDebugUI() {
        // Texte fixe (scrollFactor 0 = attaché à la caméra)
        this.debugText = this.add
            .text(10, 10, '', {
                fontSize: '11px',
                color: '#7af7ff',
                fontFamily: 'Courier New',
                backgroundColor: '#00000099',
                padding: { x: 8, y: 6 },
                lineSpacing: 4,
            })
            .setScrollFactor(0)
            .setDepth(100);
    }

    _updateHUD() {
        const cam = this.cameras.main;
        if (this.debugText) {
            this.debugText.setText([
                `Cam: ${cam.scrollX.toFixed(0)}, ${cam.scrollY.toFixed(0)}`,
                `Bounds: ${cam.getBounds()}`,
                `World: ${this.worldWidth}×${this.worldHeight}`,
            ]);
        }

        // HUD externe
        // document.getElementById('hud-map').textContent = `Map: ${MAP_W}×${MAP_H}`;
        // document.getElementById('hud-tiles').textContent =
        //     `Total: ${totalTiles.toLocaleString()} tiles`;
        // document.getElementById('hud-draw').textContent = `Draw calls: 1 (WebGL batch)`;
        // document.getElementById('hud-cam').textContent = `Zoom: ${cam.zoom.toFixed(2)}×`;
    }

    create() {
        this.layerDefinitions.forEach((ld, n) => this._buildLayer(n, ld));
        this._setupCamera();
        this._setupInput();
        this._buildDebugUI();
        this._updateHUD();
    }

    preload() {}

    update(time: number, delta: number) {
        this._handleCamera(delta);
        this._updateHUD();
    }
}
