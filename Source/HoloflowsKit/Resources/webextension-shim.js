(function () {
    'use strict';

    /**
     * Check if the current location matches. Used in manifest.json parser
     * @param location Current location
     * @param matches
     * @param exclude_matches
     * @param include_globs
     * @param exclude_globs
     */
    function matchingURL(location, matches, exclude_matches, include_globs, exclude_globs, about_blank) {
        let result = false;
        // ? We eval matches first then eval mismatches
        for (const item of matches)
            if (matches_matcher(item, location, about_blank))
                result = true;
        for (const item of exclude_matches)
            if (matches_matcher(item, location))
                result = false;
        if (include_globs.length)
            console.warn('include_globs not supported yet.');
        if (exclude_globs.length)
            console.warn('exclude_globs not supported yet.');
        return result;
    }
    /**
     * Supported protocols
     */
    const supportedProtocols = [
        'http:',
        'https:',
    ];
    function matches_matcher(_, location, about_blank) {
        if (location.toString() === 'about:blank' && about_blank)
            return true;
        if (_ === '<all_urls>') {
            if (supportedProtocols.includes(location.protocol))
                return true;
            return false;
        }
        const [rule, wildcardProtocol] = normalizeURL(_);
        if (rule.port !== '')
            return false;
        if (!protocol_matcher(rule.protocol, location.protocol, wildcardProtocol))
            return false;
        if (!host_matcher(rule.hostname, location.hostname))
            return false;
        if (!path_matcher(rule.pathname, location.pathname, location.search))
            return false;
        return true;
    }
    /**
     * NormalizeURL
     * @param _ - URL defined in manifest
     */
    function normalizeURL(_) {
        if (_.startsWith('*://'))
            return [new URL(_.replace(/^\*:/, 'https:')), true];
        return [new URL(_), false];
    }
    function protocol_matcher(matcherProtocol, currentProtocol, wildcardProtocol) {
        // ? only `http:` and `https:` is supported currently
        if (!supportedProtocols.includes(currentProtocol))
            return false;
        // ? if wanted protocol is "*:", match everything
        if (wildcardProtocol)
            return true;
        if (matcherProtocol === currentProtocol)
            return true;
        return false;
    }
    function host_matcher(matcherHost, currentHost) {
        // ? %2A is *
        if (matcherHost === '%2A')
            return true;
        if (matcherHost.startsWith('%2A.')) {
            const part = matcherHost.replace(/^%2A/, '');
            if (part === currentHost)
                return false;
            return currentHost.endsWith(part);
        }
        return matcherHost === currentHost;
    }
    function path_matcher(matcherPath, currentPath, currentSearch) {
        if (!matcherPath.startsWith('/'))
            return false;
        if (matcherPath === '/*')
            return true;
        // ? '/a/b/c' matches '/a/b/c#123' but not '/a/b/c?123'
        if (matcherPath === currentPath && currentSearch === '')
            return true;
        // ? '/a/b/*' matches everything startsWith '/a/b/'
        if (matcherPath.endsWith('*') && currentPath.startsWith(matcherPath.slice(undefined, -1)))
            return true;
        if (matcherPath.indexOf('*') === -1)
            return matcherPath === currentPath;
        console.warn('Not supported path matcher in manifest.json', matcherPath);
        return true;
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var realmsShim_umd = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
       module.exports = factory() ;
    }(commonjsGlobal, function () {
      // we'd like to abandon, but we can't, so just scream and break a lot of
      // stuff. However, since we aren't really aborting the process, be careful to
      // not throw an Error object which could be captured by child-Realm code and
      // used to access the (too-powerful) primal-realm Error object.

      function throwTantrum(s, err = undefined) {
        const msg = `please report internal shim error: ${s}`;

        // we want to log these 'should never happen' things.
        // eslint-disable-next-line no-console
        console.error(msg);
        if (err) {
          // eslint-disable-next-line no-console
          console.error(`${err}`);
          // eslint-disable-next-line no-console
          console.error(`${err.stack}`);
        }

        // eslint-disable-next-line no-debugger
        debugger;
        throw msg;
      }

      function assert(condition, message) {
        if (!condition) {
          throwTantrum(message);
        }
      }

      // Remove code modifications.
      function cleanupSource(src) {
        return src;
      }

      // buildChildRealm is immediately turned into a string, and this function is
      // never referenced again, because it closes over the wrong intrinsics

      function buildChildRealm(unsafeRec, BaseRealm) {
        const {
          initRootRealm,
          initCompartment,
          getRealmGlobal,
          realmEvaluate
        } = BaseRealm;

        // This Object and Reflect are brand new, from a new unsafeRec, so no user
        // code has been run or had a chance to manipulate them. We extract these
        // properties for brevity, not for security. Don't ever run this function
        // *after* user code has had a chance to pollute its environment, or it
        // could be used to gain access to BaseRealm and primal-realm Error
        // objects.
        const { create, defineProperties } = Object;

        const errorConstructors = new Map([
          ['EvalError', EvalError],
          ['RangeError', RangeError],
          ['ReferenceError', ReferenceError],
          ['SyntaxError', SyntaxError],
          ['TypeError', TypeError],
          ['URIError', URIError]
        ]);

        // Like Realm.apply except that it catches anything thrown and rethrows it
        // as an Error from this realm
        function callAndWrapError(target, ...args) {
          try {
            return target(...args);
          } catch (err) {
            if (Object(err) !== err) {
              // err is a primitive value, which is safe to rethrow
              throw err;
            }
            let eName, eMessage, eStack;
            try {
              // The child environment might seek to use 'err' to reach the
              // parent's intrinsics and corrupt them. `${err.name}` will cause
              // string coercion of 'err.name'. If err.name is an object (probably
              // a String of the parent Realm), the coercion uses
              // err.name.toString(), which is under the control of the parent. If
              // err.name were a primitive (e.g. a number), it would use
              // Number.toString(err.name), using the child's version of Number
              // (which the child could modify to capture its argument for later
              // use), however primitives don't have properties like .prototype so
              // they aren't useful for an attack.
              eName = `${err.name}`;
              eMessage = `${err.message}`;
              eStack = `${err.stack || eMessage}`;
              // eName/eMessage/eStack are now child-realm primitive strings, and
              // safe to expose
            } catch (ignored) {
              // if err.name.toString() throws, keep the (parent realm) Error away
              // from the child
              throw new Error('unknown error');
            }
            const ErrorConstructor = errorConstructors.get(eName) || Error;
            try {
              throw new ErrorConstructor(eMessage);
            } catch (err2) {
              err2.stack = eStack; // replace with the captured inner stack
              throw err2;
            }
          }
        }

        class Realm {
          constructor() {
            // The Realm constructor is not intended to be used with the new operator
            // or to be subclassed. It may be used as the value of an extends clause
            // of a class definition but a super call to the Realm constructor will
            // cause an exception.

            // When Realm is called as a function, an exception is also raised because
            // a class constructor cannot be invoked without 'new'.
            throw new TypeError('Realm is not a constructor');
          }

          static makeRootRealm(options) {
            // This is the exposed interface.
            options = Object(options); // todo: sanitize

            // Bypass the constructor.
            const r = create(Realm.prototype);
            callAndWrapError(initRootRealm, unsafeRec, r, options);
            return r;
          }

          static makeCompartment() {
            // Bypass the constructor.
            const r = create(Realm.prototype);
            callAndWrapError(initCompartment, unsafeRec, r);
            return r;
          }

          // we omit the constructor because it is empty. All the personalization
          // takes place in one of the two static methods,
          // makeRootRealm/makeCompartment

          get global() {
            // this is safe against being called with strange 'this' because
            // baseGetGlobal immediately does a trademark check (it fails unless
            // this 'this' is present in a weakmap that is only populated with
            // legitimate Realm instances)
            return callAndWrapError(getRealmGlobal, this);
          }

          evaluate(x, endowments) {
            // safe against strange 'this', as above
            return callAndWrapError(realmEvaluate, this, x, endowments);
          }
        }

        defineProperties(Realm, {
          toString: {
            value: () => 'function Realm() { [shim code] }',
            writable: false,
            enumerable: false,
            configurable: true
          }
        });

        defineProperties(Realm.prototype, {
          toString: {
            value: () => '[object Realm]',
            writable: false,
            enumerable: false,
            configurable: true
          }
        });

        return Realm;
      }

      // The parentheses means we don't bind the 'buildChildRealm' name inside the
      // child's namespace. this would accept an anonymous function declaration.
      // function expression (not a declaration) so it has a completion value.
      const buildChildRealmString = cleanupSource(
        `'use strict'; (${buildChildRealm})`
      );

      function createRealmFacade(unsafeRec, BaseRealm) {
        const { unsafeEval } = unsafeRec;

        // The BaseRealm is the Realm class created by
        // the shim. It's only valid for the context where
        // it was parsed.

        // The Realm facade is a lightweight class built in the
        // context a different context, that provide a fully
        // functional Realm class using the intrisics
        // of that context.

        // This process is simplified because all methods
        // and properties on a realm instance already return
        // values using the intrinsics of the realm's context.

        // Invoke the BaseRealm constructor with Realm as the prototype.
        return unsafeEval(buildChildRealmString)(unsafeRec, BaseRealm);
      }

      // Declare shorthand functions. Sharing these declarations across modules
      // improves both consistency and minification. Unused declarations are
      // dropped by the tree shaking process.

      // we capture these, not just for brevity, but for security. If any code
      // modifies Object to change what 'assign' points to, the Realm shim would be
      // corrupted.

      const {
        assign,
        create,
        freeze,
        defineProperties, // Object.defineProperty is allowed to fail
        // silentlty, use Object.defineProperties instead.
        getOwnPropertyDescriptor,
        getOwnPropertyDescriptors,
        getOwnPropertyNames,
        getPrototypeOf,
        setPrototypeOf
      } = Object;

      const {
        apply,
        ownKeys // Reflect.ownKeys includes Symbols and unenumerables,
        // unlike Object.keys()
      } = Reflect;

      /**
       * uncurryThis() See
       * http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
       * which only lives at
       * http://web.archive.org/web/20160805225710/http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
       *
       * Performance:
       * 1. The native call is about 10x faster on FF than chrome
       * 2. The version using Function.bind() is about 100x slower on FF,
       *    equal on chrome, 2x slower on Safari
       * 3. The version using a spread and Reflect.apply() is about 10x
       *    slower on FF, equal on chrome, 2x slower on Safari
       *
       * const bind = Function.prototype.bind;
       * const uncurryThis = bind.bind(bind.call);
       */
      const uncurryThis = fn => (thisArg, ...args) => apply(fn, thisArg, args);

      // We also capture these for security: changes to Array.prototype after the
      // Realm shim runs shouldn't affect subsequent Realm operations.
      const objectHasOwnProperty = uncurryThis(
          Object.prototype.hasOwnProperty
        ),
        arrayFilter = uncurryThis(Array.prototype.filter),
        arrayPop = uncurryThis(Array.prototype.pop),
        arrayJoin = uncurryThis(Array.prototype.join),
        arrayConcat = uncurryThis(Array.prototype.concat),
        regexpTest = uncurryThis(RegExp.prototype.test),
        stringIncludes = uncurryThis(String.prototype.includes);

      // These value properties of the global object are non-writable,
      // non-configurable data properties.
      const frozenGlobalPropertyNames = [
        // *** 18.1 Value Properties of the Global Object

        'Infinity',
        'NaN',
        'undefined'
      ];

      // All the following stdlib items have the same name on both our intrinsics
      // object and on the global object. Unlike Infinity/NaN/undefined, these
      // should all be writable and configurable. This is divided into two
      // sets. The stable ones are those the shim can freeze early because
      // we don't expect anyone will want to mutate them. The unstable ones
      // are the ones that we correctly initialize to writable and
      // configurable so that they can still be replaced or removed.
      const stableGlobalPropertyNames = [
        // *** 18.2 Function Properties of the Global Object

        // 'eval', // comes from safeEval instead
        'isFinite',
        'isNaN',
        'parseFloat',
        'parseInt',

        'decodeURI',
        'decodeURIComponent',
        'encodeURI',
        'encodeURIComponent',

        // *** 18.3 Constructor Properties of the Global Object

        'Array',
        'ArrayBuffer',
        'Boolean',
        'DataView',
        // 'Date',  // Unstable
        // 'Error',  // Unstable
        'EvalError',
        'Float32Array',
        'Float64Array',
        // 'Function',  // comes from safeFunction instead
        'Int8Array',
        'Int16Array',
        'Int32Array',
        'Map',
        'Number',
        'Object',
        // 'Promise',  // Unstable
        // 'Proxy',  // Unstable
        'RangeError',
        'ReferenceError',
        // 'RegExp',  // Unstable
        'Set',
        // 'SharedArrayBuffer'  // removed on Jan 5, 2018
        'String',
        'Symbol',
        'SyntaxError',
        'TypeError',
        'Uint8Array',
        'Uint8ClampedArray',
        'Uint16Array',
        'Uint32Array',
        'URIError',
        'WeakMap',
        'WeakSet',

        // *** 18.4 Other Properties of the Global Object

        // 'Atomics', // removed on Jan 5, 2018
        'JSON',
        'Math',
        'Reflect',

        // *** Annex B

        'escape',
        'unescape'

        // *** ECMA-402

        // 'Intl'  // Unstable

        // *** ESNext

        // 'Realm' // Comes from createRealmGlobalObject()
      ];

      const unstableGlobalPropertyNames = [
        'Date',
        'Error',
        'Promise',
        'Proxy',
        'RegExp',
        'Intl'
      ];

      function getSharedGlobalDescs(unsafeGlobal) {
        const descriptors = {};

        function describe(names, writable, enumerable, configurable) {
          for (const name of names) {
            const desc = getOwnPropertyDescriptor(unsafeGlobal, name);
            if (desc) {
              // Abort if an accessor is found on the unsafe global object
              // instead of a data property. We should never get into this
              // non standard situation.
              assert(
                'value' in desc,
                `unexpected accessor on global property: ${name}`
              );

              descriptors[name] = {
                value: desc.value,
                writable,
                enumerable,
                configurable
              };
            }
          }
        }

        describe(frozenGlobalPropertyNames, false, false, false);
        // The following is correct but expensive.
        // describe(stableGlobalPropertyNames, true, false, true);
        // Instead, for now, we let these get optimized.
        //
        // TODO: We should provide an option to turn this optimization off,
        // by feeding "true, false, true" here instead.
        describe(stableGlobalPropertyNames, false, false, false);
        // These we keep replaceable and removable, because we expect
        // others, e.g., SES, may want to do so.
        describe(unstableGlobalPropertyNames, true, false, true);

        return descriptors;
      }

      // Adapted from SES/Caja - Copyright (C) 2011 Google Inc.
      // https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js
      // https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js

      /**
       * Replace the legacy accessors of Object to comply with strict mode
       * and ES2016 semantics, we do this by redefining them while in 'use strict'.
       *
       * todo: list the issues resolved
       *
       * This function can be used in two ways: (1) invoked directly to fix the primal
       * realm's Object.prototype, and (2) converted to a string to be executed
       * inside each new RootRealm to fix their Object.prototypes. Evaluation requires
       * the function to have no dependencies, so don't import anything from
       * the outside.
       */

      // todo: this file should be moved out to a separate repo and npm module.
      function repairAccessors() {
        const {
          defineProperty,
          defineProperties,
          getOwnPropertyDescriptor,
          getPrototypeOf,
          prototype: objectPrototype
        } = Object;

        // On some platforms, the implementation of these functions act as
        // if they are in sloppy mode: if they're invoked badly, they will
        // expose the global object, so we need to repair these for
        // security. Thus it is our responsibility to fix this, and we need
        // to include repairAccessors. E.g. Chrome in 2016.

        try {
          // Verify that the method is not callable.
          // eslint-disable-next-line no-restricted-properties, no-underscore-dangle
          (0, objectPrototype.__lookupGetter__)('x');
        } catch (ignore) {
          // Throws, no need to patch.
          return;
        }

        function toObject(obj) {
          if (obj === undefined || obj === null) {
            throw new TypeError(`can't convert undefined or null to object`);
          }
          return Object(obj);
        }

        function asPropertyName(obj) {
          if (typeof obj === 'symbol') {
            return obj;
          }
          return `${obj}`;
        }

        function aFunction(obj, accessor) {
          if (typeof obj !== 'function') {
            throw TypeError(`invalid ${accessor} usage`);
          }
          return obj;
        }

        defineProperties(objectPrototype, {
          __defineGetter__: {
            value: function __defineGetter__(prop, func) {
              const O = toObject(this);
              defineProperty(O, prop, {
                get: aFunction(func, 'getter'),
                enumerable: true,
                configurable: true
              });
            }
          },
          __defineSetter__: {
            value: function __defineSetter__(prop, func) {
              const O = toObject(this);
              defineProperty(O, prop, {
                set: aFunction(func, 'setter'),
                enumerable: true,
                configurable: true
              });
            }
          },
          __lookupGetter__: {
            value: function __lookupGetter__(prop) {
              let O = toObject(this);
              prop = asPropertyName(prop);
              let desc;
              while (O && !(desc = getOwnPropertyDescriptor(O, prop))) {
                O = getPrototypeOf(O);
              }
              return desc && desc.get;
            }
          },
          __lookupSetter__: {
            value: function __lookupSetter__(prop) {
              let O = toObject(this);
              prop = asPropertyName(prop);
              let desc;
              while (O && !(desc = getOwnPropertyDescriptor(O, prop))) {
                O = getPrototypeOf(O);
              }
              return desc && desc.set;
            }
          }
        });
      }

      // Adapted from SES/Caja
      // Copyright (C) 2011 Google Inc.
      // https://github.com/google/caja/blob/master/src/com/google/caja/ses/startSES.js
      // https://github.com/google/caja/blob/master/src/com/google/caja/ses/repairES5.js

      /**
       * This block replaces the original Function constructor, and the original
       * %GeneratorFunction% %AsyncFunction% and %AsyncGeneratorFunction%, with
       * safe replacements that throw if invoked.
       *
       * These are all reachable via syntax, so it isn't sufficient to just
       * replace global properties with safe versions. Our main goal is to prevent
       * access to the Function constructor through these starting points.

       * After this block is done, the originals must no longer be reachable, unless
       * a copy has been made, and funtions can only be created by syntax (using eval)
       * or by invoking a previously saved reference to the originals.
       */
      // todo: this file should be moved out to a separate repo and npm module.
      function repairFunctions() {
        const { defineProperties, getPrototypeOf, setPrototypeOf } = Object;

        /**
         * The process to repair constructors:
         * 1. Create an instance of the function by evaluating syntax
         * 2. Obtain the prototype from the instance
         * 3. Create a substitute tamed constructor
         * 4. Replace the original constructor with the tamed constructor
         * 5. Replace tamed constructor prototype property with the original one
         * 6. Replace its [[Prototype]] slot with the tamed constructor of Function
         */
        function repairFunction(name, declaration) {
          let FunctionInstance;
          try {
            // eslint-disable-next-line no-new-func
            FunctionInstance = (0, eval)(declaration);
          } catch (e) {
            if (e instanceof SyntaxError) {
              // Prevent failure on platforms where async and/or generators
              // are not supported.
              return;
            }
            // Re-throw
            throw e;
          }
          const FunctionPrototype = getPrototypeOf(FunctionInstance);
          const oldFunctionConstructor = FunctionPrototype.constructor;

          function isRunningInRealms() {
            const e = new Error().stack;
            if (!e) return true;
            return e.indexOf('eval') !== -1;
          }
          // Prevents the evaluation of source when calling constructor on the
          // prototype of functions.
          const TamedFunction = function() {
            if (isRunningInRealms()) {
              throw new TypeError('Not available');
            } else {
              return oldFunctionConstructor.apply(this, arguments);
            }
          };
          defineProperties(TamedFunction, { name: { value: name } });

          // (new Error()).constructors does not inherit from Function, because Error
          // was defined before ES6 classes. So we don't need to repair it too.

          // (Error()).constructor inherit from Function, which gets a tamed
          // constructor here.

          // todo: in an ES6 class that does not inherit from anything, what does its
          // constructor inherit from? We worry that it inherits from Function, in
          // which case instances could give access to unsafeFunction. markm says
          // we're fine: the constructor inherits from Object.prototype

          // This line replaces the original constructor in the prototype chain
          // with the tamed one. No copy of the original is peserved.
          defineProperties(FunctionPrototype, {
            constructor: { value: TamedFunction }
          });

          // This line sets the tamed constructor's prototype data property to
          // the original one.
          defineProperties(TamedFunction, {
            prototype: { value: FunctionPrototype }
          });

          if (TamedFunction !== Function.prototype.constructor) {
            // Ensures that all functions meet "instanceof Function" in a realm.
            setPrototypeOf(TamedFunction, Function.prototype.constructor);
          }
        }

        // Here, the order of operation is important: Function needs to be repaired
        // first since the other repaired constructors need to inherit from the tamed
        // Function function constructor.

        // note: this really wants to be part of the standard, because new
        // constructors may be added in the future, reachable from syntax, and this
        // list must be updated to match.

        // "plain arrow functions" inherit from Function.prototype

        repairFunction('Function', '(function(){})');
        repairFunction('GeneratorFunction', '(function*(){})');
        repairFunction('AsyncFunction', '(async function(){})');
        repairFunction('AsyncGeneratorFunction', '(async function*(){})');
      }

      // this module must never be importable outside the Realm shim itself

      // A "context" is a fresh unsafe Realm as given to us by existing platforms.
      // We need this to implement the shim. However, when Realms land for real,
      // this feature will be provided by the underlying engine instead.

      // note: in a node module, the top-level 'this' is not the global object
      // (it's *something* but we aren't sure what), however an indirect eval of
      // 'this' will be the correct global object.

      const unsafeGlobalSrc = "'use strict'; this";
      const unsafeGlobalEvalSrc = `(0, eval)("'use strict'; this")`;

      // This method is only exported for testing purposes.
      function createNewUnsafeGlobalForNode() {
        // Note that webpack and others will shim 'vm' including the method
        // 'runInNewContext', so the presence of vm is not a useful check

        // TODO: Find a better test that works with bundlers
        // eslint-disable-next-line no-new-func
        const isNode = new Function(
          'try {return this===global}catch(e){return false}'
        )();

        if (!isNode) {
          return undefined;
        }

        // eslint-disable-next-line global-require
        const vm = require('vm');

        // Use unsafeGlobalEvalSrc to ensure we get the right 'this'.
        const unsafeGlobal = vm.runInNewContext(unsafeGlobalEvalSrc);

        return unsafeGlobal;
      }

      // This method is only exported for testing purposes.
      function createNewUnsafeGlobalForBrowser() {
        if (typeof document === 'undefined') {
          return undefined;
        }
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';

        document.body.appendChild(iframe);
        const unsafeGlobal = iframe.contentWindow.eval(unsafeGlobalSrc);

        // We keep the iframe attached to the DOM because removing it
        // causes its global object to lose intrinsics, its eval()
        // function to evaluate code, etc.

        // TODO: can we remove and garbage-collect the iframes?

        return unsafeGlobal;
      }

      const getNewUnsafeGlobal = () => {
        const newUnsafeGlobalForBrowser = createNewUnsafeGlobalForBrowser();
        const newUnsafeGlobalForNode = createNewUnsafeGlobalForNode();
        if (
          (!newUnsafeGlobalForBrowser && !newUnsafeGlobalForNode) ||
          (newUnsafeGlobalForBrowser && newUnsafeGlobalForNode)
        ) {
          throw new Error('unexpected platform, unable to create Realm');
        }
        return newUnsafeGlobalForBrowser || newUnsafeGlobalForNode;
      };

      // The unsafeRec is shim-specific. It acts as the mechanism to obtain a fresh
      // set of intrinsics together with their associated eval and Function
      // evaluators. These must be used as a matched set, since the evaluators are
      // tied to a set of intrinsics, aka the "undeniables". If it were possible to
      // mix-and-match them from different contexts, that would enable some
      // attacks.
      function createUnsafeRec(unsafeGlobal, allShims = []) {
        const sharedGlobalDescs = getSharedGlobalDescs(unsafeGlobal);

        return freeze({
          unsafeGlobal,
          sharedGlobalDescs,
          unsafeEval: unsafeGlobal.eval,
          unsafeFunction: unsafeGlobal.Function,
          allShims
        });
      }

      const repairAccessorsShim = cleanupSource(
        `"use strict"; (${repairAccessors})();`
      );
      const repairFunctionsShim = cleanupSource(
        `"use strict"; (${repairFunctions})();`
      );

      // Create a new unsafeRec from a brand new context, with new intrinsics and a
      // new global object
      function createNewUnsafeRec(allShims) {
        const unsafeGlobal = getNewUnsafeGlobal();
        unsafeGlobal.eval(repairAccessorsShim);
        unsafeGlobal.eval(repairFunctionsShim);
        return createUnsafeRec(unsafeGlobal, allShims);
      }

      // Create a new unsafeRec from the current context, where the Realm shim is
      // being parsed and executed, aka the "Primal Realm"
      function createCurrentUnsafeRec() {
        const unsafeGlobal = (0, eval)(unsafeGlobalSrc);
        repairAccessors();
        repairFunctions();
        return createUnsafeRec(unsafeGlobal);
      }

      // todo: think about how this interacts with endowments, check for conflicts
      // between the names being optimized and the ones added by endowments

      /**
       * Simplified validation of indentifier names: may only contain alphanumeric
       * characters (or "$" or "_"), and may not start with a digit. This is safe
       * and does not reduces the compatibility of the shim. The motivation for
       * this limitation was to decrease the complexity of the implementation,
       * and to maintain a resonable level of performance.
       * Note: \w is equivalent [a-zA-Z_0-9]
       * See 11.6.1 Identifier Names
       */
      const identifierPattern = /^[a-zA-Z_$][\w$]*$/;

      /**
       * In JavaScript you cannot use these reserved words as variables.
       * See 11.6.1 Identifier Names
       */
      const keywords = new Set([
        // 11.6.2.1 Keywords
        'await',
        'break',
        'case',
        'catch',
        'class',
        'const',
        'continue',
        'debugger',
        'default',
        'delete',
        'do',
        'else',
        'export',
        'extends',
        'finally',
        'for',
        'function',
        'if',
        'import',
        'in',
        'instanceof',
        'new',
        'return',
        'super',
        'switch',
        'this',
        'throw',
        'try',
        'typeof',
        'var',
        'void',
        'while',
        'with',
        'yield',

        // Also reserved when parsing strict mode code
        'let',
        'static',

        // 11.6.2.2 Future Reserved Words
        'enum',

        // Also reserved when parsing strict mode code
        'implements',
        'package',
        'protected',
        'interface',
        'private',
        'public',

        // Reserved but not mentioned in specs
        'await',

        'null',
        'true',
        'false',

        'this',
        'arguments'
      ]);

      /**
       * getOptimizableGlobals()
       * What variable names might it bring into scope? These include all
       * property names which can be variable names, including the names
       * of inherited properties. It excludes symbols and names which are
       * keywords. We drop symbols safely. Currently, this shim refuses
       * service if any of the names are keywords or keyword-like. This is
       * safe and only prevent performance optimization.
       */
      function getOptimizableGlobals(safeGlobal) {
        const descs = getOwnPropertyDescriptors(safeGlobal);

        // getOwnPropertyNames does ignore Symbols so we don't need this extra check:
        // typeof name === 'string' &&
        const constants = arrayFilter(getOwnPropertyNames(descs), name => {
          // Ensure we have a valid identifier. We use regexpTest rather than
          // /../.test() to guard against the case where RegExp has been poisoned.
          if (
            name === 'eval' ||
            keywords.has(name) ||
            !regexpTest(identifierPattern, name)
          ) {
            return false;
          }

          const desc = descs[name];
          return (
            //
            // The getters will not have .writable, don't let the falsyness of
            // 'undefined' trick us: test with === false, not ! . However descriptors
            // inherit from the (potentially poisoned) global object, so we might see
            // extra properties which weren't really there. Accessor properties have
            // 'get/set/enumerable/configurable', while data properties have
            // 'value/writable/enumerable/configurable'.
            desc.configurable === false &&
            desc.writable === false &&
            //
            // Checks for data properties because they're the only ones we can
            // optimize (accessors are most likely non-constant). Descriptors can't
            // can't have accessors and value properties at the same time, therefore
            // this check is sufficient. Using explicit own property deal with the
            // case where Object.prototype has been poisoned.
            objectHasOwnProperty(desc, 'value')
          );
        });

        return constants;
      }

      /**
       * alwaysThrowHandler is a proxy handler which throws on any trap called.
       * It's made from a proxy with a get trap that throws. Its target is
       * an immutable (frozen) object and is safe to share.
       */
      const alwaysThrowHandler = new Proxy(freeze({}), {
        get(target, prop) {
          console.warn(
            `unexpected scope handler trap called: ${prop}`,
            new Error().stack
          );
          // throwTantrum(`unexpected scope handler trap called: ${prop}`);
        }
      });

      /**
       * ScopeHandler manages a Proxy which serves as the global scope for the
       * safeEvaluator operation (the Proxy is the argument of a 'with' binding).
       * As described in createSafeEvaluator(), it has several functions:
       * - allow the very first (and only the very first) use of 'eval' to map to
       *   the real (unsafe) eval function, so it acts as a 'direct eval' and can
       *    access its lexical scope (which maps to the 'with' binding, which the
       *   ScopeHandler also controls).
       * - ensure that all subsequent uses of 'eval' map to the safeEvaluator,
       *   which lives as the 'eval' property of the safeGlobal.
       * - route all other property lookups at the safeGlobal.
       * - hide the unsafeGlobal which lives on the scope chain above the 'with'.
       * - ensure the Proxy invariants despite some global properties being frozen.
       */
      function createScopeHandler(unsafeRec, safeGlobal) {
        const { unsafeGlobal, unsafeEval } = unsafeRec;

        // This flag allow us to determine if the eval() call is an done by the
        // realm's code or if it is user-land invocation, so we can react differently.
        let useUnsafeEvaluator = false;
        // This flag allow us to allow undefined assignments in non-strict mode.
        // When the counter count down to 4, we allow it once;
        let allowNonStrictModeAssignmentTimes = 0;

        return {
          // The scope handler throws if any trap other than get/set/has are run
          // (e.g. getOwnPropertyDescriptors, apply, getPrototypeOf).
          // eslint-disable-next-line no-proto
          __proto__: alwaysThrowHandler,

          allowUnsafeEvaluatorOnce() {
            useUnsafeEvaluator = true;
          },

          nonStrictModeAssignmentAllowed() {
            return allowNonStrictModeAssignmentTimes === 3;
          },

          allowNonStrictModeAssignment(times = 1) {
            allowNonStrictModeAssignmentTimes = times;
          },

          hasNonStrictModeAssigned() {
            allowNonStrictModeAssignmentTimes = Math.max(
              0,
              allowNonStrictModeAssignmentTimes - 1
            );
          },

          unsafeEvaluatorAllowed() {
            return useUnsafeEvaluator;
          },

          get(target, prop) {
            // Special treatment for eval. The very first lookup of 'eval' gets the
            // unsafe (real direct) eval, so it will get the lexical scope that uses
            // the 'with' context.
            if (prop === 'eval') {
              // test that it is true rather than merely truthy
              if (useUnsafeEvaluator === true) {
                // revoke before use
                useUnsafeEvaluator = false;
                return unsafeEval;
              }
              return target.eval;
            }

            // todo: shim integrity, capture Symbol.unscopables
            if (prop === Symbol.unscopables) {
              // Safe to return a primal realm Object here because the only code that
              // can do a get() on a non-string is the internals of with() itself,
              // and the only thing it does is to look for properties on it. User
              // code cannot do a lookup on non-strings.
              return undefined;
            }

            // Properties of the global.
            if (prop in target) {
              return target[prop];
            }

            // Prevent the lookup for other properties.
            return undefined;
          },

          // eslint-disable-next-line class-methods-use-this
          set(target, prop, value) {
            // todo: allow modifications when target.hasOwnProperty(prop) and it
            // is writable, assuming we've already rejected overlap (see
            // createSafeEvaluatorFactory.factory). This TypeError gets replaced with
            // target[prop] = value
            if (objectHasOwnProperty(target, prop)) {
              // todo: shim integrity: TypeError, String
              throw new TypeError(`do not modify endowments like ${String(prop)}`);
            }

            safeGlobal[prop] = value;

            // Return true after successful set.
            return true;
          },

          // we need has() to return false for some names to prevent the lookup  from
          // climbing the scope chain and eventually reaching the unsafeGlobal
          // object, which is bad.

          // note: unscopables! every string in Object[Symbol.unscopables]

          // todo: we'd like to just have has() return true for everything, and then
          // use get() to raise a ReferenceError for anything not on the safe global.
          // But we want to be compatible with ReferenceError in the normal case and
          // the lack of ReferenceError in the 'typeof' case. Must either reliably
          // distinguish these two cases (the trap behavior might be different), or
          // we rely on a mandatory source-to-source transform to change 'typeof abc'
          // to XXX. We already need a mandatory parse to prevent the 'import',
          // since it's a special form instead of merely being a global variable/

          // note: if we make has() return true always, then we must implement a
          // set() trap to avoid subverting the protection of strict mode (it would
          // accept assignments to undefined globals, when it ought to throw
          // ReferenceError for such assignments)

          has(target, prop) {
            if (this.nonStrictModeAssignmentAllowed()) {
              return true;
            }
            // proxies stringify 'prop', so no TOCTTOU danger here

            // unsafeGlobal: hide all properties of unsafeGlobal at the
            // expense of 'typeof' being wrong for those properties. For
            // example, in the browser, evaluating 'document = 3', will add
            // a property to safeGlobal instead of throwing a
            // ReferenceError.
            if (prop === 'eval' || prop in target || prop in unsafeGlobal) {
              return true;
            }

            return false;
          }
        };
      }

      // https://www.ecma-international.org/ecma-262/9.0/index.html#sec-html-like-comments

      // The shim cannot correctly emulate a direct eval as explained at
      // https://github.com/Agoric/realms-shim/issues/12
      // Without rejecting apparent direct eval syntax, we would
      // accidentally evaluate these with an emulation of indirect eval. Tp
      // prevent future compatibility problems, in shifting from use of the
      // shim to genuine platform support for the proposal, we should
      // instead statically reject code that seems to contain a direct eval
      // expression.
      //
      // As with the dynamic import expression, to avoid a full parse, we do
      // this approximately with a regexp, that will also reject strings
      // that appear safely in comments or strings. Unlike dynamic import,
      // if we miss some, this only creates future compat problems, not
      // security problems. Thus, we are only trying to catch innocent
      // occurrences, not malicious one. In particular, `(eval)(...)` is
      // direct eval syntax that would not be caught by the following regexp.

      const someDirectEvalPattern = /\beval\s*(?:\(|\/[/*])/;

      function rejectSomeDirectEvalExpressions(s) {
        const index = s.search(someDirectEvalPattern);
        if (index !== -1) {
          const linenum = s.slice(0, index).split('\n').length; // more or less
          throw new SyntaxError(
            `possible direct eval expression rejected around line ${linenum}`
          );
        }
      }

      function rejectDangerousSources(s) {
        // rejectHtmlComments(s);
        // rejectImportExpressions(s);
        rejectSomeDirectEvalExpressions(s);
      }

      // Portions adapted from V8 - Copyright 2016 the V8 project authors.

      function buildOptimizer(constants) {
        // No need to build an oprimizer when there are no constants.
        if (constants.length === 0) return '';
        // Use 'this' to avoid going through the scope proxy, which is unecessary
        // since the optimizer only needs references to the safe global.
        return `const {${arrayJoin(constants, ',')}} = this;`;
      }

      function createScopedEvaluatorFactory(unsafeRec, constants) {
        const { unsafeFunction } = unsafeRec;

        const optimizer = buildOptimizer(constants);

        // Create a function in sloppy mode, so that we can use 'with'. It returns
        // a function in strict mode that evaluates the provided code using direct
        // eval, and thus in strict mode in the same scope. We must be very careful
        // to not create new names in this scope

        // 1: we use 'with' (around a Proxy) to catch all free variable names. The
        // first 'arguments[0]' holds the Proxy which safely wraps the safeGlobal
        // 2: 'optimizer' catches common variable names for speed
        // 3: The inner strict function is effectively passed two parameters:
        //    a) its arguments[0] is the source to be directly evaluated.
        //    b) its 'this' is the this binding seen by the code being
        //       directly evaluated.

        // everything in the 'optimizer' string is looked up in the proxy
        // (including an 'arguments[0]', which points at the Proxy). 'function' is
        // a keyword, not a variable, so it is not looked up. then 'eval' is looked
        // up in the proxy, that's the first time it is looked up after
        // useUnsafeEvaluator is turned on, so the proxy returns the real the
        // unsafeEval, which satisfies the IsDirectEvalTrap predicate, so it uses
        // the direct eval and gets the lexical scope. The second 'arguments[0]' is
        // looked up in the context of the inner function. The *contents* of
        // arguments[0], because we're using direct eval, are looked up in the
        // Proxy, by which point the useUnsafeEvaluator switch has been flipped
        // back to 'false', so any instances of 'eval' in that string will get the
        // safe evaluator.

        return unsafeFunction(`
    with (arguments[0]) {
      ${optimizer}
      return function() {
        'use strict';
        return eval(arguments[0]);
      };
    }
  `);
      }

      function createSafeEvaluatorFactory(unsafeRec, safeGlobal) {
        const { unsafeFunction } = unsafeRec;

        const scopeHandler = createScopeHandler(unsafeRec, safeGlobal);
        const constants = getOptimizableGlobals(safeGlobal);
        const scopedEvaluatorFactory = createScopedEvaluatorFactory(
          unsafeRec,
          constants
        );

        function factory(endowments = {}, nonStrict = false) {
          // todo (shim limitation): scan endowments, throw error if endowment
          // overlaps with the const optimization (which would otherwise
          // incorrectly shadow endowments), or if endowments includes 'eval'. Also
          // prohibit accessor properties (to be able to consistently explain
          // things in terms of shimming the global lexical scope).
          // writeable-vs-nonwritable == let-vs-const, but there's no
          // global-lexical-scope equivalent of an accessor, outside what we can
          // explain/spec
          const scopeTarget = create(
            safeGlobal,
            getOwnPropertyDescriptors(endowments)
          );
          const scopeProxy = new Proxy(scopeTarget, scopeHandler);
          const scopedEvaluator = apply(scopedEvaluatorFactory, safeGlobal, [
            scopeProxy
          ]);

          // We use the the concise method syntax to create an eval without a
          // [[Construct]] behavior (such that the invocation "new eval()" throws
          // TypeError: eval is not a constructor"), but which still accepts a
          // 'this' binding.
          const safeEval = {
            eval(src) {
              src = `${src}`;
              rejectDangerousSources(src);
              scopeHandler.allowUnsafeEvaluatorOnce();
              if (nonStrict && !scopeHandler.nonStrictModeAssignmentAllowed()) {
                scopeHandler.allowNonStrictModeAssignment(5);
              }
              let err;
              try {
                // Ensure that "this" resolves to the safe global.
                return apply(scopedEvaluator, safeGlobal, [src]);
              } catch (e) {
                // stash the child-code error in hopes of debugging the internal failure
                err = e;
                throw e;
              } finally {
                scopeHandler.hasNonStrictModeAssigned();
                // belt and suspenders: the proxy switches this off immediately after
                // the first access, but if that's not the case we abort.
                if (scopeHandler.unsafeEvaluatorAllowed()) {
                  throwTantrum('handler did not revoke useUnsafeEvaluator', err);
                }
              }
            }
          }.eval;

          // safeEval's prototype is currently the primal realm's
          // Function.prototype, which we must not let escape. To make 'eval
          // instanceof Function' be true inside the realm, we need to point it at
          // the RootRealm's value.

          // Ensure that eval from any compartment in a root realm is an instance
          // of Function in any compartment of the same root realm.
          setPrototypeOf(safeEval, unsafeFunction.prototype);

          assert(getPrototypeOf(safeEval).constructor !== Function, 'hide Function');
          assert(
            getPrototypeOf(safeEval).constructor !== unsafeFunction,
            'hide unsafeFunction'
          );

          // note: be careful to not leak our primal Function.prototype by setting
          // this to a plain arrow function. Now that we have safeEval, use it.
          defineProperties(safeEval, {
            toString: {
              // We break up the following literal string so that an
              // apparent direct eval syntax does not appear in this
              // file. Thus, we avoid rejection by the overly eager
              // rejectDangerousSources.
              value: safeEval("() => 'function eval' + '() { [shim code] }'"),
              writable: false,
              enumerable: false,
              configurable: true
            }
          });

          return safeEval;
        }

        return factory;
      }

      function createSafeEvaluator(safeEvaluatorFactory) {
        return safeEvaluatorFactory();
      }

      function createSafeEvaluatorWhichTakesEndowments(safeEvaluatorFactory) {
        return (x, endowments) => safeEvaluatorFactory(endowments)(x);
      }

      /**
       * A safe version of the native Function which relies on
       * the safety of evalEvaluator for confinement.
       */
      function createFunctionEvaluator(
        unsafeRec,
        safeEvalFactory,
        realmGlobal
      ) {
        const { unsafeFunction, unsafeGlobal } = unsafeRec;

        const safeEvalStrict = safeEvalFactory(undefined, false);
        const safeEvalNonStrict = safeEvalFactory(undefined, true);

        const safeFunction = function Function(...params) {
          const functionBody = `${arrayPop(params) || ''}`;
          let functionParams = `${arrayJoin(params, ',')}`;
          if (!regexpTest(/^[\w\s,]*$/, functionParams)) {
            throw new unsafeGlobal.SyntaxError(
              'shim limitation: Function arg must be simple ASCII identifiers, possibly separated by commas: no default values, pattern matches, or non-ASCII parameter names'
            );
            // this protects against Matt Austin's clever attack:
            // Function("arg=`", "/*body`){});({x: this/**/")
            // which would turn into
            //     (function(arg=`
            //     /*``*/){
            //      /*body`){});({x: this/**/
            //     })
            // which parses as a default argument of `\n/*``*/){\n/*body` , which
            // is a pair of template literals back-to-back (so the first one
            // nominally evaluates to the parser to use on the second one), which
            // can't actually execute (because the first literal evals to a string,
            // which can't be a parser function), but that doesn't matter because
            // the function is bypassed entirely. When that gets evaluated, it
            // defines (but does not invoke) a function, then evaluates a simple
            // {x: this} expression, giving access to the safe global.
          }

          // Is this a real functionBody, or is someone attempting an injection
          // attack? This will throw a SyntaxError if the string is not actually a
          // function body. We coerce the body into a real string above to prevent
          // someone from passing an object with a toString() that returns a safe
          // string the first time, but an evil string the second time.
          // eslint-disable-next-line no-new, new-cap
          new unsafeFunction(functionBody);

          if (stringIncludes(functionParams, ')')) {
            // If the formal parameters string include ) - an illegal
            // character - it may make the combined function expression
            // compile. We avoid this problem by checking for this early on.

            // note: v8 throws just like this does, but chrome accepts
            // e.g. 'a = new Date()'
            throw new unsafeGlobal.SyntaxError(
              'shim limitation: Function arg string contains parenthesis'
            );
            // todo: shim integrity threat if they change SyntaxError
          }

          // todo: check to make sure this .length is safe. markm says safe.
          if (functionParams.length > 0) {
            // If the formal parameters include an unbalanced block comment, the
            // function must be rejected. Since JavaScript does not allow nested
            // comments we can include a trailing block comment to catch this.
            functionParams += '\n/*``*/';
          }

          const src = `(function(${functionParams}){\n${functionBody}\n})`;
          const isStrict = !!/^\s*['|"]use strict['|"]/.exec(functionBody);
          if (isStrict) {
            return safeEvalStrict(src);
          }
          const fn = safeEvalNonStrict(src);
          if (isStrict) {
            return fn;
          }
          // we fix the `this` binding in Function().
          const bindThis = `(function (globalThis, f) {
  function f2() {
    return Reflect.apply(f, this || globalThis, arguments);
  }
  f2.toString = () => f.toString();
  return f2;
})`;
          const fnWithThis = safeEvalStrict(bindThis)(realmGlobal, fn);
          return fnWithThis;
        };

        // Ensure that Function from any compartment in a root realm can be used
        // with instance checks in any compartment of the same root realm.
        setPrototypeOf(safeFunction, unsafeFunction.prototype);

        assert(
          getPrototypeOf(safeFunction).constructor !== Function,
          'hide Function'
        );
        assert(
          getPrototypeOf(safeFunction).constructor !== unsafeFunction,
          'hide unsafeFunction'
        );

        defineProperties(safeFunction, {
          // Ensure that any function created in any compartment in a root realm is an
          // instance of Function in any compartment of the same root ralm.
          prototype: { value: unsafeFunction.prototype },

          // Provide a custom output without overwriting the
          // Function.prototype.toString which is called by some third-party
          // libraries.
          toString: {
            value: safeEvalStrict("() => 'function Function() { [shim code] }'"),
            writable: false,
            enumerable: false,
            configurable: true
          }
        });

        return safeFunction;
      }

      // Mimic private members on the realm instances.
      // We define it in the same module and do not export it.
      const RealmRecForRealmInstance = new WeakMap();

      function getRealmRecForRealmInstance(realm) {
        // Detect non-objects.
        assert(Object(realm) === realm, 'bad object, not a Realm instance');
        // Realm instance has no realmRec. Should not proceed.
        assert(RealmRecForRealmInstance.has(realm), 'Realm instance has no record');

        return RealmRecForRealmInstance.get(realm);
      }

      function registerRealmRecForRealmInstance(realm, realmRec) {
        // Detect non-objects.
        assert(Object(realm) === realm, 'bad object, not a Realm instance');
        // Attempt to change an existing realmRec on a realm instance. Should not proceed.
        assert(
          !RealmRecForRealmInstance.has(realm),
          'Realm instance already has a record'
        );

        RealmRecForRealmInstance.set(realm, realmRec);
      }

      // Initialize the global variables for the new Realm.
      function setDefaultBindings(safeGlobal, safeEval, safeFunction) {
        defineProperties(safeGlobal, {
          eval: {
            value: safeEval,
            writable: true,
            configurable: true
          },
          Function: {
            value: safeFunction,
            writable: true,
            configurable: true
          }
        });
      }

      function createRealmRec(unsafeRec) {
        const { sharedGlobalDescs, unsafeGlobal } = unsafeRec;

        const safeGlobal = create(unsafeGlobal.Object.prototype, sharedGlobalDescs);

        const safeEvaluatorFactory = createSafeEvaluatorFactory(
          unsafeRec,
          safeGlobal
        );
        const safeEval = createSafeEvaluator(safeEvaluatorFactory);
        const safeEvalWhichTakesEndowments = createSafeEvaluatorWhichTakesEndowments(
          safeEvaluatorFactory
        );
        const safeFunction = createFunctionEvaluator(
          unsafeRec,
          safeEvaluatorFactory,
          safeGlobal
        );

        setDefaultBindings(safeGlobal, safeEval, safeFunction);

        const realmRec = freeze({
          safeGlobal,
          safeEval,
          safeEvalWhichTakesEndowments,
          safeFunction
        });

        return realmRec;
      }

      /**
       * A root realm uses a fresh set of new intrinics. Here we first create
       * a new unsafe record, which inherits the shims. Then we proceed with
       * the creation of the realm record, and we apply the shims.
       */
      function initRootRealm(parentUnsafeRec, self, options) {
        // note: 'self' is the instance of the Realm.

        // todo: investigate attacks via Array.species
        // todo: this accepts newShims='string', but it should reject that
        const { shims: newShims } = options;
        const allShims = arrayConcat(parentUnsafeRec.allShims, newShims);

        // The unsafe record is created already repaired.
        const unsafeRec = createNewUnsafeRec(allShims);

        // eslint-disable-next-line no-use-before-define
        const Realm = createRealmFacade(unsafeRec, BaseRealm);

        // Add a Realm descriptor to sharedGlobalDescs, so it can be defined onto the
        // safeGlobal like the rest of the globals.
        unsafeRec.sharedGlobalDescs.Realm = {
          value: Realm,
          writable: true,
          configurable: true
        };

        // Creating the realmRec provides the global object, eval() and Function()
        // to the realm.
        const realmRec = createRealmRec(unsafeRec);

        // Apply all shims in the new RootRealm. We don't do this for compartments.
        const { safeEvalWhichTakesEndowments } = realmRec;
        for (const shim of allShims) {
          safeEvalWhichTakesEndowments(shim);
        }

        // The realmRec acts as a private field on the realm instance.
        registerRealmRecForRealmInstance(self, realmRec);
      }

      /**
       * A compartment shares the intrinsics of its root realm. Here, only a
       * realmRec is necessary to hold the global object, eval() and Function().
       */
      function initCompartment(unsafeRec, self) {
        // note: 'self' is the instance of the Realm.

        const realmRec = createRealmRec(unsafeRec);

        // The realmRec acts as a private field on the realm instance.
        registerRealmRecForRealmInstance(self, realmRec);
      }

      function getRealmGlobal(self) {
        const { safeGlobal } = getRealmRecForRealmInstance(self);
        return safeGlobal;
      }

      function realmEvaluate(self, x, endowments = {}) {
        // todo: don't pass in primal-realm objects like {}, for safety. OTOH its
        // properties are copied onto the new global 'target'.
        // todo: figure out a way to membrane away the contents to safety.
        const { safeEvalWhichTakesEndowments } = getRealmRecForRealmInstance(self);
        return safeEvalWhichTakesEndowments(x, endowments);
      }

      const BaseRealm = {
        initRootRealm,
        initCompartment,
        getRealmGlobal,
        realmEvaluate
      };

      // Create the current unsafeRec from the current "primal" environment (the realm
      // where the Realm shim is loaded and executed).
      const currentUnsafeRec = createCurrentUnsafeRec();

      /**
       * The "primal" realm class is defined in the current "primal" environment,
       * and is part of the shim. There is no need to facade this class via evaluation
       * because both share the same intrinsics.
       */
      const Realm = buildChildRealm(currentUnsafeRec, BaseRealm);

      return Realm;

    }));

    });

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

    const MessageCenterEvent = 'Holoflows-Kit MessageCenter';
    const newMessage = (key, data) => new CustomEvent(MessageCenterEvent, { detail: { data, key } });
    const noop = () => { };
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
            this.eventEmitter = new mitt();
            this.listener = (request) => {
                let { key, data, instanceKey } = request.detail || request;
                // Message is not for us
                if (this.instanceKey !== (instanceKey || ''))
                    return;
                if (this.writeToConsole) {
                    console.log(`%cReceive%c %c${key.toString()}`, 'background: rgba(0, 255, 255, 0.6); color: black; padding: 0px 6px; border-radius: 4px;', '', 'text-decoration: underline', data);
                }
                this.eventEmitter.emit(key, data);
            };
            this.send = this.emit;
            /**
             * Should MessageCenter prints all messages to console?
             */
            this.writeToConsole = false;
            if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
                // Fired when a message is sent from either an extension process (by runtime.sendMessage)
                // or a content script (by tabs.sendMessage).
                browser.runtime.onMessage.addListener(this.listener);
            }
            if (typeof document !== 'undefined' && document.addEventListener) {
                document.addEventListener(MessageCenterEvent, this.listener);
            }
        }
        /**
         * Listen to an event
         * @param event - Name of the event
         * @param handler - Handler of the event
         */
        on(event, handler) {
            this.eventEmitter.on(event, handler);
        }
        /**
         * Send message to local or other instance of extension
         * @param key - Key of the message
         * @param data - Data of the message
         * @param alsoSendToDocument - ! Send message to document. This may leaks secret! Only open in localhost!
         */
        emit(key, data, alsoSendToDocument = location.hostname === 'localhost') {
            if (this.writeToConsole) {
                console.log(`%cSend%c %c${key.toString()}`, 'background: rgba(0, 255, 255, 0.6); color: black; padding: 0px 6px; border-radius: 4px;', '', 'text-decoration: underline', data);
            }
            const msg = { data, key, instanceKey: this.instanceKey || '' };
            if (typeof browser !== 'undefined') {
                if (browser.runtime && browser.runtime.sendMessage) {
                    browser.runtime.sendMessage(msg).catch(noop);
                }
                if (browser.tabs) {
                    // Send message to Content Script
                    browser.tabs.query({ discarded: false }).then(tabs => {
                        for (const tab of tabs) {
                            if (tab.id)
                                browser.tabs.sendMessage(tab.id, msg).catch(noop);
                        }
                    });
                }
            }
            if (alsoSendToDocument && typeof document !== 'undefined' && document.dispatchEvent) {
                document.dispatchEvent(newMessage(key, data));
            }
        }
    }

    /**
     * This file (AsyncCall) is under MIT License
     *
     * This is a light implementation of JSON RPC 2.0
     *
     * https://www.jsonrpc.org/specification
     */
    /**
     * Serialization implementation that do nothing
     */
    const NoSerialization = {
        async serialization(from) {
            return from;
        },
        async deserialization(serialized) {
            return serialized;
        },
    };
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
        const { serializer, key, strict, log, parameterStructures } = {
            serializer: NoSerialization,
            key: 'default-jsonrpc',
            strict: false,
            log: true,
            parameterStructures: 'by-position',
            ...options,
        };
        const message = options.messageChannel || new MessageCenter();
        const { methodNotFound: banMethodNotFound = false, noUndefined: noUndefinedKeeping = false, unknownMessage: banUnknownMessage = false, } = typeof strict === 'boolean'
            ? strict
                ? { methodNotFound: true, unknownMessage: true, noUndefined: true }
                : { methodNotFound: false, unknownMessage: false, noUndefined: false }
            : strict;
        const { beCalled: logBeCalled = true, localError: logLocalError = true, remoteError: logRemoteError = true, type: logType = 'pretty', } = typeof log === 'boolean'
            ? log
                ? { beCalled: true, localError: true, remoteError: true, type: 'pretty' }
                : { beCalled: false, localError: false, remoteError: false, type: 'basic' }
            : log;
        const requestContext = new Map();
        async function onRequest(data) {
            let frameworkStack = '';
            try {
                // ? We're not implementing any JSON RPC extension. So let it to be undefined.
                const executor = data.method.startsWith('rpc.')
                    ? undefined
                    : implementation[data.method];
                if (!executor) {
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
                    const promise = executor(...args);
                    if (logBeCalled)
                        logType === 'basic'
                            ? console.log(`${key}.${data.method}(${[...args].toString()}) @${data.id}`)
                            : console.log(`${key}.%c${data.method}%c(${args.map(() => '%o').join(', ')}%c)\n%o %c@${data.id}`, 'color: #d2c057', '', ...args, '', promise, 'color: gray; font-style: italic;');
                    return new SuccessResponse(data.id, await promise, !!noUndefinedKeeping);
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
        }
        async function onResponse(data) {
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
        }
        message.on(key, async (_) => {
            let data;
            let result = undefined;
            try {
                data = await serializer.deserialization(_);
                if (isJSONRPCObject(data)) {
                    result = await handleSingleMessage(data);
                    if (result)
                        await send(result);
                }
                else if (Array.isArray(data) && data.every(isJSONRPCObject) && data.length !== 0) {
                    const result = await Promise.all(data.map(handleSingleMessage));
                    // ? Response
                    if (data.every(x => x === undefined))
                        return;
                    await send(result.filter(x => x));
                }
                else {
                    if (banUnknownMessage) {
                        await send(ErrorResponse.InvalidRequest(data.id || null));
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
            async function send(res) {
                if (Array.isArray(res)) {
                    const reply = res.map(x => x).filter(x => x.id !== undefined);
                    if (reply.length === 0)
                        return;
                    message.emit(key, await serializer.serialization(reply));
                }
                else {
                    if (!res)
                        return;
                    // ? This is a Notification, we MUST not return it.
                    if (res.id === undefined)
                        return;
                    message.emit(key, await serializer.serialization(res));
                }
            }
        });
        return new Proxy({}, {
            get(target, method, receiver) {
                let stack = removeStackHeader(new Error().stack);
                return (...params) => new Promise((resolve, reject) => {
                    if (typeof method !== 'string')
                        return reject('Only string can be keys');
                    if (method.startsWith('rpc.'))
                        return reject('You cannot call JSON RPC internal methods directly');
                    const id = Math.random()
                        .toString(36)
                        .slice(2);
                    const req = parameterStructures === 'by-name' && params.length === 1 && isObject(params[0])
                        ? new Request$1(id, method, params[0])
                        : new Request$1(id, method, params);
                    serializer.serialization(req).then(data => {
                        message.emit(key, data);
                        requestContext.set(id, {
                            f: [resolve, reject],
                            stack,
                        });
                    }, reject);
                });
            },
        });
        async function handleSingleMessage(data) {
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
        }
    }
    const jsonrpc = '2.0';
    class Request$1 {
        constructor(id, method, params) {
            this.id = id;
            this.method = method;
            this.params = params;
            this.jsonrpc = '2.0';
            return { id, method, params, jsonrpc };
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
        if (!isObject(data))
            return false;
        if (!hasKey(data, 'jsonrpc'))
            return false;
        if (data.jsonrpc !== '2.0')
            return false;
        if (hasKey(data, 'params')) {
            const params = data.params;
            if (!Array.isArray(params) && !isObject(params))
                return false;
        }
        return true;
    }
    function isObject(params) {
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

    /**
     * Used for keep reference to browser.runtime.onMessage
     */
    const TwoWayMessagePromiseResolver = new Map();
    /**
     * To store listener for Host dispatched events.
     */
    const EventPools = {
        'browser.webNavigation.onCommitted': new Map(),
        'browser.runtime.onMessage': new Map(),
    };
    /**
     * Dispatch a normal event (that not have a "response").
     * Like browser.webNavigation.onCommitted
     */
    async function dispatchNormalEvent(event, toExtensionID, ...args) {
        if (!EventPools[event])
            return;
        for (const [extensionID, fns] of EventPools[event].entries()) {
            if (Array.isArray(toExtensionID) && toExtensionID.indexOf(extensionID) === -1)
                continue;
            if (!Array.isArray(toExtensionID) && toExtensionID !== extensionID && toExtensionID !== '*')
                continue;
            for (const f of fns) {
                try {
                    f(...args);
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
    }
    /**
     * Create a `EventObject<ListenerType>` object.
     *
     * Can be set on browser.webNavigation.onCommitted etc...
     */
    function createEventListener(extensionID, event) {
        if (!EventPools[event].has(extensionID)) {
            EventPools[event].set(extensionID, new Set());
        }
        const pool = EventPools[event].get(extensionID);
        const handler = {
            addListener(callback) {
                if (typeof callback !== 'function')
                    throw new TypeError('Listener must be function');
                pool.add(callback);
            },
            removeListener(callback) {
                pool.delete(callback);
            },
            hasListener(listener) {
                return pool.has(listener);
            },
        };
        return handler;
    }

    function deepClone(obj) {
        // todo: change another impl plz.
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Create browser.runtime.sendMessage() function
     * @param extensionID
     */
    function createRuntimeSendMessage(extensionID) {
        return function () {
            let toExtensionID, message;
            if (arguments.length === 1) {
                toExtensionID = extensionID;
                message = arguments[0];
            }
            else if (arguments.length === 2) {
                toExtensionID = arguments[0];
                message = arguments[1];
            }
            else {
                toExtensionID = '';
            }
            return sendMessageWithResponse(extensionID, toExtensionID, null, message);
        };
    }
    function sendMessageWithResponse(extensionID, toExtensionID, tabId, message) {
        return new Promise((resolve, reject) => {
            const messageID = Math.random().toString();
            Host.sendMessage(extensionID, toExtensionID, tabId, messageID, {
                data: message,
                response: false,
            }).catch(e => {
                reject(e);
                TwoWayMessagePromiseResolver.delete(messageID);
            });
            TwoWayMessagePromiseResolver.set(messageID, [resolve, reject]);
        });
    }
    /**
     * Message handler of normal message
     */
    function onNormalMessage(message, sender, toExtensionID, extensionID, messageID) {
        const fns = EventPools['browser.runtime.onMessage'].get(toExtensionID);
        if (!fns)
            return;
        let responseSend = false;
        for (const fn of fns) {
            try {
                // ? dispatch message
                const result = fn(deepClone(message), deepClone(sender), sendResponseDeprecated);
                if (result === undefined) {
                    // ? do nothing
                }
                else if (typeof result === 'boolean') {
                    // ! deprecated path !
                }
                else if (typeof result === 'object' && typeof result.then === 'function') {
                    // ? response the answer
                    result.then((data) => {
                        if (data === undefined || responseSend)
                            return;
                        responseSend = true;
                        Host.sendMessage(toExtensionID, extensionID, sender.tab.id, messageID, { data, response: true });
                    });
                }
            }
            catch (e) {
                console.error(e);
            }
        }
    }
    function sendResponseDeprecated() {
        throw new Error('Returning a Promise is the preferred way' +
            ' to send a reply from an onMessage/onMessageExternal listener, ' +
            'as the sendResponse will be removed from the specs ' +
            '(See https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)');
    }

    function decodeStringOrBlob(val) {
        if (val.type === 'text')
            return val.content;
        if (val.type === 'blob')
            return new Blob([val.content], { type: val.mimeType });
        if (val.type === 'array buffer') {
            return base64DecToArr(val.content).buffer;
        }
        return null;
    }
    async function encodeStringOrBlob(val) {
        if (typeof val === 'string')
            return { type: 'text', content: val };
        if (val instanceof Blob) {
            const buffer = new Uint8Array(await new Response(val).arrayBuffer());
            return { type: 'blob', mimeType: val.type, content: base64EncArr(buffer) };
        }
        if (val instanceof ArrayBuffer) {
            return { type: 'array buffer', content: base64EncArr(new Uint8Array(val)) };
        }
        throw new TypeError('Invalid data');
    }
    //#region // ? Code from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Appendix.3A_Decode_a_Base64_string_to_Uint8Array_or_ArrayBuffer
    function b64ToUint6(nChr) {
        return nChr > 64 && nChr < 91
            ? nChr - 65
            : nChr > 96 && nChr < 123
                ? nChr - 71
                : nChr > 47 && nChr < 58
                    ? nChr + 4
                    : nChr === 43
                        ? 62
                        : nChr === 47
                            ? 63
                            : 0;
    }
    function base64DecToArr(sBase64, nBlockSize) {
        var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ''), nInLen = sB64Enc.length, nOutLen = nBlockSize ? Math.ceil(((nInLen * 3 + 1) >>> 2) / nBlockSize) * nBlockSize : (nInLen * 3 + 1) >>> 2, aBytes = new Uint8Array(nOutLen);
        for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
            nMod4 = nInIdx & 3;
            nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << (18 - 6 * nMod4);
            if (nMod4 === 3 || nInLen - nInIdx === 1) {
                for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                    aBytes[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255;
                }
                nUint24 = 0;
            }
        }
        return aBytes;
    }
    function uint6ToB64(nUint6) {
        return nUint6 < 26
            ? nUint6 + 65
            : nUint6 < 52
                ? nUint6 + 71
                : nUint6 < 62
                    ? nUint6 - 4
                    : nUint6 === 62
                        ? 43
                        : nUint6 === 63
                            ? 47
                            : 65;
    }
    function base64EncArr(aBytes) {
        var eqLen = (3 - (aBytes.length % 3)) % 3, sB64Enc = '';
        for (var nMod3, nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
            nMod3 = nIdx % 3;
            /* Uncomment the following line in order to split the output in lines 76-character long: */
            /*
          if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
          */
            nUint24 |= aBytes[nIdx] << ((16 >>> nMod3) & 24);
            if (nMod3 === 2 || aBytes.length - nIdx === 1) {
                sB64Enc += String.fromCharCode(uint6ToB64((nUint24 >>> 18) & 63), uint6ToB64((nUint24 >>> 12) & 63), uint6ToB64((nUint24 >>> 6) & 63), uint6ToB64(nUint24 & 63));
                nUint24 = 0;
            }
        }
        return eqLen === 0 ? sB64Enc : sB64Enc.substring(0, sB64Enc.length - eqLen) + (eqLen === 1 ? '=' : '==');
    }

    const { CLOSED, CLOSING, CONNECTING, OPEN } = WebSocket;
    const WebSocketID = new Map();
    function getID(instance) {
        return WebSocketID.get(instance);
    }
    function getInstance(id) {
        return Array.from(WebSocketID).find(([x, y]) => y === id)[0];
    }
    const WebSocketReadyState = new Map();
    function createWebSocket(extensionID) {
        /**
         * See: https://html.spec.whatwg.org/multipage/web-sockets.html
         */
        class WS extends EventTarget {
            //#endregion
            constructor(url, protocols = []) {
                super();
                this.url = url;
                this.CLOSED = CLOSED;
                this.CONNECTING = CONNECTING;
                this.OPEN = OPEN;
                this.CLOSING = CLOSING;
                this.bufferedAmount = 0;
                this.extensions = '';
                Host['websocket.create'](extensionID, url).then(onOpen.bind(this), onWebSocketError.bind(null, 0, ''));
            }
            get binaryType() {
                return 'blob';
            }
            set binaryType(val) {
                // Todo
            }
            get readyState() {
                return WebSocketReadyState.get(this);
            }
            close(code = 1005, reason = '') {
                Host['websocket.close'](extensionID, WebSocketID.get(this), code, reason).then(onWebSocketClose.bind(this, getID(this), code, reason, true));
                WebSocketReadyState.set(this, CLOSING);
            }
            send(message) {
                encodeStringOrBlob(message).then(data => {
                    Host['websocket.send'](extensionID, WebSocketID.get(this), data);
                });
            }
        }
        //#region Constants
        WS.CLOSED = CLOSED;
        WS.CONNECTING = CONNECTING;
        WS.OPEN = OPEN;
        WS.CLOSING = CLOSING;
        const constants = {
            CLOSED: { configurable: false, writable: false, enumerable: true, value: CLOSED },
            CLOSING: { configurable: false, writable: false, enumerable: true, value: CLOSING },
            CONNECTING: { configurable: false, writable: false, enumerable: true, value: CONNECTING },
            OPEN: { configurable: false, writable: false, enumerable: true, value: OPEN },
        };
        Object.defineProperties(WS, constants);
        Object.defineProperties(WS.prototype, constants);
        return WS;
    }
    function onWebSocketClose(websocketID, code, reason, wasClean) {
        const ws = getInstance(websocketID);
        const e = new CloseEvent('close', { reason, wasClean, code });
        WebSocketReadyState.set(ws, CLOSED);
        WebSocketID.delete(ws);
        if (typeof ws.onclose === 'function')
            ws.onclose(e);
        ws.dispatchEvent(e);
    }
    function onOpen(websocketID) {
        const e = new Event('open');
        WebSocketReadyState.set(this, OPEN);
        WebSocketID.set(this, websocketID);
        if (typeof this.onopen === 'function')
            this.onopen(e);
        this.dispatchEvent(e);
    }
    function onWebSocketError(websocketID, reason) {
        const ws = getInstance(websocketID);
        const e = new Event('error');
        WebSocketReadyState.set(ws, CLOSED);
        if (typeof ws.onerror === 'function')
            ws.onerror(e);
        ws.dispatchEvent(e);
    }
    function onWebSocketMessage(webSocketID, message) {
        const ws = getInstance(webSocketID);
        const e = new MessageEvent('message', { data: decodeStringOrBlob(message) });
        if (typeof ws.onmessage === 'function')
            ws.onmessage(e);
        ws.dispatchEvent(e);
    }

    /// <reference path="../node_modules/web-ext-types/global/index.d.ts" />
    const key = 'holoflowsjsonrpc';
    const isDebug = location.href === 'http://localhost:5000/';
    class iOSWebkitChannel {
        constructor() {
            this.listener = [];
            document.addEventListener(key, e => {
                const detail = e.detail;
                for (const f of this.listener) {
                    try {
                        f(detail);
                    }
                    catch (_a) { }
                }
            });
        }
        on(_, cb) {
            this.listener.push(cb);
        }
        emit(_, data) {
            if (isDebug) {
                console.log('send', data);
                Object.assign(window, {
                    response: (response) => document.dispatchEvent(new CustomEvent(key, {
                        detail: {
                            jsonrpc: '2.0',
                            id: data.id,
                            result: response,
                        },
                    })),
                });
            }
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers[key])
                window.webkit.messageHandlers[key].postMessage(data);
        }
    }
    const ThisSideImplementation = {
        // todo: check dispatch target's manifest
        'browser.webNavigation.onCommitted': dispatchNormalEvent.bind(null, 'browser.webNavigation.onCommitted', '*'),
        async onMessage(extensionID, toExtensionID, messageID, message, sender) {
            // ? this is a response to the message
            if (TwoWayMessagePromiseResolver.has(messageID) && message.response) {
                const [resolve, reject] = TwoWayMessagePromiseResolver.get(messageID);
                resolve(message.data);
                TwoWayMessagePromiseResolver.delete(messageID);
            }
            else if (message.response === false) {
                onNormalMessage(message.data, sender, toExtensionID, extensionID, messageID);
            }
        },
        async 'websocket.onClose'(websocketID, code, reason, wasClean) {
            onWebSocketClose(websocketID, code, reason, wasClean);
        },
        async 'websocket.onError'(websocketID, reason) {
            onWebSocketError(websocketID);
        },
        async 'websocket.onMessage'(websocketID, data) {
            onWebSocketMessage(websocketID, data);
        },
    };
    const Host = AsyncCall(ThisSideImplementation, {
        key: '',
        log: false,
        messageChannel: new iOSWebkitChannel(),
    });

    const { createObjectURL, revokeObjectURL } = URL;
    function getIDFromBlobURL(x) {
        if (x.startsWith('blob:'))
            return new URL(new URL(x).pathname).pathname.replace(/^\//, '');
        return undefined;
    }
    /**
     * Modify the behavior of URL.*
     * Let the blob:// url can be recognized by Host.
     *
     * @param url The original URL object
     * @param extensionID
     */
    function enhanceURL(url, extensionID) {
        url.createObjectURL = createObjectURLEnhanced(extensionID);
        url.revokeObjectURL = revokeObjectURLEnhanced(extensionID);
        return url;
    }
    function revokeObjectURLEnhanced(extensionID) {
        return (url) => {
            revokeObjectURL(url);
            const id = getIDFromBlobURL(url);
            Host['URL.revokeObjectURL'](extensionID, id);
        };
    }
    function createObjectURLEnhanced(extensionID) {
        return (obj) => {
            const url = createObjectURL(obj);
            const resourceID = getIDFromBlobURL(url);
            if (obj instanceof Blob) {
                encodeStringOrBlob(obj).then(blob => Host['URL.createObjectURL'](extensionID, resourceID, blob));
            }
            return url;
        };
    }

    /**
     * Create a new `browser` object.
     * @param extensionID - Extension ID
     * @param manifest - Manifest of the extension
     */
    function BrowserFactory(extensionID, manifest) {
        const implementation = {
            downloads: NotImplementedProxy({
                download: binding(extensionID, 'browser.downloads.download')({
                    param(options) {
                        let { url, filename } = options;
                        if (getIDFromBlobURL(url)) {
                            url = `holoflows-blob://${extensionID}/${getIDFromBlobURL(url)}`;
                        }
                        PartialImplemented(options, 'filename', 'url');
                        const arg1 = { url, filename: filename || '' };
                        return [arg1];
                    },
                    returns() {
                        return 0;
                    },
                }),
            }),
            runtime: NotImplementedProxy({
                getURL(path) {
                    return `holoflows-extension://${extensionID}/${path}`;
                },
                getManifest() {
                    return JSON.parse(JSON.stringify(manifest));
                },
                onMessage: createEventListener(extensionID, 'browser.runtime.onMessage'),
                sendMessage: createRuntimeSendMessage(extensionID),
            }),
            tabs: NotImplementedProxy({
                async executeScript(tabID, details) {
                    PartialImplemented(details, 'code', 'file', 'runAt');
                    await Host['browser.tabs.executeScript'](extensionID, tabID === undefined ? -1 : tabID, details);
                    return [];
                },
                create: binding(extensionID, 'browser.tabs.create')(),
                async remove(tabID) {
                    let t;
                    if (!Array.isArray(tabID))
                        t = [tabID];
                    else
                        t = tabID;
                    await Promise.all(t.map(x => Host['browser.tabs.remove'](extensionID, x)));
                },
                query: binding(extensionID, 'browser.tabs.query')(),
                update: binding(extensionID, 'browser.tabs.update')(),
                async sendMessage(tabId, message, options) {
                    PartialImplemented(options);
                    return sendMessageWithResponse(extensionID, extensionID, tabId, message);
                },
            }),
            storage: {
                local: Implements({
                    clear: binding(extensionID, 'browser.storage.local.clear')(),
                    remove: binding(extensionID, 'browser.storage.local.remove')(),
                    set: binding(extensionID, 'browser.storage.local.set')(),
                    get: binding(extensionID, 'browser.storage.local.get')({
                        /** Host not accepting { a: 1 } as keys */
                        param(keys) {
                            if (Array.isArray(keys))
                                return [keys];
                            if (typeof keys === 'object') {
                                if (keys === null)
                                    return [null];
                                return [Object.keys(keys)];
                            }
                            return [null];
                        },
                        returns(rtn, [key]) {
                            if (Array.isArray(key))
                                return rtn;
                            else if (typeof key === 'object' && key !== null) {
                                return Object.assign({}, key, rtn);
                            }
                            return rtn;
                        },
                    }),
                }),
                sync: NotImplementedProxy(),
                onChanged: NotImplementedProxy(),
            },
            webNavigation: NotImplementedProxy({
                onCommitted: createEventListener(extensionID, 'browser.webNavigation.onCommitted'),
            }),
            extension: NotImplementedProxy({
                getBackgroundPage() {
                    return new Proxy({
                        location: new URL(`holoflows-extension://${extensionID}/_generated_background_page.html`),
                    }, {
                        get(_, key) {
                            if (_[key])
                                return _[key];
                            throw new TypeError('Not supported');
                        },
                    });
                },
            }),
        };
        return NotImplementedProxy(implementation, false);
    }
    function Implements(implementation) {
        return implementation;
    }
    function NotImplementedProxy(implemented = {}, final = true) {
        return new Proxy(implemented, {
            get(target, key) {
                if (!target[key])
                    return final ? NotImplemented : NotImplementedProxy();
                return target[key];
            },
            apply() {
                return NotImplemented();
            },
        });
    }
    function NotImplemented() {
        return function () {
            throw new Error('Not implemented!');
        };
    }
    function PartialImplemented(obj = {}, ...keys) {
        const obj2 = Object.assign({}, obj);
        keys.forEach(x => delete obj2[x]);
        if (Object.keys(obj2).length)
            console.warn(`Not implemented options`, obj2, `at`, new Error().stack);
    }
    /**
     * Generate binding between Host and WebExtensionAPI
     *
     * ALL generics should be inferred. DO NOT write it manually.
     *
     * If you are writing options, make sure you add your function to `BrowserReference` to get type tips.
     *
     * @param extensionID - The extension ID
     * @param key - The API name in the type of `Host` AND `BrowserReference`
     */
    function binding(extensionID, key) {
        /**
         * And here we split it into 2 function, if we join them together it will break the infer (but idk why)
         */
        return (
        /**
         * Options. You can write the bridge between Host side and WebExtension side.
         */
        options = {}) => {
            const noop = (x) => x;
            const noopArgs = (...args) => args;
            const hostDefinition = Host[key];
            return (async (...args) => {
                // ? Transform WebExtension API arguments to host arguments
                const hostArgs = (options.param || noopArgs)(...args);
                // ? execute
                const result = await hostDefinition(extensionID, ...hostArgs);
                // ? Transform host result to WebExtension API result
                const browserResult = (options.returns || noop)(result, args, hostArgs);
                return browserResult;
            });
        };
    }

    function createFetch(extensionID) {
        return new Proxy(fetch, {
            async apply(target, thisArg, [requestInfo, requestInit]) {
                const { body, method, url } = new Request(requestInfo, requestInit);
                const result = await Host.fetch(extensionID, { method, url });
                const data = await decodeStringOrBlob(result.data);
                if (data === null)
                    throw new Error('');
                const returnValue = new Response(data, result);
                return returnValue;
            },
        });
    }

    let lastUserActive = 0;
    let now = Date.now.bind(Date);
    document.addEventListener('click', () => {
        lastUserActive = now();
    }, { capture: true, passive: true });
    function hasValidUserInteractive() {
        return now() - lastUserActive < 3000;
    }

    function openEnhanced(extensionID) {
        return (url = 'about:blank', target, features, replace) => {
            if (!hasValidUserInteractive())
                return null;
            if ((target && target !== '_blank') || features || replace)
                console.warn('Unsupported open', url, target, features, replace);
            Host['browser.tabs.create'](extensionID, {
                active: true,
                url,
            });
            return null;
        };
    }
    function closeEnhanced(extensionID) {
        return () => {
            if (!hasValidUserInteractive())
                return;
            Host['browser.tabs.query'](extensionID, { active: true }).then(i => Host['browser.tabs.remove'](extensionID, i[0].id));
        };
    }

    /**
     * This file partly implements XRayVision in Firefox's WebExtension standard
     * by create a two-way JS sandbox but shared DOM environment.
     *
     * class WebExtensionContentScriptEnvironment will return a new JS environment
     * that has a "browser" variable inside of it and a clone of the current DOM environment
     * to prevent the main thread hack on prototype to access the content of ContentScripts.
     *
     * ## Checklist:
     * - [o] ContentScript cannot access main thread
     * - [?] Main thread cannot access ContentScript
     * - [o] ContentScript can access main thread's DOM
     * - [ ] ContentScript modification on DOM prototype is not discoverable by main thread
     * - [ ] Main thread modification on DOM prototype is not discoverable by ContentScript
     */
    /**
     * Recursively get the prototype chain of an Object
     * @param o Object
     */
    function getPrototypeChain(o, _ = []) {
        if (o === undefined || o === null)
            return _;
        const y = Object.getPrototypeOf(o);
        if (y === null || y === undefined || y === Object.prototype)
            return _;
        return getPrototypeChain(Object.getPrototypeOf(y), [..._, y]);
    }
    /**
     * Apply all WebAPIs to the clean sandbox created by Realm
     */
    const PrepareWebAPIs = (() => {
        // ? replace Function with polluted version by Realms
        // ! this leaks the sandbox!
        Object.defineProperty(Object.getPrototypeOf(() => { }), 'constructor', {
            value: globalThis.Function,
        });
        const realWindow = window;
        const webAPIs = Object.getOwnPropertyDescriptors(window);
        Reflect.deleteProperty(webAPIs, 'window');
        Reflect.deleteProperty(webAPIs, 'globalThis');
        Reflect.deleteProperty(webAPIs, 'self');
        Reflect.deleteProperty(webAPIs, 'global');
        Object.defineProperty(Document.prototype, 'defaultView', {
            get() {
                return undefined;
            },
        });
        return (sandboxRoot) => {
            const clonedWebAPIs = Object.assign({}, webAPIs);
            Object.getOwnPropertyNames(sandboxRoot).forEach(name => Reflect.deleteProperty(clonedWebAPIs, name));
            // ? Clone Web APIs
            for (const key in webAPIs) {
                PatchThisOfDescriptorToGlobal(webAPIs[key], realWindow);
            }
            Object.defineProperty(sandboxRoot, 'window', {
                configurable: false,
                writable: false,
                enumerable: true,
                value: sandboxRoot,
            });
            Object.assign(sandboxRoot, { globalThis: sandboxRoot });
            const proto = getPrototypeChain(realWindow)
                .map(Object.getOwnPropertyDescriptors)
                .reduceRight((previous, current) => {
                const copy = Object.assign({}, current);
                for (const key in copy) {
                    PatchThisOfDescriptorToGlobal(copy[key], realWindow);
                }
                return Object.create(previous, copy);
            }, {});
            Object.setPrototypeOf(sandboxRoot, proto);
            Object.defineProperties(sandboxRoot, clonedWebAPIs);
        };
    })();
    /**
     * Execution environment of ContentScript
     */
    class WebExtensionContentScriptEnvironment {
        /**
         * Create a new running extension for an content script.
         * @param extensionID The extension ID
         * @param manifest The manifest of the extension
         */
        constructor(extensionID, manifest) {
            this.extensionID = extensionID;
            this.manifest = manifest;
            this.realm = realmsShim_umd.makeRootRealm();
            this[Symbol.toStringTag] = 'Realm';
            this.init();
        }
        get global() {
            return this.realm.global;
        }
        /**
         * Evaluate a string in the content script environment
         * @param sourceText Source text
         */
        evaluate(sourceText) {
            return this.realm.evaluate(sourceText);
        }
        init() {
            PrepareWebAPIs(this.global);
            this.global.browser = BrowserFactory(this.extensionID, this.manifest);
            this.global.URL = enhanceURL(this.global.URL, this.extensionID);
            this.global.fetch = createFetch(this.extensionID);
            this.global.WebSocket = createWebSocket(this.extensionID);
            this.global.open = openEnhanced(this.extensionID);
            this.global.close = closeEnhanced(this.extensionID);
        }
    }
    /**
     * Many methods on `window` requires `this` points to a Window object
     * Like `alert()`. If you call alert as `const w = { alert }; w.alert()`,
     * there will be an Illegal invocation.
     *
     * To prevent `this` binding lost, we need to rebind it.
     *
     * @param desc PropertyDescriptor
     * @param global The real window
     */
    function PatchThisOfDescriptorToGlobal(desc, global) {
        const { get, set, value } = desc;
        if (get)
            desc.get = () => get.apply(global);
        if (set)
            desc.set = (val) => set.apply(global, val);
        if (value && typeof value === 'function') {
            const desc2 = Object.getOwnPropertyDescriptors(value);
            desc.value = function (...args) {
                if (new.target)
                    return Reflect.construct(value, args, new.target);
                return Reflect.apply(value, global, args);
            };
            Object.defineProperties(desc.value, desc2);
            try {
                // ? For unknown reason this fail for some objects on Safari.
                desc.value.prototype = value.prototype;
            }
            catch (_a) { }
        }
    }

    const registeredWebExtension = new Map();
    function registerWebExtension(extensionID, manifest, preloadedResources = {}) {
        const environment = location.href.startsWith('holoflows-extension://') && location.href.endsWith('_generated_background_page.html')
            ? 'background script'
            : 'content script';
        console.debug(`[WebExtension] Loading extension ${manifest.name}(${extensionID}) with manifest`, manifest, `and preloaded resource`, preloadedResources, `in ${environment} mode`);
        if (location.protocol === 'holoflows-extension:')
            prepareBackgroundAndOptionsPageEnvironment(extensionID, manifest);
        try {
            if (environment === 'content script') {
                untilDocumentReady().then(() => LoadContentScript(manifest, extensionID, preloadedResources));
            }
            else if (environment === 'background script') {
                untilDocumentReady().then(() => LoadBackgroundScript(manifest, extensionID, preloadedResources));
            }
            else {
                console.warn(`[WebExtension] unknown running environment ${environment}`);
            }
        }
        catch (e) {
            console.error(e);
        }
        return registeredWebExtension.get(extensionID);
    }
    function untilDocumentReady() {
        if (document.readyState === 'complete')
            return Promise.resolve();
        return new Promise(resolve => {
            document.addEventListener('readystatechange', resolve, { once: true, passive: true });
        });
    }
    function LoadBackgroundScript(manifest, extensionID, preloadedResources) {
        if (!manifest.background)
            return;
        const { page, scripts } = manifest.background;
        if (page)
            return console.warn('[WebExtension] manifest.background.page is not supported yet!');
        if (location.hostname !== 'localhost' && !location.href.startsWith('holoflows-extension://')) {
            throw new TypeError(`Background script only allowed in localhost(for debugging) and holoflows-extension://`);
        }
        {
            const src = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
            Object.defineProperty(HTMLScriptElement.prototype, 'src', {
                get() {
                    return src.get.call(this);
                },
                set(val) {
                    console.log('Loading ', val);
                    if (val in preloadedResources || val.replace(/^\//, '') in preloadedResources) {
                        RunInGlobalScope(extensionID, preloadedResources[val] || preloadedResources[val.replace(/^\//, '')]);
                        return true;
                    }
                    src.set.call(this, val);
                    return true;
                },
            });
        }
        prepareBackgroundAndOptionsPageEnvironment(extensionID, manifest);
        for (const path of scripts || []) {
            if (typeof preloadedResources[path] === 'string') {
                // ? Run it in global scope.
                RunInGlobalScope(extensionID, preloadedResources[path]);
            }
            else {
                console.warn(`[WebExtension] Content scripts preload not found for ${manifest.name}: ${path}`);
            }
        }
    }
    function prepareBackgroundAndOptionsPageEnvironment(extensionID, manifest) {
        Object.assign(window, {
            browser: BrowserFactory(extensionID, manifest),
            fetch: createFetch(extensionID),
            URL: enhanceURL(URL, extensionID),
            open: openEnhanced(extensionID),
            close: closeEnhanced(extensionID),
        });
    }
    function RunInGlobalScope(extensionID, src) {
        if (location.protocol === 'holoflows-extension:')
            return new Function(src)();
        const f = new Function(`with (
                new Proxy(window, {
                    get(target, key) {
                        if (key === 'location')
                            return new URL("holoflows-extension://${extensionID}/_generated_background_page.html")
                        if(typeof target[key] === 'function') {
                            const desc2 = Object.getOwnPropertyDescriptors(target[key])
                            function f(...args) {
                                if (new.target) return Reflect.construct(target[key], args, new.target)
                                return Reflect.apply(target[key], window, args)
                            }
                            Object.defineProperties(f, desc2)
                            f.prototype = target[key].prototype
                            return f
                        }
                        return target[key]
                    }
                }
            )) {
                ${src}
              }`);
        f();
    }
    function LoadContentScript(manifest, extensionID, preloadedResources) {
        for (const [index, content] of (manifest.content_scripts || []).entries()) {
            warningNotImplementedItem(content, index);
            if (matchingURL(new URL(location.href), content.matches, content.exclude_matches || [], content.include_globs || [], content.exclude_globs || [], content.match_about_blank)) {
                console.debug(`[WebExtension] Loading content script for`, content);
                loadContentScript(extensionID, manifest, content, preloadedResources);
            }
            else {
                console.debug(`[WebExtension] URL mismatched. Skip content script for, `, content);
            }
        }
    }
    function loadContentScript(extensionID, manifest, content, content_scripts) {
        if (!registeredWebExtension.has(extensionID)) {
            const environment = new WebExtensionContentScriptEnvironment(extensionID, manifest);
            const ext = {
                manifest,
                environment,
            };
            registeredWebExtension.set(extensionID, ext);
        }
        const { environment } = registeredWebExtension.get(extensionID);
        for (const path of content.js || []) {
            if (typeof content_scripts[path] === 'string') {
                environment.evaluate(content_scripts[path]);
            }
            else {
                console.warn(`[WebExtension] Content scripts preload not found for ${manifest.name}: ${path}`);
            }
        }
    }
    function warningNotImplementedItem(content, index) {
        if (content.all_frames)
            console.warn(`all_frames not supported yet. Defined at manifest.content_scripts[${index}].all_frames`);
        if (content.css)
            console.warn(`css not supported yet. Defined at manifest.content_scripts[${index}].css`);
        if (content.run_at && content.run_at !== 'document_start')
            console.warn(`run_at not supported yet. Defined at manifest.content_scripts[${index}].run_at`);
    }

    const env = location.href.startsWith('holoflows-extension://') && location.href.endsWith('_generated_background_page.html');
    // ## Inject here
    // ? to avoid registerWebExtension omitted by rollup
    registerWebExtension.toString();
    /**
     * registerWebExtension(
     *      extensionID: string,
     *      manifest: Manifest,
     *      preloadedResources?: Record<string, string>
     * )
     */

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMvVVJMTWF0Y2hlci50cyIsIi4uL25vZGVfbW9kdWxlcy9yZWFsbXMtc2hpbS9kaXN0L3JlYWxtcy1zaGltLnVtZC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AaG9sb2Zsb3dzL2tpdC9ub2RlX21vZHVsZXMvbWl0dC9kaXN0L21pdHQuZXMuanMiLCIuLi9ub2RlX21vZHVsZXMvQGhvbG9mbG93cy9raXQvZXMvRXh0ZW5zaW9uL01lc3NhZ2VDZW50ZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvQGhvbG9mbG93cy9raXQvZXMvdXRpbC9Bc3luY0NhbGwuanMiLCIuLi9zcmMvdXRpbHMvTG9jYWxNZXNzYWdlcy50cyIsIi4uL3NyYy91dGlscy9kZWVwQ2xvbmUudHMiLCIuLi9zcmMvc2hpbXMvYnJvd3Nlci5tZXNzYWdlLnRzIiwiLi4vc3JjL3V0aWxzL1N0cmluZ09yQmxvYi50cyIsIi4uL3NyYy9zaGltcy9XZWJTb2NrZXQudHMiLCIuLi9zcmMvUlBDLnRzIiwiLi4vc3JjL3NoaW1zL1VSTC5jcmVhdGUrcmV2b2tlT2JqZWN0VVJMLnRzIiwiLi4vc3JjL3NoaW1zL2Jyb3dzZXIudHMiLCIuLi9zcmMvc2hpbXMvZmV0Y2gudHMiLCIuLi9zcmMvdXRpbHMvVXNlckludGVyYWN0aXZlLnRzIiwiLi4vc3JjL3NoaW1zL3dpbmRvdy5vcGVuK2Nsb3NlLnRzIiwiLi4vc3JjL3NoaW1zL1hSYXlWaXNpb24udHMiLCIuLi9zcmMvRXh0ZW5zaW9ucy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENoZWNrIGlmIHRoZSBjdXJyZW50IGxvY2F0aW9uIG1hdGNoZXMuIFVzZWQgaW4gbWFuaWZlc3QuanNvbiBwYXJzZXJcbiAqIEBwYXJhbSBsb2NhdGlvbiBDdXJyZW50IGxvY2F0aW9uXG4gKiBAcGFyYW0gbWF0Y2hlc1xuICogQHBhcmFtIGV4Y2x1ZGVfbWF0Y2hlc1xuICogQHBhcmFtIGluY2x1ZGVfZ2xvYnNcbiAqIEBwYXJhbSBleGNsdWRlX2dsb2JzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGluZ1VSTChcbiAgICBsb2NhdGlvbjogVVJMLFxuICAgIG1hdGNoZXM6IHN0cmluZ1tdLFxuICAgIGV4Y2x1ZGVfbWF0Y2hlczogc3RyaW5nW10sXG4gICAgaW5jbHVkZV9nbG9iczogc3RyaW5nW10sXG4gICAgZXhjbHVkZV9nbG9iczogc3RyaW5nW10sXG4gICAgYWJvdXRfYmxhbms/OiBib29sZWFuLFxuKSB7XG4gICAgbGV0IHJlc3VsdCA9IGZhbHNlXG4gICAgLy8gPyBXZSBldmFsIG1hdGNoZXMgZmlyc3QgdGhlbiBldmFsIG1pc21hdGNoZXNcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgbWF0Y2hlcykgaWYgKG1hdGNoZXNfbWF0Y2hlcihpdGVtLCBsb2NhdGlvbiwgYWJvdXRfYmxhbmspKSByZXN1bHQgPSB0cnVlXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGV4Y2x1ZGVfbWF0Y2hlcykgaWYgKG1hdGNoZXNfbWF0Y2hlcihpdGVtLCBsb2NhdGlvbikpIHJlc3VsdCA9IGZhbHNlXG4gICAgaWYgKGluY2x1ZGVfZ2xvYnMubGVuZ3RoKSBjb25zb2xlLndhcm4oJ2luY2x1ZGVfZ2xvYnMgbm90IHN1cHBvcnRlZCB5ZXQuJylcbiAgICBpZiAoZXhjbHVkZV9nbG9icy5sZW5ndGgpIGNvbnNvbGUud2FybignZXhjbHVkZV9nbG9icyBub3Qgc3VwcG9ydGVkIHlldC4nKVxuICAgIHJldHVybiByZXN1bHRcbn1cbi8qKlxuICogU3VwcG9ydGVkIHByb3RvY29sc1xuICovXG5jb25zdCBzdXBwb3J0ZWRQcm90b2NvbHM6IHJlYWRvbmx5IHN0cmluZ1tdID0gW1xuICAgICdodHRwOicsXG4gICAgJ2h0dHBzOicsXG4gICAgLy8gXCJ3czpcIixcbiAgICAvLyBcIndzczpcIixcbiAgICAvLyBcImZ0cDpcIixcbiAgICAvLyBcImRhdGE6XCIsXG4gICAgLy8gXCJmaWxlOlwiXG5dXG5mdW5jdGlvbiBtYXRjaGVzX21hdGNoZXIoXzogc3RyaW5nLCBsb2NhdGlvbjogVVJMLCBhYm91dF9ibGFuaz86IGJvb2xlYW4pIHtcbiAgICBpZiAobG9jYXRpb24udG9TdHJpbmcoKSA9PT0gJ2Fib3V0OmJsYW5rJyAmJiBhYm91dF9ibGFuaykgcmV0dXJuIHRydWVcbiAgICBpZiAoXyA9PT0gJzxhbGxfdXJscz4nKSB7XG4gICAgICAgIGlmIChzdXBwb3J0ZWRQcm90b2NvbHMuaW5jbHVkZXMobG9jYXRpb24ucHJvdG9jb2wpKSByZXR1cm4gdHJ1ZVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgY29uc3QgW3J1bGUsIHdpbGRjYXJkUHJvdG9jb2xdID0gbm9ybWFsaXplVVJMKF8pXG4gICAgaWYgKHJ1bGUucG9ydCAhPT0gJycpIHJldHVybiBmYWxzZVxuICAgIGlmICghcHJvdG9jb2xfbWF0Y2hlcihydWxlLnByb3RvY29sLCBsb2NhdGlvbi5wcm90b2NvbCwgd2lsZGNhcmRQcm90b2NvbCkpIHJldHVybiBmYWxzZVxuICAgIGlmICghaG9zdF9tYXRjaGVyKHJ1bGUuaG9zdG5hbWUsIGxvY2F0aW9uLmhvc3RuYW1lKSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKCFwYXRoX21hdGNoZXIocnVsZS5wYXRobmFtZSwgbG9jYXRpb24ucGF0aG5hbWUsIGxvY2F0aW9uLnNlYXJjaCkpIHJldHVybiBmYWxzZVxuICAgIHJldHVybiB0cnVlXG59XG4vKipcbiAqIE5vcm1hbGl6ZVVSTFxuICogQHBhcmFtIF8gLSBVUkwgZGVmaW5lZCBpbiBtYW5pZmVzdFxuICovXG5mdW5jdGlvbiBub3JtYWxpemVVUkwoXzogc3RyaW5nKTogW1VSTCwgYm9vbGVhbl0ge1xuICAgIGlmIChfLnN0YXJ0c1dpdGgoJyo6Ly8nKSkgcmV0dXJuIFtuZXcgVVJMKF8ucmVwbGFjZSgvXlxcKjovLCAnaHR0cHM6JykpLCB0cnVlXVxuICAgIHJldHVybiBbbmV3IFVSTChfKSwgZmFsc2VdXG59XG5mdW5jdGlvbiBwcm90b2NvbF9tYXRjaGVyKG1hdGNoZXJQcm90b2NvbDogc3RyaW5nLCBjdXJyZW50UHJvdG9jb2w6IHN0cmluZywgd2lsZGNhcmRQcm90b2NvbDogYm9vbGVhbikge1xuICAgIC8vID8gb25seSBgaHR0cDpgIGFuZCBgaHR0cHM6YCBpcyBzdXBwb3J0ZWQgY3VycmVudGx5XG4gICAgaWYgKCFzdXBwb3J0ZWRQcm90b2NvbHMuaW5jbHVkZXMoY3VycmVudFByb3RvY29sKSkgcmV0dXJuIGZhbHNlXG4gICAgLy8gPyBpZiB3YW50ZWQgcHJvdG9jb2wgaXMgXCIqOlwiLCBtYXRjaCBldmVyeXRoaW5nXG4gICAgaWYgKHdpbGRjYXJkUHJvdG9jb2wpIHJldHVybiB0cnVlXG4gICAgaWYgKG1hdGNoZXJQcm90b2NvbCA9PT0gY3VycmVudFByb3RvY29sKSByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBmYWxzZVxufVxuZnVuY3Rpb24gaG9zdF9tYXRjaGVyKG1hdGNoZXJIb3N0OiBzdHJpbmcsIGN1cnJlbnRIb3N0OiBzdHJpbmcpIHtcbiAgICAvLyA/ICUyQSBpcyAqXG4gICAgaWYgKG1hdGNoZXJIb3N0ID09PSAnJTJBJykgcmV0dXJuIHRydWVcbiAgICBpZiAobWF0Y2hlckhvc3Quc3RhcnRzV2l0aCgnJTJBLicpKSB7XG4gICAgICAgIGNvbnN0IHBhcnQgPSBtYXRjaGVySG9zdC5yZXBsYWNlKC9eJTJBLywgJycpXG4gICAgICAgIGlmIChwYXJ0ID09PSBjdXJyZW50SG9zdCkgcmV0dXJuIGZhbHNlXG4gICAgICAgIHJldHVybiBjdXJyZW50SG9zdC5lbmRzV2l0aChwYXJ0KVxuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hlckhvc3QgPT09IGN1cnJlbnRIb3N0XG59XG5mdW5jdGlvbiBwYXRoX21hdGNoZXIobWF0Y2hlclBhdGg6IHN0cmluZywgY3VycmVudFBhdGg6IHN0cmluZywgY3VycmVudFNlYXJjaDogc3RyaW5nKSB7XG4gICAgaWYgKCFtYXRjaGVyUGF0aC5zdGFydHNXaXRoKCcvJykpIHJldHVybiBmYWxzZVxuICAgIGlmIChtYXRjaGVyUGF0aCA9PT0gJy8qJykgcmV0dXJuIHRydWVcbiAgICAvLyA/ICcvYS9iL2MnIG1hdGNoZXMgJy9hL2IvYyMxMjMnIGJ1dCBub3QgJy9hL2IvYz8xMjMnXG4gICAgaWYgKG1hdGNoZXJQYXRoID09PSBjdXJyZW50UGF0aCAmJiBjdXJyZW50U2VhcmNoID09PSAnJykgcmV0dXJuIHRydWVcbiAgICAvLyA/ICcvYS9iLyonIG1hdGNoZXMgZXZlcnl0aGluZyBzdGFydHNXaXRoICcvYS9iLydcbiAgICBpZiAobWF0Y2hlclBhdGguZW5kc1dpdGgoJyonKSAmJiBjdXJyZW50UGF0aC5zdGFydHNXaXRoKG1hdGNoZXJQYXRoLnNsaWNlKHVuZGVmaW5lZCwgLTEpKSkgcmV0dXJuIHRydWVcbiAgICBpZiAobWF0Y2hlclBhdGguaW5kZXhPZignKicpID09PSAtMSkgcmV0dXJuIG1hdGNoZXJQYXRoID09PSBjdXJyZW50UGF0aFxuICAgIGNvbnNvbGUud2FybignTm90IHN1cHBvcnRlZCBwYXRoIG1hdGNoZXIgaW4gbWFuaWZlc3QuanNvbicsIG1hdGNoZXJQYXRoKVxuICAgIHJldHVybiB0cnVlXG59XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShmYWN0b3J5KSA6XG4gIChnbG9iYWwgPSBnbG9iYWwgfHwgc2VsZiwgZ2xvYmFsLlJlYWxtID0gZmFjdG9yeSgpKTtcbn0odGhpcywgZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbiAgLy8gd2UnZCBsaWtlIHRvIGFiYW5kb24sIGJ1dCB3ZSBjYW4ndCwgc28ganVzdCBzY3JlYW0gYW5kIGJyZWFrIGEgbG90IG9mXG4gIC8vIHN0dWZmLiBIb3dldmVyLCBzaW5jZSB3ZSBhcmVuJ3QgcmVhbGx5IGFib3J0aW5nIHRoZSBwcm9jZXNzLCBiZSBjYXJlZnVsIHRvXG4gIC8vIG5vdCB0aHJvdyBhbiBFcnJvciBvYmplY3Qgd2hpY2ggY291bGQgYmUgY2FwdHVyZWQgYnkgY2hpbGQtUmVhbG0gY29kZSBhbmRcbiAgLy8gdXNlZCB0byBhY2Nlc3MgdGhlICh0b28tcG93ZXJmdWwpIHByaW1hbC1yZWFsbSBFcnJvciBvYmplY3QuXG5cbiAgZnVuY3Rpb24gdGhyb3dUYW50cnVtKHMsIGVyciA9IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IG1zZyA9IGBwbGVhc2UgcmVwb3J0IGludGVybmFsIHNoaW0gZXJyb3I6ICR7c31gO1xuXG4gICAgLy8gd2Ugd2FudCB0byBsb2cgdGhlc2UgJ3Nob3VsZCBuZXZlciBoYXBwZW4nIHRoaW5ncy5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICBpZiAoZXJyKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgY29uc29sZS5lcnJvcihgJHtlcnJ9YCk7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgY29uc29sZS5lcnJvcihgJHtlcnIuc3RhY2t9YCk7XG4gICAgfVxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWRlYnVnZ2VyXG4gICAgZGVidWdnZXI7XG4gICAgdGhyb3cgbXNnO1xuICB9XG5cbiAgZnVuY3Rpb24gYXNzZXJ0KGNvbmRpdGlvbiwgbWVzc2FnZSkge1xuICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICB0aHJvd1RhbnRydW0obWVzc2FnZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVtb3ZlIGNvZGUgbW9kaWZpY2F0aW9ucy5cbiAgZnVuY3Rpb24gY2xlYW51cFNvdXJjZShzcmMpIHtcbiAgICByZXR1cm4gc3JjO1xuICB9XG5cbiAgLy8gYnVpbGRDaGlsZFJlYWxtIGlzIGltbWVkaWF0ZWx5IHR1cm5lZCBpbnRvIGEgc3RyaW5nLCBhbmQgdGhpcyBmdW5jdGlvbiBpc1xuICAvLyBuZXZlciByZWZlcmVuY2VkIGFnYWluLCBiZWNhdXNlIGl0IGNsb3NlcyBvdmVyIHRoZSB3cm9uZyBpbnRyaW5zaWNzXG5cbiAgZnVuY3Rpb24gYnVpbGRDaGlsZFJlYWxtKHVuc2FmZVJlYywgQmFzZVJlYWxtKSB7XG4gICAgY29uc3Qge1xuICAgICAgaW5pdFJvb3RSZWFsbSxcbiAgICAgIGluaXRDb21wYXJ0bWVudCxcbiAgICAgIGdldFJlYWxtR2xvYmFsLFxuICAgICAgcmVhbG1FdmFsdWF0ZVxuICAgIH0gPSBCYXNlUmVhbG07XG5cbiAgICAvLyBUaGlzIE9iamVjdCBhbmQgUmVmbGVjdCBhcmUgYnJhbmQgbmV3LCBmcm9tIGEgbmV3IHVuc2FmZVJlYywgc28gbm8gdXNlclxuICAgIC8vIGNvZGUgaGFzIGJlZW4gcnVuIG9yIGhhZCBhIGNoYW5jZSB0byBtYW5pcHVsYXRlIHRoZW0uIFdlIGV4dHJhY3QgdGhlc2VcbiAgICAvLyBwcm9wZXJ0aWVzIGZvciBicmV2aXR5LCBub3QgZm9yIHNlY3VyaXR5LiBEb24ndCBldmVyIHJ1biB0aGlzIGZ1bmN0aW9uXG4gICAgLy8gKmFmdGVyKiB1c2VyIGNvZGUgaGFzIGhhZCBhIGNoYW5jZSB0byBwb2xsdXRlIGl0cyBlbnZpcm9ubWVudCwgb3IgaXRcbiAgICAvLyBjb3VsZCBiZSB1c2VkIHRvIGdhaW4gYWNjZXNzIHRvIEJhc2VSZWFsbSBhbmQgcHJpbWFsLXJlYWxtIEVycm9yXG4gICAgLy8gb2JqZWN0cy5cbiAgICBjb25zdCB7IGNyZWF0ZSwgZGVmaW5lUHJvcGVydGllcyB9ID0gT2JqZWN0O1xuXG4gICAgY29uc3QgZXJyb3JDb25zdHJ1Y3RvcnMgPSBuZXcgTWFwKFtcbiAgICAgIFsnRXZhbEVycm9yJywgRXZhbEVycm9yXSxcbiAgICAgIFsnUmFuZ2VFcnJvcicsIFJhbmdlRXJyb3JdLFxuICAgICAgWydSZWZlcmVuY2VFcnJvcicsIFJlZmVyZW5jZUVycm9yXSxcbiAgICAgIFsnU3ludGF4RXJyb3InLCBTeW50YXhFcnJvcl0sXG4gICAgICBbJ1R5cGVFcnJvcicsIFR5cGVFcnJvcl0sXG4gICAgICBbJ1VSSUVycm9yJywgVVJJRXJyb3JdXG4gICAgXSk7XG5cbiAgICAvLyBMaWtlIFJlYWxtLmFwcGx5IGV4Y2VwdCB0aGF0IGl0IGNhdGNoZXMgYW55dGhpbmcgdGhyb3duIGFuZCByZXRocm93cyBpdFxuICAgIC8vIGFzIGFuIEVycm9yIGZyb20gdGhpcyByZWFsbVxuICAgIGZ1bmN0aW9uIGNhbGxBbmRXcmFwRXJyb3IodGFyZ2V0LCAuLi5hcmdzKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gdGFyZ2V0KC4uLmFyZ3MpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGlmIChPYmplY3QoZXJyKSAhPT0gZXJyKSB7XG4gICAgICAgICAgLy8gZXJyIGlzIGEgcHJpbWl0aXZlIHZhbHVlLCB3aGljaCBpcyBzYWZlIHRvIHJldGhyb3dcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGVOYW1lLCBlTWVzc2FnZSwgZVN0YWNrO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIFRoZSBjaGlsZCBlbnZpcm9ubWVudCBtaWdodCBzZWVrIHRvIHVzZSAnZXJyJyB0byByZWFjaCB0aGVcbiAgICAgICAgICAvLyBwYXJlbnQncyBpbnRyaW5zaWNzIGFuZCBjb3JydXB0IHRoZW0uIGAke2Vyci5uYW1lfWAgd2lsbCBjYXVzZVxuICAgICAgICAgIC8vIHN0cmluZyBjb2VyY2lvbiBvZiAnZXJyLm5hbWUnLiBJZiBlcnIubmFtZSBpcyBhbiBvYmplY3QgKHByb2JhYmx5XG4gICAgICAgICAgLy8gYSBTdHJpbmcgb2YgdGhlIHBhcmVudCBSZWFsbSksIHRoZSBjb2VyY2lvbiB1c2VzXG4gICAgICAgICAgLy8gZXJyLm5hbWUudG9TdHJpbmcoKSwgd2hpY2ggaXMgdW5kZXIgdGhlIGNvbnRyb2wgb2YgdGhlIHBhcmVudC4gSWZcbiAgICAgICAgICAvLyBlcnIubmFtZSB3ZXJlIGEgcHJpbWl0aXZlIChlLmcuIGEgbnVtYmVyKSwgaXQgd291bGQgdXNlXG4gICAgICAgICAgLy8gTnVtYmVyLnRvU3RyaW5nKGVyci5uYW1lKSwgdXNpbmcgdGhlIGNoaWxkJ3MgdmVyc2lvbiBvZiBOdW1iZXJcbiAgICAgICAgICAvLyAod2hpY2ggdGhlIGNoaWxkIGNvdWxkIG1vZGlmeSB0byBjYXB0dXJlIGl0cyBhcmd1bWVudCBmb3IgbGF0ZXJcbiAgICAgICAgICAvLyB1c2UpLCBob3dldmVyIHByaW1pdGl2ZXMgZG9uJ3QgaGF2ZSBwcm9wZXJ0aWVzIGxpa2UgLnByb3RvdHlwZSBzb1xuICAgICAgICAgIC8vIHRoZXkgYXJlbid0IHVzZWZ1bCBmb3IgYW4gYXR0YWNrLlxuICAgICAgICAgIGVOYW1lID0gYCR7ZXJyLm5hbWV9YDtcbiAgICAgICAgICBlTWVzc2FnZSA9IGAke2Vyci5tZXNzYWdlfWA7XG4gICAgICAgICAgZVN0YWNrID0gYCR7ZXJyLnN0YWNrIHx8IGVNZXNzYWdlfWA7XG4gICAgICAgICAgLy8gZU5hbWUvZU1lc3NhZ2UvZVN0YWNrIGFyZSBub3cgY2hpbGQtcmVhbG0gcHJpbWl0aXZlIHN0cmluZ3MsIGFuZFxuICAgICAgICAgIC8vIHNhZmUgdG8gZXhwb3NlXG4gICAgICAgIH0gY2F0Y2ggKGlnbm9yZWQpIHtcbiAgICAgICAgICAvLyBpZiBlcnIubmFtZS50b1N0cmluZygpIHRocm93cywga2VlcCB0aGUgKHBhcmVudCByZWFsbSkgRXJyb3IgYXdheVxuICAgICAgICAgIC8vIGZyb20gdGhlIGNoaWxkXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIGVycm9yJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgRXJyb3JDb25zdHJ1Y3RvciA9IGVycm9yQ29uc3RydWN0b3JzLmdldChlTmFtZSkgfHwgRXJyb3I7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yQ29uc3RydWN0b3IoZU1lc3NhZ2UpO1xuICAgICAgICB9IGNhdGNoIChlcnIyKSB7XG4gICAgICAgICAgZXJyMi5zdGFjayA9IGVTdGFjazsgLy8gcmVwbGFjZSB3aXRoIHRoZSBjYXB0dXJlZCBpbm5lciBzdGFja1xuICAgICAgICAgIHRocm93IGVycjI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjbGFzcyBSZWFsbSB7XG4gICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLy8gVGhlIFJlYWxtIGNvbnN0cnVjdG9yIGlzIG5vdCBpbnRlbmRlZCB0byBiZSB1c2VkIHdpdGggdGhlIG5ldyBvcGVyYXRvclxuICAgICAgICAvLyBvciB0byBiZSBzdWJjbGFzc2VkLiBJdCBtYXkgYmUgdXNlZCBhcyB0aGUgdmFsdWUgb2YgYW4gZXh0ZW5kcyBjbGF1c2VcbiAgICAgICAgLy8gb2YgYSBjbGFzcyBkZWZpbml0aW9uIGJ1dCBhIHN1cGVyIGNhbGwgdG8gdGhlIFJlYWxtIGNvbnN0cnVjdG9yIHdpbGxcbiAgICAgICAgLy8gY2F1c2UgYW4gZXhjZXB0aW9uLlxuXG4gICAgICAgIC8vIFdoZW4gUmVhbG0gaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGFuIGV4Y2VwdGlvbiBpcyBhbHNvIHJhaXNlZCBiZWNhdXNlXG4gICAgICAgIC8vIGEgY2xhc3MgY29uc3RydWN0b3IgY2Fubm90IGJlIGludm9rZWQgd2l0aG91dCAnbmV3Jy5cbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVhbG0gaXMgbm90IGEgY29uc3RydWN0b3InKTtcbiAgICAgIH1cblxuICAgICAgc3RhdGljIG1ha2VSb290UmVhbG0ob3B0aW9ucykge1xuICAgICAgICAvLyBUaGlzIGlzIHRoZSBleHBvc2VkIGludGVyZmFjZS5cbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdChvcHRpb25zKTsgLy8gdG9kbzogc2FuaXRpemVcblxuICAgICAgICAvLyBCeXBhc3MgdGhlIGNvbnN0cnVjdG9yLlxuICAgICAgICBjb25zdCByID0gY3JlYXRlKFJlYWxtLnByb3RvdHlwZSk7XG4gICAgICAgIGNhbGxBbmRXcmFwRXJyb3IoaW5pdFJvb3RSZWFsbSwgdW5zYWZlUmVjLCByLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHI7XG4gICAgICB9XG5cbiAgICAgIHN0YXRpYyBtYWtlQ29tcGFydG1lbnQoKSB7XG4gICAgICAgIC8vIEJ5cGFzcyB0aGUgY29uc3RydWN0b3IuXG4gICAgICAgIGNvbnN0IHIgPSBjcmVhdGUoUmVhbG0ucHJvdG90eXBlKTtcbiAgICAgICAgY2FsbEFuZFdyYXBFcnJvcihpbml0Q29tcGFydG1lbnQsIHVuc2FmZVJlYywgcik7XG4gICAgICAgIHJldHVybiByO1xuICAgICAgfVxuXG4gICAgICAvLyB3ZSBvbWl0IHRoZSBjb25zdHJ1Y3RvciBiZWNhdXNlIGl0IGlzIGVtcHR5LiBBbGwgdGhlIHBlcnNvbmFsaXphdGlvblxuICAgICAgLy8gdGFrZXMgcGxhY2UgaW4gb25lIG9mIHRoZSB0d28gc3RhdGljIG1ldGhvZHMsXG4gICAgICAvLyBtYWtlUm9vdFJlYWxtL21ha2VDb21wYXJ0bWVudFxuXG4gICAgICBnZXQgZ2xvYmFsKCkge1xuICAgICAgICAvLyB0aGlzIGlzIHNhZmUgYWdhaW5zdCBiZWluZyBjYWxsZWQgd2l0aCBzdHJhbmdlICd0aGlzJyBiZWNhdXNlXG4gICAgICAgIC8vIGJhc2VHZXRHbG9iYWwgaW1tZWRpYXRlbHkgZG9lcyBhIHRyYWRlbWFyayBjaGVjayAoaXQgZmFpbHMgdW5sZXNzXG4gICAgICAgIC8vIHRoaXMgJ3RoaXMnIGlzIHByZXNlbnQgaW4gYSB3ZWFrbWFwIHRoYXQgaXMgb25seSBwb3B1bGF0ZWQgd2l0aFxuICAgICAgICAvLyBsZWdpdGltYXRlIFJlYWxtIGluc3RhbmNlcylcbiAgICAgICAgcmV0dXJuIGNhbGxBbmRXcmFwRXJyb3IoZ2V0UmVhbG1HbG9iYWwsIHRoaXMpO1xuICAgICAgfVxuXG4gICAgICBldmFsdWF0ZSh4LCBlbmRvd21lbnRzKSB7XG4gICAgICAgIC8vIHNhZmUgYWdhaW5zdCBzdHJhbmdlICd0aGlzJywgYXMgYWJvdmVcbiAgICAgICAgcmV0dXJuIGNhbGxBbmRXcmFwRXJyb3IocmVhbG1FdmFsdWF0ZSwgdGhpcywgeCwgZW5kb3dtZW50cyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGVmaW5lUHJvcGVydGllcyhSZWFsbSwge1xuICAgICAgdG9TdHJpbmc6IHtcbiAgICAgICAgdmFsdWU6ICgpID0+ICdmdW5jdGlvbiBSZWFsbSgpIHsgW3NoaW0gY29kZV0gfScsXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZGVmaW5lUHJvcGVydGllcyhSZWFsbS5wcm90b3R5cGUsIHtcbiAgICAgIHRvU3RyaW5nOiB7XG4gICAgICAgIHZhbHVlOiAoKSA9PiAnW29iamVjdCBSZWFsbV0nLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBSZWFsbTtcbiAgfVxuXG4gIC8vIFRoZSBwYXJlbnRoZXNlcyBtZWFucyB3ZSBkb24ndCBiaW5kIHRoZSAnYnVpbGRDaGlsZFJlYWxtJyBuYW1lIGluc2lkZSB0aGVcbiAgLy8gY2hpbGQncyBuYW1lc3BhY2UuIHRoaXMgd291bGQgYWNjZXB0IGFuIGFub255bW91cyBmdW5jdGlvbiBkZWNsYXJhdGlvbi5cbiAgLy8gZnVuY3Rpb24gZXhwcmVzc2lvbiAobm90IGEgZGVjbGFyYXRpb24pIHNvIGl0IGhhcyBhIGNvbXBsZXRpb24gdmFsdWUuXG4gIGNvbnN0IGJ1aWxkQ2hpbGRSZWFsbVN0cmluZyA9IGNsZWFudXBTb3VyY2UoXG4gICAgYCd1c2Ugc3RyaWN0JzsgKCR7YnVpbGRDaGlsZFJlYWxtfSlgXG4gICk7XG5cbiAgZnVuY3Rpb24gY3JlYXRlUmVhbG1GYWNhZGUodW5zYWZlUmVjLCBCYXNlUmVhbG0pIHtcbiAgICBjb25zdCB7IHVuc2FmZUV2YWwgfSA9IHVuc2FmZVJlYztcblxuICAgIC8vIFRoZSBCYXNlUmVhbG0gaXMgdGhlIFJlYWxtIGNsYXNzIGNyZWF0ZWQgYnlcbiAgICAvLyB0aGUgc2hpbS4gSXQncyBvbmx5IHZhbGlkIGZvciB0aGUgY29udGV4dCB3aGVyZVxuICAgIC8vIGl0IHdhcyBwYXJzZWQuXG5cbiAgICAvLyBUaGUgUmVhbG0gZmFjYWRlIGlzIGEgbGlnaHR3ZWlnaHQgY2xhc3MgYnVpbHQgaW4gdGhlXG4gICAgLy8gY29udGV4dCBhIGRpZmZlcmVudCBjb250ZXh0LCB0aGF0IHByb3ZpZGUgYSBmdWxseVxuICAgIC8vIGZ1bmN0aW9uYWwgUmVhbG0gY2xhc3MgdXNpbmcgdGhlIGludHJpc2ljc1xuICAgIC8vIG9mIHRoYXQgY29udGV4dC5cblxuICAgIC8vIFRoaXMgcHJvY2VzcyBpcyBzaW1wbGlmaWVkIGJlY2F1c2UgYWxsIG1ldGhvZHNcbiAgICAvLyBhbmQgcHJvcGVydGllcyBvbiBhIHJlYWxtIGluc3RhbmNlIGFscmVhZHkgcmV0dXJuXG4gICAgLy8gdmFsdWVzIHVzaW5nIHRoZSBpbnRyaW5zaWNzIG9mIHRoZSByZWFsbSdzIGNvbnRleHQuXG5cbiAgICAvLyBJbnZva2UgdGhlIEJhc2VSZWFsbSBjb25zdHJ1Y3RvciB3aXRoIFJlYWxtIGFzIHRoZSBwcm90b3R5cGUuXG4gICAgcmV0dXJuIHVuc2FmZUV2YWwoYnVpbGRDaGlsZFJlYWxtU3RyaW5nKSh1bnNhZmVSZWMsIEJhc2VSZWFsbSk7XG4gIH1cblxuICAvLyBEZWNsYXJlIHNob3J0aGFuZCBmdW5jdGlvbnMuIFNoYXJpbmcgdGhlc2UgZGVjbGFyYXRpb25zIGFjcm9zcyBtb2R1bGVzXG4gIC8vIGltcHJvdmVzIGJvdGggY29uc2lzdGVuY3kgYW5kIG1pbmlmaWNhdGlvbi4gVW51c2VkIGRlY2xhcmF0aW9ucyBhcmVcbiAgLy8gZHJvcHBlZCBieSB0aGUgdHJlZSBzaGFraW5nIHByb2Nlc3MuXG5cbiAgLy8gd2UgY2FwdHVyZSB0aGVzZSwgbm90IGp1c3QgZm9yIGJyZXZpdHksIGJ1dCBmb3Igc2VjdXJpdHkuIElmIGFueSBjb2RlXG4gIC8vIG1vZGlmaWVzIE9iamVjdCB0byBjaGFuZ2Ugd2hhdCAnYXNzaWduJyBwb2ludHMgdG8sIHRoZSBSZWFsbSBzaGltIHdvdWxkIGJlXG4gIC8vIGNvcnJ1cHRlZC5cblxuICBjb25zdCB7XG4gICAgYXNzaWduLFxuICAgIGNyZWF0ZSxcbiAgICBmcmVlemUsXG4gICAgZGVmaW5lUHJvcGVydGllcywgLy8gT2JqZWN0LmRlZmluZVByb3BlcnR5IGlzIGFsbG93ZWQgdG8gZmFpbFxuICAgIC8vIHNpbGVudGx0eSwgdXNlIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzIGluc3RlYWQuXG4gICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcnMsXG4gICAgZ2V0T3duUHJvcGVydHlOYW1lcyxcbiAgICBnZXRQcm90b3R5cGVPZixcbiAgICBzZXRQcm90b3R5cGVPZlxuICB9ID0gT2JqZWN0O1xuXG4gIGNvbnN0IHtcbiAgICBhcHBseSxcbiAgICBvd25LZXlzIC8vIFJlZmxlY3Qub3duS2V5cyBpbmNsdWRlcyBTeW1ib2xzIGFuZCB1bmVudW1lcmFibGVzLFxuICAgIC8vIHVubGlrZSBPYmplY3Qua2V5cygpXG4gIH0gPSBSZWZsZWN0O1xuXG4gIC8qKlxuICAgKiB1bmN1cnJ5VGhpcygpIFNlZVxuICAgKiBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1jb252ZW50aW9uczpzYWZlX21ldGFfcHJvZ3JhbW1pbmdcbiAgICogd2hpY2ggb25seSBsaXZlcyBhdFxuICAgKiBodHRwOi8vd2ViLmFyY2hpdmUub3JnL3dlYi8yMDE2MDgwNTIyNTcxMC9odHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1jb252ZW50aW9uczpzYWZlX21ldGFfcHJvZ3JhbW1pbmdcbiAgICpcbiAgICogUGVyZm9ybWFuY2U6XG4gICAqIDEuIFRoZSBuYXRpdmUgY2FsbCBpcyBhYm91dCAxMHggZmFzdGVyIG9uIEZGIHRoYW4gY2hyb21lXG4gICAqIDIuIFRoZSB2ZXJzaW9uIHVzaW5nIEZ1bmN0aW9uLmJpbmQoKSBpcyBhYm91dCAxMDB4IHNsb3dlciBvbiBGRixcbiAgICogICAgZXF1YWwgb24gY2hyb21lLCAyeCBzbG93ZXIgb24gU2FmYXJpXG4gICAqIDMuIFRoZSB2ZXJzaW9uIHVzaW5nIGEgc3ByZWFkIGFuZCBSZWZsZWN0LmFwcGx5KCkgaXMgYWJvdXQgMTB4XG4gICAqICAgIHNsb3dlciBvbiBGRiwgZXF1YWwgb24gY2hyb21lLCAyeCBzbG93ZXIgb24gU2FmYXJpXG4gICAqXG4gICAqIGNvbnN0IGJpbmQgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZDtcbiAgICogY29uc3QgdW5jdXJyeVRoaXMgPSBiaW5kLmJpbmQoYmluZC5jYWxsKTtcbiAgICovXG4gIGNvbnN0IHVuY3VycnlUaGlzID0gZm4gPT4gKHRoaXNBcmcsIC4uLmFyZ3MpID0+IGFwcGx5KGZuLCB0aGlzQXJnLCBhcmdzKTtcblxuICAvLyBXZSBhbHNvIGNhcHR1cmUgdGhlc2UgZm9yIHNlY3VyaXR5OiBjaGFuZ2VzIHRvIEFycmF5LnByb3RvdHlwZSBhZnRlciB0aGVcbiAgLy8gUmVhbG0gc2hpbSBydW5zIHNob3VsZG4ndCBhZmZlY3Qgc3Vic2VxdWVudCBSZWFsbSBvcGVyYXRpb25zLlxuICBjb25zdCBvYmplY3RIYXNPd25Qcm9wZXJ0eSA9IHVuY3VycnlUaGlzKFxuICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAgICksXG4gICAgYXJyYXlGaWx0ZXIgPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUuZmlsdGVyKSxcbiAgICBhcnJheVBvcCA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5wb3ApLFxuICAgIGFycmF5Sm9pbiA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5qb2luKSxcbiAgICBhcnJheUNvbmNhdCA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5jb25jYXQpLFxuICAgIHJlZ2V4cFRlc3QgPSB1bmN1cnJ5VGhpcyhSZWdFeHAucHJvdG90eXBlLnRlc3QpLFxuICAgIHN0cmluZ0luY2x1ZGVzID0gdW5jdXJyeVRoaXMoU3RyaW5nLnByb3RvdHlwZS5pbmNsdWRlcyk7XG5cbiAgLy8gVGhlc2UgdmFsdWUgcHJvcGVydGllcyBvZiB0aGUgZ2xvYmFsIG9iamVjdCBhcmUgbm9uLXdyaXRhYmxlLFxuICAvLyBub24tY29uZmlndXJhYmxlIGRhdGEgcHJvcGVydGllcy5cbiAgY29uc3QgZnJvemVuR2xvYmFsUHJvcGVydHlOYW1lcyA9IFtcbiAgICAvLyAqKiogMTguMSBWYWx1ZSBQcm9wZXJ0aWVzIG9mIHRoZSBHbG9iYWwgT2JqZWN0XG5cbiAgICAnSW5maW5pdHknLFxuICAgICdOYU4nLFxuICAgICd1bmRlZmluZWQnXG4gIF07XG5cbiAgLy8gQWxsIHRoZSBmb2xsb3dpbmcgc3RkbGliIGl0ZW1zIGhhdmUgdGhlIHNhbWUgbmFtZSBvbiBib3RoIG91ciBpbnRyaW5zaWNzXG4gIC8vIG9iamVjdCBhbmQgb24gdGhlIGdsb2JhbCBvYmplY3QuIFVubGlrZSBJbmZpbml0eS9OYU4vdW5kZWZpbmVkLCB0aGVzZVxuICAvLyBzaG91bGQgYWxsIGJlIHdyaXRhYmxlIGFuZCBjb25maWd1cmFibGUuIFRoaXMgaXMgZGl2aWRlZCBpbnRvIHR3b1xuICAvLyBzZXRzLiBUaGUgc3RhYmxlIG9uZXMgYXJlIHRob3NlIHRoZSBzaGltIGNhbiBmcmVlemUgZWFybHkgYmVjYXVzZVxuICAvLyB3ZSBkb24ndCBleHBlY3QgYW55b25lIHdpbGwgd2FudCB0byBtdXRhdGUgdGhlbS4gVGhlIHVuc3RhYmxlIG9uZXNcbiAgLy8gYXJlIHRoZSBvbmVzIHRoYXQgd2UgY29ycmVjdGx5IGluaXRpYWxpemUgdG8gd3JpdGFibGUgYW5kXG4gIC8vIGNvbmZpZ3VyYWJsZSBzbyB0aGF0IHRoZXkgY2FuIHN0aWxsIGJlIHJlcGxhY2VkIG9yIHJlbW92ZWQuXG4gIGNvbnN0IHN0YWJsZUdsb2JhbFByb3BlcnR5TmFtZXMgPSBbXG4gICAgLy8gKioqIDE4LjIgRnVuY3Rpb24gUHJvcGVydGllcyBvZiB0aGUgR2xvYmFsIE9iamVjdFxuXG4gICAgLy8gJ2V2YWwnLCAvLyBjb21lcyBmcm9tIHNhZmVFdmFsIGluc3RlYWRcbiAgICAnaXNGaW5pdGUnLFxuICAgICdpc05hTicsXG4gICAgJ3BhcnNlRmxvYXQnLFxuICAgICdwYXJzZUludCcsXG5cbiAgICAnZGVjb2RlVVJJJyxcbiAgICAnZGVjb2RlVVJJQ29tcG9uZW50JyxcbiAgICAnZW5jb2RlVVJJJyxcbiAgICAnZW5jb2RlVVJJQ29tcG9uZW50JyxcblxuICAgIC8vICoqKiAxOC4zIENvbnN0cnVjdG9yIFByb3BlcnRpZXMgb2YgdGhlIEdsb2JhbCBPYmplY3RcblxuICAgICdBcnJheScsXG4gICAgJ0FycmF5QnVmZmVyJyxcbiAgICAnQm9vbGVhbicsXG4gICAgJ0RhdGFWaWV3JyxcbiAgICAvLyAnRGF0ZScsICAvLyBVbnN0YWJsZVxuICAgIC8vICdFcnJvcicsICAvLyBVbnN0YWJsZVxuICAgICdFdmFsRXJyb3InLFxuICAgICdGbG9hdDMyQXJyYXknLFxuICAgICdGbG9hdDY0QXJyYXknLFxuICAgIC8vICdGdW5jdGlvbicsICAvLyBjb21lcyBmcm9tIHNhZmVGdW5jdGlvbiBpbnN0ZWFkXG4gICAgJ0ludDhBcnJheScsXG4gICAgJ0ludDE2QXJyYXknLFxuICAgICdJbnQzMkFycmF5JyxcbiAgICAnTWFwJyxcbiAgICAnTnVtYmVyJyxcbiAgICAnT2JqZWN0JyxcbiAgICAvLyAnUHJvbWlzZScsICAvLyBVbnN0YWJsZVxuICAgIC8vICdQcm94eScsICAvLyBVbnN0YWJsZVxuICAgICdSYW5nZUVycm9yJyxcbiAgICAnUmVmZXJlbmNlRXJyb3InLFxuICAgIC8vICdSZWdFeHAnLCAgLy8gVW5zdGFibGVcbiAgICAnU2V0JyxcbiAgICAvLyAnU2hhcmVkQXJyYXlCdWZmZXInICAvLyByZW1vdmVkIG9uIEphbiA1LCAyMDE4XG4gICAgJ1N0cmluZycsXG4gICAgJ1N5bWJvbCcsXG4gICAgJ1N5bnRheEVycm9yJyxcbiAgICAnVHlwZUVycm9yJyxcbiAgICAnVWludDhBcnJheScsXG4gICAgJ1VpbnQ4Q2xhbXBlZEFycmF5JyxcbiAgICAnVWludDE2QXJyYXknLFxuICAgICdVaW50MzJBcnJheScsXG4gICAgJ1VSSUVycm9yJyxcbiAgICAnV2Vha01hcCcsXG4gICAgJ1dlYWtTZXQnLFxuXG4gICAgLy8gKioqIDE4LjQgT3RoZXIgUHJvcGVydGllcyBvZiB0aGUgR2xvYmFsIE9iamVjdFxuXG4gICAgLy8gJ0F0b21pY3MnLCAvLyByZW1vdmVkIG9uIEphbiA1LCAyMDE4XG4gICAgJ0pTT04nLFxuICAgICdNYXRoJyxcbiAgICAnUmVmbGVjdCcsXG5cbiAgICAvLyAqKiogQW5uZXggQlxuXG4gICAgJ2VzY2FwZScsXG4gICAgJ3VuZXNjYXBlJ1xuXG4gICAgLy8gKioqIEVDTUEtNDAyXG5cbiAgICAvLyAnSW50bCcgIC8vIFVuc3RhYmxlXG5cbiAgICAvLyAqKiogRVNOZXh0XG5cbiAgICAvLyAnUmVhbG0nIC8vIENvbWVzIGZyb20gY3JlYXRlUmVhbG1HbG9iYWxPYmplY3QoKVxuICBdO1xuXG4gIGNvbnN0IHVuc3RhYmxlR2xvYmFsUHJvcGVydHlOYW1lcyA9IFtcbiAgICAnRGF0ZScsXG4gICAgJ0Vycm9yJyxcbiAgICAnUHJvbWlzZScsXG4gICAgJ1Byb3h5JyxcbiAgICAnUmVnRXhwJyxcbiAgICAnSW50bCdcbiAgXTtcblxuICBmdW5jdGlvbiBnZXRTaGFyZWRHbG9iYWxEZXNjcyh1bnNhZmVHbG9iYWwpIHtcbiAgICBjb25zdCBkZXNjcmlwdG9ycyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gZGVzY3JpYmUobmFtZXMsIHdyaXRhYmxlLCBlbnVtZXJhYmxlLCBjb25maWd1cmFibGUpIHtcbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBuYW1lcykge1xuICAgICAgICBjb25zdCBkZXNjID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHVuc2FmZUdsb2JhbCwgbmFtZSk7XG4gICAgICAgIGlmIChkZXNjKSB7XG4gICAgICAgICAgLy8gQWJvcnQgaWYgYW4gYWNjZXNzb3IgaXMgZm91bmQgb24gdGhlIHVuc2FmZSBnbG9iYWwgb2JqZWN0XG4gICAgICAgICAgLy8gaW5zdGVhZCBvZiBhIGRhdGEgcHJvcGVydHkuIFdlIHNob3VsZCBuZXZlciBnZXQgaW50byB0aGlzXG4gICAgICAgICAgLy8gbm9uIHN0YW5kYXJkIHNpdHVhdGlvbi5cbiAgICAgICAgICBhc3NlcnQoXG4gICAgICAgICAgICAndmFsdWUnIGluIGRlc2MsXG4gICAgICAgICAgICBgdW5leHBlY3RlZCBhY2Nlc3NvciBvbiBnbG9iYWwgcHJvcGVydHk6ICR7bmFtZX1gXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGRlc2NyaXB0b3JzW25hbWVdID0ge1xuICAgICAgICAgICAgdmFsdWU6IGRlc2MudmFsdWUsXG4gICAgICAgICAgICB3cml0YWJsZSxcbiAgICAgICAgICAgIGVudW1lcmFibGUsXG4gICAgICAgICAgICBjb25maWd1cmFibGVcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGVzY3JpYmUoZnJvemVuR2xvYmFsUHJvcGVydHlOYW1lcywgZmFsc2UsIGZhbHNlLCBmYWxzZSk7XG4gICAgLy8gVGhlIGZvbGxvd2luZyBpcyBjb3JyZWN0IGJ1dCBleHBlbnNpdmUuXG4gICAgLy8gZGVzY3JpYmUoc3RhYmxlR2xvYmFsUHJvcGVydHlOYW1lcywgdHJ1ZSwgZmFsc2UsIHRydWUpO1xuICAgIC8vIEluc3RlYWQsIGZvciBub3csIHdlIGxldCB0aGVzZSBnZXQgb3B0aW1pemVkLlxuICAgIC8vXG4gICAgLy8gVE9ETzogV2Ugc2hvdWxkIHByb3ZpZGUgYW4gb3B0aW9uIHRvIHR1cm4gdGhpcyBvcHRpbWl6YXRpb24gb2ZmLFxuICAgIC8vIGJ5IGZlZWRpbmcgXCJ0cnVlLCBmYWxzZSwgdHJ1ZVwiIGhlcmUgaW5zdGVhZC5cbiAgICBkZXNjcmliZShzdGFibGVHbG9iYWxQcm9wZXJ0eU5hbWVzLCBmYWxzZSwgZmFsc2UsIGZhbHNlKTtcbiAgICAvLyBUaGVzZSB3ZSBrZWVwIHJlcGxhY2VhYmxlIGFuZCByZW1vdmFibGUsIGJlY2F1c2Ugd2UgZXhwZWN0XG4gICAgLy8gb3RoZXJzLCBlLmcuLCBTRVMsIG1heSB3YW50IHRvIGRvIHNvLlxuICAgIGRlc2NyaWJlKHVuc3RhYmxlR2xvYmFsUHJvcGVydHlOYW1lcywgdHJ1ZSwgZmFsc2UsIHRydWUpO1xuXG4gICAgcmV0dXJuIGRlc2NyaXB0b3JzO1xuICB9XG5cbiAgLy8gQWRhcHRlZCBmcm9tIFNFUy9DYWphIC0gQ29weXJpZ2h0IChDKSAyMDExIEdvb2dsZSBJbmMuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvY2FqYS9ibG9iL21hc3Rlci9zcmMvY29tL2dvb2dsZS9jYWphL3Nlcy9zdGFydFNFUy5qc1xuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2NhamEvYmxvYi9tYXN0ZXIvc3JjL2NvbS9nb29nbGUvY2FqYS9zZXMvcmVwYWlyRVM1LmpzXG5cbiAgLyoqXG4gICAqIFJlcGxhY2UgdGhlIGxlZ2FjeSBhY2Nlc3NvcnMgb2YgT2JqZWN0IHRvIGNvbXBseSB3aXRoIHN0cmljdCBtb2RlXG4gICAqIGFuZCBFUzIwMTYgc2VtYW50aWNzLCB3ZSBkbyB0aGlzIGJ5IHJlZGVmaW5pbmcgdGhlbSB3aGlsZSBpbiAndXNlIHN0cmljdCcuXG4gICAqXG4gICAqIHRvZG86IGxpc3QgdGhlIGlzc3VlcyByZXNvbHZlZFxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGluIHR3byB3YXlzOiAoMSkgaW52b2tlZCBkaXJlY3RseSB0byBmaXggdGhlIHByaW1hbFxuICAgKiByZWFsbSdzIE9iamVjdC5wcm90b3R5cGUsIGFuZCAoMikgY29udmVydGVkIHRvIGEgc3RyaW5nIHRvIGJlIGV4ZWN1dGVkXG4gICAqIGluc2lkZSBlYWNoIG5ldyBSb290UmVhbG0gdG8gZml4IHRoZWlyIE9iamVjdC5wcm90b3R5cGVzLiBFdmFsdWF0aW9uIHJlcXVpcmVzXG4gICAqIHRoZSBmdW5jdGlvbiB0byBoYXZlIG5vIGRlcGVuZGVuY2llcywgc28gZG9uJ3QgaW1wb3J0IGFueXRoaW5nIGZyb21cbiAgICogdGhlIG91dHNpZGUuXG4gICAqL1xuXG4gIC8vIHRvZG86IHRoaXMgZmlsZSBzaG91bGQgYmUgbW92ZWQgb3V0IHRvIGEgc2VwYXJhdGUgcmVwbyBhbmQgbnBtIG1vZHVsZS5cbiAgZnVuY3Rpb24gcmVwYWlyQWNjZXNzb3JzKCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGRlZmluZVByb3BlcnR5LFxuICAgICAgZGVmaW5lUHJvcGVydGllcyxcbiAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICAgIGdldFByb3RvdHlwZU9mLFxuICAgICAgcHJvdG90eXBlOiBvYmplY3RQcm90b3R5cGVcbiAgICB9ID0gT2JqZWN0O1xuXG4gICAgLy8gT24gc29tZSBwbGF0Zm9ybXMsIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGVzZSBmdW5jdGlvbnMgYWN0IGFzXG4gICAgLy8gaWYgdGhleSBhcmUgaW4gc2xvcHB5IG1vZGU6IGlmIHRoZXkncmUgaW52b2tlZCBiYWRseSwgdGhleSB3aWxsXG4gICAgLy8gZXhwb3NlIHRoZSBnbG9iYWwgb2JqZWN0LCBzbyB3ZSBuZWVkIHRvIHJlcGFpciB0aGVzZSBmb3JcbiAgICAvLyBzZWN1cml0eS4gVGh1cyBpdCBpcyBvdXIgcmVzcG9uc2liaWxpdHkgdG8gZml4IHRoaXMsIGFuZCB3ZSBuZWVkXG4gICAgLy8gdG8gaW5jbHVkZSByZXBhaXJBY2Nlc3NvcnMuIEUuZy4gQ2hyb21lIGluIDIwMTYuXG5cbiAgICB0cnkge1xuICAgICAgLy8gVmVyaWZ5IHRoYXQgdGhlIG1ldGhvZCBpcyBub3QgY2FsbGFibGUuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1wcm9wZXJ0aWVzLCBuby11bmRlcnNjb3JlLWRhbmdsZVxuICAgICAgKDAsIG9iamVjdFByb3RvdHlwZS5fX2xvb2t1cEdldHRlcl9fKSgneCcpO1xuICAgIH0gY2F0Y2ggKGlnbm9yZSkge1xuICAgICAgLy8gVGhyb3dzLCBubyBuZWVkIHRvIHBhdGNoLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvT2JqZWN0KG9iaikge1xuICAgICAgaWYgKG9iaiA9PT0gdW5kZWZpbmVkIHx8IG9iaiA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBjYW4ndCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdGApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIE9iamVjdChvYmopO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzUHJvcGVydHlOYW1lKG9iaikge1xuICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdzeW1ib2wnKSB7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgICB9XG4gICAgICByZXR1cm4gYCR7b2JqfWA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYUZ1bmN0aW9uKG9iaiwgYWNjZXNzb3IpIHtcbiAgICAgIGlmICh0eXBlb2Ygb2JqICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcihgaW52YWxpZCAke2FjY2Vzc29yfSB1c2FnZWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG5cbiAgICBkZWZpbmVQcm9wZXJ0aWVzKG9iamVjdFByb3RvdHlwZSwge1xuICAgICAgX19kZWZpbmVHZXR0ZXJfXzoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX19kZWZpbmVHZXR0ZXJfXyhwcm9wLCBmdW5jKSB7XG4gICAgICAgICAgY29uc3QgTyA9IHRvT2JqZWN0KHRoaXMpO1xuICAgICAgICAgIGRlZmluZVByb3BlcnR5KE8sIHByb3AsIHtcbiAgICAgICAgICAgIGdldDogYUZ1bmN0aW9uKGZ1bmMsICdnZXR0ZXInKSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIF9fZGVmaW5lU2V0dGVyX186IHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9fZGVmaW5lU2V0dGVyX18ocHJvcCwgZnVuYykge1xuICAgICAgICAgIGNvbnN0IE8gPSB0b09iamVjdCh0aGlzKTtcbiAgICAgICAgICBkZWZpbmVQcm9wZXJ0eShPLCBwcm9wLCB7XG4gICAgICAgICAgICBzZXQ6IGFGdW5jdGlvbihmdW5jLCAnc2V0dGVyJyksXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBfX2xvb2t1cEdldHRlcl9fOiB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfX2xvb2t1cEdldHRlcl9fKHByb3ApIHtcbiAgICAgICAgICBsZXQgTyA9IHRvT2JqZWN0KHRoaXMpO1xuICAgICAgICAgIHByb3AgPSBhc1Byb3BlcnR5TmFtZShwcm9wKTtcbiAgICAgICAgICBsZXQgZGVzYztcbiAgICAgICAgICB3aGlsZSAoTyAmJiAhKGRlc2MgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoTywgcHJvcCkpKSB7XG4gICAgICAgICAgICBPID0gZ2V0UHJvdG90eXBlT2YoTyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkZXNjICYmIGRlc2MuZ2V0O1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgX19sb29rdXBTZXR0ZXJfXzoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX19sb29rdXBTZXR0ZXJfXyhwcm9wKSB7XG4gICAgICAgICAgbGV0IE8gPSB0b09iamVjdCh0aGlzKTtcbiAgICAgICAgICBwcm9wID0gYXNQcm9wZXJ0eU5hbWUocHJvcCk7XG4gICAgICAgICAgbGV0IGRlc2M7XG4gICAgICAgICAgd2hpbGUgKE8gJiYgIShkZXNjID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE8sIHByb3ApKSkge1xuICAgICAgICAgICAgTyA9IGdldFByb3RvdHlwZU9mKE8pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZGVzYyAmJiBkZXNjLnNldDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gQWRhcHRlZCBmcm9tIFNFUy9DYWphXG4gIC8vIENvcHlyaWdodCAoQykgMjAxMSBHb29nbGUgSW5jLlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2NhamEvYmxvYi9tYXN0ZXIvc3JjL2NvbS9nb29nbGUvY2FqYS9zZXMvc3RhcnRTRVMuanNcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9jYWphL2Jsb2IvbWFzdGVyL3NyYy9jb20vZ29vZ2xlL2NhamEvc2VzL3JlcGFpckVTNS5qc1xuXG4gIC8qKlxuICAgKiBUaGlzIGJsb2NrIHJlcGxhY2VzIHRoZSBvcmlnaW5hbCBGdW5jdGlvbiBjb25zdHJ1Y3RvciwgYW5kIHRoZSBvcmlnaW5hbFxuICAgKiAlR2VuZXJhdG9yRnVuY3Rpb24lICVBc3luY0Z1bmN0aW9uJSBhbmQgJUFzeW5jR2VuZXJhdG9yRnVuY3Rpb24lLCB3aXRoXG4gICAqIHNhZmUgcmVwbGFjZW1lbnRzIHRoYXQgdGhyb3cgaWYgaW52b2tlZC5cbiAgICpcbiAgICogVGhlc2UgYXJlIGFsbCByZWFjaGFibGUgdmlhIHN5bnRheCwgc28gaXQgaXNuJ3Qgc3VmZmljaWVudCB0byBqdXN0XG4gICAqIHJlcGxhY2UgZ2xvYmFsIHByb3BlcnRpZXMgd2l0aCBzYWZlIHZlcnNpb25zLiBPdXIgbWFpbiBnb2FsIGlzIHRvIHByZXZlbnRcbiAgICogYWNjZXNzIHRvIHRoZSBGdW5jdGlvbiBjb25zdHJ1Y3RvciB0aHJvdWdoIHRoZXNlIHN0YXJ0aW5nIHBvaW50cy5cblxuICAgKiBBZnRlciB0aGlzIGJsb2NrIGlzIGRvbmUsIHRoZSBvcmlnaW5hbHMgbXVzdCBubyBsb25nZXIgYmUgcmVhY2hhYmxlLCB1bmxlc3NcbiAgICogYSBjb3B5IGhhcyBiZWVuIG1hZGUsIGFuZCBmdW50aW9ucyBjYW4gb25seSBiZSBjcmVhdGVkIGJ5IHN5bnRheCAodXNpbmcgZXZhbClcbiAgICogb3IgYnkgaW52b2tpbmcgYSBwcmV2aW91c2x5IHNhdmVkIHJlZmVyZW5jZSB0byB0aGUgb3JpZ2luYWxzLlxuICAgKi9cbiAgLy8gdG9kbzogdGhpcyBmaWxlIHNob3VsZCBiZSBtb3ZlZCBvdXQgdG8gYSBzZXBhcmF0ZSByZXBvIGFuZCBucG0gbW9kdWxlLlxuICBmdW5jdGlvbiByZXBhaXJGdW5jdGlvbnMoKSB7XG4gICAgY29uc3QgeyBkZWZpbmVQcm9wZXJ0aWVzLCBnZXRQcm90b3R5cGVPZiwgc2V0UHJvdG90eXBlT2YgfSA9IE9iamVjdDtcblxuICAgIC8qKlxuICAgICAqIFRoZSBwcm9jZXNzIHRvIHJlcGFpciBjb25zdHJ1Y3RvcnM6XG4gICAgICogMS4gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBmdW5jdGlvbiBieSBldmFsdWF0aW5nIHN5bnRheFxuICAgICAqIDIuIE9idGFpbiB0aGUgcHJvdG90eXBlIGZyb20gdGhlIGluc3RhbmNlXG4gICAgICogMy4gQ3JlYXRlIGEgc3Vic3RpdHV0ZSB0YW1lZCBjb25zdHJ1Y3RvclxuICAgICAqIDQuIFJlcGxhY2UgdGhlIG9yaWdpbmFsIGNvbnN0cnVjdG9yIHdpdGggdGhlIHRhbWVkIGNvbnN0cnVjdG9yXG4gICAgICogNS4gUmVwbGFjZSB0YW1lZCBjb25zdHJ1Y3RvciBwcm90b3R5cGUgcHJvcGVydHkgd2l0aCB0aGUgb3JpZ2luYWwgb25lXG4gICAgICogNi4gUmVwbGFjZSBpdHMgW1tQcm90b3R5cGVdXSBzbG90IHdpdGggdGhlIHRhbWVkIGNvbnN0cnVjdG9yIG9mIEZ1bmN0aW9uXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVwYWlyRnVuY3Rpb24obmFtZSwgZGVjbGFyYXRpb24pIHtcbiAgICAgIGxldCBGdW5jdGlvbkluc3RhbmNlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5ldy1mdW5jXG4gICAgICAgIEZ1bmN0aW9uSW5zdGFuY2UgPSAoMCwgZXZhbCkoZGVjbGFyYXRpb24pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIFN5bnRheEVycm9yKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBmYWlsdXJlIG9uIHBsYXRmb3JtcyB3aGVyZSBhc3luYyBhbmQvb3IgZ2VuZXJhdG9yc1xuICAgICAgICAgIC8vIGFyZSBub3Qgc3VwcG9ydGVkLlxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZS10aHJvd1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgICAgY29uc3QgRnVuY3Rpb25Qcm90b3R5cGUgPSBnZXRQcm90b3R5cGVPZihGdW5jdGlvbkluc3RhbmNlKTtcbiAgICAgIGNvbnN0IG9sZEZ1bmN0aW9uQ29uc3RydWN0b3IgPSBGdW5jdGlvblByb3RvdHlwZS5jb25zdHJ1Y3RvcjtcblxuICAgICAgZnVuY3Rpb24gaXNSdW5uaW5nSW5SZWFsbXMoKSB7XG4gICAgICAgIGNvbnN0IGUgPSBuZXcgRXJyb3IoKS5zdGFjaztcbiAgICAgICAgaWYgKCFlKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGUuaW5kZXhPZignZXZhbCcpICE9PSAtMTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZlbnRzIHRoZSBldmFsdWF0aW9uIG9mIHNvdXJjZSB3aGVuIGNhbGxpbmcgY29uc3RydWN0b3Igb24gdGhlXG4gICAgICAvLyBwcm90b3R5cGUgb2YgZnVuY3Rpb25zLlxuICAgICAgY29uc3QgVGFtZWRGdW5jdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoaXNSdW5uaW5nSW5SZWFsbXMoKSkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ05vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gb2xkRnVuY3Rpb25Db25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgZGVmaW5lUHJvcGVydGllcyhUYW1lZEZ1bmN0aW9uLCB7IG5hbWU6IHsgdmFsdWU6IG5hbWUgfSB9KTtcblxuICAgICAgLy8gKG5ldyBFcnJvcigpKS5jb25zdHJ1Y3RvcnMgZG9lcyBub3QgaW5oZXJpdCBmcm9tIEZ1bmN0aW9uLCBiZWNhdXNlIEVycm9yXG4gICAgICAvLyB3YXMgZGVmaW5lZCBiZWZvcmUgRVM2IGNsYXNzZXMuIFNvIHdlIGRvbid0IG5lZWQgdG8gcmVwYWlyIGl0IHRvby5cblxuICAgICAgLy8gKEVycm9yKCkpLmNvbnN0cnVjdG9yIGluaGVyaXQgZnJvbSBGdW5jdGlvbiwgd2hpY2ggZ2V0cyBhIHRhbWVkXG4gICAgICAvLyBjb25zdHJ1Y3RvciBoZXJlLlxuXG4gICAgICAvLyB0b2RvOiBpbiBhbiBFUzYgY2xhc3MgdGhhdCBkb2VzIG5vdCBpbmhlcml0IGZyb20gYW55dGhpbmcsIHdoYXQgZG9lcyBpdHNcbiAgICAgIC8vIGNvbnN0cnVjdG9yIGluaGVyaXQgZnJvbT8gV2Ugd29ycnkgdGhhdCBpdCBpbmhlcml0cyBmcm9tIEZ1bmN0aW9uLCBpblxuICAgICAgLy8gd2hpY2ggY2FzZSBpbnN0YW5jZXMgY291bGQgZ2l2ZSBhY2Nlc3MgdG8gdW5zYWZlRnVuY3Rpb24uIG1hcmttIHNheXNcbiAgICAgIC8vIHdlJ3JlIGZpbmU6IHRoZSBjb25zdHJ1Y3RvciBpbmhlcml0cyBmcm9tIE9iamVjdC5wcm90b3R5cGVcblxuICAgICAgLy8gVGhpcyBsaW5lIHJlcGxhY2VzIHRoZSBvcmlnaW5hbCBjb25zdHJ1Y3RvciBpbiB0aGUgcHJvdG90eXBlIGNoYWluXG4gICAgICAvLyB3aXRoIHRoZSB0YW1lZCBvbmUuIE5vIGNvcHkgb2YgdGhlIG9yaWdpbmFsIGlzIHBlc2VydmVkLlxuICAgICAgZGVmaW5lUHJvcGVydGllcyhGdW5jdGlvblByb3RvdHlwZSwge1xuICAgICAgICBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogVGFtZWRGdW5jdGlvbiB9XG4gICAgICB9KTtcblxuICAgICAgLy8gVGhpcyBsaW5lIHNldHMgdGhlIHRhbWVkIGNvbnN0cnVjdG9yJ3MgcHJvdG90eXBlIGRhdGEgcHJvcGVydHkgdG9cbiAgICAgIC8vIHRoZSBvcmlnaW5hbCBvbmUuXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKFRhbWVkRnVuY3Rpb24sIHtcbiAgICAgICAgcHJvdG90eXBlOiB7IHZhbHVlOiBGdW5jdGlvblByb3RvdHlwZSB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKFRhbWVkRnVuY3Rpb24gIT09IEZ1bmN0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAvLyBFbnN1cmVzIHRoYXQgYWxsIGZ1bmN0aW9ucyBtZWV0IFwiaW5zdGFuY2VvZiBGdW5jdGlvblwiIGluIGEgcmVhbG0uXG4gICAgICAgIHNldFByb3RvdHlwZU9mKFRhbWVkRnVuY3Rpb24sIEZ1bmN0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3Rvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSGVyZSwgdGhlIG9yZGVyIG9mIG9wZXJhdGlvbiBpcyBpbXBvcnRhbnQ6IEZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJlcGFpcmVkXG4gICAgLy8gZmlyc3Qgc2luY2UgdGhlIG90aGVyIHJlcGFpcmVkIGNvbnN0cnVjdG9ycyBuZWVkIHRvIGluaGVyaXQgZnJvbSB0aGUgdGFtZWRcbiAgICAvLyBGdW5jdGlvbiBmdW5jdGlvbiBjb25zdHJ1Y3Rvci5cblxuICAgIC8vIG5vdGU6IHRoaXMgcmVhbGx5IHdhbnRzIHRvIGJlIHBhcnQgb2YgdGhlIHN0YW5kYXJkLCBiZWNhdXNlIG5ld1xuICAgIC8vIGNvbnN0cnVjdG9ycyBtYXkgYmUgYWRkZWQgaW4gdGhlIGZ1dHVyZSwgcmVhY2hhYmxlIGZyb20gc3ludGF4LCBhbmQgdGhpc1xuICAgIC8vIGxpc3QgbXVzdCBiZSB1cGRhdGVkIHRvIG1hdGNoLlxuXG4gICAgLy8gXCJwbGFpbiBhcnJvdyBmdW5jdGlvbnNcIiBpbmhlcml0IGZyb20gRnVuY3Rpb24ucHJvdG90eXBlXG5cbiAgICByZXBhaXJGdW5jdGlvbignRnVuY3Rpb24nLCAnKGZ1bmN0aW9uKCl7fSknKTtcbiAgICByZXBhaXJGdW5jdGlvbignR2VuZXJhdG9yRnVuY3Rpb24nLCAnKGZ1bmN0aW9uKigpe30pJyk7XG4gICAgcmVwYWlyRnVuY3Rpb24oJ0FzeW5jRnVuY3Rpb24nLCAnKGFzeW5jIGZ1bmN0aW9uKCl7fSknKTtcbiAgICByZXBhaXJGdW5jdGlvbignQXN5bmNHZW5lcmF0b3JGdW5jdGlvbicsICcoYXN5bmMgZnVuY3Rpb24qKCl7fSknKTtcbiAgfVxuXG4gIC8vIHRoaXMgbW9kdWxlIG11c3QgbmV2ZXIgYmUgaW1wb3J0YWJsZSBvdXRzaWRlIHRoZSBSZWFsbSBzaGltIGl0c2VsZlxuXG4gIC8vIEEgXCJjb250ZXh0XCIgaXMgYSBmcmVzaCB1bnNhZmUgUmVhbG0gYXMgZ2l2ZW4gdG8gdXMgYnkgZXhpc3RpbmcgcGxhdGZvcm1zLlxuICAvLyBXZSBuZWVkIHRoaXMgdG8gaW1wbGVtZW50IHRoZSBzaGltLiBIb3dldmVyLCB3aGVuIFJlYWxtcyBsYW5kIGZvciByZWFsLFxuICAvLyB0aGlzIGZlYXR1cmUgd2lsbCBiZSBwcm92aWRlZCBieSB0aGUgdW5kZXJseWluZyBlbmdpbmUgaW5zdGVhZC5cblxuICAvLyBub3RlOiBpbiBhIG5vZGUgbW9kdWxlLCB0aGUgdG9wLWxldmVsICd0aGlzJyBpcyBub3QgdGhlIGdsb2JhbCBvYmplY3RcbiAgLy8gKGl0J3MgKnNvbWV0aGluZyogYnV0IHdlIGFyZW4ndCBzdXJlIHdoYXQpLCBob3dldmVyIGFuIGluZGlyZWN0IGV2YWwgb2ZcbiAgLy8gJ3RoaXMnIHdpbGwgYmUgdGhlIGNvcnJlY3QgZ2xvYmFsIG9iamVjdC5cblxuICBjb25zdCB1bnNhZmVHbG9iYWxTcmMgPSBcIid1c2Ugc3RyaWN0JzsgdGhpc1wiO1xuICBjb25zdCB1bnNhZmVHbG9iYWxFdmFsU3JjID0gYCgwLCBldmFsKShcIid1c2Ugc3RyaWN0JzsgdGhpc1wiKWA7XG5cbiAgLy8gVGhpcyBtZXRob2QgaXMgb25seSBleHBvcnRlZCBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAgZnVuY3Rpb24gY3JlYXRlTmV3VW5zYWZlR2xvYmFsRm9yTm9kZSgpIHtcbiAgICAvLyBOb3RlIHRoYXQgd2VicGFjayBhbmQgb3RoZXJzIHdpbGwgc2hpbSAndm0nIGluY2x1ZGluZyB0aGUgbWV0aG9kXG4gICAgLy8gJ3J1bkluTmV3Q29udGV4dCcsIHNvIHRoZSBwcmVzZW5jZSBvZiB2bSBpcyBub3QgYSB1c2VmdWwgY2hlY2tcblxuICAgIC8vIFRPRE86IEZpbmQgYSBiZXR0ZXIgdGVzdCB0aGF0IHdvcmtzIHdpdGggYnVuZGxlcnNcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LWZ1bmNcbiAgICBjb25zdCBpc05vZGUgPSBuZXcgRnVuY3Rpb24oXG4gICAgICAndHJ5IHtyZXR1cm4gdGhpcz09PWdsb2JhbH1jYXRjaChlKXtyZXR1cm4gZmFsc2V9J1xuICAgICkoKTtcblxuICAgIGlmICghaXNOb2RlKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBnbG9iYWwtcmVxdWlyZVxuICAgIGNvbnN0IHZtID0gcmVxdWlyZSgndm0nKTtcblxuICAgIC8vIFVzZSB1bnNhZmVHbG9iYWxFdmFsU3JjIHRvIGVuc3VyZSB3ZSBnZXQgdGhlIHJpZ2h0ICd0aGlzJy5cbiAgICBjb25zdCB1bnNhZmVHbG9iYWwgPSB2bS5ydW5Jbk5ld0NvbnRleHQodW5zYWZlR2xvYmFsRXZhbFNyYyk7XG5cbiAgICByZXR1cm4gdW5zYWZlR2xvYmFsO1xuICB9XG5cbiAgLy8gVGhpcyBtZXRob2QgaXMgb25seSBleHBvcnRlZCBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAgZnVuY3Rpb24gY3JlYXRlTmV3VW5zYWZlR2xvYmFsRm9yQnJvd3NlcigpIHtcbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgY29uc3QgdW5zYWZlR2xvYmFsID0gaWZyYW1lLmNvbnRlbnRXaW5kb3cuZXZhbCh1bnNhZmVHbG9iYWxTcmMpO1xuXG4gICAgLy8gV2Uga2VlcCB0aGUgaWZyYW1lIGF0dGFjaGVkIHRvIHRoZSBET00gYmVjYXVzZSByZW1vdmluZyBpdFxuICAgIC8vIGNhdXNlcyBpdHMgZ2xvYmFsIG9iamVjdCB0byBsb3NlIGludHJpbnNpY3MsIGl0cyBldmFsKClcbiAgICAvLyBmdW5jdGlvbiB0byBldmFsdWF0ZSBjb2RlLCBldGMuXG5cbiAgICAvLyBUT0RPOiBjYW4gd2UgcmVtb3ZlIGFuZCBnYXJiYWdlLWNvbGxlY3QgdGhlIGlmcmFtZXM/XG5cbiAgICByZXR1cm4gdW5zYWZlR2xvYmFsO1xuICB9XG5cbiAgY29uc3QgZ2V0TmV3VW5zYWZlR2xvYmFsID0gKCkgPT4ge1xuICAgIGNvbnN0IG5ld1Vuc2FmZUdsb2JhbEZvckJyb3dzZXIgPSBjcmVhdGVOZXdVbnNhZmVHbG9iYWxGb3JCcm93c2VyKCk7XG4gICAgY29uc3QgbmV3VW5zYWZlR2xvYmFsRm9yTm9kZSA9IGNyZWF0ZU5ld1Vuc2FmZUdsb2JhbEZvck5vZGUoKTtcbiAgICBpZiAoXG4gICAgICAoIW5ld1Vuc2FmZUdsb2JhbEZvckJyb3dzZXIgJiYgIW5ld1Vuc2FmZUdsb2JhbEZvck5vZGUpIHx8XG4gICAgICAobmV3VW5zYWZlR2xvYmFsRm9yQnJvd3NlciAmJiBuZXdVbnNhZmVHbG9iYWxGb3JOb2RlKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmV4cGVjdGVkIHBsYXRmb3JtLCB1bmFibGUgdG8gY3JlYXRlIFJlYWxtJyk7XG4gICAgfVxuICAgIHJldHVybiBuZXdVbnNhZmVHbG9iYWxGb3JCcm93c2VyIHx8IG5ld1Vuc2FmZUdsb2JhbEZvck5vZGU7XG4gIH07XG5cbiAgLy8gVGhlIHVuc2FmZVJlYyBpcyBzaGltLXNwZWNpZmljLiBJdCBhY3RzIGFzIHRoZSBtZWNoYW5pc20gdG8gb2J0YWluIGEgZnJlc2hcbiAgLy8gc2V0IG9mIGludHJpbnNpY3MgdG9nZXRoZXIgd2l0aCB0aGVpciBhc3NvY2lhdGVkIGV2YWwgYW5kIEZ1bmN0aW9uXG4gIC8vIGV2YWx1YXRvcnMuIFRoZXNlIG11c3QgYmUgdXNlZCBhcyBhIG1hdGNoZWQgc2V0LCBzaW5jZSB0aGUgZXZhbHVhdG9ycyBhcmVcbiAgLy8gdGllZCB0byBhIHNldCBvZiBpbnRyaW5zaWNzLCBha2EgdGhlIFwidW5kZW5pYWJsZXNcIi4gSWYgaXQgd2VyZSBwb3NzaWJsZSB0b1xuICAvLyBtaXgtYW5kLW1hdGNoIHRoZW0gZnJvbSBkaWZmZXJlbnQgY29udGV4dHMsIHRoYXQgd291bGQgZW5hYmxlIHNvbWVcbiAgLy8gYXR0YWNrcy5cbiAgZnVuY3Rpb24gY3JlYXRlVW5zYWZlUmVjKHVuc2FmZUdsb2JhbCwgYWxsU2hpbXMgPSBbXSkge1xuICAgIGNvbnN0IHNoYXJlZEdsb2JhbERlc2NzID0gZ2V0U2hhcmVkR2xvYmFsRGVzY3ModW5zYWZlR2xvYmFsKTtcblxuICAgIHJldHVybiBmcmVlemUoe1xuICAgICAgdW5zYWZlR2xvYmFsLFxuICAgICAgc2hhcmVkR2xvYmFsRGVzY3MsXG4gICAgICB1bnNhZmVFdmFsOiB1bnNhZmVHbG9iYWwuZXZhbCxcbiAgICAgIHVuc2FmZUZ1bmN0aW9uOiB1bnNhZmVHbG9iYWwuRnVuY3Rpb24sXG4gICAgICBhbGxTaGltc1xuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgcmVwYWlyQWNjZXNzb3JzU2hpbSA9IGNsZWFudXBTb3VyY2UoXG4gICAgYFwidXNlIHN0cmljdFwiOyAoJHtyZXBhaXJBY2Nlc3NvcnN9KSgpO2BcbiAgKTtcbiAgY29uc3QgcmVwYWlyRnVuY3Rpb25zU2hpbSA9IGNsZWFudXBTb3VyY2UoXG4gICAgYFwidXNlIHN0cmljdFwiOyAoJHtyZXBhaXJGdW5jdGlvbnN9KSgpO2BcbiAgKTtcblxuICAvLyBDcmVhdGUgYSBuZXcgdW5zYWZlUmVjIGZyb20gYSBicmFuZCBuZXcgY29udGV4dCwgd2l0aCBuZXcgaW50cmluc2ljcyBhbmQgYVxuICAvLyBuZXcgZ2xvYmFsIG9iamVjdFxuICBmdW5jdGlvbiBjcmVhdGVOZXdVbnNhZmVSZWMoYWxsU2hpbXMpIHtcbiAgICBjb25zdCB1bnNhZmVHbG9iYWwgPSBnZXROZXdVbnNhZmVHbG9iYWwoKTtcbiAgICB1bnNhZmVHbG9iYWwuZXZhbChyZXBhaXJBY2Nlc3NvcnNTaGltKTtcbiAgICB1bnNhZmVHbG9iYWwuZXZhbChyZXBhaXJGdW5jdGlvbnNTaGltKTtcbiAgICByZXR1cm4gY3JlYXRlVW5zYWZlUmVjKHVuc2FmZUdsb2JhbCwgYWxsU2hpbXMpO1xuICB9XG5cbiAgLy8gQ3JlYXRlIGEgbmV3IHVuc2FmZVJlYyBmcm9tIHRoZSBjdXJyZW50IGNvbnRleHQsIHdoZXJlIHRoZSBSZWFsbSBzaGltIGlzXG4gIC8vIGJlaW5nIHBhcnNlZCBhbmQgZXhlY3V0ZWQsIGFrYSB0aGUgXCJQcmltYWwgUmVhbG1cIlxuICBmdW5jdGlvbiBjcmVhdGVDdXJyZW50VW5zYWZlUmVjKCkge1xuICAgIGNvbnN0IHVuc2FmZUdsb2JhbCA9ICgwLCBldmFsKSh1bnNhZmVHbG9iYWxTcmMpO1xuICAgIHJlcGFpckFjY2Vzc29ycygpO1xuICAgIHJlcGFpckZ1bmN0aW9ucygpO1xuICAgIHJldHVybiBjcmVhdGVVbnNhZmVSZWModW5zYWZlR2xvYmFsKTtcbiAgfVxuXG4gIC8vIHRvZG86IHRoaW5rIGFib3V0IGhvdyB0aGlzIGludGVyYWN0cyB3aXRoIGVuZG93bWVudHMsIGNoZWNrIGZvciBjb25mbGljdHNcbiAgLy8gYmV0d2VlbiB0aGUgbmFtZXMgYmVpbmcgb3B0aW1pemVkIGFuZCB0aGUgb25lcyBhZGRlZCBieSBlbmRvd21lbnRzXG5cbiAgLyoqXG4gICAqIFNpbXBsaWZpZWQgdmFsaWRhdGlvbiBvZiBpbmRlbnRpZmllciBuYW1lczogbWF5IG9ubHkgY29udGFpbiBhbHBoYW51bWVyaWNcbiAgICogY2hhcmFjdGVycyAob3IgXCIkXCIgb3IgXCJfXCIpLCBhbmQgbWF5IG5vdCBzdGFydCB3aXRoIGEgZGlnaXQuIFRoaXMgaXMgc2FmZVxuICAgKiBhbmQgZG9lcyBub3QgcmVkdWNlcyB0aGUgY29tcGF0aWJpbGl0eSBvZiB0aGUgc2hpbS4gVGhlIG1vdGl2YXRpb24gZm9yXG4gICAqIHRoaXMgbGltaXRhdGlvbiB3YXMgdG8gZGVjcmVhc2UgdGhlIGNvbXBsZXhpdHkgb2YgdGhlIGltcGxlbWVudGF0aW9uLFxuICAgKiBhbmQgdG8gbWFpbnRhaW4gYSByZXNvbmFibGUgbGV2ZWwgb2YgcGVyZm9ybWFuY2UuXG4gICAqIE5vdGU6IFxcdyBpcyBlcXVpdmFsZW50IFthLXpBLVpfMC05XVxuICAgKiBTZWUgMTEuNi4xIElkZW50aWZpZXIgTmFtZXNcbiAgICovXG4gIGNvbnN0IGlkZW50aWZpZXJQYXR0ZXJuID0gL15bYS16QS1aXyRdW1xcdyRdKiQvO1xuXG4gIC8qKlxuICAgKiBJbiBKYXZhU2NyaXB0IHlvdSBjYW5ub3QgdXNlIHRoZXNlIHJlc2VydmVkIHdvcmRzIGFzIHZhcmlhYmxlcy5cbiAgICogU2VlIDExLjYuMSBJZGVudGlmaWVyIE5hbWVzXG4gICAqL1xuICBjb25zdCBrZXl3b3JkcyA9IG5ldyBTZXQoW1xuICAgIC8vIDExLjYuMi4xIEtleXdvcmRzXG4gICAgJ2F3YWl0JyxcbiAgICAnYnJlYWsnLFxuICAgICdjYXNlJyxcbiAgICAnY2F0Y2gnLFxuICAgICdjbGFzcycsXG4gICAgJ2NvbnN0JyxcbiAgICAnY29udGludWUnLFxuICAgICdkZWJ1Z2dlcicsXG4gICAgJ2RlZmF1bHQnLFxuICAgICdkZWxldGUnLFxuICAgICdkbycsXG4gICAgJ2Vsc2UnLFxuICAgICdleHBvcnQnLFxuICAgICdleHRlbmRzJyxcbiAgICAnZmluYWxseScsXG4gICAgJ2ZvcicsXG4gICAgJ2Z1bmN0aW9uJyxcbiAgICAnaWYnLFxuICAgICdpbXBvcnQnLFxuICAgICdpbicsXG4gICAgJ2luc3RhbmNlb2YnLFxuICAgICduZXcnLFxuICAgICdyZXR1cm4nLFxuICAgICdzdXBlcicsXG4gICAgJ3N3aXRjaCcsXG4gICAgJ3RoaXMnLFxuICAgICd0aHJvdycsXG4gICAgJ3RyeScsXG4gICAgJ3R5cGVvZicsXG4gICAgJ3ZhcicsXG4gICAgJ3ZvaWQnLFxuICAgICd3aGlsZScsXG4gICAgJ3dpdGgnLFxuICAgICd5aWVsZCcsXG5cbiAgICAvLyBBbHNvIHJlc2VydmVkIHdoZW4gcGFyc2luZyBzdHJpY3QgbW9kZSBjb2RlXG4gICAgJ2xldCcsXG4gICAgJ3N0YXRpYycsXG5cbiAgICAvLyAxMS42LjIuMiBGdXR1cmUgUmVzZXJ2ZWQgV29yZHNcbiAgICAnZW51bScsXG5cbiAgICAvLyBBbHNvIHJlc2VydmVkIHdoZW4gcGFyc2luZyBzdHJpY3QgbW9kZSBjb2RlXG4gICAgJ2ltcGxlbWVudHMnLFxuICAgICdwYWNrYWdlJyxcbiAgICAncHJvdGVjdGVkJyxcbiAgICAnaW50ZXJmYWNlJyxcbiAgICAncHJpdmF0ZScsXG4gICAgJ3B1YmxpYycsXG5cbiAgICAvLyBSZXNlcnZlZCBidXQgbm90IG1lbnRpb25lZCBpbiBzcGVjc1xuICAgICdhd2FpdCcsXG5cbiAgICAnbnVsbCcsXG4gICAgJ3RydWUnLFxuICAgICdmYWxzZScsXG5cbiAgICAndGhpcycsXG4gICAgJ2FyZ3VtZW50cydcbiAgXSk7XG5cbiAgLyoqXG4gICAqIGdldE9wdGltaXphYmxlR2xvYmFscygpXG4gICAqIFdoYXQgdmFyaWFibGUgbmFtZXMgbWlnaHQgaXQgYnJpbmcgaW50byBzY29wZT8gVGhlc2UgaW5jbHVkZSBhbGxcbiAgICogcHJvcGVydHkgbmFtZXMgd2hpY2ggY2FuIGJlIHZhcmlhYmxlIG5hbWVzLCBpbmNsdWRpbmcgdGhlIG5hbWVzXG4gICAqIG9mIGluaGVyaXRlZCBwcm9wZXJ0aWVzLiBJdCBleGNsdWRlcyBzeW1ib2xzIGFuZCBuYW1lcyB3aGljaCBhcmVcbiAgICoga2V5d29yZHMuIFdlIGRyb3Agc3ltYm9scyBzYWZlbHkuIEN1cnJlbnRseSwgdGhpcyBzaGltIHJlZnVzZXNcbiAgICogc2VydmljZSBpZiBhbnkgb2YgdGhlIG5hbWVzIGFyZSBrZXl3b3JkcyBvciBrZXl3b3JkLWxpa2UuIFRoaXMgaXNcbiAgICogc2FmZSBhbmQgb25seSBwcmV2ZW50IHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIGdldE9wdGltaXphYmxlR2xvYmFscyhzYWZlR2xvYmFsKSB7XG4gICAgY29uc3QgZGVzY3MgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHNhZmVHbG9iYWwpO1xuXG4gICAgLy8gZ2V0T3duUHJvcGVydHlOYW1lcyBkb2VzIGlnbm9yZSBTeW1ib2xzIHNvIHdlIGRvbid0IG5lZWQgdGhpcyBleHRyYSBjaGVjazpcbiAgICAvLyB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgJiZcbiAgICBjb25zdCBjb25zdGFudHMgPSBhcnJheUZpbHRlcihnZXRPd25Qcm9wZXJ0eU5hbWVzKGRlc2NzKSwgbmFtZSA9PiB7XG4gICAgICAvLyBFbnN1cmUgd2UgaGF2ZSBhIHZhbGlkIGlkZW50aWZpZXIuIFdlIHVzZSByZWdleHBUZXN0IHJhdGhlciB0aGFuXG4gICAgICAvLyAvLi4vLnRlc3QoKSB0byBndWFyZCBhZ2FpbnN0IHRoZSBjYXNlIHdoZXJlIFJlZ0V4cCBoYXMgYmVlbiBwb2lzb25lZC5cbiAgICAgIGlmIChcbiAgICAgICAgbmFtZSA9PT0gJ2V2YWwnIHx8XG4gICAgICAgIGtleXdvcmRzLmhhcyhuYW1lKSB8fFxuICAgICAgICAhcmVnZXhwVGVzdChpZGVudGlmaWVyUGF0dGVybiwgbmFtZSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRlc2MgPSBkZXNjc1tuYW1lXTtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBnZXR0ZXJzIHdpbGwgbm90IGhhdmUgLndyaXRhYmxlLCBkb24ndCBsZXQgdGhlIGZhbHN5bmVzcyBvZlxuICAgICAgICAvLyAndW5kZWZpbmVkJyB0cmljayB1czogdGVzdCB3aXRoID09PSBmYWxzZSwgbm90ICEgLiBIb3dldmVyIGRlc2NyaXB0b3JzXG4gICAgICAgIC8vIGluaGVyaXQgZnJvbSB0aGUgKHBvdGVudGlhbGx5IHBvaXNvbmVkKSBnbG9iYWwgb2JqZWN0LCBzbyB3ZSBtaWdodCBzZWVcbiAgICAgICAgLy8gZXh0cmEgcHJvcGVydGllcyB3aGljaCB3ZXJlbid0IHJlYWxseSB0aGVyZS4gQWNjZXNzb3IgcHJvcGVydGllcyBoYXZlXG4gICAgICAgIC8vICdnZXQvc2V0L2VudW1lcmFibGUvY29uZmlndXJhYmxlJywgd2hpbGUgZGF0YSBwcm9wZXJ0aWVzIGhhdmVcbiAgICAgICAgLy8gJ3ZhbHVlL3dyaXRhYmxlL2VudW1lcmFibGUvY29uZmlndXJhYmxlJy5cbiAgICAgICAgZGVzYy5jb25maWd1cmFibGUgPT09IGZhbHNlICYmXG4gICAgICAgIGRlc2Mud3JpdGFibGUgPT09IGZhbHNlICYmXG4gICAgICAgIC8vXG4gICAgICAgIC8vIENoZWNrcyBmb3IgZGF0YSBwcm9wZXJ0aWVzIGJlY2F1c2UgdGhleSdyZSB0aGUgb25seSBvbmVzIHdlIGNhblxuICAgICAgICAvLyBvcHRpbWl6ZSAoYWNjZXNzb3JzIGFyZSBtb3N0IGxpa2VseSBub24tY29uc3RhbnQpLiBEZXNjcmlwdG9ycyBjYW4ndFxuICAgICAgICAvLyBjYW4ndCBoYXZlIGFjY2Vzc29ycyBhbmQgdmFsdWUgcHJvcGVydGllcyBhdCB0aGUgc2FtZSB0aW1lLCB0aGVyZWZvcmVcbiAgICAgICAgLy8gdGhpcyBjaGVjayBpcyBzdWZmaWNpZW50LiBVc2luZyBleHBsaWNpdCBvd24gcHJvcGVydHkgZGVhbCB3aXRoIHRoZVxuICAgICAgICAvLyBjYXNlIHdoZXJlIE9iamVjdC5wcm90b3R5cGUgaGFzIGJlZW4gcG9pc29uZWQuXG4gICAgICAgIG9iamVjdEhhc093blByb3BlcnR5KGRlc2MsICd2YWx1ZScpXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNvbnN0YW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBhbHdheXNUaHJvd0hhbmRsZXIgaXMgYSBwcm94eSBoYW5kbGVyIHdoaWNoIHRocm93cyBvbiBhbnkgdHJhcCBjYWxsZWQuXG4gICAqIEl0J3MgbWFkZSBmcm9tIGEgcHJveHkgd2l0aCBhIGdldCB0cmFwIHRoYXQgdGhyb3dzLiBJdHMgdGFyZ2V0IGlzXG4gICAqIGFuIGltbXV0YWJsZSAoZnJvemVuKSBvYmplY3QgYW5kIGlzIHNhZmUgdG8gc2hhcmUuXG4gICAqL1xuICBjb25zdCBhbHdheXNUaHJvd0hhbmRsZXIgPSBuZXcgUHJveHkoZnJlZXplKHt9KSwge1xuICAgIGdldCh0YXJnZXQsIHByb3ApIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYHVuZXhwZWN0ZWQgc2NvcGUgaGFuZGxlciB0cmFwIGNhbGxlZDogJHtwcm9wfWAsXG4gICAgICAgIG5ldyBFcnJvcigpLnN0YWNrXG4gICAgICApO1xuICAgICAgLy8gdGhyb3dUYW50cnVtKGB1bmV4cGVjdGVkIHNjb3BlIGhhbmRsZXIgdHJhcCBjYWxsZWQ6ICR7cHJvcH1gKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBTY29wZUhhbmRsZXIgbWFuYWdlcyBhIFByb3h5IHdoaWNoIHNlcnZlcyBhcyB0aGUgZ2xvYmFsIHNjb3BlIGZvciB0aGVcbiAgICogc2FmZUV2YWx1YXRvciBvcGVyYXRpb24gKHRoZSBQcm94eSBpcyB0aGUgYXJndW1lbnQgb2YgYSAnd2l0aCcgYmluZGluZykuXG4gICAqIEFzIGRlc2NyaWJlZCBpbiBjcmVhdGVTYWZlRXZhbHVhdG9yKCksIGl0IGhhcyBzZXZlcmFsIGZ1bmN0aW9uczpcbiAgICogLSBhbGxvdyB0aGUgdmVyeSBmaXJzdCAoYW5kIG9ubHkgdGhlIHZlcnkgZmlyc3QpIHVzZSBvZiAnZXZhbCcgdG8gbWFwIHRvXG4gICAqICAgdGhlIHJlYWwgKHVuc2FmZSkgZXZhbCBmdW5jdGlvbiwgc28gaXQgYWN0cyBhcyBhICdkaXJlY3QgZXZhbCcgYW5kIGNhblxuICAgKiAgICBhY2Nlc3MgaXRzIGxleGljYWwgc2NvcGUgKHdoaWNoIG1hcHMgdG8gdGhlICd3aXRoJyBiaW5kaW5nLCB3aGljaCB0aGVcbiAgICogICBTY29wZUhhbmRsZXIgYWxzbyBjb250cm9scykuXG4gICAqIC0gZW5zdXJlIHRoYXQgYWxsIHN1YnNlcXVlbnQgdXNlcyBvZiAnZXZhbCcgbWFwIHRvIHRoZSBzYWZlRXZhbHVhdG9yLFxuICAgKiAgIHdoaWNoIGxpdmVzIGFzIHRoZSAnZXZhbCcgcHJvcGVydHkgb2YgdGhlIHNhZmVHbG9iYWwuXG4gICAqIC0gcm91dGUgYWxsIG90aGVyIHByb3BlcnR5IGxvb2t1cHMgYXQgdGhlIHNhZmVHbG9iYWwuXG4gICAqIC0gaGlkZSB0aGUgdW5zYWZlR2xvYmFsIHdoaWNoIGxpdmVzIG9uIHRoZSBzY29wZSBjaGFpbiBhYm92ZSB0aGUgJ3dpdGgnLlxuICAgKiAtIGVuc3VyZSB0aGUgUHJveHkgaW52YXJpYW50cyBkZXNwaXRlIHNvbWUgZ2xvYmFsIHByb3BlcnRpZXMgYmVpbmcgZnJvemVuLlxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlU2NvcGVIYW5kbGVyKHVuc2FmZVJlYywgc2FmZUdsb2JhbCkge1xuICAgIGNvbnN0IHsgdW5zYWZlR2xvYmFsLCB1bnNhZmVFdmFsIH0gPSB1bnNhZmVSZWM7XG5cbiAgICAvLyBUaGlzIGZsYWcgYWxsb3cgdXMgdG8gZGV0ZXJtaW5lIGlmIHRoZSBldmFsKCkgY2FsbCBpcyBhbiBkb25lIGJ5IHRoZVxuICAgIC8vIHJlYWxtJ3MgY29kZSBvciBpZiBpdCBpcyB1c2VyLWxhbmQgaW52b2NhdGlvbiwgc28gd2UgY2FuIHJlYWN0IGRpZmZlcmVudGx5LlxuICAgIGxldCB1c2VVbnNhZmVFdmFsdWF0b3IgPSBmYWxzZTtcbiAgICAvLyBUaGlzIGZsYWcgYWxsb3cgdXMgdG8gYWxsb3cgdW5kZWZpbmVkIGFzc2lnbm1lbnRzIGluIG5vbi1zdHJpY3QgbW9kZS5cbiAgICAvLyBXaGVuIHRoZSBjb3VudGVyIGNvdW50IGRvd24gdG8gNCwgd2UgYWxsb3cgaXQgb25jZTtcbiAgICBsZXQgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzID0gMDtcblxuICAgIHJldHVybiB7XG4gICAgICAvLyBUaGUgc2NvcGUgaGFuZGxlciB0aHJvd3MgaWYgYW55IHRyYXAgb3RoZXIgdGhhbiBnZXQvc2V0L2hhcyBhcmUgcnVuXG4gICAgICAvLyAoZS5nLiBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzLCBhcHBseSwgZ2V0UHJvdG90eXBlT2YpLlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXByb3RvXG4gICAgICBfX3Byb3RvX186IGFsd2F5c1Rocm93SGFuZGxlcixcblxuICAgICAgYWxsb3dVbnNhZmVFdmFsdWF0b3JPbmNlKCkge1xuICAgICAgICB1c2VVbnNhZmVFdmFsdWF0b3IgPSB0cnVlO1xuICAgICAgfSxcblxuICAgICAgbm9uU3RyaWN0TW9kZUFzc2lnbm1lbnRBbGxvd2VkKCkge1xuICAgICAgICByZXR1cm4gYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzID09PSAzO1xuICAgICAgfSxcblxuICAgICAgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudCh0aW1lcyA9IDEpIHtcbiAgICAgICAgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzID0gdGltZXM7XG4gICAgICB9LFxuXG4gICAgICBoYXNOb25TdHJpY3RNb2RlQXNzaWduZWQoKSB7XG4gICAgICAgIGFsbG93Tm9uU3RyaWN0TW9kZUFzc2lnbm1lbnRUaW1lcyA9IE1hdGgubWF4KFxuICAgICAgICAgIDAsXG4gICAgICAgICAgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzIC0gMVxuICAgICAgICApO1xuICAgICAgfSxcblxuICAgICAgdW5zYWZlRXZhbHVhdG9yQWxsb3dlZCgpIHtcbiAgICAgICAgcmV0dXJuIHVzZVVuc2FmZUV2YWx1YXRvcjtcbiAgICAgIH0sXG5cbiAgICAgIGdldCh0YXJnZXQsIHByb3ApIHtcbiAgICAgICAgLy8gU3BlY2lhbCB0cmVhdG1lbnQgZm9yIGV2YWwuIFRoZSB2ZXJ5IGZpcnN0IGxvb2t1cCBvZiAnZXZhbCcgZ2V0cyB0aGVcbiAgICAgICAgLy8gdW5zYWZlIChyZWFsIGRpcmVjdCkgZXZhbCwgc28gaXQgd2lsbCBnZXQgdGhlIGxleGljYWwgc2NvcGUgdGhhdCB1c2VzXG4gICAgICAgIC8vIHRoZSAnd2l0aCcgY29udGV4dC5cbiAgICAgICAgaWYgKHByb3AgPT09ICdldmFsJykge1xuICAgICAgICAgIC8vIHRlc3QgdGhhdCBpdCBpcyB0cnVlIHJhdGhlciB0aGFuIG1lcmVseSB0cnV0aHlcbiAgICAgICAgICBpZiAodXNlVW5zYWZlRXZhbHVhdG9yID09PSB0cnVlKSB7XG4gICAgICAgICAgICAvLyByZXZva2UgYmVmb3JlIHVzZVxuICAgICAgICAgICAgdXNlVW5zYWZlRXZhbHVhdG9yID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdW5zYWZlRXZhbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRhcmdldC5ldmFsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdG9kbzogc2hpbSBpbnRlZ3JpdHksIGNhcHR1cmUgU3ltYm9sLnVuc2NvcGFibGVzXG4gICAgICAgIGlmIChwcm9wID09PSBTeW1ib2wudW5zY29wYWJsZXMpIHtcbiAgICAgICAgICAvLyBTYWZlIHRvIHJldHVybiBhIHByaW1hbCByZWFsbSBPYmplY3QgaGVyZSBiZWNhdXNlIHRoZSBvbmx5IGNvZGUgdGhhdFxuICAgICAgICAgIC8vIGNhbiBkbyBhIGdldCgpIG9uIGEgbm9uLXN0cmluZyBpcyB0aGUgaW50ZXJuYWxzIG9mIHdpdGgoKSBpdHNlbGYsXG4gICAgICAgICAgLy8gYW5kIHRoZSBvbmx5IHRoaW5nIGl0IGRvZXMgaXMgdG8gbG9vayBmb3IgcHJvcGVydGllcyBvbiBpdC4gVXNlclxuICAgICAgICAgIC8vIGNvZGUgY2Fubm90IGRvIGEgbG9va3VwIG9uIG5vbi1zdHJpbmdzLlxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcm9wZXJ0aWVzIG9mIHRoZSBnbG9iYWwuXG4gICAgICAgIGlmIChwcm9wIGluIHRhcmdldCkge1xuICAgICAgICAgIHJldHVybiB0YXJnZXRbcHJvcF07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2ZW50IHRoZSBsb29rdXAgZm9yIG90aGVyIHByb3BlcnRpZXMuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9LFxuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY2xhc3MtbWV0aG9kcy11c2UtdGhpc1xuICAgICAgc2V0KHRhcmdldCwgcHJvcCwgdmFsdWUpIHtcbiAgICAgICAgLy8gdG9kbzogYWxsb3cgbW9kaWZpY2F0aW9ucyB3aGVuIHRhcmdldC5oYXNPd25Qcm9wZXJ0eShwcm9wKSBhbmQgaXRcbiAgICAgICAgLy8gaXMgd3JpdGFibGUsIGFzc3VtaW5nIHdlJ3ZlIGFscmVhZHkgcmVqZWN0ZWQgb3ZlcmxhcCAoc2VlXG4gICAgICAgIC8vIGNyZWF0ZVNhZmVFdmFsdWF0b3JGYWN0b3J5LmZhY3RvcnkpLiBUaGlzIFR5cGVFcnJvciBnZXRzIHJlcGxhY2VkIHdpdGhcbiAgICAgICAgLy8gdGFyZ2V0W3Byb3BdID0gdmFsdWVcbiAgICAgICAgaWYgKG9iamVjdEhhc093blByb3BlcnR5KHRhcmdldCwgcHJvcCkpIHtcbiAgICAgICAgICAvLyB0b2RvOiBzaGltIGludGVncml0eTogVHlwZUVycm9yLCBTdHJpbmdcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBkbyBub3QgbW9kaWZ5IGVuZG93bWVudHMgbGlrZSAke1N0cmluZyhwcm9wKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNhZmVHbG9iYWxbcHJvcF0gPSB2YWx1ZTtcblxuICAgICAgICAvLyBSZXR1cm4gdHJ1ZSBhZnRlciBzdWNjZXNzZnVsIHNldC5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuXG4gICAgICAvLyB3ZSBuZWVkIGhhcygpIHRvIHJldHVybiBmYWxzZSBmb3Igc29tZSBuYW1lcyB0byBwcmV2ZW50IHRoZSBsb29rdXAgIGZyb21cbiAgICAgIC8vIGNsaW1iaW5nIHRoZSBzY29wZSBjaGFpbiBhbmQgZXZlbnR1YWxseSByZWFjaGluZyB0aGUgdW5zYWZlR2xvYmFsXG4gICAgICAvLyBvYmplY3QsIHdoaWNoIGlzIGJhZC5cblxuICAgICAgLy8gbm90ZTogdW5zY29wYWJsZXMhIGV2ZXJ5IHN0cmluZyBpbiBPYmplY3RbU3ltYm9sLnVuc2NvcGFibGVzXVxuXG4gICAgICAvLyB0b2RvOiB3ZSdkIGxpa2UgdG8ganVzdCBoYXZlIGhhcygpIHJldHVybiB0cnVlIGZvciBldmVyeXRoaW5nLCBhbmQgdGhlblxuICAgICAgLy8gdXNlIGdldCgpIHRvIHJhaXNlIGEgUmVmZXJlbmNlRXJyb3IgZm9yIGFueXRoaW5nIG5vdCBvbiB0aGUgc2FmZSBnbG9iYWwuXG4gICAgICAvLyBCdXQgd2Ugd2FudCB0byBiZSBjb21wYXRpYmxlIHdpdGggUmVmZXJlbmNlRXJyb3IgaW4gdGhlIG5vcm1hbCBjYXNlIGFuZFxuICAgICAgLy8gdGhlIGxhY2sgb2YgUmVmZXJlbmNlRXJyb3IgaW4gdGhlICd0eXBlb2YnIGNhc2UuIE11c3QgZWl0aGVyIHJlbGlhYmx5XG4gICAgICAvLyBkaXN0aW5ndWlzaCB0aGVzZSB0d28gY2FzZXMgKHRoZSB0cmFwIGJlaGF2aW9yIG1pZ2h0IGJlIGRpZmZlcmVudCksIG9yXG4gICAgICAvLyB3ZSByZWx5IG9uIGEgbWFuZGF0b3J5IHNvdXJjZS10by1zb3VyY2UgdHJhbnNmb3JtIHRvIGNoYW5nZSAndHlwZW9mIGFiYydcbiAgICAgIC8vIHRvIFhYWC4gV2UgYWxyZWFkeSBuZWVkIGEgbWFuZGF0b3J5IHBhcnNlIHRvIHByZXZlbnQgdGhlICdpbXBvcnQnLFxuICAgICAgLy8gc2luY2UgaXQncyBhIHNwZWNpYWwgZm9ybSBpbnN0ZWFkIG9mIG1lcmVseSBiZWluZyBhIGdsb2JhbCB2YXJpYWJsZS9cblxuICAgICAgLy8gbm90ZTogaWYgd2UgbWFrZSBoYXMoKSByZXR1cm4gdHJ1ZSBhbHdheXMsIHRoZW4gd2UgbXVzdCBpbXBsZW1lbnQgYVxuICAgICAgLy8gc2V0KCkgdHJhcCB0byBhdm9pZCBzdWJ2ZXJ0aW5nIHRoZSBwcm90ZWN0aW9uIG9mIHN0cmljdCBtb2RlIChpdCB3b3VsZFxuICAgICAgLy8gYWNjZXB0IGFzc2lnbm1lbnRzIHRvIHVuZGVmaW5lZCBnbG9iYWxzLCB3aGVuIGl0IG91Z2h0IHRvIHRocm93XG4gICAgICAvLyBSZWZlcmVuY2VFcnJvciBmb3Igc3VjaCBhc3NpZ25tZW50cylcblxuICAgICAgaGFzKHRhcmdldCwgcHJvcCkge1xuICAgICAgICBpZiAodGhpcy5ub25TdHJpY3RNb2RlQXNzaWdubWVudEFsbG93ZWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIHByb3hpZXMgc3RyaW5naWZ5ICdwcm9wJywgc28gbm8gVE9DVFRPVSBkYW5nZXIgaGVyZVxuXG4gICAgICAgIC8vIHVuc2FmZUdsb2JhbDogaGlkZSBhbGwgcHJvcGVydGllcyBvZiB1bnNhZmVHbG9iYWwgYXQgdGhlXG4gICAgICAgIC8vIGV4cGVuc2Ugb2YgJ3R5cGVvZicgYmVpbmcgd3JvbmcgZm9yIHRob3NlIHByb3BlcnRpZXMuIEZvclxuICAgICAgICAvLyBleGFtcGxlLCBpbiB0aGUgYnJvd3NlciwgZXZhbHVhdGluZyAnZG9jdW1lbnQgPSAzJywgd2lsbCBhZGRcbiAgICAgICAgLy8gYSBwcm9wZXJ0eSB0byBzYWZlR2xvYmFsIGluc3RlYWQgb2YgdGhyb3dpbmcgYVxuICAgICAgICAvLyBSZWZlcmVuY2VFcnJvci5cbiAgICAgICAgaWYgKHByb3AgPT09ICdldmFsJyB8fCBwcm9wIGluIHRhcmdldCB8fCBwcm9wIGluIHVuc2FmZUdsb2JhbCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzkuMC9pbmRleC5odG1sI3NlYy1odG1sLWxpa2UtY29tbWVudHNcblxuICAvLyBUaGUgc2hpbSBjYW5ub3QgY29ycmVjdGx5IGVtdWxhdGUgYSBkaXJlY3QgZXZhbCBhcyBleHBsYWluZWQgYXRcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0Fnb3JpYy9yZWFsbXMtc2hpbS9pc3N1ZXMvMTJcbiAgLy8gV2l0aG91dCByZWplY3RpbmcgYXBwYXJlbnQgZGlyZWN0IGV2YWwgc3ludGF4LCB3ZSB3b3VsZFxuICAvLyBhY2NpZGVudGFsbHkgZXZhbHVhdGUgdGhlc2Ugd2l0aCBhbiBlbXVsYXRpb24gb2YgaW5kaXJlY3QgZXZhbC4gVHBcbiAgLy8gcHJldmVudCBmdXR1cmUgY29tcGF0aWJpbGl0eSBwcm9ibGVtcywgaW4gc2hpZnRpbmcgZnJvbSB1c2Ugb2YgdGhlXG4gIC8vIHNoaW0gdG8gZ2VudWluZSBwbGF0Zm9ybSBzdXBwb3J0IGZvciB0aGUgcHJvcG9zYWwsIHdlIHNob3VsZFxuICAvLyBpbnN0ZWFkIHN0YXRpY2FsbHkgcmVqZWN0IGNvZGUgdGhhdCBzZWVtcyB0byBjb250YWluIGEgZGlyZWN0IGV2YWxcbiAgLy8gZXhwcmVzc2lvbi5cbiAgLy9cbiAgLy8gQXMgd2l0aCB0aGUgZHluYW1pYyBpbXBvcnQgZXhwcmVzc2lvbiwgdG8gYXZvaWQgYSBmdWxsIHBhcnNlLCB3ZSBkb1xuICAvLyB0aGlzIGFwcHJveGltYXRlbHkgd2l0aCBhIHJlZ2V4cCwgdGhhdCB3aWxsIGFsc28gcmVqZWN0IHN0cmluZ3NcbiAgLy8gdGhhdCBhcHBlYXIgc2FmZWx5IGluIGNvbW1lbnRzIG9yIHN0cmluZ3MuIFVubGlrZSBkeW5hbWljIGltcG9ydCxcbiAgLy8gaWYgd2UgbWlzcyBzb21lLCB0aGlzIG9ubHkgY3JlYXRlcyBmdXR1cmUgY29tcGF0IHByb2JsZW1zLCBub3RcbiAgLy8gc2VjdXJpdHkgcHJvYmxlbXMuIFRodXMsIHdlIGFyZSBvbmx5IHRyeWluZyB0byBjYXRjaCBpbm5vY2VudFxuICAvLyBvY2N1cnJlbmNlcywgbm90IG1hbGljaW91cyBvbmUuIEluIHBhcnRpY3VsYXIsIGAoZXZhbCkoLi4uKWAgaXNcbiAgLy8gZGlyZWN0IGV2YWwgc3ludGF4IHRoYXQgd291bGQgbm90IGJlIGNhdWdodCBieSB0aGUgZm9sbG93aW5nIHJlZ2V4cC5cblxuICBjb25zdCBzb21lRGlyZWN0RXZhbFBhdHRlcm4gPSAvXFxiZXZhbFxccyooPzpcXCh8XFwvWy8qXSkvO1xuXG4gIGZ1bmN0aW9uIHJlamVjdFNvbWVEaXJlY3RFdmFsRXhwcmVzc2lvbnMocykge1xuICAgIGNvbnN0IGluZGV4ID0gcy5zZWFyY2goc29tZURpcmVjdEV2YWxQYXR0ZXJuKTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICBjb25zdCBsaW5lbnVtID0gcy5zbGljZSgwLCBpbmRleCkuc3BsaXQoJ1xcbicpLmxlbmd0aDsgLy8gbW9yZSBvciBsZXNzXG4gICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgIGBwb3NzaWJsZSBkaXJlY3QgZXZhbCBleHByZXNzaW9uIHJlamVjdGVkIGFyb3VuZCBsaW5lICR7bGluZW51bX1gXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlamVjdERhbmdlcm91c1NvdXJjZXMocykge1xuICAgIC8vIHJlamVjdEh0bWxDb21tZW50cyhzKTtcbiAgICAvLyByZWplY3RJbXBvcnRFeHByZXNzaW9ucyhzKTtcbiAgICByZWplY3RTb21lRGlyZWN0RXZhbEV4cHJlc3Npb25zKHMpO1xuICB9XG5cbiAgLy8gUG9ydGlvbnMgYWRhcHRlZCBmcm9tIFY4IC0gQ29weXJpZ2h0IDIwMTYgdGhlIFY4IHByb2plY3QgYXV0aG9ycy5cblxuICBmdW5jdGlvbiBidWlsZE9wdGltaXplcihjb25zdGFudHMpIHtcbiAgICAvLyBObyBuZWVkIHRvIGJ1aWxkIGFuIG9wcmltaXplciB3aGVuIHRoZXJlIGFyZSBubyBjb25zdGFudHMuXG4gICAgaWYgKGNvbnN0YW50cy5sZW5ndGggPT09IDApIHJldHVybiAnJztcbiAgICAvLyBVc2UgJ3RoaXMnIHRvIGF2b2lkIGdvaW5nIHRocm91Z2ggdGhlIHNjb3BlIHByb3h5LCB3aGljaCBpcyB1bmVjZXNzYXJ5XG4gICAgLy8gc2luY2UgdGhlIG9wdGltaXplciBvbmx5IG5lZWRzIHJlZmVyZW5jZXMgdG8gdGhlIHNhZmUgZ2xvYmFsLlxuICAgIHJldHVybiBgY29uc3QgeyR7YXJyYXlKb2luKGNvbnN0YW50cywgJywnKX19ID0gdGhpcztgO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU2NvcGVkRXZhbHVhdG9yRmFjdG9yeSh1bnNhZmVSZWMsIGNvbnN0YW50cykge1xuICAgIGNvbnN0IHsgdW5zYWZlRnVuY3Rpb24gfSA9IHVuc2FmZVJlYztcblxuICAgIGNvbnN0IG9wdGltaXplciA9IGJ1aWxkT3B0aW1pemVyKGNvbnN0YW50cyk7XG5cbiAgICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBpbiBzbG9wcHkgbW9kZSwgc28gdGhhdCB3ZSBjYW4gdXNlICd3aXRoJy4gSXQgcmV0dXJuc1xuICAgIC8vIGEgZnVuY3Rpb24gaW4gc3RyaWN0IG1vZGUgdGhhdCBldmFsdWF0ZXMgdGhlIHByb3ZpZGVkIGNvZGUgdXNpbmcgZGlyZWN0XG4gICAgLy8gZXZhbCwgYW5kIHRodXMgaW4gc3RyaWN0IG1vZGUgaW4gdGhlIHNhbWUgc2NvcGUuIFdlIG11c3QgYmUgdmVyeSBjYXJlZnVsXG4gICAgLy8gdG8gbm90IGNyZWF0ZSBuZXcgbmFtZXMgaW4gdGhpcyBzY29wZVxuXG4gICAgLy8gMTogd2UgdXNlICd3aXRoJyAoYXJvdW5kIGEgUHJveHkpIHRvIGNhdGNoIGFsbCBmcmVlIHZhcmlhYmxlIG5hbWVzLiBUaGVcbiAgICAvLyBmaXJzdCAnYXJndW1lbnRzWzBdJyBob2xkcyB0aGUgUHJveHkgd2hpY2ggc2FmZWx5IHdyYXBzIHRoZSBzYWZlR2xvYmFsXG4gICAgLy8gMjogJ29wdGltaXplcicgY2F0Y2hlcyBjb21tb24gdmFyaWFibGUgbmFtZXMgZm9yIHNwZWVkXG4gICAgLy8gMzogVGhlIGlubmVyIHN0cmljdCBmdW5jdGlvbiBpcyBlZmZlY3RpdmVseSBwYXNzZWQgdHdvIHBhcmFtZXRlcnM6XG4gICAgLy8gICAgYSkgaXRzIGFyZ3VtZW50c1swXSBpcyB0aGUgc291cmNlIHRvIGJlIGRpcmVjdGx5IGV2YWx1YXRlZC5cbiAgICAvLyAgICBiKSBpdHMgJ3RoaXMnIGlzIHRoZSB0aGlzIGJpbmRpbmcgc2VlbiBieSB0aGUgY29kZSBiZWluZ1xuICAgIC8vICAgICAgIGRpcmVjdGx5IGV2YWx1YXRlZC5cblxuICAgIC8vIGV2ZXJ5dGhpbmcgaW4gdGhlICdvcHRpbWl6ZXInIHN0cmluZyBpcyBsb29rZWQgdXAgaW4gdGhlIHByb3h5XG4gICAgLy8gKGluY2x1ZGluZyBhbiAnYXJndW1lbnRzWzBdJywgd2hpY2ggcG9pbnRzIGF0IHRoZSBQcm94eSkuICdmdW5jdGlvbicgaXNcbiAgICAvLyBhIGtleXdvcmQsIG5vdCBhIHZhcmlhYmxlLCBzbyBpdCBpcyBub3QgbG9va2VkIHVwLiB0aGVuICdldmFsJyBpcyBsb29rZWRcbiAgICAvLyB1cCBpbiB0aGUgcHJveHksIHRoYXQncyB0aGUgZmlyc3QgdGltZSBpdCBpcyBsb29rZWQgdXAgYWZ0ZXJcbiAgICAvLyB1c2VVbnNhZmVFdmFsdWF0b3IgaXMgdHVybmVkIG9uLCBzbyB0aGUgcHJveHkgcmV0dXJucyB0aGUgcmVhbCB0aGVcbiAgICAvLyB1bnNhZmVFdmFsLCB3aGljaCBzYXRpc2ZpZXMgdGhlIElzRGlyZWN0RXZhbFRyYXAgcHJlZGljYXRlLCBzbyBpdCB1c2VzXG4gICAgLy8gdGhlIGRpcmVjdCBldmFsIGFuZCBnZXRzIHRoZSBsZXhpY2FsIHNjb3BlLiBUaGUgc2Vjb25kICdhcmd1bWVudHNbMF0nIGlzXG4gICAgLy8gbG9va2VkIHVwIGluIHRoZSBjb250ZXh0IG9mIHRoZSBpbm5lciBmdW5jdGlvbi4gVGhlICpjb250ZW50cyogb2ZcbiAgICAvLyBhcmd1bWVudHNbMF0sIGJlY2F1c2Ugd2UncmUgdXNpbmcgZGlyZWN0IGV2YWwsIGFyZSBsb29rZWQgdXAgaW4gdGhlXG4gICAgLy8gUHJveHksIGJ5IHdoaWNoIHBvaW50IHRoZSB1c2VVbnNhZmVFdmFsdWF0b3Igc3dpdGNoIGhhcyBiZWVuIGZsaXBwZWRcbiAgICAvLyBiYWNrIHRvICdmYWxzZScsIHNvIGFueSBpbnN0YW5jZXMgb2YgJ2V2YWwnIGluIHRoYXQgc3RyaW5nIHdpbGwgZ2V0IHRoZVxuICAgIC8vIHNhZmUgZXZhbHVhdG9yLlxuXG4gICAgcmV0dXJuIHVuc2FmZUZ1bmN0aW9uKGBcbiAgICB3aXRoIChhcmd1bWVudHNbMF0pIHtcbiAgICAgICR7b3B0aW1pemVyfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgIHJldHVybiBldmFsKGFyZ3VtZW50c1swXSk7XG4gICAgICB9O1xuICAgIH1cbiAgYCk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTYWZlRXZhbHVhdG9yRmFjdG9yeSh1bnNhZmVSZWMsIHNhZmVHbG9iYWwpIHtcbiAgICBjb25zdCB7IHVuc2FmZUZ1bmN0aW9uIH0gPSB1bnNhZmVSZWM7XG5cbiAgICBjb25zdCBzY29wZUhhbmRsZXIgPSBjcmVhdGVTY29wZUhhbmRsZXIodW5zYWZlUmVjLCBzYWZlR2xvYmFsKTtcbiAgICBjb25zdCBjb25zdGFudHMgPSBnZXRPcHRpbWl6YWJsZUdsb2JhbHMoc2FmZUdsb2JhbCk7XG4gICAgY29uc3Qgc2NvcGVkRXZhbHVhdG9yRmFjdG9yeSA9IGNyZWF0ZVNjb3BlZEV2YWx1YXRvckZhY3RvcnkoXG4gICAgICB1bnNhZmVSZWMsXG4gICAgICBjb25zdGFudHNcbiAgICApO1xuXG4gICAgZnVuY3Rpb24gZmFjdG9yeShlbmRvd21lbnRzID0ge30sIG5vblN0cmljdCA9IGZhbHNlKSB7XG4gICAgICAvLyB0b2RvIChzaGltIGxpbWl0YXRpb24pOiBzY2FuIGVuZG93bWVudHMsIHRocm93IGVycm9yIGlmIGVuZG93bWVudFxuICAgICAgLy8gb3ZlcmxhcHMgd2l0aCB0aGUgY29uc3Qgb3B0aW1pemF0aW9uICh3aGljaCB3b3VsZCBvdGhlcndpc2VcbiAgICAgIC8vIGluY29ycmVjdGx5IHNoYWRvdyBlbmRvd21lbnRzKSwgb3IgaWYgZW5kb3dtZW50cyBpbmNsdWRlcyAnZXZhbCcuIEFsc29cbiAgICAgIC8vIHByb2hpYml0IGFjY2Vzc29yIHByb3BlcnRpZXMgKHRvIGJlIGFibGUgdG8gY29uc2lzdGVudGx5IGV4cGxhaW5cbiAgICAgIC8vIHRoaW5ncyBpbiB0ZXJtcyBvZiBzaGltbWluZyB0aGUgZ2xvYmFsIGxleGljYWwgc2NvcGUpLlxuICAgICAgLy8gd3JpdGVhYmxlLXZzLW5vbndyaXRhYmxlID09IGxldC12cy1jb25zdCwgYnV0IHRoZXJlJ3Mgbm9cbiAgICAgIC8vIGdsb2JhbC1sZXhpY2FsLXNjb3BlIGVxdWl2YWxlbnQgb2YgYW4gYWNjZXNzb3IsIG91dHNpZGUgd2hhdCB3ZSBjYW5cbiAgICAgIC8vIGV4cGxhaW4vc3BlY1xuICAgICAgY29uc3Qgc2NvcGVUYXJnZXQgPSBjcmVhdGUoXG4gICAgICAgIHNhZmVHbG9iYWwsXG4gICAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcnMoZW5kb3dtZW50cylcbiAgICAgICk7XG4gICAgICBjb25zdCBzY29wZVByb3h5ID0gbmV3IFByb3h5KHNjb3BlVGFyZ2V0LCBzY29wZUhhbmRsZXIpO1xuICAgICAgY29uc3Qgc2NvcGVkRXZhbHVhdG9yID0gYXBwbHkoc2NvcGVkRXZhbHVhdG9yRmFjdG9yeSwgc2FmZUdsb2JhbCwgW1xuICAgICAgICBzY29wZVByb3h5XG4gICAgICBdKTtcblxuICAgICAgLy8gV2UgdXNlIHRoZSB0aGUgY29uY2lzZSBtZXRob2Qgc3ludGF4IHRvIGNyZWF0ZSBhbiBldmFsIHdpdGhvdXQgYVxuICAgICAgLy8gW1tDb25zdHJ1Y3RdXSBiZWhhdmlvciAoc3VjaCB0aGF0IHRoZSBpbnZvY2F0aW9uIFwibmV3IGV2YWwoKVwiIHRocm93c1xuICAgICAgLy8gVHlwZUVycm9yOiBldmFsIGlzIG5vdCBhIGNvbnN0cnVjdG9yXCIpLCBidXQgd2hpY2ggc3RpbGwgYWNjZXB0cyBhXG4gICAgICAvLyAndGhpcycgYmluZGluZy5cbiAgICAgIGNvbnN0IHNhZmVFdmFsID0ge1xuICAgICAgICBldmFsKHNyYykge1xuICAgICAgICAgIHNyYyA9IGAke3NyY31gO1xuICAgICAgICAgIHJlamVjdERhbmdlcm91c1NvdXJjZXMoc3JjKTtcbiAgICAgICAgICBzY29wZUhhbmRsZXIuYWxsb3dVbnNhZmVFdmFsdWF0b3JPbmNlKCk7XG4gICAgICAgICAgaWYgKG5vblN0cmljdCAmJiAhc2NvcGVIYW5kbGVyLm5vblN0cmljdE1vZGVBc3NpZ25tZW50QWxsb3dlZCgpKSB7XG4gICAgICAgICAgICBzY29wZUhhbmRsZXIuYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudCg1KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IGVycjtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gRW5zdXJlIHRoYXQgXCJ0aGlzXCIgcmVzb2x2ZXMgdG8gdGhlIHNhZmUgZ2xvYmFsLlxuICAgICAgICAgICAgcmV0dXJuIGFwcGx5KHNjb3BlZEV2YWx1YXRvciwgc2FmZUdsb2JhbCwgW3NyY10pO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIHN0YXNoIHRoZSBjaGlsZC1jb2RlIGVycm9yIGluIGhvcGVzIG9mIGRlYnVnZ2luZyB0aGUgaW50ZXJuYWwgZmFpbHVyZVxuICAgICAgICAgICAgZXJyID0gZTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHNjb3BlSGFuZGxlci5oYXNOb25TdHJpY3RNb2RlQXNzaWduZWQoKTtcbiAgICAgICAgICAgIC8vIGJlbHQgYW5kIHN1c3BlbmRlcnM6IHRoZSBwcm94eSBzd2l0Y2hlcyB0aGlzIG9mZiBpbW1lZGlhdGVseSBhZnRlclxuICAgICAgICAgICAgLy8gdGhlIGZpcnN0IGFjY2VzcywgYnV0IGlmIHRoYXQncyBub3QgdGhlIGNhc2Ugd2UgYWJvcnQuXG4gICAgICAgICAgICBpZiAoc2NvcGVIYW5kbGVyLnVuc2FmZUV2YWx1YXRvckFsbG93ZWQoKSkge1xuICAgICAgICAgICAgICB0aHJvd1RhbnRydW0oJ2hhbmRsZXIgZGlkIG5vdCByZXZva2UgdXNlVW5zYWZlRXZhbHVhdG9yJywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0uZXZhbDtcblxuICAgICAgLy8gc2FmZUV2YWwncyBwcm90b3R5cGUgaXMgY3VycmVudGx5IHRoZSBwcmltYWwgcmVhbG0nc1xuICAgICAgLy8gRnVuY3Rpb24ucHJvdG90eXBlLCB3aGljaCB3ZSBtdXN0IG5vdCBsZXQgZXNjYXBlLiBUbyBtYWtlICdldmFsXG4gICAgICAvLyBpbnN0YW5jZW9mIEZ1bmN0aW9uJyBiZSB0cnVlIGluc2lkZSB0aGUgcmVhbG0sIHdlIG5lZWQgdG8gcG9pbnQgaXQgYXRcbiAgICAgIC8vIHRoZSBSb290UmVhbG0ncyB2YWx1ZS5cblxuICAgICAgLy8gRW5zdXJlIHRoYXQgZXZhbCBmcm9tIGFueSBjb21wYXJ0bWVudCBpbiBhIHJvb3QgcmVhbG0gaXMgYW4gaW5zdGFuY2VcbiAgICAgIC8vIG9mIEZ1bmN0aW9uIGluIGFueSBjb21wYXJ0bWVudCBvZiB0aGUgc2FtZSByb290IHJlYWxtLlxuICAgICAgc2V0UHJvdG90eXBlT2Yoc2FmZUV2YWwsIHVuc2FmZUZ1bmN0aW9uLnByb3RvdHlwZSk7XG5cbiAgICAgIGFzc2VydChnZXRQcm90b3R5cGVPZihzYWZlRXZhbCkuY29uc3RydWN0b3IgIT09IEZ1bmN0aW9uLCAnaGlkZSBGdW5jdGlvbicpO1xuICAgICAgYXNzZXJ0KFxuICAgICAgICBnZXRQcm90b3R5cGVPZihzYWZlRXZhbCkuY29uc3RydWN0b3IgIT09IHVuc2FmZUZ1bmN0aW9uLFxuICAgICAgICAnaGlkZSB1bnNhZmVGdW5jdGlvbidcbiAgICAgICk7XG5cbiAgICAgIC8vIG5vdGU6IGJlIGNhcmVmdWwgdG8gbm90IGxlYWsgb3VyIHByaW1hbCBGdW5jdGlvbi5wcm90b3R5cGUgYnkgc2V0dGluZ1xuICAgICAgLy8gdGhpcyB0byBhIHBsYWluIGFycm93IGZ1bmN0aW9uLiBOb3cgdGhhdCB3ZSBoYXZlIHNhZmVFdmFsLCB1c2UgaXQuXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKHNhZmVFdmFsLCB7XG4gICAgICAgIHRvU3RyaW5nOiB7XG4gICAgICAgICAgLy8gV2UgYnJlYWsgdXAgdGhlIGZvbGxvd2luZyBsaXRlcmFsIHN0cmluZyBzbyB0aGF0IGFuXG4gICAgICAgICAgLy8gYXBwYXJlbnQgZGlyZWN0IGV2YWwgc3ludGF4IGRvZXMgbm90IGFwcGVhciBpbiB0aGlzXG4gICAgICAgICAgLy8gZmlsZS4gVGh1cywgd2UgYXZvaWQgcmVqZWN0aW9uIGJ5IHRoZSBvdmVybHkgZWFnZXJcbiAgICAgICAgICAvLyByZWplY3REYW5nZXJvdXNTb3VyY2VzLlxuICAgICAgICAgIHZhbHVlOiBzYWZlRXZhbChcIigpID0+ICdmdW5jdGlvbiBldmFsJyArICcoKSB7IFtzaGltIGNvZGVdIH0nXCIpLFxuICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBzYWZlRXZhbDtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNhZmVFdmFsdWF0b3Ioc2FmZUV2YWx1YXRvckZhY3RvcnkpIHtcbiAgICByZXR1cm4gc2FmZUV2YWx1YXRvckZhY3RvcnkoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNhZmVFdmFsdWF0b3JXaGljaFRha2VzRW5kb3dtZW50cyhzYWZlRXZhbHVhdG9yRmFjdG9yeSkge1xuICAgIHJldHVybiAoeCwgZW5kb3dtZW50cykgPT4gc2FmZUV2YWx1YXRvckZhY3RvcnkoZW5kb3dtZW50cykoeCk7XG4gIH1cblxuICAvKipcbiAgICogQSBzYWZlIHZlcnNpb24gb2YgdGhlIG5hdGl2ZSBGdW5jdGlvbiB3aGljaCByZWxpZXMgb25cbiAgICogdGhlIHNhZmV0eSBvZiBldmFsRXZhbHVhdG9yIGZvciBjb25maW5lbWVudC5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZUZ1bmN0aW9uRXZhbHVhdG9yKFxuICAgIHVuc2FmZVJlYyxcbiAgICBzYWZlRXZhbEZhY3RvcnksXG4gICAgcmVhbG1HbG9iYWxcbiAgKSB7XG4gICAgY29uc3QgeyB1bnNhZmVGdW5jdGlvbiwgdW5zYWZlR2xvYmFsIH0gPSB1bnNhZmVSZWM7XG5cbiAgICBjb25zdCBzYWZlRXZhbFN0cmljdCA9IHNhZmVFdmFsRmFjdG9yeSh1bmRlZmluZWQsIGZhbHNlKTtcbiAgICBjb25zdCBzYWZlRXZhbE5vblN0cmljdCA9IHNhZmVFdmFsRmFjdG9yeSh1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgY29uc3Qgc2FmZUZ1bmN0aW9uID0gZnVuY3Rpb24gRnVuY3Rpb24oLi4ucGFyYW1zKSB7XG4gICAgICBjb25zdCBmdW5jdGlvbkJvZHkgPSBgJHthcnJheVBvcChwYXJhbXMpIHx8ICcnfWA7XG4gICAgICBsZXQgZnVuY3Rpb25QYXJhbXMgPSBgJHthcnJheUpvaW4ocGFyYW1zLCAnLCcpfWA7XG4gICAgICBpZiAoIXJlZ2V4cFRlc3QoL15bXFx3XFxzLF0qJC8sIGZ1bmN0aW9uUGFyYW1zKSkge1xuICAgICAgICB0aHJvdyBuZXcgdW5zYWZlR2xvYmFsLlN5bnRheEVycm9yKFxuICAgICAgICAgICdzaGltIGxpbWl0YXRpb246IEZ1bmN0aW9uIGFyZyBtdXN0IGJlIHNpbXBsZSBBU0NJSSBpZGVudGlmaWVycywgcG9zc2libHkgc2VwYXJhdGVkIGJ5IGNvbW1hczogbm8gZGVmYXVsdCB2YWx1ZXMsIHBhdHRlcm4gbWF0Y2hlcywgb3Igbm9uLUFTQ0lJIHBhcmFtZXRlciBuYW1lcydcbiAgICAgICAgKTtcbiAgICAgICAgLy8gdGhpcyBwcm90ZWN0cyBhZ2FpbnN0IE1hdHQgQXVzdGluJ3MgY2xldmVyIGF0dGFjazpcbiAgICAgICAgLy8gRnVuY3Rpb24oXCJhcmc9YFwiLCBcIi8qYm9keWApe30pOyh7eDogdGhpcy8qKi9cIilcbiAgICAgICAgLy8gd2hpY2ggd291bGQgdHVybiBpbnRvXG4gICAgICAgIC8vICAgICAoZnVuY3Rpb24oYXJnPWBcbiAgICAgICAgLy8gICAgIC8qYGAqLyl7XG4gICAgICAgIC8vICAgICAgLypib2R5YCl7fSk7KHt4OiB0aGlzLyoqL1xuICAgICAgICAvLyAgICAgfSlcbiAgICAgICAgLy8gd2hpY2ggcGFyc2VzIGFzIGEgZGVmYXVsdCBhcmd1bWVudCBvZiBgXFxuLypgYCovKXtcXG4vKmJvZHlgICwgd2hpY2hcbiAgICAgICAgLy8gaXMgYSBwYWlyIG9mIHRlbXBsYXRlIGxpdGVyYWxzIGJhY2stdG8tYmFjayAoc28gdGhlIGZpcnN0IG9uZVxuICAgICAgICAvLyBub21pbmFsbHkgZXZhbHVhdGVzIHRvIHRoZSBwYXJzZXIgdG8gdXNlIG9uIHRoZSBzZWNvbmQgb25lKSwgd2hpY2hcbiAgICAgICAgLy8gY2FuJ3QgYWN0dWFsbHkgZXhlY3V0ZSAoYmVjYXVzZSB0aGUgZmlyc3QgbGl0ZXJhbCBldmFscyB0byBhIHN0cmluZyxcbiAgICAgICAgLy8gd2hpY2ggY2FuJ3QgYmUgYSBwYXJzZXIgZnVuY3Rpb24pLCBidXQgdGhhdCBkb2Vzbid0IG1hdHRlciBiZWNhdXNlXG4gICAgICAgIC8vIHRoZSBmdW5jdGlvbiBpcyBieXBhc3NlZCBlbnRpcmVseS4gV2hlbiB0aGF0IGdldHMgZXZhbHVhdGVkLCBpdFxuICAgICAgICAvLyBkZWZpbmVzIChidXQgZG9lcyBub3QgaW52b2tlKSBhIGZ1bmN0aW9uLCB0aGVuIGV2YWx1YXRlcyBhIHNpbXBsZVxuICAgICAgICAvLyB7eDogdGhpc30gZXhwcmVzc2lvbiwgZ2l2aW5nIGFjY2VzcyB0byB0aGUgc2FmZSBnbG9iYWwuXG4gICAgICB9XG5cbiAgICAgIC8vIElzIHRoaXMgYSByZWFsIGZ1bmN0aW9uQm9keSwgb3IgaXMgc29tZW9uZSBhdHRlbXB0aW5nIGFuIGluamVjdGlvblxuICAgICAgLy8gYXR0YWNrPyBUaGlzIHdpbGwgdGhyb3cgYSBTeW50YXhFcnJvciBpZiB0aGUgc3RyaW5nIGlzIG5vdCBhY3R1YWxseSBhXG4gICAgICAvLyBmdW5jdGlvbiBib2R5LiBXZSBjb2VyY2UgdGhlIGJvZHkgaW50byBhIHJlYWwgc3RyaW5nIGFib3ZlIHRvIHByZXZlbnRcbiAgICAgIC8vIHNvbWVvbmUgZnJvbSBwYXNzaW5nIGFuIG9iamVjdCB3aXRoIGEgdG9TdHJpbmcoKSB0aGF0IHJldHVybnMgYSBzYWZlXG4gICAgICAvLyBzdHJpbmcgdGhlIGZpcnN0IHRpbWUsIGJ1dCBhbiBldmlsIHN0cmluZyB0aGUgc2Vjb25kIHRpbWUuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LCBuZXctY2FwXG4gICAgICBuZXcgdW5zYWZlRnVuY3Rpb24oZnVuY3Rpb25Cb2R5KTtcblxuICAgICAgaWYgKHN0cmluZ0luY2x1ZGVzKGZ1bmN0aW9uUGFyYW1zLCAnKScpKSB7XG4gICAgICAgIC8vIElmIHRoZSBmb3JtYWwgcGFyYW1ldGVycyBzdHJpbmcgaW5jbHVkZSApIC0gYW4gaWxsZWdhbFxuICAgICAgICAvLyBjaGFyYWN0ZXIgLSBpdCBtYXkgbWFrZSB0aGUgY29tYmluZWQgZnVuY3Rpb24gZXhwcmVzc2lvblxuICAgICAgICAvLyBjb21waWxlLiBXZSBhdm9pZCB0aGlzIHByb2JsZW0gYnkgY2hlY2tpbmcgZm9yIHRoaXMgZWFybHkgb24uXG5cbiAgICAgICAgLy8gbm90ZTogdjggdGhyb3dzIGp1c3QgbGlrZSB0aGlzIGRvZXMsIGJ1dCBjaHJvbWUgYWNjZXB0c1xuICAgICAgICAvLyBlLmcuICdhID0gbmV3IERhdGUoKSdcbiAgICAgICAgdGhyb3cgbmV3IHVuc2FmZUdsb2JhbC5TeW50YXhFcnJvcihcbiAgICAgICAgICAnc2hpbSBsaW1pdGF0aW9uOiBGdW5jdGlvbiBhcmcgc3RyaW5nIGNvbnRhaW5zIHBhcmVudGhlc2lzJ1xuICAgICAgICApO1xuICAgICAgICAvLyB0b2RvOiBzaGltIGludGVncml0eSB0aHJlYXQgaWYgdGhleSBjaGFuZ2UgU3ludGF4RXJyb3JcbiAgICAgIH1cblxuICAgICAgLy8gdG9kbzogY2hlY2sgdG8gbWFrZSBzdXJlIHRoaXMgLmxlbmd0aCBpcyBzYWZlLiBtYXJrbSBzYXlzIHNhZmUuXG4gICAgICBpZiAoZnVuY3Rpb25QYXJhbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBJZiB0aGUgZm9ybWFsIHBhcmFtZXRlcnMgaW5jbHVkZSBhbiB1bmJhbGFuY2VkIGJsb2NrIGNvbW1lbnQsIHRoZVxuICAgICAgICAvLyBmdW5jdGlvbiBtdXN0IGJlIHJlamVjdGVkLiBTaW5jZSBKYXZhU2NyaXB0IGRvZXMgbm90IGFsbG93IG5lc3RlZFxuICAgICAgICAvLyBjb21tZW50cyB3ZSBjYW4gaW5jbHVkZSBhIHRyYWlsaW5nIGJsb2NrIGNvbW1lbnQgdG8gY2F0Y2ggdGhpcy5cbiAgICAgICAgZnVuY3Rpb25QYXJhbXMgKz0gJ1xcbi8qYGAqLyc7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNyYyA9IGAoZnVuY3Rpb24oJHtmdW5jdGlvblBhcmFtc30pe1xcbiR7ZnVuY3Rpb25Cb2R5fVxcbn0pYDtcbiAgICAgIGNvbnN0IGlzU3RyaWN0ID0gISEvXlxccypbJ3xcIl11c2Ugc3RyaWN0Wyd8XCJdLy5leGVjKGZ1bmN0aW9uQm9keSk7XG4gICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgcmV0dXJuIHNhZmVFdmFsU3RyaWN0KHNyYyk7XG4gICAgICB9XG4gICAgICBjb25zdCBmbiA9IHNhZmVFdmFsTm9uU3RyaWN0KHNyYyk7XG4gICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgcmV0dXJuIGZuO1xuICAgICAgfVxuICAgICAgLy8gd2UgZml4IHRoZSBgdGhpc2AgYmluZGluZyBpbiBGdW5jdGlvbigpLlxuICAgICAgY29uc3QgYmluZFRoaXMgPSBgKGZ1bmN0aW9uIChnbG9iYWxUaGlzLCBmKSB7XG4gIGZ1bmN0aW9uIGYyKCkge1xuICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KGYsIHRoaXMgfHwgZ2xvYmFsVGhpcywgYXJndW1lbnRzKTtcbiAgfVxuICBmMi50b1N0cmluZyA9ICgpID0+IGYudG9TdHJpbmcoKTtcbiAgcmV0dXJuIGYyO1xufSlgO1xuICAgICAgY29uc3QgZm5XaXRoVGhpcyA9IHNhZmVFdmFsU3RyaWN0KGJpbmRUaGlzKShyZWFsbUdsb2JhbCwgZm4pO1xuICAgICAgcmV0dXJuIGZuV2l0aFRoaXM7XG4gICAgfTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IEZ1bmN0aW9uIGZyb20gYW55IGNvbXBhcnRtZW50IGluIGEgcm9vdCByZWFsbSBjYW4gYmUgdXNlZFxuICAgIC8vIHdpdGggaW5zdGFuY2UgY2hlY2tzIGluIGFueSBjb21wYXJ0bWVudCBvZiB0aGUgc2FtZSByb290IHJlYWxtLlxuICAgIHNldFByb3RvdHlwZU9mKHNhZmVGdW5jdGlvbiwgdW5zYWZlRnVuY3Rpb24ucHJvdG90eXBlKTtcblxuICAgIGFzc2VydChcbiAgICAgIGdldFByb3RvdHlwZU9mKHNhZmVGdW5jdGlvbikuY29uc3RydWN0b3IgIT09IEZ1bmN0aW9uLFxuICAgICAgJ2hpZGUgRnVuY3Rpb24nXG4gICAgKTtcbiAgICBhc3NlcnQoXG4gICAgICBnZXRQcm90b3R5cGVPZihzYWZlRnVuY3Rpb24pLmNvbnN0cnVjdG9yICE9PSB1bnNhZmVGdW5jdGlvbixcbiAgICAgICdoaWRlIHVuc2FmZUZ1bmN0aW9uJ1xuICAgICk7XG5cbiAgICBkZWZpbmVQcm9wZXJ0aWVzKHNhZmVGdW5jdGlvbiwge1xuICAgICAgLy8gRW5zdXJlIHRoYXQgYW55IGZ1bmN0aW9uIGNyZWF0ZWQgaW4gYW55IGNvbXBhcnRtZW50IGluIGEgcm9vdCByZWFsbSBpcyBhblxuICAgICAgLy8gaW5zdGFuY2Ugb2YgRnVuY3Rpb24gaW4gYW55IGNvbXBhcnRtZW50IG9mIHRoZSBzYW1lIHJvb3QgcmFsbS5cbiAgICAgIHByb3RvdHlwZTogeyB2YWx1ZTogdW5zYWZlRnVuY3Rpb24ucHJvdG90eXBlIH0sXG5cbiAgICAgIC8vIFByb3ZpZGUgYSBjdXN0b20gb3V0cHV0IHdpdGhvdXQgb3ZlcndyaXRpbmcgdGhlXG4gICAgICAvLyBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgd2hpY2ggaXMgY2FsbGVkIGJ5IHNvbWUgdGhpcmQtcGFydHlcbiAgICAgIC8vIGxpYnJhcmllcy5cbiAgICAgIHRvU3RyaW5nOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRXZhbFN0cmljdChcIigpID0+ICdmdW5jdGlvbiBGdW5jdGlvbigpIHsgW3NoaW0gY29kZV0gfSdcIiksXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNhZmVGdW5jdGlvbjtcbiAgfVxuXG4gIC8vIE1pbWljIHByaXZhdGUgbWVtYmVycyBvbiB0aGUgcmVhbG0gaW5zdGFuY2VzLlxuICAvLyBXZSBkZWZpbmUgaXQgaW4gdGhlIHNhbWUgbW9kdWxlIGFuZCBkbyBub3QgZXhwb3J0IGl0LlxuICBjb25zdCBSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UgPSBuZXcgV2Vha01hcCgpO1xuXG4gIGZ1bmN0aW9uIGdldFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZShyZWFsbSkge1xuICAgIC8vIERldGVjdCBub24tb2JqZWN0cy5cbiAgICBhc3NlcnQoT2JqZWN0KHJlYWxtKSA9PT0gcmVhbG0sICdiYWQgb2JqZWN0LCBub3QgYSBSZWFsbSBpbnN0YW5jZScpO1xuICAgIC8vIFJlYWxtIGluc3RhbmNlIGhhcyBubyByZWFsbVJlYy4gU2hvdWxkIG5vdCBwcm9jZWVkLlxuICAgIGFzc2VydChSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UuaGFzKHJlYWxtKSwgJ1JlYWxtIGluc3RhbmNlIGhhcyBubyByZWNvcmQnKTtcblxuICAgIHJldHVybiBSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UuZ2V0KHJlYWxtKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHJlYWxtLCByZWFsbVJlYykge1xuICAgIC8vIERldGVjdCBub24tb2JqZWN0cy5cbiAgICBhc3NlcnQoT2JqZWN0KHJlYWxtKSA9PT0gcmVhbG0sICdiYWQgb2JqZWN0LCBub3QgYSBSZWFsbSBpbnN0YW5jZScpO1xuICAgIC8vIEF0dGVtcHQgdG8gY2hhbmdlIGFuIGV4aXN0aW5nIHJlYWxtUmVjIG9uIGEgcmVhbG0gaW5zdGFuY2UuIFNob3VsZCBub3QgcHJvY2VlZC5cbiAgICBhc3NlcnQoXG4gICAgICAhUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlLmhhcyhyZWFsbSksXG4gICAgICAnUmVhbG0gaW5zdGFuY2UgYWxyZWFkeSBoYXMgYSByZWNvcmQnXG4gICAgKTtcblxuICAgIFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZS5zZXQocmVhbG0sIHJlYWxtUmVjKTtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgdGhlIGdsb2JhbCB2YXJpYWJsZXMgZm9yIHRoZSBuZXcgUmVhbG0uXG4gIGZ1bmN0aW9uIHNldERlZmF1bHRCaW5kaW5ncyhzYWZlR2xvYmFsLCBzYWZlRXZhbCwgc2FmZUZ1bmN0aW9uKSB7XG4gICAgZGVmaW5lUHJvcGVydGllcyhzYWZlR2xvYmFsLCB7XG4gICAgICBldmFsOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRXZhbCxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIEZ1bmN0aW9uOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRnVuY3Rpb24sXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVJlYWxtUmVjKHVuc2FmZVJlYykge1xuICAgIGNvbnN0IHsgc2hhcmVkR2xvYmFsRGVzY3MsIHVuc2FmZUdsb2JhbCB9ID0gdW5zYWZlUmVjO1xuXG4gICAgY29uc3Qgc2FmZUdsb2JhbCA9IGNyZWF0ZSh1bnNhZmVHbG9iYWwuT2JqZWN0LnByb3RvdHlwZSwgc2hhcmVkR2xvYmFsRGVzY3MpO1xuXG4gICAgY29uc3Qgc2FmZUV2YWx1YXRvckZhY3RvcnkgPSBjcmVhdGVTYWZlRXZhbHVhdG9yRmFjdG9yeShcbiAgICAgIHVuc2FmZVJlYyxcbiAgICAgIHNhZmVHbG9iYWxcbiAgICApO1xuICAgIGNvbnN0IHNhZmVFdmFsID0gY3JlYXRlU2FmZUV2YWx1YXRvcihzYWZlRXZhbHVhdG9yRmFjdG9yeSk7XG4gICAgY29uc3Qgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyA9IGNyZWF0ZVNhZmVFdmFsdWF0b3JXaGljaFRha2VzRW5kb3dtZW50cyhcbiAgICAgIHNhZmVFdmFsdWF0b3JGYWN0b3J5XG4gICAgKTtcbiAgICBjb25zdCBzYWZlRnVuY3Rpb24gPSBjcmVhdGVGdW5jdGlvbkV2YWx1YXRvcihcbiAgICAgIHVuc2FmZVJlYyxcbiAgICAgIHNhZmVFdmFsdWF0b3JGYWN0b3J5LFxuICAgICAgc2FmZUdsb2JhbFxuICAgICk7XG5cbiAgICBzZXREZWZhdWx0QmluZGluZ3Moc2FmZUdsb2JhbCwgc2FmZUV2YWwsIHNhZmVGdW5jdGlvbik7XG5cbiAgICBjb25zdCByZWFsbVJlYyA9IGZyZWV6ZSh7XG4gICAgICBzYWZlR2xvYmFsLFxuICAgICAgc2FmZUV2YWwsXG4gICAgICBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzLFxuICAgICAgc2FmZUZ1bmN0aW9uXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVhbG1SZWM7XG4gIH1cblxuICAvKipcbiAgICogQSByb290IHJlYWxtIHVzZXMgYSBmcmVzaCBzZXQgb2YgbmV3IGludHJpbmljcy4gSGVyZSB3ZSBmaXJzdCBjcmVhdGVcbiAgICogYSBuZXcgdW5zYWZlIHJlY29yZCwgd2hpY2ggaW5oZXJpdHMgdGhlIHNoaW1zLiBUaGVuIHdlIHByb2NlZWQgd2l0aFxuICAgKiB0aGUgY3JlYXRpb24gb2YgdGhlIHJlYWxtIHJlY29yZCwgYW5kIHdlIGFwcGx5IHRoZSBzaGltcy5cbiAgICovXG4gIGZ1bmN0aW9uIGluaXRSb290UmVhbG0ocGFyZW50VW5zYWZlUmVjLCBzZWxmLCBvcHRpb25zKSB7XG4gICAgLy8gbm90ZTogJ3NlbGYnIGlzIHRoZSBpbnN0YW5jZSBvZiB0aGUgUmVhbG0uXG5cbiAgICAvLyB0b2RvOiBpbnZlc3RpZ2F0ZSBhdHRhY2tzIHZpYSBBcnJheS5zcGVjaWVzXG4gICAgLy8gdG9kbzogdGhpcyBhY2NlcHRzIG5ld1NoaW1zPSdzdHJpbmcnLCBidXQgaXQgc2hvdWxkIHJlamVjdCB0aGF0XG4gICAgY29uc3QgeyBzaGltczogbmV3U2hpbXMgfSA9IG9wdGlvbnM7XG4gICAgY29uc3QgYWxsU2hpbXMgPSBhcnJheUNvbmNhdChwYXJlbnRVbnNhZmVSZWMuYWxsU2hpbXMsIG5ld1NoaW1zKTtcblxuICAgIC8vIFRoZSB1bnNhZmUgcmVjb3JkIGlzIGNyZWF0ZWQgYWxyZWFkeSByZXBhaXJlZC5cbiAgICBjb25zdCB1bnNhZmVSZWMgPSBjcmVhdGVOZXdVbnNhZmVSZWMoYWxsU2hpbXMpO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgY29uc3QgUmVhbG0gPSBjcmVhdGVSZWFsbUZhY2FkZSh1bnNhZmVSZWMsIEJhc2VSZWFsbSk7XG5cbiAgICAvLyBBZGQgYSBSZWFsbSBkZXNjcmlwdG9yIHRvIHNoYXJlZEdsb2JhbERlc2NzLCBzbyBpdCBjYW4gYmUgZGVmaW5lZCBvbnRvIHRoZVxuICAgIC8vIHNhZmVHbG9iYWwgbGlrZSB0aGUgcmVzdCBvZiB0aGUgZ2xvYmFscy5cbiAgICB1bnNhZmVSZWMuc2hhcmVkR2xvYmFsRGVzY3MuUmVhbG0gPSB7XG4gICAgICB2YWx1ZTogUmVhbG0sXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH07XG5cbiAgICAvLyBDcmVhdGluZyB0aGUgcmVhbG1SZWMgcHJvdmlkZXMgdGhlIGdsb2JhbCBvYmplY3QsIGV2YWwoKSBhbmQgRnVuY3Rpb24oKVxuICAgIC8vIHRvIHRoZSByZWFsbS5cbiAgICBjb25zdCByZWFsbVJlYyA9IGNyZWF0ZVJlYWxtUmVjKHVuc2FmZVJlYyk7XG5cbiAgICAvLyBBcHBseSBhbGwgc2hpbXMgaW4gdGhlIG5ldyBSb290UmVhbG0uIFdlIGRvbid0IGRvIHRoaXMgZm9yIGNvbXBhcnRtZW50cy5cbiAgICBjb25zdCB7IHNhZmVFdmFsV2hpY2hUYWtlc0VuZG93bWVudHMgfSA9IHJlYWxtUmVjO1xuICAgIGZvciAoY29uc3Qgc2hpbSBvZiBhbGxTaGltcykge1xuICAgICAgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyhzaGltKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgcmVhbG1SZWMgYWN0cyBhcyBhIHByaXZhdGUgZmllbGQgb24gdGhlIHJlYWxtIGluc3RhbmNlLlxuICAgIHJlZ2lzdGVyUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHNlbGYsIHJlYWxtUmVjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNvbXBhcnRtZW50IHNoYXJlcyB0aGUgaW50cmluc2ljcyBvZiBpdHMgcm9vdCByZWFsbS4gSGVyZSwgb25seSBhXG4gICAqIHJlYWxtUmVjIGlzIG5lY2Vzc2FyeSB0byBob2xkIHRoZSBnbG9iYWwgb2JqZWN0LCBldmFsKCkgYW5kIEZ1bmN0aW9uKCkuXG4gICAqL1xuICBmdW5jdGlvbiBpbml0Q29tcGFydG1lbnQodW5zYWZlUmVjLCBzZWxmKSB7XG4gICAgLy8gbm90ZTogJ3NlbGYnIGlzIHRoZSBpbnN0YW5jZSBvZiB0aGUgUmVhbG0uXG5cbiAgICBjb25zdCByZWFsbVJlYyA9IGNyZWF0ZVJlYWxtUmVjKHVuc2FmZVJlYyk7XG5cbiAgICAvLyBUaGUgcmVhbG1SZWMgYWN0cyBhcyBhIHByaXZhdGUgZmllbGQgb24gdGhlIHJlYWxtIGluc3RhbmNlLlxuICAgIHJlZ2lzdGVyUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHNlbGYsIHJlYWxtUmVjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlYWxtR2xvYmFsKHNlbGYpIHtcbiAgICBjb25zdCB7IHNhZmVHbG9iYWwgfSA9IGdldFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZShzZWxmKTtcbiAgICByZXR1cm4gc2FmZUdsb2JhbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWxtRXZhbHVhdGUoc2VsZiwgeCwgZW5kb3dtZW50cyA9IHt9KSB7XG4gICAgLy8gdG9kbzogZG9uJ3QgcGFzcyBpbiBwcmltYWwtcmVhbG0gb2JqZWN0cyBsaWtlIHt9LCBmb3Igc2FmZXR5LiBPVE9IIGl0c1xuICAgIC8vIHByb3BlcnRpZXMgYXJlIGNvcGllZCBvbnRvIHRoZSBuZXcgZ2xvYmFsICd0YXJnZXQnLlxuICAgIC8vIHRvZG86IGZpZ3VyZSBvdXQgYSB3YXkgdG8gbWVtYnJhbmUgYXdheSB0aGUgY29udGVudHMgdG8gc2FmZXR5LlxuICAgIGNvbnN0IHsgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyB9ID0gZ2V0UmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHNlbGYpO1xuICAgIHJldHVybiBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzKHgsIGVuZG93bWVudHMpO1xuICB9XG5cbiAgY29uc3QgQmFzZVJlYWxtID0ge1xuICAgIGluaXRSb290UmVhbG0sXG4gICAgaW5pdENvbXBhcnRtZW50LFxuICAgIGdldFJlYWxtR2xvYmFsLFxuICAgIHJlYWxtRXZhbHVhdGVcbiAgfTtcblxuICAvLyBDcmVhdGUgdGhlIGN1cnJlbnQgdW5zYWZlUmVjIGZyb20gdGhlIGN1cnJlbnQgXCJwcmltYWxcIiBlbnZpcm9ubWVudCAodGhlIHJlYWxtXG4gIC8vIHdoZXJlIHRoZSBSZWFsbSBzaGltIGlzIGxvYWRlZCBhbmQgZXhlY3V0ZWQpLlxuICBjb25zdCBjdXJyZW50VW5zYWZlUmVjID0gY3JlYXRlQ3VycmVudFVuc2FmZVJlYygpO1xuXG4gIC8qKlxuICAgKiBUaGUgXCJwcmltYWxcIiByZWFsbSBjbGFzcyBpcyBkZWZpbmVkIGluIHRoZSBjdXJyZW50IFwicHJpbWFsXCIgZW52aXJvbm1lbnQsXG4gICAqIGFuZCBpcyBwYXJ0IG9mIHRoZSBzaGltLiBUaGVyZSBpcyBubyBuZWVkIHRvIGZhY2FkZSB0aGlzIGNsYXNzIHZpYSBldmFsdWF0aW9uXG4gICAqIGJlY2F1c2UgYm90aCBzaGFyZSB0aGUgc2FtZSBpbnRyaW5zaWNzLlxuICAgKi9cbiAgY29uc3QgUmVhbG0gPSBidWlsZENoaWxkUmVhbG0oY3VycmVudFVuc2FmZVJlYywgQmFzZVJlYWxtKTtcblxuICByZXR1cm4gUmVhbG07XG5cbn0pKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlYWxtcy1zaGltLnVtZC5qcy5tYXBcbiIsIi8vICAgICAgXG4vLyBBbiBldmVudCBoYW5kbGVyIGNhbiB0YWtlIGFuIG9wdGlvbmFsIGV2ZW50IGFyZ3VtZW50XG4vLyBhbmQgc2hvdWxkIG5vdCByZXR1cm4gYSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcblxuLy8gQW4gYXJyYXkgb2YgYWxsIGN1cnJlbnRseSByZWdpc3RlcmVkIGV2ZW50IGhhbmRsZXJzIGZvciBhIHR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbi8vIEEgbWFwIG9mIGV2ZW50IHR5cGVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIGV2ZW50IGhhbmRsZXJzLlxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gIFxuXG4vKiogTWl0dDogVGlueSAofjIwMGIpIGZ1bmN0aW9uYWwgZXZlbnQgZW1pdHRlciAvIHB1YnN1Yi5cbiAqICBAbmFtZSBtaXR0XG4gKiAgQHJldHVybnMge01pdHR9XG4gKi9cbmZ1bmN0aW9uIG1pdHQoYWxsICAgICAgICAgICAgICAgICApIHtcblx0YWxsID0gYWxsIHx8IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cblx0cmV0dXJuIHtcblx0XHQvKipcblx0XHQgKiBSZWdpc3RlciBhbiBldmVudCBoYW5kbGVyIGZvciB0aGUgZ2l2ZW4gdHlwZS5cblx0XHQgKlxuXHRcdCAqIEBwYXJhbSAge1N0cmluZ30gdHlwZVx0VHlwZSBvZiBldmVudCB0byBsaXN0ZW4gZm9yLCBvciBgXCIqXCJgIGZvciBhbGwgZXZlbnRzXG5cdFx0ICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgRnVuY3Rpb24gdG8gY2FsbCBpbiByZXNwb25zZSB0byBnaXZlbiBldmVudFxuXHRcdCAqIEBtZW1iZXJPZiBtaXR0XG5cdFx0ICovXG5cdFx0b246IGZ1bmN0aW9uIG9uKHR5cGUgICAgICAgICwgaGFuZGxlciAgICAgICAgICAgICAgKSB7XG5cdFx0XHQoYWxsW3R5cGVdIHx8IChhbGxbdHlwZV0gPSBbXSkpLnB1c2goaGFuZGxlcik7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyIGZvciB0aGUgZ2l2ZW4gdHlwZS5cblx0XHQgKlxuXHRcdCAqIEBwYXJhbSAge1N0cmluZ30gdHlwZVx0VHlwZSBvZiBldmVudCB0byB1bnJlZ2lzdGVyIGBoYW5kbGVyYCBmcm9tLCBvciBgXCIqXCJgXG5cdFx0ICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgSGFuZGxlciBmdW5jdGlvbiB0byByZW1vdmVcblx0XHQgKiBAbWVtYmVyT2YgbWl0dFxuXHRcdCAqL1xuXHRcdG9mZjogZnVuY3Rpb24gb2ZmKHR5cGUgICAgICAgICwgaGFuZGxlciAgICAgICAgICAgICAgKSB7XG5cdFx0XHRpZiAoYWxsW3R5cGVdKSB7XG5cdFx0XHRcdGFsbFt0eXBlXS5zcGxpY2UoYWxsW3R5cGVdLmluZGV4T2YoaGFuZGxlcikgPj4+IDAsIDEpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBJbnZva2UgYWxsIGhhbmRsZXJzIGZvciB0aGUgZ2l2ZW4gdHlwZS5cblx0XHQgKiBJZiBwcmVzZW50LCBgXCIqXCJgIGhhbmRsZXJzIGFyZSBpbnZva2VkIGFmdGVyIHR5cGUtbWF0Y2hlZCBoYW5kbGVycy5cblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlICBUaGUgZXZlbnQgdHlwZSB0byBpbnZva2Vcblx0XHQgKiBAcGFyYW0ge0FueX0gW2V2dF0gIEFueSB2YWx1ZSAob2JqZWN0IGlzIHJlY29tbWVuZGVkIGFuZCBwb3dlcmZ1bCksIHBhc3NlZCB0byBlYWNoIGhhbmRsZXJcblx0XHQgKiBAbWVtYmVyT2YgbWl0dFxuXHRcdCAqL1xuXHRcdGVtaXQ6IGZ1bmN0aW9uIGVtaXQodHlwZSAgICAgICAgLCBldnQgICAgICkge1xuXHRcdFx0KGFsbFt0eXBlXSB8fCBbXSkuc2xpY2UoKS5tYXAoZnVuY3Rpb24gKGhhbmRsZXIpIHsgaGFuZGxlcihldnQpOyB9KTtcblx0XHRcdChhbGxbJyonXSB8fCBbXSkuc2xpY2UoKS5tYXAoZnVuY3Rpb24gKGhhbmRsZXIpIHsgaGFuZGxlcih0eXBlLCBldnQpOyB9KTtcblx0XHR9XG5cdH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1pdHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1taXR0LmVzLmpzLm1hcFxuIiwiaW1wb3J0IG1pdHQgZnJvbSAnbWl0dCc7XG5jb25zdCBNZXNzYWdlQ2VudGVyRXZlbnQgPSAnSG9sb2Zsb3dzLUtpdCBNZXNzYWdlQ2VudGVyJztcbmNvbnN0IG5ld01lc3NhZ2UgPSAoa2V5LCBkYXRhKSA9PiBuZXcgQ3VzdG9tRXZlbnQoTWVzc2FnZUNlbnRlckV2ZW50LCB7IGRldGFpbDogeyBkYXRhLCBrZXkgfSB9KTtcbmNvbnN0IG5vb3AgPSAoKSA9PiB7IH07XG4vKipcbiAqIFNlbmQgYW5kIHJlY2VpdmUgbWVzc2FnZXMgaW4gZGlmZmVyZW50IGNvbnRleHRzLlxuICovXG5leHBvcnQgY2xhc3MgTWVzc2FnZUNlbnRlciB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIGluc3RhbmNlS2V5IC0gVXNlIHRoaXMgaW5zdGFuY2VLZXkgdG8gZGlzdGluZ3Vpc2ggeW91ciBtZXNzYWdlcyBhbmQgb3RoZXJzLlxuICAgICAqIFRoaXMgb3B0aW9uIGNhbm5vdCBtYWtlIHlvdXIgbWVzc2FnZSBzYWZlIVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGluc3RhbmNlS2V5ID0gJycpIHtcbiAgICAgICAgdGhpcy5pbnN0YW5jZUtleSA9IGluc3RhbmNlS2V5O1xuICAgICAgICB0aGlzLmV2ZW50RW1pdHRlciA9IG5ldyBtaXR0KCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSAocmVxdWVzdCkgPT4ge1xuICAgICAgICAgICAgbGV0IHsga2V5LCBkYXRhLCBpbnN0YW5jZUtleSB9ID0gcmVxdWVzdC5kZXRhaWwgfHwgcmVxdWVzdDtcbiAgICAgICAgICAgIC8vIE1lc3NhZ2UgaXMgbm90IGZvciB1c1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5zdGFuY2VLZXkgIT09IChpbnN0YW5jZUtleSB8fCAnJykpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMud3JpdGVUb0NvbnNvbGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgJWNSZWNlaXZlJWMgJWMke2tleS50b1N0cmluZygpfWAsICdiYWNrZ3JvdW5kOiByZ2JhKDAsIDI1NSwgMjU1LCAwLjYpOyBjb2xvcjogYmxhY2s7IHBhZGRpbmc6IDBweCA2cHg7IGJvcmRlci1yYWRpdXM6IDRweDsnLCAnJywgJ3RleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lJywgZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmV2ZW50RW1pdHRlci5lbWl0KGtleSwgZGF0YSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc2VuZCA9IHRoaXMuZW1pdDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNob3VsZCBNZXNzYWdlQ2VudGVyIHByaW50cyBhbGwgbWVzc2FnZXMgdG8gY29uc29sZT9cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMud3JpdGVUb0NvbnNvbGUgPSBmYWxzZTtcbiAgICAgICAgaWYgKHR5cGVvZiBicm93c2VyICE9PSAndW5kZWZpbmVkJyAmJiBicm93c2VyLnJ1bnRpbWUgJiYgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhIG1lc3NhZ2UgaXMgc2VudCBmcm9tIGVpdGhlciBhbiBleHRlbnNpb24gcHJvY2VzcyAoYnkgcnVudGltZS5zZW5kTWVzc2FnZSlcbiAgICAgICAgICAgIC8vIG9yIGEgY29udGVudCBzY3JpcHQgKGJ5IHRhYnMuc2VuZE1lc3NhZ2UpLlxuICAgICAgICAgICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcih0aGlzLmxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKE1lc3NhZ2VDZW50ZXJFdmVudCwgdGhpcy5saXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogTGlzdGVuIHRvIGFuIGV2ZW50XG4gICAgICogQHBhcmFtIGV2ZW50IC0gTmFtZSBvZiB0aGUgZXZlbnRcbiAgICAgKiBAcGFyYW0gaGFuZGxlciAtIEhhbmRsZXIgb2YgdGhlIGV2ZW50XG4gICAgICovXG4gICAgb24oZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgdGhpcy5ldmVudEVtaXR0ZXIub24oZXZlbnQsIGhhbmRsZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kIG1lc3NhZ2UgdG8gbG9jYWwgb3Igb3RoZXIgaW5zdGFuY2Ugb2YgZXh0ZW5zaW9uXG4gICAgICogQHBhcmFtIGtleSAtIEtleSBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBkYXRhIC0gRGF0YSBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBhbHNvU2VuZFRvRG9jdW1lbnQgLSAhIFNlbmQgbWVzc2FnZSB0byBkb2N1bWVudC4gVGhpcyBtYXkgbGVha3Mgc2VjcmV0ISBPbmx5IG9wZW4gaW4gbG9jYWxob3N0IVxuICAgICAqL1xuICAgIGVtaXQoa2V5LCBkYXRhLCBhbHNvU2VuZFRvRG9jdW1lbnQgPSBsb2NhdGlvbi5ob3N0bmFtZSA9PT0gJ2xvY2FsaG9zdCcpIHtcbiAgICAgICAgaWYgKHRoaXMud3JpdGVUb0NvbnNvbGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAlY1NlbmQlYyAlYyR7a2V5LnRvU3RyaW5nKCl9YCwgJ2JhY2tncm91bmQ6IHJnYmEoMCwgMjU1LCAyNTUsIDAuNik7IGNvbG9yOiBibGFjazsgcGFkZGluZzogMHB4IDZweDsgYm9yZGVyLXJhZGl1czogNHB4OycsICcnLCAndGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmUnLCBkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtc2cgPSB7IGRhdGEsIGtleSwgaW5zdGFuY2VLZXk6IHRoaXMuaW5zdGFuY2VLZXkgfHwgJycgfTtcbiAgICAgICAgaWYgKHR5cGVvZiBicm93c2VyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKGJyb3dzZXIucnVudGltZSAmJiBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobXNnKS5jYXRjaChub29wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChicm93c2VyLnRhYnMpIHtcbiAgICAgICAgICAgICAgICAvLyBTZW5kIG1lc3NhZ2UgdG8gQ29udGVudCBTY3JpcHRcbiAgICAgICAgICAgICAgICBicm93c2VyLnRhYnMucXVlcnkoeyBkaXNjYXJkZWQ6IGZhbHNlIH0pLnRoZW4odGFicyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdGFiIG9mIHRhYnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWIuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJvd3Nlci50YWJzLnNlbmRNZXNzYWdlKHRhYi5pZCwgbXNnKS5jYXRjaChub29wKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbHNvU2VuZFRvRG9jdW1lbnQgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KSB7XG4gICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ld01lc3NhZ2Uoa2V5LCBkYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1NZXNzYWdlQ2VudGVyLmpzLm1hcCIsIi8qKlxuICogVGhpcyBmaWxlIChBc3luY0NhbGwpIGlzIHVuZGVyIE1JVCBMaWNlbnNlXG4gKlxuICogVGhpcyBpcyBhIGxpZ2h0IGltcGxlbWVudGF0aW9uIG9mIEpTT04gUlBDIDIuMFxuICpcbiAqIGh0dHBzOi8vd3d3Lmpzb25ycGMub3JnL3NwZWNpZmljYXRpb25cbiAqL1xuaW1wb3J0IHsgTWVzc2FnZUNlbnRlciB9IGZyb20gJy4uL0V4dGVuc2lvbi9NZXNzYWdlQ2VudGVyJztcbi8qKlxuICogU2VyaWFsaXphdGlvbiBpbXBsZW1lbnRhdGlvbiB0aGF0IGRvIG5vdGhpbmdcbiAqL1xuZXhwb3J0IGNvbnN0IE5vU2VyaWFsaXphdGlvbiA9IHtcbiAgICBhc3luYyBzZXJpYWxpemF0aW9uKGZyb20pIHtcbiAgICAgICAgcmV0dXJuIGZyb207XG4gICAgfSxcbiAgICBhc3luYyBkZXNlcmlhbGl6YXRpb24oc2VyaWFsaXplZCkge1xuICAgICAgICByZXR1cm4gc2VyaWFsaXplZDtcbiAgICB9LFxufTtcbi8qKlxuICogU2VyaWFsaXphdGlvbiBpbXBsZW1lbnRhdGlvbiBieSBKU09OLnBhcnNlL3N0cmluZ2lmeVxuICpcbiAqIEBwYXJhbSByZXBsYWNlckFuZFJlY2VpdmVyIC0gUmVwbGFjZXIgb2YgSlNPTi5wYXJzZS9zdHJpbmdpZnlcbiAqL1xuZXhwb3J0IGNvbnN0IEpTT05TZXJpYWxpemF0aW9uID0gKFtyZXBsYWNlciwgcmVjZWl2ZXJdID0gW3VuZGVmaW5lZCwgdW5kZWZpbmVkXSwgc3BhY2UpID0+ICh7XG4gICAgYXN5bmMgc2VyaWFsaXphdGlvbihmcm9tKSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShmcm9tLCByZXBsYWNlciwgc3BhY2UpO1xuICAgIH0sXG4gICAgYXN5bmMgZGVzZXJpYWxpemF0aW9uKHNlcmlhbGl6ZWQpIHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uoc2VyaWFsaXplZCwgcmVjZWl2ZXIpO1xuICAgIH0sXG59KTtcbi8qKlxuICogQXN5bmMgY2FsbCBiZXR3ZWVuIGRpZmZlcmVudCBjb250ZXh0LlxuICpcbiAqIEByZW1hcmtzXG4gKiBBc3luYyBjYWxsIGlzIGEgaGlnaCBsZXZlbCBhYnN0cmFjdGlvbiBvZiBNZXNzYWdlQ2VudGVyLlxuICpcbiAqICMgU2hhcmVkIGNvZGVcbiAqXG4gKiAtIEhvdyB0byBzdHJpbmdpZnkvcGFyc2UgcGFyYW1ldGVycy9yZXR1cm5zIHNob3VsZCBiZSBzaGFyZWQsIGRlZmF1bHRzIHRvIE5vU2VyaWFsaXphdGlvbi5cbiAqXG4gKiAtIGBrZXlgIHNob3VsZCBiZSBzaGFyZWQuXG4gKlxuICogIyBPbmUgc2lkZVxuICpcbiAqIC0gU2hvdWxkIHByb3ZpZGUgc29tZSBmdW5jdGlvbnMgdGhlbiBleHBvcnQgaXRzIHR5cGUgKGZvciBleGFtcGxlLCBgQmFja2dyb3VuZENhbGxzYClcbiAqXG4gKiAtIGBjb25zdCBjYWxsID0gQXN5bmNDYWxsPEZvcmVncm91bmRDYWxscz4oYmFja2dyb3VuZENhbGxzKWBcbiAqXG4gKiAtIFRoZW4geW91IGNhbiBgY2FsbGAgYW55IG1ldGhvZCBvbiBgRm9yZWdyb3VuZENhbGxzYFxuICpcbiAqICMgT3RoZXIgc2lkZVxuICpcbiAqIC0gU2hvdWxkIHByb3ZpZGUgc29tZSBmdW5jdGlvbnMgdGhlbiBleHBvcnQgaXRzIHR5cGUgKGZvciBleGFtcGxlLCBgRm9yZWdyb3VuZENhbGxzYClcbiAqXG4gKiAtIGBjb25zdCBjYWxsID0gQXN5bmNDYWxsPEJhY2tncm91bmRDYWxscz4oZm9yZWdyb3VuZENhbGxzKWBcbiAqXG4gKiAtIFRoZW4geW91IGNhbiBgY2FsbGAgYW55IG1ldGhvZCBvbiBgQmFja2dyb3VuZENhbGxzYFxuICpcbiAqIE5vdGU6IFR3byBzaWRlcyBjYW4gaW1wbGVtZW50IHRoZSBzYW1lIGZ1bmN0aW9uXG4gKlxuICogQGV4YW1wbGVcbiAqIEZvciBleGFtcGxlLCBoZXJlIGlzIGEgbW9ubyByZXBvLlxuICpcbiAqIENvZGUgZm9yIFVJIHBhcnQ6XG4gKiBgYGB0c1xuICogY29uc3QgVUkgPSB7XG4gKiAgICAgIGFzeW5jIGRpYWxvZyh0ZXh0OiBzdHJpbmcpIHtcbiAqICAgICAgICAgIGFsZXJ0KHRleHQpXG4gKiAgICAgIH0sXG4gKiB9XG4gKiBleHBvcnQgdHlwZSBVSSA9IHR5cGVvZiBVSVxuICogY29uc3QgY2FsbHNDbGllbnQgPSBBc3luY0NhbGw8U2VydmVyPihVSSlcbiAqIGNhbGxzQ2xpZW50LnNlbmRNYWlsKCdoZWxsbyB3b3JsZCcsICd3aGF0JylcbiAqIGBgYFxuICpcbiAqIENvZGUgZm9yIHNlcnZlciBwYXJ0XG4gKiBgYGB0c1xuICogY29uc3QgU2VydmVyID0ge1xuICogICAgICBhc3luYyBzZW5kTWFpbCh0ZXh0OiBzdHJpbmcsIHRvOiBzdHJpbmcpIHtcbiAqICAgICAgICAgIHJldHVybiB0cnVlXG4gKiAgICAgIH1cbiAqIH1cbiAqIGV4cG9ydCB0eXBlIFNlcnZlciA9IHR5cGVvZiBTZXJ2ZXJcbiAqIGNvbnN0IGNhbGxzID0gQXN5bmNDYWxsPFVJPihTZXJ2ZXIpXG4gKiBjYWxscy5kaWFsb2coJ2hlbGxvJylcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBpbXBsZW1lbnRhdGlvbiAtIEltcGxlbWVudGF0aW9uIG9mIHRoaXMgc2lkZS5cbiAqIEBwYXJhbSBvcHRpb25zIC0gRGVmaW5lIHlvdXIgb3duIHNlcmlhbGl6ZXIsIE1lc3NhZ2VDZW50ZXIgb3Igb3RoZXIgb3B0aW9ucy5cbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBBc3luY0NhbGwoaW1wbGVtZW50YXRpb24gPSB7fSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgeyBzZXJpYWxpemVyLCBrZXksIHN0cmljdCwgbG9nLCBwYXJhbWV0ZXJTdHJ1Y3R1cmVzIH0gPSB7XG4gICAgICAgIHNlcmlhbGl6ZXI6IE5vU2VyaWFsaXphdGlvbixcbiAgICAgICAga2V5OiAnZGVmYXVsdC1qc29ucnBjJyxcbiAgICAgICAgc3RyaWN0OiBmYWxzZSxcbiAgICAgICAgbG9nOiB0cnVlLFxuICAgICAgICBwYXJhbWV0ZXJTdHJ1Y3R1cmVzOiAnYnktcG9zaXRpb24nLFxuICAgICAgICAuLi5vcHRpb25zLFxuICAgIH07XG4gICAgY29uc3QgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZUNoYW5uZWwgfHwgbmV3IE1lc3NhZ2VDZW50ZXIoKTtcbiAgICBjb25zdCB7IG1ldGhvZE5vdEZvdW5kOiBiYW5NZXRob2ROb3RGb3VuZCA9IGZhbHNlLCBub1VuZGVmaW5lZDogbm9VbmRlZmluZWRLZWVwaW5nID0gZmFsc2UsIHVua25vd25NZXNzYWdlOiBiYW5Vbmtub3duTWVzc2FnZSA9IGZhbHNlLCB9ID0gdHlwZW9mIHN0cmljdCA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgID8gc3RyaWN0XG4gICAgICAgICAgICA/IHsgbWV0aG9kTm90Rm91bmQ6IHRydWUsIHVua25vd25NZXNzYWdlOiB0cnVlLCBub1VuZGVmaW5lZDogdHJ1ZSB9XG4gICAgICAgICAgICA6IHsgbWV0aG9kTm90Rm91bmQ6IGZhbHNlLCB1bmtub3duTWVzc2FnZTogZmFsc2UsIG5vVW5kZWZpbmVkOiBmYWxzZSB9XG4gICAgICAgIDogc3RyaWN0O1xuICAgIGNvbnN0IHsgYmVDYWxsZWQ6IGxvZ0JlQ2FsbGVkID0gdHJ1ZSwgbG9jYWxFcnJvcjogbG9nTG9jYWxFcnJvciA9IHRydWUsIHJlbW90ZUVycm9yOiBsb2dSZW1vdGVFcnJvciA9IHRydWUsIHR5cGU6IGxvZ1R5cGUgPSAncHJldHR5JywgfSA9IHR5cGVvZiBsb2cgPT09ICdib29sZWFuJ1xuICAgICAgICA/IGxvZ1xuICAgICAgICAgICAgPyB7IGJlQ2FsbGVkOiB0cnVlLCBsb2NhbEVycm9yOiB0cnVlLCByZW1vdGVFcnJvcjogdHJ1ZSwgdHlwZTogJ3ByZXR0eScgfVxuICAgICAgICAgICAgOiB7IGJlQ2FsbGVkOiBmYWxzZSwgbG9jYWxFcnJvcjogZmFsc2UsIHJlbW90ZUVycm9yOiBmYWxzZSwgdHlwZTogJ2Jhc2ljJyB9XG4gICAgICAgIDogbG9nO1xuICAgIGNvbnN0IHJlcXVlc3RDb250ZXh0ID0gbmV3IE1hcCgpO1xuICAgIGFzeW5jIGZ1bmN0aW9uIG9uUmVxdWVzdChkYXRhKSB7XG4gICAgICAgIGxldCBmcmFtZXdvcmtTdGFjayA9ICcnO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gPyBXZSdyZSBub3QgaW1wbGVtZW50aW5nIGFueSBKU09OIFJQQyBleHRlbnNpb24uIFNvIGxldCBpdCB0byBiZSB1bmRlZmluZWQuXG4gICAgICAgICAgICBjb25zdCBleGVjdXRvciA9IGRhdGEubWV0aG9kLnN0YXJ0c1dpdGgoJ3JwYy4nKVxuICAgICAgICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgOiBpbXBsZW1lbnRhdGlvbltkYXRhLm1ldGhvZF07XG4gICAgICAgICAgICBpZiAoIWV4ZWN1dG9yKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFiYW5NZXRob2ROb3RGb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9nTG9jYWxFcnJvcilcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY2VpdmUgcmVtb3RlIGNhbGwsIGJ1dCBub3QgaW1wbGVtZW50ZWQuJywga2V5LCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFcnJvclJlc3BvbnNlLk1ldGhvZE5vdEZvdW5kKGRhdGEuaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gZGF0YS5wYXJhbXM7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJhbXMpIHx8ICh0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0JyAmJiBwYXJhbXMgIT09IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IEFycmF5LmlzQXJyYXkocGFyYW1zKSA/IHBhcmFtcyA6IFtwYXJhbXNdO1xuICAgICAgICAgICAgICAgIGZyYW1ld29ya1N0YWNrID0gcmVtb3ZlU3RhY2tIZWFkZXIobmV3IEVycm9yKCkuc3RhY2spO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSBleGVjdXRvciguLi5hcmdzKTtcbiAgICAgICAgICAgICAgICBpZiAobG9nQmVDYWxsZWQpXG4gICAgICAgICAgICAgICAgICAgIGxvZ1R5cGUgPT09ICdiYXNpYydcbiAgICAgICAgICAgICAgICAgICAgICAgID8gY29uc29sZS5sb2coYCR7a2V5fS4ke2RhdGEubWV0aG9kfSgke1suLi5hcmdzXS50b1N0cmluZygpfSkgQCR7ZGF0YS5pZH1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBjb25zb2xlLmxvZyhgJHtrZXl9LiVjJHtkYXRhLm1ldGhvZH0lYygke2FyZ3MubWFwKCgpID0+ICclbycpLmpvaW4oJywgJyl9JWMpXFxuJW8gJWNAJHtkYXRhLmlkfWAsICdjb2xvcjogI2QyYzA1NycsICcnLCAuLi5hcmdzLCAnJywgcHJvbWlzZSwgJ2NvbG9yOiBncmF5OyBmb250LXN0eWxlOiBpdGFsaWM7Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdWNjZXNzUmVzcG9uc2UoZGF0YS5pZCwgYXdhaXQgcHJvbWlzZSwgISFub1VuZGVmaW5lZEtlZXBpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEVycm9yUmVzcG9uc2UuSW52YWxpZFJlcXVlc3QoZGF0YS5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGUuc3RhY2sgPSBmcmFtZXdvcmtTdGFja1xuICAgICAgICAgICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgICAgICAgICAucmVkdWNlKChzdGFjaywgZnN0YWNrKSA9PiBzdGFjay5yZXBsYWNlKGZzdGFjayArICdcXG4nLCAnJyksIGUuc3RhY2sgfHwgJycpO1xuICAgICAgICAgICAgaWYgKGxvZ0xvY2FsRXJyb3IpXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIGxldCBuYW1lID0gJ0Vycm9yJztcbiAgICAgICAgICAgIG5hbWUgPSBlLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgICAgICAgICBpZiAodHlwZW9mIERPTUV4Y2VwdGlvbiA9PT0gJ2Z1bmN0aW9uJyAmJiBlIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uKVxuICAgICAgICAgICAgICAgIG5hbWUgPSAnRE9NRXhjZXB0aW9uOicgKyBlLm5hbWU7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yUmVzcG9uc2UoZGF0YS5pZCwgLTEsIGUubWVzc2FnZSwgZS5zdGFjaywgbmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgZnVuY3Rpb24gb25SZXNwb25zZShkYXRhKSB7XG4gICAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSAnJywgcmVtb3RlRXJyb3JTdGFjayA9ICcnLCBlcnJvckNvZGUgPSAwLCBlcnJvclR5cGUgPSAnRXJyb3InO1xuICAgICAgICBpZiAoaGFzS2V5KGRhdGEsICdlcnJvcicpKSB7XG4gICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBkYXRhLmVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICBlcnJvckNvZGUgPSBkYXRhLmVycm9yLmNvZGU7XG4gICAgICAgICAgICByZW1vdGVFcnJvclN0YWNrID0gKGRhdGEuZXJyb3IuZGF0YSAmJiBkYXRhLmVycm9yLmRhdGEuc3RhY2spIHx8ICc8cmVtb3RlIHN0YWNrIG5vdCBhdmFpbGFibGU+JztcbiAgICAgICAgICAgIGVycm9yVHlwZSA9IChkYXRhLmVycm9yLmRhdGEgJiYgZGF0YS5lcnJvci5kYXRhLnR5cGUpIHx8ICdFcnJvcic7XG4gICAgICAgICAgICBpZiAobG9nUmVtb3RlRXJyb3IpXG4gICAgICAgICAgICAgICAgbG9nVHlwZSA9PT0gJ2Jhc2ljJ1xuICAgICAgICAgICAgICAgICAgICA/IGNvbnNvbGUuZXJyb3IoYCR7ZXJyb3JUeXBlfTogJHtlcnJvck1lc3NhZ2V9KCR7ZXJyb3JDb2RlfSkgQCR7ZGF0YS5pZH1cXG4ke3JlbW90ZUVycm9yU3RhY2t9YClcbiAgICAgICAgICAgICAgICAgICAgOiBjb25zb2xlLmVycm9yKGAke2Vycm9yVHlwZX06ICR7ZXJyb3JNZXNzYWdlfSgke2Vycm9yQ29kZX0pICVjQCR7ZGF0YS5pZH1cXG4lYyR7cmVtb3RlRXJyb3JTdGFja31gLCAnY29sb3I6IGdyYXknLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEuaWQgPT09IG51bGwgfHwgZGF0YS5pZCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB7IGY6IFtyZXNvbHZlLCByZWplY3RdLCBzdGFjazogbG9jYWxFcnJvclN0YWNrLCB9ID0gcmVxdWVzdENvbnRleHQuZ2V0KGRhdGEuaWQpIHx8IHsgc3RhY2s6ICcnLCBmOiBbbnVsbCwgbnVsbF0gfTtcbiAgICAgICAgaWYgKCFyZXNvbHZlKVxuICAgICAgICAgICAgcmV0dXJuOyAvLyBkcm9wIHRoaXMgcmVzcG9uc2VcbiAgICAgICAgcmVxdWVzdENvbnRleHQuZGVsZXRlKGRhdGEuaWQpO1xuICAgICAgICBpZiAoaGFzS2V5KGRhdGEsICdlcnJvcicpKSB7XG4gICAgICAgICAgICByZWplY3QoUmVjb3ZlckVycm9yKGVycm9yVHlwZSwgZXJyb3JNZXNzYWdlLCBlcnJvckNvZGUsIFxuICAgICAgICAgICAgLy8gPyBXZSB1c2UgXFx1MDQzMCB3aGljaCBsb29rcyBsaWtlIFwiYVwiIHRvIHByZXZlbnQgYnJvd3NlciB0aGluayBcImF0IEFzeW5jQ2FsbFwiIGlzIGEgcmVhbCBzdGFja1xuICAgICAgICAgICAgcmVtb3RlRXJyb3JTdGFjayArICdcXG4gICAgXFx1MDQzMHQgQXN5bmNDYWxsIChycGMpIFxcbicgKyBsb2NhbEVycm9yU3RhY2spKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc29sdmUoZGF0YS5yZXN1bHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG1lc3NhZ2Uub24oa2V5LCBhc3luYyAoXykgPT4ge1xuICAgICAgICBsZXQgZGF0YTtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRhdGEgPSBhd2FpdCBzZXJpYWxpemVyLmRlc2VyaWFsaXphdGlvbihfKTtcbiAgICAgICAgICAgIGlmIChpc0pTT05SUENPYmplY3QoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVTaW5nbGVNZXNzYWdlKGRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNlbmQocmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkgJiYgZGF0YS5ldmVyeShpc0pTT05SUENPYmplY3QpICYmIGRhdGEubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5hbGwoZGF0YS5tYXAoaGFuZGxlU2luZ2xlTWVzc2FnZSkpO1xuICAgICAgICAgICAgICAgIC8vID8gUmVzcG9uc2VcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5ldmVyeSh4ID0+IHggPT09IHVuZGVmaW5lZCkpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZW5kKHJlc3VsdC5maWx0ZXIoeCA9PiB4KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoYmFuVW5rbm93bk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2VuZChFcnJvclJlc3BvbnNlLkludmFsaWRSZXF1ZXN0KGRhdGEuaWQgfHwgbnVsbCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gPyBJZ25vcmUgdGhpcyBtZXNzYWdlLiBUaGUgbWVzc2FnZSBjaGFubmVsIG1heWJlIGFsc28gdXNlZCB0byB0cmFuc2ZlciBvdGhlciBtZXNzYWdlIHRvby5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSwgZGF0YSwgcmVzdWx0KTtcbiAgICAgICAgICAgIHNlbmQoRXJyb3JSZXNwb25zZS5QYXJzZUVycm9yKGUuc3RhY2spKTtcbiAgICAgICAgfVxuICAgICAgICBhc3luYyBmdW5jdGlvbiBzZW5kKHJlcykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGx5ID0gcmVzLm1hcCh4ID0+IHgpLmZpbHRlcih4ID0+IHguaWQgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGx5Lmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UuZW1pdChrZXksIGF3YWl0IHNlcmlhbGl6ZXIuc2VyaWFsaXphdGlvbihyZXBseSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXMpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAvLyA/IFRoaXMgaXMgYSBOb3RpZmljYXRpb24sIHdlIE1VU1Qgbm90IHJldHVybiBpdC5cbiAgICAgICAgICAgICAgICBpZiAocmVzLmlkID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLmVtaXQoa2V5LCBhd2FpdCBzZXJpYWxpemVyLnNlcmlhbGl6YXRpb24ocmVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFByb3h5KHt9LCB7XG4gICAgICAgIGdldCh0YXJnZXQsIG1ldGhvZCwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICAgIGxldCBzdGFjayA9IHJlbW92ZVN0YWNrSGVhZGVyKG5ldyBFcnJvcigpLnN0YWNrKTtcbiAgICAgICAgICAgIHJldHVybiAoLi4ucGFyYW1zKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgIT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KCdPbmx5IHN0cmluZyBjYW4gYmUga2V5cycpO1xuICAgICAgICAgICAgICAgIGlmIChtZXRob2Quc3RhcnRzV2l0aCgncnBjLicpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KCdZb3UgY2Fubm90IGNhbGwgSlNPTiBSUEMgaW50ZXJuYWwgbWV0aG9kcyBkaXJlY3RseScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gTWF0aC5yYW5kb20oKVxuICAgICAgICAgICAgICAgICAgICAudG9TdHJpbmcoMzYpXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgyKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXEgPSBwYXJhbWV0ZXJTdHJ1Y3R1cmVzID09PSAnYnktbmFtZScgJiYgcGFyYW1zLmxlbmd0aCA9PT0gMSAmJiBpc09iamVjdChwYXJhbXNbMF0pXG4gICAgICAgICAgICAgICAgICAgID8gbmV3IFJlcXVlc3QoaWQsIG1ldGhvZCwgcGFyYW1zWzBdKVxuICAgICAgICAgICAgICAgICAgICA6IG5ldyBSZXF1ZXN0KGlkLCBtZXRob2QsIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgc2VyaWFsaXplci5zZXJpYWxpemF0aW9uKHJlcSkudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5lbWl0KGtleSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RDb250ZXh0LnNldChpZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZjogW3Jlc29sdmUsIHJlamVjdF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjayxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0pO1xuICAgIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVNpbmdsZU1lc3NhZ2UoZGF0YSkge1xuICAgICAgICBpZiAoaGFzS2V5KGRhdGEsICdtZXRob2QnKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9uUmVxdWVzdChkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgnZXJyb3InIGluIGRhdGEgfHwgJ3Jlc3VsdCcgaW4gZGF0YSkge1xuICAgICAgICAgICAgb25SZXNwb25zZShkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICgncmVzdWx0SXNVbmRlZmluZWQnIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgZGF0YS5yZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgb25SZXNwb25zZShkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gRXJyb3JSZXNwb25zZS5JbnZhbGlkUmVxdWVzdChkYXRhLmlkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbn1cbmNvbnN0IGpzb25ycGMgPSAnMi4wJztcbmNsYXNzIFJlcXVlc3Qge1xuICAgIGNvbnN0cnVjdG9yKGlkLCBtZXRob2QsIHBhcmFtcykge1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMubWV0aG9kID0gbWV0aG9kO1xuICAgICAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcztcbiAgICAgICAgdGhpcy5qc29ucnBjID0gJzIuMCc7XG4gICAgICAgIHJldHVybiB7IGlkLCBtZXRob2QsIHBhcmFtcywganNvbnJwYyB9O1xuICAgIH1cbn1cbmNsYXNzIFN1Y2Nlc3NSZXNwb25zZSB7XG4gICAgY29uc3RydWN0b3IoaWQsIHJlc3VsdCwgbm9VbmRlZmluZWRLZWVwaW5nKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5yZXN1bHQgPSByZXN1bHQ7XG4gICAgICAgIHRoaXMuanNvbnJwYyA9ICcyLjAnO1xuICAgICAgICBjb25zdCBvYmogPSB7IGlkLCBqc29ucnBjLCByZXN1bHQ6IHJlc3VsdCB8fCBudWxsIH07XG4gICAgICAgIGlmICghbm9VbmRlZmluZWRLZWVwaW5nICYmIHJlc3VsdCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgb2JqLnJlc3VsdElzVW5kZWZpbmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG59XG5jbGFzcyBFcnJvclJlc3BvbnNlIHtcbiAgICBjb25zdHJ1Y3RvcihpZCwgY29kZSwgbWVzc2FnZSwgc3RhY2ssIHR5cGUgPSAnRXJyb3InKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5qc29ucnBjID0gJzIuMCc7XG4gICAgICAgIGlmIChpZCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgaWQgPSBudWxsO1xuICAgICAgICBjb2RlID0gTWF0aC5mbG9vcihjb2RlKTtcbiAgICAgICAgY29uc3QgZXJyb3IgPSAodGhpcy5lcnJvciA9IHsgY29kZSwgbWVzc2FnZSwgZGF0YTogeyBzdGFjaywgdHlwZSB9IH0pO1xuICAgICAgICByZXR1cm4geyBlcnJvciwgaWQsIGpzb25ycGMgfTtcbiAgICB9XG59XG4vLyBQcmUgZGVmaW5lZCBlcnJvciBpbiBzZWN0aW9uIDUuMVxuRXJyb3JSZXNwb25zZS5QYXJzZUVycm9yID0gKHN0YWNrID0gJycpID0+IG5ldyBFcnJvclJlc3BvbnNlKG51bGwsIC0zMjcwMCwgJ1BhcnNlIGVycm9yJywgc3RhY2spO1xuRXJyb3JSZXNwb25zZS5JbnZhbGlkUmVxdWVzdCA9IChpZCkgPT4gbmV3IEVycm9yUmVzcG9uc2UoaWQsIC0zMjYwMCwgJ0ludmFsaWQgUmVxdWVzdCcsICcnKTtcbkVycm9yUmVzcG9uc2UuTWV0aG9kTm90Rm91bmQgPSAoaWQpID0+IG5ldyBFcnJvclJlc3BvbnNlKGlkLCAtMzI2MDEsICdNZXRob2Qgbm90IGZvdW5kJywgJycpO1xuRXJyb3JSZXNwb25zZS5JbnZhbGlkUGFyYW1zID0gKGlkKSA9PiBuZXcgRXJyb3JSZXNwb25zZShpZCwgLTMyNjAyLCAnSW52YWxpZCBwYXJhbXMnLCAnJyk7XG5FcnJvclJlc3BvbnNlLkludGVybmFsRXJyb3IgPSAoaWQsIG1lc3NhZ2UgPSAnJykgPT4gbmV3IEVycm9yUmVzcG9uc2UoaWQsIC0zMjYwMywgJ0ludGVybmFsIGVycm9yJyArIG1lc3NhZ2UsICcnKTtcbmZ1bmN0aW9uIGlzSlNPTlJQQ09iamVjdChkYXRhKSB7XG4gICAgaWYgKCFpc09iamVjdChkYXRhKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghaGFzS2V5KGRhdGEsICdqc29ucnBjJykpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAoZGF0YS5qc29ucnBjICE9PSAnMi4wJylcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChoYXNLZXkoZGF0YSwgJ3BhcmFtcycpKSB7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IGRhdGEucGFyYW1zO1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocGFyYW1zKSAmJiAhaXNPYmplY3QocGFyYW1zKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBpc09iamVjdChwYXJhbXMpIHtcbiAgICByZXR1cm4gdHlwZW9mIHBhcmFtcyA9PT0gJ29iamVjdCcgJiYgcGFyYW1zICE9PSBudWxsO1xufVxuZnVuY3Rpb24gaGFzS2V5KG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGtleSBpbiBvYmo7XG59XG5jbGFzcyBDdXN0b21FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCBtZXNzYWdlLCBjb2RlLCBzdGFjaykge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICAgICAgdGhpcy5zdGFjayA9IHN0YWNrO1xuICAgIH1cbn1cbi8qKiBUaGVzZSBFcnJvciBpcyBkZWZpbmVkIGluIEVDTUFTY3JpcHQgc3BlYyAqL1xuY29uc3QgZXJyb3JzID0ge1xuICAgIEVycm9yLFxuICAgIEV2YWxFcnJvcixcbiAgICBSYW5nZUVycm9yLFxuICAgIFJlZmVyZW5jZUVycm9yLFxuICAgIFN5bnRheEVycm9yLFxuICAgIFR5cGVFcnJvcixcbiAgICBVUklFcnJvcixcbn07XG4vKipcbiAqIEFzeW5jQ2FsbCBzdXBwb3J0IHNvbWVob3cgdHJhbnNmZXIgRUNNQVNjcmlwdCBFcnJvclxuICovXG5mdW5jdGlvbiBSZWNvdmVyRXJyb3IodHlwZSwgbWVzc2FnZSwgY29kZSwgc3RhY2spIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZS5zdGFydHNXaXRoKCdET01FeGNlcHRpb246JykpIHtcbiAgICAgICAgICAgIGNvbnN0IFtfLCBuYW1lXSA9IHR5cGUuc3BsaXQoJ0RPTUV4Y2VwdGlvbjonKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRE9NRXhjZXB0aW9uKG1lc3NhZ2UsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGUgaW4gZXJyb3JzKSB7XG4gICAgICAgICAgICBjb25zdCBlID0gbmV3IGVycm9yc1t0eXBlXShtZXNzYWdlKTtcbiAgICAgICAgICAgIGUuc3RhY2sgPSBzdGFjaztcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZSwgeyBjb2RlIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEN1c3RvbUVycm9yKHR5cGUsIG1lc3NhZ2UsIGNvZGUsIHN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihgRSR7Y29kZX0gJHt0eXBlfTogJHttZXNzYWdlfVxcbiR7c3RhY2t9YCk7XG4gICAgfVxufVxuZnVuY3Rpb24gcmVtb3ZlU3RhY2tIZWFkZXIoc3RhY2sgPSAnJykge1xuICAgIHJldHVybiBzdGFjay5yZXBsYWNlKC9eLitcXG4uK1xcbi8sICcnKTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUFzeW5jQ2FsbC5qcy5tYXAiLCJpbXBvcnQgeyBUaGlzU2lkZUltcGxlbWVudGF0aW9uIH0gZnJvbSAnLi4vUlBDJ1xudHlwZSBXZWJFeHRlbnNpb25JRCA9IHN0cmluZ1xudHlwZSBNZXNzYWdlSUQgPSBzdHJpbmdcbnR5cGUgd2ViTmF2aWdhdGlvbk9uQ29tbWl0dGVkQXJncyA9IFBhcmFtZXRlcnM8VGhpc1NpZGVJbXBsZW1lbnRhdGlvblsnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJ10+XG50eXBlIG9uTWVzc2FnZUFyZ3MgPSBQYXJhbWV0ZXJzPFRoaXNTaWRlSW1wbGVtZW50YXRpb25bJ29uTWVzc2FnZSddPlxudHlwZSBQb29sS2V5cyA9ICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnIHwgJ2Jyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UnXG4vKipcbiAqIFVzZWQgZm9yIGtlZXAgcmVmZXJlbmNlIHRvIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2VcbiAqL1xuZXhwb3J0IGNvbnN0IFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIgPSBuZXcgTWFwPE1lc3NhZ2VJRCwgWyh2YWw6IGFueSkgPT4gYW55LCAodmFsOiBhbnkpID0+IGFueV0+KClcbi8qKlxuICogVG8gc3RvcmUgbGlzdGVuZXIgZm9yIEhvc3QgZGlzcGF0Y2hlZCBldmVudHMuXG4gKi9cbmV4cG9ydCBjb25zdCBFdmVudFBvb2xzOiBSZWNvcmQ8UG9vbEtleXMsIE1hcDxXZWJFeHRlbnNpb25JRCwgU2V0PCguLi5hcmdzOiBhbnlbXSkgPT4gYW55Pj4+ID0ge1xuICAgICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnOiBuZXcgTWFwKCksXG4gICAgJ2Jyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UnOiBuZXcgTWFwKCksXG59XG4vKipcbiAqIERpc3BhdGNoIGEgbm9ybWFsIGV2ZW50ICh0aGF0IG5vdCBoYXZlIGEgXCJyZXNwb25zZVwiKS5cbiAqIExpa2UgYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkaXNwYXRjaE5vcm1hbEV2ZW50KGV2ZW50OiBQb29sS2V5cywgdG9FeHRlbnNpb25JRDogc3RyaW5nIHwgc3RyaW5nW10gfCAnKicsIC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgaWYgKCFFdmVudFBvb2xzW2V2ZW50XSkgcmV0dXJuXG4gICAgZm9yIChjb25zdCBbZXh0ZW5zaW9uSUQsIGZuc10gb2YgRXZlbnRQb29sc1tldmVudF0uZW50cmllcygpKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRvRXh0ZW5zaW9uSUQpICYmIHRvRXh0ZW5zaW9uSUQuaW5kZXhPZihleHRlbnNpb25JRCkgPT09IC0xKSBjb250aW51ZVxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodG9FeHRlbnNpb25JRCkgJiYgdG9FeHRlbnNpb25JRCAhPT0gZXh0ZW5zaW9uSUQgJiYgdG9FeHRlbnNpb25JRCAhPT0gJyonKSBjb250aW51ZVxuICAgICAgICBmb3IgKGNvbnN0IGYgb2YgZm5zKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGYoLi4uYXJncylcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4vKipcbiAqIENyZWF0ZSBhIGBFdmVudE9iamVjdDxMaXN0ZW5lclR5cGU+YCBvYmplY3QuXG4gKlxuICogQ2FuIGJlIHNldCBvbiBicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQgZXRjLi4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFdmVudExpc3RlbmVyKGV4dGVuc2lvbklEOiBzdHJpbmcsIGV2ZW50OiBQb29sS2V5cykge1xuICAgIGlmICghRXZlbnRQb29sc1tldmVudF0uaGFzKGV4dGVuc2lvbklEKSkge1xuICAgICAgICBFdmVudFBvb2xzW2V2ZW50XS5zZXQoZXh0ZW5zaW9uSUQsIG5ldyBTZXQoKSlcbiAgICB9XG4gICAgY29uc3QgcG9vbCA9IEV2ZW50UG9vbHNbZXZlbnRdLmdldChleHRlbnNpb25JRCkhXG4gICAgY29uc3QgaGFuZGxlcjogRXZlbnRPYmplY3Q8KC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+ID0ge1xuICAgICAgICBhZGRMaXN0ZW5lcihjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykgdGhyb3cgbmV3IFR5cGVFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBmdW5jdGlvbicpXG4gICAgICAgICAgICBwb29sLmFkZChjYWxsYmFjaylcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHBvb2wuZGVsZXRlKGNhbGxiYWNrKVxuICAgICAgICB9LFxuICAgICAgICBoYXNMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgICAgICAgICAgcmV0dXJuIHBvb2wuaGFzKGxpc3RlbmVyKVxuICAgICAgICB9LFxuICAgIH1cbiAgICByZXR1cm4gaGFuZGxlclxufVxuXG5pbnRlcmZhY2UgRXZlbnRPYmplY3Q8VCBleHRlbmRzICguLi5hcmdzOiBhbnlbXSkgPT4gYW55PiB7XG4gICAgYWRkTGlzdGVuZXI6IChjYWxsYmFjazogVCkgPT4gdm9pZFxuICAgIHJlbW92ZUxpc3RlbmVyOiAobGlzdGVuZXI6IFQpID0+IHZvaWRcbiAgICBoYXNMaXN0ZW5lcjogKGxpc3RlbmVyOiBUKSA9PiBib29sZWFuXG59XG4iLCJleHBvcnQgZnVuY3Rpb24gZGVlcENsb25lPFQ+KG9iajogVCk6IFQge1xuICAgIC8vIHRvZG86IGNoYW5nZSBhbm90aGVyIGltcGwgcGx6LlxuICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpXG59XG4iLCJpbXBvcnQgeyBIb3N0IH0gZnJvbSAnLi4vUlBDJ1xuXG5pbXBvcnQgeyBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLCBFdmVudFBvb2xzIH0gZnJvbSAnLi4vdXRpbHMvTG9jYWxNZXNzYWdlcydcbmltcG9ydCB7IGRlZXBDbG9uZSB9IGZyb20gJy4uL3V0aWxzL2RlZXBDbG9uZSdcbi8qKlxuICogQ3JlYXRlIGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSgpIGZ1bmN0aW9uXG4gKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJ1bnRpbWVTZW5kTWVzc2FnZShleHRlbnNpb25JRDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgdG9FeHRlbnNpb25JRDogc3RyaW5nLCBtZXNzYWdlOiB1bmtub3duXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB0b0V4dGVuc2lvbklEID0gZXh0ZW5zaW9uSURcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBhcmd1bWVudHNbMF1cbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICB0b0V4dGVuc2lvbklEID0gYXJndW1lbnRzWzBdXG4gICAgICAgICAgICBtZXNzYWdlID0gYXJndW1lbnRzWzFdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b0V4dGVuc2lvbklEID0gJydcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VuZE1lc3NhZ2VXaXRoUmVzcG9uc2UoZXh0ZW5zaW9uSUQsIHRvRXh0ZW5zaW9uSUQsIG51bGwsIG1lc3NhZ2UpXG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIHNlbmRNZXNzYWdlV2l0aFJlc3BvbnNlPFU+KFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgdG9FeHRlbnNpb25JRDogc3RyaW5nLFxuICAgIHRhYklkOiBudW1iZXIgfCBudWxsLFxuICAgIG1lc3NhZ2U6IHVua25vd24sXG4pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8VT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBtZXNzYWdlSUQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKClcbiAgICAgICAgSG9zdC5zZW5kTWVzc2FnZShleHRlbnNpb25JRCwgdG9FeHRlbnNpb25JRCwgdGFiSWQsIG1lc3NhZ2VJRCwge1xuICAgICAgICAgICAgZGF0YTogbWVzc2FnZSxcbiAgICAgICAgICAgIHJlc3BvbnNlOiBmYWxzZSxcbiAgICAgICAgfSkuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICByZWplY3QoZSlcbiAgICAgICAgICAgIFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIuZGVsZXRlKG1lc3NhZ2VJRClcbiAgICAgICAgfSlcbiAgICAgICAgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5zZXQobWVzc2FnZUlELCBbcmVzb2x2ZSwgcmVqZWN0XSlcbiAgICB9KVxufVxuXG4vKipcbiAqIE1lc3NhZ2UgaGFuZGxlciBvZiBub3JtYWwgbWVzc2FnZVxuICovXG5leHBvcnQgZnVuY3Rpb24gb25Ob3JtYWxNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IGFueSxcbiAgICBzZW5kZXI6IGJyb3dzZXIucnVudGltZS5NZXNzYWdlU2VuZGVyLFxuICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgIG1lc3NhZ2VJRDogc3RyaW5nLFxuKSB7XG4gICAgY29uc3QgZm5zOiBTZXQ8YnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZUV2ZW50PiB8IHVuZGVmaW5lZCA9IEV2ZW50UG9vbHNbJ2Jyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UnXS5nZXQoXG4gICAgICAgIHRvRXh0ZW5zaW9uSUQsXG4gICAgKVxuICAgIGlmICghZm5zKSByZXR1cm5cbiAgICBsZXQgcmVzcG9uc2VTZW5kID0gZmFsc2VcbiAgICBmb3IgKGNvbnN0IGZuIG9mIGZucykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gPyBkaXNwYXRjaCBtZXNzYWdlXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBmbihkZWVwQ2xvbmUobWVzc2FnZSksIGRlZXBDbG9uZShzZW5kZXIpLCBzZW5kUmVzcG9uc2VEZXByZWNhdGVkKVxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgLy8gPyBkbyBub3RoaW5nXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgICAgIC8vICEgZGVwcmVjYXRlZCBwYXRoICFcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHJlc3VsdC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgLy8gPyByZXNwb25zZSB0aGUgYW5zd2VyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oKGRhdGE6IHVua25vd24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgPT09IHVuZGVmaW5lZCB8fCByZXNwb25zZVNlbmQpIHJldHVyblxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIEhvc3Quc2VuZE1lc3NhZ2UodG9FeHRlbnNpb25JRCwgZXh0ZW5zaW9uSUQsIHNlbmRlci50YWIhLmlkISwgbWVzc2FnZUlELCB7IGRhdGEsIHJlc3BvbnNlOiB0cnVlIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbE1lc3NhZ2Uge1xuICAgIGRhdGE6IGFueVxuICAgIGVycm9yPzogeyBtZXNzYWdlOiBzdHJpbmc7IHN0YWNrOiBzdHJpbmcgfVxuICAgIHJlc3BvbnNlOiBib29sZWFuXG59XG5cbmZ1bmN0aW9uIHNlbmRSZXNwb25zZURlcHJlY2F0ZWQoKTogYW55IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdSZXR1cm5pbmcgYSBQcm9taXNlIGlzIHRoZSBwcmVmZXJyZWQgd2F5JyArXG4gICAgICAgICAgICAnIHRvIHNlbmQgYSByZXBseSBmcm9tIGFuIG9uTWVzc2FnZS9vbk1lc3NhZ2VFeHRlcm5hbCBsaXN0ZW5lciwgJyArXG4gICAgICAgICAgICAnYXMgdGhlIHNlbmRSZXNwb25zZSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgc3BlY3MgJyArXG4gICAgICAgICAgICAnKFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL01vemlsbGEvQWRkLW9ucy9XZWJFeHRlbnNpb25zL0FQSS9ydW50aW1lL29uTWVzc2FnZSknLFxuICAgIClcbn1cbiIsImltcG9ydCB7IFN0cmluZ09yQmxvYiB9IGZyb20gJy4uL1JQQydcblxuZXhwb3J0IGZ1bmN0aW9uIGRlY29kZVN0cmluZ09yQmxvYih2YWw6IFN0cmluZ09yQmxvYik6IEJsb2IgfCBzdHJpbmcgfCBBcnJheUJ1ZmZlciB8IG51bGwge1xuICAgIGlmICh2YWwudHlwZSA9PT0gJ3RleHQnKSByZXR1cm4gdmFsLmNvbnRlbnRcbiAgICBpZiAodmFsLnR5cGUgPT09ICdibG9iJykgcmV0dXJuIG5ldyBCbG9iKFt2YWwuY29udGVudF0sIHsgdHlwZTogdmFsLm1pbWVUeXBlIH0pXG4gICAgaWYgKHZhbC50eXBlID09PSAnYXJyYXkgYnVmZmVyJykge1xuICAgICAgICByZXR1cm4gYmFzZTY0RGVjVG9BcnIodmFsLmNvbnRlbnQpLmJ1ZmZlclxuICAgIH1cbiAgICByZXR1cm4gbnVsbFxufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVuY29kZVN0cmluZ09yQmxvYih2YWw6IEJsb2IgfCBzdHJpbmcgfCBBcnJheUJ1ZmZlcik6IFByb21pc2U8U3RyaW5nT3JCbG9iPiB7XG4gICAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSByZXR1cm4geyB0eXBlOiAndGV4dCcsIGNvbnRlbnQ6IHZhbCB9XG4gICAgaWYgKHZhbCBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgY29uc3QgYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgbmV3IFJlc3BvbnNlKHZhbCkuYXJyYXlCdWZmZXIoKSlcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ2Jsb2InLCBtaW1lVHlwZTogdmFsLnR5cGUsIGNvbnRlbnQ6IGJhc2U2NEVuY0FycihidWZmZXIpIH1cbiAgICB9XG4gICAgaWYgKHZhbCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgIHJldHVybiB7IHR5cGU6ICdhcnJheSBidWZmZXInLCBjb250ZW50OiBiYXNlNjRFbmNBcnIobmV3IFVpbnQ4QXJyYXkodmFsKSkgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGRhdGEnKVxufVxuXG4vLyNyZWdpb24gLy8gPyBDb2RlIGZyb20gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dpbmRvd0Jhc2U2NC9CYXNlNjRfZW5jb2RpbmdfYW5kX2RlY29kaW5nI0FwcGVuZGl4LjNBX0RlY29kZV9hX0Jhc2U2NF9zdHJpbmdfdG9fVWludDhBcnJheV9vcl9BcnJheUJ1ZmZlclxuZnVuY3Rpb24gYjY0VG9VaW50NihuQ2hyOiBudW1iZXIpIHtcbiAgICByZXR1cm4gbkNociA+IDY0ICYmIG5DaHIgPCA5MVxuICAgICAgICA/IG5DaHIgLSA2NVxuICAgICAgICA6IG5DaHIgPiA5NiAmJiBuQ2hyIDwgMTIzXG4gICAgICAgID8gbkNociAtIDcxXG4gICAgICAgIDogbkNociA+IDQ3ICYmIG5DaHIgPCA1OFxuICAgICAgICA/IG5DaHIgKyA0XG4gICAgICAgIDogbkNociA9PT0gNDNcbiAgICAgICAgPyA2MlxuICAgICAgICA6IG5DaHIgPT09IDQ3XG4gICAgICAgID8gNjNcbiAgICAgICAgOiAwXG59XG5cbmZ1bmN0aW9uIGJhc2U2NERlY1RvQXJyKHNCYXNlNjQ6IHN0cmluZywgbkJsb2NrU2l6ZT86IG51bWJlcikge1xuICAgIHZhciBzQjY0RW5jID0gc0Jhc2U2NC5yZXBsYWNlKC9bXkEtWmEtejAtOVxcK1xcL10vZywgJycpLFxuICAgICAgICBuSW5MZW4gPSBzQjY0RW5jLmxlbmd0aCxcbiAgICAgICAgbk91dExlbiA9IG5CbG9ja1NpemUgPyBNYXRoLmNlaWwoKChuSW5MZW4gKiAzICsgMSkgPj4+IDIpIC8gbkJsb2NrU2l6ZSkgKiBuQmxvY2tTaXplIDogKG5JbkxlbiAqIDMgKyAxKSA+Pj4gMixcbiAgICAgICAgYUJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkobk91dExlbilcblxuICAgIGZvciAodmFyIG5Nb2QzLCBuTW9kNCwgblVpbnQyNCA9IDAsIG5PdXRJZHggPSAwLCBuSW5JZHggPSAwOyBuSW5JZHggPCBuSW5MZW47IG5JbklkeCsrKSB7XG4gICAgICAgIG5Nb2Q0ID0gbkluSWR4ICYgM1xuICAgICAgICBuVWludDI0IHw9IGI2NFRvVWludDYoc0I2NEVuYy5jaGFyQ29kZUF0KG5JbklkeCkpIDw8ICgxOCAtIDYgKiBuTW9kNClcbiAgICAgICAgaWYgKG5Nb2Q0ID09PSAzIHx8IG5JbkxlbiAtIG5JbklkeCA9PT0gMSkge1xuICAgICAgICAgICAgZm9yIChuTW9kMyA9IDA7IG5Nb2QzIDwgMyAmJiBuT3V0SWR4IDwgbk91dExlbjsgbk1vZDMrKywgbk91dElkeCsrKSB7XG4gICAgICAgICAgICAgICAgYUJ5dGVzW25PdXRJZHhdID0gKG5VaW50MjQgPj4+ICgoMTYgPj4+IG5Nb2QzKSAmIDI0KSkgJiAyNTVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5VaW50MjQgPSAwXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYUJ5dGVzXG59XG5mdW5jdGlvbiB1aW50NlRvQjY0KG5VaW50NjogbnVtYmVyKSB7XG4gICAgcmV0dXJuIG5VaW50NiA8IDI2XG4gICAgICAgID8gblVpbnQ2ICsgNjVcbiAgICAgICAgOiBuVWludDYgPCA1MlxuICAgICAgICA/IG5VaW50NiArIDcxXG4gICAgICAgIDogblVpbnQ2IDwgNjJcbiAgICAgICAgPyBuVWludDYgLSA0XG4gICAgICAgIDogblVpbnQ2ID09PSA2MlxuICAgICAgICA/IDQzXG4gICAgICAgIDogblVpbnQ2ID09PSA2M1xuICAgICAgICA/IDQ3XG4gICAgICAgIDogNjVcbn1cblxuZnVuY3Rpb24gYmFzZTY0RW5jQXJyKGFCeXRlczogVWludDhBcnJheSkge1xuICAgIHZhciBlcUxlbiA9ICgzIC0gKGFCeXRlcy5sZW5ndGggJSAzKSkgJSAzLFxuICAgICAgICBzQjY0RW5jID0gJydcblxuICAgIGZvciAodmFyIG5Nb2QzLCBuTGVuID0gYUJ5dGVzLmxlbmd0aCwgblVpbnQyNCA9IDAsIG5JZHggPSAwOyBuSWR4IDwgbkxlbjsgbklkeCsrKSB7XG4gICAgICAgIG5Nb2QzID0gbklkeCAlIDNcbiAgICAgICAgLyogVW5jb21tZW50IHRoZSBmb2xsb3dpbmcgbGluZSBpbiBvcmRlciB0byBzcGxpdCB0aGUgb3V0cHV0IGluIGxpbmVzIDc2LWNoYXJhY3RlciBsb25nOiAqL1xuICAgICAgICAvKlxuICAgICAgaWYgKG5JZHggPiAwICYmIChuSWR4ICogNCAvIDMpICUgNzYgPT09IDApIHsgc0I2NEVuYyArPSBcIlxcclxcblwiOyB9XG4gICAgICAqL1xuICAgICAgICBuVWludDI0IHw9IGFCeXRlc1tuSWR4XSA8PCAoKDE2ID4+PiBuTW9kMykgJiAyNClcbiAgICAgICAgaWYgKG5Nb2QzID09PSAyIHx8IGFCeXRlcy5sZW5ndGggLSBuSWR4ID09PSAxKSB7XG4gICAgICAgICAgICBzQjY0RW5jICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoXG4gICAgICAgICAgICAgICAgdWludDZUb0I2NCgoblVpbnQyNCA+Pj4gMTgpICYgNjMpLFxuICAgICAgICAgICAgICAgIHVpbnQ2VG9CNjQoKG5VaW50MjQgPj4+IDEyKSAmIDYzKSxcbiAgICAgICAgICAgICAgICB1aW50NlRvQjY0KChuVWludDI0ID4+PiA2KSAmIDYzKSxcbiAgICAgICAgICAgICAgICB1aW50NlRvQjY0KG5VaW50MjQgJiA2MyksXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBuVWludDI0ID0gMFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGVxTGVuID09PSAwID8gc0I2NEVuYyA6IHNCNjRFbmMuc3Vic3RyaW5nKDAsIHNCNjRFbmMubGVuZ3RoIC0gZXFMZW4pICsgKGVxTGVuID09PSAxID8gJz0nIDogJz09Jylcbn1cbiIsImltcG9ydCB7IEhvc3QsIFN0cmluZ09yQmxvYiB9IGZyb20gJy4uL1JQQydcbmltcG9ydCB7IGVuY29kZVN0cmluZ09yQmxvYiwgZGVjb2RlU3RyaW5nT3JCbG9iIH0gZnJvbSAnLi4vdXRpbHMvU3RyaW5nT3JCbG9iJ1xuXG5jb25zdCB7IENMT1NFRCwgQ0xPU0lORywgQ09OTkVDVElORywgT1BFTiB9ID0gV2ViU29ja2V0XG5jb25zdCBXZWJTb2NrZXRJRDogTWFwPFdlYlNvY2tldCwgbnVtYmVyPiA9IG5ldyBNYXAoKVxuZnVuY3Rpb24gZ2V0SUQoaW5zdGFuY2U6IFdlYlNvY2tldCkge1xuICAgIHJldHVybiBXZWJTb2NrZXRJRC5nZXQoaW5zdGFuY2UpIVxufVxuZnVuY3Rpb24gZ2V0SW5zdGFuY2UoaWQ6IG51bWJlcikge1xuICAgIHJldHVybiBBcnJheS5mcm9tKFdlYlNvY2tldElEKS5maW5kKChbeCwgeV0pID0+IHkgPT09IGlkKSFbMF1cbn1cbmNvbnN0IFdlYlNvY2tldFJlYWR5U3RhdGU6IE1hcDxXZWJTb2NrZXQsIG51bWJlcj4gPSBuZXcgTWFwKClcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVXZWJTb2NrZXQoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6IHR5cGVvZiBXZWJTb2NrZXQge1xuICAgIC8qKlxuICAgICAqIFNlZTogaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvd2ViLXNvY2tldHMuaHRtbFxuICAgICAqL1xuICAgIGNsYXNzIFdTIGV4dGVuZHMgRXZlbnRUYXJnZXQgaW1wbGVtZW50cyBXZWJTb2NrZXQge1xuICAgICAgICAvLyNyZWdpb24gQ29uc3RhbnRzXG4gICAgICAgIHN0YXRpYyByZWFkb25seSBDTE9TRUQgPSBDTE9TRURcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IENPTk5FQ1RJTkcgPSBDT05ORUNUSU5HXG4gICAgICAgIHN0YXRpYyByZWFkb25seSBPUEVOID0gT1BFTlxuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgQ0xPU0lORyA9IENMT1NJTkdcbiAgICAgICAgQ0xPU0VEID0gQ0xPU0VEXG4gICAgICAgIENPTk5FQ1RJTkcgPSBDT05ORUNUSU5HXG4gICAgICAgIE9QRU4gPSBPUEVOXG4gICAgICAgIENMT1NJTkcgPSBDTE9TSU5HXG4gICAgICAgIC8vI2VuZHJlZ2lvblxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgdXJsOiBzdHJpbmcsIHByb3RvY29sczogc3RyaW5nIHwgc3RyaW5nW10gPSBbXSkge1xuICAgICAgICAgICAgc3VwZXIoKVxuICAgICAgICAgICAgSG9zdFsnd2Vic29ja2V0LmNyZWF0ZSddKGV4dGVuc2lvbklELCB1cmwpLnRoZW4ob25PcGVuLmJpbmQodGhpcyksIG9uV2ViU29ja2V0RXJyb3IuYmluZChudWxsLCAwLCAnJykpXG4gICAgICAgIH1cbiAgICAgICAgZ2V0IGJpbmFyeVR5cGUoKTogQmluYXJ5VHlwZSB7XG4gICAgICAgICAgICByZXR1cm4gJ2Jsb2InXG4gICAgICAgIH1cbiAgICAgICAgc2V0IGJpbmFyeVR5cGUodmFsKSB7XG4gICAgICAgICAgICAvLyBUb2RvXG4gICAgICAgIH1cbiAgICAgICAgcmVhZG9ubHkgYnVmZmVyZWRBbW91bnQgPSAwXG4gICAgICAgIGV4dGVuc2lvbnMgPSAnJ1xuICAgICAgICBvbmNsb3NlOiBhbnlcbiAgICAgICAgb25lcnJvcjogYW55XG4gICAgICAgIG9ub3BlbjogYW55XG4gICAgICAgIG9ubWVzc2FnZTogYW55XG4gICAgICAgIGdldCByZWFkeVN0YXRlKCk6IG51bWJlciB7XG4gICAgICAgICAgICByZXR1cm4gV2ViU29ja2V0UmVhZHlTdGF0ZS5nZXQodGhpcykhXG4gICAgICAgIH1cbiAgICAgICAgcHJvdG9jb2w6IGFueVxuICAgICAgICBjbG9zZShjb2RlID0gMTAwNSwgcmVhc29uID0gJycpIHtcbiAgICAgICAgICAgIEhvc3RbJ3dlYnNvY2tldC5jbG9zZSddKGV4dGVuc2lvbklELCBXZWJTb2NrZXRJRC5nZXQodGhpcykhLCBjb2RlLCByZWFzb24pLnRoZW4oXG4gICAgICAgICAgICAgICAgb25XZWJTb2NrZXRDbG9zZS5iaW5kKHRoaXMsIGdldElEKHRoaXMpLCBjb2RlLCByZWFzb24sIHRydWUpLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgV2ViU29ja2V0UmVhZHlTdGF0ZS5zZXQodGhpcywgQ0xPU0lORylcbiAgICAgICAgfVxuICAgICAgICBzZW5kKG1lc3NhZ2U6IHN0cmluZyB8IEJsb2IgfCBBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgZW5jb2RlU3RyaW5nT3JCbG9iKG1lc3NhZ2UpLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgSG9zdFsnd2Vic29ja2V0LnNlbmQnXShleHRlbnNpb25JRCwgV2ViU29ja2V0SUQuZ2V0KHRoaXMpISwgZGF0YSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgY29uc3RhbnRzOiBQcm9wZXJ0eURlc2NyaXB0b3JNYXAgPSB7XG4gICAgICAgIENMT1NFRDogeyBjb25maWd1cmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UsIGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiBDTE9TRUQgfSxcbiAgICAgICAgQ0xPU0lORzogeyBjb25maWd1cmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UsIGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiBDTE9TSU5HIH0sXG4gICAgICAgIENPTk5FQ1RJTkc6IHsgY29uZmlndXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IGZhbHNlLCBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogQ09OTkVDVElORyB9LFxuICAgICAgICBPUEVOOiB7IGNvbmZpZ3VyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZSwgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IE9QRU4gfSxcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoV1MsIGNvbnN0YW50cylcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhXUy5wcm90b3R5cGUsIGNvbnN0YW50cylcbiAgICByZXR1cm4gV1Ncbn1cbmV4cG9ydCBmdW5jdGlvbiBvbldlYlNvY2tldENsb3NlKHdlYnNvY2tldElEOiBudW1iZXIsIGNvZGU6IG51bWJlciwgcmVhc29uOiBzdHJpbmcsIHdhc0NsZWFuOiBib29sZWFuKTogdm9pZCB7XG4gICAgY29uc3Qgd3MgPSBnZXRJbnN0YW5jZSh3ZWJzb2NrZXRJRClcbiAgICBjb25zdCBlID0gbmV3IENsb3NlRXZlbnQoJ2Nsb3NlJywgeyByZWFzb24sIHdhc0NsZWFuLCBjb2RlIH0pXG4gICAgV2ViU29ja2V0UmVhZHlTdGF0ZS5zZXQod3MsIENMT1NFRClcbiAgICBXZWJTb2NrZXRJRC5kZWxldGUod3MpXG4gICAgaWYgKHR5cGVvZiB3cy5vbmNsb3NlID09PSAnZnVuY3Rpb24nKSB3cy5vbmNsb3NlKGUpXG4gICAgd3MuZGlzcGF0Y2hFdmVudChlKVxufVxuZnVuY3Rpb24gb25PcGVuKHRoaXM6IFdlYlNvY2tldCwgd2Vic29ja2V0SUQ6IG51bWJlcikge1xuICAgIGNvbnN0IGUgPSBuZXcgRXZlbnQoJ29wZW4nKVxuICAgIFdlYlNvY2tldFJlYWR5U3RhdGUuc2V0KHRoaXMsIE9QRU4pXG4gICAgV2ViU29ja2V0SUQuc2V0KHRoaXMsIHdlYnNvY2tldElEKVxuICAgIGlmICh0eXBlb2YgdGhpcy5vbm9wZW4gPT09ICdmdW5jdGlvbicpIHRoaXMub25vcGVuKGUpXG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KGUpXG59XG5leHBvcnQgZnVuY3Rpb24gb25XZWJTb2NrZXRFcnJvcih3ZWJzb2NrZXRJRDogbnVtYmVyLCByZWFzb246IHN0cmluZykge1xuICAgIGNvbnN0IHdzID0gZ2V0SW5zdGFuY2Uod2Vic29ja2V0SUQpXG4gICAgY29uc3QgZSA9IG5ldyBFdmVudCgnZXJyb3InKVxuICAgIFdlYlNvY2tldFJlYWR5U3RhdGUuc2V0KHdzLCBDTE9TRUQpXG4gICAgaWYgKHR5cGVvZiB3cy5vbmVycm9yID09PSAnZnVuY3Rpb24nKSB3cy5vbmVycm9yKGUpXG4gICAgd3MuZGlzcGF0Y2hFdmVudChlKVxufVxuZXhwb3J0IGZ1bmN0aW9uIG9uV2ViU29ja2V0TWVzc2FnZSh3ZWJTb2NrZXRJRDogbnVtYmVyLCBtZXNzYWdlOiBTdHJpbmdPckJsb2IpIHtcbiAgICBjb25zdCB3cyA9IGdldEluc3RhbmNlKHdlYlNvY2tldElEKVxuICAgIGNvbnN0IGUgPSBuZXcgTWVzc2FnZUV2ZW50KCdtZXNzYWdlJywgeyBkYXRhOiBkZWNvZGVTdHJpbmdPckJsb2IobWVzc2FnZSkgfSlcbiAgICBpZiAodHlwZW9mIHdzLm9ubWVzc2FnZSA9PT0gJ2Z1bmN0aW9uJykgd3Mub25tZXNzYWdlKGUpXG4gICAgd3MuZGlzcGF0Y2hFdmVudChlKVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL25vZGVfbW9kdWxlcy93ZWItZXh0LXR5cGVzL2dsb2JhbC9pbmRleC5kLnRzXCIgLz5cbmltcG9ydCB7IEFzeW5jQ2FsbCB9IGZyb20gJ0Bob2xvZmxvd3Mva2l0L2VzJ1xuaW1wb3J0IHsgZGlzcGF0Y2hOb3JtYWxFdmVudCwgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlciB9IGZyb20gJy4vdXRpbHMvTG9jYWxNZXNzYWdlcydcbmltcG9ydCB7IEludGVybmFsTWVzc2FnZSwgb25Ob3JtYWxNZXNzYWdlIH0gZnJvbSAnLi9zaGltcy9icm93c2VyLm1lc3NhZ2UnXG5pbXBvcnQgeyBvbldlYlNvY2tldENsb3NlLCBvbldlYlNvY2tldEVycm9yLCBvbldlYlNvY2tldE1lc3NhZ2UgfSBmcm9tICcuL3NoaW1zL1dlYlNvY2tldCdcblxuLyoqIERlZmluZSBCbG9iIHR5cGUgaW4gY29tbXVuaWNhdGUgd2l0aCByZW1vdGUgKi9cbmV4cG9ydCB0eXBlIFN0cmluZ09yQmxvYiA9XG4gICAgfCB7XG4gICAgICAgICAgdHlwZTogJ3RleHQnXG4gICAgICAgICAgY29udGVudDogc3RyaW5nXG4gICAgICB9XG4gICAgfCB7XG4gICAgICAgICAgdHlwZTogJ2FycmF5IGJ1ZmZlcidcbiAgICAgICAgICBjb250ZW50OiBzdHJpbmdcbiAgICAgIH1cbiAgICB8IHtcbiAgICAgICAgICB0eXBlOiAnYmxvYidcbiAgICAgICAgICBjb250ZW50OiBzdHJpbmdcbiAgICAgICAgICBtaW1lVHlwZTogc3RyaW5nXG4gICAgICB9XG4vKipcbiAqIFRoaXMgZGVzY3JpYmVzIHdoYXQgSlNPTlJQQyBjYWxscyB0aGF0IE5hdGl2ZSBzaWRlIHNob3VsZCBpbXBsZW1lbnRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBIb3N0IHtcbiAgICAvLyNyZWdpb24gLy8gPyBVUkwuKlxuICAgIC8qKlxuICAgICAqIEhvc3Qgc2hvdWxkIHNhdmUgdGhlIGJpbmRpbmcgd2l0aCBgdXVpZGAgYW5kIHRoZSBgZGF0YWBcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gVVVJRCAtIFVVSUQgZ2VuZXJhdGVkIGJ5IEpTIHNpZGUuXG4gICAgICogQHBhcmFtIGRhdGEgLSBkYXRhIG9mIHRoaXMgb2JqZWN0LiBNdXN0IGJlIHR5cGUgYGJsb2JgXG4gICAgICovXG4gICAgJ1VSTC5jcmVhdGVPYmplY3RVUkwnKGV4dGVuc2lvbklEOiBzdHJpbmcsIFVVSUQ6IHN0cmluZywgZGF0YTogU3RyaW5nT3JCbG9iKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIEhvc3Qgc2hvdWxkIHJlbGVhc2UgdGhlIGJpbmRpbmcgd2l0aCBgdXVpZGAgYW5kIHRoZSBgZGF0YWBcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gVVVJRCAtIFVVSUQgZ2VuZXJhdGVkIGJ5IEpTIHNpZGUuXG4gICAgICovXG4gICAgJ1VSTC5yZXZva2VPYmplY3RVUkwnKGV4dGVuc2lvbklEOiBzdHJpbmcsIFVVSUQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBicm93c2VyLmRvd25sb2Fkc1xuICAgIC8qKlxuICAgICAqIE9wZW4gYSBkaWFsb2csIHNoYXJlIHRoZSBmaWxlIHRvIHNvbWV3aGVyZSBlbHNlLlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gU2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkXG4gICAgICovXG4gICAgJ2Jyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkJyhcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgZmlsZW5hbWU6IHN0cmluZ1xuICAgICAgICAgICAgLyoqIENvdWxkIGJlIGEgc3RyaW5nIHJldHVybiBieSBVUkwuY3JlYXRlT2JqZWN0VVJMKCkgKi9cbiAgICAgICAgICAgIHVybDogc3RyaW5nXG4gICAgICAgIH0sXG4gICAgKTogUHJvbWlzZTx2b2lkPlxuICAgIC8vI2VuZHJlZ2lvblxuICAgIC8vI3JlZ2lvbiAvLyA/IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXRcbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGludGVybmFsIHN0b3JhZ2UgZm9yIGBleHRlbnNpb25JRGBcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqID4gU3RvcmFnZTogYHsgYTogeyB2YWx1ZTogMiB9LCBiOiB7IG5hbWU6IFwieFwiIH0sIGM6IDEgfWBcbiAgICAgKlxuICAgICAqIGdldChpZCwgJ2InKVxuICAgICAqID4gUmV0dXJuIGB7bmFtZTogXCJ4XCJ9YFxuICAgICAqXG4gICAgICogZ2V0KGlkLCBudWxsKVxuICAgICAqID4gUmV0dXJuOiBgeyBhOiB7IHZhbHVlOiAyIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSwgYzogMSB9YFxuICAgICAqXG4gICAgICogZ2V0KGlkLCBbXCJhXCIsIFwiYlwiXSlcbiAgICAgKiA+IFJldHVybjogYHsgYTogeyB2YWx1ZTogMiB9LCBiOiB7IG5hbWU6IFwieFwiIH0gfWBcbiAgICAgKi9cbiAgICAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldCcoZXh0ZW5zaW9uSUQ6IHN0cmluZywga2V5OiBzdHJpbmcgfCBzdHJpbmdbXSB8IG51bGwpOiBQcm9taXNlPG9iamVjdD5cbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCBzZXQgdGhlIG9iamVjdCB3aXRoIDEgbGF5ZXIgbWVyZ2luZy5cbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gb2JqZWN0XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqID4gU3RvcmFnZTogYHt9YFxuICAgICAqIHNldChpZCwgeyBhOiB7IHZhbHVlOiAxIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSB9KVxuICAgICAqID4gU3RvcmFnZTogYHsgYTogeyB2YWx1ZTogMSB9LCBiOiB7IG5hbWU6IFwieFwiIH0gfWBcbiAgICAgKiBzZXQoaWQsIHsgYTogeyB2YWx1ZTogMiB9IH0pXG4gICAgICogPiBTdG9yYWdlOiBgeyBhOiB7IHZhbHVlOiAyIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSB9YFxuICAgICAqL1xuICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0JyhleHRlbnNpb25JRDogc3RyaW5nLCBvYmplY3Q6IG9iamVjdCk6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUga2V5cyBpbiB0aGUgb2JqZWN0XG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIGtleVxuICAgICAqL1xuICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwucmVtb3ZlJyhleHRlbnNpb25JRDogc3RyaW5nLCBrZXk6IHN0cmluZyB8IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIERlbGV0ZSB0aGUgaW50ZXJuYWwgc3RvcmFnZVxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqL1xuICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwuY2xlYXInKGV4dGVuc2lvbklEOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+XG4gICAgLy8jZW5kcmVnaW9uXG4gICAgLy8jcmVnaW9uIC8vID8gYnJvd3Nlci50YWJzXG4gICAgLyoqXG4gICAgICogSG9zdCBzaG91bGQgaW5qZWN0IHRoZSBnaXZlbiBzY3JpcHQgaW50byB0aGUgZ2l2ZW4gdGFiSURcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gdGFiSUQgLSBUYWIgaWQgdGhhdCBuZWVkIGluamVjdCBzY3JpcHQgdG9cbiAgICAgKiBAcGFyYW0gZGV0YWlscyAtIFNlZSBodHRwczovL21kbi5pby9icm93c2VyLnRhYnMuZXhlY3V0ZVNjcmlwdFxuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMuZXhlY3V0ZVNjcmlwdCcoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRhYklEOiBudW1iZXIsXG4gICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgIGNvZGU/OiBzdHJpbmdcbiAgICAgICAgICAgIGZpbGU/OiBzdHJpbmdcbiAgICAgICAgICAgIHJ1bkF0PzogJ2RvY3VtZW50X3N0YXJ0JyB8ICdkb2N1bWVudF9lbmQnIHwgJ2RvY3VtZW50X2lkbGUnXG4gICAgICAgIH0sXG4gICAgKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIEhvc3Qgc2hvdWxkIGNyZWF0ZSBhIG5ldyB0YWJcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFNlZSBodHRwczovL21kbi5pby9icm93c2VyLnRhYnMuY3JlYXRlXG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy5jcmVhdGUnKGV4dGVuc2lvbklEOiBzdHJpbmcsIG9wdGlvbnM6IHsgYWN0aXZlPzogYm9vbGVhbjsgdXJsPzogc3RyaW5nIH0pOiBQcm9taXNlPGJyb3dzZXIudGFicy5UYWI+XG4gICAgLyoqXG4gICAgICogSG9zdCBzaG91bGQgcmVtb3ZlIHRoZSB0YWJcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gdGFiSWQgLSBTZWUgaHR0cHM6Ly9tZG4uaW8vYnJvd3Nlci50YWJzLnJlbW92ZVxuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMucmVtb3ZlJyhleHRlbnNpb25JRDogc3RyaW5nLCB0YWJJZDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IG9wZW5lZCB0YWJzXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBTZWUgaHR0cHM6Ly9tZG4uaW8vYnJvd3Nlci50YWJzLnF1ZXJ5XG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy5xdWVyeScoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHF1ZXJ5SW5mbzogUGFyYW1ldGVyczx0eXBlb2YgYnJvd3Nlci50YWJzLnF1ZXJ5PlswXSxcbiAgICApOiBQcm9taXNlPGJyb3dzZXIudGFicy5UYWJbXT5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgYSB0YWIncyBwcm9wZXJ0eVxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSB0YWJJZCBJZiBpdCBpcyB1bmRlZmluZWQsIGlnbm9yZSB0aGlzIHJlcXVlc3RcbiAgICAgKiBAcGFyYW0gdXBkYXRlUHJvcGVydGllc1xuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMudXBkYXRlJyhcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdGFiSWQ/OiBudW1iZXIsXG4gICAgICAgIHVwZGF0ZVByb3BlcnRpZXM/OiB7XG4gICAgICAgICAgICB1cmw/OiBzdHJpbmdcbiAgICAgICAgfSxcbiAgICApOiBQcm9taXNlPGJyb3dzZXIudGFicy5UYWI+XG4gICAgLy8jZW5kcmVnaW9uXG4gICAgLy8jcmVnaW9uIC8vID8gTWVzc2FnZVxuICAgIC8qKlxuICAgICAqIFVzZWQgdG8gaW1wbGVtZW50IGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UgYW5kIGJyb3dzZXIudGFicy5vbk1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSUQgLSBXaG8gc2VuZCB0aGlzIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gdG9FeHRlbnNpb25JRCAtIFdobyB3aWxsIHJlY2VpdmUgdGhpcyBtZXNzYWdlXG4gICAgICogQHBhcmFtIHRhYklkIC0gU2VuZCB0aGlzIG1lc3NhZ2UgdG8gdGFiIGlkXG4gICAgICogQHBhcmFtIG1lc3NhZ2VJRCAtIEEgcmFuZG9tIGlkIGdlbmVyYXRlZCBieSBjbGllbnRcbiAgICAgKiBAcGFyYW0gbWVzc2FnZSAtIG1lc3NhZ2Ugb2JqZWN0XG4gICAgICovXG4gICAgc2VuZE1lc3NhZ2UoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdGFiSWQ6IG51bWJlciB8IG51bGwsXG4gICAgICAgIG1lc3NhZ2VJRDogc3RyaW5nLFxuICAgICAgICBtZXNzYWdlOiBJbnRlcm5hbE1lc3NhZ2UsXG4gICAgKTogUHJvbWlzZTx2b2lkPlxuICAgIC8vI2VuZHJlZ2lvblxuICAgIC8vI3JlZ2lvbiAvLyA/IGZldGNoIC8vID8gKHRvIGJ5cGFzcyBjcm9zcyBvcmlnaW4gcmVzdHJpY3Rpb24pXG4gICAgLyoqXG4gICAgICogU2VlOiBodHRwczovL21kbi5pby9mZXRjaFxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSByZXF1ZXN0IC0gVGhlIHJlcXVlc3Qgb2JqZWN0XG4gICAgICovXG4gICAgZmV0Y2goXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICAgIC8qKiBHRVQsIFBPU1QsIC4uLi4gKi9cbiAgICAgICAgICAgIG1ldGhvZDogc3RyaW5nXG4gICAgICAgICAgICB1cmw6IHN0cmluZ1xuICAgICAgICB9LFxuICAgICk6IFByb21pc2U8e1xuICAgICAgICAvKiogcmVzcG9uc2UgY29kZSAqL1xuICAgICAgICBzdGF0dXM6IG51bWJlclxuICAgICAgICAvKiogcmVzcG9uc2UgdGV4dCAqL1xuICAgICAgICBzdGF0dXNUZXh0OiBzdHJpbmdcbiAgICAgICAgZGF0YTogU3RyaW5nT3JCbG9iXG4gICAgfT5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBXZWJTb2NrZXRcbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgV2ViU29ja2V0IGJ5IEhvc3RcbiAgICAgKiBAcmV0dXJucyBBIHVuaXF1ZSBJRCB0aGF0IHJlcHJlc2VudCB0aGlzIFdlYlNvY2tldCBjb25uZWN0aW9uLlxuICAgICAqL1xuICAgICd3ZWJzb2NrZXQuY3JlYXRlJyhleHRlbnNpb25JRDogc3RyaW5nLCB1cmw6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPlxuICAgIC8qKlxuICAgICAqIENsb3NlIHRoZSBXZWJTb2NrZXRcbiAgICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RvY3MvV2ViL0FQSS9XZWJTb2NrZXQvY2xvc2VcbiAgICAgKi9cbiAgICAnd2Vic29ja2V0LmNsb3NlJyhleHRlbnNpb25JRDogc3RyaW5nLCB3ZWJzb2NrZXRJRDogbnVtYmVyLCBjb2RlOiBudW1iZXIsIHJlYXNvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFNlbmQgYSBtZXNzYWdlIHRvIFdlYlNvY2tldFxuICAgICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZG9jcy9XZWIvQVBJL1dlYlNvY2tldC9zZW5kXG4gICAgICovXG4gICAgJ3dlYnNvY2tldC5zZW5kJyhleHRlbnNpb25JRDogc3RyaW5nLCB3ZWJzb2NrZXRJRDogbnVtYmVyLCBkYXRhOiBTdHJpbmdPckJsb2IpOiBQcm9taXNlPHZvaWQ+XG4gICAgLy8jZW5kcmVnaW9uXG59XG4vKipcbiAqIFRoaXMgZGVzY3JpYmVzIHdoYXQgSlNPTlJQQyBjYWxscyB0aGF0IEpTIHNpZGUgc2hvdWxkIGltcGxlbWVudFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRoaXNTaWRlSW1wbGVtZW50YXRpb24ge1xuICAgIC8qKlxuICAgICAqIEhvc3QgY2FsbCB0aGlzIHRvIG5vdGlmeSBgYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkYCBoYXBwZW5lZC5cbiAgICAgKlxuICAgICAqIEBzZWUgaHR0cHM6Ly9tZG4uaW8vYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkXG4gICAgICogQHBhcmFtIHRhYiAtIFRoZSBjb21taXR0ZWQgdGFiIGluZm9cbiAgICAgKi9cbiAgICAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJyh0YWI6IHsgdGFiSWQ6IG51bWJlcjsgdXJsOiBzdHJpbmcgfSk6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBVc2VkIHRvIGltcGxlbWVudCBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlIGFuZCBicm93c2VyLnRhYnMub25NZXNzYWdlXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEIC0gV2hvIHNlbmQgdGhpcyBtZXNzYWdlXG4gICAgICogQHBhcmFtIHRvRXh0ZW5zaW9uSUQgLSBXaG8gd2lsbCByZWNlaXZlIHRoaXMgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBtZXNzYWdlSUQgLSBBIHJhbmRvbSBpZCBjcmVhdGVkIGJ5IHRoZSBzZW5kZXIuIFVzZWQgdG8gaWRlbnRpZnkgaWYgdGhlIG1lc3NhZ2UgaXMgYSByZXNwb25zZS5cbiAgICAgKiBAcGFyYW0gbWVzc2FnZSAtIFNlbmQgYnkgYW5vdGhlciBjbGllbnRcbiAgICAgKiBAcGFyYW0gc2VuZGVyIC0gSW5mbyBvZiB0aGUgc2VuZGVyXG4gICAgICovXG4gICAgb25NZXNzYWdlKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICB0b0V4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VJRDogc3RyaW5nLFxuICAgICAgICBtZXNzYWdlOiBhbnksXG4gICAgICAgIHNlbmRlcjogYnJvd3Nlci5ydW50aW1lLk1lc3NhZ2VTZW5kZXIsXG4gICAgKTogUHJvbWlzZTx2b2lkPlxuXG4gICAgLyoqXG4gICAgICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL1dlYi9BUEkvQ2xvc2VFdmVudFxuICAgICAqL1xuICAgICd3ZWJzb2NrZXQub25DbG9zZScod2Vic29ja2V0SUQ6IG51bWJlciwgY29kZTogbnVtYmVyLCByZWFzb246IHN0cmluZywgd2FzQ2xlYW46IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL1dlYi9BUEkvV2ViU29ja2V0L29uZXJyb3JcbiAgICAgKi9cbiAgICAnd2Vic29ja2V0Lm9uRXJyb3InKHdlYnNvY2tldElEOiBudW1iZXIsIHJlYXNvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZG9jcy9XZWIvQVBJL1dlYlNvY2tldC9vbm1lc3NhZ2VcbiAgICAgKi9cbiAgICAnd2Vic29ja2V0Lm9uTWVzc2FnZScod2Vic29ja2V0SUQ6IG51bWJlciwgZGF0YTogU3RyaW5nT3JCbG9iKTogUHJvbWlzZTx2b2lkPlxufVxuXG5jb25zdCBrZXkgPSAnaG9sb2Zsb3dzanNvbnJwYydcbmNvbnN0IGlzRGVidWcgPSBsb2NhdGlvbi5ocmVmID09PSAnaHR0cDovL2xvY2FsaG9zdDo1MDAwLydcbmNsYXNzIGlPU1dlYmtpdENoYW5uZWwge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGtleSwgZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkZXRhaWwgPSAoZSBhcyBDdXN0b21FdmVudDxhbnk+KS5kZXRhaWxcbiAgICAgICAgICAgIGZvciAoY29uc3QgZiBvZiB0aGlzLmxpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgZihkZXRhaWwpXG4gICAgICAgICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbiAgICBwcml2YXRlIGxpc3RlbmVyOiBBcnJheTwoZGF0YTogdW5rbm93bikgPT4gdm9pZD4gPSBbXVxuICAgIG9uKF86IHN0cmluZywgY2I6IChkYXRhOiBhbnkpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5wdXNoKGNiKVxuICAgIH1cbiAgICBlbWl0KF86IHN0cmluZywgZGF0YTogYW55KTogdm9pZCB7XG4gICAgICAgIGlmIChpc0RlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnc2VuZCcsIGRhdGEpXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHdpbmRvdywge1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlOiAocmVzcG9uc2U6IGFueSkgPT5cbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBDdXN0b21FdmVudDxhbnk+KGtleSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiAnMi4wJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGRhdGEuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBpZiAod2luZG93LndlYmtpdCAmJiB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVycyAmJiB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1trZXldKVxuICAgICAgICAgICAgd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnNba2V5XS5wb3N0TWVzc2FnZShkYXRhKVxuICAgIH1cbn1cbmNvbnN0IFRoaXNTaWRlSW1wbGVtZW50YXRpb246IFRoaXNTaWRlSW1wbGVtZW50YXRpb24gPSB7XG4gICAgLy8gdG9kbzogY2hlY2sgZGlzcGF0Y2ggdGFyZ2V0J3MgbWFuaWZlc3RcbiAgICAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJzogZGlzcGF0Y2hOb3JtYWxFdmVudC5iaW5kKG51bGwsICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnLCAnKicpLFxuICAgIGFzeW5jIG9uTWVzc2FnZShcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdG9FeHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICBtZXNzYWdlSUQ6IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZTogSW50ZXJuYWxNZXNzYWdlLFxuICAgICAgICBzZW5kZXI6IGJyb3dzZXIucnVudGltZS5NZXNzYWdlU2VuZGVyLFxuICAgICkge1xuICAgICAgICAvLyA/IHRoaXMgaXMgYSByZXNwb25zZSB0byB0aGUgbWVzc2FnZVxuICAgICAgICBpZiAoVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5oYXMobWVzc2FnZUlEKSAmJiBtZXNzYWdlLnJlc3BvbnNlKSB7XG4gICAgICAgICAgICBjb25zdCBbcmVzb2x2ZSwgcmVqZWN0XSA9IFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIuZ2V0KG1lc3NhZ2VJRCkhXG4gICAgICAgICAgICByZXNvbHZlKG1lc3NhZ2UuZGF0YSlcbiAgICAgICAgICAgIFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIuZGVsZXRlKG1lc3NhZ2VJRClcbiAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLnJlc3BvbnNlID09PSBmYWxzZSkge1xuICAgICAgICAgICAgb25Ob3JtYWxNZXNzYWdlKG1lc3NhZ2UuZGF0YSwgc2VuZGVyLCB0b0V4dGVuc2lvbklELCBleHRlbnNpb25JRCwgbWVzc2FnZUlEKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gPyBkcm9wIHRoZSBtZXNzYWdlXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jICd3ZWJzb2NrZXQub25DbG9zZScod2Vic29ja2V0SUQ6IG51bWJlciwgY29kZTogbnVtYmVyLCByZWFzb246IHN0cmluZywgd2FzQ2xlYW46IGJvb2xlYW4pIHtcbiAgICAgICAgb25XZWJTb2NrZXRDbG9zZSh3ZWJzb2NrZXRJRCwgY29kZSwgcmVhc29uLCB3YXNDbGVhbilcbiAgICB9LFxuICAgIGFzeW5jICd3ZWJzb2NrZXQub25FcnJvcicod2Vic29ja2V0SUQ6IG51bWJlciwgcmVhc29uOiBzdHJpbmcpIHtcbiAgICAgICAgb25XZWJTb2NrZXRFcnJvcih3ZWJzb2NrZXRJRCwgcmVhc29uKVxuICAgIH0sXG4gICAgYXN5bmMgJ3dlYnNvY2tldC5vbk1lc3NhZ2UnKHdlYnNvY2tldElEOiBudW1iZXIsIGRhdGE6IFN0cmluZ09yQmxvYikge1xuICAgICAgICBvbldlYlNvY2tldE1lc3NhZ2Uod2Vic29ja2V0SUQsIGRhdGEpXG4gICAgfSxcbn1cbmV4cG9ydCBjb25zdCBIb3N0ID0gQXN5bmNDYWxsPEhvc3Q+KFRoaXNTaWRlSW1wbGVtZW50YXRpb24gYXMgYW55LCB7XG4gICAga2V5OiAnJyxcbiAgICBsb2c6IGZhbHNlLFxuICAgIG1lc3NhZ2VDaGFubmVsOiBuZXcgaU9TV2Via2l0Q2hhbm5lbCgpLFxufSlcbiIsImltcG9ydCB7IEhvc3QgfSBmcm9tICcuLi9SUEMnXG5pbXBvcnQgeyBlbmNvZGVTdHJpbmdPckJsb2IgfSBmcm9tICcuLi91dGlscy9TdHJpbmdPckJsb2InXG5cbmNvbnN0IHsgY3JlYXRlT2JqZWN0VVJMLCByZXZva2VPYmplY3RVUkwgfSA9IFVSTFxuZXhwb3J0IGZ1bmN0aW9uIGdldElERnJvbUJsb2JVUkwoeDogc3RyaW5nKSB7XG4gICAgaWYgKHguc3RhcnRzV2l0aCgnYmxvYjonKSkgcmV0dXJuIG5ldyBVUkwobmV3IFVSTCh4KS5wYXRobmFtZSkucGF0aG5hbWUucmVwbGFjZSgvXlxcLy8sICcnKVxuICAgIHJldHVybiB1bmRlZmluZWRcbn1cbi8qKlxuICogTW9kaWZ5IHRoZSBiZWhhdmlvciBvZiBVUkwuKlxuICogTGV0IHRoZSBibG9iOi8vIHVybCBjYW4gYmUgcmVjb2duaXplZCBieSBIb3N0LlxuICpcbiAqIEBwYXJhbSB1cmwgVGhlIG9yaWdpbmFsIFVSTCBvYmplY3RcbiAqIEBwYXJhbSBleHRlbnNpb25JRFxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5oYW5jZVVSTCh1cmw6IHR5cGVvZiBVUkwsIGV4dGVuc2lvbklEOiBzdHJpbmcpIHtcbiAgICB1cmwuY3JlYXRlT2JqZWN0VVJMID0gY3JlYXRlT2JqZWN0VVJMRW5oYW5jZWQoZXh0ZW5zaW9uSUQpXG4gICAgdXJsLnJldm9rZU9iamVjdFVSTCA9IHJldm9rZU9iamVjdFVSTEVuaGFuY2VkKGV4dGVuc2lvbklEKVxuICAgIHJldHVybiB1cmxcbn1cblxuZnVuY3Rpb24gcmV2b2tlT2JqZWN0VVJMRW5oYW5jZWQoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6ICh1cmw6IHN0cmluZykgPT4gdm9pZCB7XG4gICAgcmV0dXJuICh1cmw6IHN0cmluZykgPT4ge1xuICAgICAgICByZXZva2VPYmplY3RVUkwodXJsKVxuICAgICAgICBjb25zdCBpZCA9IGdldElERnJvbUJsb2JVUkwodXJsKSFcbiAgICAgICAgSG9zdFsnVVJMLnJldm9rZU9iamVjdFVSTCddKGV4dGVuc2lvbklELCBpZClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU9iamVjdFVSTEVuaGFuY2VkKGV4dGVuc2lvbklEOiBzdHJpbmcpOiAob2JqZWN0OiBhbnkpID0+IHN0cmluZyB7XG4gICAgcmV0dXJuIChvYmo6IEZpbGUgfCBCbG9iIHwgTWVkaWFTb3VyY2UpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gY3JlYXRlT2JqZWN0VVJMKG9iailcbiAgICAgICAgY29uc3QgcmVzb3VyY2VJRCA9IGdldElERnJvbUJsb2JVUkwodXJsKSFcbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgICAgIGVuY29kZVN0cmluZ09yQmxvYihvYmopLnRoZW4oYmxvYiA9PiBIb3N0WydVUkwuY3JlYXRlT2JqZWN0VVJMJ10oZXh0ZW5zaW9uSUQsIHJlc291cmNlSUQsIGJsb2IpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmxcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJsb2JUb0Jhc2U2NChibG9iOiBCbG9iKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgW2hlYWRlciwgYmFzZTY0XSA9IChyZWFkZXIucmVzdWx0IGFzIHN0cmluZykuc3BsaXQoJywnKVxuICAgICAgICAgICAgcmVzb2x2ZShiYXNlNjQpXG4gICAgICAgIH0pXG4gICAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGUgPT4gcmVqZWN0KGUpKVxuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKVxuICAgIH0pXG59XG4iLCJpbXBvcnQgeyBIb3N0IH0gZnJvbSAnLi4vUlBDJ1xuaW1wb3J0IHsgY3JlYXRlRXZlbnRMaXN0ZW5lciB9IGZyb20gJy4uL3V0aWxzL0xvY2FsTWVzc2FnZXMnXG5pbXBvcnQgeyBjcmVhdGVSdW50aW1lU2VuZE1lc3NhZ2UsIHNlbmRNZXNzYWdlV2l0aFJlc3BvbnNlIH0gZnJvbSAnLi9icm93c2VyLm1lc3NhZ2UnXG5pbXBvcnQgeyBNYW5pZmVzdCB9IGZyb20gJy4uL0V4dGVuc2lvbnMnXG5pbXBvcnQgeyBnZXRJREZyb21CbG9iVVJMIH0gZnJvbSAnLi9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTCdcbi8qKlxuICogQ3JlYXRlIGEgbmV3IGBicm93c2VyYCBvYmplY3QuXG4gKiBAcGFyYW0gZXh0ZW5zaW9uSUQgLSBFeHRlbnNpb24gSURcbiAqIEBwYXJhbSBtYW5pZmVzdCAtIE1hbmlmZXN0IG9mIHRoZSBleHRlbnNpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEJyb3dzZXJGYWN0b3J5KGV4dGVuc2lvbklEOiBzdHJpbmcsIG1hbmlmZXN0OiBNYW5pZmVzdCk6IGJyb3dzZXIge1xuICAgIGNvbnN0IGltcGxlbWVudGF0aW9uOiBQYXJ0aWFsPGJyb3dzZXI+ID0ge1xuICAgICAgICBkb3dubG9hZHM6IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIuZG93bmxvYWRzPih7XG4gICAgICAgICAgICBkb3dubG9hZDogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkJykoe1xuICAgICAgICAgICAgICAgIHBhcmFtKG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHsgdXJsLCBmaWxlbmFtZSB9ID0gb3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICBpZiAoZ2V0SURGcm9tQmxvYlVSTCh1cmwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmwgPSBgaG9sb2Zsb3dzLWJsb2I6Ly8ke2V4dGVuc2lvbklEfS8ke2dldElERnJvbUJsb2JVUkwodXJsKSF9YFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFBhcnRpYWxJbXBsZW1lbnRlZChvcHRpb25zLCAnZmlsZW5hbWUnLCAndXJsJylcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJnMSA9IHsgdXJsLCBmaWxlbmFtZTogZmlsZW5hbWUgfHwgJycgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2FyZzFdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXR1cm5zKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfSksXG4gICAgICAgIHJ1bnRpbWU6IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIucnVudGltZT4oe1xuICAgICAgICAgICAgZ2V0VVJMKHBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGhvbG9mbG93cy1leHRlbnNpb246Ly8ke2V4dGVuc2lvbklEfS8ke3BhdGh9YFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldE1hbmlmZXN0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0KSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbk1lc3NhZ2U6IGNyZWF0ZUV2ZW50TGlzdGVuZXIoZXh0ZW5zaW9uSUQsICdicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJyksXG4gICAgICAgICAgICBzZW5kTWVzc2FnZTogY3JlYXRlUnVudGltZVNlbmRNZXNzYWdlKGV4dGVuc2lvbklEKSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhYnM6IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIudGFicz4oe1xuICAgICAgICAgICAgYXN5bmMgZXhlY3V0ZVNjcmlwdCh0YWJJRCwgZGV0YWlscykge1xuICAgICAgICAgICAgICAgIFBhcnRpYWxJbXBsZW1lbnRlZChkZXRhaWxzLCAnY29kZScsICdmaWxlJywgJ3J1bkF0JylcbiAgICAgICAgICAgICAgICBhd2FpdCBIb3N0Wydicm93c2VyLnRhYnMuZXhlY3V0ZVNjcmlwdCddKGV4dGVuc2lvbklELCB0YWJJRCA9PT0gdW5kZWZpbmVkID8gLTEgOiB0YWJJRCwgZGV0YWlscylcbiAgICAgICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGU6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnRhYnMuY3JlYXRlJykoKSxcbiAgICAgICAgICAgIGFzeW5jIHJlbW92ZSh0YWJJRCkge1xuICAgICAgICAgICAgICAgIGxldCB0OiBudW1iZXJbXVxuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0YWJJRCkpIHQgPSBbdGFiSURdXG4gICAgICAgICAgICAgICAgZWxzZSB0ID0gdGFiSURcbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0Lm1hcCh4ID0+IEhvc3RbJ2Jyb3dzZXIudGFicy5yZW1vdmUnXShleHRlbnNpb25JRCwgeCkpKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHF1ZXJ5OiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci50YWJzLnF1ZXJ5JykoKSxcbiAgICAgICAgICAgIHVwZGF0ZTogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIudGFicy51cGRhdGUnKSgpLFxuICAgICAgICAgICAgYXN5bmMgc2VuZE1lc3NhZ2U8VCA9IGFueSwgVSA9IG9iamVjdD4oXG4gICAgICAgICAgICAgICAgdGFiSWQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBULFxuICAgICAgICAgICAgICAgIG9wdGlvbnM/OiB7IGZyYW1lSWQ/OiBudW1iZXIgfCB1bmRlZmluZWQgfSB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICk6IFByb21pc2U8dm9pZCB8IFU+IHtcbiAgICAgICAgICAgICAgICBQYXJ0aWFsSW1wbGVtZW50ZWQob3B0aW9ucylcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VuZE1lc3NhZ2VXaXRoUmVzcG9uc2UoZXh0ZW5zaW9uSUQsIGV4dGVuc2lvbklELCB0YWJJZCwgbWVzc2FnZSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgICBzdG9yYWdlOiB7XG4gICAgICAgICAgICBsb2NhbDogSW1wbGVtZW50czx0eXBlb2YgYnJvd3Nlci5zdG9yYWdlLmxvY2FsPih7XG4gICAgICAgICAgICAgICAgY2xlYXI6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnN0b3JhZ2UubG9jYWwuY2xlYXInKSgpLFxuICAgICAgICAgICAgICAgIHJlbW92ZTogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5yZW1vdmUnKSgpLFxuICAgICAgICAgICAgICAgIHNldDogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQnKSgpLFxuICAgICAgICAgICAgICAgIGdldDogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQnKSh7XG4gICAgICAgICAgICAgICAgICAgIC8qKiBIb3N0IG5vdCBhY2NlcHRpbmcgeyBhOiAxIH0gYXMga2V5cyAqL1xuICAgICAgICAgICAgICAgICAgICBwYXJhbShrZXlzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXlzKSkgcmV0dXJuIFtrZXlzIGFzIHN0cmluZ1tdXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXlzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXlzID09PSBudWxsKSByZXR1cm4gW251bGxdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtPYmplY3Qua2V5cyhrZXlzKV1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbbnVsbF1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJucyhydG4sIFtrZXldKTogb2JqZWN0IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleSkpIHJldHVybiBydG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmIGtleSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IC4uLmtleSwgLi4ucnRuIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBydG5cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgc3luYzogTm90SW1wbGVtZW50ZWRQcm94eSgpLFxuICAgICAgICAgICAgb25DaGFuZ2VkOiBOb3RJbXBsZW1lbnRlZFByb3h5KCksXG4gICAgICAgIH0sXG4gICAgICAgIHdlYk5hdmlnYXRpb246IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIud2ViTmF2aWdhdGlvbj4oe1xuICAgICAgICAgICAgb25Db21taXR0ZWQ6IGNyZWF0ZUV2ZW50TGlzdGVuZXIoZXh0ZW5zaW9uSUQsICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnKSxcbiAgICAgICAgfSksXG4gICAgICAgIGV4dGVuc2lvbjogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci5leHRlbnNpb24+KHtcbiAgICAgICAgICAgIGdldEJhY2tncm91bmRQYWdlKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJveHkoXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBuZXcgVVJMKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJHtleHRlbnNpb25JRH0vX2dlbmVyYXRlZF9iYWNrZ3JvdW5kX3BhZ2UuaHRtbGAsXG4gICAgICAgICAgICAgICAgICAgICAgICApIGFzIFBhcnRpYWw8TG9jYXRpb24+LFxuICAgICAgICAgICAgICAgICAgICB9IGFzIFBhcnRpYWw8V2luZG93PixcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0KF86IGFueSwga2V5OiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoX1trZXldKSByZXR1cm4gX1trZXldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTm90IHN1cHBvcnRlZCcpXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICkgYXMgV2luZG93XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICB9XG4gICAgcmV0dXJuIE5vdEltcGxlbWVudGVkUHJveHk8YnJvd3Nlcj4oaW1wbGVtZW50YXRpb24sIGZhbHNlKVxufVxudHlwZSBicm93c2VyID0gdHlwZW9mIGJyb3dzZXJcblxuZnVuY3Rpb24gSW1wbGVtZW50czxUPihpbXBsZW1lbnRhdGlvbjogVCkge1xuICAgIHJldHVybiBpbXBsZW1lbnRhdGlvblxufVxuZnVuY3Rpb24gTm90SW1wbGVtZW50ZWRQcm94eTxUID0gYW55PihpbXBsZW1lbnRlZDogUGFydGlhbDxUPiA9IHt9LCBmaW5hbCA9IHRydWUpOiBUIHtcbiAgICByZXR1cm4gbmV3IFByb3h5KGltcGxlbWVudGVkLCB7XG4gICAgICAgIGdldCh0YXJnZXQ6IGFueSwga2V5KSB7XG4gICAgICAgICAgICBpZiAoIXRhcmdldFtrZXldKSByZXR1cm4gZmluYWwgPyBOb3RJbXBsZW1lbnRlZCA6IE5vdEltcGxlbWVudGVkUHJveHkoKVxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtrZXldXG4gICAgICAgIH0sXG4gICAgICAgIGFwcGx5KCkge1xuICAgICAgICAgICAgcmV0dXJuIE5vdEltcGxlbWVudGVkKClcbiAgICAgICAgfSxcbiAgICB9KVxufVxuZnVuY3Rpb24gTm90SW1wbGVtZW50ZWQoKTogYW55IHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIScpXG4gICAgfVxufVxuZnVuY3Rpb24gUGFydGlhbEltcGxlbWVudGVkPFQ+KG9iajogVCA9IHt9IGFzIGFueSwgLi4ua2V5czogKGtleW9mIFQpW10pIHtcbiAgICBjb25zdCBvYmoyID0geyAuLi5vYmogfVxuICAgIGtleXMuZm9yRWFjaCh4ID0+IGRlbGV0ZSBvYmoyW3hdKVxuICAgIGlmIChPYmplY3Qua2V5cyhvYmoyKS5sZW5ndGgpIGNvbnNvbGUud2FybihgTm90IGltcGxlbWVudGVkIG9wdGlvbnNgLCBvYmoyLCBgYXRgLCBuZXcgRXJyb3IoKS5zdGFjaylcbn1cblxudHlwZSBIZWFkbGVzc1BhcmFtZXRlcnM8VCBleHRlbmRzICguLi5hcmdzOiBhbnkpID0+IGFueT4gPSBUIGV4dGVuZHMgKGV4dGVuc2lvbklEOiBzdHJpbmcsIC4uLmFyZ3M6IGluZmVyIFApID0+IGFueVxuICAgID8gUFxuICAgIDogbmV2ZXJcbi8qKlxuICogR2VuZXJhdGUgYmluZGluZyBiZXR3ZWVuIEhvc3QgYW5kIFdlYkV4dGVuc2lvbkFQSVxuICpcbiAqIEFMTCBnZW5lcmljcyBzaG91bGQgYmUgaW5mZXJyZWQuIERPIE5PVCB3cml0ZSBpdCBtYW51YWxseS5cbiAqXG4gKiBJZiB5b3UgYXJlIHdyaXRpbmcgb3B0aW9ucywgbWFrZSBzdXJlIHlvdSBhZGQgeW91ciBmdW5jdGlvbiB0byBgQnJvd3NlclJlZmVyZW5jZWAgdG8gZ2V0IHR5cGUgdGlwcy5cbiAqXG4gKiBAcGFyYW0gZXh0ZW5zaW9uSUQgLSBUaGUgZXh0ZW5zaW9uIElEXG4gKiBAcGFyYW0ga2V5IC0gVGhlIEFQSSBuYW1lIGluIHRoZSB0eXBlIG9mIGBIb3N0YCBBTkQgYEJyb3dzZXJSZWZlcmVuY2VgXG4gKi9cbmZ1bmN0aW9uIGJpbmRpbmc8XG4gICAgLyoqIE5hbWUgb2YgdGhlIEFQSSBpbiB0aGUgUlBDIGJpbmRpbmcgKi9cbiAgICBLZXkgZXh0ZW5kcyBrZXlvZiBCcm93c2VyUmVmZXJlbmNlLFxuICAgIC8qKiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgV2ViRXh0ZW5zaW9uQVBJIHNpZGUgKi9cbiAgICBCcm93c2VyRGVmIGV4dGVuZHMgQnJvd3NlclJlZmVyZW5jZVtLZXldLFxuICAgIC8qKiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgSG9zdCBzaWRlICovXG4gICAgSG9zdERlZiBleHRlbmRzIEhvc3RbS2V5XSxcbiAgICAvKiogQXJndW1lbnRzIG9mIHRoZSBicm93c2VyIHNpZGUgKi9cbiAgICBCcm93c2VyQXJncyBleHRlbmRzIFBhcmFtZXRlcnM8QnJvd3NlckRlZj4sXG4gICAgLyoqIFJldHVybiB0eXBlIG9mIHRoZSBicm93c2VyIHNpZGUgKi9cbiAgICBCcm93c2VyUmV0dXJuIGV4dGVuZHMgUHJvbWlzZU9mPFJldHVyblR5cGU8QnJvd3NlckRlZj4+LFxuICAgIC8qKiBBcmd1bWVudHMgdHlwZSBvZiB0aGUgSG9zdCBzaWRlICovXG4gICAgSG9zdEFyZ3MgZXh0ZW5kcyBIZWFkbGVzc1BhcmFtZXRlcnM8SG9zdERlZj4sXG4gICAgLyoqIFJldHVybiB0eXBlIG9mIHRoZSBIb3N0IHNpZGUgKi9cbiAgICBIb3N0UmV0dXJuIGV4dGVuZHMgUHJvbWlzZU9mPFJldHVyblR5cGU8SG9zdERlZj4+XG4+KGV4dGVuc2lvbklEOiBzdHJpbmcsIGtleTogS2V5KSB7XG4gICAgLyoqXG4gICAgICogQW5kIGhlcmUgd2Ugc3BsaXQgaXQgaW50byAyIGZ1bmN0aW9uLCBpZiB3ZSBqb2luIHRoZW0gdG9nZXRoZXIgaXQgd2lsbCBicmVhayB0aGUgaW5mZXIgKGJ1dCBpZGsgd2h5KVxuICAgICAqL1xuICAgIHJldHVybiA8XG4gICAgICAgIC8qKiBIZXJlIHdlIGhhdmUgdG8gdXNlIGdlbmVyaWNzIHdpdGggZ3VhcmQgdG8gZW5zdXJlIFR5cGVTY3JpcHQgd2lsbCBpbmZlciB0eXBlIG9uIHJ1bnRpbWUgKi9cbiAgICAgICAgT3B0aW9ucyBleHRlbmRzIHtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgKiBIZXJlIHdlIHdyaXRlIHRoZSB0eXBlIGd1YXJkIGluIHRoZSBnZW5lcmljLFxuICAgICAgICAgICAgICogZG9uJ3QgdXNlIHR3byBtb3JlIGdlbmVyaWNzIHRvIGluZmVyIHRoZSByZXR1cm4gdHlwZSBvZiBgcGFyYW1gIGFuZCBgcmV0dXJuc2AsXG4gICAgICAgICAgICAgKiB0aGF0IHdpbGwgYnJlYWsgdGhlIGluZmVyIHJlc3VsdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcGFyYW0/OiAoLi4uYXJnczogQnJvd3NlckFyZ3MpID0+IEhvc3RBcmdzXG4gICAgICAgICAgICByZXR1cm5zPzogKHJldHVybnM6IEhvc3RSZXR1cm4sIGJyb3dzZXI6IEJyb3dzZXJBcmdzLCBob3N0OiBIb3N0QXJncykgPT4gQnJvd3NlclJldHVyblxuICAgICAgICB9XG4gICAgPihcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMuIFlvdSBjYW4gd3JpdGUgdGhlIGJyaWRnZSBiZXR3ZWVuIEhvc3Qgc2lkZSBhbmQgV2ViRXh0ZW5zaW9uIHNpZGUuXG4gICAgICAgICAqL1xuICAgICAgICBvcHRpb25zOiBPcHRpb25zID0ge30gYXMgYW55LFxuICAgICkgPT4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRG9uJ3Qgd3JpdGUgdGhlc2UgdHlwZSBhbGlhcyBpbiBnZW5lcmljcy4gd2lsbCBicmVhay4gaWRrIHdoeSBhZ2Fpbi5cbiAgICAgICAgICovXG4gICAgICAgIHR5cGUgSGFzUGFyYW1GbiA9IHVuZGVmaW5lZCBleHRlbmRzIE9wdGlvbnNbJ3BhcmFtJ10gPyBmYWxzZSA6IHRydWVcbiAgICAgICAgdHlwZSBIYXNSZXR1cm5GbiA9IHVuZGVmaW5lZCBleHRlbmRzIE9wdGlvbnNbJ3JldHVybnMnXSA/IGZhbHNlIDogdHJ1ZVxuICAgICAgICB0eXBlIF9fX0FyZ3NfX18gPSBSZXR1cm5UeXBlPE5vbk51bGxhYmxlPE9wdGlvbnNbJ3BhcmFtJ10+PlxuICAgICAgICB0eXBlIF9fX1JldHVybl9fXyA9IFJldHVyblR5cGU8Tm9uTnVsbGFibGU8T3B0aW9uc1sncmV0dXJucyddPj5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIHRoZXJlIGlzIGEgYnJpZGdlIGZ1bmN0aW9uXG4gICAgICAgICAqIC0gaWYgaXRzIHJldHVybiB0eXBlIHNhdGlzZmllZCB0aGUgcmVxdWlyZW1lbnQsIHJldHVybiB0aGUgYEJyb3dzZXJBcmdzYCBlbHNlIHJldHVybiBgbmV2ZXJgXG4gICAgICAgICAqXG4gICAgICAgICAqIHJldHVybiB0aGUgYEhvc3RBcmdzYCBhbmQgbGV0IFR5cGVTY3JpcHQgY2hlY2sgaWYgaXQgaXMgc2F0aXNmaWVkLlxuICAgICAgICAgKi9cbiAgICAgICAgdHlwZSBJbmZlckFyZ3NSZXN1bHQgPSBIYXNQYXJhbUZuIGV4dGVuZHMgdHJ1ZVxuICAgICAgICAgICAgPyBfX19BcmdzX19fIGV4dGVuZHMgQnJvd3NlckFyZ3NcbiAgICAgICAgICAgICAgICA/IEJyb3dzZXJBcmdzXG4gICAgICAgICAgICAgICAgOiBuZXZlclxuICAgICAgICAgICAgOiBIb3N0QXJnc1xuICAgICAgICAvKiogSnVzdCBsaWtlIGBJbmZlckFyZ3NSZXN1bHRgICovXG4gICAgICAgIHR5cGUgSW5mZXJSZXR1cm5SZXN1bHQgPSBIYXNSZXR1cm5GbiBleHRlbmRzIHRydWVcbiAgICAgICAgICAgID8gX19fUmV0dXJuX19fIGV4dGVuZHMgQnJvd3NlclJldHVyblxuICAgICAgICAgICAgICAgID8gX19fUmV0dXJuX19fXG4gICAgICAgICAgICAgICAgOiAnbmV2ZXIgcnRuJ1xuICAgICAgICAgICAgOiBIb3N0UmV0dXJuXG4gICAgICAgIGNvbnN0IG5vb3AgPSA8VD4oeD86IFQpID0+IHhcbiAgICAgICAgY29uc3Qgbm9vcEFyZ3MgPSAoLi4uYXJnczogYW55W10pID0+IGFyZ3NcbiAgICAgICAgY29uc3QgaG9zdERlZmluaXRpb246IChleHRlbnNpb25JRDogc3RyaW5nLCAuLi5hcmdzOiBIb3N0QXJncykgPT4gUHJvbWlzZTxIb3N0UmV0dXJuPiA9IEhvc3Rba2V5XSBhcyBhbnlcbiAgICAgICAgcmV0dXJuICgoYXN5bmMgKC4uLmFyZ3M6IEJyb3dzZXJBcmdzKTogUHJvbWlzZTxCcm93c2VyUmV0dXJuPiA9PiB7XG4gICAgICAgICAgICAvLyA/IFRyYW5zZm9ybSBXZWJFeHRlbnNpb24gQVBJIGFyZ3VtZW50cyB0byBob3N0IGFyZ3VtZW50c1xuICAgICAgICAgICAgY29uc3QgaG9zdEFyZ3MgPSAob3B0aW9ucy5wYXJhbSB8fCBub29wQXJncykoLi4uYXJncykgYXMgSG9zdEFyZ3NcbiAgICAgICAgICAgIC8vID8gZXhlY3V0ZVxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaG9zdERlZmluaXRpb24oZXh0ZW5zaW9uSUQsIC4uLmhvc3RBcmdzKVxuICAgICAgICAgICAgLy8gPyBUcmFuc2Zvcm0gaG9zdCByZXN1bHQgdG8gV2ViRXh0ZW5zaW9uIEFQSSByZXN1bHRcbiAgICAgICAgICAgIGNvbnN0IGJyb3dzZXJSZXN1bHQgPSAob3B0aW9ucy5yZXR1cm5zIHx8IG5vb3ApKHJlc3VsdCwgYXJncywgaG9zdEFyZ3MpIGFzIEJyb3dzZXJSZXR1cm5cbiAgICAgICAgICAgIHJldHVybiBicm93c2VyUmVzdWx0XG4gICAgICAgIH0pIGFzIHVua25vd24pIGFzICguLi5hcmdzOiBJbmZlckFyZ3NSZXN1bHQpID0+IFByb21pc2U8SW5mZXJSZXR1cm5SZXN1bHQ+XG4gICAgfVxufVxuLyoqXG4gKiBBIHJlZmVyZW5jZSB0YWJsZSBiZXR3ZWVuIEhvc3QgYW5kIFdlYkV4dGVuc2lvbkFQSVxuICpcbiAqIGtleSBpcyBpbiB0aGUgaG9zdCwgcmVzdWx0IHR5cGUgaXMgaW4gdGhlIFdlYkV4dGVuc2lvbi5cbiAqL1xudHlwZSBCcm93c2VyUmVmZXJlbmNlID0geyBba2V5IGluIGtleW9mIHR5cGVvZiBIb3N0XTogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gUHJvbWlzZTx1bmtub3duPiB9ICYge1xuICAgICdicm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZCc6IHR5cGVvZiBicm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZFxuICAgICdicm93c2VyLnRhYnMuY3JlYXRlJzogdHlwZW9mIGJyb3dzZXIudGFicy5jcmVhdGVcbn1cbnR5cGUgUHJvbWlzZU9mPFQ+ID0gVCBleHRlbmRzIFByb21pc2U8aW5mZXIgVT4gPyBVIDogbmV2ZXJcbiIsImltcG9ydCB7IEhvc3QgfSBmcm9tICcuLi9SUEMnXG5pbXBvcnQgeyBkZWNvZGVTdHJpbmdPckJsb2IgfSBmcm9tICcuLi91dGlscy9TdHJpbmdPckJsb2InXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGZXRjaChleHRlbnNpb25JRDogc3RyaW5nKTogdHlwZW9mIGZldGNoIHtcbiAgICByZXR1cm4gbmV3IFByb3h5KGZldGNoLCB7XG4gICAgICAgIGFzeW5jIGFwcGx5KHRhcmdldCwgdGhpc0FyZywgW3JlcXVlc3RJbmZvLCByZXF1ZXN0SW5pdF06IFBhcmFtZXRlcnM8dHlwZW9mIGZldGNoPikge1xuICAgICAgICAgICAgY29uc3QgeyBib2R5LCBtZXRob2QsIHVybCB9ID0gbmV3IFJlcXVlc3QocmVxdWVzdEluZm8sIHJlcXVlc3RJbml0KVxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgSG9zdC5mZXRjaChleHRlbnNpb25JRCwgeyBtZXRob2QsIHVybCB9KVxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGRlY29kZVN0cmluZ09yQmxvYihyZXN1bHQuZGF0YSlcbiAgICAgICAgICAgIGlmIChkYXRhID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoJycpXG4gICAgICAgICAgICBjb25zdCByZXR1cm5WYWx1ZSA9IG5ldyBSZXNwb25zZShkYXRhLCByZXN1bHQpXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgICAgICAgfSxcbiAgICB9KVxufVxuIiwibGV0IGxhc3RVc2VyQWN0aXZlID0gMFxubGV0IG5vdyA9IERhdGUubm93LmJpbmQoRGF0ZSlcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgJ2NsaWNrJyxcbiAgICAoKSA9PiB7XG4gICAgICAgIGxhc3RVc2VyQWN0aXZlID0gbm93KClcbiAgICB9LFxuICAgIHsgY2FwdHVyZTogdHJ1ZSwgcGFzc2l2ZTogdHJ1ZSB9LFxuKVxuZXhwb3J0IGZ1bmN0aW9uIGhhc1ZhbGlkVXNlckludGVyYWN0aXZlKCkge1xuICAgIHJldHVybiBub3coKSAtIGxhc3RVc2VyQWN0aXZlIDwgMzAwMFxufVxuIiwiaW1wb3J0IHsgSG9zdCB9IGZyb20gJy4uL1JQQydcbmltcG9ydCB7IGhhc1ZhbGlkVXNlckludGVyYWN0aXZlIH0gZnJvbSAnLi4vdXRpbHMvVXNlckludGVyYWN0aXZlJ1xuXG5leHBvcnQgZnVuY3Rpb24gb3BlbkVuaGFuY2VkKGV4dGVuc2lvbklEOiBzdHJpbmcpOiB0eXBlb2Ygb3BlbiB7XG4gICAgcmV0dXJuICh1cmwgPSAnYWJvdXQ6YmxhbmsnLCB0YXJnZXQ/OiBzdHJpbmcsIGZlYXR1cmVzPzogc3RyaW5nLCByZXBsYWNlPzogYm9vbGVhbikgPT4ge1xuICAgICAgICBpZiAoIWhhc1ZhbGlkVXNlckludGVyYWN0aXZlKCkpIHJldHVybiBudWxsXG4gICAgICAgIGlmICgodGFyZ2V0ICYmIHRhcmdldCAhPT0gJ19ibGFuaycpIHx8IGZlYXR1cmVzIHx8IHJlcGxhY2UpXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1Vuc3VwcG9ydGVkIG9wZW4nLCB1cmwsIHRhcmdldCwgZmVhdHVyZXMsIHJlcGxhY2UpXG4gICAgICAgIEhvc3RbJ2Jyb3dzZXIudGFicy5jcmVhdGUnXShleHRlbnNpb25JRCwge1xuICAgICAgICAgICAgYWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgdXJsLFxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsb3NlRW5oYW5jZWQoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6IHR5cGVvZiBjbG9zZSB7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKCFoYXNWYWxpZFVzZXJJbnRlcmFjdGl2ZSgpKSByZXR1cm5cbiAgICAgICAgSG9zdFsnYnJvd3Nlci50YWJzLnF1ZXJ5J10oZXh0ZW5zaW9uSUQsIHsgYWN0aXZlOiB0cnVlIH0pLnRoZW4oaSA9PlxuICAgICAgICAgICAgSG9zdFsnYnJvd3Nlci50YWJzLnJlbW92ZSddKGV4dGVuc2lvbklELCBpWzBdLmlkISksXG4gICAgICAgIClcbiAgICB9XG59XG4iLCIvKipcbiAqIFRoaXMgZmlsZSBwYXJ0bHkgaW1wbGVtZW50cyBYUmF5VmlzaW9uIGluIEZpcmVmb3gncyBXZWJFeHRlbnNpb24gc3RhbmRhcmRcbiAqIGJ5IGNyZWF0ZSBhIHR3by13YXkgSlMgc2FuZGJveCBidXQgc2hhcmVkIERPTSBlbnZpcm9ubWVudC5cbiAqXG4gKiBjbGFzcyBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnQgd2lsbCByZXR1cm4gYSBuZXcgSlMgZW52aXJvbm1lbnRcbiAqIHRoYXQgaGFzIGEgXCJicm93c2VyXCIgdmFyaWFibGUgaW5zaWRlIG9mIGl0IGFuZCBhIGNsb25lIG9mIHRoZSBjdXJyZW50IERPTSBlbnZpcm9ubWVudFxuICogdG8gcHJldmVudCB0aGUgbWFpbiB0aHJlYWQgaGFjayBvbiBwcm90b3R5cGUgdG8gYWNjZXNzIHRoZSBjb250ZW50IG9mIENvbnRlbnRTY3JpcHRzLlxuICpcbiAqICMjIENoZWNrbGlzdDpcbiAqIC0gW29dIENvbnRlbnRTY3JpcHQgY2Fubm90IGFjY2VzcyBtYWluIHRocmVhZFxuICogLSBbP10gTWFpbiB0aHJlYWQgY2Fubm90IGFjY2VzcyBDb250ZW50U2NyaXB0XG4gKiAtIFtvXSBDb250ZW50U2NyaXB0IGNhbiBhY2Nlc3MgbWFpbiB0aHJlYWQncyBET01cbiAqIC0gWyBdIENvbnRlbnRTY3JpcHQgbW9kaWZpY2F0aW9uIG9uIERPTSBwcm90b3R5cGUgaXMgbm90IGRpc2NvdmVyYWJsZSBieSBtYWluIHRocmVhZFxuICogLSBbIF0gTWFpbiB0aHJlYWQgbW9kaWZpY2F0aW9uIG9uIERPTSBwcm90b3R5cGUgaXMgbm90IGRpc2NvdmVyYWJsZSBieSBDb250ZW50U2NyaXB0XG4gKi9cbmltcG9ydCBSZWFsbUNvbnN0cnVjdG9yLCB7IFJlYWxtIH0gZnJvbSAncmVhbG1zLXNoaW0nXG5cbmltcG9ydCB7IEJyb3dzZXJGYWN0b3J5IH0gZnJvbSAnLi9icm93c2VyJ1xuaW1wb3J0IHsgTWFuaWZlc3QgfSBmcm9tICcuLi9FeHRlbnNpb25zJ1xuaW1wb3J0IHsgZW5oYW5jZVVSTCB9IGZyb20gJy4vVVJMLmNyZWF0ZStyZXZva2VPYmplY3RVUkwnXG5pbXBvcnQgeyBjcmVhdGVGZXRjaCB9IGZyb20gJy4vZmV0Y2gnXG5pbXBvcnQgeyBjcmVhdGVXZWJTb2NrZXQgfSBmcm9tICcuL1dlYlNvY2tldCdcbmltcG9ydCB7IG9wZW5FbmhhbmNlZCwgY2xvc2VFbmhhbmNlZCB9IGZyb20gJy4vd2luZG93Lm9wZW4rY2xvc2UnXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IGdldCB0aGUgcHJvdG90eXBlIGNoYWluIG9mIGFuIE9iamVjdFxuICogQHBhcmFtIG8gT2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGdldFByb3RvdHlwZUNoYWluKG86IGFueSwgXzogYW55W10gPSBbXSk6IGFueVtdIHtcbiAgICBpZiAobyA9PT0gdW5kZWZpbmVkIHx8IG8gPT09IG51bGwpIHJldHVybiBfXG4gICAgY29uc3QgeSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKVxuICAgIGlmICh5ID09PSBudWxsIHx8IHkgPT09IHVuZGVmaW5lZCB8fCB5ID09PSBPYmplY3QucHJvdG90eXBlKSByZXR1cm4gX1xuICAgIHJldHVybiBnZXRQcm90b3R5cGVDaGFpbihPYmplY3QuZ2V0UHJvdG90eXBlT2YoeSksIFsuLi5fLCB5XSlcbn1cbi8qKlxuICogQXBwbHkgYWxsIFdlYkFQSXMgdG8gdGhlIGNsZWFuIHNhbmRib3ggY3JlYXRlZCBieSBSZWFsbVxuICovXG5jb25zdCBQcmVwYXJlV2ViQVBJcyA9ICgoKSA9PiB7XG4gICAgLy8gPyByZXBsYWNlIEZ1bmN0aW9uIHdpdGggcG9sbHV0ZWQgdmVyc2lvbiBieSBSZWFsbXNcbiAgICAvLyAhIHRoaXMgbGVha3MgdGhlIHNhbmRib3ghXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5nZXRQcm90b3R5cGVPZigoKSA9PiB7fSksICdjb25zdHJ1Y3RvcicsIHtcbiAgICAgICAgdmFsdWU6IGdsb2JhbFRoaXMuRnVuY3Rpb24sXG4gICAgfSlcbiAgICBjb25zdCByZWFsV2luZG93ID0gd2luZG93XG4gICAgY29uc3Qgd2ViQVBJcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHdpbmRvdylcbiAgICBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHdlYkFQSXMsICd3aW5kb3cnKVxuICAgIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkod2ViQVBJcywgJ2dsb2JhbFRoaXMnKVxuICAgIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkod2ViQVBJcywgJ3NlbGYnKVxuICAgIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkod2ViQVBJcywgJ2dsb2JhbCcpXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KERvY3VtZW50LnByb3RvdHlwZSwgJ2RlZmF1bHRWaWV3Jywge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH0sXG4gICAgfSlcbiAgICByZXR1cm4gKHNhbmRib3hSb290OiB0eXBlb2YgZ2xvYmFsVGhpcykgPT4ge1xuICAgICAgICBjb25zdCBjbG9uZWRXZWJBUElzID0geyAuLi53ZWJBUElzIH1cbiAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoc2FuZGJveFJvb3QpLmZvckVhY2gobmFtZSA9PiBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KGNsb25lZFdlYkFQSXMsIG5hbWUpKVxuICAgICAgICAvLyA/IENsb25lIFdlYiBBUElzXG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHdlYkFQSXMpIHtcbiAgICAgICAgICAgIFBhdGNoVGhpc09mRGVzY3JpcHRvclRvR2xvYmFsKHdlYkFQSXNba2V5XSwgcmVhbFdpbmRvdylcbiAgICAgICAgfVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2FuZGJveFJvb3QsICd3aW5kb3cnLCB7XG4gICAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIHZhbHVlOiBzYW5kYm94Um9vdCxcbiAgICAgICAgfSlcbiAgICAgICAgT2JqZWN0LmFzc2lnbihzYW5kYm94Um9vdCwgeyBnbG9iYWxUaGlzOiBzYW5kYm94Um9vdCB9KVxuICAgICAgICBjb25zdCBwcm90byA9IGdldFByb3RvdHlwZUNoYWluKHJlYWxXaW5kb3cpXG4gICAgICAgICAgICAubWFwKE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKVxuICAgICAgICAgICAgLnJlZHVjZVJpZ2h0KChwcmV2aW91cywgY3VycmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvcHkgPSB7IC4uLmN1cnJlbnQgfVxuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIGNvcHkpIHtcbiAgICAgICAgICAgICAgICAgICAgUGF0Y2hUaGlzT2ZEZXNjcmlwdG9yVG9HbG9iYWwoY29weVtrZXldLCByZWFsV2luZG93KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShwcmV2aW91cywgY29weSlcbiAgICAgICAgICAgIH0sIHt9KVxuICAgICAgICBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc2FuZGJveFJvb3QsIHByb3RvKVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhzYW5kYm94Um9vdCwgY2xvbmVkV2ViQVBJcylcbiAgICB9XG59KSgpXG4vKipcbiAqIEV4ZWN1dGlvbiBlbnZpcm9ubWVudCBvZiBDb250ZW50U2NyaXB0XG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnQgaW1wbGVtZW50cyBSZWFsbTx0eXBlb2YgZ2xvYmFsVGhpcyAmIHsgYnJvd3NlcjogdHlwZW9mIGJyb3dzZXIgfT4ge1xuICAgIHByaXZhdGUgcmVhbG0gPSBSZWFsbUNvbnN0cnVjdG9yLm1ha2VSb290UmVhbG0oKVxuICAgIGdldCBnbG9iYWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWxtLmdsb2JhbFxuICAgIH1cbiAgICByZWFkb25seSBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdSZWFsbSdcbiAgICAvKipcbiAgICAgKiBFdmFsdWF0ZSBhIHN0cmluZyBpbiB0aGUgY29udGVudCBzY3JpcHQgZW52aXJvbm1lbnRcbiAgICAgKiBAcGFyYW0gc291cmNlVGV4dCBTb3VyY2UgdGV4dFxuICAgICAqL1xuICAgIGV2YWx1YXRlKHNvdXJjZVRleHQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFsbS5ldmFsdWF0ZShzb3VyY2VUZXh0KVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgcnVubmluZyBleHRlbnNpb24gZm9yIGFuIGNvbnRlbnQgc2NyaXB0LlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRCBUaGUgZXh0ZW5zaW9uIElEXG4gICAgICogQHBhcmFtIG1hbmlmZXN0IFRoZSBtYW5pZmVzdCBvZiB0aGUgZXh0ZW5zaW9uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHVibGljIGV4dGVuc2lvbklEOiBzdHJpbmcsIHB1YmxpYyBtYW5pZmVzdDogTWFuaWZlc3QpIHtcbiAgICAgICAgdGhpcy5pbml0KClcbiAgICB9XG4gICAgcHJpdmF0ZSBpbml0KCkge1xuICAgICAgICBQcmVwYXJlV2ViQVBJcyh0aGlzLmdsb2JhbClcbiAgICAgICAgdGhpcy5nbG9iYWwuYnJvd3NlciA9IEJyb3dzZXJGYWN0b3J5KHRoaXMuZXh0ZW5zaW9uSUQsIHRoaXMubWFuaWZlc3QpXG4gICAgICAgIHRoaXMuZ2xvYmFsLlVSTCA9IGVuaGFuY2VVUkwodGhpcy5nbG9iYWwuVVJMLCB0aGlzLmV4dGVuc2lvbklEKVxuICAgICAgICB0aGlzLmdsb2JhbC5mZXRjaCA9IGNyZWF0ZUZldGNoKHRoaXMuZXh0ZW5zaW9uSUQpXG4gICAgICAgIHRoaXMuZ2xvYmFsLldlYlNvY2tldCA9IGNyZWF0ZVdlYlNvY2tldCh0aGlzLmV4dGVuc2lvbklEKVxuICAgICAgICB0aGlzLmdsb2JhbC5vcGVuID0gb3BlbkVuaGFuY2VkKHRoaXMuZXh0ZW5zaW9uSUQpXG4gICAgICAgIHRoaXMuZ2xvYmFsLmNsb3NlID0gY2xvc2VFbmhhbmNlZCh0aGlzLmV4dGVuc2lvbklEKVxuICAgIH1cbn1cbi8qKlxuICogTWFueSBtZXRob2RzIG9uIGB3aW5kb3dgIHJlcXVpcmVzIGB0aGlzYCBwb2ludHMgdG8gYSBXaW5kb3cgb2JqZWN0XG4gKiBMaWtlIGBhbGVydCgpYC4gSWYgeW91IGNhbGwgYWxlcnQgYXMgYGNvbnN0IHcgPSB7IGFsZXJ0IH07IHcuYWxlcnQoKWAsXG4gKiB0aGVyZSB3aWxsIGJlIGFuIElsbGVnYWwgaW52b2NhdGlvbi5cbiAqXG4gKiBUbyBwcmV2ZW50IGB0aGlzYCBiaW5kaW5nIGxvc3QsIHdlIG5lZWQgdG8gcmViaW5kIGl0LlxuICpcbiAqIEBwYXJhbSBkZXNjIFByb3BlcnR5RGVzY3JpcHRvclxuICogQHBhcmFtIGdsb2JhbCBUaGUgcmVhbCB3aW5kb3dcbiAqL1xuZnVuY3Rpb24gUGF0Y2hUaGlzT2ZEZXNjcmlwdG9yVG9HbG9iYWwoZGVzYzogUHJvcGVydHlEZXNjcmlwdG9yLCBnbG9iYWw6IFdpbmRvdykge1xuICAgIGNvbnN0IHsgZ2V0LCBzZXQsIHZhbHVlIH0gPSBkZXNjXG4gICAgaWYgKGdldCkgZGVzYy5nZXQgPSAoKSA9PiBnZXQuYXBwbHkoZ2xvYmFsKVxuICAgIGlmIChzZXQpIGRlc2Muc2V0ID0gKHZhbDogYW55KSA9PiBzZXQuYXBwbHkoZ2xvYmFsLCB2YWwpXG4gICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBjb25zdCBkZXNjMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHZhbHVlKVxuICAgICAgICBkZXNjLnZhbHVlID0gZnVuY3Rpb24oLi4uYXJnczogYW55W10pIHtcbiAgICAgICAgICAgIGlmIChuZXcudGFyZ2V0KSByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3QodmFsdWUsIGFyZ3MsIG5ldy50YXJnZXQpXG4gICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5hcHBseSh2YWx1ZSwgZ2xvYmFsLCBhcmdzKVxuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGRlc2MudmFsdWUsIGRlc2MyKVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gPyBGb3IgdW5rbm93biByZWFzb24gdGhpcyBmYWlsIGZvciBzb21lIG9iamVjdHMgb24gU2FmYXJpLlxuICAgICAgICAgICAgZGVzYy52YWx1ZS5wcm90b3R5cGUgPSB2YWx1ZS5wcm90b3R5cGVcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgIH1cbn1cbiIsImltcG9ydCB7IG1hdGNoaW5nVVJMIH0gZnJvbSAnLi91dGlscy9VUkxNYXRjaGVyJ1xuaW1wb3J0IHsgV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50IH0gZnJvbSAnLi9zaGltcy9YUmF5VmlzaW9uJ1xuaW1wb3J0IHsgQnJvd3NlckZhY3RvcnkgfSBmcm9tICcuL3NoaW1zL2Jyb3dzZXInXG5pbXBvcnQgeyBjcmVhdGVGZXRjaCB9IGZyb20gJy4vc2hpbXMvZmV0Y2gnXG5pbXBvcnQgeyBlbmhhbmNlVVJMIH0gZnJvbSAnLi9zaGltcy9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTCdcbmltcG9ydCB7IG9wZW5FbmhhbmNlZCwgY2xvc2VFbmhhbmNlZCB9IGZyb20gJy4vc2hpbXMvd2luZG93Lm9wZW4rY2xvc2UnXG5cbmV4cG9ydCB0eXBlIFdlYkV4dGVuc2lvbklEID0gc3RyaW5nXG5leHBvcnQgdHlwZSBNYW5pZmVzdCA9IFBhcnRpYWw8YnJvd3Nlci5ydW50aW1lLk1hbmlmZXN0PiAmXG4gICAgUGljazxicm93c2VyLnJ1bnRpbWUuTWFuaWZlc3QsICduYW1lJyB8ICd2ZXJzaW9uJyB8ICdtYW5pZmVzdF92ZXJzaW9uJz5cbmV4cG9ydCBpbnRlcmZhY2UgV2ViRXh0ZW5zaW9uIHtcbiAgICBtYW5pZmVzdDogTWFuaWZlc3RcbiAgICBlbnZpcm9ubWVudDogV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50XG59XG5leHBvcnQgY29uc3QgcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbiA9IG5ldyBNYXA8V2ViRXh0ZW5zaW9uSUQsIFdlYkV4dGVuc2lvbj4oKVxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyV2ViRXh0ZW5zaW9uKFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgbWFuaWZlc3Q6IE1hbmlmZXN0LFxuICAgIHByZWxvYWRlZFJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9LFxuKSB7XG4gICAgY29uc3QgZW52aXJvbm1lbnQ6ICdjb250ZW50IHNjcmlwdCcgfCAnYmFja2dyb3VuZCBzY3JpcHQnID1cbiAgICAgICAgbG9jYXRpb24uaHJlZi5zdGFydHNXaXRoKCdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJykgJiYgbG9jYXRpb24uaHJlZi5lbmRzV2l0aCgnX2dlbmVyYXRlZF9iYWNrZ3JvdW5kX3BhZ2UuaHRtbCcpXG4gICAgICAgICAgICA/ICdiYWNrZ3JvdW5kIHNjcmlwdCdcbiAgICAgICAgICAgIDogJ2NvbnRlbnQgc2NyaXB0J1xuICAgIGNvbnNvbGUuZGVidWcoXG4gICAgICAgIGBbV2ViRXh0ZW5zaW9uXSBMb2FkaW5nIGV4dGVuc2lvbiAke21hbmlmZXN0Lm5hbWV9KCR7ZXh0ZW5zaW9uSUR9KSB3aXRoIG1hbmlmZXN0YCxcbiAgICAgICAgbWFuaWZlc3QsXG4gICAgICAgIGBhbmQgcHJlbG9hZGVkIHJlc291cmNlYCxcbiAgICAgICAgcHJlbG9hZGVkUmVzb3VyY2VzLFxuICAgICAgICBgaW4gJHtlbnZpcm9ubWVudH0gbW9kZWAsXG4gICAgKVxuICAgIGlmIChsb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2hvbG9mbG93cy1leHRlbnNpb246JykgcHJlcGFyZUJhY2tncm91bmRBbmRPcHRpb25zUGFnZUVudmlyb25tZW50KGV4dGVuc2lvbklELCBtYW5pZmVzdClcbiAgICB0cnkge1xuICAgICAgICBpZiAoZW52aXJvbm1lbnQgPT09ICdjb250ZW50IHNjcmlwdCcpIHtcbiAgICAgICAgICAgIHVudGlsRG9jdW1lbnRSZWFkeSgpLnRoZW4oKCkgPT4gTG9hZENvbnRlbnRTY3JpcHQobWFuaWZlc3QsIGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMpKVxuICAgICAgICB9IGVsc2UgaWYgKGVudmlyb25tZW50ID09PSAnYmFja2dyb3VuZCBzY3JpcHQnKSB7XG4gICAgICAgICAgICB1bnRpbERvY3VtZW50UmVhZHkoKS50aGVuKCgpID0+IExvYWRCYWNrZ3JvdW5kU2NyaXB0KG1hbmlmZXN0LCBleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1dlYkV4dGVuc2lvbl0gdW5rbm93biBydW5uaW5nIGVudmlyb25tZW50ICR7ZW52aXJvbm1lbnR9YClcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgIH1cbiAgICByZXR1cm4gcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5nZXQoZXh0ZW5zaW9uSUQpXG59XG5cbmZ1bmN0aW9uIHVudGlsRG9jdW1lbnRSZWFkeSgpIHtcbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdyZWFkeXN0YXRlY2hhbmdlJywgcmVzb2x2ZSwgeyBvbmNlOiB0cnVlLCBwYXNzaXZlOiB0cnVlIH0pXG4gICAgfSlcbn1cblxuZnVuY3Rpb24gTG9hZEJhY2tncm91bmRTY3JpcHQobWFuaWZlc3Q6IE1hbmlmZXN0LCBleHRlbnNpb25JRDogc3RyaW5nLCBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcbiAgICBpZiAoIW1hbmlmZXN0LmJhY2tncm91bmQpIHJldHVyblxuICAgIGNvbnN0IHsgcGFnZSwgc2NyaXB0cyB9ID0gbWFuaWZlc3QuYmFja2dyb3VuZCBhcyBhbnlcbiAgICBpZiAocGFnZSkgcmV0dXJuIGNvbnNvbGUud2FybignW1dlYkV4dGVuc2lvbl0gbWFuaWZlc3QuYmFja2dyb3VuZC5wYWdlIGlzIG5vdCBzdXBwb3J0ZWQgeWV0IScpXG4gICAgaWYgKGxvY2F0aW9uLmhvc3RuYW1lICE9PSAnbG9jYWxob3N0JyAmJiAhbG9jYXRpb24uaHJlZi5zdGFydHNXaXRoKCdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgQmFja2dyb3VuZCBzY3JpcHQgb25seSBhbGxvd2VkIGluIGxvY2FsaG9zdChmb3IgZGVidWdnaW5nKSBhbmQgaG9sb2Zsb3dzLWV4dGVuc2lvbjovL2ApXG4gICAgfVxuICAgIHtcbiAgICAgICAgY29uc3Qgc3JjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihIVE1MU2NyaXB0RWxlbWVudC5wcm90b3R5cGUsICdzcmMnKSFcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEhUTUxTY3JpcHRFbGVtZW50LnByb3RvdHlwZSwgJ3NyYycsIHtcbiAgICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3JjLmdldCEuY2FsbCh0aGlzKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWwpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTG9hZGluZyAnLCB2YWwpXG4gICAgICAgICAgICAgICAgaWYgKHZhbCBpbiBwcmVsb2FkZWRSZXNvdXJjZXMgfHwgdmFsLnJlcGxhY2UoL15cXC8vLCAnJykgaW4gcHJlbG9hZGVkUmVzb3VyY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIFJ1bkluR2xvYmFsU2NvcGUoZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlc1t2YWxdIHx8IHByZWxvYWRlZFJlc291cmNlc1t2YWwucmVwbGFjZSgvXlxcLy8sICcnKV0pXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNyYy5zZXQhLmNhbGwodGhpcywgdmFsKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgIH1cbiAgICBwcmVwYXJlQmFja2dyb3VuZEFuZE9wdGlvbnNQYWdlRW52aXJvbm1lbnQoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0KVxuICAgIGZvciAoY29uc3QgcGF0aCBvZiAoc2NyaXB0cyBhcyBzdHJpbmdbXSkgfHwgW10pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcmVsb2FkZWRSZXNvdXJjZXNbcGF0aF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyA/IFJ1biBpdCBpbiBnbG9iYWwgc2NvcGUuXG4gICAgICAgICAgICBSdW5Jbkdsb2JhbFNjb3BlKGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXNbcGF0aF0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtXZWJFeHRlbnNpb25dIENvbnRlbnQgc2NyaXB0cyBwcmVsb2FkIG5vdCBmb3VuZCBmb3IgJHttYW5pZmVzdC5uYW1lfTogJHtwYXRofWApXG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBwcmVwYXJlQmFja2dyb3VuZEFuZE9wdGlvbnNQYWdlRW52aXJvbm1lbnQoZXh0ZW5zaW9uSUQ6IHN0cmluZywgbWFuaWZlc3Q6IE1hbmlmZXN0KSB7XG4gICAgT2JqZWN0LmFzc2lnbih3aW5kb3csIHtcbiAgICAgICAgYnJvd3NlcjogQnJvd3NlckZhY3RvcnkoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0KSxcbiAgICAgICAgZmV0Y2g6IGNyZWF0ZUZldGNoKGV4dGVuc2lvbklEKSxcbiAgICAgICAgVVJMOiBlbmhhbmNlVVJMKFVSTCwgZXh0ZW5zaW9uSUQpLFxuICAgICAgICBvcGVuOiBvcGVuRW5oYW5jZWQoZXh0ZW5zaW9uSUQpLFxuICAgICAgICBjbG9zZTogY2xvc2VFbmhhbmNlZChleHRlbnNpb25JRCksXG4gICAgfSBhcyBQYXJ0aWFsPHR5cGVvZiBnbG9iYWxUaGlzPilcbn1cblxuZnVuY3Rpb24gUnVuSW5HbG9iYWxTY29wZShleHRlbnNpb25JRDogc3RyaW5nLCBzcmM6IHN0cmluZykge1xuICAgIGlmIChsb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2hvbG9mbG93cy1leHRlbnNpb246JykgcmV0dXJuIG5ldyBGdW5jdGlvbihzcmMpKClcbiAgICBjb25zdCBmID0gbmV3IEZ1bmN0aW9uKGB3aXRoIChcbiAgICAgICAgICAgICAgICBuZXcgUHJveHkod2luZG93LCB7XG4gICAgICAgICAgICAgICAgICAgIGdldCh0YXJnZXQsIGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ2xvY2F0aW9uJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFVSTChcImhvbG9mbG93cy1leHRlbnNpb246Ly8ke2V4dGVuc2lvbklEfS9fZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZS5odG1sXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZih0eXBlb2YgdGFyZ2V0W2tleV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXNjMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHRhcmdldFtrZXldKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGYoLi4uYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3LnRhcmdldCkgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KHRhcmdldFtrZXldLCBhcmdzLCBuZXcudGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5hcHBseSh0YXJnZXRba2V5XSwgd2luZG93LCBhcmdzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhmLCBkZXNjMilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmLnByb3RvdHlwZSA9IHRhcmdldFtrZXldLnByb3RvdHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W2tleV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICkpIHtcbiAgICAgICAgICAgICAgICAke3NyY31cbiAgICAgICAgICAgICAgfWApXG4gICAgZigpXG59XG5cbmZ1bmN0aW9uIExvYWRDb250ZW50U2NyaXB0KG1hbmlmZXN0OiBNYW5pZmVzdCwgZXh0ZW5zaW9uSUQ6IHN0cmluZywgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSB7XG4gICAgZm9yIChjb25zdCBbaW5kZXgsIGNvbnRlbnRdIG9mIChtYW5pZmVzdC5jb250ZW50X3NjcmlwdHMgfHwgW10pLmVudHJpZXMoKSkge1xuICAgICAgICB3YXJuaW5nTm90SW1wbGVtZW50ZWRJdGVtKGNvbnRlbnQsIGluZGV4KVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBtYXRjaGluZ1VSTChcbiAgICAgICAgICAgICAgICBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQubWF0Y2hlcyxcbiAgICAgICAgICAgICAgICBjb250ZW50LmV4Y2x1ZGVfbWF0Y2hlcyB8fCBbXSxcbiAgICAgICAgICAgICAgICBjb250ZW50LmluY2x1ZGVfZ2xvYnMgfHwgW10sXG4gICAgICAgICAgICAgICAgY29udGVudC5leGNsdWRlX2dsb2JzIHx8IFtdLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQubWF0Y2hfYWJvdXRfYmxhbmssXG4gICAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW1dlYkV4dGVuc2lvbl0gTG9hZGluZyBjb250ZW50IHNjcmlwdCBmb3JgLCBjb250ZW50KVxuICAgICAgICAgICAgbG9hZENvbnRlbnRTY3JpcHQoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0LCBjb250ZW50LCBwcmVsb2FkZWRSZXNvdXJjZXMpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbV2ViRXh0ZW5zaW9uXSBVUkwgbWlzbWF0Y2hlZC4gU2tpcCBjb250ZW50IHNjcmlwdCBmb3IsIGAsIGNvbnRlbnQpXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRDb250ZW50U2NyaXB0KFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgbWFuaWZlc3Q6IE1hbmlmZXN0LFxuICAgIGNvbnRlbnQ6IE5vbk51bGxhYmxlPE1hbmlmZXN0Wydjb250ZW50X3NjcmlwdHMnXT5bMF0sXG4gICAgY29udGVudF9zY3JpcHRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuKSB7XG4gICAgaWYgKCFyZWdpc3RlcmVkV2ViRXh0ZW5zaW9uLmhhcyhleHRlbnNpb25JRCkpIHtcbiAgICAgICAgY29uc3QgZW52aXJvbm1lbnQgPSBuZXcgV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50KGV4dGVuc2lvbklELCBtYW5pZmVzdClcbiAgICAgICAgY29uc3QgZXh0OiBXZWJFeHRlbnNpb24gPSB7XG4gICAgICAgICAgICBtYW5pZmVzdCxcbiAgICAgICAgICAgIGVudmlyb25tZW50LFxuICAgICAgICB9XG4gICAgICAgIHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uc2V0KGV4dGVuc2lvbklELCBleHQpXG4gICAgfVxuICAgIGNvbnN0IHsgZW52aXJvbm1lbnQgfSA9IHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uZ2V0KGV4dGVuc2lvbklEKSFcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgY29udGVudC5qcyB8fCBbXSkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnRlbnRfc2NyaXB0c1twYXRoXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGVudmlyb25tZW50LmV2YWx1YXRlKGNvbnRlbnRfc2NyaXB0c1twYXRoXSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1dlYkV4dGVuc2lvbl0gQ29udGVudCBzY3JpcHRzIHByZWxvYWQgbm90IGZvdW5kIGZvciAke21hbmlmZXN0Lm5hbWV9OiAke3BhdGh9YClcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gd2FybmluZ05vdEltcGxlbWVudGVkSXRlbShjb250ZW50OiBOb25OdWxsYWJsZTxNYW5pZmVzdFsnY29udGVudF9zY3JpcHRzJ10+WzBdLCBpbmRleDogbnVtYmVyKSB7XG4gICAgaWYgKGNvbnRlbnQuYWxsX2ZyYW1lcylcbiAgICAgICAgY29uc29sZS53YXJuKGBhbGxfZnJhbWVzIG5vdCBzdXBwb3J0ZWQgeWV0LiBEZWZpbmVkIGF0IG1hbmlmZXN0LmNvbnRlbnRfc2NyaXB0c1ske2luZGV4fV0uYWxsX2ZyYW1lc2ApXG4gICAgaWYgKGNvbnRlbnQuY3NzKSBjb25zb2xlLndhcm4oYGNzcyBub3Qgc3VwcG9ydGVkIHlldC4gRGVmaW5lZCBhdCBtYW5pZmVzdC5jb250ZW50X3NjcmlwdHNbJHtpbmRleH1dLmNzc2ApXG4gICAgaWYgKGNvbnRlbnQucnVuX2F0ICYmIGNvbnRlbnQucnVuX2F0ICE9PSAnZG9jdW1lbnRfc3RhcnQnKVxuICAgICAgICBjb25zb2xlLndhcm4oYHJ1bl9hdCBub3Qgc3VwcG9ydGVkIHlldC4gRGVmaW5lZCBhdCBtYW5pZmVzdC5jb250ZW50X3NjcmlwdHNbJHtpbmRleH1dLnJ1bl9hdGApXG59XG4iLCJpbXBvcnQgeyByZWdpc3RlcldlYkV4dGVuc2lvbiB9IGZyb20gJy4vRXh0ZW5zaW9ucydcbmNvbnN0IGVudiA9XG4gICAgbG9jYXRpb24uaHJlZi5zdGFydHNXaXRoKCdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJykgJiYgbG9jYXRpb24uaHJlZi5lbmRzV2l0aCgnX2dlbmVyYXRlZF9iYWNrZ3JvdW5kX3BhZ2UuaHRtbCcpXG4vLyAjIyBJbmplY3QgaGVyZVxuLy8gPyB0byBhdm9pZCByZWdpc3RlcldlYkV4dGVuc2lvbiBvbWl0dGVkIGJ5IHJvbGx1cFxucmVnaXN0ZXJXZWJFeHRlbnNpb24udG9TdHJpbmcoKVxuXG4vKipcbiAqIHJlZ2lzdGVyV2ViRXh0ZW5zaW9uKFxuICogICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICogICAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gKiAgICAgIHByZWxvYWRlZFJlc291cmNlcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz5cbiAqIClcbiAqL1xuIl0sIm5hbWVzIjpbInRoaXMiLCJSZXF1ZXN0IiwiUmVhbG1Db25zdHJ1Y3RvciJdLCJtYXBwaW5ncyI6Ijs7O0lBQUE7Ozs7Ozs7O0FBUUEsYUFBZ0IsV0FBVyxDQUN2QixRQUFhLEVBQ2IsT0FBaUIsRUFDakIsZUFBeUIsRUFDekIsYUFBdUIsRUFDdkIsYUFBdUIsRUFDdkIsV0FBcUI7UUFFckIsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFBOztRQUVsQixLQUFLLE1BQU0sSUFBSSxJQUFJLE9BQU87WUFBRSxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQztnQkFBRSxNQUFNLEdBQUcsSUFBSSxDQUFBO1FBQzNGLEtBQUssTUFBTSxJQUFJLElBQUksZUFBZTtZQUFFLElBQUksZUFBZSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUM7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