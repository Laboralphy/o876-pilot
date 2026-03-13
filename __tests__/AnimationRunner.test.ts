import { describe, expect, it } from 'vitest';
import { AnimationDefinition, AnimationRunner } from '../src/world-scene/AnimationRunner';

// ─── Helpers ────────────────────────────────────────────────────────────────

const tick = (runner: AnimationRunner, delta: number, times = 1) => {
    for (let i = 0; i < times; i++) runner.update(delta);
};

const makeRunner = (partial: Partial<AnimationDefinition> = {}) =>
    new AnimationRunner({
        frames: [10, 11, 12, 13],
        duration: 400, // 100ms par frame
        repeat: Infinity,
        yoyo: false,
        ...partial,
    });

// ─── Construction ────────────────────────────────────────────────────────────

describe('constructor', () => {
    it('démarre sur la première frame', () => {
        expect(makeRunner().frame).toBe(10);
    });

    it('calcule correctement frameDuration (duration / frames.length)', () => {
        // 400ms / 4 frames = 100ms/frame
        // après 100ms exactement → frame suivante
        const runner = makeRunner();
        tick(runner, 100);
        expect(runner.frame).toBe(11);
    });

    it('convertit repeat=-1 en Infinity', () => {
        const runner = makeRunner({ repeat: -1 });
        // tourne indéfiniment, ne se termine jamais
        tick(runner, 100, 1000);
        expect(runner.isAnimated).toBe(true);
    });
});

// ─── Progression linéaire ─────────────────────────────────────────────────

describe('update — linéaire', () => {
    it("avance d'une frame par frameDuration exacte", () => {
        const runner = makeRunner();
        tick(runner, 100);
        expect(runner.frame).toBe(11);
        tick(runner, 100);
        expect(runner.frame).toBe(12);
        tick(runner, 100);
        expect(runner.frame).toBe(13);
    });

    it('boucle sur la première frame après la dernière (repeat infini)', () => {
        const runner = makeRunner();
        tick(runner, 100, 4);
        expect(runner.frame).toBe(10);
    });

    it('gère un delta supérieur à plusieurs frameDuration', () => {
        const runner = makeRunner();
        tick(runner, 250); // 2.5 frames → index 2
        expect(runner.frame).toBe(12);
    });

    it("n'avance pas si delta insuffisant", () => {
        const runner = makeRunner();
        tick(runner, 50);
        expect(runner.frame).toBe(10);
    });

    it('accumule correctement les deltas partiels', () => {
        const runner = makeRunner();
        tick(runner, 60);
        tick(runner, 60); // total 120ms → 1 frame avancée
        expect(runner.frame).toBe(11);
    });
});

// ─── Repeat ──────────────────────────────────────────────────────────────────

describe('repeat', () => {
    it('se termine après repeat=1 (un seul cycle)', () => {
        const runner = makeRunner({ repeat: 1 });
        tick(runner, 100, 4); // cycle complet
        expect(runner.isAnimated).toBe(false);
    });

    it('joue exactement N cycles avant de se terminer', () => {
        const runner = makeRunner({ repeat: 3 });
        // 3 cycles × 4 frames × 100ms = 1200ms
        tick(runner, 100, 11); // 11 frames → encore animé
        expect(runner.isAnimated).toBe(true);
        tick(runner, 100); // 12e frame → terminé
        expect(runner.isAnimated).toBe(false);
    });

    it('reste sur la dernière frame quand terminé (linéaire)', () => {
        const runner = makeRunner({ repeat: 1 });
        tick(runner, 100, 10);
        expect(runner.frame).toBe(13);
    });

    it('ne bouge plus après isFinished', () => {
        const runner = makeRunner({ repeat: 1 });
        tick(runner, 100, 4);
        const frameBefore = runner.frame;
        tick(runner, 100, 10);
        expect(runner.frame).toBe(frameBefore);
    });
});

// ─── Yoyo ────────────────────────────────────────────────────────────────────

describe('yoyo', () => {
    it('repart en arrière après la dernière frame', () => {
        const runner = makeRunner({ yoyo: true });
        tick(runner, 100, 3); // → frame index 3 (valeur 13)
        expect(runner.frame).toBe(13);
        tick(runner, 100); // demi-tour → index 2 (valeur 12)
        expect(runner.frame).toBe(12);
    });

    it('repasse par toutes les frames en sens inverse', () => {
        const runner = makeRunner({ yoyo: true });
        // aller : 10 11 12 13, retour : 12 11 10
        const sequence: number[] = [];
        for (let i = 0; i < 7; i++) {
            tick(runner, 100);
            sequence.push(runner.frame);
        }
        expect(sequence).toEqual([11, 12, 13, 12, 11, 10, 11]);
    });

    it("ne décrémente repeat qu'au retour complet (index 0)", () => {
        const runner = makeRunner({ yoyo: true, repeat: 2 });
        // un cycle yoyo = aller + retour = 7 frames (index 0→3→0)
        // après 6 ticks (retour à 0) → repeat passe à 1
        tick(runner, 100, 6);
        expect(runner.isAnimated).toBe(true);
        // après 7 ticks (2e cycle complet) → terminé
        tick(runner, 100, 7);
        expect(runner.isAnimated).toBe(false);
    });

    it('reste sur frame 0 quand terminé (yoyo)', () => {
        const runner = makeRunner({ yoyo: true, repeat: 1 });
        tick(runner, 100, 20);
        expect(runner.frame).toBe(10);
    });
});

// ─── isAnimated / pause ──────────────────────────────────────────────────────

describe('isAnimated', () => {
    it('est true au démarrage', () => {
        expect(makeRunner().isAnimated).toBe(true);
    });

    it('est false quand isFinished', () => {
        const runner = makeRunner({ repeat: 1 });
        tick(runner, 100, 4);
        expect(runner.isAnimated).toBe(false);
    });

    it("ne s'update plus quand !isAnimated", () => {
        const runner = makeRunner({ repeat: 1 });
        tick(runner, 100, 4); // fini
        const frame = runner.frame;
        tick(runner, 100, 5);
        expect(runner.frame).toBe(frame);
    });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe('edge cases', () => {
    it('fonctionne avec une seule frame', () => {
        const runner = new AnimationRunner({
            frames: [42],
            duration: 200,
            repeat: -1,
            yoyo: false,
        });
        tick(runner, 500);
        expect(runner.frame).toBe(42);
    });

    it('fonctionne avec deux frames en yoyo', () => {
        const runner = new AnimationRunner({
            frames: [0, 1],
            duration: 200,
            repeat: -1,
            yoyo: true,
        });
        tick(runner, 100);
        expect(runner.frame).toBe(1);
        tick(runner, 100);
        expect(runner.frame).toBe(0);
        tick(runner, 100);
        expect(runner.frame).toBe(1);
    });

    it('delta=0 ne change pas la frame', () => {
        const runner = makeRunner();
        tick(runner, 0, 100);
        expect(runner.frame).toBe(10);
    });

    it('très grand delta ne sort pas du tableau', () => {
        const runner = makeRunner();
        tick(runner, 999999);
        const idx = runner.frame;
        expect([10, 11, 12, 13]).toContain(idx);
    });
});
