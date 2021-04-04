(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[62],{

/***/ 107:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "b", function() { return /* reexport */ toUtf8Bytes; });
__webpack_require__.d(__webpack_exports__, "c", function() { return /* reexport */ toUtf8String; });
__webpack_require__.d(__webpack_exports__, "a", function() { return /* reexport */ nameprep; });

// UNUSED EXPORTS: _toEscapedUtf8String, toUtf8CodePoints, Utf8ErrorFuncs, Utf8ErrorReason, UnicodeNormalizationForm, formatBytes32String, parseBytes32String

// EXTERNAL MODULE: ./node_modules/@ethersproject/constants/lib.esm/index.js
var lib_esm = __webpack_require__(154);

// EXTERNAL MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js + 1 modules
var bytes_lib_esm = __webpack_require__(6);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/strings/lib.esm/_version.js
const version = "strings/5.0.4";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/strings/lib.esm/utf8.js




const logger = new logger_lib_esm["Logger"](version);
///////////////////////////////
var UnicodeNormalizationForm;
(function (UnicodeNormalizationForm) {
    UnicodeNormalizationForm["current"] = "";
    UnicodeNormalizationForm["NFC"] = "NFC";
    UnicodeNormalizationForm["NFD"] = "NFD";
    UnicodeNormalizationForm["NFKC"] = "NFKC";
    UnicodeNormalizationForm["NFKD"] = "NFKD";
})(UnicodeNormalizationForm || (UnicodeNormalizationForm = {}));
;
var Utf8ErrorReason;
(function (Utf8ErrorReason) {
    // A continuation byte was present where there was nothing to continue
    // - offset = the index the codepoint began in
    Utf8ErrorReason["UNEXPECTED_CONTINUE"] = "unexpected continuation byte";
    // An invalid (non-continuation) byte to start a UTF-8 codepoint was found
    // - offset = the index the codepoint began in
    Utf8ErrorReason["BAD_PREFIX"] = "bad codepoint prefix";
    // The string is too short to process the expected codepoint
    // - offset = the index the codepoint began in
    Utf8ErrorReason["OVERRUN"] = "string overrun";
    // A missing continuation byte was expected but not found
    // - offset = the index the continuation byte was expected at
    Utf8ErrorReason["MISSING_CONTINUE"] = "missing continuation byte";
    // The computed code point is outside the range for UTF-8
    // - offset       = start of this codepoint
    // - badCodepoint = the computed codepoint; outside the UTF-8 range
    Utf8ErrorReason["OUT_OF_RANGE"] = "out of UTF-8 range";
    // UTF-8 strings may not contain UTF-16 surrogate pairs
    // - offset       = start of this codepoint
    // - badCodepoint = the computed codepoint; inside the UTF-16 surrogate range
    Utf8ErrorReason["UTF16_SURROGATE"] = "UTF-16 surrogate";
    // The string is an overlong reperesentation
    // - offset       = start of this codepoint
    // - badCodepoint = the computed codepoint; already bounds checked
    Utf8ErrorReason["OVERLONG"] = "overlong representation";
})(Utf8ErrorReason || (Utf8ErrorReason = {}));
;
function errorFunc(reason, offset, bytes, output, badCodepoint) {
    return logger.throwArgumentError(`invalid codepoint at offset ${offset}; ${reason}`, "bytes", bytes);
}
function ignoreFunc(reason, offset, bytes, output, badCodepoint) {
    // If there is an invalid prefix (including stray continuation), skip any additional continuation bytes
    if (reason === Utf8ErrorReason.BAD_PREFIX || reason === Utf8ErrorReason.UNEXPECTED_CONTINUE) {
        let i = 0;
        for (let o = offset + 1; o < bytes.length; o++) {
            if (bytes[o] >> 6 !== 0x02) {
                break;
            }
            i++;
        }
        return i;
    }
    // This byte runs us past the end of the string, so just jump to the end
    // (but the first byte was read already read and therefore skipped)
    if (reason === Utf8ErrorReason.OVERRUN) {
        return bytes.length - offset - 1;
    }
    // Nothing to skip
    return 0;
}
function replaceFunc(reason, offset, bytes, output, badCodepoint) {
    // Overlong representations are otherwise "valid" code points; just non-deistingtished
    if (reason === Utf8ErrorReason.OVERLONG) {
        output.push(badCodepoint);
        return 0;
    }
    // Put the replacement character into the output
    output.push(0xfffd);
    // Otherwise, process as if ignoring errors
    return ignoreFunc(reason, offset, bytes, output, badCodepoint);
}
// Common error handing strategies
const Utf8ErrorFuncs = Object.freeze({
    error: errorFunc,
    ignore: ignoreFunc,
    replace: replaceFunc
});
// http://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript#13691499
function getUtf8CodePoints(bytes, onError) {
    if (onError == null) {
        onError = Utf8ErrorFuncs.error;
    }
    bytes = Object(bytes_lib_esm["arrayify"])(bytes);
    const result = [];
    let i = 0;
    // Invalid bytes are ignored
    while (i < bytes.length) {
        const c = bytes[i++];
        // 0xxx xxxx
        if (c >> 7 === 0) {
            result.push(c);
            continue;
        }
        // Multibyte; how many bytes left for this character?
        let extraLength = null;
        let overlongMask = null;
        // 110x xxxx 10xx xxxx
        if ((c & 0xe0) === 0xc0) {
            extraLength = 1;
            overlongMask = 0x7f;
            // 1110 xxxx 10xx xxxx 10xx xxxx
        }
        else if ((c & 0xf0) === 0xe0) {
            extraLength = 2;
            overlongMask = 0x7ff;
            // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
        }
        else if ((c & 0xf8) === 0xf0) {
            extraLength = 3;
            overlongMask = 0xffff;
        }
        else {
            if ((c & 0xc0) === 0x80) {
                i += onError(Utf8ErrorReason.UNEXPECTED_CONTINUE, i - 1, bytes, result);
            }
            else {
                i += onError(Utf8ErrorReason.BAD_PREFIX, i - 1, bytes, result);
            }
            continue;
        }
        // Do we have enough bytes in our data?
        if (i - 1 + extraLength >= bytes.length) {
            i += onError(Utf8ErrorReason.OVERRUN, i - 1, bytes, result);
            continue;
        }
        // Remove the length prefix from the char
        let res = c & ((1 << (8 - extraLength - 1)) - 1);
        for (let j = 0; j < extraLength; j++) {
            let nextChar = bytes[i];
            // Invalid continuation byte
            if ((nextChar & 0xc0) != 0x80) {
                i += onError(Utf8ErrorReason.MISSING_CONTINUE, i, bytes, result);
                res = null;
                break;
            }
            ;
            res = (res << 6) | (nextChar & 0x3f);
            i++;
        }
        // See above loop for invalid contimuation byte
        if (res === null) {
            continue;
        }
        // Maximum code point
        if (res > 0x10ffff) {
            i += onError(Utf8ErrorReason.OUT_OF_RANGE, i - 1 - extraLength, bytes, result, res);
            continue;
        }
        // Reserved for UTF-16 surrogate halves
        if (res >= 0xd800 && res <= 0xdfff) {
            i += onError(Utf8ErrorReason.UTF16_SURROGATE, i - 1 - extraLength, bytes, result, res);
            continue;
        }
        // Check for overlong sequences (more bytes than needed)
        if (res <= overlongMask) {
            i += onError(Utf8ErrorReason.OVERLONG, i - 1 - extraLength, bytes, result, res);
            continue;
        }
        result.push(res);
    }
    return result;
}
// http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
function toUtf8Bytes(str, form = UnicodeNormalizationForm.current) {
    if (form != UnicodeNormalizationForm.current) {
        logger.checkNormalize();
        str = str.normalize(form);
    }
    let result = [];
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        if (c < 0x80) {
            result.push(c);
        }
        else if (c < 0x800) {
            result.push((c >> 6) | 0xc0);
            result.push((c & 0x3f) | 0x80);
        }
        else if ((c & 0xfc00) == 0xd800) {
            i++;
            const c2 = str.charCodeAt(i);
            if (i >= str.length || (c2 & 0xfc00) !== 0xdc00) {
                throw new Error("invalid utf-8 string");
            }
            // Surrogate Pair
            const pair = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
            result.push((pair >> 18) | 0xf0);
            result.push(((pair >> 12) & 0x3f) | 0x80);
            result.push(((pair >> 6) & 0x3f) | 0x80);
            result.push((pair & 0x3f) | 0x80);
        }
        else {
            result.push((c >> 12) | 0xe0);
            result.push(((c >> 6) & 0x3f) | 0x80);
            result.push((c & 0x3f) | 0x80);
        }
    }
    return Object(bytes_lib_esm["arrayify"])(result);
}
;
function escapeChar(value) {
    const hex = ("0000" + value.toString(16));
    return "\\u" + hex.substring(hex.length - 4);
}
function _toEscapedUtf8String(bytes, onError) {
    return '"' + getUtf8CodePoints(bytes, onError).map((codePoint) => {
        if (codePoint < 256) {
            switch (codePoint) {
                case 8: return "\\b";
                case 9: return "\\t";
                case 10: return "\\n";
                case 13: return "\\r";
                case 34: return "\\\"";
                case 92: return "\\\\";
            }
            if (codePoint >= 32 && codePoint < 127) {
                return String.fromCharCode(codePoint);
            }
        }
        if (codePoint <= 0xffff) {
            return escapeChar(codePoint);
        }
        codePoint -= 0x10000;
        return escapeChar(((codePoint >> 10) & 0x3ff) + 0xd800) + escapeChar((codePoint & 0x3ff) + 0xdc00);
    }).join("") + '"';
}
function _toUtf8String(codePoints) {
    return codePoints.map((codePoint) => {
        if (codePoint <= 0xffff) {
            return String.fromCharCode(codePoint);
        }
        codePoint -= 0x10000;
        return String.fromCharCode((((codePoint >> 10) & 0x3ff) + 0xd800), ((codePoint & 0x3ff) + 0xdc00));
    }).join("");
}
function toUtf8String(bytes, onError) {
    return _toUtf8String(getUtf8CodePoints(bytes, onError));
}
function toUtf8CodePoints(str, form = UnicodeNormalizationForm.current) {
    return getUtf8CodePoints(toUtf8Bytes(str, form));
}
//# sourceMappingURL=utf8.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/strings/lib.esm/bytes32.js




function formatBytes32String(text) {
    // Get the bytes
    const bytes = toUtf8Bytes(text);
    // Check we have room for null-termination
    if (bytes.length > 31) {
        throw new Error("bytes32 string must be less than 32 bytes");
    }
    // Zero-pad (implicitly null-terminates)
    return Object(bytes_lib_esm["hexlify"])(Object(bytes_lib_esm["concat"])([bytes, lib_esm["b" /* HashZero */]]).slice(0, 32));
}
function parseBytes32String(bytes) {
    const data = Object(bytes_lib_esm["arrayify"])(bytes);
    // Must be 32 bytes with a null-termination
    if (data.length !== 32) {
        throw new Error("invalid bytes32 - not 32 bytes long");
    }
    if (data[31] !== 0) {
        throw new Error("invalid bytes32 string - no null terminator");
    }
    // Find the null termination
    let length = 31;
    while (data[length - 1] === 0) {
        length--;
    }
    // Determine the string value
    return toUtf8String(data.slice(0, length));
}
//# sourceMappingURL=bytes32.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/strings/lib.esm/idna.js


function bytes2(data) {
    if ((data.length % 4) !== 0) {
        throw new Error("bad data");
    }
    let result = [];
    for (let i = 0; i < data.length; i += 4) {
        result.push(parseInt(data.substring(i, i + 4), 16));
    }
    return result;
}
function createTable(data, func) {
    if (!func) {
        func = function (value) { return [parseInt(value, 16)]; };
    }
    let lo = 0;
    let result = {};
    data.split(",").forEach((pair) => {
        let comps = pair.split(":");
        lo += parseInt(comps[0], 16);
        result[lo] = func(comps[1]);
    });
    return result;
}
function createRangeTable(data) {
    let hi = 0;
    return data.split(",").map((v) => {
        let comps = v.split("-");
        if (comps.length === 1) {
            comps[1] = "0";
        }
        else if (comps[1] === "") {
            comps[1] = "1";
        }
        let lo = hi + parseInt(comps[0], 16);
        hi = parseInt(comps[1], 16);
        return { l: lo, h: hi };
    });
}
function matchMap(value, ranges) {
    let lo = 0;
    for (let i = 0; i < ranges.length; i++) {
        let range = ranges[i];
        lo += range.l;
        if (value >= lo && value <= lo + range.h && ((value - lo) % (range.d || 1)) === 0) {
            if (range.e && range.e.indexOf(value - lo) !== -1) {
                continue;
            }
            return range;
        }
    }
    return null;
}
const Table_A_1_ranges = createRangeTable("221,13-1b,5f-,40-10,51-f,11-3,3-3,2-2,2-4,8,2,15,2d,28-8,88,48,27-,3-5,11-20,27-,8,28,3-5,12,18,b-a,1c-4,6-16,2-d,2-2,2,1b-4,17-9,8f-,10,f,1f-2,1c-34,33-14e,4,36-,13-,6-2,1a-f,4,9-,3-,17,8,2-2,5-,2,8-,3-,4-8,2-3,3,6-,16-6,2-,7-3,3-,17,8,3,3,3-,2,6-3,3-,4-a,5,2-6,10-b,4,8,2,4,17,8,3,6-,b,4,4-,2-e,2-4,b-10,4,9-,3-,17,8,3-,5-,9-2,3-,4-7,3-3,3,4-3,c-10,3,7-2,4,5-2,3,2,3-2,3-2,4-2,9,4-3,6-2,4,5-8,2-e,d-d,4,9,4,18,b,6-3,8,4,5-6,3-8,3-3,b-11,3,9,4,18,b,6-3,8,4,5-6,3-6,2,3-3,b-11,3,9,4,18,11-3,7-,4,5-8,2-7,3-3,b-11,3,13-2,19,a,2-,8-2,2-3,7,2,9-11,4-b,3b-3,1e-24,3,2-,3,2-,2-5,5,8,4,2,2-,3,e,4-,6,2,7-,b-,3-21,49,23-5,1c-3,9,25,10-,2-2f,23,6,3,8-2,5-5,1b-45,27-9,2a-,2-3,5b-4,45-4,53-5,8,40,2,5-,8,2,5-,28,2,5-,20,2,5-,8,2,5-,8,8,18,20,2,5-,8,28,14-5,1d-22,56-b,277-8,1e-2,52-e,e,8-a,18-8,15-b,e,4,3-b,5e-2,b-15,10,b-5,59-7,2b-555,9d-3,5b-5,17-,7-,27-,7-,9,2,2,2,20-,36,10,f-,7,14-,4,a,54-3,2-6,6-5,9-,1c-10,13-1d,1c-14,3c-,10-6,32-b,240-30,28-18,c-14,a0,115-,3,66-,b-76,5,5-,1d,24,2,5-2,2,8-,35-2,19,f-10,1d-3,311-37f,1b,5a-b,d7-19,d-3,41,57-,68-4,29-3,5f,29-37,2e-2,25-c,2c-2,4e-3,30,78-3,64-,20,19b7-49,51a7-59,48e-2,38-738,2ba5-5b,222f-,3c-94,8-b,6-4,1b,6,2,3,3,6d-20,16e-f,41-,37-7,2e-2,11-f,5-b,18-,b,14,5-3,6,88-,2,bf-2,7-,7-,7-,4-2,8,8-9,8-2ff,20,5-b,1c-b4,27-,27-cbb1,f7-9,28-2,b5-221,56,48,3-,2-,3-,5,d,2,5,3,42,5-,9,8,1d,5,6,2-2,8,153-3,123-3,33-27fd,a6da-5128,21f-5df,3-fffd,3-fffd,3-fffd,3-fffd,3-fffd,3-fffd,3-fffd,3-fffd,3-fffd,3-fffd,3-fffd,3,2-1d,61-ff7d");
// @TODO: Make this relative...
const Table_B_1_flags = "ad,34f,1806,180b,180c,180d,200b,200c,200d,2060,feff".split(",").map((v) => parseInt(v, 16));
const Table_B_2_ranges = [
    { h: 25, s: 32, l: 65 },
    { h: 30, s: 32, e: [23], l: 127 },
    { h: 54, s: 1, e: [48], l: 64, d: 2 },
    { h: 14, s: 1, l: 57, d: 2 },
    { h: 44, s: 1, l: 17, d: 2 },
    { h: 10, s: 1, e: [2, 6, 8], l: 61, d: 2 },
    { h: 16, s: 1, l: 68, d: 2 },
    { h: 84, s: 1, e: [18, 24, 66], l: 19, d: 2 },
    { h: 26, s: 32, e: [17], l: 435 },
    { h: 22, s: 1, l: 71, d: 2 },
    { h: 15, s: 80, l: 40 },
    { h: 31, s: 32, l: 16 },
    { h: 32, s: 1, l: 80, d: 2 },
    { h: 52, s: 1, l: 42, d: 2 },
    { h: 12, s: 1, l: 55, d: 2 },
    { h: 40, s: 1, e: [38], l: 15, d: 2 },
    { h: 14, s: 1, l: 48, d: 2 },
    { h: 37, s: 48, l: 49 },
    { h: 148, s: 1, l: 6351, d: 2 },
    { h: 88, s: 1, l: 160, d: 2 },
    { h: 15, s: 16, l: 704 },
    { h: 25, s: 26, l: 854 },
    { h: 25, s: 32, l: 55915 },
    { h: 37, s: 40, l: 1247 },
    { h: 25, s: -119711, l: 53248 },
    { h: 25, s: -119763, l: 52 },
    { h: 25, s: -119815, l: 52 },
    { h: 25, s: -119867, e: [1, 4, 5, 7, 8, 11, 12, 17], l: 52 },
    { h: 25, s: -119919, l: 52 },
    { h: 24, s: -119971, e: [2, 7, 8, 17], l: 52 },
    { h: 24, s: -120023, e: [2, 7, 13, 15, 16, 17], l: 52 },
    { h: 25, s: -120075, l: 52 },
    { h: 25, s: -120127, l: 52 },
    { h: 25, s: -120179, l: 52 },
    { h: 25, s: -120231, l: 52 },
    { h: 25, s: -120283, l: 52 },
    { h: 25, s: -120335, l: 52 },
    { h: 24, s: -119543, e: [17], l: 56 },
    { h: 24, s: -119601, e: [17], l: 58 },
    { h: 24, s: -119659, e: [17], l: 58 },
    { h: 24, s: -119717, e: [17], l: 58 },
    { h: 24, s: -119775, e: [17], l: 58 }
];
const Table_B_2_lut_abs = createTable("b5:3bc,c3:ff,7:73,2:253,5:254,3:256,1:257,5:259,1:25b,3:260,1:263,2:269,1:268,5:26f,1:272,2:275,7:280,3:283,5:288,3:28a,1:28b,5:292,3f:195,1:1bf,29:19e,125:3b9,8b:3b2,1:3b8,1:3c5,3:3c6,1:3c0,1a:3ba,1:3c1,1:3c3,2:3b8,1:3b5,1bc9:3b9,1c:1f76,1:1f77,f:1f7a,1:1f7b,d:1f78,1:1f79,1:1f7c,1:1f7d,107:63,5:25b,4:68,1:68,1:68,3:69,1:69,1:6c,3:6e,4:70,1:71,1:72,1:72,1:72,7:7a,2:3c9,2:7a,2:6b,1:e5,1:62,1:63,3:65,1:66,2:6d,b:3b3,1:3c0,6:64,1b574:3b8,1a:3c3,20:3b8,1a:3c3,20:3b8,1a:3c3,20:3b8,1a:3c3,20:3b8,1a:3c3");
const Table_B_2_lut_rel = createTable("179:1,2:1,2:1,5:1,2:1,a:4f,a:1,8:1,2:1,2:1,3:1,5:1,3:1,4:1,2:1,3:1,4:1,8:2,1:1,2:2,1:1,2:2,27:2,195:26,2:25,1:25,1:25,2:40,2:3f,1:3f,33:1,11:-6,1:-9,1ac7:-3a,6d:-8,1:-8,1:-8,1:-8,1:-8,1:-8,1:-8,1:-8,9:-8,1:-8,1:-8,1:-8,1:-8,1:-8,b:-8,1:-8,1:-8,1:-8,1:-8,1:-8,1:-8,1:-8,9:-8,1:-8,1:-8,1:-8,1:-8,1:-8,1:-8,1:-8,9:-8,1:-8,1:-8,1:-8,1:-8,1:-8,c:-8,2:-8,2:-8,2:-8,9:-8,1:-8,1:-8,1:-8,1:-8,1:-8,1:-8,1:-8,49:-8,1:-8,1:-4a,1:-4a,d:-56,1:-56,1:-56,1:-56,d:-8,1:-8,f:-8,1:-8,3:-7");
const Table_B_2_complex = createTable("df:00730073,51:00690307,19:02BC006E,a7:006A030C,18a:002003B9,16:03B903080301,20:03C503080301,1d7:05650582,190f:00680331,1:00740308,1:0077030A,1:0079030A,1:006102BE,b6:03C50313,2:03C503130300,2:03C503130301,2:03C503130342,2a:1F0003B9,1:1F0103B9,1:1F0203B9,1:1F0303B9,1:1F0403B9,1:1F0503B9,1:1F0603B9,1:1F0703B9,1:1F0003B9,1:1F0103B9,1:1F0203B9,1:1F0303B9,1:1F0403B9,1:1F0503B9,1:1F0603B9,1:1F0703B9,1:1F2003B9,1:1F2103B9,1:1F2203B9,1:1F2303B9,1:1F2403B9,1:1F2503B9,1:1F2603B9,1:1F2703B9,1:1F2003B9,1:1F2103B9,1:1F2203B9,1:1F2303B9,1:1F2403B9,1:1F2503B9,1:1F2603B9,1:1F2703B9,1:1F6003B9,1:1F6103B9,1:1F6203B9,1:1F6303B9,1:1F6403B9,1:1F6503B9,1:1F6603B9,1:1F6703B9,1:1F6003B9,1:1F6103B9,1:1F6203B9,1:1F6303B9,1:1F6403B9,1:1F6503B9,1:1F6603B9,1:1F6703B9,3:1F7003B9,1:03B103B9,1:03AC03B9,2:03B10342,1:03B1034203B9,5:03B103B9,6:1F7403B9,1:03B703B9,1:03AE03B9,2:03B70342,1:03B7034203B9,5:03B703B9,6:03B903080300,1:03B903080301,3:03B90342,1:03B903080342,b:03C503080300,1:03C503080301,1:03C10313,2:03C50342,1:03C503080342,b:1F7C03B9,1:03C903B9,1:03CE03B9,2:03C90342,1:03C9034203B9,5:03C903B9,ac:00720073,5b:00B00063,6:00B00066,d:006E006F,a:0073006D,1:00740065006C,1:0074006D,124f:006800700061,2:00610075,2:006F0076,b:00700061,1:006E0061,1:03BC0061,1:006D0061,1:006B0061,1:006B0062,1:006D0062,1:00670062,3:00700066,1:006E0066,1:03BC0066,4:0068007A,1:006B0068007A,1:006D0068007A,1:00670068007A,1:00740068007A,15:00700061,1:006B00700061,1:006D00700061,1:006700700061,8:00700076,1:006E0076,1:03BC0076,1:006D0076,1:006B0076,1:006D0076,1:00700077,1:006E0077,1:03BC0077,1:006D0077,1:006B0077,1:006D0077,1:006B03C9,1:006D03C9,2:00620071,3:00632215006B0067,1:0063006F002E,1:00640062,1:00670079,2:00680070,2:006B006B,1:006B006D,9:00700068,2:00700070006D,1:00700072,2:00730076,1:00770062,c723:00660066,1:00660069,1:0066006C,1:006600660069,1:00660066006C,1:00730074,1:00730074,d:05740576,1:05740565,1:0574056B,1:057E0576,1:0574056D", bytes2);
const Table_C_ranges = createRangeTable("80-20,2a0-,39c,32,f71,18e,7f2-f,19-7,30-4,7-5,f81-b,5,a800-20ff,4d1-1f,110,fa-6,d174-7,2e84-,ffff-,ffff-,ffff-,ffff-,ffff-,ffff-,ffff-,ffff-,ffff-,ffff-,ffff-,ffff-,2,1f-5f,ff7f-20001");
function flatten(values) {
    return values.reduce((accum, value) => {
        value.forEach((value) => { accum.push(value); });
        return accum;
    }, []);
}
function _nameprepTableA1(codepoint) {
    return !!matchMap(codepoint, Table_A_1_ranges);
}
function _nameprepTableB2(codepoint) {
    let range = matchMap(codepoint, Table_B_2_ranges);
    if (range) {
        return [codepoint + range.s];
    }
    let codes = Table_B_2_lut_abs[codepoint];
    if (codes) {
        return codes;
    }
    let shift = Table_B_2_lut_rel[codepoint];
    if (shift) {
        return [codepoint + shift[0]];
    }
    let complex = Table_B_2_complex[codepoint];
    if (complex) {
        return complex;
    }
    return null;
}
function _nameprepTableC(codepoint) {
    return !!matchMap(codepoint, Table_C_ranges);
}
function nameprep(value) {
    // This allows platforms with incomplete normalize to bypass
    // it for very basic names which the built-in toLowerCase
    // will certainly handle correctly
    if (value.match(/^[a-z0-9-]*$/i) && value.length <= 59) {
        return value.toLowerCase();
    }
    // Get the code points (keeping the current normalization)
    let codes = toUtf8CodePoints(value);
    codes = flatten(codes.map((code) => {
        // Substitute Table B.1 (Maps to Nothing)
        if (Table_B_1_flags.indexOf(code) >= 0) {
            return [];
        }
        if (code >= 0xfe00 && code <= 0xfe0f) {
            return [];
        }
        // Substitute Table B.2 (Case Folding)
        let codesTableB2 = _nameprepTableB2(code);
        if (codesTableB2) {
            return codesTableB2;
        }
        // No Substitution
        return [code];
    }));
    // Normalize using form KC
    codes = toUtf8CodePoints(_toUtf8String(codes), UnicodeNormalizationForm.NFKC);
    // Prohibit Tables C.1.2, C.2.2, C.3, C.4, C.5, C.6, C.7, C.8, C.9
    codes.forEach((code) => {
        if (_nameprepTableC(code)) {
            throw new Error("STRINGPREP_CONTAINS_PROHIBITED");
        }
    });
    // Prohibit Unassigned Code Points (Table A.1)
    codes.forEach((code) => {
        if (_nameprepTableA1(code)) {
            throw new Error("STRINGPREP_CONTAINS_UNASSIGNED");
        }
    });
    // IDNA extras
    let name = _toUtf8String(codes);
    // IDNA: 4.2.3.1
    if (name.substring(0, 1) === "-" || name.substring(2, 4) === "--" || name.substring(name.length - 1) === "-") {
        throw new Error("invalid hyphen");
    }
    // IDNA: 4.2.4
    if (name.length > 63) {
        throw new Error("too long");
    }
    return name;
}
//# sourceMappingURL=idna.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/strings/lib.esm/index.js





//# sourceMappingURL=index.js.map

/***/ }),

/***/ 11:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "LogLevel", function() { return /* binding */ LogLevel; });
__webpack_require__.d(__webpack_exports__, "ErrorCode", function() { return /* binding */ ErrorCode; });
__webpack_require__.d(__webpack_exports__, "Logger", function() { return /* binding */ lib_esm_Logger; });

// CONCATENATED MODULE: ./node_modules/@ethersproject/logger/lib.esm/_version.js
const version = "logger/5.0.5";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js

let _permanentCensorErrors = false;
let _censorErrors = false;
const LogLevels = { debug: 1, "default": 2, info: 2, warning: 3, error: 4, off: 5 };
let _logLevel = LogLevels["default"];

let _globalLogger = null;
function _checkNormalize() {
    try {
        const missing = [];
        // Make sure all forms of normalization are supported
        ["NFD", "NFC", "NFKD", "NFKC"].forEach((form) => {
            try {
                if ("test".normalize(form) !== "test") {
                    throw new Error("bad normalize");
                }
                ;
            }
            catch (error) {
                missing.push(form);
            }
        });
        if (missing.length) {
            throw new Error("missing " + missing.join(", "));
        }
        if (String.fromCharCode(0xe9).normalize("NFD") !== String.fromCharCode(0x65, 0x0301)) {
            throw new Error("broken implementation");
        }
    }
    catch (error) {
        return error.message;
    }
    return null;
}
const _normalizeError = _checkNormalize();
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARNING"] = "WARNING";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["OFF"] = "OFF";
})(LogLevel || (LogLevel = {}));
var ErrorCode;
(function (ErrorCode) {
    ///////////////////
    // Generic Errors
    // Unknown Error
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    // Not Implemented
    ErrorCode["NOT_IMPLEMENTED"] = "NOT_IMPLEMENTED";
    // Unsupported Operation
    //   - operation
    ErrorCode["UNSUPPORTED_OPERATION"] = "UNSUPPORTED_OPERATION";
    // Network Error (i.e. Ethereum Network, such as an invalid chain ID)
    //   - event ("noNetwork" is not re-thrown in provider.ready; otherwise thrown)
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    // Some sort of bad response from the server
    ErrorCode["SERVER_ERROR"] = "SERVER_ERROR";
    // Timeout
    ErrorCode["TIMEOUT"] = "TIMEOUT";
    ///////////////////
    // Operational  Errors
    // Buffer Overrun
    ErrorCode["BUFFER_OVERRUN"] = "BUFFER_OVERRUN";
    // Numeric Fault
    //   - operation: the operation being executed
    //   - fault: the reason this faulted
    ErrorCode["NUMERIC_FAULT"] = "NUMERIC_FAULT";
    ///////////////////
    // Argument Errors
    // Missing new operator to an object
    //  - name: The name of the class
    ErrorCode["MISSING_NEW"] = "MISSING_NEW";
    // Invalid argument (e.g. value is incompatible with type) to a function:
    //   - argument: The argument name that was invalid
    //   - value: The value of the argument
    ErrorCode["INVALID_ARGUMENT"] = "INVALID_ARGUMENT";
    // Missing argument to a function:
    //   - count: The number of arguments received
    //   - expectedCount: The number of arguments expected
    ErrorCode["MISSING_ARGUMENT"] = "MISSING_ARGUMENT";
    // Too many arguments
    //   - count: The number of arguments received
    //   - expectedCount: The number of arguments expected
    ErrorCode["UNEXPECTED_ARGUMENT"] = "UNEXPECTED_ARGUMENT";
    ///////////////////
    // Blockchain Errors
    // Call exception
    //  - transaction: the transaction
    //  - address?: the contract address
    //  - args?: The arguments passed into the function
    //  - method?: The Solidity method signature
    //  - errorSignature?: The EIP848 error signature
    //  - errorArgs?: The EIP848 error parameters
    //  - reason: The reason (only for EIP848 "Error(string)")
    ErrorCode["CALL_EXCEPTION"] = "CALL_EXCEPTION";
    // Insufficien funds (< value + gasLimit * gasPrice)
    //   - transaction: the transaction attempted
    ErrorCode["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
    // Nonce has already been used
    //   - transaction: the transaction attempted
    ErrorCode["NONCE_EXPIRED"] = "NONCE_EXPIRED";
    // The replacement fee for the transaction is too low
    //   - transaction: the transaction attempted
    ErrorCode["REPLACEMENT_UNDERPRICED"] = "REPLACEMENT_UNDERPRICED";
    // The gas limit could not be estimated
    //   - transaction: the transaction passed to estimateGas
    ErrorCode["UNPREDICTABLE_GAS_LIMIT"] = "UNPREDICTABLE_GAS_LIMIT";
})(ErrorCode || (ErrorCode = {}));
;
class lib_esm_Logger {
    constructor(version) {
        Object.defineProperty(this, "version", {
            enumerable: true,
            value: version,
            writable: false
        });
    }
    _log(logLevel, args) {
        const level = logLevel.toLowerCase();
        if (LogLevels[level] == null) {
            this.throwArgumentError("invalid log level name", "logLevel", logLevel);
        }
        if (_logLevel > LogLevels[level]) {
            return;
        }
        console.log.apply(console, args);
    }
    debug(...args) {
        this._log(lib_esm_Logger.levels.DEBUG, args);
    }
    info(...args) {
        this._log(lib_esm_Logger.levels.INFO, args);
    }
    warn(...args) {
        this._log(lib_esm_Logger.levels.WARNING, args);
    }
    makeError(message, code, params) {
        // Errors are being censored
        if (_censorErrors) {
            return this.makeError("censored error", code, {});
        }
        if (!code) {
            code = lib_esm_Logger.errors.UNKNOWN_ERROR;
        }
        if (!params) {
            params = {};
        }
        const messageDetails = [];
        Object.keys(params).forEach((key) => {
            try {
                messageDetails.push(key + "=" + JSON.stringify(params[key]));
            }
            catch (error) {
                messageDetails.push(key + "=" + JSON.stringify(params[key].toString()));
            }
        });
        messageDetails.push(`code=${code}`);
        messageDetails.push(`version=${this.version}`);
        const reason = message;
        if (messageDetails.length) {
            message += " (" + messageDetails.join(", ") + ")";
        }
        // @TODO: Any??
        const error = new Error(message);
        error.reason = reason;
        error.code = code;
        Object.keys(params).forEach(function (key) {
            error[key] = params[key];
        });
        return error;
    }
    throwError(message, code, params) {
        throw this.makeError(message, code, params);
    }
    throwArgumentError(message, name, value) {
        return this.throwError(message, lib_esm_Logger.errors.INVALID_ARGUMENT, {
            argument: name,
            value: value
        });
    }
    assert(condition, message, code, params) {
        if (!!condition) {
            return;
        }
        this.throwError(message, code, params);
    }
    assertArgument(condition, message, name, value) {
        if (!!condition) {
            return;
        }
        this.throwArgumentError(message, name, value);
    }
    checkNormalize(message) {
        if (message == null) {
            message = "platform missing String.prototype.normalize";
        }
        if (_normalizeError) {
            this.throwError("platform missing String.prototype.normalize", lib_esm_Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "String.prototype.normalize", form: _normalizeError
            });
        }
    }
    checkSafeUint53(value, message) {
        if (typeof (value) !== "number") {
            return;
        }
        if (message == null) {
            message = "value not safe";
        }
        if (value < 0 || value >= 0x1fffffffffffff) {
            this.throwError(message, lib_esm_Logger.errors.NUMERIC_FAULT, {
                operation: "checkSafeInteger",
                fault: "out-of-safe-range",
                value: value
            });
        }
        if (value % 1) {
            this.throwError(message, lib_esm_Logger.errors.NUMERIC_FAULT, {
                operation: "checkSafeInteger",
                fault: "non-integer",
                value: value
            });
        }
    }
    checkArgumentCount(count, expectedCount, message) {
        if (message) {
            message = ": " + message;
        }
        else {
            message = "";
        }
        if (count < expectedCount) {
            this.throwError("missing argument" + message, lib_esm_Logger.errors.MISSING_ARGUMENT, {
                count: count,
                expectedCount: expectedCount
            });
        }
        if (count > expectedCount) {
            this.throwError("too many arguments" + message, lib_esm_Logger.errors.UNEXPECTED_ARGUMENT, {
                count: count,
                expectedCount: expectedCount
            });
        }
    }
    checkNew(target, kind) {
        if (target === Object || target == null) {
            this.throwError("missing new", lib_esm_Logger.errors.MISSING_NEW, { name: kind.name });
        }
    }
    checkAbstract(target, kind) {
        if (target === kind) {
            this.throwError("cannot instantiate abstract class " + JSON.stringify(kind.name) + " directly; use a sub-class", lib_esm_Logger.errors.UNSUPPORTED_OPERATION, { name: target.name, operation: "new" });
        }
        else if (target === Object || target == null) {
            this.throwError("missing new", lib_esm_Logger.errors.MISSING_NEW, { name: kind.name });
        }
    }
    static globalLogger() {
        if (!_globalLogger) {
            _globalLogger = new lib_esm_Logger(version);
        }
        return _globalLogger;
    }
    static setCensorship(censorship, permanent) {
        if (!censorship && permanent) {
            this.globalLogger().throwError("cannot permanently disable censorship", lib_esm_Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "setCensorship"
            });
        }
        if (_permanentCensorErrors) {
            if (!censorship) {
                return;
            }
            this.globalLogger().throwError("error censorship permanent", lib_esm_Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "setCensorship"
            });
        }
        _censorErrors = !!censorship;
        _permanentCensorErrors = !!permanent;
    }
    static setLogLevel(logLevel) {
        const level = LogLevels[logLevel.toLowerCase()];
        if (level == null) {
            lib_esm_Logger.globalLogger().warn("invalid log level - " + logLevel);
            return;
        }
        _logLevel = level;
    }
}
lib_esm_Logger.errors = ErrorCode;
lib_esm_Logger.levels = LogLevel;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 114:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ getAddress; });
__webpack_require__.d(__webpack_exports__, "b", function() { return /* binding */ getContractAddress; });
__webpack_require__.d(__webpack_exports__, "c", function() { return /* binding */ getCreate2Address; });

// UNUSED EXPORTS: isAddress, getIcapAddress

// EXTERNAL MODULE: ./node_modules/bn.js/lib/bn.js
var bn = __webpack_require__(52);

// EXTERNAL MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(6);

// EXTERNAL MODULE: ./node_modules/@ethersproject/bignumber/lib.esm/index.js + 3 modules
var bignumber_lib_esm = __webpack_require__(43);

// EXTERNAL MODULE: ./node_modules/@ethersproject/keccak256/lib.esm/index.js
var keccak256_lib_esm = __webpack_require__(131);

// EXTERNAL MODULE: ./node_modules/@ethersproject/rlp/lib.esm/index.js + 1 modules
var rlp_lib_esm = __webpack_require__(328);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/address/lib.esm/_version.js
const version = "address/5.0.4";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/address/lib.esm/index.js

// We use this for base 36 maths







const logger = new logger_lib_esm["Logger"](version);
function getChecksumAddress(address) {
    if (!Object(lib_esm["isHexString"])(address, 20)) {
        logger.throwArgumentError("invalid address", "address", address);
    }
    address = address.toLowerCase();
    const chars = address.substring(2).split("");
    const expanded = new Uint8Array(40);
    for (let i = 0; i < 40; i++) {
        expanded[i] = chars[i].charCodeAt(0);
    }
    const hashed = Object(lib_esm["arrayify"])(Object(keccak256_lib_esm["a" /* keccak256 */])(expanded));
    for (let i = 0; i < 40; i += 2) {
        if ((hashed[i >> 1] >> 4) >= 8) {
            chars[i] = chars[i].toUpperCase();
        }
        if ((hashed[i >> 1] & 0x0f) >= 8) {
            chars[i + 1] = chars[i + 1].toUpperCase();
        }
    }
    return "0x" + chars.join("");
}
// Shims for environments that are missing some required constants and functions
const MAX_SAFE_INTEGER = 0x1fffffffffffff;
function log10(x) {
    if (Math.log10) {
        return Math.log10(x);
    }
    return Math.log(x) / Math.LN10;
}
// See: https://en.wikipedia.org/wiki/International_Bank_Account_Number
// Create lookup table
const ibanLookup = {};
for (let i = 0; i < 10; i++) {
    ibanLookup[String(i)] = String(i);
}
for (let i = 0; i < 26; i++) {
    ibanLookup[String.fromCharCode(65 + i)] = String(10 + i);
}
// How many decimal digits can we process? (for 64-bit float, this is 15)
const safeDigits = Math.floor(log10(MAX_SAFE_INTEGER));
function ibanChecksum(address) {
    address = address.toUpperCase();
    address = address.substring(4) + address.substring(0, 2) + "00";
    let expanded = address.split("").map((c) => { return ibanLookup[c]; }).join("");
    // Javascript can handle integers safely up to 15 (decimal) digits
    while (expanded.length >= safeDigits) {
        let block = expanded.substring(0, safeDigits);
        expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
    }
    let checksum = String(98 - (parseInt(expanded, 10) % 97));
    while (checksum.length < 2) {
        checksum = "0" + checksum;
    }
    return checksum;
}
;
function getAddress(address) {
    let result = null;
    if (typeof (address) !== "string") {
        logger.throwArgumentError("invalid address", "address", address);
    }
    if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
        // Missing the 0x prefix
        if (address.substring(0, 2) !== "0x") {
            address = "0x" + address;
        }
        result = getChecksumAddress(address);
        // It is a checksummed address with a bad checksum
        if (address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) && result !== address) {
            logger.throwArgumentError("bad address checksum", "address", address);
        }
        // Maybe ICAP? (we only support direct mode)
    }
    else if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
        // It is an ICAP address with a bad checksum
        if (address.substring(2, 4) !== ibanChecksum(address)) {
            logger.throwArgumentError("bad icap checksum", "address", address);
        }
        result = (new bn["BN"](address.substring(4), 36)).toString(16);
        while (result.length < 40) {
            result = "0" + result;
        }
        result = getChecksumAddress("0x" + result);
    }
    else {
        logger.throwArgumentError("invalid address", "address", address);
    }
    return result;
}
function isAddress(address) {
    try {
        getAddress(address);
        return true;
    }
    catch (error) { }
    return false;
}
function getIcapAddress(address) {
    let base36 = (new bn["BN"](getAddress(address).substring(2), 16)).toString(36).toUpperCase();
    while (base36.length < 30) {
        base36 = "0" + base36;
    }
    return "XE" + ibanChecksum("XE00" + base36) + base36;
}
// http://ethereum.stackexchange.com/questions/760/how-is-the-address-of-an-ethereum-contract-computed
function getContractAddress(transaction) {
    let from = null;
    try {
        from = getAddress(transaction.from);
    }
    catch (error) {
        logger.throwArgumentError("missing from address", "transaction", transaction);
    }
    const nonce = Object(lib_esm["stripZeros"])(Object(lib_esm["arrayify"])(bignumber_lib_esm["a" /* BigNumber */].from(transaction.nonce).toHexString()));
    return getAddress(Object(lib_esm["hexDataSlice"])(Object(keccak256_lib_esm["a" /* keccak256 */])(Object(rlp_lib_esm["b" /* encode */])([from, nonce])), 12));
}
function getCreate2Address(from, salt, initCodeHash) {
    if (Object(lib_esm["hexDataLength"])(salt) !== 32) {
        logger.throwArgumentError("salt must be 32 bytes", "salt", salt);
    }
    if (Object(lib_esm["hexDataLength"])(initCodeHash) !== 32) {
        logger.throwArgumentError("initCodeHash must be 32 bytes", "initCodeHash", initCodeHash);
    }
    return getAddress(Object(lib_esm["hexDataSlice"])(Object(keccak256_lib_esm["a" /* keccak256 */])(Object(lib_esm["concat"])(["0xff", getAddress(from), salt, initCodeHash])), 12));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 131:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return keccak256; });
/* harmony import */ var js_sha3__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(844);
/* harmony import */ var js_sha3__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(js_sha3__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6);



function keccak256(data) {
    return '0x' + js_sha3__WEBPACK_IMPORTED_MODULE_0___default.a.keccak_256(Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["arrayify"])(data));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 1456:
/***/ (function(module, exports, __webpack_require__) {

var hash = exports;

hash.utils = __webpack_require__(233);
hash.common = __webpack_require__(410);
hash.sha = __webpack_require__(1457);
hash.ripemd = __webpack_require__(1461);
hash.hmac = __webpack_require__(1462);

// Proxy hash functions to the main object
hash.sha1 = hash.sha.sha1;
hash.sha256 = hash.sha.sha256;
hash.sha224 = hash.sha.sha224;
hash.sha384 = hash.sha.sha384;
hash.sha512 = hash.sha.sha512;
hash.ripemd160 = hash.ripemd.ripemd160;


/***/ }),

/***/ 1457:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.sha1 = __webpack_require__(1458);
exports.sha224 = __webpack_require__(1459);
exports.sha256 = __webpack_require__(773);
exports.sha384 = __webpack_require__(1460);
exports.sha512 = __webpack_require__(774);


/***/ }),

/***/ 1458:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(233);
var common = __webpack_require__(410);
var shaCommon = __webpack_require__(772);

var rotl32 = utils.rotl32;
var sum32 = utils.sum32;
var sum32_5 = utils.sum32_5;
var ft_1 = shaCommon.ft_1;
var BlockHash = common.BlockHash;

var sha1_K = [
  0x5A827999, 0x6ED9EBA1,
  0x8F1BBCDC, 0xCA62C1D6
];

function SHA1() {
  if (!(this instanceof SHA1))
    return new SHA1();

  BlockHash.call(this);
  this.h = [
    0x67452301, 0xefcdab89, 0x98badcfe,
    0x10325476, 0xc3d2e1f0 ];
  this.W = new Array(80);
}

utils.inherits(SHA1, BlockHash);
module.exports = SHA1;

SHA1.blockSize = 512;
SHA1.outSize = 160;
SHA1.hmacStrength = 80;
SHA1.padLength = 64;

SHA1.prototype._update = function _update(msg, start) {
  var W = this.W;

  for (var i = 0; i < 16; i++)
    W[i] = msg[start + i];

  for(; i < W.length; i++)
    W[i] = rotl32(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

  var a = this.h[0];
  var b = this.h[1];
  var c = this.h[2];
  var d = this.h[3];
  var e = this.h[4];

  for (i = 0; i < W.length; i++) {
    var s = ~~(i / 20);
    var t = sum32_5(rotl32(a, 5), ft_1(s, b, c, d), e, W[i], sha1_K[s]);
    e = d;
    d = c;
    c = rotl32(b, 30);
    b = a;
    a = t;
  }

  this.h[0] = sum32(this.h[0], a);
  this.h[1] = sum32(this.h[1], b);
  this.h[2] = sum32(this.h[2], c);
  this.h[3] = sum32(this.h[3], d);
  this.h[4] = sum32(this.h[4], e);
};

SHA1.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};


/***/ }),

/***/ 1459:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(233);
var SHA256 = __webpack_require__(773);

function SHA224() {
  if (!(this instanceof SHA224))
    return new SHA224();

  SHA256.call(this);
  this.h = [
    0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
    0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4 ];
}
utils.inherits(SHA224, SHA256);
module.exports = SHA224;

SHA224.blockSize = 512;
SHA224.outSize = 224;
SHA224.hmacStrength = 192;
SHA224.padLength = 64;

SHA224.prototype._digest = function digest(enc) {
  // Just truncate output
  if (enc === 'hex')
    return utils.toHex32(this.h.slice(0, 7), 'big');
  else
    return utils.split32(this.h.slice(0, 7), 'big');
};



/***/ }),

/***/ 1460:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(233);

var SHA512 = __webpack_require__(774);

function SHA384() {
  if (!(this instanceof SHA384))
    return new SHA384();

  SHA512.call(this);
  this.h = [
    0xcbbb9d5d, 0xc1059ed8,
    0x629a292a, 0x367cd507,
    0x9159015a, 0x3070dd17,
    0x152fecd8, 0xf70e5939,
    0x67332667, 0xffc00b31,
    0x8eb44a87, 0x68581511,
    0xdb0c2e0d, 0x64f98fa7,
    0x47b5481d, 0xbefa4fa4 ];
}
utils.inherits(SHA384, SHA512);
module.exports = SHA384;

SHA384.blockSize = 1024;
SHA384.outSize = 384;
SHA384.hmacStrength = 192;
SHA384.padLength = 128;

SHA384.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h.slice(0, 12), 'big');
  else
    return utils.split32(this.h.slice(0, 12), 'big');
};


/***/ }),

/***/ 1461:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(233);
var common = __webpack_require__(410);

var rotl32 = utils.rotl32;
var sum32 = utils.sum32;
var sum32_3 = utils.sum32_3;
var sum32_4 = utils.sum32_4;
var BlockHash = common.BlockHash;

function RIPEMD160() {
  if (!(this instanceof RIPEMD160))
    return new RIPEMD160();

  BlockHash.call(this);

  this.h = [ 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0 ];
  this.endian = 'little';
}
utils.inherits(RIPEMD160, BlockHash);
exports.ripemd160 = RIPEMD160;

RIPEMD160.blockSize = 512;
RIPEMD160.outSize = 160;
RIPEMD160.hmacStrength = 192;
RIPEMD160.padLength = 64;

RIPEMD160.prototype._update = function update(msg, start) {
  var A = this.h[0];
  var B = this.h[1];
  var C = this.h[2];
  var D = this.h[3];
  var E = this.h[4];
  var Ah = A;
  var Bh = B;
  var Ch = C;
  var Dh = D;
  var Eh = E;
  for (var j = 0; j < 80; j++) {
    var T = sum32(
      rotl32(
        sum32_4(A, f(j, B, C, D), msg[r[j] + start], K(j)),
        s[j]),
      E);
    A = E;
    E = D;
    D = rotl32(C, 10);
    C = B;
    B = T;
    T = sum32(
      rotl32(
        sum32_4(Ah, f(79 - j, Bh, Ch, Dh), msg[rh[j] + start], Kh(j)),
        sh[j]),
      Eh);
    Ah = Eh;
    Eh = Dh;
    Dh = rotl32(Ch, 10);
    Ch = Bh;
    Bh = T;
  }
  T = sum32_3(this.h[1], C, Dh);
  this.h[1] = sum32_3(this.h[2], D, Eh);
  this.h[2] = sum32_3(this.h[3], E, Ah);
  this.h[3] = sum32_3(this.h[4], A, Bh);
  this.h[4] = sum32_3(this.h[0], B, Ch);
  this.h[0] = T;
};

RIPEMD160.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'little');
  else
    return utils.split32(this.h, 'little');
};

function f(j, x, y, z) {
  if (j <= 15)
    return x ^ y ^ z;
  else if (j <= 31)
    return (x & y) | ((~x) & z);
  else if (j <= 47)
    return (x | (~y)) ^ z;
  else if (j <= 63)
    return (x & z) | (y & (~z));
  else
    return x ^ (y | (~z));
}

function K(j) {
  if (j <= 15)
    return 0x00000000;
  else if (j <= 31)
    return 0x5a827999;
  else if (j <= 47)
    return 0x6ed9eba1;
  else if (j <= 63)
    return 0x8f1bbcdc;
  else
    return 0xa953fd4e;
}

function Kh(j) {
  if (j <= 15)
    return 0x50a28be6;
  else if (j <= 31)
    return 0x5c4dd124;
  else if (j <= 47)
    return 0x6d703ef3;
  else if (j <= 63)
    return 0x7a6d76e9;
  else
    return 0x00000000;
}

var r = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
];

var rh = [
  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
];

var s = [
  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
];

var sh = [
  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
];


/***/ }),

/***/ 1462:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(233);
var assert = __webpack_require__(159);

function Hmac(hash, key, enc) {
  if (!(this instanceof Hmac))
    return new Hmac(hash, key, enc);
  this.Hash = hash;
  this.blockSize = hash.blockSize / 8;
  this.outSize = hash.outSize / 8;
  this.inner = null;
  this.outer = null;

  this._init(utils.toArray(key, enc));
}
module.exports = Hmac;

Hmac.prototype._init = function init(key) {
  // Shorten key, if needed
  if (key.length > this.blockSize)
    key = new this.Hash().update(key).digest();
  assert(key.length <= this.blockSize);

  // Add padding to key
  for (var i = key.length; i < this.blockSize; i++)
    key.push(0);

  for (i = 0; i < key.length; i++)
    key[i] ^= 0x36;
  this.inner = new this.Hash().update(key);

  // 0x36 ^ 0x5c = 0x6a
  for (i = 0; i < key.length; i++)
    key[i] ^= 0x6a;
  this.outer = new this.Hash().update(key);
};

Hmac.prototype.update = function update(msg, enc) {
  this.inner.update(msg, enc);
  return this;
};

Hmac.prototype.digest = function digest(enc) {
  this.outer.update(this.inner.digest());
  return this.outer.digest(enc);
};


/***/ }),

/***/ 1463:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.version = "sha2/5.0.3";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ 1464:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.version = "providers/5.0.9";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ 1465:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.version = "random/5.0.3";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ 1466:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function shuffled(array) {
    array = array.slice();
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = array[i];
        array[i] = array[j];
        array[j] = tmp;
    }
    return array;
}
exports.shuffled = shuffled;
//# sourceMappingURL=shuffle.js.map

/***/ }),

/***/ 154:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AddressZero; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return HashZero; });
/* unused harmony export EtherSymbol */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return NegativeOne; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return Zero; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return One; });
/* unused harmony export Two */
/* unused harmony export WeiPerEther */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return MaxUint256; });
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(43);


const AddressZero = "0x0000000000000000000000000000000000000000";
const HashZero = "0x0000000000000000000000000000000000000000000000000000000000000000";
// NFKC (composed)             // (decomposed)
const EtherSymbol = "\u039e"; // "\uD835\uDF63";
const NegativeOne = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__[/* BigNumber */ "a"].from(-1);
const Zero = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__[/* BigNumber */ "a"].from(0);
const One = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__[/* BigNumber */ "a"].from(1);
const Two = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__[/* BigNumber */ "a"].from(2);
const WeiPerEther = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__[/* BigNumber */ "a"].from("1000000000000000000");
const MaxUint256 = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__[/* BigNumber */ "a"].from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

//# sourceMappingURL=index.js.map

/***/ }),

/***/ 177:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "b", function() { return /* binding */ namehash; });
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ id; });

// UNUSED EXPORTS: isValidName, messagePrefix, hashMessage

// EXTERNAL MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(6);

// EXTERNAL MODULE: ./node_modules/@ethersproject/strings/lib.esm/index.js + 4 modules
var strings_lib_esm = __webpack_require__(107);

// EXTERNAL MODULE: ./node_modules/@ethersproject/keccak256/lib.esm/index.js
var keccak256_lib_esm = __webpack_require__(131);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/hash/lib.esm/_version.js
const version = "hash/5.0.4";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/hash/lib.esm/index.js






const logger = new logger_lib_esm["Logger"](version);
///////////////////////////////
const Zeros = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const Partition = new RegExp("^((.*)\\.)?([^.]+)$");
function isValidName(name) {
    try {
        const comps = name.split(".");
        for (let i = 0; i < comps.length; i++) {
            if (Object(strings_lib_esm["a" /* nameprep */])(comps[i]).length === 0) {
                throw new Error("empty");
            }
        }
        return true;
    }
    catch (error) { }
    return false;
}
function namehash(name) {
    /* istanbul ignore if */
    if (typeof (name) !== "string") {
        logger.throwArgumentError("invalid address - " + String(name), "name", name);
    }
    let result = Zeros;
    while (name.length) {
        const partition = name.match(Partition);
        const label = Object(strings_lib_esm["b" /* toUtf8Bytes */])(Object(strings_lib_esm["a" /* nameprep */])(partition[3]));
        result = Object(keccak256_lib_esm["a" /* keccak256 */])(Object(lib_esm["concat"])([result, Object(keccak256_lib_esm["a" /* keccak256 */])(label)]));
        name = partition[2] || "";
    }
    return Object(lib_esm["hexlify"])(result);
}
function id(text) {
    return Object(keccak256_lib_esm["a" /* keccak256 */])(Object(strings_lib_esm["b" /* toUtf8Bytes */])(text));
}
const messagePrefix = "\x19Ethereum Signed Message:\n";
function hashMessage(message) {
    if (typeof (message) === "string") {
        message = Object(strings_lib_esm["b" /* toUtf8Bytes */])(message);
    }
    return Object(keccak256_lib_esm["a" /* keccak256 */])(Object(lib_esm["concat"])([
        Object(strings_lib_esm["b" /* toUtf8Bytes */])(messagePrefix),
        Object(strings_lib_esm["b" /* toUtf8Bytes */])(String(message.length)),
        message
    ]));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 193:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export JsonRpcSigner */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return JsonRpcProvider; });
/* harmony import */ var _ethersproject_abstract_signer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(388);
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(43);
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6);
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7);
/* harmony import */ var _ethersproject_strings__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(107);
/* harmony import */ var _ethersproject_web__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(200);
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(11);
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(98);
/* harmony import */ var _base_provider__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(257);

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};








const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"](_version__WEBPACK_IMPORTED_MODULE_7__[/* version */ "a"]);

const errorGas = ["call", "estimateGas"];
function checkError(method, error, params) {
    let message = error.message;
    if (error.code === _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"].errors.SERVER_ERROR && error.error && typeof (error.error.message) === "string") {
        message = error.error.message;
    }
    else if (typeof (error.body) === "string") {
        message = error.body;
    }
    else if (typeof (error.responseText) === "string") {
        message = error.responseText;
    }
    message = (message || "").toLowerCase();
    const transaction = params.transaction || params.signedTransaction;
    // "insufficient funds for gas * price + value + cost(data)"
    if (message.match(/insufficient funds/)) {
        logger.throwError("insufficient funds for intrinsic transaction cost", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"].errors.INSUFFICIENT_FUNDS, {
            error, method, transaction
        });
    }
    // "nonce too low"
    if (message.match(/nonce too low/)) {
        logger.throwError("nonce has already been used", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"].errors.NONCE_EXPIRED, {
            error, method, transaction
        });
    }
    // "replacement transaction underpriced"
    if (message.match(/replacement transaction underpriced/)) {
        logger.throwError("replacement fee too low", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"].errors.REPLACEMENT_UNDERPRICED, {
            error, method, transaction
        });
    }
    if (errorGas.indexOf(method) >= 0 && message.match(/gas required exceeds allowance|always failing transaction|execution reverted/)) {
        logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"].errors.UNPREDICTABLE_GAS_LIMIT, {
            error, method, transaction
        });
    }
    throw error;
}
function timer(timeout) {
    return new Promise(function (resolve) {
        setTimeout(resolve, timeout);
    });
}
function getResult(payload) {
    if (payload.error) {
        // @TODO: not any
        const error = new Error(payload.error.message);
        error.code = payload.error.code;
        error.data = payload.error.data;
        throw error;
    }
    return payload.result;
}
function getLowerCase(value) {
    if (value) {
        return value.toLowerCase();
    }
    return value;
}
const _constructorGuard = {};
class JsonRpcSigner extends _ethersproject_abstract_signer__WEBPACK_IMPORTED_MODULE_0__[/* Signer */ "a"] {
    constructor(constructorGuard, provider, addressOrIndex) {
        logger.checkNew(new.target, JsonRpcSigner);
        super();
        if (constructorGuard !== _constructorGuard) {
            throw new Error("do not call the JsonRpcSigner constructor directly; use provider.getSigner");
        }
        Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* defineReadOnly */ "d"])(this, "provider", provider);
        if (addressOrIndex == null) {
            addressOrIndex = 0;
        }
        if (typeof (addressOrIndex) === "string") {
            Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* defineReadOnly */ "d"])(this, "_address", this.provider.formatter.address(addressOrIndex));
            Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* defineReadOnly */ "d"])(this, "_index", null);
        }
        else if (typeof (addressOrIndex) === "number") {
            Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* defineReadOnly */ "d"])(this, "_index", addressOrIndex);
            Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* defineReadOnly */ "d"])(this, "_address", null);
        }
        else {
            logger.throwArgumentError("invalid address or index", "addressOrIndex", addressOrIndex);
        }
    }
    connect(provider) {
        return logger.throwError("cannot alter JSON-RPC Signer connection", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"].errors.UNSUPPORTED_OPERATION, {
            operation: "connect"
        });
    }
    connectUnchecked() {
        return new UncheckedJsonRpcSigner(_constructorGuard, this.provider, this._address || this._index);
    }
    getAddress() {
        if (this._address) {
            return Promise.resolve(this._address);
        }
        return this.provider.send("eth_accounts", []).then((accounts) => {
            if (accounts.length <= this._index) {
                logger.throwError("unknown account #" + this._index, _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"].errors.UNSUPPORTED_OPERATION, {
                    operation: "getAddress"
                });
            }
            return this.provider.formatter.address(accounts[this._index]);
        });
    }
    sendUncheckedTransaction(transaction) {
        transaction = Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* shallowCopy */ "g"])(transaction);
        const fromAddress = this.getAddress().then((address) => {
            if (address) {
                address = address.toLowerCase();
            }
            return address;
        });
        // The JSON-RPC for eth_sendTransaction uses 90000 gas; if the user
        // wishes to use this, it is easy to specify explicitly, otherwise
        // we look it up for them.
        if (transaction.gasLimit == null) {
            const estimate = Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* shallowCopy */ "g"])(transaction);
            estimate.from = fromAddress;
            transaction.gasLimit = this.provider.estimateGas(estimate);
        }
        return Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* resolveProperties */ "f"])({
            tx: Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* resolveProperties */ "f"])(transaction),
            sender: fromAddress
        }).then(({ tx, sender }) => {
            if (tx.from != null) {
                if (tx.from.toLowerCase() !== sender) {
                    logger.throwArgumentError("from address mismatch", "transaction", transaction);
                }
            }
            else {
                tx.from = sender;
            }
            const hexTx = this.provider.constructor.hexlifyTransaction(tx, { from: true });
            return this.provider.send("eth_sendTransaction", [hexTx]).then((hash) => {
                return hash;
            }, (error) => {
                return checkError("sendTransaction", error, hexTx);
            });
        });
    }
    signTransaction(transaction) {
        return logger.throwError("signing transactions is unsupported", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"].errors.UNSUPPORTED_OPERATION, {
            operation: "signTransaction"
        });
    }
    sendTransaction(transaction) {
        return this.sendUncheckedTransaction(transaction).then((hash) => {
            return Object(_ethersproject_web__WEBPACK_IMPORTED_MODULE_5__[/* poll */ "b"])(() => {
                return this.provider.getTransaction(hash).then((tx) => {
                    if (tx === null) {
                        return undefined;
                    }
                    return this.provider._wrapTransaction(tx, hash);
                });
            }, { onceBlock: this.provider }).catch((error) => {
                error.transactionHash = hash;
                throw error;
            });
        });
    }
    signMessage(message) {
        const data = ((typeof (message) === "string") ? Object(_ethersproject_strings__WEBPACK_IMPORTED_MODULE_4__[/* toUtf8Bytes */ "b"])(message) : message);
        return this.getAddress().then((address) => {
            // https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
            return this.provider.send("eth_sign", [address.toLowerCase(), Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["hexlify"])(data)]);
        });
    }
    unlock(password) {
        const provider = this.provider;
        return this.getAddress().then(function (address) {
            return provider.send("personal_unlockAccount", [address.toLowerCase(), password, null]);
        });
    }
}
class UncheckedJsonRpcSigner extends JsonRpcSigner {
    sendTransaction(transaction) {
        return this.sendUncheckedTransaction(transaction).then((hash) => {
            return {
                hash: hash,
                nonce: null,
                gasLimit: null,
                gasPrice: null,
                data: null,
                value: null,
                chainId: null,
                confirmations: 0,
                from: null,
                wait: (confirmations) => { return this.provider.waitForTransaction(hash, confirmations); }
            };
        });
    }
}
const allowedTransactionKeys = {
    chainId: true, data: true, gasLimit: true, gasPrice: true, nonce: true, to: true, value: true
};
class JsonRpcProvider extends _base_provider__WEBPACK_IMPORTED_MODULE_8__[/* BaseProvider */ "a"] {
    constructor(url, network) {
        logger.checkNew(new.target, JsonRpcProvider);
        let networkOrReady = network;
        // The network is unknown, query the JSON-RPC for it
        if (networkOrReady == null) {
            networkOrReady = new Promise((resolve, reject) => {
                setTimeout(() => {
                    this.detectNetwork().then((network) => {
                        resolve(network);
                    }, (error) => {
                        reject(error);
                    });
                }, 0);
            });
        }
        super(networkOrReady);
        // Default URL
        if (!url) {
            url = Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* getStatic */ "e"])(this.constructor, "defaultUrl")();
        }
        if (typeof (url) === "string") {
            Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* defineReadOnly */ "d"])(this, "connection", Object.freeze({
                url: url
            }));
        }
        else {
            Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* defineReadOnly */ "d"])(this, "connection", Object.freeze(Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* shallowCopy */ "g"])(url)));
        }
        this._nextId = 42;
    }
    static defaultUrl() {
        return "http:/\/localhost:8545";
    }
    detectNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            yield timer(0);
            let chainId = null;
            try {
                chainId = yield this.send("eth_chainId", []);
            }
            catch (error) {
                try {
                    chainId = yield this.send("net_version", []);
                }
                catch (error) { }
            }
            if (chainId != null) {
                const getNetwork = Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* getStatic */ "e"])(this.constructor, "getNetwork");
                try {
                    return getNetwork(_ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_1__[/* BigNumber */ "a"].from(chainId).toNumber());
                }
                catch (error) {
                    return logger.throwError("could not detect network", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"].errors.NETWORK_ERROR, {
                        chainId: chainId,
                        event: "invalidNetwork",
                        serverError: error
                    });
                }
            }
            return logger.throwError("could not detect network", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"].errors.NETWORK_ERROR, {
                event: "noNetwork"
            });
        });
    }
    getSigner(addressOrIndex) {
        return new JsonRpcSigner(_constructorGuard, this, addressOrIndex);
    }
    getUncheckedSigner(addressOrIndex) {
        return this.getSigner(addressOrIndex).connectUnchecked();
    }
    listAccounts() {
        return this.send("eth_accounts", []).then((accounts) => {
            return accounts.map((a) => this.formatter.address(a));
        });
    }
    send(method, params) {
        const request = {
            method: method,
            params: params,
            id: (this._nextId++),
            jsonrpc: "2.0"
        };
        this.emit("debug", {
            action: "request",
            request: Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* deepCopy */ "c"])(request),
            provider: this
        });
        return Object(_ethersproject_web__WEBPACK_IMPORTED_MODULE_5__[/* fetchJson */ "a"])(this.connection, JSON.stringify(request), getResult).then((result) => {
            this.emit("debug", {
                action: "response",
                request: request,
                response: result,
                provider: this
            });
            return result;
        }, (error) => {
            this.emit("debug", {
                action: "response",
                error: error,
                request: request,
                provider: this
            });
            throw error;
        });
    }
    prepareRequest(method, params) {
        switch (method) {
            case "getBlockNumber":
                return ["eth_blockNumber", []];
            case "getGasPrice":
                return ["eth_gasPrice", []];
            case "getBalance":
                return ["eth_getBalance", [getLowerCase(params.address), params.blockTag]];
            case "getTransactionCount":
                return ["eth_getTransactionCount", [getLowerCase(params.address), params.blockTag]];
            case "getCode":
                return ["eth_getCode", [getLowerCase(params.address), params.blockTag]];
            case "getStorageAt":
                return ["eth_getStorageAt", [getLowerCase(params.address), params.position, params.blockTag]];
            case "sendTransaction":
                return ["eth_sendRawTransaction", [params.signedTransaction]];
            case "getBlock":
                if (params.blockTag) {
                    return ["eth_getBlockByNumber", [params.blockTag, !!params.includeTransactions]];
                }
                else if (params.blockHash) {
                    return ["eth_getBlockByHash", [params.blockHash, !!params.includeTransactions]];
                }
                return null;
            case "getTransaction":
                return ["eth_getTransactionByHash", [params.transactionHash]];
            case "getTransactionReceipt":
                return ["eth_getTransactionReceipt", [params.transactionHash]];
            case "call": {
                const hexlifyTransaction = Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* getStatic */ "e"])(this.constructor, "hexlifyTransaction");
                return ["eth_call", [hexlifyTransaction(params.transaction, { from: true }), params.blockTag]];
            }
            case "estimateGas": {
                const hexlifyTransaction = Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* getStatic */ "e"])(this.constructor, "hexlifyTransaction");
                return ["eth_estimateGas", [hexlifyTransaction(params.transaction, { from: true })]];
            }
            case "getLogs":
                if (params.filter && params.filter.address != null) {
                    params.filter.address = getLowerCase(params.filter.address);
                }
                return ["eth_getLogs", [params.filter]];
            default:
                break;
        }
        return null;
    }
    perform(method, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = this.prepareRequest(method, params);
            if (args == null) {
                logger.throwError(method + " not implemented", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"].errors.NOT_IMPLEMENTED, { operation: method });
            }
            try {
                return yield this.send(args[0], args[1]);
            }
            catch (error) {
                return checkError(method, error, params);
            }
        });
    }
    _startEvent(event) {
        if (event.tag === "pending") {
            this._startPending();
        }
        super._startEvent(event);
    }
    _startPending() {
        if (this._pendingFilter != null) {
            return;
        }
        const self = this;
        const pendingFilter = this.send("eth_newPendingTransactionFilter", []);
        this._pendingFilter = pendingFilter;
        pendingFilter.then(function (filterId) {
            function poll() {
                self.send("eth_getFilterChanges", [filterId]).then(function (hashes) {
                    if (self._pendingFilter != pendingFilter) {
                        return null;
                    }
                    let seq = Promise.resolve();
                    hashes.forEach(function (hash) {
                        // @TODO: This should be garbage collected at some point... How? When?
                        self._emitted["t:" + hash.toLowerCase()] = "pending";
                        seq = seq.then(function () {
                            return self.getTransaction(hash).then(function (tx) {
                                self.emit("pending", tx);
                                return null;
                            });
                        });
                    });
                    return seq.then(function () {
                        return timer(1000);
                    });
                }).then(function () {
                    if (self._pendingFilter != pendingFilter) {
                        self.send("eth_uninstallFilter", [filterId]);
                        return;
                    }
                    setTimeout(function () { poll(); }, 0);
                    return null;
                }).catch((error) => { });
            }
            poll();
            return filterId;
        }).catch((error) => { });
    }
    _stopEvent(event) {
        if (event.tag === "pending" && this.listenerCount("pending") === 0) {
            this._pendingFilter = null;
        }
        super._stopEvent(event);
    }
    // Convert an ethers.js transaction into a JSON-RPC transaction
    //  - gasLimit => gas
    //  - All values hexlified
    //  - All numeric values zero-striped
    //  - All addresses are lowercased
    // NOTE: This allows a TransactionRequest, but all values should be resolved
    //       before this is called
    // @TODO: This will likely be removed in future versions and prepareRequest
    //        will be the preferred method for this.
    static hexlifyTransaction(transaction, allowExtra) {
        // Check only allowed properties are given
        const allowed = Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* shallowCopy */ "g"])(allowedTransactionKeys);
        if (allowExtra) {
            for (const key in allowExtra) {
                if (allowExtra[key]) {
                    allowed[key] = true;
                }
            }
        }
        Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_3__[/* checkProperties */ "b"])(transaction, allowed);
        const result = {};
        // Some nodes (INFURA ropsten; INFURA mainnet is fine) do not like leading zeros.
        ["gasLimit", "gasPrice", "nonce", "value"].forEach(function (key) {
            if (transaction[key] == null) {
                return;
            }
            const value = Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["hexValue"])(transaction[key]);
            if (key === "gasLimit") {
                key = "gas";
            }
            result[key] = value;
        });
        ["from", "to", "data"].forEach(function (key) {
            if (transaction[key] == null) {
                return;
            }
            result[key] = Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["hexlify"])(transaction[key]);
        });
        return result;
    }
}
//# sourceMappingURL=json-rpc-provider.js.map

/***/ }),

/***/ 200:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export _fetchData */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return fetchJson; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return poll; });
/* harmony import */ var _ethersproject_base64__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(853);
/* harmony import */ var _ethersproject_base64__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_ethersproject_base64__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6);
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _ethersproject_strings__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(107);
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(11);
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(524);
/* harmony import */ var _geturl__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(854);

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};






const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__["Logger"](_version__WEBPACK_IMPORTED_MODULE_5__[/* version */ "a"]);

function staller(duration) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}
function bodyify(value, type) {
    if (value == null) {
        return null;
    }
    if (typeof (value) === "string") {
        return value;
    }
    if (Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["isBytesLike"])(value)) {
        if (type && (type.split("/")[0] === "text" || type.split(";")[0].trim() === "application/json")) {
            try {
                return Object(_ethersproject_strings__WEBPACK_IMPORTED_MODULE_3__[/* toUtf8String */ "c"])(value);
            }
            catch (error) { }
            ;
        }
        return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["hexlify"])(value);
    }
    return value;
}
// This API is still a work in progress; the future changes will likely be:
// - ConnectionInfo => FetchDataRequest<T = any>
// - FetchDataRequest.body? = string | Uint8Array | { contentType: string, data: string | Uint8Array }
//   - If string => text/plain, Uint8Array => application/octet-stream (if content-type unspecified)
// - FetchDataRequest.processFunc = (body: Uint8Array, response: FetchDataResponse) => T
// For this reason, it should be considered internal until the API is finalized
function _fetchData(connection, body, processFunc) {
    // How many times to retry in the event of a throttle
    const attemptLimit = (typeof (connection) === "object" && connection.throttleLimit != null) ? connection.throttleLimit : 12;
    logger.assertArgument((attemptLimit > 0 && (attemptLimit % 1) === 0), "invalid connection throttle limit", "connection.throttleLimit", attemptLimit);
    const throttleCallback = ((typeof (connection) === "object") ? connection.throttleCallback : null);
    const throttleSlotInterval = ((typeof (connection) === "object" && typeof (connection.throttleSlotInterval) === "number") ? connection.throttleSlotInterval : 100);
    logger.assertArgument((throttleSlotInterval > 0 && (throttleSlotInterval % 1) === 0), "invalid connection throttle slot interval", "connection.throttleSlotInterval", throttleSlotInterval);
    const headers = {};
    let url = null;
    // @TODO: Allow ConnectionInfo to override some of these values
    const options = {
        method: "GET",
    };
    let allow304 = false;
    let timeout = 2 * 60 * 1000;
    if (typeof (connection) === "string") {
        url = connection;
    }
    else if (typeof (connection) === "object") {
        if (connection == null || connection.url == null) {
            logger.throwArgumentError("missing URL", "connection.url", connection);
        }
        url = connection.url;
        if (typeof (connection.timeout) === "number" && connection.timeout > 0) {
            timeout = connection.timeout;
        }
        if (connection.headers) {
            for (const key in connection.headers) {
                headers[key.toLowerCase()] = { key: key, value: String(connection.headers[key]) };
                if (["if-none-match", "if-modified-since"].indexOf(key.toLowerCase()) >= 0) {
                    allow304 = true;
                }
            }
        }
        if (connection.user != null && connection.password != null) {
            if (url.substring(0, 6) !== "https:" && connection.allowInsecureAuthentication !== true) {
                logger.throwError("basic authentication requires a secure https url", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__["Logger"].errors.INVALID_ARGUMENT, { argument: "url", url: url, user: connection.user, password: "[REDACTED]" });
            }
            const authorization = connection.user + ":" + connection.password;
            headers["authorization"] = {
                key: "Authorization",
                value: "Basic " + Object(_ethersproject_base64__WEBPACK_IMPORTED_MODULE_0__["encode"])(Object(_ethersproject_strings__WEBPACK_IMPORTED_MODULE_3__[/* toUtf8Bytes */ "b"])(authorization))
            };
        }
    }
    if (body) {
        options.method = "POST";
        options.body = body;
        if (headers["content-type"] == null) {
            headers["content-type"] = { key: "Content-Type", value: "application/octet-stream" };
        }
        if (headers["content-length"] == null) {
            headers["content-length"] = { key: "Content-Length", value: String(body.length) };
        }
    }
    const flatHeaders = {};
    Object.keys(headers).forEach((key) => {
        const header = headers[key];
        flatHeaders[header.key] = header.value;
    });
    options.headers = flatHeaders;
    const runningTimeout = (function () {
        let timer = null;
        const promise = new Promise(function (resolve, reject) {
            if (timeout) {
                timer = setTimeout(() => {
                    if (timer == null) {
                        return;
                    }
                    timer = null;
                    reject(logger.makeError("timeout", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__["Logger"].errors.TIMEOUT, {
                        requestBody: bodyify(options.body, flatHeaders["content-type"]),
                        requestMethod: options.method,
                        timeout: timeout,
                        url: url
                    }));
                }, timeout);
            }
        });
        const cancel = function () {
            if (timer == null) {
                return;
            }
            clearTimeout(timer);
            timer = null;
        };
        return { promise, cancel };
    })();
    const runningFetch = (function () {
        return __awaiter(this, void 0, void 0, function* () {
            for (let attempt = 0; attempt < attemptLimit; attempt++) {
                let response = null;
                try {
                    response = yield Object(_geturl__WEBPACK_IMPORTED_MODULE_6__[/* getUrl */ "a"])(url, options);
                    // Exponential back-off throttling
                    if (response.statusCode === 429 && attempt < attemptLimit) {
                        let tryAgain = true;
                        if (throttleCallback) {
                            tryAgain = yield throttleCallback(attempt, url);
                        }
                        if (tryAgain) {
                            let stall = 0;
                            const retryAfter = response.headers["retry-after"];
                            if (typeof (retryAfter) === "string" && retryAfter.match(/^[1-9][0-9]*$/)) {
                                stall = parseInt(retryAfter) * 1000;
                            }
                            else {
                                stall = throttleSlotInterval * parseInt(String(Math.random() * Math.pow(2, attempt)));
                            }
                            //console.log("Stalling 429");
                            yield staller(stall);
                            continue;
                        }
                    }
                }
                catch (error) {
                    response = error.response;
                    if (response == null) {
                        runningTimeout.cancel();
                        logger.throwError("missing response", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__["Logger"].errors.SERVER_ERROR, {
                            requestBody: bodyify(options.body, flatHeaders["content-type"]),
                            requestMethod: options.method,
                            serverError: error,
                            url: url
                        });
                    }
                }
                let body = response.body;
                if (allow304 && response.statusCode === 304) {
                    body = null;
                }
                else if (response.statusCode < 200 || response.statusCode >= 300) {
                    runningTimeout.cancel();
                    logger.throwError("bad response", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__["Logger"].errors.SERVER_ERROR, {
                        status: response.statusCode,
                        headers: response.headers,
                        body: bodyify(body, ((response.headers) ? response.headers["content-type"] : null)),
                        requestBody: bodyify(options.body, flatHeaders["content-type"]),
                        requestMethod: options.method,
                        url: url
                    });
                }
                if (processFunc) {
                    try {
                        const result = yield processFunc(body, response);
                        runningTimeout.cancel();
                        return result;
                    }
                    catch (error) {
                        // Allow the processFunc to trigger a throttle
                        if (error.throttleRetry && attempt < attemptLimit) {
                            let tryAgain = true;
                            if (throttleCallback) {
                                tryAgain = yield throttleCallback(attempt, url);
                            }
                            if (tryAgain) {
                                const timeout = throttleSlotInterval * parseInt(String(Math.random() * Math.pow(2, attempt)));
                                //console.log("Stalling callback");
                                yield staller(timeout);
                                continue;
                            }
                        }
                        runningTimeout.cancel();
                        logger.throwError("processing response error", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__["Logger"].errors.SERVER_ERROR, {
                            body: bodyify(body, ((response.headers) ? response.headers["content-type"] : null)),
                            error: error,
                            requestBody: bodyify(options.body, flatHeaders["content-type"]),
                            requestMethod: options.method,
                            url: url
                        });
                    }
                }
                runningTimeout.cancel();
                // If we had a processFunc, it eitehr returned a T or threw above.
                // The "body" is now a Uint8Array.
                return body;
            }
            return logger.throwError("failed response", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__["Logger"].errors.SERVER_ERROR, {
                requestBody: bodyify(options.body, flatHeaders["content-type"]),
                requestMethod: options.method,
                url: url
            });
        });
    })();
    return Promise.race([runningTimeout.promise, runningFetch]);
}
function fetchJson(connection, json, processFunc) {
    let processJsonFunc = (value, response) => {
        let result = null;
        if (value != null) {
            try {
                result = JSON.parse(Object(_ethersproject_strings__WEBPACK_IMPORTED_MODULE_3__[/* toUtf8String */ "c"])(value));
            }
            catch (error) {
                logger.throwError("invalid JSON", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__["Logger"].errors.SERVER_ERROR, {
                    body: value,
                    error: error
                });
            }
        }
        if (processFunc) {
            result = processFunc(result, response);
        }
        return result;
    };
    // If we have json to send, we must
    // - add content-type of application/json (unless already overridden)
    // - convert the json to bytes
    let body = null;
    if (json != null) {
        body = Object(_ethersproject_strings__WEBPACK_IMPORTED_MODULE_3__[/* toUtf8Bytes */ "b"])(json);
        // Create a connection with the content-type set for JSON
        const updated = (typeof (connection) === "string") ? ({ url: connection }) : Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__[/* shallowCopy */ "g"])(connection);
        if (updated.headers) {
            const hasContentType = (Object.keys(updated.headers).filter((k) => (k.toLowerCase() === "content-type")).length) !== 0;
            if (!hasContentType) {
                updated.headers = Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__[/* shallowCopy */ "g"])(updated.headers);
                updated.headers["content-type"] = "application/json";
            }
        }
        else {
            updated.headers = { "content-type": "application/json" };
        }
        connection = updated;
    }
    return _fetchData(connection, body, processJsonFunc);
}
function poll(func, options) {
    if (!options) {
        options = {};
    }
    options = Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_2__[/* shallowCopy */ "g"])(options);
    if (options.floor == null) {
        options.floor = 0;
    }
    if (options.ceiling == null) {
        options.ceiling = 10000;
    }
    if (options.interval == null) {
        options.interval = 250;
    }
    return new Promise(function (resolve, reject) {
        let timer = null;
        let done = false;
        // Returns true if cancel was successful. Unsuccessful cancel means we're already done.
        const cancel = () => {
            if (done) {
                return false;
            }
            done = true;
            if (timer) {
                clearTimeout(timer);
            }
            return true;
        };
        if (options.timeout) {
            timer = setTimeout(() => {
                if (cancel()) {
                    reject(new Error("timeout"));
                }
            }, options.timeout);
        }
        const retryLimit = options.retryLimit;
        let attempt = 0;
        function check() {
            return func().then(function (result) {
                // If we have a result, or are allowed null then we're done
                if (result !== undefined) {
                    if (cancel()) {
                        resolve(result);
                    }
                }
                else if (options.oncePoll) {
                    options.oncePoll.once("poll", check);
                }
                else if (options.onceBlock) {
                    options.onceBlock.once("block", check);
                    // Otherwise, exponential back-off (up to 10s) our next request
                }
                else if (!done) {
                    attempt++;
                    if (attempt > retryLimit) {
                        if (cancel()) {
                            reject(new Error("retry limit reached"));
                        }
                        return;
                    }
                    let timeout = options.interval * parseInt(String(Math.random() * Math.pow(2, attempt)));
                    if (timeout < options.floor) {
                        timeout = options.floor;
                    }
                    if (timeout > options.ceiling) {
                        timeout = options.ceiling;
                    }
                    setTimeout(check, timeout);
                }
                return null;
            }, function (error) {
                if (cancel()) {
                    reject(error);
                }
            });
        }
        check();
    });
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 215:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Formatter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return showThrottleMessage; });
/* harmony import */ var _ethersproject_address__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(114);
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(43);
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6);
/* harmony import */ var _ethersproject_constants__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(154);
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7);
/* harmony import */ var _ethersproject_transactions__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(621);
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(11);
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(98);









const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_6__["Logger"](_version__WEBPACK_IMPORTED_MODULE_7__[/* version */ "a"]);
class Formatter {
    constructor() {
        logger.checkNew(new.target, Formatter);
        this.formats = this.getDefaultFormats();
    }
    getDefaultFormats() {
        const formats = ({});
        const address = this.address.bind(this);
        const bigNumber = this.bigNumber.bind(this);
        const blockTag = this.blockTag.bind(this);
        const data = this.data.bind(this);
        const hash = this.hash.bind(this);
        const hex = this.hex.bind(this);
        const number = this.number.bind(this);
        const strictData = (v) => { return this.data(v, true); };
        formats.transaction = {
            hash: hash,
            blockHash: Formatter.allowNull(hash, null),
            blockNumber: Formatter.allowNull(number, null),
            transactionIndex: Formatter.allowNull(number, null),
            confirmations: Formatter.allowNull(number, null),
            from: address,
            gasPrice: bigNumber,
            gasLimit: bigNumber,
            to: Formatter.allowNull(address, null),
            value: bigNumber,
            nonce: number,
            data: data,
            r: Formatter.allowNull(this.uint256),
            s: Formatter.allowNull(this.uint256),
            v: Formatter.allowNull(number),
            creates: Formatter.allowNull(address, null),
            raw: Formatter.allowNull(data),
        };
        formats.transactionRequest = {
            from: Formatter.allowNull(address),
            nonce: Formatter.allowNull(number),
            gasLimit: Formatter.allowNull(bigNumber),
            gasPrice: Formatter.allowNull(bigNumber),
            to: Formatter.allowNull(address),
            value: Formatter.allowNull(bigNumber),
            data: Formatter.allowNull(strictData),
        };
        formats.receiptLog = {
            transactionIndex: number,
            blockNumber: number,
            transactionHash: hash,
            address: address,
            topics: Formatter.arrayOf(hash),
            data: data,
            logIndex: number,
            blockHash: hash,
        };
        formats.receipt = {
            to: Formatter.allowNull(this.address, null),
            from: Formatter.allowNull(this.address, null),
            contractAddress: Formatter.allowNull(address, null),
            transactionIndex: number,
            root: Formatter.allowNull(hash),
            gasUsed: bigNumber,
            logsBloom: Formatter.allowNull(data),
            blockHash: hash,
            transactionHash: hash,
            logs: Formatter.arrayOf(this.receiptLog.bind(this)),
            blockNumber: number,
            confirmations: Formatter.allowNull(number, null),
            cumulativeGasUsed: bigNumber,
            status: Formatter.allowNull(number)
        };
        formats.block = {
            hash: hash,
            parentHash: hash,
            number: number,
            timestamp: number,
            nonce: Formatter.allowNull(hex),
            difficulty: this.difficulty.bind(this),
            gasLimit: bigNumber,
            gasUsed: bigNumber,
            miner: address,
            extraData: data,
            transactions: Formatter.allowNull(Formatter.arrayOf(hash)),
        };
        formats.blockWithTransactions = Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_4__[/* shallowCopy */ "g"])(formats.block);
        formats.blockWithTransactions.transactions = Formatter.allowNull(Formatter.arrayOf(this.transactionResponse.bind(this)));
        formats.filter = {
            fromBlock: Formatter.allowNull(blockTag, undefined),
            toBlock: Formatter.allowNull(blockTag, undefined),
            blockHash: Formatter.allowNull(hash, undefined),
            address: Formatter.allowNull(address, undefined),
            topics: Formatter.allowNull(this.topics.bind(this), undefined),
        };
        formats.filterLog = {
            blockNumber: Formatter.allowNull(number),
            blockHash: Formatter.allowNull(hash),
            transactionIndex: number,
            removed: Formatter.allowNull(this.boolean.bind(this)),
            address: address,
            data: Formatter.allowFalsish(data, "0x"),
            topics: Formatter.arrayOf(hash),
            transactionHash: hash,
            logIndex: number,
        };
        return formats;
    }
    // Requires a BigNumberish that is within the IEEE754 safe integer range; returns a number
    // Strict! Used on input.
    number(number) {
        return _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_1__[/* BigNumber */ "a"].from(number).toNumber();
    }
    // Strict! Used on input.
    bigNumber(value) {
        return _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_1__[/* BigNumber */ "a"].from(value);
    }
    // Requires a boolean, "true" or  "false"; returns a boolean
    boolean(value) {
        if (typeof (value) === "boolean") {
            return value;
        }
        if (typeof (value) === "string") {
            value = value.toLowerCase();
            if (value === "true") {
                return true;
            }
            if (value === "false") {
                return false;
            }
        }
        throw new Error("invalid boolean - " + value);
    }
    hex(value, strict) {
        if (typeof (value) === "string") {
            if (!strict && value.substring(0, 2) !== "0x") {
                value = "0x" + value;
            }
            if (Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["isHexString"])(value)) {
                return value.toLowerCase();
            }
        }
        return logger.throwArgumentError("invalid hash", "value", value);
    }
    data(value, strict) {
        const result = this.hex(value, strict);
        if ((result.length % 2) !== 0) {
            throw new Error("invalid data; odd-length - " + value);
        }
        return result;
    }
    // Requires an address
    // Strict! Used on input.
    address(value) {
        return Object(_ethersproject_address__WEBPACK_IMPORTED_MODULE_0__[/* getAddress */ "a"])(value);
    }
    callAddress(value) {
        if (!Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["isHexString"])(value, 32)) {
            return null;
        }
        const address = Object(_ethersproject_address__WEBPACK_IMPORTED_MODULE_0__[/* getAddress */ "a"])(Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["hexDataSlice"])(value, 12));
        return (address === _ethersproject_constants__WEBPACK_IMPORTED_MODULE_3__[/* AddressZero */ "a"]) ? null : address;
    }
    contractAddress(value) {
        return Object(_ethersproject_address__WEBPACK_IMPORTED_MODULE_0__[/* getContractAddress */ "b"])(value);
    }
    // Strict! Used on input.
    blockTag(blockTag) {
        if (blockTag == null) {
            return "latest";
        }
        if (blockTag === "earliest") {
            return "0x0";
        }
        if (blockTag === "latest" || blockTag === "pending") {
            return blockTag;
        }
        if (typeof (blockTag) === "number" || Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["isHexString"])(blockTag)) {
            return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["hexValue"])(blockTag);
        }
        throw new Error("invalid blockTag");
    }
    // Requires a hash, optionally requires 0x prefix; returns prefixed lowercase hash.
    hash(value, strict) {
        const result = this.hex(value, strict);
        if (Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["hexDataLength"])(result) !== 32) {
            return logger.throwArgumentError("invalid hash", "value", value);
        }
        return result;
    }
    // Returns the difficulty as a number, or if too large (i.e. PoA network) null
    difficulty(value) {
        if (value == null) {
            return null;
        }
        const v = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_1__[/* BigNumber */ "a"].from(value);
        try {
            return v.toNumber();
        }
        catch (error) { }
        return null;
    }
    uint256(value) {
        if (!Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["isHexString"])(value)) {
            throw new Error("invalid uint256");
        }
        return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["hexZeroPad"])(value, 32);
    }
    _block(value, format) {
        if (value.author != null && value.miner == null) {
            value.miner = value.author;
        }
        return Formatter.check(format, value);
    }
    block(value) {
        return this._block(value, this.formats.block);
    }
    blockWithTransactions(value) {
        return this._block(value, this.formats.blockWithTransactions);
    }
    // Strict! Used on input.
    transactionRequest(value) {
        return Formatter.check(this.formats.transactionRequest, value);
    }
    transactionResponse(transaction) {
        // Rename gas to gasLimit
        if (transaction.gas != null && transaction.gasLimit == null) {
            transaction.gasLimit = transaction.gas;
        }
        // Some clients (TestRPC) do strange things like return 0x0 for the
        // 0 address; correct this to be a real address
        if (transaction.to && _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_1__[/* BigNumber */ "a"].from(transaction.to).isZero()) {
            transaction.to = "0x0000000000000000000000000000000000000000";
        }
        // Rename input to data
        if (transaction.input != null && transaction.data == null) {
            transaction.data = transaction.input;
        }
        // If to and creates are empty, populate the creates from the transaction
        if (transaction.to == null && transaction.creates == null) {
            transaction.creates = this.contractAddress(transaction);
        }
        // @TODO: use transaction.serialize? Have to add support for including v, r, and s...
        /*
        if (!transaction.raw) {
 
             // Very loose providers (e.g. TestRPC) do not provide a signature or raw
             if (transaction.v && transaction.r && transaction.s) {
                 let raw = [
                     stripZeros(hexlify(transaction.nonce)),
                     stripZeros(hexlify(transaction.gasPrice)),
                     stripZeros(hexlify(transaction.gasLimit)),
                     (transaction.to || "0x"),
                     stripZeros(hexlify(transaction.value || "0x")),
                     hexlify(transaction.data || "0x"),
                     stripZeros(hexlify(transaction.v || "0x")),
                     stripZeros(hexlify(transaction.r)),
                     stripZeros(hexlify(transaction.s)),
                 ];
 
                 transaction.raw = rlpEncode(raw);
             }
         }
         */
        const result = Formatter.check(this.formats.transaction, transaction);
        if (transaction.chainId != null) {
            let chainId = transaction.chainId;
            if (Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["isHexString"])(chainId)) {
                chainId = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_1__[/* BigNumber */ "a"].from(chainId).toNumber();
            }
            result.chainId = chainId;
        }
        else {
            let chainId = transaction.networkId;
            // geth-etc returns chainId
            if (chainId == null && result.v == null) {
                chainId = transaction.chainId;
            }
            if (Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_2__["isHexString"])(chainId)) {
                chainId = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_1__[/* BigNumber */ "a"].from(chainId).toNumber();
            }
            if (typeof (chainId) !== "number" && result.v != null) {
                chainId = (result.v - 35) / 2;
                if (chainId < 0) {
                    chainId = 0;
                }
                chainId = parseInt(chainId);
            }
            if (typeof (chainId) !== "number") {
                chainId = 0;
            }
            result.chainId = chainId;
        }
        // 0x0000... should actually be null
        if (result.blockHash && result.blockHash.replace(/0/g, "") === "x") {
            result.blockHash = null;
        }
        return result;
    }
    transaction(value) {
        return Object(_ethersproject_transactions__WEBPACK_IMPORTED_MODULE_5__["parse"])(value);
    }
    receiptLog(value) {
        return Formatter.check(this.formats.receiptLog, value);
    }
    receipt(value) {
        const result = Formatter.check(this.formats.receipt, value);
        if (value.status != null) {
            result.byzantium = true;
        }
        return result;
    }
    topics(value) {
        if (Array.isArray(value)) {
            return value.map((v) => this.topics(v));
        }
        else if (value != null) {
            return this.hash(value, true);
        }
        return null;
    }
    filter(value) {
        return Formatter.check(this.formats.filter, value);
    }
    filterLog(value) {
        return Formatter.check(this.formats.filterLog, value);
    }
    static check(format, object) {
        const result = {};
        for (const key in format) {
            try {
                const value = format[key](object[key]);
                if (value !== undefined) {
                    result[key] = value;
                }
            }
            catch (error) {
                error.checkKey = key;
                error.checkValue = object[key];
                throw error;
            }
        }
        return result;
    }
    // if value is null-ish, nullValue is returned
    static allowNull(format, nullValue) {
        return (function (value) {
            if (value == null) {
                return nullValue;
            }
            return format(value);
        });
    }
    // If value is false-ish, replaceValue is returned
    static allowFalsish(format, replaceValue) {
        return (function (value) {
            if (!value) {
                return replaceValue;
            }
            return format(value);
        });
    }
    // Requires an Array satisfying check
    static arrayOf(format) {
        return (function (array) {
            if (!Array.isArray(array)) {
                throw new Error("not an array");
            }
            const result = [];
            array.forEach(function (value) {
                result.push(format(value));
            });
            return result;
        });
    }
}
// Show the throttle message only once
let throttleMessage = false;
function showThrottleMessage() {
    if (throttleMessage) {
        return;
    }
    throttleMessage = true;
    console.log("========= NOTICE =========");
    console.log("Request-Rate Exceeded  (this message will not be repeated)");
    console.log("");
    console.log("The default API keys for each service are provided as a highly-throttled,");
    console.log("community resource for low-traffic projects and early prototyping.");
    console.log("");
    console.log("While your application will continue to function, we highly recommended");
    console.log("signing up for your own API keys to improve performance, increase your");
    console.log("request rate/limit and enable other perks, such as metrics and advanced APIs.");
    console.log("");
    console.log("For more details: https:/\/docs.ethers.io/api-keys/");
    console.log("==========================");
}
//# sourceMappingURL=formatter.js.map

/***/ }),

/***/ 233:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var assert = __webpack_require__(159);
var inherits = __webpack_require__(71);

exports.inherits = inherits;

function toArray(msg, enc) {
  if (Array.isArray(msg))
    return msg.slice();
  if (!msg)
    return [];
  var res = [];
  if (typeof msg === 'string') {
    if (!enc) {
      for (var i = 0; i < msg.length; i++) {
        var c = msg.charCodeAt(i);
        var hi = c >> 8;
        var lo = c & 0xff;
        if (hi)
          res.push(hi, lo);
        else
          res.push(lo);
      }
    } else if (enc === 'hex') {
      msg = msg.replace(/[^a-z0-9]+/ig, '');
      if (msg.length % 2 !== 0)
        msg = '0' + msg;
      for (i = 0; i < msg.length; i += 2)
        res.push(parseInt(msg[i] + msg[i + 1], 16));
    }
  } else {
    for (i = 0; i < msg.length; i++)
      res[i] = msg[i] | 0;
  }
  return res;
}
exports.toArray = toArray;

function toHex(msg) {
  var res = '';
  for (var i = 0; i < msg.length; i++)
    res += zero2(msg[i].toString(16));
  return res;
}
exports.toHex = toHex;

function htonl(w) {
  var res = (w >>> 24) |
            ((w >>> 8) & 0xff00) |
            ((w << 8) & 0xff0000) |
            ((w & 0xff) << 24);
  return res >>> 0;
}
exports.htonl = htonl;

function toHex32(msg, endian) {
  var res = '';
  for (var i = 0; i < msg.length; i++) {
    var w = msg[i];
    if (endian === 'little')
      w = htonl(w);
    res += zero8(w.toString(16));
  }
  return res;
}
exports.toHex32 = toHex32;

function zero2(word) {
  if (word.length === 1)
    return '0' + word;
  else
    return word;
}
exports.zero2 = zero2;

function zero8(word) {
  if (word.length === 7)
    return '0' + word;
  else if (word.length === 6)
    return '00' + word;
  else if (word.length === 5)
    return '000' + word;
  else if (word.length === 4)
    return '0000' + word;
  else if (word.length === 3)
    return '00000' + word;
  else if (word.length === 2)
    return '000000' + word;
  else if (word.length === 1)
    return '0000000' + word;
  else
    return word;
}
exports.zero8 = zero8;

function join32(msg, start, end, endian) {
  var len = end - start;
  assert(len % 4 === 0);
  var res = new Array(len / 4);
  for (var i = 0, k = start; i < res.length; i++, k += 4) {
    var w;
    if (endian === 'big')
      w = (msg[k] << 24) | (msg[k + 1] << 16) | (msg[k + 2] << 8) | msg[k + 3];
    else
      w = (msg[k + 3] << 24) | (msg[k + 2] << 16) | (msg[k + 1] << 8) | msg[k];
    res[i] = w >>> 0;
  }
  return res;
}
exports.join32 = join32;

function split32(msg, endian) {
  var res = new Array(msg.length * 4);
  for (var i = 0, k = 0; i < msg.length; i++, k += 4) {
    var m = msg[i];
    if (endian === 'big') {
      res[k] = m >>> 24;
      res[k + 1] = (m >>> 16) & 0xff;
      res[k + 2] = (m >>> 8) & 0xff;
      res[k + 3] = m & 0xff;
    } else {
      res[k + 3] = m >>> 24;
      res[k + 2] = (m >>> 16) & 0xff;
      res[k + 1] = (m >>> 8) & 0xff;
      res[k] = m & 0xff;
    }
  }
  return res;
}
exports.split32 = split32;

function rotr32(w, b) {
  return (w >>> b) | (w << (32 - b));
}
exports.rotr32 = rotr32;

function rotl32(w, b) {
  return (w << b) | (w >>> (32 - b));
}
exports.rotl32 = rotl32;

function sum32(a, b) {
  return (a + b) >>> 0;
}
exports.sum32 = sum32;

function sum32_3(a, b, c) {
  return (a + b + c) >>> 0;
}
exports.sum32_3 = sum32_3;

function sum32_4(a, b, c, d) {
  return (a + b + c + d) >>> 0;
}
exports.sum32_4 = sum32_4;

function sum32_5(a, b, c, d, e) {
  return (a + b + c + d + e) >>> 0;
}
exports.sum32_5 = sum32_5;

function sum64(buf, pos, ah, al) {
  var bh = buf[pos];
  var bl = buf[pos + 1];

  var lo = (al + bl) >>> 0;
  var hi = (lo < al ? 1 : 0) + ah + bh;
  buf[pos] = hi >>> 0;
  buf[pos + 1] = lo;
}
exports.sum64 = sum64;

function sum64_hi(ah, al, bh, bl) {
  var lo = (al + bl) >>> 0;
  var hi = (lo < al ? 1 : 0) + ah + bh;
  return hi >>> 0;
}
exports.sum64_hi = sum64_hi;

function sum64_lo(ah, al, bh, bl) {
  var lo = al + bl;
  return lo >>> 0;
}
exports.sum64_lo = sum64_lo;

function sum64_4_hi(ah, al, bh, bl, ch, cl, dh, dl) {
  var carry = 0;
  var lo = al;
  lo = (lo + bl) >>> 0;
  carry += lo < al ? 1 : 0;
  lo = (lo + cl) >>> 0;
  carry += lo < cl ? 1 : 0;
  lo = (lo + dl) >>> 0;
  carry += lo < dl ? 1 : 0;

  var hi = ah + bh + ch + dh + carry;
  return hi >>> 0;
}
exports.sum64_4_hi = sum64_4_hi;

function sum64_4_lo(ah, al, bh, bl, ch, cl, dh, dl) {
  var lo = al + bl + cl + dl;
  return lo >>> 0;
}
exports.sum64_4_lo = sum64_4_lo;

function sum64_5_hi(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
  var carry = 0;
  var lo = al;
  lo = (lo + bl) >>> 0;
  carry += lo < al ? 1 : 0;
  lo = (lo + cl) >>> 0;
  carry += lo < cl ? 1 : 0;
  lo = (lo + dl) >>> 0;
  carry += lo < dl ? 1 : 0;
  lo = (lo + el) >>> 0;
  carry += lo < el ? 1 : 0;

  var hi = ah + bh + ch + dh + eh + carry;
  return hi >>> 0;
}
exports.sum64_5_hi = sum64_5_hi;

function sum64_5_lo(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
  var lo = al + bl + cl + dl + el;

  return lo >>> 0;
}
exports.sum64_5_lo = sum64_5_lo;

function rotr64_hi(ah, al, num) {
  var r = (al << (32 - num)) | (ah >>> num);
  return r >>> 0;
}
exports.rotr64_hi = rotr64_hi;

function rotr64_lo(ah, al, num) {
  var r = (ah << (32 - num)) | (al >>> num);
  return r >>> 0;
}
exports.rotr64_lo = rotr64_lo;

function shr64_hi(ah, al, num) {
  return ah >>> num;
}
exports.shr64_hi = shr64_hi;

function shr64_lo(ah, al, num) {
  var r = (ah << (32 - num)) | (al >>> num);
  return r >>> 0;
}
exports.shr64_lo = shr64_lo;


/***/ }),

/***/ 246:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ lib_esm_ForkEvent; });
__webpack_require__.d(__webpack_exports__, "b", function() { return /* binding */ lib_esm_Provider; });

// UNUSED EXPORTS: BlockForkEvent, TransactionForkEvent, TransactionOrderForkEvent

// EXTERNAL MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(6);

// EXTERNAL MODULE: ./node_modules/@ethersproject/properties/lib.esm/index.js + 1 modules
var properties_lib_esm = __webpack_require__(7);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/abstract-provider/lib.esm/_version.js
const version = "abstract-provider/5.0.4";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/abstract-provider/lib.esm/index.js





const logger = new logger_lib_esm["Logger"](version);
;
;
//export type CallTransactionable = {
//    call(transaction: TransactionRequest): Promise<TransactionResponse>;
//};
class lib_esm_ForkEvent extends properties_lib_esm["a" /* Description */] {
    static isForkEvent(value) {
        return !!(value && value._isForkEvent);
    }
}
class lib_esm_BlockForkEvent extends lib_esm_ForkEvent {
    constructor(blockHash, expiry) {
        if (!Object(lib_esm["isHexString"])(blockHash, 32)) {
            logger.throwArgumentError("invalid blockHash", "blockHash", blockHash);
        }
        super({
            _isForkEvent: true,
            _isBlockForkEvent: true,
            expiry: (expiry || 0),
            blockHash: blockHash
        });
    }
}
class lib_esm_TransactionForkEvent extends lib_esm_ForkEvent {
    constructor(hash, expiry) {
        if (!Object(lib_esm["isHexString"])(hash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "hash", hash);
        }
        super({
            _isForkEvent: true,
            _isTransactionForkEvent: true,
            expiry: (expiry || 0),
            hash: hash
        });
    }
}
class lib_esm_TransactionOrderForkEvent extends lib_esm_ForkEvent {
    constructor(beforeHash, afterHash, expiry) {
        if (!Object(lib_esm["isHexString"])(beforeHash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "beforeHash", beforeHash);
        }
        if (!Object(lib_esm["isHexString"])(afterHash, 32)) {
            logger.throwArgumentError("invalid transaction hash", "afterHash", afterHash);
        }
        super({
            _isForkEvent: true,
            _isTransactionOrderForkEvent: true,
            expiry: (expiry || 0),
            beforeHash: beforeHash,
            afterHash: afterHash
        });
    }
}
///////////////////////////////
// Exported Abstracts
class lib_esm_Provider {
    constructor() {
        logger.checkAbstract(new.target, lib_esm_Provider);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_isProvider", true);
    }
    // Alias for "on"
    addListener(eventName, listener) {
        return this.on(eventName, listener);
    }
    // Alias for "off"
    removeListener(eventName, listener) {
        return this.off(eventName, listener);
    }
    static isProvider(value) {
        return !!(value && value._isProvider);
    }
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 257:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ base_provider_BaseProvider; });

// UNUSED EXPORTS: Event, Resolver

// EXTERNAL MODULE: ./node_modules/@ethersproject/abstract-provider/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(246);

// EXTERNAL MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js + 1 modules
var bytes_lib_esm = __webpack_require__(6);

// EXTERNAL MODULE: ./node_modules/@ethersproject/properties/lib.esm/index.js + 1 modules
var properties_lib_esm = __webpack_require__(7);

// CONCATENATED MODULE: ./node_modules/@ethersproject/basex/lib.esm/index.js
/**
 * var basex = require("base-x");
 *
 * This implementation is heavily based on base-x. The main reason to
 * deviate was to prevent the dependency of Buffer.
 *
 * Contributors:
 *
 * base-x encoding
 * Forked from https://github.com/cryptocoinjs/bs58
 * Originally written by Mike Hearn for BitcoinJ
 * Copyright (c) 2011 Google Inc
 * Ported to JavaScript by Stefan Thomas
 * Merged Buffer refactorings from base58-native by Stephen Pair
 * Copyright (c) 2013 BitPay Inc
 *
 * The MIT License (MIT)
 *
 * Copyright base-x contributors (c) 2016
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 */


class lib_esm_BaseX {
    constructor(alphabet) {
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "alphabet", alphabet);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "base", alphabet.length);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_alphabetMap", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_leader", alphabet.charAt(0));
        // pre-compute lookup table
        for (let i = 0; i < alphabet.length; i++) {
            this._alphabetMap[alphabet.charAt(i)] = i;
        }
    }
    encode(value) {
        let source = Object(bytes_lib_esm["arrayify"])(value);
        if (source.length === 0) {
            return "";
        }
        let digits = [0];
        for (let i = 0; i < source.length; ++i) {
            let carry = source[i];
            for (let j = 0; j < digits.length; ++j) {
                carry += digits[j] << 8;
                digits[j] = carry % this.base;
                carry = (carry / this.base) | 0;
            }
            while (carry > 0) {
                digits.push(carry % this.base);
                carry = (carry / this.base) | 0;
            }
        }
        let string = "";
        // deal with leading zeros
        for (let k = 0; source[k] === 0 && k < source.length - 1; ++k) {
            string += this._leader;
        }
        // convert digits to a string
        for (let q = digits.length - 1; q >= 0; --q) {
            string += this.alphabet[digits[q]];
        }
        return string;
    }
    decode(value) {
        if (typeof (value) !== "string") {
            throw new TypeError("Expected String");
        }
        let bytes = [];
        if (value.length === 0) {
            return new Uint8Array(bytes);
        }
        bytes.push(0);
        for (let i = 0; i < value.length; i++) {
            let byte = this._alphabetMap[value[i]];
            if (byte === undefined) {
                throw new Error("Non-base" + this.base + " character");
            }
            let carry = byte;
            for (let j = 0; j < bytes.length; ++j) {
                carry += bytes[j] * this.base;
                bytes[j] = carry & 0xff;
                carry >>= 8;
            }
            while (carry > 0) {
                bytes.push(carry & 0xff);
                carry >>= 8;
            }
        }
        // deal with leading zeros
        for (let k = 0; value[k] === this._leader && k < value.length - 1; ++k) {
            bytes.push(0);
        }
        return Object(bytes_lib_esm["arrayify"])(new Uint8Array(bytes.reverse()));
    }
}
const Base32 = new lib_esm_BaseX("abcdefghijklmnopqrstuvwxyz234567");
const Base58 = new lib_esm_BaseX("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

//console.log(Base58.decode("Qmd2V777o5XvJbYMeMb8k2nU5f8d3ciUQ5YpYuWhzv8iDj"))
//console.log(Base58.encode(Base58.decode("Qmd2V777o5XvJbYMeMb8k2nU5f8d3ciUQ5YpYuWhzv8iDj")))
//# sourceMappingURL=index.js.map
// EXTERNAL MODULE: ./node_modules/@ethersproject/bignumber/lib.esm/index.js + 3 modules
var bignumber_lib_esm = __webpack_require__(43);

// EXTERNAL MODULE: ./node_modules/@ethersproject/constants/lib.esm/index.js
var constants_lib_esm = __webpack_require__(154);

// EXTERNAL MODULE: ./node_modules/@ethersproject/hash/lib.esm/index.js + 1 modules
var hash_lib_esm = __webpack_require__(177);

// EXTERNAL MODULE: ./node_modules/@ethersproject/networks/lib.esm/index.js + 1 modules
var networks_lib_esm = __webpack_require__(291);

// EXTERNAL MODULE: ./node_modules/@ethersproject/sha2/lib/browser.js
var browser = __webpack_require__(427);

// EXTERNAL MODULE: ./node_modules/@ethersproject/strings/lib.esm/index.js + 4 modules
var strings_lib_esm = __webpack_require__(107);

// EXTERNAL MODULE: ./node_modules/@ethersproject/web/lib.esm/index.js
var web_lib_esm = __webpack_require__(200);

// EXTERNAL MODULE: ./node_modules/bech32/index.js
var bech32 = __webpack_require__(629);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// EXTERNAL MODULE: ./node_modules/@ethersproject/providers/lib.esm/_version.js
var _version = __webpack_require__(98);

// EXTERNAL MODULE: ./node_modules/@ethersproject/providers/lib.esm/formatter.js
var formatter = __webpack_require__(215);

// CONCATENATED MODULE: ./node_modules/@ethersproject/providers/lib.esm/base-provider.js

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};














const logger = new logger_lib_esm["Logger"](_version["a" /* version */]);

//////////////////////////////
// Event Serializeing
function checkTopic(topic) {
    if (topic == null) {
        return "null";
    }
    if (Object(bytes_lib_esm["hexDataLength"])(topic) !== 32) {
        logger.throwArgumentError("invalid topic", "topic", topic);
    }
    return topic.toLowerCase();
}
function serializeTopics(topics) {
    // Remove trailing null AND-topics; they are redundant
    topics = topics.slice();
    while (topics.length > 0 && topics[topics.length - 1] == null) {
        topics.pop();
    }
    return topics.map((topic) => {
        if (Array.isArray(topic)) {
            // Only track unique OR-topics
            const unique = {};
            topic.forEach((topic) => {
                unique[checkTopic(topic)] = true;
            });
            // The order of OR-topics does not matter
            const sorted = Object.keys(unique);
            sorted.sort();
            return sorted.join("|");
        }
        else {
            return checkTopic(topic);
        }
    }).join("&");
}
function deserializeTopics(data) {
    if (data === "") {
        return [];
    }
    return data.split(/&/g).map((topic) => {
        if (topic === "") {
            return [];
        }
        const comps = topic.split("|").map((topic) => {
            return ((topic === "null") ? null : topic);
        });
        return ((comps.length === 1) ? comps[0] : comps);
    });
}
function getEventTag(eventName) {
    if (typeof (eventName) === "string") {
        eventName = eventName.toLowerCase();
        if (Object(bytes_lib_esm["hexDataLength"])(eventName) === 32) {
            return "tx:" + eventName;
        }
        if (eventName.indexOf(":") === -1) {
            return eventName;
        }
    }
    else if (Array.isArray(eventName)) {
        return "filter:*:" + serializeTopics(eventName);
    }
    else if (lib_esm["a" /* ForkEvent */].isForkEvent(eventName)) {
        logger.warn("not implemented");
        throw new Error("not implemented");
    }
    else if (eventName && typeof (eventName) === "object") {
        return "filter:" + (eventName.address || "*") + ":" + serializeTopics(eventName.topics || []);
    }
    throw new Error("invalid event - " + eventName);
}
//////////////////////////////
// Helper Object
function getTime() {
    return (new Date()).getTime();
}
function stall(duration) {
    return new Promise((resolve) => {
        setTimeout(resolve, duration);
    });
}
//////////////////////////////
// Provider Object
/**
 *  EventType
 *   - "block"
 *   - "poll"
 *   - "didPoll"
 *   - "pending"
 *   - "error"
 *   - "network"
 *   - filter
 *   - topics array
 *   - transaction hash
 */
const PollableEvents = ["block", "network", "pending", "poll"];
class base_provider_Event {
    constructor(tag, listener, once) {
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "tag", tag);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "listener", listener);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "once", once);
    }
    get event() {
        switch (this.type) {
            case "tx":
                return this.hash;
            case "filter":
                return this.filter;
        }
        return this.tag;
    }
    get type() {
        return this.tag.split(":")[0];
    }
    get hash() {
        const comps = this.tag.split(":");
        if (comps[0] !== "tx") {
            return null;
        }
        return comps[1];
    }
    get filter() {
        const comps = this.tag.split(":");
        if (comps[0] !== "filter") {
            return null;
        }
        const address = comps[1];
        const topics = deserializeTopics(comps[2]);
        const filter = {};
        if (topics.length > 0) {
            filter.topics = topics;
        }
        if (address && address !== "*") {
            filter.address = address;
        }
        return filter;
    }
    pollable() {
        return (this.tag.indexOf(":") >= 0 || PollableEvents.indexOf(this.tag) >= 0);
    }
}
;
// https://github.com/satoshilabs/slips/blob/master/slip-0044.md
const coinInfos = {
    "0": { symbol: "btc", p2pkh: 0x00, p2sh: 0x05, prefix: "bc" },
    "2": { symbol: "ltc", p2pkh: 0x30, p2sh: 0x32, prefix: "ltc" },
    "3": { symbol: "doge", p2pkh: 0x1e, p2sh: 0x16 },
    "60": { symbol: "eth", ilk: "eth" },
    "61": { symbol: "etc", ilk: "eth" },
    "700": { symbol: "xdai", ilk: "eth" },
};
function bytes32ify(value) {
    return Object(bytes_lib_esm["hexZeroPad"])(bignumber_lib_esm["a" /* BigNumber */].from(value).toHexString(), 32);
}
// Compute the Base58Check encoded data (checksum is first 4 bytes of sha256d)
function base58Encode(data) {
    return Base58.encode(Object(bytes_lib_esm["concat"])([data, Object(bytes_lib_esm["hexDataSlice"])(Object(browser["sha256"])(Object(browser["sha256"])(data)), 0, 4)]));
}
class base_provider_Resolver {
    constructor(provider, address, name) {
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "provider", provider);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "name", name);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "address", provider.formatter.address(address));
    }
    _fetchBytes(selector, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            // keccak256("addr(bytes32,uint256)")
            const transaction = {
                to: this.address,
                data: Object(bytes_lib_esm["hexConcat"])([selector, Object(hash_lib_esm["b" /* namehash */])(this.name), (parameters || "0x")])
            };
            const result = yield this.provider.call(transaction);
            if (result === "0x") {
                return null;
            }
            const offset = bignumber_lib_esm["a" /* BigNumber */].from(Object(bytes_lib_esm["hexDataSlice"])(result, 0, 32)).toNumber();
            const length = bignumber_lib_esm["a" /* BigNumber */].from(Object(bytes_lib_esm["hexDataSlice"])(result, offset, offset + 32)).toNumber();
            return Object(bytes_lib_esm["hexDataSlice"])(result, offset + 32, offset + 32 + length);
        });
    }
    _getAddress(coinType, hexBytes) {
        const coinInfo = coinInfos[String(coinType)];
        if (coinInfo == null) {
            logger.throwError(`unsupported coin type: ${coinType}`, logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: `getAddress(${coinType})`
            });
        }
        if (coinInfo.ilk === "eth") {
            return this.provider.formatter.address(hexBytes);
        }
        const bytes = Object(bytes_lib_esm["arrayify"])(hexBytes);
        // P2PKH: OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
        if (coinInfo.p2pkh != null) {
            const p2pkh = hexBytes.match(/^0x76a9([0-9a-f][0-9a-f])([0-9a-f]*)88ac$/);
            if (p2pkh) {
                const length = parseInt(p2pkh[1], 16);
                if (p2pkh[2].length === length * 2 && length >= 1 && length <= 75) {
                    return base58Encode(Object(bytes_lib_esm["concat"])([[coinInfo.p2pkh], ("0x" + p2pkh[2])]));
                }
            }
        }
        // P2SH: OP_HASH160 <scriptHash> OP_EQUAL
        if (coinInfo.p2sh != null) {
            const p2sh = hexBytes.match(/^0xa9([0-9a-f][0-9a-f])([0-9a-f]*)87$/);
            if (p2sh) {
                const length = parseInt(p2sh[1], 16);
                if (p2sh[2].length === length * 2 && length >= 1 && length <= 75) {
                    return base58Encode(Object(bytes_lib_esm["concat"])([[coinInfo.p2sh], ("0x" + p2sh[2])]));
                }
            }
        }
        // Bech32
        if (coinInfo.prefix != null) {
            const length = bytes[1];
            // https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki#witness-program
            let version = bytes[0];
            if (version === 0x00) {
                if (length !== 20 && length !== 32) {
                    version = -1;
                }
            }
            else {
                version = -1;
            }
            if (version >= 0 && bytes.length === 2 + length && length >= 1 && length <= 75) {
                const words = Object(bech32["toWords"])(bytes.slice(2));
                words.unshift(version);
                return Object(bech32["encode"])(coinInfo.prefix, words);
            }
        }
        return null;
    }
    getAddress(coinType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (coinType == null) {
                coinType = 60;
            }
            // If Ethereum, use the standard `addr(bytes32)`
            if (coinType === 60) {
                // keccak256("addr(bytes32)")
                const transaction = {
                    to: this.address,
                    data: ("0x3b3b57de" + Object(hash_lib_esm["b" /* namehash */])(this.name).substring(2))
                };
                const hexBytes = yield this.provider.call(transaction);
                // No address
                if (hexBytes === "0x" || hexBytes === constants_lib_esm["b" /* HashZero */]) {
                    return null;
                }
                return this.provider.formatter.callAddress(hexBytes);
            }
            // keccak256("addr(bytes32,uint256")
            const hexBytes = yield this._fetchBytes("0xf1cb7e06", bytes32ify(coinType));
            // No address
            if (hexBytes == null || hexBytes === "0x") {
                return null;
            }
            // Compute the address
            const address = this._getAddress(coinType, hexBytes);
            if (address == null) {
                logger.throwError(`invalid or unsupported coin data`, logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                    operation: `getAddress(${coinType})`,
                    coinType: coinType,
                    data: hexBytes
                });
            }
            return address;
        });
    }
    getContentHash() {
        return __awaiter(this, void 0, void 0, function* () {
            // keccak256("contenthash()")
            const hexBytes = yield this._fetchBytes("0xbc1c58d1");
            // No contenthash
            if (hexBytes == null || hexBytes === "0x") {
                return null;
            }
            // IPFS (CID: 1, Type: DAG-PB)
            const ipfs = hexBytes.match(/^0xe3010170(([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f]*))$/);
            if (ipfs) {
                const length = parseInt(ipfs[3], 16);
                if (ipfs[4].length === length * 2) {
                    return "ipfs:/\/" + Base58.encode("0x" + ipfs[1]);
                }
            }
            // Swarm (CID: 1, Type: swarm-manifest; hash/length hard-coded to keccak256/32)
            const swarm = hexBytes.match(/^0xe40101fa011b20([0-9a-f]*)$/);
            if (swarm) {
                if (swarm[1].length === (32 * 2)) {
                    return "bzz:/\/" + swarm[1];
                }
            }
            return logger.throwError(`invalid or unsupported content hash data`, logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "getContentHash()",
                data: hexBytes
            });
        });
    }
    getText(key) {
        return __awaiter(this, void 0, void 0, function* () {
            // The key encoded as parameter to fetchBytes
            let keyBytes = Object(strings_lib_esm["b" /* toUtf8Bytes */])(key);
            // The nodehash consumes the first slot, so the string pointer targets
            // offset 64, with the length at offset 64 and data starting at offset 96
            keyBytes = Object(bytes_lib_esm["concat"])([bytes32ify(64), bytes32ify(keyBytes.length), keyBytes]);
            // Pad to word-size (32 bytes)
            if ((keyBytes.length % 32) !== 0) {
                keyBytes = Object(bytes_lib_esm["concat"])([keyBytes, Object(bytes_lib_esm["hexZeroPad"])("0x", 32 - (key.length % 32))]);
            }
            const hexBytes = yield this._fetchBytes("0x59d1d43c", Object(bytes_lib_esm["hexlify"])(keyBytes));
            if (hexBytes == null || hexBytes === "0x") {
                return null;
            }
            return Object(strings_lib_esm["c" /* toUtf8String */])(hexBytes);
        });
    }
}
let defaultFormatter = null;
let nextPollId = 1;
class base_provider_BaseProvider extends lib_esm["b" /* Provider */] {
    /**
     *  ready
     *
     *  A Promise<Network> that resolves only once the provider is ready.
     *
     *  Sub-classes that call the super with a network without a chainId
     *  MUST set this. Standard named networks have a known chainId.
     *
     */
    constructor(network) {
        logger.checkNew(new.target, lib_esm["b" /* Provider */]);
        super();
        // Events being listened to
        this._events = [];
        this._emitted = { block: -2 };
        this.formatter = new.target.getFormatter();
        // If network is any, this Provider allows the underlying
        // network to change dynamically, and we auto-detect the
        // current network
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "anyNetwork", (network === "any"));
        if (this.anyNetwork) {
            network = this.detectNetwork();
        }
        if (network instanceof Promise) {
            this._networkPromise = network;
            // Squash any "unhandled promise" errors; that do not need to be handled
            network.catch((error) => { });
            // Trigger initial network setting (async)
            this._ready().catch((error) => { });
        }
        else {
            const knownNetwork = Object(properties_lib_esm["e" /* getStatic */])((new.target), "getNetwork")(network);
            if (knownNetwork) {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_network", knownNetwork);
                this.emit("network", knownNetwork, null);
            }
            else {
                logger.throwArgumentError("invalid network", "network", network);
            }
        }
        this._maxInternalBlockNumber = -1024;
        this._lastBlockNumber = -2;
        this._pollingInterval = 4000;
        this._fastQueryDate = 0;
    }
    _ready() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._network == null) {
                let network = null;
                if (this._networkPromise) {
                    try {
                        network = yield this._networkPromise;
                    }
                    catch (error) { }
                }
                // Try the Provider's network detection (this MUST throw if it cannot)
                if (network == null) {
                    network = yield this.detectNetwork();
                }
                // This should never happen; every Provider sub-class should have
                // suggested a network by here (or have thrown).
                if (!network) {
                    logger.throwError("no network detected", logger_lib_esm["Logger"].errors.UNKNOWN_ERROR, {});
                }
                // Possible this call stacked so do not call defineReadOnly again
                if (this._network == null) {
                    if (this.anyNetwork) {
                        this._network = network;
                    }
                    else {
                        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_network", network);
                    }
                    this.emit("network", network, null);
                }
            }
            return this._network;
        });
    }
    // This will always return the most recently established network.
    // For "any", this can change (a "network" event is emitted before
    // any change is refelcted); otherwise this cannot change
    get ready() {
        return Object(web_lib_esm["b" /* poll */])(() => {
            return this._ready().then((network) => {
                return network;
            }, (error) => {
                // If the network isn't running yet, we will wait
                if (error.code === logger_lib_esm["Logger"].errors.NETWORK_ERROR && error.event === "noNetwork") {
                    return undefined;
                }
                throw error;
            });
        });
    }
    // @TODO: Remove this and just create a singleton formatter
    static getFormatter() {
        if (defaultFormatter == null) {
            defaultFormatter = new formatter["a" /* Formatter */]();
        }
        return defaultFormatter;
    }
    // @TODO: Remove this and just use getNetwork
    static getNetwork(network) {
        return Object(networks_lib_esm["a" /* getNetwork */])((network == null) ? "homestead" : network);
    }
    // Fetches the blockNumber, but will reuse any result that is less
    // than maxAge old or has been requested since the last request
    _getInternalBlockNumber(maxAge) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._ready();
            const internalBlockNumber = this._internalBlockNumber;
            if (maxAge > 0 && this._internalBlockNumber) {
                const result = yield internalBlockNumber;
                if ((getTime() - result.respTime) <= maxAge) {
                    return result.blockNumber;
                }
            }
            const reqTime = getTime();
            const checkInternalBlockNumber = Object(properties_lib_esm["f" /* resolveProperties */])({
                blockNumber: this.perform("getBlockNumber", {}),
                networkError: this.getNetwork().then((network) => (null), (error) => (error))
            }).then(({ blockNumber, networkError }) => {
                if (networkError) {
                    // Unremember this bad internal block number
                    if (this._internalBlockNumber === checkInternalBlockNumber) {
                        this._internalBlockNumber = null;
                    }
                    throw networkError;
                }
                const respTime = getTime();
                blockNumber = bignumber_lib_esm["a" /* BigNumber */].from(blockNumber).toNumber();
                if (blockNumber < this._maxInternalBlockNumber) {
                    blockNumber = this._maxInternalBlockNumber;
                }
                this._maxInternalBlockNumber = blockNumber;
                this._setFastBlockNumber(blockNumber); // @TODO: Still need this?
                return { blockNumber, reqTime, respTime };
            });
            this._internalBlockNumber = checkInternalBlockNumber;
            return (yield checkInternalBlockNumber).blockNumber;
        });
    }
    poll() {
        return __awaiter(this, void 0, void 0, function* () {
            const pollId = nextPollId++;
            // Track all running promises, so we can trigger a post-poll once they are complete
            const runners = [];
            const blockNumber = yield this._getInternalBlockNumber(100 + this.pollingInterval / 2);
            this._setFastBlockNumber(blockNumber);
            // Emit a poll event after we have the latest (fast) block number
            this.emit("poll", pollId, blockNumber);
            // If the block has not changed, meh.
            if (blockNumber === this._lastBlockNumber) {
                this.emit("didPoll", pollId);
                return;
            }
            // First polling cycle, trigger a "block" events
            if (this._emitted.block === -2) {
                this._emitted.block = blockNumber - 1;
            }
            if (Math.abs((this._emitted.block) - blockNumber) > 1000) {
                logger.warn("network block skew detected; skipping block events");
                this.emit("error", logger.makeError("network block skew detected", logger_lib_esm["Logger"].errors.NETWORK_ERROR, {
                    blockNumber: blockNumber,
                    event: "blockSkew",
                    previousBlockNumber: this._emitted.block
                }));
                this.emit("block", blockNumber);
            }
            else {
                // Notify all listener for each block that has passed
                for (let i = this._emitted.block + 1; i <= blockNumber; i++) {
                    this.emit("block", i);
                }
            }
            // The emitted block was updated, check for obsolete events
            if (this._emitted.block !== blockNumber) {
                this._emitted.block = blockNumber;
                Object.keys(this._emitted).forEach((key) => {
                    // The block event does not expire
                    if (key === "block") {
                        return;
                    }
                    // The block we were at when we emitted this event
                    const eventBlockNumber = this._emitted[key];
                    // We cannot garbage collect pending transactions or blocks here
                    // They should be garbage collected by the Provider when setting
                    // "pending" events
                    if (eventBlockNumber === "pending") {
                        return;
                    }
                    // Evict any transaction hashes or block hashes over 12 blocks
                    // old, since they should not return null anyways
                    if (blockNumber - eventBlockNumber > 12) {
                        delete this._emitted[key];
                    }
                });
            }
            // First polling cycle
            if (this._lastBlockNumber === -2) {
                this._lastBlockNumber = blockNumber - 1;
            }
            // Find all transaction hashes we are waiting on
            this._events.forEach((event) => {
                switch (event.type) {
                    case "tx": {
                        const hash = event.hash;
                        let runner = this.getTransactionReceipt(hash).then((receipt) => {
                            if (!receipt || receipt.blockNumber == null) {
                                return null;
                            }
                            this._emitted["t:" + hash] = receipt.blockNumber;
                            this.emit(hash, receipt);
                            return null;
                        }).catch((error) => { this.emit("error", error); });
                        runners.push(runner);
                        break;
                    }
                    case "filter": {
                        const filter = event.filter;
                        filter.fromBlock = this._lastBlockNumber + 1;
                        filter.toBlock = blockNumber;
                        const runner = this.getLogs(filter).then((logs) => {
                            if (logs.length === 0) {
                                return;
                            }
                            logs.forEach((log) => {
                                this._emitted["b:" + log.blockHash] = log.blockNumber;
                                this._emitted["t:" + log.transactionHash] = log.blockNumber;
                                this.emit(filter, log);
                            });
                        }).catch((error) => { this.emit("error", error); });
                        runners.push(runner);
                        break;
                    }
                }
            });
            this._lastBlockNumber = blockNumber;
            // Once all events for this loop have been processed, emit "didPoll"
            Promise.all(runners).then(() => {
                this.emit("didPoll", pollId);
            });
            return null;
        });
    }
    // Deprecated; do not use this
    resetEventsBlock(blockNumber) {
        this._lastBlockNumber = blockNumber - 1;
        if (this.polling) {
            this.poll();
        }
    }
    get network() {
        return this._network;
    }
    // This method should query the network if the underlying network
    // can change, such as when connected to a JSON-RPC backend
    detectNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            return logger.throwError("provider does not support network detection", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "provider.detectNetwork"
            });
        });
    }
    getNetwork() {
        return __awaiter(this, void 0, void 0, function* () {
            const network = yield this._ready();
            // Make sure we are still connected to the same network; this is
            // only an external call for backends which can have the underlying
            // network change spontaneously
            const currentNetwork = yield this.detectNetwork();
            if (network.chainId !== currentNetwork.chainId) {
                // We are allowing network changes, things can get complex fast;
                // make sure you know what you are doing if you use "any"
                if (this.anyNetwork) {
                    this._network = currentNetwork;
                    // Reset all internal block number guards and caches
                    this._lastBlockNumber = -2;
                    this._fastBlockNumber = null;
                    this._fastBlockNumberPromise = null;
                    this._fastQueryDate = 0;
                    this._emitted.block = -2;
                    this._maxInternalBlockNumber = -1024;
                    this._internalBlockNumber = null;
                    // The "network" event MUST happen before this method resolves
                    // so any events have a chance to unregister, so we stall an
                    // additional event loop before returning from /this/ call
                    this.emit("network", currentNetwork, network);
                    yield stall(0);
                    return this._network;
                }
                const error = logger.makeError("underlying network changed", logger_lib_esm["Logger"].errors.NETWORK_ERROR, {
                    event: "changed",
                    network: network,
                    detectedNetwork: currentNetwork
                });
                this.emit("error", error);
                throw error;
            }
            return network;
        });
    }
    get blockNumber() {
        this._getInternalBlockNumber(100 + this.pollingInterval / 2).then((blockNumber) => {
            this._setFastBlockNumber(blockNumber);
        });
        return (this._fastBlockNumber != null) ? this._fastBlockNumber : -1;
    }
    get polling() {
        return (this._poller != null);
    }
    set polling(value) {
        if (value && !this._poller) {
            this._poller = setInterval(this.poll.bind(this), this.pollingInterval);
            if (!this._bootstrapPoll) {
                this._bootstrapPoll = setTimeout(() => {
                    this.poll();
                    // We block additional polls until the polling interval
                    // is done, to prevent overwhelming the poll function
                    this._bootstrapPoll = setTimeout(() => {
                        // If polling was disabled, something may require a poke
                        // since starting the bootstrap poll and it was disabled
                        if (!this._poller) {
                            this.poll();
                        }
                        // Clear out the bootstrap so we can do another
                        this._bootstrapPoll = null;
                    }, this.pollingInterval);
                }, 0);
            }
        }
        else if (!value && this._poller) {
            clearInterval(this._poller);
            this._poller = null;
        }
    }
    get pollingInterval() {
        return this._pollingInterval;
    }
    set pollingInterval(value) {
        if (typeof (value) !== "number" || value <= 0 || parseInt(String(value)) != value) {
            throw new Error("invalid polling interval");
        }
        this._pollingInterval = value;
        if (this._poller) {
            clearInterval(this._poller);
            this._poller = setInterval(() => { this.poll(); }, this._pollingInterval);
        }
    }
    _getFastBlockNumber() {
        const now = getTime();
        // Stale block number, request a newer value
        if ((now - this._fastQueryDate) > 2 * this._pollingInterval) {
            this._fastQueryDate = now;
            this._fastBlockNumberPromise = this.getBlockNumber().then((blockNumber) => {
                if (this._fastBlockNumber == null || blockNumber > this._fastBlockNumber) {
                    this._fastBlockNumber = blockNumber;
                }
                return this._fastBlockNumber;
            });
        }
        return this._fastBlockNumberPromise;
    }
    _setFastBlockNumber(blockNumber) {
        // Older block, maybe a stale request
        if (this._fastBlockNumber != null && blockNumber < this._fastBlockNumber) {
            return;
        }
        // Update the time we updated the blocknumber
        this._fastQueryDate = getTime();
        // Newer block number, use  it
        if (this._fastBlockNumber == null || blockNumber > this._fastBlockNumber) {
            this._fastBlockNumber = blockNumber;
            this._fastBlockNumberPromise = Promise.resolve(blockNumber);
        }
    }
    waitForTransaction(transactionHash, confirmations, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            if (confirmations == null) {
                confirmations = 1;
            }
            const receipt = yield this.getTransactionReceipt(transactionHash);
            // Receipt is already good
            if ((receipt ? receipt.confirmations : 0) >= confirmations) {
                return receipt;
            }
            // Poll until the receipt is good...
            return new Promise((resolve, reject) => {
                let timer = null;
                let done = false;
                const handler = (receipt) => {
                    if (receipt.confirmations < confirmations) {
                        return;
                    }
                    if (timer) {
                        clearTimeout(timer);
                    }
                    if (done) {
                        return;
                    }
                    done = true;
                    this.removeListener(transactionHash, handler);
                    resolve(receipt);
                };
                this.on(transactionHash, handler);
                if (typeof (timeout) === "number" && timeout > 0) {
                    timer = setTimeout(() => {
                        if (done) {
                            return;
                        }
                        timer = null;
                        done = true;
                        this.removeListener(transactionHash, handler);
                        reject(logger.makeError("timeout exceeded", logger_lib_esm["Logger"].errors.TIMEOUT, { timeout: timeout }));
                    }, timeout);
                    if (timer.unref) {
                        timer.unref();
                    }
                }
            });
        });
    }
    getBlockNumber() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._getInternalBlockNumber(0);
        });
    }
    getGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            return bignumber_lib_esm["a" /* BigNumber */].from(yield this.perform("getGasPrice", {}));
        });
    }
    getBalance(addressOrName, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            const params = yield Object(properties_lib_esm["f" /* resolveProperties */])({
                address: this._getAddress(addressOrName),
                blockTag: this._getBlockTag(blockTag)
            });
            return bignumber_lib_esm["a" /* BigNumber */].from(yield this.perform("getBalance", params));
        });
    }
    getTransactionCount(addressOrName, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            const params = yield Object(properties_lib_esm["f" /* resolveProperties */])({
                address: this._getAddress(addressOrName),
                blockTag: this._getBlockTag(blockTag)
            });
            return bignumber_lib_esm["a" /* BigNumber */].from(yield this.perform("getTransactionCount", params)).toNumber();
        });
    }
    getCode(addressOrName, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            const params = yield Object(properties_lib_esm["f" /* resolveProperties */])({
                address: this._getAddress(addressOrName),
                blockTag: this._getBlockTag(blockTag)
            });
            return Object(bytes_lib_esm["hexlify"])(yield this.perform("getCode", params));
        });
    }
    getStorageAt(addressOrName, position, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            const params = yield Object(properties_lib_esm["f" /* resolveProperties */])({
                address: this._getAddress(addressOrName),
                blockTag: this._getBlockTag(blockTag),
                position: Promise.resolve(position).then((p) => Object(bytes_lib_esm["hexValue"])(p))
            });
            return Object(bytes_lib_esm["hexlify"])(yield this.perform("getStorageAt", params));
        });
    }
    // This should be called by any subclass wrapping a TransactionResponse
    _wrapTransaction(tx, hash) {
        if (hash != null && Object(bytes_lib_esm["hexDataLength"])(hash) !== 32) {
            throw new Error("invalid response - sendTransaction");
        }
        const result = tx;
        // Check the hash we expect is the same as the hash the server reported
        if (hash != null && tx.hash !== hash) {
            logger.throwError("Transaction hash mismatch from Provider.sendTransaction.", logger_lib_esm["Logger"].errors.UNKNOWN_ERROR, { expectedHash: tx.hash, returnedHash: hash });
        }
        // @TODO: (confirmations? number, timeout? number)
        result.wait = (confirmations) => __awaiter(this, void 0, void 0, function* () {
            // We know this transaction *must* exist (whether it gets mined is
            // another story), so setting an emitted value forces us to
            // wait even if the node returns null for the receipt
            if (confirmations !== 0) {
                this._emitted["t:" + tx.hash] = "pending";
            }
            const receipt = yield this.waitForTransaction(tx.hash, confirmations);
            if (receipt == null && confirmations === 0) {
                return null;
            }
            // No longer pending, allow the polling loop to garbage collect this
            this._emitted["t:" + tx.hash] = receipt.blockNumber;
            if (receipt.status === 0) {
                logger.throwError("transaction failed", logger_lib_esm["Logger"].errors.CALL_EXCEPTION, {
                    transactionHash: tx.hash,
                    transaction: tx,
                    receipt: receipt
                });
            }
            return receipt;
        });
        return result;
    }
    sendTransaction(signedTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            const hexTx = yield Promise.resolve(signedTransaction).then(t => Object(bytes_lib_esm["hexlify"])(t));
            const tx = this.formatter.transaction(signedTransaction);
            try {
                const hash = yield this.perform("sendTransaction", { signedTransaction: hexTx });
                return this._wrapTransaction(tx, hash);
            }
            catch (error) {
                error.transaction = tx;
                error.transactionHash = tx.hash;
                throw error;
            }
        });
    }
    _getTransactionRequest(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = yield transaction;
            const tx = {};
            ["from", "to"].forEach((key) => {
                if (values[key] == null) {
                    return;
                }
                tx[key] = Promise.resolve(values[key]).then((v) => (v ? this._getAddress(v) : null));
            });
            ["gasLimit", "gasPrice", "value"].forEach((key) => {
                if (values[key] == null) {
                    return;
                }
                tx[key] = Promise.resolve(values[key]).then((v) => (v ? bignumber_lib_esm["a" /* BigNumber */].from(v) : null));
            });
            ["data"].forEach((key) => {
                if (values[key] == null) {
                    return;
                }
                tx[key] = Promise.resolve(values[key]).then((v) => (v ? Object(bytes_lib_esm["hexlify"])(v) : null));
            });
            return this.formatter.transactionRequest(yield Object(properties_lib_esm["f" /* resolveProperties */])(tx));
        });
    }
    _getFilter(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            filter = yield filter;
            const result = {};
            if (filter.address != null) {
                result.address = this._getAddress(filter.address);
            }
            ["blockHash", "topics"].forEach((key) => {
                if (filter[key] == null) {
                    return;
                }
                result[key] = filter[key];
            });
            ["fromBlock", "toBlock"].forEach((key) => {
                if (filter[key] == null) {
                    return;
                }
                result[key] = this._getBlockTag(filter[key]);
            });
            return this.formatter.filter(yield Object(properties_lib_esm["f" /* resolveProperties */])(result));
        });
    }
    call(transaction, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            const params = yield Object(properties_lib_esm["f" /* resolveProperties */])({
                transaction: this._getTransactionRequest(transaction),
                blockTag: this._getBlockTag(blockTag)
            });
            return Object(bytes_lib_esm["hexlify"])(yield this.perform("call", params));
        });
    }
    estimateGas(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            const params = yield Object(properties_lib_esm["f" /* resolveProperties */])({
                transaction: this._getTransactionRequest(transaction)
            });
            return bignumber_lib_esm["a" /* BigNumber */].from(yield this.perform("estimateGas", params));
        });
    }
    _getAddress(addressOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            const address = yield this.resolveName(addressOrName);
            if (address == null) {
                logger.throwError("ENS name not configured", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                    operation: `resolveName(${JSON.stringify(addressOrName)})`
                });
            }
            return address;
        });
    }
    _getBlock(blockHashOrBlockTag, includeTransactions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            blockHashOrBlockTag = yield blockHashOrBlockTag;
            // If blockTag is a number (not "latest", etc), this is the block number
            let blockNumber = -128;
            const params = {
                includeTransactions: !!includeTransactions
            };
            if (Object(bytes_lib_esm["isHexString"])(blockHashOrBlockTag, 32)) {
                params.blockHash = blockHashOrBlockTag;
            }
            else {
                try {
                    params.blockTag = this.formatter.blockTag(yield this._getBlockTag(blockHashOrBlockTag));
                    if (Object(bytes_lib_esm["isHexString"])(params.blockTag)) {
                        blockNumber = parseInt(params.blockTag.substring(2), 16);
                    }
                }
                catch (error) {
                    logger.throwArgumentError("invalid block hash or block tag", "blockHashOrBlockTag", blockHashOrBlockTag);
                }
            }
            return Object(web_lib_esm["b" /* poll */])(() => __awaiter(this, void 0, void 0, function* () {
                const block = yield this.perform("getBlock", params);
                // Block was not found
                if (block == null) {
                    // For blockhashes, if we didn't say it existed, that blockhash may
                    // not exist. If we did see it though, perhaps from a log, we know
                    // it exists, and this node is just not caught up yet.
                    if (params.blockHash != null) {
                        if (this._emitted["b:" + params.blockHash] == null) {
                            return null;
                        }
                    }
                    // For block tags, if we are asking for a future block, we return null
                    if (params.blockTag != null) {
                        if (blockNumber > this._emitted.block) {
                            return null;
                        }
                    }
                    // Retry on the next block
                    return undefined;
                }
                // Add transactions
                if (includeTransactions) {
                    let blockNumber = null;
                    for (let i = 0; i < block.transactions.length; i++) {
                        const tx = block.transactions[i];
                        if (tx.blockNumber == null) {
                            tx.confirmations = 0;
                        }
                        else if (tx.confirmations == null) {
                            if (blockNumber == null) {
                                blockNumber = yield this._getInternalBlockNumber(100 + 2 * this.pollingInterval);
                            }
                            // Add the confirmations using the fast block number (pessimistic)
                            let confirmations = (blockNumber - tx.blockNumber) + 1;
                            if (confirmations <= 0) {
                                confirmations = 1;
                            }
                            tx.confirmations = confirmations;
                        }
                    }
                    return this.formatter.blockWithTransactions(block);
                }
                return this.formatter.block(block);
            }), { oncePoll: this });
        });
    }
    getBlock(blockHashOrBlockTag) {
        return (this._getBlock(blockHashOrBlockTag, false));
    }
    getBlockWithTransactions(blockHashOrBlockTag) {
        return (this._getBlock(blockHashOrBlockTag, true));
    }
    getTransaction(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            transactionHash = yield transactionHash;
            const params = { transactionHash: this.formatter.hash(transactionHash, true) };
            return Object(web_lib_esm["b" /* poll */])(() => __awaiter(this, void 0, void 0, function* () {
                const result = yield this.perform("getTransaction", params);
                if (result == null) {
                    if (this._emitted["t:" + transactionHash] == null) {
                        return null;
                    }
                    return undefined;
                }
                const tx = this.formatter.transactionResponse(result);
                if (tx.blockNumber == null) {
                    tx.confirmations = 0;
                }
                else if (tx.confirmations == null) {
                    const blockNumber = yield this._getInternalBlockNumber(100 + 2 * this.pollingInterval);
                    // Add the confirmations using the fast block number (pessimistic)
                    let confirmations = (blockNumber - tx.blockNumber) + 1;
                    if (confirmations <= 0) {
                        confirmations = 1;
                    }
                    tx.confirmations = confirmations;
                }
                return this._wrapTransaction(tx);
            }), { oncePoll: this });
        });
    }
    getTransactionReceipt(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            transactionHash = yield transactionHash;
            const params = { transactionHash: this.formatter.hash(transactionHash, true) };
            return Object(web_lib_esm["b" /* poll */])(() => __awaiter(this, void 0, void 0, function* () {
                const result = yield this.perform("getTransactionReceipt", params);
                if (result == null) {
                    if (this._emitted["t:" + transactionHash] == null) {
                        return null;
                    }
                    return undefined;
                }
                // "geth-etc" returns receipts before they are ready
                if (result.blockHash == null) {
                    return undefined;
                }
                const receipt = this.formatter.receipt(result);
                if (receipt.blockNumber == null) {
                    receipt.confirmations = 0;
                }
                else if (receipt.confirmations == null) {
                    const blockNumber = yield this._getInternalBlockNumber(100 + 2 * this.pollingInterval);
                    // Add the confirmations using the fast block number (pessimistic)
                    let confirmations = (blockNumber - receipt.blockNumber) + 1;
                    if (confirmations <= 0) {
                        confirmations = 1;
                    }
                    receipt.confirmations = confirmations;
                }
                return receipt;
            }), { oncePoll: this });
        });
    }
    getLogs(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            const params = yield Object(properties_lib_esm["f" /* resolveProperties */])({ filter: this._getFilter(filter) });
            const logs = yield this.perform("getLogs", params);
            logs.forEach((log) => {
                if (log.removed == null) {
                    log.removed = false;
                }
            });
            return formatter["a" /* Formatter */].arrayOf(this.formatter.filterLog.bind(this.formatter))(logs);
        });
    }
    getEtherPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getNetwork();
            return this.perform("getEtherPrice", {});
        });
    }
    _getBlockTag(blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            blockTag = yield blockTag;
            if (typeof (blockTag) === "number" && blockTag < 0) {
                if (blockTag % 1) {
                    logger.throwArgumentError("invalid BlockTag", "blockTag", blockTag);
                }
                let blockNumber = yield this._getInternalBlockNumber(100 + 2 * this.pollingInterval);
                blockNumber += blockTag;
                if (blockNumber < 0) {
                    blockNumber = 0;
                }
                return this.formatter.blockTag(blockNumber);
            }
            return this.formatter.blockTag(blockTag);
        });
    }
    getResolver(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const address = yield this._getResolver(name);
            if (address == null) {
                return null;
            }
            return new base_provider_Resolver(this, address, name);
        });
    }
    _getResolver(name) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get the resolver from the blockchain
            const network = yield this.getNetwork();
            // No ENS...
            if (!network.ensAddress) {
                logger.throwError("network does not support ENS", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, { operation: "ENS", network: network.name });
            }
            // keccak256("resolver(bytes32)")
            const transaction = {
                to: network.ensAddress,
                data: ("0x0178b8bf" + Object(hash_lib_esm["b" /* namehash */])(name).substring(2))
            };
            return this.formatter.callAddress(yield this.call(transaction));
        });
    }
    resolveName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            name = yield name;
            // If it is already an address, nothing to resolve
            try {
                return Promise.resolve(this.formatter.address(name));
            }
            catch (error) {
                // If is is a hexstring, the address is bad (See #694)
                if (Object(bytes_lib_esm["isHexString"])(name)) {
                    throw error;
                }
            }
            if (typeof (name) !== "string") {
                logger.throwArgumentError("invalid ENS name", "name", name);
            }
            // Get the addr from the resovler
            const resolver = yield this.getResolver(name);
            if (!resolver) {
                return null;
            }
            return yield resolver.getAddress();
        });
    }
    lookupAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            address = yield address;
            address = this.formatter.address(address);
            const reverseName = address.substring(2).toLowerCase() + ".addr.reverse";
            const resolverAddress = yield this._getResolver(reverseName);
            if (!resolverAddress) {
                return null;
            }
            // keccak("name(bytes32)")
            let bytes = Object(bytes_lib_esm["arrayify"])(yield this.call({
                to: resolverAddress,
                data: ("0x691f3431" + Object(hash_lib_esm["b" /* namehash */])(reverseName).substring(2))
            }));
            // Strip off the dynamic string pointer (0x20)
            if (bytes.length < 32 || !bignumber_lib_esm["a" /* BigNumber */].from(bytes.slice(0, 32)).eq(32)) {
                return null;
            }
            bytes = bytes.slice(32);
            // Not a length-prefixed string
            if (bytes.length < 32) {
                return null;
            }
            // Get the length of the string (from the length-prefix)
            const length = bignumber_lib_esm["a" /* BigNumber */].from(bytes.slice(0, 32)).toNumber();
            bytes = bytes.slice(32);
            // Length longer than available data
            if (length > bytes.length) {
                return null;
            }
            const name = Object(strings_lib_esm["c" /* toUtf8String */])(bytes.slice(0, length));
            // Make sure the reverse record matches the foward record
            const addr = yield this.resolveName(name);
            if (addr != address) {
                return null;
            }
            return name;
        });
    }
    perform(method, params) {
        return logger.throwError(method + " not implemented", logger_lib_esm["Logger"].errors.NOT_IMPLEMENTED, { operation: method });
    }
    _startEvent(event) {
        this.polling = (this._events.filter((e) => e.pollable()).length > 0);
    }
    _stopEvent(event) {
        this.polling = (this._events.filter((e) => e.pollable()).length > 0);
    }
    _addEventListener(eventName, listener, once) {
        const event = new base_provider_Event(getEventTag(eventName), listener, once);
        this._events.push(event);
        this._startEvent(event);
        return this;
    }
    on(eventName, listener) {
        return this._addEventListener(eventName, listener, false);
    }
    once(eventName, listener) {
        return this._addEventListener(eventName, listener, true);
    }
    emit(eventName, ...args) {
        let result = false;
        let stopped = [];
        let eventTag = getEventTag(eventName);
        this._events = this._events.filter((event) => {
            if (event.tag !== eventTag) {
                return true;
            }
            setTimeout(() => {
                event.listener.apply(this, args);
            }, 0);
            result = true;
            if (event.once) {
                stopped.push(event);
                return false;
            }
            return true;
        });
        stopped.forEach((event) => { this._stopEvent(event); });
        return result;
    }
    listenerCount(eventName) {
        if (!eventName) {
            return this._events.length;
        }
        let eventTag = getEventTag(eventName);
        return this._events.filter((event) => {
            return (event.tag === eventTag);
        }).length;
    }
    listeners(eventName) {
        if (eventName == null) {
            return this._events.map((event) => event.listener);
        }
        let eventTag = getEventTag(eventName);
        return this._events
            .filter((event) => (event.tag === eventTag))
            .map((event) => event.listener);
    }
    off(eventName, listener) {
        if (listener == null) {
            return this.removeAllListeners(eventName);
        }
        const stopped = [];
        let found = false;
        let eventTag = getEventTag(eventName);
        this._events = this._events.filter((event) => {
            if (event.tag !== eventTag || event.listener != listener) {
                return true;
            }
            if (found) {
                return true;
            }
            found = true;
            stopped.push(event);
            return false;
        });
        stopped.forEach((event) => { this._stopEvent(event); });
        return this;
    }
    removeAllListeners(eventName) {
        let stopped = [];
        if (eventName == null) {
            stopped = this._events;
            this._events = [];
        }
        else {
            const eventTag = getEventTag(eventName);
            this._events = this._events.filter((event) => {
                if (event.tag !== eventTag) {
                    return true;
                }
                stopped.push(event);
                return false;
            });
        }
        stopped.forEach((event) => { this._stopEvent(event); });
        return this;
    }
}
//# sourceMappingURL=base-provider.js.map

/***/ }),

/***/ 291:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ getNetwork; });

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/networks/lib.esm/_version.js
const version = "networks/5.0.4";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/networks/lib.esm/index.js



const logger = new lib_esm["Logger"](version);
;
function isRenetworkable(value) {
    return (value && typeof (value.renetwork) === "function");
}
function ethDefaultProvider(network) {
    const func = function (providers, options) {
        if (options == null) {
            options = {};
        }
        const providerList = [];
        if (providers.InfuraProvider) {
            try {
                providerList.push(new providers.InfuraProvider(network, options.infura));
            }
            catch (error) { }
        }
        if (providers.EtherscanProvider) {
            try {
                providerList.push(new providers.EtherscanProvider(network, options.etherscan));
            }
            catch (error) { }
        }
        if (providers.AlchemyProvider) {
            try {
                providerList.push(new providers.AlchemyProvider(network, options.alchemy));
            }
            catch (error) { }
        }
        if (providers.CloudflareProvider) {
            try {
                providerList.push(new providers.CloudflareProvider(network));
            }
            catch (error) { }
        }
        if (providerList.length === 0) {
            return null;
        }
        if (providers.FallbackProvider) {
            let quorum = 1;
            if (options.quorum != null) {
                quorum = options.quorum;
            }
            else if (network === "homestead") {
                quorum = 2;
            }
            return new providers.FallbackProvider(providerList, quorum);
        }
        return providerList[0];
    };
    func.renetwork = function (network) {
        return ethDefaultProvider(network);
    };
    return func;
}
function etcDefaultProvider(url, network) {
    const func = function (providers, options) {
        if (providers.JsonRpcProvider) {
            return new providers.JsonRpcProvider(url, network);
        }
        return null;
    };
    func.renetwork = function (network) {
        return etcDefaultProvider(url, network);
    };
    return func;
}
const homestead = {
    chainId: 1,
    ensAddress: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    name: "homestead",
    _defaultProvider: ethDefaultProvider("homestead")
};
const ropsten = {
    chainId: 3,
    ensAddress: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    name: "ropsten",
    _defaultProvider: ethDefaultProvider("ropsten")
};
const classicMordor = {
    chainId: 63,
    name: "classicMordor",
    _defaultProvider: etcDefaultProvider("https://www.ethercluster.com/mordor", "classicMordor")
};
const networks = {
    unspecified: {
        chainId: 0,
        name: "unspecified"
    },
    homestead: homestead,
    mainnet: homestead,
    morden: {
        chainId: 2,
        name: "morden"
    },
    ropsten: ropsten,
    testnet: ropsten,
    rinkeby: {
        chainId: 4,
        ensAddress: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        name: "rinkeby",
        _defaultProvider: ethDefaultProvider("rinkeby")
    },
    kovan: {
        chainId: 42,
        name: "kovan",
        _defaultProvider: ethDefaultProvider("kovan")
    },
    goerli: {
        chainId: 5,
        ensAddress: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
        name: "goerli",
        _defaultProvider: ethDefaultProvider("goerli")
    },
    // ETC (See: #351)
    classic: {
        chainId: 61,
        name: "classic",
        _defaultProvider: etcDefaultProvider("https://www.ethercluster.com/etc", "classic")
    },
    classicMorden: {
        chainId: 62,
        name: "classicMorden",
    },
    classicMordor: classicMordor,
    classicTestnet: classicMordor,
    classicKotti: {
        chainId: 6,
        name: "classicKotti",
        _defaultProvider: etcDefaultProvider("https://www.ethercluster.com/kotti", "classicKotti")
    },
};
/**
 *  getNetwork
 *
 *  Converts a named common networks or chain ID (network ID) to a Network
 *  and verifies a network is a valid Network..
 */
function getNetwork(network) {
    // No network (null)
    if (network == null) {
        return null;
    }
    if (typeof (network) === "number") {
        for (const name in networks) {
            const standard = networks[name];
            if (standard.chainId === network) {
                return {
                    name: standard.name,
                    chainId: standard.chainId,
                    ensAddress: (standard.ensAddress || null),
                    _defaultProvider: (standard._defaultProvider || null)
                };
            }
        }
        return {
            chainId: network,
            name: "unknown"
        };
    }
    if (typeof (network) === "string") {
        const standard = networks[network];
        if (standard == null) {
            return null;
        }
        return {
            name: standard.name,
            chainId: standard.chainId,
            ensAddress: standard.ensAddress,
            _defaultProvider: (standard._defaultProvider || null)
        };
    }
    const standard = networks[network.name];
    // Not a standard network; check that it is a valid network in general
    if (!standard) {
        if (typeof (network.chainId) !== "number") {
            logger.throwArgumentError("invalid network chainId", "network", network);
        }
        return network;
    }
    // Make sure the chainId matches the expected network chainId (or is 0; disable EIP-155)
    if (network.chainId !== 0 && network.chainId !== standard.chainId) {
        logger.throwArgumentError("network chainId mismatch", "network", network);
    }
    // @TODO: In the next major version add an attach function to a defaultProvider
    // class and move the _defaultProvider internal to this file (extend Network)
    let defaultProvider = network._defaultProvider || null;
    if (defaultProvider == null && standard._defaultProvider) {
        if (isRenetworkable(standard._defaultProvider)) {
            defaultProvider = standard._defaultProvider.renetwork(network);
        }
        else {
            defaultProvider = standard._defaultProvider;
        }
    }
    // Standard Network (allow overriding the ENS address)
    return {
        name: network.name,
        chainId: standard.chainId,
        ensAddress: (network.ensAddress || standard.ensAddress || null),
        _defaultProvider: defaultProvider
    };
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 328:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "b", function() { return /* binding */ encode; });
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ decode; });

// EXTERNAL MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(6);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/rlp/lib.esm/_version.js
const version = "rlp/5.0.3";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/rlp/lib.esm/index.js

//See: https://github.com/ethereum/wiki/wiki/RLP



const logger = new logger_lib_esm["Logger"](version);
function arrayifyInteger(value) {
    const result = [];
    while (value) {
        result.unshift(value & 0xff);
        value >>= 8;
    }
    return result;
}
function unarrayifyInteger(data, offset, length) {
    let result = 0;
    for (let i = 0; i < length; i++) {
        result = (result * 256) + data[offset + i];
    }
    return result;
}
function _encode(object) {
    if (Array.isArray(object)) {
        let payload = [];
        object.forEach(function (child) {
            payload = payload.concat(_encode(child));
        });
        if (payload.length <= 55) {
            payload.unshift(0xc0 + payload.length);
            return payload;
        }
        const length = arrayifyInteger(payload.length);
        length.unshift(0xf7 + length.length);
        return length.concat(payload);
    }
    if (!Object(lib_esm["isBytesLike"])(object)) {
        logger.throwArgumentError("RLP object must be BytesLike", "object", object);
    }
    const data = Array.prototype.slice.call(Object(lib_esm["arrayify"])(object));
    if (data.length === 1 && data[0] <= 0x7f) {
        return data;
    }
    else if (data.length <= 55) {
        data.unshift(0x80 + data.length);
        return data;
    }
    const length = arrayifyInteger(data.length);
    length.unshift(0xb7 + length.length);
    return length.concat(data);
}
function encode(object) {
    return Object(lib_esm["hexlify"])(_encode(object));
}
function _decodeChildren(data, offset, childOffset, length) {
    const result = [];
    while (childOffset < offset + 1 + length) {
        const decoded = _decode(data, childOffset);
        result.push(decoded.result);
        childOffset += decoded.consumed;
        if (childOffset > offset + 1 + length) {
            logger.throwError("child data too short", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {});
        }
    }
    return { consumed: (1 + length), result: result };
}
// returns { consumed: number, result: Object }
function _decode(data, offset) {
    if (data.length === 0) {
        logger.throwError("data too short", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {});
    }
    // Array with extra length prefix
    if (data[offset] >= 0xf8) {
        const lengthLength = data[offset] - 0xf7;
        if (offset + 1 + lengthLength > data.length) {
            logger.throwError("data short segment too short", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {});
        }
        const length = unarrayifyInteger(data, offset + 1, lengthLength);
        if (offset + 1 + lengthLength + length > data.length) {
            logger.throwError("data long segment too short", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {});
        }
        return _decodeChildren(data, offset, offset + 1 + lengthLength, lengthLength + length);
    }
    else if (data[offset] >= 0xc0) {
        const length = data[offset] - 0xc0;
        if (offset + 1 + length > data.length) {
            logger.throwError("data array too short", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {});
        }
        return _decodeChildren(data, offset, offset + 1, length);
    }
    else if (data[offset] >= 0xb8) {
        const lengthLength = data[offset] - 0xb7;
        if (offset + 1 + lengthLength > data.length) {
            logger.throwError("data array too short", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {});
        }
        const length = unarrayifyInteger(data, offset + 1, lengthLength);
        if (offset + 1 + lengthLength + length > data.length) {
            logger.throwError("data array too short", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {});
        }
        const result = Object(lib_esm["hexlify"])(data.slice(offset + 1 + lengthLength, offset + 1 + lengthLength + length));
        return { consumed: (1 + lengthLength + length), result: result };
    }
    else if (data[offset] >= 0x80) {
        const length = data[offset] - 0x80;
        if (offset + 1 + length > data.length) {
            logger.throwError("data too short", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {});
        }
        const result = Object(lib_esm["hexlify"])(data.slice(offset + 1, offset + 1 + length));
        return { consumed: (1 + length), result: result };
    }
    return { consumed: 1, result: Object(lib_esm["hexlify"])(data[offset]) };
}
function decode(data) {
    const bytes = Object(lib_esm["arrayify"])(data);
    const decoded = _decode(bytes, 0);
    if (decoded.consumed !== bytes.length) {
        logger.throwArgumentError("invalid rlp data", "data", data);
    }
    return decoded.result;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 388:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ lib_esm_Signer; });
__webpack_require__.d(__webpack_exports__, "b", function() { return /* binding */ lib_esm_VoidSigner; });

// EXTERNAL MODULE: ./node_modules/@ethersproject/properties/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(7);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/abstract-signer/lib.esm/_version.js
const version = "abstract-signer/5.0.5";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/abstract-signer/lib.esm/index.js

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



const logger = new logger_lib_esm["Logger"](version);
const allowedTransactionKeys = [
    "chainId", "data", "from", "gasLimit", "gasPrice", "nonce", "to", "value"
];
const forwardErrors = [
    logger_lib_esm["Logger"].errors.INSUFFICIENT_FUNDS,
    logger_lib_esm["Logger"].errors.NONCE_EXPIRED,
    logger_lib_esm["Logger"].errors.REPLACEMENT_UNDERPRICED,
];
// Sub-Class Notes:
//  - A Signer MUST always make sure, that if present, the "from" field
//    matches the Signer, before sending or signing a transaction
//  - A Signer SHOULD always wrap private information (such as a private
//    key or mnemonic) in a function, so that console.log does not leak
//    the data
class lib_esm_Signer {
    ///////////////////
    // Sub-classes MUST call super
    constructor() {
        logger.checkAbstract(new.target, lib_esm_Signer);
        Object(lib_esm["d" /* defineReadOnly */])(this, "_isSigner", true);
    }
    ///////////////////
    // Sub-classes MAY override these
    getBalance(blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getBalance");
            return yield this.provider.getBalance(this.getAddress(), blockTag);
        });
    }
    getTransactionCount(blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getTransactionCount");
            return yield this.provider.getTransactionCount(this.getAddress(), blockTag);
        });
    }
    // Populates "from" if unspecified, and estimates the gas for the transation
    estimateGas(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("estimateGas");
            const tx = yield Object(lib_esm["f" /* resolveProperties */])(this.checkTransaction(transaction));
            return yield this.provider.estimateGas(tx);
        });
    }
    // Populates "from" if unspecified, and calls with the transation
    call(transaction, blockTag) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("call");
            const tx = yield Object(lib_esm["f" /* resolveProperties */])(this.checkTransaction(transaction));
            return yield this.provider.call(tx, blockTag);
        });
    }
    // Populates all fields in a transaction, signs it and sends it to the network
    sendTransaction(transaction) {
        this._checkProvider("sendTransaction");
        return this.populateTransaction(transaction).then((tx) => {
            return this.signTransaction(tx).then((signedTx) => {
                return this.provider.sendTransaction(signedTx);
            });
        });
    }
    getChainId() {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getChainId");
            const network = yield this.provider.getNetwork();
            return network.chainId;
        });
    }
    getGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("getGasPrice");
            return yield this.provider.getGasPrice();
        });
    }
    resolveName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            this._checkProvider("resolveName");
            return yield this.provider.resolveName(name);
        });
    }
    // Checks a transaction does not contain invalid keys and if
    // no "from" is provided, populates it.
    // - does NOT require a provider
    // - adds "from" is not present
    // - returns a COPY (safe to mutate the result)
    // By default called from: (overriding these prevents it)
    //   - call
    //   - estimateGas
    //   - populateTransaction (and therefor sendTransaction)
    checkTransaction(transaction) {
        for (const key in transaction) {
            if (allowedTransactionKeys.indexOf(key) === -1) {
                logger.throwArgumentError("invalid transaction key: " + key, "transaction", transaction);
            }
        }
        const tx = Object(lib_esm["g" /* shallowCopy */])(transaction);
        if (tx.from == null) {
            tx.from = this.getAddress();
        }
        else {
            // Make sure any provided address matches this signer
            tx.from = Promise.all([
                Promise.resolve(tx.from),
                this.getAddress()
            ]).then((result) => {
                if (result[0] !== result[1]) {
                    logger.throwArgumentError("from address mismatch", "transaction", transaction);
                }
                return result[0];
            });
        }
        return tx;
    }
    // Populates ALL keys for a transaction and checks that "from" matches
    // this Signer. Should be used by sendTransaction but NOT by signTransaction.
    // By default called from: (overriding these prevents it)
    //   - sendTransaction
    populateTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield Object(lib_esm["f" /* resolveProperties */])(this.checkTransaction(transaction));
            if (tx.to != null) {
                tx.to = Promise.resolve(tx.to).then((to) => this.resolveName(to));
            }
            if (tx.gasPrice == null) {
                tx.gasPrice = this.getGasPrice();
            }
            if (tx.nonce == null) {
                tx.nonce = this.getTransactionCount("pending");
            }
            if (tx.gasLimit == null) {
                tx.gasLimit = this.estimateGas(tx).catch((error) => {
                    if (forwardErrors.indexOf(error.code) >= 0) {
                        throw error;
                    }
                    return logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", logger_lib_esm["Logger"].errors.UNPREDICTABLE_GAS_LIMIT, {
                        error: error,
                        tx: tx
                    });
                });
            }
            if (tx.chainId == null) {
                tx.chainId = this.getChainId();
            }
            else {
                tx.chainId = Promise.all([
                    Promise.resolve(tx.chainId),
                    this.getChainId()
                ]).then((results) => {
                    if (results[1] !== 0 && results[0] !== results[1]) {
                        logger.throwArgumentError("chainId address mismatch", "transaction", transaction);
                    }
                    return results[0];
                });
            }
            return yield Object(lib_esm["f" /* resolveProperties */])(tx);
        });
    }
    ///////////////////
    // Sub-classes SHOULD leave these alone
    _checkProvider(operation) {
        if (!this.provider) {
            logger.throwError("missing provider", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: (operation || "_checkProvider")
            });
        }
    }
    static isSigner(value) {
        return !!(value && value._isSigner);
    }
}
class lib_esm_VoidSigner extends lib_esm_Signer {
    constructor(address, provider) {
        logger.checkNew(new.target, lib_esm_VoidSigner);
        super();
        Object(lib_esm["d" /* defineReadOnly */])(this, "address", address);
        Object(lib_esm["d" /* defineReadOnly */])(this, "provider", provider || null);
    }
    getAddress() {
        return Promise.resolve(this.address);
    }
    _fail(message, operation) {
        return Promise.resolve().then(() => {
            logger.throwError(message, logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, { operation: operation });
        });
    }
    signMessage(message) {
        return this._fail("VoidSigner cannot sign messages", "signMessage");
    }
    signTransaction(transaction) {
        return this._fail("VoidSigner cannot sign transactions", "signTransaction");
    }
    connect(provider) {
        return new lib_esm_VoidSigner(this.address, provider);
    }
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 410:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(233);
var assert = __webpack_require__(159);

function BlockHash() {
  this.pending = null;
  this.pendingTotal = 0;
  this.blockSize = this.constructor.blockSize;
  this.outSize = this.constructor.outSize;
  this.hmacStrength = this.constructor.hmacStrength;
  this.padLength = this.constructor.padLength / 8;
  this.endian = 'big';

  this._delta8 = this.blockSize / 8;
  this._delta32 = this.blockSize / 32;
}
exports.BlockHash = BlockHash;

BlockHash.prototype.update = function update(msg, enc) {
  // Convert message to array, pad it, and join into 32bit blocks
  msg = utils.toArray(msg, enc);
  if (!this.pending)
    this.pending = msg;
  else
    this.pending = this.pending.concat(msg);
  this.pendingTotal += msg.length;

  // Enough data, try updating
  if (this.pending.length >= this._delta8) {
    msg = this.pending;

    // Process pending data in blocks
    var r = msg.length % this._delta8;
    this.pending = msg.slice(msg.length - r, msg.length);
    if (this.pending.length === 0)
      this.pending = null;

    msg = utils.join32(msg, 0, msg.length - r, this.endian);
    for (var i = 0; i < msg.length; i += this._delta32)
      this._update(msg, i, i + this._delta32);
  }

  return this;
};

BlockHash.prototype.digest = function digest(enc) {
  this.update(this._pad());
  assert(this.pending === null);

  return this._digest(enc);
};

BlockHash.prototype._pad = function pad() {
  var len = this.pendingTotal;
  var bytes = this._delta8;
  var k = bytes - ((len + this.padLength) % bytes);
  var res = new Array(k + this.padLength);
  res[0] = 0x80;
  for (var i = 1; i < k; i++)
    res[i] = 0;

  // Append length
  len <<= 3;
  if (this.endian === 'big') {
    for (var t = 8; t < this.padLength; t++)
      res[i++] = 0;

    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = (len >>> 24) & 0xff;
    res[i++] = (len >>> 16) & 0xff;
    res[i++] = (len >>> 8) & 0xff;
    res[i++] = len & 0xff;
  } else {
    res[i++] = len & 0xff;
    res[i++] = (len >>> 8) & 0xff;
    res[i++] = (len >>> 16) & 0xff;
    res[i++] = (len >>> 24) & 0xff;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;

    for (t = 8; t < this.padLength; t++)
      res[i++] = 0;
  }

  return res;
};


/***/ }),

/***/ 427:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var hash = __importStar(__webpack_require__(1456));
var bytes_1 = __webpack_require__(6);
var logger_1 = __webpack_require__(11);
var _version_1 = __webpack_require__(1463);
var logger = new logger_1.Logger(_version_1.version);
var SupportedAlgorithm;
(function (SupportedAlgorithm) {
    SupportedAlgorithm["sha256"] = "sha256";
    SupportedAlgorithm["sha512"] = "sha512";
})(SupportedAlgorithm = exports.SupportedAlgorithm || (exports.SupportedAlgorithm = {}));
;
function ripemd160(data) {
    return "0x" + (hash.ripemd160().update(bytes_1.arrayify(data)).digest("hex"));
}
exports.ripemd160 = ripemd160;
function sha256(data) {
    return "0x" + (hash.sha256().update(bytes_1.arrayify(data)).digest("hex"));
}
exports.sha256 = sha256;
function sha512(data) {
    return "0x" + (hash.sha512().update(bytes_1.arrayify(data)).digest("hex"));
}
exports.sha512 = sha512;
function computeHmac(algorithm, key, data) {
    if (!SupportedAlgorithm[algorithm]) {
        logger.throwError("unsupported algorithm " + algorithm, logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
            operation: "hmac",
            algorithm: algorithm
        });
    }
    return "0x" + hash.hmac(hash[algorithm], bytes_1.arrayify(key)).update(bytes_1.arrayify(data)).digest("hex");
}
exports.computeHmac = computeHmac;
//# sourceMappingURL=browser.js.map

/***/ }),

/***/ 43:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* reexport */ bignumber_BigNumber; });

// UNUSED EXPORTS: formatFixed, FixedFormat, FixedNumber, parseFixed

// EXTERNAL MODULE: ./node_modules/bn.js/lib/bn.js
var bn = __webpack_require__(52);

// EXTERNAL MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(6);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/bignumber/lib.esm/_version.js
const version = "bignumber/5.0.7";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/bignumber/lib.esm/bignumber.js

/**
 *  BigNumber
 *
 *  A wrapper around the BN.js object. We use the BN.js library
 *  because it is used by elliptic, so it is required regardles.
 *
 */




const logger = new logger_lib_esm["Logger"](version);
const _constructorGuard = {};
const MAX_SAFE = 0x1fffffffffffff;
function isBigNumberish(value) {
    return (value != null) && (bignumber_BigNumber.isBigNumber(value) ||
        (typeof (value) === "number" && (value % 1) === 0) ||
        (typeof (value) === "string" && !!value.match(/^-?[0-9]+$/)) ||
        Object(lib_esm["isHexString"])(value) ||
        (typeof (value) === "bigint") ||
        Object(lib_esm["isBytes"])(value));
}
class bignumber_BigNumber {
    constructor(constructorGuard, hex) {
        logger.checkNew(new.target, bignumber_BigNumber);
        if (constructorGuard !== _constructorGuard) {
            logger.throwError("cannot call constructor directly; use BigNumber.from", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "new (BigNumber)"
            });
        }
        this._hex = hex;
        this._isBigNumber = true;
        Object.freeze(this);
    }
    fromTwos(value) {
        return toBigNumber(toBN(this).fromTwos(value));
    }
    toTwos(value) {
        return toBigNumber(toBN(this).toTwos(value));
    }
    abs() {
        if (this._hex[0] === "-") {
            return bignumber_BigNumber.from(this._hex.substring(1));
        }
        return this;
    }
    add(other) {
        return toBigNumber(toBN(this).add(toBN(other)));
    }
    sub(other) {
        return toBigNumber(toBN(this).sub(toBN(other)));
    }
    div(other) {
        const o = bignumber_BigNumber.from(other);
        if (o.isZero()) {
            throwFault("division by zero", "div");
        }
        return toBigNumber(toBN(this).div(toBN(other)));
    }
    mul(other) {
        return toBigNumber(toBN(this).mul(toBN(other)));
    }
    mod(other) {
        const value = toBN(other);
        if (value.isNeg()) {
            throwFault("cannot modulo negative values", "mod");
        }
        return toBigNumber(toBN(this).umod(value));
    }
    pow(other) {
        const value = toBN(other);
        if (value.isNeg()) {
            throwFault("cannot raise to negative values", "pow");
        }
        return toBigNumber(toBN(this).pow(value));
    }
    and(other) {
        const value = toBN(other);
        if (this.isNegative() || value.isNeg()) {
            throwFault("cannot 'and' negative values", "and");
        }
        return toBigNumber(toBN(this).and(value));
    }
    or(other) {
        const value = toBN(other);
        if (this.isNegative() || value.isNeg()) {
            throwFault("cannot 'or' negative values", "or");
        }
        return toBigNumber(toBN(this).or(value));
    }
    xor(other) {
        const value = toBN(other);
        if (this.isNegative() || value.isNeg()) {
            throwFault("cannot 'xor' negative values", "xor");
        }
        return toBigNumber(toBN(this).xor(value));
    }
    mask(value) {
        if (this.isNegative() || value < 0) {
            throwFault("cannot mask negative values", "mask");
        }
        return toBigNumber(toBN(this).maskn(value));
    }
    shl(value) {
        if (this.isNegative() || value < 0) {
            throwFault("cannot shift negative values", "shl");
        }
        return toBigNumber(toBN(this).shln(value));
    }
    shr(value) {
        if (this.isNegative() || value < 0) {
            throwFault("cannot shift negative values", "shr");
        }
        return toBigNumber(toBN(this).shrn(value));
    }
    eq(other) {
        return toBN(this).eq(toBN(other));
    }
    lt(other) {
        return toBN(this).lt(toBN(other));
    }
    lte(other) {
        return toBN(this).lte(toBN(other));
    }
    gt(other) {
        return toBN(this).gt(toBN(other));
    }
    gte(other) {
        return toBN(this).gte(toBN(other));
    }
    isNegative() {
        return (this._hex[0] === "-");
    }
    isZero() {
        return toBN(this).isZero();
    }
    toNumber() {
        try {
            return toBN(this).toNumber();
        }
        catch (error) {
            throwFault("overflow", "toNumber", this.toString());
        }
        return null;
    }
    toString() {
        // Lots of people expect this, which we do not support, so check
        if (arguments.length !== 0) {
            logger.throwError("bigNumber.toString does not accept parameters", logger_lib_esm["Logger"].errors.UNEXPECTED_ARGUMENT, {});
        }
        return toBN(this).toString(10);
    }
    toHexString() {
        return this._hex;
    }
    toJSON(key) {
        return { type: "BigNumber", hex: this.toHexString() };
    }
    static from(value) {
        if (value instanceof bignumber_BigNumber) {
            return value;
        }
        if (typeof (value) === "string") {
            if (value.match(/^-?0x[0-9a-f]+$/i)) {
                return new bignumber_BigNumber(_constructorGuard, toHex(value));
            }
            if (value.match(/^-?[0-9]+$/)) {
                return new bignumber_BigNumber(_constructorGuard, toHex(new bn["BN"](value)));
            }
            return logger.throwArgumentError("invalid BigNumber string", "value", value);
        }
        if (typeof (value) === "number") {
            if (value % 1) {
                throwFault("underflow", "BigNumber.from", value);
            }
            if (value >= MAX_SAFE || value <= -MAX_SAFE) {
                throwFault("overflow", "BigNumber.from", value);
            }
            return bignumber_BigNumber.from(String(value));
        }
        const anyValue = value;
        if (typeof (anyValue) === "bigint") {
            return bignumber_BigNumber.from(anyValue.toString());
        }
        if (Object(lib_esm["isBytes"])(anyValue)) {
            return bignumber_BigNumber.from(Object(lib_esm["hexlify"])(anyValue));
        }
        if (anyValue) {
            // Hexable interface (takes piority)
            if (anyValue.toHexString) {
                const hex = anyValue.toHexString();
                if (typeof (hex) === "string") {
                    return bignumber_BigNumber.from(hex);
                }
            }
            else {
                // For now, handle legacy JSON-ified values (goes away in v6)
                let hex = anyValue._hex;
                // New-form JSON
                if (hex == null && anyValue.type === "BigNumber") {
                    hex = anyValue.hex;
                }
                if (typeof (hex) === "string") {
                    if (Object(lib_esm["isHexString"])(hex) || (hex[0] === "-" && Object(lib_esm["isHexString"])(hex.substring(1)))) {
                        return bignumber_BigNumber.from(hex);
                    }
                }
            }
        }
        return logger.throwArgumentError("invalid BigNumber value", "value", value);
    }
    static isBigNumber(value) {
        return !!(value && value._isBigNumber);
    }
}
// Normalize the hex string
function toHex(value) {
    // For BN, call on the hex string
    if (typeof (value) !== "string") {
        return toHex(value.toString(16));
    }
    // If negative, prepend the negative sign to the normalized positive value
    if (value[0] === "-") {
        // Strip off the negative sign
        value = value.substring(1);
        // Cannot have mulitple negative signs (e.g. "--0x04")
        if (value[0] === "-") {
            logger.throwArgumentError("invalid hex", "value", value);
        }
        // Call toHex on the positive component
        value = toHex(value);
        // Do not allow "-0x00"
        if (value === "0x00") {
            return value;
        }
        // Negate the value
        return "-" + value;
    }
    // Add a "0x" prefix if missing
    if (value.substring(0, 2) !== "0x") {
        value = "0x" + value;
    }
    // Normalize zero
    if (value === "0x") {
        return "0x00";
    }
    // Make the string even length
    if (value.length % 2) {
        value = "0x0" + value.substring(2);
    }
    // Trim to smallest even-length string
    while (value.length > 4 && value.substring(0, 4) === "0x00") {
        value = "0x" + value.substring(4);
    }
    return value;
}
function toBigNumber(value) {
    return bignumber_BigNumber.from(toHex(value));
}
function toBN(value) {
    const hex = bignumber_BigNumber.from(value).toHexString();
    if (hex[0] === "-") {
        return (new bn["BN"]("-" + hex.substring(3), 16));
    }
    return new bn["BN"](hex.substring(2), 16);
}
function throwFault(fault, operation, value) {
    const params = { fault: fault, operation: operation };
    if (value != null) {
        params.value = value;
    }
    return logger.throwError(fault, logger_lib_esm["Logger"].errors.NUMERIC_FAULT, params);
}
//# sourceMappingURL=bignumber.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/bignumber/lib.esm/fixednumber.js




const fixednumber_logger = new logger_lib_esm["Logger"](version);

const fixednumber_constructorGuard = {};
const Zero = bignumber_BigNumber.from(0);
const NegativeOne = bignumber_BigNumber.from(-1);
function fixednumber_throwFault(message, fault, operation, value) {
    const params = { fault: fault, operation: operation };
    if (value !== undefined) {
        params.value = value;
    }
    return fixednumber_logger.throwError(message, logger_lib_esm["Logger"].errors.NUMERIC_FAULT, params);
}
// Constant to pull zeros from for multipliers
let zeros = "0";
while (zeros.length < 256) {
    zeros += zeros;
}
// Returns a string "1" followed by decimal "0"s
function getMultiplier(decimals) {
    if (typeof (decimals) !== "number") {
        try {
            decimals = bignumber_BigNumber.from(decimals).toNumber();
        }
        catch (e) { }
    }
    if (typeof (decimals) === "number" && decimals >= 0 && decimals <= 256 && !(decimals % 1)) {
        return ("1" + zeros.substring(0, decimals));
    }
    return fixednumber_logger.throwArgumentError("invalid decimal size", "decimals", decimals);
}
function formatFixed(value, decimals) {
    if (decimals == null) {
        decimals = 0;
    }
    const multiplier = getMultiplier(decimals);
    // Make sure wei is a big number (convert as necessary)
    value = bignumber_BigNumber.from(value);
    const negative = value.lt(Zero);
    if (negative) {
        value = value.mul(NegativeOne);
    }
    let fraction = value.mod(multiplier).toString();
    while (fraction.length < multiplier.length - 1) {
        fraction = "0" + fraction;
    }
    // Strip training 0
    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];
    const whole = value.div(multiplier).toString();
    value = whole + "." + fraction;
    if (negative) {
        value = "-" + value;
    }
    return value;
}
function parseFixed(value, decimals) {
    if (decimals == null) {
        decimals = 0;
    }
    const multiplier = getMultiplier(decimals);
    if (typeof (value) !== "string" || !value.match(/^-?[0-9.,]+$/)) {
        fixednumber_logger.throwArgumentError("invalid decimal value", "value", value);
    }
    if (multiplier.length - 1 === 0) {
        return bignumber_BigNumber.from(value);
    }
    // Is it negative?
    const negative = (value.substring(0, 1) === "-");
    if (negative) {
        value = value.substring(1);
    }
    if (value === ".") {
        fixednumber_logger.throwArgumentError("missing value", "value", value);
    }
    // Split it into a whole and fractional part
    const comps = value.split(".");
    if (comps.length > 2) {
        fixednumber_logger.throwArgumentError("too many decimal points", "value", value);
    }
    let whole = comps[0], fraction = comps[1];
    if (!whole) {
        whole = "0";
    }
    if (!fraction) {
        fraction = "0";
    }
    // Prevent underflow
    if (fraction.length > multiplier.length - 1) {
        fixednumber_throwFault("fractional component exceeds decimals", "underflow", "parseFixed");
    }
    // Fully pad the string with zeros to get to wei
    while (fraction.length < multiplier.length - 1) {
        fraction += "0";
    }
    const wholeValue = bignumber_BigNumber.from(whole);
    const fractionValue = bignumber_BigNumber.from(fraction);
    let wei = (wholeValue.mul(multiplier)).add(fractionValue);
    if (negative) {
        wei = wei.mul(NegativeOne);
    }
    return wei;
}
class fixednumber_FixedFormat {
    constructor(constructorGuard, signed, width, decimals) {
        if (constructorGuard !== fixednumber_constructorGuard) {
            fixednumber_logger.throwError("cannot use FixedFormat constructor; use FixedFormat.from", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "new FixedFormat"
            });
        }
        this.signed = signed;
        this.width = width;
        this.decimals = decimals;
        this.name = (signed ? "" : "u") + "fixed" + String(width) + "x" + String(decimals);
        this._multiplier = getMultiplier(decimals);
        Object.freeze(this);
    }
    static from(value) {
        if (value instanceof fixednumber_FixedFormat) {
            return value;
        }
        let signed = true;
        let width = 128;
        let decimals = 18;
        if (typeof (value) === "string") {
            if (value === "fixed") {
                // defaults...
            }
            else if (value === "ufixed") {
                signed = false;
            }
            else if (value != null) {
                const match = value.match(/^(u?)fixed([0-9]+)x([0-9]+)$/);
                if (!match) {
                    fixednumber_logger.throwArgumentError("invalid fixed format", "format", value);
                }
                signed = (match[1] !== "u");
                width = parseInt(match[2]);
                decimals = parseInt(match[3]);
            }
        }
        else if (value) {
            const check = (key, type, defaultValue) => {
                if (value[key] == null) {
                    return defaultValue;
                }
                if (typeof (value[key]) !== type) {
                    fixednumber_logger.throwArgumentError("invalid fixed format (" + key + " not " + type + ")", "format." + key, value[key]);
                }
                return value[key];
            };
            signed = check("signed", "boolean", signed);
            width = check("width", "number", width);
            decimals = check("decimals", "number", decimals);
        }
        if (width % 8) {
            fixednumber_logger.throwArgumentError("invalid fixed format width (not byte aligned)", "format.width", width);
        }
        if (decimals > 80) {
            fixednumber_logger.throwArgumentError("invalid fixed format (decimals too large)", "format.decimals", decimals);
        }
        return new fixednumber_FixedFormat(fixednumber_constructorGuard, signed, width, decimals);
    }
}
class fixednumber_FixedNumber {
    constructor(constructorGuard, hex, value, format) {
        fixednumber_logger.checkNew(new.target, fixednumber_FixedNumber);
        if (constructorGuard !== fixednumber_constructorGuard) {
            fixednumber_logger.throwError("cannot use FixedNumber constructor; use FixedNumber.from", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "new FixedFormat"
            });
        }
        this.format = format;
        this._hex = hex;
        this._value = value;
        this._isFixedNumber = true;
        Object.freeze(this);
    }
    _checkFormat(other) {
        if (this.format.name !== other.format.name) {
            fixednumber_logger.throwArgumentError("incompatible format; use fixedNumber.toFormat", "other", other);
        }
    }
    addUnsafe(other) {
        this._checkFormat(other);
        const a = parseFixed(this._value, this.format.decimals);
        const b = parseFixed(other._value, other.format.decimals);
        return fixednumber_FixedNumber.fromValue(a.add(b), this.format.decimals, this.format);
    }
    subUnsafe(other) {
        this._checkFormat(other);
        const a = parseFixed(this._value, this.format.decimals);
        const b = parseFixed(other._value, other.format.decimals);
        return fixednumber_FixedNumber.fromValue(a.sub(b), this.format.decimals, this.format);
    }
    mulUnsafe(other) {
        this._checkFormat(other);
        const a = parseFixed(this._value, this.format.decimals);
        const b = parseFixed(other._value, other.format.decimals);
        return fixednumber_FixedNumber.fromValue(a.mul(b).div(this.format._multiplier), this.format.decimals, this.format);
    }
    divUnsafe(other) {
        this._checkFormat(other);
        const a = parseFixed(this._value, this.format.decimals);
        const b = parseFixed(other._value, other.format.decimals);
        return fixednumber_FixedNumber.fromValue(a.mul(this.format._multiplier).div(b), this.format.decimals, this.format);
    }
    floor() {
        let comps = this.toString().split(".");
        let result = fixednumber_FixedNumber.from(comps[0], this.format);
        const hasFraction = !comps[1].match(/^(0*)$/);
        if (this.isNegative() && hasFraction) {
            result = result.subUnsafe(ONE);
        }
        return result;
    }
    ceiling() {
        let comps = this.toString().split(".");
        let result = fixednumber_FixedNumber.from(comps[0], this.format);
        const hasFraction = !comps[1].match(/^(0*)$/);
        if (!this.isNegative() && hasFraction) {
            result = result.addUnsafe(ONE);
        }
        return result;
    }
    // @TODO: Support other rounding algorithms
    round(decimals) {
        if (decimals == null) {
            decimals = 0;
        }
        // If we are already in range, we're done
        let comps = this.toString().split(".");
        if (decimals < 0 || decimals > 80 || (decimals % 1)) {
            fixednumber_logger.throwArgumentError("invalid decimal count", "decimals", decimals);
        }
        if (comps[1].length <= decimals) {
            return this;
        }
        const factor = fixednumber_FixedNumber.from("1" + zeros.substring(0, decimals));
        return this.mulUnsafe(factor).addUnsafe(BUMP).floor().divUnsafe(factor);
    }
    isZero() {
        return (this._value === "0.0");
    }
    isNegative() {
        return (this._value[0] === "-");
    }
    toString() { return this._value; }
    toHexString(width) {
        if (width == null) {
            return this._hex;
        }
        if (width % 8) {
            fixednumber_logger.throwArgumentError("invalid byte width", "width", width);
        }
        const hex = bignumber_BigNumber.from(this._hex).fromTwos(this.format.width).toTwos(width).toHexString();
        return Object(lib_esm["hexZeroPad"])(hex, width / 8);
    }
    toUnsafeFloat() { return parseFloat(this.toString()); }
    toFormat(format) {
        return fixednumber_FixedNumber.fromString(this._value, format);
    }
    static fromValue(value, decimals, format) {
        // If decimals looks more like a format, and there is no format, shift the parameters
        if (format == null && decimals != null && !isBigNumberish(decimals)) {
            format = decimals;
            decimals = null;
        }
        if (decimals == null) {
            decimals = 0;
        }
        if (format == null) {
            format = "fixed";
        }
        return fixednumber_FixedNumber.fromString(formatFixed(value, decimals), fixednumber_FixedFormat.from(format));
    }
    static fromString(value, format) {
        if (format == null) {
            format = "fixed";
        }
        const fixedFormat = fixednumber_FixedFormat.from(format);
        const numeric = parseFixed(value, fixedFormat.decimals);
        if (!fixedFormat.signed && numeric.lt(Zero)) {
            fixednumber_throwFault("unsigned value cannot be negative", "overflow", "value", value);
        }
        let hex = null;
        if (fixedFormat.signed) {
            hex = numeric.toTwos(fixedFormat.width).toHexString();
        }
        else {
            hex = numeric.toHexString();
            hex = Object(lib_esm["hexZeroPad"])(hex, fixedFormat.width / 8);
        }
        const decimal = formatFixed(numeric, fixedFormat.decimals);
        return new fixednumber_FixedNumber(fixednumber_constructorGuard, hex, decimal, fixedFormat);
    }
    static fromBytes(value, format) {
        if (format == null) {
            format = "fixed";
        }
        const fixedFormat = fixednumber_FixedFormat.from(format);
        if (Object(lib_esm["arrayify"])(value).length > fixedFormat.width / 8) {
            throw new Error("overflow");
        }
        let numeric = bignumber_BigNumber.from(value);
        if (fixedFormat.signed) {
            numeric = numeric.fromTwos(fixedFormat.width);
        }
        const hex = numeric.toTwos((fixedFormat.signed ? 0 : 1) + fixedFormat.width).toHexString();
        const decimal = formatFixed(numeric, fixedFormat.decimals);
        return new fixednumber_FixedNumber(fixednumber_constructorGuard, hex, decimal, fixedFormat);
    }
    static from(value, format) {
        if (typeof (value) === "string") {
            return fixednumber_FixedNumber.fromString(value, format);
        }
        if (Object(lib_esm["isBytes"])(value)) {
            return fixednumber_FixedNumber.fromBytes(value, format);
        }
        try {
            return fixednumber_FixedNumber.fromValue(value, 0, format);
        }
        catch (error) {
            // Allow NUMERIC_FAULT to bubble up
            if (error.code !== logger_lib_esm["Logger"].errors.INVALID_ARGUMENT) {
                throw error;
            }
        }
        return fixednumber_logger.throwArgumentError("invalid FixedNumber value", "value", value);
    }
    static isFixedNumber(value) {
        return !!(value && value._isFixedNumber);
    }
}
const ONE = fixednumber_FixedNumber.from(1);
const BUMP = fixednumber_FixedNumber.from("0.5");
//# sourceMappingURL=fixednumber.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/bignumber/lib.esm/index.js


//# sourceMappingURL=index.js.map

/***/ }),

/***/ 524:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return version; });
const version = "web/5.0.7";
//# sourceMappingURL=_version.js.map

/***/ }),

/***/ 6:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "isBytesLike", function() { return /* binding */ isBytesLike; });
__webpack_require__.d(__webpack_exports__, "isBytes", function() { return /* binding */ isBytes; });
__webpack_require__.d(__webpack_exports__, "arrayify", function() { return /* binding */ arrayify; });
__webpack_require__.d(__webpack_exports__, "concat", function() { return /* binding */ concat; });
__webpack_require__.d(__webpack_exports__, "stripZeros", function() { return /* binding */ stripZeros; });
__webpack_require__.d(__webpack_exports__, "zeroPad", function() { return /* binding */ zeroPad; });
__webpack_require__.d(__webpack_exports__, "isHexString", function() { return /* binding */ isHexString; });
__webpack_require__.d(__webpack_exports__, "hexlify", function() { return /* binding */ hexlify; });
__webpack_require__.d(__webpack_exports__, "hexDataLength", function() { return /* binding */ hexDataLength; });
__webpack_require__.d(__webpack_exports__, "hexDataSlice", function() { return /* binding */ hexDataSlice; });
__webpack_require__.d(__webpack_exports__, "hexConcat", function() { return /* binding */ hexConcat; });
__webpack_require__.d(__webpack_exports__, "hexValue", function() { return /* binding */ hexValue; });
__webpack_require__.d(__webpack_exports__, "hexStripZeros", function() { return /* binding */ hexStripZeros; });
__webpack_require__.d(__webpack_exports__, "hexZeroPad", function() { return /* binding */ hexZeroPad; });
__webpack_require__.d(__webpack_exports__, "splitSignature", function() { return /* binding */ splitSignature; });
__webpack_require__.d(__webpack_exports__, "joinSignature", function() { return /* binding */ joinSignature; });

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/bytes/lib.esm/_version.js
const version = "bytes/5.0.4";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js



const logger = new lib_esm["Logger"](version);
///////////////////////////////
function isHexable(value) {
    return !!(value.toHexString);
}
function addSlice(array) {
    if (array.slice) {
        return array;
    }
    array.slice = function () {
        const args = Array.prototype.slice.call(arguments);
        return addSlice(new Uint8Array(Array.prototype.slice.apply(array, args)));
    };
    return array;
}
function isBytesLike(value) {
    return ((isHexString(value) && !(value.length % 2)) || isBytes(value));
}
function isBytes(value) {
    if (value == null) {
        return false;
    }
    if (value.constructor === Uint8Array) {
        return true;
    }
    if (typeof (value) === "string") {
        return false;
    }
    if (value.length == null) {
        return false;
    }
    for (let i = 0; i < value.length; i++) {
        const v = value[i];
        if (v < 0 || v >= 256 || (v % 1)) {
            return false;
        }
    }
    return true;
}
function arrayify(value, options) {
    if (!options) {
        options = {};
    }
    if (typeof (value) === "number") {
        logger.checkSafeUint53(value, "invalid arrayify value");
        const result = [];
        while (value) {
            result.unshift(value & 0xff);
            value = parseInt(String(value / 256));
        }
        if (result.length === 0) {
            result.push(0);
        }
        return addSlice(new Uint8Array(result));
    }
    if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
        value = "0x" + value;
    }
    if (isHexable(value)) {
        value = value.toHexString();
    }
    if (isHexString(value)) {
        let hex = value.substring(2);
        if (hex.length % 2) {
            if (options.hexPad === "left") {
                hex = "0x0" + hex.substring(2);
            }
            else if (options.hexPad === "right") {
                hex += "0";
            }
            else {
                logger.throwArgumentError("hex data is odd-length", "value", value);
            }
        }
        const result = [];
        for (let i = 0; i < hex.length; i += 2) {
            result.push(parseInt(hex.substring(i, i + 2), 16));
        }
        return addSlice(new Uint8Array(result));
    }
    if (isBytes(value)) {
        return addSlice(new Uint8Array(value));
    }
    return logger.throwArgumentError("invalid arrayify value", "value", value);
}
function concat(items) {
    const objects = items.map(item => arrayify(item));
    const length = objects.reduce((accum, item) => (accum + item.length), 0);
    const result = new Uint8Array(length);
    objects.reduce((offset, object) => {
        result.set(object, offset);
        return offset + object.length;
    }, 0);
    return addSlice(result);
}
function stripZeros(value) {
    let result = arrayify(value);
    if (result.length === 0) {
        return result;
    }
    // Find the first non-zero entry
    let start = 0;
    while (start < result.length && result[start] === 0) {
        start++;
    }
    // If we started with zeros, strip them
    if (start) {
        result = result.slice(start);
    }
    return result;
}
function zeroPad(value, length) {
    value = arrayify(value);
    if (value.length > length) {
        logger.throwArgumentError("value out of range", "value", arguments[0]);
    }
    const result = new Uint8Array(length);
    result.set(value, length - value.length);
    return addSlice(result);
}
function isHexString(value, length) {
    if (typeof (value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
        return false;
    }
    if (length && value.length !== 2 + 2 * length) {
        return false;
    }
    return true;
}
const HexCharacters = "0123456789abcdef";
function hexlify(value, options) {
    if (!options) {
        options = {};
    }
    if (typeof (value) === "number") {
        logger.checkSafeUint53(value, "invalid hexlify value");
        let hex = "";
        while (value) {
            hex = HexCharacters[value & 0x0f] + hex;
            value = Math.floor(value / 16);
        }
        if (hex.length) {
            if (hex.length % 2) {
                hex = "0" + hex;
            }
            return "0x" + hex;
        }
        return "0x00";
    }
    if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
        value = "0x" + value;
    }
    if (isHexable(value)) {
        return value.toHexString();
    }
    if (isHexString(value)) {
        if (value.length % 2) {
            if (options.hexPad === "left") {
                value = "0x0" + value.substring(2);
            }
            else if (options.hexPad === "right") {
                value += "0";
            }
            else {
                logger.throwArgumentError("hex data is odd-length", "value", value);
            }
        }
        return value.toLowerCase();
    }
    if (isBytes(value)) {
        let result = "0x";
        for (let i = 0; i < value.length; i++) {
            let v = value[i];
            result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
        }
        return result;
    }
    return logger.throwArgumentError("invalid hexlify value", "value", value);
}
/*
function unoddify(value: BytesLike | Hexable | number): BytesLike | Hexable | number {
    if (typeof(value) === "string" && value.length % 2 && value.substring(0, 2) === "0x") {
        return "0x0" + value.substring(2);
    }
    return value;
}
*/
function hexDataLength(data) {
    if (typeof (data) !== "string") {
        data = hexlify(data);
    }
    else if (!isHexString(data) || (data.length % 2)) {
        return null;
    }
    return (data.length - 2) / 2;
}
function hexDataSlice(data, offset, endOffset) {
    if (typeof (data) !== "string") {
        data = hexlify(data);
    }
    else if (!isHexString(data) || (data.length % 2)) {
        logger.throwArgumentError("invalid hexData", "value", data);
    }
    offset = 2 + 2 * offset;
    if (endOffset != null) {
        return "0x" + data.substring(offset, 2 + 2 * endOffset);
    }
    return "0x" + data.substring(offset);
}
function hexConcat(items) {
    let result = "0x";
    items.forEach((item) => {
        result += hexlify(item).substring(2);
    });
    return result;
}
function hexValue(value) {
    const trimmed = hexStripZeros(hexlify(value, { hexPad: "left" }));
    if (trimmed === "0x") {
        return "0x0";
    }
    return trimmed;
}
function hexStripZeros(value) {
    if (typeof (value) !== "string") {
        value = hexlify(value);
    }
    if (!isHexString(value)) {
        logger.throwArgumentError("invalid hex string", "value", value);
    }
    value = value.substring(2);
    let offset = 0;
    while (offset < value.length && value[offset] === "0") {
        offset++;
    }
    return "0x" + value.substring(offset);
}
function hexZeroPad(value, length) {
    if (typeof (value) !== "string") {
        value = hexlify(value);
    }
    else if (!isHexString(value)) {
        logger.throwArgumentError("invalid hex string", "value", value);
    }
    if (value.length > 2 * length + 2) {
        logger.throwArgumentError("value out of range", "value", arguments[1]);
    }
    while (value.length < 2 * length + 2) {
        value = "0x0" + value.substring(2);
    }
    return value;
}
function splitSignature(signature) {
    const result = {
        r: "0x",
        s: "0x",
        _vs: "0x",
        recoveryParam: 0,
        v: 0
    };
    if (isBytesLike(signature)) {
        const bytes = arrayify(signature);
        if (bytes.length !== 65) {
            logger.throwArgumentError("invalid signature string; must be 65 bytes", "signature", signature);
        }
        // Get the r, s and v
        result.r = hexlify(bytes.slice(0, 32));
        result.s = hexlify(bytes.slice(32, 64));
        result.v = bytes[64];
        // Allow a recid to be used as the v
        if (result.v < 27) {
            if (result.v === 0 || result.v === 1) {
                result.v += 27;
            }
            else {
                logger.throwArgumentError("signature invalid v byte", "signature", signature);
            }
        }
        // Compute recoveryParam from v
        result.recoveryParam = 1 - (result.v % 2);
        // Compute _vs from recoveryParam and s
        if (result.recoveryParam) {
            bytes[32] |= 0x80;
        }
        result._vs = hexlify(bytes.slice(32, 64));
    }
    else {
        result.r = signature.r;
        result.s = signature.s;
        result.v = signature.v;
        result.recoveryParam = signature.recoveryParam;
        result._vs = signature._vs;
        // If the _vs is available, use it to populate missing s, v and recoveryParam
        // and verify non-missing s, v and recoveryParam
        if (result._vs != null) {
            const vs = zeroPad(arrayify(result._vs), 32);
            result._vs = hexlify(vs);
            // Set or check the recid
            const recoveryParam = ((vs[0] >= 128) ? 1 : 0);
            if (result.recoveryParam == null) {
                result.recoveryParam = recoveryParam;
            }
            else if (result.recoveryParam !== recoveryParam) {
                logger.throwArgumentError("signature recoveryParam mismatch _vs", "signature", signature);
            }
            // Set or check the s
            vs[0] &= 0x7f;
            const s = hexlify(vs);
            if (result.s == null) {
                result.s = s;
            }
            else if (result.s !== s) {
                logger.throwArgumentError("signature v mismatch _vs", "signature", signature);
            }
        }
        // Use recid and v to populate each other
        if (result.recoveryParam == null) {
            if (result.v == null) {
                logger.throwArgumentError("signature missing v and recoveryParam", "signature", signature);
            }
            else {
                result.recoveryParam = 1 - (result.v % 2);
            }
        }
        else {
            if (result.v == null) {
                result.v = 27 + result.recoveryParam;
            }
            else if (result.recoveryParam !== (1 - (result.v % 2))) {
                logger.throwArgumentError("signature recoveryParam mismatch v", "signature", signature);
            }
        }
        if (result.r == null || !isHexString(result.r)) {
            logger.throwArgumentError("signature missing or invalid r", "signature", signature);
        }
        else {
            result.r = hexZeroPad(result.r, 32);
        }
        if (result.s == null || !isHexString(result.s)) {
            logger.throwArgumentError("signature missing or invalid s", "signature", signature);
        }
        else {
            result.s = hexZeroPad(result.s, 32);
        }
        const vs = arrayify(result.s);
        if (vs[0] >= 128) {
            logger.throwArgumentError("signature s out of range", "signature", signature);
        }
        if (result.recoveryParam) {
            vs[0] |= 0x80;
        }
        const _vs = hexlify(vs);
        if (result._vs) {
            if (!isHexString(result._vs)) {
                logger.throwArgumentError("signature invalid _vs", "signature", signature);
            }
            result._vs = hexZeroPad(result._vs, 32);
        }
        // Set or check the _vs
        if (result._vs == null) {
            result._vs = _vs;
        }
        else if (result._vs !== _vs) {
            logger.throwArgumentError("signature _vs mismatch v and s", "signature", signature);
        }
    }
    return result;
}
function joinSignature(signature) {
    signature = splitSignature(signature);
    return hexlify(concat([
        signature.r,
        signature.s,
        (signature.recoveryParam ? "0x1c" : "0x1b")
    ]));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 620:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Buffer) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return IpcProvider; });
/* harmony import */ var net__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(856);
/* harmony import */ var net__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(net__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _ethersproject_properties__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(11);
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(98);
/* harmony import */ var _json_rpc_provider__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(193);





const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_2__["Logger"](_version__WEBPACK_IMPORTED_MODULE_3__[/* version */ "a"]);

class IpcProvider extends _json_rpc_provider__WEBPACK_IMPORTED_MODULE_4__[/* JsonRpcProvider */ "a"] {
    constructor(path, network) {
        logger.checkNew(new.target, IpcProvider);
        if (path == null) {
            logger.throwError("missing path", _ethersproject_logger__WEBPACK_IMPORTED_MODULE_2__["Logger"].errors.MISSING_ARGUMENT, { arg: "path" });
        }
        super("ipc://" + path, network);
        Object(_ethersproject_properties__WEBPACK_IMPORTED_MODULE_1__[/* defineReadOnly */ "d"])(this, "path", path);
    }
    // @TODO: Create a connection to the IPC path and use filters instead of polling for block
    send(method, params) {
        // This method is very simple right now. We create a new socket
        // connection each time, which may be slower, but the main
        // advantage we are aiming for now is security. This simplifies
        // multiplexing requests (since we do not need to multiplex).
        let payload = JSON.stringify({
            method: method,
            params: params,
            id: 42,
            jsonrpc: "2.0"
        });
        return new Promise((resolve, reject) => {
            let response = Buffer.alloc(0);
            let stream = net__WEBPACK_IMPORTED_MODULE_0___default.a.connect(this.path);
            stream.on("data", (data) => {
                response = Buffer.concat([response, data]);
            });
            stream.on("end", () => {
                try {
                    resolve(JSON.parse(response.toString()).result);
                    // @TODO: Better pull apart the error
                    stream.destroy();
                }
                catch (error) {
                    reject(error);
                    stream.destroy();
                }
            });
            stream.on("error", (error) => {
                reject(error);
                stream.destroy();
            });
            stream.write(payload);
            stream.end();
        });
    }
}
//# sourceMappingURL=ipc-provider.js.map
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(22).Buffer))

/***/ }),

/***/ 621:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "computeAddress", function() { return /* binding */ computeAddress; });
__webpack_require__.d(__webpack_exports__, "recoverAddress", function() { return /* binding */ recoverAddress; });
__webpack_require__.d(__webpack_exports__, "serialize", function() { return /* binding */ serialize; });
__webpack_require__.d(__webpack_exports__, "parse", function() { return /* binding */ parse; });

// EXTERNAL MODULE: ./node_modules/@ethersproject/address/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(114);

// EXTERNAL MODULE: ./node_modules/@ethersproject/bignumber/lib.esm/index.js + 3 modules
var bignumber_lib_esm = __webpack_require__(43);

// EXTERNAL MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js + 1 modules
var bytes_lib_esm = __webpack_require__(6);

// EXTERNAL MODULE: ./node_modules/@ethersproject/constants/lib.esm/index.js
var constants_lib_esm = __webpack_require__(154);

// EXTERNAL MODULE: ./node_modules/@ethersproject/keccak256/lib.esm/index.js
var keccak256_lib_esm = __webpack_require__(131);

// EXTERNAL MODULE: ./node_modules/@ethersproject/properties/lib.esm/index.js + 1 modules
var properties_lib_esm = __webpack_require__(7);

// EXTERNAL MODULE: ./node_modules/@ethersproject/rlp/lib.esm/index.js + 1 modules
var rlp_lib_esm = __webpack_require__(328);

// EXTERNAL MODULE: ./node_modules/elliptic/lib/elliptic.js
var elliptic = __webpack_require__(133);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/signing-key/lib.esm/_version.js
const version = "signing-key/5.0.4";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/signing-key/lib.esm/index.js






const logger = new logger_lib_esm["Logger"](version);
let _curve = null;
function getCurve() {
    if (!_curve) {
        _curve = new elliptic["ec"]("secp256k1");
    }
    return _curve;
}
class lib_esm_SigningKey {
    constructor(privateKey) {
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "curve", "secp256k1");
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "privateKey", Object(bytes_lib_esm["hexlify"])(privateKey));
        const keyPair = getCurve().keyFromPrivate(Object(bytes_lib_esm["arrayify"])(this.privateKey));
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "publicKey", "0x" + keyPair.getPublic(false, "hex"));
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "compressedPublicKey", "0x" + keyPair.getPublic(true, "hex"));
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_isSigningKey", true);
    }
    _addPoint(other) {
        const p0 = getCurve().keyFromPublic(Object(bytes_lib_esm["arrayify"])(this.publicKey));
        const p1 = getCurve().keyFromPublic(Object(bytes_lib_esm["arrayify"])(other));
        return "0x" + p0.pub.add(p1.pub).encodeCompressed("hex");
    }
    signDigest(digest) {
        const keyPair = getCurve().keyFromPrivate(Object(bytes_lib_esm["arrayify"])(this.privateKey));
        const signature = keyPair.sign(Object(bytes_lib_esm["arrayify"])(digest), { canonical: true });
        return Object(bytes_lib_esm["splitSignature"])({
            recoveryParam: signature.recoveryParam,
            r: Object(bytes_lib_esm["hexZeroPad"])("0x" + signature.r.toString(16), 32),
            s: Object(bytes_lib_esm["hexZeroPad"])("0x" + signature.s.toString(16), 32),
        });
    }
    computeSharedSecret(otherKey) {
        const keyPair = getCurve().keyFromPrivate(Object(bytes_lib_esm["arrayify"])(this.privateKey));
        const otherKeyPair = getCurve().keyFromPublic(Object(bytes_lib_esm["arrayify"])(computePublicKey(otherKey)));
        return Object(bytes_lib_esm["hexZeroPad"])("0x" + keyPair.derive(otherKeyPair.getPublic()).toString(16), 32);
    }
    static isSigningKey(value) {
        return !!(value && value._isSigningKey);
    }
}
function recoverPublicKey(digest, signature) {
    const sig = Object(bytes_lib_esm["splitSignature"])(signature);
    const rs = { r: Object(bytes_lib_esm["arrayify"])(sig.r), s: Object(bytes_lib_esm["arrayify"])(sig.s) };
    return "0x" + getCurve().recoverPubKey(Object(bytes_lib_esm["arrayify"])(digest), rs, sig.recoveryParam).encode("hex", false);
}
function computePublicKey(key, compressed) {
    const bytes = Object(bytes_lib_esm["arrayify"])(key);
    if (bytes.length === 32) {
        const signingKey = new lib_esm_SigningKey(bytes);
        if (compressed) {
            return "0x" + getCurve().keyFromPrivate(bytes).getPublic(true, "hex");
        }
        return signingKey.publicKey;
    }
    else if (bytes.length === 33) {
        if (compressed) {
            return Object(bytes_lib_esm["hexlify"])(bytes);
        }
        return "0x" + getCurve().keyFromPublic(bytes).getPublic(false, "hex");
    }
    else if (bytes.length === 65) {
        if (!compressed) {
            return Object(bytes_lib_esm["hexlify"])(bytes);
        }
        return "0x" + getCurve().keyFromPublic(bytes).getPublic(true, "hex");
    }
    return logger.throwArgumentError("invalid public or private key", "key", "[REDACTED]");
}
//# sourceMappingURL=index.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/transactions/lib.esm/_version.js
const _version_version = "transactions/5.0.5";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/transactions/lib.esm/index.js











const lib_esm_logger = new logger_lib_esm["Logger"](_version_version);
///////////////////////////////
function handleAddress(value) {
    if (value === "0x") {
        return null;
    }
    return Object(lib_esm["a" /* getAddress */])(value);
}
function handleNumber(value) {
    if (value === "0x") {
        return constants_lib_esm["f" /* Zero */];
    }
    return bignumber_lib_esm["a" /* BigNumber */].from(value);
}
const transactionFields = [
    { name: "nonce", maxLength: 32, numeric: true },
    { name: "gasPrice", maxLength: 32, numeric: true },
    { name: "gasLimit", maxLength: 32, numeric: true },
    { name: "to", length: 20 },
    { name: "value", maxLength: 32, numeric: true },
    { name: "data" },
];
const allowedTransactionKeys = {
    chainId: true, data: true, gasLimit: true, gasPrice: true, nonce: true, to: true, value: true
};
function computeAddress(key) {
    const publicKey = computePublicKey(key);
    return Object(lib_esm["a" /* getAddress */])(Object(bytes_lib_esm["hexDataSlice"])(Object(keccak256_lib_esm["a" /* keccak256 */])(Object(bytes_lib_esm["hexDataSlice"])(publicKey, 1)), 12));
}
function recoverAddress(digest, signature) {
    return computeAddress(recoverPublicKey(Object(bytes_lib_esm["arrayify"])(digest), signature));
}
function serialize(transaction, signature) {
    Object(properties_lib_esm["b" /* checkProperties */])(transaction, allowedTransactionKeys);
    const raw = [];
    transactionFields.forEach(function (fieldInfo) {
        let value = transaction[fieldInfo.name] || ([]);
        const options = {};
        if (fieldInfo.numeric) {
            options.hexPad = "left";
        }
        value = Object(bytes_lib_esm["arrayify"])(Object(bytes_lib_esm["hexlify"])(value, options));
        // Fixed-width field
        if (fieldInfo.length && value.length !== fieldInfo.length && value.length > 0) {
            lib_esm_logger.throwArgumentError("invalid length for " + fieldInfo.name, ("transaction:" + fieldInfo.name), value);
        }
        // Variable-width (with a maximum)
        if (fieldInfo.maxLength) {
            value = Object(bytes_lib_esm["stripZeros"])(value);
            if (value.length > fieldInfo.maxLength) {
                lib_esm_logger.throwArgumentError("invalid length for " + fieldInfo.name, ("transaction:" + fieldInfo.name), value);
            }
        }
        raw.push(Object(bytes_lib_esm["hexlify"])(value));
    });
    let chainId = 0;
    if (transaction.chainId != null) {
        // A chainId was provided; if non-zero we'll use EIP-155
        chainId = transaction.chainId;
        if (typeof (chainId) !== "number") {
            lib_esm_logger.throwArgumentError("invalid transaction.chainId", "transaction", transaction);
        }
    }
    else if (signature && !Object(bytes_lib_esm["isBytesLike"])(signature) && signature.v > 28) {
        // No chainId provided, but the signature is signing with EIP-155; derive chainId
        chainId = Math.floor((signature.v - 35) / 2);
    }
    // We have an EIP-155 transaction (chainId was specified and non-zero)
    if (chainId !== 0) {
        raw.push(Object(bytes_lib_esm["hexlify"])(chainId)); // @TODO: hexValue?
        raw.push("0x");
        raw.push("0x");
    }
    // Requesting an unsigned transation
    if (!signature) {
        return rlp_lib_esm["b" /* encode */](raw);
    }
    // The splitSignature will ensure the transaction has a recoveryParam in the
    // case that the signTransaction function only adds a v.
    const sig = Object(bytes_lib_esm["splitSignature"])(signature);
    // We pushed a chainId and null r, s on for hashing only; remove those
    let v = 27 + sig.recoveryParam;
    if (chainId !== 0) {
        raw.pop();
        raw.pop();
        raw.pop();
        v += chainId * 2 + 8;
        // If an EIP-155 v (directly or indirectly; maybe _vs) was provided, check it!
        if (sig.v > 28 && sig.v !== v) {
            lib_esm_logger.throwArgumentError("transaction.chainId/signature.v mismatch", "signature", signature);
        }
    }
    else if (sig.v !== v) {
        lib_esm_logger.throwArgumentError("transaction.chainId/signature.v mismatch", "signature", signature);
    }
    raw.push(Object(bytes_lib_esm["hexlify"])(v));
    raw.push(Object(bytes_lib_esm["stripZeros"])(Object(bytes_lib_esm["arrayify"])(sig.r)));
    raw.push(Object(bytes_lib_esm["stripZeros"])(Object(bytes_lib_esm["arrayify"])(sig.s)));
    return rlp_lib_esm["b" /* encode */](raw);
}
function parse(rawTransaction) {
    const transaction = rlp_lib_esm["a" /* decode */](rawTransaction);
    if (transaction.length !== 9 && transaction.length !== 6) {
        lib_esm_logger.throwArgumentError("invalid raw transaction", "rawTransaction", rawTransaction);
    }
    const tx = {
        nonce: handleNumber(transaction[0]).toNumber(),
        gasPrice: handleNumber(transaction[1]),
        gasLimit: handleNumber(transaction[2]),
        to: handleAddress(transaction[3]),
        value: handleNumber(transaction[4]),
        data: transaction[5],
        chainId: 0
    };
    // Legacy unsigned transaction
    if (transaction.length === 6) {
        return tx;
    }
    try {
        tx.v = bignumber_lib_esm["a" /* BigNumber */].from(transaction[6]).toNumber();
    }
    catch (error) {
        console.log(error);
        return tx;
    }
    tx.r = Object(bytes_lib_esm["hexZeroPad"])(transaction[7], 32);
    tx.s = Object(bytes_lib_esm["hexZeroPad"])(transaction[8], 32);
    if (bignumber_lib_esm["a" /* BigNumber */].from(tx.r).isZero() && bignumber_lib_esm["a" /* BigNumber */].from(tx.s).isZero()) {
        // EIP-155 unsigned transaction
        tx.chainId = tx.v;
        tx.v = 0;
    }
    else {
        // Signed Tranasaction
        tx.chainId = Math.floor((tx.v - 35) / 2);
        if (tx.chainId < 0) {
            tx.chainId = 0;
        }
        let recoveryParam = tx.v - 27;
        const raw = transaction.slice(0, 6);
        if (tx.chainId !== 0) {
            raw.push(Object(bytes_lib_esm["hexlify"])(tx.chainId));
            raw.push("0x");
            raw.push("0x");
            recoveryParam -= tx.chainId * 2 + 8;
        }
        const digest = Object(keccak256_lib_esm["a" /* keccak256 */])(rlp_lib_esm["b" /* encode */](raw));
        try {
            tx.from = recoverAddress(digest, { r: Object(bytes_lib_esm["hexlify"])(tx.r), s: Object(bytes_lib_esm["hexlify"])(tx.s), recoveryParam: recoveryParam });
        }
        catch (error) {
            console.log(error);
        }
        tx.hash = Object(keccak256_lib_esm["a" /* keccak256 */])(rawTransaction);
    }
    return tx;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 628:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return pack; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return keccak256; });
/* unused harmony export sha256 */
/* harmony import */ var _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(43);
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6);
/* harmony import */ var _ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(131);
/* harmony import */ var _ethersproject_sha2__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(427);
/* harmony import */ var _ethersproject_sha2__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_ethersproject_sha2__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _ethersproject_strings__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(107);






const regexBytes = new RegExp("^bytes([0-9]+)$");
const regexNumber = new RegExp("^(u?int)([0-9]*)$");
const regexArray = new RegExp("^(.*)\\[([0-9]*)\\]$");
const Zeros = "0000000000000000000000000000000000000000000000000000000000000000";
function _pack(type, value, isArray) {
    switch (type) {
        case "address":
            if (isArray) {
                return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["zeroPad"])(value, 32);
            }
            return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["arrayify"])(value);
        case "string":
            return Object(_ethersproject_strings__WEBPACK_IMPORTED_MODULE_4__[/* toUtf8Bytes */ "b"])(value);
        case "bytes":
            return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["arrayify"])(value);
        case "bool":
            value = (value ? "0x01" : "0x00");
            if (isArray) {
                return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["zeroPad"])(value, 32);
            }
            return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["arrayify"])(value);
    }
    let match = type.match(regexNumber);
    if (match) {
        //let signed = (match[1] === "int")
        let size = parseInt(match[2] || "256");
        if ((match[2] && String(size) !== match[2]) || (size % 8 !== 0) || size === 0 || size > 256) {
            throw new Error("invalid number type - " + type);
        }
        if (isArray) {
            size = 256;
        }
        value = _ethersproject_bignumber__WEBPACK_IMPORTED_MODULE_0__[/* BigNumber */ "a"].from(value).toTwos(size);
        return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["zeroPad"])(value, size / 8);
    }
    match = type.match(regexBytes);
    if (match) {
        const size = parseInt(match[1]);
        if (String(size) !== match[1] || size === 0 || size > 32) {
            throw new Error("invalid bytes type - " + type);
        }
        if (Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["arrayify"])(value).byteLength !== size) {
            throw new Error("invalid value for " + type);
        }
        if (isArray) {
            return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["arrayify"])((value + Zeros).substring(0, 66));
        }
        return value;
    }
    match = type.match(regexArray);
    if (match && Array.isArray(value)) {
        const baseType = match[1];
        const count = parseInt(match[2] || String(value.length));
        if (count != value.length) {
            throw new Error("invalid value for " + type);
        }
        const result = [];
        value.forEach(function (value) {
            result.push(_pack(baseType, value, true));
        });
        return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["concat"])(result);
    }
    throw new Error("invalid type - " + type);
}
// @TODO: Array Enum
function pack(types, values) {
    if (types.length != values.length) {
        throw new Error("type/value count mismatch");
    }
    const tight = [];
    types.forEach(function (type, index) {
        tight.push(_pack(type, values[index]));
    });
    return Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["hexlify"])(Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_1__["concat"])(tight));
}
function keccak256(types, values) {
    return Object(_ethersproject_keccak256__WEBPACK_IMPORTED_MODULE_2__[/* keccak256 */ "a"])(pack(types, values));
}
function sha256(types, values) {
    return Object(_ethersproject_sha2__WEBPACK_IMPORTED_MODULE_3__["sha256"])(pack(types, values));
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 630:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = __webpack_require__(11);
var _version_1 = __webpack_require__(1464);
var WS = null;
try {
    WS = WebSocket;
    if (WS == null) {
        throw new Error("inject please");
    }
}
catch (error) {
    var logger_2 = new logger_1.Logger(_version_1.version);
    WS = function () {
        logger_2.throwError("WebSockets not supported in this environment", logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
            operation: "new WebSocket()"
        });
    };
}
module.exports = WS;
//# sourceMappingURL=browser-ws.js.map

/***/ }),

/***/ 636:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ lib_esm_Contract; });

// UNUSED EXPORTS: ContractFactory

// EXTERNAL MODULE: ./node_modules/@ethersproject/bignumber/lib.esm/index.js + 3 modules
var lib_esm = __webpack_require__(43);

// EXTERNAL MODULE: ./node_modules/@ethersproject/properties/lib.esm/index.js + 1 modules
var properties_lib_esm = __webpack_require__(7);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/_version.js
const version = "abi/5.0.5";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/fragments.js





const logger = new logger_lib_esm["Logger"](version);
;
const _constructorGuard = {};
let ModifiersBytes = { calldata: true, memory: true, storage: true };
let ModifiersNest = { calldata: true, memory: true };
function checkModifier(type, name) {
    if (type === "bytes" || type === "string") {
        if (ModifiersBytes[name]) {
            return true;
        }
    }
    else if (type === "address") {
        if (name === "payable") {
            return true;
        }
    }
    else if (type.indexOf("[") >= 0 || type === "tuple") {
        if (ModifiersNest[name]) {
            return true;
        }
    }
    if (ModifiersBytes[name] || name === "payable") {
        logger.throwArgumentError("invalid modifier", "name", name);
    }
    return false;
}
// @TODO: Make sure that children of an indexed tuple are marked with a null indexed
function parseParamType(param, allowIndexed) {
    let originalParam = param;
    function throwError(i) {
        logger.throwArgumentError(`unexpected character at position ${i}`, "param", param);
    }
    param = param.replace(/\s/g, " ");
    function newNode(parent) {
        let node = { type: "", name: "", parent: parent, state: { allowType: true } };
        if (allowIndexed) {
            node.indexed = false;
        }
        return node;
    }
    let parent = { type: "", name: "", state: { allowType: true } };
    let node = parent;
    for (let i = 0; i < param.length; i++) {
        let c = param[i];
        switch (c) {
            case "(":
                if (node.state.allowType && node.type === "") {
                    node.type = "tuple";
                }
                else if (!node.state.allowParams) {
                    throwError(i);
                }
                node.state.allowType = false;
                node.type = verifyType(node.type);
                node.components = [newNode(node)];
                node = node.components[0];
                break;
            case ")":
                delete node.state;
                if (node.name === "indexed") {
                    if (!allowIndexed) {
                        throwError(i);
                    }
                    node.indexed = true;
                    node.name = "";
                }
                if (checkModifier(node.type, node.name)) {
                    node.name = "";
                }
                node.type = verifyType(node.type);
                let child = node;
                node = node.parent;
                if (!node) {
                    throwError(i);
                }
                delete child.parent;
                node.state.allowParams = false;
                node.state.allowName = true;
                node.state.allowArray = true;
                break;
            case ",":
                delete node.state;
                if (node.name === "indexed") {
                    if (!allowIndexed) {
                        throwError(i);
                    }
                    node.indexed = true;
                    node.name = "";
                }
                if (checkModifier(node.type, node.name)) {
                    node.name = "";
                }
                node.type = verifyType(node.type);
                let sibling = newNode(node.parent);
                //{ type: "", name: "", parent: node.parent, state: { allowType: true } };
                node.parent.components.push(sibling);
                delete node.parent;
                node = sibling;
                break;
            // Hit a space...
            case " ":
                // If reading type, the type is done and may read a param or name
                if (node.state.allowType) {
                    if (node.type !== "") {
                        node.type = verifyType(node.type);
                        delete node.state.allowType;
                        node.state.allowName = true;
                        node.state.allowParams = true;
                    }
                }
                // If reading name, the name is done
                if (node.state.allowName) {
                    if (node.name !== "") {
                        if (node.name === "indexed") {
                            if (!allowIndexed) {
                                throwError(i);
                            }
                            if (node.indexed) {
                                throwError(i);
                            }
                            node.indexed = true;
                            node.name = "";
                        }
                        else if (checkModifier(node.type, node.name)) {
                            node.name = "";
                        }
                        else {
                            node.state.allowName = false;
                        }
                    }
                }
                break;
            case "[":
                if (!node.state.allowArray) {
                    throwError(i);
                }
                node.type += c;
                node.state.allowArray = false;
                node.state.allowName = false;
                node.state.readArray = true;
                break;
            case "]":
                if (!node.state.readArray) {
                    throwError(i);
                }
                node.type += c;
                node.state.readArray = false;
                node.state.allowArray = true;
                node.state.allowName = true;
                break;
            default:
                if (node.state.allowType) {
                    node.type += c;
                    node.state.allowParams = true;
                    node.state.allowArray = true;
                }
                else if (node.state.allowName) {
                    node.name += c;
                    delete node.state.allowArray;
                }
                else if (node.state.readArray) {
                    node.type += c;
                }
                else {
                    throwError(i);
                }
        }
    }
    if (node.parent) {
        logger.throwArgumentError("unexpected eof", "param", param);
    }
    delete parent.state;
    if (node.name === "indexed") {
        if (!allowIndexed) {
            throwError(originalParam.length - 7);
        }
        if (node.indexed) {
            throwError(originalParam.length - 7);
        }
        node.indexed = true;
        node.name = "";
    }
    else if (checkModifier(node.type, node.name)) {
        node.name = "";
    }
    parent.type = verifyType(parent.type);
    return parent;
}
function populate(object, params) {
    for (let key in params) {
        Object(properties_lib_esm["d" /* defineReadOnly */])(object, key, params[key]);
    }
}
const FormatTypes = Object.freeze({
    // Bare formatting, as is needed for computing a sighash of an event or function
    sighash: "sighash",
    // Human-Readable with Minimal spacing and without names (compact human-readable)
    minimal: "minimal",
    // Human-Readble with nice spacing, including all names
    full: "full",
    // JSON-format a la Solidity
    json: "json"
});
const paramTypeArray = new RegExp(/^(.*)\[([0-9]*)\]$/);
class fragments_ParamType {
    constructor(constructorGuard, params) {
        if (constructorGuard !== _constructorGuard) {
            logger.throwError("use fromString", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "new ParamType()"
            });
        }
        populate(this, params);
        let match = this.type.match(paramTypeArray);
        if (match) {
            populate(this, {
                arrayLength: parseInt(match[2] || "-1"),
                arrayChildren: fragments_ParamType.fromObject({
                    type: match[1],
                    components: this.components
                }),
                baseType: "array"
            });
        }
        else {
            populate(this, {
                arrayLength: null,
                arrayChildren: null,
                baseType: ((this.components != null) ? "tuple" : this.type)
            });
        }
        this._isParamType = true;
        Object.freeze(this);
    }
    // Format the parameter fragment
    //   - sighash: "(uint256,address)"
    //   - minimal: "tuple(uint256,address) indexed"
    //   - full:    "tuple(uint256 foo, addres bar) indexed baz"
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            let result = {
                type: ((this.baseType === "tuple") ? "tuple" : this.type),
                name: (this.name || undefined)
            };
            if (typeof (this.indexed) === "boolean") {
                result.indexed = this.indexed;
            }
            if (this.components) {
                result.components = this.components.map((comp) => JSON.parse(comp.format(format)));
            }
            return JSON.stringify(result);
        }
        let result = "";
        // Array
        if (this.baseType === "array") {
            result += this.arrayChildren.format(format);
            result += "[" + (this.arrayLength < 0 ? "" : String(this.arrayLength)) + "]";
        }
        else {
            if (this.baseType === "tuple") {
                if (format !== FormatTypes.sighash) {
                    result += this.type;
                }
                result += "(" + this.components.map((comp) => comp.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ")";
            }
            else {
                result += this.type;
            }
        }
        if (format !== FormatTypes.sighash) {
            if (this.indexed === true) {
                result += " indexed";
            }
            if (format === FormatTypes.full && this.name) {
                result += " " + this.name;
            }
        }
        return result;
    }
    static from(value, allowIndexed) {
        if (typeof (value) === "string") {
            return fragments_ParamType.fromString(value, allowIndexed);
        }
        return fragments_ParamType.fromObject(value);
    }
    static fromObject(value) {
        if (fragments_ParamType.isParamType(value)) {
            return value;
        }
        return new fragments_ParamType(_constructorGuard, {
            name: (value.name || null),
            type: verifyType(value.type),
            indexed: ((value.indexed == null) ? null : !!value.indexed),
            components: (value.components ? value.components.map(fragments_ParamType.fromObject) : null)
        });
    }
    static fromString(value, allowIndexed) {
        function ParamTypify(node) {
            return fragments_ParamType.fromObject({
                name: node.name,
                type: node.type,
                indexed: node.indexed,
                components: node.components
            });
        }
        return ParamTypify(parseParamType(value, !!allowIndexed));
    }
    static isParamType(value) {
        return !!(value != null && value._isParamType);
    }
}
;
function parseParams(value, allowIndex) {
    return splitNesting(value).map((param) => fragments_ParamType.fromString(param, allowIndex));
}
class fragments_Fragment {
    constructor(constructorGuard, params) {
        if (constructorGuard !== _constructorGuard) {
            logger.throwError("use a static from method", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "new Fragment()"
            });
        }
        populate(this, params);
        this._isFragment = true;
        Object.freeze(this);
    }
    static from(value) {
        if (fragments_Fragment.isFragment(value)) {
            return value;
        }
        if (typeof (value) === "string") {
            return fragments_Fragment.fromString(value);
        }
        return fragments_Fragment.fromObject(value);
    }
    static fromObject(value) {
        if (fragments_Fragment.isFragment(value)) {
            return value;
        }
        switch (value.type) {
            case "function":
                return fragments_FunctionFragment.fromObject(value);
            case "event":
                return EventFragment.fromObject(value);
            case "constructor":
                return fragments_ConstructorFragment.fromObject(value);
            case "fallback":
            case "receive":
                // @TODO: Something? Maybe return a FunctionFragment? A custom DefaultFunctionFragment?
                return null;
        }
        return logger.throwArgumentError("invalid fragment object", "value", value);
    }
    static fromString(value) {
        // Make sure the "returns" is surrounded by a space and all whitespace is exactly one space
        value = value.replace(/\s/g, " ");
        value = value.replace(/\(/g, " (").replace(/\)/g, ") ").replace(/\s+/g, " ");
        value = value.trim();
        if (value.split(" ")[0] === "event") {
            return EventFragment.fromString(value.substring(5).trim());
        }
        else if (value.split(" ")[0] === "function") {
            return fragments_FunctionFragment.fromString(value.substring(8).trim());
        }
        else if (value.split("(")[0].trim() === "constructor") {
            return fragments_ConstructorFragment.fromString(value.trim());
        }
        return logger.throwArgumentError("unsupported fragment", "value", value);
    }
    static isFragment(value) {
        return !!(value && value._isFragment);
    }
}
class EventFragment extends fragments_Fragment {
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            return JSON.stringify({
                type: "event",
                anonymous: this.anonymous,
                name: this.name,
                inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
            });
        }
        let result = "";
        if (format !== FormatTypes.sighash) {
            result += "event ";
        }
        result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
        if (format !== FormatTypes.sighash) {
            if (this.anonymous) {
                result += "anonymous ";
            }
        }
        return result.trim();
    }
    static from(value) {
        if (typeof (value) === "string") {
            return EventFragment.fromString(value);
        }
        return EventFragment.fromObject(value);
    }
    static fromObject(value) {
        if (EventFragment.isEventFragment(value)) {
            return value;
        }
        if (value.type !== "event") {
            logger.throwArgumentError("invalid event object", "value", value);
        }
        const params = {
            name: verifyIdentifier(value.name),
            anonymous: value.anonymous,
            inputs: (value.inputs ? value.inputs.map(fragments_ParamType.fromObject) : []),
            type: "event"
        };
        return new EventFragment(_constructorGuard, params);
    }
    static fromString(value) {
        let match = value.match(regexParen);
        if (!match) {
            logger.throwArgumentError("invalid event string", "value", value);
        }
        let anonymous = false;
        match[3].split(" ").forEach((modifier) => {
            switch (modifier.trim()) {
                case "anonymous":
                    anonymous = true;
                    break;
                case "":
                    break;
                default:
                    logger.warn("unknown modifier: " + modifier);
            }
        });
        return EventFragment.fromObject({
            name: match[1].trim(),
            anonymous: anonymous,
            inputs: parseParams(match[2], true),
            type: "event"
        });
    }
    static isEventFragment(value) {
        return (value && value._isFragment && value.type === "event");
    }
}
function parseGas(value, params) {
    params.gas = null;
    let comps = value.split("@");
    if (comps.length !== 1) {
        if (comps.length > 2) {
            logger.throwArgumentError("invalid human-readable ABI signature", "value", value);
        }
        if (!comps[1].match(/^[0-9]+$/)) {
            logger.throwArgumentError("invalid human-readable ABI signature gas", "value", value);
        }
        params.gas = lib_esm["a" /* BigNumber */].from(comps[1]);
        return comps[0];
    }
    return value;
}
function parseModifiers(value, params) {
    params.constant = false;
    params.payable = false;
    params.stateMutability = "nonpayable";
    value.split(" ").forEach((modifier) => {
        switch (modifier.trim()) {
            case "constant":
                params.constant = true;
                break;
            case "payable":
                params.payable = true;
                params.stateMutability = "payable";
                break;
            case "nonpayable":
                params.payable = false;
                params.stateMutability = "nonpayable";
                break;
            case "pure":
                params.constant = true;
                params.stateMutability = "pure";
                break;
            case "view":
                params.constant = true;
                params.stateMutability = "view";
                break;
            case "external":
            case "public":
            case "":
                break;
            default:
                console.log("unknown modifier: " + modifier);
        }
    });
}
function verifyState(value) {
    let result = {
        constant: false,
        payable: true,
        stateMutability: "payable"
    };
    if (value.stateMutability != null) {
        result.stateMutability = value.stateMutability;
        // Set (and check things are consistent) the constant property
        result.constant = (result.stateMutability === "view" || result.stateMutability === "pure");
        if (value.constant != null) {
            if ((!!value.constant) !== result.constant) {
                logger.throwArgumentError("cannot have constant function with mutability " + result.stateMutability, "value", value);
            }
        }
        // Set (and check things are consistent) the payable property
        result.payable = (result.stateMutability === "payable");
        if (value.payable != null) {
            if ((!!value.payable) !== result.payable) {
                logger.throwArgumentError("cannot have payable function with mutability " + result.stateMutability, "value", value);
            }
        }
    }
    else if (value.payable != null) {
        result.payable = !!value.payable;
        // If payable we can assume non-constant; otherwise we can't assume
        if (value.constant == null && !result.payable && value.type !== "constructor") {
            logger.throwArgumentError("unable to determine stateMutability", "value", value);
        }
        result.constant = !!value.constant;
        if (result.constant) {
            result.stateMutability = "view";
        }
        else {
            result.stateMutability = (result.payable ? "payable" : "nonpayable");
        }
        if (result.payable && result.constant) {
            logger.throwArgumentError("cannot have constant payable function", "value", value);
        }
    }
    else if (value.constant != null) {
        result.constant = !!value.constant;
        result.payable = !result.constant;
        result.stateMutability = (result.constant ? "view" : "payable");
    }
    else if (value.type !== "constructor") {
        logger.throwArgumentError("unable to determine stateMutability", "value", value);
    }
    return result;
}
class fragments_ConstructorFragment extends fragments_Fragment {
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            return JSON.stringify({
                type: "constructor",
                stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                payble: this.payable,
                gas: (this.gas ? this.gas.toNumber() : undefined),
                inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
            });
        }
        if (format === FormatTypes.sighash) {
            logger.throwError("cannot format a constructor for sighash", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "format(sighash)"
            });
        }
        let result = "constructor(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
        if (this.stateMutability && this.stateMutability !== "nonpayable") {
            result += this.stateMutability + " ";
        }
        return result.trim();
    }
    static from(value) {
        if (typeof (value) === "string") {
            return fragments_ConstructorFragment.fromString(value);
        }
        return fragments_ConstructorFragment.fromObject(value);
    }
    static fromObject(value) {
        if (fragments_ConstructorFragment.isConstructorFragment(value)) {
            return value;
        }
        if (value.type !== "constructor") {
            logger.throwArgumentError("invalid constructor object", "value", value);
        }
        let state = verifyState(value);
        if (state.constant) {
            logger.throwArgumentError("constructor cannot be constant", "value", value);
        }
        const params = {
            name: null,
            type: value.type,
            inputs: (value.inputs ? value.inputs.map(fragments_ParamType.fromObject) : []),
            payable: state.payable,
            stateMutability: state.stateMutability,
            gas: (value.gas ? lib_esm["a" /* BigNumber */].from(value.gas) : null)
        };
        return new fragments_ConstructorFragment(_constructorGuard, params);
    }
    static fromString(value) {
        let params = { type: "constructor" };
        value = parseGas(value, params);
        let parens = value.match(regexParen);
        if (!parens || parens[1].trim() !== "constructor") {
            logger.throwArgumentError("invalid constructor string", "value", value);
        }
        params.inputs = parseParams(parens[2].trim(), false);
        parseModifiers(parens[3].trim(), params);
        return fragments_ConstructorFragment.fromObject(params);
    }
    static isConstructorFragment(value) {
        return (value && value._isFragment && value.type === "constructor");
    }
}
class fragments_FunctionFragment extends fragments_ConstructorFragment {
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            return JSON.stringify({
                type: "function",
                name: this.name,
                constant: this.constant,
                stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                payble: this.payable,
                gas: (this.gas ? this.gas.toNumber() : undefined),
                inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
                ouputs: this.outputs.map((output) => JSON.parse(output.format(format))),
            });
        }
        let result = "";
        if (format !== FormatTypes.sighash) {
            result += "function ";
        }
        result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
        if (format !== FormatTypes.sighash) {
            if (this.stateMutability) {
                if (this.stateMutability !== "nonpayable") {
                    result += (this.stateMutability + " ");
                }
            }
            else if (this.constant) {
                result += "view ";
            }
            if (this.outputs && this.outputs.length) {
                result += "returns (" + this.outputs.map((output) => output.format(format)).join(", ") + ") ";
            }
            if (this.gas != null) {
                result += "@" + this.gas.toString() + " ";
            }
        }
        return result.trim();
    }
    static from(value) {
        if (typeof (value) === "string") {
            return fragments_FunctionFragment.fromString(value);
        }
        return fragments_FunctionFragment.fromObject(value);
    }
    static fromObject(value) {
        if (fragments_FunctionFragment.isFunctionFragment(value)) {
            return value;
        }
        if (value.type !== "function") {
            logger.throwArgumentError("invalid function object", "value", value);
        }
        let state = verifyState(value);
        const params = {
            type: value.type,
            name: verifyIdentifier(value.name),
            constant: state.constant,
            inputs: (value.inputs ? value.inputs.map(fragments_ParamType.fromObject) : []),
            outputs: (value.outputs ? value.outputs.map(fragments_ParamType.fromObject) : []),
            payable: state.payable,
            stateMutability: state.stateMutability,
            gas: (value.gas ? lib_esm["a" /* BigNumber */].from(value.gas) : null)
        };
        return new fragments_FunctionFragment(_constructorGuard, params);
    }
    static fromString(value) {
        let params = { type: "function" };
        value = parseGas(value, params);
        let comps = value.split(" returns ");
        if (comps.length > 2) {
            logger.throwArgumentError("invalid function string", "value", value);
        }
        let parens = comps[0].match(regexParen);
        if (!parens) {
            logger.throwArgumentError("invalid function signature", "value", value);
        }
        params.name = parens[1].trim();
        if (params.name) {
            verifyIdentifier(params.name);
        }
        params.inputs = parseParams(parens[2], false);
        parseModifiers(parens[3].trim(), params);
        // We have outputs
        if (comps.length > 1) {
            let returns = comps[1].match(regexParen);
            if (returns[1].trim() != "" || returns[3].trim() != "") {
                logger.throwArgumentError("unexpected tokens", "value", value);
            }
            params.outputs = parseParams(returns[2], false);
        }
        else {
            params.outputs = [];
        }
        return fragments_FunctionFragment.fromObject(params);
    }
    static isFunctionFragment(value) {
        return (value && value._isFragment && value.type === "function");
    }
}
//export class ErrorFragment extends Fragment {
//}
//export class StructFragment extends Fragment {
//}
function verifyType(type) {
    // These need to be transformed to their full description
    if (type.match(/^uint($|[^1-9])/)) {
        type = "uint256" + type.substring(4);
    }
    else if (type.match(/^int($|[^1-9])/)) {
        type = "int256" + type.substring(3);
    }
    // @TODO: more verification
    return type;
}
const regexIdentifier = new RegExp("^[A-Za-z_][A-Za-z0-9_]*$");
function verifyIdentifier(value) {
    if (!value || !value.match(regexIdentifier)) {
        logger.throwArgumentError(`invalid identifier "${value}"`, "value", value);
    }
    return value;
}
const regexParen = new RegExp("^([^)(]*)\\((.*)\\)([^)(]*)$");
function splitNesting(value) {
    value = value.trim();
    let result = [];
    let accum = "";
    let depth = 0;
    for (let offset = 0; offset < value.length; offset++) {
        let c = value[offset];
        if (c === "," && depth === 0) {
            result.push(accum);
            accum = "";
        }
        else {
            accum += c;
            if (c === "(") {
                depth++;
            }
            else if (c === ")") {
                depth--;
                if (depth === -1) {
                    logger.throwArgumentError("unbalanced parenthesis", "value", value);
                }
            }
        }
    }
    if (accum) {
        result.push(accum);
    }
    return result;
}
//# sourceMappingURL=fragments.js.map
// EXTERNAL MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js + 1 modules
var bytes_lib_esm = __webpack_require__(6);

// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js






const abstract_coder_logger = new logger_lib_esm["Logger"](version);
function checkResultErrors(result) {
    // Find the first error (if any)
    const errors = [];
    const checkErrors = function (path, object) {
        if (!Array.isArray(object)) {
            return;
        }
        for (let key in object) {
            const childPath = path.slice();
            childPath.push(key);
            try {
                checkErrors(childPath, object[key]);
            }
            catch (error) {
                errors.push({ path: childPath, error: error });
            }
        }
    };
    checkErrors([], result);
    return errors;
}
class Coder {
    constructor(name, type, localName, dynamic) {
        // @TODO: defineReadOnly these
        this.name = name;
        this.type = type;
        this.localName = localName;
        this.dynamic = dynamic;
    }
    _throwError(message, value) {
        abstract_coder_logger.throwArgumentError(message, this.localName, value);
    }
}
class abstract_coder_Writer {
    constructor(wordSize) {
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "wordSize", wordSize || 32);
        this._data = Object(bytes_lib_esm["arrayify"])([]);
        this._padding = new Uint8Array(wordSize);
    }
    get data() { return Object(bytes_lib_esm["hexlify"])(this._data); }
    get length() { return this._data.length; }
    _writeData(data) {
        this._data = Object(bytes_lib_esm["concat"])([this._data, data]);
        return data.length;
    }
    // Arrayish items; padded on the right to wordSize
    writeBytes(value) {
        let bytes = Object(bytes_lib_esm["arrayify"])(value);
        if (bytes.length % this.wordSize) {
            bytes = Object(bytes_lib_esm["concat"])([bytes, this._padding.slice(bytes.length % this.wordSize)]);
        }
        return this._writeData(bytes);
    }
    _getValue(value) {
        let bytes = Object(bytes_lib_esm["arrayify"])(lib_esm["a" /* BigNumber */].from(value));
        if (bytes.length > this.wordSize) {
            abstract_coder_logger.throwError("value out-of-bounds", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {
                length: this.wordSize,
                offset: bytes.length
            });
        }
        if (bytes.length % this.wordSize) {
            bytes = Object(bytes_lib_esm["concat"])([this._padding.slice(bytes.length % this.wordSize), bytes]);
        }
        return bytes;
    }
    // BigNumberish items; padded on the left to wordSize
    writeValue(value) {
        return this._writeData(this._getValue(value));
    }
    writeUpdatableValue() {
        let offset = this.length;
        this.writeValue(0);
        return (value) => {
            this._data.set(this._getValue(value), offset);
        };
    }
}
class abstract_coder_Reader {
    constructor(data, wordSize, coerceFunc, allowLoose) {
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_data", Object(bytes_lib_esm["arrayify"])(data));
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "wordSize", wordSize || 32);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_coerceFunc", coerceFunc);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "allowLoose", allowLoose);
        this._offset = 0;
    }
    get data() { return Object(bytes_lib_esm["hexlify"])(this._data); }
    get consumed() { return this._offset; }
    // The default Coerce function
    static coerce(name, value) {
        let match = name.match("^u?int([0-9]+)$");
        if (match && parseInt(match[1]) <= 48) {
            value = value.toNumber();
        }
        return value;
    }
    coerce(name, value) {
        if (this._coerceFunc) {
            return this._coerceFunc(name, value);
        }
        return abstract_coder_Reader.coerce(name, value);
    }
    _peekBytes(offset, length, loose) {
        let alignedLength = Math.ceil(length / this.wordSize) * this.wordSize;
        if (this._offset + alignedLength > this._data.length) {
            if (this.allowLoose && loose && this._offset + length <= this._data.length) {
                alignedLength = length;
            }
            else {
                abstract_coder_logger.throwError("data out-of-bounds", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {
                    length: this._data.length,
                    offset: this._offset + alignedLength
                });
            }
        }
        return this._data.slice(this._offset, this._offset + alignedLength);
    }
    subReader(offset) {
        return new abstract_coder_Reader(this._data.slice(this._offset + offset), this.wordSize, this._coerceFunc, this.allowLoose);
    }
    readBytes(length, loose) {
        let bytes = this._peekBytes(0, length, !!loose);
        this._offset += bytes.length;
        // @TODO: Make sure the length..end bytes are all 0?
        return bytes.slice(0, length);
    }
    readValue() {
        return lib_esm["a" /* BigNumber */].from(this.readBytes(this.wordSize));
    }
}
//# sourceMappingURL=abstract-coder.js.map
// EXTERNAL MODULE: ./node_modules/@ethersproject/address/lib.esm/index.js + 1 modules
var address_lib_esm = __webpack_require__(114);

// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/coders/address.js




class address_AddressCoder extends Coder {
    constructor(localName) {
        super("address", "address", localName, false);
    }
    encode(writer, value) {
        try {
            Object(address_lib_esm["a" /* getAddress */])(value);
        }
        catch (error) {
            this._throwError(error.message, value);
        }
        return writer.writeValue(value);
    }
    decode(reader) {
        return Object(address_lib_esm["a" /* getAddress */])(Object(bytes_lib_esm["hexZeroPad"])(reader.readValue().toHexString(), 20));
    }
}
//# sourceMappingURL=address.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/coders/anonymous.js


// Clones the functionality of an existing Coder, but without a localName
class anonymous_AnonymousCoder extends Coder {
    constructor(coder) {
        super(coder.name, coder.type, undefined, coder.dynamic);
        this.coder = coder;
    }
    encode(writer, value) {
        return this.coder.encode(writer, value);
    }
    decode(reader) {
        return this.coder.decode(reader);
    }
}
//# sourceMappingURL=anonymous.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/coders/array.js



const array_logger = new logger_lib_esm["Logger"](version);


function pack(writer, coders, values) {
    let arrayValues = null;
    if (Array.isArray(values)) {
        arrayValues = values;
    }
    else if (values && typeof (values) === "object") {
        let unique = {};
        arrayValues = coders.map((coder) => {
            const name = coder.localName;
            if (!name) {
                array_logger.throwError("cannot encode object for signature with missing names", logger_lib_esm["Logger"].errors.INVALID_ARGUMENT, {
                    argument: "values",
                    coder: coder,
                    value: values
                });
            }
            if (unique[name]) {
                array_logger.throwError("cannot encode object for signature with duplicate names", logger_lib_esm["Logger"].errors.INVALID_ARGUMENT, {
                    argument: "values",
                    coder: coder,
                    value: values
                });
            }
            unique[name] = true;
            return values[name];
        });
    }
    else {
        array_logger.throwArgumentError("invalid tuple value", "tuple", values);
    }
    if (coders.length !== arrayValues.length) {
        array_logger.throwArgumentError("types/value length mismatch", "tuple", values);
    }
    let staticWriter = new abstract_coder_Writer(writer.wordSize);
    let dynamicWriter = new abstract_coder_Writer(writer.wordSize);
    let updateFuncs = [];
    coders.forEach((coder, index) => {
        let value = arrayValues[index];
        if (coder.dynamic) {
            // Get current dynamic offset (for the future pointer)
            let dynamicOffset = dynamicWriter.length;
            // Encode the dynamic value into the dynamicWriter
            coder.encode(dynamicWriter, value);
            // Prepare to populate the correct offset once we are done
            let updateFunc = staticWriter.writeUpdatableValue();
            updateFuncs.push((baseOffset) => {
                updateFunc(baseOffset + dynamicOffset);
            });
        }
        else {
            coder.encode(staticWriter, value);
        }
    });
    // Backfill all the dynamic offsets, now that we know the static length
    updateFuncs.forEach((func) => { func(staticWriter.length); });
    let length = writer.writeBytes(staticWriter.data);
    length += writer.writeBytes(dynamicWriter.data);
    return length;
}
function unpack(reader, coders) {
    let values = [];
    // A reader anchored to this base
    let baseReader = reader.subReader(0);
    coders.forEach((coder) => {
        let value = null;
        if (coder.dynamic) {
            let offset = reader.readValue();
            let offsetReader = baseReader.subReader(offset.toNumber());
            try {
                value = coder.decode(offsetReader);
            }
            catch (error) {
                // Cannot recover from this
                if (error.code === logger_lib_esm["Logger"].errors.BUFFER_OVERRUN) {
                    throw error;
                }
                value = error;
                value.baseType = coder.name;
                value.name = coder.localName;
                value.type = coder.type;
            }
        }
        else {
            try {
                value = coder.decode(reader);
            }
            catch (error) {
                // Cannot recover from this
                if (error.code === logger_lib_esm["Logger"].errors.BUFFER_OVERRUN) {
                    throw error;
                }
                value = error;
                value.baseType = coder.name;
                value.name = coder.localName;
                value.type = coder.type;
            }
        }
        if (value != undefined) {
            values.push(value);
        }
    });
    // We only output named properties for uniquely named coders
    const uniqueNames = coders.reduce((accum, coder) => {
        const name = coder.localName;
        if (name) {
            if (!accum[name]) {
                accum[name] = 0;
            }
            accum[name]++;
        }
        return accum;
    }, {});
    // Add any named parameters (i.e. tuples)
    coders.forEach((coder, index) => {
        let name = coder.localName;
        if (!name || uniqueNames[name] !== 1) {
            return;
        }
        if (name === "length") {
            name = "_length";
        }
        if (values[name] != null) {
            return;
        }
        const value = values[index];
        if (value instanceof Error) {
            Object.defineProperty(values, name, {
                get: () => { throw value; }
            });
        }
        else {
            values[name] = value;
        }
    });
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (value instanceof Error) {
            Object.defineProperty(values, i, {
                get: () => { throw value; }
            });
        }
    }
    return Object.freeze(values);
}
class array_ArrayCoder extends Coder {
    constructor(coder, length, localName) {
        const type = (coder.type + "[" + (length >= 0 ? length : "") + "]");
        const dynamic = (length === -1 || coder.dynamic);
        super("array", type, localName, dynamic);
        this.coder = coder;
        this.length = length;
    }
    encode(writer, value) {
        if (!Array.isArray(value)) {
            this._throwError("expected array value", value);
        }
        let count = this.length;
        if (count === -1) {
            count = value.length;
            writer.writeValue(value.length);
        }
        array_logger.checkArgumentCount(value.length, count, "coder array" + (this.localName ? (" " + this.localName) : ""));
        let coders = [];
        for (let i = 0; i < value.length; i++) {
            coders.push(this.coder);
        }
        return pack(writer, coders, value);
    }
    decode(reader) {
        let count = this.length;
        if (count === -1) {
            count = reader.readValue().toNumber();
        }
        let coders = [];
        for (let i = 0; i < count; i++) {
            coders.push(new anonymous_AnonymousCoder(this.coder));
        }
        return reader.coerce(this.name, unpack(reader, coders));
    }
}
//# sourceMappingURL=array.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/coders/boolean.js


class boolean_BooleanCoder extends Coder {
    constructor(localName) {
        super("bool", "bool", localName, false);
    }
    encode(writer, value) {
        return writer.writeValue(value ? 1 : 0);
    }
    decode(reader) {
        return reader.coerce(this.type, !reader.readValue().isZero());
    }
}
//# sourceMappingURL=boolean.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/coders/bytes.js



class bytes_DynamicBytesCoder extends Coder {
    constructor(type, localName) {
        super(type, type, localName, true);
    }
    encode(writer, value) {
        value = Object(bytes_lib_esm["arrayify"])(value);
        let length = writer.writeValue(value.length);
        length += writer.writeBytes(value);
        return length;
    }
    decode(reader) {
        return reader.readBytes(reader.readValue().toNumber(), true);
    }
}
class bytes_BytesCoder extends bytes_DynamicBytesCoder {
    constructor(localName) {
        super("bytes", localName);
    }
    decode(reader) {
        return reader.coerce(this.name, Object(bytes_lib_esm["hexlify"])(super.decode(reader)));
    }
}
//# sourceMappingURL=bytes.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/coders/fixed-bytes.js



// @TODO: Merge this with bytes
class fixed_bytes_FixedBytesCoder extends Coder {
    constructor(size, localName) {
        let name = "bytes" + String(size);
        super(name, name, localName, false);
        this.size = size;
    }
    encode(writer, value) {
        let data = Object(bytes_lib_esm["arrayify"])(value);
        if (data.length !== this.size) {
            this._throwError("incorrect data length", value);
        }
        return writer.writeBytes(data);
    }
    decode(reader) {
        return reader.coerce(this.name, Object(bytes_lib_esm["hexlify"])(reader.readBytes(this.size)));
    }
}
//# sourceMappingURL=fixed-bytes.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/coders/null.js


class null_NullCoder extends Coder {
    constructor(localName) {
        super("null", "", localName, false);
    }
    encode(writer, value) {
        if (value != null) {
            this._throwError("not null", value);
        }
        return writer.writeBytes([]);
    }
    decode(reader) {
        reader.readBytes(0);
        return reader.coerce(this.name, null);
    }
}
//# sourceMappingURL=null.js.map
// EXTERNAL MODULE: ./node_modules/@ethersproject/constants/lib.esm/index.js
var constants_lib_esm = __webpack_require__(154);

// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/coders/number.js




class number_NumberCoder extends Coder {
    constructor(size, signed, localName) {
        const name = ((signed ? "int" : "uint") + (size * 8));
        super(name, name, localName, false);
        this.size = size;
        this.signed = signed;
    }
    encode(writer, value) {
        let v = lib_esm["a" /* BigNumber */].from(value);
        // Check bounds are safe for encoding
        let maxUintValue = constants_lib_esm["c" /* MaxUint256 */].mask(writer.wordSize * 8);
        if (this.signed) {
            let bounds = maxUintValue.mask(this.size * 8 - 1);
            if (v.gt(bounds) || v.lt(bounds.add(constants_lib_esm["e" /* One */]).mul(constants_lib_esm["d" /* NegativeOne */]))) {
                this._throwError("value out-of-bounds", value);
            }
        }
        else if (v.lt(constants_lib_esm["f" /* Zero */]) || v.gt(maxUintValue.mask(this.size * 8))) {
            this._throwError("value out-of-bounds", value);
        }
        v = v.toTwos(this.size * 8).mask(this.size * 8);
        if (this.signed) {
            v = v.fromTwos(this.size * 8).toTwos(8 * writer.wordSize);
        }
        return writer.writeValue(v);
    }
    decode(reader) {
        let value = reader.readValue().mask(this.size * 8);
        if (this.signed) {
            value = value.fromTwos(this.size * 8);
        }
        return reader.coerce(this.name, value);
    }
}
//# sourceMappingURL=number.js.map
// EXTERNAL MODULE: ./node_modules/@ethersproject/strings/lib.esm/index.js + 4 modules
var strings_lib_esm = __webpack_require__(107);

// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/coders/string.js



class string_StringCoder extends bytes_DynamicBytesCoder {
    constructor(localName) {
        super("string", localName);
    }
    encode(writer, value) {
        return super.encode(writer, Object(strings_lib_esm["b" /* toUtf8Bytes */])(value));
    }
    decode(reader) {
        return Object(strings_lib_esm["c" /* toUtf8String */])(super.decode(reader));
    }
}
//# sourceMappingURL=string.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/coders/tuple.js



class tuple_TupleCoder extends Coder {
    constructor(coders, localName) {
        let dynamic = false;
        const types = [];
        coders.forEach((coder) => {
            if (coder.dynamic) {
                dynamic = true;
            }
            types.push(coder.type);
        });
        const type = ("tuple(" + types.join(",") + ")");
        super("tuple", type, localName, dynamic);
        this.coders = coders;
    }
    encode(writer, value) {
        return pack(writer, this.coders, value);
    }
    decode(reader) {
        return reader.coerce(this.name, unpack(reader, this.coders));
    }
}
//# sourceMappingURL=tuple.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/abi-coder.js

// See: https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI




const abi_coder_logger = new logger_lib_esm["Logger"](version);











const paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);
class abi_coder_AbiCoder {
    constructor(coerceFunc) {
        abi_coder_logger.checkNew(new.target, abi_coder_AbiCoder);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "coerceFunc", coerceFunc || null);
    }
    _getCoder(param) {
        switch (param.baseType) {
            case "address":
                return new address_AddressCoder(param.name);
            case "bool":
                return new boolean_BooleanCoder(param.name);
            case "string":
                return new string_StringCoder(param.name);
            case "bytes":
                return new bytes_BytesCoder(param.name);
            case "array":
                return new array_ArrayCoder(this._getCoder(param.arrayChildren), param.arrayLength, param.name);
            case "tuple":
                return new tuple_TupleCoder((param.components || []).map((component) => {
                    return this._getCoder(component);
                }), param.name);
            case "":
                return new null_NullCoder(param.name);
        }
        // u?int[0-9]*
        let match = param.type.match(paramTypeNumber);
        if (match) {
            let size = parseInt(match[2] || "256");
            if (size === 0 || size > 256 || (size % 8) !== 0) {
                abi_coder_logger.throwArgumentError("invalid " + match[1] + " bit length", "param", param);
            }
            return new number_NumberCoder(size / 8, (match[1] === "int"), param.name);
        }
        // bytes[0-9]+
        match = param.type.match(paramTypeBytes);
        if (match) {
            let size = parseInt(match[1]);
            if (size === 0 || size > 32) {
                abi_coder_logger.throwArgumentError("invalid bytes length", "param", param);
            }
            return new fixed_bytes_FixedBytesCoder(size, param.name);
        }
        return abi_coder_logger.throwArgumentError("invalid type", "type", param.type);
    }
    _getWordSize() { return 32; }
    _getReader(data, allowLoose) {
        return new abstract_coder_Reader(data, this._getWordSize(), this.coerceFunc, allowLoose);
    }
    _getWriter() {
        return new abstract_coder_Writer(this._getWordSize());
    }
    encode(types, values) {
        if (types.length !== values.length) {
            abi_coder_logger.throwError("types/values length mismatch", logger_lib_esm["Logger"].errors.INVALID_ARGUMENT, {
                count: { types: types.length, values: values.length },
                value: { types: types, values: values }
            });
        }
        const coders = types.map((type) => this._getCoder(fragments_ParamType.from(type)));
        const coder = (new tuple_TupleCoder(coders, "_"));
        const writer = this._getWriter();
        coder.encode(writer, values);
        return writer.data;
    }
    decode(types, data, loose) {
        const coders = types.map((type) => this._getCoder(fragments_ParamType.from(type)));
        const coder = new tuple_TupleCoder(coders, "_");
        return coder.decode(this._getReader(Object(bytes_lib_esm["arrayify"])(data), loose));
    }
}
const defaultAbiCoder = new abi_coder_AbiCoder();
//# sourceMappingURL=abi-coder.js.map
// EXTERNAL MODULE: ./node_modules/@ethersproject/hash/lib.esm/index.js + 1 modules
var hash_lib_esm = __webpack_require__(177);

// EXTERNAL MODULE: ./node_modules/@ethersproject/keccak256/lib.esm/index.js
var keccak256_lib_esm = __webpack_require__(131);

// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/interface.js












const interface_logger = new logger_lib_esm["Logger"](version);

class interface_LogDescription extends properties_lib_esm["a" /* Description */] {
}
class interface_TransactionDescription extends properties_lib_esm["a" /* Description */] {
}
class interface_Indexed extends properties_lib_esm["a" /* Description */] {
    static isIndexed(value) {
        return !!(value && value._isIndexed);
    }
}
function wrapAccessError(property, error) {
    const wrap = new Error(`deferred error during ABI decoding triggered accessing ${property}`);
    wrap.error = error;
    return wrap;
}
/*
function checkNames(fragment: Fragment, type: "input" | "output", params: Array<ParamType>): void {
    params.reduce((accum, param) => {
        if (param.name) {
            if (accum[param.name]) {
                logger.throwArgumentError(`duplicate ${ type } parameter ${ JSON.stringify(param.name) } in ${ fragment.format("full") }`, "fragment", fragment);
            }
            accum[param.name] = true;
        }
        return accum;
    }, <{ [ name: string ]: boolean }>{ });
}
*/
class interface_Interface {
    constructor(fragments) {
        interface_logger.checkNew(new.target, interface_Interface);
        let abi = [];
        if (typeof (fragments) === "string") {
            abi = JSON.parse(fragments);
        }
        else {
            abi = fragments;
        }
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "fragments", abi.map((fragment) => {
            return fragments_Fragment.from(fragment);
        }).filter((fragment) => (fragment != null)));
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_abiCoder", Object(properties_lib_esm["e" /* getStatic */])((new.target), "getAbiCoder")());
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "functions", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "errors", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "events", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "structs", {});
        // Add all fragments by their signature
        this.fragments.forEach((fragment) => {
            let bucket = null;
            switch (fragment.type) {
                case "constructor":
                    if (this.deploy) {
                        interface_logger.warn("duplicate definition - constructor");
                        return;
                    }
                    //checkNames(fragment, "input", fragment.inputs);
                    Object(properties_lib_esm["d" /* defineReadOnly */])(this, "deploy", fragment);
                    return;
                case "function":
                    //checkNames(fragment, "input", fragment.inputs);
                    //checkNames(fragment, "output", (<FunctionFragment>fragment).outputs);
                    bucket = this.functions;
                    break;
                case "event":
                    //checkNames(fragment, "input", fragment.inputs);
                    bucket = this.events;
                    break;
                default:
                    return;
            }
            let signature = fragment.format();
            if (bucket[signature]) {
                interface_logger.warn("duplicate definition - " + signature);
                return;
            }
            bucket[signature] = fragment;
        });
        // If we do not have a constructor add a default
        if (!this.deploy) {
            Object(properties_lib_esm["d" /* defineReadOnly */])(this, "deploy", fragments_ConstructorFragment.from({
                payable: false,
                type: "constructor"
            }));
        }
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_isInterface", true);
    }
    format(format) {
        if (!format) {
            format = FormatTypes.full;
        }
        if (format === FormatTypes.sighash) {
            interface_logger.throwArgumentError("interface does not support formatting sighash", "format", format);
        }
        const abi = this.fragments.map((fragment) => fragment.format(format));
        // We need to re-bundle the JSON fragments a bit
        if (format === FormatTypes.json) {
            return JSON.stringify(abi.map((j) => JSON.parse(j)));
        }
        return abi;
    }
    // Sub-classes can override these to handle other blockchains
    static getAbiCoder() {
        return defaultAbiCoder;
    }
    static getAddress(address) {
        return Object(address_lib_esm["a" /* getAddress */])(address);
    }
    static getSighash(functionFragment) {
        return Object(bytes_lib_esm["hexDataSlice"])(Object(hash_lib_esm["a" /* id */])(functionFragment.format()), 0, 4);
    }
    static getEventTopic(eventFragment) {
        return Object(hash_lib_esm["a" /* id */])(eventFragment.format());
    }
    // Find a function definition by any means necessary (unless it is ambiguous)
    getFunction(nameOrSignatureOrSighash) {
        if (Object(bytes_lib_esm["isHexString"])(nameOrSignatureOrSighash)) {
            for (const name in this.functions) {
                if (nameOrSignatureOrSighash === this.getSighash(name)) {
                    return this.functions[name];
                }
            }
            interface_logger.throwArgumentError("no matching function", "sighash", nameOrSignatureOrSighash);
        }
        // It is a bare name, look up the function (will return null if ambiguous)
        if (nameOrSignatureOrSighash.indexOf("(") === -1) {
            const name = nameOrSignatureOrSighash.trim();
            const matching = Object.keys(this.functions).filter((f) => (f.split("(" /* fix:) */)[0] === name));
            if (matching.length === 0) {
                interface_logger.throwArgumentError("no matching function", "name", name);
            }
            else if (matching.length > 1) {
                interface_logger.throwArgumentError("multiple matching functions", "name", name);
            }
            return this.functions[matching[0]];
        }
        // Normlize the signature and lookup the function
        const result = this.functions[fragments_FunctionFragment.fromString(nameOrSignatureOrSighash).format()];
        if (!result) {
            interface_logger.throwArgumentError("no matching function", "signature", nameOrSignatureOrSighash);
        }
        return result;
    }
    // Find an event definition by any means necessary (unless it is ambiguous)
    getEvent(nameOrSignatureOrTopic) {
        if (Object(bytes_lib_esm["isHexString"])(nameOrSignatureOrTopic)) {
            const topichash = nameOrSignatureOrTopic.toLowerCase();
            for (const name in this.events) {
                if (topichash === this.getEventTopic(name)) {
                    return this.events[name];
                }
            }
            interface_logger.throwArgumentError("no matching event", "topichash", topichash);
        }
        // It is a bare name, look up the function (will return null if ambiguous)
        if (nameOrSignatureOrTopic.indexOf("(") === -1) {
            const name = nameOrSignatureOrTopic.trim();
            const matching = Object.keys(this.events).filter((f) => (f.split("(" /* fix:) */)[0] === name));
            if (matching.length === 0) {
                interface_logger.throwArgumentError("no matching event", "name", name);
            }
            else if (matching.length > 1) {
                interface_logger.throwArgumentError("multiple matching events", "name", name);
            }
            return this.events[matching[0]];
        }
        // Normlize the signature and lookup the function
        const result = this.events[EventFragment.fromString(nameOrSignatureOrTopic).format()];
        if (!result) {
            interface_logger.throwArgumentError("no matching event", "signature", nameOrSignatureOrTopic);
        }
        return result;
    }
    // Get the sighash (the bytes4 selector) used by Solidity to identify a function
    getSighash(functionFragment) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        return Object(properties_lib_esm["e" /* getStatic */])(this.constructor, "getSighash")(functionFragment);
    }
    // Get the topic (the bytes32 hash) used by Solidity to identify an event
    getEventTopic(eventFragment) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        return Object(properties_lib_esm["e" /* getStatic */])(this.constructor, "getEventTopic")(eventFragment);
    }
    _decodeParams(params, data) {
        return this._abiCoder.decode(params, data);
    }
    _encodeParams(params, values) {
        return this._abiCoder.encode(params, values);
    }
    encodeDeploy(values) {
        return this._encodeParams(this.deploy.inputs, values || []);
    }
    // Decode the data for a function call (e.g. tx.data)
    decodeFunctionData(functionFragment, data) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        const bytes = Object(bytes_lib_esm["arrayify"])(data);
        if (Object(bytes_lib_esm["hexlify"])(bytes.slice(0, 4)) !== this.getSighash(functionFragment)) {
            interface_logger.throwArgumentError(`data signature does not match function ${functionFragment.name}.`, "data", Object(bytes_lib_esm["hexlify"])(bytes));
        }
        return this._decodeParams(functionFragment.inputs, bytes.slice(4));
    }
    // Encode the data for a function call (e.g. tx.data)
    encodeFunctionData(functionFragment, values) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        return Object(bytes_lib_esm["hexlify"])(Object(bytes_lib_esm["concat"])([
            this.getSighash(functionFragment),
            this._encodeParams(functionFragment.inputs, values || [])
        ]));
    }
    // Decode the result from a function call (e.g. from eth_call)
    decodeFunctionResult(functionFragment, data) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        let bytes = Object(bytes_lib_esm["arrayify"])(data);
        let reason = null;
        let errorSignature = null;
        switch (bytes.length % this._abiCoder._getWordSize()) {
            case 0:
                try {
                    return this._abiCoder.decode(functionFragment.outputs, bytes);
                }
                catch (error) { }
                break;
            case 4:
                if (Object(bytes_lib_esm["hexlify"])(bytes.slice(0, 4)) === "0x08c379a0") {
                    errorSignature = "Error(string)";
                    reason = this._abiCoder.decode(["string"], bytes.slice(4))[0];
                }
                break;
        }
        return interface_logger.throwError("call revert exception", logger_lib_esm["Logger"].errors.CALL_EXCEPTION, {
            method: functionFragment.format(),
            errorSignature: errorSignature,
            errorArgs: [reason],
            reason: reason
        });
    }
    // Encode the result for a function call (e.g. for eth_call)
    encodeFunctionResult(functionFragment, values) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        return Object(bytes_lib_esm["hexlify"])(this._abiCoder.encode(functionFragment.outputs, values || []));
    }
    // Create the filter for the event with search criteria (e.g. for eth_filterLog)
    encodeFilterTopics(eventFragment, values) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        if (values.length > eventFragment.inputs.length) {
            interface_logger.throwError("too many arguments for " + eventFragment.format(), logger_lib_esm["Logger"].errors.UNEXPECTED_ARGUMENT, {
                argument: "values",
                value: values
            });
        }
        let topics = [];
        if (!eventFragment.anonymous) {
            topics.push(this.getEventTopic(eventFragment));
        }
        const encodeTopic = (param, value) => {
            if (param.type === "string") {
                return Object(hash_lib_esm["a" /* id */])(value);
            }
            else if (param.type === "bytes") {
                return Object(keccak256_lib_esm["a" /* keccak256 */])(Object(bytes_lib_esm["hexlify"])(value));
            }
            // Check addresses are valid
            if (param.type === "address") {
                this._abiCoder.encode(["address"], [value]);
            }
            return Object(bytes_lib_esm["hexZeroPad"])(Object(bytes_lib_esm["hexlify"])(value), 32);
        };
        values.forEach((value, index) => {
            let param = eventFragment.inputs[index];
            if (!param.indexed) {
                if (value != null) {
                    interface_logger.throwArgumentError("cannot filter non-indexed parameters; must be null", ("contract." + param.name), value);
                }
                return;
            }
            if (value == null) {
                topics.push(null);
            }
            else if (param.baseType === "array" || param.baseType === "tuple") {
                interface_logger.throwArgumentError("filtering with tuples or arrays not supported", ("contract." + param.name), value);
            }
            else if (Array.isArray(value)) {
                topics.push(value.map((value) => encodeTopic(param, value)));
            }
            else {
                topics.push(encodeTopic(param, value));
            }
        });
        // Trim off trailing nulls
        while (topics.length && topics[topics.length - 1] === null) {
            topics.pop();
        }
        return topics;
    }
    encodeEventLog(eventFragment, values) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        const topics = [];
        const dataTypes = [];
        const dataValues = [];
        if (!eventFragment.anonymous) {
            topics.push(this.getEventTopic(eventFragment));
        }
        if (values.length !== eventFragment.inputs.length) {
            interface_logger.throwArgumentError("event arguments/values mismatch", "values", values);
        }
        eventFragment.inputs.forEach((param, index) => {
            const value = values[index];
            if (param.indexed) {
                if (param.type === "string") {
                    topics.push(Object(hash_lib_esm["a" /* id */])(value));
                }
                else if (param.type === "bytes") {
                    topics.push(Object(keccak256_lib_esm["a" /* keccak256 */])(value));
                }
                else if (param.baseType === "tuple" || param.baseType === "array") {
                    // @TOOD
                    throw new Error("not implemented");
                }
                else {
                    topics.push(this._abiCoder.encode([param.type], [value]));
                }
            }
            else {
                dataTypes.push(param);
                dataValues.push(value);
            }
        });
        return {
            data: this._abiCoder.encode(dataTypes, dataValues),
            topics: topics
        };
    }
    // Decode a filter for the event and the search criteria
    decodeEventLog(eventFragment, data, topics) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        if (topics != null && !eventFragment.anonymous) {
            let topicHash = this.getEventTopic(eventFragment);
            if (!Object(bytes_lib_esm["isHexString"])(topics[0], 32) || topics[0].toLowerCase() !== topicHash) {
                interface_logger.throwError("fragment/topic mismatch", logger_lib_esm["Logger"].errors.INVALID_ARGUMENT, { argument: "topics[0]", expected: topicHash, value: topics[0] });
            }
            topics = topics.slice(1);
        }
        let indexed = [];
        let nonIndexed = [];
        let dynamic = [];
        eventFragment.inputs.forEach((param, index) => {
            if (param.indexed) {
                if (param.type === "string" || param.type === "bytes" || param.baseType === "tuple" || param.baseType === "array") {
                    indexed.push(fragments_ParamType.fromObject({ type: "bytes32", name: param.name }));
                    dynamic.push(true);
                }
                else {
                    indexed.push(param);
                    dynamic.push(false);
                }
            }
            else {
                nonIndexed.push(param);
                dynamic.push(false);
            }
        });
        let resultIndexed = (topics != null) ? this._abiCoder.decode(indexed, Object(bytes_lib_esm["concat"])(topics)) : null;
        let resultNonIndexed = this._abiCoder.decode(nonIndexed, data, true);
        let result = [];
        let nonIndexedIndex = 0, indexedIndex = 0;
        eventFragment.inputs.forEach((param, index) => {
            if (param.indexed) {
                if (resultIndexed == null) {
                    result[index] = new interface_Indexed({ _isIndexed: true, hash: null });
                }
                else if (dynamic[index]) {
                    result[index] = new interface_Indexed({ _isIndexed: true, hash: resultIndexed[indexedIndex++] });
                }
                else {
                    try {
                        result[index] = resultIndexed[indexedIndex++];
                    }
                    catch (error) {
                        result[index] = error;
                    }
                }
            }
            else {
                try {
                    result[index] = resultNonIndexed[nonIndexedIndex++];
                }
                catch (error) {
                    result[index] = error;
                }
            }
            // Add the keyword argument if named and safe
            if (param.name && result[param.name] == null) {
                const value = result[index];
                // Make error named values throw on access
                if (value instanceof Error) {
                    Object.defineProperty(result, param.name, {
                        get: () => { throw wrapAccessError(`property ${JSON.stringify(param.name)}`, value); }
                    });
                }
                else {
                    result[param.name] = value;
                }
            }
        });
        // Make all error indexed values throw on access
        for (let i = 0; i < result.length; i++) {
            const value = result[i];
            if (value instanceof Error) {
                Object.defineProperty(result, i, {
                    get: () => { throw wrapAccessError(`index ${i}`, value); }
                });
            }
        }
        return Object.freeze(result);
    }
    // Given a transaction, find the matching function fragment (if any) and
    // determine all its properties and call parameters
    parseTransaction(tx) {
        let fragment = this.getFunction(tx.data.substring(0, 10).toLowerCase());
        if (!fragment) {
            return null;
        }
        return new interface_TransactionDescription({
            args: this._abiCoder.decode(fragment.inputs, "0x" + tx.data.substring(10)),
            functionFragment: fragment,
            name: fragment.name,
            signature: fragment.format(),
            sighash: this.getSighash(fragment),
            value: lib_esm["a" /* BigNumber */].from(tx.value || "0"),
        });
    }
    // Given an event log, find the matching event fragment (if any) and
    // determine all its properties and values
    parseLog(log) {
        let fragment = this.getEvent(log.topics[0]);
        if (!fragment || fragment.anonymous) {
            return null;
        }
        // @TODO: If anonymous, and the only method, and the input count matches, should we parse?
        //        Probably not, because just because it is the only event in the ABI does
        //        not mean we have the full ABI; maybe jsut a fragment?
        return new interface_LogDescription({
            eventFragment: fragment,
            name: fragment.name,
            signature: fragment.format(),
            topic: this.getEventTopic(fragment),
            args: this.decodeEventLog(fragment, log.data, log.topics)
        });
    }
    /*
    static from(value: Array<Fragment | string | JsonAbi> | string | Interface) {
        if (Interface.isInterface(value)) {
            return value;
        }
        if (typeof(value) === "string") {
            return new Interface(JSON.parse(value));
        }
        return new Interface(value);
    }
    */
    static isInterface(value) {
        return !!(value && value._isInterface);
    }
}
//# sourceMappingURL=interface.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/node_modules/@ethersproject/abi/lib.esm/index.js





//# sourceMappingURL=index.js.map
// EXTERNAL MODULE: ./node_modules/@ethersproject/abstract-provider/lib.esm/index.js + 1 modules
var abstract_provider_lib_esm = __webpack_require__(246);

// EXTERNAL MODULE: ./node_modules/@ethersproject/abstract-signer/lib.esm/index.js + 1 modules
var abstract_signer_lib_esm = __webpack_require__(388);

// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/lib.esm/_version.js
const _version_version = "contracts/5.0.4";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/contracts/lib.esm/index.js

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};






//import { AddressZero } from "@ethersproject/constants";

// @TOOD remove dependences transactions


const lib_esm_logger = new logger_lib_esm["Logger"](_version_version);
;
;
///////////////////////////////
const allowedTransactionKeys = {
    chainId: true, data: true, from: true, gasLimit: true, gasPrice: true, nonce: true, to: true, value: true
};
function resolveName(resolver, nameOrPromise) {
    return __awaiter(this, void 0, void 0, function* () {
        const name = yield nameOrPromise;
        // If it is already an address, just use it (after adding checksum)
        try {
            return Object(address_lib_esm["a" /* getAddress */])(name);
        }
        catch (error) { }
        if (!resolver) {
            lib_esm_logger.throwError("a provider or signer is needed to resolve ENS names", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "resolveName"
            });
        }
        return yield resolver.resolveName(name);
    });
}
// Recursively replaces ENS names with promises to resolve the name and resolves all properties
function resolveAddresses(resolver, value, paramType) {
    if (Array.isArray(paramType)) {
        return Promise.all(paramType.map((paramType, index) => {
            return resolveAddresses(resolver, ((Array.isArray(value)) ? value[index] : value[paramType.name]), paramType);
        }));
    }
    if (paramType.type === "address") {
        return resolveName(resolver, value);
    }
    if (paramType.type === "tuple") {
        return resolveAddresses(resolver, value, paramType.components);
    }
    if (paramType.baseType === "array") {
        if (!Array.isArray(value)) {
            throw new Error("invalid value for array");
        }
        return Promise.all(value.map((v) => resolveAddresses(resolver, v, paramType.arrayChildren)));
    }
    return Promise.resolve(value);
}
function populateTransaction(contract, fragment, args) {
    return __awaiter(this, void 0, void 0, function* () {
        // If an extra argument is given, it is overrides
        let overrides = {};
        if (args.length === fragment.inputs.length + 1 && typeof (args[args.length - 1]) === "object") {
            overrides = Object(properties_lib_esm["g" /* shallowCopy */])(args.pop());
        }
        // Make sure the parameter count matches
        lib_esm_logger.checkArgumentCount(args.length, fragment.inputs.length, "passed to contract");
        // Populate "from" override (allow promises)
        if (contract.signer) {
            if (overrides.from) {
                // Contracts with a Signer are from the Signer's frame-of-reference;
                // but we allow overriding "from" if it matches the signer
                overrides.from = Object(properties_lib_esm["f" /* resolveProperties */])({
                    override: resolveName(contract.signer, overrides.from),
                    signer: contract.signer.getAddress()
                }).then((check) => __awaiter(this, void 0, void 0, function* () {
                    if (Object(address_lib_esm["a" /* getAddress */])(check.signer) !== check.override) {
                        lib_esm_logger.throwError("Contract with a Signer cannot override from", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                            operation: "overrides.from"
                        });
                    }
                    return check.override;
                }));
            }
            else {
                overrides.from = contract.signer.getAddress();
            }
        }
        else if (overrides.from) {
            overrides.from = resolveName(contract.provider, overrides.from);
            //} else {
            // Contracts without a signer can override "from", and if
            // unspecified the zero address is used
            //overrides.from = AddressZero;
        }
        // Wait for all dependencies to be resolved (prefer the signer over the provider)
        const resolved = yield Object(properties_lib_esm["f" /* resolveProperties */])({
            args: resolveAddresses(contract.signer || contract.provider, args, fragment.inputs),
            address: contract.resolvedAddress,
            overrides: (Object(properties_lib_esm["f" /* resolveProperties */])(overrides) || {})
        });
        // The ABI coded transaction
        const tx = {
            data: contract.interface.encodeFunctionData(fragment, resolved.args),
            to: resolved.address
        };
        // Resolved Overrides
        const ro = resolved.overrides;
        // Populate simple overrides
        if (ro.nonce != null) {
            tx.nonce = lib_esm["a" /* BigNumber */].from(ro.nonce).toNumber();
        }
        if (ro.gasLimit != null) {
            tx.gasLimit = lib_esm["a" /* BigNumber */].from(ro.gasLimit);
        }
        if (ro.gasPrice != null) {
            tx.gasPrice = lib_esm["a" /* BigNumber */].from(ro.gasPrice);
        }
        if (ro.from != null) {
            tx.from = ro.from;
        }
        // If there was no "gasLimit" override, but the ABI specifies a default, use it
        if (tx.gasLimit == null && fragment.gas != null) {
            tx.gasLimit = lib_esm["a" /* BigNumber */].from(fragment.gas).add(21000);
        }
        // Populate "value" override
        if (ro.value) {
            const roValue = lib_esm["a" /* BigNumber */].from(ro.value);
            if (!roValue.isZero() && !fragment.payable) {
                lib_esm_logger.throwError("non-payable method cannot override value", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                    operation: "overrides.value",
                    value: overrides.value
                });
            }
            tx.value = roValue;
        }
        // Remvoe the overrides
        delete overrides.nonce;
        delete overrides.gasLimit;
        delete overrides.gasPrice;
        delete overrides.from;
        delete overrides.value;
        // Make sure there are no stray overrides, which may indicate a
        // typo or using an unsupported key.
        const leftovers = Object.keys(overrides).filter((key) => (overrides[key] != null));
        if (leftovers.length) {
            lib_esm_logger.throwError(`cannot override ${leftovers.map((l) => JSON.stringify(l)).join(",")}`, logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "overrides",
                overrides: leftovers
            });
        }
        return tx;
    });
}
function buildPopulate(contract, fragment) {
    return function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return populateTransaction(contract, fragment, args);
        });
    };
}
function buildEstimate(contract, fragment) {
    const signerOrProvider = (contract.signer || contract.provider);
    return function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!signerOrProvider) {
                lib_esm_logger.throwError("estimate require a provider or signer", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                    operation: "estimateGas"
                });
            }
            const tx = yield populateTransaction(contract, fragment, args);
            return yield signerOrProvider.estimateGas(tx);
        });
    };
}
function buildCall(contract, fragment, collapseSimple) {
    const signerOrProvider = (contract.signer || contract.provider);
    return function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            // Extract the "blockTag" override if present
            let blockTag = undefined;
            if (args.length === fragment.inputs.length + 1 && typeof (args[args.length - 1]) === "object") {
                const overrides = Object(properties_lib_esm["g" /* shallowCopy */])(args.pop());
                if (overrides.blockTag != null) {
                    blockTag = yield overrides.blockTag;
                }
                delete overrides.blockTag;
                args.push(overrides);
            }
            // If the contract was just deployed, wait until it is mined
            if (contract.deployTransaction != null) {
                yield contract._deployed(blockTag);
            }
            // Call a node and get the result
            const tx = yield populateTransaction(contract, fragment, args);
            const result = yield signerOrProvider.call(tx, blockTag);
            try {
                let value = contract.interface.decodeFunctionResult(fragment, result);
                if (collapseSimple && fragment.outputs.length === 1) {
                    value = value[0];
                }
                return value;
            }
            catch (error) {
                if (error.code === logger_lib_esm["Logger"].errors.CALL_EXCEPTION) {
                    error.address = contract.address;
                    error.args = args;
                    error.transaction = tx;
                }
                throw error;
            }
        });
    };
}
function buildSend(contract, fragment) {
    return function (...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!contract.signer) {
                lib_esm_logger.throwError("sending a transaction requires a signer", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                    operation: "sendTransaction"
                });
            }
            // If the contract was just deployed, wait until it is minded
            if (contract.deployTransaction != null) {
                yield contract._deployed();
            }
            const txRequest = yield populateTransaction(contract, fragment, args);
            const tx = yield contract.signer.sendTransaction(txRequest);
            // Tweak the tw.wait so the receipt has extra properties
            const wait = tx.wait.bind(tx);
            tx.wait = (confirmations) => {
                return wait(confirmations).then((receipt) => {
                    receipt.events = receipt.logs.map((log) => {
                        let event = Object(properties_lib_esm["c" /* deepCopy */])(log);
                        let parsed = null;
                        try {
                            parsed = contract.interface.parseLog(log);
                        }
                        catch (e) { }
                        // Successfully parsed the event log; include it
                        if (parsed) {
                            event.args = parsed.args;
                            event.decode = (data, topics) => {
                                return contract.interface.decodeEventLog(parsed.eventFragment, data, topics);
                            };
                            event.event = parsed.name;
                            event.eventSignature = parsed.signature;
                        }
                        // Useful operations
                        event.removeListener = () => { return contract.provider; };
                        event.getBlock = () => {
                            return contract.provider.getBlock(receipt.blockHash);
                        };
                        event.getTransaction = () => {
                            return contract.provider.getTransaction(receipt.transactionHash);
                        };
                        event.getTransactionReceipt = () => {
                            return Promise.resolve(receipt);
                        };
                        return event;
                    });
                    return receipt;
                });
            };
            return tx;
        });
    };
}
function buildDefault(contract, fragment, collapseSimple) {
    if (fragment.constant) {
        return buildCall(contract, fragment, collapseSimple);
    }
    return buildSend(contract, fragment);
}
function getEventTag(filter) {
    if (filter.address && (filter.topics == null || filter.topics.length === 0)) {
        return "*";
    }
    return (filter.address || "*") + "@" + (filter.topics ? filter.topics.map((topic) => {
        if (Array.isArray(topic)) {
            return topic.join("|");
        }
        return topic;
    }).join(":") : "");
}
class lib_esm_RunningEvent {
    constructor(tag, filter) {
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "tag", tag);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "filter", filter);
        this._listeners = [];
    }
    addListener(listener, once) {
        this._listeners.push({ listener: listener, once: once });
    }
    removeListener(listener) {
        let done = false;
        this._listeners = this._listeners.filter((item) => {
            if (done || item.listener !== listener) {
                return true;
            }
            done = true;
            return false;
        });
    }
    removeAllListeners() {
        this._listeners = [];
    }
    listeners() {
        return this._listeners.map((i) => i.listener);
    }
    listenerCount() {
        return this._listeners.length;
    }
    run(args) {
        const listenerCount = this.listenerCount();
        this._listeners = this._listeners.filter((item) => {
            const argsCopy = args.slice();
            // Call the callback in the next event loop
            setTimeout(() => {
                item.listener.apply(this, argsCopy);
            }, 0);
            // Reschedule it if it not "once"
            return !(item.once);
        });
        return listenerCount;
    }
    prepareEvent(event) {
    }
    // Returns the array that will be applied to an emit
    getEmit(event) {
        return [event];
    }
}
class ErrorRunningEvent extends lib_esm_RunningEvent {
    constructor() {
        super("error", null);
    }
}
// @TODO Fragment should inherit Wildcard? and just override getEmit?
//       or have a common abstract super class, with enough constructor
//       options to configure both.
// A Fragment Event will populate all the properties that Wildcard
// will, and additioanlly dereference the arguments when emitting
class lib_esm_FragmentRunningEvent extends lib_esm_RunningEvent {
    constructor(address, contractInterface, fragment, topics) {
        const filter = {
            address: address
        };
        let topic = contractInterface.getEventTopic(fragment);
        if (topics) {
            if (topic !== topics[0]) {
                lib_esm_logger.throwArgumentError("topic mismatch", "topics", topics);
            }
            filter.topics = topics.slice();
        }
        else {
            filter.topics = [topic];
        }
        super(getEventTag(filter), filter);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "address", address);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "interface", contractInterface);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "fragment", fragment);
    }
    prepareEvent(event) {
        super.prepareEvent(event);
        event.event = this.fragment.name;
        event.eventSignature = this.fragment.format();
        event.decode = (data, topics) => {
            return this.interface.decodeEventLog(this.fragment, data, topics);
        };
        try {
            event.args = this.interface.decodeEventLog(this.fragment, event.data, event.topics);
        }
        catch (error) {
            event.args = null;
            event.decodeError = error;
        }
    }
    getEmit(event) {
        const errors = checkResultErrors(event.args);
        if (errors.length) {
            throw errors[0].error;
        }
        const args = (event.args || []).slice();
        args.push(event);
        return args;
    }
}
// A Wildard Event will attempt to populate:
//  - event            The name of the event name
//  - eventSignature   The full signature of the event
//  - decode           A function to decode data and topics
//  - args             The decoded data and topics
class lib_esm_WildcardRunningEvent extends lib_esm_RunningEvent {
    constructor(address, contractInterface) {
        super("*", { address: address });
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "address", address);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "interface", contractInterface);
    }
    prepareEvent(event) {
        super.prepareEvent(event);
        try {
            const parsed = this.interface.parseLog(event);
            event.event = parsed.name;
            event.eventSignature = parsed.signature;
            event.decode = (data, topics) => {
                return this.interface.decodeEventLog(parsed.eventFragment, data, topics);
            };
            event.args = parsed.args;
        }
        catch (error) {
            // No matching event
        }
    }
}
class lib_esm_Contract {
    constructor(addressOrName, contractInterface, signerOrProvider) {
        lib_esm_logger.checkNew(new.target, lib_esm_Contract);
        // @TODO: Maybe still check the addressOrName looks like a valid address or name?
        //address = getAddress(address);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "interface", Object(properties_lib_esm["e" /* getStatic */])((new.target), "getInterface")(contractInterface));
        if (signerOrProvider == null) {
            Object(properties_lib_esm["d" /* defineReadOnly */])(this, "provider", null);
            Object(properties_lib_esm["d" /* defineReadOnly */])(this, "signer", null);
        }
        else if (abstract_signer_lib_esm["a" /* Signer */].isSigner(signerOrProvider)) {
            Object(properties_lib_esm["d" /* defineReadOnly */])(this, "provider", signerOrProvider.provider || null);
            Object(properties_lib_esm["d" /* defineReadOnly */])(this, "signer", signerOrProvider);
        }
        else if (abstract_provider_lib_esm["b" /* Provider */].isProvider(signerOrProvider)) {
            Object(properties_lib_esm["d" /* defineReadOnly */])(this, "provider", signerOrProvider);
            Object(properties_lib_esm["d" /* defineReadOnly */])(this, "signer", null);
        }
        else {
            lib_esm_logger.throwArgumentError("invalid signer or provider", "signerOrProvider", signerOrProvider);
        }
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "callStatic", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "estimateGas", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "functions", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "populateTransaction", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "filters", {});
        {
            const uniqueFilters = {};
            Object.keys(this.interface.events).forEach((eventSignature) => {
                const event = this.interface.events[eventSignature];
                Object(properties_lib_esm["d" /* defineReadOnly */])(this.filters, eventSignature, (...args) => {
                    return {
                        address: this.address,
                        topics: this.interface.encodeFilterTopics(event, args)
                    };
                });
                if (!uniqueFilters[event.name]) {
                    uniqueFilters[event.name] = [];
                }
                uniqueFilters[event.name].push(eventSignature);
            });
            Object.keys(uniqueFilters).forEach((name) => {
                const filters = uniqueFilters[name];
                if (filters.length === 1) {
                    Object(properties_lib_esm["d" /* defineReadOnly */])(this.filters, name, this.filters[filters[0]]);
                }
                else {
                    lib_esm_logger.warn(`Duplicate definition of ${name} (${filters.join(", ")})`);
                }
            });
        }
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_runningEvents", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_wrappedEmits", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "address", addressOrName);
        if (this.provider) {
            Object(properties_lib_esm["d" /* defineReadOnly */])(this, "resolvedAddress", this.provider.resolveName(addressOrName).then((address) => {
                if (address == null) {
                    throw new Error("name not found");
                }
                return address;
            }).catch((error) => {
                console.log("ERROR: Cannot find Contract - " + addressOrName);
                throw error;
            }));
        }
        else {
            try {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this, "resolvedAddress", Promise.resolve(Object(address_lib_esm["a" /* getAddress */])(addressOrName)));
            }
            catch (error) {
                // Without a provider, we cannot use ENS names
                lib_esm_logger.throwError("provider is required to use ENS name as contract address", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                    operation: "new Contract"
                });
            }
        }
        const uniqueNames = {};
        const uniqueSignatures = {};
        Object.keys(this.interface.functions).forEach((signature) => {
            const fragment = this.interface.functions[signature];
            // Check that the signature is unique; if not the ABI generation has
            // not been cleaned or may be incorrectly generated
            if (uniqueSignatures[signature]) {
                lib_esm_logger.warn(`Duplicate ABI entry for ${JSON.stringify(name)}`);
                return;
            }
            uniqueSignatures[signature] = true;
            // Track unique names; we only expose bare named functions if they
            // are ambiguous
            {
                const name = fragment.name;
                if (!uniqueNames[name]) {
                    uniqueNames[name] = [];
                }
                uniqueNames[name].push(signature);
            }
            if (this[signature] == null) {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this, signature, buildDefault(this, fragment, true));
            }
            // We do not collapse simple calls on this bucket, which allows
            // frameworks to safely use this without introspection as well as
            // allows decoding error recovery.
            if (this.functions[signature] == null) {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this.functions, signature, buildDefault(this, fragment, false));
            }
            if (this.callStatic[signature] == null) {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this.callStatic, signature, buildCall(this, fragment, true));
            }
            if (this.populateTransaction[signature] == null) {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this.populateTransaction, signature, buildPopulate(this, fragment));
            }
            if (this.estimateGas[signature] == null) {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this.estimateGas, signature, buildEstimate(this, fragment));
            }
        });
        Object.keys(uniqueNames).forEach((name) => {
            // Ambiguous names to not get attached as bare names
            const signatures = uniqueNames[name];
            if (signatures.length > 1) {
                return;
            }
            const signature = signatures[0];
            if (this[name] == null) {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this, name, this[signature]);
            }
            if (this.functions[name] == null) {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this.functions, name, this.functions[signature]);
            }
            if (this.callStatic[name] == null) {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this.callStatic, name, this.callStatic[signature]);
            }
            if (this.populateTransaction[name] == null) {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this.populateTransaction, name, this.populateTransaction[signature]);
            }
            if (this.estimateGas[name] == null) {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this.estimateGas, name, this.estimateGas[signature]);
            }
        });
    }
    static getContractAddress(transaction) {
        return Object(address_lib_esm["b" /* getContractAddress */])(transaction);
    }
    static getInterface(contractInterface) {
        if (interface_Interface.isInterface(contractInterface)) {
            return contractInterface;
        }
        return new interface_Interface(contractInterface);
    }
    // @TODO: Allow timeout?
    deployed() {
        return this._deployed();
    }
    _deployed(blockTag) {
        if (!this._deployedPromise) {
            // If we were just deployed, we know the transaction we should occur in
            if (this.deployTransaction) {
                this._deployedPromise = this.deployTransaction.wait().then(() => {
                    return this;
                });
            }
            else {
                // @TODO: Once we allow a timeout to be passed in, we will wait
                // up to that many blocks for getCode
                // Otherwise, poll for our code to be deployed
                this._deployedPromise = this.provider.getCode(this.address, blockTag).then((code) => {
                    if (code === "0x") {
                        lib_esm_logger.throwError("contract not deployed", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                            contractAddress: this.address,
                            operation: "getDeployed"
                        });
                    }
                    return this;
                });
            }
        }
        return this._deployedPromise;
    }
    // @TODO:
    // estimateFallback(overrides?: TransactionRequest): Promise<BigNumber>
    // @TODO:
    // estimateDeploy(bytecode: string, ...args): Promise<BigNumber>
    fallback(overrides) {
        if (!this.signer) {
            lib_esm_logger.throwError("sending a transactions require a signer", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, { operation: "sendTransaction(fallback)" });
        }
        const tx = Object(properties_lib_esm["g" /* shallowCopy */])(overrides || {});
        ["from", "to"].forEach(function (key) {
            if (tx[key] == null) {
                return;
            }
            lib_esm_logger.throwError("cannot override " + key, logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, { operation: key });
        });
        tx.to = this.resolvedAddress;
        return this.deployed().then(() => {
            return this.signer.sendTransaction(tx);
        });
    }
    // Reconnect to a different signer or provider
    connect(signerOrProvider) {
        if (typeof (signerOrProvider) === "string") {
            signerOrProvider = new abstract_signer_lib_esm["b" /* VoidSigner */](signerOrProvider, this.provider);
        }
        const contract = new (this.constructor)(this.address, this.interface, signerOrProvider);
        if (this.deployTransaction) {
            Object(properties_lib_esm["d" /* defineReadOnly */])(contract, "deployTransaction", this.deployTransaction);
        }
        return contract;
    }
    // Re-attach to a different on-chain instance of this contract
    attach(addressOrName) {
        return new (this.constructor)(addressOrName, this.interface, this.signer || this.provider);
    }
    static isIndexed(value) {
        return interface_Indexed.isIndexed(value);
    }
    _normalizeRunningEvent(runningEvent) {
        // Already have an instance of this event running; we can re-use it
        if (this._runningEvents[runningEvent.tag]) {
            return this._runningEvents[runningEvent.tag];
        }
        return runningEvent;
    }
    _getRunningEvent(eventName) {
        if (typeof (eventName) === "string") {
            // Listen for "error" events (if your contract has an error event, include
            // the full signature to bypass this special event keyword)
            if (eventName === "error") {
                return this._normalizeRunningEvent(new ErrorRunningEvent());
            }
            // Listen for any event that is registered
            if (eventName === "event") {
                return this._normalizeRunningEvent(new lib_esm_RunningEvent("event", null));
            }
            // Listen for any event
            if (eventName === "*") {
                return this._normalizeRunningEvent(new lib_esm_WildcardRunningEvent(this.address, this.interface));
            }
            // Get the event Fragment (throws if ambiguous/unknown event)
            const fragment = this.interface.getEvent(eventName);
            return this._normalizeRunningEvent(new lib_esm_FragmentRunningEvent(this.address, this.interface, fragment));
        }
        // We have topics to filter by...
        if (eventName.topics && eventName.topics.length > 0) {
            // Is it a known topichash? (throws if no matching topichash)
            try {
                const topic = eventName.topics[0];
                if (typeof (topic) !== "string") {
                    throw new Error("invalid topic"); // @TODO: May happen for anonymous events
                }
                const fragment = this.interface.getEvent(topic);
                return this._normalizeRunningEvent(new lib_esm_FragmentRunningEvent(this.address, this.interface, fragment, eventName.topics));
            }
            catch (error) { }
            // Filter by the unknown topichash
            const filter = {
                address: this.address,
                topics: eventName.topics
            };
            return this._normalizeRunningEvent(new lib_esm_RunningEvent(getEventTag(filter), filter));
        }
        return this._normalizeRunningEvent(new lib_esm_WildcardRunningEvent(this.address, this.interface));
    }
    _checkRunningEvents(runningEvent) {
        if (runningEvent.listenerCount() === 0) {
            delete this._runningEvents[runningEvent.tag];
            // If we have a poller for this, remove it
            const emit = this._wrappedEmits[runningEvent.tag];
            if (emit) {
                this.provider.off(runningEvent.filter, emit);
                delete this._wrappedEmits[runningEvent.tag];
            }
        }
    }
    // Subclasses can override this to gracefully recover
    // from parse errors if they wish
    _wrapEvent(runningEvent, log, listener) {
        const event = Object(properties_lib_esm["c" /* deepCopy */])(log);
        event.removeListener = () => {
            if (!listener) {
                return;
            }
            runningEvent.removeListener(listener);
            this._checkRunningEvents(runningEvent);
        };
        event.getBlock = () => { return this.provider.getBlock(log.blockHash); };
        event.getTransaction = () => { return this.provider.getTransaction(log.transactionHash); };
        event.getTransactionReceipt = () => { return this.provider.getTransactionReceipt(log.transactionHash); };
        // This may throw if the topics and data mismatch the signature
        runningEvent.prepareEvent(event);
        return event;
    }
    _addEventListener(runningEvent, listener, once) {
        if (!this.provider) {
            lib_esm_logger.throwError("events require a provider or a signer with a provider", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, { operation: "once" });
        }
        runningEvent.addListener(listener, once);
        // Track this running event and its listeners (may already be there; but no hard in updating)
        this._runningEvents[runningEvent.tag] = runningEvent;
        // If we are not polling the provider, start polling
        if (!this._wrappedEmits[runningEvent.tag]) {
            const wrappedEmit = (log) => {
                let event = this._wrapEvent(runningEvent, log, listener);
                // Try to emit the result for the parameterized event...
                if (event.decodeError == null) {
                    try {
                        const args = runningEvent.getEmit(event);
                        this.emit(runningEvent.filter, ...args);
                    }
                    catch (error) {
                        event.decodeError = error.error;
                    }
                }
                // Always emit "event" for fragment-base events
                if (runningEvent.filter != null) {
                    this.emit("event", event);
                }
                // Emit "error" if there was an error
                if (event.decodeError != null) {
                    this.emit("error", event.decodeError, event);
                }
            };
            this._wrappedEmits[runningEvent.tag] = wrappedEmit;
            // Special events, like "error" do not have a filter
            if (runningEvent.filter != null) {
                this.provider.on(runningEvent.filter, wrappedEmit);
            }
        }
    }
    queryFilter(event, fromBlockOrBlockhash, toBlock) {
        const runningEvent = this._getRunningEvent(event);
        const filter = Object(properties_lib_esm["g" /* shallowCopy */])(runningEvent.filter);
        if (typeof (fromBlockOrBlockhash) === "string" && Object(bytes_lib_esm["isHexString"])(fromBlockOrBlockhash, 32)) {
            if (toBlock != null) {
                lib_esm_logger.throwArgumentError("cannot specify toBlock with blockhash", "toBlock", toBlock);
            }
            filter.blockHash = fromBlockOrBlockhash;
        }
        else {
            filter.fromBlock = ((fromBlockOrBlockhash != null) ? fromBlockOrBlockhash : 0);
            filter.toBlock = ((toBlock != null) ? toBlock : "latest");
        }
        return this.provider.getLogs(filter).then((logs) => {
            return logs.map((log) => this._wrapEvent(runningEvent, log, null));
        });
    }
    on(event, listener) {
        this._addEventListener(this._getRunningEvent(event), listener, false);
        return this;
    }
    once(event, listener) {
        this._addEventListener(this._getRunningEvent(event), listener, true);
        return this;
    }
    emit(eventName, ...args) {
        if (!this.provider) {
            return false;
        }
        const runningEvent = this._getRunningEvent(eventName);
        const result = (runningEvent.run(args) > 0);
        // May have drained all the "once" events; check for living events
        this._checkRunningEvents(runningEvent);
        return result;
    }
    listenerCount(eventName) {
        if (!this.provider) {
            return 0;
        }
        return this._getRunningEvent(eventName).listenerCount();
    }
    listeners(eventName) {
        if (!this.provider) {
            return [];
        }
        if (eventName == null) {
            const result = [];
            for (let tag in this._runningEvents) {
                this._runningEvents[tag].listeners().forEach((listener) => {
                    result.push(listener);
                });
            }
            return result;
        }
        return this._getRunningEvent(eventName).listeners();
    }
    removeAllListeners(eventName) {
        if (!this.provider) {
            return this;
        }
        if (eventName == null) {
            for (const tag in this._runningEvents) {
                const runningEvent = this._runningEvents[tag];
                runningEvent.removeAllListeners();
                this._checkRunningEvents(runningEvent);
            }
            return this;
        }
        // Delete any listeners
        const runningEvent = this._getRunningEvent(eventName);
        runningEvent.removeAllListeners();
        this._checkRunningEvents(runningEvent);
        return this;
    }
    off(eventName, listener) {
        if (!this.provider) {
            return this;
        }
        const runningEvent = this._getRunningEvent(eventName);
        runningEvent.removeListener(listener);
        this._checkRunningEvents(runningEvent);
        return this;
    }
    removeListener(eventName, listener) {
        return this.off(eventName, listener);
    }
}
class lib_esm_ContractFactory {
    constructor(contractInterface, bytecode, signer) {
        let bytecodeHex = null;
        if (typeof (bytecode) === "string") {
            bytecodeHex = bytecode;
        }
        else if (Object(bytes_lib_esm["isBytes"])(bytecode)) {
            bytecodeHex = Object(bytes_lib_esm["hexlify"])(bytecode);
        }
        else if (bytecode && typeof (bytecode.object) === "string") {
            // Allow the bytecode object from the Solidity compiler
            bytecodeHex = bytecode.object;
        }
        else {
            // Crash in the next verification step
            bytecodeHex = "!";
        }
        // Make sure it is 0x prefixed
        if (bytecodeHex.substring(0, 2) !== "0x") {
            bytecodeHex = "0x" + bytecodeHex;
        }
        // Make sure the final result is valid bytecode
        if (!Object(bytes_lib_esm["isHexString"])(bytecodeHex) || (bytecodeHex.length % 2)) {
            lib_esm_logger.throwArgumentError("invalid bytecode", "bytecode", bytecode);
        }
        // If we have a signer, make sure it is valid
        if (signer && !abstract_signer_lib_esm["a" /* Signer */].isSigner(signer)) {
            lib_esm_logger.throwArgumentError("invalid signer", "signer", signer);
        }
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "bytecode", bytecodeHex);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "interface", Object(properties_lib_esm["e" /* getStatic */])((new.target), "getInterface")(contractInterface));
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "signer", signer || null);
    }
    // @TODO: Future; rename to populteTransaction?
    getDeployTransaction(...args) {
        let tx = {};
        // If we have 1 additional argument, we allow transaction overrides
        if (args.length === this.interface.deploy.inputs.length + 1 && typeof (args[args.length - 1]) === "object") {
            tx = Object(properties_lib_esm["g" /* shallowCopy */])(args.pop());
            for (const key in tx) {
                if (!allowedTransactionKeys[key]) {
                    throw new Error("unknown transaction override " + key);
                }
            }
        }
        // Do not allow these to be overridden in a deployment transaction
        ["data", "from", "to"].forEach((key) => {
            if (tx[key] == null) {
                return;
            }
            lib_esm_logger.throwError("cannot override " + key, logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, { operation: key });
        });
        // Make sure the call matches the constructor signature
        lib_esm_logger.checkArgumentCount(args.length, this.interface.deploy.inputs.length, " in Contract constructor");
        // Set the data to the bytecode + the encoded constructor arguments
        tx.data = Object(bytes_lib_esm["hexlify"])(Object(bytes_lib_esm["concat"])([
            this.bytecode,
            this.interface.encodeDeploy(args)
        ]));
        return tx;
    }
    deploy(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            let overrides = {};
            // If 1 extra parameter was passed in, it contains overrides
            if (args.length === this.interface.deploy.inputs.length + 1) {
                overrides = args.pop();
            }
            // Make sure the call matches the constructor signature
            lib_esm_logger.checkArgumentCount(args.length, this.interface.deploy.inputs.length, " in Contract constructor");
            // Resolve ENS names and promises in the arguments
            const params = yield resolveAddresses(this.signer, args, this.interface.deploy.inputs);
            params.push(overrides);
            // Get the deployment transaction (with optional overrides)
            const unsignedTx = this.getDeployTransaction(...params);
            // Send the deployment transaction
            const tx = yield this.signer.sendTransaction(unsignedTx);
            const address = Object(properties_lib_esm["e" /* getStatic */])(this.constructor, "getContractAddress")(tx);
            const contract = Object(properties_lib_esm["e" /* getStatic */])(this.constructor, "getContract")(address, this.interface, this.signer);
            Object(properties_lib_esm["d" /* defineReadOnly */])(contract, "deployTransaction", tx);
            return contract;
        });
    }
    attach(address) {
        return (this.constructor).getContract(address, this.interface, this.signer);
    }
    connect(signer) {
        return new (this.constructor)(this.interface, this.bytecode, signer);
    }
    static fromSolidity(compilerOutput, signer) {
        if (compilerOutput == null) {
            lib_esm_logger.throwError("missing compiler output", logger_lib_esm["Logger"].errors.MISSING_ARGUMENT, { argument: "compilerOutput" });
        }
        if (typeof (compilerOutput) === "string") {
            compilerOutput = JSON.parse(compilerOutput);
        }
        const abi = compilerOutput.abi;
        let bytecode = null;
        if (compilerOutput.bytecode) {
            bytecode = compilerOutput.bytecode;
        }
        else if (compilerOutput.evm && compilerOutput.evm.bytecode) {
            bytecode = compilerOutput.evm.bytecode;
        }
        return new this(abi, bytecode, signer);
    }
    static getInterface(contractInterface) {
        return lib_esm_Contract.getInterface(contractInterface);
    }
    static getContractAddress(tx) {
        return Object(address_lib_esm["b" /* getContractAddress */])(tx);
    }
    static getContract(address, contractInterface, signer) {
        return new lib_esm_Contract(address, contractInterface, signer);
    }
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 637:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ getDefaultProvider; });

// UNUSED EXPORTS: Provider, BaseProvider, Resolver, UrlJsonRpcProvider, FallbackProvider, AlchemyProvider, CloudflareProvider, EtherscanProvider, InfuraProvider, JsonRpcProvider, NodesmithProvider, StaticJsonRpcProvider, Web3Provider, WebSocketProvider, IpcProvider, JsonRpcSigner, getNetwork, Formatter

// EXTERNAL MODULE: ./node_modules/@ethersproject/abstract-provider/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(246);

// EXTERNAL MODULE: ./node_modules/@ethersproject/networks/lib.esm/index.js + 1 modules
var networks_lib_esm = __webpack_require__(291);

// EXTERNAL MODULE: ./node_modules/@ethersproject/providers/lib.esm/base-provider.js + 1 modules
var base_provider = __webpack_require__(257);

// EXTERNAL MODULE: ./node_modules/@ethersproject/providers/lib.esm/formatter.js
var formatter = __webpack_require__(215);

// EXTERNAL MODULE: ./node_modules/@ethersproject/providers/lib/browser-ws.js
var browser_ws = __webpack_require__(630);
var browser_ws_default = /*#__PURE__*/__webpack_require__.n(browser_ws);

// EXTERNAL MODULE: ./node_modules/@ethersproject/bignumber/lib.esm/index.js + 3 modules
var bignumber_lib_esm = __webpack_require__(43);

// EXTERNAL MODULE: ./node_modules/@ethersproject/properties/lib.esm/index.js + 1 modules
var properties_lib_esm = __webpack_require__(7);

// EXTERNAL MODULE: ./node_modules/@ethersproject/providers/lib.esm/json-rpc-provider.js
var json_rpc_provider = __webpack_require__(193);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// EXTERNAL MODULE: ./node_modules/@ethersproject/providers/lib.esm/_version.js
var _version = __webpack_require__(98);

// CONCATENATED MODULE: ./node_modules/@ethersproject/providers/lib.esm/websocket-provider.js

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};






const logger = new logger_lib_esm["Logger"](_version["a" /* version */]);
/**
 *  Notes:
 *
 *  This provider differs a bit from the polling providers. One main
 *  difference is how it handles consistency. The polling providers
 *  will stall responses to ensure a consistent state, while this
 *  WebSocket provider assumes the connected backend will manage this.
 *
 *  For example, if a polling provider emits an event which indicats
 *  the event occurred in blockhash XXX, a call to fetch that block by
 *  its hash XXX, if not present will retry until it is present. This
 *  can occur when querying a pool of nodes that are mildly out of sync
 *  with each other.
 */
let NextId = 1;
// For more info about the Real-time Event API see:
//   https://geth.ethereum.org/docs/rpc/pubsub
class websocket_provider_WebSocketProvider extends json_rpc_provider["a" /* JsonRpcProvider */] {
    constructor(url, network) {
        // This will be added in the future; please open an issue to expedite
        if (network === "any") {
            logger.throwError("WebSocketProvider does not support 'any' network yet", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "network:any"
            });
        }
        super(url, network);
        this._pollingInterval = -1;
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_websocket", new browser_ws_default.a(this.connection.url));
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_requests", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_subs", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_subIds", {});
        // Stall sending requests until the socket is open...
        this._wsReady = false;
        this._websocket.onopen = () => {
            this._wsReady = true;
            Object.keys(this._requests).forEach((id) => {
                this._websocket.send(this._requests[id].payload);
            });
        };
        this._websocket.onmessage = (messageEvent) => {
            const data = messageEvent.data;
            const result = JSON.parse(data);
            if (result.id != null) {
                const id = String(result.id);
                const request = this._requests[id];
                delete this._requests[id];
                if (result.result !== undefined) {
                    request.callback(null, result.result);
                }
                else {
                    if (result.error) {
                        const error = new Error(result.error.message || "unknown error");
                        Object(properties_lib_esm["d" /* defineReadOnly */])(error, "code", result.error.code || null);
                        Object(properties_lib_esm["d" /* defineReadOnly */])(error, "response", data);
                        request.callback(error, undefined);
                    }
                    else {
                        request.callback(new Error("unknown error"), undefined);
                    }
                }
            }
            else if (result.method === "eth_subscription") {
                // Subscription...
                const sub = this._subs[result.params.subscription];
                if (sub) {
                    //this.emit.apply(this,                  );
                    sub.processFunc(result.params.result);
                }
            }
            else {
                console.warn("this should not happen");
            }
        };
        // This Provider does not actually poll, but we want to trigger
        // poll events for things that depend on them (like stalling for
        // block and transaction lookups)
        const fauxPoll = setInterval(() => {
            this.emit("poll");
        }, 1000);
        if (fauxPoll.unref) {
            fauxPoll.unref();
        }
    }
    get pollingInterval() {
        return 0;
    }
    resetEventsBlock(blockNumber) {
        logger.throwError("cannot reset events block on WebSocketProvider", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
            operation: "resetEventBlock"
        });
    }
    set pollingInterval(value) {
        logger.throwError("cannot set polling interval on WebSocketProvider", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
            operation: "setPollingInterval"
        });
    }
    poll() {
        return __awaiter(this, void 0, void 0, function* () {
            return null;
        });
    }
    set polling(value) {
        if (!value) {
            return;
        }
        logger.throwError("cannot set polling on WebSocketProvider", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
            operation: "setPolling"
        });
    }
    send(method, params) {
        const rid = NextId++;
        return new Promise((resolve, reject) => {
            function callback(error, result) {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            }
            const payload = JSON.stringify({
                method: method,
                params: params,
                id: rid,
                jsonrpc: "2.0"
            });
            this._requests[String(rid)] = { callback, payload };
            if (this._wsReady) {
                this._websocket.send(payload);
            }
        });
    }
    static defaultUrl() {
        return "ws:/\/localhost:8546";
    }
    _subscribe(tag, param, processFunc) {
        return __awaiter(this, void 0, void 0, function* () {
            let subIdPromise = this._subIds[tag];
            if (subIdPromise == null) {
                subIdPromise = Promise.all(param).then((param) => {
                    return this.send("eth_subscribe", param);
                });
                this._subIds[tag] = subIdPromise;
            }
            const subId = yield subIdPromise;
            this._subs[subId] = { tag, processFunc };
        });
    }
    _startEvent(event) {
        switch (event.type) {
            case "block":
                this._subscribe("block", ["newHeads"], (result) => {
                    const blockNumber = bignumber_lib_esm["a" /* BigNumber */].from(result.number).toNumber();
                    this._emitted.block = blockNumber;
                    this.emit("block", blockNumber);
                });
                break;
            case "pending":
                this._subscribe("pending", ["newPendingTransactions"], (result) => {
                    this.emit("pending", result);
                });
                break;
            case "filter":
                this._subscribe(event.tag, ["logs", this._getFilter(event.filter)], (result) => {
                    if (result.removed == null) {
                        result.removed = false;
                    }
                    this.emit(event.filter, this.formatter.filterLog(result));
                });
                break;
            case "tx": {
                const emitReceipt = (event) => {
                    const hash = event.hash;
                    this.getTransactionReceipt(hash).then((receipt) => {
                        if (!receipt) {
                            return;
                        }
                        this.emit(hash, receipt);
                    });
                };
                // In case it is already mined
                emitReceipt(event);
                // To keep things simple, we start up a single newHeads subscription
                // to keep an eye out for transactions we are watching for.
                // Starting a subscription for an event (i.e. "tx") that is already
                // running is (basically) a nop.
                this._subscribe("tx", ["newHeads"], (result) => {
                    this._events.filter((e) => (e.type === "tx")).forEach(emitReceipt);
                });
                break;
            }
            // Nothing is needed
            case "debug":
            case "poll":
            case "willPoll":
            case "didPoll":
            case "error":
                break;
            default:
                console.log("unhandled:", event);
                break;
        }
    }
    _stopEvent(event) {
        let tag = event.tag;
        if (event.type === "tx") {
            // There are remaining transaction event listeners
            if (this._events.filter((e) => (e.type === "tx")).length) {
                return;
            }
            tag = "tx";
        }
        else if (this.listenerCount(event.event)) {
            // There are remaining event listeners
            return;
        }
        const subId = this._subIds[tag];
        if (!subId) {
            return;
        }
        delete this._subIds[tag];
        subId.then((subId) => {
            if (!this._subs[subId]) {
                return;
            }
            delete this._subs[subId];
            this.send("eth_unsubscribe", [subId]);
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            // Wait until we have connected before trying to disconnect
            if (this._websocket.readyState === browser_ws_default.a.CONNECTING) {
                yield (new Promise((resolve) => {
                    this._websocket.onopen = function () {
                        resolve(true);
                    };
                    this._websocket.onerror = function () {
                        resolve(false);
                    };
                }));
            }
            // Hangup
            // See: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
            this._websocket.close(1000);
        });
    }
}
//# sourceMappingURL=websocket-provider.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/providers/lib.esm/url-json-rpc-provider.js

var url_json_rpc_provider_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



const url_json_rpc_provider_logger = new logger_lib_esm["Logger"](_version["a" /* version */]);

// A StaticJsonRpcProvider is useful when you *know* for certain that
// the backend will never change, as it never calls eth_chainId to
// verify its backend. However, if the backend does change, the effects
// are undefined and may include:
// - inconsistent results
// - locking up the UI
// - block skew warnings
// - wrong results
// If the network is not explicit (i.e. auto-detection is expected), the
// node MUST be running and available to respond to requests BEFORE this
// is instantiated.
class url_json_rpc_provider_StaticJsonRpcProvider extends json_rpc_provider["a" /* JsonRpcProvider */] {
    detectNetwork() {
        const _super = Object.create(null, {
            detectNetwork: { get: () => super.detectNetwork }
        });
        return url_json_rpc_provider_awaiter(this, void 0, void 0, function* () {
            let network = this.network;
            if (network == null) {
                network = yield _super.detectNetwork.call(this);
                if (!network) {
                    url_json_rpc_provider_logger.throwError("no network detected", logger_lib_esm["Logger"].errors.UNKNOWN_ERROR, {});
                }
                // If still not set, set it
                if (this._network == null) {
                    // A static network does not support "any"
                    Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_network", network);
                    this.emit("network", network, null);
                }
            }
            return network;
        });
    }
}
class url_json_rpc_provider_UrlJsonRpcProvider extends url_json_rpc_provider_StaticJsonRpcProvider {
    constructor(network, apiKey) {
        url_json_rpc_provider_logger.checkAbstract(new.target, url_json_rpc_provider_UrlJsonRpcProvider);
        // Normalize the Network and API Key
        network = Object(properties_lib_esm["e" /* getStatic */])((new.target), "getNetwork")(network);
        apiKey = Object(properties_lib_esm["e" /* getStatic */])((new.target), "getApiKey")(apiKey);
        const connection = Object(properties_lib_esm["e" /* getStatic */])((new.target), "getUrl")(network, apiKey);
        super(connection, network);
        if (typeof (apiKey) === "string") {
            Object(properties_lib_esm["d" /* defineReadOnly */])(this, "apiKey", apiKey);
        }
        else if (apiKey != null) {
            Object.keys(apiKey).forEach((key) => {
                Object(properties_lib_esm["d" /* defineReadOnly */])(this, key, apiKey[key]);
            });
        }
    }
    _startPending() {
        url_json_rpc_provider_logger.warn("WARNING: API provider does not support pending filters");
    }
    getSigner(address) {
        return url_json_rpc_provider_logger.throwError("API provider does not support signing", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, { operation: "getSigner" });
    }
    listAccounts() {
        return Promise.resolve([]);
    }
    // Return a defaultApiKey if null, otherwise validate the API key
    static getApiKey(apiKey) {
        return apiKey;
    }
    // Returns the url or connection for the given network and API key. The
    // API key will have been sanitized by the getApiKey first, so any validation
    // or transformations can be done there.
    static getUrl(network, apiKey) {
        return url_json_rpc_provider_logger.throwError("not implemented; sub-classes must override getUrl", logger_lib_esm["Logger"].errors.NOT_IMPLEMENTED, {
            operation: "getUrl"
        });
    }
}
//# sourceMappingURL=url-json-rpc-provider.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/providers/lib.esm/alchemy-provider.js





const alchemy_provider_logger = new logger_lib_esm["Logger"](_version["a" /* version */]);

// This key was provided to ethers.js by Alchemy to be used by the
// default provider, but it is recommended that for your own
// production environments, that you acquire your own API key at:
//   https://dashboard.alchemyapi.io
const defaultApiKey = "_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC";
class alchemy_provider_AlchemyProvider extends url_json_rpc_provider_UrlJsonRpcProvider {
    static getWebSocketProvider(network, apiKey) {
        const provider = new alchemy_provider_AlchemyProvider(network, apiKey);
        const url = provider.connection.url.replace(/^http/i, "ws")
            .replace(".alchemyapi.", ".ws.alchemyapi.");
        return new websocket_provider_WebSocketProvider(url, provider.network);
    }
    static getApiKey(apiKey) {
        if (apiKey == null) {
            return defaultApiKey;
        }
        if (apiKey && typeof (apiKey) !== "string") {
            alchemy_provider_logger.throwArgumentError("invalid apiKey", "apiKey", apiKey);
        }
        return apiKey;
    }
    static getUrl(network, apiKey) {
        let host = null;
        switch (network.name) {
            case "homestead":
                host = "eth-mainnet.alchemyapi.io/v2/";
                break;
            case "ropsten":
                host = "eth-ropsten.alchemyapi.io/v2/";
                break;
            case "rinkeby":
                host = "eth-rinkeby.alchemyapi.io/v2/";
                break;
            case "goerli":
                host = "eth-goerli.alchemyapi.io/v2/";
                break;
            case "kovan":
                host = "eth-kovan.alchemyapi.io/v2/";
                break;
            default:
                alchemy_provider_logger.throwArgumentError("unsupported network", "network", arguments[0]);
        }
        return {
            url: ("https:/" + "/" + host + apiKey),
            throttleCallback: (attempt, url) => {
                if (apiKey === defaultApiKey) {
                    Object(formatter["b" /* showThrottleMessage */])();
                }
                return Promise.resolve(true);
            }
        };
    }
}
//# sourceMappingURL=alchemy-provider.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/providers/lib.esm/cloudflare-provider.js

var cloudflare_provider_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



const cloudflare_provider_logger = new logger_lib_esm["Logger"](_version["a" /* version */]);
class cloudflare_provider_CloudflareProvider extends url_json_rpc_provider_UrlJsonRpcProvider {
    static getApiKey(apiKey) {
        if (apiKey != null) {
            cloudflare_provider_logger.throwArgumentError("apiKey not supported for cloudflare", "apiKey", apiKey);
        }
        return null;
    }
    static getUrl(network, apiKey) {
        let host = null;
        switch (network.name) {
            case "homestead":
                host = "https://cloudflare-eth.com/";
                break;
            default:
                cloudflare_provider_logger.throwArgumentError("unsupported network", "network", arguments[0]);
        }
        return host;
    }
    perform(method, params) {
        const _super = Object.create(null, {
            perform: { get: () => super.perform }
        });
        return cloudflare_provider_awaiter(this, void 0, void 0, function* () {
            // The Cloudflare provider does not support eth_blockNumber,
            // so we get the latest block and pull it from that
            if (method === "getBlockNumber") {
                const block = yield _super.perform.call(this, "getBlock", { blockTag: "latest" });
                return block.number;
            }
            return _super.perform.call(this, method, params);
        });
    }
}
//# sourceMappingURL=cloudflare-provider.js.map
// EXTERNAL MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js + 1 modules
var bytes_lib_esm = __webpack_require__(6);

// EXTERNAL MODULE: ./node_modules/@ethersproject/web/lib.esm/index.js
var web_lib_esm = __webpack_require__(200);

// CONCATENATED MODULE: ./node_modules/@ethersproject/providers/lib.esm/etherscan-provider.js

var etherscan_provider_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};






const etherscan_provider_logger = new logger_lib_esm["Logger"](_version["a" /* version */]);

// The transaction has already been sanitized by the calls in Provider
function getTransactionString(transaction) {
    const result = [];
    for (let key in transaction) {
        if (transaction[key] == null) {
            continue;
        }
        let value = Object(bytes_lib_esm["hexlify"])(transaction[key]);
        if ({ gasLimit: true, gasPrice: true, nonce: true, value: true }[key]) {
            value = Object(bytes_lib_esm["hexValue"])(value);
        }
        result.push(key + "=" + value);
    }
    return result.join("&");
}
function getResult(result) {
    // getLogs, getHistory have weird success responses
    if (result.status == 0 && (result.message === "No records found" || result.message === "No transactions found")) {
        return result.result;
    }
    if (result.status != 1 || result.message != "OK") {
        const error = new Error("invalid response");
        error.result = JSON.stringify(result);
        if ((result.result || "").toLowerCase().indexOf("rate limit") >= 0) {
            error.throttleRetry = true;
        }
        throw error;
    }
    return result.result;
}
function getJsonResult(result) {
    // This response indicates we are being throttled
    if (result && result.status == 0 && result.message == "NOTOK" && (result.result || "").toLowerCase().indexOf("rate limit") >= 0) {
        const error = new Error("throttled response");
        error.result = JSON.stringify(result);
        error.throttleRetry = true;
        throw error;
    }
    if (result.jsonrpc != "2.0") {
        // @TODO: not any
        const error = new Error("invalid response");
        error.result = JSON.stringify(result);
        throw error;
    }
    if (result.error) {
        // @TODO: not any
        const error = new Error(result.error.message || "unknown error");
        if (result.error.code) {
            error.code = result.error.code;
        }
        if (result.error.data) {
            error.data = result.error.data;
        }
        throw error;
    }
    return result.result;
}
// The blockTag was normalized as a string by the Provider pre-perform operations
function checkLogTag(blockTag) {
    if (blockTag === "pending") {
        throw new Error("pending not supported");
    }
    if (blockTag === "latest") {
        return blockTag;
    }
    return parseInt(blockTag.substring(2), 16);
}
const etherscan_provider_defaultApiKey = "9D13ZE7XSBTJ94N9BNJ2MA33VMAY2YPIRB";
function checkError(method, error, transaction) {
    // Get the message from any nested error structure
    let message = error.message;
    if (error.code === logger_lib_esm["Logger"].errors.SERVER_ERROR) {
        if (error.error && typeof (error.error.message) === "string") {
            message = error.error.message;
        }
        else if (typeof (error.body) === "string") {
            message = error.body;
        }
        else if (typeof (error.responseText) === "string") {
            message = error.responseText;
        }
    }
    message = (message || "").toLowerCase();
    // "Insufficient funds. The account you tried to send transaction from does not have enough funds. Required 21464000000000 and got: 0"
    if (message.match(/insufficient funds/)) {
        etherscan_provider_logger.throwError("insufficient funds for intrinsic transaction cost", logger_lib_esm["Logger"].errors.INSUFFICIENT_FUNDS, {
            error, method, transaction
        });
    }
    // "Transaction with the same hash was already imported."
    if (message.match(/same hash was already imported|transaction nonce is too low/)) {
        etherscan_provider_logger.throwError("nonce has already been used", logger_lib_esm["Logger"].errors.NONCE_EXPIRED, {
            error, method, transaction
        });
    }
    // "Transaction gas price is too low. There is another transaction with same nonce in the queue. Try increasing the gas price or incrementing the nonce."
    if (message.match(/another transaction with same nonce/)) {
        etherscan_provider_logger.throwError("replacement fee too low", logger_lib_esm["Logger"].errors.REPLACEMENT_UNDERPRICED, {
            error, method, transaction
        });
    }
    if (message.match(/execution failed due to an exception/)) {
        etherscan_provider_logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", logger_lib_esm["Logger"].errors.UNPREDICTABLE_GAS_LIMIT, {
            error, method, transaction
        });
    }
    throw error;
}
class etherscan_provider_EtherscanProvider extends base_provider["a" /* BaseProvider */] {
    constructor(network, apiKey) {
        etherscan_provider_logger.checkNew(new.target, etherscan_provider_EtherscanProvider);
        super(network);
        let name = "invalid";
        if (this.network) {
            name = this.network.name;
        }
        let baseUrl = null;
        switch (name) {
            case "homestead":
                baseUrl = "https://api.etherscan.io";
                break;
            case "ropsten":
                baseUrl = "https://api-ropsten.etherscan.io";
                break;
            case "rinkeby":
                baseUrl = "https://api-rinkeby.etherscan.io";
                break;
            case "kovan":
                baseUrl = "https://api-kovan.etherscan.io";
                break;
            case "goerli":
                baseUrl = "https://api-goerli.etherscan.io";
                break;
            default:
                throw new Error("unsupported network");
        }
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "baseUrl", baseUrl);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "apiKey", apiKey || etherscan_provider_defaultApiKey);
    }
    detectNetwork() {
        return etherscan_provider_awaiter(this, void 0, void 0, function* () {
            return this.network;
        });
    }
    perform(method, params) {
        const _super = Object.create(null, {
            perform: { get: () => super.perform }
        });
        return etherscan_provider_awaiter(this, void 0, void 0, function* () {
            let url = this.baseUrl;
            let apiKey = "";
            if (this.apiKey) {
                apiKey += "&apikey=" + this.apiKey;
            }
            const get = (url, procFunc) => etherscan_provider_awaiter(this, void 0, void 0, function* () {
                this.emit("debug", {
                    action: "request",
                    request: url,
                    provider: this
                });
                const connection = {
                    url: url,
                    throttleSlotInterval: 1000,
                    throttleCallback: (attempt, url) => {
                        if (this.apiKey === etherscan_provider_defaultApiKey) {
                            Object(formatter["b" /* showThrottleMessage */])();
                        }
                        return Promise.resolve(true);
                    }
                };
                const result = yield Object(web_lib_esm["a" /* fetchJson */])(connection, null, procFunc || getJsonResult);
                this.emit("debug", {
                    action: "response",
                    request: url,
                    response: Object(properties_lib_esm["c" /* deepCopy */])(result),
                    provider: this
                });
                return result;
            });
            switch (method) {
                case "getBlockNumber":
                    url += "/api?module=proxy&action=eth_blockNumber" + apiKey;
                    return get(url);
                case "getGasPrice":
                    url += "/api?module=proxy&action=eth_gasPrice" + apiKey;
                    return get(url);
                case "getBalance":
                    // Returns base-10 result
                    url += "/api?module=account&action=balance&address=" + params.address;
                    url += "&tag=" + params.blockTag + apiKey;
                    return get(url, getResult);
                case "getTransactionCount":
                    url += "/api?module=proxy&action=eth_getTransactionCount&address=" + params.address;
                    url += "&tag=" + params.blockTag + apiKey;
                    return get(url);
                case "getCode":
                    url += "/api?module=proxy&action=eth_getCode&address=" + params.address;
                    url += "&tag=" + params.blockTag + apiKey;
                    return get(url);
                case "getStorageAt":
                    url += "/api?module=proxy&action=eth_getStorageAt&address=" + params.address;
                    url += "&position=" + params.position;
                    url += "&tag=" + params.blockTag + apiKey;
                    return get(url);
                case "sendTransaction":
                    url += "/api?module=proxy&action=eth_sendRawTransaction&hex=" + params.signedTransaction;
                    url += apiKey;
                    return get(url).catch((error) => {
                        return checkError("sendTransaction", error, params.signedTransaction);
                    });
                case "getBlock":
                    if (params.blockTag) {
                        url += "/api?module=proxy&action=eth_getBlockByNumber&tag=" + params.blockTag;
                        if (params.includeTransactions) {
                            url += "&boolean=true";
                        }
                        else {
                            url += "&boolean=false";
                        }
                        url += apiKey;
                        return get(url);
                    }
                    throw new Error("getBlock by blockHash not implemented");
                case "getTransaction":
                    url += "/api?module=proxy&action=eth_getTransactionByHash&txhash=" + params.transactionHash;
                    url += apiKey;
                    return get(url);
                case "getTransactionReceipt":
                    url += "/api?module=proxy&action=eth_getTransactionReceipt&txhash=" + params.transactionHash;
                    url += apiKey;
                    return get(url);
                case "call": {
                    let transaction = getTransactionString(params.transaction);
                    if (transaction) {
                        transaction = "&" + transaction;
                    }
                    url += "/api?module=proxy&action=eth_call" + transaction;
                    //url += "&tag=" + params.blockTag + apiKey;
                    if (params.blockTag !== "latest") {
                        throw new Error("EtherscanProvider does not support blockTag for call");
                    }
                    url += apiKey;
                    try {
                        return yield get(url);
                    }
                    catch (error) {
                        return checkError("call", error, params.transaction);
                    }
                }
                case "estimateGas": {
                    let transaction = getTransactionString(params.transaction);
                    if (transaction) {
                        transaction = "&" + transaction;
                    }
                    url += "/api?module=proxy&action=eth_estimateGas&" + transaction;
                    url += apiKey;
                    try {
                        return yield get(url);
                    }
                    catch (error) {
                        return checkError("estimateGas", error, params.transaction);
                    }
                }
                case "getLogs": {
                    url += "/api?module=logs&action=getLogs";
                    if (params.filter.fromBlock) {
                        url += "&fromBlock=" + checkLogTag(params.filter.fromBlock);
                    }
                    if (params.filter.toBlock) {
                        url += "&toBlock=" + checkLogTag(params.filter.toBlock);
                    }
                    if (params.filter.address) {
                        url += "&address=" + params.filter.address;
                    }
                    // @TODO: We can handle slightly more complicated logs using the logs API
                    if (params.filter.topics && params.filter.topics.length > 0) {
                        if (params.filter.topics.length > 1) {
                            etherscan_provider_logger.throwError("unsupported topic count", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, { topics: params.filter.topics });
                        }
                        if (params.filter.topics.length === 1) {
                            const topic0 = params.filter.topics[0];
                            if (typeof (topic0) !== "string" || topic0.length !== 66) {
                                etherscan_provider_logger.throwError("unsupported topic format", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, { topic0: topic0 });
                            }
                            url += "&topic0=" + topic0;
                        }
                    }
                    url += apiKey;
                    const logs = yield get(url, getResult);
                    // Cache txHash => blockHash
                    let txs = {};
                    // Add any missing blockHash to the logs
                    for (let i = 0; i < logs.length; i++) {
                        const log = logs[i];
                        if (log.blockHash != null) {
                            continue;
                        }
                        if (txs[log.transactionHash] == null) {
                            const tx = yield this.getTransaction(log.transactionHash);
                            if (tx) {
                                txs[log.transactionHash] = tx.blockHash;
                            }
                        }
                        log.blockHash = txs[log.transactionHash];
                    }
                    return logs;
                }
                case "getEtherPrice":
                    if (this.network.name !== "homestead") {
                        return 0.0;
                    }
                    url += "/api?module=stats&action=ethprice";
                    url += apiKey;
                    return parseFloat((yield get(url, getResult)).ethusd);
                default:
                    break;
            }
            return _super.perform.call(this, method, params);
        });
    }
    // @TODO: Allow startBlock and endBlock to be Promises
    getHistory(addressOrName, startBlock, endBlock) {
        let url = this.baseUrl;
        let apiKey = "";
        if (this.apiKey) {
            apiKey += "&apikey=" + this.apiKey;
        }
        if (startBlock == null) {
            startBlock = 0;
        }
        if (endBlock == null) {
            endBlock = 99999999;
        }
        return this.resolveName(addressOrName).then((address) => {
            url += "/api?module=account&action=txlist&address=" + address;
            url += "&startblock=" + startBlock;
            url += "&endblock=" + endBlock;
            url += "&sort=asc" + apiKey;
            this.emit("debug", {
                action: "request",
                request: url,
                provider: this
            });
            const connection = {
                url: url,
                throttleSlotInterval: 1000,
                throttleCallback: (attempt, url) => {
                    if (this.apiKey === etherscan_provider_defaultApiKey) {
                        Object(formatter["b" /* showThrottleMessage */])();
                    }
                    return Promise.resolve(true);
                }
            };
            return Object(web_lib_esm["a" /* fetchJson */])(connection, null, getResult).then((result) => {
                this.emit("debug", {
                    action: "response",
                    request: url,
                    response: Object(properties_lib_esm["c" /* deepCopy */])(result),
                    provider: this
                });
                let output = [];
                result.forEach((tx) => {
                    ["contractAddress", "to"].forEach(function (key) {
                        if (tx[key] == "") {
                            delete tx[key];
                        }
                    });
                    if (tx.creates == null && tx.contractAddress != null) {
                        tx.creates = tx.contractAddress;
                    }
                    let item = this.formatter.transactionResponse(tx);
                    if (tx.timeStamp) {
                        item.timestamp = parseInt(tx.timeStamp);
                    }
                    output.push(item);
                });
                return output;
            });
        });
    }
}
//# sourceMappingURL=etherscan-provider.js.map
// EXTERNAL MODULE: ./node_modules/@ethersproject/random/lib/browser.js
var browser = __webpack_require__(855);

// CONCATENATED MODULE: ./node_modules/@ethersproject/providers/lib.esm/fallback-provider.js

var fallback_provider_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};









const fallback_provider_logger = new logger_lib_esm["Logger"](_version["a" /* version */]);
function now() { return (new Date()).getTime(); }
// Returns to network as long as all agree, or null if any is null.
// Throws an error if any two networks do not match.
function checkNetworks(networks) {
    let result = null;
    for (let i = 0; i < networks.length; i++) {
        const network = networks[i];
        // Null! We do not know our network; bail.
        if (network == null) {
            return null;
        }
        if (result) {
            // Make sure the network matches the previous networks
            if (!(result.name === network.name && result.chainId === network.chainId &&
                ((result.ensAddress === network.ensAddress) || (result.ensAddress == null && network.ensAddress == null)))) {
                fallback_provider_logger.throwArgumentError("provider mismatch", "networks", networks);
            }
        }
        else {
            result = network;
        }
    }
    return result;
}
function median(values, maxDelta) {
    values = values.slice().sort();
    const middle = Math.floor(values.length / 2);
    // Odd length; take the middle
    if (values.length % 2) {
        return values[middle];
    }
    // Even length; take the average of the two middle
    const a = values[middle - 1], b = values[middle];
    if (maxDelta != null && Math.abs(a - b) > maxDelta) {
        return null;
    }
    return (a + b) / 2;
}
function serialize(value) {
    if (value === null) {
        return "null";
    }
    else if (typeof (value) === "number" || typeof (value) === "boolean") {
        return JSON.stringify(value);
    }
    else if (typeof (value) === "string") {
        return value;
    }
    else if (bignumber_lib_esm["a" /* BigNumber */].isBigNumber(value)) {
        return value.toString();
    }
    else if (Array.isArray(value)) {
        return JSON.stringify(value.map((i) => serialize(i)));
    }
    else if (typeof (value) === "object") {
        const keys = Object.keys(value);
        keys.sort();
        return "{" + keys.map((key) => {
            let v = value[key];
            if (typeof (v) === "function") {
                v = "[function]";
            }
            else {
                v = serialize(v);
            }
            return JSON.stringify(key) + ":" + v;
        }).join(",") + "}";
    }
    throw new Error("unknown value type: " + typeof (value));
}
// Next request ID to use for emitting debug info
let nextRid = 1;
;
function stall(duration) {
    let cancel = null;
    let timer = null;
    let promise = (new Promise((resolve) => {
        cancel = function () {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            resolve();
        };
        timer = setTimeout(cancel, duration);
    }));
    const wait = (func) => {
        promise = promise.then(func);
        return promise;
    };
    function getPromise() {
        return promise;
    }
    return { cancel, getPromise, wait };
}
const ForwardErrors = [
    logger_lib_esm["Logger"].errors.CALL_EXCEPTION,
    logger_lib_esm["Logger"].errors.INSUFFICIENT_FUNDS,
    logger_lib_esm["Logger"].errors.NONCE_EXPIRED,
    logger_lib_esm["Logger"].errors.REPLACEMENT_UNDERPRICED,
    logger_lib_esm["Logger"].errors.UNPREDICTABLE_GAS_LIMIT
];
const ForwardProperties = [
    "address",
    "args",
    "errorArgs",
    "errorSignature",
    "method",
    "transaction",
];
;
function exposeDebugConfig(config, now) {
    const result = {
        weight: config.weight
    };
    Object.defineProperty(result, "provider", { get: () => config.provider });
    if (config.start) {
        result.start = config.start;
    }
    if (now) {
        result.duration = (now - config.start);
    }
    if (config.done) {
        if (config.error) {
            result.error = config.error;
        }
        else {
            result.result = config.result || null;
        }
    }
    return result;
}
function normalizedTally(normalize, quorum) {
    return function (configs) {
        // Count the votes for each result
        const tally = {};
        configs.forEach((c) => {
            const value = normalize(c.result);
            if (!tally[value]) {
                tally[value] = { count: 0, result: c.result };
            }
            tally[value].count++;
        });
        // Check for a quorum on any given result
        const keys = Object.keys(tally);
        for (let i = 0; i < keys.length; i++) {
            const check = tally[keys[i]];
            if (check.count >= quorum) {
                return check.result;
            }
        }
        // No quroum
        return undefined;
    };
}
function getProcessFunc(provider, method, params) {
    let normalize = serialize;
    switch (method) {
        case "getBlockNumber":
            // Return the median value, unless there is (median + 1) is also
            // present, in which case that is probably true and the median
            // is going to be stale soon. In the event of a malicious node,
            // the lie will be true soon enough.
            return function (configs) {
                const values = configs.map((c) => c.result);
                // Get the median block number
                let blockNumber = median(configs.map((c) => c.result), 2);
                if (blockNumber == null) {
                    return undefined;
                }
                blockNumber = Math.ceil(blockNumber);
                // If the next block height is present, its prolly safe to use
                if (values.indexOf(blockNumber + 1) >= 0) {
                    blockNumber++;
                }
                // Don't ever roll back the blockNumber
                if (blockNumber >= provider._highestBlockNumber) {
                    provider._highestBlockNumber = blockNumber;
                }
                return provider._highestBlockNumber;
            };
        case "getGasPrice":
            // Return the middle (round index up) value, similar to median
            // but do not average even entries and choose the higher.
            // Malicious actors must compromise 50% of the nodes to lie.
            return function (configs) {
                const values = configs.map((c) => c.result);
                values.sort();
                return values[Math.floor(values.length / 2)];
            };
        case "getEtherPrice":
            // Returns the median price. Malicious actors must compromise at
            // least 50% of the nodes to lie (in a meaningful way).
            return function (configs) {
                return median(configs.map((c) => c.result));
            };
        // No additional normalizing required; serialize is enough
        case "getBalance":
        case "getTransactionCount":
        case "getCode":
        case "getStorageAt":
        case "call":
        case "estimateGas":
        case "getLogs":
            break;
        // We drop the confirmations from transactions as it is approximate
        case "getTransaction":
        case "getTransactionReceipt":
            normalize = function (tx) {
                if (tx == null) {
                    return null;
                }
                tx = Object(properties_lib_esm["g" /* shallowCopy */])(tx);
                tx.confirmations = -1;
                return serialize(tx);
            };
            break;
        // We drop the confirmations from transactions as it is approximate
        case "getBlock":
            // We drop the confirmations from transactions as it is approximate
            if (params.includeTransactions) {
                normalize = function (block) {
                    if (block == null) {
                        return null;
                    }
                    block = Object(properties_lib_esm["g" /* shallowCopy */])(block);
                    block.transactions = block.transactions.map((tx) => {
                        tx = Object(properties_lib_esm["g" /* shallowCopy */])(tx);
                        tx.confirmations = -1;
                        return tx;
                    });
                    return serialize(block);
                };
            }
            else {
                normalize = function (block) {
                    if (block == null) {
                        return null;
                    }
                    return serialize(block);
                };
            }
            break;
        default:
            throw new Error("unknown method: " + method);
    }
    // Return the result if and only if the expected quorum is
    // satisfied and agreed upon for the final result.
    return normalizedTally(normalize, provider.quorum);
}
// If we are doing a blockTag query, we need to make sure the backend is
// caught up to the FallbackProvider, before sending a request to it.
function waitForSync(config, blockNumber) {
    return fallback_provider_awaiter(this, void 0, void 0, function* () {
        const provider = (config.provider);
        if ((provider.blockNumber != null && provider.blockNumber >= blockNumber) || blockNumber === -1) {
            return provider;
        }
        return Object(web_lib_esm["b" /* poll */])(() => {
            return new Promise((resolve, reject) => {
                setTimeout(function () {
                    // We are synced
                    if (provider.blockNumber >= blockNumber) {
                        return resolve(provider);
                    }
                    // We're done; just quit
                    if (config.cancelled) {
                        return resolve(null);
                    }
                    // Try again, next block
                    return resolve(undefined);
                }, 0);
            });
        }, { oncePoll: provider });
    });
}
function getRunner(config, currentBlockNumber, method, params) {
    return fallback_provider_awaiter(this, void 0, void 0, function* () {
        let provider = config.provider;
        switch (method) {
            case "getBlockNumber":
            case "getGasPrice":
                return provider[method]();
            case "getEtherPrice":
                if (provider.getEtherPrice) {
                    return provider.getEtherPrice();
                }
                break;
            case "getBalance":
            case "getTransactionCount":
            case "getCode":
                if (params.blockTag && Object(bytes_lib_esm["isHexString"])(params.blockTag)) {
                    provider = yield waitForSync(config, currentBlockNumber);
                }
                return provider[method](params.address, params.blockTag || "latest");
            case "getStorageAt":
                if (params.blockTag && Object(bytes_lib_esm["isHexString"])(params.blockTag)) {
                    provider = yield waitForSync(config, currentBlockNumber);
                }
                return provider.getStorageAt(params.address, params.position, params.blockTag || "latest");
            case "getBlock":
                if (params.blockTag && Object(bytes_lib_esm["isHexString"])(params.blockTag)) {
                    provider = yield waitForSync(config, currentBlockNumber);
                }
                return provider[(params.includeTransactions ? "getBlockWithTransactions" : "getBlock")](params.blockTag || params.blockHash);
            case "call":
            case "estimateGas":
                if (params.blockTag && Object(bytes_lib_esm["isHexString"])(params.blockTag)) {
                    provider = yield waitForSync(config, currentBlockNumber);
                }
                return provider[method](params.transaction);
            case "getTransaction":
            case "getTransactionReceipt":
                return provider[method](params.transactionHash);
            case "getLogs": {
                let filter = params.filter;
                if ((filter.fromBlock && Object(bytes_lib_esm["isHexString"])(filter.fromBlock)) || (filter.toBlock && Object(bytes_lib_esm["isHexString"])(filter.toBlock))) {
                    provider = yield waitForSync(config, currentBlockNumber);
                }
                return provider.getLogs(filter);
            }
        }
        return fallback_provider_logger.throwError("unknown method error", logger_lib_esm["Logger"].errors.UNKNOWN_ERROR, {
            method: method,
            params: params
        });
    });
}
class fallback_provider_FallbackProvider extends base_provider["a" /* BaseProvider */] {
    constructor(providers, quorum) {
        fallback_provider_logger.checkNew(new.target, fallback_provider_FallbackProvider);
        if (providers.length === 0) {
            fallback_provider_logger.throwArgumentError("missing providers", "providers", providers);
        }
        const providerConfigs = providers.map((configOrProvider, index) => {
            if (lib_esm["b" /* Provider */].isProvider(configOrProvider)) {
                return Object.freeze({ provider: configOrProvider, weight: 1, stallTimeout: 750, priority: 1 });
            }
            const config = Object(properties_lib_esm["g" /* shallowCopy */])(configOrProvider);
            if (config.priority == null) {
                config.priority = 1;
            }
            if (config.stallTimeout == null) {
                config.stallTimeout = 750;
            }
            if (config.weight == null) {
                config.weight = 1;
            }
            const weight = config.weight;
            if (weight % 1 || weight > 512 || weight < 1) {
                fallback_provider_logger.throwArgumentError("invalid weight; must be integer in [1, 512]", `providers[${index}].weight`, weight);
            }
            return Object.freeze(config);
        });
        const total = providerConfigs.reduce((accum, c) => (accum + c.weight), 0);
        if (quorum == null) {
            quorum = total / 2;
        }
        else if (quorum > total) {
            fallback_provider_logger.throwArgumentError("quorum will always fail; larger than total weight", "quorum", quorum);
        }
        // Are all providers' networks are known
        let networkOrReady = checkNetworks(providerConfigs.map((c) => (c.provider).network));
        // Not all networks are known; we must stall
        if (networkOrReady == null) {
            networkOrReady = new Promise((resolve, reject) => {
                setTimeout(() => {
                    this.detectNetwork().then(resolve, reject);
                }, 0);
            });
        }
        super(networkOrReady);
        // Preserve a copy, so we do not get mutated
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "providerConfigs", Object.freeze(providerConfigs));
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "quorum", quorum);
        this._highestBlockNumber = -1;
    }
    detectNetwork() {
        return fallback_provider_awaiter(this, void 0, void 0, function* () {
            const networks = yield Promise.all(this.providerConfigs.map((c) => c.provider.getNetwork()));
            return checkNetworks(networks);
        });
    }
    perform(method, params) {
        return fallback_provider_awaiter(this, void 0, void 0, function* () {
            // Sending transactions is special; always broadcast it to all backends
            if (method === "sendTransaction") {
                const results = yield Promise.all(this.providerConfigs.map((c) => {
                    return c.provider.sendTransaction(params.signedTransaction).then((result) => {
                        return result.hash;
                    }, (error) => {
                        return error;
                    });
                }));
                // Any success is good enough (other errors are likely "already seen" errors
                for (let i = 0; i < results.length; i++) {
                    const result = results[i];
                    if (typeof (result) === "string") {
                        return result;
                    }
                }
                // They were all an error; pick the first error
                throw results[0];
            }
            // We need to make sure we are in sync with our backends, so we need
            // to know this before we can make a lot of calls
            if (this._highestBlockNumber === -1 && method !== "getBlockNumber") {
                yield this.getBlockNumber();
            }
            const processFunc = getProcessFunc(this, method, params);
            // Shuffle the providers and then sort them by their priority; we
            // shallowCopy them since we will store the result in them too
            const configs = Object(browser["shuffled"])(this.providerConfigs.map(properties_lib_esm["g" /* shallowCopy */]));
            configs.sort((a, b) => (a.priority - b.priority));
            const currentBlockNumber = this._highestBlockNumber;
            let i = 0;
            let first = true;
            while (true) {
                const t0 = now();
                // Compute the inflight weight (exclude anything past)
                let inflightWeight = configs.filter((c) => (c.runner && ((t0 - c.start) < c.stallTimeout)))
                    .reduce((accum, c) => (accum + c.weight), 0);
                // Start running enough to meet quorum
                while (inflightWeight < this.quorum && i < configs.length) {
                    const config = configs[i++];
                    const rid = nextRid++;
                    config.start = now();
                    config.staller = stall(config.stallTimeout);
                    config.staller.wait(() => { config.staller = null; });
                    config.runner = getRunner(config, currentBlockNumber, method, params).then((result) => {
                        config.done = true;
                        config.result = result;
                        if (this.listenerCount("debug")) {
                            this.emit("debug", {
                                action: "request",
                                rid: rid,
                                backend: exposeDebugConfig(config, now()),
                                request: { method: method, params: Object(properties_lib_esm["c" /* deepCopy */])(params) },
                                provider: this
                            });
                        }
                    }, (error) => {
                        config.done = true;
                        config.error = error;
                        if (this.listenerCount("debug")) {
                            this.emit("debug", {
                                action: "request",
                                rid: rid,
                                backend: exposeDebugConfig(config, now()),
                                request: { method: method, params: Object(properties_lib_esm["c" /* deepCopy */])(params) },
                                provider: this
                            });
                        }
                    });
                    if (this.listenerCount("debug")) {
                        this.emit("debug", {
                            action: "request",
                            rid: rid,
                            backend: exposeDebugConfig(config, null),
                            request: { method: method, params: Object(properties_lib_esm["c" /* deepCopy */])(params) },
                            provider: this
                        });
                    }
                    inflightWeight += config.weight;
                }
                // Wait for anything meaningful to finish or stall out
                const waiting = [];
                configs.forEach((c) => {
                    if (c.done || !c.runner) {
                        return;
                    }
                    waiting.push(c.runner);
                    if (c.staller) {
                        waiting.push(c.staller.getPromise());
                    }
                });
                if (waiting.length) {
                    yield Promise.race(waiting);
                }
                // Check the quorum and process the results; the process function
                // may additionally decide the quorum is not met
                const results = configs.filter((c) => (c.done && c.error == null));
                if (results.length >= this.quorum) {
                    const result = processFunc(results);
                    if (result !== undefined) {
                        // Shut down any stallers
                        configs.forEach(c => {
                            if (c.staller) {
                                c.staller.cancel();
                            }
                            c.cancelled = true;
                        });
                        return result;
                    }
                    if (!first) {
                        yield stall(100).getPromise();
                    }
                    first = false;
                }
                // No result, check for errors that should be forwarded
                const errors = configs.reduce((accum, c) => {
                    if (!c.done || c.error == null) {
                        return accum;
                    }
                    const code = (c.error).code;
                    if (ForwardErrors.indexOf(code) >= 0) {
                        if (!accum[code]) {
                            accum[code] = { error: c.error, weight: 0 };
                        }
                        accum[code].weight += c.weight;
                    }
                    return accum;
                }, ({}));
                Object.keys(errors).forEach((errorCode) => {
                    const tally = errors[errorCode];
                    if (tally.weight < this.quorum) {
                        return;
                    }
                    // Shut down any stallers
                    configs.forEach(c => {
                        if (c.staller) {
                            c.staller.cancel();
                        }
                        c.cancelled = true;
                    });
                    const e = (tally.error);
                    const props = {};
                    ForwardProperties.forEach((name) => {
                        if (e[name] == null) {
                            return;
                        }
                        props[name] = e[name];
                    });
                    fallback_provider_logger.throwError(e.reason || e.message, errorCode, props);
                });
                // All configs have run to completion; we will never get more data
                if (configs.filter((c) => !c.done).length === 0) {
                    break;
                }
            }
            // Shut down any stallers; shouldn't be any
            configs.forEach(c => {
                if (c.staller) {
                    c.staller.cancel();
                }
                c.cancelled = true;
            });
            return fallback_provider_logger.throwError("failed to meet quorum", logger_lib_esm["Logger"].errors.SERVER_ERROR, {
                method: method,
                params: params,
                //results: configs.map((c) => c.result),
                //errors: configs.map((c) => c.error),
                results: configs.map((c) => exposeDebugConfig(c)),
                provider: this
            });
        });
    }
}
//# sourceMappingURL=fallback-provider.js.map
// EXTERNAL MODULE: ./node_modules/@ethersproject/providers/lib.esm/ipc-provider.js
var ipc_provider = __webpack_require__(620);

// CONCATENATED MODULE: ./node_modules/@ethersproject/providers/lib.esm/infura-provider.js





const infura_provider_logger = new logger_lib_esm["Logger"](_version["a" /* version */]);

const defaultProjectId = "84842078b09946638c03157f83405213";
class infura_provider_InfuraProvider extends url_json_rpc_provider_UrlJsonRpcProvider {
    static getWebSocketProvider(network, apiKey) {
        const provider = new infura_provider_InfuraProvider(network, apiKey);
        const connection = provider.connection;
        if (connection.password) {
            infura_provider_logger.throwError("INFURA WebSocket project secrets unsupported", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "InfuraProvider.getWebSocketProvider()"
            });
        }
        const url = connection.url.replace(/^http/i, "ws").replace("/v3/", "/ws/v3/");
        return new websocket_provider_WebSocketProvider(url, network);
    }
    static getApiKey(apiKey) {
        const apiKeyObj = {
            apiKey: defaultProjectId,
            projectId: defaultProjectId,
            projectSecret: null
        };
        if (apiKey == null) {
            return apiKeyObj;
        }
        if (typeof (apiKey) === "string") {
            apiKeyObj.projectId = apiKey;
        }
        else if (apiKey.projectSecret != null) {
            infura_provider_logger.assertArgument((typeof (apiKey.projectId) === "string"), "projectSecret requires a projectId", "projectId", apiKey.projectId);
            infura_provider_logger.assertArgument((typeof (apiKey.projectSecret) === "string"), "invalid projectSecret", "projectSecret", "[REDACTED]");
            apiKeyObj.projectId = apiKey.projectId;
            apiKeyObj.projectSecret = apiKey.projectSecret;
        }
        else if (apiKey.projectId) {
            apiKeyObj.projectId = apiKey.projectId;
        }
        apiKeyObj.apiKey = apiKeyObj.projectId;
        return apiKeyObj;
    }
    static getUrl(network, apiKey) {
        let host = null;
        switch (network ? network.name : "unknown") {
            case "homestead":
                host = "mainnet.infura.io";
                break;
            case "ropsten":
                host = "ropsten.infura.io";
                break;
            case "rinkeby":
                host = "rinkeby.infura.io";
                break;
            case "kovan":
                host = "kovan.infura.io";
                break;
            case "goerli":
                host = "goerli.infura.io";
                break;
            default:
                infura_provider_logger.throwError("unsupported network", logger_lib_esm["Logger"].errors.INVALID_ARGUMENT, {
                    argument: "network",
                    value: network
                });
        }
        const connection = {
            url: ("https:/" + "/" + host + "/v3/" + apiKey.projectId),
            throttleCallback: (attempt, url) => {
                if (apiKey.projectId === defaultProjectId) {
                    Object(formatter["b" /* showThrottleMessage */])();
                }
                return Promise.resolve(true);
            }
        };
        if (apiKey.projectSecret != null) {
            connection.user = "";
            connection.password = apiKey.projectSecret;
        }
        return connection;
    }
}
//# sourceMappingURL=infura-provider.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/providers/lib.esm/nodesmith-provider.js
/* istanbul ignore file */




const nodesmith_provider_logger = new logger_lib_esm["Logger"](_version["a" /* version */]);
// Special API key provided by Nodesmith for ethers.js
const nodesmith_provider_defaultApiKey = "ETHERS_JS_SHARED";
class nodesmith_provider_NodesmithProvider extends url_json_rpc_provider_UrlJsonRpcProvider {
    static getApiKey(apiKey) {
        if (apiKey && typeof (apiKey) !== "string") {
            nodesmith_provider_logger.throwArgumentError("invalid apiKey", "apiKey", apiKey);
        }
        return apiKey || nodesmith_provider_defaultApiKey;
    }
    static getUrl(network, apiKey) {
        nodesmith_provider_logger.warn("NodeSmith will be discontinued on 2019-12-20; please migrate to another platform.");
        let host = null;
        switch (network.name) {
            case "homestead":
                host = "https://ethereum.api.nodesmith.io/v1/mainnet/jsonrpc";
                break;
            case "ropsten":
                host = "https://ethereum.api.nodesmith.io/v1/ropsten/jsonrpc";
                break;
            case "rinkeby":
                host = "https://ethereum.api.nodesmith.io/v1/rinkeby/jsonrpc";
                break;
            case "goerli":
                host = "https://ethereum.api.nodesmith.io/v1/goerli/jsonrpc";
                break;
            case "kovan":
                host = "https://ethereum.api.nodesmith.io/v1/kovan/jsonrpc";
                break;
            default:
                nodesmith_provider_logger.throwArgumentError("unsupported network", "network", arguments[0]);
        }
        return (host + "?apiKey=" + apiKey);
    }
}
//# sourceMappingURL=nodesmith-provider.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/providers/lib.esm/web3-provider.js




const web3_provider_logger = new logger_lib_esm["Logger"](_version["a" /* version */]);

let _nextId = 1;
function buildWeb3LegacyFetcher(provider, sendFunc) {
    return function (method, params) {
        // Metamask complains about eth_sign (and on some versions hangs)
        if (method == "eth_sign" && provider.isMetaMask) {
            // https://github.com/ethereum/go-ethereum/wiki/Management-APIs#personal_sign
            method = "personal_sign";
            params = [params[1], params[0]];
        }
        const request = {
            method: method,
            params: params,
            id: (_nextId++),
            jsonrpc: "2.0"
        };
        return new Promise((resolve, reject) => {
            sendFunc(request, function (error, result) {
                if (error) {
                    return reject(error);
                }
                if (result.error) {
                    const error = new Error(result.error.message);
                    error.code = result.error.code;
                    error.data = result.error.data;
                    return reject(error);
                }
                resolve(result.result);
            });
        });
    };
}
function buildEip1193Fetcher(provider) {
    return function (method, params) {
        if (params == null) {
            params = [];
        }
        // Metamask complains about eth_sign (and on some versions hangs)
        if (method == "eth_sign" && provider.isMetaMask) {
            // https://github.com/ethereum/go-ethereum/wiki/Management-APIs#personal_sign
            method = "personal_sign";
            params = [params[1], params[0]];
        }
        return provider.request({ method, params });
    };
}
class web3_provider_Web3Provider extends json_rpc_provider["a" /* JsonRpcProvider */] {
    constructor(provider, network) {
        web3_provider_logger.checkNew(new.target, web3_provider_Web3Provider);
        if (provider == null) {
            web3_provider_logger.throwArgumentError("missing provider", "provider", provider);
        }
        let path = null;
        let jsonRpcFetchFunc = null;
        let subprovider = null;
        if (typeof (provider) === "function") {
            path = "unknown:";
            jsonRpcFetchFunc = provider;
        }
        else {
            path = provider.host || provider.path || "";
            if (!path && provider.isMetaMask) {
                path = "metamask";
            }
            subprovider = provider;
            if (provider.request) {
                if (path === "") {
                    path = "eip-1193:";
                }
                jsonRpcFetchFunc = buildEip1193Fetcher(provider);
            }
            else if (provider.sendAsync) {
                jsonRpcFetchFunc = buildWeb3LegacyFetcher(provider, provider.sendAsync.bind(provider));
            }
            else if (provider.send) {
                jsonRpcFetchFunc = buildWeb3LegacyFetcher(provider, provider.send.bind(provider));
            }
            else {
                web3_provider_logger.throwArgumentError("unsupported provider", "provider", provider);
            }
            if (!path) {
                path = "unknown:";
            }
        }
        super(path, network);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "jsonRpcFetchFunc", jsonRpcFetchFunc);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "provider", subprovider);
    }
    send(method, params) {
        return this.jsonRpcFetchFunc(method, params);
    }
}
//# sourceMappingURL=web3-provider.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/providers/lib.esm/index.js


















const lib_esm_logger = new logger_lib_esm["Logger"](_version["a" /* version */]);
////////////////////////
// Helper Functions
function getDefaultProvider(network, options) {
    if (network == null) {
        network = "homestead";
    }
    // If passed a URL, figure out the right type of provider based on the scheme
    if (typeof (network) === "string") {
        // @TODO: Add support for IpcProvider; maybe if it ends in ".ipc"?
        // Handle http and ws (and their secure variants)
        const match = network.match(/^(ws|http)s?:/i);
        if (match) {
            switch (match[1]) {
                case "http":
                    return new json_rpc_provider["a" /* JsonRpcProvider */](network);
                case "ws":
                    return new websocket_provider_WebSocketProvider(network);
                default:
                    lib_esm_logger.throwArgumentError("unsupported URL scheme", "network", network);
            }
        }
    }
    const n = Object(networks_lib_esm["a" /* getNetwork */])(network);
    if (!n || !n._defaultProvider) {
        lib_esm_logger.throwError("unsupported getDefaultProvider network", logger_lib_esm["Logger"].errors.NETWORK_ERROR, {
            operation: "getDefaultProvider",
            network: network
        });
    }
    return n._defaultProvider({
        FallbackProvider: fallback_provider_FallbackProvider,
        AlchemyProvider: alchemy_provider_AlchemyProvider,
        CloudflareProvider: cloudflare_provider_CloudflareProvider,
        EtherscanProvider: etherscan_provider_EtherscanProvider,
        InfuraProvider: infura_provider_InfuraProvider,
        JsonRpcProvider: json_rpc_provider["a" /* JsonRpcProvider */],
        NodesmithProvider: nodesmith_provider_NodesmithProvider,
        Web3Provider: web3_provider_Web3Provider,
        IpcProvider: ipc_provider["a" /* IpcProvider */],
    }, options);
}
////////////////////////
// Exports

//# sourceMappingURL=index.js.map

/***/ }),

/***/ 7:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "d", function() { return /* binding */ defineReadOnly; });
__webpack_require__.d(__webpack_exports__, "e", function() { return /* binding */ getStatic; });
__webpack_require__.d(__webpack_exports__, "f", function() { return /* binding */ resolveProperties; });
__webpack_require__.d(__webpack_exports__, "b", function() { return /* binding */ checkProperties; });
__webpack_require__.d(__webpack_exports__, "g", function() { return /* binding */ shallowCopy; });
__webpack_require__.d(__webpack_exports__, "c", function() { return /* binding */ deepCopy; });
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ Description; });

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/properties/lib.esm/_version.js
const version = "properties/5.0.3";
//# sourceMappingURL=_version.js.map
// CONCATENATED MODULE: ./node_modules/@ethersproject/properties/lib.esm/index.js

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


const logger = new lib_esm["Logger"](version);
function defineReadOnly(object, name, value) {
    Object.defineProperty(object, name, {
        enumerable: true,
        value: value,
        writable: false,
    });
}
// Crawl up the constructor chain to find a static method
function getStatic(ctor, key) {
    for (let i = 0; i < 32; i++) {
        if (ctor[key]) {
            return ctor[key];
        }
        if (!ctor.prototype || typeof (ctor.prototype) !== "object") {
            break;
        }
        ctor = Object.getPrototypeOf(ctor.prototype).constructor;
    }
    return null;
}
function resolveProperties(object) {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = Object.keys(object).map((key) => {
            const value = object[key];
            return Promise.resolve(value).then((v) => ({ key: key, value: v }));
        });
        const results = yield Promise.all(promises);
        return results.reduce((accum, result) => {
            accum[(result.key)] = result.value;
            return accum;
        }, {});
    });
}
function checkProperties(object, properties) {
    if (!object || typeof (object) !== "object") {
        logger.throwArgumentError("invalid object", "object", object);
    }
    Object.keys(object).forEach((key) => {
        if (!properties[key]) {
            logger.throwArgumentError("invalid object key - " + key, "transaction:" + key, object);
        }
    });
}
function shallowCopy(object) {
    const result = {};
    for (const key in object) {
        result[key] = object[key];
    }
    return result;
}
const opaque = { bigint: true, boolean: true, "function": true, number: true, string: true };
function _isFrozen(object) {
    // Opaque objects are not mutable, so safe to copy by assignment
    if (object === undefined || object === null || opaque[typeof (object)]) {
        return true;
    }
    if (Array.isArray(object) || typeof (object) === "object") {
        if (!Object.isFrozen(object)) {
            return false;
        }
        const keys = Object.keys(object);
        for (let i = 0; i < keys.length; i++) {
            if (!_isFrozen(object[keys[i]])) {
                return false;
            }
        }
        return true;
    }
    return logger.throwArgumentError(`Cannot deepCopy ${typeof (object)}`, "object", object);
}
// Returns a new copy of object, such that no properties may be replaced.
// New properties may be added only to objects.
function _deepCopy(object) {
    if (_isFrozen(object)) {
        return object;
    }
    // Arrays are mutable, so we need to create a copy
    if (Array.isArray(object)) {
        return Object.freeze(object.map((item) => deepCopy(item)));
    }
    if (typeof (object) === "object") {
        const result = {};
        for (const key in object) {
            const value = object[key];
            if (value === undefined) {
                continue;
            }
            defineReadOnly(result, key, deepCopy(value));
        }
        return result;
    }
    return logger.throwArgumentError(`Cannot deepCopy ${typeof (object)}`, "object", object);
}
function deepCopy(object) {
    return _deepCopy(object);
}
class Description {
    constructor(info) {
        for (const key in info) {
            this[key] = deepCopy(info[key]);
        }
    }
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 772:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(233);
var rotr32 = utils.rotr32;

function ft_1(s, x, y, z) {
  if (s === 0)
    return ch32(x, y, z);
  if (s === 1 || s === 3)
    return p32(x, y, z);
  if (s === 2)
    return maj32(x, y, z);
}
exports.ft_1 = ft_1;

function ch32(x, y, z) {
  return (x & y) ^ ((~x) & z);
}
exports.ch32 = ch32;

function maj32(x, y, z) {
  return (x & y) ^ (x & z) ^ (y & z);
}
exports.maj32 = maj32;

function p32(x, y, z) {
  return x ^ y ^ z;
}
exports.p32 = p32;

function s0_256(x) {
  return rotr32(x, 2) ^ rotr32(x, 13) ^ rotr32(x, 22);
}
exports.s0_256 = s0_256;

function s1_256(x) {
  return rotr32(x, 6) ^ rotr32(x, 11) ^ rotr32(x, 25);
}
exports.s1_256 = s1_256;

function g0_256(x) {
  return rotr32(x, 7) ^ rotr32(x, 18) ^ (x >>> 3);
}
exports.g0_256 = g0_256;

function g1_256(x) {
  return rotr32(x, 17) ^ rotr32(x, 19) ^ (x >>> 10);
}
exports.g1_256 = g1_256;


/***/ }),

/***/ 773:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(233);
var common = __webpack_require__(410);
var shaCommon = __webpack_require__(772);
var assert = __webpack_require__(159);

var sum32 = utils.sum32;
var sum32_4 = utils.sum32_4;
var sum32_5 = utils.sum32_5;
var ch32 = shaCommon.ch32;
var maj32 = shaCommon.maj32;
var s0_256 = shaCommon.s0_256;
var s1_256 = shaCommon.s1_256;
var g0_256 = shaCommon.g0_256;
var g1_256 = shaCommon.g1_256;

var BlockHash = common.BlockHash;

var sha256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function SHA256() {
  if (!(this instanceof SHA256))
    return new SHA256();

  BlockHash.call(this);
  this.h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  this.k = sha256_K;
  this.W = new Array(64);
}
utils.inherits(SHA256, BlockHash);
module.exports = SHA256;

SHA256.blockSize = 512;
SHA256.outSize = 256;
SHA256.hmacStrength = 192;
SHA256.padLength = 64;

SHA256.prototype._update = function _update(msg, start) {
  var W = this.W;

  for (var i = 0; i < 16; i++)
    W[i] = msg[start + i];
  for (; i < W.length; i++)
    W[i] = sum32_4(g1_256(W[i - 2]), W[i - 7], g0_256(W[i - 15]), W[i - 16]);

  var a = this.h[0];
  var b = this.h[1];
  var c = this.h[2];
  var d = this.h[3];
  var e = this.h[4];
  var f = this.h[5];
  var g = this.h[6];
  var h = this.h[7];

  assert(this.k.length === W.length);
  for (i = 0; i < W.length; i++) {
    var T1 = sum32_5(h, s1_256(e), ch32(e, f, g), this.k[i], W[i]);
    var T2 = sum32(s0_256(a), maj32(a, b, c));
    h = g;
    g = f;
    f = e;
    e = sum32(d, T1);
    d = c;
    c = b;
    b = a;
    a = sum32(T1, T2);
  }

  this.h[0] = sum32(this.h[0], a);
  this.h[1] = sum32(this.h[1], b);
  this.h[2] = sum32(this.h[2], c);
  this.h[3] = sum32(this.h[3], d);
  this.h[4] = sum32(this.h[4], e);
  this.h[5] = sum32(this.h[5], f);
  this.h[6] = sum32(this.h[6], g);
  this.h[7] = sum32(this.h[7], h);
};

SHA256.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};


/***/ }),

/***/ 774:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(233);
var common = __webpack_require__(410);
var assert = __webpack_require__(159);

var rotr64_hi = utils.rotr64_hi;
var rotr64_lo = utils.rotr64_lo;
var shr64_hi = utils.shr64_hi;
var shr64_lo = utils.shr64_lo;
var sum64 = utils.sum64;
var sum64_hi = utils.sum64_hi;
var sum64_lo = utils.sum64_lo;
var sum64_4_hi = utils.sum64_4_hi;
var sum64_4_lo = utils.sum64_4_lo;
var sum64_5_hi = utils.sum64_5_hi;
var sum64_5_lo = utils.sum64_5_lo;

var BlockHash = common.BlockHash;

var sha512_K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
];

function SHA512() {
  if (!(this instanceof SHA512))
    return new SHA512();

  BlockHash.call(this);
  this.h = [
    0x6a09e667, 0xf3bcc908,
    0xbb67ae85, 0x84caa73b,
    0x3c6ef372, 0xfe94f82b,
    0xa54ff53a, 0x5f1d36f1,
    0x510e527f, 0xade682d1,
    0x9b05688c, 0x2b3e6c1f,
    0x1f83d9ab, 0xfb41bd6b,
    0x5be0cd19, 0x137e2179 ];
  this.k = sha512_K;
  this.W = new Array(160);
}
utils.inherits(SHA512, BlockHash);
module.exports = SHA512;

SHA512.blockSize = 1024;
SHA512.outSize = 512;
SHA512.hmacStrength = 192;
SHA512.padLength = 128;

SHA512.prototype._prepareBlock = function _prepareBlock(msg, start) {
  var W = this.W;

  // 32 x 32bit words
  for (var i = 0; i < 32; i++)
    W[i] = msg[start + i];
  for (; i < W.length; i += 2) {
    var c0_hi = g1_512_hi(W[i - 4], W[i - 3]);  // i - 2
    var c0_lo = g1_512_lo(W[i - 4], W[i - 3]);
    var c1_hi = W[i - 14];  // i - 7
    var c1_lo = W[i - 13];
    var c2_hi = g0_512_hi(W[i - 30], W[i - 29]);  // i - 15
    var c2_lo = g0_512_lo(W[i - 30], W[i - 29]);
    var c3_hi = W[i - 32];  // i - 16
    var c3_lo = W[i - 31];

    W[i] = sum64_4_hi(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo);
    W[i + 1] = sum64_4_lo(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo);
  }
};

SHA512.prototype._update = function _update(msg, start) {
  this._prepareBlock(msg, start);

  var W = this.W;

  var ah = this.h[0];
  var al = this.h[1];
  var bh = this.h[2];
  var bl = this.h[3];
  var ch = this.h[4];
  var cl = this.h[5];
  var dh = this.h[6];
  var dl = this.h[7];
  var eh = this.h[8];
  var el = this.h[9];
  var fh = this.h[10];
  var fl = this.h[11];
  var gh = this.h[12];
  var gl = this.h[13];
  var hh = this.h[14];
  var hl = this.h[15];

  assert(this.k.length === W.length);
  for (var i = 0; i < W.length; i += 2) {
    var c0_hi = hh;
    var c0_lo = hl;
    var c1_hi = s1_512_hi(eh, el);
    var c1_lo = s1_512_lo(eh, el);
    var c2_hi = ch64_hi(eh, el, fh, fl, gh, gl);
    var c2_lo = ch64_lo(eh, el, fh, fl, gh, gl);
    var c3_hi = this.k[i];
    var c3_lo = this.k[i + 1];
    var c4_hi = W[i];
    var c4_lo = W[i + 1];

    var T1_hi = sum64_5_hi(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo,
      c4_hi, c4_lo);
    var T1_lo = sum64_5_lo(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo,
      c4_hi, c4_lo);

    c0_hi = s0_512_hi(ah, al);
    c0_lo = s0_512_lo(ah, al);
    c1_hi = maj64_hi(ah, al, bh, bl, ch, cl);
    c1_lo = maj64_lo(ah, al, bh, bl, ch, cl);

    var T2_hi = sum64_hi(c0_hi, c0_lo, c1_hi, c1_lo);
    var T2_lo = sum64_lo(c0_hi, c0_lo, c1_hi, c1_lo);

    hh = gh;
    hl = gl;

    gh = fh;
    gl = fl;

    fh = eh;
    fl = el;

    eh = sum64_hi(dh, dl, T1_hi, T1_lo);
    el = sum64_lo(dl, dl, T1_hi, T1_lo);

    dh = ch;
    dl = cl;

    ch = bh;
    cl = bl;

    bh = ah;
    bl = al;

    ah = sum64_hi(T1_hi, T1_lo, T2_hi, T2_lo);
    al = sum64_lo(T1_hi, T1_lo, T2_hi, T2_lo);
  }

  sum64(this.h, 0, ah, al);
  sum64(this.h, 2, bh, bl);
  sum64(this.h, 4, ch, cl);
  sum64(this.h, 6, dh, dl);
  sum64(this.h, 8, eh, el);
  sum64(this.h, 10, fh, fl);
  sum64(this.h, 12, gh, gl);
  sum64(this.h, 14, hh, hl);
};

SHA512.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};

function ch64_hi(xh, xl, yh, yl, zh) {
  var r = (xh & yh) ^ ((~xh) & zh);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function ch64_lo(xh, xl, yh, yl, zh, zl) {
  var r = (xl & yl) ^ ((~xl) & zl);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function maj64_hi(xh, xl, yh, yl, zh) {
  var r = (xh & yh) ^ (xh & zh) ^ (yh & zh);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function maj64_lo(xh, xl, yh, yl, zh, zl) {
  var r = (xl & yl) ^ (xl & zl) ^ (yl & zl);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s0_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 28);
  var c1_hi = rotr64_hi(xl, xh, 2);  // 34
  var c2_hi = rotr64_hi(xl, xh, 7);  // 39

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s0_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 28);
  var c1_lo = rotr64_lo(xl, xh, 2);  // 34
  var c2_lo = rotr64_lo(xl, xh, 7);  // 39

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s1_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 14);
  var c1_hi = rotr64_hi(xh, xl, 18);
  var c2_hi = rotr64_hi(xl, xh, 9);  // 41

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s1_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 14);
  var c1_lo = rotr64_lo(xh, xl, 18);
  var c2_lo = rotr64_lo(xl, xh, 9);  // 41

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g0_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 1);
  var c1_hi = rotr64_hi(xh, xl, 8);
  var c2_hi = shr64_hi(xh, xl, 7);

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g0_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 1);
  var c1_lo = rotr64_lo(xh, xl, 8);
  var c2_lo = shr64_lo(xh, xl, 7);

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g1_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 19);
  var c1_hi = rotr64_hi(xl, xh, 29);  // 61
  var c2_hi = shr64_hi(xh, xl, 6);

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g1_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 19);
  var c1_lo = rotr64_lo(xl, xh, 29);  // 61
  var c2_lo = shr64_lo(xh, xl, 6);

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}


/***/ }),

/***/ 804:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "ConstructorFragment", function() { return /* reexport */ fragments_ConstructorFragment; });
__webpack_require__.d(__webpack_exports__, "EventFragment", function() { return /* reexport */ EventFragment; });
__webpack_require__.d(__webpack_exports__, "Fragment", function() { return /* reexport */ fragments_Fragment; });
__webpack_require__.d(__webpack_exports__, "FunctionFragment", function() { return /* reexport */ fragments_FunctionFragment; });
__webpack_require__.d(__webpack_exports__, "ParamType", function() { return /* reexport */ fragments_ParamType; });
__webpack_require__.d(__webpack_exports__, "FormatTypes", function() { return /* reexport */ FormatTypes; });
__webpack_require__.d(__webpack_exports__, "AbiCoder", function() { return /* reexport */ abi_coder_AbiCoder; });
__webpack_require__.d(__webpack_exports__, "defaultAbiCoder", function() { return /* reexport */ defaultAbiCoder; });
__webpack_require__.d(__webpack_exports__, "Interface", function() { return /* reexport */ interface_Interface; });
__webpack_require__.d(__webpack_exports__, "Indexed", function() { return /* reexport */ interface_Indexed; });
__webpack_require__.d(__webpack_exports__, "checkResultErrors", function() { return /* reexport */ checkResultErrors; });
__webpack_require__.d(__webpack_exports__, "LogDescription", function() { return /* reexport */ interface_LogDescription; });
__webpack_require__.d(__webpack_exports__, "TransactionDescription", function() { return /* reexport */ interface_TransactionDescription; });

// EXTERNAL MODULE: ./node_modules/@ethersproject/bignumber/lib.esm/index.js + 3 modules
var lib_esm = __webpack_require__(43);

// EXTERNAL MODULE: ./node_modules/@ethersproject/properties/lib.esm/index.js + 1 modules
var properties_lib_esm = __webpack_require__(7);

// EXTERNAL MODULE: ./node_modules/@ethersproject/logger/lib.esm/index.js + 1 modules
var logger_lib_esm = __webpack_require__(11);

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/_version.js
const version = "abi/5.0.0-beta.153";

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/fragments.js





const logger = new logger_lib_esm["Logger"](version);
;
const _constructorGuard = {};
let ModifiersBytes = { calldata: true, memory: true, storage: true };
let ModifiersNest = { calldata: true, memory: true };
function checkModifier(type, name) {
    if (type === "bytes" || type === "string") {
        if (ModifiersBytes[name]) {
            return true;
        }
    }
    else if (type === "address") {
        if (name === "payable") {
            return true;
        }
    }
    else if (type.indexOf("[") >= 0 || type === "tuple") {
        if (ModifiersNest[name]) {
            return true;
        }
    }
    if (ModifiersBytes[name] || name === "payable") {
        logger.throwArgumentError("invalid modifier", "name", name);
    }
    return false;
}
// @TODO: Make sure that children of an indexed tuple are marked with a null indexed
function parseParamType(param, allowIndexed) {
    let originalParam = param;
    function throwError(i) {
        logger.throwArgumentError(`unexpected character at position ${i}`, "param", param);
    }
    param = param.replace(/\s/g, " ");
    function newNode(parent) {
        let node = { type: "", name: "", parent: parent, state: { allowType: true } };
        if (allowIndexed) {
            node.indexed = false;
        }
        return node;
    }
    let parent = { type: "", name: "", state: { allowType: true } };
    let node = parent;
    for (let i = 0; i < param.length; i++) {
        let c = param[i];
        switch (c) {
            case "(":
                if (node.state.allowType && node.type === "") {
                    node.type = "tuple";
                }
                else if (!node.state.allowParams) {
                    throwError(i);
                }
                node.state.allowType = false;
                node.type = verifyType(node.type);
                node.components = [newNode(node)];
                node = node.components[0];
                break;
            case ")":
                delete node.state;
                if (node.name === "indexed") {
                    if (!allowIndexed) {
                        throwError(i);
                    }
                    node.indexed = true;
                    node.name = "";
                }
                if (checkModifier(node.type, node.name)) {
                    node.name = "";
                }
                node.type = verifyType(node.type);
                let child = node;
                node = node.parent;
                if (!node) {
                    throwError(i);
                }
                delete child.parent;
                node.state.allowParams = false;
                node.state.allowName = true;
                node.state.allowArray = true;
                break;
            case ",":
                delete node.state;
                if (node.name === "indexed") {
                    if (!allowIndexed) {
                        throwError(i);
                    }
                    node.indexed = true;
                    node.name = "";
                }
                if (checkModifier(node.type, node.name)) {
                    node.name = "";
                }
                node.type = verifyType(node.type);
                let sibling = newNode(node.parent);
                //{ type: "", name: "", parent: node.parent, state: { allowType: true } };
                node.parent.components.push(sibling);
                delete node.parent;
                node = sibling;
                break;
            // Hit a space...
            case " ":
                // If reading type, the type is done and may read a param or name
                if (node.state.allowType) {
                    if (node.type !== "") {
                        node.type = verifyType(node.type);
                        delete node.state.allowType;
                        node.state.allowName = true;
                        node.state.allowParams = true;
                    }
                }
                // If reading name, the name is done
                if (node.state.allowName) {
                    if (node.name !== "") {
                        if (node.name === "indexed") {
                            if (!allowIndexed) {
                                throwError(i);
                            }
                            if (node.indexed) {
                                throwError(i);
                            }
                            node.indexed = true;
                            node.name = "";
                        }
                        else if (checkModifier(node.type, node.name)) {
                            node.name = "";
                        }
                        else {
                            node.state.allowName = false;
                        }
                    }
                }
                break;
            case "[":
                if (!node.state.allowArray) {
                    throwError(i);
                }
                node.type += c;
                node.state.allowArray = false;
                node.state.allowName = false;
                node.state.readArray = true;
                break;
            case "]":
                if (!node.state.readArray) {
                    throwError(i);
                }
                node.type += c;
                node.state.readArray = false;
                node.state.allowArray = true;
                node.state.allowName = true;
                break;
            default:
                if (node.state.allowType) {
                    node.type += c;
                    node.state.allowParams = true;
                    node.state.allowArray = true;
                }
                else if (node.state.allowName) {
                    node.name += c;
                    delete node.state.allowArray;
                }
                else if (node.state.readArray) {
                    node.type += c;
                }
                else {
                    throwError(i);
                }
        }
    }
    if (node.parent) {
        logger.throwArgumentError("unexpected eof", "param", param);
    }
    delete parent.state;
    if (node.name === "indexed") {
        if (!allowIndexed) {
            throwError(originalParam.length - 7);
        }
        if (node.indexed) {
            throwError(originalParam.length - 7);
        }
        node.indexed = true;
        node.name = "";
    }
    else if (checkModifier(node.type, node.name)) {
        node.name = "";
    }
    parent.type = verifyType(parent.type);
    return parent;
}
function populate(object, params) {
    for (let key in params) {
        Object(properties_lib_esm["d" /* defineReadOnly */])(object, key, params[key]);
    }
}
const FormatTypes = Object.freeze({
    // Bare formatting, as is needed for computing a sighash of an event or function
    sighash: "sighash",
    // Human-Readable with Minimal spacing and without names (compact human-readable)
    minimal: "minimal",
    // Human-Readble with nice spacing, including all names
    full: "full",
    // JSON-format a la Solidity
    json: "json"
});
const paramTypeArray = new RegExp(/^(.*)\[([0-9]*)\]$/);
class fragments_ParamType {
    constructor(constructorGuard, params) {
        if (constructorGuard !== _constructorGuard) {
            logger.throwError("use fromString", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "new ParamType()"
            });
        }
        populate(this, params);
        let match = this.type.match(paramTypeArray);
        if (match) {
            populate(this, {
                arrayLength: parseInt(match[2] || "-1"),
                arrayChildren: fragments_ParamType.fromObject({
                    type: match[1],
                    components: this.components
                }),
                baseType: "array"
            });
        }
        else {
            populate(this, {
                arrayLength: null,
                arrayChildren: null,
                baseType: ((this.components != null) ? "tuple" : this.type)
            });
        }
        this._isParamType = true;
        Object.freeze(this);
    }
    // Format the parameter fragment
    //   - sighash: "(uint256,address)"
    //   - minimal: "tuple(uint256,address) indexed"
    //   - full:    "tuple(uint256 foo, addres bar) indexed baz"
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            let result = {
                type: ((this.baseType === "tuple") ? "tuple" : this.type),
                name: (this.name || undefined)
            };
            if (typeof (this.indexed) === "boolean") {
                result.indexed = this.indexed;
            }
            if (this.components) {
                result.components = this.components.map((comp) => JSON.parse(comp.format(format)));
            }
            return JSON.stringify(result);
        }
        let result = "";
        // Array
        if (this.baseType === "array") {
            result += this.arrayChildren.format(format);
            result += "[" + (this.arrayLength < 0 ? "" : String(this.arrayLength)) + "]";
        }
        else {
            if (this.baseType === "tuple") {
                if (format !== FormatTypes.sighash) {
                    result += this.type;
                }
                result += "(" + this.components.map((comp) => comp.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ")";
            }
            else {
                result += this.type;
            }
        }
        if (format !== FormatTypes.sighash) {
            if (this.indexed === true) {
                result += " indexed";
            }
            if (format === FormatTypes.full && this.name) {
                result += " " + this.name;
            }
        }
        return result;
    }
    static from(value, allowIndexed) {
        if (typeof (value) === "string") {
            return fragments_ParamType.fromString(value, allowIndexed);
        }
        return fragments_ParamType.fromObject(value);
    }
    static fromObject(value) {
        if (fragments_ParamType.isParamType(value)) {
            return value;
        }
        return new fragments_ParamType(_constructorGuard, {
            name: (value.name || null),
            type: verifyType(value.type),
            indexed: ((value.indexed == null) ? null : !!value.indexed),
            components: (value.components ? value.components.map(fragments_ParamType.fromObject) : null)
        });
    }
    static fromString(value, allowIndexed) {
        function ParamTypify(node) {
            return fragments_ParamType.fromObject({
                name: node.name,
                type: node.type,
                indexed: node.indexed,
                components: node.components
            });
        }
        return ParamTypify(parseParamType(value, !!allowIndexed));
    }
    static isParamType(value) {
        return !!(value != null && value._isParamType);
    }
}
;
function parseParams(value, allowIndex) {
    return splitNesting(value).map((param) => fragments_ParamType.fromString(param, allowIndex));
}
class fragments_Fragment {
    constructor(constructorGuard, params) {
        if (constructorGuard !== _constructorGuard) {
            logger.throwError("use a static from method", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "new Fragment()"
            });
        }
        populate(this, params);
        this._isFragment = true;
        Object.freeze(this);
    }
    static from(value) {
        if (fragments_Fragment.isFragment(value)) {
            return value;
        }
        if (typeof (value) === "string") {
            return fragments_Fragment.fromString(value);
        }
        return fragments_Fragment.fromObject(value);
    }
    static fromObject(value) {
        if (fragments_Fragment.isFragment(value)) {
            return value;
        }
        switch (value.type) {
            case "function":
                return fragments_FunctionFragment.fromObject(value);
            case "event":
                return EventFragment.fromObject(value);
            case "constructor":
                return fragments_ConstructorFragment.fromObject(value);
            case "fallback":
            case "receive":
                // @TODO: Something? Maybe return a FunctionFragment? A custom DefaultFunctionFragment?
                return null;
        }
        return logger.throwArgumentError("invalid fragment object", "value", value);
    }
    static fromString(value) {
        // Make sure the "returns" is surrounded by a space and all whitespace is exactly one space
        value = value.replace(/\s/g, " ");
        value = value.replace(/\(/g, " (").replace(/\)/g, ") ").replace(/\s+/g, " ");
        value = value.trim();
        if (value.split(" ")[0] === "event") {
            return EventFragment.fromString(value.substring(5).trim());
        }
        else if (value.split(" ")[0] === "function") {
            return fragments_FunctionFragment.fromString(value.substring(8).trim());
        }
        else if (value.split("(")[0].trim() === "constructor") {
            return fragments_ConstructorFragment.fromString(value.trim());
        }
        return logger.throwArgumentError("unsupported fragment", "value", value);
    }
    static isFragment(value) {
        return !!(value && value._isFragment);
    }
}
class EventFragment extends fragments_Fragment {
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            return JSON.stringify({
                type: "event",
                anonymous: this.anonymous,
                name: this.name,
                inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
            });
        }
        let result = "";
        if (format !== FormatTypes.sighash) {
            result += "event ";
        }
        result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
        if (format !== FormatTypes.sighash) {
            if (this.anonymous) {
                result += "anonymous ";
            }
        }
        return result.trim();
    }
    static from(value) {
        if (typeof (value) === "string") {
            return EventFragment.fromString(value);
        }
        return EventFragment.fromObject(value);
    }
    static fromObject(value) {
        if (EventFragment.isEventFragment(value)) {
            return value;
        }
        if (value.type !== "event") {
            logger.throwArgumentError("invalid event object", "value", value);
        }
        const params = {
            name: verifyIdentifier(value.name),
            anonymous: value.anonymous,
            inputs: (value.inputs ? value.inputs.map(fragments_ParamType.fromObject) : []),
            type: "event"
        };
        return new EventFragment(_constructorGuard, params);
    }
    static fromString(value) {
        let match = value.match(regexParen);
        if (!match) {
            logger.throwArgumentError("invalid event string", "value", value);
        }
        let anonymous = false;
        match[3].split(" ").forEach((modifier) => {
            switch (modifier.trim()) {
                case "anonymous":
                    anonymous = true;
                    break;
                case "":
                    break;
                default:
                    logger.warn("unknown modifier: " + modifier);
            }
        });
        return EventFragment.fromObject({
            name: match[1].trim(),
            anonymous: anonymous,
            inputs: parseParams(match[2], true),
            type: "event"
        });
    }
    static isEventFragment(value) {
        return (value && value._isFragment && value.type === "event");
    }
}
function parseGas(value, params) {
    params.gas = null;
    let comps = value.split("@");
    if (comps.length !== 1) {
        if (comps.length > 2) {
            logger.throwArgumentError("invalid human-readable ABI signature", "value", value);
        }
        if (!comps[1].match(/^[0-9]+$/)) {
            logger.throwArgumentError("invalid human-readable ABI signature gas", "value", value);
        }
        params.gas = lib_esm["a" /* BigNumber */].from(comps[1]);
        return comps[0];
    }
    return value;
}
function parseModifiers(value, params) {
    params.constant = false;
    params.payable = false;
    params.stateMutability = "nonpayable";
    value.split(" ").forEach((modifier) => {
        switch (modifier.trim()) {
            case "constant":
                params.constant = true;
                break;
            case "payable":
                params.payable = true;
                params.stateMutability = "payable";
                break;
            case "pure":
                params.constant = true;
                params.stateMutability = "pure";
                break;
            case "view":
                params.constant = true;
                params.stateMutability = "view";
                break;
            case "external":
            case "public":
            case "":
                break;
            default:
                console.log("unknown modifier: " + modifier);
        }
    });
}
function verifyState(value) {
    let result = {
        constant: false,
        payable: true,
        stateMutability: "payable"
    };
    if (value.stateMutability != null) {
        result.stateMutability = value.stateMutability;
        // Set (and check things are consistent) the constant property
        result.constant = (result.stateMutability === "view" || result.stateMutability === "pure");
        if (value.constant != null) {
            if ((!!value.constant) !== result.constant) {
                logger.throwArgumentError("cannot have constant function with mutability " + result.stateMutability, "value", value);
            }
        }
        // Set (and check things are consistent) the payable property
        result.payable = (result.stateMutability === "payable");
        if (value.payable != null) {
            if ((!!value.payable) !== result.payable) {
                logger.throwArgumentError("cannot have payable function with mutability " + result.stateMutability, "value", value);
            }
        }
    }
    else if (value.payable != null) {
        result.payable = !!value.payable;
        // If payable we can assume non-constant; otherwise we can't assume
        if (value.constant == null && !result.payable && value.type !== "constructor") {
            logger.throwArgumentError("unable to determine stateMutability", "value", value);
        }
        result.constant = !!value.constant;
        if (result.constant) {
            result.stateMutability = "view";
        }
        else {
            result.stateMutability = (result.payable ? "payable" : "nonpayable");
        }
        if (result.payable && result.constant) {
            logger.throwArgumentError("cannot have constant payable function", "value", value);
        }
    }
    else if (value.constant != null) {
        result.constant = !!value.constant;
        result.payable = !result.constant;
        result.stateMutability = (result.constant ? "view" : "payable");
    }
    else if (value.type !== "constructor") {
        logger.throwArgumentError("unable to determine stateMutability", "value", value);
    }
    return result;
}
class fragments_ConstructorFragment extends fragments_Fragment {
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            return JSON.stringify({
                type: "constructor",
                stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                payble: this.payable,
                gas: (this.gas ? this.gas.toNumber() : undefined),
                inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
            });
        }
        if (format === FormatTypes.sighash) {
            logger.throwError("cannot format a constructor for sighash", logger_lib_esm["Logger"].errors.UNSUPPORTED_OPERATION, {
                operation: "format(sighash)"
            });
        }
        let result = "constructor(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
        if (this.stateMutability && this.stateMutability !== "nonpayable") {
            result += this.stateMutability + " ";
        }
        return result.trim();
    }
    static from(value) {
        if (typeof (value) === "string") {
            return fragments_ConstructorFragment.fromString(value);
        }
        return fragments_ConstructorFragment.fromObject(value);
    }
    static fromObject(value) {
        if (fragments_ConstructorFragment.isConstructorFragment(value)) {
            return value;
        }
        if (value.type !== "constructor") {
            logger.throwArgumentError("invalid constructor object", "value", value);
        }
        let state = verifyState(value);
        if (state.constant) {
            logger.throwArgumentError("constructor cannot be constant", "value", value);
        }
        const params = {
            name: null,
            type: value.type,
            inputs: (value.inputs ? value.inputs.map(fragments_ParamType.fromObject) : []),
            payable: state.payable,
            stateMutability: state.stateMutability,
            gas: (value.gas ? lib_esm["a" /* BigNumber */].from(value.gas) : null)
        };
        return new fragments_ConstructorFragment(_constructorGuard, params);
    }
    static fromString(value) {
        let params = { type: "constructor" };
        value = parseGas(value, params);
        let parens = value.match(regexParen);
        if (!parens || parens[1].trim() !== "constructor") {
            logger.throwArgumentError("invalid constructor string", "value", value);
        }
        params.inputs = parseParams(parens[2].trim(), false);
        parseModifiers(parens[3].trim(), params);
        return fragments_ConstructorFragment.fromObject(params);
    }
    static isConstructorFragment(value) {
        return (value && value._isFragment && value.type === "constructor");
    }
}
class fragments_FunctionFragment extends fragments_ConstructorFragment {
    format(format) {
        if (!format) {
            format = FormatTypes.sighash;
        }
        if (!FormatTypes[format]) {
            logger.throwArgumentError("invalid format type", "format", format);
        }
        if (format === FormatTypes.json) {
            return JSON.stringify({
                type: "function",
                name: this.name,
                constant: this.constant,
                stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                payble: this.payable,
                gas: (this.gas ? this.gas.toNumber() : undefined),
                inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
                ouputs: this.outputs.map((output) => JSON.parse(output.format(format))),
            });
        }
        let result = "";
        if (format !== FormatTypes.sighash) {
            result += "function ";
        }
        result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
        if (format !== FormatTypes.sighash) {
            if (this.stateMutability) {
                if (this.stateMutability !== "nonpayable") {
                    result += (this.stateMutability + " ");
                }
            }
            else if (this.constant) {
                result += "view ";
            }
            if (this.outputs && this.outputs.length) {
                result += "returns (" + this.outputs.map((output) => output.format(format)).join(", ") + ") ";
            }
            if (this.gas != null) {
                result += "@" + this.gas.toString() + " ";
            }
        }
        return result.trim();
    }
    static from(value) {
        if (typeof (value) === "string") {
            return fragments_FunctionFragment.fromString(value);
        }
        return fragments_FunctionFragment.fromObject(value);
    }
    static fromObject(value) {
        if (fragments_FunctionFragment.isFunctionFragment(value)) {
            return value;
        }
        if (value.type !== "function") {
            logger.throwArgumentError("invalid function object", "value", value);
        }
        let state = verifyState(value);
        const params = {
            type: value.type,
            name: verifyIdentifier(value.name),
            constant: state.constant,
            inputs: (value.inputs ? value.inputs.map(fragments_ParamType.fromObject) : []),
            outputs: (value.outputs ? value.outputs.map(fragments_ParamType.fromObject) : []),
            payable: state.payable,
            stateMutability: state.stateMutability,
            gas: (value.gas ? lib_esm["a" /* BigNumber */].from(value.gas) : null)
        };
        return new fragments_FunctionFragment(_constructorGuard, params);
    }
    static fromString(value) {
        let params = { type: "function" };
        value = parseGas(value, params);
        let comps = value.split(" returns ");
        if (comps.length > 2) {
            logger.throwArgumentError("invalid function string", "value", value);
        }
        let parens = comps[0].match(regexParen);
        if (!parens) {
            logger.throwArgumentError("invalid function signature", "value", value);
        }
        params.name = parens[1].trim();
        if (params.name) {
            verifyIdentifier(params.name);
        }
        params.inputs = parseParams(parens[2], false);
        parseModifiers(parens[3].trim(), params);
        // We have outputs
        if (comps.length > 1) {
            let returns = comps[1].match(regexParen);
            if (returns[1].trim() != "" || returns[3].trim() != "") {
                logger.throwArgumentError("unexpected tokens", "value", value);
            }
            params.outputs = parseParams(returns[2], false);
        }
        else {
            params.outputs = [];
        }
        return fragments_FunctionFragment.fromObject(params);
    }
    static isFunctionFragment(value) {
        return (value && value._isFragment && value.type === "function");
    }
}
//export class ErrorFragment extends Fragment {
//}
//export class StructFragment extends Fragment {
//}
function verifyType(type) {
    // These need to be transformed to their full description
    if (type.match(/^uint($|[^1-9])/)) {
        type = "uint256" + type.substring(4);
    }
    else if (type.match(/^int($|[^1-9])/)) {
        type = "int256" + type.substring(3);
    }
    // @TODO: more verification
    return type;
}
const regexIdentifier = new RegExp("^[A-Za-z_][A-Za-z0-9_]*$");
function verifyIdentifier(value) {
    if (!value || !value.match(regexIdentifier)) {
        logger.throwArgumentError(`invalid identifier "${value}"`, "value", value);
    }
    return value;
}
const regexParen = new RegExp("^([^)(]*)\\((.*)\\)([^)(]*)$");
function splitNesting(value) {
    value = value.trim();
    let result = [];
    let accum = "";
    let depth = 0;
    for (let offset = 0; offset < value.length; offset++) {
        let c = value[offset];
        if (c === "," && depth === 0) {
            result.push(accum);
            accum = "";
        }
        else {
            accum += c;
            if (c === "(") {
                depth++;
            }
            else if (c === ")") {
                depth--;
                if (depth === -1) {
                    logger.throwArgumentError("unbalanced parenthesis", "value", value);
                }
            }
        }
    }
    if (accum) {
        result.push(accum);
    }
    return result;
}

// EXTERNAL MODULE: ./node_modules/@ethersproject/bytes/lib.esm/index.js + 1 modules
var bytes_lib_esm = __webpack_require__(6);

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/coders/abstract-coder.js






const abstract_coder_logger = new logger_lib_esm["Logger"](version);
function checkResultErrors(result) {
    // Find the first error (if any)
    const errors = [];
    const checkErrors = function (path, object) {
        if (!Array.isArray(object)) {
            return;
        }
        for (let key in object) {
            const childPath = path.slice();
            childPath.push(key);
            try {
                checkErrors(childPath, object[key]);
            }
            catch (error) {
                errors.push({ path: childPath, error: error });
            }
        }
    };
    checkErrors([], result);
    return errors;
}
class Coder {
    constructor(name, type, localName, dynamic) {
        // @TODO: defineReadOnly these
        this.name = name;
        this.type = type;
        this.localName = localName;
        this.dynamic = dynamic;
    }
    _throwError(message, value) {
        abstract_coder_logger.throwArgumentError(message, this.localName, value);
    }
}
class abstract_coder_Writer {
    constructor(wordSize) {
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "wordSize", wordSize || 32);
        this._data = Object(bytes_lib_esm["arrayify"])([]);
        this._padding = new Uint8Array(wordSize);
    }
    get data() { return Object(bytes_lib_esm["hexlify"])(this._data); }
    get length() { return this._data.length; }
    _writeData(data) {
        this._data = Object(bytes_lib_esm["concat"])([this._data, data]);
        return data.length;
    }
    // Arrayish items; padded on the right to wordSize
    writeBytes(value) {
        let bytes = Object(bytes_lib_esm["arrayify"])(value);
        if (bytes.length % this.wordSize) {
            bytes = Object(bytes_lib_esm["concat"])([bytes, this._padding.slice(bytes.length % this.wordSize)]);
        }
        return this._writeData(bytes);
    }
    _getValue(value) {
        let bytes = Object(bytes_lib_esm["arrayify"])(lib_esm["a" /* BigNumber */].from(value));
        if (bytes.length > this.wordSize) {
            abstract_coder_logger.throwError("value out-of-bounds", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {
                length: this.wordSize,
                offset: bytes.length
            });
        }
        if (bytes.length % this.wordSize) {
            bytes = Object(bytes_lib_esm["concat"])([this._padding.slice(bytes.length % this.wordSize), bytes]);
        }
        return bytes;
    }
    // BigNumberish items; padded on the left to wordSize
    writeValue(value) {
        return this._writeData(this._getValue(value));
    }
    writeUpdatableValue() {
        let offset = this.length;
        this.writeValue(0);
        return (value) => {
            this._data.set(this._getValue(value), offset);
        };
    }
}
class abstract_coder_Reader {
    constructor(data, wordSize, coerceFunc) {
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_data", Object(bytes_lib_esm["arrayify"])(data));
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "wordSize", wordSize || 32);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_coerceFunc", coerceFunc);
        this._offset = 0;
    }
    get data() { return Object(bytes_lib_esm["hexlify"])(this._data); }
    get consumed() { return this._offset; }
    // The default Coerce function
    static coerce(name, value) {
        let match = name.match("^u?int([0-9]+)$");
        if (match && parseInt(match[1]) <= 48) {
            value = value.toNumber();
        }
        return value;
    }
    coerce(name, value) {
        if (this._coerceFunc) {
            return this._coerceFunc(name, value);
        }
        return abstract_coder_Reader.coerce(name, value);
    }
    _peekBytes(offset, length) {
        let alignedLength = Math.ceil(length / this.wordSize) * this.wordSize;
        if (this._offset + alignedLength > this._data.length) {
            abstract_coder_logger.throwError("data out-of-bounds", logger_lib_esm["Logger"].errors.BUFFER_OVERRUN, {
                length: this._data.length,
                offset: this._offset + alignedLength
            });
        }
        return this._data.slice(this._offset, this._offset + alignedLength);
    }
    subReader(offset) {
        return new abstract_coder_Reader(this._data.slice(this._offset + offset), this.wordSize, this._coerceFunc);
    }
    readBytes(length) {
        let bytes = this._peekBytes(0, length);
        this._offset += bytes.length;
        // @TODO: Make sure the length..end bytes are all 0?
        return bytes.slice(0, length);
    }
    readValue() {
        return lib_esm["a" /* BigNumber */].from(this.readBytes(this.wordSize));
    }
}

// EXTERNAL MODULE: ./node_modules/@ethersproject/address/lib.esm/index.js + 1 modules
var address_lib_esm = __webpack_require__(114);

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/coders/address.js




class address_AddressCoder extends Coder {
    constructor(localName) {
        super("address", "address", localName, false);
    }
    encode(writer, value) {
        try {
            Object(address_lib_esm["a" /* getAddress */])(value);
        }
        catch (error) {
            this._throwError(error.message, value);
        }
        return writer.writeValue(value);
    }
    decode(reader) {
        return Object(address_lib_esm["a" /* getAddress */])(Object(bytes_lib_esm["hexZeroPad"])(reader.readValue().toHexString(), 20));
    }
}

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/coders/anonymous.js


// Clones the functionality of an existing Coder, but without a localName
class anonymous_AnonymousCoder extends Coder {
    constructor(coder) {
        super(coder.name, coder.type, undefined, coder.dynamic);
        this.coder = coder;
    }
    encode(writer, value) {
        return this.coder.encode(writer, value);
    }
    decode(reader) {
        return this.coder.decode(reader);
    }
}

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/coders/array.js



const array_logger = new logger_lib_esm["Logger"](version);


function pack(writer, coders, values) {
    if (Array.isArray(values)) {
        // do nothing
    }
    else if (values && typeof (values) === "object") {
        let arrayValues = [];
        coders.forEach(function (coder) {
            arrayValues.push(values[coder.localName]);
        });
        values = arrayValues;
    }
    else {
        array_logger.throwArgumentError("invalid tuple value", "tuple", values);
    }
    if (coders.length !== values.length) {
        array_logger.throwArgumentError("types/value length mismatch", "tuple", values);
    }
    let staticWriter = new abstract_coder_Writer(writer.wordSize);
    let dynamicWriter = new abstract_coder_Writer(writer.wordSize);
    let updateFuncs = [];
    coders.forEach((coder, index) => {
        let value = values[index];
        if (coder.dynamic) {
            // Get current dynamic offset (for the future pointer)
            let dynamicOffset = dynamicWriter.length;
            // Encode the dynamic value into the dynamicWriter
            coder.encode(dynamicWriter, value);
            // Prepare to populate the correct offset once we are done
            let updateFunc = staticWriter.writeUpdatableValue();
            updateFuncs.push((baseOffset) => {
                updateFunc(baseOffset + dynamicOffset);
            });
        }
        else {
            coder.encode(staticWriter, value);
        }
    });
    // Backfill all the dynamic offsets, now that we know the static length
    updateFuncs.forEach((func) => { func(staticWriter.length); });
    let length = writer.writeBytes(staticWriter.data);
    length += writer.writeBytes(dynamicWriter.data);
    return length;
}
function unpack(reader, coders) {
    let values = [];
    // A reader anchored to this base
    let baseReader = reader.subReader(0);
    // The amount of dynamic data read; to consume later to synchronize
    let dynamicLength = 0;
    coders.forEach((coder) => {
        let value = null;
        if (coder.dynamic) {
            let offset = reader.readValue();
            let offsetReader = baseReader.subReader(offset.toNumber());
            try {
                value = coder.decode(offsetReader);
            }
            catch (error) {
                // Cannot recover from this
                if (error.code === logger_lib_esm["Logger"].errors.BUFFER_OVERRUN) {
                    throw error;
                }
                value = error;
                value.baseType = coder.name;
                value.name = coder.localName;
                value.type = coder.type;
            }
            dynamicLength += offsetReader.consumed;
        }
        else {
            try {
                value = coder.decode(reader);
            }
            catch (error) {
                // Cannot recover from this
                if (error.code === logger_lib_esm["Logger"].errors.BUFFER_OVERRUN) {
                    throw error;
                }
                value = error;
                value.baseType = coder.name;
                value.name = coder.localName;
                value.type = coder.type;
            }
        }
        if (value != undefined) {
            values.push(value);
        }
    });
    // @TODO: get rid of this an see if it still works?
    // Consume the dynamic components in the main reader
    reader.readBytes(dynamicLength);
    // Add any named parameters (i.e. tuples)
    coders.forEach((coder, index) => {
        let name = coder.localName;
        if (!name) {
            return;
        }
        if (name === "length") {
            name = "_length";
        }
        if (values[name] != null) {
            return;
        }
        const value = values[index];
        if (value instanceof Error) {
            Object.defineProperty(values, name, {
                get: () => { throw value; }
            });
        }
        else {
            values[name] = value;
        }
    });
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (value instanceof Error) {
            Object.defineProperty(values, i, {
                get: () => { throw value; }
            });
        }
    }
    return Object.freeze(values);
}
class array_ArrayCoder extends Coder {
    constructor(coder, length, localName) {
        const type = (coder.type + "[" + (length >= 0 ? length : "") + "]");
        const dynamic = (length === -1 || coder.dynamic);
        super("array", type, localName, dynamic);
        this.coder = coder;
        this.length = length;
    }
    encode(writer, value) {
        if (!Array.isArray(value)) {
            this._throwError("expected array value", value);
        }
        let count = this.length;
        if (count === -1) {
            count = value.length;
            writer.writeValue(value.length);
        }
        array_logger.checkArgumentCount(count, value.length, "coder array" + (this.localName ? (" " + this.localName) : ""));
        let coders = [];
        for (let i = 0; i < value.length; i++) {
            coders.push(this.coder);
        }
        return pack(writer, coders, value);
    }
    decode(reader) {
        let count = this.length;
        if (count === -1) {
            count = reader.readValue().toNumber();
        }
        let coders = [];
        for (let i = 0; i < count; i++) {
            coders.push(new anonymous_AnonymousCoder(this.coder));
        }
        return reader.coerce(this.name, unpack(reader, coders));
    }
}

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/coders/boolean.js


class boolean_BooleanCoder extends Coder {
    constructor(localName) {
        super("bool", "bool", localName, false);
    }
    encode(writer, value) {
        return writer.writeValue(value ? 1 : 0);
    }
    decode(reader) {
        return reader.coerce(this.type, !reader.readValue().isZero());
    }
}

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/coders/bytes.js



class bytes_DynamicBytesCoder extends Coder {
    constructor(type, localName) {
        super(type, type, localName, true);
    }
    encode(writer, value) {
        value = Object(bytes_lib_esm["arrayify"])(value);
        let length = writer.writeValue(value.length);
        length += writer.writeBytes(value);
        return length;
    }
    decode(reader) {
        return reader.readBytes(reader.readValue().toNumber());
    }
}
class bytes_BytesCoder extends bytes_DynamicBytesCoder {
    constructor(localName) {
        super("bytes", localName);
    }
    decode(reader) {
        return reader.coerce(this.name, Object(bytes_lib_esm["hexlify"])(super.decode(reader)));
    }
}

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/coders/fixed-bytes.js



// @TODO: Merge this with bytes
class fixed_bytes_FixedBytesCoder extends Coder {
    constructor(size, localName) {
        let name = "bytes" + String(size);
        super(name, name, localName, false);
        this.size = size;
    }
    encode(writer, value) {
        let data = Object(bytes_lib_esm["arrayify"])(value);
        if (data.length !== this.size) {
            this._throwError("incorrect data length", value);
        }
        return writer.writeBytes(data);
    }
    decode(reader) {
        return reader.coerce(this.name, Object(bytes_lib_esm["hexlify"])(reader.readBytes(this.size)));
    }
}

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/coders/null.js


class null_NullCoder extends Coder {
    constructor(localName) {
        super("null", "", localName, false);
    }
    encode(writer, value) {
        if (value != null) {
            this._throwError("not null", value);
        }
        return writer.writeBytes([]);
    }
    decode(reader) {
        reader.readBytes(0);
        return reader.coerce(this.name, null);
    }
}

// EXTERNAL MODULE: ./node_modules/@ethersproject/constants/lib.esm/index.js
var constants_lib_esm = __webpack_require__(154);

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/coders/number.js




class number_NumberCoder extends Coder {
    constructor(size, signed, localName) {
        const name = ((signed ? "int" : "uint") + (size * 8));
        super(name, name, localName, false);
        this.size = size;
        this.signed = signed;
    }
    encode(writer, value) {
        let v = lib_esm["a" /* BigNumber */].from(value);
        // Check bounds are safe for encoding
        let maxUintValue = constants_lib_esm["c" /* MaxUint256 */].mask(writer.wordSize * 8);
        if (this.signed) {
            let bounds = maxUintValue.mask(this.size * 8 - 1);
            if (v.gt(bounds) || v.lt(bounds.add(constants_lib_esm["e" /* One */]).mul(constants_lib_esm["d" /* NegativeOne */]))) {
                this._throwError("value out-of-bounds", value);
            }
        }
        else if (v.lt(constants_lib_esm["f" /* Zero */]) || v.gt(maxUintValue.mask(this.size * 8))) {
            this._throwError("value out-of-bounds", value);
        }
        v = v.toTwos(this.size * 8).mask(this.size * 8);
        if (this.signed) {
            v = v.fromTwos(this.size * 8).toTwos(8 * writer.wordSize);
        }
        return writer.writeValue(v);
    }
    decode(reader) {
        let value = reader.readValue().mask(this.size * 8);
        if (this.signed) {
            value = value.fromTwos(this.size * 8);
        }
        return reader.coerce(this.name, value);
    }
}

// EXTERNAL MODULE: ./node_modules/@ethersproject/strings/lib.esm/index.js + 4 modules
var strings_lib_esm = __webpack_require__(107);

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/coders/string.js



class string_StringCoder extends bytes_DynamicBytesCoder {
    constructor(localName) {
        super("string", localName);
    }
    encode(writer, value) {
        return super.encode(writer, Object(strings_lib_esm["b" /* toUtf8Bytes */])(value));
    }
    decode(reader) {
        return Object(strings_lib_esm["c" /* toUtf8String */])(super.decode(reader));
    }
}

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/coders/tuple.js



class tuple_TupleCoder extends Coder {
    constructor(coders, localName) {
        let dynamic = false;
        const types = [];
        coders.forEach((coder) => {
            if (coder.dynamic) {
                dynamic = true;
            }
            types.push(coder.type);
        });
        const type = ("tuple(" + types.join(",") + ")");
        super("tuple", type, localName, dynamic);
        this.coders = coders;
    }
    encode(writer, value) {
        return pack(writer, this.coders, value);
    }
    decode(reader) {
        return reader.coerce(this.name, unpack(reader, this.coders));
    }
}

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/abi-coder.js

// See: https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI




const abi_coder_logger = new logger_lib_esm["Logger"](version);











const paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);
class abi_coder_AbiCoder {
    constructor(coerceFunc) {
        abi_coder_logger.checkNew(new.target, abi_coder_AbiCoder);
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "coerceFunc", coerceFunc || null);
    }
    _getCoder(param) {
        switch (param.baseType) {
            case "address":
                return new address_AddressCoder(param.name);
            case "bool":
                return new boolean_BooleanCoder(param.name);
            case "string":
                return new string_StringCoder(param.name);
            case "bytes":
                return new bytes_BytesCoder(param.name);
            case "array":
                return new array_ArrayCoder(this._getCoder(param.arrayChildren), param.arrayLength, param.name);
            case "tuple":
                return new tuple_TupleCoder((param.components || []).map((component) => {
                    return this._getCoder(component);
                }), param.name);
            case "":
                return new null_NullCoder(param.name);
        }
        // u?int[0-9]*
        let match = param.type.match(paramTypeNumber);
        if (match) {
            let size = parseInt(match[2] || "256");
            if (size === 0 || size > 256 || (size % 8) !== 0) {
                abi_coder_logger.throwArgumentError("invalid " + match[1] + " bit length", "param", param);
            }
            return new number_NumberCoder(size / 8, (match[1] === "int"), param.name);
        }
        // bytes[0-9]+
        match = param.type.match(paramTypeBytes);
        if (match) {
            let size = parseInt(match[1]);
            if (size === 0 || size > 32) {
                abi_coder_logger.throwArgumentError("invalid bytes length", "param", param);
            }
            return new fixed_bytes_FixedBytesCoder(size, param.name);
        }
        return abi_coder_logger.throwArgumentError("invalid type", "type", param.type);
    }
    _getWordSize() { return 32; }
    _getReader(data) {
        return new abstract_coder_Reader(data, this._getWordSize(), this.coerceFunc);
    }
    _getWriter() {
        return new abstract_coder_Writer(this._getWordSize());
    }
    encode(types, values) {
        if (types.length !== values.length) {
            abi_coder_logger.throwError("types/values length mismatch", logger_lib_esm["Logger"].errors.INVALID_ARGUMENT, {
                count: { types: types.length, values: values.length },
                value: { types: types, values: values }
            });
        }
        const coders = types.map((type) => this._getCoder(fragments_ParamType.from(type)));
        const coder = (new tuple_TupleCoder(coders, "_"));
        const writer = this._getWriter();
        coder.encode(writer, values);
        return writer.data;
    }
    decode(types, data) {
        const coders = types.map((type) => this._getCoder(fragments_ParamType.from(type)));
        const coder = new tuple_TupleCoder(coders, "_");
        return coder.decode(this._getReader(Object(bytes_lib_esm["arrayify"])(data)));
    }
}
const defaultAbiCoder = new abi_coder_AbiCoder();

// EXTERNAL MODULE: ./node_modules/@ethersproject/hash/lib.esm/index.js + 1 modules
var hash_lib_esm = __webpack_require__(177);

// EXTERNAL MODULE: ./node_modules/@ethersproject/keccak256/lib.esm/index.js
var keccak256_lib_esm = __webpack_require__(131);

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/interface.js












const interface_logger = new logger_lib_esm["Logger"](version);

class interface_LogDescription extends properties_lib_esm["a" /* Description */] {
}
class interface_TransactionDescription extends properties_lib_esm["a" /* Description */] {
}
class interface_Indexed extends properties_lib_esm["a" /* Description */] {
    static isIndexed(value) {
        return !!(value && value._isIndexed);
    }
}
function wrapAccessError(property, error) {
    const wrap = new Error(`deferred error during ABI decoding triggered accessing ${property}`);
    wrap.error = error;
    return wrap;
}
function checkNames(fragment, type, params) {
    params.reduce((accum, param) => {
        if (param.name) {
            if (accum[param.name]) {
                interface_logger.throwArgumentError(`duplicate ${type} parameter ${JSON.stringify(param.name)} in ${fragment.format("full")}`, "fragment", fragment);
            }
            accum[param.name] = true;
        }
        return accum;
    }, {});
}
class interface_Interface {
    constructor(fragments) {
        interface_logger.checkNew(new.target, interface_Interface);
        let abi = [];
        if (typeof (fragments) === "string") {
            abi = JSON.parse(fragments);
        }
        else {
            abi = fragments;
        }
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "fragments", abi.map((fragment) => {
            return fragments_Fragment.from(fragment);
        }).filter((fragment) => (fragment != null)));
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_abiCoder", Object(properties_lib_esm["e" /* getStatic */])((new.target), "getAbiCoder")());
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "functions", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "errors", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "events", {});
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "structs", {});
        // Add all fragments by their signature
        this.fragments.forEach((fragment) => {
            let bucket = null;
            switch (fragment.type) {
                case "constructor":
                    if (this.deploy) {
                        interface_logger.warn("duplicate definition - constructor");
                        return;
                    }
                    checkNames(fragment, "input", fragment.inputs);
                    Object(properties_lib_esm["d" /* defineReadOnly */])(this, "deploy", fragment);
                    return;
                case "function":
                    checkNames(fragment, "input", fragment.inputs);
                    checkNames(fragment, "output", fragment.outputs);
                    bucket = this.functions;
                    break;
                case "event":
                    checkNames(fragment, "input", fragment.inputs);
                    bucket = this.events;
                    break;
                default:
                    return;
            }
            let signature = fragment.format();
            if (bucket[signature]) {
                interface_logger.warn("duplicate definition - " + signature);
                return;
            }
            bucket[signature] = fragment;
        });
        // If we do not have a constructor add a default
        if (!this.deploy) {
            Object(properties_lib_esm["d" /* defineReadOnly */])(this, "deploy", fragments_ConstructorFragment.from({
                payable: false,
                type: "constructor"
            }));
        }
        Object(properties_lib_esm["d" /* defineReadOnly */])(this, "_isInterface", true);
    }
    format(format) {
        if (!format) {
            format = FormatTypes.full;
        }
        if (format === FormatTypes.sighash) {
            interface_logger.throwArgumentError("interface does not support formatting sighash", "format", format);
        }
        const abi = this.fragments.map((fragment) => fragment.format(format));
        // We need to re-bundle the JSON fragments a bit
        if (format === FormatTypes.json) {
            return JSON.stringify(abi.map((j) => JSON.parse(j)));
        }
        return abi;
    }
    // Sub-classes can override these to handle other blockchains
    static getAbiCoder() {
        return defaultAbiCoder;
    }
    static getAddress(address) {
        return Object(address_lib_esm["a" /* getAddress */])(address);
    }
    static getSighash(functionFragment) {
        return Object(bytes_lib_esm["hexDataSlice"])(Object(hash_lib_esm["a" /* id */])(functionFragment.format()), 0, 4);
    }
    static getEventTopic(eventFragment) {
        return Object(hash_lib_esm["a" /* id */])(eventFragment.format());
    }
    // Find a function definition by any means necessary (unless it is ambiguous)
    getFunction(nameOrSignatureOrSighash) {
        if (Object(bytes_lib_esm["isHexString"])(nameOrSignatureOrSighash)) {
            for (const name in this.functions) {
                if (nameOrSignatureOrSighash === this.getSighash(name)) {
                    return this.functions[name];
                }
            }
            interface_logger.throwArgumentError("no matching function", "sighash", nameOrSignatureOrSighash);
        }
        // It is a bare name, look up the function (will return null if ambiguous)
        if (nameOrSignatureOrSighash.indexOf("(") === -1) {
            const name = nameOrSignatureOrSighash.trim();
            const matching = Object.keys(this.functions).filter((f) => (f.split("(" /* fix:) */)[0] === name));
            if (matching.length === 0) {
                interface_logger.throwArgumentError("no matching function", "name", name);
            }
            else if (matching.length > 1) {
                interface_logger.throwArgumentError("multiple matching functions", "name", name);
            }
            return this.functions[matching[0]];
        }
        // Normlize the signature and lookup the function
        const result = this.functions[fragments_FunctionFragment.fromString(nameOrSignatureOrSighash).format()];
        if (!result) {
            interface_logger.throwArgumentError("no matching function", "signature", nameOrSignatureOrSighash);
        }
        return result;
    }
    // Find an event definition by any means necessary (unless it is ambiguous)
    getEvent(nameOrSignatureOrTopic) {
        if (Object(bytes_lib_esm["isHexString"])(nameOrSignatureOrTopic)) {
            const topichash = nameOrSignatureOrTopic.toLowerCase();
            for (const name in this.events) {
                if (topichash === this.getEventTopic(name)) {
                    return this.events[name];
                }
            }
            interface_logger.throwArgumentError("no matching event", "topichash", topichash);
        }
        // It is a bare name, look up the function (will return null if ambiguous)
        if (nameOrSignatureOrTopic.indexOf("(") === -1) {
            const name = nameOrSignatureOrTopic.trim();
            const matching = Object.keys(this.events).filter((f) => (f.split("(" /* fix:) */)[0] === name));
            if (matching.length === 0) {
                interface_logger.throwArgumentError("no matching event", "name", name);
            }
            else if (matching.length > 1) {
                interface_logger.throwArgumentError("multiple matching events", "name", name);
            }
            return this.events[matching[0]];
        }
        // Normlize the signature and lookup the function
        const result = this.events[EventFragment.fromString(nameOrSignatureOrTopic).format()];
        if (!result) {
            interface_logger.throwArgumentError("no matching event", "signature", nameOrSignatureOrTopic);
        }
        return result;
    }
    // Get the sighash (the bytes4 selector) used by Solidity to identify a function
    getSighash(functionFragment) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        return Object(properties_lib_esm["e" /* getStatic */])(this.constructor, "getSighash")(functionFragment);
    }
    // Get the topic (the bytes32 hash) used by Solidity to identify an event
    getEventTopic(eventFragment) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        return Object(properties_lib_esm["e" /* getStatic */])(this.constructor, "getEventTopic")(eventFragment);
    }
    _decodeParams(params, data) {
        return this._abiCoder.decode(params, data);
    }
    _encodeParams(params, values) {
        return this._abiCoder.encode(params, values);
    }
    encodeDeploy(values) {
        return this._encodeParams(this.deploy.inputs, values || []);
    }
    // Decode the data for a function call (e.g. tx.data)
    decodeFunctionData(functionFragment, data) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        const bytes = Object(bytes_lib_esm["arrayify"])(data);
        if (Object(bytes_lib_esm["hexlify"])(bytes.slice(0, 4)) !== this.getSighash(functionFragment)) {
            interface_logger.throwArgumentError(`data signature does not match function ${functionFragment.name}.`, "data", Object(bytes_lib_esm["hexlify"])(bytes));
        }
        return this._decodeParams(functionFragment.inputs, bytes.slice(4));
    }
    // Encode the data for a function call (e.g. tx.data)
    encodeFunctionData(functionFragment, values) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        return Object(bytes_lib_esm["hexlify"])(Object(bytes_lib_esm["concat"])([
            this.getSighash(functionFragment),
            this._encodeParams(functionFragment.inputs, values || [])
        ]));
    }
    // Decode the result from a function call (e.g. from eth_call)
    decodeFunctionResult(functionFragment, data) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        let bytes = Object(bytes_lib_esm["arrayify"])(data);
        let reason = null;
        let errorSignature = null;
        switch (bytes.length % this._abiCoder._getWordSize()) {
            case 0:
                try {
                    return this._abiCoder.decode(functionFragment.outputs, bytes);
                }
                catch (error) { }
                break;
            case 4:
                if (Object(bytes_lib_esm["hexlify"])(bytes.slice(0, 4)) === "0x08c379a0") {
                    errorSignature = "Error(string)";
                    reason = this._abiCoder.decode(["string"], bytes.slice(4))[0];
                }
                break;
        }
        return interface_logger.throwError("call revert exception", logger_lib_esm["Logger"].errors.CALL_EXCEPTION, {
            method: functionFragment.format(),
            errorSignature: errorSignature,
            errorArgs: [reason],
            reason: reason
        });
    }
    // Encode the result for a function call (e.g. for eth_call)
    encodeFunctionResult(functionFragment, values) {
        if (typeof (functionFragment) === "string") {
            functionFragment = this.getFunction(functionFragment);
        }
        return Object(bytes_lib_esm["hexlify"])(this._abiCoder.encode(functionFragment.outputs, values || []));
    }
    // Create the filter for the event with search criteria (e.g. for eth_filterLog)
    encodeFilterTopics(eventFragment, values) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        if (values.length > eventFragment.inputs.length) {
            interface_logger.throwError("too many arguments for " + eventFragment.format(), logger_lib_esm["Logger"].errors.UNEXPECTED_ARGUMENT, {
                argument: "values",
                value: values
            });
        }
        let topics = [];
        if (!eventFragment.anonymous) {
            topics.push(this.getEventTopic(eventFragment));
        }
        const encodeTopic = (param, value) => {
            if (param.type === "string") {
                return Object(hash_lib_esm["a" /* id */])(value);
            }
            else if (param.type === "bytes") {
                return Object(keccak256_lib_esm["a" /* keccak256 */])(Object(bytes_lib_esm["hexlify"])(value));
            }
            // Check addresses are valid
            if (param.type === "address") {
                this._abiCoder.encode(["address"], [value]);
            }
            return Object(bytes_lib_esm["hexZeroPad"])(Object(bytes_lib_esm["hexlify"])(value), 32);
        };
        values.forEach((value, index) => {
            let param = eventFragment.inputs[index];
            if (!param.indexed) {
                if (value != null) {
                    interface_logger.throwArgumentError("cannot filter non-indexed parameters; must be null", ("contract." + param.name), value);
                }
                return;
            }
            if (value == null) {
                topics.push(null);
            }
            else if (param.baseType === "array" || param.baseType === "tuple") {
                interface_logger.throwArgumentError("filtering with tuples or arrays not supported", ("contract." + param.name), value);
            }
            else if (Array.isArray(value)) {
                topics.push(value.map((value) => encodeTopic(param, value)));
            }
            else {
                topics.push(encodeTopic(param, value));
            }
        });
        // Trim off trailing nulls
        while (topics.length && topics[topics.length - 1] === null) {
            topics.pop();
        }
        return topics;
    }
    encodeEventLog(eventFragment, values) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        const topics = [];
        const dataTypes = [];
        const dataValues = [];
        if (!eventFragment.anonymous) {
            topics.push(this.getEventTopic(eventFragment));
        }
        if (values.length !== eventFragment.inputs.length) {
            interface_logger.throwArgumentError("event arguments/values mismatch", "values", values);
        }
        eventFragment.inputs.forEach((param, index) => {
            const value = values[index];
            if (param.indexed) {
                if (param.type === "string") {
                    topics.push(Object(hash_lib_esm["a" /* id */])(value));
                }
                else if (param.type === "bytes") {
                    topics.push(Object(keccak256_lib_esm["a" /* keccak256 */])(value));
                }
                else if (param.baseType === "tuple" || param.baseType === "array") {
                    // @TOOD
                    throw new Error("not implemented");
                }
                else {
                    topics.push(this._abiCoder.encode([param.type], [value]));
                }
            }
            else {
                dataTypes.push(param);
                dataValues.push(value);
            }
        });
        return {
            data: this._abiCoder.encode(dataTypes, dataValues),
            topics: topics
        };
    }
    // Decode a filter for the event and the search criteria
    decodeEventLog(eventFragment, data, topics) {
        if (typeof (eventFragment) === "string") {
            eventFragment = this.getEvent(eventFragment);
        }
        if (topics != null && !eventFragment.anonymous) {
            let topicHash = this.getEventTopic(eventFragment);
            if (!Object(bytes_lib_esm["isHexString"])(topics[0], 32) || topics[0].toLowerCase() !== topicHash) {
                interface_logger.throwError("fragment/topic mismatch", logger_lib_esm["Logger"].errors.INVALID_ARGUMENT, { argument: "topics[0]", expected: topicHash, value: topics[0] });
            }
            topics = topics.slice(1);
        }
        let indexed = [];
        let nonIndexed = [];
        let dynamic = [];
        eventFragment.inputs.forEach((param, index) => {
            if (param.indexed) {
                if (param.type === "string" || param.type === "bytes" || param.baseType === "tuple" || param.baseType === "array") {
                    indexed.push(fragments_ParamType.fromObject({ type: "bytes32", name: param.name }));
                    dynamic.push(true);
                }
                else {
                    indexed.push(param);
                    dynamic.push(false);
                }
            }
            else {
                nonIndexed.push(param);
                dynamic.push(false);
            }
        });
        let resultIndexed = (topics != null) ? this._abiCoder.decode(indexed, Object(bytes_lib_esm["concat"])(topics)) : null;
        let resultNonIndexed = this._abiCoder.decode(nonIndexed, data);
        let result = [];
        let nonIndexedIndex = 0, indexedIndex = 0;
        eventFragment.inputs.forEach((param, index) => {
            if (param.indexed) {
                if (resultIndexed == null) {
                    result[index] = new interface_Indexed({ _isIndexed: true, hash: null });
                }
                else if (dynamic[index]) {
                    result[index] = new interface_Indexed({ _isIndexed: true, hash: resultIndexed[indexedIndex++] });
                }
                else {
                    try {
                        result[index] = resultIndexed[indexedIndex++];
                    }
                    catch (error) {
                        result[index] = error;
                    }
                }
            }
            else {
                try {
                    result[index] = resultNonIndexed[nonIndexedIndex++];
                }
                catch (error) {
                    result[index] = error;
                }
            }
            // Add the keyword argument if named and safe
            if (param.name && result[param.name] == null) {
                const value = result[index];
                // Make error named values throw on access
                if (value instanceof Error) {
                    Object.defineProperty(result, param.name, {
                        get: () => { throw wrapAccessError(`property ${JSON.stringify(param.name)}`, value); }
                    });
                }
                else {
                    result[param.name] = value;
                }
            }
        });
        // Make all error indexed values throw on access
        for (let i = 0; i < result.length; i++) {
            const value = result[i];
            if (value instanceof Error) {
                Object.defineProperty(result, i, {
                    get: () => { throw wrapAccessError(`index ${i}`, value); }
                });
            }
        }
        return Object.freeze(result);
    }
    // Given a transaction, find the matching function fragment (if any) and
    // determine all its properties and call parameters
    parseTransaction(tx) {
        let fragment = this.getFunction(tx.data.substring(0, 10).toLowerCase());
        if (!fragment) {
            return null;
        }
        return new interface_TransactionDescription({
            args: this._abiCoder.decode(fragment.inputs, "0x" + tx.data.substring(10)),
            functionFragment: fragment,
            name: fragment.name,
            signature: fragment.format(),
            sighash: this.getSighash(fragment),
            value: lib_esm["a" /* BigNumber */].from(tx.value || "0"),
        });
    }
    // Given an event log, find the matching event fragment (if any) and
    // determine all its properties and values
    parseLog(log) {
        let fragment = this.getEvent(log.topics[0]);
        if (!fragment || fragment.anonymous) {
            return null;
        }
        // @TODO: If anonymous, and the only method, and the input count matches, should we parse?
        //        Probably not, because just because it is the only event in the ABI does
        //        not mean we have the full ABI; maybe jsut a fragment?
        return new interface_LogDescription({
            eventFragment: fragment,
            name: fragment.name,
            signature: fragment.format(),
            topic: this.getEventTopic(fragment),
            args: this.decodeEventLog(fragment, log.data, log.topics)
        });
    }
    /*
    static from(value: Array<Fragment | string | JsonAbi> | string | Interface) {
        if (Interface.isInterface(value)) {
            return value;
        }
        if (typeof(value) === "string") {
            return new Interface(JSON.parse(value));
        }
        return new Interface(value);
    }
    */
    static isInterface(value) {
        return !!(value && value._isInterface);
    }
}

// CONCATENATED MODULE: ./node_modules/@ethersproject/abi/lib.esm/index.js







/***/ }),

/***/ 844:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, global) {/**
 * [js-sha3]{@link https://github.com/emn178/js-sha3}
 *
 * @version 0.5.7
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2015-2016
 * @license MIT
 */
/*jslint bitwise: true */
(function () {
  'use strict';

  var root = typeof window === 'object' ? window : {};
  var NODE_JS = !root.JS_SHA3_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
  if (NODE_JS) {
    root = global;
  }
  var COMMON_JS = !root.JS_SHA3_NO_COMMON_JS && typeof module === 'object' && module.exports;
  var HEX_CHARS = '0123456789abcdef'.split('');
  var SHAKE_PADDING = [31, 7936, 2031616, 520093696];
  var KECCAK_PADDING = [1, 256, 65536, 16777216];
  var PADDING = [6, 1536, 393216, 100663296];
  var SHIFT = [0, 8, 16, 24];
  var RC = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649,
            0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0,
            2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771,
            2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
            2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648];
  var BITS = [224, 256, 384, 512];
  var SHAKE_BITS = [128, 256];
  var OUTPUT_TYPES = ['hex', 'buffer', 'arrayBuffer', 'array'];

  var createOutputMethod = function (bits, padding, outputType) {
    return function (message) {
      return new Keccak(bits, padding, bits).update(message)[outputType]();
    };
  };

  var createShakeOutputMethod = function (bits, padding, outputType) {
    return function (message, outputBits) {
      return new Keccak(bits, padding, outputBits).update(message)[outputType]();
    };
  };

  var createMethod = function (bits, padding) {
    var method = createOutputMethod(bits, padding, 'hex');
    method.create = function () {
      return new Keccak(bits, padding, bits);
    };
    method.update = function (message) {
      return method.create().update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createOutputMethod(bits, padding, type);
    }
    return method;
  };

  var createShakeMethod = function (bits, padding) {
    var method = createShakeOutputMethod(bits, padding, 'hex');
    method.create = function (outputBits) {
      return new Keccak(bits, padding, outputBits);
    };
    method.update = function (message, outputBits) {
      return method.create(outputBits).update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createShakeOutputMethod(bits, padding, type);
    }
    return method;
  };

  var algorithms = [
    {name: 'keccak', padding: KECCAK_PADDING, bits: BITS, createMethod: createMethod},
    {name: 'sha3', padding: PADDING, bits: BITS, createMethod: createMethod},
    {name: 'shake', padding: SHAKE_PADDING, bits: SHAKE_BITS, createMethod: createShakeMethod}
  ];

  var methods = {}, methodNames = [];

  for (var i = 0; i < algorithms.length; ++i) {
    var algorithm = algorithms[i];
    var bits  = algorithm.bits;
    for (var j = 0; j < bits.length; ++j) {
      var methodName = algorithm.name +'_' + bits[j];
      methodNames.push(methodName);
      methods[methodName] = algorithm.createMethod(bits[j], algorithm.padding);
    }
  }

  function Keccak(bits, padding, outputBits) {
    this.blocks = [];
    this.s = [];
    this.padding = padding;
    this.outputBits = outputBits;
    this.reset = true;
    this.block = 0;
    this.start = 0;
    this.blockCount = (1600 - (bits << 1)) >> 5;
    this.byteCount = this.blockCount << 2;
    this.outputBlocks = outputBits >> 5;
    this.extraBytes = (outputBits & 31) >> 3;

    for (var i = 0; i < 50; ++i) {
      this.s[i] = 0;
    }
  }

  Keccak.prototype.update = function (message) {
    var notString = typeof message !== 'string';
    if (notString && message.constructor === ArrayBuffer) {
      message = new Uint8Array(message);
    }
    var length = message.length, blocks = this.blocks, byteCount = this.byteCount,
      blockCount = this.blockCount, index = 0, s = this.s, i, code;

    while (index < length) {
      if (this.reset) {
        this.reset = false;
        blocks[0] = this.block;
        for (i = 1; i < blockCount + 1; ++i) {
          blocks[i] = 0;
        }
      }
      if (notString) {
        for (i = this.start; index < length && i < byteCount; ++index) {
          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = this.start; index < length && i < byteCount; ++index) {
          code = message.charCodeAt(index);
          if (code < 0x80) {
            blocks[i >> 2] |= code << SHIFT[i++ & 3];
          } else if (code < 0x800) {
            blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else if (code < 0xd800 || code >= 0xe000) {
            blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else {
            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
            blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          }
        }
      }
      this.lastByteIndex = i;
      if (i >= byteCount) {
        this.start = i - byteCount;
        this.block = blocks[blockCount];
        for (i = 0; i < blockCount; ++i) {
          s[i] ^= blocks[i];
        }
        f(s);
        this.reset = true;
      } else {
        this.start = i;
      }
    }
    return this;
  };

  Keccak.prototype.finalize = function () {
    var blocks = this.blocks, i = this.lastByteIndex, blockCount = this.blockCount, s = this.s;
    blocks[i >> 2] |= this.padding[i & 3];
    if (this.lastByteIndex === this.byteCount) {
      blocks[0] = blocks[blockCount];
      for (i = 1; i < blockCount + 1; ++i) {
        blocks[i] = 0;
      }
    }
    blocks[blockCount - 1] |= 0x80000000;
    for (i = 0; i < blockCount; ++i) {
      s[i] ^= blocks[i];
    }
    f(s);
  };

  Keccak.prototype.toString = Keccak.prototype.hex = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
    var hex = '', block;
    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        block = s[i];
        hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F] +
               HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F] +
               HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F] +
               HEX_CHARS[(block >> 28) & 0x0F] + HEX_CHARS[(block >> 24) & 0x0F];
      }
      if (j % blockCount === 0) {
        f(s);
        i = 0;
      }
    }
    if (extraBytes) {
      block = s[i];
      if (extraBytes > 0) {
        hex += HEX_CHARS[(block >> 4) & 0x0F] + HEX_CHARS[block & 0x0F];
      }
      if (extraBytes > 1) {
        hex += HEX_CHARS[(block >> 12) & 0x0F] + HEX_CHARS[(block >> 8) & 0x0F];
      }
      if (extraBytes > 2) {
        hex += HEX_CHARS[(block >> 20) & 0x0F] + HEX_CHARS[(block >> 16) & 0x0F];
      }
    }
    return hex;
  };

  Keccak.prototype.arrayBuffer = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
    var bytes = this.outputBits >> 3;
    var buffer;
    if (extraBytes) {
      buffer = new ArrayBuffer((outputBlocks + 1) << 2);
    } else {
      buffer = new ArrayBuffer(bytes);
    }
    var array = new Uint32Array(buffer);
    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        array[j] = s[i];
      }
      if (j % blockCount === 0) {
        f(s);
      }
    }
    if (extraBytes) {
      array[i] = s[i];
      buffer = buffer.slice(0, bytes);
    }
    return buffer;
  };

  Keccak.prototype.buffer = Keccak.prototype.arrayBuffer;

  Keccak.prototype.digest = Keccak.prototype.array = function () {
    this.finalize();

    var blockCount = this.blockCount, s = this.s, outputBlocks = this.outputBlocks,
        extraBytes = this.extraBytes, i = 0, j = 0;
    var array = [], offset, block;
    while (j < outputBlocks) {
      for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
        offset = j << 2;
        block = s[i];
        array[offset] = block & 0xFF;
        array[offset + 1] = (block >> 8) & 0xFF;
        array[offset + 2] = (block >> 16) & 0xFF;
        array[offset + 3] = (block >> 24) & 0xFF;
      }
      if (j % blockCount === 0) {
        f(s);
      }
    }
    if (extraBytes) {
      offset = j << 2;
      block = s[i];
      if (extraBytes > 0) {
        array[offset] = block & 0xFF;
      }
      if (extraBytes > 1) {
        array[offset + 1] = (block >> 8) & 0xFF;
      }
      if (extraBytes > 2) {
        array[offset + 2] = (block >> 16) & 0xFF;
      }
    }
    return array;
  };

  var f = function (s) {
    var h, l, n, c0, c1, c2, c3, c4, c5, c6, c7, c8, c9,
        b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17,
        b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30, b31, b32, b33,
        b34, b35, b36, b37, b38, b39, b40, b41, b42, b43, b44, b45, b46, b47, b48, b49;
    for (n = 0; n < 48; n += 2) {
      c0 = s[0] ^ s[10] ^ s[20] ^ s[30] ^ s[40];
      c1 = s[1] ^ s[11] ^ s[21] ^ s[31] ^ s[41];
      c2 = s[2] ^ s[12] ^ s[22] ^ s[32] ^ s[42];
      c3 = s[3] ^ s[13] ^ s[23] ^ s[33] ^ s[43];
      c4 = s[4] ^ s[14] ^ s[24] ^ s[34] ^ s[44];
      c5 = s[5] ^ s[15] ^ s[25] ^ s[35] ^ s[45];
      c6 = s[6] ^ s[16] ^ s[26] ^ s[36] ^ s[46];
      c7 = s[7] ^ s[17] ^ s[27] ^ s[37] ^ s[47];
      c8 = s[8] ^ s[18] ^ s[28] ^ s[38] ^ s[48];
      c9 = s[9] ^ s[19] ^ s[29] ^ s[39] ^ s[49];

      h = c8 ^ ((c2 << 1) | (c3 >>> 31));
      l = c9 ^ ((c3 << 1) | (c2 >>> 31));
      s[0] ^= h;
      s[1] ^= l;
      s[10] ^= h;
      s[11] ^= l;
      s[20] ^= h;
      s[21] ^= l;
      s[30] ^= h;
      s[31] ^= l;
      s[40] ^= h;
      s[41] ^= l;
      h = c0 ^ ((c4 << 1) | (c5 >>> 31));
      l = c1 ^ ((c5 << 1) | (c4 >>> 31));
      s[2] ^= h;
      s[3] ^= l;
      s[12] ^= h;
      s[13] ^= l;
      s[22] ^= h;
      s[23] ^= l;
      s[32] ^= h;
      s[33] ^= l;
      s[42] ^= h;
      s[43] ^= l;
      h = c2 ^ ((c6 << 1) | (c7 >>> 31));
      l = c3 ^ ((c7 << 1) | (c6 >>> 31));
      s[4] ^= h;
      s[5] ^= l;
      s[14] ^= h;
      s[15] ^= l;
      s[24] ^= h;
      s[25] ^= l;
      s[34] ^= h;
      s[35] ^= l;
      s[44] ^= h;
      s[45] ^= l;
      h = c4 ^ ((c8 << 1) | (c9 >>> 31));
      l = c5 ^ ((c9 << 1) | (c8 >>> 31));
      s[6] ^= h;
      s[7] ^= l;
      s[16] ^= h;
      s[17] ^= l;
      s[26] ^= h;
      s[27] ^= l;
      s[36] ^= h;
      s[37] ^= l;
      s[46] ^= h;
      s[47] ^= l;
      h = c6 ^ ((c0 << 1) | (c1 >>> 31));
      l = c7 ^ ((c1 << 1) | (c0 >>> 31));
      s[8] ^= h;
      s[9] ^= l;
      s[18] ^= h;
      s[19] ^= l;
      s[28] ^= h;
      s[29] ^= l;
      s[38] ^= h;
      s[39] ^= l;
      s[48] ^= h;
      s[49] ^= l;

      b0 = s[0];
      b1 = s[1];
      b32 = (s[11] << 4) | (s[10] >>> 28);
      b33 = (s[10] << 4) | (s[11] >>> 28);
      b14 = (s[20] << 3) | (s[21] >>> 29);
      b15 = (s[21] << 3) | (s[20] >>> 29);
      b46 = (s[31] << 9) | (s[30] >>> 23);
      b47 = (s[30] << 9) | (s[31] >>> 23);
      b28 = (s[40] << 18) | (s[41] >>> 14);
      b29 = (s[41] << 18) | (s[40] >>> 14);
      b20 = (s[2] << 1) | (s[3] >>> 31);
      b21 = (s[3] << 1) | (s[2] >>> 31);
      b2 = (s[13] << 12) | (s[12] >>> 20);
      b3 = (s[12] << 12) | (s[13] >>> 20);
      b34 = (s[22] << 10) | (s[23] >>> 22);
      b35 = (s[23] << 10) | (s[22] >>> 22);
      b16 = (s[33] << 13) | (s[32] >>> 19);
      b17 = (s[32] << 13) | (s[33] >>> 19);
      b48 = (s[42] << 2) | (s[43] >>> 30);
      b49 = (s[43] << 2) | (s[42] >>> 30);
      b40 = (s[5] << 30) | (s[4] >>> 2);
      b41 = (s[4] << 30) | (s[5] >>> 2);
      b22 = (s[14] << 6) | (s[15] >>> 26);
      b23 = (s[15] << 6) | (s[14] >>> 26);
      b4 = (s[25] << 11) | (s[24] >>> 21);
      b5 = (s[24] << 11) | (s[25] >>> 21);
      b36 = (s[34] << 15) | (s[35] >>> 17);
      b37 = (s[35] << 15) | (s[34] >>> 17);
      b18 = (s[45] << 29) | (s[44] >>> 3);
      b19 = (s[44] << 29) | (s[45] >>> 3);
      b10 = (s[6] << 28) | (s[7] >>> 4);
      b11 = (s[7] << 28) | (s[6] >>> 4);
      b42 = (s[17] << 23) | (s[16] >>> 9);
      b43 = (s[16] << 23) | (s[17] >>> 9);
      b24 = (s[26] << 25) | (s[27] >>> 7);
      b25 = (s[27] << 25) | (s[26] >>> 7);
      b6 = (s[36] << 21) | (s[37] >>> 11);
      b7 = (s[37] << 21) | (s[36] >>> 11);
      b38 = (s[47] << 24) | (s[46] >>> 8);
      b39 = (s[46] << 24) | (s[47] >>> 8);
      b30 = (s[8] << 27) | (s[9] >>> 5);
      b31 = (s[9] << 27) | (s[8] >>> 5);
      b12 = (s[18] << 20) | (s[19] >>> 12);
      b13 = (s[19] << 20) | (s[18] >>> 12);
      b44 = (s[29] << 7) | (s[28] >>> 25);
      b45 = (s[28] << 7) | (s[29] >>> 25);
      b26 = (s[38] << 8) | (s[39] >>> 24);
      b27 = (s[39] << 8) | (s[38] >>> 24);
      b8 = (s[48] << 14) | (s[49] >>> 18);
      b9 = (s[49] << 14) | (s[48] >>> 18);

      s[0] = b0 ^ (~b2 & b4);
      s[1] = b1 ^ (~b3 & b5);
      s[10] = b10 ^ (~b12 & b14);
      s[11] = b11 ^ (~b13 & b15);
      s[20] = b20 ^ (~b22 & b24);
      s[21] = b21 ^ (~b23 & b25);
      s[30] = b30 ^ (~b32 & b34);
      s[31] = b31 ^ (~b33 & b35);
      s[40] = b40 ^ (~b42 & b44);
      s[41] = b41 ^ (~b43 & b45);
      s[2] = b2 ^ (~b4 & b6);
      s[3] = b3 ^ (~b5 & b7);
      s[12] = b12 ^ (~b14 & b16);
      s[13] = b13 ^ (~b15 & b17);
      s[22] = b22 ^ (~b24 & b26);
      s[23] = b23 ^ (~b25 & b27);
      s[32] = b32 ^ (~b34 & b36);
      s[33] = b33 ^ (~b35 & b37);
      s[42] = b42 ^ (~b44 & b46);
      s[43] = b43 ^ (~b45 & b47);
      s[4] = b4 ^ (~b6 & b8);
      s[5] = b5 ^ (~b7 & b9);
      s[14] = b14 ^ (~b16 & b18);
      s[15] = b15 ^ (~b17 & b19);
      s[24] = b24 ^ (~b26 & b28);
      s[25] = b25 ^ (~b27 & b29);
      s[34] = b34 ^ (~b36 & b38);
      s[35] = b35 ^ (~b37 & b39);
      s[44] = b44 ^ (~b46 & b48);
      s[45] = b45 ^ (~b47 & b49);
      s[6] = b6 ^ (~b8 & b0);
      s[7] = b7 ^ (~b9 & b1);
      s[16] = b16 ^ (~b18 & b10);
      s[17] = b17 ^ (~b19 & b11);
      s[26] = b26 ^ (~b28 & b20);
      s[27] = b27 ^ (~b29 & b21);
      s[36] = b36 ^ (~b38 & b30);
      s[37] = b37 ^ (~b39 & b31);
      s[46] = b46 ^ (~b48 & b40);
      s[47] = b47 ^ (~b49 & b41);
      s[8] = b8 ^ (~b0 & b2);
      s[9] = b9 ^ (~b1 & b3);
      s[18] = b18 ^ (~b10 & b12);
      s[19] = b19 ^ (~b11 & b13);
      s[28] = b28 ^ (~b20 & b22);
      s[29] = b29 ^ (~b21 & b23);
      s[38] = b38 ^ (~b30 & b32);
      s[39] = b39 ^ (~b31 & b33);
      s[48] = b48 ^ (~b40 & b42);
      s[49] = b49 ^ (~b41 & b43);

      s[0] ^= RC[n];
      s[1] ^= RC[n + 1];
    }
  };

  if (COMMON_JS) {
    module.exports = methods;
  } else {
    for (var i = 0; i < methodNames.length; ++i) {
      root[methodNames[i]] = methods[methodNames[i]];
    }
  }
})();

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(95), __webpack_require__(85)))

/***/ }),

/***/ 853:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var bytes_1 = __webpack_require__(6);
function decode(textData) {
    textData = atob(textData);
    var data = [];
    for (var i = 0; i < textData.length; i++) {
        data.push(textData.charCodeAt(i));
    }
    return bytes_1.arrayify(data);
}
exports.decode = decode;
function encode(data) {
    data = bytes_1.arrayify(data);
    var textData = "";
    for (var i = 0; i < data.length; i++) {
        textData += String.fromCharCode(data[i]);
    }
    return btoa(textData);
}
exports.encode = encode;
//# sourceMappingURL=browser.js.map

/***/ }),

/***/ 854:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Buffer) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return getUrl; });
/* harmony import */ var http__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(223);
/* harmony import */ var http__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(http__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var https__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(235);
/* harmony import */ var https__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(https__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var url__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(140);
/* harmony import */ var url__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(url__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6);
/* harmony import */ var _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(11);
/* harmony import */ var _version__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(524);

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};






const logger = new _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__["Logger"](_version__WEBPACK_IMPORTED_MODULE_5__[/* version */ "a"]);
function getResponse(request) {
    return new Promise((resolve, reject) => {
        request.once("response", (resp) => {
            const response = {
                statusCode: resp.statusCode,
                statusMessage: resp.statusMessage,
                headers: Object.keys(resp.headers).reduce((accum, name) => {
                    let value = resp.headers[name];
                    if (Array.isArray(value)) {
                        value = value.join(", ");
                    }
                    accum[name] = value;
                    return accum;
                }, {}),
                body: null
            };
            //resp.setEncoding("utf8");
            resp.on("data", (chunk) => {
                if (response.body == null) {
                    response.body = new Uint8Array(0);
                }
                response.body = Object(_ethersproject_bytes__WEBPACK_IMPORTED_MODULE_3__["concat"])([response.body, chunk]);
            });
            resp.on("end", () => {
                resolve(response);
            });
            resp.on("error", (error) => {
                /* istanbul ignore next */
                error.response = response;
                reject(error);
            });
        });
        request.on("error", (error) => { reject(error); });
    });
}
// The URL.parse uses null instead of the empty string
function nonnull(value) {
    if (value == null) {
        return "";
    }
    return value;
}
function getUrl(href, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (options == null) {
            options = {};
        }
        // @TODO: Once we drop support for node 8, we can pass the href
        //        firectly into request and skip adding the components
        //        to this request object
        const url = Object(url__WEBPACK_IMPORTED_MODULE_2__["parse"])(href);
        const request = {
            protocol: nonnull(url.protocol),
            hostname: nonnull(url.hostname),
            port: nonnull(url.port),
            path: (nonnull(url.pathname) + nonnull(url.search)),
            method: (options.method || "GET"),
            headers: (options.headers || {}),
        };
        let req = null;
        switch (nonnull(url.protocol)) {
            case "http:":
                req = http__WEBPACK_IMPORTED_MODULE_0___default.a.request(request);
                break;
            case "https:":
                req = https__WEBPACK_IMPORTED_MODULE_1___default.a.request(request);
                break;
            default:
                /* istanbul ignore next */
                logger.throwError(`unsupported protocol ${url.protocol}`, _ethersproject_logger__WEBPACK_IMPORTED_MODULE_4__["Logger"].errors.UNSUPPORTED_OPERATION, {
                    protocol: url.protocol,
                    operation: "request"
                });
        }
        if (options.body) {
            req.write(Buffer.from(options.body));
        }
        req.end();
        const response = yield getResponse(req);
        return response;
    });
}
//# sourceMappingURL=geturl.js.map
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(22).Buffer))

/***/ }),

/***/ 855:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {
Object.defineProperty(exports, "__esModule", { value: true });
var bytes_1 = __webpack_require__(6);
var logger_1 = __webpack_require__(11);
var _version_1 = __webpack_require__(1465);
var logger = new logger_1.Logger(_version_1.version);
var shuffle_1 = __webpack_require__(1466);
exports.shuffled = shuffle_1.shuffled;
var anyGlobal = null;
try {
    anyGlobal = window;
    if (anyGlobal == null) {
        throw new Error("try next");
    }
}
catch (error) {
    try {
        anyGlobal = global;
        if (anyGlobal == null) {
            throw new Error("try next");
        }
    }
    catch (error) {
        anyGlobal = {};
    }
}
var crypto = anyGlobal.crypto || anyGlobal.msCrypto;
if (!crypto || !crypto.getRandomValues) {
    logger.warn("WARNING: Missing strong random number source");
    crypto = {
        getRandomValues: function (buffer) {
            return logger.throwError("no secure random source avaialble", logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: "crypto.getRandomValues"
            });
        }
    };
}
function randomBytes(length) {
    if (length <= 0 || length > 1024 || (length % 1)) {
        logger.throwArgumentError("invalid length", "length", length);
    }
    var result = new Uint8Array(length);
    crypto.getRandomValues(result);
    return bytes_1.arrayify(result);
}
exports.randomBytes = randomBytes;
;
//# sourceMappingURL=browser.js.map
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(85)))

/***/ }),

/***/ 856:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

module.exports = {};
//# sourceMappingURL=browser-net.js.map

/***/ }),

/***/ 98:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return version; });
const version = "providers/5.0.9";
//# sourceMappingURL=_version.js.map

/***/ })

}]);