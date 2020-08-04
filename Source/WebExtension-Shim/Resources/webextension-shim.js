(function (ts) {
    'use strict';

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

    let SamePageDebugChannel = /** @class */ (() => {
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
        return SamePageDebugChannel;
    })();

    /**
     * how webextension-shim communicate with native code.
     */
    const key = 'holoflowsjsonrpc';
    class iOSWebkitChannel {
        constructor() {
            this.listener = [];
            document.addEventListener(key, (e) => {
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

    /**
     * Transform any code to "return" it's last expression value
     * @param context
     */
    function lastExprValue(context) {
        function visit(node) {
            if (ts.isSourceFile(node)) {
                const [last, ...rest] = [...node.statements].reverse();
                if (ts.isExpressionStatement(last)) {
                    return ts.updateSourceFileNode(node, [ts.createReturn(last.expression), ...rest].reverse());
                }
                return node;
            }
            return ts.visitEachChild(node, visit, context);
        }
        return visit;
    }

    const scriptTransformCache = new Map();
    const moduleTransformCache = new Map();
    const PrebuiltVersion = 1;
    /**
     * For scripts, we treat it as a module with no static import/export.
     */
    function transformAST(src, kind, path) {
        const cache = kind === 'module' ? moduleTransformCache : scriptTransformCache;
        if (cache.has(src))
            return cache.get(src);
        const hasDynamicImport = checkDynamicImport(src);
        const scriptBefore = undefined;
        const scriptAfter = [
            thisTransformation,
            ...(hasDynamicImport ? [systemjsNameNoLeakTransformer, lastExprValue] : []),
        ].filter((x) => x);
        const moduleBefore = undefined;
        const moduleAfter = [systemjsNameNoLeakTransformer, lastExprValue].filter((x) => x);
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
                sourceMap: false,
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
                ].filter((x) => x);
                errText += `\n${aroundLines.join('\n')}\n`;
            }
            error.push(new SyntaxError(errText));
        }
        if (error[0])
            throw error[0];
        cache.set(src, out.outputText);
        return out.outputText;
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
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

    function static_eval_generated() {
        var _a;
        // @ts-ignore
        const value = (function () {
            if (arguments[0]) {
                return function () {
                    throw '';
                }.call(undefined);
            }
            // @ts-ignore
        })(getProxy());
        function getProxy() {
            const { get, set } = Reflect;
            const currentExtensionGlobal = Symbol.for('GLOBAL_SCOPE');
            const global = get(globalThis, currentExtensionGlobal);
            return new Proxy({ __proto__: null }, {
                get(shadow, prop) {
                    if (typeof prop === 'symbol') {
                        return undefined;
                    }
                    return get(global, prop);
                },
                set: (shadow, prop, value) => set(global, prop, value),
                has: () => true,
                getPrototypeOf: () => null,
            });
        }
        // Async eval completion
        // @ts-ignore
        (_a = globalThis[Symbol.for('CALLBACK_HERE')]) === null || _a === void 0 ? void 0 : _a.call(globalThis, value);
        // sync eval completion
        return value;
    }
    function generateEvalString(code, globalScopeSymbol, callbackSymbol) {
        let x = static_eval_generated.toString();
        x = replace(x, 'if (arguments[0])', 'with (arguments[0])');
        x = replace(x, 'GLOBAL_SCOPE', globalScopeSymbol.description);
        x = replace(x, 'CALLBACK_HERE', callbackSymbol.description);
        x = replace(x, `throw ''`, code + '\n') + ';' + static_eval_generated.name.toString() + '()';
        return x;
    }
    function replace(x, y, z) {
        const pos = x.indexOf(y);
        return x.slice(0, pos) + z + x.slice(pos + y.length);
    }

    var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to get private field on non-instance");
        }
        return privateMap.get(receiver);
    };
    var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to set private field on non-instance");
        }
        privateMap.set(receiver, value);
        return value;
    };
    var _globalScopeSymbol, _globalThis, _inlineModule, _runtimeTransformer, _evaluate, _id, _getEvalFileName;
    const SystemJSConstructor = System.constructor;
    Reflect.deleteProperty(globalThis, 'System');
    const { set, construct, apply, deleteProperty } = Reflect;
    const { warn, trace } = console;
    const { eval: indirectEval } = globalThis;
    const canUseEval = (() => {
        try {
            indirectEval('Math.random()');
            return true;
        }
        catch {
            return false;
        }
    })();
    let __debug_reproducible_id = 0;
    function randSymbol(key) {
        if (isDebug)
            return Symbol.for(key + ++__debug_reproducible_id);
        return Symbol.for(Math.random().toString(16));
    }
    class SystemJSRealm extends SystemJSConstructor {
        // The import() function is implemented by SystemJS
        //#endregion
        constructor() {
            super();
            //#region Realm
            this[Symbol.toStringTag] = 'Realm';
            _globalScopeSymbol.set(this, randSymbol('realm'));
            _globalThis.set(this, {
                __proto__: null,
                /**
                 * Due to tech limitation, the eval will always be
                 * PerformEval(code,
                 *      callerRealm = this SystemJSRealm,
                 *      strictCaller = false,
                 *      direct = false)
                 */
                eval: (code) => {
                    // 18.2.1.1, step 2
                    if (typeof code !== 'string')
                        return code;
                    trace(`[WebExtension] Try to eval`, code);
                    if (!checkDynamicImport(code))
                        // Might be a Promise if the host enable CSP.
                        return __classPrivateFieldGet(this, _evaluate).call(this, code, [__classPrivateFieldGet(this, _runtimeTransformer).call(this, 'script', 'prebuilt', false)]);
                    // Sadly, must return a Promise here.
                    return this.evaluateInlineScript(code);
                },
                Function: new Proxy(Function, {
                    construct: (target, argArray, newTarget) => {
                        trace('[WebExtension] try to call new Function the following code:', ...argArray);
                        if (argArray.length === 1 && argArray[0] === 'return this')
                            return () => this.globalThis;
                        // TODO: impl this
                        throw new Error('Cannot run code dynamically');
                        // return construct(target, argArray, newTarget)
                    },
                    apply: (target, thisArg, code) => {
                        // Hack for babel regeneratorRuntime
                        if (code.length === 1 && code[0] === 'return this')
                            return () => this.globalThis;
                        if (code.length === 2 && code[0] === 'r' && code[1] === 'regeneratorRuntime = r')
                            // @ts-ignore
                            return (r) => (this.globalThis.regeneratorRuntime = r);
                        warn('[WebExtension]: try to construct Function by the following code:', ...code);
                        throw new Error('Cannot run code dynamically');
                        // return apply(target, thisArg, code)
                    },
                }),
            });
            /**
             * This is a map for inline module.
             * Key: script:random_number
             * Value: module text
             */
            _inlineModule.set(this, new Map());
            this.lastModuleRegister = null;
            //#endregion
            //#region Realm
            _runtimeTransformer.set(this, (kind, fileName, prebuilt) => (src) => prebuilt ? src : transformAST(src, kind, fileName));
            _evaluate.set(this, (sourceText, transformer) => {
                const evalCallbackID = randSymbol('callback');
                let rejection = (e) => { };
                const evaluation = new Promise((resolve, reject) => set(globalThis, evalCallbackID, (x) => {
                    resolve(x);
                    rejection = reject;
                }));
                evaluation.finally(() => deleteProperty(globalThis, evalCallbackID));
                transformer === null || transformer === void 0 ? void 0 : transformer.forEach((f) => (sourceText = f(sourceText)));
                const evalString = generateEvalString(sourceText, __classPrivateFieldGet(this, _globalScopeSymbol), evalCallbackID);
                if (canUseEval) {
                    return indirectEval(evalString);
                }
                setTimeout(rejection, 2000);
                return FrameworkRPC.eval('', evalString).then(() => evaluation, (e) => (rejection(e), evaluation));
            });
            _id.set(this, 0);
            _getEvalFileName.set(this, () => `debugger://${this.globalThis.browser.runtime.id}/VM${__classPrivateFieldSet(this, _id, +__classPrivateFieldGet(this, _id) + 1)}`
            /**
             * This function is used to execute script that with dynamic import
             * @param executor The SystemJS format executor returned by the eval call
             * @param scriptURL The script itself URL
             */
            );
            set(globalThis, __classPrivateFieldGet(this, _globalScopeSymbol), this.globalThis);
        }
        get globalThis() {
            return __classPrivateFieldGet(this, _globalThis);
        }
        //#region System
        /** Create import.meta */
        createContext(url) {
            if (url.startsWith('script:'))
                return this.globalThis.JSON.parse(JSON.stringify({ url: null }));
            return this.globalThis.JSON.parse(JSON.stringify({ url }));
        }
        createScript() {
            throw new Error('Invalid call');
        }
        async prepareImport() { }
        resolve(url, parentUrl) {
            if (__classPrivateFieldGet(this, _inlineModule).has(url))
                return url;
            if (__classPrivateFieldGet(this, _inlineModule).has(parentUrl))
                parentUrl = this.globalThis.location.href;
            return new URL(url, parentUrl).toJSON();
        }
        async instantiate(url) {
            const evalSourceText = async (sourceText, src, prebuilt) => {
                const result = await __classPrivateFieldGet(this, _evaluate).call(this, sourceText, [__classPrivateFieldGet(this, _runtimeTransformer).call(this, 'module', src, prebuilt)]);
                const executor = result;
                executor(this);
            };
            if (__classPrivateFieldGet(this, _inlineModule).has(url)) {
                const sourceText = __classPrivateFieldGet(this, _inlineModule).get(url);
                await evalSourceText(sourceText, url, false);
                return this.getRegister();
            }
            const prebuilt = await this.fetchPrebuilt('module', url);
            if (prebuilt) {
                const { content } = prebuilt;
                await evalSourceText(content, url, true);
            }
            else {
                const code = await this.fetchSourceText(url);
                if (!code)
                    throw new TypeError(`Failed to fetch dynamically imported module: ` + url);
                await evalSourceText(code, url, false);
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
                const executeResult = (await __classPrivateFieldGet(this, _evaluate).call(this, content));
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
         *
         * @deprecated This method is not compatible with CSP and might be rejected by the host.
         */
        async evaluateInlineModule(sourceText) {
            var _a;
            const key = `script:` + randSymbol('script-id').description;
            __classPrivateFieldGet(this, _inlineModule).set(key, sourceText);
            try {
                return await this.import(key);
            }
            finally {
                __classPrivateFieldGet(this, _inlineModule).delete(key);
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
         *
         * @deprecated This method is not compatible with CSP and might be rejected by the host.
         */
        async evaluateInlineScript(sourceText, scriptURL = __classPrivateFieldGet(this, _getEvalFileName).call(this)) {
            const hasCache = scriptTransformCache.has(sourceText);
            const cache = scriptTransformCache.get(sourceText);
            const transformer = [__classPrivateFieldGet(this, _runtimeTransformer).call(this, 'script', scriptURL, false)];
            if (!checkDynamicImport(sourceText)) {
                if (hasCache)
                    return __classPrivateFieldGet(this, _evaluate).call(this, cache);
                return __classPrivateFieldGet(this, _evaluate).call(this, sourceText, transformer);
            }
            const executor = (hasCache ? await __classPrivateFieldGet(this, _evaluate).call(this, cache) : await __classPrivateFieldGet(this, _evaluate).call(this, sourceText, transformer));
            return this.invokeScriptKindSystemJSModule(executor, scriptURL);
        }
    }
    _globalScopeSymbol = new WeakMap(), _globalThis = new WeakMap(), _inlineModule = new WeakMap(), _runtimeTransformer = new WeakMap(), _evaluate = new WeakMap(), _id = new WeakMap(), _getEvalFileName = new WeakMap();

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
     * @param descriptor PropertyDescriptor
     * @param native The native object
     */
    function PatchThisOfDescriptorToNative(descriptor, native) {
        const { get, set, value } = descriptor;
        if (get)
            descriptor.get = () => get.apply(native);
        if (set)
            descriptor.set = (val) => set.apply(native, val);
        if (value && typeof value === 'function') {
            const nextDescriptor = Object.getOwnPropertyDescriptors(value);
            const f = {
                [value.name]: function () {
                    if (new.target)
                        return Reflect.construct(value, arguments, new.target);
                    return Reflect.apply(value, native, arguments);
                },
            }[value.name];
            descriptor.value = f;
            // Hmm give it a better view.
            f.toString = ((f) => () => `function ${f}() { [native code] }`)(value.name);
            delete nextDescriptor.arguments;
            delete nextDescriptor.caller;
            delete nextDescriptor.callee;
            Object.defineProperties(f, nextDescriptor);
            Object.setPrototypeOf(f, value.__proto__);
        }
    }
    function PatchThisOfDescriptors(desc, native) {
        const _ = Object.entries(desc).map(([x, y]) => [x, { ...y }]);
        Object.getOwnPropertySymbols(desc).forEach((x) => _.push([x, { ...desc[x] }]));
        _.forEach((x) => PatchThisOfDescriptorToNative(x[1], native));
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
     * - [ ] Main thread cannot access ContentScript
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
        // We're no longer using realms now.
        // Object.defineProperty(
        //     Object.getPrototypeOf(() => {}),
        //     'constructor',
        //     {
        //         value: globalThis.Function,
        //     },
        // )
        const realWindow = window;
        const webAPIs = Object.getOwnPropertyDescriptors(window);
        return (sandboxRoot, locationProxy) => {
            // ?
            // const sandboxDocument = cloneObjectWithInternalSlot(document, sandboxRoot, {
            //     descriptorsModifier(obj, desc) {
            //         if ('defaultView' in desc) desc.defaultView.get = () => sandboxRoot
            //         return desc
            //     },
            // })
            const clonedWebAPIs = {
                ...webAPIs,
            };
            for (const key in clonedWebAPIs)
                if (clonedWebAPIs[key].value === globalThis)
                    clonedWebAPIs[key].value = sandboxRoot;
            if (locationProxy)
                clonedWebAPIs.location.value = locationProxy;
            for (const key in clonedWebAPIs)
                if (key in sandboxRoot)
                    delete clonedWebAPIs[key];
            cloneObjectWithInternalSlot(realWindow, sandboxRoot, {
                nextObject: sandboxRoot,
                designatedOwnDescriptors: clonedWebAPIs,
            });
            // restore the identity continuity
            sandboxRoot.Object = Object;
            sandboxRoot.Function = Function;
        };
    })();
    const { log, warn: warn$1 } = console;
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
            log('[WebExtension] Managed Realm created.');
            PrepareWebAPIs(this.globalThis, locationProxy);
            const browser = BrowserFactory(this.extensionID, this.manifest, this.globalThis.Object.prototype);
            Object.defineProperty(this.globalThis, 'browser', {
                // ? Mozilla's polyfill may overwrite this. Figure this out.
                get: () => browser,
                set: () => false,
            });
            this.globalThis.URL = enhanceURL(this.globalThis.URL, extensionID);
            this.globalThis.fetch = createFetch(extensionID);
            this.globalThis.open = openEnhanced(extensionID);
            this.globalThis.close = closeEnhanced(extensionID);
            this.globalThis.Worker = enhancedWorker(extensionID);
            if (locationProxy)
                this.globalThis.location = locationProxy;
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
            const g = () => registeredWebExtension.get(extensionID);
            Object.defineProperties(globalThis, {
                ['e' + extensionID]: { get: () => g() },
                ['r' + extensionID]: { get: () => g().environment },
                ['g' + extensionID]: { get: () => g().environment.globalThis },
            });
            console.log(`Extension ${extensionID} registered. Access it's WebExtensionRecord by e${extensionID}; it's Realm by r${extensionID}; it's globalThis object by g${extensionID}`);
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
                    useInternalStorage(extensionID, (o) => {
                        const handlers = Array.from(installHandler.values());
                        if (o.previousVersion)
                            handlers.forEach((x) => x({ previousVersion: o.previousVersion, reason: 'update' }));
                        else
                            handlers.forEach((x) => x({ reason: 'install' }));
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
        return new Promise((resolve) => {
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
        // ? Transform ESM into SystemJS to run in debug mode.
        const _ = createManagedECMAScriptRealm(manifest, extensionID, {}, currentPage || src).environment;
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
        return registeredWebExtension.get(extensionID);
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

    var _a;
    const log$1 = (rt) => async (...args) => {
        console.log('Mocked Host', ...args);
        return rt;
    };
    const myTabID = parseInt((_a = new URLSearchParams(location.search).get('id')) !== null && _a !== void 0 ? _a : ~~(Math.random() * 100));
    class CrossPageDebugChannel {
        constructor() {
            this.tabsQuery = new BroadcastChannel('query-tabs');
            this.broadcast = new BroadcastChannel('webext-polyfill-debug');
            this.listener = [];
            this.broadcast.addEventListener('message', (e) => {
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
            this.tabsQuery.addEventListener('message', (e) => {
                if (e.origin !== location.origin)
                    console.warn(e.origin, location.origin);
                if (e.data === 'req')
                    this.tabsQuery.postMessage({ id: myTabID });
            });
        }
        queryTabs() {
            return new Promise((resolve) => {
                const id = new Set();
                this.tabsQuery.addEventListener('message', (e) => {
                    var _a;
                    if ((_a = e.data) === null || _a === void 0 ? void 0 : _a.id)
                        id.add(e.data.id);
                });
                this.tabsQuery.postMessage('req');
                setTimeout(() => resolve([...id]), 300);
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
        const crossPage = new CrossPageDebugChannel();
        const mockHost = AsyncCall({
            onMessage: ThisSideImplementation.onMessage,
            onCommitted: ThisSideImplementation['browser.webNavigation.onCommitted'],
        }, {
            key: 'mock',
            log: false,
            messageChannel: crossPage,
        });
        setTimeout(() => {
            const obj = parseDebugModeURL('', { id: myTabID });
            // webNavigation won't sent holoflows-extension pages.
            if (obj.src.startsWith('holoflows-'))
                return;
            mockHost.onCommitted({ tabId: myTabID, url: obj.src });
        }, 2000);
        const host = {
            'URL.createObjectURL': log$1(void 0),
            'URL.revokeObjectURL': log$1(void 0),
            'browser.downloads.download': log$1(void 0),
            async sendMessage(e, t, tt, m, mm) {
                mockHost.onMessage(e, t, m, mm, { id: myTabID });
            },
            'browser.storage.local.clear': log$1(void 0),
            async 'browser.storage.local.get'(extensionID, k) {
                return (await useInternalStorage(extensionID)).debugModeStorage || {};
            },
            'browser.storage.local.remove': log$1(void 0),
            async 'browser.storage.local.set'(extensionID, d) {
                useInternalStorage(extensionID, (o) => (o.debugModeStorage = Object.assign({}, o.debugModeStorage, d)));
            },
            async 'browser.tabs.create'(extensionID, options) {
                if (!options.url)
                    throw new TypeError('need a url');
                const a = document.createElement('a');
                a.href = debugModeURLRewrite(extensionID, options.url);
                const param = new URLSearchParams();
                param.set('url', options.url);
                param.set('type', options.url.startsWith('holoflows-extension://') ? 'p' : 'm');
                const id = ~~(Math.random() * 100);
                param.set('id', id.toString());
                a.href = '/?' + param;
                a.innerText = 'browser.tabs.create: Please click to open it: ' + options.url;
                a.target = '_blank';
                a.style.color = 'white';
                document.body.appendChild(a);
                return { id };
            },
            'browser.tabs.query': () => crossPage.queryTabs().then((x) => x.map((id) => ({ id }))),
            'browser.tabs.remove': log$1(void 0),
            'browser.tabs.update': log$1({}),
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
            async eval(eid, string) {
                const x = eval;
                try {
                    x(string);
                }
                catch (e) {
                    console.log(string);
                    console.error(e);
                    throw e;
                }
            },
        };
        AsyncCall(host, {
            key: '',
            log: false,
            messageChannel: new SamePageDebugChannel('server'),
        });
    }

    console.log('Loading dependencies from external', ts);
    // ## Inject here
    if (isDebug) {
        // leaves your id here, and put your extension to /extension/{id}/
        const testIDs = ['eofkdgkhfoebecmamljfaepckoecjhib'];
        // const testIDs = ['eofkdgkhfoebecmamljfaepckoecjhib', 'griesruigerhuigreuijghrehgerhgerge']
        // const testIDs = ['griesruigerhuigreuijghrehgerhgerge']
        testIDs.forEach((id) => fetch('/extension/' + id + '/manifest.json')
            .then((x) => x.text())
            .then((x) => registerWebExtension(id, JSON.parse(x))));
    }
    else {
        /** ? Can't delete a global variable */
        Object.assign(globalThis, {
            ts: undefined,
            TypeScript: undefined,
        });
    }
    /**
     * registerWebExtension(
     *      extensionID: string,
     *      manifest: Manifest,
     *      preloadedResources?: Record<string, string>
     * )
     */

}(ts));
//# sourceMappingURL=out.js.map
