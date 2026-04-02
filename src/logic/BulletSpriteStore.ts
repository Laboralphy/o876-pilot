import { SpriteStore } from '../world-scene/SpriteStore';
import { IPhysicsReader } from '../world-scene/IPhysicsReader';

/** Pixels per frame — outruns the ship's MAX_SPEED of 16 px/frame. */
export const BULLET_SPEED = 22;

/** Damage dealt on impact (reserved for future hit-point system). */
export const BULLET_POWER = 10;

/** Frames before the bullet expires regardless of collision (~1 s at 60 fps). */
export const BULLET_LIFETIME = 60;

/** Collision probe radius in pixels. */
const BULLET_RADIUS = 2;

/** Game frames between animation-frame advances. */
const ANIM_FRAMES = 4;

/**
 * Data store for a single pooled bullet.
 *
 * Bullets are never added to SpriteHorde — the BulletPool owns them and
 * drives their update/sync loop directly.  `controllable` stays false so
 * nothing else touches them.
 */
export class BulletSpriteStore extends SpriteStore {
    active: boolean = false;
    xSpeed: number = 0;
    ySpeed: number = 0;
    remainingLife: number = 0;
    private _animTick: number = 0;

    constructor(id: string) {
        super(id, 'bullet');
        this.controllable = false;
    }

    activate(x: number, y: number, angle: number): void {
        const rad = (angle * Math.PI) / 180;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.xSpeed = Math.sin(rad) * BULLET_SPEED;
        this.ySpeed = -Math.cos(rad) * BULLET_SPEED;
        this.active = true;
        this.alpha = 1;
        this.frame = 0;
        this.remainingLife = BULLET_LIFETIME;
        this._animTick = 0;
    }

    deactivate(): void {
        this.active = false;
        this.alpha = 0;
        this.xSpeed = 0;
        this.ySpeed = 0;
    }

    /**
     * Advance the bullet by one game frame.
     * Returns `true` when the bullet should be returned to the pool
     * (either it hit a solid cell or its lifetime expired).
     * Called directly by BulletPool, not by SpriteHorde.
     */
    updateBullet(physics: IPhysicsReader): boolean {
        this.remainingLife--;
        if (this.remainingLife <= 0) {
            return true;
        }

        // Animate (cycle through 4 brightness frames for energy-pulse effect)
        this._animTick++;
        if (this._animTick >= ANIM_FRAMES) {
            this._animTick = 0;
            this.frame = (this.frame + 1) % 4;
        }

        const nextX = this.x + this.xSpeed;
        const nextY = this.y + this.ySpeed;

        // Probe the leading edge in both axes to detect solid collision
        if (
            physics.isSolid(nextX, nextY) ||
            physics.isSolid(nextX + Math.sign(this.xSpeed) * BULLET_RADIUS, nextY) ||
            physics.isSolid(nextX, nextY + Math.sign(this.ySpeed) * BULLET_RADIUS)
        ) {
            return true; // impact
        }

        this.x = nextX;
        this.y = nextY;
        return false;
    }

    /** Required by abstract base — not called (controllable = false). */
    update(): void {
        // does nothing : sprite is not controllable
    }
}
