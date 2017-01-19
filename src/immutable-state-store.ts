import { AnonymousSubscription, Subscribable, ChangeList, PartialObserver } from './immutable-interfaces';
import { StateActionBranch } from './state-action-branch';
import { observeImmutable } from './observe-immutable';
import { hasOwnProperty, objectKeys } from './utils';

/**
 * Implements an observable store with separate state action branches.
 */
export class ImmutableStateStore<StateType, ActionsType extends { [key: string]: StateActionBranch<StateType> }> {
    get state(): StateType {
        return this.currentState;
    }
    readonly actions: ActionsType;

    private currentState: StateType;
    private observers: ((state: StateType) => void)[];
    private subscriptions: AnonymousSubscription[];

    constructor(actions: ActionsType) {
        this.actions = actions;
        this.observers = [];
        this.subscriptions = [];

        this.combineInitialState();
        this.observeChangesInActions();
    }

    /** Remove all observers and free resources. */
    destroy(): void {
        this.observers.splice(0, this.observers.length);
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    /** Observe the application state as an Observable of the passed Implementation. */
    asObservable<ObservableType extends Subscribable<StateType>>(observableClass: { new<T>(): ObservableType }): ObservableType;

    /** Observe the application state as a plain-JS observable. */
    asObservable(): Subscribable<StateType>;

    asObservable(observableClass?: any): Subscribable<StateType> {
        // Return an instance of a passed Observable implementation
        if (observableClass) {
            return new observableClass((subscriber: any) => this.handleSubscription(subscriber));
        }

        // Return a plain JavaScript observable
        return {
            subscribe: (subscriber: any) => this.handleSubscription(subscriber)
        };
    }

    /** Should only be used in testing. Use action methods to change the application state. */
    setStateForTesting(newState: StateType): void {
        const changeList: ChangeList = {
            instance: undefined,
            changes: {}
        };

        for (let key of objectKeys(newState)) {
            changeList.changes[key] = {
                oldValue: this.currentState && (this.currentState as any)[key],
                newValue: (newState as any)[key]
            };
        }

        this.propertiesChanged(changeList);
    }

    private combineInitialState(): void {
        // Combine initial state properties of all branches into one object.
        const initialState = {} as any;

        for (let branchName in this.actions) {
            const actionBranch: any = this.actions[branchName];
            for (let propKey of objectKeys(actionBranch)) {
                if (actionBranch[propKey] !== undefined || !(propKey in initialState)) {
                    initialState[propKey] = actionBranch[propKey];
                }
            }
        }

        this.currentState = initialState;

        // Apply initial state to all action branches
        for (let branchName in this.actions) {
            const actionBranch: any = this.actions[branchName];
            for (let propKey of objectKeys(actionBranch)) {
                actionBranch[propKey] = initialState[propKey]
            }
        }
    }

    private observeChangesInActions(): void {
        // Observe all changes done in methods of any action branch
        for (let branchName in this.actions) {
            const actionBranch = this.actions[branchName];
            const sub = observeImmutable(actionBranch).subscribe(changeList => {
                this.propertiesChanged(changeList);
            });

            this.subscriptions.push(sub);
        }
    }

    private propertiesChanged(changeList: ChangeList): void {
        // Apply changes to this.currentState and all action branches that use the changed property
        let newState: any = { ...this.state as any };
        for (let changedProp in changeList.changes) {
            const newValue = changeList.changes[changedProp].newValue;
            newState[changedProp] = newValue;

            for (let branchToUpdateName in this.actions) {
                let branchToUpdate = this.actions[branchToUpdateName];
                if (branchToUpdate != changeList.instance && hasOwnProperty(branchToUpdate, changedProp)) {
                    (branchToUpdate as any)[changedProp] = newValue;
                }
            }
        }

        // Notify observers
        this.currentState = newState;
        for (let observer of this.observers) {
            observer(newState);
        }
    }

    private handleSubscription(subscriber: any): AnonymousSubscription {
        const callback = subscriber.next
            ? (newState: StateType) => subscriber.next(newState)
            : subscriber;
        this.observers.push(callback);

        return {
            unsubscribe: () => {
                let index: number;
                while ((index = this.observers.indexOf(callback)) >= 0) {
                    this.observers.splice(index, 1);
                }
            }
        };
    }
}
