(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[185],{

/***/ 646:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resolveTCOLink", function() { return resolveTCOLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "fetch", function() { return fetch; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "saveAsFile", function() { return saveAsFile; });
/* harmony import */ var _utils_memoize__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(138);

const cache = new Map();
const resolveTCOLink = Object(_utils_memoize__WEBPACK_IMPORTED_MODULE_0__[/* memoizePromise */ "a"])(async (u) => {
    if (!u.startsWith('https://t.co/'))
        return null;
    if (cache.has(u))
        return cache.get(u);
    const req = await globalThis.fetch(u, {
        redirect: 'error',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
    });
    const text = await req.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const dom = doc.querySelector('noscript > meta');
    if (!dom)
        return null;
    const [, url] = dom.content.split('URL=');
    if (url)
        cache.set(u, url);
    return url !== null && url !== void 0 ? url : null;
}, (x) => x);
function fetch(url) {
    return globalThis.fetch(url).then((x) => x.blob());
}
function saveAsFile(file, mineType, suggestingFileName) {
    const blob = new Blob([file], { type: mineType });
    const url = URL.createObjectURL(blob);
    return browser.downloads.download({
        url,
        filename: suggestingFileName,
        saveAs: true,
    });
}


/***/ })

}]);