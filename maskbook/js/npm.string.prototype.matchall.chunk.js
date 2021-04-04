(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[119],{

/***/ 1481:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// var Construct = require('es-abstract/2019/Construct');
var Get = __webpack_require__(477);
var Set = __webpack_require__(789);
var SpeciesConstructor = __webpack_require__(1482);
var ToLength = __webpack_require__(791);
var ToString = __webpack_require__(608);
var Type = __webpack_require__(184);
var flagsGetter = __webpack_require__(785);

var RegExpStringIterator = __webpack_require__(1503);
var OrigRegExp = RegExp;

var CreateRegExpStringIterator = function CreateRegExpStringIterator(R, S, global, fullUnicode) {
	if (Type(S) !== 'String') {
		throw new TypeError('"S" value must be a String');
	}
	if (Type(global) !== 'Boolean') {
		throw new TypeError('"global" value must be a Boolean');
	}
	if (Type(fullUnicode) !== 'Boolean') {
		throw new TypeError('"fullUnicode" value must be a Boolean');
	}

	var iterator = new RegExpStringIterator(R, S, global, fullUnicode);
	return iterator;
};

var supportsConstructingWithFlags = 'flags' in RegExp.prototype;

var constructRegexWithFlags = function constructRegex(C, R) {
	var matcher;
	// workaround for older engines that lack RegExp.prototype.flags
	var flags = 'flags' in R ? Get(R, 'flags') : ToString(flagsGetter(R));
	if (supportsConstructingWithFlags && typeof flags === 'string') {
		matcher = new C(R, flags);
	} else if (C === OrigRegExp) {
		// workaround for older engines that can not construct a RegExp with flags
		matcher = new C(R.source, flags);
	} else {
		matcher = new C(R, flags);
	}
	return { flags: flags, matcher: matcher };
};

var regexMatchAll = function SymbolMatchAll(string) {
	var R = this;
	if (Type(R) !== 'Object') {
		throw new TypeError('"this" value must be an Object');
	}
	var S = ToString(string);
	var C = SpeciesConstructor(R, OrigRegExp);

	var tmp = constructRegexWithFlags(C, R);
	// var flags = ToString(Get(R, 'flags'));
	var flags = tmp.flags;
	// var matcher = Construct(C, [R, flags]);
	var matcher = tmp.matcher;

	var lastIndex = ToLength(Get(R, 'lastIndex'));
	Set(matcher, 'lastIndex', lastIndex, true);
	var global = flags.indexOf('g') > -1;
	var fullUnicode = flags.indexOf('u') > -1;
	return CreateRegExpStringIterator(matcher, S, global, fullUnicode);
};

var defineP = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;

if (defineP && gOPD) {
	var desc = gOPD(regexMatchAll, 'name');
	if (desc && desc.configurable) {
		defineP(regexMatchAll, 'name', { value: '[Symbol.matchAll]' });
	}
}

module.exports = regexMatchAll;


/***/ }),

/***/ 1503:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var define = __webpack_require__(342);
var AdvanceStringIndex = __webpack_require__(1504);
var CreateIterResultObject = __webpack_require__(1506);
var Get = __webpack_require__(477);
var GetIntrinsic = __webpack_require__(93);
var ObjectCreate = __webpack_require__(1507);
var RegExpExec = __webpack_require__(1508);
var Set = __webpack_require__(789);
var ToLength = __webpack_require__(791);
var ToString = __webpack_require__(608);
var Type = __webpack_require__(184);
var hasSymbols = __webpack_require__(310)();

var SLOT = __webpack_require__(1509);
var undefined;

var RegExpStringIterator = function RegExpStringIterator(R, S, global, fullUnicode) {
	if (Type(S) !== 'String') {
		throw new TypeError('S must be a string');
	}
	if (Type(global) !== 'Boolean') {
		throw new TypeError('global must be a boolean');
	}
	if (Type(fullUnicode) !== 'Boolean') {
		throw new TypeError('fullUnicode must be a boolean');
	}
	SLOT.set(this, '[[IteratingRegExp]]', R);
	SLOT.set(this, '[[IteratedString]]', S);
	SLOT.set(this, '[[Global]]', global);
	SLOT.set(this, '[[Unicode]]', fullUnicode);
	SLOT.set(this, '[[Done]]', false);
};

