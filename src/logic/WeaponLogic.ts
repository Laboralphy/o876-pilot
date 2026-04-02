import { IControlState } from '../world-scene/IControlState';

type FireState = 'idle' | 'bursting' | 'antispam';

/**
 * Abstract base for all weapon types.
 *
 * Owns the burst-fire state machine and exposes the per-frame output
 * (`wantsToFire`, `fireX/Y/angle`) that the owning sprite store passes
 * up to the scene for bullet spawning.
 *
 * Subclasses set the three timing/geometry constants; the state machine
 * logic lives here and is never duplicated.
 *
 * State transitions:
 *   idle → [fire pressed] → bursting → [burst expires] → antispam → [timer] → idle → [fire still held] → bursting → …
 */
export abstract class WeaponLogic {
    /** True for exactly one frame when a shot should be spawned. */
    wantsToFire: boolean = false;
    /** World-pixel muzzle position and direction for the next bullet. */
    fireX: number = 0;
    fireY: number = 0;
    fireAngle: number = 0;

    /** Game frames between individual shots within a burst. */
    abstract readonly fireCooldown: number;
    /** Total burst duration in game frames. */
    abstract readonly burstDuration: number;
    /** Distance ahead of the owner's center where bullets spawn (px). */
    abstract readonly muzzleOffset: number;
    /**
     * Minimum delay in game frames between the end of one burst and the start
     * of the next.  Counted from the moment the fire button is released.
     * Prevents the player from retriggering the weapon too rapidly.
     */
    abstract readonly antiSpam: number;

    private _fireState: FireState = 'idle';
    private _burstTimer: number = 0;
    private _shotCooldown: number = 0;
    private _antiSpamTimer: number = 0;

    /**
     * Advance the weapon by one game frame.
     * @param control  Current input state.
     * @param x        Owner's world-pixel X.
     * @param y        Owner's world-pixel Y.
     * @param angle    Owner's facing angle in degrees.
     */
    update(control: IControlState, x: number, y: number, angle: number): void {
        this.wantsToFire = false;

        switch (this._fireState) {
            case 'idle':
                if (control.fire) {
                    this._fireState = 'bursting';
                    this._burstTimer = this.burstDuration;
                    this._shotCooldown = 0; // shoot on the very first frame
                }
                break;

            case 'bursting': {
                if (this._shotCooldown > 0) {
                    this._shotCooldown--;
                }
                if (this._shotCooldown === 0) {
                    const rad = (angle * Math.PI) / 180;
                    this.fireX = x + Math.sin(rad) * this.muzzleOffset;
                    this.fireY = y - Math.cos(rad) * this.muzzleOffset;
                    this.fireAngle = angle;
                    this.wantsToFire = true;
                    this._shotCooldown = this.fireCooldown;
                }
                this._burstTimer--;
                if (this._burstTimer <= 0) {
                    this._fireState = 'antispam';
                    this._antiSpamTimer = this.antiSpam;
                }
                break;
            }

            case 'antispam':
                this._antiSpamTimer--;
                if (this._antiSpamTimer <= 0) {
                    this._fireState = 'idle';
                }
                break;
        }
    }
}
