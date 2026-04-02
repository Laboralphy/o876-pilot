import Phaser from 'phaser';

// ─── Debris constants ────────────────────────────────────────────────────────

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
const DEBRIS_MIN_LIFE = 25;
/** Maximum debris lifetime in frames. */
const DEBRIS_MAX_LIFE = 50;

const DEBRIS_POOL_SIZE = 100;

const TEXTURE_DEBRIS = 'debris';

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

const TEXTURE_EXHAUST = 'exhaust';

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
 * Returns a Phaser-compatible tint colour for a debris particle.
 * t=1 (fresh) → bright yellow; t=0.5 → red; t=0 (dying) → gray.
 * The texture is pure white so the tint multiplies directly onto it.
 */
function _debrisTint(t: number): number {
    if (t > 0.5) {
        // yellow (255,255,0) → red (255,0,0)
        const u = (t - 0.5) * 2; // 1 → 0
        const g = Math.round(255 * u);
        return (0xff << 16) | (g << 8);
    } else {
        // red (255,0,0) → gray (136,136,136)
        const u = t * 2; // 1 → 0
        const r = Math.round(136 + 119 * u); // 255 → 136
        const gb = Math.round(136 * (1 - u)); // 0 → 136
        return (r << 16) | (gb << 8) | gb;
    }
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
        this._exhaustSlots = Array.from({ length: EXHAUST_POOL_SIZE }, () => {
            const sprite = scene.add.sprite(0, 0, TEXTURE_EXHAUST);
            sprite.setVisible(false);
            layer.add(sprite);
            return {
                p: { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1 },
                sprite,
            };
        });
        this._debrisSlots = Array.from({ length: DEBRIS_POOL_SIZE }, () => {
            const sprite = scene.add.sprite(0, 0, TEXTURE_DEBRIS);
            sprite.setVisible(false);
            layer.add(sprite);
            return {
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
        for (const { p, sprite } of this._exhaustSlots) {
            if (!p.active) {
                continue;
            }

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

        for (const { p, sprite } of this._debrisSlots) {
            if (!p.active) {
                continue;
            }

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
            sprite.alpha = t * t; // quadratic fade — snappy then quick out
            sprite.setScale(0.3 + t * 0.5); // shrinks from 0.8 → 0.3
            sprite.setTint(_debrisTint(t));
        }
    }
}
