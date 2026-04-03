import { WordGenerator } from '../WorldGenerator';
import type { ISeededRNG } from '../../libs/mulberry32/ISeededRNG';
import { Direction, PrimLabyrinth } from '../../libs/prim';
import { IDaedalus } from '../../libs/daedalus';
import { NumberGrid } from '../../libs/grid/NumberGrid';
import { line } from '../../libs/bresenham';
import { PatternMapRefiner } from '../../libs/pattern-map-refiner/PatternMapRefiner';

// ─── Cell values ─────────────────────────────────────────────────────────────

export const PRIM_CELL_FLOOR = 0;
export const PRIM_CELL_SOLID_DEPTH_0 = 1;
export const PRIM_CELL_SOLID_DEPTH_1 = 2;
export const PRIM_CELL_SOLID_DEPTH_2 = 3;
export const PRIM_CELL_FLAT_GROUND = 4;
export const PRIM_CELL_FLAT_GROUND_ROUNDED_LEFT = 5;
export const PRIM_CELL_FLAT_GROUND_ROUNDED_RIGHT = 6;
export const PRIM_CELL_FLAT_GROUND_ROUNDED_BOTH = 7;

// ─── Room passage attribute keys ─────────────────────────────────────────────
// Stored on the room that owns the passage (E or S direction).
// N/W metrics are read from the adjacent room's E/S attributes.

export const ATTR_PASS_E_WIDTH = 'pass.e.width';
export const ATTR_PASS_E_OFFSET = 'pass.e.offset';
export const ATTR_PASS_S_WIDTH = 'pass.s.width';
export const ATTR_PASS_S_OFFSET = 'pass.s.offset';
export const ATTR_ROCK_DENSITY = 'rock.density';

// ─── Internal helpers ────────────────────────────────────────────────────────

/** Normalised distance from the labyrinth centre; 1 = exact centre, 0 = corner. */
function centrality(rx: number, ry: number, labW: number, labH: number): number {
    const cx = (labW - 1) / 2;
    const cy = (labH - 1) / 2;
    const maxDist = Math.hypot(cx, cy);
    if (maxDist === 0) {
        return 1;
    }
    return 1 - Math.hypot(rx - cx, ry - cy) / maxDist;
}

// ─── PrimMazeWG ──────────────────────────────────────────────────────────────

