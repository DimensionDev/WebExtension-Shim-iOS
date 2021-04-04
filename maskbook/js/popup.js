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
/******/ 		176: 0
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
/******/ 		return __webpack_require__.p + "js/" + ({"0":"npm.idb","2":"npm.bip39","3":"npm.multikey-map","156":"npm.arweave","157":"npm.axios","158":"npm.jsonwebtoken","159":"npm.lodash.includes","160":"npm.semver","161":"npm.tslib","162":"npm.webcrypto-liner","173":"npm.walletconnect"}[chunkId]||chunkId) + ".chunk.js"
/******/ 	}
/******/ 	function webextScriptSrc(chunkId) {
/******/ 		var publicPath = __webpack_require__.p
/******/ 		var scriptSrcPath = publicPath + "js/" + ({"0":"npm.idb","2":"npm.bip39","3":"npm.multikey-map","156":"npm.arweave","157":"npm.axios","158":"npm.jsonwebtoken","159":"npm.lodash.includes","160":"npm.semver","161":"npm.tslib","162":"npm.webcrypto-liner","173":"npm.walletconnect"}[chunkId]||chunkId) + ".chunk.js";
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
/******/ 	deferredModules.push([1533,1,4,6,5,9,8,7,62,141,138,140,145,143,134,144,73,133,150,54,131,127,63,19,93,21,102,110,72,111,136,49,91,126,78,135,96,50,84,122,59,139,121,68,142,61,55,146,41,76,24,11,108,109,92,87,69,115,70,90,42,46,22,149,106,47,128,83,18,104,105,57,75,130,45,117,118,114,74,31,36,56,48,60,51,12,14,29,28,89,52,82,67,35,37,77,38,137,40,23,34,98,44,119,27,94,120,101,66,123,97,81,13,88,107,25,147,58,148,113,26,116,99,100,32,124,125,64,30,71,33,43,53,129,103,86,79,65,85,112,95,17,15,39,132,80,16,20,154,155,151,10,152]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ 1533:
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1544);
module.exports = __webpack_require__(344);


/***/ }),

/***/ 1544:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: ./node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(0);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/ui.ts + 1 modules
var social_network_ui = __webpack_require__(38);

// EXTERNAL MODULE: ./packages/maskbook/src/provider.ui.ts + 55 modules
var provider_ui = __webpack_require__(802);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/defaults/emptyDefinition.ts
var emptyDefinition = __webpack_require__(387);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/util/ValueRef.js
var ValueRef = __webpack_require__(132);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/Extension/Context.js
var Context = __webpack_require__(54);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/defaults/MyIdentitiesRef.ts
var MyIdentitiesRef = __webpack_require__(374);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/popup-page/index.ts





const hasPermissionCheckAtPopupPage = new ValueRef["a" /* ValueRef */](true);
const popupPageUISelf = Object(social_network_ui["defineSocialNetworkUI"])({
    ...emptyDefinition["a" /* emptyDefinition */],
    internalName: 'Popup page data source',
    async init(e, p) {
        emptyDefinition["a" /* emptyDefinition */].init(e, p);
        const activeTab = ((await browser.tabs.query({ active: true, currentWindow: true })) || [])[0];
        if (activeTab === undefined)
            return;
        const location = new URL(activeTab.url || globalThis.location.href);
        for (const ui of social_network_ui["definedSocialNetworkUIs"]) {
            if (ui.shouldActivate(location) && ui.networkIdentifier !== 'localhost') {
                popupPageUISelf.networkIdentifier = ui.networkIdentifier;
                popupPageUISelf.hasPermission = ui.hasPermission.bind(ui);
                popupPageUISelf.requestPermission = ui.requestPermission.bind(ui);
                Object(MyIdentitiesRef["a" /* InitMyIdentitiesValueRef */])(popupPageUISelf, ui.networkIdentifier);
                return;
            }
        }
    },
    shouldActivate() {
        return Object(Context["g" /* isEnvironment */])(Context["a" /* Environment */].ManifestBrowserAction);
    },
});

