import { SpriteStore } from './SpriteStore';
import { IControlState } from './IControlState';
import { IPhysicsReader } from './IPhysicsReader';

const ROTATE_SPEED = 3; // degrees per frame
const THRUST_ACC = 0.3; // px/frame² — terminal velocity ~15px/frame
const BOOST_ACC = 0.6; // px/frame² — reaches cap faster
const DRAG = 0.98; // speed multiplier per frame (viscosity)
const MAX_SPEED = 16; // px/frame
const BOUNCE = -0.4; // bounce factor (reverses + dampens to 40%)
const SHIP_RADIUS = 14; // collision probe radius in pixels
const GRAVITY_FALL = 0.1;

export class ShipSpriteStore extends SpriteStore {
    xspeed: number = 0;
    yspeed: number = 0;

    constructor(id: string) {
        super(id, 'spaceship');
        this.controllable = true;
    }

    private _hitsX(nextX: number, physics: IPhysicsReader): boolean {
        const edge = nextX + Math.sign(this.xspeed) * SHIP_RADIUS;
        return [-SHIP_RADIUS, 0, SHIP_RADIUS].some((dy) => physics.isSolid(edge, this.y + dy));
    }

    private _hitsY(nextY: number, physics: IPhysicsReader): boolean {
        const edge = nextY + Math.sign(this.yspeed) * SHIP_RADIUS;
        return [-SHIP_RADIUS, 0, SHIP_RADIUS].some((dx) => physics.isSolid(this.x + dx, edge));
    }

    update(control: IControlState, physics: IPhysicsReader): void {
        // Rotation
        if (control.rotateCW) {
            this.angle += ROTATE_SPEED;
        }
        if (control.rotateCCW) {
            this.angle -= ROTATE_SPEED;
        }

        this.yspeed += GRAVITY_FALL;
        // Thrust: accelerate along facing direction
        if (control.thrust || control.boost) {
            const acc = control.boost ? BOOST_ACC : THRUST_ACC;
            const rad = (this.angle * Math.PI) / 180;
            this.xspeed += Math.sin(rad) * acc;
            this.yspeed -= Math.cos(rad) * acc;
        }

        // Drag
        this.xspeed *= DRAG;
        this.yspeed *= DRAG;

        // Speed cap
        const norm = Math.sqrt(this.xspeed ** 2 + this.yspeed ** 2);
        if (norm > MAX_SPEED) {
            const ratio = MAX_SPEED / norm;
            this.xspeed *= ratio;
            this.yspeed *= ratio;
        }

        // Move X with collision
        const nextX = this.x + this.xspeed;
        if (this.xspeed !== 0 && this._hitsX(nextX, physics)) {
            this.xspeed *= BOUNCE;
        } else {
            this.x = nextX;
        }

        // Move Y with collision
        const nextY = this.y + this.yspeed;
        if (this.yspeed !== 0 && this._hitsY(nextY, physics)) {
            this.yspeed *= BOUNCE;
        } else {
            this.y = nextY;
        }

        // Frame
        this.frame = control.boost ? 2 : control.thrust ? 1 : 0;
    }
}
