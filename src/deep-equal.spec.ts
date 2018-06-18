import { expect } from 'chai';
import { deepEqual } from './deep-equal';

describe('deepEqual()', () => {

    it('returns true for (5, 5)', () => {
        expect(deepEqual(5, 5)).to.be.true;
    });

    it('returns true for ("a", "a")', () => {
        expect(deepEqual('a', 'a')).to.be.true;
    });

    it('returns true for (null, null)', () => {
        expect(deepEqual(null, null)).to.be.true;
    });

    it('returns true for (undefined, undefined)', () => {
        expect(deepEqual(undefined, undefined)).to.be.true;
    });

    it('returns true for (NaN, NaN)', () => {
        expect(deepEqual(Number.NaN, Number.NaN)).to.be.true;
    });

    it('returns true for (Infinity, Infinity)', () => {
        expect(deepEqual(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)).to.be.true;
    });

    it('returns false for (+Infinity, -Infinity)', () => {
        expect(deepEqual(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY)).to.be.false;
    });

    it('returns true for (+0, -0)', () => {
        expect(deepEqual(1 * 0, -1 * 0)).to.be.true;
    });

    it('returns true for equal dates', () => {
        expect(deepEqual(new Date(), new Date())).to.be.true;
        expect(deepEqual(new Date(1234567890123), new Date(1234567890123))).to.be.true;
    });

    it('returns false for different dates', () => {
        let dateA = new Date();
        let dateB = new Date(Number(dateA) + 1);
        expect(deepEqual(dateA, dateB)).to.be.false;
    });

    it('returns true for (/abc/, /abc/)', () => {
        expect(deepEqual(/abc/, /abc/)).to.be.true;
    });

    it('returns true for (/a(b)c/, /a(b)c/)', () => {
        expect(deepEqual(/a(b)c/, /a(b)c/)).to.be.true;
    });

    it('returns false for (/abc/i, /abc/)', () => {
        expect(deepEqual(/abc/i, /abc/)).to.be.false;
    });

    it('returns false for (/abc/, /a(b)c/)', () => {
        expect(deepEqual(/abc/, /a(b)c/)).to.be.false;
    });

    it('returns true for ({a: 1}, {a: 1})', () => {
        expect(deepEqual({a: 1}, {a: 1})).to.be.true;
    });

    it('returns false for ({a: 1}, {a: "1"})', () => {
        expect(deepEqual({a: 1}, {a: '1'} as any)).to.be.false;
    });

    it('returns false for ({a: 1}, {a: 2})', () => {
        expect(deepEqual({a: 1}, {a: 2})).to.be.false;
    });

    it('returns true for ({a: 1, b: 2}, {b: 2, a: 1})', () => {
        expect(deepEqual({a: 1, b: 2}, {b: 2, a: 1})).to.be.true;
    });

    it('returns true for ({a: {b: 1}}, {a: {b: 1}})', () => {
        expect(deepEqual({a: {b: 1}}, {a: {b: 1}})).to.be.true;
    });

    it('returns false for ({a: {b: 1}}, {a: {b: 2}})', () => {
        expect(deepEqual({a: {b: 1}}, {a: {b: 2}})).to.be.false;
    });

    it('returns false for ({a: 1, b: 2}, {a: 1}})', () => {
        expect(deepEqual({a: 1, b: 2}, {a: 1} as any)).to.be.false;
    });

    it('returns false for ({a: 1}, {a: 1, b: 2}})', () => {
        expect(deepEqual({a: 1}, {a: 1, b: 2} as any)).to.be.false;
    });

    it('returns true for ([1, 2, 3], [1, 2, 3])', () => {
        expect(deepEqual([1, 2, 3], [1, 2, 3])).to.be.true;
    });

    it('returns false for ([1, 2, 3], [3, 2, 1])', () => {
        expect(deepEqual([1, 2, 3], [3, 2, 1])).to.be.false;
    });

    it('returns true for ([{a: 1}, {b: 2}], [{a: 1}, {b: 2}])', () => {
        expect(deepEqual([{a: 1}, {b: 2}], [{a: 1}, {b: 2}])).to.be.true;
    });

    it('returns false for ([{a: 1}, {b: 2}], [{b: 2}, {a: 1}])', () => {
        expect(deepEqual([{a: 1}, {b: 2}], [{b: 2}, {a: 1}])).to.be.false;
    });

    it('returns true for ({fn: functionA}, {fn: functionA})', () => {
        const functionA = () => {};
        expect(deepEqual({fn: functionA}, {fn: functionA})).to.be.true;
    });

    it('returns false for ({fn: functionA}, {fn: functionB})', () => {
        const functionA = () => {};
        const functionB = () => {};
        expect(deepEqual({fn: functionA}, {fn: functionB})).to.be.false;
    });

    it('returns false for (Object, SomeClass)', () => {
        class SomeClass { };
        expect(deepEqual({}, new SomeClass())).to.be.false;
    });

    it('returns true for (SomeClass {a: 1}, SomeClass {a: 1})', () => {
        class SomeClass { a!: number; };
        let objA = new SomeClass(); objA.a = 1;
        let objB = new SomeClass(); objB.a = 1;
        expect(deepEqual(objA, objB)).to.be.true;
    });

    it('returns false for (SomeClass {a: 1}, SomeClass {a: 2})', () => {
        class SomeClass { a!: number; }
        let objA = new SomeClass(); objA.a = 1;
        let objB = new SomeClass(); objB.a = 2;
        expect(deepEqual(objA, objB)).to.be.false;
    });

    it('returns false for (SomeClass {a: 1}, OtherClass {a: 1})', () => {
        class SomeClass { a!: number; };
        let objA = new SomeClass(); objA.a = 1;

        class OtherClass { a!: number; };
        let objB = new OtherClass(); objB.a = 1;

        expect(deepEqual(objA, objB)).to.be.false;
    });

    it('returns true for deeply equal nested objects', () => {
        let original = {
            coords: { x: 5, y: 3.14 },
            name: 'Spaceship',
            pilot: { id: 1, name: 'Pilot one' }
        };
        let copy = {
            coords: { x: 5, y: 3.14 },
            name: 'Spaceship',
            pilot: { id: 1, name: 'Pilot one' }
        };

        expect(deepEqual(original, copy)).to.be.true;
    });

    it('returns false for not-deep-equal nested objects', () => {
        let ship = {
            coords: { x: 5, y: 3.14 },
            name: 'Spaceship',
            pilot: { id: 1, name: 'Pilot one' }
        };
        let otherShip = {
            coords: { x: 5, y: 3.14 },
            name: 'Spaceship',
            pilot: { id: 1, name: 'Pilot two' }
        };

        expect(deepEqual(ship, otherShip)).to.be.false;
    });

});
