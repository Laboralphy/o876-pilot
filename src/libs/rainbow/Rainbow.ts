import type { Color32, ColorRGBAStruct, ColorHSLAStruct } from './types';
import { HTML_COLORS } from './html-colors';

export { Color32, ColorRGBAStruct, ColorHSLAStruct };

/**
 * Static utility class for color manipulation.
 *
 * Supported representations
 * ─────────────────────────
 *  Color32         — packed 32-bit integer 0xRRGGBBAA, channels 0–255
 *  ColorRGBAStruct — { r, g, b, a } each in [0, 1]
 *  ColorHSLAStruct — { h, s, l, a } each in [0, 1]
 */
export class Rainbow {
    private constructor() {
        // static-only — not instantiable
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Parse a CSS color string into a packed Color32 (0xRRGGBBAA).
     *
     * Supported formats
     * -----------------
     *   #RGB  #RGBA  #RRGGBB  #RRGGBBAA
     *   rgb(r, g, b)          rgba(r, g, b, a)
     *   rgb(r g b / a)                           ← CSS Level 4
     *   hsl(h, s%, l%)        hsla(h, s%, l%, a)
     *   hsl(h s% l% / a)                         ← CSS Level 4
     *
     * Channel notes
     * -------------
     *   rgb  — r/g/b are 0–255 integers or percentages ("50%")
     *   rgba — alpha is 0–1 float (or percentage)
     *   hsl  — h is degrees (no unit or "deg"), "turn", "rad", or "grad"
     *           s/l are percentages; alpha is 0–1 float (or percentage)
     *
     * Named colours ("red", "lime", "cornflowerblue", …) — all 148 CSS named colours.
     *
     * @throws if the string cannot be parsed.
     */
    static parse(css: string): Color32 {
        const s = css.trim();

        if (s.startsWith('#')) {
            return Rainbow._fromHex(s);
        }

        const named = HTML_COLORS[s.toLowerCase()];
        if (named !== undefined) {
            return named;
        }

        const fn = s.match(/^([a-z]+)\s*\(([^)]*)\)$/i);
        if (!fn) {
            throw new Error(`Rainbow.parse: unrecognised format "${css}"`);
        }
        const [, name, args] = fn;
        switch (name.toLowerCase()) {
            case 'rgb':
            case 'rgba':
                return Rainbow._fromRgb(args);
            case 'hsl':
            case 'hsla':
                return Rainbow._fromHsl(args);
            default:
                throw new Error(`Rainbow.parse: unsupported function "${name}(…)"`);
        }
    }

    /**
     * Unpack a Color32 (0xRRGGBBAA) into a ColorRGBAStruct with channels in [0, 1].
     */
    static convertToRGBA(color: Color32): ColorRGBAStruct {
        return {
            r: ((color >>> 24) & 0xff) / 255,
            g: ((color >>> 16) & 0xff) / 255,
            b: ((color >>> 8) & 0xff) / 255,
            a: (color & 0xff) / 255,
        };
    }

    /**
     * Convert a Color32 (0xRRGGBBAA) into a ColorHSLAStruct with channels in [0, 1].
     */
    static convertToHSLA(color: Color32): ColorHSLAStruct {
        const { r, g, b, a } = Rainbow.convertToRGBA(color);
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;

        if (max === min) {
            // Achromatic — no hue, no saturation
            return { h: 0, s: 0, l, a };
        }

        const d = max - min;
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        let h: number;
        if (max === r) {
            h = (g - b) / d + (g < b ? 6 : 0);
        } else if (max === g) {
            h = (b - r) / d + 2;
        } else {
            h = (r - g) / d + 4;
        }
        h /= 6;

        return { h, s, l, a };
    }

    /**
     * Build a Color32 palette array from a set of colour stops.
     *
     * Each stop is a [index, Color32] pair. The returned array has
     * (lastIndex + 1) entries; values between stops are linearly
     * interpolated. Stops need not be pre-sorted.
     *
     * @throws if stopColors is empty or if the first stop (lowest index) is not 0.
     */
    static createPalette(stopColors: [number, Color32][]): Color32[] {
        if (stopColors.length === 0) {
            throw new Error('Rainbow.createPalette: stopColors is empty');
        }
        const stops = [...stopColors].sort(([a], [b]) => a - b);
        if (stops[0][0] !== 0) {
            throw new Error('Rainbow.createPalette: first stop must be at index 0');
        }
        const size = stops[stops.length - 1][0] + 1;
        const palette: Color32[] = new Array(size);
        for (let s = 0; s < stops.length - 1; s++) {
            const [i0, c0] = stops[s];
            const [i1, c1] = stops[s + 1];
            for (let i = i0; i < i1; i++) {
                palette[i] = Rainbow.lerpColor(c0, c1, (i - i0) / (i1 - i0));
            }
        }
        // last stop is never written by the loop above
        palette[stops[stops.length - 1][0]] = stops[stops.length - 1][1];
        return palette;
    }

