(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[140],{

/***/ 1369:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, Buffer) {/*
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
 * @file accounts.js
 * @author Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2017
 */



var _ = __webpack_require__(51);
var core = __webpack_require__(1370);
var Method = __webpack_require__(183);
var Account = __webpack_require__(1381);
var Hash = __webpack_require__(182);
var RLP = __webpack_require__(762);// jshint ignore:line
var Bytes = __webpack_require__(603);// jshint ignore:line
var cryp = (typeof global === 'undefined') ? __webpack_require__(270) : __webpack_require__(270);
var scrypt = __webpack_require__(1384);
var uuid = __webpack_require__(1385);
var utils = __webpack_require__(760);
var helpers = __webpack_require__(61);
var Transaction = __webpack_require__(1388).Transaction;
var Common = __webpack_require__(768).default;


var isNot = function(value) {
    return (_.isUndefined(value) || _.isNull(value));
};

var Accounts = function Accounts() {
    var _this = this;

    // sets _requestmanager
    core.packageInit(this, arguments);

    // remove unecessary core functions
    delete this.BatchRequest;
    delete this.extend;

    var _ethereumCall = [
        new Method({
            name: 'getNetworkId',
            call: 'net_version',
            params: 0,
            outputFormatter: parseInt
        }),
        new Method({
            name: 'getChainId',
            call: 'eth_chainId',
            params: 0,
            outputFormatter: utils.hexToNumber
        }),
        new Method({
            name: 'getGasPrice',
            call: 'eth_gasPrice',
            params: 0
        }),
        new Method({
            name: 'getTransactionCount',
            call: 'eth_getTransactionCount',
            params: 2,
            inputFormatter: [function(address) {
                if (utils.isAddress(address)) {
                    return address;
                } else {
                    throw new Error('Address ' + address + ' is not a valid address to get the "transactionCount".');
                }
            }, function() {
                return 'latest';
            }]
        })
    ];
    // attach methods to this._ethereumCall
    this._ethereumCall = {};
    _.each(_ethereumCall, function(method) {
        method.attachToObject(_this._ethereumCall);
        method.setRequestManager(_this._requestManager);
    });


    this.wallet = new Wallet(this);
};

Accounts.prototype._addAccountFunctions = function(account) {
    var _this = this;

    // add sign functions
    account.signTransaction = function signTransaction(tx, callback) {
        return _this.signTransaction(tx, account.privateKey, callback);
    };
    account.sign = function sign(data) {
        return _this.sign(data, account.privateKey);
    };

    account.encrypt = function encrypt(password, options) {
        return _this.encrypt(account.privateKey, password, options);
    };


    return account;
};

Accounts.prototype.create = function create(entropy) {
    return this._addAccountFunctions(Account.create(entropy || utils.randomHex(32)));
};

Accounts.prototype.privateKeyToAccount = function privateKeyToAccount(privateKey, ignoreLength) {
    if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
    }

    // 64 hex characters + hex-prefix
    if (!ignoreLength && privateKey.length !== 66) {
        throw new Error("Private key must be 32 bytes long");
    }

    return this._addAccountFunctions(Account.fromPrivate(privateKey));
};

Accounts.prototype.signTransaction = function signTransaction(tx, privateKey, callback) {
    var _this = this,
        error = false,
        transactionOptions = {},
        hasTxSigningOptions = !!(tx && ((tx.chain && tx.hardfork) || tx.common));

    callback = callback || function() {
    };

    if (!tx) {
        error = new Error('No transaction object given!');

        callback(error);
        return Promise.reject(error);
    }

    function signed(tx) {
        if (tx.common && (tx.chain && tx.hardfork)) {
            error = new Error(
                'Please provide the ethereumjs-common object or the chain and hardfork property but not all together.'
            );
        }

        if ((tx.chain && !tx.hardfork) || (tx.hardfork && !tx.chain)) {
            error = new Error(
                'When specifying chain and hardfork, both values must be defined. ' +
                'Received "chain": ' + tx.chain + ', "hardfork": ' + tx.hardfork
            );
        }

        if (!tx.gas && !tx.gasLimit) {
            error = new Error('"gas" is missing');
        }

        if (tx.nonce < 0 ||
            tx.gas < 0 ||
            tx.gasPrice < 0 ||
            tx.chainId < 0) {
            error = new Error('Gas, gasPrice, nonce or chainId is lower than 0');
        }

        if (error) {
            callback(error);
            return Promise.reject(error);
        }

        try {
            var transaction = helpers.formatters.inputCallFormatter(_.clone(tx));
            transaction.to = transaction.to || '0x';
            transaction.data = transaction.data || '0x';
            transaction.value = transaction.value || '0x';
            transaction.chainId = utils.numberToHex(transaction.chainId);

            // Because tx has no ethereumjs-tx signing options we use fetched vals.
            if (!hasTxSigningOptions) {
                transactionOptions.common = Common.forCustomChain(
                    'mainnet',
                    {
                        name: 'custom-network',
                        networkId: transaction.networkId,
                        chainId: transaction.chainId
                    },
                    'petersburg'
                );

                delete transaction.networkId;
            } else {
                if (transaction.common) {
                    transactionOptions.common = Common.forCustomChain(
                        transaction.common.baseChain || 'mainnet',
                        {
                            name: transaction.common.customChain.name || 'custom-network',
                            networkId: transaction.common.customChain.networkId,
                            chainId: transaction.common.customChain.chainId
                        },
                        transaction.common.hardfork || 'petersburg'
                    );

                    delete transaction.common;
                }

                if (transaction.chain) {
                    transactionOptions.chain = transaction.chain;
                    delete transaction.chain;
                }

                if (transaction.hardfork) {
                    transactionOptions.hardfork = transaction.hardfork;
                    delete transaction.hardfork;
                }
            }

            if (privateKey.startsWith('0x')) {
                privateKey = privateKey.substring(2);
            }

            var ethTx = new Transaction(transaction, transactionOptions);

            ethTx.sign(Buffer.from(privateKey, 'hex'));

            var validationResult = ethTx.validate(true);

            if (validationResult !== '') {
                throw new Error('Signer Error: ' + validationResult);
            }

            var rlpEncoded = ethTx.serialize().toString('hex');
            var rawTransaction = '0x' + rlpEncoded;
            var transactionHash = utils.keccak256(rawTransaction);

            var result = {
                messageHash: '0x' + Buffer.from(ethTx.hash(false)).toString('hex'),
                v: '0x' + Buffer.from(ethTx.v).toString('hex'),
                r: '0x' + Buffer.from(ethTx.r).toString('hex'),
                s: '0x' + Buffer.from(ethTx.s).toString('hex'),
                rawTransaction: rawTransaction,
                transactionHash: transactionHash
            };

            callback(null, result);
            return result;

        } catch (e) {
            callback(e);
            return Promise.reject(e);
        }
    }


    // Resolve immediately if nonce, chainId, price and signing options are provided
    if (tx.nonce !== undefined && tx.chainId !== undefined && tx.gasPrice !== undefined && hasTxSigningOptions) {
        return Promise.resolve(signed(tx));
    }

    // Otherwise, get the missing info from the Ethereum Node
    return Promise.all([
        isNot(tx.chainId) ? _this._ethereumCall.getChainId() : tx.chainId,
        isNot(tx.gasPrice) ? _this._ethereumCall.getGasPrice() : tx.gasPrice,
        isNot(tx.nonce) ? _this._ethereumCall.getTransactionCount(_this.privateKeyToAccount(privateKey).address) : tx.nonce,
        isNot(hasTxSigningOptions) ? _this._ethereumCall.getNetworkId() : 1
    ]).then(function(args) {
        if (isNot(args[0]) || isNot(args[1]) || isNot(args[2]) || isNot(args[3])) {
            throw new Error('One of the values "chainId", "networkId", "gasPrice", or "nonce" couldn\'t be fetched: ' + JSON.stringify(args));
        }
        return signed(_.extend(tx, {chainId: args[0], gasPrice: args[1], nonce: args[2], networkId: args[3]}));
    });
};

/* jshint ignore:start */
Accounts.prototype.recoverTransaction = function recoverTransaction(rawTx) {
    var values = RLP.decode(rawTx);
    var signature = Account.encodeSignature(values.slice(6, 9));
    var recovery = Bytes.toNumber(values[6]);
    var extraData = recovery < 35 ? [] : [Bytes.fromNumber((recovery - 35) >> 1), '0x', '0x'];
    var signingData = values.slice(0, 6).concat(extraData);
    var signingDataHex = RLP.encode(signingData);
    return Account.recover(Hash.keccak256(signingDataHex), signature);
};
/* jshint ignore:end */

Accounts.prototype.hashMessage = function hashMessage(data) {
    var messageHex = utils.isHexStrict(data) ? data : utils.utf8ToHex(data);
    var messageBytes = utils.hexToBytes(messageHex)
    var messageBuffer = Buffer.from(messageBytes);
    var preamble = '\x19Ethereum Signed Message:\n' + messageBytes.length;
    var preambleBuffer = Buffer.from(preamble);
    var ethMessage = Buffer.concat([preambleBuffer, messageBuffer]);
    return Hash.keccak256s(ethMessage);
};

Accounts.prototype.sign = function sign(data, privateKey) {
    if (!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey;
    }

    // 64 hex characters + hex-prefix
    if (privateKey.length !== 66) {
        throw new Error("Private key must be 32 bytes long");
    }

    var hash = this.hashMessage(data);
    var signature = Account.sign(hash, privateKey);
    var vrs = Account.decodeSignature(signature);
    return {
        message: data,
        messageHash: hash,
        v: vrs[0],
        r: vrs[1],
        s: vrs[2],
        signature: signature
    };
};

Accounts.prototype.recover = function recover(message, signature, preFixed) {
    var args = [].slice.apply(arguments);


    if (_.isObject(message)) {
        return this.recover(message.messageHash, Account.encodeSignature([message.v, message.r, message.s]), true);
    }

    if (!preFixed) {
        message = this.hashMessage(message);
    }

    if (args.length >= 4) {
        preFixed = args.slice(-1)[0];
        preFixed = _.isBoolean(preFixed) ? !!preFixed : false;

        return this.recover(message, Account.encodeSignature(args.slice(1, 4)), preFixed); // v, r, s
    }
    return Account.recover(message, signature);
};

// Taken from https://github.com/ethereumjs/ethereumjs-wallet
Accounts.prototype.decrypt = function(v3Keystore, password, nonStrict) {
    /* jshint maxcomplexity: 10 */

    if (!_.isString(password)) {
        throw new Error('No password given.');
    }

    var json = (_.isObject(v3Keystore)) ? v3Keystore : JSON.parse(nonStrict ? v3Keystore.toLowerCase() : v3Keystore);

    if (json.version !== 3) {
        throw new Error('Not a valid V3 wallet');
    }

    var derivedKey;
    var kdfparams;
    if (json.crypto.kdf === 'scrypt') {
        kdfparams = json.crypto.kdfparams;

        // FIXME: support progress reporting callback
        derivedKey = scrypt.syncScrypt(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
    } else if (json.crypto.kdf === 'pbkdf2') {
        kdfparams = json.crypto.kdfparams;

        if (kdfparams.prf !== 'hmac-sha256') {
            throw new Error('Unsupported parameters to PBKDF2');
        }

        derivedKey = cryp.pbkdf2Sync(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.c, kdfparams.dklen, 'sha256');
    } else {
        throw new Error('Unsupported key derivation scheme');
    }

    var ciphertext = Buffer.from(json.crypto.ciphertext, 'hex');

    var mac = utils.sha3(Buffer.from([...derivedKey.slice(16, 32), ...ciphertext])).replace('0x', '');
    if (mac !== json.crypto.mac) {
        throw new Error('Key derivation failed - possibly wrong password');
    }

    var decipher = cryp.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 16), Buffer.from(json.crypto.cipherparams.iv, 'hex'));
    var seed = '0x' + Buffer.from([...decipher.update(ciphertext), ...decipher.final()]).toString('hex');

    return this.privateKeyToAccount(seed, true);
};

Accounts.prototype.encrypt = function(privateKey, password, options) {
    /* jshint maxcomplexity: 20 */
    var account = this.privateKeyToAccount(privateKey, true);

    options = options || {};
    var salt = options.salt || cryp.randomBytes(32);
    var iv = options.iv || cryp.randomBytes(16);

    var derivedKey;
    var kdf = options.kdf || 'scrypt';
    var kdfparams = {
        dklen: options.dklen || 32,
        salt: salt.toString('hex')
    };

    if (kdf === 'pbkdf2') {
        kdfparams.c = options.c || 262144;
        kdfparams.prf = 'hmac-sha256';
        derivedKey = cryp.pbkdf2Sync(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.c, kdfparams.dklen, 'sha256');
    } else if (kdf === 'scrypt') {
        // FIXME: support progress reporting callback
        kdfparams.n = options.n || 8192; // 2048 4096 8192 16384
        kdfparams.r = options.r || 8;
        kdfparams.p = options.p || 1;
        derivedKey = scrypt.syncScrypt(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);
    } else {
        throw new Error('Unsupported kdf');
    }

    var cipher = cryp.createCipheriv(options.cipher || 'aes-128-ctr', derivedKey.slice(0, 16), iv);
    if (!cipher) {
        throw new Error('Unsupported cipher');
    }


    var ciphertext = Buffer.from([
        ...cipher.update(Buffer.from(account.privateKey.replace('0x', ''), 'hex')),
        ...cipher.final()]
    );

    var mac = utils.sha3(Buffer.from([...derivedKey.slice(16, 32), ...ciphertext])).replace('0x', '');

    return {
        version: 3,
        id: uuid.v4({random: options.uuid || cryp.randomBytes(16)}),
        address: account.address.toLowerCase().replace('0x', ''),
        crypto: {
            ciphertext: ciphertext.toString('hex'),
            cipherparams: {
                iv: iv.toString('hex')
            },
            cipher: options.cipher || 'aes-128-ctr',
            kdf: kdf,
            kdfparams: kdfparams,
            mac: mac.toString('hex')
        }
    };
};


// Note: this is trying to follow closely the specs on
// http://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html

function Wallet(accounts) {
    this._accounts = accounts;
    this.length = 0;
    this.defaultKeyName = 'web3js_wallet';
}

Wallet.prototype._findSafeIndex = function(pointer) {
    pointer = pointer || 0;
    if (_.has(this, pointer)) {
        return this._findSafeIndex(pointer + 1);
    } else {
        return pointer;
    }
};

Wallet.prototype._currentIndexes = function() {
    var keys = Object.keys(this);
    var indexes = keys
        .map(function(key) {
            return parseInt(key);
        })
        .filter(function(n) {
            return (n < 9e20);
        });

    return indexes;
};

Wallet.prototype.create = function(numberOfAccounts, entropy) {
    for (var i = 0; i < numberOfAccounts; ++i) {
        this.add(this._accounts.create(entropy).privateKey);
    }
    return this;
};

Wallet.prototype.add = function(account) {

    if (_.isString(account)) {
        account = this._accounts.privateKeyToAccount(account);
    }
    if (!this[account.address]) {
        account = this._accounts.privateKeyToAccount(account.privateKey);
        account.index = this._findSafeIndex();

        this[account.index] = account;
        this[account.address] = account;
        this[account.address.toLowerCase()] = account;

        this.length++;

        return account;
    } else {
        return this[account.address];
    }
};

Wallet.prototype.remove = function(addressOrIndex) {
    var account = this[addressOrIndex];

    if (account && account.address) {
        // address
        this[account.address].privateKey = null;
        delete this[account.address];
        // address lowercase
        this[account.address.toLowerCase()].privateKey = null;
        delete this[account.address.toLowerCase()];
        // index
        this[account.index].privateKey = null;
        delete this[account.index];

        this.length--;

        return true;
    } else {
        return false;
    }
};

Wallet.prototype.clear = function() {
    var _this = this;
    var indexes = this._currentIndexes();

    indexes.forEach(function(index) {
        _this.remove(index);
    });

    return this;
};

