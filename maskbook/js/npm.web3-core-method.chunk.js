(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[136],{

/***/ 1276:
/***/ (function(module, exports, __webpack_require__) {

/*
 This file is part of web3.js.

 web3.js is free software: you can redistribute it and/or modify
 it under the terms of the GNU Lesser General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 web3.js is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public License
 along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * @file utils.js
 * @author Marek Kotewicz <marek@parity.io>
 * @author Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2017
 */


var _ = __webpack_require__(51);
var ethjsUnit = __webpack_require__(205);
var utils = __webpack_require__(738);
var soliditySha3 = __webpack_require__(1277);
var randombytes = __webpack_require__(139);



/**
 * Fires an error in an event emitter and callback and returns the eventemitter
 *
 * @method _fireError
 * @param {Object} error a string, a error, or an object with {message, data}
 * @param {Object} emitter
 * @param {Function} reject
 * @param {Function} callback
 * @param {any} optionalData
 * @return {Object} the emitter
 */
var _fireError = function (error, emitter, reject, callback, optionalData) {
    /*jshint maxcomplexity: 10 */

    // add data if given
    if(_.isObject(error) && !(error instanceof Error) &&  error.data) {
        if(_.isObject(error.data) || _.isArray(error.data)) {
            error.data = JSON.stringify(error.data, null, 2);
        }

        error = error.message +"\n"+ error.data;
    }

    if(_.isString(error)) {
        error = new Error(error);
    }

    if (_.isFunction(callback)) {
        callback(error, optionalData);
    }
    if (_.isFunction(reject)) {
        // suppress uncatched error if an error listener is present
        // OR suppress uncatched error if an callback listener is present
        if (
            emitter &&
            (_.isFunction(emitter.listeners) &&
            emitter.listeners('error').length) || _.isFunction(callback)
        ) {
            emitter.catch(function(){});
        }
        // reject later, to be able to return emitter
        setTimeout(function () {
            reject(error);
        }, 1);
    }

    if(emitter && _.isFunction(emitter.emit)) {
        // emit later, to be able to return emitter
        setTimeout(function () {
            emitter.emit('error', error, optionalData);
            emitter.removeAllListeners();
        }, 1);
    }

    return emitter;
};

/**
 * Should be used to create full function/event name from json abi
 *
 * @method _jsonInterfaceMethodToString
 * @param {Object} json
 * @return {String} full function/event name
 */
var _jsonInterfaceMethodToString = function (json) {
    if (_.isObject(json) && json.name && json.name.indexOf('(') !== -1) {
        return json.name;
    }

    return json.name + '(' + _flattenTypes(false, json.inputs).join(',') + ')';
};


/**
 * Should be used to flatten json abi inputs/outputs into an array of type-representing-strings
 *
 * @method _flattenTypes
 * @param {bool} includeTuple
 * @param {Object} puts
 * @return {Array} parameters as strings
 */
var _flattenTypes = function(includeTuple, puts)
{
    // console.log("entered _flattenTypes. inputs/outputs: " + puts)
    var types = [];

    puts.forEach(function(param) {
        if (typeof param.components === 'object') {
            if (param.type.substring(0, 5) !== 'tuple') {
                throw new Error('components found but type is not tuple; report on GitHub');
            }
            var suffix = '';
            var arrayBracket = param.type.indexOf('[');
            if (arrayBracket >= 0) { suffix = param.type.substring(arrayBracket); }
            var result = _flattenTypes(includeTuple, param.components);
            // console.log("result should have things: " + result)
            if(_.isArray(result) && includeTuple) {
                // console.log("include tuple word, and its an array. joining...: " + result.types)
                types.push('tuple(' + result.join(',') + ')' + suffix);
            }
            else if(!includeTuple) {
                // console.log("don't include tuple, but its an array. joining...: " + result)
                types.push('(' + result.join(',') + ')' + suffix);
            }
            else {
                // console.log("its a single type within a tuple: " + result.types)
                types.push('(' + result + ')');
            }
        } else {
            // console.log("its a type and not directly in a tuple: " + param.type)
            types.push(param.type);
        }
    });

    return types;
};


/**
 * Returns a random hex string by the given bytes size
 *
 * @param {Number} size
 * @returns {string}
 */
var randomHex = function(size) {
    return '0x' + randombytes(size).toString('hex');
};

/**
 * Should be called to get ascii from it's hex representation
 *
 * @method hexToAscii
 * @param {String} hex
 * @returns {String} ascii string representation of hex value
 */
var hexToAscii = function(hex) {
    if (!utils.isHexStrict(hex))
        throw new Error('The parameter must be a valid HEX string.');

    var str = "";
    var i = 0, l = hex.length;
    if (hex.substring(0, 2) === '0x') {
        i = 2;
    }
    for (; i < l; i+=2) {
        var code = parseInt(hex.substr(i, 2), 16);
        str += String.fromCharCode(code);
    }

    return str;
};

/**
 * Should be called to get hex representation (prefixed by 0x) of ascii string
 *
 * @method asciiToHex
 * @param {String} str
 * @returns {String} hex representation of input string
 */
var asciiToHex = function(str) {
    if(!str)
        return "0x00";
    var hex = "";
    for(var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i);
        var n = code.toString(16);
        hex += n.length < 2 ? '0' + n : n;
    }

    return "0x" + hex;
};



/**
 * Returns value of unit in Wei
 *
 * @method getUnitValue
 * @param {String} unit the unit to convert to, default ether
 * @returns {BN} value of the unit (in Wei)
 * @throws error if the unit is not correct:w
 */
var getUnitValue = function (unit) {
    unit = unit ? unit.toLowerCase() : 'ether';
    if (!ethjsUnit.unitMap[unit]) {
        throw new Error('This unit "'+ unit +'" doesn\'t exist, please use the one of the following units' + JSON.stringify(ethjsUnit.unitMap, null, 2));
    }
    return unit;
};

/**
 * Takes a number of wei and converts it to any other ether unit.
 *
 * Possible units are:
 *   SI Short   SI Full        Effigy       Other
 * - kwei       femtoether     babbage
 * - mwei       picoether      lovelace
 * - gwei       nanoether      shannon      nano
 * - --         microether     szabo        micro
 * - --         milliether     finney       milli
 * - ether      --             --
 * - kether                    --           grand
 * - mether
 * - gether
 * - tether
 *
 * @method fromWei
 * @param {Number|String} number can be a number, number string or a HEX of a decimal
 * @param {String} unit the unit to convert to, default ether
 * @return {String|Object} When given a BN object it returns one as well, otherwise a number
 */
var fromWei = function(number, unit) {
    unit = getUnitValue(unit);

    if(!utils.isBN(number) && !_.isString(number)) {
        throw new Error('Please pass numbers as strings or BN objects to avoid precision errors.');
    }

    return utils.isBN(number) ? ethjsUnit.fromWei(number, unit) : ethjsUnit.fromWei(number, unit).toString(10);
};

/**
 * Takes a number of a unit and converts it to wei.
 *
 * Possible units are:
 *   SI Short   SI Full        Effigy       Other
 * - kwei       femtoether     babbage
 * - mwei       picoether      lovelace
 * - gwei       nanoether      shannon      nano
 * - --         microether     szabo        micro
 * - --         microether     szabo        micro
 * - --         milliether     finney       milli
 * - ether      --             --
 * - kether                    --           grand
 * - mether
 * - gether
 * - tether
 *
 * @method toWei
 * @param {Number|String|BN} number can be a number, number string or a HEX of a decimal
 * @param {String} unit the unit to convert from, default ether
 * @return {String|Object} When given a BN object it returns one as well, otherwise a number
 */
var toWei = function(number, unit) {
    unit = getUnitValue(unit);

    if(!utils.isBN(number) && !_.isString(number)) {
        throw new Error('Please pass numbers as strings or BN objects to avoid precision errors.');
    }

    return utils.isBN(number) ? ethjsUnit.toWei(number, unit) : ethjsUnit.toWei(number, unit).toString(10);
};




/**
 * Converts to a checksum address
 *
 * @method toChecksumAddress
 * @param {String} address the given HEX address
 * @return {String}
 */
var toChecksumAddress = function (address) {
    if (typeof address === 'undefined') return '';

    if(!/^(0x)?[0-9a-f]{40}$/i.test(address))
        throw new Error('Given address "'+ address +'" is not a valid Ethereum address.');



    address = address.toLowerCase().replace(/^0x/i,'');
    var addressHash = utils.sha3(address).replace(/^0x/i,'');
    var checksumAddress = '0x';

    for (var i = 0; i < address.length; i++ ) {
        // If ith character is 9 to f then make it uppercase
        if (parseInt(addressHash[i], 16) > 7) {
            checksumAddress += address[i].toUpperCase();
        } else {
            checksumAddress += address[i];
        }
    }
    return checksumAddress;
};

module.exports = {
    _fireError: _fireError,
    _jsonInterfaceMethodToString: _jsonInterfaceMethodToString,
    _flattenTypes: _flattenTypes,
    // extractDisplayName: extractDisplayName,
    // extractTypeName: extractTypeName,
    randomHex: randomHex,
    _: _,
    BN: utils.BN,
    isBN: utils.isBN,
    isBigNumber: utils.isBigNumber,
    isHex: utils.isHex,
    isHexStrict: utils.isHexStrict,
    sha3: utils.sha3,
    sha3Raw: utils.sha3Raw,
    keccak256: utils.sha3,
    soliditySha3: soliditySha3.soliditySha3,
    soliditySha3Raw: soliditySha3.soliditySha3Raw,
    isAddress: utils.isAddress,
    checkAddressChecksum: utils.checkAddressChecksum,
    toChecksumAddress: toChecksumAddress,
    toHex: utils.toHex,
    toBN: utils.toBN,

    bytesToHex: utils.bytesToHex,
    hexToBytes: utils.hexToBytes,

    hexToNumberString: utils.hexToNumberString,

    hexToNumber: utils.hexToNumber,
    toDecimal: utils.hexToNumber, // alias

    numberToHex: utils.numberToHex,
    fromDecimal: utils.numberToHex, // alias

    hexToUtf8: utils.hexToUtf8,
    hexToString: utils.hexToUtf8,
    toUtf8: utils.hexToUtf8,

    utf8ToHex: utils.utf8ToHex,
    stringToHex: utils.utf8ToHex,
    fromUtf8: utils.utf8ToHex,

    hexToAscii: hexToAscii,
    toAscii: hexToAscii,
    asciiToHex: asciiToHex,
    fromAscii: asciiToHex,

    unitMap: ethjsUnit.unitMap,
    toWei: toWei,
    fromWei: fromWei,

    padLeft: utils.leftPad,
    leftPad: utils.leftPad,
    padRight: utils.rightPad,
    rightPad: utils.rightPad,
    toTwosComplement: utils.toTwosComplement,

    isBloom: utils.isBloom,
    isUserEthereumAddressInBloom: utils.isUserEthereumAddressInBloom,
    isContractAddressInBloom: utils.isContractAddressInBloom,
    isTopic: utils.isTopic,
    isTopicInBloom: utils.isTopicInBloom,
    isInBloom: utils.isInBloom
};


/***/ }),

/***/ 1277:
/***/ (function(module, exports, __webpack_require__) {

/*
 This file is part of web3.js.

 web3.js is free software: you can redistribute it and/or modify
 it under the terms of the GNU Lesser General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 web3.js is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public License
 along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * @file soliditySha3.js
 * @author Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2017
 */

var _ = __webpack_require__(51);
var BN = __webpack_require__(52);
var utils = __webpack_require__(738);


var _elementaryName = function (name) {
    /*jshint maxcomplexity:false */

    if (name.startsWith('int[')) {
        return 'int256' + name.slice(3);
    } else if (name === 'int') {
        return 'int256';
    } else if (name.startsWith('uint[')) {
        return 'uint256' + name.slice(4);
    } else if (name === 'uint') {
        return 'uint256';
    } else if (name.startsWith('fixed[')) {
        return 'fixed128x128' + name.slice(5);
    } else if (name === 'fixed') {
        return 'fixed128x128';
    } else if (name.startsWith('ufixed[')) {
        return 'ufixed128x128' + name.slice(6);
    } else if (name === 'ufixed') {
        return 'ufixed128x128';
    }
    return name;
};

// Parse N from type<N>
var _parseTypeN = function (type) {
    var typesize = /^\D+(\d+).*$/.exec(type);
    return typesize ? parseInt(typesize[1], 10) : null;
};

// Parse N from type[<N>]
var _parseTypeNArray = function (type) {
    var arraySize = /^\D+\d*\[(\d+)\]$/.exec(type);
    return arraySize ? parseInt(arraySize[1], 10) : null;
};

var _parseNumber = function (arg) {
    var type = typeof arg;
    if (type === 'string') {
        if (utils.isHexStrict(arg)) {
            return new BN(arg.replace(/0x/i,''), 16);
        } else {
            return new BN(arg, 10);
        }
    } else if (type === 'number') {
        return new BN(arg);
    } else if (utils.isBigNumber(arg)) {
        return new BN(arg.toString(10));
    } else if (utils.isBN(arg)) {
        return arg;
    } else {
        throw new Error(arg +' is not a number');
    }
};

var _solidityPack = function (type, value, arraySize) {
    /*jshint maxcomplexity:false */

    var size, num;
    type = _elementaryName(type);


    if (type === 'bytes') {

        if (value.replace(/^0x/i,'').length % 2 !== 0) {
            throw new Error('Invalid bytes characters '+ value.length);
        }

        return value;
    } else if (type === 'string') {
        return utils.utf8ToHex(value);
    } else if (type === 'bool') {
        return value ? '01' : '00';
    } else if (type.startsWith('address')) {
        if(arraySize) {
            size = 64;
        } else {
            size = 40;
        }

        if(!utils.isAddress(value)) {
            throw new Error(value +' is not a valid address, or the checksum is invalid.');
        }

        return utils.leftPad(value.toLowerCase(), size);
    }

    size = _parseTypeN(type);

    if (type.startsWith('bytes')) {

        if(!size) {
            throw new Error('bytes[] not yet supported in solidity');
        }

        // must be 32 byte slices when in an array
        if(arraySize) {
            size = 32;
        }

        if (size < 1 || size > 32 || size < value.replace(/^0x/i,'').length / 2 ) {
            throw new Error('Invalid bytes' + size +' for '+ value);
        }

        return utils.rightPad(value, size * 2);
    } else if (type.startsWith('uint')) {

        if ((size % 8) || (size < 8) || (size > 256)) {
            throw new Error('Invalid uint'+size+' size');
        }

        num = _parseNumber(value);
        if (num.bitLength() > size) {
            throw new Error('Supplied uint exceeds width: ' + size + ' vs ' + num.bitLength());
        }

        if(num.lt(new BN(0))) {
            throw new Error('Supplied uint '+ num.toString() +' is negative');
        }

        return size ? utils.leftPad(num.toString('hex'), size/8 * 2) : num;
    } else if (type.startsWith('int')) {

        if ((size % 8) || (size < 8) || (size > 256)) {
            throw new Error('Invalid int'+size+' size');
        }

        num = _parseNumber(value);
        if (num.bitLength() > size) {
            throw new Error('Supplied int exceeds width: ' + size + ' vs ' + num.bitLength());
        }

        if(num.lt(new BN(0))) {
            return num.toTwos(size).toString('hex');
        } else {
            return size ? utils.leftPad(num.toString('hex'), size/8 * 2) : num;
        }

    } else {
        // FIXME: support all other types
        throw new Error('Unsupported or invalid type: ' + type);
    }
};


var _processSoliditySha3Args = function (arg) {
    /*jshint maxcomplexity:false */

    if(_.isArray(arg)) {
        throw new Error('Autodetection of array types is not supported.');
    }

    var type, value = '';
    var hexArg, arraySize;

    // if type is given
    if (_.isObject(arg) && (arg.hasOwnProperty('v') || arg.hasOwnProperty('t') || arg.hasOwnProperty('value') || arg.hasOwnProperty('type'))) {
        type = arg.hasOwnProperty('t') ? arg.t : arg.type;
        value = arg.hasOwnProperty('v') ? arg.v : arg.value;

    // otherwise try to guess the type
    } else {

        type = utils.toHex(arg, true);
        value = utils.toHex(arg);

        if (!type.startsWith('int') && !type.startsWith('uint')) {
            type = 'bytes';
        }
    }

    if ((type.startsWith('int') || type.startsWith('uint')) &&  typeof value === 'string' && !/^(-)?0x/i.test(value)) {
        value = new BN(value);
    }

    // get the array size
    if(_.isArray(value)) {
        arraySize = _parseTypeNArray(type);
        if(arraySize && value.length !== arraySize) {
            throw new Error(type +' is not matching the given array '+ JSON.stringify(value));
        } else {
            arraySize = value.length;
        }
    }


    if (_.isArray(value)) {
        hexArg = value.map(function (val) {
            return _solidityPack(type, val, arraySize).toString('hex').replace('0x','');
        });
        return hexArg.join('');
    } else {
        hexArg = _solidityPack(type, value, arraySize);
        return hexArg.toString('hex').replace('0x','');
    }

};

/**
 * Hashes solidity values to a sha3 hash using keccak 256
 *
 * @method soliditySha3
 * @return {Object} the sha3
 */
var soliditySha3 = function () {
    /*jshint maxcomplexity:false */

    var args = Array.prototype.slice.call(arguments);

    var hexArgs = _.map(args, _processSoliditySha3Args);

    // console.log(args, hexArgs);
    // console.log('0x'+ hexArgs.join(''));

    return utils.sha3('0x'+ hexArgs.join(''));
};

/**
 * Hashes solidity values to a sha3 hash using keccak 256 but does return the hash of value `null` instead of `null`
 *
 * @method soliditySha3Raw
 * @return {Object} the sha3
 */
var soliditySha3Raw = function () {
    return utils.sha3Raw('0x'+ _.map(Array.prototype.slice.call(arguments), _processSoliditySha3Args).join(''));
};


module.exports = {
    soliditySha3: soliditySha3,
    soliditySha3Raw: soliditySha3Raw
};


/***/ }),

/***/ 183:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
    This file is part of web3.js.

    web3.js is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    web3.js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/**
 * @file index.js
 * @author Fabian Vogelsteller <fabian@ethereum.org>
 * @author Marek Kotewicz <marek@parity.io>
 * @date 2017
 */



var _ = __webpack_require__(51);
var errors = __webpack_require__(61).errors;
var formatters = __webpack_require__(61).formatters;
var utils = __webpack_require__(1276);
var promiEvent = __webpack_require__(404);
var Subscriptions = __webpack_require__(405).subscriptions;

var EthersTransactionUtils = __webpack_require__(621);

var Method = function Method(options) {

    if (!options.call || !options.name) {
        throw new Error('When creating a method you need to provide at least the "name" and "call" property.');
    }

    this.name = options.name;
    this.call = options.call;
    this.params = options.params || 0;
    this.inputFormatter = options.inputFormatter;
    this.outputFormatter = options.outputFormatter;
    this.transformPayload = options.transformPayload;
    this.extraFormatters = options.extraFormatters;
    this.abiCoder = options.abiCoder; // Will be used to encode the revert reason string

    this.requestManager = options.requestManager;

    // reference to eth.accounts
    this.accounts = options.accounts;

    this.defaultBlock = options.defaultBlock || 'latest';
    this.defaultAccount = options.defaultAccount || null;
    this.transactionBlockTimeout = options.transactionBlockTimeout || 50;
    this.transactionConfirmationBlocks = options.transactionConfirmationBlocks || 24;
    this.transactionPollingTimeout = options.transactionPollingTimeout || 750;
    this.defaultCommon = options.defaultCommon;
    this.defaultChain = options.defaultChain;
    this.defaultHardfork = options.defaultHardfork;
    this.handleRevert = options.handleRevert;
};

Method.prototype.setRequestManager = function (requestManager, accounts) {
    this.requestManager = requestManager;

    // reference to eth.accounts
    if (accounts) {
        this.accounts = accounts;
    }

};

Method.prototype.createFunction = function (requestManager, accounts) {
    var func = this.buildCall();
    func.call = this.call;

    this.setRequestManager(requestManager || this.requestManager, accounts || this.accounts);

    return func;
};

Method.prototype.attachToObject = function (obj) {
    var func = this.buildCall();
    func.call = this.call;
    var name = this.name.split('.');
    if (name.length > 1) {
        obj[name[0]] = obj[name[0]] || {};
        obj[name[0]][name[1]] = func;
    } else {
        obj[name[0]] = func;
    }
};

/**
 * Should be used to determine name of the jsonrpc method based on arguments
 *
 * @method getCall
 * @param {Array} arguments
 * @return {String} name of jsonrpc method
 */
Method.prototype.getCall = function (args) {
    return _.isFunction(this.call) ? this.call(args) : this.call;
};

/**
 * Should be used to extract callback from array of arguments. Modifies input param
 *
 * @method extractCallback
 * @param {Array} arguments
 * @return {Function|Null} callback, if exists
 */
Method.prototype.extractCallback = function (args) {
    if (_.isFunction(args[args.length - 1])) {
        return args.pop(); // modify the args array!
    }
};

/**
 * Should be called to check if the number of arguments is correct
 *
 * @method validateArgs
 * @param {Array} arguments
 * @throws {Error} if it is not
 */
Method.prototype.validateArgs = function (args) {
    if (args.length !== this.params) {
        throw errors.InvalidNumberOfParams(args.length, this.params, this.name);
    }
};

/**
 * Should be called to format input args of method
 *
 * @method formatInput
 * @param {Array}
 * @return {Array}
 */
Method.prototype.formatInput = function (args) {
    var _this = this;

    if (!this.inputFormatter) {
        return args;
    }

    return this.inputFormatter.map(function (formatter, index) {
        // bind this for defaultBlock, and defaultAccount
        return formatter ? formatter.call(_this, args[index]) : args[index];
    });
};

/**
 * Should be called to format output(result) of method
 *
 * @method formatOutput
 * @param {Object}
 * @return {Object}
 */
Method.prototype.formatOutput = function (result) {
    var _this = this;

    if (_.isArray(result)) {
        return result.map(function (res) {
            return _this.outputFormatter && res ? _this.outputFormatter(res) : res;
        });
    } else {
        return this.outputFormatter && result ? this.outputFormatter(result) : result;
    }
};

/**
 * Should create payload from given input args
 *
 * @method toPayload
 * @param {Array} args
 * @return {Object}
 */
Method.prototype.toPayload = function (args) {
    var call = this.getCall(args);
    var callback = this.extractCallback(args);
    var params = this.formatInput(args);
    this.validateArgs(params);

    var payload = {
        method: call,
        params: params,
        callback: callback
    };

    if (this.transformPayload) {
        payload = this.transformPayload(payload);
    }

    return payload;
};


Method.prototype._confirmTransaction = function (defer, result, payload) {
    var method = this,
        promiseResolved = false,
        canUnsubscribe = true,
        timeoutCount = 0,
        confirmationCount = 0,
        intervalId = null,
        lastBlock = null,
        receiptJSON = '',
        gasProvided = (_.isObject(payload.params[0]) && payload.params[0].gas) ? payload.params[0].gas : null,
        isContractDeployment = _.isObject(payload.params[0]) &&
            payload.params[0].data &&
            payload.params[0].from &&
            !payload.params[0].to,
        hasBytecode = isContractDeployment && payload.params[0].data.length > 2;

    // add custom send Methods
    var _ethereumCalls = [
        new Method({
            name: 'getBlockByNumber',
            call: 'eth_getBlockByNumber',
            params: 2,
            inputFormatter: [formatters.inputBlockNumberFormatter, function (val) {
                return !!val;
            }],
            outputFormatter: formatters.outputBlockFormatter
        }),
        new Method({
            name: 'getTransactionReceipt',
            call: 'eth_getTransactionReceipt',
            params: 1,
            inputFormatter: [null],
            outputFormatter: formatters.outputTransactionReceiptFormatter
        }),
        new Method({
            name: 'getCode',
            call: 'eth_getCode',
            params: 2,
            inputFormatter: [formatters.inputAddressFormatter, formatters.inputDefaultBlockNumberFormatter]
        }),
        new Method({
            name: 'getTransactionByHash',
            call: 'eth_getTransactionByHash',
            params: 1,
            inputFormatter: [null],
            outputFormatter: formatters.outputTransactionFormatter
        }),
        new Subscriptions({
            name: 'subscribe',
            type: 'eth',
            subscriptions: {
                'newBlockHeaders': {
                    subscriptionName: 'newHeads', // replace subscription with this name
                    params: 0,
                    outputFormatter: formatters.outputBlockFormatter
                }
            }
        })
    ];
    // attach methods to this._ethereumCall
    var _ethereumCall = {};
    _.each(_ethereumCalls, function (mthd) {
        mthd.attachToObject(_ethereumCall);
        mthd.requestManager = method.requestManager; // assign rather than call setRequestManager()
    });


    // fire "receipt" and confirmation events and resolve after
    var checkConfirmation = function (existingReceipt, isPolling, err, blockHeader, sub) {
        if (!err) {
            // create fake unsubscribe
            if (!sub) {
                sub = {
                    unsubscribe: function () {
                        clearInterval(intervalId);
                    }
                };
            }
            // if we have a valid receipt we don't need to send a request
            return (existingReceipt ? promiEvent.resolve(existingReceipt) : _ethereumCall.getTransactionReceipt(result))
            // catch error from requesting receipt
                .catch(function (err) {
                    sub.unsubscribe();
                    promiseResolved = true;
                    utils._fireError(
                        {
                            message: 'Failed to check for transaction receipt:',
                            data: err
                        },
                        defer.eventEmitter,
                        defer.reject
                    );
                })
                // if CONFIRMATION listener exists check for confirmations, by setting canUnsubscribe = false
                .then(async function (receipt) {
                    if (!receipt || !receipt.blockHash) {
                        throw new Error('Receipt missing or blockHash null');
                    }

                    // apply extra formatters
                    if (method.extraFormatters && method.extraFormatters.receiptFormatter) {
                        receipt = method.extraFormatters.receiptFormatter(receipt);
                    }

                    // check if confirmation listener exists
                    if (defer.eventEmitter.listeners('confirmation').length > 0) {
                        var block;

                        // If there was an immediately retrieved receipt, it's already
                        // been confirmed by the direct call to checkConfirmation needed
                        // for parity instant-seal
                        if (existingReceipt === undefined || confirmationCount !== 0) {
                            // Get latest block to emit with confirmation
                            var latestBlock = await _ethereumCall.getBlockByNumber('latest');
                            var latestBlockHash = latestBlock ? latestBlock.hash : null;

                            if (isPolling) { // Check if actually a new block is existing on polling
                                if (lastBlock) {
                                    block = await _ethereumCall.getBlockByNumber(lastBlock.number + 1);
                                    if (block) {
                                        lastBlock = block;
                                        defer.eventEmitter.emit('confirmation', confirmationCount, receipt, latestBlockHash);
                                    }
                                } else {
                                    block = await _ethereumCall.getBlockByNumber(receipt.blockNumber);
                                    lastBlock = block;
                                    defer.eventEmitter.emit('confirmation', confirmationCount, receipt, latestBlockHash);
                                }
                            } else {
                                defer.eventEmitter.emit('confirmation', confirmationCount, receipt, latestBlockHash);
                            }
                        }

                        if ((isPolling && block) || !isPolling) {
                            confirmationCount++;
                        }
                        canUnsubscribe = false;

                        if (confirmationCount === method.transactionConfirmationBlocks + 1) { // add 1 so we account for conf 0
                            sub.unsubscribe();
                            defer.eventEmitter.removeAllListeners();
                        }
                    }

                    return receipt;
                })
                // CHECK for CONTRACT DEPLOYMENT
                .then(async function (receipt) {

                    if (isContractDeployment && !promiseResolved) {

                        if (!receipt.contractAddress) {

                            if (canUnsubscribe) {
                                sub.unsubscribe();
                                promiseResolved = true;
                            }

                            utils._fireError(
                                errors.NoContractAddressFoundError(receipt),
                                defer.eventEmitter,
                                defer.reject,
                                null,
                                receipt
                            );
                            return;
                        }

                        var code;
                        try {
                            code = await _ethereumCall.getCode(receipt.contractAddress);
                        } catch(err){
                            // ignore;
                        }

                        if (!code) {
                            return;
                        }

                        // If deployment is status.true and there was a real
                        // bytecode string, assume it was successful.
                        var deploymentSuccess = receipt.status === true && hasBytecode;

                        if (deploymentSuccess || code.length > 2) {
                            defer.eventEmitter.emit('receipt', receipt);

                            // if contract, return instance instead of receipt
                            if (method.extraFormatters && method.extraFormatters.contractDeployFormatter) {
                                defer.resolve(method.extraFormatters.contractDeployFormatter(receipt));
                            } else {
                                defer.resolve(receipt);
                            }

                            // need to remove listeners, as they aren't removed automatically when succesfull
                            if (canUnsubscribe) {
                                defer.eventEmitter.removeAllListeners();
                            }

                        } else {
                            utils._fireError(
                                errors.ContractCodeNotStoredError(receipt),
                                defer.eventEmitter,
                                defer.reject,
                                null,
                                receipt
                            );
                        }

                        if (canUnsubscribe) {
                            sub.unsubscribe();
                        }
                        promiseResolved = true;
                    }

                    return receipt;
                })
                // CHECK for normal tx check for receipt only
                .then(async function (receipt) {
                    if (!isContractDeployment && !promiseResolved) {
                        if (!receipt.outOfGas &&
                            (!gasProvided || gasProvided !== receipt.gasUsed) &&
                            (receipt.status === true || receipt.status === '0x1' || typeof receipt.status === 'undefined')) {
                            defer.eventEmitter.emit('receipt', receipt);
                            defer.resolve(receipt);

                            // need to remove listeners, as they aren't removed automatically when succesfull
                            if (canUnsubscribe) {
                                defer.eventEmitter.removeAllListeners();
                            }

                        } else {
                            receiptJSON = JSON.stringify(receipt, null, 2);

                            if (receipt.status === false || receipt.status === '0x0') {
                                try {
                                    var revertMessage = null;

                                    if ( method.handleRevert &&
                                        (method.call === 'eth_sendTransaction' || method.call === 'eth_sendRawTransaction'))
                                    {
                                        var txReplayOptions = payload.params[0];

                                        // If send was raw, fetch the transaction and reconstitute the
                                        // original params so they can be replayed with `eth_call`
                                        if (method.call === 'eth_sendRawTransaction'){
                                            var rawTransactionHex = payload.params[0];

                                            var parsedTx = EthersTransactionUtils.parse(rawTransactionHex);

                                            txReplayOptions = formatters.inputTransactionFormatter({
                                                data: parsedTx.data,
                                                to: parsedTx.to,
                                                from: parsedTx.from,
                                                gas: parsedTx.gasLimit.toHexString(),
                                                gasPrice: parsedTx.gasPrice.toHexString(),
                                                value: parsedTx.value.toHexString()
                                            })
                                        }

                                        // Get revert reason string with eth_call
                                        revertMessage = await method.getRevertReason(
                                            txReplayOptions,
                                            receipt.blockNumber
                                        );

                                        if (revertMessage) { // Only throw a revert error if a revert reason is existing
                                            utils._fireError(
                                                errors.TransactionRevertInstructionError(revertMessage.reason, revertMessage.signature, receipt),
                                                defer.eventEmitter,
                                                defer.reject,
                                                null,
                                                receipt
                                            );
                                        } else {
                                            throw false; // Throw false and let the try/catch statement handle the error correctly after
                                        }
                                    } else {
                                        throw false; // Throw false and let the try/catch statement handle the error correctly after
                                    }
                                } catch (error) {
                                    // Throw an normal revert error if no revert reason is given or the detection of it is disabled
                                    utils._fireError(
                                        errors.TransactionRevertedWithoutReasonError(receipt),
                                        defer.eventEmitter,
                                        defer.reject,
                                        null,
                                        receipt
                                    );
                                }
                            } else {
                                // Throw OOG if status is not existing and provided gas and used gas are equal
                                utils._fireError(
                                    errors.TransactionOutOfGasError(receipt),
                                    defer.eventEmitter,
                                    defer.reject,
                                    null,
                                    receipt
                                );
                            }
                        }

                        if (canUnsubscribe) {
                            sub.unsubscribe();
                        }
                        promiseResolved = true;
                    }

                })
                // time out the transaction if not mined after 50 blocks
                .catch(function () {
                    timeoutCount++;

                    // check to see if we are http polling
                    if (!!isPolling) {
                        // polling timeout is different than transactionBlockTimeout blocks since we are triggering every second
                        if (timeoutCount - 1 >= method.transactionPollingTimeout) {
                            sub.unsubscribe();
                            promiseResolved = true;
                            utils._fireError(
                                errors.TransactionError('Transaction was not mined within ' + method.transactionPollingTimeout + ' seconds, please make sure your transaction was properly sent. Be aware that it might still be mined!'),
                                defer.eventEmitter,
                                defer.reject
                            );
                        }
                    } else {
                        if (timeoutCount - 1 >= method.transactionBlockTimeout) {
                            sub.unsubscribe();
                            promiseResolved = true;
                            utils._fireError(
                                errors.TransactionError('Transaction was not mined within ' + method.transactionBlockTimeout + ' blocks, please make sure your transaction was properly sent. Be aware that it might still be mined!'),
                                defer.eventEmitter,
                                defer.reject
                            );
                        }
                    }
                });


        } else {
            sub.unsubscribe();
            promiseResolved = true;
            utils._fireError({
                message: 'Failed to subscribe to new newBlockHeaders to confirm the transaction receipts.',
                data: err
            }, defer.eventEmitter, defer.reject);
        }
    };

    // start watching for confirmation depending on the support features of the provider
    var startWatching = function (existingReceipt) {
        const startInterval = () => {
            intervalId = setInterval(checkConfirmation.bind(null, existingReceipt, true), 1000);
        }

        if (!this.requestManager.provider.on) {
            startInterval()
        } else {
            _ethereumCall.subscribe('newBlockHeaders', function (err, blockHeader, sub) {
                if (err || !blockHeader) {
                    // fall back to polling
                    startInterval()
                } else {
                    checkConfirmation(existingReceipt, false, err, blockHeader, sub);
                }
            })
        }
    }.bind(this);


    // first check if we already have a confirmed transaction
    _ethereumCall.getTransactionReceipt(result)
        .then(function (receipt) {
            if (receipt && receipt.blockHash) {
                if (defer.eventEmitter.listeners('confirmation').length > 0) {
                    // We must keep on watching for new Blocks, if a confirmation listener is present
                    startWatching(receipt);
                }
                checkConfirmation(receipt, false);

            } else if (!promiseResolved) {
                startWatching();
            }
        })
        .catch(function () {
            if (!promiseResolved) startWatching();
        });

};


var getWallet = function (from, accounts) {
    var wallet = null;

    // is index given
    if (_.isNumber(from)) {
        wallet = accounts.wallet[from];

        // is account given
    } else if (_.isObject(from) && from.address && from.privateKey) {
        wallet = from;

        // search in wallet for address
    } else {
        wallet = accounts.wallet[from.toLowerCase()];
    }

    return wallet;
};

Method.prototype.buildCall = function () {
    var method = this,
        isSendTx = (method.call === 'eth_sendTransaction' || method.call === 'eth_sendRawTransaction'), // || method.call === 'personal_sendTransaction'
        isCall = (method.call === 'eth_call');

    // actual send function
    var send = function () {
        var defer = promiEvent(!isSendTx),
            payload = method.toPayload(Array.prototype.slice.call(arguments));

        // CALLBACK function
        var sendTxCallback = function (err, result) {
            if (method.handleRevert && isCall && method.abiCoder) {
                var reasonData;

                // Ganache / Geth <= 1.9.13 return the reason data as a successful eth_call response
                // Geth >= 1.9.15 attaches the reason data to an error object.
                // Geth 1.9.14 is missing revert reason (https://github.com/ethereum/web3.js/issues/3520)
                if (!err && method.isRevertReasonString(result)){
                    reasonData = result.substring(10);
                } else if (err && err.data){
                    reasonData = err.data.substring(10);
                }

                if (reasonData){
                    var reason = method.abiCoder.decodeParameter('string', '0x' + reasonData);
                    var signature = 'Error(String)';

                    utils._fireError(
                        errors.RevertInstructionError(reason, signature),
                        defer.eventEmitter,
                        defer.reject,
                        payload.callback,
                        {
                            reason: reason,
                            signature: signature
                        }
                    );

                    return;
                }
            }

            try {
                result = method.formatOutput(result);
            } catch (e) {
                err = e;
            }

            if (result instanceof Error) {
                err = result;
            }

            if (!err) {
                if (payload.callback) {
                    payload.callback(null, result);
                }
            } else {
                if (err.error) {
                    err = err.error;
                }

                return utils._fireError(err, defer.eventEmitter, defer.reject, payload.callback);
            }

            // return PROMISE
            if (!isSendTx) {
                if (!err) {
                    defer.resolve(result);
                }

                // return PROMIEVENT
            } else {
                defer.eventEmitter.emit('transactionHash', result);

                method._confirmTransaction(defer, result, payload);
            }

        };

        // SENDS the SIGNED SIGNATURE
        var sendSignedTx = function (sign) {

            var signedPayload = _.extend({}, payload, {
                method: 'eth_sendRawTransaction',
                params: [sign.rawTransaction]
            });

            method.requestManager.send(signedPayload, sendTxCallback);
        };


        var sendRequest = function (payload, method) {

            if (method && method.accounts && method.accounts.wallet && method.accounts.wallet.length) {
                var wallet;

                // ETH_SENDTRANSACTION
                if (payload.method === 'eth_sendTransaction') {
                    var tx = payload.params[0];
                    wallet = getWallet((_.isObject(tx)) ? tx.from : null, method.accounts);


                    // If wallet was found, sign tx, and send using sendRawTransaction
                    if (wallet && wallet.privateKey) {
                        var txOptions = _.omit(tx, 'from');

                        if (method.defaultChain && !txOptions.chain) {
                            txOptions.chain = method.defaultChain;
                        }

                        if (method.defaultHardfork && !txOptions.hardfork) {
                            txOptions.hardfork = method.defaultHardfork;
                        }

                        if (method.defaultCommon && !txOptions.common) {
                            txOptions.common = method.defaultCommon;
                        }

                        return method.accounts.signTransaction(txOptions, wallet.privateKey)
                            .then(sendSignedTx)
                            .catch(function (err) {
                                if (_.isFunction(defer.eventEmitter.listeners) && defer.eventEmitter.listeners('error').length) {
                                    defer.eventEmitter.emit('error', err);
                                    defer.eventEmitter.removeAllListeners();
                                    defer.eventEmitter.catch(function () {
                                    });
                                }
                                defer.reject(err);
                            });
                    }

                    // ETH_SIGN
                } else if (payload.method === 'eth_sign') {
                    var data = payload.params[1];
                    wallet = getWallet(payload.params[0], method.accounts);

                    // If wallet was found, sign tx, and send using sendRawTransaction
                    if (wallet && wallet.privateKey) {
                        var sign = method.accounts.sign(data, wallet.privateKey);

                        if (payload.callback) {
                            payload.callback(null, sign.signature);
                        }

                        defer.resolve(sign.signature);
                        return;
                    }


                }
            }


            return method.requestManager.send(payload, sendTxCallback);
        };

        // Send the actual transaction
        if (isSendTx && _.isObject(payload.params[0]) && typeof payload.params[0].gasPrice === 'undefined') {

            var getGasPrice = (new Method({
                name: 'getGasPrice',
                call: 'eth_gasPrice',
                params: 0
            })).createFunction(method.requestManager);

            getGasPrice(function (err, gasPrice) {

                if (gasPrice) {
                    payload.params[0].gasPrice = gasPrice;
                }

                if (isSendTx) {
                    setTimeout(() => {
                        defer.eventEmitter.emit('sending', payload);
                    }, 0);
                }

                sendRequest(payload, method);
            });

        } else {
            if (isSendTx) {
                setTimeout(() => {
                    defer.eventEmitter.emit('sending', payload);
                }, 0);
            }

            sendRequest(payload, method);
        }

        if (isSendTx) {
            setTimeout(() => {
                defer.eventEmitter.emit('sent', payload);
            }, 0);
        }

        return defer.eventEmitter;
    };

    // necessary to attach things to the method
    send.method = method;
    // necessary for batch requests
    send.request = this.request.bind(this);
    return send;
};

/**
 * Returns the revert reason string if existing or otherwise false.
 *
 * @method getRevertReason
 *
 * @param {Object} txOptions
 * @param {Number} blockNumber
 *
 * @returns {Promise<Boolean|String>}
 */
Method.prototype.getRevertReason = function (txOptions, blockNumber) {
    var self = this;

    return new Promise(function (resolve, reject) {
        (new Method({
            name: 'call',
            call: 'eth_call',
            params: 2,
            abiCoder: self.abiCoder,
            handleRevert: true
        }))
            .createFunction(self.requestManager)(txOptions, utils.numberToHex(blockNumber))
            .then(function () {
                resolve(false);
            })
            .catch(function (error) {
                if (error.reason) {
                    resolve({
                        reason: error.reason,
                        signature: error.signature
                    });
                } else {
                    reject(error);
                }
            });
    });
};

/**
 * Checks if the given hex string is a revert message from the EVM
 *
 * @method isRevertReasonString
 *
 * @param {String} data - Hex string prefixed with 0x
 *
 * @returns {Boolean}
 */
Method.prototype.isRevertReasonString = function (data) {
    return _.isString(data) && ((data.length - 2) / 2) % 32 === 4 && data.substring(0, 10) === '0x08c379a0';
};

/**
 * Should be called to create the pure JSONRPC request which can be used in a batch request
 *
 * @method request
 * @return {Object} jsonrpc request
 */
Method.prototype.request = function () {
    var payload = this.toPayload(Array.prototype.slice.call(arguments));
    payload.format = this.formatOutput.bind(this);
    return payload;
};

module.exports = Method;


/***/ }),

