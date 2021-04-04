(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[92],{

/***/ 105:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return SnackbarProvider; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return useSnackbar; });
/* unused harmony export withSnackbar */
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(129);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_dom__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var clsx__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _material_ui_core_styles__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(127);
/* harmony import */ var _material_ui_core_styles__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(16);
/* harmony import */ var _material_ui_core_styles__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(109);
/* harmony import */ var _material_ui_core_Snackbar__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(1551);
/* harmony import */ var _material_ui_core_Slide__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(1550);
/* harmony import */ var _material_ui_core_Collapse__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(920);
/* harmony import */ var _material_ui_core_SnackbarContent__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(922);
/* harmony import */ var _material_ui_core_SvgIcon__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(178);
/* harmony import */ var hoist_non_react_statics__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(211);
/* harmony import */ var hoist_non_react_statics__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(hoist_non_react_statics__WEBPACK_IMPORTED_MODULE_11__);











function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _extends() {
  _extends = Object.assign || function (target) {
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

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

var SnackbarContext = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createContext();

var allClasses = {
  mui: {
    root: {},
    anchorOriginTopCenter: {},
    anchorOriginBottomCenter: {},
    anchorOriginTopRight: {},
    anchorOriginBottomRight: {},
    anchorOriginTopLeft: {},
    anchorOriginBottomLeft: {}
  },
  container: {
    containerRoot: {},
    containerAnchorOriginTopCenter: {},
    containerAnchorOriginBottomCenter: {},
    containerAnchorOriginTopRight: {},
    containerAnchorOriginBottomRight: {},
    containerAnchorOriginTopLeft: {},
    containerAnchorOriginBottomLeft: {}
  }
};
var MESSAGES = {
  NO_PERSIST_ALL: 'WARNING - notistack: Reached maxSnack while all enqueued snackbars have \'persist\' flag. Notistack will dismiss the oldest snackbar anyway to allow other ones in the queue to be presented.'
};
var SNACKBAR_INDENTS = {
  view: {
    "default": 20,
    dense: 4
  },
  snackbar: {
    "default": 6,
    dense: 2
  }
};
var capitalise = function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
};
var originKeyExtractor = function originKeyExtractor(anchor) {
  return "" + capitalise(anchor.vertical) + capitalise(anchor.horizontal);
};
/**
 * Omit SnackbarContainer class keys that are not needed for SnackbarItem
 */

var omitContainerKeys = function omitContainerKeys(classes) {
  return (// @ts-ignore
    Object.keys(classes).filter(function (key) {
      return !allClasses.container[key];
    }).reduce(function (obj, key) {
      var _extends2;

      return _extends({}, obj, (_extends2 = {}, _extends2[key] = classes[key], _extends2));
    }, {})
  );
};
var DEFAULTS = {
  variant: 'default',
  autoHideDuration: 5000,
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'left'
  }
};

var numberOrNull = function numberOrNull(numberish) {
  return typeof numberish === 'number' || numberish === null;
}; // @ts-ignore


var merge = function merge(options, props, defaults) {
  return function (name) {
    if (name === 'autoHideDuration') {
      if (numberOrNull(options.autoHideDuration)) return options.autoHideDuration;
      if (numberOrNull(props.autoHideDuration)) return props.autoHideDuration;
      return DEFAULTS.autoHideDuration;
    }

    return options[name] || props[name] || defaults[name];
  };
};
var REASONS = {
  CLICKAWAY: 'clickaway',
  MAXSNACK: 'maxsnack',
  INSTRUCTED: 'instructed'
};

var DIRECTION = {
  right: 'left',
  left: 'right',
  bottom: 'up',
  top: 'down'
};
var getTransitionDirection = function getTransitionDirection(anchorOrigin) {
  if (anchorOrigin.horizontal !== 'center') {
    return DIRECTION[anchorOrigin.horizontal];
  }

  return DIRECTION[anchorOrigin.vertical];
};
/**
 * Omit all class keys except those allowed in material-ui snackbar
 */

