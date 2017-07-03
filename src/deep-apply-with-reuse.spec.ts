import { expect } from 'chai';
import { deepApplyWithReuse } from './deep-apply-with-reuse';

describe('deepApplyWithReuse', () => {

    it('overwrites objects which have changed properties', () => {
        const initial = {
            person: {
                firstName: 'John',
                lastName: 'Doe',
                age: 47
            }
        };

        const changes = {
            person: {
                firstName: 'Jane'
            }
        };

        const expected = {
            person: {
                firstName: 'Jane',
                lastName: 'Doe',
                age: 47
            }
        };

        const result = deepApplyWithReuse(initial, changes);
        expect(result.person).not.to.equal(initial.person, 'person was not changed');
        expect(result).to.deep.equal(expected);
    });

    it('does not overwrite objects for which no properties changed', () => {
        const initial = {
            person: {
                firstName: 'John',
                lastName: 'Doe',
                age: 47
            }
        };

        const changes = {
            person: {
                firstName: 'John',
                lastName: 'Doe',
                age: 47
            }
        };

        const result = deepApplyWithReuse(initial, changes);
        expect(result).to.equal(initial);
    });

    it('keeps values of the previous object which are not passed', () => {
        const initial = {
            person: {
                name: 'John Doe',
                gender: 'male',
                lastLogin: 111222333444
            }
        };

        const changes = {
            person: {
                name: 'John Doe',
                lastLogin: 111222333444 + 123
            }
        };

        const expected = {
            person: {
                name: 'John Doe',
                gender: 'male',
                lastLogin: 111222333444 + 123
            }
        };

        const result = deepApplyWithReuse(initial, changes);
        expect(result).not.to.equal(initial, 'result === input');
        expect(result).to.deep.equal(expected);
    });

    it('reuses unchanged references in objects', () => {
        const initial = {
            child: {
                father: {
                    name: 'John Doe',
                    lastLogin: 111222333444
                },
                mother: {
                    name: 'Jane Doe',
                    lastLogin: 111222333444 + 123
                }
            }
        };

        const changes = {
            child: {
                father: {
                    name: 'John Doe',
                    lastLogin: 111222333444 + 123
                }
            }
        };

        const expected = {
            child: {
                father: {
                    name: 'John Doe',
                    lastLogin: 111222333444 + 123
                },
                mother: {
                    name: 'Jane Doe',
                    lastLogin: 111222333444 + 123
                }
            }
        };

        const result = deepApplyWithReuse(initial, changes);
        expect(result).not.to.equal(initial, 'result === input');
        expect(result.child.mother).to.equal(initial.child.mother, 'mother !== mother');
        expect(result).to.deep.equal(expected);
    });

    it('allows setting values to "undefined"', () => {
        const initial = {
            child: {
                father: {
                    name: 'Thomas Wayne'
                },
                mother: {
                    name: 'Martha Wayne'
                }
            }
        };

        const changes = {
            child: {
                father: undefined,
                mother: undefined
            }
        };

        const expected = {
            child: {
                father: undefined,
                mother: undefined
            }
        };

        const result = deepApplyWithReuse(initial, changes);
        expect(result).not.to.equal(initial, 'result === input');
        expect(result).to.deep.equal(expected);
    });

    it('allows setting values to "null"', () => {
        const initial = {
            child: {
                uncle: {
                    name: 'Benjamin Parker'
                },
                aunt: {
                    name: 'May Parker'
                }
            }
        };

        const changes = {
            child: {
                uncle: null
            }
        };

        const expected = {
            child: {
                uncle: null,
                aunt: {
                    name: 'May Parker'
                }
            }
        };

        const result = deepApplyWithReuse(initial, changes as any);
        expect(result).not.to.equal(initial, 'result === input');
        expect(result).to.deep.equal(expected);
    });

    it('reuses unchanged references in arrays', () => {
        const initial = {
            people: [
                {
                    name: 'John Doe',
                    lastLogin: 111222333444
                },
                {
                    name: 'Jane Doe',
                    lastLogin: 111222333444 + 123
                },
            ]
        };

        const changes = {
            people: [
                {
                    name: 'John Doe',
                    lastLogin: 111222333444 + 123
                },
                {
                    name: 'Jane Doe',
                    lastLogin: 111222333444 + 123
                }
            ]
        };

        const expected = {
            people: [
                {
                    name: 'John Doe',
                    lastLogin: 111222333444 + 123
                },
                {
                    name: 'Jane Doe',
                    lastLogin: 111222333444 + 123
                },
            ]
        };

        const result = deepApplyWithReuse(initial, changes);
        expect(result).not.to.equal(initial, 'result === input');
        expect(result.people[1]).to.equal(initial.people[1], 'people[1] !== people[1]');
        expect(result).to.deep.equal(expected);
    });

    it('does not keep excess properties of objects in arrays', () => {
        const initial = {
            fruits: [
                {
                    name: 'Apple',
                    color: 'red',
                    isBrandName: true
                },
                {
                    name: 'Banana',
                    color: 'yellow'
                }
            ]
        };

        const changes = {
            fruits: [
                {
                    name: 'Strawberry',
                    color: 'red'
                }
            ]
        };

        const expected = {
            fruits: [
                {
                    name: 'Strawberry',
                    color: 'red'
                }
            ]
        };

        const wrongOutput = {
            fruits: [
                {
                    name: 'Strawberry',
                    color: 'red',
                    isBrandName: true
                }
            ]
        };

        const result = deepApplyWithReuse(initial, changes);
        expect(result).not.to.equal(initial, 'result === input');
        expect(result).to.deep.equal(expected);
        expect(result).not.to.deep.equal(wrongOutput);
        expect(result.fruits[0]).not.to.have.property('isBrandName');
    });

});
