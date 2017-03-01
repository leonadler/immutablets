import { AnonymousSubscription, Subscribable, PartialObserver, ChangeList, TrackedMethodCall } from './immutable-interfaces';
import { StateActionBranch } from './state-action-branch';
import { createObservable, observeImmutable } from './observe-immutable';
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
    private observers: Array<(state: StateType) => void>;
    private callObservers: Array<(call: TrackedMethodCall<StateType>) => void>;
    private subscriptions: AnonymousSubscription[];

    constructor(actions: ActionsType) {
        this.actions = actions;
        this.observers = [];
        this.callObservers = [];
        this.subscriptions = [];

        this.combineInitialState();
        this.observeActionMethodCalls();
    }

    /** Remove all observers and free resources. */
    destroy(): void {
        this.observers.splice(0, this.observers.length);
        this.callObservers.splice(0, this.callObservers.length);
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    /** Observe calls of state action methods as an Observable of the passed Implementation. */
    observeCalls<ObservableType extends Subscribable<TrackedMethodCall<StateType>>>(observableClass: { new<T>(): ObservableType }): ObservableType;

    /** Observe calls of state action methods as plain-JS observable. */
    observeCalls(): Subscribable<TrackedMethodCall<StateType>>;

    observeCalls(observableClass?: any): Subscribable<any> {
        return createObservable(this.callObservers, observableClass);
    }


    /** Observe the application state as an Observable of the passed Implementation. */
    observeState<ObservableType extends Subscribable<StateType>>(observableClass: { new<T>(): ObservableType }): ObservableType;

    /** Observe the application state as a plain-JS observable. */
    observeState(): Subscribable<StateType>;

    observeState(observableClass?: any): Subscribable<StateType> {
        return createObservable(this.observers, observableClass);
    }


    /** Fully replace the application state (e.g. for undo/redo) */
    replaceState(newState: StateType): void {
        const changes: ChangeList = {};

        for (let key of objectKeys(newState)) {
            if ((this.currentState as any)[key] !== (newState as any)[key]) {
                changes[key] = {
                    oldValue: (this.currentState as any)[key],
                    newValue: (newState as any)[key]
                };
            }
        }

        if (Object.keys(changes).length > 0) {
            this.propertiesChanged(undefined, changes);
            this.emitChangedState();
        }
    }

    /** Should only be used in testing. Use action methods to change the application state. */
    setStateForTesting(newState: Partial<StateType>): void {
        const changes: ChangeList = {};

        for (let key of objectKeys(newState)) {
            changes[key] = {
                oldValue: (this.currentState as any)[key],
                newValue: (newState as any)[key]
            };
        }

        this.propertiesChanged(undefined, changes);
        this.emitChangedState();
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

    private observeActionMethodCalls(): void {
        // Observe all method calls of any action branch
        for (let branchName in this.actions) {
            const actionBranch = this.actions[branchName];
            const sub = observeImmutable(actionBranch).subscribe((call: TrackedMethodCall<any>) => {
                const stateBefore = this.currentState;
                if (call.changes) {
                    this.propertiesChanged(call.instance, call.changes);
                    this.emitChangedState();
                }
                this.emitMethodCall(call, stateBefore);
            });

            this.subscriptions.push(sub);
        }
    }

    // Apply changes to this.currentState and all action branches that use the changed property
    private propertiesChanged(instance: any, changes: ChangeList): void {
        const newState: any = { ...this.state as any };
        for (let changedProp in changes) {
            const newValue = changes[changedProp].newValue;
            newState[changedProp] = newValue;

            for (let branchToUpdateName in this.actions) {
                let branchToUpdate = this.actions[branchToUpdateName];
                if (branchToUpdate != instance && hasOwnProperty(branchToUpdate, changedProp)) {
                    (branchToUpdate as any)[changedProp] = newValue;
                }
            }
        }
        this.currentState = newState;
    }

    private emitChangedState(): void {
        for (let observer of this.observers) {
            observer(this.currentState);
        }
    }

    private emitMethodCall(actionMethodCall: TrackedMethodCall<any>, stateBefore: StateType): void {
        if (this.callObservers.length) {
            // Emit a tracked method call on "this".

            const actionName = Object.keys(this.actions)
                .filter(propertyKey => this.actions[propertyKey] === actionMethodCall.instance)[0];

            const callToEmit: TrackedMethodCall<any> = {
                instance: this,
                methodName: actionName + '.' + actionMethodCall.methodName,
                arguments: actionMethodCall.arguments,
                returnValue: actionMethodCall.returnValue,
                callDuration: actionMethodCall.callDuration,
                changes: actionMethodCall.changes,
                oldProperties: stateBefore,
                newProperties: this.currentState,
            };

            for (let observer of this.callObservers) {
                observer(callToEmit);
            }
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