/***/ 738:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(Buffer) {/*
 This file is part of web3.js.

 web3.js is free software: you can redistribute it and/or modify
 it under the terms of the GNU Lesser General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 web3.js is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public License
 along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * @file utils.js
 * @author Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2017
 */

var _ = __webpack_require__(51);
var BN = __webpack_require__(52);
var numberToBN = __webpack_require__(191);
var utf8 = __webpack_require__(206);
var Hash = __webpack_require__(182);
var ethereumBloomFilters = __webpack_require__(207);



/**
 * Returns true if object is BN, otherwise false
 *
 * @method isBN
 * @param {Object} object
 * @return {Boolean}
 */
var isBN = function (object) {
    return BN.isBN(object);
};

/**
 * Returns true if object is BigNumber, otherwise false
 *
 * @method isBigNumber
 * @param {Object} object
 * @return {Boolean}
 */
var isBigNumber = function (object) {
    return object && object.constructor && object.constructor.name === 'BigNumber';
};

/**
 * Takes an input and transforms it into an BN
 *
 * @method toBN
 * @param {Number|String|BN} number, string, HEX string or BN
 * @return {BN} BN
 */
var toBN = function(number){
    try {
        return numberToBN.apply(null, arguments);
    } catch(e) {
        throw new Error(e + ' Given value: "'+ number +'"');
    }
};


/**
 * Takes and input transforms it into BN and if it is negative value, into two's complement
 *
 * @method toTwosComplement
 * @param {Number|String|BN} number
 * @return {String}
 */
var toTwosComplement = function (number) {
    return '0x'+ toBN(number).toTwos(256).toString(16, 64);
};

/**
 * Checks if the given string is an address
 *
 * @method isAddress
 * @param {String} address the given HEX address
 * @return {Boolean}
 */
var isAddress = function (address) {
    // check if it has the basic requirements of an address
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
        return false;
        // If it's ALL lowercase or ALL upppercase
    } else if (/^(0x|0X)?[0-9a-f]{40}$/.test(address) || /^(0x|0X)?[0-9A-F]{40}$/.test(address)) {
        return true;
        // Otherwise check each case
    } else {
        return checkAddressChecksum(address);
    }
};



