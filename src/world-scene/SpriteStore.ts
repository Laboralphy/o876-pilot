import { IControlState } from './IControlState';
import { IPhysicsReader } from './IPhysicsReader';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEvents = Record<string, any>;
type Listener<T> = (payload: T) => void;

/** Callback given to wireHorde — forward an event to the horde's bus. */
export type HordeEmitter = (event: string, store: SpriteStore, payload: unknown) => void;

export abstract class SpriteStore<TEvents extends AnyEvents = AnyEvents> {
    x: number = 0;
    y: number = 0;
    angle: number = 0;
    scale: number = 1;
    alpha: number = 1;
    frame: number = 0;
    controllable: boolean = false;

    private readonly _listeners: Partial<{
        [K in keyof TEvents]: Listener<TEvents[K]>[];
    }> = {};

    protected constructor(
        public readonly id: string,
        public readonly textureKey: string
    ) {}

    on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this {
        (this._listeners[event] ??= []).push(listener);
        return this;
    }

    off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this {
        const list = this._listeners[event];
        if (list) {
            this._listeners[event] = list.filter((l) => l !== listener) as Listener<TEvents[K]>[];
        }
        return this;
    }

    /**
     *
     * @param event
     * @param payload
     * @protected
     */
    protected emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
        this._listeners[event]?.forEach((l) => l(payload));
    }

    /**
     * Called by SpriteHorde when this store is added.
     * Override to forward your events onto the horde bus via `emit`.
     * Return a cleanup function that unsubscribes those forwarding listeners;
     * SpriteHorde will call it when the store is removed.
     */
    wireHorde(_emit: HordeEmitter): (() => void) | void {
        // default: no events forwarded
    }

    abstract update(control: IControlState, physics: IPhysicsReader): void;
}
