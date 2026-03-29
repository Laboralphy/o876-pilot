import { WordGenerator } from '../WorldGenerator';
import type { ISeededRNG } from '../../libs/mulberry32/ISeededRNG';
import { PrimLabyrinth } from '../../libs/prim/PrimLabyrinth';
import type { Direction } from '../../libs/prim/Room';

// ─── Layout constants ────────────────────────────────────────────────────────

const ROOM_SIZE = 15; // each room cell = 15×15 tiles
const WALL_SIZE = 3; // 5-tile-thick wall between rooms
const STRIDE = ROOM_SIZE + WALL_SIZE; // 20 — tiles per room slot
const PASS_MIN = 3; // narrowest passage opening
const PASS_MAX = 13; // widest passage opening
const CAVE_PASSES = 3; // cellular-automaton iterations (more = rounder, cave-like rooms)

// ─── Cell values (matches WorldBlock "cell" IDs in level JSON) ───────────────

export const PRIM_CELL_FLOOR = 0;
export const PRIM_CELL_WALL = 1;

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Normalised distance from the labyrinth centre; 1 = exact centre, 0 = corner. */
function centrality(rx: number, ry: number, labW: number, labH: number): number {
    const cx = (labW - 1) / 2;
    const cy = (labH - 1) / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);
    if (maxDist === 0) return 1;
    return 1 - Math.sqrt((rx - cx) ** 2 + (ry - cy) ** 2) / maxDist;
}

// ─── PrimMazeWG ──────────────────────────────────────────────────────────────

/**
 * World generator that builds a Prim-style labyrinth.
 *
 * Grid layout
 * -----------
 * Each logical room maps to a (ROOM_SIZE × ROOM_SIZE) tile block.
 * Adjacent rooms are separated by a 1-tile wall.  A passage through that wall
 * is a run of PASS_MIN–PASS_MAX tiles centred on the shared side.
 *
 *   ┌───────────────┬─────┬───────────────┐
 *   │    room       │wall │    room       │   room = 15×15 tiles
 *   │    (0,0)      │     │    (1,0)      │   wall = 5 tiles thick
 *   │               │·····│               │   ··· = passage (3–11 tiles wide)
 *   │               │·····│               │
 *   └───────────────┴─────┴───────────────┘
 *
 * Output tile dimensions: (roomsX × 20 + 1) × (roomsY × 20 + 1).
 *
 * Centre braiding
 * ---------------
 * After Prim's perfect maze is generated, extra passages are opened with a
 * probability proportional to the *square* of a wall's average centrality.
 * Result: the centre of the map is a richly connected open area; the periphery
 * stays mostly maze-like.
 *
 * Neighbor solidification
 * ------------------------
 * CAVE_PASSES cellular-automaton iterations convert floor cells that have ≥ 5
 * solid neighbours (8-directional) to walls with 50 % probability.  Each pass
 * feeds on the previous result, progressively growing wall areas into rounded,
 * cave-like shapes.
 *
 * Cell values produced
 * --------------------
 *   PRIM_CELL_FLOOR = 0   open / walkable
 *   PRIM_CELL_WALL  = 1   solid wall
 */
export class PrimMazeWG extends WordGenerator {
    private readonly rng: ISeededRNG;
    private readonly roomsX: number;
    private readonly roomsY: number;

    constructor(rng: ISeededRNG, width: number, height: number) {
        // Derive room counts so the tile grid fits within the requested dimensions.
        const roomsX = Math.max(1, Math.floor((width - 1) / STRIDE));
        const roomsY = Math.max(1, Math.floor((height - 1) / STRIDE));
        super(roomsX * STRIDE + 1, roomsY * STRIDE + 1);
        this.rng = rng;
        this.roomsX = roomsX;
        this.roomsY = roomsY;
    }

    // ── Public interface ──────────────────────────────────────────────────────

    /** Number of logical rooms along X. */
    get rooms(): { x: number; y: number } {
        return { x: this.roomsX, y: this.roomsY };
    }

    generate(): number[][] {
        // 1. Perfect maze via Prim's algorithm
        const lab = new PrimLabyrinth(this.roomsX, this.roomsY, this.rng).generate();

        // 2. Braid the centre: open extra loops proportional to centrality²
        this._openCenterPassages(lab);

        // 3. Paint everything solid, then carve rooms + passages
        this.walkCells(() => PRIM_CELL_WALL);
        this._carveRoomsAndPassages(lab);

        // 4. Organic edges: repeated cellular-automaton passes grow wall areas
        //    into cave-like shapes (each pass feeds on the previous result).
        for (let i = 0; i < CAVE_PASSES; i++) {
            this._applyCellularPass();
        }

        return this.cellMap;
    }

