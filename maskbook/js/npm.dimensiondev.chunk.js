(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[1],{

/***/ 1052:
/***/ (function(module, exports, __webpack_require__) {

/// <reference types="./full.d.ts" />
((r,t)=>{ true?t(exports):undefined})(this,(function(r){"use strict";class t extends Error{constructor(r,t,e,n){super(t),this.name=r,this.code=e,this.stack=n}}const e={Error,EvalError,RangeError,ReferenceError,SyntaxError,TypeError,URIError},n="DOMException:";function o(r=""){return r.replace(/^.+\n.+\n/,"")}const i=(()=>{const r=Reflect.get(globalThis,"DOMException");if("function"==typeof r)return r})(),s="2.0";function a(r,t,e,n){void 0===r&&(r=null),Number.isNaN(t=Math.floor(t))&&(t=-1);const o={jsonrpc:s,id:r,error:{code:t,message:e,data:n}};return y(o.error,"data"),o}function c(r,t,e){const{id:n}=r,{code:o,message:i,data:s}=e(t,r);return a(n,o,i,s)}a.ParseError=(r,t)=>{const e=c({},r,t),n=e.error;return n.code=-32700,n.message="Parse error",e},a.InvalidRequest=r=>a(r,-32600,"Invalid Request"),a.MethodNotFound=r=>a(r,-32601,"Method not found");const l=(r="",t=-1)=>e=>{let o="";d(e)&&f(e,"message")&&"string"==typeof e.message&&(o=e.message);let s=((r,t)=>{let n=r;try{n=null===(i=null===(o=e)||void 0===o?void 0:o.constructor)||void 0===i?void 0:i.name}catch(o){}var o,i;return"string"!=typeof n?r:n})("Error");return i&&e instanceof i&&(s=n+e.name),"string"!=typeof e&&"number"!=typeof e&&"boolean"!=typeof e&&"bigint"!=typeof e||(s="Error",o=e+""),{code:t,message:o,data:r?{stack:r,type:s}:{type:s}}};function u(r){if(!d(r))return!1;if(!f(r,"jsonrpc"))return!1;if(r.jsonrpc!==s)return!1;if(f(r,"params")){const t=r.params;if(!Array.isArray(t)&&!d(t))return!1}return!0}function d(r){return"object"==typeof r&&null!==r}function f(r,t){return t in r}function y(r,t){void 0===r[t]&&delete r[t]}const p={serialization:r=>r,deserialization:r=>r},h=Symbol.for("AsyncCall/ignored"),m=Symbol.for("AsyncCall/notify"),g=Symbol.for("AsyncCall/batch");function v(r,t){return r[t][m]}function b(){return Math.random().toString(36).slice(2)}function w(r){return"boolean"!=typeof r?r:{methodNotFound:r,unknownMessage:r}}const E={serializer:p,key:"jsonrpc",strict:!0,log:!0,parameterStructures:"by-position",preferLocalImplementation:!1,idGenerator:b};function k(r={},p){var v;let b=void 0;r instanceof Promise||(b=r),Promise.resolve(r).then(r=>b=r);const{serializer:k,key:S,strict:$,log:P,parameterStructures:A,preferLocalImplementation:j,idGenerator:x,mapError:O,logger:C,channel:z}={...E,...p},{methodNotFound:N=!1,unknownMessage:R=!1}=w($),{beCalled:M=!0,localError:I=!0,remoteError:T=!0,type:F="pretty",sendLocalStack:q=!1,requestReplay:G=!1}=(r=>"boolean"!=typeof r?r:{beCalled:r,localError:r,remoteError:r,type:r?"pretty":"basic"})(P),W=(r=>{const t=r||globalThis.console,e=(...r)=>t.log(...r);return Object.assign({},{debug:e,error:e,groupCollapsed:e,groupEnd:e,log:e,warn:e},t)})(C),J=new Map;async function L(r){var t;let e;try{if(e=await k.deserialization(r),u(e))return await H(e);if(Array.isArray(e)&&e.every(u)&&0!==e.length){const r=await Promise.all(e.map(H));if(e.every(r=>void 0===r))return;return r.filter(r=>r)}return R?a.InvalidRequest(null!==(t=e.id)&&void 0!==t?t:null):void 0}catch(r){return I&&W.error(r,e,undefined),a.ParseError(r,O||l(null==r?void 0:r.stack))}}async function D(r){if(r){if(Array.isArray(r)){const t=r.filter(r=>f(r,"id"));if(0===t.length)return;return k.serialization(t)}if(f(r,"id"))return k.serialization(r)}}var U;if(f(U=z,"setup")&&"function"==typeof U.setup&&z.setup(r=>L(r).then(D),r=>{const t=k.deserialization(r);return!!u(t)||Promise.resolve(t).then(u)}),(r=>f(r,"send")&&"function"==typeof r.send)(z)){const r=z;null===(v=r.on)||void 0===v||v.call(r,t=>L(t).then(D).then(t=>t&&r.send(t)))}return new Proxy({},{get(r,t){let e=o(Error().stack);const n=r=>(...n)=>{let o=void 0;if(t===g&&(o=n.shift(),t=n.shift()),"symbol"==typeof t){const r=Symbol.keyFor(t)||t.description;if(r){if(!r.startsWith("rpc."))return Promise.reject('[AsyncCall] An internal method must start with "rpc."');t=r}}else if(t.startsWith("rpc."))return Promise.reject(new TypeError("[AsyncCall] Can't call internal methods directly"));if(j&&b&&"string"==typeof t){const r=b[t];if(r&&"function"==typeof r)return new Promise(t=>t(r(...n)))}return new Promise((i,a)=>{const c=x(),[l]=n,u=q?e:"",f="by-name"===A&&1===n.length&&d(l)?l:n,p=((r,t,e,n)=>{const o={jsonrpc:s,id:r,method:t,params:e,remoteStack:n};return y(o,"id"),((r,t)=>{r[t]||delete r[t]})(o,"remoteStack"),o})(r?void 0:c,t,f,u);if(o?(o.push(p),o.r||(o.r=[()=>_(o),B.bind(o)])):_(p).catch(a),r)return i();J.set(c,{f:[i,a],stack:e})})},i=n(!1);return i[m]=n(!0),i[m][m]=i[m],i}});async function _(r){const t=await k.serialization(r);return z.send(t)}function B(r){var t;for(const e of this)f(e,"id")&&(null===(t=J.get(e.id))||void 0===t||t.f[1](r))}async function H(u){return f(u,"method")?async function(t){b||await r;let e="";try{const r=t.method.startsWith("rpc.")?Symbol.for(t.method):t.method,n=b[r];if("function"!=typeof n)return N?a.MethodNotFound(t.id):void(I&&W.debug("Receive remote call, but not implemented.",r,t));const{params:i}=t,c=Array.isArray(i)?i:[i];e=o(Error().stack);const l=new Promise(r=>r(n.apply(b,c)));if(M)if("basic"===F)W.log(`${S}.${t.method}(${""+[...c]}) @${t.id}`);else{const r=[`${S}.%c${t.method}%c(${c.map(()=>"%o").join(", ")}%c)\n%o %c@${t.id}`,"color: #d2c057","",...c,"",l,"color: gray; font-style: italic;"];G&&r.push(()=>{debugger;return n.apply(b,c)}),t.remoteStack?(W.groupCollapsed(...r),W.log(t.remoteStack),W.groupEnd()):W.log(...r)}if(await l===h)return;return((r,t)=>{const e={jsonrpc:s,id:r,result:t};return y(e,"id"),e})(t.id,await l)}catch(r){return"object"==typeof r&&"stack"in r&&(r.stack=e.split("\n").reduce((r,t)=>r.replace(t+"\n",""),r.stack||"")),I&&W.error(r),c(t,r,O||l(q?r.stack:void 0))}}(u):async function(r){let o="",s="",a=0,c="Error";if(f(r,"error")){const t=r.error;o=t.message,a=t.code;const e=t.data;s=d(e)&&f(e,"stack")&&"string"==typeof e.stack?e.stack:"<remote stack not available>",c=d(e)&&f(e,"type")&&"string"==typeof e.type?e.type:"Error",T&&("basic"===F?W.error(`${c}: ${o}(${a}) @${r.id}\n${s}`):W.error(`${c}: ${o}(${a}) %c@${r.id}\n%c${s}`,"color: gray",""))}if(null===r.id||void 0===r.id)return;const{f:[l,u],stack:y}=J.get(r.id)||{stack:"",f:[null,null]};l&&(J.delete(r.id),f(r,"error")?u(((r,o,s,a)=>{try{if(r.startsWith(n)&&i){const[,t]=r.split(n);return new i(o,t)}if(r in e){const t=new e[r](o);return t.stack=a,Object.assign(t,{code:s}),t}return new t(r,o,s,a)}catch(t){return Error(`E${s} ${r}: ${o}\n${a}`)}})(c,o,a,s+"\n    аt AsyncCall (rpc) \n"+y)):l(r.result))}(u)}}const S=Symbol.for("rpc.async-iterator.start"),$=Symbol.for("rpc.async-iterator.next"),P=Symbol.for("rpc.async-iterator.return"),A=Symbol.for("rpc.async-iterator.throw");class j{constructor(r,t){this.r=r,this.i=t,this.d=!1,this.c=async r=>(await C(r,()=>this.d=!0),r)}async return(r){return this.d||this.c(this.r[P](await this.i,r)).catch(()=>{}),this.d=!0,z(!0,r)}async next(r){return this.d?z(!0):await this.c(this.r[$](await this.i,r))}async throw(r){if(!this.d)return await this.c(this.r[A](await this.i,r));throw r}}const x=async function*(){}.constructor.prototype;Object.setPrototypeOf(j,x);const O=Object.getPrototypeOf(async function*(){}());async function C(r,t){try{const e=await r;(null==e?void 0:e.done)&&t()}catch(r){}}function z(r,t){return{done:r,value:t}}Object.setPrototypeOf(j.prototype,O),r.AsyncCall=k,r.AsyncGeneratorCall=(r={},t)=>{var e;const n=new Map,o=w(null===(e=t.strict)||void 0===e||e),{idGenerator:i=b}=t;function s(r,t,e){const i=n.get(r);if(!i){if(o.methodNotFound)throw Error(`Iterator ${r} not found, ${t}() failed.`);return h}const s=e(i);return C(s,()=>n.delete(r)),s}const a=k({async[S](t,e){const s=Reflect.get(await r,t);if("function"!=typeof s){if(o.methodNotFound)throw Error(t+" is not a function");return h}const a=s(...e),c=i();return n.set(c,a),Promise.resolve(c)},[$]:(r,t)=>s(r,"next",r=>r.next(t)),[P]:(r,t)=>s(r,"return",r=>{var e;return null===(e=r.return)||void 0===e?void 0:e.call(r,t)}),[A]:(r,t)=>s(r,"throw",r=>{var e;return null===(e=r.throw)||void 0===e?void 0:e.call(r,t)})},t);return new Proxy({},{get:(r,t)=>{if("string"!=typeof t)throw new TypeError("[*AsyncCall] Only string can be the method name");return(...r)=>{const e=a[S](t,r);return new j(a,e)}}})},r.JSONSerialization=(r=[void 0,void 0],t,e="null")=>({serialization(n){if(e&&d(n)&&f(n,"result")&&void 0===n.result){const r=Object.assign({},n);r.result=null,"keep"===e&&(r.undef=!0),n=r}return JSON.stringify(n,r[0],t)},deserialization(t){const e=JSON.parse(t,r[1]);return d(e)&&f(e,"result")&&null===e.result&&f(e,"undef")&&!0===e.undef&&(e.result=void 0,delete e.undef),e}}),r.NoSerialization=p,r.batch=r=>{let t=[];return[new Proxy(r,{get(r,e){const n=(...n)=>r[g](t,e,...n);return(n[m]=(...n)=>r[g][m](t,e,...n))[m]=n[m],n}}),()=>{var r;return null===(r=t.r)||void 0===r?void 0:r[0]()},(r=Error("Aborted"))=>{var e;null===(e=t.r)||void 0===e||e[1](r),t=[]}]},r.notify=r=>"function"==typeof r?r[m]:new Proxy(r,{get:v}),Object.defineProperty(r,"__esModule",{value:!0})}));


/***/ }),

/***/ 132:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ValueRef; });
/**
 * This file is published by MIT License.
 */
/**
 * A `ref` object with `addListener`
 *
 * @example
 * ```ts
 * const ref = new ValueRef(64)
 * function useValueRef<T>(ref: ValueRef<T>) {
 *   const { useState, useEffect } = React
 *
 *   const [value, setValue] = useState<T>(ref.value)
 *   useEffect(() => {
 *       if (ref.isEqual(value, ref.value) === false) {
 *           // The state is outdated before the useEffect runs
 *           setValue(ref.value)
 *       }
 *       return ref.addListener(v => setValue(v))
 *   }, [ref, value])
 *   return value
 * }
 * ref.value = 42 // useRef will receive the new value
 * ```
 * @eventProperty
 */
class ValueRef {
    /**
     *
     * @param _value - The internal value
     * @param isEqual - The comparer function
     */
    constructor(_value, isEqual = (a, b) => a === b) {
        this._value = _value;
        /** All watchers */
        this.watcher = new Set();
        this.isEqual = isEqual;
    }
    /** Get current value */
    get value() {
        return this._value;
    }
    set value(newVal) {
        const oldVal = this._value;
        if (this.isEqual(newVal, oldVal))
            return;
        this._value = newVal;
        for (const fn of this.watcher) {
            try {
                fn(newVal, oldVal);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    /**
     * Add a listener. This will return a remover.
     * @example
     * ```ts
     * React.useEffect(() => ref.addListener(setState))
     * ```
     */
    addListener(fn) {
        this.watcher.add(fn);
        return () => this.removeListener(fn);
    }
    /**
     * Remove a listener
     */
    removeListener(fn) {
        this.watcher.delete(fn);
    }
    /**
     * Remove all listeners
     */
    removeAllListener() {
        this.watcher = new Set();
    }
}
//# sourceMappingURL=ValueRef.js.map

/***/ }),

/***/ 150:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "d", function() { return /* reexport */ encodeText; });
__webpack_require__.d(__webpack_exports__, "b", function() { return /* reexport */ decodeText; });
__webpack_require__.d(__webpack_exports__, "a", function() { return /* reexport */ decodeArrayBuffer; });
__webpack_require__.d(__webpack_exports__, "c", function() { return /* reexport */ encodeArrayBuffer; });
__webpack_require__.d(__webpack_exports__, "e", function() { return /* reexport */ formatFileSize; });

// UNUSED EXPORTS: useQRCodeImageScan, useQueryParams, useRequestCamera, useVideoDevices, toArrayBuffer, concatArrayBuffer, isEuqals, getDimensionAsPNG, getDimensionAsJPEG, loadImage, memoizePromise, isMacPlatform, detectAudioSupport, detectVideoSupport, detectImageSupport

// EXTERNAL MODULE: ./node_modules/react/index.js
var react = __webpack_require__(1);

// EXTERNAL MODULE: ./node_modules/react-use/esm/useAsync.js
var useAsync = __webpack_require__(295);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/buffer.js
function encodeText(input) {
    return new TextEncoder().encode(input);
}
function decodeText(input) {
    return new TextDecoder().decode(input);
}
function decodeArrayBuffer(input) {
    const decoded = atob(input);
    const buffer = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
        buffer[i] = decoded.charCodeAt(i);
    }
    return buffer.buffer;
}
function encodeArrayBuffer(input) {
    let encoded = '';
    for (const code of new Uint8Array(input)) {
        encoded += String.fromCharCode(code);
    }
    return btoa(encoded);
}
function toArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('error', () => {
            reject(reader.error);
        });
        reader.addEventListener('load', () => {
            resolve(reader.result);
        });
        reader.readAsArrayBuffer(blob);
    });
}
function concatArrayBuffer(...parts) {
    return toArrayBuffer(new Blob(parts));
}
function isEuqals(a, b) {
    var _a;
    if (a instanceof ArrayBuffer) {
        a = new Uint8Array(a);
    }
    if (b instanceof ArrayBuffer) {
        b = new Uint8Array(b);
    }
    if (!(a instanceof Uint8Array)) {
        return false;
    }
    else if (!(b instanceof Uint8Array)) {
        return false;
    }
    else if (a.byteLength !== b.byteLength) {
        return false;
    }
    return (_a = a === b) !== null && _a !== void 0 ? _a : a.every((value, index) => b[index] === value);
}
//# sourceMappingURL=buffer.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/image.js

/* eslint-disable no-bitwise */
function getDimensionAsPNG(buf) {
    const view = new DataView(buf, 0, 28);
    return { width: view.getInt32(16), height: view.getInt32(20) };
}
/**
 * Get dimension of a JPEG image
 * @see http://vip.sugovica.hu/Sardi/kepnezo/JPEG%20File%20Layout%20and%20Format.htm
 */
function getDimensionAsJPEG(buf) {
    const MAGIC_1 = Uint8Array.of(0xff, 0xd8, 0xff, 0xe0);
    const MAGIC_2 = Uint8Array.of(0x4a, 0x46, 0x49, 0x46, 0x00);
    const view = new DataView(buf);
    let index = 0;
    if (!isEuqals(buf.slice(index, index + 4), MAGIC_1)) {
        return;
    }
    index += 4;
    if (!isEuqals(buf.slice(index + 2, index + 6), MAGIC_2)) {
        return;
    }
    let blockLength = view.getUint8(index) * 256 + view.getUint8(index + 1);
    while (index < view.byteLength) {
        index += blockLength;
        if (index >= view.byteLength)
            return;
        if (view.getUint8(index) !== 0xff)
            return;
        const marker = view.getUint8(index + 1); // SOF0 / SOF2 marker
        if (!(marker === 0xc0 || marker === 0xc2)) {
            index += 2;
            blockLength = view.getUint8(index) * 256 + view.getUint8(index + 1);
            continue;
        }
        return {
            height: view.getUint8(index + 5) * 256 + view.getUint8(index + 6),
            width: view.getUint8(index + 7) * 256 + view.getUint8(index + 8),
        };
    }
}
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const source = new Image();
        source.addEventListener('error', reject);
        source.addEventListener('load', () => {
            resolve(source);
        });
        source.src = src;
    });
}
//# sourceMappingURL=image.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/hooks/useQRCodeImageScan.js



function useQRCodeImageScan(image) {
    const scanner = Object(react["useRef"])(new BarcodeDetector({ formats: ['qr_code'] }));
    const [source, setSource] = Object(react["useState"])('');
    Object(react["useEffect"])(() => {
        const { current } = image;
        if (current === null) {
            setSource('');
            return;
        }
        const onLoad = () => {
            var _a, _b;
            setSource((_b = (_a = image.current) === null || _a === void 0 ? void 0 : _a.src) !== null && _b !== void 0 ? _b : '');
        };
        const onError = () => {
            setSource('');
        };
        current.addEventListener('load', onLoad);
        current.addEventListener('error', onError);
        return () => {
            current.removeEventListener('load', onLoad);
            current.removeEventListener('error', onLoad);
        };
    }, [image.current]);
    return Object(useAsync["a" /* default */])(async () => {
        const image = await loadImage(source);
        const detected = await scanner.current.detect(image);
        return detected === null || detected === void 0 ? void 0 : detected[0].rawValue;
    }, [source, scanner.current]);
}
//# sourceMappingURL=useQRCodeImageScan.js.map
// EXTERNAL MODULE: ./node_modules/react-router/esm/react-router.js
var react_router = __webpack_require__(76);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/hooks/useQueryParams.js

function useQueryParams(query) {
    const { search } = Object(react_router["i" /* useLocation */])();
    const result = {};
    const params = new URLSearchParams(search);
    query.forEach((name) => {
        result[name] = params.get(name);
    });
    return result;
}
//# sourceMappingURL=useQueryParams.js.map
// EXTERNAL MODULE: ./node_modules/lodash-es/lodash.js
var lodash = __webpack_require__(13);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/hooks/useRequestCamera.js



function useRequestCamera(needRequest) {
    const [state, setState] = Object(react["useState"])('prompt');
    const { loading, error, value } = Object(useAsync["a" /* default */])(async () => {
        if (!needRequest || state !== 'prompt')
            return;
        if (Object(lodash["hasIn"])(navigator.permissions, 'query')) {
            return navigator.permissions.query({ name: 'camera' });
        }
        else if (Object(lodash["hasIn"])(navigator.permissions, 'request')) {
            return navigator.permissions.request({ name: 'camera' });
        }
        else {
            setState('granted');
        }
    }, [needRequest, state]);
    Object(react["useEffect"])(() => {
        if (Object(lodash["isNil"])(value)) {
            return;
        }
        else if (error) {
            setState('granted');
            return;
        }
        const onChange = () => setState(value.state);
        value.addEventListener('change', onChange);
        return () => {
            value.removeEventListener('change', onChange);
        };
    }, [loading, error, value]);
    return state;
}
//# sourceMappingURL=useRequestCamera.js.map
// EXTERNAL MODULE: ./node_modules/react-use/esm/usePermission.js
var usePermission = __webpack_require__(1602);

// EXTERNAL MODULE: ./node_modules/react-use/esm/useMediaDevices.js
var useMediaDevices = __webpack_require__(1603);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/hooks/useVideoDevices.js


function useVideoDevices() {
    const state = Object(usePermission["a" /* default */])({ name: 'camera' });
    const { devices = [] } = Object(useMediaDevices["a" /* default */])();
    // we dispatch a fake event if permission changed
    // in order to fix the bug described in this issues
    // https://github.com/streamich/react-use/issues/1318
    Object(react["useEffect"])(() => {
        navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
    }, [state]);
    return devices.filter((d) => d.kind === 'videoinput');
}
//# sourceMappingURL=useVideoDevices.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/hooks/index.js




//# sourceMappingURL=index.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/platform.js
function isMacPlatform() {
    return /^Mac/.test(navigator.platform);
}
//# sourceMappingURL=platform.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/file.js

function formatFileSize(input = 0, si = isMacPlatform(), fractionDigits = 1) {
    if (input === 0 || Number.isNaN(input)) {
        return '0 B';
    }
    const units = ['', 'K', 'M', 'G', 'T', 'P'];
    const base = si ? 1000 : 0x400;
    const n = Math.min(Math.floor(Math.log(input) / Math.log(base)), units.length - 1);
    const value = input / Math.pow(base, n);
    const formatted = n === 0 ? value : value.toFixed(fractionDigits);
    return `${formatted} ${units[n]}${si ? '' : 'i'}B`;
}
//# sourceMappingURL=file.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/memoize.js

/**
 * The promise version of lodash-es/memoize
 * @param fn An async function
 * @param resolver If the function has 1 param, it can be undefined
 * as `x => x`. If it has more than 1 param, you must specify a function
 * to map the param the memoize key.
 */
