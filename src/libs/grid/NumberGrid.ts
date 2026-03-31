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

    clone(): this {
        const copy = new NumberGrid(this._width, this._height) as this;
        copy.copyArea(this, 0, 0, this._width, this._height, 0, 0);
        return copy;
    }
}
