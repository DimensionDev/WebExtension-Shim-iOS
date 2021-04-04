/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		165: 0,
/******/ 		183: 0,
/******/ 		184: 0,
/******/ 		185: 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	var isChrome = typeof chrome !== 'undefined'
/******/
/******/ 	function sendRuntimeMessage(message) {
/******/ 		return isChrome
/******/ 			? new Promise(resolve => {
/******/ 				chrome.runtime.sendMessage(message, resolve);
/******/ 			})
/******/ 			: browser.runtime.sendMessage(message)
/******/ 	}
/******/
/******/ 	// script path function
/******/ 	function jsonpScriptSrc(chunkId) {
/******/ 		return __webpack_require__.p + "js/" + ({"156":"npm.arweave","157":"npm.axios","158":"npm.jsonwebtoken","159":"npm.lodash.includes","160":"npm.semver","173":"npm.walletconnect"}[chunkId]||chunkId) + ".chunk.js"
/******/ 	}
/******/ 	function webextScriptSrc(chunkId) {
/******/ 		var publicPath = __webpack_require__.p
/******/ 		var scriptSrcPath = publicPath + "js/" + ({"156":"npm.arweave","157":"npm.axios","158":"npm.jsonwebtoken","159":"npm.lodash.includes","160":"npm.semver","173":"npm.walletconnect"}[chunkId]||chunkId) + ".chunk.js";
/******/ 		if (!publicPath || !publicPath.includes('://')) {
/******/ 		                return (isChrome ? chrome : browser).runtime.getURL(
/******/ 		                  scriptSrcPath
/******/ 		                );
/******/ 		              } else {
/******/ 		                return scriptSrcPath;
/******/ 		              }
/******/ 	}
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId) {
/******/ 		var promises = [];
/******/
/******/
/******/ 		// Dynamic import chunk loading for javascript
/******/
/******/ 		var installedChunkData = installedChunks[chunkId];
/******/ 		if(installedChunkData !== 0) { // 0 means "already installed".
/******/
/******/ 			// a Promise means "currently loading".
/******/ 			if(installedChunkData) {
/******/ 				promises.push(installedChunkData[2]);
/******/ 			} else {
/******/ 				// setup Promise in chunk cache
/******/ 				var promise = new Promise(function(resolve, reject) {
/******/ 					installedChunkData = installedChunks[chunkId] = [resolve, reject];
/******/ 				});
/******/ 				promises.push(installedChunkData[2] = promise);
/******/
/******/ 				// start chunk loading
/******/ 				var script = webextScriptSrc(chunkId);
/******/ 				var onScriptComplete;
/******/ 				// create error before stack unwound to get useful stacktrace later
/******/ 				var error = new Error();
/******/ 				onScriptComplete = function (event) {
/******/ 					clearTimeout(timeout);
/******/ 					var chunk = installedChunks[chunkId];
/******/ 					if(chunk !== 0) {
/******/ 						if(chunk) {
/******/ 							var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 							error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + script + ')';
/******/ 							error.name = 'ChunkLoadError';
/******/ 							error.type = errorType;
/******/ 							error.request = script;
/******/ 							chunk[1](error);
/******/ 						}
/******/ 						installedChunks[chunkId] = undefined;
/******/ 					}
/******/ 				};
/******/ 				var timeout = setTimeout(function(){
/******/ 					onScriptComplete({ type: 'timeout' });
/******/ 				}, 120000);
/******/ 				import(script)
/******/ 					.catch(() => ({ type: 'missing' }))
/******/ 					.then(event => installedChunks[chunkId] !== 0
/******/ 						? sendRuntimeMessage({ type: 'WTW_INJECT', file: jsonpScriptSrc(chunkId) })
/******/ 						: event
/******/ 					)
/******/ 					.then(onScriptComplete, () => onScriptComplete({ type: 'missing' }));
/******/ 			}
/******/ 		}
/******/ 		return Promise.all(promises);
/******/ 	};
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// on error function for async loading
/******/ 	__webpack_require__.oe = function(err) { console.error(err); throw err; };
/******/
/******/ 	var jsonpArray = globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push([1520,0,1,2,3,4,6,5,9,8,7,62,141,138,140,145,143,134,144,73,133,150,54,131,127,63,19,93,21,102,110,72,111,136,49,91,126,78,135,96,50,84,122,59,139,121,68,142,61,55,146,41,76,24,11,108,109,92,87,69,115,70,90,42,46,22,149,106,47,128,83,18,104,105,57,75,130,45,117,118,114,74,31,36,56,48,60,51,12,14,29,28,89,52,82,67,35,37,77,38,137,40,23,34,98,44,119,27,94,120,101,66,123,97,81,13,88,107,25,147,58,148,113,26,116,99,100,32,124,125,64,30,71,33,43,53,129,103,86,79,65,85,112,95,17,15,39,132,80,16,20,153,162,161,171,170,172,168,169,174,151,10]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ 103:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return tasks; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return exclusiveTasks; });
/* harmony import */ var _dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(430);
/* harmony import */ var _dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(54);
/* harmony import */ var _database_type__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);
/* harmony import */ var _settings_settings__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(26);
/* harmony import */ var _utils_memoize__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(138);
/* harmony import */ var _utils_safeRequire__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(186);
/* harmony import */ var _utils_type_transform_Serialization__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(122);
/* harmony import */ var _utils_side_effects__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(147);
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(86);
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(12);
/* harmony import */ var _utils_flags__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(34);










function getActivatedUI() {
    return Object(_utils_safeRequire__WEBPACK_IMPORTED_MODULE_5__[/* safeGetActiveUI */ "a"])();
}
const _tasks = {
    getPostContent: () => getActivatedUI().taskGetPostContent(),
    /**
     * Access profile page
     * Get Profile
     */
    getProfile: (identifier) => getActivatedUI().taskGetProfile(identifier),
    /**
     * Access main page
     * Paste text into PostBox
     */
    pasteIntoPostBox: async (text, options) => getActivatedUI().taskPasteIntoPostBox(text, options),
    /**
     * Fetch a url in the current context
     */
    async fetch(...args) {
        return fetch(...args).then((x) => x.text());
    },
    memoizeFetch: Object(_utils_memoize__WEBPACK_IMPORTED_MODULE_4__[/* memoizePromise */ "a"])((url) => {
        return fetch(url).then((x) => x.text());
    }, (x) => x),
    async SetupGuide(for_) {
        getActivatedUI().taskStartSetupGuide(for_);
    },
    async noop() { },
};
const realTasks = Object(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* AutomatedTabTask */ "a"])(_tasks, {
    memorable: true,
    AsyncCallOptions: { serializer: _utils_type_transform_Serialization__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"], strict: false },
});
// console.log('To debug tasks, use globalThis.tasks, sleep fn is also available')
Object.assign(globalThis, { tasks: _tasks, sleep: _utils_utils__WEBPACK_IMPORTED_MODULE_9__[/* sleep */ "s"] });
function tasks(...args) {
    const [tabIdOrUri, options] = args;
    if (_settings_settings__WEBPACK_IMPORTED_MODULE_3__[/* disableOpenNewTabInBackgroundSettings */ "o"].value && Number.isNaN(Number(tabIdOrUri))) {
        if (!options || !options.active)
            throw new Error(`You have disabled "Disable fetching public keys in the background" in the settings so Maskbook can not perform this action`);
    }
    // in the background
    if (realTasks)
        return realTasks(...args);
    // for debug purpose
    return _tasks;
}
const uriCanDoTask = (tabUri, targetUri) => {
    if (tabUri === null || tabUri === void 0 ? void 0 : tabUri.startsWith(targetUri))
        return true;
    return false;
};
/**
 * ! For mobile standalone app
 * This function will open/switch tabs (and start tasks)
 * It tries to check if a tab being able to do the target task already opened before opening it
 * For Chrome, `browser.tabs.query` won't work for chrome-extension: schema, so this function is not useful
 */
function exclusiveTasks(...args) {
    const [uri, options = {}, ...others] = args;
    const updatedOptions = {
        active: true,
        memorable: false,
        autoClose: false,
    };
    if (!_utils_flags__WEBPACK_IMPORTED_MODULE_10__[/* Flags */ "a"].has_no_browser_tab_ui)
        return tasks(uri, { ...updatedOptions, ...options }, ...others);
    let _key;
    let _args;
    async function p() {
        const tabs = await browser.tabs.query({});
        const target = uri.toString().replace(/\/.+$/, '');
        const [tab] = tabs.filter((tab) => { var _a; return (_a = tab.url) === null || _a === void 0 ? void 0 : _a.startsWith(target); });
        if (tab) {
            Object.assign(updatedOptions, {
                runAtTabID: tab.id,
                needRedirect: !uriCanDoTask(tab.url, uri),
                url: uri,
            });
        }
        Object.assign(updatedOptions, options);
        const task = tasks(uri, updatedOptions, ...others);
        // @ts-ignore
        if (_key in task)
            return task[_key](..._args);
        return task;
    }
    const promise = p();
    return new Proxy({}, {
        get(_, key) {
            if (key === 'then')
                return undefined;
            _key = key;
            return (...args) => {
                _args = args;
                return promise;
            };
        },
    });
}
_utils_side_effects__WEBPACK_IMPORTED_MODULE_7__[/* sideEffect */ "a"].then(_utils_dom__WEBPACK_IMPORTED_MODULE_8__[/* untilDocumentReady */ "c"]).then(() => {
    if (!Object(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_1__[/* isEnvironment */ "g"])(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_1__[/* Environment */ "a"].ContentScript))
        return;
    //#region setup guide
    const network = getActivatedUI().networkIdentifier;
    const id = _settings_settings__WEBPACK_IMPORTED_MODULE_3__[/* currentSetupGuideStatus */ "l"][network].value;
    const onStatusUpdate = (id) => {
        const { persona, status } = JSON.parse(id || '{}');
        if (persona && status)
            _tasks.SetupGuide(_database_type__WEBPACK_IMPORTED_MODULE_2__["Identifier"].fromString(persona, _database_type__WEBPACK_IMPORTED_MODULE_2__["ECKeyIdentifier"]).unwrap());
    };
    _settings_settings__WEBPACK_IMPORTED_MODULE_3__[/* currentSetupGuideStatus */ "l"][network].addListener(onStatusUpdate);
    _settings_settings__WEBPACK_IMPORTED_MODULE_3__[/* currentSetupGuideStatus */ "l"][network].readyPromise.then(onStatusUpdate);
    onStatusUpdate(id);
    //#endregion
});


/***/ }),

/***/ 111:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "encrypt1To1", function() { return encrypt1To1; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "generateOthersAESKeyEncrypted", function() { return generateOthersAESKeyEncrypted; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "encrypt1ToN", function() { return encrypt1ToN; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "decryptMessage1To1", function() { return decryptMessage1To1; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "decryptMessage1ToNByOther", function() { return decryptMessage1ToNByOther; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "extractAESKeyInMessage", function() { return extractAESKeyInMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "decryptMessage1ToNByMyself", function() { return decryptMessage1ToNByMyself; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "decryptWithAES", function() { return decryptWithAES; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "encryptWithAES", function() { return encryptWithAES; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "encryptComment", function() { return encryptComment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "decryptComment", function() { return decryptComment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "typedMessageStringify", function() { return typedMessageStringify; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "typedMessageParse", function() { return typedMessageParse; });
/* harmony import */ var _utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(62);
/* harmony import */ var _utils_memoize__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(138);
/* harmony import */ var _protocols_typed_message__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(33);
/* harmony import */ var _utils_i18n_next__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(59);
/* harmony import */ var _modules_workers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(170);
/* harmony import */ var _modules_CryptoAlgorithm_helper__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(268);
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(12);
/**
 * @deprecated This version of payload is not in use.
 * Please goto Crypto alpha v38
 */







//#region Derive AES Key from ECDH key
/**
 * Derive the key from your private ECDH key and someone else's ECDH key.
 * If the key is ECDSA, it will be transform to ECDH.
 *
 * If you provide the same privateKey, othersPublicKey and salt, the results will be the same.
 * @param privateKey Your private key
 * @param othersPublicKey Public key of someone you want to derive key to
 * @param salt Salt
 */
async function deriveAESKey(privateKey, othersPublicKey, 
/** If salt is not provided, we will generate one. And you should send it to your friend. */
salt = crypto.getRandomValues(new Uint8Array(64))) {
    const op = othersPublicKey;
    const pr = privateKey;
    const derivedKey = await _modules_workers__WEBPACK_IMPORTED_MODULE_4__[/* CryptoWorker */ "a"].aes_to_raw(await Object(_modules_CryptoAlgorithm_helper__WEBPACK_IMPORTED_MODULE_5__[/* derive_AES_GCM_256_Key_From_ECDH_256k1_Keys */ "a"])(pr, op));
    const _salt = typeof salt === 'string' ? Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeArrayBuffer */ "a"])(salt) : salt;
    const UntitledUint8Array = Object(_utils_utils__WEBPACK_IMPORTED_MODULE_6__[/* addUint8Array */ "a"])(new Uint8Array(derivedKey), _salt);
    const password = await crypto.subtle.digest('SHA-256', Object(_utils_utils__WEBPACK_IMPORTED_MODULE_6__[/* addUint8Array */ "a"])(Object(_utils_utils__WEBPACK_IMPORTED_MODULE_6__[/* addUint8Array */ "a"])(UntitledUint8Array, _salt), Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeArrayBuffer */ "a"])('KEY')));
    const iv_pre = new Uint8Array(await crypto.subtle.digest('SHA-256', Object(_utils_utils__WEBPACK_IMPORTED_MODULE_6__[/* addUint8Array */ "a"])(Object(_utils_utils__WEBPACK_IMPORTED_MODULE_6__[/* addUint8Array */ "a"])(UntitledUint8Array, _salt), Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeArrayBuffer */ "a"])('IV'))));
    const iv = new Uint8Array(16);
    for (let i = 0; i <= 16; i += 1) {
        // eslint-disable-next-line no-bitwise
        iv[i] = iv_pre[i] ^ iv_pre[16 + i];
    }
    const key = await _modules_workers__WEBPACK_IMPORTED_MODULE_4__[/* CryptoWorker */ "a"].raw_to_aes(password);
    return { key, salt: _salt, iv };
}
//#endregion
//#region encrypt text
/**
 * Encrypt 1 to 1
 */
async function encrypt1To1(info) {
    const { version, privateKeyECDH, othersPublicKeyECDH } = info;
    let { content } = info;
    if (typeof content === 'string')
        content = Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeText */ "d"])(content);
    const { iv, key, salt } = await deriveAESKey(privateKeyECDH, othersPublicKeyECDH);
    const encryptedContent = await _modules_workers__WEBPACK_IMPORTED_MODULE_4__[/* CryptoWorker */ "a"].encrypt_aes_gcm(key, iv, content);
    return { salt, encryptedContent, version: -40 };
}
async function generateOthersAESKeyEncrypted(version, AESKey, privateKeyECDH, othersPublicKeyECDH) {
    const exportedAESKey = Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeText */ "d"])(JSON.stringify(AESKey));
    return Promise.all(othersPublicKeyECDH.map(async ({ key, name }) => {
        const encrypted = await encrypt1To1({
            // This is the deprecated -40 code path
            version: -40,
            content: exportedAESKey,
            othersPublicKeyECDH: key,
            privateKeyECDH: privateKeyECDH,
        });
        return {
            name,
            key: {
                version: -40,
                salt: Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeArrayBuffer */ "c"])(encrypted.salt),
                encryptedKey: Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeArrayBuffer */ "c"])(encrypted.encryptedContent),
            },
        };
    }));
}
/**
 * Encrypt 1 to N
 */
async function encrypt1ToN(info) {
    const { version, content, othersPublicKeyECDH, privateKeyECDH, ownersLocalKey, iv } = info;
    const AESKey = await _modules_workers__WEBPACK_IMPORTED_MODULE_4__[/* CryptoWorker */ "a"].generate_aes_gcm();
    const encryptedContent = await _modules_workers__WEBPACK_IMPORTED_MODULE_4__[/* CryptoWorker */ "a"].encrypt_aes_gcm(AESKey, iv, typeof content === 'string' ? Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeText */ "d"])(content) : content);
    const exportedAESKey = Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeText */ "d"])(JSON.stringify(AESKey));
    const ownersAESKeyEncrypted = (await encryptWithAES({
        aesKey: ownersLocalKey,
        content: exportedAESKey,
        iv,
    })).content;
    const othersAESKeyEncrypted = await generateOthersAESKeyEncrypted(-40, AESKey, privateKeyECDH, othersPublicKeyECDH);
    return { encryptedContent, iv, version: -40, ownersAESKeyEncrypted, othersAESKeyEncrypted, postAESKey: AESKey };
}
//#endregion
//#region decrypt text
/**
 * Decrypt 1 to 1
 */
async function decryptMessage1To1(info) {
    const { anotherPublicKeyECDH, version, salt, encryptedContent, privateKeyECDH } = info;
    const encrypted = typeof encryptedContent === 'string' ? Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeArrayBuffer */ "a"])(encryptedContent) : encryptedContent;
    const { iv, key } = await deriveAESKey(privateKeyECDH, anotherPublicKeyECDH, salt);
    return _modules_workers__WEBPACK_IMPORTED_MODULE_4__[/* CryptoWorker */ "a"].decrypt_aes_gcm(key, iv, encrypted);
}
/**
 * Decrypt 1 to N message that send by other
 */
async function decryptMessage1ToNByOther(info) {
    const { encryptedContent, privateKeyECDH, authorsPublicKeyECDH, iv } = info;
    const AESKeyEncrypted = Array.isArray(info.AESKeyEncrypted) ? info.AESKeyEncrypted : [info.AESKeyEncrypted];
    let resolvedAESKey = null;
    await Promise.all(AESKeyEncrypted.map(async (key) => {
        try {
            const result = await decryptMessage1To1({
                version: -40,
                salt: key.salt,
                encryptedContent: key.encryptedKey,
                anotherPublicKeyECDH: authorsPublicKeyECDH,
                privateKeyECDH: privateKeyECDH,
            });
            resolvedAESKey = Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeText */ "b"])(result);
        }
        catch { }
    }));
    if (resolvedAESKey === null)
        throw new Error(_utils_i18n_next__WEBPACK_IMPORTED_MODULE_3__[/* i18n */ "b"].t('service_not_share_target'));
    const aesKey = JSON.parse(resolvedAESKey);
    return [await decryptWithAES({ aesKey, iv, encrypted: encryptedContent }), aesKey];
}
async function extractAESKeyInMessage(version, encodedEncryptedKey, _iv, myLocalKey) {
    const iv = typeof _iv === 'string' ? Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeArrayBuffer */ "a"])(_iv) : _iv;
    const encryptedKey = typeof encodedEncryptedKey === 'string' ? Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeArrayBuffer */ "a"])(encodedEncryptedKey) : encodedEncryptedKey;
    const decryptedAESKeyJWK = JSON.parse(Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeText */ "b"])(await decryptWithAES({ aesKey: myLocalKey, iv, encrypted: encryptedKey })));
    return decryptedAESKeyJWK;
}
/**
 * Decrypt 1 to N message that send by myself
 */
async function decryptMessage1ToNByMyself(info) {
    const { encryptedContent, myLocalKey, iv, encryptedAESKey } = info;
    const decryptedAESKey = await extractAESKeyInMessage(-40, encryptedAESKey, iv, myLocalKey);
    const post = await decryptWithAES({ aesKey: decryptedAESKey, encrypted: encryptedContent, iv });
    return [post, decryptedAESKey];
}
/**
 * Decrypt the content encrypted by AES
 */
async function decryptWithAES(info) {
    const { aesKey } = info;
    const iv = typeof info.iv === 'string' ? Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeArrayBuffer */ "a"])(info.iv) : info.iv;
    const encrypted = typeof info.encrypted === 'string' ? Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeArrayBuffer */ "a"])(info.encrypted) : info.encrypted;
    return _modules_workers__WEBPACK_IMPORTED_MODULE_4__[/* CryptoWorker */ "a"].decrypt_aes_gcm(aesKey, iv, encrypted);
}
async function encryptWithAES(info) {
    const iv = info.iv ? info.iv : crypto.getRandomValues(new Uint8Array(16));
    const content = typeof info.content === 'string' ? Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeText */ "d"])(info.content) : info.content;
    const encrypted = await _modules_workers__WEBPACK_IMPORTED_MODULE_4__[/* CryptoWorker */ "a"].encrypt_aes_gcm(info.aesKey, iv, content);
    return { content: encrypted, iv };
}
//#endregion
//#region Comment
function extractCommentPayload(text) {
    const [_, toEnd] = text.split('🎶2/4|');
    const [content, _2] = (toEnd || '').split(':||');
    if (content.length)
        return content;
    return;
}
const getCommentKey = Object(_utils_memoize__WEBPACK_IMPORTED_MODULE_1__[/* memoizePromise */ "a"])(async function (postIV, postContent) {
    const pbkdf = await _modules_workers__WEBPACK_IMPORTED_MODULE_4__[/* CryptoWorker */ "a"].import_pbkdf2(Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeText */ "d"])(postContent));
    const aes = await Object(_modules_CryptoAlgorithm_helper__WEBPACK_IMPORTED_MODULE_5__[/* derive_AES_GCM_256_Key_From_PBKDF2 */ "b"])(pbkdf, Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeText */ "d"])(postIV));
    return aes;
}, (a, b) => a + b);
// * Payload format: 🎶2/4|encrypted_comment:||
async function encryptComment(postIV, postContent, comment) {
    if (typeof postIV !== 'string')
        postIV = Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeArrayBuffer */ "c"])(postIV);
    if (typeof postContent !== 'string')
        postContent = Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeText */ "b"])(postContent);
    const key = await getCommentKey(postIV, postContent);
    const x = await encryptWithAES({
        content: comment,
        aesKey: key,
        iv: Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeArrayBuffer */ "a"])(postIV),
    });
    return `🎶2/4|${Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeArrayBuffer */ "c"])(x.content)}:||`;
}
async function decryptComment(postIV, postContent, encryptComment) {
    if (typeof postIV !== 'string')
        postIV = Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeArrayBuffer */ "c"])(postIV);
    if (typeof postContent !== 'string')
        postContent = Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeText */ "b"])(postContent);
    if (typeof encryptComment !== 'string')
        encryptComment = Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeText */ "b"])(encryptComment);
    const payload = extractCommentPayload(encryptComment);
    if (!payload)
        return null;
    const key = await getCommentKey(postIV, postContent);
    try {
        const x = await decryptWithAES({
            aesKey: key,
            iv: Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeArrayBuffer */ "a"])(postIV),
            encrypted: payload,
        });
        return Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* decodeText */ "b"])(x);
    }
    catch {
        return null;
    }
}
//#endregion
function typedMessageStringify(x) {
    throw new Error('Not supported typed message in version older than v39.');
}
function typedMessageParse(x) {
    return Object(_protocols_typed_message__WEBPACK_IMPORTED_MODULE_2__[/* makeTypedMessageText */ "q"])(x);
}


/***/ }),

/***/ 115:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SetupStep; });
var SetupStep;
(function (SetupStep) {
    SetupStep["ConsentDataCollection"] = "consent-data-collection";
    SetupStep["CreatePersona"] = "create-persona";
    SetupStep["ConnectNetwork"] = "connect-network";
    SetupStep["RestoreDatabase"] = "restore-database";
    SetupStep["RestoreDatabaseAdvance"] = "restore-database-advance";
    SetupStep["RestoreDatabaseConfirmation"] = "restore-database-confirmation";
})(SetupStep || (SetupStep = {}));


/***/ }),

/***/ 1520:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1545);
module.exports = __webpack_require__(344);


/***/ }),

/***/ 1521:
/***/ (function(module, exports) {

/** Add this to background scripts */

const isChrome = typeof chrome !== 'undefined'

;(isChrome ? chrome : browser).runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'WTW_INJECT' && sender && sender.tab && sender.tab.id != null) {
    if (message.file) {
      const details = {
        frameId: sender.tab.frameId,
        file: message.file
      }
      const callback = () => sendResponse()
      if (isChrome) {
        chrome.tabs.executeScript(sender.tab.id, details, callback)
      } else {
        browser.tabs.executeScript(sender.tab.id, details).then(callback)
      }
      return true
    }
  }
})

/***/ }),

