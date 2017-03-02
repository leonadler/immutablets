import { deepClone } from './deep-clone';
import { TrackedMethodCall } from './immutable-interfaces';
import { getImmutableClassMetadata } from './utils';
import { ImmutableStateStore } from './immutable-state-store';

declare var console: VaryingConsoleImplementations;
declare var document: any;
declare var navigator: { userAgent: string; vendor: string; };
declare var process: any;
declare var v8debug: any;
declare var window: any;

/** Logger that logs a method call to the console. Works in browsers and node. */
export function logMethodCallToConsole(call: TrackedMethodCall<any>): void {
    /** Internet Explorer only sets window.console while the developer tools are opened. */
    if (typeof console !== 'object' || !console || !console.log || !call) { return; }

    const originalMethod = getOriginalMethod(call.instance, call.methodName);
    const support = determineConsoleFeaturesSupportedByEnvironment();
    const timeColor = call.callDuration > 200 ? 'red' : (call.callDuration > 50 ? 'orange' : 'green');
    const changedBranches = Object.keys(call.changes || {});
    const duration = (call.callDuration || 0).toFixed(2);

    if (support.styledGroups) {
        // Full-featured browser output, only supported by chrome (march 2017).
        console.groupCollapsed(`${call.methodName} %c(${duration})`, `color: ${timeColor}`);
        console.log(`time: %c${duration}ms`, `color: ${timeColor}`);
        console.log('method: ', originalMethod);

        if (call.arguments && call.arguments.length) {
            console.log('arguments: ', ...deepClone(call.arguments, 5));
        } else {
            console.log('arguments: %c<none>', 'color: #999');
        }

        if (call.returnValue !== undefined) {
            console.log('return value: ', call.returnValue)
        }

        console.groupCollapsed('%cchanged state branches: %c' + changedBranches.join(', '), 'font-weight: normal', 'font-weight: bold');
        for (let key of changedBranches) {
            console.log(`%c${key} changed from `, 'font-style: italic', call.changes[key].oldValue, ' to ', call.changes[key].newValue);
        }
        console.groupEnd();

        console.log('state before: ', call.oldProperties);
        console.log('state after: ', call.newProperties);
        console.groupEnd();

    } else if (support.expandableObjects) {
        // Firefox, IE, Edge, Safari, etc
        const outputObject = {
            time: call.callDuration.toFixed(2) + 'ms',
            method: originalMethod,
            arguments: call.arguments && call.arguments.length ? call.arguments : '<none>',
            returnValue: call.returnValue,
            changedBranches: call.changes,
            stateBefore: call.oldProperties,
            stateAfter: call.newProperties
        };

        if (support.styledOutput) {
            console.log(`${call.methodName} %c(${duration})%c - %o`, `color: ${timeColor}`, 'color: black', outputObject);
        } else {
            console.log(`${call.methodName} (${duration}) - `, outputObject);
        }
    } else if (support.terminalEscapeSequences) {
        // Node when run from command-line
        console.log(ansiSequence('underline') + call.methodName + ansiSequence(timeColor) + ' (' + duration + ')' + ansiSequence('reset'));
        console.log(`    time: ${ansiSequence(timeColor)}${duration}ms${ansiSequence('reset')}`);
        if (call.arguments && call.arguments.length) {
            console.log('    arguments: ');
            for (let arg of call.arguments) {
                console.log('    - ' + JSON.stringify(arg, null, 2).replace(/\n/g, '\n    '));
            }
        } else {
            console.log(`    arguments: ${ansiSequence('gray')}<none>${ansiSequence('reset')}`);
        }

        if (call.returnValue !== undefined) {
            console.log('    return value: ', call.returnValue);
        }

        console.log('    changed state branches: ' + changedBranches.join(', '));
    } else {
        // Node with debugger attached, weird browsers
        console.log(`${call.methodName} (${duration})`);
    }
}


function getOriginalMethod(instance: any, methodName: string): Function | undefined {
    const isStore = instance instanceof ImmutableStateStore;
    const methodParts = methodName.split('.');
    const target = isStore ? instance.actions && instance.actions[methodParts[0]] : instance;
    const metadata = target && getImmutableClassMetadata(Object.getPrototypeOf(target).constructor);
    const originalPrototype = metadata && metadata.originalClass.prototype;
    const propertyKeys = isStore ? methodParts.slice(1) : methodParts;

    let obj = originalPrototype;
    for (let part of propertyKeys) {
        obj = obj && obj[part];
    }
    return obj || undefined;
}

function ansiSequence(color: string): string {
    switch (color) {
        case 'red': return '\x1B[31m';
        case 'green': return '\x1B[0;31m';
        case 'gray': return '\x1B[0;30;1m'
        case 'orange':
        case 'yellow':
            return '\x1B[0;33m';
        case 'underline':
            return '\x1B[0;4m'
        case 'black':
        case 'reset':
        default:
            return '\x1B[0m'
    }
}


interface EnvironmentConsoleSupport {
    collapsedGroups: boolean;
    expandableObjects: boolean;
    groups: boolean;
    styledOutput: boolean;
    styledGroups: boolean;
    terminalEscapeSequences: boolean;
}

let support: EnvironmentConsoleSupport | undefined = undefined;

/** Console implementations vary between different browsers and node. */
interface VaryingConsoleImplementations {
    log(message: any, ...args: any[]): any;
    dir(message: any, ...args: any[]): any;
    group(groupName: string, ...onlyInChrome: any[]): any;
    groupCollapsed(groupName: string, ...onlyInChrome: any[]): any;
    groupEnd(): void;
}

function determineConsoleFeaturesSupportedByEnvironment(): EnvironmentConsoleSupport {
    if (support) {
        return support;
    } else if (typeof console !== 'object') {
        return support = {
            collapsedGroups: false,
            expandableObjects: false,
            groups: false,
            styledGroups: false,
            styledOutput: false,
            terminalEscapeSequences: false
        };
    }

    // Unfortunately, console features can only be detected via user agent sniffing :-/
    const userAgent = typeof navigator === 'object' ? navigator.userAgent : '';
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor) && !/OPR/.test(userAgent);
    const isIE = typeof document === 'object' && !!document.documentMode;
    const isEdge = / Edge\//.test(userAgent);
    const isFirefox = /firefox/i.test(userAgent);
    const isFirebug = !isIE && console.log.toString().indexOf('apply') !== -1;
    const isNode = typeof window === 'undefined' && typeof global === 'object';
    const isTTY = isNode && (typeof process === 'object' && process.stdout && process.stdout.isTTY);
    const styleable = !isIE && !isEdge && !isNode && (!isFirefox || isFirebug);

    return support = {
        collapsedGroups: !!console.groupCollapsed && !isIE && !isEdge && (!isFirefox || isFirebug),
        expandableObjects: !isNode || (typeof v8debug !== 'undefined'),
        groups: !isIE && !!console.group,
        styledGroups: isChrome && styleable,
        styledOutput: styleable,
        terminalEscapeSequences: isNode && isTTY && (typeof v8debug === 'undefined')
    };
}
