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
/******/ 		167: 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
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
/******/ 	var jsonpArray = globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push([1534,0,4,5,9,8,7]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ 1534:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1543);
module.exports = __webpack_require__(344);


/***/ }),

/***/ 1543:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// NAMESPACE OBJECT: ./packages/maskbook/src/extension/debug-page/typeson-custom-types.ts
var typeson_custom_types_namespaceObject = {};
__webpack_require__.r(typeson_custom_types_namespaceObject);
__webpack_require__.d(typeson_custom_types_namespaceObject, "CryptoKeyRegistry", function() { return CryptoKeyRegistry; });

// EXTERNAL MODULE: ./node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(0);

// EXTERNAL MODULE: ./node_modules/react-dom/index.js
var react_dom = __webpack_require__(129);
var react_dom_default = /*#__PURE__*/__webpack_require__.n(react_dom);

// EXTERNAL MODULE: ./node_modules/lodash-es/lodash.js
var lodash = __webpack_require__(13);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/debug-page/issue.ts
var issue = __webpack_require__(421);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/debug-page/DebugInfo.tsx



const DEBUG_INFO = {
    'User Agent': navigator.userAgent,
    'Maskbook Version': "v1.19.3-92-g86902195",
    'Build Date': "2020-11-26T05:15:09.270Z",
    'Tag Name': "v1.19.4",
    'Commit Hash': "86902195",
    'Commit Date': "2020-11-26T05:08:18.000Z",
    'Remote URL': "git@github.com:DimensionDev/Maskbook.git",
    'Branch Name': "master",
    Dirty: false,
    'Tag Dirty': true,
};
const DebugInfo = () => {
    const onNewBugIssue = () => {
        open(Object(issue["a" /* makeNewBugIssueURL */])());
    };
    return (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])("pre", { children: Object(lodash["map"])(DEBUG_INFO, (value, key) => `${key}: ${value}`).join('\n') }, void 0),
            Object(jsx_runtime["jsx"])("button", Object.assign({ onClick: onNewBugIssue }, { children: "New bug issue" }), void 0)] }, void 0));
};

// EXTERNAL MODULE: ./node_modules/idb/with-async-ittr.js + 3 modules
var with_async_ittr = __webpack_require__(555);

// EXTERNAL MODULE: ./node_modules/typeson/dist/typeson.js
var typeson = __webpack_require__(491);
var typeson_default = /*#__PURE__*/__webpack_require__.n(typeson);

// EXTERNAL MODULE: ./node_modules/typeson-registry/dist/presets/builtin.js
var builtin = __webpack_require__(492);
var builtin_default = /*#__PURE__*/__webpack_require__.n(builtin);

// EXTERNAL MODULE: ./node_modules/typeson-registry/dist/presets/special-numbers.js
var special_numbers = __webpack_require__(380);
var special_numbers_default = /*#__PURE__*/__webpack_require__.n(special_numbers);

// EXTERNAL MODULE: ./node_modules/typeson-registry/dist/types/blob.js
var blob = __webpack_require__(493);
var blob_default = /*#__PURE__*/__webpack_require__.n(blob);

// EXTERNAL MODULE: ./node_modules/typeson-registry/dist/types/file.js
var types_file = __webpack_require__(494);
var file_default = /*#__PURE__*/__webpack_require__.n(types_file);

// EXTERNAL MODULE: ./node_modules/typeson-registry/dist/types/filelist.js
var filelist = __webpack_require__(495);
var filelist_default = /*#__PURE__*/__webpack_require__.n(filelist);

// EXTERNAL MODULE: ./node_modules/typeson-registry/dist/types/imagebitmap.js
var imagebitmap = __webpack_require__(496);
var imagebitmap_default = /*#__PURE__*/__webpack_require__.n(imagebitmap);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/debug-page/typeson-custom-types.ts
const CryptoKeyRegistry = {
    test(x) {
        return x instanceof CryptoKey && x.extractable;
    },
    async replaceAsync(key) {
        return {
            raw: await crypto.subtle.exportKey('raw', key),
            algorithm: key.algorithm,
            usages: key.usages,
        };
    },
    reviveAsync({ raw, algorithm, usages }) {
        return crypto.subtle.importKey('raw', raw, algorithm, true, usages);
    },
};

// CONCATENATED MODULE: ./packages/maskbook/src/extension/debug-page/typeson.ts

