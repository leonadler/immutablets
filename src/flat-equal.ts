/**
 * Returns true if a and b have the same properties and all properties have the same value.
 * Only compares by reference (===), does not check deep equality.
 */
export function flatEqual<T>(a: T, b: T): boolean;
export function flatEqual(a: any, b: any): boolean {
    if (a === b) {
        return true;
    } else if (!a || !b || typeof a !== 'object') {
        return false;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return keysA.length === keysB.length && keysA.every(key => a[key] === b[key]);
}
