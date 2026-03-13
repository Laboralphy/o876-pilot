import Phaser from 'phaser';
import { AnimationDefinition, AnimationRunner } from './AnimationRunner';

type AnyLayer =
    | Phaser.GameObjects.Layer
    | Phaser.Tilemaps.TilemapLayer
    | Phaser.GameObjects.TileSprite;

/**
 * This type of layer is dedicated to tilemaps
 */
export type TileMapLayerDefinition = {
    key: string;
    zIndex: number;
    tileMap: number[][]; // The real map data
    texture: HTMLCanvasElement; // The tileset image
    tileSize: number; // size of a tile in pixels
    tilesetWidth: number; // number of tiles in a row
    tilesetHeight: number; // number of tiles in a column
    scrollFactor: number; // 1 = scroll with camera, 0 = no scroll, 0.5 = parallax scrolling, all values accepted
    animations: AnimationDefinition[];
};

export type WorldSceneOptions = {
    key: string; // scene key, used to orchestrate between scenes
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

class AnimationRegistry {
    public readonly tiles: { x: number; y: number }[] = [];
    constructor(public readonly runner: AnimationRunner) {}
}

export abstract class WorldScene extends Phaser.Scene {
    protected readonly tilemaps = new Map<string, Phaser.Tilemaps.Tilemap>();
    protected readonly layers = new Map<string, AnyLayer>();
    protected readonly animations = new Map<string, Map<string, AnimationRegistry>>();
    protected layerDefinitions: TileMapLayerDefinition[] = [];
    protected worldWidth: number = 0; // in pixels
    protected worldHeight: number = 0; // in pixels
    protected controls: Controls | undefined = undefined;
    protected debugText: Phaser.GameObjects.Text | undefined;

    protected constructor(options: WorldSceneOptions) {
        super({ key: options.key });
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

    private _declareAnimationRunner(idLayer: string, animationDefinition: AnimationDefinition) {
        if (!this.animations.has(idLayer)) {
            this.animations.set(idLayer, new Map<string, AnimationRegistry>());
        }
        this.animations
            .get(idLayer)!
            .set(
                animationDefinition.key,
                new AnimationRegistry(new AnimationRunner(animationDefinition))
            );
    }

    private _setAnimatedTile(idLayer: string, x: number, y: number, animationKey: string) {
        const l = this.animations.get(idLayer);
        if (!l) {
            throw new Error(`Layer ${idLayer} has no declared animations`);
        }
        const ar = l.get(animationKey);
        if (!ar) {
            throw new Error(`Animation ${animationKey} not declared for layer ${idLayer}`);
        }
        const tile = ar.tiles.find((t) => t.x === x && t.y === y);
        if (!tile) {
            ar.tiles.push({ x, y });
        }
    }

    private _animateTiles(delta: number) {
        for (const [idLayer, animationRegistries] of this.animations.entries()) {
            const layer = this.layers.get(idLayer);
            if (layer && layer instanceof Phaser.Tilemaps.TilemapLayer) {
                for (const animationRegistry of animationRegistries.values()) {
                    const animationRunner = animationRegistry.runner;
                    animationRunner.update(delta);
                    const frame = animationRunner.frame;
                    for (const tile of animationRegistry.tiles) {
                        layer.putTileAt(frame, tile.x, tile.y);
                    }
                }
            }
        }
    }

    private _buildTileMapLayer(ld: TileMapLayerDefinition) {
        const idLayer = ld.key;
        if (this.layers.has(idLayer)) {
            throw new Error(`Layer already exists : ${idLayer}`);
        }
        const idTileset = 'tileset-' + idLayer.toString();
        const idTexture = 'texture-' + idLayer.toString();
        this.textures.addCanvas(idTexture, ld.texture);

        // Tilemap
        const tilemap = this.make.tilemap({
            data: ld.tileMap,
            tileWidth: ld.tileSize,
            tileHeight: ld.tileSize,
        });

        ld.animations.forEach((definition) => {
            this._declareAnimationRunner(idLayer, definition);
        });

        const tileset = tilemap.addTilesetImage(
            idTileset, // logical name, used by layers to render image
            idTexture, // texture key in phaser cache
            ld.tileSize,
            ld.tileSize,
            0, // tile margin
            0 // tile spacing
        );

        if (!tileset) {
            throw new Error('Could not build tileset');
        }

        this._destroyTilemap(idLayer);
        this.tilemaps.set(idLayer, tilemap);

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
        layer.setDepth(ld.zIndex);
        this.layers.set(idLayer, layer);
    }

    private _setupCamera() {
        this.cameras.main
            .setBounds(0, 0, this.worldWidth, this.worldHeight)
            .setBackgroundColor(0x07090f)
            .centerOn(this.worldWidth / 2, this.worldHeight / 2)
            .setZoom(1);
    }

    private _setupInput() {
        // Zoom mousewheel
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
        // Fixed text (scrollFactor 0 = camera bound)
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
            this.debugText.setText([`Cam: ${cam.scrollX.toFixed(0)}, ${cam.scrollY.toFixed(0)}`]);
        }

        // HUD externe
        // document.getElementById('hud-map').textContent = `Map: ${MAP_W}×${MAP_H}`;
        // document.getElementById('hud-tiles').textContent =
        //     `Total: ${totalTiles.toLocaleString()} tiles`;
        // document.getElementById('hud-draw').textContent = `Draw calls: 1 (WebGL batch)`;
        // document.getElementById('hud-cam').textContent = `Zoom: ${cam.zoom.toFixed(2)}×`;
    }

    /**
     * Can be used to destroy any layer. Not only layer builts via _buildTileMapLayer
     * @param idLayer
     * @protected
     */
    protected _destroyLayer(idLayer: string): void {
        const layer = this.layers.get(idLayer);
        if (!layer) {
            throw new Error(`Layer ${idLayer} does not exist`);
        }

        if (layer instanceof Phaser.Tilemaps.TilemapLayer) {
            console.info('Destroy layer: ' + idLayer);
            layer.destroy(); // remove layer from the display list and discard tilemap geometry
            this._destroyTilemap(idLayer);
        } else if (layer instanceof Phaser.GameObjects.TileSprite) {
            layer.destroy(); // remove layer from the display list and free inner texture
        } else {
            // probably a Phaser.GameObjects.Layer
            layer.destroy(true);
        }

        this.layers.delete(idLayer);
        const idTexture = 'texture-' + idLayer.toString();
        if (this.textures.exists(idTexture)) {
            console.info('Remove texture: ' + idTexture + ' from cache');
            this.textures.remove(idTexture);
        }
    }

    /**
     *
     * @param idLayer
     * @protected
     */
    protected _destroyTilemap(idLayer: string): void {
        console.info('Destroy tilemap: ' + idLayer);
        const tilemap = this.tilemaps.get(idLayer);
        if (!tilemap) {
            return;
        }
        tilemap.destroy(); // free tile map from the inner cache
        this.tilemaps.delete(idLayer);
    }

    /**
     * Destroy all layers and tilemaps.
     * This is called automatically when the scene is destroyed.
     * @protected
     */
    protected _destroyAllResources(): void {
        console.info('Destroy all resources');
        for (const id of this.layers.keys()) {
            // Destroy layer. Will also destroy any associated tilemap or texture
            this._destroyLayer(id);
        }
    }

    protected _createResources(): void {
        const { width, height } = this._computeWorldSize();
        this.worldWidth = width;
        this.worldHeight = height;
        this.layerDefinitions.forEach((ld) => this._buildTileMapLayer(ld));
    }

    create() {
        this._createResources();
        this._setupCamera();
        this._setupInput();
        this._buildDebugUI();
        this._updateHUD();
        this.events.once('shutdown', () => this._destroyAllResources());
        this.events.once('destroy', () => this._destroyAllResources());
    }

    preload() {}

    update(time: number, delta: number) {
        this._animateTiles(delta);
        this._handleCamera(delta);
        this._updateHUD();
    }
}