var IteratorPrototype = GetIntrinsic('%IteratorPrototype%', true);
if (IteratorPrototype) {
	RegExpStringIterator.prototype = ObjectCreate(IteratorPrototype);
}

define(RegExpStringIterator.prototype, {
	next: function next() {
		var O = this;
		if (Type(O) !== 'Object') {
			throw new TypeError('receiver must be an object');
		}
		if (
			!(O instanceof RegExpStringIterator)
			|| !SLOT.has(O, '[[IteratingRegExp]]')
			|| !SLOT.has(O, '[[IteratedString]]')
			|| !SLOT.has(O, '[[Global]]')
			|| !SLOT.has(O, '[[Unicode]]')
			|| !SLOT.has(O, '[[Done]]')
		) {
			throw new TypeError('"this" value must be a RegExpStringIterator instance');
		}
		if (SLOT.get(O, '[[Done]]')) {
			return CreateIterResultObject(undefined, true);
		}
		var R = SLOT.get(O, '[[IteratingRegExp]]');
		var S = SLOT.get(O, '[[IteratedString]]');
		var global = SLOT.get(O, '[[Global]]');
		var fullUnicode = SLOT.get(O, '[[Unicode]]');
		var match = RegExpExec(R, S);
		if (match === null) {
			SLOT.set(O, '[[Done]]', true);
			return CreateIterResultObject(undefined, true);
		}
		if (global) {
			var matchStr = ToString(Get(match, '0'));
			if (matchStr === '') {
				var thisIndex = ToLength(Get(R, 'lastIndex'));
				var nextIndex = AdvanceStringIndex(S, thisIndex, fullUnicode);
				Set(R, 'lastIndex', nextIndex, true);
			}
			return CreateIterResultObject(match, false);
		}
		SLOT.set(O, '[[Done]]', true);
		return CreateIterResultObject(match, false);
	}
});
if (hasSymbols) {
	var defineP = Object.defineProperty;
	if (Symbol.toStringTag) {
		if (defineP) {
			defineP(RegExpStringIterator.prototype, Symbol.toStringTag, {
				configurable: true,
				enumerable: false,
				value: 'RegExp String Iterator',
				writable: false
			});
		} else {
			RegExpStringIterator.prototype[Symbol.toStringTag] = 'RegExp String Iterator';
		}
	}

	if (!IteratorPrototype && Symbol.iterator) {
		var func = {};
		func[Symbol.iterator] = RegExpStringIterator.prototype[Symbol.iterator] || function SymbolIterator() {
			return this;
		};
		var predicate = {};
		predicate[Symbol.iterator] = function () {
			return RegExpStringIterator.prototype[Symbol.iterator] !== func[Symbol.iterator];
		};
		define(RegExpStringIterator.prototype, func, predicate);
	}
}

module.exports = RegExpStringIterator;


/***/ }),

/***/ 1511:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var define = __webpack_require__(342);
var hasSymbols = __webpack_require__(310)();
var getPolyfill = __webpack_require__(794);
var regexpMatchAllPolyfill = __webpack_require__(788);

var defineP = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;