var omitNonMuiKeys = function omitNonMuiKeys(classes) {
  var snackbarMuiClasses = Object.keys(classes) // @ts-ignore
  .filter(function (key) {
    return allClasses.mui[key] !== undefined;
  }).reduce(function (obj, key) {
    var _extends2;

    return _extends({}, obj, (_extends2 = {}, _extends2[key] = classes[key], _extends2));
  }, {});
  return _extends({}, snackbarMuiClasses, {
    root: Object(clsx__WEBPACK_IMPORTED_MODULE_2__["default"])(classes.root, classes.wrappedRoot)
  });
};
/**
 * Omit all class keys except what we need for collapse component
 */

var omitNonCollapseKeys = function omitNonCollapseKeys(classes, dense) {
  return {
    container: classes.collapseContainer,
    wrapper: Object(clsx__WEBPACK_IMPORTED_MODULE_2__["default"])(classes.collapseWrapper, dense && classes.collapseWrapperDense)
  };
};

/**
 * @link https://github.com/mui-org/material-ui/blob/master/packages/material-ui/src/utils/createChainedFunction.js
 */
function createChainedFunction(funcs, extraArg) {
  return funcs.reduce(function (acc, func) {
    if (func == null) return acc;

    if (false) {}

    return function chainedFunction() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var argums = [].concat(args);

      if (extraArg && argums.indexOf(extraArg) === -1) {
        argums.push(extraArg);
      }

      acc.apply(this, argums);
      func.apply(this, argums);
    };
  }, function () {});
}

var styles = function styles(theme) {
  var _collapseContainer;

  return Object(_material_ui_core_styles__WEBPACK_IMPORTED_MODULE_3__[/* default */ "a"])(_extends({}, allClasses.mui, {
    lessPadding: {
      paddingLeft: 8 * 2.5
    },
    variantSuccess: {
      backgroundColor: '#43a047',
      color: '#fff'
    },
    variantError: {
      backgroundColor: '#d32f2f',
      color: '#fff'
    },
    variantInfo: {
      backgroundColor: '#2196f3',
      color: '#fff'
    },
    variantWarning: {
      backgroundColor: '#ff9800',
      color: '#fff'
    },
    message: {
      display: 'flex',
      alignItems: 'center'
    },
    wrappedRoot: {
      position: 'relative',
      transform: 'translateX(0)',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    collapseContainer: (_collapseContainer = {}, _collapseContainer[theme.breakpoints.down('xs')] = {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1)
    }, _collapseContainer),
    collapseWrapper: {
      transition: theme.transitions.create(['margin-bottom'], {
        easing: 'ease'
      }),
      marginTop: SNACKBAR_INDENTS.snackbar["default"],
      marginBottom: SNACKBAR_INDENTS.snackbar["default"]
    },
    collapseWrapperDense: {
      marginTop: SNACKBAR_INDENTS.snackbar.dense,
      marginBottom: SNACKBAR_INDENTS.snackbar.dense
    }
  }));
};

