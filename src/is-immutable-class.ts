import { getImmutableMetadata } from './utils';

/** Returns true if the argument is a class decorated with @Immutable. */
export function isImmutableClass(target: Function): boolean {
    return typeof target === 'function'
        && target.prototype !== Function.prototype as any
        && getImmutableMetadata(target) != undefined;
}
