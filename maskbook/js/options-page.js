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
/******/ 		175: 0
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
/******/ 		return __webpack_require__.p + "js/" + ({"0":"npm.idb","2":"npm.bip39","156":"npm.arweave","157":"npm.axios","158":"npm.jsonwebtoken","159":"npm.lodash.includes","160":"npm.semver","161":"npm.tslib","162":"npm.webcrypto-liner","173":"npm.walletconnect"}[chunkId]||chunkId) + ".chunk.js"
/******/ 	}
/******/ 	function webextScriptSrc(chunkId) {
/******/ 		var publicPath = __webpack_require__.p
/******/ 		var scriptSrcPath = publicPath + "js/" + ({"0":"npm.idb","2":"npm.bip39","156":"npm.arweave","157":"npm.axios","158":"npm.jsonwebtoken","159":"npm.lodash.includes","160":"npm.semver","161":"npm.tslib","162":"npm.webcrypto-liner","173":"npm.walletconnect"}[chunkId]||chunkId) + ".chunk.js";
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
/******/ 	deferredModules.push([1004,1,3,4,6,5,9,8,7,62,141,138,140,145,143,134,144,73,133,150,54,131,127,63,19,93,21,102,110,72,111,136,49,91,126,78,135,96,50,84,122,59,139,121,68,142,61,55,146,41,76,24,11,108,109,92,87,69,115,70,90,42,46,22,149,106,47,128,83,18,104,105,57,75,130,45,117,118,114,74,31,36,56,48,60,51,12,14,29,28,89,52,82,67,35,37,77,38,137,40,23,34,98,44,119,27,94,120,101,66,123,97,81,13,88,107,25,147,58,148,113,26,116,99,100,32,124,125,64,30,71,33,43,53,129,103,86,79,65,85,112,95,17,15,39,132,80,16,20,154,155,153,151,10,152]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ 1004:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1542);
module.exports = __webpack_require__(344);


/***/ }),

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

/***/ 149:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export BrowserRouter */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return HashRouter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return Link; });
/* unused harmony export NavLink */
/* harmony import */ var react_router__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(76);
/* harmony import */ var _babel_runtime_helpers_esm_inheritsLoose__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(123);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var history__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(220);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5);
/* harmony import */ var prop_types__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(prop_types__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(2);
/* harmony import */ var _babel_runtime_helpers_esm_objectWithoutPropertiesLoose__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(153);
/* harmony import */ var tiny_invariant__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(44);











/**
 * The public API for a <Router> that uses HTML5 history.
 */

var BrowserRouter =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_helpers_esm_inheritsLoose__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(BrowserRouter, _React$Component);

  function BrowserRouter() {
    var _this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _React$Component.call.apply(_React$Component, [this].concat(args)) || this;
    _this.history = Object(history__WEBPACK_IMPORTED_MODULE_3__[/* createBrowserHistory */ "a"])(_this.props);
    return _this;
  }

  var _proto = BrowserRouter.prototype;

  _proto.render = function render() {
    return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(react_router__WEBPACK_IMPORTED_MODULE_0__[/* Router */ "d"], {
      history: this.history,
      children: this.props.children
    });
  };

  return BrowserRouter;
}(react__WEBPACK_IMPORTED_MODULE_2___default.a.Component);

if (false) {}

/**
 * The public API for a <Router> that uses window.location.hash.
 */

var HashRouter =
/*#__PURE__*/
function (_React$Component) {
  Object(_babel_runtime_helpers_esm_inheritsLoose__WEBPACK_IMPORTED_MODULE_1__[/* default */ "a"])(HashRouter, _React$Component);

  function HashRouter() {
    var _this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _React$Component.call.apply(_React$Component, [this].concat(args)) || this;
    _this.history = Object(history__WEBPACK_IMPORTED_MODULE_3__[/* createHashHistory */ "b"])(_this.props);
    return _this;
  }

  var _proto = HashRouter.prototype;

  _proto.render = function render() {
    return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(react_router__WEBPACK_IMPORTED_MODULE_0__[/* Router */ "d"], {
      history: this.history,
      children: this.props.children
    });
  };

  return HashRouter;
}(react__WEBPACK_IMPORTED_MODULE_2___default.a.Component);

if (false) {}

var resolveToLocation = function resolveToLocation(to, currentLocation) {
  return typeof to === "function" ? to(currentLocation) : to;
};
var normalizeToLocation = function normalizeToLocation(to, currentLocation) {
  return typeof to === "string" ? Object(history__WEBPACK_IMPORTED_MODULE_3__[/* createLocation */ "c"])(to, null, null, currentLocation) : to;
};

var forwardRefShim = function forwardRefShim(C) {
  return C;
};

var forwardRef = react__WEBPACK_IMPORTED_MODULE_2___default.a.forwardRef;

if (typeof forwardRef === "undefined") {
  forwardRef = forwardRefShim;
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

var LinkAnchor = forwardRef(function (_ref, forwardedRef) {
  var innerRef = _ref.innerRef,
      navigate = _ref.navigate,
      _onClick = _ref.onClick,
      rest = Object(_babel_runtime_helpers_esm_objectWithoutPropertiesLoose__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"])(_ref, ["innerRef", "navigate", "onClick"]);

  var target = rest.target;

  var props = Object(_babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_5__[/* default */ "a"])({}, rest, {
    onClick: function onClick(event) {
      try {
        if (_onClick) _onClick(event);
      } catch (ex) {
        event.preventDefault();
        throw ex;
      }

      if (!event.defaultPrevented && // onClick prevented default
      event.button === 0 && ( // ignore everything but left clicks
      !target || target === "_self") && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // ignore clicks with modifier keys
      ) {
          event.preventDefault();
          navigate();
        }
    }
  }); // React 15 compat


  if (forwardRefShim !== forwardRef) {
    props.ref = forwardedRef || innerRef;
  } else {
    props.ref = innerRef;
  }
  /* eslint-disable-next-line jsx-a11y/anchor-has-content */


  return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement("a", props);
});

if (false) {}
/**
 * The public API for rendering a history-aware <a>.
 */


var Link = forwardRef(function (_ref2, forwardedRef) {
  var _ref2$component = _ref2.component,
      component = _ref2$component === void 0 ? LinkAnchor : _ref2$component,
      replace = _ref2.replace,
      to = _ref2.to,
      innerRef = _ref2.innerRef,
      rest = Object(_babel_runtime_helpers_esm_objectWithoutPropertiesLoose__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"])(_ref2, ["component", "replace", "to", "innerRef"]);

  return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(react_router__WEBPACK_IMPORTED_MODULE_0__[/* __RouterContext */ "f"].Consumer, null, function (context) {
    !context ?  false ? undefined : Object(tiny_invariant__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(false) : void 0;
    var history = context.history;
    var location = normalizeToLocation(resolveToLocation(to, context.location), context.location);
    var href = location ? history.createHref(location) : "";

    var props = Object(_babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_5__[/* default */ "a"])({}, rest, {
      href: href,
      navigate: function navigate() {
        var location = resolveToLocation(to, context.location);
        var method = replace ? history.replace : history.push;
        method(location);
      }
    }); // React 15 compat


    if (forwardRefShim !== forwardRef) {
      props.ref = forwardedRef || innerRef;
    } else {
      props.innerRef = innerRef;
    }

    return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(component, props);
  });
});

if (false) { var refType, toType; }

var forwardRefShim$1 = function forwardRefShim(C) {
  return C;
};

var forwardRef$1 = react__WEBPACK_IMPORTED_MODULE_2___default.a.forwardRef;

if (typeof forwardRef$1 === "undefined") {
  forwardRef$1 = forwardRefShim$1;
}

function joinClassnames() {
  for (var _len = arguments.length, classnames = new Array(_len), _key = 0; _key < _len; _key++) {
    classnames[_key] = arguments[_key];
  }

  return classnames.filter(function (i) {
    return i;
  }).join(" ");
}
/**
 * A <Link> wrapper that knows if it's "active" or not.
 */


var NavLink = forwardRef$1(function (_ref, forwardedRef) {
  var _ref$ariaCurrent = _ref["aria-current"],
      ariaCurrent = _ref$ariaCurrent === void 0 ? "page" : _ref$ariaCurrent,
      _ref$activeClassName = _ref.activeClassName,
      activeClassName = _ref$activeClassName === void 0 ? "active" : _ref$activeClassName,
      activeStyle = _ref.activeStyle,
      classNameProp = _ref.className,
      exact = _ref.exact,
      isActiveProp = _ref.isActive,
      locationProp = _ref.location,
      sensitive = _ref.sensitive,
      strict = _ref.strict,
      styleProp = _ref.style,
      to = _ref.to,
      innerRef = _ref.innerRef,
      rest = Object(_babel_runtime_helpers_esm_objectWithoutPropertiesLoose__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"])(_ref, ["aria-current", "activeClassName", "activeStyle", "className", "exact", "isActive", "location", "sensitive", "strict", "style", "to", "innerRef"]);

  return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(react_router__WEBPACK_IMPORTED_MODULE_0__[/* __RouterContext */ "f"].Consumer, null, function (context) {
    !context ?  false ? undefined : Object(tiny_invariant__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(false) : void 0;
    var currentLocation = locationProp || context.location;
    var toLocation = normalizeToLocation(resolveToLocation(to, currentLocation), currentLocation);
    var path = toLocation.pathname; // Regex taken from: https://github.com/pillarjs/path-to-regexp/blob/master/index.js#L202

    var escapedPath = path && path.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
    var match = escapedPath ? Object(react_router__WEBPACK_IMPORTED_MODULE_0__[/* matchPath */ "g"])(currentLocation.pathname, {
      path: escapedPath,
      exact: exact,
      sensitive: sensitive,
      strict: strict
    }) : null;
    var isActive = !!(isActiveProp ? isActiveProp(match, currentLocation) : match);
    var className = isActive ? joinClassnames(classNameProp, activeClassName) : classNameProp;
    var style = isActive ? Object(_babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_5__[/* default */ "a"])({}, styleProp, {}, activeStyle) : styleProp;

    var props = Object(_babel_runtime_helpers_esm_extends__WEBPACK_IMPORTED_MODULE_5__[/* default */ "a"])({
      "aria-current": isActive && ariaCurrent || null,
      className: className,
      style: style,
      to: toLocation
    }, rest); // React 15 compat


    if (forwardRefShim$1 !== forwardRef$1) {
      props.ref = forwardedRef || innerRef;
    } else {
      props.innerRef = innerRef;
    }

    return react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(Link, props);
  });
});

if (false) { var ariaCurrentType; }


//# sourceMappingURL=react-router-dom.js.map


/***/ }),

/***/ 1516:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__.p + "web-workersQRCode-worker-f1c9.worker.js"

/***/ }),

/***/ 1542:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "Dashboard", function() { return /* binding */ Dashboard; });

// EXTERNAL MODULE: ./node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(0);

// EXTERNAL MODULE: ./packages/maskbook/src/provider.worker.ts + 7 modules
var provider_worker = __webpack_require__(613);

// EXTERNAL MODULE: ./packages/maskbook/src/setup.ui.ts + 1 modules
var setup_ui = __webpack_require__(479);

// EXTERNAL MODULE: ./node_modules/react/index.js
var react = __webpack_require__(1);

// EXTERNAL MODULE: ./node_modules/react-use/esm/useAsync.js
var useAsync = __webpack_require__(295);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Box/Box.js
var Box = __webpack_require__(332);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/CircularProgress/CircularProgress.js
var CircularProgress = __webpack_require__(1557);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Typography/Typography.js
var Typography = __webpack_require__(110);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Card/Card.js
var Card = __webpack_require__(923);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/NoSsr/NoSsr.js
var NoSsr = __webpack_require__(1682);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/CssBaseline/CssBaseline.js
var CssBaseline = __webpack_require__(1683);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/makeStyles.js
var makeStyles = __webpack_require__(109);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/createStyles.js
var createStyles = __webpack_require__(127);

// EXTERNAL MODULE: ./node_modules/@material-ui/styles/esm/ThemeProvider/ThemeProvider.js
var ThemeProvider = __webpack_require__(439);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/PeopleOutlined.js
var PeopleOutlined = __webpack_require__(911);
var PeopleOutlined_default = /*#__PURE__*/__webpack_require__.n(PeopleOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/CreditCard.js
var CreditCard = __webpack_require__(912);
var CreditCard_default = /*#__PURE__*/__webpack_require__.n(CreditCard);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/BookmarkBorderOutlined.js
var BookmarkBorderOutlined = __webpack_require__(913);
var BookmarkBorderOutlined_default = /*#__PURE__*/__webpack_require__.n(BookmarkBorderOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/SettingsOutlined.js
var SettingsOutlined = __webpack_require__(914);
var SettingsOutlined_default = /*#__PURE__*/__webpack_require__.n(SettingsOutlined);

// EXTERNAL MODULE: ./node_modules/react-router/esm/react-router.js
var react_router = __webpack_require__(76);

// EXTERNAL MODULE: ./node_modules/react-router-dom/esm/react-router-dom.js
var react_router_dom = __webpack_require__(149);

// EXTERNAL MODULE: ./node_modules/react-i18next/dist/es/I18nextProvider.js
var I18nextProvider = __webpack_require__(1556);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/i18n-next-ui.ts
var i18n_next_ui = __webpack_require__(10);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/i18n-next.ts
var i18n_next = __webpack_require__(59);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/theme.ts
var utils_theme = __webpack_require__(116);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Link/Link.js
var Link = __webpack_require__(556);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Breadcrumbs/Breadcrumbs.js + 2 modules
var Breadcrumbs = __webpack_require__(1695);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Avatar/Avatar.js + 1 modules
var Avatar = __webpack_require__(931);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/IconButton/IconButton.js
var IconButton = __webpack_require__(331);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Facebook.js
var Facebook = __webpack_require__(880);
var Facebook_default = /*#__PURE__*/__webpack_require__.n(Facebook);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Twitter.js
var Twitter = __webpack_require__(881);
var Twitter_default = /*#__PURE__*/__webpack_require__.n(Twitter);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/GitHub.js
var GitHub = __webpack_require__(882);
var GitHub_default = /*#__PURE__*/__webpack_require__.n(GitHub);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/options-page/DashboardDialogs/Base.tsx
var Base = __webpack_require__(20);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardDialogs/About.tsx







const useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    wrapper: {
        width: 580,
        height: 660,
        lineHeight: 1.75,
    },
    header: {
        height: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'url(/about-dialog-background.png) no-repeat center / cover',
    },
    maskface: {
        width: 120,
        height: 120,
        marginTop: 75,
    },
    masktext: {
        marginTop: 20,
        marginBottom: 20,
    },
    version: {
        color: '#FFF',
        fontSize: 12,
        marginBottom: 20,
    },
    main: {
        fontSize: 16,
        textAlign: 'center',
        margin: '24px 68px',
    },
    getInTouch: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 28,
    },
    icon: {
        color: theme.palette.text.primary,
    },
    close: {
        color: '#FFF',
    },
    brands: {
        marginTop: theme.spacing(1),
        '& > *': {
            margin: theme.spacing(0, 1),
            cursor: 'pointer',
        },
    },
    footer: {
        borderTop: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.secondary,
        fontSize: '0.77rem',
        margin: theme.spacing(0, 2),
        padding: theme.spacing(2, 2, 3, 6),
    },
}));
function DashboardAboutDialog(props) {
    var _a, _b, _c;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = useStyles();
    const version = (_c = (_b = (_a = globalThis.browser) === null || _a === void 0 ? void 0 : _a.runtime.getManifest()) === null || _b === void 0 ? void 0 : _b.version) !== null && _c !== void 0 ? _c : "v1.19.4".slice(1);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { CloseIconProps: { className: classes.close } }, { children: Object(jsx_runtime["jsxs"])("section", Object.assign({ className: classes.wrapper }, { children: [Object(jsx_runtime["jsxs"])("header", Object.assign({ className: classes.header }, { children: [Object(jsx_runtime["jsx"])(Avatar["a" /* default */], { className: classes.maskface, src: "/MB--CircleCanvas--WhiteOverBlue.svg" }, void 0),
                        Object(jsx_runtime["jsx"])("img", { className: classes.masktext, src: "/maskbook-title-white.svg" }, void 0),
                        Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.version, variant: "body2", color: "inherit" }, { children: t( true ? 'version_of_stable' : undefined, {
                                version,
                                build: "stable",
                                hash: "86902195",
                            }) }), void 0)] }), void 0),
                Object(jsx_runtime["jsxs"])("main", Object.assign({ className: classes.main }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ component: "p", variant: "inherit" }, { children: t('about_dialog_description') }), void 0),
                        Object(jsx_runtime["jsxs"])("section", Object.assign({ className: classes.getInTouch }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ variant: "inherit" }, { children: t('about_dialog_touch') }), void 0),
                                Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.brands }, { children: [Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ className: classes.icon, target: "_blank", size: "small", href: "https://www.facebook.com/groups/324857694838456" }, { children: Object(jsx_runtime["jsx"])(Facebook_default.a, {}, void 0) }), void 0),
                                        Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ className: classes.icon, target: "_blank", size: "small", href: "https://twitter.com/realmaskbook" }, { children: Object(jsx_runtime["jsx"])(Twitter_default.a, {}, void 0) }), void 0),
                                        Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ className: classes.icon, target: "_blank", size: "small", href: "https://github.com/DimensionDev/Maskbook" }, { children: Object(jsx_runtime["jsx"])(GitHub_default.a, {}, void 0) }), void 0)] }), void 0)] }), void 0)] }), void 0),
                Object(jsx_runtime["jsxs"])("footer", Object.assign({ className: classes.footer }, { children: [Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ component: "p", variant: "inherit" }, { children: [Object(jsx_runtime["jsx"])("span", { children: t('about_dialog_feedback') }, void 0),
                                Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ href: `mailto:${t('dashboard_email_address')}` }, { children: t('dashboard_email_address') }), void 0)] }), void 0),
                        Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ component: "p", variant: "inherit" }, { children: [Object(jsx_runtime["jsx"])("span", { children: t('about_dialog_source_code') }, void 0),
                                Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ href: t('dashboard_source_code_link') }, { children: t('dashboard_source_code_link') }), void 0)] }), void 0),
                        Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ component: "p", variant: "inherit" }, { children: [t('about_dialog_license'), " ", t('dashboard_license')] }), void 0)] }), void 0)] }), void 0) }), void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/FooterLine.tsx







const FooterLine_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    footerButtons: {
        '& ol': {
            justifyContent: 'center',
        },
    },
    footerButton: {
        borderRadius: '0',
        whiteSpace: 'nowrap',
        '& > p': {
            fontSize: 12,
        },
    },
}));
const FooterLink = function (props) {
    const classes = FooterLine_useStyles();
    const children = Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ variant: "body2" }, { children: props.children }), void 0);
    if ('href' in props)
        return (Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ underline: "none" }, props, { target: "_blank", rel: "noopener noreferrer", color: "textPrimary", className: classes.footerButton }, { children: children }), void 0));
    if ('to' in props)
        return (Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ underline: "none" }, props, { component: react_router_dom["b" /* Link */], color: "textPrimary", className: classes.footerButton }, { children: children }), void 0));
    return (Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ underline: "none" }, props, { component: "a", style: { cursor: 'pointer' }, color: "textPrimary", className: classes.footerButton }, { children: children }), void 0));
};
function FooterLine() {
    var _a, _b, _c;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = FooterLine_useStyles();
    const [aboutDialog, openAboutDialog] = Object(Base["c" /* useModal */])(DashboardAboutDialog);
    const version = (_c = (_b = (_a = globalThis.browser) === null || _a === void 0 ? void 0 : _a.runtime.getManifest()) === null || _b === void 0 ? void 0 : _b.version) !== null && _c !== void 0 ? _c : "v1.19.4".slice(1);
    const openVersionLink = (event) => {
        // `MouseEvent.prototype.metaKey` on macOS (`Command` key), Windows (`Windows` key), Linux (`Super` key)
        if ( true && event.metaKey === false) {
            open(t('version_of_release', { tag: `v${version}` }));
        }
        else {
            open(t('version_of_hash', { hash: "86902195" }));
        }
    };
    return (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsxs"])(Breadcrumbs["a" /* default */], Object.assign({ className: classes.footerButtons, separator: "-", "aria-label": "breadcrumb" }, { children: [Object(jsx_runtime["jsx"])(FooterLink, Object.assign({ href: "https://mask.io" }, { children: "Mask.io" }), void 0),
                    Object(jsx_runtime["jsx"])(FooterLink, Object.assign({ onClick: openAboutDialog }, { children: t('about') }), void 0),
                    Object(jsx_runtime["jsx"])(FooterLink, Object.assign({ onClick: openVersionLink, title: "v1.19.3-92-g86902195" }, { children: t( true ? 'version_of_stable' : undefined, {
                            version,
                            build: "stable",
                            hash: "86902195",
                        }) }), void 0),
                    Object(jsx_runtime["jsx"])(FooterLink, Object.assign({ href: t('dashboard_mobile_test_link') }, { children: t('dashboard_mobile_test') }), void 0),
                    Object(jsx_runtime["jsx"])(FooterLink, Object.assign({ href: t('dashboard_source_code_link') }, { children: t('dashboard_source_code') }), void 0),
                    Object(jsx_runtime["jsx"])(FooterLink, Object.assign({ href: t('privacy_policy_link') }, { children: t('privacy_policy') }), void 0)] }), void 0), aboutDialog] }, void 0));
}

// EXTERNAL MODULE: ./node_modules/classnames/index.js
var classnames = __webpack_require__(53);
var classnames_default = /*#__PURE__*/__webpack_require__.n(classnames);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/List/List.js
var List = __webpack_require__(1608);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListItem/ListItem.js
var ListItem = __webpack_require__(1558);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListItemIcon/ListItemIcon.js
var ListItemIcon = __webpack_require__(1619);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListItemText/ListItemText.js
var ListItemText = __webpack_require__(1607);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Divider/Divider.js
var Divider = __webpack_require__(1625);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ChevronRight.js
var ChevronRight = __webpack_require__(634);
var ChevronRight_default = /*#__PURE__*/__webpack_require__.n(ChevronRight);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/SentimentSatisfiedOutlined.js
var SentimentSatisfiedOutlined = __webpack_require__(883);
var SentimentSatisfiedOutlined_default = /*#__PURE__*/__webpack_require__.n(SentimentSatisfiedOutlined);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/smile.js
var smile = __webpack_require__(1667);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TextField/TextField.js + 1 modules
var TextField = __webpack_require__(932);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/ActionButton.tsx
var ActionButton = __webpack_require__(47);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardDialogs/Feedback.tsx







function DashboardFeedbackDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const [name, setName] = Object(react["useState"])('');
    const [email, setEmail] = Object(react["useState"])('');
    const [message, setMessage] = Object(react["useState"])('');
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { icon: Object(jsx_runtime["jsx"])(smile["a" /* default */], {}, void 0), iconColor: "#F8B03E", primary: t('feedback'), content: Object(jsx_runtime["jsxs"])("form", { children: [Object(jsx_runtime["jsx"])(TextField["a" /* default */], { required: true, autoFocus: true, label: t('name'), value: name, onChange: (e) => setName(e.target.value) }, void 0),
                    Object(jsx_runtime["jsx"])(TextField["a" /* default */], { style: { display: 'none' }, required: true, label: t('email'), type: "email", value: email, onChange: (e) => setEmail(e.target.value) }, void 0),
                    Object(jsx_runtime["jsx"])(TextField["a" /* default */], { multiline: true, rows: 4, required: true, label: t('your_message'), value: message, onChange: (e) => setMessage(e.target.value) }, void 0)] }, void 0), footer: Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ variant: "contained", disabled: Boolean(!name || !message), onClick: async () => {
                    const url = new URL(`mailto:${t('dashboard_email_address')}`);
                    url.searchParams.set('subject', name);
                    url.searchParams.set('body', message);
                    window.open(url.toString());
                } }, { children: t('submit') }), void 0) }, void 0) }), void 0));
}

// EXTERNAL MODULE: ./node_modules/lodash-es/lodash.js
var lodash = __webpack_require__(13);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/MaskbookLogo.tsx

function MaskbookLogo() {
    return (Object(jsx_runtime["jsx"])("svg", Object.assign({ style: { display: 'block' }, height: "17.59", viewBox: "0 0 138 21", width: "119", xmlns: "http://www.w3.org/2000/svg" }, { children: Object(jsx_runtime["jsx"])("path", { d: "m18.902 25.67h1.82v18.33h-3.744v-10.14l-5.668 7.956-5.694-7.956v10.14h-3.718v-18.33h1.82l7.592 10.504zm15.912 4.212h3.614v14.118h-3.614v-1.04c-1.17.78-2.574 1.248-4.134 1.248-4.42 0-7.02-3.562-7.02-7.306 0-3.77 2.6-7.306 7.02-7.306 1.482 0 2.938.468 4.134 1.17zm0 9.88v-5.668c-.884-.754-2.132-1.222-3.484-1.222-2.574 0-4.186 1.924-4.186 4.03 0 2.132 1.638 4.056 4.186 4.056 1.378 0 2.6-.442 3.484-1.196zm6.084 3.094 1.352-2.678c1.742.754 3.068 1.144 4.836 1.144 1.664 0 2.314-.624 2.314-1.352 0-.806-.806-1.17-2.99-1.638-3.042-.676-5.252-1.664-5.252-4.394 0-2.548 2.106-4.316 5.382-4.316 2.21 0 3.978.52 5.512 1.144l-1.196 2.652c-1.378-.52-2.99-.91-4.394-.91-1.378 0-2.08.494-2.08 1.248 0 .78.858 1.144 3.12 1.612 3.276.676 5.174 1.82 5.174 4.394 0 2.678-2.054 4.446-5.668 4.446-2.444 0-4.03-.338-6.11-1.352zm23.062-7.462 5.226 8.606h-4.004l-3.614-5.772-2.73 2.626v3.146h-3.614v-19.604h3.614v11.544l6.032-6.058h4.238zm14.742-5.772c3.952 0 7.15 2.886 7.15 7.306 0 4.342-3.198 7.306-7.15 7.306-1.482 0-2.938-.416-4.108-1.118v.884h-3.614v-19.604h3.614v6.292c1.196-.65 2.6-1.066 4.108-1.066zm-.65 11.336c2.444 0 4.238-1.638 4.238-4.03 0-2.314-1.794-4.056-4.238-4.056-1.378 0-2.574.468-3.458 1.196v5.668c.884.754 2.106 1.222 3.458 1.222zm17.42-11.336c4.264 0 7.722 3.25 7.722 7.306 0 4.03-3.458 7.28-7.722 7.28s-7.722-3.25-7.722-7.28c0-4.056 3.458-7.306 7.722-7.306zm0 11.336c2.314 0 4.16-1.82 4.16-4.03 0-2.236-1.846-4.056-4.16-4.056-2.288 0-4.16 1.82-4.16 4.056 0 2.21 1.872 4.03 4.16 4.03zm17.316-11.336c4.264 0 7.722 3.25 7.722 7.306 0 4.03-3.458 7.28-7.722 7.28s-7.722-3.25-7.722-7.28c0-4.056 3.458-7.306 7.722-7.306zm0 11.336c2.314 0 4.16-1.82 4.16-4.03 0-2.236-1.846-4.056-4.16-4.056-2.288 0-4.16 1.82-4.16 4.056 0 2.21 1.872 4.03 4.16 4.03zm19.058-5.564 5.226 8.606h-4.004l-3.614-5.772-2.73 2.626v3.146h-3.614v-19.604h3.614v11.544l6.032-6.058h4.238z", fill: "#ffffff", transform: "translate(0 -24)" }, void 0) }), void 0));
}

// EXTERNAL MODULE: ./node_modules/react-use/esm/useInterval.js
var useInterval = __webpack_require__(1666);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Fade/Fade.js
var Fade = __webpack_require__(1559);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/Carousel.tsx




