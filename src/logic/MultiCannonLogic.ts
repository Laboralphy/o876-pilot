import { WeaponLogic } from './WeaponLogic';

/**
 * Rapid-fire burst cannon.
 *
 * Fires a tight burst of shots in quick succession, then locks until the
 * trigger is released.  All timing values are tuned for ~60 fps.
 */
export class MultiCannonLogic extends WeaponLogic {
    /** 4 frames between shots → ~15 shots/sec within the burst. */
    readonly fireCooldown = 4;
    /** 9 frames ≈ 150 ms burst → 3 shots per trigger pull. */
    readonly burstDuration = 9;
    /** Spawn bullets 18 px ahead of the ship center (ship radius 14 + 4 px clearance). */
    readonly muzzleOffset = 18;
    /** 45 frames ≈ 750 ms — minimum delay between bursts once the trigger is released. */
    readonly antiSpam = 18;
}
