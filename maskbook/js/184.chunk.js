(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[184],{

/***/ 393:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "isEmptyWallets", function() { return /* reexport */ isEmptyWallets; });
__webpack_require__.d(__webpack_exports__, "getWallet", function() { return /* reexport */ getWallet; });
__webpack_require__.d(__webpack_exports__, "getWallets", function() { return /* reexport */ getWallets; });
__webpack_require__.d(__webpack_exports__, "updateExoticWalletFromSource", function() { return /* reexport */ updateExoticWalletFromSource; });
__webpack_require__.d(__webpack_exports__, "createNewWallet", function() { return /* reexport */ createNewWallet; });
__webpack_require__.d(__webpack_exports__, "importNewWallet", function() { return /* reexport */ importNewWallet; });
__webpack_require__.d(__webpack_exports__, "importFirstWallet", function() { return /* reexport */ importFirstWallet; });
__webpack_require__.d(__webpack_exports__, "renameWallet", function() { return /* reexport */ renameWallet; });
__webpack_require__.d(__webpack_exports__, "removeWallet", function() { return /* reexport */ removeWallet; });
__webpack_require__.d(__webpack_exports__, "recoverWallet", function() { return /* reexport */ recoverWallet; });
__webpack_require__.d(__webpack_exports__, "recoverWalletFromPrivateKey", function() { return /* reexport */ recoverWalletFromPrivateKey; });
__webpack_require__.d(__webpack_exports__, "getERC20Tokens", function() { return /* reexport */ getERC20Tokens; });
__webpack_require__.d(__webpack_exports__, "addERC20Token", function() { return /* reexport */ addERC20Token; });
__webpack_require__.d(__webpack_exports__, "removeERC20Token", function() { return /* reexport */ removeERC20Token; });
__webpack_require__.d(__webpack_exports__, "trustERC20Token", function() { return /* reexport */ trustERC20Token; });
__webpack_require__.d(__webpack_exports__, "blockERC20Token", function() { return /* reexport */ blockERC20Token; });

// EXTERNAL MODULE: ./node_modules/bip39/src/index.js
var src = __webpack_require__(231);

// EXTERNAL MODULE: ./node_modules/wallet.ts/dist/index.js
var dist = __webpack_require__(120);

// EXTERNAL MODULE: ./node_modules/bignumber.js/bignumber.js
var bignumber = __webpack_require__(27);

// EXTERNAL MODULE: ./node_modules/elliptic/lib/elliptic.js
var elliptic = __webpack_require__(133);

// EXTERNAL MODULE: ./packages/maskbook/src/database/helpers/openDB.ts
var openDB = __webpack_require__(66);

// EXTERNAL MODULE: ./node_modules/idb/with-async-ittr-cjs.js
var with_async_ittr_cjs = __webpack_require__(179);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/side-effects.ts
var side_effects = __webpack_require__(147);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/RedPacket/constants.ts
var constants = __webpack_require__(96);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/RedPacket/database.ts
var database = __webpack_require__(645);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Wallet/database/migrate.plugins.ts




async function migratePluginDatabase() {
    const ro_db = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readonly')('PluginStore');
    const data = await ro_db.objectStore('PluginStore').getAll();
    // Don't mix two transactions
    for (const i of data) {
        if (i.plugin_id === constants["i" /* RedPacketPluginID */]) {
            const rec = i.value;
            await database["a" /* RedPacketDatabase */].add({ ...rec, type: 'red-packet' });
        }
    }
    const rw_db = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readwrite')('PluginStore');
    rw_db.objectStore('PluginStore').clear();
}

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Wallet/formatter.ts
var formatter = __webpack_require__(29);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/types.ts
var types = __webpack_require__(3);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Wallet/database/Wallet.db.ts






function path(x) {
    return x;
}
const createWalletDBAccess = Object(openDB["a" /* createDBAccess */])(() => {
    return Object(with_async_ittr_cjs["openDB"])('maskbook-plugin-wallet', 5, {
        async upgrade(db, oldVersion, newVersion, tx) {
            function v0_v1() {
                // @ts-expect-error
                db.createObjectStore('RedPacket', { keyPath: path('id') });
                db.createObjectStore('ERC20Token', { keyPath: path('address') });
                db.createObjectStore('Wallet', { keyPath: path('address') });
            }
            function v1_v2() {
                // @ts-expect-error
                db.createObjectStore('GitcoinDonation', { keyPath: 'donation_transaction_hash' });
            }
            /**
             * The following store has been removed from v3
             * GitcoinDonation: { % data dropped % }
             * RedPacket: {
             *     value: RedPacketRecordInDatabase
             *     key: string
             *     indexes: {
             *         red_packet_id: string
             *     }
             * }
             */
            async function v2_v3() {
                const os = db.createObjectStore('PluginStore', { keyPath: 'record_id' });
                // @ts-ignore
                os.createIndex('0', 'index0');
                // @ts-ignore
                os.createIndex('1', 'index1');
                // @ts-ignore
                os.createIndex('2', 'index2');
                os.createIndex('plugin_id', 'plugin_id');
                // @ts-ignore
                db.deleteObjectStore('GitcoinDonation');
                // @ts-ignore
                db.deleteObjectStore('RedPacket');
            }
            /**
             * Use checksummed address in DB
             */
            async function v3_v4() {
                const t = Object(openDB["c" /* createTransaction */])(db, 'readwrite')('Wallet', 'ERC20Token');
                const wallets = t.objectStore('Wallet');
                const tokens = t.objectStore('ERC20Token');
                for await (const wallet of wallets) {
                    // update address
                    wallet.value.address = Object(formatter["b" /* formatChecksumAddress */])(wallet.value.address);
                    [wallet.value.erc20_token_blacklist, wallet.value.erc20_token_whitelist].forEach((set) => {
                        const values = Array.from(set.values());
                        set.clear();
                        values.forEach((value) => set.add(Object(formatter["b" /* formatChecksumAddress */])(value)));
                    });
                    await wallet.update(wallet.value);
                }
                for await (const token of tokens) {
                    token.value.address = Object(formatter["b" /* formatChecksumAddress */])(token.value.address);
                    await token.update(token.value);
                }
            }
            /**
             * Fix providerType does not exist in legacy wallet
             */
            async function v4_v5() {
                const t = Object(openDB["c" /* createTransaction */])(db, 'readwrite')('Wallet');
                const wallets = t.objectStore('Wallet');
                for await (const wallet of wallets) {
                    const wallet_ = wallet;
                    if (wallet_.value.provider)
                        continue;
                    if (wallet_.value.type === 'managed')
                        wallet_.value.provider = types["d" /* ProviderType */].Maskbook;
                    else if (wallet_.value.type === 'exotic')
                        wallet_.value.provider = types["d" /* ProviderType */].MetaMask;
                    await wallet.update(wallet_.value);
                }
            }
            if (oldVersion < 1)
                v0_v1();
            if (oldVersion < 2)
                v1_v2();
            if (oldVersion < 3)
                await v2_v3();
            if (oldVersion < 4)
                await v3_v4();
            if (oldVersion < 5)
                await v4_v5();
        },
    });
});
side_effects["a" /* sideEffect */].then(migratePluginDatabase);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Wallet/messages.ts
var messages = __webpack_require__(32);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/utils.ts
var utils = __webpack_require__(12);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/pipes.ts
var pipes = __webpack_require__(84);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Wallet/services/helpers.ts



async function getWalletByAddress(t, address) {
    const record = await t.objectStore('Wallet').get(Object(formatter["b" /* formatChecksumAddress */])(address));
    return record ? WalletRecordOutDB(record) : null;
}
function WalletRecordIntoDB(x) {
    const record = x;
    record.address = Object(formatter["b" /* formatChecksumAddress */])(x.address);
    return record;
}
function WalletRecordOutDB(x) {
    var _a, _b;
    const record = x;
    record.address = Object(formatter["b" /* formatChecksumAddress */])(record.address);
    record.erc20_token_whitelist = (_a = x.erc20_token_whitelist) !== null && _a !== void 0 ? _a : new Set();
    record.erc20_token_blacklist = (_b = x.erc20_token_blacklist) !== null && _b !== void 0 ? _b : new Set();
    return record;
}
function ERC20TokenRecordIntoDB(x) {
    x.address = Object(formatter["b" /* formatChecksumAddress */])(x.address);
    return x;
}
function ERC20TokenRecordOutDB(x) {
    var _a;
    const record = x;
    {
        // fix: network has been renamed to chainId
        const record_ = record;
        if (!record.chainId)
            record.chainId = (_a = Object(pipes["b" /* resolveChainId */])(record_.network)) !== null && _a !== void 0 ? _a : types["a" /* ChainId */].Mainnet;
    }
    record.address = Object(formatter["b" /* formatChecksumAddress */])(record.address);
    return record;
}

// EXTERNAL MODULE: ./packages/maskbook/src/web3/helpers.ts
var helpers = __webpack_require__(28);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Wallet/settings.ts
var settings = __webpack_require__(101);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Wallet/services/wallet.ts














// Private key at m/44'/coinType'/account'/change/addressIndex
// coinType = ether
const wallet_path = "m/44'/60'/0'/0/0";
function sortWallet(a, b) {
    const address = settings["b" /* currentSelectedWalletAddressSettings */].value;
    if (a.address === address)
        return -1;
    if (b.address === address)
        return 1;
    if (a.updatedAt > b.updatedAt)
        return -1;
    if (a.updatedAt < b.updatedAt)
        return 1;
    if (a.createdAt > b.createdAt)
        return -1;
    if (a.createdAt < b.createdAt)
        return 1;
    return 0;
}
async function isEmptyWallets() {
    const t = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readonly')('Wallet');
    const count = await t.objectStore('Wallet').count();
    return count === 0;
}
async function getWallet(address = settings["b" /* currentSelectedWalletAddressSettings */].value) {
    const wallets = await getWallets();
    return wallets.find((x) => Object(helpers["j" /* isSameAddress */])(x.address, address));
}
async function getWallets(provider) {
    const t = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readonly')('Wallet');
    const records = await t.objectStore('Wallet').getAll();
    const wallets = (await Promise.all(records.map(async (record) => {
        const walletRecord = WalletRecordOutDB(record);
        return {
            ...walletRecord,
            _private_key_: await makePrivateKey(walletRecord),
        };
    }))).sort(sortWallet);
    if (provider === types["d" /* ProviderType */].Maskbook)
        return wallets.filter((x) => x._private_key_ || x.mnemonic.length);
    if (provider === settings["c" /* currentSelectedWalletProviderSettings */].value)
        return wallets.filter((x) => Object(helpers["j" /* isSameAddress */])(x.address, settings["b" /* currentSelectedWalletAddressSettings */].value));
    if (provider)
        return [];
    return wallets;
    async function makePrivateKey(record) {
        // not a managed wallet
        if (!record._private_key_ && !record.mnemonic.length)
            return '';
        const { privateKey } = record._private_key_
            ? await recoverWalletFromPrivateKey(record._private_key_)
            : await recoverWallet(record.mnemonic, record.passphrase);
        return `0x${Object(utils["d" /* buf2hex */])(privateKey)}`;
    }
}
async function updateExoticWalletFromSource(provider, updates) {
    const walletStore = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readwrite')('Wallet').objectStore('Wallet');
    let modified = false;
    for await (const cursor of walletStore) {
        const wallet = cursor.value;
        {
            if (updates.has(Object(formatter["b" /* formatChecksumAddress */])(wallet.address))) {
                await cursor.update(WalletRecordIntoDB({
                    ...WalletRecordOutDB(cursor.value),
                    ...updates.get(wallet.address),
                    updatedAt: new Date(),
                }));
            }
            modified = true;
        }
    }
    for (const address of updates.keys()) {
        const wallet = await walletStore.get(Object(formatter["b" /* formatChecksumAddress */])(address));
        if (wallet)
            continue;
        await walletStore.put(WalletRecordIntoDB({
            address,
            createdAt: new Date(),
            updatedAt: new Date(),
            erc20_token_blacklist: new Set(),
            erc20_token_whitelist: new Set(),
            name: Object(pipes["e" /* resolveProviderName */])(provider),
            passphrase: '',
            mnemonic: [],
            ...updates.get(address),
        }));
        modified = true;
    }
    if (modified)
        messages["a" /* WalletMessages */].events.walletsUpdated.sendToAll(undefined);
}
function createNewWallet(rec) {
    const mnemonic = src["generateMnemonic"]().split(' ');
    return importNewWallet({ mnemonic, ...rec });
}
async function importNewWallet(rec) {
    const { name, mnemonic = [], passphrase = '' } = rec;
    const address = await getWalletAddress();
    if (!address)
        throw new Error('cannot get the wallet address');
    if (rec.name === null)
        rec.name = address.slice(0, 6);
    const record = {
        name,
        mnemonic,
        passphrase,
        address,
        erc20_token_whitelist: new Set(),
        erc20_token_blacklist: new Set(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    if (rec._private_key_)
        record._private_key_ = rec._private_key_;
    {
        const t = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readwrite')('Wallet', 'ERC20Token');
        t.objectStore('Wallet').add(WalletRecordIntoDB(record));
    }
    messages["a" /* WalletMessages */].events.walletsUpdated.sendToAll(undefined);
    return address;
    async function getWalletAddress() {
        if (rec.address)
            return rec.address;
        if (rec._private_key_) {
            const recover = await recoverWalletFromPrivateKey(rec._private_key_);
            return recover.privateKeyValid ? recover.address : '';
        }
        return (await recoverWallet(mnemonic, passphrase)).address;
    }
}
async function importFirstWallet(rec) {
    if (await isEmptyWallets())
        return importNewWallet(rec);
    return;
}
async function renameWallet(address, name) {
    const t = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readwrite')('Wallet');
    const wallet = await getWalletByAddress(t, Object(formatter["b" /* formatChecksumAddress */])(address));
    Object(utils["b" /* assert */])(wallet);
    wallet.name = name;
    wallet.updatedAt = new Date();
    t.objectStore('Wallet').put(WalletRecordIntoDB(wallet));
    messages["a" /* WalletMessages */].events.walletsUpdated.sendToAll(undefined);
}
async function removeWallet(address) {
    const t = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readwrite')('Wallet');
    const wallet = await getWalletByAddress(t, Object(formatter["b" /* formatChecksumAddress */])(address));
    if (!wallet)
        return;
    t.objectStore('Wallet').delete(wallet.address);
    messages["a" /* WalletMessages */].events.walletsUpdated.sendToAll(undefined);
}
async function recoverWallet(mnemonic, password) {
    const seed = await src["mnemonicToSeed"](mnemonic.join(' '), password);
    const masterKey = dist["HDKey"].parseMasterSeed(seed);
    const extendedPrivateKey = masterKey.derive(wallet_path).extendedPrivateKey;
    const childKey = dist["HDKey"].parseExtendedKey(extendedPrivateKey);
    const wallet = childKey.derive('');
    const walletPublicKey = wallet.publicKey;
    const walletPrivateKey = wallet.privateKey;
    return {
        address: dist["EthereumAddress"].from(walletPublicKey).address,
        privateKey: walletPrivateKey,
        privateKeyValid: true,
        privateKeyInHex: `0x${Object(utils["d" /* buf2hex */])(walletPrivateKey)}`,
        mnemonic,
    };
}
async function recoverWalletFromPrivateKey(privateKey) {
    const ec = new elliptic["ec"]('secp256k1');
    const privateKey_ = privateKey.replace(/^0x/, ''); // strip 0x
    const key = ec.keyFromPrivate(privateKey_);
    return {
        address: dist["EthereumAddress"].from(key.getPublic(false, 'array')).address,
        privateKey: Object(utils["j" /* hex2buf */])(privateKey_),
        privateKeyValid: privateKeyVerify(privateKey_),
        privateKeyInHex: privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
        mnemonic: [],
    };
    function privateKeyVerify(key) {
        if (!/[0-9a-f]{64}/i.test(key))
            return false;
        const k = new bignumber["BigNumber"](key, 16);
        const n = new bignumber["BigNumber"]('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 16);
        return !k.isZero() && k.isLessThan(n);
    }
}

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Wallet/services/token.ts






async function getERC20Tokens() {
    const t = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readonly')('ERC20Token', 'Wallet');
    return t.objectStore('ERC20Token').getAll();
}
async function addERC20Token(token) {
    var _a, _b, _c;
    const t = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readwrite')('ERC20Token', 'Wallet');
    await t.objectStore('ERC20Token').put(ERC20TokenRecordIntoDB({
        ...token,
        name: (_a = token.name) !== null && _a !== void 0 ? _a : '',
        symbol: (_b = token.symbol) !== null && _b !== void 0 ? _b : '',
        decimals: (_c = token.decimals) !== null && _c !== void 0 ? _c : 0,
    }));
    messages["a" /* WalletMessages */].events.tokensUpdated.sendToAll(undefined);
}
async function removeERC20Token(token) {
    const t = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readwrite')('ERC20Token', 'Wallet');
    await t.objectStore('ERC20Token').delete(Object(formatter["b" /* formatChecksumAddress */])(token.address));
    messages["a" /* WalletMessages */].events.tokensUpdated.sendToAll(undefined);
}
async function trustERC20Token(address, token) {
    const t = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readwrite')('ERC20Token', 'Wallet');
    const wallet = await getWalletByAddress(t, Object(formatter["b" /* formatChecksumAddress */])(address));
    Object(utils["b" /* assert */])(wallet);
    const tokenAddressChecksummed = Object(formatter["b" /* formatChecksumAddress */])(token.address);
    let updated = false;
    if (!wallet.erc20_token_whitelist.has(tokenAddressChecksummed)) {
        wallet.erc20_token_whitelist.add(tokenAddressChecksummed);
        updated = true;
    }
    if (wallet.erc20_token_blacklist.has(tokenAddressChecksummed)) {
        wallet.erc20_token_blacklist.delete(tokenAddressChecksummed);
        updated = true;
    }
    if (!updated)
        return;
    await t.objectStore('Wallet').put(WalletRecordIntoDB(wallet));
    messages["a" /* WalletMessages */].events.walletsUpdated.sendToAll(undefined);
}
async function blockERC20Token(address, token) {
    const t = Object(openDB["c" /* createTransaction */])(await createWalletDBAccess(), 'readwrite')('ERC20Token', 'Wallet');
    const wallet = await getWalletByAddress(t, Object(formatter["b" /* formatChecksumAddress */])(address));
    Object(utils["b" /* assert */])(wallet);
    let updated = false;
    const tokenAddressChecksummed = Object(formatter["b" /* formatChecksumAddress */])(token.address);
    if (wallet.erc20_token_whitelist.has(tokenAddressChecksummed)) {
        wallet.erc20_token_whitelist.delete(tokenAddressChecksummed);
        updated = true;
    }
    if (!wallet.erc20_token_blacklist.has(tokenAddressChecksummed)) {
        wallet.erc20_token_blacklist.add(tokenAddressChecksummed);
        updated = true;
    }
    if (!updated)
        return;
    await t.objectStore('Wallet').put(WalletRecordIntoDB(wallet));
    messages["a" /* WalletMessages */].events.walletsUpdated.sendToAll(undefined);
}

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Wallet/services/index.ts




/***/ }),

/***/ 644:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ createPluginDatabase; });