function Carousel({ items, delay = 1e4 }) {
    const [current, setCurrent] = Object(react["useState"])(0);
    Object(useInterval["a" /* default */])(() => setCurrent((c) => c + 1), delay);
    return (Object(jsx_runtime["jsx"])(jsx_runtime["Fragment"], { children: items.map((item, i) => (Object(jsx_runtime["jsx"])(Fade["a" /* default */], Object.assign({ in: current % items.length === i }, { children: item }), i))) }, void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/extension/debug-page/issue.ts
var issue = __webpack_require__(421);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/hooks/useMatchXS.ts
var useMatchXS = __webpack_require__(112);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/Drawer.tsx
















const Drawer_useStyles = Object(makeStyles["a" /* default */])((theme) => ({
    drawer: {
        height: '100%',
        display: 'grid',
        gridTemplateRows: '[drawerHeader] 0fr [drawerList] auto [drawerFooter] 0fr',
        width: 250,
        color: 'white',
        overflow: 'visible',
        position: 'relative',
        [theme.breakpoints.down('sm')]: {
            color: theme.palette.text.primary,
            width: '100%',
        },
    },
    drawerHeader: {
        color: 'white',
        padding: theme.spacing(5.5, 2, 4, 4),
        backgroundColor: 'var(--drawerHeader)',
    },
    drawerBody: {
        backgroundColor: 'var(--drawerBody)',
    },
    drawerList: {
        padding: 0,
    },
    drawerItem: {
        borderLeft: 'solid 5px var(--drawerBody)',
        paddingTop: 16,
        paddingBottom: 16,
        [theme.breakpoints.down('sm')]: {
            borderLeft: 'none',
            padding: theme.spacing(3, 0),
        },
    },
    drawerItemIcon: {
        [theme.breakpoints.down('sm')]: {
            color: theme.palette.type === 'light' ? theme.palette.primary.main : theme.palette.text.primary,
        },
    },
    drawerItemText: {
        margin: 0,
        fontWeight: 500,
    },
    drawerItemTextPrimary: {
        [theme.breakpoints.down('sm')]: {
            fontSize: 16,
        },
    },
    drawerFeedback: {
        borderLeft: 'none',
    },
    slogan: {
        color: theme.palette.type === 'light' ? '#A1C1FA' : '#3B3B3B',
        opacity: 0.5,
        width: 316,
        height: 260,
        left: 48,
        bottom: 30,
        fontWeight: 'bold',
        fontSize: 40,
        lineHeight: 1.2,
        letterSpacing: -0.4,
        position: 'absolute',
        transitionDuration: '2s',
    },
}));
const drawerTheme = (theme) => Object(lodash["merge"])(Object(lodash["cloneDeep"])(theme), {
    overrides: {
        MuiListItem: {
            root: {
                '&$selected$selected': {
                    borderLeftColor: theme.palette.type === 'dark' ? theme.palette.primary.light : 'var(--drawerBody)',
                    backgroundColor: theme.palette.type === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light,
                },
            },
        },
        MuiListItemIcon: {
            root: {
                justifyContent: 'center',
                color: 'unset',
            },
        },
        MuiListItemText: {
            primary: {
                fontSize: 14,
                lineHeight: '24px',
                fontWeight: 500,
            },
        },
    },
});
function Drawer(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = Drawer_useStyles();
    const match = Object(react_router["k" /* useRouteMatch */])('/:param/');
    const forSetupPurpose = match === null || match === void 0 ? void 0 : match.url.includes('/setup');
    const xsMatched = Object(useMatchXS["a" /* useMatchXS */])();
    const { routers, exitDashboard } = props;
    const [feedback, openFeedback] = Object(Base["c" /* useModal */])(DashboardFeedbackDialog);
    const onDebugPage = (event) => {
        if (event.shiftKey) {
            browser.tabs.create({
                active: true,
                url: browser.runtime.getURL('/debug.html'),
            });
        }
        else if (event.altKey) {
            browser.tabs.create({
                active: true,
                url: Object(issue["a" /* makeNewBugIssueURL */])(),
            });
        }
    };
    return (Object(jsx_runtime["jsx"])(ThemeProvider["a" /* default */], Object.assign({ theme: drawerTheme }, { children: Object(jsx_runtime["jsxs"])("nav", Object.assign({ className: classes.drawer }, { children: [xsMatched ? null : (Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ onClick: onDebugPage, className: classes.drawerHeader, style: { backgroundColor: `var(--drawerBody)` } }, { children: Object(jsx_runtime["jsx"])(MaskbookLogo, {}, void 0) }), void 0)),
                Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ display: "flex", flexDirection: "column", justifyContent: "space-between", className: classes.drawerBody }, { children: forSetupPurpose ? null : (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(List["a" /* default */], Object.assign({ className: classes.drawerList }, { children: routers.map((item, index) => (Object(jsx_runtime["jsxs"])(react["Fragment"], { children: [Object(jsx_runtime["jsxs"])(ListItem["a" /* default */], Object.assign({ className: classes.drawerItem, selected: match ? item[1].startsWith(match.url) : false, component: react_router_dom["b" /* Link */], to: item[1], button: true }, { children: [Object(jsx_runtime["jsx"])(ListItemIcon["a" /* default */], { className: classes.drawerItemIcon, children: item[2] }, void 0),
                                                Object(jsx_runtime["jsx"])(ListItemText["a" /* default */], { className: classes.drawerItemText, primary: item[0], primaryTypographyProps: { className: classes.drawerItemTextPrimary } }, void 0),
                                                xsMatched ? (Object(jsx_runtime["jsx"])(ListItemIcon["a" /* default */], { children: Object(jsx_runtime["jsx"])(ChevronRight_default.a, { color: "action" }, void 0) }, void 0)) : null] }), void 0),
                                        xsMatched ? Object(jsx_runtime["jsx"])(Divider["a" /* default */], {}, void 0) : null] }, index))) }), void 0),
                            Object(jsx_runtime["jsxs"])(List["a" /* default */], Object.assign({ className: classes.drawerList }, { children: [Object(jsx_runtime["jsxs"])(ListItem["a" /* default */], Object.assign({ className: classnames_default()(classes.drawerItem, classes.drawerFeedback), button: true, onClick: openFeedback }, { children: [Object(jsx_runtime["jsx"])(ListItemIcon["a" /* default */], { className: classes.drawerItemIcon, children: Object(jsx_runtime["jsx"])(SentimentSatisfiedOutlined_default.a, { fontSize: "small" }, void 0) }, void 0),
                                            Object(jsx_runtime["jsx"])(ListItemText["a" /* default */], { className: classes.drawerItemText, primary: t('feedback'), primaryTypographyProps: { className: classes.drawerItemTextPrimary } }, void 0),
                                            xsMatched ? (Object(jsx_runtime["jsx"])(ListItemIcon["a" /* default */], { children: Object(jsx_runtime["jsx"])(ChevronRight_default.a, { color: "action" }, void 0) }, void 0)) : null] }), void 0),
                                    xsMatched ? Object(jsx_runtime["jsx"])(Divider["a" /* default */], {}, void 0) : null] }), void 0), feedback] }, void 0)) }), void 0),
                forSetupPurpose ? (Object(jsx_runtime["jsx"])(Carousel, { items: [
                        Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.slogan }, { children: "Post on social networks without allowing the corporations to stalk you." }), void 0),
                        Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.slogan }, { children: "Take back our online privacy." }), void 0),
                        Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.slogan }, { children: "Neutralize the surveillance from tech giants." }), void 0),
                    ] }, void 0)) : null] }), void 0) }), void 0));
}

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Fab/Fab.js
var Fab = __webpack_require__(1668);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/utils.ts
var utils = __webpack_require__(12);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/flags.ts
var flags = __webpack_require__(34);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardRouters/Container.tsx







const FAB_COLORS = ['primary', 'secondary', 'default'];
const Container_useStyles = Object(makeStyles["a" /* default */])((theme) => {
    return Object(createStyles["a" /* default */])({
        wrapper: {
            flex: 1,
            height: '100%',
            [theme.breakpoints.up('sm')]: {
                display: 'grid',
                gridTemplateRows: (props) => (props.isSetup ? '1fr' : '[titleAction] 0fr [divider] 0fr [content] auto'),
            },
        },
        placeholder: {
            height: '100%',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            position: 'absolute',
            backgroundSize: '185px 128px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            backgroundImage: `url(${Object(utils["i" /* getUrl */])(theme.palette.type === 'light' ? 'dashboard-placeholder.png' : 'dashboard-placeholder-dark.png')})`,
            [theme.breakpoints.down('sm')]: {
                backgroundSize: '100px 70px',
            },
        },
        scroller: {
            height: '100%',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
                display: 'none',
            },
        },
        scrollerCompact: {
            paddingLeft: '0 !important',
            paddingRight: '0 !important',
        },
        title: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 129,
            padding: '40px 24px 40px 34px',
        },
        titleContent: {
            color: theme.palette.text.primary,
            fontWeight: 500,
            fontSize: 40,
            lineHeight: 1.2,
            [theme.breakpoints.down('sm')]: {
                color: theme.palette.type === 'light' ? theme.palette.common.white : theme.palette.text.primary,
                left: 0,
                right: 0,
                pointerEvents: 'none',
                position: 'absolute',
                fontSize: 20,
                fontWeight: 500,
                lineHeight: 1.2,
                textAlign: 'center',
                marginBottom: 0,
            },
        },
        FloatingIcon: {
            color: theme.palette.type === 'light' ? theme.palette.common.white : theme.palette.text.primary,
            padding: theme.spacing(1),
            fontSize: '2.5rem',
        },
        titlePlaceholder: {
            flex: 1,
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
        },
        contentPadded: {
            '& > *': {
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                paddingLeft: 34,
                paddingRight: 24,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                    display: 'none',
                },
                [theme.breakpoints.down('sm')]: {
                    paddingLeft: theme.spacing(2),
                    paddingRight: theme.spacing(2),
                },
            },
        },
        divider: {
            borderColor: theme.palette.divider,
            [theme.breakpoints.down('sm')]: {
                display: theme.palette.type === 'light' ? 'none' : 'block',
            },
        },
        dividerPadded: {
            padding: '0 24px 0 34px',
            [theme.breakpoints.down('sm')]: {
                padding: theme.spacing(0, 2),
            },
        },
        dividerCompact: {
            padding: '0 !important',
        },
        buttons: {
            display: 'flex',
            '& > *': {
                margin: theme.spacing(0, 1),
            },
        },
        floatButtonContainer: {
            position: 'fixed',
            bottom: theme.spacing(1),
            right: theme.spacing(2),
        },
        floatingButton: {
            display: 'flex',
            justifyItems: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing(2),
        },
    });
});
function DashboardRouterContainer(props) {
    const { title, actions, children, padded, empty, compact = false, floatingButtons = [] } = props;
    const isSetup = location.hash.includes('/setup');
    const classes = Container_useStyles({
        isSetup,
    });
    const xsMatched = Object(useMatchXS["a" /* useMatchXS */])();
    return (Object(jsx_runtime["jsx"])(Fade["a" /* default */], Object.assign({ in: true }, { children: Object(jsx_runtime["jsxs"])("section", Object.assign({ className: classes.wrapper }, { children: [isSetup ? null : (Object(jsx_runtime["jsx"])(jsx_runtime["Fragment"], { children: flags["a" /* Flags */].has_native_nav_bar ? null : (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsxs"])("section", Object.assign({ className: classes.title }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.titleContent, color: "textPrimary", variant: "h6" }, { children: title }), void 0),
                                    flags["a" /* Flags */].has_native_nav_bar ? null : (Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.buttons }, { children: actions === null || actions === void 0 ? void 0 : actions.map((action, index) => Object(react["cloneElement"])(action, { key: index })) }), void 0))] }), void 0),
                            Object(jsx_runtime["jsx"])("div", Object.assign({ className: classnames_default()({
                                    [classes.dividerPadded]: padded !== false,
                                    [classes.dividerCompact]: xsMatched,
                                }) }, { children: Object(jsx_runtime["jsx"])(Divider["a" /* default */], { className: classes.divider }, void 0) }), void 0)] }, void 0)) }, void 0)),
                Object(jsx_runtime["jsxs"])("main", Object.assign({ className: classnames_default()(classes.content, { [classes.contentPadded]: padded !== false }) }, { children: [Object(jsx_runtime["jsx"])("div", Object.assign({ className: classnames_default()(classes.scroller, { [classes.scrollerCompact]: compact !== false }) }, { children: children }), void 0),
                        empty ? Object(jsx_runtime["jsx"])("div", { className: classes.placeholder }, void 0) : null] }), void 0),
                Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.floatButtonContainer }, { children: flags["a" /* Flags */].has_native_nav_bar
                        ? floatingButtons === null || floatingButtons === void 0 ? void 0 : floatingButtons.map((floatingButton, index) => (Object(jsx_runtime["jsx"])(Fab["a" /* default */], Object.assign({ color: FAB_COLORS[index], className: classes.floatingButton, onClick: floatingButton.handler }, { children: Object(react["cloneElement"])(floatingButton.icon, {
                                key: index,
                                className: classes.FloatingIcon,
                            }) }), void 0))) : null }), void 0)] }), void 0) }), void 0));
}

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Button/Button.js
var Button = __webpack_require__(297);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Add.js
var Add = __webpack_require__(244);
var Add_default = /*#__PURE__*/__webpack_require__.n(Add);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/AddCircle.js
var AddCircle = __webpack_require__(541);
var AddCircle_default = /*#__PURE__*/__webpack_require__.n(AddCircle);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Restore.js
var Restore = __webpack_require__(542);
var Restore_default = /*#__PURE__*/__webpack_require__.n(Restore);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/MenuItem/MenuItem.js
var MenuItem = __webpack_require__(1623);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/service.ts + 1 modules
var service = __webpack_require__(18);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/MoreVert.js
var MoreVert = __webpack_require__(888);
var MoreVert_default = /*#__PURE__*/__webpack_require__.n(MoreVert);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/worker.ts
var social_network_worker = __webpack_require__(102);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/LinkOff.js
var LinkOff = __webpack_require__(884);
var LinkOff_default = /*#__PURE__*/__webpack_require__.n(LinkOff);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ArrowForward.js
var ArrowForward = __webpack_require__(885);
var ArrowForward_default = /*#__PURE__*/__webpack_require__.n(ArrowForward);

// EXTERNAL MODULE: ./packages/maskbook/src/components/custom-ui-helper.tsx
var custom_ui_helper = __webpack_require__(19);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/isMobile.ts
var facebook_com_isMobile = __webpack_require__(87);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/utils/isMobile.ts
var utils_isMobile = __webpack_require__(245);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/ProviderLine.tsx












