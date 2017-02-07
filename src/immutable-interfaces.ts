export type ClassOf<T> = { new(...args: any[]): T, prototype: T };

/** Tracked method call and property changes as emitted by `observeImmutable()`. */
export interface TrackedMethodCall<T> {
    /** A hash of all changed properties */
    changes: undefined | {
        [K in keyof T]?: {
            /** The property value before the method call. */
            oldValue: T[K];
            /** The property value after the method call. */
            newValue: T[K];
        }
    },
    /** The instance the method was called on. */
    instance: any;
    /** The name of the called method. */
    methodName: string;
    /** Arguments passed to the method. Passed by reference. */
    arguments: any[];
    /** The return value of the method. Passed by reference. */
    returnValue: any;
    /** A hash of all property values before the call. */
    oldProperties: { [K in keyof T]: T[K] },
    /** A hash of all property values after the call. */
    newProperties: { [K in keyof T]: T[K] }
}

export interface ChangeList {
    [propertyName: string]: {
        /** The property value before the method call. */
        oldValue: any;
        /** The property value after the method call. */
        newValue: any;
    }
}

/** Settings for the @Immutable decorator. */
export interface ImmutableSettings {
    /**
     * Enable strict mutability checks for methods.
     * Has a negative performance impact, only enable in development and testing.
     */
    checkMutability: boolean;
}

/** @internal */
export interface ImmutableClassMetadata {
    cloneDepth: { [propertyKey: string]: number };
    originalClass: any;
    settings: ImmutableSettings;
}

/** @internal */
export interface ImmutableInstanceMetadata {
    callDepth: number;
    observers: Array<(changeList: TrackedMethodCall<any>) => void>;
}

/** Subscription interface from rxjs 5 */
export interface AnonymousSubscription {
    unsubscribe(): void;
}

/** PartialObserver interface from rxjs 5 */
export interface PartialObserver<T> {
    isUnsubscribed?: boolean;
    next?: (value: T) => void;
    error?: (err: any) => void;
    complete?: () => void;
}

/** Subscribable interface from rxjs 5 */
export interface Subscribable<T> {
    subscribe(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): AnonymousSubscription;
}
