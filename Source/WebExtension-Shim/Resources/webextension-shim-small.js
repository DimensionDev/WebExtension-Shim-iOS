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
                        }, ext.preloadedResources);
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
        const response = await Host.fetch(extensionID, { method: 'GET', url });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMvVVJMTWF0Y2hlci50cyIsIi4uL3NyYy91dGlscy9Mb2NhbE1lc3NhZ2VzLnRzIiwiLi4vc3JjL3V0aWxzL2RlZXBDbG9uZS50cyIsIi4uL3NyYy9zaGltcy9icm93c2VyLm1lc3NhZ2UudHMiLCIuLi9zcmMvZGVidWdnZXIvaXNEZWJ1Z01vZGUudHMiLCIuLi9zcmMvUlBDLnRzIiwiLi4vc3JjL3V0aWxzL1N0cmluZ09yQmxvYi50cyIsIi4uL3NyYy9zaGltcy9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTC50cyIsIi4uL3NyYy9pbnRlcm5hbC50cyIsIi4uL3NyYy9zaGltcy9icm93c2VyLnRzIiwiLi4vc3JjL2RlYnVnZ2VyL3VybC1yZXdyaXRlLnRzIiwiLi4vc3JjL3NoaW1zL2ZldGNoLnRzIiwiLi4vc3JjL3V0aWxzL1VzZXJJbnRlcmFjdGl2ZS50cyIsIi4uL3NyYy9zaGltcy93aW5kb3cub3BlbitjbG9zZS50cyIsIi4uL3NyYy90cmFuc2Zvcm1lcnMvdGhpcy10cmFuc2Zvcm1lci50cyIsIi4uL3NyYy90cmFuc2Zvcm1lcnMvaW5kZXgudHMiLCIuLi9zcmMvc2hpbXMvWFJheVZpc2lvbi50cyIsIi4uL3NyYy91dGlscy9SZXNvdXJjZXMudHMiLCIuLi9zcmMvaGlqYWNrcy9IVE1MU2NyaXB0LnByb3RvdHlwZS5zcmMudHMiLCIuLi9zcmMvaGlqYWNrcy9Xb3JrZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yLnRzIiwiLi4vc3JjL2hpamFja3MvbG9jYXRpb24udHMiLCIuLi9zcmMvRXh0ZW5zaW9ucy50cyIsIi4uL3NyYy9kZWJ1Z2dlci9sb2NhbGhvc3QudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDaGVjayBpZiB0aGUgY3VycmVudCBsb2NhdGlvbiBtYXRjaGVzLiBVc2VkIGluIG1hbmlmZXN0Lmpzb24gcGFyc2VyXG4gKiBAcGFyYW0gbG9jYXRpb24gQ3VycmVudCBsb2NhdGlvblxuICogQHBhcmFtIG1hdGNoZXNcbiAqIEBwYXJhbSBleGNsdWRlX21hdGNoZXNcbiAqIEBwYXJhbSBpbmNsdWRlX2dsb2JzXG4gKiBAcGFyYW0gZXhjbHVkZV9nbG9ic1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hpbmdVUkwoXG4gICAgbG9jYXRpb246IFVSTCxcbiAgICBtYXRjaGVzOiBzdHJpbmdbXSxcbiAgICBleGNsdWRlX21hdGNoZXM6IHN0cmluZ1tdLFxuICAgIGluY2x1ZGVfZ2xvYnM6IHN0cmluZ1tdLFxuICAgIGV4Y2x1ZGVfZ2xvYnM6IHN0cmluZ1tdLFxuICAgIGFib3V0X2JsYW5rPzogYm9vbGVhbixcbikge1xuICAgIGxldCByZXN1bHQgPSBmYWxzZVxuICAgIC8vID8gV2UgZXZhbCBtYXRjaGVzIGZpcnN0IHRoZW4gZXZhbCBtaXNtYXRjaGVzXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIG1hdGNoZXMpIGlmIChtYXRjaGVzX21hdGNoZXIoaXRlbSwgbG9jYXRpb24sIGFib3V0X2JsYW5rKSkgcmVzdWx0ID0gdHJ1ZVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBleGNsdWRlX21hdGNoZXMpIGlmIChtYXRjaGVzX21hdGNoZXIoaXRlbSwgbG9jYXRpb24pKSByZXN1bHQgPSBmYWxzZVxuICAgIGlmIChpbmNsdWRlX2dsb2JzLmxlbmd0aCkgY29uc29sZS53YXJuKCdpbmNsdWRlX2dsb2JzIG5vdCBzdXBwb3J0ZWQgeWV0LicpXG4gICAgaWYgKGV4Y2x1ZGVfZ2xvYnMubGVuZ3RoKSBjb25zb2xlLndhcm4oJ2V4Y2x1ZGVfZ2xvYnMgbm90IHN1cHBvcnRlZCB5ZXQuJylcbiAgICByZXR1cm4gcmVzdWx0XG59XG4vKipcbiAqIFN1cHBvcnRlZCBwcm90b2NvbHNcbiAqL1xuY29uc3Qgc3VwcG9ydGVkUHJvdG9jb2xzOiByZWFkb25seSBzdHJpbmdbXSA9IFtcbiAgICAnaHR0cDonLFxuICAgICdodHRwczonLFxuICAgIC8vIFwid3M6XCIsXG4gICAgLy8gXCJ3c3M6XCIsXG4gICAgLy8gXCJmdHA6XCIsXG4gICAgLy8gXCJkYXRhOlwiLFxuICAgIC8vIFwiZmlsZTpcIlxuXVxuZnVuY3Rpb24gbWF0Y2hlc19tYXRjaGVyKF86IHN0cmluZywgbG9jYXRpb246IFVSTCwgYWJvdXRfYmxhbms/OiBib29sZWFuKSB7XG4gICAgaWYgKGxvY2F0aW9uLnRvU3RyaW5nKCkgPT09ICdhYm91dDpibGFuaycgJiYgYWJvdXRfYmxhbmspIHJldHVybiB0cnVlXG4gICAgaWYgKF8gPT09ICc8YWxsX3VybHM+Jykge1xuICAgICAgICBpZiAoc3VwcG9ydGVkUHJvdG9jb2xzLmluY2x1ZGVzKGxvY2F0aW9uLnByb3RvY29sKSkgcmV0dXJuIHRydWVcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGNvbnN0IFtydWxlLCB3aWxkY2FyZFByb3RvY29sXSA9IG5vcm1hbGl6ZVVSTChfKVxuICAgIGlmIChydWxlLnBvcnQgIT09ICcnKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoIXByb3RvY29sX21hdGNoZXIocnVsZS5wcm90b2NvbCwgbG9jYXRpb24ucHJvdG9jb2wsIHdpbGRjYXJkUHJvdG9jb2wpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoIWhvc3RfbWF0Y2hlcihydWxlLmhvc3RuYW1lLCBsb2NhdGlvbi5ob3N0bmFtZSkpIHJldHVybiBmYWxzZVxuICAgIGlmICghcGF0aF9tYXRjaGVyKHJ1bGUucGF0aG5hbWUsIGxvY2F0aW9uLnBhdGhuYW1lLCBsb2NhdGlvbi5zZWFyY2gpKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gdHJ1ZVxufVxuLyoqXG4gKiBOb3JtYWxpemVVUkxcbiAqIEBwYXJhbSBfIC0gVVJMIGRlZmluZWQgaW4gbWFuaWZlc3RcbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplVVJMKF86IHN0cmluZyk6IFtVUkwsIGJvb2xlYW5dIHtcbiAgICBpZiAoXy5zdGFydHNXaXRoKCcqOi8vJykpIHJldHVybiBbbmV3IFVSTChfLnJlcGxhY2UoL15cXCo6LywgJ2h0dHBzOicpKSwgdHJ1ZV1cbiAgICByZXR1cm4gW25ldyBVUkwoXyksIGZhbHNlXVxufVxuZnVuY3Rpb24gcHJvdG9jb2xfbWF0Y2hlcihtYXRjaGVyUHJvdG9jb2w6IHN0cmluZywgY3VycmVudFByb3RvY29sOiBzdHJpbmcsIHdpbGRjYXJkUHJvdG9jb2w6IGJvb2xlYW4pIHtcbiAgICAvLyA/IG9ubHkgYGh0dHA6YCBhbmQgYGh0dHBzOmAgaXMgc3VwcG9ydGVkIGN1cnJlbnRseVxuICAgIGlmICghc3VwcG9ydGVkUHJvdG9jb2xzLmluY2x1ZGVzKGN1cnJlbnRQcm90b2NvbCkpIHJldHVybiBmYWxzZVxuICAgIC8vID8gaWYgd2FudGVkIHByb3RvY29sIGlzIFwiKjpcIiwgbWF0Y2ggZXZlcnl0aGluZ1xuICAgIGlmICh3aWxkY2FyZFByb3RvY29sKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChtYXRjaGVyUHJvdG9jb2wgPT09IGN1cnJlbnRQcm90b2NvbCkgcmV0dXJuIHRydWVcbiAgICByZXR1cm4gZmFsc2Vcbn1cbmZ1bmN0aW9uIGhvc3RfbWF0Y2hlcihtYXRjaGVySG9zdDogc3RyaW5nLCBjdXJyZW50SG9zdDogc3RyaW5nKSB7XG4gICAgLy8gPyAlMkEgaXMgKlxuICAgIGlmIChtYXRjaGVySG9zdCA9PT0gJyUyQScpIHJldHVybiB0cnVlXG4gICAgaWYgKG1hdGNoZXJIb3N0LnN0YXJ0c1dpdGgoJyUyQS4nKSkge1xuICAgICAgICBjb25zdCBwYXJ0ID0gbWF0Y2hlckhvc3QucmVwbGFjZSgvXiUyQS8sICcnKVxuICAgICAgICBpZiAocGFydCA9PT0gY3VycmVudEhvc3QpIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gY3VycmVudEhvc3QuZW5kc1dpdGgocGFydClcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoZXJIb3N0ID09PSBjdXJyZW50SG9zdFxufVxuZnVuY3Rpb24gcGF0aF9tYXRjaGVyKG1hdGNoZXJQYXRoOiBzdHJpbmcsIGN1cnJlbnRQYXRoOiBzdHJpbmcsIGN1cnJlbnRTZWFyY2g6IHN0cmluZykge1xuICAgIGlmICghbWF0Y2hlclBhdGguc3RhcnRzV2l0aCgnLycpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAobWF0Y2hlclBhdGggPT09ICcvKicpIHJldHVybiB0cnVlXG4gICAgLy8gPyAnL2EvYi9jJyBtYXRjaGVzICcvYS9iL2MjMTIzJyBidXQgbm90ICcvYS9iL2M/MTIzJ1xuICAgIGlmIChtYXRjaGVyUGF0aCA9PT0gY3VycmVudFBhdGggJiYgY3VycmVudFNlYXJjaCA9PT0gJycpIHJldHVybiB0cnVlXG4gICAgLy8gPyAnL2EvYi8qJyBtYXRjaGVzIGV2ZXJ5dGhpbmcgc3RhcnRzV2l0aCAnL2EvYi8nXG4gICAgaWYgKG1hdGNoZXJQYXRoLmVuZHNXaXRoKCcqJykgJiYgY3VycmVudFBhdGguc3RhcnRzV2l0aChtYXRjaGVyUGF0aC5zbGljZSh1bmRlZmluZWQsIC0xKSkpIHJldHVybiB0cnVlXG4gICAgaWYgKG1hdGNoZXJQYXRoLmluZGV4T2YoJyonKSA9PT0gLTEpIHJldHVybiBtYXRjaGVyUGF0aCA9PT0gY3VycmVudFBhdGhcbiAgICBjb25zb2xlLndhcm4oJ05vdCBzdXBwb3J0ZWQgcGF0aCBtYXRjaGVyIGluIG1hbmlmZXN0Lmpzb24nLCBtYXRjaGVyUGF0aClcbiAgICByZXR1cm4gdHJ1ZVxufVxuIiwiaW1wb3J0IHsgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uL1JQQydcbnR5cGUgV2ViRXh0ZW5zaW9uSUQgPSBzdHJpbmdcbnR5cGUgTWVzc2FnZUlEID0gc3RyaW5nXG50eXBlIHdlYk5hdmlnYXRpb25PbkNvbW1pdHRlZEFyZ3MgPSBQYXJhbWV0ZXJzPFRoaXNTaWRlSW1wbGVtZW50YXRpb25bJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCddPlxudHlwZSBvbk1lc3NhZ2VBcmdzID0gUGFyYW1ldGVyczxUaGlzU2lkZUltcGxlbWVudGF0aW9uWydvbk1lc3NhZ2UnXT5cbnR5cGUgUG9vbEtleXMgPSAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJyB8ICdicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJyB8ICdicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsJ1xuLyoqXG4gKiBVc2VkIGZvciBrZWVwIHJlZmVyZW5jZSB0byBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlXG4gKi9cbmV4cG9ydCBjb25zdCBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyID0gbmV3IE1hcDxNZXNzYWdlSUQsIFsodmFsOiBhbnkpID0+IGFueSwgKHZhbDogYW55KSA9PiBhbnldPigpXG4vKipcbiAqIFRvIHN0b3JlIGxpc3RlbmVyIGZvciBIb3N0IGRpc3BhdGNoZWQgZXZlbnRzLlxuICovXG5leHBvcnQgY29uc3QgRXZlbnRQb29sczogUmVjb3JkPFBvb2xLZXlzLCBNYXA8V2ViRXh0ZW5zaW9uSUQsIFNldDwoLi4uYXJnczogYW55W10pID0+IGFueT4+PiA9IHtcbiAgICAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJzogbmV3IE1hcCgpLFxuICAgICdicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJzogbmV3IE1hcCgpLFxuICAgICdicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsJzogbmV3IE1hcCgpLFxufVxuLyoqXG4gKiBEaXNwYXRjaCBhIG5vcm1hbCBldmVudCAodGhhdCBub3QgaGF2ZSBhIFwicmVzcG9uc2VcIikuXG4gKiBMaWtlIGJyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGlzcGF0Y2hOb3JtYWxFdmVudChldmVudDogUG9vbEtleXMsIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyB8IHN0cmluZ1tdIHwgJyonLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgIGlmICghRXZlbnRQb29sc1tldmVudF0pIHJldHVyblxuICAgIGZvciAoY29uc3QgW2V4dGVuc2lvbklELCBmbnNdIG9mIEV2ZW50UG9vbHNbZXZlbnRdLmVudHJpZXMoKSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0b0V4dGVuc2lvbklEKSAmJiB0b0V4dGVuc2lvbklELmluZGV4T2YoZXh0ZW5zaW9uSUQpID09PSAtMSkgY29udGludWVcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRvRXh0ZW5zaW9uSUQpICYmIHRvRXh0ZW5zaW9uSUQgIT09IGV4dGVuc2lvbklEICYmIHRvRXh0ZW5zaW9uSUQgIT09ICcqJykgY29udGludWVcbiAgICAgICAgZm9yIChjb25zdCBmIG9mIGZucykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmKC4uLmFyZ3MpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuLyoqXG4gKiBDcmVhdGUgYSBgRXZlbnRPYmplY3Q8TGlzdGVuZXJUeXBlPmAgb2JqZWN0LlxuICpcbiAqIENhbiBiZSBzZXQgb24gYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkIGV0Yy4uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXZlbnRMaXN0ZW5lcihleHRlbnNpb25JRDogc3RyaW5nLCBldmVudDogUG9vbEtleXMpIHtcbiAgICBpZiAoIUV2ZW50UG9vbHNbZXZlbnRdLmhhcyhleHRlbnNpb25JRCkpIHtcbiAgICAgICAgRXZlbnRQb29sc1tldmVudF0uc2V0KGV4dGVuc2lvbklELCBuZXcgU2V0KCkpXG4gICAgfVxuICAgIGNvbnN0IHBvb2wgPSBFdmVudFBvb2xzW2V2ZW50XS5nZXQoZXh0ZW5zaW9uSUQpIVxuICAgIGNvbnN0IGhhbmRsZXI6IEV2ZW50T2JqZWN0PCguLi5hcmdzOiBhbnlbXSkgPT4gYW55PiA9IHtcbiAgICAgICAgYWRkTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgZnVuY3Rpb24nKVxuICAgICAgICAgICAgcG9vbC5hZGQoY2FsbGJhY2spXG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUxpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBwb29sLmRlbGV0ZShjYWxsYmFjaylcbiAgICAgICAgfSxcbiAgICAgICAgaGFzTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBwb29sLmhhcyhsaXN0ZW5lcilcbiAgICAgICAgfSxcbiAgICB9XG4gICAgcmV0dXJuIGhhbmRsZXJcbn1cblxuaW50ZXJmYWNlIEV2ZW50T2JqZWN0PFQgZXh0ZW5kcyAoLi4uYXJnczogYW55W10pID0+IGFueT4ge1xuICAgIGFkZExpc3RlbmVyOiAoY2FsbGJhY2s6IFQpID0+IHZvaWRcbiAgICByZW1vdmVMaXN0ZW5lcjogKGxpc3RlbmVyOiBUKSA9PiB2b2lkXG4gICAgaGFzTGlzdGVuZXI6IChsaXN0ZW5lcjogVCkgPT4gYm9vbGVhblxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGRlZXBDbG9uZTxUPihvYmo6IFQpOiBUIHtcbiAgICAvLyB0b2RvOiBjaGFuZ2UgYW5vdGhlciBpbXBsIHBsei5cbiAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmopKVxufVxuIiwiaW1wb3J0IHsgSG9zdCwgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uL1JQQydcblxuaW1wb3J0IHsgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlciwgRXZlbnRQb29scyB9IGZyb20gJy4uL3V0aWxzL0xvY2FsTWVzc2FnZXMnXG5pbXBvcnQgeyBkZWVwQ2xvbmUgfSBmcm9tICcuLi91dGlscy9kZWVwQ2xvbmUnXG4vKipcbiAqIENyZWF0ZSBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoKSBmdW5jdGlvblxuICogQHBhcmFtIGV4dGVuc2lvbklEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSdW50aW1lU2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHRvRXh0ZW5zaW9uSUQ6IHN0cmluZywgbWVzc2FnZTogdW5rbm93blxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9IGV4dGVuc2lvbklEXG4gICAgICAgICAgICBtZXNzYWdlID0gYXJndW1lbnRzWzBdXG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9IGFyZ3VtZW50c1swXVxuICAgICAgICAgICAgbWVzc2FnZSA9IGFyZ3VtZW50c1sxXVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9ICcnXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbmRNZXNzYWdlV2l0aFJlc3BvbnNlKGV4dGVuc2lvbklELCB0b0V4dGVuc2lvbklELCBudWxsLCBtZXNzYWdlKVxuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBzZW5kTWVzc2FnZVdpdGhSZXNwb25zZTxVPihcbiAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICB0YWJJZDogbnVtYmVyIHwgbnVsbCxcbiAgICBtZXNzYWdlOiB1bmtub3duLFxuKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFU+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgbWVzc2FnZUlEID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygpXG4gICAgICAgIEhvc3Quc2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQsIHRvRXh0ZW5zaW9uSUQsIHRhYklkLCBtZXNzYWdlSUQsIHtcbiAgICAgICAgICAgIHR5cGU6ICdtZXNzYWdlJyxcbiAgICAgICAgICAgIGRhdGE6IG1lc3NhZ2UsXG4gICAgICAgICAgICByZXNwb25zZTogZmFsc2UsXG4gICAgICAgIH0pLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGUpXG4gICAgICAgICAgICBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmRlbGV0ZShtZXNzYWdlSUQpXG4gICAgICAgIH0pXG4gICAgICAgIFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIuc2V0KG1lc3NhZ2VJRCwgW3Jlc29sdmUsIHJlamVjdF0pXG4gICAgfSlcbn1cblxuLyoqXG4gKiBNZXNzYWdlIGhhbmRsZXIgb2Ygbm9ybWFsIG1lc3NhZ2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uTm9ybWFsTWVzc2FnZShcbiAgICBtZXNzYWdlOiBhbnksXG4gICAgc2VuZGVyOiBicm93c2VyLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcixcbiAgICB0b0V4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtZXNzYWdlSUQ6IHN0cmluZyxcbikge1xuICAgIGNvbnN0IGZuczogU2V0PGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2VFdmVudD4gfCB1bmRlZmluZWQgPSBFdmVudFBvb2xzWydicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJ10uZ2V0KFxuICAgICAgICB0b0V4dGVuc2lvbklELFxuICAgIClcbiAgICBpZiAoIWZucykgcmV0dXJuXG4gICAgbGV0IHJlc3BvbnNlU2VuZCA9IGZhbHNlXG4gICAgZm9yIChjb25zdCBmbiBvZiBmbnMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vID8gZGlzcGF0Y2ggbWVzc2FnZVxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZm4oZGVlcENsb25lKG1lc3NhZ2UpLCBkZWVwQ2xvbmUoc2VuZGVyKSwgc2VuZFJlc3BvbnNlRGVwcmVjYXRlZClcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIC8vID8gZG8gbm90aGluZ1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgICAgICAvLyAhIGRlcHJlY2F0ZWQgcGF0aCAhXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdvYmplY3QnICYmIHR5cGVvZiByZXN1bHQudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIC8vID8gcmVzcG9uc2UgdGhlIGFuc3dlclxuICAgICAgICAgICAgICAgIHJlc3VsdC50aGVuKChkYXRhOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhID09PSB1bmRlZmluZWQgfHwgcmVzcG9uc2VTZW5kKSByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBIb3N0LnNlbmRNZXNzYWdlKHRvRXh0ZW5zaW9uSUQsIGV4dGVuc2lvbklELCBzZW5kZXIudGFiIS5pZCEsIG1lc3NhZ2VJRCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ21lc3NhZ2UnLFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCB0eXBlIEludGVybmFsTWVzc2FnZSA9XG4gICAgfCB7XG4gICAgICAgICAgZGF0YTogYW55XG4gICAgICAgICAgZXJyb3I/OiB7IG1lc3NhZ2U6IHN0cmluZzsgc3RhY2s6IHN0cmluZyB9XG4gICAgICAgICAgcmVzcG9uc2U6IGJvb2xlYW5cbiAgICAgICAgICB0eXBlOiAnbWVzc2FnZSdcbiAgICAgIH1cbiAgICB8IHtcbiAgICAgICAgICB0eXBlOiAnZXhlY3V0ZVNjcmlwdCdcbiAgICAgIH0gJiBQYXJhbWV0ZXJzPFRoaXNTaWRlSW1wbGVtZW50YXRpb25bJ2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0J10+WzJdXG5cbmZ1bmN0aW9uIHNlbmRSZXNwb25zZURlcHJlY2F0ZWQoKTogYW55IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdSZXR1cm5pbmcgYSBQcm9taXNlIGlzIHRoZSBwcmVmZXJyZWQgd2F5JyArXG4gICAgICAgICAgICAnIHRvIHNlbmQgYSByZXBseSBmcm9tIGFuIG9uTWVzc2FnZS9vbk1lc3NhZ2VFeHRlcm5hbCBsaXN0ZW5lciwgJyArXG4gICAgICAgICAgICAnYXMgdGhlIHNlbmRSZXNwb25zZSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgc3BlY3MgJyArXG4gICAgICAgICAgICAnKFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL01vemlsbGEvQWRkLW9ucy9XZWJFeHRlbnNpb25zL0FQSS9ydW50aW1lL29uTWVzc2FnZSknLFxuICAgIClcbn1cbiIsImltcG9ydCB7IEVudmlyb25tZW50LCBNYW5pZmVzdCB9IGZyb20gJy4uL0V4dGVuc2lvbnMnXG5cbmV4cG9ydCBjb25zdCBpc0RlYnVnID0gbG9jYXRpb24uaG9zdG5hbWUgPT09ICdsb2NhbGhvc3QnXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEZWJ1Z01vZGVVUkwoXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4pOlxuICAgIHwgeyBlbnY6IEVudmlyb25tZW50LmJhY2tncm91bmRTY3JpcHQ7IHNyYzogJycgfVxuICAgIHwgeyBlbnY6IEVudmlyb25tZW50LmRlYnVnTW9kZU1hbmFnZWRQYWdlIHwgRW52aXJvbm1lbnQucHJvdG9jb2xQYWdlOyBzcmM6IHN0cmluZyB9IHtcbiAgICBjb25zdCBwYXJhbSA9IG5ldyBVUkxTZWFyY2hQYXJhbXMobG9jYXRpb24uc2VhcmNoKVxuICAgIGNvbnN0IHR5cGUgPSBwYXJhbS5nZXQoJ3R5cGUnKVxuICAgIGxldCBzcmMgPSBwYXJhbS5nZXQoJ3VybCcpXG4gICAgY29uc3QgYmFzZSA9ICdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJyArIGV4dGVuc2lvbklEICsgJy8nXG4gICAgaWYgKHNyYyA9PT0gJ19vcHRpb25zXycpIHNyYyA9IG5ldyBVUkwobWFuaWZlc3Qub3B0aW9uc191aSEucGFnZSwgYmFzZSkudG9KU09OKClcbiAgICBpZiAoc3JjID09PSAnX3BvcHVwXycpIHNyYyA9IG5ldyBVUkwobWFuaWZlc3QuYnJvd3Nlcl9hY3Rpb24hLmRlZmF1bHRfcG9wdXAhLCBiYXNlKS50b0pTT04oKVxuICAgIGlmICh0eXBlID09PSAnYicpIHJldHVybiB7IGVudjogRW52aXJvbm1lbnQuYmFja2dyb3VuZFNjcmlwdCwgc3JjOiAnJyB9XG4gICAgaWYgKCFzcmMpIHRocm93IG5ldyBUeXBlRXJyb3IoJ05lZWQgYSB1cmwnKVxuICAgIGlmICh0eXBlID09PSAncCcpIHJldHVybiB7IGVudjogRW52aXJvbm1lbnQucHJvdG9jb2xQYWdlLCBzcmMgfVxuICAgIGVsc2UgaWYgKHR5cGUgPT09ICdtJykgcmV0dXJuIHsgZW52OiBFbnZpcm9ubWVudC5kZWJ1Z01vZGVNYW5hZ2VkUGFnZSwgc3JjIH1cbiAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgICAnVG8gZGVidWcsID90eXBlPSBtdXN0IGJlIG9uZSBvZiAoYilhY2tncm91bmQsIChwKXJvdG9jb2wtcGFnZSwgKG0pYW5hZ2VkLXBhZ2UgKHVzZWQgdG8gZGVidWcgY29udGVudCBzY3JpcHQpLCBmb3VuZCAnICtcbiAgICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICApXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vbm9kZV9tb2R1bGVzL3dlYi1leHQtdHlwZXMvZ2xvYmFsL2luZGV4LmQudHNcIiAvPlxuaW1wb3J0IHsgQXN5bmNDYWxsIH0gZnJvbSAnQGhvbG9mbG93cy9raXQvZXMnXG5pbXBvcnQgeyBkaXNwYXRjaE5vcm1hbEV2ZW50LCBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyIH0gZnJvbSAnLi91dGlscy9Mb2NhbE1lc3NhZ2VzJ1xuaW1wb3J0IHsgSW50ZXJuYWxNZXNzYWdlLCBvbk5vcm1hbE1lc3NhZ2UgfSBmcm9tICcuL3NoaW1zL2Jyb3dzZXIubWVzc2FnZSdcbmltcG9ydCB7IHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24sIGxvYWRDb250ZW50U2NyaXB0IH0gZnJvbSAnLi9FeHRlbnNpb25zJ1xuaW1wb3J0IHsgaXNEZWJ1ZyB9IGZyb20gJy4vZGVidWdnZXIvaXNEZWJ1Z01vZGUnXG5cbi8qKiBEZWZpbmUgQmxvYiB0eXBlIGluIGNvbW11bmljYXRlIHdpdGggcmVtb3RlICovXG5leHBvcnQgdHlwZSBTdHJpbmdPckJsb2IgPVxuICAgIHwge1xuICAgICAgICAgIHR5cGU6ICd0ZXh0J1xuICAgICAgICAgIGNvbnRlbnQ6IHN0cmluZ1xuICAgICAgfVxuICAgIHwge1xuICAgICAgICAgIHR5cGU6ICdhcnJheSBidWZmZXInXG4gICAgICAgICAgY29udGVudDogc3RyaW5nXG4gICAgICB9XG4gICAgfCB7XG4gICAgICAgICAgdHlwZTogJ2Jsb2InXG4gICAgICAgICAgY29udGVudDogc3RyaW5nXG4gICAgICAgICAgbWltZVR5cGU6IHN0cmluZ1xuICAgICAgfVxuLyoqXG4gKiBUaGlzIGRlc2NyaWJlcyB3aGF0IEpTT05SUEMgY2FsbHMgdGhhdCBOYXRpdmUgc2lkZSBzaG91bGQgaW1wbGVtZW50XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSG9zdCB7XG4gICAgLy8jcmVnaW9uIC8vID8gVVJMLipcbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCBzYXZlIHRoZSBiaW5kaW5nIHdpdGggYHV1aWRgIGFuZCB0aGUgYGRhdGFgXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIFVVSUQgLSBVVUlEIGdlbmVyYXRlZCBieSBKUyBzaWRlLlxuICAgICAqIEBwYXJhbSBkYXRhIC0gZGF0YSBvZiB0aGlzIG9iamVjdC4gTXVzdCBiZSB0eXBlIGBibG9iYFxuICAgICAqL1xuICAgICdVUkwuY3JlYXRlT2JqZWN0VVJMJyhleHRlbnNpb25JRDogc3RyaW5nLCBVVUlEOiBzdHJpbmcsIGRhdGE6IFN0cmluZ09yQmxvYik6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCByZWxlYXNlIHRoZSBiaW5kaW5nIHdpdGggYHV1aWRgIGFuZCB0aGUgYGRhdGFgXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIFVVSUQgLSBVVUlEIGdlbmVyYXRlZCBieSBKUyBzaWRlLlxuICAgICAqL1xuICAgICdVUkwucmV2b2tlT2JqZWN0VVJMJyhleHRlbnNpb25JRDogc3RyaW5nLCBVVUlEOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+XG4gICAgLy8jZW5kcmVnaW9uXG4gICAgLy8jcmVnaW9uIC8vID8gYnJvd3Nlci5kb3dubG9hZHNcbiAgICAvKipcbiAgICAgKiBPcGVuIGEgZGlhbG9nLCBzaGFyZSB0aGUgZmlsZSB0byBzb21ld2hlcmUgZWxzZS5cbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFNlZSBodHRwczovL21kbi5pby9icm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZFxuICAgICAqL1xuICAgICdicm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZCcoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGZpbGVuYW1lOiBzdHJpbmdcbiAgICAgICAgICAgIC8qKiBDb3VsZCBiZSBhIHN0cmluZyByZXR1cm4gYnkgVVJMLmNyZWF0ZU9iamVjdFVSTCgpICovXG4gICAgICAgICAgICB1cmw6IHN0cmluZ1xuICAgICAgICB9LFxuICAgICk6IFByb21pc2U8dm9pZD5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0XG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBpbnRlcm5hbCBzdG9yYWdlIGZvciBgZXh0ZW5zaW9uSURgXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIGtleVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiA+IFN0b3JhZ2U6IHsgYTogeyB2YWx1ZTogMiB9LCBiOiB7IG5hbWU6IFwieFwiIH0sIGM6IDEgfVxuICAgICAqXG4gICAgICogZ2V0KGlkLCAnYicpXG4gICAgICogPiBSZXR1cm4ge25hbWU6IFwieFwifVxuICAgICAqXG4gICAgICogZ2V0KGlkLCBudWxsKVxuICAgICAqID4gUmV0dXJuOiB7IGE6IHsgdmFsdWU6IDIgfSwgYjogeyBuYW1lOiBcInhcIiB9LCBjOiAxIH1cbiAgICAgKlxuICAgICAqIGdldChpZCwgW1wiYVwiLCBcImJcIl0pXG4gICAgICogPiBSZXR1cm46IHsgYTogeyB2YWx1ZTogMiB9LCBiOiB7IG5hbWU6IFwieFwiIH0gfVxuICAgICAqL1xuICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0JyhleHRlbnNpb25JRDogc3RyaW5nLCBrZXk6IHN0cmluZyB8IHN0cmluZ1tdIHwgbnVsbCk6IFByb21pc2U8b2JqZWN0PlxuICAgIC8qKlxuICAgICAqIEhvc3Qgc2hvdWxkIHNldCB0aGUgb2JqZWN0IHdpdGggMSBsYXllciBtZXJnaW5nLlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBvYmplY3RcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogPiBTdG9yYWdlOiBge31gXG4gICAgICogc2V0KGlkLCB7IGE6IHsgdmFsdWU6IDEgfSwgYjogeyBuYW1lOiBcInhcIiB9IH0pXG4gICAgICogPiBTdG9yYWdlOiBgeyBhOiB7IHZhbHVlOiAxIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSB9YFxuICAgICAqIHNldChpZCwgeyBhOiB7IHZhbHVlOiAyIH0gfSlcbiAgICAgKiA+IFN0b3JhZ2U6IGB7IGE6IHsgdmFsdWU6IDIgfSwgYjogeyBuYW1lOiBcInhcIiB9IH1gXG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQnKGV4dGVuc2lvbklEOiBzdHJpbmcsIG9iamVjdDogb2JqZWN0KTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBrZXlzIGluIHRoZSBvYmplY3RcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5yZW1vdmUnKGV4dGVuc2lvbklEOiBzdHJpbmcsIGtleTogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogRGVsZXRlIHRoZSBpbnRlcm5hbCBzdG9yYWdlXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5jbGVhcicoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBicm93c2VyLnRhYnNcbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCBjcmVhdGUgYSBuZXcgdGFiXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBTZWUgaHR0cHM6Ly9tZG4uaW8vYnJvd3Nlci50YWJzLmNyZWF0ZVxuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMuY3JlYXRlJyhleHRlbnNpb25JRDogc3RyaW5nLCBvcHRpb25zOiB7IGFjdGl2ZT86IGJvb2xlYW47IHVybD86IHN0cmluZyB9KTogUHJvbWlzZTxicm93c2VyLnRhYnMuVGFiPlxuICAgIC8qKlxuICAgICAqIEhvc3Qgc2hvdWxkIHJlbW92ZSB0aGUgdGFiXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIHRhYklkIC0gU2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIudGFicy5yZW1vdmVcbiAgICAgKi9cbiAgICAnYnJvd3Nlci50YWJzLnJlbW92ZScoZXh0ZW5zaW9uSUQ6IHN0cmluZywgdGFiSWQ6IG51bWJlcik6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBRdWVyeSBvcGVuZWQgdGFic1xuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gU2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIudGFicy5xdWVyeVxuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMucXVlcnknKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICBxdWVyeUluZm86IFBhcmFtZXRlcnM8dHlwZW9mIGJyb3dzZXIudGFicy5xdWVyeT5bMF0sXG4gICAgKTogUHJvbWlzZTxicm93c2VyLnRhYnMuVGFiW10+XG4gICAgLyoqXG4gICAgICogVXBkYXRlIGEgdGFiJ3MgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gdGFiSWQgSWYgaXQgaXMgdW5kZWZpbmVkLCBpZ25vcmUgdGhpcyByZXF1ZXN0XG4gICAgICogQHBhcmFtIHVwZGF0ZVByb3BlcnRpZXNcbiAgICAgKi9cbiAgICAnYnJvd3Nlci50YWJzLnVwZGF0ZScoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRhYklkPzogbnVtYmVyLFxuICAgICAgICB1cGRhdGVQcm9wZXJ0aWVzPzoge1xuICAgICAgICAgICAgdXJsPzogc3RyaW5nXG4gICAgICAgIH0sXG4gICAgKTogUHJvbWlzZTxicm93c2VyLnRhYnMuVGFiPlxuICAgIC8vI2VuZHJlZ2lvblxuICAgIC8vI3JlZ2lvbiAvLyA/IE1lc3NhZ2VcbiAgICAvKipcbiAgICAgKiBVc2VkIHRvIGltcGxlbWVudCBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlIGFuZCBicm93c2VyLnRhYnMub25NZXNzYWdlXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEIC0gV2hvIHNlbmQgdGhpcyBtZXNzYWdlXG4gICAgICogQHBhcmFtIHRvRXh0ZW5zaW9uSUQgLSBXaG8gd2lsbCByZWNlaXZlIHRoaXMgbWVzc2FnZVxuICAgICAqIEBwYXJhbSB0YWJJZCAtIFNlbmQgdGhpcyBtZXNzYWdlIHRvIHRhYiBpZFxuICAgICAqIEBwYXJhbSBtZXNzYWdlSUQgLSBBIHJhbmRvbSBpZCBnZW5lcmF0ZWQgYnkgY2xpZW50XG4gICAgICogQHBhcmFtIG1lc3NhZ2UgLSBtZXNzYWdlIG9iamVjdFxuICAgICAqL1xuICAgIHNlbmRNZXNzYWdlKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICB0b0V4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRhYklkOiBudW1iZXIgfCBudWxsLFxuICAgICAgICBtZXNzYWdlSUQ6IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZTogSW50ZXJuYWxNZXNzYWdlLFxuICAgICk6IFByb21pc2U8dm9pZD5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBmZXRjaCAvLyA/ICh0byBieXBhc3MgY3Jvc3Mgb3JpZ2luIHJlc3RyaWN0aW9uKVxuICAgIC8qKlxuICAgICAqIFNlZTogaHR0cHM6Ly9tZG4uaW8vZmV0Y2hcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gcmVxdWVzdCAtIFRoZSByZXF1ZXN0IG9iamVjdFxuICAgICAqL1xuICAgIGZldGNoKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICByZXF1ZXN0OiB7XG4gICAgICAgICAgICAvKiogR0VULCBQT1NULCAuLi4uICovXG4gICAgICAgICAgICBtZXRob2Q6IHN0cmluZ1xuICAgICAgICAgICAgdXJsOiBzdHJpbmdcbiAgICAgICAgfSxcbiAgICApOiBQcm9taXNlPHtcbiAgICAgICAgLyoqIHJlc3BvbnNlIGNvZGUgKi9cbiAgICAgICAgc3RhdHVzOiBudW1iZXJcbiAgICAgICAgLyoqIHJlc3BvbnNlIHRleHQgKi9cbiAgICAgICAgc3RhdHVzVGV4dDogc3RyaW5nXG4gICAgICAgIGRhdGE6IFN0cmluZ09yQmxvYlxuICAgIH0+XG4gICAgLy8jZW5kcmVnaW9uXG59XG4vKipcbiAqIFRoaXMgZGVzY3JpYmVzIHdoYXQgSlNPTlJQQyBjYWxscyB0aGF0IEpTIHNpZGUgc2hvdWxkIGltcGxlbWVudFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRoaXNTaWRlSW1wbGVtZW50YXRpb24ge1xuICAgIC8qKlxuICAgICAqIEhvc3QgY2FsbCB0aGlzIHRvIG5vdGlmeSBgYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkYCBoYXBwZW5lZC5cbiAgICAgKlxuICAgICAqIEBzZWUgaHR0cHM6Ly9tZG4uaW8vYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkXG4gICAgICogQHBhcmFtIHRhYiAtIFRoZSBjb21taXR0ZWQgdGFiIGluZm9cbiAgICAgKi9cbiAgICAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJyh0YWI6IHsgdGFiSWQ6IG51bWJlcjsgdXJsOiBzdHJpbmcgfSk6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBVc2VkIHRvIGltcGxlbWVudCBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlIGFuZCBicm93c2VyLnRhYnMub25NZXNzYWdlXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEIC0gV2hvIHNlbmQgdGhpcyBtZXNzYWdlXG4gICAgICogQHBhcmFtIHRvRXh0ZW5zaW9uSUQgLSBXaG8gd2lsbCByZWNlaXZlIHRoaXMgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBtZXNzYWdlSUQgLSBBIHJhbmRvbSBpZCBjcmVhdGVkIGJ5IHRoZSBzZW5kZXIuIFVzZWQgdG8gaWRlbnRpZnkgaWYgdGhlIG1lc3NhZ2UgaXMgYSByZXNwb25zZS5cbiAgICAgKiBAcGFyYW0gbWVzc2FnZSAtIFNlbmQgYnkgYW5vdGhlciBjbGllbnRcbiAgICAgKiBAcGFyYW0gc2VuZGVyIC0gSW5mbyBvZiB0aGUgc2VuZGVyXG4gICAgICovXG4gICAgb25NZXNzYWdlKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICB0b0V4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VJRDogc3RyaW5nLFxuICAgICAgICBtZXNzYWdlOiBJbnRlcm5hbE1lc3NhZ2UsXG4gICAgICAgIHNlbmRlcjogYnJvd3Nlci5ydW50aW1lLk1lc3NhZ2VTZW5kZXIsXG4gICAgKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFNob3VsZCBpbmplY3QgdGhlIGdpdmVuIHNjcmlwdCBpbnRvIHRoZSBnaXZlbiB0YWJJRFxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSB0YWJJRCAtIFRhYiBpZCB0aGF0IG5lZWQgaW5qZWN0IHNjcmlwdCB0b1xuICAgICAqIEBwYXJhbSBkZXRhaWxzIC0gU2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0XG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0JyhcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdGFiSUQ6IG51bWJlcixcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgICAgY29kZT86IHN0cmluZ1xuICAgICAgICAgICAgZmlsZT86IHN0cmluZ1xuICAgICAgICAgICAgcnVuQXQ/OiAnZG9jdW1lbnRfc3RhcnQnIHwgJ2RvY3VtZW50X2VuZCcgfCAnZG9jdW1lbnRfaWRsZSdcbiAgICAgICAgfSxcbiAgICApOiBQcm9taXNlPHZvaWQ+XG59XG5cbmNvbnN0IGtleSA9ICdob2xvZmxvd3Nqc29ucnBjJ1xuY2xhc3MgaU9TV2Via2l0Q2hhbm5lbCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoa2V5LCBlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9IChlIGFzIEN1c3RvbUV2ZW50PGFueT4pLmRldGFpbFxuICAgICAgICAgICAgZm9yIChjb25zdCBmIG9mIHRoaXMubGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBmKGRldGFpbClcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgIHByaXZhdGUgbGlzdGVuZXI6IEFycmF5PChkYXRhOiB1bmtub3duKSA9PiB2b2lkPiA9IFtdXG4gICAgb24oXzogc3RyaW5nLCBjYjogKGRhdGE6IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnB1c2goY2IpXG4gICAgfVxuICAgIGVtaXQoXzogc3RyaW5nLCBkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgaWYgKGlzRGVidWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZW5kJywgZGF0YSlcbiAgICAgICAgfVxuICAgICAgICBpZiAod2luZG93LndlYmtpdCAmJiB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVycyAmJiB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1trZXldKVxuICAgICAgICAgICAgd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnNba2V5XS5wb3N0TWVzc2FnZShkYXRhKVxuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNhbWVQYWdlRGVidWdDaGFubmVsIHtcbiAgICBzdGF0aWMgc2VydmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpXG4gICAgc3RhdGljIGNsaWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYWN0b3I6ICdzZXJ2ZXInIHwgJ2NsaWVudCcpIHtcbiAgICAgICAgU2FtZVBhZ2VEZWJ1Z0NoYW5uZWxbYWN0b3JdLmFkZEV2ZW50TGlzdGVuZXIoJ3RhcmdldEV2ZW50Q2hhbm5lbCcsIGUgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gKGUgYXMgQ3VzdG9tRXZlbnQpLmRldGFpbFxuICAgICAgICAgICAgZm9yIChjb25zdCBmIG9mIHRoaXMubGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBmKGRldGFpbClcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgIHByaXZhdGUgbGlzdGVuZXI6IEFycmF5PChkYXRhOiB1bmtub3duKSA9PiB2b2lkPiA9IFtdXG4gICAgb24oXzogc3RyaW5nLCBjYjogKGRhdGE6IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnB1c2goY2IpXG4gICAgfVxuICAgIGVtaXQoXzogc3RyaW5nLCBkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgU2FtZVBhZ2VEZWJ1Z0NoYW5uZWxbdGhpcy5hY3RvciA9PT0gJ2NsaWVudCcgPyAnc2VydmVyJyA6ICdjbGllbnQnXS5kaXNwYXRjaEV2ZW50KFxuICAgICAgICAgICAgbmV3IEN1c3RvbUV2ZW50KCd0YXJnZXRFdmVudENoYW5uZWwnLCB7IGRldGFpbDogZGF0YSB9KSxcbiAgICAgICAgKVxuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBUaGlzU2lkZUltcGxlbWVudGF0aW9uOiBUaGlzU2lkZUltcGxlbWVudGF0aW9uID0ge1xuICAgIC8vIHRvZG86IGNoZWNrIGRpc3BhdGNoIHRhcmdldCdzIG1hbmlmZXN0XG4gICAgJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCc6IGRpc3BhdGNoTm9ybWFsRXZlbnQuYmluZChudWxsLCAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJywgJyonKSxcbiAgICBhc3luYyBvbk1lc3NhZ2UoZXh0ZW5zaW9uSUQsIHRvRXh0ZW5zaW9uSUQsIG1lc3NhZ2VJRCwgbWVzc2FnZSwgc2VuZGVyKSB7XG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdtZXNzYWdlJzpcbiAgICAgICAgICAgICAgICAvLyA/IHRoaXMgaXMgYSByZXNwb25zZSB0byB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgICAgIGlmIChUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmhhcyhtZXNzYWdlSUQpICYmIG1lc3NhZ2UucmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgW3Jlc29sdmUsIHJlamVjdF0gPSBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmdldChtZXNzYWdlSUQpIVxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG1lc3NhZ2UuZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5kZWxldGUobWVzc2FnZUlEKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5yZXNwb25zZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgb25Ob3JtYWxNZXNzYWdlKG1lc3NhZ2UuZGF0YSwgc2VuZGVyLCB0b0V4dGVuc2lvbklELCBleHRlbnNpb25JRCwgbWVzc2FnZUlEKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vID8gZHJvcCB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAnZXhlY3V0ZVNjcmlwdCc6XG4gICAgICAgICAgICAgICAgY29uc3QgZXh0ID0gcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5nZXQoZXh0ZW5zaW9uSUQpIVxuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlLmNvZGUpIGV4dC5lbnZpcm9ubWVudC5ldmFsdWF0ZShtZXNzYWdlLmNvZGUpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWVzc2FnZS5maWxlKVxuICAgICAgICAgICAgICAgICAgICBsb2FkQ29udGVudFNjcmlwdChcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbklELFxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0Lm1hbmlmZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzOiBbbWVzc2FnZS5maWxlXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBjaGVjayB0aGUgcGVybWlzc2lvbiB0byBpbmplY3QgdGhlIHNjcmlwdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZXM6IFsnPGFsbF91cmxzPiddLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dC5wcmVsb2FkZWRSZXNvdXJjZXMsXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyAnYnJvd3Nlci50YWJzLmV4ZWN1dGVTY3JpcHQnKGV4dGVuc2lvbklELCB0YWJJRCwgZGV0YWlscykge1xuICAgICAgICByZXR1cm4gSG9zdC5zZW5kTWVzc2FnZShleHRlbnNpb25JRCwgZXh0ZW5zaW9uSUQsIHRhYklELCBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCksIHtcbiAgICAgICAgICAgIC4uLmRldGFpbHMsXG4gICAgICAgICAgICB0eXBlOiAnZXhlY3V0ZVNjcmlwdCcsXG4gICAgICAgIH0pXG4gICAgfSxcbn1cbmV4cG9ydCBjb25zdCBIb3N0ID0gQXN5bmNDYWxsPEhvc3Q+KFRoaXNTaWRlSW1wbGVtZW50YXRpb24gYXMgYW55LCB7XG4gICAga2V5OiAnJyxcbiAgICBsb2c6IGZhbHNlLFxuICAgIG1lc3NhZ2VDaGFubmVsOiBpc0RlYnVnID8gbmV3IFNhbWVQYWdlRGVidWdDaGFubmVsKCdjbGllbnQnKSA6IG5ldyBpT1NXZWJraXRDaGFubmVsKCksXG59KVxuIiwiaW1wb3J0IHsgU3RyaW5nT3JCbG9iIH0gZnJvbSAnLi4vUlBDJ1xuXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlU3RyaW5nT3JCbG9iKHZhbDogU3RyaW5nT3JCbG9iKTogQmxvYiB8IHN0cmluZyB8IEFycmF5QnVmZmVyIHwgbnVsbCB7XG4gICAgaWYgKHZhbC50eXBlID09PSAndGV4dCcpIHJldHVybiB2YWwuY29udGVudFxuICAgIGlmICh2YWwudHlwZSA9PT0gJ2Jsb2InKSByZXR1cm4gbmV3IEJsb2IoW3ZhbC5jb250ZW50XSwgeyB0eXBlOiB2YWwubWltZVR5cGUgfSlcbiAgICBpZiAodmFsLnR5cGUgPT09ICdhcnJheSBidWZmZXInKSB7XG4gICAgICAgIHJldHVybiBiYXNlNjREZWNUb0Fycih2YWwuY29udGVudCkuYnVmZmVyXG4gICAgfVxuICAgIHJldHVybiBudWxsXG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5jb2RlU3RyaW5nT3JCbG9iKHZhbDogQmxvYiB8IHN0cmluZyB8IEFycmF5QnVmZmVyKTogUHJvbWlzZTxTdHJpbmdPckJsb2I+IHtcbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHJldHVybiB7IHR5cGU6ICd0ZXh0JywgY29udGVudDogdmFsIH1cbiAgICBpZiAodmFsIGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgICBjb25zdCBidWZmZXIgPSBuZXcgVWludDhBcnJheShhd2FpdCBuZXcgUmVzcG9uc2UodmFsKS5hcnJheUJ1ZmZlcigpKVxuICAgICAgICByZXR1cm4geyB0eXBlOiAnYmxvYicsIG1pbWVUeXBlOiB2YWwudHlwZSwgY29udGVudDogYmFzZTY0RW5jQXJyKGJ1ZmZlcikgfVxuICAgIH1cbiAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ2FycmF5IGJ1ZmZlcicsIGNvbnRlbnQ6IGJhc2U2NEVuY0FycihuZXcgVWludDhBcnJheSh2YWwpKSB9XG4gICAgfVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgZGF0YScpXG59XG5cbi8vI3JlZ2lvbiAvLyA/IENvZGUgZnJvbSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93QmFzZTY0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmcjQXBwZW5kaXguM0FfRGVjb2RlX2FfQmFzZTY0X3N0cmluZ190b19VaW50OEFycmF5X29yX0FycmF5QnVmZmVyXG5mdW5jdGlvbiBiNjRUb1VpbnQ2KG5DaHI6IG51bWJlcikge1xuICAgIHJldHVybiBuQ2hyID4gNjQgJiYgbkNociA8IDkxXG4gICAgICAgID8gbkNociAtIDY1XG4gICAgICAgIDogbkNociA+IDk2ICYmIG5DaHIgPCAxMjNcbiAgICAgICAgPyBuQ2hyIC0gNzFcbiAgICAgICAgOiBuQ2hyID4gNDcgJiYgbkNociA8IDU4XG4gICAgICAgID8gbkNociArIDRcbiAgICAgICAgOiBuQ2hyID09PSA0M1xuICAgICAgICA/IDYyXG4gICAgICAgIDogbkNociA9PT0gNDdcbiAgICAgICAgPyA2M1xuICAgICAgICA6IDBcbn1cblxuZnVuY3Rpb24gYmFzZTY0RGVjVG9BcnIoc0Jhc2U2NDogc3RyaW5nLCBuQmxvY2tTaXplPzogbnVtYmVyKSB7XG4gICAgdmFyIHNCNjRFbmMgPSBzQmFzZTY0LnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXS9nLCAnJyksXG4gICAgICAgIG5JbkxlbiA9IHNCNjRFbmMubGVuZ3RoLFxuICAgICAgICBuT3V0TGVuID0gbkJsb2NrU2l6ZSA/IE1hdGguY2VpbCgoKG5JbkxlbiAqIDMgKyAxKSA+Pj4gMikgLyBuQmxvY2tTaXplKSAqIG5CbG9ja1NpemUgOiAobkluTGVuICogMyArIDEpID4+PiAyLFxuICAgICAgICBhQnl0ZXMgPSBuZXcgVWludDhBcnJheShuT3V0TGVuKVxuXG4gICAgZm9yICh2YXIgbk1vZDMsIG5Nb2Q0LCBuVWludDI0ID0gMCwgbk91dElkeCA9IDAsIG5JbklkeCA9IDA7IG5JbklkeCA8IG5JbkxlbjsgbkluSWR4KyspIHtcbiAgICAgICAgbk1vZDQgPSBuSW5JZHggJiAzXG4gICAgICAgIG5VaW50MjQgfD0gYjY0VG9VaW50NihzQjY0RW5jLmNoYXJDb2RlQXQobkluSWR4KSkgPDwgKDE4IC0gNiAqIG5Nb2Q0KVxuICAgICAgICBpZiAobk1vZDQgPT09IDMgfHwgbkluTGVuIC0gbkluSWR4ID09PSAxKSB7XG4gICAgICAgICAgICBmb3IgKG5Nb2QzID0gMDsgbk1vZDMgPCAzICYmIG5PdXRJZHggPCBuT3V0TGVuOyBuTW9kMysrLCBuT3V0SWR4KyspIHtcbiAgICAgICAgICAgICAgICBhQnl0ZXNbbk91dElkeF0gPSAoblVpbnQyNCA+Pj4gKCgxNiA+Pj4gbk1vZDMpICYgMjQpKSAmIDI1NVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgblVpbnQyNCA9IDBcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhQnl0ZXNcbn1cbmZ1bmN0aW9uIHVpbnQ2VG9CNjQoblVpbnQ2OiBudW1iZXIpIHtcbiAgICByZXR1cm4gblVpbnQ2IDwgMjZcbiAgICAgICAgPyBuVWludDYgKyA2NVxuICAgICAgICA6IG5VaW50NiA8IDUyXG4gICAgICAgID8gblVpbnQ2ICsgNzFcbiAgICAgICAgOiBuVWludDYgPCA2MlxuICAgICAgICA/IG5VaW50NiAtIDRcbiAgICAgICAgOiBuVWludDYgPT09IDYyXG4gICAgICAgID8gNDNcbiAgICAgICAgOiBuVWludDYgPT09IDYzXG4gICAgICAgID8gNDdcbiAgICAgICAgOiA2NVxufVxuXG5mdW5jdGlvbiBiYXNlNjRFbmNBcnIoYUJ5dGVzOiBVaW50OEFycmF5KSB7XG4gICAgdmFyIGVxTGVuID0gKDMgLSAoYUJ5dGVzLmxlbmd0aCAlIDMpKSAlIDMsXG4gICAgICAgIHNCNjRFbmMgPSAnJ1xuXG4gICAgZm9yICh2YXIgbk1vZDMsIG5MZW4gPSBhQnl0ZXMubGVuZ3RoLCBuVWludDI0ID0gMCwgbklkeCA9IDA7IG5JZHggPCBuTGVuOyBuSWR4KyspIHtcbiAgICAgICAgbk1vZDMgPSBuSWR4ICUgM1xuICAgICAgICAvKiBVbmNvbW1lbnQgdGhlIGZvbGxvd2luZyBsaW5lIGluIG9yZGVyIHRvIHNwbGl0IHRoZSBvdXRwdXQgaW4gbGluZXMgNzYtY2hhcmFjdGVyIGxvbmc6ICovXG4gICAgICAgIC8qXG4gICAgICBpZiAobklkeCA+IDAgJiYgKG5JZHggKiA0IC8gMykgJSA3NiA9PT0gMCkgeyBzQjY0RW5jICs9IFwiXFxyXFxuXCI7IH1cbiAgICAgICovXG4gICAgICAgIG5VaW50MjQgfD0gYUJ5dGVzW25JZHhdIDw8ICgoMTYgPj4+IG5Nb2QzKSAmIDI0KVxuICAgICAgICBpZiAobk1vZDMgPT09IDIgfHwgYUJ5dGVzLmxlbmd0aCAtIG5JZHggPT09IDEpIHtcbiAgICAgICAgICAgIHNCNjRFbmMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShcbiAgICAgICAgICAgICAgICB1aW50NlRvQjY0KChuVWludDI0ID4+PiAxOCkgJiA2MyksXG4gICAgICAgICAgICAgICAgdWludDZUb0I2NCgoblVpbnQyNCA+Pj4gMTIpICYgNjMpLFxuICAgICAgICAgICAgICAgIHVpbnQ2VG9CNjQoKG5VaW50MjQgPj4+IDYpICYgNjMpLFxuICAgICAgICAgICAgICAgIHVpbnQ2VG9CNjQoblVpbnQyNCAmIDYzKSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIG5VaW50MjQgPSAwXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZXFMZW4gPT09IDAgPyBzQjY0RW5jIDogc0I2NEVuYy5zdWJzdHJpbmcoMCwgc0I2NEVuYy5sZW5ndGggLSBlcUxlbikgKyAoZXFMZW4gPT09IDEgPyAnPScgOiAnPT0nKVxufVxuIiwiaW1wb3J0IHsgSG9zdCB9IGZyb20gJy4uL1JQQydcbmltcG9ydCB7IGVuY29kZVN0cmluZ09yQmxvYiB9IGZyb20gJy4uL3V0aWxzL1N0cmluZ09yQmxvYidcblxuY29uc3QgeyBjcmVhdGVPYmplY3RVUkwsIHJldm9rZU9iamVjdFVSTCB9ID0gVVJMXG5leHBvcnQgZnVuY3Rpb24gZ2V0SURGcm9tQmxvYlVSTCh4OiBzdHJpbmcpIHtcbiAgICBpZiAoeC5zdGFydHNXaXRoKCdibG9iOicpKSByZXR1cm4gbmV3IFVSTChuZXcgVVJMKHgpLnBhdGhuYW1lKS5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxufVxuLyoqXG4gKiBNb2RpZnkgdGhlIGJlaGF2aW9yIG9mIFVSTC4qXG4gKiBMZXQgdGhlIGJsb2I6Ly8gdXJsIGNhbiBiZSByZWNvZ25pemVkIGJ5IEhvc3QuXG4gKlxuICogQHBhcmFtIHVybCBUaGUgb3JpZ2luYWwgVVJMIG9iamVjdFxuICogQHBhcmFtIGV4dGVuc2lvbklEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmhhbmNlVVJMKHVybDogdHlwZW9mIFVSTCwgZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIHVybC5jcmVhdGVPYmplY3RVUkwgPSBjcmVhdGVPYmplY3RVUkxFbmhhbmNlZChleHRlbnNpb25JRClcbiAgICB1cmwucmV2b2tlT2JqZWN0VVJMID0gcmV2b2tlT2JqZWN0VVJMRW5oYW5jZWQoZXh0ZW5zaW9uSUQpXG4gICAgcmV0dXJuIHVybFxufVxuXG5mdW5jdGlvbiByZXZva2VPYmplY3RVUkxFbmhhbmNlZChleHRlbnNpb25JRDogc3RyaW5nKTogKHVybDogc3RyaW5nKSA9PiB2b2lkIHtcbiAgICByZXR1cm4gKHVybDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldm9rZU9iamVjdFVSTCh1cmwpXG4gICAgICAgIGNvbnN0IGlkID0gZ2V0SURGcm9tQmxvYlVSTCh1cmwpIVxuICAgICAgICBIb3N0WydVUkwucmV2b2tlT2JqZWN0VVJMJ10oZXh0ZW5zaW9uSUQsIGlkKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlT2JqZWN0VVJMRW5oYW5jZWQoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6IChvYmplY3Q6IGFueSkgPT4gc3RyaW5nIHtcbiAgICByZXR1cm4gKG9iajogRmlsZSB8IEJsb2IgfCBNZWRpYVNvdXJjZSkgPT4ge1xuICAgICAgICBjb25zdCB1cmwgPSBjcmVhdGVPYmplY3RVUkwob2JqKVxuICAgICAgICBjb25zdCByZXNvdXJjZUlEID0gZ2V0SURGcm9tQmxvYlVSTCh1cmwpIVxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgICAgICAgZW5jb2RlU3RyaW5nT3JCbG9iKG9iaikudGhlbihibG9iID0+IEhvc3RbJ1VSTC5jcmVhdGVPYmplY3RVUkwnXShleHRlbnNpb25JRCwgcmVzb3VyY2VJRCwgYmxvYikpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybFxuICAgIH1cbn1cblxuZnVuY3Rpb24gYmxvYlRvQmFzZTY0KGJsb2I6IEJsb2IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWRlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBbaGVhZGVyLCBiYXNlNjRdID0gKHJlYWRlci5yZXN1bHQgYXMgc3RyaW5nKS5zcGxpdCgnLCcpXG4gICAgICAgICAgICByZXNvbHZlKGJhc2U2NClcbiAgICAgICAgfSlcbiAgICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZSA9PiByZWplY3QoZSkpXG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGJsb2IpXG4gICAgfSlcbn1cbiIsImltcG9ydCB7IEhvc3QgfSBmcm9tICcuL1JQQydcbmltcG9ydCB7IGlzRGVidWcgfSBmcm9tICcuL2RlYnVnZ2VyL2lzRGVidWdNb2RlJ1xuLyoqXG4gKiBUaGlzIElEIGlzIHVzZWQgYnkgdGhpcyBwb2x5ZmlsbCBpdHNlbGYuXG4gKi9cbmV4cG9ydCBjb25zdCByZXNlcnZlZElEID0gJzE1MGVhNmVlLTJiMGEtNDU4Ny05ODc5LTBjYTVkZmMxZDA0NidcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1c2VJbnRlcm5hbFN0b3JhZ2UoXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtb2RpZnk/OiAob2JqOiBJbnRlcm5hbFN0b3JhZ2UpID0+IHZvaWQsXG4pOiBQcm9taXNlPEludGVybmFsU3RvcmFnZT4ge1xuICAgIGlmIChpc0RlYnVnKSB7XG4gICAgICAgIGNvbnN0IG9iaiA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0ocmVzZXJ2ZWRJRCArICc6JyArIGV4dGVuc2lvbklEKSB8fCAne30nKVxuICAgICAgICBpZiAoIW1vZGlmeSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZShvYmopXG4gICAgICAgIG1vZGlmeShvYmopXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKHJlc2VydmVkSUQgKyAnOicgKyBleHRlbnNpb25JRCwgSlNPTi5zdHJpbmdpZnkob2JqKSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShvYmopXG4gICAgfVxuICAgIGNvbnN0IG9iaiA9ICgoYXdhaXQgSG9zdFsnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldCddKHJlc2VydmVkSUQsIGV4dGVuc2lvbklEKSkgYXMgYW55KVtleHRlbnNpb25JRF0gfHwge31cbiAgICBpZiAoIW1vZGlmeSkgcmV0dXJuIG9ialxuICAgIG1vZGlmeShvYmopXG4gICAgSG9zdFsnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnNldCddKHJlc2VydmVkSUQsIHsgW2V4dGVuc2lvbklEXTogb2JqIH0pXG4gICAgcmV0dXJuIG9ialxufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVzZUdsb2JhbEludGVybmFsU3RvcmFnZShleHRlbnNpb25JRDogc3RyaW5nLCBtb2RpZnk6IChvYmo6IEdsb2JhbFN0b3JhZ2UpID0+IHZvaWQpIHtcbiAgICBpZiAoaXNEZWJ1Zykge1xuICAgICAgICBjb25zdCBvYmogPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKHJlc2VydmVkSUQgKyAnOicgKyByZXNlcnZlZElEKSB8fCAne30nKVxuICAgICAgICBtb2RpZnkob2JqKVxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShyZXNlcnZlZElEICsgJzonICsgcmVzZXJ2ZWRJRCwgSlNPTi5zdHJpbmdpZnkob2JqKSlcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgfVxuICAgIHJldHVybiBIb3N0Wydicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0J10ocmVzZXJ2ZWRJRCwgcmVzZXJ2ZWRJRClcbiAgICAgICAgLnRoZW4oKHg6IFJlY29yZDxzdHJpbmcsIGFueT4pID0+IHhbcmVzZXJ2ZWRJRF0gfHwge30pXG4gICAgICAgIC50aGVuKChvYmo6IFJlY29yZDxzdHJpbmcsIGFueT4pID0+IHtcbiAgICAgICAgICAgIG1vZGlmeShvYmopXG4gICAgICAgICAgICByZXR1cm4gb2JqXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKG8gPT4gSG9zdFsnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnNldCddKHJlc2VydmVkSUQsIHsgW3Jlc2VydmVkSURdOiBvIH0pKVxufVxuXG5pbnRlcmZhY2UgSW50ZXJuYWxTdG9yYWdlIHtcbiAgICBwcmV2aW91c1ZlcnNpb24/OiBzdHJpbmdcbiAgICBkeW5hbWljUmVxdWVzdGVkUGVybWlzc2lvbnM/OiB7XG4gICAgICAgIG9yaWdpbnM6IHN0cmluZ1tdXG4gICAgICAgIHBlcm1pc3Npb25zOiBzdHJpbmdbXVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBUaGlzIHN0b3JhZ2UgaXMgdXNlZCB0byBlbXVsYXRlIGBicm93c2VyLnN0b3JhZ2UubG9jYWwuKmBcbiAgICAgKiBpbiBsb2NhbGhvc3QgZGVidWdnaW5nXG4gICAgICovXG4gICAgZGVidWdNb2RlU3RvcmFnZT86IGFueVxufVxuaW50ZXJmYWNlIEdsb2JhbFN0b3JhZ2Uge31cbiIsImltcG9ydCB7IEhvc3QsIFRoaXNTaWRlSW1wbGVtZW50YXRpb24gfSBmcm9tICcuLi9SUEMnXG5pbXBvcnQgeyBjcmVhdGVFdmVudExpc3RlbmVyIH0gZnJvbSAnLi4vdXRpbHMvTG9jYWxNZXNzYWdlcydcbmltcG9ydCB7IGNyZWF0ZVJ1bnRpbWVTZW5kTWVzc2FnZSwgc2VuZE1lc3NhZ2VXaXRoUmVzcG9uc2UgfSBmcm9tICcuL2Jyb3dzZXIubWVzc2FnZSdcbmltcG9ydCB7IE1hbmlmZXN0IH0gZnJvbSAnLi4vRXh0ZW5zaW9ucydcbmltcG9ydCB7IGdldElERnJvbUJsb2JVUkwgfSBmcm9tICcuL1VSTC5jcmVhdGUrcmV2b2tlT2JqZWN0VVJMJ1xuaW1wb3J0IHsgdXNlSW50ZXJuYWxTdG9yYWdlIH0gZnJvbSAnLi4vaW50ZXJuYWwnXG5cbmNvbnN0IG9yaWdpbmFsQ29uZmlybSA9IHdpbmRvdy5jb25maXJtXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBgYnJvd3NlcmAgb2JqZWN0LlxuICogQHBhcmFtIGV4dGVuc2lvbklEIC0gRXh0ZW5zaW9uIElEXG4gKiBAcGFyYW0gbWFuaWZlc3QgLSBNYW5pZmVzdCBvZiB0aGUgZXh0ZW5zaW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBCcm93c2VyRmFjdG9yeShleHRlbnNpb25JRDogc3RyaW5nLCBtYW5pZmVzdDogTWFuaWZlc3QpOiBicm93c2VyIHtcbiAgICBjb25zdCBpbXBsZW1lbnRhdGlvbjogUGFydGlhbDxicm93c2VyPiA9IHtcbiAgICAgICAgZG93bmxvYWRzOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLmRvd25sb2Fkcz4oe1xuICAgICAgICAgICAgZG93bmxvYWQ6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZCcpKHtcbiAgICAgICAgICAgICAgICBwYXJhbShvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB7IHVybCwgZmlsZW5hbWUgfSA9IG9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdldElERnJvbUJsb2JVUkwodXJsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsID0gYGhvbG9mbG93cy1ibG9iOi8vJHtleHRlbnNpb25JRH0vJHtnZXRJREZyb21CbG9iVVJMKHVybCkhfWBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBQYXJ0aWFsSW1wbGVtZW50ZWQob3B0aW9ucywgJ2ZpbGVuYW1lJywgJ3VybCcpXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZzEgPSB7IHVybCwgZmlsZW5hbWU6IGZpbGVuYW1lIHx8ICcnIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFthcmcxXVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmV0dXJucygpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSksXG4gICAgICAgIH0pLFxuICAgICAgICBydW50aW1lOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLnJ1bnRpbWU+KHtcbiAgICAgICAgICAgIGdldFVSTChwYXRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJHtleHRlbnNpb25JRH0vJHtwYXRofWBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRNYW5pZmVzdCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShtYW5pZmVzdCkpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25NZXNzYWdlOiBjcmVhdGVFdmVudExpc3RlbmVyKGV4dGVuc2lvbklELCAnYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZScpLFxuICAgICAgICAgICAgc2VuZE1lc3NhZ2U6IGNyZWF0ZVJ1bnRpbWVTZW5kTWVzc2FnZShleHRlbnNpb25JRCksXG4gICAgICAgICAgICBvbkluc3RhbGxlZDogY3JlYXRlRXZlbnRMaXN0ZW5lcihleHRlbnNpb25JRCwgJ2Jyb3dzZXIucnVudGltZS5vbkluc3RhbGwnKSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhYnM6IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIudGFicz4oe1xuICAgICAgICAgICAgYXN5bmMgZXhlY3V0ZVNjcmlwdCh0YWJJRCwgZGV0YWlscykge1xuICAgICAgICAgICAgICAgIFBhcnRpYWxJbXBsZW1lbnRlZChkZXRhaWxzLCAnY29kZScsICdmaWxlJywgJ3J1bkF0JylcbiAgICAgICAgICAgICAgICBhd2FpdCBUaGlzU2lkZUltcGxlbWVudGF0aW9uWydicm93c2VyLnRhYnMuZXhlY3V0ZVNjcmlwdCddKFxuICAgICAgICAgICAgICAgICAgICBleHRlbnNpb25JRCxcbiAgICAgICAgICAgICAgICAgICAgdGFiSUQgPT09IHVuZGVmaW5lZCA/IC0xIDogdGFiSUQsXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbHMsXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZTogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIudGFicy5jcmVhdGUnKSgpLFxuICAgICAgICAgICAgYXN5bmMgcmVtb3ZlKHRhYklEKSB7XG4gICAgICAgICAgICAgICAgbGV0IHQ6IG51bWJlcltdXG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRhYklEKSkgdCA9IFt0YWJJRF1cbiAgICAgICAgICAgICAgICBlbHNlIHQgPSB0YWJJRFxuICAgICAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHQubWFwKHggPT4gSG9zdFsnYnJvd3Nlci50YWJzLnJlbW92ZSddKGV4dGVuc2lvbklELCB4KSkpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcXVlcnk6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnRhYnMucXVlcnknKSgpLFxuICAgICAgICAgICAgdXBkYXRlOiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci50YWJzLnVwZGF0ZScpKCksXG4gICAgICAgICAgICBhc3luYyBzZW5kTWVzc2FnZTxUID0gYW55LCBVID0gb2JqZWN0PihcbiAgICAgICAgICAgICAgICB0YWJJZDogbnVtYmVyLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IFQsXG4gICAgICAgICAgICAgICAgb3B0aW9ucz86IHsgZnJhbWVJZD86IG51bWJlciB8IHVuZGVmaW5lZCB9IHwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgKTogUHJvbWlzZTx2b2lkIHwgVT4ge1xuICAgICAgICAgICAgICAgIFBhcnRpYWxJbXBsZW1lbnRlZChvcHRpb25zKVxuICAgICAgICAgICAgICAgIHJldHVybiBzZW5kTWVzc2FnZVdpdGhSZXNwb25zZShleHRlbnNpb25JRCwgZXh0ZW5zaW9uSUQsIHRhYklkLCBtZXNzYWdlKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgICAgIGxvY2FsOiBJbXBsZW1lbnRzPHR5cGVvZiBicm93c2VyLnN0b3JhZ2UubG9jYWw+KHtcbiAgICAgICAgICAgICAgICBjbGVhcjogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5jbGVhcicpKCksXG4gICAgICAgICAgICAgICAgcmVtb3ZlOiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnJlbW92ZScpKCksXG4gICAgICAgICAgICAgICAgc2V0OiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnNldCcpKCksXG4gICAgICAgICAgICAgICAgZ2V0OiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldCcpKHtcbiAgICAgICAgICAgICAgICAgICAgLyoqIEhvc3Qgbm90IGFjY2VwdGluZyB7IGE6IDEgfSBhcyBrZXlzICovXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtKGtleXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleXMpKSByZXR1cm4gW2tleXMgYXMgc3RyaW5nW11dXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGtleXMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleXMgPT09IG51bGwpIHJldHVybiBbbnVsbF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW09iamVjdC5rZXlzKGtleXMpXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtudWxsXVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXR1cm5zKHJ0biwgW2tleV0pOiBvYmplY3Qge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5KSkgcmV0dXJuIHJ0blxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcgJiYga2V5ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgLi4ua2V5LCAuLi5ydG4gfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ0blxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBzeW5jOiBOb3RJbXBsZW1lbnRlZFByb3h5KCksXG4gICAgICAgICAgICBvbkNoYW5nZWQ6IE5vdEltcGxlbWVudGVkUHJveHkoKSxcbiAgICAgICAgfSxcbiAgICAgICAgd2ViTmF2aWdhdGlvbjogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci53ZWJOYXZpZ2F0aW9uPih7XG4gICAgICAgICAgICBvbkNvbW1pdHRlZDogY3JlYXRlRXZlbnRMaXN0ZW5lcihleHRlbnNpb25JRCwgJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCcpLFxuICAgICAgICB9KSxcbiAgICAgICAgZXh0ZW5zaW9uOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLmV4dGVuc2lvbj4oe1xuICAgICAgICAgICAgZ2V0QmFja2dyb3VuZFBhZ2UoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVmYXVsdE5hbWUgPSAnX2dlbmVyYXRlZF9iYWNrZ3JvdW5kX3BhZ2UuaHRtbCdcbiAgICAgICAgICAgICAgICBjb25zdCBtYW5pZmVzdE5hbWUgPSBtYW5pZmVzdC5iYWNrZ3JvdW5kIS5wYWdlXG4gICAgICAgICAgICAgICAgaWYgKGxvY2F0aW9uLnBhdGhuYW1lID09PSAnLycgKyBkZWZhdWx0TmFtZSB8fCBsb2NhdGlvbi5wYXRobmFtZSA9PT0gJy8nICsgbWFuaWZlc3ROYW1lKSByZXR1cm4gd2luZG93XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm94eShcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IG5ldyBVUkwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYGhvbG9mbG93cy1leHRlbnNpb246Ly8ke2V4dGVuc2lvbklEfS8ke21hbmlmZXN0TmFtZSB8fCBkZWZhdWx0TmFtZX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgKSBhcyBQYXJ0aWFsPExvY2F0aW9uPixcbiAgICAgICAgICAgICAgICAgICAgfSBhcyBQYXJ0aWFsPFdpbmRvdz4sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldChfOiBhbnksIGtleTogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9ba2V5XSkgcmV0dXJuIF9ba2V5XVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ05vdCBzdXBwb3J0ZWQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICApIGFzIFdpbmRvd1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAgIHBlcm1pc3Npb25zOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLnBlcm1pc3Npb25zPih7XG4gICAgICAgICAgICByZXF1ZXN0OiBhc3luYyByZXEgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJBY3Rpb24gPSBvcmlnaW5hbENvbmZpcm0oYCR7bWFuaWZlc3QubmFtZX0gaXMgZ29pbmcgdG8gcmVxdWVzdCB0aGUgZm9sbG93aW5nIHBlcm1pc3Npb25zOlxuJHsocmVxLnBlcm1pc3Npb25zIHx8IFtdKS5qb2luKCdcXG4nKX1cbiR7KHJlcS5vcmlnaW5zIHx8IFtdKS5qb2luKCdcXG4nKX1gKVxuICAgICAgICAgICAgICAgIGlmICh1c2VyQWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHVzZUludGVybmFsU3RvcmFnZShleHRlbnNpb25JRCwgb2JqID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9yaWcgPSBvYmouZHluYW1pY1JlcXVlc3RlZFBlcm1pc3Npb25zIHx8IHsgb3JpZ2luczogW10sIHBlcm1pc3Npb25zOiBbXSB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvID0gbmV3IFNldChvcmlnLm9yaWdpbnMpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwID0gbmV3IFNldChvcmlnLnBlcm1pc3Npb25zKVxuICAgICAgICAgICAgICAgICAgICAgICAgOyhyZXEub3JpZ2lucyB8fCBbXSkuZm9yRWFjaCh4ID0+IG8uYWRkKHgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgOyhyZXEucGVybWlzc2lvbnMgfHwgW10pLmZvckVhY2goeCA9PiBwLmFkZCh4KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWcub3JpZ2lucyA9IEFycmF5LmZyb20obylcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWcucGVybWlzc2lvbnMgPSBBcnJheS5mcm9tKHApXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmouZHluYW1pY1JlcXVlc3RlZFBlcm1pc3Npb25zID0gb3JpZ1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlckFjdGlvblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnRhaW5zOiBhc3luYyBxdWVyeSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3JpZ2luc1F1ZXJ5ID0gcXVlcnkub3JpZ2lucyB8fCBbXVxuICAgICAgICAgICAgICAgIGNvbnN0IHBlcm1pc3Npb25zUXVlcnkgPSBxdWVyeS5wZXJtaXNzaW9ucyB8fCBbXVxuICAgICAgICAgICAgICAgIGNvbnN0IHJlcXVlc3RlZCA9IGF3YWl0IHVzZUludGVybmFsU3RvcmFnZShleHRlbnNpb25JRClcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNPcmlnaW5zID0gbmV3IFNldDxzdHJpbmc+KClcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNQZXJtaXNzaW9ucyA9IG5ldyBTZXQ8c3RyaW5nPigpXG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3RlZC5keW5hbWljUmVxdWVzdGVkUGVybWlzc2lvbnMgJiYgcmVxdWVzdGVkLmR5bmFtaWNSZXF1ZXN0ZWRQZXJtaXNzaW9ucy5vcmlnaW5zKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RlZC5keW5hbWljUmVxdWVzdGVkUGVybWlzc2lvbnMub3JpZ2lucy5mb3JFYWNoKHggPT4gaGFzT3JpZ2lucy5hZGQoeCkpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0ZWQuZHluYW1pY1JlcXVlc3RlZFBlcm1pc3Npb25zICYmIHJlcXVlc3RlZC5keW5hbWljUmVxdWVzdGVkUGVybWlzc2lvbnMucGVybWlzc2lvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdGVkLmR5bmFtaWNSZXF1ZXN0ZWRQZXJtaXNzaW9ucy5wZXJtaXNzaW9ucy5mb3JFYWNoKHggPT4gaGFzUGVybWlzc2lvbnMuYWRkKHgpKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBwZXJtaXNzaW9ucyBkb2VzIG5vdCBkaXN0aW5ndWlzaCBwZXJtaXNzaW9uIG9yIHVybFxuICAgICAgICAgICAgICAgIDsobWFuaWZlc3QucGVybWlzc2lvbnMgfHwgW10pLmZvckVhY2goeCA9PiBoYXNQZXJtaXNzaW9ucy5hZGQoeCkpXG4gICAgICAgICAgICAgICAgOyhtYW5pZmVzdC5wZXJtaXNzaW9ucyB8fCBbXSkuZm9yRWFjaCh4ID0+IGhhc09yaWdpbnMuYWRkKHgpKVxuICAgICAgICAgICAgICAgIGlmIChvcmlnaW5zUXVlcnkuc29tZSh4ID0+ICFoYXNPcmlnaW5zLmhhcyh4KSkpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgICAgIGlmIChwZXJtaXNzaW9uc1F1ZXJ5LnNvbWUoeCA9PiAhaGFzUGVybWlzc2lvbnMuaGFzKHgpKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZW1vdmU6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ/CfpKMgd2h5IHlvdSB3YW50IHRvIHJldm9rZSB5b3VyIHBlcm1pc3Npb25zPyBOb3QgaW1wbGVtZW50ZWQgeWV0LicpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0QWxsOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsID0gYXdhaXQgdXNlSW50ZXJuYWxTdG9yYWdlKGV4dGVuc2lvbklEKVxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGFsbC5keW5hbWljUmVxdWVzdGVkUGVybWlzc2lvbnMgfHwge30pKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgfVxuICAgIHJldHVybiBOb3RJbXBsZW1lbnRlZFByb3h5PGJyb3dzZXI+KGltcGxlbWVudGF0aW9uLCBmYWxzZSlcbn1cbnR5cGUgYnJvd3NlciA9IHR5cGVvZiBicm93c2VyXG5cbmZ1bmN0aW9uIEltcGxlbWVudHM8VD4oaW1wbGVtZW50YXRpb246IFQpIHtcbiAgICByZXR1cm4gaW1wbGVtZW50YXRpb25cbn1cbmZ1bmN0aW9uIE5vdEltcGxlbWVudGVkUHJveHk8VCA9IGFueT4oaW1wbGVtZW50ZWQ6IFBhcnRpYWw8VD4gPSB7fSwgZmluYWwgPSB0cnVlKTogVCB7XG4gICAgcmV0dXJuIG5ldyBQcm94eShpbXBsZW1lbnRlZCwge1xuICAgICAgICBnZXQodGFyZ2V0OiBhbnksIGtleSkge1xuICAgICAgICAgICAgaWYgKCF0YXJnZXRba2V5XSkgcmV0dXJuIGZpbmFsID8gTm90SW1wbGVtZW50ZWQgOiBOb3RJbXBsZW1lbnRlZFByb3h5KClcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXRba2V5XVxuICAgICAgICB9LFxuICAgICAgICBhcHBseSgpIHtcbiAgICAgICAgICAgIHJldHVybiBOb3RJbXBsZW1lbnRlZCgpXG4gICAgICAgIH0sXG4gICAgfSlcbn1cbmZ1bmN0aW9uIE5vdEltcGxlbWVudGVkKCk6IGFueSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCEnKVxuICAgIH1cbn1cbmZ1bmN0aW9uIFBhcnRpYWxJbXBsZW1lbnRlZDxUPihvYmo6IFQgPSB7fSBhcyBhbnksIC4uLmtleXM6IChrZXlvZiBUKVtdKSB7XG4gICAgY29uc3Qgb2JqMiA9IHsgLi4ub2JqIH1cbiAgICBrZXlzLmZvckVhY2goeCA9PiBkZWxldGUgb2JqMlt4XSlcbiAgICBpZiAoT2JqZWN0LmtleXMob2JqMikubGVuZ3RoKSBjb25zb2xlLndhcm4oYE5vdCBpbXBsZW1lbnRlZCBvcHRpb25zYCwgb2JqMiwgYGF0YCwgbmV3IEVycm9yKCkuc3RhY2spXG59XG5cbnR5cGUgSGVhZGxlc3NQYXJhbWV0ZXJzPFQgZXh0ZW5kcyAoLi4uYXJnczogYW55KSA9PiBhbnk+ID0gVCBleHRlbmRzIChleHRlbnNpb25JRDogc3RyaW5nLCAuLi5hcmdzOiBpbmZlciBQKSA9PiBhbnlcbiAgICA/IFBcbiAgICA6IG5ldmVyXG4vKipcbiAqIEdlbmVyYXRlIGJpbmRpbmcgYmV0d2VlbiBIb3N0IGFuZCBXZWJFeHRlbnNpb25BUElcbiAqXG4gKiBBTEwgZ2VuZXJpY3Mgc2hvdWxkIGJlIGluZmVycmVkLiBETyBOT1Qgd3JpdGUgaXQgbWFudWFsbHkuXG4gKlxuICogSWYgeW91IGFyZSB3cml0aW5nIG9wdGlvbnMsIG1ha2Ugc3VyZSB5b3UgYWRkIHlvdXIgZnVuY3Rpb24gdG8gYEJyb3dzZXJSZWZlcmVuY2VgIHRvIGdldCB0eXBlIHRpcHMuXG4gKlxuICogQHBhcmFtIGV4dGVuc2lvbklEIC0gVGhlIGV4dGVuc2lvbiBJRFxuICogQHBhcmFtIGtleSAtIFRoZSBBUEkgbmFtZSBpbiB0aGUgdHlwZSBvZiBgSG9zdGAgQU5EIGBCcm93c2VyUmVmZXJlbmNlYFxuICovXG5mdW5jdGlvbiBiaW5kaW5nPFxuICAgIC8qKiBOYW1lIG9mIHRoZSBBUEkgaW4gdGhlIFJQQyBiaW5kaW5nICovXG4gICAgS2V5IGV4dGVuZHMga2V5b2YgQnJvd3NlclJlZmVyZW5jZSxcbiAgICAvKiogVGhlIGRlZmluaXRpb24gb2YgdGhlIFdlYkV4dGVuc2lvbkFQSSBzaWRlICovXG4gICAgQnJvd3NlckRlZiBleHRlbmRzIEJyb3dzZXJSZWZlcmVuY2VbS2V5XSxcbiAgICAvKiogVGhlIGRlZmluaXRpb24gb2YgdGhlIEhvc3Qgc2lkZSAqL1xuICAgIEhvc3REZWYgZXh0ZW5kcyBIb3N0W0tleV0sXG4gICAgLyoqIEFyZ3VtZW50cyBvZiB0aGUgYnJvd3NlciBzaWRlICovXG4gICAgQnJvd3NlckFyZ3MgZXh0ZW5kcyBQYXJhbWV0ZXJzPEJyb3dzZXJEZWY+LFxuICAgIC8qKiBSZXR1cm4gdHlwZSBvZiB0aGUgYnJvd3NlciBzaWRlICovXG4gICAgQnJvd3NlclJldHVybiBleHRlbmRzIFByb21pc2VPZjxSZXR1cm5UeXBlPEJyb3dzZXJEZWY+PixcbiAgICAvKiogQXJndW1lbnRzIHR5cGUgb2YgdGhlIEhvc3Qgc2lkZSAqL1xuICAgIEhvc3RBcmdzIGV4dGVuZHMgSGVhZGxlc3NQYXJhbWV0ZXJzPEhvc3REZWY+LFxuICAgIC8qKiBSZXR1cm4gdHlwZSBvZiB0aGUgSG9zdCBzaWRlICovXG4gICAgSG9zdFJldHVybiBleHRlbmRzIFByb21pc2VPZjxSZXR1cm5UeXBlPEhvc3REZWY+PlxuPihleHRlbnNpb25JRDogc3RyaW5nLCBrZXk6IEtleSkge1xuICAgIC8qKlxuICAgICAqIEFuZCBoZXJlIHdlIHNwbGl0IGl0IGludG8gMiBmdW5jdGlvbiwgaWYgd2Ugam9pbiB0aGVtIHRvZ2V0aGVyIGl0IHdpbGwgYnJlYWsgdGhlIGluZmVyIChidXQgaWRrIHdoeSlcbiAgICAgKi9cbiAgICByZXR1cm4gPFxuICAgICAgICAvKiogSGVyZSB3ZSBoYXZlIHRvIHVzZSBnZW5lcmljcyB3aXRoIGd1YXJkIHRvIGVuc3VyZSBUeXBlU2NyaXB0IHdpbGwgaW5mZXIgdHlwZSBvbiBydW50aW1lICovXG4gICAgICAgIE9wdGlvbnMgZXh0ZW5kcyB7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICogSGVyZSB3ZSB3cml0ZSB0aGUgdHlwZSBndWFyZCBpbiB0aGUgZ2VuZXJpYyxcbiAgICAgICAgICAgICAqIGRvbid0IHVzZSB0d28gbW9yZSBnZW5lcmljcyB0byBpbmZlciB0aGUgcmV0dXJuIHR5cGUgb2YgYHBhcmFtYCBhbmQgYHJldHVybnNgLFxuICAgICAgICAgICAgICogdGhhdCB3aWxsIGJyZWFrIHRoZSBpbmZlciByZXN1bHQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHBhcmFtPzogKC4uLmFyZ3M6IEJyb3dzZXJBcmdzKSA9PiBIb3N0QXJnc1xuICAgICAgICAgICAgcmV0dXJucz86IChyZXR1cm5zOiBIb3N0UmV0dXJuLCBicm93c2VyOiBCcm93c2VyQXJncywgaG9zdDogSG9zdEFyZ3MpID0+IEJyb3dzZXJSZXR1cm5cbiAgICAgICAgfVxuICAgID4oXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zLiBZb3UgY2FuIHdyaXRlIHRoZSBicmlkZ2UgYmV0d2VlbiBIb3N0IHNpZGUgYW5kIFdlYkV4dGVuc2lvbiBzaWRlLlxuICAgICAgICAgKi9cbiAgICAgICAgb3B0aW9uczogT3B0aW9ucyA9IHt9IGFzIGFueSxcbiAgICApID0+IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERvbid0IHdyaXRlIHRoZXNlIHR5cGUgYWxpYXMgaW4gZ2VuZXJpY3MuIHdpbGwgYnJlYWsuIGlkayB3aHkgYWdhaW4uXG4gICAgICAgICAqL1xuICAgICAgICB0eXBlIEhhc1BhcmFtRm4gPSB1bmRlZmluZWQgZXh0ZW5kcyBPcHRpb25zWydwYXJhbSddID8gZmFsc2UgOiB0cnVlXG4gICAgICAgIHR5cGUgSGFzUmV0dXJuRm4gPSB1bmRlZmluZWQgZXh0ZW5kcyBPcHRpb25zWydyZXR1cm5zJ10gPyBmYWxzZSA6IHRydWVcbiAgICAgICAgdHlwZSBfX19BcmdzX19fID0gUmV0dXJuVHlwZTxOb25OdWxsYWJsZTxPcHRpb25zWydwYXJhbSddPj5cbiAgICAgICAgdHlwZSBfX19SZXR1cm5fX18gPSBSZXR1cm5UeXBlPE5vbk51bGxhYmxlPE9wdGlvbnNbJ3JldHVybnMnXT4+XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiB0aGVyZSBpcyBhIGJyaWRnZSBmdW5jdGlvblxuICAgICAgICAgKiAtIGlmIGl0cyByZXR1cm4gdHlwZSBzYXRpc2ZpZWQgdGhlIHJlcXVpcmVtZW50LCByZXR1cm4gdGhlIGBCcm93c2VyQXJnc2AgZWxzZSByZXR1cm4gYG5ldmVyYFxuICAgICAgICAgKlxuICAgICAgICAgKiByZXR1cm4gdGhlIGBIb3N0QXJnc2AgYW5kIGxldCBUeXBlU2NyaXB0IGNoZWNrIGlmIGl0IGlzIHNhdGlzZmllZC5cbiAgICAgICAgICovXG4gICAgICAgIHR5cGUgSW5mZXJBcmdzUmVzdWx0ID0gSGFzUGFyYW1GbiBleHRlbmRzIHRydWVcbiAgICAgICAgICAgID8gX19fQXJnc19fXyBleHRlbmRzIEJyb3dzZXJBcmdzXG4gICAgICAgICAgICAgICAgPyBCcm93c2VyQXJnc1xuICAgICAgICAgICAgICAgIDogbmV2ZXJcbiAgICAgICAgICAgIDogSG9zdEFyZ3NcbiAgICAgICAgLyoqIEp1c3QgbGlrZSBgSW5mZXJBcmdzUmVzdWx0YCAqL1xuICAgICAgICB0eXBlIEluZmVyUmV0dXJuUmVzdWx0ID0gSGFzUmV0dXJuRm4gZXh0ZW5kcyB0cnVlXG4gICAgICAgICAgICA/IF9fX1JldHVybl9fXyBleHRlbmRzIEJyb3dzZXJSZXR1cm5cbiAgICAgICAgICAgICAgICA/IF9fX1JldHVybl9fX1xuICAgICAgICAgICAgICAgIDogJ25ldmVyIHJ0bidcbiAgICAgICAgICAgIDogSG9zdFJldHVyblxuICAgICAgICBjb25zdCBub29wID0gPFQ+KHg/OiBUKSA9PiB4IGFzIFRcbiAgICAgICAgY29uc3Qgbm9vcEFyZ3MgPSAoLi4uYXJnczogYW55W10pID0+IGFyZ3NcbiAgICAgICAgY29uc3QgaG9zdERlZmluaXRpb246IChleHRlbnNpb25JRDogc3RyaW5nLCAuLi5hcmdzOiBIb3N0QXJncykgPT4gUHJvbWlzZTxIb3N0UmV0dXJuPiA9IEhvc3Rba2V5XSBhcyBhbnlcbiAgICAgICAgcmV0dXJuICgoYXN5bmMgKC4uLmFyZ3M6IEJyb3dzZXJBcmdzKTogUHJvbWlzZTxCcm93c2VyUmV0dXJuPiA9PiB7XG4gICAgICAgICAgICAvLyA/IFRyYW5zZm9ybSBXZWJFeHRlbnNpb24gQVBJIGFyZ3VtZW50cyB0byBob3N0IGFyZ3VtZW50c1xuICAgICAgICAgICAgY29uc3QgaG9zdEFyZ3MgPSAob3B0aW9ucy5wYXJhbSB8fCBub29wQXJncykoLi4uYXJncykgYXMgSG9zdEFyZ3NcbiAgICAgICAgICAgIC8vID8gZXhlY3V0ZVxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaG9zdERlZmluaXRpb24oZXh0ZW5zaW9uSUQsIC4uLmhvc3RBcmdzKVxuICAgICAgICAgICAgY29uc3QgZiA9IG9wdGlvbnMucmV0dXJucyB8fCAobm9vcCBhcyBOb25OdWxsYWJsZTx0eXBlb2Ygb3B0aW9ucy5yZXR1cm5zPilcbiAgICAgICAgICAgIC8vID8gVHJhbnNmb3JtIGhvc3QgcmVzdWx0IHRvIFdlYkV4dGVuc2lvbiBBUEkgcmVzdWx0XG4gICAgICAgICAgICBjb25zdCBicm93c2VyUmVzdWx0ID0gZihyZXN1bHQsIGFyZ3MsIGhvc3RBcmdzKSBhcyBCcm93c2VyUmV0dXJuXG4gICAgICAgICAgICByZXR1cm4gYnJvd3NlclJlc3VsdFxuICAgICAgICB9KSBhcyB1bmtub3duKSBhcyAoLi4uYXJnczogSW5mZXJBcmdzUmVzdWx0KSA9PiBQcm9taXNlPEluZmVyUmV0dXJuUmVzdWx0PlxuICAgIH1cbn1cbi8qKlxuICogQSByZWZlcmVuY2UgdGFibGUgYmV0d2VlbiBIb3N0IGFuZCBXZWJFeHRlbnNpb25BUElcbiAqXG4gKiBrZXkgaXMgaW4gdGhlIGhvc3QsIHJlc3VsdCB0eXBlIGlzIGluIHRoZSBXZWJFeHRlbnNpb24uXG4gKi9cbnR5cGUgQnJvd3NlclJlZmVyZW5jZSA9IHsgW2tleSBpbiBrZXlvZiB0eXBlb2YgSG9zdF06ICguLi5hcmdzOiB1bmtub3duW10pID0+IFByb21pc2U8dW5rbm93bj4gfSAmIHtcbiAgICAnYnJvd3Nlci5kb3dubG9hZHMuZG93bmxvYWQnOiB0eXBlb2YgYnJvd3Nlci5kb3dubG9hZHMuZG93bmxvYWRcbiAgICAnYnJvd3Nlci50YWJzLmNyZWF0ZSc6IHR5cGVvZiBicm93c2VyLnRhYnMuY3JlYXRlXG59XG50eXBlIFByb21pc2VPZjxUPiA9IFQgZXh0ZW5kcyBQcm9taXNlPGluZmVyIFU+ID8gVSA6IG5ldmVyXG4iLCJpbXBvcnQgeyBpc0RlYnVnIH0gZnJvbSAnLi9pc0RlYnVnTW9kZSdcblxuZXhwb3J0IGZ1bmN0aW9uIGRlYnVnTW9kZVVSTFJld3JpdGUoZXh0ZW5zaW9uSUQ6IHN0cmluZywgdXJsOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmICghaXNEZWJ1ZykgcmV0dXJuIHVybFxuICAgIGNvbnN0IHUgPSBuZXcgVVJMKHVybCwgJ2hvbG9mbG93cy1leHRlbnNpb246Ly8nICsgZXh0ZW5zaW9uSUQgKyAnLycpXG4gICAgaWYgKHUucHJvdG9jb2wgPT09ICdob2xvZmxvd3MtZXh0ZW5zaW9uOicpIHtcbiAgICAgICAgdS5wcm90b2NvbCA9IGxvY2F0aW9uLnByb3RvY29sXG4gICAgICAgIHUuaG9zdCA9IGxvY2F0aW9uLmhvc3RcbiAgICAgICAgdS5wYXRobmFtZSA9ICcvZXh0ZW5zaW9uLycgKyBleHRlbnNpb25JRCArICcvJyArIHUucGF0aG5hbWVcbiAgICAgICAgY29uc29sZS5kZWJ1ZygnUmV3cml0ZWQgdXJsJywgdXJsLCAndG8nLCB1LnRvSlNPTigpKVxuICAgICAgICByZXR1cm4gdS50b0pTT04oKVxuICAgIH0gZWxzZSBpZiAodS5vcmlnaW4gPT09IGxvY2F0aW9uLm9yaWdpbikge1xuICAgICAgICBpZiAodS5wYXRobmFtZS5zdGFydHNXaXRoKCcvZXh0ZW5zaW9uLycpKSByZXR1cm4gdXJsXG4gICAgICAgIHUucGF0aG5hbWUgPSAnL2V4dGVuc2lvbi8nICsgZXh0ZW5zaW9uSUQgKyB1LnBhdGhuYW1lXG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ1Jld3JpdGVkIHVybCcsIHVybCwgJ3RvJywgdS50b0pTT04oKSlcbiAgICAgICAgcmV0dXJuIHUudG9KU09OKClcbiAgICB9XG4gICAgcmV0dXJuIHVybFxufVxuIiwiaW1wb3J0IHsgSG9zdCB9IGZyb20gJy4uL1JQQydcbmltcG9ydCB7IGRlY29kZVN0cmluZ09yQmxvYiB9IGZyb20gJy4uL3V0aWxzL1N0cmluZ09yQmxvYidcbmltcG9ydCB7IGRlYnVnTW9kZVVSTFJld3JpdGUgfSBmcm9tICcuLi9kZWJ1Z2dlci91cmwtcmV3cml0ZSdcbmltcG9ydCB7IGlzRGVidWcgfSBmcm9tICcuLi9kZWJ1Z2dlci9pc0RlYnVnTW9kZSdcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZldGNoKGV4dGVuc2lvbklEOiBzdHJpbmcsIG9yaWdGZXRjaDogdHlwZW9mIGZldGNoKTogdHlwZW9mIGZldGNoIHtcbiAgICByZXR1cm4gbmV3IFByb3h5KG9yaWdGZXRjaCwge1xuICAgICAgICBhc3luYyBhcHBseShvcmlnRmV0Y2gsIHRoaXNBcmcsIFtyZXF1ZXN0SW5mbywgcmVxdWVzdEluaXRdOiBQYXJhbWV0ZXJzPHR5cGVvZiBmZXRjaD4pIHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3QgPSBuZXcgUmVxdWVzdChyZXF1ZXN0SW5mbywgcmVxdWVzdEluaXQpXG4gICAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcXVlc3QudXJsKVxuICAgICAgICAgICAgLy8gRGVidWcgbW9kZVxuICAgICAgICAgICAgaWYgKGlzRGVidWcgJiYgKHVybC5vcmlnaW4gPT09IGxvY2F0aW9uLm9yaWdpbiB8fCB1cmwucHJvdG9jb2wgPT09ICdob2xvZmxvd3MtZXh0ZW5zaW9uOicpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9yaWdGZXRjaChkZWJ1Z01vZGVVUkxSZXdyaXRlKGV4dGVuc2lvbklELCByZXF1ZXN0LnVybCksIHJlcXVlc3RJbml0KVxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXF1ZXN0LnVybC5zdGFydHNXaXRoKCdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJyArIGV4dGVuc2lvbklEICsgJy8nKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnRmV0Y2gocmVxdWVzdEluZm8sIHJlcXVlc3RJbml0KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNEZWJ1ZykgcmV0dXJuIG9yaWdGZXRjaChyZXF1ZXN0SW5mbywgcmVxdWVzdEluaXQpXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgSG9zdC5mZXRjaChleHRlbnNpb25JRCwgeyBtZXRob2Q6IHJlcXVlc3QubWV0aG9kLCB1cmw6IHVybC50b0pTT04oKSB9KVxuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBkZWNvZGVTdHJpbmdPckJsb2IocmVzdWx0LmRhdGEpXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgPT09IG51bGwpIHRocm93IG5ldyBFcnJvcignJylcbiAgICAgICAgICAgICAgICBjb25zdCByZXR1cm5WYWx1ZSA9IG5ldyBSZXNwb25zZShkYXRhLCByZXN1bHQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfSlcbn1cbiIsImxldCBsYXN0VXNlckFjdGl2ZSA9IDBcbmxldCBub3cgPSBEYXRlLm5vdy5iaW5kKERhdGUpXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFxuICAgICdjbGljaycsXG4gICAgKCkgPT4ge1xuICAgICAgICBsYXN0VXNlckFjdGl2ZSA9IG5vdygpXG4gICAgfSxcbiAgICB7IGNhcHR1cmU6IHRydWUsIHBhc3NpdmU6IHRydWUgfSxcbilcbmV4cG9ydCBmdW5jdGlvbiBoYXNWYWxpZFVzZXJJbnRlcmFjdGl2ZSgpIHtcbiAgICByZXR1cm4gbm93KCkgLSBsYXN0VXNlckFjdGl2ZSA8IDMwMDBcbn1cbiIsImltcG9ydCB7IEhvc3QgfSBmcm9tICcuLi9SUEMnXG5pbXBvcnQgeyBoYXNWYWxpZFVzZXJJbnRlcmFjdGl2ZSB9IGZyb20gJy4uL3V0aWxzL1VzZXJJbnRlcmFjdGl2ZSdcblxuZXhwb3J0IGZ1bmN0aW9uIG9wZW5FbmhhbmNlZChleHRlbnNpb25JRDogc3RyaW5nKTogdHlwZW9mIG9wZW4ge1xuICAgIHJldHVybiAodXJsID0gJ2Fib3V0OmJsYW5rJywgdGFyZ2V0Pzogc3RyaW5nLCBmZWF0dXJlcz86IHN0cmluZywgcmVwbGFjZT86IGJvb2xlYW4pID0+IHtcbiAgICAgICAgaWYgKCFoYXNWYWxpZFVzZXJJbnRlcmFjdGl2ZSgpKSByZXR1cm4gbnVsbFxuICAgICAgICBpZiAoKHRhcmdldCAmJiB0YXJnZXQgIT09ICdfYmxhbmsnKSB8fCBmZWF0dXJlcyB8fCByZXBsYWNlKVxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdVbnN1cHBvcnRlZCBvcGVuJywgdXJsLCB0YXJnZXQsIGZlYXR1cmVzLCByZXBsYWNlKVxuICAgICAgICBIb3N0Wydicm93c2VyLnRhYnMuY3JlYXRlJ10oZXh0ZW5zaW9uSUQsIHtcbiAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIHVybCxcbiAgICAgICAgfSlcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9zZUVuaGFuY2VkKGV4dGVuc2lvbklEOiBzdHJpbmcpOiB0eXBlb2YgY2xvc2Uge1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGlmICghaGFzVmFsaWRVc2VySW50ZXJhY3RpdmUoKSkgcmV0dXJuXG4gICAgICAgIEhvc3RbJ2Jyb3dzZXIudGFicy5xdWVyeSddKGV4dGVuc2lvbklELCB7IGFjdGl2ZTogdHJ1ZSB9KS50aGVuKGkgPT5cbiAgICAgICAgICAgIEhvc3RbJ2Jyb3dzZXIudGFicy5yZW1vdmUnXShleHRlbnNpb25JRCwgaVswXS5pZCEpLFxuICAgICAgICApXG4gICAgfVxufVxuIiwiaW1wb3J0IHRzIGZyb20gJ3R5cGVzY3JpcHQnXG4vKipcbiAqIFRyYW5zZm9ybSBhbnkgYHRoaXNgIHRvIGAodHlwZW9mIHRoaXMgPT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWxUaGlzIDogdGhpcylgXG4gKiBAcGFyYW0gY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gdGhpc1RyYW5zZm9ybWF0aW9uKGNvbnRleHQ6IHRzLlRyYW5zZm9ybWF0aW9uQ29udGV4dCkge1xuICAgIGZ1bmN0aW9uIHZpc2l0PFQgZXh0ZW5kcyB0cy5Ob2RlPihub2RlOiBUKTogVCB7XG4gICAgICAgIGlmICh0cy5pc1NvdXJjZUZpbGUobm9kZSkpIHtcbiAgICAgICAgICAgIGlmIChpc0luU3RyaWN0TW9kZShub2RlLmdldENoaWxkQXQoMCkgYXMgdHMuU3ludGF4TGlzdCkpIHJldHVybiBub2RlXG4gICAgICAgIH0gZWxzZSBpZiAodHMuaXNGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpIHx8IHRzLmlzRnVuY3Rpb25FeHByZXNzaW9uKG5vZGUpKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5ib2R5KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3ludGF4TGlzdCA9IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgLmdldENoaWxkcmVuKClcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IHgua2luZCA9PT0gdHMuU3ludGF4S2luZC5TeW50YXhMaXN0KVswXSBhcyB0cy5TeW50YXhMaXN0XG4gICAgICAgICAgICAgICAgaWYgKGlzSW5TdHJpY3RNb2RlKHN5bnRheExpc3QpKSByZXR1cm4gbm9kZVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG5vZGUua2luZCA9PT0gdHMuU3ludGF4S2luZC5UaGlzS2V5d29yZCkge1xuICAgICAgICAgICAgcmV0dXJuICh0cy5jcmVhdGVQYXJlbihcbiAgICAgICAgICAgICAgICB0cy5jcmVhdGVDb25kaXRpb25hbChcbiAgICAgICAgICAgICAgICAgICAgdHMuY3JlYXRlQmluYXJ5KFxuICAgICAgICAgICAgICAgICAgICAgICAgdHMuY3JlYXRlVHlwZU9mKHRzLmNyZWF0ZVRoaXMoKSksXG4gICAgICAgICAgICAgICAgICAgICAgICB0cy5jcmVhdGVUb2tlbih0cy5TeW50YXhLaW5kLkVxdWFsc0VxdWFsc0VxdWFsc1Rva2VuKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZVN0cmluZ0xpdGVyYWwoJ3VuZGVmaW5lZCcpLFxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICAgICB0cy5jcmVhdGVJZGVudGlmaWVyKCdnbG9iYWxUaGlzJyksXG4gICAgICAgICAgICAgICAgICAgIHRzLmNyZWF0ZVRoaXMoKSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgKSBhcyB1bmtub3duKSBhcyBUXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRzLnZpc2l0RWFjaENoaWxkKG5vZGUsIGNoaWxkID0+IHZpc2l0KGNoaWxkKSwgY29udGV4dClcbiAgICB9XG4gICAgcmV0dXJuIChub2RlID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB2aXNpdChub2RlKVxuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlXG4gICAgICAgIH1cbiAgICB9KSBhcyB0eXBlb2YgdmlzaXRcbn1cbmZ1bmN0aW9uIGlzSW5TdHJpY3RNb2RlKG5vZGU6IHRzLlN5bnRheExpc3QpIHtcbiAgICBjb25zdCBmaXJzdCA9IG5vZGUuZ2V0Q2hpbGRBdCgwKVxuICAgIGlmICghZmlyc3QpIHJldHVybiBmYWxzZVxuICAgIGlmICh0cy5pc0V4cHJlc3Npb25TdGF0ZW1lbnQoZmlyc3QpKSB7XG4gICAgICAgIGlmICh0cy5pc1N0cmluZ0xpdGVyYWwoZmlyc3QuZXhwcmVzc2lvbikpIHtcbiAgICAgICAgICAgIGlmIChmaXJzdC5leHByZXNzaW9uLnRleHQgPT09ICd1c2Ugc3RyaWN0JykgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2Vcbn1cbiIsImltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0J1xuaW1wb3J0IHsgdGhpc1RyYW5zZm9ybWF0aW9uIH0gZnJvbSAnLi90aGlzLXRyYW5zZm9ybWVyJ1xuXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtQVNUKHNyYzogc3RyaW5nKSB7XG4gICAgY29uc3Qgb3V0ID0gdHMudHJhbnNwaWxlTW9kdWxlKHNyYywge1xuICAgICAgICB0cmFuc2Zvcm1lcnM6IHtcbiAgICAgICAgICAgIGFmdGVyOiBbdGhpc1RyYW5zZm9ybWF0aW9uXSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVwb3J0RGlhZ25vc3RpY3M6IHRydWUsXG4gICAgICAgIGNvbXBpbGVyT3B0aW9uczoge1xuICAgICAgICAgICAgdGFyZ2V0OiB0cy5TY3JpcHRUYXJnZXQuRVMyMDE3LFxuICAgICAgICAgICAgcmVtb3ZlQ29tbWVudHM6IHRydWUsXG4gICAgICAgIH0sXG4gICAgfSlcbiAgICBjb25zdCBlcnJvciA9IFtdXG4gICAgZm9yIChjb25zdCBlcnIgb2Ygb3V0LmRpYWdub3N0aWNzIHx8IFtdKSB7XG4gICAgICAgIGxldCBlcnJUZXh0ID0gdHlwZW9mIGVyci5tZXNzYWdlVGV4dCA9PT0gJ3N0cmluZycgPyBlcnIubWVzc2FnZVRleHQgOiBlcnIubWVzc2FnZVRleHQubWVzc2FnZVRleHRcbiAgICAgICAgaWYgKGVyci5maWxlICYmIGVyci5zdGFydCAhPT0gdW5kZWZpbmVkICYmIGVyci5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3Qgc291cmNlID0gZXJyLmZpbGUuZ2V0RnVsbFRleHQoKVxuICAgICAgICAgICAgY29uc3Qgc3RhcnRMaW5lTnVtID0gKHNvdXJjZS5zbGljZSgwLCBlcnIuc3RhcnQpLm1hdGNoKC9cXG4vZykgfHwgW10pLmxlbmd0aFxuICAgICAgICAgICAgY29uc3QgZW5kTGluZU51bSA9IChzb3VyY2Uuc2xpY2UoMCwgZXJyLnN0YXJ0ICsgZXJyLmxlbmd0aCkubWF0Y2goL1xcbi9nKSB8fCBbXSkubGVuZ3RoXG4gICAgICAgICAgICBjb25zdCBsaW5lcyA9IHNvdXJjZS5zcGxpdCgnXFxuJylcbiAgICAgICAgICAgIGNvbnN0IGxpbmVJbmRpY2F0b3JMZW5ndGggPSBlbmRMaW5lTnVtLnRvU3RyaW5nKCkubGVuZ3RoICsgNVxuICAgICAgICAgICAgY29uc3QgZ2V0TGluZVdpdGhObyA9IChuOiBudW1iZXIpID0+XG4gICAgICAgICAgICAgICAgbGluZXNbbl0gPyBgTGluZSAke24gKyAxfSB8YC5wYWRTdGFydChsaW5lSW5kaWNhdG9yTGVuZ3RoKSArICcgICcgKyBsaW5lc1tuXSA6IG51bGxcbiAgICAgICAgICAgIGNvbnN0IGFyb3VuZExpbmVzID0gW1xuICAgICAgICAgICAgICAgIGdldExpbmVXaXRoTm8oc3RhcnRMaW5lTnVtIC0gMyksXG4gICAgICAgICAgICAgICAgZ2V0TGluZVdpdGhObyhzdGFydExpbmVOdW0gLSAyKSxcbiAgICAgICAgICAgICAgICBnZXRMaW5lV2l0aE5vKHN0YXJ0TGluZU51bSAtIDEpLFxuICAgICAgICAgICAgICAgIGdldExpbmVXaXRoTm8oc3RhcnRMaW5lTnVtKSxcbiAgICAgICAgICAgICAgICAnJy5wYWRTdGFydChsaW5lSW5kaWNhdG9yTGVuZ3RoICsgNCkgKyAnficucmVwZWF0KGxpbmVzW3N0YXJ0TGluZU51bV0ubGVuZ3RoKSxcbiAgICAgICAgICAgICAgICBzdGFydExpbmVOdW0gIT09IGVuZExpbmVOdW0gPyAnLi4uLi4uJyArIGdldExpbmVXaXRoTm8oZW5kTGluZU51bSkgOiBudWxsLFxuICAgICAgICAgICAgICAgIGdldExpbmVXaXRoTm8oZW5kTGluZU51bSArIDEpLFxuICAgICAgICAgICAgICAgIGdldExpbmVXaXRoTm8oZW5kTGluZU51bSArIDIpLFxuICAgICAgICAgICAgICAgIGdldExpbmVXaXRoTm8oZW5kTGluZU51bSArIDMpLFxuICAgICAgICAgICAgXS5maWx0ZXIoeCA9PiB4KSBhcyBzdHJpbmdbXVxuICAgICAgICAgICAgZXJyVGV4dCArPSBgXFxuJHthcm91bmRMaW5lcy5qb2luKCdcXG4nKX1cXG5gXG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IucHVzaChuZXcgU3ludGF4RXJyb3IoZXJyVGV4dCkpXG4gICAgfVxuICAgIGlmIChlcnJvclswXSkgdGhyb3cgZXJyb3JbMF1cbiAgICByZXR1cm4gb3V0Lm91dHB1dFRleHRcbn1cbiIsIi8qKlxuICogVGhpcyBmaWxlIHBhcnRseSBpbXBsZW1lbnRzIFhSYXlWaXNpb24gaW4gRmlyZWZveCdzIFdlYkV4dGVuc2lvbiBzdGFuZGFyZFxuICogYnkgY3JlYXRlIGEgdHdvLXdheSBKUyBzYW5kYm94IGJ1dCBzaGFyZWQgRE9NIGVudmlyb25tZW50LlxuICpcbiAqIGNsYXNzIFdlYkV4dGVuc2lvbkNvbnRlbnRTY3JpcHRFbnZpcm9ubWVudCB3aWxsIHJldHVybiBhIG5ldyBKUyBlbnZpcm9ubWVudFxuICogdGhhdCBoYXMgYSBcImJyb3dzZXJcIiB2YXJpYWJsZSBpbnNpZGUgb2YgaXQgYW5kIGEgY2xvbmUgb2YgdGhlIGN1cnJlbnQgRE9NIGVudmlyb25tZW50XG4gKiB0byBwcmV2ZW50IHRoZSBtYWluIHRocmVhZCBoYWNrIG9uIHByb3RvdHlwZSB0byBhY2Nlc3MgdGhlIGNvbnRlbnQgb2YgQ29udGVudFNjcmlwdHMuXG4gKlxuICogIyMgQ2hlY2tsaXN0OlxuICogLSBbb10gQ29udGVudFNjcmlwdCBjYW5ub3QgYWNjZXNzIG1haW4gdGhyZWFkXG4gKiAtIFs/XSBNYWluIHRocmVhZCBjYW5ub3QgYWNjZXNzIENvbnRlbnRTY3JpcHRcbiAqIC0gW29dIENvbnRlbnRTY3JpcHQgY2FuIGFjY2VzcyBtYWluIHRocmVhZCdzIERPTVxuICogLSBbIF0gQ29udGVudFNjcmlwdCBtb2RpZmljYXRpb24gb24gRE9NIHByb3RvdHlwZSBpcyBub3QgZGlzY292ZXJhYmxlIGJ5IG1haW4gdGhyZWFkXG4gKiAtIFsgXSBNYWluIHRocmVhZCBtb2RpZmljYXRpb24gb24gRE9NIHByb3RvdHlwZSBpcyBub3QgZGlzY292ZXJhYmxlIGJ5IENvbnRlbnRTY3JpcHRcbiAqL1xuaW1wb3J0IFJlYWxtLCB7IFJlYWxtIGFzIFJlYWxtSW5zdGFuY2UgfSBmcm9tICdyZWFsbXMtc2hpbSdcblxuaW1wb3J0IHsgQnJvd3NlckZhY3RvcnkgfSBmcm9tICcuL2Jyb3dzZXInXG5pbXBvcnQgeyBNYW5pZmVzdCB9IGZyb20gJy4uL0V4dGVuc2lvbnMnXG5pbXBvcnQgeyBlbmhhbmNlVVJMIH0gZnJvbSAnLi9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTCdcbmltcG9ydCB7IGNyZWF0ZUZldGNoIH0gZnJvbSAnLi9mZXRjaCdcbmltcG9ydCB7IG9wZW5FbmhhbmNlZCwgY2xvc2VFbmhhbmNlZCB9IGZyb20gJy4vd2luZG93Lm9wZW4rY2xvc2UnXG5pbXBvcnQgeyB0cmFuc2Zvcm1BU1QgfSBmcm9tICcuLi90cmFuc2Zvcm1lcnMnXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IGdldCB0aGUgcHJvdG90eXBlIGNoYWluIG9mIGFuIE9iamVjdFxuICogQHBhcmFtIG8gT2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGdldFByb3RvdHlwZUNoYWluKG86IGFueSwgXzogYW55W10gPSBbXSk6IGFueVtdIHtcbiAgICBpZiAobyA9PT0gdW5kZWZpbmVkIHx8IG8gPT09IG51bGwpIHJldHVybiBfXG4gICAgY29uc3QgeSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKVxuICAgIGlmICh5ID09PSBudWxsIHx8IHkgPT09IHVuZGVmaW5lZCB8fCB5ID09PSBPYmplY3QucHJvdG90eXBlKSByZXR1cm4gX1xuICAgIHJldHVybiBnZXRQcm90b3R5cGVDaGFpbihPYmplY3QuZ2V0UHJvdG90eXBlT2YoeSksIFsuLi5fLCB5XSlcbn1cbi8qKlxuICogQXBwbHkgYWxsIFdlYkFQSXMgdG8gdGhlIGNsZWFuIHNhbmRib3ggY3JlYXRlZCBieSBSZWFsbVxuICovXG5jb25zdCBQcmVwYXJlV2ViQVBJcyA9ICgoKSA9PiB7XG4gICAgLy8gPyByZXBsYWNlIEZ1bmN0aW9uIHdpdGggcG9sbHV0ZWQgdmVyc2lvbiBieSBSZWFsbXNcbiAgICAvLyAhIHRoaXMgbGVha3MgdGhlIHNhbmRib3ghXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5nZXRQcm90b3R5cGVPZigoKSA9PiB7fSksICdjb25zdHJ1Y3RvcicsIHtcbiAgICAgICAgdmFsdWU6IGdsb2JhbFRoaXMuRnVuY3Rpb24sXG4gICAgfSlcbiAgICBjb25zdCByZWFsV2luZG93ID0gd2luZG93XG4gICAgY29uc3Qgd2ViQVBJcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHdpbmRvdylcbiAgICBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHdlYkFQSXMsICd3aW5kb3cnKVxuICAgIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkod2ViQVBJcywgJ2dsb2JhbFRoaXMnKVxuICAgIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkod2ViQVBJcywgJ3NlbGYnKVxuICAgIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkod2ViQVBJcywgJ2dsb2JhbCcpXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KERvY3VtZW50LnByb3RvdHlwZSwgJ2RlZmF1bHRWaWV3Jywge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH0sXG4gICAgfSlcbiAgICByZXR1cm4gKHNhbmRib3hSb290OiB0eXBlb2YgZ2xvYmFsVGhpcykgPT4ge1xuICAgICAgICBjb25zdCBjbG9uZWRXZWJBUElzID0geyAuLi53ZWJBUElzIH1cbiAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoc2FuZGJveFJvb3QpLmZvckVhY2gobmFtZSA9PiBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KGNsb25lZFdlYkFQSXMsIG5hbWUpKVxuICAgICAgICAvLyA/IENsb25lIFdlYiBBUElzXG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHdlYkFQSXMpIHtcbiAgICAgICAgICAgIFBhdGNoVGhpc09mRGVzY3JpcHRvclRvR2xvYmFsKHdlYkFQSXNba2V5XSwgcmVhbFdpbmRvdylcbiAgICAgICAgfVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2FuZGJveFJvb3QsICd3aW5kb3cnLCB7XG4gICAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIHZhbHVlOiBzYW5kYm94Um9vdCxcbiAgICAgICAgfSlcbiAgICAgICAgT2JqZWN0LmFzc2lnbihzYW5kYm94Um9vdCwgeyBnbG9iYWxUaGlzOiBzYW5kYm94Um9vdCB9KVxuICAgICAgICBjb25zdCBwcm90byA9IGdldFByb3RvdHlwZUNoYWluKHJlYWxXaW5kb3cpXG4gICAgICAgICAgICAubWFwKE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKVxuICAgICAgICAgICAgLnJlZHVjZVJpZ2h0KChwcmV2aW91cywgY3VycmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvcHkgPSB7IC4uLmN1cnJlbnQgfVxuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIGNvcHkpIHtcbiAgICAgICAgICAgICAgICAgICAgUGF0Y2hUaGlzT2ZEZXNjcmlwdG9yVG9HbG9iYWwoY29weVtrZXldLCByZWFsV2luZG93KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShwcmV2aW91cywgY29weSlcbiAgICAgICAgICAgIH0sIHt9KVxuICAgICAgICBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc2FuZGJveFJvb3QsIHByb3RvKVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhzYW5kYm94Um9vdCwgY2xvbmVkV2ViQVBJcylcbiAgICB9XG59KSgpXG4vKipcbiAqIEV4ZWN1dGlvbiBlbnZpcm9ubWVudCBvZiBDb250ZW50U2NyaXB0XG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnRcbiAgICBpbXBsZW1lbnRzIFJlYWxtSW5zdGFuY2U8dHlwZW9mIGdsb2JhbFRoaXMgJiB7IGJyb3dzZXI6IHR5cGVvZiBicm93c2VyIH0+IHtcbiAgICBwcml2YXRlIHJlYWxtID0gUmVhbG0ubWFrZVJvb3RSZWFsbSh7XG4gICAgICAgIHNsb3BweUdsb2JhbHM6IHRydWUsXG4gICAgICAgIHRyYW5zZm9ybXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXdyaXRlOiBjdHggPT4ge1xuICAgICAgICAgICAgICAgICAgICBjdHguc3JjID0gdHJhbnNmb3JtQVNUKGN0eC5zcmMpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjdHhcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9KVxuICAgIGdldCBnbG9iYWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWxtLmdsb2JhbFxuICAgIH1cbiAgICByZWFkb25seSBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdSZWFsbSdcbiAgICAvKipcbiAgICAgKiBFdmFsdWF0ZSBhIHN0cmluZyBpbiB0aGUgY29udGVudCBzY3JpcHQgZW52aXJvbm1lbnRcbiAgICAgKiBAcGFyYW0gc291cmNlVGV4dCBTb3VyY2UgdGV4dFxuICAgICAqL1xuICAgIGV2YWx1YXRlKHNvdXJjZVRleHQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFsbS5ldmFsdWF0ZShzb3VyY2VUZXh0KVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgcnVubmluZyBleHRlbnNpb24gZm9yIGFuIGNvbnRlbnQgc2NyaXB0LlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRCBUaGUgZXh0ZW5zaW9uIElEXG4gICAgICogQHBhcmFtIG1hbmlmZXN0IFRoZSBtYW5pZmVzdCBvZiB0aGUgZXh0ZW5zaW9uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHVibGljIGV4dGVuc2lvbklEOiBzdHJpbmcsIHB1YmxpYyBtYW5pZmVzdDogTWFuaWZlc3QpIHtcbiAgICAgICAgUHJlcGFyZVdlYkFQSXModGhpcy5nbG9iYWwpXG4gICAgICAgIGNvbnN0IGJyb3dzZXIgPSBCcm93c2VyRmFjdG9yeSh0aGlzLmV4dGVuc2lvbklELCB0aGlzLm1hbmlmZXN0KVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5nbG9iYWwsICdicm93c2VyJywge1xuICAgICAgICAgICAgLy8gPyBNb3ppbGxhJ3MgcG9seWZpbGwgbWF5IG92ZXJ3cml0ZSB0aGlzLiBGaWd1cmUgdGhpcyBvdXQuXG4gICAgICAgICAgICBnZXQ6ICgpID0+IGJyb3dzZXIsXG4gICAgICAgICAgICBzZXQ6IHggPT4gZmFsc2UsXG4gICAgICAgIH0pXG4gICAgICAgIHRoaXMuZ2xvYmFsLmJyb3dzZXIgPSBCcm93c2VyRmFjdG9yeSh0aGlzLmV4dGVuc2lvbklELCB0aGlzLm1hbmlmZXN0KVxuICAgICAgICB0aGlzLmdsb2JhbC5VUkwgPSBlbmhhbmNlVVJMKHRoaXMuZ2xvYmFsLlVSTCwgdGhpcy5leHRlbnNpb25JRClcbiAgICAgICAgdGhpcy5nbG9iYWwuZmV0Y2ggPSBjcmVhdGVGZXRjaCh0aGlzLmV4dGVuc2lvbklELCB3aW5kb3cuZmV0Y2gpXG4gICAgICAgIHRoaXMuZ2xvYmFsLm9wZW4gPSBvcGVuRW5oYW5jZWQodGhpcy5leHRlbnNpb25JRClcbiAgICAgICAgdGhpcy5nbG9iYWwuY2xvc2UgPSBjbG9zZUVuaGFuY2VkKHRoaXMuZXh0ZW5zaW9uSUQpXG4gICAgfVxufVxuLyoqXG4gKiBNYW55IG1ldGhvZHMgb24gYHdpbmRvd2AgcmVxdWlyZXMgYHRoaXNgIHBvaW50cyB0byBhIFdpbmRvdyBvYmplY3RcbiAqIExpa2UgYGFsZXJ0KClgLiBJZiB5b3UgY2FsbCBhbGVydCBhcyBgY29uc3QgdyA9IHsgYWxlcnQgfTsgdy5hbGVydCgpYCxcbiAqIHRoZXJlIHdpbGwgYmUgYW4gSWxsZWdhbCBpbnZvY2F0aW9uLlxuICpcbiAqIFRvIHByZXZlbnQgYHRoaXNgIGJpbmRpbmcgbG9zdCwgd2UgbmVlZCB0byByZWJpbmQgaXQuXG4gKlxuICogQHBhcmFtIGRlc2MgUHJvcGVydHlEZXNjcmlwdG9yXG4gKiBAcGFyYW0gZ2xvYmFsIFRoZSByZWFsIHdpbmRvd1xuICovXG5mdW5jdGlvbiBQYXRjaFRoaXNPZkRlc2NyaXB0b3JUb0dsb2JhbChkZXNjOiBQcm9wZXJ0eURlc2NyaXB0b3IsIGdsb2JhbDogV2luZG93KSB7XG4gICAgY29uc3QgeyBnZXQsIHNldCwgdmFsdWUgfSA9IGRlc2NcbiAgICBpZiAoZ2V0KSBkZXNjLmdldCA9ICgpID0+IGdldC5hcHBseShnbG9iYWwpXG4gICAgaWYgKHNldCkgZGVzYy5zZXQgPSAodmFsOiBhbnkpID0+IHNldC5hcHBseShnbG9iYWwsIHZhbClcbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNvbnN0IGRlc2MyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnModmFsdWUpXG4gICAgICAgIGRlc2MudmFsdWUgPSBmdW5jdGlvbiguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgaWYgKG5ldy50YXJnZXQpIHJldHVybiBSZWZsZWN0LmNvbnN0cnVjdCh2YWx1ZSwgYXJncywgbmV3LnRhcmdldClcbiAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KHZhbHVlLCBnbG9iYWwsIGFyZ3MpXG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZGVzYy52YWx1ZSwgZGVzYzIpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyA/IEZvciB1bmtub3duIHJlYXNvbiB0aGlzIGZhaWwgZm9yIHNvbWUgb2JqZWN0cyBvbiBTYWZhcmkuXG4gICAgICAgICAgICB2YWx1ZS5wcm90b3R5cGUgJiYgT2JqZWN0LnNldFByb3RvdHlwZU9mKGRlc2MudmFsdWUsIHZhbHVlLnByb3RvdHlwZSlcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgIH1cbn1cbiIsImltcG9ydCB7IGlzRGVidWcgfSBmcm9tICcuLi9kZWJ1Z2dlci9pc0RlYnVnTW9kZSdcbmltcG9ydCB7IGRlYnVnTW9kZVVSTFJld3JpdGUgfSBmcm9tICcuLi9kZWJ1Z2dlci91cmwtcmV3cml0ZSdcbmltcG9ydCB7IEhvc3QgfSBmcm9tICcuLi9SUEMnXG5pbXBvcnQgeyBkZWNvZGVTdHJpbmdPckJsb2IgfSBmcm9tICcuL1N0cmluZ09yQmxvYidcblxuY29uc3Qgbm9ybWFsaXplZCA9IFN5bWJvbCgnTm9ybWFsaXplZCByZXNvdXJjZXMnKVxuZnVuY3Rpb24gbm9ybWFsaXplUGF0aChwYXRoOiBzdHJpbmcsIGV4dGVuc2lvbklEOiBzdHJpbmcpIHtcbiAgICBjb25zdCBwcmVmaXggPSBnZXRQcmVmaXgoZXh0ZW5zaW9uSUQpXG4gICAgaWYgKHBhdGguc3RhcnRzV2l0aChwcmVmaXgpKSByZXR1cm4gZGVidWdNb2RlVVJMUmV3cml0ZShleHRlbnNpb25JRCwgcGF0aClcbiAgICBlbHNlIHJldHVybiBkZWJ1Z01vZGVVUkxSZXdyaXRlKGV4dGVuc2lvbklELCBuZXcgVVJMKHBhdGgsIHByZWZpeCkudG9KU09OKCkpXG59XG5mdW5jdGlvbiBnZXRQcmVmaXgoZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIHJldHVybiAnaG9sb2Zsb3dzLWV4dGVuc2lvbjovLycgKyBleHRlbnNpb25JRCArICcvJ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzb3VyY2UoZXh0ZW5zaW9uSUQ6IHN0cmluZywgcmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIC8vIE5vcm1hbGl6YXRpb24gdGhlIHJlc291cmNlc1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBpZiAoIXJlc291cmNlc1tub3JtYWxpemVkXSkge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiByZXNvdXJjZXMpIHtcbiAgICAgICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aChnZXRQcmVmaXgoZXh0ZW5zaW9uSUQpKSkgY29udGludWVcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IHJlc291cmNlc1trZXldXG4gICAgICAgICAgICBkZWxldGUgcmVzb3VyY2VzW2tleV1cbiAgICAgICAgICAgIHJlc291cmNlc1tuZXcgVVJMKGtleSwgZ2V0UHJlZml4KGV4dGVuc2lvbklEKSkudG9KU09OKCldID0gb2JqXG4gICAgICAgIH1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXNvdXJjZXNbbm9ybWFsaXplZF0gPSB0cnVlXG4gICAgfVxuICAgIHJldHVybiByZXNvdXJjZXNbbm9ybWFsaXplUGF0aChwYXRoLCBleHRlbnNpb25JRCldXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRSZXNvdXJjZUFzeW5jKGV4dGVuc2lvbklEOiBzdHJpbmcsIHJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiwgcGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgcHJlbG9hZGVkID0gZ2V0UmVzb3VyY2UoZXh0ZW5zaW9uSUQsIHJlc291cmNlcywgcGF0aClcbiAgICBpZiAocHJlbG9hZGVkKSByZXR1cm4gcHJlbG9hZGVkXG5cbiAgICBjb25zdCB1cmwgPSBub3JtYWxpemVQYXRoKHBhdGgsIGV4dGVuc2lvbklEKVxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgSG9zdC5mZXRjaChleHRlbnNpb25JRCwgeyBtZXRob2Q6ICdHRVQnLCB1cmwgfSlcbiAgICBjb25zdCByZXN1bHQgPSBkZWNvZGVTdHJpbmdPckJsb2IocmVzcG9uc2UuZGF0YSlcbiAgICBpZiAocmVzdWx0ID09PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnKSByZXR1cm4gcmVzdWx0XG4gICAgY29uc29sZS5lcnJvcignTm90IHN1cHBvcnRlZCB0eXBlIGZvciBnZXRSZXNvdXJjZUFzeW5jJylcbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG4iLCJpbXBvcnQgeyBnZXRSZXNvdXJjZSwgZ2V0UmVzb3VyY2VBc3luYyB9IGZyb20gJy4uL3V0aWxzL1Jlc291cmNlcydcbmltcG9ydCB7IFJ1bkluUHJvdG9jb2xTY29wZSwgTWFuaWZlc3QgfSBmcm9tICcuLi9FeHRlbnNpb25zJ1xuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVIVE1MU2NyaXB0RWxlbWVudFNyYyhcbiAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgIG1hbmlmZXN0OiBNYW5pZmVzdCxcbiAgICBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIGFueT4sXG4gICAgY3VycmVudFBhZ2U6IHN0cmluZyxcbikge1xuICAgIGNvbnN0IHNyYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoSFRNTFNjcmlwdEVsZW1lbnQucHJvdG90eXBlLCAnc3JjJykhXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEhUTUxTY3JpcHRFbGVtZW50LnByb3RvdHlwZSwgJ3NyYycsIHtcbiAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHNyYy5nZXQhLmNhbGwodGhpcylcbiAgICAgICAgfSxcbiAgICAgICAgc2V0KHRoaXM6IEhUTUxTY3JpcHRFbGVtZW50LCBwYXRoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdzY3JpcHQgc3JjPScsIHBhdGgpXG4gICAgICAgICAgICBjb25zdCBwcmVsb2FkZWQgPSBnZXRSZXNvdXJjZShleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzLCBwYXRoKVxuICAgICAgICAgICAgaWYgKHByZWxvYWRlZCkgUnVuSW5Qcm90b2NvbFNjb3BlKGV4dGVuc2lvbklELCBtYW5pZmVzdCwgcHJlbG9hZGVkLCBjdXJyZW50UGFnZSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBnZXRSZXNvdXJjZUFzeW5jKGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMsIHBhdGgpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGNvZGUgPT4gY29kZSB8fCBQcm9taXNlLnJlamVjdDxzdHJpbmc+KCdMb2FkaW5nIHJlc291cmNlIGZhaWxlZCcpKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihjb2RlID0+IFJ1bkluUHJvdG9jb2xTY29wZShleHRlbnNpb25JRCwgbWFuaWZlc3QsIGNvZGUsIGN1cnJlbnRQYWdlKSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGUgPT4gY29uc29sZS5lcnJvcihgRmFpbGVkIHdoZW4gbG9hZGluZyByZXNvdXJjZWAsIHBhdGgsIGUpKVxuICAgICAgICAgICAgdGhpcy5kYXRhc2V0LnNyYyA9IHBhdGhcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH0sXG4gICAgfSlcbn1cbiIsImltcG9ydCB7IGlzRGVidWcgfSBmcm9tICcuLi9kZWJ1Z2dlci9pc0RlYnVnTW9kZSdcbmltcG9ydCB7IGRlYnVnTW9kZVVSTFJld3JpdGUgfSBmcm9tICcuLi9kZWJ1Z2dlci91cmwtcmV3cml0ZSdcblxuZXhwb3J0IGZ1bmN0aW9uIHJld3JpdGVXb3JrZXIoZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIGlmICghaXNEZWJ1ZykgcmV0dXJuXG4gICAgY29uc3Qgb3JpZ2luYWxXb3JrZXIgPSB3aW5kb3cuV29ya2VyXG4gICAgd2luZG93LldvcmtlciA9IG5ldyBQcm94eShvcmlnaW5hbFdvcmtlciwge1xuICAgICAgICBjb25zdHJ1Y3QodGFyZ2V0LCBhcmdzLCBuZXdUYXJnZXQpIHtcbiAgICAgICAgICAgIGFyZ3NbMF0gPSBkZWJ1Z01vZGVVUkxSZXdyaXRlKGV4dGVuc2lvbklELCBhcmdzWzBdKVxuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KHRhcmdldCwgYXJncywgbmV3VGFyZ2V0KVxuICAgICAgICB9LFxuICAgIH0pXG59XG4iLCJpbXBvcnQgeyBwYXJzZURlYnVnTW9kZVVSTCB9IGZyb20gJy4uL2RlYnVnZ2VyL2lzRGVidWdNb2RlJ1xuaW1wb3J0IHsgTWFuaWZlc3QgfSBmcm9tICcuLi9FeHRlbnNpb25zJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTG9jYXRpb25Qcm94eShleHRlbnNpb25JRDogc3RyaW5nLCBtYW5pZmVzdDogTWFuaWZlc3QsIGN1cnJlbnRQYWdlOiBzdHJpbmcpOiBMb2NhdGlvbiB7XG4gICAgY29uc3QgbG9jYXRpb25Qcm94eSA9IG5ldyBQcm94eSh7fSBhcyBhbnksIHtcbiAgICAgICAgZ2V0KHRhcmdldDogTG9jYXRpb24sIGtleToga2V5b2YgTG9jYXRpb24pIHtcbiAgICAgICAgICAgIHRhcmdldCA9IGxvY2F0aW9uXG4gICAgICAgICAgICBjb25zdCBvYmogPSB0YXJnZXRba2V5XSBhcyBhbnlcbiAgICAgICAgICAgIGlmIChrZXkgPT09ICdyZWxvYWQnKSByZXR1cm4gKCkgPT4gdGFyZ2V0LnJlbG9hZCgpXG4gICAgICAgICAgICBpZiAoa2V5ID09PSAnYXNzaWduJyB8fCBrZXkgPT09ICdyZXBsYWNlJylcbiAgICAgICAgICAgICAgICByZXR1cm4gKHVybDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgc3JjOiBiYXNlIH0gPSBwYXJzZURlYnVnTW9kZVVSTChleHRlbnNpb25JRCwgbWFuaWZlc3QpXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uUHJveHkuaHJlZiA9IG5ldyBVUkwodXJsLCBiYXNlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG1vY2tlZFVSTCA9IG5ldyBVUkwoY3VycmVudFBhZ2UpXG4gICAgICAgICAgICBpZiAoa2V5IGluIG1vY2tlZFVSTCkgcmV0dXJuIG1vY2tlZFVSTFtrZXkgYXMga2V5b2YgVVJMXVxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdBY2Nlc3NpbmcnLCBrZXksICdvbiBsb2NhdGlvbicpXG4gICAgICAgICAgICByZXR1cm4gb2JqXG4gICAgICAgIH0sXG4gICAgICAgIHNldCh0YXJnZXQ6IExvY2F0aW9uLCBrZXk6IGtleW9mIExvY2F0aW9uLCB2YWx1ZTogYW55KSB7XG4gICAgICAgICAgICB0YXJnZXQgPSBsb2NhdGlvblxuICAgICAgICAgICAgaWYgKGtleSA9PT0gJ29yaWdpbicpIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgY29uc3QgbW9ja2VkVVJMID0gbmV3IFVSTChjdXJyZW50UGFnZSlcbiAgICAgICAgICAgIGlmIChrZXkgaW4gbW9ja2VkVVJMKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFSZWZsZWN0LnNldChtb2NrZWRVUkwsIGtleSwgdmFsdWUpKSByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgICBjb25zdCBzZWFyY2ggPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHRhcmdldC5zZWFyY2gpXG4gICAgICAgICAgICAgICAgc2VhcmNoLnNldCgndXJsJywgbW9ja2VkVVJMLnRvSlNPTigpKVxuICAgICAgICAgICAgICAgIHRhcmdldC5zZWFyY2ggPSBzZWFyY2gudG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1NldHRpbmcnLCBrZXksICdvbiBsb2NhdGlvbiB0bycsIHZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3Quc2V0KHRhcmdldCwga2V5LCB2YWx1ZSlcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yOiBzYWZlR2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgIH0pXG4gICAgcmV0dXJuIGxvY2F0aW9uUHJveHlcbn1cblxuY29uc3Qgc2FmZUdldE93blByb3BlcnR5RGVzY3JpcHRvciA9IChvYmo6IGFueSwga2V5OiBhbnkpID0+IHtcbiAgICBjb25zdCBvcmlnID0gUmVmbGVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpXG4gICAgaWYgKCFvcmlnKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHsgLi4ub3JpZywgY29uZmlndXJhYmxlOiB0cnVlIH1cbn1cbiIsImltcG9ydCB7IG1hdGNoaW5nVVJMIH0gZnJvbSAnLi91dGlscy9VUkxNYXRjaGVyJ1xuaW1wb3J0IHsgV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50IH0gZnJvbSAnLi9zaGltcy9YUmF5VmlzaW9uJ1xuaW1wb3J0IHsgQnJvd3NlckZhY3RvcnkgfSBmcm9tICcuL3NoaW1zL2Jyb3dzZXInXG5pbXBvcnQgeyBjcmVhdGVGZXRjaCB9IGZyb20gJy4vc2hpbXMvZmV0Y2gnXG5pbXBvcnQgeyBlbmhhbmNlVVJMIH0gZnJvbSAnLi9zaGltcy9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTCdcbmltcG9ydCB7IG9wZW5FbmhhbmNlZCwgY2xvc2VFbmhhbmNlZCB9IGZyb20gJy4vc2hpbXMvd2luZG93Lm9wZW4rY2xvc2UnXG5pbXBvcnQgeyBnZXRSZXNvdXJjZUFzeW5jIH0gZnJvbSAnLi91dGlscy9SZXNvdXJjZXMnXG5pbXBvcnQgeyBFdmVudFBvb2xzIH0gZnJvbSAnLi91dGlscy9Mb2NhbE1lc3NhZ2VzJ1xuaW1wb3J0IHsgcmVzZXJ2ZWRJRCwgdXNlSW50ZXJuYWxTdG9yYWdlIH0gZnJvbSAnLi9pbnRlcm5hbCdcbmltcG9ydCB7IGlzRGVidWcsIHBhcnNlRGVidWdNb2RlVVJMIH0gZnJvbSAnLi9kZWJ1Z2dlci9pc0RlYnVnTW9kZSdcbmltcG9ydCB7IHdyaXRlSFRNTFNjcmlwdEVsZW1lbnRTcmMgfSBmcm9tICcuL2hpamFja3MvSFRNTFNjcmlwdC5wcm90b3R5cGUuc3JjJ1xuaW1wb3J0IHsgcmV3cml0ZVdvcmtlciB9IGZyb20gJy4vaGlqYWNrcy9Xb3JrZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yJ1xuaW1wb3J0IHsgY3JlYXRlTG9jYXRpb25Qcm94eSB9IGZyb20gJy4vaGlqYWNrcy9sb2NhdGlvbidcblxuZXhwb3J0IHR5cGUgV2ViRXh0ZW5zaW9uSUQgPSBzdHJpbmdcbmV4cG9ydCB0eXBlIE1hbmlmZXN0ID0gUGFydGlhbDxicm93c2VyLnJ1bnRpbWUuTWFuaWZlc3Q+ICZcbiAgICBQaWNrPGJyb3dzZXIucnVudGltZS5NYW5pZmVzdCwgJ25hbWUnIHwgJ3ZlcnNpb24nIHwgJ21hbmlmZXN0X3ZlcnNpb24nPlxuZXhwb3J0IGludGVyZmFjZSBXZWJFeHRlbnNpb24ge1xuICAgIG1hbmlmZXN0OiBNYW5pZmVzdFxuICAgIGVudmlyb25tZW50OiBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnRcbiAgICBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5cbn1cbmV4cG9ydCBjb25zdCByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uID0gbmV3IE1hcDxXZWJFeHRlbnNpb25JRCwgV2ViRXh0ZW5zaW9uPigpXG5leHBvcnQgZW51bSBFbnZpcm9ubWVudCB7XG4gICAgY29udGVudFNjcmlwdCA9ICdDb250ZW50IHNjcmlwdCcsXG4gICAgYmFja2dyb3VuZFNjcmlwdCA9ICdCYWNrZ3JvdW5kIHNjcmlwdCcsXG4gICAgcHJvdG9jb2xQYWdlID0gJ1Byb3RvY29sIHBhZ2UnLFxuICAgIGRlYnVnTW9kZU1hbmFnZWRQYWdlID0gJ21hbmFnZWQgcGFnZScsXG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVnaXN0ZXJXZWJFeHRlbnNpb24oXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge30sXG4pIHtcbiAgICBpZiAoZXh0ZW5zaW9uSUQgPT09IHJlc2VydmVkSUQpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBjYW5ub3QgdXNlIHJlc2VydmVkIGlkICcgKyByZXNlcnZlZElEICsgJyBhcyB0aGUgZXh0ZW5zaW9uIGlkJylcbiAgICBsZXQgZW52aXJvbm1lbnQ6IEVudmlyb25tZW50ID0gZ2V0Q29udGV4dChtYW5pZmVzdCwgZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcylcbiAgICBsZXQgZGVidWdNb2RlVVJMID0gJydcbiAgICBpZiAoaXNEZWJ1Zykge1xuICAgICAgICBjb25zdCBvcHQgPSBwYXJzZURlYnVnTW9kZVVSTChleHRlbnNpb25JRCwgbWFuaWZlc3QpXG4gICAgICAgIGVudmlyb25tZW50ID0gb3B0LmVudlxuICAgICAgICBkZWJ1Z01vZGVVUkwgPSBvcHQuc3JjXG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHN3aXRjaCAoZW52aXJvbm1lbnQpIHtcbiAgICAgICAgICAgIGNhc2UgRW52aXJvbm1lbnQuZGVidWdNb2RlTWFuYWdlZFBhZ2U6XG4gICAgICAgICAgICAgICAgaWYgKCFpc0RlYnVnKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIHN0YXRlJylcbiAgICAgICAgICAgICAgICBMb2FkQ29udGVudFNjcmlwdChtYW5pZmVzdCwgZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcywgZGVidWdNb2RlVVJMKVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlIEVudmlyb25tZW50LnByb3RvY29sUGFnZTpcbiAgICAgICAgICAgICAgICBwcmVwYXJlRXh0ZW5zaW9uUHJvdG9jb2xFbnZpcm9ubWVudChleHRlbnNpb25JRCwgbWFuaWZlc3QpXG4gICAgICAgICAgICAgICAgaWYgKGlzRGVidWcpIExvYWRQcm90b2NvbFBhZ2UoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0LCBwcmVsb2FkZWRSZXNvdXJjZXMsIGRlYnVnTW9kZVVSTClcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSBFbnZpcm9ubWVudC5iYWNrZ3JvdW5kU2NyaXB0OlxuICAgICAgICAgICAgICAgIHByZXBhcmVFeHRlbnNpb25Qcm90b2NvbEVudmlyb25tZW50KGV4dGVuc2lvbklELCBtYW5pZmVzdClcbiAgICAgICAgICAgICAgICBhd2FpdCB1bnRpbERvY3VtZW50UmVhZHkoKVxuICAgICAgICAgICAgICAgIGF3YWl0IExvYWRCYWNrZ3JvdW5kU2NyaXB0KG1hbmlmZXN0LCBleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzKVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlIEVudmlyb25tZW50LmNvbnRlbnRTY3JpcHQ6XG4gICAgICAgICAgICAgICAgYXdhaXQgdW50aWxEb2N1bWVudFJlYWR5KClcbiAgICAgICAgICAgICAgICBhd2FpdCBMb2FkQ29udGVudFNjcmlwdChtYW5pZmVzdCwgZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcylcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFtXZWJFeHRlbnNpb25dIHVua25vd24gcnVubmluZyBlbnZpcm9ubWVudCAke2Vudmlyb25tZW50fWApXG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICB9XG4gICAgaWYgKGVudmlyb25tZW50ID09PSBFbnZpcm9ubWVudC5iYWNrZ3JvdW5kU2NyaXB0KSB7XG4gICAgICAgIGNvbnN0IGluc3RhbGxIYW5kbGVyID0gRXZlbnRQb29sc1snYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbCddLmdldChleHRlbnNpb25JRClcbiAgICAgICAgaWYgKGluc3RhbGxIYW5kbGVyKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICB1c2VJbnRlcm5hbFN0b3JhZ2UoZXh0ZW5zaW9uSUQsIG8gPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGVycyA9IEFycmF5LmZyb20oaW5zdGFsbEhhbmRsZXIudmFsdWVzKCkpIGFzIGNhbGxiYWNrW11cbiAgICAgICAgICAgICAgICAgICAgdHlwZSBjYWxsYmFjayA9IHR5cGVvZiBicm93c2VyLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIgZXh0ZW5kcyAoKC4uLmFyZ3M6IGluZmVyIFQpID0+IGFueSlcbiAgICAgICAgICAgICAgICAgICAgICAgID8gVFswXVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBuZXZlclxuICAgICAgICAgICAgICAgICAgICA7W11cbiAgICAgICAgICAgICAgICAgICAgaWYgKG8ucHJldmlvdXNWZXJzaW9uKVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlcnMuZm9yRWFjaCh4ID0+IHgoeyBwcmV2aW91c1ZlcnNpb246IG8ucHJldmlvdXNWZXJzaW9uLCByZWFzb246ICd1cGRhdGUnIH0pKVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGhhbmRsZXJzLmZvckVhY2goeCA9PiB4KHsgcmVhc29uOiAnaW5zdGFsbCcgfSkpXG4gICAgICAgICAgICAgICAgICAgIG8ucHJldmlvdXNWZXJzaW9uID0gbWFuaWZlc3QudmVyc2lvblxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9LCAyMDAwKVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uXG59XG5cbmZ1bmN0aW9uIGdldENvbnRleHQobWFuaWZlc3Q6IE1hbmlmZXN0LCBleHRlbnNpb25JRDogc3RyaW5nLCBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgICBsZXQgZW52aXJvbm1lbnQ6IEVudmlyb25tZW50XG4gICAgaWYgKGxvY2F0aW9uLnByb3RvY29sID09PSAnaG9sb2Zsb3dzLWV4dGVuc2lvbjonKSB7XG4gICAgICAgIGlmIChsb2NhdGlvbi5wYXRobmFtZSA9PT0gJy9fZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZS5odG1sJykge1xuICAgICAgICAgICAgZW52aXJvbm1lbnQgPSBFbnZpcm9ubWVudC5iYWNrZ3JvdW5kU2NyaXB0XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBtYW5pZmVzdC5iYWNrZ3JvdW5kICYmXG4gICAgICAgICAgICBtYW5pZmVzdC5iYWNrZ3JvdW5kLnBhZ2UgJiZcbiAgICAgICAgICAgIGxvY2F0aW9uLnBhdGhuYW1lID09PSAnLycgKyBtYW5pZmVzdC5iYWNrZ3JvdW5kLnBhZ2VcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBlbnZpcm9ubWVudCA9IEVudmlyb25tZW50LmJhY2tncm91bmRTY3JpcHRcbiAgICAgICAgfSBlbHNlIGVudmlyb25tZW50ID0gRW52aXJvbm1lbnQucHJvdG9jb2xQYWdlXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZW52aXJvbm1lbnQgPSBFbnZpcm9ubWVudC5jb250ZW50U2NyaXB0XG4gICAgfVxuICAgIGNvbnNvbGUuZGVidWcoXG4gICAgICAgIGBbV2ViRXh0ZW5zaW9uXSBMb2FkaW5nIGV4dGVuc2lvbiAke21hbmlmZXN0Lm5hbWV9KCR7ZXh0ZW5zaW9uSUR9KSB3aXRoIG1hbmlmZXN0YCxcbiAgICAgICAgbWFuaWZlc3QsXG4gICAgICAgIGBhbmQgcHJlbG9hZGVkIHJlc291cmNlYCxcbiAgICAgICAgcHJlbG9hZGVkUmVzb3VyY2VzLFxuICAgICAgICBgaW4gJHtlbnZpcm9ubWVudH0gbW9kZWAsXG4gICAgKVxuICAgIHJldHVybiBlbnZpcm9ubWVudFxufVxuXG5mdW5jdGlvbiB1bnRpbERvY3VtZW50UmVhZHkoKSB7XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIHJlc29sdmUsIHsgb25jZTogdHJ1ZSwgcGFzc2l2ZTogdHJ1ZSB9KVxuICAgIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIExvYWRQcm90b2NvbFBhZ2UoXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICAgIGxvYWRpbmdQYWdlVVJMOiBzdHJpbmcsXG4pIHtcbiAgICBsb2FkaW5nUGFnZVVSTCA9IG5ldyBVUkwobG9hZGluZ1BhZ2VVUkwsICdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJyArIGV4dGVuc2lvbklEICsgJy8nKS50b0pTT04oKVxuICAgIHdyaXRlSFRNTFNjcmlwdEVsZW1lbnRTcmMoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0LCBwcmVsb2FkZWRSZXNvdXJjZXMsIGxvYWRpbmdQYWdlVVJMKVxuICAgIGF3YWl0IGxvYWRQcm90b2NvbFBhZ2VUb0N1cnJlbnRQYWdlKGV4dGVuc2lvbklELCBtYW5pZmVzdCwgcHJlbG9hZGVkUmVzb3VyY2VzLCBsb2FkaW5nUGFnZVVSTClcbn1cblxuYXN5bmMgZnVuY3Rpb24gTG9hZEJhY2tncm91bmRTY3JpcHQoXG4gICAgbWFuaWZlc3Q6IE1hbmlmZXN0LFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuKSB7XG4gICAgaWYgKCFtYW5pZmVzdC5iYWNrZ3JvdW5kKSByZXR1cm5cbiAgICBjb25zdCB7IHBhZ2UsIHNjcmlwdHMgfSA9IChtYW5pZmVzdC5iYWNrZ3JvdW5kIGFzIGFueSkgYXMgeyBwYWdlOiBzdHJpbmc7IHNjcmlwdHM6IHN0cmluZ1tdIH1cbiAgICBpZiAoIWlzRGVidWcgJiYgbG9jYXRpb24ucHJvdG9jb2wgIT09ICdob2xvZmxvd3MtZXh0ZW5zaW9uOicpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgQmFja2dyb3VuZCBzY3JpcHQgb25seSBhbGxvd2VkIGluIGxvY2FsaG9zdChmb3IgZGVidWdnaW5nKSBhbmQgaG9sb2Zsb3dzLWV4dGVuc2lvbjovL2ApXG4gICAgfVxuICAgIGxldCBjdXJyZW50UGFnZSA9ICdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJyArIGV4dGVuc2lvbklEICsgJy9fZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZS5odG1sJ1xuICAgIGlmIChwYWdlKSB7XG4gICAgICAgIGlmIChzY3JpcHRzICYmIHNjcmlwdHMubGVuZ3RoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgSW4gdGhlIG1hbmlmZXN0LCB5b3UgY2FuJ3QgaGF2ZSBib3RoIFwicGFnZVwiIGFuZCBcInNjcmlwdHNcIiBmb3IgYmFja2dyb3VuZCBmaWVsZCFgKVxuICAgICAgICBjb25zdCBwYWdlVVJMID0gbmV3IFVSTChwYWdlLCBsb2NhdGlvbi5vcmlnaW4pXG4gICAgICAgIGlmIChwYWdlVVJMLm9yaWdpbiAhPT0gbG9jYXRpb24ub3JpZ2luKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgWW91IGNhbiBub3Qgc3BlY2lmeSBhIGZvcmVpZ24gb3JpZ2luIGZvciB0aGUgYmFja2dyb3VuZCBwYWdlYClcbiAgICAgICAgY3VycmVudFBhZ2UgPSAnaG9sb2Zsb3dzLWV4dGVuc2lvbjovLycgKyBleHRlbnNpb25JRCArICcvJyArIHBhZ2VcbiAgICB9XG4gICAgd3JpdGVIVE1MU2NyaXB0RWxlbWVudFNyYyhleHRlbnNpb25JRCwgbWFuaWZlc3QsIHByZWxvYWRlZFJlc291cmNlcywgY3VycmVudFBhZ2UpXG4gICAgaWYgKHBhZ2UpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRQYWdlICE9PSBsb2NhdGlvbi5ocmVmKSB7XG4gICAgICAgICAgICBhd2FpdCBsb2FkUHJvdG9jb2xQYWdlVG9DdXJyZW50UGFnZShleHRlbnNpb25JRCwgbWFuaWZlc3QsIHByZWxvYWRlZFJlc291cmNlcywgcGFnZSlcbiAgICAgICAgICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpXG4gICAgICAgICAgICBpZiAoaXNEZWJ1Zykge1xuICAgICAgICAgICAgICAgIGRpdi5pbm5lckhUTUwgPSBgXG48c3R5bGU+Ym9keXtiYWNrZ3JvdW5kOiBibGFjazsgY29sb3I6IHdoaXRlO2ZvbnQtZmFtaWx5OiBzeXN0ZW0tdWk7fTwvc3R5bGU+XG5UaGlzIHBhZ2UgaXMgaW4gdGhlIGRlYnVnIG1vZGUgb2YgV2ViRXh0ZW5zaW9uLXBvbHlmaWxsPGJyIC8+XG5JdCdzIHJ1bm5pbmcgaW4gdGhlIGJhY2tncm91bmQgcGFnZSBtb2RlYFxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZGl2KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChjb25zdCBwYXRoIG9mIChzY3JpcHRzIGFzIHN0cmluZ1tdKSB8fCBbXSkge1xuICAgICAgICAgICAgY29uc3QgcHJlbG9hZGVkID0gYXdhaXQgZ2V0UmVzb3VyY2VBc3luYyhleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzLCBwYXRoKVxuICAgICAgICAgICAgaWYgKHByZWxvYWRlZCkge1xuICAgICAgICAgICAgICAgIC8vID8gUnVuIGl0IGluIGdsb2JhbCBzY29wZS5cbiAgICAgICAgICAgICAgICBSdW5JblByb3RvY29sU2NvcGUoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0LCBwcmVsb2FkZWQsIGN1cnJlbnRQYWdlKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbV2ViRXh0ZW5zaW9uXSBCYWNrZ3JvdW5kIHNjcmlwdHMgbm90IGZvdW5kIGZvciAke21hbmlmZXN0Lm5hbWV9OiAke3BhdGh9YClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZFByb3RvY29sUGFnZVRvQ3VycmVudFBhZ2UoXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICAgIHBhZ2U6IHN0cmluZyxcbikge1xuICAgIGNvbnN0IGh0bWwgPSBhd2FpdCBnZXRSZXNvdXJjZUFzeW5jKGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMsIHBhZ2UpXG4gICAgaWYgKCFodG1sKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgZmluZCBiYWNrZ3JvdW5kIHBhZ2UuJylcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKClcbiAgICBjb25zdCBkb20gPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKVxuICAgIGNvbnN0IHNjcmlwdHMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgQXJyYXkuZnJvbShkb20ucXVlcnlTZWxlY3RvckFsbCgnc2NyaXB0JykpLm1hcChhc3luYyBzY3JpcHQgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IG5ldyBVUkwoc2NyaXB0LnNyYykucGF0aG5hbWVcbiAgICAgICAgICAgIHNjcmlwdC5yZW1vdmUoKVxuICAgICAgICAgICAgcmV0dXJuIFtwYXRoLCBhd2FpdCBnZXRSZXNvdXJjZUFzeW5jKGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMsIHBhdGgpXVxuICAgICAgICB9KSxcbiAgICApXG4gICAgZm9yIChjb25zdCBjIG9mIGRvY3VtZW50LmhlYWQuY2hpbGRyZW4pIGMucmVtb3ZlKClcbiAgICBmb3IgKGNvbnN0IGMgb2YgZG9tLmhlYWQuY2hpbGRyZW4pIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoYylcbiAgICBmb3IgKGNvbnN0IGMgb2YgZG9jdW1lbnQuYm9keS5jaGlsZHJlbikgYy5yZW1vdmUoKVxuICAgIGZvciAoY29uc3QgYyBvZiBkb20uYm9keS5jaGlsZHJlbikgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjKVxuICAgIGZvciAoY29uc3QgW3BhdGgsIHNjcmlwdF0gb2Ygc2NyaXB0cykge1xuICAgICAgICBpZiAoc2NyaXB0KVxuICAgICAgICAgICAgUnVuSW5Qcm90b2NvbFNjb3BlKFxuICAgICAgICAgICAgICAgIGV4dGVuc2lvbklELFxuICAgICAgICAgICAgICAgIG1hbmlmZXN0LFxuICAgICAgICAgICAgICAgIHNjcmlwdCxcbiAgICAgICAgICAgICAgICBuZXcgVVJMKHBhZ2UsICdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJyArIGV4dGVuc2lvbklEICsgJy8nKS50b0pTT04oKSxcbiAgICAgICAgICAgIClcbiAgICAgICAgZWxzZSBjb25zb2xlLmVycm9yKCdSZXNvdXJjZScsIHBhdGgsICdub3QgZm91bmQnKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcHJlcGFyZUV4dGVuc2lvblByb3RvY29sRW52aXJvbm1lbnQoZXh0ZW5zaW9uSUQ6IHN0cmluZywgbWFuaWZlc3Q6IE1hbmlmZXN0KSB7XG4gICAgcmV3cml0ZVdvcmtlcihleHRlbnNpb25JRClcbiAgICBPYmplY3QuYXNzaWduKHdpbmRvdywge1xuICAgICAgICBicm93c2VyOiBCcm93c2VyRmFjdG9yeShleHRlbnNpb25JRCwgbWFuaWZlc3QpLFxuICAgICAgICBmZXRjaDogY3JlYXRlRmV0Y2goZXh0ZW5zaW9uSUQsIHdpbmRvdy5mZXRjaCksXG4gICAgICAgIFVSTDogZW5oYW5jZVVSTChVUkwsIGV4dGVuc2lvbklEKSxcbiAgICAgICAgb3Blbjogb3BlbkVuaGFuY2VkKGV4dGVuc2lvbklEKSxcbiAgICAgICAgY2xvc2U6IGNsb3NlRW5oYW5jZWQoZXh0ZW5zaW9uSUQpLFxuICAgIH0gYXMgUGFydGlhbDx0eXBlb2YgZ2xvYmFsVGhpcz4pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBSdW5JblByb3RvY29sU2NvcGUoZXh0ZW5zaW9uSUQ6IHN0cmluZywgbWFuaWZlc3Q6IE1hbmlmZXN0LCBzb3VyY2U6IHN0cmluZywgY3VycmVudFBhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChsb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2hvbG9mbG93cy1leHRlbnNpb246Jykge1xuICAgICAgICBjb25zdCBsaWtlRVNNb2R1bGUgPSBzb3VyY2UubWF0Y2goJ2ltcG9ydCcpIHx8IHNvdXJjZS5tYXRjaCgnZXhwb3J0ICcpXG4gICAgICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgICAgIHNjcmlwdC50eXBlID0gbGlrZUVTTW9kdWxlID8gJ21vZHVsZScgOiAndGV4dC9qYXZhc2NyaXB0J1xuICAgICAgICBzY3JpcHQuaW5uZXJIVE1MID0gc291cmNlXG4gICAgICAgIHNjcmlwdC5kZWZlciA9IHRydWVcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpXG4gICAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoIWlzRGVidWcpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1J1biBpbiB0aGUgd3Jvbmcgc2NvcGUnKVxuICAgIGlmIChzb3VyY2UuaW5kZXhPZignYnJvd3NlcicpKSB7XG4gICAgICAgIGNvbnN0IGluZGlyZWN0RXZhbCA9IE1hdGgucmFuZG9tKCkgPiAtMSA/IGV2YWwgOiAoKSA9PiB7fVxuICAgICAgICBjb25zdCBmID0gaW5kaXJlY3RFdmFsKGAoZnVuY3Rpb24oXyl7d2l0aChfKXske3NvdXJjZX19fSlgKVxuICAgICAgICBjb25zdCBfID0gKHg6IGtleW9mIHR5cGVvZiBSZWZsZWN0KSA9PiAodGFyZ2V0OiBhbnksIC4uLmFueTogYW55W10pID0+XG4gICAgICAgICAgICBSZWZsZWN0LmFwcGx5KFJlZmxlY3RbeF0sIG51bGwsIFt3aW5kb3csIC4uLmFueV0pXG4gICAgICAgIGNvbnN0IHNhZmVHZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSAob2JqOiBhbnksIGtleTogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBvcmlnID0gUmVmbGVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqLCBrZXkpXG4gICAgICAgICAgICBpZiAoIW9yaWcpIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgICAgIHJldHVybiB7IC4uLm9yaWcsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBlbnYsIHNyYyB9ID0gcGFyc2VEZWJ1Z01vZGVVUkwoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0KVxuICAgICAgICBjb25zdCBsb2NhdGlvblByb3h5ID0gY3JlYXRlTG9jYXRpb25Qcm94eShleHRlbnNpb25JRCwgbWFuaWZlc3QsIGN1cnJlbnRQYWdlIHx8IHNyYylcbiAgICAgICAgY29uc3QgZ2xvYmFsUHJveHlUcmFwID0gbmV3IFByb3h5KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGdldCh0YXJnZXQ6IGFueSwga2V5OiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ3dpbmRvdycpIHJldHVybiBnbG9iYWxQcm94eVxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAnZ2xvYmFsVGhpcycpIHJldHVybiBnbG9iYWxQcm94eVxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSAnbG9jYXRpb24nKSByZXR1cm4gbG9jYXRpb25Qcm94eVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBvYmogPSB3aW5kb3dba2V5XSBhcyBhbnlcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlc2MyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMob2JqKVxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZiguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXcudGFyZ2V0KSByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3Qob2JqLCBhcmdzLCBuZXcudGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KG9iaiwgd2luZG93LCBhcmdzKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZiwgZGVzYzIpXG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Quc2V0UHJvdG90eXBlT2YoZiwgT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaikpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmpcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcjogc2FmZUdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICAgICAgICAgIH0gYXMgUHJveHlIYW5kbGVyPGFueT4sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZ2V0KHRhcmdldDogYW55LCBrZXk6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0W2tleV0pIHJldHVybiB0YXJnZXRba2V5XVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXyhrZXkpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIClcbiAgICAgICAgY29uc3QgZ2xvYmFsUHJveHk6IHR5cGVvZiB3aW5kb3cgPSBuZXcgUHJveHkoe30sIGdsb2JhbFByb3h5VHJhcCkgYXMgYW55XG4gICAgICAgIGYoZ2xvYmFsUHJveHkpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgZXZhbChzb3VyY2UpXG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBMb2FkQ29udGVudFNjcmlwdChcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4gICAgZGVidWdNb2RlUHJldGVuZGVkVVJMPzogc3RyaW5nLFxuKSB7XG4gICAgaWYgKCFpc0RlYnVnICYmIGRlYnVnTW9kZVByZXRlbmRlZFVSTCkgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBzdGF0ZScpXG4gICAgaWYgKGlzRGVidWcpIHtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSBgXG48c3R5bGU+Ym9keXtiYWNrZ3JvdW5kOiBibGFjazsgY29sb3I6IHdoaXRlO2ZvbnQtZmFtaWx5OiBzeXN0ZW0tdWk7fTwvc3R5bGU+XG48ZGl2PlRoaXMgcGFnZSBpcyBydW5uaW5nIGluIHRoZSBkZWJ1ZyBtb2RlIG9mIFdlYkV4dGVuc2lvbiBwb2x5ZmlsbDwvZGl2PlxuPGRpdj5JdCBub3cgcHJldGVuZGluZyB0byBiZSAke2RlYnVnTW9kZVByZXRlbmRlZFVSTH08L2Rpdj5cbjxkaXY+U28geW91ciBjb250ZW50IHNjcmlwdCB3aWxsIGluamVjdCBpbnRvIHRoaXMgcGFnZS48L2Rpdj5cbjxociAvPlxuQ29weSBhbmQgYXBwbHkgdGhlIHdlYnBhZ2UgdG8gZGVidWcgeW91ciBjb250ZW50IHNjcmlwdDpcblxuPHRleHRhcmVhIGlkPVwiYVwiPjwvdGV4dGFyZWE+XG48YnIgLz5cbjxidXR0b24gb25jbGljaz1cIlxudmFyIHAgPSBuZXcgRE9NUGFyc2VyKCk7XG52YXIgZG9tID0gcC5wYXJzZUZyb21TdHJpbmcoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2EnKS52YWx1ZSwgJ3RleHQvaHRtbCcpO1xuZG9tLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NjcmlwdCcpLmZvckVhY2goeCA9PiB4LnJlbW92ZSgpKTtcbnZhciB4ID0gbmV3IFhNTFNlcmlhbGl6ZXIoKTtcbnZhciBodG1sID0geC5zZXJpYWxpemVUb1N0cmluZyhkb20pO1xuZG9jdW1lbnQud3JpdGUoaHRtbCk7XCI+UmVtb3ZlIHNjcmlwdCB0YWdzIGFuZCBnbzwvYnV0dG9uPlxuYFxuICAgIH1cbiAgICBpZiAoIXJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uaGFzKGV4dGVuc2lvbklEKSkge1xuICAgICAgICBjb25zdCBlbnZpcm9ubWVudCA9IG5ldyBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnQoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0KVxuICAgICAgICBpZiAoZGVidWdNb2RlUHJldGVuZGVkVVJMKVxuICAgICAgICAgICAgZW52aXJvbm1lbnQuZ2xvYmFsLmxvY2F0aW9uID0gY3JlYXRlTG9jYXRpb25Qcm94eShleHRlbnNpb25JRCwgbWFuaWZlc3QsIGRlYnVnTW9kZVByZXRlbmRlZFVSTClcbiAgICAgICAgY29uc3QgZXh0OiBXZWJFeHRlbnNpb24gPSB7XG4gICAgICAgICAgICBtYW5pZmVzdCxcbiAgICAgICAgICAgIGVudmlyb25tZW50LFxuICAgICAgICAgICAgcHJlbG9hZGVkUmVzb3VyY2VzLFxuICAgICAgICB9XG4gICAgICAgIHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uc2V0KGV4dGVuc2lvbklELCBleHQpXG4gICAgfVxuICAgIGZvciAoY29uc3QgW2luZGV4LCBjb250ZW50XSBvZiAobWFuaWZlc3QuY29udGVudF9zY3JpcHRzIHx8IFtdKS5lbnRyaWVzKCkpIHtcbiAgICAgICAgd2FybmluZ05vdEltcGxlbWVudGVkSXRlbShjb250ZW50LCBpbmRleClcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgbWF0Y2hpbmdVUkwoXG4gICAgICAgICAgICAgICAgbmV3IFVSTChkZWJ1Z01vZGVQcmV0ZW5kZWRVUkwgfHwgbG9jYXRpb24uaHJlZiksXG4gICAgICAgICAgICAgICAgY29udGVudC5tYXRjaGVzLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQuZXhjbHVkZV9tYXRjaGVzIHx8IFtdLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQuaW5jbHVkZV9nbG9icyB8fCBbXSxcbiAgICAgICAgICAgICAgICBjb250ZW50LmV4Y2x1ZGVfZ2xvYnMgfHwgW10sXG4gICAgICAgICAgICAgICAgY29udGVudC5tYXRjaF9hYm91dF9ibGFuayxcbiAgICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbV2ViRXh0ZW5zaW9uXSBMb2FkaW5nIGNvbnRlbnQgc2NyaXB0IGZvcmAsIGNvbnRlbnQpXG4gICAgICAgICAgICBhd2FpdCBsb2FkQ29udGVudFNjcmlwdChleHRlbnNpb25JRCwgbWFuaWZlc3QsIGNvbnRlbnQsIHByZWxvYWRlZFJlc291cmNlcylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtXZWJFeHRlbnNpb25dIFVSTCBtaXNtYXRjaGVkLiBTa2lwIGNvbnRlbnQgc2NyaXB0IGZvciwgYCwgY29udGVudClcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRDb250ZW50U2NyaXB0KFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgbWFuaWZlc3Q6IE1hbmlmZXN0LFxuICAgIGNvbnRlbnQ6IE5vbk51bGxhYmxlPE1hbmlmZXN0Wydjb250ZW50X3NjcmlwdHMnXT5bMF0sXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuKSB7XG4gICAgY29uc3QgeyBlbnZpcm9ubWVudCB9ID0gcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5nZXQoZXh0ZW5zaW9uSUQpIVxuICAgIGZvciAoY29uc3QgcGF0aCBvZiBjb250ZW50LmpzIHx8IFtdKSB7XG4gICAgICAgIGNvbnN0IHByZWxvYWRlZCA9IGF3YWl0IGdldFJlc291cmNlQXN5bmMoZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcywgcGF0aClcbiAgICAgICAgaWYgKHByZWxvYWRlZCkge1xuICAgICAgICAgICAgZW52aXJvbm1lbnQuZXZhbHVhdGUocHJlbG9hZGVkKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW1dlYkV4dGVuc2lvbl0gQ29udGVudCBzY3JpcHRzIG5vdCBmb3VuZCBmb3IgJHttYW5pZmVzdC5uYW1lfTogJHtwYXRofWApXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHdhcm5pbmdOb3RJbXBsZW1lbnRlZEl0ZW0oY29udGVudDogTm9uTnVsbGFibGU8TWFuaWZlc3RbJ2NvbnRlbnRfc2NyaXB0cyddPlswXSwgaW5kZXg6IG51bWJlcikge1xuICAgIGlmIChjb250ZW50LmFsbF9mcmFtZXMpXG4gICAgICAgIGNvbnNvbGUud2FybihgYWxsX2ZyYW1lcyBub3Qgc3VwcG9ydGVkIHlldC4gRGVmaW5lZCBhdCBtYW5pZmVzdC5jb250ZW50X3NjcmlwdHNbJHtpbmRleH1dLmFsbF9mcmFtZXNgKVxuICAgIGlmIChjb250ZW50LmNzcykgY29uc29sZS53YXJuKGBjc3Mgbm90IHN1cHBvcnRlZCB5ZXQuIERlZmluZWQgYXQgbWFuaWZlc3QuY29udGVudF9zY3JpcHRzWyR7aW5kZXh9XS5jc3NgKVxuICAgIGlmIChjb250ZW50LnJ1bl9hdCAmJiBjb250ZW50LnJ1bl9hdCAhPT0gJ2RvY3VtZW50X3N0YXJ0JylcbiAgICAgICAgY29uc29sZS53YXJuKGBydW5fYXQgbm90IHN1cHBvcnRlZCB5ZXQuIERlZmluZWQgYXQgbWFuaWZlc3QuY29udGVudF9zY3JpcHRzWyR7aW5kZXh9XS5ydW5fYXRgKVxufVxuIiwiaW1wb3J0IHsgQXN5bmNDYWxsIH0gZnJvbSAnQGhvbG9mbG93cy9raXQvZXMnXG5pbXBvcnQgeyBIb3N0LCBUaGlzU2lkZUltcGxlbWVudGF0aW9uLCBTYW1lUGFnZURlYnVnQ2hhbm5lbCB9IGZyb20gJy4uL1JQQydcbmltcG9ydCB7IHVzZUludGVybmFsU3RvcmFnZSB9IGZyb20gJy4uL2ludGVybmFsJ1xuaW1wb3J0IHsgZ2V0UmVzb3VyY2VBc3luYyB9IGZyb20gJy4uL3V0aWxzL1Jlc291cmNlcydcbmltcG9ydCB7IGlzRGVidWcsIHBhcnNlRGVidWdNb2RlVVJMIH0gZnJvbSAnLi9pc0RlYnVnTW9kZSdcbmltcG9ydCB7IGRlYnVnTW9kZVVSTFJld3JpdGUgfSBmcm9tICcuL3VybC1yZXdyaXRlJ1xuXG5jb25zdCBsb2c6IDxUPihydDogVCkgPT4gKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+ID0gcnQgPT4gYXN5bmMgKC4uLmFyZ3MpID0+IHtcbiAgICBjb25zb2xlLmxvZygnTW9ja2VkIEhvc3QnLCAuLi5hcmdzKVxuICAgIHJldHVybiBydCFcbn1cblxuY2xhc3MgQ3Jvc3NQYWdlRGVidWdDaGFubmVsIHtcbiAgICBicm9hZGNhc3QgPSBuZXcgQnJvYWRjYXN0Q2hhbm5lbCgnd2ViZXh0LXBvbHlmaWxsLWRlYnVnJylcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5icm9hZGNhc3QuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGUgPT4ge1xuICAgICAgICAgICAgaWYgKGUub3JpZ2luICE9PSBsb2NhdGlvbi5vcmlnaW4pIGNvbnNvbGUud2FybihlLm9yaWdpbiwgbG9jYXRpb24ub3JpZ2luKVxuICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gZS5kYXRhXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGYgb2YgdGhpcy5saXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGYoZGV0YWlsKVxuICAgICAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG4gICAgcHJpdmF0ZSBsaXN0ZW5lcjogQXJyYXk8KGRhdGE6IHVua25vd24pID0+IHZvaWQ+ID0gW11cbiAgICBvbihfOiBzdHJpbmcsIGNiOiAoZGF0YTogYW55KSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgIHRoaXMubGlzdGVuZXIucHVzaChjYilcbiAgICB9XG4gICAgZW1pdChfOiBzdHJpbmcsIGRhdGE6IGFueSk6IHZvaWQge1xuICAgICAgICB0aGlzLmJyb2FkY2FzdC5wb3N0TWVzc2FnZShkYXRhKVxuICAgIH1cbn1cblxuaW50ZXJmYWNlIE1vY2tlZExvY2FsU2VydmljZSB7XG4gICAgb25NZXNzYWdlOiBUaGlzU2lkZUltcGxlbWVudGF0aW9uWydvbk1lc3NhZ2UnXVxuICAgIG9uQ29tbWl0dGVkOiBUaGlzU2lkZUltcGxlbWVudGF0aW9uWydicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnXVxufVxuaWYgKGlzRGVidWcpIHtcbiAgICBjb25zdCBtb2NrSG9zdCA9IEFzeW5jQ2FsbDxNb2NrZWRMb2NhbFNlcnZpY2U+KFxuICAgICAgICB7XG4gICAgICAgICAgICBvbk1lc3NhZ2U6IFRoaXNTaWRlSW1wbGVtZW50YXRpb24ub25NZXNzYWdlLFxuICAgICAgICAgICAgb25Db21taXR0ZWQ6IFRoaXNTaWRlSW1wbGVtZW50YXRpb25bJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCddLFxuICAgICAgICB9IGFzIE1vY2tlZExvY2FsU2VydmljZSxcbiAgICAgICAge1xuICAgICAgICAgICAga2V5OiAnbW9jaycsXG4gICAgICAgICAgICBsb2c6IGZhbHNlLFxuICAgICAgICAgICAgbWVzc2FnZUNoYW5uZWw6IG5ldyBDcm9zc1BhZ2VEZWJ1Z0NoYW5uZWwoKSxcbiAgICAgICAgfSxcbiAgICApXG4gICAgY29uc3QgbXlUYWJJRCA9IE1hdGgucmFuZG9tKClcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY29uc3Qgb2JqID0gcGFyc2VEZWJ1Z01vZGVVUkwoJycsIHt9IGFzIGFueSlcbiAgICAgICAgbW9ja0hvc3Qub25Db21taXR0ZWQoeyB0YWJJZDogbXlUYWJJRCwgdXJsOiBvYmouc3JjIH0pXG4gICAgfSwgMjAwMClcbiAgICBjb25zdCBob3N0OiBIb3N0ID0ge1xuICAgICAgICAnVVJMLmNyZWF0ZU9iamVjdFVSTCc6IGxvZyh2b2lkIDApLFxuICAgICAgICAnVVJMLnJldm9rZU9iamVjdFVSTCc6IGxvZyh2b2lkIDApLFxuICAgICAgICAnYnJvd3Nlci5kb3dubG9hZHMuZG93bmxvYWQnOiBsb2codm9pZCAwKSxcbiAgICAgICAgYXN5bmMgc2VuZE1lc3NhZ2UoZSwgdCwgdHQsIG0sIG1tKSB7XG4gICAgICAgICAgICBtb2NrSG9zdC5vbk1lc3NhZ2UoZSwgdCwgbSwgbW0sIHsgaWQ6IG5ldyBVUkxTZWFyY2hQYXJhbXMobG9jYXRpb24uc2VhcmNoKS5nZXQoJ2lkJykhIH0pXG4gICAgICAgIH0sXG4gICAgICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwuY2xlYXInOiBsb2codm9pZCAwKSxcbiAgICAgICAgYXN5bmMgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQnKGV4dGVuc2lvbklELCBrKSB7XG4gICAgICAgICAgICByZXR1cm4gKGF3YWl0IHVzZUludGVybmFsU3RvcmFnZShleHRlbnNpb25JRCkpLmRlYnVnTW9kZVN0b3JhZ2UgfHwge31cbiAgICAgICAgfSxcbiAgICAgICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5yZW1vdmUnOiBsb2codm9pZCAwKSxcbiAgICAgICAgYXN5bmMgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQnKGV4dGVuc2lvbklELCBkKSB7XG4gICAgICAgICAgICB1c2VJbnRlcm5hbFN0b3JhZ2UoZXh0ZW5zaW9uSUQsIG8gPT4gKG8uZGVidWdNb2RlU3RvcmFnZSA9IE9iamVjdC5hc3NpZ24oe30sIG8uZGVidWdNb2RlU3RvcmFnZSwgZCkpKVxuICAgICAgICB9LFxuICAgICAgICBhc3luYyAnYnJvd3Nlci50YWJzLmNyZWF0ZScoZXh0ZW5zaW9uSUQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy51cmwpIHRocm93IG5ldyBUeXBlRXJyb3IoJ25lZWQgYSB1cmwnKVxuICAgICAgICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxuICAgICAgICAgICAgYS5ocmVmID0gZGVidWdNb2RlVVJMUmV3cml0ZShleHRlbnNpb25JRCwgb3B0aW9ucy51cmwpXG4gICAgICAgICAgICBjb25zdCBwYXJhbSA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoKVxuICAgICAgICAgICAgcGFyYW0uc2V0KCd1cmwnLCBvcHRpb25zLnVybClcbiAgICAgICAgICAgIHBhcmFtLnNldCgndHlwZScsIG9wdGlvbnMudXJsLnN0YXJ0c1dpdGgoJ2hvbG9mbG93cy1leHRlbnNpb246Ly8nKSA/ICdwJyA6ICdtJylcbiAgICAgICAgICAgIGEuaHJlZiA9ICcvZGVidWc/JyArIHBhcmFtXG4gICAgICAgICAgICBhLmlubmVyVGV4dCA9ICdicm93c2VyLnRhYnMuY3JlYXRlOiAnICsgb3B0aW9ucy51cmxcbiAgICAgICAgICAgIGEudGFyZ2V0ID0gJ19ibGFuaydcbiAgICAgICAgICAgIGEuc3R5bGUuY29sb3IgPSAnd2hpdGUnXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpXG4gICAgICAgICAgICByZXR1cm4geyBpZDogTWF0aC5yYW5kb20oKSB9IGFzIGFueVxuICAgICAgICB9LFxuICAgICAgICAnYnJvd3Nlci50YWJzLnF1ZXJ5JzogbG9nKFtdKSxcbiAgICAgICAgJ2Jyb3dzZXIudGFicy5yZW1vdmUnOiBsb2codm9pZCAwKSxcbiAgICAgICAgJ2Jyb3dzZXIudGFicy51cGRhdGUnOiBsb2coe30gYXMgYnJvd3Nlci50YWJzLlRhYiksXG4gICAgICAgIGFzeW5jIGZldGNoKGV4dGVuc2lvbklELCByKSB7XG4gICAgICAgICAgICBjb25zdCBoID0gYXdhaXQgZ2V0UmVzb3VyY2VBc3luYyhleHRlbnNpb25JRCwge30sIHIudXJsKVxuICAgICAgICAgICAgaWYgKGgpIHJldHVybiB7IGRhdGE6IHsgY29udGVudDogaCwgbWltZVR5cGU6ICcnLCB0eXBlOiAndGV4dCcgfSwgc3RhdHVzOiAyMDAsIHN0YXR1c1RleHQ6ICdvaycgfVxuICAgICAgICAgICAgcmV0dXJuIHsgZGF0YTogeyBjb250ZW50OiAnJywgbWltZVR5cGU6ICcnLCB0eXBlOiAndGV4dCcgfSwgc3RhdHVzOiA0MDQsIHN0YXR1c1RleHQ6ICdOb3QgZm91bmQnIH1cbiAgICAgICAgfSxcbiAgICB9XG4gICAgQXN5bmNDYWxsKGhvc3QsIHtcbiAgICAgICAga2V5OiAnJyxcbiAgICAgICAgbG9nOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZUNoYW5uZWw6IG5ldyBTYW1lUGFnZURlYnVnQ2hhbm5lbCgnc2VydmVyJyksXG4gICAgfSlcbn1cbiIsImltcG9ydCB7IHJlZ2lzdGVyV2ViRXh0ZW5zaW9uIH0gZnJvbSAnLi9FeHRlbnNpb25zJ1xuaW1wb3J0IHsgV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50IH0gZnJvbSAnLi9zaGltcy9YUmF5VmlzaW9uJ1xuaW1wb3J0ICcuL2RlYnVnZ2VyL2xvY2FsaG9zdCdcbmltcG9ydCB7IGlzRGVidWcgfSBmcm9tICcuL2RlYnVnZ2VyL2lzRGVidWdNb2RlJ1xuLy8gIyMgSW5qZWN0IGhlcmVcblxuaWYgKGlzRGVidWcpIHtcbiAgICAvLyBsZWF2ZXMgeW91ciBpZCBoZXJlLCBhbmQgcHV0IHlvdXIgZXh0ZW5zaW9uIHRvIC9leHRlbnNpb24ve2lkfS9cbiAgICBjb25zdCB0ZXN0SURzID0gWydlb2ZrZGdraGZvZWJlY21hbWxqZmFlcGNrb2VjamhpYiddXG4gICAgdGVzdElEcy5mb3JFYWNoKGlkID0+XG4gICAgICAgIGZldGNoKCcvZXh0ZW5zaW9uLycgKyBpZCArICcvbWFuaWZlc3QuanNvbicpXG4gICAgICAgICAgICAudGhlbih4ID0+IHgudGV4dCgpKVxuICAgICAgICAgICAgLnRoZW4oeCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0xvYWRpbmcgdGVzdCBXZWJFeHRlbnNpb24nKVxuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZ2xvYmFsVGhpcywge1xuICAgICAgICAgICAgICAgICAgICBhOiByZWdpc3RlcldlYkV4dGVuc2lvbixcbiAgICAgICAgICAgICAgICAgICAgYjogV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50LFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlZ2lzdGVyV2ViRXh0ZW5zaW9uKGlkLCBKU09OLnBhcnNlKHgpKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKHYgPT4gT2JqZWN0LmFzc2lnbihnbG9iYWxUaGlzLCB7IGM6IHYgfSkpLFxuICAgIClcbn1cblxuLyoqXG4gKiByZWdpc3RlcldlYkV4dGVuc2lvbihcbiAqICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAqICAgICAgbWFuaWZlc3Q6IE1hbmlmZXN0LFxuICogICAgICBwcmVsb2FkZWRSZXNvdXJjZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+XG4gKiApXG4gKi9cbiJdLCJuYW1lcyI6WyJBc3luY0NhbGwiXSwibWFwcGluZ3MiOiI7Ozs7OztJQUFBOzs7Ozs7OztBQVFBLGFBQWdCLFdBQVcsQ0FDdkIsUUFBYSxFQUNiLE9BQWlCLEVBQ2pCLGVBQXlCLEVBQ3pCLGFBQXVCLEVBQ3ZCLGFBQXVCLEVBQ3ZCLFdBQXFCO1FBRXJCLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQTs7UUFFbEIsS0FB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
