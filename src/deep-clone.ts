import { isArray, objectAssign, objectCreate, objectKeys, objectGetPrototypeOf } from './utils';

declare var Node: any;

/**
 * Create a deep clone that is equal by value but different by reference.
 * The clone will have the same prototype as the original with all own properties copied / cloned.
 */
export function deepClone<T>(original: T): T;

/**
 * Create a shallow/deep clone to a specific depth.
 * The clone is equal to the original by value but different by reference
 * and will have the same prototype as the original with all own properties copied / cloned.
 */
export function deepClone<T>(original: T, depth?: number): T;


export function deepClone(original: any, depth: number = Number.POSITIVE_INFINITY): any {
    if (!original || depth < 0) {
        return original;
    } else if (isArray(original)) {
        return original.map(val => deepClone(val, depth - 1));
    }

    const typeofOriginal = typeof original;
    if (typeofOriginal === 'object') {
        const prototype = objectGetPrototypeOf(original);

        if (prototype === Object.prototype) {
            return depth ? clonePropsTo({}, original, depth) : objectAssign({}, original);
        } else if (prototype === RegExp.prototype) {
            return new RegExp(original);
        } else if (prototype === Date.prototype) {
            return new Date(original);
        } else if (typeof (Map as any) === 'function' && prototype === Map.prototype) {
            return new Map(original);
        } else if (typeof (Set as any) === 'function' && prototype === Set.prototype) {
            return new Set(original);
        } else if (typeof Node === 'function' && original instanceof Node && typeof original.cloneNode === 'function') {
            return original.cloneNode(true);
        }

        const clone = objectCreate(prototype);
        return clonePropsTo(clone, original, depth);
    } else if (typeofOriginal === 'function') {
        const clone: any = function() {
            return original.apply(this, arguments);
        };
        return clonePropsTo(clone, original, depth);
    } else {
        return original;
    }
}

function clonePropsTo(target: any, source: any, depth: number): any {
    for (let key of objectKeys(source)) {
        target[key] = deepClone(source[key], depth - 1);
    }
    return target;
}