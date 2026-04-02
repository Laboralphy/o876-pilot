import { SpriteStore } from '../world-scene/SpriteStore';
import { IControlState } from '../world-scene/IControlState';
import { IPhysicsReader } from '../world-scene/IPhysicsReader';
import { WeaponLogic } from './WeaponLogic';
import { MultiCannonLogic } from './MultiCannonLogic';

const ROTATE_SPEED = 3; // degrees per frame
const THRUST_ACC = 0.3; // px/frame² — terminal velocity ~15px/frame
const DRAG = 0.98; // speed multiplier per frame (viscosity)
const MAX_SPEED = 16; // px/frame
const BOUNCE = -0.4; // bounce factor (reverses + dampens to 40%)
const SHIP_RADIUS = 14; // collision probe radius in pixels
const GRAVITY_FALL = 0.1;

export class ShipSpriteStore extends SpriteStore {
    xSpeed: number = 0;
    ySpeed: number = 0;
    /** Speed at the moment of the last wall collision this frame (px/frame). 0 if no collision. */
    collisionStrength: number = 0;

    readonly _weapon: WeaponLogic = new MultiCannonLogic();

    constructor(id: string) {
        super(id, 'spaceship');
        this.controllable = true;
    }

    private _hitsX(nextX: number, physics: IPhysicsReader): boolean {
        const edge = nextX + Math.sign(this.xSpeed) * SHIP_RADIUS;
        return [-SHIP_RADIUS, 0, SHIP_RADIUS].some((dy) => physics.isSolid(edge, this.y + dy));
    }

    private _hitsY(nextY: number, physics: IPhysicsReader): boolean {
        const edge = nextY + Math.sign(this.ySpeed) * SHIP_RADIUS;
        return [-SHIP_RADIUS, 0, SHIP_RADIUS].some((dx) => physics.isSolid(this.x + dx, edge));
    }

    update(control: IControlState, physics: IPhysicsReader): void {
        this.collisionStrength = 0;

        // Rotation
        if (control.rotateCW) {
            this.angle += ROTATE_SPEED;
        }
        if (control.rotateCCW) {
            this.angle -= ROTATE_SPEED;
        }

        this.ySpeed += GRAVITY_FALL;
        // Thrust: accelerate along facing direction
        if (control.thrust) {
            const rad = (this.angle * Math.PI) / 180;
            this.xSpeed += Math.sin(rad) * THRUST_ACC;
            this.ySpeed -= Math.cos(rad) * THRUST_ACC;
        }

        // Drag
        this.xSpeed *= DRAG;
        this.ySpeed *= DRAG;

        // Speed cap
        const norm = Math.hypot(this.xSpeed, this.ySpeed);
        if (norm > MAX_SPEED) {
            const ratio = MAX_SPEED / norm;
            this.xSpeed *= ratio;
            this.ySpeed *= ratio;
        }

        // Move X with collision
        const nextX = this.x + this.xSpeed;
        if (this.xSpeed !== 0 && this._hitsX(nextX, physics)) {
            this.collisionStrength = Math.max(
                this.collisionStrength,
                Math.hypot(this.xSpeed, this.ySpeed)
            );
            this.xSpeed *= BOUNCE;
        } else {
            this.x = nextX;
        }

        // Move Y with collision
        const nextY = this.y + this.ySpeed;
        if (this.ySpeed !== 0 && this._hitsY(nextY, physics)) {
            this.collisionStrength = Math.max(
                this.collisionStrength,
                Math.hypot(this.xSpeed, this.ySpeed)
            );
            this.ySpeed *= BOUNCE;
        } else {
            this.y = nextY;
        }

        this._weapon.update(control, this.x, this.y, this.angle);

        // Frame
        this.frame = control.thrust ? 1 : 0;
    }
}