/**
 * Checks if the given string is a checksummed address
 *
 * @method checkAddressChecksum
 * @param {String} address the given HEX address
 * @return {Boolean}
 */
var checkAddressChecksum = function (address) {
    // Check each case
    address = address.replace(/^0x/i,'');
    var addressHash = sha3(address.toLowerCase()).replace(/^0x/i,'');

    for (var i = 0; i < 40; i++ ) {
        // the nth letter should be uppercase if the nth digit of casemap is 1
        if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
            return false;
        }
    }
    return true;
};

/**
 * Should be called to pad string to expected length
 *
 * @method leftPad
 * @param {String} string to be padded
 * @param {Number} chars that result string should have
 * @param {String} sign, by default 0
 * @returns {String} right aligned string
 */
var leftPad = function (string, chars, sign) {
    var hasPrefix = /^0x/i.test(string) || typeof string === 'number';
    string = string.toString(16).replace(/^0x/i,'');

    var padding = (chars - string.length + 1 >= 0) ? chars - string.length + 1 : 0;

    return (hasPrefix ? '0x' : '') + new Array(padding).join(sign ? sign : "0") + string;
};

/**
 * Should be called to pad string to expected length
 *
 * @method rightPad
 * @param {String} string to be padded
 * @param {Number} chars that result string should have
 * @param {String} sign, by default 0
 * @returns {String} right aligned string
 */