/***/ 1522:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getUTCDate", function() { return getUTCDate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getParametersValue", function() { return getParametersValue; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bufferToHexCodes", function() { return bufferToHexCodes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "checkBufferParams", function() { return checkBufferParams; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "utilFromBase", function() { return utilFromBase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "utilToBase", function() { return utilToBase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "utilConcatBuf", function() { return utilConcatBuf; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "utilConcatView", function() { return utilConcatView; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "utilDecodeTC", function() { return utilDecodeTC; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "utilEncodeTC", function() { return utilEncodeTC; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isEqualBuffer", function() { return isEqualBuffer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "padNumber", function() { return padNumber; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toBase64", function() { return toBase64; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "fromBase64", function() { return fromBase64; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "arrayBufferToString", function() { return arrayBufferToString; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "stringToArrayBuffer", function() { return stringToArrayBuffer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "nearestPowerOf2", function() { return nearestPowerOf2; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clearProps", function() { return clearProps; });
//**************************************************************************************
/**
 * Making UTC date from local date
 * @param {Date} date Date to convert from
 * @returns {Date}
 */
function getUTCDate(date)
{
	// noinspection NestedFunctionCallJS, MagicNumberJS
	return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
}
//**************************************************************************************
// noinspection FunctionWithMultipleReturnPointsJS
/**
 * Get value for input parameters, or set a default value
 * @param {Object} parameters
 * @param {string} name
 * @param defaultValue
 */
function getParametersValue(parameters, name, defaultValue)
{
	// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS
	if((parameters instanceof Object) === false)
		return defaultValue;
	
	// noinspection NonBlockStatementBodyJS
	if(name in parameters)
		return parameters[name];
	
	return defaultValue;
}
//**************************************************************************************
/**
 * Converts "ArrayBuffer" into a hexdecimal string
 * @param {ArrayBuffer} inputBuffer
 * @param {number} [inputOffset=0]
 * @param {number} [inputLength=inputBuffer.byteLength]
 * @param {boolean} [insertSpace=false]
 * @returns {string}
 */
function bufferToHexCodes(inputBuffer, inputOffset = 0, inputLength = (inputBuffer.byteLength - inputOffset), insertSpace = false)
{
	let result = "";
	
	for(const item of (new Uint8Array(inputBuffer, inputOffset, inputLength)))
	{
		// noinspection ChainedFunctionCallJS
		const str = item.toString(16).toUpperCase();
		
		// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS
		if(str.length === 1)
			result += "0";
		
		result += str;
		
		// noinspection NonBlockStatementBodyJS
		if(insertSpace)
			result += " ";
	}
	
	return result.trim();
}
//**************************************************************************************
// noinspection JSValidateJSDoc, FunctionWithMultipleReturnPointsJS
/**
 * Check input "ArrayBuffer" for common functions
 * @param {LocalBaseBlock} baseBlock
 * @param {ArrayBuffer} inputBuffer
 * @param {number} inputOffset
 * @param {number} inputLength
 * @returns {boolean}
 */
function checkBufferParams(baseBlock, inputBuffer, inputOffset, inputLength)
{
	// noinspection ConstantOnRightSideOfComparisonJS
	if((inputBuffer instanceof ArrayBuffer) === false)
	{
		// noinspection JSUndefinedPropertyAssignment
		baseBlock.error = "Wrong parameter: inputBuffer must be \"ArrayBuffer\"";
		return false;
	}
	
	// noinspection ConstantOnRightSideOfComparisonJS
	if(inputBuffer.byteLength === 0)
	{
		// noinspection JSUndefinedPropertyAssignment
		baseBlock.error = "Wrong parameter: inputBuffer has zero length";
		return false;
	}
	
	// noinspection ConstantOnRightSideOfComparisonJS
	if(inputOffset < 0)
	{
		// noinspection JSUndefinedPropertyAssignment
		baseBlock.error = "Wrong parameter: inputOffset less than zero";
		return false;
	}
	
	// noinspection ConstantOnRightSideOfComparisonJS
	if(inputLength < 0)
	{
		// noinspection JSUndefinedPropertyAssignment
		baseBlock.error = "Wrong parameter: inputLength less than zero";
		return false;
	}
	
	// noinspection ConstantOnRightSideOfComparisonJS
	if((inputBuffer.byteLength - inputOffset - inputLength) < 0)
	{
		// noinspection JSUndefinedPropertyAssignment
		baseBlock.error = "End of input reached before message was fully decoded (inconsistent offset and length values)";
		return false;
	}
	
	return true;
}
//**************************************************************************************
// noinspection FunctionWithMultipleReturnPointsJS
/**
 * Convert number from 2^base to 2^10
 * @param {Uint8Array} inputBuffer
 * @param {number} inputBase
 * @returns {number}
 */
function utilFromBase(inputBuffer, inputBase)
{
	let result = 0;
	
	// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS
	if(inputBuffer.length === 1)
		return inputBuffer[0];
	
	// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS
	for(let i = (inputBuffer.length - 1); i >= 0; i--)
		result += inputBuffer[(inputBuffer.length - 1) - i] * Math.pow(2, inputBase * i);
	
	return result;
}
//**************************************************************************************
// noinspection FunctionWithMultipleLoopsJS, FunctionWithMultipleReturnPointsJS
/**
 * Convert number from 2^10 to 2^base
 * @param {!number} value The number to convert
 * @param {!number} base The base for 2^base
 * @param {number} [reserved=0] Pre-defined number of bytes in output array (-1 = limited by function itself)
 * @returns {ArrayBuffer}
 */
function utilToBase(value, base, reserved = (-1))
{
	const internalReserved = reserved;
	let internalValue = value;
	
	let result = 0;
	let biggest = Math.pow(2, base);
	
	// noinspection ConstantOnRightSideOfComparisonJS
	for(let i = 1; i < 8; i++)
	{
		if(value < biggest)
		{
			let retBuf;
			
			// noinspection ConstantOnRightSideOfComparisonJS
			if(internalReserved < 0)
			{
				retBuf = new ArrayBuffer(i);
				result = i;
			}
			else
			{
				// noinspection NonBlockStatementBodyJS
				if(internalReserved < i)
					return (new ArrayBuffer(0));
				
				retBuf = new ArrayBuffer(internalReserved);
				
				result = internalReserved;
			}
			
			const retView = new Uint8Array(retBuf);
			
			// noinspection ConstantOnRightSideOfComparisonJS
			for(let j = (i - 1); j >= 0; j--)
			{
				const basis = Math.pow(2, j * base);
				
				retView[result - j - 1] = Math.floor(internalValue / basis);
				internalValue -= (retView[result - j - 1]) * basis;
			}
			
			return retBuf;
		}
		
		biggest *= Math.pow(2, base);
	}
	
	return new ArrayBuffer(0);
}
//**************************************************************************************
// noinspection FunctionWithMultipleLoopsJS
/**
 * Concatenate two ArrayBuffers
 * @param {...ArrayBuffer} buffers Set of ArrayBuffer
 */
function utilConcatBuf(...buffers)
{
	//region Initial variables
	let outputLength = 0;
	let prevLength = 0;
	//endregion
	
	//region Calculate output length
	
	// noinspection NonBlockStatementBodyJS
	for(const buffer of buffers)
		outputLength += buffer.byteLength;
	//endregion
	
	const retBuf = new ArrayBuffer(outputLength);
	const retView = new Uint8Array(retBuf);
	
	for(const buffer of buffers)
	{
		// noinspection NestedFunctionCallJS
		retView.set(new Uint8Array(buffer), prevLength);
		prevLength += buffer.byteLength;
	}
	
	return retBuf;
}
//**************************************************************************************
// noinspection FunctionWithMultipleLoopsJS
/**
 * Concatenate two Uint8Array
 * @param {...Uint8Array} views Set of Uint8Array
 */
function utilConcatView(...views)
{
	//region Initial variables
	let outputLength = 0;
	let prevLength = 0;
	//endregion
	
	//region Calculate output length
	// noinspection NonBlockStatementBodyJS
	for(const view of views)
		outputLength += view.length;
	//endregion
	
	const retBuf = new ArrayBuffer(outputLength);
	const retView = new Uint8Array(retBuf);
	
	for(const view of views)
	{
		retView.set(view, prevLength);
		prevLength += view.length;
	}
	
	return retView;
}
//**************************************************************************************
// noinspection FunctionWithMultipleLoopsJS
/**
 * Decoding of "two complement" values
 * The function must be called in scope of instance of "hexBlock" class ("valueHex" and "warnings" properties must be present)
 * @returns {number}
 */
function utilDecodeTC()
{
	const buf = new Uint8Array(this.valueHex);
	
	// noinspection ConstantOnRightSideOfComparisonJS
	if(this.valueHex.byteLength >= 2)
	{
		//noinspection JSBitwiseOperatorUsage, ConstantOnRightSideOfComparisonJS, LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		const condition1 = (buf[0] === 0xFF) && (buf[1] & 0x80);
		// noinspection ConstantOnRightSideOfComparisonJS, LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		const condition2 = (buf[0] === 0x00) && ((buf[1] & 0x80) === 0x00);
		
		// noinspection NonBlockStatementBodyJS
		if(condition1 || condition2)
			this.warnings.push("Needlessly long format");
	}
	
	//region Create big part of the integer
	const bigIntBuffer = new ArrayBuffer(this.valueHex.byteLength);
	const bigIntView = new Uint8Array(bigIntBuffer);
	// noinspection NonBlockStatementBodyJS
	for(let i = 0; i < this.valueHex.byteLength; i++)
		bigIntView[i] = 0;
	
	// noinspection MagicNumberJS, NonShortCircuitBooleanExpressionJS
	bigIntView[0] = (buf[0] & 0x80); // mask only the biggest bit
	
	const bigInt = utilFromBase(bigIntView, 8);
	//endregion
	
	//region Create small part of the integer
	const smallIntBuffer = new ArrayBuffer(this.valueHex.byteLength);
	const smallIntView = new Uint8Array(smallIntBuffer);
	// noinspection NonBlockStatementBodyJS
	for(let j = 0; j < this.valueHex.byteLength; j++)
		smallIntView[j] = buf[j];
	
	// noinspection MagicNumberJS
	smallIntView[0] &= 0x7F; // mask biggest bit
	
	const smallInt = utilFromBase(smallIntView, 8);
	//endregion
	
	return (smallInt - bigInt);
}
//**************************************************************************************
// noinspection FunctionWithMultipleLoopsJS, FunctionWithMultipleReturnPointsJS
/**
 * Encode integer value to "two complement" format
 * @param {number} value Value to encode
 * @returns {ArrayBuffer}
 */
function utilEncodeTC(value)
{
	// noinspection ConstantOnRightSideOfComparisonJS, ConditionalExpressionJS
	const modValue = (value < 0) ? (value * (-1)) : value;
	let bigInt = 128;
	
	// noinspection ConstantOnRightSideOfComparisonJS
	for(let i = 1; i < 8; i++)
	{
		if(modValue <= bigInt)
		{
			// noinspection ConstantOnRightSideOfComparisonJS
			if(value < 0)
			{
				const smallInt = bigInt - modValue;
				
				const retBuf = utilToBase(smallInt, 8, i);
				const retView = new Uint8Array(retBuf);
				
				// noinspection MagicNumberJS
				retView[0] |= 0x80;
				
				return retBuf;
			}
			
			let retBuf = utilToBase(modValue, 8, i);
			let retView = new Uint8Array(retBuf);
			
			//noinspection JSBitwiseOperatorUsage, MagicNumberJS, NonShortCircuitBooleanExpressionJS
			if(retView[0] & 0x80)
			{
				//noinspection JSCheckFunctionSignatures
				const tempBuf = retBuf.slice(0);
				const tempView = new Uint8Array(tempBuf);
				
				retBuf = new ArrayBuffer(retBuf.byteLength + 1);
				// noinspection ReuseOfLocalVariableJS
				retView = new Uint8Array(retBuf);
				
				// noinspection NonBlockStatementBodyJS
				for(let k = 0; k < tempBuf.byteLength; k++)
					retView[k + 1] = tempView[k];
				
				// noinspection MagicNumberJS
				retView[0] = 0x00;
			}
			
			return retBuf;
		}
		
		bigInt *= Math.pow(2, 8);
	}
	
	return (new ArrayBuffer(0));
}
//**************************************************************************************
// noinspection FunctionWithMultipleReturnPointsJS, ParameterNamingConventionJS
/**
 * Compare two array buffers
 * @param {!ArrayBuffer} inputBuffer1
 * @param {!ArrayBuffer} inputBuffer2
 * @returns {boolean}
 */
function isEqualBuffer(inputBuffer1, inputBuffer2)
{
	// noinspection NonBlockStatementBodyJS
	if(inputBuffer1.byteLength !== inputBuffer2.byteLength)
		return false;
	
	// noinspection LocalVariableNamingConventionJS
	const view1 = new Uint8Array(inputBuffer1);
	// noinspection LocalVariableNamingConventionJS
	const view2 = new Uint8Array(inputBuffer2);
	
	for(let i = 0; i < view1.length; i++)
	{
		// noinspection NonBlockStatementBodyJS
		if(view1[i] !== view2[i])
			return false;
	}
	
	return true;
}
//**************************************************************************************
// noinspection FunctionWithMultipleReturnPointsJS
/**
 * Pad input number with leade "0" if needed
 * @returns {string}
 * @param {number} inputNumber
 * @param {number} fullLength
 */
function padNumber(inputNumber, fullLength)
{
	const str = inputNumber.toString(10);
	
	// noinspection NonBlockStatementBodyJS
	if(fullLength < str.length)
		return "";
	
	const dif = fullLength - str.length;
	
	const padding = new Array(dif);
	// noinspection NonBlockStatementBodyJS
	for(let i = 0; i < dif; i++)
		padding[i] = "0";
	
	const paddingString = padding.join("");
	
	return paddingString.concat(str);
}
//**************************************************************************************
const base64Template = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
const base64UrlTemplate = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";
//**************************************************************************************
// noinspection FunctionWithMultipleLoopsJS, OverlyComplexFunctionJS, FunctionTooLongJS, FunctionNamingConventionJS
/**
 * Encode string into BASE64 (or "base64url")
 * @param {string} input
 * @param {boolean} useUrlTemplate If "true" then output would be encoded using "base64url"
 * @param {boolean} skipPadding Skip BASE-64 padding or not
 * @param {boolean} skipLeadingZeros Skip leading zeros in input data or not
 * @returns {string}
 */
function toBase64(input, useUrlTemplate = false, skipPadding = false, skipLeadingZeros = false)
{
	let i = 0;
	
	// noinspection LocalVariableNamingConventionJS
	let flag1 = 0;
	// noinspection LocalVariableNamingConventionJS
	let flag2 = 0;
	
	let output = "";
	
	// noinspection ConditionalExpressionJS
	const template = (useUrlTemplate) ? base64UrlTemplate : base64Template;
	
	if(skipLeadingZeros)
	{
		let nonZeroPosition = 0;
		
		for(let i = 0; i < input.length; i++)
		{
			// noinspection ConstantOnRightSideOfComparisonJS
			if(input.charCodeAt(i) !== 0)
			{
				nonZeroPosition = i;
				// noinspection BreakStatementJS
				break;
			}
		}
		
		// noinspection AssignmentToFunctionParameterJS
		input = input.slice(nonZeroPosition);
	}
	
	while(i < input.length)
	{
		// noinspection LocalVariableNamingConventionJS, IncrementDecrementResultUsedJS
		const chr1 = input.charCodeAt(i++);
		// noinspection NonBlockStatementBodyJS
		if(i >= input.length)
			flag1 = 1;
		// noinspection LocalVariableNamingConventionJS, IncrementDecrementResultUsedJS
		const chr2 = input.charCodeAt(i++);
		// noinspection NonBlockStatementBodyJS
		if(i >= input.length)
			flag2 = 1;
		// noinspection LocalVariableNamingConventionJS, IncrementDecrementResultUsedJS
		const chr3 = input.charCodeAt(i++);
		
		// noinspection LocalVariableNamingConventionJS
		const enc1 = chr1 >> 2;
		// noinspection LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		const enc2 = ((chr1 & 0x03) << 4) | (chr2 >> 4);
		// noinspection LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		let enc3 = ((chr2 & 0x0F) << 2) | (chr3 >> 6);
		// noinspection LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		let enc4 = chr3 & 0x3F;
		
		// noinspection ConstantOnRightSideOfComparisonJS
		if(flag1 === 1)
		{
			// noinspection NestedAssignmentJS, AssignmentResultUsedJS, MagicNumberJS
			enc3 = enc4 = 64;
		}
		else
		{
			// noinspection ConstantOnRightSideOfComparisonJS
			if(flag2 === 1)
			{
				// noinspection MagicNumberJS
				enc4 = 64;
			}
		}
		
		// noinspection NonBlockStatementBodyJS
		if(skipPadding)
		{
			// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS, MagicNumberJS
			if(enc3 === 64)
				output += `${template.charAt(enc1)}${template.charAt(enc2)}`;
			else
			{
				// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS, MagicNumberJS
				if(enc4 === 64)
					output += `${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}`;
				else
					output += `${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}${template.charAt(enc4)}`;
			}
		}
		else
			output += `${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}${template.charAt(enc4)}`;
	}
	
	return output;
}
//**************************************************************************************
// noinspection FunctionWithMoreThanThreeNegationsJS, FunctionWithMultipleLoopsJS, OverlyComplexFunctionJS, FunctionNamingConventionJS
/**
 * Decode string from BASE64 (or "base64url")
 * @param {string} input
 * @param {boolean} [useUrlTemplate=false] If "true" then output would be encoded using "base64url"
 * @param {boolean} [cutTailZeros=false] If "true" then cut tailing zeroz from function result
 * @returns {string}
 */
function fromBase64(input, useUrlTemplate = false, cutTailZeros = false)
{
	// noinspection ConditionalExpressionJS
	const template = (useUrlTemplate) ? base64UrlTemplate : base64Template;
	
	//region Aux functions
	// noinspection FunctionWithMultipleReturnPointsJS, NestedFunctionJS
	function indexof(toSearch)
	{
		// noinspection ConstantOnRightSideOfComparisonJS, MagicNumberJS
		for(let i = 0; i < 64; i++)
		{
			// noinspection NonBlockStatementBodyJS
			if(template.charAt(i) === toSearch)
				return i;
		}
		
		// noinspection MagicNumberJS
		return 64;
	}
	
	// noinspection NestedFunctionJS
	function test(incoming)
	{
		// noinspection ConstantOnRightSideOfComparisonJS, ConditionalExpressionJS, MagicNumberJS
		return ((incoming === 64) ? 0x00 : incoming);
	}
	//endregion
	
	let i = 0;
	
	let output = "";
	
	while(i < input.length)
	{
		// noinspection NestedFunctionCallJS, LocalVariableNamingConventionJS, IncrementDecrementResultUsedJS
		const enc1 = indexof(input.charAt(i++));
		// noinspection NestedFunctionCallJS, LocalVariableNamingConventionJS, ConditionalExpressionJS, MagicNumberJS, IncrementDecrementResultUsedJS
		const enc2 = (i >= input.length) ? 0x00 : indexof(input.charAt(i++));
		// noinspection NestedFunctionCallJS, LocalVariableNamingConventionJS, ConditionalExpressionJS, MagicNumberJS, IncrementDecrementResultUsedJS
		const enc3 = (i >= input.length) ? 0x00 : indexof(input.charAt(i++));
		// noinspection NestedFunctionCallJS, LocalVariableNamingConventionJS, ConditionalExpressionJS, MagicNumberJS, IncrementDecrementResultUsedJS
		const enc4 = (i >= input.length) ? 0x00 : indexof(input.charAt(i++));
		
		// noinspection LocalVariableNamingConventionJS, NonShortCircuitBooleanExpressionJS
		const chr1 = (test(enc1) << 2) | (test(enc2) >> 4);
		// noinspection LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		const chr2 = ((test(enc2) & 0x0F) << 4) | (test(enc3) >> 2);
		// noinspection LocalVariableNamingConventionJS, MagicNumberJS, NonShortCircuitBooleanExpressionJS
		const chr3 = ((test(enc3) & 0x03) << 6) | test(enc4);
		
		output += String.fromCharCode(chr1);
		
		// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS, MagicNumberJS
		if(enc3 !== 64)
			output += String.fromCharCode(chr2);
		
		// noinspection ConstantOnRightSideOfComparisonJS, NonBlockStatementBodyJS, MagicNumberJS
		if(enc4 !== 64)
			output += String.fromCharCode(chr3);
	}
	
	if(cutTailZeros)
	{
		const outputLength = output.length;
		let nonZeroStart = (-1);
		
		// noinspection ConstantOnRightSideOfComparisonJS
		for(let i = (outputLength - 1); i >= 0; i--)
		{
			// noinspection ConstantOnRightSideOfComparisonJS
			if(output.charCodeAt(i) !== 0)
			{
				nonZeroStart = i;
				// noinspection BreakStatementJS
				break;
			}
		}
		
		// noinspection NonBlockStatementBodyJS, NegatedIfStatementJS
		if(nonZeroStart !== (-1))
			output = output.slice(0, nonZeroStart + 1);
		else
			output = "";
	}
	
	return output;
}
//**************************************************************************************
function arrayBufferToString(buffer)
{
	let resultString = "";
	const view = new Uint8Array(buffer);
	
	// noinspection NonBlockStatementBodyJS
	for(const element of view)
		resultString += String.fromCharCode(element);
	
	return resultString;
}
//**************************************************************************************
function stringToArrayBuffer(str)
{
	const stringLength = str.length;
	
	const resultBuffer = new ArrayBuffer(stringLength);
	const resultView = new Uint8Array(resultBuffer);
	
	// noinspection NonBlockStatementBodyJS
	for(let i = 0; i < stringLength; i++)
		resultView[i] = str.charCodeAt(i);
	
	return resultBuffer;
}
//**************************************************************************************
const log2 = Math.log(2);
//**************************************************************************************
// noinspection FunctionNamingConventionJS
/**
 * Get nearest to input length power of 2
 * @param {number} length Current length of existing array
 * @returns {number}
 */
function nearestPowerOf2(length)
{
	const base = (Math.log(length) / log2);
	
	const floor = Math.floor(base);
	const round = Math.round(base);
	
	// noinspection ConditionalExpressionJS
	return ((floor === round) ? floor : round);
}
//**************************************************************************************
/**
 * Delete properties by name from specified object
 * @param {Object} object Object to delete properties from
 * @param {Array.<string>} propsArray Array of properties names
 */
function clearProps(object, propsArray)
{
	for(const prop of propsArray)
		delete object[prop];
}
//**************************************************************************************


/***/ }),

/***/ 1545:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: (webpack)-target-webextension/lib/background.js
var background = __webpack_require__(1521);

// EXTERNAL MODULE: ./packages/maskbook/src/polyfill/index.ts + 8 modules
var polyfill = __webpack_require__(808);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/Context.js
var Context = __webpack_require__(54);

// EXTERNAL MODULE: ./node_modules/webcrypto-liner/build/index.es.js
var index_es = __webpack_require__(915);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/service.ts + 1 modules
var service = __webpack_require__(18);

// EXTERNAL MODULE: ./packages/maskbook/src/provider.worker.ts + 7 modules
var provider_worker = __webpack_require__(613);

// EXTERNAL MODULE: ./packages/maskbook/src/database/Persona/Persona.db.ts + 1 modules
var Persona_db = __webpack_require__(48);

// EXTERNAL MODULE: ./packages/maskbook/src/database/Persona/helpers.ts
var helpers = __webpack_require__(266);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/messages.ts
var messages = __webpack_require__(55);

// EXTERNAL MODULE: ./packages/maskbook/src/database/post.ts
var database_post = __webpack_require__(181);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/background-script/CryptoService.ts + 6 modules
var CryptoService = __webpack_require__(810);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/background-script/UserGroupService.ts
var UserGroupService = __webpack_require__(453);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/background-script/IdentityService.ts
var IdentityService = __webpack_require__(451);

// EXTERNAL MODULE: ./packages/maskbook/src/settings/settings.ts
var settings = __webpack_require__(26);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/background-script/Jobs/AutoShareToFriends.ts






async function appendShare(postFilter, shareTargets) {
    const posts = await Object(database_post["queryPostsDB"])(postFilter);
    for (const post of posts) {
        const postID = post.identifier.toText();
        const { share, whoAmI, reason } = shareTargets(post);
        if (share.length === 0)
            return;
        console.log('Sharing post ', postID, '...');
        if (!post.postCryptoKey) {
            console.warn('Post ', postID, ' have no CryptoKey, skipping');
            return;
        }
        Object(CryptoService["appendShareTarget"])(-38, post.postCryptoKey, post.identifier.postIV, share, whoAmI, reason).then(() => {
            console.log('Post ', postID, ' shared');
        }, console.error);
    }
}
function initAutoShareToFriends() {
    messages["a" /* MaskMessage */].events.profileJoinedGroup.on(async (data) => {
        if (settings["h" /* currentImportingBackup */].value)
            return;
        if (data.group.isReal)
            return;
        const group = await Object(UserGroupService["queryUserGroup"])(data.group);
        if (!group)
            return;
        // if (group.groupName !== PreDefinedVirtualGroupNames.friends) return
        const whoAmI = data.group.ownerIdentifier;
        if (!whoAmI)
            return;
        console.groupCollapsed('[Auto share to friends] New friends', data.newMembers, ' to group ', data.group, ' share old posts to them.');
        appendShare((record, id) => {
            if (id.network !== data.group.network)
                return false;
            if (record.recipientGroups.some((x) => data.group.equals(x)))
                return true;
            return false;
        }, (post) => {
            const notSharedBefore = [];
            data.newMembers.forEach((x) => {
                if (post.recipients.has(x)) {
                }
                else
                    notSharedBefore.push(x);
            });
            return {
                share: notSharedBefore,
                whoAmI,
                reason: { type: 'group', at: new Date(), group: group.identifier },
            };
        });
        console.groupEnd();
    });
    messages["a" /* MaskMessage */].events.linkedProfilesChanged.on(async (events) => {
        if (settings["h" /* currentImportingBackup */].value)
            return;
        const mine = await Object(IdentityService["queryMyProfiles"])();
        for (const e of events) {
            appendShare((rec) => !!e.after && mine.some((q) => rec.postBy.equals(q.identifier)) && rec.recipients.has(e.of), (rec) => ({ share: [e.of], whoAmI: rec.postBy, reason: { type: 'auto-share', at: new Date() } }));
        }
    });
}

// EXTERNAL MODULE: ./packages/maskbook/src/crypto/crypto-alpha-40.ts
var crypto_alpha_40 = __webpack_require__(111);

// EXTERNAL MODULE: ./packages/maskbook/src/crypto/crypto-alpha-39.ts
var crypto_alpha_39 = __webpack_require__(269);

// EXTERNAL MODULE: ./packages/maskbook/src/crypto/crypto-alpha-38.ts
var crypto_alpha_38 = __webpack_require__(271);

// EXTERNAL MODULE: ./packages/maskbook/src/database/avatar.ts
var avatar = __webpack_require__(222);

// EXTERNAL MODULE: ./packages/maskbook/src/database/group.ts
var database_group = __webpack_require__(169);

// EXTERNAL MODULE: ./packages/maskbook/src/database/type.ts
var type = __webpack_require__(4);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/worker.ts
var worker = __webpack_require__(102);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/flags.ts
var flags = __webpack_require__(34);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/utils.ts
var utils = __webpack_require__(12);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/options-page/Route.ts
var Route = __webpack_require__(78);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/options-page/SetupStep.ts
var SetupStep = __webpack_require__(115);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/Welcome/getWelcomePageURL.tsx




function getWelcomePageURL() {
    if (false) {}
    else if (flags["a" /* Flags */].has_no_browser_tab_ui) {
        return Object(utils["i" /* getUrl */])(`index.html#${Route["a" /* DashboardRoute */].Nav}`);
    }
    else {
        return Object(utils["i" /* getUrl */])(`index.html#${Route["a" /* DashboardRoute */].Setup}/${SetupStep["a" /* SetupStep */].ConsentDataCollection}`);
    }
}

// EXTERNAL MODULE: ./packages/maskbook/src/extension/content-script/tasks.ts
var tasks = __webpack_require__(103);

// CONCATENATED MODULE: ./packages/maskbook/src/background-service.ts



// @ts-ignore

Object.defineProperty(globalThis, 'crypto', { configurable: true, enumerable: true, get: () => index_es["a" /* crypto */] });















__webpack_require__.e(/* import() */ 189).then(__webpack_require__.bind(null, 1872));

Object.assign(globalThis, { tasks: tasks["a" /* default */] });
if (false) {}
if (Object(Context["g" /* isEnvironment */])(Context["a" /* Environment */].ManifestBackground)) {
    const injectedScript = getInjectedScript();
    const contentScripts = [];
    const contentScriptReady = fetch('generated__content__script.html')
        .then((x) => x.text())
        .then((html) => {
        const parser = new DOMParser();
        const root = parser.parseFromString(html, 'text/html');
        root.querySelectorAll('script').forEach((script) => {
            if (script.innerText)
                contentScripts.push({ code: script.innerText });
            else if (script.src)
                contentScripts.push({ file: new URL(script.src, browser.runtime.getURL('')).pathname });
        });
    });
    browser.webNavigation.onCommitted.addListener(async (arg) => {
        if (arg.url === 'about:blank')
            return;
        if (!arg.url.startsWith('http'))
            return;
        const contains = await browser.permissions.contains({ origins: [arg.url] });
        if (!contains)
            return;
        /**
         * For iOS App, there is a special way to do it in the manifest.json
         * A `iOS-injected-scripts` field is used to add extra scripts
         */
        if (!flags["a" /* Flags */].support_native_injected_script_declaration && !flags["a" /* Flags */].requires_injected_script_run_directly) {
            browser.tabs
                .executeScript(arg.tabId, {
                runAt: 'document_start',
                frameId: arg.frameId,
                // Refresh the injected script every time in the development mode.
                code:  false ? undefined : await injectedScript,
            })
                .catch(IgnoreError(arg));
        }
        if (flags["a" /* Flags */].requires_injected_script_run_directly) {
            browser.tabs.executeScript(arg.tabId, {
                runAt: 'document_start',
                frameId: arg.frameId,
                file: 'js/injected-script.js',
            });
        }
        await contentScriptReady;
        for (const script of contentScripts) {
            const option = {
                runAt: 'document_idle',
                frameId: arg.frameId,
                ...script,
            };
            try {
                await browser.tabs.executeScript(arg.tabId, option);
            }
            catch (e) {
                IgnoreError(option)(e);
            }
        }
    });
    browser.runtime.onInstalled.addListener((detail) => {
        if (flags["a" /* Flags */].has_native_welcome_ui)
            return;
        if (detail.reason === 'install') {
            browser.tabs.create({ url: getWelcomePageURL() });
        }
    });
}
async function getInjectedScript() {
    try {
        return `{
        const script = document.createElement('script')
        script.innerHTML = ${await fetch('js/injected-script.js')
            .then((x) => x.text())
            .then(JSON.stringify)}
        document.documentElement.appendChild(script)
    }`;
    }
    catch (e) {
        console.error(e);
        return `console.log('Injected script failed to load.')`;
    }
}
function IgnoreError(arg) {
    return (e) => {
        const ignoredErrorMessages = ['non-structured-clonable data'];
        if (ignoredErrorMessages.some((x) => e.message.includes(x))) {
            // It's okay we don't need the result, happened on Firefox
        }
        else
            console.error('Inject error', e.message, arg, Object.entries(e));
    };
}
console.log('Build info', {
    NODE_ENV: "production",
    VERSION: "v1.19.3-92-g86902195",
    TAG_NAME: "v1.19.4",
    COMMIT_HASH: "86902195",
    COMMIT_DATE: "2020-11-26T05:08:18.000Z",
    BUILD_DATE: "2020-11-26T05:15:09.270Z",
    REMOTE_URL: "git@github.com:DimensionDev/Maskbook.git",
    BRANCH_NAME: "master",
    DIRTY: false,
    TAG_DIRTY: true,
});
// Friendly to debug
Object.assign(window, {
    definedSocialNetworkWorkers: worker["b" /* definedSocialNetworkWorkers */],
    crypto40: crypto_alpha_40,
    crypto39: crypto_alpha_39,
    crypto38: crypto_alpha_38,
    db: {
        avatar: avatar,
        group: database_group,
        persona: Persona_db,
        personaHelper: helpers,
        type: type,
        post: database_post,
    },
});
initAutoShareToFriends();


