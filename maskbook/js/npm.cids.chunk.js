(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[24],{

/***/ 1343:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Implementation of the [multibase](https://github.com/multiformats/multibase) specification.
 * @module Multibase
 */


const { Buffer } = __webpack_require__(22)
const constants = __webpack_require__(1344)

exports = module.exports = multibase
exports.encode = encode
exports.decode = decode
exports.isEncoded = isEncoded
exports.names = Object.freeze(Object.keys(constants.names))
exports.codes = Object.freeze(Object.keys(constants.codes))

const errNotSupported = new Error('Unsupported encoding')

/**
 * Create a new buffer with the multibase varint+code.
 *
 * @param {string|number} nameOrCode - The multibase name or code number.
 * @param {Buffer} buf - The data to be prefixed with multibase.
 * @memberof Multibase
 * @returns {Buffer}
 */
function multibase (nameOrCode, buf) {
  if (!buf) {
    throw new Error('requires an encoded buffer')
  }
  const base = getBase(nameOrCode)
  const codeBuf = Buffer.from(base.code)

  const name = base.name
  validEncode(name, buf)
  return Buffer.concat([codeBuf, buf])
}

/**
 * Encode data with the specified base and add the multibase prefix.
 *
 * @param {string|number} nameOrCode - The multibase name or code number.
 * @param {Buffer} buf - The data to be encoded.
 * @returns {Buffer}
 * @memberof Multibase
 */
function encode (nameOrCode, buf) {
  const base = getBase(nameOrCode)
  const name = base.name

  return multibase(name, Buffer.from(base.encode(buf)))
}

/**
 * Takes a buffer or string encoded with multibase header, decodes it and
 * returns the decoded buffer
 *
 * @param {Buffer|string} bufOrString
 * @returns {Buffer}
 * @memberof Multibase
 *
 */
function decode (bufOrString) {
  if (Buffer.isBuffer(bufOrString)) {
    bufOrString = bufOrString.toString()
  }

  const code = bufOrString.substring(0, 1)
  bufOrString = bufOrString.substring(1, bufOrString.length)

  if (typeof bufOrString === 'string') {
    bufOrString = Buffer.from(bufOrString)
  }

  const base = getBase(code)
  return Buffer.from(base.decode(bufOrString.toString()))
}

/**
 * Is the given data multibase encoded?
 *
 * @param {Buffer|string} bufOrString
 * @returns {boolean}
 * @memberof Multibase
 */
function isEncoded (bufOrString) {
  if (Buffer.isBuffer(bufOrString)) {
    bufOrString = bufOrString.toString()
  }

  // Ensure bufOrString is a string
  if (Object.prototype.toString.call(bufOrString) !== '[object String]') {
    return false
  }

  const code = bufOrString.substring(0, 1)
  try {
    const base = getBase(code)
    return base.name
  } catch (err) {
    return false
  }
}

/**
 * @param {string} name
 * @param {Buffer} buf
 * @private
 * @returns {undefined}
 */
function validEncode (name, buf) {
  const base = getBase(name)
  base.decode(buf.toString())
}

function getBase (nameOrCode) {
  let base

  if (constants.names[nameOrCode]) {
    base = constants.names[nameOrCode]
  } else if (constants.codes[nameOrCode]) {
    base = constants.codes[nameOrCode]
  } else {
    throw errNotSupported
  }

  if (!base.isImplemented()) {
    throw new Error('Base ' + nameOrCode + ' is not implemented yet')
  }

  return base
}


/***/ }),

/***/ 1344:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const Base = __webpack_require__(1345)
const baseX = __webpack_require__(591)
const base16 = __webpack_require__(1346)
const base32 = __webpack_require__(1347)
const base64 = __webpack_require__(1348)

// name, code, implementation, alphabet
const constants = [
  ['base1', '1', '', '1'],
  ['base2', '0', baseX, '01'],
  ['base8', '7', baseX, '01234567'],
  ['base10', '9', baseX, '0123456789'],
  ['base16', 'f', base16, '0123456789abcdef'],
  ['base32', 'b', base32, 'abcdefghijklmnopqrstuvwxyz234567'],
  ['base32pad', 'c', base32, 'abcdefghijklmnopqrstuvwxyz234567='],
  ['base32hex', 'v', base32, '0123456789abcdefghijklmnopqrstuv'],
  ['base32hexpad', 't', base32, '0123456789abcdefghijklmnopqrstuv='],
  ['base32z', 'h', base32, 'ybndrfg8ejkmcpqxot1uwisza345h769'],
  ['base58flickr', 'Z', baseX, '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'],
  ['base58btc', 'z', baseX, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'],
  ['base64', 'm', base64, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'],
  ['base64pad', 'M', base64, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='],
  ['base64url', 'u', base64, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'],
  ['base64urlpad', 'U', base64, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=']
]

const names = constants.reduce((prev, tupple) => {
  prev[tupple[0]] = new Base(tupple[0], tupple[1], tupple[2], tupple[3])
  return prev
}, {})

const codes = constants.reduce((prev, tupple) => {
  prev[tupple[1]] = names[tupple[0]]
  return prev
}, {})

module.exports = {
  names: names,
  codes: codes
}


/***/ }),

/***/ 1345:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


class Base {
  constructor (name, code, implementation, alphabet) {
    this.name = name
    this.code = code
    this.alphabet = alphabet
    if (implementation && alphabet) {
      this.engine = implementation(alphabet)
    }
  }

  encode (stringOrBuffer) {
    return this.engine.encode(stringOrBuffer)
  }

  decode (stringOrBuffer) {
    return this.engine.decode(stringOrBuffer)
  }

  isImplemented () {
    return this.engine
  }
}

module.exports = Base


/***/ }),

/***/ 1346:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const { Buffer } = __webpack_require__(22)

module.exports = function base16 (alphabet) {
  return {
    encode (input) {
      if (typeof input === 'string') {
        return Buffer.from(input).toString('hex')
      }
      return input.toString('hex')
    },
    decode (input) {
      for (const char of input) {
        if (alphabet.indexOf(char) < 0) {
          throw new Error('invalid base16 character')
        }
      }
      return Buffer.from(input, 'hex')
    }
  }
}


/***/ }),

