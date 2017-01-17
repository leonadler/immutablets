import { expect } from 'chai';
import { withChanges } from './with-changes';

describe('withChanges', () => {

    describe('<object, object>', () => {

        it('returns a new reference if any property changes', () => {
            const original = {
                name: 'table',
                onSale: true,
                size: 14,
                type: 'furniture'
            };
            const result = withChanges(original, {
                size: 16,
                onSale: false
            });

            expect(result).not.to.equal(original);
            expect(result).to.deep.equal({
                name: 'table',
                onSale: false,
                size: 16,
                type: 'furniture',
            });
        });

        it('returns the same reference if no properties change', () => {
            const original = {
                name: 'table',
                onSale: true,
                size: 14,
                type: 'furniture'
            };
            const result = withChanges(original, {
                name: 'table',
                size: 14
            });

            expect(result).to.equal(original);
        });

        it('does not deep-clone object properties', () => {
            const original = {
                fruits: ['apple', 'banana', 'carrot'],
                preferredFruit: 'apple'
            };
            const result = withChanges(original, {
                preferredFruit: 'banana'
            });

            expect(result).not.to.equal(original);
            expect(result.fruits).to.equal(original.fruits);
        });

        it('can assign undefined', () => {
            const original: { name: string | undefined, size: number } = {
                name: 'anonymous',
                size: 15
            };
            const result = withChanges(original, {
                name: undefined
            });

            expect(result).not.to.equal(original);
            expect(result.name).to.be.undefined;
        });

        it('can assign null', () => {
            const original: { name: string | null, size: number } = {
                name: 'anonymous',
                size: 15
            };
            const result = withChanges(original, {
                name: null
            });

            expect(result).not.to.equal(original);
            expect(result.name).to.be.null;
        });

        it('keeps undefined properties', () => {
            const original: { name: string | undefined, size: number } = {
                name: undefined,
                size: 15
            };
            const result = withChanges(original, {
                size: 17
            });

            expect(result).not.to.equal(original);
            expect(result.name).to.be.undefined;
        });

        it('keeps null properties', () => {
            const original: { name: string | null, size: number } = {
                name: null,
                size: 15
            };
            const result = withChanges(original, {
                size: 17
            });

            expect(result).not.to.equal(original);
            expect(result.name).to.be.null;
        });

        it('keeps the prototype chain intact', () => {
            class Animal {
                constructor(
                    public legs: number,
                    public eyes: number,
                    public canSwim: boolean
                ) {}
            }
            const dog = new Animal(8, 16, true);
            const dogAfraidOfWater = withChanges(dog, {
                canSwim: false
            });

            expect(dogAfraidOfWater).to.be.an.instanceof(Animal);
        });

    });

    describe('<object, function>', () => {

        it('returns a new reference if any property changes', () => {
            const original = {
                name: 'table',
                onSale: true,
                size: 14,
                type: 'furniture'
            };
            const result = withChanges(original, obj => {
                obj.size = 16;
                obj.onSale = false;
            });

            expect(result).not.to.equal(original);
            expect(result).to.deep.equal({
                name: 'table',
                onSale: false,
                size: 16,
                type: 'furniture',
            });
        });

        it('returns the same reference if no properties change', () => {
            const original = {
                name: 'table',
                onSale: true,
                size: 14,
                type: 'furniture'
            };
            const result = withChanges(original, obj => {
                obj.name = 'table',
                obj.size = 14
            });

            expect(result).to.equal(original);
        });

        it('does not deep-clone object properties', () => {
            const original = {
                fruits: ['apple', 'banana', 'carrot'],
                preferredFruit: 'apple'
            };
            const result = withChanges(original, obj => {
                obj.preferredFruit = 'banana';
            });

            expect(result).not.to.equal(original);
            expect(result.fruits).to.equal(original.fruits);
        });

        it('can assign undefined', () => {
            const original: { name: string | undefined, size: number } = {
                name: 'anonymous',
                size: 15
            };
            const result = withChanges(original, obj => {
                obj.name = undefined;
            });

            expect(result).not.to.equal(original);
            expect(result.name).to.be.undefined;
        });

        it('can assign null', () => {
            const original: { name: string | null, size: number } = {
                name: 'anonymous',
                size: 15
            };
            const result = withChanges(original, obj => {
                obj.name = null;
            });

            expect(result).not.to.equal(original);
            expect(result.name).to.be.null;
        });

        it('keeps undefined properties', () => {
            const original: { name: string | undefined, size: number } = {
                name: undefined,
                size: 15
            };
            const result = withChanges(original, obj => {
                obj.size = 17;
            });

            expect(result).not.to.equal(original);
            expect(result.name).to.be.undefined;
        });

        it('keeps null properties', () => {
            const original: { name: string | null, size: number } = {
                name: null,
                size: 15
            };
            const result = withChanges(original, obj => {
                obj.size = 17;
            });

            expect(result).not.to.equal(original);
            expect(result.name).to.be.null;
        });

        it('keeps the prototype chain intact', () => {
            class Animal {
                constructor(
                    public legs: number,
                    public eyes: number,
                    public canSwim: boolean
                ) {}
            }
            const dog = new Animal(8, 16, true);
            const dogAfraidOfWater = withChanges(dog, dogToChange => {
                dogToChange.canSwim = false;
            });

            expect(dogAfraidOfWater).to.be.an.instanceof(Animal);
        });

        it('can be passed a "this" value', () => {
            const thisObject = { x: 3 };

            function changeFn(obj: { name: string }): void {
                expect(this).to.equal(thisObject);
            }

            const original = { name: 'original' };
            const clone = withChanges(original, changeFn, thisObject);
        });

    });

    describe('<array, function>', () => {

        it('returns a new array if any element is changed', () => {
            const original = [
                { name: 'red', hex: '#ff0000' },
                { name: 'green', hex: '#00ff00' },
                { name: 'blue', hex: '#0000ff' }
            ];
            const clone = withChanges(original, colors => {
                colors.push({ name: 'black', hex: '#000000' });
            });

            expect(clone).not.to.equal(original);
            expect(clone).to.be.an('array');
            expect(clone).to.deep.equal([
                original[0],
                original[1],
                original[2],
                { name: 'black', hex: '#000000' }
            ]);
        });


        it('returns the same array if all elements are equal', () => {
            const original = ['apple', 'banana', 'carrot'];
            const clone = withChanges(original, fruits => {
                fruits[1] = 'banana';
            });
            expect(clone).to.be.an('array');
            expect(clone).to.equal(original);
        });

    });

});