module.exports = function shimMatchAll() {
	var polyfill = getPolyfill();
	define(
		String.prototype,
		{ matchAll: polyfill },
		{ matchAll: function () { return String.prototype.matchAll !== polyfill; } }
	);
	if (hasSymbols) {
		// eslint-disable-next-line no-restricted-properties
		var symbol = Symbol.matchAll || (Symbol['for'] ? Symbol['for']('Symbol.matchAll') : Symbol('Symbol.matchAll'));
		define(
			Symbol,
			{ matchAll: symbol },
			{ matchAll: function () { return Symbol.matchAll !== symbol; } }
		);

		if (defineP && gOPD) {
			var desc = gOPD(Symbol, symbol);
			if (!desc || desc.configurable) {
				defineP(Symbol, symbol, {
					configurable: false,
					enumerable: false,
					value: symbol,
					writable: false
				});
			}
		}

		var regexpMatchAll = regexpMatchAllPolyfill();
		var func = {};
		func[symbol] = regexpMatchAll;
		var predicate = {};
		predicate[symbol] = function () {
			return RegExp.prototype[symbol] !== regexpMatchAll;
		};
		define(RegExp.prototype, func, predicate);
	}
	return polyfill;
};


/***/ }),

/***/ 779:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Call = __webpack_require__(780);
var Get = __webpack_require__(477);
var GetMethod = __webpack_require__(1474);
var IsRegExp = __webpack_require__(1478);
var ToString = __webpack_require__(608);
var RequireObjectCoercible = __webpack_require__(782);
var callBound = __webpack_require__(311);
var hasSymbols = __webpack_require__(310)();
var flagsGetter = __webpack_require__(785);

var $indexOf = callBound('String.prototype.indexOf');

var regexpMatchAllPolyfill = __webpack_require__(788);

var getMatcher = function getMatcher(regexp) { // eslint-disable-line consistent-return
	var matcherPolyfill = regexpMatchAllPolyfill();
	if (hasSymbols && typeof Symbol.matchAll === 'symbol') {
		var matcher = GetMethod(regexp, Symbol.matchAll);
		if (matcher === RegExp.prototype[Symbol.matchAll] && matcher !== matcherPolyfill) {
			return matcherPolyfill;
		}
		return matcher;
	}
	// fallback for pre-Symbol.matchAll environments
	if (IsRegExp(regexp)) {
		return matcherPolyfill;
	}
};

module.exports = function matchAll(regexp) {
	var O = RequireObjectCoercible(this);

	if (typeof regexp !== 'undefined' && regexp !== null) {
		var isRegExp = IsRegExp(regexp);
		if (isRegExp) {
			// workaround for older engines that lack RegExp.prototype.flags
			var flags = 'flags' in regexp ? Get(regexp, 'flags') : flagsGetter(regexp);
			RequireObjectCoercible(flags);
			if ($indexOf(ToString(flags), 'g') < 0) {
				throw new TypeError('matchAll requires a global regular expression');
			}
		}

		var matcher = getMatcher(regexp);
		if (typeof matcher !== 'undefined') {
			return Call(matcher, regexp, [O]);
		}
	}

	var S = ToString(O);
	// var rx = RegExpCreate(regexp, 'g');
	var rx = new RegExp(regexp, 'g');
	return Call(getMatcher(rx), rx, [S]);
};


/***/ }),

/***/ 788:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var hasSymbols = __webpack_require__(310)();
var regexpMatchAll = __webpack_require__(1481);

module.exports = function getRegExpMatchAllPolyfill() {
	if (!hasSymbols || typeof Symbol.matchAll !== 'symbol' || typeof RegExp.prototype[Symbol.matchAll] !== 'function') {
		return regexpMatchAll;
	}
	return RegExp.prototype[Symbol.matchAll];
};


/***/ }),

/***/ 794:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var implementation = __webpack_require__(779);

module.exports = function getPolyfill() {
	if (String.prototype.matchAll) {
		try {
			''.matchAll(RegExp.prototype);
		} catch (e) {
			return String.prototype.matchAll;
		}
	}
	return implementation;
};


/***/ }),

/***/ 873:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var callBind = __webpack_require__(476);
var define = __webpack_require__(342);

var implementation = __webpack_require__(779);
var getPolyfill = __webpack_require__(794);
var shim = __webpack_require__(1511);

var boundMatchAll = callBind(implementation);

define(boundMatchAll, {
	getPolyfill: getPolyfill,
	implementation: implementation,
	shim: shim
});

module.exports = boundMatchAll;


/***/ })

}]);