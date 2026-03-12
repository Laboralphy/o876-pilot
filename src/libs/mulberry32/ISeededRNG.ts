export interface ISeededRNG {
    /** Returns a float in [0, 1) */
    next(): number;
    /** Returns a float in [min, max) */
    nextFloat(min: number, max: number): number;
    /** Returns an integer in [min, max] (inclusive) */
    nextInt(min: number, max: number): number;
    /** Returns true with given probability (0–1) */
    nextBool(probability?: number): boolean;
    /** Picks a random element from an array */
    pick<T>(array: T[]): T;
    /** Resets the generator to the initial seed state */
    reset(): void;
    /** Returns current internal state (for save/restore) */
    getState(): number;
    /** Restores a previously saved state */
    setState(state: number): void;
}
