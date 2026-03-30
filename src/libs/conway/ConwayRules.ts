/**
 * Rules governing a Conway Game of Life step.
 *
 * survival: set of live-neighbour counts that keep a live cell alive.
 * birth:    set of live-neighbour counts that bring a dead cell to life.
 *
 * Classic Game of Life: survival = [2, 3], birth = [3]  (also written B3/S23)
 */
export interface ConwayRules {
    survival: ReadonlyArray<number>;
    birth: ReadonlyArray<number>;
}

/** B3/S23 — Conway's original Game of Life */
export const CONWAY_CLASSIC: ConwayRules = {
    survival: [2, 3],
    birth: [3],
};

/** B36/S23 — HighLife (produces self-replicators) */
export const CONWAY_HIGHLIFE: ConwayRules = {
    survival: [2, 3],
    birth: [3, 6],
};

/** B3/S12345 — Maze generator */
export const CONWAY_MAZE: ConwayRules = {
    survival: [1, 2, 3, 4, 5],
    birth: [3],
};

/** B5678/S45678 — Diamoeba (amoeba-like blobs) */
export const CONWAY_DIAMOEBA: ConwayRules = {
    survival: [4, 5, 6, 7, 8],
    birth: [5, 6, 7, 8],
};

/** B456789/S45678 — Cave (cave-like formations) */
export const CONWAY_CAVE: ConwayRules = {
    survival: [4, 5, 6, 7, 8, 9],
    birth: [5, 6, 7, 8],
};
