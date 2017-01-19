import { expect } from 'chai';
import 'reflect-metadata';

import { Immutable, createImmutableClass, restoreUnchangedProperties } from './immutable-decorator';
import { immutableSettings } from './immutable-settings';
import { isImmutableClass } from './is-immutable-class';
import { CloneDepth } from './clone-depth-decorator';


describe('Immutable decorator', () => {

    it('creates an immutable class when decorating a class', () => {
        @Immutable()
        class TestClass { }

        expect(TestClass).to.be.a('function').with.property('prototype').which.is.an('object');
        expect(isImmutableClass(TestClass)).to.be.true;
    });

});

describe('createImmutableClass', () => {

    it('creates a new derived class', () => {
        class MyClass {
            login(): void { }
            logout(): void { }
        }

        const OtherClass = createImmutableClass(MyClass);

        expect(OtherClass.prototype.login).to.be.a('function');
        expect(OtherClass.prototype.logout).to.be.a('function');
        expect(OtherClass.prototype.constructor).to.equal(OtherClass);
        expect(new OtherClass()).to.be.an.instanceOf(MyClass);
    })

    it('keeps original properties', () => {
        let playerReference = { name: 'Player 1' };

        @Immutable()
        class Tile {
            x = 1;
            y: number;
            player: any;
            constructor() {
                this.y = 2;
                this.player = playerReference;
            }
        }

        let tile = new Tile();
        expect(tile.x).to.equal(1);
        expect(tile.y).to.equal(2);
        expect(tile.player).to.equal(playerReference);
    });

    it('passes method calls to the original methods', () => {
        let wasCalled = false;
        let calledWith = [] as any[];

        @Immutable()
        class ExampleClass {
            property = 'value';
            someMethod(...args: any[]): any {
                wasCalled = true;
                calledWith = args;
                return 'return value';
            }
        }

        let instance = new ExampleClass();
        let array = ['a', 'b'];
        let returned = instance.someMethod(1, 2, array);

        expect(wasCalled).to.be.true;
        expect(calledWith[0]).to.equal(1);
        expect(calledWith[1]).to.equal(2);
        expect(calledWith[2]).to.equal(array);
    });

    it('forwards the return value of the original method', () => {
        let objectToReturn = {};

        @Immutable()
        class ExampleClass {
            someMethod(): any {
                return objectToReturn;
            }
        }

        let returned = new ExampleClass().someMethod();
        expect(returned).to.equal(objectToReturn);
    });

    it('keeps properties as own property', () => {
        @Immutable()
        class ExampleClass {
            PI = 3.141;
            getPI = () => 3.141;
        }

        let returned = new ExampleClass();
        expect(returned).to.haveOwnProperty('PI');
        expect(returned).to.haveOwnProperty('getPI');
    });

    it('does not change propertiy descriptors of own properties', () => {
        @Immutable()
        class ExampleClass {
            constructor() {
                Object.defineProperty(this, 'someProp', { enumerable: false, value: 1 });
            }
        }

        const instance = new ExampleClass();
        const descriptor = Object.getOwnPropertyDescriptor(instance, 'someProp');
        expect(descriptor).not.to.be.undefined;
        expect(descriptor.enumerable).to.be.false;
        expect(descriptor.value).to.equal(1);
    });

    it('keeps methods in the prototype', () => {
        let objectToReturn = {};

        @Immutable()
        class ExampleClass {
            double(a: number): number {
                return 2 * a;
            }
        }

        let returned = new ExampleClass();
        expect(returned).not.to.haveOwnProperty('double');
        expect(ExampleClass.prototype).to.haveOwnProperty('double');
        expect(ExampleClass.prototype).to.respondTo('double');
    });

    it('keeps the name of the original class', () => {
        @Immutable()
        class ExampleClass { }

        expect(ExampleClass.name).to.equal('ExampleClass');

        @Immutable()
        class Fruit { }

        expect(Fruit.name).to.equal('Fruit');
    });

    it('keeps the metadata of the original class', () => {
        // Reflect-metadata does this via the prototype chain.
        // This tests if the behavior stays as expected in the future.

        if (typeof Reflect !== 'object' || !('defineMetadata' in Reflect)) {
            mocha.currentTest.skip('No support for Reflect.defineMetadata');
            return;
        }

        class ExampleClass { }
        (Reflect as any).defineMetadata('annotations', ['some annotations'], ExampleClass);

        const ImmutableClass = createImmutableClass(ExampleClass);
        const savedMetadata = (Reflect as any).getMetadata('annotations', ImmutableClass);
        expect(savedMetadata).to.deep.equal(['some annotations']);
    });

    it('copies properties when a reference is returned by the original constructor', () => {
        let objectToReturn = {
            color: 'red'
        };

        @Immutable()
        class ExampleClass {
            constructor() {
                return objectToReturn;
            }
        }

        let returned = new ExampleClass();
        expect(returned).not.to.equal(objectToReturn);
        expect(returned).to.have.property('color').that.equals('red');
    });

    it('copies all static properties from the original constructor', () => {
        @Immutable()
        class ExampleClass {
            static numbers = [1, 2, 3];
            static getPI() { return 3.14; }
        }

        expect(ExampleClass).to.have.property('numbers').which.deep.equals([1, 2, 3]);
        expect(ExampleClass.getPI()).to.equal(3.14);
    });

    it('passes all parameters to the original constructor', () => {
        let calledWith = [] as any[];

        @Immutable()
        class ExampleClass {
            constructor(font: string, size: number) {
                calledWith = [font, size];
            }
        }

        let instance = new ExampleClass('Arial', 14);
        expect(calledWith).to.deep.equal(['Arial', 14]);
    });

    describe('generated methods', () => {

        beforeEach(() => {
            immutableSettings({ checkMutability: true });
        });

        it('are not bound to an instance', () => {
            let calledFor: any;

            @Immutable()
            class ExampleClass {
                method() {
                    calledFor = this;
                }
            }

            const first = new ExampleClass();
            const second = new ExampleClass();
            first.method.call(second);
            expect(calledFor).to.equal(second);
        });

        it('are bound to the original class', () => {
            @Immutable()
            class ExampleClassOne {
                getNumber() { return 1; }
            }

            class ExampleClassTwo {
                getNumber() { return 2; }
            }

            const one = new ExampleClassOne();
            const two = new ExampleClassTwo();

            let shouldBe1 = one.getNumber.call(two);
            expect(shouldBe1).to.equal(1);
        });

        it('are bound to the original method', () => {
            class ExampleClassOne {
                getNumber() { return 1; }
            }

            const OneAsImmutable = createImmutableClass(ExampleClassOne);

            ExampleClassOne.prototype.getNumber = () => 2;

            const one = new OneAsImmutable();
            expect(one.getNumber()).to.equal(1);
        });

        it('throws when an object property is changed non-immutable', () => {
            @Immutable()
            class BadNonImmutableList {
                list: string[] = [];
                add(entry: string) {
                    this.list.push(entry);
                }
            }

            const list = new BadNonImmutableList();
            expect(() => list.add('Hello World')).to.throw();
        });

        it('does not throw when an object property is changed by reference', () => {
            @Immutable()
            class ImmutableList {
                list: string[] = [];
                add(entry: string) {
                    this.list = [...this.list, entry];
                }
            }

            const list = new ImmutableList();
            expect(() => list.add('Hello World')).not.to.throw();
        });

        it('throws when a parameter is changed', () => {
            @Immutable()
            class ArgumentChangingClass {
                storeObject(obj: { color: string }) {
                    obj.color = 'red';
                }
            }

            const instance = new ArgumentChangingClass();
            expect(() => instance.storeObject({ color: 'green' })).to.throw();
            expect(() => instance.storeObject({ color: 'red' })).not.to.throw();
        });

        function keepsReferencesTest() {
            @Immutable()
            class ChangeableCounter {
                @CloneDepth(1)
                counter = { currentNumber: 1 };

                setCounterTo(newValue: number) {
                    this.counter.currentNumber = newValue;
                }
            }

            const instance = new ChangeableCounter();
            instance.setCounterTo(1234);

            const referenceBefore = instance.counter;
            instance.setCounterTo(1234);
            const referenceAfterNoChange = instance.counter;
            instance.setCounterTo(5678);
            const referenceAfterChange = instance.counter;

            expect(referenceBefore.currentNumber).to.equal(1234);
            expect(referenceAfterNoChange.currentNumber).to.equal(1234);
            expect(referenceAfterChange.currentNumber).to.equal(5678);
            expect(referenceAfterNoChange).to.equal(referenceBefore, 'after no change !== before');
            expect(referenceAfterChange).not.to.equal(referenceBefore, 'after change === before');
        }

        it('keep references which did not change during call (with mutability checking)', () => {
            immutableSettings({ checkMutability: true });
            keepsReferencesTest();
        });

        it('keep references which did not change during call (mutability checking disabled)', () => {
            immutableSettings({ checkMutability: false });
            keepsReferencesTest();
        });

    });

});

