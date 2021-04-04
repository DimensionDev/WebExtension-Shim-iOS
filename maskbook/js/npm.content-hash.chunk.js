(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[26],{

/***/ 1326:
/***/ (function(module, exports, __webpack_require__) {

/*
	ISC License

	Copyright (c) 2019, Pierre-Louis Despaigne

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted, provided that the above
	copyright notice and this permission notice appear in all copies.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
	WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
	MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
	ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
	WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
	ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
	OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

const multiC = __webpack_require__(1327);

const { hexStringToBuffer, profiles } = __webpack_require__(1335);
const { cidV0ToV1Base32 } = __webpack_require__(1356);

module.exports = {

	//export some helpers functions
	helpers: {
		cidV0ToV1Base32,
	},

	/**
	* Decode a Content Hash.
	* @param {string} hash an hex string containing a content hash
	* @return {string} the decoded content
	*/
	decode: function (contentHash) {
		const buffer = hexStringToBuffer(contentHash);
		const codec = multiC.getCodec(buffer);
		const value = multiC.rmPrefix(buffer);
		let profile = profiles[codec];
		if (!profile) profile = profiles['default'];
		return profile.decode(value);
	},

	/**
	* Encode an IPFS address into a content hash
	* @param {string} ipfsHash string containing an IPFS address
	* @return {string} the resulting content hash
	*/
	fromIpfs: function (ipfsHash) {
		return this.encode('ipfs-ns', ipfsHash);
	},

	/**
	* Encode a Swarm address into a content hash
	* @param {string} swarmHash string containing a Swarm address
	* @return {string} the resulting content hash
	*/
	fromSwarm: function (swarmHash) {
		return this.encode('swarm-ns', swarmHash);
	},

	/**
	* General purpose encoding function
  * @param {string} codec 
  * @param {string} value 
  */
	encode: function (codec, value) {
		let profile = profiles[codec];
		if (!profile) profile = profiles['default'];
		const encodedValue = profile.encode(value);
		return multiC.addPrefix(codec, encodedValue).toString('hex');
	},

	/**
	* Extract the codec of a content hash
	* @param {string} hash hex string containing a content hash
	* @return {string} the extracted codec
	*/
	getCodec: function (hash) {
		let buffer = hexStringToBuffer(hash);
		return multiC.getCodec(buffer);
	},
}


/***/ }),

/***/ 1335:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {/*
	ISC License

	Copyright (c) 2019, Pierre-Louis Despaigne

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted, provided that the above
	copyright notice and this permission notice appear in all copies.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
	WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
	MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
	ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
	WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
	ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
	OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

const CID = __webpack_require__(753);
const multiH = __webpack_require__(602);

/**
 * Convert an hexadecimal string to a Buffer, the string can start with or without '0x'
 * @param {string} hex an hexadecimal value
 * @return {Buffer} the resulting Buffer
 */
const hexStringToBuffer = (hex) => {
	let prefix = hex.slice(0, 2);
	let value = hex.slice(2);
	let res = '';
	if (prefix === '0x') res = value;
	else res = hex;
	return multiH.fromHexString(res);
}

/**
* list of known encoding,
* encoding should be a function that takes a `string` input,
* and return a `Buffer` result
*/
const encodes = {
  /**
  * @param {string} value
  * @return {Buffer}
  */
  swarm: (value) => {
    const multihash = multiH.encode(hexStringToBuffer(value), 'keccak-256');
		return new CID(1, 'swarm-manifest', multihash).buffer;
  },
  /**
  * @param {string} value
  * @return {Buffer}
  */
  ipfs: (value) => {
    const multihash = multiH.fromB58String(value);
    return new CID(1, 'dag-pb', multihash).buffer;
  },
  /**
  * @param {string} value
  * @return {Buffer}
  */
  utf8: (value) => {
    return Buffer.from(value, 'utf8');
  },
};

/** 
* list of known decoding,
* decoding should be a function that takes a `Buffer` input,
* and return a `string` result
*/
const decodes = {
  /**
  * @param {Buffer} value 
  */
  hexMultiHash: (value) => {
    const cid = new CID(value);
    return multiH.decode(cid.multihash).digest.toString('hex');
  },
  /**
  * @param {Buffer} value 
  */
  b58MultiHash: (value) => {
    const cid = new CID(value);
    return multiH.toB58String(cid.multihash);
  },
  /**
  * @param {Buffer} value 
  */
  utf8: (value) => {
    return value.toString('utf8');
  },
};

/**
* list of known encoding/decoding for a given codec,
* `encode` should be chosen among the `encodes` functions
* `decode` should be chosen among the `decodes` functions
*/
const profiles = {
  'swarm-ns': {
    encode: encodes.swarm,
    decode: decodes.hexMultiHash,
  },
  'ipfs-ns': {
    encode: encodes.ipfs,
    decode: decodes.b58MultiHash,
  },
  'ipns-ns': {
    encode: encodes.ipfs,
    decode: decodes.b58MultiHash,
  },
  'default': {
    encode: encodes.utf8,
    decode: decodes.utf8,
  },
};

exports.hexStringToBuffer = hexStringToBuffer;
exports.profiles = profiles;
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(22).Buffer))

/***/ }),

/***/ 1356:
/***/ (function(module, exports, __webpack_require__) {

/*
	ISC License

	Copyright (c) 2019, Pierre-Louis Despaigne

	Permission to use, copy, modify, and/or distribute this software for any
	purpose with or without fee is hereby granted, provided that the above
	copyright notice and this permission notice appear in all copies.

	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
	WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
	MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
	ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
	WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
	ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
	OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

const CID = __webpack_require__(753);

/**
 * Take any ipfsHash and convert it to a CID v1 encoded in base32.
 * @param {string} ipfsHash a regular ipfs hash either a cid v0 or v1 (v1 will remain unchanged)
 * @return {string} the resulting ipfs hash as a cid v1
 */
const cidV0ToV1Base32 = (ipfsHash) => {
	let cid = new CID(ipfsHash);
	if (cid.version === 0) {
		cid = cid.toV1();
	}
	return cid.toString('base32');
}

exports.cidV0ToV1Base32 = cidV0ToV1Base32;


/***/ })

}]);