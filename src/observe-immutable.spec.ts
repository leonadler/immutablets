import { expect } from 'chai';
import { Immutable } from './immutable-decorator';
import { immutableSettings } from './immutable-settings';
import { observeImmutable } from './observe-immutable';


describe('observeImmutable', () => {

    @Immutable()
    class ImmutableList<T> {
        private items: T[] = [];
        add(item: T): void {
            this.items = [...this.items, item];
        }
        remove(itemToRemove: T): void {
            this.items = this.items.filter(item => item !== itemToRemove);
        }
    }
    immutableSettings(ImmutableList, { checkMutability: true });

    it('returns an observable stream that emits property changes', () => {
        const list = new ImmutableList<number>();
        const emittedChanges = [] as any[];

        const sub = observeImmutable(list).subscribe(changeList => {
            expect(changeList.instance).to.equal(list);
            emittedChanges.push(changeList.changes);
        });

        list.add(47);
        expect(emittedChanges).to.have.length(1);
        expect(emittedChanges[0]).to.deep.equal({
            items: { oldValue: [], newValue: [47] }
        });

        list.add(23);
        expect(emittedChanges).to.have.length(2);
        expect(emittedChanges[1]).to.deep.equal({
            items: { oldValue: [47], newValue: [47, 23] }
        });

        list.add(3.14);
        expect(emittedChanges).to.have.length(3);
        expect(emittedChanges[2]).to.deep.equal({
            items: { oldValue: [47, 23], newValue: [47, 23, 3.14] }
        });

        list.remove(23);
        expect(emittedChanges).to.have.length(4);
        expect(emittedChanges[3]).to.deep.equal({
            items: { oldValue: [47, 23, 3.14], newValue: [47, 3.14] }
        });

        sub.unsubscribe();
    });

    it('collects multiple changes properties in one emit', () => {
        @Immutable()
        class ImmutableAuthentication {
            private isLoggedIn = false;
            private isLoggingIn = false;
            private username: string | undefined;

            startLogin() {
                this.isLoggingIn = true;
            }
            loginSuccess(username: string) {
                this.isLoggingIn = false;
                this.isLoggedIn = true;
                this.username = username;
            }
        }

        const auth = new ImmutableAuthentication();
        const emittedChanges = [] as any[];

        const sub = observeImmutable(auth).subscribe(changeList => {
            expect(changeList.instance).to.equal(auth);
            emittedChanges.push(changeList.changes);
        });

        auth.startLogin();
        expect(emittedChanges).to.have.length(1);
        expect(emittedChanges[0]).to.deep.equal({
            isLoggingIn: { oldValue: false, newValue: true }
        });

        auth.loginSuccess('TestUser');
        expect(emittedChanges).to.have.length(2);
        expect(emittedChanges[1]).to.deep.equal({
            isLoggingIn: { oldValue: true, newValue: false },
            isLoggedIn: { oldValue: false, newValue: true },
            username: { oldValue: undefined, newValue: 'TestUser' }
        });

        sub.unsubscribe();
    });

    it('can be unsubscribed from', () => {
        const list = new ImmutableList<number>();
        const emittedChanges = [] as any[];

        const sub = observeImmutable(list).subscribe(changeList => {
            expect(changeList.instance).to.equal(list);
            emittedChanges.push(changeList.changes);
        });

        list.add(47);
        expect(emittedChanges).to.have.length(1);

        sub.unsubscribe();

        list.add(23);
        list.add(3.14);
        list.remove(23);

        expect(emittedChanges).to.have.length(1);
    });

    it('emits with mutability checks disabled', () => {
        @Immutable()
        class Counter {
            private currentNumber = 0;
            countUp(): void {
                this.currentNumber += 1;
            }
            current(): number {
                return this.currentNumber;
            }
        }
        immutableSettings(Counter, { checkMutability: false })

        const counter = new Counter();
        const emittedChanges = [] as any[];

        const sub = observeImmutable(counter).subscribe(changeList => {
            expect(changeList.instance).to.equal(counter);
            emittedChanges.push(changeList.changes);
        });

        counter.countUp();
        expect(emittedChanges).to.have.length(1);
        expect(emittedChanges[0]).to.deep.equal({
            currentNumber: { oldValue: 0, newValue: 1 }
        });

        counter.countUp();
        expect(emittedChanges).to.have.length(2);
        expect(emittedChanges[1]).to.deep.equal({
            currentNumber: { oldValue: 1, newValue: 2 }
        });

        sub.unsubscribe();
    });
});