const ProviderLine_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    title: {
        fontWeight: 500,
        fontSize: 12,
        lineHeight: 1.75,
    },
    text: {
        fontSize: 14,
        lineHeight: '24px',
        borderBottom: `solid 1px ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(1, 2),
        '& > :first-child': {
            flex: '1 1 auto',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
        },
        '& > :last-child': {
            flex: '0 0 auto',
        },
    },
    cursor: {
        cursor: 'pointer',
    },
    control: {
        marginBottom: theme.spacing(2),
    },
}));
function ProviderLine(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { internalName, network, connected, userId, onAction } = props;
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(ProviderLine_useStyles(), props);
    return (Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.control }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.title, variant: "body2", color: "textSecondary" }, { children: Object(lodash["capitalize"])(internalName) }), void 0),
            Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ className: classnames_default()(classes.text, { [classes.cursor]: !connected }), color: connected ? 'textPrimary' : 'primary', variant: "body1", component: "div", onClick: connected ? undefined : onAction, "data-testid": `connect_button_${network.toLowerCase()}` }, { children: [connected ? (flags["a" /* Flags */].has_no_connected_user_link ? (Object(jsx_runtime["jsx"])("span", { children: userId }, void 0)) : (Goto(network, userId))) : (Object(jsx_runtime["jsx"])("span", { children: `${t('connect_to')} ${network}` }, void 0)),
                    connected ? (Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ size: "small", onClick: onAction, className: classes.cursor }, { children: Object(jsx_runtime["jsx"])(LinkOff_default.a, {}, void 0) }), void 0)) : (Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ size: "small" }, { children: Object(jsx_runtime["jsx"])(ArrowForward_default.a, { color: "primary" }, void 0) }), void 0))] }), void 0)] }), void 0));
}
function Goto(network, userID) {
    const title = '@' + userID;
    const props = {
        title,
        children: title,
        color: 'textPrimary',
        style: { textDecoration: 'underline' },
    };
    if (network === 'facebook.com')
        return Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ href: facebook_com_isMobile["a" /* facebookDomain */] }, props), void 0);
    if (network === 'twitter.com')
        return Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ href: utils_isMobile["b" /* twitterDomain */] }, props), void 0);
    return Object(jsx_runtime["jsx"])("span", Object.assign({ title: title }, { children: title }), void 0);
}

// EXTERNAL MODULE: ./packages/maskbook/src/database/type.ts
var database_type = __webpack_require__(4);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/ui.ts + 1 modules
var social_network_ui = __webpack_require__(38);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network/utils/getCurrentNetworkUI.ts


const find = (network) => (v) => v.networkIdentifier === network;
function getCurrentNetworkUI(network) {
    if (typeof network === 'string') {
        if (network === 'localhost')
            throw new TypeError('Searching a unknown provider');
        const worker = [...social_network_ui["definedSocialNetworkUIs"].values()].find(find(network));
        if (worker === undefined)
            throw new TypeError('Provider not found');
        return worker;
    }
    if (network instanceof database_type["ProfileIdentifier"]) {
        if (network.isUnknown)
            throw new TypeError('Searching a unknown provider');
        return getCurrentNetworkUI(network.network);
    }
    if (network instanceof database_type["GroupIdentifier"])
        return getCurrentNetworkUI(network.network);
    if (network instanceof database_type["PostIdentifier"])
        return getCurrentNetworkUI(network.identifier);
    if (network instanceof database_type["PostIVIdentifier"])
        return getCurrentNetworkUI(network.network);
    if (network instanceof database_type["ECKeyIdentifier"])
        throw new TypeError("It's impossible to search provider for PersonaIdentifier");
    throw new TypeError('unknown subclass of Identifier');
}

// EXTERNAL MODULE: ./packages/maskbook/src/settings/settings.ts
var settings = __webpack_require__(26);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/content-script/tasks.ts
var tasks = __webpack_require__(103);

// EXTERNAL MODULE: ./node_modules/json-stable-stringify/index.js
var json_stable_stringify = __webpack_require__(162);
var json_stable_stringify_default = /*#__PURE__*/__webpack_require__.n(json_stable_stringify);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/user-plus.js
var user_plus = __webpack_require__(1669);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/user-check.js
var user_check = __webpack_require__(1670);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/user.js
var user = __webpack_require__(1671);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/user-minus.js
var user_minus = __webpack_require__(1672);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/constants.ts
var constants = __webpack_require__(174);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/String-ArrayBuffer.ts
var String_ArrayBuffer = __webpack_require__(62);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/BackupFileShortRepresentation.ts
var BackupFileShortRepresentation = __webpack_require__(251);

// EXTERNAL MODULE: ./packages/maskbook/src/components/shared/qrcode.tsx + 1 modules
var qrcode = __webpack_require__(290);

// EXTERNAL MODULE: ./node_modules/notistack/dist/notistack.esm.js
var notistack_esm = __webpack_require__(105);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/AbstractTab.tsx
var AbstractTab = __webpack_require__(167);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/SpacedButtonGroup.tsx



const SpacedButtonGroup_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    buttonGroup: {
        flexGrow: 0,
        flexShrink: 0,
        '& > *:not(:last-child)': {
            marginRight: theme.spacing(2),
        },
    },
}));
function SpacedButtonGroup(_props) {
    const classes = SpacedButtonGroup_useStyles();
    const { className, ...props } = _props;
    return Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ className: classnames_default()(className, classes.buttonGroup) }, props), void 0);
}

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Paper/Paper.js
var Paper = __webpack_require__(438);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/ShowcaseBox.tsx




const useStyle = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    title: {
        fontSize: 12,
        lineHeight: 1.75,
        marginTop: theme.spacing(2),
    },
    paper: {
        height: '100%',
        border: `solid 1px ${theme.palette.divider}`,
        backgroundColor: theme.palette.type === 'light' ? '#FAFAFA' : '',
        boxShadow: 'none',
        padding: theme.spacing(2, 3),
    },
    scroller: {
        userSelect: 'text',
        height: '100%',
        overflow: 'auto',
        wordBreak: 'break-word',
    },
}));
function ShowcaseBox(props) {
    const classes = useStyle();
    const { title, children, TitleProps, ContentProps } = props;
    const ref = Object(react["useRef"])(null);
    const copyText = () => Object(utils["r" /* selectElementContents */])(ref.current);
    return (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [title ? (Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.title, component: "h5" }, TitleProps, { children: title }), void 0)) : null,
            Object(jsx_runtime["jsx"])(Paper["a" /* default */], Object.assign({ className: classes.paper }, { children: Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.scroller, "data-testid": "prove_textarea" }, { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ component: "div", variant: "body1", onClick: copyText, ref: ref }, ContentProps, { children: children }), void 0) }), void 0) }), void 0)] }, void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/extension/options-page/Route.ts
var Route = __webpack_require__(78);

// EXTERNAL MODULE: ./node_modules/react-use/esm/useDropArea.js
var useDropArea = __webpack_require__(1628);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/useTheme.js
var useTheme = __webpack_require__(94);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/AddBoxOutlined.js
var AddBoxOutlined = __webpack_require__(886);
var AddBoxOutlined_default = /*#__PURE__*/__webpack_require__.n(AddBoxOutlined);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/RestoreBox.tsx






const RestoreBox_useStyle = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        color: theme.palette.text.hint,
        whiteSpace: 'pre-line',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        cursor: 'pointer',
        transition: '0.4s',
        overflow: 'hidden',
        '&[data-active=true]': {
            color: 'black',
        },
    },
    icon: {
        top: 0,
        bottom: 0,
        left: 4,
        right: 'auto',
        margin: 'auto',
        position: 'absolute',
    },
    button: {
        maxWidth: '90%',
        position: 'relative',
        '& > span:first-child': {
            display: 'inline-block',
            maxWidth: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
        },
    },
    buttonText: {
        height: 28,
        lineHeight: 1,
        paddingTop: 0,
        paddingBottom: 0,
    },
    placeholder: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        width: 64,
        height: 64,
        margin: '20px auto',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '64px 64px',
    },
    placeholderImage: {
        width: 64,
        height: 64,
    },
}));
function RestoreBox(props) {
    const { entered, file, enterText, leaveText, placeholder, children, onClick } = props;
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(RestoreBox_useStyle(), props);
    const theme = Object(useTheme["a" /* default */])();
    return (Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.root, "data-active": entered, onClick: onClick }, { children: [Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.placeholder }, { children: children ? (children) : (Object(jsx_runtime["jsx"])("img", { className: classes.placeholderImage, src: Object(utils["i" /* getUrl */])(`${placeholder}-${theme.palette.type}.png`) }, void 0)) }), void 0),
            Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: classes.button, classes: { text: classes.buttonText }, variant: "text", style: { paddingLeft: entered || file ? 8 : 28 }, startIcon: entered || file ? null : Object(jsx_runtime["jsx"])(AddBoxOutlined_default.a, { className: classes.icon }, void 0), onClick: (e) => e.preventDefault() }, { children: entered ? enterText : file ? file.name : leaveText }), void 0)] }), void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/utils/hooks/useQRCodeImageScan.tsx


function useQRCodeImageScan(image) {
    const scanner = Object(react["useRef"])(new BarcodeDetector({ formats: ['qr_code'] }));
    const [src, setSrc] = Object(react["useState"])('');
    Object(react["useEffect"])(() => {
        const node = image.current;
        if (node) {
            node.onload = () => { var _a; return setSrc((_a = node === null || node === void 0 ? void 0 : node.getAttribute('src')) !== null && _a !== void 0 ? _a : ''); };
            node.onerror = () => setSrc('');
        }
        else {
            setSrc('');
        }
    }, [image]);
    return Object(useAsync["a" /* default */])(() => new Promise((resolve, reject) => {
        const fakeImage = new Image();
        fakeImage.onload = () => scanner.current
            .detect(fakeImage)
            .then(([result] = []) => resolve(result === null || result === void 0 ? void 0 : result.rawValue))
            .catch(reject);
        fakeImage.onerror = reject;
        if (src && fakeImage.src !== src) {
            fakeImage.src = src;
        }
    }), [src, scanner.current]);
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/QRCodeImageScanner.tsx




const QRCodeImageScanner_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    progress: {
        maxWidth: 64,
        maxHeight: 64,
        position: 'absolute',
    },
    img: {
        maxWidth: 64,
        maxHeight: 64,
    },
}));
function QRCodeImageScanner({ src, onScan, onError }) {
    const classes = QRCodeImageScanner_useStyles();
    const imageRef = Object(react["useRef"])(null);
    const { value, loading, error } = useQRCodeImageScan(imageRef);
    // invoke scan result callbacks
    Object(react["useEffect"])(() => {
        if (!src || loading)
            return;
        if (error)
            onError === null || onError === void 0 ? void 0 : onError();
        else
            onScan === null || onScan === void 0 ? void 0 : onScan(value !== null && value !== void 0 ? value : '');
    }, [src, loading, value, error, onError, onScan]);
    return (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])("img", { className: classes.img, ref: imageRef, src: src }, void 0),
            loading ? Object(jsx_runtime["jsx"])(CircularProgress["a" /* default */], { className: classes.progress, color: "primary" }, void 0) : null] }, void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/RestoreFromQRCodeImageBox.tsx








const RestoreFromQRCodeImageBox_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        width: '100%',
        height: 112,
    },
    file: {
        display: 'none',
    },
    qr: {
        maxWidth: 64,
        maxHeight: 64,
        display: 'block',
    },
    restoreBoxRoot: {
        boxSizing: 'border-box',
        border: `solid 1px ${theme.palette.divider}`,
        display: 'flex',
        justifyContent: 'center',
        height: 112,
        marginBottom: 16,
        borderRadius: 4,
    },
    restoreBoxPlaceholder: {
        marginTop: 0,
        marginBottom: 6,
    },
}));
function RestoreFromQRCodeImageBox(props) {
    const { file, onScan, onError, onChange } = props;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(RestoreFromQRCodeImageBox_useStyles(), props);
    const [dataURL, setDataURL] = Object(react["useState"])('');
    const inputRef = Object(react["useRef"])(null);
    const [bound, { over }] = Object(useDropArea["a" /* default */])({
        onFiles(files) {
            onChange === null || onChange === void 0 ? void 0 : onChange(files[0]);
        },
    });
    // read file as data URL
    Object(react["useEffect"])(() => {
        if (file) {
            const fr = new FileReader();
            fr.readAsDataURL(file);
            fr.addEventListener('loadend', () => setDataURL(fr.result));
            fr.addEventListener('error', () => setDataURL(''));
        }
        else {
            setDataURL('');
        }
    }, [file]);
    // invoke onChange callback
    Object(react["useEffect"])(() => onChange === null || onChange === void 0 ? void 0 : onChange(file), [file, onChange]);
    return (Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.root }, bound, { children: [Object(jsx_runtime["jsx"])("input", { className: classes.file, type: "file", accept: "image/*", ref: inputRef, onChange: ({ currentTarget }) => {
                    if (currentTarget.files)
                        onChange === null || onChange === void 0 ? void 0 : onChange(currentTarget.files.item(0));
                } }, void 0),
            Object(jsx_runtime["jsx"])(RestoreBox, Object.assign({ classes: { root: classes.restoreBoxRoot, placeholder: classes.restoreBoxPlaceholder }, file: file, entered: over, enterText: t('restore_database_advance_dragging'), leaveText: t('restore_database_advance_dragged'), placeholder: "restore-image-placeholder", "data-active": over, onClick: () => inputRef.current && inputRef.current.click() }, { children: file ? Object(jsx_runtime["jsx"])(QRCodeImageScanner, { src: dataURL, onScan: onScan, onError: onError }, void 0) : null }), void 0)] }), void 0));
}

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/FormControl/FormControl.js
var FormControl = __webpack_require__(1622);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Select/Select.js + 4 modules
var Select = __webpack_require__(1690);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/CropFree.js
var CropFree = __webpack_require__(887);
var CropFree_default = /*#__PURE__*/__webpack_require__.n(CropFree);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/iOS-RPC.ts
var iOS_RPC = __webpack_require__(319);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/hooks/useQueryNavigatorPermission.ts
var useQueryNavigatorPermission = __webpack_require__(540);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/side-effects.ts
var side_effects = __webpack_require__(147);

// EXTERNAL MODULE: ./packages/maskbook/src/web-workers/OnDemandWorker.ts
var OnDemandWorker = __webpack_require__(345);

// CONCATENATED MODULE: ./packages/maskbook/src/components/QRScanner/ShapeDetectionPolyfill.ts
/// <reference path="./ShapeDetectionSpec.d.ts" />



let ShapeDetectionPolyfill_worker;
side_effects["a" /* sideEffect */].then(() => {
    ShapeDetectionPolyfill_worker = new OnDemandWorker["a" /* OnDemandWorker */](__webpack_require__(1516), { name: 'ShapeDetection' });
});
class ShapeDetectionPolyfill_BarcodeDetectorPolyfill {
    async detect(mediaSource) {
        const canvasImageWidth = mediaSource.videoWidth;
        const canvasImageHeight = mediaSource.videoHeight;
        if (!canvasImageWidth || !canvasImageHeight)
            return [];
        const canvas = document.createElement('canvas');
        const resizedWidth = Math.min(canvasImageWidth, 500);
        const resizedHeight = Math.floor((resizedWidth * canvasImageHeight) / canvasImageWidth);
        [canvas.width, canvas.height] = [resizedWidth, resizedHeight];
        const ctx = canvas.getContext('2d');
        if (Object(lodash["isNull"])(ctx))
            throw new Error('Canvas was not supported');
        ctx.drawImage(mediaSource, 0, 0, canvasImageWidth, canvasImageHeight, 0, 0, canvas.width, canvas.height);
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return new Promise((resolve) => {
            ShapeDetectionPolyfill_worker.postMessage([d.data, canvas.width, canvas.height]);
            ShapeDetectionPolyfill_worker.addEventListener('message', (ev) => {
                if (Object(lodash["isNull"])(ev.data)) {
                    resolve([]);
                    return;
                }
                const result = new DetectedBarcodePolyfill();
                result.rawValue = ev.data.data;
                resolve([result]);
            }, { once: true });
            ShapeDetectionPolyfill_worker.addEventListener('error', () => resolve([]));
        });
    }
}
class DetectedBarcodePolyfill {
    constructor() {
        Object.defineProperty(this, "cornerPoints", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "format", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'qr_code'
        });
        Object.defineProperty(this, "rawValue", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    get boundingBox() {
        throw new Error('Not implemented');
    }
}
Object.assign(globalThis, {
    BarcodeDetector: ShapeDetectionPolyfill_BarcodeDetectorPolyfill,
    DetectedBarcode: DetectedBarcodePolyfill,
});

// CONCATENATED MODULE: ./packages/maskbook/src/utils/hooks/useQRCodeVideoScan.tsx
/// <reference path="../../components/QRScanner/ShapeDetectionSpec.d.ts" />
/** This file is published under MIT License */





async function getBackVideoDeviceId() {
    var _a, _b;
    const devices = Object(lodash["filter"])(await navigator.mediaDevices.enumerateDevices(), ({ kind }) => kind === 'videoinput');
    const back = Object(lodash["find"])(devices, ({ label }) => !/Front/i.test(label) && /Back|Rear/i.test(label));
    return (_b = (_a = (back !== null && back !== void 0 ? back : Object(lodash["first"])(devices))) === null || _a === void 0 ? void 0 : _a.deviceId) !== null && _b !== void 0 ? _b : null;
}
function useQRCodeVideoScan(video, isScanning, deviceId, onResult, onError) {
    // TODO!: ? not work See https://github.com/DimensionDev/Maskbook/issues/810
    // ? Get video stream
    {
        const permission = Object(useQueryNavigatorPermission["a" /* useQueryNavigatorPermission */])(isScanning, 'camera');
        const [mediaStream, setMediaStream] = Object(react["useState"])(null);
        Object(react["useEffect"])(() => {
            function stop() {
                if (mediaStream) {
                    mediaStream.getTracks().forEach((x) => x.stop());
                }
                video.current.pause();
            }
            async function start() {
                if (permission !== 'granted' || !video.current)
                    return;
                try {
                    let media = mediaStream;
                    if (!media) {
                        const device = deviceId !== null && deviceId !== void 0 ? deviceId : (await getBackVideoDeviceId());
                        media = await navigator.mediaDevices.getUserMedia({
                            audio: false,
                            video: device === null ? { facingMode: 'environment' } : { deviceId: device },
                        });
                        return setMediaStream(media);
                    }
                    video.current.srcObject = media;
                    video.current.play();
                }
                catch (e) {
                    console.error(e);
                    stop();
                }
            }
            if (!video.current)
                return;
            if (!isScanning)
                return stop();
            start();
            return () => {
                stop();
            };
        }, [deviceId, isScanning, mediaStream, permission, video]);
    }
    // ? Do scan
    {
        const scanner = Object(react["useRef"])(new BarcodeDetector({ formats: ['qr_code'] }));
        const lastScanning = Object(react["useRef"])(false);
        const errorTimes = Object(react["useRef"])(0);
        Object(useInterval["a" /* default */])(async () => {
            if (errorTimes.current >= 10)
                if (errorTimes.current === 10) {
                    errorTimes.current += 1;
                    return onError === null || onError === void 0 ? void 0 : onError();
                }
                else
                    return;
            if (lastScanning.current)
                return;
            if (!video.current || !isScanning)
                return;
            lastScanning.current = true;
            try {
                const [result] = await scanner.current.detect(video.current);
                if (result)
                    onResult === null || onResult === void 0 ? void 0 : onResult(result.rawValue);
            }
            catch (e) {
                errorTimes.current += 1;
            }
            finally {
                lastScanning.current = false;
            }
        }, 100);
    }
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/QRCodeVideoScanner.tsx





function QRCodeVideoScanner({ scanning, deviceId, onScan, onError, onQuit, ...props }) {
    const videoRef = Object(react["useRef"])(null);
    useQRCodeVideoScan(videoRef, scanning, deviceId, onScan, onError);
    return iOS_RPC["a" /* hasWKWebkitRPCHandlers */] ? (Object(jsx_runtime["jsx"])(qrcode["b" /* WKWebkitQRScanner */], { onScan: onScan, onQuit: onQuit }, void 0)) : (Object(jsx_runtime["jsx"])("div", Object.assign({ style: { position: 'relative' } }, { children: Object(jsx_runtime["jsx"])("video", Object.assign({ style: { minWidth: 404 }, "aria-label": "QR Code scanner", ref: videoRef }, props), void 0) }), void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardDialogs/Setup.tsx






const Setup_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        position: 'relative',
    },
    wrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    title: {
        fontSize: 20,
        fontWeight: 500,
        textAlign: 'center',
        top: 32,
        left: 0,
        right: 0,
        margin: 'auto',
        position: 'absolute',
    },
    closeButton: {
        margin: 'auto',
        width: 28 * 1.2,
        height: 28 * 1.2,
        left: 0,
        right: 0,
        bottom: 42,
        position: 'absolute',
    },
    closeIcon: {
        color: theme.palette.common.white,
        width: 28,
        height: 28,
    },
}));
function QRCodeVideoScannerDialog(props) {
    const { open, onClose } = props;
    const { deviceId, onScan, onError } = props.ComponentProps;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = Setup_useStyles();
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { CloseIconProps: { className: classes.closeIcon }, CloseButtonProps: { className: classes.closeButton } }, { children: Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.wrapper }, { children: [open ? (Object(jsx_runtime["jsx"])(QRCodeVideoScanner, { scanning: open, onScan: async (data) => {
                        onClose();
                        // ensure blur mask closed
                        await Object(utils["s" /* sleep */])(300);
                        onScan === null || onScan === void 0 ? void 0 : onScan(data);
                    }, deviceId: deviceId, onError: onError, onQuit: onClose }, void 0)) : null,
                Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.title, variant: "h1" }, { children: t('set_up_qr_scanner_title') }), void 0)] }), void 0) }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/utils/shadow-root/ShadowRootPortal.tsx
var ShadowRootPortal = __webpack_require__(142);

// EXTERNAL MODULE: ./node_modules/react-use/esm/usePermission.js
var usePermission = __webpack_require__(1602);

// EXTERNAL MODULE: ./node_modules/react-use/esm/useMediaDevices.js
var useMediaDevices = __webpack_require__(1603);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/hooks/useVideoDevices.ts


function useVideoDevices() {
    const permissionState = Object(usePermission["a" /* default */])({ name: 'camera' });
    const { devices = [] } = Object(useMediaDevices["a" /* default */])();
    // we dispatch a fake event if permission changed
    // in order to fix the bug described in this issues
    // https://github.com/streamich/react-use/issues/1318
    Object(react["useEffect"])(() => {
        navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
    }, [permissionState]);
    return devices.filter((d) => d.kind === 'videoinput');
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/RestoreFromQRCodeCameraBox.tsx











const RestoreFromQRCodeCameraBox_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        marginTop: theme.spacing(2),
    },
    formControl: {
        flex: 1,
    },
    menuPaper: {
        backgroundColor: theme.palette.background.paper,
    },
    button: {
        width: 64,
        minWidth: 'unset',
        padding: 0,
        marginLeft: 16,
    },
}));
const RestoreFromQRCodeCameraBox = iOS_RPC["a" /* hasWKWebkitRPCHandlers */]
    ? (props) => {
        Object(useAsync["a" /* default */])(async () => {
            var _a;
            (_a = props.onScan) === null || _a === void 0 ? void 0 : _a.call(props, await iOS_RPC["b" /* iOSHost */].scanQRCode());
        });
        return null;
    }
    : (props) => {
        const { onScan, onError } = props;
        const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(RestoreFromQRCodeCameraBox_useStyles(), props);
        const [qrCodeVideoScannerDialog, , openQRCodeVideoScannerDialog] = Object(Base["c" /* useModal */])(QRCodeVideoScannerDialog);
        const devices = useVideoDevices();
        const filteredDevices = devices.filter((d) => !!d.deviceId);
        const [selectedDeviceId, setSelectedDeviceId] = Object(react["useState"])('');
        // set default device id
        Object(react["useEffect"])(() => {
            var _a, _b;
            if (!selectedDeviceId && ((_a = filteredDevices[0]) === null || _a === void 0 ? void 0 : _a.deviceId))
                setSelectedDeviceId((_b = filteredDevices[0]) === null || _b === void 0 ? void 0 : _b.deviceId);
        }, [filteredDevices, selectedDeviceId]);
        return (Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ className: classes.root, display: "flex", justifyContent: "space-between" }, { children: [Object(jsx_runtime["jsx"])(FormControl["a" /* default */], Object.assign({ className: classes.formControl, variant: "filled" }, { children: Object(jsx_runtime["jsx"])(Select["a" /* default */], Object.assign({ value: selectedDeviceId, variant: "outlined", MenuProps: {
                            container: ShadowRootPortal["a" /* PortalShadowRoot */],
                            classes: { paper: classes.menuPaper },
                        }, onChange: (e) => setSelectedDeviceId(e.target.value) }, { children: filteredDevices.map(({ deviceId, label }) => (Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ value: deviceId }, { children: label }), deviceId))) }), void 0) }), void 0),
                Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ className: classes.button, variant: "outlined", disabled: !selectedDeviceId, onClick: () => openQRCodeVideoScannerDialog({
                        deviceId: selectedDeviceId,
                        onScan,
                        onError,
                    }) }, { children: Object(jsx_runtime["jsx"])(CropFree_default.a, {}, void 0) }), void 0), qrCodeVideoScannerDialog] }), void 0));
    };

// EXTERNAL MODULE: ./packages/maskbook/src/extension/options-page/SetupStep.ts
var SetupStep = __webpack_require__(115);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardDialogs/Persona.tsx






















//#region persona create dialog
function DashboardPersonaCreateDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const [name, setName] = Object(react["useState"])('');
    const history = Object(react_router["h" /* useHistory */])();
    const createPersonaAndNext = async () => {
        const persona = await service["b" /* default */].Identity.createPersonaByMnemonic(name, '');
        history.push(`${Route["a" /* DashboardRoute */].Setup}/${SetupStep["a" /* SetupStep */].ConnectNetwork}?identifier=${encodeURIComponent(persona.toText())}`);
    };
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({ fullScreen: false }, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { icon: Object(jsx_runtime["jsx"])(user_plus["a" /* default */], {}, void 0), iconColor: "#5FDD97", primary: t('create_a_persona'), secondary: ' ', content: Object(jsx_runtime["jsx"])(jsx_runtime["Fragment"], { children: Object(jsx_runtime["jsx"])("form", { children: Object(jsx_runtime["jsx"])(TextField["a" /* default */], { helperText: Object(utils["e" /* checkInputLengthExceed */])(name)
                            ? t('input_length_exceed_prompt', {
                                name: t('persona_name').toLowerCase(),
                                length: constants["c" /* WALLET_OR_PERSONA_NAME_MAX_LEN */],
                            })
                            : undefined, style: { marginBottom: 20 }, autoFocus: true, required: true, label: t('name'), value: name, onChange: (e) => setName(e.target.value), onKeyDown: (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                createPersonaAndNext();
                            }
                        } }, void 0) }, void 0) }, void 0), footer: Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ type: "submit", variant: "contained", onClick: createPersonaAndNext, disabled: name.length === 0 || Object(utils["e" /* checkInputLengthExceed */])(name) }, { children: t('create') }), void 0) }, void 0) }), void 0));
}
//#endregion
//#region persona import dialog
function DashboardImportPersonaDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { enqueueSnackbar } = Object(notistack_esm["b" /* useSnackbar */])();
    const history = Object(react_router["h" /* useHistory */])();
    const [nickname, setNickname] = Object(react["useState"])('');
    const [mnemonicWordsValue, setMnemonicWordsValue] = Object(react["useState"])('');
    const [password, setPassword] = Object(react["useState"])('');
    const [base64Value, setBase64Value] = Object(react["useState"])('');
    const [file, setFile] = Object(react["useState"])(null);
    const [scannedValue, setScannedValue] = Object(react["useState"])('');
    const importPersona = (persona) => {
        const failToRestore = () => enqueueSnackbar(t('set_up_advance_restore_fail'), { variant: 'error' });
        try {
            if (persona) {
                history.push(`${Route["a" /* DashboardRoute */].Setup}/${SetupStep["a" /* SetupStep */].ConnectNetwork}?identifier=${encodeURIComponent(persona.identifier.toText())}`);
            }
            else {
                failToRestore();
            }
        }
        catch (e) {
            failToRestore();
        }
    };
    const state = Object(react["useState"])(0);
    const tabProps = {
        tabs: [
            {
                id: 'mnemonic',
                label: t('mnemonic_words'),
                children: (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(TextField["a" /* default */], { onChange: (e) => setNickname(e.target.value), value: nickname, autoFocus: true, required: true, label: t('name'), inputProps: {
                                'data-testid': 'username_input',
                            } }, void 0),
                        Object(jsx_runtime["jsx"])(TextField["a" /* default */], { value: mnemonicWordsValue, onChange: (e) => setMnemonicWordsValue(e.target.value), required: true, label: t('mnemonic_words'), inputProps: {
                                'data-testid': 'mnemonic_input',
                            } }, void 0),
                        Object(jsx_runtime["jsx"])(TextField["a" /* default */], { onChange: (e) => setPassword(e.target.value), value: password, label: t('password'), inputProps: {
                                'data-testid': 'password_input',
                            } }, void 0)] }, void 0)),
                p: 0,
            },
            {
                id: 'text',
                label: 'Base64',
                children: (Object(jsx_runtime["jsx"])(TextField["a" /* default */], { inputProps: { style: { height: 147 } }, multiline: true, rows: 1, autoFocus: true, placeholder: t('dashboard_paste_database_base64_hint'), onChange: (e) => setBase64Value(e.target.value), value: base64Value }, void 0)),
                display: 'flex',
                p: 0,
            },
            {
                id: 'qr',
                label: t('qr_code'),
                children: (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(RestoreFromQRCodeImageBox, { file: file, onChange: setFile, onScan: setScannedValue, onError: () => {
                                enqueueSnackbar(t('set_up_qr_scanner_fail'), {
                                    variant: 'error',
                                });
                            } }, void 0),
                        Object(jsx_runtime["jsx"])(RestoreFromQRCodeCameraBox, { onScan: (scannedValue) => {
                                setFile(null);
                                setScannedValue(scannedValue);
                            }, onError: () => {
                                enqueueSnackbar(t('set_up_qr_scanner_fail'), {
                                    variant: 'error',
                                });
                            } }, void 0)] }, void 0)),
                p: 0,
            },
        ],
        state,
        height: 176,
    };
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { icon: Object(jsx_runtime["jsx"])(user_check["a" /* default */], {}, void 0), iconColor: "#5FDD97", primary: t('import_your_persona'), secondary: t('dashboard_persona_import_dialog_hint'), content: Object(jsx_runtime["jsx"])(AbstractTab["a" /* default */], Object.assign({}, tabProps), void 0), footer: Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ variant: "contained", disabled: !(state[0] === 0 && nickname && mnemonicWordsValue) &&
                    !(state[0] === 1 && base64Value) &&
                    !(state[0] === 2 && scannedValue), onClick: async () => {
                    try {
                        const persona = await (state[0] === 0
                            ? service["b" /* default */].Identity.restoreFromMnemonicWords(mnemonicWordsValue, nickname, password)
                            : state[0] === 1
                                ? service["b" /* default */].Identity.restoreFromBase64(base64Value)
                                : service["b" /* default */].Identity.restoreFromBackup(scannedValue));
                        importPersona(persona);
                    }
                    catch (e) {
                        enqueueSnackbar(t('set_up_restore_fail'), {
                            variant: 'error',
                        });
                    }
                }, "data-testid": "import_button" }, { children: t('import') }), void 0) }, void 0) }), void 0));
}
//#region persona rename dialog
function DashboardPersonaRenameDialog(props) {
    var _a;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { persona } = props.ComponentProps;
    const [name, setName] = Object(react["useState"])((_a = persona.nickname) !== null && _a !== void 0 ? _a : '');
    const renamePersona = Object(Base["d" /* useSnackbarCallback */])(() => service["b" /* default */].Identity.renamePersona(persona.identifier, name), [persona.nickname], props.onClose);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({ fullScreen: false }, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "small", primary: t('persona_rename'), content: Object(jsx_runtime["jsx"])(TextField["a" /* default */], { helperText: Object(utils["e" /* checkInputLengthExceed */])(name)
                    ? t('input_length_exceed_prompt', {
                        name: t('persona_name').toLowerCase(),
                        length: constants["c" /* WALLET_OR_PERSONA_NAME_MAX_LEN */],
                    })
                    : undefined, required: true, label: t('persona_name'), variant: "outlined", value: name, autoFocus: true, onChange: (e) => setName(e.target.value), inputProps: { onKeyPress: (e) => e.key === 'Enter' && renamePersona() } }, void 0), footer: Object(jsx_runtime["jsxs"])(SpacedButtonGroup, { children: [Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ variant: "contained", onClick: renamePersona, disabled: name.length === 0 || Object(utils["e" /* checkInputLengthExceed */])(name) }, { children: t('ok') }), void 0),
                    Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "outlined", color: "inherit", onClick: props.onClose }, { children: t('cancel') }), void 0)] }, void 0) }, void 0) }), void 0));
}
//#endregion
//#region persona backup dialog
function DashboardPersonaBackupDialog(props) {
    var _a, _b;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { persona } = props.ComponentProps;
    const mnemonicWordsValue = (_b = (_a = persona.mnemonic) === null || _a === void 0 ? void 0 : _a.words) !== null && _b !== void 0 ? _b : t('not_available');
    const [base64Value, setBase64Value] = Object(react["useState"])(t('not_available'));
    const [compressedQRString, setCompressedQRString] = Object(react["useState"])(null);
    Object(react["useEffect"])(() => {
        service["b" /* default */].Welcome.generateBackupJSON({
            noPosts: true,
            noUserGroups: true,
            filter: { type: 'persona', wanted: [persona.identifier] },
        }).then((file) => {
            setBase64Value(Object(String_ArrayBuffer["c" /* encodeArrayBuffer */])(Object(String_ArrayBuffer["d" /* encodeText */])(JSON.stringify(file))));
            setCompressedQRString(Object(BackupFileShortRepresentation["a" /* compressBackupFile */])(file, {
                personaIdentifier: persona.identifier,
            }));
        });
    }, [persona.identifier]);
    const state = Object(react["useState"])(0);
    const tabProps = {
        tabs: [
            {
                id: 'mnemonic',
                label: t('mnemonic_words'),
                children: Object(jsx_runtime["jsx"])(ShowcaseBox, { children: mnemonicWordsValue }, void 0),
            },
            {
                id: 'base64',
                label: 'Base64',
                children: Object(jsx_runtime["jsx"])(ShowcaseBox, { children: base64Value }, void 0),
            },
            {
                id: 'qr',
                label: t('qr_code'),
                children: compressedQRString ? (Object(jsx_runtime["jsx"])(qrcode["a" /* QRCode */], { text: compressedQRString, options: { width: 200 }, canvasProps: {
                        style: { display: 'block', margin: 'auto' },
                    } }, void 0)) : null,
            },
        ],
        state,
        height: 200,
    };
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { icon: Object(jsx_runtime["jsx"])(user["a" /* default */], {}, void 0), iconColor: "#5FDD97", primary: t('backup_persona'), secondary: t('dashboard_backup_persona_hint'), content: Object(jsx_runtime["jsx"])(AbstractTab["a" /* default */], Object.assign({}, tabProps), void 0) }, void 0) }), void 0));
}
//#endregion
//#region persona delete confirm dialog
function DashboardPersonaDeleteConfirmDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { persona } = props.ComponentProps;
    const deletePersona = Object(Base["d" /* useSnackbarCallback */])(() => service["b" /* default */].Identity.deletePersona(persona.identifier, 'delete even with private'), [], props.onClose);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({ fullScreen: false }, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "small", icon: Object(jsx_runtime["jsx"])(user_minus["a" /* default */], {}, void 0), iconColor: "#F4637D", primary: t('delete_persona'), secondary: t('dashboard_delete_persona_confirm_hint', { name: persona.nickname }), footer: Object(jsx_runtime["jsxs"])(SpacedButtonGroup, { children: [Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ variant: "contained", color: "danger", onClick: deletePersona, "data-testid": "confirm_button" }, { children: t('confirm') }), void 0),
                    Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "outlined", color: "inherit", onClick: props.onClose }, { children: t('cancel') }), void 0)] }, void 0) }, void 0) }), void 0));
}
//#endregion
//#region persona unlink confirm dialog
const LinkOffIcon = () => (Object(jsx_runtime["jsx"])("svg", Object.assign({ width: "58", height: "58", viewBox: "0 0 58 58", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, { children: Object(jsx_runtime["jsx"])("path", { d: "M43.7853 35.3366L50.1249 29C52.9203 26.1956 54.49 22.3973 54.49 18.4376C54.49 14.4778 52.9203 10.6796 50.1249 7.87514C47.3212 5.07823 43.5226 3.50751 39.5624 3.50751C35.6022 3.50751 31.8037 5.07823 29 7.87514L26.8878 9.98733L31.1122 14.2117L33.2244 12.0995C34.9079 10.4235 37.1868 9.48252 39.5624 9.48252C41.938 9.48252 44.2169 10.4235 45.9005 12.0995C47.578 13.7823 48.5199 16.0615 48.5199 18.4376C48.5199 20.8137 47.578 23.0928 45.9005 24.7756L39.5609 31.1122C38.835 31.8333 37.9796 32.4111 37.0395 32.8151L33.2244 29L37.4487 24.7756L35.3366 22.6634C33.9532 21.2716 32.3075 20.1681 30.4947 19.4168C28.6818 18.6655 26.738 18.2814 24.7756 18.2867C24.0736 18.2867 23.3894 18.3823 22.7112 18.4839L4.22437 0L0 4.22437L53.7756 58L58 53.7756L41.461 37.2366C42.2885 36.6869 43.0683 36.0536 43.7853 35.3366ZM24.7756 45.9005C23.0921 47.5765 20.8132 48.5175 18.4376 48.5175C16.062 48.5175 13.7831 47.5765 12.0995 45.9005C10.422 44.2177 9.48006 41.9385 9.48006 39.5624C9.48006 37.1863 10.422 34.9072 12.0995 33.2244L16.5091 28.8178L12.2847 24.5934L7.87514 29C5.07969 31.8044 3.50997 35.6027 3.50997 39.5624C3.50997 43.5222 5.07969 47.3204 7.87514 50.1249C9.26098 51.5127 10.9074 52.613 12.7198 53.3625C14.5322 54.1121 16.4748 54.4962 18.4361 54.4926C20.3979 54.4967 22.3411 54.1129 24.1541 53.3633C25.967 52.6138 27.6139 51.5132 29 50.1249L31.1122 48.0127L26.8878 43.7883L24.7756 45.9005Z", fill: "#F4637D" }, void 0) }), void 0));
function DashboardPersonaUnlinkConfirmDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { nickname, identifier } = props.ComponentProps;
    const onClick = Object(Base["d" /* useSnackbarCallback */])(() => service["b" /* default */].Identity.detachProfile(identifier), [identifier], props.onClose);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "small", icon: Object(jsx_runtime["jsx"])(LinkOffIcon, {}, void 0), iconColor: "#699CF7", primary: t('disconnect_profile'), secondary: t('dashboard_disconnect_profile_hint', {
                persona: nickname,
                network: identifier.network,
                profile: identifier.userId,
            }), footer: Object(jsx_runtime["jsxs"])(SpacedButtonGroup, { children: [Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ variant: "contained", color: "danger", onClick: onClick }, { children: t('confirm') }), void 0),
                    Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "outlined", color: "inherit", onClick: props.onClose }, { children: t('cancel') }), void 0)] }, void 0) }, void 0) }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/components/InjectedComponents/SetupGuide.tsx
var SetupGuide = __webpack_require__(539);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/ProfileBox.tsx











function ProfileBox({ persona, ProviderLineProps }) {
    const profiles = persona ? [...persona.linkedProfiles] : [];
    const providers = [...social_network_worker["b" /* definedSocialNetworkWorkers */]].map((i) => {
        const profile = profiles.find(([key, value]) => key.network === i.networkIdentifier);
        return {
            internalName: i.internalName,
            network: i.networkIdentifier,
            connected: !!profile,
            userId: profile === null || profile === void 0 ? void 0 : profile[0].userId,
            identifier: profile === null || profile === void 0 ? void 0 : profile[0],
        };
    });
    const [detachProfile, , setDetachProfile] = Object(Base["c" /* useModal */])(DashboardPersonaUnlinkConfirmDialog);
    const onConnect = async (provider) => {
        if (!persona)
            return;
        if (!(await getCurrentNetworkUI(provider.network).requestPermission()))
            return;
        // FIXME:
        // setting storage race condition here
        settings["l" /* currentSetupGuideStatus */][provider.network].value = json_stable_stringify_default()({
            status: SetupGuide["b" /* SetupGuideStep */].FindUsername,
            persona: persona.identifier.toText(),
        });
        await Object(utils["s" /* sleep */])(100);
        Object(tasks["b" /* exclusiveTasks */])(getCurrentNetworkUI(provider.network).getHomePage(), {
            active: true,
            autoClose: false,
            important: true,
            memorable: false,
        }).SetupGuide(persona.identifier);
    };
    const onDisconnect = (provider) => {
        setDetachProfile({ nickname: persona === null || persona === void 0 ? void 0 : persona.nickname, identifier: provider.identifier });
    };
    return (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [providers.map((provider, index) => (Object(jsx_runtime["jsx"])(ProviderLine, Object.assign({ onAction: () => (provider.connected ? onDisconnect(provider) : onConnect(provider)) }, provider, ProviderLineProps), index))), detachProfile] }, void 0));
}

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Menu/Menu.js + 2 modules
var Menu = __webpack_require__(917);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/hooks/useMenu.tsx




/**
 * A util hooks for easier to use `<Menu>`s.
 * @param menus Material UI `<MenuItem />` elements
 */
function useMenu(...menus) {
    const [open, setOpen] = Object(react["useState"])(false);
    const anchorElRef = Object(react["useRef"])();
    const close = () => setOpen(false);
    return [
        Object(jsx_runtime["jsx"])(Menu["a" /* default */], { container: ShadowRootPortal["a" /* PortalShadowRoot */], open: open, anchorEl: anchorElRef.current, onClose: close, onClick: close, children: menus }, void 0),
        Object(react["useCallback"])((anchorElOrEvent) => {
            if (anchorElOrEvent instanceof HTMLElement)
                anchorElRef.current = anchorElOrEvent;
            else
                anchorElRef.current = anchorElOrEvent.currentTarget;
            setOpen(true);
        }, []),
    ];
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/PersonaCard.tsx













const PersonaCard_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    card: {
        width: 350,
        flex: '0 0 auto',
        marginRight: theme.spacing(6),
        marginBottom: theme.spacing(5),
        padding: theme.spacing(4, 3, 5, 3),
        boxShadow: theme.palette.type === 'dark'
            ? 'none'
            : '0px 2px 4px rgba(96, 97, 112, 0.16), 0px 0px 1px rgba(40, 41, 61, 0.04)',
        [theme.breakpoints.down('sm')]: {
            width: '100%',
            marginRight: 0,
        },
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: theme.spacing(3),
    },
    title: {
        flex: '1 1 auto',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        wordBreak: 'break-all',
        whiteSpace: 'nowrap',
        fontWeight: 500,
    },
    menu: {
        flex: '0 0 auto',
        marginLeft: theme.spacing(1),
        cursor: 'pointer',
    },
}));
function PersonaCard({ persona }) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = PersonaCard_useStyles();
    const color = Object(utils_theme["b" /* useColorStyles */])();
    const [deletePersona, openDeletePersona] = Object(Base["c" /* useModal */])(DashboardPersonaDeleteConfirmDialog, { persona });
    const [backupPersona, openBackupPersona] = Object(Base["c" /* useModal */])(DashboardPersonaBackupDialog, { persona });
    const [renamePersona, openRenamePersona] = Object(Base["c" /* useModal */])(DashboardPersonaRenameDialog, { persona });
    const [menu, openMenu] = useMenu(Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ onClick: openRenamePersona }, { children: t('rename') }), void 0), Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ onClick: openBackupPersona }, { children: t('backup') }), void 0), Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ onClick: openDeletePersona, className: color.error, "data-testid": "delete_button" }, { children: t('delete') }), void 0));
    const id = persona.linkedProfiles.keys().next().value;
    Object(react["useEffect"])(() => {
        if (persona.nickname)
            return;
        const profile = id;
        if (!profile)
            service["b" /* default */].Identity.renamePersona(persona.identifier, persona.identifier.compressedPoint);
        else
            service["b" /* default */].Identity.queryProfile(profile)
                .then((profile) => profile.nickname || profile.identifier.userId)
                .then((newName) => service["b" /* default */].Identity.renamePersona(persona.identifier, newName));
    }, [persona.identifier, id, persona.nickname]);
    return (Object(jsx_runtime["jsxs"])(Card["a" /* default */], Object.assign({ className: classes.card, elevation: 2 }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.header, variant: "h5", component: "h2" }, { children: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])("span", Object.assign({ title: persona.nickname, className: classes.title, "data-testid": "persona_title" }, { children: persona.nickname }), void 0),
                        Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ size: "small", className: classes.menu, onClick: openMenu, "data-testid": "setting_icon" }, { children: Object(jsx_runtime["jsx"])(MoreVert_default.a, {}, void 0) }), void 0), menu] }, void 0) }), void 0),
            Object(jsx_runtime["jsx"])(ProfileBox, { persona: persona }, void 0), deletePersona, backupPersona, renamePersona] }), void 0));
}

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/util/ValueRef.js
var ValueRef = __webpack_require__(132);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/comparer.ts
var comparer = __webpack_require__(264);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/messages.ts
var messages = __webpack_require__(55);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/background-script/StorageService.ts
var StorageService = __webpack_require__(382);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/hooks/useValueRef.ts
var useValueRef = __webpack_require__(40);

// CONCATENATED MODULE: ./packages/maskbook/src/components/DataSource/useMyPersonas.ts








const independentRef = {
    myPersonasRef: new ValueRef["a" /* ValueRef */]([], comparer["b" /* PersonaArrayComparer */]),
    myUninitializedPersonasRef: new ValueRef["a" /* ValueRef */]([], comparer["b" /* PersonaArrayComparer */]),
};
{
    const query = Object(lodash["debounce"])(() => {
        service["b" /* default */].Identity.queryMyPersonas().then((p) => {
            independentRef.myPersonasRef.value = p.filter((x) => !x.uninitialized);
            independentRef.myUninitializedPersonasRef.value = p.filter((x) => x.uninitialized);
            Object(StorageService["b" /* setStorage */])('mobileIsMyPersonasInitialized', independentRef.myPersonasRef.value.length > 0);
        });
    }, 500, { trailing: true });
    side_effects["a" /* sideEffect */].then(query);
    messages["a" /* MaskMessage */].events.personaChanged.on((x) => x.some((x) => x.owned) && query());
}
function useMyPersonas() {
    return Object(useValueRef["a" /* useValueRef */])(independentRef.myPersonasRef);
}
function useMyUninitializedPersonas() {
    return Object(useValueRef["a" /* useValueRef */])(independentRef.myUninitializedPersonasRef);
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardRouters/Personas.tsx













const Personas_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        overflow: 'auto',
        paddingTop: theme.spacing(3),
        // keep the shadow of the persona card
        marginLeft: -4,
        paddingLeft: 4,
        '&::-webkit-scrollbar': {
            display: 'none',
        },
        [theme.breakpoints.down('sm')]: {
            margin: 0,
            paddingLeft: 0,
        },
    },
    databaseButton: {
        paddingTop: 0,
        paddingBottom: 0,
        lineHeight: '24px',
    },
    placeholder: {
        flex: 1,
    },
}));
const personasTheme = (theme) => Object(lodash["merge"])(Object(lodash["cloneDeep"])(theme), {
    overrides: {
        MuiIconButton: {
            root: {
                color: theme.palette.text,
            },
        },
    },
});
function DashboardPersonasRouter() {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = Personas_useStyles();
    const personas = useMyPersonas();
    const [createPersona, openCreatePersona] = Object(Base["c" /* useModal */])(DashboardPersonaCreateDialog);
    const [importPersona, openImportPersona] = Object(Base["c" /* useModal */])(DashboardImportPersonaDialog);
    const actions = Object(react["useMemo"])(() => [
        Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "outlined", onClick: openImportPersona }, { children: t('import') }), void 0),
        Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "contained", onClick: openCreatePersona, endIcon: Object(jsx_runtime["jsx"])(AddCircle_default.a, {}, void 0), "data-testid": "create_button" }, { children: t('create_persona') }), void 0),
    ], [t, openCreatePersona, openImportPersona]);
    return (Object(jsx_runtime["jsxs"])(DashboardRouterContainer, Object.assign({ title: t('my_personas'), empty: !personas.length, actions: actions, floatingButtons: [
            {
                icon: Object(jsx_runtime["jsx"])(Add_default.a, {}, void 0),
                handler: openCreatePersona,
            },
            {
                icon: Object(jsx_runtime["jsx"])(Restore_default.a, {}, void 0),
                handler: openImportPersona,
            },
        ] }, { children: [Object(jsx_runtime["jsx"])(ThemeProvider["a" /* default */], Object.assign({ theme: personasTheme }, { children: Object(jsx_runtime["jsx"])("section", Object.assign({ className: classes.container }, { children: personas
                        .sort((a, b) => {
                        if (a.updatedAt > b.updatedAt)
                            return -1;
                        if (a.updatedAt < b.updatedAt)
                            return 1;
                        return 0;
                    })
                        .map((persona) => (Object(jsx_runtime["jsx"])(PersonaCard, { persona: persona }, persona.identifier.toText()))) }), void 0) }), void 0), createPersona, importPersona] }), void 0));
}

// EXTERNAL MODULE: ./node_modules/react-use/esm/useCopyToClipboard.js + 1 modules
var useCopyToClipboard = __webpack_require__(1572);

// EXTERNAL MODULE: ./node_modules/wallet.ts/dist/index.js
var dist = __webpack_require__(120);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/credit-card.js
var credit_card = __webpack_require__(1673);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/share-2.js
var share_2 = __webpack_require__(1674);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/hexagon.js
var hexagon = __webpack_require__(1675);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/trash-2.js
var trash_2 = __webpack_require__(1676);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/info.js
var info = __webpack_require__(1677);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/clock.js
var clock = __webpack_require__(1678);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/FormControlLabel/FormControlLabel.js
var FormControlLabel = __webpack_require__(1630);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Checkbox/Checkbox.js + 3 modules
var Checkbox = __webpack_require__(1693);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/InputAdornment/InputAdornment.js
var InputAdornment = __webpack_require__(1567);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Chip/Chip.js + 1 modules
var Chip = __webpack_require__(1698);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/FileCopyOutlined.js
var FileCopyOutlined = __webpack_require__(890);
var FileCopyOutlined_default = /*#__PURE__*/__webpack_require__.n(FileCopyOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/InfoOutlined.js
var InfoOutlined = __webpack_require__(889);
var InfoOutlined_default = /*#__PURE__*/__webpack_require__.n(InfoOutlined);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/hooks/useQueryParams.ts

function useQueryParams(query) {
    const history = Object(react_router["h" /* useHistory */])();
    const result = {};
    const search = new URLSearchParams(history.location.search);
    query.forEach((q) => (result[q] = search.get(q)));
    return result;
}

// EXTERNAL MODULE: ./packages/maskbook/src/web3/hooks/useChainState.ts
var useChainState = __webpack_require__(30);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/types.ts
var types = __webpack_require__(3);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/FixedTokenList.tsx + 2 modules
var FixedTokenList = __webpack_require__(547);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/RedPacket/UI/RedPacketList.tsx + 2 modules
var RedPacketList = __webpack_require__(429);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/RedPacket/UI/RedPacket.tsx + 4 modules
var RedPacket = __webpack_require__(546);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/RedPacket/hooks/useRedPacket.ts
var useRedPacket = __webpack_require__(293);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardDialogs/WalletLine.tsx




const WalletLine_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    text: {
        fontWeight: 500,
    },
    action: {},
    control: {
        textAlign: 'left',
        flex: 1,
        width: '100%',
        margin: theme.spacing(1, 0),
    },
    wrapper: {
        display: 'flex',
        alignItems: 'center',
    },
    cursor: {
        cursor: 'pointer',
    },
}));
// TODO: abstract common line
function WalletLine(props) {
    const classes = WalletLine_useStyles();
    const { line1, line2, invert, action, onClick } = props;
    return (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classnames_default()(classes.wrapper, { [classes.cursor]: !!onClick }), onClick: onClick }, { children: [Object(jsx_runtime["jsxs"])(FormControl["a" /* default */], Object.assign({ className: classes.control }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.text, variant: invert ? 'body1' : 'overline' }, { children: line1 }), void 0),
                            Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ variant: invert ? 'caption' : 'body1', component: "a", className: classnames_default()(classes.text) }, { children: line2 }), void 0)] }), void 0), action] }), void 0),
            Object(jsx_runtime["jsx"])(Divider["a" /* default */], {}, void 0)] }, void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/web3/helpers.ts
var helpers = __webpack_require__(28);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/hooks/useAccount.ts
var useAccount = __webpack_require__(64);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Wallet/settings.ts
var Wallet_settings = __webpack_require__(101);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Wallet/messages.ts
var Wallet_messages = __webpack_require__(32);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardDialogs/Wallet.tsx































//#region predefined token selector
const useERC20PredefinedTokenSelectorStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    list: {
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
    },
    search: {
        marginBottom: theme.spacing(1),
    },
    placeholder: {
        textAlign: 'center',
        paddingTop: theme.spacing(10),
    },
}));
function ERC20PredefinedTokenSelector(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = useERC20PredefinedTokenSelectorStyles();
    const { onTokenChange, excludeTokens = [] } = props;
    const [keyword, setKeyword] = Object(react["useState"])('');
    return (Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ textAlign: "left" }, { children: [Object(jsx_runtime["jsx"])(TextField["a" /* default */], { className: classes.search, label: t('add_token_search_hint'), autoFocus: true, value: keyword, onChange: (e) => setKeyword(e.target.value) }, void 0),
            Object(jsx_runtime["jsx"])(FixedTokenList["a" /* FixedTokenList */], { classes: { list: classes.list, placeholder: classes.placeholder }, keyword: keyword, excludeTokens: excludeTokens, onSubmit: (token) => token.type === types["c" /* EthereumTokenType */].ERC20 && (onTokenChange === null || onTokenChange === void 0 ? void 0 : onTokenChange(token)), FixedSizeListProps: {
                    height: 192,
                    itemSize: 52,
                    overscanCount: 2,
                } }, void 0)] }), void 0));
}
function ERC20CustomizedTokenSelector({ onTokenChange, ...props }) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const chainId = Object(useChainState["c" /* useChainId */])();
    const [address, setAddress] = Object(react["useState"])('');
    const [decimals, setDecimals] = Object(react["useState"])(0);
    const [name, setName] = Object(react["useState"])('');
    const [symbol, setSymbol] = Object(react["useState"])('');
    const isValidAddress = dist["EthereumAddress"].isValid(address);
    Object(react["useEffect"])(() => {
        if (isValidAddress)
            onTokenChange === null || onTokenChange === void 0 ? void 0 : onTokenChange({
                type: types["c" /* EthereumTokenType */].ERC20,
                chainId,
                address,
                decimals,
                name,
                symbol,
            });
        else
            onTokenChange === null || onTokenChange === void 0 ? void 0 : onTokenChange(null);
    }, [chainId, address, decimals, isValidAddress, name, symbol, onTokenChange]);
    return (Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ textAlign: "left" }, { children: [Object(jsx_runtime["jsx"])(TextField["a" /* default */], { required: true, autoFocus: true, label: t('add_token_contract_address'), error: !isValidAddress && !!address, value: address, onChange: (e) => setAddress(e.target.value) }, void 0),
            Object(jsx_runtime["jsx"])(TextField["a" /* default */], { required: true, label: t('add_token_decimals'), value: decimals === 0 ? '' : decimals, type: "number", inputProps: { min: 0 }, onChange: (e) => setDecimals(parseInt(e.target.value)) }, void 0),
            Object(jsx_runtime["jsx"])(TextField["a" /* default */], { required: true, label: t('add_token_name'), value: name, onChange: (e) => setName(e.target.value) }, void 0),
            Object(jsx_runtime["jsx"])(TextField["a" /* default */], { required: true, label: t('add_token_symbol'), value: symbol, onChange: (e) => setSymbol(e.target.value) }, void 0)] }), void 0));
}
const useWalletCreateDialogStyle = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    confirmation: {
        fontSize: 16,
        lineHeight: 1.75,
        [theme.breakpoints.down('sm')]: {
            fontSize: 14,
        },
    },
    notification: {
        fontSize: 12,
        fontWeight: 500,
        textAlign: 'center',
        backgroundColor: '#FFD5B3',
        color: 'black',
        padding: '8px 22px',
        margin: '24px -36px 0',
        [theme.breakpoints.down('sm')]: {
            margin: '24px -16px 0',
        },
    },
    notificationIcon: {
        width: 16,
        height: 16,
        color: '#FF9138',
    },
}));
function DashboardWalletCreateDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const state = Object(react["useState"])(0);
    const classes = useWalletCreateDialogStyle();
    const [name, setName] = Object(react["useState"])('');
    const [passphrase] = Object(react["useState"])('');
    const [mnemonic, setMnemonic] = Object(react["useState"])('');
    const [privKey, setPrivKey] = Object(react["useState"])('');
    const [confirmed, setConfirmed] = Object(react["useState"])(false);
    const [showNotification, setShowNotification] = Object(react["useState"])(false);
    const tabProps = {
        tabs: [
            {
                label: t('wallet_new'),
                children: (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])("form", { children: Object(jsx_runtime["jsx"])(TextField["a" /* default */], { helperText: Object(utils["e" /* checkInputLengthExceed */])(name)
                                    ? t('input_length_exceed_prompt', {
                                        name: t('wallet_name').toLowerCase(),
                                        length: constants["c" /* WALLET_OR_PERSONA_NAME_MAX_LEN */],
                                    })
                                    : undefined, required: true, autoFocus: true, label: t('wallet_name'), value: name, onChange: (e) => setName(e.target.value) }, void 0) }, void 0),
                        Object(jsx_runtime["jsx"])("br", {}, void 0),
                        Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ display: "flex", alignItems: "center", justifyContent: "center" }, { children: [Object(jsx_runtime["jsx"])(FormControlLabel["a" /* default */], { control: Object(jsx_runtime["jsx"])(Checkbox["a" /* default */], { checked: confirmed, onChange: () => setConfirmed((confirmed) => !confirmed) }, void 0), label: Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ display: "inline-flex", alignItems: "center" }, { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.confirmation, variant: "body2" }, { children: t('wallet_confirmation_hint') }), void 0) }), void 0) }, void 0),
                                Object(jsx_runtime["jsx"])(InfoOutlined_default.a, { className: classes.notificationIcon, cursor: "pointer", onClick: (ev) => {
                                        ev.stopPropagation();
                                        setShowNotification((t) => !t);
                                    } }, void 0)] }), void 0),
                        showNotification ? (Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.notification }, { children: t('wallet_notification') }), void 0)) : null] }, void 0)),
            },
            {
                label: t('mnemonic_words'),
                children: (Object(jsx_runtime["jsxs"])("div", { children: [Object(jsx_runtime["jsx"])(TextField["a" /* default */], { helperText: Object(utils["e" /* checkInputLengthExceed */])(name)
                                ? t('input_length_exceed_prompt', {
                                    name: t('wallet_name').toLowerCase(),
                                    length: constants["c" /* WALLET_OR_PERSONA_NAME_MAX_LEN */],
                                })
                                : undefined, required: true, autoFocus: true, label: t('wallet_name'), value: name, onChange: (e) => setName(e.target.value) }, void 0),
                        Object(jsx_runtime["jsx"])(TextField["a" /* default */], { required: true, label: t('mnemonic_words'), value: mnemonic, onChange: (e) => setMnemonic(e.target.value) }, void 0)] }, void 0)),
                p: 0,
            },
            {
                label: t('private_key'),
                children: (Object(jsx_runtime["jsxs"])("div", { children: [Object(jsx_runtime["jsx"])(TextField["a" /* default */], { helperText: Object(utils["e" /* checkInputLengthExceed */])(name)
                                ? t('input_length_exceed_prompt', {
                                    name: t('wallet_name').toLowerCase(),
                                    length: constants["c" /* WALLET_OR_PERSONA_NAME_MAX_LEN */],
                                })
                                : undefined, required: true, autoFocus: true, label: t('wallet_name'), value: name, onChange: (e) => setName(e.target.value) }, void 0),
                        Object(jsx_runtime["jsx"])(TextField["a" /* default */], { type: "password", required: true, label: t('private_key'), value: privKey, onChange: (e) => setPrivKey(e.target.value) }, void 0)] }, void 0)),
                display: 'flex',
                p: 0,
            },
        ],
        state,
        height: 112,
    };
    const onSubmit = Object(Base["d" /* useSnackbarCallback */])(async () => {
        if (state[0] === 0) {
            const address = await Wallet_messages["b" /* WalletRPC */].createNewWallet({
                name,
                passphrase,
            });
            setAsSelectedWallet(address);
        }
        if (state[0] === 1) {
            const address = await Wallet_messages["b" /* WalletRPC */].importNewWallet({
                name,
                mnemonic: mnemonic.split(' '),
                passphrase: '',
            });
            setAsSelectedWallet(address);
        }
        if (state[0] === 2) {
            const { address, privateKeyValid } = await Wallet_messages["b" /* WalletRPC */].recoverWalletFromPrivateKey(privKey);
            setAsSelectedWallet(address);
            if (!privateKeyValid)
                throw new Error(t('import_failed'));
            await Wallet_messages["b" /* WalletRPC */].importNewWallet({
                name,
                address,
                _private_key_: privKey,
            });
        }
        function setAsSelectedWallet(address) {
            if (!address)
                return;
            Wallet_settings["b" /* currentSelectedWalletAddressSettings */].value = address;
        }
    }, [state[0], name, passphrase, mnemonic, privKey], props.onClose);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { icon: Object(jsx_runtime["jsx"])(credit_card["a" /* default */], {}, void 0), iconColor: "#4EE0BC", primary: t(state[0] === 0 ? 'plugin_wallet_on_create' : 'import_wallet'), content: Object(jsx_runtime["jsx"])(AbstractTab["a" /* default */], Object.assign({}, tabProps), void 0), footer: Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ variant: "contained", onClick: onSubmit, disabled: (!(state[0] === 0 && name && confirmed) &&
                    !(state[0] === 1 && name && mnemonic) &&
                    !(state[0] === 2 && name && privKey)) ||
                    Object(utils["e" /* checkInputLengthExceed */])(name) }, { children: t('import') }), void 0) }, void 0) }), void 0));
}
//#endregion
//#region wallet share dialog
const useWalletShareDialogStyle = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    qr: {
        marginTop: theme.spacing(3),
    },
}));
function DashboardWalletShareDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = useWalletShareDialogStyle();
    const { wallet } = props.ComponentProps;
    const [, copyToClipboard] = Object(useCopyToClipboard["a" /* default */])();
    const copyWalletAddress = Object(Base["d" /* useSnackbarCallback */])(async (address) => copyToClipboard(address), []);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { icon: Object(jsx_runtime["jsx"])(share_2["a" /* default */], {}, void 0), iconColor: "#4EE0BC", primary: t('share_wallet'), secondary: t('share_wallet_hint'), content: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])("form", { children: Object(jsx_runtime["jsx"])(TextField["a" /* default */], { required: true, label: t('wallet_address'), value: wallet.address, InputProps: {
                                endAdornment: (Object(jsx_runtime["jsx"])(InputAdornment["a" /* default */], Object.assign({ position: "end" }, { children: Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ size: "small", onClick: (e) => {
                                            e.stopPropagation();
                                            copyWalletAddress(wallet.address);
                                        } }, { children: Object(jsx_runtime["jsx"])(FileCopyOutlined_default.a, {}, void 0) }), void 0) }), void 0)),
                            } }, void 0) }, void 0),
                    Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ className: classes.qr, display: "flex", justifyContent: "center", alignItems: "center" }, { children: Object(jsx_runtime["jsx"])(qrcode["a" /* QRCode */], { text: `ethereum:${wallet.address}`, options: { width: 200 }, canvasProps: {
                                style: { display: 'block', margin: 'auto' },
                            } }, void 0) }), void 0)] }, void 0) }, void 0) }), void 0));
}
//#endregion
//#region wallet add ERC20 token dialog
function DashboardWalletAddERC20TokenDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { wallet } = props.ComponentProps;
    const [token, setToken] = Object(react["useState"])(null);
    const [tabState, setTabState] = Object(react["useState"])(0);
    const state = Object(react["useMemo"])(() => [
        tabState,
        (state) => {
            setToken(null);
            return setTabState(state);
        },
    ], [tabState]);
    const tabProps = {
        tabs: [
            {
                label: t('add_token_well_known'),
                children: (Object(jsx_runtime["jsx"])(ERC20PredefinedTokenSelector, { excludeTokens: Array.from(wallet.erc20_token_whitelist), onTokenChange: setToken }, void 0)),
            },
            {
                label: t('add_token_your_own'),
                children: (Object(jsx_runtime["jsx"])(ERC20CustomizedTokenSelector, { excludeTokens: Array.from(wallet.erc20_token_whitelist), onTokenChange: setToken }, void 0)),
            },
        ],
        state,
        height: 240,
    };
    const onSubmit = Object(Base["d" /* useSnackbarCallback */])(async () => {
        if (!token)
            return;
        await Promise.all([Wallet_messages["b" /* WalletRPC */].addERC20Token(token), Wallet_messages["b" /* WalletRPC */].trustERC20Token(wallet.address, token)]);
    }, [token], props.onClose);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { icon: Object(jsx_runtime["jsx"])(hexagon["a" /* default */], {}, void 0), iconColor: "#699CF7", primary: t('add_token'), content: Object(jsx_runtime["jsx"])(AbstractTab["a" /* default */], Object.assign({}, tabProps), void 0), footer: Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ disabled: !token, variant: "contained", onClick: onSubmit }, { children: t('import') }), void 0) }, void 0) }), void 0));
}
//#endregion
//#region wallet backup dialog
const useBackupDialogStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    section: {
        textAlign: 'left',
    },
}));
function DashboardWalletBackupDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { wallet } = props.ComponentProps;
    const classes = useBackupDialogStyles();
    const { value: privateKeyInHex } = Object(useAsync["a" /* default */])(async () => {
        if (!wallet)
            return;
        const { privateKeyInHex } = wallet._private_key_
            ? await Wallet_messages["b" /* WalletRPC */].recoverWalletFromPrivateKey(wallet._private_key_)
            : await Wallet_messages["b" /* WalletRPC */].recoverWallet(wallet.mnemonic, wallet.passphrase);
        return privateKeyInHex;
    }, [wallet]);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { icon: Object(jsx_runtime["jsx"])(credit_card["a" /* default */], {}, void 0), iconColor: "#4EE0BC", primary: t('backup_wallet'), secondary: t('backup_wallet_hint'), constraintSecondary: false, content: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [(wallet === null || wallet === void 0 ? void 0 : wallet.mnemonic.length) ? (Object(jsx_runtime["jsx"])("section", Object.assign({ className: classes.section }, { children: Object(jsx_runtime["jsx"])(ShowcaseBox, Object.assign({ title: t('mnemonic_words') }, { children: wallet.mnemonic.join(' ') }), void 0) }), void 0)) : null,
                    Object(jsx_runtime["jsx"])("section", Object.assign({ className: classes.section }, { children: Object(jsx_runtime["jsx"])(ShowcaseBox, Object.assign({ title: t('private_key') }, { children: privateKeyInHex }), void 0) }), void 0)] }, void 0) }, void 0) }), void 0));
}
//#endregion
//#region wallet rename dialog
function DashboardWalletRenameDialog(props) {
    var _a;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { wallet } = props.ComponentProps;
    const [name, setName] = Object(react["useState"])((_a = wallet.name) !== null && _a !== void 0 ? _a : '');
    const renameWallet = Object(Base["d" /* useSnackbarCallback */])(() => Wallet_messages["b" /* WalletRPC */].renameWallet(wallet.address, name), [wallet.address], props.onClose);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({ fullScreen: false }, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "small", primary: t('wallet_rename'), content: Object(jsx_runtime["jsx"])(TextField["a" /* default */], { helperText: Object(utils["e" /* checkInputLengthExceed */])(name)
                    ? t('input_length_exceed_prompt', {
                        name: t('wallet_name').toLowerCase(),
                        length: constants["c" /* WALLET_OR_PERSONA_NAME_MAX_LEN */],
                    })
                    : undefined, required: true, autoFocus: true, label: t('wallet_name'), variant: "outlined", value: name, onChange: (e) => setName(e.target.value), inputProps: { onKeyPress: (e) => e.key === 'Enter' && renameWallet() } }, void 0), footer: Object(jsx_runtime["jsxs"])(SpacedButtonGroup, { children: [Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ variant: "contained", onClick: renameWallet, disabled: name.length === 0 || Object(utils["e" /* checkInputLengthExceed */])(name) }, { children: t('ok') }), void 0),
                    Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "outlined", color: "inherit", onClick: props.onClose }, { children: t('cancel') }), void 0)] }, void 0) }, void 0) }), void 0));
}
//#endregion
//#region wallet delete dialog
function DashboardWalletDeleteConfirmDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { wallet } = props.ComponentProps;
    const onConfirm = Object(Base["d" /* useSnackbarCallback */])(async () => {
        return Wallet_messages["b" /* WalletRPC */].removeWallet(wallet.address);
    }, [wallet.address], props.onClose);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({ fullScreen: false }, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "small", icon: Object(jsx_runtime["jsx"])(credit_card["a" /* default */], {}, void 0), iconColor: "#F4637D", primary: t('delete_wallet'), secondary: t('delete_wallet_hint'), footer: Object(jsx_runtime["jsxs"])(SpacedButtonGroup, { children: [Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ variant: "contained", color: "danger", onClick: onConfirm, "data-testid": "confirm_button" }, { children: t('confirm') }), void 0),
                    Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "outlined", color: "inherit", onClick: props.onClose }, { children: t('cancel') }), void 0)] }, void 0) }, void 0) }), void 0));
}
//#endregion
//#region hide wallet token
function DashboardWalletHideTokenConfirmDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { wallet, token } = props.ComponentProps;
    const onConfirm = Object(Base["d" /* useSnackbarCallback */])(() => Wallet_messages["b" /* WalletRPC */].blockERC20Token(wallet.address, token), [wallet.address], props.onClose);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({ fullScreen: false }, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "small", icon: Object(jsx_runtime["jsx"])(trash_2["a" /* default */], {}, void 0), iconColor: "#F4637D", primary: t('hide_token'), secondary: t('hide_token_hint', { token: token.name }), footer: Object(jsx_runtime["jsxs"])(SpacedButtonGroup, { children: [Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ variant: "contained", color: "danger", onClick: onConfirm }, { children: t('confirm') }), void 0),
                    Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "outlined", color: "inherit", onClick: props.onClose }, { children: t('cancel') }), void 0)] }, void 0) }, void 0) }), void 0));
}
//#endregion
//#region wallet error dialog
function DashboardWalletErrorDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const history = Object(react_router["h" /* useHistory */])();
    const { error } = useQueryParams(['error']);
    let message = '';
    switch (error) {
        case 'nowallet':
            message = t('error_no_wallet');
            break;
        case 'Returned error: gas required exceeds allowance (10000000) or always failing transaction':
            message = t('error_gas_feed_exceeds');
            break;
        case 'Returned error: insufficient funds for gas * price value':
            message = t('error_insufficient_balance');
            break;
        default:
            message = t('error_unknown');
            break;
    }
    const onClose = async () => {
        props.onClose();
        // prevent UI updating before dialog disappearing
        await Object(utils["s" /* sleep */])(300);
        history.replace(Route["a" /* DashboardRoute */].Wallets);
    };
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { onClose: onClose }, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "small", icon: Object(jsx_runtime["jsx"])(info["a" /* default */], {}, void 0), iconColor: "#F4637D", primary: t('error_wallet'), secondary: message, footer: Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "contained", onClick: onClose }, { children: t('ok') }), void 0) }, void 0) }), void 0));
}
//#endregion
//#region wallet history dialog
const useHistoryDialogStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    list: {
        width: '100%',
        overflow: 'auto',
    },
}));
function DashboardWalletHistoryDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = useHistoryDialogStyles();
    const { wallet, onRedPacketClicked } = props.ComponentProps;
    const state = Object(react["useState"])(0);
    const tabProps = {
        tabs: [
            {
                label: t('activity_inbound'),
                children: Object(jsx_runtime["jsx"])(RedPacketList["b" /* RedPacketInboundList */], { onSelect: onRedPacketClicked }, void 0),
                p: 0,
            },
            {
                label: t('activity_outbound'),
                children: Object(jsx_runtime["jsx"])(RedPacketList["c" /* RedPacketOutboundList */], { onSelect: onRedPacketClicked }, void 0),
                display: 'flex',
                p: 0,
            },
        ],
        state,
        height: 350,
    };
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { icon: Object(jsx_runtime["jsx"])(clock["a" /* default */], {}, void 0), iconColor: "#FB5858", primary: t('activity'), content: Object(jsx_runtime["jsx"])(AbstractTab["a" /* default */], Object.assign({}, tabProps), void 0) }, void 0) }), void 0));
}
//#endregion
//#region red packet detail dialog
const useRedPacketDetailStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    sayThanks: {
        display: 'block',
        width: 200,
        margin: `${theme.spacing(2)}px auto`,
    },
    link: {
        display: 'block',
        width: '100%',
        wordBreak: 'break-all',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    },
}));
function DashboardWalletRedPacketDetailDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { wallet, payload } = props.ComponentProps;
    const classes = useRedPacketDetailStyles();
    const account = Object(useAccount["a" /* useAccount */])();
    const redPacket = Object(useRedPacket["a" /* useRedPacketFromDB */])(payload.rpid);
    const sayThanks = Object(react["useCallback"])(() => {
        if (!(redPacket === null || redPacket === void 0 ? void 0 : redPacket.from))
            return;
        if (!redPacket.from.includes('twitter.com/')) {
            window.open(redPacket.from, '_blank', 'noopener noreferrer');
        }
        else {
            const user = redPacket.from.match(/(?!\/)[\d\w]+(?=\/status)/);
            const userText = user ? ` from @${user}` : '';
            const text = [
                `I just received a Red Packet${userText}. Follow @realMaskbook (mask.io) to get your first Twitter #payload.`,
                `#mask_io ${redPacket.from}`,
            ].join('\n');
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener noreferrer');
        }
    }, [redPacket]);
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { primary: "Red Packet Detail", content: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(RedPacket["a" /* RedPacket */], { payload: payload }, void 0),
                    (redPacket === null || redPacket === void 0 ? void 0 : redPacket.from) && !Object(helpers["j" /* isSameAddress */])(redPacket.payload.sender.address, wallet.address) && (Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: classes.sayThanks, onClick: sayThanks, variant: "contained" }, { children: "Say Thanks" }), void 0)),
                    (redPacket === null || redPacket === void 0 ? void 0 : redPacket.from) && (Object(jsx_runtime["jsx"])(WalletLine, { onClick: () => window.open(redPacket === null || redPacket === void 0 ? void 0 : redPacket.from, '_blank', 'noopener noreferrer'), line1: "Source", line2: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.link, color: "primary" }, { children: (redPacket === null || redPacket === void 0 ? void 0 : redPacket.from) || 'Unknown' }), void 0) }, void 0)),
                    Object(jsx_runtime["jsx"])(WalletLine, { line1: "From", line2: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [payload.sender.name, ' ', Object(helpers["j" /* isSameAddress */])(payload.sender.address, account) && (Object(jsx_runtime["jsx"])(Chip["a" /* default */], { label: "Me", variant: "outlined", color: "secondary", size: "small" }, void 0))] }, void 0) }, void 0),
                    Object(jsx_runtime["jsx"])(WalletLine, { line1: "Message", line2: payload.sender.message }, void 0),
                    Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ p: 1, display: "flex", justifyContent: "center" }, { children: Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ variant: "caption", color: "textSecondary" }, { children: ["Created at ", new Date(payload.creation_time).toLocaleString()] }), void 0) }), void 0)] }, void 0) }, void 0) }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Wallet/hooks/useWallet.ts
