# @Immutable decorator

## Why use an immutable state tree?

ImmutableTS is inspired by the ideas of [immutablejs](https://github.com/facebook/immutable-js),
[flux](https://github.com/facebook/flux) and [redux](https://github.com/reactjs/redux).

The very basic assumption is that any application spends way more time *reading* state
than *changing* state. Therefore, optimizing read access to application state for performance
is desirable and small performance penalties when changing state are negligible.

ImmutableTS supports the idea of *immutable data* and is optimized for storing the application state
in *one central immutable object*, meaning that objects do not change once created and that any
changes to an object must create a new object and store it in the state tree.

Change management - knowing if a part of the application needs to be updated or not - benefits
greatly from this. Using *immutable data structures* makes comparing application state a no-op.

```TypeScript
let stateBefore: HugeNestedObjectWith10MillionReferences;
let stateAfter: HugeNestedObjectWith10MillionReferences;
if (stateAfter === stateBefore) {
    // Nothing changed!
}
```

## „Don't call us, we call you“

*Polling* for changes (as it was done in angular 1), is not performant for large amount of data,
using *observable structures* (the publish-subscribe pattern) involves more work for the developer
but scales way better. Using observable data is built into angular2 and easy with react.

```TypeScript
class AppState {
    state: HugeApplicationStateObject;
    select<T>(mapFunction: (state: HugeApplicationStateObject) => T): T { ... }
}
```

```TypeScript
@Component({
    name: 'product-name',
    template: `<p>Name: {{ productName | async }}</p>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
class ProductNameComponent {
    productName: Observable<string>;
    constructor(state: AppState) {
        // productName gets notified every time the selection result changes
        this.productName = state.select(state =>
            state.products[state.productView.currentProductId].name);
    }
}
```


## What happens behind the scenes

```TypeScript
@Immutable
class SomeClass {
    a: string;
    b: number;
    someMethod() { }
}
```

The result of the example above is very similar to the following pseudo code:

```TypeScript
class ImmutableSomeClass extends SomeClass {
    someMethod() {
        const original = flatClone(this);
        super.someMethod();
        if (inTestingOrDevelopment() && methodChangedPropertiesOfExistingObject()) {
            throw new MethodNotImmutableError();
        }
        if (anyPropertiesChanged(original, this)) {
            broadcastChangesToObservers();
        }
    }
}
```

## More complex and nested application states

For more complex states, using creating a _flat_ clone would not be enough:

```TypeScript
interface WarehouseApplicationState {
    products: {
        list: number[];
        loading: boolean;
        sortBy: string;
    },
    entities: {
        products: {
            [id: number]: {
                id: number;
                name: string;
                description: string;
                ean: string;
                freeShipping: boolean;
            }
        }
        manufacturers: {
            [id: number]: {
                id: number;
                companyName: string;
                products: number[];
            }
        }
    }
}
```

```TypeScript
// Adding a product to the list of its manufacturers would be complicated:
@Immutable
class WarehouseState {
    state: WarehouseApplicationState;

    addProductToManufacturer(productId: number, manufacturerId: number) {
        this.state = { ...this.state,
            entities: { ...this.state.entities,
                manufacturers: { ...this.state.manufacturers,
                    [manufacturerId]: { ...this.state.manufacturers[manufacturerId],
                        products: [...this.state.manufacturers[manufacturerId].products, productId[]
                    }
                }
            }
        };
    }
}
```

When the application state grows more complex, using one single huge class for all actions (methods)
is discuraged. Using [ImmutableStateStore](immutable-state-store.md) for such cases is preferable -
it composes the application state and its actions from separate, smaller classes.
