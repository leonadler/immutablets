import { expect } from 'chai';
import { MethodNotImmutableError, parseFunctionSource, pathToString } from './method-not-immutable-error';
import { InputMutations } from './function-mutates-input';


describe('MethodNotImmutableError', () => {

    const emptyMutations: InputMutations = {
        args: { },
        this: [ ]
    };

    class PseudoClass {
        method() { }
    }


    it('can be constructed without errors', () => {
        new MethodNotImmutableError(emptyMutations, PseudoClass.prototype.method);
        new MethodNotImmutableError(emptyMutations, PseudoClass.prototype.method, PseudoClass);
        new MethodNotImmutableError(emptyMutations, PseudoClass.prototype.method, PseudoClass, 'pseudoMethod');
    });

    it('sets a "name" property', () => {
        const error = new MethodNotImmutableError(emptyMutations, PseudoClass.prototype.method);
        expect(error).to.have.property('name').which.equals('MethodNotImmutableError');
    });

    it('has the correct prototype chain', () => {
        const error = new MethodNotImmutableError(emptyMutations, PseudoClass.prototype.method);
        expect(error).to.be.an.instanceof(Error);
        expect(error).to.be.an.instanceof(MethodNotImmutableError);
    });

    it('describes the changed <this> properties', () => {
        const mutations: InputMutations = {
            args: { },
            this: [
                { path: ['fruit', 'name'], oldValue: 'apple', newValue: 'banana' },
                { path: ['newProp'], newValue: 'added' },
                { path: ['oldProp'], oldValue: 'removed' }
            ]
        };

        class ExampleClass1 {
            fruit: { name: string } = { name: 'apple' };
            oldProp: 'removed';
            testMethod() {
                this.fruit.name = 'banana';
                delete this.oldProp;
            }
        }

        const error = new MethodNotImmutableError(mutations, ExampleClass1.prototype.testMethod, ExampleClass1);
        expect(error.toString()).to.equal(
            unindent`
                MethodNotImmutableError: ExampleClass1.testMethod mutates properties.

                Changes:
                -this.fruit.name   "apple"
                +this.fruit.name   "banana"
                +this.newProp      "added"
                -this.oldProp      "removed"
            `
        );
    });

    it('describes changed argument properties', () => {
        const mutations: InputMutations = {
            args: {
                0: [
                    { path: ['color'], oldValue: 'red', newValue: 'green' }
                ]
            },
            this: []
        };

        class ExampleClass2 {
            testMethod(fruit: { color: string }) {
                fruit.color = 'green';
            }
        }

        const error = new MethodNotImmutableError(mutations, ExampleClass2.prototype.testMethod, ExampleClass2);
        expect(error.toString()).to.equal(
            unindent`
                MethodNotImmutableError: ExampleClass2.testMethod mutates properties.

                Changes:
                -fruit.color   "red"
                +fruit.color   "green"
            `
        );
    });
});

describe('pathToString (internal)', () => {

    it('joins a simple object property path by dots', () => {
        const path = ['document', 'body', 'firstChild'];
        expect(pathToString(path)).to.equal('.document.body.firstChild');
    });

    it('formats numeric indices as expected', () => {
        const path = ['items', '5', 'id'];
        expect(pathToString(path)).to.equal('.items[5].id');
    });

    it('formats string indices as expected', () => {
        const path = ['hash', 'some "rare" edge case'];
        expect(pathToString(path)).to.equal('.hash["some \\"rare\\" edge case"]');
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

describe('unindent (internal)', () => {

    it('strips whitespace as expected', () => {
        const result = unindent `
            This should work.
            This too.
                and even this.
        `;

        expect(result).to.equal('This should work.\nThis too.\n    and even this.');
    });

});


function unindent(parts: TemplateStringsArray, ...params: any[]): string {
    const fullText = [parts[0]].concat(...params.map((p, i) => [String(p), parts[i + 1]])).join('');
    const indent = (fullText.match(/^\n([\t ]+)/) || ['\n'])[0];
    return fullText.trim().split(indent).join('\n');
}