var rightPad = function (string, chars, sign) {
    var hasPrefix = /^0x/i.test(string) || typeof string === 'number';
    string = string.toString(16).replace(/^0x/i,'');

    var padding = (chars - string.length + 1 >= 0) ? chars - string.length + 1 : 0;

    return (hasPrefix ? '0x' : '') + string + (new Array(padding).join(sign ? sign : "0"));
};


/**
 * Should be called to get hex representation (prefixed by 0x) of utf8 string
 *
 * @method utf8ToHex
 * @param {String} str
 * @returns {String} hex representation of input string
 */
var utf8ToHex = function(str) {
    str = utf8.encode(str);
    var hex = "";

    // remove \u0000 padding from either side
    str = str.replace(/^(?:\u0000)*/,'');
    str = str.split("").reverse().join("");
    str = str.replace(/^(?:\u0000)*/,'');
    str = str.split("").reverse().join("");

    for(var i = 0; i < str.length; i++) {
        var code = str.charCodeAt(i);
        // if (code !== 0) {
        var n = code.toString(16);
        hex += n.length < 2 ? '0' + n : n;
        // }
    }

    return "0x" + hex;
};

/**
 * Should be called to get utf8 from it's hex representation
 *
 * @method hexToUtf8
 * @param {String} hex
 * @returns {String} ascii string representation of hex value
 */
