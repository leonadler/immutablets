import { getImmutableClassMetadata, setImmutableClassMetadata } from './utils';

/**
 * Property decorator that defines a cloning depth for @Immutable.
 *
 * The default cloning depth of 0 (@CloneDepth(0) can be omitted) means that every property
 * of the class decorated as @Immutable will be copied by-value ("flat cloned") when a property
 * of an instance is called. A depth of 1 copies every property of the property on method call.
 *
 * @example
 *     @Immutable()
 *     class Example {
 *         @CloneDepth(0)
 *         copiedByReferenceA = { prop: 1 };
 *
 *         @CloneDepth(1)
 *         copiedByValueB = { copiedByReferenceB: { prop: 2 } };
 *
 *         @CloneDepth(2)
 *         copiedByValueC = { alsoCopiedByValueC: { copiedByReferenceC: { prop: 3 } } };
 *     }
 */
export function CloneDepth(depth: number): <T>(prototype: T, key: string, dontUseOnMethods?: undefined) => void {
    return function CloneDepthDecorator<T>(prototype: T, key: string): void {
        const existingMetadata = getImmutableClassMetadata(prototype.constructor);
        const cloneDepth = existingMetadata && existingMetadata.cloneDepth || {};
        const metaData = { ...(existingMetadata || {}), cloneDepth: { ...cloneDepth, [key]: depth} };
        setImmutableClassMetadata(prototype.constructor, metaData);
    };
}
