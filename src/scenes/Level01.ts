import { WorldScene } from '../world-scene/WorldScene';
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
    animations?: string[];
};

export class Level01 extends WorldScene {
    private rng = createRNGFromString('level-1');
    constructor() {
        super({
            key: 'Level01',
        });
    }

    create() {
        const wg = new CrackPlanetWG(this.rng, 200, 200);
        const tr = new AstroTileRenderer();
        const dswg = new DeepSpaceWG(this.rng, 100, 100);
        const dstr = new DeepSpaceTileRenderer();

        const md = this.buildTileMap(tr, wg, [
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
                tiles: [40],
                animations: ['space-anomaly'],
            },
        ]);
        const dsmd = this.buildTileMap(dstr, dswg, [
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
                key: 'foreground',
                zIndex: 10,
                tileMap: md,
                texture: tr.buildTileset(),
                tileSize: tr.tileSize,
                tilesetWidth: wg.worldWidth,
                tilesetHeight: wg.worldHeight,
                scrollFactor: 1,
                animations: [
                    {
                        key: 'space-anomaly',
                        duration: 1000,
                        frames: [40, 41, 42, 43],
                        repeat: Infinity,
                        yoyo: true,
                    },
                ],
            },
            {
                key: 'deepspace',
                zIndex: 5,
                tileMap: dsmd,
                texture: dstr.buildTileset(),
                tileSize: dstr.tileSize,
                tilesetWidth: dswg.worldWidth,
                tilesetHeight: dswg.worldHeight,
                scrollFactor: 0.5,
                animations: [],
            },
        ];

        super.create();
    }

    buildTileMap(
        tileRenderer: ITileRenderer,
        worldGenerator: IWorldGenerator<number>,
        cellTiles: CellTile[]
    ): { tileMap: number[][]; animatedTiles: Map<string, { x: number; y: number }[]> } {
        const cellMap = worldGenerator.generate();
        const cellTileRegistry = new Map<number, number[]>();
        const animatedTileRegistry = new Map<string, { x: number; y: number }[]>();
        cellTiles.forEach((ct: CellTile) => {
            cellTileRegistry.set(ct.cell, ct.tiles);
        });

        const animatedTiles = new Map<string, { x: number; y: number }[]>();
        const tileIndexRegistry = tileRenderer.getTileIndexRegistry();
        const tileMap = cellMap.map((row) =>
            row.map((cell) => {
                const cellTiles = cellTileRegistry.get(cell) ?? [];
                const tileId =
                    cellTiles.length > 0 ? cellTiles[this.rng.nextInt(0, cellTiles.length)] : 0;
                return tileIndexRegistry.get(tileId) ?? 0;
            })
        );

        return { tileMap, animatedTiles };
    }
}
