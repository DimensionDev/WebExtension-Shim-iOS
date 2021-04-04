(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[164],{

/***/ 1870:
/***/ (function(module) {

module.exports = JSON.parse("{\"kty\":\"RSA\",\"n\":\"qajRPsPmNXRt3L5QYk5h62E_LzsuqjsMtjVAjaC2IsMFekiIM1n1oscwJofvEhqCL6Yd9N55xySdzg5_VjBVaxxfCSsPsXVnsHGZDjJR0hOEMe6M-eA-dfxYqqUInNcJiuQBgO-ik2VCo92e6b2H6MozNWIlSmPZefjPWAUB3-Wm0LMPSX-GJiz5m0yS0-1cvtChGzQC38O174G0DfHyFjEmvO0DS4HnOH3htkz_9u96qtily0odFiru6vNuD8aGyfWqaJX52MLiw3zPUihlNnT6z4iw0eh0aKjjnZJV0IkV9042Eu2503KaTi-jfAnwZknB1rGdZziyFJzfD2kSLiPJT9J_YCQGcXqlhZHaq_Iw3PzPziw-rSRr--701HpFjwq41XVhCYdVkzo5OsTbOzgzriCPJuiGZkhrzIOcm2p5U4SLwphc0zBpkkWDj72CKMG2UK_z4GjiGO51VVCxxaKAA-w4z1Ba_LKV5QMnxXE3FiuB6gQW9xNl-K0zaPJbLgIciLV1v2UKWHjjwWacShVRfdrKoKIHbMs9prlO7NyLDhfeBh67i-TfGLtcxgd6Y0v9KqB6j3qFtIvkT4dJL8NCEfOCczS0Mp6K8O0Wy-4r9OU8Q7xjnG2CZ9gh5rF3pKhU3iLYlP8FS4voeNi6ANVJSmOI4qYN8REZqC9Qkec\"}");

/***/ }),

/***/ 1874:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "makeAttachment", function() { return /* reexport */ makeAttachment; });
__webpack_require__.d(__webpack_exports__, "upload", function() { return /* reexport */ upload; });
__webpack_require__.d(__webpack_exports__, "uploadLandingPage", function() { return /* reexport */ uploadLandingPage; });
__webpack_require__.d(__webpack_exports__, "getRecentFiles", function() { return /* reexport */ getRecentFiles; });
__webpack_require__.d(__webpack_exports__, "getFileInfo", function() { return /* reexport */ getFileInfo; });
__webpack_require__.d(__webpack_exports__, "setFileInfo", function() { return /* reexport */ setFileInfo; });

// EXTERNAL MODULE: ./node_modules/@dimensiondev/common-protocols/esm/index.js + 7 modules
var esm = __webpack_require__(809);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/kit/esm/index.js + 11 modules
var kit_esm = __webpack_require__(150);

// EXTERNAL MODULE: ./node_modules/arweave/web/index.js
var web = __webpack_require__(1841);
var web_default = /*#__PURE__*/__webpack_require__.n(web);

// EXTERNAL MODULE: ./node_modules/lodash-es/lodash.js
var lodash = __webpack_require__(13);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/FileService/constants.ts
var constants = __webpack_require__(113);

// EXTERNAL MODULE: ./node_modules/@msgpack/msgpack/dist.es5/msgpack.min.js
var msgpack_min = __webpack_require__(484);

// EXTERNAL MODULE: ./node_modules/arweave/web/lib/utils.js
var utils = __webpack_require__(1714);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/FileService/arweave/remote-signing.ts



async function sign(transaction) {
    const response = await fetch(constants["h" /* signing */], {
        method: 'POST',
        // Temporary workaround for https://github.com/msgpack/msgpack-javascript/issues/145
        body: Uint8Array.from(await makeRequest(transaction)),
    });
    transaction.setSignature(await response.json());
}
async function makeRequest(transaction) {
    await transaction.prepareChunks(transaction.data);
    const get = (base, name) => base.get(name, { decode: true, string: false });
    return Object(msgpack_min["encode"])([
        Object(utils["stringToBuffer"])(transaction.format.toString()),
        get(transaction, 'owner'),
        get(transaction, 'target'),
        Object(utils["stringToBuffer"])(transaction.quantity),
        Object(utils["stringToBuffer"])(transaction.reward),
        get(transaction, 'last_tx'),
        transaction.tags.map((tag) => [get(tag, 'name'), get(tag, 'value')]),
        Object(utils["stringToBuffer"])(transaction.data_size),
        get(transaction, 'data_root'),
    ]);
}

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/FileService/arweave/token.json
var token = __webpack_require__(1870);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/FileService/arweave/index.ts







const stage = {};
const instance = web_default.a.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
});
async function makeAttachment(options) {
    const passphrase = options.key ? Object(kit_esm["d" /* encodeText */])(options.key) : undefined;
    const encoded = await esm["a" /* Attachment */].encode(passphrase, {
        block: options.block,
        mime: Object(lodash["isEmpty"])(options.type) ? 'application/octet-stream' : options.type,
        metadata: null,
    });
    const transaction = await makePayload(encoded, 'application/octet-stream');
    stage[transaction.id] = transaction;
    return transaction.id;
}
// import { ServicesWithProgress } from 'src/extension/service.ts'
// ServicesWithProgress.pluginArweaveUpload
async function* upload(id) {
    for await (const uploader of instance.transactions.upload(stage[id])) {
        yield uploader.pctComplete;
    }
}
async function uploadLandingPage(metadata) {
    const encodedMetadata = JSON.stringify({
        name: metadata.name,
        size: metadata.size,
        link: `https://arweave.net/${metadata.txId}`,
        signed: await makeFileKeySigned(metadata.key),
        createdAt: new Date().toISOString(),
    });
    const response = await fetch(constants["e" /* landing */]);
    const text = await response.text();
    const replaced = text.replace('__METADATA__', encodedMetadata);
    const data = Object(kit_esm["d" /* encodeText */])(replaced);
    const transaction = await makePayload(data, 'text/html');
    await instance.transactions.post(transaction);
    return transaction.id;
}
async function makePayload(data, type) {
    const transaction = await instance.createTransaction({ data }, token);
    transaction.addTag('Content-Type', type);
    await sign(transaction);
    return transaction;
}
async function makeFileKeySigned(fileKey) {
    if (Object(lodash["isNil"])(fileKey)) {
        return null;
    }
    const encodedKey = Object(kit_esm["d" /* encodeText */])(fileKey);
    const key = await crypto.subtle.generateKey({ name: 'HMAC', hash: { name: 'SHA-256' } }, true, ['sign', 'verify']);
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const signed = await crypto.subtle.sign({ name: 'HMAC' }, key, encodedKey);
    return [signed, exportedKey].map(kit_esm["c" /* encodeArrayBuffer */]);
}

// EXTERNAL MODULE: ./packages/maskbook/src/database/Plugin/wrap-plugin-database.ts + 1 modules
var wrap_plugin_database = __webpack_require__(644);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/asyncIteratorHelpers.ts
var asyncIteratorHelpers = __webpack_require__(450);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/FileService/database.ts



const Database = Object(wrap_plugin_database["a" /* createPluginDatabase */])(constants["d" /* identifier */]);
async function getRecentFiles() {
    const files = await Object(asyncIteratorHelpers["a" /* asyncIteratorToArray */])(Database.iterate('arweave'));
    files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return files.slice(0, 4);
}
async function getFileInfo(checksum) {
    return Database.get('arweave', checksum);
}
async function setFileInfo(info) {
    return Database.add(info);
}

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/FileService/service.ts




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