Wallet.prototype.encrypt = function(password, options) {
    var _this = this;
    var indexes = this._currentIndexes();

    var accounts = indexes.map(function(index) {
        return _this[index].encrypt(password, options);
    });

    return accounts;
};


Wallet.prototype.decrypt = function(encryptedWallet, password) {
    var _this = this;

    encryptedWallet.forEach(function(keystore) {
        var account = _this._accounts.decrypt(keystore, password);

        if (account) {
            _this.add(account);
        } else {
            throw new Error('Couldn\'t decrypt accounts. Password wrong?');
        }
    });

    return this;
};

Wallet.prototype.save = function(password, keyName) {
    localStorage.setItem(keyName || this.defaultKeyName, JSON.stringify(this.encrypt(password)));

    return true;
};

Wallet.prototype.load = function(password, keyName) {
    var keystore = localStorage.getItem(keyName || this.defaultKeyName);

    if (keystore) {
        try {
            keystore = JSON.parse(keystore);
        } catch (e) {

        }
    }

    return this.decrypt(keystore || [], password);
};

if (!storageAvailable('localStorage')) {
    delete Wallet.prototype.save;
    delete Wallet.prototype.load;
}

/**
 * Checks whether a storage type is available or not
 * For more info on how this works, please refer to MDN documentation
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#Feature-detecting_localStorage
 *
 * @method storageAvailable
 * @param {String} type the type of storage ('localStorage', 'sessionStorage')
 * @returns {Boolean} a boolean indicating whether the specified storage is available or not
 */
function storageAvailable(type) {
    var storage;
    try {
        storage = window[type];
        var x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return e && (
                // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
    }
}


module.exports = Accounts;

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(85), __webpack_require__(22).Buffer))

/***/ }),

/***/ 1370:
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
 * @date 2017
 */




var requestManager = __webpack_require__(1371);
var extend = __webpack_require__(1379);

module.exports = {
    packageInit: function (pkg, args) {
        args = Array.prototype.slice.call(args);

        if (!pkg) {
            throw new Error('You need to instantiate using the "new" keyword.');
        }

        // make property of pkg._provider, which can properly set providers
        Object.defineProperty(pkg, 'currentProvider', {
            get: function () {
                return pkg._provider;
            },
            set: function (value) {
                return pkg.setProvider(value);
            },
            enumerable: true,
            configurable: true
        });

        // inherit from parent package or create a new RequestManager
        if (args[0] && args[0]._requestManager) {
            pkg._requestManager = args[0]._requestManager;
        } else {
            pkg._requestManager = new requestManager.Manager(args[0], args[1]);
        }

        // add givenProvider
        pkg.givenProvider = requestManager.Manager.givenProvider;
        pkg.providers = requestManager.Manager.providers;

        pkg._provider = pkg._requestManager.provider;

        // add SETPROVIDER function (don't overwrite if already existing)
        if (!pkg.setProvider) {
            pkg.setProvider = function (provider, net) {
                pkg._requestManager.setProvider(provider, net);
                pkg._provider = pkg._requestManager.provider;
                return true;
            };
        }

        pkg.setRequestManager = function(manager) {
            pkg._requestManager = manager;
            pkg._provider = manager.provider;
        };

        // attach batch request creation
        pkg.BatchRequest = requestManager.BatchManager.bind(null, pkg._requestManager);

        // attach extend function
        pkg.extend = extend(pkg);
    },
    addProviders: function (pkg) {
        pkg.givenProvider = requestManager.Manager.givenProvider;
        pkg.providers = requestManager.Manager.providers;
    }
};


/***/ }),

/***/ 1371:
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
 * @date 2017
 */




const { callbackify } = __webpack_require__(267);
var _ = __webpack_require__(51);
var errors = __webpack_require__(61).errors;
var Jsonrpc = __webpack_require__(759);
var BatchManager = __webpack_require__(1372);
var givenProvider = __webpack_require__(1373);

/**
 * It's responsible for passing messages to providers
 * It's also responsible for polling the ethereum node for incoming messages
 * Default poll timeout is 1 second
 * Singleton
 *
 * @param {string|Object}provider
 * @param {Net.Socket} net
 *
 * @constructor
 */
var RequestManager = function RequestManager(provider, net) {
    this.provider = null;
    this.providers = RequestManager.providers;

    this.setProvider(provider, net);
    this.subscriptions = new Map();
};


RequestManager.givenProvider = givenProvider;

RequestManager.providers = {
    WebsocketProvider: __webpack_require__(1374),
    HttpProvider: __webpack_require__(1376),
    IpcProvider: __webpack_require__(1377)
};


/**
 * Should be used to set provider of request manager
 *
 * @method setProvider
 *
 * @param {Object} provider
 * @param {net.Socket} net
 *
 * @returns void
 */
RequestManager.prototype.setProvider = function (provider, net) {
    var _this = this;

    // autodetect provider
    if (provider && typeof provider === 'string' && this.providers) {

        // HTTP
        if (/^http(s)?:\/\//i.test(provider)) {
            provider = new this.providers.HttpProvider(provider);

            // WS
        } else if (/^ws(s)?:\/\//i.test(provider)) {
            provider = new this.providers.WebsocketProvider(provider);

            // IPC
        } else if (provider && typeof net === 'object' && typeof net.connect === 'function') {
            provider = new this.providers.IpcProvider(provider, net);

        } else if (provider) {
            throw new Error('Can\'t autodetect provider for "' + provider + '"');
        }
    }


    // reset the old one before changing, if still connected
    if(this.provider && this.provider.connected)
        this.clearSubscriptions();

    this.provider = provider || null;

    // listen to incoming notifications
    if (this.provider && this.provider.on) {
        this.provider.on('data', function data(result, deprecatedResult) {
            result = result || deprecatedResult; // this is for possible old providers, which may had the error first handler

            // check for result.method, to prevent old providers errors to pass as result
            if (result.method && _this.subscriptions.has(result.params.subscription)) {
                _this.subscriptions.get(result.params.subscription).callback(null, result.params.result);
            }
        });

        // resubscribe if the provider has reconnected
        this.provider.on('connect', function connect() {
            _this.subscriptions.forEach(function (subscription) {
                subscription.subscription.resubscribe();
            });
        });

        // notify all subscriptions about the error condition
        this.provider.on('error', function error(error) {
            _this.subscriptions.forEach(function (subscription) {
                subscription.callback(error);
            });
        });

        // notify all subscriptions about bad close conditions
        this.provider.on('close', function close(event) {
            if (!_this._isCleanCloseEvent(event) || _this._isIpcCloseError(event)){
                _this.subscriptions.forEach(function (subscription) {
                    subscription.callback(errors.ConnectionCloseError(event));
                    _this.subscriptions.delete(subscription.subscription.id);
                });

                if(_this.provider && _this.provider.emit){
                    _this.provider.emit('error', errors.ConnectionCloseError(event));
                }
            }
            if(_this.provider && _this.provider.emit){
                _this.provider.emit('end', event);
            }
        });

        // TODO add end, timeout??
    }
};

/**
 * Asynchronously send request to provider.
 * Prefers to use the `request` method available on the provider as specified in [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193).
 * If `request` is not available, falls back to `sendAsync` and `send` respectively.
 * @method send
 * @param {Object} data
 * @param {Function} callback
 */
RequestManager.prototype.send = function (data, callback) {
    callback = callback || function () {};

    if (!this.provider) {
        return callback(errors.InvalidProvider());
    }

    const payload = Jsonrpc.toPayload(data.method, data.params);

    const onJsonrpcResult = function (err, result) {
        if(result && result.id && payload.id !== result.id) {
            return callback(new Error(`Wrong response id ${result.id} (expected: ${payload.id}) in ${JSON.stringify(payload)}`));
        }

        if (err) {
            return callback(err);
        }

        if (result && result.error) {
            return callback(errors.ErrorResponse(result));
        }

        if (!Jsonrpc.isValidResponse(result)) {
            return callback(errors.InvalidResponse(result));
        }

        callback(null, result.result);
    };

    if (this.provider.request) {
        callbackify(this.provider.request.bind(this.provider))(payload, callback);
    } else if (this.provider.sendAsync) {
        this.provider.sendAsync(payload, onJsonrpcResult);
    } else if (this.provider.send) {
        this.provider.send(payload, onJsonrpcResult);
    } else {
        throw new Error('Provider does not have a request or send method to use.');
    }
};

/**
 * Asynchronously send batch request.
 * Only works if provider supports batch methods through `sendAsync` or `send`.
 * @method sendBatch
 * @param {Array} data - array of payload objects
 * @param {Function} callback
 */
RequestManager.prototype.sendBatch = function (data, callback) {
    if (!this.provider) {
        return callback(errors.InvalidProvider());
    }

    var payload = Jsonrpc.toBatchPayload(data);
    this.provider[this.provider.sendAsync ? 'sendAsync' : 'send'](payload, function (err, results) {
        if (err) {
            return callback(err);
        }

        if (!_.isArray(results)) {
            return callback(errors.InvalidResponse(results));
        }

        callback(null, results);
    });
};


/**
 * Waits for notifications
 *
 * @method addSubscription
 * @param {Subscription} subscription         the subscription
 * @param {String} type         the subscription namespace (eth, personal, etc)
 * @param {Function} callback   the callback to call for incoming notifications
 */
RequestManager.prototype.addSubscription = function (subscription, callback) {
    if (this.provider.on) {
        this.subscriptions.set(
            subscription.id,
            {
                callback: callback,
                subscription: subscription
            }
        );
    } else {
        throw new Error('The provider doesn\'t support subscriptions: '+ this.provider.constructor.name);
    }
};

/**
 * Waits for notifications
 *
 * @method removeSubscription
 * @param {String} id           the subscription id
 * @param {Function} callback   fired once the subscription is removed
 */
RequestManager.prototype.removeSubscription = function (id, callback) {
    if (this.subscriptions.has(id)) {
        var type = this.subscriptions.get(id).subscription.options.type;

        // remove subscription first to avoid reentry
        this.subscriptions.delete(id);

        // then, try to actually unsubscribe
        this.send({
            method: type + '_unsubscribe',
            params: [id]
        }, callback);

        return;
    }

    if (typeof callback === 'function') {
        // call the callback if the subscription was already removed
        callback(null);
    }
};

/**
 * Should be called to reset the subscriptions
 *
 * @method reset
 */
RequestManager.prototype.clearSubscriptions = function (keepIsSyncing) {
    var _this = this;

    // uninstall all subscriptions
    if (this.subscriptions.size > 0) {
        this.subscriptions.forEach(function (value, id) {
            if (!keepIsSyncing || value.name !== 'syncing')
                _this.removeSubscription(id);
        });
    }

    //  reset notification callbacks etc.
    if(this.provider.reset)
        this.provider.reset();
};

/**
 * Evaluates WS close event
 *
 * @method _isCleanClose
 *
 * @param {CloseEvent | boolean} event WS close event or exception flag
 *
 * @returns {boolean}
 */
RequestManager.prototype._isCleanCloseEvent = function (event) {
    return typeof event === 'object' && ([1000].includes(event.code) || event.wasClean === true);
};

/**
 * Detects Ipc close error. The node.net module emits ('close', isException)
 *
 * @method _isIpcCloseError
 *
 * @param {CloseEvent | boolean} event WS close event or exception flag
 *
 * @returns {boolean}
 */
RequestManager.prototype._isIpcCloseError = function (event) {
    return typeof event === 'boolean' && event;
};

module.exports = {
    Manager: RequestManager,
    BatchManager: BatchManager
};


/***/ }),

/***/ 1372:
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
 * @file batch.js
 * @author Marek Kotewicz <marek@ethdev.com>
 * @date 2015
 */



var Jsonrpc = __webpack_require__(759);
var errors = __webpack_require__(61).errors;

var Batch = function (requestManager) {
    this.requestManager = requestManager;
    this.requests = [];
};

/**
 * Should be called to add create new request to batch request
 *
 * @method add
 * @param {Object} jsonrpc requet object
 */
Batch.prototype.add = function (request) {
    this.requests.push(request);
};

/**
 * Should be called to execute batch request
 *
 * @method execute
 */
Batch.prototype.execute = function () {
    var requests = this.requests;
    this.requestManager.sendBatch(requests, function (err, results) {
        results = results || [];
        requests.map(function (request, index) {
            return results[index] || {};
        }).forEach(function (result, index) {
            if (requests[index].callback) {
                if (result && result.error) {
                    return requests[index].callback(errors.ErrorResponse(result));
                }

                if (!Jsonrpc.isValidResponse(result)) {
                    return requests[index].callback(errors.InvalidResponse(result));
                }

                try {
                    requests[index].callback(null, requests[index].format ? requests[index].format(result.result) : result.result);
                } catch (err) {
                    requests[index].callback(err);
                }
            }
        });
    });
};

module.exports = Batch;



/***/ }),

/***/ 1373:
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
 * @file givenProvider.js
 * @author Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2017
 */



var givenProvider = null;

// ADD GIVEN PROVIDER
/* jshint ignore:start */
var global;
try {
  global = Function('return this')();
} catch (e) {
  global = window;
}

// EIP-1193: window.ethereum
if (typeof global.ethereum !== 'undefined') {
    givenProvider = global.ethereum;

// Legacy web3.currentProvider
} else if(typeof global.web3 !== 'undefined' && global.web3.currentProvider) {

    if(global.web3.currentProvider.sendAsync) {
        global.web3.currentProvider.send = global.web3.currentProvider.sendAsync;
        delete global.web3.currentProvider.sendAsync;
    }

    // if connection is 'ipcProviderWrapper', add subscription support
    if(!global.web3.currentProvider.on &&
        global.web3.currentProvider.connection &&
        global.web3.currentProvider.connection.constructor.name === 'ipcProviderWrapper') {

        global.web3.currentProvider.on = function (type, callback) {

            if(typeof callback !== 'function')
                throw new Error('The second parameter callback must be a function.');

            switch(type){
                case 'data':
                    this.connection.on('data', function(data) {
                        var result = '';

                        data = data.toString();

                        try {
                            result = JSON.parse(data);
                        } catch(e) {
                            return callback(new Error('Couldn\'t parse response data'+ data));
                        }

                        // notification
                        if(!result.id && result.method.indexOf('_subscription') !== -1) {
                            callback(null, result);
                        }

                    });
                    break;

                default:
                    this.connection.on(type, callback);
                    break;
            }
        };
    }

    givenProvider = global.web3.currentProvider;
}
/* jshint ignore:end */


module.exports = givenProvider;


/***/ }),

/***/ 1374:
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
 * @file WebsocketProvider.js
 * @authors: Samuel Furter <samuel@ethereum.org>, Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2019
 */



var EventEmitter = __webpack_require__(253);
var helpers = __webpack_require__(1375);
var errors = __webpack_require__(61).errors;
var Ws = __webpack_require__(308).w3cwebsocket;

/**
 * @param {string} url
 * @param {Object} options
 *
 * @constructor
 */
