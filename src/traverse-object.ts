import { objectKeys } from './utils';

/**
 * Traverses an object and its child objects breadth-first and calls a callback for every object traversed.
 * Objects referenced more than once do not cause the callback to be called multiple times.
 */
export function traverseObject(object: any, callback: (subject: any, path: string[]) => void): void {
    if (typeof object !== 'object' || !object) return;
    const traversed = new Set();
    const queue = [{ path: [] as string[], value: object }];

    do {
        const current = queue.splice(0, 1)[0];
        if (!traversed.has(current.value)) {
            traversed.add(current.value);
            callback(current.value, current.path)

            for (let key of objectKeys(current.value)) {
                const value: any = current.value[key];
                if (typeof value === 'object' && value !== null) {
                    queue.push({ path: [...current.path, key], value });
                }
            }
        }
    } while (queue.length > 0);
}
