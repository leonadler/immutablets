/**
 * Clones the provided object if any of the properties would change, returns the original otherwise.
 */
export function withChanges<O extends Object>(original: O, assignment: { [K in keyof O]?: O[K] }): O;

/**
 * Clones the provided object and passes it to the provided callback.
 * If any properties are changed in the callback, the clone is returned, the original otherwise.
 */
export function withChanges<O>(original: O, callback: (original: O) => void): O;

/**
 * Clones the provided object and passes it to the provided callback.
 * If any properties are changed in the callback, the clone is returned, the original otherwise.
 */
export function withChanges<O, T>(original: O, callback: (this: T, original: O) => void, thisArg: T): O;

export function withChanges(original: any, assignment: any, thisArg?: any): any {
    if (typeof assignment === 'function') {
        const clone = Array.isArray(original)
            ? Array.prototype.slice.apply(original)
            : Object.assign(Object.create(Object.getPrototypeOf(original)), original, assignment);

        assignment.call(thisArg, clone);

        for (let key in clone) {
            if (original[key] !== clone[key]) {
                return clone;
            }
        }
    } else {
        for (let key in assignment) {
            if (original[key] !== assignment[key]) {
                return Array.isArray(original)
                    ? Array.prototype.slice.apply(original)
                    : Object.assign(Object.create(Object.getPrototypeOf(original)), original, assignment);
            }
        }
    }
    return original;
}
