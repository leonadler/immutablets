declare var Node: any;

/**
 * Create a deep clone that is equal by value and different by reference.
 * The clone will have the same prototype as the original with all own properties copied / cloned.
 */
export function deepClone<T>(original: T): T;

export function deepClone<T>(original: any): any {
    if (!original) {
        return original;
    } else if (Array.isArray(original)) {
        return original.map(deepClone);
    } else if (typeof original === 'object') {
        let prototype = Object.getPrototypeOf(original);

        if (prototype === RegExp.prototype) {
            return new RegExp(original);
        } else if (prototype === Date.prototype) {
            return new Date(original);
        } else if (typeof Node === 'function' && original instanceof Node && typeof original.cloneNode === 'function') {
            return original.cloneNode(true);
        }

        let clone = Object.create(prototype);
        for (let key of Object.keys(original)) {
            clone[key] = deepClone(original[key]);
        }
        return clone;
    } else {
        return original;
    }
}
