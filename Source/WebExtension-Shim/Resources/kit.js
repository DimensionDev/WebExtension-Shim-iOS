(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.es = {}));
}(this, function (exports) { 'use strict';

    /**
     * Create a live selector that can continuously select the element you want.
     *
     * @remarks
     * Call {@link LiveSelector.evaluate | #evaluate} to evaluate the element. Falsy value will be ignored.
     *
     * @param T - Type of Element that LiveSelector contains
     *
     * @example
     * ```ts
     * const ls = new LiveSelector().querySelectorAll('a').map(x => x.href)
     * ls.evaluate() // returns all urls at the current time.
     * ```
     */
    class LiveSelector {
        /**
         * Create a new LiveSelector.
         *
         * @param initialElements - provides initial results, equals to `.replace(() => initialElements)`
         */
        constructor(initialElements = []) {
            this.initialElements = initialElements;
            /**
             * Let developer knows where does this LiveSelector created.
             */
            this.stack = new Error().stack;
            this.singleMode = false;
            /**
             * Record a method call into {@link LiveSelector.selectorChain}
             */
            this.appendSelectorChain = (type) => (param) => {
                this.selectorChain.push({ type: type, param: param });
                return this;
            };
            /**
             * Records of previous calls on LiveSelector
             */
            this.selectorChain = [];
        }
        /**
         * Enable single mode. Only 1 result will be emitted.
         */
        enableSingleMode() {
            this.singleMode = true;
            return this;
        }
        /**
         * Clone this LiveSelector and return a new LiveSelector.
         * @returns a new LiveSelector with same action
         * @example
         * ```ts
         * ls.clone()
         * ```
         */
        clone() {
            const ls = new LiveSelector(this.initialElements);
            ls.selectorChain.push(...this.selectorChain);
            ls.singleMode = this.singleMode;
            return ls;
        }
        querySelector(selector) {
            return this.appendSelectorChain('querySelector')(selector);
        }
        querySelectorAll(selector) {
            return this.appendSelectorChain('querySelectorAll')(selector);
        }
        getElementsByClassName(className) {
            return this.appendSelectorChain('getElementsByClassName')(className);
        }
        getElementsByTagName(tag) {
            return this.appendSelectorChain('getElementsByTagName')(tag);
        }
        closest(selectors) {
            return this.appendSelectorChain('closest')(selectors);
        }
        filter(f) {
            return this.appendSelectorChain('filter')(f);
        }
        /**
         * Calls a defined callback function on each element of a LiveSelector, and continues with the results.
         *
         * @param callbackfn - Map function
         * @example
         * ```ts
         * ls.map(x => x.parentElement)
         * ```
         */
        map(callbackfn) {
            return this.appendSelectorChain('map')(callbackfn);
        }
        /**
         * Combines two LiveSelector.
         * @param newEle - Additional LiveSelector to combine.
         * @param NextType - Next type generic for LiveSelector
         *
         * @example
         * ```ts
         * ls.concat(new LiveSelector().querySelector('#root'))
         * ```
         */
        concat(newEle) {
            return this.appendSelectorChain('concat')(newEle);
        }
        /**
         * Reverses the elements in an Array.
         *
         * @example
         * ```ts
         * ls.reverse()
         * ```
         */
        reverse() {
            return this.appendSelectorChain('reverse')(undefined);
        }
        /**
         * Returns a section of an array.
         * @param start - The beginning of the specified portion of the array.
         * @param end - The end of the specified portion of the array.
         *
         * @example
         * ```ts
         * ls.slice(2, 4)
         * ```
         */
        slice(start, end) {
            return this.appendSelectorChain('slice')([start, end]);
        }
        /**
         * Sorts an array.
         * @param compareFn - The name of the function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.
         *
         * @example
         * ```ts
         * ls.sort((a, b) => a.innerText.length - b.innerText.length)
         * ```
         */
        sort(compareFn) {
            return this.appendSelectorChain('sort')(compareFn);
        }
        /**
         * Flat T[][] to T[]
         *
         * @example
         * ```ts
         * ls.flat()
         * ```
         */
        flat() {
            return this.appendSelectorChain('flat')(undefined);
        }
        /**
         * Select only nth element
         *
         * @param n - Select only nth element, allow negative number.
         * @example
         * ```ts
         * ls.nth(-1)
         * ```
         */
        nth(n) {
            return this.appendSelectorChain('nth')(n);
        }
        /**
         * Replace the whole array.
         *
         * @example
         * ```ts
         * ls.replace(x => lodash.dropRight(x, 2))
         * ```
         *
         * @param f - returns new array.
         */
        replace(f) {
            return this.appendSelectorChain('replace')(f);
        }
        //#endregion
        //#region Build
        /**
         * Evaluate selector expression
         */
        evaluate() {
            let arr = this.initialElements;
            function isElementArray(x) {
                // Do a simple check
                return x[0] instanceof Element;
            }
            function nonNull(x) {
                return x !== null && x !== undefined;
            }
            let previouslyNulled = false;
            for (const op of this.selectorChain) {
                // if in single mode, drop other results.
                if (this.singleMode && arr.length > 1)
                    arr = [arr[0]];
                switch (op.type) {
                    case 'querySelector': {
                        if (!previouslyNulled) {
                            if (arr.length === 0) {
                                const e = document.querySelector(op.param);
                                if (e)
                                    arr = arr.concat(e);
                                else
                                    previouslyNulled = true;
                            }
                            else if (isElementArray(arr)) {
                                arr = arr.map(e => e.querySelector(op.param)).filter(nonNull);
                                if (arr.length === 0)
                                    previouslyNulled = true;
                            }
                            else
                                throw new TypeError('Call querySelector on non-Element item!');
                        }
                        break;
                    }
                    case 'getElementsByTagName':
                    case 'getElementsByClassName':
                    case 'querySelectorAll': {
                        if (!previouslyNulled) {
                            if (arr.length === 0) {
                                const e = document[op.type](op.param);
                                arr = arr.concat(...e);
                                if (e.length === 0)
                                    previouslyNulled = true;
                            }
                            else if (isElementArray(arr)) {
                                let newArr = [];
                                for (const e of arr) {
                                    newArr = newArr.concat(Array.from(e[op.type](op.param)));
                                }
                                arr = newArr.filter(nonNull);
                                if (arr.length === 0)
                                    previouslyNulled = true;
                            }
                            else
                                throw new TypeError(`Call ${op.type} on non-Element item!`);
                        }
                        break;
                    }
                    case 'closest':
                        if (arr.length === 0) {
                            break;
                        }
                        else if (isElementArray(arr)) {
                            const newArr = arr;
                            const selector = op.param;
                            function findParent(node, y) {
                                if (y < 0)
                                    throw new TypeError('Cannot use `.closet` with a negative number');
                                if (y === 0)
                                    return node;
                                if (!node.parentElement)
                                    return null;
                                return findParent(node.parentElement, y - 1);
                            }
                            if (typeof selector === 'number') {
                                arr = newArr.map(e => findParent(e, selector)).filter(nonNull);
                            }
                            else {
                                arr = newArr.map(x => x.closest(selector)).filter(nonNull);
                            }
                        }
                        else {
                            throw new TypeError('Cannot use `.closet on non-Element`');
                        }
                        break;
                    case 'filter':
                        arr = arr.filter(op.param).filter(nonNull);
                        break;
                    case 'map':
                        arr = arr.map(op.param).filter(nonNull);
                        break;
                    case 'concat':
                        arr = arr.concat(op.param.evaluate());
                        break;
                    case 'reverse':
                        arr = Array.from(arr).reverse();
                        break;
                    case 'slice': {
                        const [start, end] = op.param;
                        arr = arr.slice(start, end);
                        break;
                    }
                    case 'sort':
                        arr = Array.from(arr).sort(op.param);
                        break;
                    case 'nth': {
                        const x = op.param >= 0 ? op.param : arr.length - op.param;
                        arr = [arr[x]];
                        break;
                    }
                    case 'flat':
                        arr = [].concat(...arr);
                        break;
                    case 'replace':
                        arr = op.param(Array.from(arr));
                        break;
                    default:
                        throw new TypeError('Unknown operation type');
                }
            }
            if (this.singleMode)
                return arr.filter(nonNull)[0];
            return arr.filter(nonNull);
        }
        /**
         * {@inheritdoc LiveSelector.evaluate}
         * @deprecated Use `evaluate()` instead, it's shorter
         */
        evaluateOnce() {
            return this.evaluate();
        }
    }

    /**
     * DomProxy provide an interface that be stable even dom is changed.
     *
     * @remarks
     *
     * DomProxy provide 3 nodes. `before`, `current` and `after`.
     * `current` is a fake dom node powered by Proxy,
     * it will forward all your operations to the `realCurrent`.
     *
     * `before` and `after` is a true `span` that always point to before and after of `realCurrent`
     *
     * Special Handlers:
     *
     * *forward*: forward to current `realCurrent`
     *
     * *undo*: undo effect when `realCurrent` changes
     *
     * *move*: move effect to new `realCurrent`
     *
     * - style (forward, undo, move)
     * - addEventListener (forward, undo, move)
     * - appendChild (forward, undo, move)
     */
    function DomProxy(options = {}) {
        // Options
        const { createAfter, createBefore, afterShadowRootInit, beforeShadowRootInit } = Object.assign(Object.assign({}, {
            createAfter: () => document.createElement('span'),
            createBefore: () => document.createElement('span'),
            afterShadowRootInit: { mode: 'open' },
            beforeShadowRootInit: { mode: 'open' },
        }), options);
        //
        let isDestroyed = false;
        // Nodes
        let virtualBefore = null;
        let virtualBeforeShadow = null;
        const defaultCurrent = document.createElement('div');
        let current = defaultCurrent;
        let virtualAfter = null;
        let virtualAfterShadow = null;
        /** All changes applied on the `proxy` */
        let changes = [];
        /** Read Traps */
        const readonlyTraps = {
            ownKeys: () => {
                changes.push({ type: 'ownKeys', op: undefined });
                return Object.getOwnPropertyNames(current);
            },
            get: (t, key, r) => {
                changes.push({ type: 'get', op: key });
                const current_ = current;
                if (typeof current_[key] === 'function')
                    return new Proxy(current_[key], {
                        apply: (target, thisArg, args) => {
                            changes.push({ type: 'callMethods', op: { name: key, param: args, thisArg } });
                            return current_[key](...args);
                        },
                    });
                else if (key === 'style')
                    return new Proxy(current.style, {
                        set: (t, styleKey, styleValue, r) => {
                            changes.push({
                                type: 'modifyStyle',
                                op: { name: styleKey, value: styleValue, originalValue: current_.style[styleKey] },
                            });
                            current_.style[styleKey] = styleValue;
                            return true;
                        },
                    });
                return current_[key];
            },
            has: (t, key) => {
                changes.push({ type: 'has', op: key });
                return key in current;
            },
            getOwnPropertyDescriptor: (t, key) => {
                changes.push({ type: 'getOwnPropertyDescriptor', op: key });
                return Reflect.getOwnPropertyDescriptor(current, key);
            },
            isExtensible: t => {
                changes.push({ type: 'isExtensible', op: undefined });
                return Reflect.isExtensible(current);
            },
            getPrototypeOf: t => {
                changes.push({ type: 'getPrototypeOf', op: undefined });
                return Reflect.getPrototypeOf(current);
            },
        };
        /** Write Traps */
        const modifyTraps = record => ({
            deleteProperty: (t, key) => {
                record && changes.push({ type: 'delete', op: key });
                return Reflect.deleteProperty(current, key);
            },
            set: (t, key, value, r) => {
                record && changes.push({ type: 'set', op: [key, value] });
                return (current[key] = value);
            },
            defineProperty: (t, key, attributes) => {
                record && changes.push({ type: 'defineProperty', op: [key, attributes] });
                return Reflect.defineProperty(current, key, attributes);
            },
            preventExtensions: t => {
                record && changes.push({ type: 'preventExtensions', op: undefined });
                return Reflect.preventExtensions(current);
            },
            setPrototypeOf: (t, prototype) => {
                record && changes.push({ type: 'setPrototypeOf', op: prototype });
                return Reflect.setPrototypeOf(current, prototype);
            },
        });
        const modifyTrapsWrite = modifyTraps(true);
        const modifyTrapsNotWrite = modifyTraps(false);
        const proxy = Proxy.revocable({}, Object.assign(Object.assign({}, readonlyTraps), modifyTrapsWrite));
        function hasStyle(e) {
            return !!e.style;
        }
        /** Call before realCurrent change */
        function undoEffects(nextCurrent) {
            for (const change of changes) {
                if (change.type === 'callMethods') {
                    const attr = change.op.name;
                    if (attr === 'addEventListener') {
                        current.removeEventListener(...change.op.param);
                    }
                    else if (attr === 'appendChild') {
                        if (!nextCurrent) {
                            const node = change.op.thisArg[0];
                            node && current.removeChild(node);
                        }
                    }
                }
                else if (change.type === 'modifyStyle') {
                    const { name, value, originalValue } = change.op;
                    if (hasStyle(current)) {
                        current.style[name] = originalValue;
                    }
                }
            }
        }
        /** Call after realCurrent change */
        function redoEffects() {
            if (current === defaultCurrent)
                return;
            const t = {};
            for (const change of changes) {
                if (change.type === 'setPrototypeOf')
                    modifyTrapsNotWrite.setPrototypeOf(t, change.op);
                else if (change.type === 'preventExtensions')
                    modifyTrapsNotWrite.preventExtensions(t);
                else if (change.type === 'defineProperty')
                    modifyTrapsNotWrite.defineProperty(t, change.op[0], change.op[1]);
                else if (change.type === 'set')
                    modifyTrapsNotWrite.set(t, change.op[0], change.op[1], t);
                else if (change.type === 'delete')
                    modifyTrapsNotWrite.deleteProperty(t, change.op);
                else if (change.type === 'callMethods') {
                    const replayable = ['appendChild', 'addEventListener', 'before', 'after'];
                    const key = change.op.name;
                    if (replayable.indexOf(key) !== -1) {
                        if (current[key]) {
                            current[key](...change.op.param);
                        }
                        else {
                            console.warn(current, `doesn't have method "${key}", replay failed.`);
                        }
                    }
                }
                else if (change.type === 'modifyStyle') {
                    current.style[change.op.name] = change.op.value;
                }
            }
        }
        // MutationObserver
        const noop = () => { };
        let observerCallback = noop;
        let mutationObserverInit = undefined;
        let observer = null;
        function reObserve(reinit) {
            observer && observer.disconnect();
            if (observerCallback === noop || current === defaultCurrent)
                return;
            if (reinit || !observer)
                observer = new MutationObserver(observerCallback);
            observer.observe(current, mutationObserverInit);
        }
        return {
            observer: {
                set callback(v) {
                    if (v === undefined)
                        v = noop;
                    observerCallback = v;
                    reObserve(true);
                },
                get callback() {
                    return observerCallback;
                },
                get init() {
                    return mutationObserverInit;
                },
                set init(v) {
                    mutationObserverInit = v;
                    reObserve(false);
                },
                get observer() {
                    return observer;
                },
            },
            get before() {
                if (isDestroyed)
                    throw new TypeError('Try to access `before` node after VirtualNode is destroyed');
                if (!virtualBefore) {
                    virtualBefore = createBefore();
                    if (current instanceof Element)
                        current.before(virtualBefore);
                }
                return virtualBefore;
            },
            get beforeShadow() {
                if (!virtualBeforeShadow)
                    virtualBeforeShadow = this.before.attachShadow(beforeShadowRootInit);
                return virtualBeforeShadow;
            },
            get current() {
                if (isDestroyed)
                    throw new TypeError('Try to access `current` node after VirtualNode is destroyed');
                return proxy.proxy;
            },
            get after() {
                if (isDestroyed)
                    throw new TypeError('Try to access `after` node after VirtualNode is destroyed');
                if (!virtualAfter) {
                    virtualAfter = createAfter();
                    if (current instanceof Element)
                        current.after(virtualAfter);
                }
                return virtualAfter;
            },
            get afterShadow() {
                if (!virtualAfterShadow)
                    virtualAfterShadow = this.after.attachShadow(afterShadowRootInit);
                return virtualAfterShadow;
            },
            has(type) {
                if (type === 'before')
                    return virtualBefore;
                else if (type === 'after')
                    return virtualAfter;
                else if (type === 'afterShadow')
                    return virtualAfterShadow;
                else if (type === 'beforeShadow')
                    return virtualBeforeShadow;
                else
                    return null;
            },
            get realCurrent() {
                if (isDestroyed)
                    return null;
                if (current === defaultCurrent)
                    return null;
                return current;
            },
            set realCurrent(node) {
                if (isDestroyed)
                    throw new TypeError('You can not set current for a destroyed proxy');
                if (node === current)
                    return;
                if ((node === virtualAfter || node === virtualBefore) && node !== null) {
                    console.warn("In the DomProxy, you're setting .realCurrent to this DomProxy's virtualAfter or virtualBefore. Doing this may cause bugs. If you're confused with this warning, check your rules for LiveSelector.", this);
                }
                undoEffects(node);
                reObserve(false);
                if (node === null || node === undefined) {
                    current = defaultCurrent;
                    if (virtualBefore)
                        virtualBefore.remove();
                    if (virtualAfter)
                        virtualAfter.remove();
                }
                else {
                    current = node;
                    if (virtualAfter && current instanceof Element)
                        current.after(virtualAfter);
                    if (virtualBefore && current instanceof Element)
                        current.before(virtualBefore);
                    redoEffects();
                }
            },
            destroy() {
                observer && observer.disconnect();
                isDestroyed = true;
                proxy.revoke();
                virtualBeforeShadow = null;
                virtualAfterShadow = null;
                if (virtualBefore)
                    virtualBefore.remove();
                if (virtualAfter)
                    virtualAfter.remove();
                virtualBefore = null;
                virtualAfter = null;
                current = defaultCurrent;
            },
        };
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    //      
    // An event handler can take an optional event argument
    // and should not return a value
                                              
                                                                   

    // An array of all currently registered event handlers for a type
                                                
                                                                
    // A map of event types and their corresponding event handlers.
                            
                                     
                                       
      

    /** Mitt: Tiny (~200b) functional event emitter / pubsub.
     *  @name mitt
     *  @returns {Mitt}
     */
    function mitt(all                 ) {
    	all = all || Object.create(null);

    	return {
    		/**
    		 * Register an event handler for the given type.
    		 *
    		 * @param  {String} type	Type of event to listen for, or `"*"` for all events
    		 * @param  {Function} handler Function to call in response to given event
    		 * @memberOf mitt
    		 */
    		on: function on(type        , handler              ) {
    			(all[type] || (all[type] = [])).push(handler);
    		},

    		/**
    		 * Remove an event handler for the given type.
    		 *
    		 * @param  {String} type	Type of event to unregister `handler` from, or `"*"`
    		 * @param  {Function} handler Handler function to remove
    		 * @memberOf mitt
    		 */
    		off: function off(type        , handler              ) {
    			if (all[type]) {
    				all[type].splice(all[type].indexOf(handler) >>> 0, 1);
    			}
    		},

    		/**
    		 * Invoke all handlers for the given type.
    		 * If present, `"*"` handlers are invoked after type-matched handlers.
    		 *
    		 * @param {String} type  The event type to invoke
    		 * @param {Any} [evt]  Any value (object is recommended and powerful), passed to each handler
    		 * @memberOf mitt
    		 */
    		emit: function emit(type        , evt     ) {
    			(all[type] || []).slice().map(function (handler) { handler(evt); });
    			(all['*'] || []).slice().map(function (handler) { handler(type, evt); });
    		}
    	};
    }

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || Function('return this')();

    /** Built-in value references. */
    var Symbol$1 = root.Symbol;

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString = objectProto.toString;

    /** Built-in value references. */
    var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

    /**
     * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the raw `toStringTag`.
     */
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag),
          tag = value[symToStringTag];

      try {
        value[symToStringTag] = undefined;
        var unmasked = true;
      } catch (e) {}

      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString$1 = objectProto$1.toString;

    /**
     * Converts `value` to a string using `Object.prototype.toString`.
     *
     * @private
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     */
    function objectToString(value) {
      return nativeObjectToString$1.call(value);
    }

    /** `Object#toString` result references. */
    var nullTag = '[object Null]',
        undefinedTag = '[object Undefined]';

    /** Built-in value references. */
    var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

    /**
     * The base implementation of `getTag` without fallbacks for buggy environments.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
      }
      return (symToStringTag$1 && symToStringTag$1 in Object(value))
        ? getRawTag(value)
        : objectToString(value);
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    /** `Object#toString` result references. */
    var asyncTag = '[object AsyncFunction]',
        funcTag = '[object Function]',
        genTag = '[object GeneratorFunction]',
        proxyTag = '[object Proxy]';

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 9 which returns 'object' for typed arrays and other constructors.
      var tag = baseGetTag(value);
      return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }

    /** Used to detect overreaching core-js shims. */
    var coreJsData = root['__core-js_shared__'];

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    /** Used for built-in method references. */
    var funcProto = Function.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to convert.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used for built-in method references. */
    var funcProto$1 = Function.prototype,
        objectProto$2 = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString$1 = funcProto$1.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }

    /**
     * Gets the value at `key` of `object`.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function getValue(object, key) {
      return object == null ? undefined : object[key];
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : undefined;
    }

    /* Built-in method references that are verified to be native. */
    var nativeCreate = getNative(Object, 'create');

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @name delete
     * @memberOf Hash
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED = '__lodash_hash_undefined__';

    /** Used for built-in method references. */
    var objectProto$3 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @name get
     * @memberOf Hash
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? undefined : result;
      }
      return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
    }

    /** Used for built-in method references. */
    var objectProto$4 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Hash
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Hash
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the hash instance.
     */
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
      return this;
    }

    /**
     * Creates a hash object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Hash(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `Hash`.
    Hash.prototype.clear = hashClear;
    Hash.prototype['delete'] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    /** Used for built-in method references. */
    var arrayProto = Array.prototype;

    /** Built-in value references. */
    var splice = arrayProto.splice;

    /**
     * Removes `key` and its value from the list cache.
     *
     * @private
     * @name delete
     * @memberOf ListCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function listCacheDelete(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }

    /**
     * Gets the list cache value for `key`.
     *
     * @private
     * @name get
     * @memberOf ListCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function listCacheGet(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      return index < 0 ? undefined : data[index][1];
    }

    /**
     * Checks if a list cache value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf ListCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }

    /**
     * Sets the list cache `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf ListCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the list cache instance.
     */
    function listCacheSet(key, value) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }

    /**
     * Creates an list cache object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function ListCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `ListCache`.
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype['delete'] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;

    /* Built-in method references that are verified to be native. */
    var Map$1 = getNative(root, 'Map');

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        'hash': new Hash,
        'map': new (Map$1 || ListCache),
        'string': new Hash
      };
    }

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
        ? (value !== '__proto__')
        : (value === null);
    }

    /**
     * Gets the data for `map`.
     *
     * @private
     * @param {Object} map The map to query.
     * @param {string} key The reference key.
     * @returns {*} Returns the map data.
     */
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key)
        ? data[typeof key == 'string' ? 'string' : 'hash']
        : data.map;
    }

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapCacheDelete(key) {
      var result = getMapData(this, key)['delete'](key);
      this.size -= result ? 1 : 0;
      return result;
    }

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapCacheSet(key, value) {
      var data = getMapData(this, key),
          size = data.size;

      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function MapCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype['delete'] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

    /**
     * Adds `value` to the array cache.
     *
     * @private
     * @name add
     * @memberOf SetCache
     * @alias push
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache instance.
     */
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED$2);
      return this;
    }

    /**
     * Checks if `value` is in the array cache.
     *
     * @private
     * @name has
     * @memberOf SetCache
     * @param {*} value The value to search for.
     * @returns {number} Returns `true` if `value` is found, else `false`.
     */
    function setCacheHas(value) {
      return this.__data__.has(value);
    }

    /**
     *
     * Creates an array cache object to store unique values.
     *
     * @private
     * @constructor
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var index = -1,
          length = values == null ? 0 : values.length;

      this.__data__ = new MapCache;
      while (++index < length) {
        this.add(values[index]);
      }
    }

    // Add methods to `SetCache`.
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;

    /**
     * The base implementation of `_.findIndex` and `_.findLastIndex` without
     * support for iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} predicate The function invoked per iteration.
     * @param {number} fromIndex The index to search from.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length,
          index = fromIndex + (fromRight ? 1 : -1);

      while ((fromRight ? index-- : ++index < length)) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `_.isNaN` without support for number objects.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
     */
    function baseIsNaN(value) {
      return value !== value;
    }

    /**
     * A specialized version of `_.indexOf` which performs strict equality
     * comparisons of values, i.e. `===`.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function strictIndexOf(array, value, fromIndex) {
      var index = fromIndex - 1,
          length = array.length;

      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseIndexOf(array, value, fromIndex) {
      return value === value
        ? strictIndexOf(array, value, fromIndex)
        : baseFindIndex(array, baseIsNaN, fromIndex);
    }

    /**
     * A specialized version of `_.includes` for arrays without support for
     * specifying an index to search from.
     *
     * @private
     * @param {Array} [array] The array to inspect.
     * @param {*} target The value to search for.
     * @returns {boolean} Returns `true` if `target` is found, else `false`.
     */
    function arrayIncludes(array, value) {
      var length = array == null ? 0 : array.length;
      return !!length && baseIndexOf(array, value, 0) > -1;
    }

    /**
     * This function is like `arrayIncludes` except that it accepts a comparator.
     *
     * @private
     * @param {Array} [array] The array to inspect.
     * @param {*} target The value to search for.
     * @param {Function} comparator The comparator invoked per element.
     * @returns {boolean} Returns `true` if `target` is found, else `false`.
     */
    function arrayIncludesWith(array, value, comparator) {
      var index = -1,
          length = array == null ? 0 : array.length;

      while (++index < length) {
        if (comparator(value, array[index])) {
          return true;
        }
      }
      return false;
    }

    /**
     * A specialized version of `_.map` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function arrayMap(array, iteratee) {
      var index = -1,
          length = array == null ? 0 : array.length,
          result = Array(length);

      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }

    /**
     * The base implementation of `_.unary` without support for storing metadata.
     *
     * @private
     * @param {Function} func The function to cap arguments for.
     * @returns {Function} Returns the new capped function.
     */
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }

    /**
     * Checks if a `cache` value for `key` exists.
     *
     * @private
     * @param {Object} cache The cache to query.
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function cacheHas(cache, key) {
      return cache.has(key);
    }

    /** Used as the size to enable large array optimizations. */
    var LARGE_ARRAY_SIZE = 200;

    /**
     * The base implementation of methods like `_.difference` without support
     * for excluding multiple arrays or iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Array} values The values to exclude.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     */
    function baseDifference(array, values, iteratee, comparator) {
      var index = -1,
          includes = arrayIncludes,
          isCommon = true,
          length = array.length,
          result = [],
          valuesLength = values.length;

      if (!length) {
        return result;
      }
      if (iteratee) {
        values = arrayMap(values, baseUnary(iteratee));
      }
      if (comparator) {
        includes = arrayIncludesWith;
        isCommon = false;
      }
      else if (values.length >= LARGE_ARRAY_SIZE) {
        includes = cacheHas;
        isCommon = false;
        values = new SetCache(values);
      }
      outer:
      while (++index < length) {
        var value = array[index],
            computed = iteratee == null ? value : iteratee(value);

        value = (comparator || value !== 0) ? value : 0;
        if (isCommon && computed === computed) {
          var valuesIndex = valuesLength;
          while (valuesIndex--) {
            if (values[valuesIndex] === computed) {
              continue outer;
            }
          }
          result.push(value);
        }
        else if (!includes(values, computed, comparator)) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Appends the elements of `values` to `array`.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {Array} values The values to append.
     * @returns {Array} Returns `array`.
     */
    function arrayPush(array, values) {
      var index = -1,
          length = values.length,
          offset = array.length;

      while (++index < length) {
        array[offset + index] = values[index];
      }
      return array;
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return value != null && typeof value == 'object';
    }

    /** `Object#toString` result references. */
    var argsTag = '[object Arguments]';

    /**
     * The base implementation of `_.isArguments`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     */
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag;
    }

    /** Used for built-in method references. */
    var objectProto$5 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$4 = objectProto$5.hasOwnProperty;

    /** Built-in value references. */
    var propertyIsEnumerable = objectProto$5.propertyIsEnumerable;

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty$4.call(value, 'callee') &&
        !propertyIsEnumerable.call(value, 'callee');
    };

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    /** Built-in value references. */
    var spreadableSymbol = Symbol$1 ? Symbol$1.isConcatSpreadable : undefined;

    /**
     * Checks if `value` is a flattenable `arguments` object or array.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
     */
    function isFlattenable(value) {
      return isArray(value) || isArguments(value) ||
        !!(spreadableSymbol && value && value[spreadableSymbol]);
    }

    /**
     * The base implementation of `_.flatten` with support for restricting flattening.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {number} depth The maximum recursion depth.
     * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
     * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
     * @param {Array} [result=[]] The initial result value.
     * @returns {Array} Returns the new flattened array.
     */
    function baseFlatten(array, depth, predicate, isStrict, result) {
      var index = -1,
          length = array.length;

      predicate || (predicate = isFlattenable);
      result || (result = []);

      while (++index < length) {
        var value = array[index];
        if (depth > 0 && predicate(value)) {
          if (depth > 1) {
            // Recursively flatten arrays (susceptible to call stack limits).
            baseFlatten(value, depth - 1, predicate, isStrict, result);
          } else {
            arrayPush(result, value);
          }
        } else if (!isStrict) {
          result[result.length] = value;
        }
      }
      return result;
    }

    /**
     * This method returns the first argument it receives.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'a': 1 };
     *
     * console.log(_.identity(object) === object);
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * A faster alternative to `Function#apply`, this function invokes `func`
     * with the `this` binding of `thisArg` and the arguments of `args`.
     *
     * @private
     * @param {Function} func The function to invoke.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {Array} args The arguments to invoke `func` with.
     * @returns {*} Returns the result of `func`.
     */
    function apply(func, thisArg, args) {
      switch (args.length) {
        case 0: return func.call(thisArg);
        case 1: return func.call(thisArg, args[0]);
        case 2: return func.call(thisArg, args[0], args[1]);
        case 3: return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max;

    /**
     * A specialized version of `baseRest` which transforms the rest array.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @param {Function} transform The rest array transform.
     * @returns {Function} Returns the new function.
     */
    function overRest(func, start, transform) {
      start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            array = Array(length);

        while (++index < length) {
          array[index] = args[start + index];
        }
        index = -1;
        var otherArgs = Array(start + 1);
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = transform(array);
        return apply(func, this, otherArgs);
      };
    }

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Util
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new constant function.
     * @example
     *
     * var objects = _.times(2, _.constant({ 'a': 1 }));
     *
     * console.log(objects);
     * // => [{ 'a': 1 }, { 'a': 1 }]
     *
     * console.log(objects[0] === objects[1]);
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    var defineProperty = (function() {
      try {
        var func = getNative(Object, 'defineProperty');
        func({}, '', {});
        return func;
      } catch (e) {}
    }());

    /**
     * The base implementation of `setToString` without support for hot loop shorting.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var baseSetToString = !defineProperty ? identity : function(func, string) {
      return defineProperty(func, 'toString', {
        'configurable': true,
        'enumerable': false,
        'value': constant(string),
        'writable': true
      });
    };

    /** Used to detect hot functions by number of calls within a span of milliseconds. */
    var HOT_COUNT = 800,
        HOT_SPAN = 16;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeNow = Date.now;

    /**
     * Creates a function that'll short out and invoke `identity` instead
     * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
     * milliseconds.
     *
     * @private
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new shortable function.
     */
    function shortOut(func) {
      var count = 0,
          lastCalled = 0;

      return function() {
        var stamp = nativeNow(),
            remaining = HOT_SPAN - (stamp - lastCalled);

        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return arguments[0];
          }
        } else {
          count = 0;
        }
        return func.apply(undefined, arguments);
      };
    }

    /**
     * Sets the `toString` method of `func` to return `string`.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var setToString = shortOut(baseSetToString);

    /**
     * The base implementation of `_.rest` which doesn't validate or coerce arguments.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     */
    function baseRest(func, start) {
      return setToString(overRest(func, start, identity), func + '');
    }

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }

    /**
     * This method is like `_.isArrayLike` except that it also checks if `value`
     * is an object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array-like object,
     *  else `false`.
     * @example
     *
     * _.isArrayLikeObject([1, 2, 3]);
     * // => true
     *
     * _.isArrayLikeObject(document.body.children);
     * // => true
     *
     * _.isArrayLikeObject('abc');
     * // => false
     *
     * _.isArrayLikeObject(_.noop);
     * // => false
     */
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }

    /**
     * Gets the last element of `array`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the last element of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     */
    function last(array) {
      var length = array == null ? 0 : array.length;
      return length ? array[length - 1] : undefined;
    }

    /**
     * This method is like `_.difference` except that it accepts `comparator`
     * which is invoked to compare elements of `array` to `values`. The order and
     * references of result values are determined by the first array. The comparator
     * is invoked with two arguments: (arrVal, othVal).
     *
     * **Note:** Unlike `_.pullAllWith`, this method returns a new array.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...Array} [values] The values to exclude.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
     *
     * _.differenceWith(objects, [{ 'x': 1, 'y': 2 }], _.isEqual);
     * // => [{ 'x': 2, 'y': 1 }]
     */
    var differenceWith = baseRest(function(array, values) {
      var comparator = last(values);
      if (isArrayLikeObject(comparator)) {
        comparator = undefined;
      }
      return isArrayLikeObject(array)
        ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true), undefined, comparator)
        : [];
    });

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMin = Math.min;

    /**
     * The base implementation of methods like `_.intersection`, without support
     * for iteratee shorthands, that accepts an array of arrays to inspect.
     *
     * @private
     * @param {Array} arrays The arrays to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of shared values.
     */
    function baseIntersection(arrays, iteratee, comparator) {
      var includes = comparator ? arrayIncludesWith : arrayIncludes,
          length = arrays[0].length,
          othLength = arrays.length,
          othIndex = othLength,
          caches = Array(othLength),
          maxLength = Infinity,
          result = [];

      while (othIndex--) {
        var array = arrays[othIndex];
        if (othIndex && iteratee) {
          array = arrayMap(array, baseUnary(iteratee));
        }
        maxLength = nativeMin(array.length, maxLength);
        caches[othIndex] = !comparator && (iteratee || (length >= 120 && array.length >= 120))
          ? new SetCache(othIndex && array)
          : undefined;
      }
      array = arrays[0];

      var index = -1,
          seen = caches[0];

      outer:
      while (++index < length && result.length < maxLength) {
        var value = array[index],
            computed = iteratee ? iteratee(value) : value;

        value = (comparator || value !== 0) ? value : 0;
        if (!(seen
              ? cacheHas(seen, computed)
              : includes(result, computed, comparator)
            )) {
          othIndex = othLength;
          while (--othIndex) {
            var cache = caches[othIndex];
            if (!(cache
                  ? cacheHas(cache, computed)
                  : includes(arrays[othIndex], computed, comparator))
                ) {
              continue outer;
            }
          }
          if (seen) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Casts `value` to an empty array if it's not an array like object.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {Array|Object} Returns the cast array-like object.
     */
    function castArrayLikeObject(value) {
      return isArrayLikeObject(value) ? value : [];
    }

    /**
     * This method is like `_.intersection` except that it accepts `comparator`
     * which is invoked to compare elements of `arrays`. The order and references
     * of result values are determined by the first array. The comparator is
     * invoked with two arguments: (arrVal, othVal).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of intersecting values.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
     * var others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];
     *
     * _.intersectionWith(objects, others, _.isEqual);
     * // => [{ 'x': 1, 'y': 2 }]
     */
    var intersectionWith = baseRest(function(arrays) {
      var comparator = last(arrays),
          mapped = arrayMap(arrays, castArrayLikeObject);

      comparator = typeof comparator == 'function' ? comparator : undefined;
      if (comparator) {
        mapped.pop();
      }
      return (mapped.length && mapped[0] === arrays[0])
        ? baseIntersection(mapped, undefined, comparator)
        : [];
    });

    /* Built-in method references that are verified to be native. */
    var Set$1 = getNative(root, 'Set');

    /**
     * This method returns `undefined`.
     *
     * @static
     * @memberOf _
     * @since 2.3.0
     * @category Util
     * @example
     *
     * _.times(2, _.noop);
     * // => [undefined, undefined]
     */
    function noop() {
      // No operation performed.
    }

    /**
     * Converts `set` to an array of its values.
     *
     * @private
     * @param {Object} set The set to convert.
     * @returns {Array} Returns the values.
     */
    function setToArray(set) {
      var index = -1,
          result = Array(set.size);

      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }

    /** Used as references for various `Number` constants. */
    var INFINITY = 1 / 0;

    /**
     * Creates a set object of `values`.
     *
     * @private
     * @param {Array} values The values to add to the set.
     * @returns {Object} Returns the new set.
     */
    var createSet = !(Set$1 && (1 / setToArray(new Set$1([,-0]))[1]) == INFINITY) ? noop : function(values) {
      return new Set$1(values);
    };

    /** Used as the size to enable large array optimizations. */
    var LARGE_ARRAY_SIZE$1 = 200;

    /**
     * The base implementation of `_.uniqBy` without support for iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     */
    function baseUniq(array, iteratee, comparator) {
      var index = -1,
          includes = arrayIncludes,
          length = array.length,
          isCommon = true,
          result = [],
          seen = result;

      if (comparator) {
        isCommon = false;
        includes = arrayIncludesWith;
      }
      else if (length >= LARGE_ARRAY_SIZE$1) {
        var set = iteratee ? null : createSet(array);
        if (set) {
          return setToArray(set);
        }
        isCommon = false;
        includes = cacheHas;
        seen = new SetCache;
      }
      else {
        seen = iteratee ? [] : result;
      }
      outer:
      while (++index < length) {
        var value = array[index],
            computed = iteratee ? iteratee(value) : value;

        value = (comparator || value !== 0) ? value : 0;
        if (isCommon && computed === computed) {
          var seenIndex = seen.length;
          while (seenIndex--) {
            if (seen[seenIndex] === computed) {
              continue outer;
            }
          }
          if (iteratee) {
            seen.push(computed);
          }
          result.push(value);
        }
        else if (!includes(seen, computed, comparator)) {
          if (seen !== result) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * This method is like `_.uniq` except that it accepts `comparator` which
     * is invoked to compare elements of `array`. The order of result values is
     * determined by the order they occur in the array.The comparator is invoked
     * with two arguments: (arrVal, othVal).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }, { 'x': 1, 'y': 2 }];
     *
     * _.uniqWith(objects, _.isEqual);
     * // => [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }]
     */
    function uniqWith(array, comparator) {
      comparator = typeof comparator == 'function' ? comparator : undefined;
      return (array && array.length) ? baseUniq(array, undefined, comparator) : [];
    }

    /**
     * @internal
     * @param fn function to execute
     * @param timeout timeout
     */
    function requestIdleCallback(fn, timeout) {
        if ('requestIdleCallback' in window) {
            return window.requestIdleCallback(fn);
        }
        const start = Date.now();
        return setTimeout(() => {
            fn({
                didTimeout: false,
                timeRemaining: function () {
                    return Math.max(0, 50 - (Date.now() - start));
                },
            });
        }, 1);
    }

    /**
     * Checks if `value` is `null` or `undefined`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is nullish, else `false`.
     * @example
     *
     * _.isNil(null);
     * // => true
     *
     * _.isNil(void 0);
     * // => true
     *
     * _.isNil(NaN);
     * // => false
     */
    function isNil(value) {
      return value == null;
    }

    /**
     * Return a promise that resolved after `time` ms.
     * If `time` is `Infinity`, it will never resolve.
     * @param time - Time to sleep. In `ms`.
     *
     * @internal
     */
    const sleep = (time) => new Promise(resolve => (Number.isFinite(time) ? setTimeout(resolve, time) : void 0));
    /**
     * Accept a promise and then set a timeout on it. After `time` ms, it will reject.
     * @param promise - The promise that you want to set time limit on.
     * @param time - Time before timeout. In `ms`.
     * @param rejectReason - When reject, show a reason. Defaults to `"timeout"`
     *
     * @internal
     */
    const timeout = (promise, time, rejectReason) => {
        if (!Number.isFinite(time))
            return (() => __awaiter(void 0, void 0, void 0, function* () { return promise; }))();
        let timer;
        const race = Promise.race([
            promise,
            new Promise((r, reject) => {
                timer = setTimeout(() => reject(new Error(rejectReason || 'timeout')), time);
            }),
        ]);
        race.finally(() => clearTimeout(timer));
        return race;
    };

    /**
     * Use LiveSelector to watch dom change
     */
    class Watcher {
        constructor(liveSelector) {
            /** Is the watcher running */
            this.isWatching = false;
            //#endregion
            //#region Multiple mode
            /** Found key list of last watch */
            this.lastKeyList = [];
            /** Found Node list of last watch */
            this.lastNodeList = [];
            /** Saved callback map of last watch */
            this.lastCallbackMap = new Map();
            /** Saved virtual node of last watch */
            this.lastVirtualNodesMap = new Map();
            /** Find node from the given list by key */
            this.findNodeFromListByKey = (list, keys) => (key) => {
                const i = keys.findIndex(x => this.keyComparer(x, key));
                if (i === -1)
                    return null;
                return list[i];
            };
            /**
             * Is the single mode is on.
             */
            this.singleMode = false;
            /** Does it has a last iteration value in single mode? */
            this.singleModeHasLastValue = false;
            //#endregion
            //#region Watcher callback
            /** Should be called every watch */
            this.watcherChecker = (deadline) => {
                if (!this.isWatching)
                    return;
                const thisNodes = this.liveSelector.evaluate();
                if (this.singleMode)
                    return this.singleModeWatcherCallback(thisNodes);
                else
                    return this.normalModeWatcherCallback(thisNodes);
            };
            //#endregion
            //#region LiveSelector settings
            /**
             * The dom proxy option used in DomProxy()
             */
            this.domProxyOption = {};
            //#endregion
            //#region events
            /** Event emitter */
            this.eventEmitter = new mitt();
            this.isEventsListening = {
                onAdd: false,
                onChange: false,
                onIteration: false,
                onRemove: false,
            };
            //#endregion
            //#region firstVirtualNode
            /** The first virtual node */
            this._firstVirtualNode = DomProxy(this.domProxyOption);
            //#endregion
            //#region Watcher settings
            /**
             * Map `Node -> Key`, in case of you don't want the default behavior
             */
            this.mapNodeToKey = defaultMapNodeToKey;
            /**
             * Compare between `key` and `key`, in case of you don't want the default behavior
             */
            this.keyComparer = defaultEqualityComparer;
            /**
             * Compare between `value` and `value`, in case of you don't want the default behavior
             */
            this.valueComparer = defaultEqualityComparer;
            //#endregion
            //#region Schedule a watcher callback run
            this.isWatcherCheckerRunning = false;
            this.needCheckerRunAgainAfterCurrentSchedule = false;
            /**
             * Schedule a watcher check
             */
            this.scheduleWatcherCheck = () => {
                if (this.isWatcherCheckerRunning) {
                    this.needCheckerRunAgainAfterCurrentSchedule = true;
                    return;
                }
                this.isWatcherCheckerRunning = true;
                this.watcherChecker();
                // Now watcherChecker is sync so this path will run at most once.
                while (this.needCheckerRunAgainAfterCurrentSchedule) {
                    this.watcherChecker();
                    this.needCheckerRunAgainAfterCurrentSchedule = false;
                }
                this.isWatcherCheckerRunning = false;
            };
            /** window.requestIdleCallback, or polyfill. */
            this.requestIdleCallback = requestIdleCallback;
            /** For debug usage. Just keep it. */
            this.stack = new Error().stack || '';
            //#endregion
            //#region Warnings
            /**
             * Warning to remember if developer forget to call the startWatch.
             */
            this._warning_forget_watch_ = warning({
                fn: stack => console.warn('Did you forget to call `.startWatch()`?\n', stack),
            });
            this._warning_repeated_keys = warning({ once: true });
            this._warning_single_mode = warning({
                once: 15,
                fn(stack) {
                    console.warn(`Your watcher seems like only watching 1 node.
If you can make sure there is only 1 node to watch, call \`.enableSingleMode()\` on the watcher.
Or to ignore this message, call \`.enableBatchMode()\` on the watcher.\n`, stack);
                },
            });
            this._warning_mutation_ = warning({
                fn(stack) {
                    console.warn('When watcher is watching LiveSelector<not Node>, onNodeMutation will not be ignored\n', stack);
                },
            });
            this.liveSelector = liveSelector.clone();
        }
        //#region How to start and stop the watcher
        /** Let the watcher start to watching */
        startWatch(...args) {
            this.isWatching = true;
            this._warning_forget_watch_.ignored = true;
            this.watcherChecker();
            return this;
        }
        /** Stop the watcher */
        stopWatch(...args) {
            this.isWatching = false;
        }
        /**
         * Just like React hooks. Provide callbacks for each node changes.
         *
         * @param forEachFunction - You can return a set of functions that will be called on changes.
         *
         * @remarks
         *
         * Return value of `fn`
         *
         * - `void`: No-op
         *
         * - `((oldNode: T) => void)`: it will be called when the node is removed.
         *
         * - `{ onRemove?: (old: T) => void; onTargetChanged?: (newNode: T, oldNode: T) => void; onNodeMutation?: (node: T) => void }`,
         *
         * - - `onRemove` will be called when node is removed.
         *
         * - - `onTargetChanged` will be called when the node is still existing but target has changed.
         *
         * - - `onNodeMutation` will be called when the node is the same, but it inner content or attributes are modified.
         *
         * @example
         * ```
         * // ? if your LiveSelector return Element
         * watcher.useForeach((node, key, meta) => {
         *     console.log(node.innerHTML) // when a new key is found
         *     return {
         *         onRemove() { console.log('The node is gone!') },
         *         onTargetChanged() {
         *             console.log('Key is the same, but the node has changed!')
         *             console.log(node.innerHTML) // `node` is still the latest node!
         *             // appendChild, addEventListener will not lost too!
         *         },
         *         onNodeMutation() {
         *             console.log('Key and node are both the same, but node has been mutated.')
         *         }
         *     }
         * })
         *
         * // ? if your LiveSelector does not return Element but something else
         * watcher.useForeach((value, key) => {
         *     console.log(value) // your value here.
         *     return {
         *         onRemove() { console.log('The value is gone!') },
         *         onTargetChanged(value) {
         *             console.log('Key is the same, but the value has changed!')
         *             console.log(value) // New value
         *         }
         *     }
         * })
         *
         * ```
         */
        useForeach(forEach) {
            if (this.useForeachFn) {
                console.warn("You can't chain useForeach currently. The old one will be replaced.");
            }
            this.useForeachFn = forEach;
            return this;
        }
        //#endregion
        //#region .then()
        /**
         * Start the watcher, once it emitted data, stop watching.
         * @param map - Map function transform T to Result
         * @param options - Options for watcher
         * @param starter - How to start the watcher
         *
         * @remarks This is an implementation of `PromiseLike`
         *
         * @example
         * ```ts
         * const value = await watcher
         * const value2 = await watcher(undefined, undefined, { minimalResultsRequired: 5 })
         * // If your watcher need parameters for startWatch
         * const value3 = await watcher(undefined, undefined, {}, s => s.startWatch(...))
         * ```
         */
        // The PromiseLike<T> interface
        then(onfulfilled, onrejected, options = {}, starter = watcher => watcher.startWatch()) {
            this._warning_forget_watch_.ignored = true;
            const { minimalResultsRequired, timeout: timeoutTime } = Object.assign(Object.assign({}, {
                minimalResultsRequired: 1,
                timeout: Infinity,
            }), options);
            let done = () => { };
            const then = () => __awaiter(this, void 0, void 0, function* () {
                if (minimalResultsRequired < 1)
                    throw new TypeError('Invalid minimalResultsRequired, must equal to or bigger than 1');
                if (this.singleMode && minimalResultsRequired > 1) {
                    console.warn('In single mode, the watcher will ignore the option minimalResultsRequired');
                }
                const result = this.liveSelector.evaluate();
                if (Array.isArray(result) && result.length >= minimalResultsRequired) {
                    // If we get the value now, return it
                    return result;
                }
                else if (this.singleMode) {
                    // If in single mode, return the value now
                    return result;
                }
                // Or return a promise to wait the value
                return new Promise((resolve, reject) => {
                    done = (state, val) => {
                        this.stopWatch();
                        this.removeListener('onIteration', f);
                        if (state)
                            resolve(val);
                        else
                            reject(val);
                    };
                    starter.bind(this)(this);
                    const f = (v) => {
                        const nodes = v.values.current;
                        if (this.singleMode && nodes.length >= 1) {
                            return done(true, nodes[0]);
                        }
                        if (nodes.length < minimalResultsRequired)
                            return;
                        return done(true, nodes);
                    };
                    this.addListener('onIteration', f);
                });
            });
            const withTimeout = timeout(then(), timeoutTime);
            withTimeout.finally(() => done(false, new Error('timeout')));
            return withTimeout.then(onfulfilled, onrejected);
        }
        /** Watcher callback with single mode is off */
        normalModeWatcherCallback(currentIteration) {
            /** Key list in this iteration */
            const thisKeyList = this.mapNodeToKey === defaultMapNodeToKey ? currentIteration : currentIteration.map(this.mapNodeToKey);
            //#region Warn about repeated keys
            {
                const uniq = uniqWith(thisKeyList, this.keyComparer);
                if (uniq.length < thisKeyList.length) {
                    this._warning_repeated_keys.warn(() => console.warn('There are repeated keys in your watcher. uniqKeys:', uniq, 'allKeys:', thisKeyList, ', to omit this warning, call `.omitWarningForRepeatedKeys()`'));
                }
            }
            //#endregion
            // New maps for the next generation
            /** Next generation Callback map */
            const nextCallbackMap = new Map();
            /** Next generation VirtualNode map */
            const nextVirtualNodesMap = new Map();
            //#region Key is gone
            // Do: Delete node
            const findFromLast = this.findNodeFromListByKey(this.lastNodeList, this.lastKeyList);
            const goneKeys = differenceWith(this.lastKeyList, thisKeyList, this.keyComparer);
            {
                for (const oldKey of goneKeys) {
                    const virtualNode = this.lastVirtualNodesMap.get(oldKey);
                    const callbacks = this.lastCallbackMap.get(oldKey);
                    const node = findFromLast(oldKey);
                    this.requestIdleCallback(() => {
                        applyUseForeachCallback(callbacks)('remove')(node);
                        if (virtualNode)
                            virtualNode.destroy();
                    }, 
                    // Delete node don't need a short timeout.
                    { timeout: 2000 });
                }
            }
            //#endregion
            //#region Key is new
            // Do: Add node
            const findFromNew = this.findNodeFromListByKey(currentIteration, thisKeyList);
            const newKeys = differenceWith(thisKeyList, this.lastKeyList, this.keyComparer);
            {
                for (const newKey of newKeys) {
                    if (!this.useForeachFn)
                        break;
                    const value = findFromNew(newKey);
                    if (value instanceof Node) {
                        const virtualNode = DomProxy(this.domProxyOption);
                        virtualNode.realCurrent = value;
                        // This step must be sync.
                        const callbacks = this.useForeachFn(virtualNode.current, newKey, virtualNode);
                        if (callbacks && typeof callbacks !== 'function' && 'onNodeMutation' in callbacks) {
                            virtualNode.observer.init = {
                                subtree: true,
                                childList: true,
                                characterData: true,
                                attributes: true,
                            };
                            virtualNode.observer.callback = m => callbacks.onNodeMutation(value, m);
                        }
                        nextCallbackMap.set(newKey, callbacks);
                        nextVirtualNodesMap.set(newKey, virtualNode);
                    }
                    else {
                        const callbacks = this.useForeachFn(value, newKey, undefined);
                        applyUseForeachCallback(callbacks)('warn mutation')(this._warning_mutation_);
                        nextCallbackMap.set(newKey, callbacks);
                    }
                }
            }
            //#endregion
            //#region Key is the same, but node is changed
            // Do: Change reference
            const oldSameKeys = intersectionWith(this.lastKeyList, thisKeyList, this.keyComparer);
            const newSameKeys = intersectionWith(thisKeyList, this.lastKeyList, this.keyComparer);
            const changedNodes = oldSameKeys
                .map(x => [findFromLast(x), findFromNew(x), x, newSameKeys.find(newK => this.keyComparer(newK, x))])
                .filter(([a, b]) => this.valueComparer(a, b) === false);
            for (const [oldNode, newNode, oldKey, newKey] of changedNodes) {
                const fn = this.lastCallbackMap.get(oldKey);
                if (newNode instanceof Node) {
                    const virtualNode = this.lastVirtualNodesMap.get(oldKey);
                    virtualNode.realCurrent = newNode;
                }
                // This should be ordered. So keep it sync now.
                applyUseForeachCallback(fn)('target change')(newNode, oldNode);
            }
            //#endregion
            // Key is the same, node is the same
            // Do: nothing
            // #region Final: Copy the same keys
            for (const newKey of newSameKeys) {
                const oldKey = oldSameKeys.find(oldKey => this.keyComparer(newKey, oldKey));
                nextCallbackMap.set(newKey, this.lastCallbackMap.get(oldKey));
                nextVirtualNodesMap.set(newKey, this.lastVirtualNodesMap.get(oldKey));
            }
            this.lastCallbackMap = nextCallbackMap;
            this.lastVirtualNodesMap = nextVirtualNodesMap;
            this.lastKeyList = thisKeyList;
            this.lastNodeList = currentIteration;
            if (this.isEventsListening.onIteration && changedNodes.length + goneKeys.length + newKeys.length) {
                // Make a copy to prevent modifications
                this.emit('onIteration', {
                    keys: {
                        current: thisKeyList,
                        new: newKeys,
                        removed: goneKeys,
                    },
                    values: {
                        current: currentIteration,
                        new: newKeys.map(findFromNew),
                        removed: goneKeys.map(findFromLast),
                    },
                });
            }
            if (this.isEventsListening.onChange)
                for (const [oldNode, newNode, oldKey, newKey] of changedNodes) {
                    this.emit('onChange', { oldValue: oldNode, newValue: newNode, oldKey, newKey });
                }
            if (this.isEventsListening.onRemove)
                for (const key of goneKeys) {
                    this.emit('onRemove', { key, value: findFromLast(key) });
                }
            if (this.isEventsListening.onAdd)
                for (const key of newKeys) {
                    this.emit('onAdd', { key, value: findFromNew(key) });
                }
            // For firstVirtualNode
            const first = currentIteration[0];
            if (first instanceof Node) {
                this._firstVirtualNode.realCurrent = first;
            }
            else if (first === undefined || first === null) {
                this._firstVirtualNode.realCurrent = null;
            }
            //#endregion
            //#region Prompt developer to open single mode
            if (currentIteration.length > 1)
                this._warning_single_mode.ignored = true;
            if (currentIteration.length === 1)
                this._warning_single_mode.warn();
            //#endregion
        }
        /**
         * @privateRemarks
         * Every subclass should call this.
         */
        _enableSingleMode() {
            this._warning_single_mode.ignored = true;
            this.singleMode = true;
            this.liveSelector.enableSingleMode();
            return this;
        }
        /** Watcher callback for single mode */
        singleModeWatcherCallback(firstValue) {
            if (firstValue === undefined) {
                this.firstVirtualNode.realCurrent = null;
            }
            if (firstValue instanceof Node) {
                this.firstVirtualNode.realCurrent = firstValue;
            }
            // ? Case: value is gone
            if (this.singleModeHasLastValue && isNil(firstValue)) {
                applyUseForeachCallback(this.singleModeCallback)('remove')(this.singleModeLastValue);
                if (this.singleModeLastValue instanceof Node) {
                    this._firstVirtualNode.realCurrent = null;
                }
                this.emit('onRemove', { key: undefined, value: this.singleModeLastValue });
                this.singleModeLastValue = undefined;
                this.singleModeHasLastValue = false;
            }
            // ? Case: value is new
            else if (!this.singleModeHasLastValue && firstValue) {
                if (isWatcherWithNode(this, firstValue)) {
                    if (this.useForeachFn) {
                        this.singleModeCallback = this.useForeachFn(this.firstVirtualNode.current, undefined, this.firstVirtualNode);
                    }
                }
                else {
                    if (this.useForeachFn) {
                        this.singleModeCallback = this.useForeachFn(firstValue, undefined, undefined);
                        applyUseForeachCallback(this.singleModeCallback)('warn mutation')(this._warning_mutation_);
                    }
                }
                this.emit('onAdd', { key: undefined, value: firstValue });
                this.singleModeLastValue = firstValue;
                this.singleModeHasLastValue = true;
            }
            // ? Case: value has changed
            else if (this.singleModeHasLastValue && !this.valueComparer(this.singleModeLastValue, firstValue)) {
                applyUseForeachCallback(this.singleModeCallback)('target change')(firstValue, this.singleModeLastValue);
                this.emit('onChange', {
                    newKey: undefined,
                    oldKey: undefined,
                    newValue: firstValue,
                    oldValue: this.singleModeLastValue,
                });
                this.singleModeLastValue = firstValue;
                this.singleModeHasLastValue = true;
            }
            return;
        }
        /**
         * Set option for DomProxy
         * @param option - DomProxy options
         */
        setDomProxyOption(option) {
            this.domProxyOption = option;
            const oldProxy = this._firstVirtualNode;
            if (oldProxy.has('after') ||
                oldProxy.has('before') ||
                oldProxy.has('afterShadow') ||
                oldProxy.has('beforeShadow') ||
                oldProxy.realCurrent) {
                console.warn("Don't set DomProxy before using it.");
            }
            this._firstVirtualNode = DomProxy(option);
            return this;
        }
        addListener(event, fn) {
            if (event === 'onIteration')
                this.noNeedInSingleMode('addListener("onIteration", ...)');
            this.eventEmitter.on(event, fn);
            this.isEventsListening[event] = true;
            return this;
        }
        removeListener(event, fn) {
            this.eventEmitter.off(event, fn);
            return this;
        }
        emit(event, data) {
            return this.eventEmitter.emit(event, data);
        }
        /**
         * This virtualNode always point to the first node in the LiveSelector
         */
        get firstVirtualNode() {
            return this._firstVirtualNode;
        }
        /**
         * To help identify same nodes in different iteration,
         * you need to implement a map function that map `node` to `key`
         *
         * If the key is changed, the same node will call through `forEachRemove` then `forEach`
         *
         * @param keyAssigner - map `node` to `key`, defaults to `node => node`
         *
         * @example
         * ```ts
         * watcher.assignKeys(node => node.innerText)
         * ```
         */
        assignKeys(keyAssigner) {
            this.noNeedInSingleMode(this.assignKeys.name);
            this.mapNodeToKey = keyAssigner;
            return this;
        }
        /**
         * To help identify same nodes in different iteration,
         * you need to implement a map function to compare `node` and `key`
         *
         * You probably don't need this.
         *
         * @param keyComparer - compare between two keys, defaults to `===`
         * @param valueComparer - compare between two value, defaults to `===`
         *
         * @example
         * ```ts
         * watcher.setComparer(
         *     (a, b) => JSON.stringify(a) === JSON.stringify(b),
         *     (a, b) => a.equals(b)
         * )
         * ```
         */
        setComparer(keyComparer, valueComparer) {
            if (keyComparer)
                this.noNeedInSingleMode(this.setComparer.name);
            if (keyComparer)
                this.keyComparer = keyComparer;
            if (valueComparer)
                this.valueComparer = valueComparer;
            return this;
        }
        //#endregion
        //#region Utils
        /**
         * Get virtual node by key.
         * Virtual node will be unavailable if it is deleted
         * @param key - Key used to find DomProxy
         */
        getVirtualNodeByKey(key) {
            this.noNeedInSingleMode(this.getVirtualNodeByKey.name);
            return (this.lastVirtualNodesMap.get([...this.lastVirtualNodesMap.keys()].find(_ => this.keyComparer(_, key))) ||
                null);
        }
        /**
         * If you're expecting Watcher may not be called, call this function, this will omit the warning.
         */
        omitWarningForForgetWatch() {
            this._warning_forget_watch_.ignored = true;
            return this;
        }
        /**
         * If you're expecting repeating keys, call this function, this will omit the warning.
         */
        omitWarningForRepeatedKeys() {
            this.noNeedInSingleMode(this.omitWarningForRepeatedKeys.name);
            this._warning_repeated_keys.ignored = true;
            return this;
        }
        /**
         * Dismiss the warning that let you enable single mode but the warning is false positive.
         */
        enableBatchMode() {
            this._warning_single_mode.ignored = true;
            return this;
        }
        noNeedInSingleMode(method) {
            if (this.singleMode)
                console.warn(`Method ${method} has no effect in SingleMode watcher`);
        }
    }
    //#region Default implementations
    function defaultEqualityComparer(a, b) {
        return a === b;
    }
    function defaultMapNodeToKey(node) {
        return node;
    }
    function applyUseForeachCallback(callback) {
        const cb = callback;
        let remove, change, mutation;
        if (cb === undefined) ;
        else if (typeof cb === 'function')
            remove = cb;
        else if (cb) {
            const { onNodeMutation, onRemove, onTargetChanged } = cb;
            [remove, change, mutation] = [onRemove, onTargetChanged, onNodeMutation];
        }
        return ((type) => (...args) => {
            if (type === 'remove')
                remove && remove(...args);
            else if (type === 'target change')
                change && change(...args);
            else if (type === 'mutation')
                mutation && mutation(...args);
            else if (type === 'warn mutation')
                mutation && args[0]();
        });
    }
    function isWatcherWithNode(watcher, node) {
        return node instanceof Node;
    }
    function warning(_ = {}) {
        const { dev, once, fn } = Object.assign(Object.assign({}, { dev: false, once: true, fn: () => { } }), _);
        if (dev)
            return { warn(f = fn) { }, ignored: true, stack: '' };
        const [_0, _1, _2, ...lines] = (new Error().stack || '').split('\n');
        const stack = lines.join('\n');
        let warned = 0;
        const obj = {
            ignored: false,
            stack,
            warn(f = fn) {
                if (obj.ignored)
                    return;
                if (warned && once)
                    return;
                if (typeof once === 'number' && warned <= once)
                    return;
                warned++;
                f(stack);
            },
        };
        return obj;
    }
    //#endregion

    /**
     * A watcher based on MutationObserver
     *
     * @example
     * ```ts
     * new MutationObserverWatcher(ls)
     *     .useForeach(node => {
     *         console.log(node)
     *     })
     *     .startWatch()
     * ```
     */
    class MutationObserverWatcher extends Watcher {
        constructor(
        /** LiveSelector that this object holds */
        liveSelector, 
        /**
         * If you know the element is always inside of a node, set this option.
         * This may improve performance.
         */
        consistentWatchRoot = document.body) {
            super(liveSelector);
            this.liveSelector = liveSelector;
            this.consistentWatchRoot = consistentWatchRoot;
            /** Observe whole document change */
            this.observer = new MutationObserver((mutations, observer) => {
                this.requestIdleCallback(this.scheduleWatcherCheck);
            });
            /**
             * {@inheritdoc Watcher.enableSingleMode}
             */
            this.enableSingleMode = this._enableSingleMode;
            setTimeout(this._warning_forget_watch_.warn, 5000);
        }
        /**
         * {@inheritdoc Watcher.startWatch}
         */
        startWatch(options) {
            super.startWatch();
            this.isWatching = true;
            const option = Object.assign({ attributes: true, characterData: true, childList: true, subtree: true }, options);
            const watch = (root) => {
                this.observer.observe(root || document.body, option);
                this.scheduleWatcherCheck();
            };
            if (document.readyState !== 'complete' && this.consistentWatchRoot === null) {
                document.addEventListener('load', () => watch());
            }
            else
                watch(this.consistentWatchRoot);
            return this;
        }
        /**
         * {@inheritdoc Watcher.stopWatch}
         */
        stopWatch() {
            super.stopWatch();
            this.observer.disconnect();
        }
    }

    /**
     * A watcher based on time interval.
     *
     * @example
     * ```ts
     * new IntervalWatcher(ls)
     * .useForeach(node => {
     *     console.log(node)
     * })
     * .startWatch(1000)
     * ```
     */
    class IntervalWatcher extends Watcher {
        constructor() {
            super(...arguments);
            /**
             * {@inheritdoc Watcher.enableSingleMode}
             */
            this.enableSingleMode = this._enableSingleMode;
        }
        /** Start to watch the LiveSelector at a interval(ms). */
        startWatch(interval) {
            super.startWatch();
            this.timer = setInterval(this.scheduleWatcherCheck, interval);
            return this;
        }
        /**
         * {@inheritdoc Watcher.stopWatch}
         */
        stopWatch() {
            super.stopWatch();
            if (this.timer)
                clearInterval(this.timer);
        }
    }

    /**
     * A Watcher based on event handlers.
     *
     * @example
     * ```ts
     * const e = new EventWatcher(ls).useForeach(node => console.log(node))
     * document.addEventListener('event', e.eventListener)
     * ```
     */
    class EventWatcher extends Watcher {
        constructor(liveSelector) {
            super(liveSelector);
            /**
             * Use this function as event listener to invoke watcher.
             */
            this.eventListener = () => {
                this.requestIdleCallback(this.scheduleWatcherCheck, { timeout: 500 });
            };
            /**
             * {@inheritdoc Watcher.enableSingleMode}
             */
            this.enableSingleMode = this._enableSingleMode;
            this.startWatch();
        }
    }

    /**
     * Get current running context.
     *
     * @remarks
     * - background: background script
     * - content: content script
     * - webpage: a normal webpage
     * - unknown: unknown context
     */
    function GetContext() {
        if (typeof location === 'undefined')
            return 'unknown';
        if (typeof browser !== 'undefined') {
            if (location.protocol.match('-extension')) {
                if (browser.extension && browser.extension.getBackgroundPage
                    ? browser.extension.getBackgroundPage().location.href === location.href
                    : ['generated', 'background', 'page', '.html'].every(x => location.pathname.match(x)))
                    return 'background';
                return 'options';
            }
            if (browser.runtime && browser.runtime.getManifest)
                return 'content';
        }
        // What about rollup?
        if (location.hostname === 'localhost')
            return 'debugging';
        return 'webpage';
    }
    function OnlyRunInContext(context, name) {
        const ctx = GetContext();
        if (Array.isArray(context) ? context.indexOf(ctx) === -1 : context !== ctx) {
            if (typeof name === 'string')
                throw new TypeError(`${name} run in the wrong context. (Wanted ${context}, actually ${ctx})`);
            else
                return false;
        }
        return true;
    }

    /**
     * Serialization implementation that do nothing
     */
    const NoSerialization = {
        serialization(from) {
            return __awaiter(this, void 0, void 0, function* () {
                return from;
            });
        },
        deserialization(serialized) {
            return __awaiter(this, void 0, void 0, function* () {
                return serialized;
            });
        },
    };
    /**
     * Serialization implementation by JSON.parse/stringify
     *
     * @param replacerAndReceiver - Replacer of JSON.parse/stringify
     */
    const JSONSerialization = ([replacer, receiver] = [undefined, undefined], space) => ({
        serialization(from) {
            return __awaiter(this, void 0, void 0, function* () {
                return JSON.stringify(from, replacer, space);
            });
        },
        deserialization(serialized) {
            return __awaiter(this, void 0, void 0, function* () {
                return JSON.parse(serialized, receiver);
            });
        },
    });
    const AsyncCallDefaultOptions = ((a) => a)({
        serializer: NoSerialization,
        key: 'default-jsonrpc',
        strict: false,
        log: true,
        parameterStructures: 'by-position',
        preferLocalImplementation: false,
    });
    /**
     * Async call between different context.
     *
     * @remarks
     * Async call is a high level abstraction of MessageCenter.
     *
     * # Shared code
     *
     * - How to stringify/parse parameters/returns should be shared, defaults to NoSerialization.
     *
     * - `key` should be shared.
     *
     * # One side
     *
     * - Should provide some functions then export its type (for example, `BackgroundCalls`)
     *
     * - `const call = AsyncCall<ForegroundCalls>(backgroundCalls)`
     *
     * - Then you can `call` any method on `ForegroundCalls`
     *
     * # Other side
     *
     * - Should provide some functions then export its type (for example, `ForegroundCalls`)
     *
     * - `const call = AsyncCall<BackgroundCalls>(foregroundCalls)`
     *
     * - Then you can `call` any method on `BackgroundCalls`
     *
     * Note: Two sides can implement the same function
     *
     * @example
     * For example, here is a mono repo.
     *
     * Code for UI part:
     * ```ts
     * const UI = {
     *      async dialog(text: string) {
     *          alert(text)
     *      },
     * }
     * export type UI = typeof UI
     * const callsClient = AsyncCall<Server>(UI)
     * callsClient.sendMail('hello world', 'what')
     * ```
     *
     * Code for server part
     * ```ts
     * const Server = {
     *      async sendMail(text: string, to: string) {
     *          return true
     *      }
     * }
     * export type Server = typeof Server
     * const calls = AsyncCall<UI>(Server)
     * calls.dialog('hello')
     * ```
     *
     * @param implementation - Implementation of this side.
     * @param options - Define your own serializer, MessageCenter or other options.
     *
     */
    function AsyncCall(implementation = {}, options = {}) {
        const { serializer, key, strict, log, parameterStructures, preferLocalImplementation } = Object.assign(Object.assign({}, AsyncCallDefaultOptions), options);
        const message = options.messageChannel || new MessageCenter();
        const { methodNotFound: banMethodNotFound = false, noUndefined: noUndefinedKeeping = false, unknownMessage: banUnknownMessage = false, } = calcStrictOptions(strict);
        const { beCalled: logBeCalled = true, localError: logLocalError = true, remoteError: logRemoteError = true, type: logType = 'pretty', sendLocalStack = false, } = calcLogOptions(log);
        const requestContext = new Map();
        function onRequest(data) {
            return __awaiter(this, void 0, void 0, function* () {
                let frameworkStack = '';
                try {
                    // ? We're not implementing any JSON RPC extension. So let it to be undefined.
                    const key = (data.method.startsWith('rpc.')
                        ? getRPCSymbolFromString(data.method)
                        : data.method);
                    const executor = implementation[key];
                    if (!executor || typeof executor !== 'function') {
                        if (!banMethodNotFound) {
                            if (logLocalError)
                                console.debug('Receive remote call, but not implemented.', key, data);
                            return;
                        }
                        else
                            return ErrorResponse.MethodNotFound(data.id);
                    }
                    const params = data.params;
                    if (Array.isArray(params) || (typeof params === 'object' && params !== null)) {
                        const args = Array.isArray(params) ? params : [params];
                        frameworkStack = removeStackHeader(new Error().stack);
                        const promise = new Promise((resolve, reject) => {
                            try {
                                resolve(executor(...args));
                            }
                            catch (e) {
                                reject(e);
                            }
                        });
                        if (logBeCalled) {
                            if (logType === 'basic')
                                console.log(`${options.key}.${data.method}(${[...args].toString()}) @${data.id}`);
                            else {
                                const logArgs = [
                                    `${options.key}.%c${data.method}%c(${args.map(() => '%o').join(', ')}%c)\n%o %c@${data.id}`,
                                    'color: #d2c057',
                                    '',
                                    ...args,
                                    '',
                                    promise,
                                    'color: gray; font-style: italic;',
                                ];
                                if (data.remoteStack) {
                                    console.groupCollapsed(...logArgs);
                                    console.log(data.remoteStack);
                                    console.groupEnd();
                                }
                                else
                                    console.log(...logArgs);
                            }
                        }
                        const result = yield promise;
                        if (result === $AsyncCallIgnoreResponse)
                            return;
                        return new SuccessResponse(data.id, yield promise, !!noUndefinedKeeping);
                    }
                    else {
                        return ErrorResponse.InvalidRequest(data.id);
                    }
                }
                catch (e) {
                    e.stack = frameworkStack
                        .split('\n')
                        .reduce((stack, fstack) => stack.replace(fstack + '\n', ''), e.stack || '');
                    if (logLocalError)
                        console.error(e);
                    let name = 'Error';
                    name = e.constructor.name;
                    if (typeof DOMException === 'function' && e instanceof DOMException)
                        name = 'DOMException:' + e.name;
                    return new ErrorResponse(data.id, -1, e.message, e.stack, name);
                }
            });
        }
        function onResponse(data) {
            return __awaiter(this, void 0, void 0, function* () {
                let errorMessage = '', remoteErrorStack = '', errorCode = 0, errorType = 'Error';
                if (hasKey(data, 'error')) {
                    errorMessage = data.error.message;
                    errorCode = data.error.code;
                    remoteErrorStack = (data.error.data && data.error.data.stack) || '<remote stack not available>';
                    errorType = (data.error.data && data.error.data.type) || 'Error';
                    if (logRemoteError)
                        logType === 'basic'
                            ? console.error(`${errorType}: ${errorMessage}(${errorCode}) @${data.id}\n${remoteErrorStack}`)
                            : console.error(`${errorType}: ${errorMessage}(${errorCode}) %c@${data.id}\n%c${remoteErrorStack}`, 'color: gray', '');
                }
                if (data.id === null || data.id === undefined)
                    return;
                const { f: [resolve, reject], stack: localErrorStack, } = requestContext.get(data.id) || { stack: '', f: [null, null] };
                if (!resolve)
                    return; // drop this response
                requestContext.delete(data.id);
                if (hasKey(data, 'error')) {
                    reject(RecoverError(errorType, errorMessage, errorCode, 
                    // ? We use \u0430 which looks like "a" to prevent browser think "at AsyncCall" is a real stack
                    remoteErrorStack + '\n    \u0430t AsyncCall (rpc) \n' + localErrorStack));
                }
                else {
                    resolve(data.result);
                }
            });
        }
        message.on(key, (_) => __awaiter(this, void 0, void 0, function* () {
            let data;
            let result = undefined;
            try {
                data = yield serializer.deserialization(_);
                if (isJSONRPCObject(data)) {
                    result = yield handleSingleMessage(data);
                    if (result)
                        yield send(result);
                }
                else if (Array.isArray(data) && data.every(isJSONRPCObject) && data.length !== 0) {
                    const result = yield Promise.all(data.map(handleSingleMessage));
                    // ? Response
                    if (data.every(x => x === undefined))
                        return;
                    yield send(result.filter(x => x));
                }
                else {
                    if (banUnknownMessage) {
                        yield send(ErrorResponse.InvalidRequest(data.id || null));
                    }
                    else {
                        // ? Ignore this message. The message channel maybe also used to transfer other message too.
                    }
                }
            }
            catch (e) {
                console.error(e, data, result);
                send(ErrorResponse.ParseError(e.stack));
            }
            function send(res) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (Array.isArray(res)) {
                        const reply = res.map(x => x).filter(x => x.id !== undefined);
                        if (reply.length === 0)
                            return;
                        message.emit(key, yield serializer.serialization(reply));
                    }
                    else {
                        if (!res)
                            return;
                        // ? This is a Notification, we MUST not return it.
                        if (res.id === undefined)
                            return;
                        message.emit(key, yield serializer.serialization(res));
                    }
                });
            }
        }));
        return new Proxy({}, {
            get(_target, method) {
                let stack = removeStackHeader(new Error().stack);
                return (...params) => {
                    if (typeof method !== 'string') {
                        const internalMethod = getStringFromRPCSymbol(method);
                        if (internalMethod)
                            method = internalMethod;
                        else
                            return Promise.reject(new TypeError('[AsyncCall] Only string can be the method name'));
                    }
                    else if (method.startsWith('rpc.'))
                        return Promise.reject(new TypeError('[AsyncCall] You cannot call JSON RPC internal methods directly'));
                    if (preferLocalImplementation && typeof method === 'string') {
                        const localImpl = implementation[method];
                        if (localImpl && typeof localImpl === 'function') {
                            return new Promise((resolve, reject) => {
                                try {
                                    resolve(localImpl(...params));
                                }
                                catch (e) {
                                    reject(e);
                                }
                            });
                        }
                    }
                    return new Promise((resolve, reject) => {
                        const id = generateRandomID();
                        const param0 = params[0];
                        const sendingStack = sendLocalStack ? stack : '';
                        const param = parameterStructures === 'by-name' && params.length === 1 && isObject$1(param0)
                            ? param0
                            : params;
                        const request = new Request(id, method, param, sendingStack);
                        serializer.serialization(request).then(data => {
                            message.emit(key, data);
                            requestContext.set(id, {
                                f: [resolve, reject],
                                stack,
                            });
                        }, reject);
                    });
                };
            },
        });
        function handleSingleMessage(data) {
            return __awaiter(this, void 0, void 0, function* () {
                if (hasKey(data, 'method')) {
                    return onRequest(data);
                }
                else if ('error' in data || 'result' in data) {
                    onResponse(data);
                }
                else {
                    if ('resultIsUndefined' in data) {
                        data.result = undefined;
                        onResponse(data);
                    }
                    else
                        return ErrorResponse.InvalidRequest(data.id);
                }
                return undefined;
            });
        }
    }
    const $AsyncCallIgnoreResponse = Symbol('This response should be ignored.');
    const $AsyncIteratorStartString = 'rpc.async-iterator.start';
    const $AsyncIteratorNextString = 'rpc.async-iterator.next';
    const $AsyncIteratorReturnString = 'rpc.async-iterator.return';
    const $AsyncIteratorThrowString = 'rpc.async-iterator.throw';
    const $AsyncIteratorStart = Symbol($AsyncIteratorStartString);
    const $AsyncIteratorNext = Symbol($AsyncIteratorNextString);
    const $AsyncIteratorReturn = Symbol($AsyncIteratorReturnString);
    const $AsyncIteratorThrow = Symbol($AsyncIteratorThrowString);
    const InternalMethodMap = {
        [$AsyncIteratorStart]: $AsyncIteratorStartString,
        [$AsyncIteratorNext]: $AsyncIteratorNextString,
        [$AsyncIteratorReturn]: $AsyncIteratorReturnString,
        [$AsyncIteratorThrow]: $AsyncIteratorThrowString,
        // Reverse map
        [$AsyncIteratorStartString]: $AsyncIteratorStart,
        [$AsyncIteratorNextString]: $AsyncIteratorNext,
        [$AsyncIteratorReturnString]: $AsyncIteratorReturn,
        [$AsyncIteratorThrowString]: $AsyncIteratorThrow,
        // empty
        undefined: null,
        null: undefined,
    };
    function generateRandomID() {
        return Math.random()
            .toString(36)
            .slice(2);
    }
    function getStringFromRPCSymbol(symbol) {
        if (typeof symbol !== 'symbol')
            return null;
        // @ts-ignore
        return InternalMethodMap[symbol];
    }
    function getRPCSymbolFromString(string) {
        if (typeof string !== 'string')
            return null;
        // @ts-ignore
        return InternalMethodMap[string];
    }
    /**
     * This function provides the async generator version of the AsyncCall
     */
    function AsyncGeneratorCall(implementation = {}, options = {}) {
        const iterators = new Map();
        const strict = calcStrictOptions(options.strict || false);
        function findIterator(id, label) {
            const it = iterators.get(id);
            if (!it) {
                if (strict.methodNotFound)
                    throw new Error(`Remote iterator not found while executing ${label}`);
                else
                    return $AsyncCallIgnoreResponse;
            }
            return it;
        }
        const server = {
            [$AsyncIteratorStart](method, args) {
                const iteratorGenerator = Reflect.get(implementation, method);
                if (typeof iteratorGenerator !== 'function') {
                    if (strict.methodNotFound)
                        throw new Error(method + ' is not a function');
                    else
                        return $AsyncCallIgnoreResponse;
                }
                const iterator = iteratorGenerator(...args);
                const id = generateRandomID();
                iterators.set(id, iterator);
                return Promise.resolve(id);
            },
            [$AsyncIteratorNext](id, val) {
                const it = findIterator(id, 'next');
                if (it !== $AsyncCallIgnoreResponse)
                    return it.next(val);
                return it;
            },
            [$AsyncIteratorReturn](id, val) {
                const it = findIterator(id, 'return');
                if (it !== $AsyncCallIgnoreResponse)
                    return it.return(val);
                return $AsyncCallIgnoreResponse;
            },
            [$AsyncIteratorThrow](id, val) {
                const it = findIterator(id, 'throw');
                if (it !== $AsyncCallIgnoreResponse)
                    return it.throw(val);
                return $AsyncCallIgnoreResponse;
            },
        };
        const remote = AsyncCall(server, options);
        function proxyTrap(_target, key) {
            if (typeof key !== 'string')
                throw new TypeError('[*AsyncCall] Only string can be the method name');
            return function (...args) {
                const id = remote[$AsyncIteratorStart](key, args);
                return new (class {
                    constructor() {
                        this[Symbol.toStringTag] = key;
                    }
                    return(val) {
                        return __awaiter(this, void 0, void 0, function* () {
                            return remote[$AsyncIteratorReturn](yield id, val);
                        });
                    }
                    next(val) {
                        return __awaiter(this, void 0, void 0, function* () {
                            return remote[$AsyncIteratorNext](yield id, val);
                        });
                    }
                    throw(val) {
                        return __awaiter(this, void 0, void 0, function* () {
                            return remote[$AsyncIteratorThrow](yield id, val);
                        });
                    }
                    [Symbol.asyncIterator]() {
                        return this;
                    }
                })();
            };
        }
        return new Proxy({}, { get: proxyTrap });
    }
    function calcLogOptions(log) {
        const logAllOn = { beCalled: true, localError: true, remoteError: true, type: 'pretty' };
        const logAllOff = { beCalled: false, localError: false, remoteError: false, type: 'basic' };
        return typeof log === 'boolean' ? (log ? logAllOn : logAllOff) : log;
    }
    function calcStrictOptions(strict) {
        const strictAllOn = { methodNotFound: true, unknownMessage: true, noUndefined: true };
        const strictAllOff = { methodNotFound: false, unknownMessage: false, noUndefined: false };
        return typeof strict === 'boolean' ? (strict ? strictAllOn : strictAllOff) : strict;
    }
    const jsonrpc = '2.0';
    class Request {
        constructor(id, method, params, remoteStack) {
            this.id = id;
            this.method = method;
            this.params = params;
            this.remoteStack = remoteStack;
            this.jsonrpc = '2.0';
            const request = { id, method, params, jsonrpc, remoteStack };
            if (request.remoteStack.length === 0)
                delete request.remoteStack;
            return request;
        }
    }
    class SuccessResponse {
        constructor(id, result, noUndefinedKeeping) {
            this.id = id;
            this.result = result;
            this.jsonrpc = '2.0';
            const obj = { id, jsonrpc, result: result || null };
            if (!noUndefinedKeeping && result === undefined)
                obj.resultIsUndefined = true;
            return obj;
        }
    }
    class ErrorResponse {
        constructor(id, code, message, stack, type = 'Error') {
            this.id = id;
            this.jsonrpc = '2.0';
            if (id === undefined)
                id = null;
            code = Math.floor(code);
            const error = (this.error = { code, message, data: { stack, type } });
            return { error, id, jsonrpc };
        }
    }
    // Pre defined error in section 5.1
    ErrorResponse.ParseError = (stack = '') => new ErrorResponse(null, -32700, 'Parse error', stack);
    ErrorResponse.InvalidRequest = (id) => new ErrorResponse(id, -32600, 'Invalid Request', '');
    ErrorResponse.MethodNotFound = (id) => new ErrorResponse(id, -32601, 'Method not found', '');
    ErrorResponse.InvalidParams = (id) => new ErrorResponse(id, -32602, 'Invalid params', '');
    ErrorResponse.InternalError = (id, message = '') => new ErrorResponse(id, -32603, 'Internal error' + message, '');
    function isJSONRPCObject(data) {
        if (!isObject$1(data))
            return false;
        if (!hasKey(data, 'jsonrpc'))
            return false;
        if (data.jsonrpc !== '2.0')
            return false;
        if (hasKey(data, 'params')) {
            const params = data.params;
            if (!Array.isArray(params) && !isObject$1(params))
                return false;
        }
        return true;
    }
    function isObject$1(params) {
        return typeof params === 'object' && params !== null;
    }
    function hasKey(obj, key) {
        return key in obj;
    }
    class CustomError extends Error {
        constructor(name, message, code, stack) {
            super(message);
            this.name = name;
            this.code = code;
            this.stack = stack;
        }
    }
    /** These Error is defined in ECMAScript spec */
    const errors = {
        Error,
        EvalError,
        RangeError,
        ReferenceError,
        SyntaxError,
        TypeError,
        URIError,
    };
    /**
     * AsyncCall support somehow transfer ECMAScript Error
     */
    function RecoverError(type, message, code, stack) {
        try {
            if (type.startsWith('DOMException:')) {
                const [_, name] = type.split('DOMException:');
                return new DOMException(message, name);
            }
            else if (type in errors) {
                const e = new errors[type](message);
                e.stack = stack;
                Object.assign(e, { code });
                return e;
            }
            else {
                return new CustomError(type, message, code, stack);
            }
        }
        catch (_a) {
            return new Error(`E${code} ${type}: ${message}\n${stack}`);
        }
    }
    function removeStackHeader(stack = '') {
        return stack.replace(/^.+\n.+\n/, '');
    }

    const MessageCenterEvent = 'Holoflows-Kit MessageCenter';
    const noop$1 = () => { };
    /**
     * Send and receive messages in different contexts.
     */
    class MessageCenter {
        /**
         * @param instanceKey - Use this instanceKey to distinguish your messages and others.
         * This option cannot make your message safe!
         */
        constructor(instanceKey = '') {
            this.instanceKey = instanceKey;
            /**
             * How should MessageCenter serialization the message
             * @defaultValue NoSerialization
             */
            this.serialization = NoSerialization;
            this.eventEmitter = new mitt();
            this.listener = (request) => __awaiter(this, void 0, void 0, function* () {
                let { key, data, instanceKey } = yield this.serialization.deserialization(request.detail || request);
                // Message is not for us
                if (this.instanceKey !== (instanceKey || ''))
                    return;
                if (this.writeToConsole) {
                    console.log(`%cReceive%c %c${key.toString()}`, 'background: rgba(0, 255, 255, 0.6); color: black; padding: 0px 6px; border-radius: 4px;', '', 'text-decoration: underline', data);
                }
                this.eventEmitter.emit(key, data);
            });
            /**
             * Should MessageCenter prints all messages to console?
             */
            this.writeToConsole = false;
            if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
                // Fired when a message is sent from either an extension process (by runtime.sendMessage)
                // or a content script (by tabs.sendMessage).
                browser.runtime.onMessage.addListener((e) => {
                    this.listener(e);
                });
            }
            if (typeof document !== 'undefined' && document.addEventListener) {
                document.addEventListener(MessageCenterEvent, this.listener);
            }
        }
        /**
         * Listen to an event
         * @param event - Name of the event
         * @param handler - Handler of the event
         * @returns a function, call it to remove this listener
         */
        on(event, handler) {
            this.eventEmitter.on(event, handler);
            return () => this.off(event, handler);
        }
        /**
         * Remove the listener of an event
         * @param event - Name of the event
         * @param handler - Handler of the event
         */
        off(event, handler) {
            this.eventEmitter.off(event, handler);
        }
        /**
         * Send message to local or other instance of extension
         * @param key - Key of the message
         * @param data - Data of the message
         * @param alsoSendToDocument - ! Send message to document. This may leaks secret! Only open in localhost!
         */
        emit(key, data, alsoSendToDocument = location.hostname === 'localhost') {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.writeToConsole) {
                    console.log(`%cSend%c %c${key.toString()}`, 'background: rgba(0, 255, 255, 0.6); color: black; padding: 0px 6px; border-radius: 4px;', '', 'text-decoration: underline', data);
                }
                const serialized = yield this.serialization.serialization({
                    data,
                    key,
                    instanceKey: this.instanceKey || '',
                });
                if (typeof browser !== 'undefined') {
                    if (browser.runtime && browser.runtime.sendMessage) {
                        browser.runtime.sendMessage(serialized).catch(noop$1);
                    }
                    if (browser.tabs) {
                        // Send message to Content Script
                        browser.tabs.query({ discarded: false }).then(tabs => {
                            for (const tab of tabs) {
                                if (tab.id)
                                    browser.tabs.sendMessage(tab.id, serialized).catch(noop$1);
                            }
                        });
                    }
                }
                if (alsoSendToDocument && typeof document !== 'undefined' && document.dispatchEvent) {
                    const event = new CustomEvent(MessageCenterEvent, {
                        detail: yield this.serialization.serialization({ data, key }),
                    });
                    document.dispatchEvent(event);
                }
            });
        }
        /**
         * {@inheritdoc MessageCenter.emit}
         */
        send(...args) {
            return Reflect.apply(this.emit, this, args);
        }
    }

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var interopRequireDefault = createCommonjsModule(function (module) {
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : {
        "default": obj
      };
    }

    module.exports = _interopRequireDefault;
    });

    unwrapExports(interopRequireDefault);

    var runtime_1 = createCommonjsModule(function (module) {
    /**
     * Copyright (c) 2014-present, Facebook, Inc.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */

    var runtime = (function (exports) {

      var Op = Object.prototype;
      var hasOwn = Op.hasOwnProperty;
      var undefined$1; // More compressible than void 0.
      var $Symbol = typeof Symbol === "function" ? Symbol : {};
      var iteratorSymbol = $Symbol.iterator || "@@iterator";
      var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
      var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

      function wrap(innerFn, outerFn, self, tryLocsList) {
        // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
        var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
        var generator = Object.create(protoGenerator.prototype);
        var context = new Context(tryLocsList || []);

        // The ._invoke method unifies the implementations of the .next,
        // .throw, and .return methods.
        generator._invoke = makeInvokeMethod(innerFn, self, context);

        return generator;
      }
      exports.wrap = wrap;

      // Try/catch helper to minimize deoptimizations. Returns a completion
      // record like context.tryEntries[i].completion. This interface could
      // have been (and was previously) designed to take a closure to be
      // invoked without arguments, but in all the cases we care about we
      // already have an existing method we want to call, so there's no need
      // to create a new function object. We can even get away with assuming
      // the method takes exactly one argument, since that happens to be true
      // in every case, so we don't have to touch the arguments object. The
      // only additional allocation required is the completion record, which
      // has a stable shape and so hopefully should be cheap to allocate.
      function tryCatch(fn, obj, arg) {
        try {
          return { type: "normal", arg: fn.call(obj, arg) };
        } catch (err) {
          return { type: "throw", arg: err };
        }
      }

      var GenStateSuspendedStart = "suspendedStart";
      var GenStateSuspendedYield = "suspendedYield";
      var GenStateExecuting = "executing";
      var GenStateCompleted = "completed";

      // Returning this object from the innerFn has the same effect as
      // breaking out of the dispatch switch statement.
      var ContinueSentinel = {};

      // Dummy constructor functions that we use as the .constructor and
      // .constructor.prototype properties for functions that return Generator
      // objects. For full spec compliance, you may wish to configure your
      // minifier not to mangle the names of these two functions.
      function Generator() {}
      function GeneratorFunction() {}
      function GeneratorFunctionPrototype() {}

      // This is a polyfill for %IteratorPrototype% for environments that
      // don't natively support it.
      var IteratorPrototype = {};
      IteratorPrototype[iteratorSymbol] = function () {
        return this;
      };

      var getProto = Object.getPrototypeOf;
      var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
      if (NativeIteratorPrototype &&
          NativeIteratorPrototype !== Op &&
          hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
        // This environment has a native %IteratorPrototype%; use it instead
        // of the polyfill.
        IteratorPrototype = NativeIteratorPrototype;
      }

      var Gp = GeneratorFunctionPrototype.prototype =
        Generator.prototype = Object.create(IteratorPrototype);
      GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
      GeneratorFunctionPrototype.constructor = GeneratorFunction;
      GeneratorFunctionPrototype[toStringTagSymbol] =
        GeneratorFunction.displayName = "GeneratorFunction";

      // Helper for defining the .next, .throw, and .return methods of the
      // Iterator interface in terms of a single ._invoke method.
      function defineIteratorMethods(prototype) {
        ["next", "throw", "return"].forEach(function(method) {
          prototype[method] = function(arg) {
            return this._invoke(method, arg);
          };
        });
      }

      exports.isGeneratorFunction = function(genFun) {
        var ctor = typeof genFun === "function" && genFun.constructor;
        return ctor
          ? ctor === GeneratorFunction ||
            // For the native GeneratorFunction constructor, the best we can
            // do is to check its .name property.
            (ctor.displayName || ctor.name) === "GeneratorFunction"
          : false;
      };

      exports.mark = function(genFun) {
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
        } else {
          genFun.__proto__ = GeneratorFunctionPrototype;
          if (!(toStringTagSymbol in genFun)) {
            genFun[toStringTagSymbol] = "GeneratorFunction";
          }
        }
        genFun.prototype = Object.create(Gp);
        return genFun;
      };

      // Within the body of any async function, `await x` is transformed to
      // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
      // `hasOwn.call(value, "__await")` to determine if the yielded value is
      // meant to be awaited.
      exports.awrap = function(arg) {
        return { __await: arg };
      };

      function AsyncIterator(generator) {
        function invoke(method, arg, resolve, reject) {
          var record = tryCatch(generator[method], generator, arg);
          if (record.type === "throw") {
            reject(record.arg);
          } else {
            var result = record.arg;
            var value = result.value;
            if (value &&
                typeof value === "object" &&
                hasOwn.call(value, "__await")) {
              return Promise.resolve(value.__await).then(function(value) {
                invoke("next", value, resolve, reject);
              }, function(err) {
                invoke("throw", err, resolve, reject);
              });
            }

            return Promise.resolve(value).then(function(unwrapped) {
              // When a yielded Promise is resolved, its final value becomes
              // the .value of the Promise<{value,done}> result for the
              // current iteration.
              result.value = unwrapped;
              resolve(result);
            }, function(error) {
              // If a rejected Promise was yielded, throw the rejection back
              // into the async generator function so it can be handled there.
              return invoke("throw", error, resolve, reject);
            });
          }
        }

        var previousPromise;

        function enqueue(method, arg) {
          function callInvokeWithMethodAndArg() {
            return new Promise(function(resolve, reject) {
              invoke(method, arg, resolve, reject);
            });
          }

          return previousPromise =
            // If enqueue has been called before, then we want to wait until
            // all previous Promises have been resolved before calling invoke,
            // so that results are always delivered in the correct order. If
            // enqueue has not been called before, then it is important to
            // call invoke immediately, without waiting on a callback to fire,
            // so that the async generator function has the opportunity to do
            // any necessary setup in a predictable way. This predictability
            // is why the Promise constructor synchronously invokes its
            // executor callback, and why async functions synchronously
            // execute code before the first await. Since we implement simple
            // async functions in terms of async generators, it is especially
            // important to get this right, even though it requires care.
            previousPromise ? previousPromise.then(
              callInvokeWithMethodAndArg,
              // Avoid propagating failures to Promises returned by later
              // invocations of the iterator.
              callInvokeWithMethodAndArg
            ) : callInvokeWithMethodAndArg();
        }

        // Define the unified helper method that is used to implement .next,
        // .throw, and .return (see defineIteratorMethods).
        this._invoke = enqueue;
      }

      defineIteratorMethods(AsyncIterator.prototype);
      AsyncIterator.prototype[asyncIteratorSymbol] = function () {
        return this;
      };
      exports.AsyncIterator = AsyncIterator;

      // Note that simple async functions are implemented on top of
      // AsyncIterator objects; they just return a Promise for the value of
      // the final result produced by the iterator.
      exports.async = function(innerFn, outerFn, self, tryLocsList) {
        var iter = new AsyncIterator(
          wrap(innerFn, outerFn, self, tryLocsList)
        );

        return exports.isGeneratorFunction(outerFn)
          ? iter // If outerFn is a generator, return the full iterator.
          : iter.next().then(function(result) {
              return result.done ? result.value : iter.next();
            });
      };

      function makeInvokeMethod(innerFn, self, context) {
        var state = GenStateSuspendedStart;

        return function invoke(method, arg) {
          if (state === GenStateExecuting) {
            throw new Error("Generator is already running");
          }

          if (state === GenStateCompleted) {
            if (method === "throw") {
              throw arg;
            }

            // Be forgiving, per 25.3.3.3.3 of the spec:
            // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
            return doneResult();
          }

          context.method = method;
          context.arg = arg;

          while (true) {
            var delegate = context.delegate;
            if (delegate) {
              var delegateResult = maybeInvokeDelegate(delegate, context);
              if (delegateResult) {
                if (delegateResult === ContinueSentinel) continue;
                return delegateResult;
              }
            }

            if (context.method === "next") {
              // Setting context._sent for legacy support of Babel's
              // function.sent implementation.
              context.sent = context._sent = context.arg;

            } else if (context.method === "throw") {
              if (state === GenStateSuspendedStart) {
                state = GenStateCompleted;
                throw context.arg;
              }

              context.dispatchException(context.arg);

            } else if (context.method === "return") {
              context.abrupt("return", context.arg);
            }

            state = GenStateExecuting;

            var record = tryCatch(innerFn, self, context);
            if (record.type === "normal") {
              // If an exception is thrown from innerFn, we leave state ===
              // GenStateExecuting and loop back for another invocation.
              state = context.done
                ? GenStateCompleted
                : GenStateSuspendedYield;

              if (record.arg === ContinueSentinel) {
                continue;
              }

              return {
                value: record.arg,
                done: context.done
              };

            } else if (record.type === "throw") {
              state = GenStateCompleted;
              // Dispatch the exception by looping back around to the
              // context.dispatchException(context.arg) call above.
              context.method = "throw";
              context.arg = record.arg;
            }
          }
        };
      }

      // Call delegate.iterator[context.method](context.arg) and handle the
      // result, either by returning a { value, done } result from the
      // delegate iterator, or by modifying context.method and context.arg,
      // setting context.delegate to null, and returning the ContinueSentinel.
      function maybeInvokeDelegate(delegate, context) {
        var method = delegate.iterator[context.method];
        if (method === undefined$1) {
          // A .throw or .return when the delegate iterator has no .throw
          // method always terminates the yield* loop.
          context.delegate = null;

          if (context.method === "throw") {
            // Note: ["return"] must be used for ES3 parsing compatibility.
            if (delegate.iterator["return"]) {
              // If the delegate iterator has a return method, give it a
              // chance to clean up.
              context.method = "return";
              context.arg = undefined$1;
              maybeInvokeDelegate(delegate, context);

              if (context.method === "throw") {
                // If maybeInvokeDelegate(context) changed context.method from
                // "return" to "throw", let that override the TypeError below.
                return ContinueSentinel;
              }
            }

            context.method = "throw";
            context.arg = new TypeError(
              "The iterator does not provide a 'throw' method");
          }

          return ContinueSentinel;
        }

        var record = tryCatch(method, delegate.iterator, context.arg);

        if (record.type === "throw") {
          context.method = "throw";
          context.arg = record.arg;
          context.delegate = null;
          return ContinueSentinel;
        }

        var info = record.arg;

        if (! info) {
          context.method = "throw";
          context.arg = new TypeError("iterator result is not an object");
          context.delegate = null;
          return ContinueSentinel;
        }

        if (info.done) {
          // Assign the result of the finished delegate to the temporary
          // variable specified by delegate.resultName (see delegateYield).
          context[delegate.resultName] = info.value;

          // Resume execution at the desired location (see delegateYield).
          context.next = delegate.nextLoc;

          // If context.method was "throw" but the delegate handled the
          // exception, let the outer generator proceed normally. If
          // context.method was "next", forget context.arg since it has been
          // "consumed" by the delegate iterator. If context.method was
          // "return", allow the original .return call to continue in the
          // outer generator.
          if (context.method !== "return") {
            context.method = "next";
            context.arg = undefined$1;
          }

        } else {
          // Re-yield the result returned by the delegate method.
          return info;
        }

        // The delegate iterator is finished, so forget it and continue with
        // the outer generator.
        context.delegate = null;
        return ContinueSentinel;
      }

      // Define Generator.prototype.{next,throw,return} in terms of the
      // unified ._invoke helper method.
      defineIteratorMethods(Gp);

      Gp[toStringTagSymbol] = "Generator";

      // A Generator should always return itself as the iterator object when the
      // @@iterator function is called on it. Some browsers' implementations of the
      // iterator prototype chain incorrectly implement this, causing the Generator
      // object to not be returned from this call. This ensures that doesn't happen.
      // See https://github.com/facebook/regenerator/issues/274 for more details.
      Gp[iteratorSymbol] = function() {
        return this;
      };

      Gp.toString = function() {
        return "[object Generator]";
      };

      function pushTryEntry(locs) {
        var entry = { tryLoc: locs[0] };

        if (1 in locs) {
          entry.catchLoc = locs[1];
        }

        if (2 in locs) {
          entry.finallyLoc = locs[2];
          entry.afterLoc = locs[3];
        }

        this.tryEntries.push(entry);
      }

      function resetTryEntry(entry) {
        var record = entry.completion || {};
        record.type = "normal";
        delete record.arg;
        entry.completion = record;
      }

      function Context(tryLocsList) {
        // The root entry object (effectively a try statement without a catch
        // or a finally block) gives us a place to store values thrown from
        // locations where there is no enclosing try statement.
        this.tryEntries = [{ tryLoc: "root" }];
        tryLocsList.forEach(pushTryEntry, this);
        this.reset(true);
      }

      exports.keys = function(object) {
        var keys = [];
        for (var key in object) {
          keys.push(key);
        }
        keys.reverse();

        // Rather than returning an object with a next method, we keep
        // things simple and return the next function itself.
        return function next() {
          while (keys.length) {
            var key = keys.pop();
            if (key in object) {
              next.value = key;
              next.done = false;
              return next;
            }
          }

          // To avoid creating an additional object, we just hang the .value
          // and .done properties off the next function object itself. This
          // also ensures that the minifier will not anonymize the function.
          next.done = true;
          return next;
        };
      };

      function values(iterable) {
        if (iterable) {
          var iteratorMethod = iterable[iteratorSymbol];
          if (iteratorMethod) {
            return iteratorMethod.call(iterable);
          }

          if (typeof iterable.next === "function") {
            return iterable;
          }

          if (!isNaN(iterable.length)) {
            var i = -1, next = function next() {
              while (++i < iterable.length) {
                if (hasOwn.call(iterable, i)) {
                  next.value = iterable[i];
                  next.done = false;
                  return next;
                }
              }

              next.value = undefined$1;
              next.done = true;

              return next;
            };

            return next.next = next;
          }
        }

        // Return an iterator with no values.
        return { next: doneResult };
      }
      exports.values = values;

      function doneResult() {
        return { value: undefined$1, done: true };
      }

      Context.prototype = {
        constructor: Context,

        reset: function(skipTempReset) {
          this.prev = 0;
          this.next = 0;
          // Resetting context._sent for legacy support of Babel's
          // function.sent implementation.
          this.sent = this._sent = undefined$1;
          this.done = false;
          this.delegate = null;

          this.method = "next";
          this.arg = undefined$1;

          this.tryEntries.forEach(resetTryEntry);

          if (!skipTempReset) {
            for (var name in this) {
              // Not sure about the optimal order of these conditions:
              if (name.charAt(0) === "t" &&
                  hasOwn.call(this, name) &&
                  !isNaN(+name.slice(1))) {
                this[name] = undefined$1;
              }
            }
          }
        },

        stop: function() {
          this.done = true;

          var rootEntry = this.tryEntries[0];
          var rootRecord = rootEntry.completion;
          if (rootRecord.type === "throw") {
            throw rootRecord.arg;
          }

          return this.rval;
        },

        dispatchException: function(exception) {
          if (this.done) {
            throw exception;
          }

          var context = this;
          function handle(loc, caught) {
            record.type = "throw";
            record.arg = exception;
            context.next = loc;

            if (caught) {
              // If the dispatched exception was caught by a catch block,
              // then let that catch block handle the exception normally.
              context.method = "next";
              context.arg = undefined$1;
            }

            return !! caught;
          }

          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            var record = entry.completion;

            if (entry.tryLoc === "root") {
              // Exception thrown outside of any try block that could handle
              // it, so set the completion value of the entire function to
              // throw the exception.
              return handle("end");
            }

            if (entry.tryLoc <= this.prev) {
              var hasCatch = hasOwn.call(entry, "catchLoc");
              var hasFinally = hasOwn.call(entry, "finallyLoc");

              if (hasCatch && hasFinally) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                } else if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }

              } else if (hasCatch) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                }

              } else if (hasFinally) {
                if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }

              } else {
                throw new Error("try statement without catch or finally");
              }
            }
          }
        },

        abrupt: function(type, arg) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            if (entry.tryLoc <= this.prev &&
                hasOwn.call(entry, "finallyLoc") &&
                this.prev < entry.finallyLoc) {
              var finallyEntry = entry;
              break;
            }
          }

          if (finallyEntry &&
              (type === "break" ||
               type === "continue") &&
              finallyEntry.tryLoc <= arg &&
              arg <= finallyEntry.finallyLoc) {
            // Ignore the finally entry if control is not jumping to a
            // location outside the try/catch block.
            finallyEntry = null;
          }

          var record = finallyEntry ? finallyEntry.completion : {};
          record.type = type;
          record.arg = arg;

          if (finallyEntry) {
            this.method = "next";
            this.next = finallyEntry.finallyLoc;
            return ContinueSentinel;
          }

          return this.complete(record);
        },

        complete: function(record, afterLoc) {
          if (record.type === "throw") {
            throw record.arg;
          }

          if (record.type === "break" ||
              record.type === "continue") {
            this.next = record.arg;
          } else if (record.type === "return") {
            this.rval = this.arg = record.arg;
            this.method = "return";
            this.next = "end";
          } else if (record.type === "normal" && afterLoc) {
            this.next = afterLoc;
          }

          return ContinueSentinel;
        },

        finish: function(finallyLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            if (entry.finallyLoc === finallyLoc) {
              this.complete(entry.completion, entry.afterLoc);
              resetTryEntry(entry);
              return ContinueSentinel;
            }
          }
        },

        "catch": function(tryLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            if (entry.tryLoc === tryLoc) {
              var record = entry.completion;
              if (record.type === "throw") {
                var thrown = record.arg;
                resetTryEntry(entry);
              }
              return thrown;
            }
          }

          // The context.catch method must only be called with a location
          // argument that corresponds to a known catch block.
          throw new Error("illegal catch attempt");
        },

        delegateYield: function(iterable, resultName, nextLoc) {
          this.delegate = {
            iterator: values(iterable),
            resultName: resultName,
            nextLoc: nextLoc
          };

          if (this.method === "next") {
            // Deliberately forget the last sent value so that we don't
            // accidentally pass it on to the delegate.
            this.arg = undefined$1;
          }

          return ContinueSentinel;
        }
      };

      // Regardless of whether this script is executing as a CommonJS module
      // or not, return the runtime object so that we can declare the variable
      // regeneratorRuntime in the outer scope, which allows this module to be
      // injected easily by `bin/regenerator --include-runtime script.js`.
      return exports;

    }(
      // If this script is executing as a CommonJS module, use module.exports
      // as the regeneratorRuntime namespace. Otherwise create a new empty
      // object. Either way, the resulting object will be used to initialize
      // the regeneratorRuntime variable at the top of this file.
       module.exports 
    ));

    try {
      regeneratorRuntime = runtime;
    } catch (accidentalStrictMode) {
      // This module should not be running in strict mode, so the above
      // assignment should always work unless something is misconfigured. Just
      // in case runtime.js accidentally runs in strict mode, we can escape
      // strict mode using a global Function call. This could conceivably fail
      // if a Content Security Policy forbids using Function, but in that case
      // the proper solution is to fix the accidental strict mode problem. If
      // you've misconfigured your bundler to force strict mode and applied a
      // CSP to forbid Function, and you're not willing to fix either of those
      // problems, please detail your unique predicament in a GitHub issue.
      Function("r", "regeneratorRuntime = r")(runtime);
    }
    });

    var regenerator = runtime_1;

    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg);
        var value = info.value;
      } catch (error) {
        reject(error);
        return;
      }

      if (info.done) {
        resolve(value);
      } else {
        Promise.resolve(value).then(_next, _throw);
      }
    }

    function _asyncToGenerator(fn) {
      return function () {
        var self = this,
            args = arguments;
        return new Promise(function (resolve, reject) {
          var gen = fn.apply(self, args);

          function _next(value) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
          }

          function _throw(err) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
          }

          _next(undefined);
        });
      };
    }

    var asyncToGenerator = _asyncToGenerator;

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    var classCallCheck = _classCallCheck;

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

    var createClass = _createClass;

    var lib = createCommonjsModule(function (module, exports) {



    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.default = void 0;

    var _regenerator = interopRequireDefault(regenerator);

    var _asyncToGenerator2 = interopRequireDefault(asyncToGenerator);

    var _classCallCheck2 = interopRequireDefault(classCallCheck);

    var _createClass2 = interopRequireDefault(createClass);

    var Signal =
    /*#__PURE__*/
    function () {
      function Signal() {
        (0, _classCallCheck2.default)(this, Signal);
      }

      (0, _createClass2.default)(Signal, [{
        key: "_fire",
        value: function _fire(err) {
          var fn = this._fn;
          delete this._fn;
          if (fn) fn(err);
        }
      }, {
        key: "_wait",
        value: function _wait(timeout) {
          var _this = this;

          return new Promise(function (resolve, reject) {
            _this._fn = function (err) {
              return err ? reject(err) : resolve();
            };

            if (timeout !== undefined) setTimeout(function () {
              return _this._fire(new Error('Timeout'));
            }, timeout);
          });
        }
      }], [{
        key: "wait",
        value: function () {
          var _wait2 = (0, _asyncToGenerator2.default)(
          /*#__PURE__*/
          _regenerator.default.mark(function _callee(timeout) {
            var signal;
            return _regenerator.default.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    signal = new Signal();
                    this.instances.push(signal);
                    _context.next = 4;
                    return signal._wait(timeout);

                  case 4:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));

          function wait(_x) {
            return _wait2.apply(this, arguments);
          }

          return wait;
        }()
      }, {
        key: "fire",
        value: function fire() {
          var signal = this.instances.shift();
          if (signal) signal._fire();
        }
      }]);
      return Signal;
    }();

    Signal.instances = [];

    var Lock =
    /*#__PURE__*/
    function () {
      function Lock() {
        var limit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
        (0, _classCallCheck2.default)(this, Lock);
        this._limit = limit;
        this._locked = 0;
      }

      (0, _createClass2.default)(Lock, [{
        key: "isLocked",
        value: function isLocked() {
          return this._locked >= this._limit;
        }
      }, {
        key: "lock",
        value: function () {
          var _lock = (0, _asyncToGenerator2.default)(
          /*#__PURE__*/
          _regenerator.default.mark(function _callee2(timeout) {
            return _regenerator.default.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    if (!this.isLocked()) {
                      _context2.next = 3;
                      break;
                    }

                    _context2.next = 3;
                    return Signal.wait(timeout);

                  case 3:
                    this._locked++;

                  case 4:
                  case "end":
                    return _context2.stop();
                }
              }
            }, _callee2, this);
          }));

          function lock(_x2) {
            return _lock.apply(this, arguments);
          }

          return lock;
        }()
      }, {
        key: "unlock",
        value: function unlock() {
          if (this._locked <= 0) {
            throw new Error('Already unlocked');
          }

          this._locked--;
          Signal.fire();
        }
      }]);
      return Lock;
    }();

    exports.default = Lock;
    });

    var Lock = unwrapExports(lib);

    var bld = createCommonjsModule(function (module, exports) {
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

    });

    unwrapExports(bld);
    var bld_1 = bld.MixedMap;

    var bld$1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });

    var MultikeyMap = (function () {
        function MultikeyMap() {
            this.map = new bld.default();
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
                        map = mapValue.map = new bld.default();
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

    });

    unwrapExports(bld$1);
    var bld_1$1 = bld$1.MultikeyMap;

    var bld$2 = createCommonjsModule(function (module, exports) {
    /*
      Memorize Decorator v0.2
      https://github.com/vilic/memorize-decorator
    */
    Object.defineProperty(exports, "__esModule", { value: true });

    var RESOLVED = Promise.resolve();
    function decorateFunction(fn, options) {
        return buildIntermediateFunction(fn, options);
    }
    function memorize(fn, options) {
        if (typeof fn === 'function') {
            return decorateFunction(fn, options);
        }
        else {
            options = fn;
        }
        return function (_target, _name, descriptor) {
            var getter = descriptor.get;
            var value = descriptor.value;
            var fn;
            var descriptorItemName;
            if (getter) {
                fn = getter;
                descriptorItemName = 'get';
            }
            else if (typeof value === 'function') {
                fn = value;
                descriptorItemName = 'value';
            }
            else {
                throw new TypeError('Invalid decoration');
            }
            return _a = {
                    configurable: descriptor.configurable,
                    enumerable: descriptor.enumerable
                },
                _a[descriptorItemName] = buildIntermediateFunction(fn, options),
                _a;
            var _a;
        };
    }
    exports.memorize = memorize;
    exports.default = memorize;
    function buildIntermediateFunction(originalFn, _a) {
        var _b = (_a === void 0 ? {} : _a).ttl, ttl = _b === void 0 ? Infinity : _b;
        var cacheMap = new bld$1.default();
        var name = originalFn.name;
        var nameDescriptor = Object.getOwnPropertyDescriptor(fn, 'name');
        if (nameDescriptor.configurable) {
            Object.defineProperty(fn, 'name', { value: name });
        }
        else if (nameDescriptor.writable) {
            fn.name = name;
        }
        return fn;
        function fn() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var keys = [this].concat(args);
            var _a = cacheMap.hasAndGet(keys), hasCache = _a[0], cache = _a[1];
            if (!hasCache) {
                cache = originalFn.apply(this, args);
                cacheMap.set(keys, cache);
                if (ttl === 'async') {
                    // tslint:disable-next-line:no-floating-promises
                    Promise.resolve(cache).then(cleanUp, cleanUp);
                }
                else if (ttl !== Infinity) {
                    if (ttl === false) {
                        RESOLVED.then(cleanUp);
                    }
                    else {
                        setTimeout(cleanUp, ttl);
                    }
                }
            }
            return cache;
            function cleanUp() {
                cacheMap.delete(keys);
            }
        }
    }

    });

    unwrapExports(bld$2);
    var bld_1$2 = bld$2.memorize;

    const AutomatedTabTaskDefineTimeOptionsDefault = {
        timeout: 30 * 1000,
        concurrent: 3,
        memorizeTTL: 30 * 60 * 1000,
        memorable: false,
        autoClose: true,
        pinned: true,
        active: false,
        AsyncCallOptions: {},
    };
    /**
     * Open a new page in the background, execute some task, then close it automatically.
     *
     * @example
     *
     * In content script: (You must run this in the page you wanted to run task in!)
     * ```ts
     * export const task = AutomatedTabTask({
     *   async taskA() {
     *       return 'Done!'
     *   },
     * })
     * ```
     *
     * In background script:
     *
     * Open https://example.com/ then run taskA() on that page, which will return 'Done!'
     * ```ts
     * import { task } from '...'
     * task('https://example.com/').taskA()
     * ```
     *
     * @param taskImplements - All tasks that background page can call.
     * @param options - Options
     */
    function AutomatedTabTask(taskImplements, options = {}) {
        const { timeout: defaultTimeout, concurrent, memorable: defaultMemorable, memorizeTTL, autoClose: defaultAutoClose, pinned: defaultPinned, active: defaultActive, AsyncCallOptions, } = Object.assign(Object.assign({}, AutomatedTabTaskDefineTimeOptionsDefault), options);
        if (AsyncCallOptions.key === undefined) {
            AsyncCallOptions.key = GetDefaultKey();
        }
        const AsyncCallKey = AsyncCallOptions.key;
        const REGISTER = AsyncCallKey + ':ping';
        if (GetContext() === 'content') {
            // If run in content script
            // Register this tab
            browser.runtime.sendMessage({ type: REGISTER }).then((sender) => {
                const tabId = sender.tab.id;
                if (!tabId)
                    return;
                // Transform `methodA` to `methodA:233` (if tabId = 233)
                const tasksWithId = {};
                for (const [taskName, value] of Object.entries(taskImplements)) {
                    tasksWithId[getTaskNameByTabId(taskName, tabId)] = value;
                }
                // Register AsyncCall
                AsyncCall(tasksWithId, AsyncCallOptions);
            }, () => { });
            return null;
        }
        else if (GetContext() === 'background' || GetContext() === 'options') {
            /** If `tab` is ready */
            const tabReadyMap = new Set();
            // Listen to tab REGISTER event
            browser.runtime.onMessage.addListener(((message, sender) => {
                if (message.type === REGISTER) {
                    tabReadyMap.add(sender.tab.id);
                    // response its tab id
                    return Promise.resolve(sender);
                }
                return undefined;
            }));
            // Register a empty AsyncCall for runtime-generated call
            const asyncCall = AsyncCall({}, AsyncCallOptions);
            const lock = new Lock(concurrent);
            const memoRunTask = bld_1$2(createOrGetTheTabToExecuteTask, { ttl: memorizeTTL });
            /**
             * @param urlOrTabID - where to run the task
             * string: URL you want to execute the task
             * number: task id you want to execute the task
             * @param options - runtime options
             */
            function taskStarter(urlOrTabID, options = {}) {
                const { memorable, timeout, important: isImportant, autoClose, pinned, active, runAtTabID, needRedirect, url, } = Object.assign(Object.assign({}, {
                    memorable: defaultMemorable,
                    important: false,
                    timeout: defaultTimeout,
                    autoClose: typeof urlOrTabID === 'number' || options.runAtTabID ? false : defaultAutoClose,
                    pinned: defaultPinned,
                    active: defaultActive,
                    needRedirect: false,
                }), options);
                const tabId = (typeof urlOrTabID === 'number' ? urlOrTabID : undefined) || runAtTabID;
                const finalUrl = (typeof urlOrTabID === 'string' ? urlOrTabID : '') || url || '';
                function proxyTrap(_target, taskName) {
                    return (...taskArgs) => {
                        if (typeof taskName !== 'string')
                            throw new TypeError('Key must be a string');
                        return (memorable ? memoRunTask : createOrGetTheTabToExecuteTask)({
                            active,
                            taskName,
                            timeout,
                            isImportant,
                            pinned,
                            autoClose,
                            needRedirect,
                            taskArgs,
                            asyncCall,
                            lock,
                            tabId,
                            tabReadyMap,
                            url: finalUrl,
                        });
                    };
                }
                return new Proxy({}, { get: proxyTrap });
            }
            return taskStarter;
        }
        else if (GetContext() === 'debugging') {
            return (...args1) => new Proxy({}, {
                get(_, key) {
                    return (...args2) => __awaiter(this, void 0, void 0, function* () {
                        console.log(`AutomatedTabTask.${AsyncCallKey}.${String(key)} called with `, ...args1, ...args2);
                        yield sleep(2000);
                    });
                },
            });
        }
        else {
            return null;
        }
    }
    function createOrGetTheTabToExecuteTask(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { active, taskArgs, autoClose, isImportant, needRedirect, pinned, tabId: wantedTabID } = options;
            const { asyncCall, tabReadyMap, lock, taskName, timeout: timeout$1, url } = options;
            /**
             * does it need a lock to avoid too many open at the same time?
             */
            const withoutLock = isImportant || autoClose === false || active || wantedTabID;
            if (!withoutLock)
                yield lock.lock(timeout$1);
            const tabId = yield getTabOrCreate(wantedTabID, url, needRedirect, active, pinned);
            // Wait for the tab register
            while (tabReadyMap.has(tabId) !== true)
                yield sleep(50);
            // Run the async call
            const task = asyncCall[getTaskNameByTabId(taskName, tabId)](...taskArgs);
            try {
                // ! DO NOT Remove `await`, or finally block will run before the promise resolved
                return yield timeout(task, timeout$1);
            }
            finally {
                if (!withoutLock)
                    lock.unlock();
                autoClose && browser.tabs.remove(tabId);
            }
        });
    }
    function getTabOrCreate(openInCurrentTab, url, needRedirect, active, pinned) {
        return __awaiter(this, void 0, void 0, function* () {
            if (openInCurrentTab) {
                if (needRedirect) {
                    // TODO: read the api
                    browser.tabs.executeScript(openInCurrentTab, { code: 'location.href = ' + url });
                }
                return openInCurrentTab;
            }
            // Create a new tab
            const tab = yield browser.tabs.create({ active, pinned, url });
            return tab.id;
        });
    }
    function getTaskNameByTabId(task, tabId) {
        return `${task}:${tabId}`;
    }
    function GetDefaultKey() {
        const context = GetContext();
        switch (context) {
            case 'background':
            case 'content':
            case 'options':
                return browser.runtime.getURL('@holoflows/kit:AutomatedTabTask');
            case 'debugging':
                return 'debug';
            case 'unknown':
            default:
                throw new TypeError('Unknown running context');
        }
    }

    /**
     * This file is published by MIT License.
     */
    /**
     * A `ref` object with `addListener`
     *
     * @example
     * ```ts
     * const ref = new ValueRef(64)
     * function useRef() {
     *     const [state, setState] = React.useState(ref.value)
     *     React.useEffect(() => ref.addListener(e => setState(e)))
     *     return state
     * }
     * ref.value = 42 // useRef will receive the new value
     * ```
     */
    class ValueRef {
        constructor(_value) {
            this._value = _value;
            /** All watchers */
            this.watcher = new Set();
        }
        /** Get current value */
        get value() {
            return this._value;
        }
        /** Set current value */
        set value(newVal) {
            const oldVal = this._value;
            if (newVal === oldVal)
                return;
            this._value = newVal;
            for (const fn of this.watcher) {
                try {
                    fn(newVal, oldVal);
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
        /**
         * Add a listener. This will return a remover.
         * @example
         * ```ts
         * React.useEffect(() => ref.addListener(setState))
         * ```
         */
        addListener(fn) {
            this.watcher.add(fn);
            return () => this.removeListener(fn);
        }
        /**
         * Remove a listener
         */
        removeListener(fn) {
            this.watcher.delete(fn);
        }
        /**
         * Remove all listeners
         */
        removeAllListener() {
            this.watcher = new Set();
        }
    }

    exports.AsyncCall = AsyncCall;
    exports.AsyncGeneratorCall = AsyncGeneratorCall;
    exports.AutomatedTabTask = AutomatedTabTask;
    exports.DomProxy = DomProxy;
    exports.EventWatcher = EventWatcher;
    exports.GetContext = GetContext;
    exports.IntervalWatcher = IntervalWatcher;
    exports.JSONSerialization = JSONSerialization;
    exports.LiveSelector = LiveSelector;
    exports.MessageCenter = MessageCenter;
    exports.MutationObserverWatcher = MutationObserverWatcher;
    exports.NoSerialization = NoSerialization;
    exports.OnlyRunInContext = OnlyRunInContext;
    exports.ValueRef = ValueRef;
    exports.Watcher = Watcher;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map