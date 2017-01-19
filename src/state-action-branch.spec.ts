import { expect } from 'chai';
import { StateActionBranch } from './state-action-branch';
import { Immutable } from './immutable-decorator';


describe('StateActionBranch', () => {

    it('can not be instantiated directly', () => {
        function testCase() {
            let instance = new (StateActionBranch as any)({
                uses: 'testBranch',
                initialState: {
                    testBranch: { a: 1, b: 2 }
                }
            });
        }

        expect(testCase).to.throw('StateActionBranch must be derived in a new class');
    });

    it('can not be inherited from a class not marked as @Immutable', () => {
        function testCase() {
            interface FruitBasketState {
                fruits: { name: string }[];
            }

            class NotImmutableFruitBasket extends StateActionBranch<FruitBasketState> {
                constructor() {
                    super({
                        uses: 'fruits',
                        initialState: {
                            fruits: []
                        }
                    });
                }
            }

            let instance = new NotImmutableFruitBasket();
        }

        expect(testCase).to.throw('NotImmutableFruitBasket inherits StateActionBranch but is not marked as Immutable.');
    });

    it('can be inherited from an @Immutable class', () => {
        function testCase() {
            interface FruitBasketState {
                fruits: { name: string }[];
            }

            @Immutable()
            class ImmutableFruitBasket extends StateActionBranch<FruitBasketState> {
                constructor() {
                    super({
                        uses: 'fruits',
                        initialState: {
                            fruits: []
                        }
                    });
                }
            }

            let instance = new ImmutableFruitBasket();
        }

        expect(testCase).not.to.throw();
    });

    it('does not expose "initialState" as enumerable', () => {
        interface FruitBasketState {
            fruits: { name: string }[];
        }

        @Immutable()
        class ImmutableFruitBasket extends StateActionBranch<FruitBasketState> {
            constructor() {
                super({
                    uses: 'fruits',
                    initialState: {
                        fruits: []
                    }
                });
            }
        }

        let instance = new ImmutableFruitBasket();

        expect(instance).to.have.property('initialState');
        expect(instance).to.have.ownPropertyDescriptor('initialState');
        const descriptor = Object.getOwnPropertyDescriptor(instance, 'initialState');
        expect(descriptor.enumerable).to.be.false;
    });
});
