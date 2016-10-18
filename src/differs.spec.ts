import { expect } from 'chai';
import { differs } from './differs';

describe('different()', () => {

    it('returns false for (5, 5)', () => {
        expect(differs(5, 5)).to.be.false;
    });

    it('returns false for (true, true)', () => {
        expect(differs(true, true)).to.be.false;
    });

    it('returns false for (false, false)', () => {
        expect(differs(false, false)).to.be.false;
    });

    it('returns false for (null, null)', () => {
        expect(differs(null, null)).to.be.false;
    });

    it('returns false for ("xyz", "xyz")', () => {
        expect(differs('xyz', 'xyz')).to.be.false;
    });

    it('returns true for (3, 9)', () => {
        expect(differs(3, 9)).to.be.true;
    });

    it('returns true for (3, "3")', () => {
        expect(differs(3, '3')).to.be.true;
    });

    it('returns true for (true, false)', () => {
        expect(differs(true, false)).to.be.true;
    });

    it('returns true for (false, true)', () => {
        expect(differs(false, true)).to.be.true;
    });

    it('returns true for (null, undefined)', () => {
        expect(differs(null, undefined)).to.be.true;
    });

    it('returns true for (undefined, null)', () => {
        expect(differs(undefined, null)).to.be.true;
    });

    it('returns true for ("abc", "xyz")', () => {
        expect(differs('abc', 'xyz')).to.be.true;
    });

    it('returns false for ([], [])', () => {
        expect(differs([], [])).to.be.false;
    });

    it('returns false for (["a"], ["a"])', () => {
        expect(differs(['a'], ['a'])).to.be.false;
    });
    
    it('returns false for ([1, 2, 3], [1, 2, 3])', () => {
        expect(differs([1, 2, 3], [1, 2, 3])).to.be.false;
    });
    
    it('returns false for ([null, false], [null, false])', () => {
        expect(differs([null, false], [null, false])).to.be.false;
    });
    
    it('returns false for ([undefined, null], [undefined, null])', () => {
        expect(differs([undefined, null], [undefined, null])).to.be.false;
    });

    it('returns false for (["abc", "xyz"], ["abc", "xyz"])', () => {
        expect(differs(['abc', 'xyz'], ['abc', 'xyz'])).to.be.false;
    });

    it('returns true for (["a"], ["b"])', () => {
        expect(differs(['a'], ['b'])).to.be.true;
    });
    
    it('returns true for ([1, 2, 3], [1])', () => {
        expect(differs([1, 2, 3], [1])).to.be.true;
    });
    
    it('returns true for (["a"], ["a", null])', () => {
        expect(differs(['a'], ['a', null])).to.be.true;
    });
    
    it('returns true for ([true], [false])', () => {
        expect(differs([true], [false])).to.be.true;
    });
    
    it('returns true for ([{}], [{}])', () => {
        expect(differs([{}], [{}])).to.be.true;
    });
    
    it('does not deep-compare objects', () => {
        let objA = { albums: ['Abbey Road', 'Past Masters'] };
        let objB = { albums: ['Abbey Road', 'Past Masters'] };
        expect(differs(objA, objB)).to.be.true;
    });
    
    it('does not deep-compare arrays', () => {
        let arrA = [ [ 'key1', 'value1' ], [ 'key2', 'value2' ] ];
        let arrB = [ [ 'key1', 'value1' ], [ 'key2', 'value2' ] ];
        expect(differs(arrA, arrB)).to.be.true;
    });
});
