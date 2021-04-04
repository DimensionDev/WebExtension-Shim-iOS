(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[152],{

/***/ 374:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return InitMyIdentitiesValueRef; });
/* harmony import */ var _utils_messages__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(55);
/* harmony import */ var _extension_service__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18);


function InitMyIdentitiesValueRef(self, network) {
    const ref = self.myIdentitiesRef;
    query(network, ref);
    _utils_messages__WEBPACK_IMPORTED_MODULE_0__[/* MaskMessage */ "a"].events.personaChanged.on((e) => e.some((x) => x.owned) && query(network, ref));
}
function query(network, ref) {
    _extension_service__WEBPACK_IMPORTED_MODULE_1__[/* default */ "b"].Identity.queryMyProfiles(network).then((p) => (ref.value = p));
}


/***/ }),

/***/ 479:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./packages/maskbook/src/polyfill/index.ts + 8 modules
var polyfill = __webpack_require__(808);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/ui.ts + 1 modules
var ui = __webpack_require__(38);

// EXTERNAL MODULE: ./packages/maskbook/src/provider.ui.ts + 55 modules
var provider_ui = __webpack_require__(802);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/LiveSelector.js
var LiveSelector = __webpack_require__(316);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Watcher.js + 83 modules
var Watcher = __webpack_require__(279);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Proxy.js + 1 modules
var Proxy = __webpack_require__(377);

// EXTERNAL MODULE: ./node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(0);

// EXTERNAL MODULE: ./packages/maskbook/src/protocols/typed-message/types.ts
var types = __webpack_require__(248);

// CONCATENATED MODULE: ./packages/maskbook/src/protocols/typed-message/debugger.tsx

// @ts-ignore
const React = __webpack_require__(24);

class debugger_TypedMessageFormatter {
    isTypedMessage(obj) {
        if (typeof obj !== 'object' || obj === null)
            return false;
        if (!('version' in obj))
            return false;
        if (!('meta' in obj))
            return false;
        if (!('type' in obj))
            return false;
        return true;
    }
    hasBody(obj) {
        if (!this.isTypedMessage(obj))
            return false;
        if (obj.type === 'empty')
            return false;
        return true;
    }
    compound(obj) {
        return (Object(jsx_runtime["jsx"])("div", Object.assign({ style: { maxWidth: '95vw', overflow: 'break-word' } }, { children: Object(jsx_runtime["jsx"])("ol", { children: obj.items.map((x) => (Object(jsx_runtime["jsx"])("li", { children: display(x) }, void 0))) }, void 0) }), void 0));
    }
    fields(obj) {
        return (Object(jsx_runtime["jsxs"])("table", { children: [Object(jsx_runtime["jsxs"])("tr", Object.assign({ style: { background: 'rgba(255, 255, 255, 0.6)' } }, { children: [Object(jsx_runtime["jsx"])("td", Object.assign({ style: { minWidth: '4em' } }, { children: "Field" }), void 0),
                        Object(jsx_runtime["jsx"])("td", { children: "Value" }, void 0)] }), void 0),
                Object.keys(obj)
                    .filter((x) => x !== 'type' && x !== 'meta' && x !== 'version')
                    .map((x) => (Object(jsx_runtime["jsxs"])("tr", { children: [Object(jsx_runtime["jsx"])("td", { children: x }, void 0),
                        display(obj[x])] }, void 0)))] }, void 0));
    }
    text(obj) {
        return Object(jsx_runtime["jsx"])("code", Object.assign({ style: { paddingLeft: '2em', opacity: 0.8 } }, { children: obj.content }), void 0);
    }
    image(obj) {
        if (typeof obj.image === 'string')
            return Object(jsx_runtime["jsx"])("img", { src: obj.image, height: (obj.height || 600) / 10, width: (obj.width || 400) / 10 }, void 0);
        return this.fields(obj);
    }
    body(obj) {
        if (Object(types["b" /* isTypedMessageCompound */])(obj))
            return this.compound(obj);
        if (Object(types["g" /* isTypedMessageText */])(obj))
            return this.text(obj);
        if (Object(types["d" /* isTypedMessageImage */])(obj))
            return this.image(obj);
        return this.fields(obj);
    }
    header(obj) {
        var _a;
        if (!this.isTypedMessage(obj))
            return null;
        return (Object(jsx_runtime["jsxs"])("div", { children: ["TypedMessage(", obj.type, ") ", (((_a = obj.meta) === null || _a === void 0 ? void 0 : _a.size) || 0) > 0 ? Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: ["(with meta ", display(obj.meta), ")"] }, void 0) : ''] }, void 0));
    }
}
function enhanceTypedMessageDebugger() {
    React.installCustomObjectFormatter(new debugger_TypedMessageFormatter());
}
function display(obj) {
    switch (typeof obj) {
        case 'string':
            return obj;
        default:
            // @ts-ignore
            return Object(jsx_runtime["jsx"])("object", { object: obj }, void 0);
    }
}

// CONCATENATED MODULE: ./packages/maskbook/src/setup.ui.ts





if (typeof window === 'object') {
    LiveSelector["a" /* LiveSelector */].enhanceDebugger();
    Watcher["a" /* Watcher */].enhanceDebugger();
    Proxy["a" /* DOMProxy */].enhanceDebugger();
    enhanceTypedMessageDebugger();
}
Object.assign(globalThis, {
    definedSocialNetworkUIs: ui["definedSocialNetworkUIs"],
});
Object(ui["activateSocialNetworkUI"])();


/***/ }),

/***/ 539:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return SetupGuideStep; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SetupGuide; });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(0);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_use__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1572);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(109);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(127);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(332);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(441);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(439);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(326);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(438);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(110);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(1562);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(331);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(932);
/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(1567);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(53);
/* harmony import */ var classnames__WEBPACK_IMPORTED_MODULE_15___default = /*#__PURE__*/__webpack_require__.n(classnames__WEBPACK_IMPORTED_MODULE_15__);
/* harmony import */ var react_feather__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(1568);
/* harmony import */ var _material_ui_icons_AlternateEmail__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(875);
/* harmony import */ var _material_ui_icons_AlternateEmail__WEBPACK_IMPORTED_MODULE_17___default = /*#__PURE__*/__webpack_require__.n(_material_ui_icons_AlternateEmail__WEBPACK_IMPORTED_MODULE_17__);
/* harmony import */ var _material_ui_icons_Close__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(187);
/* harmony import */ var _material_ui_icons_Close__WEBPACK_IMPORTED_MODULE_18___default = /*#__PURE__*/__webpack_require__.n(_material_ui_icons_Close__WEBPACK_IMPORTED_MODULE_18__);
/* harmony import */ var _material_ui_icons_ArrowBackIosOutlined__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(874);
/* harmony import */ var _material_ui_icons_ArrowBackIosOutlined__WEBPACK_IMPORTED_MODULE_19___default = /*#__PURE__*/__webpack_require__.n(_material_ui_icons_ArrowBackIosOutlined__WEBPACK_IMPORTED_MODULE_19__);
/* harmony import */ var json_stable_stringify__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(162);
/* harmony import */ var json_stable_stringify__WEBPACK_IMPORTED_MODULE_20___default = /*#__PURE__*/__webpack_require__.n(json_stable_stringify__WEBPACK_IMPORTED_MODULE_20__);
/* harmony import */ var _extension_options_page_DashboardComponents_ActionButton__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(47);
/* harmony import */ var lodash_es__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(13);
/* harmony import */ var lodash_es__WEBPACK_IMPORTED_MODULE_22___default = /*#__PURE__*/__webpack_require__.n(lodash_es__WEBPACK_IMPORTED_MODULE_22__);
/* harmony import */ var _utils_i18n_next_ui__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(10);
/* harmony import */ var _social_network_ui__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(38);
/* harmony import */ var _settings_settings__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(26);
/* harmony import */ var _utils_messages__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(55);
/* harmony import */ var _utils_hooks_useValueRef__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(40);
/* harmony import */ var _database_type__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(4);
/* harmony import */ var _extension_service__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(18);
/* harmony import */ var _plugins_Wallet_settings__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(101);
/* harmony import */ var _plugins_Wallet_messages__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(32);
/* harmony import */ var _utils_hooks_useMatchXS__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(112);






















var SetupGuideStep;
(function (SetupGuideStep) {
    SetupGuideStep["FindUsername"] = "find-username";
    SetupGuideStep["SayHelloWorld"] = "say-hello-world";
})(SetupGuideStep || (SetupGuideStep = {}));
//#region wizard dialog
const wizardTheme = (theme) => Object(lodash_es__WEBPACK_IMPORTED_MODULE_22__["merge"])(Object(lodash_es__WEBPACK_IMPORTED_MODULE_22__["cloneDeep"])(theme), {
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
            text: {
                height: 28,
                lineHeight: 1,
                paddingTop: 0,
                paddingBottom: 0,
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
const useWizardDialogStyles = Object(_material_ui_core__WEBPACK_IMPORTED_MODULE_3__[/* default */ "a"])((theme) => Object(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__[/* default */ "a"])({
    root: {
        padding: '56px 20px 48px',
        position: 'relative',
        boxShadow: theme.palette.type === 'dark' ? 'none' : theme.shadows[4],
        border: `${theme.palette.type === 'dark' ? 'solid' : 'none'} 1px ${theme.palette.divider}`,
        borderRadius: 12,
        [theme.breakpoints.down('xs')]: {
            padding: '35px 20px 16px',
            position: 'fixed',
            bottom: 0,
            left: 0,
            margin: 0,
            alignSelf: 'center',
            borderRadius: 0,
            boxShadow: 'none',
            border: `solid 1px ${theme.palette.divider}`,
            width: '100%',
        },
        userSelect: 'none',
        boxSizing: 'border-box',
        width: 320,
        overflow: 'hidden',
    },
    button: {
        width: 200,
        height: 40,
        marginLeft: 0,
        marginTop: 0,
        [theme.breakpoints.down('xs')]: {
            width: '100%',
            height: '45px !important',
            marginTop: 20,
            borderRadius: 0,
        },
        fontSize: 16,
        wordBreak: 'keep-all',
    },
    back: {
        color: theme.palette.text.primary,
        position: 'absolute',
        left: 10,
        top: 10,
    },
    close: {
        color: theme.palette.text.primary,
        position: 'absolute',
        right: 10,
        top: 10,
    },
    primary: {
        fontSize: 30,
        fontWeight: 500,
        lineHeight: '37px',
    },
    secondary: {
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.75,
        marginTop: 2,
    },
    sandbox: {
        marginTop: 16,
    },
    tip: {
        fontSize: 16,
        lineHeight: 1.75,
        marginBottom: 24,
    },
    textButton: {
        fontSize: 14,
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(-2),
    },
    header: {
        marginBottom: 0,
    },
    content: {},
    footer: {},
    progress: {
        left: 0,
        right: 0,
        bottom: 0,
        height: 8,
        position: 'absolute',
    },
}));
const useStyles = Object(_material_ui_core__WEBPACK_IMPORTED_MODULE_3__[/* default */ "a"])((theme) => {
    return {
        root: {
            alignItems: 'center',
        },
        content: {
            marginRight: 16,
        },
        footer: {
            marginLeft: 0,
            marginTop: 0,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
        },
        tip: {},
    };
});
function ContentUI(props) {
    const classes = useStyles(props);
    const xsMatch = Object(_utils_hooks_useMatchXS__WEBPACK_IMPORTED_MODULE_32__[/* useMatchXS */ "a"])();
    const wizardClasses = useWizardDialogStyles();
    switch (props.dialogType) {
        case SetupGuideStep.FindUsername:
            return (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsxs"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_5__[/* default */ "a"], Object.assign({ display: "block" }, { children: [Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsxs"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_5__[/* default */ "a"], Object.assign({ display: xsMatch ? 'flex' : 'block' }, { children: [Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])("main", Object.assign({ className: classes.content }, { children: props.content }), void 0),
                            Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"], Object.assign({ only: "xs" }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])("div", { children: props.tip }, void 0) }), void 0),
                            Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])("footer", Object.assign({ className: classes.footer }, { children: props.footer }), void 0)] }), void 0),
                    Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"], Object.assign({ smUp: true }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])("div", { children: props.tip }, void 0) }), void 0)] }), void 0));
        case SetupGuideStep.SayHelloWorld:
            return (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsxs"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_5__[/* default */ "a"], { children: [Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])("main", Object.assign({ className: classes.content }, { children: props.content }), void 0),
                    Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])("div", { children: props.tip }, void 0),
                    Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])("footer", Object.assign({ className: classes.footer }, { children: props.footer }), void 0)] }, void 0));
        default:
            return null;
    }
}
function WizardDialog(props) {
    const { t } = Object(_utils_i18n_next_ui__WEBPACK_IMPORTED_MODULE_23__[/* useI18N */ "a"])();
    const { title, dialogType, optional = false, completion, status, content, tip, footer, onBack, onClose } = props;
    const classes = useWizardDialogStyles(props);
    return (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"], Object.assign({ theme: wizardTheme }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"], Object.assign({ theme: (theme) => {
                const getSecondaryColor = () => {
                    switch (status) {
                        case true:
                            return theme.palette.success;
                        case false:
                            return theme.palette.error;
                        default:
                            return theme.palette.warning;
                    }
                };
                return Object(_material_ui_core__WEBPACK_IMPORTED_MODULE_8__[/* default */ "a"])({
                    ...theme,
                    palette: {
                        ...theme.palette,
                        secondary: getSecondaryColor(),
                    },
                });
            } }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsxs"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_9__[/* default */ "a"], Object.assign({ className: classes.root }, { children: [Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsxs"])("header", Object.assign({ className: classes.header }, { children: [Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_10__[/* default */ "a"], Object.assign({ className: classes.primary, color: "textPrimary", variant: "h1" }, { children: title }), void 0),
                            optional ? (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_10__[/* default */ "a"], Object.assign({ className: classes.secondary, color: "textSecondary", variant: "body2" }, { children: t('setup_guide_optional') }), void 0)) : null] }), void 0),
                    Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(ContentUI, { dialogType: dialogType, content: content, tip: tip, footer: footer }, void 0),
                    Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"], Object.assign({ only: "xs" }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_11__[/* default */ "a"], { className: classes.progress, color: "secondary", variant: "determinate", value: completion }, void 0) }), void 0),
                    onBack ? (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_12__[/* default */ "a"], Object.assign({ className: classes.back, size: "small", onClick: onBack }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_icons_ArrowBackIosOutlined__WEBPACK_IMPORTED_MODULE_19___default.a, { cursor: "pointer" }, void 0) }), void 0)) : null,
                    onClose ? (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_12__[/* default */ "a"], Object.assign({ className: classes.close, size: "small", onClick: onClose }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_icons_Close__WEBPACK_IMPORTED_MODULE_18___default.a, { cursor: "pointer" }, void 0) }), void 0)) : null] }), void 0) }), void 0) }), void 0));
}
//#endregion
//#region find username
const useFindUsernameStyles = Object(_material_ui_core__WEBPACK_IMPORTED_MODULE_3__[/* default */ "a"])((theme) => Object(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__[/* default */ "a"])({
    input: {
        marginTop: '45px !important',
        marginBottom: 24,
    },
    inputFocus: {
        '& svg': {
            color: theme.palette.primary.main,
        },
    },
    button: {
        marginLeft: theme.spacing(1),
    },
    icon: {
        color: 'inherit',
    },
}));
function FindUsername({ username, onConnect, onDone, onClose, onUsernameChange = lodash_es__WEBPACK_IMPORTED_MODULE_22__["noop"] }) {
    const { t } = Object(_utils_i18n_next_ui__WEBPACK_IMPORTED_MODULE_23__[/* useI18N */ "a"])();
    const ui = Object(_social_network_ui__WEBPACK_IMPORTED_MODULE_24__["getActivatedUI"])();
    const classes = useWizardDialogStyles();
    const findUsernameClasses = useFindUsernameStyles();
    const onKeyDown = (e) => {
        e.stopPropagation();
        if (e.key !== 'Enter')
            return;
        e.preventDefault();
        onConnect();
    };
    const onJump = Object(react__WEBPACK_IMPORTED_MODULE_1__["useCallback"])((ev) => {
        ev.preventDefault();
        ui.taskGotoProfilePage(new _database_type__WEBPACK_IMPORTED_MODULE_28__["ProfileIdentifier"](ui.networkIdentifier, username));
    }, [ui, username]);
    return (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(WizardDialog, { completion: 33.33, dialogType: SetupGuideStep.FindUsername, status: "undetermined", title: t('setup_guide_find_username_title'), content: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])("form", { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsxs"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_5__[/* default */ "a"], Object.assign({ className: findUsernameClasses.input, display: "flex", alignItems: "center" }, { children: [Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_13__[/* default */ "a"], { variant: "outlined", label: t('username'), value: username, disabled: !username, InputProps: {
                            classes: {
                                focused: findUsernameClasses.inputFocus,
                            },
                            startAdornment: (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_14__[/* default */ "a"], Object.assign({ position: "start" }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_icons_AlternateEmail__WEBPACK_IMPORTED_MODULE_17___default.a, { className: findUsernameClasses.icon }, void 0) }), void 0)),
                        }, onChange: (e) => onUsernameChange(e.target.value), onKeyDown: onKeyDown, inputProps: { 'data-testid': 'username_input' } }, void 0),
                    Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"], Object.assign({ only: "xs" }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_12__[/* default */ "a"], Object.assign({ className: findUsernameClasses.button, color: username ? 'primary' : 'default', disabled: !username }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(react_feather__WEBPACK_IMPORTED_MODULE_16__[/* default */ "a"], { className: findUsernameClasses.icon, cursor: "pinter", onClick: onJump }, void 0) }), void 0) }), void 0)] }), void 0) }, void 0), tip: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_10__[/* default */ "a"], { className: classes.tip, variant: "body2", dangerouslySetInnerHTML: { __html: t('setup_guide_find_username_text') } }, void 0), footer: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_extension_options_page_DashboardComponents_ActionButton__WEBPACK_IMPORTED_MODULE_21__[/* ActionButtonPromise */ "a"], Object.assign({ className: classes.button, variant: "contained", init: t('setup_guide_connect_auto'), waiting: t('connecting'), complete: t('done'), failed: t('setup_guide_connect_failed'), executor: onConnect, completeOnClick: onDone, disabled: !username, completeIcon: null, failIcon: null, failedOnClick: "use executor", "data-testid": "confirm_button" }, { children: t('confirm') }), void 0), onClose: onClose }, void 0));
}
//#endregion
//#region say hello world
const useSayHelloWorldStyles = Object(_material_ui_core__WEBPACK_IMPORTED_MODULE_3__[/* default */ "a"])((theme) => Object(_material_ui_core__WEBPACK_IMPORTED_MODULE_4__[/* default */ "a"])({
    primary: {
        marginTop: 24,
        marginBottom: 16,
    },
    secondary: {
        color: theme.palette.text.secondary,
        fontSize: 14,
    },
}));
function SayHelloWorld({ createStatus, onCreate, onSkip, onBack, onClose }) {
    const { t } = Object(_utils_i18n_next_ui__WEBPACK_IMPORTED_MODULE_23__[/* useI18N */ "a"])();
    const classes = useWizardDialogStyles();
    const sayHelloWorldClasses = useSayHelloWorldStyles();
    return (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(WizardDialog, { completion: 100, dialogType: SetupGuideStep.SayHelloWorld, status: createStatus, optional: true, title: t('setup_guide_say_hello_title'), tip: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsxs"])("form", { children: [Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_10__[/* default */ "a"], Object.assign({ className: classnames__WEBPACK_IMPORTED_MODULE_15___default()(classes.tip, sayHelloWorldClasses.primary), variant: "body2" }, { children: t('setup_guide_say_hello_primary') }), void 0),
                Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_10__[/* default */ "a"], Object.assign({ className: classnames__WEBPACK_IMPORTED_MODULE_15___default()(classes.tip, sayHelloWorldClasses.secondary), variant: "body2" }, { children: t('setup_guide_say_hello_secondary') }), void 0)] }, void 0), footer: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsxs"])(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["Fragment"], { children: [Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_extension_options_page_DashboardComponents_ActionButton__WEBPACK_IMPORTED_MODULE_21__[/* ActionButtonPromise */ "a"], { className: classes.button, variant: "contained", init: t('setup_guide_create_post_auto'), waiting: t('creating'), complete: t('done'), failed: t('setup_guide_create_post_failed'), executor: onCreate, completeOnClick: onSkip, completeIcon: null, failIcon: null, failedOnClick: "use executor", "data-testid": "create_button" }, void 0),
                Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_material_ui_core__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"], Object.assign({ only: "xs" }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(_extension_options_page_DashboardComponents_ActionButton__WEBPACK_IMPORTED_MODULE_21__[/* default */ "c"], Object.assign({ className: classes.textButton, color: "inherit", variant: "text", onClick: onSkip, "data-testid": "skip_button" }, { children: t('skip') }), void 0) }), void 0)] }, void 0), onBack: onBack, onClose: onClose }, void 0));
}
function SetupGuideUI(props) {
    const { t } = Object(_utils_i18n_next_ui__WEBPACK_IMPORTED_MODULE_23__[/* useI18N */ "a"])();
    const { persona } = props;
    const [step, setStep] = Object(react__WEBPACK_IMPORTED_MODULE_1__["useState"])(SetupGuideStep.FindUsername);
    const ui = Object(_social_network_ui__WEBPACK_IMPORTED_MODULE_24__["getActivatedUI"])();
    //#region parse setup status
    const lastStateRef = _settings_settings__WEBPACK_IMPORTED_MODULE_25__[/* currentSetupGuideStatus */ "l"][ui.networkIdentifier];
    const lastState_ = Object(_utils_hooks_useValueRef__WEBPACK_IMPORTED_MODULE_27__[/* useValueRef */ "a"])(lastStateRef);
    const lastState = Object(react__WEBPACK_IMPORTED_MODULE_1__["useMemo"])(() => {
        try {
            return JSON.parse(lastState_);
        }
        catch {
            return {};
        }
    }, [lastState_]);
    Object(react__WEBPACK_IMPORTED_MODULE_1__["useEffect"])(() => {
        if (!lastState.status)
            return;
        if (step === SetupGuideStep.FindUsername && lastState.username)
            setStep(lastState.status);
        else if (step === SetupGuideStep.SayHelloWorld && !lastState.username)
            setStep(SetupGuideStep.FindUsername);
    }, [step, setStep, lastState]);
    //#endregion
    //#region setup username
    const lastRecognized = Object(_utils_hooks_useValueRef__WEBPACK_IMPORTED_MODULE_27__[/* useValueRef */ "a"])(Object(_social_network_ui__WEBPACK_IMPORTED_MODULE_24__["getActivatedUI"])().lastRecognizedIdentity);
    const getUsername = () => lastState.username || (lastRecognized.identifier.isUnknown ? '' : lastRecognized.identifier.userId);
    const [username, setUsername] = Object(react__WEBPACK_IMPORTED_MODULE_1__["useState"])(getUsername);
    Object(react__WEBPACK_IMPORTED_MODULE_1__["useEffect"])(() => Object(_social_network_ui__WEBPACK_IMPORTED_MODULE_24__["getActivatedUI"])().lastRecognizedIdentity.addListener((val) => {
        if (username === '' && !val.identifier.isUnknown)
            setUsername(val.identifier.userId);
    }), [username]);
    //#endregion
    //#region create post status
    const [createStatus, setCreateStatus] = Object(react__WEBPACK_IMPORTED_MODULE_1__["useState"])('undetermined');
    //#endregion
    const copyToClipboard = Object(react_use__WEBPACK_IMPORTED_MODULE_2__[/* default */ "a"])()[1];
    const onNext = async () => {
        switch (step) {
            case SetupGuideStep.FindUsername:
                _settings_settings__WEBPACK_IMPORTED_MODULE_25__[/* currentSetupGuideStatus */ "l"][ui.networkIdentifier].value = json_stable_stringify__WEBPACK_IMPORTED_MODULE_20___default()({
                    status: SetupGuideStep.SayHelloWorld,
                    username,
                    persona: persona.toText(),
                });
                ui.taskGotoNewsFeedPage();
                setStep(SetupGuideStep.SayHelloWorld);
                break;
            case SetupGuideStep.SayHelloWorld:
                onClose();
                break;
        }
    };
    const onBack = async () => {
        switch (step) {
            case SetupGuideStep.SayHelloWorld:
                const username_ = getUsername();
                _settings_settings__WEBPACK_IMPORTED_MODULE_25__[/* currentSetupGuideStatus */ "l"][ui.networkIdentifier].value = json_stable_stringify__WEBPACK_IMPORTED_MODULE_20___default()({
                    status: SetupGuideStep.FindUsername,
                    username: '',
                    persona: persona.toText(),
                });
                const connected = new _database_type__WEBPACK_IMPORTED_MODULE_28__["ProfileIdentifier"](ui.networkIdentifier, username_);
                await _extension_service__WEBPACK_IMPORTED_MODULE_29__[/* default */ "b"].Identity.detachProfile(connected);
                setStep(SetupGuideStep.FindUsername);
                break;
        }
    };
    const onConnect = async () => {
        var _a, _b;
        // attach persona with SNS profile
        await _extension_service__WEBPACK_IMPORTED_MODULE_29__[/* default */ "b"].Identity.attachProfile(new _database_type__WEBPACK_IMPORTED_MODULE_28__["ProfileIdentifier"](ui.networkIdentifier, username), persona, {
            connectionConfirmState: 'confirmed',
        });
        // auto-finish the setup process
        const persona_ = await _extension_service__WEBPACK_IMPORTED_MODULE_29__[/* default */ "b"].Identity.queryPersona(_database_type__WEBPACK_IMPORTED_MODULE_28__["Identifier"].fromString(persona.toText(), _database_type__WEBPACK_IMPORTED_MODULE_28__["ECKeyIdentifier"]).unwrap());
        if (!persona_.hasPrivateKey)
            throw new Error('invalid persona');
        const [_, address] = await Promise.all([
            _extension_service__WEBPACK_IMPORTED_MODULE_29__[/* default */ "b"].Identity.setupPersona(persona_.identifier),
            _plugins_Wallet_messages__WEBPACK_IMPORTED_MODULE_31__[/* WalletRPC */ "b"].importFirstWallet({
                name: (_a = persona_.nickname) !== null && _a !== void 0 ? _a : t('untitled_wallet'),
                mnemonic: (_b = persona_.mnemonic) === null || _b === void 0 ? void 0 : _b.words.split(' '),
                passphrase: '',
            }),
        ]);
        if (address)
            _plugins_Wallet_settings__WEBPACK_IMPORTED_MODULE_30__[/* currentSelectedWalletAddressSettings */ "b"].value = address;
        _utils_messages__WEBPACK_IMPORTED_MODULE_26__[/* MaskMessage */ "a"].events.personaChanged.sendToAll([{ of: persona, owned: true, reason: 'new' }]);
    };
    const onCreate = async () => {
        const content = t('setup_guide_say_hello_content');
        copyToClipboard(content);
        ui.taskOpenComposeBox(content, {
            shareToEveryOne: true,
        });
    };
    const onClose = () => {
        var _a;
        _settings_settings__WEBPACK_IMPORTED_MODULE_25__[/* currentSetupGuideStatus */ "l"][ui.networkIdentifier].value = '';
        (_a = props.onClose) === null || _a === void 0 ? void 0 : _a.call(props);
    };
    switch (step) {
        case SetupGuideStep.FindUsername:
            return (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(FindUsername, { username: username, onUsernameChange: setUsername, onConnect: onConnect, onDone: onNext, onBack: onBack, onClose: onClose }, void 0));
        case SetupGuideStep.SayHelloWorld:
            return (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(SayHelloWorld, { createStatus: createStatus, onCreate: onCreate, onSkip: onNext, onBack: onBack, onClose: onClose }, void 0));
        default:
            return null;
    }
}
//#endregion
//#region setup guide
const useSetupGuideStyles = Object(_material_ui_core__WEBPACK_IMPORTED_MODULE_3__[/* default */ "a"])((theme) => ({
    root: {
        position: 'fixed',
        zIndex: 9999,
        maxWidth: 550,
        top: '2em',
        right: '2em',
    },
}));
function SetupGuide(props) {
    const classes = useSetupGuideStyles();
    return (Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])("div", Object.assign({ className: classes.root }, { children: Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__["jsx"])(SetupGuideUI, Object.assign({}, props), void 0) }), void 0));
}


