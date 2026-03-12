import { ISeededRNG } from './ISeededRNG';

/**
 * Creates a seeded RNG using the Mulberry32 algorithm.
 * @param seed - Any integer. Same seed = same sequence.
 */
export function createRNG(seed: number): ISeededRNG {
    // Ensure seed is a valid 32-bit unsigned integer
    let state = seed >>> 0;
    const initialSeed = state;

    function mulberry32(): number {
        state |= 0;
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    }

    return {
        next(): number {
            return mulberry32();
        },

        nextFloat(min: number, max: number): number {
            return min + mulberry32() * (max - min);
        },

        nextInt(min: number, max: number): number {
            return Math.floor(min + mulberry32() * (max - min + 1));
        },

        nextBool(probability = 0.5): boolean {
            return mulberry32() < probability;
        },

        pick<T>(array: T[]): T {
            if (array.length === 0) throw new Error('Cannot pick from empty array');
            return array[Math.floor(mulberry32() * array.length)];
        },

        reset(): void {
            state = initialSeed;
        },

        getState(): number {
            return state;
        },

        setState(savedState: number): void {
            state = savedState >>> 0;
        },
    };
}

/**
 * Hashes a string to a uint32 seed using the djb2 algorithm.
 * Useful for named seeds like "level-3" or "world-seed-alpha".
 */
export function hashSeed(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
    }
    return hash;
}

/**
 * Creates a seeded RNG from a string label.
 * createRNGFromString("level-3") always produces the same sequence.
 */
export function createRNGFromString(label: string): ISeededRNG {
    return createRNG(hashSeed(label));
}
