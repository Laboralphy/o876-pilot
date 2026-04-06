import Phaser from 'phaser';
import { Rainbow } from '../libs/rainbow/Rainbow';
import type { Color32 } from '../libs/rainbow/Rainbow';

// ─── Impacts constants ────────────────────────────────────────────────────────

/** Minimum collision strength below which no debris is spawned. */
const DEBRIS_MIN_STRENGTH = 2;
/** Strength value that produces the maximum particle count. */
const DEBRIS_MAX_STRENGTH = 12;
/** Maximum number of debris particles spawned at full strength. */
const DEBRIS_MAX_PARTICLES = 16;
/** Base ejection speed for debris (px/frame). */
const DEBRIS_BASE_SPEED = 2;
/** Additional speed per unit of strength. */
const DEBRIS_SPEED_SCALE = 0.2;
/** Random ± variance added to each debris particle's speed. */
const DEBRIS_SPEED_VARIANCE = 0.75;
/** Minimum debris lifetime in frames. */
const DEBRIS_MIN_LIFE = 50;
/** Maximum debris lifetime in frames. */
const DEBRIS_MAX_LIFE = 100;

const DEBRIS_POOL_SIZE = 100;

const DEBRIS_TEXTURE = 'debris';

/**
 * Palette for cooling fusion-metal debris.
 * t=0 (dying) → dark ember; t=1 (fresh) → blue-white plasma.
 * Stops run coolest→hottest across 64 entries.
 *
 */
export const DEBRIS_COOLING_PALETTE = [
    Rainbow.parse('rgb(255, 255, 0)'),
    Rainbow.parse('rgb(255, 0, 0)'),
    Rainbow.parse('rgb(136, 136, 136)'),
];

export const EXHAUST_COOLING_PALETTE = [
    Rainbow.parse('rgb(255, 255, 255)'),
    Rainbow.parse('rgb(0, 150, 255)'),
    Rainbow.parse('rgb(136, 136, 136)'),
];

// ─── Exhaust constants ───────────────────────────────────────────────────────

/** Particles emitted per frame while thrusting. */
const EXHAUST_PARTICLES_PER_EMIT = 1;
/** Distance behind the owner's center where particles spawn (px). */
const EXHAUST_OFFSET = 16;
/** Base ejection speed (px/frame). */
const EXHAUST_BASE_SPEED = 2.5;
/** Random ± variance added to each particle's speed (px/frame). */
const EXHAUST_SPEED_VARIANCE = 1.2;
/** ± angular spread around the backward direction (degrees). */
const EXHAUST_ANGLE_SPREAD = 20;
/** Minimum particle lifetime in frames. */
const EXHAUST_MIN_LIFE = 18;
/** Maximum particle lifetime in frames. */
const EXHAUST_MAX_LIFE = 30;

const EXHAUST_POOL_SIZE = 200;

const EXHAUST_TEXTURE = 'exhaust';

type Particle = {
    active: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
};

enum PARTICLE_TYPES {
    EXHAUST,
    DEBRIS,
    IMPACT,
}

type ParticleSlot = {
    t: PARTICLE_TYPES;
    p: Particle;
    sprite: Phaser.GameObjects.Sprite;
    palette?: Color32[];
};

/**
 * Sample a palette at normalised age t (1 = fresh, 0 = dying) and return a
 * Phaser-compatible 24-bit tint (0xRRGGBB). Alpha from the Color32 is discarded.
 */
function _particleTint(palette: Color32[], t: number): number {
    const color = Rainbow.multiLerpColor(palette, 1 - t);
    return (color >>> 8) & 0xffffff;
}

/**
 * Pool-based particle system for ship thrust exhaust.
 *
 * Particles are physics-independent: they move in a straight line, fade
 * out linearly, and shrink slightly over their lifetime.  No collision
 * detection is performed.
 *
 * Usage:
 *   const exhaust = new ParticleSystem(scene, exhaustLayer, 200);
 *   // each frame:
 *   if (thrusting) exhaust.emit(ship.x, ship.y, ship.angle);
 *   exhaust.update();
 */
export class ParticleSystem {
    private readonly _exhaustSlots: ParticleSlot[];
    private readonly _debrisSlots: ParticleSlot[];

    constructor(scene: Phaser.Scene, layer: Phaser.GameObjects.Layer) {
        this._exhaustSlots = this._createPool(
            scene,
            layer,
            EXHAUST_POOL_SIZE,
            EXHAUST_TEXTURE,
            PARTICLE_TYPES.EXHAUST
        );
        this._debrisSlots = this._createPool(
            scene,
            layer,
            DEBRIS_POOL_SIZE,
            DEBRIS_TEXTURE,
            PARTICLE_TYPES.DEBRIS
        );
    }

    private _createPool(
        scene: Phaser.Scene,
        layer: Phaser.GameObjects.Layer,
        size: number,
        texture: string,
        particleType: PARTICLE_TYPES
    ) {
        return Array.from({ length: size }, () => {
            const sprite = scene.add.sprite(0, 0, texture);
            sprite.setVisible(false);
            layer.add(sprite);
            return {
                t: particleType,
                p: { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1 },
                sprite,
            };
        });
    }

