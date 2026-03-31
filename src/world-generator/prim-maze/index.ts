import { createRNG } from '../../libs/mulberry32';
import { PrimMazeWG } from './PrimMazeWG';

export { PrimMazeWG, PRIM_CELL_FLOOR, PRIM_CELL_WALL } from './PrimMazeWG';

function render() {
    const wg = new PrimMazeWG(createRNG(655259), 150, 100);
    const r: number[][] = wg.generate();
    r.forEach((row) => console.log(row.map((cell) => (cell ? 'X' : ' ')).join('')));
}

render();