var SnackbarItem = function SnackbarItem(_ref) {
  var classes = _ref.classes,
      props = _objectWithoutPropertiesLoose(_ref, ["classes"]);

  var timeout = Object(react__WEBPACK_IMPORTED_MODULE_0__["useRef"])();

  var _useState = Object(react__WEBPACK_IMPORTED_MODULE_0__["useState"])(true),
      collapsed = _useState[0],
      setCollapsed = _useState[1];

  Object(react__WEBPACK_IMPORTED_MODULE_0__["useEffect"])(function () {
    return function () {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);
  var handleClose = createChainedFunction([props.snack.onClose, props.onClose], props.snack.key);

  var handleEntered = function handleEntered() {
    if (props.snack.requestClose) {
      handleClose(null, REASONS.INSTRCUTED);
    }
  };

  var handleExitedScreen = function handleExitedScreen() {
    timeout.current = setTimeout(function () {
      setCollapsed(!collapsed);
    }, 125);
  };

  var callbacks = ['onEnter', 'onEntering', 'onEntered', 'onExit', 'onExiting', 'onExited'].reduce(function (acc, cbName) {
    var _extends2;

    return _extends({}, acc, (_extends2 = {}, _extends2[cbName] = createChainedFunction([props.snack[cbName], props[cbName]], props.snack.key), _extends2));
  }, {});

  var action = props.action,
      content = props.content,
      _props$ContentProps = props.ContentProps,
      ContentProps = _props$ContentProps === void 0 ? {} : _props$ContentProps,
      hideIconVariant = props.hideIconVariant,
      iconVariant = props.iconVariant,
      snack = props.snack,
      dense = props.dense,
      _props$TransitionComp = props.TransitionComponent,
      TransitionComponent = _props$TransitionComp === void 0 ? _material_ui_core_Slide__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"] : _props$TransitionComp,
      _props$TransitionProp = props.TransitionProps,
      otherTransitionProps = _props$TransitionProp === void 0 ? {} : _props$TransitionProp,
      other = _objectWithoutPropertiesLoose(props, ["action", "content", "ContentProps", "hideIconVariant", "iconVariant", "snack", "dense", "TransitionComponent", "TransitionProps"]);

  var contentAction = ContentProps.action,
      className = ContentProps.className,
      otherContentProps = _objectWithoutPropertiesLoose(ContentProps, ["action", "className"]);

  var key = snack.key,
      variant = snack.variant,
      singleContent = snack.content,
      singleAction = snack.action,
      _snack$ContentProps = snack.ContentProps,
      singleContentProps = _snack$ContentProps === void 0 ? {} : _snack$ContentProps,
      anchorOrigin = snack.anchorOrigin,
      _snack$TransitionProp = snack.TransitionProps,
      singleTransitionProps = _snack$TransitionProp === void 0 ? {} : _snack$TransitionProp,
      singleSnackProps = _objectWithoutPropertiesLoose(snack, ["key", "persist", "entered", "requestClose", "variant", "content", "action", "ContentProps", "anchorOrigin", "TransitionProps"]);

  var icon = iconVariant[variant];

  var contentProps = _extends({}, otherContentProps, {}, singleContentProps, {
    action: singleAction || singleContentProps.action || contentAction || action
  });

  var transitionProps = _extends({
    direction: getTransitionDirection(anchorOrigin)
  }, otherTransitionProps, {}, singleTransitionProps, {
    onExited: handleExitedScreen
  });

  var ariaDescribedby = contentProps['aria-describedby'] || 'client-snackbar';
  var finalAction = contentProps.action;

  if (typeof finalAction === 'function') {
    // @ts-ignore
    finalAction = contentProps.action(key);
  }

  var snackContent = singleContent || content;

  if (snackContent && typeof snackContent === 'function') {
    snackContent = snackContent(key, snack.message);
  }

  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_material_ui_core_Collapse__WEBPACK_IMPORTED_MODULE_8__[/* default */ "a"], {
    unmountOnExit: true,
    timeout: 175,
    "in": collapsed,
    classes: omitNonCollapseKeys(classes, dense),
    onExited: callbacks.onExited
  }, react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_material_ui_core_Snackbar__WEBPACK_IMPORTED_MODULE_6__[/* default */ "a"] // @ts-ignore
  , Object.assign({
    // @ts-ignore
    TransitionComponent: TransitionComponent
  }, other, singleSnackProps, {
    open: snack.open,
    anchorOrigin: anchorOrigin,
    TransitionProps: transitionProps,
    classes: omitNonMuiKeys(classes),
    onClose: handleClose,
    onExit: callbacks.onExit,
    onExiting: callbacks.onExiting,
    onEnter: callbacks.onEnter,
    onEntering: callbacks.onEntering,
    // order matters. first callbacks.onEntered to set entered: true,
    // then handleEntered to check if there's a request for closing
    onEntered: createChainedFunction([callbacks.onEntered, handleEntered])
  }), snackContent || react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_material_ui_core_SnackbarContent__WEBPACK_IMPORTED_MODULE_9__[/* default */ "a"], Object.assign({
    className: Object(clsx__WEBPACK_IMPORTED_MODULE_2__["default"])(classes["variant" + capitalise(variant)], className, !hideIconVariant && icon && classes.lessPadding)
  }, contentProps, {
    "aria-describedby": ariaDescribedby,
    message: react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("span", {
      id: ariaDescribedby,
      className: classes.message
    }, !hideIconVariant ? icon : null, snack.message),
    action: finalAction
  }))));
};

var SnackbarItem$1 = /*#__PURE__*/Object(_material_ui_core_styles__WEBPACK_IMPORTED_MODULE_4__[/* default */ "a"])(styles)(SnackbarItem);