function memoizePromise(fn, resolver) {
    if (resolver === undefined)
        resolver = ((x) => x);
    const memorizedFunction = Object(lodash["memoize"])(async function (...args) {
        try {
            // ? DO NOT remove "await" here
            return await fn(...args);
        }
        catch (e) {
            memorizedFunction.cache.delete(resolver(...args));
            throw e;
        }
    }, resolver);
    return memorizedFunction;
}
//# sourceMappingURL=memoize.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/detect.js
function detectAudioSupport(url) {
    return detectMediaSupport('audio', url);
}
function detectVideoSupport(url) {
    return detectMediaSupport('video', url);
}
function detectImageSupport(url) {
    return new Promise((resolve) => {
        const element = document.createElement('img');
        element.addEventListener('load', () => {
            resolve(true);
        });
        element.addEventListener('error', () => {
            resolve(false);
        });
        element.src = url;
    });
}
function detectMediaSupport(name, url) {
    return new Promise((resolve) => {
        const reject = () => resolve(false);
        const element = document.createElement(name);
        element.addEventListener('error', reject);
        element.addEventListener('abort', reject);
        element.addEventListener('loadedmetadata', () => resolve(true));
        element.src = url;
    });
}
//# sourceMappingURL=detect.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/kit/esm/index.js







//# sourceMappingURL=index.js.map

/***/ }),

/***/ 1535:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const grayscale_1 = __webpack_require__(562);
const transform_1 = __webpack_require__(654);
const image_1 = __webpack_require__(799);
const bit_1 = __webpack_require__(1538);
const position_1 = __webpack_require__(800);
const mask_1 = __webpack_require__(1539);
const helper_1 = __webpack_require__(395);
const locator_1 = __webpack_require__(612);
function encodeImg(imgData, maskData, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { text, size, narrow: narrowSize, copies, grayscaleAlgorithm, transformAlgorithm, exhaustPixels, } = options;
        const [width, height] = image_1.cropImg(imgData, options);
        const sizeOfBlocks = width * height * 3;
        const textBits = bit_1.str2bits(text, copies);
        const bits = bit_1.mergeBits(bit_1.createBits(exhaustPixels ? sizeOfBlocks : textBits.length + 8 * copies), textBits, bit_1.createBits(8 * copies).fill(1) // the end of message
        );
        if (textBits.length + 8 * copies > sizeOfBlocks) {
            process.stderr.write('bits overflow! try to shrink text or reduce copies.\n');
        }
        if (grayscaleAlgorithm !== grayscale_1.GrayscaleAlgorithm.NONE || narrowSize > 0) {
            image_1.updateImgByPixel(imgData, options, ([r, g, b, a], loc) => {
                if (!mask_1.isPixelVisibleAt(maskData, loc, options)) {
                    return [r, g, b, a];
                }
                // decolor
                if (grayscaleAlgorithm !== grayscale_1.GrayscaleAlgorithm.NONE) {
                    const y = grayscale_1.grayscale(r, g, b, grayscaleAlgorithm);
                    r = y;
                    g = y;
                    b = y;
                }
                // narrow color value
                if (narrowSize > 0) {
                    r = grayscale_1.narrow(r, narrowSize);
                    g = grayscale_1.narrow(g, narrowSize);
                    b = grayscale_1.narrow(b, narrowSize);
                }
                return [r, g, b, a];
            });
        }
        const acc = position_1.createAcc(options);
        const im = new Array(size * size);
        image_1.updateImgByBlock(imgData, options, (block, loc) => {
            if (!exhaustPixels && loc.b >= bits.length) {
                return false;
            }
            if (!mask_1.isBlockVisibleAt(maskData, loc, options)) {
                if (options.fakeMaskPixels && loc.c === 0) {
                    const [x, y] = locator_1.loc2coord(loc, options);
                    const g = helper_1.rand(10, 127);
                    image_1.updateImgByPixelAt(imgData, options, [g, g, g, 255], locator_1.loc2idx(loc, options, x, y, helper_1.rand(0, 64)));
                }
                return false;
            }
            transform_1.transform(block, im.fill(0), transformAlgorithm, options);
            bit_1.setBit(block, bits, acc, loc, options);
            transform_1.inverseTransform(block, im, transformAlgorithm, options);
            return true;
        });
        return imgData;
    });
}
exports.encodeImg = encodeImg;
function decodeImg(imgData, maskData, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { size, copies, transformAlgorithm } = options;
        const bits = [];
        const acc = position_1.createAcc(options);
        const im = new Array(size * size);
        image_1.visitImgByBlock(imgData, options, (block, loc) => {
            if (!mask_1.isBlockVisibleAt(maskData, loc, options)) {
                return false;
            }
            transform_1.transform(block, im.fill(0), transformAlgorithm, options);
            bits.push(bit_1.getBit(block, acc, loc, options));
            return true;
        });
        return bit_1.bits2str(bits, copies);
    });
}
exports.decodeImg = decodeImg;
//# sourceMappingURL=stego.js.map
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(95)))

/***/ }),

/***/ 1536:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/// fft.js
/**
 * Fast Fourier Transform module
 * 1D-FFT/IFFT, 2D-FFT/IFFT (radix-2)
 */
var FFT = {};
var version = {
    release: '0.3.0',
    date: '2013-03',
};
FFT.toString = function () {
    return 'version ' + version.release + ', released ' + version.date;
};
// core operations
var _n = 0, // order
_bitrev = null, // bit reversal table
_cstb = null; // sin/cos table
var core = {
    init: function (n) {
        if (n !== 0 && (n & (n - 1)) === 0) {
            _n = n;
            core._initArray();
            core._makeBitReversalTable();
            core._makeCosSinTable();
        }
        else {
            throw new Error('init: radix-2 required');
        }
    },
    // 1D-FFT
    fft1d: function (re, im) {
        core.fft(re, im, 1);
    },
    // 1D-IFFT
    ifft1d: function (re, im) {
        var n = 1 / _n;
        core.fft(re, im, -1);
        for (var i = 0; i < _n; i++) {
            re[i] *= n;
            im[i] *= n;
        }
    },
    // 2D-FFT
    fft2d: function (re, im) {
        var tre = [], tim = [], i = 0;
        // x-axis
        for (var y = 0; y < _n; y++) {
            i = y * _n;
            for (var x1 = 0; x1 < _n; x1++) {
                tre[x1] = re[x1 + i];
                tim[x1] = im[x1 + i];
            }
            core.fft1d(tre, tim);
            for (var x2 = 0; x2 < _n; x2++) {
                re[x2 + i] = tre[x2];
                im[x2 + i] = tim[x2];
            }
        }
        // y-axis
        for (var x = 0; x < _n; x++) {
            for (var y1 = 0; y1 < _n; y1++) {
                i = x + y1 * _n;
                tre[y1] = re[i];
                tim[y1] = im[i];
            }
            core.fft1d(tre, tim);
            for (var y2 = 0; y2 < _n; y2++) {
                i = x + y2 * _n;
                re[i] = tre[y2];
                im[i] = tim[y2];
            }
        }
    },
    // 2D-IFFT
    ifft2d: function (re, im) {
        var tre = [], tim = [], i = 0;
        // x-axis
        for (var y = 0; y < _n; y++) {
            i = y * _n;
            for (var x1 = 0; x1 < _n; x1++) {
                tre[x1] = re[x1 + i];
                tim[x1] = im[x1 + i];
            }
            core.ifft1d(tre, tim);
            for (var x2 = 0; x2 < _n; x2++) {
                re[x2 + i] = tre[x2];
                im[x2 + i] = tim[x2];
            }
        }
        // y-axis
        for (var x = 0; x < _n; x++) {
            for (var y1 = 0; y1 < _n; y1++) {
                i = x + y1 * _n;
                tre[y1] = re[i];
                tim[y1] = im[i];
            }
            core.ifft1d(tre, tim);
            for (var y2 = 0; y2 < _n; y2++) {
                i = x + y2 * _n;
                re[i] = tre[y2];
                im[i] = tim[y2];
            }
        }
    },
    // core operation of FFT
    fft: function (re, im, inv) {
        var d, h, ik, m, tmp, wr, wi, xr, xi, n4 = _n >> 2;
        // bit reversal
        for (var l = 0; l < _n; l++) {
            m = _bitrev[l];
            if (l < m) {
                tmp = re[l];
                re[l] = re[m];
                re[m] = tmp;
                tmp = im[l];
                im[l] = im[m];
                im[m] = tmp;
            }
        }
        // butterfly operation
        for (var k = 1; k < _n; k <<= 1) {
            h = 0;
            d = _n / (k << 1);
            for (var j = 0; j < k; j++) {
                wr = _cstb[h + n4];
                wi = inv * _cstb[h];
                for (var i = j; i < _n; i += k << 1) {
                    ik = i + k;
                    xr = wr * re[ik] + wi * im[ik];
                    xi = wr * im[ik] - wi * re[ik];
                    re[ik] = re[i] - xr;
                    re[i] += xr;
                    im[ik] = im[i] - xi;
                    im[i] += xi;
                }
                h += d;
            }
        }
    },
    // initialize the array (supports TypedArray)
    _initArray: function () {
        if (typeof Uint8Array !== 'undefined') {
            _bitrev = new Uint8Array(_n);
        }
        else {
            _bitrev = [];
        }
        if (typeof Float64Array !== 'undefined') {
            _cstb = new Float64Array(_n * 1.25);
        }
        else {
            _cstb = [];
        }
    },
    // zero padding
    _paddingZero: function () {
        // TODO
    },
    // makes bit reversal table
    _makeBitReversalTable: function () {
        var i = 0, j = 0, k = 0;
        _bitrev[0] = 0;
        while (++i < _n) {
            k = _n >> 1;
            while (k <= j) {
                j -= k;
                k >>= 1;
            }
            j += k;
            _bitrev[i] = j;
        }
    },
    // makes trigonometiric function table
    _makeCosSinTable: function () {
        var n2 = _n >> 1, n4 = _n >> 2, n8 = _n >> 3, n2p4 = n2 + n4, t = Math.sin(Math.PI / _n), dc = 2 * t * t, ds = Math.sqrt(dc * (2 - dc)), c = (_cstb[n4] = 1), s = (_cstb[0] = 0);
        t = 2 * dc;
        for (var i = 1; i < n8; i++) {
            c -= dc;
            dc += t * c;
            s += ds;
            ds -= t * s;
            _cstb[i] = s;
            _cstb[n4 - i] = c;
        }
        if (n8 !== 0) {
            _cstb[n8] = Math.sqrt(0.5);
        }
        for (var j = 0; j < n4; j++) {
            _cstb[n2 - j] = _cstb[j];
        }
        for (var k = 0; k < n2p4; k++) {
            _cstb[k + n2] = -_cstb[k];
        }
    },
};
// aliases (public APIs)
var apis = ['init', 'fft1d', 'ifft1d', 'fft2d', 'ifft2d'];
for (var i = 0; i < apis.length; i++) {
    FFT[apis[i]] = core[apis[i]];
}
FFT.fft = core.fft1d;
FFT.ifft = core.ifft1d;
exports.default = FFT;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 1537:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// MORE:
// https://en.wikipedia.org/wiki/JPEG
Object.defineProperty(exports, "__esModule", { value: true });
const ONE_SQUARE_ROOT_OF_TWO = 1 / Math.sqrt(2);
// type-II DCT
function dct(nums, size = 8) {
    const coefficients = [];
    for (let v = 0; v < size; v += 1) {
        for (let u = 0; u < size; u += 1) {
            const au = u === 0 ? ONE_SQUARE_ROOT_OF_TWO : 1;
            const av = v === 0 ? ONE_SQUARE_ROOT_OF_TWO : 1;
            let sum = 0;
            for (let y = 0; y < size; y += 1) {
                for (let x = 0; x < size; x += 1) {
                    sum +=
                        nums[y * size + x] *
                            Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                            Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }
            coefficients.push((sum * au * av) / 4);
        }
    }
    // in-place update
    for (let i = 0; i < coefficients.length; i += 1) {
        nums[i] = coefficients[i];
    }
}
exports.dct = dct;
// type-III DCT
function idct(coefficients, size = 8) {
    const nums = [];
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            let sum = 0;
            for (let v = 0; v < size; v += 1) {
                for (let u = 0; u < size; u += 1) {
                    const au = u === 0 ? ONE_SQUARE_ROOT_OF_TWO : 1;
                    const av = v === 0 ? ONE_SQUARE_ROOT_OF_TWO : 1;
                    sum +=
                        au *
                            av *
                            coefficients[v * size + u] *
                            Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
                            Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }
            nums.push(sum / 4);
        }
    }
    // in-place update
    for (let i = 0; i < nums.length; i += 1) {
        coefficients[i] = nums[i];
    }
}
exports.idct = idct;
exports.QUANTIZATION_MATRIX = [
    16,
    11,
    10,
    16,
    24,
    40,
    51,
    61,
    12,
    12,
    14,
    19,
    26,
    58,
    60,
    55,
    14,
    13,
    16,
    24,
    40,
    57,
    69,
    56,
    14,
    17,
    22,
    29,
    51,
    87,
    80,
    62,
    18,
    22,
    37,
    56,
    68,
    109,
    103,
    77,
    24,
    35,
    55,
    64,
    81,
    104,
    113,
    92,
    49,
    64,
    78,
    87,
    103,
    121,
    120,
    101,
    72,
    92,
    95,
    98,
    112,
    100,
    103,
    99,
];
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 1538:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const position_1 = __webpack_require__(800);
function str2bits(text, copies) {
    const chars = Array.from(text);
    const bits = [];
    const pushByte = (byte, n) => {
        for (let i = 0; i < 8; i += 1) {
            let j = 0;
            while (j++ < n) {
                bits.push(byte[i]);
            }
        }
    };
    for (let i = 0; i < chars.length; i += 1) {
        const codes = Array.from(encodeURI(chars[i]));
        for (let j = 0; j < codes.length; j += 1) {
            const byte = [];
            let reminder = 0;
            let code = codes[j].charCodeAt(0);
            do {
                reminder = (code % 2);
                byte.push(reminder);
                code = code - Math.floor(code / 2) - reminder;
            } while (code > 1);
            byte.push(code);
            while (byte.length < 8) {
                byte.push(0);
            }
            pushByte(byte.reverse(), copies);
        }
    }
    return bits;
}
exports.str2bits = str2bits;
function bits2str(bits, copies) {
    let k = 128;
    let temp = 0;
    const chars = [];
    const candidates = [];
    const elect = () => candidates.filter(c => c === 1).length >= copies / 2 ? 1 : 0;
    for (let i = 0; i < bits.length; i += 1) {
        candidates.push(bits[i]);
        if (candidates.length === copies) {
            temp += elect() * k;
            k /= 2;
            candidates.length = 0;
            // end of message
            if (temp === 255) {
                break;
            }
            if (k < 1) {
                chars.push(String.fromCharCode(temp));
                temp = 0;
                k = 128;
            }
        }
    }
    try {
        return decodeURI(chars.join(''));
    }
    catch (e) {
        return '';
    }
}
exports.bits2str = bits2str;
function mergeBits(dest, ...src) {
    let k = 0;
    for (let i = 0; i < src.length; i += 1) {
        const bits = src[i];
        for (let j = 0; j < bits.length && k < dest.length; j += 1, k += 1) {
            dest[k] = bits[j];
        }
    }
    return dest;
}
exports.mergeBits = mergeBits;
function createBits(size) {
    const bits = new Array(size).fill(0);
    for (let i = 0; i < size; i += 1) {
        bits[i] = Math.floor(Math.random() * 2);
    }
    return bits;
}
exports.createBits = createBits;
function getBit(block, acc, loc, options) {
    const pos = position_1.getPos(acc, loc, options);
    const { tolerance } = options;
    return Math.abs(Math.round(block[pos] / tolerance) % 2);
}
exports.getBit = getBit;
function setBit(block, bits, acc, loc, options) {
    const pos = position_1.getPos(acc, loc, options);
    const { tolerance } = options;
    const v = Math.floor(block[pos] / tolerance);
    if (bits[loc.b]) {
        block[pos] = v % 2 === 1 ? v * tolerance : (v + 1) * tolerance;
    }
    else {
        block[pos] = v % 2 === 1 ? (v - 1) * tolerance : v * tolerance;
    }
}
exports.setBit = setBit;
//# sourceMappingURL=bit.js.map

/***/ }),

/***/ 1539:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const locator_1 = __webpack_require__(612);
function isBlockVisibleAt({ data }, loc, options) {
    const { size } = options;
    const _loc = Object.assign(Object.assign({}, loc), { c: 0 });
    const [x1, y1] = locator_1.loc2coord(_loc, options);
    for (let i = 0; i < size * size; i += 1) {
        const value = data[locator_1.loc2idx(_loc, options, x1, y1, i)];
        if (typeof value !== 'undefined' && value < 127) {
            return false;
        }
    }
    return true;
}
exports.isBlockVisibleAt = isBlockVisibleAt;
function isPixelVisibleAt({ data }, loc, options) {
    return typeof data[loc] === 'undefined' || data[loc] > 127;
}
exports.isPixelVisibleAt = isPixelVisibleAt;
//# sourceMappingURL=mask.js.map

/***/ }),

/***/ 1540:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = __webpack_require__(395);
function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
exports.createCanvas = createCanvas;
function buf2Img(imgBuf) {
    const url = URL.createObjectURL(new Blob([imgBuf], { type: helper_1.imgType(new Uint8Array(imgBuf)) }));
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const { width, height } = image;
            const ctx = createCanvas(width, height).getContext('2d');
            ctx.drawImage(image, 0, 0, width, height);
            resolve(ctx.getImageData(0, 0, width, height));
        };
        image.onerror = err => reject(err);
        image.src = url;
    });
}
exports.buf2Img = buf2Img;
function img2Buf(imgData, width = imgData.width, height = imgData.height) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imgData, 0, 0, 0, 0, width, height);
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
        if (blob) {
            const fileReader = new FileReader();
            fileReader.onload = ({ target }) => {
                if (target) {
                    resolve(target.result);
                }
                else {
                    reject(new Error('fail to generate array buffer'));
                }
            };
            fileReader.onerror = err => reject(err);
            fileReader.readAsArrayBuffer(blob);
        }
        else {
            reject(new Error('fail to generate array buffer'));
        }
    }, 'image/png'));
}
exports.img2Buf = img2Buf;
//# sourceMappingURL=dom.js.map

/***/ }),

/***/ 1575:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const stego_1 = __webpack_require__(1535);
const dom_1 = __webpack_require__(1540);
const image_1 = __webpack_require__(799);
function encode(imgBuf, maskBuf, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const [imgData, maskData] = yield Promise.all([
            dom_1.buf2Img(imgBuf),
            dom_1.buf2Img(maskBuf),
        ]);
        const { cropEdgePixels } = options;
        const { width, height } = imgData;
        const [cropWidth, cropHeight] = image_1.cropImg(imgData, options);
        return dom_1.img2Buf(yield stego_1.encodeImg(imgData, maskData, options), cropEdgePixels ? cropWidth : width, cropEdgePixels ? cropHeight : height);
    });
}
exports.encode = encode;
function decode(imgBuf, maskBuf, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const [imgData, maskData] = yield Promise.all([
            dom_1.buf2Img(imgBuf),
            dom_1.buf2Img(maskBuf),
        ]);
        return stego_1.decodeImg(imgData, maskData, options);
    });
}
exports.decode = decode;
//# sourceMappingURL=dom.js.map

/***/ }),

/***/ 279:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ Watcher_Watcher; });

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Proxy.js + 1 modules
var Proxy = __webpack_require__(377);

// EXTERNAL MODULE: ./node_modules/@servie/events/dist/index.js
var dist = __webpack_require__(199);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/util/requestIdleCallback.js
/**
 * @internal
 * @param fn function to execute
 * @param timeout timeout
 */
function requestIdleCallback(fn, timeout) {
    if ('requestIdleCallback' in window) {
        return window.requestIdleCallback(fn);
    }
    const start = Date.now();
    return setTimeout(() => {
        fn({
            didTimeout: false,
            timeRemaining: function () {
                return Math.max(0, 50 - (Date.now() - start));
            },
        });
    }, 1);
}
//# sourceMappingURL=requestIdleCallback.js.map
// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_freeGlobal.js
var _freeGlobal = __webpack_require__(831);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_root.js


/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = _freeGlobal["a" /* default */] || freeSelf || Function('return this')();

/* harmony default export */ var _root = (root);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_Symbol.js


/** Built-in value references. */
var _Symbol_Symbol = _root.Symbol;

/* harmony default export */ var _Symbol = (_Symbol_Symbol);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_getRawTag.js


/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var _getRawTag_hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = _getRawTag_hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/* harmony default export */ var _getRawTag = (getRawTag);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_objectToString.js
/** Used for built-in method references. */
var _objectToString_objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var _objectToString_nativeObjectToString = _objectToString_objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return _objectToString_nativeObjectToString.call(value);
}

/* harmony default export */ var _objectToString = (objectToString);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseGetTag.js




/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var _baseGetTag_symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (_baseGetTag_symToStringTag && _baseGetTag_symToStringTag in Object(value))
    ? _getRawTag(value)
    : _objectToString(value);
}

/* harmony default export */ var _baseGetTag = (baseGetTag);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/isObject.js
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/* harmony default export */ var lodash_es_isObject = (isObject);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/isFunction.js



/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!lodash_es_isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = _baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/* harmony default export */ var lodash_es_isFunction = (isFunction);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_coreJsData.js


/** Used to detect overreaching core-js shims. */
var coreJsData = _root['__core-js_shared__'];

/* harmony default export */ var _coreJsData = (coreJsData);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_isMasked.js


/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/* harmony default export */ var _isMasked = (isMasked);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_toSource.js
/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/* harmony default export */ var _toSource = (toSource);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseIsNative.js





/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var _baseIsNative_funcProto = Function.prototype,
    _baseIsNative_objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var _baseIsNative_funcToString = _baseIsNative_funcProto.toString;

/** Used to check objects for own properties. */
var _baseIsNative_hasOwnProperty = _baseIsNative_objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  _baseIsNative_funcToString.call(_baseIsNative_hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!lodash_es_isObject(value) || _isMasked(value)) {
    return false;
  }
  var pattern = lodash_es_isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(_toSource(value));
}

/* harmony default export */ var _baseIsNative = (baseIsNative);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_getValue.js
/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/* harmony default export */ var _getValue = (getValue);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_getNative.js



/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = _getValue(object, key);
  return _baseIsNative(value) ? value : undefined;
}

/* harmony default export */ var _getNative = (getNative);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_nativeCreate.js


/* Built-in method references that are verified to be native. */
var nativeCreate = _getNative(Object, 'create');

/* harmony default export */ var _nativeCreate = (nativeCreate);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_hashClear.js


