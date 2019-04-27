import { arraySlice, isArray, objectAssign, objectCreate, objectGetPrototypeOf } from './utils';

/**
 * Clones the provided array and passes it to the provided callback.
 * If any properties are changed in the callback, the clone is returned, the original otherwise.
 */
export function withChanges<T>(original: ReadonlyArray<T>, callback: (clone: T[]) => void): T[];

/**
 * Clones the provided object and passes it to the provided callback.
 * If any properties are changed in the callback, the clone is returned, the original otherwise.
 */
export function withChanges<O extends Object>(original: Readonly<O>, callback: (clone: O) => void): O;

/**
 * Clones the provided object and passes it to the provided callback.
 * If any properties are changed in the callback, the clone is returned, the original otherwise.
 *
 * To use this function overload, you need to specify the hash type <T> explicitly.
 */
export function withChanges<T>(original: { [key: number]: T }, callback: (clone: { [key: number]: T }) => void): { [key: number]: T };

/**
 * Clones the provided object and passes it to the provided callback.
 * If any properties are changed in the callback, the clone is returned, the original otherwise.
 */
export function withChanges<O extends Object>(original: O, callback: (clone: O) => void): O;

/**
 * Clones the provided object if any of the properties would change, returns the original otherwise.
 */
export function withChanges<T>(original: { [key: number]: T }, assignment: { [key: number]: T }): { [key: number]: T };

/**
 * Clones the provided object if any of the properties would change, returns the original otherwise.
 */
export function withChanges<O extends Object, K extends keyof O>(original: O, assignment: { readonly [P in K]: O[P] }): Readonly<O>;


export function withChanges(original: any, assignment: any): any {
    if (typeof assignment === 'function') {
        const clone = isArray(original)
            ? arraySlice(original)
            : objectAssign(objectCreate(objectGetPrototypeOf(original)), original);

        assignment.call(undefined, clone);

        for (let key in clone) {
            if (original[key] !== clone[key]) {
                return clone;
            }
        }
    } else {
        for (let key in assignment) {
            if (original[key] !== assignment[key]) {
                if (isArray(original)) {
                    return objectAssign(arraySlice(original), assignment);
                } else {
                    return objectAssign(objectCreate(objectGetPrototypeOf(original)), original, assignment);
                }
            }
        }
    }
    return original;
}