// EXTERNAL MODULE: ./node_modules/idb/with-async-ittr-cjs.js
var with_async_ittr_cjs = __webpack_require__(179);

// EXTERNAL MODULE: ./packages/maskbook/src/database/helpers/openDB.ts
var openDB = __webpack_require__(66);

// CONCATENATED MODULE: ./packages/maskbook/src/database/Plugin/index.ts
/// <reference path="../global.d.ts" />


//#endregion
const Plugin_db = Object(openDB["a" /* createDBAccess */])(() => {
    return Object(with_async_ittr_cjs["openDB"])('maskbook-plugin-data', 2, {
        async upgrade(db, oldVersion, newVersion, transaction) {
            if (oldVersion < 1)
                db.createObjectStore('PluginStore');
            if (oldVersion < 2) {
                const data = await transaction.objectStore('PluginStore').getAll();
                db.deleteObjectStore('PluginStore');
                const os = db.createObjectStore('PluginStore', { keyPath: ['plugin_id', 'value.type', 'value.id'] });
                // a compound index by "rec.plugin_id" + "rec.value.type"
                os.createIndex('type', ['plugin_id', 'value.type']);
                for (const each of data) {
                    if (!each.plugin_id)
                        continue;
                    if (!pluginDataHasValidKeyPath(each.value))
                        continue;
                    Reflect.deleteProperty(each, 'type');
                    Reflect.deleteProperty(each, 'record_id');
                    await os.add(each);
                }
            }
        },
    });
});
// cause key path error in "add" will cause transaction fail, we need to check them first
function pluginDataHasValidKeyPath(value) {
    try {
        if (typeof value !== 'object' || value === null)
            return false;
        const id = Reflect.get(value, 'id');
        const type = Reflect.get(value, 'type');
        if (typeof id !== 'string' && typeof id !== 'number')
            return false;
        if (typeof type !== 'string' && typeof type !== 'number')
            return false;
        return true;
    }
    catch {
        return false;
    }
}
const createPluginDBAccess = Plugin_db;
function toStore(plugin_id, value) {
    return { plugin_id, value };
}

