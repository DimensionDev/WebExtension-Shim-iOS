(function (Realm, ts) {
    'use strict';

    Realm = Realm && Realm.hasOwnProperty('default') ? Realm['default'] : Realm;
    ts = ts && ts.hasOwnProperty('default') ? ts['default'] : ts;

    /**
     * Check if the current location matches. Used in manifest.json parser
     * @param location Current location
     * @param matches
     * @param exclude_matches
     * @param include_globs
     * @param exclude_globs
     */
    function matchingURL(location, matches, exclude_matches, include_globs, exclude_globs, about_blank) {
        let result = false;
        // ? We eval matches first then eval mismatches
        for (const item of matches)
            if (matches_matcher(item, location, about_blank))
                result = true;
        for (const item of exclude_matches)
            if (matches_matcher(item, location))
                result = false;
        if (include_globs.length)
            console.warn('include_globs not supported yet.');
        if (exclude_globs.length)
            console.warn('exclude_globs not supported yet.');
        return result;
    }
    /**
     * Supported protocols
     */
    const supportedProtocols = [
        'http:',
        'https:',
    ];
    function matches_matcher(_, location, about_blank) {
        if (location.toString() === 'about:blank' && about_blank)
            return true;
        if (_ === '<all_urls>') {
            if (supportedProtocols.includes(location.protocol))
                return true;
            return false;
        }
        const [rule, wildcardProtocol] = normalizeURL(_);
        if (rule.port !== '')
            return false;
        if (!protocol_matcher(rule.protocol, location.protocol, wildcardProtocol))
            return false;
        if (!host_matcher(rule.hostname, location.hostname))
            return false;
        if (!path_matcher(rule.pathname, location.pathname, location.search))
            return false;
        return true;
    }
    /**
     * NormalizeURL
     * @param _ - URL defined in manifest
     */
    function normalizeURL(_) {
        if (_.startsWith('*://'))
            return [new URL(_.replace(/^\*:/, 'https:')), true];
        return [new URL(_), false];
    }
    function protocol_matcher(matcherProtocol, currentProtocol, wildcardProtocol) {
        // ? only `http:` and `https:` is supported currently
        if (!supportedProtocols.includes(currentProtocol))
            return false;
        // ? if wanted protocol is "*:", match everything
        if (wildcardProtocol)
            return true;
        if (matcherProtocol === currentProtocol)
            return true;
        return false;
    }
    function host_matcher(matcherHost, currentHost) {
        // ? %2A is *
        if (matcherHost === '%2A')
            return true;
        if (matcherHost.startsWith('%2A.')) {
            const part = matcherHost.replace(/^%2A/, '');
            if (part === currentHost)
                return false;
            return currentHost.endsWith(part);
        }
        return matcherHost === currentHost;
    }
    function path_matcher(matcherPath, currentPath, currentSearch) {
        if (!matcherPath.startsWith('/'))
            return false;
        if (matcherPath === '/*')
            return true;
        // ? '/a/b/c' matches '/a/b/c#123' but not '/a/b/c?123'
        if (matcherPath === currentPath && currentSearch === '')
            return true;
        // ? '/a/b/*' matches everything startsWith '/a/b/'
        if (matcherPath.endsWith('*') && currentPath.startsWith(matcherPath.slice(undefined, -1)))
            return true;
        if (matcherPath.indexOf('*') === -1)
            return matcherPath === currentPath;
        console.warn('Not supported path matcher in manifest.json', matcherPath);
        return true;
    }

    /**
     * This is a light implementation of JSON RPC 2.0
     *
     * https://www.jsonrpc.org/specification
     *
     * -----------------------------------------------------------------------------
     * Extends to the specification:
     *
     * Request object:
     *      remoteStack?: string
     *          This property will help server print the log better.
     *
     * Error object:
     *      data?: { stack?: string, type?: string }
     *          This property will help client to build a better Error object.
     *              Supported value for "type" field (Defined in ECMAScript standard):
     *                  Error, EvalError, RangeError, ReferenceError,
     *                  SyntaxError, TypeError, URIError
     *
     * Response object:
     *      resultIsUndefined?: boolean
     *          This property is a hint. If the client is run in JavaScript,
     *          it should treat "result: null" as "result: undefined"
     * -----------------------------------------------------------------------------
     * Implemented JSON RPC extension (internal methods):
     * None
     */
    /**
     * Serialization implementation that do nothing
     */
    const NoSerialization = {
        async serialization(from) {
            return from;
        },
        async deserialization(serialized) {
            return serialized;
        },
    };
    const AsyncCallDefaultOptions = ((a) => a)({
        serializer: NoSerialization,
        key: 'default-jsonrpc',
        strict: false,
        log: true,
        parameterStructures: 'by-position',
        preferLocalImplementation: false,
    });
    /**
     * Async call between different context.
     *
     * @remarks
     * Async call is a high level abstraction of MessageCenter.
     *
     * # Shared code
     *
     * - How to stringify/parse parameters/returns should be shared, defaults to NoSerialization.
     *
     * - `key` should be shared.
     *
     * # One side
     *
     * - Should provide some functions then export its type (for example, `BackgroundCalls`)
     *
     * - `const call = AsyncCall<ForegroundCalls>(backgroundCalls)`
     *
     * - Then you can `call` any method on `ForegroundCalls`
     *
     * # Other side
     *
     * - Should provide some functions then export its type (for example, `ForegroundCalls`)
     *
     * - `const call = AsyncCall<BackgroundCalls>(foregroundCalls)`
     *
     * - Then you can `call` any method on `BackgroundCalls`
     *
     * Note: Two sides can implement the same function
     *
     * @example
     * For example, here is a mono repo.
     *
     * Code for UI part:
     * ```ts
     * const UI = {
     *      async dialog(text: string) {
     *          alert(text)
     *      },
     * }
     * export type UI = typeof UI
     * const callsClient = AsyncCall<Server>(UI)
     * callsClient.sendMail('hello world', 'what')
     * ```
     *
     * Code for server part
     * ```ts
     * const Server = {
     *      async sendMail(text: string, to: string) {
     *          return true
     *      }
     * }
     * export type Server = typeof Server
     * const calls = AsyncCall<UI>(Server)
     * calls.dialog('hello')
     * ```
     *
     * @param implementation - Implementation of this side.
     * @param options - Define your own serializer, MessageCenter or other options.
     *
     */
    function AsyncCall(implementation = {}, options) {
        const { serializer, key, strict, log, parameterStructures, preferLocalImplementation } = Object.assign(Object.assign({}, AsyncCallDefaultOptions), options);
        const message = options.messageChannel;
        const { methodNotFound: banMethodNotFound = false, noUndefined: noUndefinedKeeping = false, unknownMessage: banUnknownMessage = false, } = calcStrictOptions(strict);
        const { beCalled: logBeCalled = true, localError: logLocalError = true, remoteError: logRemoteError = true, type: logType = 'pretty', sendLocalStack = false, } = calcLogOptions(log);
        const console = getConsole();
        const requestContext = new Map();
        async function onRequest(data) {
            let frameworkStack = '';
            try {
                // ? We're mapping any method starts with 'rpc.' to a Symbol.for
                const key = (data.method.startsWith('rpc.')
                    ? Symbol.for(data.method)
                    : data.method);
                const executor = implementation[key];
                if (!executor || typeof executor !== 'function') {
                    if (!banMethodNotFound) {
                        if (logLocalError)
                            console.debug('Receive remote call, but not implemented.', key, data);
                        return;
                    }
                    else
                        return ErrorResponse.MethodNotFound(data.id);
                }
                const params = data.params;
                if (Array.isArray(params) || (typeof params === 'object' && params !== null)) {
                    const args = Array.isArray(params) ? params : [params];
                    frameworkStack = removeStackHeader(new Error().stack);
                    const promise = new Promise((resolve, reject) => {
                        try {
                            resolve(executor(...args));
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                    if (logBeCalled) {
                        if (logType === 'basic')
                            console.log(`${options.key}.${data.method}(${[...args].toString()}) @${data.id}`);
                        else {
                            const logArgs = [
                                `${options.key}.%c${data.method}%c(${args.map(() => '%o').join(', ')}%c)\n%o %c@${data.id}`,
                                'color: #d2c057',
                                '',
                                ...args,
                                '',
                                promise,
                                'color: gray; font-style: italic;',
                            ];
                            if (data.remoteStack) {
                                console.groupCollapsed(...logArgs);
                                console.log(data.remoteStack);
                                console.groupEnd();
                            }
                            else
                                console.log(...logArgs);
                        }
                    }
                    const result = await promise;
                    if (result === $AsyncCallIgnoreResponse)
                        return;
                    return new SuccessResponse(data.id, await promise, !!noUndefinedKeeping);
                }
                else {
                    return ErrorResponse.InvalidRequest(data.id);
                }
            }
            catch (e) {
                e.stack = frameworkStack
                    .split('\n')
                    .reduce((stack, fstack) => stack.replace(fstack + '\n', ''), e.stack || '');
                if (logLocalError)
                    console.error(e);
                let name = 'Error';
                name = e.constructor.name;
                const DOMException = haveDOMException();
                if (typeof DOMException === 'function' && e instanceof DOMException)
                    name = 'DOMException:' + e.name;
                return new ErrorResponse(data.id, -1, e.message, e.stack, name);
            }
        }
        async function onResponse(data) {
            let errorMessage = '', remoteErrorStack = '', errorCode = 0, errorType = 'Error';
            if (hasKey(data, 'error')) {
                errorMessage = data.error.message;
                errorCode = data.error.code;
                remoteErrorStack = (data.error.data && data.error.data.stack) || '<remote stack not available>';
                errorType = (data.error.data && data.error.data.type) || 'Error';
                if (logRemoteError)
                    logType === 'basic'
                        ? console.error(`${errorType}: ${errorMessage}(${errorCode}) @${data.id}\n${remoteErrorStack}`)
                        : console.error(`${errorType}: ${errorMessage}(${errorCode}) %c@${data.id}\n%c${remoteErrorStack}`, 'color: gray', '');
            }
            if (data.id === null || data.id === undefined)
                return;
            const { f: [resolve, reject], stack: localErrorStack, } = requestContext.get(data.id) || { stack: '', f: [null, null] };
            if (!resolve)
                return; // drop this response
            requestContext.delete(data.id);
            if (hasKey(data, 'error')) {
                reject(RecoverError(errorType, errorMessage, errorCode, 
                // ? We use \u0430 which looks like "a" to prevent browser think "at AsyncCall" is a real stack
                remoteErrorStack + '\n    \u0430t AsyncCall (rpc) \n' + localErrorStack));
            }
            else {
                resolve(data.result);
            }
        }
        message.on(key, async (_) => {
            let data;
            let result = undefined;
            try {
                data = await serializer.deserialization(_);
                if (isJSONRPCObject(data)) {
                    result = await handleSingleMessage(data);
                    if (result)
                        await send(result);
                }
                else if (Array.isArray(data) && data.every(isJSONRPCObject) && data.length !== 0) {
                    const result = await Promise.all(data.map(handleSingleMessage));
                    // ? Response
                    if (data.every(x => x === undefined))
                        return;
                    await send(result.filter(x => x));
                }
                else {
                    if (banUnknownMessage) {
                        await send(ErrorResponse.InvalidRequest(data.id || null));
                    }
                    else {
                        // ? Ignore this message. The message channel maybe also used to transfer other message too.
                    }
                }
            }
            catch (e) {
                console.error(e, data, result);
                send(ErrorResponse.ParseError(e.stack));
            }
            async function send(res) {
                if (Array.isArray(res)) {
                    const reply = res.map(x => x).filter(x => x.id !== undefined);
                    if (reply.length === 0)
                        return;
                    message.emit(key, await serializer.serialization(reply));
                }
                else {
                    if (!res)
                        return;
                    // ? This is a Notification, we MUST not return it.
                    if (res.id === undefined)
                        return;
                    message.emit(key, await serializer.serialization(res));
                }
            }
        });
        return new Proxy({}, {
            get(_target, method) {
                let stack = removeStackHeader(new Error().stack);
                return (...params) => {
                    if (typeof method !== 'string') {
                        if (typeof method === 'symbol') {
                            const internalMethod = Symbol.keyFor(method);
                            if (internalMethod)
                                method = internalMethod;
                        }
                        else
                            return Promise.reject(new TypeError('[AsyncCall] Only string can be the method name'));
                    }
                    else if (method.startsWith('rpc.'))
                        return Promise.reject(new TypeError('[AsyncCall] You cannot call JSON RPC internal methods directly'));
                    if (preferLocalImplementation && typeof method === 'string') {
                        const localImpl = implementation[method];
                        if (localImpl && typeof localImpl === 'function') {
                            return new Promise((resolve, reject) => {
                                try {
                                    resolve(localImpl(...params));
                                }
                                catch (e) {
                                    reject(e);
                                }
                            });
                        }
                    }
                    return new Promise((resolve, reject) => {
                        const id = generateRandomID();
                        const param0 = params[0];
                        const sendingStack = sendLocalStack ? stack : '';
                        const param = parameterStructures === 'by-name' && params.length === 1 && isObject(param0)
                            ? param0
                            : params;
                        const request = new Request$1(id, method, param, sendingStack);
                        serializer.serialization(request).then(data => {
                            message.emit(key, data);
                            requestContext.set(id, {
                                f: [resolve, reject],
                                stack,
                            });
                        }, reject);
                    });
                };
            },
        });
        async function handleSingleMessage(data) {
            if (hasKey(data, 'method')) {
                return onRequest(data);
            }
            else if ('error' in data || 'result' in data) {
                onResponse(data);
            }
            else {
                if ('resultIsUndefined' in data) {
                    data.result = undefined;
                    onResponse(data);
                }
                else
                    return ErrorResponse.InvalidRequest(data.id);
            }
            return undefined;
        }
    }
    const $AsyncCallIgnoreResponse = Symbol.for('AsyncCall: This response should be ignored.');
    /**
     * @internal
     */
    function generateRandomID() {
        return Math.random()
            .toString(36)
            .slice(2);
    }
    /**
     * @internal
     */
    function calcLogOptions(log) {
        const logAllOn = { beCalled: true, localError: true, remoteError: true, type: 'pretty' };
        const logAllOff = { beCalled: false, localError: false, remoteError: false, type: 'basic' };
        return typeof log === 'boolean' ? (log ? logAllOn : logAllOff) : log;
    }
    /**
     * @internal
     */
    function calcStrictOptions(strict) {
        const strictAllOn = { methodNotFound: true, unknownMessage: true, noUndefined: true };
        const strictAllOff = { methodNotFound: false, unknownMessage: false, noUndefined: false };
        return typeof strict === 'boolean' ? (strict ? strictAllOn : strictAllOff) : strict;
    }
    const jsonrpc = '2.0';
    class Request$1 {
        constructor(id, method, params, remoteStack) {
            this.id = id;
            this.method = method;
            this.params = params;
            this.remoteStack = remoteStack;
            this.jsonrpc = '2.0';
            const request = { id, method, params, jsonrpc, remoteStack };
            if (request.remoteStack.length === 0)
                delete request.remoteStack;
            return request;
        }
    }
    class SuccessResponse {
        constructor(id, result, noUndefinedKeeping) {
            this.id = id;
            this.result = result;
            this.jsonrpc = '2.0';
            const obj = { id, jsonrpc, result: result === undefined ? null : result };
            if (!noUndefinedKeeping && result === undefined)
                obj.resultIsUndefined = true;
            return obj;
        }
    }
    class ErrorResponse {
        constructor(id, code, message, stack, type = 'Error') {
            this.id = id;
            this.jsonrpc = '2.0';
            if (id === undefined)
                id = null;
            code = Math.floor(code);
            const error = (this.error = { code, message, data: { stack, type } });
            return { error, id, jsonrpc };
        }
    }
    // Pre defined error in section 5.1
    ErrorResponse.ParseError = (stack = '') => new ErrorResponse(null, -32700, 'Parse error', stack);
    ErrorResponse.InvalidRequest = (id) => new ErrorResponse(id, -32600, 'Invalid Request', '');
    ErrorResponse.MethodNotFound = (id) => new ErrorResponse(id, -32601, 'Method not found', '');
    ErrorResponse.InvalidParams = (id) => new ErrorResponse(id, -32602, 'Invalid params', '');
    ErrorResponse.InternalError = (id, message = '') => new ErrorResponse(id, -32603, 'Internal error' + message, '');
    function isJSONRPCObject(data) {
        if (!isObject(data))
            return false;
        if (!hasKey(data, 'jsonrpc'))
            return false;
        if (data.jsonrpc !== '2.0')
            return false;
        if (hasKey(data, 'params')) {
            const params = data.params;
            if (!Array.isArray(params) && !isObject(params))
                return false;
        }
        return true;
    }
    function isObject(params) {
        return typeof params === 'object' && params !== null;
    }
    function hasKey(obj, key) {
        return key in obj;
    }
    class CustomError extends Error {
        constructor(name, message, code, stack) {
            super(message);
            this.name = name;
            this.code = code;
            this.stack = stack;
        }
    }
    /** These Error is defined in ECMAScript spec */
    const errors = {
        Error,
        EvalError,
        RangeError,
        ReferenceError,
        SyntaxError,
        TypeError,
        URIError,
    };
    /**
     * AsyncCall support somehow transfer ECMAScript Error
     */
    function RecoverError(type, message, code, stack) {
        try {
            const DOMException = haveDOMException();
            if (type.startsWith('DOMException:') && DOMException) {
                const [, name] = type.split('DOMException:');
                return new DOMException(message, name);
            }
            else if (type in errors) {
                const e = new errors[type](message);
                e.stack = stack;
                Object.assign(e, { code });
                return e;
            }
            else {
                return new CustomError(type, message, code, stack);
            }
        }
        catch (_a) {
            return new Error(`E${code} ${type}: ${message}\n${stack}`);
        }
    }
    function removeStackHeader(stack = '') {
        return stack.replace(/^.+\n.+\n/, '');
    }
    function haveDOMException() {
        return Reflect.get(globalThis, 'DOMException');
    }
    function getConsole() {
        const console = Reflect.get(globalThis, 'console');
        const defaultLog = (...args) => {
            if (!console || !console.log)
                throw new Error('Except a console object on the globalThis');
            console.log(...args);
        };
        const defaultConsole = {
            debug: defaultLog,
            error: defaultLog,
            groupCollapsed: defaultLog,
            groupEnd: defaultLog,
            log: defaultLog,
        };
        return Object.assign({}, defaultConsole, console);
    }

    /**
     * Used for keep reference to browser.runtime.onMessage
     */
    const TwoWayMessagePromiseResolver = new Map();
    /**
     * To store listener for Host dispatched events.
     */
    const EventPools = {
        'browser.webNavigation.onCommitted': new Map(),
        'browser.webNavigation.onDOMContentLoaded': new Map(),
        'browser.webNavigation.onCompleted': new Map(),
        'browser.runtime.onMessage': new Map(),
        'browser.runtime.onInstall': new Map(),
    };
    /**
     * Dispatch a normal event (that not have a "response").
     * Like browser.webNavigation.onCommitted
     */
    async function dispatchNormalEvent(event, toExtensionID, ...args) {
        if (!EventPools[event])
            return;
        for (const [extensionID, fns] of EventPools[event].entries()) {
            if (Array.isArray(toExtensionID) && toExtensionID.indexOf(extensionID) === -1)
                continue;
            if (!Array.isArray(toExtensionID) && toExtensionID !== extensionID && toExtensionID !== '*')
                continue;
            for (const f of fns) {
                try {
                    f(...args);
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
    }
    /**
     * Create a `EventObject<ListenerType>` object.
     *
     * Can be set on browser.webNavigation.onCommitted etc...
     */
    function createEventListener(extensionID, event) {
        if (!EventPools[event].has(extensionID)) {
            EventPools[event].set(extensionID, new Set());
        }
        const pool = EventPools[event].get(extensionID);
        const handler = {
            addListener(callback) {
                if (typeof callback !== 'function')
                    throw new TypeError('Listener must be function');
                pool.add(callback);
            },
            removeListener(callback) {
                pool.delete(callback);
            },
            hasListener(listener) {
                return pool.has(listener);
            },
        };
        return handler;
    }

    function deepClone(obj) {
        // todo: change another impl plz.
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Create browser.runtime.sendMessage() function
     * @param extensionID
     */
    function createRuntimeSendMessage(extensionID) {
        return function () {
            let toExtensionID, message;
            if (arguments.length === 1) {
                toExtensionID = extensionID;
                message = arguments[0];
            }
            else if (arguments.length === 2) {
                toExtensionID = arguments[0];
                message = arguments[1];
            }
            else {
                toExtensionID = '';
            }
            return sendMessageWithResponse(extensionID, toExtensionID, null, message);
        };
    }
    function sendMessageWithResponse(extensionID, toExtensionID, tabId, message) {
        return new Promise((resolve, reject) => {
            const messageID = Math.random().toString();
            FrameworkRPC.sendMessage(extensionID, toExtensionID, tabId, messageID, {
                type: 'message',
                data: message,
                response: false,
            }).catch(e => {
                reject(e);
                TwoWayMessagePromiseResolver.delete(messageID);
            });
            TwoWayMessagePromiseResolver.set(messageID, [resolve, reject]);
        });
    }
    /**
     * Message handler of normal message
     */
    function onNormalMessage(message, sender, toExtensionID, extensionID, messageID) {
        const fns = EventPools['browser.runtime.onMessage'].get(toExtensionID);
        if (!fns)
            return;
        let responseSend = false;
        for (const fn of fns) {
            try {
                // ? dispatch message
                const result = fn(deepClone(message), deepClone(sender), sendResponseDeprecated);
                if (result === undefined) {
                    // ? do nothing
                }
                else if (typeof result === 'boolean') {
                    // ! deprecated path !
                }
                else if (typeof result === 'object' && typeof result.then === 'function') {
                    // ? response the answer
                    result.then((data) => {
                        if (data === undefined || responseSend)
                            return;
                        responseSend = true;
                        FrameworkRPC.sendMessage(toExtensionID, extensionID, sender.tab.id, messageID, {
                            data,
                            response: true,
                            type: 'message',
                        });
                    });
                }
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    function sendResponseDeprecated() {
        throw new Error('Returning a Promise is the preferred way' +
            ' to send a reply from an onMessage/onMessageExternal listener, ' +
            'as the sendResponse will be removed from the specs ' +
            '(See https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)');
    }

    const isDebug = location.hostname === 'localhost';
    function parseDebugModeURL(extensionID, manifest) {
        const param = new URLSearchParams(location.search);
        const type = param.get('type');
        let src = param.get('url');
        const base = 'holoflows-extension://' + extensionID + '/';
        if (src === '_options_')
            src = new URL(manifest.options_ui.page, base).toJSON();
        if (src === '_popup_')
            src = new URL(manifest.browser_action.default_popup, base).toJSON();
        if (type === 'b')
            return { env: Environment.backgroundScript, src: '' };
        if (!src)
            throw new TypeError('Need a url');
        if (type === 'p')
            return { env: Environment.protocolPage, src };
        else if (type === 'm')
            return { env: Environment.debugModeManagedPage, src };
        else
            throw new TypeError('To debug, ?type= must be one of (b)ackground, (p)rotocol-page, (m)anaged-page (used to debug content script), found ' +
                type);
    }

    /**
     * This ID is used by this polyfill itself.
     */
    const reservedID = '150ea6ee-2b0a-4587-9879-0ca5dfc1d046';
    async function useInternalStorage(extensionID, modify) {
        if (isDebug) {
            const obj = JSON.parse(localStorage.getItem(reservedID + ':' + extensionID) || '{}');
            if (!modify)
                return Promise.resolve(obj);
            modify(obj);
            localStorage.setItem(reservedID + ':' + extensionID, JSON.stringify(obj));
            return Promise.resolve(obj);
        }
        const obj = (await FrameworkRPC['browser.storage.local.get'](reservedID, extensionID))[extensionID] || {};
        if (!modify)
            return obj;
        modify(obj);
        FrameworkRPC['browser.storage.local.set'](reservedID, { [extensionID]: obj });
        return obj;
    }

    /**
     * Internal RPC calls of webextension-shim. Does not related to the native part.
     *
     * This channel is used as internal RPCs.
     * Use Host.onMessage and Host.sendMessage as channel.
     */
    const internalRPCChannel = new (class WebExtensionInternalChannel {
        constructor() {
            this.listener = [];
        }
        on(_, cb) {
            this.listener.push(cb);
        }
        onReceiveMessage(key, data) {
            for (const f of this.listener) {
                try {
                    f(data);
                }
                catch (_a) { }
            }
        }
        emit(key, data) {
            if (isDebug) {
                console.log('send', data);
            }
            if (!(typeof data === 'object'))
                return;
            if (data.method) {
                if (!Array.isArray(data.params))
                    return;
                if (typeof data.params[0] !== 'number')
                    throw new Error(`Every method of InternalRPCMethods must start with parameter 0 as targetTabID: number`);
                FrameworkRPC.sendMessage(reservedID, reservedID, data.params[0], Math.random() + '', {
                    type: 'internal-rpc',
                    message: data,
                });
                return;
            }
            else {
                FrameworkRPC.sendMessage(reservedID, reservedID, null, Math.random() + '', {
                    type: 'internal-rpc',
                    message: data,
                });
            }
        }
    })();
    const internalRPCLocalImplementation = {
        async executeContentScript(targetTabID, extensionID, manifest, options) {
            console.debug('[WebExtension] requested to inject code', options);
            const ext = registeredWebExtension.get(extensionID);
            if (options.code)
                ext.environment.evaluate(options.code);
            else if (options.file)
                loadContentScript(extensionID, ext.manifest, {
                    js: [options.file],
                    // TODO: check the permission to inject the script
                    matches: ['<all_urls>'],
                }, ext.preloadedResources);
        },
    };
    const internalRPC = AsyncCall(internalRPCLocalImplementation, {
        log: false,
        messageChannel: internalRPCChannel,
    });

    class SamePageDebugChannel {
        constructor(actor) {
            this.actor = actor;
            this.listener = [];
            SamePageDebugChannel[actor].addEventListener('targetEventChannel', e => {
                const detail = e.detail;
                for (const f of this.listener) {
                    try {
                        f(detail);
                    }
                    catch (_a) { }
                }
            });
        }
        on(_, cb) {
            this.listener.push(cb);
        }
        emit(_, data) {
            SamePageDebugChannel[this.actor === 'client' ? 'server' : 'client'].dispatchEvent(new CustomEvent('targetEventChannel', { detail: data }));
        }
    }
    SamePageDebugChannel.server = document.createElement('a');
    SamePageDebugChannel.client = document.createElement('a');

    /**
     * how webextension-shim communicate with native code.
     */
    const key = 'holoflowsjsonrpc';
    class iOSWebkitChannel {
        constructor() {
            this.listener = [];
            document.addEventListener(key, e => {
                const detail = e.detail;
                for (const f of this.listener) {
                    try {
                        f(detail);
                    }
                    catch (_a) { }
                }
            });
        }
        on(_, cb) {
            this.listener.push(cb);
        }
        emit(_, data) {
            if (isDebug) {
                console.log('send', data);
            }
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers[key])
                window.webkit.messageHandlers[key].postMessage(data);
        }
    }
    const ThisSideImplementation = {
        // todo: check dispatch target's manifest
        'browser.webNavigation.onCommitted': dispatchNormalEvent.bind(null, 'browser.webNavigation.onCommitted', '*'),
        'browser.webNavigation.onDOMContentLoaded': dispatchNormalEvent.bind(null, 'browser.webNavigation.onDOMContentLoaded', '*'),
        'browser.webNavigation.onCompleted': dispatchNormalEvent.bind(null, 'browser.webNavigation.onCompleted', '*'),
        async onMessage(extensionID, toExtensionID, messageID, message, sender) {
            switch (message.type) {
                case 'internal-rpc':
                    internalRPCChannel.onReceiveMessage('', message.message);
                    break;
                case 'message':
                    // ? this is a response to the message
                    if (TwoWayMessagePromiseResolver.has(messageID) && message.response) {
                        const [resolve, reject] = TwoWayMessagePromiseResolver.get(messageID);
                        resolve(message.data);
                        TwoWayMessagePromiseResolver.delete(messageID);
                    }
                    else if (message.response === false) {
                        onNormalMessage(message.data, sender, toExtensionID, extensionID, messageID);
                    }
                    break;
                case 'onWebNavigationChanged':
                    if (!sender.tab || sender.tab.id === undefined)
                        break;
                    const param = {
                        tabId: sender.tab.id,
                        url: message.location,
                    };
                    switch (message.status) {
                        case 'onCommitted':
                            ThisSideImplementation['browser.webNavigation.onCommitted'](param);
                            break;
                        case 'onCompleted':
                            ThisSideImplementation['browser.webNavigation.onCompleted'](param);
                            break;
                        case 'onDOMContentLoaded':
                            ThisSideImplementation['browser.webNavigation.onDOMContentLoaded'](param);
                            break;
                        case 'onHistoryStateUpdated':
                            // TODO: not implemented
                            break;
                    }
                    break;
                default:
                    break;
            }
        },
    };
    const FrameworkRPC = AsyncCall(ThisSideImplementation, {
        key: '',
        log: false,
        messageChannel: isDebug ? new SamePageDebugChannel('client') : new iOSWebkitChannel(),
    });
    FrameworkRPC.sendMessage(reservedID, reservedID, null, Math.random() + '', {
        type: 'onWebNavigationChanged',
        status: 'onCommitted',
        location: location.href,
    });
    if (typeof window === 'object') {
        window.addEventListener('DOMContentLoaded', () => {
            FrameworkRPC.sendMessage(reservedID, reservedID, null, Math.random() + '', {
                type: 'onWebNavigationChanged',
                status: 'onDOMContentLoaded',
                location: location.href,
            });
        });
        window.addEventListener('load', () => {
            FrameworkRPC.sendMessage(reservedID, reservedID, null, Math.random() + '', {
                type: 'onWebNavigationChanged',
                status: 'onCompleted',
                location: location.href,
            });
        });
        // TODO: implements onHistoryStateUpdated event.
    }

    function decodeStringOrBlob(val) {
        if (val.type === 'text')
            return val.content;
        if (val.type === 'blob')
            return new Blob([val.content], { type: val.mimeType });
        if (val.type === 'array buffer') {
            return base64DecToArr(val.content).buffer;
        }
        return null;
    }
    async function encodeStringOrBlob(val) {
        if (typeof val === 'string')
            return { type: 'text', content: val };
        if (val instanceof Blob) {
            const buffer = new Uint8Array(await new Response(val).arrayBuffer());
            return { type: 'blob', mimeType: val.type, content: base64EncArr(buffer) };
        }
        if (val instanceof ArrayBuffer) {
            return { type: 'array buffer', content: base64EncArr(new Uint8Array(val)) };
        }
        throw new TypeError('Invalid data');
    }
    //#region // ? Code from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Appendix.3A_Decode_a_Base64_string_to_Uint8Array_or_ArrayBuffer
    function b64ToUint6(nChr) {
        return nChr > 64 && nChr < 91
            ? nChr - 65
            : nChr > 96 && nChr < 123
                ? nChr - 71
                : nChr > 47 && nChr < 58
                    ? nChr + 4
                    : nChr === 43
                        ? 62
                        : nChr === 47
                            ? 63
                            : 0;
    }
    function base64DecToArr(sBase64, nBlockSize) {
        var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ''), nInLen = sB64Enc.length, nOutLen = nBlockSize ? Math.ceil(((nInLen * 3 + 1) >>> 2) / nBlockSize) * nBlockSize : (nInLen * 3 + 1) >>> 2, aBytes = new Uint8Array(nOutLen);
        for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
            nMod4 = nInIdx & 3;
            nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << (18 - 6 * nMod4);
            if (nMod4 === 3 || nInLen - nInIdx === 1) {
                for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                    aBytes[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255;
                }
                nUint24 = 0;
            }
        }
        return aBytes;
    }
    function uint6ToB64(nUint6) {
        return nUint6 < 26
            ? nUint6 + 65
            : nUint6 < 52
                ? nUint6 + 71
                : nUint6 < 62
                    ? nUint6 - 4
                    : nUint6 === 62
                        ? 43
                        : nUint6 === 63
                            ? 47
                            : 65;
    }
    function base64EncArr(aBytes) {
        var eqLen = (3 - (aBytes.length % 3)) % 3, sB64Enc = '';
        for (var nMod3, nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
            nMod3 = nIdx % 3;
            /* Uncomment the following line in order to split the output in lines 76-character long: */
            /*
          if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
          */
            nUint24 |= aBytes[nIdx] << ((16 >>> nMod3) & 24);
            if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                sB64Enc += String.fromCharCode(uint6ToB64((nUint24 >>> 18) & 63), uint6ToB64((nUint24 >>> 12) & 63), uint6ToB64((nUint24 >>> 6) & 63), uint6ToB64(nUint24 & 63));
                nUint24 = 0;
            }
        }
        return eqLen === 0 ? sB64Enc : sB64Enc.substring(0, sB64Enc.length - eqLen) + (eqLen === 1 ? '=' : '==');
    }

    const { createObjectURL, revokeObjectURL } = URL;
    function getIDFromBlobURL(x) {
        if (x.startsWith('blob:'))
            return new URL(new URL(x).pathname).pathname.replace(/^\//, '');
        return undefined;
    }
    /**
     * Modify the behavior of URL.*
     * Let the blob:// url can be recognized by Host.
     *
     * @param url The original URL object
     * @param extensionID
     */
    function enhanceURL(url, extensionID) {
        url.createObjectURL = createObjectURLEnhanced(extensionID);
        url.revokeObjectURL = revokeObjectURLEnhanced(extensionID);
        return url;
    }
    function revokeObjectURLEnhanced(extensionID) {
        return (url) => {
            revokeObjectURL(url);
            const id = getIDFromBlobURL(url);
            FrameworkRPC['URL.revokeObjectURL'](extensionID, id);
        };
    }
    function createObjectURLEnhanced(extensionID) {
        return (obj) => {
            const url = createObjectURL(obj);
            const resourceID = getIDFromBlobURL(url);
            if (obj instanceof Blob) {
                encodeStringOrBlob(obj).then(blob => FrameworkRPC['URL.createObjectURL'](extensionID, resourceID, blob));
            }
            return url;
        };
    }

    const originalConfirm = window.confirm;
    /**
     * Create a new `browser` object.
     * @param extensionID - Extension ID
     * @param manifest - Manifest of the extension
     */
    function BrowserFactory(extensionID, manifest) {
        const implementation = {
            downloads: NotImplementedProxy({
                download: binding(extensionID, 'browser.downloads.download')({
                    param(options) {
                        let { url, filename } = options;
                        if (getIDFromBlobURL(url)) {
                            url = `holoflows-blob://${extensionID}/${getIDFromBlobURL(url)}`;
                        }
                        PartialImplemented(options, 'filename', 'url');
                        const arg1 = { url, filename: filename || '' };
                        return [arg1];
                    },
                    returns() {
                        return 0;
                    },
                }),
            }),
            runtime: NotImplementedProxy({
                getURL(path) {
                    return `holoflows-extension://${extensionID}/${path}`;
                },
                getManifest() {
                    return JSON.parse(JSON.stringify(manifest));
                },
                onMessage: createEventListener(extensionID, 'browser.runtime.onMessage'),
                sendMessage: createRuntimeSendMessage(extensionID),
                onInstalled: createEventListener(extensionID, 'browser.runtime.onInstall'),
            }),
            tabs: NotImplementedProxy({
                async executeScript(tabID, details) {
                    PartialImplemented(details, 'code', 'file', 'runAt');
                    await internalRPC.executeContentScript(tabID, extensionID, manifest, details);
                    return [];
                },
                create: binding(extensionID, 'browser.tabs.create')(),
                async remove(tabID) {
                    let t;
                    if (!Array.isArray(tabID))
                        t = [tabID];
                    else
                        t = tabID;
                    await Promise.all(t.map(x => FrameworkRPC['browser.tabs.remove'](extensionID, x)));
                },
                query: binding(extensionID, 'browser.tabs.query')(),
                update: binding(extensionID, 'browser.tabs.update')(),
                async sendMessage(tabId, message, options) {
                    PartialImplemented(options);
                    return sendMessageWithResponse(extensionID, extensionID, tabId, message);
                },
            }),
            storage: {
                local: Implements({
                    clear: binding(extensionID, 'browser.storage.local.clear')(),
                    remove: binding(extensionID, 'browser.storage.local.remove')(),
                    set: binding(extensionID, 'browser.storage.local.set')(),
                    get: binding(extensionID, 'browser.storage.local.get')({
                        /** Host not accepting { a: 1 } as keys */
                        param(keys) {
                            if (Array.isArray(keys))
                                return [keys];
                            if (typeof keys === 'object') {
                                if (keys === null)
                                    return [null];
                                return [Object.keys(keys)];
                            }
                            return [null];
                        },
                        returns(rtn, [key]) {
                            if (Array.isArray(key))
                                return rtn;
                            else if (typeof key === 'object' && key !== null) {
                                return Object.assign(Object.assign({}, key), rtn);
                            }
                            return rtn;
                        },
                    }),
                }),
                sync: NotImplementedProxy(),
                onChanged: NotImplementedProxy(),
            },
            webNavigation: NotImplementedProxy({
                onCommitted: createEventListener(extensionID, 'browser.webNavigation.onCommitted'),
                onCompleted: createEventListener(extensionID, 'browser.webNavigation.onCompleted'),
                onDOMContentLoaded: createEventListener(extensionID, 'browser.webNavigation.onDOMContentLoaded'),
            }),
            extension: NotImplementedProxy({
                getBackgroundPage() {
                    const defaultName = '_generated_background_page.html';
                    const manifestName = manifest.background.page;
                    if (location.pathname === '/' + defaultName || location.pathname === '/' + manifestName)
                        return window;
                    return new Proxy({
                        location: new URL(`holoflows-extension://${extensionID}/${manifestName || defaultName}`),
                    }, {
                        get(_, key) {
                            if (_[key])
                                return _[key];
                            throw new TypeError('Not supported');
                        },
                    });
                },
            }),
            permissions: NotImplementedProxy({
                request: async (req) => {
                    const userAction = originalConfirm(`${manifest.name} is going to request the following permissions:
${(req.permissions || []).join('\n')}
${(req.origins || []).join('\n')}`);
                    if (userAction) {
                        useInternalStorage(extensionID, obj => {
                            const orig = obj.dynamicRequestedPermissions || { origins: [], permissions: [] };
                            const o = new Set(orig.origins);
                            const p = new Set(orig.permissions);
                            (req.origins || []).forEach(x => o.add(x));
                            (req.permissions || []).forEach(x => p.add(x));
                            orig.origins = Array.from(o);
                            orig.permissions = Array.from(p);
                            obj.dynamicRequestedPermissions = orig;
                        });
                    }
                    return userAction;
                },
                contains: async (query) => {
                    const originsQuery = query.origins || [];
                    const permissionsQuery = query.permissions || [];
                    const requested = await useInternalStorage(extensionID);
                    const hasOrigins = new Set();
                    const hasPermissions = new Set();
                    if (requested.dynamicRequestedPermissions && requested.dynamicRequestedPermissions.origins) {
                        requested.dynamicRequestedPermissions.origins.forEach(x => hasOrigins.add(x));
                    }
                    if (requested.dynamicRequestedPermissions && requested.dynamicRequestedPermissions.permissions) {
                        requested.dynamicRequestedPermissions.permissions.forEach(x => hasPermissions.add(x));
                    }
                    (manifest.permissions || []).forEach(x => hasPermissions.add(x));
                    (manifest.permissions || []).forEach(x => hasOrigins.add(x));
                    if (originsQuery.some(x => !hasOrigins.has(x)))
                        return false;
                    if (permissionsQuery.some(x => !hasPermissions.has(x)))
                        return false;
                    return true;
                },
                remove: async () => {
                    console.warn('🤣 why you want to revoke your permissions? Not implemented yet.');
                    return false;
                },
                getAll: async () => {
                    const all = await useInternalStorage(extensionID);
                    return JSON.parse(JSON.stringify(all.dynamicRequestedPermissions || {}));
                },
            }),
        };
        return NotImplementedProxy(implementation, false);
    }
    function Implements(implementation) {
        return implementation;
    }
    function NotImplementedProxy(implemented = {}, final = true) {
        return new Proxy(implemented, {
            get(target, key) {
                if (!target[key])
                    return final ? NotImplemented : NotImplementedProxy();
                return target[key];
            },
            apply() {
                return NotImplemented();
            },
        });
    }
    function NotImplemented() {
        return function () {
            throw new Error('Not implemented!');
        };
    }
    function PartialImplemented(obj = {}, ...keys) {
        const obj2 = Object.assign({}, obj);
        keys.forEach(x => delete obj2[x]);
        if (Object.keys(obj2).filter(k => obj[k] !== undefined || obj[k] !== null).length)
            console.warn(`Not implemented options`, obj2, `at`, new Error().stack);
    }
    /**
     * Generate binding between Host and WebExtensionAPI
     *
     * ALL generics should be inferred. DO NOT write it manually.
     *
     * If you are writing options, make sure you add your function to `BrowserReference` to get type tips.
     *
     * @param extensionID - The extension ID
     * @param key - The API name in the type of `Host` AND `BrowserReference`
     */
    function binding(extensionID, key) {
        /**
         * And here we split it into 2 function, if we join them together it will break the infer (but idk why)
         */
        return (
        /**
         * Options. You can write the bridge between Host side and WebExtension side.
         */
        options = {}) => {
            const noop = (x) => x;
            const noopArgs = (...args) => args;
            const hostDefinition = FrameworkRPC[key];
            return (async (...args) => {
                // ? Transform WebExtension API arguments to host arguments
                const hostArgs = (options.param || noopArgs)(...args);
                // ? execute
                const result = await hostDefinition(extensionID, ...hostArgs);
                const f = options.returns || noop;
                // ? Transform host result to WebExtension API result
                const browserResult = f(result, args, hostArgs);
                return browserResult;
            });
        };
    }

    function debugModeURLRewrite(extensionID, url) {
        if (!isDebug)
            return url;
        const u = new URL(url, 'holoflows-extension://' + extensionID + '/');
        if (u.protocol === 'holoflows-extension:') {
            u.protocol = location.protocol;
            u.host = location.host;
            u.pathname = '/extension/' + extensionID + '/' + u.pathname;
            console.debug('Rewrited url', url, 'to', u.toJSON());
            return u.toJSON();
        }
        else if (u.origin === location.origin) {
            if (u.pathname.startsWith('/extension/'))
                return url;
            u.pathname = '/extension/' + extensionID + u.pathname;
            console.debug('Rewrited url', url, 'to', u.toJSON());
            return u.toJSON();
        }
        return url;
    }

    function createFetch(extensionID, origFetch) {
        return new Proxy(origFetch, {
            async apply(origFetch, thisArg, [requestInfo, requestInit]) {
                const request = new Request(requestInfo, requestInit);
                const url = new URL(request.url);
                // Debug mode
                if (isDebug && (url.origin === location.origin || url.protocol === 'holoflows-extension:')) {
                    return origFetch(debugModeURLRewrite(extensionID, request.url), requestInit);
                }
                else if (request.url.startsWith('holoflows-extension://' + extensionID + '/')) {
                    return origFetch(requestInfo, requestInit);
                }
                else {
                    if (isDebug)
                        return origFetch(requestInfo, requestInit);
                    const result = await FrameworkRPC.fetch(extensionID, { method: request.method, url: url.toJSON() });
                    const data = decodeStringOrBlob(result.data);
                    if (data === null)
                        throw new Error('');
                    const returnValue = new Response(data, result);
                    return returnValue;
                }
            },
        });
    }

    let lastUserActive = 0;
    let now = Date.now.bind(Date);
    document.addEventListener('click', () => {
        lastUserActive = now();
    }, { capture: true, passive: true });
    function hasValidUserInteractive() {
        return now() - lastUserActive < 3000;
    }

    function openEnhanced(extensionID) {
        return (url = 'about:blank', target, features, replace) => {
            if (!hasValidUserInteractive())
                return null;
            if ((target && target !== '_blank') || features || replace)
                console.warn('Unsupported open', url, target, features, replace);
            FrameworkRPC['browser.tabs.create'](extensionID, {
                active: true,
                url,
            });
            return null;
        };
    }
    function closeEnhanced(extensionID) {
        return () => {
            if (!hasValidUserInteractive())
                return;
            FrameworkRPC['browser.tabs.query'](extensionID, { active: true }).then(i => FrameworkRPC['browser.tabs.remove'](extensionID, i[0].id));
        };
    }

    /**
     * Transform any `this` to `(typeof this === "undefined" ? globalThis : this)`
     * @param context
     */
    function thisTransformation(context) {
        function visit(node) {
            if (ts.isSourceFile(node)) {
                if (isInStrictMode(node.getChildAt(0)))
                    return node;
            }
            else if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
                if (node.body) {
                    const syntaxList = node
                        .getChildren()
                        .filter(x => x.kind === ts.SyntaxKind.SyntaxList)[0];
                    if (isInStrictMode(syntaxList))
                        return node;
                }
            }
            else if (node.kind === ts.SyntaxKind.ThisKeyword) {
                return ts.createParen(ts.createConditional(ts.createBinary(ts.createTypeOf(ts.createThis()), ts.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken), ts.createStringLiteral('undefined')), ts.createIdentifier('globalThis'), ts.createThis()));
            }
            return ts.visitEachChild(node, child => visit(child), context);
        }
        return (node => {
            try {
                return visit(node);
            }
            catch (_a) {
                return node;
            }
        });
    }
    function isInStrictMode(node) {
        const first = node.getChildAt(0);
        if (!first)
            return false;
        if (ts.isExpressionStatement(first)) {
            if (ts.isStringLiteral(first.expression)) {
                if (first.expression.text === 'use strict')
                    return true;
            }
        }
        return false;
    }

    function transformAST(src) {
        const out = ts.transpileModule(src, {
            transformers: {
                after: [thisTransformation],
            },
            reportDiagnostics: true,
            compilerOptions: {
                target: ts.ScriptTarget.ES2017,
                removeComments: true,
            },
        });
        const error = [];
        for (const err of out.diagnostics || []) {
            let errText = typeof err.messageText === 'string' ? err.messageText : err.messageText.messageText;
            if (err.file && err.start !== undefined && err.length !== undefined) {
                const source = err.file.getFullText();
                const startLineNum = (source.slice(0, err.start).match(/\n/g) || []).length;
                const endLineNum = (source.slice(0, err.start + err.length).match(/\n/g) || []).length;
                const lines = source.split('\n');
                const lineIndicatorLength = endLineNum.toString().length + 5;
                const getLineWithNo = (n) => lines[n] ? `Line ${n + 1} |`.padStart(lineIndicatorLength) + '  ' + lines[n] : null;
                const aroundLines = [
                    getLineWithNo(startLineNum - 3),
                    getLineWithNo(startLineNum - 2),
                    getLineWithNo(startLineNum - 1),
                    getLineWithNo(startLineNum),
                    ''.padStart(lineIndicatorLength + 4) + '~'.repeat(lines[startLineNum].length),
                    startLineNum !== endLineNum ? '......' + getLineWithNo(endLineNum) : null,
                    getLineWithNo(endLineNum + 1),
                    getLineWithNo(endLineNum + 2),
                    getLineWithNo(endLineNum + 3),
                ].filter(x => x);
                errText += `\n${aroundLines.join('\n')}\n`;
            }
            error.push(new SyntaxError(errText));
        }
        if (error[0])
            throw error[0];
        return out.outputText;
    }

    /**
     * This file partly implements XRayVision in Firefox's WebExtension standard
     * by create a two-way JS sandbox but shared DOM environment.
     *
     * class WebExtensionContentScriptEnvironment will return a new JS environment
     * that has a "browser" variable inside of it and a clone of the current DOM environment
     * to prevent the main thread hack on prototype to access the content of ContentScripts.
     *
     * ## Checklist:
     * - [o] ContentScript cannot access main thread
     * - [?] Main thread cannot access ContentScript
     * - [o] ContentScript can access main thread's DOM
     * - [ ] ContentScript modification on DOM prototype is not discoverable by main thread
     * - [ ] Main thread modification on DOM prototype is not discoverable by ContentScript
     */
    /**
     * Recursively get the prototype chain of an Object
     * @param o Object
     */
    function getPrototypeChain(o, _ = []) {
        if (o === undefined || o === null)
            return _;
        const y = Object.getPrototypeOf(o);
        if (y === null || y === undefined || y === Object.prototype)
            return _;
        return getPrototypeChain(Object.getPrototypeOf(y), [..._, y]);
    }
    /**
     * Apply all WebAPIs to the clean sandbox created by Realm
     */
    const PrepareWebAPIs = (() => {
        // ? replace Function with polluted version by Realms
        // ! this leaks the sandbox!
        Object.defineProperty(Object.getPrototypeOf(() => { }), 'constructor', {
            value: globalThis.Function,
        });
        const realWindow = window;
        const webAPIs = Object.getOwnPropertyDescriptors(window);
        Reflect.deleteProperty(webAPIs, 'window');
        Reflect.deleteProperty(webAPIs, 'globalThis');
        Reflect.deleteProperty(webAPIs, 'self');
        Reflect.deleteProperty(webAPIs, 'global');
        Object.defineProperty(Document.prototype, 'defaultView', {
            get() {
                return undefined;
            },
        });
        return (sandboxRoot) => {
            const clonedWebAPIs = Object.assign({}, webAPIs);
            Object.getOwnPropertyNames(sandboxRoot).forEach(name => Reflect.deleteProperty(clonedWebAPIs, name));
            // ? Clone Web APIs
            for (const key in webAPIs) {
                PatchThisOfDescriptorToGlobal(webAPIs[key], realWindow);
            }
            Object.defineProperty(sandboxRoot, 'window', {
                configurable: false,
                writable: false,
                enumerable: true,
                value: sandboxRoot,
            });
            Object.assign(sandboxRoot, { globalThis: sandboxRoot });
            const proto = getPrototypeChain(realWindow)
                .map(Object.getOwnPropertyDescriptors)
                .reduceRight((previous, current) => {
                const copy = Object.assign({}, current);
                for (const key in copy) {
                    PatchThisOfDescriptorToGlobal(copy[key], realWindow);
                }
                return Object.create(previous, copy);
            }, {});
            Object.setPrototypeOf(sandboxRoot, proto);
            Object.defineProperties(sandboxRoot, clonedWebAPIs);
        };
    })();
    /**
     * Execution environment of ContentScript
     */
    class WebExtensionContentScriptEnvironment {
        /**
         * Create a new running extension for an content script.
         * @param extensionID The extension ID
         * @param manifest The manifest of the extension
         */
        constructor(extensionID, manifest) {
            this.extensionID = extensionID;
            this.manifest = manifest;
            this.realm = Realm.makeRootRealm({
                sloppyGlobals: true,
                transforms: [
                    {
                        rewrite: ctx => {
                            ctx.src = transformAST(ctx.src);
                            return ctx;
                        },
                    },
                ],
            });
            this[Symbol.toStringTag] = 'Realm';
            console.log('[WebExtension] Content Script JS environment created.');
            PrepareWebAPIs(this.global);
            const browser = BrowserFactory(this.extensionID, this.manifest);
            Object.defineProperty(this.global, 'browser', {
                // ? Mozilla's polyfill may overwrite this. Figure this out.
                get: () => browser,
                set: x => false,
            });
            this.global.browser = BrowserFactory(this.extensionID, this.manifest);
            this.global.URL = enhanceURL(this.global.URL, this.extensionID);
            this.global.fetch = createFetch(this.extensionID, window.fetch);
            this.global.open = openEnhanced(this.extensionID);
            this.global.close = closeEnhanced(this.extensionID);
        }
        get global() {
            return this.realm.global;
        }
        /**
         * Evaluate a string in the content script environment
         * @param sourceText Source text
         */
        evaluate(sourceText) {
            return this.realm.evaluate(sourceText);
        }
    }
    /**
     * Many methods on `window` requires `this` points to a Window object
     * Like `alert()`. If you call alert as `const w = { alert }; w.alert()`,
     * there will be an Illegal invocation.
     *
     * To prevent `this` binding lost, we need to rebind it.
     *
     * @param desc PropertyDescriptor
     * @param global The real window
     */
    function PatchThisOfDescriptorToGlobal(desc, global) {
        const { get, set, value } = desc;
        if (get)
            desc.get = () => get.apply(global);
        if (set)
            desc.set = (val) => set.apply(global, val);
        if (value && typeof value === 'function') {
            const desc2 = Object.getOwnPropertyDescriptors(value);
            desc.value = function (...args) {
                if (new.target)
                    return Reflect.construct(value, args, new.target);
                return Reflect.apply(value, global, args);
            };
            Object.defineProperties(desc.value, desc2);
            try {
                // ? For unknown reason this fail for some objects on Safari.
                value.prototype && Object.setPrototypeOf(desc.value, value.prototype);
            }
            catch (_a) { }
        }
    }

    const normalized = Symbol('Normalized resources');
    function normalizePath(path, extensionID) {
        const prefix = getPrefix(extensionID);
        if (path.startsWith(prefix))
            return debugModeURLRewrite(extensionID, path);
        else
            return debugModeURLRewrite(extensionID, new URL(path, prefix).toJSON());
    }
    function getPrefix(extensionID) {
        return 'holoflows-extension://' + extensionID + '/';
    }
    function getResource(extensionID, resources, path) {
        // Normalization the resources
        // @ts-ignore
        if (!resources[normalized]) {
            for (const key in resources) {
                if (key.startsWith(getPrefix(extensionID)))
                    continue;
                const obj = resources[key];
                delete resources[key];
                resources[new URL(key, getPrefix(extensionID)).toJSON()] = obj;
            }
            // @ts-ignore
            resources[normalized] = true;
        }
        return resources[normalizePath(path, extensionID)];
    }
    async function getResourceAsync(extensionID, resources, path) {
        const preloaded = getResource(extensionID, resources, path);
        if (preloaded)
            return preloaded;
        const url = normalizePath(path, extensionID);
        const response = await FrameworkRPC.fetch(extensionID, { method: 'GET', url });
        const result = decodeStringOrBlob(response.data);
        if (result === null)
            return undefined;
        if (typeof result === 'string')
            return result;
        console.error('Not supported type for getResourceAsync');
        return undefined;
    }

    function writeHTMLScriptElementSrc(extensionID, manifest, preloadedResources, currentPage) {
        const src = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
        Object.defineProperty(HTMLScriptElement.prototype, 'src', {
            get() {
                return src.get.call(this);
            },
            set(path) {
                console.debug('script src=', path);
                const preloaded = getResource(extensionID, preloadedResources, path);
                if (preloaded)
                    RunInProtocolScope(extensionID, manifest, preloaded, currentPage);
                else
                    getResourceAsync(extensionID, preloadedResources, path)
                        .then(code => code || Promise.reject('Loading resource failed'))
                        .then(code => RunInProtocolScope(extensionID, manifest, code, currentPage))
                        .catch(e => console.error(`Failed when loading resource`, path, e));
                this.dataset.src = path;
                return true;
            },
        });
    }

    function rewriteWorker(extensionID) {
        if (!isDebug)
            return;
        const originalWorker = window.Worker;
        window.Worker = new Proxy(originalWorker, {
            construct(target, args, newTarget) {
                args[0] = debugModeURLRewrite(extensionID, args[0]);
                return Reflect.construct(target, args, newTarget);
            },
        });
    }

    function createLocationProxy(extensionID, manifest, currentPage) {
        const locationProxy = new Proxy({}, {
            get(target, key) {
                target = location;
                const obj = target[key];
                if (key === 'reload')
                    return () => target.reload();
                if (key === 'assign' || key === 'replace')
                    return (url) => {
                        const { src: base } = parseDebugModeURL(extensionID, manifest);
                        locationProxy.href = new URL(url, base);
                    };
                const mockedURL = new URL(currentPage);
                if (key in mockedURL)
                    return mockedURL[key];
                console.warn('Accessing', key, 'on location');
                return obj;
            },
            set(target, key, value) {
                target = location;
                if (key === 'origin')
                    return false;
                const mockedURL = new URL(currentPage);
                if (key in mockedURL) {
                    if (!Reflect.set(mockedURL, key, value))
                        return false;
                    const search = new URLSearchParams(target.search);
                    search.set('url', mockedURL.toJSON());
                    target.search = search.toString();
                    return true;
                }
                console.warn('Setting', key, 'on location to', value);
                return Reflect.set(target, key, value);
            },
            getOwnPropertyDescriptor: safeGetOwnPropertyDescriptor,
        });
        return locationProxy;
    }
    const safeGetOwnPropertyDescriptor = (obj, key) => {
        const orig = Reflect.getOwnPropertyDescriptor(obj, key);
        if (!orig)
            return undefined;
        return Object.assign(Object.assign({}, orig), { configurable: true });
    };

    const registeredWebExtension = new Map();
    var Environment;
    (function (Environment) {
        Environment["contentScript"] = "Content script";
        Environment["backgroundScript"] = "Background script";
        Environment["protocolPage"] = "Protocol page";
        Environment["debugModeManagedPage"] = "managed page";
    })(Environment || (Environment = {}));
    async function registerWebExtension(extensionID, manifest, preloadedResources = {}) {
        if (extensionID === reservedID)
            throw new TypeError('You cannot use reserved id ' + reservedID + ' as the extension id');
        let environment = getContext(manifest);
        let debugModeURL = '';
        if (isDebug) {
            const opt = parseDebugModeURL(extensionID, manifest);
            environment = opt.env;
            debugModeURL = opt.src;
        }
        console.debug(`[WebExtension] Loading extension ${manifest.name}(${extensionID}) with manifest`, manifest, `and preloaded resource`, preloadedResources, `in ${environment} mode`);
        try {
            switch (environment) {
                case Environment.debugModeManagedPage:
                    if (!isDebug)
                        throw new TypeError('Invalid state');
                    LoadContentScript(manifest, extensionID, preloadedResources, debugModeURL);
                    break;
                case Environment.protocolPage:
                    prepareExtensionProtocolEnvironment(extensionID, manifest);
                    if (isDebug)
                        LoadProtocolPage(extensionID, manifest, preloadedResources, debugModeURL);
                    break;
                case Environment.backgroundScript:
                    prepareExtensionProtocolEnvironment(extensionID, manifest);
                    await untilDocumentReady();
                    await LoadBackgroundScript(manifest, extensionID, preloadedResources);
                    break;
                case Environment.contentScript:
                    createContentScriptEnvironment(manifest, extensionID, preloadedResources, debugModeURL);
                    await untilDocumentReady();
                    await LoadContentScript(manifest, extensionID, preloadedResources);
                    break;
                default:
                    console.warn(`[WebExtension] unknown running environment ${environment}`);
            }
        }
        catch (e) {
            console.error(e);
        }
        if (environment === Environment.backgroundScript) {
            const installHandler = EventPools['browser.runtime.onInstall'].get(extensionID);
            if (installHandler) {
                setTimeout(() => {
                    useInternalStorage(extensionID, o => {
                        const handlers = Array.from(installHandler.values());
                        if (o.previousVersion)
                            handlers.forEach(x => x({ previousVersion: o.previousVersion, reason: 'update' }));
                        else
                            handlers.forEach(x => x({ reason: 'install' }));
                        o.previousVersion = manifest.version;
                    });
                }, 2000);
            }
        }
        return registeredWebExtension;
    }
    function getContext(manifest, extensionID, preloadedResources) {
        let environment;
        if (location.protocol === 'holoflows-extension:') {
            if (location.pathname === '/_generated_background_page.html') {
                environment = Environment.backgroundScript;
            }
            else if (manifest.background &&
                manifest.background.page &&
                location.pathname === '/' + manifest.background.page) {
                environment = Environment.backgroundScript;
            }
            else
                environment = Environment.protocolPage;
        }
        else {
            environment = Environment.contentScript;
        }
        return environment;
    }
    function untilDocumentReady() {
        if (document.readyState === 'complete')
            return Promise.resolve();
        return new Promise(resolve => {
            document.addEventListener('readystatechange', resolve, { once: true, passive: true });
        });
    }
    async function LoadProtocolPage(extensionID, manifest, preloadedResources, loadingPageURL) {
        loadingPageURL = new URL(loadingPageURL, 'holoflows-extension://' + extensionID + '/').toJSON();
        writeHTMLScriptElementSrc(extensionID, manifest, preloadedResources, loadingPageURL);
        await loadProtocolPageToCurrentPage(extensionID, manifest, preloadedResources, loadingPageURL);
    }
    async function LoadBackgroundScript(manifest, extensionID, preloadedResources) {
        if (!manifest.background)
            return;
        const { page, scripts } = manifest.background;
        if (!isDebug && location.protocol !== 'holoflows-extension:') {
            throw new TypeError(`Background script only allowed in localhost(for debugging) and holoflows-extension://`);
        }
        let currentPage = 'holoflows-extension://' + extensionID + '/_generated_background_page.html';
        if (page) {
            if (scripts && scripts.length)
                throw new TypeError(`In the manifest, you can't have both "page" and "scripts" for background field!`);
            const pageURL = new URL(page, location.origin);
            if (pageURL.origin !== location.origin)
                throw new TypeError(`You can not specify a foreign origin for the background page`);
            currentPage = 'holoflows-extension://' + extensionID + '/' + page;
        }
        writeHTMLScriptElementSrc(extensionID, manifest, preloadedResources, currentPage);
        if (page) {
            if (currentPage !== location.href) {
                await loadProtocolPageToCurrentPage(extensionID, manifest, preloadedResources, page);
                const div = document.createElement('div');
                if (isDebug) {
                    div.innerHTML = `
<style>body{background: black; color: white;font-family: system-ui;}</style>
This page is in the debug mode of WebExtension-polyfill<br />
It's running in the background page mode`;
                    document.body.appendChild(div);
                }
            }
        }
        else {
            for (const path of scripts || []) {
                const preloaded = await getResourceAsync(extensionID, preloadedResources, path);
                if (preloaded) {
                    // ? Run it in global scope.
                    RunInProtocolScope(extensionID, manifest, preloaded, currentPage);
                }
                else {
                    console.error(`[WebExtension] Background scripts not found for ${manifest.name}: ${path}`);
                }
            }
        }
    }
    async function loadProtocolPageToCurrentPage(extensionID, manifest, preloadedResources, page) {
        const html = await getResourceAsync(extensionID, preloadedResources, page);
        if (!html)
            throw new TypeError('Cannot find background page.');
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, 'text/html');
        const scripts = await Promise.all(Array.from(dom.querySelectorAll('script')).map(async (script) => {
            const path = new URL(script.src).pathname;
            script.remove();
            return [path, await getResourceAsync(extensionID, preloadedResources, path)];
        }));
        for (const c of document.head.children)
            c.remove();
        for (const c of dom.head.children)
            document.head.appendChild(c);
        for (const c of document.body.children)
            c.remove();
        for (const c of dom.body.children)
            document.body.appendChild(c);
        for (const [path, script] of scripts) {
            if (script)
                RunInProtocolScope(extensionID, manifest, script, new URL(page, 'holoflows-extension://' + extensionID + '/').toJSON());
            else
                console.error('Resource', path, 'not found');
        }
    }
    function prepareExtensionProtocolEnvironment(extensionID, manifest) {
        rewriteWorker(extensionID);
        Object.assign(window, {
            browser: BrowserFactory(extensionID, manifest),
            fetch: createFetch(extensionID, window.fetch),
            URL: enhanceURL(URL, extensionID),
            open: openEnhanced(extensionID),
            close: closeEnhanced(extensionID),
        });
    }
    function RunInProtocolScope(extensionID, manifest, source, currentPage) {
        if (location.protocol === 'holoflows-extension:') {
            const likeESModule = source.match('import') || source.match('export ');
            const script = document.createElement('script');
            script.type = likeESModule ? 'module' : 'text/javascript';
            script.innerHTML = source;
            script.defer = true;
            document.body.appendChild(script);
            return;
        }
        if (!isDebug)
            throw new TypeError('Run in the wrong scope');
        if (source.indexOf('browser')) {
            const indirectEval = Math.random() > -1 ? eval : () => { };
            const f = indirectEval(`(function(_){with(_){${source}}})`);
            const _ = (x) => (target, ...any) => Reflect.apply(Reflect[x], null, [window, ...any]);
            const safeGetOwnPropertyDescriptor = (obj, key) => {
                const orig = Reflect.getOwnPropertyDescriptor(obj, key);
                if (!orig)
                    return undefined;
                return Object.assign(Object.assign({}, orig), { configurable: true });
            };
            const { env, src } = parseDebugModeURL(extensionID, manifest);
            const locationProxy = createLocationProxy(extensionID, manifest, currentPage || src);
            const globalProxyTrap = new Proxy({
                get(target, key) {
                    if (key === 'window')
                        return globalProxy;
                    if (key === 'globalThis')
                        return globalProxy;
                    if (key === 'location')
                        return locationProxy;
                    const obj = window[key];
                    if (typeof obj === 'function') {
                        const desc2 = Object.getOwnPropertyDescriptors(obj);
                        function f(...args) {
                            if (new.target)
                                return Reflect.construct(obj, args, new.target);
                            return Reflect.apply(obj, window, args);
                        }
                        Object.defineProperties(f, desc2);
                        Object.setPrototypeOf(f, Object.getPrototypeOf(obj));
                        return f;
                    }
                    return obj;
                },
                getOwnPropertyDescriptor: safeGetOwnPropertyDescriptor,
            }, {
                get(target, key) {
                    if (target[key])
                        return target[key];
                    return _(key);
                },
            });
            const globalProxy = new Proxy({}, globalProxyTrap);
            f(globalProxy);
        }
        else {
            eval(source);
        }
    }
    function createContentScriptEnvironment(manifest, extensionID, preloadedResources, debugModePretendedURL) {
        if (!registeredWebExtension.has(extensionID)) {
            const environment = new WebExtensionContentScriptEnvironment(extensionID, manifest);
            if (debugModePretendedURL)
                environment.global.location = createLocationProxy(extensionID, manifest, debugModePretendedURL);
            const ext = {
                manifest,
                environment,
                preloadedResources,
            };
            registeredWebExtension.set(extensionID, ext);
        }
    }
    async function LoadContentScript(manifest, extensionID, preloadedResources, debugModePretendedURL) {
        if (!isDebug && debugModePretendedURL)
            throw new TypeError('Invalid state');
        if (isDebug) {
            document.body.innerHTML = `
<style>body{background: black; color: white;font-family: system-ui;}</style>
<div>This page is running in the debug mode of WebExtension polyfill</div>
<div>It now pretending to be ${debugModePretendedURL}</div>
<div>So your content script will inject into this page.</div>
<hr />
Copy and apply the webpage to debug your content script:

<textarea id="a"></textarea>
<br />
<button onclick="
var p = new DOMParser();
var dom = p.parseFromString(document.getElementById('a').value, 'text/html');
dom.querySelectorAll('script').forEach(x => x.remove());
var x = new XMLSerializer();
var html = x.serializeToString(dom);
document.write(html);">Remove script tags and go</button>
`;
        }
        for (const [index, content] of (manifest.content_scripts || []).entries()) {
            warningNotImplementedItem(content, index);
            if (matchingURL(new URL(debugModePretendedURL || location.href), content.matches, content.exclude_matches || [], content.include_globs || [], content.exclude_globs || [], content.match_about_blank)) {
                console.debug(`[WebExtension] Loading content script for`, content);
                await loadContentScript(extensionID, manifest, content, preloadedResources);
            }
            else {
                console.debug(`[WebExtension] URL mismatched. Skip content script for, `, content);
            }
        }
    }
    async function loadContentScript(extensionID, manifest, content, preloadedResources) {
        const { environment } = registeredWebExtension.get(extensionID);
        for (const path of content.js || []) {
            const preloaded = await getResourceAsync(extensionID, preloadedResources, path);
            if (preloaded) {
                environment.evaluate(preloaded);
            }
            else {
                console.error(`[WebExtension] Content scripts not found for ${manifest.name}: ${path}`);
            }
        }
    }
    function warningNotImplementedItem(content, index) {
        if (content.all_frames)
            console.warn(`all_frames not supported yet. Defined at manifest.content_scripts[${index}].all_frames`);
        if (content.css)
            console.warn(`css not supported yet. Defined at manifest.content_scripts[${index}].css`);
        if (content.run_at && content.run_at !== 'document_start')
            console.warn(`run_at not supported yet. Defined at manifest.content_scripts[${index}].run_at`);
    }

    const log = rt => async (...args) => {
        console.log('Mocked Host', ...args);
        return rt;
    };
    class CrossPageDebugChannel {
        constructor() {
            this.broadcast = new BroadcastChannel('webext-polyfill-debug');
            this.listener = [];
            this.broadcast.addEventListener('message', e => {
                if (e.origin !== location.origin)
                    console.warn(e.origin, location.origin);
                const detail = e.data;
                for (const f of this.listener) {
                    try {
                        f(detail);
                    }
                    catch (_a) { }
                }
            });
        }
        on(_, cb) {
            this.listener.push(cb);
        }
        emit(_, data) {
            this.broadcast.postMessage(data);
        }
    }
    const origFetch = fetch;
    if (isDebug) {
        const mockHost = AsyncCall({
            onMessage: ThisSideImplementation.onMessage,
            onCommitted: ThisSideImplementation['browser.webNavigation.onCommitted'],
        }, {
            key: 'mock',
            log: false,
            messageChannel: new CrossPageDebugChannel(),
        });
        const myTabID = Math.random();
        setTimeout(() => {
            const obj = parseDebugModeURL('', {});
            mockHost.onCommitted({ tabId: myTabID, url: obj.src });
        }, 2000);
        const host = {
            'URL.createObjectURL': log(void 0),
            'URL.revokeObjectURL': log(void 0),
            'browser.downloads.download': log(void 0),
            async sendMessage(e, t, tt, m, mm) {
                mockHost.onMessage(e, t, m, mm, { id: new URLSearchParams(location.search).get('id') });
            },
            'browser.storage.local.clear': log(void 0),
            async 'browser.storage.local.get'(extensionID, k) {
                return (await useInternalStorage(extensionID)).debugModeStorage || {};
            },
            'browser.storage.local.remove': log(void 0),
            async 'browser.storage.local.set'(extensionID, d) {
                useInternalStorage(extensionID, o => (o.debugModeStorage = Object.assign({}, o.debugModeStorage, d)));
            },
            async 'browser.tabs.create'(extensionID, options) {
                if (!options.url)
                    throw new TypeError('need a url');
                const a = document.createElement('a');
                a.href = debugModeURLRewrite(extensionID, options.url);
                const param = new URLSearchParams();
                param.set('url', options.url);
                param.set('type', options.url.startsWith('holoflows-extension://') ? 'p' : 'm');
                a.href = '/?' + param;
                a.innerText = 'browser.tabs.create: ' + options.url;
                a.target = '_blank';
                a.style.color = 'white';
                document.body.appendChild(a);
                return { id: Math.random() };
            },
            'browser.tabs.query': log([]),
            'browser.tabs.remove': log(void 0),
            'browser.tabs.update': log({}),
            async fetch(extensionID, r) {
                const h = await origFetch(debugModeURLRewrite(extensionID, r.url)).then(x => x.text());
                if (h)
                    return { data: { content: h, mimeType: '', type: 'text' }, status: 200, statusText: 'ok' };
                return { data: { content: '', mimeType: '', type: 'text' }, status: 404, statusText: 'Not found' };
            },
        };
        AsyncCall(host, {
            key: '',
            log: false,
            messageChannel: new SamePageDebugChannel('server'),
        });
    }

    console.log('Loading dependencies from external', Realm, ts);
    Object.assign(globalThis, { ts: undefined, TypeScript: undefined, Realm: undefined });
    // ## Inject here
    if (isDebug) {
        // leaves your id here, and put your extension to /extension/{id}/
        const testIDs = ['eofkdgkhfoebecmamljfaepckoecjhib'];
        testIDs.forEach(id => fetch('/extension/' + id + '/manifest.json')
            .then(x => x.text())
            .then(x => {
            console.log('Loading test WebExtension');
            Object.assign(globalThis, {
                a: registerWebExtension,
                b: WebExtensionContentScriptEnvironment,
            });
            return registerWebExtension(id, JSON.parse(x));
        })
            .then(v => Object.assign(globalThis, { c: v })));
    }
    /**
     * registerWebExtension(
     *      extensionID: string,
     *      manifest: Manifest,
     *      preloadedResources?: Record<string, string>
     * )
     */

}(Realm, ts));