/***/ 1347:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function decode (input, alphabet) {
  input = input.replace(new RegExp('=', 'g'), '')
  const length = input.length

  let bits = 0
  let value = 0

  let index = 0
  const output = new Uint8Array((length * 5 / 8) | 0)

  for (let i = 0; i < length; i++) {
    value = (value << 5) | alphabet.indexOf(input[i])
    bits += 5

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255
      bits -= 8
    }
  }

  return output.buffer
}

function encode (buffer, alphabet) {
  const length = buffer.byteLength
  const view = new Uint8Array(buffer)
  const padding = alphabet.indexOf('=') === alphabet.length - 1

  if (padding) {
    alphabet = alphabet.substring(0, alphabet.length - 1)
  }

  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < length; i++) {
    value = (value << 8) | view[i]
    bits += 8

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31]
  }

  if (padding) {
    while ((output.length % 8) !== 0) {
      output += '='
    }
  }

  return output
}

module.exports = function base32 (alphabet) {
  return {
    encode (input) {
      if (typeof input === 'string') {
        return encode(Uint8Array.from(input), alphabet)
      }

      return encode(input, alphabet)
    },
    decode (input) {
      for (const char of input) {
        if (alphabet.indexOf(char) < 0) {
          throw new Error('invalid base32 character')
        }
      }

      return decode(input, alphabet)
    }
  }
}


/***/ }),

/***/ 1348:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const { Buffer } = __webpack_require__(22)

module.exports = function base64 (alphabet) {
  // The alphabet is only used to know:
  //   1. If padding is enabled (must contain '=')
  //   2. If the output must be url-safe (must contain '-' and '_')
  //   3. If the input of the output function is valid
  // The alphabets from RFC 4648 are always used.
  const padding = alphabet.indexOf('=') > -1
  const url = alphabet.indexOf('-') > -1 && alphabet.indexOf('_') > -1

  return {
    encode (input) {
      let output = ''

      if (typeof input === 'string') {
        output = Buffer.from(input).toString('base64')
      } else {
        output = input.toString('base64')
      }

      if (url) {
        output = output.replace(/\+/g, '-').replace(/\//g, '_')
      }

      const pad = output.indexOf('=')
      if (pad > 0 && !padding) {
        output = output.substring(0, pad)
      }

      return output
    },
    decode (input) {
      for (const char of input) {
        if (alphabet.indexOf(char) < 0) {
          throw new Error('invalid base64 character')
        }
      }

      return Buffer.from(input, 'base64')
    }
  }
}


/***/ }),

/***/ 1349:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Implementation of the multicodec specification.
 *
 * @module multicodec
 * @example
 * const multicodec = require('multicodec')
 *
 * const prefixedProtobuf = multicodec.addPrefix('protobuf', protobufBuffer)
 * // prefixedProtobuf 0x50...
 *
 */


