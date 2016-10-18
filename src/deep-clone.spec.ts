import { expect } from 'chai';
import { deepClone } from './deep-clone';

describe('deepClone()', () => {

    describe('for primitives', () => {

        it('returns number values unchanged', () => {
            expect(deepClone(5)).to.equal(5);
            expect(deepClone(1234567890)).to.equal(1234567890);
        });

        it('returns special number values unchanged', () => {
            expect(Number.isNaN(deepClone(Number.NaN))).to.be.true;
            expect(deepClone(Number.POSITIVE_INFINITY)).to.equal(Number.POSITIVE_INFINITY);
            expect(deepClone(Number.NEGATIVE_INFINITY)).to.equal(Number.NEGATIVE_INFINITY);
            expect(1 / deepClone(-1 * 0)).to.equal(Number.NEGATIVE_INFINITY);
        });

        it('returns string values unchanged', () => {
            expect(deepClone('')).to.equal('');
            expect(deepClone('abc')).to.equal('abc');
            expect(deepClone('😀')).to.equal('😀');
        });

        it('returns boolean values unchanged', () => {
            expect(deepClone(false)).to.be.false;
            expect(deepClone(true)).to.be.true;
        });

        it('returns null and undefined values unchanged', () => {
            expect(deepClone(null)).to.be.null;
            expect(deepClone(undefined)).to.be.undefined;
        });

    });

    describe('for objects', () => {

        it('copies properties', () => {
            const original = { x: 15, name: 'fifteen' };
            const clone = deepClone(original);
            expect(clone.x).to.equal(15);
            expect(clone.name).to.equal('fifteen');
        });

        it('returns a new object', () => {
            const original = { };
            const clone = deepClone(original);
            expect(clone).to.deep.equal(original);
            expect(clone).not.to.equal(original);
        });

        it('creates deep copies of array properties', () => {
            const original = { list: [1, 2, 3] };
            const clone = deepClone(original);
            expect(clone).to.deep.equal(original);
            expect(clone.list).not.to.equal(original.list);
        });

        it('creates deep copies of object properties', () => {
            const original = { coords: { x: 5, y: 7 } };
            const clone = deepClone(original);
            expect(clone).to.deep.equal(original);
            expect(clone.coords).not.to.equal(original.coords);
        });

        it('keeps the class of the input', () => {
            class SomeClass { }
            expect(deepClone(new SomeClass())).to.be.instanceof(SomeClass);
        });

        it('keeps the class of object properties', () => {
            class SomeClass { }
            class OtherClass { }
            const original = { a: new SomeClass(), b: new OtherClass() };
            const clone = deepClone(original);
            expect(clone).to.deep.equal(original);
            expect(clone).not.to.equal(original);
            expect(clone.a).to.be.instanceof(SomeClass);
            expect(clone.b).to.be.instanceof(OtherClass);
        });

        it('creates copies of deeply nested objects', () => {
            const original = { a: { b: { c: { d: { e: 3.14 } } } } };
            const clone = deepClone(original);
            expect(clone).not.to.equal(original);
            expect(clone.a.b.c.d).not.to.equal(original.a.b.c.d);
            expect(clone.a.b.c.d.e).to.equal(3.14);
        });

    });

    describe('for arrays', () => {

        it('copies values', () => {
            const original = [1, 2, 3];
            const clone = deepClone(original);
            expect(clone).to.deep.equal([1, 2, 3]);
        });

        it('returns a new array', () => {
            const original = [1, 2, 3];
            const clone = deepClone(original);
            expect(clone).to.deep.equal(original);
            expect(clone).not.to.equal(original);
        });

        it('creates deep copies of array elements', () => {
            const original = [ [ 1, 2 ], [ 'one', 'two' ] ];
            const clone = deepClone(original);
            expect(clone).to.deep.equal(original);
            expect(clone[0]).not.to.equal(original[0]);
            expect(clone[1]).not.to.equal(original[1]);
        });

        it('creates deep copies of object elements', () => {
            const original = [ { x: 5, y: 7 }, { x: 2, y: 4 } ];
            const clone = deepClone(original);
            expect(clone).to.deep.equal(original);
            expect(clone[0]).not.to.equal(original[0]);
            expect(clone[1]).not.to.equal(original[1]);
        });

        it('creates copies of deeply nested arrays', () => {
            const original = [ [ [ [ [ 3.14 ] ] ] ] ];
            const clone = deepClone(original);
            expect(clone).not.to.equal(original);
            expect(clone[0][0][0][0]).not.to.equal(original[0][0][0][0]);
            expect(clone[0][0][0][0][0]).to.equal(3.14);
        });

    });

    describe('for built-in classes', () => {

        it('clones RegExp objects', () => {
            const original = /abc/i;
            const clone = deepClone(original);
            expect(clone).to.deep.equal(original);
            expect(clone).not.to.equal(original);
        });

        it('clones Date objects', () => {
            const original = new Date();
            const clone = deepClone(original);
            expect(clone).to.deep.equal(original);
            expect(clone).not.to.equal(original);
        });

    });

});