/***/ }),

/***/ 540:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export checkPermissionApiUsability */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return useQueryNavigatorPermission; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var lodash_es__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/* harmony import */ var lodash_es__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash_es__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _flags__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(34);
/** This file is published under MIT License */



const q = ['query', 'request', 'revoke'];
function checkPermissionApiUsability(type) {
    const r = {};
    for (const v of q) {
        r[v] = Object(lodash_es__WEBPACK_IMPORTED_MODULE_1__["hasIn"])(navigator, `permissions.${v}`);
    }
    if (type) {
        return r[type];
    }
    return r;
}
function useQueryNavigatorPermission(needRequest, name) {
    const [permission, updatePermission] = Object(react__WEBPACK_IMPORTED_MODULE_0__["useState"])('prompt');
    Object(react__WEBPACK_IMPORTED_MODULE_0__["useEffect"])(() => {
        // TODO: Only camera related APi need to check Flags.has_no_WebRTC
        if (!needRequest || permission !== 'prompt' || _flags__WEBPACK_IMPORTED_MODULE_2__[/* Flags */ "a"].has_no_WebRTC)
            return;
        let permissionStatus;
        if (checkPermissionApiUsability('query')) {
            navigator.permissions
                .query({ name })
                .then((p) => {
                permissionStatus = p;
                permissionStatus.onchange = () => {
                    updatePermission(permissionStatus.state);
                };
                updatePermission(permissionStatus.state);
            })
                .catch((e) => {
                // for some user agents which implemented `query` method
                // but rise an error if specific permission name dose not supported
                updatePermission('granted');
            });
        }
        else if (checkPermissionApiUsability('request')) {
            navigator.permissions
                .request({ name })
                .then((p) => {
                updatePermission(p.state);
            })
                .catch(() => {
                updatePermission('granted');
            });
        }
        else {
            updatePermission('granted');
        }
        return () => {
            if (permissionStatus)
                permissionStatus.onchange = null;
        };
    }, [name, needRequest, permission]);
    return permission;
}


/***/ }),

/***/ 802:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/ui.ts + 1 modules
var ui = __webpack_require__(38);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/messages.ts
var utils_messages = __webpack_require__(55);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/service.ts + 1 modules
var service = __webpack_require__(18);

// EXTERNAL MODULE: ./node_modules/immer/dist/immer.esm.js
var immer_esm = __webpack_require__(226);

// EXTERNAL MODULE: ./packages/maskbook/src/database/IdentifierMap.ts
var IdentifierMap = __webpack_require__(82);

// EXTERNAL MODULE: ./packages/maskbook/src/database/type.ts
var type = __webpack_require__(4);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network/defaults/FriendsValueRef.ts





function hasFingerprint(x) {
    var _a;
    return !!((_a = x.linkedPersona) === null || _a === void 0 ? void 0 : _a.fingerprint);
}
function InitFriendsValueRef(self, network) {
    const ref = self.friendsRef;
    service["b" /* default */].Identity.queryProfiles(network).then((p) => {
        const next = new IdentifierMap["a" /* IdentifierMap */](new Map(), type["ProfileIdentifier"]);
        for (const each of p) {
            if (!hasFingerprint(each))
                continue;
            next.set(each.identifier, each);
        }
        ref.value = next;
    });
    utils_messages["a" /* MaskMessage */].events.profilesChanged.on(async (events) => {
        ref.value = await Object(immer_esm["a" /* default */])(ref.value, async (draft) => {
            for (const event of events) {
                if (event.of.network !== network)
                    continue;
                if (event.reason === 'delete')
                    draft.delete(event.of);
                else {
                    const data = await service["b" /* default */].Identity.queryProfile(event.of);
                    // Argument of type 'Profile' is not assignable to parameter of type 'WritableDraft<Profile>'.
                    if (data)
                        draft.set(event.of, data);
                    else
                        draft.delete(event.of);
                }
            }
        });
    });
}

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/defaults/MyIdentitiesRef.ts
var MyIdentitiesRef = __webpack_require__(374);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/shared-provider.ts
var shared_provider = __webpack_require__(314);

// EXTERNAL MODULE: ./node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(0);

// EXTERNAL MODULE: ./node_modules/react/index.js
var react = __webpack_require__(1);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/LiveSelector.js
var LiveSelector = __webpack_require__(316);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Watchers/MutationObserverWatcher.js
var MutationObserverWatcher = __webpack_require__(508);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/shadow-root/renderInShadowRoot.tsx
var renderInShadowRoot = __webpack_require__(89);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/makeStyles.js
var makeStyles = __webpack_require__(109);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Box/Box.js
var Box = __webpack_require__(332);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Tooltip/Tooltip.js
var Tooltip = __webpack_require__(1665);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Chip/Chip.js + 1 modules
var Chip = __webpack_require__(1698);

// EXTERNAL MODULE: ./node_modules/@material-ui/styles/esm/ThemeProvider/ThemeProvider.js
var ThemeProvider = __webpack_require__(439);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/DialogContent/DialogContent.js
var DialogContent = __webpack_require__(925);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/InputBase/InputBase.js + 1 modules
var InputBase = __webpack_require__(930);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Typography/Typography.js
var Typography = __webpack_require__(110);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/DialogActions/DialogActions.js
var DialogActions = __webpack_require__(1610);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Button/Button.js
var Button = __webpack_require__(297);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/CircularProgress/CircularProgress.js
var CircularProgress = __webpack_require__(1557);

// EXTERNAL MODULE: ./packages/maskbook/src/components/custom-ui-helper.tsx
var custom_ui_helper = __webpack_require__(19);

// EXTERNAL MODULE: ./packages/maskbook/src/components/DataSource/useActivatedUI.ts
var useActivatedUI = __webpack_require__(90);

// EXTERNAL MODULE: ./packages/maskbook/src/settings/settings.ts
var settings = __webpack_require__(26);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/hooks/useValueRef.ts
var useValueRef = __webpack_require__(40);

// EXTERNAL MODULE: ./node_modules/classnames/index.js
var classnames = __webpack_require__(53);
var classnames_default = /*#__PURE__*/__webpack_require__.n(classnames);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Done.js
var Done = __webpack_require__(318);
var Done_default = /*#__PURE__*/__webpack_require__.n(Done);

// EXTERNAL MODULE: ./packages/maskbook/src/components/shared/SelectPeopleAndGroups/resolveSpecialGroupName.ts
var resolveSpecialGroupName = __webpack_require__(361);

// CONCATENATED MODULE: ./packages/maskbook/src/components/shared/SelectRecipients/GroupInChip.tsx







const useStyles = Object(makeStyles["a" /* default */])({
    root: {
        marginRight: 6,
        marginBottom: 6,
        cursor: 'pointer',
    },
    icon: {
        backgroundColor: 'transparent !important',
    },
});
function GroupInChip(props) {
    var _a, _b;
    const classes = useStyles();
    const onClick = Object(react["useCallback"])((ev) => {
        if (props.onChange) {
            props.onChange(ev, !props.checked);
        }
    }, [props]);
    return (Object(jsx_runtime["jsx"])(Chip["a" /* default */], Object.assign({ avatar: props.checked ? Object(jsx_runtime["jsx"])(Done_default.a, { className: classes.icon }, void 0) : undefined, color: props.checked ? 'primary' : 'default', disabled: (_a = props.disabled) !== null && _a !== void 0 ? _a : false, onClick: onClick, label: Object(resolveSpecialGroupName["a" /* useResolveSpecialGroupName */])(props.item) }, props.ChipProps, { className: classnames_default()(classes.root, (_b = props.ChipProps) === null || _b === void 0 ? void 0 : _b.className), "data-testid": props.item.groupName }), void 0));
}

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Add.js
var Add = __webpack_require__(244);
var Add_default = /*#__PURE__*/__webpack_require__.n(Add);

// EXTERNAL MODULE: ./node_modules/fuse.js/dist/fuse.esm.js
var fuse_esm = __webpack_require__(335);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/List/List.js
var List = __webpack_require__(1608);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListItem/ListItem.js
var ListItem = __webpack_require__(1558);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListItemText/ListItemText.js
var ListItemText = __webpack_require__(1607);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/i18n-next-ui.ts
var i18n_next_ui = __webpack_require__(10);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Checkbox/Checkbox.js + 3 modules
var Checkbox = __webpack_require__(1693);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/ListItemAvatar/ListItemAvatar.js
var ListItemAvatar = __webpack_require__(1606);

// EXTERNAL MODULE: ./node_modules/react-highlight-words/dist/main.js
var dist_main = __webpack_require__(633);
var main_default = /*#__PURE__*/__webpack_require__.n(dist_main);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/components/Avatar.tsx
var Avatar = __webpack_require__(214);

// CONCATENATED MODULE: ./packages/maskbook/src/components/shared/SelectRecipients/ProfileInList.tsx







const useStyle = Object(makeStyles["a" /* default */])((theme) => ({
    root: {
        cursor: 'pointer',
        paddingLeft: 8,
    },
    overflow: {
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    },
    hightlighted: {
        backgroundColor: 'inherit',
        color: 'inherit',
        fontWeight: 'bold',
    },
}));
function ProfileInList(props) {
    var _a, _b, _c, _d, _e;
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(useStyle(), props);
    const profile = props.item;
    const name = profile.nickname || profile.identifier.userId;
    const secondary = ((_a = profile.linkedPersona) === null || _a === void 0 ? void 0 : _a.fingerprint) ? (_b = profile.linkedPersona) === null || _b === void 0 ? void 0 : _b.fingerprint.toLowerCase() : '';
    const onClick = Object(react["useCallback"])((ev) => props.onChange(ev, !props.checked), [props]);
    return (Object(jsx_runtime["jsxs"])(ListItem["a" /* default */], Object.assign({ button: true, onClick: onClick, disabled: props.disabled }, props.ListItemProps, { className: classnames_default()(classes.root, (_c = props.ListItemProps) === null || _c === void 0 ? void 0 : _c.className) }, { children: [Object(jsx_runtime["jsx"])(Checkbox["a" /* default */], Object.assign({ checked: props.checked, color: "primary" }, props.CheckboxProps), void 0),
            Object(jsx_runtime["jsx"])(ListItemAvatar["a" /* default */], { children: Object(jsx_runtime["jsx"])(Avatar["a" /* Avatar */], { person: profile }, void 0) }, void 0),
            Object(jsx_runtime["jsx"])(ListItemText["a" /* default */], { classes: {
                    primary: classes.overflow,
                    secondary: classes.overflow,
                }, primary: Object(jsx_runtime["jsx"])(main_default.a, { highlightClassName: classes.hightlighted, searchWords: [(_d = props.search) !== null && _d !== void 0 ? _d : ''], autoEscape: true, textToHighlight: name }, void 0), secondary: Object(jsx_runtime["jsx"])(main_default.a, { highlightClassName: classes.hightlighted, searchWords: [(_e = props.search) !== null && _e !== void 0 ? _e : ''], autoEscape: true, textToHighlight: secondary }, void 0) }, void 0)] }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/components/shared/InjectedDialog.tsx + 2 modules
var InjectedDialog = __webpack_require__(80);

// CONCATENATED MODULE: ./packages/maskbook/src/components/shared/SelectRecipients/SelectRecipientsDialog.tsx








const SelectRecipientsDialog_useStyles = Object(makeStyles["a" /* default */])((theme) => ({
    content: {
        padding: '0 !important',
    },
    title: {
        marginLeft: 6,
    },
    input: { flex: 1, minWidth: '10em', marginLeft: 20, marginTop: theme.spacing(1) },
}));
function SelectRecipientsDialogUI(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(SelectRecipientsDialog_useStyles(), props);
    const { items, disabledItems } = props;
    const [search, setSearch] = Object(react["useState"])('');
    const itemsAfterSearch = Object(react["useMemo"])(() => {
        const fuse = new fuse_esm["a" /* default */](items, {
            keys: ['identifier.userId', 'linkedPersona.fingerprint', 'nickname'],
            isCaseSensitive: false,
            ignoreLocation: true,
            threshold: 0,
        });
        return search === '' ? items : fuse.search(search).map((item) => item.item);
    }, [search, items]);
    const LIST_ITEM_HEIGHT = 56;
    return (Object(jsx_runtime["jsxs"])(InjectedDialog["a" /* InjectedDialog */], Object.assign({ open: props.open, title: t('select_specific_friends_dialog__title'), onClose: props.onClose }, { children: [Object(jsx_runtime["jsxs"])(DialogContent["a" /* default */], { children: [Object(jsx_runtime["jsx"])(InputBase["a" /* default */], { value: search, onChange: (e) => setSearch(e.target.value), className: classes.input, placeholder: t('search_box_placeholder') }, void 0),
                    Object(jsx_runtime["jsx"])(List["a" /* default */], Object.assign({ style: { height: items.length * LIST_ITEM_HEIGHT }, dense: true }, { children: itemsAfterSearch.length === 0 ? (Object(jsx_runtime["jsx"])(ListItem["a" /* default */], { children: Object(jsx_runtime["jsx"])(ListItemText["a" /* default */], { primary: t('no_search_result') }, void 0) }, void 0)) : (itemsAfterSearch.map((item) => (Object(jsx_runtime["jsx"])(ProfileInList, { item: item, search: search, checked: props.selected.some((x) => x.identifier.equals(item.identifier)) || (disabledItems === null || disabledItems === void 0 ? void 0 : disabledItems.includes(item)), disabled: props.disabled || (disabledItems === null || disabledItems === void 0 ? void 0 : disabledItems.includes(item)), onChange: (_, checked) => {
                                if (checked) {
                                    props.onSelect(item);
                                }
                                else {
                                    props.onDeselect(item);
                                }
                            } }, item.identifier.toText())))) }), void 0)] }, void 0),
            Object(jsx_runtime["jsx"])(DialogActions["a" /* default */], { children: Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ style: { marginLeft: 'auto' }, variant: "contained", disabled: props.submitDisabled, onClick: props.onSubmit }, { children: t('select_specific_friends_dialog__button') }), void 0) }, void 0)] }), void 0));
}

// EXTERNAL MODULE: ./node_modules/lodash-es/lodash.js
var lodash = __webpack_require__(13);

// CONCATENATED MODULE: ./packages/maskbook/src/components/shared/SelectRecipients/SelectRecipients.tsx











const SelectRecipients_useStyles = Object(makeStyles["a" /* default */])({
    root: {
        display: 'inline-flex',
        flexWrap: 'wrap',
    },
});
function SelectRecipientsUI(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(SelectRecipients_useStyles(), props);
    const { items, selected, onSetSelected, children } = props;
    const currentIdentity = Object(useActivatedUI["b" /* useCurrentIdentity */])();
    const groupItems = items.filter((x) => isGroup(x));
    const profileItems = items.filter((x) => { var _a; return isProfile(x) && !x.identifier.equals(currentIdentity === null || currentIdentity === void 0 ? void 0 : currentIdentity.identifier) && ((_a = x.linkedPersona) === null || _a === void 0 ? void 0 : _a.fingerprint); });
    const [open, setOpen] = Object(react["useState"])(false);
    const selectedProfiles = selected.filter((x) => isProfile(x));
    const selectedGroups = selected.filter((x) => isGroup(x));
    const selectedGroupMembers = Object(react["useMemo"])(() => selectedGroups.flatMap((group) => group.members).map((identifier) => identifier.toText()), [selectedGroups]);
    return (Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ className: classes.root }, { children: [groupItems.map((item) => (Object(jsx_runtime["jsx"])(GroupInChip, Object.assign({ item: item, checked: selectedGroups.some((x) => x.identifier.equals(item.identifier)), disabled: props.disabled, onChange: (_, checked) => {
                    if (checked)
                        onSetSelected([...selected, item]);
                    else
                        onSetSelected(Object(lodash["difference"])(selected, [item]));
                } }, props.GroupInChipProps), item.identifier.toText()))), children, Object(jsx_runtime["jsx"])(Chip["a" /* default */], { label: t('post_dialog__select_specific_friends_title', {
                    selected: new Set([...selectedGroupMembers, ...selectedProfiles.map((x) => x.identifier.toText())])
                        .size,
                }), avatar: Object(jsx_runtime["jsx"])(Add_default.a, {}, void 0), disabled: props.disabled || profileItems.length === 0, onClick: () => setOpen(true) }, void 0),
            Object(jsx_runtime["jsx"])(SelectRecipientsDialogUI, Object.assign({ open: open, items: profileItems, selected: profileItems.filter((x) => selected.includes(x)), disabledItems: profileItems.filter((x) => selectedGroupMembers.includes(x.identifier.toText())), disabled: false, submitDisabled: false, onSubmit: () => setOpen(false), onClose: () => setOpen(false), onSelect: (item) => onSetSelected([...selected, item]), onDeselect: (item) => onSetSelected(Object(lodash["difference"])(selected, [item])) }, props.SelectRecipientsDialogUIProps), void 0)] }), void 0));
}
SelectRecipientsUI.defaultProps = {
    frozenSelected: [],
};
function isProfile(x) {
    return x.identifier instanceof type["ProfileIdentifier"];
}
function isGroup(x) {
    return x.identifier instanceof type["GroupIdentifier"];
}

// CONCATENATED MODULE: ./packages/maskbook/src/components/shared/SelectRecipients/ClickableChip.tsx