/***/ }),

/***/ 169:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GroupDBAccess", function() { return GroupDBAccess; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createUserGroupDatabase", function() { return createUserGroupDatabase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createOrUpdateUserGroupDatabase", function() { return createOrUpdateUserGroupDatabase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "deleteUserGroupDatabase", function() { return deleteUserGroupDatabase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateUserGroupDatabase", function() { return updateUserGroupDatabase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryUserGroupDatabase", function() { return queryUserGroupDatabase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryUserGroupsDatabase", function() { return queryUserGroupsDatabase; });
/* harmony import */ var idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(179);
/* harmony import */ var idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _type__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);
/* harmony import */ var _utils_messages__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(55);
/* harmony import */ var _utils_type__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(180);
/* harmony import */ var _helpers_openDB__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(66);
/// <reference path="./global.d.ts" />





//#endregion
const db = Object(_helpers_openDB__WEBPACK_IMPORTED_MODULE_4__[/* createDBAccess */ "a"])(() => {
    return Object(idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0__["openDB"])('maskbook-user-groups', 1, {
        upgrade(db, oldVersion, newVersion, transaction) {
            // Out line keys
            db.createObjectStore('groups', { keyPath: 'identifier' });
            transaction.objectStore('groups').createIndex('network', 'network', { unique: false });
        },
    });
});
const GroupDBAccess = db;
/**
 * This function create a new user group
 * It will return a GroupIdentifier
 * @param group GroupIdentifier
 * @param groupName
 */
async function createUserGroupDatabase(group, groupName, t) {
    t = t || (await db()).transaction('groups', 'readwrite');
    await t.objectStore('groups').put({
        groupName,
        identifier: group.toText(),
        members: [],
        network: group.network,
    });
}
async function createOrUpdateUserGroupDatabase(group, type, t) {
    t = t || (await db()).transaction('groups', 'readwrite');
    if (await queryUserGroupDatabase(group.identifier, t))
        return updateUserGroupDatabase(group, type, t);
    else
        return createUserGroupDatabase(group.identifier, group.groupName, t);
}
/**
 * Delete a user group that stored in the Maskbook
 * @param group Group ID
 */
async function deleteUserGroupDatabase(group, t) {
    t = t || (await db()).transaction('groups', 'readwrite');
    await t.objectStore('groups').delete(group.toText());
}
/**
 * Update a user group that stored in the Maskbook
 * @param group Group ID
 * @param type
 */
async function updateUserGroupDatabase(group, type, t) {
    t = t || (await db()).transaction('groups', 'readwrite');
    const orig = await queryUserGroupDatabase(group.identifier, t);
    if (!orig)
        throw new TypeError('User group not found');
    let nextRecord;
    const nonDuplicateNewMembers = [];
    if (type === 'replace') {
        nextRecord = { ...orig, ...group };
    }
    else if (type === 'append') {
        const nextMembers = new Set();
        for (const i of orig.members) {
            nextMembers.add(i.toText());
        }
        for (const i of group.members || []) {
            if (!nextMembers.has(i.toText())) {
                nextMembers.add(i.toText());
                nonDuplicateNewMembers.push(i);
            }
        }
        nextRecord = {
            identifier: group.identifier,
            banned: !orig.banned && !group.banned ? undefined : [...(orig.banned || []), ...(group.banned || [])],
            groupName: group.groupName || orig.groupName,
            members: Array.from(nextMembers)
                .map((x) => _type__WEBPACK_IMPORTED_MODULE_1__["Identifier"].fromString(x, _type__WEBPACK_IMPORTED_MODULE_1__["ProfileIdentifier"]))
                .filter((x) => x.ok)
                .map((x) => x.val),
        };
    }
    else {
        nextRecord = type(orig) || orig;
    }
    await t.objectStore('groups').put(GroupRecordIntoDB(nextRecord));
    if ( true && nonDuplicateNewMembers.length) {
        _utils_messages__WEBPACK_IMPORTED_MODULE_2__[/* MaskMessage */ "a"].events.profileJoinedGroup.sendToAll({
            group: group.identifier,
            newMembers: nonDuplicateNewMembers,
        });
    }
}
/**
 * Query a user group that stored in the Maskbook
 * @param group Group ID
 */
async function queryUserGroupDatabase(group, t) {
    t = t || (await db()).transaction('groups', 'readonly');
    const result = await t.objectStore('groups').get(group.toText());
    if (!result)
        return null;
    return GroupRecordOutDB(result);
}
/**
 * Query user groups that stored in the Maskbook
 * @param query Query ID
 */
async function queryUserGroupsDatabase(query, t) {
    t = t || (await db()).transaction('groups');
    const result = [];
    if (typeof query === 'function') {
        for await (const { value, key } of t.store) {
            const identifier = _type__WEBPACK_IMPORTED_MODULE_1__["Identifier"].fromString(key, _type__WEBPACK_IMPORTED_MODULE_1__["GroupIdentifier"]);
            if (identifier.err) {
                console.warn('Invalid identifier', key);
                continue;
            }
            if (query(identifier.val, value))
                result.push(value);
        }
    }
    else {
        result.push(...(await t.objectStore('groups').index('network').getAll(IDBKeyRange.only(query.network))));
    }
    return result.map(GroupRecordOutDB);
}
function GroupRecordOutDB(x) {
    return {
        ...x,
        identifier: _type__WEBPACK_IMPORTED_MODULE_1__["Identifier"].fromString(x.identifier, _type__WEBPACK_IMPORTED_MODULE_1__["GroupIdentifier"]).unwrap(),
        members: Object(_utils_type__WEBPACK_IMPORTED_MODULE_3__[/* restorePrototypeArray */ "b"])(x.members, _type__WEBPACK_IMPORTED_MODULE_1__["ProfileIdentifier"].prototype),
        banned: Object(_utils_type__WEBPACK_IMPORTED_MODULE_3__[/* restorePrototypeArray */ "b"])(x.banned, _type__WEBPACK_IMPORTED_MODULE_1__["ProfileIdentifier"].prototype),
    };
}
function GroupRecordIntoDB(x) {
    return {
        ...x,
        identifier: x.identifier.toText(),
        network: x.identifier.network,
    };
}


/***/ }),

/***/ 170:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* reexport */ methods; });

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/CryptoKey-JsonWebKey.ts
var CryptoKey_JsonWebKey = __webpack_require__(88);

// CONCATENATED MODULE: ./packages/maskbook/src/modules/CryptoAlgorithm/WebCrypto.ts

/**
 * AES-GCM & pbkdf2 related algorithms are WebCrypto supported
 * so it is safe to run it on the main thread (browser will make it async)
 */
const WebCryptoMethods = {
    async encrypt_aes_gcm(jwk, iv, message) {
        const key = await Object(CryptoKey_JsonWebKey["b" /* JsonWebKeyToCryptoKey */])(jwk, ...Object(CryptoKey_JsonWebKey["c" /* getKeyParameter */])('aes'));
        return crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, message);
    },
    async decrypt_aes_gcm(jwk, iv, message) {
        const key = await Object(CryptoKey_JsonWebKey["b" /* JsonWebKeyToCryptoKey */])(jwk, ...Object(CryptoKey_JsonWebKey["c" /* getKeyParameter */])('aes'));
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, message);
    },
    async generate_aes_gcm(length = 256) {
        const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length }, true, ['encrypt', 'decrypt']);
        return Object(CryptoKey_JsonWebKey["a" /* CryptoKeyToJsonWebKey */])(key);
    },
    async derive_aes_from_pbkdf2(pbkdf, salt, hash, aes_algr, aes_length, iterations) {
        // In the test environment, there is no CryptoKey object.
        if (true)
            if (!(pbkdf instanceof CryptoKey))
                throw new TypeError('Expect PBKDF2UnknownKey to be a CryptoKey at runtime');
        const aes = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash }, pbkdf, { name: aes_algr, length: aes_length }, true, ['encrypt', 'decrypt']);
        return Object(CryptoKey_JsonWebKey["a" /* CryptoKeyToJsonWebKey */])(aes);
    },
    digest_sha(alg, data) {
        return crypto.subtle.digest(alg, data);
    },
    async import_pbkdf2(seed) {
        const key = await crypto.subtle.importKey('raw', seed, 'PBKDF2', false, ['deriveBits', 'deriveKey']);
        // In the WebCrypto spec, it is not exportable. We choose CryptoKey as our PBKDF2UnknownKey
        return key;
    },
    async aes_to_raw(aes, name = 'AES-GCM', length = 256) {
        const cryptoKey = await crypto.subtle.importKey('jwk', aes, { name, length }, true, [
            ...Object(CryptoKey_JsonWebKey["c" /* getKeyParameter */])('aes')[0],
        ]);
        return crypto.subtle.exportKey('raw', cryptoKey);
    },
    async raw_to_aes(raw, name = 'AES-GCM', length = 256) {
        const cryptoKey = await crypto.subtle.importKey('raw', raw, { name, length }, true, [
            ...Object(CryptoKey_JsonWebKey["c" /* getKeyParameter */])('aes')[0],
        ]);
        return (await crypto.subtle.exportKey('jwk', cryptoKey));
    },
};

// EXTERNAL MODULE: ./packages/maskbook/src/utils/mnemonic-code/index.ts
var mnemonic_code = __webpack_require__(299);

// CONCATENATED MODULE: ./packages/maskbook/src/modules/CryptoAlgorithm/EllipticBackend/methods.ts



if (true) {
    __webpack_require__.e(/* import() */ 162).then(__webpack_require__.bind(null, 1684));
}
const ECDH = Object(CryptoKey_JsonWebKey["c" /* getKeyParameter */])('ecdh')[0];
const ECDSA = Object(CryptoKey_JsonWebKey["c" /* getKeyParameter */])('ecdsa')[0];
function initEllipticBackend(_) {
    return {
        async generate_ec_k256_pair() {
            const { privateKey, publicKey } = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'K-256' }, true, [...ECDH]);
            return {
                privateKey: await Object(CryptoKey_JsonWebKey["a" /* CryptoKeyToJsonWebKey */])(privateKey),
                publicKey: await Object(CryptoKey_JsonWebKey["a" /* CryptoKeyToJsonWebKey */])(publicKey),
            };
        },
        async derive_aes_from_ecdh_k256(priv, pub, aes = 'AES-GCM', length = 256) {
            const key = await crypto.subtle.deriveKey({ name: 'ECDH', public: await Object(CryptoKey_JsonWebKey["b" /* JsonWebKeyToCryptoKey */])(pub, ...Object(CryptoKey_JsonWebKey["c" /* getKeyParameter */])('ecdh')) }, await Object(CryptoKey_JsonWebKey["b" /* JsonWebKeyToCryptoKey */])(priv, ...Object(CryptoKey_JsonWebKey["c" /* getKeyParameter */])('ecdh')), { name: aes, length }, true, ['encrypt', 'decrypt']);
            return Object(CryptoKey_JsonWebKey["a" /* CryptoKeyToJsonWebKey */])(key);
        },
        async generate_ecdh_k256_from_mnemonic(password) {
            return _helper(await Object(mnemonic_code["a" /* generate_ECDH_256k1_KeyPair_ByMnemonicWord */])(password));
        },
        async recover_ecdh_k256_from_mnemonic(words, password) {
            return _helper(await Object(mnemonic_code["b" /* recover_ECDH_256k1_KeyPair_ByMnemonicWord */])(words, password));
        },
    };
}
async function _helper(x) {
    const { key: { privateKey, publicKey }, mnemonicRecord: { parameter: { path, withPassword }, words, }, password, } = x;
    return {
        mnemonic_words: words,
        parameter_path: path,
        parameter_with_password: withPassword,
        password,
        privateKey,
        publicKey,
    };
}
/* harmony default export */ var methods = ({
    ...WebCryptoMethods,
    ...initEllipticBackend(WebCryptoMethods),
});

// CONCATENATED MODULE: ./packages/maskbook/src/modules/workers.ts



/***/ }),

/***/ 180:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return restorePrototype; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return restorePrototypeArray; });
function restorePrototype(obj, prototype) {
    if (!obj)
        return obj;
    Object.setPrototypeOf(obj, prototype);
    return obj;
}
function restorePrototypeArray(obj, prototype) {
    if (!obj)
        return obj;
    obj.forEach((x) => Object.setPrototypeOf(x, prototype));
    return obj;
}


/***/ }),

/***/ 181:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PostDBAccess", function() { return PostDBAccess; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createPostDB", function() { return createPostDB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updatePostDB", function() { return updatePostDB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createOrUpdatePostDB", function() { return createOrUpdatePostDB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryPostDB", function() { return queryPostDB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryPostsDB", function() { return queryPostsDB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "deletePostCryptoKeyDB", function() { return deletePostCryptoKeyDB; });
/* harmony import */ var _type__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);
/* harmony import */ var idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(179);
/* harmony import */ var idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_type__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(180);
/* harmony import */ var _IdentifierMap__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(82);
/* harmony import */ var _helpers_openDB__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(66);
/* harmony import */ var _utils_type_transform_CryptoKey_JsonWebKey__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(88);
/// <reference path="./global.d.ts" />






const db = Object(_helpers_openDB__WEBPACK_IMPORTED_MODULE_4__[/* createDBAccessWithAsyncUpgrade */ "b"])(4, 5, (currentTryOpen, knowledge) => Object(idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_1__["openDB"])('maskbook-post-v2', currentTryOpen, {
    async upgrade(db, oldVersion, _newVersion, transaction) {
        /**
         * A type assert that make sure a and b are the same type
         * @param a The latest version PostRecord
         */
        function _assert(a, b) {
            a = b;
            b = a;
        }
        // Prevent unused code removal
        if (false)
            {}
        if (oldVersion < 1) {
            // inline keys
            return void db.createObjectStore('post', { keyPath: 'identifier' });
        }
        /**
         * In the version 1 we use PostIdentifier to store post that identified by post iv
         * After upgrade to version 2, we use PostIVIdentifier to store it.
         * So we transform all old data into new data.
         */
        if (oldVersion <= 1) {
            const store = transaction.objectStore('post');
            const old = await store.getAll();
            await store.clear();
            for (const each of old) {
                const id = _type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(each.identifier, _type__WEBPACK_IMPORTED_MODULE_0__["PostIdentifier"]);
                if (id.ok) {
                    const { postId, identifier } = id.val;
                    each.identifier = new _type__WEBPACK_IMPORTED_MODULE_0__["PostIVIdentifier"](identifier.network, postId).toText();
                    await store.add(each);
                }
            }
        }
        /**
         * In the version 2 we use `recipients?: ProfileIdentifier[]`
         * After upgrade to version 3, we use `recipients: Record<string, RecipientDetail>`
         */
        if (oldVersion <= 2) {
            const store = transaction.objectStore('post');
            for await (const cursor of store) {
                const v2record = cursor.value;
                const oldType = v2record.recipients;
                oldType && Object(_utils_type__WEBPACK_IMPORTED_MODULE_2__[/* restorePrototypeArray */ "b"])(oldType, _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"].prototype);
                const newType = {};
                if (oldType !== undefined)
                    for (const each of oldType) {
                        newType[each.toText()] = { reason: [{ type: 'direct', at: new Date(0) }] };
                    }
                const next = {
                    ...v2record,
                    recipients: newType,
                    postBy: _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"].unknown,
                    foundAt: new Date(0),
                    recipientGroups: [],
                };
                await cursor.update(next);
            }
        }
        /**
         * In the version 3 we use `recipients?: Record<string, RecipientDetail>`
         * After upgrade to version 4, we use `recipients: IdentifierMap<ProfileIdentifier, RecipientDetail>`
         */
        if (oldVersion <= 3) {
            const store = transaction.objectStore('post');
            for await (const cursor of store) {
                const v3Record = cursor.value;
                const newType = new Map();
                for (const [key, value] of Object.entries(v3Record.recipients)) {
                    newType.set(key, value);
                }
                const v4Record = {
                    ...v3Record,
                    recipients: newType,
                };
                await cursor.update(v4Record);
            }
        }
        /**
         * In version 4 we use CryptoKey, in version 5 we use JsonWebKey
         */
        if (oldVersion <= 4) {
            const store = transaction.objectStore('post');
            for await (const cursor of store) {
                const v4Record = cursor.value;
                const data = knowledge === null || knowledge === void 0 ? void 0 : knowledge.data;
                if (!v4Record.postCryptoKey)
                    continue;
                const v5Record = {
                    ...v4Record,
                    postCryptoKey: data.get(v4Record.identifier),
                };
                if (!v5Record.postCryptoKey)
                    delete v5Record.postCryptoKey;
                await cursor.update(v5Record);
            }
        }
    },
}), async (db) => {
    if (db.version === 4) {
        const map = new Map();
        const knowledge = { version: 4, data: map };
        const records = await Object(_helpers_openDB__WEBPACK_IMPORTED_MODULE_4__[/* createTransaction */ "c"])(db, 'readonly')('post').objectStore('post').getAll();
        for (const r of records) {
            const x = r.postCryptoKey;
            if (!x)
                continue;
            try {
                const key = await Object(_utils_type_transform_CryptoKey_JsonWebKey__WEBPACK_IMPORTED_MODULE_5__[/* CryptoKeyToJsonWebKey */ "a"])(x);
                map.set(r.identifier, key);
            }
            catch {
                continue;
            }
        }
        return knowledge;
    }
    return undefined;
});
const PostDBAccess = db;
async function createPostDB(record, t) {
    t = t || (await db()).transaction('post', 'readwrite');
    const toSave = postToDB(record);
    await t.objectStore('post').add(toSave);
}
async function updatePostDB(updateRecord, mode, t) {
    t = t || (await db()).transaction('post', 'readwrite');
    const emptyRecord = {
        identifier: updateRecord.identifier,
        recipients: new _IdentifierMap__WEBPACK_IMPORTED_MODULE_3__[/* IdentifierMap */ "a"](new Map()),
        postBy: _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"].unknown,
        foundAt: new Date(),
        recipientGroups: [],
    };
    const currentRecord = (await queryPostDB(updateRecord.identifier, t)) || emptyRecord;
    const nextRecord = { ...currentRecord, ...updateRecord };
    const nextRecipients = mode === 'override' ? postToDB(nextRecord).recipients : postToDB(currentRecord).recipients;
    if (mode === 'append') {
        if (updateRecord.recipients) {
            for (const [id, patchDetail] of updateRecord.recipients) {
                const idText = id.toText();
                if (nextRecipients.has(idText)) {
                    const { reason, ...rest } = patchDetail;
                    const nextDetail = nextRecipients.get(idText);
                    Object.assign(nextDetail, rest);
                    nextDetail.reason = [...nextDetail.reason, ...patchDetail.reason];
                }
                else {
                    nextRecipients.set(idText, patchDetail);
                }
            }
        }
    }
    const nextRecordInDBType = postToDB(nextRecord);
    await t.objectStore('post').put(nextRecordInDBType);
}
async function createOrUpdatePostDB(record, mode, t) {
    t = t || (await db()).transaction('post', 'readwrite');
    if (await t.objectStore('post').get(record.identifier.toText()))
        return updatePostDB(record, mode, t);
    else
        return createPostDB(record, t);
}
async function queryPostDB(record, t) {
    t = t || (await db()).transaction('post');
    const result = await t.objectStore('post').get(record.toText());
    if (result)
        return postOutDB(result);
    return null;
}
async function queryPostsDB(query, t) {
    t = t || (await db()).transaction('post');
    const selected = [];
    for await (const { value } of t.store) {
        const idResult = _type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(value.identifier, _type__WEBPACK_IMPORTED_MODULE_0__["PostIVIdentifier"]);
        if (idResult.err) {
            console.warn(idResult.val.message);
            continue;
        }
        const id = idResult.val;
        if (typeof query === 'string') {
            if (id.network === query)
                selected.push(postOutDB(value));
        }
        else {
            const v = postOutDB(value);
            if (query(v, id))
                selected.push(v);
        }
    }
    return selected;
}
async function deletePostCryptoKeyDB(record, t) {
    t = t || (await db()).transaction('post', 'readwrite');
    await t.objectStore('post').delete(record.toText());
}
//#region db in and out
function postOutDB(db) {
    const { identifier, foundAt, postBy, recipientGroups, recipients, postCryptoKey } = db;
    for (const detail of recipients.values()) {
        detail.reason.forEach((x) => x.type === 'group' && Object(_utils_type__WEBPACK_IMPORTED_MODULE_2__[/* restorePrototype */ "a"])(x.group, _type__WEBPACK_IMPORTED_MODULE_0__["GroupIdentifier"].prototype));
    }
    return {
        identifier: _type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(identifier, _type__WEBPACK_IMPORTED_MODULE_0__["PostIVIdentifier"]).unwrap(),
        recipientGroups: Object(_utils_type__WEBPACK_IMPORTED_MODULE_2__[/* restorePrototypeArray */ "b"])(recipientGroups, _type__WEBPACK_IMPORTED_MODULE_0__["GroupIdentifier"].prototype),
        postBy: Object(_utils_type__WEBPACK_IMPORTED_MODULE_2__[/* restorePrototype */ "a"])(postBy, _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"].prototype),
        recipients: new _IdentifierMap__WEBPACK_IMPORTED_MODULE_3__[/* IdentifierMap */ "a"](recipients, _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]),
        foundAt: foundAt,
        postCryptoKey: postCryptoKey,
    };
}
function postToDB(out) {
    return {
        ...out,
        identifier: out.identifier.toText(),
        recipients: out.recipients.__raw_map__,
    };
}
//#endregion


/***/ }),

/***/ 222:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createAvatarDBAccess", function() { return createAvatarDBAccess; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "storeAvatarDB", function() { return storeAvatarDB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryAvatarDB", function() { return queryAvatarDB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateAvatarMetaDB", function() { return updateAvatarMetaDB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryAvatarOutdatedDB", function() { return queryAvatarOutdatedDB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isAvatarOutdatedDB", function() { return isAvatarOutdatedDB; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "deleteAvatarsDB", function() { return deleteAvatarsDB; });
/* harmony import */ var idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(179);
/* harmony import */ var idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _type__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);
/* harmony import */ var _helpers_openDB__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(66);
/// <reference path="./global.d.ts" />



//#endregion
const db = Object(_helpers_openDB__WEBPACK_IMPORTED_MODULE_2__[/* createDBAccess */ "a"])(() => {
    return Object(idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0__["openDB"])('maskbook-avatar-cache', 1, {
        upgrade(db, oldVersion, newVersion, transaction) {
            // Out line keys
            const avatarStore = db.createObjectStore('avatars');
            const metadataStore = db.createObjectStore('metadata', { keyPath: 'identifier' });
        },
    });
});
const createAvatarDBAccess = db;
/**
 * Store avatar into database
 */
async function storeAvatarDB(id, avatar) {
    const meta = {
        identifier: id.toText(),
        lastUpdateTime: new Date(),
        lastAccessTime: new Date(),
    };
    const t = (await db()).transaction(['avatars', 'metadata'], 'readwrite');
    await t.objectStore('avatars').put(avatar, id.toText());
    await t.objectStore('metadata').put(meta);
    return;
}
/**
 * Read avatar out
 */
async function queryAvatarDB(id) {
    const t = (await db()).transaction('avatars');
    const result = await t.objectStore('avatars').get(id.toText());
    if (result) {
        updateAvatarMetaDB(id, { lastAccessTime: new Date() }).catch((e) => {
            console.warn('Update last use record failed', e);
        });
    }
    return result || null;
}
/**
 * Store avatar metadata
 */
async function updateAvatarMetaDB(id, newMeta) {
    const t = (await db()).transaction('metadata', 'readwrite');
    const meta = await t.objectStore('metadata').get(id.toText());
    const newRecord = Object.assign({}, meta, newMeta);
    await t.objectStore('metadata').put(newRecord);
}
/**
 * Find avatar lastUpdateTime or lastAccessTime out-of-date
 * @param attribute - Which attribute want to query
 * @param deadline - Select all identifiers before a date
 * defaults to 14 days for lastAccessTime
 * defaults to 7 days for lastUpdateTime
 */
async function queryAvatarOutdatedDB(attribute, t, deadline = new Date(Date.now() - 1000 * 60 * 60 * 24 * (attribute === 'lastAccessTime' ? 14 : 7))) {
    t = Object(_helpers_openDB__WEBPACK_IMPORTED_MODULE_2__[/* createTransaction */ "c"])(await db(), 'readonly')('metadata');
    const outdated = [];
    for await (const { value } of t.objectStore('metadata')) {
        if (deadline > value[attribute]) {
            const id = _type__WEBPACK_IMPORTED_MODULE_1__["Identifier"].fromString(value.identifier);
            if (id.err)
                continue;
            outdated.push(id.val);
        }
    }
    return outdated;
}
/**
 * Query if the avatar is outdated
 * @param attribute - Which attribute want to query
 * @param deadline - Select all identifiers before a date
 * defaults to 30 days for lastAccessTime
 * defaults to 7 days for lastUpdateTime
 */
async function isAvatarOutdatedDB(identifier, attribute, deadline = new Date(Date.now() - 1000 * 60 * 60 * 24 * (attribute === 'lastAccessTime' ? 30 : 7))) {
    const t = (await db()).transaction('metadata');
    const meta = await t.objectStore('metadata').get(identifier.toText());
    if (!meta)
        return true;
    if (deadline > meta[attribute])
        return true;
    return false;
}
/**
 * Batch delete avatars
 */
async function deleteAvatarsDB(ids, t) {
    t = Object(_helpers_openDB__WEBPACK_IMPORTED_MODULE_2__[/* createTransaction */ "c"])(await db(), 'readwrite')('avatars', 'metadata');
    for (const id of ids) {
        t.objectStore('avatars').delete(id.toText());
        t.objectStore('metadata').delete(id.toText());
    }
    return;
}


/***/ }),

/***/ 230:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return createFriendsGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return createDefaultFriendsGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return addProfileToFriendsGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return removeProfileFromFriendsGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return queryUserGroups; });
/* harmony import */ var _group__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(169);
/* harmony import */ var _type__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);