// CONCATENATED MODULE: ./packages/maskbook/src/database/Plugin/wrap-plugin-database.ts

function createPluginDatabase(plugin_id) {
    let livingTransaction = undefined;
    function key(data) {
        return IDBKeyRange.only([plugin_id, data.type, data.id]);
    }
    return {
        // Please keep the API minimal
        /**
         * Query an object from the database
         * @param type "type" field on the object
         * @param id "id" field on the object
         */
        async get(type, id) {
            const t = await c('r');
            const data = await t.store.get(key({ type, id }));
            if (!data)
                return undefined;
            return data.value;
        },
        /**
         * Store a data into the database.
         * @param data Must be an object with "type" and "id"
         */
        async add(data) {
            const t = await c('rw');
            if (!pluginDataHasValidKeyPath(data))
                throw new TypeError("Data doesn't have a valid key path");
            if (await t.store.get(key(data)))
                await t.store.put(toStore(plugin_id, data));
            else
                await t.store.add(toStore(plugin_id, data));
        },
        /**
         * Remove an object from the database
         * @param type "type" field on the object
         * @param id "id" field on the object
         */
        async remove(type, id) {
            return (await c('rw')).store.delete(key({ type, id }));
        },
        /**
         * Iterate over the database of given type (readonly!)
         *
         * !!! During the iterate, you MUST NOT do anything that writes to the store (use iterate_mutate instead)
         * !!! You MUST NOT do anything asynchronous before the iterate ends
         *
         * !!! Otherwise the transaction will be inactivate
         * @param type "type" field on the object
         */
        async *iterate(type) {
            const db = await c('r');
            const cursor = await db
                .objectStore('PluginStore')
                .index('type')
                .openCursor(IDBKeyRange.only([plugin_id, type]));
            if (!cursor)
                return;
            for await (const each of cursor) {
                yield each.value.value;
            }
        },
        /**
         * Iterate over the database of given type (read-write).
         *
         * !!! You MUST NOT do anything asynchronous before the iterate ends
         *
         * !!! Otherwise the transaction will be inactivate
         * @param type "type" field on the object
         */
        async *iterate_mutate(type) {
            const cursor = await (await c('rw'))
                .objectStore('PluginStore')
                .index('type')
                .openCursor(IDBKeyRange.only([plugin_id, type]));
            if (!cursor)
                return;
            for await (const each of cursor) {
                yield {
                    data: each.value.value,
                    delete: () => each.delete(),
                    update: (data) => each.update(toStore(plugin_id, data)),
                };
            }
        },
    };
    async function c(usage) {
        if (usage === 'rw' && (livingTransaction === null || livingTransaction === void 0 ? void 0 : livingTransaction.mode) === 'readonly')
            invalidateTransaction();
        try {
            await (livingTransaction === null || livingTransaction === void 0 ? void 0 : livingTransaction.store.openCursor());
        }
        catch {
            invalidateTransaction();
        }
        if (livingTransaction === undefined) {
            const db = await createPluginDBAccess();
            const tx = db.transaction('PluginStore', usage === 'r' ? 'readonly' : 'readwrite');
            livingTransaction = tx;
            // Oops, workaround for https://bugs.webkit.org/show_bug.cgi?id=216769 or https://github.com/jakearchibald/idb/issues/201
            try {
                await tx.store.openCursor();
            }
            catch {
                livingTransaction = db.transaction('PluginStore', usage === 'r' ? 'readonly' : 'readwrite');
                return livingTransaction;
            }
            return tx;
        }
        return livingTransaction;
    }
    function invalidateTransaction() {
        livingTransaction = undefined;
    }
}