var useWallet = __webpack_require__(136);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Wallet/helpers.ts
var Wallet_helpers = __webpack_require__(512);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Wallet/hooks/useERC20Token.ts






//#region cache service query result
const erc20TokenRef = new ValueRef["a" /* ValueRef */]([], Wallet_helpers["a" /* TokenArrayComparer */]);
async function revalidate() {
    // tokens
    const tokens = await Wallet_messages["b" /* WalletRPC */].getERC20Tokens();
    erc20TokenRef.value = tokens;
}
Wallet_messages["a" /* WalletMessages */].events.tokensUpdated.on(revalidate);
revalidate();
//#endregion
/**
 * Fetch all ERC20 tokens from DB
 */
function useERC20TokensFromDB() {
    const records = Object(useValueRef["a" /* useValueRef */])(erc20TokenRef);
    return records.map((x) => ({
        type: types["c" /* EthereumTokenType */].ERC20,
        ...x,
    }));
}
/**
 * Fetch all trusted ERC20 tokens from DB
 * @param address
 */
function useTrustedERC20TokensFromDB() {
    const wallet = Object(useWallet["a" /* useWallet */])();
    const erc20Tokens = useERC20TokensFromDB();
    if (!wallet)
        return [];
    return erc20Tokens.filter((x) => wallet.erc20_token_whitelist.has(x.address) && !wallet.erc20_token_blacklist.has(x.address));
}

// EXTERNAL MODULE: ./node_modules/bignumber.js/bignumber.js
var bignumber = __webpack_require__(27);
var bignumber_default = /*#__PURE__*/__webpack_require__.n(bignumber);

// EXTERNAL MODULE: ./node_modules/swr/esm/index.js + 7 modules
var esm = __webpack_require__(376);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Wallet/formatter.ts
var formatter = __webpack_require__(29);

// CONCATENATED MODULE: ./packages/maskbook/src/web3/hooks/useAssetsDetailedDebank.ts








async function fetcher(address, chainId) {
    if (!dist["EthereumAddress"].isValid(address))
        return [];
    if (chainId !== types["a" /* ChainId */].Mainnet)
        return [];
    const response = await fetch(`https://api.debank.com/token/balance_list?user_addr=${address}`);
    const { data = [], error_code } = (await response.json());
    if (error_code === 0)
        return data;
    return [];
}
/**
 * Fetch tokens detailed info from debank API
 * @param address
 */
function useAssetsDetailedDebank() {
    const account = Object(useAccount["a" /* useAccount */])();
    const chainId = Object(useChainState["c" /* useChainId */])();
    const { data = [] } = Object(esm["a" /* default */])([account, chainId], {
        fetcher,
    });
    return data.map((x) => ({
        token: x.id === 'eth'
            ? Object(helpers["c" /* createEetherToken */])(chainId)
            : {
                // distinguish token type
                type: types["c" /* EthereumTokenType */].ERC20,
                address: Object(formatter["b" /* formatChecksumAddress */])(x.id),
                chainId: types["a" /* ChainId */].Mainnet,
                name: x.name,
                symbol: x.symbol,
                decimals: x.decimals,
            },
        balance: new bignumber_default.a(x.balance).toFixed(),
        price: {
            [types["b" /* CurrencyType */].USD]: new bignumber_default.a(x.price).toFixed(),
        },
        value: {
            [types["b" /* CurrencyType */].USD]: new bignumber_default.a(x.price)
                .multipliedBy(new bignumber_default.a(x.balance).dividedBy(new bignumber_default.a(10).pow(x.decimals)))
                .toFixed(),
        },
    }));
}

// EXTERNAL MODULE: ./packages/maskbook/src/web3/constants/index.ts
var web3_constants = __webpack_require__(65);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/hooks/useConstant.ts
var useConstant = __webpack_require__(68);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/hooks/useContract.ts
var useContract = __webpack_require__(143);

