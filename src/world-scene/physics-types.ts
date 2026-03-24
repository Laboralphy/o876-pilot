/**
 * Physical properties derived from a WorldBlock at a given cell position.
 * Built by WorldBuilder and stored alongside the tile map.
 */
export type PhysicsCell = {
    solid: boolean;
    transparent: boolean;
    tags: string[];
};