function createFriendsGroup(who, groupId) {
    return Object(_group__WEBPACK_IMPORTED_MODULE_0__["createUserGroupDatabase"])(_type__WEBPACK_IMPORTED_MODULE_1__["GroupIdentifier"].getFriendsGroupIdentifier(who, groupId), 
    // Put the raw special name in, then UI can display in their own language.
    groupId);
}
function createDefaultFriendsGroup(who) {
    return createFriendsGroup(who, _type__WEBPACK_IMPORTED_MODULE_1__["PreDefinedVirtualGroupNames"].friends);
}
async function addProfileToFriendsGroup(group, newMembers) {
    const memberList = newMembers.map((x) => (x instanceof _type__WEBPACK_IMPORTED_MODULE_1__["ProfileIdentifier"] ? x : x.identifier));
    await Object(_group__WEBPACK_IMPORTED_MODULE_0__["updateUserGroupDatabase"])({ identifier: group, members: memberList }, 'append');
}
function removeProfileFromFriendsGroup(group, removedFriend) {
    const friendList = removedFriend.map((x) => (x instanceof _type__WEBPACK_IMPORTED_MODULE_1__["ProfileIdentifier"] ? x : x.identifier));
    return Object(_group__WEBPACK_IMPORTED_MODULE_0__["updateUserGroupDatabase"])({ identifier: group }, (r) => {
        r.members = r.members.filter((x) => !friendList.some((y) => y.equals(x)));
    });
}
function queryUserGroups(network) {
    return Object(_group__WEBPACK_IMPORTED_MODULE_0__["queryUserGroupsDatabase"])((r) => r.network === network);
}


/***/ }),

/***/ 250:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ UpgradeBackupJSONFile; });

// CONCATENATED MODULE: ./packages/maskbook/src/utils/type-transform/BackupFormat/JSON/version-1.ts
function isBackupJSONFileVersion1(obj) {
    const data = obj;
    if (data.version !== 1)
        return false;
    if (!Array.isArray(data.whoami))
        return false;
    if (!data.whoami)
        return false;
    return true;
}
// Since 8/21/2019, every backup file of version 1 should have grantedHostPermissions
// Before 8/21/2019, we only support facebook, so we can auto upgrade the backup file
const facebookHost = ['https://m.facebook.com/*', 'https://www.facebook.com/*'];
function patchNonBreakingUpgradeForBackupJSONFileVersion1(json) {
    if (json.grantedHostPermissions === undefined) {
        json.grantedHostPermissions = facebookHost;
        json.maskbookVersion = '1.5.2';
    }
    if (!json.maskbookVersion)
        json.maskbookVersion = '1.6.0';
    return json;
}
function upgradeFromBackupJSONFileVersion0(json, identity) {
    return {
        maskbookVersion: '1.3.2',
        version: 1,
        whoami: [
            {
                localKey: json.local,
                network: 'facebook.com',
                publicKey: json.key.key.publicKey,
                privateKey: json.key.key.privateKey,
                userId: identity.userId || '$self',
            },
        ],
        grantedHostPermissions: facebookHost,
    };
}

// CONCATENATED MODULE: ./packages/maskbook/src/utils/type-transform/BackupFormat/JSON/version-0.ts
/* eslint-disable import/no-deprecated */
// eslint-disable-next-line import/no-deprecated
function isBackupJSONFileVersion0(obj) {
    // eslint-disable-next-line import/no-deprecated
    const data = obj;
    if (!data.local || !data.key || !data.key.key || !data.key.key.privateKey || !data.key.key.publicKey)
        return false;
    return true;
}

// EXTERNAL MODULE: ./packages/maskbook/src/database/type.ts
var type = __webpack_require__(4);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/type-transform/BackupFormat/JSON/version-2.ts

function isBackupJSONFileVersion2(obj) {
    var _a, _b, _c, _d;
    return (((_b = (_a = obj) === null || _a === void 0 ? void 0 : _a._meta_) === null || _b === void 0 ? void 0 : _b.version) === 2 &&
        ((_d = (_c = obj) === null || _c === void 0 ? void 0 : _c._meta_) === null || _d === void 0 ? void 0 : _d.type) === 'maskbook-backup');
}
function upgradeFromBackupJSONFileVersion1(json) {
    var _a;
    const personas = [];
    const profiles = [];
    const userGroups = [];
    function addPersona(record) {
        const prev = personas.find((x) => x.identifier === record.identifier);
        if (prev) {
            Object.assign(prev, record);
            prev.linkedProfiles.push(...record.linkedProfiles);
        }
        else
            personas.push({ ...record, updatedAt: 0, createdAt: 0 });
    }
    function addProfile(record) {
        const prev = profiles.find((x) => x.identifier === record.identifier);
        if (prev) {
            Object.assign(prev, record);
        }
        else
            profiles.push({ ...record, updatedAt: 0, createdAt: 0 });
    }
    function addProfileToGroup(member, detail) {
        const groupId = new type["GroupIdentifier"](detail.network, detail.virtualGroupOwner, detail.groupID).toText();
        const prev = userGroups.find((x) => x.identifier === groupId);
        if (prev) {
            prev.members.push(member.toText());
        }
        else {
            userGroups.push({ groupName: '', identifier: groupId, members: [] });
        }
    }
    for (const x of json.whoami) {
        const profile = new type["ProfileIdentifier"](x.network, x.userId).toText();
        const persona = type["ECKeyIdentifier"].fromJsonWebKey(x.publicKey).toText();
        addProfile({
            identifier: profile,
            linkedPersona: persona,
            localKey: x.localKey,
            nickname: x.nickname,
        });
        addPersona({
            identifier: persona,
            linkedProfiles: [[profile, { connectionConfirmState: 'confirmed' }]],
            publicKey: x.publicKey,
            privateKey: x.privateKey,
            localKey: x.localKey,
            nickname: x.nickname,
        });
    }
    for (const x of json.people || []) {
        const profile = new type["ProfileIdentifier"](x.network, x.userId);
        const persona = type["ECKeyIdentifier"].fromJsonWebKey(x.publicKey).toText();
        addProfile({
            identifier: profile.toText(),
            linkedPersona: persona,
            nickname: x.nickname,
        });
        addPersona({
            identifier: persona,
            linkedProfiles: [[profile.toText(), { connectionConfirmState: 'confirmed' }]],
            publicKey: x.publicKey,
            nickname: x.nickname,
        });
        (_a = x.groups) === null || _a === void 0 ? void 0 : _a.forEach((y) => addProfileToGroup(profile, y));
    }
    userGroups.forEach((x) => {
        x.members = Array.from(new Set(x.members));
    });
    return {
        _meta_: {
            version: 2,
            type: 'maskbook-backup',
            maskbookVersion: json.maskbookVersion,
            createdAt: 0,
        },
        posts: [],
        wallets: [],
        personas,
        profiles,
        userGroups,
        grantedHostPermissions: json.grantedHostPermissions,
    };
}
function upgradeFromBackupJSONFileVersion2(json) {
    var _a;
    json.wallets = (_a = json.wallets) !== null && _a !== void 0 ? _a : [];
    return json;
}

// CONCATENATED MODULE: ./packages/maskbook/src/utils/type-transform/BackupFormat/JSON/latest.ts
/* eslint-disable import/no-deprecated */



function UpgradeBackupJSONFile(json, identity) {
    if (isBackupJSONFileVersion2(json))
        return upgradeFromBackupJSONFileVersion2(json);
    if (isBackupJSONFileVersion1(json))
        return upgradeFromBackupJSONFileVersion1(patchNonBreakingUpgradeForBackupJSONFileVersion1(json));
    if (isBackupJSONFileVersion0(json) && identity) {
        const upgraded = upgradeFromBackupJSONFileVersion0(json, identity);
        if (upgraded === null)
            return null;
        return upgradeFromBackupJSONFileVersion1(upgraded);
    }
    return null;
}


/***/ }),

/***/ 251:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export sanitizeBackupFile */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return compressBackupFile; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return decompressBackupFile; });
/* harmony import */ var _database_type__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);
/* harmony import */ var _SECP256k1_Compression__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(148);


function sanitizeBackupFile(backup) {
    return {
        ...backup,
        grantedHostPermissions: backup.grantedHostPermissions.filter((url) => /^(http|<all_urls>)/.test(url)),
    };
}
function compressBackupFile(file, { profileIdentifier, personaIdentifier, } = {}) {
    var _a, _b, _c, _d, _e;
    const { grantedHostPermissions, profiles, personas } = file;
    const personaIdentifier_ = (_a = personaIdentifier === null || personaIdentifier === void 0 ? void 0 : personaIdentifier.toText()) !== null && _a !== void 0 ? _a : (_b = profiles.find((x) => x.identifier === (profileIdentifier === null || profileIdentifier === void 0 ? void 0 : profileIdentifier.toText()))) === null || _b === void 0 ? void 0 : _b.linkedPersona;
    const persona = personas.find((x) => x.identifier === personaIdentifier_);
    if (!persona || !persona.privateKey)
        throw new Error('Target persona not found');
    const linkedProfile = (_c = persona.linkedProfiles[0]) === null || _c === void 0 ? void 0 : _c[0];
    const profileIdentifier_ = (profileIdentifier !== null && profileIdentifier !== void 0 ? profileIdentifier : linkedProfile) ? _database_type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(linkedProfile, _database_type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]).unwrap()
        : undefined;
    const { localKey, nickname, privateKey } = persona;
    return [
        '1',
        profileIdentifier_ === null || profileIdentifier_ === void 0 ? void 0 : profileIdentifier_.network,
        profileIdentifier_ === null || profileIdentifier_ === void 0 ? void 0 : profileIdentifier_.userId,
        nickname,
        (localKey === null || localKey === void 0 ? void 0 : localKey.k) || ((_e = (_d = profiles.filter((x) => x.identifier === (profileIdentifier_ === null || profileIdentifier_ === void 0 ? void 0 : profileIdentifier_.toText())).filter((x) => x.localKey)[0]) === null || _d === void 0 ? void 0 : _d.localKey) === null || _e === void 0 ? void 0 : _e.k) ||
            '',
        Object(_SECP256k1_Compression__WEBPACK_IMPORTED_MODULE_1__[/* compressSecp256k1Key */ "a"])(privateKey, 'private'),
        grantedHostPermissions.join(';'),
    ].join('🤔');
}
function decompressBackupFile(short) {
    let compressed;
    try {
        compressed = JSON.parse(short);
        if (typeof compressed === 'object')
            return sanitizeBackupFile(compressed);
    }
    catch {
        if (!short.includes('🤔'))
            throw new Error('This backup is not a compressed string');
        compressed = short;
    }
    const [version, network, userID, nickname, localKey, privateKey, grantedHostPermissions] = compressed.split('🤔');
    if (version !== '1')
        throw new Error(`QR Code cannot be shared between different version of Maskbook`);
    const localKeyJWK = {
        alg: 'A256GCM',
        ext: true,
        k: localKey,
        key_ops: ['encrypt', 'decrypt'],
        kty: 'oct',
    };
    const publicJWK = Object(_SECP256k1_Compression__WEBPACK_IMPORTED_MODULE_1__[/* decompressSecp256k1Key */ "b"])(privateKey, 'public');
    const privateJWK = Object(_SECP256k1_Compression__WEBPACK_IMPORTED_MODULE_1__[/* decompressSecp256k1Key */ "b"])(privateKey, 'private');
    const profileID = network && userID ? new _database_type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"](network, userID) : undefined;
    const ECID = _database_type__WEBPACK_IMPORTED_MODULE_0__["ECKeyIdentifier"].fromJsonWebKey(publicJWK);
    return sanitizeBackupFile({
        _meta_: {
            createdAt: 0,
            maskbookVersion: browser.runtime.getManifest().version,
            version: 2,
            type: 'maskbook-backup',
        },
        grantedHostPermissions: grantedHostPermissions.split(';').filter(Boolean),
        posts: [],
        wallets: [],
        userGroups: [],
        personas: [
            {
                createdAt: 0,
                updatedAt: 0,
                privateKey: privateJWK,
                publicKey: publicJWK,
                identifier: ECID.toText(),
                linkedProfiles: profileID ? [[profileID.toText(), { connectionConfirmState: 'confirmed' }]] : [],
                nickname,
                localKey: localKeyJWK,
            },
        ],
        profiles: profileID
            ? [
                {
                    createdAt: 0,
                    identifier: profileID.toText(),
                    updatedAt: 0,
                    linkedPersona: ECID.toText(),
                    nickname: nickname,
                    localKey: localKeyJWK,
                },
            ]
            : [],
    });
}


/***/ }),

/***/ 266:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "profileRecordToProfile", function() { return profileRecordToProfile; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "personaRecordToPersona", function() { return personaRecordToPersona; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryProfile", function() { return queryProfile; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryProfilePaged", function() { return queryProfilePaged; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryPersona", function() { return queryPersona; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryProfilesWithQuery", function() { return queryProfilesWithQuery; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryPersonasWithQuery", function() { return queryPersonasWithQuery; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "deletePersona", function() { return deletePersona; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "renamePersona", function() { return renamePersona; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setupPersona", function() { return setupPersona; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryPersonaByProfile", function() { return queryPersonaByProfile; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryPersonaRecord", function() { return queryPersonaRecord; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryPublicKey", function() { return queryPublicKey; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryPrivateKey", function() { return queryPrivateKey; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createPersonaByMnemonic", function() { return createPersonaByMnemonic; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createPersonaByJsonWebKey", function() { return createPersonaByJsonWebKey; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createProfileWithPersona", function() { return createProfileWithPersona; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryLocalKey", function() { return queryLocalKey; });
/* harmony import */ var _type__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);
/* harmony import */ var _Persona_db__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48);
/* harmony import */ var _IdentifierMap__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(82);
/* harmony import */ var _helpers_avatar__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(442);
/* harmony import */ var _utils_mnemonic_code__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(299);
/* harmony import */ var _utils_mnemonic_code_localKeyGenerate__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(444);






async function profileRecordToProfile(record) {
    const rec = { ...record };
    const persona = rec.linkedPersona;
    delete rec.linkedPersona;
    delete rec.localKey;
    const _ = persona ? queryPersona(persona) : undefined;
    const _2 = Object(_helpers_avatar__WEBPACK_IMPORTED_MODULE_3__[/* queryAvatarDataURL */ "a"])(rec.identifier).catch(() => undefined);
    return {
        ...rec,
        linkedPersona: await _,
        avatar: await _2,
    };
}
function personaRecordToPersona(record) {
    const rec = { ...record };
    delete rec.localKey;
    // @ts-ignore
    delete rec.publicKey;
    const hasPrivateKey = !!rec.privateKey;
    delete rec.privateKey;
    return {
        ...rec,
        hasPrivateKey,
        fingerprint: rec.identifier.compressedPoint,
    };
}
/**
 * Query a Profile even it is not stored in the database.
 * @param identifier - Identifier for people want to query
 */
async function queryProfile(identifier) {
    const _ = await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["queryProfileDB"])(identifier);
    if (_)
        return profileRecordToProfile(_);
    return {
        identifier,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}
async function queryProfilePaged(...args) {
    const _ = await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["queryProfilesPagedDB"])(...args);
    return Promise.all(_.map(profileRecordToProfile));
}
/**
 * Query a persona even it is not stored in the database.
 * @param identifier - Identifier for people want to query
 */
async function queryPersona(identifier) {
    const _ = await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["queryPersonaDB"])(identifier);
    if (_)
        return personaRecordToPersona(_);
    return {
        identifier,
        createdAt: new Date(),
        updatedAt: new Date(),
        linkedProfiles: new _IdentifierMap__WEBPACK_IMPORTED_MODULE_2__[/* IdentifierMap */ "a"](new Map(), _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]),
        hasPrivateKey: false,
        fingerprint: identifier.compressedPoint,
    };
}
/**
 * Select a set of Profiles
 */
async function queryProfilesWithQuery(query) {
    const _ = await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["queryProfilesDB"])(query || ((_) => true));
    return Promise.all(_.map(profileRecordToProfile));
}
/**
 * Select a set of Personas
 */
async function queryPersonasWithQuery(query) {
    const _ = await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["queryPersonasDB"])(query || ((_) => true));
    return _.map(personaRecordToPersona);
}
async function deletePersona(id, confirm) {
    return Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["consistentPersonaDBWriteAccess"])(async (t) => {
        const d = await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["queryPersonaDB"])(id, t);
        if (!d)
            return;
        for (const e of d.linkedProfiles) {
            await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["detachProfileDB"])(e[0], t);
        }
        if (confirm === 'delete even with private')
            await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["deletePersonaDB"])(id, 'delete even with private', t);
        else if (confirm === 'safe delete')
            await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["safeDeletePersonaDB"])(id, t);
    });
}
async function renamePersona(identifier, nickname) {
    return Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["consistentPersonaDBWriteAccess"])((t) => Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["updatePersonaDB"])({ identifier, nickname }, { linkedProfiles: 'merge', explicitUndefinedField: 'ignore' }, t));
}
async function setupPersona(id) {
    return Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["consistentPersonaDBWriteAccess"])(async (t) => {
        const d = await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["queryPersonaDB"])(id, t);
        if (!d)
            throw new Error('cannot find persona');
        if (d.linkedProfiles.size === 0)
            throw new Error('persona should link at least one profile');
        if (d.uninitialized) {
            await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["updatePersonaDB"])({ identifier: id, uninitialized: false }, { linkedProfiles: 'merge', explicitUndefinedField: 'ignore' }, t);
        }
    });
}
async function queryPersonaByProfile(i) {
    return (await queryProfile(i)).linkedPersona;
}
function queryPersonaRecord(i) {
    return i instanceof _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"] ? Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["queryPersonaByProfileDB"])(i) : Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["queryPersonaDB"])(i);
}
async function queryPublicKey(i) {
    return queryPersonaRecord(i).then((x) => x === null || x === void 0 ? void 0 : x.publicKey);
}
async function queryPrivateKey(i) {
    return queryPersonaRecord(i).then((x) => x === null || x === void 0 ? void 0 : x.privateKey);
}
async function createPersonaByMnemonic(nickname, password) {
    const { key, mnemonicRecord: mnemonic } = await Object(_utils_mnemonic_code__WEBPACK_IMPORTED_MODULE_4__[/* generate_ECDH_256k1_KeyPair_ByMnemonicWord */ "a"])(password);
    const { privateKey, publicKey } = key;
    const localKey = await Object(_utils_mnemonic_code_localKeyGenerate__WEBPACK_IMPORTED_MODULE_5__[/* deriveLocalKeyFromECDHKey */ "a"])(publicKey, mnemonic.words);
    return createPersonaByJsonWebKey({
        privateKey,
        publicKey,
        localKey,
        mnemonic,
        nickname,
        uninitialized: true,
    });
}
async function createPersonaByJsonWebKey(options) {
    const identifier = _type__WEBPACK_IMPORTED_MODULE_0__["ECKeyIdentifier"].fromJsonWebKey(options.publicKey);
    const record = {
        createdAt: new Date(),
        updatedAt: new Date(),
        identifier: identifier,
        linkedProfiles: new _IdentifierMap__WEBPACK_IMPORTED_MODULE_2__[/* IdentifierMap */ "a"](new Map(), _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]),
        publicKey: options.publicKey,
        privateKey: options.privateKey,
        nickname: options.nickname,
        mnemonic: options.mnemonic,
        localKey: options.localKey,
        uninitialized: options.uninitialized,
    };
    await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["consistentPersonaDBWriteAccess"])((t) => Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["createPersonaDB"])(record, t));
    return identifier;
}
async function createProfileWithPersona(profileID, data, keys) {
    const ec_id = _type__WEBPACK_IMPORTED_MODULE_0__["ECKeyIdentifier"].fromJsonWebKey(keys.publicKey);
    const rec = {
        createdAt: new Date(),
        updatedAt: new Date(),
        identifier: ec_id,
        linkedProfiles: new _IdentifierMap__WEBPACK_IMPORTED_MODULE_2__[/* IdentifierMap */ "a"](new Map(), _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]),
        nickname: keys.nickname,
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        localKey: keys.localKey,
        mnemonic: keys.mnemonic,
    };
    await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["consistentPersonaDBWriteAccess"])(async (t) => {
        await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["createOrUpdatePersonaDB"])(rec, { explicitUndefinedField: 'ignore', linkedProfiles: 'merge' }, t);
        await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["attachProfileDB"])(profileID, ec_id, data, t);
    });
}
async function queryLocalKey(i) {
    var _a, _b;
    if (i instanceof _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]) {
        const profile = await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["queryProfileDB"])(i);
        if (!profile)
            return null;
        if (profile.localKey)
            return profile.localKey;
        if (!profile.linkedPersona)
            return null;
        return queryLocalKey(profile.linkedPersona);
    }
    else {
        return (_b = (_a = (await Object(_Persona_db__WEBPACK_IMPORTED_MODULE_1__["queryPersonaDB"])(i))) === null || _a === void 0 ? void 0 : _a.localKey) !== null && _b !== void 0 ? _b : null;
    }
}


/***/ }),

/***/ 268:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return derive_AES_GCM_256_Key_From_PBKDF2; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return derive_AES_GCM_256_Key_From_ECDH_256k1_Keys; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return split_ec_k256_keypair_into_pub_priv; });
/* harmony import */ var _workers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(170);

function derive_AES_GCM_256_Key_From_PBKDF2(pbkdf, iv, hash = 'SHA-256', iterations = 100000) {
    return _workers__WEBPACK_IMPORTED_MODULE_0__[/* CryptoWorker */ "a"].derive_aes_from_pbkdf2(pbkdf, iv, hash, 'AES-GCM', 256, iterations);
}
function derive_AES_GCM_256_Key_From_ECDH_256k1_Keys(priv, pub) {
    return _workers__WEBPACK_IMPORTED_MODULE_0__[/* CryptoWorker */ "a"].derive_aes_from_ecdh_k256(priv, pub, 'AES-GCM', 256);
}
async function split_ec_k256_keypair_into_pub_priv(key) {
    const { d, ...pub } = key;
    if (!d)
        throw new TypeError('split_ec_k256_keypair_into_pub_priv requires a private key (jwk.d)');
    // TODO: maybe should do some extra check on properties
    // @ts-expect-error Do a force transform
    return { privateKey: { ...key }, publicKey: pub };
}


/***/ }),