/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
  this.size = 0;
}

/* harmony default export */ var _hashClear = (hashClear);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_hashDelete.js
/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

/* harmony default export */ var _hashDelete = (hashDelete);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_hashGet.js


/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var _hashGet_objectProto = Object.prototype;

/** Used to check objects for own properties. */
var _hashGet_hasOwnProperty = _hashGet_objectProto.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (_nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return _hashGet_hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/* harmony default export */ var _hashGet = (hashGet);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_hashHas.js


/** Used for built-in method references. */
var _hashHas_objectProto = Object.prototype;

/** Used to check objects for own properties. */
var _hashHas_hasOwnProperty = _hashHas_objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return _nativeCreate ? (data[key] !== undefined) : _hashHas_hasOwnProperty.call(data, key);
}

/* harmony default export */ var _hashHas = (hashHas);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_hashSet.js


/** Used to stand-in for `undefined` hash values. */
var _hashSet_HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (_nativeCreate && value === undefined) ? _hashSet_HASH_UNDEFINED : value;
  return this;
}

/* harmony default export */ var _hashSet = (hashSet);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_Hash.js






/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = _hashClear;
Hash.prototype['delete'] = _hashDelete;
Hash.prototype.get = _hashGet;
Hash.prototype.has = _hashHas;
Hash.prototype.set = _hashSet;

/* harmony default export */ var _Hash = (Hash);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_listCacheClear.js
/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

/* harmony default export */ var _listCacheClear = (listCacheClear);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/eq.js
/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/* harmony default export */ var lodash_es_eq = (eq);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_assocIndexOf.js


/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (lodash_es_eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/* harmony default export */ var _assocIndexOf = (assocIndexOf);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_listCacheDelete.js


/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

/* harmony default export */ var _listCacheDelete = (listCacheDelete);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_listCacheGet.js


/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/* harmony default export */ var _listCacheGet = (listCacheGet);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_listCacheHas.js


/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return _assocIndexOf(this.__data__, key) > -1;
}

/* harmony default export */ var _listCacheHas = (listCacheHas);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_listCacheSet.js


/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = _assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

/* harmony default export */ var _listCacheSet = (listCacheSet);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_ListCache.js






/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = _listCacheClear;
ListCache.prototype['delete'] = _listCacheDelete;
ListCache.prototype.get = _listCacheGet;
ListCache.prototype.has = _listCacheHas;
ListCache.prototype.set = _listCacheSet;

/* harmony default export */ var _ListCache = (ListCache);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_Map.js



/* Built-in method references that are verified to be native. */
var _Map_Map = _getNative(_root, 'Map');

/* harmony default export */ var _Map = (_Map_Map);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_mapCacheClear.js




/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new _Hash,
    'map': new (_Map || _ListCache),
    'string': new _Hash
  };
}

/* harmony default export */ var _mapCacheClear = (mapCacheClear);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_isKeyable.js
/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/* harmony default export */ var _isKeyable = (isKeyable);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_getMapData.js


/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return _isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/* harmony default export */ var _getMapData = (getMapData);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_mapCacheDelete.js


/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = _getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

/* harmony default export */ var _mapCacheDelete = (mapCacheDelete);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_mapCacheGet.js


/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return _getMapData(this, key).get(key);
}

/* harmony default export */ var _mapCacheGet = (mapCacheGet);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_mapCacheHas.js


/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return _getMapData(this, key).has(key);
}

/* harmony default export */ var _mapCacheHas = (mapCacheHas);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_mapCacheSet.js


/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = _getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

/* harmony default export */ var _mapCacheSet = (mapCacheSet);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_MapCache.js






/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = _mapCacheClear;
MapCache.prototype['delete'] = _mapCacheDelete;
MapCache.prototype.get = _mapCacheGet;
MapCache.prototype.has = _mapCacheHas;
MapCache.prototype.set = _mapCacheSet;

/* harmony default export */ var _MapCache = (MapCache);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_setCacheAdd.js
/** Used to stand-in for `undefined` hash values. */
var _setCacheAdd_HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, _setCacheAdd_HASH_UNDEFINED);
  return this;
}

/* harmony default export */ var _setCacheAdd = (setCacheAdd);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_setCacheHas.js
/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

/* harmony default export */ var _setCacheHas = (setCacheHas);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_SetCache.js




/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new _MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = _setCacheAdd;
SetCache.prototype.has = _setCacheHas;

/* harmony default export */ var _SetCache = (SetCache);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseFindIndex.js
/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

/* harmony default export */ var _baseFindIndex = (baseFindIndex);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseIsNaN.js
/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

/* harmony default export */ var _baseIsNaN = (baseIsNaN);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_strictIndexOf.js
/**
 * A specialized version of `_.indexOf` which performs strict equality
 * comparisons of values, i.e. `===`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function strictIndexOf(array, value, fromIndex) {
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

/* harmony default export */ var _strictIndexOf = (strictIndexOf);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseIndexOf.js




/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  return value === value
    ? _strictIndexOf(array, value, fromIndex)
    : _baseFindIndex(array, _baseIsNaN, fromIndex);
}

/* harmony default export */ var _baseIndexOf = (baseIndexOf);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_arrayIncludes.js


/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes(array, value) {
  var length = array == null ? 0 : array.length;
  return !!length && _baseIndexOf(array, value, 0) > -1;
}

/* harmony default export */ var _arrayIncludes = (arrayIncludes);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_arrayIncludesWith.js
/**
 * This function is like `arrayIncludes` except that it accepts a comparator.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @param {Function} comparator The comparator invoked per element.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludesWith(array, value, comparator) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (comparator(value, array[index])) {
      return true;
    }
  }
  return false;
}

/* harmony default export */ var _arrayIncludesWith = (arrayIncludesWith);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_cacheHas.js
/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

/* harmony default export */ var _cacheHas = (cacheHas);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_Set.js



/* Built-in method references that are verified to be native. */
var Set = _getNative(_root, 'Set');

/* harmony default export */ var _Set = (Set);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/noop.js
/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */
function noop() {
  // No operation performed.
}

/* harmony default export */ var lodash_es_noop = (noop);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_setToArray.js
/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

/* harmony default export */ var _setToArray = (setToArray);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_createSet.js




/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Creates a set object of `values`.
 *
 * @private
 * @param {Array} values The values to add to the set.
 * @returns {Object} Returns the new set.
 */
var createSet = !(_Set && (1 / _setToArray(new _Set([,-0]))[1]) == INFINITY) ? lodash_es_noop : function(values) {
  return new _Set(values);
};

/* harmony default export */ var _createSet = (createSet);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseUniq.js







/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of `_.uniqBy` without support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new duplicate free array.
 */
function baseUniq(array, iteratee, comparator) {
  var index = -1,
      includes = _arrayIncludes,
      length = array.length,
      isCommon = true,
      result = [],
      seen = result;

  if (comparator) {
    isCommon = false;
    includes = _arrayIncludesWith;
  }
  else if (length >= LARGE_ARRAY_SIZE) {
    var set = iteratee ? null : _createSet(array);
    if (set) {
      return _setToArray(set);
    }
    isCommon = false;
    includes = _cacheHas;
    seen = new _SetCache;
  }
  else {
    seen = iteratee ? [] : result;
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = (comparator || value !== 0) ? value : 0;
    if (isCommon && computed === computed) {
      var seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === computed) {
          continue outer;
        }
      }
      if (iteratee) {
        seen.push(computed);
      }
      result.push(value);
    }
    else if (!includes(seen, computed, comparator)) {
      if (seen !== result) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

/* harmony default export */ var _baseUniq = (baseUniq);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/uniqWith.js


/**
 * This method is like `_.uniq` except that it accepts `comparator` which
 * is invoked to compare elements of `array`. The order of result values is
 * determined by the order they occur in the array.The comparator is invoked
 * with two arguments: (arrVal, othVal).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new duplicate free array.
 * @example
 *
 * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }, { 'x': 1, 'y': 2 }];
 *
 * _.uniqWith(objects, _.isEqual);
 * // => [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }]
 */
function uniqWith(array, comparator) {
  comparator = typeof comparator == 'function' ? comparator : undefined;
  return (array && array.length) ? _baseUniq(array, undefined, comparator) : [];
}

/* harmony default export */ var lodash_es_uniqWith = (uniqWith);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_arrayMap.js
/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/* harmony default export */ var _arrayMap = (arrayMap);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseUnary.js
/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/* harmony default export */ var _baseUnary = (baseUnary);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseDifference.js







/** Used as the size to enable large array optimizations. */
var _baseDifference_LARGE_ARRAY_SIZE = 200;

/**
 * The base implementation of methods like `_.difference` without support
 * for excluding multiple arrays or iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values, iteratee, comparator) {
  var index = -1,
      includes = _arrayIncludes,
      isCommon = true,
      length = array.length,
      result = [],
      valuesLength = values.length;

  if (!length) {
    return result;
  }
  if (iteratee) {
    values = _arrayMap(values, _baseUnary(iteratee));
  }
  if (comparator) {
    includes = _arrayIncludesWith;
    isCommon = false;
  }
  else if (values.length >= _baseDifference_LARGE_ARRAY_SIZE) {
    includes = _cacheHas;
    isCommon = false;
    values = new _SetCache(values);
  }
  outer:
  while (++index < length) {
    var value = array[index],
        computed = iteratee == null ? value : iteratee(value);

    value = (comparator || value !== 0) ? value : 0;
    if (isCommon && computed === computed) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === computed) {
          continue outer;
        }
      }
      result.push(value);
    }
    else if (!includes(values, computed, comparator)) {
      result.push(value);
    }
  }
  return result;
}

/* harmony default export */ var _baseDifference = (baseDifference);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_arrayPush.js
/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/* harmony default export */ var _arrayPush = (arrayPush);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/isObjectLike.js
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/* harmony default export */ var lodash_es_isObjectLike = (isObjectLike);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseIsArguments.js



/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return lodash_es_isObjectLike(value) && _baseGetTag(value) == argsTag;
}

/* harmony default export */ var _baseIsArguments = (baseIsArguments);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/isArguments.js



/** Used for built-in method references. */
var isArguments_objectProto = Object.prototype;

/** Used to check objects for own properties. */
var isArguments_hasOwnProperty = isArguments_objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = isArguments_objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
  return lodash_es_isObjectLike(value) && isArguments_hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

/* harmony default export */ var lodash_es_isArguments = (isArguments);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/isArray.js
/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/* harmony default export */ var lodash_es_isArray = (isArray);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_isFlattenable.js




/** Built-in value references. */
var spreadableSymbol = _Symbol ? _Symbol.isConcatSpreadable : undefined;

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable(value) {
  return lodash_es_isArray(value) || lodash_es_isArguments(value) ||
    !!(spreadableSymbol && value && value[spreadableSymbol]);
}

/* harmony default export */ var _isFlattenable = (isFlattenable);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseFlatten.js



/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;

  predicate || (predicate = _isFlattenable);
  result || (result = []);

  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        _arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

/* harmony default export */ var _baseFlatten = (baseFlatten);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/identity.js
/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

/* harmony default export */ var lodash_es_identity = (identity);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_apply.js
/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/* harmony default export */ var _apply = (apply);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_overRest.js


/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return _apply(func, this, otherArgs);
  };
}

/* harmony default export */ var _overRest = (overRest);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/constant.js
/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

/* harmony default export */ var lodash_es_constant = (constant);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_defineProperty.js


var defineProperty = (function() {
  try {
    var func = _getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

/* harmony default export */ var _defineProperty = (defineProperty);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseSetToString.js




/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !_defineProperty ? lodash_es_identity : function(func, string) {
  return _defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': lodash_es_constant(string),
    'writable': true
  });
};

/* harmony default export */ var _baseSetToString = (baseSetToString);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_shortOut.js
/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

/* harmony default export */ var _shortOut = (shortOut);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_setToString.js



/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = _shortOut(_baseSetToString);

/* harmony default export */ var _setToString = (setToString);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseRest.js




/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return _setToString(_overRest(func, start, lodash_es_identity), func + '');
}

/* harmony default export */ var _baseRest = (baseRest);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/isLength.js
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/* harmony default export */ var lodash_es_isLength = (isLength);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/isArrayLike.js



/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && lodash_es_isLength(value.length) && !lodash_es_isFunction(value);
}

/* harmony default export */ var lodash_es_isArrayLike = (isArrayLike);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/isArrayLikeObject.js



/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return lodash_es_isObjectLike(value) && lodash_es_isArrayLike(value);
}

/* harmony default export */ var lodash_es_isArrayLikeObject = (isArrayLikeObject);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/last.js
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array == null ? 0 : array.length;
  return length ? array[length - 1] : undefined;
}

/* harmony default export */ var lodash_es_last = (last);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/differenceWith.js






/**
 * This method is like `_.difference` except that it accepts `comparator`
 * which is invoked to compare elements of `array` to `values`. The order and
 * references of result values are determined by the first array. The comparator
 * is invoked with two arguments: (arrVal, othVal).
 *
 * **Note:** Unlike `_.pullAllWith`, this method returns a new array.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {...Array} [values] The values to exclude.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 * @example
 *
 * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
 *
 * _.differenceWith(objects, [{ 'x': 1, 'y': 2 }], _.isEqual);
 * // => [{ 'x': 2, 'y': 1 }]
 */
var differenceWith = _baseRest(function(array, values) {
  var comparator = lodash_es_last(values);
  if (lodash_es_isArrayLikeObject(comparator)) {
    comparator = undefined;
  }
  return lodash_es_isArrayLikeObject(array)
    ? _baseDifference(array, _baseFlatten(values, 1, lodash_es_isArrayLikeObject, true), undefined, comparator)
    : [];
});

/* harmony default export */ var lodash_es_differenceWith = (differenceWith);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_baseIntersection.js







/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMin = Math.min;

/**
 * The base implementation of methods like `_.intersection`, without support
 * for iteratee shorthands, that accepts an array of arrays to inspect.
 *
 * @private
 * @param {Array} arrays The arrays to inspect.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of shared values.
 */