const { Buffer } = __webpack_require__(22)
const varint = __webpack_require__(406)
const intTable = __webpack_require__(1350)
const codecNameToCodeVarint = __webpack_require__(1351)
const util = __webpack_require__(754)

exports = module.exports

/**
 * Prefix a buffer with a multicodec-packed.
 *
 * @param {string|number} multicodecStrOrCode
 * @param {Buffer} data
 * @returns {Buffer}
 */
exports.addPrefix = (multicodecStrOrCode, data) => {
  let prefix

  if (Buffer.isBuffer(multicodecStrOrCode)) {
    prefix = util.varintBufferEncode(multicodecStrOrCode)
  } else {
    if (codecNameToCodeVarint[multicodecStrOrCode]) {
      prefix = codecNameToCodeVarint[multicodecStrOrCode]
    } else {
      throw new Error('multicodec not recognized')
    }
  }
  return Buffer.concat([prefix, data])
}

/**
 * Decapsulate the multicodec-packed prefix from the data.
 *
 * @param {Buffer} data
 * @returns {Buffer}
 */
exports.rmPrefix = (data) => {
  varint.decode(data)
  return data.slice(varint.decode.bytes)
}

/**
 * Get the codec of the prefixed data.
 * @param {Buffer} prefixedData
 * @returns {string}
 */
exports.getCodec = (prefixedData) => {
  const code = varint.decode(prefixedData)
  const codecName = intTable.get(code)
  if (codecName === undefined) {
    throw new Error(`Code ${code} not found`)
  }
  return codecName
}

/**
 * Get the name of the codec.
 * @param {number} codec
 * @returns {string}
 */
exports.getName = (codec) => {
  return intTable.get(codec)
}

/**
 * Get the code of the codec
 * @param {string} name
 * @returns {number}
 */
exports.getNumber = (name) => {
  const code = codecNameToCodeVarint[name]
  if (code === undefined) {
    throw new Error('Codec `' + name + '` not found')
  }
  return util.varintBufferDecode(code)[0]
}

/**
 * Get the code of the prefixed data.
 * @param {Buffer} prefixedData
 * @returns {number}
 */
exports.getCode = (prefixedData) => {
  return varint.decode(prefixedData)
}

/**
 * Get the code as varint of a codec name.
 * @param {string} codecName
 * @returns {Buffer}
 */
exports.getCodeVarint = (codecName) => {
  const code = codecNameToCodeVarint[codecName]
  if (code === undefined) {
    throw new Error('Codec `' + codecName + '` not found')
  }
  return code
}

/**
 * Get the varint of a code.
 * @param {Number} code
 * @returns {Array.<number>}
 */
exports.getVarint = (code) => {
  return varint.encode(code)
}

// Make the constants top-level constants
const constants = __webpack_require__(1352)
Object.assign(exports, constants)

// Human friendly names for printing, e.g. in error messages
exports.print = __webpack_require__(1353)


/***/ }),

/***/ 1350:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const baseTable = __webpack_require__(407)

// map for hexString -> codecName
const nameTable = new Map()

for (const encodingName in baseTable) {
  const code = baseTable[encodingName]
  nameTable.set(code, encodingName)
}

module.exports = Object.freeze(nameTable)


/***/ }),

/***/ 1351:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const baseTable = __webpack_require__(407)
const varintEncode = __webpack_require__(754).varintEncode

// map for codecName -> codeVarintBuffer
const varintTable = {}

for (const encodingName in baseTable) {
  const code = baseTable[encodingName]
  varintTable[encodingName] = varintEncode(code)
}

module.exports = Object.freeze(varintTable)


/***/ }),

/***/ 1352:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const table = __webpack_require__(407)

// map for codecConstant -> code
const constants = {}

for (const [name, code] of Object.entries(table)) {
  constants[name.toUpperCase().replace(/-/g, '_')] = code
}

module.exports = Object.freeze(constants)


/***/ }),

/***/ 1353:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const table = __webpack_require__(407)

// map for code -> print friendly name
const tableByCode = {}

for (const [name, code] of Object.entries(table)) {
  if (tableByCode[code] === undefined) tableByCode[code] = name
}

module.exports = Object.freeze(tableByCode)


/***/ }),

