import { expect } from 'chai';
import { functionMutatesInput } from './function-mutates-input';

describe('functionMutatesInput', () => {

    it('calls the passed function with the supplied arguments and "this"', () => {
        let argsForCall: any;
        let thisForCall: any;

        function test(a: any, b: any, c: any) {
            argsForCall = [a, b, c];
            thisForCall = this;
        }

        const args = [1, '2', { 3: true }];
        const fakeThis = {};
        functionMutatesInput(test, args, fakeThis);

        expect(argsForCall[0]).to.equal(1);
        expect(argsForCall[1]).to.equal('2');
        expect(argsForCall[2]).to.equal(args[2]);
        expect(thisForCall).to.equal(fakeThis);
    });

    it('returns false for simple non-mutating functions', () => {
        const a = () => 5;
        expect(functionMutatesInput(a, [])).to.be.false;

        const b = (input: any) => { };
        expect(functionMutatesInput(b, [15])).to.be.false;

        const c = (array: any[]) => {
            let length = array.length;
        };
        expect(functionMutatesInput(c, [47])).to.be.false;
    });

    it('detects when a function mutates array arguments', () => {
        function pushTest(input: any[]): void {
            input.push(5);
        }
        const result = functionMutatesInput(pushTest, [[1, 2, 3]]);
        expect(result).to.deep.equal({
            args: {
                0: [
                    { path: ['3'], newValue: 5 }
                ]
            },
            this: []
        });
    });

    it('detects when a function mutates object arguments', () => {
        function objectTest(first: any, second: any): void {
            first.xyz = 'xyz added';
            second.deep.value = 'deep value changed';
        }

        const first = { abc: 'no xyz' };
        const second = { deep: { value: 'deep value unchanged' } };
        const result = functionMutatesInput(objectTest, [first, second]);

        expect(result).to.deep.equal({
            args: {
                0: [
                    { path: ['xyz'], newValue: 'xyz added' }
                ],
                1: [
                    { path: ['deep', 'value'], oldValue: 'deep value unchanged', newValue: 'deep value changed' }
                ]
            },
            this: []
        });
    });

    it('detects when a function mutates properties of "this"', () => {
        function thisTest(): void {
            (this as any).oldProp = 'new value';
            (this as any).newProp = 'new property';
        }

        const thisObj = {
            oldProp: 'old value'
        };

        let result = functionMutatesInput(thisTest, [], thisObj);
        expect(result).to.deep.equal({
            args: { },
            this: [
                { path: ['oldProp'], oldValue: 'old value', newValue: 'new value' },
                { path: ['newProp'], newValue: 'new property' }
            ]
        });
    });

});
