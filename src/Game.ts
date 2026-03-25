import { Level01 } from './scenes/Level01';

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
            scale: {
                // Logical resolution — always the same tile count on screen.
                // The canvas is CSS-scaled to fill the browser window while
                // preserving this 960×608 aspect ratio (letterbox / pillarbox).
                width: 1280,
                height: 768,
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                parent: 'game-container',
            },
            backgroundColor: '#07090f',
            antialias: false, // pixel-perfect
            pixelArt: true,
            roundPixels: true,
            scene: [Level01],
        });
    }
}