    /**
     * Interpolate across an ordered array of Color32 values.
     * t=0 returns colors[0], t=1 returns colors[colors.length-1].
     * The [0,1] range is divided into (n-1) equal segments; t selects
     * the segment and lerps between its two endpoints.
     *
     * @throws if colors is empty.
     */
    static multiLerpColor(colors: Color32[], t: number): Color32 {
        if (colors.length === 0) {
            throw new Error('Rainbow.multiLerpColor: colors array is empty');
        }
        if (colors.length === 1) {
            return colors[0];
        }
        const scaled = t * (colors.length - 1);
        const i = Math.min(Math.floor(scaled), colors.length - 2);
        return Rainbow.lerpColor(colors[i], colors[i + 1], scaled - i);
    }

    /**
     * Linearly interpolate between two Color32 values in RGBA space.
     * t=0 returns c1, t=1 returns c2.
     */
    static lerpColor(c1: Color32, c2: Color32, t: number): Color32 {
        const u = 1 - t;
        return Rainbow._pack(
            ((c1 >>> 24) & 0xff) * u + ((c2 >>> 24) & 0xff) * t,
            ((c1 >>> 16) & 0xff) * u + ((c2 >>> 16) & 0xff) * t,
            ((c1 >>> 8) & 0xff) * u + ((c2 >>> 8) & 0xff) * t,
            (c1 & 0xff) * u + (c2 & 0xff) * t
        );
    }

    /**
     * Compute the midpoint between two Color32 values in RGBA space.
     * Each channel (r, g, b, a) is averaged independently.
     */
    static getMedianColor(c1: Color32, c2: Color32): Color32 {
        return this.lerpColor(c1, c2, 0.5);
    }

    /**
     * Pack a ColorRGBAStruct (all channels [0, 1]) into a Color32 (0xRRGGBBAA).
     */
    static fromRGBA({ r, g, b, a }: ColorRGBAStruct): Color32 {
        return Rainbow._pack(r * 255, g * 255, b * 255, a * 255);
    }

    /**
     * Pack a ColorHSLAStruct (all channels [0, 1]) into a Color32 (0xRRGGBBAA).
     */
    static fromHSLA({ h, s, l, a }: ColorHSLAStruct): Color32 {
        const [r, g, b] = Rainbow._hslToRgb8(h, s, l);
        return Rainbow._pack(r, g, b, Math.round(a * 255));
    }

    /**
     * Render a Color32 as a 6-digit CSS hex string `#rrggbb`. Alpha is discarded.
     */
    static renderHex6(color: Color32): string {
        const h = (v: number) => ((color >>> v) & 0xff).toString(16).padStart(2, '0');
        return `#${h(24)}${h(16)}${h(8)}`;
    }

    /**
     * Render a Color32 as a 3-digit CSS hex string `#rgb`.
     * Each 8-bit channel is rounded to the nearest 4-bit nibble. Alpha is discarded.
     */
    static renderHex3(color: Color32): string {
        const h = (v: number) => Math.round(((color >>> v) & 0xff) / 17).toString(16);
        return `#${h(24)}${h(16)}${h(8)}`;
    }

