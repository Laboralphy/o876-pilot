import { IControlState } from './IControlState';
import { IPhysicsReader } from './IPhysicsReader';

export abstract class SpriteStore {
    x: number = 0;
    y: number = 0;
    angle: number = 0;
    scale: number = 1;
    alpha: number = 1;
    frame: number = 0;
    controllable: boolean = false;

    protected constructor(
        public readonly id: string,
        public readonly textureKey: string
    ) {}

    abstract update(control: IControlState, physics: IPhysicsReader): void;
}