var useStyle = /*#__PURE__*/Object(_material_ui_core_styles__WEBPACK_IMPORTED_MODULE_5__[/* default */ "a"])(function (theme) {
  var _root, _center;

  return {
    root: (_root = {
      boxSizing: 'border-box',
      display: 'flex',
      maxHeight: '100%',
      maxWidth: '100%',
      position: 'fixed',
      flexDirection: 'column',
      zIndex: theme.zIndex.snackbar,
      height: 'auto',
      width: 'auto',
      minWidth: 288,
      transition: theme.transitions.create(['top', 'right', 'bottom', 'left'], {
        easing: 'ease'
      })
    }, _root[theme.breakpoints.down('xs')] = {
      left: '0 !important',
      right: '0 !important',
      width: '100%'
    }, _root),
    reverseColumns: {
      flexDirection: 'column-reverse'
    },
    top: {
      top: SNACKBAR_INDENTS.view["default"] - SNACKBAR_INDENTS.snackbar["default"]
    },
    topDense: {
      top: SNACKBAR_INDENTS.view.dense - SNACKBAR_INDENTS.snackbar.dense
    },
    bottom: {
      bottom: SNACKBAR_INDENTS.view["default"] - SNACKBAR_INDENTS.snackbar["default"]
    },
    bottomDense: {
      bottom: SNACKBAR_INDENTS.view.dense - SNACKBAR_INDENTS.snackbar.dense
    },
    left: {
      left: SNACKBAR_INDENTS.view["default"]
    },
    leftDense: {
      left: SNACKBAR_INDENTS.view.dense
    },
    right: {
      right: SNACKBAR_INDENTS.view["default"]
    },
    rightDense: {
      right: SNACKBAR_INDENTS.view.dense
    },
    center: (_center = {
      left: '50%',
      transform: 'translateX(-50%)'
    }, _center[theme.breakpoints.down('xs')] = {
      transform: 'translateX(0)'
    }, _center)
  };
});

var SnackbarContainer = function SnackbarContainer(props) {
  var classes = useStyle();

  var className = props.className,
      anchorOrigin = props.anchorOrigin,
      dense = props.dense,
      other = _objectWithoutPropertiesLoose(props, ["className", "anchorOrigin", "dense"]);

  var combinedClassname = Object(clsx__WEBPACK_IMPORTED_MODULE_2__["default"])(classes.root, classes[anchorOrigin.vertical], classes[anchorOrigin.horizontal], // @ts-ignore
  classes["" + anchorOrigin.vertical + (dense ? 'Dense' : '')], // @ts-ignore
  classes["" + anchorOrigin.horizontal + (dense ? 'Dense' : '')], className, anchorOrigin.vertical === 'bottom' && classes.reverseColumns);
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("div", Object.assign({
    className: combinedClassname
  }, other));
};

var SnackbarContainer$1 = /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.memo(SnackbarContainer);

/* eslint-disable */
var __DEV__ = "production" !== 'production';

var warning = (function (message) {
  if (!__DEV__) return;

  if (typeof console !== 'undefined') {
    console.error(message);
  }

  try {
    throw new Error(message);
  } catch (x) {}
});

var CheckIcon = function CheckIcon(props) {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_material_ui_core_SvgIcon__WEBPACK_IMPORTED_MODULE_10__[/* default */ "a"], Object.assign({}, props), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41\n        10.59L10 14.17L17.59 6.58L19 8L10 17Z"
  }));
};

var WarningIcon = function WarningIcon(props) {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_material_ui_core_SvgIcon__WEBPACK_IMPORTED_MODULE_10__[/* default */ "a"], Object.assign({}, props), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"
  }));
};

var ErrorIcon = function ErrorIcon(props) {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_material_ui_core_SvgIcon__WEBPACK_IMPORTED_MODULE_10__[/* default */ "a"], Object.assign({}, props), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,\n        6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,\n        13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"
  }));
};

var InfoIcon = function InfoIcon(props) {
  return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(_material_ui_core_SvgIcon__WEBPACK_IMPORTED_MODULE_10__[/* default */ "a"], Object.assign({}, props), react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement("path", {
    d: "M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,\n        0 22,12A10,10 0 0,0 12,2Z"
  }));
};