var WebsocketProvider = function WebsocketProvider(url, options) {
    EventEmitter.call(this);

    options = options || {};
    this.url = url;
    this._customTimeout = options.timeout || 1000 * 15;
    this.headers = options.headers || {};
    this.protocol = options.protocol || undefined;
    this.reconnectOptions = Object.assign({
            auto: false,
            delay: 5000,
            maxAttempts: false,
            onTimeout: false
        },
        options.reconnect
    );
    this.clientConfig = options.clientConfig || undefined; // Allow a custom client configuration
    this.requestOptions = options.requestOptions || undefined; // Allow a custom request options (https://github.com/theturtle32/WebSocket-Node/blob/master/docs/WebSocketClient.md#connectrequesturl-requestedprotocols-origin-headers-requestoptions)

    this.DATA = 'data';
    this.CLOSE = 'close';
    this.ERROR = 'error';
    this.CONNECT = 'connect';
    this.RECONNECT = 'reconnect';

    this.connection = null;
    this.requestQueue = new Map();
    this.responseQueue = new Map();
    this.reconnectAttempts = 0;
    this.reconnecting = false;

    // The w3cwebsocket implementation does not support Basic Auth
    // username/password in the URL. So generate the basic auth header, and
    // pass through with any additional headers supplied in constructor
    var parsedURL = helpers.parseURL(url);
    if (parsedURL.username && parsedURL.password) {
        this.headers.authorization = 'Basic ' + helpers.btoa(parsedURL.username + ':' + parsedURL.password);
    }

    // When all node core implementations that do not have the
    // WHATWG compatible URL parser go out of service this line can be removed.
    if (parsedURL.auth) {
        this.headers.authorization = 'Basic ' + helpers.btoa(parsedURL.auth);
    }

    // make property `connected` which will return the current connection status
    Object.defineProperty(this, 'connected', {
        get: function () {
            return this.connection && this.connection.readyState === this.connection.OPEN;
        },
        enumerable: true
    });

    this.connect();
};

// Inherit from EventEmitter
WebsocketProvider.prototype = Object.create(EventEmitter.prototype);
WebsocketProvider.prototype.constructor = WebsocketProvider;

/**
 * Connects to the configured node
 *
 * @method connect
 *
 * @returns {void}
 */
WebsocketProvider.prototype.connect = function () {
    this.connection = new Ws(this.url, this.protocol, undefined, this.headers, this.requestOptions, this.clientConfig);
    this._addSocketListeners();
};

/**
 * Listener for the `data` event of the underlying WebSocket object
 *
 * @method _onMessage
 *
 * @returns {void}
 */
WebsocketProvider.prototype._onMessage = function (e) {
    var _this = this;

    this._parseResponse((typeof e.data === 'string') ? e.data : '').forEach(function (result) {
        if (result.method && result.method.indexOf('_subscription') !== -1) {
            _this.emit(_this.DATA, result);

            return;
        }

        var id = result.id;

        // get the id which matches the returned id
        if (Array.isArray(result)) {
            id = result[0].id;
        }

        if (_this.responseQueue.has(id)) {
            if(_this.responseQueue.get(id).callback !== undefined) {
                _this.responseQueue.get(id).callback(false, result);
            }
            _this.responseQueue.delete(id);
        }
    });
};

/**
 * Listener for the `open` event of the underlying WebSocket object
 *
 * @method _onConnect
 *
 * @returns {void}
 */
WebsocketProvider.prototype._onConnect = function () {
    this.emit(this.CONNECT);
    this.reconnectAttempts = 0;
    this.reconnecting = false;

    if (this.requestQueue.size > 0) {
        var _this = this;

        this.requestQueue.forEach(function (request, key) {
            _this.send(request.payload, request.callback);
            _this.requestQueue.delete(key);
        });
    }
};

/**
 * Listener for the `close` event of the underlying WebSocket object
 *
 * @method _onClose
 *
 * @returns {void}
 */
WebsocketProvider.prototype._onClose = function (event) {
    var _this = this;

    if (this.reconnectOptions.auto && (![1000, 1001].includes(event.code) || event.wasClean === false)) {
        this.reconnect();

        return;
    }

    this.emit(this.CLOSE, event);

    if (this.requestQueue.size > 0) {
        this.requestQueue.forEach(function (request, key) {
            request.callback(errors.ConnectionNotOpenError(event));
            _this.requestQueue.delete(key);
        });
    }

    if (this.responseQueue.size > 0) {
        this.responseQueue.forEach(function (request, key) {
            request.callback(errors.InvalidConnection('on WS', event));
            _this.responseQueue.delete(key);
        });
    }

    this._removeSocketListeners();
    this.removeAllListeners();
};

/**
 * Will add the required socket listeners
 *
 * @method _addSocketListeners
 *
 * @returns {void}
 */
WebsocketProvider.prototype._addSocketListeners = function () {
    this.connection.addEventListener('message', this._onMessage.bind(this));
    this.connection.addEventListener('open', this._onConnect.bind(this));
    this.connection.addEventListener('close', this._onClose.bind(this));
};

/**
 * Will remove all socket listeners
 *
 * @method _removeSocketListeners
 *
 * @returns {void}
 */
WebsocketProvider.prototype._removeSocketListeners = function () {
    this.connection.removeEventListener('message', this._onMessage);
    this.connection.removeEventListener('open', this._onConnect);
    this.connection.removeEventListener('close', this._onClose);
};

/**
 * Will parse the response and make an array out of it.
 *
 * @method _parseResponse
 *
 * @param {String} data
 *
 * @returns {Array}
 */
WebsocketProvider.prototype._parseResponse = function (data) {
    var _this = this,
        returnValues = [];

    // DE-CHUNKER
    var dechunkedData = data
        .replace(/\}[\n\r]?\{/g, '}|--|{') // }{
        .replace(/\}\][\n\r]?\[\{/g, '}]|--|[{') // }][{
        .replace(/\}[\n\r]?\[\{/g, '}|--|[{') // }[{
        .replace(/\}\][\n\r]?\{/g, '}]|--|{') // }]{
        .split('|--|');

    dechunkedData.forEach(function (data) {

        // prepend the last chunk
        if (_this.lastChunk)
            data = _this.lastChunk + data;

        var result = null;

        try {
            result = JSON.parse(data);
        } catch (e) {

            _this.lastChunk = data;

            // start timeout to cancel all requests
            clearTimeout(_this.lastChunkTimeout);
            _this.lastChunkTimeout = setTimeout(function () {
                if (_this.reconnectOptions.auto && _this.reconnectOptions.onTimeout) {
                    _this.reconnect();

                    return;
                }


                _this.emit(_this.ERROR, errors.ConnectionTimeout(_this._customTimeout));

                if (_this.requestQueue.size > 0) {
                    _this.requestQueue.forEach(function (request, key) {
                        request.callback(errors.ConnectionTimeout(_this._customTimeout));
                        _this.requestQueue.delete(key);
                    });
                }
            }, _this._customTimeout);

            return;
        }

        // cancel timeout and set chunk to null
        clearTimeout(_this.lastChunkTimeout);
        _this.lastChunk = null;

        if (result)
            returnValues.push(result);
    });

    return returnValues;
};

/**
 * Does check if the provider is connecting and will add it to the queue or will send it directly
 *
 * @method send
 *
 * @param {Object} payload
 * @param {Function} callback
 *
 * @returns {void}
 */
WebsocketProvider.prototype.send = function (payload, callback) {
    var _this = this;
    var id = payload.id;
    var request = {payload: payload, callback: callback};

    if (Array.isArray(payload)) {
        id = payload[0].id;
    }

    if (this.connection.readyState === this.connection.CONNECTING || this.reconnecting) {
        this.requestQueue.set(id, request);

        return;
    }

    if (this.connection.readyState !== this.connection.OPEN) {
        this.requestQueue.delete(id);

        this.emit(this.ERROR, errors.ConnectionNotOpenError());
        request.callback(errors.ConnectionNotOpenError());

        return;
    }

    this.responseQueue.set(id, request);
    this.requestQueue.delete(id);

    try {
        this.connection.send(JSON.stringify(request.payload));
    } catch (error) {
        request.callback(error);
        _this.responseQueue.delete(id);
    }
};

/**
 * Resets the providers, clears all callbacks
 *
 * @method reset
 *
 * @returns {void}
 */
WebsocketProvider.prototype.reset = function () {
    this.responseQueue.clear();
    this.requestQueue.clear();

    this.removeAllListeners();

    this._removeSocketListeners();
    this._addSocketListeners();
};

/**
 * Closes the current connection with the given code and reason arguments
 *
 * @method disconnect
 *
 * @param {number} code
 * @param {string} reason
 *
 * @returns {void}
 */
WebsocketProvider.prototype.disconnect = function (code, reason) {
    this._removeSocketListeners();
    this.connection.close(code || 1000, reason);
};

/**
 * Returns the desired boolean.
 *
 * @method supportsSubscriptions
 *
 * @returns {boolean}
 */
WebsocketProvider.prototype.supportsSubscriptions = function () {
    return true;
};

/**
 * Removes the listeners and reconnects to the socket.
 *
 * @method reconnect
 *
 * @returns {void}
 */
WebsocketProvider.prototype.reconnect = function () {
    var _this = this;
    this.reconnecting = true;

    if (this.responseQueue.size > 0) {
        this.responseQueue.forEach(function (request, key) {
            request.callback(errors.PendingRequestsOnReconnectingError());
            _this.responseQueue.delete(key);
        });
    }

    if (
        !this.reconnectOptions.maxAttempts ||
        this.reconnectAttempts < this.reconnectOptions.maxAttempts
    ) {
        setTimeout(function () {
            _this.reconnectAttempts++;
            _this._removeSocketListeners();
            _this.emit(_this.RECONNECT, _this.reconnectAttempts);
            _this.connect();
        }, this.reconnectOptions.delay);

        return;
    }

    this.emit(this.ERROR, errors.MaxAttemptsReachedOnReconnectingError());
    this.reconnecting = false;

    if (this.requestQueue.size > 0) {
        this.requestQueue.forEach(function (request, key) {
            request.callback(errors.MaxAttemptsReachedOnReconnectingError());
            _this.requestQueue.delete(key);
        });
    }
};

module.exports = WebsocketProvider;


/***/ }),

/***/ 1375:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process, Buffer) {var isNode = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';

var _btoa = null;
var helpers = null;
if (isNode) {
    _btoa = function(str) {
        return Buffer.from(str).toString('base64');
    };
    var url = __webpack_require__(140);
    if (url.URL) {
        // Use the new Node 6+ API for parsing URLs that supports username/password
        var newURL = url.URL;
        helpers = function(url) {
            return new newURL(url);
        };
    } else {
        // Web3 supports Node.js 5, so fall back to the legacy URL API if necessary
        helpers = __webpack_require__(140).parse;
    }
} else {
    _btoa = btoa.bind(window);
    helpers = function(url) {
        return new URL(url);
    };
}

module.exports = {
    parseURL: helpers,
    btoa: _btoa
};

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(95), __webpack_require__(22).Buffer))

/***/ }),

/***/ 1376:
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
/** @file httpprovider.js
 * @authors:
 *   Marek Kotewicz <marek@parity.io>
 *   Marian Oancea
 *   Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2015
 */

var errors = __webpack_require__(61).errors;
var XHR2 = __webpack_require__(309).XMLHttpRequest; // jshint ignore: line
var http = __webpack_require__(223);
var https = __webpack_require__(235);


/**
 * HttpProvider should be used to send rpc calls over http
 */
var HttpProvider = function HttpProvider(host, options) {
    options = options || {};

    this.withCredentials = options.withCredentials || false;
    this.timeout = options.timeout || 0;
    this.headers = options.headers;
    this.agent = options.agent;
    this.connected = false;

    // keepAlive is true unless explicitly set to false
    const keepAlive = options.keepAlive !== false;
    this.host = host || 'http://localhost:8545';
    if (!this.agent) {
        if (this.host.substring(0,5) === "https") {
            this.httpsAgent = new https.Agent({ keepAlive });
        } else {
            this.httpAgent = new http.Agent({ keepAlive });
        }
    }
};

HttpProvider.prototype._prepareRequest = function(){
    var request;

    // the current runtime is a browser
    if (typeof XMLHttpRequest !== 'undefined') {
        request = new XMLHttpRequest();
    } else {
        request = new XHR2();
        var agents = {httpsAgent: this.httpsAgent, httpAgent: this.httpAgent, baseUrl: this.baseUrl};

        if (this.agent) {
            agents.httpsAgent = this.agent.https;
            agents.httpAgent = this.agent.http;
            agents.baseUrl = this.agent.baseUrl;
        }

        request.nodejsSet(agents);
    }

    request.open('POST', this.host, true);
    request.setRequestHeader('Content-Type','application/json');
    request.timeout = this.timeout;
    request.withCredentials = this.withCredentials;

    if(this.headers) {
        this.headers.forEach(function(header) {
            request.setRequestHeader(header.name, header.value);
        });
    }

    return request;
};

/**
 * Should be used to make async request
 *
 * @method send
 * @param {Object} payload
 * @param {Function} callback triggered on end with (err, result)
 */
HttpProvider.prototype.send = function (payload, callback) {
    var _this = this;
    var request = this._prepareRequest();

    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.timeout !== 1) {
            var result = request.responseText;
            var error = null;

            try {
                result = JSON.parse(result);
            } catch(e) {
                error = errors.InvalidResponse(request.responseText);
            }

            _this.connected = true;
            callback(error, result);
        }
    };

    request.ontimeout = function() {
        _this.connected = false;
        callback(errors.ConnectionTimeout(this.timeout));
    };

    try {
        request.send(JSON.stringify(payload));
    } catch(error) {
        this.connected = false;
        callback(errors.InvalidConnection(this.host));
    }
};

HttpProvider.prototype.disconnect = function () {
    //NO OP
};

/**
 * Returns the desired boolean.
 *
 * @method supportsSubscriptions
 * @returns {boolean}
 */
HttpProvider.prototype.supportsSubscriptions = function () {
    return false;
};

module.exports = HttpProvider;


/***/ }),

/***/ 1377:
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
/** @file index.js
 * @authors:
 *   Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2017
 */



var _ = __webpack_require__(51);
var errors = __webpack_require__(61).errors;
var oboe = __webpack_require__(1378);


var IpcProvider = function IpcProvider(path, net) {
    var _this = this;
    this.responseCallbacks = {};
    this.notificationCallbacks = [];
    this.path = path;
    this.connected = false;

    this.connection = net.connect({path: this.path});

    this.addDefaultEvents();

    // LISTEN FOR CONNECTION RESPONSES
    var callback = function(result) {
        /*jshint maxcomplexity: 6 */

        var id = null;

        // get the id which matches the returned id
        if(_.isArray(result)) {
            result.forEach(function(load){
                if(_this.responseCallbacks[load.id])
                    id = load.id;
            });
        } else {
            id = result.id;
        }

        // notification
        if(!id && result.method.indexOf('_subscription') !== -1) {
            _this.notificationCallbacks.forEach(function(callback){
                if(_.isFunction(callback))
                    callback(result);
            });

            // fire the callback
        } else if(_this.responseCallbacks[id]) {
            _this.responseCallbacks[id](null, result);
            delete _this.responseCallbacks[id];
        }
    };

    // use oboe.js for Sockets
    if (net.constructor.name === 'Socket') {
        oboe(this.connection)
        .done(callback);
    } else {
        this.connection.on('data', function(data){
            _this._parseResponse(data.toString()).forEach(callback);
        });
    }
};

/**
Will add the error and end event to timeout existing calls

@method addDefaultEvents
*/
IpcProvider.prototype.addDefaultEvents = function(){
    var _this = this;

    this.connection.on('connect', function(){
        _this.connected = true;
    });

    this.connection.on('close', function(){
        _this.connected = false;
    });

    this.connection.on('error', function(){
        _this._timeout();
    });

    this.connection.on('end', function(){
        _this._timeout();
    });

    this.connection.on('timeout', function(){
        _this._timeout();
    });
};


/**
 Will parse the response and make an array out of it.

 NOTE, this exists for backwards compatibility reasons.

 @method _parseResponse
 @param {String} data
 */
IpcProvider.prototype._parseResponse = function(data) {
    var _this = this,
        returnValues = [];

    // DE-CHUNKER
    var dechunkedData = data
        .replace(/\}[\n\r]?\{/g,'}|--|{') // }{
        .replace(/\}\][\n\r]?\[\{/g,'}]|--|[{') // }][{
        .replace(/\}[\n\r]?\[\{/g,'}|--|[{') // }[{
        .replace(/\}\][\n\r]?\{/g,'}]|--|{') // }]{
        .split('|--|');

    dechunkedData.forEach(function(data){

        // prepend the last chunk
        if(_this.lastChunk)
            data = _this.lastChunk + data;

        var result = null;

        try {
            result = JSON.parse(data);

        } catch(e) {

            _this.lastChunk = data;

            // start timeout to cancel all requests
            clearTimeout(_this.lastChunkTimeout);
            _this.lastChunkTimeout = setTimeout(function(){
                _this._timeout();
                throw errors.InvalidResponse(data);
            }, 1000 * 15);

            return;
        }

        // cancel timeout and set chunk to null
        clearTimeout(_this.lastChunkTimeout);
        _this.lastChunk = null;

        if(result)
            returnValues.push(result);
    });

    return returnValues;
};


