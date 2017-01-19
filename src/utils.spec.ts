import { expect } from 'chai';
import { getFunctionName, parseFunctionSource } from './utils';


describe('getFunctionName (internal)', () => {

    it('can get the name of a compiled method', () => {
        function FakeClass() {
            this.x = 5;
            this.y = 7;
        }
        FakeClass.prototype.doubleCoords = function () {
            this.x *= 2;
            this.y *= 2;
        };
        FakeClass.prototype.constructor = FakeClass;

        let instance = new (FakeClass as any)();
        let name = getFunctionName(instance.doubleCoords, FakeClass.prototype);
        expect(name).to.equal('doubleCoords');
    });

});

describe('parseFunctionSource (internal)', () => {

    it('can get the name of simple functions', () => {
        const source = `function abc(){}`;
        expect(parseFunctionSource(source))
            .to.deep.equal({ name: 'abc', argNames: [] });
    });

    it('does not throw on empty functions', () => {
        const source = `function (){}`;
        expect(parseFunctionSource(source))
            .to.deep.equal({ name: '', argNames: [] });
    });

    it('can get the name of generator functions', () => {
        const source = `function* def(){}`;
        expect(parseFunctionSource(source))
            .to.deep.equal({ name: 'def', argNames: [] });
    });

    it('can get the argument names of unnamed functions', () => {
        const source = `function (a, b, c){}`;
        expect(parseFunctionSource(source))
            .to.deep.equal({ name: '', argNames: ['a', 'b', 'c'] });
    });

    it('can get the argument names of named functions', () => {
        const source = `function something(a, b, c){}`;
        expect(parseFunctionSource(source))
            .to.deep.equal({ name: 'something', argNames: ['a', 'b', 'c'] });
    });

    it('ignores rest parameters', () => {
        const source = `function something(a, ...b){}`;
        expect(parseFunctionSource(source))
            .to.deep.equal({ name: 'something', argNames: ['a'] });
    });

    it('can get the argument names of single-argument arrow functions', () => {
        const source = `number => number * number`;
        expect(parseFunctionSource(source))
            .to.deep.equal({ name: '', argNames: ['number'] });
    });

    it('can get the argument names of arrow functions', () => {
        const source = `(a, b, c) => a * b + c`;
        expect(parseFunctionSource(source))
            .to.deep.equal({ name: '', argNames: ['a', 'b', 'c'] });
    });

    it('does not throw on empty arrow functions', () => {
        const source = `() => {}`;
        expect(parseFunctionSource(source))
            .to.deep.equal({ name: '', argNames: [] });
    });

    it('can parse es6 methods', () => {
        const source = `method(a, b) {}`;
        expect(parseFunctionSource(source))
            .to.deep.equal({ name: 'method', argNames: ['a', 'b'] });

        const source2 = `testMethod(fruit) {\n}`;
        expect(parseFunctionSource(source2))
            .to.deep.equal({ name: 'testMethod', argNames: ['fruit'] });
    });

});
