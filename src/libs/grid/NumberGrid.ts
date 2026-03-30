import { Grid } from './Grid';

export class NumberGrid extends Grid<number> {
    constructor(width: number, height: number) {
        super(width, height);
    }

    createCell(): number {
        return 0;
    }

    discardCell(): void {
        // primitives need no cleanup
    }

    copyCell(value: number): number {
        return value;
    }
}
