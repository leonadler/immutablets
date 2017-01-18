import { expect } from 'chai';
import 'reflect-metadata';

import { CloneDepth } from './clone-depth-decorator';
import { Immutable } from './immutable-decorator';


describe('CloneDepthDecorator', () => {

    it('stores metadata on the class', () => {
        class TestClass {
            propWithoutDecorator = { a: '1' };

            @CloneDepth(1)
            propWithDecorator = { b: '2' };
        }

        const keys = Reflect.getMetadataKeys(TestClass);
        expect(keys).to.contain('immutablets');
        expect(Reflect.getMetadata('immutablets', TestClass)).to.deep.equal({
            cloneDepth: {
                propWithDecorator: 1
            }
        });
    });

    it('provides metadata that is used by the ImmutableDecorator', () => {
        let flatClonedPropAfter: any;
        let deeperClonedPropAfter: any;

        @Immutable()
        class TestClass {
            @CloneDepth(0)
            flatClonedProp = { a: 1 };

            @CloneDepth(2)
            deeperClonedProp = { b: { c: { d: 2 } } };

            someMethod(): void {
                flatClonedPropAfter = this.flatClonedProp;
                deeperClonedPropAfter = this.deeperClonedProp;

                (this.deeperClonedProp as any).x = 7;
                (this.deeperClonedProp as any).b.y = 9;
            }
        }

        let instance = new TestClass();
        const flatClonedPropBefore = instance.flatClonedProp;
        const deeperClonedPropBefore = instance.deeperClonedProp;

        instance.someMethod();

        expect(flatClonedPropAfter).to.equal(flatClonedPropBefore);
        expect(deeperClonedPropAfter).not.to.equal(deeperClonedPropBefore);
        expect(deeperClonedPropAfter.b).not.to.equal(deeperClonedPropBefore.b);
        expect(deeperClonedPropAfter.b.c).to.equal(deeperClonedPropBefore.b.c);
        expect(instance.deeperClonedProp).to.deep.equal({
            b: {
                c: { d: 2 },
                y: 9
            },
            x: 7
        });
    });

});
