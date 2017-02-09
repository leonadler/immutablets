import { objectKeys } from './utils';

export function deepFreeze<T extends Object>(target: T): T {
    for (let key of objectKeys(target)) {
        const value = (target as any)[key];
        if (typeof value === 'object' && value) {
            deepFreeze(value);
        }
    }

    Object.freeze(target);
    return target;
}
