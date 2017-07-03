import { deepEqual } from './deep-equal';
import { isArray, objectAssign, objectKeys } from './utils';

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] | DeepPartial<T[P]>;
};

/**
 * Applies all changes deeply on an object.
 * If any object would have the same values as before, the same reference is used.
 * If any properties changed, returns a new Object that contains all values of a overwritten with values of b
 * Arrays are overwritten (with reference reuse), _not_ merged.
 *
 * @example
 * const newPoint = { pos: {x: 1, y: 2}, color: 'red' };
 * const oldPoint = { pos: {x: 1, y: 2}, color: 'green' };
 * const result = deepApplyWithReuse(oldPoint, newPoint);
 * // => result.pos === oldPoint.pos
 * // => result.color === 'red'
 */
export function deepApplyWithReuse<T extends Object>(a: T, b: DeepPartial<T>): T;
export function deepApplyWithReuse(a: any, b: any): any {
    if (a === b) {
        return a;
    } else if (a == null) {
        return b;
    } else if (b == null) {
        return b;
    } else if (typeof a !== 'object') {
        return b;
    } else if (isArray(a)) {
        if (!isArray(b)) {
            return b;
        }

        let anyValueChanged = a.length !== b.length;
        const clone = new Array(b.length);
        for (let i = 0; i < clone.length; i++) {
            if (deepEqual(a[i], b[i])) {
                clone[i] = a[i];
            } else {
                anyValueChanged = true;
                clone[i] = b[i];
            }
        }

        return anyValueChanged ? clone : a;
    } else {
        const clone = objectAssign({}, a);
        const keysA = objectKeys(a);
        const keysB = objectKeys(b);

        let anyValueChanged = keysA.length !== keysB.length;
        for (const key of keysB) {
            const newValue = deepApplyWithReuse(a[key], b[key]);
            if (newValue !== a[key]) {
                anyValueChanged = true;
                clone[key] = newValue;
            }
        }

        return anyValueChanged ? clone : a;
    }
}
