import { WorldScene } from './WorldScene';
import { T01WorldGenerator } from '../world-generator/T01WorldGenerator';
import { AstroTileRenderer } from '../tile-renderer/themes/astro/AstroTileRenderer';

export class Level01 extends WorldScene {
    constructor() {
        const wg = new T01WorldGenerator(200, 200);
        const tr = new AstroTileRenderer();
        super({
            key: 'Level01',
            layers: [
                {
                    worldGenerator: wg,
                    tileRenderer: tr,
                    tileSize: 64,
                    tilesetWidth: 200,
                    tilesetHeight: 200,
                    scrollFactor: 1,
                    cellTiles: [
                        {
                            cell: 0,
                            tiles: [0],
                        },
                        {
                            cell: 1,
                            tiles: [10, 11, 12, 13],
                        },
                        {
                            cell: 2,
                            tiles: [20, 21, 22, 23],
                        },
                        {
                            cell: 3,
                            tiles: [3],
                        },
                        {
                            cell: 4,
                            tiles: [4],
                        },
                    ],
                },
            ],
        });
    }
}