/**
Get the adds a callback to the responseCallbacks object,
which will be called if a response matching the response Id will arrive.

@method _addResponseCallback
*/
IpcProvider.prototype._addResponseCallback = function(payload, callback) {
    var id = payload.id || payload[0].id;
    var method = payload.method || payload[0].method;

    this.responseCallbacks[id] = callback;
    this.responseCallbacks[id].method = method;
};

/**
Timeout all requests when the end/error event is fired

@method _timeout
*/
IpcProvider.prototype._timeout = function() {
    for(var key in this.responseCallbacks) {
        if(this.responseCallbacks.hasOwnProperty(key)){
            this.responseCallbacks[key](errors.InvalidConnection('on IPC'));
            delete this.responseCallbacks[key];
        }
    }
};

/**
 Try to reconnect

 @method reconnect
 */
IpcProvider.prototype.reconnect = function() {
    this.connection.connect({path: this.path});
};


IpcProvider.prototype.send = function (payload, callback) {
    // try reconnect, when connection is gone
    if(!this.connection.writable)
        this.connection.connect({path: this.path});


    this.connection.write(JSON.stringify(payload));
    this._addResponseCallback(payload, callback);
};

/**
Subscribes to provider events.provider

@method on
@param {String} type    'notification', 'connect', 'error', 'end' or 'data'
@param {Function} callback   the callback to call
*/
IpcProvider.prototype.on = function (type, callback) {

    if(typeof callback !== 'function')
        throw new Error('The second parameter callback must be a function.');

    switch(type){
        case 'data':
            this.notificationCallbacks.push(callback);
            break;

        // adds error, end, timeout, connect
        default:
            this.connection.on(type, callback);
            break;
    }
};

/**
 Subscribes to provider events.provider

 @method on
 @param {String} type    'connect', 'error', 'end' or 'data'
 @param {Function} callback   the callback to call
 */
IpcProvider.prototype.once = function (type, callback) {

    if(typeof callback !== 'function')
        throw new Error('The second parameter callback must be a function.');

    this.connection.once(type, callback);
};

/**
Removes event listener

@method removeListener
@param {String} type    'data', 'connect', 'error', 'end' or 'data'
@param {Function} callback   the callback to call
*/
IpcProvider.prototype.removeListener = function (type, callback) {
    var _this = this;

    switch(type){
        case 'data':
            this.notificationCallbacks.forEach(function(cb, index){
                if(cb === callback)
                    _this.notificationCallbacks.splice(index, 1);
            });
            break;

        default:
            this.connection.removeListener(type, callback);
            break;
    }
};

/**
Removes all event listeners

@method removeAllListeners
@param {String} type    'data', 'connect', 'error', 'end' or 'data'
*/
IpcProvider.prototype.removeAllListeners = function (type) {
    switch(type){
        case 'data':
            this.notificationCallbacks = [];
            break;

        default:
            this.connection.removeAllListeners(type);
            break;
    }
};

/**
Resets the providers, clears all callbacks

@method reset
*/
IpcProvider.prototype.reset = function () {
    this._timeout();
    this.notificationCallbacks = [];

    this.connection.removeAllListeners('error');
    this.connection.removeAllListeners('end');
    this.connection.removeAllListeners('timeout');

    this.addDefaultEvents();
};

/**
 * Returns the desired boolean.
 *
 * @method supportsSubscriptions
 * @returns {boolean}
 */
IpcProvider.prototype.supportsSubscriptions = function () {
    return true;
};

module.exports = IpcProvider;



/***/ }),