var hexToUtf8 = function(hex) {
    if (!isHexStrict(hex))
        throw new Error('The parameter "'+ hex +'" must be a valid HEX string.');

    var str = "";
    var code = 0;
    hex = hex.replace(/^0x/i,'');

    // remove 00 padding from either side
    hex = hex.replace(/^(?:00)*/,'');
    hex = hex.split("").reverse().join("");
    hex = hex.replace(/^(?:00)*/,'');
    hex = hex.split("").reverse().join("");

    var l = hex.length;

    for (var i=0; i < l; i+=2) {
        code = parseInt(hex.substr(i, 2), 16);
        // if (code !== 0) {
        str += String.fromCharCode(code);
        // }
    }

    return utf8.decode(str);
};


/**
 * Converts value to it's number representation
 *
 * @method hexToNumber
 * @param {String|Number|BN} value
 * @return {String}
 */
var hexToNumber = function (value) {
    if (!value) {
        return value;
    }

    if (_.isString(value) && !isHexStrict(value)) {
        throw new Error('Given value "'+value+'" is not a valid hex string.');
    }

    return toBN(value).toNumber();
};

/**
 * Converts value to it's decimal representation in string
 *
 * @method hexToNumberString
 * @param {String|Number|BN} value
 * @return {String}
 */
