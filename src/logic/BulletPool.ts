import Phaser from 'phaser';
import { BulletSpriteStore } from './BulletSpriteStore';
import { IPhysicsReader } from '../world-scene/IPhysicsReader';

/**
 * Maximum bullets alive at the same time.
 * With a 4-frame fire cooldown and 60-frame lifetime the pool can sustain
 * continuous fire (60 / 4 = 15 bullets in flight) with comfortable headroom.
 */
type BulletSlot = {
    store: BulletSpriteStore;
    sprite: Phaser.GameObjects.Sprite;
};

/**
 * Pre-allocated pool of bullet sprites.
 *
 * Why a pool?  A rapid-fire weapon can spawn ~15 bullets per second.
 * Creating and destroying Phaser sprites every frame triggers garbage
 * collection spikes that stutter the render loop.  The pool allocates
 * everything once at scene startup and recycles slots by toggling
 * `store.active` and sprite visibility.
 *
 * Usage in your scene:
 *   const pool = new BulletPool(this, spriteLayer);
 *   pool.fire(x, y, angle);   // call whenever the weapon fires
 *   pool.update(physics);      // call every frame in scene.update()
 */
export class BulletPool {
    private readonly _slots: BulletSlot[] = [];

    constructor(
        scene: Phaser.Scene,
        layer: Phaser.GameObjects.Layer,
        poolSize: number,
        namespace: string,
        spriteRef: string,
        frame: number = 0
    ) {
        for (let i = 0; i < poolSize; i++) {
            const store = new BulletSpriteStore(`${namespace}-${i}`);
            const sprite = scene.add.sprite(0, 0, spriteRef, frame);
            sprite.setVisible(false);
            layer.add(sprite);
            this._slots.push({ store, sprite });
        }
    }

    /**
     * Activate the next available slot and launch a bullet.
     * If the pool is exhausted the shot is silently dropped — this should
     * never happen in practice at the configured pool size.
     */
    fire(x: number, y: number, angle: number): void {
        const slot = this._slots.find((s) => !s.store.active);
        if (!slot) {
            return;
        }
        slot.store.activate(x, y, angle);
        slot.sprite.setVisible(true);
    }

    /**
     * Advance all active bullets by one game frame and sync their Phaser sprites.
     * Bullets that hit a solid cell or expire are returned to the pool.
     */
    update(physics: IPhysicsReader): void {
        for (const { store, sprite } of this._slots) {
            if (!store.active) {
                continue;
            }

            const expired = store.updateBullet(physics);
            if (expired) {
                store.deactivate();
                sprite.setVisible(false);
            } else {
                sprite.x = Math.round(store.x);
                sprite.y = Math.round(store.y);
                sprite.angle = store.angle;
                sprite.setFrame(store.frame);
            }
        }
    }
}
