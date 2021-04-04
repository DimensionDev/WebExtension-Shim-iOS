(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[186],{

/***/ 1836:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "encodeImage", function() { return /* binding */ encodeImage; });
__webpack_require__.d(__webpack_exports__, "decodeImage", function() { return /* binding */ decodeImage; });
__webpack_require__.d(__webpack_exports__, "decodeImageUrl", function() { return /* binding */ decodeImageUrl; });

// EXTERNAL MODULE: ./node_modules/@dimensiondev/stego-js/cjs/dom.js
var dom = __webpack_require__(1575);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/stego-js/cjs/grayscale.js
var grayscale = __webpack_require__(562);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/stego-js/cjs/transform.js
var transform = __webpack_require__(654);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/utils.ts
var utils = __webpack_require__(12);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/memoize.ts
var memoize = __webpack_require__(138);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/stego-js/cjs/helper.js
var helper = __webpack_require__(395);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/image.ts
/* eslint-disable no-bitwise */

function getDimension(buf) {
    var _a;
    const fallback = {
        width: 0,
        height: 0,
    };
    switch (Object(helper["imgType"])(new Uint8Array(buf))) {
        case 'image/jpeg':
            return (_a = getDimensionAsJPEG(buf)) !== null && _a !== void 0 ? _a : fallback;
        case 'image/png':
            return getDimensionAsPNG(buf);
        default:
            return fallback;
    }
}
function getDimensionAsPNG(buf) {
    const dataView = new DataView(buf, 0, 28);
    return {
        width: dataView.getInt32(16),
        height: dataView.getInt32(20),
    };
}
/**
 * Get dimension of a JPEG image
 *
 * @see http://vip.sugovica.hu/Sardi/kepnezo/JPEG%20File%20Layout%20and%20Format.htm
 */
function getDimensionAsJPEG(buf) {
    const dataView = new DataView(buf);
    let i = 0;
    if (dataView.getUint8(i) === 0xff &&
        dataView.getUint8(i + 1) === 0xd8 && // SOI marker
        dataView.getUint8(i + 2) === 0xff &&
        dataView.getUint8(i + 3) === 0xe0 // APP0 marker
    ) {
        i += 4;
        if (dataView.getUint8(i + 2) === 'J'.charCodeAt(0) &&
            dataView.getUint8(i + 3) === 'F'.charCodeAt(0) &&
            dataView.getUint8(i + 4) === 'I'.charCodeAt(0) &&
            dataView.getUint8(i + 5) === 'F'.charCodeAt(0) &&
            dataView.getUint8(i + 6) === 0x00) {
            let block_length = dataView.getUint8(i) * 256 + dataView.getUint8(i + 1);
            while (i < dataView.byteLength) {
                i += block_length;
                if (i >= dataView.byteLength)
                    return;
                if (dataView.getUint8(i) !== 0xff)
                    return;
                if (dataView.getUint8(i + 1) === 0xc0 || // SOF0 marker
                    dataView.getUint8(i + 1) === 0xc2 // SOF2 marker
                ) {
                    return {
                        height: dataView.getUint8(i + 5) * 256 + dataView.getUint8(i + 6),
                        width: dataView.getUint8(i + 7) * 256 + dataView.getUint8(i + 8),
                    };
                }
                else {
                    i += 2;
                    block_length = dataView.getUint8(i) * 256 + dataView.getUint8(i + 1);
                }
            }
        }
    }
    return;
}

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/String-ArrayBuffer.ts
var String_ArrayBuffer = __webpack_require__(62);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/Context.js
var Context = __webpack_require__(54);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/background-script/SteganographyService.ts








Object(Context["d" /* assertEnvironment */])(Context["a" /* Environment */].ManifestBackground);
const dimensionPreset = [
    {
        width: 1024,
        height: 1240,
        mask: 'v1',
    },
    {
        width: 1200,
        height: 681,
        mask: 'v2',
    },
    {
        width: 1200,
        height: 680,
        mask: 'transparent',
    },
    {
        width: 1000,
        height: 558,
        mask: 'transparent',
    },
];
const defaultOptions = {
    size: 8,
    narrow: 0,
    copies: 3,
    tolerance: 128,
};
const isSameDimension = (dimension, otherDimension) => dimension.width === otherDimension.width && dimension.height === otherDimension.height;
const getMaskBuf = Object(memoize["a" /* memoizePromise */])(async (type) => (await Object(utils["h" /* downloadUrl */])(Object(utils["i" /* getUrl */])(`/image-payload/mask-${type}.png`))).arrayBuffer(), undefined);
async function encodeImage(buf, options) {
    const { template } = options;
    const _buf = typeof buf === 'string' ? Object(String_ArrayBuffer["a" /* decodeArrayBuffer */])(buf) : buf;
    return Object(String_ArrayBuffer["c" /* encodeArrayBuffer */])(await Object(dom["encode"])(_buf, await getMaskBuf(template === 'v2' ? template : 'transparent'), {
        ...defaultOptions,
        fakeMaskPixels: false,
        cropEdgePixels: template !== 'v2' && template !== 'v3',
        exhaustPixels: true,
        grayscaleAlgorithm: template === 'v3' ? grayscale["GrayscaleAlgorithm"].LUMINANCE : grayscale["GrayscaleAlgorithm"].NONE,
        transformAlgorithm: transform["TransformAlgorithm"].FFT1D,
        ...options,
    }));
}
async function decodeImage(buf, options) {
    const _buf = typeof buf === 'string' ? Object(String_ArrayBuffer["a" /* decodeArrayBuffer */])(buf) : buf;
    const _dimension = getDimension(_buf);
    const preset = dimensionPreset.find((d) => isSameDimension(d, _dimension));
    if (!preset)
        return '';
    return Object(dom["decode"])(_buf, await getMaskBuf(preset.mask), {
        ...defaultOptions,
        transformAlgorithm: transform["TransformAlgorithm"].FFT1D,
        ...options,
    });
}
async function decodeImageUrl(url, options) {
    return decodeImage(await (await Object(utils["h" /* downloadUrl */])(url)).arrayBuffer(), options);
}


/***/ })

}]);