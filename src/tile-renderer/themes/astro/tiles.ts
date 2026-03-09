import { TileDefinition } from './tile-definition';

export const TILES: TileDefinition[] = [
    {
        id: 0,
        renderer: 'drawSpreadStars',
        color: 0x0d1b2e,
        accent: 0x1a3a5c,
    },
    {
        id: 1,
        renderer: 'drawNebula',
        color: 0x1a3358,
        accent: 0x2d5a8e,
    },
    {
        id: 2,
        renderer: 'drawAsteroid',
        color: 0x2a4a35,
        accent: 0x4a7a5a,
    },
    {
        id: 3,
        renderer: 'drawCrackedBlock',
        color: 0x4a3218,
        accent: 0x8a5a2a,
    },
    {
        id: 4,
        renderer: 'drawGoldCrystal',
        color: 0x6a5010,
        accent: 0xc8a020,
    },
    {
        id: 5,
        renderer: 'drawSpaceAnomaly',
        color: 0x2a0a4a,
        accent: 0x5a1a8a,
    },
];
