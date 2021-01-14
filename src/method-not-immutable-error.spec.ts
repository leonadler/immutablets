import { expect } from 'chai';
import { MethodNotImmutableError, pathToString } from './method-not-immutable-error';
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
            oldProp? = 'removed';
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