function baseIntersection(arrays, iteratee, comparator) {
  var includes = comparator ? _arrayIncludesWith : _arrayIncludes,
      length = arrays[0].length,
      othLength = arrays.length,
      othIndex = othLength,
      caches = Array(othLength),
      maxLength = Infinity,
      result = [];

  while (othIndex--) {
    var array = arrays[othIndex];
    if (othIndex && iteratee) {
      array = _arrayMap(array, _baseUnary(iteratee));
    }
    maxLength = nativeMin(array.length, maxLength);
    caches[othIndex] = !comparator && (iteratee || (length >= 120 && array.length >= 120))
      ? new _SetCache(othIndex && array)
      : undefined;
  }
  array = arrays[0];

  var index = -1,
      seen = caches[0];

  outer:
  while (++index < length && result.length < maxLength) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = (comparator || value !== 0) ? value : 0;
    if (!(seen
          ? _cacheHas(seen, computed)
          : includes(result, computed, comparator)
        )) {
      othIndex = othLength;
      while (--othIndex) {
        var cache = caches[othIndex];
        if (!(cache
              ? _cacheHas(cache, computed)
              : includes(arrays[othIndex], computed, comparator))
            ) {
          continue outer;
        }
      }
      if (seen) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  return result;
}

/* harmony default export */ var _baseIntersection = (baseIntersection);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/_castArrayLikeObject.js


/**
 * Casts `value` to an empty array if it's not an array like object.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Array|Object} Returns the cast array-like object.
 */
function castArrayLikeObject(value) {
  return lodash_es_isArrayLikeObject(value) ? value : [];
}

/* harmony default export */ var _castArrayLikeObject = (castArrayLikeObject);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/intersectionWith.js






/**
 * This method is like `_.intersection` except that it accepts `comparator`
 * which is invoked to compare elements of `arrays`. The order and references
 * of result values are determined by the first array. The comparator is
 * invoked with two arguments: (arrVal, othVal).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Array
 * @param {...Array} [arrays] The arrays to inspect.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of intersecting values.
 * @example
 *
 * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
 * var others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];
 *
 * _.intersectionWith(objects, others, _.isEqual);
 * // => [{ 'x': 1, 'y': 2 }]
 */
var intersectionWith = _baseRest(function(arrays) {
  var comparator = lodash_es_last(arrays),
      mapped = _arrayMap(arrays, _castArrayLikeObject);

  comparator = typeof comparator == 'function' ? comparator : undefined;
  if (comparator) {
    mapped.pop();
  }
  return (mapped.length && mapped[0] === arrays[0])
    ? _baseIntersection(mapped, undefined, comparator)
    : [];
});

/* harmony default export */ var lodash_es_intersectionWith = (intersectionWith);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/lodash-es/isNil.js
/**
 * Checks if `value` is `null` or `undefined`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is nullish, else `false`.
 * @example
 *
 * _.isNil(null);
 * // => true
 *
 * _.isNil(void 0);
 * // => true
 *
 * _.isNil(NaN);
 * // => false
 */
function isNil_isNil(value) {
  return value == null;
}

/* harmony default export */ var lodash_es_isNil = (isNil_isNil);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/util/sleep.js
var sleep = __webpack_require__(383);

// EXTERNAL MODULE: ./node_modules/jsx-jsonml-devtools-renderer/out/index.js
var out = __webpack_require__(24);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Debuggers/LiveSelectorDevtoolsEnhancer.js
var LiveSelectorDevtoolsEnhancer = __webpack_require__(506);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Debuggers/WatcherDevtoolsEnhancer.js



const WatcherMapNotReady = Symbol('Not available now (WatcherMapNotReady)');
const initState = (obj) => {
    const everythingMap = new Map();
    const newMap = new Map([[WatcherMapNotReady, 0]]);
    const removedMap = new Map([[WatcherMapNotReady, 0]]);
    const priv = WatcherDevtoolsEnhancer_WatcherDevtoolsEnhancer.prototype.getPrivateItems(obj);
    const find = priv.findNodeFromListByKey(priv.lastNodeList, priv.lastKeyList);
    priv.lastKeyList.forEach(key => {
        everythingMap.set(key, {
            value: find(key),
            DOMProxy: priv.lastDOMProxyMap.get(key),
            hooks: priv.lastCallbackMap.get(key),
        });
    });
    obj.on('onIteration', iter => {
        const priv = WatcherDevtoolsEnhancer_WatcherDevtoolsEnhancer.prototype.getPrivateItems(obj);
        everythingMap.clear();
        newMap.clear();
        removedMap.clear();
        Array.from(iter.current.entries()).forEach(([key, value]) => {
            everythingMap.set(key, {
                value,
                DOMProxy: priv.lastDOMProxyMap.get(key),
                hooks: priv.lastCallbackMap.get(key),
            });
        });
        iter.new.forEach((v, k) => newMap.set(v, k));
        iter.removed.forEach((v, k) => removedMap.set(v, k));
    });
    return {
        refreshed: false,
        everything: everythingMap,
        new: newMap,
        removed: removedMap,
    };
};
class WatcherDevtoolsEnhancer_WatcherDevtoolsEnhancer {
    header(obj) {
        if (obj instanceof Watcher_Watcher) {
            const [state] = out["useState"](obj, initState);
            const watcher = this.getPrivateItems(obj);
            const ls = LiveSelectorDevtoolsEnhancer["a" /* LiveSelectorDevtoolsEnhancer */].getPrivateItems(watcher.liveSelector);
            return (out["createElement"]("span", null,
                obj.constructor.name,
                out["createElement"]("code", { variant: ['fade'] }, ls.single ? ' (SingleMode)' : null),
                out["createElement"]("code", { variant: ['bigint'] }, watcher.isWatching ? ' Running' : ' Not running'),
                state.refreshed ? this.body(obj) : null));
        }
        return null;
    }
    hasBody(obj) {
        if (obj instanceof Watcher_Watcher) {
            const [state, setState] = out["useState"](obj, initState);
            if (state.refreshed === true) {
                setState({ refreshed: false });
                return false;
            }
            return true;
        }
        return false;
    }
    body(obj) {
        const [state, setState, forceRender] = out["useState"](obj, initState);
        const priv = this.getPrivateItems(obj);
        const test = Symbol('used to test equality');
        const valueTag = 'Values';
        const removeTag = 'Removed in the last check';
        const newTag = 'New in the last check';
        const refresh = () => {
            setState({ refreshed: true });
            forceRender();
        };
        function isNil(x) {
            if (x === null || x === undefined)
                return false;
            return true;
        }
        return (out["createElement"]("div", null,
            out["createElement"]("span", { variant: ['fade'] }, "Last values:"),
            out["createElement"]("table", null,
                this.dataDisplayRow(valueTag, state.everything),
                state.removed.has(WatcherMapNotReady) ? null : this.dataDisplayRow(removeTag, state.removed),
                state.new.has(WatcherMapNotReady) ? null : this.dataDisplayRow(newTag, state.new)),
            out["createElement"]("br", null),
            out["createElement"]("span", { variant: ['fade'] }, "Other:"),
            out["createElement"]("table", null,
                this.optionsRow('LiveSelector', priv.liveSelector, () => false),
                this.optionsRow('ConsistentWatchRoot', priv.consistentWatchRoot, x => x === document.body || isNil(x)),
                this.optionsRow('DomProxyOptions', priv.domProxyOption, x => Object.keys(x).length === 0),
                this.optionsRow('KeyComparer', priv.keyComparer, x => x(test, test)),
                this.optionsRow('ValueComparer', priv.valueComparer, x => x(test, test)),
                this.optionsRow('MapNodeToKey', priv.mapNodeToKey, x => x(test, 0, []) === test),
                this.optionsRow('FirstDOMProxy', obj.firstDOMProxy, x => true),
                this.optionsRow('stopWatchOnDisconnected', priv.stopWatchOnDisconnected, isNil)),
            out["createElement"]("br", null),
            out["createElement"]("div", { variant: ['bigint'] }, "Actions:"),
            out["createElement"]("div", { onClick: () => console.log(priv.stack) }, "\uD83D\uDC40 See who created this Watcher"),
            out["createElement"]("div", { onClick: refresh }, "\uD83D\uDD03 Refresh the data"),
            out["createElement"]("div", { onClick: () => {
                    // @ts-ignore
                    obj.watcherChecker();
                    setTimeout(refresh, 50);
                } }, "\uD83D\uDD28 Manually run the watcher's checker")));
    }
    optionsRow(name, object, isEmpty) {
        try {
            if (isEmpty(object))
                return null;
        }
        catch (_a) { }
        return (out["createElement"]("tr", null,
            out["createElement"]("td", { variant: ['propertyName'] }, name),
            out["createElement"]("td", null,
                out["createElement"]("object", { object: object }))));
    }
    dataDisplayRow(name, object) {
        return (out["createElement"]("tr", null,
            out["createElement"]("td", { style: { float: 'right' }, variant: ['propertyName'] }, name),
            out["createElement"]("td", null,
                out["createElement"]("object", { object: object }))));
    }
    getPrivateItems(obj) {
        return {
            // @ts-ignore
            liveSelector: obj.liveSelector,
            // @ts-ignore
            isWatching: obj.isWatching,
            // @ts-ignore
            consistentWatchRoot: obj.consistentWatchRoot,
            // @ts-ignore
            domProxyOption: obj.domProxyOption,
            // @ts-ignore
            keyComparer: obj.keyComparer,
            // @ts-ignore
            valueComparer: obj.valueComparer,
            // @ts-ignore
            mapNodeToKey: obj.mapNodeToKey,
            // @ts-ignore
            lastCallbackMap: obj.lastCallbackMap,
            // @ts-ignore
            lastDOMProxyMap: obj.lastDOMProxyMap,
            // @ts-ignore
            lastKeyList: obj.lastKeyList,
            // @ts-ignore
            lastNodeList: obj.lastNodeList,
            // @ts-ignore
            liveSelector: obj.liveSelector,
            // @ts-ignore
            singleModeHasLastValue: obj.singleModeHasLastValue,
            // @ts-ignore
            singleModeLastValue: obj.singleModeLastValue,
            // @ts-ignore
            singleModeCallback: obj.singleModeCallback,
            // @ts-ignore
            stack: obj.stack,
            // @ts-ignore
            findNodeFromListByKey: obj.findNodeFromListByKey,
            // @ts-ignore
            stopWatchOnDisconnected: obj.stopWatchOnDisconnected,
        };
    }
}
//# sourceMappingURL=WatcherDevtoolsEnhancer.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Watcher.js
/**
 * WatcherClass provides an abstract implementation of a watcher to the LiveSelector
 *
 * You should extend it and implement your own watch logic.
 *
 * Built-in watcher:
 *
 * - Mutation Observer watcher (based on MutationObserver api, watch DOM changes)
 * - Interval watcher (based on time interval)
 * - Event watcher (based on addEventListener)
 */







/**
 * Use LiveSelector to watch dom change
 */
class Watcher_Watcher extends dist["Emitter"] {
    constructor(liveSelector) {
        var _a;
        super();
        /** Is the watcher running */
        this.isWatching = false;
        //#endregion
        //#region Multiple mode
        /** Found key list of last watch */
        this.lastKeyList = [];
        /** Found Node list of last watch */
        this.lastNodeList = [];
        /** Saved callback map of last watch */
        this.lastCallbackMap = new Map();
        /** Saved DOMProxy of last watch */
        this.lastDOMProxyMap = new Map();
        /** Find node from the given list by key */
        this.findNodeFromListByKey = (list, keys) => (key) => {
            const i = keys.findIndex((x) => this.keyComparer(x, key));
            if (i === -1)
                return null;
            return list[i];
        };
        /** Does it has a last iteration value in single mode? */
        this.singleModeHasLastValue = false;
        //#endregion
        //#region Watcher callback
        /** Should be called every watch */
        this.watcherChecker = (deadline) => {
            if (!this.isWatching)
                return;
            setTimeout(() => {
                const thisNodes = this.liveSelector.evaluate();
                if (this.singleMode)
                    return this.singleModeWatcherCallback(thisNodes);
                else
                    return this.normalModeWatcherCallback(thisNodes);
            }, 0);
        };
        //#endregion
        //#region LiveSelector settings
        /**
         * The dom proxy option used in DOMProxy()
         */
        this.domProxyOption = {};
        //#endregion
        //#region firstDOMProxy
        /** The first DOMProxy */
        this._firstDOMProxy = Object(Proxy["a" /* DOMProxy */])(this.domProxyOption);
        //#endregion
        //#region Watcher settings
        /**
         * Map `Node -> Key`, in case of you don't want the default behavior
         */
        this.mapNodeToKey = defaultMapNodeToKey;
        /**
         * Compare between `key` and `key`, in case of you don't want the default behavior
         */
        this.keyComparer = defaultEqualityComparer;
        /**
         * Compare between `value` and `value`, in case of you don't want the default behavior
         */
        this.valueComparer = defaultEqualityComparer;
        //#endregion
        //#region Schedule a watcher callback run
        this.isWatcherCheckerRunning = false;
        this.needCheckerRunAgainAfterCurrentSchedule = false;
        /**
         * Schedule a watcher check
         */
        this.scheduleWatcherCheck = () => {
            if (this.isWatcherCheckerRunning) {
                this.needCheckerRunAgainAfterCurrentSchedule = true;
                return;
            }
            this.isWatcherCheckerRunning = true;
            this.watcherChecker();
            // Now watcherChecker is sync so this path will run at most once.
            while (this.needCheckerRunAgainAfterCurrentSchedule) {
                this.watcherChecker();
                this.needCheckerRunAgainAfterCurrentSchedule = false;
            }
            this.isWatcherCheckerRunning = false;
        };
        /** window.requestIdleCallback, or polyfill. */
        this.requestIdleCallback = requestIdleCallback;
        /** For debug usage. Just keep it. */
        this.stack = (_a = new Error().stack) !== null && _a !== void 0 ? _a : '';
        //#endregion
        //#region Warnings
        /**
         * Warning to remember if developer forget to call the startWatch.
         */
        this._warning_forget_watch_ = warning({
            fn: (stack) => console.warn('Did you forget to call `.startWatch()`?\n', stack),
        });
        this._warning_repeated_keys = warning({ once: true });
        this._warning_single_mode = warning({
            once: 15,
            fn(stack) {
                console.warn(`Your watcher seems like only watching 1 node.
If you can make sure there is only 1 node to watch, call \`.enableSingleMode()\` on the watcher.
Or to ignore this message, call \`.dismissSingleModeWarning()\` on the watcher.\n`, stack);
            },
        });
        this._warning_mutation_ = warning({
            fn(stack) {
                console.warn('When watcher is watching LiveSelector<not Node>, onNodeMutation will not be ignored\n', stack);
            },
        });
        this.liveSelector = liveSelector.clone();
    }
    //#region How to start and stop the watcher
    /** Let the watcher start to watching */
    startWatch(...args) {
        this.isWatching = true;
        this._warning_forget_watch_.ignored = true;
        this.watcherChecker();
        return this;
    }
    /** Stop the watcher */
    stopWatch(...args) {
        this.isWatching = false;
    }
    /**
     * Just like React hooks. Provide callbacks for each node changes.
     *
     * @param forEachFunction - You can return a set of functions that will be called on changes.
     *
     * @remarks
     *
     * Return value of `fn`
     *
     * - `void`: No-op
     *
     * - `((oldNode: T) => void)`: it will be called when the node is removed.
     *
     * - `{ onRemove?: (old: T) => void; onTargetChanged?: (newNode: T, oldNode: T) => void; onNodeMutation?: (node: T) => void }`,
     *
     * - - `onRemove` will be called when node is removed.
     *
     * - - `onTargetChanged` will be called when the node is still existing but target has changed.
     *
     * - - `onNodeMutation` will be called when the node is the same, but it inner content or attributes are modified.
     *
     * @example
     * ```
     * // ? if your LiveSelector return Element
     * watcher.useForeach((node, key, meta) => {
     *     console.log(node.innerHTML) // when a new key is found
     *     return {
     *         onRemove() { console.log('The node is gone!') },
     *         onTargetChanged() {
     *             console.log('Key is the same, but the node has changed!')
     *             console.log(node.innerHTML) // `node` is still the latest node!
     *             // appendChild, addEventListener will not lost too!
     *         },
     *         onNodeMutation() {
     *             console.log('Key and node are both the same, but node has been mutated.')
     *         }
     *     }
     * })
     *
     * // ? if your LiveSelector does not return Element but something else
     * watcher.useForeach((value, key) => {
     *     console.log(value) // your value here.
     *     return {
     *         onRemove() { console.log('The value is gone!') },
     *         onTargetChanged(value) {
     *             console.log('Key is the same, but the value has changed!')
     *             console.log(value) // New value
     *         }
     *     }
     * })
     *
     * ```
     */
    useForeach(forEach) {
        if (this.useForeachFn) {
            console.warn("You can't chain useForeach currently. The old one will be replaced.");
        }
        this.useForeachFn = forEach;
        return this;
    }
    //#endregion
    //#region .then()
    defaultStarterForThen() {
        this.startWatch();
    }
    /**
     * Start the watcher, once it emitted data, stop watching.
     * @param map - Map function transform T to Result
     * @param options - Options for watcher
     *
     * @remarks This is an implementation of `PromiseLike`
     *
     * @example
     * ```ts
     * const value = await watcher
     * const value2 = await watcher(undefined, undefined, { minimalResultsRequired: 5 })
     * ```
     */
    // The PromiseLike<T> interface
    then(onfulfilled, onrejected, options = {}) {
        this.defaultStarterForThen();
        const { minimalResultsRequired, timeout: timeoutTime } = {
            ...{
                minimalResultsRequired: 1,
                timeout: Infinity,
            },
            ...options,
        };
        let done = () => { };
        const then = async () => {
            if (minimalResultsRequired < 1)
                throw new TypeError('Invalid minimalResultsRequired, must equal to or bigger than 1');
            if (this.singleMode && minimalResultsRequired > 1) {
                console.warn('In single mode, the watcher will ignore the option minimalResultsRequired');
            }
            const result = this.liveSelector.evaluate();
            if (Array.isArray(result) && result.length >= minimalResultsRequired) {
                // If we get the value now, return it
                return result;
            }
            else if (this.singleMode) {
                // If in single mode, return the value now
                return result;
            }
            // Or return a promise to wait the value
            return new Promise((resolve, reject) => {
                done = (state, val) => {
                    this.stopWatch();
                    this.off('onIteration', f);
                    if (state)
                        resolve(val);
                    else
                        reject(val);
                };
                const f = (v) => {
                    const nodes = Array.from(v.current.values());
                    if (this.singleMode && nodes.length >= 1) {
                        return done(true, nodes[0]);
                    }
                    if (nodes.length < minimalResultsRequired)
                        return;
                    return done(true, nodes);
                };
                this.on('onIteration', f);
            });
        };
        const withTimeout = Object(sleep["b" /* timeout */])(then(), timeoutTime);
        withTimeout.finally(() => done(false, new Error('timeout')));
        return withTimeout.then(onfulfilled, onrejected);
    }
    /** Watcher callback with single mode is off */
    normalModeWatcherCallback(currentIteration) {
        /** Key list in this iteration */
        const thisKeyList = this.mapNodeToKey === defaultMapNodeToKey ? currentIteration : currentIteration.map(this.mapNodeToKey);
        //#region Warn about repeated keys
        {
            const uniq = lodash_es_uniqWith(thisKeyList, this.keyComparer);
            if (uniq.length < thisKeyList.length) {
                this._warning_repeated_keys.warn(() => console.warn('There are repeated keys in your watcher. uniqKeys:', uniq, 'allKeys:', thisKeyList, ', to omit this warning, call `.omitWarningForRepeatedKeys()`'));
            }
        }
        //#endregion
        // New maps for the next generation
        /** Next generation Callback map */
        const nextCallbackMap = new Map();
        /** Next generation DOMProxy map */
        const nextDOMProxyMap = new Map();
        //#region Key is gone
        // Do: Delete node
        const findFromLast = this.findNodeFromListByKey(this.lastNodeList, this.lastKeyList);
        const goneKeys = lodash_es_differenceWith(this.lastKeyList, thisKeyList, this.keyComparer);
        {
            for (const oldKey of goneKeys) {
                const proxy = this.lastDOMProxyMap.get(oldKey);
                const callbacks = this.lastCallbackMap.get(oldKey);
                const node = findFromLast(oldKey);
                this.requestIdleCallback(() => {
                    applyUseForeachCallback(callbacks)('remove')(node);
                    if (proxy)
                        proxy.destroy();
                }, 
                // Delete node don't need a short timeout.
                { timeout: 2000 });
            }
        }
        //#endregion
        //#region Key is new
        // Do: Add node
        const findFromNew = this.findNodeFromListByKey(currentIteration, thisKeyList);
        const newKeys = lodash_es_differenceWith(thisKeyList, this.lastKeyList, this.keyComparer);
        {
            for (const newKey of newKeys) {
                if (!this.useForeachFn)
                    break;
                const value = findFromNew(newKey);
                if (value instanceof Node) {
                    const proxy = Object(Proxy["a" /* DOMProxy */])(this.domProxyOption);
                    proxy.realCurrent = value;
                    // This step must be sync.
                    const callbacks = this.useForeachFn(proxy.current, newKey, proxy);
                    if (hasMutationCallback(callbacks) && !proxy.observer.callback) {
                        proxy.observer.init = {
                            subtree: true,
                            childList: true,
                            characterData: true,
                            attributes: true,
                        };
                        proxy.observer.callback = (m) => { var _a; return (_a = callbacks.onNodeMutation) === null || _a === void 0 ? void 0 : _a.call(callbacks, value, m); };
                    }
                    nextCallbackMap.set(newKey, callbacks);
                    nextDOMProxyMap.set(newKey, proxy);
                }
                else {
                    const callbacks = this.useForeachFn(value, newKey, undefined);
                    applyUseForeachCallback(callbacks)('warn mutation')(this._warning_mutation_);
                    nextCallbackMap.set(newKey, callbacks);
                }
            }
        }
        //#endregion
        //#region Key is the same, but node is changed
        // Do: Change reference
        const oldSameKeys = lodash_es_intersectionWith(this.lastKeyList, thisKeyList, this.keyComparer);
        const newSameKeys = lodash_es_intersectionWith(thisKeyList, this.lastKeyList, this.keyComparer);
        const changedNodes = oldSameKeys
            .map((x) => [findFromLast(x), findFromNew(x), x, newSameKeys.find((newK) => this.keyComparer(newK, x))])
            .filter(([a, b]) => this.valueComparer(a, b) === false);
        for (const [oldNode, newNode, oldKey, newKey] of changedNodes) {
            const fn = this.lastCallbackMap.get(oldKey);
            if (newNode instanceof Node) {
                const proxy = this.lastDOMProxyMap.get(oldKey);
                proxy.realCurrent = newNode;
            }
            // This should be ordered. So keep it sync now.
            applyUseForeachCallback(fn)('target change')(newNode, oldNode);
        }
        //#endregion
        // Key is the same, node is the same
        // Do: nothing
        // #region Final: Copy the same keys
        for (const newKey of newSameKeys) {
            const oldKey = oldSameKeys.find((oldKey) => this.keyComparer(newKey, oldKey));
            nextCallbackMap.set(newKey, this.lastCallbackMap.get(oldKey));
            nextDOMProxyMap.set(newKey, this.lastDOMProxyMap.get(oldKey));
        }
        this.lastCallbackMap = nextCallbackMap;
        this.lastDOMProxyMap = nextDOMProxyMap;
        this.lastKeyList = thisKeyList;
        this.lastNodeList = currentIteration;
        const has = (item) => Boolean(item === null || item === void 0 ? void 0 : item.length);
        if (has(this.$.onIteration) && changedNodes.length + goneKeys.length + newKeys.length > 0) {
            // Make a copy to prevent modifications
            const newMap = new Map(newKeys.map((key) => [key, findFromNew(key)]));
            const removedMap = new Map(goneKeys.map((key) => [key, findFromLast(key)]));
            const currentMap = new Map(thisKeyList.map((key) => [key, findFromNew(key)]));
            this.emit('onIteration', {
                new: newMap,
                removed: removedMap,
                current: currentMap,
            });
        }
        if (has(this.$.onChange))
            for (const [oldNode, newNode, oldKey, newKey] of changedNodes) {
                this.emit('onChange', { oldValue: oldNode, newValue: newNode, oldKey, newKey });
            }
        if (has(this.$.onRemove))
            for (const key of goneKeys) {
                this.emit('onRemove', { key, value: findFromLast(key) });
            }
        if (has(this.$.onAdd))
            for (const key of newKeys) {
                this.emit('onAdd', { key, value: findFromNew(key) });
            }
        // For firstDOMProxy
        const first = currentIteration[0];
        if (first instanceof Node) {
            this._firstDOMProxy.realCurrent = first;
        }
        else if (first === undefined || first === null) {
            this._firstDOMProxy.realCurrent = null;
        }
        //#endregion
        //#region Prompt developer to open single mode
        if (currentIteration.length > 1)
            this._warning_single_mode.ignored = true;
        if (currentIteration.length === 1)
            this._warning_single_mode.warn();
        //#endregion
    }
    //#endregion
    //#region Single mode
    /**
     * Is the single mode is on.
     */
    get singleMode() {
        // @ts-ignore
        return this.liveSelector.isSingleMode;
    }
    /** Watcher callback for single mode */
    singleModeWatcherCallback(firstValue) {
        if (firstValue === undefined) {
            this.firstDOMProxy.realCurrent = null;
        }
        if (firstValue instanceof Node) {
            this.firstDOMProxy.realCurrent = firstValue;
        }
        if (hasMutationCallback(this.singleModeCallback) && !this._firstDOMProxy.observer.callback) {
            this._firstDOMProxy.observer.init = { attributes: true, characterData: true, subtree: true };
            this._firstDOMProxy.observer.callback = (e) => hasMutationCallback(this.singleModeCallback) &&
                this.singleModeCallback.onNodeMutation(this._firstDOMProxy.current, e);
        }
        // ? Case: value is gone
        if (this.singleModeHasLastValue && lodash_es_isNil(firstValue)) {
            applyUseForeachCallback(this.singleModeCallback)('remove')(this.singleModeLastValue);
            if (this.singleModeLastValue instanceof Node) {
                this._firstDOMProxy.realCurrent = null;
            }
            this.emit('onRemove', { key: undefined, value: this.singleModeLastValue });
            this.singleModeLastValue = undefined;
            this.singleModeHasLastValue = false;
        }
        // ? Case: value is new
        else if (!this.singleModeHasLastValue && Boolean(firstValue)) {
            if (this.useForeachFn) {
                if (firstValue instanceof Node) {
                    this.singleModeCallback = this.useForeachFn(this.firstDOMProxy.current, undefined, this.firstDOMProxy);
                }
                else {
                    this.singleModeCallback = this.useForeachFn(firstValue, undefined, undefined);
                    applyUseForeachCallback(this.singleModeCallback)('warn mutation')(this._warning_mutation_);
                }
            }
            this.emit('onAdd', { key: undefined, value: firstValue });
            this.singleModeLastValue = firstValue;
            this.singleModeHasLastValue = true;
        }
        // ? Case: value has changed
        else if (this.singleModeHasLastValue && !this.valueComparer(this.singleModeLastValue, firstValue)) {
            applyUseForeachCallback(this.singleModeCallback)('target change')(firstValue, this.singleModeLastValue);
            this.emit('onChange', {
                newKey: undefined,
                oldKey: undefined,
                newValue: firstValue,
                oldValue: this.singleModeLastValue,
            });
            this.singleModeLastValue = firstValue;
            this.singleModeHasLastValue = true;
        }
        // ? Case: value is not changed
        else {
            // ? Do nothing
        }
        return;
    }
    /**
     * Set option for DOMProxy
     * @param option - DOMProxy options
     */
    setDOMProxyOption(option) {
        this.domProxyOption = option;
        const oldProxy = this._firstDOMProxy;
        if (oldProxy.has('after') ||
            oldProxy.has('before') ||
            oldProxy.has('afterShadow') ||
            oldProxy.has('beforeShadow') ||
            oldProxy.realCurrent) {
            console.warn("Don't set DOMProxy before using it.");
        }
        this._firstDOMProxy = Object(Proxy["a" /* DOMProxy */])(option);
        return this;
    }
    //#endregion
    //#region events
    addListener(type, callback) {
        this.on(type, callback);
        return this;
    }
    removeListener(type, callback) {
        this.off(type, callback);
        return this;
    }
    /**
     * This DOMProxy always point to the first node in the LiveSelector
     */
    get firstDOMProxy() {
        return this._firstDOMProxy;
    }
    /**
     * To help identify same nodes in different iteration,
     * you need to implement a map function that map `node` to `key`
     *
     * If the key is changed, the same node will call through `forEachRemove` then `forEach`
     *
     * @param keyAssigner - map `node` to `key`, defaults to `node => node`
     *
     * @example
     * ```ts
     * watcher.assignKeys(node => node.innerText)
     * ```
     */
    assignKeys(keyAssigner) {
        this.noNeedInSingleMode(this.assignKeys.name);
        this.mapNodeToKey = keyAssigner;
        return this;
    }
    /**
     * To help identify same nodes in different iteration,
     * you need to implement a map function to compare `node` and `key`
     *
     * You probably don't need this.
     *
     * @param keyComparer - compare between two keys, defaults to `===`
     * @param valueComparer - compare between two value, defaults to `===`
     *
     * @example
     * ```ts
     * watcher.setComparer(
     *     (a, b) => JSON.stringify(a) === JSON.stringify(b),
     *     (a, b) => a.equals(b)
     * )
     * ```
     */
    setComparer(keyComparer, valueComparer) {
        if (keyComparer)
            this.noNeedInSingleMode(this.setComparer.name);
        if (keyComparer)
            this.keyComparer = keyComparer;
        if (valueComparer)
            this.valueComparer = valueComparer;
        return this;
    }
    //#endregion
    //#region Utils
    /**
     * Get DOMProxy by key.
     * DOMProxy will be unavailable if it is deleted
     * @param key - Key used to find DOMProxy
     */
    getDOMProxyByKey(key) {
        this.noNeedInSingleMode(this.getDOMProxyByKey.name);
        return this.lastDOMProxyMap.get([...this.lastDOMProxyMap.keys()].find((_) => this.keyComparer(_, key))) || null;
    }
    /**
     * If you're expecting Watcher may not be called, call this function, this will omit the warning.
     */
    omitWarningForForgetWatch() {
        this._warning_forget_watch_.ignored = true;
        return this;
    }
    /**
     * If you're expecting repeating keys, call this function, this will omit the warning.
     */
    omitWarningForRepeatedKeys() {
        this.noNeedInSingleMode(this.omitWarningForRepeatedKeys.name);
        this._warning_repeated_keys.ignored = true;
        return this;
    }
    /**
     * Dismiss the warning that let you enable single mode but the warning is false positive.
     */
    dismissSingleModeWarning() {
        this._warning_single_mode.ignored = true;
        return this;
    }
    noNeedInSingleMode(method) {
        if (this.singleMode)
            console.warn(`Method ${method} has no effect in SingleMode watcher`);
    }
    //#endregion
    /**
     * Call this function to enhance the debug experience in the Chrome DevTools
     *
     * You need to open "Enable custom formatters" in your DevTools settings.
     */
    static enhanceDebugger() {
        Object(out["installCustomObjectFormatter"])(new WatcherDevtoolsEnhancer_WatcherDevtoolsEnhancer());
        this.enhanceDebugger = () => { };
    }
}
//#region Default implementations
function defaultEqualityComparer(a, b) {
    return a === b;
}
function defaultMapNodeToKey(node) {
    return node;
}
function hasMutationCallback(x) {
    if (typeof x !== 'object' || x === null)
        return false;
    if ('onNodeMutation' in x && typeof x.onNodeMutation === 'function')
        return true;
    return false;
}
function applyUseForeachCallback(callback) {
    const cb = callback;
    let remove, change, mutation;
    if (typeof cb === 'function')
        remove = cb;
    else if (cb !== undefined) {
        const { onNodeMutation, onRemove, onTargetChanged } = cb;
        [remove, change, mutation] = [onRemove, onTargetChanged, onNodeMutation];
    }
    return ((type) => (...args) => {
        if (type === 'remove')
            remove && remove(...args);
        else if (type === 'target change')
            change && change(...args);
        else if (type === 'warn mutation')
            mutation && args[0]();
    });
}
function warning(_ = {}) {
    var _a;
    const { dev, once, fn } = { ...{ dev: false, once: true, fn: () => { } }, ..._ };
    if (dev)
        if (true)
            return { warn(f = fn) { }, ignored: true, stack: '' };
    const [_0, _1, _2, ...lines] = ((_a = new Error().stack) !== null && _a !== void 0 ? _a : '').split('\n');
    const stack = lines.join('\n');
    let warned = 0;
    const obj = {
        ignored: false,
        stack,
        warn(f = fn) {
            if (obj.ignored)
                return;
            if (warned > 0 && Boolean(once))
                return;
            if (typeof once === 'number' && warned <= once)
                return;
            warned = warned + 1;
            f(stack);
        },
    };
    return obj;
}
//#endregion
//# sourceMappingURL=Watcher.js.map

/***/ }),

