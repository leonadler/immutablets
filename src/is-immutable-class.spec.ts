import { expect } from 'chai';
import { Immutable, createImmutableClass } from './immutable-decorator';
import { isImmutableClass } from './is-immutable-class';
import { setImmutableMetadata } from './utils';

describe('isImmutableClass', () => {

    it('returns false for any value that is not a class', () => {
        expect(isImmutableClass(null as any)).to.be.false;
        expect(isImmutableClass(undefined as any)).to.be.false;
        expect(isImmutableClass({} as any)).to.be.false;
        expect(isImmutableClass('abc' as any)).to.be.false;
        expect(isImmutableClass(3.14 as any)).to.be.false;
        expect(isImmutableClass(function (){} as any)).to.be.false;
        expect(isImmutableClass(/regexp/ as any)).to.be.false;
        expect(isImmutableClass(Symbol() as any)).to.be.false;
    });

    it('returns false for regular classes', () => {
        class A {}
        expect(isImmutableClass(A)).to.be.false;

        class B extends A {}
        expect(isImmutableClass(B)).to.be.false;
    });

    it('returns true for a class with immutable metadata', () => {
        class ExampleClass { }
        setImmutableMetadata(ExampleClass, {});

        expect(isImmutableClass(ExampleClass)).to.be.true;
    });

    it('returns true for a class created with createImmutableClass', () => {
        class ExampleClass { }
        const otherClass = createImmutableClass(ExampleClass);

        expect(isImmutableClass(otherClass)).to.be.true;
    });

    it('returns true for a class decorated as immutable', () => {
        @Immutable()
        class ExampleClass { }

        expect(isImmutableClass(ExampleClass)).to.be.true;
    });

});
