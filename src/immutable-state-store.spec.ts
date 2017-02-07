import { expect } from 'chai';

import { CloneDepth } from './clone-depth-decorator';
import { Immutable } from './immutable-decorator';
import { ImmutableStateStore } from './immutable-state-store';
import { observeImmutable } from './observe-immutable';
import { StateActionBranch } from './state-action-branch';
import { TrackedMethodCall } from './immutable-interfaces';


describe('ImmutableStateStore', () => {

    let actions: ActionTypes;
    let store: ImmutableStateStore<ApplicationState, ActionTypes>;

    beforeEach(() => {
        actions = {
            shoppingCart: new ShoppingCartActions(),
            warehouse: new WarehouseActions()
        };
        store = new ImmutableStateStore<ApplicationState, ActionTypes>(actions);
    });

    afterEach(() => {
        store.destroy();
    });

    it('can be constructed with multiple state branches', () => {
        expect(store).not.to.be.undefined;
    });

    it('combines the intialState of all action branches', () => {
        expect(store.state).to.deep.equal({
            shoppingCart: {
                items: [],
                lastAddedTime: undefined
            },
            warehouse: {
                stockKeepingUnits: {},
                salePercentage: 0
            }
        });
    });

    it('updates the state when an action changes it', () => {
        expect(store.state.shoppingCart.items).to.have.lengthOf(0);
        expect(store.state.warehouse.salePercentage).to.equal(0);

        store.actions.shoppingCart.addToCart(1234);
        expect(store.state.shoppingCart.items).to.have.lengthOf(1);
        expect(store.state.warehouse.salePercentage).to.equal(0);

        store.actions.warehouse.startSale(7);
        expect(store.state.warehouse.salePercentage).to.equal(7);
    });

    describe('observeCalls()', () => {

        it('emits method calls when subscribed to', () => {
            const emittedCalls = [] as TrackedMethodCall<ApplicationState>[];
            const sub = store.observeCalls()
                .subscribe(call => emittedCalls.push(call));

            expect(emittedCalls).to.have.lengthOf(0);

            store.actions.shoppingCart.addToCart(1234);

            expect(emittedCalls).to.have.lengthOf(1);
            expect(emittedCalls[0].instance).to.equal(store);
            expect(emittedCalls[0].methodName).to.equal('shoppingCart.addToCart');
            expect(emittedCalls[0].arguments).to.deep.equal([1234]);

            store.actions.warehouse.startSale(3);

            expect(emittedCalls).to.have.lengthOf(2);
            expect(emittedCalls[1].instance).to.equal(store);
            expect(emittedCalls[1].methodName).to.equal('warehouse.startSale');
            expect(emittedCalls[1].arguments).to.deep.equal([3]);

            sub.unsubscribe();
        });

        it('emit on method call even when the state is not changed', () => {
            const emittedCalls = [] as TrackedMethodCall<ApplicationState>[];
            const sub = store.observeCalls()
                .subscribe(call => emittedCalls.push(call));

            expect(emittedCalls).to.have.lengthOf(0);

            const initialState = store.state;
            expect(initialState.warehouse.salePercentage).to.equal(0);

            store.actions.warehouse.startSale(0);
            expect(emittedCalls).to.have.lengthOf(1);
            expect(emittedCalls[0].changes).to.be.undefined;

            sub.unsubscribe();
        });

        it('can be unsubscribed from', () => {
            const emittedCalls = [] as TrackedMethodCall<ApplicationState>[];
            const sub = store.observeCalls()
                .subscribe(call => emittedCalls.push(call));

            expect(emittedCalls).to.have.lengthOf(0);

            store.actions.shoppingCart.addToCart(1234);
            expect(emittedCalls).to.have.lengthOf(1);

            sub.unsubscribe();

            store.actions.shoppingCart.addToCart(7777);
            expect(emittedCalls).to.have.lengthOf(1);

            store.actions.warehouse.startSale(3);
            expect(emittedCalls).to.have.lengthOf(1);
        });

        it('does not emit after destroy()', () => {
            const emittedCalls = [] as TrackedMethodCall<ApplicationState>[];
            const sub = store.observeCalls()
                .subscribe(call => emittedCalls.push(call));

            expect(emittedCalls).to.have.lengthOf(0);

            store.actions.shoppingCart.addToCart(1234);
            expect(emittedCalls).to.have.lengthOf(1);

            store.destroy();

            store.actions.shoppingCart.addToCart(7777);
            expect(emittedCalls).to.have.lengthOf(1);

            store.actions.warehouse.startSale(3);
            expect(emittedCalls).to.have.lengthOf(1);
        });

    });

    describe('observeState()', () => {

        it('emits state changes when subscribed to', () => {
            const emittedStates = [] as ApplicationState[];
            const sub = store.observeState()
                .subscribe(state => emittedStates.push(state));

            expect(emittedStates).to.have.lengthOf(0);

            const initialState = store.state;
            expect(initialState).to.deep.equal({
                shoppingCart: {
                    items: [],
                    lastAddedTime: undefined
                },
                warehouse: {
                    stockKeepingUnits: {},
                    salePercentage: 0
                }
            });

            store.actions.shoppingCart.addToCart(1234);

            expect(emittedStates).to.have.lengthOf(1);
            expect(emittedStates[0].shoppingCart.items).to.deep.equal([{ sku: 1234, amount: 1 }]);
            expect(emittedStates[0].warehouse).to.equal(initialState.warehouse);

            store.actions.warehouse.startSale(3);

            expect(emittedStates).to.have.lengthOf(2);
            expect(emittedStates[1].shoppingCart).to.equal(emittedStates[0].shoppingCart);
            expect(emittedStates[1].warehouse).to.deep.equal({
                stockKeepingUnits: {},
                salePercentage: 3
            });

            sub.unsubscribe();
        });

        it('does not emit the state when a method call does not change it', () => {
            const emittedStates = [] as ApplicationState[];
            const sub = store.observeState()
                .subscribe(state => emittedStates.push(state));

            expect(emittedStates).to.have.lengthOf(0);

            const initialState = store.state;
            expect(initialState.warehouse.salePercentage).to.equal(0);

            store.actions.warehouse.startSale(0);
            expect(emittedStates).to.have.lengthOf(0);

            sub.unsubscribe();
        });

        it('can be unsubscribed from', () => {
            const emittedStates = [] as ApplicationState[];
            const sub = store.observeState().subscribe(state => emittedStates.push(state));

            expect(emittedStates).to.have.lengthOf(0);

            store.actions.shoppingCart.addToCart(1234);
            expect(emittedStates).to.have.lengthOf(1);

            sub.unsubscribe();

            store.actions.shoppingCart.addToCart(7777);
            expect(emittedStates).to.have.lengthOf(1);

            store.actions.warehouse.startSale(3);
            expect(emittedStates).to.have.lengthOf(1);
        });

        it('does not emit after destroy()', () => {
            const emittedStates = [] as ApplicationState[];
            const sub = store.observeState().subscribe(state => emittedStates.push(state));

            expect(emittedStates).to.have.lengthOf(0);

            store.actions.shoppingCart.addToCart(1234);
            expect(emittedStates).to.have.lengthOf(1);

            store.destroy();

            store.actions.shoppingCart.addToCart(7777);
            expect(emittedStates).to.have.lengthOf(1);

            store.actions.warehouse.startSale(3);
            expect(emittedStates).to.have.lengthOf(1);
        });

    });

    describe('replaceState()', () => {

        it('emits a change if the new state is different', () => {
            const initialState = store.state;
            const emittedStates = [] as ApplicationState[];
            const sub = store.observeState().subscribe(state => emittedStates.push(state));
            store.replaceState({
                shoppingCart: {
                    items: [
                        { sku: 7777, amount: 2 }
                    ],
                    lastAddedTime: new Date()
                },
                warehouse: {
                    salePercentage: 5,
                    stockKeepingUnits: {
                        [7777]: {
                            manufacturer: 'Banana Inc.',
                            name: 'Bananaphone 7',
                            price: 799
                        }
                    }
                }
            });
            expect(emittedStates).to.have.lengthOf(1);
            expect(store.state.warehouse.salePercentage).to.equal(5);
            expect(store.actions.warehouse['warehouse'].salePercentage).to.equal(5);
            expect(store.state === initialState).to.be.false;
        });

        it('does not change the state if the new state is equal to the old state', () => {
            const initialState = store.state;
            const emittedStates = [] as ApplicationState[];
            const sub = store.observeState().subscribe(state => emittedStates.push(state));
            store.replaceState(store.state);
            store.replaceState(store.state);
            expect(emittedStates).to.have.lengthOf(0);
            expect(store.state === initialState).to.be.true;
        });

        it('keeps state branches which have the same reference', () => {
            const initialState = store.state;
            const emittedStates = [] as ApplicationState[];
            const sub = store.observeState().subscribe(state => emittedStates.push(state));
            store.replaceState({
                shoppingCart: initialState.shoppingCart,
                warehouse: { ...initialState.warehouse, salePercentage: 4 }
            });
            expect(emittedStates).to.have.lengthOf(1);
            expect(store.state === initialState).to.be.false;
            expect(store.state.shoppingCart === initialState.shoppingCart).to.be.true;
            expect(store.state.warehouse === initialState.warehouse).to.be.false;
        });

    });

});