/***/ 1378:
/***/ (function(module, exports, __webpack_require__) {

// This file is the concatenation of many js files.
// See http://github.com/jimhigson/oboe.js for the raw source

// having a local undefined, window, Object etc allows slightly better minification:
(function  (window, Object, Array, Error, JSON, undefined ) {

   // v2.1.3-15-g7432b49

/*

Copyright (c) 2013, Jim Higson

All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

1.  Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.

2.  Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

/** 
 * Partially complete a function.
 * 
 *  var add3 = partialComplete( function add(a,b){return a+b}, 3 );
 *  
 *  add3(4) // gives 7
 *  
 *  function wrap(left, right, cen){return left + " " + cen + " " + right;}
 *  
 *  var pirateGreeting = partialComplete( wrap , "I'm", ", a mighty pirate!" );
 *  
 *  pirateGreeting("Guybrush Threepwood"); 
 *  // gives "I'm Guybrush Threepwood, a mighty pirate!"
 */
var partialComplete = varArgs(function( fn, args ) {

      // this isn't the shortest way to write this but it does
      // avoid creating a new array each time to pass to fn.apply,
      // otherwise could just call boundArgs.concat(callArgs)       

      var numBoundArgs = args.length;

      return varArgs(function( callArgs ) {
         
         for (var i = 0; i < callArgs.length; i++) {
            args[numBoundArgs + i] = callArgs[i];
         }
         
         args.length = numBoundArgs + callArgs.length;         
                     
         return fn.apply(this, args);
      }); 
   }),

/**
 * Compose zero or more functions:
 * 
 *    compose(f1, f2, f3)(x) = f1(f2(f3(x))))
 * 
 * The last (inner-most) function may take more than one parameter:
 * 
 *    compose(f1, f2, f3)(x,y) = f1(f2(f3(x,y))))
 */
   compose = varArgs(function(fns) {

      var fnsList = arrayAsList(fns);
   
      function next(params, curFn) {  
         return [apply(params, curFn)];   
      }
            
      return varArgs(function(startParams){
        
         return foldR(next, startParams, fnsList)[0];
      });
   });

/**
 * A more optimised version of compose that takes exactly two functions
 * @param f1
 * @param f2
 */
function compose2(f1, f2){
   return function(){
      return f1.call(this,f2.apply(this,arguments));
   }
}

/**
 * Generic form for a function to get a property from an object
 * 
 *    var o = {
 *       foo:'bar'
 *    }
 *    
 *    var getFoo = attr('foo')
 *    
 *    fetFoo(o) // returns 'bar'
 * 
 * @param {String} key the property name
 */
function attr(key) {
   return function(o) { return o[key]; };
}
        
/**
 * Call a list of functions with the same args until one returns a 
 * truthy result. Similar to the || operator.
 * 
 * So:
 *      lazyUnion([f1,f2,f3 ... fn])( p1, p2 ... pn )
 *      
 * Is equivalent to: 
 *      apply([p1, p2 ... pn], f1) || 
 *      apply([p1, p2 ... pn], f2) || 
 *      apply([p1, p2 ... pn], f3) ... apply(fn, [p1, p2 ... pn])  
 *  
 * @returns the first return value that is given that is truthy.
 */
   var lazyUnion = varArgs(function(fns) {

      return varArgs(function(params){
   
         var maybeValue;
   
         for (var i = 0; i < len(fns); i++) {
   
            maybeValue = apply(params, fns[i]);
   
            if( maybeValue ) {
               return maybeValue;
            }
         }
      });
   });   

/**
 * This file declares various pieces of functional programming.
 * 
 * This isn't a general purpose functional library, to keep things small it
 * has just the parts useful for Oboe.js.
 */


/**
 * Call a single function with the given arguments array.
 * Basically, a functional-style version of the OO-style Function#apply for 
 * when we don't care about the context ('this') of the call.
 * 
 * The order of arguments allows partial completion of the arguments array
 */
function apply(args, fn) {
   return fn.apply(undefined, args);
}

/**
 * Define variable argument functions but cut out all that tedious messing about 
 * with the arguments object. Delivers the variable-length part of the arguments
 * list as an array.
 * 
 * Eg:
 * 
 * var myFunction = varArgs(
 *    function( fixedArgument, otherFixedArgument, variableNumberOfArguments ){
 *       console.log( variableNumberOfArguments );
 *    }
 * )
 * 
 * myFunction('a', 'b', 1, 2, 3); // logs [1,2,3]
 * 
 * var myOtherFunction = varArgs(function( variableNumberOfArguments ){
 *    console.log( variableNumberOfArguments );
 * })
 * 
 * myFunction(1, 2, 3); // logs [1,2,3]
 * 
 */
function varArgs(fn){

   var numberOfFixedArguments = fn.length -1,
       slice = Array.prototype.slice;          
         
                   
   if( numberOfFixedArguments == 0 ) {
      // an optimised case for when there are no fixed args:   
   
      return function(){
         return fn.call(this, slice.call(arguments));
      }
      
   } else if( numberOfFixedArguments == 1 ) {
      // an optimised case for when there are is one fixed args:
   
      return function(){
         return fn.call(this, arguments[0], slice.call(arguments, 1));
      }
   }
   
   // general case   

   // we know how many arguments fn will always take. Create a
   // fixed-size array to hold that many, to be re-used on
   // every call to the returned function
   var argsHolder = Array(fn.length);   
                             
   return function(){
                            
      for (var i = 0; i < numberOfFixedArguments; i++) {
         argsHolder[i] = arguments[i];         
      }

      argsHolder[numberOfFixedArguments] = 
         slice.call(arguments, numberOfFixedArguments);
                                
      return fn.apply( this, argsHolder);      
   }       
}


/**
 * Swap the order of parameters to a binary function
 * 
 * A bit like this flip: http://zvon.org/other/haskell/Outputprelude/flip_f.html
 */
function flip(fn){
   return function(a, b){
      return fn(b,a);
   }
}


/**
 * Create a function which is the intersection of two other functions.
 * 
 * Like the && operator, if the first is truthy, the second is never called,
 * otherwise the return value from the second is returned.
 */
function lazyIntersection(fn1, fn2) {

   return function (param) {
                                                              
      return fn1(param) && fn2(param);
   };   
}

/**
 * A function which does nothing
 */
function noop(){}

/**
 * A function which is always happy
 */
function always(){return true}

/**
 * Create a function which always returns the same
 * value
 * 
 * var return3 = functor(3);
 * 
 * return3() // gives 3
 * return3() // still gives 3
 * return3() // will always give 3
 */
function functor(val){
   return function(){
      return val;
   }
}

/**
 * This file defines some loosely associated syntactic sugar for 
 * Javascript programming 
 */


/**
 * Returns true if the given candidate is of type T
 */
function isOfType(T, maybeSomething){
   return maybeSomething && maybeSomething.constructor === T;
}

var len = attr('length'),    
    isString = partialComplete(isOfType, String);

/** 
 * I don't like saying this:
 * 
 *    foo !=== undefined
 *    
 * because of the double-negative. I find this:
 * 
 *    defined(foo)
 *    
 * easier to read.
 */ 
function defined( value ) {
   return value !== undefined;
}

/**
 * Returns true if object o has a key named like every property in 
 * the properties array. Will give false if any are missing, or if o 
 * is not an object.
 */
function hasAllProperties(fieldList, o) {

   return      (o instanceof Object) 
            &&
               all(function (field) {         
                  return (field in o);         
               }, fieldList);
}
/**
 * Like cons in Lisp
 */
function cons(x, xs) {
   
   /* Internally lists are linked 2-element Javascript arrays.
          
      Ideally the return here would be Object.freeze([x,xs])
      so that bugs related to mutation are found fast.
      However, cons is right on the critical path for
      performance and this slows oboe-mark down by
      ~25%. Under theoretical future JS engines that freeze more
      efficiently (possibly even use immutability to
      run faster) this should be considered for
      restoration.
   */
   
   return [x,xs];
}

/**
 * The empty list
 */
var emptyList = null,

/**
 * Get the head of a list.
 * 
 * Ie, head(cons(a,b)) = a
 */
    head = attr(0),

/**
 * Get the tail of a list.
 * 
 * Ie, tail(cons(a,b)) = b
 */
    tail = attr(1);


/** 
 * Converts an array to a list 
 * 
 *    asList([a,b,c])
 * 
 * is equivalent to:
 *    
 *    cons(a, cons(b, cons(c, emptyList))) 
 **/
function arrayAsList(inputArray){

   return reverseList( 
      inputArray.reduce(
         flip(cons),
         emptyList 
      )
   );
}

/**
 * A varargs version of arrayAsList. Works a bit like list
 * in LISP.
 * 
 *    list(a,b,c) 
 *    
 * is equivalent to:
 * 
 *    cons(a, cons(b, cons(c, emptyList)))
 */
var list = varArgs(arrayAsList);

/**
 * Convert a list back to a js native array
 */
function listAsArray(list){

   return foldR( function(arraySoFar, listItem){
      
      arraySoFar.unshift(listItem);
      return arraySoFar;
           
   }, [], list );
   
}

/**
 * Map a function over a list 
 */
function map(fn, list) {

   return list
            ? cons(fn(head(list)), map(fn,tail(list)))
            : emptyList
            ;
}

/**
 * foldR implementation. Reduce a list down to a single value.
 * 
 * @pram {Function} fn     (rightEval, curVal) -> result 
 */
function foldR(fn, startValue, list) {
      
   return list 
            ? fn(foldR(fn, startValue, tail(list)), head(list))
            : startValue
            ;
}

/**
 * foldR implementation. Reduce a list down to a single value.
 * 
 * @pram {Function} fn     (rightEval, curVal) -> result 
 */
function foldR1(fn, list) {
      
   return tail(list) 
            ? fn(foldR1(fn, tail(list)), head(list))
            : head(list)
            ;
}


/**
 * Return a list like the one given but with the first instance equal 
 * to item removed 
 */
function without(list, test, removedFn) {
 
   return withoutInner(list, removedFn || noop);
 
   function withoutInner(subList, removedFn) {
      return subList  
         ?  ( test(head(subList)) 
                  ? (removedFn(head(subList)), tail(subList)) 
                  : cons(head(subList), withoutInner(tail(subList), removedFn))
            )
         : emptyList
         ;
   }               
}

/** 
 * Returns true if the given function holds for every item in 
 * the list, false otherwise 
 */
function all(fn, list) {
   
   return !list || 
          ( fn(head(list)) && all(fn, tail(list)) );
}

/**
 * Call every function in a list of functions with the same arguments
 * 
 * This doesn't make any sense if we're doing pure functional because 
 * it doesn't return anything. Hence, this is only really useful if the
 * functions being called have side-effects. 
 */
function applyEach(fnList, args) {

   if( fnList ) {  
      head(fnList).apply(null, args);
      
      applyEach(tail(fnList), args);
   }
}

/**
 * Reverse the order of a list
 */
function reverseList(list){ 

   // js re-implementation of 3rd solution from:
   //    http://www.haskell.org/haskellwiki/99_questions/Solutions/5
   function reverseInner( list, reversedAlready ) {
      if( !list ) {
         return reversedAlready;
      }
      
      return reverseInner(tail(list), cons(head(list), reversedAlready))
   }

   return reverseInner(list, emptyList);
}

function first(test, list) {
   return   list &&
               (test(head(list)) 
                  ? head(list) 
                  : first(test,tail(list))); 
}

/* 
   This is a slightly hacked-up browser only version of clarinet 
   
      *  some features removed to help keep browser Oboe under 
         the 5k micro-library limit
      *  plug directly into event bus
   
   For the original go here:
      https://github.com/dscape/clarinet

   We receive the events:
      STREAM_DATA
      STREAM_END
      
   We emit the events:
      SAX_KEY
      SAX_VALUE_OPEN
      SAX_VALUE_CLOSE      
      FAIL_EVENT      
 */

function clarinet(eventBus) {
  "use strict";
   
  var 
      // shortcut some events on the bus
      emitSaxKey           = eventBus(SAX_KEY).emit,
      emitValueOpen        = eventBus(SAX_VALUE_OPEN).emit,
      emitValueClose       = eventBus(SAX_VALUE_CLOSE).emit,
      emitFail             = eventBus(FAIL_EVENT).emit,
              
      MAX_BUFFER_LENGTH = 64 * 1024
  ,   stringTokenPattern = /[\\"\n]/g
  ,   _n = 0
  
      // states
  ,   BEGIN                = _n++
  ,   VALUE                = _n++ // general stuff
  ,   OPEN_OBJECT          = _n++ // {
  ,   CLOSE_OBJECT         = _n++ // }
  ,   OPEN_ARRAY           = _n++ // [
  ,   CLOSE_ARRAY          = _n++ // ]
  ,   STRING               = _n++ // ""
  ,   OPEN_KEY             = _n++ // , "a"
  ,   CLOSE_KEY            = _n++ // :
  ,   TRUE                 = _n++ // r
  ,   TRUE2                = _n++ // u
  ,   TRUE3                = _n++ // e
  ,   FALSE                = _n++ // a
  ,   FALSE2               = _n++ // l
  ,   FALSE3               = _n++ // s
  ,   FALSE4               = _n++ // e
  ,   NULL                 = _n++ // u
  ,   NULL2                = _n++ // l
  ,   NULL3                = _n++ // l
  ,   NUMBER_DECIMAL_POINT = _n++ // .
  ,   NUMBER_DIGIT         = _n   // [0-9]

      // setup initial parser values
  ,   bufferCheckPosition  = MAX_BUFFER_LENGTH
  ,   latestError                
  ,   c                    
  ,   p                    
  ,   textNode             = undefined
  ,   numberNode           = ""     
  ,   slashed              = false
  ,   closed               = false
  ,   state                = BEGIN
  ,   stack                = []
  ,   unicodeS             = null
  ,   unicodeI             = 0
  ,   depth                = 0
  ,   position             = 0
  ,   column               = 0  //mostly for error reporting
  ,   line                 = 1
  ;

  function checkBufferLength () {
     
    var maxActual = 0;
     
    if (textNode !== undefined && textNode.length > MAX_BUFFER_LENGTH) {
      emitError("Max buffer length exceeded: textNode");
      maxActual = Math.max(maxActual, textNode.length);
    }
    if (numberNode.length > MAX_BUFFER_LENGTH) {
      emitError("Max buffer length exceeded: numberNode");
      maxActual = Math.max(maxActual, numberNode.length);
    }
     
    bufferCheckPosition = (MAX_BUFFER_LENGTH - maxActual)
                               + position;
  }

  eventBus(STREAM_DATA).on(handleData);

   /* At the end of the http content close the clarinet 
    This will provide an error if the total content provided was not 
    valid json, ie if not all arrays, objects and Strings closed properly */
  eventBus(STREAM_END).on(handleStreamEnd);   

  function emitError (errorString) {
     if (textNode !== undefined) {
        emitValueOpen(textNode);
        emitValueClose();
        textNode = undefined;
     }

     latestError = Error(errorString + "\nLn: "+line+
                                       "\nCol: "+column+
                                       "\nChr: "+c);
     
     emitFail(errorReport(undefined, undefined, latestError));
  }

  function handleStreamEnd() {
    if( state == BEGIN ) {
      // Handle the case where the stream closes without ever receiving
      // any input. This isn't an error - response bodies can be blank,
      // particularly for 204 http responses
      
      // Because of how Oboe is currently implemented, we parse a
      // completely empty stream as containing an empty object.
      // This is because Oboe's done event is only fired when the
      // root object of the JSON stream closes.
      
      // This should be decoupled and attached instead to the input stream
      // from the http (or whatever) resource ending.
      // If this decoupling could happen the SAX parser could simply emit
      // zero events on a completely empty input.
      emitValueOpen({});
      emitValueClose();

      closed = true;
      return;
    }
  
    if (state !== VALUE || depth !== 0)
      emitError("Unexpected end");
 
    if (textNode !== undefined) {
      emitValueOpen(textNode);
      emitValueClose();
      textNode = undefined;
    }
     
    closed = true;
  }

  function whitespace(c){
     return c == '\r' || c == '\n' || c == ' ' || c == '\t';
  }
   
  function handleData (chunk) {
         
    // this used to throw the error but inside Oboe we will have already
    // gotten the error when it was emitted. The important thing is to
    // not continue with the parse.
    if (latestError)
      return;
      
    if (closed) {
       return emitError("Cannot write after close");
    }

    var i = 0;
    c = chunk[0]; 

    while (c) {
      if (i > 0) {
        p = c;
      }
      c = chunk[i++];
      if(!c) break;

      position ++;
      if (c == "\n") {
        line ++;
        column = 0;
      } else column ++;
      switch (state) {

        case BEGIN:
          if (c === "{") state = OPEN_OBJECT;
          else if (c === "[") state = OPEN_ARRAY;
          else if (!whitespace(c))
            return emitError("Non-whitespace before {[.");
        continue;

        case OPEN_KEY:
        case OPEN_OBJECT:
          if (whitespace(c)) continue;
          if(state === OPEN_KEY) stack.push(CLOSE_KEY);
          else {
            if(c === '}') {
              emitValueOpen({});
              emitValueClose();
              state = stack.pop() || VALUE;
              continue;
            } else  stack.push(CLOSE_OBJECT);
          }
          if(c === '"')
             state = STRING;
          else
             return emitError("Malformed object key should start with \" ");
        continue;

        case CLOSE_KEY:
        case CLOSE_OBJECT:
          if (whitespace(c)) continue;

          if(c===':') {
            if(state === CLOSE_OBJECT) {
              stack.push(CLOSE_OBJECT);

               if (textNode !== undefined) {
                  // was previously (in upstream Clarinet) one event
                  //  - object open came with the text of the first
                  emitValueOpen({});
                  emitSaxKey(textNode);
                  textNode = undefined;
               }
               depth++;
            } else {
               if (textNode !== undefined) {
                  emitSaxKey(textNode);
                  textNode = undefined;
               }
            }
             state  = VALUE;
          } else if (c==='}') {
             if (textNode !== undefined) {
                emitValueOpen(textNode);
                emitValueClose();
                textNode = undefined;
             }
             emitValueClose();
            depth--;
            state = stack.pop() || VALUE;
          } else if(c===',') {
            if(state === CLOSE_OBJECT)
              stack.push(CLOSE_OBJECT);
             if (textNode !== undefined) {
                emitValueOpen(textNode);
                emitValueClose();
                textNode = undefined;
             }
             state  = OPEN_KEY;
          } else 
             return emitError('Bad object');
        continue;

        case OPEN_ARRAY: // after an array there always a value
        case VALUE:
          if (whitespace(c)) continue;
          if(state===OPEN_ARRAY) {
            emitValueOpen([]);
            depth++;             
            state = VALUE;
            if(c === ']') {
              emitValueClose();
              depth--;
              state = stack.pop() || VALUE;
              continue;
            } else {
              stack.push(CLOSE_ARRAY);
            }
          }
               if(c === '"') state = STRING;
          else if(c === '{') state = OPEN_OBJECT;
          else if(c === '[') state = OPEN_ARRAY;
          else if(c === 't') state = TRUE;
          else if(c === 'f') state = FALSE;
          else if(c === 'n') state = NULL;
          else if(c === '-') { // keep and continue
            numberNode += c;
          } else if(c==='0') {
            numberNode += c;
            state = NUMBER_DIGIT;
          } else if('123456789'.indexOf(c) !== -1) {
            numberNode += c;
            state = NUMBER_DIGIT;
          } else               
            return emitError("Bad value");
        continue;

        case CLOSE_ARRAY:
          if(c===',') {
            stack.push(CLOSE_ARRAY);
             if (textNode !== undefined) {
                emitValueOpen(textNode);
                emitValueClose();
                textNode = undefined;
             }
             state  = VALUE;
          } else if (c===']') {
             if (textNode !== undefined) {
                emitValueOpen(textNode);
                emitValueClose();
                textNode = undefined;
             }
             emitValueClose();
            depth--;
            state = stack.pop() || VALUE;
          } else if (whitespace(c))
              continue;
          else 
             return emitError('Bad array');
        continue;

        case STRING:
          if (textNode === undefined) {
              textNode = "";
          }

          // thanks thejh, this is an about 50% performance improvement.
          var starti              = i-1;
           
          STRING_BIGLOOP: while (true) {

            // zero means "no unicode active". 1-4 mean "parse some more". end after 4.
            while (unicodeI > 0) {
              unicodeS += c;
              c = chunk.charAt(i++);
              if (unicodeI === 4) {
                // TODO this might be slow? well, probably not used too often anyway
                textNode += String.fromCharCode(parseInt(unicodeS, 16));
                unicodeI = 0;
                starti = i-1;
              } else {
                unicodeI++;
              }
              // we can just break here: no stuff we skipped that still has to be sliced out or so
              if (!c) break STRING_BIGLOOP;
            }
            if (c === '"' && !slashed) {
              state = stack.pop() || VALUE;
              textNode += chunk.substring(starti, i-1);
              break;
            }
            if (c === '\\' && !slashed) {
              slashed = true;
              textNode += chunk.substring(starti, i-1);
               c = chunk.charAt(i++);
              if (!c) break;
            }
            if (slashed) {
              slashed = false;
                   if (c === 'n') { textNode += '\n'; }
              else if (c === 'r') { textNode += '\r'; }
              else if (c === 't') { textNode += '\t'; }
              else if (c === 'f') { textNode += '\f'; }
              else if (c === 'b') { textNode += '\b'; }
              else if (c === 'u') {
                // \uxxxx. meh!
                unicodeI = 1;
                unicodeS = '';
              } else {
                textNode += c;
              }
              c = chunk.charAt(i++);
              starti = i-1;
              if (!c) break;
              else continue;
            }

            stringTokenPattern.lastIndex = i;
            var reResult = stringTokenPattern.exec(chunk);
            if (!reResult) {
              i = chunk.length+1;
              textNode += chunk.substring(starti, i-1);
              break;
            }
            i = reResult.index+1;
            c = chunk.charAt(reResult.index);
            if (!c) {
              textNode += chunk.substring(starti, i-1);
              break;
            }
          }
        continue;

        case TRUE:
          if (!c)  continue; // strange buffers
          if (c==='r') state = TRUE2;
          else
             return emitError( 'Invalid true started with t'+ c);
        continue;

        case TRUE2:
          if (!c)  continue;
          if (c==='u') state = TRUE3;
          else
             return emitError('Invalid true started with tr'+ c);
        continue;

        case TRUE3:
          if (!c) continue;
          if(c==='e') {
            emitValueOpen(true);
            emitValueClose();
            state = stack.pop() || VALUE;
          } else
             return emitError('Invalid true started with tru'+ c);
        continue;

        case FALSE:
          if (!c)  continue;
          if (c==='a') state = FALSE2;
          else
             return emitError('Invalid false started with f'+ c);
        continue;

        case FALSE2:
          if (!c)  continue;
          if (c==='l') state = FALSE3;
          else
             return emitError('Invalid false started with fa'+ c);
        continue;

        case FALSE3:
          if (!c)  continue;
          if (c==='s') state = FALSE4;
          else
             return emitError('Invalid false started with fal'+ c);
        continue;

        case FALSE4:
          if (!c)  continue;
          if (c==='e') {
            emitValueOpen(false);
            emitValueClose();
            state = stack.pop() || VALUE;
          } else
             return emitError('Invalid false started with fals'+ c);
        continue;

        case NULL:
          if (!c)  continue;
          if (c==='u') state = NULL2;
          else
             return emitError('Invalid null started with n'+ c);
        continue;

        case NULL2:
          if (!c)  continue;
          if (c==='l') state = NULL3;
          else
             return emitError('Invalid null started with nu'+ c);
        continue;

        case NULL3:
          if (!c) continue;
          if(c==='l') {
            emitValueOpen(null);
            emitValueClose();
            state = stack.pop() || VALUE;
          } else 
             return emitError('Invalid null started with nul'+ c);
        continue;

        case NUMBER_DECIMAL_POINT:
          if(c==='.') {
            numberNode += c;
            state       = NUMBER_DIGIT;
          } else 
             return emitError('Leading zero not followed by .');
        continue;

        case NUMBER_DIGIT:
          if('0123456789'.indexOf(c) !== -1) numberNode += c;
          else if (c==='.') {
            if(numberNode.indexOf('.')!==-1)
               return emitError('Invalid number has two dots');
            numberNode += c;
          } else if (c==='e' || c==='E') {
            if(numberNode.indexOf('e')!==-1 ||
               numberNode.indexOf('E')!==-1 )
               return emitError('Invalid number has two exponential');
            numberNode += c;
          } else if (c==="+" || c==="-") {
            if(!(p==='e' || p==='E'))
               return emitError('Invalid symbol in number');
            numberNode += c;
          } else {
            if (numberNode) {
              emitValueOpen(parseFloat(numberNode));
              emitValueClose();
              numberNode = "";
            }
            i--; // go back one
            state = stack.pop() || VALUE;
          }
        continue;

        default:
          return emitError("Unknown state: " + state);
      }
    }
    if (position >= bufferCheckPosition)
      checkBufferLength();
  }
}


/** 
 * A bridge used to assign stateless functions to listen to clarinet.
 * 
 * As well as the parameter from clarinet, each callback will also be passed
 * the result of the last callback.
 * 
 * This may also be used to clear all listeners by assigning zero handlers:
 * 
 *    ascentManager( clarinet, {} )
 */
function ascentManager(oboeBus, handlers){
   "use strict";
   
   var listenerId = {},
       ascent;

   function stateAfter(handler) {
      return function(param){
         ascent = handler( ascent, param);
      }
   }
   
   for( var eventName in handlers ) {

      oboeBus(eventName).on(stateAfter(handlers[eventName]), listenerId);
   }
   
   oboeBus(NODE_SWAP).on(function(newNode) {
      
      var oldHead = head(ascent),
          key = keyOf(oldHead),
          ancestors = tail(ascent),
          parentNode;

      if( ancestors ) {
         parentNode = nodeOf(head(ancestors));
         parentNode[key] = newNode;
      }
   });

   oboeBus(NODE_DROP).on(function() {

      var oldHead = head(ascent),
          key = keyOf(oldHead),
          ancestors = tail(ascent),
          parentNode;

      if( ancestors ) {
         parentNode = nodeOf(head(ancestors));
 
         delete parentNode[key];
      }
   });

   oboeBus(ABORTING).on(function(){
      
      for( var eventName in handlers ) {
         oboeBus(eventName).un(listenerId);
      }
   });   
}

// based on gist https://gist.github.com/monsur/706839

/**
 * XmlHttpRequest's getAllResponseHeaders() method returns a string of response
 * headers according to the format described here:
 * http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders-method
 * This method parses that string into a user-friendly key/value pair object.
 */
function parseResponseHeaders(headerStr) {
   var headers = {};
   
   headerStr && headerStr.split('\u000d\u000a')
      .forEach(function(headerPair){
   
         // Can't use split() here because it does the wrong thing
         // if the header value has the string ": " in it.
         var index = headerPair.indexOf('\u003a\u0020');
         
         headers[headerPair.substring(0, index)] 
                     = headerPair.substring(index + 2);
      });
   
   return headers;
}

/**
 * Detect if a given URL is cross-origin in the scope of the
 * current page.
 * 
 * Browser only (since cross-origin has no meaning in Node.js)
 *
 * @param {Object} pageLocation - as in window.location
 * @param {Object} ajaxHost - an object like window.location describing the 
 *    origin of the url that we want to ajax in
 */
function isCrossOrigin(pageLocation, ajaxHost) {

   /*
    * NB: defaultPort only knows http and https.
    * Returns undefined otherwise.
    */
   function defaultPort(protocol) {
      return {'http:':80, 'https:':443}[protocol];
   }
   
   function portOf(location) {
      // pageLocation should always have a protocol. ajaxHost if no port or
      // protocol is specified, should use the port of the containing page
      
      return location.port || defaultPort(location.protocol||pageLocation.protocol);
   }

   // if ajaxHost doesn't give a domain, port is the same as pageLocation
   // it can't give a protocol but not a domain
   // it can't give a port but not a domain
   
   return !!(  (ajaxHost.protocol  && (ajaxHost.protocol  != pageLocation.protocol)) ||
               (ajaxHost.host      && (ajaxHost.host      != pageLocation.host))     ||
               (ajaxHost.host      && (portOf(ajaxHost) != portOf(pageLocation)))
          );
}

/* turn any url into an object like window.location */
function parseUrlOrigin(url) {
   // url could be domain-relative
   // url could give a domain

   // cross origin means:
   //    same domain
   //    same port
   //    some protocol
   // so, same everything up to the first (single) slash 
   // if such is given
   //
   // can ignore everything after that   
   
   var URL_HOST_PATTERN = /(\w+:)?(?:\/\/)([\w.-]+)?(?::(\d+))?\/?/,

         // if no match, use an empty array so that
         // subexpressions 1,2,3 are all undefined
         // and will ultimately return all empty
         // strings as the parse result:
       urlHostMatch = URL_HOST_PATTERN.exec(url) || [];
   
   return {
      protocol:   urlHostMatch[1] || '',
      host:       urlHostMatch[2] || '',
      port:       urlHostMatch[3] || ''
   };
}

function httpTransport(){
   return new XMLHttpRequest();
}

/**
 * A wrapper around the browser XmlHttpRequest object that raises an 
 * event whenever a new part of the response is available.
 * 
 * In older browsers progressive reading is impossible so all the 
 * content is given in a single call. For newer ones several events
 * should be raised, allowing progressive interpretation of the response.
 *      
 * @param {Function} oboeBus an event bus local to this Oboe instance
 * @param {XMLHttpRequest} xhr the xhr to use as the transport. Under normal
 *          operation, will have been created using httpTransport() above
 *          but for tests a stub can be provided instead.
 * @param {String} method one of 'GET' 'POST' 'PUT' 'PATCH' 'DELETE'
 * @param {String} url the url to make a request to
 * @param {String|Null} data some content to be sent with the request.
 *                      Only valid if method is POST or PUT.
 * @param {Object} [headers] the http request headers to send
 * @param {boolean} withCredentials the XHR withCredentials property will be
 *    set to this value
 */  
function streamingHttp(oboeBus, xhr, method, url, data, headers, withCredentials) {
           
   "use strict";
   
   var emitStreamData = oboeBus(STREAM_DATA).emit,
       emitFail       = oboeBus(FAIL_EVENT).emit,
       numberOfCharsAlreadyGivenToCallback = 0,
       stillToSendStartEvent = true;

   // When an ABORTING message is put on the event bus abort 
   // the ajax request         
   oboeBus( ABORTING ).on( function(){
  
      // if we keep the onreadystatechange while aborting the XHR gives 
      // a callback like a successful call so first remove this listener
      // by assigning null:
      xhr.onreadystatechange = null;
            
      xhr.abort();
   });

   /** 
    * Handle input from the underlying xhr: either a state change,
    * the progress event or the request being complete.
    */
   function handleProgress() {
                        
      var textSoFar = xhr.responseText,
          newText = textSoFar.substr(numberOfCharsAlreadyGivenToCallback);
      
      
      /* Raise the event for new text.
      
         On older browsers, the new text is the whole response. 
         On newer/better ones, the fragment part that we got since 
         last progress. */
         
      if( newText ) {
         emitStreamData( newText );
      } 

      numberOfCharsAlreadyGivenToCallback = len(textSoFar);
   }
   
   
   if('onprogress' in xhr){  // detect browser support for progressive delivery
      xhr.onprogress = handleProgress;
   }
      
   xhr.onreadystatechange = function() {

      function sendStartIfNotAlready() {
         // Internet Explorer is very unreliable as to when xhr.status etc can
         // be read so has to be protected with try/catch and tried again on 
         // the next readyState if it fails
         try{
            stillToSendStartEvent && oboeBus( HTTP_START ).emit(
               xhr.status,
               parseResponseHeaders(xhr.getAllResponseHeaders()) );
            stillToSendStartEvent = false;
         } catch(e){/* do nothing, will try again on next readyState*/}
      }
      
      switch( xhr.readyState ) {
               
         case 2: // HEADERS_RECEIVED
         case 3: // LOADING
            return sendStartIfNotAlready();
            
         case 4: // DONE
            sendStartIfNotAlready(); // if xhr.status hasn't been available yet, it must be NOW, huh IE?
            
            // is this a 2xx http code?
            var successful = String(xhr.status)[0] == 2;
            
            if( successful ) {
               // In Chrome 29 (not 28) no onprogress is emitted when a response
               // is complete before the onload. We need to always do handleInput
               // in case we get the load but have not had a final progress event.
               // This looks like a bug and may change in future but let's take
               // the safest approach and assume we might not have received a 
               // progress event for each part of the response
               handleProgress();
               
               oboeBus(STREAM_END).emit();
            } else {

               emitFail( errorReport(
                  xhr.status, 
                  xhr.responseText
               ));
            }
      }
   };
   
   try{
   
      xhr.open(method, url, true);
   
      for( var headerName in headers ){
         xhr.setRequestHeader(headerName, headers[headerName]);
      }
      
      if( !isCrossOrigin(window.location, parseUrlOrigin(url)) ) {
         xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      }

      xhr.withCredentials = withCredentials;
      
      xhr.send(data);
      
   } catch( e ) {
      
      // To keep a consistent interface with Node, we can't emit an event here.
      // Node's streaming http adaptor receives the error as an asynchronous
      // event rather than as an exception. If we emitted now, the Oboe user
      // has had no chance to add a .fail listener so there is no way
      // the event could be useful. For both these reasons defer the
      // firing to the next JS frame.  
      window.setTimeout(
         partialComplete(emitFail, errorReport(undefined, undefined, e))
      ,  0
      );
   }            
}

var jsonPathSyntax = (function() {
 
   var
   
   /** 
    * Export a regular expression as a simple function by exposing just 
    * the Regex#exec. This allows regex tests to be used under the same 
    * interface as differently implemented tests, or for a user of the
    * tests to not concern themselves with their implementation as regular
    * expressions.
    * 
    * This could also be expressed point-free as:
    *   Function.prototype.bind.bind(RegExp.prototype.exec),
    *   
    * But that's far too confusing! (and not even smaller once minified 
    * and gzipped)
    */
       regexDescriptor = function regexDescriptor(regex) {
            return regex.exec.bind(regex);
       }
       
   /**
    * Join several regular expressions and express as a function.
    * This allows the token patterns to reuse component regular expressions
    * instead of being expressed in full using huge and confusing regular
    * expressions.
    */       
   ,   jsonPathClause = varArgs(function( componentRegexes ) {

            // The regular expressions all start with ^ because we 
            // only want to find matches at the start of the 
            // JSONPath fragment we are inspecting           
            componentRegexes.unshift(/^/);
            
            return   regexDescriptor(
                        RegExp(
                           componentRegexes.map(attr('source')).join('')
                        )
                     );
       })
       
   ,   possiblyCapturing =           /(\$?)/
   ,   namedNode =                   /([\w-_]+|\*)/
   ,   namePlaceholder =             /()/
   ,   nodeInArrayNotation =         /\["([^"]+)"\]/
   ,   numberedNodeInArrayNotation = /\[(\d+|\*)\]/
   ,   fieldList =                      /{([\w ]*?)}/
   ,   optionalFieldList =           /(?:{([\w ]*?)})?/
    

       //   foo or *                  
   ,   jsonPathNamedNodeInObjectNotation   = jsonPathClause( 
                                                possiblyCapturing, 
                                                namedNode, 
                                                optionalFieldList
                                             )
                                             
       //   ["foo"]   
   ,   jsonPathNamedNodeInArrayNotation    = jsonPathClause( 
                                                possiblyCapturing, 
                                                nodeInArrayNotation, 
                                                optionalFieldList
                                             )  

       //   [2] or [*]       
   ,   jsonPathNumberedNodeInArrayNotation = jsonPathClause( 
                                                possiblyCapturing, 
                                                numberedNodeInArrayNotation, 
                                                optionalFieldList
                                             )

       //   {a b c}      
   ,   jsonPathPureDuckTyping              = jsonPathClause( 
                                                possiblyCapturing, 
                                                namePlaceholder, 
                                                fieldList
                                             )
   
       //   ..
   ,   jsonPathDoubleDot                   = jsonPathClause(/\.\./)                  
   
       //   .
   ,   jsonPathDot                         = jsonPathClause(/\./)                    
   
       //   !
   ,   jsonPathBang                        = jsonPathClause(
                                                possiblyCapturing, 
                                                /!/
                                             )  
   
       //   nada!
   ,   emptyString                         = jsonPathClause(/$/)                     
   
   ;
   
  
   /* We export only a single function. When called, this function injects 
      into another function the descriptors from above.             
    */
   return function (fn){      
      return fn(      
         lazyUnion(
            jsonPathNamedNodeInObjectNotation
         ,  jsonPathNamedNodeInArrayNotation
         ,  jsonPathNumberedNodeInArrayNotation
         ,  jsonPathPureDuckTyping 
         )
      ,  jsonPathDoubleDot
      ,  jsonPathDot
      ,  jsonPathBang
      ,  emptyString 
      );
   }; 

}());
/**
 * Get a new key->node mapping
 * 
 * @param {String|Number} key
 * @param {Object|Array|String|Number|null} node a value found in the json
 */
function namedNode(key, node) {
   return {key:key, node:node};
}

/** get the key of a namedNode */
var keyOf = attr('key');

/** get the node from a namedNode */
var nodeOf = attr('node');
/** 
 * This file provides various listeners which can be used to build up
 * a changing ascent based on the callbacks provided by Clarinet. It listens
 * to the low-level events from Clarinet and emits higher-level ones.
 *  
 * The building up is stateless so to track a JSON file
 * ascentManager.js is required to store the ascent state
 * between calls.
 */



/** 
 * A special value to use in the path list to represent the path 'to' a root 
 * object (which doesn't really have any path). This prevents the need for 
 * special-casing detection of the root object and allows it to be treated 
 * like any other object. We might think of this as being similar to the 
 * 'unnamed root' domain ".", eg if I go to 
 * http://en.wikipedia.org./wiki/En/Main_page the dot after 'org' deliminates 
 * the unnamed root of the DNS.
 * 
 * This is kept as an object to take advantage that in Javascript's OO objects 
 * are guaranteed to be distinct, therefore no other object can possibly clash 
 * with this one. Strings, numbers etc provide no such guarantee. 
 **/
var ROOT_PATH = {};


/**
 * Create a new set of handlers for clarinet's events, bound to the emit 
 * function given.  
 */ 
function incrementalContentBuilder( oboeBus ) {

   var emitNodeOpened = oboeBus(NODE_OPENED).emit,
       emitNodeClosed = oboeBus(NODE_CLOSED).emit,
       emitRootOpened = oboeBus(ROOT_PATH_FOUND).emit,
       emitRootClosed = oboeBus(ROOT_NODE_FOUND).emit;

   function arrayIndicesAreKeys( possiblyInconsistentAscent, newDeepestNode) {
   
      /* for values in arrays we aren't pre-warned of the coming paths 
         (Clarinet gives no call to onkey like it does for values in objects) 
         so if we are in an array we need to create this path ourselves. The 
         key will be len(parentNode) because array keys are always sequential 
         numbers. */

      var parentNode = nodeOf( head( possiblyInconsistentAscent));
      
      return      isOfType( Array, parentNode)
               ?
                  keyFound(  possiblyInconsistentAscent, 
                              len(parentNode), 
                              newDeepestNode
                  )
               :  
                  // nothing needed, return unchanged
                  possiblyInconsistentAscent 
               ;
   }
                 
   function nodeOpened( ascent, newDeepestNode ) {
      
      if( !ascent ) {
         // we discovered the root node,         
         emitRootOpened( newDeepestNode);
                    
         return keyFound( ascent, ROOT_PATH, newDeepestNode);         
      }

      // we discovered a non-root node
                 
      var arrayConsistentAscent  = arrayIndicesAreKeys( ascent, newDeepestNode),      
          ancestorBranches       = tail( arrayConsistentAscent),
          previouslyUnmappedName = keyOf( head( arrayConsistentAscent));
          
      appendBuiltContent( 
         ancestorBranches, 
         previouslyUnmappedName, 
         newDeepestNode 
      );
                                                                                                         
      return cons( 
               namedNode( previouslyUnmappedName, newDeepestNode ), 
               ancestorBranches
      );                                                                          
   }


   /**
    * Add a new value to the object we are building up to represent the
    * parsed JSON
    */
   function appendBuiltContent( ancestorBranches, key, node ){
     
      nodeOf( head( ancestorBranches))[key] = node;
   }

     
   /**
    * For when we find a new key in the json.
    * 
    * @param {String|Number|Object} newDeepestName the key. If we are in an 
    *    array will be a number, otherwise a string. May take the special 
    *    value ROOT_PATH if the root node has just been found
    *    
    * @param {String|Number|Object|Array|Null|undefined} [maybeNewDeepestNode] 
    *    usually this won't be known so can be undefined. Can't use null 
    *    to represent unknown because null is a valid value in JSON
    **/  
   function keyFound(ascent, newDeepestName, maybeNewDeepestNode) {

      if( ascent ) { // if not root
      
         // If we have the key but (unless adding to an array) no known value
         // yet. Put that key in the output but against no defined value:      
         appendBuiltContent( ascent, newDeepestName, maybeNewDeepestNode );
      }
   
      var ascentWithNewPath = cons( 
                                 namedNode( newDeepestName, 
                                            maybeNewDeepestNode), 
                                 ascent
                              );

      emitNodeOpened( ascentWithNewPath);
 
      return ascentWithNewPath;
   }


   /**
    * For when the current node ends.
    */
   function nodeClosed( ascent ) {

      emitNodeClosed( ascent);
       
      return tail( ascent) ||
             // If there are no nodes left in the ascent the root node
             // just closed. Emit a special event for this: 
             emitRootClosed(nodeOf(head(ascent)));
   }      

   var contentBuilderHandlers = {};
   contentBuilderHandlers[SAX_VALUE_OPEN] = nodeOpened;
   contentBuilderHandlers[SAX_VALUE_CLOSE] = nodeClosed;
   contentBuilderHandlers[SAX_KEY] = keyFound;
   return contentBuilderHandlers;
}

/**
 * The jsonPath evaluator compiler used for Oboe.js. 
 * 
 * One function is exposed. This function takes a String JSONPath spec and 
 * returns a function to test candidate ascents for matches.
 * 
 *  String jsonPath -> (List ascent) -> Boolean|Object
 *
 * This file is coded in a pure functional style. That is, no function has 
 * side effects, every function evaluates to the same value for the same 
 * arguments and no variables are reassigned.
 */  
// the call to jsonPathSyntax injects the token syntaxes that are needed 
// inside the compiler
var jsonPathCompiler = jsonPathSyntax(function (pathNodeSyntax, 
                                                doubleDotSyntax, 
                                                dotSyntax,
                                                bangSyntax,
                                                emptySyntax ) {

   var CAPTURING_INDEX = 1;
   var NAME_INDEX = 2;
   var FIELD_LIST_INDEX = 3;

   var headKey  = compose2(keyOf, head),
       headNode = compose2(nodeOf, head);
                   
   /**
    * Create an evaluator function for a named path node, expressed in the
    * JSONPath like:
    *    foo
    *    ["bar"]
    *    [2]   
    */
   function nameClause(previousExpr, detection ) {
     
      var name = detection[NAME_INDEX],
            
          matchesName = ( !name || name == '*' ) 
                           ?  always
                           :  function(ascent){return headKey(ascent) == name};
     

      return lazyIntersection(matchesName, previousExpr);
   }

   /**
    * Create an evaluator function for a a duck-typed node, expressed like:
    * 
    *    {spin, taste, colour}
    *    .particle{spin, taste, colour}
    *    *{spin, taste, colour}
    */
   function duckTypeClause(previousExpr, detection) {

      var fieldListStr = detection[FIELD_LIST_INDEX];

      if (!fieldListStr) 
         return previousExpr; // don't wrap at all, return given expr as-is      

      var hasAllrequiredFields = partialComplete(
                                    hasAllProperties, 
                                    arrayAsList(fieldListStr.split(/\W+/))
                                 ),
                                 
          isMatch =  compose2( 
                        hasAllrequiredFields, 
                        headNode
                     );

      return lazyIntersection(isMatch, previousExpr);
   }

   /**
    * Expression for $, returns the evaluator function
    */
   function capture( previousExpr, detection ) {

      // extract meaning from the detection      
      var capturing = !!detection[CAPTURING_INDEX];

      if (!capturing)          
         return previousExpr; // don't wrap at all, return given expr as-is      
      
      return lazyIntersection(previousExpr, head);
            
   }            
      
   /**
    * Create an evaluator function that moves onto the next item on the 
    * lists. This function is the place where the logic to move up a 
    * level in the ascent exists. 
    * 
    * Eg, for JSONPath ".foo" we need skip1(nameClause(always, [,'foo']))
    */
   function skip1(previousExpr) {
   
   
      if( previousExpr == always ) {
         /* If there is no previous expression this consume command 
            is at the start of the jsonPath.
            Since JSONPath specifies what we'd like to find but not 
            necessarily everything leading down to it, when running
            out of JSONPath to check against we default to true */
         return always;
      }

      /** return true if the ascent we have contains only the JSON root,
       *  false otherwise
       */
      function notAtRoot(ascent){
         return headKey(ascent) != ROOT_PATH;
      }
      
      return lazyIntersection(
               /* If we're already at the root but there are more 
                  expressions to satisfy, can't consume any more. No match.

                  This check is why none of the other exprs have to be able 
                  to handle empty lists; skip1 is the only evaluator that 
                  moves onto the next token and it refuses to do so once it 
                  reaches the last item in the list. */
               notAtRoot,
               
               /* We are not at the root of the ascent yet.
                  Move to the next level of the ascent by handing only 
                  the tail to the previous expression */ 
               compose2(previousExpr, tail) 
      );
                                                                                                               
   }   
   
   /**
    * Create an evaluator function for the .. (double dot) token. Consumes
    * zero or more levels of the ascent, the fewest that are required to find
    * a match when given to previousExpr.
    */   
   function skipMany(previousExpr) {

      if( previousExpr == always ) {
         /* If there is no previous expression this consume command 
            is at the start of the jsonPath.
            Since JSONPath specifies what we'd like to find but not 
            necessarily everything leading down to it, when running
            out of JSONPath to check against we default to true */            
         return always;
      }
          
      var 
          // In JSONPath .. is equivalent to !.. so if .. reaches the root
          // the match has succeeded. Ie, we might write ..foo or !..foo
          // and both should match identically.
          terminalCaseWhenArrivingAtRoot = rootExpr(),
          terminalCaseWhenPreviousExpressionIsSatisfied = previousExpr,
          recursiveCase = skip1(function(ascent) {
             return cases(ascent);
          }),

          cases = lazyUnion(
                     terminalCaseWhenArrivingAtRoot
                  ,  terminalCaseWhenPreviousExpressionIsSatisfied
                  ,  recursiveCase  
                  );
      
      return cases;
   }      
   
   /**
    * Generate an evaluator for ! - matches only the root element of the json
    * and ignores any previous expressions since nothing may precede !. 
    */   
   function rootExpr() {
      
      return function(ascent){
         return headKey(ascent) == ROOT_PATH;
      };
   }   
         
   /**
    * Generate a statement wrapper to sit around the outermost 
    * clause evaluator.
    * 
    * Handles the case where the capturing is implicit because the JSONPath
    * did not contain a '$' by returning the last node.
    */   
   function statementExpr(lastClause) {
      
      return function(ascent) {
   
         // kick off the evaluation by passing through to the last clause
         var exprMatch = lastClause(ascent);
                                                     
         return exprMatch === true ? head(ascent) : exprMatch;
      };
   }      
                          
   /**
    * For when a token has been found in the JSONPath input.
    * Compiles the parser for that token and returns in combination with the
    * parser already generated.
    * 
    * @param {Function} exprs  a list of the clause evaluator generators for
    *                          the token that was found
    * @param {Function} parserGeneratedSoFar the parser already found
    * @param {Array} detection the match given by the regex engine when 
    *                          the feature was found
    */
   function expressionsReader( exprs, parserGeneratedSoFar, detection ) {
                     
      // if exprs is zero-length foldR will pass back the 
      // parserGeneratedSoFar as-is so we don't need to treat 
      // this as a special case
      
      return   foldR( 
                  function( parserGeneratedSoFar, expr ){
         
                     return expr(parserGeneratedSoFar, detection);
                  }, 
                  parserGeneratedSoFar, 
                  exprs
               );                     

   }

   /** 
    *  If jsonPath matches the given detector function, creates a function which
    *  evaluates against every clause in the clauseEvaluatorGenerators. The
    *  created function is propagated to the onSuccess function, along with
    *  the remaining unparsed JSONPath substring.
    *  
    *  The intended use is to create a clauseMatcher by filling in
    *  the first two arguments, thus providing a function that knows
    *  some syntax to match and what kind of generator to create if it
    *  finds it. The parameter list once completed is:
    *  
    *    (jsonPath, parserGeneratedSoFar, onSuccess)
    *  
    *  onSuccess may be compileJsonPathToFunction, to recursively continue 
    *  parsing after finding a match or returnFoundParser to stop here.
    */
   function generateClauseReaderIfTokenFound (
     
                        tokenDetector, clauseEvaluatorGenerators,
                         
                        jsonPath, parserGeneratedSoFar, onSuccess) {
                        
      var detected = tokenDetector(jsonPath);

      if(detected) {
         var compiledParser = expressionsReader(
                                 clauseEvaluatorGenerators, 
                                 parserGeneratedSoFar, 
                                 detected
                              ),
         
             remainingUnparsedJsonPath = jsonPath.substr(len(detected[0]));                
                               
         return onSuccess(remainingUnparsedJsonPath, compiledParser);
      }         
   }
                 
   /**
    * Partially completes generateClauseReaderIfTokenFound above. 
    */
   function clauseMatcher(tokenDetector, exprs) {
        
      return   partialComplete( 
                  generateClauseReaderIfTokenFound, 
                  tokenDetector, 
                  exprs 
               );
   }

   /**
    * clauseForJsonPath is a function which attempts to match against 
    * several clause matchers in order until one matches. If non match the
    * jsonPath expression is invalid and an error is thrown.
    * 
    * The parameter list is the same as a single clauseMatcher:
    * 
    *    (jsonPath, parserGeneratedSoFar, onSuccess)
    */     
   var clauseForJsonPath = lazyUnion(

      clauseMatcher(pathNodeSyntax   , list( capture, 
                                             duckTypeClause, 
                                             nameClause, 
                                             skip1 ))
                                                     
   ,  clauseMatcher(doubleDotSyntax  , list( skipMany))
       
       // dot is a separator only (like whitespace in other languages) but 
       // rather than make it a special case, use an empty list of 
       // expressions when this token is found
   ,  clauseMatcher(dotSyntax        , list() )  
                                                                                      
   ,  clauseMatcher(bangSyntax       , list( capture,
                                             rootExpr))
                                                          
   ,  clauseMatcher(emptySyntax      , list( statementExpr))
   
   ,  function (jsonPath) {
         throw Error('"' + jsonPath + '" could not be tokenised')      
      }
   );


   /**
    * One of two possible values for the onSuccess argument of 
    * generateClauseReaderIfTokenFound.
    * 
    * When this function is used, generateClauseReaderIfTokenFound simply 
    * returns the compiledParser that it made, regardless of if there is 
    * any remaining jsonPath to be compiled.
    */
   function returnFoundParser(_remainingJsonPath, compiledParser){ 
      return compiledParser 
   }     
              
   /**
    * Recursively compile a JSONPath expression.
    * 
    * This function serves as one of two possible values for the onSuccess 
    * argument of generateClauseReaderIfTokenFound, meaning continue to
    * recursively compile. Otherwise, returnFoundParser is given and
    * compilation terminates.
    */
   function compileJsonPathToFunction( uncompiledJsonPath, 
                                       parserGeneratedSoFar ) {

      /**
       * On finding a match, if there is remaining text to be compiled
       * we want to either continue parsing using a recursive call to 
       * compileJsonPathToFunction. Otherwise, we want to stop and return 
       * the parser that we have found so far.
       */
      var onFind =      uncompiledJsonPath
                     ?  compileJsonPathToFunction 
                     :  returnFoundParser;
                   
      return   clauseForJsonPath( 
                  uncompiledJsonPath, 
                  parserGeneratedSoFar, 
                  onFind
               );                              
   }

   /**
    * This is the function that we expose to the rest of the library.
    */
   return function(jsonPath){
        
      try {
         // Kick off the recursive parsing of the jsonPath 
         return compileJsonPathToFunction(jsonPath, always);
         
      } catch( e ) {
         throw Error( 'Could not compile "' + jsonPath + 
                      '" because ' + e.message
         );
      }
   }

});

/**
 * A pub/sub which is responsible for a single event type. A
 * multi-event type event bus is created by pubSub by collecting
 * several of these.
 *
 * @param {String} eventType
 *    the name of the events managed by this singleEventPubSub
 * @param {singleEventPubSub} [newListener]
 *    place to notify of new listeners
 * @param {singleEventPubSub} [removeListener]
 *    place to notify of when listeners are removed
 */
function singleEventPubSub(eventType, newListener, removeListener){

  /** we are optimised for emitting events over firing them.
   *  As well as the tuple list which stores event ids and
   *  listeners there is a list with just the listeners which
   *  can be iterated more quickly when we are emitting
   */
  var listenerTupleList,
      listenerList;

  function hasId(id){
    return function(tuple) {
      return tuple.id == id;
    };
  }

  return {

    /**
     * @param {Function} listener
     * @param {*} listenerId
     *    an id that this listener can later by removed by.
     *    Can be of any type, to be compared to other ids using ==
     */
    on:function( listener, listenerId ) {

      var tuple = {
        listener: listener
        ,  id:       listenerId || listener // when no id is given use the
        // listener function as the id
      };

      if( newListener ) {
        newListener.emit(eventType, listener, tuple.id);
      }

      listenerTupleList = cons( tuple,    listenerTupleList );
      listenerList      = cons( listener, listenerList      );

      return this; // chaining
    },

    emit:function () {
      applyEach( listenerList, arguments );
    },

    un: function( listenerId ) {

      var removed;

      listenerTupleList = without(
        listenerTupleList,
        hasId(listenerId),
        function(tuple){
          removed = tuple;
        }
      );

      if( removed ) {
        listenerList = without( listenerList, function(listener){
          return listener == removed.listener;
        });

        if( removeListener ) {
          removeListener.emit(eventType, removed.listener, removed.id);
        }
      }
    },

    listeners: function(){
      // differs from Node EventEmitter: returns list, not array
      return listenerList;
    },

    hasListener: function(listenerId){
      var test = listenerId? hasId(listenerId) : always;

      return defined(first( test, listenerTupleList));
    }
  };
}

/**
 * pubSub is a curried interface for listening to and emitting
 * events.
 *
 * If we get a bus:
 *
 *    var bus = pubSub();
 *
 * We can listen to event 'foo' like:
 *
 *    bus('foo').on(myCallback)
 *
 * And emit event foo like:
 *
 *    bus('foo').emit()
 *
 * or, with a parameter:
 *
 *    bus('foo').emit('bar')
 *
 * All functions can be cached and don't need to be
 * bound. Ie:
 *
 *    var fooEmitter = bus('foo').emit
 *    fooEmitter('bar');  // emit an event
 *    fooEmitter('baz');  // emit another
 *
 * There's also an uncurried[1] shortcut for .emit and .on:
 *
 *    bus.on('foo', callback)
 *    bus.emit('foo', 'bar')
 *
 * [1]: http://zvon.org/other/haskell/Outputprelude/uncurry_f.html
 */
function pubSub(){

   var singles = {},
       newListener = newSingle('newListener'),
       removeListener = newSingle('removeListener');

   function newSingle(eventName) {
      return singles[eventName] = singleEventPubSub(
         eventName,
         newListener,
         removeListener
      );
   }

   /** pubSub instances are functions */
   function pubSubInstance( eventName ){

      return singles[eventName] || newSingle( eventName );
   }

   // add convenience EventEmitter-style uncurried form of 'emit' and 'on'
   ['emit', 'on', 'un'].forEach(function(methodName){

      pubSubInstance[methodName] = varArgs(function(eventName, parameters){
         apply( parameters, pubSubInstance( eventName )[methodName]);
      });
   });

   return pubSubInstance;
}

/**
 * This file declares some constants to use as names for event types.
 */

var // the events which are never exported are kept as 
    // the smallest possible representation, in numbers:
    _S = 1,

    // fired whenever a new node starts in the JSON stream:
    NODE_OPENED     = _S++,

    // fired whenever a node closes in the JSON stream:
    NODE_CLOSED     = _S++,

    // called if a .node callback returns a value - 
    NODE_SWAP       = _S++,
    NODE_DROP       = _S++,

    FAIL_EVENT      = 'fail',
   
    ROOT_NODE_FOUND = _S++,
    ROOT_PATH_FOUND = _S++,
   
    HTTP_START      = 'start',
    STREAM_DATA     = 'data',
    STREAM_END      = 'end',
    ABORTING        = _S++,

    // SAX events butchered from Clarinet
    SAX_KEY          = _S++,
    SAX_VALUE_OPEN   = _S++,
    SAX_VALUE_CLOSE  = _S++;
    
function errorReport(statusCode, body, error) {
   try{
      var jsonBody = JSON.parse(body);
   }catch(e){}

   return {
      statusCode:statusCode,
      body:body,
      jsonBody:jsonBody,
      thrown:error
   };
}    

/** 
 *  The pattern adaptor listens for newListener and removeListener
 *  events. When patterns are added or removed it compiles the JSONPath
 *  and wires them up.
 *  
 *  When nodes and paths are found it emits the fully-qualified match 
 *  events with parameters ready to ship to the outside world
 */

function patternAdapter(oboeBus, jsonPathCompiler) {

   var predicateEventMap = {
      node:oboeBus(NODE_CLOSED)
   ,  path:oboeBus(NODE_OPENED)
   };
     
   function emitMatchingNode(emitMatch, node, ascent) {
         
      /* 
         We're now calling to the outside world where Lisp-style 
         lists will not be familiar. Convert to standard arrays. 
   
         Also, reverse the order because it is more common to 
         list paths "root to leaf" than "leaf to root"  */
      var descent     = reverseList(ascent);
                
      emitMatch(
         node,
         
         // To make a path, strip off the last item which is the special
         // ROOT_PATH token for the 'path' to the root node          
         listAsArray(tail(map(keyOf,descent))),  // path
         listAsArray(map(nodeOf, descent))       // ancestors    
      );         
   }

   /* 
    * Set up the catching of events such as NODE_CLOSED and NODE_OPENED and, if 
    * matching the specified pattern, propagate to pattern-match events such as 
    * oboeBus('node:!')
    * 
    * 
    * 
    * @param {Function} predicateEvent 
    *          either oboeBus(NODE_CLOSED) or oboeBus(NODE_OPENED).
    * @param {Function} compiledJsonPath          
    */
   function addUnderlyingListener( fullEventName, predicateEvent, compiledJsonPath ){
   
      var emitMatch = oboeBus(fullEventName).emit;
   
      predicateEvent.on( function (ascent) {

         var maybeMatchingMapping = compiledJsonPath(ascent);

         /* Possible values for maybeMatchingMapping are now:

          false: 
          we did not match 

          an object/array/string/number/null: 
          we matched and have the node that matched.
          Because nulls are valid json values this can be null.

          undefined:
          we matched but don't have the matching node yet.
          ie, we know there is an upcoming node that matches but we 
          can't say anything else about it. 
          */
         if (maybeMatchingMapping !== false) {

            emitMatchingNode(
               emitMatch, 
               nodeOf(maybeMatchingMapping), 
               ascent
            );
         }
      }, fullEventName);
     
      oboeBus('removeListener').on( function(removedEventName){

         // if the fully qualified match event listener is later removed, clean up 
         // by removing the underlying listener if it was the last using that pattern:
      
         if( removedEventName == fullEventName ) {
         
            if( !oboeBus(removedEventName).listeners(  )) {
               predicateEvent.un( fullEventName );
            }
         }
      });   
   }

   oboeBus('newListener').on( function(fullEventName){

      var match = /(node|path):(.*)/.exec(fullEventName);
      
      if( match ) {
         var predicateEvent = predicateEventMap[match[1]];
                    
         if( !predicateEvent.hasListener( fullEventName) ) {  
                  
            addUnderlyingListener(
               fullEventName,
               predicateEvent, 
               jsonPathCompiler( match[2] )
            );
         }
      }    
   })

}

/**
 * The instance API is the thing that is returned when oboe() is called.
 * it allows:
 *
 *    - listeners for various events to be added and removed
 *    - the http response header/headers to be read
 */
function instanceApi(oboeBus, contentSource){

  var oboeApi,
      fullyQualifiedNamePattern = /^(node|path):./,
      rootNodeFinishedEvent = oboeBus(ROOT_NODE_FOUND),
      emitNodeDrop = oboeBus(NODE_DROP).emit,
      emitNodeSwap = oboeBus(NODE_SWAP).emit,

      /**
       * Add any kind of listener that the instance api exposes
       */
      addListener = varArgs(function( eventId, parameters ){

        if( oboeApi[eventId] ) {

          // for events added as .on(event, callback), if there is a
          // .event() equivalent with special behaviour , pass through
          // to that:
          apply(parameters, oboeApi[eventId]);
        } else {

          // we have a standard Node.js EventEmitter 2-argument call.
          // The first parameter is the listener.
          var event = oboeBus(eventId),
              listener = parameters[0];

          if( fullyQualifiedNamePattern.test(eventId) ) {

            // allow fully-qualified node/path listeners
            // to be added
            addForgettableCallback(event, listener);
          } else  {

            // the event has no special handling, pass through
            // directly onto the event bus:
            event.on( listener);
          }
        }

        return oboeApi; // chaining
      }),

      /**
       * Remove any kind of listener that the instance api exposes
       */
      removeListener = function( eventId, p2, p3 ){

        if( eventId == 'done' ) {

          rootNodeFinishedEvent.un(p2);

        } else if( eventId == 'node' || eventId == 'path' ) {

          // allow removal of node and path
          oboeBus.un(eventId + ':' + p2, p3);
        } else {

          // we have a standard Node.js EventEmitter 2-argument call.
          // The second parameter is the listener. This may be a call
          // to remove a fully-qualified node/path listener but requires
          // no special handling
          var listener = p2;

          oboeBus(eventId).un(listener);
        }

        return oboeApi; // chaining
      };

  /**
   * Add a callback, wrapped in a try/catch so as to not break the
   * execution of Oboe if an exception is thrown (fail events are
   * fired instead)
   *
   * The callback is used as the listener id so that it can later be
   * removed using .un(callback)
   */
  function addProtectedCallback(eventName, callback) {
    oboeBus(eventName).on(protectedCallback(callback), callback);
    return oboeApi; // chaining
  }

  /**
   * Add a callback where, if .forget() is called during the callback's
   * execution, the callback will be de-registered
   */
  function addForgettableCallback(event, callback, listenerId) {

    // listenerId is optional and if not given, the original
    // callback will be used
    listenerId = listenerId || callback;

    var safeCallback = protectedCallback(callback);

    event.on( function() {

      var discard = false;

      oboeApi.forget = function(){
        discard = true;
      };

      apply( arguments, safeCallback );

      delete oboeApi.forget;

      if( discard ) {
        event.un(listenerId);
      }
    }, listenerId);

    return oboeApi; // chaining
  }

  /**
   *  wrap a callback so that if it throws, Oboe.js doesn't crash but instead
   *  throw the error in another event loop
   */
  function protectedCallback( callback ) {
    return function() {
      try{
        return callback.apply(oboeApi, arguments);
      }catch(e)  {
        setTimeout(function() {
          throw new Error(e.message);
        });
      }
    }
  }

  /**
   * Return the fully qualified event for when a pattern matches
   * either a node or a path
   *
   * @param type {String} either 'node' or 'path'
   */
  function fullyQualifiedPatternMatchEvent(type, pattern) {
    return oboeBus(type + ':' + pattern);
  }

  function wrapCallbackToSwapNodeIfSomethingReturned( callback ) {
    return function() {
      var returnValueFromCallback = callback.apply(this, arguments);

      if( defined(returnValueFromCallback) ) {

        if( returnValueFromCallback == oboe.drop ) {
          emitNodeDrop();
        } else {
          emitNodeSwap(returnValueFromCallback);
        }
      }
    }
  }

  function addSingleNodeOrPathListener(eventId, pattern, callback) {

    var effectiveCallback;

    if( eventId == 'node' ) {
      effectiveCallback = wrapCallbackToSwapNodeIfSomethingReturned(callback);
    } else {
      effectiveCallback = callback;
    }

    addForgettableCallback(
      fullyQualifiedPatternMatchEvent(eventId, pattern),
      effectiveCallback,
      callback
    );
  }

  /**
   * Add several listeners at a time, from a map
   */
  function addMultipleNodeOrPathListeners(eventId, listenerMap) {

    for( var pattern in listenerMap ) {
      addSingleNodeOrPathListener(eventId, pattern, listenerMap[pattern]);
    }
  }

  /**
   * implementation behind .onPath() and .onNode()
   */
  function addNodeOrPathListenerApi( eventId, jsonPathOrListenerMap, callback ){

    if( isString(jsonPathOrListenerMap) ) {
      addSingleNodeOrPathListener(eventId, jsonPathOrListenerMap, callback);

    } else {
      addMultipleNodeOrPathListeners(eventId, jsonPathOrListenerMap);
    }

    return oboeApi; // chaining
  }


  // some interface methods are only filled in after we receive
  // values and are noops before that:
  oboeBus(ROOT_PATH_FOUND).on( function(rootNode) {
    oboeApi.root = functor(rootNode);
  });

  /**
   * When content starts make the headers readable through the
   * instance API
   */
  oboeBus(HTTP_START).on( function(_statusCode, headers) {

    oboeApi.header =  function(name) {
      return name ? headers[name]
        : headers
      ;
    }
  });

  /**
   * Construct and return the public API of the Oboe instance to be
   * returned to the calling application
   */
  return oboeApi = {
    on             : addListener,
    addListener    : addListener,
    removeListener : removeListener,
    emit           : oboeBus.emit,

    node           : partialComplete(addNodeOrPathListenerApi, 'node'),
    path           : partialComplete(addNodeOrPathListenerApi, 'path'),

    done           : partialComplete(addForgettableCallback, rootNodeFinishedEvent),
    start          : partialComplete(addProtectedCallback, HTTP_START ),

    // fail doesn't use protectedCallback because
    // could lead to non-terminating loops
    fail           : oboeBus(FAIL_EVENT).on,

    // public api calling abort fires the ABORTING event
    abort          : oboeBus(ABORTING).emit,

    // initially return nothing for header and root
    header         : noop,
    root           : noop,

    source         : contentSource
  };
}

/**
 * This file sits just behind the API which is used to attain a new
 * Oboe instance. It creates the new components that are required
 * and introduces them to each other.
 */

function wire (httpMethodName, contentSource, body, headers, withCredentials){

   var oboeBus = pubSub();
   
   // Wire the input stream in if we are given a content source.
   // This will usually be the case. If not, the instance created
   // will have to be passed content from an external source.
  
   if( contentSource ) {

      streamingHttp( oboeBus,
                     httpTransport(), 
                     httpMethodName,
                     contentSource,
                     body,
                     headers,
                     withCredentials
      );
   }

   clarinet(oboeBus);

   ascentManager(oboeBus, incrementalContentBuilder(oboeBus));
      
   patternAdapter(oboeBus, jsonPathCompiler);      
      
   return instanceApi(oboeBus, contentSource);
}

function applyDefaults( passthrough, url, httpMethodName, body, headers, withCredentials, cached ){

   headers = headers ?
      // Shallow-clone the headers array. This allows it to be
      // modified without side effects to the caller. We don't
      // want to change objects that the user passes in.
      JSON.parse(JSON.stringify(headers))
      : {};

   if( body ) {
      if( !isString(body) ) {

         // If the body is not a string, stringify it. This allows objects to
         // be given which will be sent as JSON.
         body = JSON.stringify(body);

         // Default Content-Type to JSON unless given otherwise.
         headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      }
      headers['Content-Length'] = headers['Content-Length'] || body.length;
   } else {
      body = null;
   }

   // support cache busting like jQuery.ajax({cache:false})
   function modifiedUrl(baseUrl, cached) {

      if( cached === false ) {

         if( baseUrl.indexOf('?') == -1 ) {
            baseUrl += '?';
         } else {
            baseUrl += '&';
         }

         baseUrl += '_=' + new Date().getTime();
      }
      return baseUrl;
   }

   return passthrough( httpMethodName || 'GET', modifiedUrl(url, cached), body, headers, withCredentials || false );
}

// export public API
function oboe(arg1) {

   // We use duck-typing to detect if the parameter given is a stream, with the
   // below list of parameters.
   // Unpipe and unshift would normally be present on a stream but this breaks
   // compatibility with Request streams.
   // See https://github.com/jimhigson/oboe.js/issues/65
   
   var nodeStreamMethodNames = list('resume', 'pause', 'pipe'),
       isStream = partialComplete(
                     hasAllProperties
                  ,  nodeStreamMethodNames
                  );
   
   if( arg1 ) {
      if (isStream(arg1) || isString(arg1)) {

         //  simple version for GETs. Signature is:
         //    oboe( url )
         //  or, under node:
         //    oboe( readableStream )
         return applyDefaults(
            wire,
            arg1 // url
         );

      } else {

         // method signature is:
         //    oboe({method:m, url:u, body:b, headers:{...}})

         return applyDefaults(
            wire,
            arg1.url,
            arg1.method,
            arg1.body,
            arg1.headers,
            arg1.withCredentials,
            arg1.cached
         );
         
      }
   } else {
      // wire up a no-AJAX, no-stream Oboe. Will have to have content 
      // fed in externally and using .emit.
      return wire();
   }
}

/* oboe.drop is a special value. If a node callback returns this value the
   parsed node is deleted from the JSON
 */
oboe.drop = function() {
   return oboe.drop;
};


   if ( typeof define === "function" && define.amd ) {
      define( "oboe", [], function () { return oboe; } );
   } else if (true) {
      module.exports = oboe;
   } else {}
})((function(){
   // Access to the window object throws an exception in HTML5 web workers so
   // point it to "self" if it runs in a web worker
      try {
         return window;
      } catch (e) {
         return self;
      }
   }()), Object, Array, Error, JSON);


/***/ }),

