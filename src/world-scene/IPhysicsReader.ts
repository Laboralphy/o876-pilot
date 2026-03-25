import { PhysicsCell } from './physics-types';

export interface IPhysicsReader {
    isSolid(x: number, y: number): boolean;
    getPhysicsCell(x: number, y: number): PhysicsCell | null;
}
