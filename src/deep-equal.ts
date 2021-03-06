import { isArray, objectGetPrototypeOf, objectKeys } from './utils';

/**
 * Deep-compare two values.
 *
 * Returns true only if the two objects are equal primitive types, arrays with deeply equal values
 * or objects with deeply equal properties and the same prototype.
 */
export function deepEqual<T>(a: T, b: T): boolean;

export function deepEqual(a: any, b: any): boolean {
    if (a === b) {
        return true;
    }

    if (typeof a !== typeof b) {
        return false;
    }

    if (a == null || b == null) {
        return false;
    }

    if (typeof a === 'object') {
        const arrayA = isArray(a);
        const arrayB = isArray(b);

        if (arrayA !== arrayB) {
            return false;
        } else if (arrayA) {
            // Array
            if (a.length !== b.length) {
                return false;
            }

            const len = a.length;
            for (let i = 0; i < len; i++) {
                if (!deepEqual(a[i], b[i])) {
                    return false;
                }
            }

            return true;
        } else {
            // Object
            const protoA = objectGetPrototypeOf(a);
            const protoB = objectGetPrototypeOf(b);
            if (protoA !== protoB) {
                return false;
            } else if (protoA === Date.prototype) {
                return Number(a) === Number(b);
            } else if (protoA === RegExp.prototype) {
                return a.toString() === b.toString();
            }

            // Plain object or custom prototype
            const keysA = objectKeys(a).sort();
            const keysB = objectKeys(b).sort();
            if (keysA.length !== keysB.length) {
                return false;
            }

            for (let i = 0; i < keysA.length; i++) {
                let key = keysA[i];
                if (key !== keysB[i]) {
                    return false;
                }

                if (!deepEqual(a[key], b[key])) {
                    return false;
                }
            }

            return true;
        }
    } else if (typeof a === 'number') {
        // Let NaN === NaN be true, unlike in normal JS
        return Number.isNaN(a) && Number.isNaN(b);
    } else {
        // Non-equal primitive type or function
        return false;
    }
}
