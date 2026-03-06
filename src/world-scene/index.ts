import Phaser from 'phaser';
import { TILES } from '../data/tiles-space';
import { buildTileset } from '../draw-tiles';
import { MyWordGenerator } from '../world-generator/MyWorldGenerator';

class WorldScene extends Phaser.Scene {
    worldGenerator: MyWordGenerator;
    map: Phaser.Tilemaps.Tilemap;

    constructor() {
        super({ key: 'WorldScene' });
        this.worldGenerator = new MyWordGenerator(TILES, 200, 200);
    }

    preload() {
        const tilesetCanvas = buildTileset(TILES);
        this.textures.addCanvas('tileset', tilesetCanvas);
        this.worldGenerator.generateMapData();
    }

    _buildTilemap() {
        // Destruction propre si régénération
        if (this.map) this.map.destroy();

        // 1. Création de la Tilemap depuis le tableau 2D
        //    Phaser comprend que mapData[y][x] est l'index de tile
        this.map = this.make.tilemap({
            data: this.mapData,
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE,
        });

        // 2. Enregistrement du tileset atlas
        //    Paramètres : (nom logique, clé texture, largeur tile, hauteur tile)
        //    Phaser calcule automatiquement les UV de chaque tile :
        //    tile N → rect { x: N*64, y: 0, w: 64, h: 64 } dans la texture
        const tileset = this.map.addTilesetImage(
            'tileset', // nom logique (référencé dans les layers)
            'tileset', // clé de la texture dans le cache Phaser
            TILE_SIZE,
            TILE_SIZE,
            0, // margin (espace autour du tileset complet)
            0 // spacing (espace entre chaque tile dans l'atlas)
        );

        // 3. Création du StaticTilemapLayer
        //    → rendu WebGL ultra-optimisé en UN SEUL draw call
        //    → frustum culling automatique (seules les tiles visibles sont rendues)
        //    → les données sont uploadées en VBO GPU une seule fois
        this.layer = this.map.createLayer(
            0, // index du layer dans la map (notre map n'en a qu'un)
            tileset, // le tileset à utiliser
            0, // position x dans le monde
            0 // position y dans le monde
        );

        // 4. Définition des collisions (tiles solides)
        //    Utile pour la physique du vaisseau plus tard
        TILES.forEach((t) => {
            if (t.solid) this.map.setCollision(t.id);
        });
    }
}