// EXTERNAL MODULE: ./packages/maskbook/src/setup.ui.ts + 1 modules
var setup_ui = __webpack_require__(479);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/SSRRenderer.tsx
var SSRRenderer = __webpack_require__(422);

// EXTERNAL MODULE: ./node_modules/react/index.js
var react = __webpack_require__(1);

// EXTERNAL MODULE: ./node_modules/lodash-es/lodash.js
var lodash = __webpack_require__(13);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/withStyles.js
var withStyles = __webpack_require__(16);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/makeStyles.js
var makeStyles = __webpack_require__(109);

// EXTERNAL MODULE: ./node_modules/@material-ui/styles/esm/ThemeProvider/ThemeProvider.js
var ThemeProvider = __webpack_require__(439);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Paper/Paper.js
var Paper = __webpack_require__(438);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Typography/Typography.js
var Typography = __webpack_require__(110);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Button/Button.js
var Button = __webpack_require__(297);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Box/Box.js
var Box = __webpack_require__(332);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Divider/Divider.js
var Divider = __webpack_require__(1625);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/theme.ts
var theme = __webpack_require__(116);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ExpandMore.js
var ExpandMore = __webpack_require__(281);
var ExpandMore_default = /*#__PURE__*/__webpack_require__.n(ExpandMore);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Accordion/Accordion.js
var Accordion = __webpack_require__(1660);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/AccordionSummary/AccordionSummary.js
var AccordionSummary = __webpack_require__(1661);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/List/List.js
var List = __webpack_require__(1608);

// EXTERNAL MODULE: ./packages/maskbook/src/components/shared/SelectPeopleAndGroups/index.tsx + 3 modules
var SelectPeopleAndGroups = __webpack_require__(428);

// EXTERNAL MODULE: ./packages/maskbook/src/components/DataSource/useActivatedUI.ts
var useActivatedUI = __webpack_require__(90);

// EXTERNAL MODULE: ./packages/maskbook/src/database/type.ts
var type = __webpack_require__(4);

// EXTERNAL MODULE: ./packages/maskbook/src/settings/settings.ts
var settings = __webpack_require__(26);

// EXTERNAL MODULE: ./packages/maskbook/src/components/custom-ui-helper.tsx
var custom_ui_helper = __webpack_require__(19);

// CONCATENATED MODULE: ./packages/maskbook/src/components/shared/ChooseIdentity.tsx











const useStyles = Object(makeStyles["a" /* default */])({
    root: {
        width: '100%',
        lineHeight: 1.75,
    },
    expansionPanelRoot: {
        boxShadow: 'none',
        width: '100%',
    },
    list: {
        width: '100%',
        padding: 0,
    },
    listItemRoot: {
        padding: '6px 24px 6px 8px',
    },
    fingerprint: {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        fontSize: 12,
    },
});
const useAccordionSummaryStyle = Object(makeStyles["a" /* default */])({
    root: {
        padding: 0,
    },
    content: {
        width: '100%',
        margin: 0,
    },
    expanded: {
        margin: '0 !important',
        minHeight: 'unset !important',
    },
    expandIcon: {
        padding: 0,
        marginRight: '0 !important',
        right: 4,
        position: 'absolute',
        pointerEvents: 'none',
    },
});
/**
 * Choose the current using identity.
 */