/***/ 1379:
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
 * @file extend.js
 * @author Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2017
 */




var formatters = __webpack_require__(61).formatters;
var Method = __webpack_require__(183);
var utils = __webpack_require__(760);


var extend = function (pckg) {
    /* jshint maxcomplexity:5 */
    var ex = function (extension) {

        var extendedObject;
        if (extension.property) {
            if (!pckg[extension.property]) {
                pckg[extension.property] = {};
            }
            extendedObject = pckg[extension.property];
        } else {
            extendedObject = pckg;
        }

        if (extension.methods) {
            extension.methods.forEach(function (method) {
                if(!(method instanceof Method)) {
                    method = new Method(method);
                }

                method.attachToObject(extendedObject);
                method.setRequestManager(pckg._requestManager);
            });
        }

        return pckg;
    };

    ex.formatters = formatters;
    ex.utils = utils;
    ex.Method = Method;

    return ex;
};



module.exports = extend;



/***/ }),

/***/ 1380:
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
var utils = __webpack_require__(761);


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

/***/ 1385:
/***/ (function(module, exports, __webpack_require__) {

var v1 = __webpack_require__(1386);
var v4 = __webpack_require__(1387);

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;


/***/ }),

/***/ 1386:
/***/ (function(module, exports, __webpack_require__) {

var rng = __webpack_require__(763);
var bytesToUuid = __webpack_require__(764);

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

var _nodeId;
var _clockseq;

// Previous uuid creation time
var _lastMSecs = 0;
var _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189
  if (node == null || clockseq == null) {
    var seedBytes = rng();
    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [
        seedBytes[0] | 0x01,
        seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]
      ];
    }
    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  }

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;


