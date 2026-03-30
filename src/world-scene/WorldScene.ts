import Phaser from 'phaser';
import { AnimationDefinition, AnimationRunner } from './AnimationRunner';
import {
    buildLayerDefinition,
    CoordinateList,
    TileMapLayerDefinition,
    WorldBlock,
} from './layer-builder';
import { PhysicsCell } from './physics-types';
import { IPhysicsReader } from './IPhysicsReader';
import { IControlState } from './IControlState';
import { SpriteHorde } from './SpriteHorde';
import { createRNGFromString } from '../libs/mulberry32';
import { createTileRenderer } from '../tile-renderer';
import { createWorldGenerator } from '../world-generator';
import { ITextureSource } from '../tile-renderer/ITextureSource';

export type { CoordinateList, TileMapLayerDefinition };

type AnyLayer =
    | Phaser.GameObjects.Layer
    | Phaser.Tilemaps.TilemapLayer
    | Phaser.GameObjects.TileSprite;

export type LevelPlane = {
    depth: number;
    scrollFactor: number;
    tileRenderer: string;
    worldGenerator: string;
    tileSize: number;
    animations: AnimationDefinition[];
    blocks: WorldBlock[];
    physic: boolean; // if true, then physic data will be computed for this layer.
};

export type LevelDefinition = {
    key: string;
    worldWidth: number;
    worldHeight: number;
    planes: Record<string, LevelPlane>;
};

export type WorldSceneOptions = {
    level: LevelDefinition;
};

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
    public readonly tiles: CoordinateList = [];
    constructor(public readonly runner: AnimationRunner) {}
}

export abstract class WorldScene extends Phaser.Scene implements IPhysicsReader {
    protected readonly tilemaps = new Map<string, Phaser.Tilemaps.Tilemap>();
    protected readonly layers = new Map<string, AnyLayer>();
    protected readonly animations = new Map<string, Map<string, AnimationRegistry>>();
    protected layerDefinitions: TileMapLayerDefinition[] = [];
    protected worldWidth: number = 0; // in pixels
    protected worldHeight: number = 0; // in pixels
    protected controls: Controls | undefined = undefined;
    protected debugText: Phaser.GameObjects.Text | undefined;
    protected readonly spriteHorde = new SpriteHorde();
    protected readonly spriteObjects = new Map<string, Phaser.GameObjects.Sprite>();