const ClickableChip_useStyles = Object(makeStyles["a" /* default */])({
    root: {
        marginRight: 6,
        marginBottom: 6,
        cursor: 'pointer',
    },
    icon: {
        backgroundColor: 'transparent !important',
    },
    label: {
        display: 'flex',
    },
});
function ClickableChip(props) {
    var _a, _b;
    const classes = ClickableChip_useStyles();
    return (Object(jsx_runtime["jsx"])(Chip["a" /* default */], Object.assign({ avatar: props.checked ? Object(jsx_runtime["jsx"])(Done_default.a, { className: classes.icon }, void 0) : undefined, color: props.checked ? 'primary' : 'default' }, props, { classes: {
            ...props.classes,
            root: classnames_default()(classes.root, (_a = props.classes) === null || _a === void 0 ? void 0 : _a.root),
            label: classnames_default()(classes.label, (_b = props.classes) === null || _b === void 0 ? void 0 : _b.label),
        } }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/protocols/typed-message/index.ts + 3 modules
var typed_message = __webpack_require__(33);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/types.ts
var types = __webpack_require__(3);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/helpers.ts
var helpers = __webpack_require__(28);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/createMuiStrictModeTheme.js
var createMuiStrictModeTheme = __webpack_require__(326);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/utils.ts
var utils = __webpack_require__(12);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/RedPacket/theme.ts


const PluginRedPacketTheme = Object(createMuiStrictModeTheme["a" /* default */])({
    overrides: {
        MuiDialog: {
            paper: {
                backgroundColor: 'rgb(219,6,50) !important',
                color: 'white !important',
                position: 'relative',
                '&::after': {
                    position: 'absolute',
                    backgroundImage: `url(${Object(utils["i" /* getUrl */])('wallet/present-default.png')})`,
                    top: 250,
                    width: 60,
                    height: 60,
                    right: 8,
                    opacity: 0.8,
                    backgroundAttachment: 'local',
                    backgroundPosition: 'center',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    content: '""',
                },
            },
        },
        MuiDialogTitle: {
            root: {
                borderBottom: '1px solid rgba(199,26,57) !important',
            },
        },
        MuiChip: {
            root: {
                '&:hover': {
                    backgroundColor: 'rgb(240,60,60) !important',
                },
                backgroundColor: 'rgb(192,20,56) !important',
                color: 'white !important',
            },
            deleteIcon: {
                color: 'rgba(255, 255, 255, 0.46) !important',
                '&:hover': {
                    color: 'rgba(255, 255, 255, 0.8) !important',
                },
            },
            avatar: {
                color: 'rgba(255, 255, 255, 0.8) !important',
            },
        },
        MuiIconButton: {
            label: {
                color: 'white !important',
            },
        },
        MuiSwitch: {
            thumb: {
                color: 'white !important',
            },
            track: {
                '$checked$checked + &': {
                    backgroundColor: 'white !important',
                },
            },
        },
        MuiInputBase: {
            input: {
                color: 'white !important',
                '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7) !important',
                },
            },
        },
        MuiButton: {
            containedPrimary: {
                backgroundColor: 'white !important',
                color: 'rgb(219,6,50) !important',
            },
        },
    },
});

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/utils/url.ts
var utils_url = __webpack_require__(81);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/RedPacket/helpers.ts
var RedPacket_helpers = __webpack_require__(144);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/PluginUI.ts + 73 modules
var PluginUI = __webpack_require__(198);

// EXTERNAL MODULE: ./node_modules/ts-results/esm/index.js
var esm = __webpack_require__(70);

// EXTERNAL MODULE: ./packages/maskbook/src/components/shared/ErrorBoundary.tsx
var ErrorBoundary = __webpack_require__(117);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Card/Card.js
var Card = __webpack_require__(923);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/CardContent/CardContent.js
var CardContent = __webpack_require__(929);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/TextField/TextField.js + 1 modules
var TextField = __webpack_require__(932);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/CardActions/CardActions.js
var CardActions = __webpack_require__(1566);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Accordion/Accordion.js
var Accordion = __webpack_require__(1660);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/AccordionSummary/AccordionSummary.js
var AccordionSummary = __webpack_require__(1661);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/AccordionDetails/AccordionDetails.js
var AccordionDetails = __webpack_require__(1662);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/ExpandMore.js
var ExpandMore = __webpack_require__(281);
var ExpandMore_default = /*#__PURE__*/__webpack_require__.n(ExpandMore);

// EXTERNAL MODULE: ./node_modules/@material-ui/lab/esm/Autocomplete/Autocomplete.js + 2 modules
var Autocomplete = __webpack_require__(1696);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Popper/Popper.js
var Popper = __webpack_require__(1563);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/shadow-root/ShadowRootPortal.tsx
var ShadowRootPortal = __webpack_require__(142);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/shadow-root/ShadowRootPopper.tsx



function ShadowRootPopper(props) {
    return Object(jsx_runtime["jsx"])(Popper["a" /* default */], Object.assign({ container: ShadowRootPortal["a" /* PortalShadowRoot */] }, props), void 0);
}

// CONCATENATED MODULE: ./packages/maskbook/src/components/shared/DebugMetadataInspector.tsx








function DebugMetadataInspector(props) {
    const { meta, onExit, onNewMetadata } = props;
    const [field, setField] = Object(react["useState"])('');
    const [content, setContent] = Object(react["useState"])('{}');
    const knownMetadata = [...typed_message["r" /* metadataSchemaStoreReadonly */].keys()];
    const result = isValid(content);
    const isInvalid = result !== true;
    const editor = onNewMetadata ? (Object(jsx_runtime["jsxs"])(Card["a" /* default */], Object.assign({ variant: "outlined" }, { children: [Object(jsx_runtime["jsxs"])(CardContent["a" /* default */], { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ color: "textSecondary", gutterBottom: true }, { children: "Add new metadata or replace existing metadata" }), void 0),
                    Object(jsx_runtime["jsxs"])("form", { children: [Object(jsx_runtime["jsx"])(Autocomplete["a" /* default */], { autoComplete: true, freeSolo: true, options: knownMetadata, inputValue: field, onInputChange: (_, newValue) => setField(newValue), PopperComponent: ShadowRootPopper, renderInput: (params) => (Object(jsx_runtime["jsx"])(TextField["a" /* default */], Object.assign({}, params, { spellCheck: false, autoCapitalize: "off", autoComplete: "off", autoCorrect: "off", fullWidth: true, label: "Metadata Key", margin: "normal" }), void 0)) }, void 0),
                            Object(jsx_runtime["jsx"])(TextField["a" /* default */], { label: "Metadata content", value: content, onChange: (e) => setContent(e.currentTarget.value), multiline: true, fullWidth: true, spellCheck: false, autoCapitalize: "off", autoComplete: "off", autoCorrect: "off", error: isInvalid, helperText: Object(jsx_runtime["jsx"])("span", Object.assign({ style: { whiteSpace: 'pre-wrap' } }, { children: result }), void 0) }, void 0)] }, void 0)] }, void 0),
            Object(jsx_runtime["jsxs"])(CardActions["a" /* default */], { children: [Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ onClick: () => onNewMetadata(Object(typed_message["a" /* editMetadata */])(meta, (meta) => meta.set(field, JSON.parse(content)))), size: "small", variant: "contained", disabled: isInvalid || (field === null || field === void 0 ? void 0 : field.length) <= 3 }, { children: "Put metadata" }), void 0),
                    Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ onClick: () => {
                            setField('');
                            setContent('{}');
                        }, size: "small", variant: "text" }, { children: "Clear" }), void 0)] }, void 0)] }), void 0)) : null;
    return (Object(jsx_runtime["jsx"])(InjectedDialog["a" /* InjectedDialog */], Object.assign({ open: true, title: "Debug: Metadata Inspector", onClose: onExit }, { children: Object(jsx_runtime["jsxs"])(DialogContent["a" /* default */], { children: [editor, [...props.meta].map(([key, content]) => {
                    const editButton = onNewMetadata ? (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "contained", size: "small", color: "secondary", onClick: () => {
                                    setField(key);
                                    setContent(JSON.stringify(content, undefined, 4));
                                } }, { children: "Edit" }), void 0),
                            Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "text", size: "small", color: "secondary", onClick: () => onNewMetadata(Object(typed_message["a" /* editMetadata */])(meta, (meta) => meta.delete(key))) }, { children: "Delete" }), void 0)] }, void 0)) : null;
                    return (Object(jsx_runtime["jsxs"])(Accordion["a" /* default */], { children: [Object(jsx_runtime["jsxs"])(AccordionSummary["a" /* default */], Object.assign({ expandIcon: Object(jsx_runtime["jsx"])(ExpandMore_default.a, {}, void 0) }, { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ style: { alignSelf: 'center' } }, { children: key }), void 0),
                                    Object(jsx_runtime["jsx"])(Box["a" /* default */], { flex: 1 }, void 0),
                                    Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ onClick: (e) => e.stopPropagation() }, { children: editButton }), void 0)] }), void 0),
                            Object(jsx_runtime["jsx"])(AccordionDetails["a" /* default */], { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], { component: "code", children: JSON.stringify(content, undefined, 4), style: { whiteSpace: 'pre-wrap' } }, void 0) }, void 0)] }, key));
                })] }, void 0) }), void 0));
    function isValid(newData) {
        try {
            JSON.parse(newData);
        }
        catch {
            return 'Invalid JSON';
        }
        const validator = typed_message["r" /* metadataSchemaStoreReadonly */].get(field);
        if (validator) {
            const valid = Object(typed_message["d" /* isDataMatchJSONSchema */])(JSON.parse(newData), validator);
            if (valid.err)
                return 'Metadata content is invalid:\n' + valid.val.map((x) => '    ' + x.message).join('\n');
        }
        return true;
    }
}

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/types.ts
var plugins_types = __webpack_require__(97);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Election2020/helpers.ts
var Election2020_helpers = __webpack_require__(353);

// CONCATENATED MODULE: ./packages/maskbook/src/components/InjectedComponents/PostDialog.tsx


























const defaultTheme = {};
const PostDialog_useStyles = Object(makeStyles["a" /* default */])({
    MUIInputRoot: {
        minHeight: 108,
        flexDirection: 'column',
        padding: 10,
        boxSizing: 'border-box',
    },
    MUIInputInput: {
        fontSize: 18,
        minHeight: '8em',
    },
    sup: {
        paddingLeft: 2,
    },
});
function PostDialogUI(props) {
    var _a;
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(PostDialog_useStyles(), props);
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const isDebug = Object(useValueRef["a" /* useValueRef */])(settings["n" /* debugModeSetting */]);
    const [showPostMetadata, setShowPostMetadata] = Object(react["useState"])(false);
    const onPostContentChange = (e) => {
        const newText = e.target.value;
        const msg = props.postContent;
        if (Object(typed_message["j" /* isTypedMessageText */])(msg))
            props.onPostContentChanged(Object(typed_message["q" /* makeTypedMessageText */])(newText, msg.meta));
        else
            throw new Error('Not impled yet');
    };
    if (!Object(typed_message["j" /* isTypedMessageText */])(props.postContent))
        return Object(jsx_runtime["jsx"])(jsx_runtime["Fragment"], { children: "Unsupported type to edit" }, void 0);
    const metadataBadge = [...PluginUI["a" /* PluginUI */]].flatMap((plugin) => esm["c" /* Result */].wrap(() => {
        const knownMeta = plugin.postDialogMetadataBadge;
        if (!knownMeta)
            return undefined;
        return [...knownMeta.entries()].map(([metadataKey, tag]) => {
            return Object(typed_message["t" /* renderWithMetadataUntyped */])(props.postContent.meta, metadataKey, (r) => (Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ marginRight: 1, marginTop: 1, display: "inline-block" }, { children: Object(jsx_runtime["jsx"])(Tooltip["a" /* default */], Object.assign({ title: `Provided by plugin "${plugin.pluginName}"` }, { children: Object(jsx_runtime["jsx"])(Chip["a" /* default */], { onDelete: () => Object(ui["editActivatedPostMetadata"])((meta) => meta.delete(metadataKey)), label: tag(r) }, void 0) }), void 0) }), metadataKey)));
        });
    }).unwrapOr(null));
    const pluginEntries = [...PluginUI["a" /* PluginUI */]].flatMap((plugin) => esm["c" /* Result */].wrap(() => {
        const entries = plugin.postDialogEntries;
        if (!entries)
            return null;
        return entries.map((opt, index) => {
            return (Object(jsx_runtime["jsx"])(ErrorBoundary["a" /* ErrorBoundary */], Object.assign({ contain: `Plugin "${plugin.pluginName}"` }, { children: Object(jsx_runtime["jsx"])(ClickableChip, { label: Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [opt.label, plugin.stage === plugins_types["b" /* PluginStage */].Beta && Object(jsx_runtime["jsx"])("sup", Object.assign({ className: classes.sup }, { children: "(Beta)" }), void 0)] }, void 0), onClick: opt.onClick }, void 0) }), plugin.identifier + ' ' + index));
        });
    }).unwrapOr(null));
    return (Object(jsx_runtime["jsx"])(jsx_runtime["Fragment"], { children: Object(jsx_runtime["jsx"])(ThemeProvider["a" /* default */], Object.assign({ theme: (_a = props.theme) !== null && _a !== void 0 ? _a : defaultTheme }, { children: Object(jsx_runtime["jsxs"])(InjectedDialog["a" /* InjectedDialog */], Object.assign({ open: props.open, onClose: props.onCloseButtonClicked, title: t('post_dialog__title') }, { children: [Object(jsx_runtime["jsxs"])(DialogContent["a" /* default */], { children: [metadataBadge, Object(jsx_runtime["jsx"])(InputBase["a" /* default */], { classes: {
                                    root: classes.MUIInputRoot,
                                    input: classes.MUIInputInput,
                                }, autoFocus: true, value: props.postContent.content, onChange: onPostContentChange, fullWidth: true, multiline: true, placeholder: t('post_dialog__placeholder'), inputProps: { 'data-testid': 'text_textarea' } }, void 0),
                            Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ style: { marginBottom: 10 } }, { children: ["Plugins ", Object(jsx_runtime["jsx"])("sup", { children: "(Experimental)" }, void 0)] }), void 0),
                            Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ style: { marginBottom: 10 }, display: "flex", flexWrap: "wrap" }, { children: pluginEntries }), void 0),
                            Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ style: { marginBottom: 10 } }, { children: t('post_dialog__select_recipients_title') }), void 0),
                            Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ style: { marginBottom: 10 }, display: "flex", flexWrap: "wrap" }, { children: Object(jsx_runtime["jsxs"])(SelectRecipientsUI, Object.assign({ disabled: props.onlyMyself || props.shareToEveryone, items: props.availableShareTarget, selected: props.currentShareTarget, onSetSelected: props.onSetSelected }, props.SelectRecipientsUIProps, { children: [Object(jsx_runtime["jsx"])(ClickableChip, { checked: props.shareToEveryone, disabled: props.onlyMyself, label: t('post_dialog__select_recipients_share_to_everyone'), "data-testid": "_everyone_group_", onClick: () => props.onShareToEveryoneChanged(!props.shareToEveryone) }, void 0),
                                        Object(jsx_runtime["jsx"])(ClickableChip, { checked: props.onlyMyself, disabled: props.shareToEveryone, label: t('post_dialog__select_recipients_only_myself'), "data-testid": "_only_myself_group_", onClick: () => props.onOnlyMyselfChanged(!props.onlyMyself) }, void 0)] }), void 0) }), void 0),
                            Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ style: { marginBottom: 10 } }, { children: t('post_dialog__more_options_title') }), void 0),
                            Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ style: { marginBottom: 10 }, display: "flex", flexWrap: "wrap" }, { children: [Object(jsx_runtime["jsx"])(ClickableChip, { checked: props.imagePayload, label: t('post_dialog__image_payload'), onClick: () => props.onImagePayloadSwitchChanged(!props.imagePayload), "data-testid": "image_chip" }, void 0),
                                    isDebug && (Object(jsx_runtime["jsx"])(Chip["a" /* default */], { label: "Post metadata inspector", onClick: () => setShowPostMetadata((e) => !e) }, void 0)),
                                    showPostMetadata && (Object(jsx_runtime["jsx"])(DebugMetadataInspector, { onNewMetadata: (meta) => (Object(ui["getActivatedUI"])().typedMessageMetadata.value = meta), onExit: () => setShowPostMetadata(false), meta: props.postContent.meta || new Map() }, void 0))] }), void 0)] }, void 0),
                    Object(jsx_runtime["jsxs"])(DialogActions["a" /* default */], { children: [Object(typed_message["j" /* isTypedMessageText */])(props.postContent) && props.maxLength ? (Object(jsx_runtime["jsx"])(CharLimitIndicator, { value: props.postContent.content.length, max: props.maxLength }, void 0)) : null,
                            Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "contained", disabled: props.postBoxButtonDisabled, onClick: props.onFinishButtonClicked, "data-testid": "finish_button" }, { children: t('post_dialog__button') }), void 0)] }, void 0)] }), void 0) }), void 0) }, void 0));
}
function PostDialog({ reason: props_reason = 'timeline', ...props }) {
    var _a, _b;
    const { t, i18n } = Object(i18n_next_ui["a" /* useI18N */])();
    const [onlyMyselfLocal, setOnlyMyself] = Object(react["useState"])(false);
    const onlyMyself = (_a = props.onlyMyself) !== null && _a !== void 0 ? _a : onlyMyselfLocal;
    const [shareToEveryoneLocal, setShareToEveryone] = Object(react["useState"])(true);
    const shareToEveryone = (_b = props.shareToEveryone) !== null && _b !== void 0 ? _b : shareToEveryoneLocal;
    const typedMessageMetadata = Object(custom_ui_helper["c" /* or */])(props.typedMessageMetadata, Object(useValueRef["a" /* useValueRef */])(Object(ui["getActivatedUI"])().typedMessageMetadata));
    const [open, setOpen] = Object(custom_ui_helper["c" /* or */])(props.open, Object(react["useState"])(false));
    //#region TypedMessage
    const [postBoxContent, setPostBoxContent] = Object(react["useState"])(Object(typed_message["q" /* makeTypedMessageText */])('', typedMessageMetadata));
    Object(react["useEffect"])(() => {
        if (typedMessageMetadata !== postBoxContent.meta)
            setPostBoxContent({ ...postBoxContent, meta: typedMessageMetadata });
    }, [typedMessageMetadata, postBoxContent]);
    //#endregion
    //#region Share target
    const people = Object(useActivatedUI["c" /* useFriendsList */])();
    const groups = Object(useActivatedUI["a" /* useCurrentGroupsList */])();
    const availableShareTarget = Object(custom_ui_helper["c" /* or */])(props.availableShareTarget, Object(react["useMemo"])(() => [...groups, ...people], [people, groups]));
    const currentIdentity = Object(custom_ui_helper["c" /* or */])(props.currentIdentity, Object(useActivatedUI["b" /* useCurrentIdentity */])());
    const [currentShareTarget, setCurrentShareTarget] = Object(react["useState"])(() => []);
    //#endregion
    //#region Image Based Payload Switch
    const imagePayloadStatus = Object(useValueRef["a" /* useValueRef */])(settings["g" /* currentImagePayloadStatus */][Object(ui["getActivatedUI"])().networkIdentifier]);
    const imagePayloadEnabled = imagePayloadStatus === 'true';
    const onImagePayloadSwitchChanged = Object(custom_ui_helper["c" /* or */])(props.onImagePayloadSwitchChanged, Object(react["useCallback"])((checked) => {
        settings["g" /* currentImagePayloadStatus */][Object(ui["getActivatedUI"])().networkIdentifier].value = String(checked);
    }, []));
    //#endregion
    //#region callbacks
    const onRequestPost = Object(custom_ui_helper["c" /* or */])(props.onRequestPost, Object(react["useCallback"])(async (target, content) => {
        var _a, _b, _c, _d, _e;
        const [encrypted, token] = await service["b" /* default */].Crypto.encryptTo(content, target.map((x) => x.identifier), currentIdentity.identifier, !!shareToEveryone);
        const activeUI = Object(ui["getActivatedUI"])();
        // TODO: move into the plugin system
        const redPacketMetadata = Object(RedPacket_helpers["c" /* RedPacketMetadataReader */])(typedMessageMetadata);
        const election2020Metadata = Object(Election2020_helpers["a" /* Election2020MetadataReader */])(typedMessageMetadata);
        if (imagePayloadEnabled) {
            const isRedPacket = redPacketMetadata.ok;
            const isElection2020 = election2020Metadata.ok;
            const isErc20 = redPacketMetadata.ok &&
                redPacketMetadata.val &&
                redPacketMetadata.val.token &&
                redPacketMetadata.val.token_type === types["c" /* EthereumTokenType */].ERC20;
            const isDai = isErc20 && redPacketMetadata.ok && Object(helpers["h" /* isDAI */])((_b = (_a = redPacketMetadata.val.token) === null || _a === void 0 ? void 0 : _a.address) !== null && _b !== void 0 ? _b : '');
            const isOkb = isErc20 && redPacketMetadata.ok && Object(helpers["i" /* isOKB */])((_d = (_c = redPacketMetadata.val.token) === null || _c === void 0 ? void 0 : _c.address) !== null && _d !== void 0 ? _d : '');
            const relatedText = t('additional_post_box__steganography_post_pre', {
                random: new Date().toLocaleString(),
            });
            activeUI.taskPasteIntoPostBox(relatedText, {
                shouldOpenPostDialog: false,
                autoPasteFailedRecover: false,
            });
            activeUI.taskUploadToPostBox(encrypted, {
                template: isRedPacket ? (isDai ? 'dai' : isOkb ? 'okb' : 'eth') : isElection2020 ? 'v3' : 'v2',
                autoPasteFailedRecover: true,
                relatedText,
            });
        }
        else {
            let text = t('additional_post_box__encrypted_post_pre', { encrypted });
            if (redPacketMetadata.ok) {
                if ((_e = i18n.language) === null || _e === void 0 ? void 0 : _e.includes('zh')) {
                    text =
                        activeUI.networkIdentifier === utils_url["e" /* twitterUrl */].hostIdentifier
                            ? `用 #mask_io @realMaskbook 開啟紅包 ${encrypted}`
                            : `用 #mask_io 開啟紅包 ${encrypted}`;
                }
                else {
                    text =
                        activeUI.networkIdentifier === utils_url["e" /* twitterUrl */].hostIdentifier
                            ? `Claim this Red Packet with #mask_io @realMaskbook ${encrypted}`
                            : `Claim this Red Packet with #mask_io ${encrypted}`;
                }
            }
            if (election2020Metadata.ok) {
                text = `Claim the election special NFT with @realMaskbook (mask.io) #mask_io #twitternft ${encrypted}`;
            }
            activeUI.taskPasteIntoPostBox(text, {
                autoPasteFailedRecover: true,
                shouldOpenPostDialog: false,
            });
        }
        // This step write data on gun.
        // there is nothing to write if it shared with public
        if (!shareToEveryone)
            service["b" /* default */].Crypto.publishPostAESKey(token);
    }, [currentIdentity, shareToEveryone, typedMessageMetadata, imagePayloadEnabled, t, i18n.language]));
    const onRequestReset = Object(custom_ui_helper["c" /* or */])(props.onRequestReset, Object(react["useCallback"])(() => {
        setOpen(false);
        setOnlyMyself(false);
        setShareToEveryone(true);
        setPostBoxContent(Object(typed_message["q" /* makeTypedMessageText */])(''));
        setCurrentShareTarget([]);
        Object(ui["getActivatedUI"])().typedMessageMetadata.value = new Map();
    }, [setOpen]));
    const onFinishButtonClicked = Object(react["useCallback"])(() => {
        onRequestPost(onlyMyself ? [currentIdentity] : currentShareTarget, postBoxContent);
        onRequestReset();
    }, [currentIdentity, currentShareTarget, onRequestPost, onRequestReset, onlyMyself, postBoxContent]);
    const onCloseButtonClicked = Object(react["useCallback"])(() => {
        setOpen(false);
    }, [setOpen]);
    //#endregion
    //#region My Identity
    const identities = Object(useActivatedUI["e" /* useMyIdentities */])();
    Object(react["useEffect"])(() => {
        return utils_messages["a" /* MaskMessage */].events.compositionUpdated.on(({ reason, open, content, options }) => {
            if (reason !== props_reason || identities.length <= 0)
                return;
            setOpen(open);
            if (content)
                setPostBoxContent(Object(typed_message["q" /* makeTypedMessageText */])(content));
            if (options === null || options === void 0 ? void 0 : options.onlyMySelf)
                setOnlyMyself(true);
            if (options === null || options === void 0 ? void 0 : options.shareToEveryOne)
                setShareToEveryone(true);
        });
    }, [identities.length, props_reason, setOpen]);
    const onOnlyMyselfChanged = Object(custom_ui_helper["c" /* or */])(props.onOnlyMyselfChanged, Object(react["useCallback"])((checked) => {
        setOnlyMyself(checked);
        checked && setShareToEveryone(false);
    }, []));
    const onShareToEveryoneChanged = Object(custom_ui_helper["c" /* or */])(props.onShareToEveryoneChanged, Object(react["useCallback"])((checked) => {
        setShareToEveryone(checked);
        checked && setOnlyMyself(false);
    }, []));
    //#endregion
    //#region Red Packet
    // TODO: move into the plugin system
    const hasRedPacket = Object(RedPacket_helpers["c" /* RedPacketMetadataReader */])(postBoxContent.meta).ok;
    const theme = hasRedPacket ? PluginRedPacketTheme : undefined;
    const mustSelectShareToEveryone = hasRedPacket && !shareToEveryone;
    Object(react["useEffect"])(() => {
        if (mustSelectShareToEveryone)
            onShareToEveryoneChanged(true);
    }, [mustSelectShareToEveryone, onShareToEveryoneChanged]);
    //#endregion
    const isPostButtonDisabled = !(() => {
        const text = Object(typed_message["b" /* extractTextFromTypedMessage */])(postBoxContent);
        if (text.ok && text.val.length > 560)
            return false;
        return onlyMyself || shareToEveryoneLocal ? text.val : currentShareTarget.length && text;
    })();
    return (Object(jsx_runtime["jsx"])(PostDialogUI, Object.assign({ theme: theme, shareToEveryone: shareToEveryoneLocal, onlyMyself: onlyMyself, availableShareTarget: availableShareTarget, imagePayload: imagePayloadEnabled, currentIdentity: currentIdentity, currentShareTarget: currentShareTarget, postContent: postBoxContent, postBoxButtonDisabled: isPostButtonDisabled, maxLength: 560, onSetSelected: setCurrentShareTarget, onPostContentChanged: setPostBoxContent, onShareToEveryoneChanged: onShareToEveryoneChanged, onOnlyMyselfChanged: onOnlyMyselfChanged, onImagePayloadSwitchChanged: onImagePayloadSwitchChanged, onFinishButtonClicked: onFinishButtonClicked, onCloseButtonClicked: onCloseButtonClicked }, props, { open: open }), void 0));
}
function CharLimitIndicator({ value, max, ...props }) {
    const displayLabel = max - value < 40;
    const normalized = Math.min((value / max) * 100, 100);
    const style = { transitionProperty: 'transform,width,height,color' };
    return (Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ position: "relative", display: "inline-flex" }, { children: [Object(jsx_runtime["jsx"])(CircularProgress["a" /* default */], Object.assign({ variant: "static", value: normalized, color: displayLabel ? 'secondary' : 'primary', size: displayLabel ? void 0 : 16 }, props, { style: value >= max ? { color: 'red', ...style, ...props.style } : { ...style, ...props.style } }), void 0),
            displayLabel ? (Object(jsx_runtime["jsx"])(Box["a" /* default */], Object.assign({ top: 0, left: 0, bottom: 0, right: 0, position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }, { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ variant: "caption", component: "div", color: "textSecondary" }, { children: max - value }), void 0) }), void 0)) : null] }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/isMobile.ts
