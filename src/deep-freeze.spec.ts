import { expect } from 'chai';
import { deepFreeze } from './deep-freeze';


describe('deepFreeze', () => {

    it('uses Object.freeze on the passed object', () => {
        const person = {
            name: 'Person 1'
        };
        deepFreeze(person);
        expect(Object.isFrozen(person)).to.be.true;
    });

    it('throws an error when setting a frozen property', () => {
        const person = {
            name: 'Person 1'
        };
        deepFreeze(person);
        expect(() => { person.name = 'Not Person 1' }).to.throw();
    });

    it('uses Object.freeze on deep properties', () => {
        const tree = {
            branch1: {
                leaf1: 1,
                leaf2: 2
            },
            branch2: {
                leaf1: 1,
                leaf2: 2
            }
        };
        deepFreeze(tree);
        expect(Object.isFrozen(tree.branch1)).to.be.true;
        expect(Object.isFrozen(tree.branch2)).to.be.true;
    });

    it('throws an error when setting a deep frozen property', () => {
        const tree = {
            branch: {
                leaf1: 1,
                leaf2: 2
            }
        };
        deepFreeze(tree);
        expect(() => { tree.branch.leaf1 = 5; }).to.throw();
    });
});
