# How to use ImmutableTS

If your application state is fairly simple, you can use a single class decorated as `@Immutable`.
Any property of class instances is treated as part of your application state and emits the app state when changed.
Methods of the class should be the only way to change the state.

## Example for a simple application state

```TypeScript
// interfaces.d.ts
interface BakeryState {
    breads: { [name: string]: Bread };
    inventory: { [breadName: string]: number };
    sale: undefined | {
        breadName: string;
        percentage: number;
    };
    baking: Bread[];
}

interface Bread {
    name: string;
    calories: number;
    isFullGrain: boolean;
}
```

```TypeScript
// app-state.ts
import { Immutable, CloneDepth, observeImmutable } from 'immutablets';
import { Observable, Subscriber } from 'rxjs';
import { BakeryState, Bread } from './interfaces.d.ts';

@Immutable()
class BakeryAppState {
    @CloneDepth(1)
    state: BakeryState = {
        breads: {},
        inventory: {},
        sale: undefined,
        baking: []
    };

    startBaking(bread: Bread) {
        this.state.baking = [...this.state.baking, bread];
    }

    breadFinished(bread: Bread) {
        this.state.baking = this.state.baking.filter(b => b != bread);
        if (!this.state.breads[bread.name]) {
            this.state.breads = {
                ...this.state.breads,
                [bread.name]: bread
            };
        }
        this.state.inventory = {
            ...this.state.inventory,
            [bread.name]: (this.state.inventory[bread.name] || 0) + 1
        };
    }

    startSale(breadOnSale: Bread, percentage: number) {
        this.state.sale = {
            breadName: breadOnSale.name,
            percentage
        };
    }

    observe<T>(selector: (state: BakeryAppState) => T): Observable<T> {
        return new Observable((subscriber: Subscriber<BakeryAppState> => {
            const sub = observeImmutable(this).subscribe(() => subscriber.next(this.state));
            return sub.unsubscribe();
        })
        .map(selector)
        .distinctUntilUnchanged();
    }
}
```

```TypeScript
// Example angular component that observes changes
@Component({
    template: `<strong *ngIf="breadOnSale | async">On Sale: {{ (breadOnSale | async)?.name }}</strong>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
class SaleComponent {
    breadOnSale: Observable<Bread | undefined>;
    constructor(private state: BakeryAppState) { }
    ngOnInit() {
        this.breadOnSale = state.observe(state => state.sale && state.breads[state.sale.breadName]);

        // Log changes to console for testing
        this.breadOnSale.subscribe(bread => console.info('Bread on sale: ', bread));
    }
}
```