    protected constructor(protected readonly options: WorldSceneOptions) {
        super({ key: options.level.key });
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
                    if (animationRunner.changed) {
                        const frame = animationRunner.frame;
                        for (const tile of animationRegistry.tiles) {
                            layer.putTileAt(frame, tile.x, tile.y);
                        }
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

        // Texture
        this.textures.addCanvas(idTexture, ld.texture);

        // Tilemap
        const tilemap = this.make.tilemap({
            data: ld.tileMap,
            tileWidth: ld.tileSize,
            tileHeight: ld.tileSize,
        });

        // Animation declaration
        ld.animations.forEach((definition) => {
            this._declareAnimationRunner(idLayer, definition);
        });

        const tileset = tilemap.addTilesetImage(
            idTileset, // logical name, used by layers to render image
            idTexture, // texture key in phaser cache
            ld.tileSize,
            ld.tileSize,
            1, // 1px extrusion margin (matches TileRenderer.buildTileset BORDER)
            2 // 1px extrusion × 2 sides spacing
        );

        if (!tileset) {
            throw new Error('Could not build tileset');
        }

        this._destroyTilemap(idLayer);
        this.tilemaps.set(idLayer, tilemap);

        // Animated Tiles
        for (const [animationKey, coordinateList] of Object.entries(ld.animatedTiles)) {
            for (const { x, y } of coordinateList) {
                this._setAnimatedTile(idLayer, x, y, animationKey);
            }
        }

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

    /**
     * Returns true if any physics layer has a solid cell at the given world pixel coordinates.
     * Only layers with scrollFactor === 1 are considered (parallax layers are visual only).
     */
    isSolid(worldX: number, worldY: number): boolean {
        return this.getPhysicsCell(worldX, worldY)?.solid ?? false;
    }

    /**
     * Returns the PhysicsCell at the given world pixel coordinates, or null if the cell is empty.
     * Only layers with scrollFactor === 1 are considered.
     */
    getPhysicsCell(worldX: number, worldY: number): PhysicsCell | null {
        for (const ld of this.layerDefinitions) {
            if (!ld.physicsMap) {
                continue;
            }
            const cellX = Math.floor(worldX / ld.tileSize);
            const cellY = Math.floor(worldY / ld.tileSize);
            const cell = ld.physicsMap[cellY]?.[cellX];
            if (cell) {
                return cell;
            }
        }
        return null;
    }

    protected _createResources(): void {
        const { width, height } = this._computeWorldSize();
        this.worldWidth = width;
        this.worldHeight = height;
        this.layerDefinitions.forEach((ld) => this._buildTileMapLayer(ld));
    }

    protected _buildLevel(level: LevelDefinition, seed: string) {
        const textureSource: ITextureSource = {
            getSourceImage: (key) =>
                this.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement,
            exists: (key) => this.textures.exists(key),
        };
        const rng = createRNGFromString(seed);
        const referencePlane = Object.values(level.planes).find((p) => p.scrollFactor === 1);
        if (!referencePlane) {
            throw new Error(
                'In level definition : need at least one layer with scrollFactor 1 to get a reference plane'
            );
        }
        const w = level.worldWidth * referencePlane.scrollFactor * referencePlane.tileSize;
        const h = level.worldHeight * referencePlane.scrollFactor * referencePlane.tileSize;
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        const maxScrollX = w - screenWidth;
        const maxScrollY = h - screenHeight;
        this.layerDefinitions = Object.entries(level.planes)
            .sort(([, p1], [, p2]) => p2.depth - p1.depth)
            .map(([name, data]) =>
                buildLayerDefinition(
                    rng,
                    name,
                    data.depth,
                    data.blocks,
                    data.animations,
                    data.scrollFactor,
                    createTileRenderer(textureSource, data.tileRenderer, data.tileSize, rng),
                    createWorldGenerator(
                        data.worldGenerator,
                        Math.ceil((screenWidth + maxScrollX * data.scrollFactor) / data.tileSize),
                        Math.ceil((screenHeight + maxScrollY * data.scrollFactor) / data.tileSize),
                        rng
                    ),
                    data.physic
                )
            );
    }

    create() {
        this._buildLevel(this.options.level, this.options.level.key);
        this._createResources();
        this._setupCamera();
        this._setupInput();
        this._buildDebugUI();
        this._updateHUD();
        const spriteLayer = this.add.layer().setDepth(10);
        this.layers.set('sprites', spriteLayer);
        this.events.once('shutdown', () => this._destroyAllResources());
        this.events.once('destroy', () => this._destroyAllResources());
    }

    preload() {
        this.load.spritesheet('spaceship', 'assets/sprites/spaceship.png', {
            frameWidth: 48,
            frameHeight: 48,
        });
    }

    private _getControlState(): IControlState {
        const c = this.controls;
        if (!c) {
            return {
                thrust: false,
                rotateCW: false,
                rotateCCW: false,
                fire: false,
                altFire: false,
                boost: false,
            };
        }
        return {
            thrust: c.thrust.isDown,
            rotateCW: c.rotateCW.isDown,
            rotateCCW: c.rotateCCW.isDown,
            fire: c.fire.isDown,
            altFire: c.altFire.isDown,
            boost: c.boost.isDown,
        };
    }

    private _syncSprites(): void {
        for (const store of this.spriteHorde.entries()) {
            const sprite = this.spriteObjects.get(store.id);
            if (sprite) {
                sprite.x = Math.round(store.x);
                sprite.y = Math.round(store.y);
                sprite.angle = store.angle;
                sprite.scale = store.scale;
                sprite.alpha = store.alpha;
                sprite.setFrame(store.frame);
            }
        }
    }

    update(time: number, delta: number) {
        this._animateTiles(delta);
        this._handleCamera(delta);
        this.spriteHorde.update(this._getControlState(), this);
        this._syncSprites();
        this._updateHUD();
    }
}