/***/ 269:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "generateOthersAESKeyEncrypted", function() { return generateOthersAESKeyEncrypted; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "encrypt1ToN", function() { return encrypt1ToN; });
/* harmony import */ var _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(111);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "encrypt1To1", function() { return _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["encrypt1To1"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "decryptMessage1To1", function() { return _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["decryptMessage1To1"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "decryptMessage1ToNByOther", function() { return _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["decryptMessage1ToNByOther"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "decryptMessage1ToNByMyself", function() { return _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["decryptMessage1ToNByMyself"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "extractAESKeyInMessage", function() { return _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["extractAESKeyInMessage"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "encryptWithAES", function() { return _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["encryptWithAES"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "decryptWithAES", function() { return _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["decryptWithAES"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "encryptComment", function() { return _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["encryptComment"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "decryptComment", function() { return _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["decryptComment"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "typedMessageStringify", function() { return _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["typedMessageStringify"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "typedMessageParse", function() { return _crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["typedMessageParse"]; });

/**
 * @deprecated This version of payload is not in use.
 * Please goto Crypto alpha v38
 */

async function generateOthersAESKeyEncrypted(version, AESKey, privateKeyECDH, othersPublicKeyECDH) {
    const othersPublicKeyECDH_ = othersPublicKeyECDH.map((x, index) => ({ key: x, name: index.toString() }));
    const othersAESKeyEncrypted = await Object(_crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["generateOthersAESKeyEncrypted"])(-40, AESKey, privateKeyECDH, othersPublicKeyECDH_);
    const othersAESKeyEncrypted_ = othersAESKeyEncrypted.map((key) => ({
        aesKey: key.key,
        receiverKey: othersPublicKeyECDH[parseInt(key.name, 10)],
    }));
    return othersAESKeyEncrypted_;
}
/**
 * Encrypt 1 to N
 *
 * This function is generally based on encrypt1ToN in crypto-alpha-40
 */
async function encrypt1ToN(info) {
    const othersPublicKeyECDH = info.othersPublicKeyECDH.map((x, index) => ({ key: x, name: index.toString() }));
    const { encryptedContent, iv, othersAESKeyEncrypted, ownersAESKeyEncrypted, postAESKey } = await Object(_crypto_alpha_40__WEBPACK_IMPORTED_MODULE_0__["encrypt1ToN"])({
        ...info,
        othersPublicKeyECDH,
        version: -40,
    });
    const othersAESKeyEncrypted_ = othersAESKeyEncrypted.map((key) => ({
        aesKey: key.key,
        receiverKey: othersPublicKeyECDH[parseInt(key.name, 10)].key,
    }));
    return {
        encryptedContent,
        iv,
        version: info.version,
        ownersAESKeyEncrypted,
        othersAESKeyEncrypted: othersAESKeyEncrypted_,
        postAESKey,
    };
}







/***/ }),

/***/ 271:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "publicSharedAESKey", function() { return publicSharedAESKey; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "typedMessageStringify", function() { return typedMessageStringify; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "typedMessageParse", function() { return typedMessageParse; });
/* harmony import */ var _protocols_typed_message__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(33);
/* harmony import */ var _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(269);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "generateOthersAESKeyEncrypted", function() { return _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__["generateOthersAESKeyEncrypted"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "encrypt1ToN", function() { return _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__["encrypt1ToN"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "encrypt1To1", function() { return _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__["encrypt1To1"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "decryptMessage1To1", function() { return _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__["decryptMessage1To1"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "decryptMessage1ToNByOther", function() { return _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__["decryptMessage1ToNByOther"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "decryptMessage1ToNByMyself", function() { return _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__["decryptMessage1ToNByMyself"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "extractAESKeyInMessage", function() { return _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__["extractAESKeyInMessage"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "encryptWithAES", function() { return _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__["encryptWithAES"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "decryptWithAES", function() { return _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__["decryptWithAES"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "encryptComment", function() { return _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__["encryptComment"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "decryptComment", function() { return _crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__["decryptComment"]; });



// @ts-ignore
const publicSharedAESKey = {
    alg: 'A256GCM',
    ext: true,
    k: '3Bf8BJ3ZPSMUM2jg2ThODeLuRRD_-_iwQEaeLdcQXpg',
    key_ops: ['encrypt', 'decrypt'],
    kty: 'oct',
};
/**
 * With plugin: {"payload": "data"}🧩My message
 * Without plugin: My message
 */
function typedMessageStringify(x) {
    if (!Object(_protocols_typed_message__WEBPACK_IMPORTED_MODULE_0__[/* isTypedMessageText */ "j"])(x))
        throw new Error('Not supported typed message.');
    if (!x.meta || x.meta.size === 0)
        return x.content;
    const obj = {};
    for (const [a, b] of x.meta)
        obj[a] = b;
    return JSON.stringify(obj) + '🧩' + x.content;
}
function typedMessageParse(x) {
    const [maybeMetadata, ...end] = x.split('🧩');
    try {
        const json = JSON.parse(maybeMetadata);
        if (typeof json !== 'object' || json === null || Object.keys(json).length === 0)
            throw new Error('Not a metadata');
        return Object(_protocols_typed_message__WEBPACK_IMPORTED_MODULE_0__[/* makeTypedMessageText */ "q"])(end.join('🧩'), new Map(Object.entries(json)));
    }
    catch { }
    return Object(_protocols_typed_message__WEBPACK_IMPORTED_MODULE_0__[/* makeTypedMessageText */ "q"])(x);
}


/***/ }),

/***/ 299:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return generate_ECDH_256k1_KeyPair_ByMnemonicWord; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return recover_ECDH_256k1_KeyPair_ByMnemonicWord; });
/* harmony import */ var bip39__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(231);
/* harmony import */ var bip39__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(bip39__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var wallet_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(120);
/* harmony import */ var wallet_ts__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(wallet_ts__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _type_transform_SECP256k1_Compression__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(148);
/* harmony import */ var pvtsutils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(41);
/* harmony import */ var pvtsutils__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(pvtsutils__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(62);
/* harmony import */ var _modules_CryptoAlgorithm_helper__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(268);






// Private key at m/44'/coinType'/account'/change/addressIndex
// coinType = ether
const path = "m/44'/60'/0'/0/0";
async function generate_ECDH_256k1_KeyPair_ByMnemonicWord(password) {
    const mnemonicWord = bip39__WEBPACK_IMPORTED_MODULE_0__["generateMnemonic"]();
    const seed = await bip39__WEBPACK_IMPORTED_MODULE_0__["mnemonicToSeed"](mnemonicWord, password);
    const masterKey = wallet_ts__WEBPACK_IMPORTED_MODULE_1__["HDKey"].parseMasterSeed(seed);
    const derivedKey = masterKey.derive(path);
    const key = await Object(_modules_CryptoAlgorithm_helper__WEBPACK_IMPORTED_MODULE_5__[/* split_ec_k256_keypair_into_pub_priv */ "c"])(HDKeyToJwk(derivedKey));
    return {
        key,
        password,
        mnemonicRecord: {
            parameter: { path: path, withPassword: password.length > 0 },
            words: mnemonicWord,
        },
    };
}
async function recover_ECDH_256k1_KeyPair_ByMnemonicWord(mnemonicWord, password) {
    const verify = bip39__WEBPACK_IMPORTED_MODULE_0__["validateMnemonic"](mnemonicWord);
    if (!verify) {
        console.warn('Verify error');
    }
    const seed = await bip39__WEBPACK_IMPORTED_MODULE_0__["mnemonicToSeed"](mnemonicWord, password);
    const masterKey = wallet_ts__WEBPACK_IMPORTED_MODULE_1__["HDKey"].parseMasterSeed(seed);
    const derivedKey = masterKey.derive(path);
    const key = await Object(_modules_CryptoAlgorithm_helper__WEBPACK_IMPORTED_MODULE_5__[/* split_ec_k256_keypair_into_pub_priv */ "c"])(HDKeyToJwk(derivedKey));
    return {
        key,
        password,
        mnemonicRecord: {
            parameter: { path: path, withPassword: password.length > 0 },
            words: mnemonicWord,
        },
    };
}
function HDKeyToJwk(hdk) {
    const jwk = Object(_type_transform_SECP256k1_Compression__WEBPACK_IMPORTED_MODULE_2__[/* decompressSecp256k1Key */ "b"])(Object(_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_4__[/* encodeArrayBuffer */ "c"])(hdk.publicKey), 'public');
    jwk.d = hdk.privateKey ? pvtsutils__WEBPACK_IMPORTED_MODULE_3__["Convert"].ToBase64Url(hdk.privateKey) : undefined;
    return jwk;
}


/***/ }),

/***/ 334:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return GunWorker; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GunAPI; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return GunAPISubscribe; });
/* harmony import */ var async_call_rpc_full__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(192);
/* harmony import */ var async_call_rpc_full__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(async_call_rpc_full__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var async_call_rpc_utils_web_worker__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(475);
/* harmony import */ var _utils_type_transform_Serialization__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(122);
/* harmony import */ var _web_workers_OnDemandWorker__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(345);




let GunWorker;
if (true) {
    GunWorker = new _web_workers_OnDemandWorker__WEBPACK_IMPORTED_MODULE_3__[/* OnDemandWorker */ "a"](__webpack_require__(935), { name: 'Gun' });
    // we're in webpack bundle
}
const options = {
    channel: new async_call_rpc_utils_web_worker__WEBPACK_IMPORTED_MODULE_1__[/* WorkerChannel */ "a"](GunWorker),
    serializer: _utils_type_transform_Serialization__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"],
};
const GunAPI = Object(async_call_rpc_full__WEBPACK_IMPORTED_MODULE_0__["AsyncCall"])({}, options);
const GunAPISubscribe = Object(async_call_rpc_full__WEBPACK_IMPORTED_MODULE_0__["AsyncGeneratorCall"])({}, options);


/***/ }),

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

/***/ 442:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return queryAvatarDataURL; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return storeAvatar; });
/* harmony import */ var _type__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);
/* harmony import */ var _avatar__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(222);
/* harmony import */ var _utils_memoize__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(138);
/* harmony import */ var _utils_messages__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(55);
/* harmony import */ var _utils_utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(12);





/**
 * Get a (cached) blob url for an identifier.
 * ? Because of cross-origin restrictions, we cannot use blob url here. sad :(
 */
const queryAvatarDataURL = Object(_utils_memoize__WEBPACK_IMPORTED_MODULE_2__[/* memoizePromise */ "a"])(async function (identifier) {
    const buffer = await Object(_avatar__WEBPACK_IMPORTED_MODULE_1__["queryAvatarDB"])(identifier);
    if (!buffer)
        throw new Error('Avatar not found');
    return ArrayBufferToBase64(buffer);
}, (id) => id.toText());
function ArrayBufferToBase64(buffer) {
    const f = new Blob([buffer], { type: 'image/png' });
    const fr = new FileReader();
    return new Promise((resolve) => {
        fr.onload = () => resolve(fr.result);
        fr.readAsDataURL(f);
    });
}
/**
 * Store an avatar with a url for an identifier.
 * @param identifier - This avatar belongs to.
 * @param avatar - Avatar to store. If it is a string, will try to fetch it.
 * @param force - Ignore the outdated setting. Force update.
 */
async function storeAvatar(identifier, avatar, force) {
    if (identifier instanceof _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"] && identifier.isUnknown)
        return;
    try {
        if (typeof avatar === 'string') {
            if (avatar.startsWith('http') === false)
                return;
            if (force || (await Object(_avatar__WEBPACK_IMPORTED_MODULE_1__["isAvatarOutdatedDB"])(identifier, 'lastUpdateTime'))) {
                await Object(_avatar__WEBPACK_IMPORTED_MODULE_1__["storeAvatarDB"])(identifier, await (await Object(_utils_utils__WEBPACK_IMPORTED_MODULE_4__[/* downloadUrl */ "h"])(avatar)).arrayBuffer());
            }
            // else do nothing
        }
        else {
            await Object(_avatar__WEBPACK_IMPORTED_MODULE_1__["storeAvatarDB"])(identifier, avatar);
        }
    }
    catch (e) {
        console.error('Store avatar failed', e);
    }
    finally {
        queryAvatarDataURL.cache.delete(identifier.toText());
        if (identifier instanceof _type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]) {
            _utils_messages__WEBPACK_IMPORTED_MODULE_3__[/* MaskMessage */ "a"].events.profilesChanged.sendToAll([{ of: identifier, reason: 'update' }]);
        }
    }
}


/***/ }),

/***/ 443:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return restoreBackup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return setUnconfirmedBackup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return getUnconfirmedBackup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return confirmBackup; });
/* harmony import */ var _utils_type_transform_BackupFormat_JSON_latest__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(250);
/* harmony import */ var _database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(48);
/* harmony import */ var _utils_type_transform_BackupFormat_JSON_DBRecord_JSON_PersonaRecord__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(445);
/* harmony import */ var _utils_type_transform_BackupFormat_JSON_DBRecord_JSON_ProfileRecord__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(446);
/* harmony import */ var _utils_type_transform_BackupFormat_JSON_DBRecord_JSON_PostRecord__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(447);
/* harmony import */ var _database_post__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(181);
/* harmony import */ var _utils_type_transform_BackupFormat_JSON_DBRecord_JSON_GroupRecord__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(448);
/* harmony import */ var _database_group__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(169);
/* harmony import */ var _utils_i18n_next__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(59);
/* harmony import */ var _settings_settings__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(26);
/* harmony import */ var _utils_type_transform_BackupFormat_JSON_DBRecord_JSON_WalletRecord__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(449);
/* harmony import */ var _plugins_Wallet_services__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(393);












/**
 * Restore the backup
 */
async function restoreBackup(json, whoAmI) {
    _settings_settings__WEBPACK_IMPORTED_MODULE_9__[/* currentImportingBackup */ "h"].value = true;
    try {
        const data = Object(_utils_type_transform_BackupFormat_JSON_latest__WEBPACK_IMPORTED_MODULE_0__[/* UpgradeBackupJSONFile */ "a"])(json, whoAmI);
        if (!data)
            throw new TypeError(_utils_i18n_next__WEBPACK_IMPORTED_MODULE_8__[/* i18n */ "b"].t('service_invalid_backup_file'));
        {
            await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_1__["consistentPersonaDBWriteAccess"])(async (t) => {
                for (const x of data.personas) {
                    await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_1__["createOrUpdatePersonaDB"])(Object(_utils_type_transform_BackupFormat_JSON_DBRecord_JSON_PersonaRecord__WEBPACK_IMPORTED_MODULE_2__[/* PersonaRecordFromJSONFormat */ "a"])(x), { explicitUndefinedField: 'ignore', linkedProfiles: 'merge' }, t);
                }
                for (const x of data.profiles) {
                    const { linkedPersona, ...record } = Object(_utils_type_transform_BackupFormat_JSON_DBRecord_JSON_ProfileRecord__WEBPACK_IMPORTED_MODULE_3__[/* ProfileRecordFromJSONFormat */ "a"])(x);
                    await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_1__["createOrUpdateProfileDB"])(record, t);
                    if (linkedPersona) {
                        await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_1__["attachProfileDB"])(record.identifier, linkedPersona, { connectionConfirmState: 'confirmed' }, t);
                    }
                }
                for (const x of data.wallets) {
                    const record = Object(_utils_type_transform_BackupFormat_JSON_DBRecord_JSON_WalletRecord__WEBPACK_IMPORTED_MODULE_10__[/* WalletRecordFromJSONFormat */ "a"])(x);
                    if (record.mnemonic || record._private_key_)
                        await Object(_plugins_Wallet_services__WEBPACK_IMPORTED_MODULE_11__["importNewWallet"])(record);
                }
            });
        }
        for (const x of data.posts) {
            await Object(_database_post__WEBPACK_IMPORTED_MODULE_5__["createOrUpdatePostDB"])(Object(_utils_type_transform_BackupFormat_JSON_DBRecord_JSON_PostRecord__WEBPACK_IMPORTED_MODULE_4__[/* PostRecordFromJSONFormat */ "a"])(x), 'append');
        }
        for (const x of data.userGroups) {
            const rec = Object(_utils_type_transform_BackupFormat_JSON_DBRecord_JSON_GroupRecord__WEBPACK_IMPORTED_MODULE_6__[/* GroupRecordFromJSONFormat */ "a"])(x);
            await Object(_database_group__WEBPACK_IMPORTED_MODULE_7__["createOrUpdateUserGroupDatabase"])(rec, 'append');
        }
    }
    finally {
        _settings_settings__WEBPACK_IMPORTED_MODULE_9__[/* currentImportingBackup */ "h"].value = false;
    }
}
const uncomfirmedBackup = new Map();
/**
 * Restore backup step 1: store the unconfirmed backup in cached
 * @param id the uuid for each restoration
 * @param json the backup to be cached
 */
async function setUnconfirmedBackup(id, json) {
    uncomfirmedBackup.set(id, json);
}
/**
 * Get the unconfirmed backup with uuid
 * @param id the uuid for each restoration
 */
async function getUnconfirmedBackup(id) {
    return uncomfirmedBackup.get(id);
}
/**
 * Restore backup step 2: restore the unconfirmed backup with uuid
 * @param id the uuid for each restoration
 */
async function confirmBackup(id, whoAmI) {
    if (uncomfirmedBackup.has(id)) {
        await restoreBackup(uncomfirmedBackup.get(id), whoAmI);
        uncomfirmedBackup.delete(id);
    }
    else {
        throw new Error('cannot find backup');
    }
}


/***/ }),

/***/ 444:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return deriveLocalKeyFromECDHKey; });
/* harmony import */ var _type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(62);
/* harmony import */ var _modules_workers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(170);
/* harmony import */ var _modules_CryptoAlgorithm_helper__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(268);



/**
 * Local key (AES key) is used to encrypt message to myself.
 * This key should never be published.
 */
async function deriveLocalKeyFromECDHKey(pub, mnemonicWord) {
    // ? Derive method: publicKey as "password" and password for the mnemonicWord as hash
    const pbkdf2 = await _modules_workers__WEBPACK_IMPORTED_MODULE_1__[/* CryptoWorker */ "a"].import_pbkdf2(Object(_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeText */ "d"])(pub.x + pub.y));
    return Object(_modules_CryptoAlgorithm_helper__WEBPACK_IMPORTED_MODULE_2__[/* derive_AES_GCM_256_Key_From_PBKDF2 */ "b"])(pbkdf2, Object(_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_0__[/* encodeText */ "d"])(mnemonicWord));
}


/***/ }),

/***/ 445:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return PersonaRecordToJSONFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return PersonaRecordFromJSONFormat; });
/* harmony import */ var _database_type__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);
/* harmony import */ var _database_IdentifierMap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(82);


function PersonaRecordToJSONFormat(persona) {
    return {
        createdAt: persona.createdAt.getTime(),
        updatedAt: persona.updatedAt.getTime(),
        identifier: persona.identifier.toText(),
        publicKey: persona.publicKey,
        privateKey: persona.privateKey,
        nickname: persona.nickname,
        mnemonic: persona.mnemonic,
        localKey: persona.localKey,
        linkedProfiles: Array.from(persona.linkedProfiles).map(([x, y]) => [x.toText(), y]),
    };
}
function PersonaRecordFromJSONFormat(persona) {
    if (persona.privateKey && !persona.privateKey.d)
        throw new Error('Private have no secret');
    return {
        createdAt: new Date(persona.createdAt),
        updatedAt: new Date(persona.updatedAt),
        identifier: _database_type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(persona.identifier, _database_type__WEBPACK_IMPORTED_MODULE_0__["ECKeyIdentifier"]).unwrap(),
        publicKey: persona.publicKey,
        privateKey: persona.privateKey,
        nickname: persona.nickname,
        mnemonic: persona.mnemonic,
        localKey: persona.localKey,
        linkedProfiles: new _database_IdentifierMap__WEBPACK_IMPORTED_MODULE_1__[/* IdentifierMap */ "a"](new Map(persona.linkedProfiles), _database_type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]),
    };
}


/***/ }),

/***/ 446:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return ProfileRecordToJSONFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ProfileRecordFromJSONFormat; });
/* harmony import */ var _database_type__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);

function ProfileRecordToJSONFormat(profile) {
    var _a;
    return {
        createdAt: profile.createdAt.getTime(),
        updatedAt: profile.updatedAt.getTime(),
        identifier: profile.identifier.toText(),
        nickname: profile.nickname,
        localKey: profile.localKey,
        linkedPersona: (_a = profile.linkedPersona) === null || _a === void 0 ? void 0 : _a.toText(),
    };
}
function ProfileRecordFromJSONFormat(profile) {
    return {
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
        identifier: _database_type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(profile.identifier, _database_type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]).unwrap(),
        nickname: profile.nickname,
        localKey: profile.localKey,
        linkedPersona: profile.linkedPersona
            ? _database_type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(profile.linkedPersona, _database_type__WEBPACK_IMPORTED_MODULE_0__["ECKeyIdentifier"]).unwrap()
            : undefined,
    };
}


/***/ }),

/***/ 447:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return PostRecordToJSONFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return PostRecordFromJSONFormat; });
/* harmony import */ var _database_type__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);
/* harmony import */ var _database_IdentifierMap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(82);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(12);



function PostRecordToJSONFormat(post) {
    return {
        postCryptoKey: post.postCryptoKey,
        foundAt: post.foundAt.getTime(),
        identifier: post.identifier.toText(),
        postBy: post.postBy.toText(),
        recipientGroups: post.recipientGroups.map((x) => x.toText()),
        recipients: Array.from(post.recipients).map(([identifier, detail]) => [
            identifier.toText(),
            {
                reason: Array.from(detail.reason).map(RecipientReasonToJSON),
            },
        ]),
    };
}
function PostRecordFromJSONFormat(post) {
    return {
        postCryptoKey: post.postCryptoKey,
        foundAt: new Date(post.foundAt),
        identifier: _database_type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(post.identifier, _database_type__WEBPACK_IMPORTED_MODULE_0__["PostIVIdentifier"]).unwrap(),
        postBy: _database_type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(post.postBy, _database_type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]).unwrap(),
        recipientGroups: post.recipientGroups.map((x) => _database_type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(x, _database_type__WEBPACK_IMPORTED_MODULE_0__["GroupIdentifier"]).unwrap()),
        recipients: new _database_IdentifierMap__WEBPACK_IMPORTED_MODULE_1__[/* IdentifierMap */ "a"](new Map(post.recipients.map(([x, y]) => [
            x,
            { reason: y.reason.map(RecipientReasonFromJSON) },
        ]))),
    };
}
function RecipientReasonToJSON(y) {
    if (y.type === 'direct' || y.type === 'auto-share')
        return { at: y.at.getTime(), type: y.type };
    else if (y.type === 'group')
        return { at: y.at.getTime(), group: y.group.toText(), type: y.type };
    return Object(_utils__WEBPACK_IMPORTED_MODULE_2__[/* unreachable */ "u"])(y);
}
function RecipientReasonFromJSON(y) {
    if (y.type === 'direct' || y.type === 'auto-share')
        return { at: new Date(y.at), type: y.type };
    else if (y.type === 'group')
        return {
            type: 'group',
            at: new Date(y.at),
            group: _database_type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(y.group, _database_type__WEBPACK_IMPORTED_MODULE_0__["GroupIdentifier"]).unwrap(),
        };
    return Object(_utils__WEBPACK_IMPORTED_MODULE_2__[/* unreachable */ "u"])(y);
}


/***/ }),

/***/ 448:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return GroupRecordToJSONFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return GroupRecordFromJSONFormat; });
/* harmony import */ var _database_type__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(4);

function GroupRecordToJSONFormat(group) {
    var _a;
    return {
        groupName: group.groupName,
        identifier: group.identifier.toText(),
        members: group.members.map((x) => x.toText()),
        banned: (_a = group.banned) === null || _a === void 0 ? void 0 : _a.map((x) => x.toText()),
    };
}
function GroupRecordFromJSONFormat(group) {
    var _a;
    return {
        groupName: group.groupName,
        identifier: _database_type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(group.identifier, _database_type__WEBPACK_IMPORTED_MODULE_0__["GroupIdentifier"]).unwrap(),
        members: group.members.map((x) => _database_type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(x, _database_type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]).unwrap()),
        banned: (_a = group.banned) === null || _a === void 0 ? void 0 : _a.map((x) => _database_type__WEBPACK_IMPORTED_MODULE_0__["Identifier"].fromString(x, _database_type__WEBPACK_IMPORTED_MODULE_0__["ProfileIdentifier"]).unwrap()),
    };
}


/***/ }),

/***/ 449:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "b", function() { return /* binding */ WalletRecordToJSONFormat; });
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ WalletRecordFromJSONFormat; });

// EXTERNAL MODULE: ./node_modules/tiny-secp256k1/js.js
var js = __webpack_require__(256);
var js_default = /*#__PURE__*/__webpack_require__.n(js);

// EXTERNAL MODULE: ./node_modules/elliptic/lib/elliptic.js
var elliptic = __webpack_require__(133);

// EXTERNAL MODULE: ./node_modules/wallet.ts/dist/index.js
var dist = __webpack_require__(120);

// EXTERNAL MODULE: ./node_modules/pvtsutils/build/index.js
var build = __webpack_require__(41);

// EXTERNAL MODULE: ./node_modules/node-libs-browser/node_modules/buffer/index.js
var buffer = __webpack_require__(22);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/type-transform/SECP256k1-ETH.ts





function keyToJWK(key, type) {
    const ec = new elliptic["ec"]('secp256k1');
    const key_ = key.replace(/^0x/, '');
    const keyPair = type === 'public' ? ec.keyFromPublic(key_) : ec.keyFromPrivate(key_);
    const pubKey = keyPair.getPublic();
    const privKey = keyPair.getPrivate();
    return {
        crv: 'K-256',
        ext: true,
        x: base64(pubKey.getX().toArray()),
        y: base64(pubKey.getY().toArray()),
        key_ops: ['deriveKey', 'deriveBits'],
        kty: 'EC',
        d: type === 'private' ? base64(privKey.toArray()) : undefined,
    };
    function base64(nums) {
        return build["Convert"].ToBase64Url(new Uint8Array(nums).buffer);
    }
}
function JWKToKey(jwk, type) {
    const ec = new elliptic["ec"]('secp256k1');
    if (type === 'public' && jwk.x && jwk.y) {
        const xb = ab(jwk.x);
        const yb = ab(jwk.y);
        const point = buffer["Buffer"].from(Object(build["combine"])(new Uint8Array([0x04]), xb, yb));
        if (js_default.a.isPoint(point))
            return `0x${ec.keyFromPublic(point).getPublic(false, 'hex')}`;
    }
    if (type === 'private' && jwk.d) {
        const db = buffer["Buffer"].from(ab(jwk.d));
        if (js_default.a.isPrivate(db))
            return `0x${ec.keyFromPrivate(db).getPrivate('hex')}`;
    }
    throw new Error('invalid private key');
    function ab(base64) {
        return build["Convert"].FromBase64Url(base64);
    }
}
function keyToAddr(key, type) {
    const ec = new elliptic["ec"]('secp256k1');
    const key_ = key.replace(/^0x/, '');
    const keyPair = type === 'public' ? ec.keyFromPublic(key_) : ec.keyFromPrivate(key_);
    return dist["EthereumAddress"].from(keyPair.getPublic(false, 'array')).address;
}

// EXTERNAL MODULE: ./packages/maskbook/src/web3/helpers.ts
var helpers = __webpack_require__(28);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/type-transform/BackupFormat/JSON/DBRecord-JSON/WalletRecord.ts


function WalletRecordToJSONFormat(wallet) {
    var _a, _b;
    const backup = {
        name: (_a = wallet.name) !== null && _a !== void 0 ? _a : '',
        address: wallet.address,
        createdAt: wallet.createdAt.getTime(),
        updatedAt: wallet.updatedAt.getTime(),
    };
    // generate keys for managed wallet
    try {
        const wallet_ = wallet;
        backup.passphrase = wallet_.passphrase;
        if ((_b = wallet_.mnemonic) === null || _b === void 0 ? void 0 : _b.length)
            backup.mnemonic = {
                words: wallet_.mnemonic.join(' '),
                parameter: {
                    path: "m/44'/60'/0'/0/0",
                    withPassword: false,
                },
            };
        if (wallet_._public_key_ && Object(helpers["j" /* isSameAddress */])(keyToAddr(wallet_._public_key_, 'public'), wallet.address))
            backup.publicKey = keyToJWK(wallet_._public_key_, 'public');
        if (wallet_._private_key_ && Object(helpers["j" /* isSameAddress */])(keyToAddr(wallet_._private_key_, 'private'), wallet.address))
            backup.privateKey = keyToJWK(wallet_._private_key_, 'private');
    }
    catch (e) {
        console.error(e);
    }
    return backup;
}
function WalletRecordFromJSONFormat(wallet) {
    var _a, _b;
    const record = {
        name: wallet.name,
        address: wallet.address,
        createdAt: new Date(wallet.createdAt),
        updatedAt: new Date(wallet.updatedAt),
    };
    if ((_a = wallet.mnemonic) === null || _a === void 0 ? void 0 : _a.words) {
        const record_ = record;
        record_.passphrase = (_b = wallet.passphrase) !== null && _b !== void 0 ? _b : '';
        record_.mnemonic = wallet.mnemonic.words.split(' ');
    }
    if (wallet.privateKey) {
        const record_ = record;
        record_._private_key_ = JWKToKey(wallet.privateKey, 'private');
    }
    if (wallet.publicKey) {
        const record_ = record;
        record_._public_key_ = JWKToKey(wallet.publicKey, 'public');
    }
    return record;
}


/***/ }),

