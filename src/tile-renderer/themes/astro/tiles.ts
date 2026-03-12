export type TileDefinition = {
    id: number;
    renderer: string;
    color: number;
    accent: number;
};

export const TILES: TileDefinition[] = [
    {
        id: 0,
        renderer: '',
        color: 0,
        accent: 0,
    },
    {
        id: 10,
        renderer: 'drawAsteroid',
        color: 0x2a4a35,
        accent: 0x4a7a5a,
    },
    {
        id: 11,
        renderer: 'drawAsteroid',
        color: 0x2a4a35,
        accent: 0x4a7a5a,
    },
    {
        id: 12,
        renderer: 'drawAsteroid',
        color: 0x2a4a35,
        accent: 0x4a7a5a,
    },
    {
        id: 13,
        renderer: 'drawAsteroid',
        color: 0x2a4a35,
        accent: 0x4a7a5a,
    },
    {
        id: 20,
        renderer: 'drawCrackedBlock',
        color: 0x4a3218,
        accent: 0x8a5a2a,
    },
    {
        id: 21,
        renderer: 'drawCrackedBlock',
        color: 0x4a3218,
        accent: 0x8a5a2a,
    },
    {
        id: 22,
        renderer: 'drawCrackedBlock',
        color: 0x4a3218,
        accent: 0x8a5a2a,
    },
    {
        id: 23,
        renderer: 'drawCrackedBlock',
        color: 0x4a3218,
        accent: 0x8a5a2a,
    },
    {
        id: 3,
        renderer: 'drawGoldCrystal',
        color: 0x6a5010,
        accent: 0xc8a020,
    },
    {
        id: 4,
        renderer: 'drawSpaceAnomaly',
        color: 0x2a0a4a,
        accent: 0x5a1a8a,
    },
];

export const DEEP_SPACE_TILES: TileDefinition[] = [
    {
        id: 10,
        renderer: 'drawSpreadStars',
        color: 0x0d1b2e,
        accent: 0x1a3a5c,
    },
    {
        id: 11,
        renderer: 'drawSpreadStars',
        color: 0x0d1b2e,
        accent: 0x1a3a5c,
    },
    {
        id: 12,
        renderer: 'drawSpreadStars',
        color: 0x0d1b2e,
        accent: 0x1a3a5c,
    },
    {
        id: 13,
        renderer: 'drawSpreadStars',
        color: 0x0d1b2e,
        accent: 0x1a3a5c,
    },
    {
        id: 20,
        renderer: 'drawNebula',
        color: 0x1a3358,
        accent: 0x2d5a8e,
    },
    {
        id: 21,
        renderer: 'drawNebula',
        color: 0x1a3358,
        accent: 0x2d5a8e,
    },
    {
        id: 22,
        renderer: 'drawNebula',
        color: 0x1a3358,
        accent: 0x2d5a8e,
    },
    {
        id: 23,
        renderer: 'drawNebula',
        color: 0x1a3358,
        accent: 0x2d5a8e,
    },
];
