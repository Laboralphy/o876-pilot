import Phaser from 'phaser';

/** Particles emitted per frame while thrusting. */
const PARTICLES_PER_EMIT = 3;
/** Distance behind the owner's center where particles spawn (px). */
const EXHAUST_OFFSET = 16;
/** Base ejection speed (px/frame). */
const BASE_SPEED = 2.5;
/** Random ± variance added to each particle's speed (px/frame). */
const SPEED_VARIANCE = 1.2;
/** ± angular spread around the backward direction (degrees). */
const ANGLE_SPREAD = 20;
/** Minimum particle lifetime in frames. */
const MIN_LIFE = 18;
/** Maximum particle lifetime in frames. */
const MAX_LIFE = 30;

type Particle = {
    active: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
};

type ParticleSlot = {
    p: Particle;
    sprite: Phaser.GameObjects.Sprite;
};

/**
 * Pool-based particle system for ship thrust exhaust.
 *
 * Particles are physics-independent: they move in a straight line, fade
 * out linearly, and shrink slightly over their lifetime.  No collision
 * detection is performed.
 *
 * Usage:
 *   const exhaust = new ExhaustSystem(scene, exhaustLayer, 200);
 *   // each frame:
 *   if (thrusting) exhaust.emit(ship.x, ship.y, ship.angle);
 *   exhaust.update();
 */
export class ExhaustSystem {
    private readonly _slots: ParticleSlot[];

    constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer, poolSize: number = 200) {
        this._slots = Array.from({ length: poolSize }, () => {
            const sprite = scene.add.sprite(0, 0, 'exhaust');
            sprite.setVisible(false);
            layer.add(sprite);
            return {
                p: { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1 },
                sprite,
            };
        });
    }

    /**
     * Spawn a burst of exhaust particles at the ship's nozzle position.
     * Call every frame while thrusting.
     *
     * @param x      Owner's world-pixel X.
     * @param y      Owner's world-pixel Y.
     * @param angle  Owner's facing angle in degrees (0 = pointing up).
     */
    emit(x: number, y: number, angle: number): void {
        const rad = (angle * Math.PI) / 180;
        // Nozzle is directly behind the ship center
        const nozzleX = x - Math.sin(rad) * EXHAUST_OFFSET;
        const nozzleY = y + Math.cos(rad) * EXHAUST_OFFSET;

        let spawned = 0;
        for (const slot of this._slots) {
            if (spawned >= PARTICLES_PER_EMIT) {
                break;
            }
            if (slot.p.active) {
                continue;
            }

            // Ejection direction: backward ± random spread
            const spreadRad =
                ((angle + 180 + (Math.random() - 0.5) * 2 * ANGLE_SPREAD) * Math.PI) / 180;
            const speed = BASE_SPEED + (Math.random() - 0.5) * 2 * SPEED_VARIANCE;
            const life = Math.round(MIN_LIFE + Math.random() * (MAX_LIFE - MIN_LIFE));

            slot.p.active = true;
            slot.p.x = nozzleX;
            slot.p.y = nozzleY;
            slot.p.vx = Math.sin(spreadRad) * speed;
            slot.p.vy = -Math.cos(spreadRad) * speed;
            slot.p.life = life;
            slot.p.maxLife = life;
            slot.sprite.setVisible(true);
            spawned++;
        }
    }

    /**
     * Advance all active particles by one frame and sync their sprites.
     * Call every frame unconditionally.
     */
    update(): void {
        for (const { p, sprite } of this._slots) {
            if (!p.active) continue;

            p.life--;
            if (p.life <= 0) {
                p.active = false;
                sprite.setVisible(false);
                continue;
            }

            p.x += p.vx;
            p.y += p.vy;

            const t = p.life / p.maxLife; // 1 → 0 as particle ages
            sprite.x = Math.round(p.x);
            sprite.y = Math.round(p.y);
            sprite.alpha = t;
            sprite.setScale(0.4 + t * 0.6); // shrinks from 1.0 → 0.4
        }
    }
}
