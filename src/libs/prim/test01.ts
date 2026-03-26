import { PrimLabyrinth } from './PrimLabyrinth';
import { createRNGFromString } from '../mulberry32';

function main() {
    const rng = createRNGFromString('test');
    const laby = new PrimLabyrinth(7, 7, rng);
    laby.generate();
    console.log(
        laby
            .toGrid()
            .map((row) => row.map((n) => (n == 1 ? '██' : '  ')).join(''))
            .join('\n')
    );
}

main();