var facebook_com_isMobile = __webpack_require__(87);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/IconButton/IconButton.js
var IconButton = __webpack_require__(331);

// EXTERNAL MODULE: ./packages/maskbook/src/resources/MaskbookIcon.tsx
var MaskbookIcon = __webpack_require__(134);

// CONCATENATED MODULE: ./packages/maskbook/src/components/InjectedComponents/PostDialogHint.tsx











const PostDialogHint_useStyles = Object(makeStyles["a" /* default */])((theme) => ({
    button: {
        padding: facebook_com_isMobile["b" /* isMobileFacebook */] ? 0 : '8px',
    },
    text: {
        fontSize: 14,
        color: '#606770',
        marginLeft: theme.spacing(1),
    },
    wrapper: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '8px 10px',
        borderBottom: '1px solid #dadde1',
    },
}));
const EntryIconButton = Object(react["memo"])((props) => {
    const classes = PostDialogHint_useStyles();
    return (Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ className: classes.button, onClick: props.onHintButtonClicked }, { children: Object(jsx_runtime["jsx"])(MaskbookIcon["b" /* MaskbookSharpIcon */], {}, void 0) }), void 0));
});
const PostDialogHint_PostDialogHintUI = Object(react["memo"])(function PostDialogHintUI({ onHintButtonClicked }) {
    const classes = PostDialogHint_useStyles();
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    return facebook_com_isMobile["b" /* isMobileFacebook */] ? (Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.wrapper, onClick: onHintButtonClicked }, { children: [Object(jsx_runtime["jsx"])(EntryIconButton, { onHintButtonClicked: () => undefined }, void 0),
            Object(jsx_runtime["jsx"])("span", Object.assign({ className: classes.text }, { children: t('post_modal_hint__button') }), void 0)] }), void 0)) : (Object(jsx_runtime["jsx"])(EntryIconButton, { onHintButtonClicked: onHintButtonClicked }, void 0));
});
function PostDialogHint(props) {
    const identities = Object(useActivatedUI["e" /* useMyIdentities */])();
    const connecting = Object(useValueRef["a" /* useValueRef */])(settings["l" /* currentSetupGuideStatus */][Object(ui["getActivatedUI"])().networkIdentifier]);
    if (connecting || identities.length === 0)
        return null;
    return Object(jsx_runtime["jsx"])(PostDialogHint_PostDialogHintUI, Object.assign({ onHintButtonClicked: () => { } }, props), void 0);
}

// EXTERNAL MODULE: ./packages/maskbook/src/utils/watcher.ts
var utils_watcher = __webpack_require__(104);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/UI/injectPostBox.tsx









let composeBox;
if (facebook_com_isMobile["b" /* isMobileFacebook */]) {
    composeBox = new LiveSelector["a" /* LiveSelector */]().querySelector('#structured_composer_form');
}
else {
    composeBox = new LiveSelector["a" /* LiveSelector */]()
        .querySelector('[role="dialog"] form')
        .querySelectorAll('[role="button"][tabindex="0"], [role="button"][tabindex="-1"]')
        .map((x) => x.parentElement)
        // TODO: should be nth(-1), see https://github.com/DimensionDev/Holoflows-Kit/issues/270
        .reverse()
        .nth(2)
        .map((x) => x.parentElement);
}
function injectPostBoxFacebook() {
    const watcher = new MutationObserverWatcher["a" /* MutationObserverWatcher */](composeBox.clone());
    Object(utils_watcher["a" /* startWatch */])(watcher);
    Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(UI, {}, void 0), {
        shadow: () => watcher.firstDOMProxy.afterShadow,
        rootProps: {
            style: {
                display: 'block',
                padding: 0,
                marginTop: 0,
            },
        },
    });
}
function UI() {
    const onHintButtonClicked = Object(react["useCallback"])(() => utils_messages["a" /* MaskMessage */].events.compositionUpdated.sendToLocal({ reason: 'popup', open: true }), []);
    return (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(PostDialogHint, { onHintButtonClicked: onHintButtonClicked }, void 0),
            Object(jsx_runtime["jsx"])(PostDialog, { reason: "popup" }, void 0)] }, void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/components/shared/NotSetupYetPrompt.tsx + 1 modules
var NotSetupYetPrompt = __webpack_require__(379);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/UI/injectSetupPrompt.tsx






let injectSetupPrompt_composeBox;
if (facebook_com_isMobile["b" /* isMobileFacebook */]) {
    injectSetupPrompt_composeBox = new LiveSelector["a" /* LiveSelector */]().querySelector('#structured_composer_form');
}
else {
    injectSetupPrompt_composeBox = new LiveSelector["a" /* LiveSelector */]()
        .querySelector('[role="dialog"] form')
        .querySelectorAll('[role="button"][tabindex="0"], [role="button"][tabindex="-1"]')
        .map((x) => x.parentElement)
        // TODO: should be nth(-1), see https://github.com/DimensionDev/Holoflows-Kit/issues/270
        .reverse()
        .nth(0);
}
function injectSetupPromptFacebook() {
    const watcher = new MutationObserverWatcher["a" /* MutationObserverWatcher */](injectSetupPrompt_composeBox.clone());
    Object(utils_watcher["a" /* startWatch */])(watcher);
    Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(NotSetupYetPrompt["a" /* NotSetupYetPrompt */], {}, void 0), {
        shadow: () => watcher.firstDOMProxy.afterShadow,
        rootProps: {
            style: {
                display: 'block',
                padding: '0 16px',
                marginTop: 0,
            },
        },
    });
}

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/getPersonIdentifierAtFacebook.ts
var getPersonIdentifierAtFacebook = __webpack_require__(317);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/UI/collectPeople.ts




function findPeopleInfo(whoAmI) {
    // TODO: support mobile
    const bio = new LiveSelector["a" /* LiveSelector */]().querySelector('#profile_timeline_intro_card').enableSingleMode();
    new MutationObserverWatcher["a" /* MutationObserverWatcher */](bio)
        /**
         * @var node: bio in the side of user page
         */
        .useForeach((node) => {
        function tryFindBioKey() {
            /**
             * @var text
             * @example
             * "...r Xoogler, MaskBook: A80TOj...eW9yqf Google - Softwa..."
             */
            const text = node.innerText;
            /**
             * Also collect 'identifier' | 'nickname' | 'avatar'
             */
            const a = document.querySelector('#fb-timeline-cover-name a');
            // side effect: save to service
            const id = Object(getPersonIdentifierAtFacebook["a" /* getProfileIdentifierAtFacebook */])(a, true);
            if (!id)
                return;
            service["b" /* default */].Crypto.verifyOthersProve(text, id.identifier);
            return id;
        }
        function parseFriendship() {
            const thisPerson = tryFindBioKey();
            const myID = whoAmI.value;
            if (!thisPerson || !myID)
                return;
            const [isFriendNow] = isFriend.evaluate();
            const myFriends = type["GroupIdentifier"].getDefaultFriendsGroupIdentifier(myID.identifier);
            if (isFriendNow === Status.Friend) {
                service["b" /* default */].UserGroup.addProfileToFriendsGroup(myFriends, [thisPerson.identifier]);
                console.log('Adding friend', thisPerson.identifier, 'to', myFriends);
            }
            else if (isFriendNow === Status.NonFriend) {
                service["b" /* default */].UserGroup.removeProfileFromFriendsGroup(myFriends, [thisPerson.identifier]);
                console.log('Removing friend', thisPerson.identifier, 'from', myFriends);
            }
        }
        whoAmI.addListener(parseFriendship);
        parseFriendship();
        return {
            onNodeMutation: parseFriendship,
            onTargetChanged: parseFriendship,
        };
    })
        .startWatch({
        childList: true,
        subtree: true,
    });
}
var Status;
(function (Status) {
    Status[Status["NonFriend"] = 1] = "NonFriend";
    Status[Status["Friend"] = 2] = "Friend";
    Status[Status["Unknown"] = 3] = "Unknown";
})(Status || (Status = {}));
/**
 * Ack:
 * If `#pagelet_timeline_profile_actions button:not(.hidden_elem)` have 3 nodes, they are friend.
 * If have 2 children, they are not friend.
 */
const isFriend = new LiveSelector["a" /* LiveSelector */]()
    .querySelectorAll('#pagelet_timeline_profile_actions button:not(.hidden_elem)')
    .replace((arr) => {
    if (arr.length === 3)
        return [Status.Friend];
    else if (arr.length === 2)
        return [Status.NonFriend];
    return [Status.Unknown];
});
function collectPeopleFacebook() {
    findPeopleInfo(this.currentIdentity);
}

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Watchers/IntervalWatcher.js
var IntervalWatcher = __webpack_require__(615);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/dom.ts
var utils_dom = __webpack_require__(86);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/tasks/pasteIntoPostBox.ts





async function openPostDialogFacebook() {
    await Object(utils_dom["c" /* untilDocumentReady */])();
    const notActivated = facebook_com_isMobile["b" /* isMobileFacebook */]
        ? new LiveSelector["a" /* LiveSelector */]().querySelector('[role="textbox"]')
        : new LiveSelector["a" /* LiveSelector */]()
            .querySelector(`[role="region"]`)
            .querySelector('textarea, [aria-multiline="true"]')
            .closest(1);
    const activated = new LiveSelector["a" /* LiveSelector */]().querySelector(facebook_com_isMobile["b" /* isMobileFacebook */] ? 'form textarea' : '.notranslate');
    const dialog = new LiveSelector["a" /* LiveSelector */]().querySelector('[role=main] [role=dialog]');
    if (notActivated.evaluate()[0]) {
        if (facebook_com_isMobile["b" /* isMobileFacebook */]) {
            try {
                notActivated.evaluate()[0].click();
                await Object(utils["t" /* timeout */])(new MutationObserverWatcher["a" /* MutationObserverWatcher */](activated), 2000);
                await Object(utils["s" /* sleep */])(1000);
            }
            catch (e) {
                clickFailed(e);
            }
        }
        else {
            try {
                console.log('Awaiting to click the post box');
                const [dom1] = await Object(utils["t" /* timeout */])(new MutationObserverWatcher["a" /* MutationObserverWatcher */](notActivated), 1000);
                dom1.click();
                console.log('Non-activated post box found Stage 1', dom1);
                const [dom2] = await Object(utils["t" /* timeout */])(new IntervalWatcher["a" /* IntervalWatcher */](notActivated.clone().filter((x) => x !== dom1)), 3000);
                console.log('Non-activated post box found Stage 2', dom2);
                dom2.click();
                await Object(utils["t" /* timeout */])(new MutationObserverWatcher["a" /* MutationObserverWatcher */](activated), 1000);
                if (!dialog.evaluate()[0])
                    throw new Error('Click not working');
            }
            catch (e) {
                clickFailed(e);
            }
            console.log('Awaiting dialog');
        }
    }
    await Object(utils["s" /* sleep */])(500);
    try {
        await Object(utils["t" /* timeout */])(new MutationObserverWatcher["a" /* MutationObserverWatcher */](facebook_com_isMobile["b" /* isMobileFacebook */] ? activated : dialog), 2000);
        console.log('Dialog appeared');
    }
    catch { }
    function clickFailed(e) {
        console.warn(e);
        if (!dialog.evaluate()[0])
            alert('请点击输入框');
    }
}
/**
 * Access: https://(www|m).facebook.com/
 */
async function pasteIntoPostBoxFacebook(text, options) {
    const { shouldOpenPostDialog, autoPasteFailedRecover } = options;
    await Object(utils_dom["c" /* untilDocumentReady */])();
    // Save the scrolling position
    const scrolling = document.scrollingElement || document.documentElement;
    const scrollBack = ((top) => () => scrolling.scroll({ top }))(scrolling.scrollTop);
    const activated = new LiveSelector["a" /* LiveSelector */]().querySelectorAll(facebook_com_isMobile["b" /* isMobileFacebook */] ? 'form textarea' : '.notranslate[aria-describedby]');
    if (facebook_com_isMobile["b" /* isMobileFacebook */])
        activated.filter((x) => x.getClientRects().length > 0);
    // If page is just loaded
    if (shouldOpenPostDialog) {
        await openPostDialogFacebook();
        console.log('Awaiting dialog');
    }
    try {
        const [element] = activated.evaluate();
        element.focus();
        await Object(utils["s" /* sleep */])(100);
        if ('value' in document.activeElement)
            Object(utils["g" /* dispatchCustomEvents */])(element, 'input', text);
        else
            Object(utils["g" /* dispatchCustomEvents */])(element, 'paste', text);
        await Object(utils["s" /* sleep */])(400);
        if (facebook_com_isMobile["b" /* isMobileFacebook */]) {
            const e = document.querySelector('.mentions-placeholder');
            if (e)
                e.style.display = 'none';
        }
        // Prevent Custom Paste failed, this will cause service not available to user.
        if (element.innerText.indexOf(text) === -1 || ('value' in element && element.value.indexOf(text) === -1))
            copyFailed('Not detected');
    }
    catch (e) {
        copyFailed(e);
    }
    scrollBack();
    function copyFailed(e) {
        console.warn('Text not pasted to the text area', e);
        if (autoPasteFailedRecover)
            utils_messages["a" /* MaskMessage */].events.autoPasteFailed.sendToLocal({ text });
    }
}

// EXTERNAL MODULE: ./packages/maskbook/src/utils/i18n-next.ts
var i18n_next = __webpack_require__(59);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/tasks/openComposeBox.ts





const nativeComposeButtonSelector = () => new LiveSelector["a" /* LiveSelector */]()
    .querySelector([
    '[role="region"] [role="link"]+[role="button"]',
    '#MComposer [role="button"]',
].join(','))
    .enableSingleMode();
const nativeComposeTextareaSelector = () => new LiveSelector["a" /* LiveSelector */]()
    .querySelector([
    '#structured_composer_form .mentions textarea',
].join(','))
    .enableSingleMode();
const nativeComposeDialogIndicatorSelector = () => new LiveSelector["a" /* LiveSelector */]().querySelector([
    // PC -  the form of compose dialog
    '[role="dialog"] form[method="post"]',
    // mobile - the submit button
    '#composer-main-view-id button[type="submit"]',
].join(','));
async function taskOpenComposeBoxFacebook(content, options) {
    await Object(utils_dom["c" /* untilDocumentReady */])();
    await Object(utils["s" /* sleep */])(800);
    // active the compose dialog
    const composeTextarea = nativeComposeTextareaSelector().evaluate();
    const composeButton = nativeComposeButtonSelector().evaluate();
    if (composeTextarea)
        composeTextarea.focus();
    if (composeButton)
        composeButton.click();
    await Object(utils["s" /* sleep */])(800);
    // the indicator only available when compose dialog opened successfully
    const composeIndicator = nativeComposeDialogIndicatorSelector().evaluate();
    if (!composeIndicator) {
        alert(i18n_next["b" /* i18n */].t('automation_request_click_post_button'));
        return;
    }
    await Object(utils["s" /* sleep */])(800);
    utils_messages["a" /* MaskMessage */].events.compositionUpdated.sendToLocal({
        reason: 'popup',
        open: true,
        content,
        options,
    });
}

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/String-ArrayBuffer.ts
var String_ArrayBuffer = __webpack_require__(62);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/stego-js/cjs/grayscale.js
var grayscale = __webpack_require__(562);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/tasks/uploadToPostBox.ts







async function uploadToPostBoxFacebook(text, options) {
    const { autoPasteFailedRecover, relatedText, template = 'v2' } = options;
    const { lastRecognizedIdentity } = Object(ui["getActivatedUI"])();
    const blankImage = await Object(utils["h" /* downloadUrl */])(Object(utils["i" /* getUrl */])(`${template === 'v2' ? '/image-payload' : template === 'v3' ? '/election-2020' : '/wallet'}/payload-${template}.png`)).then((x) => x.arrayBuffer());
    const secretImage = new Uint8Array(Object(String_ArrayBuffer["a" /* decodeArrayBuffer */])(await service["b" /* default */].Steganography.encodeImage(new Uint8Array(blankImage), {
        text,
        pass: lastRecognizedIdentity.value ? lastRecognizedIdentity.value.identifier.toText() : '',
        template,
        // ! the color image cannot compression resistance in Facebook
        grayscaleAlgorithm: grayscale["GrayscaleAlgorithm"].LUMINANCE,
    })));
    Object(utils["m" /* pasteImageToActiveElements */])(secretImage);
    await Object(utils_dom["c" /* untilDocumentReady */])();
    // TODO: Need a better way to find whether the image is pasted into
    uploadFail();
    async function uploadFail() {
        if (autoPasteFailedRecover) {
            const blob = new Blob([secretImage], { type: 'image/png' });
            utils_messages["a" /* MaskMessage */].events.autoPasteFailed.sendToLocal({ text: relatedText, image: blob });
        }
    }
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/tasks/getPostContent.ts


const postContent = new LiveSelector["a" /* LiveSelector */]().querySelector('[data-ad-preview="message"]');
async function getPostContentFacebook() {
    return get(postContent);
}
async function get(post) {
    const [data] = await Object(utils["t" /* timeout */])(new MutationObserverWatcher["a" /* MutationObserverWatcher */](post), 10000);
    return data.innerText;
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/UI/resolveLastRecognizedIdentity.ts




function resolveLastRecognizedIdentityFacebook() {
    const ref = this.lastRecognizedIdentity;
    const self = (facebook_com_isMobile["b" /* isMobileFacebook */] ? myUsernameLiveSelectorMobile : myUsernameLiveSelectorPC)
        .clone()
        .map((x) => Object(getPersonIdentifierAtFacebook["a" /* getProfileIdentifierAtFacebook */])(x, false));
    new MutationObserverWatcher["a" /* MutationObserverWatcher */](self)
        .setComparer(undefined, (a, b) => a.identifier.equals(b.identifier))
        .addListener('onAdd', (e) => assign(e.value))
        .addListener('onChange', (e) => assign(e.newValue))
        .startWatch({
        childList: true,
        subtree: true,
        characterData: true,
    });
    function assign(i) {
        if (!i.identifier.isUnknown)
            ref.value = i;
    }
    // ? maybe no need of this?
    fetch('/me', { method: 'HEAD' })
        .then((x) => x.url)
        .then(getPersonIdentifierAtFacebook["b" /* getUserID */])
        .then((id) => id && assign({ ...ref.value, identifier: new type["ProfileIdentifier"]('facebook.com', id) }));
}
//#region LS
// Try to resolve my identities
const myUsernameLiveSelectorPC = new LiveSelector["a" /* LiveSelector */]()
    .querySelectorAll(`[data-pagelet="LeftRail"] > [data-visualcompletion="ignore-dynamic"]:first-child > div:first-child > ul [role="link"]`)
    .filter((x) => x.innerText);
const myUsernameLiveSelectorMobile = new LiveSelector["a" /* LiveSelector */]().querySelector('#bookmarks_flyout .mSideMenu > div > ul > li:first-child a, #MComposer a');
//#endregion

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/tasks/getProfile.ts


const bioCard = new LiveSelector["a" /* LiveSelector */]().querySelector('#profile_timeline_intro_card');
async function getProfileFacebook(identifier) {
    const [data] = await Object(utils["t" /* timeout */])(new MutationObserverWatcher["a" /* MutationObserverWatcher */](bioCard), 10000);
    return { bioContent: data.innerText };
}

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/defaults/injectComments.tsx + 1 modules
var injectComments = __webpack_require__(551);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/UI/collectPosts.tsx
var collectPosts = __webpack_require__(385);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/UI/injectPostReplacer.tsx
function injectPostReplacerFacebook() {
    return () => { };
}

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/UI/injectPostInspector.tsx
var injectPostInspector = __webpack_require__(509);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/browser.storage.ts
var browser_storage = __webpack_require__(224);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/defaults/injectCommentBox.tsx + 1 modules
var injectCommentBox = __webpack_require__(550);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network/defaults/GroupsValueRef.ts





// TODO:
// groupIDs can be a part of network definitions
async function InitGroupsValueRef(self, network, groupIDs = [type["PreDefinedVirtualGroupNames"].friends]) {
    if (!(await settings["p" /* enableGroupSharingSettings */].readyPromise))
        return;
    const createUserGroup = Object(lodash["debounce"])(create, 1000, {
        trailing: true,
    });
    const onJoin = Object(lodash["debounce"])(join, 1000, {
        trailing: true,
    });
    createUserGroup(network, self.groupsRef, groupIDs);
    utils_messages["a" /* MaskMessage */].events.personaChanged.on((e) => {
        if (e.some((x) => x.owned))
            createUserGroup(network, self.groupsRef, groupIDs);
    });
    utils_messages["a" /* MaskMessage */].events.profileJoinedGroup.on(({ group, newMembers }) => onJoin(group, self.groupsRef, newMembers));
}
function join(groupIdentifier, ref, members) {
    const group = ref.value.find((g) => g.identifier.equals(groupIdentifier));
    if (!group) {
        return;
    }
    group.members = [...group.members, ...members.filter((member) => !group.members.some((m) => m.equals(member)))];
    ref.value = [...ref.value];
}
async function query(network, ref) {
    service["b" /* default */].UserGroup.queryUserGroups(network).then((p) => (ref.value = p));
}
async function create(network, ref, groupIDs) {
    const [identities, groups] = await Promise.all([
        service["b" /* default */].Identity.queryMyProfiles(network),
        service["b" /* default */].UserGroup.queryUserGroups(network),
    ]);
    const pairs = identities.flatMap(({ identifier }) => groupIDs.map((groupID) => [identifier, type["GroupIdentifier"].getFriendsGroupIdentifier(identifier, groupID)]));
    await Promise.all(pairs.map(async ([userIdentifier, groupIdentifier]) => {
        if (!groups.some((group) => group.identifier.equals(groupIdentifier))) {
            await service["b" /* default */].UserGroup.createFriendsGroup(userIdentifier, groupIdentifier.groupID);
        }
    }));
    await query(network, ref);
}

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/util/ValueRef.js
var ValueRef = __webpack_require__(132);

// EXTERNAL MODULE: ./packages/maskbook/src/components/InjectedComponents/SetupGuide.tsx
var SetupGuide = __webpack_require__(539);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/flags.ts
var flags = __webpack_require__(34);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network/defaults/taskStartSetupGuideDefault.tsx






function taskStartSetupGuideDefault_UI({ unmount, persona }) {
    return Object(jsx_runtime["jsx"])(SetupGuide["a" /* SetupGuide */], { persona: persona, onClose: unmount }, void 0);
}
let mounted = false;
function createTaskStartSetupGuideDefault(_, props = {}) {
    let shadowRoot;
    return (for_) => {
        if (mounted)
            return;
        mounted = true;
        const dom = document.createElement('span');
        document.body.appendChild(dom);
        const provePost = new ValueRef["a" /* ValueRef */]('');
        const unmount = Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(taskStartSetupGuideDefault_UI, { persona: for_, unmount: () => {
                unmount();
                mounted = false;
            } }, void 0), {
            shadow: () => {
                if (!shadowRoot)
                    shadowRoot = dom.attachShadow({ mode: flags["a" /* Flags */].using_ShadowDOM_attach_mode });
                return shadowRoot;
            },
        });
        service["b" /* default */].Crypto.getMyProveBio(for_, _().networkIdentifier)
            .then((x) => x || '')
            .then((x) => (provePost.value = x));
    };
}

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/parse-username.ts
var parse_username = __webpack_require__(145);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/theme.ts
var utils_theme = __webpack_require__(116);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/theme-tools.ts
function isDark([r, g, b]) {
    return r < 68 && g < 68 && b < 68;
}
function toRGB(channels) {
    if (!channels)
        return '';
    return `rgb(${channels.join()})`;
}
function fromRGB(rgb) {
    const matched = rgb.match(/rgb\(\s*(\d+?)\s*,\s*(\d+?)\s*,\s*(\d+?)\s*\)/);
    if (matched) {
        const [_, r, g, b] = matched;
        return [parseInt(r), parseInt(g), parseInt(b)];
    }
    return;
}
function clamp(num, min, max) {
    if (num < min)
        return min;
    if (num > max)
        return max;
    return num;
}
function shade(channels, percentage) {
    return channels.map((c) => clamp(Math.floor((c * (100 + percentage)) / 100), 0, 255));
}
function getBackgroundColor(element) {
    const color = getComputedStyle(element).backgroundColor;
    return color ? toRGB(fromRGB(color)) : '';
}
function getForegroundColor(element) {
    const color = getComputedStyle(element).color;
    return color ? toRGB(fromRGB(color)) : '';
}
function isDarkTheme(element = document.body) {
    const rgb = fromRGB(getComputedStyle(element).backgroundColor);
    if (!rgb)
        return true;
    return isDark(rgb);
}

// EXTERNAL MODULE: ./node_modules/react-use/esm/useInterval.js
var useInterval = __webpack_require__(1666);

// EXTERNAL MODULE: ./node_modules/notistack/dist/notistack.esm.js
var notistack_esm = __webpack_require__(105);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/Close.js
var Close = __webpack_require__(187);
var Close_default = /*#__PURE__*/__webpack_require__.n(Close);

// EXTERNAL MODULE: ./node_modules/react-use/esm/useCopyToClipboard.js + 1 modules
var useCopyToClipboard = __webpack_require__(1572);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Paper/Paper.js
var Paper = __webpack_require__(438);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/DialogTitle/DialogTitle.js
var DialogTitle = __webpack_require__(1611);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/DialogContentText/DialogContentText.js
var DialogContentText = __webpack_require__(1663);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Link/Link.js
var Link = __webpack_require__(556);

// EXTERNAL MODULE: ./packages/maskbook/src/components/shared/Image.tsx
var Image = __webpack_require__(359);

// EXTERNAL MODULE: ./node_modules/react-draggable/build/cjs/cjs.js
var cjs = __webpack_require__(876);
var cjs_default = /*#__PURE__*/__webpack_require__.n(cjs);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/hooks/useMatchXS.ts
var useMatchXS = __webpack_require__(112);

// CONCATENATED MODULE: ./packages/maskbook/src/components/shared/DraggableDiv.tsx





const DraggableDiv_useStyle = Object(makeStyles["a" /* default */])((theme) => ({
    root: {
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        zIndex: 9999,
        pointerEvents: 'none',
    },
    paper: (xsMatched) => {
        const cssProps = xsMatched ? { bottom: '2em' } : { top: '2em', right: '2em' };
        return {
            maxWidth: 550,
            position: 'fixed',
            pointerEvents: 'initial',
            ...cssProps,
        };
    },
}));
function DraggableDiv({ DraggableProps, ...props }) {
    const xsMatched = Object(useMatchXS["a" /* useMatchXS */])();
    const classes = DraggableDiv_useStyle(xsMatched);
    const ref = Object(react["useRef"])(null);
    return (Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.root }, { children: Object(jsx_runtime["jsx"])(cjs_default.a
        // @ts-ignore
        , Object.assign({ 
            // @ts-ignore
            nodeRef: ref, bounds: "parent", cancel: "p, h1, input, button, address", handle: "nav" }, DraggableProps, { children: Object(jsx_runtime["jsx"])("div", Object.assign({}, props, { ref: ref, className: classes.paper }), void 0) }), void 0) }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/utils/hooks/useQueryNavigatorPermission.ts
var useQueryNavigatorPermission = __webpack_require__(540);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/CloudDownload.js
var CloudDownload = __webpack_require__(877);
var CloudDownload_default = /*#__PURE__*/__webpack_require__.n(CloudDownload);

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/OpenInBrowser.js
var OpenInBrowser = __webpack_require__(878);
var OpenInBrowser_default = /*#__PURE__*/__webpack_require__.n(OpenInBrowser);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/FileService/utils/index.ts + 1 modules
var FileService_utils = __webpack_require__(189);

// CONCATENATED MODULE: ./packages/maskbook/src/components/InjectedComponents/AutoPasteFailedDialog.tsx
















const AutoPasteFailedDialog_useStyles = Object(makeStyles["a" /* default */])((theme) => ({
    title: { marginLeft: theme.spacing(1) },
    paper: { border: '1px solid white' },
}));
function AutoPasteFailedDialog(props) {
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const [url, setURL] = Object(react["useState"])('');
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(AutoPasteFailedDialog_useStyles(), props);
    const { onClose, data } = props;
    const { enqueueSnackbar } = Object(notistack_esm["b" /* useSnackbar */])();
    const [, copy] = Object(useCopyToClipboard["a" /* default */])();
    const isMobile = Object(useMatchXS["a" /* useMatchXS */])();
    const permission = Object(useQueryNavigatorPermission["a" /* useQueryNavigatorPermission */])(true, 'clipboard-write');
    return (Object(jsx_runtime["jsx"])(DraggableDiv, { children: Object(jsx_runtime["jsxs"])(Paper["a" /* default */], Object.assign({ elevation: 2, className: classes.paper, style: isMobile ? { width: '100vw' } : undefined }, { children: [Object(jsx_runtime["jsx"])("nav", { children: Object(jsx_runtime["jsxs"])(DialogTitle["a" /* default */], { children: [Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ size: "small", onClick: onClose }, { children: Object(jsx_runtime["jsx"])(Close_default.a, {}, void 0) }), void 0),
                            Object(jsx_runtime["jsx"])("span", Object.assign({ className: classes.title }, { children: t('auto_paste_failed_dialog_title') }), void 0)] }, void 0) }, void 0),
                Object(jsx_runtime["jsxs"])(DialogContent["a" /* default */], { children: [Object(jsx_runtime["jsx"])(DialogContentText["a" /* default */], { children: t('auto_paste_failed_dialog_content') }, void 0),
                        props.data.text ? (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(TextField["a" /* default */], { multiline: true, fullWidth: true, variant: "outlined", value: data.text, InputProps: { readOnly: true } }, void 0),
                                Object(jsx_runtime["jsx"])(Box["a" /* default */], { marginBottom: 1 }, void 0),
                                Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "contained", onClick: () => {
                                        var _a;
                                        copy(data.text);
                                        enqueueSnackbar(t('copy_success_of_text'), {
                                            variant: 'success',
                                            preventDuplicate: true,
                                            anchorOrigin: {
                                                vertical: 'top',
                                                horizontal: 'center',
                                            },
                                        });
                                        (_a = data.image) !== null && _a !== void 0 ? _a : onClose();
                                    } }, { children: t('copy_text') }), void 0)] }, void 0)) : null,
                        Object(jsx_runtime["jsx"])(Box["a" /* default */], { marginBottom: 1 }, void 0),
                        Object(jsx_runtime["jsxs"])("div", Object.assign({ style: { textAlign: permission === 'granted' ? 'left' : 'center' } }, { children: [data.image ? (
                                // It must be img
                                Object(jsx_runtime["jsx"])(Image["a" /* Image */], { component: "img", onURL: setURL, src: data.image, width: 260, height: 180 }, void 0)) : null,
                                Object(jsx_runtime["jsx"])(Box["a" /* default */], { marginBottom: 1 }, void 0),
                                permission === 'granted' ? (Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "contained", onClick: async () => {
                                        if (!data.image)
                                            return;
                                        await navigator.clipboard.write([
                                            new ClipboardItem({ [data.image.type]: data.image }),
                                        ]);
                                        enqueueSnackbar(t('copy_success_of_image'), {
                                            variant: 'success',
                                            preventDuplicate: true,
                                            anchorOrigin: {
                                                vertical: 'top',
                                                horizontal: 'center',
                                            },
                                        });
                                    } }, { children: t('copy_image') }), void 0)) : null,
                                url ? (Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "text", component: Link["a" /* default */], download: `maskbook-encrypted-${Object(FileService_utils["c" /* formatDateTime */])(new Date()).replace(/:/g, '-')}.png`, href: url, startIcon: Object(jsx_runtime["jsx"])(CloudDownload_default.a, {}, void 0) }, { children: t('download') }), void 0)) : null,
                                url && "app" === 'web' ? (Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ variant: "text", component: Link["a" /* default */], href: url, target: "_blank", startIcon: Object(jsx_runtime["jsx"])(OpenInBrowser_default.a, {}, void 0) }, { children: t('auto_paste_failed_dialog_image_caption') }), void 0)) : null] }), void 0)] }, void 0),
                Object(jsx_runtime["jsx"])(DialogActions["a" /* default */], {}, void 0)] }), void 0) }, void 0));
}
function useAutoPasteFailedDialog() {
    const [open, setOpen] = Object(react["useState"])(false);
    const [data, setData] = Object(react["useState"])({ text: '' });
    return [
        (data) => {
            setData(data);
            setOpen(true);
        },
        open ? Object(jsx_runtime["jsx"])(AutoPasteFailedDialog, { onClose: () => setOpen(false), data: data }, void 0) : null,
    ];
}

