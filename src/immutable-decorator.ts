import { deepClone } from './deep-clone';
import { flatEqual } from './flat-equal';
import { functionMutatesInput } from './function-mutates-input';
import { ClassOf, ImmutableClassMetadata, TrackedMethodCall, ImmutableInstanceMetadata } from './immutable-interfaces';
import { globalSettings } from './immutable-settings';
import { MethodNotImmutableError } from './method-not-immutable-error';
import { deepFreeze } from './deep-freeze';
import { getFunctionName, getImmutableClassMetadata, getInstanceMetadata, hasOwnProperty, objectAssign, objectCreate,
    objectDefineProperty, objectKeys, setImmutableClassMetadata, setInitialInstanceMetadata } from './utils';


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
export function Immutable(): <T, C extends ClassOf<T>>(target: C) => C;
/** Declares a class as immutable. */
export function Immutable<T, C extends ClassOf<T>>(target: C): C;

export function Immutable(originalClass?: any): any {
    if (originalClass) {
        return createImmutableClass(originalClass);
    } else {
        return Immutable;
    }
}


/** @internal */
export function createImmutableClass<T extends {}, C extends ClassOf<T>>(originalClass: C): C {

    const originalMetadata = getImmutableClassMetadata(originalClass);
    const metadata: ImmutableClassMetadata = {
        cloneDepth: originalMetadata && originalMetadata.cloneDepth || {},
        originalClass,
        settings: globalSettings,
    };

    // Constructor that will be called on `new Class()` instead of the original constructor.
    function mappedConstructor(this: T, ...args: any[]) {
        constructing = true;
        let instance = new originalClass(...args);
        constructing = false;

        for (const key of Object.getOwnPropertyNames(instance) as (keyof T)[]) {
            const descriptor = Object.getOwnPropertyDescriptor(instance, key);
            objectDefineProperty(this, key, descriptor!);
        }8

        setInitialInstanceMetadata(this);

        if (metadata.settings.deepFreeze) {
            for (let key of objectKeys(this)) {
                const propertyValue = (this as any)[key];
                if (typeof propertyValue === 'object' && propertyValue) {
                    deepFreeze(propertyValue);
                }
            }
        }
    }

    const className = getFunctionName(originalClass);
    const mappedClass = createNamedFunction(className, mappedConstructor);
    const originalPrototype = originalClass.prototype as any;
    const mappedPrototype: any = mappedClass.prototype = objectCreate(originalClass.prototype);

    // Map methods of the original class
    for (let propertyKey of Object.getOwnPropertyNames(originalPrototype)) {
        let method = originalPrototype[propertyKey];
        if (propertyKey !== 'constructor' && typeof method === 'function') {
            mappedPrototype[propertyKey] = createMethodWrapper(method, propertyKey, metadata);
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
            const descriptor = Object.getOwnPropertyDescriptor(originalClass, staticKey);
            objectDefineProperty(mappedClass, staticKey, descriptor!);
        }
    }

    // Define immutable-specific metadata
    setImmutableClassMetadata(mappedClass, metadata);
    setImmutableClassMetadata(mappedPrototype, metadata);

    return mappedClass as any;
}

/** Creates a new function with the passed name. */
function createNamedFunction(name: string, realImplementation: (this: any, ...args: any[]) => any): Function {
    name = name.replace(/[+-.,;()\{\}\[\]]+/g, '_');
    const creator = new Function('fn', `return function ${name}() { return fn.apply(this, arguments); }`);
    return creator(realImplementation);
}

function createMethodWrapper(originalMethod: Function, methodName: string, classMetadata: ImmutableClassMetadata): Function {
    let wrapped = function immutableWrappedMethod(this: any, ...args: any[]) {

        const { cloneDepth, originalClass, settings } = classMetadata;
        const instanceMetadata = (getInstanceMetadata(this) || {}) as ImmutableInstanceMetadata;

        const originalProperties: any = {};
        let returnValue: any;
        let timeBefore: Date;
        let callDuration = -1;

        // Only check mutability when enabled (e.g. in development)
        const runAndCheckChanges = settings.checkMutability
            ? functionMutatesInput
            : ((callback: Function) => { callback(); return false; }) as typeof functionMutatesInput;

        const mutations = runAndCheckChanges(() => {
            for (let key of objectKeys(this)) {
                originalProperties[key] = this[key];
                const propertyCloneDepth = (cloneDepth as any)[key];
                if (propertyCloneDepth > 0) {
                    this[key] = deepClone(this[key], propertyCloneDepth - 1);
                }
            }

            timeBefore = new Date();
            const timestampBefore = getTimestamp();

            instanceMetadata.callDepth++;
            try {
                // Finally call the actual method
                returnValue = originalMethod.apply(this, args);

                callDuration = getTimestamp() - timestampBefore;
            } finally {
                instanceMetadata.callDepth--;
            }

            // Restore unchanged properties
            restoreUnchangedProperties(this, originalProperties, cloneDepth);
        }, args, this);

        if (mutations) {
            // Throw when a method changes "this.prop.otherProp", but not "this.prop"
            if (mutations.this.some(change => change.path.length > 1) || Object.keys(mutations.args).length > 0) {
                // A method has changed a property without cloning the object first
                throw new MethodNotImmutableError(mutations, originalMethod, originalClass);
            }
        }

        if (classMetadata.settings.deepFreeze) {
            for (let key of objectKeys(this)) {
                const propertyValue = (this as any)[key];
                if (propertyValue !== originalProperties[key] && typeof propertyValue === 'object' && propertyValue) {
                    deepFreeze(propertyValue);
                }
            }
        }

        // Notify all observers added by observeImmutable
        const observers = instanceMetadata.observers;
        if (observers && observers.length > 0 && !instanceMetadata.callDepth) {
            const call: TrackedMethodCall<any> = {
                instance: this,
                methodName,
                arguments: args,
                returnValue,
                callDuration,
                changes: undefined,
                oldProperties: originalProperties,
                newProperties: objectAssign({}, this)
            };

            let hasChanges = false;
            let changes: any = {};

            for (let key of objectKeys(this)) {
                if (this[key] !== originalProperties[key]) {
                    hasChanges = true;
                    changes[key] = {
                        oldValue: originalProperties[key],
                        newValue: this[key]
                    }
                }
            }

            if (hasChanges) {
                call.changes = changes;
            }

            for (let observer of observers) {
                observer(call);
            }
        }

        return returnValue;
    };
    return wrapped;
}

/** @internal */
export function restoreUnchangedProperties<T>(target: T, original: T, depth: number | { [K in keyof T]?: number }): void {
    for (let key of objectKeys(target)) {
        if (typeof target[key] === 'object' && target[key] !== null) {
            const propDepth = typeof depth === 'number' ? depth : (depth[key] || 0) as number;
            if (propDepth > 0) {
                restoreUnchangedProperties(target[key], original[key], propDepth - 1);

                if (target[key] !== original[key] && flatEqual(target[key], original[key])) {
                    target[key] = original[key];
                }
            }
        }
    }
}

/** @internal */
export function isConstructingImmutable(): boolean {
    return constructing;
}

declare var performance: undefined | { now(): number };
/** @internal */
function getTimestamp(): number {
    if (typeof performance === 'object') {
        // Cut values like 1234.8850000001 to 1234.885
        return (performance.now() * 1000 | 0) * 0.001;
    } else if (Date.now) {
        return Date.now();
    } else {
        return +(new Date());
    }
}