// @ts-ignore
 // @ts-ignore
 // @ts-ignore
 // @ts-ignore
 // @ts-ignore
 // @ts-ignore
 // @ts-ignore

const typeson_typeson = new typeson_default.a({});
typeson_typeson.register(builtin_default.a);
typeson_typeson.register(special_numbers_default.a);
typeson_typeson.register([blob_default.a, file_default.a, filelist_default.a, imagebitmap_default.a, special_numbers_default.a]);
typeson_typeson.register([typeson_custom_types_namespaceObject]);
/* harmony default export */ var debug_page_typeson = (typeson_typeson);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/debug-page/DatabaseOps.tsx



const DatabaseOps = () => {
    const onBackup = async () => {
        const payload = await backupAll();
        if (payload === undefined) {
            return;
        }
        const timestamp = ((value) => {
            const values = [
                value.getUTCFullYear(),
                value.getUTCMonth() + 1,
                value.getUTCDate(),
                value.getUTCHours(),
                value.getUTCMinutes(),
                value.getUTCSeconds(),
            ];
            return values.map((value) => value.toString().padStart(2, '0')).join('');
        })(new Date());
        download(`maskbook-dump-${timestamp}.json`, payload);
    };
    const onRestore = async () => {
        const file = await DatabaseOps_select();
        if (file === undefined) {
            return;
        }
        const parsed = await debug_page_typeson.parse(await file.text());
        await restoreAll(parsed);
    };
    const onClear = async () => {
        var _a;
        const databases = await ((_a = indexedDB.databases) === null || _a === void 0 ? void 0 : _a.call(indexedDB));
        if (databases === undefined) {
            return;
        }
        await Promise.all(databases.map(async ({ name }) => {
            await timeout(Object(with_async_ittr["b" /* wrap */])(indexedDB.deleteDatabase(name)), 500);
            console.log(`clear ${name}`);
        }));
    };
    return (Object(jsx_runtime["jsxs"])("section", { children: [Object(jsx_runtime["jsx"])("p", { children: Object(jsx_runtime["jsx"])("button", Object.assign({ onClick: onBackup }, { children: "Backup Database" }), void 0) }, void 0),
            Object(jsx_runtime["jsx"])("p", { children: Object(jsx_runtime["jsx"])("button", Object.assign({ onClick: onRestore }, { children: "Overwrite Database with backup" }), void 0) }, void 0),
            Object(jsx_runtime["jsx"])("p", { children: Object(jsx_runtime["jsx"])("button", Object.assign({ onClick: onClear }, { children: "Clear Database" }), void 0) }, void 0)] }, void 0));
};
function DatabaseOps_select() {
    return new Promise((resolve) => {
        const element = document.createElement('input');
        element.type = 'file';
        element.addEventListener('change', () => {
            var _a;
            resolve((_a = element.files) === null || _a === void 0 ? void 0 : _a[0]);
        });
        element.click();
    });
}
function download(name, part) {
    const element = document.createElement('a');
    element.href = URL.createObjectURL(new Blob([part]));
    element.download = name;
    element.click();
}
function timeout(promise, time) {
    return Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(undefined), time))]);
}
async function restoreAll(parsed) {
    console.log('restoring with', parsed);
    for (const { name, version, stores } of parsed.instances) {
        const db = await Object(with_async_ittr["a" /* openDB */])(name, version, {
            upgrade(db) {
                for (const name of db.objectStoreNames) {
                    db.deleteObjectStore(name);
                }
                for (const [storeName, { autoIncrement, keyPath, indexes }] of Object.entries(stores)) {
                    const store = db.createObjectStore(storeName, { autoIncrement, keyPath });
                    for (const { name, keyPath, multiEntry, unique } of indexes) {
                        store.createIndex(name, keyPath, { multiEntry, unique });
                    }
                }
            },
        });
        for (const [storeName, { records, keyPath }] of stores.entries()) {
            await db.clear(storeName);
            for (const [key, value] of records) {
                try {
                    if (keyPath) {
                        await db.add(storeName, value);
                    }
                    else {
                        await db.add(storeName, value, key);
                    }
                }
                catch (e) {
                    console.error('Recover error when ', key, value, parsed);
                    // Error from IndexedDB transaction is not recoverable
                    throw e;
                }
            }
        }
    }
}
async function backupAll() {
    var _a;
    const databases = await ((_a = indexedDB.databases) === null || _a === void 0 ? void 0 : _a.call(indexedDB));
    if (databases === undefined) {
        return;
    }
    const instances = [];
    for (const { name, version } of databases) {
        const db = await timeout(Object(with_async_ittr["a" /* openDB */])(name, version), 500);
        if (db === undefined) {
            continue;
        }
        const stores = new Map();
        for (const name of db.objectStoreNames) {
            const store = db.transaction(name).store;
            const indexes = [];
            for (const indexName of store.indexNames) {
                const index = store.index(indexName);
                indexes.push({
                    name: index.name,
                    unique: index.unique,
                    multiEntry: index.multiEntry,
                    keyPath: index.keyPath,
                });
            }
            const records = new Map();
            for await (const cursor of store) {
                records.set(cursor.key, cursor.value);
            }
            stores.set(name, {
                keyPath: store.keyPath,
                autoIncrement: store.autoIncrement,
                indexes,
                records,
            });
        }
        instances.push({ name: name, version: version, stores });
    }
    const payload = {
        buildInfo: {
            'user-agent': navigator.userAgent,
            version: "v1.19.3-92-g86902195",
            'build-date': "2020-11-26T05:15:09.270Z",
            'tag-name': "v1.19.4",
            'commit-hash': "86902195",
            'commit-date': "2020-11-26T05:08:18.000Z",
            'remote-url': "git@github.com:DimensionDev/Maskbook.git",
            'branch-name': "master",
            dirty: false,
            'tag-dirty': true,
        },
        instances,
    };
    return debug_page_typeson.stringify(payload, undefined, 2);
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/debug-page/Entry.tsx



const Entry = () => (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(DebugInfo, {}, void 0),
        Object(jsx_runtime["jsx"])(DatabaseOps, {}, void 0)] }, void 0));