/***/ }),

/***/ 1387:
/***/ (function(module, exports, __webpack_require__) {

var rng = __webpack_require__(763);
var bytesToUuid = __webpack_require__(764);

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;


/***/ }),

/***/ 759:
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
/** @file jsonrpc.js
 * @authors:
 *   Fabian Vogelsteller <fabian@ethereum.org>
 *   Marek Kotewicz <marek@ethdev.com>
 *   Aaron Kumavis <aaron@kumavis.me>
 * @date 2015
 */



// Initialize Jsonrpc as a simple object with utility functions.
var Jsonrpc = {
    messageId: 0
};

/**
 * Should be called to valid json create payload object
 *
 * @method toPayload
 * @param {Function} method of jsonrpc call, required
 * @param {Array} params, an array of method params, optional
 * @returns {Object} valid jsonrpc payload object
 */
Jsonrpc.toPayload = function (method, params) {
    if (!method) {
        throw new Error('JSONRPC method should be specified for params: "'+ JSON.stringify(params) +'"!');
    }

    // advance message ID
    Jsonrpc.messageId++;

    return {
        jsonrpc: '2.0',
        id: Jsonrpc.messageId,
        method: method,
        params: params || []
    };
};

/**
 * Should be called to check if jsonrpc response is valid
 *
 * @method isValidResponse
 * @param {Object}
 * @returns {Boolean} true if response is valid, otherwise false
 */
