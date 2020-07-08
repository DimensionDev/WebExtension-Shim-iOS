(function (Realm, ts) {
    'use strict';

    Realm = Realm && Object.prototype.hasOwnProperty.call(Realm, 'default') ? Realm['default'] : Realm;
    ts = ts && Object.prototype.hasOwnProperty.call(ts, 'default') ? ts['default'] : ts;

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
     * Serialization implementation that do nothing
     * @remarks {@link Serialization}
     * @public
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
     * Create a RPC server & client.
     *
     * @remarks
     * See {@link AsyncCallOptions}
     *
     * @param thisSideImplementation - The implementation when this AsyncCall acts as a JSON RPC server.
     * @param options - {@link AsyncCallOptions}
     * @typeParam OtherSideImplementedFunctions - The type of the API that server expose. For any function on this interface, AsyncCall will convert it to the Promised type.
     * @returns Same as the `OtherSideImplementedFunctions` type parameter, but every function in that interface becomes async and non-function value is removed.
     * @public
     */
    function AsyncCall(thisSideImplementation = {}, options) {
        const { serializer, key, strict, log, parameterStructures, preferLocalImplementation } = {
            ...AsyncCallDefaultOptions,
            ...options,
        };
        const message = options.messageChannel;
        const { methodNotFound: banMethodNotFound = false, noUndefined: noUndefinedKeeping = false, unknownMessage: banUnknownMessage = false, } = _calcStrictOptions(strict);
        const { beCalled: logBeCalled = true, localError: logLocalError = true, remoteError: logRemoteError = true, type: logType = 'pretty', sendLocalStack = false, } = _calcLogOptions(log);
        const console = getConsole();
        const requestContext = new Map();
        async function onRequest(data) {
            let frameworkStack = '';
            try {
                // ? We're mapping any method starts with 'rpc.' to a Symbol.for
                const key = (data.method.startsWith('rpc.')
                    ? Symbol.for(data.method)
                    : data.method);
                const executor = thisSideImplementation[key];
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
                    if (result === _AsyncCallIgnoreResponse)
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
                        const localImpl = thisSideImplementation[method];
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
                        const id = _generateRandomID();
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
    /** @internal */
    const _AsyncCallIgnoreResponse = Symbol.for('AsyncCall: This response should be ignored.');
    /** @internal */
    function _generateRandomID() {
        return Math.random()
            .toString(36)
            .slice(2);
    }
    /**
     * @internal
     */
    function _calcLogOptions(log) {
        const logAllOn = { beCalled: true, localError: true, remoteError: true, type: 'pretty' };
        const logAllOff = { beCalled: false, localError: false, remoteError: false, type: 'basic' };
        return typeof log === 'boolean' ? (log ? logAllOn : logAllOff) : log;
    }
    /**
     * @internal
     */
    function _calcStrictOptions(strict) {
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

    function debugModeURLRewrite(extensionID, url) {
        if (!isDebug)
            return url;
        const u = new URL(url, getPrefix(extensionID));
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
        const url = normalizePath(path, extensionID);
        if (preloaded)
            return preloaded;
        const response = await FrameworkRPC.fetch(extensionID, { method: 'GET', url });
        const result = decodeStringOrBlob(response.data);
        if (result === null)
            return undefined;
        if (typeof result === 'string')
            return result;
        console.error('Not supported type for getResourceAsync');
        return undefined;
    }

    const isDebug = location.hostname === 'localhost';
    function parseDebugModeURL(extensionID, manifest) {
        const param = new URLSearchParams(location.search);
        const type = param.get('type');
        let src = param.get('url');
        const base = getPrefix(extensionID);
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
                catch { }
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
            const ext = registeredWebExtension.get(extensionID) ||
                (await registerWebExtension(extensionID, manifest, {})).get(extensionID);
            if (options.code)
                ext.environment.evaluateInlineScript(options.code);
            else if (options.file)
                loadContentScript(extensionID, {
                    js: [options.file],
                    // TODO: check the permission to inject the script
                    matches: ['<all_urls>'],
                });
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
                    catch { }
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
                    catch { }
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
                    }
                    break;
            }
        },
    };
    const FrameworkRPC = AsyncCall(ThisSideImplementation, {
        key: '',
        log: false,
        messageChannel: isDebug ? new SamePageDebugChannel('client') : new iOSWebkitChannel(),
    });
    if (location.protocol !== 'holoflows-extension') {
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
    function BrowserFactory(extensionID, manifest, proto) {
        if (!extensionID)
            throw new TypeError();
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
                    return getPrefix(extensionID) + path;
                },
                getManifest() {
                    return JSON.parse(JSON.stringify(manifest));
                },
                onMessage: createEventListener(extensionID, 'browser.runtime.onMessage'),
                sendMessage: createRuntimeSendMessage(extensionID),
                onInstalled: createEventListener(extensionID, 'browser.runtime.onInstall'),
                // TODO: is it?
                id: extensionID,
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
                            else if (typeof keys === 'string')
                                return [keys];
                            else if (typeof keys === 'object') {
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
                                return { ...key, ...rtn };
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
                        location: new URL(getPrefix(extensionID) + (manifestName || defaultName)),
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
        const proxy = NotImplementedProxy(implementation, false);
        // WebExtension polyfill (moz) will check if the proto is equal to Object.prototype
        Object.setPrototypeOf(proxy, proto);
        return proxy;
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
        const obj2 = { ...obj };
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

    const origFetch = window.fetch;
    function createFetch(extensionID) {
        return new Proxy(origFetch, {
            async apply(origFetch, thisArg, [requestInfo, requestInit]) {
                const request = new Request(requestInfo, requestInit);
                const url = new URL(request.url);
                // Debug mode
                if (isDebug && (url.origin === location.origin || url.protocol === 'holoflows-extension:')) {
                    return origFetch(debugModeURLRewrite(extensionID, request.url), requestInit);
                }
                else if (request.url.startsWith(getPrefix(extensionID))) {
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
     * Transform any `this` to `(x =>
        typeof x === 'undefined'
            ? globalThis
            : x && Object.getPrototypeOf(x) === null && Object.isFrozen(x)
            ? globalThis
            : x)(this)`
     * The frozen check is to bypass systemjs's nullContext
     * @param context
     */
    function thisTransformation(context) {
        function visit(node) {
            if (ts.isSourceFile(node)) {
                if (isInStrictMode(node.statements))
                    return node;
            }
            else if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
                if (node.body) {
                    if (isInStrictMode(node.body.statements))
                        return node;
                }
            }
            else if (node.kind === ts.SyntaxKind.ThisKeyword) {
                return ts.createCall(ts.createParen(ts.createArrowFunction(void 0, void 0, [ts.createParameter(void 0, void 0, void 0, ts.createIdentifier('x'), void 0, void 0, void 0)], void 0, ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken), ts.createConditional(ts.createBinary(ts.createTypeOf(ts.createIdentifier('x')), ts.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken), ts.createStringLiteral('undefined')), ts.createIdentifier('globalThis'), ts.createConditional(ts.createBinary(ts.createBinary(ts.createIdentifier('x'), ts.createToken(ts.SyntaxKind.AmpersandAmpersandToken), ts.createBinary(ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Object'), ts.createIdentifier('getPrototypeOf')), void 0, [ts.createIdentifier('x')]), ts.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken), ts.createNull())), ts.createToken(ts.SyntaxKind.AmpersandAmpersandToken), ts.createCall(ts.createPropertyAccess(ts.createIdentifier('Object'), ts.createIdentifier('isFrozen')), void 0, [ts.createIdentifier('x')])), ts.createIdentifier('globalThis'), ts.createIdentifier('x'))))), void 0, [ts.createThis()]);
            }
            return ts.visitEachChild(node, child => visit(child), context);
        }
        return (node => {
            return visit(node);
        });
    }
    function isInStrictMode(node) {
        const first = node[0];
        if (!first)
            return false;
        if (ts.isExpressionStatement(first)) {
            if (ts.isStringLiteralLike(first.expression)) {
                if (first.expression.text === 'use strict')
                    return true;
            }
        }
        return false;
    }

    function systemjsNameNoLeakTransformer(context) {
        let touched = false;
        let systemJSCall;
        function visit(node) {
            if (touched)
                return node;
            if (ts.isSourceFile(node)) {
                systemJSCall = node.statements.map(getSystemJSRegisterCallArguments).filter(x => x)[0];
                if (!systemJSCall)
                    throw new TypeError('Invalid transform');
                return ts.updateSourceFileNode(node, [createFunction(node.statements.map(visit))]);
            }
            else if (node === systemJSCall && ts.isCallExpression(node)) {
                touched = true;
                return ts.updateCall(node, ts.createIdentifier('arguments[0].register'), void 0, node.arguments);
            }
            return ts.visitEachChild(node, child => visit(child), context);
        }
        return (node => {
            const r = visit(node);
            if (!touched)
                throw new TypeError('Invalid transform');
            return r;
        });
    }
    /**
     * Return `(function () { [statements] })`
     */
    function createFunction(statements) {
        return ts.createExpressionStatement(ts.createParen(ts.createFunctionExpression(void 0, void 0, void 0, void 0, void 0, void 0, ts.createBlock(statements))));
    }
    function getSystemJSRegisterCallArguments(x) {
        if (!ts.isExpressionStatement(x))
            return;
        const expr = x.expression;
        if (!ts.isCallExpression(expr))
            return;
        const callee = expr.expression;
        if (!ts.isPropertyAccessExpression(callee))
            return;
        const { expression: left, name: right } = callee;
        if (!ts.isIdentifier(left) || !ts.isIdentifier(right))
            return;
        if (left.text !== 'System' || right.text !== 'register')
            return;
        return expr;
    }

    const cache = new Map();
    function checkDynamicImport(source) {
        if (cache.has(source))
            return cache.get(source);
        let hasDyn = false;
        function i(k) {
            function visit(n) {
                if (hasDyn)
                    return n;
                if (isDynamicImport(n))
                    hasDyn = true;
                return ts.visitEachChild(n, visit, k);
            }
            return (x) => visit(x);
        }
        ts.transpileModule(source, {
            transformers: {
                before: [i],
            },
            reportDiagnostics: true,
            compilerOptions: {
                target: ts.ScriptTarget.ESNext,
                module: ts.ModuleKind.ESNext,
            },
        });
        cache.set(source, hasDyn);
        return hasDyn;
    }
    function isDynamicImport(node) {
        if (!ts.isCallExpression(node))
            return false;
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
            return true;
        }
        return false;
    }

    const scriptTransformCache = new Map();
    const moduleTransformCache = new Map();
    const PrebuiltVersion = 0;
    /**
     * For scripts, we treat it as a module with no static import/export.
     */
    function transformAST(src, kind, path) {
        const cache = kind === 'module' ? moduleTransformCache : scriptTransformCache;
        if (cache.has(src))
            return cache.get(src);
        const hasDynamicImport = checkDynamicImport(src);
        const scriptBefore = undefined;
        const scriptAfter = [thisTransformation, hasDynamicImport ? systemjsNameNoLeakTransformer : undefined].filter(x => x);
        const moduleBefore = undefined;
        const moduleAfter = [systemjsNameNoLeakTransformer];
        function getSourcePath() {
            const _ = path.split('/');
            const filename = _.pop();
            const sourceRoot = _.join('/');
            return { fileName: filename, sourceRoot };
        }
        const { fileName, sourceRoot } = getSourcePath();
        const out = ts.transpileModule(src, {
            transformers: {
                before: kind === 'script' ? scriptBefore : moduleBefore,
                after: kind === 'script' ? scriptAfter : moduleAfter,
            },
            reportDiagnostics: true,
            compilerOptions: {
                // ? we're assuming the developer has ran the transformer so we are not going to run any downgrade for them
                target: ts.ScriptTarget.ESNext,
                // ? Also use System in script type therefore the dynamic import will work
                // ? If no need for module, keep it ESNext (and throw by browser)
                module: hasDynamicImport || kind === 'module' ? ts.ModuleKind.System : ts.ModuleKind.ESNext,
                // ? A comment in React dev will make a false positive on realms checker
                removeComments: true,
                inlineSourceMap: true,
                inlineSources: true,
                sourceRoot,
            },
            fileName,
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
        cache.set(src, out.outputText);
        return out.outputText;
    }

    module.exports =
    /******/ (function(modules, runtime) { // webpackBootstrap
    /******/ 	// The module cache
    /******/ 	var installedModules = {};
    /******/
    /******/ 	// The require function
    /******/ 	function __webpack_require__(moduleId) {
    /******/
    /******/ 		// Check if module is in cache
    /******/ 		if(installedModules[moduleId]) {
    /******/ 			return installedModules[moduleId].exports;
    /******/ 		}
    /******/ 		// Create a new module (and put it into the cache)
    /******/ 		var module = installedModules[moduleId] = {
    /******/ 			i: moduleId,
    /******/ 			l: false,
    /******/ 			exports: {}
    /******/ 		};
    /******/
    /******/ 		// Execute the module function
    /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/
    /******/ 		// Flag the module as loaded
    /******/ 		module.l = true;
    /******/
    /******/ 		// Return the exports of the module
    /******/ 		return module.exports;
    /******/ 	}
    /******/
    /******/
    /******/ 	__webpack_require__.ab = __dirname + "/";
    /******/
    /******/ 	// the startup function
    /******/ 	function startup() {
    /******/ 		// Load entry module and return exports
    /******/ 		return __webpack_require__(554);
    /******/ 	}/******/ 	// initialize runtime
    /******/ 	runtime(__webpack_require__);
    /******/
    /******/ 	// run startup
    /******/ 	return startup();
    /******/ })
    /************************************************************************/
    /******/ ({

    /***/ 1:
    /***/ (function(__unusedmodule, exports) {

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    // It turns out that some (most?) JavaScript engines don't self-host
    // `Array.prototype.sort`. This makes sense because C++ will likely remain
    // faster than JS when doing raw CPU-intensive sorting. However, when using a
    // custom comparator function, calling back and forth between the VM's C++ and
    // JIT'd JS is rather slow *and* loses JIT type information, resulting in
    // worse generated code for the comparator function than would be optimal. In
    // fact, when sorting with a comparator, these costs outweigh the benefits of
    // sorting in C++. By using our own JS-implemented Quick Sort (below), we get
    // a ~3500ms mean speed-up in `bench/bench.html`.

    /**
     * Swap the elements indexed by `x` and `y` in the array `ary`.
     *
     * @param {Array} ary
     *        The array.
     * @param {Number} x
     *        The index of the first item.
     * @param {Number} y
     *        The index of the second item.
     */
    function swap(ary, x, y) {
      var temp = ary[x];
      ary[x] = ary[y];
      ary[y] = temp;
    }

    /**
     * Returns a random integer within the range `low .. high` inclusive.
     *
     * @param {Number} low
     *        The lower bound on the range.
     * @param {Number} high
     *        The upper bound on the range.
     */
    function randomIntInRange(low, high) {
      return Math.round(low + (Math.random() * (high - low)));
    }

    /**
     * The Quick Sort algorithm.
     *
     * @param {Array} ary
     *        An array to sort.
     * @param {function} comparator
     *        Function to use to compare two items.
     * @param {Number} p
     *        Start index of the array
     * @param {Number} r
     *        End index of the array
     */
    function doQuickSort(ary, comparator, p, r) {
      // If our lower bound is less than our upper bound, we (1) partition the
      // array into two pieces and (2) recurse on each half. If it is not, this is
      // the empty array and our base case.

      if (p < r) {
        // (1) Partitioning.
        //
        // The partitioning chooses a pivot between `p` and `r` and moves all
        // elements that are less than or equal to the pivot to the before it, and
        // all the elements that are greater than it after it. The effect is that
        // once partition is done, the pivot is in the exact place it will be when
        // the array is put in sorted order, and it will not need to be moved
        // again. This runs in O(n) time.

        // Always choose a random pivot so that an input array which is reverse
        // sorted does not cause O(n^2) running time.
        var pivotIndex = randomIntInRange(p, r);
        var i = p - 1;

        swap(ary, pivotIndex, r);
        var pivot = ary[r];

        // Immediately after `j` is incremented in this loop, the following hold
        // true:
        //
        //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
        //
        //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
        for (var j = p; j < r; j++) {
          if (comparator(ary[j], pivot) <= 0) {
            i += 1;
            swap(ary, i, j);
          }
        }

        swap(ary, i + 1, j);
        var q = i + 1;

        // (2) Recurse on each half.

        doQuickSort(ary, comparator, p, q - 1);
        doQuickSort(ary, comparator, q + 1, r);
      }
    }

    /**
     * Sort the given array in-place with the given comparator function.
     *
     * @param {Array} ary
     *        An array to sort.
     * @param {function} comparator
     *        Function to use to compare two items.
     */
    exports.quickSort = function (ary, comparator) {
      doQuickSort(ary, comparator, 0, ary.length - 1);
    };


    /***/ }),

    /***/ 18:
    /***/ (function(module) {

    module.exports = eval("require")("encoding");


    /***/ }),

    /***/ 54:
    /***/ (function(__unusedmodule, exports, __webpack_require__) {

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    var SourceMapGenerator = __webpack_require__(454).SourceMapGenerator;
    var util = __webpack_require__(338);

    // Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
    // operating systems these days (capturing the result).
    var REGEX_NEWLINE = /(\r?\n)/;

    // Newline character code for charCodeAt() comparisons
    var NEWLINE_CODE = 10;

    // Private symbol for identifying `SourceNode`s when multiple versions of
    // the source-map library are loaded. This MUST NOT CHANGE across
    // versions!
    var isSourceNode = "$$$isSourceNode$$$";

    /**
     * SourceNodes provide a way to abstract over interpolating/concatenating
     * snippets of generated JavaScript source code while maintaining the line and
     * column information associated with the original source code.
     *
     * @param aLine The original line number.
     * @param aColumn The original column number.
     * @param aSource The original source's filename.
     * @param aChunks Optional. An array of strings which are snippets of
     *        generated JS, or other SourceNodes.
     * @param aName The original identifier.
     */
    function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
      this.children = [];
      this.sourceContents = {};
      this.line = aLine == null ? null : aLine;
      this.column = aColumn == null ? null : aColumn;
      this.source = aSource == null ? null : aSource;
      this.name = aName == null ? null : aName;
      this[isSourceNode] = true;
      if (aChunks != null) this.add(aChunks);
    }

    /**
     * Creates a SourceNode from generated code and a SourceMapConsumer.
     *
     * @param aGeneratedCode The generated code
     * @param aSourceMapConsumer The SourceMap for the generated code
     * @param aRelativePath Optional. The path that relative sources in the
     *        SourceMapConsumer should be relative to.
     */
    SourceNode.fromStringWithSourceMap =
      function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
        // The SourceNode we want to fill with the generated code
        // and the SourceMap
        var node = new SourceNode();

        // All even indices of this array are one line of the generated code,
        // while all odd indices are the newlines between two adjacent lines
        // (since `REGEX_NEWLINE` captures its match).
        // Processed fragments are accessed by calling `shiftNextLine`.
        var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
        var remainingLinesIndex = 0;
        var shiftNextLine = function() {
          var lineContents = getNextLine();
          // The last line of a file might not have a newline.
          var newLine = getNextLine() || "";
          return lineContents + newLine;

          function getNextLine() {
            return remainingLinesIndex < remainingLines.length ?
                remainingLines[remainingLinesIndex++] : undefined;
          }
        };

        // We need to remember the position of "remainingLines"
        var lastGeneratedLine = 1, lastGeneratedColumn = 0;

        // The generate SourceNodes we need a code range.
        // To extract it current and last mapping is used.
        // Here we store the last mapping.
        var lastMapping = null;

        aSourceMapConsumer.eachMapping(function (mapping) {
          if (lastMapping !== null) {
            // We add the code from "lastMapping" to "mapping":
            // First check if there is a new line in between.
            if (lastGeneratedLine < mapping.generatedLine) {
              // Associate first line with "lastMapping"
              addMappingWithCode(lastMapping, shiftNextLine());
              lastGeneratedLine++;
              lastGeneratedColumn = 0;
              // The remaining code is added without mapping
            } else {
              // There is no new line in between.
              // Associate the code between "lastGeneratedColumn" and
              // "mapping.generatedColumn" with "lastMapping"
              var nextLine = remainingLines[remainingLinesIndex] || '';
              var code = nextLine.substr(0, mapping.generatedColumn -
                                            lastGeneratedColumn);
              remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                                  lastGeneratedColumn);
              lastGeneratedColumn = mapping.generatedColumn;
              addMappingWithCode(lastMapping, code);
              // No more remaining code, continue
              lastMapping = mapping;
              return;
            }
          }
          // We add the generated code until the first mapping
          // to the SourceNode without any mapping.
          // Each line is added as separate string.
          while (lastGeneratedLine < mapping.generatedLine) {
            node.add(shiftNextLine());
            lastGeneratedLine++;
          }
          if (lastGeneratedColumn < mapping.generatedColumn) {
            var nextLine = remainingLines[remainingLinesIndex] || '';
            node.add(nextLine.substr(0, mapping.generatedColumn));
            remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
          }
          lastMapping = mapping;
        }, this);
        // We have processed all mappings.
        if (remainingLinesIndex < remainingLines.length) {
          if (lastMapping) {
            // Associate the remaining code in the current line with "lastMapping"
            addMappingWithCode(lastMapping, shiftNextLine());
          }
          // and add the remaining lines without any mapping
          node.add(remainingLines.splice(remainingLinesIndex).join(""));
        }

        // Copy sourcesContent into SourceNode
        aSourceMapConsumer.sources.forEach(function (sourceFile) {
          var content = aSourceMapConsumer.sourceContentFor(sourceFile);
          if (content != null) {
            if (aRelativePath != null) {
              sourceFile = util.join(aRelativePath, sourceFile);
            }
            node.setSourceContent(sourceFile, content);
          }
        });

        return node;

        function addMappingWithCode(mapping, code) {
          if (mapping === null || mapping.source === undefined) {
            node.add(code);
          } else {
            var source = aRelativePath
              ? util.join(aRelativePath, mapping.source)
              : mapping.source;
            node.add(new SourceNode(mapping.originalLine,
                                    mapping.originalColumn,
                                    source,
                                    code,
                                    mapping.name));
          }
        }
      };

    /**
     * Add a chunk of generated JS to this source node.
     *
     * @param aChunk A string snippet of generated JS code, another instance of
     *        SourceNode, or an array where each member is one of those things.
     */
    SourceNode.prototype.add = function SourceNode_add(aChunk) {
      if (Array.isArray(aChunk)) {
        aChunk.forEach(function (chunk) {
          this.add(chunk);
        }, this);
      }
      else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        if (aChunk) {
          this.children.push(aChunk);
        }
      }
      else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    };

    /**
     * Add a chunk of generated JS to the beginning of this source node.
     *
     * @param aChunk A string snippet of generated JS code, another instance of
     *        SourceNode, or an array where each member is one of those things.
     */
    SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
      if (Array.isArray(aChunk)) {
        for (var i = aChunk.length-1; i >= 0; i--) {
          this.prepend(aChunk[i]);
        }
      }
      else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        this.children.unshift(aChunk);
      }
      else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    };

    /**
     * Walk over the tree of JS snippets in this node and its children. The
     * walking function is called once for each snippet of JS and is passed that
     * snippet and the its original associated source's line/column location.
     *
     * @param aFn The traversal function.
     */
    SourceNode.prototype.walk = function SourceNode_walk(aFn) {
      var chunk;
      for (var i = 0, len = this.children.length; i < len; i++) {
        chunk = this.children[i];
        if (chunk[isSourceNode]) {
          chunk.walk(aFn);
        }
        else {
          if (chunk !== '') {
            aFn(chunk, { source: this.source,
                         line: this.line,
                         column: this.column,
                         name: this.name });
          }
        }
      }
    };

    /**
     * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
     * each of `this.children`.
     *
     * @param aSep The separator.
     */
    SourceNode.prototype.join = function SourceNode_join(aSep) {
      var newChildren;
      var i;
      var len = this.children.length;
      if (len > 0) {
        newChildren = [];
        for (i = 0; i < len-1; i++) {
          newChildren.push(this.children[i]);
          newChildren.push(aSep);
        }
        newChildren.push(this.children[i]);
        this.children = newChildren;
      }
      return this;
    };

    /**
     * Call String.prototype.replace on the very right-most source snippet. Useful
     * for trimming whitespace from the end of a source node, etc.
     *
     * @param aPattern The pattern to replace.
     * @param aReplacement The thing to replace the pattern with.
     */
    SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
      var lastChild = this.children[this.children.length - 1];
      if (lastChild[isSourceNode]) {
        lastChild.replaceRight(aPattern, aReplacement);
      }
      else if (typeof lastChild === 'string') {
        this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
      }
      else {
        this.children.push(''.replace(aPattern, aReplacement));
      }
      return this;
    };

    /**
     * Set the source content for a source file. This will be added to the SourceMapGenerator
     * in the sourcesContent field.
     *
     * @param aSourceFile The filename of the source file
     * @param aSourceContent The content of the source file
     */
    SourceNode.prototype.setSourceContent =
      function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
        this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
      };

    /**
     * Walk over the tree of SourceNodes. The walking function is called for each
     * source file content and is passed the filename and source content.
     *
     * @param aFn The traversal function.
     */
    SourceNode.prototype.walkSourceContents =
      function SourceNode_walkSourceContents(aFn) {
        for (var i = 0, len = this.children.length; i < len; i++) {
          if (this.children[i][isSourceNode]) {
            this.children[i].walkSourceContents(aFn);
          }
        }

        var sources = Object.keys(this.sourceContents);
        for (var i = 0, len = sources.length; i < len; i++) {
          aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
        }
      };

    /**
     * Return the string representation of this source node. Walks over the tree
     * and concatenates all the various snippets together to one string.
     */
    SourceNode.prototype.toString = function SourceNode_toString() {
      var str = "";
      this.walk(function (chunk) {
        str += chunk;
      });
      return str;
    };

    /**
     * Returns the string representation of this source node along with a source
     * map.
     */
    SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
      var generated = {
        code: "",
        line: 1,
        column: 0
      };
      var map = new SourceMapGenerator(aArgs);
      var sourceMappingActive = false;
      var lastOriginalSource = null;
      var lastOriginalLine = null;
      var lastOriginalColumn = null;
      var lastOriginalName = null;
      this.walk(function (chunk, original) {
        generated.code += chunk;
        if (original.source !== null
            && original.line !== null
            && original.column !== null) {
          if(lastOriginalSource !== original.source
             || lastOriginalLine !== original.line
             || lastOriginalColumn !== original.column
             || lastOriginalName !== original.name) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
          lastOriginalSource = original.source;
          lastOriginalLine = original.line;
          lastOriginalColumn = original.column;
          lastOriginalName = original.name;
          sourceMappingActive = true;
        } else if (sourceMappingActive) {
          map.addMapping({
            generated: {
              line: generated.line,
              column: generated.column
            }
          });
          lastOriginalSource = null;
          sourceMappingActive = false;
        }
        for (var idx = 0, length = chunk.length; idx < length; idx++) {
          if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
            generated.line++;
            generated.column = 0;
            // Mappings end at eol
            if (idx + 1 === length) {
              lastOriginalSource = null;
              sourceMappingActive = false;
            } else if (sourceMappingActive) {
              map.addMapping({
                source: original.source,
                original: {
                  line: original.line,
                  column: original.column
                },
                generated: {
                  line: generated.line,
                  column: generated.column
                },
                name: original.name
              });
            }
          } else {
            generated.column++;
          }
        }
      });
      this.walkSourceContents(function (sourceFile, sourceContent) {
        map.setSourceContent(sourceFile, sourceContent);
      });

      return { code: generated.code, map: map };
    };

    exports.SourceNode = SourceNode;


    /***/ }),

    /***/ 94:
    /***/ (function(__unusedmodule, exports, __webpack_require__) {

    /*
     * Copyright 2009-2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE.txt or:
     * http://opensource.org/licenses/BSD-3-Clause
     */
    exports.SourceMapGenerator = __webpack_require__(454).SourceMapGenerator;
    exports.SourceMapConsumer = __webpack_require__(276).SourceMapConsumer;
    exports.SourceNode = __webpack_require__(54).SourceNode;


    /***/ }),

    /***/ 211:
    /***/ (function(module) {

    module.exports = require("https");

    /***/ }),

    /***/ 276:
    /***/ (function(__unusedmodule, exports, __webpack_require__) {

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    var util = __webpack_require__(338);
    var binarySearch = __webpack_require__(972);
    var ArraySet = __webpack_require__(969).ArraySet;
    var base64VLQ = __webpack_require__(277);
    var quickSort = __webpack_require__(1).quickSort;

    function SourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === 'string') {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }

      return sourceMap.sections != null
        ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
        : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
    }

    SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
      return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
    };

    /**
     * The version of the source mapping spec that we are consuming.
     */
    SourceMapConsumer.prototype._version = 3;

    // `__generatedMappings` and `__originalMappings` are arrays that hold the
    // parsed mapping coordinates from the source map's "mappings" attribute. They
    // are lazily instantiated, accessed via the `_generatedMappings` and
    // `_originalMappings` getters respectively, and we only parse the mappings
    // and create these arrays once queried for a source location. We jump through
    // these hoops because there can be many thousands of mappings, and parsing
    // them is expensive, so we only want to do it if we must.
    //
    // Each object in the arrays is of the form:
    //
    //     {
    //       generatedLine: The line number in the generated code,
    //       generatedColumn: The column number in the generated code,
    //       source: The path to the original source file that generated this
    //               chunk of code,
    //       originalLine: The line number in the original source that
    //                     corresponds to this chunk of generated code,
    //       originalColumn: The column number in the original source that
    //                       corresponds to this chunk of generated code,
    //       name: The name of the original symbol which generated this chunk of
    //             code.
    //     }
    //
    // All properties except for `generatedLine` and `generatedColumn` can be
    // `null`.
    //
    // `_generatedMappings` is ordered by the generated positions.
    //
    // `_originalMappings` is ordered by the original positions.

    SourceMapConsumer.prototype.__generatedMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
      configurable: true,
      enumerable: true,
      get: function () {
        if (!this.__generatedMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }

        return this.__generatedMappings;
      }
    });

    SourceMapConsumer.prototype.__originalMappings = null;
    Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
      configurable: true,
      enumerable: true,
      get: function () {
        if (!this.__originalMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }

        return this.__originalMappings;
      }
    });

    SourceMapConsumer.prototype._charIsMappingSeparator =
      function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
        var c = aStr.charAt(index);
        return c === ";" || c === ",";
      };

    /**
     * Parse the mappings in a string in to a data structure which we can easily
     * query (the ordered arrays in the `this.__generatedMappings` and
     * `this.__originalMappings` properties).
     */
    SourceMapConsumer.prototype._parseMappings =
      function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
        throw new Error("Subclasses must implement _parseMappings");
      };

    SourceMapConsumer.GENERATED_ORDER = 1;
    SourceMapConsumer.ORIGINAL_ORDER = 2;

    SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
    SourceMapConsumer.LEAST_UPPER_BOUND = 2;

    /**
     * Iterate over each mapping between an original source/line/column and a
     * generated line/column in this source map.
     *
     * @param Function aCallback
     *        The function that is called with each mapping.
     * @param Object aContext
     *        Optional. If specified, this object will be the value of `this` every
     *        time that `aCallback` is called.
     * @param aOrder
     *        Either `SourceMapConsumer.GENERATED_ORDER` or
     *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
     *        iterate over the mappings sorted by the generated file's line/column
     *        order or the original's source/line/column order, respectively. Defaults to
     *        `SourceMapConsumer.GENERATED_ORDER`.
     */
    SourceMapConsumer.prototype.eachMapping =
      function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
        var context = aContext || null;
        var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

        var mappings;
        switch (order) {
        case SourceMapConsumer.GENERATED_ORDER:
          mappings = this._generatedMappings;
          break;
        case SourceMapConsumer.ORIGINAL_ORDER:
          mappings = this._originalMappings;
          break;
        default:
          throw new Error("Unknown order of iteration.");
        }

        var sourceRoot = this.sourceRoot;
        mappings.map(function (mapping) {
          var source = mapping.source === null ? null : this._sources.at(mapping.source);
          source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL);
          return {
            source: source,
            generatedLine: mapping.generatedLine,
            generatedColumn: mapping.generatedColumn,
            originalLine: mapping.originalLine,
            originalColumn: mapping.originalColumn,
            name: mapping.name === null ? null : this._names.at(mapping.name)
          };
        }, this).forEach(aCallback, context);
      };

    /**
     * Returns all generated line and column information for the original source,
     * line, and column provided. If no column is provided, returns all mappings
     * corresponding to a either the line we are searching for or the next
     * closest line that has any mappings. Otherwise, returns all mappings
     * corresponding to the given line and either the column we are searching for
     * or the next closest column that has any offsets.
     *
     * The only argument is an object with the following properties:
     *
     *   - source: The filename of the original source.
     *   - line: The line number in the original source.  The line number is 1-based.
     *   - column: Optional. the column number in the original source.
     *    The column number is 0-based.
     *
     * and an array of objects is returned, each with the following properties:
     *
     *   - line: The line number in the generated source, or null.  The
     *    line number is 1-based.
     *   - column: The column number in the generated source, or null.
     *    The column number is 0-based.
     */
    SourceMapConsumer.prototype.allGeneratedPositionsFor =
      function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
        var line = util.getArg(aArgs, 'line');

        // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
        // returns the index of the closest mapping less than the needle. By
        // setting needle.originalColumn to 0, we thus find the last mapping for
        // the given line, provided such a mapping exists.
        var needle = {
          source: util.getArg(aArgs, 'source'),
          originalLine: line,
          originalColumn: util.getArg(aArgs, 'column', 0)
        };

        needle.source = this._findSourceIndex(needle.source);
        if (needle.source < 0) {
          return [];
        }

        var mappings = [];

        var index = this._findMapping(needle,
                                      this._originalMappings,
                                      "originalLine",
                                      "originalColumn",
                                      util.compareByOriginalPositions,
                                      binarySearch.LEAST_UPPER_BOUND);
        if (index >= 0) {
          var mapping = this._originalMappings[index];

          if (aArgs.column === undefined) {
            var originalLine = mapping.originalLine;

            // Iterate until either we run out of mappings, or we run into
            // a mapping for a different line than the one we found. Since
            // mappings are sorted, this is guaranteed to find all mappings for
            // the line we found.
            while (mapping && mapping.originalLine === originalLine) {
              mappings.push({
                line: util.getArg(mapping, 'generatedLine', null),
                column: util.getArg(mapping, 'generatedColumn', null),
                lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
              });

              mapping = this._originalMappings[++index];
            }
          } else {
            var originalColumn = mapping.originalColumn;

            // Iterate until either we run out of mappings, or we run into
            // a mapping for a different line than the one we were searching for.
            // Since mappings are sorted, this is guaranteed to find all mappings for
            // the line we are searching for.
            while (mapping &&
                   mapping.originalLine === line &&
                   mapping.originalColumn == originalColumn) {
              mappings.push({
                line: util.getArg(mapping, 'generatedLine', null),
                column: util.getArg(mapping, 'generatedColumn', null),
                lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
              });

              mapping = this._originalMappings[++index];
            }
          }
        }

        return mappings;
      };

    exports.SourceMapConsumer = SourceMapConsumer;

    /**
     * A BasicSourceMapConsumer instance represents a parsed source map which we can
     * query for information about the original file positions by giving it a file
     * position in the generated source.
     *
     * The first parameter is the raw source map (either as a JSON string, or
     * already parsed to an object). According to the spec, source maps have the
     * following attributes:
     *
     *   - version: Which version of the source map spec this map is following.
     *   - sources: An array of URLs to the original source files.
     *   - names: An array of identifiers which can be referrenced by individual mappings.
     *   - sourceRoot: Optional. The URL root from which all sources are relative.
     *   - sourcesContent: Optional. An array of contents of the original source files.
     *   - mappings: A string of base64 VLQs which contain the actual mappings.
     *   - file: Optional. The generated file this source map is associated with.
     *
     * Here is an example source map, taken from the source map spec[0]:
     *
     *     {
     *       version : 3,
     *       file: "out.js",
     *       sourceRoot : "",
     *       sources: ["foo.js", "bar.js"],
     *       names: ["src", "maps", "are", "fun"],
     *       mappings: "AA,AB;;ABCDE;"
     *     }
     *
     * The second parameter, if given, is a string whose value is the URL
     * at which the source map was found.  This URL is used to compute the
     * sources array.
     *
     * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
     */
    function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === 'string') {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }

      var version = util.getArg(sourceMap, 'version');
      var sources = util.getArg(sourceMap, 'sources');
      // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
      // requires the array) to play nice here.
      var names = util.getArg(sourceMap, 'names', []);
      var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
      var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
      var mappings = util.getArg(sourceMap, 'mappings');
      var file = util.getArg(sourceMap, 'file', null);

      // Once again, Sass deviates from the spec and supplies the version as a
      // string rather than a number, so we use loose equality checking here.
      if (version != this._version) {
        throw new Error('Unsupported version: ' + version);
      }

      if (sourceRoot) {
        sourceRoot = util.normalize(sourceRoot);
      }

      sources = sources
        .map(String)
        // Some source maps produce relative source paths like "./foo.js" instead of
        // "foo.js".  Normalize these first so that future comparisons will succeed.
        // See bugzil.la/1090768.
        .map(util.normalize)
        // Always ensure that absolute sources are internally stored relative to
        // the source root, if the source root is absolute. Not doing this would
        // be particularly problematic when the source root is a prefix of the
        // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
        .map(function (source) {
          return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
            ? util.relative(sourceRoot, source)
            : source;
        });

      // Pass `true` below to allow duplicate names and sources. While source maps
      // are intended to be compressed and deduplicated, the TypeScript compiler
      // sometimes generates source maps with duplicates in them. See Github issue
      // #72 and bugzil.la/889492.
      this._names = ArraySet.fromArray(names.map(String), true);
      this._sources = ArraySet.fromArray(sources, true);

      this._absoluteSources = this._sources.toArray().map(function (s) {
        return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
      });

      this.sourceRoot = sourceRoot;
      this.sourcesContent = sourcesContent;
      this._mappings = mappings;
      this._sourceMapURL = aSourceMapURL;
      this.file = file;
    }

    BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

    /**
     * Utility function to find the index of a source.  Returns -1 if not
     * found.
     */
    BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
      var relativeSource = aSource;
      if (this.sourceRoot != null) {
        relativeSource = util.relative(this.sourceRoot, relativeSource);
      }

      if (this._sources.has(relativeSource)) {
        return this._sources.indexOf(relativeSource);
      }

      // Maybe aSource is an absolute URL as returned by |sources|.  In
      // this case we can't simply undo the transform.
      var i;
      for (i = 0; i < this._absoluteSources.length; ++i) {
        if (this._absoluteSources[i] == aSource) {
          return i;
        }
      }

      return -1;
    };

    /**
     * Create a BasicSourceMapConsumer from a SourceMapGenerator.
     *
     * @param SourceMapGenerator aSourceMap
     *        The source map that will be consumed.
     * @param String aSourceMapURL
     *        The URL at which the source map can be found (optional)
     * @returns BasicSourceMapConsumer
     */
    BasicSourceMapConsumer.fromSourceMap =
      function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
        var smc = Object.create(BasicSourceMapConsumer.prototype);

        var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
        var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
        smc.sourceRoot = aSourceMap._sourceRoot;
        smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                                smc.sourceRoot);
        smc.file = aSourceMap._file;
        smc._sourceMapURL = aSourceMapURL;
        smc._absoluteSources = smc._sources.toArray().map(function (s) {
          return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
        });

        // Because we are modifying the entries (by converting string sources and
        // names to indices into the sources and names ArraySets), we have to make
        // a copy of the entry or else bad things happen. Shared mutable state
        // strikes again! See github issue #191.

        var generatedMappings = aSourceMap._mappings.toArray().slice();
        var destGeneratedMappings = smc.__generatedMappings = [];
        var destOriginalMappings = smc.__originalMappings = [];

        for (var i = 0, length = generatedMappings.length; i < length; i++) {
          var srcMapping = generatedMappings[i];
          var destMapping = new Mapping;
          destMapping.generatedLine = srcMapping.generatedLine;
          destMapping.generatedColumn = srcMapping.generatedColumn;

          if (srcMapping.source) {
            destMapping.source = sources.indexOf(srcMapping.source);
            destMapping.originalLine = srcMapping.originalLine;
            destMapping.originalColumn = srcMapping.originalColumn;

            if (srcMapping.name) {
              destMapping.name = names.indexOf(srcMapping.name);
            }

            destOriginalMappings.push(destMapping);
          }

          destGeneratedMappings.push(destMapping);
        }

        quickSort(smc.__originalMappings, util.compareByOriginalPositions);

        return smc;
      };

    /**
     * The version of the source mapping spec that we are consuming.
     */
    BasicSourceMapConsumer.prototype._version = 3;

    /**
     * The list of original sources.
     */
    Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
      get: function () {
        return this._absoluteSources.slice();
      }
    });

    /**
     * Provide the JIT with a nice shape / hidden class.
     */
    function Mapping() {
      this.generatedLine = 0;
      this.generatedColumn = 0;
      this.source = null;
      this.originalLine = null;
      this.originalColumn = null;
      this.name = null;
    }

    /**
     * Parse the mappings in a string in to a data structure which we can easily
     * query (the ordered arrays in the `this.__generatedMappings` and
     * `this.__originalMappings` properties).
     */
    BasicSourceMapConsumer.prototype._parseMappings =
      function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
        var generatedLine = 1;
        var previousGeneratedColumn = 0;
        var previousOriginalLine = 0;
        var previousOriginalColumn = 0;
        var previousSource = 0;
        var previousName = 0;
        var length = aStr.length;
        var index = 0;
        var cachedSegments = {};
        var temp = {};
        var originalMappings = [];
        var generatedMappings = [];
        var mapping, str, segment, end, value;

        while (index < length) {
          if (aStr.charAt(index) === ';') {
            generatedLine++;
            index++;
            previousGeneratedColumn = 0;
          }
          else if (aStr.charAt(index) === ',') {
            index++;
          }
          else {
            mapping = new Mapping();
            mapping.generatedLine = generatedLine;

            // Because each offset is encoded relative to the previous one,
            // many segments often have the same encoding. We can exploit this
            // fact by caching the parsed variable length fields of each segment,
            // allowing us to avoid a second parse if we encounter the same
            // segment again.
            for (end = index; end < length; end++) {
              if (this._charIsMappingSeparator(aStr, end)) {
                break;
              }
            }
            str = aStr.slice(index, end);

            segment = cachedSegments[str];
            if (segment) {
              index += str.length;
            } else {
              segment = [];
              while (index < end) {
                base64VLQ.decode(aStr, index, temp);
                value = temp.value;
                index = temp.rest;
                segment.push(value);
              }

              if (segment.length === 2) {
                throw new Error('Found a source, but no line and column');
              }

              if (segment.length === 3) {
                throw new Error('Found a source and line, but no column');
              }

              cachedSegments[str] = segment;
            }

            // Generated column.
            mapping.generatedColumn = previousGeneratedColumn + segment[0];
            previousGeneratedColumn = mapping.generatedColumn;

            if (segment.length > 1) {
              // Original source.
              mapping.source = previousSource + segment[1];
              previousSource += segment[1];

              // Original line.
              mapping.originalLine = previousOriginalLine + segment[2];
              previousOriginalLine = mapping.originalLine;
              // Lines are stored 0-based
              mapping.originalLine += 1;

              // Original column.
              mapping.originalColumn = previousOriginalColumn + segment[3];
              previousOriginalColumn = mapping.originalColumn;

              if (segment.length > 4) {
                // Original name.
                mapping.name = previousName + segment[4];
                previousName += segment[4];
              }
            }

            generatedMappings.push(mapping);
            if (typeof mapping.originalLine === 'number') {
              originalMappings.push(mapping);
            }
          }
        }

        quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
        this.__generatedMappings = generatedMappings;

        quickSort(originalMappings, util.compareByOriginalPositions);
        this.__originalMappings = originalMappings;
      };

    /**
     * Find the mapping that best matches the hypothetical "needle" mapping that
     * we are searching for in the given "haystack" of mappings.
     */
    BasicSourceMapConsumer.prototype._findMapping =
      function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                             aColumnName, aComparator, aBias) {
        // To return the position we are searching for, we must first find the
        // mapping for the given position and then return the opposite position it
        // points to. Because the mappings are sorted, we can use binary search to
        // find the best mapping.

        if (aNeedle[aLineName] <= 0) {
          throw new TypeError('Line must be greater than or equal to 1, got '
                              + aNeedle[aLineName]);
        }
        if (aNeedle[aColumnName] < 0) {
          throw new TypeError('Column must be greater than or equal to 0, got '
                              + aNeedle[aColumnName]);
        }

        return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
      };

    /**
     * Compute the last column for each generated mapping. The last column is
     * inclusive.
     */
    BasicSourceMapConsumer.prototype.computeColumnSpans =
      function SourceMapConsumer_computeColumnSpans() {
        for (var index = 0; index < this._generatedMappings.length; ++index) {
          var mapping = this._generatedMappings[index];

          // Mappings do not contain a field for the last generated columnt. We
          // can come up with an optimistic estimate, however, by assuming that
          // mappings are contiguous (i.e. given two consecutive mappings, the
          // first mapping ends where the second one starts).
          if (index + 1 < this._generatedMappings.length) {
            var nextMapping = this._generatedMappings[index + 1];

            if (mapping.generatedLine === nextMapping.generatedLine) {
              mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
              continue;
            }
          }

          // The last mapping for each line spans the entire line.
          mapping.lastGeneratedColumn = Infinity;
        }
      };

    /**
     * Returns the original source, line, and column information for the generated
     * source's line and column positions provided. The only argument is an object
     * with the following properties:
     *
     *   - line: The line number in the generated source.  The line number
     *     is 1-based.
     *   - column: The column number in the generated source.  The column
     *     number is 0-based.
     *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
     *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
     *     closest element that is smaller than or greater than the one we are
     *     searching for, respectively, if the exact element cannot be found.
     *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
     *
     * and an object is returned with the following properties:
     *
     *   - source: The original source file, or null.
     *   - line: The line number in the original source, or null.  The
     *     line number is 1-based.
     *   - column: The column number in the original source, or null.  The
     *     column number is 0-based.
     *   - name: The original identifier, or null.
     */
    BasicSourceMapConsumer.prototype.originalPositionFor =
      function SourceMapConsumer_originalPositionFor(aArgs) {
        var needle = {
          generatedLine: util.getArg(aArgs, 'line'),
          generatedColumn: util.getArg(aArgs, 'column')
        };

        var index = this._findMapping(
          needle,
          this._generatedMappings,
          "generatedLine",
          "generatedColumn",
          util.compareByGeneratedPositionsDeflated,
          util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
        );

        if (index >= 0) {
          var mapping = this._generatedMappings[index];

          if (mapping.generatedLine === needle.generatedLine) {
            var source = util.getArg(mapping, 'source', null);
            if (source !== null) {
              source = this._sources.at(source);
              source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
            }
            var name = util.getArg(mapping, 'name', null);
            if (name !== null) {
              name = this._names.at(name);
            }
            return {
              source: source,
              line: util.getArg(mapping, 'originalLine', null),
              column: util.getArg(mapping, 'originalColumn', null),
              name: name
            };
          }
        }

        return {
          source: null,
          line: null,
          column: null,
          name: null
        };
      };

    /**
     * Return true if we have the source content for every source in the source
     * map, false otherwise.
     */
    BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
      function BasicSourceMapConsumer_hasContentsOfAllSources() {
        if (!this.sourcesContent) {
          return false;
        }
        return this.sourcesContent.length >= this._sources.size() &&
          !this.sourcesContent.some(function (sc) { return sc == null; });
      };

    /**
     * Returns the original source content. The only argument is the url of the
     * original source file. Returns null if no original source content is
     * available.
     */
    BasicSourceMapConsumer.prototype.sourceContentFor =
      function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
        if (!this.sourcesContent) {
          return null;
        }

        var index = this._findSourceIndex(aSource);
        if (index >= 0) {
          return this.sourcesContent[index];
        }

        var relativeSource = aSource;
        if (this.sourceRoot != null) {
          relativeSource = util.relative(this.sourceRoot, relativeSource);
        }

        var url;
        if (this.sourceRoot != null
            && (url = util.urlParse(this.sourceRoot))) {
          // XXX: file:// URIs and absolute paths lead to unexpected behavior for
          // many users. We can help them out when they expect file:// URIs to
          // behave like it would if they were running a local HTTP server. See
          // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
          var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
          if (url.scheme == "file"
              && this._sources.has(fileUriAbsPath)) {
            return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
          }

          if ((!url.path || url.path == "/")
              && this._sources.has("/" + relativeSource)) {
            return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
          }
        }

        // This function is used recursively from
        // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
        // don't want to throw if we can't find the source - we just want to
        // return null, so we provide a flag to exit gracefully.
        if (nullOnMissing) {
          return null;
        }
        else {
          throw new Error('"' + relativeSource + '" is not in the SourceMap.');
        }
      };

    /**
     * Returns the generated line and column information for the original source,
     * line, and column positions provided. The only argument is an object with
     * the following properties:
     *
     *   - source: The filename of the original source.
     *   - line: The line number in the original source.  The line number
     *     is 1-based.
     *   - column: The column number in the original source.  The column
     *     number is 0-based.
     *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
     *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
     *     closest element that is smaller than or greater than the one we are
     *     searching for, respectively, if the exact element cannot be found.
     *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
     *
     * and an object is returned with the following properties:
     *
     *   - line: The line number in the generated source, or null.  The
     *     line number is 1-based.
     *   - column: The column number in the generated source, or null.
     *     The column number is 0-based.
     */
    BasicSourceMapConsumer.prototype.generatedPositionFor =
      function SourceMapConsumer_generatedPositionFor(aArgs) {
        var source = util.getArg(aArgs, 'source');
        source = this._findSourceIndex(source);
        if (source < 0) {
          return {
            line: null,
            column: null,
            lastColumn: null
          };
        }

        var needle = {
          source: source,
          originalLine: util.getArg(aArgs, 'line'),
          originalColumn: util.getArg(aArgs, 'column')
        };

        var index = this._findMapping(
          needle,
          this._originalMappings,
          "originalLine",
          "originalColumn",
          util.compareByOriginalPositions,
          util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
        );

        if (index >= 0) {
          var mapping = this._originalMappings[index];

          if (mapping.source === needle.source) {
            return {
              line: util.getArg(mapping, 'generatedLine', null),
              column: util.getArg(mapping, 'generatedColumn', null),
              lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
            };
          }
        }

        return {
          line: null,
          column: null,
          lastColumn: null
        };
      };

    exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

    /**
     * An IndexedSourceMapConsumer instance represents a parsed source map which
     * we can query for information. It differs from BasicSourceMapConsumer in
     * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
     * input.
     *
     * The first parameter is a raw source map (either as a JSON string, or already
     * parsed to an object). According to the spec for indexed source maps, they
     * have the following attributes:
     *
     *   - version: Which version of the source map spec this map is following.
     *   - file: Optional. The generated file this source map is associated with.
     *   - sections: A list of section definitions.
     *
     * Each value under the "sections" field has two fields:
     *   - offset: The offset into the original specified at which this section
     *       begins to apply, defined as an object with a "line" and "column"
     *       field.
     *   - map: A source map definition. This source map could also be indexed,
     *       but doesn't have to be.
     *
     * Instead of the "map" field, it's also possible to have a "url" field
     * specifying a URL to retrieve a source map from, but that's currently
     * unsupported.
     *
     * Here's an example source map, taken from the source map spec[0], but
     * modified to omit a section which uses the "url" field.
     *
     *  {
     *    version : 3,
     *    file: "app.js",
     *    sections: [{
     *      offset: {line:100, column:10},
     *      map: {
     *        version : 3,
     *        file: "section.js",
     *        sources: ["foo.js", "bar.js"],
     *        names: ["src", "maps", "are", "fun"],
     *        mappings: "AAAA,E;;ABCDE;"
     *      }
     *    }],
     *  }
     *
     * The second parameter, if given, is a string whose value is the URL
     * at which the source map was found.  This URL is used to compute the
     * sources array.
     *
     * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
     */
    function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === 'string') {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }

      var version = util.getArg(sourceMap, 'version');
      var sections = util.getArg(sourceMap, 'sections');

      if (version != this._version) {
        throw new Error('Unsupported version: ' + version);
      }

      this._sources = new ArraySet();
      this._names = new ArraySet();

      var lastOffset = {
        line: -1,
        column: 0
      };
      this._sections = sections.map(function (s) {
        if (s.url) {
          // The url field will require support for asynchronicity.
          // See https://github.com/mozilla/source-map/issues/16
          throw new Error('Support for url field in sections not implemented.');
        }
        var offset = util.getArg(s, 'offset');
        var offsetLine = util.getArg(offset, 'line');
        var offsetColumn = util.getArg(offset, 'column');

        if (offsetLine < lastOffset.line ||
            (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
          throw new Error('Section offsets must be ordered and non-overlapping.');
        }
        lastOffset = offset;

        return {
          generatedOffset: {
            // The offset fields are 0-based, but we use 1-based indices when
            // encoding/decoding from VLQ.
            generatedLine: offsetLine + 1,
            generatedColumn: offsetColumn + 1
          },
          consumer: new SourceMapConsumer(util.getArg(s, 'map'), aSourceMapURL)
        }
      });
    }

    IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
    IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

    /**
     * The version of the source mapping spec that we are consuming.
     */
    IndexedSourceMapConsumer.prototype._version = 3;

    /**
     * The list of original sources.
     */
    Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
      get: function () {
        var sources = [];
        for (var i = 0; i < this._sections.length; i++) {
          for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
            sources.push(this._sections[i].consumer.sources[j]);
          }
        }
        return sources;
      }
    });

    /**
     * Returns the original source, line, and column information for the generated
     * source's line and column positions provided. The only argument is an object
     * with the following properties:
     *
     *   - line: The line number in the generated source.  The line number
     *     is 1-based.
     *   - column: The column number in the generated source.  The column
     *     number is 0-based.
     *
     * and an object is returned with the following properties:
     *
     *   - source: The original source file, or null.
     *   - line: The line number in the original source, or null.  The
     *     line number is 1-based.
     *   - column: The column number in the original source, or null.  The
     *     column number is 0-based.
     *   - name: The original identifier, or null.
     */
    IndexedSourceMapConsumer.prototype.originalPositionFor =
      function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
        var needle = {
          generatedLine: util.getArg(aArgs, 'line'),
          generatedColumn: util.getArg(aArgs, 'column')
        };

        // Find the section containing the generated position we're trying to map
        // to an original position.
        var sectionIndex = binarySearch.search(needle, this._sections,
          function(needle, section) {
            var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
            if (cmp) {
              return cmp;
            }

            return (needle.generatedColumn -
                    section.generatedOffset.generatedColumn);
          });
        var section = this._sections[sectionIndex];

        if (!section) {
          return {
            source: null,
            line: null,
            column: null,
            name: null
          };
        }

        return section.consumer.originalPositionFor({
          line: needle.generatedLine -
            (section.generatedOffset.generatedLine - 1),
          column: needle.generatedColumn -
            (section.generatedOffset.generatedLine === needle.generatedLine
             ? section.generatedOffset.generatedColumn - 1
             : 0),
          bias: aArgs.bias
        });
      };

    /**
     * Return true if we have the source content for every source in the source
     * map, false otherwise.
     */
    IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
      function IndexedSourceMapConsumer_hasContentsOfAllSources() {
        return this._sections.every(function (s) {
          return s.consumer.hasContentsOfAllSources();
        });
      };

    /**
     * Returns the original source content. The only argument is the url of the
     * original source file. Returns null if no original source content is
     * available.
     */
    IndexedSourceMapConsumer.prototype.sourceContentFor =
      function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
        for (var i = 0; i < this._sections.length; i++) {
          var section = this._sections[i];

          var content = section.consumer.sourceContentFor(aSource, true);
          if (content) {
            return content;
          }
        }
        if (nullOnMissing) {
          return null;
        }
        else {
          throw new Error('"' + aSource + '" is not in the SourceMap.');
        }
      };

    /**
     * Returns the generated line and column information for the original source,
     * line, and column positions provided. The only argument is an object with
     * the following properties:
     *
     *   - source: The filename of the original source.
     *   - line: The line number in the original source.  The line number
     *     is 1-based.
     *   - column: The column number in the original source.  The column
     *     number is 0-based.
     *
     * and an object is returned with the following properties:
     *
     *   - line: The line number in the generated source, or null.  The
     *     line number is 1-based. 
     *   - column: The column number in the generated source, or null.
     *     The column number is 0-based.
     */
    IndexedSourceMapConsumer.prototype.generatedPositionFor =
      function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
        for (var i = 0; i < this._sections.length; i++) {
          var section = this._sections[i];

          // Only consider this section if the requested source is in the list of
          // sources of the consumer.
          if (section.consumer._findSourceIndex(util.getArg(aArgs, 'source')) === -1) {
            continue;
          }
          var generatedPosition = section.consumer.generatedPositionFor(aArgs);
          if (generatedPosition) {
            var ret = {
              line: generatedPosition.line +
                (section.generatedOffset.generatedLine - 1),
              column: generatedPosition.column +
                (section.generatedOffset.generatedLine === generatedPosition.line
                 ? section.generatedOffset.generatedColumn - 1
                 : 0)
            };
            return ret;
          }
        }

        return {
          line: null,
          column: null
        };
      };

    /**
     * Parse the mappings in a string in to a data structure which we can easily
     * query (the ordered arrays in the `this.__generatedMappings` and
     * `this.__originalMappings` properties).
     */
    IndexedSourceMapConsumer.prototype._parseMappings =
      function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        for (var i = 0; i < this._sections.length; i++) {
          var section = this._sections[i];
          var sectionMappings = section.consumer._generatedMappings;
          for (var j = 0; j < sectionMappings.length; j++) {
            var mapping = sectionMappings[j];

            var source = section.consumer._sources.at(mapping.source);
            source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
            this._sources.add(source);
            source = this._sources.indexOf(source);

            var name = null;
            if (mapping.name) {
              name = section.consumer._names.at(mapping.name);
              this._names.add(name);
              name = this._names.indexOf(name);
            }

            // The mappings coming from the consumer for the section have
            // generated positions relative to the start of the section, so we
            // need to offset them to be relative to the start of the concatenated
            // generated file.
            var adjustedMapping = {
              source: source,
              generatedLine: mapping.generatedLine +
                (section.generatedOffset.generatedLine - 1),
              generatedColumn: mapping.generatedColumn +
                (section.generatedOffset.generatedLine === mapping.generatedLine
                ? section.generatedOffset.generatedColumn - 1
                : 0),
              originalLine: mapping.originalLine,
              originalColumn: mapping.originalColumn,
              name: name
            };

            this.__generatedMappings.push(adjustedMapping);
            if (typeof adjustedMapping.originalLine === 'number') {
              this.__originalMappings.push(adjustedMapping);
            }
          }
        }

        quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
        quickSort(this.__originalMappings, util.compareByOriginalPositions);
      };

    exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;


    /***/ }),

    /***/ 277:
    /***/ (function(__unusedmodule, exports, __webpack_require__) {

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     *
     * Based on the Base 64 VLQ implementation in Closure Compiler:
     * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
     *
     * Copyright 2011 The Closure Compiler Authors. All rights reserved.
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are
     * met:
     *
     *  * Redistributions of source code must retain the above copyright
     *    notice, this list of conditions and the following disclaimer.
     *  * Redistributions in binary form must reproduce the above
     *    copyright notice, this list of conditions and the following
     *    disclaimer in the documentation and/or other materials provided
     *    with the distribution.
     *  * Neither the name of Google Inc. nor the names of its
     *    contributors may be used to endorse or promote products derived
     *    from this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
     * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
     * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
     * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
     * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
     * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
     * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
     * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
     * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
     * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */

    var base64 = __webpack_require__(947);

    // A single base 64 digit can contain 6 bits of data. For the base 64 variable
    // length quantities we use in the source map spec, the first bit is the sign,
    // the next four bits are the actual value, and the 6th bit is the
    // continuation bit. The continuation bit tells us whether there are more
    // digits in this value following this digit.
    //
    //   Continuation
    //   |    Sign
    //   |    |
    //   V    V
    //   101011

    var VLQ_BASE_SHIFT = 5;

    // binary: 100000
    var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

    // binary: 011111
    var VLQ_BASE_MASK = VLQ_BASE - 1;

    // binary: 100000
    var VLQ_CONTINUATION_BIT = VLQ_BASE;

    /**
     * Converts from a two-complement value to a value where the sign bit is
     * placed in the least significant bit.  For example, as decimals:
     *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
     *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
     */
    function toVLQSigned(aValue) {
      return aValue < 0
        ? ((-aValue) << 1) + 1
        : (aValue << 1) + 0;
    }

    /**
     * Converts to a two-complement value from a value where the sign bit is
     * placed in the least significant bit.  For example, as decimals:
     *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
     *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
     */
    function fromVLQSigned(aValue) {
      var isNegative = (aValue & 1) === 1;
      var shifted = aValue >> 1;
      return isNegative
        ? -shifted
        : shifted;
    }

    /**
     * Returns the base 64 VLQ encoded value.
     */
    exports.encode = function base64VLQ_encode(aValue) {
      var encoded = "";
      var digit;

      var vlq = toVLQSigned(aValue);

      do {
        digit = vlq & VLQ_BASE_MASK;
        vlq >>>= VLQ_BASE_SHIFT;
        if (vlq > 0) {
          // There are still more digits in this value, so we must make sure the
          // continuation bit is marked.
          digit |= VLQ_CONTINUATION_BIT;
        }
        encoded += base64.encode(digit);
      } while (vlq > 0);

      return encoded;
    };

    /**
     * Decodes the next base 64 VLQ value from the given string and returns the
     * value and the rest of the string via the out parameter.
     */
    exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
      var strLen = aStr.length;
      var result = 0;
      var shift = 0;
      var continuation, digit;

      do {
        if (aIndex >= strLen) {
          throw new Error("Expected more digits in base 64 VLQ value.");
        }

        digit = base64.decode(aStr.charCodeAt(aIndex++));
        if (digit === -1) {
          throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
        }

        continuation = !!(digit & VLQ_CONTINUATION_BIT);
        digit &= VLQ_BASE_MASK;
        result = result + (digit << shift);
        shift += VLQ_BASE_SHIFT;
      } while (continuation);

      aOutParam.value = fromVLQSigned(result);
      aOutParam.rest = aIndex;
    };


    /***/ }),

    /***/ 282:
    /***/ (function(module) {

    module.exports = require("module");

    /***/ }),

    /***/ 338:
    /***/ (function(__unusedmodule, exports) {

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    /**
     * This is a helper function for getting values from parameter/options
     * objects.
     *
     * @param args The object we are extracting values from
     * @param name The name of the property we are getting.
     * @param defaultValue An optional value to return if the property is missing
     * from the object. If this is not specified and the property is missing, an
     * error will be thrown.
     */
    function getArg(aArgs, aName, aDefaultValue) {
      if (aName in aArgs) {
        return aArgs[aName];
      } else if (arguments.length === 3) {
        return aDefaultValue;
      } else {
        throw new Error('"' + aName + '" is a required argument.');
      }
    }
    exports.getArg = getArg;

    var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
    var dataUrlRegexp = /^data:.+\,.+$/;

    function urlParse(aUrl) {
      var match = aUrl.match(urlRegexp);
      if (!match) {
        return null;
      }
      return {
        scheme: match[1],
        auth: match[2],
        host: match[3],
        port: match[4],
        path: match[5]
      };
    }
    exports.urlParse = urlParse;

    function urlGenerate(aParsedUrl) {
      var url = '';
      if (aParsedUrl.scheme) {
        url += aParsedUrl.scheme + ':';
      }
      url += '//';
      if (aParsedUrl.auth) {
        url += aParsedUrl.auth + '@';
      }
      if (aParsedUrl.host) {
        url += aParsedUrl.host;
      }
      if (aParsedUrl.port) {
        url += ":" + aParsedUrl.port;
      }
      if (aParsedUrl.path) {
        url += aParsedUrl.path;
      }
      return url;
    }
    exports.urlGenerate = urlGenerate;

    /**
     * Normalizes a path, or the path portion of a URL:
     *
     * - Replaces consecutive slashes with one slash.
     * - Removes unnecessary '.' parts.
     * - Removes unnecessary '<dir>/..' parts.
     *
     * Based on code in the Node.js 'path' core module.
     *
     * @param aPath The path or url to normalize.
     */
    function normalize(aPath) {
      var path = aPath;
      var url = urlParse(aPath);
      if (url) {
        if (!url.path) {
          return aPath;
        }
        path = url.path;
      }
      var isAbsolute = exports.isAbsolute(path);

      var parts = path.split(/\/+/);
      for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
        part = parts[i];
        if (part === '.') {
          parts.splice(i, 1);
        } else if (part === '..') {
          up++;
        } else if (up > 0) {
          if (part === '') {
            // The first part is blank if the path is absolute. Trying to go
            // above the root is a no-op. Therefore we can remove all '..' parts
            // directly after the root.
            parts.splice(i + 1, up);
            up = 0;
          } else {
            parts.splice(i, 2);
            up--;
          }
        }
      }
      path = parts.join('/');

      if (path === '') {
        path = isAbsolute ? '/' : '.';
      }

      if (url) {
        url.path = path;
        return urlGenerate(url);
      }
      return path;
    }
    exports.normalize = normalize;

    /**
     * Joins two paths/URLs.
     *
     * @param aRoot The root path or URL.
     * @param aPath The path or URL to be joined with the root.
     *
     * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
     *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
     *   first.
     * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
     *   is updated with the result and aRoot is returned. Otherwise the result
     *   is returned.
     *   - If aPath is absolute, the result is aPath.
     *   - Otherwise the two paths are joined with a slash.
     * - Joining for example 'http://' and 'www.example.com' is also supported.
     */
    function join(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      if (aPath === "") {
        aPath = ".";
      }
      var aPathUrl = urlParse(aPath);
      var aRootUrl = urlParse(aRoot);
      if (aRootUrl) {
        aRoot = aRootUrl.path || '/';
      }

      // `join(foo, '//www.example.org')`
      if (aPathUrl && !aPathUrl.scheme) {
        if (aRootUrl) {
          aPathUrl.scheme = aRootUrl.scheme;
        }
        return urlGenerate(aPathUrl);
      }

      if (aPathUrl || aPath.match(dataUrlRegexp)) {
        return aPath;
      }

      // `join('http://', 'www.example.com')`
      if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
        aRootUrl.host = aPath;
        return urlGenerate(aRootUrl);
      }

      var joined = aPath.charAt(0) === '/'
        ? aPath
        : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

      if (aRootUrl) {
        aRootUrl.path = joined;
        return urlGenerate(aRootUrl);
      }
      return joined;
    }
    exports.join = join;

    exports.isAbsolute = function (aPath) {
      return aPath.charAt(0) === '/' || urlRegexp.test(aPath);
    };

    /**
     * Make a path relative to a URL or another path.
     *
     * @param aRoot The root path or URL.
     * @param aPath The path or URL to be made relative to aRoot.
     */
    function relative(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }

      aRoot = aRoot.replace(/\/$/, '');

      // It is possible for the path to be above the root. In this case, simply
      // checking whether the root is a prefix of the path won't work. Instead, we
      // need to remove components from the root one by one, until either we find
      // a prefix that fits, or we run out of components to remove.
      var level = 0;
      while (aPath.indexOf(aRoot + '/') !== 0) {
        var index = aRoot.lastIndexOf("/");
        if (index < 0) {
          return aPath;
        }

        // If the only part of the root that is left is the scheme (i.e. http://,
        // file:///, etc.), one or more slashes (/), or simply nothing at all, we
        // have exhausted all components, so the path is not relative to the root.
        aRoot = aRoot.slice(0, index);
        if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
          return aPath;
        }

        ++level;
      }

      // Make sure we add a "../" for each component we removed from the root.
      return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
    }
    exports.relative = relative;

    var supportsNullProto = (function () {
      var obj = Object.create(null);
      return !('__proto__' in obj);
    }());

    function identity (s) {
      return s;
    }

    /**
     * Because behavior goes wacky when you set `__proto__` on objects, we
     * have to prefix all the strings in our set with an arbitrary character.
     *
     * See https://github.com/mozilla/source-map/pull/31 and
     * https://github.com/mozilla/source-map/issues/30
     *
     * @param String aStr
     */
    function toSetString(aStr) {
      if (isProtoString(aStr)) {
        return '$' + aStr;
      }

      return aStr;
    }
    exports.toSetString = supportsNullProto ? identity : toSetString;

    function fromSetString(aStr) {
      if (isProtoString(aStr)) {
        return aStr.slice(1);
      }

      return aStr;
    }
    exports.fromSetString = supportsNullProto ? identity : fromSetString;

    function isProtoString(s) {
      if (!s) {
        return false;
      }

      var length = s.length;

      if (length < 9 /* "__proto__".length */) {
        return false;
      }

      if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
          s.charCodeAt(length - 2) !== 95  /* '_' */ ||
          s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
          s.charCodeAt(length - 4) !== 116 /* 't' */ ||
          s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
          s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
          s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
          s.charCodeAt(length - 8) !== 95  /* '_' */ ||
          s.charCodeAt(length - 9) !== 95  /* '_' */) {
        return false;
      }

      for (var i = length - 10; i >= 0; i--) {
        if (s.charCodeAt(i) !== 36 /* '$' */) {
          return false;
        }
      }

      return true;
    }

    /**
     * Comparator between two mappings where the original positions are compared.
     *
     * Optionally pass in `true` as `onlyCompareGenerated` to consider two
     * mappings with the same original source/line/column, but different generated
     * line and column the same. Useful when searching for a mapping with a
     * stubbed out mapping.
     */
    function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
      var cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }

      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }

      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByOriginalPositions = compareByOriginalPositions;

    /**
     * Comparator between two mappings with deflated source and name indices where
     * the generated positions are compared.
     *
     * Optionally pass in `true` as `onlyCompareGenerated` to consider two
     * mappings with the same generated line and column, but different
     * source/name/original line and column the same. Useful when searching for a
     * mapping with a stubbed out mapping.
     */
    function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }

      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }

      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

    function strcmp(aStr1, aStr2) {
      if (aStr1 === aStr2) {
        return 0;
      }

      if (aStr1 === null) {
        return 1; // aStr2 !== null
      }

      if (aStr2 === null) {
        return -1; // aStr1 !== null
      }

      if (aStr1 > aStr2) {
        return 1;
      }

      return -1;
    }

    /**
     * Comparator between two mappings with inflated source and name strings where
     * the generated positions are compared.
     */
    function compareByGeneratedPositionsInflated(mappingA, mappingB) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }

      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }

      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

    /**
     * Strip any JSON XSSI avoidance prefix from the string (as documented
     * in the source maps specification), and then parse the string as
     * JSON.
     */
    function parseSourceMapInput(str) {
      return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''));
    }
    exports.parseSourceMapInput = parseSourceMapInput;

    /**
     * Compute the URL of a source given the the source root, the source's
     * URL, and the source map's URL.
     */
    function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
      sourceURL = sourceURL || '';

      if (sourceRoot) {
        // This follows what Chrome does.
        if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
          sourceRoot += '/';
        }
        // The spec says:
        //   Line 4: An optional source root, useful for relocating source
        //   files on a server or removing repeated values in the
        //   “sources” entry.  This value is prepended to the individual
        //   entries in the “source” field.
        sourceURL = sourceRoot + sourceURL;
      }

      // Historically, SourceMapConsumer did not take the sourceMapURL as
      // a parameter.  This mode is still somewhat supported, which is why
      // this code block is conditional.  However, it's preferable to pass
      // the source map URL to SourceMapConsumer, so that this function
      // can implement the source URL resolution algorithm as outlined in
      // the spec.  This block is basically the equivalent of:
      //    new URL(sourceURL, sourceMapURL).toString()
      // ... except it avoids using URL, which wasn't available in the
      // older releases of node still supported by this library.
      //
      // The spec says:
      //   If the sources are not absolute URLs after prepending of the
      //   “sourceRoot”, the sources are resolved relative to the
      //   SourceMap (like resolving script src in a html document).
      if (sourceMapURL) {
        var parsed = urlParse(sourceMapURL);
        if (!parsed) {
          throw new Error("sourceMapURL could not be parsed");
        }
        if (parsed.path) {
          // Strip the last path component, but keep the "/".
          var index = parsed.path.lastIndexOf('/');
          if (index >= 0) {
            parsed.path = parsed.path.substring(0, index + 1);
          }
        }
        sourceURL = join(urlGenerate(parsed), sourceURL);
      }

      return normalize(sourceURL);
    }
    exports.computeSourceURL = computeSourceURL;


    /***/ }),

    /***/ 413:
    /***/ (function(module) {

    module.exports = require("stream");

    /***/ }),

    /***/ 451:
    /***/ (function(__unusedmodule, exports, __webpack_require__) {

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2014 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    var util = __webpack_require__(338);

    /**
     * Determine whether mappingB is after mappingA with respect to generated
     * position.
     */
    function generatedPositionAfter(mappingA, mappingB) {
      // Optimized for most common case
      var lineA = mappingA.generatedLine;
      var lineB = mappingB.generatedLine;
      var columnA = mappingA.generatedColumn;
      var columnB = mappingB.generatedColumn;
      return lineB > lineA || lineB == lineA && columnB >= columnA ||
             util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
    }

    /**
     * A data structure to provide a sorted view of accumulated mappings in a
     * performance conscious manner. It trades a neglibable overhead in general
     * case for a large speedup in case of mappings being added in order.
     */
    function MappingList() {
      this._array = [];
      this._sorted = true;
      // Serves as infimum
      this._last = {generatedLine: -1, generatedColumn: 0};
    }

    /**
     * Iterate through internal items. This method takes the same arguments that
     * `Array.prototype.forEach` takes.
     *
     * NOTE: The order of the mappings is NOT guaranteed.
     */
    MappingList.prototype.unsortedForEach =
      function MappingList_forEach(aCallback, aThisArg) {
        this._array.forEach(aCallback, aThisArg);
      };

    /**
     * Add the given source mapping.
     *
     * @param Object aMapping
     */
    MappingList.prototype.add = function MappingList_add(aMapping) {
      if (generatedPositionAfter(this._last, aMapping)) {
        this._last = aMapping;
        this._array.push(aMapping);
      } else {
        this._sorted = false;
        this._array.push(aMapping);
      }
    };

    /**
     * Returns the flat, sorted array of mappings. The mappings are sorted by
     * generated position.
     *
     * WARNING: This method returns internal data without copying, for
     * performance. The return value must NOT be mutated, and should be treated as
     * an immutable borrow. If you want to take ownership, you must make your own
     * copy.
     */
    MappingList.prototype.toArray = function MappingList_toArray() {
      if (!this._sorted) {
        this._array.sort(util.compareByGeneratedPositionsInflated);
        this._sorted = true;
      }
      return this._array;
    };

    exports.MappingList = MappingList;


    /***/ }),

    /***/ 454:
    /***/ (function(__unusedmodule, exports, __webpack_require__) {

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    var base64VLQ = __webpack_require__(277);
    var util = __webpack_require__(338);
    var ArraySet = __webpack_require__(969).ArraySet;
    var MappingList = __webpack_require__(451).MappingList;

    /**
     * An instance of the SourceMapGenerator represents a source map which is
     * being built incrementally. You may pass an object with the following
     * properties:
     *
     *   - file: The filename of the generated source.
     *   - sourceRoot: A root for all relative URLs in this source map.
     */
    function SourceMapGenerator(aArgs) {
      if (!aArgs) {
        aArgs = {};
      }
      this._file = util.getArg(aArgs, 'file', null);
      this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
      this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
      this._sources = new ArraySet();
      this._names = new ArraySet();
      this._mappings = new MappingList();
      this._sourcesContents = null;
    }

    SourceMapGenerator.prototype._version = 3;

    /**
     * Creates a new SourceMapGenerator based on a SourceMapConsumer
     *
     * @param aSourceMapConsumer The SourceMap.
     */
    SourceMapGenerator.fromSourceMap =
      function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
        var sourceRoot = aSourceMapConsumer.sourceRoot;
        var generator = new SourceMapGenerator({
          file: aSourceMapConsumer.file,
          sourceRoot: sourceRoot
        });
        aSourceMapConsumer.eachMapping(function (mapping) {
          var newMapping = {
            generated: {
              line: mapping.generatedLine,
              column: mapping.generatedColumn
            }
          };

          if (mapping.source != null) {
            newMapping.source = mapping.source;
            if (sourceRoot != null) {
              newMapping.source = util.relative(sourceRoot, newMapping.source);
            }

            newMapping.original = {
              line: mapping.originalLine,
              column: mapping.originalColumn
            };

            if (mapping.name != null) {
              newMapping.name = mapping.name;
            }
          }

          generator.addMapping(newMapping);
        });
        aSourceMapConsumer.sources.forEach(function (sourceFile) {
          var sourceRelative = sourceFile;
          if (sourceRoot !== null) {
            sourceRelative = util.relative(sourceRoot, sourceFile);
          }

          if (!generator._sources.has(sourceRelative)) {
            generator._sources.add(sourceRelative);
          }

          var content = aSourceMapConsumer.sourceContentFor(sourceFile);
          if (content != null) {
            generator.setSourceContent(sourceFile, content);
          }
        });
        return generator;
      };

    /**
     * Add a single mapping from original source line and column to the generated
     * source's line and column for this source map being created. The mapping
     * object should have the following properties:
     *
     *   - generated: An object with the generated line and column positions.
     *   - original: An object with the original line and column positions.
     *   - source: The original source file (relative to the sourceRoot).
     *   - name: An optional original token name for this mapping.
     */
    SourceMapGenerator.prototype.addMapping =
      function SourceMapGenerator_addMapping(aArgs) {
        var generated = util.getArg(aArgs, 'generated');
        var original = util.getArg(aArgs, 'original', null);
        var source = util.getArg(aArgs, 'source', null);
        var name = util.getArg(aArgs, 'name', null);

        if (!this._skipValidation) {
          this._validateMapping(generated, original, source, name);
        }

        if (source != null) {
          source = String(source);
          if (!this._sources.has(source)) {
            this._sources.add(source);
          }
        }

        if (name != null) {
          name = String(name);
          if (!this._names.has(name)) {
            this._names.add(name);
          }
        }

        this._mappings.add({
          generatedLine: generated.line,
          generatedColumn: generated.column,
          originalLine: original != null && original.line,
          originalColumn: original != null && original.column,
          source: source,
          name: name
        });
      };

    /**
     * Set the source content for a source file.
     */
    SourceMapGenerator.prototype.setSourceContent =
      function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
        var source = aSourceFile;
        if (this._sourceRoot != null) {
          source = util.relative(this._sourceRoot, source);
        }

        if (aSourceContent != null) {
          // Add the source content to the _sourcesContents map.
          // Create a new _sourcesContents map if the property is null.
          if (!this._sourcesContents) {
            this._sourcesContents = Object.create(null);
          }
          this._sourcesContents[util.toSetString(source)] = aSourceContent;
        } else if (this._sourcesContents) {
          // Remove the source file from the _sourcesContents map.
          // If the _sourcesContents map is empty, set the property to null.
          delete this._sourcesContents[util.toSetString(source)];
          if (Object.keys(this._sourcesContents).length === 0) {
            this._sourcesContents = null;
          }
        }
      };

    /**
     * Applies the mappings of a sub-source-map for a specific source file to the
     * source map being generated. Each mapping to the supplied source file is
     * rewritten using the supplied source map. Note: The resolution for the
     * resulting mappings is the minimium of this map and the supplied map.
     *
     * @param aSourceMapConsumer The source map to be applied.
     * @param aSourceFile Optional. The filename of the source file.
     *        If omitted, SourceMapConsumer's file property will be used.
     * @param aSourceMapPath Optional. The dirname of the path to the source map
     *        to be applied. If relative, it is relative to the SourceMapConsumer.
     *        This parameter is needed when the two source maps aren't in the same
     *        directory, and the source map to be applied contains relative source
     *        paths. If so, those relative source paths need to be rewritten
     *        relative to the SourceMapGenerator.
     */
    SourceMapGenerator.prototype.applySourceMap =
      function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
        var sourceFile = aSourceFile;
        // If aSourceFile is omitted, we will use the file property of the SourceMap
        if (aSourceFile == null) {
          if (aSourceMapConsumer.file == null) {
            throw new Error(
              'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
              'or the source map\'s "file" property. Both were omitted.'
            );
          }
          sourceFile = aSourceMapConsumer.file;
        }
        var sourceRoot = this._sourceRoot;
        // Make "sourceFile" relative if an absolute Url is passed.
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        // Applying the SourceMap can add and remove items from the sources and
        // the names array.
        var newSources = new ArraySet();
        var newNames = new ArraySet();

        // Find mappings for the "sourceFile"
        this._mappings.unsortedForEach(function (mapping) {
          if (mapping.source === sourceFile && mapping.originalLine != null) {
            // Check if it can be mapped by the source map, then update the mapping.
            var original = aSourceMapConsumer.originalPositionFor({
              line: mapping.originalLine,
              column: mapping.originalColumn
            });
            if (original.source != null) {
              // Copy mapping
              mapping.source = original.source;
              if (aSourceMapPath != null) {
                mapping.source = util.join(aSourceMapPath, mapping.source);
              }
              if (sourceRoot != null) {
                mapping.source = util.relative(sourceRoot, mapping.source);
              }
              mapping.originalLine = original.line;
              mapping.originalColumn = original.column;
              if (original.name != null) {
                mapping.name = original.name;
              }
            }
          }

          var source = mapping.source;
          if (source != null && !newSources.has(source)) {
            newSources.add(source);
          }

          var name = mapping.name;
          if (name != null && !newNames.has(name)) {
            newNames.add(name);
          }

        }, this);
        this._sources = newSources;
        this._names = newNames;

        // Copy sourcesContents of applied map.
        aSourceMapConsumer.sources.forEach(function (sourceFile) {
          var content = aSourceMapConsumer.sourceContentFor(sourceFile);
          if (content != null) {
            if (aSourceMapPath != null) {
              sourceFile = util.join(aSourceMapPath, sourceFile);
            }
            if (sourceRoot != null) {
              sourceFile = util.relative(sourceRoot, sourceFile);
            }
            this.setSourceContent(sourceFile, content);
          }
        }, this);
      };

    /**
     * A mapping can have one of the three levels of data:
     *
     *   1. Just the generated position.
     *   2. The Generated position, original position, and original source.
     *   3. Generated and original position, original source, as well as a name
     *      token.
     *
     * To maintain consistency, we validate that any new mapping being added falls
     * in to one of these categories.
     */
    SourceMapGenerator.prototype._validateMapping =
      function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                                  aName) {
        // When aOriginal is truthy but has empty values for .line and .column,
        // it is most likely a programmer error. In this case we throw a very
        // specific error message to try to guide them the right way.
        // For example: https://github.com/Polymer/polymer-bundler/pull/519
        if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
            throw new Error(
                'original.line and original.column are not numbers -- you probably meant to omit ' +
                'the original mapping entirely and only map the generated position. If so, pass ' +
                'null for the original mapping instead of an object with empty or null values.'
            );
        }

        if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
            && aGenerated.line > 0 && aGenerated.column >= 0
            && !aOriginal && !aSource && !aName) {
          // Case 1.
          return;
        }
        else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
                 && aOriginal && 'line' in aOriginal && 'column' in aOriginal
                 && aGenerated.line > 0 && aGenerated.column >= 0
                 && aOriginal.line > 0 && aOriginal.column >= 0
                 && aSource) {
          // Cases 2 and 3.
          return;
        }
        else {
          throw new Error('Invalid mapping: ' + JSON.stringify({
            generated: aGenerated,
            source: aSource,
            original: aOriginal,
            name: aName
          }));
        }
      };

    /**
     * Serialize the accumulated mappings in to the stream of base 64 VLQs
     * specified by the source map format.
     */
    SourceMapGenerator.prototype._serializeMappings =
      function SourceMapGenerator_serializeMappings() {
        var previousGeneratedColumn = 0;
        var previousGeneratedLine = 1;
        var previousOriginalColumn = 0;
        var previousOriginalLine = 0;
        var previousName = 0;
        var previousSource = 0;
        var result = '';
        var next;
        var mapping;
        var nameIdx;
        var sourceIdx;

        var mappings = this._mappings.toArray();
        for (var i = 0, len = mappings.length; i < len; i++) {
          mapping = mappings[i];
          next = '';

          if (mapping.generatedLine !== previousGeneratedLine) {
            previousGeneratedColumn = 0;
            while (mapping.generatedLine !== previousGeneratedLine) {
              next += ';';
              previousGeneratedLine++;
            }
          }
          else {
            if (i > 0) {
              if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
                continue;
              }
              next += ',';
            }
          }

          next += base64VLQ.encode(mapping.generatedColumn
                                     - previousGeneratedColumn);
          previousGeneratedColumn = mapping.generatedColumn;

          if (mapping.source != null) {
            sourceIdx = this._sources.indexOf(mapping.source);
            next += base64VLQ.encode(sourceIdx - previousSource);
            previousSource = sourceIdx;

            // lines are stored 0-based in SourceMap spec version 3
            next += base64VLQ.encode(mapping.originalLine - 1
                                       - previousOriginalLine);
            previousOriginalLine = mapping.originalLine - 1;

            next += base64VLQ.encode(mapping.originalColumn
                                       - previousOriginalColumn);
            previousOriginalColumn = mapping.originalColumn;

            if (mapping.name != null) {
              nameIdx = this._names.indexOf(mapping.name);
              next += base64VLQ.encode(nameIdx - previousName);
              previousName = nameIdx;
            }
          }

          result += next;
        }

        return result;
      };

    SourceMapGenerator.prototype._generateSourcesContent =
      function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
        return aSources.map(function (source) {
          if (!this._sourcesContents) {
            return null;
          }
          if (aSourceRoot != null) {
            source = util.relative(aSourceRoot, source);
          }
          var key = util.toSetString(source);
          return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
            ? this._sourcesContents[key]
            : null;
        }, this);
      };

    /**
     * Externalize the source map.
     */
    SourceMapGenerator.prototype.toJSON =
      function SourceMapGenerator_toJSON() {
        var map = {
          version: this._version,
          sources: this._sources.toArray(),
          names: this._names.toArray(),
          mappings: this._serializeMappings()
        };
        if (this._file != null) {
          map.file = this._file;
        }
        if (this._sourceRoot != null) {
          map.sourceRoot = this._sourceRoot;
        }
        if (this._sourcesContents) {
          map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
        }

        return map;
      };

    /**
     * Render the source map being generated to a string.
     */
    SourceMapGenerator.prototype.toString =
      function SourceMapGenerator_toString() {
        return JSON.stringify(this.toJSON());
      };

    exports.SourceMapGenerator = SourceMapGenerator;


    /***/ }),

    /***/ 501:
    /***/ (function(module) {

    var toString = Object.prototype.toString;

    var isModern = (
      typeof Buffer.alloc === 'function' &&
      typeof Buffer.allocUnsafe === 'function' &&
      typeof Buffer.from === 'function'
    );

    function isArrayBuffer (input) {
      return toString.call(input).slice(8, -1) === 'ArrayBuffer'
    }

    function fromArrayBuffer (obj, byteOffset, length) {
      byteOffset >>>= 0;

      var maxLength = obj.byteLength - byteOffset;

      if (maxLength < 0) {
        throw new RangeError("'offset' is out of bounds")
      }

      if (length === undefined) {
        length = maxLength;
      } else {
        length >>>= 0;

        if (length > maxLength) {
          throw new RangeError("'length' is out of bounds")
        }
      }

      return isModern
        ? Buffer.from(obj.slice(byteOffset, byteOffset + length))
        : new Buffer(new Uint8Array(obj.slice(byteOffset, byteOffset + length)))
    }

    function fromString (string, encoding) {
      if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8';
      }

      if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('"encoding" must be a valid string encoding')
      }

      return isModern
        ? Buffer.from(string, encoding)
        : new Buffer(string, encoding)
    }

    function bufferFrom (value, encodingOrOffset, length) {
      if (typeof value === 'number') {
        throw new TypeError('"value" argument must not be a number')
      }

      if (isArrayBuffer(value)) {
        return fromArrayBuffer(value, encodingOrOffset, length)
      }

      if (typeof value === 'string') {
        return fromString(value, encodingOrOffset)
      }

      return isModern
        ? Buffer.from(value)
        : new Buffer(value)
    }

    module.exports = bufferFrom;


    /***/ }),

    /***/ 554:
    /***/ (function(__unusedmodule, __webpack_exports__, __webpack_require__) {
    __webpack_require__.r(__webpack_exports__);

    // CONCATENATED MODULE: ./src/err-msg.js
    function errMsg(errCode, msg) {
      if (process.env.SYSTEM_PRODUCTION)
        return (msg || "") + " (SystemJS https://git.io/JvFET#" + errCode + ")";
      else
        return (msg || "") + " (SystemJS Error#" + errCode + " " + "https://git.io/JvFET#" + errCode + ")";
    }
    // CONCATENATED MODULE: ./src/common.js


    var hasSymbol = typeof Symbol !== 'undefined';
    var hasSelf = typeof self !== 'undefined';
    var hasDocument = typeof document !== 'undefined';

    var envGlobal = hasSelf ? self : global;


    // Loader-scoped baseUrl supported in Node.js only
    var BASE_URL = hasSymbol ? Symbol() : '_';

    var baseUrl;

    if (hasDocument) {
      var baseEl = document.querySelector('base[href]');
      if (baseEl)
        baseUrl = baseEl.href;
    }

    if (!baseUrl && typeof location !== 'undefined') {
      baseUrl = location.href.split('#')[0].split('?')[0];
      var lastSepIndex = baseUrl.lastIndexOf('/');
      if (lastSepIndex !== -1)
        baseUrl = baseUrl.slice(0, lastSepIndex + 1);
    }

    if (!process.env.SYSTEM_BROWSER && !baseUrl && typeof process !== 'undefined') {
      var cwd = process.cwd();
      // TODO: encoding edge cases
      baseUrl = 'file://' + (cwd[0] === '/' ? '' : '/') + cwd.replace(/\\/g, '/') + '/';
    }

    var backslashRegEx = /\\/g;
    function resolveIfNotPlainOrUrl (relUrl, parentUrl) {
      if (relUrl.indexOf('\\') !== -1)
        relUrl = relUrl.replace(backslashRegEx, '/');
      // protocol-relative
      if (relUrl[0] === '/' && relUrl[1] === '/') {
        return parentUrl.slice(0, parentUrl.indexOf(':') + 1) + relUrl;
      }
      // relative-url
      else if (relUrl[0] === '.' && (relUrl[1] === '/' || relUrl[1] === '.' && (relUrl[2] === '/' || relUrl.length === 2 && (relUrl += '/')) ||
          relUrl.length === 1  && (relUrl += '/')) ||
          relUrl[0] === '/') {
        var parentProtocol = parentUrl.slice(0, parentUrl.indexOf(':') + 1);
        // Disabled, but these cases will give inconsistent results for deep backtracking
        //if (parentUrl[parentProtocol.length] !== '/')
        //  throw Error('Cannot resolve');
        // read pathname from parent URL
        // pathname taken to be part after leading "/"
        var pathname;
        if (parentUrl[parentProtocol.length + 1] === '/') {
          // resolving to a :// so we need to read out the auth and host
          if (parentProtocol !== 'file:') {
            pathname = parentUrl.slice(parentProtocol.length + 2);
            pathname = pathname.slice(pathname.indexOf('/') + 1);
          }
          else {
            pathname = parentUrl.slice(8);
          }
        }
        else {
          // resolving to :/ so pathname is the /... part
          pathname = parentUrl.slice(parentProtocol.length + (parentUrl[parentProtocol.length] === '/'));
        }

        if (relUrl[0] === '/')
          return parentUrl.slice(0, parentUrl.length - pathname.length - 1) + relUrl;

        // join together and split for removal of .. and . segments
        // looping the string instead of anything fancy for perf reasons
        // '../../../../../z' resolved to 'x/y' is just 'z'
        var segmented = pathname.slice(0, pathname.lastIndexOf('/') + 1) + relUrl;

        var output = [];
        var segmentIndex = -1;
        for (var i = 0; i < segmented.length; i++) {
          // busy reading a segment - only terminate on '/'
          if (segmentIndex !== -1) {
            if (segmented[i] === '/') {
              output.push(segmented.slice(segmentIndex, i + 1));
              segmentIndex = -1;
            }
          }

          // new segment - check if it is relative
          else if (segmented[i] === '.') {
            // ../ segment
            if (segmented[i + 1] === '.' && (segmented[i + 2] === '/' || i + 2 === segmented.length)) {
              output.pop();
              i += 2;
            }
            // ./ segment
            else if (segmented[i + 1] === '/' || i + 1 === segmented.length) {
              i += 1;
            }
            else {
              // the start of a new segment as below
              segmentIndex = i;
            }
          }
          // it is the start of a new segment
          else {
            segmentIndex = i;
          }
        }
        // finish reading out the last segment
        if (segmentIndex !== -1)
          output.push(segmented.slice(segmentIndex));
        return parentUrl.slice(0, parentUrl.length - pathname.length) + output.join('');
      }
    }

    /*
     * Import maps implementation
     *
     * To make lookups fast we pre-resolve the entire import map
     * and then match based on backtracked hash lookups
     *
     */

    function resolveUrl (relUrl, parentUrl) {
      return resolveIfNotPlainOrUrl(relUrl, parentUrl) || (relUrl.indexOf(':') !== -1 ? relUrl : resolveIfNotPlainOrUrl('./' + relUrl, parentUrl));
    }

    function objectAssign (to, from) {
      for (var p in from)
        to[p] = from[p];
      return to;
    }

    function resolveAndComposePackages (packages, outPackages, baseUrl, parentMap, parentUrl) {
      for (var p in packages) {
        var resolvedLhs = resolveIfNotPlainOrUrl(p, baseUrl) || p;
        var rhs = packages[p];
        // package fallbacks not currently supported
        if (typeof rhs !== 'string')
          continue;
        var mapped = resolveImportMap(parentMap, resolveIfNotPlainOrUrl(rhs, baseUrl) || rhs, parentUrl);
        if (!mapped) {
          if (process.env.SYSTEM_PRODUCTION)
            targetWarning('W1', p, rhs);
          else
            targetWarning('W1', p, rhs, 'bare specifier did not resolve');
        }
        else
          outPackages[resolvedLhs] = mapped;
      }
    }

    function resolveAndComposeImportMap (json, baseUrl, parentMap) {
      var outMap = { imports: objectAssign({}, parentMap.imports), scopes: objectAssign({}, parentMap.scopes) };

      if (json.imports)
        resolveAndComposePackages(json.imports, outMap.imports, baseUrl, parentMap, null);

      if (json.scopes)
        for (var s in json.scopes) {
          var resolvedScope = resolveUrl(s, baseUrl);
          resolveAndComposePackages(json.scopes[s], outMap.scopes[resolvedScope] || (outMap.scopes[resolvedScope] = {}), baseUrl, parentMap, resolvedScope);
        }

      return outMap;
    }

    function getMatch (path, matchObj) {
      if (matchObj[path])
        return path;
      var sepIndex = path.length;
      do {
        var segment = path.slice(0, sepIndex + 1);
        if (segment in matchObj)
          return segment;
      } while ((sepIndex = path.lastIndexOf('/', sepIndex - 1)) !== -1)
    }

    function applyPackages (id, packages) {
      var pkgName = getMatch(id, packages);
      if (pkgName) {
        var pkg = packages[pkgName];
        if (pkg === null) return;
        if (id.length > pkgName.length && pkg[pkg.length - 1] !== '/') {
          if (process.env.SYSTEM_PRODUCTION)
            targetWarning('W2', pkgName, pkg);
          else
            targetWarning('W2', pkgName, pkg, "should have a trailing '/'");
        }
        else
          return pkg + id.slice(pkgName.length);
      }
    }

    function targetWarning (code, match, target, msg) {
      console.warn(errMsg(code, process.env.SYSTEM_PRODUCTION ? [target, match].join(', ') : "Package target " + msg + ", resolving target '" + target + "' for " + match));
    }

    function resolveImportMap (importMap, resolvedOrPlain, parentUrl) {
      var scopes = importMap.scopes;
      var scopeUrl = parentUrl && getMatch(parentUrl, scopes);
      while (scopeUrl) {
        var packageResolution = applyPackages(resolvedOrPlain, scopes[scopeUrl]);
        if (packageResolution)
          return packageResolution;
        scopeUrl = getMatch(scopeUrl.slice(0, scopeUrl.lastIndexOf('/')), scopes);
      }
      return applyPackages(resolvedOrPlain, importMap.imports) || resolvedOrPlain.indexOf(':') !== -1 && resolvedOrPlain;
    }

    // CONCATENATED MODULE: ./src/system-core.js
    /*
     * SystemJS Core
     * 
     * Provides
     * - System.import
     * - System.register support for
     *     live bindings, function hoisting through circular references,
     *     reexports, dynamic import, import.meta.url, top-level await
     * - System.getRegister to get the registration
     * - Symbol.toStringTag support in Module objects
     * - Hookable System.createContext to customize import.meta
     * - System.onload(err, id, deps) handler for tracing / hot-reloading
     * 
     * Core comes with no System.prototype.resolve or
     * System.prototype.instantiate implementations
     */




    var toStringTag = hasSymbol && Symbol.toStringTag;
    var REGISTRY = hasSymbol ? Symbol() : '@';

    function SystemJS () {
      this[REGISTRY] = {};
    }

    var system_core_systemJSPrototype = SystemJS.prototype;

    system_core_systemJSPrototype.import = function (id, parentUrl) {
      var loader = this;
      return Promise.resolve(loader.prepareImport())
      .then(function() {
        return loader.resolve(id, parentUrl);
      })
      .then(function (id) {
        var load = getOrCreateLoad(loader, id);
        return load.C || topLevelLoad(loader, load);
      });
    };

    // Hookable createContext function -> allowing eg custom import meta
    system_core_systemJSPrototype.createContext = function (parentId) {
      return {
        url: parentId
      };
    };

    // onLoad(err, id, deps) provided for tracing / hot-reloading
    if (!process.env.SYSTEM_PRODUCTION)
      system_core_systemJSPrototype.onload = function () {};
    function loadToId (load) {
      return load.id;
    }
    function triggerOnload (loader, load, err) {
      loader.onload(err, load.id, load.d && load.d.map(loadToId));
      if (err)
        throw err;
    }

    var lastRegister;
    system_core_systemJSPrototype.register = function (deps, declare) {
      lastRegister = [deps, declare];
    };

    /*
     * getRegister provides the last anonymous System.register call
     */
    system_core_systemJSPrototype.getRegister = function () {
      var _lastRegister = lastRegister;
      lastRegister = undefined;
      return _lastRegister;
    };

    function getOrCreateLoad (loader, id, firstParentUrl) {
      var load = loader[REGISTRY][id];
      if (load)
        return load;

      var importerSetters = [];
      var ns = Object.create(null);
      if (toStringTag)
        Object.defineProperty(ns, toStringTag, { value: 'Module' });
      
      var instantiatePromise = Promise.resolve()
      .then(function () {
        return loader.instantiate(id, firstParentUrl);
      })
      .then(function (registration) {
        if (!registration)
          throw Error(errMsg(2, process.env.SYSTEM_PRODUCTION ? id : 'Module ' + id + ' did not instantiate'));
        function _export (name, value) {
          // note if we have hoisted exports (including reexports)
          load.h = true;
          var changed = false;
          if (typeof name !== 'object') {
            if (!(name in ns) || ns[name] !== value) {
              ns[name] = value;
              changed = true;
            }
          }
          else {
            for (var p in name) {
              var value = name[p];
              if (!(p in ns) || ns[p] !== value) {
                ns[p] = value;
                changed = true;
              }
            }

            if (name.__esModule) {
              ns.__esModule = name.__esModule;
            }
          }
          if (changed)
            for (var i = 0; i < importerSetters.length; i++)
              importerSetters[i](ns);
          return value;
        }
        var declared = registration[1](_export, registration[1].length === 2 ? {
          import: function (importId) {
            return loader.import(importId, id);
          },
          meta: loader.createContext(id)
        } : undefined);
        load.e = declared.execute || function () {};
        return [registration[0], declared.setters || []];
      });

      if (!process.env.SYSTEM_PRODUCTION)
        instantiatePromise = instantiatePromise.catch(function (err) {
          triggerOnload(loader, load, err);
        });

      var linkPromise = instantiatePromise
      .then(function (instantiation) {
        return Promise.all(instantiation[0].map(function (dep, i) {
          var setter = instantiation[1][i];
          return Promise.resolve(loader.resolve(dep, id))
          .then(function (depId) {
            var depLoad = getOrCreateLoad(loader, depId, id);
            // depLoad.I may be undefined for already-evaluated
            return Promise.resolve(depLoad.I)
            .then(function () {
              if (setter) {
                depLoad.i.push(setter);
                // only run early setters when there are hoisted exports of that module
                // the timing works here as pending hoisted export calls will trigger through importerSetters
                if (depLoad.h || !depLoad.I)
                  setter(depLoad.n);
              }
              return depLoad;
            });
          })
        }))
        .then(function (depLoads) {
          load.d = depLoads;
        });
      });

      linkPromise.catch(function (err) {
        load.e = null;
        load.er = err;
      });

      // Capital letter = a promise function
      return load = loader[REGISTRY][id] = {
        id: id,
        // importerSetters, the setters functions registered to this dependency
        // we retain this to add more later
        i: importerSetters,
        // module namespace object
        n: ns,

        // instantiate
        I: instantiatePromise,
        // link
        L: linkPromise,
        // whether it has hoisted exports
        h: false,

        // On instantiate completion we have populated:
        // dependency load records
        d: undefined,
        // execution function
        // set to NULL immediately after execution (or on any failure) to indicate execution has happened
        // in such a case, C should be used, and E, I, L will be emptied
        e: undefined,

        // On execution we have populated:
        // the execution error if any
        er: undefined,
        // in the case of TLA, the execution promise
        E: undefined,

        // On execution, L, I, E cleared

        // Promise for top-level completion
        C: undefined
      };
    }

    function instantiateAll (loader, load, loaded) {
      if (!loaded[load.id]) {
        loaded[load.id] = true;
        // load.L may be undefined for already-instantiated
        return Promise.resolve(load.L)
        .then(function () {
          return Promise.all(load.d.map(function (dep) {
            return instantiateAll(loader, dep, loaded);
          }));
        })
      }
    }

    function topLevelLoad (loader, load) {
      return load.C = instantiateAll(loader, load, {})
      .then(function () {
        return postOrderExec(loader, load, {});
      })
      .then(function () {
        return load.n;
      });
    }

    // the closest we can get to call(undefined)
    var nullContext = Object.freeze(Object.create(null));

    // returns a promise if and only if a top-level await subgraph
    // throws on sync errors
    function postOrderExec (loader, load, seen) {
      if (seen[load.id])
        return;
      seen[load.id] = true;

      if (!load.e) {
        if (load.er)
          throw load.er;
        if (load.E)
          return load.E;
        return;
      }

      // deps execute first, unless circular
      var depLoadPromises;
      load.d.forEach(function (depLoad) {
        if (!process.env.SYSTEM_PRODUCTION) {
          try {
            var depLoadPromise = postOrderExec(loader, depLoad, seen);
            if (depLoadPromise) {
              depLoadPromise.catch(function (err) {
                triggerOnload(loader, load, err);
              });
              (depLoadPromises = depLoadPromises || []).push(depLoadPromise);
            }
          }
          catch (err) {
            triggerOnload(loader, load, err);
          }
        }
        else {
          var depLoadPromise = postOrderExec(loader, depLoad, seen);
          if (depLoadPromise)
            (depLoadPromises = depLoadPromises || []).push(depLoadPromise);
        }
      });
      if (depLoadPromises)
        return Promise.all(depLoadPromises).then(doExec);

      return doExec();

      function doExec () {
        try {
          var execPromise = load.e.call(nullContext);
          if (execPromise) {
            if (!process.env.SYSTEM_PRODUCTION)
              execPromise = execPromise.then(function () {
                load.C = load.n;
                load.E = null; // indicates completion
                triggerOnload(loader, load, null);
              }, function (err) {
                triggerOnload(loader, load, err);
              });
            else
              execPromise = execPromise.then(function () {
                load.C = load.n;
                load.E = null;
              });
            return load.E = load.E || execPromise;
          }
          // (should be a promise, but a minify optimization to leave out Promise.resolve)
          load.C = load.n;
          if (!process.env.SYSTEM_PRODUCTION) triggerOnload(loader, load, null);
        }
        catch (err) {
          load.er = err;
          if (!process.env.SYSTEM_PRODUCTION) triggerOnload(loader, load, err);
          else throw err;
        }
        finally {
          load.L = load.I = undefined;
          load.e = null;
        }
      }
    }

    envGlobal.System = new SystemJS();

    // CONCATENATED MODULE: ./src/features/import-map.js
    /*
     * Import map support for SystemJS
     * 
     * <script type="systemjs-importmap">{}</script>
     * OR
     * <script type="systemjs-importmap" src=package.json></script>
     * 
     * Only those import maps available at the time of SystemJS initialization will be loaded
     * and they will be loaded in DOM order.
     * 
     * There is no support for dynamic import maps injection currently.
     */






    var IMPORT_MAP = hasSymbol ? Symbol() : '#';
    var IMPORT_MAP_PROMISE = hasSymbol ? Symbol() : '$';

    iterateDocumentImportMaps(function (script) {
      script._t = fetch(script.src).then(function (res) {
        return res.text();
      });
    }, '[src]');

    system_core_systemJSPrototype.prepareImport = function () {
      var loader = this;
      if (!loader[IMPORT_MAP_PROMISE]) {
        loader[IMPORT_MAP] = { imports: {}, scopes: {} };
        loader[IMPORT_MAP_PROMISE] = Promise.resolve();
        iterateDocumentImportMaps(function (script) {
          loader[IMPORT_MAP_PROMISE] = loader[IMPORT_MAP_PROMISE].then(function () {
            return (script._t || script.src && fetch(script.src).then(function (res) { return res.text(); }) || Promise.resolve(script.innerHTML))
            .then(function (text) {
              try {
                return JSON.parse(text);
              } catch (err) {
                throw Error(process.env.SYSTEM_PRODUCTION ? errMsg(1) : errMsg(1, "systemjs-importmap contains invalid JSON"));
              }
            })
            .then(function (newMap) {
              loader[IMPORT_MAP] = resolveAndComposeImportMap(newMap, script.src || baseUrl, loader[IMPORT_MAP]);
            });
          });
        }, '');
      }
      return loader[IMPORT_MAP_PROMISE];
    };

    system_core_systemJSPrototype.resolve = function (id, parentUrl) {
      parentUrl = parentUrl || !process.env.SYSTEM_BROWSER && this[BASE_URL] || baseUrl;
      return resolveImportMap(this[IMPORT_MAP], resolveIfNotPlainOrUrl(id, parentUrl) || id, parentUrl) || throwUnresolved(id, parentUrl);
    };

    function throwUnresolved (id, parentUrl) {
      throw Error(errMsg(8, process.env.SYSTEM_PRODUCTION ? [id, parentUrl].join(', ') : "Unable to resolve bare specifier '" + id + (parentUrl ? "' from " + parentUrl : "'")));
    }

    function iterateDocumentImportMaps(cb, extraSelector) {
      if (hasDocument)
        [].forEach.call(document.querySelectorAll('script[type="systemjs-importmap"]' + extraSelector), cb);
    }

    // CONCATENATED MODULE: ./src/features/registry.js




    var registry_toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;

    system_core_systemJSPrototype.get = function (id) {
      var load = this[REGISTRY][id];
      if (load && load.e === null && !load.E) {
        if (load.er)
          return null;
        return load.n;
      }
    };

    system_core_systemJSPrototype.set = function (id, module) {
      if (!process.env.SYSTEM_PRODUCTION) {
        try {
          // No page-relative URLs allowed
          new URL(id);
        } catch (err) {
          console.warn(Error(errMsg('W3', '"' + id + '" is not a valid URL to set in the module registry')));
        }
      }
      var ns;
      if (registry_toStringTag && module[registry_toStringTag] === 'Module') {
        ns = module;
      }
      else {
        ns = Object.assign(Object.create(null), module);
        if (registry_toStringTag)
          Object.defineProperty(ns, registry_toStringTag, { value: 'Module' });
      }

      var done = Promise.resolve(ns);

      var load = this[REGISTRY][id] || (this[REGISTRY][id] = {
        id: id,
        i: [],
        h: false,
        d: [],
        e: null,
        er: undefined,
        E: undefined
      });

      if (load.e || load.E)
        return false;
      
      Object.assign(load, {
        n: ns,
        I: undefined,
        L: undefined,
        C: done
      });
      return ns;
    };

    system_core_systemJSPrototype.has = function (id) {
      var load = this[REGISTRY][id];
      return !!load;
    };

    // Delete function provided for hot-reloading use cases
    system_core_systemJSPrototype.delete = function (id) {
      var registry = this[REGISTRY];
      var load = registry[id];
      // in future we can support load.E case by failing load first
      // but that will require TLA callbacks to be implemented
      if (!load || load.e !== null || load.E)
        return false;

      var importerSetters = load.i;
      // remove from importerSetters
      // (release for gc)
      if (load.d)
        load.d.forEach(function (depLoad) {
          var importerIndex = depLoad.i.indexOf(load);
          if (importerIndex !== -1)
            depLoad.i.splice(importerIndex, 1);
        });
      delete registry[id];
      return function () {
        var load = registry[id];
        if (!load || !importerSetters || load.e !== null || load.E)
          return false;
        // add back the old setters
        importerSetters.forEach(function (setter) {
          load.i.push(setter);
          setter(load.n);
        });
        importerSetters = null;
      };
    };

    var iterator = typeof Symbol !== 'undefined' && Symbol.iterator;

    system_core_systemJSPrototype.entries = function () {
      var loader = this, keys = Object.keys(loader[REGISTRY]);
      var index = 0, ns, key;
      var result = {
        next: function () {
          while (
            (key = keys[index++]) !== undefined && 
            (ns = loader.get(key)) === undefined
          );
          return {
            done: key === undefined,
            value: key !== undefined && [key, ns]
          };
        }
      };

      result[iterator] = function() { return this };

      return result;
    };

    // EXTERNAL MODULE: ./src/extras/global.js
    var extras_global = __webpack_require__(821);

    // CONCATENATED MODULE: ./src/extras/module-types.js


    /*
     * Loads JSON, CSS, Wasm module types based on file extensions
     * Supports application/javascript falling back to JS eval
     */
    (function(global) {
      var systemJSPrototype = global.System.constructor.prototype;
      var instantiate = systemJSPrototype.instantiate;

      var moduleTypesRegEx = /\.(css|html|json|wasm)$/;
      systemJSPrototype.shouldFetch = function (url) {
        var path = url.split('?')[0].split('#')[0];
        var ext = path.slice(path.lastIndexOf('.'));
        return ext.match(moduleTypesRegEx);
      };
      systemJSPrototype.fetch = function (url) {
        return fetch(url);
      };

      systemJSPrototype.instantiate = function (url, parent) {
        var loader = this;
        if (this.shouldFetch(url)) {
          return this.fetch(url)
          .then(function (res) {
            if (!res.ok)
              throw Error(errMsg(7, process.env.SYSTEM_PRODUCTION ? [res.status, res.statusText, url, parent].join(', ') : res.status + ' ' + res.statusText + ', loading ' + url + (parent ? ' from ' + parent : '')));
            var contentType = res.headers.get('content-type');
            if (contentType.match(/^(text|application)\/(x-)?javascript(;|$)/)) {
              return res.text().then(function (source) {
                (0, eval)(source);
                return loader.getRegister();
              });
            }
            else if (contentType.match(/^application\/json(;|$)/)) {
              return res.text().then(function (source) {
                return [[], function (_export) {
                  return {
                    execute: function () {
                      _export('default', JSON.parse(source));
                    }
                  };
                }];
              });
            }
            else if (contentType.match(/^text\/css(;|$)/)) {
              return res.text().then(function (source) {
                return [[], function (_export) {
                  return {
                    execute: function () {
                      // Relies on a Constructable Stylesheet polyfill
                      var stylesheet = new CSSStyleSheet();
                      stylesheet.replaceSync(source);
                      _export('default', stylesheet);
                    }
                  };
                }];
              }); 
            }
            else if (contentType.match(/^application\/wasm(;|$)/)) {
              return (WebAssembly.compileStreaming ? WebAssembly.compileStreaming(res) : res.arrayBuffer().then(WebAssembly.compile))
              .then(function (module) {
                var deps = [];
                var setters = [];
                var importObj = {};
            
                // we can only set imports if supported (eg early Safari doesnt support)
                if (WebAssembly.Module.imports)
                  WebAssembly.Module.imports(module).forEach(function (impt) {
                    var key = impt.module;
                    if (deps.indexOf(key) === -1) {
                      deps.push(key);
                      setters.push(function (m) {
                        importObj[key] = m;
                      });
                    }
                  });
            
                return [deps, function (_export) {
                  return {
                    setters: setters,
                    execute: function () {
                      return WebAssembly.instantiate(module, importObj)
                      .then(function (instance) {
                        _export(instance.exports);
                      });
                    }
                  };
                }];
              });
            }
            else {
              throw Error(errMsg(4, process.env.SYSTEM_PRODUCTION ? contentType : 'Unknown module type "' + contentType + '"'));
            }
          });
        }
        return instantiate.apply(this, arguments);
      };
    })(typeof self !== 'undefined' ? self : global);

    // EXTERNAL MODULE: ./node_modules/source-map-support/source-map-support.js
    var source_map_support = __webpack_require__(662);
    var source_map_support_default = /*#__PURE__*/__webpack_require__.n(source_map_support);

    // EXTERNAL MODULE: ./node_modules/node-fetch/lib/index.js
    var lib = __webpack_require__(724);
    var lib_default = /*#__PURE__*/__webpack_require__.n(lib);

    // EXTERNAL MODULE: external "fs"
    var external_fs_ = __webpack_require__(747);

    // EXTERNAL MODULE: external "url"
    var external_url_ = __webpack_require__(835);

    // CONCATENATED MODULE: ./src/features/node-fetch.js





    source_map_support_default().install();

    global.System.constructor.prototype.shouldFetch = () => true;
    global.System.constructor.prototype.fetch = async url => {
      if (url.startsWith('file:')) {
        try {
          const source = await Object(external_fs_.promises.readFile)(Object(external_url_.fileURLToPath)(url.toString()));
          return {
            ok: true,
            status: 200,
            headers: {
              get(headerName) {
                if (headerName === 'content-type') {
                  return 'application/javascript';
                } else {
                  throw Error(`NodeJS fetch emulation doesn't support ${headerName} header`);
                }
              }
            },
            async text () {
              return source.toString();
            },
            async json () {
              return JSON.parse(source.toString());
            }
          };
        }
        catch (e) {
          if (e.code === 'ENOENT')
            return { status: 404, statusText: e.toString() };
          else
            return { status: 500, statusText: e.toString() };
        }
      } else {
        return lib_default()(url);
      }
    };
    // CONCATENATED MODULE: ./src/system-node.js
    /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "System", function() { return System; });
    /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "applyImportMap", function() { return applyImportMap; });
    /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setBaseUrl", function() { return setBaseUrl; });








    const System = global.System;

    const originalResolve = system_core_systemJSPrototype.resolve;
    system_core_systemJSPrototype.resolve = function () {
      if (!this[IMPORT_MAP]) {
        // Allow for basic URL resolution before applyImportMap is called
        this[IMPORT_MAP] = { imports: {}, scopes: {} };
      }
      return originalResolve.apply(this, arguments);
    };

    function applyImportMap(loader, newMap, mapBase) {
      ensureValidSystemLoader(loader);
      loader[IMPORT_MAP] = resolveAndComposeImportMap(newMap, mapBase || baseUrl, loader[IMPORT_MAP] || { imports: {}, scopes: {} });
      loader[IMPORT_MAP_PROMISE] = Promise.resolve();
    }

    function setBaseUrl(loader, url) {
      ensureValidSystemLoader(loader);
      loader[BASE_URL] = new URL(url).href;
    }

    function ensureValidSystemLoader (loader) {
      if (!loader[REGISTRY])
        throw new Error('A valid SystemJS instance must be provided');
    }


    /***/ }),

    /***/ 605:
    /***/ (function(module) {

    module.exports = require("http");

    /***/ }),

    /***/ 622:
    /***/ (function(module) {

    module.exports = require("path");

    /***/ }),

    /***/ 662:
    /***/ (function(__unusedmodule, exports, __webpack_require__) {

    var SourceMapConsumer = __webpack_require__(94).SourceMapConsumer;
    var path = __webpack_require__(622);

    var fs;
    try {
      fs = __webpack_require__(747);
      if (!fs.existsSync || !fs.readFileSync) {
        // fs doesn't have all methods we need
        fs = null;
      }
    } catch (err) {
      /* nop */
    }

    var bufferFrom = __webpack_require__(501);

    // Only install once if called multiple times
    var errorFormatterInstalled = false;
    var uncaughtShimInstalled = false;

    // If true, the caches are reset before a stack trace formatting operation
    var emptyCacheBetweenOperations = false;

    // Supports {browser, node, auto}
    var environment = "auto";

    // Maps a file path to a string containing the file contents
    var fileContentsCache = {};

    // Maps a file path to a source map for that file
    var sourceMapCache = {};

    // Regex for detecting source maps
    var reSourceMap = /^data:application\/json[^,]+base64,/;

    // Priority list of retrieve handlers
    var retrieveFileHandlers = [];
    var retrieveMapHandlers = [];

    function isInBrowser() {
      if (environment === "browser")
        return true;
      if (environment === "node")
        return false;
      return ((typeof window !== 'undefined') && (typeof XMLHttpRequest === 'function') && !(window.require && window.module && window.process && window.process.type === "renderer"));
    }

    function hasGlobalProcessEventEmitter() {
      return ((typeof process === 'object') && (process !== null) && (typeof process.on === 'function'));
    }

    function handlerExec(list) {
      return function(arg) {
        for (var i = 0; i < list.length; i++) {
          var ret = list[i](arg);
          if (ret) {
            return ret;
          }
        }
        return null;
      };
    }

    var retrieveFile = handlerExec(retrieveFileHandlers);

    retrieveFileHandlers.push(function(path) {
      // Trim the path to make sure there is no extra whitespace.
      path = path.trim();
      if (/^file:/.test(path)) {
        // existsSync/readFileSync can't handle file protocol, but once stripped, it works
        path = path.replace(/file:\/\/\/(\w:)?/, function(protocol, drive) {
          return drive ?
            '' : // file:///C:/dir/file -> C:/dir/file
            '/'; // file:///root-dir/file -> /root-dir/file
        });
      }
      if (path in fileContentsCache) {
        return fileContentsCache[path];
      }

      var contents = '';
      try {
        if (!fs) {
          // Use SJAX if we are in the browser
          var xhr = new XMLHttpRequest();
          xhr.open('GET', path, /** async */ false);
          xhr.send(null);
          if (xhr.readyState === 4 && xhr.status === 200) {
            contents = xhr.responseText;
          }
        } else if (fs.existsSync(path)) {
          // Otherwise, use the filesystem
          contents = fs.readFileSync(path, 'utf8');
        }
      } catch (er) {
        /* ignore any errors */
      }

      return fileContentsCache[path] = contents;
    });

    // Support URLs relative to a directory, but be careful about a protocol prefix
    // in case we are in the browser (i.e. directories may start with "http://" or "file:///")
    function supportRelativeURL(file, url) {
      if (!file) return url;
      var dir = path.dirname(file);
      var match = /^\w+:\/\/[^\/]*/.exec(dir);
      var protocol = match ? match[0] : '';
      var startPath = dir.slice(protocol.length);
      if (protocol && /^\/\w\:/.test(startPath)) {
        // handle file:///C:/ paths
        protocol += '/';
        return protocol + path.resolve(dir.slice(protocol.length), url).replace(/\\/g, '/');
      }
      return protocol + path.resolve(dir.slice(protocol.length), url);
    }

    function retrieveSourceMapURL(source) {
      var fileData;

      if (isInBrowser()) {
         try {
           var xhr = new XMLHttpRequest();
           xhr.open('GET', source, false);
           xhr.send(null);
           fileData = xhr.readyState === 4 ? xhr.responseText : null;

           // Support providing a sourceMappingURL via the SourceMap header
           var sourceMapHeader = xhr.getResponseHeader("SourceMap") ||
                                 xhr.getResponseHeader("X-SourceMap");
           if (sourceMapHeader) {
             return sourceMapHeader;
           }
         } catch (e) {
         }
      }

      // Get the URL of the source map
      fileData = retrieveFile(source);
      var re = /(?:\/\/[@#][\s]*sourceMappingURL=([^\s'"]+)[\s]*$)|(?:\/\*[@#][\s]*sourceMappingURL=([^\s*'"]+)[\s]*(?:\*\/)[\s]*$)/mg;
      // Keep executing the search to find the *last* sourceMappingURL to avoid
      // picking up sourceMappingURLs from comments, strings, etc.
      var lastMatch, match;
      while (match = re.exec(fileData)) lastMatch = match;
      if (!lastMatch) return null;
      return lastMatch[1];
    }
    // Can be overridden by the retrieveSourceMap option to install. Takes a
    // generated source filename; returns a {map, optional url} object, or null if
    // there is no source map.  The map field may be either a string or the parsed
    // JSON object (ie, it must be a valid argument to the SourceMapConsumer
    // constructor).
    var retrieveSourceMap = handlerExec(retrieveMapHandlers);
    retrieveMapHandlers.push(function(source) {
      var sourceMappingURL = retrieveSourceMapURL(source);
      if (!sourceMappingURL) return null;

      // Read the contents of the source map
      var sourceMapData;
      if (reSourceMap.test(sourceMappingURL)) {
        // Support source map URL as a data url
        var rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(',') + 1);
        sourceMapData = bufferFrom(rawData, "base64").toString();
        sourceMappingURL = source;
      } else {
        // Support source map URLs relative to the source URL
        sourceMappingURL = supportRelativeURL(source, sourceMappingURL);
        sourceMapData = retrieveFile(sourceMappingURL);
      }

      if (!sourceMapData) {
        return null;
      }

      return {
        url: sourceMappingURL,
        map: sourceMapData
      };
    });

    function mapSourcePosition(position) {
      var sourceMap = sourceMapCache[position.source];
      if (!sourceMap) {
        // Call the (overrideable) retrieveSourceMap function to get the source map.
        var urlAndMap = retrieveSourceMap(position.source);
        if (urlAndMap) {
          sourceMap = sourceMapCache[position.source] = {
            url: urlAndMap.url,
            map: new SourceMapConsumer(urlAndMap.map)
          };

          // Load all sources stored inline with the source map into the file cache
          // to pretend like they are already loaded. They may not exist on disk.
          if (sourceMap.map.sourcesContent) {
            sourceMap.map.sources.forEach(function(source, i) {
              var contents = sourceMap.map.sourcesContent[i];
              if (contents) {
                var url = supportRelativeURL(sourceMap.url, source);
                fileContentsCache[url] = contents;
              }
            });
          }
        } else {
          sourceMap = sourceMapCache[position.source] = {
            url: null,
            map: null
          };
        }
      }

      // Resolve the source URL relative to the URL of the source map
      if (sourceMap && sourceMap.map && typeof sourceMap.map.originalPositionFor === 'function') {
        var originalPosition = sourceMap.map.originalPositionFor(position);

        // Only return the original position if a matching line was found. If no
        // matching line is found then we return position instead, which will cause
        // the stack trace to print the path and line for the compiled file. It is
        // better to give a precise location in the compiled file than a vague
        // location in the original file.
        if (originalPosition.source !== null) {
          originalPosition.source = supportRelativeURL(
            sourceMap.url, originalPosition.source);
          return originalPosition;
        }
      }

      return position;
    }

    // Parses code generated by FormatEvalOrigin(), a function inside V8:
    // https://code.google.com/p/v8/source/browse/trunk/src/messages.js
    function mapEvalOrigin(origin) {
      // Most eval() calls are in this format
      var match = /^eval at ([^(]+) \((.+):(\d+):(\d+)\)$/.exec(origin);
      if (match) {
        var position = mapSourcePosition({
          source: match[2],
          line: +match[3],
          column: match[4] - 1
        });
        return 'eval at ' + match[1] + ' (' + position.source + ':' +
          position.line + ':' + (position.column + 1) + ')';
      }

      // Parse nested eval() calls using recursion
      match = /^eval at ([^(]+) \((.+)\)$/.exec(origin);
      if (match) {
        return 'eval at ' + match[1] + ' (' + mapEvalOrigin(match[2]) + ')';
      }

      // Make sure we still return useful information if we didn't find anything
      return origin;
    }

    // This is copied almost verbatim from the V8 source code at
    // https://code.google.com/p/v8/source/browse/trunk/src/messages.js. The
    // implementation of wrapCallSite() used to just forward to the actual source
    // code of CallSite.prototype.toString but unfortunately a new release of V8
    // did something to the prototype chain and broke the shim. The only fix I
    // could find was copy/paste.
    function CallSiteToString() {
      var fileName;
      var fileLocation = "";
      if (this.isNative()) {
        fileLocation = "native";
      } else {
        fileName = this.getScriptNameOrSourceURL();
        if (!fileName && this.isEval()) {
          fileLocation = this.getEvalOrigin();
          fileLocation += ", ";  // Expecting source position to follow.
        }

        if (fileName) {
          fileLocation += fileName;
        } else {
          // Source code does not originate from a file and is not native, but we
          // can still get the source position inside the source string, e.g. in
          // an eval string.
          fileLocation += "<anonymous>";
        }
        var lineNumber = this.getLineNumber();
        if (lineNumber != null) {
          fileLocation += ":" + lineNumber;
          var columnNumber = this.getColumnNumber();
          if (columnNumber) {
            fileLocation += ":" + columnNumber;
          }
        }
      }

      var line = "";
      var functionName = this.getFunctionName();
      var addSuffix = true;
      var isConstructor = this.isConstructor();
      var isMethodCall = !(this.isToplevel() || isConstructor);
      if (isMethodCall) {
        var typeName = this.getTypeName();
        // Fixes shim to be backward compatable with Node v0 to v4
        if (typeName === "[object Object]") {
          typeName = "null";
        }
        var methodName = this.getMethodName();
        if (functionName) {
          if (typeName && functionName.indexOf(typeName) != 0) {
            line += typeName + ".";
          }
          line += functionName;
          if (methodName && functionName.indexOf("." + methodName) != functionName.length - methodName.length - 1) {
            line += " [as " + methodName + "]";
          }
        } else {
          line += typeName + "." + (methodName || "<anonymous>");
        }
      } else if (isConstructor) {
        line += "new " + (functionName || "<anonymous>");
      } else if (functionName) {
        line += functionName;
      } else {
        line += fileLocation;
        addSuffix = false;
      }
      if (addSuffix) {
        line += " (" + fileLocation + ")";
      }
      return line;
    }

    function cloneCallSite(frame) {
      var object = {};
      Object.getOwnPropertyNames(Object.getPrototypeOf(frame)).forEach(function(name) {
        object[name] = /^(?:is|get)/.test(name) ? function() { return frame[name].call(frame); } : frame[name];
      });
      object.toString = CallSiteToString;
      return object;
    }

    function wrapCallSite(frame, state) {
      // provides interface backward compatibility
      if (state === undefined) {
        state = { nextPosition: null, curPosition: null };
      }
      if(frame.isNative()) {
        state.curPosition = null;
        return frame;
      }

      // Most call sites will return the source file from getFileName(), but code
      // passed to eval() ending in "//# sourceURL=..." will return the source file
      // from getScriptNameOrSourceURL() instead
      var source = frame.getFileName() || frame.getScriptNameOrSourceURL();
      if (source) {
        var line = frame.getLineNumber();
        var column = frame.getColumnNumber() - 1;

        // Fix position in Node where some (internal) code is prepended.
        // See https://github.com/evanw/node-source-map-support/issues/36
        // Header removed in node at ^10.16 || >=11.11.0
        // v11 is not an LTS candidate, we can just test the one version with it.
        // Test node versions for: 10.16-19, 10.20+, 12-19, 20-99, 100+, or 11.11
        var noHeader = /^v(10\.1[6-9]|10\.[2-9][0-9]|10\.[0-9]{3,}|1[2-9]\d*|[2-9]\d|\d{3,}|11\.11)/;
        var headerLength = noHeader.test(process.version) ? 0 : 62;
        if (line === 1 && column > headerLength && !isInBrowser() && !frame.isEval()) {
          column -= headerLength;
        }

        var position = mapSourcePosition({
          source: source,
          line: line,
          column: column
        });
        state.curPosition = position;
        frame = cloneCallSite(frame);
        var originalFunctionName = frame.getFunctionName;
        frame.getFunctionName = function() {
          if (state.nextPosition == null) {
            return originalFunctionName();
          }
          return state.nextPosition.name || originalFunctionName();
        };
        frame.getFileName = function() { return position.source; };
        frame.getLineNumber = function() { return position.line; };
        frame.getColumnNumber = function() { return position.column + 1; };
        frame.getScriptNameOrSourceURL = function() { return position.source; };
        return frame;
      }

      // Code called using eval() needs special handling
      var origin = frame.isEval() && frame.getEvalOrigin();
      if (origin) {
        origin = mapEvalOrigin(origin);
        frame = cloneCallSite(frame);
        frame.getEvalOrigin = function() { return origin; };
        return frame;
      }

      // If we get here then we were unable to change the source position
      return frame;
    }

    // This function is part of the V8 stack trace API, for more info see:
    // https://v8.dev/docs/stack-trace-api
    function prepareStackTrace(error, stack) {
      if (emptyCacheBetweenOperations) {
        fileContentsCache = {};
        sourceMapCache = {};
      }

      var name = error.name || 'Error';
      var message = error.message || '';
      var errorString = name + ": " + message;

      var state = { nextPosition: null, curPosition: null };
      var processedStack = [];
      for (var i = stack.length - 1; i >= 0; i--) {
        processedStack.push('\n    at ' + wrapCallSite(stack[i], state));
        state.nextPosition = state.curPosition;
      }
      state.curPosition = state.nextPosition = null;
      return errorString + processedStack.reverse().join('');
    }

    // Generate position and snippet of original source with pointer
    function getErrorSource(error) {
      var match = /\n    at [^(]+ \((.*):(\d+):(\d+)\)/.exec(error.stack);
      if (match) {
        var source = match[1];
        var line = +match[2];
        var column = +match[3];

        // Support the inline sourceContents inside the source map
        var contents = fileContentsCache[source];

        // Support files on disk
        if (!contents && fs && fs.existsSync(source)) {
          try {
            contents = fs.readFileSync(source, 'utf8');
          } catch (er) {
            contents = '';
          }
        }

        // Format the line from the original source code like node does
        if (contents) {
          var code = contents.split(/(?:\r\n|\r|\n)/)[line - 1];
          if (code) {
            return source + ':' + line + '\n' + code + '\n' +
              new Array(column).join(' ') + '^';
          }
        }
      }
      return null;
    }

    function printErrorAndExit (error) {
      var source = getErrorSource(error);

      // Ensure error is printed synchronously and not truncated
      if (process.stderr._handle && process.stderr._handle.setBlocking) {
        process.stderr._handle.setBlocking(true);
      }

      if (source) {
        console.error();
        console.error(source);
      }

      console.error(error.stack);
      process.exit(1);
    }

    function shimEmitUncaughtException () {
      var origEmit = process.emit;

      process.emit = function (type) {
        if (type === 'uncaughtException') {
          var hasStack = (arguments[1] && arguments[1].stack);
          var hasListeners = (this.listeners(type).length > 0);

          if (hasStack && !hasListeners) {
            return printErrorAndExit(arguments[1]);
          }
        }

        return origEmit.apply(this, arguments);
      };
    }

    var originalRetrieveFileHandlers = retrieveFileHandlers.slice(0);
    var originalRetrieveMapHandlers = retrieveMapHandlers.slice(0);

    exports.wrapCallSite = wrapCallSite;
    exports.getErrorSource = getErrorSource;
    exports.mapSourcePosition = mapSourcePosition;
    exports.retrieveSourceMap = retrieveSourceMap;

    exports.install = function(options) {
      options = options || {};

      if (options.environment) {
        environment = options.environment;
        if (["node", "browser", "auto"].indexOf(environment) === -1) {
          throw new Error("environment " + environment + " was unknown. Available options are {auto, browser, node}")
        }
      }

      // Allow sources to be found by methods other than reading the files
      // directly from disk.
      if (options.retrieveFile) {
        if (options.overrideRetrieveFile) {
          retrieveFileHandlers.length = 0;
        }

        retrieveFileHandlers.unshift(options.retrieveFile);
      }

      // Allow source maps to be found by methods other than reading the files
      // directly from disk.
      if (options.retrieveSourceMap) {
        if (options.overrideRetrieveSourceMap) {
          retrieveMapHandlers.length = 0;
        }

        retrieveMapHandlers.unshift(options.retrieveSourceMap);
      }

      // Support runtime transpilers that include inline source maps
      if (options.hookRequire && !isInBrowser()) {
        var Module;
        try {
          Module = __webpack_require__(282);
        } catch (err) {
          // NOP: Loading in catch block to convert webpack error to warning.
        }
        var $compile = Module.prototype._compile;

        if (!$compile.__sourceMapSupport) {
          Module.prototype._compile = function(content, filename) {
            fileContentsCache[filename] = content;
            sourceMapCache[filename] = undefined;
            return $compile.call(this, content, filename);
          };

          Module.prototype._compile.__sourceMapSupport = true;
        }
      }

      // Configure options
      if (!emptyCacheBetweenOperations) {
        emptyCacheBetweenOperations = 'emptyCacheBetweenOperations' in options ?
          options.emptyCacheBetweenOperations : false;
      }

      // Install the error reformatter
      if (!errorFormatterInstalled) {
        errorFormatterInstalled = true;
        Error.prepareStackTrace = prepareStackTrace;
      }

      if (!uncaughtShimInstalled) {
        var installHandler = 'handleUncaughtExceptions' in options ?
          options.handleUncaughtExceptions : true;

        // Provide the option to not install the uncaught exception handler. This is
        // to support other uncaught exception handlers (in test frameworks, for
        // example). If this handler is not installed and there are no other uncaught
        // exception handlers, uncaught exceptions will be caught by node's built-in
        // exception handler and the process will still be terminated. However, the
        // generated JavaScript code will be shown above the stack trace instead of
        // the original source code.
        if (installHandler && hasGlobalProcessEventEmitter()) {
          uncaughtShimInstalled = true;
          shimEmitUncaughtException();
        }
      }
    };

    exports.resetRetrieveHandlers = function() {
      retrieveFileHandlers.length = 0;
      retrieveMapHandlers.length = 0;

      retrieveFileHandlers = originalRetrieveFileHandlers.slice(0);
      retrieveMapHandlers = originalRetrieveMapHandlers.slice(0);

      retrieveSourceMap = handlerExec(retrieveMapHandlers);
      retrieveFile = handlerExec(retrieveFileHandlers);
    };


    /***/ }),

    /***/ 724:
    /***/ (function(module, exports, __webpack_require__) {


    Object.defineProperty(exports, '__esModule', { value: true });

    function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

    var Stream = _interopDefault(__webpack_require__(413));
    var http = _interopDefault(__webpack_require__(605));
    var Url = _interopDefault(__webpack_require__(835));
    var https = _interopDefault(__webpack_require__(211));
    var zlib = _interopDefault(__webpack_require__(761));

    // Based on https://github.com/tmpvar/jsdom/blob/aa85b2abf07766ff7bf5c1f6daafb3726f2f2db5/lib/jsdom/living/blob.js

    // fix for "Readable" isn't a named export issue
    const Readable = Stream.Readable;

    const BUFFER = Symbol('buffer');
    const TYPE = Symbol('type');

    class Blob {
    	constructor() {
    		this[TYPE] = '';

    		const blobParts = arguments[0];
    		const options = arguments[1];

    		const buffers = [];
    		let size = 0;

    		if (blobParts) {
    			const a = blobParts;
    			const length = Number(a.length);
    			for (let i = 0; i < length; i++) {
    				const element = a[i];
    				let buffer;
    				if (element instanceof Buffer) {
    					buffer = element;
    				} else if (ArrayBuffer.isView(element)) {
    					buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
    				} else if (element instanceof ArrayBuffer) {
    					buffer = Buffer.from(element);
    				} else if (element instanceof Blob) {
    					buffer = element[BUFFER];
    				} else {
    					buffer = Buffer.from(typeof element === 'string' ? element : String(element));
    				}
    				size += buffer.length;
    				buffers.push(buffer);
    			}
    		}

    		this[BUFFER] = Buffer.concat(buffers);

    		let type = options && options.type !== undefined && String(options.type).toLowerCase();
    		if (type && !/[^\u0020-\u007E]/.test(type)) {
    			this[TYPE] = type;
    		}
    	}
    	get size() {
    		return this[BUFFER].length;
    	}
    	get type() {
    		return this[TYPE];
    	}
    	text() {
    		return Promise.resolve(this[BUFFER].toString());
    	}
    	arrayBuffer() {
    		const buf = this[BUFFER];
    		const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    		return Promise.resolve(ab);
    	}
    	stream() {
    		const readable = new Readable();
    		readable._read = function () {};
    		readable.push(this[BUFFER]);
    		readable.push(null);
    		return readable;
    	}
    	toString() {
    		return '[object Blob]';
    	}
    	slice() {
    		const size = this.size;

    		const start = arguments[0];
    		const end = arguments[1];
    		let relativeStart, relativeEnd;
    		if (start === undefined) {
    			relativeStart = 0;
    		} else if (start < 0) {
    			relativeStart = Math.max(size + start, 0);
    		} else {
    			relativeStart = Math.min(start, size);
    		}
    		if (end === undefined) {
    			relativeEnd = size;
    		} else if (end < 0) {
    			relativeEnd = Math.max(size + end, 0);
    		} else {
    			relativeEnd = Math.min(end, size);
    		}
    		const span = Math.max(relativeEnd - relativeStart, 0);

    		const buffer = this[BUFFER];
    		const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
    		const blob = new Blob([], { type: arguments[2] });
    		blob[BUFFER] = slicedBuffer;
    		return blob;
    	}
    }

    Object.defineProperties(Blob.prototype, {
    	size: { enumerable: true },
    	type: { enumerable: true },
    	slice: { enumerable: true }
    });

    Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
    	value: 'Blob',
    	writable: false,
    	enumerable: false,
    	configurable: true
    });

    /**
     * fetch-error.js
     *
     * FetchError interface for operational errors
     */

    /**
     * Create FetchError instance
     *
     * @param   String      message      Error message for human
     * @param   String      type         Error type for machine
     * @param   String      systemError  For Node.js system error
     * @return  FetchError
     */
    function FetchError(message, type, systemError) {
      Error.call(this, message);

      this.message = message;
      this.type = type;

      // when err.type is `system`, err.code contains system error code
      if (systemError) {
        this.code = this.errno = systemError.code;
      }

      // hide custom error implementation details from end-users
      Error.captureStackTrace(this, this.constructor);
    }

    FetchError.prototype = Object.create(Error.prototype);
    FetchError.prototype.constructor = FetchError;
    FetchError.prototype.name = 'FetchError';

    let convert;
    try {
    	convert = __webpack_require__(18).convert;
    } catch (e) {}

    const INTERNALS = Symbol('Body internals');

    // fix an issue where "PassThrough" isn't a named export for node <10
    const PassThrough = Stream.PassThrough;

    /**
     * Body mixin
     *
     * Ref: https://fetch.spec.whatwg.org/#body
     *
     * @param   Stream  body  Readable stream
     * @param   Object  opts  Response options
     * @return  Void
     */
    function Body(body) {
    	var _this = this;

    	var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
    	    _ref$size = _ref.size;

    	let size = _ref$size === undefined ? 0 : _ref$size;
    	var _ref$timeout = _ref.timeout;
    	let timeout = _ref$timeout === undefined ? 0 : _ref$timeout;

    	if (body == null) {
    		// body is undefined or null
    		body = null;
    	} else if (isURLSearchParams(body)) {
    		// body is a URLSearchParams
    		body = Buffer.from(body.toString());
    	} else if (isBlob(body)) ; else if (Buffer.isBuffer(body)) ; else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
    		// body is ArrayBuffer
    		body = Buffer.from(body);
    	} else if (ArrayBuffer.isView(body)) {
    		// body is ArrayBufferView
    		body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    	} else if (body instanceof Stream) ; else {
    		// none of the above
    		// coerce to string then buffer
    		body = Buffer.from(String(body));
    	}
    	this[INTERNALS] = {
    		body,
    		disturbed: false,
    		error: null
    	};
    	this.size = size;
    	this.timeout = timeout;

    	if (body instanceof Stream) {
    		body.on('error', function (err) {
    			const error = err.name === 'AbortError' ? err : new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, 'system', err);
    			_this[INTERNALS].error = error;
    		});
    	}
    }

    Body.prototype = {
    	get body() {
    		return this[INTERNALS].body;
    	},

    	get bodyUsed() {
    		return this[INTERNALS].disturbed;
    	},

    	/**
      * Decode response as ArrayBuffer
      *
      * @return  Promise
      */
    	arrayBuffer() {
    		return consumeBody.call(this).then(function (buf) {
    			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    		});
    	},

    	/**
      * Return raw response as Blob
      *
      * @return Promise
      */
    	blob() {
    		let ct = this.headers && this.headers.get('content-type') || '';
    		return consumeBody.call(this).then(function (buf) {
    			return Object.assign(
    			// Prevent copying
    			new Blob([], {
    				type: ct.toLowerCase()
    			}), {
    				[BUFFER]: buf
    			});
    		});
    	},

    	/**
      * Decode response as json
      *
      * @return  Promise
      */
    	json() {
    		var _this2 = this;

    		return consumeBody.call(this).then(function (buffer) {
    			try {
    				return JSON.parse(buffer.toString());
    			} catch (err) {
    				return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`, 'invalid-json'));
    			}
    		});
    	},

    	/**
      * Decode response as text
      *
      * @return  Promise
      */
    	text() {
    		return consumeBody.call(this).then(function (buffer) {
    			return buffer.toString();
    		});
    	},

    	/**
      * Decode response as buffer (non-spec api)
      *
      * @return  Promise
      */
    	buffer() {
    		return consumeBody.call(this);
    	},

    	/**
      * Decode response as text, while automatically detecting the encoding and
      * trying to decode to UTF-8 (non-spec api)
      *
      * @return  Promise
      */
    	textConverted() {
    		var _this3 = this;

    		return consumeBody.call(this).then(function (buffer) {
    			return convertBody(buffer, _this3.headers);
    		});
    	}
    };

    // In browsers, all properties are enumerable.
    Object.defineProperties(Body.prototype, {
    	body: { enumerable: true },
    	bodyUsed: { enumerable: true },
    	arrayBuffer: { enumerable: true },
    	blob: { enumerable: true },
    	json: { enumerable: true },
    	text: { enumerable: true }
    });

    Body.mixIn = function (proto) {
    	for (const name of Object.getOwnPropertyNames(Body.prototype)) {
    		// istanbul ignore else: future proof
    		if (!(name in proto)) {
    			const desc = Object.getOwnPropertyDescriptor(Body.prototype, name);
    			Object.defineProperty(proto, name, desc);
    		}
    	}
    };

    /**
     * Consume and convert an entire Body to a Buffer.
     *
     * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
     *
     * @return  Promise
     */
    function consumeBody() {
    	var _this4 = this;

    	if (this[INTERNALS].disturbed) {
    		return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));
    	}

    	this[INTERNALS].disturbed = true;

    	if (this[INTERNALS].error) {
    		return Body.Promise.reject(this[INTERNALS].error);
    	}

    	let body = this.body;

    	// body is null
    	if (body === null) {
    		return Body.Promise.resolve(Buffer.alloc(0));
    	}

    	// body is blob
    	if (isBlob(body)) {
    		body = body.stream();
    	}

    	// body is buffer
    	if (Buffer.isBuffer(body)) {
    		return Body.Promise.resolve(body);
    	}

    	// istanbul ignore if: should never happen
    	if (!(body instanceof Stream)) {
    		return Body.Promise.resolve(Buffer.alloc(0));
    	}

    	// body is stream
    	// get ready to actually consume the body
    	let accum = [];
    	let accumBytes = 0;
    	let abort = false;

    	return new Body.Promise(function (resolve, reject) {
    		let resTimeout;

    		// allow timeout on slow response body
    		if (_this4.timeout) {
    			resTimeout = setTimeout(function () {
    				abort = true;
    				reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, 'body-timeout'));
    			}, _this4.timeout);
    		}

    		// handle stream errors
    		body.on('error', function (err) {
    			if (err.name === 'AbortError') {
    				// if the request was aborted, reject with this Error
    				abort = true;
    				reject(err);
    			} else {
    				// other errors, such as incorrect content-encoding
    				reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, 'system', err));
    			}
    		});

    		body.on('data', function (chunk) {
    			if (abort || chunk === null) {
    				return;
    			}

    			if (_this4.size && accumBytes + chunk.length > _this4.size) {
    				abort = true;
    				reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`, 'max-size'));
    				return;
    			}

    			accumBytes += chunk.length;
    			accum.push(chunk);
    		});

    		body.on('end', function () {
    			if (abort) {
    				return;
    			}

    			clearTimeout(resTimeout);

    			try {
    				resolve(Buffer.concat(accum, accumBytes));
    			} catch (err) {
    				// handle streams that have accumulated too much data (issue #414)
    				reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, 'system', err));
    			}
    		});
    	});
    }

    /**
     * Detect buffer encoding and convert to target encoding
     * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
     *
     * @param   Buffer  buffer    Incoming buffer
     * @param   String  encoding  Target encoding
     * @return  String
     */
    function convertBody(buffer, headers) {
    	if (typeof convert !== 'function') {
    		throw new Error('The package `encoding` must be installed to use the textConverted() function');
    	}

    	const ct = headers.get('content-type');
    	let charset = 'utf-8';
    	let res, str;

    	// header
    	if (ct) {
    		res = /charset=([^;]*)/i.exec(ct);
    	}

    	// no charset in content type, peek at response body for at most 1024 bytes
    	str = buffer.slice(0, 1024).toString();

    	// html5
    	if (!res && str) {
    		res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
    	}

    	// html4
    	if (!res && str) {
    		res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);

    		if (res) {
    			res = /charset=(.*)/i.exec(res.pop());
    		}
    	}

    	// xml
    	if (!res && str) {
    		res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
    	}

    	// found charset
    	if (res) {
    		charset = res.pop();

    		// prevent decode issues when sites use incorrect encoding
    		// ref: https://hsivonen.fi/encoding-menu/
    		if (charset === 'gb2312' || charset === 'gbk') {
    			charset = 'gb18030';
    		}
    	}

    	// turn raw buffers into a single utf-8 buffer
    	return convert(buffer, 'UTF-8', charset).toString();
    }

    /**
     * Detect a URLSearchParams object
     * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
     *
     * @param   Object  obj     Object to detect by type or brand
     * @return  String
     */
    function isURLSearchParams(obj) {
    	// Duck-typing as a necessary condition.
    	if (typeof obj !== 'object' || typeof obj.append !== 'function' || typeof obj.delete !== 'function' || typeof obj.get !== 'function' || typeof obj.getAll !== 'function' || typeof obj.has !== 'function' || typeof obj.set !== 'function') {
    		return false;
    	}

    	// Brand-checking and more duck-typing as optional condition.
    	return obj.constructor.name === 'URLSearchParams' || Object.prototype.toString.call(obj) === '[object URLSearchParams]' || typeof obj.sort === 'function';
    }

    /**
     * Check if `obj` is a W3C `Blob` object (which `File` inherits from)
     * @param  {*} obj
     * @return {boolean}
     */
    function isBlob(obj) {
    	return typeof obj === 'object' && typeof obj.arrayBuffer === 'function' && typeof obj.type === 'string' && typeof obj.stream === 'function' && typeof obj.constructor === 'function' && typeof obj.constructor.name === 'string' && /^(Blob|File)$/.test(obj.constructor.name) && /^(Blob|File)$/.test(obj[Symbol.toStringTag]);
    }

    /**
     * Clone body given Res/Req instance
     *
     * @param   Mixed  instance  Response or Request instance
     * @return  Mixed
     */
    function clone(instance) {
    	let p1, p2;
    	let body = instance.body;

    	// don't allow cloning a used body
    	if (instance.bodyUsed) {
    		throw new Error('cannot clone body after it is used');
    	}

    	// check that body is a stream and not form-data object
    	// note: we can't clone the form-data object without having it as a dependency
    	if (body instanceof Stream && typeof body.getBoundary !== 'function') {
    		// tee instance body
    		p1 = new PassThrough();
    		p2 = new PassThrough();
    		body.pipe(p1);
    		body.pipe(p2);
    		// set instance body to teed body and return the other teed body
    		instance[INTERNALS].body = p1;
    		body = p2;
    	}

    	return body;
    }

    /**
     * Performs the operation "extract a `Content-Type` value from |object|" as
     * specified in the specification:
     * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
     *
     * This function assumes that instance.body is present.
     *
     * @param   Mixed  instance  Any options.body input
     */
    function extractContentType(body) {
    	if (body === null) {
    		// body is null
    		return null;
    	} else if (typeof body === 'string') {
    		// body is string
    		return 'text/plain;charset=UTF-8';
    	} else if (isURLSearchParams(body)) {
    		// body is a URLSearchParams
    		return 'application/x-www-form-urlencoded;charset=UTF-8';
    	} else if (isBlob(body)) {
    		// body is blob
    		return body.type || null;
    	} else if (Buffer.isBuffer(body)) {
    		// body is buffer
    		return null;
    	} else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
    		// body is ArrayBuffer
    		return null;
    	} else if (ArrayBuffer.isView(body)) {
    		// body is ArrayBufferView
    		return null;
    	} else if (typeof body.getBoundary === 'function') {
    		// detect form data input from form-data module
    		return `multipart/form-data;boundary=${body.getBoundary()}`;
    	} else if (body instanceof Stream) {
    		// body is stream
    		// can't really do much about this
    		return null;
    	} else {
    		// Body constructor defaults other things to string
    		return 'text/plain;charset=UTF-8';
    	}
    }

    /**
     * The Fetch Standard treats this as if "total bytes" is a property on the body.
     * For us, we have to explicitly get it with a function.
     *
     * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
     *
     * @param   Body    instance   Instance of Body
     * @return  Number?            Number of bytes, or null if not possible
     */
    function getTotalBytes(instance) {
    	const body = instance.body;


    	if (body === null) {
    		// body is null
    		return 0;
    	} else if (isBlob(body)) {
    		return body.size;
    	} else if (Buffer.isBuffer(body)) {
    		// body is buffer
    		return body.length;
    	} else if (body && typeof body.getLengthSync === 'function') {
    		// detect form data input from form-data module
    		if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || // 1.x
    		body.hasKnownLength && body.hasKnownLength()) {
    			// 2.x
    			return body.getLengthSync();
    		}
    		return null;
    	} else {
    		// body is stream
    		return null;
    	}
    }

    /**
     * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
     *
     * @param   Body    instance   Instance of Body
     * @return  Void
     */
    function writeToStream(dest, instance) {
    	const body = instance.body;


    	if (body === null) {
    		// body is null
    		dest.end();
    	} else if (isBlob(body)) {
    		body.stream().pipe(dest);
    	} else if (Buffer.isBuffer(body)) {
    		// body is buffer
    		dest.write(body);
    		dest.end();
    	} else {
    		// body is stream
    		body.pipe(dest);
    	}
    }

    // expose Promise
    Body.Promise = global.Promise;

    /**
     * headers.js
     *
     * Headers class offers convenient helpers
     */

    const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
    const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

    function validateName(name) {
    	name = `${name}`;
    	if (invalidTokenRegex.test(name) || name === '') {
    		throw new TypeError(`${name} is not a legal HTTP header name`);
    	}
    }

    function validateValue(value) {
    	value = `${value}`;
    	if (invalidHeaderCharRegex.test(value)) {
    		throw new TypeError(`${value} is not a legal HTTP header value`);
    	}
    }

    /**
     * Find the key in the map object given a header name.
     *
     * Returns undefined if not found.
     *
     * @param   String  name  Header name
     * @return  String|Undefined
     */
    function find(map, name) {
    	name = name.toLowerCase();
    	for (const key in map) {
    		if (key.toLowerCase() === name) {
    			return key;
    		}
    	}
    	return undefined;
    }

    const MAP = Symbol('map');
    class Headers {
    	/**
      * Headers class
      *
      * @param   Object  headers  Response headers
      * @return  Void
      */
    	constructor() {
    		let init = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

    		this[MAP] = Object.create(null);

    		if (init instanceof Headers) {
    			const rawHeaders = init.raw();
    			const headerNames = Object.keys(rawHeaders);

    			for (const headerName of headerNames) {
    				for (const value of rawHeaders[headerName]) {
    					this.append(headerName, value);
    				}
    			}

    			return;
    		}

    		// We don't worry about converting prop to ByteString here as append()
    		// will handle it.
    		if (init == null) ; else if (typeof init === 'object') {
    			const method = init[Symbol.iterator];
    			if (method != null) {
    				if (typeof method !== 'function') {
    					throw new TypeError('Header pairs must be iterable');
    				}

    				// sequence<sequence<ByteString>>
    				// Note: per spec we have to first exhaust the lists then process them
    				const pairs = [];
    				for (const pair of init) {
    					if (typeof pair !== 'object' || typeof pair[Symbol.iterator] !== 'function') {
    						throw new TypeError('Each header pair must be iterable');
    					}
    					pairs.push(Array.from(pair));
    				}

    				for (const pair of pairs) {
    					if (pair.length !== 2) {
    						throw new TypeError('Each header pair must be a name/value tuple');
    					}
    					this.append(pair[0], pair[1]);
    				}
    			} else {
    				// record<ByteString, ByteString>
    				for (const key of Object.keys(init)) {
    					const value = init[key];
    					this.append(key, value);
    				}
    			}
    		} else {
    			throw new TypeError('Provided initializer must be an object');
    		}
    	}

    	/**
      * Return combined header value given name
      *
      * @param   String  name  Header name
      * @return  Mixed
      */
    	get(name) {
    		name = `${name}`;
    		validateName(name);
    		const key = find(this[MAP], name);
    		if (key === undefined) {
    			return null;
    		}

    		return this[MAP][key].join(', ');
    	}

    	/**
      * Iterate over all headers
      *
      * @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
      * @param   Boolean   thisArg   `this` context for callback function
      * @return  Void
      */
    	forEach(callback) {
    		let thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

    		let pairs = getHeaders(this);
    		let i = 0;
    		while (i < pairs.length) {
    			var _pairs$i = pairs[i];
    			const name = _pairs$i[0],
    			      value = _pairs$i[1];

    			callback.call(thisArg, value, name, this);
    			pairs = getHeaders(this);
    			i++;
    		}
    	}

    	/**
      * Overwrite header values given name
      *
      * @param   String  name   Header name
      * @param   String  value  Header value
      * @return  Void
      */
    	set(name, value) {
    		name = `${name}`;
    		value = `${value}`;
    		validateName(name);
    		validateValue(value);
    		const key = find(this[MAP], name);
    		this[MAP][key !== undefined ? key : name] = [value];
    	}

    	/**
      * Append a value onto existing header
      *
      * @param   String  name   Header name
      * @param   String  value  Header value
      * @return  Void
      */
    	append(name, value) {
    		name = `${name}`;
    		value = `${value}`;
    		validateName(name);
    		validateValue(value);
    		const key = find(this[MAP], name);
    		if (key !== undefined) {
    			this[MAP][key].push(value);
    		} else {
    			this[MAP][name] = [value];
    		}
    	}

    	/**
      * Check for header name existence
      *
      * @param   String   name  Header name
      * @return  Boolean
      */
    	has(name) {
    		name = `${name}`;
    		validateName(name);
    		return find(this[MAP], name) !== undefined;
    	}

    	/**
      * Delete all header values given name
      *
      * @param   String  name  Header name
      * @return  Void
      */
    	delete(name) {
    		name = `${name}`;
    		validateName(name);
    		const key = find(this[MAP], name);
    		if (key !== undefined) {
    			delete this[MAP][key];
    		}
    	}

    	/**
      * Return raw headers (non-spec api)
      *
      * @return  Object
      */
    	raw() {
    		return this[MAP];
    	}

    	/**
      * Get an iterator on keys.
      *
      * @return  Iterator
      */
    	keys() {
    		return createHeadersIterator(this, 'key');
    	}

    	/**
      * Get an iterator on values.
      *
      * @return  Iterator
      */
    	values() {
    		return createHeadersIterator(this, 'value');
    	}

    	/**
      * Get an iterator on entries.
      *
      * This is the default iterator of the Headers object.
      *
      * @return  Iterator
      */
    	[Symbol.iterator]() {
    		return createHeadersIterator(this, 'key+value');
    	}
    }
    Headers.prototype.entries = Headers.prototype[Symbol.iterator];

    Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
    	value: 'Headers',
    	writable: false,
    	enumerable: false,
    	configurable: true
    });

    Object.defineProperties(Headers.prototype, {
    	get: { enumerable: true },
    	forEach: { enumerable: true },
    	set: { enumerable: true },
    	append: { enumerable: true },
    	has: { enumerable: true },
    	delete: { enumerable: true },
    	keys: { enumerable: true },
    	values: { enumerable: true },
    	entries: { enumerable: true }
    });

    function getHeaders(headers) {
    	let kind = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'key+value';

    	const keys = Object.keys(headers[MAP]).sort();
    	return keys.map(kind === 'key' ? function (k) {
    		return k.toLowerCase();
    	} : kind === 'value' ? function (k) {
    		return headers[MAP][k].join(', ');
    	} : function (k) {
    		return [k.toLowerCase(), headers[MAP][k].join(', ')];
    	});
    }

    const INTERNAL = Symbol('internal');

    function createHeadersIterator(target, kind) {
    	const iterator = Object.create(HeadersIteratorPrototype);
    	iterator[INTERNAL] = {
    		target,
    		kind,
    		index: 0
    	};
    	return iterator;
    }

    const HeadersIteratorPrototype = Object.setPrototypeOf({
    	next() {
    		// istanbul ignore if
    		if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
    			throw new TypeError('Value of `this` is not a HeadersIterator');
    		}

    		var _INTERNAL = this[INTERNAL];
    		const target = _INTERNAL.target,
    		      kind = _INTERNAL.kind,
    		      index = _INTERNAL.index;

    		const values = getHeaders(target, kind);
    		const len = values.length;
    		if (index >= len) {
    			return {
    				value: undefined,
    				done: true
    			};
    		}

    		this[INTERNAL].index = index + 1;

    		return {
    			value: values[index],
    			done: false
    		};
    	}
    }, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));

    Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
    	value: 'HeadersIterator',
    	writable: false,
    	enumerable: false,
    	configurable: true
    });

    /**
     * Export the Headers object in a form that Node.js can consume.
     *
     * @param   Headers  headers
     * @return  Object
     */
    function exportNodeCompatibleHeaders(headers) {
    	const obj = Object.assign({ __proto__: null }, headers[MAP]);

    	// http.request() only supports string as Host header. This hack makes
    	// specifying custom Host header possible.
    	const hostHeaderKey = find(headers[MAP], 'Host');
    	if (hostHeaderKey !== undefined) {
    		obj[hostHeaderKey] = obj[hostHeaderKey][0];
    	}

    	return obj;
    }

    /**
     * Create a Headers object from an object of headers, ignoring those that do
     * not conform to HTTP grammar productions.
     *
     * @param   Object  obj  Object of headers
     * @return  Headers
     */
    function createHeadersLenient(obj) {
    	const headers = new Headers();
    	for (const name of Object.keys(obj)) {
    		if (invalidTokenRegex.test(name)) {
    			continue;
    		}
    		if (Array.isArray(obj[name])) {
    			for (const val of obj[name]) {
    				if (invalidHeaderCharRegex.test(val)) {
    					continue;
    				}
    				if (headers[MAP][name] === undefined) {
    					headers[MAP][name] = [val];
    				} else {
    					headers[MAP][name].push(val);
    				}
    			}
    		} else if (!invalidHeaderCharRegex.test(obj[name])) {
    			headers[MAP][name] = [obj[name]];
    		}
    	}
    	return headers;
    }

    const INTERNALS$1 = Symbol('Response internals');

    // fix an issue where "STATUS_CODES" aren't a named export for node <10
    const STATUS_CODES = http.STATUS_CODES;

    /**
     * Response class
     *
     * @param   Stream  body  Readable stream
     * @param   Object  opts  Response options
     * @return  Void
     */
    class Response {
    	constructor() {
    		let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    		let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    		Body.call(this, body, opts);

    		const status = opts.status || 200;
    		const headers = new Headers(opts.headers);

    		if (body != null && !headers.has('Content-Type')) {
    			const contentType = extractContentType(body);
    			if (contentType) {
    				headers.append('Content-Type', contentType);
    			}
    		}

    		this[INTERNALS$1] = {
    			url: opts.url,
    			status,
    			statusText: opts.statusText || STATUS_CODES[status],
    			headers,
    			counter: opts.counter
    		};
    	}

    	get url() {
    		return this[INTERNALS$1].url || '';
    	}

    	get status() {
    		return this[INTERNALS$1].status;
    	}

    	/**
      * Convenience property representing if the request ended normally
      */
    	get ok() {
    		return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
    	}

    	get redirected() {
    		return this[INTERNALS$1].counter > 0;
    	}

    	get statusText() {
    		return this[INTERNALS$1].statusText;
    	}

    	get headers() {
    		return this[INTERNALS$1].headers;
    	}

    	/**
      * Clone this response
      *
      * @return  Response
      */
    	clone() {
    		return new Response(clone(this), {
    			url: this.url,
    			status: this.status,
    			statusText: this.statusText,
    			headers: this.headers,
    			ok: this.ok,
    			redirected: this.redirected
    		});
    	}
    }

    Body.mixIn(Response.prototype);

    Object.defineProperties(Response.prototype, {
    	url: { enumerable: true },
    	status: { enumerable: true },
    	ok: { enumerable: true },
    	redirected: { enumerable: true },
    	statusText: { enumerable: true },
    	headers: { enumerable: true },
    	clone: { enumerable: true }
    });

    Object.defineProperty(Response.prototype, Symbol.toStringTag, {
    	value: 'Response',
    	writable: false,
    	enumerable: false,
    	configurable: true
    });

    const INTERNALS$2 = Symbol('Request internals');

    // fix an issue where "format", "parse" aren't a named export for node <10
    const parse_url = Url.parse;
    const format_url = Url.format;

    const streamDestructionSupported = 'destroy' in Stream.Readable.prototype;

    /**
     * Check if a value is an instance of Request.
     *
     * @param   Mixed   input
     * @return  Boolean
     */
    function isRequest(input) {
    	return typeof input === 'object' && typeof input[INTERNALS$2] === 'object';
    }

    function isAbortSignal(signal) {
    	const proto = signal && typeof signal === 'object' && Object.getPrototypeOf(signal);
    	return !!(proto && proto.constructor.name === 'AbortSignal');
    }

    /**
     * Request class
     *
     * @param   Mixed   input  Url or Request instance
     * @param   Object  init   Custom options
     * @return  Void
     */
    class Request {
    	constructor(input) {
    		let init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    		let parsedURL;

    		// normalize input
    		if (!isRequest(input)) {
    			if (input && input.href) {
    				// in order to support Node.js' Url objects; though WHATWG's URL objects
    				// will fall into this branch also (since their `toString()` will return
    				// `href` property anyway)
    				parsedURL = parse_url(input.href);
    			} else {
    				// coerce input to a string before attempting to parse
    				parsedURL = parse_url(`${input}`);
    			}
    			input = {};
    		} else {
    			parsedURL = parse_url(input.url);
    		}

    		let method = init.method || input.method || 'GET';
    		method = method.toUpperCase();

    		if ((init.body != null || isRequest(input) && input.body !== null) && (method === 'GET' || method === 'HEAD')) {
    			throw new TypeError('Request with GET/HEAD method cannot have body');
    		}

    		let inputBody = init.body != null ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;

    		Body.call(this, inputBody, {
    			timeout: init.timeout || input.timeout || 0,
    			size: init.size || input.size || 0
    		});

    		const headers = new Headers(init.headers || input.headers || {});

    		if (inputBody != null && !headers.has('Content-Type')) {
    			const contentType = extractContentType(inputBody);
    			if (contentType) {
    				headers.append('Content-Type', contentType);
    			}
    		}

    		let signal = isRequest(input) ? input.signal : null;
    		if ('signal' in init) signal = init.signal;

    		if (signal != null && !isAbortSignal(signal)) {
    			throw new TypeError('Expected signal to be an instanceof AbortSignal');
    		}

    		this[INTERNALS$2] = {
    			method,
    			redirect: init.redirect || input.redirect || 'follow',
    			headers,
    			parsedURL,
    			signal
    		};

    		// node-fetch-only options
    		this.follow = init.follow !== undefined ? init.follow : input.follow !== undefined ? input.follow : 20;
    		this.compress = init.compress !== undefined ? init.compress : input.compress !== undefined ? input.compress : true;
    		this.counter = init.counter || input.counter || 0;
    		this.agent = init.agent || input.agent;
    	}

    	get method() {
    		return this[INTERNALS$2].method;
    	}

    	get url() {
    		return format_url(this[INTERNALS$2].parsedURL);
    	}

    	get headers() {
    		return this[INTERNALS$2].headers;
    	}

    	get redirect() {
    		return this[INTERNALS$2].redirect;
    	}

    	get signal() {
    		return this[INTERNALS$2].signal;
    	}

    	/**
      * Clone this request
      *
      * @return  Request
      */
    	clone() {
    		return new Request(this);
    	}
    }

    Body.mixIn(Request.prototype);

    Object.defineProperty(Request.prototype, Symbol.toStringTag, {
    	value: 'Request',
    	writable: false,
    	enumerable: false,
    	configurable: true
    });

    Object.defineProperties(Request.prototype, {
    	method: { enumerable: true },
    	url: { enumerable: true },
    	headers: { enumerable: true },
    	redirect: { enumerable: true },
    	clone: { enumerable: true },
    	signal: { enumerable: true }
    });

    /**
     * Convert a Request to Node.js http request options.
     *
     * @param   Request  A Request instance
     * @return  Object   The options object to be passed to http.request
     */
    function getNodeRequestOptions(request) {
    	const parsedURL = request[INTERNALS$2].parsedURL;
    	const headers = new Headers(request[INTERNALS$2].headers);

    	// fetch step 1.3
    	if (!headers.has('Accept')) {
    		headers.set('Accept', '*/*');
    	}

    	// Basic fetch
    	if (!parsedURL.protocol || !parsedURL.hostname) {
    		throw new TypeError('Only absolute URLs are supported');
    	}

    	if (!/^https?:$/.test(parsedURL.protocol)) {
    		throw new TypeError('Only HTTP(S) protocols are supported');
    	}

    	if (request.signal && request.body instanceof Stream.Readable && !streamDestructionSupported) {
    		throw new Error('Cancellation of streamed requests with AbortSignal is not supported in node < 8');
    	}

    	// HTTP-network-or-cache fetch steps 2.4-2.7
    	let contentLengthValue = null;
    	if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
    		contentLengthValue = '0';
    	}
    	if (request.body != null) {
    		const totalBytes = getTotalBytes(request);
    		if (typeof totalBytes === 'number') {
    			contentLengthValue = String(totalBytes);
    		}
    	}
    	if (contentLengthValue) {
    		headers.set('Content-Length', contentLengthValue);
    	}

    	// HTTP-network-or-cache fetch step 2.11
    	if (!headers.has('User-Agent')) {
    		headers.set('User-Agent', 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)');
    	}

    	// HTTP-network-or-cache fetch step 2.15
    	if (request.compress && !headers.has('Accept-Encoding')) {
    		headers.set('Accept-Encoding', 'gzip,deflate');
    	}

    	let agent = request.agent;
    	if (typeof agent === 'function') {
    		agent = agent(parsedURL);
    	}

    	if (!headers.has('Connection') && !agent) {
    		headers.set('Connection', 'close');
    	}

    	// HTTP-network fetch step 4.2
    	// chunked encoding is handled by Node.js

    	return Object.assign({}, parsedURL, {
    		method: request.method,
    		headers: exportNodeCompatibleHeaders(headers),
    		agent
    	});
    }

    /**
     * abort-error.js
     *
     * AbortError interface for cancelled requests
     */

    /**
     * Create AbortError instance
     *
     * @param   String      message      Error message for human
     * @return  AbortError
     */
    function AbortError(message) {
      Error.call(this, message);

      this.type = 'aborted';
      this.message = message;

      // hide custom error implementation details from end-users
      Error.captureStackTrace(this, this.constructor);
    }

    AbortError.prototype = Object.create(Error.prototype);
    AbortError.prototype.constructor = AbortError;
    AbortError.prototype.name = 'AbortError';

    // fix an issue where "PassThrough", "resolve" aren't a named export for node <10
    const PassThrough$1 = Stream.PassThrough;
    const resolve_url = Url.resolve;

    /**
     * Fetch function
     *
     * @param   Mixed    url   Absolute url or Request instance
     * @param   Object   opts  Fetch options
     * @return  Promise
     */
    function fetch(url, opts) {

    	// allow custom promise
    	if (!fetch.Promise) {
    		throw new Error('native promise missing, set fetch.Promise to your favorite alternative');
    	}

    	Body.Promise = fetch.Promise;

    	// wrap http.request into fetch
    	return new fetch.Promise(function (resolve, reject) {
    		// build request object
    		const request = new Request(url, opts);
    		const options = getNodeRequestOptions(request);

    		const send = (options.protocol === 'https:' ? https : http).request;
    		const signal = request.signal;

    		let response = null;

    		const abort = function abort() {
    			let error = new AbortError('The user aborted a request.');
    			reject(error);
    			if (request.body && request.body instanceof Stream.Readable) {
    				request.body.destroy(error);
    			}
    			if (!response || !response.body) return;
    			response.body.emit('error', error);
    		};

    		if (signal && signal.aborted) {
    			abort();
    			return;
    		}

    		const abortAndFinalize = function abortAndFinalize() {
    			abort();
    			finalize();
    		};

    		// send request
    		const req = send(options);
    		let reqTimeout;

    		if (signal) {
    			signal.addEventListener('abort', abortAndFinalize);
    		}

    		function finalize() {
    			req.abort();
    			if (signal) signal.removeEventListener('abort', abortAndFinalize);
    			clearTimeout(reqTimeout);
    		}

    		if (request.timeout) {
    			req.once('socket', function (socket) {
    				reqTimeout = setTimeout(function () {
    					reject(new FetchError(`network timeout at: ${request.url}`, 'request-timeout'));
    					finalize();
    				}, request.timeout);
    			});
    		}

    		req.on('error', function (err) {
    			reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, 'system', err));
    			finalize();
    		});

    		req.on('response', function (res) {
    			clearTimeout(reqTimeout);

    			const headers = createHeadersLenient(res.headers);

    			// HTTP fetch step 5
    			if (fetch.isRedirect(res.statusCode)) {
    				// HTTP fetch step 5.2
    				const location = headers.get('Location');

    				// HTTP fetch step 5.3
    				const locationURL = location === null ? null : resolve_url(request.url, location);

    				// HTTP fetch step 5.5
    				switch (request.redirect) {
    					case 'error':
    						reject(new FetchError(`redirect mode is set to error: ${request.url}`, 'no-redirect'));
    						finalize();
    						return;
    					case 'manual':
    						// node-fetch-specific step: make manual redirect a bit easier to use by setting the Location header value to the resolved URL.
    						if (locationURL !== null) {
    							// handle corrupted header
    							try {
    								headers.set('Location', locationURL);
    							} catch (err) {
    								// istanbul ignore next: nodejs server prevent invalid response headers, we can't test this through normal request
    								reject(err);
    							}
    						}
    						break;
    					case 'follow':
    						// HTTP-redirect fetch step 2
    						if (locationURL === null) {
    							break;
    						}

    						// HTTP-redirect fetch step 5
    						if (request.counter >= request.follow) {
    							reject(new FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'));
    							finalize();
    							return;
    						}

    						// HTTP-redirect fetch step 6 (counter increment)
    						// Create a new Request object.
    						const requestOpts = {
    							headers: new Headers(request.headers),
    							follow: request.follow,
    							counter: request.counter + 1,
    							agent: request.agent,
    							compress: request.compress,
    							method: request.method,
    							body: request.body,
    							signal: request.signal,
    							timeout: request.timeout
    						};

    						// HTTP-redirect fetch step 9
    						if (res.statusCode !== 303 && request.body && getTotalBytes(request) === null) {
    							reject(new FetchError('Cannot follow redirect with body being a readable stream', 'unsupported-redirect'));
    							finalize();
    							return;
    						}

    						// HTTP-redirect fetch step 11
    						if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === 'POST') {
    							requestOpts.method = 'GET';
    							requestOpts.body = undefined;
    							requestOpts.headers.delete('content-length');
    						}

    						// HTTP-redirect fetch step 15
    						resolve(fetch(new Request(locationURL, requestOpts)));
    						finalize();
    						return;
    				}
    			}

    			// prepare response
    			res.once('end', function () {
    				if (signal) signal.removeEventListener('abort', abortAndFinalize);
    			});
    			let body = res.pipe(new PassThrough$1());

    			const response_options = {
    				url: request.url,
    				status: res.statusCode,
    				statusText: res.statusMessage,
    				headers: headers,
    				size: request.size,
    				timeout: request.timeout,
    				counter: request.counter
    			};

    			// HTTP-network fetch step 12.1.1.3
    			const codings = headers.get('Content-Encoding');

    			// HTTP-network fetch step 12.1.1.4: handle content codings

    			// in following scenarios we ignore compression support
    			// 1. compression support is disabled
    			// 2. HEAD request
    			// 3. no Content-Encoding header
    			// 4. no content response (204)
    			// 5. content not modified response (304)
    			if (!request.compress || request.method === 'HEAD' || codings === null || res.statusCode === 204 || res.statusCode === 304) {
    				response = new Response(body, response_options);
    				resolve(response);
    				return;
    			}

    			// For Node v6+
    			// Be less strict when decoding compressed responses, since sometimes
    			// servers send slightly invalid responses that are still accepted
    			// by common browsers.
    			// Always using Z_SYNC_FLUSH is what cURL does.
    			const zlibOptions = {
    				flush: zlib.Z_SYNC_FLUSH,
    				finishFlush: zlib.Z_SYNC_FLUSH
    			};

    			// for gzip
    			if (codings == 'gzip' || codings == 'x-gzip') {
    				body = body.pipe(zlib.createGunzip(zlibOptions));
    				response = new Response(body, response_options);
    				resolve(response);
    				return;
    			}

    			// for deflate
    			if (codings == 'deflate' || codings == 'x-deflate') {
    				// handle the infamous raw deflate response from old servers
    				// a hack for old IIS and Apache servers
    				const raw = res.pipe(new PassThrough$1());
    				raw.once('data', function (chunk) {
    					// see http://stackoverflow.com/questions/37519828
    					if ((chunk[0] & 0x0F) === 0x08) {
    						body = body.pipe(zlib.createInflate());
    					} else {
    						body = body.pipe(zlib.createInflateRaw());
    					}
    					response = new Response(body, response_options);
    					resolve(response);
    				});
    				return;
    			}

    			// for br
    			if (codings == 'br' && typeof zlib.createBrotliDecompress === 'function') {
    				body = body.pipe(zlib.createBrotliDecompress());
    				response = new Response(body, response_options);
    				resolve(response);
    				return;
    			}

    			// otherwise, use response as-is
    			response = new Response(body, response_options);
    			resolve(response);
    		});

    		writeToStream(req, request);
    	});
    }
    /**
     * Redirect code matching
     *
     * @param   Number   code  Status code
     * @return  Boolean
     */
    fetch.isRedirect = function (code) {
    	return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
    };

    // expose Promise
    fetch.Promise = global.Promise;

    module.exports = exports = fetch;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = exports;
    exports.Headers = Headers;
    exports.Request = Request;
    exports.Response = Response;
    exports.FetchError = FetchError;


    /***/ }),

    /***/ 747:
    /***/ (function(module) {

    module.exports = require("fs");

    /***/ }),

    /***/ 761:
    /***/ (function(module) {

    module.exports = require("zlib");

    /***/ }),

    /***/ 821:
    /***/ (function() {

    /*
     * SystemJS global script loading support
     * Extra for the s.js build only
     * (Included by default in system.js build)
     */
    (function (global) {
      var systemJSPrototype = System.constructor.prototype;

      // safari unpredictably lists some new globals first or second in object order
      var firstGlobalProp, secondGlobalProp, lastGlobalProp;
      function getGlobalProp () {
        var cnt = 0;
        var lastProp;
        for (var p in global) {
          // do not check frames cause it could be removed during import
          if (shouldSkipProperty(p))
            continue;
          if (cnt === 0 && p !== firstGlobalProp || cnt === 1 && p !== secondGlobalProp)
            return p;
          cnt++;
          lastProp = p;
        }
        if (lastProp !== lastGlobalProp)
          return lastProp;
      }

      function noteGlobalProps () {
        // alternatively Object.keys(global).pop()
        // but this may be faster (pending benchmarks)
        firstGlobalProp = secondGlobalProp = undefined;
        for (var p in global) {
          // do not check frames cause it could be removed during import
          if (shouldSkipProperty(p))
            continue;
          if (!firstGlobalProp)
            firstGlobalProp = p;
          else if (!secondGlobalProp)
            secondGlobalProp = p;
          lastGlobalProp = p;
        }
        return lastGlobalProp;
      }

      var impt = systemJSPrototype.import;
      systemJSPrototype.import = function (id, parentUrl) {
        noteGlobalProps();
        return impt.call(this, id, parentUrl);
      };

      var emptyInstantiation = [[], function () { return {} }];

      var getRegister = systemJSPrototype.getRegister;
      systemJSPrototype.getRegister = function () {
        var lastRegister = getRegister.call(this);
        if (lastRegister)
          return lastRegister;

        // no registration -> attempt a global detection as difference from snapshot
        // when multiple globals, we take the global value to be the last defined new global object property
        // for performance, this will not support multi-version / global collisions as previous SystemJS versions did
        // note in Edge, deleting and re-adding a global does not change its ordering
        var globalProp = getGlobalProp();
        if (!globalProp)
          return emptyInstantiation;

        var globalExport;
        try {
          globalExport = global[globalProp];
        }
        catch (e) {
          return emptyInstantiation;
        }

        return [[], function (_export) {
          return {
            execute: function () {
              _export({ default: globalExport, __useDefault: true });
            }
          };
        }];
      };

      var isIE11 = typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Trident') !== -1;

      function shouldSkipProperty(p) {
        return !global.hasOwnProperty(p)
          || !isNaN(p) && p < global.length
          || isIE11 && global[p] && typeof window !== 'undefined' && global[p].parent === window;
      }
    })(typeof self !== 'undefined' ? self : global);


    /***/ }),

    /***/ 835:
    /***/ (function(module) {

    module.exports = require("url");

    /***/ }),

    /***/ 947:
    /***/ (function(__unusedmodule, exports) {

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

    /**
     * Encode an integer in the range of 0 to 63 to a single base 64 digit.
     */
    exports.encode = function (number) {
      if (0 <= number && number < intToCharMap.length) {
        return intToCharMap[number];
      }
      throw new TypeError("Must be between 0 and 63: " + number);
    };

    /**
     * Decode a single base 64 character code digit to an integer. Returns -1 on
     * failure.
     */
    exports.decode = function (charCode) {
      var bigA = 65;     // 'A'
      var bigZ = 90;     // 'Z'

      var littleA = 97;  // 'a'
      var littleZ = 122; // 'z'

      var zero = 48;     // '0'
      var nine = 57;     // '9'

      var plus = 43;     // '+'
      var slash = 47;    // '/'

      var littleOffset = 26;
      var numberOffset = 52;

      // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
      if (bigA <= charCode && charCode <= bigZ) {
        return (charCode - bigA);
      }

      // 26 - 51: abcdefghijklmnopqrstuvwxyz
      if (littleA <= charCode && charCode <= littleZ) {
        return (charCode - littleA + littleOffset);
      }

      // 52 - 61: 0123456789
      if (zero <= charCode && charCode <= nine) {
        return (charCode - zero + numberOffset);
      }

      // 62: +
      if (charCode == plus) {
        return 62;
      }

      // 63: /
      if (charCode == slash) {
        return 63;
      }

      // Invalid base64 digit.
      return -1;
    };


    /***/ }),

    /***/ 969:
    /***/ (function(__unusedmodule, exports, __webpack_require__) {

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    var util = __webpack_require__(338);
    var has = Object.prototype.hasOwnProperty;
    var hasNativeMap = typeof Map !== "undefined";

    /**
     * A data structure which is a combination of an array and a set. Adding a new
     * member is O(1), testing for membership is O(1), and finding the index of an
     * element is O(1). Removing elements from the set is not supported. Only
     * strings are supported for membership.
     */
    function ArraySet() {
      this._array = [];
      this._set = hasNativeMap ? new Map() : Object.create(null);
    }

    /**
     * Static method for creating ArraySet instances from an existing array.
     */
    ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
      var set = new ArraySet();
      for (var i = 0, len = aArray.length; i < len; i++) {
        set.add(aArray[i], aAllowDuplicates);
      }
      return set;
    };

    /**
     * Return how many unique items are in this ArraySet. If duplicates have been
     * added, than those do not count towards the size.
     *
     * @returns Number
     */
    ArraySet.prototype.size = function ArraySet_size() {
      return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
    };

    /**
     * Add the given string to this set.
     *
     * @param String aStr
     */
    ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
      var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
      var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
      var idx = this._array.length;
      if (!isDuplicate || aAllowDuplicates) {
        this._array.push(aStr);
      }
      if (!isDuplicate) {
        if (hasNativeMap) {
          this._set.set(aStr, idx);
        } else {
          this._set[sStr] = idx;
        }
      }
    };

    /**
     * Is the given string a member of this set?
     *
     * @param String aStr
     */
    ArraySet.prototype.has = function ArraySet_has(aStr) {
      if (hasNativeMap) {
        return this._set.has(aStr);
      } else {
        var sStr = util.toSetString(aStr);
        return has.call(this._set, sStr);
      }
    };

    /**
     * What is the index of the given string in the array?
     *
     * @param String aStr
     */
    ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
      if (hasNativeMap) {
        var idx = this._set.get(aStr);
        if (idx >= 0) {
            return idx;
        }
      } else {
        var sStr = util.toSetString(aStr);
        if (has.call(this._set, sStr)) {
          return this._set[sStr];
        }
      }

      throw new Error('"' + aStr + '" is not in the set.');
    };

    /**
     * What is the element at the given index?
     *
     * @param Number aIdx
     */
    ArraySet.prototype.at = function ArraySet_at(aIdx) {
      if (aIdx >= 0 && aIdx < this._array.length) {
        return this._array[aIdx];
      }
      throw new Error('No element indexed by ' + aIdx);
    };

    /**
     * Returns the array representation of this set (which has the proper indices
     * indicated by indexOf). Note that this is a copy of the internal array used
     * for storing the members so that no one can mess with internal state.
     */
    ArraySet.prototype.toArray = function ArraySet_toArray() {
      return this._array.slice();
    };

    exports.ArraySet = ArraySet;


    /***/ }),

    /***/ 972:
    /***/ (function(__unusedmodule, exports) {

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    exports.GREATEST_LOWER_BOUND = 1;
    exports.LEAST_UPPER_BOUND = 2;

    /**
     * Recursive implementation of binary search.
     *
     * @param aLow Indices here and lower do not contain the needle.
     * @param aHigh Indices here and higher do not contain the needle.
     * @param aNeedle The element being searched for.
     * @param aHaystack The non-empty array being searched.
     * @param aCompare Function which takes two elements and returns -1, 0, or 1.
     * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
     *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
     *     closest element that is smaller than or greater than the one we are
     *     searching for, respectively, if the exact element cannot be found.
     */
    function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
      // This function terminates when one of the following is true:
      //
      //   1. We find the exact element we are looking for.
      //
      //   2. We did not find the exact element, but we can return the index of
      //      the next-closest element.
      //
      //   3. We did not find the exact element, and there is no next-closest
      //      element than the one we are searching for, so we return -1.
      var mid = Math.floor((aHigh - aLow) / 2) + aLow;
      var cmp = aCompare(aNeedle, aHaystack[mid], true);
      if (cmp === 0) {
        // Found the element we are looking for.
        return mid;
      }
      else if (cmp > 0) {
        // Our needle is greater than aHaystack[mid].
        if (aHigh - mid > 1) {
          // The element is in the upper half.
          return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
        }

        // The exact needle element was not found in this haystack. Determine if
        // we are in termination case (3) or (2) and return the appropriate thing.
        if (aBias == exports.LEAST_UPPER_BOUND) {
          return aHigh < aHaystack.length ? aHigh : -1;
        } else {
          return mid;
        }
      }
      else {
        // Our needle is less than aHaystack[mid].
        if (mid - aLow > 1) {
          // The element is in the lower half.
          return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
        }

        // we are in termination case (3) or (2) and return the appropriate thing.
        if (aBias == exports.LEAST_UPPER_BOUND) {
          return mid;
        } else {
          return aLow < 0 ? -1 : aLow;
        }
      }
    }

    /**
     * This is an implementation of binary search which will always try and return
     * the index of the closest element if there is no exact hit. This is because
     * mappings between original and generated line/col pairs are single points,
     * and there is an implicit region between each of them, so a miss just means
     * that you aren't on the very start of a region.
     *
     * @param aNeedle The element you are looking for.
     * @param aHaystack The array that is being searched.
     * @param aCompare A function which takes the needle and an element in the
     *     array and returns -1, 0, or 1 depending on whether the needle is less
     *     than, equal to, or greater than the element, respectively.
     * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
     *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
     *     closest element that is smaller than or greater than the one we are
     *     searching for, respectively, if the exact element cannot be found.
     *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
     */
    exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
      if (aHaystack.length === 0) {
        return -1;
      }

      var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                                  aCompare, aBias || exports.GREATEST_LOWER_BOUND);
      if (index < 0) {
        return -1;
      }

      // We have found either the exact element, or the next-closest element than
      // the one we are searching for. However, there may be more than one such
      // element. Make sure we always return the smallest of these.
      while (index - 1 >= 0) {
        if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
          break;
        }
        --index;
      }

      return index;
    };


    /***/ })

    /******/ },
    /******/ function(__webpack_require__) { // webpackRuntimeModules
    /******/ 
    /******/ 	/* webpack/runtime/make namespace object */
    /******/ 	!function() {
    /******/ 		// define __esModule on exports
    /******/ 		__webpack_require__.r = function(exports) {
    /******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    /******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    /******/ 			}
    /******/ 			Object.defineProperty(exports, '__esModule', { value: true });
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/define property getter */
    /******/ 	!function() {
    /******/ 		// define getter function for harmony exports
    /******/ 		var hasOwnProperty = Object.prototype.hasOwnProperty;
    /******/ 		__webpack_require__.d = function(exports, name, getter) {
    /******/ 			if(!hasOwnProperty.call(exports, name)) {
    /******/ 				Object.defineProperty(exports, name, { enumerable: true, get: getter });
    /******/ 			}
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/create fake namespace object */
    /******/ 	!function() {
    /******/ 		// create a fake namespace object
    /******/ 		// mode & 1: value is a module id, require it
    /******/ 		// mode & 2: merge all properties of value into the ns
    /******/ 		// mode & 4: return value when already ns object
    /******/ 		// mode & 8|1: behave like require
    /******/ 		__webpack_require__.t = function(value, mode) {
    /******/ 			if(mode & 1) value = this(value);
    /******/ 			if(mode & 8) return value;
    /******/ 			if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
    /******/ 			var ns = Object.create(null);
    /******/ 			__webpack_require__.r(ns);
    /******/ 			Object.defineProperty(ns, 'default', { enumerable: true, value: value });
    /******/ 			if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
    /******/ 			return ns;
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ 	/* webpack/runtime/compat get default export */
    /******/ 	!function() {
    /******/ 		// getDefaultExport function for compatibility with non-harmony modules
    /******/ 		__webpack_require__.n = function(module) {
    /******/ 			var getter = module && module.__esModule ?
    /******/ 				function getDefault() { return module['default']; } :
    /******/ 				function getModuleExports() { return module; };
    /******/ 			__webpack_require__.d(getter, 'a', getter);
    /******/ 			return getter;
    /******/ 		};
    /******/ 	}();
    /******/ 	
    /******/ }
    );

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var s = createCommonjsModule(function (module) {
    /*
    * SJS 6.3.2
    * Minimal SystemJS Build
    */
    (function () {
      function errMsg(errCode, msg) {
        return (msg || "") + " (SystemJS https://git.io/JvFET#" + errCode + ")";
      }

      var hasSymbol = typeof Symbol !== 'undefined';
      var hasSelf = typeof self !== 'undefined';
      var hasDocument = typeof document !== 'undefined';

      var envGlobal = hasSelf ? self : commonjsGlobal;

      var baseUrl;

      if (hasDocument) {
        var baseEl = document.querySelector('base[href]');
        if (baseEl)
          baseUrl = baseEl.href;
      }

      if (!baseUrl && typeof location !== 'undefined') {
        baseUrl = location.href.split('#')[0].split('?')[0];
        var lastSepIndex = baseUrl.lastIndexOf('/');
        if (lastSepIndex !== -1)
          baseUrl = baseUrl.slice(0, lastSepIndex + 1);
      }

      var backslashRegEx = /\\/g;
      function resolveIfNotPlainOrUrl (relUrl, parentUrl) {
        if (relUrl.indexOf('\\') !== -1)
          relUrl = relUrl.replace(backslashRegEx, '/');
        // protocol-relative
        if (relUrl[0] === '/' && relUrl[1] === '/') {
          return parentUrl.slice(0, parentUrl.indexOf(':') + 1) + relUrl;
        }
        // relative-url
        else if (relUrl[0] === '.' && (relUrl[1] === '/' || relUrl[1] === '.' && (relUrl[2] === '/' || relUrl.length === 2 && (relUrl += '/')) ||
            relUrl.length === 1  && (relUrl += '/')) ||
            relUrl[0] === '/') {
          var parentProtocol = parentUrl.slice(0, parentUrl.indexOf(':') + 1);
          // Disabled, but these cases will give inconsistent results for deep backtracking
          //if (parentUrl[parentProtocol.length] !== '/')
          //  throw Error('Cannot resolve');
          // read pathname from parent URL
          // pathname taken to be part after leading "/"
          var pathname;
          if (parentUrl[parentProtocol.length + 1] === '/') {
            // resolving to a :// so we need to read out the auth and host
            if (parentProtocol !== 'file:') {
              pathname = parentUrl.slice(parentProtocol.length + 2);
              pathname = pathname.slice(pathname.indexOf('/') + 1);
            }
            else {
              pathname = parentUrl.slice(8);
            }
          }
          else {
            // resolving to :/ so pathname is the /... part
            pathname = parentUrl.slice(parentProtocol.length + (parentUrl[parentProtocol.length] === '/'));
          }

          if (relUrl[0] === '/')
            return parentUrl.slice(0, parentUrl.length - pathname.length - 1) + relUrl;

          // join together and split for removal of .. and . segments
          // looping the string instead of anything fancy for perf reasons
          // '../../../../../z' resolved to 'x/y' is just 'z'
          var segmented = pathname.slice(0, pathname.lastIndexOf('/') + 1) + relUrl;

          var output = [];
          var segmentIndex = -1;
          for (var i = 0; i < segmented.length; i++) {
            // busy reading a segment - only terminate on '/'
            if (segmentIndex !== -1) {
              if (segmented[i] === '/') {
                output.push(segmented.slice(segmentIndex, i + 1));
                segmentIndex = -1;
              }
            }

            // new segment - check if it is relative
            else if (segmented[i] === '.') {
              // ../ segment
              if (segmented[i + 1] === '.' && (segmented[i + 2] === '/' || i + 2 === segmented.length)) {
                output.pop();
                i += 2;
              }
              // ./ segment
              else if (segmented[i + 1] === '/' || i + 1 === segmented.length) {
                i += 1;
              }
              else {
                // the start of a new segment as below
                segmentIndex = i;
              }
            }
            // it is the start of a new segment
            else {
              segmentIndex = i;
            }
          }
          // finish reading out the last segment
          if (segmentIndex !== -1)
            output.push(segmented.slice(segmentIndex));
          return parentUrl.slice(0, parentUrl.length - pathname.length) + output.join('');
        }
      }

      /*
       * Import maps implementation
       *
       * To make lookups fast we pre-resolve the entire import map
       * and then match based on backtracked hash lookups
       *
       */

      function resolveUrl (relUrl, parentUrl) {
        return resolveIfNotPlainOrUrl(relUrl, parentUrl) || (relUrl.indexOf(':') !== -1 ? relUrl : resolveIfNotPlainOrUrl('./' + relUrl, parentUrl));
      }

      function objectAssign (to, from) {
        for (var p in from)
          to[p] = from[p];
        return to;
      }

      function resolveAndComposePackages (packages, outPackages, baseUrl, parentMap, parentUrl) {
        for (var p in packages) {
          var resolvedLhs = resolveIfNotPlainOrUrl(p, baseUrl) || p;
          var rhs = packages[p];
          // package fallbacks not currently supported
          if (typeof rhs !== 'string')
            continue;
          var mapped = resolveImportMap(parentMap, resolveIfNotPlainOrUrl(rhs, baseUrl) || rhs, parentUrl);
          if (!mapped) {
            targetWarning('W1', p, rhs);
          }
          else
            outPackages[resolvedLhs] = mapped;
        }
      }

      function resolveAndComposeImportMap (json, baseUrl, parentMap) {
        var outMap = { imports: objectAssign({}, parentMap.imports), scopes: objectAssign({}, parentMap.scopes) };

        if (json.imports)
          resolveAndComposePackages(json.imports, outMap.imports, baseUrl, parentMap, null);

        if (json.scopes)
          for (var s in json.scopes) {
            var resolvedScope = resolveUrl(s, baseUrl);
            resolveAndComposePackages(json.scopes[s], outMap.scopes[resolvedScope] || (outMap.scopes[resolvedScope] = {}), baseUrl, parentMap, resolvedScope);
          }

        return outMap;
      }

      function getMatch (path, matchObj) {
        if (matchObj[path])
          return path;
        var sepIndex = path.length;
        do {
          var segment = path.slice(0, sepIndex + 1);
          if (segment in matchObj)
            return segment;
        } while ((sepIndex = path.lastIndexOf('/', sepIndex - 1)) !== -1)
      }

      function applyPackages (id, packages) {
        var pkgName = getMatch(id, packages);
        if (pkgName) {
          var pkg = packages[pkgName];
          if (pkg === null) return;
          if (id.length > pkgName.length && pkg[pkg.length - 1] !== '/') {
            targetWarning('W2', pkgName, pkg);
          }
          else
            return pkg + id.slice(pkgName.length);
        }
      }

      function targetWarning (code, match, target, msg) {
        console.warn(errMsg(code,  [target, match].join(', ') ));
      }

      function resolveImportMap (importMap, resolvedOrPlain, parentUrl) {
        var scopes = importMap.scopes;
        var scopeUrl = parentUrl && getMatch(parentUrl, scopes);
        while (scopeUrl) {
          var packageResolution = applyPackages(resolvedOrPlain, scopes[scopeUrl]);
          if (packageResolution)
            return packageResolution;
          scopeUrl = getMatch(scopeUrl.slice(0, scopeUrl.lastIndexOf('/')), scopes);
        }
        return applyPackages(resolvedOrPlain, importMap.imports) || resolvedOrPlain.indexOf(':') !== -1 && resolvedOrPlain;
      }

      /*
       * SystemJS Core
       * 
       * Provides
       * - System.import
       * - System.register support for
       *     live bindings, function hoisting through circular references,
       *     reexports, dynamic import, import.meta.url, top-level await
       * - System.getRegister to get the registration
       * - Symbol.toStringTag support in Module objects
       * - Hookable System.createContext to customize import.meta
       * - System.onload(err, id, deps) handler for tracing / hot-reloading
       * 
       * Core comes with no System.prototype.resolve or
       * System.prototype.instantiate implementations
       */

      var toStringTag = hasSymbol && Symbol.toStringTag;
      var REGISTRY = hasSymbol ? Symbol() : '@';

      function SystemJS () {
        this[REGISTRY] = {};
      }

      var systemJSPrototype = SystemJS.prototype;

      systemJSPrototype.import = function (id, parentUrl) {
        var loader = this;
        return Promise.resolve(loader.prepareImport())
        .then(function() {
          return loader.resolve(id, parentUrl);
        })
        .then(function (id) {
          var load = getOrCreateLoad(loader, id);
          return load.C || topLevelLoad(loader, load);
        });
      };

      // Hookable createContext function -> allowing eg custom import meta
      systemJSPrototype.createContext = function (parentId) {
        return {
          url: parentId
        };
      };
      function loadToId (load) {
        return load.id;
      }
      function triggerOnload (loader, load, err) {
        loader.onload(err, load.id, load.d && load.d.map(loadToId));
        if (err)
          throw err;
      }

      var lastRegister;
      systemJSPrototype.register = function (deps, declare) {
        lastRegister = [deps, declare];
      };

      /*
       * getRegister provides the last anonymous System.register call
       */
      systemJSPrototype.getRegister = function () {
        var _lastRegister = lastRegister;
        lastRegister = undefined;
        return _lastRegister;
      };

      function getOrCreateLoad (loader, id, firstParentUrl) {
        var load = loader[REGISTRY][id];
        if (load)
          return load;

        var importerSetters = [];
        var ns = Object.create(null);
        if (toStringTag)
          Object.defineProperty(ns, toStringTag, { value: 'Module' });
        
        var instantiatePromise = Promise.resolve()
        .then(function () {
          return loader.instantiate(id, firstParentUrl);
        })
        .then(function (registration) {
          if (!registration)
            throw Error(errMsg(2,  id ));
          function _export (name, value) {
            // note if we have hoisted exports (including reexports)
            load.h = true;
            var changed = false;
            if (typeof name !== 'object') {
              if (!(name in ns) || ns[name] !== value) {
                ns[name] = value;
                changed = true;
              }
            }
            else {
              for (var p in name) {
                var value = name[p];
                if (!(p in ns) || ns[p] !== value) {
                  ns[p] = value;
                  changed = true;
                }
              }

              if (name.__esModule) {
                ns.__esModule = name.__esModule;
              }
            }
            if (changed)
              for (var i = 0; i < importerSetters.length; i++)
                importerSetters[i](ns);
            return value;
          }
          var declared = registration[1](_export, registration[1].length === 2 ? {
            import: function (importId) {
              return loader.import(importId, id);
            },
            meta: loader.createContext(id)
          } : undefined);
          load.e = declared.execute || function () {};
          return [registration[0], declared.setters || []];
        });

        var linkPromise = instantiatePromise
        .then(function (instantiation) {
          return Promise.all(instantiation[0].map(function (dep, i) {
            var setter = instantiation[1][i];
            return Promise.resolve(loader.resolve(dep, id))
            .then(function (depId) {
              var depLoad = getOrCreateLoad(loader, depId, id);
              // depLoad.I may be undefined for already-evaluated
              return Promise.resolve(depLoad.I)
              .then(function () {
                if (setter) {
                  depLoad.i.push(setter);
                  // only run early setters when there are hoisted exports of that module
                  // the timing works here as pending hoisted export calls will trigger through importerSetters
                  if (depLoad.h || !depLoad.I)
                    setter(depLoad.n);
                }
                return depLoad;
              });
            })
          }))
          .then(function (depLoads) {
            load.d = depLoads;
          });
        });

        linkPromise.catch(function (err) {
          load.e = null;
          load.er = err;
        });

        // Capital letter = a promise function
        return load = loader[REGISTRY][id] = {
          id: id,
          // importerSetters, the setters functions registered to this dependency
          // we retain this to add more later
          i: importerSetters,
          // module namespace object
          n: ns,

          // instantiate
          I: instantiatePromise,
          // link
          L: linkPromise,
          // whether it has hoisted exports
          h: false,

          // On instantiate completion we have populated:
          // dependency load records
          d: undefined,
          // execution function
          // set to NULL immediately after execution (or on any failure) to indicate execution has happened
          // in such a case, C should be used, and E, I, L will be emptied
          e: undefined,

          // On execution we have populated:
          // the execution error if any
          er: undefined,
          // in the case of TLA, the execution promise
          E: undefined,

          // On execution, L, I, E cleared

          // Promise for top-level completion
          C: undefined
        };
      }

      function instantiateAll (loader, load, loaded) {
        if (!loaded[load.id]) {
          loaded[load.id] = true;
          // load.L may be undefined for already-instantiated
          return Promise.resolve(load.L)
          .then(function () {
            return Promise.all(load.d.map(function (dep) {
              return instantiateAll(loader, dep, loaded);
            }));
          })
        }
      }

      function topLevelLoad (loader, load) {
        return load.C = instantiateAll(loader, load, {})
        .then(function () {
          return postOrderExec(loader, load, {});
        })
        .then(function () {
          return load.n;
        });
      }

      // the closest we can get to call(undefined)
      var nullContext = Object.freeze(Object.create(null));

      // returns a promise if and only if a top-level await subgraph
      // throws on sync errors
      function postOrderExec (loader, load, seen) {
        if (seen[load.id])
          return;
        seen[load.id] = true;

        if (!load.e) {
          if (load.er)
            throw load.er;
          if (load.E)
            return load.E;
          return;
        }

        // deps execute first, unless circular
        var depLoadPromises;
        load.d.forEach(function (depLoad) {
          if (false) {
            try {
              var depLoadPromise;
            }
            catch (err) {
            }
          }
          else {
            var depLoadPromise = postOrderExec(loader, depLoad, seen);
            if (depLoadPromise)
              (depLoadPromises = depLoadPromises || []).push(depLoadPromise);
          }
        });
        if (depLoadPromises)
          return Promise.all(depLoadPromises).then(doExec);

        return doExec();

        function doExec () {
          try {
            var execPromise = load.e.call(nullContext);
            if (execPromise) {
              if (!true)
                execPromise = execPromise.then(function () {
                  load.C = load.n;
                  load.E = null; // indicates completion
                  triggerOnload(loader, load, null);
                }, function (err) {
                  triggerOnload(loader, load, err);
                });
              else
                execPromise = execPromise.then(function () {
                  load.C = load.n;
                  load.E = null;
                });
              return load.E = load.E || execPromise;
            }
            // (should be a promise, but a minify optimization to leave out Promise.resolve)
            load.C = load.n;
            if (!true) triggerOnload(loader, load, null);
          }
          catch (err) {
            load.er = err;
            throw err;
          }
          finally {
            load.L = load.I = undefined;
            load.e = null;
          }
        }
      }

      envGlobal.System = new SystemJS();

      /*
       * Import map support for SystemJS
       * 
       * <script type="systemjs-importmap">{}</script>
       * OR
       * <script type="systemjs-importmap" src=package.json></script>
       * 
       * Only those import maps available at the time of SystemJS initialization will be loaded
       * and they will be loaded in DOM order.
       * 
       * There is no support for dynamic import maps injection currently.
       */

      var IMPORT_MAP = hasSymbol ? Symbol() : '#';
      var IMPORT_MAP_PROMISE = hasSymbol ? Symbol() : '$';

      iterateDocumentImportMaps(function (script) {
        script._t = fetch(script.src).then(function (res) {
          return res.text();
        });
      }, '[src]');

      systemJSPrototype.prepareImport = function () {
        var loader = this;
        if (!loader[IMPORT_MAP_PROMISE]) {
          loader[IMPORT_MAP] = { imports: {}, scopes: {} };
          loader[IMPORT_MAP_PROMISE] = Promise.resolve();
          iterateDocumentImportMaps(function (script) {
            loader[IMPORT_MAP_PROMISE] = loader[IMPORT_MAP_PROMISE].then(function () {
              return (script._t || script.src && fetch(script.src).then(function (res) { return res.text(); }) || Promise.resolve(script.innerHTML))
              .then(function (text) {
                try {
                  return JSON.parse(text);
                } catch (err) {
                  throw Error( errMsg(1) );
                }
              })
              .then(function (newMap) {
                loader[IMPORT_MAP] = resolveAndComposeImportMap(newMap, script.src || baseUrl, loader[IMPORT_MAP]);
              });
            });
          }, '');
        }
        return loader[IMPORT_MAP_PROMISE];
      };

      systemJSPrototype.resolve = function (id, parentUrl) {
        parentUrl = parentUrl || !true  || baseUrl;
        return resolveImportMap(this[IMPORT_MAP], resolveIfNotPlainOrUrl(id, parentUrl) || id, parentUrl) || throwUnresolved(id, parentUrl);
      };

      function throwUnresolved (id, parentUrl) {
        throw Error(errMsg(8,  [id, parentUrl].join(', ') ));
      }

      function iterateDocumentImportMaps(cb, extraSelector) {
        if (hasDocument)
          [].forEach.call(document.querySelectorAll('script[type="systemjs-importmap"]' + extraSelector), cb);
      }

      /*
       * Supports loading System.register via script tag injection
       */

      var systemRegister = systemJSPrototype.register;
      systemJSPrototype.register = function (deps, declare) {
        systemRegister.call(this, deps, declare);
      };

      systemJSPrototype.createScript = function (url) {
        var script = document.createElement('script');
        script.charset = 'utf-8';
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = url;
        return script;
      };

      var lastWindowErrorUrl, lastWindowError;
      systemJSPrototype.instantiate = function (url, firstParentUrl) {
        var loader = this;
        return new Promise(function (resolve, reject) {
          var script = systemJSPrototype.createScript(url);
          script.addEventListener('error', function () {
            reject(Error(errMsg(3,  [url, firstParentUrl].join(', ') )));
          });
          script.addEventListener('load', function () {
            document.head.removeChild(script);
            // Note that if an error occurs that isn't caught by this if statement,
            // that getRegister will return null and a "did not instantiate" error will be thrown.
            if (lastWindowErrorUrl === url) {
              reject(lastWindowError);
            }
            else {
              resolve(loader.getRegister());
            }
          });
          document.head.appendChild(script);
        });
      };

      if (hasDocument) {
        window.addEventListener('error', function (evt) {
          lastWindowErrorUrl = evt.filename;
          lastWindowError = evt.error;
        });

        window.addEventListener('DOMContentLoaded', loadScriptModules);
        loadScriptModules();
      }


      function loadScriptModules() {
        [].forEach.call(
          document.querySelectorAll('script[type=systemjs-module]'), function (script) {
            if (script.src) {
              System.import(script.src.slice(0, 7) === 'import:' ? script.src.slice(7) : resolveUrl(script.src, baseUrl));
            }
          });
      }

      /*
       * Supports loading System.register in workers
       */

      if (hasSelf && typeof importScripts === 'function')
        systemJSPrototype.instantiate = function (url) {
          var loader = this;
          return Promise.resolve().then(function () {
            importScripts(url);
            return loader.getRegister();
          });
        };

    }());
    });

    unwrapExports(s);

    const SystemJSConstructor = System.constructor;
    Reflect.deleteProperty(globalThis, 'System');
    class SystemJSRealm extends SystemJSConstructor {
        constructor() {
            super(...arguments);
            this[Symbol.toStringTag] = 'Realm';
            /**
             * This is a map for inline module.
             * Key: script:random_number
             * Value: module text
             */
            this.inlineModule = new Map();
            this.lastModuleRegister = null;
            //#endregion
            //#region Realm
            this.runtimeTransformer = (kind, fileName) => ({
                rewrite: (ctx) => {
                    ctx.src = transformAST(ctx.src, kind, fileName);
                    return ctx;
                },
            });
            this.esRealm = Realm.makeRootRealm({
                sloppyGlobals: true,
                transforms: [],
            });
            this.id = 0;
            //#endregion
        }
        //#region System
        /** Create import.meta */
        createContext(url) {
            if (url.startsWith('script:'))
                return this.global.eval('({ url: undefined })');
            return this.global.JSON.parse(JSON.stringify({ url }));
        }
        createScript() {
            throw new Error('Invalid call');
        }
        async prepareImport() { }
        resolve(url, parentUrl) {
            if (this.inlineModule.has(url))
                return url;
            if (this.inlineModule.has(parentUrl))
                parentUrl = this.global.location.href;
            return new URL(url, parentUrl).toJSON();
        }
        async instantiate(url) {
            const evalSourceText = (sourceText, src, prebuilt) => {
                const opt = prebuilt ? {} : { transforms: [this.runtimeTransformer('module', src)] };
                const result = this.esRealm.evaluate(sourceText, {}, opt);
                const executor = result;
                executor(this);
            };
            if (this.inlineModule.has(url)) {
                const sourceText = this.inlineModule.get(url);
                evalSourceText(sourceText, url, false);
                return this.getRegister();
            }
            const prebuilt = await this.fetchPrebuilt('module', url);
            if (prebuilt) {
                const { content } = prebuilt;
                evalSourceText(content, url, true);
            }
            else {
                const code = await this.fetchSourceText(url);
                if (!code)
                    throw new TypeError(`Failed to fetch dynamically imported module: ` + url);
                evalSourceText(code, url, false);
                // ? The executor should call the register exactly once.
            }
            return this.getRegister();
        }
        getRegister() {
            return this.lastModuleRegister;
        }
        register(deps, declare, _) {
            if (!Array.isArray(deps))
                throw new TypeError();
            if (typeof declare !== 'function')
                throw new TypeError();
            this.lastModuleRegister = [deps, declare];
        }
        getEvalFileName() {
            return `debugger://${this.global.browser.runtime.id}/VM${++this.id}`;
        }
        get global() {
            return this.esRealm.global;
        }
        /**
         * This function is used to execute script that with dynamic import
         * @param executor The SystemJS format executor returned by the eval call
         * @param scriptURL The script itself URL
         */
        invokeScriptKindSystemJSModule(executor, scriptURL) {
            executor(this); // script mode with dynamic import
            const exportFn = () => {
                throw new SyntaxError(`Unexpected token 'export'`);
            };
            const context = {
                import: (id, self) => this.import(id, self !== null && self !== void 0 ? self : scriptURL),
                get meta() {
                    throw new SyntaxError(`Cannot use 'import.meta' outside a module`);
                },
            };
            return this.lastModuleRegister[1](exportFn, context).execute();
        }
        async evaluateScript(path, parentUrl) {
            const scriptURL = await this.resolve(path, parentUrl);
            const prebuilt = await this.fetchPrebuilt('script', scriptURL);
            if (prebuilt) {
                const { asSystemJS, content } = prebuilt;
                const executeResult = this.esRealm.evaluate(content);
                if (!asSystemJS)
                    return executeResult; // script mode
                return this.invokeScriptKindSystemJSModule(executeResult, scriptURL);
            }
            const sourceText = await this.fetchSourceText(scriptURL);
            if (!sourceText)
                throw new Error('Failed to fetch script ' + scriptURL);
            return this.evaluateInlineScript(sourceText, scriptURL);
        }
        async evaluateModule(path, parentUrl) {
            return this.import(path, parentUrl);
        }
        /**
         * Evaluate a inline ECMAScript module
         * @param sourceText Source text
         */
        async evaluateInlineModule(sourceText) {
            var _a;
            const key = `script:` + Math.random().toString();
            this.inlineModule.set(key, sourceText);
            try {
                return await this.import(key);
            }
            finally {
                this.inlineModule.delete(key);
                (_a = this.delete) === null || _a === void 0 ? void 0 : _a.call(this, key);
            }
        }
        /**
         * This function will run code in ECMAScript Script parsing mode
         * which doesn't support static import/export or import.meta.
         *
         * But support dynamic import
         * @param sourceText Source code
         * @param scriptURL Script URL (optional)
         */
        evaluateInlineScript(sourceText, scriptURL = this.getEvalFileName()) {
            const hasCache = scriptTransformCache.has(sourceText);
            const cache = scriptTransformCache.get(sourceText);
            const transformer = { transforms: [this.runtimeTransformer('script', scriptURL)] };
            if (!checkDynamicImport(sourceText)) {
                if (hasCache)
                    return this.esRealm.evaluate(cache);
                return this.esRealm.evaluate(sourceText, {}, transformer);
            }
            const executor = (hasCache
                ? this.esRealm.evaluate(cache)
                : this.esRealm.evaluate(sourceText, {}, transformer));
            return this.invokeScriptKindSystemJSModule(executor, scriptURL);
        }
    }

    function enhancedWorker(extensionID, originalWorker = window.Worker) {
        if (!isDebug)
            return originalWorker;
        return new Proxy(originalWorker, {
            construct(target, args, newTarget) {
                args[0] = debugModeURLRewrite(extensionID, args[0]);
                return Reflect.construct(target, args, newTarget);
            },
        });
    }

    const cachedPropertyDescriptor = new WeakMap();
    /**
     * This function can clone a new object with custom descriptors but keep internal slot forwarding.
     * @param cachedPropertyDescriptor A WeakMap. Used to store previously cloned prototype.
     * @param original Original object
     * @param realm Target realm
     * @param traps Traps
     */
    function cloneObjectWithInternalSlot(original, realm, traps) {
        var _a, _b, _c;
        const ownDescriptor = (_a = traps.designatedOwnDescriptors) !== null && _a !== void 0 ? _a : Object.getOwnPropertyDescriptors(original);
        const prototypeChain = getPrototypeChain(original);
        if (!cachedPropertyDescriptor.has(realm))
            cachedPropertyDescriptor.set(realm, new Map());
        const cacheMap = cachedPropertyDescriptor.get(realm);
        const newProto = prototypeChain.reduceRight((previous, current) => {
            var _a, _b;
            if (cacheMap.has(current))
                return cacheMap.get(current);
            const desc = Object.getOwnPropertyDescriptors(current);
            const obj = Object.create(previous, PatchThisOfDescriptors((_b = (_a = traps.descriptorsModifier) === null || _a === void 0 ? void 0 : _a.call(traps, current, desc)) !== null && _b !== void 0 ? _b : desc, original));
            cacheMap.set(current, obj);
            return obj;
        }, {});
        const next = traps.nextObject || Object.create(null);
        Object.defineProperties(next, PatchThisOfDescriptors((_c = (_b = traps.descriptorsModifier) === null || _b === void 0 ? void 0 : _b.call(traps, next, ownDescriptor)) !== null && _c !== void 0 ? _c : ownDescriptor, original));
        Object.setPrototypeOf(next, newProto);
        return next;
    }
    /**
     * Recursively get the prototype chain of an Object
     * @param o Object
     */
    function getPrototypeChain(o, _ = []) {
        if (o === undefined || o === null)
            return _;
        const y = Object.getPrototypeOf(o);
        if (y === null || y === undefined || y === Object.prototype || y === Function.prototype)
            return _;
        return getPrototypeChain(y, [..._, y]);
    }
    /**
     * Many native methods requires `this` points to a native object
     * Like `alert()`. If you call alert as `const w = { alert }; w.alert()`,
     * there will be an Illegal invocation.
     *
     * To prevent `this` binding lost, we need to rebind it.
     *
     * @param desc PropertyDescriptor
     * @param native The native object
     */
    function PatchThisOfDescriptorToNative(desc, native) {
        const { get, set, value } = desc;
        if (get)
            desc.get = () => get.apply(native);
        if (set)
            desc.set = (val) => set.apply(native, val);
        if (value && typeof value === 'function') {
            const desc2 = Object.getOwnPropertyDescriptors(value);
            desc.value = function () {
                if (new.target)
                    return Reflect.construct(value, arguments, new.target);
                return Reflect.apply(value, native, arguments);
            };
            delete desc2.arguments;
            delete desc2.caller;
            delete desc2.callee;
            Object.defineProperties(desc.value, desc2);
            try {
                // ? For unknown reason this fail for some objects on Safari.
                value.prototype && Object.setPrototypeOf(desc.value, value.prototype);
            }
            catch { }
        }
    }
    function PatchThisOfDescriptors(desc, native) {
        const _ = Object.entries(desc).map(([x, y]) => [x, { ...y }]);
        _.forEach(x => PatchThisOfDescriptorToNative(x[1], native));
        return Object.fromEntries(_);
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
        Reflect.deleteProperty(webAPIs, 'globalThis');
        Reflect.deleteProperty(webAPIs, 'self');
        Reflect.deleteProperty(webAPIs, 'global');
        return (sandboxRoot, locationProxy) => {
            const sandboxDocument = cloneObjectWithInternalSlot(document, sandboxRoot, {
                descriptorsModifier(obj, desc) {
                    if ('defaultView' in desc)
                        desc.defaultView.get = () => sandboxRoot;
                    return desc;
                },
            });
            const clonedWebAPIs = {
                ...webAPIs,
                window: { configurable: false, writable: false, enumerable: true, value: sandboxRoot },
                document: { configurable: false, enumerable: true, get: () => sandboxDocument },
            };
            if (locationProxy)
                clonedWebAPIs.location.value = locationProxy;
            for (const key in clonedWebAPIs)
                if (key in sandboxRoot)
                    delete clonedWebAPIs[key];
            Object.assign(sandboxRoot, { globalThis: sandboxRoot, self: sandboxRoot });
            cloneObjectWithInternalSlot(realWindow, sandboxRoot, {
                nextObject: sandboxRoot,
                designatedOwnDescriptors: clonedWebAPIs,
            });
        };
    })();
    /**
     * Execution environment of managed Realm (including content script in production and all env in runtime).
     */
    class WebExtensionManagedRealm extends SystemJSRealm {
        /**
         * Create a new running extension for an content script.
         * @param extensionID The extension ID
         * @param manifest The manifest of the extension
         */
        constructor(extensionID, manifest, locationProxy) {
            super();
            this.extensionID = extensionID;
            this.manifest = manifest;
            console.log('[WebExtension] Managed Realm created.');
            PrepareWebAPIs(this.global, locationProxy);
            const browser = BrowserFactory(this.extensionID, this.manifest, this.global.Object.prototype);
            Object.defineProperty(this.global, 'browser', {
                // ? Mozilla's polyfill may overwrite this. Figure this out.
                get: () => browser,
                set: () => false,
            });
            this.global.URL = enhanceURL(this.global.URL, extensionID);
            this.global.fetch = createFetch(extensionID);
            this.global.open = openEnhanced(extensionID);
            this.global.close = closeEnhanced(extensionID);
            this.global.Worker = enhancedWorker(extensionID);
            if (locationProxy)
                this.global.location = locationProxy;
            function globalThisFix() {
                var originalFunction = Function;
                function newFunction(...args) {
                    const fn = new originalFunction(...args);
                    return new Proxy(fn, {
                        apply(a, b, c) {
                            return Reflect.apply(a, b || globalThis, c);
                        },
                    });
                }
                // @ts-ignore
                globalThis.Function = newFunction;
            }
            this.esRealm.evaluate(globalThisFix.toString() + '\n' + globalThisFix.name + '()');
        }
        async fetchPrebuilt(kind, url) {
            const res = await this.fetchSourceText(url + `.prebuilt-${PrebuiltVersion}-${kind}`);
            if (!res)
                return null;
            if (kind === 'module')
                return { content: res, asSystemJS: true };
            const [flag] = res;
            return { content: res.slice(1), asSystemJS: flag === 'd' };
        }
        async fetchSourceText(url) {
            const res = await getResourceAsync(this.extensionID, {}, url);
            if (res)
                return res;
            return null;
        }
    }

    function hookedHTMLScriptElementSrc(extensionID, manifest, currentPage) {
        const src = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
        Object.defineProperty(HTMLScriptElement.prototype, 'src', {
            get() {
                return src.get.call(this);
            },
            set(path) {
                console.debug('script src=', path);
                const kind = this.type === 'module' ? 'module' : 'script';
                RunInProtocolScope(extensionID, manifest, { type: 'file', path }, currentPage, kind);
                this.dataset.src = path;
                return true;
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
        return { ...orig, configurable: true };
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
                    createManagedECMAScriptRealm(manifest, extensionID, preloadedResources, debugModeURL);
                    loadContentScriptByManifest(manifest, extensionID, debugModeURL);
                    break;
                case Environment.protocolPage:
                    prepareExtensionProtocolEnvironment(extensionID, manifest);
                    if (isDebug)
                        loadProtocolPageByManifest(extensionID, manifest, preloadedResources, debugModeURL);
                    break;
                case Environment.backgroundScript:
                    prepareExtensionProtocolEnvironment(extensionID, manifest);
                    await untilDocumentReady();
                    await loadBackgroundScriptByManifest(manifest, extensionID, preloadedResources);
                    break;
                case Environment.contentScript:
                    if (registeredWebExtension.has(extensionID))
                        return registeredWebExtension;
                    createManagedECMAScriptRealm(manifest, extensionID, preloadedResources, debugModeURL);
                    await untilDocumentReady();
                    await loadContentScriptByManifest(manifest, extensionID);
                    break;
                default:
                    console.warn(`[WebExtension] unknown running environment ${environment}`);
            }
        }
        catch (e) {
            if (isDebug)
                throw e;
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
    function getContext(manifest) {
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
            document.addEventListener('readystatechange', () => document.readyState === 'complete' && resolve());
        });
    }
    async function loadProtocolPageByManifest(extensionID, manifest, preloadedResources, loadingPageURL) {
        loadingPageURL = new URL(loadingPageURL, getPrefix(extensionID)).toJSON();
        hookedHTMLScriptElementSrc(extensionID, manifest, loadingPageURL);
        await loadProtocolPageToCurrentPage(extensionID, manifest, preloadedResources, loadingPageURL);
    }
    async function loadBackgroundScriptByManifest(manifest, extensionID, preloadedResources) {
        if (!manifest.background)
            return;
        const { page, scripts } = manifest.background;
        if (!isDebug && location.protocol !== 'holoflows-extension:') {
            throw new TypeError(`Background script only allowed in localhost(for debugging) and holoflows-extension://`);
        }
        let currentPage = getPrefix(extensionID) + '_generated_background_page.html';
        if (page) {
            if (scripts && scripts.length)
                throw new TypeError(`In the manifest, you can't have both "page" and "scripts" for background field!`);
            const pageURL = new URL(page, location.origin);
            if (pageURL.origin !== location.origin)
                throw new TypeError(`You can not specify a foreign origin for the background page`);
            currentPage = getPrefix(extensionID) + page;
        }
        hookedHTMLScriptElementSrc(extensionID, manifest, currentPage);
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
                // ? Run it in global scope.
                await RunInProtocolScope(extensionID, manifest, { path, type: 'file' }, currentPage, 'script');
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
            return [path, script.type === 'module' ? 'module' : 'script'];
        }));
        for (const c of document.head.children)
            c.remove();
        for (const c of dom.head.children)
            document.head.appendChild(c);
        for (const c of document.body.children)
            c.remove();
        for (const c of dom.body.children)
            document.body.appendChild(c);
        for (const [path, kind] of scripts) {
            await RunInProtocolScope(extensionID, manifest, { path, type: 'file' }, new URL(page, getPrefix(extensionID)).toJSON(), kind);
        }
    }
    function prepareExtensionProtocolEnvironment(extensionID, manifest) {
        Object.assign(window, {
            browser: BrowserFactory(extensionID, manifest, Object.prototype),
            fetch: createFetch(extensionID),
            URL: enhanceURL(URL, extensionID),
            open: openEnhanced(extensionID),
            close: closeEnhanced(extensionID),
            Worker: enhancedWorker(extensionID),
        });
    }
    /**
     * Run code in holoflows-extension://extensionID/path
     * @param extensionID Extension ID
     * @param manifest Manifest
     * @param code Source code
     * @param currentPage Current page URL
     */
    async function RunInProtocolScope(extensionID, manifest, code, currentPage, kind) {
        const esModule = kind === 'module';
        if (location.protocol === 'holoflows-extension:') {
            const script = document.createElement('script');
            script.type = esModule ? 'module' : 'text/javascript';
            if (code.type === 'file')
                script.src = code.path;
            else
                script.innerHTML = code.source;
            script.defer = true;
            document.body.appendChild(script);
            return;
        }
        if (!isDebug)
            throw new TypeError('Run in the wrong scope');
        const { src } = parseDebugModeURL(extensionID, manifest);
        const locationProxy = createLocationProxy(extensionID, manifest, currentPage || src);
        // ? Transform ESM into SystemJS to run in debug mode.
        const _ = Reflect.get(globalThis, 'env') ||
            (console.log('Debug by globalThis.env'), new WebExtensionManagedRealm(extensionID, manifest, locationProxy));
        Object.assign(globalThis, { env: _ });
        if (code.type === 'file') {
            if (esModule)
                await _.evaluateModule(code.path, currentPage);
            else
                await _.evaluateScript(code.path, currentPage);
        }
        else {
            if (esModule)
                await _.evaluateInlineModule(code.source);
            else
                await _.evaluateInlineScript(code.source);
        }
    }
    function createManagedECMAScriptRealm(manifest, extensionID, preloadedResources, debugModePretendedURL) {
        if (!registeredWebExtension.has(extensionID)) {
            const environment = new WebExtensionManagedRealm(extensionID, manifest, debugModePretendedURL ? createLocationProxy(extensionID, manifest, debugModePretendedURL) : undefined);
            const ext = {
                manifest,
                environment,
                preloadedResources,
            };
            registeredWebExtension.set(extensionID, ext);
        }
    }
    async function loadContentScriptByManifest(manifest, extensionID, debugModePretendedURL) {
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
            warnNotImplementedManifestElement(content, index);
            if (matchingURL(new URL(debugModePretendedURL || location.href), content.matches, content.exclude_matches || [], content.include_globs || [], content.exclude_globs || [], content.match_about_blank)) {
                console.debug(`[WebExtension] Loading content script for`, content);
                await loadContentScript(extensionID, content);
            }
            else {
                console.debug(`[WebExtension] URL mismatched. Skip content script for, `, content);
            }
        }
    }
    async function loadContentScript(extensionID, content) {
        const { environment } = registeredWebExtension.get(extensionID);
        for (const path of content.js || []) {
            await environment.evaluateScript(path, getPrefix(extensionID));
        }
    }
    function warnNotImplementedManifestElement(content, index) {
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
                    catch { }
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
    const origFetch$1 = fetch;
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
            // webNavigation won't sent holoflows-extension pages.
            if (obj.src.startsWith('holoflows-'))
                return;
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
                const req = await origFetch$1(debugModeURLRewrite(extensionID, r.url));
                if (req.ok)
                    return {
                        data: { content: await req.text(), mimeType: '', type: 'text' },
                        status: 200,
                        statusText: 'ok',
                    };
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
    // ## Inject here
    if (isDebug) {
        // leaves your id here, and put your extension to /extension/{id}/
        const testIDs = ['eofkdgkhfoebecmamljfaepckoecjhib'];
        // const testIDs = ['griesruigerhuigreuijghrehgerhgerge']
        testIDs.forEach(id => fetch('/extension/' + id + '/manifest.json')
            .then(x => x.text())
            .then(x => {
            console.log(`Loading test WebExtension ${id}. Use globalThis.exts to access env`);
            Object.assign(globalThis, {
                registerWebExtension,
                WebExtensionManagedRealm,
            });
            return registerWebExtension(id, JSON.parse(x));
        })
            .then(v => Object.assign(globalThis, { exts: v })));
    }
    else {
        /** ? Can't delete a global variable */
        Object.assign(globalThis, {
            ts: undefined,
            TypeScript: undefined,
            Realm: undefined,
        });
    }
    /**
     * registerWebExtension(
     *      extensionID: string,
     *      manifest: Manifest,
     *      preloadedResources?: Record<string, string>
     * )
     */

}(Realm, ts));
//# sourceMappingURL=out.js.map
