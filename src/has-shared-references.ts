/**
 * Returns true if the passed object contains any object reference more than once.
 */
export function hasSharedReferences(object: any): boolean {
    if (typeof object !== 'object' || object == null) {
        return false;
    }

    return hasSharedRefs(object, []);
}

/** @internal */
function hasSharedRefs(object: Array<any> | any, traversed: any[]): boolean {
    if (traversed.indexOf(object) >= 0) {
        return true;
    }

    traversed.push(object);

    if (Array.isArray(object)) {
        for (let value of object) {
            if (typeof value === 'object' && value != null && hasSharedRefs(value, traversed)) {
                return true;
            }
        }
    } else {
        for (let key of Object.keys(object)) {
            if (typeof object[key] === 'object' && object[key] != null && hasSharedRefs(object[key], traversed)) {
                return true;
            }
        }
    }

    return false;
}