// CONCATENATED MODULE: ./packages/maskbook/src/components/InjectedComponents/PageInspector.tsx












function PageInspector(props) {
    const prompt = Object(notistack_esm["b" /* useSnackbar */])();
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const [autoPasteFailed, JSX] = useAutoPasteFailedDialog();
    const xsMatched = Object(useMatchXS["a" /* useMatchXS */])();
    Object(react["useEffect"])(() => utils_messages["a" /* MaskMessage */].events.autoPasteFailed.on((data) => {
        const key = data.image ? Math.random() : data.text;
        const close = () => prompt.closeSnackbar(key);
        const timeout = setTimeout(() => {
            prompt.closeSnackbar(key);
        }, 15 * 1000 /** 15 seconds */);
        prompt.enqueueSnackbar(t('auto_paste_failed_snackbar'), {
            variant: 'info',
            preventDuplicate: true,
            anchorOrigin: xsMatched
                ? {
                    vertical: 'bottom',
                    horizontal: 'center',
                }
                : { horizontal: 'left', vertical: 'bottom' },
            key,
            action: (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])(Button["a" /* default */], Object.assign({ color: "inherit", onClick: () => [clearTimeout(timeout), close(), autoPasteFailed(data)] }, { children: t('auto_paste_failed_snackbar_action') }), void 0),
                    Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ "aria-label": "Close", onClick: close }, { children: Object(jsx_runtime["jsx"])(Close_default.a, {}, void 0) }), void 0)] }, void 0)),
        });
    }));
    return (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [JSX, [...PluginUI["a" /* PluginUI */].values()].map((x) => (Object(jsx_runtime["jsx"])(ErrorBoundary["a" /* ErrorBoundary */], Object.assign({ contain: `Plugin "${x.pluginName}"` }, { children: Object(jsx_runtime["jsx"])(PluginPageInspectorForEach, { config: x }, void 0) }), x.identifier)))] }, void 0));
}
function PluginPageInspectorForEach({ config }) {
    const F = config.PageComponent;
    if (typeof F === 'function')
        return Object(jsx_runtime["jsx"])(F, {}, void 0);
    return null;
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network/defaults/injectPageInspector.tsx







function injectPageInspectorDefault(config = {}, additionalPropsToPageInspector = () => ({}), useCustomStyles = Object(makeStyles["a" /* default */])({})) {
    const PageInspectorDefault = Object(react["memo"])(function PageInspectorDefault() {
        const classes = useCustomStyles();
        const additionalProps = additionalPropsToPageInspector(classes);
        return Object(jsx_runtime["jsx"])(PageInspector, Object.assign({}, additionalProps), void 0);
    });
    return function injectPageInspector() {
        const watcher = new MutationObserverWatcher["a" /* MutationObserverWatcher */](new LiveSelector["a" /* LiveSelector */]().querySelector('body'));
        Object(utils_watcher["a" /* startWatch */])(watcher);
        return Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(PageInspectorDefault, {}, void 0), { shadow: () => watcher.firstDOMProxy.afterShadow });
    };
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/facebook.com/ui-provider.ts
































const origins = ['https://www.facebook.com/*', 'https://m.facebook.com/*'];
const facebookUISelf = Object(ui["defineSocialNetworkUI"])({
    ...shared_provider["a" /* sharedProvider */],
    init(env, pref) {
        shared_provider["a" /* sharedProvider */].init(env, pref);
        InitFriendsValueRef(facebookUISelf, 'facebook.com');
        InitGroupsValueRef(facebookUISelf, 'facebook.com');
        Object(MyIdentitiesRef["a" /* InitMyIdentitiesValueRef */])(facebookUISelf, 'facebook.com');
    },
    // ssr complains 'ReferenceError: window is not defined'
    shouldActivate(location = globalThis.location) {
        return location.hostname.endsWith('facebook.com');
    },
    friendlyName: 'Facebook',
    hasPermission() {
        return browser.permissions.contains({ origins });
    },
    requestPermission() {
        // TODO: wait for webextension-shim to support <all_urls> in permission.
        if (flags["a" /* Flags */].no_web_extension_dynamic_permission_request)
            return Promise.resolve(true);
        return browser.permissions.request({ origins });
    },
    setupAccount() {
        facebookUISelf.requestPermission().then((granted) => {
            if (granted) {
                Object(browser_storage["a" /* setStorage */])('facebook.com', { forceDisplayWelcome: true });
                location.href = 'https://facebook.com/';
            }
        });
    },
    ignoreSetupAccount() {
        Object(browser_storage["a" /* setStorage */])('facebook.com', { userIgnoredWelcome: true, forceDisplayWelcome: false });
    },
    resolveLastRecognizedIdentity: resolveLastRecognizedIdentityFacebook,
    injectPostBox: injectPostBoxFacebook,
    injectSetupPrompt: injectSetupPromptFacebook,
    injectPostComments: Object(injectComments["a" /* injectPostCommentsDefault */])(),
    injectCommentBox: Object(injectCommentBox["a" /* injectCommentBoxDefaultFactory */])(async function onPasteToCommentBoxFacebook(encryptedComment, current, realCurrent) {
        const fail = () => {
            utils_messages["a" /* MaskMessage */].events.autoPasteFailed.sendToLocal({ text: encryptedComment });
        };
        if (facebook_com_isMobile["b" /* isMobileFacebook */]) {
            const root = realCurrent || current.commentBoxSelector.evaluate()[0];
            if (!root)
                return fail();
            const textarea = root.querySelector('textarea');
            if (!textarea)
                return fail();
            textarea.focus();
            Object(utils["g" /* dispatchCustomEvents */])(textarea, 'input', encryptedComment);
            textarea.dispatchEvent(new CustomEvent('input', { bubbles: true, cancelable: false, composed: true }));
            await Object(utils["s" /* sleep */])(200);
            if (!root.innerText.includes(encryptedComment))
                return fail();
        }
        else {
            const root = realCurrent || current.rootNode;
            if (!root)
                return fail();
            const input = root.querySelector('[contenteditable]');
            if (!input)
                return fail();
            Object(utils["r" /* selectElementContents */])(input);
            Object(utils["g" /* dispatchCustomEvents */])(input, 'paste', encryptedComment);
            await Object(utils["s" /* sleep */])(200);
            if (!root.innerText.includes(encryptedComment))
                return fail();
        }
    }),
    injectPostReplacer: injectPostReplacerFacebook,
    injectPostInspector: injectPostInspector["b" /* injectPostInspectorFacebook */],
    injectPageInspector: injectPageInspectorDefault(),
    collectPeople: collectPeopleFacebook,
    collectPosts: collectPosts["b" /* collectPostsFacebook */],
    taskPasteIntoPostBox: pasteIntoPostBoxFacebook,
    taskOpenComposeBox: taskOpenComposeBoxFacebook,
    taskUploadToPostBox: uploadToPostBoxFacebook,
    taskGetPostContent: getPostContentFacebook,
    taskGetProfile: getProfileFacebook,
    taskStartSetupGuide: createTaskStartSetupGuideDefault(() => facebookUISelf),
    taskGotoProfilePage(profile) {
        // there is no PWA way on Facebook desktop.
        // mobile not tested
        location.href = Object(parse_username["c" /* getProfilePageUrlAtFacebook */])(profile, 'open');
    },
    taskGotoNewsFeedPage() {
        const homeLink = document.querySelector([
            '[data-click="bluebar_logo"] a[href]',
            '#feed_jewel a[href]',
        ].join(','));
        if (homeLink)
            homeLink.click();
        else if (location.pathname !== '/')
            location.pathname = '/';
    },
    useTheme() {
        const [theme, setTheme] = Object(react["useState"])(getTheme());
        const updateTheme = () => setTheme(getTheme());
        // TODO: it's buggy.
        Object(useInterval["a" /* default */])(updateTheme, 2000);
        return theme;
    },
});
function getTheme() {
    return Object(utils_theme["a" /* getMaskbookTheme */])({ appearance: isDarkTheme() ? settings["a" /* Appearance */].dark : settings["a" /* Appearance */].light });
}
if (false) {}

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/index.ts
var twitter_com = __webpack_require__(322);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/utils/postBox.ts

const getEditorContent = () => {
    const editorNode = postEditorDraftContentSelector().evaluate();
    if (!editorNode)
        return '';
    if (editorNode.tagName.toLowerCase() === 'div')
        return editorNode.innerText;
    return editorNode.value;
};
const postBox_isMobile = () => globalThis.location.host.includes('mobile');
const isCompose = () => globalThis.location.pathname.includes('compose');
const hasFocus = (x) => x.evaluate() === document.activeElement;
const hasEditor = () => !!postEditorDraftContentSelector().evaluate();

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/utils/selector.ts



const querySelector = (selector, singleMode = true) => {
    const ls = new LiveSelector["a" /* LiveSelector */]().querySelector(selector);
    return (singleMode ? ls.enableSingleMode() : ls);
};
const querySelectorAll = (selector) => {
    return new LiveSelector["a" /* LiveSelector */]().querySelectorAll(selector);
};
const rootSelector = () => querySelector('#react-root');
const composeAnchorSelector = () => querySelector('a[href="/compose/tweet"]');
const composeAnchorTextSelector = () => querySelector('a[href="/compose/tweet"] div[dir]');
const postEditorContentInPopupSelector = () => querySelector('[aria-labelledby="modal-header"] > div:first-child > div:nth-child(3)');
const postEditorInPopupSelector = () => querySelector('[aria-labelledby="modal-header"] > div:first-child > div:nth-child(3) > div:first-child > div:first-child [role="button"][aria-label]:nth-child(6)');
const postEditorInTimelineSelector = () => querySelector('[role="main"] :not(aside) > [role="progressbar"] ~ div [role="button"][aria-label]:nth-child(6)');
const postEditorDraftContentSelector = () => {
    if (location.pathname === '/compose/tweet') {
        return querySelector(`[contenteditable][aria-label][spellcheck],textarea[aria-label][spellcheck]`);
    }
    return (isCompose() ? postEditorInPopupSelector() : postEditorInTimelineSelector()).querySelector('.public-DraftEditor-content, [contenteditable][aria-label][spellcheck]');
};
const searchResultHeadingSelector = () => querySelector('[data-testid="primaryColumn"] [role="region"] [role="heading"]');
const postEditorToolbarSelector = () => querySelector('[data-testid="toolBar"] > div > *:last-child');
const newPostButtonSelector = () => querySelector('[data-testid="SideNav_NewTweet_Button"]');
const bioPageUserNickNameSelector = () => querySelector('[data-testid="UserDescription"]')
    .map((x) => { var _a, _b; return (_b = (_a = x.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.previousElementSibling; })
    .querySelector('div[dir]');
const bioPageUserIDSelector = (selector) => selector().map((x) => { var _a; return ((_a = x.parentElement) === null || _a === void 0 ? void 0 : _a.nextElementSibling).innerText.replace('@', ''); });
const floatingBioCardSelector = () => querySelector(`[style~="left:"] a[role=link] > div:first-child > div:first-child > div:first-child[dir="auto"]`);
const bioCardSelector = (singleMode = true) => querySelector([
    '.profile',
    'a[href*="header_photo"] ~ div',
    'div[data-testid="primaryColumn"] > div > div:last-child > div > div > div > div ~ div',
].join(), singleMode);
const postsSelector = () => querySelectorAll([
    '#main_content .timeline .tweet',
    '[data-testid="tweet"]',
].join());
const postsImageSelector = (node) => new LiveSelector["a" /* LiveSelector */]([node]).querySelectorAll([
    '[data-testid="tweet"] > div > div img[src*="media"]',
    '[data-testid="tweet"] ~ div img[src*="media"]',
].join());
const postsContentSelector = () => querySelectorAll([
    '.tweet-text > div',
    '[data-testid="tweet"] + div > div:first-child',
    '[data-testid="tweet"] + div [role="blockquote"] div[lang]',
    '[data-testid="tweet"] > div:last-child [role="blockquote"] div[lang]',
].join()).concat(querySelectorAll('[data-testid="tweet"] > div:last-child').map((x) => {
    var _a, _b;
    return (_b = (_a = x.querySelector('[role="group"]')) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.querySelector('div[lang]');
}));
const base = querySelector('#react-root + script');
const selector_handle = /"screen_name":"(.*?)"/;
const selector_name = /"name":"(.*?)"/;
const selector_bio = /"description":"(.*?)"/;
const selector_avatar = /"profile_image_url_https":"(.*?)"/;
/**
 * first matched element can be extracted by index zero, followings are all capture groups, if no 'g' specified.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
 */
const selector_p = (regex, index) => {
    return base.clone().map((x) => Object(utils["o" /* regexMatch */])(x.innerText, regex, index));
};
const selfInfoSelectors = () => ({
    handle: selector_p(selector_handle, 1),
    name: selector_p(selector_name, 1),
    bio: selector_p(selector_bio, 1),
    userAvatar: selector_p(selector_avatar, 1),
});

// EXTERNAL MODULE: ./node_modules/assert/assert.js
var assert = __webpack_require__(482);

// CONCATENATED MODULE: ./packages/maskbook/src/utils/assert.ts

const notInclude = (val, things, message) => {
    things.forEach((value) => {
        Object(assert["notStrictEqual"])(val, value, message);
    });
};
/**
 * Ensure a value not null or undefined.
 */
const notNullable = (val, message = 'Unexpected nil value detected') => {
    notInclude(val, [null, undefined], message);
    return val;
};

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/utils/fetch.ts







/**
 * @example
 * parseNameArea("TheMirror\n(●'◡'●)@1\n@MisakaMirror")
 * >>> {
 *      name: "TheMirror(●'◡'●)@1",
 *      handle: "MisakaMirror"
 * }
 */
const parseNameArea = (nameArea) => {
    const atIndex = nameArea.lastIndexOf('@');
    const name = nameArea.slice(0, atIndex).replace(/\n+/g, '');
    const handle = nameArea.slice(atIndex + 1).replace(/\n+/g, '');
    return name && handle
        ? {
            name,
            handle,
        }
        : {
            name: '',
            handle: '',
        };
};
const parseId = (t) => {
    return Object(utils["o" /* regexMatch */])(t, /status\/(\d+)/, 1);
};
const serializeToText = (node) => {
    var _a, _b;
    const snippets = [];
    for (const childNode of Array.from(node.childNodes)) {
        if (childNode.nodeType === Node.TEXT_NODE) {
            if (childNode.nodeValue)
                snippets.push(childNode.nodeValue);
        }
        else if (childNode.nodeName === 'IMG') {
            const img = childNode;
            const matched = (_b = ((_a = img.getAttribute('src')) !== null && _a !== void 0 ? _a : '').match(/emoji\/v2\/svg\/([\d\w]+)\.svg/)) !== null && _b !== void 0 ? _b : [];
            if (matched[1])
                snippets.push(String.fromCodePoint(Number.parseInt(`0x${matched[1]}`, 16)));
        }
        else if (childNode.childNodes.length)
            snippets.push(serializeToText(childNode));
    }
    return snippets.join('');
};
const isMobilePost = (node) => {
    var _a;
    return (_a = node.classList.contains('tweet')) !== null && _a !== void 0 ? _a : node.classList.contains('main-tweet');
};
const bioCardParser = (cardNode) => {
    if (cardNode.classList.contains('profile')) {
        const avatarElement = cardNode.querySelector('.avatar img');
        const { name, handle } = parseNameArea([
            notNullable(cardNode.querySelector('.user-info .fullname')).innerText,
            notNullable(cardNode.querySelector('.user-info .screen-name')).innerText,
        ].join('@'));
        const bio = notNullable(cardNode.querySelector('.details')).innerText;
        const isFollower = !!cardNode.querySelector('.follows-you');
        const isFollowing = notNullable(cardNode.querySelector('.profile-actions form')).action.indexOf('unfollow') >
            -1;
        return {
            avatar: avatarElement ? avatarElement.src : undefined,
            name,
            handle,
            identifier: new type["ProfileIdentifier"](utils_url["e" /* twitterUrl */].hostIdentifier, handle),
            bio,
            isFollower,
            isFollowing,
        };
    }
    else {
        const avatarElement = cardNode.querySelector('img');
        const { name, handle } = parseNameArea(notNullable(cardNode.children[1]).innerText);
        const bio = notNullable(cardNode.children[2]).innerHTML;
        const isFollower = !!Object(utils_dom["b" /* nthChild */])(cardNode, 1, 0, 0, 1, 1, 0);
        const isFollowing = !!cardNode.querySelector('[data-testid*="unfollow"]');
        return {
            avatar: avatarElement ? avatarElement.src : undefined,
            name,
            handle,
            identifier: new type["ProfileIdentifier"](utils_url["e" /* twitterUrl */].hostIdentifier, handle),
            bio,
            isFollower,
            isFollowing,
        };
    }
};
const postIdParser = (node) => {
    var _a, _b, _c;
    if (isMobilePost(node)) {
        const idNode = node.querySelector('.tweet-text');
        return idNode ? (_a = idNode.getAttribute('data-id')) !== null && _a !== void 0 ? _a : undefined : undefined;
    }
    else {
        const idNode = Object(lodash["defaultTo"])((_b = node.children[1]) === null || _b === void 0 ? void 0 : _b.querySelector('a[href*="status"]'), Object(lodash["defaultTo"])(node.parentElement.querySelector('a[href*="status"]'), (_c = node.closest('article > div')) === null || _c === void 0 ? void 0 : _c.querySelector('a[href*="status"]')));
        return idNode ? parseId(idNode.href) : parseId(location.href);
    }
};
const postNameParser = (node) => {
    var _a, _b, _c, _d, _e;
    if (isMobilePost(node)) {
        return parseNameArea(notNullable(node.querySelector('.user-info')).innerText);
    }
    else {
        const tweetElement = (_a = node.querySelector('[data-testid="tweet"]')) !== null && _a !== void 0 ? _a : node;
        // type 1:
        // normal tweet
        const anchorElement = (_b = tweetElement.children[1]) === null || _b === void 0 ? void 0 : _b.querySelector('a[data-focusable="true"]');
        const nameInUniqueAnchorTweet = anchorElement ? serializeToText(anchorElement) : '';
        // type 2:
        const nameInDoubleAnchorsTweet = Array.from((_d = (_c = tweetElement.children[1]) === null || _c === void 0 ? void 0 : _c.querySelectorAll('a[data-focusable="true"]')) !== null && _d !== void 0 ? _d : [])
            .map(serializeToText)
            .join('');
        // type 3:
        // parse name in quoted tweet
        const nameElementInQuoted = Object(utils_dom["b" /* nthChild */])(tweetElement, 0, 0, 0);
        const nameInQuoteTweet = nameElementInQuoted ? serializeToText(nameElementInQuoted) : '';
        return ((_e = [nameInUniqueAnchorTweet, nameInDoubleAnchorsTweet, nameInQuoteTweet]
            .filter(Boolean)
            .map(parseNameArea)
            .find((r) => r.name && r.handle)) !== null && _e !== void 0 ? _e : {
            name: '',
            handle: '',
        });
    }
};
const postAvatarParser = (node) => {
    var _a;
    if (isMobilePost(node)) {
        const avatarElement = node.querySelector('.avatar img');
        return avatarElement ? avatarElement.src : undefined;
    }
    else {
        const tweetElement = (_a = node.querySelector('[data-testid="tweet"]')) !== null && _a !== void 0 ? _a : node;
        const avatarElement = tweetElement.children[0].querySelector(`img[src*="twimg.com"]`);
        return avatarElement ? avatarElement.src : undefined;
    }
};
const postContentParser = (node) => {
    if (isMobilePost(node)) {
        const containerNode = node.querySelector('.tweet-text > div');
        if (!containerNode)
            return '';
        return Array.from(containerNode.childNodes)
            .map((node) => {
            if (node.nodeType === Node.TEXT_NODE)
                return node.nodeValue;
            if (node.nodeName === 'A')
                return node.getAttribute('title');
            return '';
        })
            .join(',');
    }
    else {
        const select = (selectors) => {
            const lang = node.parentElement.querySelector('[lang]');
            return lang ? Array.from(lang.querySelectorAll(selectors)) : [];
        };
        const sto = [
            ...select('a').map((x) => x.textContent),
            ...select('span').map((x) => x.innerText),
        ];
        return sto.filter(Boolean).join(' ');
    }
};
const postContentMessageParser = (node) => {
    function resolve(content) {
        if (content.startsWith('@'))
            return 'user';
        if (content.startsWith('#'))
            return 'hash';
        if (content.startsWith('$'))
            return 'cash';
        return 'normal';
    }
    function make(node) {
        var _a;
        if (node.nodeType === Node.TEXT_NODE) {
            if (!node.nodeValue)
                return Object(typed_message["m" /* makeTypedMessageEmpty */])();
            return Object(typed_message["q" /* makeTypedMessageText */])(node.nodeValue);
        }
        else if (node instanceof HTMLAnchorElement) {
            const anchor = node;
            const href = (_a = anchor.getAttribute('title')) !== null && _a !== void 0 ? _a : anchor.getAttribute('href');
            const content = anchor.textContent;
            if (!content)
                return Object(typed_message["m" /* makeTypedMessageEmpty */])();
            return Object(typed_message["k" /* makeTypedMessageAnchor */])(resolve(content), href !== null && href !== void 0 ? href : 'javascript: void 0;', content);
        }
        else if (node instanceof HTMLImageElement) {
            const image = node;
            const src = image.getAttribute('src');
            const matched = src === null || src === void 0 ? void 0 : src.match(/emoji\/v2\/svg\/([\d\w]+)\.svg/);
            if (matched && matched[1])
                return Object(typed_message["q" /* makeTypedMessageText */])(String.fromCodePoint(Number.parseInt(`0x${matched[1]}`, 16)));
            return Object(typed_message["m" /* makeTypedMessageEmpty */])();
        }
        else if (node.childNodes.length) {
            const flattened = Object(lodash["flattenDeep"])(Array.from(node.childNodes).map(make));
            // conjunct text messages under same node
            if (flattened.every(typed_message["j" /* isTypedMessageText */]))
                return Object(typed_message["q" /* makeTypedMessageText */])(flattened.map((x) => x.content).join(''));
            return flattened;
        }
        else
            return Object(typed_message["m" /* makeTypedMessageEmpty */])();
    }
    const lang = node.parentElement.querySelector('[lang]');
    return lang ? Array.from(lang.childNodes).flatMap(make) : [];
};
const postImagesParser = async (node) => {
    // TODO: Support steganography in legacy twitter
    if (isMobilePost(node))
        return [];
    const isQuotedTweet = !!node.closest('[role="blockquote"]');
    const imgNodes = node.querySelectorAll('img[src*="twimg.com/media"]');
    if (!imgNodes.length)
        return [];
    const imgUrls = Array.from(imgNodes)
        .filter((node) => isQuotedTweet || !node.closest('[role="blockquote"]'))
        .flatMap((node) => { var _a; return Object(utils_url["a" /* canonifyImgUrl */])((_a = node.getAttribute('src')) !== null && _a !== void 0 ? _a : ''); })
        .filter(Boolean);
    if (!imgUrls.length)
        return [];
    return imgUrls;
};
const postParser = (node) => {
    return {
        ...postNameParser(node),
        avatar: postAvatarParser(node),
        // FIXME:
        // we get wrong pid for nested tweet
        pid: postIdParser(node),
        messages: postContentMessageParser(node).filter((x) => !Object(typed_message["f" /* isTypedMessageEmpty */])(x)),
    };
};

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/encoding.ts
var encoding = __webpack_require__(373);

// EXTERNAL MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/utils/isMobile.ts
var utils_isMobile = __webpack_require__(245);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/tasks.ts














/**
 * Wait for up to 5000 ms
 * If not complete, let user do it.
 */
const taskPasteIntoPostBox = (text, opt) => {
    const interval = 500;
    const timeout = 5000;
    const worker = async function (abort) {
        const checkSignal = () => {
            if (abort.signal.aborted)
                throw new Error('Aborted');
        };
        if (!isCompose() && !hasEditor()) {
            // open tweet window
            await Object(utils_dom["e" /* untilElementAvailable */])(newPostButtonSelector());
            newPostButtonSelector().evaluate().click();
            checkSignal();
        }
        // get focus
        const i = postEditorDraftContentSelector();
        await Object(utils_dom["e" /* untilElementAvailable */])(i);
        checkSignal();
        while (!hasFocus(i)) {
            i.evaluate().focus();
            checkSignal();
            await Object(utils["s" /* sleep */])(interval);
        }
        // paste
        utils_isMobile["a" /* isMobileTwitter */]
            ? Object(utils["g" /* dispatchCustomEvents */])(i.evaluate(), 'input', text)
            : Object(utils["g" /* dispatchCustomEvents */])(i.evaluate(), 'paste', text);
        await Object(utils["s" /* sleep */])(interval);
        if (!getEditorContent().replace(/\n/g, '').includes(text.replace(/\n/g, ''))) {
            fail(new Error('Unable to paste text automatically'));
        }
    };
    const fail = (e) => {
        if (opt.autoPasteFailedRecover)
            utils_messages["a" /* MaskMessage */].events.autoPasteFailed.sendToLocal({ text });
        throw e;
    };
    const abortCtr = new AbortController();
    setTimeout(() => {
        abortCtr.abort();
    }, timeout);
    worker(abortCtr).then(undefined, (e) => fail(e));
};
const taskUploadToPostBox = async (text, options) => {
    const { template = 'v2', autoPasteFailedRecover, relatedText } = options;
    const { lastRecognizedIdentity } = Object(ui["getActivatedUI"])();
    const blankImage = await Object(utils["h" /* downloadUrl */])(Object(utils["i" /* getUrl */])(`${template === 'v2' || template === 'v3' ? '/image-payload' : '/wallet'}/payload-${template}.png`)).then((x) => x.arrayBuffer());
    const secretImage = new Uint8Array(Object(String_ArrayBuffer["a" /* decodeArrayBuffer */])(await service["b" /* default */].Steganography.encodeImage(Object(String_ArrayBuffer["c" /* encodeArrayBuffer */])(blankImage), {
        text,
        pass: lastRecognizedIdentity.value ? lastRecognizedIdentity.value.identifier.toText() : '',
        template,
    })));
    Object(utils["m" /* pasteImageToActiveElements */])(secretImage);
    await Object(utils_dom["c" /* untilDocumentReady */])();
    // TODO: Need a better way to find whether the image is pasted into
    uploadFail();
    async function uploadFail() {
        if (autoPasteFailedRecover) {
            utils_messages["a" /* MaskMessage */].events.autoPasteFailed.sendToLocal({
                text: relatedText,
                image: new Blob([secretImage], { type: 'image/png' }),
            });
        }
    }
};
const taskOpenComposeBox = async (content, options) => {
    utils_messages["a" /* MaskMessage */].events.compositionUpdated.sendToLocal({
        reason: 'timeline',
        open: true,
        content,
        options,
    });
};
const taskGetPostContent = async () => {
    const contentNode = (await Object(utils["t" /* timeout */])(new MutationObserverWatcher["a" /* MutationObserverWatcher */](postsSelector()), 10000))[0];
    return contentNode ? postContentParser(contentNode) : '';
};
const taskGetProfile = async () => {
    const { publicKeyEncoder, publicKeyDecoder } = encoding["a" /* twitterEncoding */];
    const cardNode = (await Object(utils["t" /* timeout */])(new MutationObserverWatcher["a" /* MutationObserverWatcher */](bioCardSelector(false)), 10000))[0];
    const bio = cardNode ? bioCardParser(cardNode).bio : '';
    return {
        bioContent: publicKeyEncoder(publicKeyDecoder(bio)[0] || ''),
    };
};
function taskGotoProfilePage(profile) {
    var _a;
    const path = `/${profile.userId}`;
    (_a = document.querySelector(`[href="${path}"]`)) === null || _a === void 0 ? void 0 : _a.click();
    setTimeout(() => {
        // The classic way
        if (!location.pathname.startsWith(path))
            location.pathname = path;
    }, 400);
}
function taskGotoNewsFeedPage() {
    if (location.pathname.includes('/home'))
        location.reload();
    else
        location.pathname = '/home';
}
const twitterUITasks = {
    taskPasteIntoPostBox,
    taskOpenComposeBox,
    taskUploadToPostBox,
    taskGetPostContent,
    taskGetProfile,
    taskGotoProfilePage,
    taskGotoNewsFeedPage,
    taskStartSetupGuide: createTaskStartSetupGuideDefault(() => instanceOfTwitterUI),
};

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/PostInfo.ts
var PostInfo = __webpack_require__(358);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/type-transform/Payload.ts
var Payload = __webpack_require__(163);

// EXTERNAL MODULE: ./node_modules/@dimensiondev/holoflows-kit/es/DOM/Proxy.js + 1 modules
var Proxy = __webpack_require__(377);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/memoize.ts
var memoize = __webpack_require__(138);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/injectMaskbookIcon.tsx










function Icon(props) {
    return (Object(jsx_runtime["jsx"])(MaskbookIcon["a" /* MaskbookIcon */], { style: {
            width: props.size,
            height: props.size,
            verticalAlign: 'text-bottom',
            marginLeft: 6,
        } }, void 0));
}
function injectMaskbookIcon_(main, size) {
    // TODO: for unknown reason the MutationObserverWatcher doesn't work well
    // To reproduce, open a profile and switch to another profile.
    Object(utils_watcher["a" /* startWatch */])(new MutationObserverWatcher["a" /* MutationObserverWatcher */](main()).useForeach((ele, _, meta) => {
        let remover = () => { };
        const remove = () => remover();
        const check = () => {
            ifUsingMaskbook(new type["ProfileIdentifier"]('twitter.com', bioPageUserIDSelector(main).evaluate() || '')).then(() => {
                remover = Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(Icon, { size: size }, void 0), { shadow: () => meta.afterShadow });
            }, remove);
        };
        check();
        return {
            onNodeMutation: check,
            onTargetChanged: check,
            onRemove: remove,
        };
    }));
}
function injectMaskbookIconToProfile() {
    injectMaskbookIcon_(bioPageUserNickNameSelector, 24);
}
function injectMaskbookIconIntoFloatingProfileCard() {
    injectMaskbookIcon_(floatingBioCardSelector, 20);
}
function injectMaskbookIconToPost(post) {
    const ls = new LiveSelector["a" /* LiveSelector */]([post.rootNodeProxy])
        .map((x) => { var _a, _b, _c; return (_c = (_b = (_a = x.current.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.previousElementSibling) === null || _c === void 0 ? void 0 : _c.querySelector('a[role="link"] > div > div:first-child'); })
        .enableSingleMode();
    ifUsingMaskbook(post.postBy.value).then(add, remove);
    post.postBy.addListener((x) => ifUsingMaskbook(x).then(add, remove));
    let remover = () => { };
    function add() {
        const node = ls.evaluate();
        if (!node)
            return;
        const proxy = Object(Proxy["a" /* DOMProxy */])({ afterShadowRootInit: { mode: flags["a" /* Flags */].using_ShadowDOM_attach_mode } });
        proxy.realCurrent = node;
        remover = Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(Icon, { size: 24 }, void 0), { shadow: () => proxy.afterShadow });
    }
    function remove() {
        remover();
    }
}
const ifUsingMaskbook = Object(memoize["a" /* memoizePromise */])((pid) => service["b" /* default */].Identity.queryProfile(pid).then((x) => (!!x.linkedPersona ? Promise.resolve() : Promise.reject())), (pid) => pid.toText());

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/fetch.ts













const resolveLastRecognizedIdentity = (self) => {
    const selfSelector = selfInfoSelectors().handle;
    const assign = () => {
        const ref = self.lastRecognizedIdentity;
        const handle = selfInfoSelectors().handle.evaluate();
        const nickname = selfInfoSelectors().name.evaluate();
        const avatar = selfInfoSelectors().userAvatar.evaluate();
        if (!Object(lodash["isNil"])(handle)) {
            ref.value = {
                identifier: new type["ProfileIdentifier"](self.networkIdentifier, handle),
                nickname,
                avatar,
            };
        }
    };
    new MutationObserverWatcher["a" /* MutationObserverWatcher */](selfSelector)
        .addListener('onAdd', () => assign())
        .addListener('onChange', () => assign())
        .startWatch({
        childList: true,
        subtree: true,
    });
};
const registerUserCollector = (self) => {
    new MutationObserverWatcher["a" /* MutationObserverWatcher */](bioCardSelector())
        .useForeach((cardNode) => {
        const resolve = async () => {
            if (!cardNode)
                return;
            const { isFollower, isFollowing, identifier } = bioCardParser(cardNode);
            const ref = self.lastRecognizedIdentity;
            if (!ref)
                return;
            const myIdentity = await service["b" /* default */].Identity.queryProfile(self.lastRecognizedIdentity.value.identifier);
            const myFriends = type["GroupIdentifier"].getFriendsGroupIdentifier(myIdentity.identifier, type["PreDefinedVirtualGroupNames"].friends);
            const myFollowers = type["GroupIdentifier"].getFriendsGroupIdentifier(myIdentity.identifier, type["PreDefinedVirtualGroupNames"].followers);
            const myFollowing = type["GroupIdentifier"].getFriendsGroupIdentifier(myIdentity.identifier, type["PreDefinedVirtualGroupNames"].following);
            if (isFollower || isFollowing) {
                if (isFollower)
                    service["b" /* default */].UserGroup.addProfileToFriendsGroup(myFollowers, [identifier]);
                if (isFollowing)
                    service["b" /* default */].UserGroup.addProfileToFriendsGroup(myFollowing, [identifier]);
                if (isFollower && isFollowing)
                    service["b" /* default */].UserGroup.addProfileToFriendsGroup(myFriends, [identifier]);
            }
            else
                service["b" /* default */].UserGroup.removeProfileFromFriendsGroup(myFriends, [identifier]);
        };
        resolve();
        return {
            onNodeMutation: resolve,
            onTargetChanged: resolve,
        };
    })
        .startWatch({
        childList: true,
        subtree: true,
    });
};
const registerPostCollector = (self) => {
    const getTweetNode = (node) => {
        return node.closest([
            '.tweet',
            '.main-tweet',
            'article > div',
            '[role="blockquote"]',
        ].join());
    };
    const updateProfileInfo = Object(lodash["memoize"])((info) => {
        service["b" /* default */].Identity.updateProfileInfo(info.postBy.value, {
            nickname: info.nickname.value,
            avatarURL: info.avatarURL.value,
        });
    }, (info) => { var _a; return (_a = info.postBy.value) === null || _a === void 0 ? void 0 : _a.toText(); });
    const watcher = new MutationObserverWatcher["a" /* MutationObserverWatcher */](postsContentSelector())
        .useForeach((node, _, proxy) => {
        const tweetNode = getTweetNode(node);
        if (!tweetNode)
            return;
        const info = new (class extends PostInfo["a" /* PostInfo */] {
            constructor() {
                super(...arguments);
                Object.defineProperty(this, "rootNodeProxy", {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: proxy
                });
                Object.defineProperty(this, "commentsSelector", {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: undefined
                });
                Object.defineProperty(this, "commentBoxSelector", {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: undefined
                });
                Object.defineProperty(this, "postContentNode", {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                    value: undefined
                });
            }
            get rootNode() {
                return proxy.current;
            }
        })();
        function run() {
            collectPostInfo(tweetNode, info, self);
            collectLinks(tweetNode, info);
        }
        run();
        info.postPayload.addListener((payload) => {
            if (!payload)
                return;
            if (payload.err && info.postMetadataImages.size === 0)
                return;
            updateProfileInfo(info);
        });
        non_overlapping_assign(info.postPayload, Object(Payload["b" /* deconstructPayload */])(info.postContent.value, self.payloadDecoder));
        info.postContent.addListener((newValue) => {
            non_overlapping_assign(info.postPayload, Object(Payload["b" /* deconstructPayload */])(newValue, self.payloadDecoder));
        });
        injectMaskbookIconToPost(info);
        self.posts.set(proxy, info);
        return {
            onTargetChanged: run,
            onRemove: () => self.posts.delete(proxy),
            onNodeMutation: run,
        };
    })
        .assignKeys((node) => {
        const tweetNode = getTweetNode(node);
        const isQuotedTweet = (tweetNode === null || tweetNode === void 0 ? void 0 : tweetNode.getAttribute('role')) === 'blockquote';
        return tweetNode
            ? `${isQuotedTweet ? 'QUOTED' : ''}${postIdParser(tweetNode)}${node.innerText.replace(/\s/gm, '')}`
            : node.innerText;
    });
    Object(utils_watcher["a" /* startWatch */])(watcher);
};
const twitterUIFetch = {
    resolveLastRecognizedIdentity: () => resolveLastRecognizedIdentity(instanceOfTwitterUI),
    collectPeople: () => registerUserCollector(instanceOfTwitterUI),
    collectPosts: () => registerPostCollector(instanceOfTwitterUI),
};
function collectLinks(tweetNode, info) {
    if (!tweetNode)
        return;
    const links = [...tweetNode.querySelectorAll('a')].filter((x) => x.rel);
    const seen = new Set(['https://help.twitter.com/using-twitter/how-to-tweet#source-labels']);
    for (const x of links) {
        if (seen.has(x.href))
            continue;
        seen.add(x.href);
        info.postMetadataMentionedLinks.set(x, x.href);
        service["b" /* default */].Helper.resolveTCOLink(x.href).then((val) => {
            if (!val)
                return;
            info.postMetadataMentionedLinks.set(x, val);
            const tryDecode = Object(Payload["b" /* deconstructPayload */])(val, instanceOfTwitterUI.payloadDecoder);
            non_overlapping_assign(info.postPayload, tryDecode);
        });
    }
}
function non_overlapping_assign(post, next) {
    if (post.value.ok && next.err)
        return; // don't flush successful parse
    post.value = next;
}
function collectPostInfo(tweetNode, info, self) {
    if (!tweetNode)
        return;
    const { pid, messages, handle, name, avatar } = postParser(tweetNode);
    if (!pid)
        return;
    const postBy = new type["ProfileIdentifier"](self.networkIdentifier, handle);
    info.postID.value = pid;
    info.postContent.value = messages
        .map((x) => {
        const extracted = Object(typed_message["b" /* extractTextFromTypedMessage */])(x);
        return extracted.ok ? extracted.val : '';
    })
        // add space between anchor and plain text
        .join(' ');
    if (!info.postBy.value.equals(postBy))
        info.postBy.value = postBy;
    info.nickname.value = name;
    info.avatarURL.value = avatar || null;
    // decode steganographic image
    // don't add await on this
    const images = Object(utils_dom["e" /* untilElementAvailable */])(postsImageSelector(tweetNode), 10000)
        .then(() => postImagesParser(tweetNode))
        .then((urls) => {
        for (const url of urls)
            info.postMetadataImages.add(url);
        if (urls.length)
            return Object(typed_message["n" /* makeTypedMessageFromList */])(...urls.map((x) => Object(typed_message["o" /* makeTypedMessageImage */])(x)));
        return Object(typed_message["m" /* makeTypedMessageEmpty */])();
    })
        .catch(() => Object(typed_message["m" /* makeTypedMessageEmpty */])());
    info.postMessage.value = Object(typed_message["l" /* makeTypedMessageCompound */])([...messages, Object(typed_message["p" /* makeTypedMessageSuspended */])(images)]);
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/injectPostDialog.tsx








function injectPostDialogAtTwitter() {
    if (location.hostname.indexOf(utils_url["e" /* twitterUrl */].hostIdentifier) === -1)
        return;
    renderPostDialogTo('popup', postEditorContentInPopupSelector());
    renderPostDialogTo('timeline', rootSelector());
}
function renderPostDialogTo(reason, ls) {
    const watcher = new MutationObserverWatcher["a" /* MutationObserverWatcher */](ls);
    Object(utils_watcher["a" /* startWatch */])(watcher);
    Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(PostDialogAtTwitter, { reason: reason }, void 0), { shadow: () => watcher.firstDOMProxy.afterShadow });
}
function PostDialogAtTwitter(props) {
    const rootRef = Object(react["useRef"])(null);
    const dialogProps = props.reason === 'popup'
        ? {
            disablePortal: true,
            container: () => rootRef.current,
        }
        : {};
    const dialog = Object(jsx_runtime["jsx"])(PostDialog, { DialogProps: dialogProps, reason: props.reason }, void 0);
    // ! Render dialog into native composition view instead of portal shadow
    // ! More https://github.com/DimensionDev/Maskbook/issues/837
    return props.reason === 'popup' ? Object(jsx_runtime["jsx"])("div", Object.assign({ ref: rootRef }, { children: dialog }), void 0) : dialog;
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/injectSetupPrompt.tsx








function injectSetupPromptAtTwitter() {
    if (location.hostname.indexOf(utils_url["e" /* twitterUrl */].hostIdentifier) === -1)
        return;
    const emptyNode = document.createElement('div');
    injectSetupPrompt(postEditorInTimelineSelector());
    injectSetupPrompt(postEditorInPopupSelector().map((x) => (isCompose() && hasEditor() ? x : emptyNode)));
}
function injectSetupPrompt(ls) {
    const watcher = new MutationObserverWatcher["a" /* MutationObserverWatcher */](ls);
    Object(utils_watcher["a" /* startWatch */])(watcher);
    Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(NotSetupYetPrompt["a" /* NotSetupYetPrompt */], {}, void 0), { shadow: () => watcher.firstDOMProxy.afterShadow });
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/injectPostDialogHint.tsx










function injectPostDialogHintAtTwitter() {
    if (location.hostname.indexOf(utils_url["e" /* twitterUrl */].hostIdentifier) === -1)
        return;
    const emptyNode = document.createElement('div');
    renderPostDialogHintTo('timeline', postEditorInTimelineSelector());
    renderPostDialogHintTo('popup', postEditorInPopupSelector().map((x) => (isCompose() && hasEditor() ? x : emptyNode)));
}
function renderPostDialogHintTo(reason, ls) {
    const watcher = new MutationObserverWatcher["a" /* MutationObserverWatcher */](ls);
    Object(utils_watcher["a" /* startWatch */])(watcher);
    Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(PostDialogHintAtTwitter, { reason: reason }, void 0), { shadow: () => watcher.firstDOMProxy.afterShadow });
}
function PostDialogHintAtTwitter({ reason }) {
    const onHintButtonClicked = Object(react["useCallback"])(() => utils_messages["a" /* MaskMessage */].events.compositionUpdated.sendToLocal({ reason, open: true }), [reason]);
    return Object(jsx_runtime["jsx"])(PostDialogHint, { onHintButtonClicked: onHintButtonClicked }, void 0);
}

// EXTERNAL MODULE: ./packages/maskbook/src/social-network/defaults/injectPostInspector.tsx + 12 modules
var defaults_injectPostInspector = __webpack_require__(545);

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/injectPostInspector.tsx


function injectPostInspectorAtTwitter(current) {
    return Object(defaults_injectPostInspector["a" /* injectPostInspectorDefault */])({
        zipPost(node) {
            var _a, _b;
            const content = (_a = node.current.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector('[lang]');
            if (content) {
                for (const a of content.querySelectorAll('a')) {
                    if (encoding["a" /* twitterEncoding */].payloadDecoder(a.title))
                        hideDOM(a);
                    if (/^https?:\/\/mask(\.io|book\.com)$/i.test(a.title))
                        hideDOM(a);
                }
                for (const span of content.querySelectorAll('span')) {
                    // match (.) (\n) (—§—) (any space) (/*)
                    // Note: In Chinese we can't hide dom because "解密这条推文。\n—§—" is in the same DOM
                    // hide it will break the sentence.
                    if (span.innerText.match(/^\.\n—§— +\/\* $/))
                        hideDOM(span);
                    // match (any space) (*/) (any space)
                    if (span.innerText.match(/^ +\*\/ ?$/))
                        hideDOM(span);
                }
                const parent = (_b = content.parentElement) === null || _b === void 0 ? void 0 : _b.nextElementSibling;
                if (parent && matches(parent.innerText)) {
                    parent.style.height = '0';
                    parent.style.overflow = 'hidden';
                }
            }
        },
    })(current);
}
function matches(input) {
    return /maskbook\.com/i.test(input) && /Make Privacy Protected Again/i.test(input);
}
function hideDOM(a) {
    a.style.width = '0';
    a.style.height = '0';
    a.style.overflow = 'hidden';
    a.style.display = 'inline-block';
}

// CONCATENATED MODULE: ./packages/maskbook/src/components/InjectedComponents/PostDialogIcon.tsx




const PostDialogIcon_useStyles = Object(makeStyles["a" /* default */])(() => ({
    root: { verticalAlign: 'middle' },
}));
function PostDialogIcon(props) {
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(PostDialogIcon_useStyles(), props);
    return Object(jsx_runtime["jsx"])(MaskbookIcon["b" /* MaskbookSharpIcon */], { classes: classes, onClick: props.onClick }, void 0);
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/injectPostDialogIcon.tsx










function injectPostDialogIconAtTwitter() {
    if (location.hostname.indexOf(utils_url["e" /* twitterUrl */].hostIdentifier) === -1)
        return;
    const emptyNode = document.createElement('div');
    renderPostDialogIconTo(postEditorToolbarSelector().map((x) => (postBox_isMobile() && isCompose() ? x : emptyNode)));
}
function renderPostDialogIconTo(ls) {
    const watcher = new MutationObserverWatcher["a" /* MutationObserverWatcher */](ls);
    Object(utils_watcher["a" /* startWatch */])(watcher);
    Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(PostDialogIconAtTwitter, {}, void 0), { shadow: () => watcher.firstDOMProxy.afterShadow });
}
const useTwitterMaskbookIcon = Object(makeStyles["a" /* default */])((theme) => ({
    root: {
        width: 38,
        height: 38,
        boxSizing: 'border-box',
        padding: theme.spacing(1),
    },
}));
function PostDialogIconAtTwitter() {
    const classes = useTwitterMaskbookIcon();
    const onIconClicked = () => utils_messages["a" /* MaskMessage */].events.compositionUpdated.sendToLocal({ reason: 'timeline', open: true });
    return Object(jsx_runtime["jsx"])(PostDialogIcon, { classes: classes, onClick: onIconClicked }, void 0);
}

// EXTERNAL MODULE: ./packages/maskbook/src/components/DataSource/usePostInfo.ts + 1 modules
var usePostInfo = __webpack_require__(72);

// EXTERNAL MODULE: ./packages/maskbook/src/components/InjectedComponents/TypedMessageRenderer.tsx + 1 modules
var TypedMessageRenderer = __webpack_require__(553);

// CONCATENATED MODULE: ./packages/maskbook/src/components/InjectedComponents/PostReplacer.tsx










const useStlyes = Object(makeStyles["a" /* default */])((theme) => ({
    root: {
        overflowWrap: 'break-word',
    },
}));
function PostReplacer(props) {
    const classes = useStlyes();
    const postMessage = Object(usePostInfo["c" /* usePostInfoDetails */])('postMessage');
    const postPayload = Object(usePostInfo["c" /* usePostInfoDetails */])('postPayload');
    const allPostReplacement = Object(useValueRef["a" /* useValueRef */])(settings["d" /* allPostReplacementSettings */]);
    const plugins = [...PluginUI["a" /* PluginUI */].values()];
    const processedPostMessage = Object(react["useMemo"])(() => plugins.reduce((x, plugin) => esm["c" /* Result */].wrap(() => { var _a, _b; return (_b = (_a = plugin.messageProcessor) === null || _a === void 0 ? void 0 : _a.call(plugin, x)) !== null && _b !== void 0 ? _b : x; }).unwrapOr(x), postMessage), [plugins.map((x) => x.identifier).join(), postMessage]);
    const shouldReplacePost = 
    // replace all posts
    allPostReplacement ||
        // replace posts which enhanced by plugins
        processedPostMessage.items.some((x) => !Object(typed_message["h" /* isTypedMessageKnown */])(x)) ||
        // replace posts which encrypted by maskbook
        postPayload.ok;
    // zip/unzip original post
    Object(react["useEffect"])(() => {
        var _a, _b;
        if (shouldReplacePost)
            (_a = props.zip) === null || _a === void 0 ? void 0 : _a.call(props);
        else
            (_b = props.unzip) === null || _b === void 0 ? void 0 : _b.call(props);
    }, [shouldReplacePost]);
    return shouldReplacePost ? (Object(jsx_runtime["jsx"])("span", Object.assign({ className: classes.root }, { children: Object(jsx_runtime["jsx"])(TypedMessageRenderer["a" /* DefaultTypedMessageRenderer */], { message: Object(typed_message["l" /* makeTypedMessageCompound */])(processedPostMessage.items.filter((x) => !Object(typed_message["i" /* isTypedMessageSuspended */])(x))) }, void 0) }), void 0)) : null;
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network/defaults/injectPostReplacer.tsx







function injectPostReplacer_injectPostReplacer(config = {}, additionalPropsToPostReplacer = () => ({}), useCustomStyles = Object(makeStyles["a" /* default */])({})) {
    const PostReplacerDefault = Object(react["memo"])(function PostReplacerDefault(props) {
        const classes = useCustomStyles();
        const additionalProps = additionalPropsToPostReplacer(classes);
        return Object(jsx_runtime["jsx"])(PostReplacer, Object.assign({}, additionalProps, { zip: props.zipPost, unzip: props.unZipPost }), void 0);
    });
    const { zipPost, unzipPost } = config;
    const zipPostF = zipPost || lodash["noop"];
    const unzipPostF = unzipPost || lodash["noop"];
    return function injectPostReplacer(current) {
        return Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(usePostInfo["a" /* PostInfoContext */].Provider, Object.assign({ value: current }, { children: Object(jsx_runtime["jsx"])(PostReplacerDefault, Object.assign({ zipPost: () => zipPostF(current.rootNodeProxy), unZipPost: () => unzipPostF(current.rootNodeProxy) }, current), void 0) }), void 0), {
            shadow: () => current.rootNodeProxy.afterShadow,
            concurrent: true,
            keyBy: 'post-replacer',
        });
    };
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/injectPostReplacer.tsx

function resolveLangNode(node) {
    var _a, _b;
    return node.hasAttribute('lang')
        ? node
        : (_a = node.querySelector('[lang]')) !== null && _a !== void 0 ? _a : (_b = node.parentElement) === null || _b === void 0 ? void 0 : _b.querySelector('[lang]');
}
function injectPostReplacerAtTwitter(current) {
    return injectPostReplacer_injectPostReplacer({
        zipPost(node) {
            const langNode = resolveLangNode(node.current);
            if (langNode)
                langNode.style.display = 'none';
        },
        unzipPost(node) {
            const langNode = resolveLangNode(node.current);
            if (langNode)
                langNode.style.display = 'unset';
        },
    })(current);
}

// EXTERNAL MODULE: ./node_modules/react-use/esm/useAsync.js
var useAsync = __webpack_require__(295);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/types/index.ts + 2 modules
var Trader_types = __webpack_require__(23);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/styles/createStyles.js
var createStyles = __webpack_require__(127);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/CardHeader/CardHeader.js
var CardHeader = __webpack_require__(1565);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Avatar/Avatar.js + 1 modules
var Avatar_Avatar = __webpack_require__(931);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Tabs/Tabs.js + 7 modules
var Tabs = __webpack_require__(1569);

// EXTERNAL MODULE: ./node_modules/@material-ui/core/esm/Tab/Tab.js
var Tab = __webpack_require__(1561);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/pipes.ts
var pipes = __webpack_require__(100);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Wallet/formatter.ts
var formatter = __webpack_require__(29);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/trending/useTrending.ts + 1 modules
var useTrending = __webpack_require__(552);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/TickersTable.tsx
var TickersTable = __webpack_require__(525);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/PriceChangedTable.tsx
var PriceChangedTable = __webpack_require__(527);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/PriceChanged.tsx
var PriceChanged = __webpack_require__(371);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/PriceChart.tsx + 2 modules
var PriceChart = __webpack_require__(548);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/Linking.tsx
var Linking = __webpack_require__(263);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/trending/usePriceStats.ts
var usePriceStats = __webpack_require__(529);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/PriceChartDaysControl.tsx
var PriceChartDaysControl = __webpack_require__(288);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/trending/useCurrentDataProvider.ts
var useCurrentDataProvider = __webpack_require__(530);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/trending/useCurrentTradeProvider.ts
var useCurrentTradeProvider = __webpack_require__(531);

// EXTERNAL MODULE: ./packages/maskbook/src/resources/CoinMarketCapIcon.tsx
var CoinMarketCapIcon = __webpack_require__(532);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/hooks/useConstant.ts
var useConstant = __webpack_require__(68);

// EXTERNAL MODULE: ./packages/maskbook/src/resources/UniswapIcon.tsx
var UniswapIcon = __webpack_require__(372);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/constants/index.ts
var constants = __webpack_require__(65);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/UI/trader/TradeView.tsx + 21 modules
var TradeView = __webpack_require__(544);

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

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/CoinMarketTable.tsx



const CoinMarketTable_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        padding: theme.spacing(2),
    },
    container: {
        borderRadius: 0,
        boxSizing: 'border-box',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
    },
    table: {},
    head: {
        padding: 0,
        border: 'none',
    },
    cell: {
        whiteSpace: 'nowrap',
        border: 'none',
    },
}));
function CoinMarketTable(props) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { trending } = props;
    const classes = CoinMarketTable_useStyles();
    return (Object(jsx_runtime["jsx"])(TableContainer["a" /* default */], Object.assign({ className: classes.container, component: Paper["a" /* default */], elevation: 0 }, { children: Object(jsx_runtime["jsxs"])(Table["a" /* default */], Object.assign({ className: classes.table }, { children: [Object(jsx_runtime["jsx"])(TableHead["a" /* default */], { children: Object(jsx_runtime["jsxs"])(TableRow["a" /* default */], { children: [Object(jsx_runtime["jsx"])(TableCell["a" /* default */], Object.assign({ className: classes.head, align: "center" }, { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ color: "textSecondary", variant: "body2" }, { children: "Market Cap" }), void 0) }), void 0),
                            Object(jsx_runtime["jsx"])(TableCell["a" /* default */], Object.assign({ className: classes.head, align: "center" }, { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ color: "textSecondary", variant: "body2" }, { children: "Volumn (24h)" }), void 0) }), void 0),
                            Object(jsx_runtime["jsx"])(TableCell["a" /* default */], Object.assign({ className: classes.head, align: "center" }, { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ color: "textSecondary", variant: "body2" }, { children: "Circulating Supply" }), void 0) }), void 0),
                            Object(jsx_runtime["jsx"])(TableCell["a" /* default */], Object.assign({ className: classes.head, align: "center" }, { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ color: "textSecondary", variant: "body2" }, { children: "Total Supply" }), void 0) }), void 0)] }, void 0) }, void 0),
                Object(jsx_runtime["jsx"])(TableBody["a" /* default */], { children: Object(jsx_runtime["jsxs"])(TableRow["a" /* default */], { children: [Object(jsx_runtime["jsxs"])(TableCell["a" /* default */], Object.assign({ className: classes.cell, align: "center" }, { children: [Object(formatter["c" /* formatCurrency */])((_b = (_a = trending.market) === null || _a === void 0 ? void 0 : _a.market_cap) !== null && _b !== void 0 ? _b : 0, '$'), " USD"] }), void 0),
                            Object(jsx_runtime["jsxs"])(TableCell["a" /* default */], Object.assign({ className: classes.cell, align: "center" }, { children: [Object(formatter["c" /* formatCurrency */])((_d = (_c = trending.market) === null || _c === void 0 ? void 0 : _c.total_volume) !== null && _d !== void 0 ? _d : 0, '$'), " USD"] }), void 0),
                            Object(jsx_runtime["jsxs"])(TableCell["a" /* default */], Object.assign({ className: classes.cell, align: "center" }, { children: [Object(formatter["c" /* formatCurrency */])((_f = (_e = trending.market) === null || _e === void 0 ? void 0 : _e.circulating_supply) !== null && _f !== void 0 ? _f : 0, '$'), " USD"] }), void 0),
                            Object(jsx_runtime["jsxs"])(TableCell["a" /* default */], Object.assign({ className: classes.cell, align: "center" }, { children: [Object(formatter["c" /* formatCurrency */])((_h = (_g = trending.market) === null || _g === void 0 ? void 0 : _g.total_supply) !== null && _h !== void 0 ? _h : 0, '$'), " USD"] }), void 0)] }, void 0) }, void 0)] }), void 0) }), void 0));
}

