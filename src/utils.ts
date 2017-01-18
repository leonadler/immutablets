/** @internal */
export function getFunctionName(fn: Function): string {
    if (Object.prototype.hasOwnProperty.call(fn, 'name')) {
        return fn.name;
    }

    const source = Function.prototype.toString.apply(fn);
    return parseFunctionSource(source).name;
}

/** @internal */
export function getFunctionArgs(fn: Function): string[] {
    const source = Function.prototype.toString.apply(fn);
    return parseFunctionSource(source).argNames;
}

/** @internal */
const functionRx = /^\s*(?:function\*? *([^)\n]*)\(([^)]*)\)|([^\s=\(,]+) *=>|\(([^\)]*)\) *=>|(\w+)\((?!function)([^)\n=<>]*?)\) *\{)/;

/**
 * Parses functions and arrows functions to get the function name and argument names.
 * @internal
 */
export function parseFunctionSource(source: string): { name: string, argNames: string[] } {
    const match = source.match(functionRx) || [];
    const [, functionName, functionArgs, arrowSingleArg, arrowArgs, methodName, methodArgs] = match;
    const args = functionArgs || arrowSingleArg || arrowArgs || methodArgs || '';
    const name = functionName || methodName || '';
    const argNames = args
        .split(',')
        .filter(arg => arg.indexOf('...') < 0)
        .map(arg => arg.replace(/^\s*(\w+)(?: *=.+)?\s*/, '$1'))
        .filter(s => !!s);
    return { name, argNames };
}