/***/ 313:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(1052)


/***/ }),

/***/ 316:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return LiveSelector; });
/* harmony import */ var _Debuggers_LiveSelectorDevtoolsEnhancer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(506);
/* harmony import */ var jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);


/**
 * Create a live selector that can continuously select the element you want.
 *
 * @remarks
 * Call {@link LiveSelector.evaluate | #evaluate} to evaluate the element. Falsy value will be ignored.
 *
 * @param T - Type of Element that LiveSelector contains
 *
 * @example
 * ```ts
 * const ls = new LiveSelector().querySelectorAll('a').map(x => x.href)
 * ls.evaluate() // returns all urls at the current time.
 * ```
 */
class LiveSelector {
    /**
     * Create a new LiveSelector.
     *
     * @param initialElements - provides initial results, equals to `.replace(() => initialElements)`
     */
    constructor(initialElements = []) {
        this.initialElements = initialElements;
        /**
         * Let developer knows where does this LiveSelector created.
         */
        this.stack = new Error().stack;
        /**
         * Is this LiveSelector run in the SingleMode
         */
        this.isSingleMode = false;
        /**
         * Record a method call into {@link LiveSelector.selectorChain}
         */
        this.appendSelectorChain = (type) => (param) => {
            this.selectorChain.push({ type: type, param: param });
            return this;
        };
        /**
         * Records of previous calls on LiveSelector
         */
        this.selectorChain = [];
    }
    /**
     * Enable single mode. Only 1 result will be emitted.
     */
    enableSingleMode() {
        this.isSingleMode = true;
        return this;
    }
    /**
     * Clone this LiveSelector and return a new LiveSelector.
     * @returns a new LiveSelector with same action
     * @example
     * ```ts
     * ls.clone()
     * ```
     */
    clone() {
        const ls = new LiveSelector(this.initialElements);
        ls.selectorChain.push(...this.selectorChain);
        ls.isSingleMode = this.isSingleMode;
        return ls;
    }
    querySelector(selector) {
        return this.appendSelectorChain('querySelector')(selector);
    }
    querySelectorAll(selector) {
        return this.appendSelectorChain('querySelectorAll')(selector);
    }
    getElementsByClassName(className) {
        return this.appendSelectorChain('getElementsByClassName')(className);
    }
    getElementsByTagName(tag) {
        return this.appendSelectorChain('getElementsByTagName')(tag);
    }
    closest(selectors) {
        return this.appendSelectorChain('closest')(selectors);
    }
    filter(f) {
        return this.appendSelectorChain('filter')(f);
    }
    /**
     * Calls a defined callback function on each element of a LiveSelector, and continues with the results.
     *
     * @param callbackfn - Map function
     * @example
     * ```ts
     * ls.map(x => x.parentElement)
     * ```
     */
    map(callbackfn) {
        return this.appendSelectorChain('map')(callbackfn);
    }
    /**
     * Combines two LiveSelector.
     * @param newEle - Additional LiveSelector to combine.
     * @param NextType - Next type generic for LiveSelector
     *
     * @example
     * ```ts
     * ls.concat(new LiveSelector().querySelector('#root'))
     * ```
     */
    concat(newEle) {
        return this.appendSelectorChain('concat')(newEle);
    }
    /**
     * Reverses the elements in an Array.
     *
     * @example
     * ```ts
     * ls.reverse()
     * ```
     */
    reverse() {
        return this.appendSelectorChain('reverse')(undefined);
    }
    /**
     * Returns a section of an array.
     * @param start - The beginning of the specified portion of the array.
     * @param end - The end of the specified portion of the array.
     *
     * @example
     * ```ts
     * ls.slice(2, 4)
     * ```
     */
    slice(start, end) {
        return this.appendSelectorChain('slice')([start, end]);
    }
    /**
     * Sorts an array.
     * @param compareFn - The name of the function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.
     *
     * @example
     * ```ts
     * ls.sort((a, b) => a.innerText.length - b.innerText.length)
     * ```
     */
    sort(compareFn) {
        return this.appendSelectorChain('sort')(compareFn);
    }
    /**
     * Flat T[][] to T[]
     *
     * @example
     * ```ts
     * ls.flat()
     * ```
     */
    flat() {
        return this.appendSelectorChain('flat')(undefined);
    }
    /**
     * Select only nth element
     *
     * @param n - Select only nth element, allow negative number.
     * @example
     * ```ts
     * ls.nth(-1)
     * ```
     */
    nth(n) {
        if (typeof n !== 'number')
            throw new Error('n must be a number');
        if (this.isSingleMode)
            throw new Error('LiveSelector.nth() is not available in SingleMode');
        return this.appendSelectorChain('nth')(n);
    }
    /**
     * Replace the whole array.
     *
     * @example
     * ```ts
     * ls.replace(x => lodash.dropRight(x, 2))
     * ```
     *
     * @param f - returns new array.
     */
    replace(f) {
        return this.appendSelectorChain('replace')(f);
    }
    //#endregion
    //#region Build
    /**
     * Evaluate selector expression
     */
    evaluate() {
        let arr = this.initialElements;
        function isElementArray(x) {
            // Do a simple check
            return x[0] instanceof Element;
        }
        function nonNull(x) {
            return x !== null && x !== undefined;
        }
        function unique(x) {
            return Array.from(new Set(x));
        }
        let previouslyNulled = false;
        for (const op of this.selectorChain) {
            // if in single mode, drop other results.
            if (this.isSingleMode && arr.length > 1)
                arr = [arr[0]];
            switch (op.type) {
                case 'querySelector': {
                    if (!previouslyNulled) {
                        if (arr.length === 0) {
                            const e = document.querySelector(op.param);
                            if (e)
                                arr = unique(arr.concat(e));
                            else
                                previouslyNulled = true;
                        }
                        else if (isElementArray(arr)) {
                            arr = unique(arr.map(e => e.querySelector(op.param)).filter(nonNull));
                            if (arr.length === 0)
                                previouslyNulled = true;
                        }
                        else
                            throw new TypeError('Call querySelector on non-Element item!');
                    }
                    break;
                }
                case 'getElementsByTagName':
                case 'getElementsByClassName':
                case 'querySelectorAll': {
                    if (!previouslyNulled) {
                        []; // Fix editor syntax highlight
                        if (arr.length === 0) {
                            const e = document[op.type](op.param);
                            arr = unique(arr.concat(...e));
                            if (e.length === 0)
                                previouslyNulled = true;
                        }
                        else if (isElementArray(arr)) {
                            let newArr = [];
                            for (const e of arr) {
                                newArr = newArr.concat(Array.from(e[op.type](op.param)));
                            }
                            arr = unique(newArr.filter(nonNull));
                            if (arr.length === 0)
                                previouslyNulled = true;
                        }
                        else
                            throw new TypeError(`Call ${op.type} on non-Element item!`);
                    }
                    break;
                }
                case 'closest':
                    if (arr.length === 0) {
                        break;
                    }
                    else if (isElementArray(arr)) {
                        const newArr = arr;
                        const selector = op.param;
                        function findParent(node, y) {
                            if (y < 0)
                                throw new TypeError('Cannot use `.closet` with a negative number');
                            if (y === 0)
                                return node;
                            if (!node.parentElement)
                                return null;
                            return findParent(node.parentElement, y - 1);
                        }
                        if (typeof selector === 'number') {
                            arr = unique(newArr.map(e => findParent(e, selector)).filter(nonNull));
                        }
                        else {
                            arr = unique(newArr.map(x => x.closest(selector)).filter(nonNull));
                        }
                    }
                    else {
                        throw new TypeError('Cannot use `.closet on non-Element`');
                    }
                    break;
                case 'filter':
                    arr = arr.filter((e, i, a) => op.param(e, i, [...a])).filter(nonNull);
                    break;
                case 'map':
                    arr = arr.map((e, i, a) => op.param(e, i, [...a])).filter(nonNull);
                    break;
                case 'concat':
                    arr = arr.concat(op.param.evaluate());
                    break;
                case 'reverse':
                    arr = Array.from(arr).reverse();
                    break;
                case 'slice': {
                    const [start, end] = op.param;
                    arr = arr.slice(start, end);
                    break;
                }
                case 'sort':
                    arr = Array.from(arr).sort(op.param);
                    break;
                case 'nth': {
                    const x = op.param >= 0 ? op.param : arr.length - op.param;
                    arr = [arr[x]];
                    break;
                }
                case 'flat':
                    arr = [].concat(...arr);
                    break;
                case 'replace':
                    arr = op.param(Array.from(arr));
                    break;
                default:
                    throw new TypeError('Unknown operation type');
            }
        }
        if (this.isSingleMode)
            return arr.filter(nonNull)[0];
        return arr.filter(nonNull);
    }
    //#endregion
    /**
     * Call this function to enhance the debug experience in the Chrome DevTools
     *
     * You need to open "Enable custom formatters" in your DevTools settings.
     */
    static enhanceDebugger() {
        Object(jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_1__["installCustomObjectFormatter"])(new _Debuggers_LiveSelectorDevtoolsEnhancer__WEBPACK_IMPORTED_MODULE_0__[/* LiveSelectorDevtoolsEnhancer */ "a"]());
        this.enhanceDebugger = () => { };
    }
}
//# sourceMappingURL=LiveSelector.js.map

/***/ }),

/***/ 377:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ DOMProxy; });

// EXTERNAL MODULE: ./node_modules/jsx-jsonml-devtools-renderer/out/index.js
var out = __webpack_require__(24);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Debuggers/DOMProxyDevtoolsEnhancer.js

const x = () => ({ refreshed: false });
class DOMProxyDevtoolsEnhancer_DOMProxyDevtoolsEnhancer {
    isDOMProxy(obj) {
        return DOMProxyDevtoolsEnhancer_DOMProxyDevtoolsEnhancer.allDOMProxy.has(obj);
    }
    hasBody(obj) {
        if (this.isDOMProxy(obj) && obj.destroyed === false) {
            if (obj.destroyed)
                return false;
            const [state] = out["useState"](obj, x);
            if (state.refreshed)
                return false;
            return true;
        }
        return false;
    }
    showObject(name, obj, obj2, obj3) {
        return (out["createElement"]("tr", null,
            out["createElement"]("td", { variant: ['propertyName'] }, name),
            out["createElement"]("td", null, obj),
            obj2 !== undefined ? out["createElement"]("td", null, obj2) : null,
            obj3 !== undefined ? out["createElement"]("td", null, obj3) : null));
    }
    decorateShadow(obj) {
        return out["createElement"]("span", null, `#shadow-root (${obj.mode})`);
    }
    body(obj, clearState) {
        const [state, setState, render] = out["useState"](obj, x);
        if (clearState)
            setState({ refreshed: false });
        const before = obj.has('before') ? this.showObject('::before', obj.before) : null;
        const beforeShadow = obj.has('beforeShadow')
            ? this.showObject('::before', obj.beforeShadow, '', this.decorateShadow(obj.beforeShadow))
            : null;
        const after = obj.has('after') ? this.showObject('::after', obj.after) : null;
        const afterShadow = obj.has('afterShadow')
            ? this.showObject('::after', obj.afterShadow, '', this.decorateShadow(obj.afterShadow))
            : null;
        return (out["createElement"]("div", null,
            out["createElement"]("table", null,
                out["createElement"]("tr", null,
                    out["createElement"]("td", null),
                    out["createElement"]("td", { variant: ['propertyPreviewName'] }, "Element"),
                    out["createElement"]("td", null),
                    out["createElement"]("td", { variant: ['propertyPreviewName'] }, "Real Current")),
                this.showObject('current', obj.current, '->', obj.realCurrent),
                before,
                beforeShadow,
                after,
                afterShadow),
            out["createElement"]("br", null),
            out["createElement"]("span", null,
                "Changes on the ",
                out["createElement"]("span", { variant: ['propertyName'] }, "current"),
                " Proxy",
                out["createElement"]("object", { object: DOMProxyDevtoolsEnhancer_DOMProxyDevtoolsEnhancer.allDOMProxy.get(obj) })),
            out["createElement"]("div", { onClick: () => {
                    setState({ refreshed: true });
                    render();
                } }, "Refresh")));
    }
    header(obj) {
        if (!this.isDOMProxy(obj))
            return null;
        const [state] = out["useState"](obj, x);
        return (out["createElement"]("div", null,
            "DOMProxy",
            obj.destroyed ? out["createElement"]("span", { variant: ['string'] }, " (destroyed)") : null,
            state.refreshed ? this.body(obj, true) : null));
    }
    displaySelectorChain(obj) {
        // @ts-ignore
        const priv = LiveSelectorDevtoolsEnhancer.getPrivateItems(obj);
        return (out["createElement"]("table", { style: { marginLeft: '1em' } }, priv.selectorChain.map((chain) => (out["createElement"]("tr", null,
            out["createElement"]("td", null, "|"),
            out["createElement"]("td", { variant: ['propertyName'] }, chain.type),
            out["createElement"]("td", null, Array.isArray(chain.param) ? (chain.param.map((paramI, index, params) => (out["createElement"]("span", null,
                out["createElement"]("object", { object: paramI }),
                index === params.length - 1 ? '' : out["createElement"]("span", { style: { opacity: 0.7 } }, ", "))))) : (out["createElement"]("object", { object: chain.param }))))))));
    }
}
DOMProxyDevtoolsEnhancer_DOMProxyDevtoolsEnhancer.allDOMProxy = new WeakMap();
//# sourceMappingURL=DOMProxyDevtoolsEnhancer.js.map
// EXTERNAL MODULE: ./node_modules/@servie/events/dist/index.js
var dist = __webpack_require__(199);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Proxy.js



/**
 * DOMProxy provide an interface that be stable even dom is changed.
 *
 * @remarks
 *
 * DOMProxy provide 3 nodes. `before`, `current` and `after`.
 * `current` is a fake dom node powered by Proxy,
 * it will forward all your operations to the `realCurrent`.
 *
 * `before` and `after` is a true `span` that always point to before and after of `realCurrent`
 *
 * Special Handlers:
 *
 * *forward*: forward to current `realCurrent`
 *
 * *undo*: undo effect when `realCurrent` changes
 *
 * *move*: move effect to new `realCurrent`
 *
 * - style (forward, undo, move)
 * - addEventListener (forward, undo, move)
 * - appendChild (forward, undo, move)
 */
function DOMProxy(options = {}) {
    const event = new dist["Emitter"]();
    // Options
    const { createAfter, createBefore, afterShadowRootInit, beforeShadowRootInit } = {
        ...{
            createAfter: () => document.createElement('span'),
            createBefore: () => document.createElement('span'),
            afterShadowRootInit: { mode: 'open' },
            beforeShadowRootInit: { mode: 'open' },
        },
        ...options,
    };
    //
    let isDestroyed = false;
    // Nodes
    let virtualBefore = null;
    let virtualBeforeShadow = null;
    const defaultCurrent = document.createElement('div');
    let current = defaultCurrent;
    let virtualAfter = null;
    let virtualAfterShadow = null;
    /** All changes applied on the `proxy` */
    const changes = [];
    /** Read Traps */
    const readonlyTraps = {
        ownKeys: () => {
            changes.push({ type: 'ownKeys', op: undefined });
            return Object.getOwnPropertyNames(current);
        },
        get: (t, key, r) => {
            changes.push({ type: 'get', op: key });
            const current_ = current;
            if (typeof current_[key] === 'function')
                return new Proxy(current_[key], {
                    apply: (target, thisArg, args) => {
                        changes.push({ type: 'callMethods', op: { name: key, param: args, thisArg } });
                        return current_[key](...args);
                    },
                });
            else if (key === 'style')
                return new Proxy(current.style, {
                    set: (t, styleKey, styleValue, r) => {
                        changes.push({
                            type: 'modifyStyle',
                            op: { name: styleKey, value: styleValue, originalValue: current_.style[styleKey] },
                        });
                        current_.style[styleKey] = styleValue;
                        return true;
                    },
                });
            return current_[key];
        },
        has: (t, key) => {
            changes.push({ type: 'has', op: key });
            return key in current;
        },
        getOwnPropertyDescriptor: (t, key) => {
            changes.push({ type: 'getOwnPropertyDescriptor', op: key });
            return Reflect.getOwnPropertyDescriptor(current, key);
        },
        isExtensible: t => {
            changes.push({ type: 'isExtensible', op: undefined });
            return Reflect.isExtensible(current);
        },
        getPrototypeOf: t => {
            changes.push({ type: 'getPrototypeOf', op: undefined });
            return Reflect.getPrototypeOf(current);
        },
    };
    /** Write Traps */
    const modifyTraps = record => ({
        deleteProperty: (t, key) => {
            record && changes.push({ type: 'delete', op: key });
            return Reflect.deleteProperty(current, key);
        },
        set: (t, key, value, r) => {
            record && changes.push({ type: 'set', op: [key, value] });
            return (current[key] = value);
        },
        defineProperty: (t, key, attributes) => {
            record && changes.push({ type: 'defineProperty', op: [key, attributes] });
            return Reflect.defineProperty(current, key, attributes);
        },
        preventExtensions: t => {
            record && changes.push({ type: 'preventExtensions', op: undefined });
            return Reflect.preventExtensions(current);
        },
        setPrototypeOf: (t, prototype) => {
            record && changes.push({ type: 'setPrototypeOf', op: prototype });
            return Reflect.setPrototypeOf(current, prototype);
        },
    });
    const modifyTrapsWrite = modifyTraps(true);
    const modifyTrapsNotWrite = modifyTraps(false);
    const proxy = Proxy.revocable(defaultCurrent, { ...readonlyTraps, ...modifyTrapsWrite });
    function hasStyle(e) {
        return 'style' in e;
    }
    /** Call before realCurrent change */
    function undoEffects(nextCurrent) {
        for (const change of changes) {
            if (change.type === 'callMethods') {
                const attr = change.op.name;
                if (attr === 'addEventListener') {
                    current.removeEventListener(...change.op.param);
                }
                else if (attr === 'appendChild') {
                    if (!nextCurrent) {
                        const node = change.op.thisArg[0];
                        if (node !== undefined)
                            current.removeChild(node);
                    }
                }
            }
            else if (change.type === 'modifyStyle') {
                const { name, value, originalValue } = change.op;
                if (hasStyle(current)) {
                    current.style[name] = originalValue;
                }
            }
        }
    }
    /** Call after realCurrent change */
    function redoEffects() {
        if (current === defaultCurrent)
            return;
        const t = {};
        for (const change of changes) {
            if (change.type === 'setPrototypeOf')
                modifyTrapsNotWrite.setPrototypeOf(t, change.op);
            else if (change.type === 'preventExtensions')
                modifyTrapsNotWrite.preventExtensions(t);
            else if (change.type === 'defineProperty')
                modifyTrapsNotWrite.defineProperty(t, change.op[0], change.op[1]);
            else if (change.type === 'set')
                modifyTrapsNotWrite.set(t, change.op[0], change.op[1], t);
            else if (change.type === 'delete')
                modifyTrapsNotWrite.deleteProperty(t, change.op);
            else if (change.type === 'callMethods') {
                const replayable = ['appendChild', 'addEventListener', 'before', 'after'];
                const key = change.op.name;
                if (replayable.indexOf(key) !== -1) {
                    if (current[key] !== undefined) {
                        ;
                        current[key](...change.op.param);
                    }
                    else {
                        console.warn(current, `doesn't have method "${key}", replay failed.`);
                    }
                }
            }
            else if (change.type === 'modifyStyle') {
                ;
                current.style[change.op.name] = change.op.value;
            }
        }
    }
    // MutationObserver
    const noop = () => { };
    let observerCallback = noop;
    let mutationObserverInit = undefined;
    let observer = null;
    function reObserve(reinit) {
        observer && observer.disconnect();
        if (observerCallback === noop || current === defaultCurrent)
            return;
        if (reinit || !observer)
            observer = new MutationObserver(observerCallback);
        observer.observe(current, mutationObserverInit);
    }
    const DOMProxyObject = {
        observer: {
            set callback(v) {
                if (v === undefined)
                    v = noop;
                observerCallback = v;
                reObserve(true);
            },
            get callback() {
                return observerCallback;
            },
            get init() {
                return mutationObserverInit;
            },
            set init(v) {
                mutationObserverInit = v;
                reObserve(false);
            },
            get observer() {
                return observer;
            },
        },
        get destroyed() {
            return isDestroyed;
        },
        get before() {
            if (isDestroyed)
                throw new TypeError('Try to access `before` node after DOMProxy is destroyed');
            if (!virtualBefore) {
                virtualBefore = createBefore();
                if (current instanceof Element)
                    current.before(virtualBefore);
            }
            return virtualBefore;
        },
        get beforeShadow() {
            if (!virtualBeforeShadow)
                virtualBeforeShadow = this.before.attachShadow(beforeShadowRootInit);
            return virtualBeforeShadow;
        },
        get current() {
            if (isDestroyed)
                throw new TypeError('Try to access `current` node after DOMProxy is destroyed');
            return proxy.proxy;
        },
        get after() {
            if (isDestroyed)
                throw new TypeError('Try to access `after` node after DOMProxy is destroyed');
            if (!virtualAfter) {
                virtualAfter = createAfter();
                if (current instanceof Element)
                    current.after(virtualAfter);
            }
            return virtualAfter;
        },
        get afterShadow() {
            if (!virtualAfterShadow)
                virtualAfterShadow = this.after.attachShadow(afterShadowRootInit);
            return virtualAfterShadow;
        },
        has(type) {
            if (type === 'before')
                return virtualBefore;
            else if (type === 'after')
                return virtualAfter;
            else if (type === 'afterShadow')
                return virtualAfterShadow;
            else if (type === 'beforeShadow')
                return virtualBeforeShadow;
            else
                return null;
        },
        get realCurrent() {
            if (isDestroyed)
                return null;
            if (current === defaultCurrent)
                return null;
            return current;
        },
        set realCurrent(node) {
            const old = current;
            if (isDestroyed)
                throw new TypeError('You can not set current for a destroyed proxy');
            if (node === current)
                return;
            if ((node === virtualAfter || node === virtualBefore) && node !== null) {
                console.warn("In the DOMProxy, you're setting .realCurrent to this DOMProxy's virtualAfter or virtualBefore. Doing this may cause bugs. If you're confused with this warning, check your rules for LiveSelector.", this);
            }
            undoEffects(node);
            reObserve(false);
            if (node === null || node === undefined) {
                current = defaultCurrent;
                if (virtualBefore)
                    virtualBefore.remove();
                if (virtualAfter)
                    virtualAfter.remove();
            }
            else {
                current = node;
                if (virtualAfter && current instanceof Element)
                    current.after(virtualAfter);
                if (virtualBefore && current instanceof Element)
                    current.before(virtualBefore);
                redoEffects();
            }
            event.emit('currentChanged', { new: node, old });
        },
        destroy() {
            observer && observer.disconnect();
            isDestroyed = true;
            proxy.revoke();
            virtualBeforeShadow = null;
            virtualAfterShadow = null;
            if (virtualBefore)
                virtualBefore.remove();
            if (virtualAfter)
                virtualAfter.remove();
            virtualBefore = null;
            virtualAfter = null;
            current = defaultCurrent;
        },
    };
    DOMProxyDevtoolsEnhancer_DOMProxyDevtoolsEnhancer.allDOMProxy.set(event, changes);
    Object.defineProperties(event, Object.getOwnPropertyDescriptors(DOMProxyObject));
    return event;
}
DOMProxy.enhanceDebugger = function enhanceDebugger() {
    Object(out["installCustomObjectFormatter"])(new DOMProxyDevtoolsEnhancer_DOMProxyDevtoolsEnhancer());
    DOMProxy.enhanceDebugger = () => { };
};
//# sourceMappingURL=Proxy.js.map