    /**
     * Spawn a burst of debris particles at the ship's center.
     * Call every frame while thrusting.
     */
    emitDebris(x: number, y: number, strength: number): void {
        if (strength < DEBRIS_MIN_STRENGTH) {
            return;
        }

        const clampedStrength = Math.min(strength, DEBRIS_MAX_STRENGTH);
        const t = clampedStrength / DEBRIS_MAX_STRENGTH; // 0..1
        const count = Math.round(1 + t * (DEBRIS_MAX_PARTICLES - 1));
        const speed = DEBRIS_BASE_SPEED + clampedStrength * DEBRIS_SPEED_SCALE;

        let spawned = 0;
        for (const slot of this._debrisSlots) {
            if (spawned >= count) {
                break;
            }
            if (slot.p.active) {
                continue;
            }

            const angle = Math.random() * Math.PI * 2;
            const s = speed + (Math.random() - 0.5) * 2 * DEBRIS_SPEED_VARIANCE;
            const life = Math.round(
                DEBRIS_MIN_LIFE + Math.random() * (DEBRIS_MAX_LIFE - DEBRIS_MIN_LIFE)
            );

            slot.p.active = true;
            slot.p.x = x;
            slot.p.y = y;
            slot.p.vx = Math.cos(angle) * s;
            slot.p.vy = Math.sin(angle) * s;
            slot.p.life = life;
            slot.p.maxLife = life;
            slot.palette = DEBRIS_COOLING_PALETTE;
            slot.sprite.setVisible(true);
            spawned++;
        }
    }

    /**
     * Spawn a burst of exhaust particles at the ship's nozzle position.
     * Call every frame while thrusting.
     *
     * @param x      Owner's world-pixel X.
     * @param y      Owner's world-pixel Y.
     * @param angle  Owner's facing angle in degrees (0 = pointing up).
     */
    emitExhaust(x: number, y: number, angle: number): void {
        const rad = (angle * Math.PI) / 180;
        // Nozzle is directly behind the ship center
        const nozzleX = x - Math.sin(rad) * EXHAUST_OFFSET;
        const nozzleY = y + Math.cos(rad) * EXHAUST_OFFSET;

        let spawned = 0;
        for (const slot of this._exhaustSlots) {
            if (spawned >= EXHAUST_PARTICLES_PER_EMIT) {
                break;
            }
            if (slot.p.active) {
                continue;
            }

            // Ejection direction: backward ± random spread
            const spreadRad =
                ((angle + 180 + (Math.random() - 0.5) * 2 * EXHAUST_ANGLE_SPREAD) * Math.PI) / 180;
            const speed = EXHAUST_BASE_SPEED + (Math.random() - 0.5) * 2 * EXHAUST_SPEED_VARIANCE;
            const life = Math.round(
                EXHAUST_MIN_LIFE + Math.random() * (EXHAUST_MAX_LIFE - EXHAUST_MIN_LIFE)
            );

            slot.p.active = true;
            slot.p.x = nozzleX;
            slot.p.y = nozzleY;
            slot.p.vx = Math.sin(spreadRad) * speed;
            slot.p.vy = -Math.cos(spreadRad) * speed;
            slot.p.life = life;
            slot.palette = EXHAUST_COOLING_PALETTE;
            slot.p.maxLife = life;
            slot.sprite.setVisible(true);
            spawned++;
        }
    }

    /**
     * Returns the inverted age of particle 1 → 0
     * @param ps
     * @private
     */
    private _depleteParticleLife(ps: ParticleSlot): number {
        const { p, sprite } = ps;
        p.life--;
        if (p.life <= 0) {
            p.active = false;
            sprite.setVisible(false);
            return 0;
        } else {
            p.x += p.vx;
            p.y += p.vy;

            const t = p.life / p.maxLife; // 1 → 0 as particle ages
            sprite.x = Math.round(p.x);
            sprite.y = Math.round(p.y);
            return t;
        }
    }

    private _updateExhaust(ps: ParticleSlot) {
        const t = this._depleteParticleLife(ps);
        if (t == 0) {
            return;
        }
        const { sprite, palette } = ps;

        sprite.setScale(0.4 + t * 0.6); // shrinks from 1.0 → 0.4
        if (palette !== undefined) {
            sprite.setTint(_particleTint(palette, t));
        }
    }

    private _updateDebris(ps: ParticleSlot) {
        const t = this._depleteParticleLife(ps);
        if (t == 0) {
            return;
        }
        const { sprite, palette } = ps;
        sprite.alpha = t * t; // quadratic fade — snappy then quick out
        sprite.setScale(0.3 + t * 0.5); // shrinks from 0.8 → 0.3
        if (palette !== undefined) {
            sprite.setTint(_particleTint(palette, t));
        }
    }

    /**
     * Advance all active particles by one frame and sync their sprites.
     * Call every frame unconditionally.
     */
    update(): void {
        for (const ps of this._exhaustSlots) {
            if (ps.p.active) {
                this._updateExhaust(ps);
            }
        }

        for (const ps of this._debrisSlots) {
            if (ps.p.active) {
                this._updateDebris(ps);
            }
        }
    }
}
