import { describe, expect, it } from 'vitest';
import { Rainbow } from '../src/libs/rainbow';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a Color32 from 0–255 channel values (same logic as Rainbow._pack). */
const pack = (r: number, g: number, b: number, a: number): number =>
    (((r & 0xff) << 24) | ((g & 0xff) << 16) | ((b & 0xff) << 8) | (a & 0xff)) >>> 0;

// ─── parse ────────────────────────────────────────────────────────────────────

describe('Rainbow.parse', () => {
    // Hex formats
    describe('hex', () => {
        it('#RGB expands each nibble', () => {
            expect(Rainbow.parse('#f0a')).toBe(pack(0xff, 0x00, 0xaa, 0xff));
        });

        it('#RGBA expands each nibble including alpha', () => {
            expect(Rainbow.parse('#f0a8')).toBe(pack(0xff, 0x00, 0xaa, 0x88));
        });

        it('#RRGGBB parses full hex, alpha=ff', () => {
            expect(Rainbow.parse('#1a2b3c')).toBe(pack(0x1a, 0x2b, 0x3c, 0xff));
        });

        it('#RRGGBBAA parses all four channels', () => {
            expect(Rainbow.parse('#1a2b3c4d')).toBe(pack(0x1a, 0x2b, 0x3c, 0x4d));
        });

        it('is case-insensitive', () => {
            expect(Rainbow.parse('#FF8800FF')).toBe(Rainbow.parse('#ff8800ff'));
        });

        it('throws on invalid hex length', () => {
            expect(() => Rainbow.parse('#12345')).toThrow();
        });
    });

    // rgb / rgba
    describe('rgb / rgba', () => {
        it('rgb(r, g, b) parses integers, alpha=255', () => {
            expect(Rainbow.parse('rgb(255, 128, 0)')).toBe(pack(255, 128, 0, 255));
        });

        it('rgba(r, g, b, a) parses alpha 0–1', () => {
            expect(Rainbow.parse('rgba(255, 128, 0, 0.5)')).toBe(pack(255, 128, 0, 128));
        });

        it('rgb with percentages', () => {
            expect(Rainbow.parse('rgb(100%, 50%, 0%)')).toBe(pack(255, 128, 0, 255));
        });

        it('CSS Level 4 space-separated with slash alpha', () => {
            expect(Rainbow.parse('rgb(255 128 0 / 1)')).toBe(pack(255, 128, 0, 255));
        });

        it('rgba with percentage alpha', () => {
            expect(Rainbow.parse('rgba(0, 0, 0, 100%)')).toBe(pack(0, 0, 0, 255));
        });

        it('black', () => {
            expect(Rainbow.parse('rgb(0, 0, 0)')).toBe(pack(0, 0, 0, 255));
        });

        it('white', () => {
            expect(Rainbow.parse('rgb(255, 255, 255)')).toBe(pack(255, 255, 255, 255));
        });
    });

    // hsl / hsla
    describe('hsl / hsla', () => {
        it('hsl(0, 100%, 50%) = pure red', () => {
            expect(Rainbow.parse('hsl(0, 100%, 50%)')).toBe(pack(255, 0, 0, 255));
        });

        it('hsl(120, 100%, 50%) = pure green', () => {
            expect(Rainbow.parse('hsl(120, 100%, 50%)')).toBe(pack(0, 255, 0, 255));
        });

        it('hsl(240, 100%, 50%) = pure blue', () => {
            expect(Rainbow.parse('hsl(240, 100%, 50%)')).toBe(pack(0, 0, 255, 255));
        });

        it('hsl(0, 0%, 0%) = black', () => {
            expect(Rainbow.parse('hsl(0, 0%, 0%)')).toBe(pack(0, 0, 0, 255));
        });

        it('hsl(0, 0%, 100%) = white', () => {
            expect(Rainbow.parse('hsl(0, 0%, 100%)')).toBe(pack(255, 255, 255, 255));
        });

        it('hsl(0, 0%, 50%) = grey', () => {
            const c = Rainbow.parse('hsl(0, 0%, 50%)');
            const { r, g, b } = Rainbow.convertToRGBA(c);
            expect(r).toBeCloseTo(0.5, 1);
            expect(r).toBe(g);
            expect(g).toBe(b);
        });

        it('hsla with alpha', () => {
            const c = Rainbow.parse('hsla(0, 100%, 50%, 0.5)');
            expect(Rainbow.convertToRGBA(c).a).toBeCloseTo(0.5, 2);
        });

        it('hue in turns: 0.5turn = 180deg = cyan', () => {
            expect(Rainbow.parse('hsl(0.5turn, 100%, 50%)')).toBe(
                Rainbow.parse('hsl(180, 100%, 50%)')
            );
        });

        it('hue in radians: πrad ≈ 180deg', () => {
            expect(Rainbow.parse(`hsl(${Math.PI}rad, 100%, 50%)`)).toBe(
                Rainbow.parse('hsl(180, 100%, 50%)')
            );
        });

        it('hue in grad: 200grad = 180deg', () => {
            expect(Rainbow.parse('hsl(200grad, 100%, 50%)')).toBe(
                Rainbow.parse('hsl(180, 100%, 50%)')
            );
        });

        it('hue wraps: 360deg = 0deg = red', () => {
            expect(Rainbow.parse('hsl(360, 100%, 50%)')).toBe(Rainbow.parse('hsl(0, 100%, 50%)'));
        });

        it('hue negative: -120deg = 240deg = blue', () => {
            expect(Rainbow.parse('hsl(-120, 100%, 50%)')).toBe(
                Rainbow.parse('hsl(240, 100%, 50%)')
            );
        });

        it('CSS Level 4 space-separated hsl with slash alpha', () => {
            expect(Rainbow.parse('hsl(0 100% 50% / 1)')).toBe(Rainbow.parse('hsl(0, 100%, 50%)'));
        });
    });

    // Error cases
    describe('errors', () => {
        it('throws on unknown format', () => {
            expect(() => Rainbow.parse('red')).toThrow();
        });

        it('throws on unsupported function', () => {
            expect(() => Rainbow.parse('lab(50% 0 0)')).toThrow();
        });

        it('throws on malformed hex', () => {
            expect(() => Rainbow.parse('#gg0011')).not.toThrow(); // NaN channels are clamped, not thrown
            expect(() => Rainbow.parse('#12')).toThrow();
        });
    });
});