/***/ }),

/***/ 381:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return MessageTarget; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return WebExtensionMessage; });
/* harmony import */ var async_call_rpc__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(313);
/* harmony import */ var async_call_rpc__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(async_call_rpc__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _servie_events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(199);
/* harmony import */ var _servie_events__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_servie_events__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var event_iterator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(497);
/* harmony import */ var event_iterator__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(event_iterator__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _Context__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(54);
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _domain, _events, _eventRegistry;




var MessageTarget;
(function (MessageTarget) {
    /** Current execution context */ MessageTarget[MessageTarget["IncludeLocal"] = 1048576] = "IncludeLocal";
    MessageTarget[MessageTarget["LocalOnly"] = 2097152] = "LocalOnly";
    /** Visible page, maybe have more than 1 page. */ MessageTarget[MessageTarget["VisiblePageOnly"] = 4194304] = "VisiblePageOnly";
    /** Page that has focus (devtools not included), 0 or 1 page. */ MessageTarget[MessageTarget["FocusedPageOnly"] = 8388608] = "FocusedPageOnly";
    MessageTarget[MessageTarget["Broadcast"] = 2] = "Broadcast";
    MessageTarget[MessageTarget["All"] = 1048578] = "All";
})(MessageTarget || (MessageTarget = {}));
const throwSetter = () => {
    throw new TypeError();
};
// Only available in background page
const backgroundOnlyLivingPorts = new Map();
// Only be set in other pages
let currentTabID = -1;
// Shared global
let postMessage = () => { };
const domainRegistry = new _servie_events__WEBPACK_IMPORTED_MODULE_1__["Emitter"]();
const constant = '@holoflows/kit/WebExtensionMessage/setup';
class WebExtensionMessage {
    /**
     * @param options WebExtensionMessage options
     */
    constructor(options) {
        var _a;
        _domain.set(this, void 0);
        //#region Simple API
        _events.set(this, new Proxy({ __proto__: null }, {
            get: (cache, event) => {
                if (typeof event !== 'string')
                    throw new Error('Only string can be event keys');
                if (cache[event])
                    return cache[event];
                const registry = UnboundedRegistry(this, event, __classPrivateFieldGet(this, _eventRegistry));
                Object.defineProperty(cache, event, { value: registry });
                return registry;
            },
            defineProperty: () => false,
            setPrototypeOf: () => false,
            set: throwSetter,
        })
        /** Event listeners */
        );
        //#endregion
        // declare readonly eventTarget: { readonly [key in keyof Message]: UnboundedRegister<Message[key], EventTargetRegister<Message>> }
        // declare readonly eventEmitter: { readonly [key in keyof Message]: UnboundedRegister<Message[key], EventEmitterRegister<Message>> }
        /**
         * Watch new tabs created and get event listener register of that tab.
         *
         * This API only works in the BackgroundPage.
         */
        this.serialization = async_call_rpc__WEBPACK_IMPORTED_MODULE_0__["NoSerialization"];
        this.logFormatter = (instance, key, data) => {
            return [
                `%cReceive%c %c${String(key)}`,
                'background: rgba(0, 255, 255, 0.6); color: black; padding: 0px 6px; border-radius: 4px;',
                '',
                'text-decoration: underline',
                data,
            ];
        };
        this.enableLog = false;
        this.log = console.log;
        _eventRegistry.set(this, new _servie_events__WEBPACK_IMPORTED_MODULE_1__["Emitter"]());
        try {
            WebExtensionMessage.setup();
        }
        catch (_b) { }
        const domain = (__classPrivateFieldSet(this, _domain, (_a = options === null || options === void 0 ? void 0 : options.domain) !== null && _a !== void 0 ? _a : ''));
        domainRegistry.on(domain, async (payload) => {
            if (!isInternalMessageType(payload))
                return;
            let { event, data, target } = payload;
            if (!shouldAcceptThisMessage(target))
                return;
            data = await this.serialization.deserialization(data);
            if (this.enableLog) {
                this.log(...this.logFormatter(this, event, data));
            }
            __classPrivateFieldGet(this, _eventRegistry).emit(event, data);
        });
    }
    // Only execute once.
    static setup() {
        if (Object(_Context__WEBPACK_IMPORTED_MODULE_3__[/* isEnvironment */ "g"])(_Context__WEBPACK_IMPORTED_MODULE_3__[/* Environment */ "a"].ManifestBackground)) {
            // Wait for other pages to connect
            browser.runtime.onConnect.addListener((port) => {
                var _a, _b;
                if (port.name !== constant)
                    return; // not for ours
                const sender = port.sender;
                backgroundOnlyLivingPorts.set(port, { sender });
                // let the client know it's tab id
                // sender.tab might be undefined if it is a popup
                // TODO: check sender if same as ourself? Support external / cross-extension message?
                port.postMessage((_b = (_a = sender === null || sender === void 0 ? void 0 : sender.tab) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : -1);
                // Client will report it's environment flag on connection
                port.onMessage.addListener(function environmentListener(x) {
                    backgroundOnlyLivingPorts.get(port).environment = Number(x);
                    port.onMessage.removeListener(environmentListener);
                });
                port.onMessage.addListener(backgroundPageMessageHandler.bind(port));
                port.onDisconnect.addListener(() => backgroundOnlyLivingPorts.delete(port));
            });
            WebExtensionMessage.setup = () => { };
            postMessage = backgroundPageMessageHandler;
        }
        else {
            function reconnect() {
                const port = browser.runtime.connect({ name: constant });
                postMessage = (payload) => {
                    if (typeof payload !== 'object')
                        return port.postMessage(payload);
                    const bound = payload.target;
                    if (bound.kind === 'tab')
                        return port.postMessage(payload);
                    if (bound.kind === 'port')
                        throw new Error('Unreachable case: bound type = port in non-background script');
                    const target = bound.target;
                    if (target & (MessageTarget.IncludeLocal | MessageTarget.LocalOnly)) {
                        domainRegistry.emit(payload.domain, payload);
                        if (target & MessageTarget.LocalOnly)
                            return;
                        bound.target &= ~MessageTarget.IncludeLocal; // unset IncludeLocal
                    }
                    port.postMessage(payload);
                };
                // report self environment
                port.postMessage(Object(_Context__WEBPACK_IMPORTED_MODULE_3__[/* getEnvironment */ "f"])());
                // server will send self tab ID on connected
                port.onMessage.addListener(function tabIDListener(x) {
                    currentTabID = Number(x);
                    port.onMessage.removeListener(tabIDListener);
                });
                port.onMessage.addListener((data) => {
                    if (!isInternalMessageType(data))
                        return;
                    domainRegistry.emit(data.domain, data);
                });
                // ? Will it cause infinite loop?
                port.onDisconnect.addListener(reconnect);
            }
            reconnect();
            WebExtensionMessage.setup = () => { };
        }
    }
    /** Same message name within different domain won't collide with each other. */
    get domain() {
        return __classPrivateFieldGet(this, _domain);
    }
    /** Event listeners */
    get events() {
        return __classPrivateFieldGet(this, _events);
    }
    get eventRegistry() {
        return __classPrivateFieldGet(this, _eventRegistry);
    }
}
_domain = new WeakMap(), _events = new WeakMap(), _eventRegistry = new WeakMap();
function isInternalMessageType(e) {
    if (typeof e !== 'object' || e === null)
        return false;
    const { domain, event, target } = e;
    // Message is not for us
    if (typeof domain !== 'string')
        return false;
    if (typeof event !== 'string')
        return false;
    if (typeof target !== 'object' || target === null)
        return false;
    return true;
}
function shouldAcceptThisMessage(target) {
    var _a;
    if (target.kind === 'tab')
        return target.id === currentTabID;
    if (target.kind === 'port')
        return true;
    const flag = target.target;
    if (flag & (MessageTarget.IncludeLocal | MessageTarget.LocalOnly))
        return true;
    const here = Object(_Context__WEBPACK_IMPORTED_MODULE_3__[/* getEnvironment */ "f"])();
    if (flag & MessageTarget.FocusedPageOnly)
        return typeof document === 'object' && ((_a = document === null || document === void 0 ? void 0 : document.hasFocus) === null || _a === void 0 ? void 0 : _a.call(document));
    if (flag & MessageTarget.VisiblePageOnly) {
        // background page has document.visibilityState === 'visible' for reason I don't know why
        if (here & _Context__WEBPACK_IMPORTED_MODULE_3__[/* Environment */ "a"].ManifestBackground)
            return false;
        return typeof document === 'object' && (document === null || document === void 0 ? void 0 : document.visibilityState) === 'visible';
    }
    return Boolean(here & flag);
}
function UnboundedRegistry(instance, eventName, eventListener) {
    //#region Batch message
    let pausing = false;
    const pausingMap = new Map();
    //#endregion
    async function send(target, data) {
        if (typeof target !== 'number')
            throw new TypeError('target must be a bit flag of MessageTarget | Environment');
        if (pausing) {
            const list = pausingMap.get(target) || [];
            pausingMap.set(target, list);
            list.push(data);
            return;
        }
        postMessage({
            data: await instance.serialization.serialization(data),
            domain: instance.domain,
            event: eventName,
            target: { kind: 'target', target },
        });
    }
    let binder;
    function on(cb) {
        eventListener.on(eventName, cb);
        return () => eventListener.off(eventName, cb);
    }
    function off(cb) {
        eventListener.off(eventName, cb);
    }
    function pause() {
        pausing = true;
        return async (reducer = (x) => x) => {
            pausing = false;
            for (const [target, list] of pausingMap) {
                try {
                    await Promise.all(reducer(list).map((x) => send(target, x)));
                }
                finally {
                    pausingMap.clear();
                }
            }
        };
    }
    const self = {
        send,
        sendToLocal: send.bind(null, MessageTarget.LocalOnly),
        sendToBackgroundPage: send.bind(null, _Context__WEBPACK_IMPORTED_MODULE_3__[/* Environment */ "a"].ManifestBackground),
        sendToContentScripts: send.bind(null, _Context__WEBPACK_IMPORTED_MODULE_3__[/* Environment */ "a"].ContentScript),
        sendToVisiblePages: send.bind(null, MessageTarget.VisiblePageOnly),
        sendToFocusedPage: send.bind(null, MessageTarget.FocusedPageOnly),
        sendByBroadcast: send.bind(null, MessageTarget.Broadcast),
        sendToAll: send.bind(null, MessageTarget.All),
        bind(target) {
            if (typeof binder === 'undefined') {
                binder = { on, off, send: (data) => send(target, data), pause };
            }
            return binder;
        },
        on,
        off,
        pause,
        async *[Symbol.asyncIterator]() {
            yield* new event_iterator__WEBPACK_IMPORTED_MODULE_2__["EventIterator"](({ push }) => this.on(push));
        },
    };
    return self;
}
function backgroundPageMessageHandler(data) {
    var _a;
    // receive payload from the other side
    if (!isInternalMessageType(data))
        return;
    if (data.target.kind === 'tab') {
        for (const [port, { sender }] of backgroundOnlyLivingPorts) {
            if (data.target.id !== ((_a = sender === null || sender === void 0 ? void 0 : sender.tab) === null || _a === void 0 ? void 0 : _a.id))
                continue;
            return port.postMessage(data);
        }
    }
    else if (data.target.kind === 'port') {
        data.target.port.postMessage(data);
    }
    else {
        const flag = data.target.target;
        // Also dispatch this message to background page itself. shouldAcceptThisMessage will help us to filter the message
        domainRegistry.emit(data.domain, data);
        if (flag & MessageTarget.LocalOnly)
            return;
        for (const [port, { environment }] of backgroundOnlyLivingPorts) {
            if (port === this)
                continue; // Not sending to the source.
            if (environment === undefined)
                continue;
            try {
                if (environment & flag)
                    port.postMessage(data);
                // they will handle this by thyself
                else if (flag & (MessageTarget.FocusedPageOnly | MessageTarget.VisiblePageOnly))
                    port.postMessage(data);
            }
            catch (e) {
                console.error(e);
            }
        }
    }
}
//# sourceMappingURL=MessageChannel.js.map

/***/ }),

/***/ 383:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return sleep; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return timeout; });
/**
 * Return a promise that resolved after `time` ms.
 * If `time` is `Infinity`, it will never resolve.
 * @param time - Time to sleep. In `ms`.
 *
 * @internal
 */
const sleep = (time) => new Promise(resolve => (Number.isFinite(time) ? setTimeout(resolve, time) : void 0));
/**
 * Accept a promise and then set a timeout on it. After `time` ms, it will reject.
 * @param promise - The promise that you want to set time limit on.
 * @param time - Time before timeout. In `ms`.
 * @param rejectReason - When reject, show a reason. Defaults to `"timeout"`
 *
 * @internal
 */
const timeout = (promise, time, rejectReason) => {
    if (!Number.isFinite(time))
        return (async () => promise)();
    let timer;
    const race = Promise.race([
        promise,
        new Promise((r, reject) => {
            timer = setTimeout(() => reject(new Error(rejectReason !== null && rejectReason !== void 0 ? rejectReason : 'timeout')), time);
        }),
    ]);
    race.finally(() => clearTimeout(timer));
    return race;
};
//# sourceMappingURL=sleep.js.map

/***/ }),

/***/ 395:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Buffer) {
Object.defineProperty(exports, "__esModule", { value: true });
function rs2Buf(rs) {
    return new Promise((resolve, reject) => {
        const bufs = [];
        rs.on('data', c => bufs.push(c));
        rs.on('end', () => resolve(Buffer.concat(bufs)));
        rs.on('error', err => reject(err));
    });
}
exports.rs2Buf = rs2Buf;
function rand(min, max) {
    return Math.round(Math.random() * max + min);
}
exports.rand = rand;
function clamp(v, min, max) {
    if (v < min) {
        console.warn(`clamp min: ${v}`);
        return min;
    }
    if (v > max) {
        console.warn(`clamp max: ${v}`);
        return max;
    }
    return v;
}
exports.clamp = clamp;
function hash(input) {
    let code = 0;
    if (input.length === 0)
        return code;
    for (let i = 0; i < input.length; i += 1) {
        const char = input.charCodeAt(i);
        code = (code << 5) - code + char;
        code = code & code; // Convert to 32bit integer
    }
    return code;
}
exports.hash = hash;
function hashCode(input, mod, inArray) {
    let prob = 1;
    let code = hash(input);
    let index = Math.abs(code) % mod;
    while (inArray[index]) {
        index = (index + prob * prob) % mod;
        prob = prob > mod / 2 ? 1 : prob + 1;
    }
    inArray[index] = 1;
    return [index, String(code)];
}
exports.hashCode = hashCode;
function shuffle(nums, seed, unshuffle = false) {
    const swap = (a, b) => ([nums[a], nums[b]] = [nums[b], nums[a]]);
    for (let i = unshuffle ? nums.length - 1 : 0; (unshuffle && i >= 0) || (!unshuffle && i < nums.length); i += unshuffle ? -1 : 1) {
        swap(seed[i % seed.length] % nums.length, i);
    }
}
exports.shuffle = shuffle;
function unshuffle(nums, seed) {
    return shuffle(nums, seed, true);
}
exports.unshuffle = unshuffle;
function rgb2yuv(r, g, b) {
    return [
        (77 / 256) * r + (150 / 256) * g + (29 / 256) * b,
        -(44 / 256) * r - (87 / 256) * g + (131 / 256) * b + 128,
        (131 / 256) * r - (110 / 256) * g - (21 / 256) * b + 128,
    ];
}
exports.rgb2yuv = rgb2yuv;
function yuv2rgb(y, cb, cr) {
    return [
        y + 1.4075 * (cr - 128),
        y - 0.3455 * (cb - 128) - 0.7169 * (cr - 128),
        y + 1.779 * (cb - 128),
    ];
}
exports.yuv2rgb = yuv2rgb;
function filterIndices(size, predicator) {
    const indices = [];
    for (let i = 0; i < size * size; i += 1) {
        if (predicator(i)) {
            indices.push(i);
        }
    }
    return indices;
}
exports.filterIndices = filterIndices;
function squareTopLeftCircleExclude(size, radius) {
    return filterIndices(size, i => {
        const x = Math.floor(i / size);
        const y = i % size;
        return Math.sqrt(y * y + x * x) > radius;
    });
}
exports.squareTopLeftCircleExclude = squareTopLeftCircleExclude;
function squareBottomRightCircleExclude(size, radius) {
    return filterIndices(size, i => {
        const x = Math.floor(i / size);
        const y = i % size;
        return (Math.sqrt(Math.pow(size - y - 1, 2) + Math.pow(size - x - 1, 2)) > radius);
    });
}
exports.squareBottomRightCircleExclude = squareBottomRightCircleExclude;
function squareCircleIntersect(size, radius) {
    const mid = (size + 1) / 2 - 1;
    return filterIndices(size, i => {
        const x = Math.floor(i / size);
        const y = i % size;
        return Math.sqrt(Math.pow(mid - x, 2) + Math.pow(mid - y, 2)) <= radius;
    });
}
exports.squareCircleIntersect = squareCircleIntersect;
function isJPEG(buf) {
    if (!buf || buf.length < 3) {
        return false;
    }
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}
exports.isJPEG = isJPEG;
function isPNG(buf) {
    if (!buf || buf.length < 8) {
        return false;
    }
    return (buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a);
}
exports.isPNG = isPNG;
function imgType(buf) {
    if (isJPEG(buf)) {
        return 'image/jpeg';
    }
    if (isPNG(buf)) {
        return 'image/png';
    }
    return '';
}
exports.imgType = imgType;
//# sourceMappingURL=helper.js.map
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(22).Buffer))

/***/ }),

/***/ 430:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ AutomatedTabTask; });

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/util/sleep.js
var sleep = __webpack_require__(383);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/node_modules/async-call-rpc/full.js
var full = __webpack_require__(313);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/Context.js
var Context = __webpack_require__(54);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/util/ConcurrentLock.js
/**
 * This file is copied from https://github.com/yusukeshibata/concurrent-lock
 *
 * It is licensed under the MIT license.
 * I copy it here because it is introducing @babel/runtime as a runtime dependency.
 */
class Signal {
    static async wait(timeout) {
        const signal = new Signal();
        this.instances.push(signal);
        await signal._wait(timeout);
    }
    static fire() {
        const signal = this.instances.shift();
        if (signal)
            signal._fire();
    }
    _fire(err) {
        const fn = this._fn;
        delete this._fn;
        if (fn)
            fn(err);
    }
    _wait(timeout) {
        return new Promise((resolve, reject) => {
            this._fn = (err) => (err ? reject(err) : resolve());
            if (timeout !== undefined)
                setTimeout(() => this._fire(new Error('Timeout')), timeout);
        });
    }
}
Signal.instances = [];
class Lock {
    constructor(_limit = 1) {
        this._limit = _limit;
        this._locked = 0;
    }
    isLocked() {
        return this._locked >= this._limit;
    }
    async lock(timeout) {
        if (this.isLocked()) {
            await Signal.wait(timeout);
        }
        this._locked++;
    }
    unlock() {
        if (this._locked <= 0) {
            throw new Error('Already unlocked');
        }
        this._locked--;
        Signal.fire();
    }
}
//# sourceMappingURL=ConcurrentLock.js.map
// EXTERNAL MODULE: ./node_modules/memorize-decorator/bld/index.js
var bld = __webpack_require__(651);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/MessageCenter.js
var MessageCenter = __webpack_require__(488);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/AutomatedTabTask.js






const AutomatedTabTaskDefineTimeOptionsDefault = {
    timeout: 30 * 1000,
    concurrent: 3,
    memorizeTTL: 30 * 60 * 1000,
    memorable: false,
    autoClose: true,
    AsyncCallOptions: {},
};
/**
 * Open a new page in the background, execute some task, then close it automatically.
 *
 * @example
 *
 * In content script: (You must run this in the page you wanted to run task in!)
 * ```ts
 * export const task = AutomatedTabTask({
 *   async taskA() {
 *       return 'Done!'
 *   },
 * })
 * ```
 *
 * In background script:
 *
 * Open https://example.com/ then run taskA() on that page, which will return 'Done!'
 * ```ts
 * import { task } from '...'
 * task('https://example.com/').taskA()
 * ```
 *
 * @param taskImplements - All tasks that background page can call.
 * @param options - Options
 */
