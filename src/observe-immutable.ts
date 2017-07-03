import { AnonymousSubscription, TrackedMethodCall, ImmutableClassMetadata, Subscribable } from './immutable-interfaces';
import { getFunctionName, objectGetPrototypeOf, getInstanceMetadata } from './utils';


/**
 * Get notified when a method of an @Immutable class instance is called and of any changed properties.
 * To use the rxjs observables your project uses, you need to pass the `Observable` class.
 */
export function observeImmutable<T, O extends Subscribable<TrackedMethodCall<T>>, C extends { new(): O }>(instance: T, observableClass: C): O;

/**
 * Get notified when a method of an @Immutable class instance is called and of any changed properties.
 */
export function observeImmutable<T>(instance: T): Subscribable<TrackedMethodCall<T>>;


export function observeImmutable<T>(instance: T, observableClass?: any): Subscribable<TrackedMethodCall<T>> {
    const instanceMetadata = getInstanceMetadata(instance);
    if (!instanceMetadata) {
        const constructor = objectGetPrototypeOf(instance).constructor;
        const className = constructor && getFunctionName(constructor) || 'object class';
        throw new Error(className + ' is not decorated as @Immutable.');
    }

    return createObservable(instanceMetadata.observers, observableClass);
}


/**
 * Creates an observable of a passed Implementation or a plain-JavaScript observable.
 * @internal
 */
export function createObservable<T>(observerList: Array<(emittedValue: T) => void>, observableClass: any): Subscribable<T> {
    if (observableClass) {
        // Use a RXJS implementation passed by the user.
        return new observableClass((subscriber: any) => handleSubscription(subscriber, observerList));
    }

    // Use a plain JavaScript Observable.
    return {
        subscribe: (subscriber: any) => handleSubscription(subscriber, observerList)
    };
}


/** @internal */
function handleSubscription(subscriber: any, observerList: Function[]): AnonymousSubscription {
    const callback = subscriber.next
        ? ((value: any) => subscriber.next(value))
        : subscriber;
    observerList.push(callback);

    return {
        unsubscribe(): void {
            let index: number;
            while ((index = observerList.indexOf(callback)) >= 0) {
                observerList.splice(index, 1);
            }
        }
    };
}