// EXTERNAL MODULE: ./node_modules/@material-ui/icons/FileCopy.js
var FileCopy = __webpack_require__(879);
var FileCopy_default = /*#__PURE__*/__webpack_require__.n(FileCopy);

// EXTERNAL MODULE: ./packages/maskbook/src/extension/options-page/DashboardDialogs/Base.tsx
var Base = __webpack_require__(20);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/CoinMetadataTable.tsx







const CoinMetadataTable_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        padding: theme.spacing(2),
    },
    container: {
        borderRadius: 0,
        boxSizing: 'border-box',
        '&::-webkit-scrollbar': {
            display: 'none',
        },
    },
    table: {},
    cell: {
        whiteSpace: 'nowrap',
        border: 'none',
    },
    label: {
        color: theme.palette.text.secondary,
        whiteSpace: 'nowrap',
    },
    link: {
        display: 'inline-block',
        whiteSpace: 'nowrap',
        paddingRight: theme.spacing(1),
        '&:last-child': {
            paddingRight: 0,
        },
    },
    tag: {
        paddingRight: theme.spacing(2),
        '&:last-child': {
            paddingRight: 0,
        },
    },
}));
function CoinMetadataTable(props) {
    var _a;
    const { dataProvider, trending } = props;
    const classes = CoinMetadataTable_useStyles();
    const [, copyToClipboard] = Object(useCopyToClipboard["a" /* default */])();
    const onCopyAddress = Object(Base["d" /* useSnackbarCallback */])(async () => {
        if (!trending.coin.eth_address)
            return;
        copyToClipboard(trending.coin.eth_address);
    }, [trending.coin.eth_address]);
    const metadataLinks = [
        ['Website', trending.coin.home_urls],
        ['Announcement', trending.coin.announcement_urls],
        ['Message Board', trending.coin.message_board_urls],
        ['Explorer', trending.coin.blockchain_urls],
        ['Tech Docs', trending.coin.tech_docs_urls],
        ['Source Code', trending.coin.source_code_urls],
        ['Commnuity', trending.coin.community_urls],
    ];
    return (Object(jsx_runtime["jsx"])(TableContainer["a" /* default */], Object.assign({ className: classes.container, component: Paper["a" /* default */], elevation: 0 }, { children: Object(jsx_runtime["jsx"])(Table["a" /* default */], Object.assign({ className: classes.table, size: "small" }, { children: Object(jsx_runtime["jsxs"])(TableBody["a" /* default */], { children: [trending.coin.market_cap_rank ? (Object(jsx_runtime["jsxs"])(TableRow["a" /* default */], { children: [Object(jsx_runtime["jsx"])(TableCell["a" /* default */], { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.label, variant: "body2" }, { children: "Market Cap" }), void 0) }, void 0),
                            Object(jsx_runtime["jsx"])(TableCell["a" /* default */], { children: `Rank #${trending.coin.market_cap_rank}` }, void 0)] }, void 0)) : null,
                    metadataLinks.map(([label, links], i) => {
                        if (!(links === null || links === void 0 ? void 0 : links.length))
                            return null;
                        return (Object(jsx_runtime["jsxs"])(TableRow["a" /* default */], { children: [Object(jsx_runtime["jsx"])(TableCell["a" /* default */], { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.label, variant: "body2" }, { children: label }), void 0) }, void 0),
                                Object(jsx_runtime["jsx"])(TableCell["a" /* default */], { children: links.map((x, i) => (Object(jsx_runtime["jsx"])(Linking["a" /* Linking */], { href: x, LinkProps: { className: classes.link } }, i))) }, void 0)] }, i));
                    }),
                    trending.coin.eth_address ? (Object(jsx_runtime["jsxs"])(TableRow["a" /* default */], { children: [Object(jsx_runtime["jsx"])(TableCell["a" /* default */], { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.label, variant: "body2" }, { children: "Contract" }), void 0) }, void 0),
                            Object(jsx_runtime["jsxs"])(TableCell["a" /* default */], { children: [Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ variant: "body2", component: "span" }, { children: Object(formatter["d" /* formatEthereumAddress */])(trending.coin.eth_address, 4) }), void 0),
                                    Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ color: "primary", size: "small", onClick: onCopyAddress }, { children: Object(jsx_runtime["jsx"])(FileCopy_default.a, { fontSize: "small" }, void 0) }), void 0)] }, void 0)] }, void 0)) : null,
                    ((_a = trending.coin.tags) === null || _a === void 0 ? void 0 : _a.length) ? (Object(jsx_runtime["jsxs"])(TableRow["a" /* default */], { children: [Object(jsx_runtime["jsx"])(TableCell["a" /* default */], { children: Object(jsx_runtime["jsx"])(Typography["a" /* default */], Object.assign({ className: classes.label, variant: "body2" }, { children: "Tags" }), void 0) }, void 0),
                            Object(jsx_runtime["jsx"])(TableCell["a" /* default */], { children: trending.coin.tags.map((x, i) => (Object(jsx_runtime["jsx"])(Linking["a" /* Linking */], { href: x, TypographyProps: { className: classes.tag } }, i))) }, void 0)] }, void 0)) : null] }, void 0) }), void 0) }), void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/CoinMarketPanel.tsx




