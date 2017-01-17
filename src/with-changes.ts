/**
 * Clones the provided object and passes it to the provided callback.
 * If any properties are changed in the callback, the clone is returned, the original otherwise.
 */
export function withChanges<O extends Object>(original: O, callback: (original: O) => void): O;

/**
 * Clones the provided array and passes it to the provided callback.
 * If any properties are changed in the callback, the clone is returned, the original otherwise.
 */
export function withChanges<A>(original: A[], callback: (original: A[]) => void): A[];

/**
 * Clones the provided object and passes it to the provided callback.
 * If any properties are changed in the callback, the clone is returned, the original otherwise.
 */
export function withChanges<O extends Object, T>(original: O, callback: (this: T, original: O) => void, thisArg: T): O;

/**
 * Clones the provided array and passes it to the provided callback.
 * If any properties are changed in the callback, the clone is returned, the original otherwise.
 */
export function withChanges<A, T>(original: A[], callback: (this: T, original: A[]) => void, thisArg: T): A[];

/**
 * Clones the provided object if any of the properties would change, returns the original otherwise.
 */
export function withChanges<O extends Object, K extends keyof O>(original: O, assignment: { [P in K]: O[P] }): O;

/*
 * Clones the provided array if any of the properties would change, returns the original otherwise.
 */
export function withChanges<A>(original: A[], keysToChange: { [key: number]: A }): A[];


export function withChanges(original: any, assignment: any, thisArg?: any): any {
    if (typeof assignment === 'function') {
        const clone = Array.isArray(original)
            ? Array.prototype.slice.apply(original)
            : Object.assign(Object.create(Object.getPrototypeOf(original)), original);

        assignment.call(thisArg, clone);

        for (let key in clone) {
            if (original[key] !== clone[key]) {
                return clone;
            }
        }
    } else {
        for (let key in assignment) {
            if (original[key] !== assignment[key]) {
                if (Array.isArray(original)) {
                    return Object.assign(Array.prototype.slice.apply(original), assignment);
                } else {
                    return Object.assign(Object.create(Object.getPrototypeOf(original)), original, assignment);
                }
            }
        }
    }
    return original;
}
