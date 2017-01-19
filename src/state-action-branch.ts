import { isConstructingImmutable } from './immutable-decorator';
import { isImmutableClass } from './is-immutable-class';
import { getFunctionName, getImmutableMetadata } from './utils';

/**
 * Abstract base class for state action branches of an {@link ImmutableStateStore}.
 */
export abstract class StateActionBranch<StateType> {
    protected readonly initialState: { [Branch in keyof StateType]?: StateType[Branch] | undefined };

    constructor({ uses, initialState }: {
            uses: keyof StateType | (keyof StateType)[],
            initialState: { [Branch in keyof StateType]?: StateType[Branch] | undefined }
        }) {

        const prototype = Object.getPrototypeOf(this);
        if (prototype === StateActionBranch.prototype) {
            throw new TypeError('StateActionBranch must be derived in a new class.');
        }

        if (!isConstructingImmutable()) {
            throw new TypeError(getFunctionName(prototype.constructor) + ' inherits StateActionBranch but is not marked as Immutable.');
        }

        let usedKeys: (keyof StateType)[] = Array.isArray(uses) ? uses : [uses];
        for (let key of usedKeys) {
            Object.defineProperty(this, key, {
                configurable: true,
                enumerable: true,
                writable: true,
                value: initialState[key]
            });
        }

        Object.defineProperty(this, 'initialState', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: initialState
        });
    }
}
