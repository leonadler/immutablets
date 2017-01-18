import { immutableSymbol, immutableObserversSymbol } from './immutable-settings';
import { getFunctionName } from './utils';
import { AnonymousSubscription, ChangeList, ImmutableMetadata, Subscribable } from './immutable-interfaces';


/**
 * Get notified when properties of a @Immutable class instance changed.
 */
export function observeImmutable<T>(instance: T): Subscribable<ChangeList<T>> {
    const observers = (instance as any)[immutableObserversSymbol] as ((c: ChangeList<T>) => void)[];
    if (!observers) {
        const constructor = Object.getPrototypeOf(instance).constructor;
        const className = constructor && getFunctionName(constructor) || 'object class';
        throw new Error(className + ' is not decorated as @Immutable.');
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