Jsonrpc.isValidResponse = function (response) {
    return Array.isArray(response) ? response.every(validateSingleMessage) : validateSingleMessage(response);

    function validateSingleMessage(message){
      return !!message &&
        !message.error &&
        message.jsonrpc === '2.0' &&
        (typeof message.id === 'number' || typeof message.id === 'string') &&
        message.result !== undefined; // only undefined is not valid json object
    }
};

/**
 * Should be called to create batch payload object
 *
 * @method toBatchPayload
 * @param {Array} messages, an array of objects with method (required) and params (optional) fields
 * @returns {Array} batch payload
 */
Jsonrpc.toBatchPayload = function (messages) {
    return messages.map(function (message) {
        return Jsonrpc.toPayload(message.method, message.params);
    });
};

module.exports = Jsonrpc;



/***/ }),

/***/ 760:
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
var utils = __webpack_require__(761);
var soliditySha3 = __webpack_require__(1380);
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

/***/ 761:
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

/***/ }),

/***/ 763:
/***/ (function(module, exports) {

// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto
// implementation. Also, find the complete implementation of crypto on IE11.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  module.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  module.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}


/***/ }),

/***/ 764:
/***/ (function(module, exports) {

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
  return ([bth[buf[i++]], bth[buf[i++]], 
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]],
	bth[buf[i++]], bth[buf[i++]],
	bth[buf[i++]], bth[buf[i++]]]).join('');
}

module.exports = bytesToUuid;


/***/ })

}]);