/***/ 1354:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const mh = __webpack_require__(602)
const { Buffer } = __webpack_require__(22)
var CIDUtil = {
  /**
   * Test if the given input is a valid CID object.
   * Returns an error message if it is not.
   * Returns undefined if it is a valid CID.
   *
   * @param {any} other
   * @returns {string}
   */
  checkCIDComponents: function (other) {
    if (other == null) {
      return 'null values are not valid CIDs'
    }

    if (!(other.version === 0 || other.version === 1)) {
      return 'Invalid version, must be a number equal to 1 or 0'
    }

    if (typeof other.codec !== 'string') {
      return 'codec must be string'
    }

    if (other.version === 0) {
      if (other.codec !== 'dag-pb') {
        return "codec must be 'dag-pb' for CIDv0"
      }
      if (other.multibaseName !== 'base58btc') {
        return "multibaseName must be 'base58btc' for CIDv0"
      }
    }

    if (!Buffer.isBuffer(other.multihash)) {
      return 'multihash must be a Buffer'
    }

    try {
      mh.validate(other.multihash)
    } catch (err) {
      let errorMsg = err.message
      if (!errorMsg) { // Just in case mh.validate() throws an error with empty error message
        errorMsg = 'Multihash validation failed'
      }
      return errorMsg
    }
  }
}

module.exports = CIDUtil


/***/ }),

