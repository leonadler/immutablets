import { expect } from 'chai';
import { Immutable } from './immutable-decorator';
import { ImmutableSettings } from './immutable-interfaces';
import { immutableSettings, getSettings } from './immutable-settings';
import { getImmutableClassMetadata } from './utils';


describe('immutableSettings', () => {

    describe('(global)', () => {

        it('changes the global settings when called without a target', () => {
            immutableSettings({ checkMutability: true });
            expect(getSettings()!.checkMutability).to.be.true;
            immutableSettings({ checkMutability: false });
            expect(getSettings()!.checkMutability).to.be.false;
        });

        it('does not store the passed reference', () => {
            const settingsThatChange: ImmutableSettings = {
                checkMutability: true
            };
            immutableSettings(settingsThatChange);

            expect(getSettings()!.checkMutability).to.be.true;
            settingsThatChange.checkMutability = false;
            expect(getSettings()!.checkMutability).to.be.true;
        });

    });

    describe('(class)', () => {

        it('stores the passed settings as metadata', () => {
            @Immutable()
            class TestClass { }

            immutableSettings(TestClass, { checkMutability: true });
            expect(getImmutableClassMetadata(TestClass)).not.to.be.undefined;
        });

        it('stores the settings by reference', () => {
            const settings: ImmutableSettings = { checkMutability: true };
            @Immutable()
            class TestClass { }
            immutableSettings(TestClass, settings);

            const storedSettings = getSettings(TestClass)!;
            settings.checkMutability = true;
            expect(storedSettings).not.to.be.undefined;
            expect(storedSettings.checkMutability).to.be.true;

            settings.checkMutability = false;
            expect(storedSettings.checkMutability).to.be.false;
        });

    });

});

describe('getSettings (internal)', () => {

    it('returns the settings stored', () => {
        @Immutable()
        class TestClass { }

        const settings: ImmutableSettings = { checkMutability: true };
        immutableSettings(TestClass, settings);
        const target = new TestClass();

        settings.checkMutability = true;
        expect(getSettings(target)!.checkMutability).to.equal(true);
        settings.checkMutability = false;
        expect(getSettings(target)!.checkMutability).to.equal(false);
    });

    it('returns the global settings if the target has no settings', () => {
        immutableSettings({ checkMutability: true });
        const target = {};
        expect(getSettings(target)!.checkMutability).to.be.true;

        immutableSettings({ checkMutability: false });
        expect(getSettings(target)!.checkMutability).to.be.false;
    });

});