var hexToNumberString = function (value) {
    if (!value) return value;

    if (_.isString(value) && !isHexStrict(value)) {
        throw new Error('Given value "'+value+'" is not a valid hex string.');
    }

    return toBN(value).toString(10);
};


/**
 * Converts value to it's hex representation
 *
 * @method numberToHex
 * @param {String|Number|BN} value
 * @return {String}
 */
var numberToHex = function (value) {
    if (_.isNull(value) || _.isUndefined(value)) {
        return value;
    }

    if (!isFinite(value) && !isHexStrict(value)) {
        throw new Error('Given input "'+value+'" is not a number.');
    }

    var number = toBN(value);
    var result = number.toString(16);

    return number.lt(new BN(0)) ? '-0x' + result.substr(1) : '0x' + result;
};


/**
 * Convert a byte array to a hex string
 *
 * Note: Implementation from crypto-js
 *
 * @method bytesToHex
 * @param {Array} bytes
 * @return {String} the hex string
 */
var bytesToHex = function(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        /* jshint ignore:start */
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
        /* jshint ignore:end */
    }
    return '0x'+ hex.join("");
};

/**
 * Convert a hex string to a byte array
 *
 * Note: Implementation from crypto-js
 *
 * @method hexToBytes
 * @param {string} hex
 * @return {Array} the byte array
 */
