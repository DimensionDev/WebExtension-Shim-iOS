/******/ (function(modules) { // webpackBootstrap
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
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

//@ts-ignore
// Learn more about this hack from https://stackoverflow.com/a/52809105/1986338
history.pushState = ((f) => function pushState(data, title, url) {
    const ret = f.apply(history, [data, title, url]);
    window.dispatchEvent(new Event('pushstate'));
    window.dispatchEvent(new Event('locationchange'));
    return ret;
})(history.pushState);
history.replaceState = ((f) => function replaceState(data, title, url) {
    const ret = f.apply(history, [data, title, url]);
    window.dispatchEvent(new Event('replacestate'));
    window.dispatchEvent(new Event('locationchange'));
    return ret;
})(history.replaceState);
window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('locationchange'));
});


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/constants.ts
/** Just a random one. Never mind. */
const CustomEventId = '6fea93e2-1ce4-442f-b2f9-abaf4ff0ce64';
var DecryptFailedReason;
(function (DecryptFailedReason) {
    DecryptFailedReason["MyCryptoKeyNotFound"] = "MyCryptoKeyNotFound";
})(DecryptFailedReason || (DecryptFailedReason = {}));
const WALLET_OR_PERSONA_NAME_MAX_LEN = 31;

// CONCATENATED MODULE: ./packages/maskbook/src/extension/injected-script/addEventListener.ts
var _a, _b;

