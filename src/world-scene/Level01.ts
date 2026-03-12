import { LayerDefinition, WorldScene } from './WorldScene';
import { CrackPlanetWG } from '../world-generator/CrackPlanetWG';
import { AstroTileRenderer } from '../tile-renderer/themes/astro/AstroTileRenderer';
import { DeepSpaceWG } from '../world-generator/DeepSpaceWG';
import { DeepSpaceTileRenderer } from '../tile-renderer/themes/astro/DeepSpaceTileRenderer';
import { createRNGFromString } from '../libs/mulberry32';
import { IWorldGenerator } from '../world-generator/IWorldGenerator';
import { ITileRenderer } from '../tile-renderer/ITileRenderer';

type CellTile = {
    cell: number;
    tiles: number[];
};

export class Level01 extends WorldScene {
    constructor() {
        super({
            key: 'Level01',
        });
    }

    create() {
        const rng = createRNGFromString('level-1');
        const wg = new CrackPlanetWG(rng, 200, 200);
        const tr = new AstroTileRenderer();
        const dswg = new DeepSpaceWG(rng, 100, 100);
        const dstr = new DeepSpaceTileRenderer();

        const md = this.generateMapData(tr, wg, [
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
        ]);
        const dsmd = this.generateMapData(dstr, dswg, [
            {
                cell: 0,
                tiles: [10, 11, 12, 13],
            },
            {
                cell: 1,
                tiles: [20, 21, 22, 23],
            },
        ]);
        this.layerDefinitions = [
            {
                zIndex: 10,
                mapData: md,
                texture: tr.buildTileset(),
                tileSize: tr.tileSize,
                tilesetWidth: wg.worldWidth,
                tilesetHeight: wg.worldHeight,
                scrollFactor: 1,
            },
            {
                zIndex: 5,
                mapData: dsmd,
                texture: dstr.buildTileset(),
                tileSize: dstr.tileSize,
                tilesetWidth: dswg.worldWidth,
                tilesetHeight: dswg.worldHeight,
                scrollFactor: 0.5,
            },
        ];

        super.create();
    }

    generateMapData(
        tileRenderer: ITileRenderer,
        worldGenerator: IWorldGenerator,
        cellTiles: CellTile[]
    ): number[][] {
        const cellMap = worldGenerator.generateMapData();
        const cellTileRegistry = new Map<number, number[]>();
        cellTiles.forEach((ct: CellTile) => {
            cellTileRegistry.set(ct.cell, ct.tiles);
        });

        const tileIndexRegistry = tileRenderer.getTileIndexRegistry();
        return cellMap.map((row) =>
            row.map((cell) => {
                const cellTiles = cellTileRegistry.get(cell) ?? [];
                const tileId =
                    cellTiles.length > 0
                        ? cellTiles[Math.floor(Math.random() * cellTiles.length)]
                        : 0;
                return tileIndexRegistry.get(tileId) ?? 0;
            })
        );
    }
}
