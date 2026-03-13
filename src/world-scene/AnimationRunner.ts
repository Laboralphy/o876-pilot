export type AnimationDefinition = {
    key: string;
    frames: number[]; // list of frames involved
    duration: number; // duration of the whole animation in ms
    repeat: number; // number of times the animation should be played; infinity if -1
    yoyo: boolean; // whether the animation should be played in reverse at the end
};

export class AnimationRunner {
    private readonly frames: number[] = [];
    private index: number = 0;
    private readonly frameDuration: number = 0;
    private deltaAccumulator: number = 0;
    private readonly yoyo: boolean = false;
    private repeat: number = Infinity;
    private isPaused: boolean = false;
    private isFinished: boolean = false;
    private indexSign = 1;

    constructor(ad: AnimationDefinition) {
        this.frames = ad.frames;
        this.frameDuration = ad.duration / this.frames.length;
        this.yoyo = ad.yoyo;
        this.repeat = ad.repeat === -1 ? Infinity : ad.repeat;
    }

    backward() {
        this.indexSign = -1;
        this.index = this.frames.length - 1;
    }

    forward() {
        this.indexSign = 1;
        this.index = 0;
    }

    get isAnimated(): boolean {
        return !this.isFinished && !this.isPaused;
    }

    private updateRepeat() {
        if (this.repeat === Infinity) return;

        --this.repeat;
        if (this.repeat <= 0) {
            this.isFinished = true;
        }
    }

    private updateYoyo() {
        if (this.index >= this.frames.length - 1) {
            this.backward(); // demi-tour, pas de repeat
        } else if (this.index <= 0) {
            this.updateRepeat(); // cycle complet → repeat
            if (this.isAnimated) {
                this.forward();
            }
        }
    }

    private updateLinear() {
        if (this.index >= this.frames.length) {
            this.updateRepeat();
            if (this.isAnimated) {
                this.forward();
            } else {
                this.index = this.frames.length - 1;
            }
        }
    }

    update(delta: number): void {
        if (!this.isAnimated) return;

        this.deltaAccumulator += delta;
        while (this.deltaAccumulator >= this.frameDuration && this.isAnimated) {
            this.deltaAccumulator -= this.frameDuration;
            this.index += this.indexSign;
            if (this.yoyo) {
                this.updateYoyo();
            } else {
                this.updateLinear();
            }
        }
    }

    get frame(): number {
        return this.frames[this.index];
    }

    pause(): void {
        this.isPaused = true;
    }

    resume(): void {
        this.isPaused = false;
    }

    reset(): void {
        this.isPaused = false;
        this.isFinished = false;
        this.index = 0;
        this.deltaAccumulator = 0;
    }
}
