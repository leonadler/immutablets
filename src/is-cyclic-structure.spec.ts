import { isCyclicStructure } from './is-cyclic-structure';
import { expect } from 'chai';


describe('isCyclicStructure', () => {

    it('returns false for value types', () => {
        expect(isCyclicStructure('a')).to.be.false;
        expect(isCyclicStructure(5)).to.be.false;
        expect(isCyclicStructure(null)).to.be.false;
        expect(isCyclicStructure(Number.NaN)).to.be.false;
        expect(isCyclicStructure(undefined)).to.be.false;
    });

    it('returns false for non-cyclic flat arrays', () => {
        expect(isCyclicStructure(['a', 'b'])).to.be.false;
        expect(isCyclicStructure([[], [], []])).to.be.false;
        expect(isCyclicStructure([1, 2, 3])).to.be.false;
        expect(isCyclicStructure([[1, 2], [3, 4], [5, 6]])).to.be.false;
        expect(isCyclicStructure([{}, {}, {}])).to.be.false;
    });

    it('returns false for non-cyclic objects', () => {
        expect(isCyclicStructure({ a: 'A', b: 'B' })).to.be.false;
        expect(isCyclicStructure({ one: 1, two: 2 })).to.be.false;
        expect(isCyclicStructure({ arr1: [], arr2: [] })).to.be.false;
        expect(isCyclicStructure({ obj1: {}, obj2: {} })).to.be.false;
        expect(isCyclicStructure({ arr: [ { arr: [] } ] })).to.be.false;
    });

    it('returns false for objects with shared references', () => {
        const shared = {} as any;
        const obj = { first: shared, second: shared } as any;
        expect(isCyclicStructure(obj)).to.be.false;
    });

    it('returns true for flat self-cyclic objects', () => {
        const flatSelfCyclic = { color: 'red' } as any;
        flatSelfCyclic.self = flatSelfCyclic;

        expect(isCyclicStructure(flatSelfCyclic)).to.be.true;
    });

    it('returns true for deep self-cyclic objects', () => {
        const deepSelfCyclic = { color: 'red', references: { } } as any;
        deepSelfCyclic.references.self = deepSelfCyclic;

        expect(isCyclicStructure(deepSelfCyclic)).to.be.true;
    });

    it('returns true for double-referencing cyclic objects', () => {
        let objA = { name: 'objA' } as any;
        let objB = { name: 'objB', other: objA } as any;
        objA.other = objB;

        expect(isCyclicStructure(objA)).to.be.true;
        expect(isCyclicStructure(objB)).to.be.true;
    });

    it('returns false for arrays with shared references', () => {
        const shared = [] as any;
        const arr = [ shared, shared ];
        expect(isCyclicStructure(arr)).to.be.false;
    });

    it('returns true for flat self-cyclic arrays', () => {
        const flatSelfCyclic = [ 'not self' ] as any[];
        flatSelfCyclic.push(flatSelfCyclic);

        expect(isCyclicStructure(flatSelfCyclic)).to.be.true;
    });

    it('returns true for deep self-cyclic arrays', () => {
        const deepSelfCyclic = [ [ 'not self' ], [ 'also not self' ] ] as any[][];
        deepSelfCyclic.push([ deepSelfCyclic ]);

        expect(isCyclicStructure(deepSelfCyclic)).to.be.true;
    });

    it('returns true for double-referencing cyclic arrays', () => {
        let arrA = [ 'arrA' ] as any[];
        let arrB = [ 'arrB', arrA ] as any[];
        arrA.push(arrB);

        expect(isCyclicStructure(arrA)).to.be.true;
        expect(isCyclicStructure(arrB)).to.be.true;
    });

});