// EXTERNAL MODULE: ./packages/maskbook/src/contracts/balance-checker/BalanceChecker.json
var BalanceChecker = __webpack_require__(891);

// CONCATENATED MODULE: ./packages/maskbook/src/web3/contracts/useBalanceChecker.ts




function useBalanceCheckerContract() {
    const address = Object(useConstant["a" /* useConstant */])(web3_constants["a" /* CONSTANTS */], 'BALANCE_CHECKER_ADDRESS');
    return Object(useContract["a" /* useContract */])(address, BalanceChecker);
}

// CONCATENATED MODULE: ./packages/maskbook/src/web3/hooks/useTokensBalance.ts




/**
 * Fetch balance of multiple tokens from chain
 * @param from
 * @param listOfAddress
 */
function useTokensBalance(listOfAddress) {
    const account = Object(useAccount["a" /* useAccount */])();
    const chainId = Object(useChainState["c" /* useChainId */])();
    const balanceCheckerContract = useBalanceCheckerContract();
    return Object(useAsync["a" /* default */])(async () => {
        if (!account || !balanceCheckerContract || !listOfAddress.length)
            return [];
        return balanceCheckerContract.methods.balances([account], listOfAddress).call({
            // cannot check the sender's balance in the same contract
            from: undefined,
        });
    }, [account, chainId /* re-calc when switch the chain */, listOfAddress.join(), balanceCheckerContract]);
}

// CONCATENATED MODULE: ./packages/maskbook/src/web3/hooks/useAssetsDetailedMerged.ts





/**
 * Merge multiple token lists into one which sorted by balance.
 * The order of result values is determined by the order they occur in the array.
 * @param listOfTokens
 */
function useAssetsDetailedMerged(...listOfTokens) {
    const chainId = Object(useChainState["c" /* useChainId */])();
    const ETH_ADDRSS = Object(useConstant["a" /* useConstant */])(web3_constants["a" /* CONSTANTS */], 'ETH_ADDRESS');
    return Object(lodash["uniqBy"])(listOfTokens.flatMap((x) => x), (x) => Object(formatter["b" /* formatChecksumAddress */])(x.token.address))
        .filter((x) => x.token.chainId === chainId)
        .sort((a, z) => {
        // ether goes first place
        if (a.token.address === ETH_ADDRSS)
            return -1;
        if (z.token.address === ETH_ADDRSS)
            return 1;
        if (a.balance.length > z.balance.length)
            return -1;
        if (a.balance.length < z.balance.length)
            return 1;
        if (a.balance > z.balance)
            return -1;
        if (a.balance < z.balance)
            return 1;
        return 0;
    });
}

// CONCATENATED MODULE: ./packages/maskbook/src/web3/hooks/useAssetsDetailed.ts


/**
 * Fetch tokens detailed (balance only) from chain
 * @param address
 * @param tokens
 */
function useAssetsDetailed(tokens) {
    const { value: listOfBalance = [] } = useTokensBalance(tokens.map((x) => x.address));
    return useAssetsDetailedMerged(
    // the length not matched in the case of error occurs
    listOfBalance.length === tokens.length
        ? listOfBalance.map((balance, idx) => ({
            token: tokens[idx],
            balance,
        }))
        : []);
}

// EXTERNAL MODULE: ./packages/maskbook/src/web3/hooks/useEtherTokenDetailed.ts
var useEtherTokenDetailed = __webpack_require__(242);

// CONCATENATED MODULE: ./packages/maskbook/src/web3/hooks/useAssetsDetailedCallback.ts






function useAssetsDetailedCallback(tokens) {
    const wallet = Object(useWallet["a" /* useWallet */])();
    const { value: etherTokenDetailed } = Object(useEtherTokenDetailed["a" /* useEtherTokenDetailed */])();
    const assetsDetailedChain = useAssetsDetailed(etherTokenDetailed ? [etherTokenDetailed, ...tokens] : tokens);
    const assetsDetailedDebank = useAssetsDetailedDebank();
    // should place debank detailed tokens at the first place
    // it prevents them from replacing by previous detailed tokens because the uniq algorithm
    const assetsDetailed = useAssetsDetailedMerged(assetsDetailedDebank, assetsDetailedChain);
    // filter out tokens in blacklist
    return assetsDetailed.filter((x) => !(wallet === null || wallet === void 0 ? void 0 : wallet.erc20_token_blacklist.has(Object(formatter["b" /* formatChecksumAddress */])(x.token.address))));
}

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Tabs/Tabs.js + 7 modules
var Tabs = __webpack_require__(1569);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Tab/Tab.js
var Tab = __webpack_require__(1561);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/MonetizationOnOutlined.js
var MonetizationOnOutlined = __webpack_require__(892);
var MonetizationOnOutlined_default = /*#__PURE__*/__webpack_require__.n(MonetizationOnOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/MoreVertOutlined.js
var MoreVertOutlined = __webpack_require__(893);
var MoreVertOutlined_default = /*#__PURE__*/__webpack_require__.n(MoreVertOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/History.js
var History = __webpack_require__(894);
var History_default = /*#__PURE__*/__webpack_require__.n(History);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TableContainer/TableContainer.js
var TableContainer = __webpack_require__(926);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Table/Table.js
var Table = __webpack_require__(927);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TableHead/TableHead.js
var TableHead = __webpack_require__(928);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TableRow/TableRow.js
var TableRow = __webpack_require__(440);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TableCell/TableCell.js
var TableCell = __webpack_require__(298);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TableBody/TableBody.js
var TableBody = __webpack_require__(642);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/TokenIcon.tsx
var TokenIcon = __webpack_require__(241);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/MoreHoriz.js
var MoreHoriz = __webpack_require__(543);
var MoreHoriz_default = /*#__PURE__*/__webpack_require__.n(MoreHoriz);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/hooks/useRemoteControlledDialog.ts
var useRemoteControlledDialog = __webpack_require__(57);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Transak/messages.ts
var Transak_messages = __webpack_require__(210);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/ERC20TokenActionsBar.tsx














const ERC20TokenActionsBar_useStyles = Object(makeStyles["a" /* default */])((theme) => ({
    more: {
        color: theme.palette.text.primary,
    },
}));
function ERC20TokenActionsBar(props) {
    const { wallet, token } = props;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const account = Object(useAccount["a" /* useAccount */])();
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(ERC20TokenActionsBar_useStyles(), props);
    const ETH_ADDRESS = Object(useConstant["a" /* useConstant */])(web3_constants["a" /* CONSTANTS */], 'ETH_ADDRESS');
    //#region remote controlled buy dialog
    const [, setBuyDialogOpen] = Object(useRemoteControlledDialog["a" /* useRemoteControlledDialog */])(Transak_messages["a" /* PluginTransakMessages */].events.buyTokenDialogUpdated);
    //#endregion
    const [hideTokenConfirmDialog, , openHideTokenConfirmDialog] = Object(Base["c" /* useModal */])(DashboardWalletHideTokenConfirmDialog);
    const [menu, openMenu] = useMenu(Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ onClick: () => {
            var _a;
            setBuyDialogOpen({
                open: true,
                code: (_a = token.symbol) !== null && _a !== void 0 ? _a : token.name,
                address: account,
            });
        } }, { children: t('buy') }), void 0), Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ onClick: () => openHideTokenConfirmDialog({ wallet, token }) }, { children: t('hide') }), void 0));
    if (Object(helpers["j" /* isSameAddress */])(token.address, ETH_ADDRESS))
        return null;
    return (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ className: classes.more, size: "small", onClick: openMenu }, { children: Object(jsx_runtime["jsx"])(MoreHoriz_default.a, {}, void 0) }), void 0), menu, hideTokenConfirmDialog] }, void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/WalletAssetsTable.tsx











const WalletAssetsTable_useStyles = Object(makeStyles["a" /* default */])((theme) => ({
    container: {
        '&::-webkit-scrollbar': {
            display: 'none',
        },
        padding: theme.spacing(0, 3),
    },
    table: {},
    head: {},
    cell: {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1.5),
        whiteSpace: 'nowrap',
    },
    record: {
        display: 'flex',
    },
    coin: {
        width: 24,
        height: 24,
    },
    name: {
        marginLeft: theme.spacing(1),
    },
    symbol: {
        marginLeft: theme.spacing(1),
    },
    price: {},
    more: {
        color: theme.palette.text.primary,
    },
}));
function WalletAssetsTable(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { wallet, detailedTokens } = props;
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(WalletAssetsTable_useStyles(), props);
    const LABELS = [t('wallet_assets'), t('wallet_price'), t('wallet_balance'), t('wallet_value'), ''];
    const chainIdValid = Object(useChainState["d" /* useChainIdValid */])();
    if (!chainIdValid)
        return null;
    if (!detailedTokens.length)
        return null;
    return (Object(jsx_runtime["jsx"])(TableContainer["a" /* default */], Object.assign({ className: classes.container }, { children: Object(jsx_runtime["jsxs"])(Table["a" /* default */], Object.assign({ className: classes.table, component: "table", size: "medium", stickyHeader: true }, { children: [Object(jsx_runtime["jsx"])(TableHead["a" /* default */], { children: Object(jsx_runtime["jsx"])(TableRow["a" /* default */], { children: LABELS.map((x, i) => (Object(jsx_runtime["jsx"])(TableCell["a" /* default */], Object.assign({ className: classnames_default()(classes.head, classes.cell), align: i === 0 ? 'left' : 'right' }, { children: x }), i))) }, void 0) }, void 0),
                Object(jsx_runtime["jsx"])(TableBody["a" /* default */], { children: detailedTokens.map((x) => {
                        var _a, _b, _c, _d;
                        return (Object(jsx_runtime["jsx"])(TableRow["a" /* default */], Object.assign({ className: classes.cell }, { children: [
                                Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ display: "flex" }, { children: [Object(jsx_runtime["jsx"])(TokenIcon["a" /* TokenIcon */], { classes: { icon: classes.coin }, name: x.token.name, address: x.token.address }, void 0),
                                        Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.name }, { children: x.token.name }), void 0)] }), void 0),
                                Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ display: "flex", justifyContent: "flex-end" }, { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.price, color: "textPrimary", component: "span" }, { children: ((_a = x.price) === null || _a === void 0 ? void 0 : _a[types["b" /* CurrencyType */].USD]) ? Object(formatter["c" /* formatCurrency */])(Number.parseFloat(x.price[types["b" /* CurrencyType */].USD]), '$')
                                            : '-' }), void 0) }), void 0),
                                Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ display: "flex", justifyContent: "flex-end" }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.name, color: "textPrimary", component: "span" }, { children: Object(formatter["a" /* formatBalance */])(new bignumber_default.a(x.balance), (_b = x.token.decimals) !== null && _b !== void 0 ? _b : 0, (_c = x.token.decimals) !== null && _c !== void 0 ? _c : 0) }), void 0),
                                        Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.symbol, color: "textSecondary", component: "span" }, { children: x.token.symbol }), void 0)] }), void 0),
                                Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ display: "flex", justifyContent: "flex-end" }, { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.price, color: "textPrimary", component: "span" }, { children: ((_d = x.value) === null || _d === void 0 ? void 0 : _d[types["b" /* CurrencyType */].USD]) ? Object(formatter["c" /* formatCurrency */])(Number.parseFloat(x.value[types["b" /* CurrencyType */].USD]), '$')
                                            : Object(formatter["c" /* formatCurrency */])(0, '$') }), void 0) }), void 0),
                                Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ display: "flex", justifyContent: "flex-end" }, { children: x.token.type === types["c" /* EthereumTokenType */].ERC20 ? (Object(jsx_runtime["jsx"])(ERC20TokenActionsBar, { wallet: wallet, token: x.token }, void 0)) : null }), void 0),
                            ]
                                .filter(Boolean)
                                .map((y, i) => (Object(jsx_runtime["jsx"])(TableCell["a" /* default */], Object.assign({ className: classes.cell }, { children: y }), i))) }), x.token.address));
                    }) }, void 0)] }), void 0) }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/web3/hooks/useERC721TokenDetailed.ts
var useERC721TokenDetailed = __webpack_require__(285);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Election2020/constants.ts
var Election2020_constants = __webpack_require__(146);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/hooks/useERC721TokensOfOwner.ts
var useERC721TokensOfOwner = __webpack_require__(538);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Election2020/hooks/useAllElectionTokensOfOwner.ts

function useAllElectionTokensOfOwner(token) {
    const { value: tokenIds, ...result } = Object(useERC721TokensOfOwner["a" /* useERC721TokenIdsOfOwner */])(token);
    return {
        ...result,
        value: tokenIds.filter(Boolean).map((tokenId) => ({
            tokenId: tokenId !== null && tokenId !== void 0 ? tokenId : '',
            tokenImageURL: tokenId ? `${token === null || token === void 0 ? void 0 : token.baseURI}${tokenId}.gif` : '',
        })),
    };
}

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Election2020/UI/ElectionCard.tsx
var ElectionCard = __webpack_require__(537);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Election2020/UI/ElectionTokenAlbum.tsx








const ElectionTokenAlbum_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        padding: theme.spacing(0, 3),
    },
    content: {
        margin: '0 auto',
        display: 'flex',
        flexFlow: 'row wrap',
        justifyContent: 'flex-start',
        scrollSnapAlign: 'center',
        '&::after': {
            content: '""',
            flex: 'auto',
        },
    },
    tile: {
        padding: theme.spacing(1),
    },
}));
function ElectionTokenAlbum(props) {
    const classes = ElectionTokenAlbum_useStyles(props);
    // fetch the NFT token
    const ELECTION_TOKEN_ADDRESS = Object(useConstant["a" /* useConstant */])(Election2020_constants["a" /* ELECTION_2020_CONSTANTS */], 'ELECTION_TOKEN_ADDRESS');
    const { value: electionToken } = Object(useERC721TokenDetailed["a" /* useERC721TokenDetailed */])(ELECTION_TOKEN_ADDRESS);
    const tokens = useAllElectionTokensOfOwner(electionToken);
    const chainIdValid = Object(useChainState["d" /* useChainIdValid */])();
    if (!chainIdValid)
        return null;
    if (!tokens.value.length)
        return null;
    return (Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.root }, { children: Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.content }, { children: tokens.value.map((token) => (Object(jsx_runtime["jsx"])("section", Object.assign({ className: classes.tile }, { children: Object(jsx_runtime["jsx"])(ElectionCard["a" /* ElectionCard */], { token: token, canViewOnEtherscan: true }, void 0) }), token.tokenId))) }), void 0) }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/web3/hooks/useBlockie.ts
var useBlockie = __webpack_require__(363);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/WalletContent.tsx






















const WalletContent_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&> *': {
            flex: '0 0 auto',
            overflow: 'auto',
        },
    },
    caption: {
        padding: theme.spacing(3, 2, 0, 2),
    },
    header: {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    content: {
        flex: 1,
    },
    footer: {
        margin: theme.spacing(1),
    },
    title: {
        flex: 1,
        paddingLeft: theme.spacing(1),
    },
    tabs: {},
    addButton: {
        color: theme.palette.primary.main,
    },
    moreButton: {
        color: theme.palette.text.primary,
    },
    assetsTable: {
        flex: 1,
    },
}));
const WalletContent_WalletContent = Object(react["forwardRef"])(function WalletContent({ wallet, detailedTokens }, ref) {
    const classes = WalletContent_useStyles();
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const color = Object(utils_theme["b" /* useColorStyles */])();
    const xsMatched = Object(useMatchXS["a" /* useMatchXS */])();
    const [addToken, , openAddToken] = Object(Base["c" /* useModal */])(DashboardWalletAddERC20TokenDialog);
    const [walletShare, , openWalletShare] = Object(Base["c" /* useModal */])(DashboardWalletShareDialog);
    const [walletHistory, , openWalletHistory] = Object(Base["c" /* useModal */])(DashboardWalletHistoryDialog);
    const [walletBackup, , openWalletBackup] = Object(Base["c" /* useModal */])(DashboardWalletBackupDialog);
    const [walletDelete, , openWalletDelete] = Object(Base["c" /* useModal */])(DashboardWalletDeleteConfirmDialog);
    const [walletRename, , openWalletRename] = Object(Base["c" /* useModal */])(DashboardWalletRenameDialog);
    const [walletRedPacket, , openWalletRedPacket] = Object(Base["c" /* useModal */])(DashboardWalletRedPacketDetailDialog);
    const [menu, openMenu] = useMenu(Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ onClick: () => openWalletShare({ wallet }) }, { children: t('share') }), void 0), Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ onClick: () => openWalletRename({ wallet }) }, { children: t('rename') }), void 0), wallet._private_key_ || wallet.mnemonic ? (Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ onClick: () => openWalletBackup({ wallet }) }, { children: t('backup') }), void 0)) : undefined, Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ onClick: () => openWalletDelete({ wallet }), className: color.error, "data-testid": "delete_button" }, { children: t('delete') }), void 0));
    //#region remote controlled buy dialog
    const [, setBuyDialogOpen] = Object(useRemoteControlledDialog["a" /* useRemoteControlledDialog */])(Transak_messages["a" /* PluginTransakMessages */].events.buyTokenDialogUpdated);
    //#endregion
    //#region tab
    const [tabIndex, setTabIndex] = Object(react["useState"])(0);
    const onTabChange = Object(react["useCallback"])((_, newTabIndex) => {
        setTabIndex(newTabIndex);
    }, []);
    //#endregion
    const blockie = Object(useBlockie["a" /* useBlockie */])(wallet.address);
    return (Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.root, ref: ref }, { children: [Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ className: classes.caption, display: "flex", alignItems: "center" }, { children: [Object(jsx_runtime["jsx"])(Avatar["a" /* default */], { src: blockie }, void 0),
                    Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.title, variant: "h5", color: "textPrimary" }, { children: wallet.name ? Object(lodash["truncate"])(wallet.name, { length: constants["c" /* WALLET_OR_PERSONA_NAME_MAX_LEN */] }) : wallet.address }), void 0),
                    !xsMatched ? (Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ display: "flex", alignItems: "center", justifyContent: "flex-end" }, { children: [tabIndex === 0 ? (Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ className: classes.addButton, variant: "text", onClick: () => openAddToken({ wallet }), startIcon: Object(jsx_runtime["jsx"])(Add_default.a, {}, void 0) }, { children: t('add_token') }), void 0)) : null,
                            flags["a" /* Flags */].transak_enabled ? (Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ onClick: () => {
                                    setBuyDialogOpen({
                                        open: true,
                                        address: wallet.address,
                                    });
                                }, startIcon: Object(jsx_runtime["jsx"])(MonetizationOnOutlined_default.a, {}, void 0) }, { children: t('buy_now') }), void 0)) : null] }), void 0)) : null,
                    Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ className: classes.moreButton, size: "small", onClick: openMenu, "data-testid": "setting_icon" }, { children: Object(jsx_runtime["jsx"])(MoreVertOutlined_default.a, {}, void 0) }), void 0), menu] }), void 0),
            Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ pt: xsMatched ? 2 : 3, pb: 2, pl: 3, pr: 2, display: "flex", alignItems: "center", className: xsMatched ? classes.header : '' }, { children: Object(jsx_runtime["jsxs"])(Tabs["a" /* default */], Object.assign({ className: classes.tabs, value: tabIndex, indicatorColor: "primary", textColor: "primary", onChange: onTabChange }, { children: [Object(jsx_runtime["jsx"])(Tab["a" /* default */], { label: "Token" }, void 0),
                        Object(jsx_runtime["jsx"])(Tab["a" /* default */], { label: "Collectibles" }, void 0)] }), void 0) }), void 0),
            Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ className: classes.content }, { children: [tabIndex === 0 ? (Object(jsx_runtime["jsx"])(WalletAssetsTable, { classes: { container: classes.assetsTable }, wallet: wallet, detailedTokens: detailedTokens }, void 0)) : null,
                    flags["a" /* Flags */].election2020_enabled && tabIndex === 1 ? Object(jsx_runtime["jsx"])(ElectionTokenAlbum, {}, void 0) : null] }), void 0),
            !xsMatched ? (Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ className: classes.footer, display: "flex", alignItems: "center" }, { children: Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ onClick: () => openWalletHistory({
                        wallet,
                        onRedPacketClicked(payload) {
                            openWalletRedPacket({
                                wallet,
                                payload,
                            });
                        },
                    }), startIcon: Object(jsx_runtime["jsx"])(History_default.a, {}, void 0), variant: "text" }, { children: t('activity') }), void 0) }), void 0)) : null, addToken, walletShare, walletHistory, walletBackup, walletDelete, walletRename, walletRedPacket] }), void 0));
});

// EXTERNAL MODULE: ./packages/maskbook/src/web3/UI/EthereumStatusBar.tsx + 1 modules
var EthereumStatusBar = __webpack_require__(261);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardRouters/Wallets.tsx




















//#region theme
const walletsTheme = (theme) => Object(lodash["merge"])(Object(lodash["cloneDeep"])(theme), {
    overrides: {
        MuiIconButton: {
            root: {
                color: theme.palette.text,
            },
        },
        MuiListItemIcon: {
            root: {
                justifyContent: 'center',
                minWidth: 'unset',
                marginRight: theme.spacing(2),
            },
        },
        MuiListItemSecondaryAction: {
            root: {
                ...theme.typography.body1,
            },
        },
    },
});
//#endregion
const Wallets_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        display: 'flex',
        flexDirection: 'column',
        flex: '0 0 100%',
        height: '100%',
    },
    content: {
        width: '100%',
        overflow: 'auto',
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
    },
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    caption: {
        display: 'flex',
        alignItems: 'center',
    },
    title: {
        marginLeft: theme.spacing(1),
    },
}));
function DashboardWalletsRouter() {
    const classes = Wallets_useStyles();
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const history = Object(react_router["h" /* useHistory */])();
    const { create, error, rpid } = useQueryParams(['create', 'error', 'rpid']);
    const [walletCreate, openWalletCreate] = Object(Base["c" /* useModal */])(DashboardWalletCreateDialog);
    const [walletError, openWalletError] = Object(Base["c" /* useModal */])(DashboardWalletErrorDialog);
    const [addToken, , openAddToken] = Object(Base["c" /* useModal */])(DashboardWalletAddERC20TokenDialog);
    const [walletHistory, , openWalletHistory] = Object(Base["c" /* useModal */])(DashboardWalletHistoryDialog);
    const [walletRedPacketDetail, , openWalletRedPacketDetail] = Object(Base["c" /* useModal */])(DashboardWalletRedPacketDetailDialog);
    const selectedWallet = Object(useWallet["a" /* useWallet */])();
    const tokens = useTrustedERC20TokensFromDB();
    const detailedTokens = useAssetsDetailedCallback(tokens);
    // show create dialog
    Object(react["useEffect"])(() => {
        if (create)
            openWalletCreate();
    }, [create, openWalletCreate]);
    // show error dialog
    Object(react["useEffect"])(() => {
        if (error)
            openWalletError();
    }, [error, openWalletError]);
    //#region right icons from mobile devices
    const floatingButtons = [
        {
            icon: Object(jsx_runtime["jsx"])(Add_default.a, {}, void 0),
            handler: () => {
                if (selectedWallet)
                    openAddToken({ wallet: selectedWallet });
                else
                    openWalletCreate();
            },
        },
    ];
    if (flags["a" /* Flags */].has_native_nav_bar)
        floatingButtons.unshift({
            icon: Object(jsx_runtime["jsx"])(EthereumStatusBar["a" /* EthereumStatusBar */], {}, void 0),
            handler: () => undefined,
        });
    if (selectedWallet)
        floatingButtons.push({
            icon: Object(jsx_runtime["jsx"])(Restore_default.a, {}, void 0),
            handler: () => {
                if (!selectedWallet)
                    return;
                openWalletHistory({
                    wallet: selectedWallet,
                    onRedPacketClicked(payload) {
                        openWalletRedPacketDetail({
                            wallet: selectedWallet,
                            payload,
                        });
                    },
                });
            },
        });
    //#endregion
    return (Object(jsx_runtime["jsxs"])(DashboardRouterContainer, Object.assign({ empty: !selectedWallet, title: t('my_wallets'), actions: [
            Object(jsx_runtime["jsx"])(EthereumStatusBar["a" /* EthereumStatusBar */], { BoxProps: { justifyContent: 'flex-end' } }, void 0),
            Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "contained", onClick: openWalletCreate, endIcon: Object(jsx_runtime["jsx"])(AddCircle_default.a, {}, void 0), "data-testid": "create_button" }, { children: t('plugin_wallet_on_create') }), void 0),
        ], floatingButtons: floatingButtons }, { children: [Object(jsx_runtime["jsx"])(ThemeProvider["a" /* default */], Object.assign({ theme: walletsTheme }, { children: Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.root }, { children: Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.content }, { children: Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.wrapper }, { children: selectedWallet ? (Object(jsx_runtime["jsx"])(WalletContent_WalletContent, { wallet: selectedWallet, detailedTokens: detailedTokens }, void 0)) : null }), void 0) }), void 0) }), void 0) }), void 0), addToken, walletHistory, walletCreate, walletError, walletRedPacketDetail] }), void 0));
}

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Clear.js
var Clear = __webpack_require__(896);
var Clear_default = /*#__PURE__*/__webpack_require__.n(Clear);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Search.js
var Search = __webpack_require__(635);
var Search_default = /*#__PURE__*/__webpack_require__.n(Search);

// EXTERNAL MODULE: ./node_modules/react-virtualized-auto-sizer/dist/index.esm.js
var index_esm = __webpack_require__(895);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/components/Avatar.tsx
var components_Avatar = __webpack_require__(214);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/search.js
var icons_search = __webpack_require__(1679);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardDialogs/Contact.tsx










const Contact_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    avatar: {
        width: '64px',
        height: '64px',
    },
}));
function DashboardContactDeleteConfirmDialog(props) {
    var _a;
    const { contact, onDeleted } = props.ComponentProps;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    // TODO!: delete profile breaks database
    const onDelete = Object(Base["d" /* useSnackbarCallback */])(
    // ! directly destroy parent dialog is NG so close self first
    () => service["b" /* default */].Identity.removeProfile(contact.identifier).then(props.onClose), [contact], () => {
        props.onClose();
        onDeleted();
    });
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({ fullScreen: false }, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "small", icon: Object(jsx_runtime["jsx"])(user_minus["a" /* default */], {}, void 0), iconColor: "#F4637D", primary: t('delete_contact'), secondary: t('delete_contact_confirmation', { contact: (_a = contact.nickname) !== null && _a !== void 0 ? _a : contact.identifier.userId }), footer: Object(jsx_runtime["jsxs"])(SpacedButtonGroup, { children: [Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ variant: "contained", color: "danger", onClick: onDelete }, { children: t('ok') }), void 0),
                    Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "outlined", color: "inherit", onClick: props.onClose }, { children: t('cancel') }), void 0)] }, void 0) }, void 0) }), void 0));
}
function DashboardContactDialog(props) {
    var _a;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = Contact_useStyles();
    const { contact, onUpdated } = props.ComponentProps;
    const [nickname, setNickname] = Object(react["useState"])(contact.nickname);
    const [avatarURL, setAvatarURL] = Object(react["useState"])(contact.avatar);
    const onSubmit = Object(Base["d" /* useSnackbarCallback */])(() => service["b" /* default */].Identity.updateProfileInfo(contact.identifier, { nickname, avatarURL, forceUpdateAvatar: true }), [nickname, avatarURL], () => {
        props.onClose();
        onUpdated();
    });
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { icon: Object(jsx_runtime["jsx"])(components_Avatar["a" /* Avatar */], { className: classes.avatar, person: contact }, void 0), primary: contact.nickname || contact.identifier.userId, content: Object(jsx_runtime["jsxs"])("form", { children: [Object(jsx_runtime["jsx"])(TextField["a" /* default */], { label: t('internal_id'), value: contact.identifier.toText(), variant: "outlined", disabled: true }, void 0),
                    Object(jsx_runtime["jsx"])(TextField["a" /* default */], { label: t('nickname'), value: nickname, onChange: (e) => setNickname(e.target.value), variant: "outlined" }, void 0),
                    Object(jsx_runtime["jsx"])(TextField["a" /* default */], { label: t('new_avatar_url'), placeholder: t('new_avatar_url_placeholder'), value: avatarURL, onChange: (e) => setAvatarURL(e.target.value), variant: "outlined" }, void 0),
                    Object(jsx_runtime["jsx"])(TextField["a" /* default */], { label: t('fingerprint'), defaultValue: (_a = contact.linkedPersona) === null || _a === void 0 ? void 0 : _a.fingerprint, variant: "outlined", disabled: true }, void 0)] }, void 0), footer: Object(jsx_runtime["jsxs"])(SpacedButtonGroup, { children: [Object(jsx_runtime["jsx"])(ActionButton["b" /* DebounceButton */], Object.assign({ variant: "contained", onClick: onSubmit }, { children: t('save') }), void 0),
                    Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "outlined", color: "inherit", onClick: props.onClose }, { children: t('cancel') }), void 0)] }, void 0) }, void 0) }), void 0));
}
function DashboardContactSearchDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { onSearch } = props.ComponentProps;
    const [text, setText] = Object(react["useState"])('');
    const searchText = () => {
        if (!text)
            return;
        props.onClose();
        onSearch(text);
    };
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({ fullScreen: false }, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "small", icon: Object(jsx_runtime["jsx"])(icons_search["a" /* default */], {}, void 0), iconColor: "#5FDD97", primary: t('search_contact'), content: Object(jsx_runtime["jsx"])("form", { children: Object(jsx_runtime["jsx"])(TextField["a" /* default */], { autoFocus: true, required: true, label: t('keywords'), value: text, onChange: (e) => setText(e.target.value), onKeyDown: (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            searchText();
                        }
                    } }, void 0) }, void 0), footer: Object(jsx_runtime["jsx"])(SpacedButtonGroup, { children: Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ variant: "contained", disabled: !text, onClick: searchText }, { children: t('search') }), void 0) }, void 0) }, void 0) }), void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/ContactLine.tsx










