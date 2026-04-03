import { SpriteStore } from './SpriteStore';
import { IControlState } from './IControlState';
import { IPhysicsReader } from './IPhysicsReader';

export type HordeEventListener = (store: SpriteStore, payload: unknown) => void;

export class SpriteHorde {
    private readonly _stores = new Map<string, SpriteStore>();
    private readonly _controllableStores = new Set<string>();
    private readonly _wireCleanups = new Map<string, () => void>();
    private readonly _hordeListeners = new Map<string, HordeEventListener[]>();

    add(store: SpriteStore): void {
        this._stores.set(store.id, store);
        if (store.controllable) {
            this._controllableStores.add(store.id);
        }
        const cleanup = store.wireHorde((event, s, payload) => {
            this._hordeListeners.get(event)?.forEach((l) => l(s, payload));
        });
        if (cleanup) {
            this._wireCleanups.set(store.id, cleanup);
        }
    }

    remove(id: string): void {
        this._wireCleanups.get(id)?.();
        this._wireCleanups.delete(id);
        this._stores.delete(id);
        this._controllableStores.delete(id);
    }

    get(id: string): SpriteStore | undefined {
        return this._stores.get(id);
    }

    entries(): IterableIterator<SpriteStore> {
        return this._stores.values();
    }

    on(event: string, listener: HordeEventListener): this {
        if (!this._hordeListeners.has(event)) {
            this._hordeListeners.set(event, []);
        }
        this._hordeListeners.get(event)!.push(listener);
        return this;
    }

    off(event: string, listener: HordeEventListener): this {
        const list = this._hordeListeners.get(event);
        if (list) {
            this._hordeListeners.set(
                event,
                list.filter((l) => l !== listener)
            );
        }
        return this;
    }

    update(control: IControlState, physics: IPhysicsReader): void {
        for (const sn of this._controllableStores.values()) {
            const store = this._stores.get(sn);
            if (store && store.controllable) {
                store.update(control, physics);
            }
        }
    }
}
