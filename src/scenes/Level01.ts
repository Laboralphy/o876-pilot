import { WorldScene } from '../world-scene/WorldScene';
import DATA from '../data/levels/level-01.json';
import { ShipSpriteStore } from './ShipSpriteStore';
import Phaser from 'phaser';

export class Level01 extends WorldScene {
    constructor() {
        super({ level: DATA });
    }

    create() {
        super.create();
        const ship = new ShipSpriteStore('ship');
        ship.x = this.worldWidth / 2 - 512;
        ship.y = this.worldHeight / 2 - 512;
        this.spriteHorde.add(ship);
        const shipSprite = this.add.sprite(ship.x, ship.y, ship.textureKey, ship.frame);
        this.spriteObjects.set(ship.id, shipSprite);
        const oSpriteLayer = this.layers.get('sprites')! as Phaser.GameObjects.Layer;
        oSpriteLayer.add(shipSprite);
        this.cameras.main.startFollow(shipSprite);
    }
}