const CapturingEvents = new Set(['keyup', 'input', 'paste']);
//#region instincts
const { apply } = Reflect;
const { error, log, warn } = console;
const isConnectedGetter = Object.getOwnPropertyDescriptor(Node.prototype, 'isConnected').get;
const _XPCNativeWrapper = typeof XPCNativeWrapper === 'undefined' ? undefined : XPCNativeWrapper;
// The "window."" here is used to create a un-xrayed Proxy on Firefox
const un_xray_Proxy = globalThis.window.Proxy;
const input_value_setter = (_a = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')) === null || _a === void 0 ? void 0 : _a.set;
const textarea_value_setter = (_b = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')) === null || _b === void 0 ? void 0 : _b.set;
const CapturedListeners = new WeakMap();
function isNodeConnected(x) {
    try {
        return isConnectedGetter.call(x);
    }
    catch {
        return false;
    }
}
//#endregion
function dispatchEventRaw(target, eventBase, overwrites = {}) {
    var _a;
    let currentTarget = target;
    const event = getMockedEvent(eventBase, () => currentTarget, overwrites);
    // Note: in firefox, "event" is "Opaque". Displayed as an empty object.
    const type = eventBase.type;
    if (!CapturingEvents.has(type))
        return warn("!!!! You're capturing an event that didn't captured. !!!!");
    const bubblingNode = bubble();
    for (const Node of bubblingNode) {
        // TODO: implement
        // Event.prototype.stopPropagation
        // Event.prototype.stopImmediatePropagation
        // Event.prototype.composedPath
        // capture event
        // once event
        // passive event
        const listeners = (_a = CapturedListeners.get(Node)) === null || _a === void 0 ? void 0 : _a.get(type);
        if (!listeners)
            continue;
        for (const [f, { capture, once, passive }] of listeners) {
            if (capture)
                continue;
            try {
                f(event);
            }
            catch (e) {
                error(e);
            }
        }
    }
    function* bubble() {
        while (currentTarget) {
            yield currentTarget;
            currentTarget = currentTarget.parentNode;
        }
        yield document;
        yield window;
    }
    function getMockedEvent(event, currentTarget, overwrites = {}) {
        const target = un_xray(currentTarget());
        const source = {
            target,
            srcElement: target,
            // ? Why ?
            _inherits_from_prototype: true,
            defaultPrevented: false,
            preventDefault: clone_into(() => { }),
            ...overwrites,
        };
        return new un_xray_Proxy(event, clone_into({
            get(target, key) {
                var _a;
                if (key === 'currentTarget')
                    return un_xray(currentTarget());
                return (_a = source[key]) !== null && _a !== void 0 ? _a : un_xray(target)[key];
            },
        }));
    }
}
function dispatchPaste(textOrImage) {
    var _a;
    const data = new DataTransfer();
    const e = new ClipboardEvent('paste', {
        clipboardData: data,
        // @ts-ignore Firefox only API
        dataType: typeof textOrImage === 'string' ? 'text/plain' : void 0,
        data: typeof textOrImage === 'string' ? textOrImage : void 0,
        bubbles: true,
        cancelable: true,
    });
    if (typeof textOrImage === 'string') {
        data.setData('text/plain', textOrImage);
        document.activeElement.dispatchEvent(e);
    }
    else if (textOrImage.type === 'image') {
        const Uint8Array = globalThis.Uint8Array ? globalThis.Uint8Array : globalThis.window.Uint8Array;
        const xray_binary = Uint8Array.from(textOrImage.value);
        const xray_blob = new Blob([clone_into(xray_binary)], { type: 'image/png' });
        const file = un_xray(new File([un_xray(xray_blob)], 'image.png', {
            lastModified: Date.now(),
            type: 'image/png',
        }));
        const dt = new globalThis.window.Proxy(un_xray(data), clone_into({
            get(target, key) {
                if (key === 'files')
                    return clone_into([file]);
                if (key === 'types')
                    return clone_into(['Files']);
                if (key === 'items')
                    return clone_into([
                        {
                            kind: 'file',
                            type: 'image/png',
                            getAsFile() {
                                return file;
                            },
                        },
                    ]);
                if (key === 'getData')
                    return clone_into(() => '');
                return un_xray(target[key]);
            },
        }));
        dispatchEventRaw(document.activeElement, e, { clipboardData: dt });
    }
    else {
        const error = new Error(`Unknown event, got ${(_a = textOrImage === null || textOrImage === void 0 ? void 0 : textOrImage.type) !== null && _a !== void 0 ? _a : 'unknown'}`);
        // cause firefox will not display error from extension
        console.error(error);
        throw error;
    }
}
function dispatchInput(text) {
    // Cause react hooks the input.value getter & setter, set hooked version will notify react **not** call the onChange callback.
    {
        let setter = (_value) => warn('Unknown active element type', document.activeElement);
        if (document.activeElement instanceof HTMLInputElement)
            setter = input_value_setter;
        else if (document.activeElement instanceof HTMLTextAreaElement)
            setter = textarea_value_setter;
        apply(setter, document.activeElement, [text]);
    }
    dispatchEventRaw(document.activeElement, new globalThis.window.InputEvent('input', clone_into({ inputType: 'insertText', data: text })));
}
if (false)
    {}
document.addEventListener(CustomEventId, (e) => {
    const ev = e;
    const [eventName, param, selector] = JSON.parse(ev.detail);
    switch (eventName) {
        case 'input':
            return apply(dispatchInput, null, param);
        case 'paste':
            return apply(dispatchPaste, null, param);
        default:
            warn(eventName, 'not handled');
    }
});
//#region Overwrite EventTarget.prototype.*
redefineEventTargetPrototype('addEventListener', (raw, _this, args) => {
    const result = apply(raw, _this, args);
    if (!CapturingEvents.has(args[0]))
        return result;
    const { f, type, ...desc } = normalizeAddEventListenerArgs(args);
    if (CapturingEvents.has(type)) {
        if (!CapturedListeners.has(_this))
            CapturedListeners.set(_this, new Map());
        const map = CapturedListeners.get(_this);
        if (!map.has(type))
            map.set(type, new Map());
        const map2 = map.get(type);
        map2.set(f, desc);
    }
    return result;
});
redefineEventTargetPrototype('removeEventListener', (raw, _this, args) => {
    var _a, _b;
    const result = apply(raw, _this, args);
    if (!CapturingEvents.has(args[0]))
        return result;
    const { type, f } = normalizeAddEventListenerArgs(args);
    (_b = (_a = CapturedListeners.get(_this)) === null || _a === void 0 ? void 0 : _a.get(type)) === null || _b === void 0 ? void 0 : _b.delete(f);
    return result;
});
function redefineEventTargetPrototype(defineAs, apply) {
    try {
        if (_XPCNativeWrapper) {
            log('Redefine with Firefox private API, cool!');
            const rawPrototype = _XPCNativeWrapper.unwrap(globalThis.window.EventTarget.prototype);
            const rawFunction = rawPrototype[defineAs];
            exportFunction(function (...args) {
                return apply(rawFunction, this, args);
            }, rawPrototype, { defineAs });
            return;
        }
    }
    catch {
        console.error('Redefine failed.');
    }
    EventTarget.prototype[defineAs] = new Proxy(EventTarget.prototype[defineAs], { apply });
}
function normalizeAddEventListenerArgs(args) {
    var _a, _b, _c;
    const [type, listener, options] = args;
    let f = () => { };
    if (typeof listener === 'function')
        f = listener;
    else if (typeof listener === 'object')
        f = listener === null || listener === void 0 ? void 0 : listener.handleEvent.bind(listener);
    let capture = false;
    if (typeof options === 'boolean')
        capture = options;
    else if (typeof options === 'object')
        capture = (_a = options === null || options === void 0 ? void 0 : options.capture) !== null && _a !== void 0 ? _a : false;
    let passive = false;
    if (typeof options === 'object')
        passive = (_b = options === null || options === void 0 ? void 0 : options.passive) !== null && _b !== void 0 ? _b : false;
    let once = false;
    if (typeof options === 'object')
        once = (_c = options === null || options === void 0 ? void 0 : options.once) !== null && _c !== void 0 ? _c : false;
    return { type, f, once, capture, passive };
}
//#endregion
//#region Firefox magic
/** get the un xrayed version of a _DOM_ object */
function un_xray(x) {
    if (_XPCNativeWrapper)
        return _XPCNativeWrapper.unwrap(x);
    return x;
}
/** Clone a object into the page realm */
function clone_into(x) {
    if (typeof cloneInto === 'function')
        return cloneInto(x, window, { cloneFunctions: true });
    return x;
}
//#endregion

// EXTERNAL MODULE: ./packages/maskbook/src/extension/injected-script/locationChange.ts
var locationChange = __webpack_require__(0);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/injected-script/index.ts
var injected_script_a;


(injected_script_a = document.currentScript) === null || injected_script_a === void 0 ? void 0 : injected_script_a.remove();


/***/ })
/******/ ]);