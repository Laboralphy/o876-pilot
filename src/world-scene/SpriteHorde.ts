import { SpriteStore } from './SpriteStore';
import { IControlState } from './IControlState';
import { IPhysicsReader } from './IPhysicsReader';

export class SpriteHorde {
    private readonly _stores = new Map<string, SpriteStore>();
    private readonly _controllableStores = new Set<string>();

    add(store: SpriteStore): void {
        this._stores.set(store.id, store);
        if (store.controllable) {
            this._controllableStores.add(store.id);
        }
    }

    remove(id: string): void {
        this._stores.delete(id);
        this._controllableStores.delete(id);
    }

    get(id: string): SpriteStore | undefined {
        return this._stores.get(id);
    }

    entries(): IterableIterator<SpriteStore> {
        return this._stores.values();
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