/***/ }),

/***/ 645:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return RedPacketDatabase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return getRedPackets; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return getRedPacket; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return addRedPacket; });
/* unused harmony export removeRedPacket */
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(96);
/* harmony import */ var _database_Plugin_wrap_plugin_database__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(644);
/* harmony import */ var _utils_type_transform_asyncIteratorHelpers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(450);
/* harmony import */ var lodash_es__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(13);
/* harmony import */ var lodash_es__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(lodash_es__WEBPACK_IMPORTED_MODULE_3__);




const RedPacketDatabase = Object(_database_Plugin_wrap_plugin_database__WEBPACK_IMPORTED_MODULE_1__[/* createPluginDatabase */ "a"])(_constants__WEBPACK_IMPORTED_MODULE_0__[/* RedPacketPluginID */ "i"]);
function getRedPackets() {
    return Object(_utils_type_transform_asyncIteratorHelpers__WEBPACK_IMPORTED_MODULE_2__[/* asyncIteratorToArray */ "a"])(RedPacketDatabase.iterate('red-packet'));
}
async function getRedPacket(rpid) {
    const record = await RedPacketDatabase.get('red-packet', rpid);
    return record ? RedPacketRecordOutDB(record) : undefined;
}
function addRedPacket(record) {
    return RedPacketDatabase.add(RedPacketRecordIntoDB(record));
}
function removeRedPacket(rpid) {
    return RedPacketDatabase.remove('red-packet', rpid);
}
function RedPacketRecordIntoDB(x) {
    const record = x;
    record.type = 'red-packet';
    return record;
}
function RedPacketRecordOutDB(x) {
    const record = x;
    return Object(lodash_es__WEBPACK_IMPORTED_MODULE_3__["omit"])(record, ['type']);
}