function AutomatedTabTask(taskImplements, options = {}) {
    const { timeout: defaultTimeout, concurrent, memorable: defaultMemorable, memorizeTTL, autoClose: defaultAutoClose, pinned: defaultPinned, active: defaultActive, AsyncCallOptions, } = {
        ...AutomatedTabTaskDefineTimeOptionsDefault,
        ...options,
    };
    if (AsyncCallOptions.key === undefined) {
        AsyncCallOptions.key = GetDefaultKey();
    }
    const AsyncCallKey = AsyncCallOptions.key;
    const REGISTER = AsyncCallKey + ':ping';
    const finalAsyncCallOptions = {
        channel: new MessageCenter["a" /* MessageCenter */](false, AsyncCallKey).eventBasedChannel,
        ...AsyncCallOptions,
    };
    if (Object(Context["b" /* GetContext */])() === 'content') {
        // If run in content script
        // Register this tab
        browser.runtime.sendMessage({ type: REGISTER }).then((sender) => {
            const tabId = sender.tab.id;
            if (typeof tabId !== 'number')
                return;
            // Transform `methodA` to `methodA:233` (if tabId = 233)
            const tasksWithId = {};
            for (const [taskName, value] of Object.entries(taskImplements)) {
                tasksWithId[getTaskNameByTabId(taskName, tabId)] = value;
            }
            // Register AsyncCall
            Object(full["AsyncCall"])(tasksWithId, finalAsyncCallOptions);
        }, () => { });
        return null;
    }
    else if (Object(Context["b" /* GetContext */])() === 'background' || Object(Context["b" /* GetContext */])() === 'options') {
        /** If `tab` is ready */
        const tabReadyMap = new Set();
        // Listen to tab REGISTER event
        browser.runtime.onMessage.addListener(((message, sender) => {
            if (message.type === REGISTER) {
                tabReadyMap.add(sender.tab.id);
                // response its tab id
                return Promise.resolve(sender);
            }
            return undefined;
        }));
        // Register a empty AsyncCall for runtime-generated call
        const asyncCall = Object(full["AsyncCall"])({}, finalAsyncCallOptions);
        const lock = new Lock(concurrent);
        const memoRunTask = Object(bld["memorize"])(createOrGetTheTabToExecuteTask, { ttl: memorizeTTL });
        /**
         * @param urlOrTabID - where to run the task
         * string: URL you want to execute the task
         * number: task id you want to execute the task
         * @param options - runtime options
         */
        function taskStarter(urlOrTabID, options = {}) {
            const { memorable, timeout, important: isImportant, autoClose, pinned, active, runAtTabID, needRedirect, url, } = {
                ...{
                    memorable: defaultMemorable,
                    important: false,
                    timeout: defaultTimeout,
                    autoClose: typeof urlOrTabID === 'number' || options.runAtTabID === undefined ? false : defaultAutoClose,
                    pinned: defaultPinned,
                    active: defaultActive,
                    needRedirect: false,
                },
                ...options,
            };
            let tabID;
            if (typeof urlOrTabID === 'number')
                tabID = urlOrTabID;
            else
                tabID = runAtTabID;
            let finalURL;
            if (typeof urlOrTabID === 'string')
                finalURL = urlOrTabID;
            else
                finalURL = url !== null && url !== void 0 ? url : '';
            function proxyTrap(_target, taskName) {
                return (...taskArgs) => {
                    if (typeof taskName !== 'string')
                        throw new TypeError('Key must be a string');
                    return (memorable ? memoRunTask : createOrGetTheTabToExecuteTask)({
                        active,
                        taskName,
                        timeout,
                        isImportant,
                        pinned,
                        autoClose,
                        needRedirect,
                        taskArgs,
                        asyncCall,
                        lock,
                        tabID,
                        tabReadyMap,
                        url: finalURL,
                    });
                };
            }
            return new Proxy({}, { get: proxyTrap });
        }
        return taskStarter;
    }
    else if (Object(Context["b" /* GetContext */])() === 'debugging') {
        return (...args1) => new Proxy({}, {
            get(_, key) {
                return async (...args2) => {
                    console.log(`AutomatedTabTask.${AsyncCallKey}.${String(key)} called with `, ...args1, ...args2);
                    await Object(sleep["a" /* sleep */])(2000);
                };
            },
        });
    }
    else {
        return null;
    }
}
async function createOrGetTheTabToExecuteTask(options) {
    const { active, taskArgs, autoClose, isImportant, needRedirect, pinned, tabID: wantedTabID } = options;
    const { asyncCall, tabReadyMap, lock, taskName, timeout, url } = options;
    /**
     * does it need a lock to avoid too many open at the same time?
     */
    const withoutLock = Boolean(isImportant || autoClose === false || active || !(typeof wantedTabID === 'number'));
    if (!withoutLock)
        await lock.lock(timeout);
    const tabId = await getTabOrCreate(wantedTabID, url, needRedirect, active, pinned);
    // Wait for the tab register
    while (tabReadyMap.has(tabId) !== true)
        await Object(sleep["a" /* sleep */])(50);
    // Run the async call
    const task = asyncCall[getTaskNameByTabId(taskName, tabId)](...taskArgs);
    try {
        // ! DO NOT Remove `await`, or finally block will run before the promise resolved
        return await Object(sleep["b" /* timeout */])(task, timeout);
    }
    finally {
        if (!withoutLock)
            lock.unlock();
        autoClose && browser.tabs.remove(tabId);
    }
}
async function getTabOrCreate(openInCurrentTab, url, needRedirect, active, pinned) {
    const finalOpts = { active, pinned, url: url };
    // Gecko view doesn't support this.
    if (finalOpts.pinned === undefined)
        delete finalOpts.pinned;
    if (finalOpts.active === undefined)
        delete finalOpts.active;
    if (typeof openInCurrentTab === 'number') {
        if (!needRedirect)
            delete finalOpts.url;
        await browser.tabs.update(openInCurrentTab, finalOpts);
        return openInCurrentTab;
    }
    // Create a new tab
    const tab = await browser.tabs.create(finalOpts);
    return tab.id;
}
function getTaskNameByTabId(task, tabId) {
    return `${task}:${tabId}`;
}
function GetDefaultKey() {
    const context = Object(Context["b" /* GetContext */])();
    switch (context) {
        case 'background':
        case 'content':
        case 'options':
            return browser.runtime.getURL('@holoflows/kit:AutomatedTabTask');
        case 'debugging':
            return 'debug';
        case 'unknown':
        default:
            return '@holoflows/kit:AutomatedTabTask@Unknown!';
    }
}
//# sourceMappingURL=AutomatedTabTask.js.map

/***/ }),

/***/ 45:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "LiveSelector", function() { return /* reexport */ LiveSelector["a" /* LiveSelector */]; });
__webpack_require__.d(__webpack_exports__, "DOMProxy", function() { return /* reexport */ Proxy["a" /* DOMProxy */]; });
__webpack_require__.d(__webpack_exports__, "Watcher", function() { return /* reexport */ Watcher["a" /* Watcher */]; });
__webpack_require__.d(__webpack_exports__, "MutationObserverWatcher", function() { return /* reexport */ MutationObserverWatcher["a" /* MutationObserverWatcher */]; });
__webpack_require__.d(__webpack_exports__, "IntervalWatcher", function() { return /* reexport */ IntervalWatcher["a" /* IntervalWatcher */]; });
__webpack_require__.d(__webpack_exports__, "EventWatcher", function() { return /* reexport */ EventWatcher_EventWatcher; });
__webpack_require__.d(__webpack_exports__, "GetContext", function() { return /* reexport */ Context["b" /* GetContext */]; });
__webpack_require__.d(__webpack_exports__, "Environment", function() { return /* reexport */ Context["a" /* Environment */]; });
__webpack_require__.d(__webpack_exports__, "getEnvironment", function() { return /* reexport */ Context["f" /* getEnvironment */]; });
__webpack_require__.d(__webpack_exports__, "printEnvironment", function() { return /* reexport */ Context["h" /* printEnvironment */]; });
__webpack_require__.d(__webpack_exports__, "OnlyRunInContext", function() { return /* reexport */ Context["c" /* OnlyRunInContext */]; });
__webpack_require__.d(__webpack_exports__, "assertEnvironment", function() { return /* reexport */ Context["d" /* assertEnvironment */]; });
__webpack_require__.d(__webpack_exports__, "assertNotEnvironment", function() { return /* reexport */ Context["e" /* assertNotEnvironment */]; });
__webpack_require__.d(__webpack_exports__, "isEnvironment", function() { return /* reexport */ Context["g" /* isEnvironment */]; });
__webpack_require__.d(__webpack_exports__, "MessageCenter", function() { return /* reexport */ MessageCenter["a" /* MessageCenter */]; });
__webpack_require__.d(__webpack_exports__, "AutomatedTabTask", function() { return /* reexport */ AutomatedTabTask["a" /* AutomatedTabTask */]; });
__webpack_require__.d(__webpack_exports__, "MessageTarget", function() { return /* reexport */ MessageChannel["a" /* MessageTarget */]; });
__webpack_require__.d(__webpack_exports__, "WebExtensionMessage", function() { return /* reexport */ MessageChannel["b" /* WebExtensionMessage */]; });
__webpack_require__.d(__webpack_exports__, "ValueRef", function() { return /* reexport */ ValueRef["a" /* ValueRef */]; });

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/LiveSelector.js
var LiveSelector = __webpack_require__(316);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Proxy.js + 1 modules
var Proxy = __webpack_require__(377);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Watcher.js + 83 modules
var Watcher = __webpack_require__(279);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Watchers/MutationObserverWatcher.js
var MutationObserverWatcher = __webpack_require__(508);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Watchers/IntervalWatcher.js
var IntervalWatcher = __webpack_require__(615);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Watchers/EventWatcher.js

/**
 * A Watcher based on event handlers.
 *
 * @example
 * ```ts
 * const e = new EventWatcher(ls).useForeach(node => console.log(node))
 * document.addEventListener('event', e.eventListener)
 * ```
 */
class EventWatcher_EventWatcher extends Watcher["a" /* Watcher */] {
    constructor(liveSelector) {
        super(liveSelector);
        /**
         * Use this function as event listener to invoke watcher.
         */
        this.eventListener = () => {
            this.requestIdleCallback(this.scheduleWatcherCheck, { timeout: 500 });
        };
        this.startWatch();
    }
}
//# sourceMappingURL=EventWatcher.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/index.js






//# sourceMappingURL=index.js.map
// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/Context.js
var Context = __webpack_require__(54);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/MessageCenter.js
var MessageCenter = __webpack_require__(488);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/AutomatedTabTask.js + 1 modules
var AutomatedTabTask = __webpack_require__(430);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/MessageChannel.js
var MessageChannel = __webpack_require__(381);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/index.js




//# sourceMappingURL=index.js.map
// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/util/ValueRef.js
var ValueRef = __webpack_require__(132);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/util/index.js

//# sourceMappingURL=index.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/index.js
/**
 * A toolkit for browser extension developing.
 *
 * @packageDocumentation
 */



//# sourceMappingURL=index.js.map

/***/ }),

/***/ 488:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return MessageCenter; });
/* harmony import */ var _servie_events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(199);
/* harmony import */ var _servie_events__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_servie_events__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var async_call_rpc__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(313);
/* harmony import */ var async_call_rpc__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(async_call_rpc__WEBPACK_IMPORTED_MODULE_1__);


const noop = () => { };
/**
 * Send and receive messages in different contexts.
 * @deprecated Remove in 0.9.0
 */
class MessageCenter {
    /**
     * @param sendToSelf - If this MessageCenter will send message to this instance itself
     * @param instanceKey - Use this instanceKey to distinguish your messages and others.
     * This option cannot make your message safe!
     */
    constructor(sendToSelf, instanceKey = '') {
        this.sendToSelf = sendToSelf;
        this.instanceKey = instanceKey;
        /**
         * How should MessageCenter serialization the message
         * @defaultValue NoSerialization
         */
        this.serialization = async_call_rpc__WEBPACK_IMPORTED_MODULE_1__["NoSerialization"];
        this.eventEmitter = new _servie_events__WEBPACK_IMPORTED_MODULE_0__["Emitter"]();
        this.listener = async (request) => {
            const { key, data, instanceKey } = (await this.serialization.deserialization(request));
            // Message is not for us
            if (this.instanceKey !== (instanceKey !== null && instanceKey !== void 0 ? instanceKey : ''))
                return;
            if (key === undefined)
                return;
            if (this.log) {
                console.log(`%cReceive%c %c${key.toString()}`, 'background: rgba(0, 255, 255, 0.6); color: black; padding: 0px 6px; border-radius: 4px;', '', 'text-decoration: underline', data);
            }
            this.eventEmitter.emit(key, data);
        };
        this.log = false;
        this.eventBasedChannel = {
            on: (e) => this.on('__async-call', e),
            send: (e) => this.emit('__async-call', e),
        };
        try {
            // Fired when a message is sent from either an extension process (by runtime.sendMessage)
            // or a content script (by tabs.sendMessage).
            browser.runtime.onMessage.addListener((e) => {
                this.listener(e);
            });
        }
        catch (_a) { }
    }
    /**
     * Listen to an event
     * @param event - Name of the event
     * @param handler - Handler of the event
     * @returns a function, call it to remove this listener
     */
    on(event, handler) {
        this.eventEmitter.on(event, handler);
        return () => this.off(event, handler);
    }
    /**
     * Remove the listener of an event
     * @param event - Name of the event
     * @param handler - Handler of the event
     */
    off(event, handler) {
        this.eventEmitter.off(event, handler);
    }
    /**
     * Send message to local or other instance of extension
     * @param key - Key of the message
     * @param data - Data of the message
     */
    async emit(key, data) {
        var _a, _b, _c, _d;
        if (this.log) {
            console.log(`%cSend%c %c${key.toString()}`, 'background: rgba(0, 255, 255, 0.6); color: black; padding: 0px 6px; border-radius: 4px;', '', 'text-decoration: underline', data);
        }
        const serialized = await this.serialization.serialization({
            data,
            key,
            instanceKey: (_a = this.instanceKey) !== null && _a !== void 0 ? _a : '',
        });
        if (typeof browser !== 'undefined') {
            (_c = (_b = browser.runtime) === null || _b === void 0 ? void 0 : _b.sendMessage) === null || _c === void 0 ? void 0 : _c.call(_b, serialized).catch(noop);
            // Send message to Content Script
            (_d = browser.tabs) === null || _d === void 0 ? void 0 : _d.query({ discarded: false }).then((tabs) => {
                for (const tab of tabs) {
                    if (tab.id !== undefined)
                        browser.tabs.sendMessage(tab.id, serialized).catch(noop);
                }
            });
        }
        if (this.sendToSelf) {
            this.listener(serialized);
        }
    }
    /**
     * Should MessageCenter prints all messages to console?
     */
    writeToConsole(on) {
        this.log = on;
        return this;
    }
}
//# sourceMappingURL=MessageCenter.js.map

/***/ }),

/***/ 506:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return LiveSelectorDevtoolsEnhancer; });
/* harmony import */ var jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _DOM_LiveSelector__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(316);


class LiveSelectorDevtoolsEnhancer {
    hasBody(obj) {
        if (obj instanceof _DOM_LiveSelector__WEBPACK_IMPORTED_MODULE_1__[/* LiveSelector */ "a"])
            return true;
        return false;
    }
    body(obj) {
        const priv = LiveSelectorDevtoolsEnhancer.getPrivateItems(obj);
        return (jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", null,
            this.displayInitialElements(obj),
            this.displaySelectorChain(obj),
            jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("br", null),
            jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", { variant: ['bigint'] }, "Actions:"),
            jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", { onClick: () => console.log(priv.stack) }, "\uD83D\uDC40 See who created this LiveSelector"),
            jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", { onClick: () => console.log(obj.evaluate()) }, "\uD83E\uDDEE Evaluate this LiveSelector")));
    }
    header(obj) {
        if (!(obj instanceof _DOM_LiveSelector__WEBPACK_IMPORTED_MODULE_1__[/* LiveSelector */ "a"]))
            return null;
        return (jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("div", null,
            "LiveSelector",
            ' ',
            jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("code", { variant: ['fade'] }, LiveSelectorDevtoolsEnhancer.getPrivateItems(obj).single ? ' (SingleMode)' : null)));
    }
    displayInitialElements(obj) {
        const maxDisplayItems = 7;
        const priv = LiveSelectorDevtoolsEnhancer.getPrivateItems(obj);
        const jsx = [];
        for (const i in priv.initialElements) {
            const index = parseInt(i);
            const _ = priv.initialElements[i];
            if (index === maxDisplayItems && priv.initialElements.length > maxDisplayItems) {
                jsx.push(jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", { style: { opacity: 0.7 } },
                    "and ",
                    priv.initialElements.length - maxDisplayItems,
                    " more"));
                break;
            }
            jsx.push(jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", null,
                jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("object", { object: _ }),
                index === priv.initialElements.length - 1 ? '' : jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", { style: { opacity: 0.7 } }, ", ")));
        }
        return (jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", null,
            jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", null, "["),
            jsx,
            jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", null, "]"),
            jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", { style: { marginLeft: '0.5em', opacity: 0.7, fontStyle: 'italic' } },
                "(initial elements",
                priv.initialElements.length > maxDisplayItems ? jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("object", { object: priv.initialElements }) : '',
                ")")));
    }
    displaySelectorChain(obj) {
        const priv = LiveSelectorDevtoolsEnhancer.getPrivateItems(obj);
        return (jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("table", { style: { marginLeft: '1em' } }, priv.selectorChain.map(chain => (jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("tr", null,
            jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("td", null, "|"),
            jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("td", { variant: ['propertyName'] }, chain.type),
            jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("td", null, Array.isArray(chain.param) ? (chain.param.map((paramI, index, params) => (jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", null,
                jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("object", { object: paramI }),
                index === params.length - 1 ? '' : jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("span", { style: { opacity: 0.7 } }, ", "))))) : (jsx_jsonml_devtools_renderer__WEBPACK_IMPORTED_MODULE_0__["createElement"]("object", { object: chain.param }))))))));
    }
    static getPrivateItems(obj) {
        var _a;
        return {
            // @ts-ignore
            single: obj.isSingleMode,
            // @ts-ignore
            initialElements: obj.initialElements,
            // @ts-ignore
            stack: (_a = obj.stack) !== null && _a !== void 0 ? _a : '',
            // @ts-ignore
            selectorChain: obj.selectorChain,
        };
    }
}
//# sourceMappingURL=LiveSelectorDevtoolsEnhancer.js.map

/***/ }),

/***/ 508:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return MutationObserverWatcher; });
/* harmony import */ var _Watcher__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(279);

/**
 * A watcher based on MutationObserver
 *
 * @example
 * ```ts
 * new MutationObserverWatcher(ls)
 *     .useForeach(node => {
 *         console.log(node)
 *     })
 *     .startWatch()
 * ```
 */
class MutationObserverWatcher extends _Watcher__WEBPACK_IMPORTED_MODULE_0__[/* Watcher */ "a"] {
    constructor(
    /** LiveSelector that this object holds */
    liveSelector, 
    /**
     * If you know the element is always inside of a node, set this option.
     * This may improve performance.
     */
    consistentWatchRoot = document.body, 
    /**
     * Call stopWatch() when the consistentWatchRoot disconnected.
     */
    stopWatchOnDisconnected = false) {
        super(liveSelector);
        this.liveSelector = liveSelector;
        this.consistentWatchRoot = consistentWatchRoot;
        this.stopWatchOnDisconnected = stopWatchOnDisconnected;
        /** Observe whole document change */
        this.observer = new MutationObserver((mutations, observer) => {
            if (this.consistentWatchRoot.isConnected === false && this.stopWatchOnDisconnected === true) {
                return this.stopWatch();
            }
            this.requestIdleCallback(this.scheduleWatcherCheck);
        });
        setTimeout(this._warning_forget_watch_.warn, 5000);
    }
    /**
     * Start an MutationObserverWatcher.
     *
     * @remarks
     * You must provide a reasonable MutationObserverInit to reduce dom events.
     *
     * https://mdn.io/MutationObserverInit
     */
    startWatch(options) {
        super.startWatch();
        this.isWatching = true;
        const watch = (root) => {
            this.observer.observe(root || document.body, options);
            this.scheduleWatcherCheck();
        };
        if (document.readyState !== 'complete' && this.consistentWatchRoot === null) {
            document.addEventListener('readystatechange', () => document.readyState !== 'complete' && watch());
        }
        else
            watch(this.consistentWatchRoot);
        return this;
    }
    defaultStarterForThen() {
        if (!this.isWatching)
            this.startWatch({ subtree: true, childList: true, characterData: true });
    }
    /**
     * {@inheritdoc Watcher.stopWatch}
     */
    stopWatch() {
        super.stopWatch();
        this.observer.disconnect();
    }
}
//# sourceMappingURL=MutationObserverWatcher.js.map

/***/ }),

/***/ 54:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return GetContext; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Environment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return getEnvironment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return printEnvironment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return OnlyRunInContext; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return assertEnvironment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return assertNotEnvironment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return isEnvironment; });
/**
 * Get current running context.
 * @deprecated Use getExtensionEnvironment(), remove in 0.9.0
 * @remarks
 * - background: background script
 * - content: content script
 * - webpage: a normal webpage
 * - unknown: unknown context
 */
