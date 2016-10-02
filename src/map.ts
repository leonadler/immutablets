import { differs } from './differs';

/** Map the values of an array to new values. When no properties are changed, the passed array is returned. */
export function map<T>(input: T[], mapping: (value: T, index: number, array: T[]) => T, thisArg?: any): T[];

/** Map the values of an object to new values. When no properties are changed, the passed object is returned. */
export function map<T>(input: { [key: string]: T}, mapping: (prop: T, key: string, object: { [key: string]: T }) => T, thisArg?: any): { [key: string]: T };

/** Map the values of an object to new values. When no properties are changed, the passed object is returned. */
export function map<T, U>(input: T, mapping: (prop: U, key: string, object: T) => U, thisArg?: any): T;

export function map<T>(input: T, mapFn: Function, thisArg?: any): T {
	let hasChanged = false;
	let clone: any;

	if (Array.isArray(input)) {
        clone = Array.prototype.slice.call(input);
        let length = input.length;
        for (let index = 0; index < length; index++) {
            let element = input[index];
            let result = mapFn.call(thisArg, element, index, input);

            if (differs(result, element)) {
                hasChanged = true;
                clone[index] = result;
            } else {
                clone[index] = element;
            }
        }
    } else {
        clone = Object.assign(Object.create(Object.getPrototypeOf(input)), input);
        let keys = Object.keys(input);
        for (let index = 0; index < keys.length; index++) {
        	let prop = (input as any)[keys[index]];
            let result = mapFn.call(thisArg, prop, keys[index], input);

            if (differs(result, prop)) {
                hasChanged = true;
                clone[keys[index]] = result;
            } else {
                clone[keys[index]] = prop;
            }
        }
    }

	return hasChanged ? clone : input;
}
