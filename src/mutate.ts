import { findMutatedProperties } from './function-changes';


/**
 * Mutate an array/object and return a new copy with the changes applied.
 * If no properties were changed, the original array/object is returned.
 */
export function mutate<T>(input: T, mutator: (input: T) => any, thisArg?: any): T {
    let clone: T;
    let hasChanged: boolean;

    if (Array.isArray(input)) {
        clone = Array.prototype.slice.call(input);

        mutator.call(thisArg, clone);

        hasChanged = input.some((val, index) => (clone as any)[index] !== val);

    } else {
    	clone = Object.assign(Object.create(Object.getPrototypeOf(input)), input);

        // If an object is mutated, try to parse the mutator to only compare changed values.
        let propsThatChange = findMutatedProperties(mutator);

        mutator.call(thisArg, clone);

        if (propsThatChange.simple) {
            hasChanged = propsThatChange.props.some(prop => (input as any)[prop] !== (clone as any)[prop]);
        } else {
            hasChanged = Object.keys(clone).some(key => (input as any)[key] !== (clone as any)[key]);
        }
    }

	// Only return the clone if values changed
    return hasChanged ? clone : input;
}


