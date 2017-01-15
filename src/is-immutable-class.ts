import { ClassOf } from './immutable-interfaces';
import { immutableSymbol } from './immutable-settings';

export function isImmutableClass<T>(target: ClassOf<T>): boolean {
    return typeof target === 'function'
        && target.prototype !== Function.prototype as any
        && (target.prototype as any)[immutableSymbol] != undefined;
}