/***/ 407:
/***/ (function(module) {

module.exports = JSON.parse("{\"identity\":0,\"ip4\":4,\"tcp\":6,\"sha1\":17,\"sha2-256\":18,\"sha2-512\":19,\"sha3-512\":20,\"sha3-384\":21,\"sha3-256\":22,\"sha3-224\":23,\"shake-128\":24,\"shake-256\":25,\"keccak-224\":26,\"keccak-256\":27,\"keccak-384\":28,\"keccak-512\":29,\"dccp\":33,\"murmur3-128\":34,\"murmur3-32\":35,\"ip6\":41,\"ip6zone\":42,\"path\":47,\"multicodec\":48,\"multihash\":49,\"multiaddr\":50,\"multibase\":51,\"dns\":53,\"dns4\":54,\"dns6\":55,\"dnsaddr\":56,\"protobuf\":80,\"cbor\":81,\"raw\":85,\"dbl-sha2-256\":86,\"rlp\":96,\"bencode\":99,\"dag-pb\":112,\"dag-cbor\":113,\"libp2p-key\":114,\"git-raw\":120,\"torrent-info\":123,\"torrent-file\":124,\"leofcoin-block\":129,\"leofcoin-tx\":130,\"leofcoin-pr\":131,\"sctp\":132,\"eth-block\":144,\"eth-block-list\":145,\"eth-tx-trie\":146,\"eth-tx\":147,\"eth-tx-receipt-trie\":148,\"eth-tx-receipt\":149,\"eth-state-trie\":150,\"eth-account-snapshot\":151,\"eth-storage-trie\":152,\"bitcoin-block\":176,\"bitcoin-tx\":177,\"zcash-block\":192,\"zcash-tx\":193,\"stellar-block\":208,\"stellar-tx\":209,\"md4\":212,\"md5\":213,\"bmt\":214,\"decred-block\":224,\"decred-tx\":225,\"ipld-ns\":226,\"ipfs-ns\":227,\"swarm-ns\":228,\"ipns-ns\":229,\"zeronet\":230,\"ed25519-pub\":237,\"dash-block\":240,\"dash-tx\":241,\"swarm-manifest\":250,\"swarm-feed\":251,\"udp\":273,\"p2p-webrtc-star\":275,\"p2p-webrtc-direct\":276,\"p2p-stardust\":277,\"p2p-circuit\":290,\"dag-json\":297,\"udt\":301,\"utp\":302,\"unix\":400,\"p2p\":421,\"ipfs\":421,\"https\":443,\"onion\":444,\"onion3\":445,\"garlic64\":446,\"garlic32\":447,\"tls\":448,\"quic\":460,\"ws\":477,\"wss\":478,\"p2p-websocket-star\":479,\"http\":480,\"json\":512,\"messagepack\":513,\"x11\":4352,\"blake2b-8\":45569,\"blake2b-16\":45570,\"blake2b-24\":45571,\"blake2b-32\":45572,\"blake2b-40\":45573,\"blake2b-48\":45574,\"blake2b-56\":45575,\"blake2b-64\":45576,\"blake2b-72\":45577,\"blake2b-80\":45578,\"blake2b-88\":45579,\"blake2b-96\":45580,\"blake2b-104\":45581,\"blake2b-112\":45582,\"blake2b-120\":45583,\"blake2b-128\":45584,\"blake2b-136\":45585,\"blake2b-144\":45586,\"blake2b-152\":45587,\"blake2b-160\":45588,\"blake2b-168\":45589,\"blake2b-176\":45590,\"blake2b-184\":45591,\"blake2b-192\":45592,\"blake2b-200\":45593,\"blake2b-208\":45594,\"blake2b-216\":45595,\"blake2b-224\":45596,\"blake2b-232\":45597,\"blake2b-240\":45598,\"blake2b-248\":45599,\"blake2b-256\":45600,\"blake2b-264\":45601,\"blake2b-272\":45602,\"blake2b-280\":45603,\"blake2b-288\":45604,\"blake2b-296\":45605,\"blake2b-304\":45606,\"blake2b-312\":45607,\"blake2b-320\":45608,\"blake2b-328\":45609,\"blake2b-336\":45610,\"blake2b-344\":45611,\"blake2b-352\":45612,\"blake2b-360\":45613,\"blake2b-368\":45614,\"blake2b-376\":45615,\"blake2b-384\":45616,\"blake2b-392\":45617,\"blake2b-400\":45618,\"blake2b-408\":45619,\"blake2b-416\":45620,\"blake2b-424\":45621,\"blake2b-432\":45622,\"blake2b-440\":45623,\"blake2b-448\":45624,\"blake2b-456\":45625,\"blake2b-464\":45626,\"blake2b-472\":45627,\"blake2b-480\":45628,\"blake2b-488\":45629,\"blake2b-496\":45630,\"blake2b-504\":45631,\"blake2b-512\":45632,\"blake2s-8\":45633,\"blake2s-16\":45634,\"blake2s-24\":45635,\"blake2s-32\":45636,\"blake2s-40\":45637,\"blake2s-48\":45638,\"blake2s-56\":45639,\"blake2s-64\":45640,\"blake2s-72\":45641,\"blake2s-80\":45642,\"blake2s-88\":45643,\"blake2s-96\":45644,\"blake2s-104\":45645,\"blake2s-112\":45646,\"blake2s-120\":45647,\"blake2s-128\":45648,\"blake2s-136\":45649,\"blake2s-144\":45650,\"blake2s-152\":45651,\"blake2s-160\":45652,\"blake2s-168\":45653,\"blake2s-176\":45654,\"blake2s-184\":45655,\"blake2s-192\":45656,\"blake2s-200\":45657,\"blake2s-208\":45658,\"blake2s-216\":45659,\"blake2s-224\":45660,\"blake2s-232\":45661,\"blake2s-240\":45662,\"blake2s-248\":45663,\"blake2s-256\":45664,\"skein256-8\":45825,\"skein256-16\":45826,\"skein256-24\":45827,\"skein256-32\":45828,\"skein256-40\":45829,\"skein256-48\":45830,\"skein256-56\":45831,\"skein256-64\":45832,\"skein256-72\":45833,\"skein256-80\":45834,\"skein256-88\":45835,\"skein256-96\":45836,\"skein256-104\":45837,\"skein256-112\":45838,\"skein256-120\":45839,\"skein256-128\":45840,\"skein256-136\":45841,\"skein256-144\":45842,\"skein256-152\":45843,\"skein256-160\":45844,\"skein256-168\":45845,\"skein256-176\":45846,\"skein256-184\":45847,\"skein256-192\":45848,\"skein256-200\":45849,\"skein256-208\":45850,\"skein256-216\":45851,\"skein256-224\":45852,\"skein256-232\":45853,\"skein256-240\":45854,\"skein256-248\":45855,\"skein256-256\":45856,\"skein512-8\":45857,\"skein512-16\":45858,\"skein512-24\":45859,\"skein512-32\":45860,\"skein512-40\":45861,\"skein512-48\":45862,\"skein512-56\":45863,\"skein512-64\":45864,\"skein512-72\":45865,\"skein512-80\":45866,\"skein512-88\":45867,\"skein512-96\":45868,\"skein512-104\":45869,\"skein512-112\":45870,\"skein512-120\":45871,\"skein512-128\":45872,\"skein512-136\":45873,\"skein512-144\":45874,\"skein512-152\":45875,\"skein512-160\":45876,\"skein512-168\":45877,\"skein512-176\":45878,\"skein512-184\":45879,\"skein512-192\":45880,\"skein512-200\":45881,\"skein512-208\":45882,\"skein512-216\":45883,\"skein512-224\":45884,\"skein512-232\":45885,\"skein512-240\":45886,\"skein512-248\":45887,\"skein512-256\":45888,\"skein512-264\":45889,\"skein512-272\":45890,\"skein512-280\":45891,\"skein512-288\":45892,\"skein512-296\":45893,\"skein512-304\":45894,\"skein512-312\":45895,\"skein512-320\":45896,\"skein512-328\":45897,\"skein512-336\":45898,\"skein512-344\":45899,\"skein512-352\":45900,\"skein512-360\":45901,\"skein512-368\":45902,\"skein512-376\":45903,\"skein512-384\":45904,\"skein512-392\":45905,\"skein512-400\":45906,\"skein512-408\":45907,\"skein512-416\":45908,\"skein512-424\":45909,\"skein512-432\":45910,\"skein512-440\":45911,\"skein512-448\":45912,\"skein512-456\":45913,\"skein512-464\":45914,\"skein512-472\":45915,\"skein512-480\":45916,\"skein512-488\":45917,\"skein512-496\":45918,\"skein512-504\":45919,\"skein512-512\":45920,\"skein1024-8\":45921,\"skein1024-16\":45922,\"skein1024-24\":45923,\"skein1024-32\":45924,\"skein1024-40\":45925,\"skein1024-48\":45926,\"skein1024-56\":45927,\"skein1024-64\":45928,\"skein1024-72\":45929,\"skein1024-80\":45930,\"skein1024-88\":45931,\"skein1024-96\":45932,\"skein1024-104\":45933,\"skein1024-112\":45934,\"skein1024-120\":45935,\"skein1024-128\":45936,\"skein1024-136\":45937,\"skein1024-144\":45938,\"skein1024-152\":45939,\"skein1024-160\":45940,\"skein1024-168\":45941,\"skein1024-176\":45942,\"skein1024-184\":45943,\"skein1024-192\":45944,\"skein1024-200\":45945,\"skein1024-208\":45946,\"skein1024-216\":45947,\"skein1024-224\":45948,\"skein1024-232\":45949,\"skein1024-240\":45950,\"skein1024-248\":45951,\"skein1024-256\":45952,\"skein1024-264\":45953,\"skein1024-272\":45954,\"skein1024-280\":45955,\"skein1024-288\":45956,\"skein1024-296\":45957,\"skein1024-304\":45958,\"skein1024-312\":45959,\"skein1024-320\":45960,\"skein1024-328\":45961,\"skein1024-336\":45962,\"skein1024-344\":45963,\"skein1024-352\":45964,\"skein1024-360\":45965,\"skein1024-368\":45966,\"skein1024-376\":45967,\"skein1024-384\":45968,\"skein1024-392\":45969,\"skein1024-400\":45970,\"skein1024-408\":45971,\"skein1024-416\":45972,\"skein1024-424\":45973,\"skein1024-432\":45974,\"skein1024-440\":45975,\"skein1024-448\":45976,\"skein1024-456\":45977,\"skein1024-464\":45978,\"skein1024-472\":45979,\"skein1024-480\":45980,\"skein1024-488\":45981,\"skein1024-496\":45982,\"skein1024-504\":45983,\"skein1024-512\":45984,\"skein1024-520\":45985,\"skein1024-528\":45986,\"skein1024-536\":45987,\"skein1024-544\":45988,\"skein1024-552\":45989,\"skein1024-560\":45990,\"skein1024-568\":45991,\"skein1024-576\":45992,\"skein1024-584\":45993,\"skein1024-592\":45994,\"skein1024-600\":45995,\"skein1024-608\":45996,\"skein1024-616\":45997,\"skein1024-624\":45998,\"skein1024-632\":45999,\"skein1024-640\":46000,\"skein1024-648\":46001,\"skein1024-656\":46002,\"skein1024-664\":46003,\"skein1024-672\":46004,\"skein1024-680\":46005,\"skein1024-688\":46006,\"skein1024-696\":46007,\"skein1024-704\":46008,\"skein1024-712\":46009,\"skein1024-720\":46010,\"skein1024-728\":46011,\"skein1024-736\":46012,\"skein1024-744\":46013,\"skein1024-752\":46014,\"skein1024-760\":46015,\"skein1024-768\":46016,\"skein1024-776\":46017,\"skein1024-784\":46018,\"skein1024-792\":46019,\"skein1024-800\":46020,\"skein1024-808\":46021,\"skein1024-816\":46022,\"skein1024-824\":46023,\"skein1024-832\":46024,\"skein1024-840\":46025,\"skein1024-848\":46026,\"skein1024-856\":46027,\"skein1024-864\":46028,\"skein1024-872\":46029,\"skein1024-880\":46030,\"skein1024-888\":46031,\"skein1024-896\":46032,\"skein1024-904\":46033,\"skein1024-912\":46034,\"skein1024-920\":46035,\"skein1024-928\":46036,\"skein1024-936\":46037,\"skein1024-944\":46038,\"skein1024-952\":46039,\"skein1024-960\":46040,\"skein1024-968\":46041,\"skein1024-976\":46042,\"skein1024-984\":46043,\"skein1024-992\":46044,\"skein1024-1000\":46045,\"skein1024-1008\":46046,\"skein1024-1016\":46047,\"skein1024-1024\":46048,\"holochain-adr-v0\":8417572,\"holochain-adr-v1\":8483108,\"holochain-key-v0\":9728292,\"holochain-key-v1\":9793828,\"holochain-sig-v0\":10645796,\"holochain-sig-v1\":10711332}");

/***/ }),