describe('restoreUnchangedProperties (internal)', () => {

    it('keeps original references when all properties are equal', () => {
        const original = { list: [ { color: 'red' }, { color: 'green' } ] };
        const clone = { list: [ { color: 'red' }, { color: 'green' } ] };
        restoreUnchangedProperties(clone, original, 3);
        expect(clone).not.to.equal(original);
        expect(clone.list).to.equal(original.list);
    });

    it('uses changed references when any property changed', () => {
        const original = { list: [ { color: 'red' }, { color: 'green' } ] };
        const clone = { list: [ { color: 'red' }, { color: 'not green' } ] };
        restoreUnchangedProperties(clone, original, 3);
        expect(clone).not.to.equal(original);
        expect(clone.list).not.to.equal(original.list);
        expect(clone.list[0]).to.equal(original.list[0]);
        expect(clone.list[1]).not.to.equal(original.list[1]);
    });

    it('uses changed references when any property changed', () => {
        const original = { list: [ { color: 'red' }, { color: 'green' } ] };
        const clone = { list: [ { color: 'red' }, { color: 'not green' } ] };
        restoreUnchangedProperties(clone, original, 3);
        expect(clone).not.to.equal(original);
        expect(clone.list).not.to.equal(original.list);
        expect(clone.list[0]).to.equal(original.list[0]);
        expect(clone.list[1]).not.to.equal(original.list[1]);
    });

});