function ChooseIdentity(props) {
    const { identities } = props;
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(useStyles(), props);
    const expansionPanelSummaryClasses = Object(custom_ui_helper["d" /* useStylesExtends */])(useAccordionSummaryStyle(), props);
    const [expanded, setExpanded] = Object(react["useState"])(false);
    const ui = Object(social_network_ui["getActivatedUI"])();
    const current = Object(useActivatedUI["b" /* useCurrentIdentity */])() || { identifier: type["ProfileIdentifier"].unknown, nickname: 'Nothing' };
    const onChange = Object(react["useCallback"])(() => {
        if (identities.length > 1)
            setExpanded(!expanded);
    }, [identities.length, expanded]);
    return (Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.root }, { children: Object(jsx_runtime["jsxs"])(Accordion["a" /* default */], Object.assign({ classes: { root: classes.expansionPanelRoot }, expanded: expanded, onChange: onChange }, { children: [Object(jsx_runtime["jsx"])(AccordionSummary["a" /* default */], Object.assign({ classes: expansionPanelSummaryClasses, expandIcon: identities.length > 1 ? Object(jsx_runtime["jsx"])(ExpandMore_default.a, {}, void 0) : null }, { children: Object(jsx_runtime["jsx"])(SelectPeopleAndGroups["a" /* ProfileOrGroupInList */], Object.assign({ item: current, ListItemProps: { dense: true, classes: { root: classes.listItemRoot } } }, props.PersonOrGroupInListProps), void 0) }), void 0),
                identities.length ? (Object(jsx_runtime["jsx"])(List["a" /* default */], Object.assign({ classes: { root: classes.list } }, { children: identities.map((person) => person.identifier.equals(current.identifier) ? null : (Object(jsx_runtime["jsx"])(SelectPeopleAndGroups["a" /* ProfileOrGroupInList */], Object.assign({ item: person, ListItemProps: { dense: true, classes: { root: classes.listItemRoot } }, onClick: () => {
                            setExpanded(false);
                            ui.currentIdentity.value = person;
                            settings["k" /* currentSelectedIdentity */][ui.networkIdentifier].value = person.identifier.toText();
                        } }, props.PersonOrGroupInListProps), person.identifier.toText()))) }), void 0)) : null] }), void 0) }), void 0));
}
/**
 * This hook allows use <ChooseIdentity /> in a isolated scope without providing
 * verbose information.
 */
function useIsolatedChooseIdentity() {
    const all = Object(useActivatedUI["e" /* useMyIdentities */])();
    const whoami = Object(useActivatedUI["b" /* useCurrentIdentity */])();
    const [current, setCurrent] = Object(react["useState"])();
    const selected = current || whoami || undefined;
    return [
        selected || null,
        Object(jsx_runtime["jsx"])(ChooseIdentity, { current: selected, identities: all, onChangeIdentity: setCurrent }, void 0),
    ];
}

// EXTERNAL MODULE: ./node_modules/react-i18next/dist/es/I18nextProvider.js
var I18nextProvider = __webpack_require__(1556);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/i18n-next-ui.ts
var i18n_next_ui = __webpack_require__(10);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/i18n-next.ts
var i18n_next = __webpack_require__(59);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/hooks/useValueRef.ts
var useValueRef = __webpack_require__(40);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/utils.ts
var utils = __webpack_require__(12);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Wallet/messages.ts
var messages = __webpack_require__(32);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/hooks/useRemoteControlledDialog.ts
var useRemoteControlledDialog = __webpack_require__(57);

// EXTERNAL MODULE: ./node_modules/@material-ui/lab/esm/Alert/Alert.js + 4 modules
var Alert = __webpack_require__(1571);

// EXTERNAL MODULE: ./node_modules/react-use/esm/useAsyncRetry.js
var useAsyncRetry = __webpack_require__(391);

// CONCATENATED MODULE: ./packages/maskbook/src/extension/popup-page/UI.tsx



