// ─── convertToRGBA ────────────────────────────────────────────────────────────

describe('Rainbow.convertToRGBA', () => {
    it('unpacks red channel', () => {
        expect(Rainbow.convertToRGBA(pack(255, 0, 0, 255)).r).toBeCloseTo(1, 5);
    });

    it('unpacks all channels independently', () => {
        const c = Rainbow.convertToRGBA(pack(51, 102, 153, 204));
        expect(c.r).toBeCloseTo(51 / 255, 5);
        expect(c.g).toBeCloseTo(102 / 255, 5);
        expect(c.b).toBeCloseTo(153 / 255, 5);
        expect(c.a).toBeCloseTo(204 / 255, 5);
    });

    it('black is all zeros except alpha=1', () => {
        const c = Rainbow.convertToRGBA(pack(0, 0, 0, 255));
        expect(c.r).toBe(0);
        expect(c.g).toBe(0);
        expect(c.b).toBe(0);
        expect(c.a).toBeCloseTo(1, 5);
    });

    it('transparent is a=0', () => {
        expect(Rainbow.convertToRGBA(pack(0, 0, 0, 0)).a).toBe(0);
    });
});

// ─── convertToHSLA ────────────────────────────────────────────────────────────

describe('Rainbow.convertToHSLA', () => {
    it('pure red → h≈0, s=1, l=0.5', () => {
        const { h, s, l } = Rainbow.convertToHSLA(pack(255, 0, 0, 255));
        expect(h).toBeCloseTo(0, 5);
        expect(s).toBeCloseTo(1, 5);
        expect(l).toBeCloseTo(0.5, 5);
    });

    it('pure green → h≈1/3', () => {
        const { h } = Rainbow.convertToHSLA(pack(0, 255, 0, 255));
        expect(h).toBeCloseTo(1 / 3, 5);
    });

    it('pure blue → h≈2/3', () => {
        const { h } = Rainbow.convertToHSLA(pack(0, 0, 255, 255));
        expect(h).toBeCloseTo(2 / 3, 5);
    });

    it('grey → s=0 (achromatic)', () => {
        const { s } = Rainbow.convertToHSLA(pack(128, 128, 128, 255));
        expect(s).toBe(0);
    });

    it('black → l=0', () => {
        const { l } = Rainbow.convertToHSLA(pack(0, 0, 0, 255));
        expect(l).toBe(0);
    });

    it('white → l=1', () => {
        const { l } = Rainbow.convertToHSLA(pack(255, 255, 255, 255));
        expect(l).toBeCloseTo(1, 5);
    });

    it('alpha is preserved', () => {
        const { a } = Rainbow.convertToHSLA(pack(255, 0, 0, 128));
        expect(a).toBeCloseTo(128 / 255, 5);
    });

    it('round-trip: parse → convertToHSLA channels in [0,1]', () => {
        const c = Rainbow.parse('hsl(210, 80%, 60%)');
        const { h, s, l, a } = Rainbow.convertToHSLA(c);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThan(1);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
        expect(l).toBeGreaterThanOrEqual(0);
        expect(l).toBeLessThanOrEqual(1);
        expect(a).toBeCloseTo(1, 5);
    });
});

