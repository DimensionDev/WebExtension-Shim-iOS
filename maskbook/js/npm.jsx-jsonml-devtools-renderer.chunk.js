(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[81],{

/***/ 24:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "installCustomObjectFormatter", function() { return installCustomObjectFormatter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Fragment", function() { return Fragment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isJSXElement", function() { return isJSXElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createElementTyped", function() { return createElementTyped; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createElement", function() { return createElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "useState", function() { return useState; });
var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
/// <reference path="./global.d.ts" />
/**
 * @see: https://docs.google.com/document/d/1FTascZXT9cxfetuPRT2eXPQKXui4nWFivUnS_335T3U/preview
 */
//#region Internal Symbols
const JSX_Symbol = Symbol.for('JSON ML <=> JSX internal Symbol');
/**
 * Install a Custom Object Formatter
 * @param formatter The formatter
 */
function installCustomObjectFormatter(formatter) {
    try {
        const old = new Set(window.devtoolsFormatters || []);
        old.add(formatter);
        window.devtoolsFormatters = Array.from(old);
    }
    catch (e) {
        console.error('Install custom object formatter failed.', e);
    }
}
//#endregion
//#region Core renderer
const Fragment = 'span';
function isJSXElement(x) {
    return Array.isArray(x) && Reflect.get(x, JSX_Symbol);
}
function createElementTyped(tag, _props, ..._) {
    if (typeof tag === 'function')
        return tag(Object.assign({}, _props, { children: _ }));
    // If object has children, Chrome will not render it normally
    if (tag === 'object')
        _ = [];
    const props = (_props || {});
    if (customElements.has(tag)) {
        const handler = customElements.get(tag);
        if (typeof handler === 'function')
            return handler(props, ..._);
        else {
            const _a = props, { style } = _a, rest = __rest(_a, ["style"]);
            return createElementTyped(handler[0], Object.assign({ style: normalizeStyle(handler[1]) + normalizeStyle(style) }, rest), ..._);
        }
    }
    // Handle themes
    if ('variant' in props && props.variant) {
        const theme = matchMedia(`(prefers-color-scheme: dark)`).matches ? darkTheme : lightTheme;
        const presetStyles = props.variant.map((type) => theme[type]);
        props.style = Object.assign({}, ...presetStyles, props.style);
    }
    // Transform CSS.PropertiesHyphen into string
    if ('style' in props) {
        props.style = normalizeStyle(props.style);
    }
    // Transform onClick
    if ('onClick' in props) {
        installCustomObjectFormatter(new onClickHandler());
        const { onClick } = props, nextProps = __rest(props, ["onClick"]);
        const specObject = onClickHandler.make(createElementTyped(tag, nextProps, ..._), onClick);
        return createElementTyped(tag, null, createElementTyped('object', { object: specObject }));
    }
    const children = [];
    for (const child of _) {
        // If child is null, omit it.
        if (child === null)
            continue;
        // Add primitive values and JSX.Element as a child
        if (isRenderableJSONML(child)) {
            children.push(child);
            continue;
        }
        // If child is an Array, and every of its child is JSX.Element
        // though it as pattern like {arr.map(x => <div />)}
        if (Array.isArray(child)) {
            if (child.every((x) => isRenderableJSONML(x))) {
                children.push(...child);
                continue;
            }
        }
        // Else, display non-primitive values as devtools raw formatter
        children.push(['object', { object: child }]);
    }
    // <object> cannot have children, or it will not render normally.
    if (children.length === 0 && tag !== 'object')
        children.push('');
    // @ts-ignore
    if (tag === 'object' && props.object === undefined) {
        return createElementTyped('span', { variant: ['propertyPreviewName'] }, 'undefined');
    }
    return makeArrayToJSXElement([tag, props, ...children]);
}
const createElement = createElementTyped;
//#endregion
//#region Non-standard elements and attributes
/**
 * Handler for onClick event
 */
const clickable = new WeakMap();
class onClickHandler {
    constructor() {
        if (onClickHandler.instance)
            return onClickHandler.instance;
        onClickHandler.instance = this;
    }
    static make(jsx, onClick) {
        const self = {};
        clickable.set(self, () => [jsx, onClick, self]);
        return self;
    }
    hasBody(obj) {
        return clickable.has(obj);
    }
    body(obj, config) {
        const [jsx, f, ref] = clickable.get(obj)();
        f();
        return createElementTyped('div', {}, createElementTyped('object', { object: ref }));
    }
    header(obj) {
        if (this.hasBody(obj)) {
            const [jsx] = clickable.get(obj)();
            return jsx;
        }
        return null;
    }
}
//#endregion
//#region Helper
function makeArrayToJSXElement(x) {
    Reflect.set(x, JSX_Symbol, true);
    return x;
}
function isRenderableJSONML(x) {
    if (isJSXElement(x))
        return true;
    // We will ignore the `null` value
    if (x === null)
        return true;
    if (typeof x === 'object')
        return false;
    return true;
}
function normalizeStyle(style) {
    if (style === undefined)
        return '';
    if (typeof style === 'string')
        return style + ';';
    return (Object.keys(style)
        .map((k) => 
    // Transform propertyName to property-name
    k.replace(/([a-z][A-Z])/g, function (g) {
        return g[0] + '-' + g[1].toLowerCase();
    }) +
        ': ' +
        style[k])
        .join(';') + ';');
}
//#endregion
//#region Keep states
const objectMap = new WeakMap();
function useState(bindingObject, initialState) {
    if (typeof bindingObject !== 'object' || bindingObject === null) {
        throw new Error('Can not bind state to a non-object');
    }
    let state;
    if (objectMap.has(bindingObject))
        state = objectMap.get(bindingObject);
    else
        state = initialState ? initialState(bindingObject) : {};
    objectMap.set(bindingObject, state);
    return [
        state,
        function setState(nextState) {
            state = Object.assign(state, nextState);
            objectMap.set(bindingObject, state);
        },
        function forceRender() {
            console.clear();
            console.log(bindingObject);
        },
    ];
}
//#endregion
//#region Common CSS
const codeBlock = { fontStyle: 'italic', fontFamily: 'monospace' };
const dimmed = { opacity: 0.6 };
const darkTheme = {
    propertyPreviewName: { color: 'rgb(169, 169, 169)' },
    functionPrefix: { color: 'rgb(85, 106, 242)' },
    propertyName: { color: 'rgb(227, 110, 236)' },
    null: { color: 'rgb(127, 127, 127)' },
    bigint: { color: 'rgb(158, 255, 158)' },
    number: { color: 'hsl(252, 100%, 75%)' },
    string: { color: 'rgb(233, 63, 59)', whiteSpace: 'pre', 'unicode-bidi': '-webkit-isolate' },
    quote: { color: 'rgb(213, 213, 213)' },
    node: { color: 'rgb(189, 198, 207)' },
    fade: dimmed,
    code: codeBlock,
};
const lightTheme = {
    propertyPreviewName: { color: '#565656' },
    functionPrefix: { color: 'rgb(13, 34, 170)' },
    propertyName: { color: 'rgb(136, 19, 145)' },
    null: { color: 'rgb(128, 128, 128)' },
    bigint: { color: 'rgb(0, 93, 0)' },
    number: { color: 'rgb(28, 0, 207)' },
    string: { color: 'rgb(196, 26, 22)', whiteSpace: 'pre', 'unicode-bidi': '-webkit-isolate' },
    quote: { color: '#222' },
    node: { color: 'rgb(48, 57, 66)' },
    fade: dimmed,
    code: codeBlock,
};
//#endregion
//#region custom elements
const customElements = new Map();
customElements.set('code', ['span', codeBlock]);
customElements.set('br', ['div', { display: 'block', marginTop: '0.5em' }]);
customElements.set('img', (_props = {}, ...children) => {
    const { height = 'initial', src, width = 'initial', style } = _props, props = __rest(_props, ["height", "src", "width", "style"]);
    try {
        const url = new URL(src, location.href);
        return createElement('span', Object.assign({ style: Object.assign({ content: `url("${url.toJSON()}")`, width: typeof width === 'number' ? width + 'px' : width, height: typeof height === 'number' ? height + 'px' : height }, (style || {})) }, props));
    }
    catch (e) {
        console.error(e, src);
        return createElement('span', {}, e && e.message);
    }
});
//#endregion
//# sourceMappingURL=index.js.map

/***/ })

}]);