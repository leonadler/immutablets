export type ClassOf<T> = { new(...args: any[]): T, prototype: T };

export interface ChangeList<T> {
    changes: {
        [K in keyof T]: {
            oldValue: T[K],
            newValue: T[K]
        }
    };
    instance: T;
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
export interface ImmutableMetadata {
    cloneDepth: { [propertyKey: string]: number };
    originalClass: any;
    settings: ImmutableSettings;
}

/** Subscription interface from rxjs 5 */
export interface AnonymousSubscription {
    unsubscribe(): void;
}
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
