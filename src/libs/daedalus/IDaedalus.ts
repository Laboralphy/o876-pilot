import type { Direction, Room } from './Room';
import type { NumberGrid } from '../grid/NumberGrid';

export interface IDaedalus {
    get width(): number;
    get height(): number;
    get rooms(): Room[][];

    roomAt(x: number, y: number): Room | undefined;
    forEach(fn: (room: Room, x: number, y: number) => void): void;
    deadEnds(): Room[];

    openPassage(x: number, y: number, direction: Direction): void;
    closePassage(x: number, y: number, direction: Direction): void;

    toGrid(wallValue?: number, floorValue?: number): NumberGrid;
    toGridWith(wallValue: number, encoder: (room: Room) => number): NumberGrid;
}