const CoinMarketPanel_useStyles = Object(makeStyles["a" /* default */])((theme) => Object(createStyles["a" /* default */])({
    root: {
        padding: theme.spacing(2),
    },
}));
function CoinMarketPanel(props) {
    const { dataProvider, trending } = props;
    const classes = CoinMarketPanel_useStyles();
    return (Object(jsx_runtime["jsxs"])("div", Object.assign({ className: classes.root }, { children: [Object(jsx_runtime["jsx"])(CoinMetadataTable, { dataProvider: dataProvider, trending: trending }, void 0),
            Object(jsx_runtime["jsx"])("br", {}, void 0),
            Object(jsx_runtime["jsx"])(CoinMarketTable, { dataProvider: dataProvider, trending: trending }, void 0)] }), void 0));
}

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/TrendingCard.tsx
var TrendingCard = __webpack_require__(289);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/TrendingViewError.tsx
var TrendingViewError = __webpack_require__(534);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/TrendingViewSkeleton.tsx
var TrendingViewSkeleton = __webpack_require__(535);

// EXTERNAL MODULE: ./node_modules/react-feather/dist/icons/dollar-sign.js
var dollar_sign = __webpack_require__(1659);

// EXTERNAL MODULE: ./packages/maskbook/src/utils/hooks/useRemoteControlledDialog.ts
var useRemoteControlledDialog = __webpack_require__(57);

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Transak/messages.ts
var Transak_messages = __webpack_require__(210);

// EXTERNAL MODULE: ./packages/maskbook/src/web3/hooks/useAccount.ts
var useAccount = __webpack_require__(64);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Trader/UI/trending/SearchResultView.tsx

































