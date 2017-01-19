import { ImmutableMetadata } from './immutable-interfaces';

/** @internal */
export function getFunctionName(fn: Function, prototype?: any): string {
    if (Object.prototype.hasOwnProperty.call(fn, 'name') && fn.name) {
        return fn.name;
    }

    const source = Function.prototype.toString.apply(fn);
    let name = parseFunctionSource(source).name;
    if (name) {
        return name;
    }

    while (prototype) {
        for (let name of Object.getOwnPropertyNames(prototype)) {
            if (prototype[name] === fn) {
                return name;
            }
        }
        prototype = Object.getPrototypeOf(prototype);
    }

    return '';
}

/** @internal */
export function getFunctionArgs(fn: Function): string[] {
    const source = Function.prototype.toString.apply(fn);
    return parseFunctionSource(source).argNames;
}

/** @internal */
const functionRx = /^\s*(?:function\*? *([^)\n]*)\(([^)]*)\)|([^\s=\(,]+) *=>|\(([^\)]*)\) *=>|(\w+)\((?!function)([^)\n=<>]*?)\) *\{)/;

/**
 * Parses functions and arrows functions to get the function name and argument names.
 * @internal
 */
export function parseFunctionSource(source: string): { name: string, argNames: string[] } {
    const match = source.match(functionRx) || [];
    const [, functionName, functionArgs, arrowSingleArg, arrowArgs, methodName, methodArgs] = match;
    const args = functionArgs || arrowSingleArg || arrowArgs || methodArgs || '';
    const name = functionName || methodName || '';
    const argNames = args
        .split(',')
        .filter(arg => arg.indexOf('...') < 0)
        .map(arg => arg.replace(/^\s*(\w+)(?: *=.+)?\s*/, '$1'))
        .filter(s => !!s);
    return { name, argNames };
}

let metadataWeakMap: WeakMap<any, Partial<ImmutableMetadata>>;
let metadataSymbol = (typeof Symbol === 'function') ? Symbol('immutablets') : '@@immutablets';

/** @internal */
export function getImmutableMetadata(target: Function): Partial<ImmutableMetadata> | undefined {
    if (typeof Reflect === 'object' && (Reflect as any).getMetadata) {
        return (Reflect as any).getMetadata('immutablets', target);
    } else if (typeof WeakMap === 'function') {
        if (!metadataWeakMap) {
            metadataWeakMap = new WeakMap();
        }
        do {
            let metadata = metadataWeakMap.get(target);
            if (metadata) {
                return metadata;
            }
            target = target.prototype && Object.getPrototypeOf(target.prototype);
            target = target && target.constructor;
        } while (target);
    } else {
        do {
            let metadata = (target as any)[metadataSymbol];
            if (metadata) {
                return metadata;
            }
            target = target.prototype && Object.getPrototypeOf(target.prototype);
            target = target && target.constructor;
        } while (target);
    }
}

/** @internal */
export function setImmutableMetadata(target: Function, data: Partial<ImmutableMetadata>): void {
    if (typeof Reflect === 'object' && (Reflect as any).defineMetadata) {
        (Reflect as any).defineMetadata('immutablets', data, target);
    } else if (typeof WeakMap === 'function') {
        if (!metadataWeakMap) {
            metadataWeakMap = new WeakMap();
        }
        metadataWeakMap.set(target, data);
    } else {
        Object.defineProperty(target, metadataSymbol, {
            configurable: true,
            enumerable: false,
            value: metadataSymbol,
            writable: false
        });
    }
}
