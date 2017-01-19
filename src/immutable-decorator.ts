import { deepClone } from './deep-clone';
import { flatEqual } from './flat-equal';
import { functionMutatesInput } from './function-mutates-input';
import { ClassOf, ImmutableMetadata, ChangeList } from './immutable-interfaces';
import { globalSettings,  immutableObserversSymbol } from './immutable-settings';
import { MethodNotImmutableError } from './method-not-immutable-error';
import { getFunctionName, getImmutableMetadata, hasOwnProperty, objectCreate, objectDefineProperty,
    objectKeys, setImmutableMetadata } from './utils';


let constructing: boolean = false;

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
 *     @Immutable()
 *     class Example {
 *         @CloneDepth(<the depth you want to use>)
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
export function Immutable(): <T, C extends ClassOf<T>>(target: C) => C {
    return function ImmutableClassDecorator<T, C extends ClassOf<T>>(originalClass: C): C {
        return createImmutableClass(originalClass);
    };
}


/**
 * @internal
 */
export function createImmutableClass<T, C extends ClassOf<T>>(originalClass: C): C {

    function mappedConstructor(this: T, ...args: any[]) {
        constructing = true;
        let instance = new originalClass(...args);
        constructing = false;

        for (let key of Object.getOwnPropertyNames(instance) as (keyof T)[]) {
            let descriptor = Object.getOwnPropertyDescriptor(instance, key);
            objectDefineProperty(this, key, descriptor);
        }

        objectDefineProperty(this, immutableObserversSymbol, {
            configurable: true,
            enumerable: false,
            writable: false,
            value: []
        });
    }

    const className = getFunctionName(originalClass);
    const mappedClass = createNamedFunction(className, mappedConstructor);
    const originalMetadata = getImmutableMetadata(originalClass);
    const originalPrototype = originalClass.prototype as any;
    const mappedPrototype: any = mappedClass.prototype = objectCreate(originalClass.prototype);

    const metadata: ImmutableMetadata = {
        cloneDepth: originalMetadata && originalMetadata.cloneDepth || {},
        originalClass,
        settings: globalSettings,
    };

    // Map methods of the original class
    for (let propertyKey of Object.getOwnPropertyNames(originalPrototype)) {
        let method = originalPrototype[propertyKey];
        if (propertyKey !== 'constructor' && typeof method === 'function') {
            mappedPrototype[propertyKey] = createMethodWrapper(method, metadata);
        }
    }

    objectDefineProperty(mappedPrototype, 'constructor', {
        configurable: true,
        enumerable: false,
        value: mappedClass,
        writable: true
    });

    // Copy static methods and properties
    for (let staticKey of Object.getOwnPropertyNames(originalClass)) {
        if (!hasOwnProperty(mappedClass, staticKey)) {
            objectDefineProperty(mappedClass, staticKey, Object.getOwnPropertyDescriptor(originalClass, staticKey));
        }
    }

    // Define immutable-specific metadata
    setImmutableMetadata(mappedClass, metadata);
    setImmutableMetadata(mappedPrototype, metadata);

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
            for (let key of objectKeys(this)) {
                originalProperties[key] = this[key];
                this[key] = deepClone(this[key], (cloneDepth[key] || 0) - 1);
            }

            returnValue = originalMethod.apply(this, args);

            // Restore unchanged properties
            restoreUnchangedProperties(this, originalProperties, cloneDepth);
        }, args, this);

        if (mutations) {
            // A method has changed a property without cloning the object first
            throw new MethodNotImmutableError(mutations, originalMethod, originalClass);
        }

        // Notify all observers added by ObserveChanges
        const observers = this[immutableObserversSymbol] as ((c: ChangeList) => void)[];

        if (observers && observers.length > 0) {
            const changeList: ChangeList = {
                instance: this,
                changes: { }
            };

            let hasChanges = false;

            for (let key of objectKeys(this)) {
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
export function restoreUnchangedProperties<T>(target: T, original: T, depth: number | { [K in keyof T]?: number }): void;
/** @internal */
export function restoreUnchangedProperties(target: any, original: any, depthArg: number | { [k: string]: number }): void {
    for (let key of objectKeys(target)) {
        if (typeof target[key] === 'object') {
            const depth = typeof depthArg === 'number' ? depthArg : depthArg[key];
            if (depth > 0) {
                restoreUnchangedProperties(target[key], original[key], depth - 1);
            }

            if (flatEqual(target[key], original[key])) {
                target[key] = original[key];
            }
        }
    }
}

/** @internal */
export function isConstructingImmutable(): boolean {
    return constructing;
}