const SearchResultView_useStyles = Object(makeStyles["a" /* default */])((theme) => {
    return Object(createStyles["a" /* default */])({
        root: {
            width: '100%',
            boxShadow: 'none',
            borderRadius: 0,
            marginBottom: theme.spacing(2),
            '&::-webkit-scrollbar': {
                display: 'none',
            },
        },
        content: {
            padding: 0,
        },
        header: {
            display: 'flex',
            position: 'relative',
        },
        body: {},
        footer: {
            borderTop: `solid 1px ${theme.palette.divider}`,
            borderBottom: `solid 1px ${theme.palette.divider}`,
            padding: theme.spacing(2),
            justifyContent: 'space-between',
        },
        tabs: {
            borderTop: `solid 1px ${theme.palette.divider}`,
            borderBottom: `solid 1px ${theme.palette.divider}`,
            width: '100%',
            minHeight: 'unset',
        },
        tab: {
            minHeight: 'unset',
            minWidth: 'unset',
        },
        section: {},
        rank: {
            color: theme.palette.text.primary,
            fontWeight: 300,
            marginRight: theme.spacing(1),
        },
        footnote: {
            fontSize: 10,
        },
        footlink: {
            cursor: 'pointer',
            marginRight: theme.spacing(0.5),
            '&:last-child': {
                marginRight: 0,
            },
        },
        avatar: {
            backgroundColor: theme.palette.common.white,
        },
        currency: {
            marginRight: theme.spacing(1),
        },
        percentage: {
            marginLeft: theme.spacing(1),
        },
        maskbook: {
            width: 40,
            height: 10,
        },
        cmc: {
            width: 96,
            height: 16,
            verticalAlign: 'bottom',
        },
        uniswap: {
            width: 16,
            height: 16,
            verticalAlign: 'bottom',
        },
    });
});
function SearchResultView(props) {
    var _a, _b, _c, _d;
    const ETH_ADDRESS = Object(useConstant["a" /* useConstant */])(constants["a" /* CONSTANTS */], 'ETH_ADDRESS');
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = SearchResultView_useStyles();
    const [tabIndex, setTabIndex] = Object(react["useState"])(0);
    //#region trending
    const dataProvider = Object(useCurrentDataProvider["a" /* useCurrentDataProvider */])(props.dataProviders);
    const { value: { currency, trending }, error: trendingError, loading: loadingTrending, } = Object(useTrending["a" /* useTrending */])(props.name, dataProvider);
    //#endregion
    //#region swap
    const tradeProvider = Object(useCurrentTradeProvider["a" /* useCurrentTradeProvider */])(props.tradeProviders);
    //#endregion
    //#region stats
    const [days, setDays] = Object(react["useState"])(PriceChartDaysControl["a" /* Days */].ONE_YEAR);
    const { value: stats = [], loading: loadingStats } = Object(usePriceStats["a" /* usePriceStats */])({
        coinId: trending === null || trending === void 0 ? void 0 : trending.coin.id,
        dataProvider: trending === null || trending === void 0 ? void 0 : trending.dataProvider,
        currency: trending === null || trending === void 0 ? void 0 : trending.currency,
        days,
    });
    //#endregion
    //#region buy
    const account = Object(useAccount["a" /* useAccount */])();
    const [, setBuyDialogOpen] = Object(useRemoteControlledDialog["a" /* useRemoteControlledDialog */])(Transak_messages["a" /* PluginTransakMessages */].events.buyTokenDialogUpdated);
    const onBuyButtonClicked = Object(react["useCallback"])(() => {
        setBuyDialogOpen({
            open: true,
            code: coin.symbol,
            address: account,
        });
    }, [account, (_a = trending === null || trending === void 0 ? void 0 : trending.coin) === null || _a === void 0 ? void 0 : _a.symbol]);
    //#endregion
    //#region no available providers
    if (props.dataProviders.length === 0)
        return null;
    //#endregion
    //#region error handling
    // error: unknown coin or api error
    if (trendingError)
        return (Object(jsx_runtime["jsx"])(TrendingViewError["a" /* TrendingViewError */], { message: Object(jsx_runtime["jsxs"])("span", { children: ["Fail to load trending info from", ' ', Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ color: "primary", target: "_blank", rel: "noopener noreferrer", href: Object(pipes["a" /* resolveDataProviderLink */])(dataProvider) }, { children: Object(pipes["b" /* resolveDataProviderName */])(dataProvider) }), void 0), "."] }, void 0), TrendingCardProps: { classes: { root: classes.root } } }, void 0));
    //#region display loading skeleton
    if (loadingTrending || !currency || !trending)
        return Object(jsx_runtime["jsx"])(TrendingViewSkeleton["a" /* TrendingViewSkeleton */], { TrendingCardProps: { classes: { root: classes.root } } }, void 0);
    //#endregion
    const { coin, market, tickers } = trending;
    const canSwap = trending.coin.eth_address || trending.coin.symbol.toLowerCase() === 'eth';
    return (Object(jsx_runtime["jsxs"])(TrendingCard["a" /* TrendingCard */], Object.assign({ classes: { root: classes.root } }, { children: [Object(jsx_runtime["jsx"])(CardHeader["a" /* default */], { className: classes.header, avatar: Object(jsx_runtime["jsx"])(Linking["a" /* Linking */], Object.assign({ href: Object(lodash["first"])(coin.home_urls) }, { children: Object(jsx_runtime["jsx"])(Avatar_Avatar["a" /* default */], { className: classes.avatar, src: coin.image_url, alt: coin.symbol }, void 0) }), void 0), title: Object(jsx_runtime["jsxs"])(Box["a" /* default */], Object.assign({ display: "flex", alignItems: "center", justifyContent: "space-between" }, { children: [Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ variant: "h6" }, { children: [Object(jsx_runtime["jsx"])(Linking["a" /* Linking */], Object.assign({ href: Object(lodash["first"])(coin.home_urls) }, { children: coin.symbol.toUpperCase() }), void 0),
                                Object(jsx_runtime["jsx"])("span", { children: ` / ${currency.name}` }, void 0)] }), void 0),
                        account && trending.coin.symbol && flags["a" /* Flags */].transak_enabled ? (Object(jsx_runtime["jsx"])(IconButton["a" /* default */], Object.assign({ color: "primary", onClick: onBuyButtonClicked }, { children: Object(jsx_runtime["jsx"])(dollar_sign["a" /* default */], { size: 18 }, void 0) }), void 0)) : null] }), void 0), subheader: Object(jsx_runtime["jsx"])(jsx_runtime["Fragment"], { children: Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ component: "p", variant: "body1" }, { children: [market ? (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [Object(jsx_runtime["jsx"])("span", Object.assign({ className: classes.currency }, { children: currency.name }), void 0),
                                    Object(jsx_runtime["jsx"])("span", { children: Object(formatter["c" /* formatCurrency */])(dataProvider === Trader_types["a" /* DataProvider */].COIN_MARKET_CAP
                                            ? (_c = (_b = Object(lodash["last"])(stats)) === null || _b === void 0 ? void 0 : _b[1]) !== null && _c !== void 0 ? _c : market.current_price : market.current_price, currency.symbol) }, void 0)] }, void 0)) : (Object(jsx_runtime["jsx"])("span", { children: t('plugin_trader_no_data') }, void 0)),
                            typeof (market === null || market === void 0 ? void 0 : market.price_change_percentage_24h) === 'number' ? (Object(jsx_runtime["jsx"])(PriceChanged["a" /* PriceChanged */], { amount: market.price_change_percentage_24h }, void 0)) : null] }), void 0) }, void 0), disableTypography: true }, void 0),
            Object(jsx_runtime["jsx"])(CardContent["a" /* default */], Object.assign({ className: classes.content }, { children: Object(jsx_runtime["jsxs"])(Paper["a" /* default */], Object.assign({ className: classes.body, elevation: 0 }, { children: [Object(jsx_runtime["jsxs"])(Tabs["a" /* default */], Object.assign({ className: classes.tabs, textColor: "primary", variant: "fullWidth", value: tabIndex, onChange: (ev, newValue) => setTabIndex(newValue), TabIndicatorProps: {
                                style: {
                                    display: 'none',
                                },
                            } }, { children: [Object(jsx_runtime["jsx"])(Tab["a" /* default */], { className: classes.tab, label: t('plugin_trader_tab_market') }, void 0),
                                Object(jsx_runtime["jsx"])(Tab["a" /* default */], { className: classes.tab, label: t('plugin_trader_tab_price') }, void 0),
                                Object(jsx_runtime["jsx"])(Tab["a" /* default */], { className: classes.tab, label: t('plugin_trader_tab_exchange') }, void 0),
                                canSwap ? Object(jsx_runtime["jsx"])(Tab["a" /* default */], { className: classes.tab, label: t('plugin_trader_tab_swap') }, void 0) : null] }), void 0),
                        tabIndex === 0 ? Object(jsx_runtime["jsx"])(CoinMarketPanel, { dataProvider: dataProvider, trending: trending }, void 0) : null,
                        tabIndex === 1 ? (Object(jsx_runtime["jsxs"])(jsx_runtime["Fragment"], { children: [market ? Object(jsx_runtime["jsx"])(PriceChangedTable["a" /* PriceChangedTable */], { market: market }, void 0) : null,
                                Object(jsx_runtime["jsx"])(PriceChart["a" /* PriceChart */], Object.assign({ coin: coin, stats: stats, loading: loadingStats }, { children: Object(jsx_runtime["jsx"])(PriceChartDaysControl["b" /* PriceChartDaysControl */], { days: days, onDaysChange: setDays }, void 0) }), void 0)] }, void 0)) : null,
                        tabIndex === 2 ? Object(jsx_runtime["jsx"])(TickersTable["a" /* TickersTable */], { tickers: tickers, dataProvider: dataProvider }, void 0) : null,
                        tabIndex === 3 && canSwap ? (Object(jsx_runtime["jsx"])(TradeView["a" /* TradeView */], { TraderProps: {
                                address: (_d = coin.eth_address) !== null && _d !== void 0 ? _d : ETH_ADDRESS,
                                name: coin.name,
                                symbol: coin.symbol,
                            } }, void 0)) : null] }), void 0) }), void 0),
            Object(jsx_runtime["jsxs"])(CardActions["a" /* default */], Object.assign({ className: classes.footer }, { children: [Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ className: classes.footnote, color: "textSecondary", variant: "subtitle2" }, { children: [Object(jsx_runtime["jsx"])("span", { children: "Powered by " }, void 0),
                            Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ className: classes.footlink, color: "textSecondary", target: "_blank", rel: "noopener noreferrer", title: "Mask Network", href: "https://mask.io" }, { children: Object(jsx_runtime["jsx"])(MaskbookIcon["c" /* MaskbookTextIcon */], { classes: { root: classes.maskbook }, viewBox: "0 0 80 20" }, void 0) }), void 0)] }), void 0),
                    tabIndex === 0 || tabIndex === 1 || tabIndex === 2 ? (Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ className: classes.footnote, color: "textSecondary", variant: "subtitle2" }, { children: [Object(jsx_runtime["jsx"])("span", { children: "Data source " }, void 0),
                            Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ className: classes.footlink, color: "textSecondary", target: "_blank", rel: "noopener noreferrer", title: Object(pipes["b" /* resolveDataProviderName */])(dataProvider), href: Object(pipes["a" /* resolveDataProviderLink */])(dataProvider) }, { children: dataProvider === Trader_types["a" /* DataProvider */].COIN_MARKET_CAP ? (Object(jsx_runtime["jsx"])(CoinMarketCapIcon["a" /* CoinMarketCapIcon */], { classes: {
                                        root: classes.cmc,
                                    }, viewBox: "0 0 96 16" }, void 0)) : (Object(pipes["b" /* resolveDataProviderName */])(dataProvider)) }), void 0)] }), void 0)) : null,
                    tabIndex === 3 ? (Object(jsx_runtime["jsxs"])(Typography["a" /* default */], Object.assign({ className: classes.footnote, color: "textSecondary", variant: "subtitle2" }, { children: [Object(jsx_runtime["jsx"])("span", { children: "Based on " }, void 0),
                            Object(jsx_runtime["jsx"])(Link["a" /* default */], Object.assign({ className: classes.footlink, color: "textSecondary", target: "_blank", rel: "noopener noreferrer", title: Object(pipes["f" /* resolveTradeProviderName */])(Trader_types["d" /* TradeProvider */].UNISWAP), href: Object(pipes["e" /* resolveTradeProviderLink */])(Trader_types["d" /* TradeProvider */].UNISWAP) }, { children: tradeProvider === Trader_types["d" /* TradeProvider */].UNISWAP ? (Object(jsx_runtime["jsx"])(UniswapIcon["a" /* UniswapIcon */], { classes: { root: classes.uniswap }, viewBox: "0 0 16 16" }, void 0)) : (Object(pipes["f" /* resolveTradeProviderName */])(tradeProvider)) }), void 0), ' V2'] }), void 0)) : null] }), void 0)] }), void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Trader/trending/useSearchedKeyword.ts


/**
 * Listing all possible pathnames start from /search that the search box will keep existing on twitter.
 * That means the keyword will not be cleaned and related components keep injecting.
 * Otherwise, if a pathname not in this list the keyword will be cleaned and remove relative components from DOM.
 */
const SAFE_PATHNAMES_ON_TWITTER = [
    '/compose/tweet',
    '/search-advanced',
    '/settings/trends',
    '/settings/search',
    '/i/display',
    '/account/switch',
    '/i/keyboard_shortcuts',
];
function useSearchedKeyword() {
    var _a;
    const internalName = (_a = Object(ui["getActivatedUI"])()) === null || _a === void 0 ? void 0 : _a.internalName;
    const [keyword, setKeyword] = Object(react["useState"])('');
    const onLocationChange = Object(react["useCallback"])(() => {
        var _a;
        if (internalName !== 'twitter')
            return;
        const params = new URLSearchParams(location.search);
        if (location.pathname === '/search' && !params.get('f'))
            setKeyword(decodeURIComponent((_a = params.get('q')) !== null && _a !== void 0 ? _a : ''));
        else if (!SAFE_PATHNAMES_ON_TWITTER.includes(location.pathname))
            setKeyword('');
    }, []);
    Object(react["useEffect"])(() => {
        onLocationChange();
        window.addEventListener('locationchange', onLocationChange);
        return () => window.removeEventListener('locationchange', onLocationChange);
    }, [onLocationChange]);
    return keyword;
}

// EXTERNAL MODULE: ./packages/maskbook/src/plugins/Trader/messages.ts
var Trader_messages = __webpack_require__(135);

// CONCATENATED MODULE: ./packages/maskbook/src/components/InjectedComponents/SearchResultBox.tsx









const SearchResultBox_useStyles = Object(makeStyles["a" /* default */])({
    root: {},
});
function SearchResultBox(props) {
    var _a;
    const { t } = Object(i18n_next_ui["a" /* useI18N */])();
    const classes = Object(custom_ui_helper["d" /* useStylesExtends */])(SearchResultBox_useStyles(), props);
    const keyword = useSearchedKeyword();
    const [_, name = ''] = (_a = keyword.match(/\$([\w\d]+)/)) !== null && _a !== void 0 ? _a : [];
    const { value: dataProviders } = Object(useAsync["a" /* default */])(async () => {
        if (!name)
            return;
        return Trader_messages["b" /* PluginTraderRPC */].getAvailableDataProviders(name);
    }, [name]);
    if (!name || !(dataProviders === null || dataProviders === void 0 ? void 0 : dataProviders.length))
        return null;
    return (Object(jsx_runtime["jsx"])("div", Object.assign({ className: classes.root }, { children: Object(jsx_runtime["jsx"])(SearchResultView, { name: name, dataProviders: dataProviders, tradeProviders: [Trader_types["d" /* TradeProvider */].UNISWAP] }, void 0) }), void 0));
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/injectSearchResultBox.tsx






function injectSearchResultBoxAtTwitter() {
    const watcher = new MutationObserverWatcher["a" /* MutationObserverWatcher */](searchResultHeadingSelector());
    Object(utils_watcher["a" /* startWatch */])(watcher);
    Object(renderInShadowRoot["a" /* renderInShadowRoot */])(Object(jsx_runtime["jsx"])(SearchResultBoxAtTwitter, {}, void 0), { shadow: () => watcher.firstDOMProxy.afterShadow });
}
function SearchResultBoxAtTwitter() {
    return Object(jsx_runtime["jsx"])(SearchResultBox, {}, void 0);
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/inject.tsx








const injectPostBox = () => {
    injectPostDialogAtTwitter();
    injectPostDialogHintAtTwitter();
    injectPostDialogIconAtTwitter();
};
const twitterUIInjections = {
    injectPostBox,
    injectSetupPrompt: injectSetupPromptAtTwitter,
    injectSearchResultBox: injectSearchResultBoxAtTwitter,
    injectPostReplacer: injectPostReplacerAtTwitter,
    injectPostInspector: injectPostInspectorAtTwitter,
    injectPageInspector: injectPageInspectorDefault(),
};

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/custom.ts










const primaryColorRef = new ValueRef["a" /* ValueRef */](toRGB([29, 161, 242]));
const primaryColorContrastColorRef = new ValueRef["a" /* ValueRef */](toRGB([255, 255, 255]));
const backgroundColorRef = new ValueRef["a" /* ValueRef */](toRGB([255, 255, 255]));
function startWatchThemeColor() {
    function updateThemeColor() {
        const color = getBackgroundColor(composeAnchorSelector().evaluate());
        const contrastColor = getForegroundColor(composeAnchorTextSelector().evaluate());
        const backgroundColor = getBackgroundColor(document.body);
        if (color)
            primaryColorRef.value = color;
        if (contrastColor)
            primaryColorContrastColorRef.value = contrastColor;
        if (backgroundColor)
            backgroundColorRef.value = backgroundColor;
    }
    new MutationObserverWatcher["a" /* MutationObserverWatcher */](composeAnchorSelector())
        .addListener('onAdd', updateThemeColor)
        .addListener('onChange', updateThemeColor)
        .startWatch({
        childList: true,
        subtree: true,
    });
}
function useTheme() {
    const primaryColor = Object(useValueRef["a" /* useValueRef */])(primaryColorRef);
    const primaryContrastColor = Object(useValueRef["a" /* useValueRef */])(primaryColorContrastColorRef);
    const backgroundColor = Object(useValueRef["a" /* useValueRef */])(backgroundColorRef);
    const MaskbookTheme = Object(utils_theme["d" /* useMaskbookTheme */])({
        appearance: isDark(fromRGB(backgroundColor)) ? settings["a" /* Appearance */].dark : settings["a" /* Appearance */].light,
    });
    return Object(react["useMemo"])(() => {
        const primaryColorRGB = fromRGB(primaryColor);
        const primaryContrastColorRGB = fromRGB(primaryContrastColor);
        Object(immer_esm["d" /* setAutoFreeze */])(false);
        const TwitterTheme = Object(immer_esm["a" /* default */])(MaskbookTheme, (theme) => {
            theme.palette.background.paper = backgroundColor;
            theme.palette.primary = {
                light: toRGB(shade(primaryColorRGB, 10)),
                main: toRGB(primaryColorRGB),
                dark: toRGB(shade(primaryColorRGB, -10)),
                contrastText: toRGB(primaryContrastColorRGB),
            };
            theme.shape.borderRadius = utils_isMobile["a" /* isMobileTwitter */] ? 0 : 15;
            theme.breakpoints.values = { xs: 0, sm: 687, md: 1024, lg: 1280, xl: 1920 };
            theme.props = theme.props || {};
            theme.props.MuiButton = {
                size: 'medium',
                disableElevation: true,
            };
            theme.props.MuiPaper = {
                elevation: 0,
            };
            theme.overrides = theme.overrides || {};
            theme.overrides.MuiButton = {
                root: {
                    borderRadius: 500,
                    textTransform: 'initial',
                    fontWeight: 'bold',
                    minHeight: 39,
                    paddingLeft: 15,
                    paddingRight: 15,
                    boxShadow: 'none',
                    [`@media (max-width: ${theme.breakpoints.width('sm')}px)`]: {
                        '&': {
                            height: '28px !important',
                            minHeight: 'auto !important',
                            padding: '0 14px !important',
                        },
                    },
                },
                sizeLarge: {
                    minHeight: 49,
                    paddingLeft: 30,
                    paddingRight: 30,
                },
                sizeSmall: {
                    minHeight: 30,
                    paddingLeft: 15,
                    paddingRight: 15,
                },
            };
            theme.overrides.MuiTab = {
                root: {
                    textTransform: 'none',
                },
            };
        });
        Object(immer_esm["d" /* setAutoFreeze */])(true);
        return Object(createMuiStrictModeTheme["a" /* default */])(TwitterTheme);
    }, [MaskbookTheme, backgroundColor, primaryColor, primaryContrastColor]);
}
function TwitterThemeProvider(props) {
    if (true)
        throw new Error('This API is only for Storybook!');
    return Object(react["createElement"])(ThemeProvider["a" /* default */], { theme: useTheme(), ...props });
}
const useInjectedDialogClassesOverwrite = Object(makeStyles["a" /* default */])((theme) => custom_createStyles({
    root: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        [`@media (max-width: ${theme.breakpoints.width('sm')}px)`]: {
            display: 'block !important',
        },
    },
    container: {
        alignItems: 'center',
    },
    paper: {
        width: '600px !important',
        boxShadow: 'none',
        [`@media (max-width: ${theme.breakpoints.width('sm')}px)`]: {
            '&': {
                display: 'block !important',
                borderRadius: '0 !important',
            },
        },
    },
    dialogTitle: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 15px',
        borderBottom: `1px solid ${theme.palette.type === 'dark' ? '#2f3336' : '#ccd6dd'}`,
        '& > h2': {
            display: 'inline-block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        [`@media (max-width: ${theme.breakpoints.width('sm')}px)`]: {
            '&': {
                display: 'flex',
                justifyContent: 'space-between',
                maxWidth: 600,
                margin: '0 auto',
                padding: '7px 14px 6px 11px !important',
            },
        },
    },
    dialogContent: {
        [`@media (max-width: ${theme.breakpoints.width('sm')}px)`]: {
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 600,
            margin: '0 auto',
            padding: '7px 14px 6px !important',
        },
    },
    dialogActions: {
        padding: '10px 15px',
        [`@media (max-width: ${theme.breakpoints.width('sm')}px)`]: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            maxWidth: 600,
            margin: '0 auto',
            padding: '7px 14px 6px !important',
        },
    },
    dialogBackdropRoot: {
        backgroundColor: theme.palette.type === 'dark' ? 'rgba(110, 118, 125, 0.4)' : 'rgba(0, 0, 0, 0.4)',
    },
}));
const twitterUICustomUI = {
    useTheme,
    componentOverwrite: {
        InjectedDialog: {
            classes: useInjectedDialogClassesOverwrite,
        },
    },
};
function custom_createStyles(styles) {
    return styles;
}

// CONCATENATED MODULE: ./packages/maskbook/src/social-network-provider/twitter.com/ui/index.ts














const ui_origins = [`${utils_url["e" /* twitterUrl */].hostLeadingUrl}/*`, `${utils_url["e" /* twitterUrl */].hostLeadingUrlMobile}/*`];
const instanceOfTwitterUI = Object(ui["defineSocialNetworkUI"])({
    ...twitter_com["a" /* sharedSettings */],
    ...twitterUITasks,
    ...twitterUIInjections,
    ...twitterUIFetch,
    ...twitterUICustomUI,
    i18nOverwrite: {
        en: {
            additional_post_box__encrypted_post_pre: [
                'This tweet is encrypted with #mask_io (@realMaskbook). 📪🔑',
                'Install {{encrypted}} to decrypt it.',
            ].join('\n\n'),
        },
        zh: {
            additional_post_box__encrypted_post_pre: [
                '此推文已被 Maskbook（@realmaskbook）加密。📪🔑',
                '請安裝 {{encrypted}} 進行解密。',
            ].join('\n\n'),
        },
    },
    init: (env, pref) => {
        startWatchThemeColor();
        twitter_com["a" /* sharedSettings */].init(env, pref);
        InitFriendsValueRef(instanceOfTwitterUI, utils_url["e" /* twitterUrl */].hostIdentifier);
        InitGroupsValueRef(instanceOfTwitterUI, utils_url["e" /* twitterUrl */].hostIdentifier, [
            type["PreDefinedVirtualGroupNames"].friends,
            type["PreDefinedVirtualGroupNames"].followers,
            type["PreDefinedVirtualGroupNames"].following,
        ]);
        Object(MyIdentitiesRef["a" /* InitMyIdentitiesValueRef */])(instanceOfTwitterUI, utils_url["e" /* twitterUrl */].hostIdentifier);
        injectMaskbookIconToProfile();
        injectMaskbookIconIntoFloatingProfileCard();
    },
    shouldActivate(location = globalThis.location) {
        return location.hostname.endsWith(utils_url["e" /* twitterUrl */].hostIdentifier);
    },
    friendlyName: 'Twitter',
    hasPermission() {
        return browser.permissions.contains({ origins: ui_origins });
    },
    requestPermission() {
        // TODO: wait for webextension-shim to support <all_urls> in permission.
        if (flags["a" /* Flags */].no_web_extension_dynamic_permission_request)
            return Promise.resolve(true);
        return browser.permissions.request({ origins: ui_origins });
    },
    setupAccount: () => {
        instanceOfTwitterUI.requestPermission().then((granted) => {
            if (granted) {
                Object(browser_storage["a" /* setStorage */])(utils_url["e" /* twitterUrl */].hostIdentifier, { forceDisplayWelcome: true }).then();
                location.href = utils_url["e" /* twitterUrl */].hostLeadingUrl;
            }
        });
    },
    ignoreSetupAccount() {
        Object(browser_storage["a" /* setStorage */])(utils_url["e" /* twitterUrl */].hostIdentifier, { userIgnoredWelcome: true, forceDisplayWelcome: false }).then();
    },
});

// CONCATENATED MODULE: ./packages/maskbook/src/provider.ui.ts




/***/ })

}]);