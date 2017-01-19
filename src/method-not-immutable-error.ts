import { InputMutations } from './function-mutates-input';
import { getFunctionName, getFunctionArgs } from './utils';

const paddingWhitespace = '                                ';

/**
 * Error thrown when a method is marked as immutable but modifies its input values.
 */
export class MethodNotImmutableError extends Error {

    readonly method: string;
    readonly class: string | undefined;
    readonly diff: string;

    constructor(mutations: InputMutations,
                originalMethod: Function,
                originalConstructor?: Function, methodName?: string) {

        if (!methodName) {
            const prototype = originalConstructor && originalConstructor.prototype || undefined;
            methodName = getFunctionName(originalMethod, prototype);
        }

        const className = originalConstructor && getFunctionName(originalConstructor);
        const message = (className ? className + '.' : '') + methodName + ' mutates properties.';

        super(message);

        // Fix for TypeScript when emitting to { target: "es5" }
        if (!(this instanceof MethodNotImmutableError)) {
            Object.setPrototypeOf(this, MethodNotImmutableError.prototype);
        }

        Object.defineProperty(this, 'name', {
            configurable: true,
            value: 'MethodNotImmutableError',
            writable: true
        });

        const argNames = getFunctionArgs(originalMethod);
        Object.defineProperty(this, 'diff', {
            configurable: true,
            value: createMutationDiff(mutations, argNames),
            writable: false
        });

        this.class = className;
        this.message = message;
        this.method = methodName;
    }

    toString(): string {
        return this.name + ': ' + this.message + '\n\nChanges:\n' + this.diff;
    }
}


type DiffLine = { sign: string, path: string, value: string };

function createMutationDiff(mutations: InputMutations, argNames: string[]): string {
    const allChanges = mutations.this
        .map(prop => ({
            prop,
            path: 'this' + pathToString(prop.path)
        }))
        .concat(
            ...Object.keys(mutations.args)
                .map(index => mutations.args[+index]
                    .map(prop => ({
                        prop,
                        path: (argNames[+index] || '<argument ' + index + '>') + pathToString(prop.path)
                    }))
                )
        );

    const added = allChanges
        .filter(change => 'newValue' in change.prop)
        .map(change => ({
            sign: '+',
            path: change.path,
            value: formatJsValue(change.prop.newValue)
        }));
    const removed = allChanges
        .filter(change => 'oldValue' in change.prop)
        .map(change => ({
            sign: '-',
            path: change.path,
            value: formatJsValue(change.prop.oldValue)
        }));

    const diffLines: DiffLine[] = [...added, ...removed];
    const longestPath = Math.max(...diffLines.map(line => line.path.length))
    const diff = diffLines
        .sort((lineA, lineB) =>
            (lineA.path < lineB.path)
                ? -1
                : (lineA.path > lineB.path)
                    ? 1
                    : lineB.sign > lineA.sign
                        ? 1
                        : -1
        )
        .map(({ sign, path, value }) =>
            sign + (path + paddingWhitespace).substr(0, longestPath) + '   ' + value)
        .join('\n');

    return diff;
}


const numericIndexRx = /^(?:0|[1-9]\d*)$/;
const safePropNameRx = /^\w[\w\d]*$/;

/**
 * Format an array as javascript property paths.
 * @example
 *     pathTo(['list', '3', 'id']) // => ".list[3].id"
 * @internal
 */
export function pathToString(path: string[]): string {
    return path.map(part => {
        if (numericIndexRx.test(part)) {
            return '[' + part + ']';
        } else if (safePropNameRx.test(part)) {
            return '.' + part;
        }
        return '[' + JSON.stringify(part) + ']';
    }).join('');
}

/**
 * Format any value to a single-line, understandable representation.
 * @internal
 */
function formatJsValue(value: any): string {
    const type = typeof value;
    if (type === 'string') {
        return JSON.stringify(value);
    } else if (value === null) {
        return 'null';
    } else if (Array.isArray(value)) {
        return '[' + value.map(el => formatJsValue(el)).join(',') + ']';
    } else if (type === 'function') {
        return 'function';
    } else if (value instanceof RegExp) {
        return value.toString();
    } else if (type === 'object') {
        return Object.prototype.toString.call(value);
    }
    return String(value);
}
