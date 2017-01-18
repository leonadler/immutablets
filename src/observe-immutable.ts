import { getFunctionName } from './utils';
import { AnonymousSubscription, ChangeList, ImmutableMetadata, Subscribable } from './immutable-interfaces';
import { immutableObserversSymbol } from './immutable-settings';


/**
 * Get notified when properties of a @Immutable class instance change.
 * To use the rxjs observables your project uses, you need to pass the `Observable` class.
 */
export function observeImmutable<T, O extends Subscribable<ChangeList<T>>>(instance: T, observableClass: { new(): O }): O;

/**
 * Get notified when properties of a @Immutable class instance change.
 */
export function observeImmutable<T>(instance: T): Subscribable<ChangeList<T>>;


export function observeImmutable<T>(instance: T, observableClass?: any): Subscribable<ChangeList<T>> {
    const observers = (instance as any)[immutableObserversSymbol] as ((changeList: ChangeList<any>) => void)[];
    if (!observers) {
        const constructor = Object.getPrototypeOf(instance).constructor;
        const className = constructor && getFunctionName(constructor) || 'object class';
        throw new Error(className + ' is not decorated as @Immutable.');
    }

    if (observableClass) {
        // Use a RXJS implementation passed by the user.
        return new observableClass((subscriber: any) => {
            const listener = (changeList: ChangeList<T>) => subscriber.next(changeList);
            observers.push(listener);
            return () => {
                let index: number;
                while ((index = observers.indexOf(listener)) >= 0) {
                    observers.splice(index, 1);
                }
            };
        });
    }

    return {
        subscribe(observer: any): AnonymousSubscription {
            const callback = observer.next
                ? ((value: any) => observer.next(value))
                : ((value: any) => observer(value));
            observers.push(callback);

            return {
                unsubscribe(): void {
                    let index: number;
                    while ((index = observers.indexOf(callback)) >= 0) {
                        observers.splice(index, 1);
                    }
                }
            }
        }
    }
}