const ContactLine_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    line: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: theme.spacing(2),
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    avatar: {
        width: '32px',
        height: '32px',
    },
    user: {
        color: theme.palette.text.primary,
        fontWeight: 500,
        margin: theme.spacing(0, 2),
        flex: '0 1 auto',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    provider: {
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(2),
        [theme.breakpoints.down('sm')]: {
            flex: 1,
        },
    },
    fingerprint: {
        color: theme.palette.text.secondary,
        marginLeft: 'auto',
        marginRight: 0,
        fontFamily: 'var(--monospace)',
    },
    more: {
        marginLeft: theme.spacing(1),
        color: theme.palette.text.primary,
    },
}));
function ContactLine(props) {
    var _a;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = ContactLine_useStyles();
    const { contact, onUpdated, onDeleted, ...rest } = props;
    const [contactDialog, openContactDialog] = Object(Base["c" /* useModal */])(DashboardContactDialog, { contact, onUpdated });
    const xsMatched = Object(useMatchXS["a" /* useMatchXS */])();
    const [deleteContactConfirmDialog, openDeleteContactConfirmDialog] = Object(Base["c" /* useModal */])(DashboardContactDeleteConfirmDialog, {
        contact,
        onDeleted,
    });
    const [menu, openMenu] = useMenu(Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ onClick: () => openDeleteContactConfirmDialog() }, { children: t('delete') }), void 0));
    return (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsxs"])(ListItem["a" /* default */], Object.assign({ button: true, selected: false, onClick: openContactDialog, className: classes.line }, rest, { children: [Object(jsx_runtime["jsx"])(components_Avatar["a" /* Avatar */], { className: classes.avatar, person: contact }, void 0),
                    Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.user }, { children: contact.nickname || contact.identifier.userId }), void 0),
                    Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ className: classes.provider }, { children: ["@", contact.identifier.network] }), void 0),
                    xsMatched ? null : (Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.fingerprint, component: "code" }, { children: (_a = contact.linkedPersona) === null || _a === void 0 ? void 0 : _a.fingerprint }), void 0)),
                    Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ className: classes.more, size: "small", onClick: (e) => {
                            e.stopPropagation();
                            openMenu(e);
                        } }, { children: Object(jsx_runtime["jsx"])(MoreHoriz_default.a, {}, void 0) }), void 0)] }), void 0), menu, contactDialog, deleteContactConfirmDialog] }, void 0));
}

// EXTERNAL MODULE: ./node_modules/react-window/dist/index.esm.js
var dist_index_esm = __webpack_require__(367);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardRouters/Contacts.tsx
















const Contacts_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    title: {
        margin: theme.spacing(3, 0),
        color: theme.palette.text.secondary,
        [theme.breakpoints.down('sm')]: {
            margin: theme.spacing(2, 0),
        },
    },
    progress: {
        width: '1.5em',
        height: '1.5em',
        marginRight: '0.75em',
    },
    list: {
        flex: 1,
        [theme.breakpoints.down('sm')]: {
            marginLeft: theme.spacing(-2),
            marginRight: theme.spacing(-2),
        },
    },
}));
const Contacts_fetcher = (search, offset) => service["b" /* default */].Identity.queryProfilePaged({
    // undefined will fetch the first page
    query: search ? search : void 0,
    after: offset === null || offset === void 0 ? void 0 : offset.identifier,
}, 20);
function DashboardContactsRouter() {
    var _a, _b;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = Contacts_useStyles();
    const [search, setSearch] = Object(react["useState"])('');
    const [searchUI, setSearchUI] = Object(react["useState"])('');
    const [startSearchTransition, isSearchPending] = Object(react["unstable_useTransition"])({});
    const [searchContactDialog, , openSearchContactDialog] = Object(Base["c" /* useModal */])(DashboardContactSearchDialog);
    const actions = Object(react["useMemo"])(() => [
        Object(jsx_runtime["jsx"])(TextField["a" /* default */], { placeholder: t('search'), variant: "outlined", size: "small", value: searchUI, onChange: (e) => {
                setSearchUI(e.target.value);
                startSearchTransition(() => setSearch(e.target.value));
            }, InputProps: {
                endAdornment: (Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ size: "small", onClick: () => setSearch('') }, { children: search ? Object(jsx_runtime["jsx"])(Clear_default.a, {}, void 0) : Object(jsx_runtime["jsx"])(Search_default.a, {}, void 0) }), void 0)),
            } }, void 0),
    ], [search, searchUI, startSearchTransition]);
    const swr = Object(esm["b" /* useSWRInfinite */])((_size, previousPageData) => [
        search || undefined,
        Object(lodash["last"])(previousPageData),
    ], Contacts_fetcher);
    const { data, size, setSize, mutate } = swr;
    const isEmpty = ((_a = data === null || data === void 0 ? void 0 : data[0]) === null || _a === void 0 ? void 0 : _a.length) === 0;
    const isReachingEnd = data && ((_b = data[data.length - 1]) === null || _b === void 0 ? void 0 : _b.length) < 20;
    const items = data ? [].concat(...data) : [];
    const [startPageTransition, isPagePending] = Object(react["unstable_useTransition"])({});
    const nextPage = Object(react["useCallback"])(() => startPageTransition(() => {
        setSize === null || setSize === void 0 ? void 0 : setSize(size ? size + 1 : 0);
    }), [size, setSize]);
    return (Object(jsx_runtime["jsxs"])(DashboardRouterContainer, Object.assign({ title: t('contacts'), empty: items.length === 0, actions: actions, floatingButtons: [
            {
                icon: Object(jsx_runtime["jsx"])(Search_default.a, {}, void 0),
                handler: () => openSearchContactDialog({ onSearch: setSearch }),
            },
        ] }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.title, variant: "body2" }, { children: t('people_in_database') }), void 0),
            Object(jsx_runtime["jsx"])("section", Object.assign({ className: classes.list }, { children: Object(jsx_runtime["jsx"])(index_esm["a" /* default */], { children: (sizeProps) => (Object(jsx_runtime["jsx"])(dist_index_esm["a" /* FixedSizeList */], Object.assign({ overscanCount: 5, onItemsRendered: (data) => {
                            if (isEmpty || isReachingEnd)
                                return;
                            if (isPagePending || isSearchPending)
                                return;
                            if (data.visibleStopIndex === data.overscanStopIndex)
                                nextPage();
                        }, itemSize: 64, itemCount: items.length }, sizeProps, { children: ({ index, style }) => items[index] ? (Object(jsx_runtime["jsx"])(ContactLine, { style: style, contact: items[index], onUpdated: mutate, onDeleted: mutate }, index)) : null }), void 0)) }, void 0) }), void 0), searchContactDialog] }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/settings/createSettings.tsx
var createSettings = __webpack_require__(108);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Switch/Switch.js
var Switch = __webpack_require__(1680);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListItemSecondaryAction/ListItemSecondaryAction.js
var ListItemSecondaryAction = __webpack_require__(1658);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ArrowForwardIos.js
var ArrowForwardIos = __webpack_require__(897);
var ArrowForwardIos_default = /*#__PURE__*/__webpack_require__.n(ArrowForwardIos);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/enum.ts
var utils_enum = __webpack_require__(216);

// CONCATENATED MODULE: ./packages/maskbook/src/components/shared-settings/useSettingsUI.tsx









const useSettingsUI_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    container: { listStyleType: 'none', width: '100%' },
    secondaryAction: { paddingLeft: theme.spacing(2) },
    listItemText: {
        fontWeight: 500,
    },
    listItemIcon: {
        marginLeft: 0,
    },
    listItemActionMobile: {
        maxWidth: '60%',
    },
    arrowIcon: {
        color: theme.palette.text.primary,
    },
}));
function withDefaultText(props) {
    var _a, _b, _c;
    const { value, primary, secondary } = props;
    const text = createSettings["d" /* texts */].get(value);
    return {
        value,
        primary: (_b = primary !== null && primary !== void 0 ? primary : (_a = text === null || text === void 0 ? void 0 : text.primary) === null || _a === void 0 ? void 0 : _a.call(text)) !== null && _b !== void 0 ? _b : '_unknown_setting_',
        secondary: secondary !== null && secondary !== void 0 ? secondary : (_c = text === null || text === void 0 ? void 0 : text.secondary) === null || _c === void 0 ? void 0 : _c.call(text),
    };
}
function SharedListItem(props) {
    const { onClick, icon, action, primary, secondary, button } = props;
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(useSettingsUI_useStyles(), props);
    return (Object(jsx_runtime["jsxs"])(ListItem["a" /* default */], Object.assign({ classes: {
            root: classes.listItemRoot,
            container: classes.container,
            secondaryAction: classes.secondaryAction,
        }, onClick: onClick }, (button ? { button: true } : { component: 'div' }), { children: [icon ? Object(jsx_runtime["jsx"])(ListItemIcon["a" /* default */], Object.assign({ classes: { root: classes.listItemIcon } }, { children: icon }), void 0) : null,
            Object(jsx_runtime["jsx"])(ListItemText["a" /* default */], { classes: { primary: classes.listItemText }, primary: primary, secondary: secondary }, void 0), action] }), void 0));
}
function SettingsUI(props) {
    const { value } = withDefaultText(props);
    const currentValue = Object(useValueRef["a" /* useValueRef */])(value);
    const [startTransition] = Object(react["unstable_useTransition"])();
    switch (typeof currentValue) {
        case 'boolean': {
            const ref = value;
            const change = () => startTransition(() => void (ref.value = !ref.value));
            const ui = Object(jsx_runtime["jsx"])(Switch["a" /* default */], { color: "primary", edge: "end", checked: currentValue, onClick: change }, void 0);
            const { primary, secondary } = withDefaultText(props);
            return (Object(jsx_runtime["jsx"])(SharedListItem, Object.assign({}, props, { button: true, primary: primary, secondary: secondary, onClick: change, action: Object(jsx_runtime["jsx"])(ListItemSecondaryAction["a" /* default */], { children: ui }, void 0) }), void 0));
        }
        case 'number':
        case 'string':
        default:
            return Object(jsx_runtime["jsx"])(SharedListItem, Object.assign({}, props, { primary: 'Unknown settings type ' + typeof currentValue }), void 0);
    }
}
function SettingsUIDummy(props) {
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(useSettingsUI_useStyles(), props);
    return (Object(jsx_runtime["jsx"])(SharedListItem, Object.assign({}, props, { button: true, action: Object(jsx_runtime["jsx"])(ListItemSecondaryAction["a" /* default */], Object.assign({ onClick: props.onClick }, { children: Object(jsx_runtime["jsx"])(ArrowForwardIos_default.a, { classes: { root: classes.arrowIcon } }, void 0) }), void 0) }), void 0));
}
function SettingsUIEnum(props) {
    const { primary, secondary } = withDefaultText(props);
    const xsMatched = Object(useMatchXS["a" /* useMatchXS */])();
    const classes = useSettingsUI_useStyles();
    const { value, enumObject, getText, SelectProps } = props;
    const [startTransition] = Object(react["unstable_useTransition"])();
    const ui = useEnumSettings(startTransition, value, enumObject, getText, SelectProps);
    return (Object(jsx_runtime["jsx"])(SharedListItem, Object.assign({}, props, { primary: primary, secondary: secondary, action: xsMatched ? (Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.listItemActionMobile }, { children: ui }), void 0)) : (Object(jsx_runtime["jsx"])(ListItemSecondaryAction["a" /* default */], { children: ui }, void 0)) }), void 0));
}
/**
 * Convert a ValueRef<Enum> into a Select element.
 * @param ref - The value ref
 * @param enumObject - The enum object
 * @param getText - Convert enum value into string.
 *
 * ? because the limit on the type system, I can't type it as an object which key is enum and value is string
 */
function useEnumSettings(startTransition, ...[ref, enumObject, getText, selectProps]) {
    const enum_ = Object(utils_enum["a" /* getEnumAsArray */])(enumObject);
    const change = (value) => {
        startTransition(() => {
            if (!Number.isNaN(parseInt(value))) {
                value = parseInt(value);
            }
            if (!enum_.some((x) => x.value === value)) {
                throw new Error('Invalid state');
            }
            ref.value = value;
        });
    };
    return (Object(jsx_runtime["jsx"])(Select["a" /* default */], Object.assign({ fullWidth: true, variant: "outlined" }, selectProps, { value: Object(useValueRef["a" /* useValueRef */])(ref), onChange: (event) => change(event.target.value) }, { children: enum_.map(({ key, value }) => {
            var _a;
            return (Object(jsx_runtime["jsx"])(MenuItem["a" /* default */], Object.assign({ value: String(value) }, { children: (_a = getText === null || getText === void 0 ? void 0 : getText(value)) !== null && _a !== void 0 ? _a : String(key) }), String(key)));
        }) }), void 0));
}

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/TrendingUp.js
var TrendingUp = __webpack_require__(903);
var TrendingUp_default = /*#__PURE__*/__webpack_require__.n(TrendingUp);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/MemoryOutlined.js
var MemoryOutlined = __webpack_require__(906);
var MemoryOutlined_default = /*#__PURE__*/__webpack_require__.n(MemoryOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ArchiveOutlined.js
var ArchiveOutlined = __webpack_require__(910);
var ArchiveOutlined_default = /*#__PURE__*/__webpack_require__.n(ArchiveOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/UnarchiveOutlined.js
var UnarchiveOutlined = __webpack_require__(909);
var UnarchiveOutlined_default = /*#__PURE__*/__webpack_require__.n(UnarchiveOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ShareOutlined.js
var ShareOutlined = __webpack_require__(908);
var ShareOutlined_default = /*#__PURE__*/__webpack_require__.n(ShareOutlined);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/FlipToFront.js
var FlipToFront = __webpack_require__(907);
var FlipToFront_default = /*#__PURE__*/__webpack_require__.n(FlipToFront);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Tab.js
var icons_Tab = __webpack_require__(905);
var Tab_default = /*#__PURE__*/__webpack_require__.n(icons_Tab);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Palette.js
var Palette = __webpack_require__(901);
var Palette_default = /*#__PURE__*/__webpack_require__.n(Palette);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Language.js
var Language = __webpack_require__(900);
var Language_default = /*#__PURE__*/__webpack_require__.n(Language);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Wifi.js
var Wifi = __webpack_require__(902);
var Wifi_default = /*#__PURE__*/__webpack_require__.n(Wifi);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Launch.js
var Launch = __webpack_require__(904);
var Launch_default = /*#__PURE__*/__webpack_require__.n(Launch);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/InputBase/InputBase.js + 1 modules
var InputBase = __webpack_require__(930);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/database.js
var database = __webpack_require__(1681);

// EXTERNAL MODULE: ./node_modules/uuid/dist/esm-browser/v4.js + 4 modules
var v4 = __webpack_require__(1570);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/CheckCircleOutline.js
var CheckCircleOutline = __webpack_require__(898);
var CheckCircleOutline_default = /*#__PURE__*/__webpack_require__.n(CheckCircleOutline);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/RadioButtonUnchecked.js
var RadioButtonUnchecked = __webpack_require__(899);
var RadioButtonUnchecked_default = /*#__PURE__*/__webpack_require__.n(RadioButtonUnchecked);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/DatabasePreviewCard.tsx








const useDatabasePreviewCardStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    table: {
        borderCollapse: 'unset',
    },
    cell: {
        border: 'none',
        padding: '9px 0 !important',
    },
    label: {
        verticalAlign: 'middle',
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1.75,
    },
    icon: {
        color: theme.palette.divider,
        width: 20,
        height: 20,
        verticalAlign: 'middle',
        marginLeft: 18,
    },
    iconChecked: {
        color: theme.palette.success.main,
    },
}));
var DatabaseRecordType;
(function (DatabaseRecordType) {
    DatabaseRecordType[DatabaseRecordType["Persona"] = 0] = "Persona";
    DatabaseRecordType[DatabaseRecordType["Profile"] = 1] = "Profile";
    DatabaseRecordType[DatabaseRecordType["Post"] = 2] = "Post";
    DatabaseRecordType[DatabaseRecordType["Group"] = 3] = "Group";
    DatabaseRecordType[DatabaseRecordType["Wallet"] = 4] = "Wallet";
})(DatabaseRecordType || (DatabaseRecordType = {}));
function DatabasePreviewCard(props) {
    const { dense = false, records } = props;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(useDatabasePreviewCardStyles(), props);
    const resolveRecordName = (type) => {
        switch (type) {
            case DatabaseRecordType.Persona:
                return t('personas');
            case DatabaseRecordType.Profile:
                return t('profiles');
            case DatabaseRecordType.Post:
                return t('posts');
            case DatabaseRecordType.Group:
                return t('groups');
            case DatabaseRecordType.Wallet:
                return t('wallets');
            default:
                return Object(utils["u" /* unreachable */])(type);
        }
    };
    const resolvedRecords = records.map((record) => ({
        ...record,
        name: resolveRecordName(record.type),
    }));
    return (Object(jsx_runtime["jsx"])(Table["a" /* default */], Object.assign({ className: classes.table, size: "small" }, { children: Object(jsx_runtime["jsx"])(TableBody["a" /* default */], { children: resolvedRecords.map((record) => (Object(jsx_runtime["jsxs"])(TableRow["a" /* default */], { children: [Object(jsx_runtime["jsx"])(TableCell["a" /* default */], Object.assign({ className: classes.cell, component: "th", align: "left" }, { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.label, variant: "body2", component: "span" }, { children: record.name }), void 0) }), void 0),
                    Object(jsx_runtime["jsxs"])(TableCell["a" /* default */], Object.assign({ className: classes.cell, align: "right" }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.label, variant: "body2", component: "span" }, { children: record.length }), void 0),
                            !dense ? (record.checked ? (Object(jsx_runtime["jsx"])(CheckCircleOutline_default.a, { className: classnames_default()(classes.icon, classes.iconChecked) }, void 0)) : (Object(jsx_runtime["jsx"])(RadioButtonUnchecked_default.a, { className: classes.icon }, void 0))) : null] }), void 0)] }, record.name))) }, void 0) }), void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/RestoreFromBackupBox.tsx







const RestoreFromBackupBox_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        border: `solid 1px ${theme.palette.divider}`,
        height: 176,
        borderRadius: 4,
    },
    file: {
        display: 'none',
    },
}));
function RestoreFromBackupBox(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(RestoreFromBackupBox_useStyles(), props);
    const inputRef = Object(react["useRef"])(null);
    const [file, setFile] = Object(react["useState"])(props.file);
    const [bound, { over }] = Object(useDropArea["a" /* default */])({
        onFiles(files) {
            setFile(files[0]);
        },
    });
    // invoke callback
    Object(react["useEffect"])(() => {
        if (file) {
            const fr = new FileReader();
            fr.readAsText(file);
            fr.addEventListener('loadend', () => { var _a; return (_a = props.onChange) === null || _a === void 0 ? void 0 : _a.call(props, file, fr.result); });
        }
    }, [file, props.onChange]);
    return (Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.root }, bound, { children: [Object(jsx_runtime["jsx"])("input", { className: classes.file, type: "file", accept: "application/json", ref: inputRef, onChange: ({ currentTarget }) => {
                    if (currentTarget.files)
                        setFile(currentTarget.files.item(0));
                }, "data-testid": "file_input" }, void 0),
            Object(jsx_runtime["jsx"])(RestoreBox, { file: file, entered: over, enterText: t('restore_database_dragging'), leaveText: t('restore_database_dragged'), placeholder: "restore-file-placeholder", "data-active": over, onClick: () => inputRef.current && inputRef.current.click() }, void 0)] }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/BackupFormat/JSON/latest.ts + 3 modules
var latest = __webpack_require__(250);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/permissions.ts
async function extraPermissions(origins) {
    if (!origins)
        return [];
    const currentOrigins = (await browser.permissions.getAll()).origins || [];
    const extra = origins.filter((i) => !(currentOrigins === null || currentOrigins === void 0 ? void 0 : currentOrigins.includes(i)));
    return extra.length ? extra : [];
}

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/colors/green.js
var green = __webpack_require__(296);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardDialogs/Backup.tsx




















const useDatabaseStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        width: '100%',
    },
    dashboardPreviewCardTable: {
        paddingLeft: 28,
        paddingRight: 28,
        marginTop: 2,
        marginBottom: 28,
    },
}));
//#region dashboard backup dialog
function DashboardBackupDialog(props) {
    var _a, _b, _c, _d, _e;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = useDatabaseStyles();
    const { enqueueSnackbar, closeSnackbar } = Object(notistack_esm["b" /* useSnackbar */])();
    const { value, loading } = Object(useAsync["a" /* default */])(() => service["b" /* default */].Welcome.generateBackupJSON());
    const records = [
        { type: DatabaseRecordType.Persona, length: (_a = value === null || value === void 0 ? void 0 : value.personas.length) !== null && _a !== void 0 ? _a : 0, checked: false },
        { type: DatabaseRecordType.Profile, length: (_b = value === null || value === void 0 ? void 0 : value.profiles.length) !== null && _b !== void 0 ? _b : 0, checked: false },
        { type: DatabaseRecordType.Post, length: (_c = value === null || value === void 0 ? void 0 : value.posts.length) !== null && _c !== void 0 ? _c : 0, checked: false },
        { type: DatabaseRecordType.Group, length: (_d = value === null || value === void 0 ? void 0 : value.userGroups.length) !== null && _d !== void 0 ? _d : 0, checked: false },
        { type: DatabaseRecordType.Wallet, length: (_e = value === null || value === void 0 ? void 0 : value.wallets.length) !== null && _e !== void 0 ? _e : 0, checked: false },
    ];
    const onConfirm = async () => {
        try {
            await service["b" /* default */].Welcome.createBackupFile({ download: true, onlyBackupWhoAmI: false });
            props.onClose();
        }
        catch (e) {
            enqueueSnackbar(t('set_up_backup_fail'), {
                variant: 'error',
            });
        }
    };
    return (Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "medium", icon: Object(jsx_runtime["jsx"])(database["a" /* default */], {}, void 0), iconColor: "#699CF7", primary: t('backup_database'), secondary: t('dashboard_backup_database_hint'), footer: Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ className: classes.root, display: "flex", flexDirection: "column", alignItems: "center" }, { children: [Object(jsx_runtime["jsx"])(DatabasePreviewCard, { classes: { table: classes.dashboardPreviewCardTable }, dense: true, records: records }, void 0),
                    Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ loading: loading, disabled: loading || records.every((r) => !r.length), variant: "contained", onClick: onConfirm }, { children: t('dashboard_backup_database_confirmation') }), void 0)] }), void 0) }, void 0) }), void 0));
}
//#endregion
//#region select backup
const useSelectBackupStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        marginTop: theme.spacing(-3),
    },
    input: {
        width: '100%',
        boxSizing: 'border-box',
        border: `solid 1px ${theme.palette.divider}`,
        borderRadius: 4,
        height: 176,
        padding: theme.spacing(2, 3),
        '& > textarea': {
            overflow: 'auto !important',
            height: '100% !important',
        },
    },
    button: {
        marginTop: theme.spacing(3),
    },
}));
function SelectBackup({ onConfirm }) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = useDatabaseStyles();
    const selectBackupClasses = useSelectBackupStyles();
    const { enqueueSnackbar, closeSnackbar } = Object(notistack_esm["b" /* useSnackbar */])();
    const [file, setFile] = Object(react["useState"])(null);
    const [json, setJSON] = Object(react["useState"])(null);
    const [backupValue, setBackupValue] = Object(react["useState"])('');
    const [textValue, setTextValue] = Object(react["useState"])('');
    const state = Object(react["useState"])(0);
    const tabProps = {
        tabs: [
            {
                id: 'file',
                label: t('restore_database_file'),
                children: (Object(jsx_runtime["jsx"])(RestoreFromBackupBox, { file: file, onChange: (file, content) => {
                        setFile(file);
                        setBackupValue(content);
                    } }, void 0)),
                p: 0,
            },
            {
                id: 'text',
                label: t('restore_database_text'),
                children: (Object(jsx_runtime["jsx"])(InputBase["a" /* default */], { className: selectBackupClasses.input, placeholder: t('dashboard_paste_database_backup_hint'), inputRef: (input) => input && input.focus(), multiline: true, value: textValue, onChange: (e) => setTextValue(e.target.value), inputProps: {
                        'data-testid': 'upload_textarea',
                    } }, void 0)),
                p: 0,
            },
        ],
        state,
        height: 176,
    };
    const permissionState = Object(useAsync["a" /* default */])(async () => {
        const json = Object(latest["a" /* UpgradeBackupJSONFile */])(Object(BackupFileShortRepresentation["b" /* decompressBackupFile */])(state[0] === 0 ? backupValue : textValue));
        setJSON(json);
        if (!json)
            throw new Error('UpgradeBackupJSONFile failed');
        return extraPermissions(json.grantedHostPermissions);
    }, [state[0], backupValue, textValue]);
    const restoreDB = async () => {
        var _a;
        try {
            if (!json)
                return;
            const permissions = (_a = permissionState.value) !== null && _a !== void 0 ? _a : [];
            if (permissions.length) {
                const granted = await browser.permissions.request({ origins: permissions !== null && permissions !== void 0 ? permissions : [] });
                if (!granted)
                    return;
            }
            const restoreId = Object(v4["a" /* default */])();
            await service["b" /* default */].Welcome.setUnconfirmedBackup(restoreId, json);
            onConfirm === null || onConfirm === void 0 ? void 0 : onConfirm(restoreId, json);
        }
        catch (e) {
            enqueueSnackbar(t('set_up_restore_fail'), { variant: 'error' });
        }
    };
    return (Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "medium", icon: Object(jsx_runtime["jsx"])(database["a" /* default */], {}, void 0), iconColor: "#699CF7", primary: t('set_up_restore'), secondary: t('set_up_restore_hint'), footer: Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ className: classnames_default()(classes.root, selectBackupClasses.root), display: "flex", flexDirection: "column", alignItems: "center" }, { children: [Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ display: "flex", flexDirection: "column", style: { width: '100%' } }, { children: Object(jsx_runtime["jsx"])(AbstractTab["a" /* default */], Object.assign({}, tabProps), void 0) }), void 0),
                Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: selectBackupClasses.button, variant: "contained", disabled: (!(state[0] === 0 && backupValue) && !(state[0] === 1 && textValue)) ||
                        !json ||
                        permissionState.loading ||
                        !!permissionState.error, onClick: restoreDB, "data-testid": "restore_button" }, { children: t('set_up_button_restore') }), void 0)] }), void 0) }, void 0));
}
//#endregion
//#region confirm backup
const useConfirmBackupStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    dashboardPreviewCardTable: {
        // keep dialogs vertical align when switching between them
        marginTop: (props) => (props.imported ? 2 : 26),
    },
    doneButton: {
        color: '#fff',
        backgroundColor: green["a" /* default */][500],
        '&:hover': {
            backgroundColor: green["a" /* default */][700],
        },
    },
}));
function ConfirmBackup({ restoreId, date, backup, onDone }) {
    var _a, _b, _c, _d, _e;
    const [imported, setImported] = Object(react["useState"])(false);
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = useDatabaseStyles();
    const confirmBackupClasses = useConfirmBackupStyles({
        imported: imported === true,
    });
    const { enqueueSnackbar, closeSnackbar } = Object(notistack_esm["b" /* useSnackbar */])();
    const time = new Date(date ? Number(date) : 0);
    const records = [
        { type: DatabaseRecordType.Persona, length: (_a = backup === null || backup === void 0 ? void 0 : backup.personas.length) !== null && _a !== void 0 ? _a : 0, checked: imported === true },
        { type: DatabaseRecordType.Profile, length: (_b = backup === null || backup === void 0 ? void 0 : backup.profiles.length) !== null && _b !== void 0 ? _b : 0, checked: imported === true },
        { type: DatabaseRecordType.Post, length: (_c = backup === null || backup === void 0 ? void 0 : backup.posts.length) !== null && _c !== void 0 ? _c : 0, checked: imported === true },
        { type: DatabaseRecordType.Group, length: (_d = backup === null || backup === void 0 ? void 0 : backup.userGroups.length) !== null && _d !== void 0 ? _d : 0, checked: imported === true },
        { type: DatabaseRecordType.Wallet, length: (_e = backup === null || backup === void 0 ? void 0 : backup.wallets.length) !== null && _e !== void 0 ? _e : 0, checked: imported === true },
    ];
    const onConfirm = async () => {
        const failToRestore = () => enqueueSnackbar(t('set_up_restore_fail'), { variant: 'error' });
        if (restoreId) {
            try {
                setImported('loading');
                await service["b" /* default */].Welcome.confirmBackup(restoreId);
                setImported(true);
            }
            catch (e) {
                failToRestore();
                setImported(false);
            }
        }
        else {
            failToRestore();
        }
    };
    return (Object(jsx_runtime["jsx"])(Base["b" /* DashboardDialogWrapper */], { size: "medium", icon: Object(jsx_runtime["jsx"])(database["a" /* default */], {}, void 0), iconColor: "#699CF7", primary: t('restore_database'), secondary: imported === true
            ? time.getTime() === 0
                ? t('unknown_time')
                : t('dashboard_restoration_successful_hint', {
                    time: time.toLocaleString(),
                })
            : t('set_up_restore_confirmation_hint'), footer: Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ className: classes.root, display: "flex", flexDirection: "column", alignItems: "center" }, { children: [Object(jsx_runtime["jsx"])(DatabasePreviewCard, { classes: {
                        table: classnames_default()(classes.dashboardPreviewCardTable, confirmBackupClasses.dashboardPreviewCardTable),
                    }, records: records }, void 0),
                imported === true ? (Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: confirmBackupClasses.doneButton, variant: "contained", onClick: onDone }, { children: t('set_up_button_done') }), void 0)) : (Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ variant: "contained", loading: imported === 'loading', disabled: imported === 'loading', onClick: onConfirm }, { children: t('set_up_button_confirm') }), void 0))] }), void 0) }, void 0));
}
//#endregion
//#region dashboard restore dialog
const backupTheme = (theme) => Object(lodash["merge"])(Object(lodash["cloneDeep"])(theme), {
    overrides: {
        MuiButton: {
            root: {
                '&[hidden]': {
                    visibility: 'hidden',
                },
            },
        },
    },
});
var RestoreStep;
(function (RestoreStep) {
    RestoreStep["SelectBackup"] = "select-backup";
    RestoreStep["ConfirmBackup"] = "confirm-backup";
})(RestoreStep || (RestoreStep = {}));
function DashboardRestoreDialog(props) {
    const [step, setStep] = Object(react["useState"])(RestoreStep.SelectBackup);
    const [backup, setBackup] = Object(react["useState"])(null);
    const [restoreId, setRestoreId] = Object(react["useState"])('');
    function getCurrentStep(step) {
        var _a;
        switch (step) {
            case RestoreStep.SelectBackup:
                return (Object(jsx_runtime["jsx"])(SelectBackup, { onConfirm: (restoreId, backup) => {
                        setBackup(backup);
                        setRestoreId(restoreId);
                        setStep(RestoreStep.ConfirmBackup);
                    } }, void 0));
            case RestoreStep.ConfirmBackup:
                return (Object(jsx_runtime["jsx"])(ConfirmBackup, { backup: backup, restoreId: restoreId, date: (_a = backup === null || backup === void 0 ? void 0 : backup._meta_.createdAt) !== null && _a !== void 0 ? _a : 0, onDone: props.onClose }, void 0));
            default:
                return null;
        }
    }
    return (Object(jsx_runtime["jsx"])(ThemeProvider["a" /* default */], Object.assign({ theme: backupTheme }, { children: Object(jsx_runtime["jsx"])(Base["a" /* DashboardDialogCore */], Object.assign({}, props, { children: getCurrentStep(step) }), void 0) }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/settings.ts
var Trader_settings = __webpack_require__(197);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/pipes.ts
var pipes = __webpack_require__(100);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/types/index.ts + 2 modules
var Trader_types = __webpack_require__(23);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardRouters/Settings.tsx




























const Settings_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: theme.palette.background.paper,
    },
    title: {
        fontWeight: 'normal',
        lineHeight: '30px',
        marginBottom: theme.spacing(1.5),
        [theme.breakpoints.down('sm')]: {
            marginBottom: 0,
        },
    },
    section: {
        padding: '26px 40px',
        margin: theme.spacing(3, 0),
        [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(2),
        },
    },
    secondaryAction: {
        paddingRight: 90,
    },
    list: {
        [theme.breakpoints.down('sm')]: {
            marginLeft: theme.spacing(-2),
            marginRight: theme.spacing(-2),
        },
    },
    listItemRoot: {
        paddingTop: theme.spacing(1.5),
        paddingBottom: theme.spacing(1.5),
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    listItemIcon: {
        color: theme.palette.text.primary,
        justifyContent: 'flex-start',
        minWidth: 'unset',
        marginLeft: 0,
        marginRight: theme.spacing(3),
        [theme.breakpoints.down('sm')]: {
            display: 'none',
        },
    },
}));
const settingsTheme = (theme) => Object(lodash["merge"])(Object(lodash["cloneDeep"])(theme), {
    wrapper: {
        padding: theme.spacing(0, 3),
    },
    typography: {
        body1: {
            lineHeight: 1.75,
        },
    },
    overrides: {
        MuiPaper: {
            rounded: {
                borderRadius: 12,
            },
        },
        MuiCard: {
            root: {
                overflow: 'visible',
            },
        },
        MuiOutlinedInput: {
            input: {
                paddingTop: theme.spacing(1),
                paddingBottom: theme.spacing(1),
            },
        },
    },
});
function DashboardSettingsRouter() {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const isMobile = Object(useMatchXS["a" /* useMatchXS */])();
    const langMapper = Object(react["useRef"])((x) => {
        if (x === settings["b" /* Language */].en)
            return t('language_en');
        if (x === settings["b" /* Language */].zh)
            return t('language_zh');
        if (x === settings["b" /* Language */].ja)
            return t('language_ja');
        return x;
    }).current;
    const appearanceMapper = Object(react["useRef"])((x) => {
        if (x === settings["a" /* Appearance */].dark)
            return t('settings_appearance_dark');
        if (x === settings["a" /* Appearance */].light)
            return t('settings_appearance_light');
        return t('settings_appearance_default');
    }).current;
    const launchPageMapper = Object(react["useRef"])((x) => {
        if (x === settings["c" /* LaunchPage */].facebook)
            return 'Facebook';
        if (x === settings["c" /* LaunchPage */].twitter)
            return 'Twitter';
        return t('dashboard');
    }).current;
    const classes = Settings_useStyles();
    const theme = Object(useTheme["a" /* default */])();
    const elevation = theme.palette.type === 'dark' ? 1 : 0;
    const [backupDialog, openBackupDialog] = Object(Base["c" /* useModal */])(DashboardBackupDialog);
    const [restoreDialog, openRestoreDialog] = Object(Base["c" /* useModal */])(DashboardRestoreDialog);
    const listStyle = {
        secondaryAction: classes.secondaryAction,
        listItemRoot: classes.listItemRoot,
        listItemIcon: classes.listItemIcon,
    };
    return (Object(jsx_runtime["jsx"])(DashboardRouterContainer, Object.assign({ title: t('settings') }, { children: Object(jsx_runtime["jsx"])(ThemeProvider["a" /* default */], Object.assign({ theme: settingsTheme }, { children: Object(jsx_runtime["jsxs"])("div", Object.assign({ className: "wrapper" }, { children: [Object(jsx_runtime["jsxs"])(Paper["a" /* default */], Object.assign({ component: "section", className: classes.section, elevation: elevation }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.title, variant: "h6", color: "textPrimary" }, { children: t('settings_title_general') }), void 0),
                            Object(jsx_runtime["jsx"])(Card["a" /* default */], Object.assign({ elevation: 0 }, { children: Object(jsx_runtime["jsxs"])(List["a" /* default */], Object.assign({ className: classes.list, disablePadding: true }, { children: [Object(jsx_runtime["jsx"])(SettingsUIEnum, { classes: listStyle, enumObject: settings["b" /* Language */], getText: langMapper, icon: Object(jsx_runtime["jsx"])(Language_default.a, {}, void 0), value: settings["q" /* languageSettings */] }, void 0),
                                        Object(jsx_runtime["jsx"])(SettingsUIEnum, { classes: listStyle, enumObject: settings["a" /* Appearance */], getText: appearanceMapper, icon: Object(jsx_runtime["jsx"])(Palette_default.a, {}, void 0), value: settings["e" /* appearanceSettings */] }, void 0),
                                        flags["a" /* Flags */].support_eth_network_switch ? (Object(jsx_runtime["jsx"])(SettingsUIEnum, { classes: listStyle, enumObject: types["a" /* ChainId */], icon: Object(jsx_runtime["jsx"])(Wifi_default.a, {}, void 0), value: settings["i" /* currentMaskbookChainIdSettings */] }, void 0)) : null,
                                        Object(jsx_runtime["jsx"])(SettingsUIEnum, { classes: listStyle, enumObject: Trader_types["a" /* DataProvider */], getText: pipes["b" /* resolveDataProviderName */], icon: Object(jsx_runtime["jsx"])(TrendingUp_default.a, {}, void 0), value: Trader_settings["a" /* currentDataProviderSettings */] }, void 0),
                                        isMobile ? (Object(jsx_runtime["jsx"])(SettingsUIEnum, { classes: listStyle, enumObject: settings["c" /* LaunchPage */], getText: launchPageMapper, icon: Object(jsx_runtime["jsx"])(Launch_default.a, {}, void 0), value: settings["r" /* launchPageSettings */] }, void 0)) : null] }), void 0) }), void 0)] }), void 0),
                    Object(jsx_runtime["jsxs"])(Paper["a" /* default */], Object.assign({ component: "section", className: classes.section, elevation: elevation }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.title, variant: "h6", color: "textPrimary" }, { children: t('settings_title_advanced_options') }), void 0),
                            Object(jsx_runtime["jsx"])(Card["a" /* default */], Object.assign({ elevation: 0 }, { children: Object(jsx_runtime["jsxs"])(List["a" /* default */], Object.assign({ className: classes.list, disablePadding: true }, { children: [Object(jsx_runtime["jsx"])(SettingsUI, { classes: listStyle, icon: Object(jsx_runtime["jsx"])(Tab_default.a, {}, void 0), value: settings["o" /* disableOpenNewTabInBackgroundSettings */] }, void 0),
                                        Object(jsx_runtime["jsx"])(SettingsUI, { classes: listStyle, icon: Object(jsx_runtime["jsx"])(MemoryOutlined_default.a, {}, void 0), value: settings["n" /* debugModeSetting */] }, void 0),
                                        Object(jsx_runtime["jsx"])(SettingsUI, { classes: listStyle, icon: Object(jsx_runtime["jsx"])(FlipToFront_default.a, {}, void 0), value: settings["d" /* allPostReplacementSettings */] }, void 0),
                                        Object(jsx_runtime["jsx"])(SettingsUI, { classes: listStyle, icon: Object(jsx_runtime["jsx"])(ShareOutlined_default.a, {}, void 0), value: settings["p" /* enableGroupSharingSettings */] }, void 0)] }), void 0) }), void 0)] }), void 0),
                    Object(jsx_runtime["jsxs"])(Paper["a" /* default */], Object.assign({ component: "section", className: classes.section, elevation: elevation }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.title, variant: "h6", color: "textPrimary" }, { children: t('settings_title_database_management') }), void 0),
                            Object(jsx_runtime["jsx"])(Card["a" /* default */], Object.assign({ elevation: 0 }, { children: Object(jsx_runtime["jsxs"])(List["a" /* default */], Object.assign({ className: classes.list, disablePadding: true }, { children: [Object(jsx_runtime["jsx"])(SettingsUIDummy, { classes: listStyle, icon: Object(jsx_runtime["jsx"])(UnarchiveOutlined_default.a, {}, void 0), primary: t('backup_database'), secondary: t('dashboard_backup_database_hint'), onClick: openBackupDialog }, void 0),
                                        Object(jsx_runtime["jsx"])(SettingsUIDummy, { classes: listStyle, icon: Object(jsx_runtime["jsx"])(ArchiveOutlined_default.a, {}, void 0), primary: t('restore_database'), secondary: t('dashboard_import_database_hint'), onClick: openRestoreDialog }, void 0)] }), void 0) }), void 0), backupDialog, restoreDialog] }), void 0)] }), void 0) }), void 0) }), void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardRouters/Setup.tsx

































