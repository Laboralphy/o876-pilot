import { PhysicsCell } from './physics-types';

export interface IPhysicsReader {
    isSolid(x: number, y: number): boolean;
    getPhysicCell(x: number, y: number): PhysicsCell | null;
}
