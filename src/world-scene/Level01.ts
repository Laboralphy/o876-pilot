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
                },
            ],
        });
    }
}