    /**
     * Render a Color32 as a CSS `rgb(r, g, b)` string with integer channels 0–255.
     * Alpha is discarded.
     */
    static renderRGB(color: Color32): string {
        const r = (color >>> 24) & 0xff;
        const g = (color >>> 16) & 0xff;
        const b = (color >>> 8) & 0xff;
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Render a Color32 as a CSS `rgba(r, g, b, a)` string.
     * RGB channels are integers 0–255; alpha is a 0–1 float (3 decimal places max).
     */
    static renderRGBA(color: Color32): string {
        const r = (color >>> 24) & 0xff;
        const g = (color >>> 16) & 0xff;
        const b = (color >>> 8) & 0xff;
        const a = parseFloat(((color & 0xff) / 255).toFixed(3));
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Pack four 0–255 channel values into a single Color32 (0xRRGGBBAA).
     * Values are clamped and rounded automatically.
     */
    private static _pack(r: number, g: number, b: number, a: number): Color32 {
        const c = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
        return ((c(r) << 24) | (c(g) << 16) | (c(b) << 8) | c(a)) >>> 0;
    }

    /**
     * Split a CSS function's argument string into tokens.
     * Handles both comma-separated ("r, g, b") and
     * CSS Level 4 space + slash syntax ("r g b / a").
     */
    private static _splitArgs(raw: string): string[] {
        return raw
            .replace('/', ',') // treat slash as comma separator
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean);
    }

    /** Parse a percentage or plain number as a 0–255 channel value. */
    private static _ch255(s: string): number {
        return s.endsWith('%') ? (parseFloat(s) / 100) * 255 : parseFloat(s);
    }

    /** Parse a percentage or plain float as a 0–1 value. */
    private static _ch01(s: string): number {
        return s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s);
    }

    /** Parse a CSS hue token (deg / turn / rad / grad) and return a [0, 1) value. */
    private static _parseHue(s: string): number {
        let h: number;
        if (s.endsWith('turn')) {
            h = parseFloat(s);
        } else if (s.endsWith('grad')) {
            h = parseFloat(s) / 400;
        } else if (s.endsWith('rad')) {
            h = parseFloat(s) / (2 * Math.PI);
        } else {
            // "deg" suffix or bare number — both mean degrees
            h = parseFloat(s) / 360;
        }
        // Normalise to [0, 1) — handles negative values and values > 1
        return h - Math.floor(h);
    }

    // ── Hex ───────────────────────────────────────────────────────────────────

    private static _fromHex(hex: string): Color32 {
        const h = hex.slice(1); // strip '#'
        const x2 = (i: number) => parseInt(h.slice(i, i + 2), 16);
        const x1 = (i: number) => {
            const n = parseInt(h[i], 16);
            return n * 16 + n;
        };

        if (h.length === 3) return Rainbow._pack(x1(0), x1(1), x1(2), 255);
        if (h.length === 4) return Rainbow._pack(x1(0), x1(1), x1(2), x1(3));
        if (h.length === 6) return Rainbow._pack(x2(0), x2(2), x2(4), 255);
        if (h.length === 8) return Rainbow._pack(x2(0), x2(2), x2(4), x2(6));

        throw new Error(`Rainbow.parse: invalid hex color "${hex}"`);
    }

    // ── rgb / rgba ────────────────────────────────────────────────────────────

    private static _fromRgb(raw: string): Color32 {
        const p = Rainbow._splitArgs(raw);
        if (p.length < 3) throw new Error(`Rainbow.parse: malformed rgb "${raw}"`);
        const r = Rainbow._ch255(p[0]);
        const g = Rainbow._ch255(p[1]);
        const b = Rainbow._ch255(p[2]);
        const a = p.length >= 4 ? Rainbow._ch01(p[3]) * 255 : 255;
        return Rainbow._pack(r, g, b, a);
    }

    // ── hsl / hsla ────────────────────────────────────────────────────────────

    private static _fromHsl(raw: string): Color32 {
        const p = Rainbow._splitArgs(raw);
        if (p.length < 3) throw new Error(`Rainbow.parse: malformed hsl "${raw}"`);
        const h = Rainbow._parseHue(p[0]);
        const s = Rainbow._ch01(p[1]);
        const l = Rainbow._ch01(p[2]);
        const a = p.length >= 4 ? Rainbow._ch01(p[3]) : 1;
        const [r, g, b] = Rainbow._hslToRgb8(h, s, l);
        return Rainbow._pack(r, g, b, Math.round(a * 255));
    }

    /**
     * Convert HSL (all channels [0, 1]) to three 0–255 RGB integers.
     * Standard two-step algorithm via intermediate q/p values.
     */
    private static _hslToRgb8(h: number, s: number, l: number): [number, number, number] {
        if (s === 0) {
            const v = Math.round(l * 255);
            return [v, v, v]; // achromatic
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const hue2rgb = (t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        return [
            Math.round(hue2rgb(h + 1 / 3) * 255),
            Math.round(hue2rgb(h) * 255),
            Math.round(hue2rgb(h - 1 / 3) * 255),
        ];
    }
}
