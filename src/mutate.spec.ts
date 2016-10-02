import { expect } from 'chai';
import { mutate } from './mutate';

describe('mutate()', () => {
    it('creates a new object when a property changes', () => {
        let objA = { name: 'Steven', age: 29 };
        let objB = mutate(objA, steven => steven.age = 30);

        expect(objA).not.to.equal(objB);
    });

    it('returns the same object when no properties are touched', () => {
        let objA = { name: 'Steven', age: 29 };
        let objB = mutate(objA, steven => {});

        expect(objA).to.equal(objB);
    });

    it('returns the same object when no properties are changed', () => {
        let objA = { name: 'Steven', age: 29 };
        let objB = mutate(objA, steven => steven.age = 29);

        expect(objA).to.equal(objB);
    });

    it('keeps classes intact', () => {
        class Color {
            constructor(public color: string) {};
        }

        let red = new Color('red');
        let orange = mutate(red, currentColor => currentColor.color = 'orange');

        expect(red).not.to.equal(orange);
        expect(red).to.be.instanceof(Color);
        expect(orange).to.be.instanceof(Color);
        expect(red.color).to.equal('red');
        expect(orange.color).to.equal('orange');
    });

    it('mutate() works with arrays', () => {
        let arrayA = [
            { name: 'one', value: 1 },
            { name: 'two', value: 2 },
            { name: 'three', value: 3 },
            { name: 'four', value: 4 }
        ];

        let arrayB = mutate(arrayA, list => {
            for (let index = 0; index < list.length; index++) {
                list[index] = mutate(list[index],
                    obj => {
                        if (obj.value % 2 === 0) {
                            obj.value *= 2
                        }
                    });
            }
        });

        expect(arrayA).not.to.equal(arrayB);
    });

    it('accepts a third parameter that is set as the "this" value for the mutator function', () => {
        let obj = {};
        let thisArg: any;
        mutate({}, function () {
            thisArg = this;
        }, obj);

        expect(thisArg).to.equal(obj);
    });

    it('only compares values that change in the output', () => {
        let calls: string[] = [];
        let obj = {
            get a() { calls.push('a'); return 'A'; },
            get b() { calls.push('b'); return 'B'; },
            set b(val: any) { },
            get c() { calls.push('c'); return 'C'; }
        };

        mutate(obj, obj => obj.b = 47);

        expect(calls).to.deep.equal(['a', 'b', 'c', 'b']);
        expect(calls).not.to.deep.equal(['a', 'b', 'c', 'a', 'b', 'c']);
    });
});