interface ShoppingCartState {
    items: {
        sku: number;
        amount: number;
    }[];
    lastAddedTime: Date | undefined;
}

interface WarehouseState {
    stockKeepingUnits: {
        [skuId: number]: {
            name: string;
            manufacturer: string;
            price: number;
        }
    };
    salePercentage: number;
}

interface ApplicationState {
    shoppingCart: ShoppingCartState;
    warehouse: WarehouseState;
}

type ActionTypes = {
    shoppingCart: ShoppingCartActions;
    warehouse: WarehouseActions;
}

@Immutable()
class ShoppingCartActions extends StateActionBranch<ApplicationState> {
    @CloneDepth(1)
    private shoppingCart: ShoppingCartState;

    constructor() {
        super({
            uses: 'shoppingCart',
            initialState: {
                shoppingCart: {
                    items: [],
                    lastAddedTime: undefined
                }
            }
        });
    }

    addToCart(newItemSku: number) {
        const item = this.shoppingCart.items.filter(item => item.sku = newItemSku)[0];
        if (item) {
            const index = this.shoppingCart.items.indexOf(item);
            this.shoppingCart.items = this.shoppingCart.items.splice(index, 1, { sku: newItemSku, amount: item.amount + 1 });
        } else {
            this.shoppingCart.items = [...this.shoppingCart.items, { sku: newItemSku, amount: 1 }]
        }
        this.shoppingCart.lastAddedTime = new Date();
    }
}

@Immutable()
class WarehouseActions extends StateActionBranch<ApplicationState> {
    @CloneDepth(1)
    private warehouse: WarehouseState;

    constructor() {
        super({
            uses: 'warehouse',
            initialState: {
                warehouse: {
                    stockKeepingUnits: {},
                    salePercentage: 0
                }
            }
        });
    }

    startSale(percentageOff: number) {
        this.warehouse.salePercentage = percentageOff;
    }
}