function GetContext() {
    var _a, _b, _c, _d, _e;
    if (typeof location === 'undefined')
        return 'unknown';
    if (typeof browser !== 'undefined' && browser !== null) {
        const scheme = location.protocol.match('-extension');
        const backgroundURL = (_d = (_c = (_b = (_a = browser.extension) === null || _a === void 0 ? void 0 : _a.getBackgroundPage) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.location) === null || _d === void 0 ? void 0 : _d.href;
        if (scheme || location.hostname === 'localhost') {
            if (backgroundURL === location.href ||
                ['generated', 'background', 'page', '.html'].every((x) => location.pathname.match(x)))
                return 'background';
        }
        if (scheme)
            return 'options';
        if (((_e = browser.runtime) === null || _e === void 0 ? void 0 : _e.getManifest) !== undefined)
            return 'content';
    }
    if (location.hostname === 'localhost')
        return 'debugging';
    return 'webpage';
}
/** Current running environment of Web Extension */
var Environment;
(function (Environment) {
    /** has browser as a global variable */ Environment[Environment["HasBrowserAPI"] = 2] = "HasBrowserAPI";
    /** URL protocol ends with "-extension:" */ Environment[Environment["ExtensionProtocol"] = 4] = "ExtensionProtocol";
    /** Current running context is Content Script */ Environment[Environment["ContentScript"] = 8] = "ContentScript";
    // userScript = 1 << 4,
    /** URL is listed in the manifest.background or generated background page */ Environment[Environment["ManifestBackground"] = 64] = "ManifestBackground";
    /** URL is listed in the manifest.options_ui */ Environment[Environment["ManifestOptions"] = 128] = "ManifestOptions";
    /** URL is listed in the manifest.browser_action */ Environment[Environment["ManifestBrowserAction"] = 256] = "ManifestBrowserAction";
    /**
     * URL is listed in the manifest.page_action
     * @deprecated Suggest to define browser_action instead.
     */ Environment[Environment["ManifestPageAction"] = 512] = "ManifestPageAction";
    /** URL is listed in the manifest.devtools_page */ Environment[Environment["ManifestDevTools"] = 1024] = "ManifestDevTools";
    /** URL is listed in the manifest.sidebar_action. Firefox Only */ Environment[Environment["ManifestSidebar"] = 2048] = "ManifestSidebar";
    /** URL is listed in the manifest.chrome_url_overrides.newtab */ Environment[Environment["ManifestOverridesNewTab"] = 4096] = "ManifestOverridesNewTab";
    /** URL is listed in the manifest.chrome_url_overrides.bookmarks */ Environment[Environment["ManifestOverridesBookmarks"] = 8192] = "ManifestOverridesBookmarks";
    /** URL is listed in the manifest.chrome_url_overrides.history */ Environment[Environment["ManifestOverridesHistory"] = 16384] = "ManifestOverridesHistory";
    // DO NOT USE value that bigger than 1 << 20
})(Environment || (Environment = {}));
let result;
/**
 * Get the current running environment
 * @remarks You can use the global variable `__holoflows_kit_get_environment_debug__` to overwrite the return value if the current hostname is localhost or 127.0.0.1
 */
function getEnvironment() {
    var _a, _b, _c, _d, _e;
    if (result !== undefined)
        return result;
    try {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            const val = __holoflows_kit_get_environment_debug__;
            if (val !== undefined)
                return Number(val);
        }
    }
    catch (_f) { }
    let flag = 0;
    // Scheme test
    try {
        const scheme = location.protocol;
        if (scheme.endsWith('-extension:'))
            flag |= Environment.ExtensionProtocol;
    }
    catch (_g) { }
    // Browser API test
    if (typeof browser !== 'undefined' && browser !== null) {
        flag |= Environment.HasBrowserAPI;
        if (!(flag & Environment.ExtensionProtocol))
            flag |= Environment.ContentScript;
        else {
            try {
                const manifest = browser.runtime.getManifest();
                const current = location.pathname;
                const background = ((_a = manifest.background) === null || _a === void 0 ? void 0 : _a.page) || manifest.background_page || '/_generated_background_page.html';
                const options = ((_b = manifest.options_ui) === null || _b === void 0 ? void 0 : _b.page) || manifest.options_page;
                if (current === normalize(background))
                    flag |= Environment.ManifestBackground;
                // TODO: this property support i18n. What will I get when call browser.runtime.getManifest()?
                if (current === normalize((_c = manifest.browser_action) === null || _c === void 0 ? void 0 : _c.default_popup))
                    flag |= Environment.ManifestBrowserAction;
                if (current === normalize((_d = manifest.sidebar_action) === null || _d === void 0 ? void 0 : _d.default_panel))
                    flag |= Environment.ManifestSidebar;
                if (current === normalize(options))
                    flag |= Environment.ManifestOptions;
                if (current === normalize(manifest.devtools_page))
                    flag |= Environment.ManifestDevTools;
                if (current === normalize((_e = manifest.page_action) === null || _e === void 0 ? void 0 : _e.default_popup))
                    flag |= Environment.ManifestPageAction;
                // TODO: this property support i18n.
                const { bookmarks, history, newtab } = manifest.chrome_url_overrides || {};
                if (current === normalize(bookmarks))
                    flag |= Environment.ManifestOverridesBookmarks;
                if (current === normalize(history))
                    flag |= Environment.ManifestOverridesHistory;
                if (current === normalize(newtab))
                    flag |= Environment.ManifestOverridesNewTab;
            }
            catch (_h) { }
        }
    }
    return (result = flag);
    function normalize(x) {
        if (x === undefined)
            return '_';
        try {
            // on firefox it is a full qualified URL
            return new URL(x).pathname;
        }
        catch (_a) {
            // on chrome it is unmodified
            if (x[0] !== '/')
                return '/' + x;
            return x;
        }
    }
}
/**
 * Print the Environment bit flag in a human-readable format
 * @param e - Printing environment bit flag
 */
function printEnvironment(e = getEnvironment()) {
    const flag = [];
    if (Environment.ContentScript & e)
        flag.push('ContentScript');
    if (Environment.ExtensionProtocol & e)
        flag.push('ExtensionProtocol');
    if (Environment.HasBrowserAPI & e)
        flag.push('HasBrowserAPI');
    if (Environment.ManifestBackground & e)
        flag.push('ManifestBackground');
    if (Environment.ManifestDevTools & e)
        flag.push('ManifestDevTools');
    if (Environment.ManifestOptions & e)
        flag.push('ManifestOptions');
    if (Environment.ManifestPageAction & e)
        flag.push('ManifestPageAction');
    if (Environment.ManifestOverridesBookmarks & e)
        flag.push('ManifestOverridesBookmarks');
    if (Environment.ManifestOverridesHistory & e)
        flag.push('ManifestOverridesHistory');
    if (Environment.ManifestOverridesNewTab & e)
        flag.push('ManifestOverridesNewTab');
    if (Environment.ManifestBrowserAction & e)
        flag.push('ManifestBrowserAction');
    if (Environment.ManifestSidebar & e)
        flag.push('ManifestSidebar');
    return flag.join('|');
}
function OnlyRunInContext(context, name) {
    const ctx = GetContext();
    if (Array.isArray(context) ? context.indexOf(ctx) === -1 : context !== ctx) {
        if (typeof name === 'string')
            throw new TypeError(`${name} run in the wrong context. (Wanted ${context}, actually ${ctx})`);
        else
            return false;
    }
    return true;
}
/**
 * Assert the current environment satisfy the expectation
 * @param env The expected environment
 */
function assertEnvironment(env) {
    if (!isEnvironment(env))
        throw new TypeError(`Running in the wrong context, (expected ${printEnvironment(env)}, actually ${printEnvironment()})`);
}
assertEnvironment.oneOf = (...args) => {
    return assertEnvironment(args.reduce((p, c) => p | c));
};
assertEnvironment.allOf = (...args) => {
    return args.map(assertEnvironment);
};
/**
 * Assert the current environment NOT satisfy the rejected flags
 * @param env The rejected environment
 */
function assertNotEnvironment(env) {
    if (getEnvironment() & env)
        throw new TypeError(`Running in wrong context, (expected not match ${printEnvironment(env)}, actually ${printEnvironment()})`);
}
assertNotEnvironment.oneOf = (...args) => {
    return assertNotEnvironment(args.reduce((p, c) => p | c));
};
assertNotEnvironment.allOf = (...args) => {
    return args.map(assertNotEnvironment);
};
/**
 * Check if the current environment satisfy the expectation
 * @param env The expectation environment
 */
function isEnvironment(env) {
    const now = getEnvironment();
    return Boolean(env & now);
}
isEnvironment.oneOf = (...args) => {
    return isEnvironment(args.reduce((p, c) => p | c));
};
isEnvironment.allOf = (...args) => {
    return args.map(isEnvironment);
};
//# sourceMappingURL=Context.js.map

/***/ }),

/***/ 562:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = __webpack_require__(395);
// more grayscale algorithm:
// http://www.tannerhelland.com/3643/grayscale-image-algorithm-vb6/
var GrayscaleAlgorithm;
(function (GrayscaleAlgorithm) {
    GrayscaleAlgorithm["NONE"] = "NONE";
    GrayscaleAlgorithm["AVERAGE"] = "AVG";
    GrayscaleAlgorithm["LUMINANCE"] = "LUMA";
    GrayscaleAlgorithm["LUMINANCE_II"] = "LUMA_II";
    GrayscaleAlgorithm["DESATURATION"] = "DESATURATION";
    GrayscaleAlgorithm["MAX_DECOMPOSITION"] = "MAX_DE";
    GrayscaleAlgorithm["MIN_DECOMPOSITION"] = "MIN_DE";
    GrayscaleAlgorithm["MID_DECOMPOSITION"] = "MID_DE";
    GrayscaleAlgorithm["SIGNLE_R"] = "R";
    GrayscaleAlgorithm["SIGNLE_G"] = "G";
    GrayscaleAlgorithm["SIGNLE_B"] = "B";
})(GrayscaleAlgorithm = exports.GrayscaleAlgorithm || (exports.GrayscaleAlgorithm = {}));
function grayscale(r, g, b, algorithm) {
    switch (algorithm) {
        case GrayscaleAlgorithm.AVERAGE:
            return (r + g + b) / 3;
        case GrayscaleAlgorithm.LUMINANCE:
            return r * 0.3 + g * 0.59 + b * 0.11;
        case GrayscaleAlgorithm.LUMINANCE_II:
            return r * 0.2126 + g * 0.7152 + b * 0.0722;
        case GrayscaleAlgorithm.DESATURATION:
            return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
        case GrayscaleAlgorithm.MAX_DECOMPOSITION:
            return Math.max(r, g, b);
        case GrayscaleAlgorithm.MIN_DECOMPOSITION:
            return Math.min(r, g, b);
        case GrayscaleAlgorithm.MID_DECOMPOSITION:
            return [r, g, b].sort()[1];
        case GrayscaleAlgorithm.SIGNLE_R:
            return r;
        case GrayscaleAlgorithm.SIGNLE_G:
            return g;
        case GrayscaleAlgorithm.SIGNLE_B:
            return b;
        default:
            return 0;
    }
}
exports.grayscale = grayscale;
function shades(r, g, b, size) {
    const factor = 255 / (helper_1.clamp(size, 2, 256) - 1);
    return Math.floor((r + g + b) / 3 / factor + 0.5) * factor;
}
exports.shades = shades;
function narrow(gray, size) {
    return helper_1.clamp(Math.round(gray), size, 255 - size);
}
exports.narrow = narrow;
//# sourceMappingURL=grayscale.js.map

/***/ }),

/***/ 612:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Locator to coord of top left pixel inside block
 * @param locator
 * @param options
 */
function loc2coord({ p, w }, { size }) {
    return [
        (p % Math.floor(w / size)) * size,
        Math.floor(p / Math.floor(w / size)) * size,
    ];
}
exports.loc2coord = loc2coord;
/**
 * Locator to pixel index
 * @param locator
 * @param options
 * @param x1 x coord of top left pixel inside block
 * @param y1 y coord of top left pixel inside block
 * @param index the index of pixel inside block
 */
function loc2idx({ w, c }, { size }, x1, y1, index) {
    const x2 = index % size;
    const y2 = Math.floor(index / size);
    return ((y1 + y2) * w + x1 + x2) * 4 + c;
}
exports.loc2idx = loc2idx;
//# sourceMappingURL=locator.js.map

/***/ }),

/***/ 615:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return IntervalWatcher; });
/* harmony import */ var _Watcher__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(279);

/**
 * A watcher based on time interval.
 *
 * @example
 * ```ts
 * new IntervalWatcher(ls)
 * .useForeach(node => {
 *     console.log(node)
 * })
 * .startWatch(1000)
 * ```
 */
class IntervalWatcher extends _Watcher__WEBPACK_IMPORTED_MODULE_0__[/* Watcher */ "a"] {
    /** Start to watch the LiveSelector at a interval(ms). */
    startWatch(interval) {
        super.startWatch();
        this.timer = setInterval(this.scheduleWatcherCheck, interval);
        return this;
    }
    /**
     * {@inheritdoc Watcher.stopWatch}
     */
    stopWatch() {
        super.stopWatch();
        if (this.timer)
            clearInterval(this.timer);
    }
}
//# sourceMappingURL=IntervalWatcher.js.map

/***/ }),

/***/ 654:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = __importDefault(__webpack_require__(1536));
const DCT = __importStar(__webpack_require__(1537));
var TransformAlgorithm;
(function (TransformAlgorithm) {
    TransformAlgorithm["FFT1D"] = "FFT1D";
    TransformAlgorithm["FFT2D"] = "FFT2D";
    TransformAlgorithm["DCT"] = "DCT";
})(TransformAlgorithm = exports.TransformAlgorithm || (exports.TransformAlgorithm = {}));
function transform(re, im, algorithm, { size }) {
    switch (algorithm) {
        case TransformAlgorithm.FFT1D:
            index_js_1.default.init(size);
            index_js_1.default.fft1d(re, im);
            break;
        case TransformAlgorithm.FFT2D:
            index_js_1.default.init(size);
            index_js_1.default.fft2d(re, im);
            break;
        case TransformAlgorithm.DCT:
            DCT.dct(re, size);
            break;
        default:
            throw new Error(`unknown algorithm: ${algorithm}`);
    }
}
exports.transform = transform;
function inverseTransform(re, im, algorithm, { size }) {
    switch (algorithm) {
        case TransformAlgorithm.FFT1D:
            index_js_1.default.init(size);
            index_js_1.default.ifft1d(re, im);
            break;
        case TransformAlgorithm.FFT2D:
            index_js_1.default.init(size);
            index_js_1.default.ifft2d(re, im);
            break;
        case TransformAlgorithm.DCT:
            DCT.idct(re, size);
            break;
        default:
            throw new Error(`unknown algorithm: ${algorithm}`);
    }
}
exports.inverseTransform = inverseTransform;
//# sourceMappingURL=transform.js.map

/***/ }),

/***/ 799:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = __webpack_require__(395);
const locator_1 = __webpack_require__(612);
function cropImg({ width, height }, { size }) {
    return [
        Math.floor(width / size) * size,
        Math.floor(height / size) * size,
    ];
}
exports.cropImg = cropImg;
function* divideImg({ width, height, data }, { size }) {
    for (let h = 0; h < height; h += size) {
        for (let w = 0; w < width; w += size) {
            if (h + size <= height && w + size <= width) {
                for (let c = 0; c < 3; c += 1) {
                    const block = [];
                    for (let h1 = 0; h1 < size; h1 += 1) {
                        for (let w1 = 0; w1 < size; w1 += 1) {
                            block[h1 * size + w1] = data[((h + h1) * width + w + w1) * 4 + c];
                        }
                    }
                    yield block;
                }
            }
        }
    }
}
exports.divideImg = divideImg;
function visitImgByPixel(imgData, options, visitor) {
    const { width, height, data } = imgData;
    for (let i = 0; i < width * height; i += 1) {
        const p = i * 4;
        visitor([data[p], data[p + 1], data[p + 2], data[p + 3]], p, imgData);
    }
}
exports.visitImgByPixel = visitImgByPixel;
function visitImgByBlock(imgData, options, visitor) {
    const { width: w, height: h } = imgData;
    let c = 0;
    let p = 0;
    let b = 0;
    for (const block of divideImg(imgData, options)) {
        const bitConsumed = visitor(block, { c, p, b, w, h }, imgData);
        c += 1;
        if (bitConsumed) {
            b += 1;
        }
        if (c === 3) {
            p += 1;
            c = 0;
        }
    }
}
exports.visitImgByBlock = visitImgByBlock;
function updateImgByPixel(imgData, options, updater) {
    visitImgByPixel(imgData, options, (pixel, loc) => updateImgByPixelAt(imgData, options, updater(pixel, loc, imgData), loc));
}
exports.updateImgByPixel = updateImgByPixel;
function updateImgByBlock(imgData, options, updater) {
    visitImgByBlock(imgData, options, (block, loc) => {
        const bitConsumed = updater(block, loc, imgData);
        if (bitConsumed) {
            updateImgByBlockAt(imgData, options, block, loc);
        }
        return bitConsumed;
    });
}
exports.updateImgByBlock = updateImgByBlock;
function updateImgByPixelAt(imgData, options, pixel, loc) {
    const { data } = imgData;
    [data[loc], data[loc + 1], data[loc + 2], data[loc + 3]] = pixel;
}
exports.updateImgByPixelAt = updateImgByPixelAt;
function updateImgByBlockAt(imgData, options, block, loc) {
    const { data } = imgData;
    const { size } = options;
    const [x1, y1] = locator_1.loc2coord(loc, options);
    for (let i = 0; i < size * size; i += 1) {
        block[i] = Math.round(block[i]);
        data[locator_1.loc2idx(loc, options, x1, y1, i)] = helper_1.clamp(block[i], 0, 255);
    }
}
exports.updateImgByBlockAt = updateImgByBlockAt;
//# sourceMappingURL=image.js.map

/***/ }),

/***/ 800:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const transform_1 = __webpack_require__(654);
const helper_1 = __webpack_require__(395);
function createAcc({ size, transformAlgorithm }) {
    switch (transformAlgorithm) {
        case transform_1.TransformAlgorithm.FFT1D:
            return {
                prevPos: -1,
                prevCode: '',
                indices: helper_1.squareCircleIntersect(size, 3),
            };
        default:
            return {
                prevPos: -1,
                prevCode: '',
                indices: [],
            };
    }
}
exports.createAcc = createAcc;
function getPosFromAcc(acc, { c }, { pass }) {
    const { prevCode, prevPos, indices } = acc;
    if (c !== 0) {
        return prevPos;
    }
    const [index, code] = helper_1.hashCode(`${pass}_${prevCode}`, indices.length, []);
    acc.prevCode = code;
    acc.prevPos = indices[index];
    return indices[index];
}
exports.getPosFromAcc = getPosFromAcc;
function getPos(acc, loc, options) {
    const { pass, size, transformAlgorithm } = options;
    switch (transformAlgorithm) {
        case transform_1.TransformAlgorithm.FFT1D:
            return pass ? getPosFromAcc(acc, loc, options) : (size * size + size) / 2;
        case transform_1.TransformAlgorithm.FFT2D:
            return 0;
        case transform_1.TransformAlgorithm.DCT:
            return 0;
        default:
            throw new Error(`unknown algortihm: ${transformAlgorithm}`);
    }
}
exports.getPos = getPos;
//# sourceMappingURL=position.js.map

/***/ }),

/***/ 809:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* reexport */ attachment_namespaceObject; });

// NAMESPACE OBJECT: ./node_modules/@dimensiondev/common-protocols/esm/attachment/index.js
var attachment_namespaceObject = {};
__webpack_require__.r(attachment_namespaceObject);
__webpack_require__.d(attachment_namespaceObject, "encode", function() { return encode; });
__webpack_require__.d(attachment_namespaceObject, "decode", function() { return decode; });
__webpack_require__.d(attachment_namespaceObject, "getPayload", function() { return getPayload; });
__webpack_require__.d(attachment_namespaceObject, "loadKey", function() { return loadKey; });
__webpack_require__.d(attachment_namespaceObject, "checksum", function() { return checksum; });

// EXTERNAL MODULE: ./node_modules/@msgpack/msgpack/dist.es5/msgpack.min.js
var msgpack_min = __webpack_require__(484);

// CONCATENATED MODULE: ./node_modules/@dimensiondev/common-protocols/esm/attachment/utils.js
async function checksum(block) {
    const hashed = await crypto.subtle.digest({ name: "SHA-256" }, block);
    return new Uint8Array(hashed);
}
async function loadKey(passphrase, salt) {
    const key = await crypto.subtle.importKey("raw", passphrase, { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
    return crypto.subtle.deriveKey({
        name: "PBKDF2",
        salt,
        iterations: 1000,
        hash: "SHA-256",
    }, key, { name: "AES-GCM", length: 128 }, true, ["encrypt", "decrypt"]);
}
//# sourceMappingURL=utils.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/common-protocols/esm/attachment/types.js
const MAGIC_HEADER = new TextEncoder().encode("MASKBOOK-ATTACHMENT");
//# sourceMappingURL=types.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/common-protocols/esm/attachment/encoder.js



async function encode(passphrase, input) {
    let algorithm, salt, block, keyHash;
    if (passphrase === undefined) {
        block = input.block;
    }
    else {
        keyHash = await checksum(passphrase);
        salt = crypto.getRandomValues(new Uint8Array(8));
        const key = await loadKey(passphrase, salt);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        algorithm = { name: "AES-GCM", iv, tagLength: 128 };
        const encrypted = await crypto.subtle.encrypt(algorithm, key, input.block);
        block = new Uint8Array(encrypted);
    }
    const payload = {
        version: 0,
        mime: input.mime,
        metadata: input.metadata,
        algorithm,
        salt,
        keyHash,
        block,
        blockHash: await checksum(block),
    };
    return Uint8Array.from([...MAGIC_HEADER, ...Object(msgpack_min["encode"])(payload)]);
}
//# sourceMappingURL=encoder.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/common-protocols/esm/utils.js
function bufferEqual(buf1, buf2) {
    if (buf1 === buf2) {
        return true;
    }
    else if (buf1.byteLength !== buf2.byteLength) {
        return false;
    }
    let i = buf1.byteLength;
    while (i--) {
        if (buf1[i] !== buf2[i]) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=utils.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/common-protocols/esm/attachment/payload.js




async function getPayload(passphrase, encoded) {
    if (!bufferEqual(MAGIC_HEADER, encoded.slice(0, MAGIC_HEADER.length))) {
        throw new Error("unexpected magic header.");
    }
    const buffer = encoded.slice(MAGIC_HEADER.length);
    const payload = Object(msgpack_min["decode"])(buffer);
    if (payload.version !== 0) {
        throw new Error("unexpected file version.");
    }
    else if (payload.mime.length === 0) {
        throw new Error("unexpected `.mime`.");
    }
    else if (!bufferEqual(payload.blockHash, await checksum(payload.block))) {
        throw new Error("unexpected `blockHash`.");
    }
    else if (passphrase && payload.keyHash) {
        if (!bufferEqual(payload.keyHash, await checksum(passphrase))) {
            throw new Error("unexpected `keyHash`.");
        }
    }
    return payload;
}
//# sourceMappingURL=payload.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/common-protocols/esm/attachment/decoder.js


async function decode(passphrase, encoded) {
    const payload = await getPayload(passphrase, encoded);
    let block = payload.block;
    if (passphrase && payload.algorithm && payload.salt) {
        const data = await crypto.subtle.decrypt(payload.algorithm, await loadKey(passphrase, payload.salt), payload.block);
        block = new Uint8Array(data);
    }
    return {
        mime: payload.mime,
        metadata: payload.metadata,
        block,
    };
}
//# sourceMappingURL=decoder.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/common-protocols/esm/attachment/index.js




//# sourceMappingURL=index.js.map
// CONCATENATED MODULE: ./node_modules/@dimensiondev/common-protocols/esm/index.js


//# sourceMappingURL=index.js.map

/***/ }),

/***/ 831:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/* harmony default export */ __webpack_exports__["a"] = (freeGlobal);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(85)))

/***/ })

}]);