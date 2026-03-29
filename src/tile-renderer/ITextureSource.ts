export interface ITextureSource {
    getSourceImage(key: string): HTMLImageElement | HTMLCanvasElement;
    exists(key: string): boolean;
}