/***/ 753:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const { Buffer } = __webpack_require__(22)
const mh = __webpack_require__(602)
const multibase = __webpack_require__(1343)
const multicodec = __webpack_require__(1349)
const codecs = __webpack_require__(407)
const CIDUtil = __webpack_require__(1354)
const withIs = __webpack_require__(1355)

/**
 * @typedef {Object} SerializedCID
 * @param {string} codec
 * @param {number} version
 * @param {Buffer} multihash
 */

/**
 * Test if the given input is a CID.
 * @function isCID
 * @memberof CID
 * @static
 * @param {any} other
 * @returns {bool}
 */

/**
 * Class representing a CID `<mbase><version><mcodec><mhash>`
 * , as defined in [ipld/cid](https://github.com/multiformats/cid).
 * @class CID
 */
class CID {
  /**
   * Create a new CID.
   *
   * The algorithm for argument input is roughly:
   * ```
   * if (cid)
   *   -> create a copy
   * else if (str)
   *   if (1st char is on multibase table) -> CID String
   *   else -> bs58 encoded multihash
   * else if (Buffer)
   *   if (1st byte is 0 or 1) -> CID
   *   else -> multihash
   * else if (Number)
   *   -> construct CID by parts
   * ```
   *
   * @param {string|Buffer|CID} version
   * @param {string} [codec]
   * @param {Buffer} [multihash]
   * @param {string} [multibaseName]
   *
   * @example
   * new CID(<version>, <codec>, <multihash>, <multibaseName>)
   * new CID(<cidStr>)
   * new CID(<cid.buffer>)
   * new CID(<multihash>)
   * new CID(<bs58 encoded multihash>)
   * new CID(<cid>)
   */
  constructor (version, codec, multihash, multibaseName) {
    if (_CID.isCID(version)) {
      // version is an exising CID instance
      const cid = version
      this.version = cid.version
      this.codec = cid.codec
      this.multihash = Buffer.from(cid.multihash)
      // Default guard for when a CID < 0.7 is passed with no multibaseName
      this.multibaseName = cid.multibaseName || (cid.version === 0 ? 'base58btc' : 'base32')
      return
    }

    if (typeof version === 'string') {
      // e.g. 'base32' or false
      const baseName = multibase.isEncoded(version)
      if (baseName) {
        // version is a CID String encoded with multibase, so v1
        const cid = multibase.decode(version)
        this.version = parseInt(cid.slice(0, 1).toString('hex'), 16)
        this.codec = multicodec.getCodec(cid.slice(1))
        this.multihash = multicodec.rmPrefix(cid.slice(1))
        this.multibaseName = baseName
      } else {
        // version is a base58btc string multihash, so v0
        this.version = 0
        this.codec = 'dag-pb'
        this.multihash = mh.fromB58String(version)
        this.multibaseName = 'base58btc'
      }
      CID.validateCID(this)
      Object.defineProperty(this, 'string', { value: version })
      return
    }

    if (Buffer.isBuffer(version)) {
      const firstByte = version.slice(0, 1)
      const v = parseInt(firstByte.toString('hex'), 16)
      if (v === 1) {
        // version is a CID buffer
        const cid = version
        this.version = v
        this.codec = multicodec.getCodec(cid.slice(1))
        this.multihash = multicodec.rmPrefix(cid.slice(1))
        this.multibaseName = 'base32'
      } else {
        // version is a raw multihash buffer, so v0
        this.version = 0
        this.codec = 'dag-pb'
        this.multihash = version
        this.multibaseName = 'base58btc'
      }
      CID.validateCID(this)
      return
    }

    // otherwise, assemble the CID from the parameters

    /**
     * @type {number}
     */
    this.version = version

    /**
     * @type {string}
     */
    this.codec = codec

    /**
     * @type {Buffer}
     */
    this.multihash = multihash

    /**
     * @type {string}
     */
    this.multibaseName = multibaseName || (version === 0 ? 'base58btc' : 'base32')

    CID.validateCID(this)
  }