//#region setup form
const useSetupFormStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    wrapper: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    primary: {
        textAlign: 'center',
        fontWeight: 500,
        fontSize: 39,
        lineHeight: 1,
        marginBottom: theme.spacing(2),
        [theme.breakpoints.down('sm')]: {
            fontSize: 18,
            margin: theme.spacing(3, 0, 1),
        },
    },
    secondary: {
        textAlign: 'center',
        fontSize: 20,
        lineHeight: 1.5,
        marginBottom: theme.spacing(5),
        [theme.breakpoints.down('sm')]: {
            fontSize: 14,
            marginBottom: theme.spacing(2),
        },
    },
    form: {
        width: 368,
        minHeight: 200,
        [theme.breakpoints.down('sm')]: {
            width: '100%',
        },
    },
    input: {
        width: '100%',
    },
    or: {
        marginTop: 28,
        marginBottom: 10,
        [theme.breakpoints.down('sm')]: {
            margin: 0,
        },
    },
    button: {
        width: 220,
        height: 40,
        marginBottom: 20,
    },
    restoreButton: {
        marginTop: 44,
    },
    importButton: {
        marginTop: 44,
    },
    doneButton: {
        color: '#fff',
        backgroundColor: green["a" /* default */][500],
        // extra 36 pixel eliminates the visual shaking when switch between pages
        marginBottom: 20 + 36,
        '&:hover': {
            backgroundColor: green["a" /* default */][700],
        },
    },
}));
function SetupForm(props) {
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(useSetupFormStyles(), props);
    return (Object(jsx_runtime["jsx"])(Fade["a" /* default */], Object.assign({ in: true }, { children: Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.wrapper }, { children: [Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.section }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.primary, variant: "h5", color: "textPrimary" }, { children: props.primary }), void 0),
                        props.secondary ? (Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.secondary, variant: "body1", color: "textPrimary" }, { children: props.secondary }), void 0)) : null] }), void 0),
                Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.section }, { children: Object(jsx_runtime["jsx"])("form", Object.assign({ className: classes.form }, { children: props.content }), void 0) }), void 0),
                Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.section }, { children: props.actions }), void 0)] }), void 0) }), void 0));
}
//#endregion
//#region consent data collection
const useConsentDataCollectionStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    form: {
        color: theme.palette.text.primary,
        fontSize: 16,
        lineHeight: 1.75,
        width: 660,
        minHeight: 256,
        marginTop: 78,
    },
    label: {
        color: theme.palette.text.primary,
        marginBottom: 32,
    },
    button: {
        minWidth: 220,
    },
}));
function ConsentDataCollection() {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const setupFormClasses = useSetupFormStyles();
    const consentDataCollection = useConsentDataCollectionStyles();
    const [checked, setChecked] = Object(react["useState"])(false);
    return (Object(jsx_runtime["jsx"])(SetupForm, { classes: {
            form: consentDataCollection.form,
        }, primary: t('set_up_consent_data_collection'), content: t('set_up_consent_data_collection_hint'), actions: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(FormControlLabel["a" /* default */], { className: consentDataCollection.label, control: Object(jsx_runtime["jsx"])(Checkbox["a" /* default */], { color: "primary", checked: checked, onChange: (ev) => setChecked(ev.target.checked) }, void 0), label: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [t('set_up_consent_data_collection_privacy_policy_1'), Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ href: "https://mask.io/privacy-policy/", target: "_blank", rel: "noopener noreferrer" }, { children: t('set_up_consent_data_collection_privacy_policy_2') }), void 0), t('set_up_consent_data_collection_privacy_policy_3')] }, void 0) }, void 0),
                Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: consentDataCollection.button, variant: "contained", component: react_router_dom["b" /* Link */], disabled: !checked, to: SetupStep["a" /* SetupStep */].CreatePersona }, { children: t('set_up_button_get_started') }), void 0)] }, void 0) }, void 0));
}
//#endregion
//#region create persona
const userCreatePersonaStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    form: {
        minHeight: 130,
    },
}));
function CreatePersona() {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const setupFormClasses = useSetupFormStyles();
    const createPersonaClasses = userCreatePersonaStyles();
    const [name, setName] = Object(react["useState"])('');
    const history = Object(react_router["h" /* useHistory */])();
    const createPersonaAndNext = async () => {
        const persona = await service["b" /* default */].Identity.createPersonaByMnemonic(name, '');
        history.push(`${SetupStep["a" /* SetupStep */].ConnectNetwork}?identifier=${encodeURIComponent(persona.toText())}`);
    };
    return (Object(jsx_runtime["jsx"])(SetupForm, { classes: {
            form: createPersonaClasses.form,
        }, primary: t('set_up_create_persona'), secondary: t('set_up_create_persona_hint'), content: Object(jsx_runtime["jsx"])(jsx_runtime["Fragment"], { children: Object(jsx_runtime["jsx"])(TextField["a" /* default */], { required: true, autoFocus: true, className: setupFormClasses.input, value: name, onChange: (e) => setName(e.target.value), onKeyDown: (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        createPersonaAndNext();
                    }
                }, label: t('name'), helperText: ' ', inputProps: {
                    'data-testid': 'username_input',
                } }, void 0) }, void 0), actions: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: setupFormClasses.button, variant: "contained", onClick: createPersonaAndNext, disabled: !name, "data-testid": "next_button" }, { children: t('set_up_button_next') }), void 0),
                Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: setupFormClasses.or, variant: "body1" }, { children: t('set_up_tip_or') }), void 0),
                Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ variant: "text", component: react_router_dom["b" /* Link */], to: SetupStep["a" /* SetupStep */].RestoreDatabase, "data-testid": "backup_button" }, { children: t('set_up_button_from_backup') }), void 0)] }, void 0) }, void 0));
}
//#endregion
//#region connect network
const useProviderLineStyle = Object(makeStyles["a" /* default */])((theme) => ({
    text: {
        border: `solid 1px ${theme.palette.divider}`,
        borderRadius: 3,
    },
}));
function ConnectNetwork() {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = useSetupFormStyles();
    const providerLineClasses = useProviderLineStyle();
    const history = Object(react_router["h" /* useHistory */])();
    const [persona, setPersona] = Object(react["useState"])(null);
    // a restored persona threat as initialized persona
    const initializedPersonas = useMyPersonas();
    const uninitializedPersonas = useMyUninitializedPersonas();
    const { identifier } = useQueryParams(['identifier']);
    const { value = null, loading, error } = Object(useAsync["a" /* default */])(async () => {
        const persona = initializedPersonas.find((x) => x.identifier.toText() === identifier);
        // auto-finished by setup guide
        if (persona === null || persona === void 0 ? void 0 : persona.linkedProfiles.size) {
            history.replace(flags["a" /* Flags */].has_no_browser_tab_ui ? Route["a" /* DashboardRoute */].Nav : Route["a" /* DashboardRoute */].Personas);
            return null;
        }
        return identifier
            ? service["b" /* default */].Identity.queryPersona(database_type["Identifier"].fromString(identifier, database_type["ECKeyIdentifier"]).unwrap())
            : null;
    }, [identifier, initializedPersonas, uninitializedPersonas]);
    // update persona when link/unlink really happen
    if (!loading && (value === null || value === void 0 ? void 0 : value.linkedProfiles.size) !== (persona === null || persona === void 0 ? void 0 : persona.linkedProfiles.size))
        setPersona(value);
    // prevent from displaying persona's nickname as 'undefined'
    if (!(persona === null || persona === void 0 ? void 0 : persona.nickname))
        return null;
    // TODO:
    // show error message
    return (Object(jsx_runtime["jsx"])(SetupForm, { primary: t('set_up_connect', { name: persona.nickname }), secondary: t('set_up_connect_hint'), content: Object(jsx_runtime["jsx"])(jsx_runtime["Fragment"], { children: Object(jsx_runtime["jsx"])(ProfileBox, { persona: persona, ProviderLineProps: {
                    classes: providerLineClasses,
                } }, void 0) }, void 0), actions: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: classes.button, variant: "contained", disabled: (persona === null || persona === void 0 ? void 0 : persona.linkedProfiles.size) === 0, onClick: async () => {
                        var _a, _b;
                        const [_, address] = await Promise.all([
                            service["b" /* default */].Identity.setupPersona(persona.identifier),
                            Wallet_messages["b" /* WalletRPC */].importFirstWallet({
                                name: (_a = persona.nickname) !== null && _a !== void 0 ? _a : t('untitled_wallet'),
                                mnemonic: (_b = persona.mnemonic) === null || _b === void 0 ? void 0 : _b.words.split(' '),
                                passphrase: '',
                            }),
                        ]);
                        if (address)
                            Wallet_settings["b" /* currentSelectedWalletAddressSettings */].value = address;
                        await Object(utils["s" /* sleep */])(300);
                        history.replace(flags["a" /* Flags */].has_no_browser_tab_ui ? Route["a" /* DashboardRoute */].Nav : Route["a" /* DashboardRoute */].Personas);
                    } }, { children: t('set_up_button_finish') }), void 0),
                Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ color: "inherit", variant: "text", onClick: () => history.goBack() }, { children: t('set_up_button_cancel') }), void 0)] }, void 0) }, void 0));
}
//#endregion
//#region restore
const useRestoreDatabaseStyle = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    file: {
        display: 'none',
    },
    input: {
        width: '100%',
        boxSizing: 'border-box',
        border: `solid 1px ${theme.palette.divider}`,
        borderRadius: 4,
        height: 176,
        padding: theme.spacing(2, 3),
        '& > textarea': {
            overflow: 'auto !important',
            height: '100% !important',
        },
        [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(2),
        },
    },
    restoreTextWrapper: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    restoreActionButton: {
        alignSelf: 'flex-end',
        marginTop: theme.spacing(1),
    },
}));
function RestoreDatabase() {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const history = Object(react_router["h" /* useHistory */])();
    const classes = useSetupFormStyles();
    const restoreDatabaseClasses = useRestoreDatabaseStyle();
    const { enqueueSnackbar, closeSnackbar } = Object(notistack_esm["b" /* useSnackbar */])();
    const [file, setFile] = Object(react["useState"])(null);
    const [json, setJSON] = Object(react["useState"])(null);
    const [backupValue, setBackupValue] = Object(react["useState"])('');
    const [textValue, setTextValue] = Object(react["useState"])('');
    const state = Object(react["useState"])(0);
    const tabProps = {
        tabs: [
            {
                id: 'file',
                label: t('restore_database_file'),
                children: (Object(jsx_runtime["jsx"])(RestoreFromBackupBox, { file: file, onChange: (file, content) => {
                        setFile(file);
                        setBackupValue(content);
                    } }, void 0)),
                p: 0,
            },
            {
                id: 'text',
                label: t('restore_database_text'),
                children: (Object(jsx_runtime["jsx"])(InputBase["a" /* default */], { className: restoreDatabaseClasses.input, placeholder: t('dashboard_paste_database_backup_hint'), inputRef: (input) => input && input.focus(), multiline: true, value: textValue, onChange: (e) => setTextValue(e.target.value), inputProps: {
                        'data-testid': 'text_textarea',
                    } }, void 0)),
                p: 0,
            },
        ],
        state,
        height: 176,
    };
    const permissionState = Object(useAsync["a" /* default */])(async () => {
        const json = Object(latest["a" /* UpgradeBackupJSONFile */])(Object(BackupFileShortRepresentation["b" /* decompressBackupFile */])(state[0] === 0 ? backupValue : textValue));
        setJSON(json);
        if (!json)
            throw new Error('UpgradeBackupJSONFile failed');
        return extraPermissions(json.grantedHostPermissions);
    }, [state[0], backupValue, textValue]);
    const restoreDB = async () => {
        var _a;
        try {
            if (!json)
                return;
            const permissions = (_a = permissionState.value) !== null && _a !== void 0 ? _a : [];
            if (permissions.length) {
                const granted = await browser.permissions.request({ origins: permissions !== null && permissions !== void 0 ? permissions : [] });
                if (!granted)
                    return;
            }
            const restoreParams = new URLSearchParams();
            const restoreId = Object(v4["a" /* default */])();
            restoreParams.append('uuid', restoreId);
            await service["b" /* default */].Welcome.setUnconfirmedBackup(restoreId, json);
            history.push(`${SetupStep["a" /* SetupStep */].RestoreDatabaseConfirmation}?${restoreParams.toString()}`);
        }
        catch (e) {
            enqueueSnackbar(t('set_up_restore_fail'), { variant: 'error' });
        }
    };
    return (Object(jsx_runtime["jsx"])(SetupForm, { primary: t('set_up_restore'), secondary: t('set_up_restore_hint'), content: Object(jsx_runtime["jsx"])(AbstractTab["a" /* default */], Object.assign({}, tabProps), void 0), actions: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: classnames_default()(classes.button, classes.restoreButton), variant: "contained", disabled: (!(state[0] === 0 && backupValue) && !(state[0] === 1 && textValue)) ||
                        !json ||
                        permissionState.loading ||
                        !!permissionState.error, onClick: restoreDB, "data-testid": "restore_button" }, { children: t('set_up_button_restore') }), void 0),
                Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: classes.button, variant: "outlined", component: react_router_dom["b" /* Link */], to: SetupStep["a" /* SetupStep */].RestoreDatabaseAdvance, "data-testid": "advance_button" }, { children: t('set_up_button_advance') }), void 0),
                Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.or, variant: "body1" }, { children: t('set_up_tip_or') }), void 0),
                Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ variant: "text", onClick: () => history.goBack(), "data-testid": "restart_button" }, { children: t('set_up_button_from_scratch') }), void 0)] }, void 0) }, void 0));
}
//#endregion
//#region advance restore
function RestoreDatabaseAdvance() {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const { enqueueSnackbar } = Object(notistack_esm["b" /* useSnackbar */])();
    const history = Object(react_router["h" /* useHistory */])();
    const classes = useSetupFormStyles();
    const [nickname, setNickname] = Object(react["useState"])('');
    const [mnemonicWordsValue, setMnemonicWordsValue] = Object(react["useState"])('');
    const [password, setPassword] = Object(react["useState"])('');
    const [base64Value, setBase64Value] = Object(react["useState"])('');
    const [file, setFile] = Object(react["useState"])(null);
    const [scannedValue, setScannedValue] = Object(react["useState"])('');
    const state = Object(react["useState"])(0);
    const [tabState] = state;
    const importPersona = (persona) => {
        const failToRestore = () => enqueueSnackbar(t('set_up_advance_restore_fail'), { variant: 'error' });
        try {
            if (persona) {
                history.push(persona.linkedProfiles.size
                    ? flags["a" /* Flags */].has_no_browser_tab_ui
                        ? Route["a" /* DashboardRoute */].Nav
                        : Route["a" /* DashboardRoute */].Personas
                    : `${SetupStep["a" /* SetupStep */].ConnectNetwork}?identifier=${encodeURIComponent(persona.identifier.toText())}`);
            }
            else {
                failToRestore();
            }
        }
        catch (e) {
            failToRestore();
        }
    };
    const tabProps = {
        tabs: [
            {
                label: t('mnemonic_words'),
                children: (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(TextField["a" /* default */], { onChange: (e) => setNickname(e.target.value), value: nickname, required: true, autoFocus: true, label: t('name'), inputProps: {
                                'data-testid': 'username_input',
                            } }, void 0),
                        Object(jsx_runtime["jsx"])(TextField["a" /* default */], { value: mnemonicWordsValue, onChange: (e) => setMnemonicWordsValue(e.target.value), required: true, label: t('mnemonic_words'), inputProps: {
                                'data-testid': 'mnemonic_input',
                            } }, void 0),
                        Object(jsx_runtime["jsx"])(TextField["a" /* default */], { onChange: (e) => setPassword(e.target.value), value: password, label: t('password'), inputProps: {
                                'data-testid': 'password_input',
                            } }, void 0)] }, void 0)),
                p: 0,
            },
            {
                label: 'Base64',
                children: (Object(jsx_runtime["jsx"])(TextField["a" /* default */], { multiline: true, rows: 1, autoFocus: true, placeholder: t('dashboard_paste_database_base64_hint'), onChange: (e) => setBase64Value(e.target.value), value: base64Value, inputProps: {
                        style: { height: 147 },
                        'data-testid': 'base64_input',
                    } }, void 0)),
                display: 'flex',
                p: 0,
            },
            {
                label: t('qr_code'),
                children: (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(RestoreFromQRCodeImageBox, { file: file, onChange: setFile, onScan: setScannedValue, onError: () => {
                                enqueueSnackbar(t('set_up_qr_scanner_fail'), {
                                    variant: 'error',
                                });
                            } }, void 0),
                        Object(jsx_runtime["jsx"])(RestoreFromQRCodeCameraBox, { onScan: (scannedValue) => {
                                setFile(null);
                                setScannedValue(scannedValue);
                            }, onError: () => {
                                enqueueSnackbar(t('set_up_qr_scanner_fail'), {
                                    variant: 'error',
                                });
                            } }, void 0)] }, void 0)),
                p: 0,
            },
        ],
        state,
        height: 176,
    };
    return (Object(jsx_runtime["jsx"])(SetupForm, { primary: t('set_up_advance_restore'), secondary: t('set_up_advance_restore_hint'), content: Object(jsx_runtime["jsx"])(AbstractTab["a" /* default */], Object.assign({}, tabProps), void 0), actions: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: classnames_default()(classes.button, classes.importButton), variant: "contained", disabled: !(tabState === 0 && nickname && mnemonicWordsValue) &&
                        !(tabState === 1 && base64Value) &&
                        !(tabState === 2 && scannedValue), onClick: async () => {
                        try {
                            const persona = await (tabState === 0
                                ? service["b" /* default */].Identity.restoreFromMnemonicWords(mnemonicWordsValue, nickname, password)
                                : tabState === 1
                                    ? service["b" /* default */].Identity.restoreFromBase64(base64Value)
                                    : service["b" /* default */].Identity.restoreFromBackup(scannedValue));
                            importPersona(persona);
                        }
                        catch (e) {
                            enqueueSnackbar(t('set_up_advance_restore_fail'), {
                                variant: 'error',
                            });
                        }
                    }, "data-testid": "import_button" }, { children: t('set_up_button_import') }), void 0),
                Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ color: "inherit", variant: "text", onClick: () => history.goBack(), "data-testid": "cancel_button" }, { children: t('set_up_button_cancel') }), void 0)] }, void 0) }, void 0));
}
//#endregion
//#region restore database confirmation
const useRestoreDatabaseConfirmationStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    databasePreviewCardTable: {
        width: 432,
        border: `solid 1px ${theme.palette.divider}`,
        borderRadius: 4,
        padding: 32,
        marginTop: 0,
        marginLeft: -32,
        marginBottom: 38,
        [theme.breakpoints.down('sm')]: {
            width: '100%',
            marginLeft: 0,
        },
    },
    databasePreviewCardLabel: {
        fontSize: 18,
    },
    databasePreviewCardIcon: {
        width: 18,
        height: 18,
    },
}));
function RestoreDatabaseConfirmation() {
    var _a, _b, _c, _d, _e, _f;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = useSetupFormStyles();
    const restoreDatabaseConfirmationClasses = useRestoreDatabaseConfirmationStyles();
    const history = Object(react_router["h" /* useHistory */])();
    const { enqueueSnackbar, closeSnackbar } = Object(notistack_esm["b" /* useSnackbar */])();
    const { uuid } = useQueryParams(['uuid']);
    const [imported, setImported] = Object(react["useState"])(false);
    const { value: backup } = Object(useAsync["a" /* default */])(() => service["b" /* default */].Welcome.getUnconfirmedBackup(uuid !== null && uuid !== void 0 ? uuid : ''));
    const time = new Date((_a = backup === null || backup === void 0 ? void 0 : backup._meta_.createdAt) !== null && _a !== void 0 ? _a : 0);
    const personas = (_b = backup === null || backup === void 0 ? void 0 : backup.personas.length) !== null && _b !== void 0 ? _b : 0;
    const profiles = (_c = backup === null || backup === void 0 ? void 0 : backup.profiles.length) !== null && _c !== void 0 ? _c : 0;
    const posts = (_d = backup === null || backup === void 0 ? void 0 : backup.posts.length) !== null && _d !== void 0 ? _d : 0;
    const contacts = (_e = backup === null || backup === void 0 ? void 0 : backup.userGroups.length) !== null && _e !== void 0 ? _e : 0;
    const wallets = (_f = backup === null || backup === void 0 ? void 0 : backup.wallets.length) !== null && _f !== void 0 ? _f : 0;
    const records = [
        { type: DatabaseRecordType.Persona, length: personas, checked: imported === true },
        { type: DatabaseRecordType.Profile, length: profiles, checked: imported === true },
        { type: DatabaseRecordType.Post, length: posts, checked: imported === true },
        { type: DatabaseRecordType.Group, length: contacts, checked: imported === true },
        { type: DatabaseRecordType.Wallet, length: wallets, checked: imported === true },
    ];
    const restoreFinish = async () => {
        if ((backup === null || backup === void 0 ? void 0 : backup.personas.length) && personas === 1 && profiles === 0) {
            history.push(`${SetupStep["a" /* SetupStep */].ConnectNetwork}?identifier=${encodeURIComponent(backup.personas[0].identifier)}`);
        }
        else if (personas === 0 && profiles === 0) {
            history.replace(SetupStep["a" /* SetupStep */].CreatePersona);
        }
        else {
            history.replace('/');
        }
    };
    const restoreConfirmation = async () => {
        const failToRestore = () => enqueueSnackbar(t('set_up_restore_fail'), { variant: 'error' });
        if (uuid) {
            try {
                setImported('loading');
                await service["b" /* default */].Welcome.confirmBackup(uuid);
                setImported(true);
            }
            catch (e) {
                failToRestore();
                setImported(false);
            }
        }
        else {
            failToRestore();
        }
    };
    return (Object(jsx_runtime["jsx"])(SetupForm, { primary: t('set_up_restore_confirmation'), secondary: imported === true
            ? time.getTime() === 0
                ? t('unknown_time')
                : t('dashboard_restoration_successful_hint', {
                    time: time.toLocaleString(),
                })
            : t('set_up_restore_confirmation_hint'), content: Object(jsx_runtime["jsx"])(DatabasePreviewCard, { classes: {
                table: restoreDatabaseConfirmationClasses.databasePreviewCardTable,
                label: restoreDatabaseConfirmationClasses.databasePreviewCardLabel,
                icon: restoreDatabaseConfirmationClasses.databasePreviewCardIcon,
            }, records: records }, void 0), actions: imported === true ? (Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: classnames_default()(classes.button, classes.doneButton), variant: "contained", onClick: restoreFinish, "data-testid": "finish_button" }, { children: t('set_up_button_done') }), void 0)) : (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ className: classes.button, variant: "contained", disabled: imported === 'loading', onClick: restoreConfirmation, "data-testid": "confirm_button" }, { children: t('set_up_button_confirm') }), void 0),
                Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ color: "inherit", variant: "text", onClick: () => history.goBack() }, { children: t('set_up_button_cancel') }), void 0)] }, void 0)) }, void 0));
}
//#endregion
const setupTheme = (theme) => Object(lodash["merge"])(Object(lodash["cloneDeep"])(theme), {
    overrides: {
        MuiOutlinedInput: {
            input: {
                paddingTop: 14.5,
                paddingBottom: 14.5,
            },
            multiline: {
                paddingTop: 14.5,
                paddingBottom: 14.5,
            },
        },
        MuiInputLabel: {
            outlined: {
                transform: 'translate(14px, 16px) scale(1)',
            },
        },
        MuiTextField: {
            root: {
                marginTop: theme.spacing(2),
                marginBottom: 0,
                '&:first-child': {
                    marginTop: 0,
                },
            },
        },
        MuiButton: {
            root: {
                '&[hidden]': {
                    visibility: 'hidden',
                },
            },
        },
        MuiPaper: {
            root: {
                backgroundColor: 'transparent',
            },
        },
        MuiTabs: {
            root: {
                minHeight: 38,
            },
            indicator: {
                height: 1,
            },
        },
        MuiTab: {
            root: {
                minHeight: 38,
                borderBottom: `solid 1px ${theme.palette.divider}`,
            },
        },
    },
    props: {
        MuiButton: {
            size: 'medium',
        },
        MuiTextField: {
            fullWidth: true,
            variant: 'outlined',
            margin: 'normal',
        },
    },
});
const CurrentStep = () => {
    const { step } = Object(react_router["j" /* useParams */])();
    switch (step) {
        case SetupStep["a" /* SetupStep */].ConsentDataCollection:
            return Object(jsx_runtime["jsx"])(ConsentDataCollection, {}, void 0);
        case SetupStep["a" /* SetupStep */].CreatePersona:
            return Object(jsx_runtime["jsx"])(CreatePersona, {}, void 0);
        case SetupStep["a" /* SetupStep */].ConnectNetwork:
            return Object(jsx_runtime["jsx"])(ConnectNetwork, {}, void 0);
        case SetupStep["a" /* SetupStep */].RestoreDatabase:
            return Object(jsx_runtime["jsx"])(RestoreDatabase, {}, void 0);
        case SetupStep["a" /* SetupStep */].RestoreDatabaseAdvance:
            return Object(jsx_runtime["jsx"])(RestoreDatabaseAdvance, {}, void 0);
        case SetupStep["a" /* SetupStep */].RestoreDatabaseConfirmation:
            return Object(jsx_runtime["jsx"])(RestoreDatabaseConfirmation, {}, void 0);
        default:
            return null;
    }
};
function DashboardSetupRouter(props) {
    const { path } = Object(react_router["k" /* useRouteMatch */])();
    return (Object(jsx_runtime["jsx"])(DashboardRouterContainer, { children: Object(jsx_runtime["jsx"])(ThemeProvider["a" /* default */], Object.assign({ theme: setupTheme }, { children: Object(jsx_runtime["jsxs"])(react_router["e" /* Switch */], { children: [Object(jsx_runtime["jsx"])(react_router["c" /* Route */], Object.assign({ path: `${path}/:step` }, { children: Object(jsx_runtime["jsx"])(CurrentStep, {}, void 0) }), void 0),
                    Object(jsx_runtime["jsx"])(react_router["c" /* Route */], Object.assign({ path: "*" }, { children: Object(jsx_runtime["jsx"])(react_router["b" /* Redirect */], { path: "*", to: `${Route["a" /* DashboardRoute */].Setup}/${SetupStep["a" /* SetupStep */].CreatePersona}` }, void 0) }), void 0)] }, void 0) }), void 0) }, void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/extension/options-page/DashboardContexts/BlurContext.tsx
var BlurContext = __webpack_require__(240);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/SSRRenderer.tsx
var SSRRenderer = __webpack_require__(422);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/DialogTitle/DialogTitle.js
var DialogTitle = __webpack_require__(1611);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/DialogContent/DialogContent.js
var DialogContent = __webpack_require__(925);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListSubheader/ListSubheader.js
var ListSubheader = __webpack_require__(1664);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/DialogActions/DialogActions.js
var DialogActions = __webpack_require__(1610);

// CONCATENATED MODULE: ./packages/maskbook/src/components/RequestPermission/RequestPermission.tsx



const RequestPermission_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        margin: theme.spacing(2, 2, 2, 2),
    },
}));
function RequestPermission(props) {
    var _a;
    const classes = RequestPermission_useStyles();
    return (Object(jsx_runtime["jsxs"])(Card["a" /* default */], Object.assign({ className: classes.root }, { children: [Object(jsx_runtime["jsx"])(DialogTitle["a" /* default */], { children: "Maskbook needs the following permissions" }, void 0),
            Object(jsx_runtime["jsx"])(DialogContent["a" /* default */], { children: Object(jsx_runtime["jsx"])(List["a" /* default */], Object.assign({ dense: true, subheader: Object(jsx_runtime["jsx"])(ListSubheader["a" /* default */], { children: "Sites" }, void 0) }, { children: (_a = props.permission.origins) === null || _a === void 0 ? void 0 : _a.map((x) => (Object(jsx_runtime["jsx"])(ListItem["a" /* default */], { children: Object(jsx_runtime["jsx"])(ListItemText["a" /* default */], { primary: x }, void 0) }, x))) }), void 0) }, void 0),
            Object(jsx_runtime["jsxs"])(DialogActions["a" /* default */], { children: [Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ onClick: props.onCancel, variant: "text" }, { children: "Cancel" }), void 0),
                    Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ onClick: props.onRequestApprove, variant: "contained" }, { children: "Approve" }), void 0)] }, void 0)] }), void 0));
}
function RequestPermissionPage() {
    const param = Object(react_router["i" /* useLocation */])();
    const _ = new URLSearchParams(param.search);
    const origins = _.getAll('origin');
    return (Object(jsx_runtime["jsx"])("div", Object.assign({ style: { width: 'fit-content', maxWidth: 600, margin: 'auto' } }, { children: Object(jsx_runtime["jsx"])(RequestPermission, { onCancel: () => window.close(), onRequestApprove: () => browser.permissions.request({ origins }).then(() => window.close()), permission: { origins } }, void 0) }), void 0));
}

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/colors/grey.js
var grey = __webpack_require__(435);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardComponents/DashboardSnackbar.tsx




