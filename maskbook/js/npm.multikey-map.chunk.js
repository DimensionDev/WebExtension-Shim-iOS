(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[3],{

/***/ 934:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var mixed_map_1 = __webpack_require__(558);
var MultikeyMap = (function () {
    function MultikeyMap() {
        this.map = new mixed_map_1.default();
    }
    MultikeyMap.prototype.get = function (keys) {
        var mapValue = this.getMapValueObject(keys);
        return mapValue ? mapValue.value : undefined;
    };
    MultikeyMap.prototype.has = function (keys) {
        var mapValue = this.getMapValueObject(keys);
        return mapValue ? 'value' in mapValue : false;
    };
    MultikeyMap.prototype.hasAndGet = function (keys) {
        var mapValue = this.getMapValueObject(keys);
        return mapValue ?
            [mapValue.valueSet, mapValue.value] :
            [false, undefined];
    };
    MultikeyMap.prototype.set = function (keys, value) {
        var map = this.map;
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var mapValue = map.get(key);
            if (!mapValue) {
                mapValue = {
                    map: undefined,
                    valueSet: false,
                    value: undefined,
                };
                map.set(key, mapValue);
            }
            if (i < keys.length - 1) {
                if (mapValue.map) {
                    map = mapValue.map;
                }
                else {
                    map = mapValue.map = new mixed_map_1.default();
                }
                continue;
            }
            if (!mapValue.valueSet) {
                mapValue.valueSet = true;
            }
            mapValue.value = value;
        }
    };
    MultikeyMap.prototype.delete = function (keys) {
        var map = this.map;
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var mapValue = map.get(key);
            if (!mapValue) {
                return false;
            }
            if (i < keys.length - 1) {
                if (!mapValue.map) {
                    return false;
                }
                map = mapValue.map;
                continue;
            }
            if (mapValue.valueSet) {
                mapValue.valueSet = false;
                mapValue.value = undefined;
                return true;
            }
            else {
                return false;
            }
        }
        // To pass TypeScript checking.
        return false;
    };
    MultikeyMap.prototype.getMapValueObject = function (keys) {
        var map = this.map;
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var mapValue = map.get(key);
            if (!mapValue) {
                return undefined;
            }
            if (i < keys.length - 1) {
                if (!mapValue.map) {
                    return undefined;
                }
                map = mapValue.map;
                continue;
            }
            return mapValue;
        }
        // To pass TypeScript checking.
        return undefined;
    };
    return MultikeyMap;
}());
exports.MultikeyMap = MultikeyMap;
exports.default = MultikeyMap;
//# sourceMappingURL=index.js.map

/***/ })

}]);