const GlobalCss = Object(withStyles["a" /* default */])({
    '@global': {
        body: {
            overflowX: 'hidden',
            margin: '0 auto',
            width: 340,
            minHeight: 180,
            maxWidth: '100%',
            backgroundColor: 'transparent',
            '&::-webkit-scrollbar': {
                display: 'none',
            },
        },
    },
})(() => null);
const UI_useStyles = Object(makeStyles["a" /* default */])((theme) => ({
    container: {
        lineHeight: 1.75,
        padding: 20,
        borderRadius: 0,
        boxShadow: 'none',
        userSelect: 'none',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
    },
    header: {
        margin: theme.spacing(2, 0),
        '&:first-child': {
            marginTop: 0,
        },
    },
    logo: {
        display: 'block',
        width: 218,
        height: 50,
        margin: '16px auto 28px',
        pointerEvents: 'none',
    },
    title: {
        fontSize: 16,
        fontWeight: 500,
    },
    divider: {
        marginBottom: theme.spacing(2),
    },
    button: {
        fontSize: 16,
        fontWeight: 500,
        whiteSpace: 'nowrap',
    },
}));
function PopupUI() {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = UI_useStyles();
    const ui = Object(social_network_ui["getActivatedUI"])();
    const identities = Object(useValueRef["a" /* useValueRef */])(ui.myIdentitiesRef);
    const { value: hasPermission = true, retry: checkPermission } = Object(useAsyncRetry["a" /* default */])(ui.hasPermission);
    const onEnter = Object(react["useCallback"])((event) => {
        if (event.shiftKey) {
            browser.tabs.create({
                active: true,
                url: browser.runtime.getURL('/debug.html'),
            });
        }
        else {
            browser.runtime.openOptionsPage();
        }
    }, []);
    const [, setSelectProviderDailogOpen] = Object(useRemoteControlledDialog["a" /* useRemoteControlledDialog */])(messages["a" /* WalletMessages */].events.selectProviderDialogUpdated, lodash["noop"], 'activated');
    const onConnect = Object(react["useCallback"])(async () => {
        setSelectProviderDailogOpen({ open: true });
        await Object(utils["s" /* sleep */])(200);
        window.close();
    }, [setSelectProviderDailogOpen]);
    return (Object(jsx_runtime["jsxs"])(Paper["a" /* default */], Object.assign({ className: classes.container }, { children: [ui.networkIdentifier === 'localhost' ? (Object(jsx_runtime["jsx"])("img", { className: classes.logo, src: Object(utils["i" /* getUrl */])('MB--ComboCircle--Blue.svg') }, void 0)) : null,
            hasPermission === false ? (Object(jsx_runtime["jsxs"])(Alert["a" /* default */], Object.assign({ severity: "error", variant: "outlined", action: null }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], { children: t('popup_missing_permission') }, void 0),
                    Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ color: "primary", variant: "contained", size: "small", onClick: () => ui.requestPermission().then(checkPermission) }, { children: t('popup_request_permission') }), void 0)] }), void 0)) : null,
            ui.networkIdentifier === 'localhost' || identities.length === 0 ? null : (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ className: classes.header, display: "flex", justifyContent: "space-between" }, { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.title }, { children: t('popup_current_persona') }), void 0) }), void 0),
                    Object(jsx_runtime["jsx"])(ChooseIdentity, { identities: identities }, void 0)] }, void 0)),
            Object(jsx_runtime["jsx"])(Divider["a" /* default */], { className: classes.divider }, void 0),
            Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ display: "flex" }, { children: [ui.networkIdentifier !== 'localhost' && identities.length === 0 ? (Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ className: classes.button, variant: "text", onClick: onEnter }, { children: t('popup_setup_first_persona') }), void 0)) : (Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ className: classes.button, variant: "text", onClick: onEnter }, { children: t('popup_enter_dashboard') }), void 0)),
                    ui.networkIdentifier === 'localhost' ? null : (Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ className: classes.button, variant: "text", onClick: onConnect }, { children: t('popup_connect_wallet') }), void 0))] }), void 0)] }), void 0));
}
function Popup() {
    return (Object(jsx_runtime["jsx"])(ThemeProvider["a" /* default */], Object.assign({ theme: Object(theme["d" /* useMaskbookTheme */])() }, { children: Object(jsx_runtime["jsxs"])(I18nextProvider["a" /* I18nextProvider */], Object.assign({ i18n: i18n_next["a" /* default */] }, { children: [Object(jsx_runtime["jsx"])(GlobalCss, {}, void 0),
                Object(jsx_runtime["jsx"])(PopupUI, {}, void 0)] }), void 0) }), void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/extension/popup-page/index.tsx





/* harmony default export */ var popup_page = __webpack_exports__["default"] = (Object(SSRRenderer["a" /* SSRRenderer */])(Object(jsx_runtime["jsx"])(Popup, {}, void 0)));


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


/***/ })

/******/ });