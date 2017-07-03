import { expect } from 'chai';
import { flatEqual } from './flat-equal';


describe('flatEqual', () => {

    it('returns true for the same value', () => {
        expect(flatEqual(undefined, undefined)).to.be.true;
        expect(flatEqual(null, null)).to.be.true;
        expect(flatEqual(true, true)).to.be.true;
        expect(flatEqual(false, false)).to.be.true;
        expect(flatEqual(0, 0)).to.be.true;
        expect(flatEqual(Infinity, Infinity)).to.be.true;
        expect(flatEqual('abc', 'abc')).to.be.true;
    });

    it('returns false for different values', () => {
        expect(flatEqual(undefined, undefined)).to.be.true;
        expect(flatEqual(null, null)).to.be.true;
        expect(flatEqual(true, true)).to.be.true;
        expect(flatEqual(false, false)).to.be.true;
        expect(flatEqual(0, 0)).to.be.true;
        expect(flatEqual(Infinity, Infinity)).to.be.true;
        expect(flatEqual('abc', 'abc')).to.be.true;
    });

    it('returns true for (5, 5)', () => {
        expect(flatEqual(5, 5)).to.be.true;
    });

    it('returns true for (NaN, NaN)', () => {
        expect(flatEqual(NaN, NaN)).to.be.true;
    });

    it('returns true for (true, true)', () => {
        expect(flatEqual(true, true)).to.be.true;
    });

    it('returns true for (false, false)', () => {
        expect(flatEqual(false, false)).to.be.true;
    });

    it('returns true for (null, null)', () => {
        expect(flatEqual(null, null)).to.be.true;
    });

    it('returns true for ("xyz", "xyz")', () => {
        expect(flatEqual('xyz', 'xyz')).to.be.true;
    });

    it('returns false for (3, 9)', () => {
        expect(flatEqual(3, 9)).to.be.false;
    });

    it('returns false for (3, "3")', () => {
        expect(flatEqual(3 as any, '3')).to.be.false;
    });

    it('returns false for (true, false)', () => {
        expect(flatEqual(true, false)).to.be.false;
    });

    it('returns false for (false, true)', () => {
        expect(flatEqual(false, true)).to.be.false;
    });

    it('returns false for (null, undefined)', () => {
        expect(flatEqual(null, undefined)).to.be.false;
    });

    it('returns false for (undefined, null)', () => {
        expect(flatEqual(undefined, null)).to.be.false;
    });

    it('returns false for ("abc", "xyz")', () => {
        expect(flatEqual('abc', 'xyz')).to.be.false;
    });

    it('returns true for ([], [])', () => {
        expect(flatEqual([], [])).to.be.true;
    });

    it('returns true for (["a"], ["a"])', () => {
        expect(flatEqual(['a'], ['a'])).to.be.true;
    });

    it('returns true for ([1, 2, 3], [1, 2, 3])', () => {
        expect(flatEqual([1, 2, 3], [1, 2, 3])).to.be.true;
    });

    it('returns true for ([null, false], [null, false])', () => {
        expect(flatEqual([null, false], [null, false])).to.be.true;
    });

    it('returns true for ([undefined, null], [undefined, null])', () => {
        expect(flatEqual([undefined, null], [undefined, null])).to.be.true;
    });

    it('returns true for (["abc", "xyz"], ["abc", "xyz"])', () => {
        expect(flatEqual(['abc', 'xyz'], ['abc', 'xyz'])).to.be.true;
    });

    it('returns false for (["a"], ["b"])', () => {
        expect(flatEqual(['a'], ['b'])).to.be.false;
    });

    it('returns false for ([1, 2, 3], [1])', () => {
        expect(flatEqual([1, 2, 3], [1])).to.be.false;
    });

    it('returns false for (["a"], ["a", null])', () => {
        expect(flatEqual(['a'], ['a', null])).to.be.false;
    });

    it('returns false for ([true], [false])', () => {
        expect(flatEqual([true], [false])).to.be.false;
    });

    it('returns true for ([NaN], [NaN])', () => {
        expect(flatEqual([NaN], [NaN])).to.be.true;
    });

    it('returns false for ([{}], [{}])', () => {
        expect(flatEqual([{}], [{}])).to.be.false;
    });

    it('returns true for ({a: NaN}, {a: NaN})', () => {
        expect(flatEqual({a: NaN}, {a: NaN})).to.be.true;
    });

    it('does not deep-compare objects', () => {
        let objA = { albums: ['Abbey Road', 'Past Masters'] };
        let objB = { albums: ['Abbey Road', 'Past Masters'] };
        expect(flatEqual(objA, objB)).to.be.false;
    });

    it('does not deep-compare arrays', () => {
        let arrA = [ [ 'key1', 'value1' ], [ 'key2', 'value2' ] ];
        let arrB = [ [ 'key1', 'value1' ], [ 'key2', 'value2' ] ];
        expect(flatEqual(arrA, arrB)).to.be.false;
    });

    it('returns true for the same reference', () => {
        const obj = { a: 1 };
        expect(flatEqual(obj, obj)).to.be.true;

        const arr = [] as any[];
        expect(flatEqual(arr, arr)).to.be.true;
    });

    it('returns true for different references with equal property values', () => {
        const a = { a: 1, b: 'B' };
        const b = { a: 1, b: 'B' }
        expect(flatEqual(a, b)).to.be.true;

        const array1 = [1, 2, 3];
        const array2 = [1, 2, 3];
        expect(flatEqual(array1, array2)).to.be.true;
    });

    it('returns true when property references are equal', () => {
        const obj = { id: 1 };
        const one = { item: obj };
        const two = { item: obj };
        expect(flatEqual(one, two)).to.be.true;

        const array1 = [1, 2, obj];
        const array2 = [1, 2, obj];
        expect(flatEqual(array1, array2)).to.be.true;
    });

    it('returns false when property values differ', () => {
        const a = { a: 1, b: 'B' };
        const b = { a: 1, b: 'not B' }
        expect(flatEqual(a, b)).to.be.false;

        const array1 = [1, 2, 3];
        const array2 = [3, 2, 1];
        expect(flatEqual(array1, array2)).to.be.false;
    });

    it('returns false when properties differ by reference', () => {
        const a = { id: 1 };
        const b = { id: 1 };
        const one = { item: a };
        const two = { item: b };
        expect(flatEqual(one, two)).to.be.false;

        const array1 = [1, 2, a];
        const array2 = [1, 2, b];
        expect(flatEqual(array1, array2)).to.be.false;
    });

});
