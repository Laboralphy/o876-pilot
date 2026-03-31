import { WorldScene, WorldSceneOptions } from '../world-scene/WorldScene';
import { ShipSpriteStore } from '../logic/ShipSpriteStore';
import { BulletPool } from '../logic/BulletPool';
import { ExhaustSystem } from '../logic/ExhaustSystem';
import Phaser from 'phaser';

export type TypicalPlatform = {
    /** World pixel X of the leftmost solid cell in the segment. */
    x: number;
    /** World pixel Y of the top edge of the solid row. */
    y: number;
    /** Width of the platform segment in pixels. */
    width: number;
};

export class TypicalScene extends WorldScene {
    protected _platformRegistry: TypicalPlatform[] = [];
    private _bulletPool: BulletPool | undefined;
    private _exhaustSystem: ExhaustSystem | undefined;

    constructor(options: WorldSceneOptions) {
        super(options);
    }

    /**
     * Scan all physics layers and register every horizontal platform segment.
     * A platform is a run of solid cells whose directly-above neighbour is non-solid.
     * Results are stored in _platformRegistry.
     */
    private _registerPlatforms(): void {
        this._platformRegistry = [];

        // Use the smallest tileSize among physics layers as the scan step.
        const physicsLayers = this.layerDefinitions.filter((ld) => ld.physicsMap !== null);
        if (physicsLayers.length === 0) return;
        const tileSize = Math.min(...physicsLayers.map((ld) => ld.tileSize));
        const half = tileSize / 2;

        for (let rowY = 0; rowY < this.worldHeight; rowY += tileSize) {
            let runStart: number | null = null;
            let runLength = 0;

            for (let colX = 0; colX < this.worldWidth; colX += tileSize) {
                const cx = colX + half;
                const cy = rowY + half;
                const aboveCy = rowY - half;

                const cellSolid = this.getPhysicCell(cx, cy)?.solid ?? false;
                const aboveSolid =
                    aboveCy >= 0 ? (this.getPhysicCell(cx, aboveCy)?.solid ?? false) : false;

                const isPlatformCell = cellSolid && !aboveSolid;

                if (isPlatformCell) {
                    if (runStart === null) runStart = colX;
                    runLength += tileSize;
                } else {
                    if (runStart !== null) {
                        this._platformRegistry.push({ x: runStart, y: rowY, width: runLength });
                        runStart = null;
                        runLength = 0;
                    }
                }
            }

            // Close any run that reached the right edge of the world.
            if (runStart !== null) {
                this._platformRegistry.push({ x: runStart, y: rowY, width: runLength });
            }
        }
    }

    private _placeShip(ship: ShipSpriteStore): void {
        const tileSize = this.physicLayer.tileSize;
        const minWidth = 3 * tileSize;
        const candidates = this._platformRegistry.filter((p) => p.width >= minWidth);
        if (candidates.length === 0) {
            ship.x = this.worldWidth / 2;
            ship.y = this.worldHeight / 2;
            return;
        }
        // Pick the middle candidate for a reasonable starting position
        const platform = candidates[Math.floor(candidates.length / 2)];
        ship.x = platform.x + platform.width / 2;
        // Place ship center just above the platform top edge (14 = SHIP_RADIUS)
        ship.y = platform.y - 14;
    }

    create() {
        super.create();
        this._registerPlatforms();
        const ship = new ShipSpriteStore('ship');
        this._placeShip(ship);
        this.spriteHorde.add(ship);
        const shipSprite = this.add.sprite(ship.x, ship.y, ship.textureKey, ship.frame);
        this.spriteObjects.set(ship.id, shipSprite);
        const oSpriteLayer = this.layers.get('sprites')! as Phaser.GameObjects.Layer;
        oSpriteLayer.add(shipSprite);
        this.cameras.main.startFollow(shipSprite);

        this._bulletPool = new BulletPool(this, oSpriteLayer);

        // Exhaust layer sits just below the sprite layer so particles always
        // render behind ships and bullets.
        const particleLayer = this.layers.get('particles')! as Phaser.GameObjects.Layer;
        this._exhaustSystem = new ExhaustSystem(this, particleLayer);
    }

    update(time: number, delta: number): void {
        super.update(time, delta);

        // After spriteHorde.update() the ship may have flagged a shot.
        const ship = this.spriteHorde.get('ship') as ShipSpriteStore | undefined;
        if (ship?._weapon.wantsToFire && this._bulletPool) {
            ship._weapon.wantsToFire = false;
            this._bulletPool.fire(ship._weapon.fireX, ship._weapon.fireY, ship._weapon.fireAngle);
        }

        this._bulletPool?.update(this);

        // ship.frame === 1 means thrust is active (set by ShipSpriteStore.update)
        if (ship && ship.frame === 1) {
            this._exhaustSystem?.emit(ship.x, ship.y, ship.angle);
        }
        this._exhaustSystem?.update();
    }
}
