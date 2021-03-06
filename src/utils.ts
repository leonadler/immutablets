import { ImmutableClassMetadata, ImmutableInstanceMetadata } from './immutable-interfaces';

/** @internal */
export function getFunctionName(fn: Function, prototype?: any): string {
    if (hasOwnProperty(fn, 'name') && fn.name) {
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
        prototype = objectGetPrototypeOf(prototype);
    }

    return '';
}

/** @internal */
export function getFunctionArgs(fn: Function): string[] {
    const source = Function.prototype.toString.apply(fn);
    return parseFunctionSource(source).argNames;
}

/** @internal */
export function bothEqualNaN(a: any, b: any): boolean {
    return typeof a === 'number' && typeof b === 'number' && a !== a && b !== b;
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

let classMetadataWeakMap: WeakMap<any, Partial<ImmutableClassMetadata>>;
const classMetadataSymbol = (typeof Symbol === 'function') ? Symbol('immutablets') : '@@immutablets';
let instanceMetadataWeakMap: WeakMap<any, ImmutableInstanceMetadata>;
const instanceMetadataSymbol = (typeof Symbol === 'function') ? Symbol('immutablets-instance') : '@@immutablets-instance';

/** @internal */
export function getImmutableClassMetadata(target: Function): Partial<ImmutableClassMetadata> | undefined {
    if (typeof Reflect === 'object' && (Reflect as any).getMetadata) {
        return (Reflect as any).getMetadata('immutablets', target);
    } else if (typeof WeakMap === 'function') {
        if (!classMetadataWeakMap) {
            classMetadataWeakMap = new WeakMap();
        }
        do {
            let metadata = classMetadataWeakMap.get(target);
            if (metadata) {
                return metadata;
            }
            target = target.prototype && objectGetPrototypeOf(target.prototype);
            target = target && target.constructor;
        } while (target);
    } else {
        do {
            let metadata = (target as any)[classMetadataSymbol];
            if (metadata) {
                return metadata;
            }
            target = target.prototype && objectGetPrototypeOf(target.prototype);
            target = target && target.constructor;
        } while (target);
    }

    return undefined;
}

/** @internal */
export function setImmutableClassMetadata(target: Function, data: Partial<ImmutableClassMetadata>): void {
    if (typeof Reflect === 'object' && (Reflect as any).defineMetadata) {
        (Reflect as any).defineMetadata('immutablets', data, target);
    } else if (typeof WeakMap === 'function') {
        if (!classMetadataWeakMap) {
            classMetadataWeakMap = new WeakMap();
        }
        classMetadataWeakMap.set(target, data);
    } else {
        Object.defineProperty(target, classMetadataSymbol, {
            configurable: true,
            enumerable: false,
            value: classMetadataSymbol,
            writable: false
        });
    }
}

/** @internal */
export function getInstanceMetadata(target: any): ImmutableInstanceMetadata | undefined {
    if (typeof WeakMap === 'function') {
        if (!instanceMetadataWeakMap) {
            instanceMetadataWeakMap = new WeakMap();
        }
        return instanceMetadataWeakMap.get(target);
    } else {
        return target[instanceMetadataSymbol];
    }
}


/** @internal */
export function setInitialInstanceMetadata(target: any): void {
    if (typeof WeakMap === 'function') {
        if (!instanceMetadataWeakMap) {
            instanceMetadataWeakMap = new WeakMap();
        }
        instanceMetadataWeakMap.set(target, {
            callDepth: 0,
            observers: []
        });
    } else {
        Object.defineProperty(target, instanceMetadataSymbol, {
            configurable: true,
            enumerable: false,
            value: {
                callDepth: 0,
                changeObservers: []
            },
            writable: false
        });
    }
}

/** @internal Short-hand function for Array.prototype.slice(). */
export const arraySlice: <T>(arr: ArrayLike<T>) => T[] = Function.prototype.call.bind(Array.prototype.slice);

/** @internal Short-hand function for Object.hasOwnProperty(). */
export const hasOwnProperty: <O, P extends string>(obj: O, prop: P) => obj is O & { [K in P]: any } = Function.call.bind(Object.prototype.hasOwnProperty);

/** @internal Short-hand function for Array.isArray(). */
export const isArray = Array.isArray;

/** @internal Short-hand function for Object.keys(). */
export const objectKeys = Object.keys as <T>(object: T) => Array<keyof T & string>;

/** @internal Short-hand function for Object.assign(). */
export const objectAssign = Object.assign;

/** @internal Short-hand function for Object.assign(). */
export const objectCreate = Object.create;

/** @internal Short-hand function for Object.defineProperty(). */
export const objectDefineProperty = Object.defineProperty;

/** @internal Short-hand function for Object.getPrototypeOf(). */
export const objectGetPrototypeOf = Object.getPrototypeOf;
