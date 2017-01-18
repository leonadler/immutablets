import { ImmutableSettings } from './immutable-interfaces';
import { getImmutableMetadata, setImmutableMetadata } from './utils';

/** @internal */
export const immutableObserversSymbol = typeof Symbol === 'function'
    ? Symbol('immutable-observers')
    : '@@immutable-observers';

/** @internal */
export const globalSettings: ImmutableSettings = {
    checkMutability: true
};

/** @internal */
export function getSettings(target?: any): ImmutableSettings | undefined {
    if (target) {
        const metadata = getImmutableMetadata(target);
        return metadata && metadata.settings || globalSettings;
    } else {
        return globalSettings;
    }
}

/** Change the global settings for ImmutableTS. */
export function immutableSettings(settings: ImmutableSettings): void;

/** Change the ImmutableTS settings for a specific class. */
export function immutableSettings(classConstructor: { new(): any, prototype: any }, settings: ImmutableSettings): void;

export function immutableSettings(classOrGlobalSettings: any, classSettings?: ImmutableSettings): void {
    if (!classSettings) {
        // global settings
        const settings = classOrGlobalSettings as ImmutableSettings;
        globalSettings.checkMutability = settings.checkMutability;
    } else {
        const metadata = getImmutableMetadata(classOrGlobalSettings);
        debugger;
        if (!metadata) {
            throw new TypeError('Not an immutable class');
        }
        metadata.settings = classSettings;
    }
}