/**
 * World generator that builds a Prim-style labyrinth.
 *
 * Grid layout
 * -----------
 * Each logical room occupies a (roomWidth × roomHeight) tile block where
 * roomWidth/roomHeight are the strides. The last column (x = rw-1) and last
 * row (y = rh-1) of each block are the shared E and S walls. Interior is
 * (rw-1) × (rh-1) tiles.
 *
 *   ┌──────────────────┬─┐
 *   │  interior        │E│  rw columns  (interior + 1 E-wall)
 *   │  (rw-1)×(rh-1)   │w│
 *   ├──────────────────┼─┤
 *   │  S wall row      │ │  rh rows     (interior + 1 S-wall)
 *   └──────────────────┴─┘
 *
 * Room carving
 * ------------
 * Each room is rendered into its own NumberGrid. Bresenham lines are drawn
 * from every cell of a 5×5 block centred on the room interior to every cell
 * of every open passage entrance, producing organic, corridor-like rooms.
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
    private readonly maze: PrimLabyrinth;
    private readonly roomWidth: number;
    private readonly roomHeight: number;

    constructor(rng: ISeededRNG, width: number, height: number) {
        const rh = rng.nextInt(13, 19);
        const rw = rh + rng.nextInt(5, 9);
        const roomsX = Math.max(1, Math.floor((width - 1) / rw));
        const roomsY = Math.max(1, Math.floor((height - 1) / rh));
        super(roomsX * rw + 1, roomsY * rh + 1);
        this.roomHeight = rh;
        this.roomWidth = rw;
        this.rng = rng;
        this.roomsX = roomsX;
        this.roomsY = roomsY;
        this.maze = new PrimLabyrinth(roomsX, roomsY, rng);
    }

    // ── Public interface ──────────────────────────────────────────────────────

    generate(): number[][] {
        // 1. Perfect maze via Prim's algorithm
        this.maze.generate();

        // 2. Braid the centre: open extra loops proportional to centrality²
        this._openCenterPassages(this.maze);

        // 3. Pick width and offset for every open passage
        this._choosePassageMetrics(this.maze);

        // 4. Paint everything solid, then stamp each room
        this.walkCells(() => PRIM_CELL_SOLID_DEPTH_0);
        this._renderEachRoom();

        // 5. Walls fully surrounded by walls → depth-1 wall
        this._markDepthWalls();

        // 6. Refine the map
        this._refineMap();

        return this.cellMap;
    }

    // ── Step 5: Depth classification ─────────────────────────────────────────

    /**
     * Two erosion passes to classify wall depth:
     *   DEPTH_1 — WALL with no floor neighbour (1+ cells from any floor)
     *   DEPTH_2 — DEPTH_1 with no plain WALL neighbour (2+ cells from any floor)
     */
    private _markDepthWalls(): void {
        // Pass 1: WALL cells with no floor neighbour → DEPTH_1
        this.walkCells((x, y, value) => {
            if (value !== PRIM_CELL_SOLID_DEPTH_0) {
                return value;
            }
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) {
                        continue;
                    }
                    const v = this.getCellValue(x + dx, y + dy);
                    if (v === PRIM_CELL_FLOOR) {
                        return value;
                    }
                }
            }
            return PRIM_CELL_SOLID_DEPTH_1;
        });

        // Pass 2: DEPTH_1 cells with no plain WALL neighbour → DEPTH_2
        this.walkCells((x, y, value) => {
            if (value !== PRIM_CELL_SOLID_DEPTH_1) {
                return value;
            }
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) {
                        continue;
                    }
                    const v = this.getCellValue(x + dx, y + dy);
                    if (v === PRIM_CELL_SOLID_DEPTH_0) {
                        return value;
                    }
                }
            }
            return PRIM_CELL_SOLID_DEPTH_2;
        });
    }

    // ── Step 2: Centre braiding ───────────────────────────────────────────────

    private _openCenterPassages(lab: IDaedalus): void {
        const { width: labW, height: labH } = lab;

        lab.forEach((room, rx, ry) => {
            const wallCandidates: Array<{ dir: Direction; nx: number; ny: number }> = [
                { dir: 'E', nx: rx + 1, ny: ry },
                { dir: 'S', nx: rx, ny: ry + 1 },
            ];

            for (const { dir, nx, ny } of wallCandidates) {
                if (nx >= labW || ny >= labH) {
                    continue;
                }
                if (room.hasPassage(dir)) {
                    continue;
                }

                const c = (centrality(rx, ry, labW, labH) + centrality(nx, ny, labW, labH)) / 2;
                if (this.rng.nextBool(c * c)) {
                    lab.openPassage(rx, ry, dir);
                }
            }
        });
    }

    // ── Step 3: Passage metrics ───────────────────────────────────────────────

    /**
     * For every open E or S passage, randomly choose a width in [PASS_MIN,
     * PASS_MAX] and an offset along the shared wall. Stored as Room attributes:
     *
     *   E passage → ATTR_PASS_E_WIDTH, ATTR_PASS_E_OFFSET  (offset along Y)
     *   S passage → ATTR_PASS_S_WIDTH, ATTR_PASS_S_OFFSET  (offset along X)
     */
    private _choosePassageMetrics(lab: IDaedalus): void {
        lab.forEach((room) => {
            if (room.hasPassage('E')) {
                const width = this.rng.nextInt(3, this.roomHeight >> 1);
                const offset = this.rng.nextInt(0, this.roomHeight - width - 1);
                room.set(ATTR_PASS_E_WIDTH, width);
                room.set(ATTR_PASS_E_OFFSET, offset);
            }

            if (room.hasPassage('S')) {
                const width = this.rng.nextInt(3, this.roomWidth >> 1);
                const offset = this.rng.nextInt(0, this.roomWidth - width - 1);
                room.set(ATTR_PASS_S_WIDTH, width);
                room.set(ATTR_PASS_S_OFFSET, offset);
            }

            room.set(ATTR_ROCK_DENSITY, this.rng.nextFloat(0.75, 0.95));
        });
    }

    // ── Step 4: Room rendering ────────────────────────────────────────────────

    /**
     * For each room, build a dedicated NumberGrid (rw × rh), then draw
     * Bresenham lines from every cell of a 5×5 block centred on the interior
     * to every cell of every open passage entrance. The result is stamped into
     * the main cell map with copyArea.
     *
     * Passage geometry
     * ----------------
     *   E slot  x = rw-1, y ∈ [offset, offset+width-1]  — inside local grid ✓
     *   S slot  y = rh-1, x ∈ [offset, offset+width-1]  — inside local grid ✓
     *   N entry y = 0,    x ∈ [offset, offset+width-1]  — metrics from north neighbour
     *   W entry x = 0,    y ∈ [offset, offset+width-1]  — metrics from west  neighbour
     *
     * N/W passage slots live in the adjacent room's grid; we target the
     * interior boundary (y=0 / x=0) and the adjacent room carves the wall slot.
     * adjacentRooms is used first; roomAt() serves as fallback for passages
     * created by PrimLabyrinth.generate() which bypasses openPassage().
     */
    private _renderEachRoom(): void {
        const rw = this.roomWidth;
        const rh = this.roomHeight;
        // Centre of the room interior in local coordinates

        this.maze.forEach((room, rx, ry) => {
            const ox = 1 + rx * rw;
            const oy = 1 + ry * rh;

            const grid = new NumberGrid(rw, rh);
            grid.walkCells(() => PRIM_CELL_SOLID_DEPTH_0);

            // ── Collect passage target cells (local coords) ───────────────────

            const targets: Array<{ x: number; y: number }> = [];

            // E: slot in rightmost column, inside local grid
            if (room.hasPassage('E')) {
                const width = room.get<number>(ATTR_PASS_E_WIDTH) ?? 0;
                const offset = room.get<number>(ATTR_PASS_E_OFFSET) ?? 0;
                for (let i = 0; i < width; i++) {
                    targets.push({ x: rw - 1, y: offset + i });
                }
            }

            // S: slot in bottom row, inside local grid
            if (room.hasPassage('S')) {
                const width = room.get<number>(ATTR_PASS_S_WIDTH) ?? 0;
                const offset = room.get<number>(ATTR_PASS_S_OFFSET) ?? 0;
                for (let i = 0; i < width; i++) {
                    targets.push({ x: offset + i, y: rh - 1 });
                }
            }

            // N: slot belongs to north neighbour — target interior top edge (y=0)
            if (room.hasPassage('N')) {
                const northRoom = room.adjacentRooms.get('N') ?? this.maze.roomAt(rx, ry - 1);
                if (northRoom) {
                    const width: number = northRoom.get(ATTR_PASS_S_WIDTH) ?? 0;
                    const offset: number = northRoom.get(ATTR_PASS_S_OFFSET) ?? 0;
                    for (let i = 0; i < width; i++) {
                        targets.push({ x: offset + i, y: 0 });
                    }
                }
            }

            // W: slot belongs to west neighbour — target interior left edge (x=0)
            if (room.hasPassage('W')) {
                const westRoom = room.adjacentRooms.get('W') ?? this.maze.roomAt(rx - 1, ry);
                if (westRoom) {
                    const width = westRoom.get<number>(ATTR_PASS_E_WIDTH) ?? 0;
                    const offset = westRoom.get<number>(ATTR_PASS_E_OFFSET) ?? 0;
                    for (let i = 0; i < width; i++) {
                        targets.push({ x: 0, y: offset + i });
                    }
                }
            }

            // ── Bresenham lines from 5×5 centre block to every target cell ────

            const radius = this.rng.nextFloat(1.5, Math.min(rw, rh) / 2 - 1.5);
            const xCenter = Math.floor(this.roomWidth / 2);
            const yCenter = Math.floor(this.roomHeight / 2);

            for (let bdy = 0; bdy <= this.roomHeight; bdy++) {
                for (let bdx = 0; bdx <= this.roomWidth; bdx++) {
                    if (Math.hypot(Math.abs(bdx - xCenter), Math.abs(bdy - yCenter)) < radius) {
                        for (const { x: tx, y: ty } of targets) {
                            line(bdx, bdy, tx, ty, (x, y) => {
                                if (x >= 0 && x < rw && y >= 0 && y < rh) {
                                    grid.setCellValue(x, y, PRIM_CELL_FLOOR);
                                }
                            });
                        }
                    }
                }
            }

            // ── Stamp into the main cell map ──────────────────────────────────
            this.copyArea(grid, 0, 0, rw, rh, ox, oy);
        });
    }

    private _refineMap(): void {
        const pmr = new PatternMapRefiner(
            {
                '.': [PRIM_CELL_FLOOR],
                '#': [PRIM_CELL_SOLID_DEPTH_0, PRIM_CELL_SOLID_DEPTH_1, PRIM_CELL_SOLID_DEPTH_2],
                _: [PRIM_CELL_FLAT_GROUND],
                L: [PRIM_CELL_FLAT_GROUND_ROUNDED_LEFT],
                R: [PRIM_CELL_FLAT_GROUND_ROUNDED_RIGHT],
                B: [PRIM_CELL_FLAT_GROUND_ROUNDED_BOTH],
            },
            this
        );
        pmr.replaceAllPatterns(
            new Map([
                // peaks
                [
                    ['...', '.#.'],
                    ['...', '.B.'],
                ],
                // 2-block platforms
                [
                    ['....', '.##.'],
                    ['....', '.LR.'],
                ],
                // left corners
                [
                    ['..?', '.##'],
                    ['..?', '.L?'],
                ],
                // right corners
                [
                    ['?..', '##.'],
                    ['?..', '?R.'],
                ],
                // flat ground
                [
                    ['.', '#'],
                    ['.', '_'],
                ],
            ])
        );
    }
}
