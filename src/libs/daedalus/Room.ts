export type Direction = 'N' | 'S' | 'E' | 'W';

/**
 * A single room (cell) in a Prim labyrinth.
 *
 * `passages` records which walls have been opened by the generator.
 * `attributes` is a free-form map for any game data the caller wants
 * to attach (room type, items, visited flag, difficulty, …).
 */
export class Room {
    public readonly passages = new Set<Direction>();
    public readonly attributes = new Map<string, unknown>();
    /**
     * Adjacent rooms.
     * Associates a direction with the room that is adjacent in that direction if this direction is open.
     */
    public readonly adjacentRooms = new Map<Direction, Room>();

    constructor(
        readonly x: number,
        readonly y: number
    ) {}

    /** Attach an attribute. Returns `this` for chaining. */
    set(key: string, value: unknown): this {
        this.attributes.set(key, value);
        return this;
    }

    /** Read a typed attribute. Returns `undefined` if absent. */
    get<T = unknown>(key: string): T | undefined {
        return this.attributes.get(key) as T | undefined;
    }

    has(key: string): boolean {
        return this.attributes.has(key);
    }

    hasPassage(dir: Direction): boolean {
        return this.passages.has(dir);
    }

    /** True if only one passage exists — useful for placing loot/enemies. */
    isDeadEnd(): boolean {
        return this.passages.size === 1;
    }
}
