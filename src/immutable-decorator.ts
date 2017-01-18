import { deepClone } from './deep-clone';
import { flatEqual } from './flat-equal';
import { functionMutatesInput } from './function-mutates-input';
import { ClassOf, ImmutableMetadata, ChangeList } from './immutable-interfaces';
import { globalSettings, immutableSymbol, immutableSettings, getSettings, immutableObserversSymbol } from './immutable-settings';
import { MethodNotImmutableError } from './method-not-immutable-error';
import { getFunctionName } from './utils';


/**
 * Declares a class as immutable.
 * This creates a clone of object to a specified depth when a method is called.
 * If mutability checking is enabled (`immutableSettings()`), calling a method throws an exception
 * if the method modifies values of references in the object's properties or the method arguments.
 *
 * @example
 *     addToList(item: Item) {
 *         // These two will throw exceptions:
 *         this.list.push(item);
 *         this.list[this.list.length++] = item;
 *
 *         // These create a new reference and work:
 *         this.list = [...this.list, newItem];
 *         this.list = this.list.concat(newItem);
 *     }
 *
 * Changing the depth will clone object properties to the depth specified:
 *     @Immutable({ depth: 2 })
 *     class Example {
 *         state = { list: [{ id: 1, name: 'one' }] };
 *         addToList(item: { id: number, name: string }) {
 *             // with depth 0:
 *             this.state = { ...this.state, list: [...this.state.list, item] };
 *             // with depth 1:
 *             this.state.list = [...this.state.list, item];
 *             // with depth 2:
 *             this.state.list.push(item);
 *         };
 *     }
 */
export function Immutable({ depth } = { depth: 0 }): <T, C extends ClassOf<T>>(target: C) => C {
    return function ImmutableClassDecorator<T, C extends ClassOf<T>>(originalClass: C): C {
        return createImmutableClass(originalClass, { depth });
    };
}


/**
 * @internal
 */
export function createImmutableClass<T, C extends ClassOf<T>>(originalClass: C, { depth }: { depth: number }): C {

    function mappedConstructor(this: T, ...args: any[]) {
        let instance = new originalClass(...args);
        for (let key of Object.getOwnPropertyNames(instance) as (keyof T)[]) {
            this[key] = instance[key];
        }

        Object.defineProperty(this, immutableObserversSymbol, {
            configurable: true,
            enumerable: false,
            writable: false,
            value: []
        });
    }

    const className = getFunctionName(originalClass);
    const mappedClass = createNamedFunction(className, mappedConstructor);
    const originalPrototype = originalClass.prototype as any;
    const mappedPrototype: any = mappedClass.prototype = Object.create(originalClass.prototype);

    const metadata: ImmutableMetadata = {
        cloneDepth: depth,
        originalClass,
        settings: globalSettings
    };

    // Map methods of the original class
    for (let propertyKey of Object.getOwnPropertyNames(originalPrototype)) {
        let method = originalPrototype[propertyKey];
        if (propertyKey !== 'constructor' && typeof method === 'function') {
            mappedPrototype[propertyKey] = createMethodWrapper(method, metadata);
        }
    }

    Object.defineProperty(mappedPrototype, 'constructor', {
        configurable: true,
        enumerable: false,
        value: mappedClass,
        writable: true
    });

    // Copy static methods and properties
    for (let staticKey of Object.getOwnPropertyNames(originalClass)) {
        if (!Object.prototype.hasOwnProperty.call(mappedClass, staticKey)) {
            Object.defineProperty(mappedClass, staticKey, Object.getOwnPropertyDescriptor(originalClass, staticKey));
        }
    }

    // Define immutable-specific metadata
    for (let target of [mappedClass, mappedPrototype]) {
        Object.defineProperty(target, immutableSymbol, {
            configurable: true,
            enumerable: false,
            value: metadata,
            writable: false
        });
    }

    return mappedClass as any;
}

/** Creates a new function with the passed name. */
function createNamedFunction(name: string, realImplementation: (this: any, ...args: any[]) => any): Function {
    name = name.replace(/[+-.,;()\{\}\[\]]+/g, '_');
    const creator = new Function('fn', `return function ${name}() { return fn.apply(this, arguments); }`);
    return creator(realImplementation);
}

function createMethodWrapper(originalMethod: Function, metadata: ImmutableMetadata): Function {
    let wrapped = function immutableWrappedMethod(...args: any[]) {

        const { cloneDepth, originalClass, settings } = metadata;

        const originalProperties: any = {};
        let returnValue: any;

        // Only check mutability when enabled (e.g. in development)
        const runAndCheckChanges = settings.checkMutability
            ? functionMutatesInput
            : ((callback: Function) => { callback(); return false; }) as typeof functionMutatesInput;

        const mutations = runAndCheckChanges(() => {
            for (let key of Object.keys(this)) {
                originalProperties[key] = this[key];
                this[key] = deepClone(this[key], cloneDepth - 1);
            }

            returnValue = originalMethod.apply(this, args);
            restoreUnchangedProperties(this, originalProperties, metadata.cloneDepth);
        }, args, this);

        if (mutations) {
            // A method has changed a property without cloning the object first
            throw new MethodNotImmutableError(mutations, originalMethod, originalClass);
        }

        // Notify all observers added by ObserveChanges
        const observers = this[immutableObserversSymbol] as ((c: ChangeList<any>) => void)[];
        if (observers && observers.length > 0) {
            const changeList: ChangeList<any> = {
                instance: this,
                changes: { }
            };

            let hasChanges = false;

            for (let key of Object.keys(this)) {
                if (this[key] !== originalProperties[key]) {
                    hasChanges = true;
                    changeList.changes[key] = {
                        oldValue: originalProperties[key],
                        newValue: this[key]
                    }
                }
            }

            if (hasChanges) {
                for (let observer of observers) {
                    observer(changeList);
                }
            }
        }

        return returnValue;
    };
    return wrapped;
}

/** @internal */
export function restoreUnchangedProperties<T>(target: T, original: T, depth: number): void;
/** @internal */
export function restoreUnchangedProperties(target: any, original: any, depth: number): void {
    for (let key of Object.keys(target)) {
        if (typeof target[key] === 'object') {
            if (depth > 0) {
                restoreUnchangedProperties(target[key], original[key], depth - 1);
            }

            if (flatEqual(target[key], original[key])) {
                target[key] = original[key];
            }
        }
    }
}
