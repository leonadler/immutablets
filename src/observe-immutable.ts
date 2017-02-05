import { AnonymousSubscription, ChangeList, ImmutableClassMetadata, Subscribable } from './immutable-interfaces';
import { getFunctionName, objectGetPrototypeOf, getInstanceMetadata } from './utils';


/**
 * Get notified when properties of a @Immutable class instance change.
 * To use the rxjs observables your project uses, you need to pass the `Observable` class.
 */
export function observeImmutable<T, O extends Subscribable<ChangeList>>(instance: T, observableClass: { new(): O }): O;

/**
 * Get notified when properties of a @Immutable class instance change.
 */
export function observeImmutable<T>(instance: T): Subscribable<ChangeList>;


export function observeImmutable<T>(instance: T, observableClass?: any): Subscribable<ChangeList> {
    const instanceMetadata = getInstanceMetadata(instance);
    if (!instanceMetadata) {
        const constructor = objectGetPrototypeOf(instance).constructor;
        const className = constructor && getFunctionName(constructor) || 'object class';
        throw new Error(className + ' is not decorated as @Immutable.');
    }

    if (observableClass) {
        // Use a RXJS implementation passed by the user.
        return new observableClass((subscriber: any) => handleSubscription(subscriber, instanceMetadata.changeObservers));
    }

    // Use a plain JavaScript Observable.
    return {
        subscribe: (subscriber: any) => handleSubscription(subscriber, instanceMetadata.changeObservers)
    };
}

function handleSubscription(subscriber: any, observers: ((changeList: ChangeList) => void)[]): AnonymousSubscription {
    const callback = subscriber.next
        ? ((value: any) => subscriber.next(value))
        : subscriber;
    observers.push(callback);

    return {
        unsubscribe(): void {
            let index: number;
            while ((index = observers.indexOf(callback)) >= 0) {
                observers.splice(index, 1);
            }
        }
    };
}