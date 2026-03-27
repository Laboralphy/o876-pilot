/**
 * A packed 32-bit RGBA colour stored as a single number.
 * Bit layout: 0xRRGGBBAA  (big-endian, each channel 0–255).
 */
export type Color32 = number;

/**
 * Colour expressed as red / green / blue / alpha components.
 * Every channel is in the range [0, 1].
 */
export type ColorRGBAStruct = {
    r: number; // red   0–1
    g: number; // green 0–1
    b: number; // blue  0–1
    a: number; // alpha 0–1
};

/**
 * Colour expressed as hue / saturation / lightness / alpha.
 * Every channel is in the range [0, 1].
 */
export type ColorHSLAStruct = {
    h: number; // hue        0–1  (0 = red, 1/3 = green, 2/3 = blue, 1 = red again)
    s: number; // saturation 0–1  (0 = grey, 1 = fully saturated)
    l: number; // lightness  0–1  (0 = black, 0.5 = normal, 1 = white)
    a: number; // alpha      0–1
};