var iconStyles = {
  fontSize: 20,
  marginInlineEnd: 8
};
var defaultIconVariants = {
  success: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(CheckIcon, {
    style: iconStyles
  }),
  warning: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(WarningIcon, {
    style: iconStyles
  }),
  error: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(ErrorIcon, {
    style: iconStyles
  }),
  info: /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(InfoIcon, {
    style: iconStyles
  })
};

var SnackbarProvider = /*#__PURE__*/function (_Component) {
  _inheritsLoose(SnackbarProvider, _Component);

  function SnackbarProvider(props) {
    var _this;

    _this = _Component.call(this, props) || this;
    /**
     * Adds a new snackbar to the queue to be presented.
     * Returns generated or user defined key referencing the new snackbar or null
     */

    _this.enqueueSnackbar = function (message, _ref) {
      if (_ref === void 0) {
        _ref = {};
      }

      var _ref2 = _ref,
          key = _ref2.key,
          preventDuplicate = _ref2.preventDuplicate,
          options = _objectWithoutPropertiesLoose(_ref2, ["key", "preventDuplicate"]);

      var hasSpecifiedKey = key || key === 0;
      var id = hasSpecifiedKey ? key : new Date().getTime() + Math.random();
      var merger = merge(options, _this.props, DEFAULTS);

      var snack = _extends({
        key: id
      }, options, {
        message: message,
        open: true,
        entered: false,
        requestClose: false,
        variant: merger('variant'),
        anchorOrigin: merger('anchorOrigin'),
        autoHideDuration: merger('autoHideDuration')
      });

      if (options.persist) {
        snack.autoHideDuration = undefined;
      }

      _this.setState(function (state) {
        if (preventDuplicate === undefined && _this.props.preventDuplicate || preventDuplicate) {
          var compareFunction = function compareFunction(item) {
            return hasSpecifiedKey ? item.key === key : item.message === message;
          };

          var inQueue = state.queue.findIndex(compareFunction) > -1;
          var inView = state.snacks.findIndex(compareFunction) > -1;

          if (inQueue || inView) {
            return state;
          }
        }

        return _this.handleDisplaySnack(_extends({}, state, {
          queue: [].concat(state.queue, [snack])
        }));
      });

      return id;
    };
    /**
     * Reducer: Display snack if there's space for it. Otherwise, immediately
     * begin dismissing the oldest message to start showing the new one.
     */


    _this.handleDisplaySnack = function (state) {
      var snacks = state.snacks;

      if (snacks.length >= _this.maxSnack) {
        return _this.handleDismissOldest(state);
      }

      return _this.processQueue(state);
    };
    /**
     * Reducer: Display items (notifications) in the queue if there's space for them.
     */


    _this.processQueue = function (state) {
      var queue = state.queue,
          snacks = state.snacks;

      if (queue.length > 0) {
        return _extends({}, state, {
          snacks: [].concat(snacks, [queue[0]]),
          queue: queue.slice(1, queue.length)
        });
      }

      return state;
    };
    /**
     * Reducer: Hide oldest snackbar on the screen because there exists a new one which we have to display.
     * (ignoring the one with 'persist' flag. i.e. explicitly told by user not to get dismissed).
     *
     * Note 1: If there is already a message leaving the screen, no new messages are dismissed.
     * Note 2: If the oldest message has not yet entered the screen, only a request to close the
     *         snackbar is made. Once it entered the screen, it will be immediately dismissed.
     */


    _this.handleDismissOldest = function (state) {
      if (state.snacks.some(function (item) {
        return !item.open || item.requestClose;
      })) {
        return state;
      }

      var popped = false;
      var ignore = false;
      var persistentCount = state.snacks.reduce(function (acc, current) {
        return acc + (current.open && current.persist ? 1 : 0);
      }, 0);

      if (persistentCount === _this.maxSnack) {
         false ? undefined : void 0;
        ignore = true;
      }

      var snacks = state.snacks.map(function (item) {
        if (!popped && (!item.persist || ignore)) {
          popped = true;

          if (!item.entered) {
            return _extends({}, item, {
              requestClose: true
            });
          }

          if (item.onClose) item.onClose(null, REASONS.MAXSNACK, item.key);
          if (_this.props.onClose) _this.props.onClose(null, REASONS.MAXSNACK, item.key);
          return _extends({}, item, {
            open: false
          });
        }

        return _extends({}, item);
      });
      return _extends({}, state, {
        snacks: snacks
      });
    };
    /**
     * Set the entered state of the snackbar with the given key.
     */


    _this.handleEnteredSnack = function (node, isAppearing, key) {
      if (!key) {
        throw new Error('handleEnteredSnack Cannot be called with undefined key');
      }

      _this.setState(function (_ref3) {
        var snacks = _ref3.snacks;
        return {
          snacks: snacks.map(function (item) {
            return item.key === key ? _extends({}, item, {
              entered: true
            }) : _extends({}, item);
          })
        };
      });
    };
    /**
     * Hide a snackbar after its timeout.
     */


    _this.handleCloseSnack = function (event, reason, key) {
      if (_this.props.onClose) {
        _this.props.onClose(event, reason, key);
      }

      if (reason === REASONS.CLICKAWAY) return;
      var shouldCloseAll = key === undefined;

      _this.setState(function (_ref4) {
        var snacks = _ref4.snacks,
            queue = _ref4.queue;
        return {
          snacks: snacks.map(function (item) {
            if (!shouldCloseAll && item.key !== key) {
              return _extends({}, item);
            }

            return item.entered ? _extends({}, item, {
              open: false
            }) : _extends({}, item, {
              requestClose: true
            });
          }),
          queue: queue.filter(function (item) {
            return item.key !== key;
          })
        };
      });
    };
    /**
     * Close snackbar with the given key
     */


    _this.closeSnackbar = function (key) {
      // call individual snackbar onClose callback passed through options parameter
      var toBeClosed = _this.state.snacks.find(function (item) {
        return item.key === key;
      });

      if (key && toBeClosed && toBeClosed.onClose) {
        toBeClosed.onClose(null, REASONS.INSTRUCTED, key);
      }

      _this.handleCloseSnack(null, REASONS.INSTRUCTED, key);
    };
    /**
     * When we set open attribute of a snackbar to false (i.e. after we hide a snackbar),
     * it leaves the screen and immediately after leaving animation is done, this method
     * gets called. We remove the hidden snackbar from state and then display notifications
     * waiting in the queue (if any). If after this process the queue is not empty, the
     * oldest message is dismissed.
     */
    // @ts-ignore


    _this.handleExitedSnack = function (event, key1, key2) {
      var key = key1 || key2;

      if (!key) {
        throw new Error('handleExitedSnack Cannot be called with undefined key');
      }

      _this.setState(function (state) {
        var newState = _this.processQueue(_extends({}, state, {
          snacks: state.snacks.filter(function (item) {
            return item.key !== key;
          })
        }));

        if (newState.queue.length === 0) {
          return newState;
        }

        return _this.handleDismissOldest(newState);
      });
    };

    _this.state = {
      snacks: [],
      queue: [],
      contextValue: {
        enqueueSnackbar: _this.enqueueSnackbar,
        closeSnackbar: _this.closeSnackbar
      }
    };
    return _this;
  }

  var _proto = SnackbarProvider.prototype;

  _proto.render = function render() {
    var _this2 = this;

    var contextValue = this.state.contextValue;

    var _this$props = this.props,
        domRoot = _this$props.domRoot,
        children = _this$props.children,
        _this$props$classes = _this$props.classes,
        classes = _this$props$classes === void 0 ? {} : _this$props$classes,
        _this$props$dense = _this$props.dense,
        dense = _this$props$dense === void 0 ? false : _this$props$dense,
        _this$props$hideIconV = _this$props.hideIconVariant,
        hideIconVariant = _this$props$hideIconV === void 0 ? false : _this$props$hideIconV,
        props = _objectWithoutPropertiesLoose(_this$props, ["variant", "maxSnack", "anchorOrigin", "preventDuplicate", "domRoot", "children", "classes", "dense", "hideIconVariant"]);

    var categ = this.state.snacks.reduce(function (acc, current) {
      var _extends2;

      var category = originKeyExtractor(current.anchorOrigin);
      var existingOfCategory = acc[category] || [];
      return _extends({}, acc, (_extends2 = {}, _extends2[category] = [].concat(existingOfCategory, [current]), _extends2));
    }, {});

    var iconVariant = _extends({}, defaultIconVariants, {}, this.props.iconVariant);

    var snackbars = Object.keys(categ).map(function (origin) {
      var snacks = categ[origin];
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(SnackbarContainer$1, {
        key: origin,
        dense: dense,
        anchorOrigin: snacks[0].anchorOrigin,
        className: Object(clsx__WEBPACK_IMPORTED_MODULE_2__["default"])(classes.containerRoot, classes["containerAnchorOrigin" + origin])
      }, snacks.map(function (snack) {
        return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(SnackbarItem$1, Object.assign({}, props, {
          key: snack.key,
          dense: dense,
          snack: snack,
          hideIconVariant: hideIconVariant,
          iconVariant: iconVariant,
          classes: omitContainerKeys(classes),
          onClose: _this2.handleCloseSnack,
          onExited: createChainedFunction([_this2.handleExitedSnack, _this2.props.onExited]),
          onEntered: createChainedFunction([_this2.handleEnteredSnack, _this2.props.onEntered])
        }));
      }));
    });
    return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(SnackbarContext.Provider, {
      value: contextValue
    }, children, domRoot ? Object(react_dom__WEBPACK_IMPORTED_MODULE_1__["createPortal"])(snackbars, domRoot) : snackbars);
  };

  _createClass(SnackbarProvider, [{
    key: "maxSnack",
    get: function get() {
      return this.props.maxSnack || 3;
    }
  }]);

  return SnackbarProvider;
}(react__WEBPACK_IMPORTED_MODULE_0__["Component"]);

