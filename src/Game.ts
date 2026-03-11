import { Level01 } from './world-scene/Level01';

export class Game extends Phaser.Game {
    constructor() {
        super({
            type: Phaser.WEBGL, // WebGL → accélération GPU
            fps: {
                target: 60, // fréquence cible (rendu)
                forceSetTimeOut: false, // true → utilise setTimeout au lieu de rAF
                smoothStep: true, // lisse les variations de delta
                panicMax: 120, // si delta dépasse ce seuil → on le plafonne
                min: 10, // FPS minimum avant panic
            },
            width: 960,
            height: 608,
            parent: 'game-container',
            backgroundColor: '#07090f',
            antialias: false, // pixel-perfect
            pixelArt: true,
            roundPixels: true,
            scene: [Level01],
        });
    }
}
