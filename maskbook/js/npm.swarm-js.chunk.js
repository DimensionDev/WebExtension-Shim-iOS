(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[121],{

/***/ 1437:
/***/ (function(module, exports, __webpack_require__) {

var unavailable = function unavailable() {
  throw "This swarm.js function isn't available on the browser.";
};

var fs = {
  readFile: unavailable
};
var files = {
  download: unavailable,
  safeDownloadArchived: unavailable,
  directoryTree: unavailable
};
var os = {
  platform: unavailable,
  arch: unavailable
};
var path = {
  join: unavailable,
  slice: unavailable
};
var child_process = {
  spawn: unavailable
};
var mimetype = {
  lookup: unavailable
};
var defaultArchives = {};
var downloadUrl = null;

var request = __webpack_require__(1438);

var bytes = __webpack_require__(771);

var hash = __webpack_require__(1451);

var pick = __webpack_require__(1453);

var swarm = __webpack_require__(1454);

module.exports = swarm({
  fs: fs,
  files: files,
  os: os,
  path: path,
  child_process: child_process,
  defaultArchives: defaultArchives,
  mimetype: mimetype,
  request: request,
  downloadUrl: downloadUrl,
  bytes: bytes,
  hash: hash,
  pick: pick
});

/***/ }),

/***/ 1450:
/***/ (function(module, exports) {

var generate = function generate(num, fn) {
  var a = [];
  for (var i = 0; i < num; ++i) {
    a.push(fn(i));
  }return a;
};

var replicate = function replicate(num, val) {
  return generate(num, function () {
    return val;
  });
};

var concat = function concat(a, b) {
  return a.concat(b);
};

var flatten = function flatten(a) {
  var r = [];
  for (var j = 0, J = a.length; j < J; ++j) {
    for (var i = 0, I = a[j].length; i < I; ++i) {
      r.push(a[j][i]);
    }
  }return r;
};

var chunksOf = function chunksOf(n, a) {
  var b = [];
  for (var i = 0, l = a.length; i < l; i += n) {
    b.push(a.slice(i, i + n));
  }return b;
};

module.exports = {
  generate: generate,
  replicate: replicate,
  concat: concat,
  flatten: flatten,
  chunksOf: chunksOf
};

/***/ }),

/***/ 1451:
/***/ (function(module, exports, __webpack_require__) {

// Thanks https://github.com/axic/swarmhash
var keccak = __webpack_require__(1452).keccak256;

var Bytes = __webpack_require__(771);

var swarmHashBlock = function swarmHashBlock(length, data) {
  var lengthEncoded = Bytes.reverse(Bytes.pad(6, Bytes.fromNumber(length)));
  var bytes = Bytes.flatten([lengthEncoded, "0x0000", data]);
  return keccak(bytes).slice(2);
}; // (Bytes | Uint8Array | String) -> String


var swarmHash = function swarmHash(data) {
  if (typeof data === "string" && data.slice(0, 2) !== "0x") {
    data = Bytes.fromString(data);
  } else if (typeof data !== "string" && data.length !== undefined) {
    data = Bytes.fromUint8Array(data);
  }

  var length = Bytes.length(data);

  if (length <= 4096) {
    return swarmHashBlock(length, data);
  }

  var maxSize = 4096;

  while (maxSize * (4096 / 32) < length) {
    maxSize *= 4096 / 32;
  }

  var innerNodes = [];

  for (var i = 0; i < length; i += maxSize) {
    var size = maxSize < length - i ? maxSize : length - i;
    innerNodes.push(swarmHash(Bytes.slice(data, i, i + size)));
  }

  return swarmHashBlock(length, Bytes.flatten(innerNodes));
};

module.exports = swarmHash;

/***/ }),

/***/ 1452:
/***/ (function(module, exports) {

// This was ported from https://github.com/emn178/js-sha3, with some minor
// modifications and pruning. It is licensed under MIT:
//
// Copyright 2015-2016 Chen, Yi-Cyuan
//  
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var HEX_CHARS = '0123456789abcdef'.split('');
var KECCAK_PADDING = [1, 256, 65536, 16777216];
var SHIFT = [0, 8, 16, 24];
var RC = [1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648, 32907, 0, 2147483649, 0, 2147516545, 2147483648, 32777, 2147483648, 138, 0, 136, 0, 2147516425, 0, 2147483658, 0, 2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771, 2147483648, 32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648, 2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648];

var Keccak = function Keccak(bits) {
  return {
    blocks: [],
    reset: true,
    block: 0,
    start: 0,
    blockCount: 1600 - (bits << 1) >> 5,
    outputBlocks: bits >> 5,
    s: function (s) {
      return [].concat(s, s, s, s, s);
    }([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  };
};

var update = function update(state, message) {
  var length = message.length,
      blocks = state.blocks,
      byteCount = state.blockCount << 2,
      blockCount = state.blockCount,
      outputBlocks = state.outputBlocks,
      s = state.s,
      index = 0,
      i,
      code;

  // update
  while (index < length) {
    if (state.reset) {
      state.reset = false;
      blocks[0] = state.block;
      for (i = 1; i < blockCount + 1; ++i) {
        blocks[i] = 0;
      }
    }
    if (typeof message !== "string") {
      for (i = state.start; index < length && i < byteCount; ++index) {
        blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
      }
    } else {
      for (i = state.start; index < length && i < byteCount; ++index) {
        code = message.charCodeAt(index);
        if (code < 0x80) {
          blocks[i >> 2] |= code << SHIFT[i++ & 3];
        } else if (code < 0x800) {
          blocks[i >> 2] |= (0xc0 | code >> 6) << SHIFT[i++ & 3];
          blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
        } else if (code < 0xd800 || code >= 0xe000) {
          blocks[i >> 2] |= (0xe0 | code >> 12) << SHIFT[i++ & 3];
          blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
          blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
        } else {
          code = 0x10000 + ((code & 0x3ff) << 10 | message.charCodeAt(++index) & 0x3ff);
          blocks[i >> 2] |= (0xf0 | code >> 18) << SHIFT[i++ & 3];
          blocks[i >> 2] |= (0x80 | code >> 12 & 0x3f) << SHIFT[i++ & 3];
          blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
          blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
        }
      }
    }
    state.lastByteIndex = i;
    if (i >= byteCount) {
      state.start = i - byteCount;
      state.block = blocks[blockCount];
      for (i = 0; i < blockCount; ++i) {
        s[i] ^= blocks[i];
      }
      f(s);
      state.reset = true;
    } else {
      state.start = i;
    }
  }

  // finalize
  i = state.lastByteIndex;
  blocks[i >> 2] |= KECCAK_PADDING[i & 3];
  if (state.lastByteIndex === byteCount) {
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

  // toString
  var hex = '',
      i = 0,
      j = 0,
      block;
  while (j < outputBlocks) {
    for (i = 0; i < blockCount && j < outputBlocks; ++i, ++j) {
      block = s[i];
      hex += HEX_CHARS[block >> 4 & 0x0F] + HEX_CHARS[block & 0x0F] + HEX_CHARS[block >> 12 & 0x0F] + HEX_CHARS[block >> 8 & 0x0F] + HEX_CHARS[block >> 20 & 0x0F] + HEX_CHARS[block >> 16 & 0x0F] + HEX_CHARS[block >> 28 & 0x0F] + HEX_CHARS[block >> 24 & 0x0F];
    }
    if (j % blockCount === 0) {
      f(s);
      i = 0;
    }
  }
  return "0x" + hex;
};

var f = function f(s) {
  var h, l, n, c0, c1, c2, c3, c4, c5, c6, c7, c8, c9, b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17, b18, b19, b20, b21, b22, b23, b24, b25, b26, b27, b28, b29, b30, b31, b32, b33, b34, b35, b36, b37, b38, b39, b40, b41, b42, b43, b44, b45, b46, b47, b48, b49;

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

    h = c8 ^ (c2 << 1 | c3 >>> 31);
    l = c9 ^ (c3 << 1 | c2 >>> 31);
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
    h = c0 ^ (c4 << 1 | c5 >>> 31);
    l = c1 ^ (c5 << 1 | c4 >>> 31);
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
    h = c2 ^ (c6 << 1 | c7 >>> 31);
    l = c3 ^ (c7 << 1 | c6 >>> 31);
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
    h = c4 ^ (c8 << 1 | c9 >>> 31);
    l = c5 ^ (c9 << 1 | c8 >>> 31);
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
    h = c6 ^ (c0 << 1 | c1 >>> 31);
    l = c7 ^ (c1 << 1 | c0 >>> 31);
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
    b32 = s[11] << 4 | s[10] >>> 28;
    b33 = s[10] << 4 | s[11] >>> 28;
    b14 = s[20] << 3 | s[21] >>> 29;
    b15 = s[21] << 3 | s[20] >>> 29;
    b46 = s[31] << 9 | s[30] >>> 23;
    b47 = s[30] << 9 | s[31] >>> 23;
    b28 = s[40] << 18 | s[41] >>> 14;
    b29 = s[41] << 18 | s[40] >>> 14;
    b20 = s[2] << 1 | s[3] >>> 31;
    b21 = s[3] << 1 | s[2] >>> 31;
    b2 = s[13] << 12 | s[12] >>> 20;
    b3 = s[12] << 12 | s[13] >>> 20;
    b34 = s[22] << 10 | s[23] >>> 22;
    b35 = s[23] << 10 | s[22] >>> 22;
    b16 = s[33] << 13 | s[32] >>> 19;
    b17 = s[32] << 13 | s[33] >>> 19;
    b48 = s[42] << 2 | s[43] >>> 30;
    b49 = s[43] << 2 | s[42] >>> 30;
    b40 = s[5] << 30 | s[4] >>> 2;
    b41 = s[4] << 30 | s[5] >>> 2;
    b22 = s[14] << 6 | s[15] >>> 26;
    b23 = s[15] << 6 | s[14] >>> 26;
    b4 = s[25] << 11 | s[24] >>> 21;
    b5 = s[24] << 11 | s[25] >>> 21;
    b36 = s[34] << 15 | s[35] >>> 17;
    b37 = s[35] << 15 | s[34] >>> 17;
    b18 = s[45] << 29 | s[44] >>> 3;
    b19 = s[44] << 29 | s[45] >>> 3;
    b10 = s[6] << 28 | s[7] >>> 4;
    b11 = s[7] << 28 | s[6] >>> 4;
    b42 = s[17] << 23 | s[16] >>> 9;
    b43 = s[16] << 23 | s[17] >>> 9;
    b24 = s[26] << 25 | s[27] >>> 7;
    b25 = s[27] << 25 | s[26] >>> 7;
    b6 = s[36] << 21 | s[37] >>> 11;
    b7 = s[37] << 21 | s[36] >>> 11;
    b38 = s[47] << 24 | s[46] >>> 8;
    b39 = s[46] << 24 | s[47] >>> 8;
    b30 = s[8] << 27 | s[9] >>> 5;
    b31 = s[9] << 27 | s[8] >>> 5;
    b12 = s[18] << 20 | s[19] >>> 12;
    b13 = s[19] << 20 | s[18] >>> 12;
    b44 = s[29] << 7 | s[28] >>> 25;
    b45 = s[28] << 7 | s[29] >>> 25;
    b26 = s[38] << 8 | s[39] >>> 24;
    b27 = s[39] << 8 | s[38] >>> 24;
    b8 = s[48] << 14 | s[49] >>> 18;
    b9 = s[49] << 14 | s[48] >>> 18;

    s[0] = b0 ^ ~b2 & b4;
    s[1] = b1 ^ ~b3 & b5;
    s[10] = b10 ^ ~b12 & b14;
    s[11] = b11 ^ ~b13 & b15;
    s[20] = b20 ^ ~b22 & b24;
    s[21] = b21 ^ ~b23 & b25;
    s[30] = b30 ^ ~b32 & b34;
    s[31] = b31 ^ ~b33 & b35;
    s[40] = b40 ^ ~b42 & b44;
    s[41] = b41 ^ ~b43 & b45;
    s[2] = b2 ^ ~b4 & b6;
    s[3] = b3 ^ ~b5 & b7;
    s[12] = b12 ^ ~b14 & b16;
    s[13] = b13 ^ ~b15 & b17;
    s[22] = b22 ^ ~b24 & b26;
    s[23] = b23 ^ ~b25 & b27;
    s[32] = b32 ^ ~b34 & b36;
    s[33] = b33 ^ ~b35 & b37;
    s[42] = b42 ^ ~b44 & b46;
    s[43] = b43 ^ ~b45 & b47;
    s[4] = b4 ^ ~b6 & b8;
    s[5] = b5 ^ ~b7 & b9;
    s[14] = b14 ^ ~b16 & b18;
    s[15] = b15 ^ ~b17 & b19;
    s[24] = b24 ^ ~b26 & b28;
    s[25] = b25 ^ ~b27 & b29;
    s[34] = b34 ^ ~b36 & b38;
    s[35] = b35 ^ ~b37 & b39;
    s[44] = b44 ^ ~b46 & b48;
    s[45] = b45 ^ ~b47 & b49;
    s[6] = b6 ^ ~b8 & b0;
    s[7] = b7 ^ ~b9 & b1;
    s[16] = b16 ^ ~b18 & b10;
    s[17] = b17 ^ ~b19 & b11;
    s[26] = b26 ^ ~b28 & b20;
    s[27] = b27 ^ ~b29 & b21;
    s[36] = b36 ^ ~b38 & b30;
    s[37] = b37 ^ ~b39 & b31;
    s[46] = b46 ^ ~b48 & b40;
    s[47] = b47 ^ ~b49 & b41;
    s[8] = b8 ^ ~b0 & b2;
    s[9] = b9 ^ ~b1 & b3;
    s[18] = b18 ^ ~b10 & b12;
    s[19] = b19 ^ ~b11 & b13;
    s[28] = b28 ^ ~b20 & b22;
    s[29] = b29 ^ ~b21 & b23;
    s[38] = b38 ^ ~b30 & b32;
    s[39] = b39 ^ ~b31 & b33;
    s[48] = b48 ^ ~b40 & b42;
    s[49] = b49 ^ ~b41 & b43;

    s[0] ^= RC[n];
    s[1] ^= RC[n + 1];
  }
};

var keccak = function keccak(bits) {
  return function (str) {
    var msg;
    if (str.slice(0, 2) === "0x") {
      msg = [];
      for (var i = 2, l = str.length; i < l; i += 2) {
        msg.push(parseInt(str.slice(i, i + 2), 16));
      }
    } else {
      msg = str;
    }
    return update(Keccak(bits, bits), msg);
  };
};

module.exports = {
  keccak256: keccak(256),
  keccak512: keccak(512),
  keccak256s: keccak(256),
  keccak512s: keccak(512)
};

/***/ }),

/***/ 1453:
/***/ (function(module, exports) {

var picker = function picker(type) {
  return function () {
    return new Promise(function (resolve, reject) {
      var fileLoader = function fileLoader(e) {
        var directory = {};
        var totalFiles = e.target.files.length;
        var loadedFiles = 0;
        [].map.call(e.target.files, function (file) {
          var reader = new FileReader();

          reader.onload = function (e) {
            var data = new Uint8Array(e.target.result);

            if (type === "directory") {
              var path = file.webkitRelativePath;
              directory[path.slice(path.indexOf("/") + 1)] = {
                type: "text/plain",
                data: data
              };
              if (++loadedFiles === totalFiles) resolve(directory);
            } else if (type === "file") {
              var _path = file.webkitRelativePath;
              resolve({
                "type": mimetype.lookup(_path),
                "data": data
              });
            } else {
              resolve(data);
            }
          };

          reader.readAsArrayBuffer(file);
        });
      };

      var fileInput;

      if (type === "directory") {
        fileInput = document.createElement("input");
        fileInput.addEventListener("change", fileLoader);
        fileInput.type = "file";
        fileInput.webkitdirectory = true;
        fileInput.mozdirectory = true;
        fileInput.msdirectory = true;
        fileInput.odirectory = true;
        fileInput.directory = true;
      } else {
        fileInput = document.createElement("input");
        fileInput.addEventListener("change", fileLoader);
        fileInput.type = "file";
      }

      ;
      var mouseEvent = document.createEvent("MouseEvents");
      mouseEvent.initEvent("click", true, false);
      fileInput.dispatchEvent(mouseEvent);
    });
  };
};

module.exports = {
  data: picker("data"),
  file: picker("file"),
  directory: picker("directory")
};

/***/ }),

/***/ 1454:
/***/ (function(module, exports) {

// TODO: this is a temporary fix to hide those libraries from the browser. A
// slightly better long-term solution would be to split this file into two,
// separating the functions that are used on Node.js from the functions that
// are used only on the browser.
module.exports = function (_ref) {
  var fs = _ref.fs,
      files = _ref.files,
      os = _ref.os,
      path = _ref.path,
      child_process = _ref.child_process,
      mimetype = _ref.mimetype,
      defaultArchives = _ref.defaultArchives,
      request = _ref.request,
      downloadUrl = _ref.downloadUrl,
      bytes = _ref.bytes,
      hash = _ref.hash,
      pick = _ref.pick;

  // ∀ a . String -> JSON -> Map String a -o Map String a
  //   Inserts a key/val pair in an object impurely.
  var impureInsert = function impureInsert(key) {
    return function (val) {
      return function (map) {
        return map[key] = val, map;
      };
    };
  }; // String -> JSON -> Map String JSON
  //   Merges an array of keys and an array of vals into an object.


  var toMap = function toMap(keys) {
    return function (vals) {
      var map = {};

      for (var i = 0, l = keys.length; i < l; ++i) {
        map[keys[i]] = vals[i];
      }

      return map;
    };
  }; // ∀ a . Map String a -> Map String a -> Map String a
  //   Merges two maps into one.


  var merge = function merge(a) {
    return function (b) {
      var map = {};

      for (var key in a) {
        map[key] = a[key];
      }

      for (var _key in b) {
        map[_key] = b[_key];
      }

      return map;
    };
  }; // ∀ a . [a] -> [a] -> Bool


  var equals = function equals(a) {
    return function (b) {
      if (a.length !== b.length) {
        return false;
      } else {
        for (var i = 0, l = a.length; i < l; ++i) {
          if (a[i] !== b[i]) return false;
        }
      }

      return true;
    };
  }; // String -> String -> String


  var rawUrl = function rawUrl(swarmUrl) {
    return function (hash) {
      return "".concat(swarmUrl, "/bzz-raw:/").concat(hash);
    };
  }; // String -> String -> Promise Uint8Array
  //   Gets the raw contents of a Swarm hash address.


  var downloadData = function downloadData(swarmUrl) {
    return function (hash) {
      return new Promise(function (resolve, reject) {
        request(rawUrl(swarmUrl)(hash), {
          responseType: "arraybuffer"
        }, function (err, arrayBuffer, response) {
          if (err) {
            return reject(err);
          }

          if (response.statusCode >= 400) {
            return reject(new Error("Error ".concat(response.statusCode, ".")));
          }

          return resolve(new Uint8Array(arrayBuffer));
        });
      });
    };
  }; // type Entry = {"type": String, "hash": String}
  // type File = {"type": String, "data": Uint8Array}
  // String -> String -> Promise (Map String Entry)
  //   Solves the manifest of a Swarm address recursively.
  //   Returns a map from full paths to entries.


  var downloadEntries = function downloadEntries(swarmUrl) {
    return function (hash) {
      var search = function search(hash) {
        return function (path) {
          return function (routes) {
            // Formats an entry to the Swarm.js type.
            var format = function format(entry) {
              return {
                type: entry.contentType,
                hash: entry.hash
              };
            }; // To download a single entry:
            //   if type is bzz-manifest, go deeper
            //   if not, add it to the routing table


            var downloadEntry = function downloadEntry(entry) {
              if (entry.path === undefined) {
                return Promise.resolve();
              } else {
                return entry.contentType === "application/bzz-manifest+json" ? search(entry.hash)(path + entry.path)(routes) : Promise.resolve(impureInsert(path + entry.path)(format(entry))(routes));
              }
            }; // Downloads the initial manifest and then each entry.


            return downloadData(swarmUrl)(hash).then(function (text) {
              return JSON.parse(toString(text)).entries;
            }).then(function (entries) {
              return Promise.all(entries.map(downloadEntry));
            }).then(function () {
              return routes;
            });
          };
        };
      };

      return search(hash)("")({});
    };
  }; // String -> String -> Promise (Map String String)
  //   Same as `downloadEntries`, but returns only hashes (no types).


  var downloadRoutes = function downloadRoutes(swarmUrl) {
    return function (hash) {
      return downloadEntries(swarmUrl)(hash).then(function (entries) {
        return toMap(Object.keys(entries))(Object.keys(entries).map(function (route) {
          return entries[route].hash;
        }));
      });
    };
  }; // String -> String -> Promise (Map String File)
  //   Gets the entire directory tree in a Swarm address.
  //   Returns a promise mapping paths to file contents.


  var downloadDirectory = function downloadDirectory(swarmUrl) {
    return function (hash) {
      return downloadEntries(swarmUrl)(hash).then(function (entries) {
        var paths = Object.keys(entries);
        var hashs = paths.map(function (path) {
          return entries[path].hash;
        });
        var types = paths.map(function (path) {
          return entries[path].type;
        });
        var datas = hashs.map(downloadData(swarmUrl));

        var files = function files(datas) {
          return datas.map(function (data, i) {
            return {
              type: types[i],
              data: data
            };
          });
        };

        return Promise.all(datas).then(function (datas) {
          return toMap(paths)(files(datas));
        });
      });
    };
  }; // String -> String -> String -> Promise String
  //   Gets the raw contents of a Swarm hash address.
  //   Returns a promise with the downloaded file path.


  var downloadDataToDisk = function downloadDataToDisk(swarmUrl) {
    return function (hash) {
      return function (filePath) {
        return files.download(rawUrl(swarmUrl)(hash))(filePath);
      };
    };
  }; // String -> String -> String -> Promise (Map String String)
  //   Gets the entire directory tree in a Swarm address.
  //   Returns a promise mapping paths to file contents.


  var downloadDirectoryToDisk = function downloadDirectoryToDisk(swarmUrl) {
    return function (hash) {
      return function (dirPath) {
        return downloadRoutes(swarmUrl)(hash).then(function (routingTable) {
          var downloads = [];

          for (var route in routingTable) {
            if (route.length > 0) {
              var filePath = path.join(dirPath, route);
              downloads.push(downloadDataToDisk(swarmUrl)(routingTable[route])(filePath));
            }

            ;
          }

          ;
          return Promise.all(downloads).then(function () {
            return dirPath;
          });
        });
      };
    };
  }; // String -> Uint8Array -> Promise String
  //   Uploads raw data to Swarm.
  //   Returns a promise with the uploaded hash.


  var uploadData = function uploadData(swarmUrl) {
    return function (data) {
      return new Promise(function (resolve, reject) {
        var params = {
          body: typeof data === "string" ? fromString(data) : data,
          method: "POST"
        };
        request("".concat(swarmUrl, "/bzz-raw:/"), params, function (err, data) {
          if (err) {
            return reject(err);
          }

          return resolve(data);
        });
      });
    };
  }; // String -> String -> String -> File -> Promise String
  //   Uploads a file to the Swarm manifest at a given hash, under a specific
  //   route. Returns a promise containing the uploaded hash.
  //   FIXME: for some reasons Swarm-Gateways is sometimes returning
  //   error 404 (bad request), so we retry up to 3 times. Why?


  var uploadToManifest = function uploadToManifest(swarmUrl) {
    return function (hash) {
      return function (route) {
        return function (file) {
          var attempt = function attempt(n) {
            var slashRoute = route[0] === "/" ? route : "/" + route;
            var url = "".concat(swarmUrl, "/bzz:/").concat(hash).concat(slashRoute);
            var opt = {
              method: "PUT",
              headers: {
                "Content-Type": file.type
              },
              body: file.data
            };
            return new Promise(function (resolve, reject) {
              request(url, opt, function (err, data) {
                if (err) {
                  return reject(err);
                }

                if (data.indexOf("error") !== -1) {
                  return reject(data);
                }

                return resolve(data);
              });
            })["catch"](function (e) {
              return n > 0 && attempt(n - 1);
            });
          };

          return attempt(3);
        };
      };
    };
  }; // String -> {type: String, data: Uint8Array} -> Promise String


  var uploadFile = function uploadFile(swarmUrl) {
    return function (file) {
      return uploadDirectory(swarmUrl)({
        "": file
      });
    };
  }; // String -> String -> Promise String


  var uploadFileFromDisk = function uploadFileFromDisk(swarmUrl) {
    return function (filePath) {
      return fs.readFile(filePath).then(function (data) {
        return uploadFile(swarmUrl)({
          type: mimetype.lookup(filePath),
          data: data
        });
      });
    };
  }; // String -> Map String File -> Promise String
  //   Uploads a directory to Swarm. The directory is
  //   represented as a map of routes and files.
  //   A default path is encoded by having a "" route.


  var uploadDirectory = function uploadDirectory(swarmUrl) {
    return function (directory) {
      return uploadData(swarmUrl)("{}").then(function (hash) {
        var uploadRoute = function uploadRoute(route) {
          return function (hash) {
            return uploadToManifest(swarmUrl)(hash)(route)(directory[route]);
          };
        };

        var uploadToHash = function uploadToHash(hash, route) {
          return hash.then(uploadRoute(route));
        };

        return Object.keys(directory).reduce(uploadToHash, Promise.resolve(hash));
      });
    };
  }; // String -> Promise String


  var uploadDataFromDisk = function uploadDataFromDisk(swarmUrl) {
    return function (filePath) {
      return fs.readFile(filePath).then(uploadData(swarmUrl));
    };
  }; // String -> Nullable String -> String -> Promise String


  var uploadDirectoryFromDisk = function uploadDirectoryFromDisk(swarmUrl) {
    return function (defaultPath) {
      return function (dirPath) {
        return files.directoryTree(dirPath).then(function (fullPaths) {
          return Promise.all(fullPaths.map(function (path) {
            return fs.readFile(path);
          })).then(function (datas) {
            var paths = fullPaths.map(function (path) {
              return path.slice(dirPath.length);
            });
            var types = fullPaths.map(function (path) {
              return mimetype.lookup(path) || "text/plain";
            });
            return toMap(paths)(datas.map(function (data, i) {
              return {
                type: types[i],
                data: data
              };
            }));
          });
        }).then(function (directory) {
          return merge(defaultPath ? {
            "": directory[defaultPath]
          } : {})(directory);
        }).then(uploadDirectory(swarmUrl));
      };
    };
  }; // String -> UploadInfo -> Promise String
  //   Simplified multi-type upload which calls the correct
  //   one based on the type of the argument given.


  var _upload = function upload(swarmUrl) {
    return function (arg) {
      // Upload raw data from browser
      if (arg.pick === "data") {
        return pick.data().then(uploadData(swarmUrl)); // Upload a file from browser
      } else if (arg.pick === "file") {
        return pick.file().then(uploadFile(swarmUrl)); // Upload a directory from browser
      } else if (arg.pick === "directory") {
        return pick.directory().then(uploadDirectory(swarmUrl)); // Upload directory/file from disk
      } else if (arg.path) {
        switch (arg.kind) {
          case "data":
            return uploadDataFromDisk(swarmUrl)(arg.path);

          case "file":
            return uploadFileFromDisk(swarmUrl)(arg.path);

          case "directory":
            return uploadDirectoryFromDisk(swarmUrl)(arg.defaultFile)(arg.path);
        }

        ; // Upload UTF-8 string or raw data (buffer)
      } else if (arg.length || typeof arg === "string") {
        return uploadData(swarmUrl)(arg); // Upload directory with JSON
      } else if (arg instanceof Object) {
        return uploadDirectory(swarmUrl)(arg);
      }

      return Promise.reject(new Error("Bad arguments"));
    };
  }; // String -> String -> Nullable String -> Promise (String | Uint8Array | Map String Uint8Array)
  //   Simplified multi-type download which calls the correct function based on
  //   the type of the argument given, and on whether the Swwarm address has a
  //   directory or a file.


  var _download = function download(swarmUrl) {
    return function (hash) {
      return function (path) {
        return isDirectory(swarmUrl)(hash).then(function (isDir) {
          if (isDir) {
            return path ? downloadDirectoryToDisk(swarmUrl)(hash)(path) : downloadDirectory(swarmUrl)(hash);
          } else {
            return path ? downloadDataToDisk(swarmUrl)(hash)(path) : downloadData(swarmUrl)(hash);
          }
        });
      };
    };
  }; // String -> Promise String
  //   Downloads the Swarm binaries into a path. Returns a promise that only
  //   resolves when the exact Swarm file is there, and verified to be correct.
  //   If it was already there to begin with, skips the download.


  var downloadBinary = function downloadBinary(path, archives) {
    var system = os.platform().replace("win32", "windows") + "-" + (os.arch() === "x64" ? "amd64" : "386");
    var archive = (archives || defaultArchives)[system];
    var archiveUrl = downloadUrl + archive.archive + ".tar.gz";
    var archiveMD5 = archive.archiveMD5;
    var binaryMD5 = archive.binaryMD5;
    return files.safeDownloadArchived(archiveUrl)(archiveMD5)(binaryMD5)(path);
  }; // type SwarmSetup = {
  //   account : String,
  //   password : String,
  //   dataDir : String,
  //   binPath : String,
  //   ensApi : String,
  //   onDownloadProgress : Number ~> (),
  //   archives : [{
  //     archive: String,
  //     binaryMD5: String,
  //     archiveMD5: String
  //   }]
  // }
  // SwarmSetup ~> Promise Process
  //   Starts the Swarm process.


  var startProcess = function startProcess(swarmSetup) {
    return new Promise(function (resolve, reject) {
      var spawn = child_process.spawn;

      var hasString = function hasString(str) {
        return function (buffer) {
          return ('' + buffer).indexOf(str) !== -1;
        };
      };

      var account = swarmSetup.account,
          password = swarmSetup.password,
          dataDir = swarmSetup.dataDir,
          ensApi = swarmSetup.ensApi,
          privateKey = swarmSetup.privateKey;
      var STARTUP_TIMEOUT_SECS = 3;
      var WAITING_PASSWORD = 0;
      var STARTING = 1;
      var LISTENING = 2;
      var PASSWORD_PROMPT_HOOK = "Passphrase";
      var LISTENING_HOOK = "Swarm http proxy started";
      var state = WAITING_PASSWORD;
      var swarmProcess = spawn(swarmSetup.binPath, ['--bzzaccount', account || privateKey, '--datadir', dataDir, '--ens-api', ensApi]);

      var handleProcessOutput = function handleProcessOutput(data) {
        if (state === WAITING_PASSWORD && hasString(PASSWORD_PROMPT_HOOK)(data)) {
          setTimeout(function () {
            state = STARTING;
            swarmProcess.stdin.write(password + '\n');
          }, 500);
        } else if (hasString(LISTENING_HOOK)(data)) {
          state = LISTENING;
          clearTimeout(timeout);
          resolve(swarmProcess);
        }
      };

      swarmProcess.stdout.on('data', handleProcessOutput);
      swarmProcess.stderr.on('data', handleProcessOutput); //swarmProcess.on('close', () => setTimeout(restart, 2000));

      var restart = function restart() {
        return startProcess(swarmSetup).then(resolve)["catch"](reject);
      };

      var error = function error() {
        return reject(new Error("Couldn't start swarm process."));
      };

      var timeout = setTimeout(error, 20000);
    });
  }; // Process ~> Promise ()
  //   Stops the Swarm process.


  var stopProcess = function stopProcess(process) {
    return new Promise(function (resolve, reject) {
      process.stderr.removeAllListeners('data');
      process.stdout.removeAllListeners('data');
      process.stdin.removeAllListeners('error');
      process.removeAllListeners('error');
      process.removeAllListeners('exit');
      process.kill('SIGINT');
      var killTimeout = setTimeout(function () {
        return process.kill('SIGKILL');
      }, 8000);
      process.once('close', function () {
        clearTimeout(killTimeout);
        resolve();
      });
    });
  }; // SwarmSetup -> (SwarmAPI -> Promise ()) -> Promise ()
  //   Receives a Swarm configuration object and a callback function. It then
  //   checks if a local Swarm node is running. If no local Swarm is found, it
  //   downloads the Swarm binaries to the dataDir (if not there), checksums,
  //   starts the Swarm process and calls the callback function with an API
  //   object using the local node. That callback must return a promise which
  //   will resolve when it is done using the API, so that this function can
  //   close the Swarm process properly. Returns a promise that resolves when the
  //   user is done with the API and the Swarm process is closed.
  //   TODO: check if Swarm process is already running (improve `isAvailable`)


  var local = function local(swarmSetup) {
    return function (useAPI) {
      return _isAvailable("http://localhost:8500").then(function (isAvailable) {
        return isAvailable ? useAPI(at("http://localhost:8500")).then(function () {}) : downloadBinary(swarmSetup.binPath, swarmSetup.archives).onData(function (data) {
          return (swarmSetup.onProgress || function () {})(data.length);
        }).then(function () {
          return startProcess(swarmSetup);
        }).then(function (process) {
          return useAPI(at("http://localhost:8500")).then(function () {
            return process;
          });
        }).then(stopProcess);
      });
    };
  }; // String ~> Promise Bool
  //   Returns true if Swarm is available on `url`.
  //   Perfoms a test upload to determine that.
  //   TODO: improve this?


  var _isAvailable = function isAvailable(swarmUrl) {
    var testFile = "test";
    var testHash = "c9a99c7d326dcc6316f32fe2625b311f6dc49a175e6877681ded93137d3569e7";
    return uploadData(swarmUrl)(testFile).then(function (hash) {
      return hash === testHash;
    })["catch"](function () {
      return false;
    });
  }; // String -> String ~> Promise Bool
  //   Returns a Promise which is true if that Swarm address is a directory.
  //   Determines that by checking that it (i) is a JSON, (ii) has a .entries.
  //   TODO: improve this?


  var isDirectory = function isDirectory(swarmUrl) {
    return function (hash) {
      return downloadData(swarmUrl)(hash).then(function (data) {
        try {
          return !!JSON.parse(toString(data)).entries;
        } catch (e) {
          return false;
        }
      });
    };
  }; // Uncurries a function; used to allow the f(x,y,z) style on exports.


  var uncurry = function uncurry(f) {
    return function (a, b, c, d, e) {
      var p; // Hardcoded because efficiency (`arguments` is very slow).

      if (typeof a !== "undefined") p = f(a);
      if (typeof b !== "undefined") p = f(b);
      if (typeof c !== "undefined") p = f(c);
      if (typeof d !== "undefined") p = f(d);
      if (typeof e !== "undefined") p = f(e);
      return p;
    };
  }; // () -> Promise Bool
  //   Not sure how to mock Swarm to test it properly. Ideas?


  var test = function test() {
    return Promise.resolve(true);
  }; // Uint8Array -> String


  var toString = function toString(uint8Array) {
    return bytes.toString(bytes.fromUint8Array(uint8Array));
  }; // String -> Uint8Array


  var fromString = function fromString(string) {
    return bytes.toUint8Array(bytes.fromString(string));
  }; // String -> SwarmAPI
  //   Fixes the `swarmUrl`, returning an API where you don't have to pass it.


  var at = function at(swarmUrl) {
    return {
      download: function download(hash, path) {
        return _download(swarmUrl)(hash)(path);
      },
      downloadData: uncurry(downloadData(swarmUrl)),
      downloadDataToDisk: uncurry(downloadDataToDisk(swarmUrl)),
      downloadDirectory: uncurry(downloadDirectory(swarmUrl)),
      downloadDirectoryToDisk: uncurry(downloadDirectoryToDisk(swarmUrl)),
      downloadEntries: uncurry(downloadEntries(swarmUrl)),
      downloadRoutes: uncurry(downloadRoutes(swarmUrl)),
      isAvailable: function isAvailable() {
        return _isAvailable(swarmUrl);
      },
      upload: function upload(arg) {
        return _upload(swarmUrl)(arg);
      },
      uploadData: uncurry(uploadData(swarmUrl)),
      uploadFile: uncurry(uploadFile(swarmUrl)),
      uploadFileFromDisk: uncurry(uploadFile(swarmUrl)),
      uploadDataFromDisk: uncurry(uploadDataFromDisk(swarmUrl)),
      uploadDirectory: uncurry(uploadDirectory(swarmUrl)),
      uploadDirectoryFromDisk: uncurry(uploadDirectoryFromDisk(swarmUrl)),
      uploadToManifest: uncurry(uploadToManifest(swarmUrl)),
      pick: pick,
      hash: hash,
      fromString: fromString,
      toString: toString
    };
  };

  return {
    at: at,
    local: local,
    download: _download,
    downloadBinary: downloadBinary,
    downloadData: downloadData,
    downloadDataToDisk: downloadDataToDisk,
    downloadDirectory: downloadDirectory,
    downloadDirectoryToDisk: downloadDirectoryToDisk,
    downloadEntries: downloadEntries,
    downloadRoutes: downloadRoutes,
    isAvailable: _isAvailable,
    startProcess: startProcess,
    stopProcess: stopProcess,
    upload: _upload,
    uploadData: uploadData,
    uploadDataFromDisk: uploadDataFromDisk,
    uploadFile: uploadFile,
    uploadFileFromDisk: uploadFileFromDisk,
    uploadDirectory: uploadDirectory,
    uploadDirectoryFromDisk: uploadDirectoryFromDisk,
    uploadToManifest: uploadToManifest,
    pick: pick,
    hash: hash,
    fromString: fromString,
    toString: toString
  };
};

/***/ }),

/***/ 771:
/***/ (function(module, exports, __webpack_require__) {

var A = __webpack_require__(1450);

var at = function at(bytes, index) {
  return parseInt(bytes.slice(index * 2 + 2, index * 2 + 4), 16);
};

var random = function random(bytes) {
  var rnd = void 0;
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) rnd = window.crypto.getRandomValues(new Uint8Array(bytes));else if (true) rnd = __webpack_require__(270).randomBytes(bytes);else {}
  var hex = "0x";
  for (var i = 0; i < bytes; ++i) {
    hex += ("00" + rnd[i].toString(16)).slice(-2);
  }return hex;
};

var length = function length(a) {
  return (a.length - 2) / 2;
};

var flatten = function flatten(a) {
  return "0x" + a.reduce(function (r, s) {
    return r + s.slice(2);
  }, "");
};

var slice = function slice(i, j, bs) {
  return "0x" + bs.slice(i * 2 + 2, j * 2 + 2);
};

var reverse = function reverse(hex) {
  var rev = "0x";
  for (var i = 0, l = length(hex); i < l; ++i) {
    rev += hex.slice((l - i) * 2, (l - i + 1) * 2);
  }
  return rev;
};

var pad = function pad(l, hex) {
  return hex.length === l * 2 + 2 ? hex : pad(l, "0x" + "0" + hex.slice(2));
};

var padRight = function padRight(l, hex) {
  return hex.length === l * 2 + 2 ? hex : padRight(l, hex + "0");
};

var toArray = function toArray(hex) {
  var arr = [];
  for (var i = 2, l = hex.length; i < l; i += 2) {
    arr.push(parseInt(hex.slice(i, i + 2), 16));
  }return arr;
};

var fromArray = function fromArray(arr) {
  var hex = "0x";
  for (var i = 0, l = arr.length; i < l; ++i) {
    var b = arr[i];
    hex += (b < 16 ? "0" : "") + b.toString(16);
  }
  return hex;
};

var toUint8Array = function toUint8Array(hex) {
  return new Uint8Array(toArray(hex));
};

var fromUint8Array = function fromUint8Array(arr) {
  return fromArray([].slice.call(arr, 0));
};

var fromNumber = function fromNumber(num) {
  var hex = num.toString(16);
  return hex.length % 2 === 0 ? "0x" + hex : "0x0" + hex;
};

var toNumber = function toNumber(hex) {
  return parseInt(hex.slice(2), 16);
};

var concat = function concat(a, b) {
  return a.concat(b.slice(2));
};

var fromNat = function fromNat(bn) {
  return bn === "0x0" ? "0x" : bn.length % 2 === 0 ? bn : "0x0" + bn.slice(2);
};

var toNat = function toNat(bn) {
  return bn[2] === "0" ? "0x" + bn.slice(3) : bn;
};

var fromAscii = function fromAscii(ascii) {
  var hex = "0x";
  for (var i = 0; i < ascii.length; ++i) {
    hex += ("00" + ascii.charCodeAt(i).toString(16)).slice(-2);
  }return hex;
};

var toAscii = function toAscii(hex) {
  var ascii = "";
  for (var i = 2; i < hex.length; i += 2) {
    ascii += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  }return ascii;
};

// From https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330
var fromString = function fromString(s) {
  var makeByte = function makeByte(uint8) {
    var b = uint8.toString(16);
    return b.length < 2 ? "0" + b : b;
  };
  var bytes = "0x";
  for (var ci = 0; ci != s.length; ci++) {
    var c = s.charCodeAt(ci);
    if (c < 128) {
      bytes += makeByte(c);
      continue;
    }
    if (c < 2048) {
      bytes += makeByte(c >> 6 | 192);
    } else {
      if (c > 0xd7ff && c < 0xdc00) {
        if (++ci == s.length) return null;
        var c2 = s.charCodeAt(ci);
        if (c2 < 0xdc00 || c2 > 0xdfff) return null;
        c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
        bytes += makeByte(c >> 18 | 240);
        bytes += makeByte(c >> 12 & 63 | 128);
      } else {
        // c <= 0xffff
        bytes += makeByte(c >> 12 | 224);
      }
      bytes += makeByte(c >> 6 & 63 | 128);
    }
    bytes += makeByte(c & 63 | 128);
  }
  return bytes;
};

var toString = function toString(bytes) {
  var s = '';
  var i = 0;
  var l = length(bytes);
  while (i < l) {
    var c = at(bytes, i++);
    if (c > 127) {
      if (c > 191 && c < 224) {
        if (i >= l) return null;
        c = (c & 31) << 6 | at(bytes, i) & 63;
      } else if (c > 223 && c < 240) {
        if (i + 1 >= l) return null;
        c = (c & 15) << 12 | (at(bytes, i) & 63) << 6 | at(bytes, ++i) & 63;
      } else if (c > 239 && c < 248) {
        if (i + 2 >= l) return null;
        c = (c & 7) << 18 | (at(bytes, i) & 63) << 12 | (at(bytes, ++i) & 63) << 6 | at(bytes, ++i) & 63;
      } else return null;
      ++i;
    }
    if (c <= 0xffff) s += String.fromCharCode(c);else if (c <= 0x10ffff) {
      c -= 0x10000;
      s += String.fromCharCode(c >> 10 | 0xd800);
      s += String.fromCharCode(c & 0x3FF | 0xdc00);
    } else return null;
  }
  return s;
};

module.exports = {
  random: random,
  length: length,
  concat: concat,
  flatten: flatten,
  slice: slice,
  reverse: reverse,
  pad: pad,
  padRight: padRight,
  fromAscii: fromAscii,
  toAscii: toAscii,
  fromString: fromString,
  toString: toString,
  fromNumber: fromNumber,
  toNumber: toNumber,
  fromNat: fromNat,
  toNat: toNat,
  fromArray: fromArray,
  toArray: toArray,
  fromUint8Array: fromUint8Array,
  toUint8Array: toUint8Array
};

/***/ })

}]);