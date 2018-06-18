import { isConstructingImmutable } from './immutable-decorator';
import { isImmutableClass } from './is-immutable-class';
import { getFunctionName, getImmutableClassMetadata, isArray, objectDefineProperty, objectGetPrototypeOf } from './utils';

/**
 * Abstract base class for state action branches of an {@link ImmutableStateStore}.
 */
export abstract class StateActionBranch<StateType> {
    protected readonly initialState!: { [Branch in keyof StateType]?: StateType[Branch] | undefined };

    constructor({ uses, initialState }: {
            uses: keyof StateType | (keyof StateType)[],
            initialState: { [Branch in keyof StateType]?: StateType[Branch] | undefined }
        }) {

        const prototype = objectGetPrototypeOf(this);
        if (prototype === StateActionBranch.prototype) {
            throw new TypeError('StateActionBranch must be derived in a new class.');
        }

        if (!isConstructingImmutable()) {
            throw new TypeError(getFunctionName(prototype.constructor) + ' inherits StateActionBranch but is not marked as Immutable.');
        }

        let usedKeys: (keyof StateType)[] = isArray(uses) ? uses : [uses];
        for (let key of usedKeys) {
            objectDefineProperty(this, key, {
                configurable: true,
                enumerable: true,
                writable: true,
                value: initialState[key]
            });
        }

        objectDefineProperty(this, 'initialState', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: initialState
        });
    }
}