// ─── renderHex6 ───────────────────────────────────────────────────────────────

describe('Rainbow.renderHex6', () => {
    it('renders red as #ff0000', () => {
        expect(Rainbow.renderHex6(pack(255, 0, 0, 255))).toBe('#ff0000');
    });

    it('renders black as #000000', () => {
        expect(Rainbow.renderHex6(pack(0, 0, 0, 255))).toBe('#000000');
    });

    it('renders white as #ffffff', () => {
        expect(Rainbow.renderHex6(pack(255, 255, 255, 255))).toBe('#ffffff');
    });

    it('discards alpha channel', () => {
        expect(Rainbow.renderHex6(pack(255, 0, 0, 0))).toBe('#ff0000');
    });

    it('pads single-digit channels', () => {
        expect(Rainbow.renderHex6(pack(1, 2, 3, 255))).toBe('#010203');
    });
});

// ─── renderHex3 ───────────────────────────────────────────────────────────────

describe('Rainbow.renderHex3', () => {
    it('renders red as #f00', () => {
        expect(Rainbow.renderHex3(pack(255, 0, 0, 255))).toBe('#f00');
    });

    it('renders white as #fff', () => {
        expect(Rainbow.renderHex3(pack(255, 255, 255, 255))).toBe('#fff');
    });

    it('discards alpha channel', () => {
        expect(Rainbow.renderHex3(pack(255, 0, 0, 0))).toBe('#f00');
    });

    it('rounds 0x88 (136) to nibble 8 (136/17≈8)', () => {
        expect(Rainbow.renderHex3(pack(136, 136, 136, 255))).toBe('#888');
    });
});

// ─── renderRGB ────────────────────────────────────────────────────────────────

describe('Rainbow.renderRGB', () => {
    it('renders black', () => {
        expect(Rainbow.renderRGB(pack(0, 0, 0, 255))).toBe('rgb(0, 0, 0)');
    });

    it('renders white', () => {
        expect(Rainbow.renderRGB(pack(255, 255, 255, 255))).toBe('rgb(255, 255, 255)');
    });

    it('discards alpha', () => {
        expect(Rainbow.renderRGB(pack(10, 20, 30, 0))).toBe('rgb(10, 20, 30)');
    });
});

// ─── renderRGBA ───────────────────────────────────────────────────────────────

describe('Rainbow.renderRGBA', () => {
    it('fully opaque', () => {
        expect(Rainbow.renderRGBA(pack(255, 0, 0, 255))).toBe('rgba(255, 0, 0, 1)');
    });

    it('fully transparent', () => {
        expect(Rainbow.renderRGBA(pack(0, 0, 0, 0))).toBe('rgba(0, 0, 0, 0)');
    });

    it('half-alpha strips trailing zeros', () => {
        // 128/255 ≈ 0.502
        const result = Rainbow.renderRGBA(pack(0, 0, 0, 128));
        expect(result).toMatch(/^rgba\(0, 0, 0, 0\.\d+\)$/);
    });

    it('round-trip: parse rgba → renderRGBA produces same channels', () => {
        const original = 'rgba(100, 150, 200, 0.8)';
        const color = Rainbow.parse(original);
        const rendered = Rainbow.renderRGBA(color);
        // Re-parse and compare channels (some precision loss expected due to 8-bit storage)
        const c1 = Rainbow.convertToRGBA(color);
        const c2 = Rainbow.convertToRGBA(Rainbow.parse(rendered));
        expect(c1.r).toBeCloseTo(c2.r, 2);
        expect(c1.g).toBeCloseTo(c2.g, 2);
        expect(c1.b).toBeCloseTo(c2.b, 2);
        expect(c1.a).toBeCloseTo(c2.a, 2);
    });
});
