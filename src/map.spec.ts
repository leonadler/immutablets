import { expect } from 'chai';
import { map } from './map';

const doubleOddNumbers = (n: number) => n % 2 === 0 ? 2 * n : n;

describe('map()', () => {
    it('creates a new array when a number property changes', () => {
        let arrA = [1, 2, 3, 4, 5, 6];
        let arrB = map(arrA, doubleOddNumbers);
        expect(arrA).not.to.equal(arrB);
    });

    it('does not create a new array when no properties change', () => {
        let arrA = [1, 3, 5, 7];
        let arrB = map(arrA, doubleOddNumbers);
        expect(arrA).to.equal(arrB);
    });

    it('creates a new array when a property of an element changes', () => {
        let arrA = [{ name: 'Steven', age: 29 }, { name: 'Eve', age: 30 }];
        let arrB = map(arrA, person => ({ name: person.name, age: 30 }));

        expect(arrA).not.to.equal(arrB);
        expect(arrA[0]).not.to.equal(arrB[0]);
        expect(arrA[1]).to.equal(arrB[1]);
    });

    it('returns the same array when no properties are changed', () => {
        let arrA = [{ name: 'Steven', age: 29 }, { name: 'Eve', age: 30 }];
        let arrB = map(arrA, person => ({ name: person.name, age: person.age }));

        expect(arrA).to.equal(arrB);
        expect(arrA[0]).to.equal(arrB[0]);
        expect(arrA[1]).to.equal(arrB[1]);
    });

    it('creates a new object when a property value changes', () => {
        let objA = { 'Steven': 29, 'Eve': 30 };
        let objB = map(objA, age => age + 1);

        expect(objA).not.to.equal(objB);
        expect(objA).to.deep.equal({ Steven: 29, Eve: 30 });
        expect(objB).to.deep.equal({ Steven: 30, Eve: 31 });
    });

    it('returns the same object when no properties are changed', () => {
        let objA = { 'Steven': 29, 'Eve': 30 };
        let objB = map(objA, age => age < 18 ? 18 : age);

        expect(objA).to.equal(objB);
    });
});
