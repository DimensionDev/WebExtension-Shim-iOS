(function (Realm, es, ts) {
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
    //# sourceMappingURL=URLMatcher.js.map

    /**
     * Used for keep reference to browser.runtime.onMessage
     */
    const TwoWayMessagePromiseResolver = new Map();
    /**
     * To store listener for Host dispatched events.
     */
    const EventPools = {
        'browser.webNavigation.onCommitted': new Map(),
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
    //# sourceMappingURL=LocalMessages.js.map

    function deepClone(obj) {
        // todo: change another impl plz.
        return JSON.parse(JSON.stringify(obj));
    }
    //# sourceMappingURL=deepClone.js.map

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
            Host.sendMessage(extensionID, toExtensionID, tabId, messageID, {
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
                        Host.sendMessage(toExtensionID, extensionID, sender.tab.id, messageID, {
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
    //# sourceMappingURL=browser.message.js.map

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

    /// <reference path="../node_modules/web-ext-types/global/index.d.ts" />
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
    const ThisSideImplementation = {
        // todo: check dispatch target's manifest
        'browser.webNavigation.onCommitted': dispatchNormalEvent.bind(null, 'browser.webNavigation.onCommitted', '*'),
        async onMessage(extensionID, toExtensionID, messageID, message, sender) {
            switch (message.type) {
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
                case 'executeScript':
                    const ext = registeredWebExtension.get(extensionID);
                    if (message.code)
                        ext.environment.evaluate(message.code);
                    else if (message.file)
                        loadContentScript(extensionID, ext.manifest, {
                            js: [message.file],
                            // TODO: check the permission to inject the script
                            matches: ['<all_urls>'],
                        });
                    break;
                default:
                    break;
            }
        },
        async 'browser.tabs.executeScript'(extensionID, tabID, details) {
            return Host.sendMessage(extensionID, extensionID, tabID, Math.random().toString(), Object.assign(Object.assign({}, details), { type: 'executeScript' }));
        },
    };
    const Host = es.AsyncCall(ThisSideImplementation, {
        key: '',
        log: false,
        messageChannel: isDebug ? new SamePageDebugChannel('client') : new iOSWebkitChannel(),
    });

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
    //# sourceMappingURL=StringOrBlob.js.map

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
            Host['URL.revokeObjectURL'](extensionID, id);
        };
    }
    function createObjectURLEnhanced(extensionID) {
        return (obj) => {
            const url = createObjectURL(obj);
            const resourceID = getIDFromBlobURL(url);
            if (obj instanceof Blob) {
                encodeStringOrBlob(obj).then(blob => Host['URL.createObjectURL'](extensionID, resourceID, blob));
            }
            return url;
        };
    }
    //# sourceMappingURL=URL.create+revokeObjectURL.js.map

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
        const obj = (await Host['browser.storage.local.get'](reservedID, extensionID))[extensionID] || {};
        if (!modify)
            return obj;
        modify(obj);
        Host['browser.storage.local.set'](reservedID, { [extensionID]: obj });
        return obj;
    }
    //# sourceMappingURL=internal.js.map

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
                    await ThisSideImplementation['browser.tabs.executeScript'](extensionID, tabID === undefined ? -1 : tabID, details);
                    return [];
                },
                create: binding(extensionID, 'browser.tabs.create')(),
                async remove(tabID) {
                    let t;
                    if (!Array.isArray(tabID))
                        t = [tabID];
                    else
                        t = tabID;
                    await Promise.all(t.map(x => Host['browser.tabs.remove'](extensionID, x)));
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
        if (Object.keys(obj2).length)
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
            const hostDefinition = Host[key];
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
    //# sourceMappingURL=url-rewrite.js.map

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
                    const result = await Host.fetch(extensionID, { method: request.method, url: url.toJSON() });
                    const data = decodeStringOrBlob(result.data);
                    if (data === null)
                        throw new Error('');
                    const returnValue = new Response(data, result);
                    return returnValue;
                }
            },
        });
    }
    //# sourceMappingURL=fetch.js.map

    let lastUserActive = 0;
    let now = Date.now.bind(Date);
    document.addEventListener('click', () => {
        lastUserActive = now();
    }, { capture: true, passive: true });
    function hasValidUserInteractive() {
        return now() - lastUserActive < 3000;
    }
    //# sourceMappingURL=UserInteractive.js.map

    function openEnhanced(extensionID) {
        return (url = 'about:blank', target, features, replace) => {
            if (!hasValidUserInteractive())
                return null;
            if ((target && target !== '_blank') || features || replace)
                console.warn('Unsupported open', url, target, features, replace);
            Host['browser.tabs.create'](extensionID, {
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
            Host['browser.tabs.query'](extensionID, { active: true }).then(i => Host['browser.tabs.remove'](extensionID, i[0].id));
        };
    }
    //# sourceMappingURL=window.open+close.js.map

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
    //# sourceMappingURL=this-transformer.js.map

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
    //# sourceMappingURL=index.js.map

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
        const response = await fetch(normalizePath(path, extensionID));
        if (response.ok)
            return response.text();
        return undefined;
    }
    //# sourceMappingURL=Resources.js.map

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
    //# sourceMappingURL=Worker.prototype.constructor.js.map

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
        let environment = getContext(manifest, extensionID, preloadedResources);
        let debugModeURL = '';
        if (isDebug) {
            const opt = parseDebugModeURL(extensionID, manifest);
            environment = opt.env;
            debugModeURL = opt.src;
        }
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
        console.debug(`[WebExtension] Loading extension ${manifest.name}(${extensionID}) with manifest`, manifest, `and preloaded resource`, preloadedResources, `in ${environment} mode`);
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
    async function loadContentScript(extensionID, manifest, content, preloadedResources = registeredWebExtension.has(extensionID)
        ? registeredWebExtension.get(extensionID).preloadedResources
        : {}) {
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
    if (isDebug) {
        const mockHost = es.AsyncCall({
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
                a.href = '/debug?' + param;
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
                const h = await getResourceAsync(extensionID, {}, r.url);
                if (h)
                    return { data: { content: h, mimeType: '', type: 'text' }, status: 200, statusText: 'ok' };
                return { data: { content: '', mimeType: '', type: 'text' }, status: 404, statusText: 'Not found' };
            },
        };
        es.AsyncCall(host, {
            key: '',
            log: false,
            messageChannel: new SamePageDebugChannel('server'),
        });
    }
    //# sourceMappingURL=localhost.js.map

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

}(Realm, es, ts));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMvVVJMTWF0Y2hlci50cyIsIi4uL3NyYy91dGlscy9Mb2NhbE1lc3NhZ2VzLnRzIiwiLi4vc3JjL3V0aWxzL2RlZXBDbG9uZS50cyIsIi4uL3NyYy9zaGltcy9icm93c2VyLm1lc3NhZ2UudHMiLCIuLi9zcmMvZGVidWdnZXIvaXNEZWJ1Z01vZGUudHMiLCIuLi9zcmMvUlBDLnRzIiwiLi4vc3JjL3V0aWxzL1N0cmluZ09yQmxvYi50cyIsIi4uL3NyYy9zaGltcy9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTC50cyIsIi4uL3NyYy9pbnRlcm5hbC50cyIsIi4uL3NyYy9zaGltcy9icm93c2VyLnRzIiwiLi4vc3JjL2RlYnVnZ2VyL3VybC1yZXdyaXRlLnRzIiwiLi4vc3JjL3NoaW1zL2ZldGNoLnRzIiwiLi4vc3JjL3V0aWxzL1VzZXJJbnRlcmFjdGl2ZS50cyIsIi4uL3NyYy9zaGltcy93aW5kb3cub3BlbitjbG9zZS50cyIsIi4uL3NyYy90cmFuc2Zvcm1lcnMvdGhpcy10cmFuc2Zvcm1lci50cyIsIi4uL3NyYy90cmFuc2Zvcm1lcnMvaW5kZXgudHMiLCIuLi9zcmMvc2hpbXMvWFJheVZpc2lvbi50cyIsIi4uL3NyYy91dGlscy9SZXNvdXJjZXMudHMiLCIuLi9zcmMvaGlqYWNrcy9IVE1MU2NyaXB0LnByb3RvdHlwZS5zcmMudHMiLCIuLi9zcmMvaGlqYWNrcy9Xb3JrZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yLnRzIiwiLi4vc3JjL2hpamFja3MvbG9jYXRpb24udHMiLCIuLi9zcmMvRXh0ZW5zaW9ucy50cyIsIi4uL3NyYy9kZWJ1Z2dlci9sb2NhbGhvc3QudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDaGVjayBpZiB0aGUgY3VycmVudCBsb2NhdGlvbiBtYXRjaGVzLiBVc2VkIGluIG1hbmlmZXN0Lmpzb24gcGFyc2VyXG4gKiBAcGFyYW0gbG9jYXRpb24gQ3VycmVudCBsb2NhdGlvblxuICogQHBhcmFtIG1hdGNoZXNcbiAqIEBwYXJhbSBleGNsdWRlX21hdGNoZXNcbiAqIEBwYXJhbSBpbmNsdWRlX2dsb2JzXG4gKiBAcGFyYW0gZXhjbHVkZV9nbG9ic1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hpbmdVUkwoXG4gICAgbG9jYXRpb246IFVSTCxcbiAgICBtYXRjaGVzOiBzdHJpbmdbXSxcbiAgICBleGNsdWRlX21hdGNoZXM6IHN0cmluZ1tdLFxuICAgIGluY2x1ZGVfZ2xvYnM6IHN0cmluZ1tdLFxuICAgIGV4Y2x1ZGVfZ2xvYnM6IHN0cmluZ1tdLFxuICAgIGFib3V0X2JsYW5rPzogYm9vbGVhbixcbikge1xuICAgIGxldCByZXN1bHQgPSBmYWxzZVxuICAgIC8vID8gV2UgZXZhbCBtYXRjaGVzIGZpcnN0IHRoZW4gZXZhbCBtaXNtYXRjaGVzXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIG1hdGNoZXMpIGlmIChtYXRjaGVzX21hdGNoZXIoaXRlbSwgbG9jYXRpb24sIGFib3V0X2JsYW5rKSkgcmVzdWx0ID0gdHJ1ZVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBleGNsdWRlX21hdGNoZXMpIGlmIChtYXRjaGVzX21hdGNoZXIoaXRlbSwgbG9jYXRpb24pKSByZXN1bHQgPSBmYWxzZVxuICAgIGlmIChpbmNsdWRlX2dsb2JzLmxlbmd0aCkgY29uc29sZS53YXJuKCdpbmNsdWRlX2dsb2JzIG5vdCBzdXBwb3J0ZWQgeWV0LicpXG4gICAgaWYgKGV4Y2x1ZGVfZ2xvYnMubGVuZ3RoKSBjb25zb2xlLndhcm4oJ2V4Y2x1ZGVfZ2xvYnMgbm90IHN1cHBvcnRlZCB5ZXQuJylcbiAgICByZXR1cm4gcmVzdWx0XG59XG4vKipcbiAqIFN1cHBvcnRlZCBwcm90b2NvbHNcbiAqL1xuY29uc3Qgc3VwcG9ydGVkUHJvdG9jb2xzOiByZWFkb25seSBzdHJpbmdbXSA9IFtcbiAgICAnaHR0cDonLFxuICAgICdodHRwczonLFxuICAgIC8vIFwid3M6XCIsXG4gICAgLy8gXCJ3c3M6XCIsXG4gICAgLy8gXCJmdHA6XCIsXG4gICAgLy8gXCJkYXRhOlwiLFxuICAgIC8vIFwiZmlsZTpcIlxuXVxuZnVuY3Rpb24gbWF0Y2hlc19tYXRjaGVyKF86IHN0cmluZywgbG9jYXRpb246IFVSTCwgYWJvdXRfYmxhbms/OiBib29sZWFuKSB7XG4gICAgaWYgKGxvY2F0aW9uLnRvU3RyaW5nKCkgPT09ICdhYm91dDpibGFuaycgJiYgYWJvdXRfYmxhbmspIHJldHVybiB0cnVlXG4gICAgaWYgKF8gPT09ICc8YWxsX3VybHM+Jykge1xuICAgICAgICBpZiAoc3VwcG9ydGVkUHJvdG9jb2xzLmluY2x1ZGVzKGxvY2F0aW9uLnByb3RvY29sKSkgcmV0dXJuIHRydWVcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGNvbnN0IFtydWxlLCB3aWxkY2FyZFByb3RvY29sXSA9IG5vcm1hbGl6ZVVSTChfKVxuICAgIGlmIChydWxlLnBvcnQgIT09ICcnKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoIXByb3RvY29sX21hdGNoZXIocnVsZS5wcm90b2NvbCwgbG9jYXRpb24ucHJvdG9jb2wsIHdpbGRjYXJkUHJvdG9jb2wpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoIWhvc3RfbWF0Y2hlcihydWxlLmhvc3RuYW1lLCBsb2NhdGlvbi5ob3N0bmFtZSkpIHJldHVybiBmYWxzZVxuICAgIGlmICghcGF0aF9tYXRjaGVyKHJ1bGUucGF0aG5hbWUsIGxvY2F0aW9uLnBhdGhuYW1lLCBsb2NhdGlvbi5zZWFyY2gpKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gdHJ1ZVxufVxuLyoqXG4gKiBOb3JtYWxpemVVUkxcbiAqIEBwYXJhbSBfIC0gVVJMIGRlZmluZWQgaW4gbWFuaWZlc3RcbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplVVJMKF86IHN0cmluZyk6IFtVUkwsIGJvb2xlYW5dIHtcbiAgICBpZiAoXy5zdGFydHNXaXRoKCcqOi8vJykpIHJldHVybiBbbmV3IFVSTChfLnJlcGxhY2UoL15cXCo6LywgJ2h0dHBzOicpKSwgdHJ1ZV1cbiAgICByZXR1cm4gW25ldyBVUkwoXyksIGZhbHNlXVxufVxuZnVuY3Rpb24gcHJvdG9jb2xfbWF0Y2hlcihtYXRjaGVyUHJvdG9jb2w6IHN0cmluZywgY3VycmVudFByb3RvY29sOiBzdHJpbmcsIHdpbGRjYXJkUHJvdG9jb2w6IGJvb2xlYW4pIHtcbiAgICAvLyA/IG9ubHkgYGh0dHA6YCBhbmQgYGh0dHBzOmAgaXMgc3VwcG9ydGVkIGN1cnJlbnRseVxuICAgIGlmICghc3VwcG9ydGVkUHJvdG9jb2xzLmluY2x1ZGVzKGN1cnJlbnRQcm90b2NvbCkpIHJldHVybiBmYWxzZVxuICAgIC8vID8gaWYgd2FudGVkIHByb3RvY29sIGlzIFwiKjpcIiwgbWF0Y2ggZXZlcnl0aGluZ1xuICAgIGlmICh3aWxkY2FyZFByb3RvY29sKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChtYXRjaGVyUHJvdG9jb2wgPT09IGN1cnJlbnRQcm90b2NvbCkgcmV0dXJuIHRydWVcbiAgICByZXR1cm4gZmFsc2Vcbn1cbmZ1bmN0aW9uIGhvc3RfbWF0Y2hlcihtYXRjaGVySG9zdDogc3RyaW5nLCBjdXJyZW50SG9zdDogc3RyaW5nKSB7XG4gICAgLy8gPyAlMkEgaXMgKlxuICAgIGlmIChtYXRjaGVySG9zdCA9PT0gJyUyQScpIHJldHVybiB0cnVlXG4gICAgaWYgKG1hdGNoZXJIb3N0LnN0YXJ0c1dpdGgoJyUyQS4nKSkge1xuICAgICAgICBjb25zdCBwYXJ0ID0gbWF0Y2hlckhvc3QucmVwbGFjZSgvXiUyQS8sICcnKVxuICAgICAgICBpZiAocGFydCA9PT0gY3VycmVudEhvc3QpIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gY3VycmVudEhvc3QuZW5kc1dpdGgocGFydClcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoZXJIb3N0ID09PSBjdXJyZW50SG9zdFxufVxuZnVuY3Rpb24gcGF0aF9tYXRjaGVyKG1hdGNoZXJQYXRoOiBzdHJpbmcsIGN1cnJlbnRQYXRoOiBzdHJpbmcsIGN1cnJlbnRTZWFyY2g6IHN0cmluZykge1xuICAgIGlmICghbWF0Y2hlclBhdGguc3RhcnRzV2l0aCgnLycpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAobWF0Y2hlclBhdGggPT09ICcvKicpIHJldHVybiB0cnVlXG4gICAgLy8gPyAnL2EvYi9jJyBtYXRjaGVzICcvYS9iL2MjMTIzJyBidXQgbm90ICcvYS9iL2M/MTIzJ1xuICAgIGlmIChtYXRjaGVyUGF0aCA9PT0gY3VycmVudFBhdGggJiYgY3VycmVudFNlYXJjaCA9PT0gJycpIHJldHVybiB0cnVlXG4gICAgLy8gPyAnL2EvYi8qJyBtYXRjaGVzIGV2ZXJ5dGhpbmcgc3RhcnRzV2l0aCAnL2EvYi8nXG4gICAgaWYgKG1hdGNoZXJQYXRoLmVuZHNXaXRoKCcqJykgJiYgY3VycmVudFBhdGguc3RhcnRzV2l0aChtYXRjaGVyUGF0aC5zbGljZSh1bmRlZmluZWQsIC0xKSkpIHJldHVybiB0cnVlXG4gICAgaWYgKG1hdGNoZXJQYXRoLmluZGV4T2YoJyonKSA9PT0gLTEpIHJldHVybiBtYXRjaGVyUGF0aCA9PT0gY3VycmVudFBhdGhcbiAgICBjb25zb2xlLndhcm4oJ05vdCBzdXBwb3J0ZWQgcGF0aCBtYXRjaGVyIGluIG1hbmlmZXN0Lmpzb24nLCBtYXRjaGVyUGF0aClcbiAgICByZXR1cm4gdHJ1ZVxufVxuIiwiaW1wb3J0IHsgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uL1JQQydcbnR5cGUgV2ViRXh0ZW5zaW9uSUQgPSBzdHJpbmdcbnR5cGUgTWVzc2FnZUlEID0gc3RyaW5nXG50eXBlIHdlYk5hdmlnYXRpb25PbkNvbW1pdHRlZEFyZ3MgPSBQYXJhbWV0ZXJzPFRoaXNTaWRlSW1wbGVtZW50YXRpb25bJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCddPlxudHlwZSBvbk1lc3NhZ2VBcmdzID0gUGFyYW1ldGVyczxUaGlzU2lkZUltcGxlbWVudGF0aW9uWydvbk1lc3NhZ2UnXT5cbnR5cGUgUG9vbEtleXMgPSAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJyB8ICdicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJyB8ICdicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsJ1xuLyoqXG4gKiBVc2VkIGZvciBrZWVwIHJlZmVyZW5jZSB0byBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlXG4gKi9cbmV4cG9ydCBjb25zdCBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyID0gbmV3IE1hcDxNZXNzYWdlSUQsIFsodmFsOiBhbnkpID0+IGFueSwgKHZhbDogYW55KSA9PiBhbnldPigpXG4vKipcbiAqIFRvIHN0b3JlIGxpc3RlbmVyIGZvciBIb3N0IGRpc3BhdGNoZWQgZXZlbnRzLlxuICovXG5leHBvcnQgY29uc3QgRXZlbnRQb29sczogUmVjb3JkPFBvb2xLZXlzLCBNYXA8V2ViRXh0ZW5zaW9uSUQsIFNldDwoLi4uYXJnczogYW55W10pID0+IGFueT4+PiA9IHtcbiAgICAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJzogbmV3IE1hcCgpLFxuICAgICdicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJzogbmV3IE1hcCgpLFxuICAgICdicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsJzogbmV3IE1hcCgpLFxufVxuLyoqXG4gKiBEaXNwYXRjaCBhIG5vcm1hbCBldmVudCAodGhhdCBub3QgaGF2ZSBhIFwicmVzcG9uc2VcIikuXG4gKiBMaWtlIGJyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGlzcGF0Y2hOb3JtYWxFdmVudChldmVudDogUG9vbEtleXMsIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyB8IHN0cmluZ1tdIHwgJyonLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgIGlmICghRXZlbnRQb29sc1tldmVudF0pIHJldHVyblxuICAgIGZvciAoY29uc3QgW2V4dGVuc2lvbklELCBmbnNdIG9mIEV2ZW50UG9vbHNbZXZlbnRdLmVudHJpZXMoKSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0b0V4dGVuc2lvbklEKSAmJiB0b0V4dGVuc2lvbklELmluZGV4T2YoZXh0ZW5zaW9uSUQpID09PSAtMSkgY29udGludWVcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRvRXh0ZW5zaW9uSUQpICYmIHRvRXh0ZW5zaW9uSUQgIT09IGV4dGVuc2lvbklEICYmIHRvRXh0ZW5zaW9uSUQgIT09ICcqJykgY29udGludWVcbiAgICAgICAgZm9yIChjb25zdCBmIG9mIGZucykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmKC4uLmFyZ3MpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuLyoqXG4gKiBDcmVhdGUgYSBgRXZlbnRPYmplY3Q8TGlzdGVuZXJUeXBlPmAgb2JqZWN0LlxuICpcbiAqIENhbiBiZSBzZXQgb24gYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkIGV0Yy4uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXZlbnRMaXN0ZW5lcihleHRlbnNpb25JRDogc3RyaW5nLCBldmVudDogUG9vbEtleXMpIHtcbiAgICBpZiAoIUV2ZW50UG9vbHNbZXZlbnRdLmhhcyhleHRlbnNpb25JRCkpIHtcbiAgICAgICAgRXZlbnRQb29sc1tldmVudF0uc2V0KGV4dGVuc2lvbklELCBuZXcgU2V0KCkpXG4gICAgfVxuICAgIGNvbnN0IHBvb2wgPSBFdmVudFBvb2xzW2V2ZW50XS5nZXQoZXh0ZW5zaW9uSUQpIVxuICAgIGNvbnN0IGhhbmRsZXI6IEV2ZW50T2JqZWN0PCguLi5hcmdzOiBhbnlbXSkgPT4gYW55PiA9IHtcbiAgICAgICAgYWRkTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgZnVuY3Rpb24nKVxuICAgICAgICAgICAgcG9vbC5hZGQoY2FsbGJhY2spXG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUxpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBwb29sLmRlbGV0ZShjYWxsYmFjaylcbiAgICAgICAgfSxcbiAgICAgICAgaGFzTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBwb29sLmhhcyhsaXN0ZW5lcilcbiAgICAgICAgfSxcbiAgICB9XG4gICAgcmV0dXJuIGhhbmRsZXJcbn1cblxuaW50ZXJmYWNlIEV2ZW50T2JqZWN0PFQgZXh0ZW5kcyAoLi4uYXJnczogYW55W10pID0+IGFueT4ge1xuICAgIGFkZExpc3RlbmVyOiAoY2FsbGJhY2s6IFQpID0+IHZvaWRcbiAgICByZW1vdmVMaXN0ZW5lcjogKGxpc3RlbmVyOiBUKSA9PiB2b2lkXG4gICAgaGFzTGlzdGVuZXI6IChsaXN0ZW5lcjogVCkgPT4gYm9vbGVhblxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGRlZXBDbG9uZTxUPihvYmo6IFQpOiBUIHtcbiAgICAvLyB0b2RvOiBjaGFuZ2UgYW5vdGhlciBpbXBsIHBsei5cbiAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmopKVxufVxuIiwiaW1wb3J0IHsgSG9zdCwgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uL1JQQydcblxuaW1wb3J0IHsgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlciwgRXZlbnRQb29scyB9IGZyb20gJy4uL3V0aWxzL0xvY2FsTWVzc2FnZXMnXG5pbXBvcnQgeyBkZWVwQ2xvbmUgfSBmcm9tICcuLi91dGlscy9kZWVwQ2xvbmUnXG4vKipcbiAqIENyZWF0ZSBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoKSBmdW5jdGlvblxuICogQHBhcmFtIGV4dGVuc2lvbklEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSdW50aW1lU2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHRvRXh0ZW5zaW9uSUQ6IHN0cmluZywgbWVzc2FnZTogdW5rbm93blxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9IGV4dGVuc2lvbklEXG4gICAgICAgICAgICBtZXNzYWdlID0gYXJndW1lbnRzWzBdXG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9IGFyZ3VtZW50c1swXVxuICAgICAgICAgICAgbWVzc2FnZSA9IGFyZ3VtZW50c1sxXVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9ICcnXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbmRNZXNzYWdlV2l0aFJlc3BvbnNlKGV4dGVuc2lvbklELCB0b0V4dGVuc2lvbklELCBudWxsLCBtZXNzYWdlKVxuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBzZW5kTWVzc2FnZVdpdGhSZXNwb25zZTxVPihcbiAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICB0YWJJZDogbnVtYmVyIHwgbnVsbCxcbiAgICBtZXNzYWdlOiB1bmtub3duLFxuKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFU+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgbWVzc2FnZUlEID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygpXG4gICAgICAgIEhvc3Quc2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQsIHRvRXh0ZW5zaW9uSUQsIHRhYklkLCBtZXNzYWdlSUQsIHtcbiAgICAgICAgICAgIHR5cGU6ICdtZXNzYWdlJyxcbiAgICAgICAgICAgIGRhdGE6IG1lc3NhZ2UsXG4gICAgICAgICAgICByZXNwb25zZTogZmFsc2UsXG4gICAgICAgIH0pLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGUpXG4gICAgICAgICAgICBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmRlbGV0ZShtZXNzYWdlSUQpXG4gICAgICAgIH0pXG4gICAgICAgIFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIuc2V0KG1lc3NhZ2VJRCwgW3Jlc29sdmUsIHJlamVjdF0pXG4gICAgfSlcbn1cblxuLyoqXG4gKiBNZXNzYWdlIGhhbmRsZXIgb2Ygbm9ybWFsIG1lc3NhZ2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uTm9ybWFsTWVzc2FnZShcbiAgICBtZXNzYWdlOiBhbnksXG4gICAgc2VuZGVyOiBicm93c2VyLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcixcbiAgICB0b0V4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtZXNzYWdlSUQ6IHN0cmluZyxcbikge1xuICAgIGNvbnN0IGZuczogU2V0PGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2VFdmVudD4gfCB1bmRlZmluZWQgPSBFdmVudFBvb2xzWydicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJ10uZ2V0KFxuICAgICAgICB0b0V4dGVuc2lvbklELFxuICAgIClcbiAgICBpZiAoIWZucykgcmV0dXJuXG4gICAgbGV0IHJlc3BvbnNlU2VuZCA9IGZhbHNlXG4gICAgZm9yIChjb25zdCBmbiBvZiBmbnMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vID8gZGlzcGF0Y2ggbWVzc2FnZVxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZm4oZGVlcENsb25lKG1lc3NhZ2UpLCBkZWVwQ2xvbmUoc2VuZGVyKSwgc2VuZFJlc3BvbnNlRGVwcmVjYXRlZClcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIC8vID8gZG8gbm90aGluZ1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgICAgICAvLyAhIGRlcHJlY2F0ZWQgcGF0aCAhXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdvYmplY3QnICYmIHR5cGVvZiByZXN1bHQudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIC8vID8gcmVzcG9uc2UgdGhlIGFuc3dlclxuICAgICAgICAgICAgICAgIHJlc3VsdC50aGVuKChkYXRhOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhID09PSB1bmRlZmluZWQgfHwgcmVzcG9uc2VTZW5kKSByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBIb3N0LnNlbmRNZXNzYWdlKHRvRXh0ZW5zaW9uSUQsIGV4dGVuc2lvbklELCBzZW5kZXIudGFiIS5pZCEsIG1lc3NhZ2VJRCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ21lc3NhZ2UnLFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCB0eXBlIEludGVybmFsTWVzc2FnZSA9XG4gICAgfCB7XG4gICAgICAgICAgZGF0YTogYW55XG4gICAgICAgICAgZXJyb3I/OiB7IG1lc3NhZ2U6IHN0cmluZzsgc3RhY2s6IHN0cmluZyB9XG4gICAgICAgICAgcmVzcG9uc2U6IGJvb2xlYW5cbiAgICAgICAgICB0eXBlOiAnbWVzc2FnZSdcbiAgICAgIH1cbiAgICB8IHtcbiAgICAgICAgICB0eXBlOiAnZXhlY3V0ZVNjcmlwdCdcbiAgICAgIH0gJiBQYXJhbWV0ZXJzPFRoaXNTaWRlSW1wbGVtZW50YXRpb25bJ2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0J10+WzJdXG5cbmZ1bmN0aW9uIHNlbmRSZXNwb25zZURlcHJlY2F0ZWQoKTogYW55IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdSZXR1cm5pbmcgYSBQcm9taXNlIGlzIHRoZSBwcmVmZXJyZWQgd2F5JyArXG4gICAgICAgICAgICAnIHRvIHNlbmQgYSByZXBseSBmcm9tIGFuIG9uTWVzc2FnZS9vbk1lc3NhZ2VFeHRlcm5hbCBsaXN0ZW5lciwgJyArXG4gICAgICAgICAgICAnYXMgdGhlIHNlbmRSZXNwb25zZSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgc3BlY3MgJyArXG4gICAgICAgICAgICAnKFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL01vemlsbGEvQWRkLW9ucy9XZWJFeHRlbnNpb25zL0FQSS9ydW50aW1lL29uTWVzc2FnZSknLFxuICAgIClcbn1cbiIsImltcG9ydCB7IEVudmlyb25tZW50LCBNYW5pZmVzdCB9IGZyb20gJy4uL0V4dGVuc2lvbnMnXG5cbmV4cG9ydCBjb25zdCBpc0RlYnVnID0gbG9jYXRpb24uaG9zdG5hbWUgPT09ICdsb2NhbGhvc3QnXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEZWJ1Z01vZGVVUkwoXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4pOlxuICAgIHwgeyBlbnY6IEVudmlyb25tZW50LmJhY2tncm91bmRTY3JpcHQ7IHNyYzogJycgfVxuICAgIHwgeyBlbnY6IEVudmlyb25tZW50LmRlYnVnTW9kZU1hbmFnZWRQYWdlIHwgRW52aXJvbm1lbnQucHJvdG9jb2xQYWdlOyBzcmM6IHN0cmluZyB9IHtcbiAgICBjb25zdCBwYXJhbSA9IG5ldyBVUkxTZWFyY2hQYXJhbXMobG9jYXRpb24uc2VhcmNoKVxuICAgIGNvbnN0IHR5cGUgPSBwYXJhbS5nZXQoJ3R5cGUnKVxuICAgIGxldCBzcmMgPSBwYXJhbS5nZXQoJ3VybCcpXG4gICAgY29uc3QgYmFzZSA9ICdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJyArIGV4dGVuc2lvbklEICsgJy8nXG4gICAgaWYgKHNyYyA9PT0gJ19vcHRpb25zXycpIHNyYyA9IG5ldyBVUkwobWFuaWZlc3Qub3B0aW9uc191aSEucGFnZSwgYmFzZSkudG9KU09OKClcbiAgICBpZiAoc3JjID09PSAnX3BvcHVwXycpIHNyYyA9IG5ldyBVUkwobWFuaWZlc3QuYnJvd3Nlcl9hY3Rpb24hLmRlZmF1bHRfcG9wdXAhLCBiYXNlKS50b0pTT04oKVxuICAgIGlmICh0eXBlID09PSAnYicpIHJldHVybiB7IGVudjogRW52aXJvbm1lbnQuYmFja2dyb3VuZFNjcmlwdCwgc3JjOiAnJyB9XG4gICAgaWYgKCFzcmMpIHRocm93IG5ldyBUeXBlRXJyb3IoJ05lZWQgYSB1cmwnKVxuICAgIGlmICh0eXBlID09PSAncCcpIHJldHVybiB7IGVudjogRW52aXJvbm1lbnQucHJvdG9jb2xQYWdlLCBzcmMgfVxuICAgIGVsc2UgaWYgKHR5cGUgPT09ICdtJykgcmV0dXJuIHsgZW52OiBFbnZpcm9ubWVudC5kZWJ1Z01vZGVNYW5hZ2VkUGFnZSwgc3JjIH1cbiAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAnVG8gZGVidWcsID90eXBlPSBtdXN0IGJlIG9uZSBvZiAoYilhY2tncm91bmQsIChwKXJvdG9jb2wtcGFnZSwgKG0pYW5hZ2VkLXBhZ2UgKHVzZWQgdG8gZGVidWcgY29udGVudCBzY3JpcHQpLCBmb3VuZCAnICtcbiAgICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICApXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vbm9kZV9tb2R1bGVzL3dlYi1leHQtdHlwZXMvZ2xvYmFsL2luZGV4LmQudHNcIiAvPlxuaW1wb3J0IHsgQXN5bmNDYWxsIH0gZnJvbSAnQGhvbG9mbG93cy9raXQvZXMnXG5pbXBvcnQgeyBkaXNwYXRjaE5vcm1hbEV2ZW50LCBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyIH0gZnJvbSAnLi91dGlscy9Mb2NhbE1lc3NhZ2VzJ1xuaW1wb3J0IHsgSW50ZXJuYWxNZXNzYWdlLCBvbk5vcm1hbE1lc3NhZ2UgfSBmcm9tICcuL3NoaW1zL2Jyb3dzZXIubWVzc2FnZSdcbmltcG9ydCB7IHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24sIGxvYWRDb250ZW50U2NyaXB0IH0gZnJvbSAnLi9FeHRlbnNpb25zJ1xuaW1wb3J0IHsgaXNEZWJ1ZyB9IGZyb20gJy4vZGVidWdnZXIvaXNEZWJ1Z01vZGUnXG5cbi8qKiBEZWZpbmUgQmxvYiB0eXBlIGluIGNvbW11bmljYXRlIHdpdGggcmVtb3RlICovXG5leHBvcnQgdHlwZSBTdHJpbmdPckJsb2IgPVxuICAgIHwge1xuICAgICAgICAgIHR5cGU6ICd0ZXh0J1xuICAgICAgICAgIGNvbnRlbnQ6IHN0cmluZ1xuICAgICAgfVxuICAgIHwge1xuICAgICAgICAgIHR5cGU6ICdhcnJheSBidWZmZXInXG4gICAgICAgICAgY29udGVudDogc3RyaW5nXG4gICAgICB9XG4gICAgfCB7XG4gICAgICAgICAgdHlwZTogJ2Jsb2InXG4gICAgICAgICAgY29udGVudDogc3RyaW5nXG4gICAgICAgICAgbWltZVR5cGU6IHN0cmluZ1xuICAgICAgfVxuLyoqXG4gKiBUaGlzIGRlc2NyaWJlcyB3aGF0IEpTT05SUEMgY2FsbHMgdGhhdCBOYXRpdmUgc2lkZSBzaG91bGQgaW1wbGVtZW50XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSG9zdCB7XG4gICAgLy8jcmVnaW9uIC8vID8gVVJMLipcbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCBzYXZlIHRoZSBiaW5kaW5nIHdpdGggYHV1aWRgIGFuZCB0aGUgYGRhdGFgXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIFVVSUQgLSBVVUlEIGdlbmVyYXRlZCBieSBKUyBzaWRlLlxuICAgICAqIEBwYXJhbSBkYXRhIC0gZGF0YSBvZiB0aGlzIG9iamVjdC4gTXVzdCBiZSB0eXBlIGBibG9iYFxuICAgICAqL1xuICAgICdVUkwuY3JlYXRlT2JqZWN0VVJMJyhleHRlbnNpb25JRDogc3RyaW5nLCBVVUlEOiBzdHJpbmcsIGRhdGE6IFN0cmluZ09yQmxvYik6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCByZWxlYXNlIHRoZSBiaW5kaW5nIHdpdGggYHV1aWRgIGFuZCB0aGUgYGRhdGFgXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIFVVSUQgLSBVVUlEIGdlbmVyYXRlZCBieSBKUyBzaWRlLlxuICAgICAqL1xuICAgICdVUkwucmV2b2tlT2JqZWN0VVJMJyhleHRlbnNpb25JRDogc3RyaW5nLCBVVUlEOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+XG4gICAgLy8jZW5kcmVnaW9uXG4gICAgLy8jcmVnaW9uIC8vID8gYnJvd3Nlci5kb3dubG9hZHNcbiAgICAvKipcbiAgICAgKiBPcGVuIGEgZGlhbG9nLCBzaGFyZSB0aGUgZmlsZSB0byBzb21ld2hlcmUgZWxzZS5cbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFNlZSBodHRwczovL21kbi5pby9icm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZFxuICAgICAqL1xuICAgICdicm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZCcoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGZpbGVuYW1lOiBzdHJpbmdcbiAgICAgICAgICAgIC8qKiBDb3VsZCBiZSBhIHN0cmluZyByZXR1cm4gYnkgVVJMLmNyZWF0ZU9iamVjdFVSTCgpICovXG4gICAgICAgICAgICB1cmw6IHN0cmluZ1xuICAgICAgICB9LFxuICAgICk6IFByb21pc2U8dm9pZD5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0XG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBpbnRlcm5hbCBzdG9yYWdlIGZvciBgZXh0ZW5zaW9uSURgXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIGtleVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiA+IFN0b3JhZ2U6IHsgYTogeyB2YWx1ZTogMiB9LCBiOiB7IG5hbWU6IFwieFwiIH0sIGM6IDEgfVxuICAgICAqXG4gICAgICogZ2V0KGlkLCAnYicpXG4gICAgICogPiBSZXR1cm4ge25hbWU6IFwieFwifVxuICAgICAqXG4gICAgICogZ2V0KGlkLCBudWxsKVxuICAgICAqID4gUmV0dXJuOiB7IGE6IHsgdmFsdWU6IDIgfSwgYjogeyBuYW1lOiBcInhcIiB9LCBjOiAxIH1cbiAgICAgKlxuICAgICAqIGdldChpZCwgW1wiYVwiLCBcImJcIl0pXG4gICAgICogPiBSZXR1cm46IHsgYTogeyB2YWx1ZTogMiB9LCBiOiB7IG5hbWU6IFwieFwiIH0gfVxuICAgICAqL1xuICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0JyhleHRlbnNpb25JRDogc3RyaW5nLCBrZXk6IHN0cmluZyB8IHN0cmluZ1tdIHwgbnVsbCk6IFByb21pc2U8b2JqZWN0PlxuICAgIC8qKlxuICAgICAqIEhvc3Qgc2hvdWxkIHNldCB0aGUgb2JqZWN0IHdpdGggMSBsYXllciBtZXJnaW5nLlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBvYmplY3RcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogPiBTdG9yYWdlOiBge31gXG4gICAgICogc2V0KGlkLCB7IGE6IHsgdmFsdWU6IDEgfSwgYjogeyBuYW1lOiBcInhcIiB9IH0pXG4gICAgICogPiBTdG9yYWdlOiBgeyBhOiB7IHZhbHVlOiAxIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSB9YFxuICAgICAqIHNldChpZCwgeyBhOiB7IHZhbHVlOiAyIH0gfSlcbiAgICAgKiA+IFN0b3JhZ2U6IGB7IGE6IHsgdmFsdWU6IDIgfSwgYjogeyBuYW1lOiBcInhcIiB9IH1gXG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQnKGV4dGVuc2lvbklEOiBzdHJpbmcsIG9iamVjdDogb2JqZWN0KTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBrZXlzIGluIHRoZSBvYmplY3RcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5yZW1vdmUnKGV4dGVuc2lvbklEOiBzdHJpbmcsIGtleTogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogRGVsZXRlIHRoZSBpbnRlcm5hbCBzdG9yYWdlXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5jbGVhcicoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBicm93c2VyLnRhYnNcbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCBjcmVhdGUgYSBuZXcgdGFiXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBTZWUgaHR0cHM6Ly9tZG4uaW8vYnJvd3Nlci50YWJzLmNyZWF0ZVxuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMuY3JlYXRlJyhleHRlbnNpb25JRDogc3RyaW5nLCBvcHRpb25zOiB7IGFjdGl2ZT86IGJvb2xlYW47IHVybD86IHN0cmluZyB9KTogUHJvbWlzZTxicm93c2VyLnRhYnMuVGFiPlxuICAgIC8qKlxuICAgICAqIEhvc3Qgc2hvdWxkIHJlbW92ZSB0aGUgdGFiXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIHRhYklkIC0gU2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIudGFicy5yZW1vdmVcbiAgICAgKi9cbiAgICAnYnJvd3Nlci50YWJzLnJlbW92ZScoZXh0ZW5zaW9uSUQ6IHN0cmluZywgdGFiSWQ6IG51bWJlcik6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBvcGVuZWQgdGFic1xuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gU2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIudGFicy5xdWVyeVxuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMucXVlcnknKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICBxdWVyeUluZm86IFBhcmFtZXRlcnM8dHlwZW9mIGJyb3dzZXIudGFicy5xdWVyeT5bMF0sXG4gICAgKTogUHJvbWlzZTxicm93c2VyLnRhYnMuVGFiW10+XG4gICAgLyoqXG4gICAgICogVXBkYXRlIGEgdGFiJ3MgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gdGFiSWQgSWYgaXQgaXMgdW5kZWZpbmVkLCBpZ25vcmUgdGhpcyByZXF1ZXN0XG4gICAgICogQHBhcmFtIHVwZGF0ZVByb3BlcnRpZXNcbiAgICAgKi9cbiAgICAnYnJvd3Nlci50YWJzLnVwZGF0ZScoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRhYklkPzogbnVtYmVyLFxuICAgICAgICB1cGRhdGVQcm9wZXJ0aWVzPzoge1xuICAgICAgICAgICAgdXJsPzogc3RyaW5nXG4gICAgICAgIH0sXG4gICAgKTogUHJvbWlzZTxicm93c2VyLnRhYnMuVGFiPlxuICAgIC8vI2VuZHJlZ2lvblxuICAgIC8vI3JlZ2lvbiAvLyA/IE1lc3NhZ2VcbiAgICAvKipcbiAgICAgKiBVc2VkIHRvIGltcGxlbWVudCBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlIGFuZCBicm93c2VyLnRhYnMub25NZXNzYWdlXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEIC0gV2hvIHNlbmQgdGhpcyBtZXNzYWdlXG4gICAgICogQHBhcmFtIHRvRXh0ZW5zaW9uSUQgLSBXaG8gd2lsbCByZWNlaXZlIHRoaXMgbWVzc2FnZVxuICAgICAqIEBwYXJhbSB0YWJJZCAtIFNlbmQgdGhpcyBtZXNzYWdlIHRvIHRhYiBpZFxuICAgICAqIEBwYXJhbSBtZXNzYWdlSUQgLSBBIHJhbmRvbSBpZCBnZW5lcmF0ZWQgYnkgY2xpZW50XG4gICAgICogQHBhcmFtIG1lc3NhZ2UgLSBtZXNzYWdlIG9iamVjdFxuICAgICAqL1xuICAgIHNlbmRNZXNzYWdlKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICB0b0V4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRhYklkOiBudW1iZXIgfCBudWxsLFxuICAgICAgICBtZXNzYWdlSUQ6IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZTogSW50ZXJuYWxNZXNzYWdlLFxuICAgICk6IFByb21pc2U8dm9pZD5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBmZXRjaCAvLyA/ICh0byBieXBhc3MgY3Jvc3Mgb3JpZ2luIHJlc3RyaWN0aW9uKVxuICAgIC8qKlxuICAgICAqIFNlZTogaHR0cHM6Ly9tZG4uaW8vZmV0Y2hcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gcmVxdWVzdCAtIFRoZSByZXF1ZXN0IG9iamVjdFxuICAgICAqL1xuICAgIGZldGNoKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICByZXF1ZXN0OiB7XG4gICAgICAgICAgICAvKiogR0VULCBQT1NULCAuLi4uICovXG4gICAgICAgICAgICBtZXRob2Q6IHN0cmluZ1xuICAgICAgICAgICAgdXJsOiBzdHJpbmdcbiAgICAgICAgfSxcbiAgICApOiBQcm9taXNlPHtcbiAgICAgICAgLyoqIHJlc3BvbnNlIGNvZGUgKi9cbiAgICAgICAgc3RhdHVzOiBudW1iZXJcbiAgICAgICAgLyoqIHJlc3BvbnNlIHRleHQgKi9cbiAgICAgICAgc3RhdHVzVGV4dDogc3RyaW5nXG4gICAgICAgIGRhdGE6IFN0cmluZ09yQmxvYlxuICAgIH0+XG4gICAgLy8jZW5kcmVnaW9uXG59XG4vKipcbiAqIFRoaXMgZGVzY3JpYmVzIHdoYXQgSlNPTlJQQyBjYWxscyB0aGF0IEpTIHNpZGUgc2hvdWxkIGltcGxlbWVudFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRoaXNTaWRlSW1wbGVtZW50YXRpb24ge1xuICAgIC8qKlxuICAgICAqIEhvc3QgY2FsbCB0aGlzIHRvIG5vdGlmeSBgYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkYCBoYXBwZW5lZC5cbiAgICAgKlxuICAgICAqIEBzZWUgaHR0cHM6Ly9tZG4uaW8vYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkXG4gICAgICogQHBhcmFtIHRhYiAtIFRoZSBjb21taXR0ZWQgdGFiIGluZm9cbiAgICAgKi9cbiAgICAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJyh0YWI6IHsgdGFiSWQ6IG51bWJlcjsgdXJsOiBzdHJpbmcgfSk6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBVc2VkIHRvIGltcGxlbWVudCBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlIGFuZCBicm93c2VyLnRhYnMub25NZXNzYWdlXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEIC0gV2hvIHNlbmQgdGhpcyBtZXNzYWdlXG4gICAgICogQHBhcmFtIHRvRXh0ZW5zaW9uSUQgLSBXaG8gd2lsbCByZWNlaXZlIHRoaXMgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBtZXNzYWdlSUQgLSBBIHJhbmRvbSBpZCBjcmVhdGVkIGJ5IHRoZSBzZW5kZXIuIFVzZWQgdG8gaWRlbnRpZnkgaWYgdGhlIG1lc3NhZ2UgaXMgYSByZXNwb25zZS5cbiAgICAgKiBAcGFyYW0gbWVzc2FnZSAtIFNlbmQgYnkgYW5vdGhlciBjbGllbnRcbiAgICAgKiBAcGFyYW0gc2VuZGVyIC0gSW5mbyBvZiB0aGUgc2VuZGVyXG4gICAgICovXG4gICAgb25NZXNzYWdlKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICB0b0V4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VJRDogc3RyaW5nLFxuICAgICAgICBtZXNzYWdlOiBJbnRlcm5hbE1lc3NhZ2UsXG4gICAgICAgIHNlbmRlcjogYnJvd3Nlci5ydW50aW1lLk1lc3NhZ2VTZW5kZXIsXG4gICAgKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFNob3VsZCBpbmplY3QgdGhlIGdpdmVuIHNjcmlwdCBpbnRvIHRoZSBnaXZlbiB0YWJJRFxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSB0YWJJRCAtIFRhYiBpZCB0aGF0IG5lZWQgaW5qZWN0IHNjcmlwdCB0b1xuICAgICAqIEBwYXJhbSBkZXRhaWxzIC0gU2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0XG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0JyhcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdGFiSUQ6IG51bWJlcixcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgICAgY29kZT86IHN0cmluZ1xuICAgICAgICAgICAgZmlsZT86IHN0cmluZ1xuICAgICAgICAgICAgcnVuQXQ/OiAnZG9jdW1lbnRfc3RhcnQnIHwgJ2RvY3VtZW50X2VuZCcgfCAnZG9jdW1lbnRfaWRsZSdcbiAgICAgICAgfSxcbiAgICApOiBQcm9taXNlPHZvaWQ+XG59XG5cbmNvbnN0IGtleSA9ICdob2xvZmxvd3Nqc29ucnBjJ1xuY2xhc3MgaU9TV2Via2l0Q2hhbm5lbCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoa2V5LCBlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9IChlIGFzIEN1c3RvbUV2ZW50PGFueT4pLmRldGFpbFxuICAgICAgICAgICAgZm9yIChjb25zdCBmIG9mIHRoaXMubGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBmKGRldGFpbClcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgIHByaXZhdGUgbGlzdGVuZXI6IEFycmF5PChkYXRhOiB1bmtub3duKSA9PiB2b2lkPiA9IFtdXG4gICAgb24oXzogc3RyaW5nLCBjYjogKGRhdGE6IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnB1c2goY2IpXG4gICAgfVxuICAgIGVtaXQoXzogc3RyaW5nLCBkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgaWYgKGlzRGVidWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZW5kJywgZGF0YSlcbiAgICAgICAgfVxuICAgICAgICBpZiAod2luZG93LndlYmtpdCAmJiB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVycyAmJiB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1trZXldKVxuICAgICAgICAgICAgd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnNba2V5XS5wb3N0TWVzc2FnZShkYXRhKVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNhbWVQYWdlRGVidWdDaGFubmVsIHtcbiAgICBzdGF0aWMgc2VydmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpXG4gICAgc3RhdGljIGNsaWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYWN0b3I6ICdzZXJ2ZXInIHwgJ2NsaWVudCcpIHtcbiAgICAgICAgU2FtZVBhZ2VEZWJ1Z0NoYW5uZWxbYWN0b3JdLmFkZEV2ZW50TGlzdGVuZXIoJ3RhcmdldEV2ZW50Q2hhbm5lbCcsIGUgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gKGUgYXMgQ3VzdG9tRXZlbnQpLmRldGFpbFxuICAgICAgICAgICAgZm9yIChjb25zdCBmIG9mIHRoaXMubGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBmKGRldGFpbClcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgIHByaXZhdGUgbGlzdGVuZXI6IEFycmF5PChkYXRhOiB1bmtub3duKSA9PiB2b2lkPiA9IFtdXG4gICAgb24oXzogc3RyaW5nLCBjYjogKGRhdGE6IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnB1c2goY2IpXG4gICAgfVxuICAgIGVtaXQoXzogc3RyaW5nLCBkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgU2FtZVBhZ2VEZWJ1Z0NoYW5uZWxbdGhpcy5hY3RvciA9PT0gJ2NsaWVudCcgPyAnc2VydmVyJyA6ICdjbGllbnQnXS5kaXNwYXRjaEV2ZW50KFxuICAgICAgICAgICAgbmV3IEN1c3RvbUV2ZW50KCd0YXJnZXRFdmVudENoYW5uZWwnLCB7IGRldGFpbDogZGF0YSB9KSxcbiAgICAgICAgKVxuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBUaGlzU2lkZUltcGxlbWVudGF0aW9uOiBUaGlzU2lkZUltcGxlbWVudGF0aW9uID0ge1xuICAgIC8vIHRvZG86IGNoZWNrIGRpc3BhdGNoIHRhcmdldCdzIG1hbmlmZXN0XG4gICAgJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCc6IGRpc3BhdGNoTm9ybWFsRXZlbnQuYmluZChudWxsLCAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJywgJyonKSxcbiAgICBhc3luYyBvbk1lc3NhZ2UoZXh0ZW5zaW9uSUQsIHRvRXh0ZW5zaW9uSUQsIG1lc3NhZ2VJRCwgbWVzc2FnZSwgc2VuZGVyKSB7XG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdtZXNzYWdlJzpcbiAgICAgICAgICAgICAgICAvLyA/IHRoaXMgaXMgYSByZXNwb25zZSB0byB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgICAgIGlmIChUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmhhcyhtZXNzYWdlSUQpICYmIG1lc3NhZ2UucmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgW3Jlc29sdmUsIHJlamVjdF0gPSBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmdldChtZXNzYWdlSUQpIVxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG1lc3NhZ2UuZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5kZWxldGUobWVzc2FnZUlEKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5yZXNwb25zZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgb25Ob3JtYWxNZXNzYWdlKG1lc3NhZ2UuZGF0YSwgc2VuZGVyLCB0b0V4dGVuc2lvbklELCBleHRlbnNpb25JRCwgbWVzc2FnZUlEKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vID8gZHJvcCB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAnZXhlY3V0ZVNjcmlwdCc6XG4gICAgICAgICAgICAgICAgY29uc3QgZXh0ID0gcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5nZXQoZXh0ZW5zaW9uSUQpIVxuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlLmNvZGUpIGV4dC5lbnZpcm9ubWVudC5ldmFsdWF0ZShtZXNzYWdlLmNvZGUpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWVzc2FnZS5maWxlKVxuICAgICAgICAgICAgICAgICAgICBsb2FkQ29udGVudFNjcmlwdChleHRlbnNpb25JRCwgZXh0Lm1hbmlmZXN0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBqczogW21lc3NhZ2UuZmlsZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBjaGVjayB0aGUgcGVybWlzc2lvbiB0byBpbmplY3QgdGhlIHNjcmlwdFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlczogWyc8YWxsX3VybHM+J10sXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgJ2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0JyhleHRlbnNpb25JRCwgdGFiSUQsIGRldGFpbHMpIHtcbiAgICAgICAgcmV0dXJuIEhvc3Quc2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQsIGV4dGVuc2lvbklELCB0YWJJRCwgTWF0aC5yYW5kb20oKS50b1N0cmluZygpLCB7XG4gICAgICAgICAgICAuLi5kZXRhaWxzLFxuICAgICAgICAgICAgdHlwZTogJ2V4ZWN1dGVTY3JpcHQnLFxuICAgICAgICB9KVxuICAgIH0sXG59XG5leHBvcnQgY29uc3QgSG9zdCA9IEFzeW5jQ2FsbDxIb3N0PihUaGlzU2lkZUltcGxlbWVudGF0aW9uIGFzIGFueSwge1xuICAgIGtleTogJycsXG4gICAgbG9nOiBmYWxzZSxcbiAgICBtZXNzYWdlQ2hhbm5lbDogaXNEZWJ1ZyA/IG5ldyBTYW1lUGFnZURlYnVnQ2hhbm5lbCgnY2xpZW50JykgOiBuZXcgaU9TV2Via2l0Q2hhbm5lbCgpLFxufSlcbiIsImltcG9ydCB7IFN0cmluZ09yQmxvYiB9IGZyb20gJy4uL1JQQydcblxuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVN0cmluZ09yQmxvYih2YWw6IFN0cmluZ09yQmxvYik6IEJsb2IgfCBzdHJpbmcgfCBBcnJheUJ1ZmZlciB8IG51bGwge1xuICAgIGlmICh2YWwudHlwZSA9PT0gJ3RleHQnKSByZXR1cm4gdmFsLmNvbnRlbnRcbiAgICBpZiAodmFsLnR5cGUgPT09ICdibG9iJykgcmV0dXJuIG5ldyBCbG9iKFt2YWwuY29udGVudF0sIHsgdHlwZTogdmFsLm1pbWVUeXBlIH0pXG4gICAgaWYgKHZhbC50eXBlID09PSAnYXJyYXkgYnVmZmVyJykge1xuICAgICAgICByZXR1cm4gYmFzZTY0RGVjVG9BcnIodmFsLmNvbnRlbnQpLmJ1ZmZlclxuICAgIH1cbiAgICByZXR1cm4gbnVsbFxufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuY29kZVN0cmluZ09yQmxvYih2YWw6IEJsb2IgfCBzdHJpbmcgfCBBcnJheUJ1ZmZlcik6IFByb21pc2U8U3RyaW5nT3JCbG9iPiB7XG4gICAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSByZXR1cm4geyB0eXBlOiAndGV4dCcsIGNvbnRlbnQ6IHZhbCB9XG4gICAgaWYgKHZhbCBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgY29uc3QgYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgbmV3IFJlc3BvbnNlKHZhbCkuYXJyYXlCdWZmZXIoKSlcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ2Jsb2InLCBtaW1lVHlwZTogdmFsLnR5cGUsIGNvbnRlbnQ6IGJhc2U2NEVuY0FycihidWZmZXIpIH1cbiAgICB9XG4gICAgaWYgKHZhbCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgIHJldHVybiB7IHR5cGU6ICdhcnJheSBidWZmZXInLCBjb250ZW50OiBiYXNlNjRFbmNBcnIobmV3IFVpbnQ4QXJyYXkodmFsKSkgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGRhdGEnKVxufVxuXG4vLyNyZWdpb24gLy8gPyBDb2RlIGZyb20gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dpbmRvd0Jhc2U2NC9CYXNlNjRfZW5jb2RpbmdfYW5kX2RlY29kaW5nI0FwcGVuZGl4LjNBX0RlY29kZV9hX0Jhc2U2NF9zdHJpbmdfdG9fVWludDhBcnJheV9vcl9BcnJheUJ1ZmZlclxuZnVuY3Rpb24gYjY0VG9VaW50NihuQ2hyOiBudW1iZXIpIHtcbiAgICByZXR1cm4gbkNociA+IDY0ICYmIG5DaHIgPCA5MVxuICAgICAgICA/IG5DaHIgLSA2NVxuICAgICAgICA6IG5DaHIgPiA5NiAmJiBuQ2hyIDwgMTIzXG4gICAgICAgID8gbkNociAtIDcxXG4gICAgICAgIDogbkNociA+IDQ3ICYmIG5DaHIgPCA1OFxuICAgICAgICA/IG5DaHIgKyA0XG4gICAgICAgIDogbkNociA9PT0gNDNcbiAgICAgICAgPyA2MlxuICAgICAgICA6IG5DaHIgPT09IDQ3XG4gICAgICAgID8gNjNcbiAgICAgICAgOiAwXG59XG5cbmZ1bmN0aW9uIGJhc2U2NERlY1RvQXJyKHNCYXNlNjQ6IHN0cmluZywgbkJsb2NrU2l6ZT86IG51bWJlcikge1xuICAgIHZhciBzQjY0RW5jID0gc0Jhc2U2NC5yZXBsYWNlKC9bXkEtWmEtejAtOVxcK1xcL10vZywgJycpLFxuICAgICAgICBuSW5MZW4gPSBzQjY0RW5jLmxlbmd0aCxcbiAgICAgICAgbk91dExlbiA9IG5CbG9ja1NpemUgPyBNYXRoLmNlaWwoKChuSW5MZW4gKiAzICsgMSkgPj4+IDIpIC8gbkJsb2NrU2l6ZSkgKiBuQmxvY2tTaXplIDogKG5JbkxlbiAqIDMgKyAxKSA+Pj4gMixcbiAgICAgICAgYUJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkobk91dExlbilcblxuICAgIGZvciAodmFyIG5Nb2QzLCBuTW9kNCwgblVpbnQyNCA9IDAsIG5PdXRJZHggPSAwLCBuSW5JZHggPSAwOyBuSW5JZHggPCBuSW5MZW47IG5JbklkeCsrKSB7XG4gICAgICAgIG5Nb2Q0ID0gbkluSWR4ICYgM1xuICAgICAgICBuVWludDI0IHw9IGI2NFRvVWludDYoc0I2NEVuYy5jaGFyQ29kZUF0KG5JbklkeCkpIDw8ICgxOCAtIDYgKiBuTW9kNClcbiAgICAgICAgaWYgKG5Nb2Q0ID09PSAzIHx8IG5JbkxlbiAtIG5JbklkeCA9PT0gMSkge1xuICAgICAgICAgICAgZm9yIChuTW9kMyA9IDA7IG5Nb2QzIDwgMyAmJiBuT3V0SWR4IDwgbk91dExlbjsgbk1vZDMrKywgbk91dElkeCsrKSB7XG4gICAgICAgICAgICAgICAgYUJ5dGVzW25PdXRJZHhdID0gKG5VaW50MjQgPj4+ICgoMTYgPj4+IG5Nb2QzKSAmIDI0KSkgJiAyNTVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5VaW50MjQgPSAwXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYUJ5dGVzXG59XG5mdW5jdGlvbiB1aW50NlRvQjY0KG5VaW50NjogbnVtYmVyKSB7XG4gICAgcmV0dXJuIG5VaW50NiA8IDI2XG4gICAgICAgID8gblVpbnQ2ICsgNjVcbiAgICAgICAgOiBuVWludDYgPCA1MlxuICAgICAgICA/IG5VaW50NiArIDcxXG4gICAgICAgIDogblVpbnQ2IDwgNjJcbiAgICAgICAgPyBuVWludDYgLSA0XG4gICAgICAgIDogblVpbnQ2ID09PSA2MlxuICAgICAgICA/IDQzXG4gICAgICAgIDogblVpbnQ2ID09PSA2M1xuICAgICAgICA/IDQ3XG4gICAgICAgIDogNjVcbn1cblxuZnVuY3Rpb24gYmFzZTY0RW5jQXJyKGFCeXRlczogVWludDhBcnJheSkge1xuICAgIHZhciBlcUxlbiA9ICgzIC0gKGFCeXRlcy5sZW5ndGggJSAzKSkgJSAzLFxuICAgICAgICBzQjY0RW5jID0gJydcblxuICAgIGZvciAodmFyIG5Nb2QzLCBuTGVuID0gYUJ5dGVzLmxlbmd0aCwgblVpbnQyNCA9IDAsIG5JZHggPSAwOyBuSWR4IDwgbkxlbjsgbklkeCsrKSB7XG4gICAgICAgIG5Nb2QzID0gbklkeCAlIDNcbiAgICAgICAgLyogVW5jb21tZW50IHRoZSBmb2xsb3dpbmcgbGluZSBpbiBvcmRlciB0byBzcGxpdCB0aGUgb3V0cHV0IGluIGxpbmVzIDc2LWNoYXJhY3RlciBsb25nOiAqL1xuICAgICAgICAvKlxuICAgICAgaWYgKG5JZHggPiAwICYmIChuSWR4ICogNCAvIDMpICUgNzYgPT09IDApIHsgc0I2NEVuYyArPSBcIlxcclxcblwiOyB9XG4gICAgICAqL1xuICAgICAgICBuVWludDI0IHw9IGFCeXRlc1tuSWR4XSA8PCAoKDE2ID4+PiBuTW9kMykgJiAyNClcbiAgICAgICAgaWYgKG5Nb2QzID09PSAyIHx8IGFCeXRlcy5sZW5ndGggLSBuSWR4ID09PSAxKSB7XG4gICAgICAgICAgICBzQjY0RW5jICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoXG4gICAgICAgICAgICAgICAgdWludDZUb0I2NCgoblVpbnQyNCA+Pj4gMTgpICYgNjMpLFxuICAgICAgICAgICAgICAgIHVpbnQ2VG9CNjQoKG5VaW50MjQgPj4+IDEyKSAmIDYzKSxcbiAgICAgICAgICAgICAgICB1aW50NlRvQjY0KChuVWludDI0ID4+PiA2KSAmIDYzKSxcbiAgICAgICAgICAgICAgICB1aW50NlRvQjY0KG5VaW50MjQgJiA2MyksXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBuVWludDI0ID0gMFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGVxTGVuID09PSAwID8gc0I2NEVuYyA6IHNCNjRFbmMuc3Vic3RyaW5nKDAsIHNCNjRFbmMubGVuZ3RoIC0gZXFMZW4pICsgKGVxTGVuID09PSAxID8gJz0nIDogJz09Jylcbn1cbiIsImltcG9ydCB7IEhvc3QgfSBmcm9tICcuLi9SUEMnXG5pbXBvcnQgeyBlbmNvZGVTdHJpbmdPckJsb2IgfSBmcm9tICcuLi91dGlscy9TdHJpbmdPckJsb2InXG5cbmNvbnN0IHsgY3JlYXRlT2JqZWN0VVJMLCByZXZva2VPYmplY3RVUkwgfSA9IFVSTFxuZXhwb3J0IGZ1bmN0aW9uIGdldElERnJvbUJsb2JVUkwoeDogc3RyaW5nKSB7XG4gICAgaWYgKHguc3RhcnRzV2l0aCgnYmxvYjonKSkgcmV0dXJuIG5ldyBVUkwobmV3IFVSTCh4KS5wYXRobmFtZSkucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sICcnKVxuICAgIHJldHVybiB1bmRlZmluZWRcbn1cbi8qKlxuICogTW9kaWZ5IHRoZSBiZWhhdmlvciBvZiBVUkwuKlxuICogTGV0IHRoZSBibG9iOi8vIHVybCBjYW4gYmUgcmVjb2duaXplZCBieSBIb3N0LlxuICpcbiAqIEBwYXJhbSB1cmwgVGhlIG9yaWdpbmFsIFVSTCBvYmplY3RcbiAqIEBwYXJhbSBleHRlbnNpb25JRFxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5oYW5jZVVSTCh1cmw6IHR5cGVvZiBVUkwsIGV4dGVuc2lvbklEOiBzdHJpbmcpIHtcbiAgICB1cmwuY3JlYXRlT2JqZWN0VVJMID0gY3JlYXRlT2JqZWN0VVJMRW5oYW5jZWQoZXh0ZW5zaW9uSUQpXG4gICAgdXJsLnJldm9rZU9iamVjdFVSTCA9IHJldm9rZU9iamVjdFVSTEVuaGFuY2VkKGV4dGVuc2lvbklEKVxuICAgIHJldHVybiB1cmxcbn1cblxuZnVuY3Rpb24gcmV2b2tlT2JqZWN0VVJMRW5oYW5jZWQoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6ICh1cmw6IHN0cmluZykgPT4gdm9pZCB7XG4gICAgcmV0dXJuICh1cmw6IHN0cmluZykgPT4ge1xuICAgICAgICByZXZva2VPYmplY3RVUkwodXJsKVxuICAgICAgICBjb25zdCBpZCA9IGdldElERnJvbUJsb2JVUkwodXJsKSFcbiAgICAgICAgSG9zdFsnVVJMLnJldm9rZU9iamVjdFVSTCddKGV4dGVuc2lvbklELCBpZClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU9iamVjdFVSTEVuaGFuY2VkKGV4dGVuc2lvbklEOiBzdHJpbmcpOiAob2JqZWN0OiBhbnkpID0+IHN0cmluZyB7XG4gICAgcmV0dXJuIChvYmo6IEZpbGUgfCBCbG9iIHwgTWVkaWFTb3VyY2UpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gY3JlYXRlT2JqZWN0VVJMKG9iailcbiAgICAgICAgY29uc3QgcmVzb3VyY2VJRCA9IGdldElERnJvbUJsb2JVUkwodXJsKSFcbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgICAgIGVuY29kZVN0cmluZ09yQmxvYihvYmopLnRoZW4oYmxvYiA9PiBIb3N0WydVUkwuY3JlYXRlT2JqZWN0VVJMJ10oZXh0ZW5zaW9uSUQsIHJlc291cmNlSUQsIGJsb2IpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmxcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJsb2JUb0Jhc2U2NChibG9iOiBCbG9iKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgW2hlYWRlciwgYmFzZTY0XSA9IChyZWFkZXIucmVzdWx0IGFzIHN0cmluZykuc3BsaXQoJywnKVxuICAgICAgICAgICAgcmVzb2x2ZShiYXNlNjQpXG4gICAgICAgIH0pXG4gICAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGUgPT4gcmVqZWN0KGUpKVxuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKVxuICAgIH0pXG59XG4iLCJpbXBvcnQgeyBIb3N0IH0gZnJvbSAnLi9SUEMnXG5pbXBvcnQgeyBpc0RlYnVnIH0gZnJvbSAnLi9kZWJ1Z2dlci9pc0RlYnVnTW9kZSdcbi8qKlxuICogVGhpcyBJRCBpcyB1c2VkIGJ5IHRoaXMgcG9seWZpbGwgaXRzZWxmLlxuICovXG5leHBvcnQgY29uc3QgcmVzZXJ2ZWRJRCA9ICcxNTBlYTZlZS0yYjBhLTQ1ODctOTg3OS0wY2E1ZGZjMWQwNDYnXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXNlSW50ZXJuYWxTdG9yYWdlKFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgbW9kaWZ5PzogKG9iajogSW50ZXJuYWxTdG9yYWdlKSA9PiB2b2lkLFxuKTogUHJvbWlzZTxJbnRlcm5hbFN0b3JhZ2U+IHtcbiAgICBpZiAoaXNEZWJ1Zykge1xuICAgICAgICBjb25zdCBvYmogPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKHJlc2VydmVkSUQgKyAnOicgKyBleHRlbnNpb25JRCkgfHwgJ3t9JylcbiAgICAgICAgaWYgKCFtb2RpZnkpIHJldHVybiBQcm9taXNlLnJlc29sdmUob2JqKVxuICAgICAgICBtb2RpZnkob2JqKVxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShyZXNlcnZlZElEICsgJzonICsgZXh0ZW5zaW9uSUQsIEpTT04uc3RyaW5naWZ5KG9iaikpXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUob2JqKVxuICAgIH1cbiAgICBjb25zdCBvYmogPSAoKGF3YWl0IEhvc3RbJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQnXShyZXNlcnZlZElELCBleHRlbnNpb25JRCkpIGFzIGFueSlbZXh0ZW5zaW9uSURdIHx8IHt9XG4gICAgaWYgKCFtb2RpZnkpIHJldHVybiBvYmpcbiAgICBtb2RpZnkob2JqKVxuICAgIEhvc3RbJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQnXShyZXNlcnZlZElELCB7IFtleHRlbnNpb25JRF06IG9iaiB9KVxuICAgIHJldHVybiBvYmpcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1c2VHbG9iYWxJbnRlcm5hbFN0b3JhZ2UoZXh0ZW5zaW9uSUQ6IHN0cmluZywgbW9kaWZ5OiAob2JqOiBHbG9iYWxTdG9yYWdlKSA9PiB2b2lkKSB7XG4gICAgaWYgKGlzRGVidWcpIHtcbiAgICAgICAgY29uc3Qgb2JqID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShyZXNlcnZlZElEICsgJzonICsgcmVzZXJ2ZWRJRCkgfHwgJ3t9JylcbiAgICAgICAgbW9kaWZ5KG9iailcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocmVzZXJ2ZWRJRCArICc6JyArIHJlc2VydmVkSUQsIEpTT04uc3RyaW5naWZ5KG9iaikpXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIH1cbiAgICByZXR1cm4gSG9zdFsnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldCddKHJlc2VydmVkSUQsIHJlc2VydmVkSUQpXG4gICAgICAgIC50aGVuKCh4OiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSA9PiB4W3Jlc2VydmVkSURdIHx8IHt9KVxuICAgICAgICAudGhlbigob2JqOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KSA9PiB7XG4gICAgICAgICAgICBtb2RpZnkob2JqKVxuICAgICAgICAgICAgcmV0dXJuIG9ialxuICAgICAgICB9KVxuICAgICAgICAudGhlbihvID0+IEhvc3RbJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQnXShyZXNlcnZlZElELCB7IFtyZXNlcnZlZElEXTogbyB9KSlcbn1cblxuaW50ZXJmYWNlIEludGVybmFsU3RvcmFnZSB7XG4gICAgcHJldmlvdXNWZXJzaW9uPzogc3RyaW5nXG4gICAgZHluYW1pY1JlcXVlc3RlZFBlcm1pc3Npb25zPzoge1xuICAgICAgICBvcmlnaW5zOiBzdHJpbmdbXVxuICAgICAgICBwZXJtaXNzaW9uczogc3RyaW5nW11cbiAgICB9XG4gICAgLyoqXG4gICAgICogVGhpcyBzdG9yYWdlIGlzIHVzZWQgdG8gZW11bGF0ZSBgYnJvd3Nlci5zdG9yYWdlLmxvY2FsLipgXG4gICAgICogaW4gbG9jYWxob3N0IGRlYnVnZ2luZ1xuICAgICAqL1xuICAgIGRlYnVnTW9kZVN0b3JhZ2U/OiBhbnlcbn1cbmludGVyZmFjZSBHbG9iYWxTdG9yYWdlIHt9XG4iLCJpbXBvcnQgeyBIb3N0LCBUaGlzU2lkZUltcGxlbWVudGF0aW9uIH0gZnJvbSAnLi4vUlBDJ1xuaW1wb3J0IHsgY3JlYXRlRXZlbnRMaXN0ZW5lciB9IGZyb20gJy4uL3V0aWxzL0xvY2FsTWVzc2FnZXMnXG5pbXBvcnQgeyBjcmVhdGVSdW50aW1lU2VuZE1lc3NhZ2UsIHNlbmRNZXNzYWdlV2l0aFJlc3BvbnNlIH0gZnJvbSAnLi9icm93c2VyLm1lc3NhZ2UnXG5pbXBvcnQgeyBNYW5pZmVzdCB9IGZyb20gJy4uL0V4dGVuc2lvbnMnXG5pbXBvcnQgeyBnZXRJREZyb21CbG9iVVJMIH0gZnJvbSAnLi9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTCdcbmltcG9ydCB7IHVzZUludGVybmFsU3RvcmFnZSB9IGZyb20gJy4uL2ludGVybmFsJ1xuXG5jb25zdCBvcmlnaW5hbENvbmZpcm0gPSB3aW5kb3cuY29uZmlybVxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgYGJyb3dzZXJgIG9iamVjdC5cbiAqIEBwYXJhbSBleHRlbnNpb25JRCAtIEV4dGVuc2lvbiBJRFxuICogQHBhcmFtIG1hbmlmZXN0IC0gTWFuaWZlc3Qgb2YgdGhlIGV4dGVuc2lvblxuICovXG5leHBvcnQgZnVuY3Rpb24gQnJvd3NlckZhY3RvcnkoZXh0ZW5zaW9uSUQ6IHN0cmluZywgbWFuaWZlc3Q6IE1hbmlmZXN0KTogYnJvd3NlciB7XG4gICAgY29uc3QgaW1wbGVtZW50YXRpb246IFBhcnRpYWw8YnJvd3Nlcj4gPSB7XG4gICAgICAgIGRvd25sb2FkczogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci5kb3dubG9hZHM+KHtcbiAgICAgICAgICAgIGRvd25sb2FkOiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5kb3dubG9hZHMuZG93bmxvYWQnKSh7XG4gICAgICAgICAgICAgICAgcGFyYW0ob3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgeyB1cmwsIGZpbGVuYW1lIH0gPSBvcHRpb25zXG4gICAgICAgICAgICAgICAgICAgIGlmIChnZXRJREZyb21CbG9iVVJMKHVybCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IGBob2xvZmxvd3MtYmxvYjovLyR7ZXh0ZW5zaW9uSUR9LyR7Z2V0SURGcm9tQmxvYlVSTCh1cmwpIX1gXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgUGFydGlhbEltcGxlbWVudGVkKG9wdGlvbnMsICdmaWxlbmFtZScsICd1cmwnKVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmcxID0geyB1cmwsIGZpbGVuYW1lOiBmaWxlbmFtZSB8fCAnJyB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYXJnMV1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJldHVybnMoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9KSxcbiAgICAgICAgcnVudGltZTogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci5ydW50aW1lPih7XG4gICAgICAgICAgICBnZXRVUkwocGF0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBgaG9sb2Zsb3dzLWV4dGVuc2lvbjovLyR7ZXh0ZW5zaW9uSUR9LyR7cGF0aH1gXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0TWFuaWZlc3QoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobWFuaWZlc3QpKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uTWVzc2FnZTogY3JlYXRlRXZlbnRMaXN0ZW5lcihleHRlbnNpb25JRCwgJ2Jyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UnKSxcbiAgICAgICAgICAgIHNlbmRNZXNzYWdlOiBjcmVhdGVSdW50aW1lU2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQpLFxuICAgICAgICAgICAgb25JbnN0YWxsZWQ6IGNyZWF0ZUV2ZW50TGlzdGVuZXIoZXh0ZW5zaW9uSUQsICdicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsJyksXG4gICAgICAgIH0pLFxuICAgICAgICB0YWJzOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLnRhYnM+KHtcbiAgICAgICAgICAgIGFzeW5jIGV4ZWN1dGVTY3JpcHQodGFiSUQsIGRldGFpbHMpIHtcbiAgICAgICAgICAgICAgICBQYXJ0aWFsSW1wbGVtZW50ZWQoZGV0YWlscywgJ2NvZGUnLCAnZmlsZScsICdydW5BdCcpXG4gICAgICAgICAgICAgICAgYXdhaXQgVGhpc1NpZGVJbXBsZW1lbnRhdGlvblsnYnJvd3Nlci50YWJzLmV4ZWN1dGVTY3JpcHQnXShcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSUQsXG4gICAgICAgICAgICAgICAgICAgIHRhYklEID09PSB1bmRlZmluZWQgPyAtMSA6IHRhYklELFxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxzLFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGU6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnRhYnMuY3JlYXRlJykoKSxcbiAgICAgICAgICAgIGFzeW5jIHJlbW92ZSh0YWJJRCkge1xuICAgICAgICAgICAgICAgIGxldCB0OiBudW1iZXJbXVxuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0YWJJRCkpIHQgPSBbdGFiSURdXG4gICAgICAgICAgICAgICAgZWxzZSB0ID0gdGFiSURcbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0Lm1hcCh4ID0+IEhvc3RbJ2Jyb3dzZXIudGFicy5yZW1vdmUnXShleHRlbnNpb25JRCwgeCkpKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHF1ZXJ5OiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci50YWJzLnF1ZXJ5JykoKSxcbiAgICAgICAgICAgIHVwZGF0ZTogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIudGFicy51cGRhdGUnKSgpLFxuICAgICAgICAgICAgYXN5bmMgc2VuZE1lc3NhZ2U8VCA9IGFueSwgVSA9IG9iamVjdD4oXG4gICAgICAgICAgICAgICAgdGFiSWQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBULFxuICAgICAgICAgICAgICAgIG9wdGlvbnM/OiB7IGZyYW1lSWQ/OiBudW1iZXIgfCB1bmRlZmluZWQgfSB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICk6IFByb21pc2U8dm9pZCB8IFU+IHtcbiAgICAgICAgICAgICAgICBQYXJ0aWFsSW1wbGVtZW50ZWQob3B0aW9ucylcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VuZE1lc3NhZ2VXaXRoUmVzcG9uc2UoZXh0ZW5zaW9uSUQsIGV4dGVuc2lvbklELCB0YWJJZCwgbWVzc2FnZSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgICBzdG9yYWdlOiB7XG4gICAgICAgICAgICBsb2NhbDogSW1wbGVtZW50czx0eXBlb2YgYnJvd3Nlci5zdG9yYWdlLmxvY2FsPih7XG4gICAgICAgICAgICAgICAgY2xlYXI6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnN0b3JhZ2UubG9jYWwuY2xlYXInKSgpLFxuICAgICAgICAgICAgICAgIHJlbW92ZTogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5yZW1vdmUnKSgpLFxuICAgICAgICAgICAgICAgIHNldDogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQnKSgpLFxuICAgICAgICAgICAgICAgIGdldDogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQnKSh7XG4gICAgICAgICAgICAgICAgICAgIC8qKiBIb3N0IG5vdCBhY2NlcHRpbmcgeyBhOiAxIH0gYXMga2V5cyAqL1xuICAgICAgICAgICAgICAgICAgICBwYXJhbShrZXlzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXlzKSkgcmV0dXJuIFtrZXlzIGFzIHN0cmluZ1tdXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXlzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXlzID09PSBudWxsKSByZXR1cm4gW251bGxdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtPYmplY3Qua2V5cyhrZXlzKV1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbbnVsbF1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJucyhydG4sIFtrZXldKTogb2JqZWN0IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleSkpIHJldHVybiBydG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmIGtleSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IC4uLmtleSwgLi4ucnRuIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBydG5cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgc3luYzogTm90SW1wbGVtZW50ZWRQcm94eSgpLFxuICAgICAgICAgICAgb25DaGFuZ2VkOiBOb3RJbXBsZW1lbnRlZFByb3h5KCksXG4gICAgICAgIH0sXG4gICAgICAgIHdlYk5hdmlnYXRpb246IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIud2ViTmF2aWdhdGlvbj4oe1xuICAgICAgICAgICAgb25Db21taXR0ZWQ6IGNyZWF0ZUV2ZW50TGlzdGVuZXIoZXh0ZW5zaW9uSUQsICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnKSxcbiAgICAgICAgfSksXG4gICAgICAgIGV4dGVuc2lvbjogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci5leHRlbnNpb24+KHtcbiAgICAgICAgICAgIGdldEJhY2tncm91bmRQYWdlKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHROYW1lID0gJ19nZW5lcmF0ZWRfYmFja2dyb3VuZF9wYWdlLmh0bWwnXG4gICAgICAgICAgICAgICAgY29uc3QgbWFuaWZlc3ROYW1lID0gbWFuaWZlc3QuYmFja2dyb3VuZCEucGFnZVxuICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbi5wYXRobmFtZSA9PT0gJy8nICsgZGVmYXVsdE5hbWUgfHwgbG9jYXRpb24ucGF0aG5hbWUgPT09ICcvJyArIG1hbmlmZXN0TmFtZSkgcmV0dXJuIHdpbmRvd1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJveHkoXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBuZXcgVVJMKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJHtleHRlbnNpb25JRH0vJHttYW5pZmVzdE5hbWUgfHwgZGVmYXVsdE5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICkgYXMgUGFydGlhbDxMb2NhdGlvbj4sXG4gICAgICAgICAgICAgICAgICAgIH0gYXMgUGFydGlhbDxXaW5kb3c+LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZXQoXzogYW55LCBrZXk6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfW2tleV0pIHJldHVybiBfW2tleV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdOb3Qgc3VwcG9ydGVkJylcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKSBhcyBXaW5kb3dcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgICBwZXJtaXNzaW9uczogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci5wZXJtaXNzaW9ucz4oe1xuICAgICAgICAgICAgcmVxdWVzdDogYXN5bmMgcmVxID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB1c2VyQWN0aW9uID0gb3JpZ2luYWxDb25maXJtKGAke21hbmlmZXN0Lm5hbWV9IGlzIGdvaW5nIHRvIHJlcXVlc3QgdGhlIGZvbGxvd2luZyBwZXJtaXNzaW9uczpcbiR7KHJlcS5wZXJtaXNzaW9ucyB8fCBbXSkuam9pbignXFxuJyl9XG4keyhyZXEub3JpZ2lucyB8fCBbXSkuam9pbignXFxuJyl9YClcbiAgICAgICAgICAgICAgICBpZiAodXNlckFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICB1c2VJbnRlcm5hbFN0b3JhZ2UoZXh0ZW5zaW9uSUQsIG9iaiA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcmlnID0gb2JqLmR5bmFtaWNSZXF1ZXN0ZWRQZXJtaXNzaW9ucyB8fCB7IG9yaWdpbnM6IFtdLCBwZXJtaXNzaW9uczogW10gfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbyA9IG5ldyBTZXQob3JpZy5vcmlnaW5zKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcCA9IG5ldyBTZXQob3JpZy5wZXJtaXNzaW9ucylcbiAgICAgICAgICAgICAgICAgICAgICAgIDsocmVxLm9yaWdpbnMgfHwgW10pLmZvckVhY2goeCA9PiBvLmFkZCh4KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIDsocmVxLnBlcm1pc3Npb25zIHx8IFtdKS5mb3JFYWNoKHggPT4gcC5hZGQoeCkpXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnLm9yaWdpbnMgPSBBcnJheS5mcm9tKG8pXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnLnBlcm1pc3Npb25zID0gQXJyYXkuZnJvbShwKVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqLmR5bmFtaWNSZXF1ZXN0ZWRQZXJtaXNzaW9ucyA9IG9yaWdcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJBY3Rpb25cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250YWluczogYXN5bmMgcXVlcnkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbnNRdWVyeSA9IHF1ZXJ5Lm9yaWdpbnMgfHwgW11cbiAgICAgICAgICAgICAgICBjb25zdCBwZXJtaXNzaW9uc1F1ZXJ5ID0gcXVlcnkucGVybWlzc2lvbnMgfHwgW11cbiAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ZWQgPSBhd2FpdCB1c2VJbnRlcm5hbFN0b3JhZ2UoZXh0ZW5zaW9uSUQpXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzT3JpZ2lucyA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzUGVybWlzc2lvbnMgPSBuZXcgU2V0PHN0cmluZz4oKVxuICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0ZWQuZHluYW1pY1JlcXVlc3RlZFBlcm1pc3Npb25zICYmIHJlcXVlc3RlZC5keW5hbWljUmVxdWVzdGVkUGVybWlzc2lvbnMub3JpZ2lucykge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0ZWQuZHluYW1pY1JlcXVlc3RlZFBlcm1pc3Npb25zLm9yaWdpbnMuZm9yRWFjaCh4ID0+IGhhc09yaWdpbnMuYWRkKHgpKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocmVxdWVzdGVkLmR5bmFtaWNSZXF1ZXN0ZWRQZXJtaXNzaW9ucyAmJiByZXF1ZXN0ZWQuZHluYW1pY1JlcXVlc3RlZFBlcm1pc3Npb25zLnBlcm1pc3Npb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RlZC5keW5hbWljUmVxdWVzdGVkUGVybWlzc2lvbnMucGVybWlzc2lvbnMuZm9yRWFjaCh4ID0+IGhhc1Blcm1pc3Npb25zLmFkZCh4KSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gcGVybWlzc2lvbnMgZG9lcyBub3QgZGlzdGluZ3Vpc2ggcGVybWlzc2lvbiBvciB1cmxcbiAgICAgICAgICAgICAgICA7KG1hbmlmZXN0LnBlcm1pc3Npb25zIHx8IFtdKS5mb3JFYWNoKHggPT4gaGFzUGVybWlzc2lvbnMuYWRkKHgpKVxuICAgICAgICAgICAgICAgIDsobWFuaWZlc3QucGVybWlzc2lvbnMgfHwgW10pLmZvckVhY2goeCA9PiBoYXNPcmlnaW5zLmFkZCh4KSlcbiAgICAgICAgICAgICAgICBpZiAob3JpZ2luc1F1ZXJ5LnNvbWUoeCA9PiAhaGFzT3JpZ2lucy5oYXMoeCkpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgICBpZiAocGVybWlzc2lvbnNRdWVyeS5zb21lKHggPT4gIWhhc1Blcm1pc3Npb25zLmhhcyh4KSkpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVtb3ZlOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCfwn6SjIHdoeSB5b3Ugd2FudCB0byByZXZva2UgeW91ciBwZXJtaXNzaW9ucz8gTm90IGltcGxlbWVudGVkIHlldC4nKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEFsbDogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsbCA9IGF3YWl0IHVzZUludGVybmFsU3RvcmFnZShleHRlbnNpb25JRClcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhbGwuZHluYW1pY1JlcXVlc3RlZFBlcm1pc3Npb25zIHx8IHt9KSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgIH1cbiAgICByZXR1cm4gTm90SW1wbGVtZW50ZWRQcm94eTxicm93c2VyPihpbXBsZW1lbnRhdGlvbiwgZmFsc2UpXG59XG50eXBlIGJyb3dzZXIgPSB0eXBlb2YgYnJvd3NlclxuXG5mdW5jdGlvbiBJbXBsZW1lbnRzPFQ+KGltcGxlbWVudGF0aW9uOiBUKSB7XG4gICAgcmV0dXJuIGltcGxlbWVudGF0aW9uXG59XG5mdW5jdGlvbiBOb3RJbXBsZW1lbnRlZFByb3h5PFQgPSBhbnk+KGltcGxlbWVudGVkOiBQYXJ0aWFsPFQ+ID0ge30sIGZpbmFsID0gdHJ1ZSk6IFQge1xuICAgIHJldHVybiBuZXcgUHJveHkoaW1wbGVtZW50ZWQsIHtcbiAgICAgICAgZ2V0KHRhcmdldDogYW55LCBrZXkpIHtcbiAgICAgICAgICAgIGlmICghdGFyZ2V0W2tleV0pIHJldHVybiBmaW5hbCA/IE5vdEltcGxlbWVudGVkIDogTm90SW1wbGVtZW50ZWRQcm94eSgpXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0W2tleV1cbiAgICAgICAgfSxcbiAgICAgICAgYXBwbHkoKSB7XG4gICAgICAgICAgICByZXR1cm4gTm90SW1wbGVtZW50ZWQoKVxuICAgICAgICB9LFxuICAgIH0pXG59XG5mdW5jdGlvbiBOb3RJbXBsZW1lbnRlZCgpOiBhbnkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQhJylcbiAgICB9XG59XG5mdW5jdGlvbiBQYXJ0aWFsSW1wbGVtZW50ZWQ8VD4ob2JqOiBUID0ge30gYXMgYW55LCAuLi5rZXlzOiAoa2V5b2YgVClbXSkge1xuICAgIGNvbnN0IG9iajIgPSB7IC4uLm9iaiB9XG4gICAga2V5cy5mb3JFYWNoKHggPT4gZGVsZXRlIG9iajJbeF0pXG4gICAgaWYgKE9iamVjdC5rZXlzKG9iajIpLmxlbmd0aCkgY29uc29sZS53YXJuKGBOb3QgaW1wbGVtZW50ZWQgb3B0aW9uc2AsIG9iajIsIGBhdGAsIG5ldyBFcnJvcigpLnN0YWNrKVxufVxuXG50eXBlIEhlYWRsZXNzUGFyYW1ldGVyczxUIGV4dGVuZHMgKC4uLmFyZ3M6IGFueSkgPT4gYW55PiA9IFQgZXh0ZW5kcyAoZXh0ZW5zaW9uSUQ6IHN0cmluZywgLi4uYXJnczogaW5mZXIgUCkgPT4gYW55XG4gICAgPyBQXG4gICAgOiBuZXZlclxuLyoqXG4gKiBHZW5lcmF0ZSBiaW5kaW5nIGJldHdlZW4gSG9zdCBhbmQgV2ViRXh0ZW5zaW9uQVBJXG4gKlxuICogQUxMIGdlbmVyaWNzIHNob3VsZCBiZSBpbmZlcnJlZC4gRE8gTk9UIHdyaXRlIGl0IG1hbnVhbGx5LlxuICpcbiAqIElmIHlvdSBhcmUgd3JpdGluZyBvcHRpb25zLCBtYWtlIHN1cmUgeW91IGFkZCB5b3VyIGZ1bmN0aW9uIHRvIGBCcm93c2VyUmVmZXJlbmNlYCB0byBnZXQgdHlwZSB0aXBzLlxuICpcbiAqIEBwYXJhbSBleHRlbnNpb25JRCAtIFRoZSBleHRlbnNpb24gSURcbiAqIEBwYXJhbSBrZXkgLSBUaGUgQVBJIG5hbWUgaW4gdGhlIHR5cGUgb2YgYEhvc3RgIEFORCBgQnJvd3NlclJlZmVyZW5jZWBcbiAqL1xuZnVuY3Rpb24gYmluZGluZzxcbiAgICAvKiogTmFtZSBvZiB0aGUgQVBJIGluIHRoZSBSUEMgYmluZGluZyAqL1xuICAgIEtleSBleHRlbmRzIGtleW9mIEJyb3dzZXJSZWZlcmVuY2UsXG4gICAgLyoqIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBXZWJFeHRlbnNpb25BUEkgc2lkZSAqL1xuICAgIEJyb3dzZXJEZWYgZXh0ZW5kcyBCcm93c2VyUmVmZXJlbmNlW0tleV0sXG4gICAgLyoqIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBIb3N0IHNpZGUgKi9cbiAgICBIb3N0RGVmIGV4dGVuZHMgSG9zdFtLZXldLFxuICAgIC8qKiBBcmd1bWVudHMgb2YgdGhlIGJyb3dzZXIgc2lkZSAqL1xuICAgIEJyb3dzZXJBcmdzIGV4dGVuZHMgUGFyYW1ldGVyczxCcm93c2VyRGVmPixcbiAgICAvKiogUmV0dXJuIHR5cGUgb2YgdGhlIGJyb3dzZXIgc2lkZSAqL1xuICAgIEJyb3dzZXJSZXR1cm4gZXh0ZW5kcyBQcm9taXNlT2Y8UmV0dXJuVHlwZTxCcm93c2VyRGVmPj4sXG4gICAgLyoqIEFyZ3VtZW50cyB0eXBlIG9mIHRoZSBIb3N0IHNpZGUgKi9cbiAgICBIb3N0QXJncyBleHRlbmRzIEhlYWRsZXNzUGFyYW1ldGVyczxIb3N0RGVmPixcbiAgICAvKiogUmV0dXJuIHR5cGUgb2YgdGhlIEhvc3Qgc2lkZSAqL1xuICAgIEhvc3RSZXR1cm4gZXh0ZW5kcyBQcm9taXNlT2Y8UmV0dXJuVHlwZTxIb3N0RGVmPj5cbj4oZXh0ZW5zaW9uSUQ6IHN0cmluZywga2V5OiBLZXkpIHtcbiAgICAvKipcbiAgICAgKiBBbmQgaGVyZSB3ZSBzcGxpdCBpdCBpbnRvIDIgZnVuY3Rpb24sIGlmIHdlIGpvaW4gdGhlbSB0b2dldGhlciBpdCB3aWxsIGJyZWFrIHRoZSBpbmZlciAoYnV0IGlkayB3aHkpXG4gICAgICovXG4gICAgcmV0dXJuIDxcbiAgICAgICAgLyoqIEhlcmUgd2UgaGF2ZSB0byB1c2UgZ2VuZXJpY3Mgd2l0aCBndWFyZCB0byBlbnN1cmUgVHlwZVNjcmlwdCB3aWxsIGluZmVyIHR5cGUgb24gcnVudGltZSAqL1xuICAgICAgICBPcHRpb25zIGV4dGVuZHMge1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAqIEhlcmUgd2Ugd3JpdGUgdGhlIHR5cGUgZ3VhcmQgaW4gdGhlIGdlbmVyaWMsXG4gICAgICAgICAgICAgKiBkb24ndCB1c2UgdHdvIG1vcmUgZ2VuZXJpY3MgdG8gaW5mZXIgdGhlIHJldHVybiB0eXBlIG9mIGBwYXJhbWAgYW5kIGByZXR1cm5zYCxcbiAgICAgICAgICAgICAqIHRoYXQgd2lsbCBicmVhayB0aGUgaW5mZXIgcmVzdWx0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwYXJhbT86ICguLi5hcmdzOiBCcm93c2VyQXJncykgPT4gSG9zdEFyZ3NcbiAgICAgICAgICAgIHJldHVybnM/OiAocmV0dXJuczogSG9zdFJldHVybiwgYnJvd3NlcjogQnJvd3NlckFyZ3MsIGhvc3Q6IEhvc3RBcmdzKSA9PiBCcm93c2VyUmV0dXJuXG4gICAgICAgIH1cbiAgICA+KFxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucy4gWW91IGNhbiB3cml0ZSB0aGUgYnJpZGdlIGJldHdlZW4gSG9zdCBzaWRlIGFuZCBXZWJFeHRlbnNpb24gc2lkZS5cbiAgICAgICAgICovXG4gICAgICAgIG9wdGlvbnM6IE9wdGlvbnMgPSB7fSBhcyBhbnksXG4gICAgKSA9PiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEb24ndCB3cml0ZSB0aGVzZSB0eXBlIGFsaWFzIGluIGdlbmVyaWNzLiB3aWxsIGJyZWFrLiBpZGsgd2h5IGFnYWluLlxuICAgICAgICAgKi9cbiAgICAgICAgdHlwZSBIYXNQYXJhbUZuID0gdW5kZWZpbmVkIGV4dGVuZHMgT3B0aW9uc1sncGFyYW0nXSA/IGZhbHNlIDogdHJ1ZVxuICAgICAgICB0eXBlIEhhc1JldHVybkZuID0gdW5kZWZpbmVkIGV4dGVuZHMgT3B0aW9uc1sncmV0dXJucyddID8gZmFsc2UgOiB0cnVlXG4gICAgICAgIHR5cGUgX19fQXJnc19fXyA9IFJldHVyblR5cGU8Tm9uTnVsbGFibGU8T3B0aW9uc1sncGFyYW0nXT4+XG4gICAgICAgIHR5cGUgX19fUmV0dXJuX19fID0gUmV0dXJuVHlwZTxOb25OdWxsYWJsZTxPcHRpb25zWydyZXR1cm5zJ10+PlxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgdGhlcmUgaXMgYSBicmlkZ2UgZnVuY3Rpb25cbiAgICAgICAgICogLSBpZiBpdHMgcmV0dXJuIHR5cGUgc2F0aXNmaWVkIHRoZSByZXF1aXJlbWVudCwgcmV0dXJuIHRoZSBgQnJvd3NlckFyZ3NgIGVsc2UgcmV0dXJuIGBuZXZlcmBcbiAgICAgICAgICpcbiAgICAgICAgICogcmV0dXJuIHRoZSBgSG9zdEFyZ3NgIGFuZCBsZXQgVHlwZVNjcmlwdCBjaGVjayBpZiBpdCBpcyBzYXRpc2ZpZWQuXG4gICAgICAgICAqL1xuICAgICAgICB0eXBlIEluZmVyQXJnc1Jlc3VsdCA9IEhhc1BhcmFtRm4gZXh0ZW5kcyB0cnVlXG4gICAgICAgICAgICA/IF9fX0FyZ3NfX18gZXh0ZW5kcyBCcm93c2VyQXJnc1xuICAgICAgICAgICAgICAgID8gQnJvd3NlckFyZ3NcbiAgICAgICAgICAgICAgICA6IG5ldmVyXG4gICAgICAgICAgICA6IEhvc3RBcmdzXG4gICAgICAgIC8qKiBKdXN0IGxpa2UgYEluZmVyQXJnc1Jlc3VsdGAgKi9cbiAgICAgICAgdHlwZSBJbmZlclJldHVyblJlc3VsdCA9IEhhc1JldHVybkZuIGV4dGVuZHMgdHJ1ZVxuICAgICAgICAgICAgPyBfX19SZXR1cm5fX18gZXh0ZW5kcyBCcm93c2VyUmV0dXJuXG4gICAgICAgICAgICAgICAgPyBfX19SZXR1cm5fX19cbiAgICAgICAgICAgICAgICA6ICduZXZlciBydG4nXG4gICAgICAgICAgICA6IEhvc3RSZXR1cm5cbiAgICAgICAgY29uc3Qgbm9vcCA9IDxUPih4PzogVCkgPT4geCBhcyBUXG4gICAgICAgIGNvbnN0IG5vb3BBcmdzID0gKC4uLmFyZ3M6IGFueVtdKSA9PiBhcmdzXG4gICAgICAgIGNvbnN0IGhvc3REZWZpbml0aW9uOiAoZXh0ZW5zaW9uSUQ6IHN0cmluZywgLi4uYXJnczogSG9zdEFyZ3MpID0+IFByb21pc2U8SG9zdFJldHVybj4gPSBIb3N0W2tleV0gYXMgYW55XG4gICAgICAgIHJldHVybiAoKGFzeW5jICguLi5hcmdzOiBCcm93c2VyQXJncyk6IFByb21pc2U8QnJvd3NlclJldHVybj4gPT4ge1xuICAgICAgICAgICAgLy8gPyBUcmFuc2Zvcm0gV2ViRXh0ZW5zaW9uIEFQSSBhcmd1bWVudHMgdG8gaG9zdCBhcmd1bWVudHNcbiAgICAgICAgICAgIGNvbnN0IGhvc3RBcmdzID0gKG9wdGlvbnMucGFyYW0gfHwgbm9vcEFyZ3MpKC4uLmFyZ3MpIGFzIEhvc3RBcmdzXG4gICAgICAgICAgICAvLyA/IGV4ZWN1dGVcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhvc3REZWZpbml0aW9uKGV4dGVuc2lvbklELCAuLi5ob3N0QXJncylcbiAgICAgICAgICAgIGNvbnN0IGYgPSBvcHRpb25zLnJldHVybnMgfHwgKG5vb3AgYXMgTm9uTnVsbGFibGU8dHlwZW9mIG9wdGlvbnMucmV0dXJucz4pXG4gICAgICAgICAgICAvLyA/IFRyYW5zZm9ybSBob3N0IHJlc3VsdCB0byBXZWJFeHRlbnNpb24gQVBJIHJlc3VsdFxuICAgICAgICAgICAgY29uc3QgYnJvd3NlclJlc3VsdCA9IGYocmVzdWx0LCBhcmdzLCBob3N0QXJncykgYXMgQnJvd3NlclJldHVyblxuICAgICAgICAgICAgcmV0dXJuIGJyb3dzZXJSZXN1bHRcbiAgICAgICAgfSkgYXMgdW5rbm93bikgYXMgKC4uLmFyZ3M6IEluZmVyQXJnc1Jlc3VsdCkgPT4gUHJvbWlzZTxJbmZlclJldHVyblJlc3VsdD5cbiAgICB9XG59XG4vKipcbiAqIEEgcmVmZXJlbmNlIHRhYmxlIGJldHdlZW4gSG9zdCBhbmQgV2ViRXh0ZW5zaW9uQVBJXG4gKlxuICoga2V5IGlzIGluIHRoZSBob3N0LCByZXN1bHQgdHlwZSBpcyBpbiB0aGUgV2ViRXh0ZW5zaW9uLlxuICovXG50eXBlIEJyb3dzZXJSZWZlcmVuY2UgPSB7IFtrZXkgaW4ga2V5b2YgdHlwZW9mIEhvc3RdOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiBQcm9taXNlPHVua25vd24+IH0gJiB7XG4gICAgJ2Jyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkJzogdHlwZW9mIGJyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkXG4gICAgJ2Jyb3dzZXIudGFicy5jcmVhdGUnOiB0eXBlb2YgYnJvd3Nlci50YWJzLmNyZWF0ZVxufVxudHlwZSBQcm9taXNlT2Y8VD4gPSBUIGV4dGVuZHMgUHJvbWlzZTxpbmZlciBVPiA/IFUgOiBuZXZlclxuIiwiaW1wb3J0IHsgaXNEZWJ1ZyB9IGZyb20gJy4vaXNEZWJ1Z01vZGUnXG5cbmV4cG9ydCBmdW5jdGlvbiBkZWJ1Z01vZGVVUkxSZXdyaXRlKGV4dGVuc2lvbklEOiBzdHJpbmcsIHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIWlzRGVidWcpIHJldHVybiB1cmxcbiAgICBjb25zdCB1ID0gbmV3IFVSTCh1cmwsICdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJyArIGV4dGVuc2lvbklEICsgJy8nKVxuICAgIGlmICh1LnByb3RvY29sID09PSAnaG9sb2Zsb3dzLWV4dGVuc2lvbjonKSB7XG4gICAgICAgIHUucHJvdG9jb2wgPSBsb2NhdGlvbi5wcm90b2NvbFxuICAgICAgICB1Lmhvc3QgPSBsb2NhdGlvbi5ob3N0XG4gICAgICAgIHUucGF0aG5hbWUgPSAnL2V4dGVuc2lvbi8nICsgZXh0ZW5zaW9uSUQgKyAnLycgKyB1LnBhdGhuYW1lXG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1Jld3JpdGVkIHVybCcsIHVybCwgJ3RvJywgdS50b0pTT04oKSlcbiAgICAgICAgcmV0dXJuIHUudG9KU09OKClcbiAgICB9IGVsc2UgaWYgKHUub3JpZ2luID09PSBsb2NhdGlvbi5vcmlnaW4pIHtcbiAgICAgICAgaWYgKHUucGF0aG5hbWUuc3RhcnRzV2l0aCgnL2V4dGVuc2lvbi8nKSkgcmV0dXJuIHVybFxuICAgICAgICB1LnBhdGhuYW1lID0gJy9leHRlbnNpb24vJyArIGV4dGVuc2lvbklEICsgdS5wYXRobmFtZVxuICAgICAgICBjb25zb2xlLmRlYnVnKCdSZXdyaXRlZCB1cmwnLCB1cmwsICd0bycsIHUudG9KU09OKCkpXG4gICAgICAgIHJldHVybiB1LnRvSlNPTigpXG4gICAgfVxuICAgIHJldHVybiB1cmxcbn1cbiIsImltcG9ydCB7IEhvc3QgfSBmcm9tICcuLi9SUEMnXG5pbXBvcnQgeyBkZWNvZGVTdHJpbmdPckJsb2IgfSBmcm9tICcuLi91dGlscy9TdHJpbmdPckJsb2InXG5pbXBvcnQgeyBkZWJ1Z01vZGVVUkxSZXdyaXRlIH0gZnJvbSAnLi4vZGVidWdnZXIvdXJsLXJld3JpdGUnXG5pbXBvcnQgeyBpc0RlYnVnIH0gZnJvbSAnLi4vZGVidWdnZXIvaXNEZWJ1Z01vZGUnXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGZXRjaChleHRlbnNpb25JRDogc3RyaW5nLCBvcmlnRmV0Y2g6IHR5cGVvZiBmZXRjaCk6IHR5cGVvZiBmZXRjaCB7XG4gICAgcmV0dXJuIG5ldyBQcm94eShvcmlnRmV0Y2gsIHtcbiAgICAgICAgYXN5bmMgYXBwbHkob3JpZ0ZldGNoLCB0aGlzQXJnLCBbcmVxdWVzdEluZm8sIHJlcXVlc3RJbml0XTogUGFyYW1ldGVyczx0eXBlb2YgZmV0Y2g+KSB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gbmV3IFJlcXVlc3QocmVxdWVzdEluZm8sIHJlcXVlc3RJbml0KVxuICAgICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXF1ZXN0LnVybClcbiAgICAgICAgICAgIC8vIERlYnVnIG1vZGVcbiAgICAgICAgICAgIGlmIChpc0RlYnVnICYmICh1cmwub3JpZ2luID09PSBsb2NhdGlvbi5vcmlnaW4gfHwgdXJsLnByb3RvY29sID09PSAnaG9sb2Zsb3dzLWV4dGVuc2lvbjonKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnRmV0Y2goZGVidWdNb2RlVVJMUmV3cml0ZShleHRlbnNpb25JRCwgcmVxdWVzdC51cmwpLCByZXF1ZXN0SW5pdClcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmVxdWVzdC51cmwuc3RhcnRzV2l0aCgnaG9sb2Zsb3dzLWV4dGVuc2lvbjovLycgKyBleHRlbnNpb25JRCArICcvJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3JpZ0ZldGNoKHJlcXVlc3RJbmZvLCByZXF1ZXN0SW5pdClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRGVidWcpIHJldHVybiBvcmlnRmV0Y2gocmVxdWVzdEluZm8sIHJlcXVlc3RJbml0KVxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEhvc3QuZmV0Y2goZXh0ZW5zaW9uSUQsIHsgbWV0aG9kOiByZXF1ZXN0Lm1ldGhvZCwgdXJsOiB1cmwudG9KU09OKCkgfSlcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gZGVjb2RlU3RyaW5nT3JCbG9iKHJlc3VsdC5kYXRhKVxuICAgICAgICAgICAgICAgIGlmIChkYXRhID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoJycpXG4gICAgICAgICAgICAgICAgY29uc3QgcmV0dXJuVmFsdWUgPSBuZXcgUmVzcG9uc2UoZGF0YSwgcmVzdWx0KVxuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0pXG59XG4iLCJsZXQgbGFzdFVzZXJBY3RpdmUgPSAwXG5sZXQgbm93ID0gRGF0ZS5ub3cuYmluZChEYXRlKVxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAnY2xpY2snLFxuICAgICgpID0+IHtcbiAgICAgICAgbGFzdFVzZXJBY3RpdmUgPSBub3coKVxuICAgIH0sXG4gICAgeyBjYXB0dXJlOiB0cnVlLCBwYXNzaXZlOiB0cnVlIH0sXG4pXG5leHBvcnQgZnVuY3Rpb24gaGFzVmFsaWRVc2VySW50ZXJhY3RpdmUoKSB7XG4gICAgcmV0dXJuIG5vdygpIC0gbGFzdFVzZXJBY3RpdmUgPCAzMDAwXG59XG4iLCJpbXBvcnQgeyBIb3N0IH0gZnJvbSAnLi4vUlBDJ1xuaW1wb3J0IHsgaGFzVmFsaWRVc2VySW50ZXJhY3RpdmUgfSBmcm9tICcuLi91dGlscy9Vc2VySW50ZXJhY3RpdmUnXG5cbmV4cG9ydCBmdW5jdGlvbiBvcGVuRW5oYW5jZWQoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6IHR5cGVvZiBvcGVuIHtcbiAgICByZXR1cm4gKHVybCA9ICdhYm91dDpibGFuaycsIHRhcmdldD86IHN0cmluZywgZmVhdHVyZXM/OiBzdHJpbmcsIHJlcGxhY2U/OiBib29sZWFuKSA9PiB7XG4gICAgICAgIGlmICghaGFzVmFsaWRVc2VySW50ZXJhY3RpdmUoKSkgcmV0dXJuIG51bGxcbiAgICAgICAgaWYgKCh0YXJnZXQgJiYgdGFyZ2V0ICE9PSAnX2JsYW5rJykgfHwgZmVhdHVyZXMgfHwgcmVwbGFjZSlcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVW5zdXBwb3J0ZWQgb3BlbicsIHVybCwgdGFyZ2V0LCBmZWF0dXJlcywgcmVwbGFjZSlcbiAgICAgICAgSG9zdFsnYnJvd3Nlci50YWJzLmNyZWF0ZSddKGV4dGVuc2lvbklELCB7XG4gICAgICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgICAgICB1cmwsXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xvc2VFbmhhbmNlZChleHRlbnNpb25JRDogc3RyaW5nKTogdHlwZW9mIGNsb3NlIHtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoIWhhc1ZhbGlkVXNlckludGVyYWN0aXZlKCkpIHJldHVyblxuICAgICAgICBIb3N0Wydicm93c2VyLnRhYnMucXVlcnknXShleHRlbnNpb25JRCwgeyBhY3RpdmU6IHRydWUgfSkudGhlbihpID0+XG4gICAgICAgICAgICBIb3N0Wydicm93c2VyLnRhYnMucmVtb3ZlJ10oZXh0ZW5zaW9uSUQsIGlbMF0uaWQhKSxcbiAgICAgICAgKVxuICAgIH1cbn1cbiIsImltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0J1xuLyoqXG4gKiBUcmFuc2Zvcm0gYW55IGB0aGlzYCB0byBgKHR5cGVvZiB0aGlzID09PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsVGhpcyA6IHRoaXMpYFxuICogQHBhcmFtIGNvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRoaXNUcmFuc2Zvcm1hdGlvbihjb250ZXh0OiB0cy5UcmFuc2Zvcm1hdGlvbkNvbnRleHQpIHtcbiAgICBmdW5jdGlvbiB2aXNpdDxUIGV4dGVuZHMgdHMuTm9kZT4obm9kZTogVCk6IFQge1xuICAgICAgICBpZiAodHMuaXNTb3VyY2VGaWxlKG5vZGUpKSB7XG4gICAgICAgICAgICBpZiAoaXNJblN0cmljdE1vZGUobm9kZS5nZXRDaGlsZEF0KDApIGFzIHRzLlN5bnRheExpc3QpKSByZXR1cm4gbm9kZVxuICAgICAgICB9IGVsc2UgaWYgKHRzLmlzRnVuY3Rpb25EZWNsYXJhdGlvbihub2RlKSB8fCB0cy5pc0Z1bmN0aW9uRXhwcmVzc2lvbihub2RlKSkge1xuICAgICAgICAgICAgaWYgKG5vZGUuYm9keSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN5bnRheExpc3QgPSBub2RlXG4gICAgICAgICAgICAgICAgICAgIC5nZXRDaGlsZHJlbigpXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4LmtpbmQgPT09IHRzLlN5bnRheEtpbmQuU3ludGF4TGlzdClbMF0gYXMgdHMuU3ludGF4TGlzdFxuICAgICAgICAgICAgICAgIGlmIChpc0luU3RyaWN0TW9kZShzeW50YXhMaXN0KSkgcmV0dXJuIG5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChub2RlLmtpbmQgPT09IHRzLlN5bnRheEtpbmQuVGhpc0tleXdvcmQpIHtcbiAgICAgICAgICAgIHJldHVybiAodHMuY3JlYXRlUGFyZW4oXG4gICAgICAgICAgICAgICAgdHMuY3JlYXRlQ29uZGl0aW9uYWwoXG4gICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZUJpbmFyeShcbiAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZVR5cGVPZih0cy5jcmVhdGVUaGlzKCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHMuY3JlYXRlVG9rZW4odHMuU3ludGF4S2luZC5FcXVhbHNFcXVhbHNFcXVhbHNUb2tlbiksXG4gICAgICAgICAgICAgICAgICAgICAgICB0cy5jcmVhdGVTdHJpbmdMaXRlcmFsKCd1bmRlZmluZWQnKSxcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICAgICAgdHMuY3JlYXRlSWRlbnRpZmllcignZ2xvYmFsVGhpcycpLFxuICAgICAgICAgICAgICAgICAgICB0cy5jcmVhdGVUaGlzKCksXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICkgYXMgdW5rbm93bikgYXMgVFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cy52aXNpdEVhY2hDaGlsZChub2RlLCBjaGlsZCA9PiB2aXNpdChjaGlsZCksIGNvbnRleHQpXG4gICAgfVxuICAgIHJldHVybiAobm9kZSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gdmlzaXQobm9kZSlcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZVxuICAgICAgICB9XG4gICAgfSkgYXMgdHlwZW9mIHZpc2l0XG59XG5mdW5jdGlvbiBpc0luU3RyaWN0TW9kZShub2RlOiB0cy5TeW50YXhMaXN0KSB7XG4gICAgY29uc3QgZmlyc3QgPSBub2RlLmdldENoaWxkQXQoMClcbiAgICBpZiAoIWZpcnN0KSByZXR1cm4gZmFsc2VcbiAgICBpZiAodHMuaXNFeHByZXNzaW9uU3RhdGVtZW50KGZpcnN0KSkge1xuICAgICAgICBpZiAodHMuaXNTdHJpbmdMaXRlcmFsKGZpcnN0LmV4cHJlc3Npb24pKSB7XG4gICAgICAgICAgICBpZiAoZmlyc3QuZXhwcmVzc2lvbi50ZXh0ID09PSAndXNlIHN0cmljdCcpIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG59XG4iLCJpbXBvcnQgdHMgZnJvbSAndHlwZXNjcmlwdCdcbmltcG9ydCB7IHRoaXNUcmFuc2Zvcm1hdGlvbiB9IGZyb20gJy4vdGhpcy10cmFuc2Zvcm1lcidcblxuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZm9ybUFTVChzcmM6IHN0cmluZykge1xuICAgIGNvbnN0IG91dCA9IHRzLnRyYW5zcGlsZU1vZHVsZShzcmMsIHtcbiAgICAgICAgdHJhbnNmb3JtZXJzOiB7XG4gICAgICAgICAgICBhZnRlcjogW3RoaXNUcmFuc2Zvcm1hdGlvbl0sXG4gICAgICAgIH0sXG4gICAgICAgIHJlcG9ydERpYWdub3N0aWNzOiB0cnVlLFxuICAgICAgICBjb21waWxlck9wdGlvbnM6IHtcbiAgICAgICAgICAgIHRhcmdldDogdHMuU2NyaXB0VGFyZ2V0LkVTMjAxNyxcbiAgICAgICAgICAgIHJlbW92ZUNvbW1lbnRzOiB0cnVlLFxuICAgICAgICB9LFxuICAgIH0pXG4gICAgY29uc3QgZXJyb3IgPSBbXVxuICAgIGZvciAoY29uc3QgZXJyIG9mIG91dC5kaWFnbm9zdGljcyB8fCBbXSkge1xuICAgICAgICBsZXQgZXJyVGV4dCA9IHR5cGVvZiBlcnIubWVzc2FnZVRleHQgPT09ICdzdHJpbmcnID8gZXJyLm1lc3NhZ2VUZXh0IDogZXJyLm1lc3NhZ2VUZXh0Lm1lc3NhZ2VUZXh0XG4gICAgICAgIGlmIChlcnIuZmlsZSAmJiBlcnIuc3RhcnQgIT09IHVuZGVmaW5lZCAmJiBlcnIubGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IGVyci5maWxlLmdldEZ1bGxUZXh0KClcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0TGluZU51bSA9IChzb3VyY2Uuc2xpY2UoMCwgZXJyLnN0YXJ0KS5tYXRjaCgvXFxuL2cpIHx8IFtdKS5sZW5ndGhcbiAgICAgICAgICAgIGNvbnN0IGVuZExpbmVOdW0gPSAoc291cmNlLnNsaWNlKDAsIGVyci5zdGFydCArIGVyci5sZW5ndGgpLm1hdGNoKC9cXG4vZykgfHwgW10pLmxlbmd0aFxuICAgICAgICAgICAgY29uc3QgbGluZXMgPSBzb3VyY2Uuc3BsaXQoJ1xcbicpXG4gICAgICAgICAgICBjb25zdCBsaW5lSW5kaWNhdG9yTGVuZ3RoID0gZW5kTGluZU51bS50b1N0cmluZygpLmxlbmd0aCArIDVcbiAgICAgICAgICAgIGNvbnN0IGdldExpbmVXaXRoTm8gPSAobjogbnVtYmVyKSA9PlxuICAgICAgICAgICAgICAgIGxpbmVzW25dID8gYExpbmUgJHtuICsgMX0gfGAucGFkU3RhcnQobGluZUluZGljYXRvckxlbmd0aCkgKyAnICAnICsgbGluZXNbbl0gOiBudWxsXG4gICAgICAgICAgICBjb25zdCBhcm91bmRMaW5lcyA9IFtcbiAgICAgICAgICAgICAgICBnZXRMaW5lV2l0aE5vKHN0YXJ0TGluZU51bSAtIDMpLFxuICAgICAgICAgICAgICAgIGdldExpbmVXaXRoTm8oc3RhcnRMaW5lTnVtIC0gMiksXG4gICAgICAgICAgICAgICAgZ2V0TGluZVdpdGhObyhzdGFydExpbmVOdW0gLSAxKSxcbiAgICAgICAgICAgICAgICBnZXRMaW5lV2l0aE5vKHN0YXJ0TGluZU51bSksXG4gICAgICAgICAgICAgICAgJycucGFkU3RhcnQobGluZUluZGljYXRvckxlbmd0aCArIDQpICsgJ34nLnJlcGVhdChsaW5lc1tzdGFydExpbmVOdW1dLmxlbmd0aCksXG4gICAgICAgICAgICAgICAgc3RhcnRMaW5lTnVtICE9PSBlbmRMaW5lTnVtID8gJy4uLi4uLicgKyBnZXRMaW5lV2l0aE5vKGVuZExpbmVOdW0pIDogbnVsbCxcbiAgICAgICAgICAgICAgICBnZXRMaW5lV2l0aE5vKGVuZExpbmVOdW0gKyAxKSxcbiAgICAgICAgICAgICAgICBnZXRMaW5lV2l0aE5vKGVuZExpbmVOdW0gKyAyKSxcbiAgICAgICAgICAgICAgICBnZXRMaW5lV2l0aE5vKGVuZExpbmVOdW0gKyAzKSxcbiAgICAgICAgICAgIF0uZmlsdGVyKHggPT4geCkgYXMgc3RyaW5nW11cbiAgICAgICAgICAgIGVyclRleHQgKz0gYFxcbiR7YXJvdW5kTGluZXMuam9pbignXFxuJyl9XFxuYFxuICAgICAgICB9XG4gICAgICAgIGVycm9yLnB1c2gobmV3IFN5bnRheEVycm9yKGVyclRleHQpKVxuICAgIH1cbiAgICBpZiAoZXJyb3JbMF0pIHRocm93IGVycm9yWzBdXG4gICAgcmV0dXJuIG91dC5vdXRwdXRUZXh0XG59XG4iLCIvKipcbiAqIFRoaXMgZmlsZSBwYXJ0bHkgaW1wbGVtZW50cyBYUmF5VmlzaW9uIGluIEZpcmVmb3gncyBXZWJFeHRlbnNpb24gc3RhbmRhcmRcbiAqIGJ5IGNyZWF0ZSBhIHR3by13YXkgSlMgc2FuZGJveCBidXQgc2hhcmVkIERPTSBlbnZpcm9ubWVudC5cbiAqXG4gKiBjbGFzcyBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnQgd2lsbCByZXR1cm4gYSBuZXcgSlMgZW52aXJvbm1lbnRcbiAqIHRoYXQgaGFzIGEgXCJicm93c2VyXCIgdmFyaWFibGUgaW5zaWRlIG9mIGl0IGFuZCBhIGNsb25lIG9mIHRoZSBjdXJyZW50IERPTSBlbnZpcm9ubWVudFxuICogdG8gcHJldmVudCB0aGUgbWFpbiB0aHJlYWQgaGFjayBvbiBwcm90b3R5cGUgdG8gYWNjZXNzIHRoZSBjb250ZW50IG9mIENvbnRlbnRTY3JpcHRzLlxuICpcbiAqICMjIENoZWNrbGlzdDpcbiAqIC0gW29dIENvbnRlbnRTY3JpcHQgY2Fubm90IGFjY2VzcyBtYWluIHRocmVhZFxuICogLSBbP10gTWFpbiB0aHJlYWQgY2Fubm90IGFjY2VzcyBDb250ZW50U2NyaXB0XG4gKiAtIFtvXSBDb250ZW50U2NyaXB0IGNhbiBhY2Nlc3MgbWFpbiB0aHJlYWQncyBET01cbiAqIC0gWyBdIENvbnRlbnRTY3JpcHQgbW9kaWZpY2F0aW9uIG9uIERPTSBwcm90b3R5cGUgaXMgbm90IGRpc2NvdmVyYWJsZSBieSBtYWluIHRocmVhZFxuICogLSBbIF0gTWFpbiB0aHJlYWQgbW9kaWZpY2F0aW9uIG9uIERPTSBwcm90b3R5cGUgaXMgbm90IGRpc2NvdmVyYWJsZSBieSBDb250ZW50U2NyaXB0XG4gKi9cbmltcG9ydCBSZWFsbSwgeyBSZWFsbSBhcyBSZWFsbUluc3RhbmNlIH0gZnJvbSAncmVhbG1zLXNoaW0nXG5cbmltcG9ydCB7IEJyb3dzZXJGYWN0b3J5IH0gZnJvbSAnLi9icm93c2VyJ1xuaW1wb3J0IHsgTWFuaWZlc3QgfSBmcm9tICcuLi9FeHRlbnNpb25zJ1xuaW1wb3J0IHsgZW5oYW5jZVVSTCB9IGZyb20gJy4vVVJMLmNyZWF0ZStyZXZva2VPYmplY3RVUkwnXG5pbXBvcnQgeyBjcmVhdGVGZXRjaCB9IGZyb20gJy4vZmV0Y2gnXG5pbXBvcnQgeyBvcGVuRW5oYW5jZWQsIGNsb3NlRW5oYW5jZWQgfSBmcm9tICcuL3dpbmRvdy5vcGVuK2Nsb3NlJ1xuaW1wb3J0IHsgdHJhbnNmb3JtQVNUIH0gZnJvbSAnLi4vdHJhbnNmb3JtZXJzJ1xuLyoqXG4gKiBSZWN1cnNpdmVseSBnZXQgdGhlIHByb3RvdHlwZSBjaGFpbiBvZiBhbiBPYmplY3RcbiAqIEBwYXJhbSBvIE9iamVjdFxuICovXG5mdW5jdGlvbiBnZXRQcm90b3R5cGVDaGFpbihvOiBhbnksIF86IGFueVtdID0gW10pOiBhbnlbXSB7XG4gICAgaWYgKG8gPT09IHVuZGVmaW5lZCB8fCBvID09PSBudWxsKSByZXR1cm4gX1xuICAgIGNvbnN0IHkgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YobylcbiAgICBpZiAoeSA9PT0gbnVsbCB8fCB5ID09PSB1bmRlZmluZWQgfHwgeSA9PT0gT2JqZWN0LnByb3RvdHlwZSkgcmV0dXJuIF9cbiAgICByZXR1cm4gZ2V0UHJvdG90eXBlQ2hhaW4oT2JqZWN0LmdldFByb3RvdHlwZU9mKHkpLCBbLi4uXywgeV0pXG59XG4vKipcbiAqIEFwcGx5IGFsbCBXZWJBUElzIHRvIHRoZSBjbGVhbiBzYW5kYm94IGNyZWF0ZWQgYnkgUmVhbG1cbiAqL1xuY29uc3QgUHJlcGFyZVdlYkFQSXMgPSAoKCkgPT4ge1xuICAgIC8vID8gcmVwbGFjZSBGdW5jdGlvbiB3aXRoIHBvbGx1dGVkIHZlcnNpb24gYnkgUmVhbG1zXG4gICAgLy8gISB0aGlzIGxlYWtzIHRoZSBzYW5kYm94IVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QuZ2V0UHJvdG90eXBlT2YoKCkgPT4ge30pLCAnY29uc3RydWN0b3InLCB7XG4gICAgICAgIHZhbHVlOiBnbG9iYWxUaGlzLkZ1bmN0aW9uLFxuICAgIH0pXG4gICAgY29uc3QgcmVhbFdpbmRvdyA9IHdpbmRvd1xuICAgIGNvbnN0IHdlYkFQSXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyh3aW5kb3cpXG4gICAgUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh3ZWJBUElzLCAnd2luZG93JylcbiAgICBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHdlYkFQSXMsICdnbG9iYWxUaGlzJylcbiAgICBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHdlYkFQSXMsICdzZWxmJylcbiAgICBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHdlYkFQSXMsICdnbG9iYWwnKVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEb2N1bWVudC5wcm90b3R5cGUsICdkZWZhdWx0VmlldycsIHtcbiAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9LFxuICAgIH0pXG4gICAgcmV0dXJuIChzYW5kYm94Um9vdDogdHlwZW9mIGdsb2JhbFRoaXMpID0+IHtcbiAgICAgICAgY29uc3QgY2xvbmVkV2ViQVBJcyA9IHsgLi4ud2ViQVBJcyB9XG4gICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHNhbmRib3hSb290KS5mb3JFYWNoKG5hbWUgPT4gUmVmbGVjdC5kZWxldGVQcm9wZXJ0eShjbG9uZWRXZWJBUElzLCBuYW1lKSlcbiAgICAgICAgLy8gPyBDbG9uZSBXZWIgQVBJc1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB3ZWJBUElzKSB7XG4gICAgICAgICAgICBQYXRjaFRoaXNPZkRlc2NyaXB0b3JUb0dsb2JhbCh3ZWJBUElzW2tleV0sIHJlYWxXaW5kb3cpXG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHNhbmRib3hSb290LCAnd2luZG93Jywge1xuICAgICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICB2YWx1ZTogc2FuZGJveFJvb3QsXG4gICAgICAgIH0pXG4gICAgICAgIE9iamVjdC5hc3NpZ24oc2FuZGJveFJvb3QsIHsgZ2xvYmFsVGhpczogc2FuZGJveFJvb3QgfSlcbiAgICAgICAgY29uc3QgcHJvdG8gPSBnZXRQcm90b3R5cGVDaGFpbihyZWFsV2luZG93KVxuICAgICAgICAgICAgLm1hcChPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycylcbiAgICAgICAgICAgIC5yZWR1Y2VSaWdodCgocHJldmlvdXMsIGN1cnJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb3B5ID0geyAuLi5jdXJyZW50IH1cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBjb3B5KSB7XG4gICAgICAgICAgICAgICAgICAgIFBhdGNoVGhpc09mRGVzY3JpcHRvclRvR2xvYmFsKGNvcHlba2V5XSwgcmVhbFdpbmRvdylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5jcmVhdGUocHJldmlvdXMsIGNvcHkpXG4gICAgICAgICAgICB9LCB7fSlcbiAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHNhbmRib3hSb290LCBwcm90bylcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoc2FuZGJveFJvb3QsIGNsb25lZFdlYkFQSXMpXG4gICAgfVxufSkoKVxuLyoqXG4gKiBFeGVjdXRpb24gZW52aXJvbm1lbnQgb2YgQ29udGVudFNjcmlwdFxuICovXG5leHBvcnQgY2xhc3MgV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50XG4gICAgaW1wbGVtZW50cyBSZWFsbUluc3RhbmNlPHR5cGVvZiBnbG9iYWxUaGlzICYgeyBicm93c2VyOiB0eXBlb2YgYnJvd3NlciB9PiB7XG4gICAgcHJpdmF0ZSByZWFsbSA9IFJlYWxtLm1ha2VSb290UmVhbG0oe1xuICAgICAgICBzbG9wcHlHbG9iYWxzOiB0cnVlLFxuICAgICAgICB0cmFuc2Zvcm1zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV3cml0ZTogY3R4ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY3R4LnNyYyA9IHRyYW5zZm9ybUFTVChjdHguc3JjKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3R4XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSlcbiAgICBnZXQgZ2xvYmFsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFsbS5nbG9iYWxcbiAgICB9XG4gICAgcmVhZG9ubHkgW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnUmVhbG0nXG4gICAgLyoqXG4gICAgICogRXZhbHVhdGUgYSBzdHJpbmcgaW4gdGhlIGNvbnRlbnQgc2NyaXB0IGVudmlyb25tZW50XG4gICAgICogQHBhcmFtIHNvdXJjZVRleHQgU291cmNlIHRleHRcbiAgICAgKi9cbiAgICBldmFsdWF0ZShzb3VyY2VUZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhbG0uZXZhbHVhdGUoc291cmNlVGV4dClcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IHJ1bm5pbmcgZXh0ZW5zaW9uIGZvciBhbiBjb250ZW50IHNjcmlwdC5cbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSUQgVGhlIGV4dGVuc2lvbiBJRFxuICAgICAqIEBwYXJhbSBtYW5pZmVzdCBUaGUgbWFuaWZlc3Qgb2YgdGhlIGV4dGVuc2lvblxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBleHRlbnNpb25JRDogc3RyaW5nLCBwdWJsaWMgbWFuaWZlc3Q6IE1hbmlmZXN0KSB7XG4gICAgICAgIFByZXBhcmVXZWJBUElzKHRoaXMuZ2xvYmFsKVxuICAgICAgICBjb25zdCBicm93c2VyID0gQnJvd3NlckZhY3RvcnkodGhpcy5leHRlbnNpb25JRCwgdGhpcy5tYW5pZmVzdClcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuZ2xvYmFsLCAnYnJvd3NlcicsIHtcbiAgICAgICAgICAgIC8vID8gTW96aWxsYSdzIHBvbHlmaWxsIG1heSBvdmVyd3JpdGUgdGhpcy4gRmlndXJlIHRoaXMgb3V0LlxuICAgICAgICAgICAgZ2V0OiAoKSA9PiBicm93c2VyLFxuICAgICAgICAgICAgc2V0OiB4ID0+IGZhbHNlLFxuICAgICAgICB9KVxuICAgICAgICB0aGlzLmdsb2JhbC5icm93c2VyID0gQnJvd3NlckZhY3RvcnkodGhpcy5leHRlbnNpb25JRCwgdGhpcy5tYW5pZmVzdClcbiAgICAgICAgdGhpcy5nbG9iYWwuVVJMID0gZW5oYW5jZVVSTCh0aGlzLmdsb2JhbC5VUkwsIHRoaXMuZXh0ZW5zaW9uSUQpXG4gICAgICAgIHRoaXMuZ2xvYmFsLmZldGNoID0gY3JlYXRlRmV0Y2godGhpcy5leHRlbnNpb25JRCwgd2luZG93LmZldGNoKVxuICAgICAgICB0aGlzLmdsb2JhbC5vcGVuID0gb3BlbkVuaGFuY2VkKHRoaXMuZXh0ZW5zaW9uSUQpXG4gICAgICAgIHRoaXMuZ2xvYmFsLmNsb3NlID0gY2xvc2VFbmhhbmNlZCh0aGlzLmV4dGVuc2lvbklEKVxuICAgIH1cbn1cbi8qKlxuICogTWFueSBtZXRob2RzIG9uIGB3aW5kb3dgIHJlcXVpcmVzIGB0aGlzYCBwb2ludHMgdG8gYSBXaW5kb3cgb2JqZWN0XG4gKiBMaWtlIGBhbGVydCgpYC4gSWYgeW91IGNhbGwgYWxlcnQgYXMgYGNvbnN0IHcgPSB7IGFsZXJ0IH07IHcuYWxlcnQoKWAsXG4gKiB0aGVyZSB3aWxsIGJlIGFuIElsbGVnYWwgaW52b2NhdGlvbi5cbiAqXG4gKiBUbyBwcmV2ZW50IGB0aGlzYCBiaW5kaW5nIGxvc3QsIHdlIG5lZWQgdG8gcmViaW5kIGl0LlxuICpcbiAqIEBwYXJhbSBkZXNjIFByb3BlcnR5RGVzY3JpcHRvclxuICogQHBhcmFtIGdsb2JhbCBUaGUgcmVhbCB3aW5kb3dcbiAqL1xuZnVuY3Rpb24gUGF0Y2hUaGlzT2ZEZXNjcmlwdG9yVG9HbG9iYWwoZGVzYzogUHJvcGVydHlEZXNjcmlwdG9yLCBnbG9iYWw6IFdpbmRvdykge1xuICAgIGNvbnN0IHsgZ2V0LCBzZXQsIHZhbHVlIH0gPSBkZXNjXG4gICAgaWYgKGdldCkgZGVzYy5nZXQgPSAoKSA9PiBnZXQuYXBwbHkoZ2xvYmFsKVxuICAgIGlmIChzZXQpIGRlc2Muc2V0ID0gKHZhbDogYW55KSA9PiBzZXQuYXBwbHkoZ2xvYmFsLCB2YWwpXG4gICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjb25zdCBkZXNjMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHZhbHVlKVxuICAgICAgICBkZXNjLnZhbHVlID0gZnVuY3Rpb24oLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgICAgIGlmIChuZXcudGFyZ2V0KSByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3QodmFsdWUsIGFyZ3MsIG5ldy50YXJnZXQpXG4gICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5hcHBseSh2YWx1ZSwgZ2xvYmFsLCBhcmdzKVxuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGRlc2MudmFsdWUsIGRlc2MyKVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gPyBGb3IgdW5rbm93biByZWFzb24gdGhpcyBmYWlsIGZvciBzb21lIG9iamVjdHMgb24gU2FmYXJpLlxuICAgICAgICAgICAgdmFsdWUucHJvdG90eXBlICYmIE9iamVjdC5zZXRQcm90b3R5cGVPZihkZXNjLnZhbHVlLCB2YWx1ZS5wcm90b3R5cGUpXG4gICAgICAgIH0gY2F0Y2gge31cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBpc0RlYnVnIH0gZnJvbSAnLi4vZGVidWdnZXIvaXNEZWJ1Z01vZGUnXG5pbXBvcnQgeyBkZWJ1Z01vZGVVUkxSZXdyaXRlIH0gZnJvbSAnLi4vZGVidWdnZXIvdXJsLXJld3JpdGUnXG5cbmNvbnN0IG5vcm1hbGl6ZWQgPSBTeW1ib2woJ05vcm1hbGl6ZWQgcmVzb3VyY2VzJylcbmZ1bmN0aW9uIG5vcm1hbGl6ZVBhdGgocGF0aDogc3RyaW5nLCBleHRlbnNpb25JRDogc3RyaW5nKSB7XG4gICAgY29uc3QgcHJlZml4ID0gZ2V0UHJlZml4KGV4dGVuc2lvbklEKVxuICAgIGlmIChwYXRoLnN0YXJ0c1dpdGgocHJlZml4KSkgcmV0dXJuIGRlYnVnTW9kZVVSTFJld3JpdGUoZXh0ZW5zaW9uSUQsIHBhdGgpXG4gICAgZWxzZSByZXR1cm4gZGVidWdNb2RlVVJMUmV3cml0ZShleHRlbnNpb25JRCwgbmV3IFVSTChwYXRoLCBwcmVmaXgpLnRvSlNPTigpKVxufVxuZnVuY3Rpb24gZ2V0UHJlZml4KGV4dGVuc2lvbklEOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gJ2hvbG9mbG93cy1leHRlbnNpb246Ly8nICsgZXh0ZW5zaW9uSUQgKyAnLydcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlc291cmNlKGV4dGVuc2lvbklEOiBzdHJpbmcsIHJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiwgcGF0aDogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICAvLyBOb3JtYWxpemF0aW9uIHRoZSByZXNvdXJjZXNcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKCFyZXNvdXJjZXNbbm9ybWFsaXplZF0pIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcmVzb3VyY2VzKSB7XG4gICAgICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoZ2V0UHJlZml4KGV4dGVuc2lvbklEKSkpIGNvbnRpbnVlXG4gICAgICAgICAgICBjb25zdCBvYmogPSByZXNvdXJjZXNba2V5XVxuICAgICAgICAgICAgZGVsZXRlIHJlc291cmNlc1trZXldXG4gICAgICAgICAgICByZXNvdXJjZXNbbmV3IFVSTChrZXksIGdldFByZWZpeChleHRlbnNpb25JRCkpLnRvSlNPTigpXSA9IG9ialxuICAgICAgICB9XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmVzb3VyY2VzW25vcm1hbGl6ZWRdID0gdHJ1ZVxuICAgIH1cbiAgICByZXR1cm4gcmVzb3VyY2VzW25vcm1hbGl6ZVBhdGgocGF0aCwgZXh0ZW5zaW9uSUQpXVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UmVzb3VyY2VBc3luYyhleHRlbnNpb25JRDogc3RyaW5nLCByZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sIHBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IHByZWxvYWRlZCA9IGdldFJlc291cmNlKGV4dGVuc2lvbklELCByZXNvdXJjZXMsIHBhdGgpXG4gICAgaWYgKHByZWxvYWRlZCkgcmV0dXJuIHByZWxvYWRlZFxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChub3JtYWxpemVQYXRoKHBhdGgsIGV4dGVuc2lvbklEKSlcbiAgICBpZiAocmVzcG9uc2Uub2spIHJldHVybiByZXNwb25zZS50ZXh0KClcbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG4iLCJpbXBvcnQgeyBnZXRSZXNvdXJjZSwgZ2V0UmVzb3VyY2VBc3luYyB9IGZyb20gJy4uL3V0aWxzL1Jlc291cmNlcydcbmltcG9ydCB7IFJ1bkluUHJvdG9jb2xTY29wZSwgTWFuaWZlc3QgfSBmcm9tICcuLi9FeHRlbnNpb25zJ1xuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVIVE1MU2NyaXB0RWxlbWVudFNyYyhcbiAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgIG1hbmlmZXN0OiBNYW5pZmVzdCxcbiAgICBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIGFueT4sXG4gICAgY3VycmVudFBhZ2U6IHN0cmluZyxcbikge1xuICAgIGNvbnN0IHNyYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoSFRNTFNjcmlwdEVsZW1lbnQucHJvdG90eXBlLCAnc3JjJykhXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEhUTUxTY3JpcHRFbGVtZW50LnByb3RvdHlwZSwgJ3NyYycsIHtcbiAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHNyYy5nZXQhLmNhbGwodGhpcylcbiAgICAgICAgfSxcbiAgICAgICAgc2V0KHRoaXM6IEhUTUxTY3JpcHRFbGVtZW50LCBwYXRoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdzY3JpcHQgc3JjPScsIHBhdGgpXG4gICAgICAgICAgICBjb25zdCBwcmVsb2FkZWQgPSBnZXRSZXNvdXJjZShleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzLCBwYXRoKVxuICAgICAgICAgICAgaWYgKHByZWxvYWRlZCkgUnVuSW5Qcm90b2NvbFNjb3BlKGV4dGVuc2lvbklELCBtYW5pZmVzdCwgcHJlbG9hZGVkLCBjdXJyZW50UGFnZSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBnZXRSZXNvdXJjZUFzeW5jKGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMsIHBhdGgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGNvZGUgPT4gY29kZSB8fCBQcm9taXNlLnJlamVjdDxzdHJpbmc+KCdMb2FkaW5nIHJlc291cmNlIGZhaWxlZCcpKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihjb2RlID0+IFJ1bkluUHJvdG9jb2xTY29wZShleHRlbnNpb25JRCwgbWFuaWZlc3QsIGNvZGUsIGN1cnJlbnRQYWdlKSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGUgPT4gY29uc29sZS5lcnJvcihgRmFpbGVkIHdoZW4gbG9hZGluZyByZXNvdXJjZWAsIHBhdGgsIGUpKVxuICAgICAgICAgICAgdGhpcy5kYXRhc2V0LnNyYyA9IHBhdGhcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH0sXG4gICAgfSlcbn1cbiIsImltcG9ydCB7IGlzRGVidWcgfSBmcm9tICcuLi9kZWJ1Z2dlci9pc0RlYnVnTW9kZSdcbmltcG9ydCB7IGRlYnVnTW9kZVVSTFJld3JpdGUgfSBmcm9tICcuLi9kZWJ1Z2dlci91cmwtcmV3cml0ZSdcblxuZXhwb3J0IGZ1bmN0aW9uIHJld3JpdGVXb3JrZXIoZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIGlmICghaXNEZWJ1ZykgcmV0dXJuXG4gICAgY29uc3Qgb3JpZ2luYWxXb3JrZXIgPSB3aW5kb3cuV29ya2VyXG4gICAgd2luZG93LldvcmtlciA9IG5ldyBQcm94eShvcmlnaW5hbFdvcmtlciwge1xuICAgICAgICBjb25zdHJ1Y3QodGFyZ2V0LCBhcmdzLCBuZXdUYXJnZXQpIHtcbiAgICAgICAgICAgIGFyZ3NbMF0gPSBkZWJ1Z01vZGVVUkxSZXdyaXRlKGV4dGVuc2lvbklELCBhcmdzWzBdKVxuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KHRhcmdldCwgYXJncywgbmV3VGFyZ2V0KVxuICAgICAgICB9LFxuICAgIH0pXG59XG4iLCJpbXBvcnQgeyBwYXJzZURlYnVnTW9kZVVSTCB9IGZyb20gJy4uL2RlYnVnZ2VyL2lzRGVidWdNb2RlJ1xuaW1wb3J0IHsgTWFuaWZlc3QgfSBmcm9tICcuLi9FeHRlbnNpb25zJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTG9jYXRpb25Qcm94eShleHRlbnNpb25JRDogc3RyaW5nLCBtYW5pZmVzdDogTWFuaWZlc3QsIGN1cnJlbnRQYWdlOiBzdHJpbmcpOiBMb2NhdGlvbiB7XG4gICAgY29uc3QgbG9jYXRpb25Qcm94eSA9IG5ldyBQcm94eSh7fSBhcyBhbnksIHtcbiAgICAgICAgZ2V0KHRhcmdldDogTG9jYXRpb24sIGtleToga2V5b2YgTG9jYXRpb24pIHtcbiAgICAgICAgICAgIHRhcmdldCA9IGxvY2F0aW9uXG4gICAgICAgICAgICBjb25zdCBvYmogPSB0YXJnZXRba2V5XSBhcyBhbnlcbiAgICAgICAgICAgIGlmIChrZXkgPT09ICdyZWxvYWQnKSByZXR1cm4gKCkgPT4gdGFyZ2V0LnJlbG9hZCgpXG4gICAgICAgICAgICBpZiAoa2V5ID09PSAnYXNzaWduJyB8fCBrZXkgPT09ICdyZXBsYWNlJylcbiAgICAgICAgICAgICAgICByZXR1cm4gKHVybDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgc3JjOiBiYXNlIH0gPSBwYXJzZURlYnVnTW9kZVVSTChleHRlbnNpb25JRCwgbWFuaWZlc3QpXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uUHJveHkuaHJlZiA9IG5ldyBVUkwodXJsLCBiYXNlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1vY2tlZFVSTCA9IG5ldyBVUkwoY3VycmVudFBhZ2UpXG4gICAgICAgICAgICBpZiAoa2V5IGluIG1vY2tlZFVSTCkgcmV0dXJuIG1vY2tlZFVSTFtrZXkgYXMga2V5b2YgVVJMXVxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdBY2Nlc3NpbmcnLCBrZXksICdvbiBsb2NhdGlvbicpXG4gICAgICAgICAgICByZXR1cm4gb2JqXG4gICAgICAgIH0sXG4gICAgICAgIHNldCh0YXJnZXQ6IExvY2F0aW9uLCBrZXk6IGtleW9mIExvY2F0aW9uLCB2YWx1ZTogYW55KSB7XG4gICAgICAgICAgICB0YXJnZXQgPSBsb2NhdGlvblxuICAgICAgICAgICAgaWYgKGtleSA9PT0gJ29yaWdpbicpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgY29uc3QgbW9ja2VkVVJMID0gbmV3IFVSTChjdXJyZW50UGFnZSlcbiAgICAgICAgICAgIGlmIChrZXkgaW4gbW9ja2VkVVJMKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFSZWZsZWN0LnNldChtb2NrZWRVUkwsIGtleSwgdmFsdWUpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgICBjb25zdCBzZWFyY2ggPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHRhcmdldC5zZWFyY2gpXG4gICAgICAgICAgICAgICAgc2VhcmNoLnNldCgndXJsJywgbW9ja2VkVVJMLnRvSlNPTigpKVxuICAgICAgICAgICAgICAgIHRhcmdldC5zZWFyY2ggPSBzZWFyY2gudG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1NldHRpbmcnLCBrZXksICdvbiBsb2NhdGlvbiB0bycsIHZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3Quc2V0KHRhcmdldCwga2V5LCB2YWx1ZSlcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yOiBzYWZlR2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgIH0pXG4gICAgcmV0dXJuIGxvY2F0aW9uUHJveHlcbn1cblxuY29uc3Qgc2FmZUdldE93blByb3BlcnR5RGVzY3JpcHRvciA9IChvYmo6IGFueSwga2V5OiBhbnkpID0+IHtcbiAgICBjb25zdCBvcmlnID0gUmVmbGVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpXG4gICAgaWYgKCFvcmlnKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHsgLi4ub3JpZywgY29uZmlndXJhYmxlOiB0cnVlIH1cbn1cbiIsImltcG9ydCB7IG1hdGNoaW5nVVJMIH0gZnJvbSAnLi91dGlscy9VUkxNYXRjaGVyJ1xuaW1wb3J0IHsgV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50IH0gZnJvbSAnLi9zaGltcy9YUmF5VmlzaW9uJ1xuaW1wb3J0IHsgQnJvd3NlckZhY3RvcnkgfSBmcm9tICcuL3NoaW1zL2Jyb3dzZXInXG5pbXBvcnQgeyBjcmVhdGVGZXRjaCB9IGZyb20gJy4vc2hpbXMvZmV0Y2gnXG5pbXBvcnQgeyBlbmhhbmNlVVJMIH0gZnJvbSAnLi9zaGltcy9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTCdcbmltcG9ydCB7IG9wZW5FbmhhbmNlZCwgY2xvc2VFbmhhbmNlZCB9IGZyb20gJy4vc2hpbXMvd2luZG93Lm9wZW4rY2xvc2UnXG5pbXBvcnQgeyBnZXRSZXNvdXJjZUFzeW5jIH0gZnJvbSAnLi91dGlscy9SZXNvdXJjZXMnXG5pbXBvcnQgeyBFdmVudFBvb2xzIH0gZnJvbSAnLi91dGlscy9Mb2NhbE1lc3NhZ2VzJ1xuaW1wb3J0IHsgcmVzZXJ2ZWRJRCwgdXNlSW50ZXJuYWxTdG9yYWdlIH0gZnJvbSAnLi9pbnRlcm5hbCdcbmltcG9ydCB7IGlzRGVidWcsIHBhcnNlRGVidWdNb2RlVVJMIH0gZnJvbSAnLi9kZWJ1Z2dlci9pc0RlYnVnTW9kZSdcbmltcG9ydCB7IHdyaXRlSFRNTFNjcmlwdEVsZW1lbnRTcmMgfSBmcm9tICcuL2hpamFja3MvSFRNTFNjcmlwdC5wcm90b3R5cGUuc3JjJ1xuaW1wb3J0IHsgcmV3cml0ZVdvcmtlciB9IGZyb20gJy4vaGlqYWNrcy9Xb3JrZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yJ1xuaW1wb3J0IHsgY3JlYXRlTG9jYXRpb25Qcm94eSB9IGZyb20gJy4vaGlqYWNrcy9sb2NhdGlvbidcblxuZXhwb3J0IHR5cGUgV2ViRXh0ZW5zaW9uSUQgPSBzdHJpbmdcbmV4cG9ydCB0eXBlIE1hbmlmZXN0ID0gUGFydGlhbDxicm93c2VyLnJ1bnRpbWUuTWFuaWZlc3Q+ICZcbiAgICBQaWNrPGJyb3dzZXIucnVudGltZS5NYW5pZmVzdCwgJ25hbWUnIHwgJ3ZlcnNpb24nIHwgJ21hbmlmZXN0X3ZlcnNpb24nPlxuZXhwb3J0IGludGVyZmFjZSBXZWJFeHRlbnNpb24ge1xuICAgIG1hbmlmZXN0OiBNYW5pZmVzdFxuICAgIGVudmlyb25tZW50OiBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnRcbiAgICBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5cbn1cbmV4cG9ydCBjb25zdCByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uID0gbmV3IE1hcDxXZWJFeHRlbnNpb25JRCwgV2ViRXh0ZW5zaW9uPigpXG5leHBvcnQgZW51bSBFbnZpcm9ubWVudCB7XG4gICAgY29udGVudFNjcmlwdCA9ICdDb250ZW50IHNjcmlwdCcsXG4gICAgYmFja2dyb3VuZFNjcmlwdCA9ICdCYWNrZ3JvdW5kIHNjcmlwdCcsXG4gICAgcHJvdG9jb2xQYWdlID0gJ1Byb3RvY29sIHBhZ2UnLFxuICAgIGRlYnVnTW9kZU1hbmFnZWRQYWdlID0gJ21hbmFnZWQgcGFnZScsXG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVnaXN0ZXJXZWJFeHRlbnNpb24oXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge30sXG4pIHtcbiAgICBpZiAoZXh0ZW5zaW9uSUQgPT09IHJlc2VydmVkSUQpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBjYW5ub3QgdXNlIHJlc2VydmVkIGlkICcgKyByZXNlcnZlZElEICsgJyBhcyB0aGUgZXh0ZW5zaW9uIGlkJylcbiAgICBsZXQgZW52aXJvbm1lbnQ6IEVudmlyb25tZW50ID0gZ2V0Q29udGV4dChtYW5pZmVzdCwgZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcylcbiAgICBsZXQgZGVidWdNb2RlVVJMID0gJydcbiAgICBpZiAoaXNEZWJ1Zykge1xuICAgICAgICBjb25zdCBvcHQgPSBwYXJzZURlYnVnTW9kZVVSTChleHRlbnNpb25JRCwgbWFuaWZlc3QpXG4gICAgICAgIGVudmlyb25tZW50ID0gb3B0LmVudlxuICAgICAgICBkZWJ1Z01vZGVVUkwgPSBvcHQuc3JjXG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHN3aXRjaCAoZW52aXJvbm1lbnQpIHtcbiAgICAgICAgICAgIGNhc2UgRW52aXJvbm1lbnQuZGVidWdNb2RlTWFuYWdlZFBhZ2U6XG4gICAgICAgICAgICAgICAgaWYgKCFpc0RlYnVnKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIHN0YXRlJylcbiAgICAgICAgICAgICAgICBMb2FkQ29udGVudFNjcmlwdChtYW5pZmVzdCwgZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcywgZGVidWdNb2RlVVJMKVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlIEVudmlyb25tZW50LnByb3RvY29sUGFnZTpcbiAgICAgICAgICAgICAgICBwcmVwYXJlRXh0ZW5zaW9uUHJvdG9jb2xFbnZpcm9ubWVudChleHRlbnNpb25JRCwgbWFuaWZlc3QpXG4gICAgICAgICAgICAgICAgaWYgKGlzRGVidWcpIExvYWRQcm90b2NvbFBhZ2UoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0LCBwcmVsb2FkZWRSZXNvdXJjZXMsIGRlYnVnTW9kZVVSTClcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSBFbnZpcm9ubWVudC5iYWNrZ3JvdW5kU2NyaXB0OlxuICAgICAgICAgICAgICAgIHByZXBhcmVFeHRlbnNpb25Qcm90b2NvbEVudmlyb25tZW50KGV4dGVuc2lvbklELCBtYW5pZmVzdClcbiAgICAgICAgICAgICAgICBhd2FpdCB1bnRpbERvY3VtZW50UmVhZHkoKVxuICAgICAgICAgICAgICAgIGF3YWl0IExvYWRCYWNrZ3JvdW5kU2NyaXB0KG1hbmlmZXN0LCBleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzKVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlIEVudmlyb25tZW50LmNvbnRlbnRTY3JpcHQ6XG4gICAgICAgICAgICAgICAgYXdhaXQgdW50aWxEb2N1bWVudFJlYWR5KClcbiAgICAgICAgICAgICAgICBhd2FpdCBMb2FkQ29udGVudFNjcmlwdChtYW5pZmVzdCwgZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcylcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtXZWJFeHRlbnNpb25dIHVua25vd24gcnVubmluZyBlbnZpcm9ubWVudCAke2Vudmlyb25tZW50fWApXG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICB9XG4gICAgaWYgKGVudmlyb25tZW50ID09PSBFbnZpcm9ubWVudC5iYWNrZ3JvdW5kU2NyaXB0KSB7XG4gICAgICAgIGNvbnN0IGluc3RhbGxIYW5kbGVyID0gRXZlbnRQb29sc1snYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbCddLmdldChleHRlbnNpb25JRClcbiAgICAgICAgaWYgKGluc3RhbGxIYW5kbGVyKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB1c2VJbnRlcm5hbFN0b3JhZ2UoZXh0ZW5zaW9uSUQsIG8gPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVycyA9IEFycmF5LmZyb20oaW5zdGFsbEhhbmRsZXIudmFsdWVzKCkpIGFzIGNhbGxiYWNrW11cbiAgICAgICAgICAgICAgICAgICAgdHlwZSBjYWxsYmFjayA9IHR5cGVvZiBicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIgZXh0ZW5kcyAoKC4uLmFyZ3M6IGluZmVyIFQpID0+IGFueSlcbiAgICAgICAgICAgICAgICAgICAgICAgID8gVFswXVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBuZXZlclxuICAgICAgICAgICAgICAgICAgICA7W11cbiAgICAgICAgICAgICAgICAgICAgaWYgKG8ucHJldmlvdXNWZXJzaW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlcnMuZm9yRWFjaCh4ID0+IHgoeyBwcmV2aW91c1ZlcnNpb246IG8ucHJldmlvdXNWZXJzaW9uLCByZWFzb246ICd1cGRhdGUnIH0pKVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGhhbmRsZXJzLmZvckVhY2goeCA9PiB4KHsgcmVhc29uOiAnaW5zdGFsbCcgfSkpXG4gICAgICAgICAgICAgICAgICAgIG8ucHJldmlvdXNWZXJzaW9uID0gbWFuaWZlc3QudmVyc2lvblxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9LCAyMDAwKVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uXG59XG5cbmZ1bmN0aW9uIGdldENvbnRleHQobWFuaWZlc3Q6IE1hbmlmZXN0LCBleHRlbnNpb25JRDogc3RyaW5nLCBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgICBsZXQgZW52aXJvbm1lbnQ6IEVudmlyb25tZW50XG4gICAgaWYgKGxvY2F0aW9uLnByb3RvY29sID09PSAnaG9sb2Zsb3dzLWV4dGVuc2lvbjonKSB7XG4gICAgICAgIGlmIChsb2NhdGlvbi5wYXRobmFtZSA9PT0gJy9fZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZS5odG1sJykge1xuICAgICAgICAgICAgZW52aXJvbm1lbnQgPSBFbnZpcm9ubWVudC5iYWNrZ3JvdW5kU2NyaXB0XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBtYW5pZmVzdC5iYWNrZ3JvdW5kICYmXG4gICAgICAgICAgICBtYW5pZmVzdC5iYWNrZ3JvdW5kLnBhZ2UgJiZcbiAgICAgICAgICAgIGxvY2F0aW9uLnBhdGhuYW1lID09PSAnLycgKyBtYW5pZmVzdC5iYWNrZ3JvdW5kLnBhZ2VcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBlbnZpcm9ubWVudCA9IEVudmlyb25tZW50LmJhY2tncm91bmRTY3JpcHRcbiAgICAgICAgfSBlbHNlIGVudmlyb25tZW50ID0gRW52aXJvbm1lbnQucHJvdG9jb2xQYWdlXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZW52aXJvbm1lbnQgPSBFbnZpcm9ubWVudC5jb250ZW50U2NyaXB0XG4gICAgfVxuICAgIGNvbnNvbGUuZGVidWcoXG4gICAgICAgIGBbV2ViRXh0ZW5zaW9uXSBMb2FkaW5nIGV4dGVuc2lvbiAke21hbmlmZXN0Lm5hbWV9KCR7ZXh0ZW5zaW9uSUR9KSB3aXRoIG1hbmlmZXN0YCxcbiAgICAgICAgbWFuaWZlc3QsXG4gICAgICAgIGBhbmQgcHJlbG9hZGVkIHJlc291cmNlYCxcbiAgICAgICAgcHJlbG9hZGVkUmVzb3VyY2VzLFxuICAgICAgICBgaW4gJHtlbnZpcm9ubWVudH0gbW9kZWAsXG4gICAgKVxuICAgIHJldHVybiBlbnZpcm9ubWVudFxufVxuXG5mdW5jdGlvbiB1bnRpbERvY3VtZW50UmVhZHkoKSB7XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIHJlc29sdmUsIHsgb25jZTogdHJ1ZSwgcGFzc2l2ZTogdHJ1ZSB9KVxuICAgIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIExvYWRQcm90b2NvbFBhZ2UoXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICAgIGxvYWRpbmdQYWdlVVJMOiBzdHJpbmcsXG4pIHtcbiAgICBsb2FkaW5nUGFnZVVSTCA9IG5ldyBVUkwobG9hZGluZ1BhZ2VVUkwsICdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJyArIGV4dGVuc2lvbklEICsgJy8nKS50b0pTT04oKVxuICAgIHdyaXRlSFRNTFNjcmlwdEVsZW1lbnRTcmMoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0LCBwcmVsb2FkZWRSZXNvdXJjZXMsIGxvYWRpbmdQYWdlVVJMKVxuICAgIGF3YWl0IGxvYWRQcm90b2NvbFBhZ2VUb0N1cnJlbnRQYWdlKGV4dGVuc2lvbklELCBtYW5pZmVzdCwgcHJlbG9hZGVkUmVzb3VyY2VzLCBsb2FkaW5nUGFnZVVSTClcbn1cblxuYXN5bmMgZnVuY3Rpb24gTG9hZEJhY2tncm91bmRTY3JpcHQoXG4gICAgbWFuaWZlc3Q6IE1hbmlmZXN0LFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuKSB7XG4gICAgaWYgKCFtYW5pZmVzdC5iYWNrZ3JvdW5kKSByZXR1cm5cbiAgICBjb25zdCB7IHBhZ2UsIHNjcmlwdHMgfSA9IChtYW5pZmVzdC5iYWNrZ3JvdW5kIGFzIGFueSkgYXMgeyBwYWdlOiBzdHJpbmc7IHNjcmlwdHM6IHN0cmluZ1tdIH1cbiAgICBpZiAoIWlzRGVidWcgJiYgbG9jYXRpb24ucHJvdG9jb2wgIT09ICdob2xvZmxvd3MtZXh0ZW5zaW9uOicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgQmFja2dyb3VuZCBzY3JpcHQgb25seSBhbGxvd2VkIGluIGxvY2FsaG9zdChmb3IgZGVidWdnaW5nKSBhbmQgaG9sb2Zsb3dzLWV4dGVuc2lvbjovL2ApXG4gICAgfVxuICAgIGxldCBjdXJyZW50UGFnZSA9ICdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJyArIGV4dGVuc2lvbklEICsgJy9fZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZS5odG1sJ1xuICAgIGlmIChwYWdlKSB7XG4gICAgICAgIGlmIChzY3JpcHRzICYmIHNjcmlwdHMubGVuZ3RoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgSW4gdGhlIG1hbmlmZXN0LCB5b3UgY2FuJ3QgaGF2ZSBib3RoIFwicGFnZVwiIGFuZCBcInNjcmlwdHNcIiBmb3IgYmFja2dyb3VuZCBmaWVsZCFgKVxuICAgICAgICBjb25zdCBwYWdlVVJMID0gbmV3IFVSTChwYWdlLCBsb2NhdGlvbi5vcmlnaW4pXG4gICAgICAgIGlmIChwYWdlVVJMLm9yaWdpbiAhPT0gbG9jYXRpb24ub3JpZ2luKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgWW91IGNhbiBub3Qgc3BlY2lmeSBhIGZvcmVpZ24gb3JpZ2luIGZvciB0aGUgYmFja2dyb3VuZCBwYWdlYClcbiAgICAgICAgY3VycmVudFBhZ2UgPSAnaG9sb2Zsb3dzLWV4dGVuc2lvbjovLycgKyBleHRlbnNpb25JRCArICcvJyArIHBhZ2VcbiAgICB9XG4gICAgd3JpdGVIVE1MU2NyaXB0RWxlbWVudFNyYyhleHRlbnNpb25JRCwgbWFuaWZlc3QsIHByZWxvYWRlZFJlc291cmNlcywgY3VycmVudFBhZ2UpXG4gICAgaWYgKHBhZ2UpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlICE9PSBsb2NhdGlvbi5ocmVmKSB7XG4gICAgICAgICAgICBhd2FpdCBsb2FkUHJvdG9jb2xQYWdlVG9DdXJyZW50UGFnZShleHRlbnNpb25JRCwgbWFuaWZlc3QsIHByZWxvYWRlZFJlc291cmNlcywgcGFnZSlcbiAgICAgICAgICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAgICAgICBpZiAoaXNEZWJ1Zykge1xuICAgICAgICAgICAgICAgIGRpdi5pbm5lckhUTUwgPSBgXG48c3R5bGU+Ym9keXtiYWNrZ3JvdW5kOiBibGFjazsgY29sb3I6IHdoaXRlO2ZvbnQtZmFtaWx5OiBzeXN0ZW0tdWk7fTwvc3R5bGU+XG5UaGlzIHBhZ2UgaXMgaW4gdGhlIGRlYnVnIG1vZGUgb2YgV2ViRXh0ZW5zaW9uLXBvbHlmaWxsPGJyIC8+XG5JdCdzIHJ1bm5pbmcgaW4gdGhlIGJhY2tncm91bmQgcGFnZSBtb2RlYFxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZGl2KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChjb25zdCBwYXRoIG9mIChzY3JpcHRzIGFzIHN0cmluZ1tdKSB8fCBbXSkge1xuICAgICAgICAgICAgY29uc3QgcHJlbG9hZGVkID0gYXdhaXQgZ2V0UmVzb3VyY2VBc3luYyhleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzLCBwYXRoKVxuICAgICAgICAgICAgaWYgKHByZWxvYWRlZCkge1xuICAgICAgICAgICAgICAgIC8vID8gUnVuIGl0IGluIGdsb2JhbCBzY29wZS5cbiAgICAgICAgICAgICAgICBSdW5JblByb3RvY29sU2NvcGUoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0LCBwcmVsb2FkZWQsIGN1cnJlbnRQYWdlKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbV2ViRXh0ZW5zaW9uXSBCYWNrZ3JvdW5kIHNjcmlwdHMgbm90IGZvdW5kIGZvciAke21hbmlmZXN0Lm5hbWV9OiAke3BhdGh9YClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZFByb3RvY29sUGFnZVRvQ3VycmVudFBhZ2UoXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICAgIHBhZ2U6IHN0cmluZyxcbikge1xuICAgIGNvbnN0IGh0bWwgPSBhd2FpdCBnZXRSZXNvdXJjZUFzeW5jKGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMsIHBhZ2UpXG4gICAgaWYgKCFodG1sKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgZmluZCBiYWNrZ3JvdW5kIHBhZ2UuJylcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKClcbiAgICBjb25zdCBkb20gPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKVxuICAgIGNvbnN0IHNjcmlwdHMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgQXJyYXkuZnJvbShkb20ucXVlcnlTZWxlY3RvckFsbCgnc2NyaXB0JykpLm1hcChhc3luYyBzY3JpcHQgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IG5ldyBVUkwoc2NyaXB0LnNyYykucGF0aG5hbWVcbiAgICAgICAgICAgIHNjcmlwdC5yZW1vdmUoKVxuICAgICAgICAgICAgcmV0dXJuIFtwYXRoLCBhd2FpdCBnZXRSZXNvdXJjZUFzeW5jKGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMsIHBhdGgpXVxuICAgICAgICB9KSxcbiAgICApXG4gICAgZm9yIChjb25zdCBjIG9mIGRvY3VtZW50LmhlYWQuY2hpbGRyZW4pIGMucmVtb3ZlKClcbiAgICBmb3IgKGNvbnN0IGMgb2YgZG9tLmhlYWQuY2hpbGRyZW4pIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoYylcbiAgICBmb3IgKGNvbnN0IGMgb2YgZG9jdW1lbnQuYm9keS5jaGlsZHJlbikgYy5yZW1vdmUoKVxuICAgIGZvciAoY29uc3QgYyBvZiBkb20uYm9keS5jaGlsZHJlbikgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjKVxuICAgIGZvciAoY29uc3QgW3BhdGgsIHNjcmlwdF0gb2Ygc2NyaXB0cykge1xuICAgICAgICBpZiAoc2NyaXB0KVxuICAgICAgICAgICAgUnVuSW5Qcm90b2NvbFNjb3BlKFxuICAgICAgICAgICAgICAgIGV4dGVuc2lvbklELFxuICAgICAgICAgICAgICAgIG1hbmlmZXN0LFxuICAgICAgICAgICAgICAgIHNjcmlwdCxcbiAgICAgICAgICAgICAgICBuZXcgVVJMKHBhZ2UsICdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJyArIGV4dGVuc2lvbklEICsgJy8nKS50b0pTT04oKSxcbiAgICAgICAgICAgIClcbiAgICAgICAgZWxzZSBjb25zb2xlLmVycm9yKCdSZXNvdXJjZScsIHBhdGgsICdub3QgZm91bmQnKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcHJlcGFyZUV4dGVuc2lvblByb3RvY29sRW52aXJvbm1lbnQoZXh0ZW5zaW9uSUQ6IHN0cmluZywgbWFuaWZlc3Q6IE1hbmlmZXN0KSB7XG4gICAgcmV3cml0ZVdvcmtlcihleHRlbnNpb25JRClcbiAgICBPYmplY3QuYXNzaWduKHdpbmRvdywge1xuICAgICAgICBicm93c2VyOiBCcm93c2VyRmFjdG9yeShleHRlbnNpb25JRCwgbWFuaWZlc3QpLFxuICAgICAgICBmZXRjaDogY3JlYXRlRmV0Y2goZXh0ZW5zaW9uSUQsIHdpbmRvdy5mZXRjaCksXG4gICAgICAgIFVSTDogZW5oYW5jZVVSTChVUkwsIGV4dGVuc2lvbklEKSxcbiAgICAgICAgb3Blbjogb3BlbkVuaGFuY2VkKGV4dGVuc2lvbklEKSxcbiAgICAgICAgY2xvc2U6IGNsb3NlRW5oYW5jZWQoZXh0ZW5zaW9uSUQpLFxuICAgIH0gYXMgUGFydGlhbDx0eXBlb2YgZ2xvYmFsVGhpcz4pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBSdW5JblByb3RvY29sU2NvcGUoZXh0ZW5zaW9uSUQ6IHN0cmluZywgbWFuaWZlc3Q6IE1hbmlmZXN0LCBzb3VyY2U6IHN0cmluZywgY3VycmVudFBhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChsb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2hvbG9mbG93cy1leHRlbnNpb246Jykge1xuICAgICAgICBjb25zdCBsaWtlRVNNb2R1bGUgPSBzb3VyY2UubWF0Y2goJ2ltcG9ydCcpIHx8IHNvdXJjZS5tYXRjaCgnZXhwb3J0ICcpXG4gICAgICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgICAgIHNjcmlwdC50eXBlID0gbGlrZUVTTW9kdWxlID8gJ21vZHVsZScgOiAndGV4dC9qYXZhc2NyaXB0J1xuICAgICAgICBzY3JpcHQuaW5uZXJIVE1MID0gc291cmNlXG4gICAgICAgIHNjcmlwdC5kZWZlciA9IHRydWVcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpXG4gICAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoIWlzRGVidWcpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1J1biBpbiB0aGUgd3Jvbmcgc2NvcGUnKVxuICAgIGlmIChzb3VyY2UuaW5kZXhPZignYnJvd3NlcicpKSB7XG4gICAgICAgIGNvbnN0IGluZGlyZWN0RXZhbCA9IE1hdGgucmFuZG9tKCkgPiAtMSA/IGV2YWwgOiAoKSA9PiB7fVxuICAgICAgICBjb25zdCBmID0gaW5kaXJlY3RFdmFsKGAoZnVuY3Rpb24oXyl7d2l0aChfKXske3NvdXJjZX19fSlgKVxuICAgICAgICBjb25zdCBfID0gKHg6IGtleW9mIHR5cGVvZiBSZWZsZWN0KSA9PiAodGFyZ2V0OiBhbnksIC4uLmFueTogYW55W10pID0+XG4gICAgICAgICAgICBSZWZsZWN0LmFwcGx5KFJlZmxlY3RbeF0sIG51bGwsIFt3aW5kb3csIC4uLmFueV0pXG4gICAgICAgIGNvbnN0IHNhZmVHZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSAob2JqOiBhbnksIGtleTogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvcmlnID0gUmVmbGVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpXG4gICAgICAgICAgICBpZiAoIW9yaWcpIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgICAgIHJldHVybiB7IC4uLm9yaWcsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBlbnYsIHNyYyB9ID0gcGFyc2VEZWJ1Z01vZGVVUkwoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0KVxuICAgICAgICBjb25zdCBsb2NhdGlvblByb3h5ID0gY3JlYXRlTG9jYXRpb25Qcm94eShleHRlbnNpb25JRCwgbWFuaWZlc3QsIGN1cnJlbnRQYWdlIHx8IHNyYylcbiAgICAgICAgY29uc3QgZ2xvYmFsUHJveHlUcmFwID0gbmV3IFByb3h5KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGdldCh0YXJnZXQ6IGFueSwga2V5OiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3dpbmRvdycpIHJldHVybiBnbG9iYWxQcm94eVxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAnZ2xvYmFsVGhpcycpIHJldHVybiBnbG9iYWxQcm94eVxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAnbG9jYXRpb24nKSByZXR1cm4gbG9jYXRpb25Qcm94eVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmogPSB3aW5kb3dba2V5XSBhcyBhbnlcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlc2MyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMob2JqKVxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZiguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXcudGFyZ2V0KSByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3Qob2JqLCBhcmdzLCBuZXcudGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KG9iaiwgd2luZG93LCBhcmdzKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZiwgZGVzYzIpXG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YoZiwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmpcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcjogc2FmZUdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICAgICAgICAgIH0gYXMgUHJveHlIYW5kbGVyPGFueT4sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZ2V0KHRhcmdldDogYW55LCBrZXk6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0W2tleV0pIHJldHVybiB0YXJnZXRba2V5XVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXyhrZXkpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgZ2xvYmFsUHJveHk6IHR5cGVvZiB3aW5kb3cgPSBuZXcgUHJveHkoe30sIGdsb2JhbFByb3h5VHJhcCkgYXMgYW55XG4gICAgICAgIGYoZ2xvYmFsUHJveHkpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZXZhbChzb3VyY2UpXG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBMb2FkQ29udGVudFNjcmlwdChcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4gICAgZGVidWdNb2RlUHJldGVuZGVkVVJMPzogc3RyaW5nLFxuKSB7XG4gICAgaWYgKCFpc0RlYnVnICYmIGRlYnVnTW9kZVByZXRlbmRlZFVSTCkgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBzdGF0ZScpXG4gICAgaWYgKGlzRGVidWcpIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSBgXG48c3R5bGU+Ym9keXtiYWNrZ3JvdW5kOiBibGFjazsgY29sb3I6IHdoaXRlO2ZvbnQtZmFtaWx5OiBzeXN0ZW0tdWk7fTwvc3R5bGU+XG48ZGl2PlRoaXMgcGFnZSBpcyBydW5uaW5nIGluIHRoZSBkZWJ1ZyBtb2RlIG9mIFdlYkV4dGVuc2lvbiBwb2x5ZmlsbDwvZGl2PlxuPGRpdj5JdCBub3cgcHJldGVuZGluZyB0byBiZSAke2RlYnVnTW9kZVByZXRlbmRlZFVSTH08L2Rpdj5cbjxkaXY+U28geW91ciBjb250ZW50IHNjcmlwdCB3aWxsIGluamVjdCBpbnRvIHRoaXMgcGFnZS48L2Rpdj5cbjxociAvPlxuQ29weSBhbmQgYXBwbHkgdGhlIHdlYnBhZ2UgdG8gZGVidWcgeW91ciBjb250ZW50IHNjcmlwdDpcblxuPHRleHRhcmVhIGlkPVwiYVwiPjwvdGV4dGFyZWE+XG48YnIgLz5cbjxidXR0b24gb25jbGljaz1cIlxudmFyIHAgPSBuZXcgRE9NUGFyc2VyKCk7XG52YXIgZG9tID0gcC5wYXJzZUZyb21TdHJpbmcoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2EnKS52YWx1ZSwgJ3RleHQvaHRtbCcpO1xuZG9tLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NjcmlwdCcpLmZvckVhY2goeCA9PiB4LnJlbW92ZSgpKTtcbnZhciB4ID0gbmV3IFhNTFNlcmlhbGl6ZXIoKTtcbnZhciBodG1sID0geC5zZXJpYWxpemVUb1N0cmluZyhkb20pO1xuZG9jdW1lbnQud3JpdGUoaHRtbCk7XCI+UmVtb3ZlIHNjcmlwdCB0YWdzIGFuZCBnbzwvYnV0dG9uPlxuYFxuICAgIH1cbiAgICBpZiAoIXJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uaGFzKGV4dGVuc2lvbklEKSkge1xuICAgICAgICBjb25zdCBlbnZpcm9ubWVudCA9IG5ldyBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnQoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0KVxuICAgICAgICBpZiAoZGVidWdNb2RlUHJldGVuZGVkVVJMKVxuICAgICAgICAgICAgZW52aXJvbm1lbnQuZ2xvYmFsLmxvY2F0aW9uID0gY3JlYXRlTG9jYXRpb25Qcm94eShleHRlbnNpb25JRCwgbWFuaWZlc3QsIGRlYnVnTW9kZVByZXRlbmRlZFVSTClcbiAgICAgICAgY29uc3QgZXh0OiBXZWJFeHRlbnNpb24gPSB7XG4gICAgICAgICAgICBtYW5pZmVzdCxcbiAgICAgICAgICAgIGVudmlyb25tZW50LFxuICAgICAgICAgICAgcHJlbG9hZGVkUmVzb3VyY2VzLFxuICAgICAgICB9XG4gICAgICAgIHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uc2V0KGV4dGVuc2lvbklELCBleHQpXG4gICAgfVxuICAgIGZvciAoY29uc3QgW2luZGV4LCBjb250ZW50XSBvZiAobWFuaWZlc3QuY29udGVudF9zY3JpcHRzIHx8IFtdKS5lbnRyaWVzKCkpIHtcbiAgICAgICAgd2FybmluZ05vdEltcGxlbWVudGVkSXRlbShjb250ZW50LCBpbmRleClcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgbWF0Y2hpbmdVUkwoXG4gICAgICAgICAgICAgICAgbmV3IFVSTChkZWJ1Z01vZGVQcmV0ZW5kZWRVUkwgfHwgbG9jYXRpb24uaHJlZiksXG4gICAgICAgICAgICAgICAgY29udGVudC5tYXRjaGVzLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQuZXhjbHVkZV9tYXRjaGVzIHx8IFtdLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQuaW5jbHVkZV9nbG9icyB8fCBbXSxcbiAgICAgICAgICAgICAgICBjb250ZW50LmV4Y2x1ZGVfZ2xvYnMgfHwgW10sXG4gICAgICAgICAgICAgICAgY29udGVudC5tYXRjaF9hYm91dF9ibGFuayxcbiAgICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbV2ViRXh0ZW5zaW9uXSBMb2FkaW5nIGNvbnRlbnQgc2NyaXB0IGZvcmAsIGNvbnRlbnQpXG4gICAgICAgICAgICBhd2FpdCBsb2FkQ29udGVudFNjcmlwdChleHRlbnNpb25JRCwgbWFuaWZlc3QsIGNvbnRlbnQsIHByZWxvYWRlZFJlc291cmNlcylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtXZWJFeHRlbnNpb25dIFVSTCBtaXNtYXRjaGVkLiBTa2lwIGNvbnRlbnQgc2NyaXB0IGZvciwgYCwgY29udGVudClcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRDb250ZW50U2NyaXB0KFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgbWFuaWZlc3Q6IE1hbmlmZXN0LFxuICAgIGNvbnRlbnQ6IE5vbk51bGxhYmxlPE1hbmlmZXN0Wydjb250ZW50X3NjcmlwdHMnXT5bMF0sXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0gcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5oYXMoZXh0ZW5zaW9uSUQpXG4gICAgICAgID8gcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5nZXQoZXh0ZW5zaW9uSUQpIS5wcmVsb2FkZWRSZXNvdXJjZXNcbiAgICAgICAgOiB7fSxcbikge1xuICAgIGNvbnN0IHsgZW52aXJvbm1lbnQgfSA9IHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uZ2V0KGV4dGVuc2lvbklEKSFcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgY29udGVudC5qcyB8fCBbXSkge1xuICAgICAgICBjb25zdCBwcmVsb2FkZWQgPSBhd2FpdCBnZXRSZXNvdXJjZUFzeW5jKGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMsIHBhdGgpXG4gICAgICAgIGlmIChwcmVsb2FkZWQpIHtcbiAgICAgICAgICAgIGVudmlyb25tZW50LmV2YWx1YXRlKHByZWxvYWRlZClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtXZWJFeHRlbnNpb25dIENvbnRlbnQgc2NyaXB0cyBub3QgZm91bmQgZm9yICR7bWFuaWZlc3QubmFtZX06ICR7cGF0aH1gKVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiB3YXJuaW5nTm90SW1wbGVtZW50ZWRJdGVtKGNvbnRlbnQ6IE5vbk51bGxhYmxlPE1hbmlmZXN0Wydjb250ZW50X3NjcmlwdHMnXT5bMF0sIGluZGV4OiBudW1iZXIpIHtcbiAgICBpZiAoY29udGVudC5hbGxfZnJhbWVzKVxuICAgICAgICBjb25zb2xlLndhcm4oYGFsbF9mcmFtZXMgbm90IHN1cHBvcnRlZCB5ZXQuIERlZmluZWQgYXQgbWFuaWZlc3QuY29udGVudF9zY3JpcHRzWyR7aW5kZXh9XS5hbGxfZnJhbWVzYClcbiAgICBpZiAoY29udGVudC5jc3MpIGNvbnNvbGUud2FybihgY3NzIG5vdCBzdXBwb3J0ZWQgeWV0LiBEZWZpbmVkIGF0IG1hbmlmZXN0LmNvbnRlbnRfc2NyaXB0c1ske2luZGV4fV0uY3NzYClcbiAgICBpZiAoY29udGVudC5ydW5fYXQgJiYgY29udGVudC5ydW5fYXQgIT09ICdkb2N1bWVudF9zdGFydCcpXG4gICAgICAgIGNvbnNvbGUud2FybihgcnVuX2F0IG5vdCBzdXBwb3J0ZWQgeWV0LiBEZWZpbmVkIGF0IG1hbmlmZXN0LmNvbnRlbnRfc2NyaXB0c1ske2luZGV4fV0ucnVuX2F0YClcbn1cbiIsImltcG9ydCB7IEFzeW5jQ2FsbCB9IGZyb20gJ0Bob2xvZmxvd3Mva2l0L2VzJ1xuaW1wb3J0IHsgSG9zdCwgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiwgU2FtZVBhZ2VEZWJ1Z0NoYW5uZWwgfSBmcm9tICcuLi9SUEMnXG5pbXBvcnQgeyB1c2VJbnRlcm5hbFN0b3JhZ2UgfSBmcm9tICcuLi9pbnRlcm5hbCdcbmltcG9ydCB7IGdldFJlc291cmNlQXN5bmMgfSBmcm9tICcuLi91dGlscy9SZXNvdXJjZXMnXG5pbXBvcnQgeyBpc0RlYnVnLCBwYXJzZURlYnVnTW9kZVVSTCB9IGZyb20gJy4vaXNEZWJ1Z01vZGUnXG5pbXBvcnQgeyBkZWJ1Z01vZGVVUkxSZXdyaXRlIH0gZnJvbSAnLi91cmwtcmV3cml0ZSdcblxuY29uc3QgbG9nOiA8VD4ocnQ6IFQpID0+ICguLi5hcmdzOiBhbnlbXSkgPT4gUHJvbWlzZTxUPiA9IHJ0ID0+IGFzeW5jICguLi5hcmdzKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ01vY2tlZCBIb3N0JywgLi4uYXJncylcbiAgICByZXR1cm4gcnQhXG59XG5cbmNsYXNzIENyb3NzUGFnZURlYnVnQ2hhbm5lbCB7XG4gICAgYnJvYWRjYXN0ID0gbmV3IEJyb2FkY2FzdENoYW5uZWwoJ3dlYmV4dC1wb2x5ZmlsbC1kZWJ1ZycpXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYnJvYWRjYXN0LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBlID0+IHtcbiAgICAgICAgICAgIGlmIChlLm9yaWdpbiAhPT0gbG9jYXRpb24ub3JpZ2luKSBjb25zb2xlLndhcm4oZS5vcmlnaW4sIGxvY2F0aW9uLm9yaWdpbilcbiAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9IGUuZGF0YVxuICAgICAgICAgICAgZm9yIChjb25zdCBmIG9mIHRoaXMubGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBmKGRldGFpbClcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgIHByaXZhdGUgbGlzdGVuZXI6IEFycmF5PChkYXRhOiB1bmtub3duKSA9PiB2b2lkPiA9IFtdXG4gICAgb24oXzogc3RyaW5nLCBjYjogKGRhdGE6IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnB1c2goY2IpXG4gICAgfVxuICAgIGVtaXQoXzogc3RyaW5nLCBkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5icm9hZGNhc3QucG9zdE1lc3NhZ2UoZGF0YSlcbiAgICB9XG59XG5cbmludGVyZmFjZSBNb2NrZWRMb2NhbFNlcnZpY2Uge1xuICAgIG9uTWVzc2FnZTogVGhpc1NpZGVJbXBsZW1lbnRhdGlvblsnb25NZXNzYWdlJ11cbiAgICBvbkNvbW1pdHRlZDogVGhpc1NpZGVJbXBsZW1lbnRhdGlvblsnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJ11cbn1cbmlmIChpc0RlYnVnKSB7XG4gICAgY29uc3QgbW9ja0hvc3QgPSBBc3luY0NhbGw8TW9ja2VkTG9jYWxTZXJ2aWNlPihcbiAgICAgICAge1xuICAgICAgICAgICAgb25NZXNzYWdlOiBUaGlzU2lkZUltcGxlbWVudGF0aW9uLm9uTWVzc2FnZSxcbiAgICAgICAgICAgIG9uQ29tbWl0dGVkOiBUaGlzU2lkZUltcGxlbWVudGF0aW9uWydicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnXSxcbiAgICAgICAgfSBhcyBNb2NrZWRMb2NhbFNlcnZpY2UsXG4gICAgICAgIHtcbiAgICAgICAgICAgIGtleTogJ21vY2snLFxuICAgICAgICAgICAgbG9nOiBmYWxzZSxcbiAgICAgICAgICAgIG1lc3NhZ2VDaGFubmVsOiBuZXcgQ3Jvc3NQYWdlRGVidWdDaGFubmVsKCksXG4gICAgICAgIH0sXG4gICAgKVxuICAgIGNvbnN0IG15VGFiSUQgPSBNYXRoLnJhbmRvbSgpXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IG9iaiA9IHBhcnNlRGVidWdNb2RlVVJMKCcnLCB7fSBhcyBhbnkpXG4gICAgICAgIG1vY2tIb3N0Lm9uQ29tbWl0dGVkKHsgdGFiSWQ6IG15VGFiSUQsIHVybDogb2JqLnNyYyB9KVxuICAgIH0sIDIwMDApXG4gICAgY29uc3QgaG9zdDogSG9zdCA9IHtcbiAgICAgICAgJ1VSTC5jcmVhdGVPYmplY3RVUkwnOiBsb2codm9pZCAwKSxcbiAgICAgICAgJ1VSTC5yZXZva2VPYmplY3RVUkwnOiBsb2codm9pZCAwKSxcbiAgICAgICAgJ2Jyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkJzogbG9nKHZvaWQgMCksXG4gICAgICAgIGFzeW5jIHNlbmRNZXNzYWdlKGUsIHQsIHR0LCBtLCBtbSkge1xuICAgICAgICAgICAgbW9ja0hvc3Qub25NZXNzYWdlKGUsIHQsIG0sIG1tLCB7IGlkOiBuZXcgVVJMU2VhcmNoUGFyYW1zKGxvY2F0aW9uLnNlYXJjaCkuZ2V0KCdpZCcpISB9KVxuICAgICAgICB9LFxuICAgICAgICAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmNsZWFyJzogbG9nKHZvaWQgMCksXG4gICAgICAgIGFzeW5jICdicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0JyhleHRlbnNpb25JRCwgaykge1xuICAgICAgICAgICAgcmV0dXJuIChhd2FpdCB1c2VJbnRlcm5hbFN0b3JhZ2UoZXh0ZW5zaW9uSUQpKS5kZWJ1Z01vZGVTdG9yYWdlIHx8IHt9XG4gICAgICAgIH0sXG4gICAgICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwucmVtb3ZlJzogbG9nKHZvaWQgMCksXG4gICAgICAgIGFzeW5jICdicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0JyhleHRlbnNpb25JRCwgZCkge1xuICAgICAgICAgICAgdXNlSW50ZXJuYWxTdG9yYWdlKGV4dGVuc2lvbklELCBvID0+IChvLmRlYnVnTW9kZVN0b3JhZ2UgPSBPYmplY3QuYXNzaWduKHt9LCBvLmRlYnVnTW9kZVN0b3JhZ2UsIGQpKSlcbiAgICAgICAgfSxcbiAgICAgICAgYXN5bmMgJ2Jyb3dzZXIudGFicy5jcmVhdGUnKGV4dGVuc2lvbklELCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMudXJsKSB0aHJvdyBuZXcgVHlwZUVycm9yKCduZWVkIGEgdXJsJylcbiAgICAgICAgICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcbiAgICAgICAgICAgIGEuaHJlZiA9IGRlYnVnTW9kZVVSTFJld3JpdGUoZXh0ZW5zaW9uSUQsIG9wdGlvbnMudXJsKVxuICAgICAgICAgICAgY29uc3QgcGFyYW0gPSBuZXcgVVJMU2VhcmNoUGFyYW1zKClcbiAgICAgICAgICAgIHBhcmFtLnNldCgndXJsJywgb3B0aW9ucy51cmwpXG4gICAgICAgICAgICBwYXJhbS5zZXQoJ3R5cGUnLCBvcHRpb25zLnVybC5zdGFydHNXaXRoKCdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJykgPyAncCcgOiAnbScpXG4gICAgICAgICAgICBhLmhyZWYgPSAnL2RlYnVnPycgKyBwYXJhbVxuICAgICAgICAgICAgYS5pbm5lclRleHQgPSAnYnJvd3Nlci50YWJzLmNyZWF0ZTogJyArIG9wdGlvbnMudXJsXG4gICAgICAgICAgICBhLnRhcmdldCA9ICdfYmxhbmsnXG4gICAgICAgICAgICBhLnN0eWxlLmNvbG9yID0gJ3doaXRlJ1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKVxuICAgICAgICAgICAgcmV0dXJuIHsgaWQ6IE1hdGgucmFuZG9tKCkgfSBhcyBhbnlcbiAgICAgICAgfSxcbiAgICAgICAgJ2Jyb3dzZXIudGFicy5xdWVyeSc6IGxvZyhbXSksXG4gICAgICAgICdicm93c2VyLnRhYnMucmVtb3ZlJzogbG9nKHZvaWQgMCksXG4gICAgICAgICdicm93c2VyLnRhYnMudXBkYXRlJzogbG9nKHt9IGFzIGJyb3dzZXIudGFicy5UYWIpLFxuICAgICAgICBhc3luYyBmZXRjaChleHRlbnNpb25JRCwgcikge1xuICAgICAgICAgICAgY29uc3QgaCA9IGF3YWl0IGdldFJlc291cmNlQXN5bmMoZXh0ZW5zaW9uSUQsIHt9LCByLnVybClcbiAgICAgICAgICAgIGlmIChoKSByZXR1cm4geyBkYXRhOiB7IGNvbnRlbnQ6IGgsIG1pbWVUeXBlOiAnJywgdHlwZTogJ3RleHQnIH0sIHN0YXR1czogMjAwLCBzdGF0dXNUZXh0OiAnb2snIH1cbiAgICAgICAgICAgIHJldHVybiB7IGRhdGE6IHsgY29udGVudDogJycsIG1pbWVUeXBlOiAnJywgdHlwZTogJ3RleHQnIH0sIHN0YXR1czogNDA0LCBzdGF0dXNUZXh0OiAnTm90IGZvdW5kJyB9XG4gICAgICAgIH0sXG4gICAgfVxuICAgIEFzeW5jQ2FsbChob3N0LCB7XG4gICAgICAgIGtleTogJycsXG4gICAgICAgIGxvZzogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2VDaGFubmVsOiBuZXcgU2FtZVBhZ2VEZWJ1Z0NoYW5uZWwoJ3NlcnZlcicpLFxuICAgIH0pXG59XG4iLCJpbXBvcnQgeyByZWdpc3RlcldlYkV4dGVuc2lvbiB9IGZyb20gJy4vRXh0ZW5zaW9ucydcbmltcG9ydCB7IFdlYkV4dGVuc2lvbkNvbnRlbnRTY3JpcHRFbnZpcm9ubWVudCB9IGZyb20gJy4vc2hpbXMvWFJheVZpc2lvbidcbmltcG9ydCAnLi9kZWJ1Z2dlci9sb2NhbGhvc3QnXG5pbXBvcnQgeyBpc0RlYnVnIH0gZnJvbSAnLi9kZWJ1Z2dlci9pc0RlYnVnTW9kZSdcbi8vICMjIEluamVjdCBoZXJlXG5cbmlmIChpc0RlYnVnKSB7XG4gICAgLy8gbGVhdmVzIHlvdXIgaWQgaGVyZSwgYW5kIHB1dCB5b3VyIGV4dGVuc2lvbiB0byAvZXh0ZW5zaW9uL3tpZH0vXG4gICAgY29uc3QgdGVzdElEcyA9IFsnZW9ma2Rna2hmb2ViZWNtYW1samZhZXBja29lY2poaWInXVxuICAgIHRlc3RJRHMuZm9yRWFjaChpZCA9PlxuICAgICAgICBmZXRjaCgnL2V4dGVuc2lvbi8nICsgaWQgKyAnL21hbmlmZXN0Lmpzb24nKVxuICAgICAgICAgICAgLnRoZW4oeCA9PiB4LnRleHQoKSlcbiAgICAgICAgICAgIC50aGVuKHggPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdMb2FkaW5nIHRlc3QgV2ViRXh0ZW5zaW9uJylcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGdsb2JhbFRoaXMsIHtcbiAgICAgICAgICAgICAgICAgICAgYTogcmVnaXN0ZXJXZWJFeHRlbnNpb24sXG4gICAgICAgICAgICAgICAgICAgIGI6IFdlYkV4dGVuc2lvbkNvbnRlbnRTY3JpcHRFbnZpcm9ubWVudCxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIHJldHVybiByZWdpc3RlcldlYkV4dGVuc2lvbihpZCwgSlNPTi5wYXJzZSh4KSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbih2ID0+IE9iamVjdC5hc3NpZ24oZ2xvYmFsVGhpcywgeyBjOiB2IH0pKSxcbiAgICApXG59XG5cbi8qKlxuICogcmVnaXN0ZXJXZWJFeHRlbnNpb24oXG4gKiAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gKiAgICAgIG1hbmlmZXN0OiBNYW5pZmVzdCxcbiAqICAgICAgcHJlbG9hZGVkUmVzb3VyY2VzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICogKVxuICovXG4iXSwibmFtZXMiOlsiQXN5bmNDYWxsIl0sIm1hcHBpbmdzIjoiOzs7Ozs7SUFBQTs7Ozs7Ozs7QUFRQSxhQUFnQixXQUFXLENBQ3ZCLFFBQWEsRUFDYixPQUFpQixFQUNqQixlQUF5QixFQUN6QixhQUF1QixFQUN2QixhQUF1QixFQUN2QixXQUFxQjtRQUVyQixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUE7O1FBRWxCLEtBQUssTUFBTSxJQUFJLElBQUksT0FBTztZQUFFLElBQUksZUFBZSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDO2dCQUFFLE1BQU0sR0FBRyxJQUFJLENBQUE7UUFDM0YsS0FBSyxNQUFNLElBQUksSUFBSSxlQUFlO1lBQUUsSUFBSSxlQUFlLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQztnQkFBRSxNQUFNLEdBQUcsS0FBSyxDQUFBO1FBQ3ZGLElBQUksYUFBYSxDQUFDLE1BQU07WUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLENBQUE7UUFDMUUsSUFBSSxhQUFhLENBQUMsTUFBTTtZQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0NBQWtDLENBQUMsQ0FBQTtRQUMxRSxPQUFPLE1B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