// https://github.com/JamesMGreene/Function.name/blob/58b314d4a983110c3682f1228f845d39ccca1817/Function.name.js#L3
var fnNameMatchRegex = /^\s*function(?:\s|\s*\/\*.*\*\/\s*)+([^(\s/]*)\s*/;

var getFunctionName = function getFunctionName(fn) {
  var match = ("" + fn).match(fnNameMatchRegex);
  var name = match && match[1];
  return name || '';
};
/**
 * @param {function} Component
 * @param {string} fallback
 * @returns {string | undefined}
 */


var getFunctionComponentName = function getFunctionComponentName(Component, fallback) {
  if (fallback === void 0) {
    fallback = '';
  }

  return Component.displayName || Component.name || getFunctionName(Component) || fallback;
};

var getWrappedName = function getWrappedName(outerType, innerType, wrapperName) {
  var functionName = getFunctionComponentName(innerType);
  return outerType.displayName || (functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName);
};
/** 
 * From react-is
 * @link https://github.com/facebook/react/blob/master/packages/shared/ReactSymbols.js
 */


var ForwardRef = function ForwardRef() {
  var symbolFor = typeof Symbol === 'function' && Symbol["for"];
  return symbolFor ? symbolFor('react.forward_ref') : 0xead0;
};
/**
 * https://github.com/facebook/react/blob/769b1f270e1251d9dbdce0fcbd9e92e502d059b8/packages/shared/getComponentName.js
 *
 * @param {React.ReactType} Component
 * @returns {string | undefined}
 */


var getDisplayName = (function (Component) {
  if (Component == null) {
    return undefined;
  }

  if (typeof Component === 'string') {
    return Component;
  }

  if (typeof Component === 'function') {
    return getFunctionComponentName(Component, 'Component');
  }

  if (typeof Component === 'object') {
    switch (Component.$$typeof) {
      case ForwardRef():
        return getWrappedName(Component, Component.render, 'ForwardRef');

      default:
        return undefined;
    }
  }

  return undefined;
});

var withSnackbar = function withSnackbar(Component) {
  var WrappedComponent = react__WEBPACK_IMPORTED_MODULE_0___default.a.forwardRef(function (props, ref) {
    return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(SnackbarContext.Consumer, null, function (context) {
      return react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement(Component, _extends({}, props, {
        ref: ref,
        enqueueSnackbar: context.enqueueSnackbar,
        closeSnackbar: context.closeSnackbar
      }));
    });
  });

  if (false) {}

  hoist_non_react_statics__WEBPACK_IMPORTED_MODULE_11___default()(WrappedComponent, Component);
  return WrappedComponent;
};

var useSnackbar = (function () {
  return Object(react__WEBPACK_IMPORTED_MODULE_0__["useContext"])(SnackbarContext);
});


//# sourceMappingURL=notistack.esm.js.map


/***/ })

}]);