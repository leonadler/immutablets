import { deepClone } from './deep-clone';
import { deepEqual } from './deep-equal';
import { traverseObject } from './traverse-object';

export interface ChangedProperty {
    path: string[];
    oldValue?: any;
    newValue?: any;
}

export type InputMutations = {
    this: ChangedProperty[],
    args: { [argumentIndex: number]: ChangedProperty[] }
};

export function functionMutatesInput(fn: Function, args: any[], thisArg: any = undefined): false | InputMutations {
    const thisSnapshot = createSnapshot(thisArg);
    const argSnapshots = args.map(createSnapshot);

    fn.apply(thisArg, args);

    const thisChanges = checkSnapshotChanges(thisSnapshot);
    const argChanges = {} as { [arg: number]: ChangedProperty[] };

    argSnapshots.forEach((snapshot, index) => {
        let changes = checkSnapshotChanges(snapshot);
        if (changes.length > 0) {
            argChanges[index] = changes;
        }
    });

    if (thisChanges.length > 0 || Object.keys(argChanges).length > 0) {
        return {
            args: argChanges,
            this: thisChanges
        };
    } else {
        return false;
    }
}

type Snapshot = Map<any, { value: any, path: string[] }>;

function createSnapshot(object: any): Snapshot {
    const map = new Map();
    traverseObject(object, (prop, path) => {
        map.set(prop, { value: Object.assign({}, prop), path });
    });
    return map;
}

function checkSnapshotChanges(snapshotMap: Snapshot): ChangedProperty[] {
    const changes = [] as ChangedProperty[];
    snapshotMap.forEach((snapshot, object) => {
        const newKeys = Object.keys(object);
        const oldKeys = Object.keys(snapshot.value);

        for (let key of oldKeys.filter(k => newKeys.indexOf(k) < 0)) {
            changes.push({
                path: [...snapshot.path, key],
                oldValue: snapshot.value[key]
            });
        }

        for (let key of newKeys) {
            const newValue = object[key];

            if (oldKeys.indexOf(key) < 0) {
                changes.push({
                    path: [...snapshot.path, key],
                    newValue
                });
            } else if ((typeof object[key] !== 'object' || object === null) && newValue !== snapshot.value[key]) {
                changes.push({
                    path: [...snapshot.path, key],
                    oldValue: snapshot.value[key],
                    newValue
                })
            }
        }
    });

    return changes;
}
