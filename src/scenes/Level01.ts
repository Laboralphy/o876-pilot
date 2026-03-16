import { WorldScene } from '../world-scene/WorldScene';
import { CrackPlanetWG } from '../world-generator/CrackPlanetWG';
import { AstroTileRenderer } from '../tile-renderer/themes/astro/AstroTileRenderer';
import { DeepSpaceWG } from '../world-generator/DeepSpaceWG';
import { DeepSpaceTileRenderer } from '../tile-renderer/themes/astro/DeepSpaceTileRenderer';
import { createRNGFromString } from '../libs/mulberry32';
import { AnimationDefinition } from '../world-scene/AnimationRunner';
import { buildLayerDefinition, WorldBlock } from '../world-scene/layer-builder';

export class Level01 extends WorldScene {
    private rng = createRNGFromString('level-1');
    private cpWorldBlocks: WorldBlock[] = [
        {
            cell: 0,
            tiles: [0],
            animations: [],
        },
        {
            cell: 1,
            tiles: [10, 11, 12, 13],
            animations: [],
        },
        {
            cell: 2,
            tiles: [20, 21, 22, 23],
            animations: [],
        },
        {
            cell: 3,
            tiles: [3],
            animations: [],
        },
        {
            cell: 4,
            tiles: [],
            animations: ['space-anomaly'],
        },
    ];
    private cpAnimations: AnimationDefinition[] = [
        {
            key: 'space-anomaly',
            duration: 1000,
            frames: [40, 41, 42, 43],
            repeat: Infinity,
            yoyo: false,
        },
    ];
    private dsWorldBlocks: WorldBlock[] = [
        {
            cell: 0,
            tiles: [10, 11, 12, 13],
            animations: [],
        },
        {
            cell: 1,
            tiles: [20, 21, 22, 23],
            animations: [],
        },
    ];
    private dsAnimations: AnimationDefinition[] = [];

    constructor() {
        super({
            key: 'Level01',
        });
    }

    create() {
        this.layerDefinitions = [
            buildLayerDefinition(
                this.rng,
                'foreground',
                10,
                this.cpWorldBlocks,
                this.cpAnimations,
                1,
                new AstroTileRenderer(),
                new CrackPlanetWG(this.rng, 200, 200)
            ),
            buildLayerDefinition(
                this.rng,
                'deepspace',
                5,
                this.dsWorldBlocks,
                this.dsAnimations,
                0.5,
                new DeepSpaceTileRenderer(),
                new DeepSpaceWG(this.rng, 100, 100)
            ),
        ];
        super.create();
    }
}