/***/ }),

/***/ 66:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return createDBAccess; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return createDBAccessWithAsyncUpgrade; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return createTransaction; });
/* harmony import */ var _dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);

function createDBAccess(opener) {
    let db = undefined;
    return async () => {
        Object(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* assertEnvironment */ "d"])(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* Environment */ "a"].ManifestBackground);
        if (db)
            return db;
        db = await opener();
        db.addEventListener('close', () => (db = undefined));
        db.addEventListener('error', () => (db = undefined));
        return db;
    };
}
function createDBAccessWithAsyncUpgrade(firstVersionThatRequiresAsyncUpgrade, latestVersion, opener, asyncUpgradePrepare) {
    let db = undefined;
    let pendingOpen = undefined;
    async function open() {
        Object(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* assertEnvironment */ "d"])(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* Environment */ "a"].ManifestBackground);
        if ((db === null || db === void 0 ? void 0 : db.version) === latestVersion)
            return db;
        let currentVersion = firstVersionThatRequiresAsyncUpgrade;
        let lastVersionData = undefined;
        while (currentVersion < latestVersion) {
            try {
                db = await opener(currentVersion, lastVersionData);
                // if the open success, the stored version is small or eq than currentTryOpenVersion
                // let's call the prepare function to do all the async jobs
                lastVersionData = await asyncUpgradePrepare(db);
            }
            catch (e) {
                if (currentVersion >= latestVersion)
                    throw e;
                // if the stored database version is bigger than the currentTryOpenVersion
                // It will fail and we just move to next version
            }
            currentVersion += 1;
            db === null || db === void 0 ? void 0 : db.close();
            db = undefined;
        }
        db = await opener(currentVersion, lastVersionData);
        db.addEventListener('close', (e) => (db = undefined));
        if (!db)
            throw new Error('Invalid state');
        return db;
    }
    return () => {
        // Share a Promise to prevent async upgrade for multiple times
        if (pendingOpen)
            return pendingOpen;
        const promise = (pendingOpen = open());
        promise.catch(() => (pendingOpen = undefined));
        return promise;
    };
}
function createTransaction(db, mode) {
    // It must be a high order function to infer the type of UsedStoreName correctly.
    return (...storeNames) => {
        return db.transaction(storeNames, mode);
    };
}


/***/ })

}]);