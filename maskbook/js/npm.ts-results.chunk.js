(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[125],{

/***/ 70:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Err; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return Ok; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return Result; });
/**
 * Contains the error value
 */
// @ts-ignore
var Err = /** @class */ (function () {
    function Err(val) {
        if (!(this instanceof Err)) {
            return new Err(val);
        }
        this.ok = false;
        this.err = true;
        this.val = val;
    }
    Err.prototype[Symbol.iterator] = function () {
        return {
            next: function () {
                return { done: true, value: undefined };
            }
        };
    };
    /**
     * @deprecated in favor of unwrapOr
     * @see unwrapOr
     */
    Err.prototype.else = function (val) {
        return val;
    };
    Err.prototype.unwrapOr = function (val) {
        return val;
    };
    Err.prototype.expect = function (msg) {
        throw new Error(msg + " - Error: " + toString(this.val));
    };
    Err.prototype.unwrap = function () {
        throw new Error("Tried to unwrap Error: " + toString(this.val));
    };
    Err.prototype.map = function (_mapper) {
        return this;
    };
    Err.prototype.andThen = function (op) {
        return this;
    };
    Err.prototype.mapErr = function (mapper) {
        return new Err(mapper(this.val));
    };
    /** An empty Err */
    Err.EMPTY = new Err(undefined);
    return Err;
}());

/**
 * Contains the success value
 */
// @ts-ignore
var Ok = /** @class */ (function () {
    function Ok(val) {
        if (!(this instanceof Ok)) {
            return new Ok(val);
        }
        this.ok = true;
        this.err = false;
        this.val = val;
    }
    /**
     * Helper function if you know you have an Ok<T> and T is iterable
     */
    Ok.prototype[Symbol.iterator] = function () {
        var obj = Object(this.val);
        return Symbol.iterator in obj ? obj[Symbol.iterator]() : {
            next: function () {
                return { done: true, value: undefined };
            }
        };
    };
    /**
     * @see unwrapOr
     * @deprecated in favor of unwrapOr
     */
    Ok.prototype.else = function (_val) {
        return this.val;
    };
    Ok.prototype.unwrapOr = function (_val) {
        return this.val;
    };
    Ok.prototype.expect = function (_msg) {
        return this.val;
    };
    Ok.prototype.unwrap = function () {
        return this.val;
    };
    Ok.prototype.map = function (mapper) {
        return new Ok(mapper(this.val));
    };
    Ok.prototype.andThen = function (mapper) {
        return mapper(this.val);
    };
    Ok.prototype.mapErr = function (_mapper) {
        return this;
    };
    /**
     * Returns the contained `Ok` value, but never throws.
     * Unlike `unwrap()`, this method doesn't throw and is only callable on an Ok<T>
     *
     * Therefore, it can be used instead of `unwrap()` as a maintainability safeguard
     * that will fail to compile if the error type of the Result is later changed to an error that can actually occur.
     *
     * (this is the `into_ok()` in rust)
     */
    Ok.prototype.safeUnwrap = function () {
        return this.val;
    };
    Ok.EMPTY = new Ok(undefined);
    return Ok;
}());

var Result;
(function (Result) {
    /**
     * Parse a set of `Result`s, returning an array of all `Ok` values.
     * Short circuits with the first `Err` found, if any
     */
    function all() {
        var results = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            results[_i] = arguments[_i];
        }
        var okResult = [];
        for (var _a = 0, results_1 = results; _a < results_1.length; _a++) {
            var result = results_1[_a];
            if (result.ok) {
                okResult.push(result.val);
            }
            else {
                return result;
            }
        }
        return new Ok(okResult);
    }
    Result.all = all;
    /**
     * Parse a set of `Result`s, short-circuits when an input value is `Ok`.
     * If no `Ok` is found, returns an `Err` containing the collected error values
     */
    function any() {
        var results = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            results[_i] = arguments[_i];
        }
        var errResult = [];
        // short-circuits
        for (var _a = 0, results_2 = results; _a < results_2.length; _a++) {
            var result = results_2[_a];
            if (result.ok) {
                return result;
            }
            else {
                errResult.push(result.val);
            }
        }
        // it must be a Err
        return new Err(errResult);
    }
    Result.any = any;
    /**
     * Wrap an operation that may throw an Error (`try-catch` style) into checked exception style
     * @param op The operation function
     */
    function wrap(op) {
        try {
            return new Ok(op());
        }
        catch (e) {
            return new Err(e);
        }
    }
    Result.wrap = wrap;
    /**
     * Wrap an async operation that may throw an Error (`try-catch` style) into checked exception style
     * @param op The operation function
     */
    function wrapAsync(op) {
        try {
            return op().then(function (val) { return new Ok(val); }).catch(function (e) { return new Err(e); });
        }
        catch (e) {
            return Promise.resolve(new Err(e));
        }
    }
    Result.wrapAsync = wrapAsync;
})(Result || (Result = {}));
function toString(val) {
    var value = String(val);
    if (value === '[object Object]') {
        try {
            value = JSON.stringify(val);
        }
        catch (_a) {
        }
    }
    return value;
}
var x = Result.all(Ok(3), Err(5));
//# sourceMappingURL=index.js.map

/***/ })

}]);