  /**
   * The CID as a `Buffer`
   *
   * @return {Buffer}
   * @readonly
   *
   * @memberOf CID
   */
  get buffer () {
    let buffer = this._buffer

    if (!buffer) {
      if (this.version === 0) {
        buffer = this.multihash
      } else if (this.version === 1) {
        buffer = Buffer.concat([
          Buffer.from('01', 'hex'),
          multicodec.getCodeVarint(this.codec),
          this.multihash
        ])
      } else {
        throw new Error('unsupported version')
      }

      // Cache this buffer so it doesn't have to be recreated
      Object.defineProperty(this, '_buffer', { value: buffer })
    }

    return buffer
  }

  /**
   * Get the prefix of the CID.
   *
   * @returns {Buffer}
   * @readonly
   */
  get prefix () {
    return Buffer.concat([
      Buffer.from(`0${this.version}`, 'hex'),
      multicodec.getCodeVarint(this.codec),
      mh.prefix(this.multihash)
    ])
  }

  /**
   * Convert to a CID of version `0`.
   *
   * @returns {CID}
   */
  toV0 () {
    if (this.codec !== 'dag-pb') {
      throw new Error('Cannot convert a non dag-pb CID to CIDv0')
    }

    const { name, length } = mh.decode(this.multihash)

    if (name !== 'sha2-256') {
      throw new Error('Cannot convert non sha2-256 multihash CID to CIDv0')
    }

    if (length !== 32) {
      throw new Error('Cannot convert non 32 byte multihash CID to CIDv0')
    }

    return new _CID(0, this.codec, this.multihash)
  }

