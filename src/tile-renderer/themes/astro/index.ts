import { TileDefinition } from './tile-definition';
import { drawSpreadStars } from './draw-spread-stars';
import { drawNebula } from './draw-nebula';
import { drawCrackedBlock } from './draw-cracked-block';
import { drawAsteroid } from './draw-asteroid';
import { drawGoldCrystal } from './draw-gold-crystal';
import { drawSpaceAnomaly } from './draw-space-anomaly';
import { TileRenderer } from '../../TileRenderer';
import { TILES } from './tiles';

export class AstroTileRenderer extends TileRenderer<TileDefinition> {
    constructor() {
        super(TILES, 64, {
            drawSpreadStars,
            drawNebula,
            drawCrackedBlock,
            drawAsteroid,
            drawGoldCrystal,
            drawSpaceAnomaly,
        });
    }
}
