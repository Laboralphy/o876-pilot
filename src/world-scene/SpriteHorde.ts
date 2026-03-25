import { SpriteStore } from './SpriteStore';
import { IControlState } from './IControlState';
import { IPhysicsReader } from './IPhysicsReader';

export class SpriteHorde {
    private readonly _stores = new Map<string, SpriteStore>();

    add(store: SpriteStore): void {
        this._stores.set(store.id, store);
    }

    remove(id: string): void {
        this._stores.delete(id);
    }

    get(id: string): SpriteStore | undefined {
        return this._stores.get(id);
    }

    entries(): IterableIterator<SpriteStore> {
        return this._stores.values();
    }

    update(control: IControlState, physics: IPhysicsReader): void {
        for (const store of this._stores.values()) {
            if (store.controllable) {
                store.update(control, physics);
            }
        }
    }
}
