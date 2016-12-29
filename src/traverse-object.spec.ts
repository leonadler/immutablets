import { expect } from 'chai';
import { traverseObject } from './traverse-object';

describe('traverseObject', () => {

    it('does not call the passed callback for value types', () => {
        const valueTypes = [
            true,
            false,
            'string',
            3.14,
            +1/0,
            -1/0,
            Symbol('symbol')
        ];

        for (let value of valueTypes) {
            traverseObject(value, () => {
                throw new Error(`callback should not be called for ${typeof value} ${value}`);
            });
        }
    });

    it('calls the passed callback for object properties', () => {
        const input = {
            a: {},
            b: 5
        };
        const calls = [] as any[];

        traverseObject(input, (subject, path) => {
            calls.push({ subject, path });
        });

        expect(calls).to.deep.equal([
            { path: [], subject: input },
            { path: ['a'], subject: input.a }
        ]);
    });

    it('does not call the passed callback twice for one object', () => {
        const someObject = {};
        const input = {
            a: someObject,
            b: someObject
        };
        const calls = [] as any[];

        traverseObject(input, (subject, path) => {
            calls.push({ subject, path });
        });

        expect(calls).to.deep.equal([
            { path: [], subject: input },
            { path: ['a'], subject: input.a }
        ]);
    });

    it('traverses the passed structure breadth-first', () => {
        const input = {
            a: { a1: { a2: true } },
            b: { b1: { b2: true } }
        };
        const calls = [] as any[];

        traverseObject(input, (subject, path) => {
            calls.push({ subject, path });
        });

        expect(calls).to.deep.equal([
            { path: [], subject: input },
            { path: ['a'], subject: input.a },
            { path: ['b'], subject: input.b },
            { path: ['a', 'a1'], subject: input.a.a1 },
            { path: ['b', 'b1'], subject: input.b.b1 }
        ]);
    });

    it('does not traverse cyclic objects', () => {
        const a: any = {};
        const b: any = {};
        a.b = b;
        b.a = a;

        const input = { a, b };
        const calls = [] as any[];

        traverseObject(input, (subject, path) => {
            calls.push({ subject, path });
        });

        expect(calls).to.deep.equal([
            { path: [], subject: input },
            { path: ['a'], subject: input.a },
            { path: ['b'], subject: input.b }
        ]);
    });

});
