import { hasSharedReferences } from './has-shared-references';
import { expect } from 'chai';


describe('hasSharedReferences', () => {

    it('returns false for value types', () => {
        expect(hasSharedReferences('a')).to.be.false;
        expect(hasSharedReferences(5)).to.be.false;
        expect(hasSharedReferences(null)).to.be.false;
        expect(hasSharedReferences(Number.NaN)).to.be.false;
        expect(hasSharedReferences(undefined)).to.be.false;
    });

    it('returns false for non-cyclic flat arrays', () => {
        expect(hasSharedReferences(['a', 'b'])).to.be.false;
        expect(hasSharedReferences([[], [], []])).to.be.false;
        expect(hasSharedReferences([1, 2, 3])).to.be.false;
        expect(hasSharedReferences([[1, 2], [3, 4], [5, 6]])).to.be.false;
        expect(hasSharedReferences([{}, {}, {}])).to.be.false;
    });

    it('returns false for non-cyclic objects', () => {
        expect(hasSharedReferences({ a: 'A', b: 'B' })).to.be.false;
        expect(hasSharedReferences({ one: 1, two: 2 })).to.be.false;
        expect(hasSharedReferences({ arr1: [], arr2: [] })).to.be.false;
        expect(hasSharedReferences({ obj1: {}, obj2: {} })).to.be.false;
        expect(hasSharedReferences({ arr: [ { arr: [] } ] })).to.be.false;
    });

    it('returns true for objects with shared references', () => {
        const shared = {} as any;
        const obj = { first: shared, second: shared } as any;
        expect(hasSharedReferences(obj)).to.be.true;
    });

    it('returns true for flat self-cyclic objects', () => {
        const flatSelfCyclic = { color: 'red' } as any;
        flatSelfCyclic.self = flatSelfCyclic;

        expect(hasSharedReferences(flatSelfCyclic)).to.be.true;
    });

    it('returns true for deep self-cyclic objects', () => {
        const deepSelfCyclic = { color: 'red', references: { } } as any;
        deepSelfCyclic.references.self = deepSelfCyclic;

        expect(hasSharedReferences(deepSelfCyclic)).to.be.true;
    });

    it('returns true for double-referencing cyclic objects', () => {
        let objA = { name: 'objA' } as any;
        let objB = { name: 'objB', other: objA } as any;
        objA.other = objB;

        expect(hasSharedReferences(objA)).to.be.true;
        expect(hasSharedReferences(objB)).to.be.true;
    });

    it('returns true for arrays with shared references', () => {
        const shared = [] as any;
        const arr = [ shared, shared ];
        expect(hasSharedReferences(arr)).to.be.true;
    });

    it('returns true for flat self-cyclic arrays', () => {
        const flatSelfCyclic = [ 'not self' ] as any[];
        flatSelfCyclic.push(flatSelfCyclic);

        expect(hasSharedReferences(flatSelfCyclic)).to.be.true;
    });

    it('returns true for deep self-cyclic arrays', () => {
        const deepSelfCyclic = [ [ 'not self' ], [ 'also not self' ] ] as any[][];
        deepSelfCyclic.push([ deepSelfCyclic ]);

        expect(hasSharedReferences(deepSelfCyclic)).to.be.true;
    });

    it('returns true for double-referencing cyclic arrays', () => {
        let arrA = [ 'arrA' ] as any[];
        let arrB = [ 'arrB', arrA ] as any[];
        arrA.push(arrB);

        expect(hasSharedReferences(arrA)).to.be.true;
        expect(hasSharedReferences(arrB)).to.be.true;
    });

});
