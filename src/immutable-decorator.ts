import { globalSettings, immutableSymbol, immutableSettings, getSettings, ImmutableSettings } from './immutable-settings';
import { functionMutatesInput } from './function-mutates-input';
import { deepClone } from './deep-clone';
import { MethodNotImmutableError } from './method-not-immutable-error';
import { flatEqual } from './flat-equal';

export type ClassOf<T> = { new(...args: any[]): T, prototype: T };

interface ImmutableMetadata {
    cloneDepth: number;
    originalClass: any;
    settings: ImmutableSettings;
}

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
function ImmutableDecorator({ depth } = { depth: 0 }): <T, C extends ClassOf<T>>(target: C) => C {
    return function ImmutableClassDecorator<T, C extends ClassOf<T>>(originalClass: C): C {
        return createImmutableClass(originalClass, { depth });
    };
}

export { ImmutableDecorator as Immutable };

/**
 * @internal
 */
export function createImmutableClass<T, C extends ClassOf<T>>(originalClass: C, { depth }: { depth: number }): C {
    let mappedClass = function ImmutableClass(...args: any[]) {
        let instance = new originalClass(...args);
        for (let key of Object.getOwnPropertyNames(instance)) {
            this[key] = (instance as any)[key];
        }
    }
    mappedClass.prototype = Object.create(originalClass.prototype);

    const originalPrototype = originalClass.prototype as any;

    const metadata: ImmutableMetadata = {
        cloneDepth: depth,
        originalClass,
        settings: globalSettings
    };

    // Map methods of the original class
    for (let propertyKey of Object.getOwnPropertyNames(originalPrototype)) {
        let method = originalPrototype[propertyKey];
        if (typeof method === 'function') {
            mappedClass.prototype[propertyKey] = createMethodWrapper(method, metadata);
        }
    }

    // Copy static methods and properties
    for (let staticKey of Object.getOwnPropertyNames(originalClass)) {
        if (!Object.prototype.hasOwnProperty.call(mappedClass, staticKey)) {
            Object.defineProperty(mappedClass, staticKey, Object.getOwnPropertyDescriptor(originalClass, staticKey));
        }
    }

    // Define immutable-specific metadata
    for (let target of [mappedClass, mappedClass.prototype]) {
        Object.defineProperty(target, immutableSymbol, {
            configurable: true,
            enumerable: false,
            value: metadata,
            writable: false
        });
    }

    return mappedClass as any;
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