/***/ 451:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryProfiles", function() { return queryProfiles; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryMyProfiles", function() { return queryMyProfiles; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateProfileInfo", function() { return updateProfileInfo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeProfile", function() { return removeProfile; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryPersonas", function() { return queryPersonas; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryMyPersonas", function() { return queryMyPersonas; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreFromObject", function() { return restoreFromObject; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreFromMnemonicWords", function() { return restoreFromMnemonicWords; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreFromBase64", function() { return restoreFromBase64; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "restoreFromBackup", function() { return restoreFromBackup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "attachProfile", function() { return attachProfile; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resolveIdentity", function() { return resolveIdentity; });
/* harmony import */ var bip39__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(231);
/* harmony import */ var bip39__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(bip39__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _database__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(69);
/* harmony import */ var _database_type__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);
/* harmony import */ var _database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(48);
/* harmony import */ var _utils_type_transform_BackupFormat_JSON_latest__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(250);
/* harmony import */ var _WelcomeServices_restoreBackup__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(443);
/* harmony import */ var _WelcomeService__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(647);
/* harmony import */ var _utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(62);
/* harmony import */ var _utils_type_transform_BackupFileShortRepresentation__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(251);
/* harmony import */ var _dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(54);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "storeAvatar", function() { return _database__WEBPACK_IMPORTED_MODULE_1__["q"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "queryAvatarDataURL", function() { return _database__WEBPACK_IMPORTED_MODULE_1__["f"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "queryProfile", function() { return _database__WEBPACK_IMPORTED_MODULE_1__["k"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "queryProfilePaged", function() { return _database__WEBPACK_IMPORTED_MODULE_1__["l"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "queryPersona", function() { return _database__WEBPACK_IMPORTED_MODULE_1__["h"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "createPersonaByMnemonic", function() { return _database__WEBPACK_IMPORTED_MODULE_1__["b"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "renamePersona", function() { return _database__WEBPACK_IMPORTED_MODULE_1__["o"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "setupPersona", function() { return _database__WEBPACK_IMPORTED_MODULE_1__["p"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "deletePersona", function() { return _database__WEBPACK_IMPORTED_MODULE_1__["d"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "detachProfile", function() { return _database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["detachProfileDB"]; });












Object(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_9__[/* assertEnvironment */ "d"])(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_9__[/* Environment */ "a"].ManifestBackground);

//#region Profile

function queryProfiles(network) {
    return Object(_database__WEBPACK_IMPORTED_MODULE_1__[/* queryProfilesWithQuery */ "m"])(network);
}
async function queryMyProfiles(network) {
    const myPersonas = (await queryMyPersonas(network)).filter((x) => !x.uninitialized);
    return Promise.all(myPersonas
        .flatMap((x) => Array.from(x.linkedProfiles.keys()))
        .filter((y) => !network || network === y.network)
        .map(_database__WEBPACK_IMPORTED_MODULE_1__[/* queryProfile */ "k"]));
}
async function updateProfileInfo(identifier, data) {
    if (data.nickname) {
        const rec = {
            identifier,
            nickname: data.nickname,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["consistentPersonaDBWriteAccess"])((t) => Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["createOrUpdateProfileDB"])(rec, t));
    }
    if (data.avatarURL)
        await Object(_database__WEBPACK_IMPORTED_MODULE_1__[/* storeAvatar */ "q"])(identifier, data.avatarURL, data.forceUpdateAvatar);
}
function removeProfile(id) {
    return Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["consistentPersonaDBWriteAccess"])((t) => Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["deleteProfileDB"])(id, t));
}
//#endregion
//#region Persona

async function queryPersonas(identifier, requirePrivateKey = false) {
    if (typeof identifier === 'undefined')
        return (await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["queryPersonasDB"])((k) => (requirePrivateKey ? !!k.privateKey : true))).map(_database__WEBPACK_IMPORTED_MODULE_1__[/* personaRecordToPersona */ "e"]);
    const x = await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["queryPersonaDB"])(identifier);
    if (!x || (!x.privateKey && requirePrivateKey))
        return [];
    return [Object(_database__WEBPACK_IMPORTED_MODULE_1__[/* personaRecordToPersona */ "e"])(x)];
}
function queryMyPersonas(network) {
    return queryPersonas(undefined, true).then((x) => typeof network === 'string'
        ? x.filter((y) => {
            for (const z of y.linkedProfiles.keys()) {
                if (z.network === network)
                    return true;
            }
            return false;
        })
        : x);
}
async function restoreFromObject(object) {
    var _a;
    if (!object)
        return null;
    await Object(_WelcomeServices_restoreBackup__WEBPACK_IMPORTED_MODULE_5__[/* restoreBackup */ "c"])(object);
    if ((_a = object === null || object === void 0 ? void 0 : object.personas) === null || _a === void 0 ? void 0 : _a.length) {
        return Object(_database__WEBPACK_IMPORTED_MODULE_1__[/* queryPersona */ "h"])(_database_type__WEBPACK_IMPORTED_MODULE_2__["Identifier"].fromString(object.personas[0].identifier, _database_type__WEBPACK_IMPORTED_MODULE_2__["ECKeyIdentifier"]).unwrap());
    }
    return null;
}
async function restoreFromMnemonicWords(mnemonicWords, nickname, password) {
    if (!bip39__WEBPACK_IMPORTED_MODULE_0__["validateMnemonic"](mnemonicWords))
        throw new Error('the mnemonic words are not valid');
    const identifier = await Object(_WelcomeService__WEBPACK_IMPORTED_MODULE_6__["restoreNewIdentityWithMnemonicWord"])(mnemonicWords, password, {
        nickname,
    });
    return Object(_database__WEBPACK_IMPORTED_MODULE_1__[/* queryPersona */ "h"])(identifier);
}
async function restoreFromBase64(base64) {
    return restoreFromObject(JSON.parse(Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_7__[/* decodeText */ "b"])(Object(_utils_type_transform_String_ArrayBuffer__WEBPACK_IMPORTED_MODULE_7__[/* decodeArrayBuffer */ "a"])(base64))));
}
async function restoreFromBackup(backup) {
    return restoreFromObject(Object(_utils_type_transform_BackupFormat_JSON_latest__WEBPACK_IMPORTED_MODULE_4__[/* UpgradeBackupJSONFile */ "a"])(Object(_utils_type_transform_BackupFileShortRepresentation__WEBPACK_IMPORTED_MODULE_8__[/* decompressBackupFile */ "b"])(backup)));
}
//#endregion
//#region Profile & Persona
/**
 * Remove an identity.
 */

async function attachProfile(source, target, data) {
    if (target instanceof _database_type__WEBPACK_IMPORTED_MODULE_2__["ProfileIdentifier"]) {
        const profile = await Object(_database__WEBPACK_IMPORTED_MODULE_1__[/* queryProfile */ "k"])(target);
        if (!profile.linkedPersona)
            throw new Error('target not found');
        target = profile.linkedPersona.identifier;
    }
    return Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["attachProfileDB"])(source, target, data);
}

//#endregion
/**
 * In older version of Maskbook, identity is marked as `ProfileIdentifier(network, '$unknown')` or `ProfileIdentifier(network, '$self')`. After upgrading to the newer version of Maskbook, Maskbook will try to find the current user in that network and call this function to replace old identifier into a "resolved" identity.
 * @param identifier The resolved identity
 */
async function resolveIdentity(identifier) {
    const unknown = new _database_type__WEBPACK_IMPORTED_MODULE_2__["ProfileIdentifier"](identifier.network, '$unknown');
    const self = new _database_type__WEBPACK_IMPORTED_MODULE_2__["ProfileIdentifier"](identifier.network, '$self');
    const r = await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["queryProfilesDB"])((x) => x.identifier.equals(unknown) || x.identifier.equals(self));
    if (!r.length)
        return;
    const final = {
        ...r.reduce((p, c) => ({ ...p, ...c })),
        identifier,
    };
    try {
        await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["consistentPersonaDBWriteAccess"])(async (t) => {
            await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["createProfileDB"])(final, t);
            await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["deleteProfileDB"])(unknown, t).catch(() => { });
            await Object(_database_Persona_Persona_db__WEBPACK_IMPORTED_MODULE_3__["deleteProfileDB"])(self, t).catch(() => { });
        });
    }
    catch {
        // the profile already exists
    }
}


/***/ }),

/***/ 453:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);
/* harmony import */ var _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(230);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "addProfileToFriendsGroup", function() { return _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__["a"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "createDefaultFriendsGroup", function() { return _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__["b"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "removeProfileFromFriendsGroup", function() { return _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__["e"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "createFriendsGroup", function() { return _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__["c"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "queryUserGroups", function() { return _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__["d"]; });

/* harmony import */ var _database_group__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(169);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "queryUserGroup", function() { return _database_group__WEBPACK_IMPORTED_MODULE_2__["queryUserGroupDatabase"]; });


Object(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* assertEnvironment */ "d"])(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* Environment */ "a"].ManifestBackground);




/***/ }),

/***/ 454:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return calculatePostKeyPartition; });
/* unused harmony export hashProfileIdentifier */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return hashPostSalt; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return hashCryptoKeyUnstable; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return hashCryptoKey; });
/* harmony import */ var gun__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(412);
/* harmony import */ var gun__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(gun__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var gun_sea__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(937);
/* harmony import */ var gun_sea__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(gun_sea__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils_memoize__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(138);
/** This file should not contain active gun instances. Only static methods on gun is allowed. */
/**
 * @see https://github.com/DimensionDev/Maskbook/wiki/Data-structure-on-Gun-version-2
 */



/**
 * @param version current payload version
 * @param postIV Post iv
 * @param partitionByCryptoKey Public key of the current user (receiver)
 * @param networkHint The network specific string
 */
async function calculatePostKeyPartition(version, postIV, partitionByCryptoKey, networkHint) {
    const postHash = await hashPostSalt(postIV, networkHint);
    // In version > -39, we will use stable hash to prevent unstable result for key hashing
    const keyHash = await (version <= -39 ? hashCryptoKeyUnstable : hashCryptoKey)(partitionByCryptoKey);
    return { postHash, keyHash };
}
const hashProfileIdentifier = Object(_utils_memoize__WEBPACK_IMPORTED_MODULE_2__[/* memoizePromise */ "a"])(async function hashProfileIdentifier(id) {
    const hashPair = `f67a6a2c-fe66-4f47-bd1f-00a5603d1010`;
    const hash = await gun__WEBPACK_IMPORTED_MODULE_0___default.a.SEA.work(id.toText(), hashPair);
    return hash;
}, (id) => id.toText());
const hashPostSalt = Object(_utils_memoize__WEBPACK_IMPORTED_MODULE_2__[/* memoizePromise */ "a"])(async function (postSalt, networkHint) {
    const hashPair = `9283464d-ee4e-4e8d-a7f3-cf392a88133f`;
    const N = 2;
    const hash = (await gun__WEBPACK_IMPORTED_MODULE_0___default.a.SEA.work(postSalt, hashPair));
    return networkHint + hash.substring(0, N);
}, (x, y) => x + y);
/**
 * @param key - The key need to be hashed
 */
const hashCryptoKeyUnstable = Object(_utils_memoize__WEBPACK_IMPORTED_MODULE_2__[/* memoizePromise */ "a"])(async function (key) {
    const hashPair = `10198a2f-205f-45a6-9987-3488c80113d0`;
    const N = 2;
    const jwk = JSON.stringify(key);
    const hash = (await gun__WEBPACK_IMPORTED_MODULE_0___default.a.SEA.work(jwk, hashPair));
    return hash.substring(0, N);
}, undefined);
/**
 * @param key - The key need to be hashed
 */
const hashCryptoKey = Object(_utils_memoize__WEBPACK_IMPORTED_MODULE_2__[/* memoizePromise */ "a"])(async function (key) {
    const hashPair = `10198a2f-205f-45a6-9987-3488c80113d0`;
    const N = 2;
    const jwk = key;
    if (!jwk.x || !jwk.y)
        throw new Error('Invalid key');
    const hash = (await gun__WEBPACK_IMPORTED_MODULE_0___default.a.SEA.work(jwk.x + jwk.y, hashPair));
    return hash.substring(0, N);
}, undefined);


/***/ }),

/***/ 48:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "createPersonaDBAccess", function() { return /* binding */ createPersonaDBAccess; });
__webpack_require__.d(__webpack_exports__, "consistentPersonaDBWriteAccess", function() { return /* binding */ consistentPersonaDBWriteAccess; });
__webpack_require__.d(__webpack_exports__, "createPersonaDB", function() { return /* binding */ createPersonaDB; });
__webpack_require__.d(__webpack_exports__, "queryPersonaByProfileDB", function() { return /* binding */ queryPersonaByProfileDB; });
__webpack_require__.d(__webpack_exports__, "queryPersonaDB", function() { return /* binding */ queryPersonaDB; });
__webpack_require__.d(__webpack_exports__, "queryPersonasDB", function() { return /* binding */ queryPersonasDB; });
__webpack_require__.d(__webpack_exports__, "queryPersonasWithPrivateKey", function() { return /* binding */ queryPersonasWithPrivateKey; });
__webpack_require__.d(__webpack_exports__, "updatePersonaDB", function() { return /* binding */ updatePersonaDB; });
__webpack_require__.d(__webpack_exports__, "createOrUpdatePersonaDB", function() { return /* binding */ createOrUpdatePersonaDB; });
__webpack_require__.d(__webpack_exports__, "deletePersonaDB", function() { return /* binding */ deletePersonaDB; });
__webpack_require__.d(__webpack_exports__, "safeDeletePersonaDB", function() { return /* binding */ safeDeletePersonaDB; });
__webpack_require__.d(__webpack_exports__, "createProfileDB", function() { return /* binding */ createProfileDB; });
__webpack_require__.d(__webpack_exports__, "queryProfileDB", function() { return /* binding */ queryProfileDB; });
__webpack_require__.d(__webpack_exports__, "queryProfilesDB", function() { return /* binding */ queryProfilesDB; });
__webpack_require__.d(__webpack_exports__, "queryProfilesPagedDB", function() { return /* binding */ queryProfilesPagedDB; });
__webpack_require__.d(__webpack_exports__, "updateProfileDB", function() { return /* binding */ updateProfileDB; });
__webpack_require__.d(__webpack_exports__, "createOrUpdateProfileDB", function() { return /* binding */ createOrUpdateProfileDB; });
__webpack_require__.d(__webpack_exports__, "detachProfileDB", function() { return /* binding */ detachProfileDB; });
__webpack_require__.d(__webpack_exports__, "attachProfileDB", function() { return /* binding */ attachProfileDB; });
__webpack_require__.d(__webpack_exports__, "deleteProfileDB", function() { return /* binding */ deleteProfileDB; });

// EXTERNAL MODULE: ./node_modules/fuse.js/dist/fuse.esm.js
var fuse_esm = __webpack_require__(335);

// EXTERNAL MODULE: ./packages/maskbook/src/database/type.ts
var type = __webpack_require__(4);

// EXTERNAL MODULE: ./node_modules/idb/with-async-ittr-cjs.js
var with_async_ittr_cjs = __webpack_require__(179);

// EXTERNAL MODULE: ./packages/maskbook/src/database/IdentifierMap.ts
var IdentifierMap = __webpack_require__(82);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type.ts
var utils_type = __webpack_require__(180);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/messages.ts
var messages = __webpack_require__(55);

// EXTERNAL MODULE: ./packages/maskbook/src/database/helpers/openDB.ts
var openDB = __webpack_require__(66);

// EXTERNAL MODULE: ./packages/maskbook/src/database/Persona/helpers.ts
var helpers = __webpack_require__(266);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/utils.ts
var utils = __webpack_require__(12);

// CONCATENATED MODULE: ./packages/maskbook/src/database/Persona/consistency.ts



async function assertPersonaDBConsistency(behavior, ...[checkRange, t]) {
    const diag = [];
    for await (const w of checkFullPersonaDBConsistency(checkRange, t)) {
        diag.push(w);
    }
    if (diag.length) {
        const warn = `PersonaDB is in the inconsistency state`;
        console.warn(warn);
        console.info(await t.objectStore('personas').getAll());
        console.info(await t.objectStore('profiles').getAll());
        console.error(...diag);
        if (behavior === 'throw') {
            t.abort();
            throw new Error(warn);
        }
        else if (t.mode === 'readwrite') {
            console.warn('Try to fix the inconsistent db');
            for (const each of diag)
                await fixDBInconsistency(each, t).catch(() => { });
        }
    }
    return diag;
}
async function fixDBInconsistency(diagnosis, t) {
    const personas = t.objectStore('personas');
    const profiles = t.objectStore('profiles');
    switch (diagnosis.type) {
        case Type.Invalid_Persona:
            return personas.delete(diagnosis.invalidPersonaKey);
        case Type.Invalid_Profile:
            return profiles.delete(diagnosis.invalidProfileKey);
        case Type.One_Way_Link_In_Persona:
        case Type.Invalid_Persona_LinkedProfiles: {
            const rec = await personas.get(diagnosis.persona.toText());
            const profileWantToUnlink = diagnosis.type === Type.One_Way_Link_In_Persona
                ? diagnosis.designatedProfile.toText()
                : diagnosis.invalidProfile;
            rec.linkedProfiles.delete(profileWantToUnlink);
            return personas.put(rec);
        }
        case Type.One_Way_Link_In_Profile:
        case Type.Invalid_Profile_LinkedPersona: {
            const rec = await profiles.get(diagnosis.profile.toText());
            delete rec.linkedPersona;
            return profiles.put(rec);
        }
        default:
            return Object(utils["u" /* unreachable */])(diagnosis);
    }
}
async function* checkFullPersonaDBConsistency(checkRange, t) {
    for await (const persona of t.objectStore('personas')) {
        const personaID = type["Identifier"].fromString(persona.key, type["ECKeyIdentifier"]);
        if (personaID.err) {
            yield { type: Type.Invalid_Persona, invalidPersonaKey: persona.key, _record: persona.value };
            continue;
        }
        if (checkRange === 'full check' || checkRange.has(personaID.val)) {
            yield* checkPersonaLink(personaID.val, t);
        }
    }
    for await (const profile of t.objectStore('profiles')) {
        const profileID = type["Identifier"].fromString(profile.key, type["ProfileIdentifier"]);
        if (profileID.err) {
            yield { type: Type.Invalid_Profile, invalidProfileKey: profile.key, _record: profile.value };
        }
        else if (checkRange === 'full check' || checkRange.has(profileID.val)) {
            yield* checkProfileLink(profileID.val, t);
        }
    }
}
async function* checkPersonaLink(personaID, t) {
    const rec = await t.objectStore('personas').get(personaID.toText());
    const linkedProfiles = rec === null || rec === void 0 ? void 0 : rec.linkedProfiles;
    if (!linkedProfiles)
        return;
    for (const each of linkedProfiles) {
        const profileID = type["Identifier"].fromString(each[0], type["ProfileIdentifier"]);
        if (profileID.err) {
            yield { type: Type.Invalid_Persona_LinkedProfiles, invalidProfile: each[0], persona: personaID };
            continue;
        }
        const profile = await t.objectStore('profiles').get(profileID.val.toText());
        if (!(profile === null || profile === void 0 ? void 0 : profile.linkedPersona)) {
            yield {
                type: Type.One_Way_Link_In_Persona,
                persona: personaID,
                designatedProfile: profileID.val,
                profileActuallyLinkedPersona: profile === null || profile === void 0 ? void 0 : profile.linkedPersona,
            };
        }
    }
}
async function* checkProfileLink(profile, t) {
    const rec = await t.objectStore('profiles').get(profile.toText());
    const invalidLinkedPersona = rec === null || rec === void 0 ? void 0 : rec.linkedPersona;
    if (!invalidLinkedPersona)
        return;
    if (invalidLinkedPersona.type !== 'ec_key') {
        yield { type: Type.Invalid_Profile_LinkedPersona, invalidLinkedPersona, profile };
        return;
    }
    const designatedPersona = Object(utils_type["a" /* restorePrototype */])(invalidLinkedPersona, type["ECKeyIdentifier"].prototype);
    const persona = await t.objectStore('personas').get(designatedPersona.toText());
    if (!persona) {
        yield { type: Type.One_Way_Link_In_Profile, profile, designatedPersona };
    }
}
var Type;
(function (Type) {
    Type["Invalid_Persona"] = "invalid identifier in persona";
    Type["Invalid_Persona_LinkedProfiles"] = "invalid identifier in persona.linkedProfiles";
    Type["Invalid_Profile"] = "invalid identifier in profile";
    Type["Invalid_Profile_LinkedPersona"] = "invalid identifier in profile.linkedPersona";
    Type["One_Way_Link_In_Persona"] = "a persona linked to a profile meanwhile the profile is not linked to the persona";
    Type["One_Way_Link_In_Profile"] = "a profile linked to a persona meanwhile it is not appeared in the persona.linkedProfiles";
})(Type || (Type = {}));

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/CryptoKey-JsonWebKey.ts
var CryptoKey_JsonWebKey = __webpack_require__(88);

// CONCATENATED MODULE: ./packages/maskbook/src/database/Persona/Persona.db.ts
/// <reference path="../global.d.ts" />










/**
 * Database structure:
 *
 * # ObjectStore `persona`:
 * @description Store Personas.
 * @type {PersonaRecordDB}
 * @keys inline, {@link PersonaRecordDb.identifier}
 *
 * # ObjectStore `profiles`:
 * @description Store profiles.
 * @type {ProfileRecord}
 * A persona links to 0 or more profiles.
 * Each profile links to 0 or 1 persona.
 * @keys inline, {@link ProfileRecord.identifier}
 */
const Persona_db_db = Object(openDB["b" /* createDBAccessWithAsyncUpgrade */])(1, 2, (currentOpenVersion, knowledge) => {
    return Object(with_async_ittr_cjs["openDB"])('maskbook-persona', currentOpenVersion, {
        upgrade(db, oldVersion, newVersion, transaction) {
            function v0_v1() {
                db.createObjectStore('personas', { keyPath: 'identifier' });
                db.createObjectStore('profiles', { keyPath: 'identifier' });
                transaction.objectStore('profiles').createIndex('network', 'network', { unique: false });
                transaction.objectStore('personas').createIndex('hasPrivateKey', 'hasPrivateKey', { unique: false });
            }
            async function v1_v2() {
                const persona = transaction.objectStore('personas');
                const profile = transaction.objectStore('profiles');
                await update(persona);
                await update(profile);
                async function update(q) {
                    for await (const rec of persona) {
                        if (!rec.value.localKey)
                            continue;
                        const jwk = knowledge === null || knowledge === void 0 ? void 0 : knowledge.data.get(rec.value.identifier);
                        if (!jwk) {
                            // !!! This should not happen
                            // !!! Remove it will implicitly drop user's localKey
                            delete rec.value.localKey;
                            // !!! Keep it will leave a bug, broken data in the DB
                            // continue
                            // !!! DON'T throw cause it will break the database upgrade
                        }
                        rec.value.localKey = jwk;
                        await rec.update(rec.value);
                    }
                }
            }
            if (oldVersion < 1)
                return v0_v1();
            if (oldVersion < 2)
                v1_v2();
        },
    });
}, async (db) => {
    if (db.version === 1) {
        const map = { version: 2, data: new Map() };
        const t = Object(openDB["c" /* createTransaction */])(db, 'readonly')('personas', 'profiles');
        const a = await t.objectStore('personas').getAll();
        const b = await t.objectStore('profiles').getAll();
        for (const rec of [...a, ...b]) {
            if (!rec.localKey)
                continue;
            map.data.set(rec.identifier, await Object(CryptoKey_JsonWebKey["a" /* CryptoKeyToJsonWebKey */])(rec.localKey));
        }
        return map;
    }
    return undefined;
});
const createPersonaDBAccess = Persona_db_db;
async function consistentPersonaDBWriteAccess(action, tryToAutoFix = true) {
    // TODO: collect all changes on this transaction then only perform consistency check on those records.
    let t = Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readwrite')('profiles', 'personas');
    let finished = false;
    const finish = () => (finished = true);
    t.addEventListener('abort', finish);
    t.addEventListener('complete', finish);
    t.addEventListener('error', finish);
    // Pause those events when patching write access
    const resumeProfile = messages["a" /* MaskMessage */].events.profilesChanged.pause();
    const resumePersona = messages["a" /* MaskMessage */].events.personaChanged.pause();
    const resumeLinkedProfileChanged = messages["a" /* MaskMessage */].events.linkedProfilesChanged.pause();
    try {
        await action(t);
    }
    finally {
        if (finished) {
            console.warn('The transaction ends too early! There MUST be a bug in the program!');
            console.trace();
            // start a new transaction to check consistency
            t = Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readwrite')('profiles', 'personas');
        }
        try {
            await assertPersonaDBConsistency(tryToAutoFix ? 'fix' : 'throw', 'full check', t);
            resumeProfile((data) => [data.flat()]);
            resumePersona((data) => [data.flat()]);
            resumeLinkedProfileChanged((data) => [data.flat()]);
        }
        finally {
            // If the consistency check throws, we drop all pending events
            resumeProfile(() => []);
            resumePersona(() => []);
            resumeLinkedProfileChanged(() => []);
        }
    }
}
//#region Plain methods
/** Create a new Persona. */
async function createPersonaDB(record, t) {
    await t.objectStore('personas').add(personaRecordToDB(record));
    messages["a" /* MaskMessage */].events.personaChanged.sendToAll([{ of: record.identifier, owned: !!record.privateKey, reason: 'new' }]);
}
async function queryPersonaByProfileDB(query, t) {
    t = t || Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readonly')('personas', 'profiles');
    const x = await t.objectStore('profiles').get(query.toText());
    if (!(x === null || x === void 0 ? void 0 : x.linkedPersona))
        return null;
    return queryPersonaDB(Object(utils_type["a" /* restorePrototype */])(x.linkedPersona, type["ECKeyIdentifier"].prototype), t);
}
/**
 * Query a Persona.
 */
async function queryPersonaDB(query, t) {
    t = t || Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readonly')('personas');
    const x = await t.objectStore('personas').get(query.toText());
    if (x)
        return personaRecordOutDB(x);
    return null;
}
/**
 * Query many Personas.
 */
async function queryPersonasDB(query, t) {
    t = t || Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readonly')('personas');
    const records = [];
    for await (const each of t.objectStore('personas')) {
        const out = personaRecordOutDB(each.value);
        if (query(out))
            records.push(out);
    }
    return records;
}
/**
 * Query many Personas.
 */
async function queryPersonasWithPrivateKey(t) {
    t = t || Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readonly')('personas', 'profiles');
    const records = [];
    records.push(...(await t.objectStore('personas').index('hasPrivateKey').getAll(IDBKeyRange.only('yes'))).map(personaRecordOutDB));
    return records;
}
/**
 * Update an existing Persona record.
 * @param nextRecord The partial record to be merged
 * @param howToMerge How to merge linkedProfiles and `field: undefined`
 * @param t transaction
 */
async function updatePersonaDB(
// Do a copy here. We need to delete keys from it.
{ ...nextRecord }, howToMerge, t) {
    var _a;
    const _old = await t.objectStore('personas').get(nextRecord.identifier.toText());
    if (!_old)
        throw new TypeError('Update an non-exist data');
    const old = personaRecordOutDB(_old);
    let nextLinkedProfiles = old.linkedProfiles;
    if (nextRecord.linkedProfiles) {
        if (howToMerge.linkedProfiles === 'merge')
            nextLinkedProfiles = new IdentifierMap["a" /* IdentifierMap */](new Map([...nextLinkedProfiles.__raw_map__, ...nextRecord.linkedProfiles.__raw_map__]));
        else
            nextLinkedProfiles = nextRecord.linkedProfiles;
    }
    if (howToMerge.explicitUndefinedField === 'ignore') {
        for (const _key in nextRecord) {
            const key = _key;
            if (nextRecord[key] === undefined) {
                delete nextRecord[key];
            }
        }
    }
    const next = personaRecordToDB({
        ...old,
        ...nextRecord,
        linkedProfiles: nextLinkedProfiles,
        updatedAt: (_a = nextRecord.updatedAt) !== null && _a !== void 0 ? _a : new Date(),
    });
    await t.objectStore('personas').put(next);
    messages["a" /* MaskMessage */].events.personaChanged.sendToAll([{ of: old.identifier, owned: !!next.privateKey, reason: 'update' }]);
}
async function createOrUpdatePersonaDB(record, howToMerge, t) {
    var _a, _b;
    if (await t.objectStore('personas').get(record.identifier.toText()))
        return updatePersonaDB(record, howToMerge, t);
    else
        return createPersonaDB({
            ...record,
            createdAt: (_a = record.createdAt) !== null && _a !== void 0 ? _a : new Date(),
            updatedAt: (_b = record.updatedAt) !== null && _b !== void 0 ? _b : new Date(),
            linkedProfiles: new IdentifierMap["a" /* IdentifierMap */](new Map()),
        }, t);
}
/**
 * Delete a Persona
 */
async function deletePersonaDB(id, confirm, t) {
    const r = await t.objectStore('personas').get(id.toText());
    if (!r)
        return;
    if (confirm !== 'delete even with private' && r.privateKey)
        throw new TypeError('Cannot delete a persona with a private key');
    await t.objectStore('personas').delete(id.toText());
    messages["a" /* MaskMessage */].events.personaChanged.sendToAll([{ of: id, owned: !!r.privateKey, reason: 'delete' }]);
}
/**
 * Delete a Persona
 * @returns a boolean. true: the record no longer exists; false: the record is kept.
 */
async function safeDeletePersonaDB(id, t) {
    t = t || Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readwrite')('personas', 'profiles');
    const r = await queryPersonaDB(id, t);
    if (!r)
        return true;
    if (r.linkedProfiles.size !== 0)
        return false;
    if (r.privateKey)
        return false;
    await deletePersonaDB(id, "don't delete if have private key", t);
    return true;
}
/**
 * Create a new profile.
 */
async function createProfileDB(record, t) {
    await t.objectStore('profiles').add(profileToDB(record));
    messages["a" /* MaskMessage */].events.profilesChanged.sendToAll([{ of: record.identifier, reason: 'update' }]);
}
/**
 * Query a profile.
 */
async function queryProfileDB(id, t) {
    t = t || Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readonly')('profiles');
    const result = await t.objectStore('profiles').get(id.toText());
    if (result)
        return profileOutDB(result);
    return null;
}
/**
 * Query many profiles.
 */
async function queryProfilesDB(network, t) {
    t = t || Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readonly')('profiles');
    const result = [];
    if (typeof network === 'string') {
        result.push(...(await t.objectStore('profiles').index('network').getAll(IDBKeyRange.only(network))).map(profileOutDB));
    }
    else {
        for await (const each of t.objectStore('profiles').iterate()) {
            const out = profileOutDB(each.value);
            if (network(out))
                result.push(out);
        }
    }
    return result;
}
const fuse = new fuse_esm["a" /* default */]([], {
    shouldSort: true,
    threshold: 0.45,
    minMatchCharLength: 1,
    keys: [
        { name: 'nickname', weight: 0.8 },
        { name: 'identifier.network', weight: 0.2 },
    ],
});
async function queryProfilesPagedDB(options, count) {
    var _a;
    const t = Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readonly')('profiles');
    const breakPoint = (_a = options.after) === null || _a === void 0 ? void 0 : _a.toText();
    let firstRecord = true;
    const data = [];
    for await (const rec of t.objectStore('profiles').iterate()) {
        if (firstRecord && breakPoint && rec.key !== breakPoint) {
            rec.continue(breakPoint);
            firstRecord = false;
            continue;
        }
        firstRecord = false;
        // after this record
        if (rec.key === breakPoint)
            continue;
        if (count <= 0)
            break;
        const outData = profileOutDB(rec.value);
        if (typeof options.query === 'string') {
            fuse.setCollection([outData]);
            if (!fuse.search(options.query).length)
                continue;
        }
        count -= 1;
        data.push(outData);
    }
    return data;
}
/**
 * Update a profile.
 */
async function updateProfileDB(updating, t) {
    const old = await t.objectStore('profiles').get(updating.identifier.toText());
    if (!old)
        throw new Error('Updating a non exists record');
    const nextRecord = profileToDB({
        ...profileOutDB(old),
        ...updating,
    });
    await t.objectStore('profiles').put(nextRecord);
    setTimeout(async () => {
        const next = await Object(helpers["queryProfile"])(updating.identifier);
        messages["a" /* MaskMessage */].events.profilesChanged.sendToAll([{ reason: 'update', of: updating.identifier }]);
        const oldKey = old.linkedPersona ? Object(utils_type["a" /* restorePrototype */])(old.linkedPersona, type["ECKeyIdentifier"].prototype) : undefined;
        const newKey = next.linkedPersona;
        if ((oldKey === null || oldKey === void 0 ? void 0 : oldKey.toText()) !== (newKey === null || newKey === void 0 ? void 0 : newKey.identifier.toText())) {
            messages["a" /* MaskMessage */].events.linkedProfilesChanged.sendToAll([
                { of: next.identifier, before: oldKey, after: newKey === null || newKey === void 0 ? void 0 : newKey.identifier },
            ]);
        }
    }, 0);
}
async function createOrUpdateProfileDB(rec, t) {
    if (await queryProfileDB(rec.identifier, t))
        return updateProfileDB(rec, t);
    else
        return createProfileDB(rec, t);
}
/**
 * Detach a profile from it's linking persona.
 * @param identifier The profile want to detach
 * @param t A living transaction
 */
async function detachProfileDB(identifier, t) {
    t = t || Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readwrite')('personas', 'profiles');
    const profile = await queryProfileDB(identifier, t);
    if (!(profile === null || profile === void 0 ? void 0 : profile.linkedPersona))
        return;
    const linkedPersona = profile.linkedPersona;
    const persona = await queryPersonaDB(linkedPersona, t);
    persona === null || persona === void 0 ? void 0 : persona.linkedProfiles.delete(identifier);
    if (persona) {
        await updatePersonaDB(persona, { linkedProfiles: 'replace', explicitUndefinedField: 'delete field' }, t);
    }
    profile.linkedPersona = undefined;
    await updateProfileDB(profile, t);
}
/**
 * attach a profile.
 */
async function attachProfileDB(identifier, attachTo, data, t) {
    t = t || Object(openDB["c" /* createTransaction */])(await Persona_db_db(), 'readwrite')('personas', 'profiles');
    const profile = (await queryProfileDB(identifier, t)) ||
        (await createProfileDB({ identifier, createdAt: new Date(), updatedAt: new Date() }, t)) ||
        (await queryProfileDB(identifier, t));
    const persona = await queryPersonaDB(attachTo, t);
    if (!persona || !profile)
        return;
    if (profile.linkedPersona !== undefined && !profile.linkedPersona.equals(attachTo)) {
        await detachProfileDB(identifier, t);
    }
    profile.linkedPersona = attachTo;
    persona.linkedProfiles.set(identifier, data);
    await updatePersonaDB(persona, { linkedProfiles: 'merge', explicitUndefinedField: 'ignore' }, t);
    await updateProfileDB(profile, t);
}
/**
 * Delete a profile
 */
async function deleteProfileDB(id, t) {
    await t.objectStore('profiles').delete(id.toText());
    messages["a" /* MaskMessage */].events.profilesChanged.sendToAll([{ reason: 'delete', of: id }]);
}
//#endregion
//#region out db & to db
function profileToDB(x) {
    return {
        ...x,
        identifier: x.identifier.toText(),
        network: x.identifier.network,
    };
}
function profileOutDB({ network, ...x }) {
    if (x.linkedPersona) {
        if (x.linkedPersona.type !== 'ec_key')
            throw new Error('Unknown type of linkedPersona');
    }
    return {
        ...x,
        identifier: type["Identifier"].fromString(x.identifier, type["ProfileIdentifier"]).unwrap(),
        linkedPersona: Object(utils_type["a" /* restorePrototype */])(x.linkedPersona, type["ECKeyIdentifier"].prototype),
    };
}
function personaRecordToDB(x) {
    return {
        ...x,
        identifier: x.identifier.toText(),
        hasPrivateKey: x.privateKey ? 'yes' : 'no',
        linkedProfiles: x.linkedProfiles.__raw_map__,
    };
}
function personaRecordOutDB(x) {
    // @ts-ignore
    delete x.hasPrivateKey;
    const obj = {
        ...x,
        identifier: type["Identifier"].fromString(x.identifier, type["ECKeyIdentifier"]).unwrap(),
        linkedProfiles: new IdentifierMap["a" /* IdentifierMap */](x.linkedProfiles, type["ProfileIdentifier"]),
    };
    return obj;
}
//#endregion


/***/ }),

/***/ 558:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var MixedMap = /** @class */ (function () {
    function MixedMap() {
    }
    MixedMap.prototype.has = function (key) {
        return this.getMap(key).has(key);
    };
    MixedMap.prototype.get = function (key) {
        return this.getMap(key).get(key);
    };
    MixedMap.prototype.set = function (key, value) {
        this.getMap(key).set(key, value);
        return this;
    };
    MixedMap.prototype.delete = function (key) {
        return this.getMap(key).delete(key);
    };
    MixedMap.prototype.getMap = function (key) {
        if (typeof key === 'object' && key !== null) {
            if (this.weakMap) {
                return this.weakMap;
            }
            else {
                return this.weakMap = new WeakMap();
            }
        }
        else {
            if (this.map) {
                return this.map;
            }
            else {
                return this.map = new Map();
            }
        }
    };
    return MixedMap;
}());
exports.MixedMap = MixedMap;
exports.default = MixedMap;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 613:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/worker.ts
var worker = __webpack_require__(102);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/shared-provider.ts
var shared_provider = __webpack_require__(314);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/parse-html.ts
/**
 * Parse static result from fb
 */
function parseFacebookStaticHTML(html) {
    const parser = new DOMParser();
    const doc1 = parser.parseFromString(html, 'text/html');
    const codeDom = doc1.body.querySelector('code');
    const rootDom = doc1.body.querySelector('#root');
    if (codeDom) {
        const nodes = Array.from(doc1.body.querySelectorAll('code'))
            .map((x) => {
            const comment = x.childNodes[0];
            if (!comment)
                return null;
            return parser.parseFromString(comment.textContent || '', 'text/html');
        })
            .filter((x) => x);
        return nodes;
    }
    // <code /> node is absent in old version profile page since use timeline node instead
    if (rootDom)
        return [rootDom];
    return [];
}

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/parse-username.ts
var parse_username = __webpack_require__(145);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/content-script/tasks.ts
var tasks = __webpack_require__(103);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/utils.ts
var utils = __webpack_require__(12);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/tabs.ts
async function getActiveTabFacebook() {
    const [tab] = await browser.tabs.query({
        url: ['https://www.facebook.com/*', 'https://m.facebook.com/*'],
        pinned: false,
    });
    if (tab)
        return tab.id;
    return undefined;
}

// EXTERNAL MODULE: ./packages/maskbook/src/utils/dom.ts
var dom = __webpack_require__(86);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/Worker/fetchPostContent.ts






// ? We now always run fetch request from an active tab.
// ? If failed, we will fallback to open a new tab to do this.
async function fetchPostContentFacebook(post) {
    var _a;
    const activeTabID = await getActiveTabFacebook();
    if (activeTabID !== undefined) {
        // Path 1: fetch by http req
        const url = Object(parse_username["b" /* getPostUrlAtFacebook */])(post, 'fetch');
        const { memoizeFetch } = Object(tasks["a" /* default */])(activeTabID);
        const html = await Object(utils["t" /* timeout */])(memoizeFetch(url), 10000).catch((_) => null);
        if (html !== null) {
            try {
                const doc = parseFacebookStaticHTML(html);
                if (doc.length)
                    return doc.map((x) => (Object(dom["a" /* isDocument */])(x) ? x.body : x).innerText).join('');
            }
            catch (e) {
                console.warn(e);
                (_a = memoizeFetch.cache) === null || _a === void 0 ? void 0 : _a.delete(url);
            }
        }
    }
    // Path 2: fetch by tab task
    return Object(tasks["a" /* default */])(Object(parse_username["b" /* getPostUrlAtFacebook */])(post, 'open')).getPostContent();
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/Worker/fetchProfile.ts





// ? We now always run fetch request from an active tab.
// ? If failed, we will fallback to open a new tab to do this.
async function fetchProfileFacebook(who) {
    var _a;
    const activeTabID = await getActiveTabFacebook();
    if (activeTabID) {
        const url = Object(parse_username["c" /* getProfilePageUrlAtFacebook */])(who, 'fetch');
        const { memoizeFetch } = Object(tasks["a" /* default */])(activeTabID);
        const html = await Object(utils["t" /* timeout */])(memoizeFetch(url), 10000).catch((_) => null);
        if (html !== null) {
            // Path 1: fetch by http req
            try {
                const doc = parseFacebookStaticHTML(html);
                if (!doc.length)
                    throw new Error("Can't parse the page");
                const bio = doc
                    .map((doc) => doc.querySelector('#intro_container_id') ||
                    doc.querySelector('#bio') ||
                    doc.querySelector('div > div > div:nth-child(2) > div:nth-child(2)'))
                    .map((x) => x && x.innerText)
                    .join('');
                return { bioContent: bio };
            }
            catch (e) {
                console.warn(e);
                (_a = memoizeFetch.cache) === null || _a === void 0 ? void 0 : _a.delete(url);
            }
        }
    }
    // Path 2: fetch by tab task
    return Object(tasks["a" /* default */])(Object(parse_username["c" /* getProfilePageUrlAtFacebook */])(who, 'open')).getProfile(who);
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/worker-provider.ts




const facebookWorkerSelf = Object(worker["a" /* defineSocialNetworkWorker */])({
    ...shared_provider["a" /* sharedProvider */],
    fetchPostContent: fetchPostContentFacebook,
    fetchProfile: fetchProfileFacebook,
});

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/index.ts
var twitter_com = __webpack_require__(322);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/utils/url.ts
var utils_url = __webpack_require__(81);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/utils/isMobile.ts
var isMobile = __webpack_require__(245);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/worker/fetch.ts



/**
 *  get things at server side with legacy twitter
 *  seems not possible since we cannot access the
 *  legacy twitter with only a fetch.
 *  resolve this problem when you can.
 */
const fetchPostContent = (post) => {
    return Object(tasks["a" /* default */])(Object(utils_url["b" /* getPostUrlAtTwitter */])(post)).getPostContent();
};
const fetchProfile = (self) => {
    return Object(tasks["a" /* default */])(Object(utils_url["c" /* getProfileUrlAtTwitter */])(self, isMobile["a" /* isMobileTwitter */]), {}).getProfile(self);
};

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/worker/index.ts



const twitterWorkerSelf = Object(worker["a" /* defineSocialNetworkWorker */])({
    ...twitter_com["a" /* sharedSettings */],
    fetchPostContent: fetchPostContent,
    fetchProfile: fetchProfile,
});

// EXTERNAL MODULE: ./packages/maskbook/src/utils/safeRequire.ts
var safeRequire = __webpack_require__(186);

// CONCATENATED MODULE: ./packages/maskbook/src/provider.worker.ts



Object(safeRequire["b" /* safeOptionsPageWorker */])();


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

/***/ 646:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "resolveTCOLink", function() { return resolveTCOLink; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "fetch", function() { return fetch; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "saveAsFile", function() { return saveAsFile; });
/* harmony import */ var _utils_memoize__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(138);

const cache = new Map();
const resolveTCOLink = Object(_utils_memoize__WEBPACK_IMPORTED_MODULE_0__[/* memoizePromise */ "a"])(async (u) => {
    if (!u.startsWith('https://t.co/'))
        return null;
    if (cache.has(u))
        return cache.get(u);
    const req = await globalThis.fetch(u, {
        redirect: 'error',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
    });
    const text = await req.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const dom = doc.querySelector('noscript > meta');
    if (!dom)
        return null;
    const [, url] = dom.content.split('URL=');
    if (url)
        cache.set(u, url);
    return url !== null && url !== void 0 ? url : null;
}, (x) => x);
function fetch(url) {
    return globalThis.fetch(url).then((x) => x.blob());
}
function saveAsFile(file, mineType, suggestingFileName) {
    const blob = new Blob([file], { type: mineType });
    const url = URL.createObjectURL(blob);
    return browser.downloads.download({
        url,
        filename: suggestingFileName,
        saveAs: true,
    });
}


/***/ }),

/***/ 647:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "generateBackupJSON", function() { return /* reexport */ generateBackupJSON; });
__webpack_require__.d(__webpack_exports__, "restoreBackup", function() { return /* reexport */ restoreBackup["c" /* restoreBackup */]; });
__webpack_require__.d(__webpack_exports__, "setUnconfirmedBackup", function() { return /* reexport */ restoreBackup["d" /* setUnconfirmedBackup */]; });
__webpack_require__.d(__webpack_exports__, "getUnconfirmedBackup", function() { return /* reexport */ restoreBackup["b" /* getUnconfirmedBackup */]; });
__webpack_require__.d(__webpack_exports__, "confirmBackup", function() { return /* reexport */ restoreBackup["a" /* confirmBackup */]; });
__webpack_require__.d(__webpack_exports__, "restoreNewIdentityWithMnemonicWord", function() { return /* binding */ restoreNewIdentityWithMnemonicWord; });
__webpack_require__.d(__webpack_exports__, "downloadBackup", function() { return /* binding */ downloadBackup; });
__webpack_require__.d(__webpack_exports__, "createBackupFile", function() { return /* binding */ createBackupFile; });
__webpack_require__.d(__webpack_exports__, "openOptionsPage", function() { return /* binding */ openOptionsPage; });
__webpack_require__.d(__webpack_exports__, "createPersonaByMnemonic", function() { return /* reexport */ database["b" /* createPersonaByMnemonic */]; });
__webpack_require__.d(__webpack_exports__, "queryPermission", function() { return /* binding */ queryPermission; });

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/String-ArrayBuffer.ts
var String_ArrayBuffer = __webpack_require__(62);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/utils.ts
var utils = __webpack_require__(12);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/mnemonic-code/index.ts
var mnemonic_code = __webpack_require__(299);

// EXTERNAL MODULE: ./packages/maskbook/src/database/index.ts + 8 modules
var database = __webpack_require__(69);

// EXTERNAL MODULE: ./packages/maskbook/src/database/Persona/Persona.db.ts + 1 modules
var Persona_db = __webpack_require__(48);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/mnemonic-code/localKeyGenerate.ts
var localKeyGenerate = __webpack_require__(444);

// EXTERNAL MODULE: ./packages/maskbook/src/database/group.ts
var group = __webpack_require__(169);

// EXTERNAL MODULE: ./packages/maskbook/src/database/post.ts
var post = __webpack_require__(181);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/BackupFormat/JSON/DBRecord-JSON/PersonaRecord.ts
var PersonaRecord = __webpack_require__(445);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/BackupFormat/JSON/DBRecord-JSON/ProfileRecord.ts
var ProfileRecord = __webpack_require__(446);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/BackupFormat/JSON/DBRecord-JSON/GroupRecord.ts
var GroupRecord = __webpack_require__(448);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/BackupFormat/JSON/DBRecord-JSON/PostRecord.ts
var PostRecord = __webpack_require__(447);

// EXTERNAL MODULE: ./packages/maskbook/src/database/type.ts
var type = __webpack_require__(4);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Wallet/services/index.ts + 5 modules
var services = __webpack_require__(393);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/BackupFormat/JSON/DBRecord-JSON/WalletRecord.ts + 1 modules
var WalletRecord = __webpack_require__(449);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/types.ts
var types = __webpack_require__(3);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/background-script/WelcomeServices/generateBackupJSON.ts











async function generateBackupJSON(opts = {}) {
    const personas = [];
    const posts = [];
    const wallets = [];
    const profiles = [];
    const userGroups = [];
    if (!opts.filter) {
        if (!opts.noPersonas)
            await backupPersonas();
        if (!opts.noProfiles)
            await backProfiles();
    }
    else if (opts.filter.type === 'persona') {
        if (opts.noPersonas)
            throw new TypeError('Invalid opts');
        await backupPersonas(opts.filter.wanted);
        const wantedProfiles = personas.flatMap((q) => q.linkedProfiles
            .map((y) => type["Identifier"].fromString(y[0], type["ProfileIdentifier"]))
            .filter((k) => k.ok)
            .map((x) => x.val));
        if (!opts.noProfiles)
            await backProfiles(wantedProfiles);
    }
    if (!opts.noUserGroups)
        await backupAllUserGroups();
    if (!opts.noPosts)
        await backupAllPosts();
    if (!opts.noWallets)
        await backupAllWallets();
    return {
        _meta_: {
            createdAt: Date.now(),
            maskbookVersion: browser.runtime.getManifest().version,
            version: 2,
            type: 'maskbook-backup',
        },
        grantedHostPermissions: (await browser.permissions.getAll()).origins || [],
        personas,
        posts,
        wallets,
        profiles,
        userGroups,
    };
    async function backupAllPosts() {
        posts.push(...(await Object(post["queryPostsDB"])(() => true)).map(PostRecord["b" /* PostRecordToJSONFormat */]));
    }
    async function backupAllUserGroups() {
        userGroups.push(...(await Object(group["queryUserGroupsDatabase"])(() => true)).map(GroupRecord["b" /* GroupRecordToJSONFormat */]));
    }
    async function backProfiles(of) {
        const data = (await Object(Persona_db["queryProfilesDB"])((p) => {
            if (of === undefined)
                return true;
            if (!of.some((x) => x.equals(p.identifier)))
                return false;
            if (!p.linkedPersona)
                return false;
            return true;
        })).map(ProfileRecord["b" /* ProfileRecordToJSONFormat */]);
        profiles.push(...data);
    }
    async function backupPersonas(of) {
        const data = (await Object(Persona_db["queryPersonasDB"])((p) => {
            if (p.uninitialized)
                return false;
            if (opts.hasPrivateKeyOnly && !p.privateKey)
                return false;
            if (of === undefined)
                return true;
            if (!of.some((x) => x.equals(p.identifier)))
                return false;
            return true;
        })).map(PersonaRecord["b" /* PersonaRecordToJSONFormat */]);
        personas.push(...data);
    }
    async function backupAllWallets() {
        const wallets_ = (await Object(services["getWallets"])(types["d" /* ProviderType */].Maskbook)).map(WalletRecord["b" /* WalletRecordToJSONFormat */]);
        wallets.push(...wallets_);
    }
}

// EXTERNAL MODULE: ./packages/maskbook/src/extension/content-script/tasks.ts
var tasks = __webpack_require__(103);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/background-script/HelperService.ts
var HelperService = __webpack_require__(646);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/background-script/WelcomeServices/restoreBackup.ts
var restoreBackup = __webpack_require__(443);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/Context.js
var Context = __webpack_require__(54);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/background-script/WelcomeService.ts












Object(Context["d" /* assertEnvironment */])(Context["a" /* Environment */].ManifestBackground);
/**
 * Recover new identity by a password and mnemonic words
 *
 * @param password password used to generate mnemonic word, can be empty string
 * @param word mnemonic words
 * @param info additional information
 */
async function restoreNewIdentityWithMnemonicWord(word, password, info) {
    const { key, mnemonicRecord } = await Object(mnemonic_code["b" /* recover_ECDH_256k1_KeyPair_ByMnemonicWord */])(word, password);
    const { privateKey, publicKey } = key;
    const localKeyJwk = await Object(localKeyGenerate["a" /* deriveLocalKeyFromECDHKey */])(publicKey, mnemonicRecord.words);
    const ecKeyID = await Object(database["a" /* createPersonaByJsonWebKey */])({
        publicKey,
        privateKey,
        localKey: info.localKey || localKeyJwk,
        mnemonic: mnemonicRecord,
        nickname: info.nickname,
    });
    if (info.whoAmI) {
        await Object(Persona_db["attachProfileDB"])(info.whoAmI, ecKeyID, info.details || { connectionConfirmState: 'pending' });
    }
    return ecKeyID;
}
async function downloadBackup(obj) {
    const string = typeof obj === 'string' ? obj : JSON.stringify(obj);
    const buffer = Object(String_ArrayBuffer["d" /* encodeText */])(string);
    const date = new Date();
    const today = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    Object(HelperService["saveAsFile"])(buffer, 'application/json', `maskbook-keystore-backup-${today}.json`);
    return obj;
}
async function createBackupFile(options) {
    const obj = await generateBackupJSON(options);
    if (!options.download)
        return obj;
    // Don't make the download pop so fast
    await Object(utils["s" /* sleep */])(1000);
    return downloadBackup(obj);
}
async function openOptionsPage(route, search) {
    return Object(tasks["b" /* exclusiveTasks */])(Object(utils["i" /* getUrl */])(route ? `/index.html#${route}${search ? `?${search}` : ''}` : '/index.html')).noop();
}

function queryPermission(permission) {
    return browser.permissions.contains(permission);
}


/***/ }),