// CONCATENATED MODULE: ./packages/maskbook/src/extension/debug-page/index.tsx



const container = document.createElement('main');
react_dom_default.a.render(Object(jsx_runtime["jsx"])(Entry, {}, void 0), container, () => {
    document.body.appendChild(container);
});


/***/ }),

/***/ 221:
/***/ (function(module, exports) {

module.exports = function(module) {
	if (!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),

/***/ 252:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/


/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};


/***/ }),

/***/ 344:
/***/ (function(module, exports) {

;(() => {
    if (typeof browser === 'undefined' || !browser) return
    const _permissions = browser.permissions || {}
    browser.permissions = new Proxy(_permissions, {
        get(target, prop, receiver) {
            if (prop === 'request') {
                return ({ origins }) => {
                    const item = localStorage.getItem('requestedUrls')
                    let requestedUrls = JSON.parse(item) || []
                    for (let i of origins) {
                        if (!requestedUrls.includes(i)) requestedUrls.push(i)
                    }
                    localStorage.setItem('requestedUrls', JSON.stringify(requestedUrls))
                    return Promise.resolve(true)
                }
            } else if (prop === 'getAll') {
                return () => {
                    const item = localStorage.getItem('requestedUrls')
                    return Promise.resolve({ origins: JSON.parse(item) || [] })
                }
            } else if (prop === 'contains') {
                return () => Promise.resolve(true)
            } else {
                return Reflect.get(target, prop, receiver)
            }
        },
        set() {
            return false
        },
    })
})()


/***/ }),

/***/ 421:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return makeNewBugIssueURL; });
const body = `\
# Bug Report

## Environment

User Agent: ${navigator.userAgent}
Version: ${"v1.19.3-92-g86902195"}
Tag Name: ${"v1.19.4"}
Build Date: ${"2020-11-26T05:15:09.270Z"}
Commit Hash: ${"86902195"}
Commit Date: ${"2020-11-26T05:08:18.000Z"}
Remote URL: ${"git@github.com:DimensionDev/Maskbook.git"}
Branch Name: ${"master"}

## Bug Info

### Actual Behavior

/* What happened? */\
`;
const makeNewBugIssueURL = () => {
    const url = new URL('https://github.com/DimensionDev/Maskbook/issues/new');
    url.searchParams.append('title', '[Bug] ');
    url.searchParams.append('labels', 'Type: Bug');
    url.searchParams.append('assignees', 'Jack-Works, jk234ert');
    url.searchParams.append('body', body);
    return url.toString();
};


/***/ }),

/***/ 85:
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ })

/******/ });