var hexToBytes = function(hex) {
    hex = hex.toString(16);

    if (!isHexStrict(hex)) {
        throw new Error('Given value "'+ hex +'" is not a valid hex string.');
    }

    hex = hex.replace(/^0x/i,'');

    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
};

/**
 * Auto converts any given value into it's hex representation.
 *
 * And even stringifys objects before.
 *
 * @method toHex
 * @param {String|Number|BN|Object|Buffer} value
 * @param {Boolean} returnType
 * @return {String}
 */
var toHex = function (value, returnType) {
    /*jshint maxcomplexity: false */

    if (isAddress(value)) {
        return returnType ? 'address' : '0x'+ value.toLowerCase().replace(/^0x/i,'');
    }

    if (_.isBoolean(value)) {
        return returnType ? 'bool' : value ? '0x01' : '0x00';
    }

    if (Buffer.isBuffer(value)) {
        return '0x' + value.toString('hex');
    }

    if (_.isObject(value) && !isBigNumber(value) && !isBN(value)) {
        return returnType ? 'string' : utf8ToHex(JSON.stringify(value));
    }

    // if its a negative number, pass it through numberToHex
    if (_.isString(value)) {
        if (value.indexOf('-0x') === 0 || value.indexOf('-0X') === 0) {
            return returnType ? 'int256' : numberToHex(value);
        } else if(value.indexOf('0x') === 0 || value.indexOf('0X') === 0) {
            return returnType ? 'bytes' : value;
        } else if (!isFinite(value)) {
            return returnType ? 'string' : utf8ToHex(value);
        }
    }

    return returnType ? (value < 0 ? 'int256' : 'uint256') : numberToHex(value);
};