/***/ 648:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return verifyOthersProve; });
/* harmony import */ var _utils_type_transform_SECP256k1_Compression__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(148);
/* harmony import */ var _database_type__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);
/* harmony import */ var _social_network_worker__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(102);
/* harmony import */ var _database__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(69);




async function verifyOthersProve(bio, others) {
    var _a, _b;
    const compressedX = typeof bio === 'string' ? Object(_social_network_worker__WEBPACK_IMPORTED_MODULE_2__[/* getNetworkWorker */ "c"])(others.network).unwrap().publicKeyDecoder(bio) : [bio.raw];
    if (!compressedX)
        return false;
    const publicKey = compressedX
        .map((x) => {
        try {
            return Object(_utils_type_transform_SECP256k1_Compression__WEBPACK_IMPORTED_MODULE_0__[/* decompressSecp256k1Key */ "b"])(x, 'public');
        }
        catch {
            return null;
        }
    })
        .filter((x) => x)[0];
    if (!publicKey)
        throw new Error('No key was found');
    // TODO: use json schema / other ways to verify the JWK
    // or
    // throw new Error(i18n.t('service_key_parse_failed'))
    // if privateKey, we should possibly not recreate it
    const hasPrivate = ((_a = (await Object(_database__WEBPACK_IMPORTED_MODULE_3__[/* queryPersonaRecord */ "i"])(_database_type__WEBPACK_IMPORTED_MODULE_1__["ECKeyIdentifier"].fromJsonWebKey(publicKey)))) === null || _a === void 0 ? void 0 : _a.privateKey) || ((_b = (await Object(_database__WEBPACK_IMPORTED_MODULE_3__[/* queryPersonaRecord */ "i"])(others))) === null || _b === void 0 ? void 0 : _b.privateKey);
    if (!hasPrivate)
        await Object(_database__WEBPACK_IMPORTED_MODULE_3__[/* createProfileWithPersona */ "c"])(others, { connectionConfirmState: 'pending' }, { publicKey });
    // TODO: unhandled case: if the profile is connected but a different key.
    return true;
}


/***/ }),

/***/ 649:
/***/ (function(module, exports) {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = function() { return []; };
webpackEmptyContext.resolve = webpackEmptyContext;
module.exports = webpackEmptyContext;
webpackEmptyContext.id = 649;

/***/ }),

/***/ 652:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return cryptoProviderTable; });
/* harmony import */ var _crypto_crypto_alpha_38__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(271);
/* harmony import */ var _crypto_crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(269);
/* harmony import */ var _crypto_crypto_alpha_40__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(111);



const cryptoProviderTable = {
    [-40]: _crypto_crypto_alpha_40__WEBPACK_IMPORTED_MODULE_2__,
    [-39]: _crypto_crypto_alpha_39__WEBPACK_IMPORTED_MODULE_1__,
    [-38]: _crypto_crypto_alpha_38__WEBPACK_IMPORTED_MODULE_0__,
};


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


/***/ }),

/***/ 69:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "f", function() { return /* reexport */ helpers_avatar["a" /* queryAvatarDataURL */]; });
__webpack_require__.d(__webpack_exports__, "q", function() { return /* reexport */ helpers_avatar["b" /* storeAvatar */]; });
__webpack_require__.d(__webpack_exports__, "e", function() { return /* reexport */ helpers["personaRecordToPersona"]; });
__webpack_require__.d(__webpack_exports__, "k", function() { return /* reexport */ helpers["queryProfile"]; });
__webpack_require__.d(__webpack_exports__, "l", function() { return /* reexport */ helpers["queryProfilePaged"]; });
__webpack_require__.d(__webpack_exports__, "h", function() { return /* reexport */ helpers["queryPersona"]; });
__webpack_require__.d(__webpack_exports__, "m", function() { return /* reexport */ helpers["queryProfilesWithQuery"]; });
__webpack_require__.d(__webpack_exports__, "d", function() { return /* reexport */ helpers["deletePersona"]; });
__webpack_require__.d(__webpack_exports__, "o", function() { return /* reexport */ helpers["renamePersona"]; });
__webpack_require__.d(__webpack_exports__, "p", function() { return /* reexport */ helpers["setupPersona"]; });
__webpack_require__.d(__webpack_exports__, "i", function() { return /* reexport */ helpers["queryPersonaRecord"]; });
__webpack_require__.d(__webpack_exports__, "n", function() { return /* reexport */ helpers["queryPublicKey"]; });
__webpack_require__.d(__webpack_exports__, "j", function() { return /* reexport */ helpers["queryPrivateKey"]; });
__webpack_require__.d(__webpack_exports__, "b", function() { return /* reexport */ helpers["createPersonaByMnemonic"]; });
__webpack_require__.d(__webpack_exports__, "a", function() { return /* reexport */ helpers["createPersonaByJsonWebKey"]; });
__webpack_require__.d(__webpack_exports__, "c", function() { return /* reexport */ helpers["createProfileWithPersona"]; });
__webpack_require__.d(__webpack_exports__, "g", function() { return /* reexport */ helpers["queryLocalKey"]; });

// UNUSED EXPORTS: createFriendsGroup, createDefaultFriendsGroup, addProfileToFriendsGroup, removeProfileFromFriendsGroup, queryUserGroups, profileRecordToProfile, queryPersonasWithQuery, queryPersonaByProfile

// EXTERNAL MODULE: ./packages/maskbook/src/database/group.ts
var group = __webpack_require__(169);

// EXTERNAL MODULE: ./packages/maskbook/src/database/type.ts
var type = __webpack_require__(4);

// EXTERNAL MODULE: ./packages/maskbook/src/database/helpers/group.ts
var helpers_group = __webpack_require__(230);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/background-script/IdentityService.ts
var IdentityService = __webpack_require__(451);

