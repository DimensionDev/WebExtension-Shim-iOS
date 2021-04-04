(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[100],{

/***/ 1200:
/***/ (function(module, exports, __webpack_require__) {

exports.publicEncrypt = __webpack_require__(1201)
exports.privateDecrypt = __webpack_require__(1202)

exports.privateEncrypt = function privateEncrypt (key, buf) {
  return exports.publicEncrypt(key, buf, true)
}

exports.publicDecrypt = function publicDecrypt (key, buf) {
  return exports.privateDecrypt(key, buf, true)
}


/***/ }),

/***/ 1201:
/***/ (function(module, exports, __webpack_require__) {

var parseKeys = __webpack_require__(471)
var randomBytes = __webpack_require__(139)
var createHash = __webpack_require__(275)
var mgf = __webpack_require__(723)
var xor = __webpack_require__(724)
var BN = __webpack_require__(52)
var withPublic = __webpack_require__(725)
var crt = __webpack_require__(596)
var Buffer = __webpack_require__(73).Buffer

module.exports = function publicEncrypt (publicKey, msg, reverse) {
  var padding
  if (publicKey.padding) {
    padding = publicKey.padding
  } else if (reverse) {
    padding = 1
  } else {
    padding = 4
  }
  var key = parseKeys(publicKey)
  var paddedMsg
  if (padding === 4) {
    paddedMsg = oaep(key, msg)
  } else if (padding === 1) {
    paddedMsg = pkcs1(key, msg, reverse)
  } else if (padding === 3) {
    paddedMsg = new BN(msg)
    if (paddedMsg.cmp(key.modulus) >= 0) {
      throw new Error('data too long for modulus')
    }
  } else {
    throw new Error('unknown padding')
  }
  if (reverse) {
    return crt(paddedMsg, key)
  } else {
    return withPublic(paddedMsg, key)
  }
}

function oaep (key, msg) {
  var k = key.modulus.byteLength()
  var mLen = msg.length
  var iHash = createHash('sha1').update(Buffer.alloc(0)).digest()
  var hLen = iHash.length
  var hLen2 = 2 * hLen
  if (mLen > k - hLen2 - 2) {
    throw new Error('message too long')
  }
  var ps = Buffer.alloc(k - mLen - hLen2 - 2)
  var dblen = k - hLen - 1
  var seed = randomBytes(hLen)
  var maskedDb = xor(Buffer.concat([iHash, ps, Buffer.alloc(1, 1), msg], dblen), mgf(seed, dblen))
  var maskedSeed = xor(seed, mgf(maskedDb, hLen))
  return new BN(Buffer.concat([Buffer.alloc(1), maskedSeed, maskedDb], k))
}
function pkcs1 (key, msg, reverse) {
  var mLen = msg.length
  var k = key.modulus.byteLength()
  if (mLen > k - 11) {
    throw new Error('message too long')
  }
  var ps
  if (reverse) {
    ps = Buffer.alloc(k - mLen - 3, 0xff)
  } else {
    ps = nonZero(k - mLen - 3)
  }
  return new BN(Buffer.concat([Buffer.from([0, reverse ? 1 : 2]), ps, Buffer.alloc(1), msg], k))
}
function nonZero (len) {
  var out = Buffer.allocUnsafe(len)
  var i = 0
  var cache = randomBytes(len * 2)
  var cur = 0
  var num
  while (i < len) {
    if (cur === cache.length) {
      cache = randomBytes(len * 2)
      cur = 0
    }
    num = cache[cur++]
    if (num) {
      out[i++] = num
    }
  }
  return out
}


/***/ }),

/***/ 1202:
/***/ (function(module, exports, __webpack_require__) {

var parseKeys = __webpack_require__(471)
var mgf = __webpack_require__(723)
var xor = __webpack_require__(724)
var BN = __webpack_require__(52)
var crt = __webpack_require__(596)
var createHash = __webpack_require__(275)
var withPublic = __webpack_require__(725)
var Buffer = __webpack_require__(73).Buffer

module.exports = function privateDecrypt (privateKey, enc, reverse) {
  var padding
  if (privateKey.padding) {
    padding = privateKey.padding
  } else if (reverse) {
    padding = 1
  } else {
    padding = 4
  }

  var key = parseKeys(privateKey)
  var k = key.modulus.byteLength()
  if (enc.length > k || new BN(enc).cmp(key.modulus) >= 0) {
    throw new Error('decryption error')
  }
  var msg
  if (reverse) {
    msg = withPublic(new BN(enc), key)
  } else {
    msg = crt(enc, key)
  }
  var zBuffer = Buffer.alloc(k - msg.length)
  msg = Buffer.concat([zBuffer, msg], k)
  if (padding === 4) {
    return oaep(key, msg)
  } else if (padding === 1) {
    return pkcs1(key, msg, reverse)
  } else if (padding === 3) {
    return msg
  } else {
    throw new Error('unknown padding')
  }
}

function oaep (key, msg) {
  var k = key.modulus.byteLength()
  var iHash = createHash('sha1').update(Buffer.alloc(0)).digest()
  var hLen = iHash.length
  if (msg[0] !== 0) {
    throw new Error('decryption error')
  }
  var maskedSeed = msg.slice(1, hLen + 1)
  var maskedDb = msg.slice(hLen + 1)
  var seed = xor(maskedSeed, mgf(maskedDb, hLen))
  var db = xor(maskedDb, mgf(seed, k - hLen - 1))
  if (compare(iHash, db.slice(0, hLen))) {
    throw new Error('decryption error')
  }
  var i = hLen
  while (db[i] === 0) {
    i++
  }
  if (db[i++] !== 1) {
    throw new Error('decryption error')
  }
  return db.slice(i)
}

function pkcs1 (key, msg, reverse) {
  var p1 = msg.slice(0, 2)
  var i = 2
  var status = 0
  while (msg[i++] !== 0) {
    if (i >= msg.length) {
      status++
      break
    }
  }
  var ps = msg.slice(2, i - 1)

  if ((p1.toString('hex') !== '0002' && !reverse) || (p1.toString('hex') !== '0001' && reverse)) {
    status++
  }
  if (ps.length < 8) {
    status++
  }
  if (status) {
    throw new Error('decryption error')
  }
  return msg.slice(i)
}
function compare (a, b) {
  a = Buffer.from(a)
  b = Buffer.from(b)
  var dif = 0
  var len = a.length
  if (a.length !== b.length) {
    dif++
    len = Math.min(a.length, b.length)
  }
  var i = -1
  while (++i < len) {
    dif += (a[i] ^ b[i])
  }
  return dif
}


/***/ }),

/***/ 723:
/***/ (function(module, exports, __webpack_require__) {

var createHash = __webpack_require__(275)
var Buffer = __webpack_require__(73).Buffer

module.exports = function (seed, len) {
  var t = Buffer.alloc(0)
  var i = 0
  var c
  while (t.length < len) {
    c = i2ops(i++)
    t = Buffer.concat([t, createHash('sha1').update(seed).update(c).digest()])
  }
  return t.slice(0, len)
}

function i2ops (c) {
  var out = Buffer.allocUnsafe(4)
  out.writeUInt32BE(c, 0)
  return out
}


/***/ }),

/***/ 724:
/***/ (function(module, exports) {

module.exports = function xor (a, b) {
  var len = a.length
  var i = -1
  while (++i < len) {
    a[i] ^= b[i]
  }
  return a
}


/***/ }),

/***/ 725:
/***/ (function(module, exports, __webpack_require__) {

var BN = __webpack_require__(52)
var Buffer = __webpack_require__(73).Buffer

function withPublic (paddedMsg, key) {
  return Buffer.from(paddedMsg
    .toRed(BN.mont(key.modulus))
    .redPow(new BN(key.publicExponent))
    .fromRed()
    .toArray())
}

module.exports = withPublic


/***/ })

}]);