/**
 * Compares two values by their value or the values of their properties.
 * No deep-comparison of nested arrays/objects is done, only one level deep.
 */
export function differs(valA: any, valB: any): boolean {
    let typeA = typeof valA;
	if (typeA !== 'object' || valA === null) {
        return valA !== valB;
    }
	let typeB = typeof valB;
    if (typeB !== typeA) {
        return true;
    }

    let aIsArray = Array.isArray(valA);
    let bIsArray = Array.isArray(valB);

	if (aIsArray !== bIsArray) {
        return true;
    } else if (!aIsArray) {
        let keysA = Object.keys(valA);
        let keysB = Object.keys(valB);
        if (keysA.length !== keysB.length) {
            return true;
        }

		for (let index = 0; index < keysA.length; index++) {
            if (keysA[index] !== keysB[index]) {
                return true;
            }

			if (valA[keysA[index]] !== valB[keysB[index]]) {
                return true;
            }
        }

		return false;
    } else if (valA.length !== valB.length) {
        return true;
    } else {
        for (let index = 0; index < valA.length; index++) {
            if (valA[index] !== valB[index]) {
                return true;
            }
        }
        return false;
    }
}