    // ── Step 2: Centre braiding ───────────────────────────────────────────────

    private _openCenterPassages(lab: PrimLabyrinth): void {
        const { width: labW, height: labH } = lab;

        // Only iterate each wall once: check East and South neighbours.
        lab.forEach((room, rx, ry) => {
            const wallCandidates: Array<{ dir: Direction; nx: number; ny: number }> = [
                { dir: 'E', nx: rx + 1, ny: ry },
                { dir: 'S', nx: rx, ny: ry + 1 },
            ];

            for (const { dir, nx, ny } of wallCandidates) {
                if (nx >= labW || ny >= labH) continue;
                if (room.hasPassage(dir)) continue; // already open

                // Probability = square of average centrality of the two rooms.
                // At the very centre this reaches 1 (always open); at corners ≈ 0.
                const c = (centrality(rx, ry, labW, labH) + centrality(nx, ny, labW, labH)) / 2;
                if (this.rng.nextBool(c * c)) {
                    lab.openPassage(rx, ry, dir);
                }
            }
        });
    }

    // ── Step 3: Carve rooms and passages ──────────────────────────────────────

    private _carveRoomsAndPassages(lab: PrimLabyrinth): void {
        lab.forEach((room, rx, ry) => {
            // Top-left corner of this room in tile coordinates.
            // +1 accounts for the 1-tile outer border wall.
            const ox = 1 + rx * STRIDE;
            const oy = 1 + ry * STRIDE;

            // ── Carve the 9×9 room interior ──────────────────────────────────
            for (let dy = 0; dy < ROOM_SIZE; dy++) {
                for (let dx = 0; dx < ROOM_SIZE; dx++) {
                    this.setCellValue(ox + dx, oy + dy, PRIM_CELL_FLOOR);
                }
            }

            // ── East passage ──────────────────────────────────────────────────
            // The wall block spans WALL_SIZE columns starting at x = ox + ROOM_SIZE.
            // The opening is centred in the room's Y span.
            if (room.hasPassage('E')) {
                const pw = this.rng.nextInt(PASS_MIN, PASS_MAX);
                const wallStartX = ox + ROOM_SIZE;
                const passStartY = oy + Math.floor((ROOM_SIZE - pw) / 2);
                for (let wx = 0; wx < WALL_SIZE; wx++) {
                    for (let i = 0; i < pw; i++) {
                        this.setCellValue(wallStartX + wx, passStartY + i, PRIM_CELL_FLOOR);
                    }
                }
            }

            // ── South passage ─────────────────────────────────────────────────
            // The wall block spans WALL_SIZE rows starting at y = oy + ROOM_SIZE.
            // The opening is centred in the room's X span.
            if (room.hasPassage('S')) {
                const pw = this.rng.nextInt(PASS_MIN, PASS_MAX);
                const wallStartY = oy + ROOM_SIZE;
                const passStartX = ox + Math.floor((ROOM_SIZE - pw) / 2);
                for (let wy = 0; wy < WALL_SIZE; wy++) {
                    for (let i = 0; i < pw; i++) {
                        this.setCellValue(passStartX + i, wallStartY + wy, PRIM_CELL_FLOOR);
                    }
                }
            }

            // N and W passages are the mirror of S and E from adjacent rooms;
            // they are already carved when those rooms are processed.
        });
    }

    // ── Step 4: Cellular-automaton pass ───────────────────────────────────────

    /**
     * For every floor cell: if ≥ 5 of its 8 neighbours are solid (or out of
     * bounds), flip it to solid with 50 % probability.
     * Out-of-bounds counts as solid so border rooms get rounded corners.
     */
    private _applyCellularPass(): void {
        // Snapshot the current state so we evaluate neighbours before any
        // changes from this pass take effect (no cascade within one pass).
        const snap = this.cellMap.map((row) => row.slice());
        const W = this.worldWidth;
        const H = this.worldHeight;

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                if (snap[y][x] === PRIM_CELL_WALL) continue;

                let solid = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const ny = y + dy;
                        const nx = x + dx;
                        if (
                            ny < 0 ||
                            ny >= H ||
                            nx < 0 ||
                            nx >= W ||
                            snap[ny][nx] === PRIM_CELL_WALL
                        ) {
                            solid++;
                        }
                    }
                }

                if (solid >= 5 && this.rng.nextBool(0.5)) {
                    this.setCellValue(x, y, PRIM_CELL_WALL);
                }
            }
        }
    }
}
