# Utility functions

To safely manage an immutable state with a small footprint, a number of utility functions are provided.
All of these are pure function and do not preserve a state of their own.


## `deepClone()` - Create a deep clone of an object structure

```TypeScript
const stateBefore = {
    heroes: [
        {
            firstName: 'Bruce',
            lastName: 'Wayne',
            heroName: 'Batman'
        },
        {
            firstName: 'Peter',
            lastName: 'Parker',
            heroName: 'Spiderman'
        }
    ],
    heroesLoaded: true
};

const stateAfter = deepClone(stateBefore);
// stateAfter is now equal-by-value, but uses different references for objects and arrays.
```

An optional parameter can be passed to clone only to a specific depth:

```TypeScript
const sameHeroes = deepClone(stateBefore, 2);
// sameHeroes now uses a new root object and a new array for 'heroes', but reuses the array values.
```


## `deepApplyWithReuse()` - Apply changes to a nested object hierarchy, but reuse unchanged objects

Merges object properties with objects of the source, reusing the original object whenever possible.

```TypeScript
const before = {
    users: {
        johndoe: {
            firstName: 'John',
            lastName: 'Doe',
            age: 34
        },
        janedoe: {
            firstName: 'Jane',
            lastName: 'Doe',
            age: 30
        }
    }
};
const after = deepApplyWithReuse(before, {
    users: {
        johndoe: {
            age: 34
        },
        janedoe: {
            age: 31
        }
    }
});

// johndoe has not changed, the reference is reused
assert(after !== before);
assert(after.users !== before.users);
assert(after.users.johndoe === before.users.johndoe);
assert(after.users.janedoe !== before.users.janedoe);
```

Arrays are overwritten - not merged - and array elements are only reused if they are deeply equal.

```TypeScript
const before = {
    cakes: [
        {
            name: 'lemon cake'
        },
        {
            name: 'carrot cake'
        }
    ]
};
const after = deepApplyWithReuse(before, {
    cakes: [
        {
            name: 'lemon cake'
        }
    ]
});

assert(after !== before);
assert(after.cakes !== before.cakes);
assert(after.cakes[0] === before.cakes[0]);
```


## `deepEqual()` - Compare a nested object by value

```TypeScript
deepEqual(1, 1); // -> true
deepEqual('x', 'y'); // -> false
deepEqual({a: 1}, {a: 1}); // -> true
deepEqual({b: 1}, {b: 2}); // -> false
deepEqual({c: 1}, {c: '1'}); // -> false

const a = { numbers: [ 1, 2, 3 ] };
const b = { numbers: [ 1, 2, 5 ] };
deepEqual(a, b); // -> false
```


## `deepFreeze()` - Apply `Object.freeze` on a nested object hierarchy

```TypeScript
'use strict';
const state = {
    users: {
        johndoe: {
            firstName: 'John',
            lastName: 'Doe',
        }
    }
};
deepFreeze(state);
state.users.johndoe.firstName = 'Max';
// TypeError: cannot assign to read only property 'firstName' of object '#<Object>'
```


## `flatEqual()` - Compare two inputs by value

```TypeScript
flatEqual(1, 1); // -> true
flatEqual('x', 'y'); // -> false
flatEqual({a: 1}, {a: 1}); // -> true
flatEqual({b: 1}, {b: 2}); // -> false
flatEqual({c: 1}, {c: '1'}); // -> false

const a = { numbers: [ 1, 2, 3 ] };
const b = { numbers: [ 1, 2, 3 ] };
flatEqual(a, b); // -> false ('numbers' is compared by reference)
```

## `map()` - Map values of objects / arrays

Similar to `Array.prototype.map`, but reuses references whenever possible.

```TypeScript
const input = { a: 3, b: 4, c: 5 };
const output = map(input, value => value * 2);
// output: { a: 6, b: 8, c: 10 }
```

```TypeScript
const fruits = [ { name: 'apple' }, { name: 'banana' }, { name: 'cherry' } ];
const changed = map(fruits, fruit => {
    return fruit.name === 'cherry' ? { name: 'coconut' } : fruit;
});
// changed: [ { name: 'apple' }, { name: 'banana' }, { name: 'coconut' } ]
// changed[0] === fruits[0]
// changed[1] === fruits[1]
// changed[2] !== fruits[2]
```