const DashboardSnackbar_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        width: 795,
        height: 48,
    },
}));
const DashboardSnackbar = Object(react["forwardRef"])((props, ref) => {
    const { key, message } = props;
    const classes = DashboardSnackbar_useStyles();
    const { closeSnackbar } = Object(notistack_esm["b" /* useSnackbar */])();
    const theme = Object(useTheme["a" /* default */])();
    return (Object(jsx_runtime["jsxs"])("div", Object.assign({ id: String(key), className: classes.root, ref: ref }, { children: [key, theme.palette.primary.main, message] }), void 0));
});
function DashboardSnackbarProvider({ children }) {
    return (Object(jsx_runtime["jsx"])(notistack_esm["a" /* SnackbarProvider */], Object.assign({ maxSnack: 3, disableWindowBlurListener: true, anchorOrigin: {
            vertical: 'top',
            horizontal: 'center',
        } }, { children: children }), void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/DashboardRouters/Nav.tsx




const navTheme = (theme) => Object(lodash["merge"])(Object(lodash["cloneDeep"])(theme), {
    overrides: {},
});
function DashboardNavRouter(props) {
    return (Object(jsx_runtime["jsx"])(DashboardRouterContainer, Object.assign({ title: "Maskbook", compact: true }, { children: Object(jsx_runtime["jsx"])(ThemeProvider["a" /* default */], Object.assign({ theme: navTheme }, { children: props.children }), void 0) }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/PluginUI.ts + 73 modules
var PluginUI = __webpack_require__(198);

// EXTERNAL MODULE: ./packages/maskbook/src/components/shared/ErrorBoundary.tsx
var ErrorBoundary = __webpack_require__(117);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/options-page/index.tsx






































const options_page_useStyles = Object(makeStyles["a" /* default */])((theme) => {
    const dark = theme.palette.type === 'dark';
    return Object(createStyles["a" /* default */])({
        root: {
            '--monospace': 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            '--drawerHeader': dark ? '#121212' : theme.palette.primary.main,
            '--drawerBody': dark ? '#121212' : theme.palette.primary.main,
            [theme.breakpoints.down('sm')]: {
                '--drawerBody': 'transparent',
            },
            backgroundColor: dark ? grey["a" /* default */][900] : grey["a" /* default */][50],
            userSelect: 'none',
            width: '100vw',
            height: '100vh',
            position: 'absolute',
            [theme.breakpoints.up('md')]: {
                display: 'grid',
                gridTemplateColumns: '1fr [content-start] 1110px [content-end] 1fr',
                gridTemplateRows: '32px [content-start] auto [content-end] 50px',
                placeItems: 'center',
            },
            transition: 'filter 0.3s linear',
            willChange: 'filter',
            '& *::-webkit-scrollbar': {
                display: 'none',
            },
        },
        container: {
            width: '100%',
            height: '100%',
            overflow: 'auto',
            borderRadius: 12,
            backgroundColor: dark ? '#121212' : '#FFFFFF',
            gridRow: 'content-start / content-end',
            gridColumn: 'content-start / content-end',
            display: 'flex',
            [theme.breakpoints.down('sm')]: {
                borderRadius: 0,
            },
        },
        suspend: {
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
        },
        footer: {
            gridRow: 'content-end / span 1',
            gridColumn: 'content-start / content-end',
        },
        blur: {
            filter: 'blur(3px)',
        },
        errorTitle: {
            marginBottom: theme.spacing(3),
        },
        errorMessage: {
            maxWidth: '50%',
            maxHeight: 300,
            whiteSpace: 'pre-wrap',
            marginBottom: theme.spacing(3),
        },
    });
});
function DashboardUI() {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = options_page_useStyles();
    const history = Object(react_router["h" /* useHistory */])();
    const xsMatched = Object(useMatchXS["a" /* useMatchXS */])();
    const routers = [
        [t('personas'), Route["a" /* DashboardRoute */].Personas, Object(jsx_runtime["jsx"])(PeopleOutlined_default.a, {}, void 0)],
        [t('wallets'), Route["a" /* DashboardRoute */].Wallets, Object(jsx_runtime["jsx"])(CreditCard_default.a, {}, void 0)],
        [t('contacts'), Route["a" /* DashboardRoute */].Contacts, Object(jsx_runtime["jsx"])(BookmarkBorderOutlined_default.a, {}, void 0)],
        [t('settings'), Route["a" /* DashboardRoute */].Settings, Object(jsx_runtime["jsx"])(SettingsOutlined_default.a, {}, void 0)],
    ].filter((x) => x);
    // jump to persona if needed
    const [reloadSpy, setReloadSpy] = Object(react["useState"])(false);
    const { loading, error } = Object(useAsync["a" /* default */])(async () => {
        if (false)
            {}
        if (location.hash.includes(SetupStep["a" /* SetupStep */].ConsentDataCollection))
            return;
        const personas = (await service["b" /* default */].Identity.queryMyPersonas()).filter((x) => !x.uninitialized);
        // the user need setup at least one persona
        if (!personas.length) {
            history.replace(`${Route["a" /* DashboardRoute */].Setup}/${SetupStep["a" /* SetupStep */].CreatePersona}`);
            return;
        }
        // the user has got more than one personas, so we cannot make decision for user.
        if (personas.length !== 1)
            return;
        // the user has linked the only persona with some profiles
        if (personas.some((x) => x.linkedProfiles.size))
            return;
        history.replace(`${Route["a" /* DashboardRoute */].Setup}/${SetupStep["a" /* SetupStep */].ConnectNetwork}?identifier=${encodeURIComponent(personas[0].identifier.toText())}`);
    }, [reloadSpy]);
    const renderDashboard = (children) => {
        return (Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.root }, { children: [Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.container }, { children: children }), void 0),
                xsMatched ? null : (Object(jsx_runtime["jsx"])("footer", Object.assign({ className: classes.footer }, { children: Object(jsx_runtime["jsx"])(FooterLine, {}, void 0) }), void 0))] }), void 0));
    };
    if (loading)
        return renderDashboard(Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ className: classes.suspend }, { children: Object(jsx_runtime["jsx"])(CircularProgress["a" /* default */], {}, void 0) }), void 0));
    if (error)
        return renderDashboard(Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ className: classes.suspend }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.errorTitle, variant: "h5" }, { children: t('dashboard_load_failed_title') }), void 0),
                error.message ? (Object(jsx_runtime["jsx"])(Card["a" /* default */], Object.assign({ className: classes.errorMessage }, { children: Object(jsx_runtime["jsx"])(ShowcaseBox, { children: error.message }, void 0) }), void 0)) : null,
                Object(jsx_runtime["jsx"])(ActionButton["c" /* default */], Object.assign({ variant: "text", onClick: () => setReloadSpy((x) => !x) }, { children: t('reload') }), void 0)] }), void 0));
    const drawer = Object(jsx_runtime["jsx"])(Drawer, { routers: routers, exitDashboard: null }, void 0);
    return renderDashboard(Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [xsMatched ? null : drawer, Object(jsx_runtime["jsxs"])(react_router["e" /* Switch */], { children: [flags["a" /* Flags */].has_no_browser_tab_ui ? (Object(jsx_runtime["jsx"])(react_router["c" /* Route */], { path: Route["a" /* DashboardRoute */].Nav, component: () => Object(jsx_runtime["jsx"])(DashboardNavRouter, { children: drawer }, void 0) }, void 0)) : null,
                    Object(jsx_runtime["jsx"])(react_router["c" /* Route */], { path: Route["a" /* DashboardRoute */].Personas, component: Object(ErrorBoundary["b" /* withErrorBoundary */])(DashboardPersonasRouter) }, void 0),
                    Object(jsx_runtime["jsx"])(react_router["c" /* Route */], { path: Route["a" /* DashboardRoute */].Wallets, component: Object(ErrorBoundary["b" /* withErrorBoundary */])(DashboardWalletsRouter) }, void 0),
                    Object(jsx_runtime["jsx"])(react_router["c" /* Route */], { path: Route["a" /* DashboardRoute */].Contacts, component: Object(ErrorBoundary["b" /* withErrorBoundary */])(DashboardContactsRouter) }, void 0),
                    Object(jsx_runtime["jsx"])(react_router["c" /* Route */], { path: Route["a" /* DashboardRoute */].Settings, component: Object(ErrorBoundary["b" /* withErrorBoundary */])(DashboardSettingsRouter) }, void 0),
                    Object(jsx_runtime["jsx"])(react_router["c" /* Route */], { path: Route["a" /* DashboardRoute */].Setup, component: Object(ErrorBoundary["b" /* withErrorBoundary */])(DashboardSetupRouter) }, void 0),
                    Object(jsx_runtime["jsx"])(react_router["c" /* Route */], { path: Route["a" /* DashboardRoute */].RequestPermission, component: Object(ErrorBoundary["b" /* withErrorBoundary */])(RequestPermissionPage) }, void 0),
                    Object(jsx_runtime["jsx"])(react_router["b" /* Redirect */], { path: "*", to: flags["a" /* Flags */].has_no_browser_tab_ui ? Route["a" /* DashboardRoute */].Nav : Route["a" /* DashboardRoute */].Personas }, void 0)] }, void 0)] }, void 0));
}
//#region dashboard plugin UI
function PluginDashboardInspectorForEach({ config }) {
    const F = config.DashboardComponent;
    if (typeof F === 'function')
        return Object(jsx_runtime["jsx"])(F, {}, void 0);
    return null;
}
function DashboardPluginUI() {
    return (Object(jsx_runtime["jsx"])(ThemeProvider["a" /* default */], Object.assign({ theme: Object(utils_theme["d" /* useMaskbookTheme */])() }, { children: [...PluginUI["a" /* PluginUI */].values()].map((x) => (Object(jsx_runtime["jsx"])(ErrorBoundary["a" /* ErrorBoundary */], Object.assign({ contain: `Plugin "${x.pluginName}"` }, { children: Object(jsx_runtime["jsx"])(PluginDashboardInspectorForEach, { config: x }, void 0) }), x.identifier))) }), void 0));
}
//#endregion
function Dashboard() {
    return (Object(jsx_runtime["jsx"])(ErrorBoundary["a" /* ErrorBoundary */], { children: Object(jsx_runtime["jsx"])(I18nextProvider["a" /* I18nextProvider */], Object.assign({ i18n: i18n_next["a" /* default */] }, { children: Object(jsx_runtime["jsx"])(ThemeProvider["a" /* default */], Object.assign({ theme: Object(utils_theme["d" /* useMaskbookTheme */])() }, { children: Object(jsx_runtime["jsx"])(DashboardSnackbarProvider, { children: Object(jsx_runtime["jsx"])(NoSsr["a" /* default */], { children: Object(jsx_runtime["jsxs"])(react_router_dom["a" /* HashRouter */], { children: [Object(jsx_runtime["jsx"])(CssBaseline["a" /* default */], {}, void 0),
                                Object(jsx_runtime["jsxs"])(BlurContext["a" /* DashboardBlurContextUI */], { children: [Object(jsx_runtime["jsx"])(DashboardUI, {}, void 0),
                                        Object(jsx_runtime["jsx"])(DashboardPluginUI, {}, void 0)] }, void 0)] }, void 0) }, void 0) }, void 0) }), void 0) }), void 0) }, void 0));
}
/* harmony default export */ var options_page = __webpack_exports__["default"] = (Object(SSRRenderer["a" /* SSRRenderer */])(Object(jsx_runtime["jsx"])(Dashboard, {}, void 0)));


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

/***/ 422:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SSRRenderer; });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(0);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(129);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_dom__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _components_shared_ErrorBoundary__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(117);




async function SSRRenderer(jsx, container) {
    var _a;
    if (typeof window === 'object') {
        if (!container)
            container = (_a = document.getElementById('root')) !== null && _a !== void 0 ? _a : void 0;
        if (!container) {
            container = document.createElement('div');
            document.body.appendChild(container);
        }
        const oldChildren = [...container.children];
        react_dom__WEBPACK_IMPORTED_MODULE_1___default.a.unstable_createRoot(container).render(Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(react__WEBPACK_IMPORTED_MODULE_2__["StrictMode"], { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_components_shared_ErrorBoundary__WEBPACK_IMPORTED_MODULE_3__[/* ErrorBoundary */ "a"], { children: jsx }, void 0) }, void 0));
        oldChildren.forEach((x) => x.remove());
        return '';
    }
    else {
        const Server = await __webpack_require__.e(/* import() */ 4).then(__webpack_require__.t.bind(null, 801, 7));
        const { ServerStyleSheets } = await __webpack_require__.e(/* import() */ 6).then(__webpack_require__.bind(null, 83));
        const sheets = new ServerStyleSheets();
        const html = Server.renderToString(sheets.collect(jsx));
        const styles = sheets.toString();
        return `<style>${styles}</style><div id="root">${html}</div>`;
    }
}


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

/***/ 891:
/***/ (function(module) {

module.exports = JSON.parse("[{\"payable\":true,\"stateMutability\":\"payable\",\"type\":\"fallback\"},{\"constant\":true,\"inputs\":[{\"name\":\"user\",\"type\":\"address\"},{\"name\":\"token\",\"type\":\"address\"}],\"name\":\"tokenBalance\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"users\",\"type\":\"address[]\"},{\"name\":\"tokens\",\"type\":\"address[]\"}],\"name\":\"balances\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256[]\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]");

/***/ }),

/***/ 895:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);


/**
 * Detect Element Resize.
 * https://github.com/sdecima/javascript-detect-element-resize
 * Sebastian Decima
 *
 * Forked from version 0.5.3; includes the following modifications:
 * 1) Guard against unsafe 'window' and 'document' references (to support SSR).
 * 2) Defer initialization code via a top-level function wrapper (to support SSR).
 * 3) Avoid unnecessary reflows by not measuring size for scroll events bubbling from children.
 * 4) Add nonce for style element.
 **/

function createDetectElementResize(nonce) {
  // Check `document` and `window` in case of server-side rendering
  var _window;
  if (typeof window !== 'undefined') {
    _window = window;
  } else if (typeof self !== 'undefined') {
    _window = self;
  } else {
    _window = global;
  }

  var attachEvent = typeof document !== 'undefined' && document.attachEvent;

  if (!attachEvent) {
    var requestFrame = function () {
      var raf = _window.requestAnimationFrame || _window.mozRequestAnimationFrame || _window.webkitRequestAnimationFrame || function (fn) {
        return _window.setTimeout(fn, 20);
      };
      return function (fn) {
        return raf(fn);
      };
    }();

    var cancelFrame = function () {
      var cancel = _window.cancelAnimationFrame || _window.mozCancelAnimationFrame || _window.webkitCancelAnimationFrame || _window.clearTimeout;
      return function (id) {
        return cancel(id);
      };
    }();

    var resetTriggers = function resetTriggers(element) {
      var triggers = element.__resizeTriggers__,
          expand = triggers.firstElementChild,
          contract = triggers.lastElementChild,
          expandChild = expand.firstElementChild;
      contract.scrollLeft = contract.scrollWidth;
      contract.scrollTop = contract.scrollHeight;
      expandChild.style.width = expand.offsetWidth + 1 + 'px';
      expandChild.style.height = expand.offsetHeight + 1 + 'px';
      expand.scrollLeft = expand.scrollWidth;
      expand.scrollTop = expand.scrollHeight;
    };

    var checkTriggers = function checkTriggers(element) {
      return element.offsetWidth != element.__resizeLast__.width || element.offsetHeight != element.__resizeLast__.height;
    };

    var scrollListener = function scrollListener(e) {
      // Don't measure (which forces) reflow for scrolls that happen inside of children!
      if (e.target.className.indexOf('contract-trigger') < 0 && e.target.className.indexOf('expand-trigger') < 0) {
        return;
      }

      var element = this;
      resetTriggers(this);
      if (this.__resizeRAF__) {
        cancelFrame(this.__resizeRAF__);
      }
      this.__resizeRAF__ = requestFrame(function () {
        if (checkTriggers(element)) {
          element.__resizeLast__.width = element.offsetWidth;
          element.__resizeLast__.height = element.offsetHeight;
          element.__resizeListeners__.forEach(function (fn) {
            fn.call(element, e);
          });
        }
      });
    };

    /* Detect CSS Animations support to detect element display/re-attach */
    var animation = false,
        keyframeprefix = '',
        animationstartevent = 'animationstart',
        domPrefixes = 'Webkit Moz O ms'.split(' '),
        startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' '),
        pfx = '';
    {
      var elm = document.createElement('fakeelement');
      if (elm.style.animationName !== undefined) {
        animation = true;
      }

      if (animation === false) {
        for (var i = 0; i < domPrefixes.length; i++) {
          if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
            pfx = domPrefixes[i];
            keyframeprefix = '-' + pfx.toLowerCase() + '-';
            animationstartevent = startEvents[i];
            animation = true;
            break;
          }
        }
      }
    }

    var animationName = 'resizeanim';
    var animationKeyframes = '@' + keyframeprefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
    var animationStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; ';
  }

  var createStyles = function createStyles(doc) {
    if (!doc.getElementById('detectElementResize')) {
      //opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
      var css = (animationKeyframes ? animationKeyframes : '') + '.resize-triggers { ' + (animationStyle ? animationStyle : '') + 'visibility: hidden; opacity: 0; } ' + '.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: " "; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; z-index: -1; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }',
          head = doc.head || doc.getElementsByTagName('head')[0],
          style = doc.createElement('style');

      style.id = 'detectElementResize';
      style.type = 'text/css';

      if (nonce != null) {
        style.setAttribute('nonce', nonce);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(doc.createTextNode(css));
      }

      head.appendChild(style);
    }
  };

  var addResizeListener = function addResizeListener(element, fn) {
    if (attachEvent) {
      element.attachEvent('onresize', fn);
    } else {
      if (!element.__resizeTriggers__) {
        var doc = element.ownerDocument;
        var elementStyle = _window.getComputedStyle(element);
        if (elementStyle && elementStyle.position == 'static') {
          element.style.position = 'relative';
        }
        createStyles(doc);
        element.__resizeLast__ = {};
        element.__resizeListeners__ = [];
        (element.__resizeTriggers__ = doc.createElement('div')).className = 'resize-triggers';
        element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' + '<div class="contract-trigger"></div>';
        element.appendChild(element.__resizeTriggers__);
        resetTriggers(element);
        element.addEventListener('scroll', scrollListener, true);

        /* Listen for a css animation to detect element display/re-attach */
        if (animationstartevent) {
          element.__resizeTriggers__.__animationListener__ = function animationListener(e) {
            if (e.animationName == animationName) {
              resetTriggers(element);
            }
          };
          element.__resizeTriggers__.addEventListener(animationstartevent, element.__resizeTriggers__.__animationListener__);
        }
      }
      element.__resizeListeners__.push(fn);
    }
  };

  var removeResizeListener = function removeResizeListener(element, fn) {
    if (attachEvent) {
      element.detachEvent('onresize', fn);
    } else {
      element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
      if (!element.__resizeListeners__.length) {
        element.removeEventListener('scroll', scrollListener, true);
        if (element.__resizeTriggers__.__animationListener__) {
          element.__resizeTriggers__.removeEventListener(animationstartevent, element.__resizeTriggers__.__animationListener__);
          element.__resizeTriggers__.__animationListener__ = null;
        }
        try {
          element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
        } catch (e) {
          // Preact compat; see developit/preact-compat/issues/228
        }
      }
    }
  };

  return {
    addResizeListener: addResizeListener,
    removeResizeListener: removeResizeListener
  };
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var AutoSizer = function (_React$PureComponent) {
  inherits(AutoSizer, _React$PureComponent);

  function AutoSizer() {
    var _ref;

    var _temp, _this, _ret;

    classCallCheck(this, AutoSizer);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = possibleConstructorReturn(this, (_ref = AutoSizer.__proto__ || Object.getPrototypeOf(AutoSizer)).call.apply(_ref, [this].concat(args))), _this), _this.state = {
      height: _this.props.defaultHeight || 0,
      width: _this.props.defaultWidth || 0
    }, _this._onResize = function () {
      var _this$props = _this.props,
          disableHeight = _this$props.disableHeight,
          disableWidth = _this$props.disableWidth,
          onResize = _this$props.onResize;


      if (_this._parentNode) {
        // Guard against AutoSizer component being removed from the DOM immediately after being added.
        // This can result in invalid style values which can result in NaN values if we don't handle them.
        // See issue #150 for more context.

        var _height = _this._parentNode.offsetHeight || 0;
        var _width = _this._parentNode.offsetWidth || 0;

        var _style = window.getComputedStyle(_this._parentNode) || {};
        var paddingLeft = parseInt(_style.paddingLeft, 10) || 0;
        var paddingRight = parseInt(_style.paddingRight, 10) || 0;
        var paddingTop = parseInt(_style.paddingTop, 10) || 0;
        var paddingBottom = parseInt(_style.paddingBottom, 10) || 0;

        var newHeight = _height - paddingTop - paddingBottom;
        var newWidth = _width - paddingLeft - paddingRight;

        if (!disableHeight && _this.state.height !== newHeight || !disableWidth && _this.state.width !== newWidth) {
          _this.setState({
            height: _height - paddingTop - paddingBottom,
            width: _width - paddingLeft - paddingRight
          });

          onResize({ height: _height, width: _width });
        }
      }
    }, _this._setRef = function (autoSizer) {
      _this._autoSizer = autoSizer;
    }, _temp), possibleConstructorReturn(_this, _ret);
  }

  createClass(AutoSizer, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var nonce = this.props.nonce;

      if (this._autoSizer && this._autoSizer.parentNode && this._autoSizer.parentNode.ownerDocument && this._autoSizer.parentNode.ownerDocument.defaultView && this._autoSizer.parentNode instanceof this._autoSizer.parentNode.ownerDocument.defaultView.HTMLElement) {
        // Delay access of parentNode until mount.
        // This handles edge-cases where the component has already been unmounted before its ref has been set,
        // As well as libraries like react-lite which have a slightly different lifecycle.
        this._parentNode = this._autoSizer.parentNode;

        // Defer requiring resize handler in order to support server-side rendering.
        // See issue #41
        this._detectElementResize = createDetectElementResize(nonce);
        this._detectElementResize.addResizeListener(this._parentNode, this._onResize);

        this._onResize();
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      if (this._detectElementResize && this._parentNode) {
        this._detectElementResize.removeResizeListener(this._parentNode, this._onResize);
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          children = _props.children,
          className = _props.className,
          disableHeight = _props.disableHeight,
          disableWidth = _props.disableWidth,
          style = _props.style;
      var _state = this.state,
          height = _state.height,
          width = _state.width;

      // Outer div should not force width/height since that may prevent containers from shrinking.
      // Inner component should overflow and use calculated width/height.
      // See issue #68 for more information.

      var outerStyle = { overflow: 'visible' };
      var childParams = {};

      // Avoid rendering children before the initial measurements have been collected.
      // At best this would just be wasting cycles.
      var bailoutOnChildren = false;

      if (!disableHeight) {
        if (height === 0) {
          bailoutOnChildren = true;
        }
        outerStyle.height = 0;
        childParams.height = height;
      }

      if (!disableWidth) {
        if (width === 0) {
          bailoutOnChildren = true;
        }
        outerStyle.width = 0;
        childParams.width = width;
      }

      return Object(react__WEBPACK_IMPORTED_MODULE_0__["createElement"])(
        'div',
        {
          className: className,
          ref: this._setRef,
          style: _extends({}, outerStyle, style) },
        !bailoutOnChildren && children(childParams)
      );
    }
  }]);
  return AutoSizer;
}(react__WEBPACK_IMPORTED_MODULE_0__["PureComponent"]);

AutoSizer.defaultProps = {
  onResize: function onResize() {},
  disableHeight: false,
  disableWidth: false,
  style: {}
};

/* harmony default export */ __webpack_exports__["a"] = (AutoSizer);

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(85)))

/***/ })

/******/ });