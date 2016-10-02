import { expect } from 'chai';
import { findMutatedProperties } from './function-changes';

describe('findMutatedProperties()', () => {

    it('detects simple single-line assignments', () => {
        let props = findMutatedProperties(pos => { pos.x = 0; });
        expect(props).to.deep.equal({
            simple: true,
            props: ['x']
        });
    });

    it('detects simple assignments', () => {
        let props = findMutatedProperties(x => {
            x.someProp = 1;
            x.otherProp = 'A';
        });
        expect(props).to.deep.equal({
            simple: true,
            props: ['someProp', 'otherProp']
        });
    });

    it('detects arithmetic operations', () => {
        let props = findMutatedProperties(pos => {
            pos.t++;
            --pos.u;
            pos.v += 1;
            pos.w /= 2;
            pos.x += 1;
            pos.y *= 2;
            pos.z -= 2;
        });
        expect(props).to.deep.equal({
            simple: true,
            props: ['t', 'u', 'v', 'w', 'x', 'y', 'z']
        });
    });

    it('cancels on index operator', () => {
        let props = findMutatedProperties(hugeList => {
            hugeList[hugeList.indexOf(5)] = true;
        });
        expect(props).to.deep.equal({
            simple: false
        });
    });

    it('cancels on function calls', () => {
        let someFunction = (arg: any) => {};
        let props = findMutatedProperties(someList => {
            someFunction(someList);
        });
        expect(props).to.deep.equal({
            simple: false
        });
    });

});
