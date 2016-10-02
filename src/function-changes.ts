export type MutatedProperties =  { simple: true, props: string[] } | { simple: false };
let mutateCache: { [source: string]: MutatedProperties } = {};

const sourceRx = /^\s*(?:function [^\(]*?\(([^,)]+?)\) ?\{|([^\s,]+?) ?=>\s*)\{?\s*([\s\S]+?)\s*\}?$/;

/**
 * Try to parse the body of the passed function to find out which properties will be changed.
 * @internal
 */
export function findMutatedProperties(fn: (firstArg: any) => any): MutatedProperties {
    const functionSource = fn.toString();
    if (mutateCache[functionSource]) {
        return mutateCache[functionSource];
    }

    const match = functionSource.match(sourceRx);
    if (!match) {
        return {
            simple: false,
            props: []
        };
    }

    let paramName = match[2] || match[1] || '';
    let body = match[3];
    let regex = new RegExp(`(?:(?:^|\\W)${paramName}(?:(\\[)|\\.([\\w]+)\\s*(?:[-+/*%]?=|\\+\\+|--))|(?:--|\\+\\+)${paramName}\\.([\\w]+)|(${paramName}))`, 'g');
    let found: RegExpExecArray | null;
    let props: string[] = [];

    while (found = regex.exec(body)) {
        // obj[] or fn(obj) was found - we can't parse that.
        if (found[1] || found[4]) {
            return mutateCache[functionSource] = { simple: false };
        }

        // obj.propname was found - add to list.
        let propName = found[2] || found[3];
        if (props.indexOf(propName) < 0) {
            props.push(propName);
        }
    }

    return mutateCache[functionSource] = { simple: true, props };
}