  /**
   * Convert to a CID of version `1`.
   *
   * @returns {CID}
   */
  toV1 () {
    return new _CID(1, this.codec, this.multihash)
  }

  /**
   * Encode the CID into a string.
   *
   * @param {string} [base=this.multibaseName] - Base encoding to use.
   * @returns {string}
   */
  toBaseEncodedString (base = this.multibaseName) {
    if (this.string && base === this.multibaseName) {
      return this.string
    }
    let str = null
    if (this.version === 0) {
      if (base !== 'base58btc') {
        throw new Error('not supported with CIDv0, to support different bases, please migrate the instance do CIDv1, you can do that through cid.toV1()')
      }
      str = mh.toB58String(this.multihash)
    } else if (this.version === 1) {
      str = multibase.encode(base, this.buffer).toString()
    } else {
      throw new Error('unsupported version')
    }
    if (base === this.multibaseName) {
      // cache the string value
      Object.defineProperty(this, 'string', { value: str })
    }
    return str
  }

  /**
   * CID(QmdfTbBqBPQ7VNxZEYEj14VmRuZBkqFbiwReogJgS1zR1n)
   *
   * @returns {String}
   */
  [Symbol.for('nodejs.util.inspect.custom')] () {
    return 'CID(' + this.toString() + ')'
  }

  toString (base) {
    return this.toBaseEncodedString(base)
  }

  /**
   * Serialize to a plain object.
   *
   * @returns {SerializedCID}
   */
  toJSON () {
    return {
      codec: this.codec,
      version: this.version,
      hash: this.multihash
    }
  }

  /**
   * Compare equality with another CID.
   *
   * @param {CID} other
   * @returns {bool}
   */
  equals (other) {
    return this.codec === other.codec &&
      this.version === other.version &&
      this.multihash.equals(other.multihash)
  }

  /**
   * Test if the given input is a valid CID object.
   * Throws if it is not.
   *
   * @param {any} other
   * @returns {void}
   */
  static validateCID (other) {
    const errorMsg = CIDUtil.checkCIDComponents(other)
    if (errorMsg) {
      throw new Error(errorMsg)
    }
  }
}

const _CID = withIs(CID, {
  className: 'CID',
  symbolName: '@ipld/js-cid/CID'
})

_CID.codecs = codecs

module.exports = _CID


/***/ }),

/***/ 754:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const varint = __webpack_require__(406)
const { Buffer } = __webpack_require__(22)

module.exports = {
  numberToBuffer,
  bufferToNumber,
  varintBufferEncode,
  varintBufferDecode,
  varintEncode
}

function bufferToNumber (buf) {
  return parseInt(buf.toString('hex'), 16)
}

function numberToBuffer (num) {
  let hexString = num.toString(16)
  if (hexString.length % 2 === 1) {
    hexString = '0' + hexString
  }
  return Buffer.from(hexString, 'hex')
}

function varintBufferEncode (input) {
  return Buffer.from(varint.encode(bufferToNumber(input)))
}

function varintBufferDecode (input) {
  return numberToBuffer(varint.decode(input))
}

function varintEncode (num) {
  return Buffer.from(varint.encode(num))
}


/***/ })

}]);