// CONCATENATED MODULE: ./packages/maskbook/src/database/migrate/create.user.group.for.old.users.ts




/**
 * If an identity has no default user group, create one
 */
async function createUserGroupForOldUsers() {
    const ids = await Object(IdentityService["queryMyProfiles"])();
    for (const id of ids) {
        const g = await Object(group["queryUserGroupDatabase"])(type["GroupIdentifier"].getDefaultFriendsGroupIdentifier(id.identifier));
        if (!g)
            Object(helpers_group["b" /* createDefaultFriendsGroup */])(id.identifier);
    }
}

// EXTERNAL MODULE: ./packages/maskbook/src/utils/browser.storage.ts
var browser_storage = __webpack_require__(224);

// EXTERNAL MODULE: ./packages/maskbook/src/database/Persona/Persona.db.ts + 1 modules
var Persona_db = __webpack_require__(48);

// EXTERNAL MODULE: ./packages/maskbook/src/database/Persona/helpers.ts
var helpers = __webpack_require__(266);

// CONCATENATED MODULE: ./packages/maskbook/src/database/migrate/fix.qr.private.key.bug.ts



/**
 * There is a bug that when use QR to import key, the private ket lost its secret.
 * If the JsonWebKey has no "d" field, remove the key and set maskbook as not setup.
 *
 * remove this after Mar 1 2020
 */
/* harmony default export */ var fix_qr_private_key_bug = (async function () {
    const ids = await Object(Persona_db["queryPersonasWithPrivateKey"])();
    let hasBug = false;
    for (const id of ids) {
        const key = id.privateKey;
        if (!key.d) {
            console.log('Key is broken');
            Object(helpers["deletePersona"])(id.identifier, 'delete even with private').catch(() => { });
            hasBug = true;
        }
    }
    if (hasBug) {
        Object(browser_storage["a" /* setStorage */])('facebook.com', { forceDisplayWelcome: true, userIgnoredWelcome: false });
        Object(browser_storage["a" /* setStorage */])('twitter.com', { forceDisplayWelcome: true, userIgnoredWelcome: false });
    }
});

// EXTERNAL MODULE: ./node_modules/idb/with-async-ittr-cjs.js
var with_async_ittr_cjs = __webpack_require__(179);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/CryptoKey-JsonWebKey.ts
var CryptoKey_JsonWebKey = __webpack_require__(88);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/Context.js
var Context = __webpack_require__(54);

// EXTERNAL MODULE: ./packages/maskbook/src/database/helpers/openDB.ts
var openDB = __webpack_require__(66);

// CONCATENATED MODULE: ./packages/maskbook/src/database/migrate/_deprecated_people_db.ts
/* eslint-disable import/no-deprecated */
/// <reference path="../global.d.ts" />
/**
 * @deprecated
 * This database is deprecated since Maskbook 1.8.10
 * Do not store new data in it.
 */
/**
 * Database structure:
 *
 * # ObjectStore `people`:
 * @description Store Other people.
 * @type {PersonRecordInDatabase}
 * @keys inline, {@link Person.identifier}
 * @index network
 *
 * # ObjectStore `myself`:
 * @description Store my identities.
 * @type {PersonRecordInDatabase}
 * @keys inline, {@link Person.identifier}
 *
 * # ObjectStore `localKeys`:
 * @description Store local AES keys.
 * @type {Record<string, AESJsonWebKey>} Record of <userId, CryptoKey>
 * @keys outline, string, which means network.
 */





Object(Context["d" /* assertEnvironment */])(Context["a" /* Environment */].ManifestBackground);
//#region Type and utils
/**
 * Transform data out of database
 */
async function outDb({ identifier, publicKey, privateKey, ...rest }) {
    // Restore prototype
    rest.previousIdentifiers &&
        rest.previousIdentifiers.forEach((y) => Object.setPrototypeOf(y, type["ProfileIdentifier"].prototype));
    rest.groups.forEach((y) => Object.setPrototypeOf(y, type["GroupIdentifier"].prototype));
    const result = {
        ...rest,
        identifier: type["Identifier"].fromString(identifier, type["ProfileIdentifier"]).unwrap(),
    };
    if (publicKey)
        result.publicKey = await Object(CryptoKey_JsonWebKey["b" /* JsonWebKeyToCryptoKey */])(publicKey, ...Object(CryptoKey_JsonWebKey["c" /* getKeyParameter */])('ecdh'));
    if (privateKey)
        result.privateKey = await Object(CryptoKey_JsonWebKey["b" /* JsonWebKeyToCryptoKey */])(privateKey, ...Object(CryptoKey_JsonWebKey["c" /* getKeyParameter */])('ecdh'));
    return result;
}
const db = Object(openDB["a" /* createDBAccess */])(() => Object(with_async_ittr_cjs["openDB"])('maskbook-people-v2', 1, {
    upgrade(db, oldVersion, _newVersion, transaction) {
        function v0_v1() {
            // inline keys
            db.createObjectStore('people', { keyPath: 'identifier' });
            // inline keys
            db.createObjectStore('myself', { keyPath: 'identifier' });
            db.createObjectStore('localKeys');
            transaction.objectStore('people').createIndex('network', 'network', { unique: false });
        }
        if (oldVersion < 1)
            v0_v1();
    },
}));
//#endregion
//#region Other people
/**
 * Query person with an identifier
 * @deprecated
 */
async function queryPeopleDB(query = () => true) {
    const t = (await db()).transaction('people');
    const result = [];
    if (typeof query === 'function') {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        for await (const { value, key } of t.store) {
            const id = type["Identifier"].fromString(key, type["ProfileIdentifier"]);
            if (id.err) {
                console.warn('Found invalid identifier', id.val.message);
                continue;
            }
            if (query(id.val, value))
                result.push(value);
        }
    }
    else {
        result.push(...(await t.objectStore('people').index('network').getAll(IDBKeyRange.only(query.network))));
    }
    return Promise.all(result.map(outDb));
}
//#endregion
//#region Myself
/**
 * Get all my identities.
 * @deprecated
 */
async function getMyIdentitiesDB() {
    const t = (await db()).transaction('myself');
    const result = await t.objectStore('myself').getAll();
    return Promise.all(result.map(outDb));
}
async function queryLocalKeyDB(identifier) {
    const t = (await db()).transaction('localKeys');
    if (typeof identifier === 'string') {
        const result = await t.objectStore('localKeys').get(identifier);
        return result || {};
    }
    else {
        const store = await queryLocalKeyDB(identifier.network);
        return store[identifier.userId] || null;
    }
}

// EXTERNAL MODULE: ./packages/maskbook/src/database/IdentifierMap.ts
var IdentifierMap = __webpack_require__(82);

// CONCATENATED MODULE: ./packages/maskbook/src/database/migrate/people.to.persona.ts
/* eslint-disable import/no-deprecated */





async function migratePeopleToPersona() {
    const myIDs = await getMyIdentitiesDB();
    const otherIDs = await queryPeopleDB(() => true);
    await migrateHelper_operateDB(myIDs, otherIDs, queryLocalKeyDB);
}
async function migrateHelper_operateDB(myIDs, otherIDs, getLocalKey) {
    const [personaMap, profilesMap, attachRelationMap] = await migrateHelper_importPersonaFromPersonRecord(myIDs, otherIDs, getLocalKey);
    await Persona_db["consistentPersonaDBWriteAccess"](async (t) => {
        var _a;
        for (const [v, incomingRecord] of personaMap) {
            const currentRecord = await Persona_db["queryPersonaDB"](incomingRecord.identifier, t);
            if (!currentRecord) {
                await Persona_db["createPersonaDB"](incomingRecord, t);
            }
        }
        for (const [v, incomingRecord] of profilesMap) {
            const currentRecord = await Persona_db["queryProfileDB"](incomingRecord.identifier, t);
            if (!currentRecord) {
                // remove the linkedPersona, call attachProfileDB to keep consistency
                const { linkedPersona, ...rec } = incomingRecord;
                await Persona_db["createProfileDB"](rec, t);
            }
        }
        for (const [profileID, personaID] of attachRelationMap) {
            const currentRecord = await Persona_db["queryPersonaDB"](personaID, t);
            const data = (_a = currentRecord.linkedProfiles.get(profileID)) !== null && _a !== void 0 ? _a : {
                connectionConfirmState: 'pending',
            };
            await Persona_db["attachProfileDB"](profileID, personaID, data, t);
        }
    });
    indexedDB.deleteDatabase('maskbook-people-v2');
}
async function migrateHelper_importPersonaFromPersonRecord(myIDs, otherIDs, getLocalKey) {
    const jwkMap = new Map();
    const attachRelationMap = new IdentifierMap["a" /* IdentifierMap */](new Map(), type["ProfileIdentifier"]);
    const localKeysMap = new IdentifierMap["a" /* IdentifierMap */](new Map(), type["ProfileIdentifier"]);
    const personaMap = new IdentifierMap["a" /* IdentifierMap */](new Map(), type["ECKeyIdentifier"]);
    const profilesMap = new IdentifierMap["a" /* IdentifierMap */](new Map(), type["ProfileIdentifier"]);
    await Promise.all(otherIDs.concat(myIDs).map(async (value) => {
        if (value.publicKey)
            jwkMap.set(value.publicKey, await Object(CryptoKey_JsonWebKey["a" /* CryptoKeyToJsonWebKey */])(value.publicKey));
        if (value.privateKey)
            jwkMap.set(value.privateKey, await Object(CryptoKey_JsonWebKey["a" /* CryptoKeyToJsonWebKey */])(value.privateKey));
        if (value.publicKey) {
            attachRelationMap.set(value.identifier, await type["ECKeyIdentifier"].fromCryptoKey(value.publicKey));
        }
    }));
    await Promise.all(myIDs.map(async (value) => {
        const key = await getLocalKey(value.identifier);
        key && localKeysMap.set(value.identifier, key);
    }));
    for (const profile of otherIDs.concat(myIDs)) {
        const ec_id = attachRelationMap.get(profile.identifier);
        if (profile.publicKey) {
            updateOrCreatePersonaRecord(personaMap, ec_id, profile, jwkMap);
        }
        updateOrCreateProfileRecord(profilesMap, attachRelationMap, localKeysMap, profile);
    }
    return [personaMap, profilesMap, attachRelationMap];
}
function updateOrCreatePersonaRecord(map, ec_id, profile, cryptoKeyMap) {
    const rec = map.get(ec_id);
    if (rec) {
        if (profile.privateKey) {
            // @ts-ignore
            rec.privateKey = cryptoKeyMap.get(profile.privateKey);
        }
        rec.linkedProfiles.set(profile.identifier, {
            connectionConfirmState: 'pending',
        });
    }
    else {
        map.set(ec_id, {
            // @ts-ignore
            privateKey: cryptoKeyMap.get(profile.privateKey),
            // @ts-ignore
            publicKey: cryptoKeyMap.get(profile.publicKey),
            createdAt: new Date(0),
            updatedAt: new Date(),
            linkedProfiles: new IdentifierMap["a" /* IdentifierMap */](new Map(), type["ProfileIdentifier"]),
            identifier: ec_id,
        });
        map.get(ec_id).linkedProfiles.set(profile.identifier, {
            connectionConfirmState: 'pending',
        });
    }
}
function updateOrCreateProfileRecord(map, ec_idMap, localKeyMap, profile) {
    var _a;
    const rec = map.get(profile.identifier);
    if (rec) {
        rec.nickname = (_a = rec.nickname) !== null && _a !== void 0 ? _a : profile.nickname;
    }
    else {
        map.set(profile.identifier, {
            createdAt: new Date(0),
            updatedAt: new Date(),
            identifier: profile.identifier,
            nickname: profile.nickname,
            localKey: localKeyMap.get(profile.identifier),
            linkedPersona: ec_idMap.get(profile.identifier),
        });
    }
}

// EXTERNAL MODULE: ./packages/maskbook/src/utils/dom.ts
var dom = __webpack_require__(86);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/side-effects.ts
var side_effects = __webpack_require__(147);

// CONCATENATED MODULE: ./packages/maskbook/src/database/migrate/index.ts





side_effects["a" /* sideEffect */].then(dom["c" /* untilDocumentReady */]).then(run);
function run() {
    createUserGroupForOldUsers();
    migratePeopleToPersona();
    fix_qr_private_key_bug();
}

// EXTERNAL MODULE: ./packages/maskbook/src/database/avatar.ts
var avatar = __webpack_require__(222);

// CONCATENATED MODULE: ./packages/maskbook/src/database/tasks/clean-avatar-profile.ts





async function cleanAvatarDB(anotherList) {
    const t = Object(openDB["c" /* createTransaction */])(await Object(avatar["createAvatarDBAccess"])(), 'readwrite')('avatars', 'metadata');
    const outdated = await Object(avatar["queryAvatarOutdatedDB"])('lastAccessTime', t);
    for (const each of outdated) {
        anotherList.set(each, undefined);
    }
    await Object(avatar["deleteAvatarsDB"])(Array.from(anotherList.keys()), t);
}
async function cleanProfileWithNoLinkedPersona() {
    setTimeout(cleanProfileWithNoLinkedPersona, 1000 * 60 * 60 * 24 * 7 /** days */);
    console.log('Run cleanProfileWithNoLinkedPersona...');
    const cleanedList = new IdentifierMap["a" /* IdentifierMap */](new Map(), type["ProfileIdentifier"], type["GroupIdentifier"]);
    const expired = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14 /** days */);
    await Object(Persona_db["consistentPersonaDBWriteAccess"])(async (t) => {
        for await (const x of t.objectStore('profiles')) {
            if (x.value.linkedPersona)
                continue;
            if (expired < x.value.updatedAt)
                continue;
            const id = type["Identifier"].fromString(x.value.identifier, type["ProfileIdentifier"]);
            if (id.ok)
                cleanedList.set(id.val, undefined);
            await x.delete();
        }
    }, false);
    await cleanAvatarDB(cleanedList);
}

// CONCATENATED MODULE: ./packages/maskbook/src/database/tasks/index.ts



side_effects["a" /* sideEffect */].then(dom["c" /* untilDocumentReady */]).then(() => {
    cleanProfileWithNoLinkedPersona();
});

// EXTERNAL MODULE: ./packages/maskbook/src/database/helpers/avatar.ts
var helpers_avatar = __webpack_require__(442);

// CONCATENATED MODULE: ./packages/maskbook/src/database/Persona/types.ts


// CONCATENATED MODULE: ./packages/maskbook/src/database/index.ts








/***/ }),

/***/ 810:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "encryptComment", function() { return /* reexport */ crypto_alpha_40["encryptComment"]; });
__webpack_require__.d(__webpack_exports__, "decryptComment", function() { return /* reexport */ crypto_alpha_40["decryptComment"]; });
__webpack_require__.d(__webpack_exports__, "encryptTo", function() { return /* reexport */ encryptTo; });
__webpack_require__.d(__webpack_exports__, "publishPostAESKey", function() { return /* reexport */ publishPostAESKey; });
__webpack_require__.d(__webpack_exports__, "appendShareTarget", function() { return /* reexport */ appendShareTarget; });
__webpack_require__.d(__webpack_exports__, "getSharedListOfPost", function() { return /* reexport */ getSharedListOfPost; });
__webpack_require__.d(__webpack_exports__, "verifyOthersProve", function() { return /* reexport */ verifyOthersProve["a" /* verifyOthersProve */]; });
__webpack_require__.d(__webpack_exports__, "getMyProveBio", function() { return /* reexport */ getMyProveBio; });
__webpack_require__.d(__webpack_exports__, "debugShowAllPossibleHashForPost", function() { return /* reexport */ debugShowAllPossibleHashForPost; });

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/Context.js
var Context = __webpack_require__(54);

// EXTERNAL MODULE: ./packages/maskbook/src/crypto/crypto-alpha-40.ts
var crypto_alpha_40 = __webpack_require__(111);

// EXTERNAL MODULE: ./packages/maskbook/src/crypto/crypto-alpha-38.ts
var crypto_alpha_38 = __webpack_require__(271);

// EXTERNAL MODULE: ./packages/maskbook/src/network/gun/index.ts
var gun = __webpack_require__(334);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/String-ArrayBuffer.ts
var String_ArrayBuffer = __webpack_require__(62);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/Payload.ts
var Payload = __webpack_require__(163);

// EXTERNAL MODULE: ./packages/maskbook/src/database/index.ts + 8 modules
var database = __webpack_require__(69);

// EXTERNAL MODULE: ./packages/maskbook/src/database/type.ts
var type = __webpack_require__(4);

// EXTERNAL MODULE: ./packages/maskbook/src/database/IdentifierMap.ts
var IdentifierMap = __webpack_require__(82);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/background-script/UserGroupService.ts
var UserGroupService = __webpack_require__(453);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/utils.ts
var utils = __webpack_require__(12);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/background-script/CryptoServices/prepareRecipientDetail.ts





async function prepareRecipientDetail(to) {
    const recipients = new IdentifierMap["a" /* IdentifierMap */](new Map(), type["ProfileIdentifier"]);
    const keys = new IdentifierMap["a" /* IdentifierMap */](new Map(), type["ProfileIdentifier"]);
    await Promise.all(to.map(async function self(who, _, __, detail = { at: new Date(), type: 'direct' }) {
        if (who instanceof type["ProfileIdentifier"]) {
            const pub = await Object(database["n" /* queryPublicKey */])(who);
            if (pub)
                keys.set(who, pub);
            append(who, detail);
        }
        else if (who instanceof type["GroupIdentifier"]) {
            const group = await Object(UserGroupService["queryUserGroup"])(who);
            if (!group)
                return; // ? should we throw?
            await Promise.all(group.members.map((x) => self(x, _, __, { type: 'group', at: new Date(), group: who })));
        }
        else
            Object(utils["u" /* unreachable */])(who);
    }));
    function append(who, reason) {
        if (!recipients.has(who))
            recipients.set(who, { reason: [] });
        recipients.get(who).reason.push(reason);
    }
    return [recipients, keys];
}

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/worker.ts
var social_network_worker = __webpack_require__(102);

// EXTERNAL MODULE: ./packages/maskbook/src/database/post.ts
var database_post = __webpack_require__(181);

// EXTERNAL MODULE: ./packages/maskbook/src/database/Persona/Persona.db.ts + 1 modules
var Persona_db = __webpack_require__(48);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/SECP256k1-Compression.ts
var SECP256k1_Compression = __webpack_require__(148);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/i18n-next.ts
var i18n_next = __webpack_require__(59);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/background-script/CryptoServices/encryptTo.ts












/**
 * This map stores <iv, [networkHint, othersAESKeyEncrypted]>.
 */
const OthersAESKeyEncryptedMap = new Map();
/**
 * Encrypt to a user
 * @param content       Original text
 * @param to            Encrypt target
 * @param whoAmI        Encrypt source
 * @returns Will return a tuple of [encrypted: string, token: string] where
 * - `encrypted` is the encrypted string
 * - `token` is used to call `publishPostAESKey` before post the content
 */
async function encryptTo(content, to, whoAmI, publicShared) {
    var _a;
    if (to.length === 0 && publicShared === false)
        return ['', ''];
    if (publicShared)
        to = [];
    const [recipients, toKey] = await prepareRecipientDetail(to);
    const minePrivateKey = await Object(database["j" /* queryPrivateKey */])(whoAmI);
    if (!minePrivateKey)
        throw new TypeError('Not inited yet');
    const stringifiedContent = crypto_alpha_38["typedMessageStringify"](content);
    const localKey = publicShared ? crypto_alpha_38["publicSharedAESKey"] : (await Object(database["g" /* queryLocalKey */])(whoAmI));
    const { encryptedContent: encryptedText, othersAESKeyEncrypted, ownersAESKeyEncrypted, iv, postAESKey, } = await crypto_alpha_38["encrypt1ToN"]({
        version: -38,
        content: stringifiedContent,
        othersPublicKeyECDH: Array.from(toKey.values()),
        ownersLocalKey: localKey,
        privateKeyECDH: minePrivateKey,
        iv: crypto.getRandomValues(new Uint8Array(16)),
    });
    const payload = {
        AESKeyEncrypted: Object(String_ArrayBuffer["c" /* encodeArrayBuffer */])(ownersAESKeyEncrypted),
        encryptedText: Object(String_ArrayBuffer["c" /* encodeArrayBuffer */])(encryptedText),
        iv: Object(String_ArrayBuffer["c" /* encodeArrayBuffer */])(iv),
        signature: '',
        sharedPublic: publicShared,
        version: -38,
        authorUserID: whoAmI,
    };
    try {
        const publicKey = (_a = (await Object(Persona_db["queryPersonaByProfileDB"])(whoAmI))) === null || _a === void 0 ? void 0 : _a.publicKey;
        if (publicKey)
            payload.authorPublicKey = Object(SECP256k1_Compression["a" /* compressSecp256k1Key */])(publicKey, 'public');
    }
    catch (e) { }
    payload.signature = '_';
    await Object(database_post["createPostDB"])({
        identifier: new type["PostIVIdentifier"](whoAmI.network, payload.iv),
        postBy: whoAmI,
        postCryptoKey: postAESKey,
        recipients: recipients,
        foundAt: new Date(),
        recipientGroups: to.filter((x) => x instanceof type["GroupIdentifier"]),
    });
    const postAESKeyToken = Object(String_ArrayBuffer["c" /* encodeArrayBuffer */])(iv);
    const worker = Object(social_network_worker["c" /* getNetworkWorker */])(whoAmI).unwrap();
    OthersAESKeyEncryptedMap.set(postAESKeyToken, [worker.gunNetworkHint, othersAESKeyEncrypted]);
    return [Object(Payload["a" /* constructAlpha38 */])(payload, worker.payloadEncoder), postAESKeyToken];
}
/**
 * MUST call before send post, or othersAESKeyEncrypted will not be published to the internet!
 * TODO: If we can use PostIVIdentifier to avoid this hacking way to publish PostAESKey?
 * @param iv Token that returns in the encryptTo
 */
async function publishPostAESKey(iv) {
    if (!OthersAESKeyEncryptedMap.has(iv))
        throw new Error(i18n_next["b" /* i18n */].t('service_publish_post_aes_key_failed'));
    // Use the latest payload version here since we do not accept new post for older version.
    return gun["a" /* GunAPI */].publishPostAESKeyOnGun2(-38, iv, ...OthersAESKeyEncryptedMap.get(iv));
}

// EXTERNAL MODULE: ./packages/maskbook/src/crypto/crypto-alpha-39.ts
var crypto_alpha_39 = __webpack_require__(269);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/background-script/CryptoServices/cryptoProviderTable.ts
var cryptoProviderTable = __webpack_require__(652);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/background-script/CryptoServices/appendShareTarget.ts









async function appendShareTarget(version, postAESKey, iv, people, whoAmI, reason) {
    const cryptoProvider = cryptoProviderTable["a" /* cryptoProviderTable */][version];
    if (typeof postAESKey === 'string') {
        const AESKey = await cryptoProvider.extractAESKeyInMessage(version, postAESKey, iv, (await Object(database["g" /* queryLocalKey */])(whoAmI)));
        return appendShareTarget(version, AESKey, iv, people, whoAmI, reason);
    }
    const myPrivateKey = (await Object(database["j" /* queryPrivateKey */])(whoAmI));
    if (version === -39 || version === -38) {
        const [, toKey] = await prepareRecipientDetail(people);
        const othersAESKeyEncrypted = await crypto_alpha_39["generateOthersAESKeyEncrypted"](version, postAESKey, myPrivateKey, Array.from(toKey.values()));
        gun["a" /* GunAPI */].publishPostAESKeyOnGun2(version, iv, Object(social_network_worker["c" /* getNetworkWorker */])(whoAmI).unwrap().gunNetworkHint, othersAESKeyEncrypted);
        Object(database_post["updatePostDB"])({
            identifier: new type["PostIVIdentifier"](whoAmI.network, iv),
            recipients: new IdentifierMap["a" /* IdentifierMap */](new Map(people.map((identifier) => [
                identifier.toText(),
                {
                    reason: [reason],
                    published: toKey.has(identifier),
                },
            ])), type["ProfileIdentifier"]),
        }, 'append');
    }
    else if (version === -40) {
        throw new TypeError('Version -40 cannot create new data anymore due to leaking risks.');
    }
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/background-script/CryptoServices/getSharedListOfPost.ts




//#endregion
//#region Append Recipients in future
/**
 * Get already shared target of the post
 * @param postSalt
 */
async function getSharedListOfPost(version, postSalt, postBy) {
    const ids = new Set();
    const nameInDB = ((await Object(database_post["queryPostDB"])(new type["PostIVIdentifier"](postBy.network, postSalt))) || { recipients: {} })
        .recipients;
    Object.keys(nameInDB).forEach((x) => ids.add(x));
    if (version === -40) {
        // eslint-disable-next-line import/no-deprecated
        const post = await gun["a" /* GunAPI */].getVersion1PostByHash(postSalt);
        if (!post)
            return [];
        delete post._;
        const nameInGun = Object.keys(post);
        // ? version 40 is for old facebook only
        nameInGun.forEach((x) => ids.add(new type["ProfileIdentifier"]('facebook.com', x).toText()));
    }
    return Promise.all(Array.from(ids)
        .map((x) => type["Identifier"].fromString(x, type["ProfileIdentifier"]))
        .filter((x) => x.ok)
        .map((x) => x.val)
        .map(database["k" /* queryProfile */]));
}

// EXTERNAL MODULE: ./packages/maskbook/src/extension/background-script/CryptoServices/verifyOthersProve.ts
var verifyOthersProve = __webpack_require__(648);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/background-script/CryptoServices/getMyProveBio.ts




//#endregion
//#region ProvePost, create & verify
async function getMyProveBio(whoAmI, networkHint) {
    const myIdentity = await Object(database["n" /* queryPublicKey */])(whoAmI);
    if (!myIdentity)
        return null;
    const compressed = Object(SECP256k1_Compression["a" /* compressSecp256k1Key */])(myIdentity, 'public');
    // FIXME: wait for #191
    return whoAmI instanceof type["ProfileIdentifier"]
        ? Object(social_network_worker["c" /* getNetworkWorker */])(whoAmI.network).unwrap().publicKeyEncoder(compressed)
        : networkHint
            ? Object(social_network_worker["c" /* getNetworkWorker */])(networkHint).unwrap().publicKeyEncoder(compressed)
            : compressed;
}

// EXTERNAL MODULE: ./packages/maskbook/src/network/gun/version.2/hash.ts
var hash = __webpack_require__(454);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/background-script/CryptoServices/debugShowAllPossibleHashForPost.ts



async function debugShowAllPossibleHashForPost(post, payloadVersion) {
    const friends = await Object(database["m" /* queryProfilesWithQuery */])((x) => x.identifier.network === post.network);
    return Promise.all(friends
        .filter((x) => x.linkedPersona)
        .map(async (x) => {
        var _a;
        return [
            x.identifier.toText(),
            (await Object(hash["d" /* hashPostSalt */])(post.postIV, Object(social_network_worker["c" /* getNetworkWorker */])(post).unwrap().gunNetworkHint)) +
                '-' +
                (await (payloadVersion <= -39 ? hash["c" /* hashCryptoKeyUnstable */] : hash["b" /* hashCryptoKey */])((await Object(database["n" /* queryPublicKey */])(x.identifier)))),
            (_a = x.linkedPersona) === null || _a === void 0 ? void 0 : _a.fingerprint,
        ];
    }));
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/background-script/CryptoService.ts

Object(Context["d" /* assertEnvironment */])(Context["a" /* Environment */].ManifestBackground);









/***/ }),

/***/ 935:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "worker-worker-12dd.worker.js"

/***/ })

/******/ });