/** @internal */
export const immutableSymbol = Symbol('ImmutableSettings');

/** @internal */
export const globalSettings: ImmutableSettings = {
    checkMutability: true
};

/** @internal */
export function getSettings(target?: any): ImmutableSettings | undefined {
    if (target) {
        return target[immutableSymbol] && target[immutableSymbol].settings || globalSettings;
    } else {
        return globalSettings;
    }
}

export interface ImmutableSettings {
    /**
     * Enable strict mutability checks for methods.
     * Has a negative performance impact, only enable in development and testing.
     */
    checkMutability: boolean;
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
    } else if (classOrGlobalSettings[immutableSymbol] != null) {
        // class settings
        classOrGlobalSettings[immutableSymbol].settings = classSettings;
    } else {
        throw new TypeError('Not an immutable class');
    }
}