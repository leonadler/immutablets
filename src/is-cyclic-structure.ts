/**
 * Returns true if the passed object contains any object reference that contains itself as a child property.
 * If the function returns false, the passed object can be traversed recursively without causing an infinite loop.
 */
export function isCyclicStructure(object: any): boolean {
    if (typeof object !== 'object' || object == null) {
        return false;
    }

    return isCyclic(object, [], []);
}

/** @internal */
function isCyclic(object: Array<any> | any, parents: any[], traversed: any[]): boolean {
    if (parents.indexOf(object) >= 0) {
        return true;
    }
    if (traversed.indexOf(object) >= 0) {
        return false;
    }

    traversed.push(object);
    parents = [...parents, object];

    if (Array.isArray(object)) {
        for (let value of object) {
            if (typeof value === 'object' && value != null && isCyclic(value, parents, traversed)) {
                return true;
            }
        }
    } else {
        for (let key of Object.keys(object)) {
            if (typeof object[key] === 'object' && object[key] != null && isCyclic(object[key], parents, traversed)) {
                return true;
            }
        }
    }

    return false;
}