/**
 * Check if string is HEX, requires a 0x in front
 *
 * @method isHexStrict
 * @param {String} hex to be checked
 * @returns {Boolean}
 */
var isHexStrict = function (hex) {
    return ((_.isString(hex) || _.isNumber(hex)) && /^(-)?0x[0-9a-f]*$/i.test(hex));
};

/**
 * Check if string is HEX
 *
 * @method isHex
 * @param {String} hex to be checked
 * @returns {Boolean}
 */
var isHex = function (hex) {
    return ((_.isString(hex) || _.isNumber(hex)) && /^(-0x|0x)?[0-9a-f]*$/i.test(hex));
};


/**
 * Returns true if given string is a valid Ethereum block header bloom.
 *
 * @method isBloom
 * @param {String} bloom encoded bloom filter
 * @return {Boolean}
 */
var isBloom = function (bloom) {
    return ethereumBloomFilters.isBloom(bloom);
};

/**
 * Returns true if the ethereum users address is part of the given bloom
 * note: false positives are possible.
 *
 * @method isUserEthereumAddressInBloom
 * @param {String} ethereumAddress encoded bloom filter
 * @param {String} bloom ethereum addresss
 * @return {Boolean}
 */
var isUserEthereumAddressInBloom = function (bloom, ethereumAddress) {
    return ethereumBloomFilters.isUserEthereumAddressInBloom(bloom, ethereumAddress);
};

/**
 * Returns true if the contract address is part of the given bloom
 * note: false positives are possible.
 *
 * @method isUserEthereumAddressInBloom
 * @param {String} bloom encoded bloom filter
 * @param {String} contractAddress contract addresss
 * @return {Boolean}
 */
var isContractAddressInBloom = function (bloom, contractAddress) {
    return ethereumBloomFilters.isContractAddressInBloom(bloom, contractAddress);
};

/**
 * Returns true if given string is a valid log topic.
 *
 * @method isTopic
 * @param {String} topic encoded topic
 * @return {Boolean}
 */
var isTopic = function (topic) {
    return ethereumBloomFilters.isTopic(topic);
};

/**
 * Returns true if the topic is part of the given bloom
 * note: false positives are possible.
 *
 * @method isTopicInBloom
 * @param {String} bloom encoded bloom filter
 * @param {String} topic encoded topic
 * @return {Boolean}
 */
var isTopicInBloom = function (bloom, topic) {
    return ethereumBloomFilters.isTopicInBloom(bloom, topic);
};

/**
 * Returns true if the value is part of the given bloom
 * note: false positives are possible.
 *
 * @method isInBloom
 * @param {String} bloom encoded bloom filter
 * @param {String | Uint8Array} topic encoded value
 * @return {Boolean}
 */
var isInBloom = function (bloom, topic) {
    return ethereumBloomFilters.isInBloom(bloom, topic);
};

/**
 * Hashes values to a sha3 hash using keccak 256
 *
 * To hash a HEX string the hex must have 0x in front.
 *
 * @method sha3
 * @return {String} the sha3 string
 */
var SHA3_NULL_S = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';

var sha3 = function (value) {
    if (isBN(value)) {
        value = value.toString();
    }

    if (isHexStrict(value) && /^0x/i.test((value).toString())) {
        value = hexToBytes(value);
    }

    var returnValue = Hash.keccak256(value); // jshint ignore:line

    if(returnValue === SHA3_NULL_S) {
        return null;
    } else {
        return returnValue;
    }
};
// expose the under the hood keccak256
sha3._Hash = Hash;

/**
 * @method sha3Raw
 *
 * @param value
 *
 * @returns {string}
 */
var sha3Raw = function(value) {
    value = sha3(value);

    if (value === null) {
        return SHA3_NULL_S;
    }

    return value;
};


module.exports = {
    BN: BN,
    isBN: isBN,
    isBigNumber: isBigNumber,
    toBN: toBN,
    isAddress: isAddress,
    isBloom: isBloom,
    isUserEthereumAddressInBloom: isUserEthereumAddressInBloom,
    isContractAddressInBloom: isContractAddressInBloom,
    isTopic: isTopic,
    isTopicInBloom: isTopicInBloom,
    isInBloom: isInBloom,
    checkAddressChecksum: checkAddressChecksum,
    utf8ToHex: utf8ToHex,
    hexToUtf8: hexToUtf8,
    hexToNumber: hexToNumber,
    hexToNumberString: hexToNumberString,
    numberToHex: numberToHex,
    toHex: toHex,
    hexToBytes: hexToBytes,
    bytesToHex: bytesToHex,
    isHex: isHex,
    isHexStrict: isHexStrict,
    leftPad: leftPad,
    rightPad: rightPad,
    toTwosComplement: toTwosComplement,
    sha3: sha3,
    sha3Raw: sha3Raw
};

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(22).Buffer))

/***/ })

}]);