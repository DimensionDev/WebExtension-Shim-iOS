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

          static makeRootRealm(options = {}) {
            // This is the exposed interface.

            // Bypass the constructor.
            const r = create(Realm.prototype);
            callAndWrapError(initRootRealm, unsafeRec, r, options);
            return r;
          }

          static makeCompartment(options = {}) {
            // Bypass the constructor.
            const r = create(Realm.prototype);
            callAndWrapError(initCompartment, unsafeRec, r, options);
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

          evaluate(x, endowments, options = {}) {
            // safe against strange 'this', as above
            return callAndWrapError(realmEvaluate, this, x, endowments, options);
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

          // Prevents the evaluation of source when calling constructor on the
          // prototype of functions.
          const TamedFunction = function() {
            throw new TypeError('Not available');
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
          throwTantrum(`unexpected scope handler trap called: ${prop}`);
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
      function createScopeHandler(unsafeRec, safeGlobal, sloppyGlobals) {
        const { unsafeGlobal, unsafeEval } = unsafeRec;

        // This flag allow us to determine if the eval() call is an done by the
        // realm's code or if it is user-land invocation, so we can react differently.
        let useUnsafeEvaluator = false;

        return {
          // The scope handler throws if any trap other than get/set/has are run
          // (e.g. getOwnPropertyDescriptors, apply, getPrototypeOf).
          // eslint-disable-next-line no-proto
          __proto__: alwaysThrowHandler,

          allowUnsafeEvaluatorOnce() {
            useUnsafeEvaluator = true;
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
            // proxies stringify 'prop', so no TOCTTOU danger here

            if (sloppyGlobals) {
              // Everything is potentially available.
              return true;
            }

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
      // explains that JavaScript parsers may or may not recognize html
      // comment tokens "<" immediately followed by "!--" and "--"
      // immediately followed by ">" in non-module source text, and treat
      // them as a kind of line comment. Since otherwise both of these can
      // appear in normal JavaScript source code as a sequence of operators,
      // we have the terrifying possibility of the same source code parsing
      // one way on one correct JavaScript implementation, and another way
      // on another.
      //
      // This shim takes the conservative strategy of just rejecting source
      // text that contains these strings anywhere. Note that this very
      // source file is written strangely to avoid mentioning these
      // character strings explicitly.

      // We do not write the regexp in a straightforward way, so that an
      // apparennt html comment does not appear in this file. Thus, we avoid
      // rejection by the overly eager rejectDangerousSources.
      const htmlCommentPattern = new RegExp(`(?:${'<'}!--|--${'>'})`);

      function rejectHtmlComments(s) {
        const index = s.search(htmlCommentPattern);
        if (index !== -1) {
          const linenum = s.slice(0, index).split('\n').length; // more or less
          throw new SyntaxError(
            `possible html comment syntax rejected around line ${linenum}`
          );
        }
      }

      // The proposed dynamic import expression is the only syntax currently
      // proposed, that can appear in non-module JavaScript code, that
      // enables direct access to the outside world that cannot be
      // surpressed or intercepted without parsing and rewriting. Instead,
      // this shim conservatively rejects any source text that seems to
      // contain such an expression. To do this safely without parsing, we
      // must also reject some valid programs, i.e., those containing
      // apparent import expressions in literal strings or comments.

      // The current conservative rule looks for the identifier "import"
      // followed by either an open paren or something that looks like the
      // beginning of a comment. We assume that we do not need to worry
      // about html comment syntax because that was already rejected by
      // rejectHtmlComments.

      // this \s *must* match all kinds of syntax-defined whitespace. If e.g.
      // U+2028 (LINE SEPARATOR) or U+2029 (PARAGRAPH SEPARATOR) is treated as
      // whitespace by the parser, but not matched by /\s/, then this would admit
      // an attack like: import\u2028('power.js') . We're trying to distinguish
      // something like that from something like importnotreally('power.js') which
      // is perfectly safe.

      const importPattern = /\bimport\s*(?:\(|\/[/*])/;

      function rejectImportExpressions(s) {
        const index = s.search(importPattern);
        if (index !== -1) {
          const linenum = s.slice(0, index).split('\n').length; // more or less
          throw new SyntaxError(
            `possible import expression rejected around line ${linenum}`
          );
        }
      }

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
        rejectHtmlComments(s);
        rejectImportExpressions(s);
        rejectSomeDirectEvalExpressions(s);
      }

      // Export a rewriter transform.
      const rejectDangerousSourcesTransform = {
        rewrite(rs) {
          rejectDangerousSources(rs.src);
          return rs;
        }
      };

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

      function createSafeEvaluatorFactory(
        unsafeRec,
        safeGlobal,
        transforms,
        sloppyGlobals
      ) {
        const { unsafeFunction } = unsafeRec;

        const scopeHandler = createScopeHandler(unsafeRec, safeGlobal, sloppyGlobals);
        const constants = getOptimizableGlobals(safeGlobal);
        const scopedEvaluatorFactory = createScopedEvaluatorFactory(
          unsafeRec,
          constants
        );

        function factory(endowments = {}, options = {}) {
          const localTransforms = options.transforms || [];
          const realmTransforms = transforms || [];

          const mandatoryTransforms = [rejectDangerousSourcesTransform];
          const allTransforms = [
            ...localTransforms,
            ...realmTransforms,
            ...mandatoryTransforms
          ];

          // We use the the concise method syntax to create an eval without a
          // [[Construct]] behavior (such that the invocation "new eval()" throws
          // TypeError: eval is not a constructor"), but which still accepts a
          // 'this' binding.
          const safeEval = {
            eval(src) {
              src = `${src}`;
              // Rewrite the source, threading through rewriter state as necessary.
              const rewriterState = allTransforms.reduce(
                (rs, transform) => (transform.rewrite ? transform.rewrite(rs) : rs),
                { src, endowments }
              );
              src = rewriterState.src;

              const scopeTarget = create(
                safeGlobal,
                getOwnPropertyDescriptors(rewriterState.endowments)
              );
              const scopeProxy = new Proxy(scopeTarget, scopeHandler);
              const scopedEvaluator = apply(scopedEvaluatorFactory, safeGlobal, [
                scopeProxy
              ]);

              scopeHandler.allowUnsafeEvaluatorOnce();
              let err;
              try {
                // Ensure that "this" resolves to the safe global.
                return apply(scopedEvaluator, safeGlobal, [src]);
              } catch (e) {
                // stash the child-code error in hopes of debugging the internal failure
                err = e;
                throw e;
              } finally {
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
        return (x, endowments, options = {}) =>
          safeEvaluatorFactory(endowments, options)(x);
      }

      /**
       * A safe version of the native Function which relies on
       * the safety of evalEvaluator for confinement.
       */
      function createFunctionEvaluator(unsafeRec, safeEval) {
        const { unsafeFunction, unsafeGlobal } = unsafeRec;

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

          return safeEval(src);
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
            value: safeEval("() => 'function Function() { [shim code] }'"),
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

      function createRealmRec(unsafeRec, transforms, sloppyGlobals) {
        const { sharedGlobalDescs, unsafeGlobal } = unsafeRec;

        const safeGlobal = create(unsafeGlobal.Object.prototype, sharedGlobalDescs);

        const safeEvaluatorFactory = createSafeEvaluatorFactory(
          unsafeRec,
          safeGlobal,
          transforms,
          sloppyGlobals
        );
        const safeEval = createSafeEvaluator(safeEvaluatorFactory);
        const safeEvalWhichTakesEndowments = createSafeEvaluatorWhichTakesEndowments(
          safeEvaluatorFactory
        );
        const safeFunction = createFunctionEvaluator(unsafeRec, safeEval);

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
        const { shims: newShims, transforms, sloppyGlobals } = options;
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
        const realmRec = createRealmRec(unsafeRec, transforms, sloppyGlobals);

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
      function initCompartment(unsafeRec, self, options = {}) {
        // note: 'self' is the instance of the Realm.

        const { transforms, sloppyGlobals } = options;
        const realmRec = createRealmRec(unsafeRec, transforms, sloppyGlobals);

        // The realmRec acts as a private field on the realm instance.
        registerRealmRecForRealmInstance(self, realmRec);
      }

      function getRealmGlobal(self) {
        const { safeGlobal } = getRealmRecForRealmInstance(self);
        return safeGlobal;
      }

      function realmEvaluate(self, x, endowments = {}, options = {}) {
        // todo: don't pass in primal-realm objects like {}, for safety. OTOH its
        // properties are copied onto the new global 'target'.
        // todo: figure out a way to membrane away the contents to safety.
        const { safeEvalWhichTakesEndowments } = getRealmRecForRealmInstance(self);
        return safeEvalWhichTakesEndowments(x, endowments, options);
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
         * @param  {String} type  Type of event to listen for, or `"*"` for all events
         * @param  {Function} handler Function to call in response to given event
         * @memberOf mitt
         */
        on: function on(type        , handler              ) {
          (all[type] || (all[type] = [])).push(handler);
        },

        /**
         * Remove an event handler for the given type.
         *
         * @param  {String} type  Type of event to unregister `handler` from, or `"*"`
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

    /**
     * This file (AsyncCall) is under MIT License
     *
     * This is a light implementation of JSON RPC 2.0
     *
     * https://www.jsonrpc.org/specification
     *
     * -----------------------------------------------------------------------------
     * Extends to the specification:
     *
     * Request object:
     *      remoteStack?: string
     *          This property will help server print the log better.
     *
     * Error object:
     *      data?: { stack?: string, type?: string }
     *          This property will help client to build a better Error object.
     *              Supported value for "type" field (Defined in ECMAScript standard):
     *                  Error, EvalError, RangeError, ReferenceError,
     *                  SyntaxError, TypeError, URIError
     *
     * Response object:
     *      resultIsUndefined?: boolean
     *          This property is a hint. If the client is run in JavaScript,
     *          it should treat "result: null" as "result: undefined"
     * -----------------------------------------------------------------------------
     * Implemented JSON RPC extension (internal methods):
     * None
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
        const { serializer, key, strict, log, parameterStructures, preferLocalImplementation } = {
            ...AsyncCallDefaultOptions,
            ...options,
        };
        const message = options.messageChannel || new MessageCenter();
        const { methodNotFound: banMethodNotFound = false, noUndefined: noUndefinedKeeping = false, unknownMessage: banUnknownMessage = false, } = calcStrictOptions(strict);
        const { beCalled: logBeCalled = true, localError: logLocalError = true, remoteError: logRemoteError = true, type: logType = 'pretty', sendLocalStack = false, } = calcLogOptions(log);
        const requestContext = new Map();
        async function onRequest(data) {
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
                    const result = await promise;
                    if (result === $AsyncCallIgnoreResponse)
                        return;
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
                        const param = parameterStructures === 'by-name' && params.length === 1 && isObject(param0)
                            ? param0
                            : params;
                        const request = new Request$1(id, method, param, sendingStack);
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
    class Request$1 {
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

    const MessageCenterEvent = 'Holoflows-Kit MessageCenter';
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
            /**
             * How should MessageCenter serialization the message
             * @defaultValue NoSerialization
             */
            this.serialization = NoSerialization;
            this.eventEmitter = new mitt();
            this.listener = async (request) => {
                let { key, data, instanceKey } = await this.serialization.deserialization(request.detail || request);
                // Message is not for us
                if (this.instanceKey !== (instanceKey || ''))
                    return;
                if (this.writeToConsole) {
                    console.log(`%cReceive%c %c${key.toString()}`, 'background: rgba(0, 255, 255, 0.6); color: black; padding: 0px 6px; border-radius: 4px;', '', 'text-decoration: underline', data);
                }
                this.eventEmitter.emit(key, data);
            };
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
        async emit(key, data, alsoSendToDocument = location.hostname === 'localhost') {
            if (this.writeToConsole) {
                console.log(`%cSend%c %c${key.toString()}`, 'background: rgba(0, 255, 255, 0.6); color: black; padding: 0px 6px; border-radius: 4px;', '', 'text-decoration: underline', data);
            }
            const serialized = await this.serialization.serialization({
                data,
                key,
                instanceKey: this.instanceKey || '',
            });
            if (typeof browser !== 'undefined') {
                if (browser.runtime && browser.runtime.sendMessage) {
                    browser.runtime.sendMessage(serialized).catch(noop);
                }
                if (browser.tabs) {
                    // Send message to Content Script
                    browser.tabs.query({ discarded: false }).then(tabs => {
                        for (const tab of tabs) {
                            if (tab.id)
                                browser.tabs.sendMessage(tab.id, serialized).catch(noop);
                        }
                    });
                }
            }
            if (alsoSendToDocument && typeof document !== 'undefined' && document.dispatchEvent) {
                const event = new CustomEvent(MessageCenterEvent, {
                    detail: await this.serialization.serialization({ data, key }),
                });
                document.dispatchEvent(event);
            }
        }
        /**
         * {@inheritdoc MessageCenter.emit}
         */
        send(...args) {
            return Reflect.apply(this.emit, this, args);
        }
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
                type: 'message',
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
                        Host.sendMessage(toExtensionID, extensionID, sender.tab.id, messageID, {
                            data,
                            response: true,
                            type: 'message',
                        });
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
            switch (message.type) {
                case 'message':
                    // ? this is a response to the message
                    if (TwoWayMessagePromiseResolver.has(messageID) && message.response) {
                        const [resolve, reject] = TwoWayMessagePromiseResolver.get(messageID);
                        resolve(message.data);
                        TwoWayMessagePromiseResolver.delete(messageID);
                    }
                    else if (message.response === false) {
                        onNormalMessage(message.data, sender, toExtensionID, extensionID, messageID);
                    }
                    break;
                case 'executeScript':
                    const ext = registeredWebExtension.get(extensionID);
                    if (message.code)
                        ext.environment.evaluate(message.code);
                    else if (message.file)
                        loadContentScript(extensionID, ext.manifest, {
                            js: [message.file],
                            // TODO: check the permission to inject the script
                            matches: ['<all_urls>'],
                        });
                    break;
                default:
                    break;
            }
        },
        async 'browser.tabs.executeScript'(extensionID, tabID, details) {
            return Host.sendMessage(extensionID, extensionID, tabID, Math.random().toString(), Object.assign(Object.assign({}, details), { type: 'executeScript' }));
        },
    };
    const Host = AsyncCall(ThisSideImplementation, {
        key: '',
        log: false,
        messageChannel: new iOSWebkitChannel(),
    });

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
                    await ThisSideImplementation['browser.tabs.executeScript'](extensionID, tabID === undefined ? -1 : tabID, details);
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
                                return Object.assign(Object.assign({}, key), rtn);
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
            permissions: NotImplementedProxy({
                request: async () => true,
                contains: async () => true,
                remove: async () => true,
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
                const f = options.returns || noop;
                // ? Transform host result to WebExtension API result
                const browserResult = f(result, args, hostArgs);
                return browserResult;
            });
        };
    }

    function createFetch(extensionID, origFetch) {
        return new Proxy(fetch, {
            async apply(target, thisArg, [requestInfo, requestInit]) {
                const { method, url } = new Request(requestInfo, requestInit);
                if (url.startsWith('holoflows-extension://' + extensionID + '/')) {
                    return origFetch(requestInfo, requestInit);
                }
                else {
                    const result = await Host.fetch(extensionID, { method, url });
                    const data = await decodeStringOrBlob(result.data);
                    if (data === null)
                        throw new Error('');
                    const returnValue = new Response(data, result);
                    return returnValue;
                }
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
            this.global.fetch = createFetch(this.extensionID, window.fetch);
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

    const normalized = Symbol('Normalized resources');
    function normalizePath(path, extensionID) {
        const prefix = getPrefix(extensionID);
        if (path.startsWith(prefix))
            return path;
        else
            return new URL(path, prefix).toJSON();
    }
    function getPrefix(extensionID) {
        return 'holoflows-extension://' + extensionID + '/';
    }
    function getResource(extensionID, resources, path) {
        // Normalization the resources
        // @ts-ignore
        if (!resources[normalized]) {
            for (const key in resources) {
                if (key.startsWith(getPrefix(extensionID)))
                    continue;
                const obj = resources[key];
                delete resources[key];
                resources[new URL(key, getPrefix(extensionID)).toJSON()] = obj;
            }
            // @ts-ignore
            resources[normalized] = true;
        }
        return resources[normalizePath(path, extensionID)];
    }
    async function getResourceAsync(extensionID, resources, path) {
        const preloaded = getResource(extensionID, resources, path);
        if (preloaded)
            return preloaded;
        const response = await fetch(normalizePath(path, extensionID));
        if (response.ok)
            return response.text();
        return undefined;
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
        return registeredWebExtension;
    }
    function untilDocumentReady() {
        if (document.readyState === 'complete')
            return Promise.resolve();
        return new Promise(resolve => {
            document.addEventListener('readystatechange', resolve, { once: true, passive: true });
        });
    }
    async function LoadBackgroundScript(manifest, extensionID, preloadedResources) {
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
                set(path) {
                    console.log('Loading ', path);
                    const preloaded = getResource(extensionID, preloadedResources, path);
                    if (preloaded)
                        RunInGlobalScope(extensionID, preloaded);
                    else
                        getResourceAsync(extensionID, preloadedResources, path)
                            .then(code => code || Promise.reject('Loading resource failed'))
                            .then(code => RunInGlobalScope(extensionID, code))
                            .catch(e => console.error(`Failed when loading resource`, path));
                    src.set.call(this, path);
                    return true;
                },
            });
        }
        for (const path of scripts || []) {
            const preloaded = await getResourceAsync(extensionID, preloadedResources, path);
            if (preloaded) {
                // ? Run it in global scope.
                RunInGlobalScope(extensionID, preloaded);
            }
            else {
                console.error(`[WebExtension] Background scripts not found for ${manifest.name}: ${path}`);
            }
        }
    }
    function prepareBackgroundAndOptionsPageEnvironment(extensionID, manifest) {
        Object.assign(window, {
            browser: BrowserFactory(extensionID, manifest),
            fetch: createFetch(extensionID, window.fetch),
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
    async function LoadContentScript(manifest, extensionID, preloadedResources) {
        if (!registeredWebExtension.has(extensionID)) {
            const environment = new WebExtensionContentScriptEnvironment(extensionID, manifest);
            const ext = {
                manifest,
                environment,
                preloadedResources,
            };
            registeredWebExtension.set(extensionID, ext);
        }
        for (const [index, content] of (manifest.content_scripts || []).entries()) {
            warningNotImplementedItem(content, index);
            if (matchingURL(new URL(location.href), content.matches, content.exclude_matches || [], content.include_globs || [], content.exclude_globs || [], content.match_about_blank)) {
                console.debug(`[WebExtension] Loading content script for`, content);
                await loadContentScript(extensionID, manifest, content, preloadedResources);
            }
            else {
                console.debug(`[WebExtension] URL mismatched. Skip content script for, `, content);
            }
        }
    }
    async function loadContentScript(extensionID, manifest, content, preloadedResources = registeredWebExtension.has(extensionID)
        ? registeredWebExtension.get(extensionID).preloadedResources
        : {}) {
        const { environment } = registeredWebExtension.get(extensionID);
        for (const path of content.js || []) {
            const preloaded = await getResourceAsync(extensionID, preloadedResources, path);
            if (preloaded) {
                environment.evaluate(preloaded);
            }
            else {
                console.error(`[WebExtension] Content scripts not found for ${manifest.name}: ${path}`);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMvVVJMTWF0Y2hlci50cyIsIi4uL25vZGVfbW9kdWxlcy9yZWFsbXMtc2hpbS9kaXN0L3JlYWxtcy1zaGltLnVtZC5qcyIsIi4uL25vZGVfbW9kdWxlcy9taXR0L2Rpc3QvbWl0dC5lcy5qcyIsIi4uL25vZGVfbW9kdWxlcy9AaG9sb2Zsb3dzL2tpdC9lcy91dGlsL0FzeW5jQ2FsbC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AaG9sb2Zsb3dzL2tpdC9lcy9FeHRlbnNpb24vTWVzc2FnZUNlbnRlci5qcyIsIi4uL3NyYy91dGlscy9Mb2NhbE1lc3NhZ2VzLnRzIiwiLi4vc3JjL3V0aWxzL2RlZXBDbG9uZS50cyIsIi4uL3NyYy9zaGltcy9icm93c2VyLm1lc3NhZ2UudHMiLCIuLi9zcmMvUlBDLnRzIiwiLi4vc3JjL3V0aWxzL1N0cmluZ09yQmxvYi50cyIsIi4uL3NyYy9zaGltcy9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTC50cyIsIi4uL3NyYy9zaGltcy9icm93c2VyLnRzIiwiLi4vc3JjL3NoaW1zL2ZldGNoLnRzIiwiLi4vc3JjL3V0aWxzL1VzZXJJbnRlcmFjdGl2ZS50cyIsIi4uL3NyYy9zaGltcy93aW5kb3cub3BlbitjbG9zZS50cyIsIi4uL3NyYy9zaGltcy9YUmF5VmlzaW9uLnRzIiwiLi4vc3JjL3V0aWxzL1Jlc291cmNlcy50cyIsIi4uL3NyYy9FeHRlbnNpb25zLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2hlY2sgaWYgdGhlIGN1cnJlbnQgbG9jYXRpb24gbWF0Y2hlcy4gVXNlZCBpbiBtYW5pZmVzdC5qc29uIHBhcnNlclxuICogQHBhcmFtIGxvY2F0aW9uIEN1cnJlbnQgbG9jYXRpb25cbiAqIEBwYXJhbSBtYXRjaGVzXG4gKiBAcGFyYW0gZXhjbHVkZV9tYXRjaGVzXG4gKiBAcGFyYW0gaW5jbHVkZV9nbG9ic1xuICogQHBhcmFtIGV4Y2x1ZGVfZ2xvYnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoaW5nVVJMKFxuICAgIGxvY2F0aW9uOiBVUkwsXG4gICAgbWF0Y2hlczogc3RyaW5nW10sXG4gICAgZXhjbHVkZV9tYXRjaGVzOiBzdHJpbmdbXSxcbiAgICBpbmNsdWRlX2dsb2JzOiBzdHJpbmdbXSxcbiAgICBleGNsdWRlX2dsb2JzOiBzdHJpbmdbXSxcbiAgICBhYm91dF9ibGFuaz86IGJvb2xlYW4sXG4pIHtcbiAgICBsZXQgcmVzdWx0ID0gZmFsc2VcbiAgICAvLyA/IFdlIGV2YWwgbWF0Y2hlcyBmaXJzdCB0aGVuIGV2YWwgbWlzbWF0Y2hlc1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBtYXRjaGVzKSBpZiAobWF0Y2hlc19tYXRjaGVyKGl0ZW0sIGxvY2F0aW9uLCBhYm91dF9ibGFuaykpIHJlc3VsdCA9IHRydWVcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZXhjbHVkZV9tYXRjaGVzKSBpZiAobWF0Y2hlc19tYXRjaGVyKGl0ZW0sIGxvY2F0aW9uKSkgcmVzdWx0ID0gZmFsc2VcbiAgICBpZiAoaW5jbHVkZV9nbG9icy5sZW5ndGgpIGNvbnNvbGUud2FybignaW5jbHVkZV9nbG9icyBub3Qgc3VwcG9ydGVkIHlldC4nKVxuICAgIGlmIChleGNsdWRlX2dsb2JzLmxlbmd0aCkgY29uc29sZS53YXJuKCdleGNsdWRlX2dsb2JzIG5vdCBzdXBwb3J0ZWQgeWV0LicpXG4gICAgcmV0dXJuIHJlc3VsdFxufVxuLyoqXG4gKiBTdXBwb3J0ZWQgcHJvdG9jb2xzXG4gKi9cbmNvbnN0IHN1cHBvcnRlZFByb3RvY29sczogcmVhZG9ubHkgc3RyaW5nW10gPSBbXG4gICAgJ2h0dHA6JyxcbiAgICAnaHR0cHM6JyxcbiAgICAvLyBcIndzOlwiLFxuICAgIC8vIFwid3NzOlwiLFxuICAgIC8vIFwiZnRwOlwiLFxuICAgIC8vIFwiZGF0YTpcIixcbiAgICAvLyBcImZpbGU6XCJcbl1cbmZ1bmN0aW9uIG1hdGNoZXNfbWF0Y2hlcihfOiBzdHJpbmcsIGxvY2F0aW9uOiBVUkwsIGFib3V0X2JsYW5rPzogYm9vbGVhbikge1xuICAgIGlmIChsb2NhdGlvbi50b1N0cmluZygpID09PSAnYWJvdXQ6YmxhbmsnICYmIGFib3V0X2JsYW5rKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChfID09PSAnPGFsbF91cmxzPicpIHtcbiAgICAgICAgaWYgKHN1cHBvcnRlZFByb3RvY29scy5pbmNsdWRlcyhsb2NhdGlvbi5wcm90b2NvbCkpIHJldHVybiB0cnVlXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBjb25zdCBbcnVsZSwgd2lsZGNhcmRQcm90b2NvbF0gPSBub3JtYWxpemVVUkwoXylcbiAgICBpZiAocnVsZS5wb3J0ICE9PSAnJykgcmV0dXJuIGZhbHNlXG4gICAgaWYgKCFwcm90b2NvbF9tYXRjaGVyKHJ1bGUucHJvdG9jb2wsIGxvY2F0aW9uLnByb3RvY29sLCB3aWxkY2FyZFByb3RvY29sKSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKCFob3N0X21hdGNoZXIocnVsZS5ob3N0bmFtZSwgbG9jYXRpb24uaG9zdG5hbWUpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoIXBhdGhfbWF0Y2hlcihydWxlLnBhdGhuYW1lLCBsb2NhdGlvbi5wYXRobmFtZSwgbG9jYXRpb24uc2VhcmNoKSkgcmV0dXJuIGZhbHNlXG4gICAgcmV0dXJuIHRydWVcbn1cbi8qKlxuICogTm9ybWFsaXplVVJMXG4gKiBAcGFyYW0gXyAtIFVSTCBkZWZpbmVkIGluIG1hbmlmZXN0XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVVSTChfOiBzdHJpbmcpOiBbVVJMLCBib29sZWFuXSB7XG4gICAgaWYgKF8uc3RhcnRzV2l0aCgnKjovLycpKSByZXR1cm4gW25ldyBVUkwoXy5yZXBsYWNlKC9eXFwqOi8sICdodHRwczonKSksIHRydWVdXG4gICAgcmV0dXJuIFtuZXcgVVJMKF8pLCBmYWxzZV1cbn1cbmZ1bmN0aW9uIHByb3RvY29sX21hdGNoZXIobWF0Y2hlclByb3RvY29sOiBzdHJpbmcsIGN1cnJlbnRQcm90b2NvbDogc3RyaW5nLCB3aWxkY2FyZFByb3RvY29sOiBib29sZWFuKSB7XG4gICAgLy8gPyBvbmx5IGBodHRwOmAgYW5kIGBodHRwczpgIGlzIHN1cHBvcnRlZCBjdXJyZW50bHlcbiAgICBpZiAoIXN1cHBvcnRlZFByb3RvY29scy5pbmNsdWRlcyhjdXJyZW50UHJvdG9jb2wpKSByZXR1cm4gZmFsc2VcbiAgICAvLyA/IGlmIHdhbnRlZCBwcm90b2NvbCBpcyBcIio6XCIsIG1hdGNoIGV2ZXJ5dGhpbmdcbiAgICBpZiAod2lsZGNhcmRQcm90b2NvbCkgcmV0dXJuIHRydWVcbiAgICBpZiAobWF0Y2hlclByb3RvY29sID09PSBjdXJyZW50UHJvdG9jb2wpIHJldHVybiB0cnVlXG4gICAgcmV0dXJuIGZhbHNlXG59XG5mdW5jdGlvbiBob3N0X21hdGNoZXIobWF0Y2hlckhvc3Q6IHN0cmluZywgY3VycmVudEhvc3Q6IHN0cmluZykge1xuICAgIC8vID8gJTJBIGlzICpcbiAgICBpZiAobWF0Y2hlckhvc3QgPT09ICclMkEnKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChtYXRjaGVySG9zdC5zdGFydHNXaXRoKCclMkEuJykpIHtcbiAgICAgICAgY29uc3QgcGFydCA9IG1hdGNoZXJIb3N0LnJlcGxhY2UoL14lMkEvLCAnJylcbiAgICAgICAgaWYgKHBhcnQgPT09IGN1cnJlbnRIb3N0KSByZXR1cm4gZmFsc2VcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRIb3N0LmVuZHNXaXRoKHBhcnQpXG4gICAgfVxuICAgIHJldHVybiBtYXRjaGVySG9zdCA9PT0gY3VycmVudEhvc3Rcbn1cbmZ1bmN0aW9uIHBhdGhfbWF0Y2hlcihtYXRjaGVyUGF0aDogc3RyaW5nLCBjdXJyZW50UGF0aDogc3RyaW5nLCBjdXJyZW50U2VhcmNoOiBzdHJpbmcpIHtcbiAgICBpZiAoIW1hdGNoZXJQYXRoLnN0YXJ0c1dpdGgoJy8nKSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKG1hdGNoZXJQYXRoID09PSAnLyonKSByZXR1cm4gdHJ1ZVxuICAgIC8vID8gJy9hL2IvYycgbWF0Y2hlcyAnL2EvYi9jIzEyMycgYnV0IG5vdCAnL2EvYi9jPzEyMydcbiAgICBpZiAobWF0Y2hlclBhdGggPT09IGN1cnJlbnRQYXRoICYmIGN1cnJlbnRTZWFyY2ggPT09ICcnKSByZXR1cm4gdHJ1ZVxuICAgIC8vID8gJy9hL2IvKicgbWF0Y2hlcyBldmVyeXRoaW5nIHN0YXJ0c1dpdGggJy9hL2IvJ1xuICAgIGlmIChtYXRjaGVyUGF0aC5lbmRzV2l0aCgnKicpICYmIGN1cnJlbnRQYXRoLnN0YXJ0c1dpdGgobWF0Y2hlclBhdGguc2xpY2UodW5kZWZpbmVkLCAtMSkpKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChtYXRjaGVyUGF0aC5pbmRleE9mKCcqJykgPT09IC0xKSByZXR1cm4gbWF0Y2hlclBhdGggPT09IGN1cnJlbnRQYXRoXG4gICAgY29uc29sZS53YXJuKCdOb3Qgc3VwcG9ydGVkIHBhdGggbWF0Y2hlciBpbiBtYW5pZmVzdC5qc29uJywgbWF0Y2hlclBhdGgpXG4gICAgcmV0dXJuIHRydWVcbn1cbiIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgKGdsb2JhbCA9IGdsb2JhbCB8fCBzZWxmLCBnbG9iYWwuUmVhbG0gPSBmYWN0b3J5KCkpO1xufSh0aGlzLCBmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuICAvLyB3ZSdkIGxpa2UgdG8gYWJhbmRvbiwgYnV0IHdlIGNhbid0LCBzbyBqdXN0IHNjcmVhbSBhbmQgYnJlYWsgYSBsb3Qgb2ZcbiAgLy8gc3R1ZmYuIEhvd2V2ZXIsIHNpbmNlIHdlIGFyZW4ndCByZWFsbHkgYWJvcnRpbmcgdGhlIHByb2Nlc3MsIGJlIGNhcmVmdWwgdG9cbiAgLy8gbm90IHRocm93IGFuIEVycm9yIG9iamVjdCB3aGljaCBjb3VsZCBiZSBjYXB0dXJlZCBieSBjaGlsZC1SZWFsbSBjb2RlIGFuZFxuICAvLyB1c2VkIHRvIGFjY2VzcyB0aGUgKHRvby1wb3dlcmZ1bCkgcHJpbWFsLXJlYWxtIEVycm9yIG9iamVjdC5cblxuICBmdW5jdGlvbiB0aHJvd1RhbnRydW0ocywgZXJyID0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgbXNnID0gYHBsZWFzZSByZXBvcnQgaW50ZXJuYWwgc2hpbSBlcnJvcjogJHtzfWA7XG5cbiAgICAvLyB3ZSB3YW50IHRvIGxvZyB0aGVzZSAnc2hvdWxkIG5ldmVyIGhhcHBlbicgdGhpbmdzLlxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgIGlmIChlcnIpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLmVycm9yKGAke2Vycn1gKTtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLmVycm9yKGAke2Vyci5zdGFja31gKTtcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZGVidWdnZXJcbiAgICBkZWJ1Z2dlcjtcbiAgICB0aHJvdyBtc2c7XG4gIH1cblxuICBmdW5jdGlvbiBhc3NlcnQoY29uZGl0aW9uLCBtZXNzYWdlKSB7XG4gICAgaWYgKCFjb25kaXRpb24pIHtcbiAgICAgIHRocm93VGFudHJ1bShtZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZW1vdmUgY29kZSBtb2RpZmljYXRpb25zLlxuICBmdW5jdGlvbiBjbGVhbnVwU291cmNlKHNyYykge1xuICAgIHJldHVybiBzcmM7XG4gIH1cblxuICAvLyBidWlsZENoaWxkUmVhbG0gaXMgaW1tZWRpYXRlbHkgdHVybmVkIGludG8gYSBzdHJpbmcsIGFuZCB0aGlzIGZ1bmN0aW9uIGlzXG4gIC8vIG5ldmVyIHJlZmVyZW5jZWQgYWdhaW4sIGJlY2F1c2UgaXQgY2xvc2VzIG92ZXIgdGhlIHdyb25nIGludHJpbnNpY3NcblxuICBmdW5jdGlvbiBidWlsZENoaWxkUmVhbG0odW5zYWZlUmVjLCBCYXNlUmVhbG0pIHtcbiAgICBjb25zdCB7XG4gICAgICBpbml0Um9vdFJlYWxtLFxuICAgICAgaW5pdENvbXBhcnRtZW50LFxuICAgICAgZ2V0UmVhbG1HbG9iYWwsXG4gICAgICByZWFsbUV2YWx1YXRlXG4gICAgfSA9IEJhc2VSZWFsbTtcblxuICAgIC8vIFRoaXMgT2JqZWN0IGFuZCBSZWZsZWN0IGFyZSBicmFuZCBuZXcsIGZyb20gYSBuZXcgdW5zYWZlUmVjLCBzbyBubyB1c2VyXG4gICAgLy8gY29kZSBoYXMgYmVlbiBydW4gb3IgaGFkIGEgY2hhbmNlIHRvIG1hbmlwdWxhdGUgdGhlbS4gV2UgZXh0cmFjdCB0aGVzZVxuICAgIC8vIHByb3BlcnRpZXMgZm9yIGJyZXZpdHksIG5vdCBmb3Igc2VjdXJpdHkuIERvbid0IGV2ZXIgcnVuIHRoaXMgZnVuY3Rpb25cbiAgICAvLyAqYWZ0ZXIqIHVzZXIgY29kZSBoYXMgaGFkIGEgY2hhbmNlIHRvIHBvbGx1dGUgaXRzIGVudmlyb25tZW50LCBvciBpdFxuICAgIC8vIGNvdWxkIGJlIHVzZWQgdG8gZ2FpbiBhY2Nlc3MgdG8gQmFzZVJlYWxtIGFuZCBwcmltYWwtcmVhbG0gRXJyb3JcbiAgICAvLyBvYmplY3RzLlxuICAgIGNvbnN0IHsgY3JlYXRlLCBkZWZpbmVQcm9wZXJ0aWVzIH0gPSBPYmplY3Q7XG5cbiAgICBjb25zdCBlcnJvckNvbnN0cnVjdG9ycyA9IG5ldyBNYXAoW1xuICAgICAgWydFdmFsRXJyb3InLCBFdmFsRXJyb3JdLFxuICAgICAgWydSYW5nZUVycm9yJywgUmFuZ2VFcnJvcl0sXG4gICAgICBbJ1JlZmVyZW5jZUVycm9yJywgUmVmZXJlbmNlRXJyb3JdLFxuICAgICAgWydTeW50YXhFcnJvcicsIFN5bnRheEVycm9yXSxcbiAgICAgIFsnVHlwZUVycm9yJywgVHlwZUVycm9yXSxcbiAgICAgIFsnVVJJRXJyb3InLCBVUklFcnJvcl1cbiAgICBdKTtcblxuICAgIC8vIExpa2UgUmVhbG0uYXBwbHkgZXhjZXB0IHRoYXQgaXQgY2F0Y2hlcyBhbnl0aGluZyB0aHJvd24gYW5kIHJldGhyb3dzIGl0XG4gICAgLy8gYXMgYW4gRXJyb3IgZnJvbSB0aGlzIHJlYWxtXG4gICAgZnVuY3Rpb24gY2FsbEFuZFdyYXBFcnJvcih0YXJnZXQsIC4uLmFyZ3MpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQoLi4uYXJncyk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKE9iamVjdChlcnIpICE9PSBlcnIpIHtcbiAgICAgICAgICAvLyBlcnIgaXMgYSBwcmltaXRpdmUgdmFsdWUsIHdoaWNoIGlzIHNhZmUgdG8gcmV0aHJvd1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZU5hbWUsIGVNZXNzYWdlLCBlU3RhY2s7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gVGhlIGNoaWxkIGVudmlyb25tZW50IG1pZ2h0IHNlZWsgdG8gdXNlICdlcnInIHRvIHJlYWNoIHRoZVxuICAgICAgICAgIC8vIHBhcmVudCdzIGludHJpbnNpY3MgYW5kIGNvcnJ1cHQgdGhlbS4gYCR7ZXJyLm5hbWV9YCB3aWxsIGNhdXNlXG4gICAgICAgICAgLy8gc3RyaW5nIGNvZXJjaW9uIG9mICdlcnIubmFtZScuIElmIGVyci5uYW1lIGlzIGFuIG9iamVjdCAocHJvYmFibHlcbiAgICAgICAgICAvLyBhIFN0cmluZyBvZiB0aGUgcGFyZW50IFJlYWxtKSwgdGhlIGNvZXJjaW9uIHVzZXNcbiAgICAgICAgICAvLyBlcnIubmFtZS50b1N0cmluZygpLCB3aGljaCBpcyB1bmRlciB0aGUgY29udHJvbCBvZiB0aGUgcGFyZW50LiBJZlxuICAgICAgICAgIC8vIGVyci5uYW1lIHdlcmUgYSBwcmltaXRpdmUgKGUuZy4gYSBudW1iZXIpLCBpdCB3b3VsZCB1c2VcbiAgICAgICAgICAvLyBOdW1iZXIudG9TdHJpbmcoZXJyLm5hbWUpLCB1c2luZyB0aGUgY2hpbGQncyB2ZXJzaW9uIG9mIE51bWJlclxuICAgICAgICAgIC8vICh3aGljaCB0aGUgY2hpbGQgY291bGQgbW9kaWZ5IHRvIGNhcHR1cmUgaXRzIGFyZ3VtZW50IGZvciBsYXRlclxuICAgICAgICAgIC8vIHVzZSksIGhvd2V2ZXIgcHJpbWl0aXZlcyBkb24ndCBoYXZlIHByb3BlcnRpZXMgbGlrZSAucHJvdG90eXBlIHNvXG4gICAgICAgICAgLy8gdGhleSBhcmVuJ3QgdXNlZnVsIGZvciBhbiBhdHRhY2suXG4gICAgICAgICAgZU5hbWUgPSBgJHtlcnIubmFtZX1gO1xuICAgICAgICAgIGVNZXNzYWdlID0gYCR7ZXJyLm1lc3NhZ2V9YDtcbiAgICAgICAgICBlU3RhY2sgPSBgJHtlcnIuc3RhY2sgfHwgZU1lc3NhZ2V9YDtcbiAgICAgICAgICAvLyBlTmFtZS9lTWVzc2FnZS9lU3RhY2sgYXJlIG5vdyBjaGlsZC1yZWFsbSBwcmltaXRpdmUgc3RyaW5ncywgYW5kXG4gICAgICAgICAgLy8gc2FmZSB0byBleHBvc2VcbiAgICAgICAgfSBjYXRjaCAoaWdub3JlZCkge1xuICAgICAgICAgIC8vIGlmIGVyci5uYW1lLnRvU3RyaW5nKCkgdGhyb3dzLCBrZWVwIHRoZSAocGFyZW50IHJlYWxtKSBFcnJvciBhd2F5XG4gICAgICAgICAgLy8gZnJvbSB0aGUgY2hpbGRcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gZXJyb3InKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBFcnJvckNvbnN0cnVjdG9yID0gZXJyb3JDb25zdHJ1Y3RvcnMuZ2V0KGVOYW1lKSB8fCBFcnJvcjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3JDb25zdHJ1Y3RvcihlTWVzc2FnZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjIpIHtcbiAgICAgICAgICBlcnIyLnN0YWNrID0gZVN0YWNrOyAvLyByZXBsYWNlIHdpdGggdGhlIGNhcHR1cmVkIGlubmVyIHN0YWNrXG4gICAgICAgICAgdGhyb3cgZXJyMjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNsYXNzIFJlYWxtIHtcbiAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvLyBUaGUgUmVhbG0gY29uc3RydWN0b3IgaXMgbm90IGludGVuZGVkIHRvIGJlIHVzZWQgd2l0aCB0aGUgbmV3IG9wZXJhdG9yXG4gICAgICAgIC8vIG9yIHRvIGJlIHN1YmNsYXNzZWQuIEl0IG1heSBiZSB1c2VkIGFzIHRoZSB2YWx1ZSBvZiBhbiBleHRlbmRzIGNsYXVzZVxuICAgICAgICAvLyBvZiBhIGNsYXNzIGRlZmluaXRpb24gYnV0IGEgc3VwZXIgY2FsbCB0byB0aGUgUmVhbG0gY29uc3RydWN0b3Igd2lsbFxuICAgICAgICAvLyBjYXVzZSBhbiBleGNlcHRpb24uXG5cbiAgICAgICAgLy8gV2hlbiBSZWFsbSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgYW4gZXhjZXB0aW9uIGlzIGFsc28gcmFpc2VkIGJlY2F1c2VcbiAgICAgICAgLy8gYSBjbGFzcyBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgaW52b2tlZCB3aXRob3V0ICduZXcnLlxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWFsbSBpcyBub3QgYSBjb25zdHJ1Y3RvcicpO1xuICAgICAgfVxuXG4gICAgICBzdGF0aWMgbWFrZVJvb3RSZWFsbShvcHRpb25zID0ge30pIHtcbiAgICAgICAgLy8gVGhpcyBpcyB0aGUgZXhwb3NlZCBpbnRlcmZhY2UuXG5cbiAgICAgICAgLy8gQnlwYXNzIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgICAgY29uc3QgciA9IGNyZWF0ZShSZWFsbS5wcm90b3R5cGUpO1xuICAgICAgICBjYWxsQW5kV3JhcEVycm9yKGluaXRSb290UmVhbG0sIHVuc2FmZVJlYywgciwgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiByO1xuICAgICAgfVxuXG4gICAgICBzdGF0aWMgbWFrZUNvbXBhcnRtZW50KG9wdGlvbnMgPSB7fSkge1xuICAgICAgICAvLyBCeXBhc3MgdGhlIGNvbnN0cnVjdG9yLlxuICAgICAgICBjb25zdCByID0gY3JlYXRlKFJlYWxtLnByb3RvdHlwZSk7XG4gICAgICAgIGNhbGxBbmRXcmFwRXJyb3IoaW5pdENvbXBhcnRtZW50LCB1bnNhZmVSZWMsIHIsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gcjtcbiAgICAgIH1cblxuICAgICAgLy8gd2Ugb21pdCB0aGUgY29uc3RydWN0b3IgYmVjYXVzZSBpdCBpcyBlbXB0eS4gQWxsIHRoZSBwZXJzb25hbGl6YXRpb25cbiAgICAgIC8vIHRha2VzIHBsYWNlIGluIG9uZSBvZiB0aGUgdHdvIHN0YXRpYyBtZXRob2RzLFxuICAgICAgLy8gbWFrZVJvb3RSZWFsbS9tYWtlQ29tcGFydG1lbnRcblxuICAgICAgZ2V0IGdsb2JhbCgpIHtcbiAgICAgICAgLy8gdGhpcyBpcyBzYWZlIGFnYWluc3QgYmVpbmcgY2FsbGVkIHdpdGggc3RyYW5nZSAndGhpcycgYmVjYXVzZVxuICAgICAgICAvLyBiYXNlR2V0R2xvYmFsIGltbWVkaWF0ZWx5IGRvZXMgYSB0cmFkZW1hcmsgY2hlY2sgKGl0IGZhaWxzIHVubGVzc1xuICAgICAgICAvLyB0aGlzICd0aGlzJyBpcyBwcmVzZW50IGluIGEgd2Vha21hcCB0aGF0IGlzIG9ubHkgcG9wdWxhdGVkIHdpdGhcbiAgICAgICAgLy8gbGVnaXRpbWF0ZSBSZWFsbSBpbnN0YW5jZXMpXG4gICAgICAgIHJldHVybiBjYWxsQW5kV3JhcEVycm9yKGdldFJlYWxtR2xvYmFsLCB0aGlzKTtcbiAgICAgIH1cblxuICAgICAgZXZhbHVhdGUoeCwgZW5kb3dtZW50cywgb3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIC8vIHNhZmUgYWdhaW5zdCBzdHJhbmdlICd0aGlzJywgYXMgYWJvdmVcbiAgICAgICAgcmV0dXJuIGNhbGxBbmRXcmFwRXJyb3IocmVhbG1FdmFsdWF0ZSwgdGhpcywgeCwgZW5kb3dtZW50cywgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGVmaW5lUHJvcGVydGllcyhSZWFsbSwge1xuICAgICAgdG9TdHJpbmc6IHtcbiAgICAgICAgdmFsdWU6ICgpID0+ICdmdW5jdGlvbiBSZWFsbSgpIHsgW3NoaW0gY29kZV0gfScsXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZGVmaW5lUHJvcGVydGllcyhSZWFsbS5wcm90b3R5cGUsIHtcbiAgICAgIHRvU3RyaW5nOiB7XG4gICAgICAgIHZhbHVlOiAoKSA9PiAnW29iamVjdCBSZWFsbV0nLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBSZWFsbTtcbiAgfVxuXG4gIC8vIFRoZSBwYXJlbnRoZXNlcyBtZWFucyB3ZSBkb24ndCBiaW5kIHRoZSAnYnVpbGRDaGlsZFJlYWxtJyBuYW1lIGluc2lkZSB0aGVcbiAgLy8gY2hpbGQncyBuYW1lc3BhY2UuIHRoaXMgd291bGQgYWNjZXB0IGFuIGFub255bW91cyBmdW5jdGlvbiBkZWNsYXJhdGlvbi5cbiAgLy8gZnVuY3Rpb24gZXhwcmVzc2lvbiAobm90IGEgZGVjbGFyYXRpb24pIHNvIGl0IGhhcyBhIGNvbXBsZXRpb24gdmFsdWUuXG4gIGNvbnN0IGJ1aWxkQ2hpbGRSZWFsbVN0cmluZyA9IGNsZWFudXBTb3VyY2UoXG4gICAgYCd1c2Ugc3RyaWN0JzsgKCR7YnVpbGRDaGlsZFJlYWxtfSlgXG4gICk7XG5cbiAgZnVuY3Rpb24gY3JlYXRlUmVhbG1GYWNhZGUodW5zYWZlUmVjLCBCYXNlUmVhbG0pIHtcbiAgICBjb25zdCB7IHVuc2FmZUV2YWwgfSA9IHVuc2FmZVJlYztcblxuICAgIC8vIFRoZSBCYXNlUmVhbG0gaXMgdGhlIFJlYWxtIGNsYXNzIGNyZWF0ZWQgYnlcbiAgICAvLyB0aGUgc2hpbS4gSXQncyBvbmx5IHZhbGlkIGZvciB0aGUgY29udGV4dCB3aGVyZVxuICAgIC8vIGl0IHdhcyBwYXJzZWQuXG5cbiAgICAvLyBUaGUgUmVhbG0gZmFjYWRlIGlzIGEgbGlnaHR3ZWlnaHQgY2xhc3MgYnVpbHQgaW4gdGhlXG4gICAgLy8gY29udGV4dCBhIGRpZmZlcmVudCBjb250ZXh0LCB0aGF0IHByb3ZpZGUgYSBmdWxseVxuICAgIC8vIGZ1bmN0aW9uYWwgUmVhbG0gY2xhc3MgdXNpbmcgdGhlIGludHJpc2ljc1xuICAgIC8vIG9mIHRoYXQgY29udGV4dC5cblxuICAgIC8vIFRoaXMgcHJvY2VzcyBpcyBzaW1wbGlmaWVkIGJlY2F1c2UgYWxsIG1ldGhvZHNcbiAgICAvLyBhbmQgcHJvcGVydGllcyBvbiBhIHJlYWxtIGluc3RhbmNlIGFscmVhZHkgcmV0dXJuXG4gICAgLy8gdmFsdWVzIHVzaW5nIHRoZSBpbnRyaW5zaWNzIG9mIHRoZSByZWFsbSdzIGNvbnRleHQuXG5cbiAgICAvLyBJbnZva2UgdGhlIEJhc2VSZWFsbSBjb25zdHJ1Y3RvciB3aXRoIFJlYWxtIGFzIHRoZSBwcm90b3R5cGUuXG4gICAgcmV0dXJuIHVuc2FmZUV2YWwoYnVpbGRDaGlsZFJlYWxtU3RyaW5nKSh1bnNhZmVSZWMsIEJhc2VSZWFsbSk7XG4gIH1cblxuICAvLyBEZWNsYXJlIHNob3J0aGFuZCBmdW5jdGlvbnMuIFNoYXJpbmcgdGhlc2UgZGVjbGFyYXRpb25zIGFjcm9zcyBtb2R1bGVzXG4gIC8vIGltcHJvdmVzIGJvdGggY29uc2lzdGVuY3kgYW5kIG1pbmlmaWNhdGlvbi4gVW51c2VkIGRlY2xhcmF0aW9ucyBhcmVcbiAgLy8gZHJvcHBlZCBieSB0aGUgdHJlZSBzaGFraW5nIHByb2Nlc3MuXG5cbiAgLy8gd2UgY2FwdHVyZSB0aGVzZSwgbm90IGp1c3QgZm9yIGJyZXZpdHksIGJ1dCBmb3Igc2VjdXJpdHkuIElmIGFueSBjb2RlXG4gIC8vIG1vZGlmaWVzIE9iamVjdCB0byBjaGFuZ2Ugd2hhdCAnYXNzaWduJyBwb2ludHMgdG8sIHRoZSBSZWFsbSBzaGltIHdvdWxkIGJlXG4gIC8vIGNvcnJ1cHRlZC5cblxuICBjb25zdCB7XG4gICAgYXNzaWduLFxuICAgIGNyZWF0ZSxcbiAgICBmcmVlemUsXG4gICAgZGVmaW5lUHJvcGVydGllcywgLy8gT2JqZWN0LmRlZmluZVByb3BlcnR5IGlzIGFsbG93ZWQgdG8gZmFpbFxuICAgIC8vIHNpbGVudGx0eSwgdXNlIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzIGluc3RlYWQuXG4gICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcnMsXG4gICAgZ2V0T3duUHJvcGVydHlOYW1lcyxcbiAgICBnZXRQcm90b3R5cGVPZixcbiAgICBzZXRQcm90b3R5cGVPZlxuICB9ID0gT2JqZWN0O1xuXG4gIGNvbnN0IHtcbiAgICBhcHBseSxcbiAgICBvd25LZXlzIC8vIFJlZmxlY3Qub3duS2V5cyBpbmNsdWRlcyBTeW1ib2xzIGFuZCB1bmVudW1lcmFibGVzLFxuICAgIC8vIHVubGlrZSBPYmplY3Qua2V5cygpXG4gIH0gPSBSZWZsZWN0O1xuXG4gIC8qKlxuICAgKiB1bmN1cnJ5VGhpcygpIFNlZVxuICAgKiBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1jb252ZW50aW9uczpzYWZlX21ldGFfcHJvZ3JhbW1pbmdcbiAgICogd2hpY2ggb25seSBsaXZlcyBhdFxuICAgKiBodHRwOi8vd2ViLmFyY2hpdmUub3JnL3dlYi8yMDE2MDgwNTIyNTcxMC9odHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1jb252ZW50aW9uczpzYWZlX21ldGFfcHJvZ3JhbW1pbmdcbiAgICpcbiAgICogUGVyZm9ybWFuY2U6XG4gICAqIDEuIFRoZSBuYXRpdmUgY2FsbCBpcyBhYm91dCAxMHggZmFzdGVyIG9uIEZGIHRoYW4gY2hyb21lXG4gICAqIDIuIFRoZSB2ZXJzaW9uIHVzaW5nIEZ1bmN0aW9uLmJpbmQoKSBpcyBhYm91dCAxMDB4IHNsb3dlciBvbiBGRixcbiAgICogICAgZXF1YWwgb24gY2hyb21lLCAyeCBzbG93ZXIgb24gU2FmYXJpXG4gICAqIDMuIFRoZSB2ZXJzaW9uIHVzaW5nIGEgc3ByZWFkIGFuZCBSZWZsZWN0LmFwcGx5KCkgaXMgYWJvdXQgMTB4XG4gICAqICAgIHNsb3dlciBvbiBGRiwgZXF1YWwgb24gY2hyb21lLCAyeCBzbG93ZXIgb24gU2FmYXJpXG4gICAqXG4gICAqIGNvbnN0IGJpbmQgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZDtcbiAgICogY29uc3QgdW5jdXJyeVRoaXMgPSBiaW5kLmJpbmQoYmluZC5jYWxsKTtcbiAgICovXG4gIGNvbnN0IHVuY3VycnlUaGlzID0gZm4gPT4gKHRoaXNBcmcsIC4uLmFyZ3MpID0+IGFwcGx5KGZuLCB0aGlzQXJnLCBhcmdzKTtcblxuICAvLyBXZSBhbHNvIGNhcHR1cmUgdGhlc2UgZm9yIHNlY3VyaXR5OiBjaGFuZ2VzIHRvIEFycmF5LnByb3RvdHlwZSBhZnRlciB0aGVcbiAgLy8gUmVhbG0gc2hpbSBydW5zIHNob3VsZG4ndCBhZmZlY3Qgc3Vic2VxdWVudCBSZWFsbSBvcGVyYXRpb25zLlxuICBjb25zdCBvYmplY3RIYXNPd25Qcm9wZXJ0eSA9IHVuY3VycnlUaGlzKFxuICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAgICksXG4gICAgYXJyYXlGaWx0ZXIgPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUuZmlsdGVyKSxcbiAgICBhcnJheVBvcCA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5wb3ApLFxuICAgIGFycmF5Sm9pbiA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5qb2luKSxcbiAgICBhcnJheUNvbmNhdCA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5jb25jYXQpLFxuICAgIHJlZ2V4cFRlc3QgPSB1bmN1cnJ5VGhpcyhSZWdFeHAucHJvdG90eXBlLnRlc3QpLFxuICAgIHN0cmluZ0luY2x1ZGVzID0gdW5jdXJyeVRoaXMoU3RyaW5nLnByb3RvdHlwZS5pbmNsdWRlcyk7XG5cbiAgLy8gVGhlc2UgdmFsdWUgcHJvcGVydGllcyBvZiB0aGUgZ2xvYmFsIG9iamVjdCBhcmUgbm9uLXdyaXRhYmxlLFxuICAvLyBub24tY29uZmlndXJhYmxlIGRhdGEgcHJvcGVydGllcy5cbiAgY29uc3QgZnJvemVuR2xvYmFsUHJvcGVydHlOYW1lcyA9IFtcbiAgICAvLyAqKiogMTguMSBWYWx1ZSBQcm9wZXJ0aWVzIG9mIHRoZSBHbG9iYWwgT2JqZWN0XG5cbiAgICAnSW5maW5pdHknLFxuICAgICdOYU4nLFxuICAgICd1bmRlZmluZWQnXG4gIF07XG5cbiAgLy8gQWxsIHRoZSBmb2xsb3dpbmcgc3RkbGliIGl0ZW1zIGhhdmUgdGhlIHNhbWUgbmFtZSBvbiBib3RoIG91ciBpbnRyaW5zaWNzXG4gIC8vIG9iamVjdCBhbmQgb24gdGhlIGdsb2JhbCBvYmplY3QuIFVubGlrZSBJbmZpbml0eS9OYU4vdW5kZWZpbmVkLCB0aGVzZVxuICAvLyBzaG91bGQgYWxsIGJlIHdyaXRhYmxlIGFuZCBjb25maWd1cmFibGUuIFRoaXMgaXMgZGl2aWRlZCBpbnRvIHR3b1xuICAvLyBzZXRzLiBUaGUgc3RhYmxlIG9uZXMgYXJlIHRob3NlIHRoZSBzaGltIGNhbiBmcmVlemUgZWFybHkgYmVjYXVzZVxuICAvLyB3ZSBkb24ndCBleHBlY3QgYW55b25lIHdpbGwgd2FudCB0byBtdXRhdGUgdGhlbS4gVGhlIHVuc3RhYmxlIG9uZXNcbiAgLy8gYXJlIHRoZSBvbmVzIHRoYXQgd2UgY29ycmVjdGx5IGluaXRpYWxpemUgdG8gd3JpdGFibGUgYW5kXG4gIC8vIGNvbmZpZ3VyYWJsZSBzbyB0aGF0IHRoZXkgY2FuIHN0aWxsIGJlIHJlcGxhY2VkIG9yIHJlbW92ZWQuXG4gIGNvbnN0IHN0YWJsZUdsb2JhbFByb3BlcnR5TmFtZXMgPSBbXG4gICAgLy8gKioqIDE4LjIgRnVuY3Rpb24gUHJvcGVydGllcyBvZiB0aGUgR2xvYmFsIE9iamVjdFxuXG4gICAgLy8gJ2V2YWwnLCAvLyBjb21lcyBmcm9tIHNhZmVFdmFsIGluc3RlYWRcbiAgICAnaXNGaW5pdGUnLFxuICAgICdpc05hTicsXG4gICAgJ3BhcnNlRmxvYXQnLFxuICAgICdwYXJzZUludCcsXG5cbiAgICAnZGVjb2RlVVJJJyxcbiAgICAnZGVjb2RlVVJJQ29tcG9uZW50JyxcbiAgICAnZW5jb2RlVVJJJyxcbiAgICAnZW5jb2RlVVJJQ29tcG9uZW50JyxcblxuICAgIC8vICoqKiAxOC4zIENvbnN0cnVjdG9yIFByb3BlcnRpZXMgb2YgdGhlIEdsb2JhbCBPYmplY3RcblxuICAgICdBcnJheScsXG4gICAgJ0FycmF5QnVmZmVyJyxcbiAgICAnQm9vbGVhbicsXG4gICAgJ0RhdGFWaWV3JyxcbiAgICAvLyAnRGF0ZScsICAvLyBVbnN0YWJsZVxuICAgIC8vICdFcnJvcicsICAvLyBVbnN0YWJsZVxuICAgICdFdmFsRXJyb3InLFxuICAgICdGbG9hdDMyQXJyYXknLFxuICAgICdGbG9hdDY0QXJyYXknLFxuICAgIC8vICdGdW5jdGlvbicsICAvLyBjb21lcyBmcm9tIHNhZmVGdW5jdGlvbiBpbnN0ZWFkXG4gICAgJ0ludDhBcnJheScsXG4gICAgJ0ludDE2QXJyYXknLFxuICAgICdJbnQzMkFycmF5JyxcbiAgICAnTWFwJyxcbiAgICAnTnVtYmVyJyxcbiAgICAnT2JqZWN0JyxcbiAgICAvLyAnUHJvbWlzZScsICAvLyBVbnN0YWJsZVxuICAgIC8vICdQcm94eScsICAvLyBVbnN0YWJsZVxuICAgICdSYW5nZUVycm9yJyxcbiAgICAnUmVmZXJlbmNlRXJyb3InLFxuICAgIC8vICdSZWdFeHAnLCAgLy8gVW5zdGFibGVcbiAgICAnU2V0JyxcbiAgICAvLyAnU2hhcmVkQXJyYXlCdWZmZXInICAvLyByZW1vdmVkIG9uIEphbiA1LCAyMDE4XG4gICAgJ1N0cmluZycsXG4gICAgJ1N5bWJvbCcsXG4gICAgJ1N5bnRheEVycm9yJyxcbiAgICAnVHlwZUVycm9yJyxcbiAgICAnVWludDhBcnJheScsXG4gICAgJ1VpbnQ4Q2xhbXBlZEFycmF5JyxcbiAgICAnVWludDE2QXJyYXknLFxuICAgICdVaW50MzJBcnJheScsXG4gICAgJ1VSSUVycm9yJyxcbiAgICAnV2Vha01hcCcsXG4gICAgJ1dlYWtTZXQnLFxuXG4gICAgLy8gKioqIDE4LjQgT3RoZXIgUHJvcGVydGllcyBvZiB0aGUgR2xvYmFsIE9iamVjdFxuXG4gICAgLy8gJ0F0b21pY3MnLCAvLyByZW1vdmVkIG9uIEphbiA1LCAyMDE4XG4gICAgJ0pTT04nLFxuICAgICdNYXRoJyxcbiAgICAnUmVmbGVjdCcsXG5cbiAgICAvLyAqKiogQW5uZXggQlxuXG4gICAgJ2VzY2FwZScsXG4gICAgJ3VuZXNjYXBlJ1xuXG4gICAgLy8gKioqIEVDTUEtNDAyXG5cbiAgICAvLyAnSW50bCcgIC8vIFVuc3RhYmxlXG5cbiAgICAvLyAqKiogRVNOZXh0XG5cbiAgICAvLyAnUmVhbG0nIC8vIENvbWVzIGZyb20gY3JlYXRlUmVhbG1HbG9iYWxPYmplY3QoKVxuICBdO1xuXG4gIGNvbnN0IHVuc3RhYmxlR2xvYmFsUHJvcGVydHlOYW1lcyA9IFtcbiAgICAnRGF0ZScsXG4gICAgJ0Vycm9yJyxcbiAgICAnUHJvbWlzZScsXG4gICAgJ1Byb3h5JyxcbiAgICAnUmVnRXhwJyxcbiAgICAnSW50bCdcbiAgXTtcblxuICBmdW5jdGlvbiBnZXRTaGFyZWRHbG9iYWxEZXNjcyh1bnNhZmVHbG9iYWwpIHtcbiAgICBjb25zdCBkZXNjcmlwdG9ycyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gZGVzY3JpYmUobmFtZXMsIHdyaXRhYmxlLCBlbnVtZXJhYmxlLCBjb25maWd1cmFibGUpIHtcbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBuYW1lcykge1xuICAgICAgICBjb25zdCBkZXNjID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHVuc2FmZUdsb2JhbCwgbmFtZSk7XG4gICAgICAgIGlmIChkZXNjKSB7XG4gICAgICAgICAgLy8gQWJvcnQgaWYgYW4gYWNjZXNzb3IgaXMgZm91bmQgb24gdGhlIHVuc2FmZSBnbG9iYWwgb2JqZWN0XG4gICAgICAgICAgLy8gaW5zdGVhZCBvZiBhIGRhdGEgcHJvcGVydHkuIFdlIHNob3VsZCBuZXZlciBnZXQgaW50byB0aGlzXG4gICAgICAgICAgLy8gbm9uIHN0YW5kYXJkIHNpdHVhdGlvbi5cbiAgICAgICAgICBhc3NlcnQoXG4gICAgICAgICAgICAndmFsdWUnIGluIGRlc2MsXG4gICAgICAgICAgICBgdW5leHBlY3RlZCBhY2Nlc3NvciBvbiBnbG9iYWwgcHJvcGVydHk6ICR7bmFtZX1gXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGRlc2NyaXB0b3JzW25hbWVdID0ge1xuICAgICAgICAgICAgdmFsdWU6IGRlc2MudmFsdWUsXG4gICAgICAgICAgICB3cml0YWJsZSxcbiAgICAgICAgICAgIGVudW1lcmFibGUsXG4gICAgICAgICAgICBjb25maWd1cmFibGVcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGVzY3JpYmUoZnJvemVuR2xvYmFsUHJvcGVydHlOYW1lcywgZmFsc2UsIGZhbHNlLCBmYWxzZSk7XG4gICAgLy8gVGhlIGZvbGxvd2luZyBpcyBjb3JyZWN0IGJ1dCBleHBlbnNpdmUuXG4gICAgLy8gZGVzY3JpYmUoc3RhYmxlR2xvYmFsUHJvcGVydHlOYW1lcywgdHJ1ZSwgZmFsc2UsIHRydWUpO1xuICAgIC8vIEluc3RlYWQsIGZvciBub3csIHdlIGxldCB0aGVzZSBnZXQgb3B0aW1pemVkLlxuICAgIC8vXG4gICAgLy8gVE9ETzogV2Ugc2hvdWxkIHByb3ZpZGUgYW4gb3B0aW9uIHRvIHR1cm4gdGhpcyBvcHRpbWl6YXRpb24gb2ZmLFxuICAgIC8vIGJ5IGZlZWRpbmcgXCJ0cnVlLCBmYWxzZSwgdHJ1ZVwiIGhlcmUgaW5zdGVhZC5cbiAgICBkZXNjcmliZShzdGFibGVHbG9iYWxQcm9wZXJ0eU5hbWVzLCBmYWxzZSwgZmFsc2UsIGZhbHNlKTtcbiAgICAvLyBUaGVzZSB3ZSBrZWVwIHJlcGxhY2VhYmxlIGFuZCByZW1vdmFibGUsIGJlY2F1c2Ugd2UgZXhwZWN0XG4gICAgLy8gb3RoZXJzLCBlLmcuLCBTRVMsIG1heSB3YW50IHRvIGRvIHNvLlxuICAgIGRlc2NyaWJlKHVuc3RhYmxlR2xvYmFsUHJvcGVydHlOYW1lcywgdHJ1ZSwgZmFsc2UsIHRydWUpO1xuXG4gICAgcmV0dXJuIGRlc2NyaXB0b3JzO1xuICB9XG5cbiAgLy8gQWRhcHRlZCBmcm9tIFNFUy9DYWphIC0gQ29weXJpZ2h0IChDKSAyMDExIEdvb2dsZSBJbmMuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvY2FqYS9ibG9iL21hc3Rlci9zcmMvY29tL2dvb2dsZS9jYWphL3Nlcy9zdGFydFNFUy5qc1xuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2NhamEvYmxvYi9tYXN0ZXIvc3JjL2NvbS9nb29nbGUvY2FqYS9zZXMvcmVwYWlyRVM1LmpzXG5cbiAgLyoqXG4gICAqIFJlcGxhY2UgdGhlIGxlZ2FjeSBhY2Nlc3NvcnMgb2YgT2JqZWN0IHRvIGNvbXBseSB3aXRoIHN0cmljdCBtb2RlXG4gICAqIGFuZCBFUzIwMTYgc2VtYW50aWNzLCB3ZSBkbyB0aGlzIGJ5IHJlZGVmaW5pbmcgdGhlbSB3aGlsZSBpbiAndXNlIHN0cmljdCcuXG4gICAqXG4gICAqIHRvZG86IGxpc3QgdGhlIGlzc3VlcyByZXNvbHZlZFxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGluIHR3byB3YXlzOiAoMSkgaW52b2tlZCBkaXJlY3RseSB0byBmaXggdGhlIHByaW1hbFxuICAgKiByZWFsbSdzIE9iamVjdC5wcm90b3R5cGUsIGFuZCAoMikgY29udmVydGVkIHRvIGEgc3RyaW5nIHRvIGJlIGV4ZWN1dGVkXG4gICAqIGluc2lkZSBlYWNoIG5ldyBSb290UmVhbG0gdG8gZml4IHRoZWlyIE9iamVjdC5wcm90b3R5cGVzLiBFdmFsdWF0aW9uIHJlcXVpcmVzXG4gICAqIHRoZSBmdW5jdGlvbiB0byBoYXZlIG5vIGRlcGVuZGVuY2llcywgc28gZG9uJ3QgaW1wb3J0IGFueXRoaW5nIGZyb21cbiAgICogdGhlIG91dHNpZGUuXG4gICAqL1xuXG4gIC8vIHRvZG86IHRoaXMgZmlsZSBzaG91bGQgYmUgbW92ZWQgb3V0IHRvIGEgc2VwYXJhdGUgcmVwbyBhbmQgbnBtIG1vZHVsZS5cbiAgZnVuY3Rpb24gcmVwYWlyQWNjZXNzb3JzKCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGRlZmluZVByb3BlcnR5LFxuICAgICAgZGVmaW5lUHJvcGVydGllcyxcbiAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICAgIGdldFByb3RvdHlwZU9mLFxuICAgICAgcHJvdG90eXBlOiBvYmplY3RQcm90b3R5cGVcbiAgICB9ID0gT2JqZWN0O1xuXG4gICAgLy8gT24gc29tZSBwbGF0Zm9ybXMsIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGVzZSBmdW5jdGlvbnMgYWN0IGFzXG4gICAgLy8gaWYgdGhleSBhcmUgaW4gc2xvcHB5IG1vZGU6IGlmIHRoZXkncmUgaW52b2tlZCBiYWRseSwgdGhleSB3aWxsXG4gICAgLy8gZXhwb3NlIHRoZSBnbG9iYWwgb2JqZWN0LCBzbyB3ZSBuZWVkIHRvIHJlcGFpciB0aGVzZSBmb3JcbiAgICAvLyBzZWN1cml0eS4gVGh1cyBpdCBpcyBvdXIgcmVzcG9uc2liaWxpdHkgdG8gZml4IHRoaXMsIGFuZCB3ZSBuZWVkXG4gICAgLy8gdG8gaW5jbHVkZSByZXBhaXJBY2Nlc3NvcnMuIEUuZy4gQ2hyb21lIGluIDIwMTYuXG5cbiAgICB0cnkge1xuICAgICAgLy8gVmVyaWZ5IHRoYXQgdGhlIG1ldGhvZCBpcyBub3QgY2FsbGFibGUuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1wcm9wZXJ0aWVzLCBuby11bmRlcnNjb3JlLWRhbmdsZVxuICAgICAgKDAsIG9iamVjdFByb3RvdHlwZS5fX2xvb2t1cEdldHRlcl9fKSgneCcpO1xuICAgIH0gY2F0Y2ggKGlnbm9yZSkge1xuICAgICAgLy8gVGhyb3dzLCBubyBuZWVkIHRvIHBhdGNoLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvT2JqZWN0KG9iaikge1xuICAgICAgaWYgKG9iaiA9PT0gdW5kZWZpbmVkIHx8IG9iaiA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBjYW4ndCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdGApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIE9iamVjdChvYmopO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzUHJvcGVydHlOYW1lKG9iaikge1xuICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdzeW1ib2wnKSB7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgICB9XG4gICAgICByZXR1cm4gYCR7b2JqfWA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYUZ1bmN0aW9uKG9iaiwgYWNjZXNzb3IpIHtcbiAgICAgIGlmICh0eXBlb2Ygb2JqICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcihgaW52YWxpZCAke2FjY2Vzc29yfSB1c2FnZWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG5cbiAgICBkZWZpbmVQcm9wZXJ0aWVzKG9iamVjdFByb3RvdHlwZSwge1xuICAgICAgX19kZWZpbmVHZXR0ZXJfXzoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX19kZWZpbmVHZXR0ZXJfXyhwcm9wLCBmdW5jKSB7XG4gICAgICAgICAgY29uc3QgTyA9IHRvT2JqZWN0KHRoaXMpO1xuICAgICAgICAgIGRlZmluZVByb3BlcnR5KE8sIHByb3AsIHtcbiAgICAgICAgICAgIGdldDogYUZ1bmN0aW9uKGZ1bmMsICdnZXR0ZXInKSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIF9fZGVmaW5lU2V0dGVyX186IHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9fZGVmaW5lU2V0dGVyX18ocHJvcCwgZnVuYykge1xuICAgICAgICAgIGNvbnN0IE8gPSB0b09iamVjdCh0aGlzKTtcbiAgICAgICAgICBkZWZpbmVQcm9wZXJ0eShPLCBwcm9wLCB7XG4gICAgICAgICAgICBzZXQ6IGFGdW5jdGlvbihmdW5jLCAnc2V0dGVyJyksXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBfX2xvb2t1cEdldHRlcl9fOiB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfX2xvb2t1cEdldHRlcl9fKHByb3ApIHtcbiAgICAgICAgICBsZXQgTyA9IHRvT2JqZWN0KHRoaXMpO1xuICAgICAgICAgIHByb3AgPSBhc1Byb3BlcnR5TmFtZShwcm9wKTtcbiAgICAgICAgICBsZXQgZGVzYztcbiAgICAgICAgICB3aGlsZSAoTyAmJiAhKGRlc2MgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoTywgcHJvcCkpKSB7XG4gICAgICAgICAgICBPID0gZ2V0UHJvdG90eXBlT2YoTyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkZXNjICYmIGRlc2MuZ2V0O1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgX19sb29rdXBTZXR0ZXJfXzoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX19sb29rdXBTZXR0ZXJfXyhwcm9wKSB7XG4gICAgICAgICAgbGV0IE8gPSB0b09iamVjdCh0aGlzKTtcbiAgICAgICAgICBwcm9wID0gYXNQcm9wZXJ0eU5hbWUocHJvcCk7XG4gICAgICAgICAgbGV0IGRlc2M7XG4gICAgICAgICAgd2hpbGUgKE8gJiYgIShkZXNjID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE8sIHByb3ApKSkge1xuICAgICAgICAgICAgTyA9IGdldFByb3RvdHlwZU9mKE8pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZGVzYyAmJiBkZXNjLnNldDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gQWRhcHRlZCBmcm9tIFNFUy9DYWphXG4gIC8vIENvcHlyaWdodCAoQykgMjAxMSBHb29nbGUgSW5jLlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2NhamEvYmxvYi9tYXN0ZXIvc3JjL2NvbS9nb29nbGUvY2FqYS9zZXMvc3RhcnRTRVMuanNcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9jYWphL2Jsb2IvbWFzdGVyL3NyYy9jb20vZ29vZ2xlL2NhamEvc2VzL3JlcGFpckVTNS5qc1xuXG4gIC8qKlxuICAgKiBUaGlzIGJsb2NrIHJlcGxhY2VzIHRoZSBvcmlnaW5hbCBGdW5jdGlvbiBjb25zdHJ1Y3RvciwgYW5kIHRoZSBvcmlnaW5hbFxuICAgKiAlR2VuZXJhdG9yRnVuY3Rpb24lICVBc3luY0Z1bmN0aW9uJSBhbmQgJUFzeW5jR2VuZXJhdG9yRnVuY3Rpb24lLCB3aXRoXG4gICAqIHNhZmUgcmVwbGFjZW1lbnRzIHRoYXQgdGhyb3cgaWYgaW52b2tlZC5cbiAgICpcbiAgICogVGhlc2UgYXJlIGFsbCByZWFjaGFibGUgdmlhIHN5bnRheCwgc28gaXQgaXNuJ3Qgc3VmZmljaWVudCB0byBqdXN0XG4gICAqIHJlcGxhY2UgZ2xvYmFsIHByb3BlcnRpZXMgd2l0aCBzYWZlIHZlcnNpb25zLiBPdXIgbWFpbiBnb2FsIGlzIHRvIHByZXZlbnRcbiAgICogYWNjZXNzIHRvIHRoZSBGdW5jdGlvbiBjb25zdHJ1Y3RvciB0aHJvdWdoIHRoZXNlIHN0YXJ0aW5nIHBvaW50cy5cblxuICAgKiBBZnRlciB0aGlzIGJsb2NrIGlzIGRvbmUsIHRoZSBvcmlnaW5hbHMgbXVzdCBubyBsb25nZXIgYmUgcmVhY2hhYmxlLCB1bmxlc3NcbiAgICogYSBjb3B5IGhhcyBiZWVuIG1hZGUsIGFuZCBmdW50aW9ucyBjYW4gb25seSBiZSBjcmVhdGVkIGJ5IHN5bnRheCAodXNpbmcgZXZhbClcbiAgICogb3IgYnkgaW52b2tpbmcgYSBwcmV2aW91c2x5IHNhdmVkIHJlZmVyZW5jZSB0byB0aGUgb3JpZ2luYWxzLlxuICAgKi9cblxuICAvLyB0b2RvOiB0aGlzIGZpbGUgc2hvdWxkIGJlIG1vdmVkIG91dCB0byBhIHNlcGFyYXRlIHJlcG8gYW5kIG5wbSBtb2R1bGUuXG4gIGZ1bmN0aW9uIHJlcGFpckZ1bmN0aW9ucygpIHtcbiAgICBjb25zdCB7IGRlZmluZVByb3BlcnRpZXMsIGdldFByb3RvdHlwZU9mLCBzZXRQcm90b3R5cGVPZiB9ID0gT2JqZWN0O1xuXG4gICAgLyoqXG4gICAgICogVGhlIHByb2Nlc3MgdG8gcmVwYWlyIGNvbnN0cnVjdG9yczpcbiAgICAgKiAxLiBDcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGZ1bmN0aW9uIGJ5IGV2YWx1YXRpbmcgc3ludGF4XG4gICAgICogMi4gT2J0YWluIHRoZSBwcm90b3R5cGUgZnJvbSB0aGUgaW5zdGFuY2VcbiAgICAgKiAzLiBDcmVhdGUgYSBzdWJzdGl0dXRlIHRhbWVkIGNvbnN0cnVjdG9yXG4gICAgICogNC4gUmVwbGFjZSB0aGUgb3JpZ2luYWwgY29uc3RydWN0b3Igd2l0aCB0aGUgdGFtZWQgY29uc3RydWN0b3JcbiAgICAgKiA1LiBSZXBsYWNlIHRhbWVkIGNvbnN0cnVjdG9yIHByb3RvdHlwZSBwcm9wZXJ0eSB3aXRoIHRoZSBvcmlnaW5hbCBvbmVcbiAgICAgKiA2LiBSZXBsYWNlIGl0cyBbW1Byb3RvdHlwZV1dIHNsb3Qgd2l0aCB0aGUgdGFtZWQgY29uc3RydWN0b3Igb2YgRnVuY3Rpb25cbiAgICAgKi9cbiAgICBmdW5jdGlvbiByZXBhaXJGdW5jdGlvbihuYW1lLCBkZWNsYXJhdGlvbikge1xuICAgICAgbGV0IEZ1bmN0aW9uSW5zdGFuY2U7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LWZ1bmNcbiAgICAgICAgRnVuY3Rpb25JbnN0YW5jZSA9ICgwLCBldmFsKShkZWNsYXJhdGlvbik7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmIChlIGluc3RhbmNlb2YgU3ludGF4RXJyb3IpIHtcbiAgICAgICAgICAvLyBQcmV2ZW50IGZhaWx1cmUgb24gcGxhdGZvcm1zIHdoZXJlIGFzeW5jIGFuZC9vciBnZW5lcmF0b3JzXG4gICAgICAgICAgLy8gYXJlIG5vdCBzdXBwb3J0ZWQuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIFJlLXRocm93XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgICBjb25zdCBGdW5jdGlvblByb3RvdHlwZSA9IGdldFByb3RvdHlwZU9mKEZ1bmN0aW9uSW5zdGFuY2UpO1xuXG4gICAgICAvLyBQcmV2ZW50cyB0aGUgZXZhbHVhdGlvbiBvZiBzb3VyY2Ugd2hlbiBjYWxsaW5nIGNvbnN0cnVjdG9yIG9uIHRoZVxuICAgICAgLy8gcHJvdG90eXBlIG9mIGZ1bmN0aW9ucy5cbiAgICAgIGNvbnN0IFRhbWVkRnVuY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTm90IGF2YWlsYWJsZScpO1xuICAgICAgfTtcbiAgICAgIGRlZmluZVByb3BlcnRpZXMoVGFtZWRGdW5jdGlvbiwgeyBuYW1lOiB7IHZhbHVlOiBuYW1lIH0gfSk7XG5cbiAgICAgIC8vIChuZXcgRXJyb3IoKSkuY29uc3RydWN0b3JzIGRvZXMgbm90IGluaGVyaXQgZnJvbSBGdW5jdGlvbiwgYmVjYXVzZSBFcnJvclxuICAgICAgLy8gd2FzIGRlZmluZWQgYmVmb3JlIEVTNiBjbGFzc2VzLiBTbyB3ZSBkb24ndCBuZWVkIHRvIHJlcGFpciBpdCB0b28uXG5cbiAgICAgIC8vIChFcnJvcigpKS5jb25zdHJ1Y3RvciBpbmhlcml0IGZyb20gRnVuY3Rpb24sIHdoaWNoIGdldHMgYSB0YW1lZFxuICAgICAgLy8gY29uc3RydWN0b3IgaGVyZS5cblxuICAgICAgLy8gdG9kbzogaW4gYW4gRVM2IGNsYXNzIHRoYXQgZG9lcyBub3QgaW5oZXJpdCBmcm9tIGFueXRoaW5nLCB3aGF0IGRvZXMgaXRzXG4gICAgICAvLyBjb25zdHJ1Y3RvciBpbmhlcml0IGZyb20/IFdlIHdvcnJ5IHRoYXQgaXQgaW5oZXJpdHMgZnJvbSBGdW5jdGlvbiwgaW5cbiAgICAgIC8vIHdoaWNoIGNhc2UgaW5zdGFuY2VzIGNvdWxkIGdpdmUgYWNjZXNzIHRvIHVuc2FmZUZ1bmN0aW9uLiBtYXJrbSBzYXlzXG4gICAgICAvLyB3ZSdyZSBmaW5lOiB0aGUgY29uc3RydWN0b3IgaW5oZXJpdHMgZnJvbSBPYmplY3QucHJvdG90eXBlXG5cbiAgICAgIC8vIFRoaXMgbGluZSByZXBsYWNlcyB0aGUgb3JpZ2luYWwgY29uc3RydWN0b3IgaW4gdGhlIHByb3RvdHlwZSBjaGFpblxuICAgICAgLy8gd2l0aCB0aGUgdGFtZWQgb25lLiBObyBjb3B5IG9mIHRoZSBvcmlnaW5hbCBpcyBwZXNlcnZlZC5cbiAgICAgIGRlZmluZVByb3BlcnRpZXMoRnVuY3Rpb25Qcm90b3R5cGUsIHtcbiAgICAgICAgY29uc3RydWN0b3I6IHsgdmFsdWU6IFRhbWVkRnVuY3Rpb24gfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFRoaXMgbGluZSBzZXRzIHRoZSB0YW1lZCBjb25zdHJ1Y3RvcidzIHByb3RvdHlwZSBkYXRhIHByb3BlcnR5IHRvXG4gICAgICAvLyB0aGUgb3JpZ2luYWwgb25lLlxuICAgICAgZGVmaW5lUHJvcGVydGllcyhUYW1lZEZ1bmN0aW9uLCB7XG4gICAgICAgIHByb3RvdHlwZTogeyB2YWx1ZTogRnVuY3Rpb25Qcm90b3R5cGUgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChUYW1lZEZ1bmN0aW9uICE9PSBGdW5jdGlvbi5wcm90b3R5cGUuY29uc3RydWN0b3IpIHtcbiAgICAgICAgLy8gRW5zdXJlcyB0aGF0IGFsbCBmdW5jdGlvbnMgbWVldCBcImluc3RhbmNlb2YgRnVuY3Rpb25cIiBpbiBhIHJlYWxtLlxuICAgICAgICBzZXRQcm90b3R5cGVPZihUYW1lZEZ1bmN0aW9uLCBGdW5jdGlvbi5wcm90b3R5cGUuY29uc3RydWN0b3IpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEhlcmUsIHRoZSBvcmRlciBvZiBvcGVyYXRpb24gaXMgaW1wb3J0YW50OiBGdW5jdGlvbiBuZWVkcyB0byBiZSByZXBhaXJlZFxuICAgIC8vIGZpcnN0IHNpbmNlIHRoZSBvdGhlciByZXBhaXJlZCBjb25zdHJ1Y3RvcnMgbmVlZCB0byBpbmhlcml0IGZyb20gdGhlIHRhbWVkXG4gICAgLy8gRnVuY3Rpb24gZnVuY3Rpb24gY29uc3RydWN0b3IuXG5cbiAgICAvLyBub3RlOiB0aGlzIHJlYWxseSB3YW50cyB0byBiZSBwYXJ0IG9mIHRoZSBzdGFuZGFyZCwgYmVjYXVzZSBuZXdcbiAgICAvLyBjb25zdHJ1Y3RvcnMgbWF5IGJlIGFkZGVkIGluIHRoZSBmdXR1cmUsIHJlYWNoYWJsZSBmcm9tIHN5bnRheCwgYW5kIHRoaXNcbiAgICAvLyBsaXN0IG11c3QgYmUgdXBkYXRlZCB0byBtYXRjaC5cblxuICAgIC8vIFwicGxhaW4gYXJyb3cgZnVuY3Rpb25zXCIgaW5oZXJpdCBmcm9tIEZ1bmN0aW9uLnByb3RvdHlwZVxuXG4gICAgcmVwYWlyRnVuY3Rpb24oJ0Z1bmN0aW9uJywgJyhmdW5jdGlvbigpe30pJyk7XG4gICAgcmVwYWlyRnVuY3Rpb24oJ0dlbmVyYXRvckZ1bmN0aW9uJywgJyhmdW5jdGlvbiooKXt9KScpO1xuICAgIHJlcGFpckZ1bmN0aW9uKCdBc3luY0Z1bmN0aW9uJywgJyhhc3luYyBmdW5jdGlvbigpe30pJyk7XG4gICAgcmVwYWlyRnVuY3Rpb24oJ0FzeW5jR2VuZXJhdG9yRnVuY3Rpb24nLCAnKGFzeW5jIGZ1bmN0aW9uKigpe30pJyk7XG4gIH1cblxuICAvLyB0aGlzIG1vZHVsZSBtdXN0IG5ldmVyIGJlIGltcG9ydGFibGUgb3V0c2lkZSB0aGUgUmVhbG0gc2hpbSBpdHNlbGZcblxuICAvLyBBIFwiY29udGV4dFwiIGlzIGEgZnJlc2ggdW5zYWZlIFJlYWxtIGFzIGdpdmVuIHRvIHVzIGJ5IGV4aXN0aW5nIHBsYXRmb3Jtcy5cbiAgLy8gV2UgbmVlZCB0aGlzIHRvIGltcGxlbWVudCB0aGUgc2hpbS4gSG93ZXZlciwgd2hlbiBSZWFsbXMgbGFuZCBmb3IgcmVhbCxcbiAgLy8gdGhpcyBmZWF0dXJlIHdpbGwgYmUgcHJvdmlkZWQgYnkgdGhlIHVuZGVybHlpbmcgZW5naW5lIGluc3RlYWQuXG5cbiAgLy8gbm90ZTogaW4gYSBub2RlIG1vZHVsZSwgdGhlIHRvcC1sZXZlbCAndGhpcycgaXMgbm90IHRoZSBnbG9iYWwgb2JqZWN0XG4gIC8vIChpdCdzICpzb21ldGhpbmcqIGJ1dCB3ZSBhcmVuJ3Qgc3VyZSB3aGF0KSwgaG93ZXZlciBhbiBpbmRpcmVjdCBldmFsIG9mXG4gIC8vICd0aGlzJyB3aWxsIGJlIHRoZSBjb3JyZWN0IGdsb2JhbCBvYmplY3QuXG5cbiAgY29uc3QgdW5zYWZlR2xvYmFsU3JjID0gXCIndXNlIHN0cmljdCc7IHRoaXNcIjtcbiAgY29uc3QgdW5zYWZlR2xvYmFsRXZhbFNyYyA9IGAoMCwgZXZhbCkoXCIndXNlIHN0cmljdCc7IHRoaXNcIilgO1xuXG4gIC8vIFRoaXMgbWV0aG9kIGlzIG9ubHkgZXhwb3J0ZWQgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gIGZ1bmN0aW9uIGNyZWF0ZU5ld1Vuc2FmZUdsb2JhbEZvck5vZGUoKSB7XG4gICAgLy8gTm90ZSB0aGF0IHdlYnBhY2sgYW5kIG90aGVycyB3aWxsIHNoaW0gJ3ZtJyBpbmNsdWRpbmcgdGhlIG1ldGhvZFxuICAgIC8vICdydW5Jbk5ld0NvbnRleHQnLCBzbyB0aGUgcHJlc2VuY2Ugb2Ygdm0gaXMgbm90IGEgdXNlZnVsIGNoZWNrXG5cbiAgICAvLyBUT0RPOiBGaW5kIGEgYmV0dGVyIHRlc3QgdGhhdCB3b3JrcyB3aXRoIGJ1bmRsZXJzXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5ldy1mdW5jXG4gICAgY29uc3QgaXNOb2RlID0gbmV3IEZ1bmN0aW9uKFxuICAgICAgJ3RyeSB7cmV0dXJuIHRoaXM9PT1nbG9iYWx9Y2F0Y2goZSl7cmV0dXJuIGZhbHNlfSdcbiAgICApKCk7XG5cbiAgICBpZiAoIWlzTm9kZSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZ2xvYmFsLXJlcXVpcmVcbiAgICBjb25zdCB2bSA9IHJlcXVpcmUoJ3ZtJyk7XG5cbiAgICAvLyBVc2UgdW5zYWZlR2xvYmFsRXZhbFNyYyB0byBlbnN1cmUgd2UgZ2V0IHRoZSByaWdodCAndGhpcycuXG4gICAgY29uc3QgdW5zYWZlR2xvYmFsID0gdm0ucnVuSW5OZXdDb250ZXh0KHVuc2FmZUdsb2JhbEV2YWxTcmMpO1xuXG4gICAgcmV0dXJuIHVuc2FmZUdsb2JhbDtcbiAgfVxuXG4gIC8vIFRoaXMgbWV0aG9kIGlzIG9ubHkgZXhwb3J0ZWQgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gIGZ1bmN0aW9uIGNyZWF0ZU5ld1Vuc2FmZUdsb2JhbEZvckJyb3dzZXIoKSB7XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGNvbnN0IGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICAgIGlmcmFtZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgIGNvbnN0IHVuc2FmZUdsb2JhbCA9IGlmcmFtZS5jb250ZW50V2luZG93LmV2YWwodW5zYWZlR2xvYmFsU3JjKTtcblxuICAgIC8vIFdlIGtlZXAgdGhlIGlmcmFtZSBhdHRhY2hlZCB0byB0aGUgRE9NIGJlY2F1c2UgcmVtb3ZpbmcgaXRcbiAgICAvLyBjYXVzZXMgaXRzIGdsb2JhbCBvYmplY3QgdG8gbG9zZSBpbnRyaW5zaWNzLCBpdHMgZXZhbCgpXG4gICAgLy8gZnVuY3Rpb24gdG8gZXZhbHVhdGUgY29kZSwgZXRjLlxuXG4gICAgLy8gVE9ETzogY2FuIHdlIHJlbW92ZSBhbmQgZ2FyYmFnZS1jb2xsZWN0IHRoZSBpZnJhbWVzP1xuXG4gICAgcmV0dXJuIHVuc2FmZUdsb2JhbDtcbiAgfVxuXG4gIGNvbnN0IGdldE5ld1Vuc2FmZUdsb2JhbCA9ICgpID0+IHtcbiAgICBjb25zdCBuZXdVbnNhZmVHbG9iYWxGb3JCcm93c2VyID0gY3JlYXRlTmV3VW5zYWZlR2xvYmFsRm9yQnJvd3NlcigpO1xuICAgIGNvbnN0IG5ld1Vuc2FmZUdsb2JhbEZvck5vZGUgPSBjcmVhdGVOZXdVbnNhZmVHbG9iYWxGb3JOb2RlKCk7XG4gICAgaWYgKFxuICAgICAgKCFuZXdVbnNhZmVHbG9iYWxGb3JCcm93c2VyICYmICFuZXdVbnNhZmVHbG9iYWxGb3JOb2RlKSB8fFxuICAgICAgKG5ld1Vuc2FmZUdsb2JhbEZvckJyb3dzZXIgJiYgbmV3VW5zYWZlR2xvYmFsRm9yTm9kZSlcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndW5leHBlY3RlZCBwbGF0Zm9ybSwgdW5hYmxlIHRvIGNyZWF0ZSBSZWFsbScpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3VW5zYWZlR2xvYmFsRm9yQnJvd3NlciB8fCBuZXdVbnNhZmVHbG9iYWxGb3JOb2RlO1xuICB9O1xuXG4gIC8vIFRoZSB1bnNhZmVSZWMgaXMgc2hpbS1zcGVjaWZpYy4gSXQgYWN0cyBhcyB0aGUgbWVjaGFuaXNtIHRvIG9idGFpbiBhIGZyZXNoXG4gIC8vIHNldCBvZiBpbnRyaW5zaWNzIHRvZ2V0aGVyIHdpdGggdGhlaXIgYXNzb2NpYXRlZCBldmFsIGFuZCBGdW5jdGlvblxuICAvLyBldmFsdWF0b3JzLiBUaGVzZSBtdXN0IGJlIHVzZWQgYXMgYSBtYXRjaGVkIHNldCwgc2luY2UgdGhlIGV2YWx1YXRvcnMgYXJlXG4gIC8vIHRpZWQgdG8gYSBzZXQgb2YgaW50cmluc2ljcywgYWthIHRoZSBcInVuZGVuaWFibGVzXCIuIElmIGl0IHdlcmUgcG9zc2libGUgdG9cbiAgLy8gbWl4LWFuZC1tYXRjaCB0aGVtIGZyb20gZGlmZmVyZW50IGNvbnRleHRzLCB0aGF0IHdvdWxkIGVuYWJsZSBzb21lXG4gIC8vIGF0dGFja3MuXG4gIGZ1bmN0aW9uIGNyZWF0ZVVuc2FmZVJlYyh1bnNhZmVHbG9iYWwsIGFsbFNoaW1zID0gW10pIHtcbiAgICBjb25zdCBzaGFyZWRHbG9iYWxEZXNjcyA9IGdldFNoYXJlZEdsb2JhbERlc2NzKHVuc2FmZUdsb2JhbCk7XG5cbiAgICByZXR1cm4gZnJlZXplKHtcbiAgICAgIHVuc2FmZUdsb2JhbCxcbiAgICAgIHNoYXJlZEdsb2JhbERlc2NzLFxuICAgICAgdW5zYWZlRXZhbDogdW5zYWZlR2xvYmFsLmV2YWwsXG4gICAgICB1bnNhZmVGdW5jdGlvbjogdW5zYWZlR2xvYmFsLkZ1bmN0aW9uLFxuICAgICAgYWxsU2hpbXNcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IHJlcGFpckFjY2Vzc29yc1NoaW0gPSBjbGVhbnVwU291cmNlKFxuICAgIGBcInVzZSBzdHJpY3RcIjsgKCR7cmVwYWlyQWNjZXNzb3JzfSkoKTtgXG4gICk7XG4gIGNvbnN0IHJlcGFpckZ1bmN0aW9uc1NoaW0gPSBjbGVhbnVwU291cmNlKFxuICAgIGBcInVzZSBzdHJpY3RcIjsgKCR7cmVwYWlyRnVuY3Rpb25zfSkoKTtgXG4gICk7XG5cbiAgLy8gQ3JlYXRlIGEgbmV3IHVuc2FmZVJlYyBmcm9tIGEgYnJhbmQgbmV3IGNvbnRleHQsIHdpdGggbmV3IGludHJpbnNpY3MgYW5kIGFcbiAgLy8gbmV3IGdsb2JhbCBvYmplY3RcbiAgZnVuY3Rpb24gY3JlYXRlTmV3VW5zYWZlUmVjKGFsbFNoaW1zKSB7XG4gICAgY29uc3QgdW5zYWZlR2xvYmFsID0gZ2V0TmV3VW5zYWZlR2xvYmFsKCk7XG4gICAgdW5zYWZlR2xvYmFsLmV2YWwocmVwYWlyQWNjZXNzb3JzU2hpbSk7XG4gICAgdW5zYWZlR2xvYmFsLmV2YWwocmVwYWlyRnVuY3Rpb25zU2hpbSk7XG4gICAgcmV0dXJuIGNyZWF0ZVVuc2FmZVJlYyh1bnNhZmVHbG9iYWwsIGFsbFNoaW1zKTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIG5ldyB1bnNhZmVSZWMgZnJvbSB0aGUgY3VycmVudCBjb250ZXh0LCB3aGVyZSB0aGUgUmVhbG0gc2hpbSBpc1xuICAvLyBiZWluZyBwYXJzZWQgYW5kIGV4ZWN1dGVkLCBha2EgdGhlIFwiUHJpbWFsIFJlYWxtXCJcbiAgZnVuY3Rpb24gY3JlYXRlQ3VycmVudFVuc2FmZVJlYygpIHtcbiAgICBjb25zdCB1bnNhZmVHbG9iYWwgPSAoMCwgZXZhbCkodW5zYWZlR2xvYmFsU3JjKTtcbiAgICByZXBhaXJBY2Nlc3NvcnMoKTtcbiAgICByZXBhaXJGdW5jdGlvbnMoKTtcbiAgICByZXR1cm4gY3JlYXRlVW5zYWZlUmVjKHVuc2FmZUdsb2JhbCk7XG4gIH1cblxuICAvLyB0b2RvOiB0aGluayBhYm91dCBob3cgdGhpcyBpbnRlcmFjdHMgd2l0aCBlbmRvd21lbnRzLCBjaGVjayBmb3IgY29uZmxpY3RzXG4gIC8vIGJldHdlZW4gdGhlIG5hbWVzIGJlaW5nIG9wdGltaXplZCBhbmQgdGhlIG9uZXMgYWRkZWQgYnkgZW5kb3dtZW50c1xuXG4gIC8qKlxuICAgKiBTaW1wbGlmaWVkIHZhbGlkYXRpb24gb2YgaW5kZW50aWZpZXIgbmFtZXM6IG1heSBvbmx5IGNvbnRhaW4gYWxwaGFudW1lcmljXG4gICAqIGNoYXJhY3RlcnMgKG9yIFwiJFwiIG9yIFwiX1wiKSwgYW5kIG1heSBub3Qgc3RhcnQgd2l0aCBhIGRpZ2l0LiBUaGlzIGlzIHNhZmVcbiAgICogYW5kIGRvZXMgbm90IHJlZHVjZXMgdGhlIGNvbXBhdGliaWxpdHkgb2YgdGhlIHNoaW0uIFRoZSBtb3RpdmF0aW9uIGZvclxuICAgKiB0aGlzIGxpbWl0YXRpb24gd2FzIHRvIGRlY3JlYXNlIHRoZSBjb21wbGV4aXR5IG9mIHRoZSBpbXBsZW1lbnRhdGlvbixcbiAgICogYW5kIHRvIG1haW50YWluIGEgcmVzb25hYmxlIGxldmVsIG9mIHBlcmZvcm1hbmNlLlxuICAgKiBOb3RlOiBcXHcgaXMgZXF1aXZhbGVudCBbYS16QS1aXzAtOV1cbiAgICogU2VlIDExLjYuMSBJZGVudGlmaWVyIE5hbWVzXG4gICAqL1xuICBjb25zdCBpZGVudGlmaWVyUGF0dGVybiA9IC9eW2EtekEtWl8kXVtcXHckXSokLztcblxuICAvKipcbiAgICogSW4gSmF2YVNjcmlwdCB5b3UgY2Fubm90IHVzZSB0aGVzZSByZXNlcnZlZCB3b3JkcyBhcyB2YXJpYWJsZXMuXG4gICAqIFNlZSAxMS42LjEgSWRlbnRpZmllciBOYW1lc1xuICAgKi9cbiAgY29uc3Qga2V5d29yZHMgPSBuZXcgU2V0KFtcbiAgICAvLyAxMS42LjIuMSBLZXl3b3Jkc1xuICAgICdhd2FpdCcsXG4gICAgJ2JyZWFrJyxcbiAgICAnY2FzZScsXG4gICAgJ2NhdGNoJyxcbiAgICAnY2xhc3MnLFxuICAgICdjb25zdCcsXG4gICAgJ2NvbnRpbnVlJyxcbiAgICAnZGVidWdnZXInLFxuICAgICdkZWZhdWx0JyxcbiAgICAnZGVsZXRlJyxcbiAgICAnZG8nLFxuICAgICdlbHNlJyxcbiAgICAnZXhwb3J0JyxcbiAgICAnZXh0ZW5kcycsXG4gICAgJ2ZpbmFsbHknLFxuICAgICdmb3InLFxuICAgICdmdW5jdGlvbicsXG4gICAgJ2lmJyxcbiAgICAnaW1wb3J0JyxcbiAgICAnaW4nLFxuICAgICdpbnN0YW5jZW9mJyxcbiAgICAnbmV3JyxcbiAgICAncmV0dXJuJyxcbiAgICAnc3VwZXInLFxuICAgICdzd2l0Y2gnLFxuICAgICd0aGlzJyxcbiAgICAndGhyb3cnLFxuICAgICd0cnknLFxuICAgICd0eXBlb2YnLFxuICAgICd2YXInLFxuICAgICd2b2lkJyxcbiAgICAnd2hpbGUnLFxuICAgICd3aXRoJyxcbiAgICAneWllbGQnLFxuXG4gICAgLy8gQWxzbyByZXNlcnZlZCB3aGVuIHBhcnNpbmcgc3RyaWN0IG1vZGUgY29kZVxuICAgICdsZXQnLFxuICAgICdzdGF0aWMnLFxuXG4gICAgLy8gMTEuNi4yLjIgRnV0dXJlIFJlc2VydmVkIFdvcmRzXG4gICAgJ2VudW0nLFxuXG4gICAgLy8gQWxzbyByZXNlcnZlZCB3aGVuIHBhcnNpbmcgc3RyaWN0IG1vZGUgY29kZVxuICAgICdpbXBsZW1lbnRzJyxcbiAgICAncGFja2FnZScsXG4gICAgJ3Byb3RlY3RlZCcsXG4gICAgJ2ludGVyZmFjZScsXG4gICAgJ3ByaXZhdGUnLFxuICAgICdwdWJsaWMnLFxuXG4gICAgLy8gUmVzZXJ2ZWQgYnV0IG5vdCBtZW50aW9uZWQgaW4gc3BlY3NcbiAgICAnYXdhaXQnLFxuXG4gICAgJ251bGwnLFxuICAgICd0cnVlJyxcbiAgICAnZmFsc2UnLFxuXG4gICAgJ3RoaXMnLFxuICAgICdhcmd1bWVudHMnXG4gIF0pO1xuXG4gIC8qKlxuICAgKiBnZXRPcHRpbWl6YWJsZUdsb2JhbHMoKVxuICAgKiBXaGF0IHZhcmlhYmxlIG5hbWVzIG1pZ2h0IGl0IGJyaW5nIGludG8gc2NvcGU/IFRoZXNlIGluY2x1ZGUgYWxsXG4gICAqIHByb3BlcnR5IG5hbWVzIHdoaWNoIGNhbiBiZSB2YXJpYWJsZSBuYW1lcywgaW5jbHVkaW5nIHRoZSBuYW1lc1xuICAgKiBvZiBpbmhlcml0ZWQgcHJvcGVydGllcy4gSXQgZXhjbHVkZXMgc3ltYm9scyBhbmQgbmFtZXMgd2hpY2ggYXJlXG4gICAqIGtleXdvcmRzLiBXZSBkcm9wIHN5bWJvbHMgc2FmZWx5LiBDdXJyZW50bHksIHRoaXMgc2hpbSByZWZ1c2VzXG4gICAqIHNlcnZpY2UgaWYgYW55IG9mIHRoZSBuYW1lcyBhcmUga2V5d29yZHMgb3Iga2V5d29yZC1saWtlLiBUaGlzIGlzXG4gICAqIHNhZmUgYW5kIG9ubHkgcHJldmVudCBwZXJmb3JtYW5jZSBvcHRpbWl6YXRpb24uXG4gICAqL1xuICBmdW5jdGlvbiBnZXRPcHRpbWl6YWJsZUdsb2JhbHMoc2FmZUdsb2JhbCkge1xuICAgIGNvbnN0IGRlc2NzID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhzYWZlR2xvYmFsKTtcblxuICAgIC8vIGdldE93blByb3BlcnR5TmFtZXMgZG9lcyBpZ25vcmUgU3ltYm9scyBzbyB3ZSBkb24ndCBuZWVkIHRoaXMgZXh0cmEgY2hlY2s6XG4gICAgLy8gdHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnICYmXG4gICAgY29uc3QgY29uc3RhbnRzID0gYXJyYXlGaWx0ZXIoZ2V0T3duUHJvcGVydHlOYW1lcyhkZXNjcyksIG5hbWUgPT4ge1xuICAgICAgLy8gRW5zdXJlIHdlIGhhdmUgYSB2YWxpZCBpZGVudGlmaWVyLiBXZSB1c2UgcmVnZXhwVGVzdCByYXRoZXIgdGhhblxuICAgICAgLy8gLy4uLy50ZXN0KCkgdG8gZ3VhcmQgYWdhaW5zdCB0aGUgY2FzZSB3aGVyZSBSZWdFeHAgaGFzIGJlZW4gcG9pc29uZWQuXG4gICAgICBpZiAoXG4gICAgICAgIG5hbWUgPT09ICdldmFsJyB8fFxuICAgICAgICBrZXl3b3Jkcy5oYXMobmFtZSkgfHxcbiAgICAgICAgIXJlZ2V4cFRlc3QoaWRlbnRpZmllclBhdHRlcm4sIG5hbWUpXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkZXNjID0gZGVzY3NbbmFtZV07XG4gICAgICByZXR1cm4gKFxuICAgICAgICAvL1xuICAgICAgICAvLyBUaGUgZ2V0dGVycyB3aWxsIG5vdCBoYXZlIC53cml0YWJsZSwgZG9uJ3QgbGV0IHRoZSBmYWxzeW5lc3Mgb2ZcbiAgICAgICAgLy8gJ3VuZGVmaW5lZCcgdHJpY2sgdXM6IHRlc3Qgd2l0aCA9PT0gZmFsc2UsIG5vdCAhIC4gSG93ZXZlciBkZXNjcmlwdG9yc1xuICAgICAgICAvLyBpbmhlcml0IGZyb20gdGhlIChwb3RlbnRpYWxseSBwb2lzb25lZCkgZ2xvYmFsIG9iamVjdCwgc28gd2UgbWlnaHQgc2VlXG4gICAgICAgIC8vIGV4dHJhIHByb3BlcnRpZXMgd2hpY2ggd2VyZW4ndCByZWFsbHkgdGhlcmUuIEFjY2Vzc29yIHByb3BlcnRpZXMgaGF2ZVxuICAgICAgICAvLyAnZ2V0L3NldC9lbnVtZXJhYmxlL2NvbmZpZ3VyYWJsZScsIHdoaWxlIGRhdGEgcHJvcGVydGllcyBoYXZlXG4gICAgICAgIC8vICd2YWx1ZS93cml0YWJsZS9lbnVtZXJhYmxlL2NvbmZpZ3VyYWJsZScuXG4gICAgICAgIGRlc2MuY29uZmlndXJhYmxlID09PSBmYWxzZSAmJlxuICAgICAgICBkZXNjLndyaXRhYmxlID09PSBmYWxzZSAmJlxuICAgICAgICAvL1xuICAgICAgICAvLyBDaGVja3MgZm9yIGRhdGEgcHJvcGVydGllcyBiZWNhdXNlIHRoZXkncmUgdGhlIG9ubHkgb25lcyB3ZSBjYW5cbiAgICAgICAgLy8gb3B0aW1pemUgKGFjY2Vzc29ycyBhcmUgbW9zdCBsaWtlbHkgbm9uLWNvbnN0YW50KS4gRGVzY3JpcHRvcnMgY2FuJ3RcbiAgICAgICAgLy8gY2FuJ3QgaGF2ZSBhY2Nlc3NvcnMgYW5kIHZhbHVlIHByb3BlcnRpZXMgYXQgdGhlIHNhbWUgdGltZSwgdGhlcmVmb3JlXG4gICAgICAgIC8vIHRoaXMgY2hlY2sgaXMgc3VmZmljaWVudC4gVXNpbmcgZXhwbGljaXQgb3duIHByb3BlcnR5IGRlYWwgd2l0aCB0aGVcbiAgICAgICAgLy8gY2FzZSB3aGVyZSBPYmplY3QucHJvdG90eXBlIGhhcyBiZWVuIHBvaXNvbmVkLlxuICAgICAgICBvYmplY3RIYXNPd25Qcm9wZXJ0eShkZXNjLCAndmFsdWUnKVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBjb25zdGFudHM7XG4gIH1cblxuICAvKipcbiAgICogYWx3YXlzVGhyb3dIYW5kbGVyIGlzIGEgcHJveHkgaGFuZGxlciB3aGljaCB0aHJvd3Mgb24gYW55IHRyYXAgY2FsbGVkLlxuICAgKiBJdCdzIG1hZGUgZnJvbSBhIHByb3h5IHdpdGggYSBnZXQgdHJhcCB0aGF0IHRocm93cy4gSXRzIHRhcmdldCBpc1xuICAgKiBhbiBpbW11dGFibGUgKGZyb3plbikgb2JqZWN0IGFuZCBpcyBzYWZlIHRvIHNoYXJlLlxuICAgKi9cbiAgY29uc3QgYWx3YXlzVGhyb3dIYW5kbGVyID0gbmV3IFByb3h5KGZyZWV6ZSh7fSksIHtcbiAgICBnZXQodGFyZ2V0LCBwcm9wKSB7XG4gICAgICB0aHJvd1RhbnRydW0oYHVuZXhwZWN0ZWQgc2NvcGUgaGFuZGxlciB0cmFwIGNhbGxlZDogJHtwcm9wfWApO1xuICAgIH1cbiAgfSk7XG5cbiAgLyoqXG4gICAqIFNjb3BlSGFuZGxlciBtYW5hZ2VzIGEgUHJveHkgd2hpY2ggc2VydmVzIGFzIHRoZSBnbG9iYWwgc2NvcGUgZm9yIHRoZVxuICAgKiBzYWZlRXZhbHVhdG9yIG9wZXJhdGlvbiAodGhlIFByb3h5IGlzIHRoZSBhcmd1bWVudCBvZiBhICd3aXRoJyBiaW5kaW5nKS5cbiAgICogQXMgZGVzY3JpYmVkIGluIGNyZWF0ZVNhZmVFdmFsdWF0b3IoKSwgaXQgaGFzIHNldmVyYWwgZnVuY3Rpb25zOlxuICAgKiAtIGFsbG93IHRoZSB2ZXJ5IGZpcnN0IChhbmQgb25seSB0aGUgdmVyeSBmaXJzdCkgdXNlIG9mICdldmFsJyB0byBtYXAgdG9cbiAgICogICB0aGUgcmVhbCAodW5zYWZlKSBldmFsIGZ1bmN0aW9uLCBzbyBpdCBhY3RzIGFzIGEgJ2RpcmVjdCBldmFsJyBhbmQgY2FuXG4gICAqICAgIGFjY2VzcyBpdHMgbGV4aWNhbCBzY29wZSAod2hpY2ggbWFwcyB0byB0aGUgJ3dpdGgnIGJpbmRpbmcsIHdoaWNoIHRoZVxuICAgKiAgIFNjb3BlSGFuZGxlciBhbHNvIGNvbnRyb2xzKS5cbiAgICogLSBlbnN1cmUgdGhhdCBhbGwgc3Vic2VxdWVudCB1c2VzIG9mICdldmFsJyBtYXAgdG8gdGhlIHNhZmVFdmFsdWF0b3IsXG4gICAqICAgd2hpY2ggbGl2ZXMgYXMgdGhlICdldmFsJyBwcm9wZXJ0eSBvZiB0aGUgc2FmZUdsb2JhbC5cbiAgICogLSByb3V0ZSBhbGwgb3RoZXIgcHJvcGVydHkgbG9va3VwcyBhdCB0aGUgc2FmZUdsb2JhbC5cbiAgICogLSBoaWRlIHRoZSB1bnNhZmVHbG9iYWwgd2hpY2ggbGl2ZXMgb24gdGhlIHNjb3BlIGNoYWluIGFib3ZlIHRoZSAnd2l0aCcuXG4gICAqIC0gZW5zdXJlIHRoZSBQcm94eSBpbnZhcmlhbnRzIGRlc3BpdGUgc29tZSBnbG9iYWwgcHJvcGVydGllcyBiZWluZyBmcm96ZW4uXG4gICAqL1xuICBmdW5jdGlvbiBjcmVhdGVTY29wZUhhbmRsZXIodW5zYWZlUmVjLCBzYWZlR2xvYmFsLCBzbG9wcHlHbG9iYWxzKSB7XG4gICAgY29uc3QgeyB1bnNhZmVHbG9iYWwsIHVuc2FmZUV2YWwgfSA9IHVuc2FmZVJlYztcblxuICAgIC8vIFRoaXMgZmxhZyBhbGxvdyB1cyB0byBkZXRlcm1pbmUgaWYgdGhlIGV2YWwoKSBjYWxsIGlzIGFuIGRvbmUgYnkgdGhlXG4gICAgLy8gcmVhbG0ncyBjb2RlIG9yIGlmIGl0IGlzIHVzZXItbGFuZCBpbnZvY2F0aW9uLCBzbyB3ZSBjYW4gcmVhY3QgZGlmZmVyZW50bHkuXG4gICAgbGV0IHVzZVVuc2FmZUV2YWx1YXRvciA9IGZhbHNlO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC8vIFRoZSBzY29wZSBoYW5kbGVyIHRocm93cyBpZiBhbnkgdHJhcCBvdGhlciB0aGFuIGdldC9zZXQvaGFzIGFyZSBydW5cbiAgICAgIC8vIChlLmcuIGdldE93blByb3BlcnR5RGVzY3JpcHRvcnMsIGFwcGx5LCBnZXRQcm90b3R5cGVPZikuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcHJvdG9cbiAgICAgIF9fcHJvdG9fXzogYWx3YXlzVGhyb3dIYW5kbGVyLFxuXG4gICAgICBhbGxvd1Vuc2FmZUV2YWx1YXRvck9uY2UoKSB7XG4gICAgICAgIHVzZVVuc2FmZUV2YWx1YXRvciA9IHRydWU7XG4gICAgICB9LFxuXG4gICAgICB1bnNhZmVFdmFsdWF0b3JBbGxvd2VkKCkge1xuICAgICAgICByZXR1cm4gdXNlVW5zYWZlRXZhbHVhdG9yO1xuICAgICAgfSxcblxuICAgICAgZ2V0KHRhcmdldCwgcHJvcCkge1xuICAgICAgICAvLyBTcGVjaWFsIHRyZWF0bWVudCBmb3IgZXZhbC4gVGhlIHZlcnkgZmlyc3QgbG9va3VwIG9mICdldmFsJyBnZXRzIHRoZVxuICAgICAgICAvLyB1bnNhZmUgKHJlYWwgZGlyZWN0KSBldmFsLCBzbyBpdCB3aWxsIGdldCB0aGUgbGV4aWNhbCBzY29wZSB0aGF0IHVzZXNcbiAgICAgICAgLy8gdGhlICd3aXRoJyBjb250ZXh0LlxuICAgICAgICBpZiAocHJvcCA9PT0gJ2V2YWwnKSB7XG4gICAgICAgICAgLy8gdGVzdCB0aGF0IGl0IGlzIHRydWUgcmF0aGVyIHRoYW4gbWVyZWx5IHRydXRoeVxuICAgICAgICAgIGlmICh1c2VVbnNhZmVFdmFsdWF0b3IgPT09IHRydWUpIHtcbiAgICAgICAgICAgIC8vIHJldm9rZSBiZWZvcmUgdXNlXG4gICAgICAgICAgICB1c2VVbnNhZmVFdmFsdWF0b3IgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB1bnNhZmVFdmFsO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGFyZ2V0LmV2YWw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0b2RvOiBzaGltIGludGVncml0eSwgY2FwdHVyZSBTeW1ib2wudW5zY29wYWJsZXNcbiAgICAgICAgaWYgKHByb3AgPT09IFN5bWJvbC51bnNjb3BhYmxlcykge1xuICAgICAgICAgIC8vIFNhZmUgdG8gcmV0dXJuIGEgcHJpbWFsIHJlYWxtIE9iamVjdCBoZXJlIGJlY2F1c2UgdGhlIG9ubHkgY29kZSB0aGF0XG4gICAgICAgICAgLy8gY2FuIGRvIGEgZ2V0KCkgb24gYSBub24tc3RyaW5nIGlzIHRoZSBpbnRlcm5hbHMgb2Ygd2l0aCgpIGl0c2VsZixcbiAgICAgICAgICAvLyBhbmQgdGhlIG9ubHkgdGhpbmcgaXQgZG9lcyBpcyB0byBsb29rIGZvciBwcm9wZXJ0aWVzIG9uIGl0LiBVc2VyXG4gICAgICAgICAgLy8gY29kZSBjYW5ub3QgZG8gYSBsb29rdXAgb24gbm9uLXN0cmluZ3MuXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByb3BlcnRpZXMgb2YgdGhlIGdsb2JhbC5cbiAgICAgICAgaWYgKHByb3AgaW4gdGFyZ2V0KSB7XG4gICAgICAgICAgcmV0dXJuIHRhcmdldFtwcm9wXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZlbnQgdGhlIGxvb2t1cCBmb3Igb3RoZXIgcHJvcGVydGllcy5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH0sXG5cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjbGFzcy1tZXRob2RzLXVzZS10aGlzXG4gICAgICBzZXQodGFyZ2V0LCBwcm9wLCB2YWx1ZSkge1xuICAgICAgICAvLyB0b2RvOiBhbGxvdyBtb2RpZmljYXRpb25zIHdoZW4gdGFyZ2V0Lmhhc093blByb3BlcnR5KHByb3ApIGFuZCBpdFxuICAgICAgICAvLyBpcyB3cml0YWJsZSwgYXNzdW1pbmcgd2UndmUgYWxyZWFkeSByZWplY3RlZCBvdmVybGFwIChzZWVcbiAgICAgICAgLy8gY3JlYXRlU2FmZUV2YWx1YXRvckZhY3RvcnkuZmFjdG9yeSkuIFRoaXMgVHlwZUVycm9yIGdldHMgcmVwbGFjZWQgd2l0aFxuICAgICAgICAvLyB0YXJnZXRbcHJvcF0gPSB2YWx1ZVxuICAgICAgICBpZiAob2JqZWN0SGFzT3duUHJvcGVydHkodGFyZ2V0LCBwcm9wKSkge1xuICAgICAgICAgIC8vIHRvZG86IHNoaW0gaW50ZWdyaXR5OiBUeXBlRXJyb3IsIFN0cmluZ1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYGRvIG5vdCBtb2RpZnkgZW5kb3dtZW50cyBsaWtlICR7U3RyaW5nKHByb3ApfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgc2FmZUdsb2JhbFtwcm9wXSA9IHZhbHVlO1xuXG4gICAgICAgIC8vIFJldHVybiB0cnVlIGFmdGVyIHN1Y2Nlc3NmdWwgc2V0LlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIHdlIG5lZWQgaGFzKCkgdG8gcmV0dXJuIGZhbHNlIGZvciBzb21lIG5hbWVzIHRvIHByZXZlbnQgdGhlIGxvb2t1cCAgZnJvbVxuICAgICAgLy8gY2xpbWJpbmcgdGhlIHNjb3BlIGNoYWluIGFuZCBldmVudHVhbGx5IHJlYWNoaW5nIHRoZSB1bnNhZmVHbG9iYWxcbiAgICAgIC8vIG9iamVjdCwgd2hpY2ggaXMgYmFkLlxuXG4gICAgICAvLyBub3RlOiB1bnNjb3BhYmxlcyEgZXZlcnkgc3RyaW5nIGluIE9iamVjdFtTeW1ib2wudW5zY29wYWJsZXNdXG5cbiAgICAgIC8vIHRvZG86IHdlJ2QgbGlrZSB0byBqdXN0IGhhdmUgaGFzKCkgcmV0dXJuIHRydWUgZm9yIGV2ZXJ5dGhpbmcsIGFuZCB0aGVuXG4gICAgICAvLyB1c2UgZ2V0KCkgdG8gcmFpc2UgYSBSZWZlcmVuY2VFcnJvciBmb3IgYW55dGhpbmcgbm90IG9uIHRoZSBzYWZlIGdsb2JhbC5cbiAgICAgIC8vIEJ1dCB3ZSB3YW50IHRvIGJlIGNvbXBhdGlibGUgd2l0aCBSZWZlcmVuY2VFcnJvciBpbiB0aGUgbm9ybWFsIGNhc2UgYW5kXG4gICAgICAvLyB0aGUgbGFjayBvZiBSZWZlcmVuY2VFcnJvciBpbiB0aGUgJ3R5cGVvZicgY2FzZS4gTXVzdCBlaXRoZXIgcmVsaWFibHlcbiAgICAgIC8vIGRpc3Rpbmd1aXNoIHRoZXNlIHR3byBjYXNlcyAodGhlIHRyYXAgYmVoYXZpb3IgbWlnaHQgYmUgZGlmZmVyZW50KSwgb3JcbiAgICAgIC8vIHdlIHJlbHkgb24gYSBtYW5kYXRvcnkgc291cmNlLXRvLXNvdXJjZSB0cmFuc2Zvcm0gdG8gY2hhbmdlICd0eXBlb2YgYWJjJ1xuICAgICAgLy8gdG8gWFhYLiBXZSBhbHJlYWR5IG5lZWQgYSBtYW5kYXRvcnkgcGFyc2UgdG8gcHJldmVudCB0aGUgJ2ltcG9ydCcsXG4gICAgICAvLyBzaW5jZSBpdCdzIGEgc3BlY2lhbCBmb3JtIGluc3RlYWQgb2YgbWVyZWx5IGJlaW5nIGEgZ2xvYmFsIHZhcmlhYmxlL1xuXG4gICAgICAvLyBub3RlOiBpZiB3ZSBtYWtlIGhhcygpIHJldHVybiB0cnVlIGFsd2F5cywgdGhlbiB3ZSBtdXN0IGltcGxlbWVudCBhXG4gICAgICAvLyBzZXQoKSB0cmFwIHRvIGF2b2lkIHN1YnZlcnRpbmcgdGhlIHByb3RlY3Rpb24gb2Ygc3RyaWN0IG1vZGUgKGl0IHdvdWxkXG4gICAgICAvLyBhY2NlcHQgYXNzaWdubWVudHMgdG8gdW5kZWZpbmVkIGdsb2JhbHMsIHdoZW4gaXQgb3VnaHQgdG8gdGhyb3dcbiAgICAgIC8vIFJlZmVyZW5jZUVycm9yIGZvciBzdWNoIGFzc2lnbm1lbnRzKVxuXG4gICAgICBoYXModGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgIC8vIHByb3hpZXMgc3RyaW5naWZ5ICdwcm9wJywgc28gbm8gVE9DVFRPVSBkYW5nZXIgaGVyZVxuXG4gICAgICAgIGlmIChzbG9wcHlHbG9iYWxzKSB7XG4gICAgICAgICAgLy8gRXZlcnl0aGluZyBpcyBwb3RlbnRpYWxseSBhdmFpbGFibGUuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB1bnNhZmVHbG9iYWw6IGhpZGUgYWxsIHByb3BlcnRpZXMgb2YgdW5zYWZlR2xvYmFsIGF0IHRoZVxuICAgICAgICAvLyBleHBlbnNlIG9mICd0eXBlb2YnIGJlaW5nIHdyb25nIGZvciB0aG9zZSBwcm9wZXJ0aWVzLiBGb3JcbiAgICAgICAgLy8gZXhhbXBsZSwgaW4gdGhlIGJyb3dzZXIsIGV2YWx1YXRpbmcgJ2RvY3VtZW50ID0gMycsIHdpbGwgYWRkXG4gICAgICAgIC8vIGEgcHJvcGVydHkgdG8gc2FmZUdsb2JhbCBpbnN0ZWFkIG9mIHRocm93aW5nIGFcbiAgICAgICAgLy8gUmVmZXJlbmNlRXJyb3IuXG4gICAgICAgIGlmIChwcm9wID09PSAnZXZhbCcgfHwgcHJvcCBpbiB0YXJnZXQgfHwgcHJvcCBpbiB1bnNhZmVHbG9iYWwpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLy8gaHR0cHM6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi85LjAvaW5kZXguaHRtbCNzZWMtaHRtbC1saWtlLWNvbW1lbnRzXG4gIC8vIGV4cGxhaW5zIHRoYXQgSmF2YVNjcmlwdCBwYXJzZXJzIG1heSBvciBtYXkgbm90IHJlY29nbml6ZSBodG1sXG4gIC8vIGNvbW1lbnQgdG9rZW5zIFwiPFwiIGltbWVkaWF0ZWx5IGZvbGxvd2VkIGJ5IFwiIS0tXCIgYW5kIFwiLS1cIlxuICAvLyBpbW1lZGlhdGVseSBmb2xsb3dlZCBieSBcIj5cIiBpbiBub24tbW9kdWxlIHNvdXJjZSB0ZXh0LCBhbmQgdHJlYXRcbiAgLy8gdGhlbSBhcyBhIGtpbmQgb2YgbGluZSBjb21tZW50LiBTaW5jZSBvdGhlcndpc2UgYm90aCBvZiB0aGVzZSBjYW5cbiAgLy8gYXBwZWFyIGluIG5vcm1hbCBKYXZhU2NyaXB0IHNvdXJjZSBjb2RlIGFzIGEgc2VxdWVuY2Ugb2Ygb3BlcmF0b3JzLFxuICAvLyB3ZSBoYXZlIHRoZSB0ZXJyaWZ5aW5nIHBvc3NpYmlsaXR5IG9mIHRoZSBzYW1lIHNvdXJjZSBjb2RlIHBhcnNpbmdcbiAgLy8gb25lIHdheSBvbiBvbmUgY29ycmVjdCBKYXZhU2NyaXB0IGltcGxlbWVudGF0aW9uLCBhbmQgYW5vdGhlciB3YXlcbiAgLy8gb24gYW5vdGhlci5cbiAgLy9cbiAgLy8gVGhpcyBzaGltIHRha2VzIHRoZSBjb25zZXJ2YXRpdmUgc3RyYXRlZ3kgb2YganVzdCByZWplY3Rpbmcgc291cmNlXG4gIC8vIHRleHQgdGhhdCBjb250YWlucyB0aGVzZSBzdHJpbmdzIGFueXdoZXJlLiBOb3RlIHRoYXQgdGhpcyB2ZXJ5XG4gIC8vIHNvdXJjZSBmaWxlIGlzIHdyaXR0ZW4gc3RyYW5nZWx5IHRvIGF2b2lkIG1lbnRpb25pbmcgdGhlc2VcbiAgLy8gY2hhcmFjdGVyIHN0cmluZ3MgZXhwbGljaXRseS5cblxuICAvLyBXZSBkbyBub3Qgd3JpdGUgdGhlIHJlZ2V4cCBpbiBhIHN0cmFpZ2h0Zm9yd2FyZCB3YXksIHNvIHRoYXQgYW5cbiAgLy8gYXBwYXJlbm50IGh0bWwgY29tbWVudCBkb2VzIG5vdCBhcHBlYXIgaW4gdGhpcyBmaWxlLiBUaHVzLCB3ZSBhdm9pZFxuICAvLyByZWplY3Rpb24gYnkgdGhlIG92ZXJseSBlYWdlciByZWplY3REYW5nZXJvdXNTb3VyY2VzLlxuICBjb25zdCBodG1sQ29tbWVudFBhdHRlcm4gPSBuZXcgUmVnRXhwKGAoPzokeyc8J30hLS18LS0keyc+J30pYCk7XG5cbiAgZnVuY3Rpb24gcmVqZWN0SHRtbENvbW1lbnRzKHMpIHtcbiAgICBjb25zdCBpbmRleCA9IHMuc2VhcmNoKGh0bWxDb21tZW50UGF0dGVybik7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgY29uc3QgbGluZW51bSA9IHMuc2xpY2UoMCwgaW5kZXgpLnNwbGl0KCdcXG4nKS5sZW5ndGg7IC8vIG1vcmUgb3IgbGVzc1xuICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgICBgcG9zc2libGUgaHRtbCBjb21tZW50IHN5bnRheCByZWplY3RlZCBhcm91bmQgbGluZSAke2xpbmVudW19YFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvLyBUaGUgcHJvcG9zZWQgZHluYW1pYyBpbXBvcnQgZXhwcmVzc2lvbiBpcyB0aGUgb25seSBzeW50YXggY3VycmVudGx5XG4gIC8vIHByb3Bvc2VkLCB0aGF0IGNhbiBhcHBlYXIgaW4gbm9uLW1vZHVsZSBKYXZhU2NyaXB0IGNvZGUsIHRoYXRcbiAgLy8gZW5hYmxlcyBkaXJlY3QgYWNjZXNzIHRvIHRoZSBvdXRzaWRlIHdvcmxkIHRoYXQgY2Fubm90IGJlXG4gIC8vIHN1cnByZXNzZWQgb3IgaW50ZXJjZXB0ZWQgd2l0aG91dCBwYXJzaW5nIGFuZCByZXdyaXRpbmcuIEluc3RlYWQsXG4gIC8vIHRoaXMgc2hpbSBjb25zZXJ2YXRpdmVseSByZWplY3RzIGFueSBzb3VyY2UgdGV4dCB0aGF0IHNlZW1zIHRvXG4gIC8vIGNvbnRhaW4gc3VjaCBhbiBleHByZXNzaW9uLiBUbyBkbyB0aGlzIHNhZmVseSB3aXRob3V0IHBhcnNpbmcsIHdlXG4gIC8vIG11c3QgYWxzbyByZWplY3Qgc29tZSB2YWxpZCBwcm9ncmFtcywgaS5lLiwgdGhvc2UgY29udGFpbmluZ1xuICAvLyBhcHBhcmVudCBpbXBvcnQgZXhwcmVzc2lvbnMgaW4gbGl0ZXJhbCBzdHJpbmdzIG9yIGNvbW1lbnRzLlxuXG4gIC8vIFRoZSBjdXJyZW50IGNvbnNlcnZhdGl2ZSBydWxlIGxvb2tzIGZvciB0aGUgaWRlbnRpZmllciBcImltcG9ydFwiXG4gIC8vIGZvbGxvd2VkIGJ5IGVpdGhlciBhbiBvcGVuIHBhcmVuIG9yIHNvbWV0aGluZyB0aGF0IGxvb2tzIGxpa2UgdGhlXG4gIC8vIGJlZ2lubmluZyBvZiBhIGNvbW1lbnQuIFdlIGFzc3VtZSB0aGF0IHdlIGRvIG5vdCBuZWVkIHRvIHdvcnJ5XG4gIC8vIGFib3V0IGh0bWwgY29tbWVudCBzeW50YXggYmVjYXVzZSB0aGF0IHdhcyBhbHJlYWR5IHJlamVjdGVkIGJ5XG4gIC8vIHJlamVjdEh0bWxDb21tZW50cy5cblxuICAvLyB0aGlzIFxccyAqbXVzdCogbWF0Y2ggYWxsIGtpbmRzIG9mIHN5bnRheC1kZWZpbmVkIHdoaXRlc3BhY2UuIElmIGUuZy5cbiAgLy8gVSsyMDI4IChMSU5FIFNFUEFSQVRPUikgb3IgVSsyMDI5IChQQVJBR1JBUEggU0VQQVJBVE9SKSBpcyB0cmVhdGVkIGFzXG4gIC8vIHdoaXRlc3BhY2UgYnkgdGhlIHBhcnNlciwgYnV0IG5vdCBtYXRjaGVkIGJ5IC9cXHMvLCB0aGVuIHRoaXMgd291bGQgYWRtaXRcbiAgLy8gYW4gYXR0YWNrIGxpa2U6IGltcG9ydFxcdTIwMjgoJ3Bvd2VyLmpzJykgLiBXZSdyZSB0cnlpbmcgdG8gZGlzdGluZ3Vpc2hcbiAgLy8gc29tZXRoaW5nIGxpa2UgdGhhdCBmcm9tIHNvbWV0aGluZyBsaWtlIGltcG9ydG5vdHJlYWxseSgncG93ZXIuanMnKSB3aGljaFxuICAvLyBpcyBwZXJmZWN0bHkgc2FmZS5cblxuICBjb25zdCBpbXBvcnRQYXR0ZXJuID0gL1xcYmltcG9ydFxccyooPzpcXCh8XFwvWy8qXSkvO1xuXG4gIGZ1bmN0aW9uIHJlamVjdEltcG9ydEV4cHJlc3Npb25zKHMpIHtcbiAgICBjb25zdCBpbmRleCA9IHMuc2VhcmNoKGltcG9ydFBhdHRlcm4pO1xuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IGxpbmVudW0gPSBzLnNsaWNlKDAsIGluZGV4KS5zcGxpdCgnXFxuJykubGVuZ3RoOyAvLyBtb3JlIG9yIGxlc3NcbiAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgICAgYHBvc3NpYmxlIGltcG9ydCBleHByZXNzaW9uIHJlamVjdGVkIGFyb3VuZCBsaW5lICR7bGluZW51bX1gXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoZSBzaGltIGNhbm5vdCBjb3JyZWN0bHkgZW11bGF0ZSBhIGRpcmVjdCBldmFsIGFzIGV4cGxhaW5lZCBhdFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQWdvcmljL3JlYWxtcy1zaGltL2lzc3Vlcy8xMlxuICAvLyBXaXRob3V0IHJlamVjdGluZyBhcHBhcmVudCBkaXJlY3QgZXZhbCBzeW50YXgsIHdlIHdvdWxkXG4gIC8vIGFjY2lkZW50YWxseSBldmFsdWF0ZSB0aGVzZSB3aXRoIGFuIGVtdWxhdGlvbiBvZiBpbmRpcmVjdCBldmFsLiBUcFxuICAvLyBwcmV2ZW50IGZ1dHVyZSBjb21wYXRpYmlsaXR5IHByb2JsZW1zLCBpbiBzaGlmdGluZyBmcm9tIHVzZSBvZiB0aGVcbiAgLy8gc2hpbSB0byBnZW51aW5lIHBsYXRmb3JtIHN1cHBvcnQgZm9yIHRoZSBwcm9wb3NhbCwgd2Ugc2hvdWxkXG4gIC8vIGluc3RlYWQgc3RhdGljYWxseSByZWplY3QgY29kZSB0aGF0IHNlZW1zIHRvIGNvbnRhaW4gYSBkaXJlY3QgZXZhbFxuICAvLyBleHByZXNzaW9uLlxuICAvL1xuICAvLyBBcyB3aXRoIHRoZSBkeW5hbWljIGltcG9ydCBleHByZXNzaW9uLCB0byBhdm9pZCBhIGZ1bGwgcGFyc2UsIHdlIGRvXG4gIC8vIHRoaXMgYXBwcm94aW1hdGVseSB3aXRoIGEgcmVnZXhwLCB0aGF0IHdpbGwgYWxzbyByZWplY3Qgc3RyaW5nc1xuICAvLyB0aGF0IGFwcGVhciBzYWZlbHkgaW4gY29tbWVudHMgb3Igc3RyaW5ncy4gVW5saWtlIGR5bmFtaWMgaW1wb3J0LFxuICAvLyBpZiB3ZSBtaXNzIHNvbWUsIHRoaXMgb25seSBjcmVhdGVzIGZ1dHVyZSBjb21wYXQgcHJvYmxlbXMsIG5vdFxuICAvLyBzZWN1cml0eSBwcm9ibGVtcy4gVGh1cywgd2UgYXJlIG9ubHkgdHJ5aW5nIHRvIGNhdGNoIGlubm9jZW50XG4gIC8vIG9jY3VycmVuY2VzLCBub3QgbWFsaWNpb3VzIG9uZS4gSW4gcGFydGljdWxhciwgYChldmFsKSguLi4pYCBpc1xuICAvLyBkaXJlY3QgZXZhbCBzeW50YXggdGhhdCB3b3VsZCBub3QgYmUgY2F1Z2h0IGJ5IHRoZSBmb2xsb3dpbmcgcmVnZXhwLlxuXG4gIGNvbnN0IHNvbWVEaXJlY3RFdmFsUGF0dGVybiA9IC9cXGJldmFsXFxzKig/OlxcKHxcXC9bLypdKS87XG5cbiAgZnVuY3Rpb24gcmVqZWN0U29tZURpcmVjdEV2YWxFeHByZXNzaW9ucyhzKSB7XG4gICAgY29uc3QgaW5kZXggPSBzLnNlYXJjaChzb21lRGlyZWN0RXZhbFBhdHRlcm4pO1xuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IGxpbmVudW0gPSBzLnNsaWNlKDAsIGluZGV4KS5zcGxpdCgnXFxuJykubGVuZ3RoOyAvLyBtb3JlIG9yIGxlc3NcbiAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgICAgYHBvc3NpYmxlIGRpcmVjdCBldmFsIGV4cHJlc3Npb24gcmVqZWN0ZWQgYXJvdW5kIGxpbmUgJHtsaW5lbnVtfWBcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVqZWN0RGFuZ2Vyb3VzU291cmNlcyhzKSB7XG4gICAgcmVqZWN0SHRtbENvbW1lbnRzKHMpO1xuICAgIHJlamVjdEltcG9ydEV4cHJlc3Npb25zKHMpO1xuICAgIHJlamVjdFNvbWVEaXJlY3RFdmFsRXhwcmVzc2lvbnMocyk7XG4gIH1cblxuICAvLyBFeHBvcnQgYSByZXdyaXRlciB0cmFuc2Zvcm0uXG4gIGNvbnN0IHJlamVjdERhbmdlcm91c1NvdXJjZXNUcmFuc2Zvcm0gPSB7XG4gICAgcmV3cml0ZShycykge1xuICAgICAgcmVqZWN0RGFuZ2Vyb3VzU291cmNlcyhycy5zcmMpO1xuICAgICAgcmV0dXJuIHJzO1xuICAgIH1cbiAgfTtcblxuICAvLyBQb3J0aW9ucyBhZGFwdGVkIGZyb20gVjggLSBDb3B5cmlnaHQgMjAxNiB0aGUgVjggcHJvamVjdCBhdXRob3JzLlxuXG4gIGZ1bmN0aW9uIGJ1aWxkT3B0aW1pemVyKGNvbnN0YW50cykge1xuICAgIC8vIE5vIG5lZWQgdG8gYnVpbGQgYW4gb3ByaW1pemVyIHdoZW4gdGhlcmUgYXJlIG5vIGNvbnN0YW50cy5cbiAgICBpZiAoY29uc3RhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnO1xuICAgIC8vIFVzZSAndGhpcycgdG8gYXZvaWQgZ29pbmcgdGhyb3VnaCB0aGUgc2NvcGUgcHJveHksIHdoaWNoIGlzIHVuZWNlc3NhcnlcbiAgICAvLyBzaW5jZSB0aGUgb3B0aW1pemVyIG9ubHkgbmVlZHMgcmVmZXJlbmNlcyB0byB0aGUgc2FmZSBnbG9iYWwuXG4gICAgcmV0dXJuIGBjb25zdCB7JHthcnJheUpvaW4oY29uc3RhbnRzLCAnLCcpfX0gPSB0aGlzO2A7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTY29wZWRFdmFsdWF0b3JGYWN0b3J5KHVuc2FmZVJlYywgY29uc3RhbnRzKSB7XG4gICAgY29uc3QgeyB1bnNhZmVGdW5jdGlvbiB9ID0gdW5zYWZlUmVjO1xuXG4gICAgY29uc3Qgb3B0aW1pemVyID0gYnVpbGRPcHRpbWl6ZXIoY29uc3RhbnRzKTtcblxuICAgIC8vIENyZWF0ZSBhIGZ1bmN0aW9uIGluIHNsb3BweSBtb2RlLCBzbyB0aGF0IHdlIGNhbiB1c2UgJ3dpdGgnLiBJdCByZXR1cm5zXG4gICAgLy8gYSBmdW5jdGlvbiBpbiBzdHJpY3QgbW9kZSB0aGF0IGV2YWx1YXRlcyB0aGUgcHJvdmlkZWQgY29kZSB1c2luZyBkaXJlY3RcbiAgICAvLyBldmFsLCBhbmQgdGh1cyBpbiBzdHJpY3QgbW9kZSBpbiB0aGUgc2FtZSBzY29wZS4gV2UgbXVzdCBiZSB2ZXJ5IGNhcmVmdWxcbiAgICAvLyB0byBub3QgY3JlYXRlIG5ldyBuYW1lcyBpbiB0aGlzIHNjb3BlXG5cbiAgICAvLyAxOiB3ZSB1c2UgJ3dpdGgnIChhcm91bmQgYSBQcm94eSkgdG8gY2F0Y2ggYWxsIGZyZWUgdmFyaWFibGUgbmFtZXMuIFRoZVxuICAgIC8vIGZpcnN0ICdhcmd1bWVudHNbMF0nIGhvbGRzIHRoZSBQcm94eSB3aGljaCBzYWZlbHkgd3JhcHMgdGhlIHNhZmVHbG9iYWxcbiAgICAvLyAyOiAnb3B0aW1pemVyJyBjYXRjaGVzIGNvbW1vbiB2YXJpYWJsZSBuYW1lcyBmb3Igc3BlZWRcbiAgICAvLyAzOiBUaGUgaW5uZXIgc3RyaWN0IGZ1bmN0aW9uIGlzIGVmZmVjdGl2ZWx5IHBhc3NlZCB0d28gcGFyYW1ldGVyczpcbiAgICAvLyAgICBhKSBpdHMgYXJndW1lbnRzWzBdIGlzIHRoZSBzb3VyY2UgdG8gYmUgZGlyZWN0bHkgZXZhbHVhdGVkLlxuICAgIC8vICAgIGIpIGl0cyAndGhpcycgaXMgdGhlIHRoaXMgYmluZGluZyBzZWVuIGJ5IHRoZSBjb2RlIGJlaW5nXG4gICAgLy8gICAgICAgZGlyZWN0bHkgZXZhbHVhdGVkLlxuXG4gICAgLy8gZXZlcnl0aGluZyBpbiB0aGUgJ29wdGltaXplcicgc3RyaW5nIGlzIGxvb2tlZCB1cCBpbiB0aGUgcHJveHlcbiAgICAvLyAoaW5jbHVkaW5nIGFuICdhcmd1bWVudHNbMF0nLCB3aGljaCBwb2ludHMgYXQgdGhlIFByb3h5KS4gJ2Z1bmN0aW9uJyBpc1xuICAgIC8vIGEga2V5d29yZCwgbm90IGEgdmFyaWFibGUsIHNvIGl0IGlzIG5vdCBsb29rZWQgdXAuIHRoZW4gJ2V2YWwnIGlzIGxvb2tlZFxuICAgIC8vIHVwIGluIHRoZSBwcm94eSwgdGhhdCdzIHRoZSBmaXJzdCB0aW1lIGl0IGlzIGxvb2tlZCB1cCBhZnRlclxuICAgIC8vIHVzZVVuc2FmZUV2YWx1YXRvciBpcyB0dXJuZWQgb24sIHNvIHRoZSBwcm94eSByZXR1cm5zIHRoZSByZWFsIHRoZVxuICAgIC8vIHVuc2FmZUV2YWwsIHdoaWNoIHNhdGlzZmllcyB0aGUgSXNEaXJlY3RFdmFsVHJhcCBwcmVkaWNhdGUsIHNvIGl0IHVzZXNcbiAgICAvLyB0aGUgZGlyZWN0IGV2YWwgYW5kIGdldHMgdGhlIGxleGljYWwgc2NvcGUuIFRoZSBzZWNvbmQgJ2FyZ3VtZW50c1swXScgaXNcbiAgICAvLyBsb29rZWQgdXAgaW4gdGhlIGNvbnRleHQgb2YgdGhlIGlubmVyIGZ1bmN0aW9uLiBUaGUgKmNvbnRlbnRzKiBvZlxuICAgIC8vIGFyZ3VtZW50c1swXSwgYmVjYXVzZSB3ZSdyZSB1c2luZyBkaXJlY3QgZXZhbCwgYXJlIGxvb2tlZCB1cCBpbiB0aGVcbiAgICAvLyBQcm94eSwgYnkgd2hpY2ggcG9pbnQgdGhlIHVzZVVuc2FmZUV2YWx1YXRvciBzd2l0Y2ggaGFzIGJlZW4gZmxpcHBlZFxuICAgIC8vIGJhY2sgdG8gJ2ZhbHNlJywgc28gYW55IGluc3RhbmNlcyBvZiAnZXZhbCcgaW4gdGhhdCBzdHJpbmcgd2lsbCBnZXQgdGhlXG4gICAgLy8gc2FmZSBldmFsdWF0b3IuXG5cbiAgICByZXR1cm4gdW5zYWZlRnVuY3Rpb24oYFxuICAgIHdpdGggKGFyZ3VtZW50c1swXSkge1xuICAgICAgJHtvcHRpbWl6ZXJ9XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgcmV0dXJuIGV2YWwoYXJndW1lbnRzWzBdKTtcbiAgICAgIH07XG4gICAgfVxuICBgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNhZmVFdmFsdWF0b3JGYWN0b3J5KFxuICAgIHVuc2FmZVJlYyxcbiAgICBzYWZlR2xvYmFsLFxuICAgIHRyYW5zZm9ybXMsXG4gICAgc2xvcHB5R2xvYmFsc1xuICApIHtcbiAgICBjb25zdCB7IHVuc2FmZUZ1bmN0aW9uIH0gPSB1bnNhZmVSZWM7XG5cbiAgICBjb25zdCBzY29wZUhhbmRsZXIgPSBjcmVhdGVTY29wZUhhbmRsZXIodW5zYWZlUmVjLCBzYWZlR2xvYmFsLCBzbG9wcHlHbG9iYWxzKTtcbiAgICBjb25zdCBjb25zdGFudHMgPSBnZXRPcHRpbWl6YWJsZUdsb2JhbHMoc2FmZUdsb2JhbCk7XG4gICAgY29uc3Qgc2NvcGVkRXZhbHVhdG9yRmFjdG9yeSA9IGNyZWF0ZVNjb3BlZEV2YWx1YXRvckZhY3RvcnkoXG4gICAgICB1bnNhZmVSZWMsXG4gICAgICBjb25zdGFudHNcbiAgICApO1xuXG4gICAgZnVuY3Rpb24gZmFjdG9yeShlbmRvd21lbnRzID0ge30sIG9wdGlvbnMgPSB7fSkge1xuICAgICAgY29uc3QgbG9jYWxUcmFuc2Zvcm1zID0gb3B0aW9ucy50cmFuc2Zvcm1zIHx8IFtdO1xuICAgICAgY29uc3QgcmVhbG1UcmFuc2Zvcm1zID0gdHJhbnNmb3JtcyB8fCBbXTtcblxuICAgICAgY29uc3QgbWFuZGF0b3J5VHJhbnNmb3JtcyA9IFtyZWplY3REYW5nZXJvdXNTb3VyY2VzVHJhbnNmb3JtXTtcbiAgICAgIGNvbnN0IGFsbFRyYW5zZm9ybXMgPSBbXG4gICAgICAgIC4uLmxvY2FsVHJhbnNmb3JtcyxcbiAgICAgICAgLi4ucmVhbG1UcmFuc2Zvcm1zLFxuICAgICAgICAuLi5tYW5kYXRvcnlUcmFuc2Zvcm1zXG4gICAgICBdO1xuXG4gICAgICAvLyBXZSB1c2UgdGhlIHRoZSBjb25jaXNlIG1ldGhvZCBzeW50YXggdG8gY3JlYXRlIGFuIGV2YWwgd2l0aG91dCBhXG4gICAgICAvLyBbW0NvbnN0cnVjdF1dIGJlaGF2aW9yIChzdWNoIHRoYXQgdGhlIGludm9jYXRpb24gXCJuZXcgZXZhbCgpXCIgdGhyb3dzXG4gICAgICAvLyBUeXBlRXJyb3I6IGV2YWwgaXMgbm90IGEgY29uc3RydWN0b3JcIiksIGJ1dCB3aGljaCBzdGlsbCBhY2NlcHRzIGFcbiAgICAgIC8vICd0aGlzJyBiaW5kaW5nLlxuICAgICAgY29uc3Qgc2FmZUV2YWwgPSB7XG4gICAgICAgIGV2YWwoc3JjKSB7XG4gICAgICAgICAgc3JjID0gYCR7c3JjfWA7XG4gICAgICAgICAgLy8gUmV3cml0ZSB0aGUgc291cmNlLCB0aHJlYWRpbmcgdGhyb3VnaCByZXdyaXRlciBzdGF0ZSBhcyBuZWNlc3NhcnkuXG4gICAgICAgICAgY29uc3QgcmV3cml0ZXJTdGF0ZSA9IGFsbFRyYW5zZm9ybXMucmVkdWNlKFxuICAgICAgICAgICAgKHJzLCB0cmFuc2Zvcm0pID0+ICh0cmFuc2Zvcm0ucmV3cml0ZSA/IHRyYW5zZm9ybS5yZXdyaXRlKHJzKSA6IHJzKSxcbiAgICAgICAgICAgIHsgc3JjLCBlbmRvd21lbnRzIH1cbiAgICAgICAgICApO1xuICAgICAgICAgIHNyYyA9IHJld3JpdGVyU3RhdGUuc3JjO1xuXG4gICAgICAgICAgY29uc3Qgc2NvcGVUYXJnZXQgPSBjcmVhdGUoXG4gICAgICAgICAgICBzYWZlR2xvYmFsLFxuICAgICAgICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhyZXdyaXRlclN0YXRlLmVuZG93bWVudHMpXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb25zdCBzY29wZVByb3h5ID0gbmV3IFByb3h5KHNjb3BlVGFyZ2V0LCBzY29wZUhhbmRsZXIpO1xuICAgICAgICAgIGNvbnN0IHNjb3BlZEV2YWx1YXRvciA9IGFwcGx5KHNjb3BlZEV2YWx1YXRvckZhY3RvcnksIHNhZmVHbG9iYWwsIFtcbiAgICAgICAgICAgIHNjb3BlUHJveHlcbiAgICAgICAgICBdKTtcblxuICAgICAgICAgIHNjb3BlSGFuZGxlci5hbGxvd1Vuc2FmZUV2YWx1YXRvck9uY2UoKTtcbiAgICAgICAgICBsZXQgZXJyO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBFbnN1cmUgdGhhdCBcInRoaXNcIiByZXNvbHZlcyB0byB0aGUgc2FmZSBnbG9iYWwuXG4gICAgICAgICAgICByZXR1cm4gYXBwbHkoc2NvcGVkRXZhbHVhdG9yLCBzYWZlR2xvYmFsLCBbc3JjXSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gc3Rhc2ggdGhlIGNoaWxkLWNvZGUgZXJyb3IgaW4gaG9wZXMgb2YgZGVidWdnaW5nIHRoZSBpbnRlcm5hbCBmYWlsdXJlXG4gICAgICAgICAgICBlcnIgPSBlO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgLy8gYmVsdCBhbmQgc3VzcGVuZGVyczogdGhlIHByb3h5IHN3aXRjaGVzIHRoaXMgb2ZmIGltbWVkaWF0ZWx5IGFmdGVyXG4gICAgICAgICAgICAvLyB0aGUgZmlyc3QgYWNjZXNzLCBidXQgaWYgdGhhdCdzIG5vdCB0aGUgY2FzZSB3ZSBhYm9ydC5cbiAgICAgICAgICAgIGlmIChzY29wZUhhbmRsZXIudW5zYWZlRXZhbHVhdG9yQWxsb3dlZCgpKSB7XG4gICAgICAgICAgICAgIHRocm93VGFudHJ1bSgnaGFuZGxlciBkaWQgbm90IHJldm9rZSB1c2VVbnNhZmVFdmFsdWF0b3InLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfS5ldmFsO1xuXG4gICAgICAvLyBzYWZlRXZhbCdzIHByb3RvdHlwZSBpcyBjdXJyZW50bHkgdGhlIHByaW1hbCByZWFsbSdzXG4gICAgICAvLyBGdW5jdGlvbi5wcm90b3R5cGUsIHdoaWNoIHdlIG11c3Qgbm90IGxldCBlc2NhcGUuIFRvIG1ha2UgJ2V2YWxcbiAgICAgIC8vIGluc3RhbmNlb2YgRnVuY3Rpb24nIGJlIHRydWUgaW5zaWRlIHRoZSByZWFsbSwgd2UgbmVlZCB0byBwb2ludCBpdCBhdFxuICAgICAgLy8gdGhlIFJvb3RSZWFsbSdzIHZhbHVlLlxuXG4gICAgICAvLyBFbnN1cmUgdGhhdCBldmFsIGZyb20gYW55IGNvbXBhcnRtZW50IGluIGEgcm9vdCByZWFsbSBpcyBhbiBpbnN0YW5jZVxuICAgICAgLy8gb2YgRnVuY3Rpb24gaW4gYW55IGNvbXBhcnRtZW50IG9mIHRoZSBzYW1lIHJvb3QgcmVhbG0uXG4gICAgICBzZXRQcm90b3R5cGVPZihzYWZlRXZhbCwgdW5zYWZlRnVuY3Rpb24ucHJvdG90eXBlKTtcblxuICAgICAgYXNzZXJ0KGdldFByb3RvdHlwZU9mKHNhZmVFdmFsKS5jb25zdHJ1Y3RvciAhPT0gRnVuY3Rpb24sICdoaWRlIEZ1bmN0aW9uJyk7XG4gICAgICBhc3NlcnQoXG4gICAgICAgIGdldFByb3RvdHlwZU9mKHNhZmVFdmFsKS5jb25zdHJ1Y3RvciAhPT0gdW5zYWZlRnVuY3Rpb24sXG4gICAgICAgICdoaWRlIHVuc2FmZUZ1bmN0aW9uJ1xuICAgICAgKTtcblxuICAgICAgLy8gbm90ZTogYmUgY2FyZWZ1bCB0byBub3QgbGVhayBvdXIgcHJpbWFsIEZ1bmN0aW9uLnByb3RvdHlwZSBieSBzZXR0aW5nXG4gICAgICAvLyB0aGlzIHRvIGEgcGxhaW4gYXJyb3cgZnVuY3Rpb24uIE5vdyB0aGF0IHdlIGhhdmUgc2FmZUV2YWwsIHVzZSBpdC5cbiAgICAgIGRlZmluZVByb3BlcnRpZXMoc2FmZUV2YWwsIHtcbiAgICAgICAgdG9TdHJpbmc6IHtcbiAgICAgICAgICAvLyBXZSBicmVhayB1cCB0aGUgZm9sbG93aW5nIGxpdGVyYWwgc3RyaW5nIHNvIHRoYXQgYW5cbiAgICAgICAgICAvLyBhcHBhcmVudCBkaXJlY3QgZXZhbCBzeW50YXggZG9lcyBub3QgYXBwZWFyIGluIHRoaXNcbiAgICAgICAgICAvLyBmaWxlLiBUaHVzLCB3ZSBhdm9pZCByZWplY3Rpb24gYnkgdGhlIG92ZXJseSBlYWdlclxuICAgICAgICAgIC8vIHJlamVjdERhbmdlcm91c1NvdXJjZXMuXG4gICAgICAgICAgdmFsdWU6IHNhZmVFdmFsKFwiKCkgPT4gJ2Z1bmN0aW9uIGV2YWwnICsgJygpIHsgW3NoaW0gY29kZV0gfSdcIiksXG4gICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHNhZmVFdmFsO1xuICAgIH1cblxuICAgIHJldHVybiBmYWN0b3J5O1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU2FmZUV2YWx1YXRvcihzYWZlRXZhbHVhdG9yRmFjdG9yeSkge1xuICAgIHJldHVybiBzYWZlRXZhbHVhdG9yRmFjdG9yeSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU2FmZUV2YWx1YXRvcldoaWNoVGFrZXNFbmRvd21lbnRzKHNhZmVFdmFsdWF0b3JGYWN0b3J5KSB7XG4gICAgcmV0dXJuICh4LCBlbmRvd21lbnRzLCBvcHRpb25zID0ge30pID0+XG4gICAgICBzYWZlRXZhbHVhdG9yRmFjdG9yeShlbmRvd21lbnRzLCBvcHRpb25zKSh4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHNhZmUgdmVyc2lvbiBvZiB0aGUgbmF0aXZlIEZ1bmN0aW9uIHdoaWNoIHJlbGllcyBvblxuICAgKiB0aGUgc2FmZXR5IG9mIGV2YWxFdmFsdWF0b3IgZm9yIGNvbmZpbmVtZW50LlxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlRnVuY3Rpb25FdmFsdWF0b3IodW5zYWZlUmVjLCBzYWZlRXZhbCkge1xuICAgIGNvbnN0IHsgdW5zYWZlRnVuY3Rpb24sIHVuc2FmZUdsb2JhbCB9ID0gdW5zYWZlUmVjO1xuXG4gICAgY29uc3Qgc2FmZUZ1bmN0aW9uID0gZnVuY3Rpb24gRnVuY3Rpb24oLi4ucGFyYW1zKSB7XG4gICAgICBjb25zdCBmdW5jdGlvbkJvZHkgPSBgJHthcnJheVBvcChwYXJhbXMpIHx8ICcnfWA7XG4gICAgICBsZXQgZnVuY3Rpb25QYXJhbXMgPSBgJHthcnJheUpvaW4ocGFyYW1zLCAnLCcpfWA7XG4gICAgICBpZiAoIXJlZ2V4cFRlc3QoL15bXFx3XFxzLF0qJC8sIGZ1bmN0aW9uUGFyYW1zKSkge1xuICAgICAgICB0aHJvdyBuZXcgdW5zYWZlR2xvYmFsLlN5bnRheEVycm9yKFxuICAgICAgICAgICdzaGltIGxpbWl0YXRpb246IEZ1bmN0aW9uIGFyZyBtdXN0IGJlIHNpbXBsZSBBU0NJSSBpZGVudGlmaWVycywgcG9zc2libHkgc2VwYXJhdGVkIGJ5IGNvbW1hczogbm8gZGVmYXVsdCB2YWx1ZXMsIHBhdHRlcm4gbWF0Y2hlcywgb3Igbm9uLUFTQ0lJIHBhcmFtZXRlciBuYW1lcydcbiAgICAgICAgKTtcbiAgICAgICAgLy8gdGhpcyBwcm90ZWN0cyBhZ2FpbnN0IE1hdHQgQXVzdGluJ3MgY2xldmVyIGF0dGFjazpcbiAgICAgICAgLy8gRnVuY3Rpb24oXCJhcmc9YFwiLCBcIi8qYm9keWApe30pOyh7eDogdGhpcy8qKi9cIilcbiAgICAgICAgLy8gd2hpY2ggd291bGQgdHVybiBpbnRvXG4gICAgICAgIC8vICAgICAoZnVuY3Rpb24oYXJnPWBcbiAgICAgICAgLy8gICAgIC8qYGAqLyl7XG4gICAgICAgIC8vICAgICAgLypib2R5YCl7fSk7KHt4OiB0aGlzLyoqL1xuICAgICAgICAvLyAgICAgfSlcbiAgICAgICAgLy8gd2hpY2ggcGFyc2VzIGFzIGEgZGVmYXVsdCBhcmd1bWVudCBvZiBgXFxuLypgYCovKXtcXG4vKmJvZHlgICwgd2hpY2hcbiAgICAgICAgLy8gaXMgYSBwYWlyIG9mIHRlbXBsYXRlIGxpdGVyYWxzIGJhY2stdG8tYmFjayAoc28gdGhlIGZpcnN0IG9uZVxuICAgICAgICAvLyBub21pbmFsbHkgZXZhbHVhdGVzIHRvIHRoZSBwYXJzZXIgdG8gdXNlIG9uIHRoZSBzZWNvbmQgb25lKSwgd2hpY2hcbiAgICAgICAgLy8gY2FuJ3QgYWN0dWFsbHkgZXhlY3V0ZSAoYmVjYXVzZSB0aGUgZmlyc3QgbGl0ZXJhbCBldmFscyB0byBhIHN0cmluZyxcbiAgICAgICAgLy8gd2hpY2ggY2FuJ3QgYmUgYSBwYXJzZXIgZnVuY3Rpb24pLCBidXQgdGhhdCBkb2Vzbid0IG1hdHRlciBiZWNhdXNlXG4gICAgICAgIC8vIHRoZSBmdW5jdGlvbiBpcyBieXBhc3NlZCBlbnRpcmVseS4gV2hlbiB0aGF0IGdldHMgZXZhbHVhdGVkLCBpdFxuICAgICAgICAvLyBkZWZpbmVzIChidXQgZG9lcyBub3QgaW52b2tlKSBhIGZ1bmN0aW9uLCB0aGVuIGV2YWx1YXRlcyBhIHNpbXBsZVxuICAgICAgICAvLyB7eDogdGhpc30gZXhwcmVzc2lvbiwgZ2l2aW5nIGFjY2VzcyB0byB0aGUgc2FmZSBnbG9iYWwuXG4gICAgICB9XG5cbiAgICAgIC8vIElzIHRoaXMgYSByZWFsIGZ1bmN0aW9uQm9keSwgb3IgaXMgc29tZW9uZSBhdHRlbXB0aW5nIGFuIGluamVjdGlvblxuICAgICAgLy8gYXR0YWNrPyBUaGlzIHdpbGwgdGhyb3cgYSBTeW50YXhFcnJvciBpZiB0aGUgc3RyaW5nIGlzIG5vdCBhY3R1YWxseSBhXG4gICAgICAvLyBmdW5jdGlvbiBib2R5LiBXZSBjb2VyY2UgdGhlIGJvZHkgaW50byBhIHJlYWwgc3RyaW5nIGFib3ZlIHRvIHByZXZlbnRcbiAgICAgIC8vIHNvbWVvbmUgZnJvbSBwYXNzaW5nIGFuIG9iamVjdCB3aXRoIGEgdG9TdHJpbmcoKSB0aGF0IHJldHVybnMgYSBzYWZlXG4gICAgICAvLyBzdHJpbmcgdGhlIGZpcnN0IHRpbWUsIGJ1dCBhbiBldmlsIHN0cmluZyB0aGUgc2Vjb25kIHRpbWUuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LCBuZXctY2FwXG4gICAgICBuZXcgdW5zYWZlRnVuY3Rpb24oZnVuY3Rpb25Cb2R5KTtcblxuICAgICAgaWYgKHN0cmluZ0luY2x1ZGVzKGZ1bmN0aW9uUGFyYW1zLCAnKScpKSB7XG4gICAgICAgIC8vIElmIHRoZSBmb3JtYWwgcGFyYW1ldGVycyBzdHJpbmcgaW5jbHVkZSApIC0gYW4gaWxsZWdhbFxuICAgICAgICAvLyBjaGFyYWN0ZXIgLSBpdCBtYXkgbWFrZSB0aGUgY29tYmluZWQgZnVuY3Rpb24gZXhwcmVzc2lvblxuICAgICAgICAvLyBjb21waWxlLiBXZSBhdm9pZCB0aGlzIHByb2JsZW0gYnkgY2hlY2tpbmcgZm9yIHRoaXMgZWFybHkgb24uXG5cbiAgICAgICAgLy8gbm90ZTogdjggdGhyb3dzIGp1c3QgbGlrZSB0aGlzIGRvZXMsIGJ1dCBjaHJvbWUgYWNjZXB0c1xuICAgICAgICAvLyBlLmcuICdhID0gbmV3IERhdGUoKSdcbiAgICAgICAgdGhyb3cgbmV3IHVuc2FmZUdsb2JhbC5TeW50YXhFcnJvcihcbiAgICAgICAgICAnc2hpbSBsaW1pdGF0aW9uOiBGdW5jdGlvbiBhcmcgc3RyaW5nIGNvbnRhaW5zIHBhcmVudGhlc2lzJ1xuICAgICAgICApO1xuICAgICAgICAvLyB0b2RvOiBzaGltIGludGVncml0eSB0aHJlYXQgaWYgdGhleSBjaGFuZ2UgU3ludGF4RXJyb3JcbiAgICAgIH1cblxuICAgICAgLy8gdG9kbzogY2hlY2sgdG8gbWFrZSBzdXJlIHRoaXMgLmxlbmd0aCBpcyBzYWZlLiBtYXJrbSBzYXlzIHNhZmUuXG4gICAgICBpZiAoZnVuY3Rpb25QYXJhbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBJZiB0aGUgZm9ybWFsIHBhcmFtZXRlcnMgaW5jbHVkZSBhbiB1bmJhbGFuY2VkIGJsb2NrIGNvbW1lbnQsIHRoZVxuICAgICAgICAvLyBmdW5jdGlvbiBtdXN0IGJlIHJlamVjdGVkLiBTaW5jZSBKYXZhU2NyaXB0IGRvZXMgbm90IGFsbG93IG5lc3RlZFxuICAgICAgICAvLyBjb21tZW50cyB3ZSBjYW4gaW5jbHVkZSBhIHRyYWlsaW5nIGJsb2NrIGNvbW1lbnQgdG8gY2F0Y2ggdGhpcy5cbiAgICAgICAgZnVuY3Rpb25QYXJhbXMgKz0gJ1xcbi8qYGAqLyc7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNyYyA9IGAoZnVuY3Rpb24oJHtmdW5jdGlvblBhcmFtc30pe1xcbiR7ZnVuY3Rpb25Cb2R5fVxcbn0pYDtcblxuICAgICAgcmV0dXJuIHNhZmVFdmFsKHNyYyk7XG4gICAgfTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IEZ1bmN0aW9uIGZyb20gYW55IGNvbXBhcnRtZW50IGluIGEgcm9vdCByZWFsbSBjYW4gYmUgdXNlZFxuICAgIC8vIHdpdGggaW5zdGFuY2UgY2hlY2tzIGluIGFueSBjb21wYXJ0bWVudCBvZiB0aGUgc2FtZSByb290IHJlYWxtLlxuICAgIHNldFByb3RvdHlwZU9mKHNhZmVGdW5jdGlvbiwgdW5zYWZlRnVuY3Rpb24ucHJvdG90eXBlKTtcblxuICAgIGFzc2VydChcbiAgICAgIGdldFByb3RvdHlwZU9mKHNhZmVGdW5jdGlvbikuY29uc3RydWN0b3IgIT09IEZ1bmN0aW9uLFxuICAgICAgJ2hpZGUgRnVuY3Rpb24nXG4gICAgKTtcbiAgICBhc3NlcnQoXG4gICAgICBnZXRQcm90b3R5cGVPZihzYWZlRnVuY3Rpb24pLmNvbnN0cnVjdG9yICE9PSB1bnNhZmVGdW5jdGlvbixcbiAgICAgICdoaWRlIHVuc2FmZUZ1bmN0aW9uJ1xuICAgICk7XG5cbiAgICBkZWZpbmVQcm9wZXJ0aWVzKHNhZmVGdW5jdGlvbiwge1xuICAgICAgLy8gRW5zdXJlIHRoYXQgYW55IGZ1bmN0aW9uIGNyZWF0ZWQgaW4gYW55IGNvbXBhcnRtZW50IGluIGEgcm9vdCByZWFsbSBpcyBhblxuICAgICAgLy8gaW5zdGFuY2Ugb2YgRnVuY3Rpb24gaW4gYW55IGNvbXBhcnRtZW50IG9mIHRoZSBzYW1lIHJvb3QgcmFsbS5cbiAgICAgIHByb3RvdHlwZTogeyB2YWx1ZTogdW5zYWZlRnVuY3Rpb24ucHJvdG90eXBlIH0sXG5cbiAgICAgIC8vIFByb3ZpZGUgYSBjdXN0b20gb3V0cHV0IHdpdGhvdXQgb3ZlcndyaXRpbmcgdGhlXG4gICAgICAvLyBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgd2hpY2ggaXMgY2FsbGVkIGJ5IHNvbWUgdGhpcmQtcGFydHlcbiAgICAgIC8vIGxpYnJhcmllcy5cbiAgICAgIHRvU3RyaW5nOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRXZhbChcIigpID0+ICdmdW5jdGlvbiBGdW5jdGlvbigpIHsgW3NoaW0gY29kZV0gfSdcIiksXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNhZmVGdW5jdGlvbjtcbiAgfVxuXG4gIC8vIE1pbWljIHByaXZhdGUgbWVtYmVycyBvbiB0aGUgcmVhbG0gaW5zdGFuY2VzLlxuICAvLyBXZSBkZWZpbmUgaXQgaW4gdGhlIHNhbWUgbW9kdWxlIGFuZCBkbyBub3QgZXhwb3J0IGl0LlxuICBjb25zdCBSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UgPSBuZXcgV2Vha01hcCgpO1xuXG4gIGZ1bmN0aW9uIGdldFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZShyZWFsbSkge1xuICAgIC8vIERldGVjdCBub24tb2JqZWN0cy5cbiAgICBhc3NlcnQoT2JqZWN0KHJlYWxtKSA9PT0gcmVhbG0sICdiYWQgb2JqZWN0LCBub3QgYSBSZWFsbSBpbnN0YW5jZScpO1xuICAgIC8vIFJlYWxtIGluc3RhbmNlIGhhcyBubyByZWFsbVJlYy4gU2hvdWxkIG5vdCBwcm9jZWVkLlxuICAgIGFzc2VydChSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UuaGFzKHJlYWxtKSwgJ1JlYWxtIGluc3RhbmNlIGhhcyBubyByZWNvcmQnKTtcblxuICAgIHJldHVybiBSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UuZ2V0KHJlYWxtKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHJlYWxtLCByZWFsbVJlYykge1xuICAgIC8vIERldGVjdCBub24tb2JqZWN0cy5cbiAgICBhc3NlcnQoT2JqZWN0KHJlYWxtKSA9PT0gcmVhbG0sICdiYWQgb2JqZWN0LCBub3QgYSBSZWFsbSBpbnN0YW5jZScpO1xuICAgIC8vIEF0dGVtcHQgdG8gY2hhbmdlIGFuIGV4aXN0aW5nIHJlYWxtUmVjIG9uIGEgcmVhbG0gaW5zdGFuY2UuIFNob3VsZCBub3QgcHJvY2VlZC5cbiAgICBhc3NlcnQoXG4gICAgICAhUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlLmhhcyhyZWFsbSksXG4gICAgICAnUmVhbG0gaW5zdGFuY2UgYWxyZWFkeSBoYXMgYSByZWNvcmQnXG4gICAgKTtcblxuICAgIFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZS5zZXQocmVhbG0sIHJlYWxtUmVjKTtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgdGhlIGdsb2JhbCB2YXJpYWJsZXMgZm9yIHRoZSBuZXcgUmVhbG0uXG4gIGZ1bmN0aW9uIHNldERlZmF1bHRCaW5kaW5ncyhzYWZlR2xvYmFsLCBzYWZlRXZhbCwgc2FmZUZ1bmN0aW9uKSB7XG4gICAgZGVmaW5lUHJvcGVydGllcyhzYWZlR2xvYmFsLCB7XG4gICAgICBldmFsOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRXZhbCxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIEZ1bmN0aW9uOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRnVuY3Rpb24sXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVJlYWxtUmVjKHVuc2FmZVJlYywgdHJhbnNmb3Jtcywgc2xvcHB5R2xvYmFscykge1xuICAgIGNvbnN0IHsgc2hhcmVkR2xvYmFsRGVzY3MsIHVuc2FmZUdsb2JhbCB9ID0gdW5zYWZlUmVjO1xuXG4gICAgY29uc3Qgc2FmZUdsb2JhbCA9IGNyZWF0ZSh1bnNhZmVHbG9iYWwuT2JqZWN0LnByb3RvdHlwZSwgc2hhcmVkR2xvYmFsRGVzY3MpO1xuXG4gICAgY29uc3Qgc2FmZUV2YWx1YXRvckZhY3RvcnkgPSBjcmVhdGVTYWZlRXZhbHVhdG9yRmFjdG9yeShcbiAgICAgIHVuc2FmZVJlYyxcbiAgICAgIHNhZmVHbG9iYWwsXG4gICAgICB0cmFuc2Zvcm1zLFxuICAgICAgc2xvcHB5R2xvYmFsc1xuICAgICk7XG4gICAgY29uc3Qgc2FmZUV2YWwgPSBjcmVhdGVTYWZlRXZhbHVhdG9yKHNhZmVFdmFsdWF0b3JGYWN0b3J5KTtcbiAgICBjb25zdCBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzID0gY3JlYXRlU2FmZUV2YWx1YXRvcldoaWNoVGFrZXNFbmRvd21lbnRzKFxuICAgICAgc2FmZUV2YWx1YXRvckZhY3RvcnlcbiAgICApO1xuICAgIGNvbnN0IHNhZmVGdW5jdGlvbiA9IGNyZWF0ZUZ1bmN0aW9uRXZhbHVhdG9yKHVuc2FmZVJlYywgc2FmZUV2YWwpO1xuXG4gICAgc2V0RGVmYXVsdEJpbmRpbmdzKHNhZmVHbG9iYWwsIHNhZmVFdmFsLCBzYWZlRnVuY3Rpb24pO1xuXG4gICAgY29uc3QgcmVhbG1SZWMgPSBmcmVlemUoe1xuICAgICAgc2FmZUdsb2JhbCxcbiAgICAgIHNhZmVFdmFsLFxuICAgICAgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyxcbiAgICAgIHNhZmVGdW5jdGlvblxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlYWxtUmVjO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgcm9vdCByZWFsbSB1c2VzIGEgZnJlc2ggc2V0IG9mIG5ldyBpbnRyaW5pY3MuIEhlcmUgd2UgZmlyc3QgY3JlYXRlXG4gICAqIGEgbmV3IHVuc2FmZSByZWNvcmQsIHdoaWNoIGluaGVyaXRzIHRoZSBzaGltcy4gVGhlbiB3ZSBwcm9jZWVkIHdpdGhcbiAgICogdGhlIGNyZWF0aW9uIG9mIHRoZSByZWFsbSByZWNvcmQsIGFuZCB3ZSBhcHBseSB0aGUgc2hpbXMuXG4gICAqL1xuICBmdW5jdGlvbiBpbml0Um9vdFJlYWxtKHBhcmVudFVuc2FmZVJlYywgc2VsZiwgb3B0aW9ucykge1xuICAgIC8vIG5vdGU6ICdzZWxmJyBpcyB0aGUgaW5zdGFuY2Ugb2YgdGhlIFJlYWxtLlxuXG4gICAgLy8gdG9kbzogaW52ZXN0aWdhdGUgYXR0YWNrcyB2aWEgQXJyYXkuc3BlY2llc1xuICAgIC8vIHRvZG86IHRoaXMgYWNjZXB0cyBuZXdTaGltcz0nc3RyaW5nJywgYnV0IGl0IHNob3VsZCByZWplY3QgdGhhdFxuICAgIGNvbnN0IHsgc2hpbXM6IG5ld1NoaW1zLCB0cmFuc2Zvcm1zLCBzbG9wcHlHbG9iYWxzIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IGFsbFNoaW1zID0gYXJyYXlDb25jYXQocGFyZW50VW5zYWZlUmVjLmFsbFNoaW1zLCBuZXdTaGltcyk7XG5cbiAgICAvLyBUaGUgdW5zYWZlIHJlY29yZCBpcyBjcmVhdGVkIGFscmVhZHkgcmVwYWlyZWQuXG4gICAgY29uc3QgdW5zYWZlUmVjID0gY3JlYXRlTmV3VW5zYWZlUmVjKGFsbFNoaW1zKTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11c2UtYmVmb3JlLWRlZmluZVxuICAgIGNvbnN0IFJlYWxtID0gY3JlYXRlUmVhbG1GYWNhZGUodW5zYWZlUmVjLCBCYXNlUmVhbG0pO1xuXG4gICAgLy8gQWRkIGEgUmVhbG0gZGVzY3JpcHRvciB0byBzaGFyZWRHbG9iYWxEZXNjcywgc28gaXQgY2FuIGJlIGRlZmluZWQgb250byB0aGVcbiAgICAvLyBzYWZlR2xvYmFsIGxpa2UgdGhlIHJlc3Qgb2YgdGhlIGdsb2JhbHMuXG4gICAgdW5zYWZlUmVjLnNoYXJlZEdsb2JhbERlc2NzLlJlYWxtID0ge1xuICAgICAgdmFsdWU6IFJlYWxtLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRpbmcgdGhlIHJlYWxtUmVjIHByb3ZpZGVzIHRoZSBnbG9iYWwgb2JqZWN0LCBldmFsKCkgYW5kIEZ1bmN0aW9uKClcbiAgICAvLyB0byB0aGUgcmVhbG0uXG4gICAgY29uc3QgcmVhbG1SZWMgPSBjcmVhdGVSZWFsbVJlYyh1bnNhZmVSZWMsIHRyYW5zZm9ybXMsIHNsb3BweUdsb2JhbHMpO1xuXG4gICAgLy8gQXBwbHkgYWxsIHNoaW1zIGluIHRoZSBuZXcgUm9vdFJlYWxtLiBXZSBkb24ndCBkbyB0aGlzIGZvciBjb21wYXJ0bWVudHMuXG4gICAgY29uc3QgeyBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzIH0gPSByZWFsbVJlYztcbiAgICBmb3IgKGNvbnN0IHNoaW0gb2YgYWxsU2hpbXMpIHtcbiAgICAgIHNhZmVFdmFsV2hpY2hUYWtlc0VuZG93bWVudHMoc2hpbSk7XG4gICAgfVxuXG4gICAgLy8gVGhlIHJlYWxtUmVjIGFjdHMgYXMgYSBwcml2YXRlIGZpZWxkIG9uIHRoZSByZWFsbSBpbnN0YW5jZS5cbiAgICByZWdpc3RlclJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZShzZWxmLCByZWFsbVJlYyk7XG4gIH1cblxuICAvKipcbiAgICogQSBjb21wYXJ0bWVudCBzaGFyZXMgdGhlIGludHJpbnNpY3Mgb2YgaXRzIHJvb3QgcmVhbG0uIEhlcmUsIG9ubHkgYVxuICAgKiByZWFsbVJlYyBpcyBuZWNlc3NhcnkgdG8gaG9sZCB0aGUgZ2xvYmFsIG9iamVjdCwgZXZhbCgpIGFuZCBGdW5jdGlvbigpLlxuICAgKi9cbiAgZnVuY3Rpb24gaW5pdENvbXBhcnRtZW50KHVuc2FmZVJlYywgc2VsZiwgb3B0aW9ucyA9IHt9KSB7XG4gICAgLy8gbm90ZTogJ3NlbGYnIGlzIHRoZSBpbnN0YW5jZSBvZiB0aGUgUmVhbG0uXG5cbiAgICBjb25zdCB7IHRyYW5zZm9ybXMsIHNsb3BweUdsb2JhbHMgfSA9IG9wdGlvbnM7XG4gICAgY29uc3QgcmVhbG1SZWMgPSBjcmVhdGVSZWFsbVJlYyh1bnNhZmVSZWMsIHRyYW5zZm9ybXMsIHNsb3BweUdsb2JhbHMpO1xuXG4gICAgLy8gVGhlIHJlYWxtUmVjIGFjdHMgYXMgYSBwcml2YXRlIGZpZWxkIG9uIHRoZSByZWFsbSBpbnN0YW5jZS5cbiAgICByZWdpc3RlclJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZShzZWxmLCByZWFsbVJlYyk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRSZWFsbUdsb2JhbChzZWxmKSB7XG4gICAgY29uc3QgeyBzYWZlR2xvYmFsIH0gPSBnZXRSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2Uoc2VsZik7XG4gICAgcmV0dXJuIHNhZmVHbG9iYWw7XG4gIH1cblxuICBmdW5jdGlvbiByZWFsbUV2YWx1YXRlKHNlbGYsIHgsIGVuZG93bWVudHMgPSB7fSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgLy8gdG9kbzogZG9uJ3QgcGFzcyBpbiBwcmltYWwtcmVhbG0gb2JqZWN0cyBsaWtlIHt9LCBmb3Igc2FmZXR5LiBPVE9IIGl0c1xuICAgIC8vIHByb3BlcnRpZXMgYXJlIGNvcGllZCBvbnRvIHRoZSBuZXcgZ2xvYmFsICd0YXJnZXQnLlxuICAgIC8vIHRvZG86IGZpZ3VyZSBvdXQgYSB3YXkgdG8gbWVtYnJhbmUgYXdheSB0aGUgY29udGVudHMgdG8gc2FmZXR5LlxuICAgIGNvbnN0IHsgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyB9ID0gZ2V0UmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHNlbGYpO1xuICAgIHJldHVybiBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzKHgsIGVuZG93bWVudHMsIG9wdGlvbnMpO1xuICB9XG5cbiAgY29uc3QgQmFzZVJlYWxtID0ge1xuICAgIGluaXRSb290UmVhbG0sXG4gICAgaW5pdENvbXBhcnRtZW50LFxuICAgIGdldFJlYWxtR2xvYmFsLFxuICAgIHJlYWxtRXZhbHVhdGVcbiAgfTtcblxuICAvLyBDcmVhdGUgdGhlIGN1cnJlbnQgdW5zYWZlUmVjIGZyb20gdGhlIGN1cnJlbnQgXCJwcmltYWxcIiBlbnZpcm9ubWVudCAodGhlIHJlYWxtXG4gIC8vIHdoZXJlIHRoZSBSZWFsbSBzaGltIGlzIGxvYWRlZCBhbmQgZXhlY3V0ZWQpLlxuICBjb25zdCBjdXJyZW50VW5zYWZlUmVjID0gY3JlYXRlQ3VycmVudFVuc2FmZVJlYygpO1xuXG4gIC8qKlxuICAgKiBUaGUgXCJwcmltYWxcIiByZWFsbSBjbGFzcyBpcyBkZWZpbmVkIGluIHRoZSBjdXJyZW50IFwicHJpbWFsXCIgZW52aXJvbm1lbnQsXG4gICAqIGFuZCBpcyBwYXJ0IG9mIHRoZSBzaGltLiBUaGVyZSBpcyBubyBuZWVkIHRvIGZhY2FkZSB0aGlzIGNsYXNzIHZpYSBldmFsdWF0aW9uXG4gICAqIGJlY2F1c2UgYm90aCBzaGFyZSB0aGUgc2FtZSBpbnRyaW5zaWNzLlxuICAgKi9cbiAgY29uc3QgUmVhbG0gPSBidWlsZENoaWxkUmVhbG0oY3VycmVudFVuc2FmZVJlYywgQmFzZVJlYWxtKTtcblxuICByZXR1cm4gUmVhbG07XG5cbn0pKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlYWxtcy1zaGltLnVtZC5qcy5tYXBcbiIsIi8vICAgICAgXG4vLyBBbiBldmVudCBoYW5kbGVyIGNhbiB0YWtlIGFuIG9wdGlvbmFsIGV2ZW50IGFyZ3VtZW50XG4vLyBhbmQgc2hvdWxkIG5vdCByZXR1cm4gYSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcblxuLy8gQW4gYXJyYXkgb2YgYWxsIGN1cnJlbnRseSByZWdpc3RlcmVkIGV2ZW50IGhhbmRsZXJzIGZvciBhIHR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbi8vIEEgbWFwIG9mIGV2ZW50IHR5cGVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIGV2ZW50IGhhbmRsZXJzLlxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gIFxuXG4vKiogTWl0dDogVGlueSAofjIwMGIpIGZ1bmN0aW9uYWwgZXZlbnQgZW1pdHRlciAvIHB1YnN1Yi5cbiAqICBAbmFtZSBtaXR0XG4gKiAgQHJldHVybnMge01pdHR9XG4gKi9cbmZ1bmN0aW9uIG1pdHQoYWxsICAgICAgICAgICAgICAgICApIHtcblx0YWxsID0gYWxsIHx8IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cblx0cmV0dXJuIHtcblx0XHQvKipcblx0XHQgKiBSZWdpc3RlciBhbiBldmVudCBoYW5kbGVyIGZvciB0aGUgZ2l2ZW4gdHlwZS5cblx0XHQgKlxuXHRcdCAqIEBwYXJhbSAge1N0cmluZ30gdHlwZVx0VHlwZSBvZiBldmVudCB0byBsaXN0ZW4gZm9yLCBvciBgXCIqXCJgIGZvciBhbGwgZXZlbnRzXG5cdFx0ICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgRnVuY3Rpb24gdG8gY2FsbCBpbiByZXNwb25zZSB0byBnaXZlbiBldmVudFxuXHRcdCAqIEBtZW1iZXJPZiBtaXR0XG5cdFx0ICovXG5cdFx0b246IGZ1bmN0aW9uIG9uKHR5cGUgICAgICAgICwgaGFuZGxlciAgICAgICAgICAgICAgKSB7XG5cdFx0XHQoYWxsW3R5cGVdIHx8IChhbGxbdHlwZV0gPSBbXSkpLnB1c2goaGFuZGxlcik7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyIGZvciB0aGUgZ2l2ZW4gdHlwZS5cblx0XHQgKlxuXHRcdCAqIEBwYXJhbSAge1N0cmluZ30gdHlwZVx0VHlwZSBvZiBldmVudCB0byB1bnJlZ2lzdGVyIGBoYW5kbGVyYCBmcm9tLCBvciBgXCIqXCJgXG5cdFx0ICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgSGFuZGxlciBmdW5jdGlvbiB0byByZW1vdmVcblx0XHQgKiBAbWVtYmVyT2YgbWl0dFxuXHRcdCAqL1xuXHRcdG9mZjogZnVuY3Rpb24gb2ZmKHR5cGUgICAgICAgICwgaGFuZGxlciAgICAgICAgICAgICAgKSB7XG5cdFx0XHRpZiAoYWxsW3R5cGVdKSB7XG5cdFx0XHRcdGFsbFt0eXBlXS5zcGxpY2UoYWxsW3R5cGVdLmluZGV4T2YoaGFuZGxlcikgPj4+IDAsIDEpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBJbnZva2UgYWxsIGhhbmRsZXJzIGZvciB0aGUgZ2l2ZW4gdHlwZS5cblx0XHQgKiBJZiBwcmVzZW50LCBgXCIqXCJgIGhhbmRsZXJzIGFyZSBpbnZva2VkIGFmdGVyIHR5cGUtbWF0Y2hlZCBoYW5kbGVycy5cblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlICBUaGUgZXZlbnQgdHlwZSB0byBpbnZva2Vcblx0XHQgKiBAcGFyYW0ge0FueX0gW2V2dF0gIEFueSB2YWx1ZSAob2JqZWN0IGlzIHJlY29tbWVuZGVkIGFuZCBwb3dlcmZ1bCksIHBhc3NlZCB0byBlYWNoIGhhbmRsZXJcblx0XHQgKiBAbWVtYmVyT2YgbWl0dFxuXHRcdCAqL1xuXHRcdGVtaXQ6IGZ1bmN0aW9uIGVtaXQodHlwZSAgICAgICAgLCBldnQgICAgICkge1xuXHRcdFx0KGFsbFt0eXBlXSB8fCBbXSkuc2xpY2UoKS5tYXAoZnVuY3Rpb24gKGhhbmRsZXIpIHsgaGFuZGxlcihldnQpOyB9KTtcblx0XHRcdChhbGxbJyonXSB8fCBbXSkuc2xpY2UoKS5tYXAoZnVuY3Rpb24gKGhhbmRsZXIpIHsgaGFuZGxlcih0eXBlLCBldnQpOyB9KTtcblx0XHR9XG5cdH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1pdHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1taXR0LmVzLmpzLm1hcFxuIiwiLyoqXHJcbiAqIFRoaXMgZmlsZSAoQXN5bmNDYWxsKSBpcyB1bmRlciBNSVQgTGljZW5zZVxyXG4gKlxyXG4gKiBUaGlzIGlzIGEgbGlnaHQgaW1wbGVtZW50YXRpb24gb2YgSlNPTiBSUEMgMi4wXHJcbiAqXHJcbiAqIGh0dHBzOi8vd3d3Lmpzb25ycGMub3JnL3NwZWNpZmljYXRpb25cclxuICpcclxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogRXh0ZW5kcyB0byB0aGUgc3BlY2lmaWNhdGlvbjpcclxuICpcclxuICogUmVxdWVzdCBvYmplY3Q6XHJcbiAqICAgICAgcmVtb3RlU3RhY2s/OiBzdHJpbmdcclxuICogICAgICAgICAgVGhpcyBwcm9wZXJ0eSB3aWxsIGhlbHAgc2VydmVyIHByaW50IHRoZSBsb2cgYmV0dGVyLlxyXG4gKlxyXG4gKiBFcnJvciBvYmplY3Q6XHJcbiAqICAgICAgZGF0YT86IHsgc3RhY2s/OiBzdHJpbmcsIHR5cGU/OiBzdHJpbmcgfVxyXG4gKiAgICAgICAgICBUaGlzIHByb3BlcnR5IHdpbGwgaGVscCBjbGllbnQgdG8gYnVpbGQgYSBiZXR0ZXIgRXJyb3Igb2JqZWN0LlxyXG4gKiAgICAgICAgICAgICAgU3VwcG9ydGVkIHZhbHVlIGZvciBcInR5cGVcIiBmaWVsZCAoRGVmaW5lZCBpbiBFQ01BU2NyaXB0IHN0YW5kYXJkKTpcclxuICogICAgICAgICAgICAgICAgICBFcnJvciwgRXZhbEVycm9yLCBSYW5nZUVycm9yLCBSZWZlcmVuY2VFcnJvcixcclxuICogICAgICAgICAgICAgICAgICBTeW50YXhFcnJvciwgVHlwZUVycm9yLCBVUklFcnJvclxyXG4gKlxyXG4gKiBSZXNwb25zZSBvYmplY3Q6XHJcbiAqICAgICAgcmVzdWx0SXNVbmRlZmluZWQ/OiBib29sZWFuXHJcbiAqICAgICAgICAgIFRoaXMgcHJvcGVydHkgaXMgYSBoaW50LiBJZiB0aGUgY2xpZW50IGlzIHJ1biBpbiBKYXZhU2NyaXB0LFxyXG4gKiAgICAgICAgICBpdCBzaG91bGQgdHJlYXQgXCJyZXN1bHQ6IG51bGxcIiBhcyBcInJlc3VsdDogdW5kZWZpbmVkXCJcclxuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICogSW1wbGVtZW50ZWQgSlNPTiBSUEMgZXh0ZW5zaW9uIChpbnRlcm5hbCBtZXRob2RzKTpcclxuICogTm9uZVxyXG4gKi9cclxuaW1wb3J0IHsgTWVzc2FnZUNlbnRlciB9IGZyb20gJy4uL0V4dGVuc2lvbi9NZXNzYWdlQ2VudGVyJztcclxuLyoqXHJcbiAqIFNlcmlhbGl6YXRpb24gaW1wbGVtZW50YXRpb24gdGhhdCBkbyBub3RoaW5nXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgTm9TZXJpYWxpemF0aW9uID0ge1xyXG4gICAgYXN5bmMgc2VyaWFsaXphdGlvbihmcm9tKSB7XHJcbiAgICAgICAgcmV0dXJuIGZyb207XHJcbiAgICB9LFxyXG4gICAgYXN5bmMgZGVzZXJpYWxpemF0aW9uKHNlcmlhbGl6ZWQpIHtcclxuICAgICAgICByZXR1cm4gc2VyaWFsaXplZDtcclxuICAgIH0sXHJcbn07XHJcbi8qKlxyXG4gKiBTZXJpYWxpemF0aW9uIGltcGxlbWVudGF0aW9uIGJ5IEpTT04ucGFyc2Uvc3RyaW5naWZ5XHJcbiAqXHJcbiAqIEBwYXJhbSByZXBsYWNlckFuZFJlY2VpdmVyIC0gUmVwbGFjZXIgb2YgSlNPTi5wYXJzZS9zdHJpbmdpZnlcclxuICovXHJcbmV4cG9ydCBjb25zdCBKU09OU2VyaWFsaXphdGlvbiA9IChbcmVwbGFjZXIsIHJlY2VpdmVyXSA9IFt1bmRlZmluZWQsIHVuZGVmaW5lZF0sIHNwYWNlKSA9PiAoe1xyXG4gICAgYXN5bmMgc2VyaWFsaXphdGlvbihmcm9tKSB7XHJcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGZyb20sIHJlcGxhY2VyLCBzcGFjZSk7XHJcbiAgICB9LFxyXG4gICAgYXN5bmMgZGVzZXJpYWxpemF0aW9uKHNlcmlhbGl6ZWQpIHtcclxuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShzZXJpYWxpemVkLCByZWNlaXZlcik7XHJcbiAgICB9LFxyXG59KTtcclxuY29uc3QgQXN5bmNDYWxsRGVmYXVsdE9wdGlvbnMgPSAoKGEpID0+IGEpKHtcclxuICAgIHNlcmlhbGl6ZXI6IE5vU2VyaWFsaXphdGlvbixcclxuICAgIGtleTogJ2RlZmF1bHQtanNvbnJwYycsXHJcbiAgICBzdHJpY3Q6IGZhbHNlLFxyXG4gICAgbG9nOiB0cnVlLFxyXG4gICAgcGFyYW1ldGVyU3RydWN0dXJlczogJ2J5LXBvc2l0aW9uJyxcclxuICAgIHByZWZlckxvY2FsSW1wbGVtZW50YXRpb246IGZhbHNlLFxyXG59KTtcclxuLyoqXHJcbiAqIEFzeW5jIGNhbGwgYmV0d2VlbiBkaWZmZXJlbnQgY29udGV4dC5cclxuICpcclxuICogQHJlbWFya3NcclxuICogQXN5bmMgY2FsbCBpcyBhIGhpZ2ggbGV2ZWwgYWJzdHJhY3Rpb24gb2YgTWVzc2FnZUNlbnRlci5cclxuICpcclxuICogIyBTaGFyZWQgY29kZVxyXG4gKlxyXG4gKiAtIEhvdyB0byBzdHJpbmdpZnkvcGFyc2UgcGFyYW1ldGVycy9yZXR1cm5zIHNob3VsZCBiZSBzaGFyZWQsIGRlZmF1bHRzIHRvIE5vU2VyaWFsaXphdGlvbi5cclxuICpcclxuICogLSBga2V5YCBzaG91bGQgYmUgc2hhcmVkLlxyXG4gKlxyXG4gKiAjIE9uZSBzaWRlXHJcbiAqXHJcbiAqIC0gU2hvdWxkIHByb3ZpZGUgc29tZSBmdW5jdGlvbnMgdGhlbiBleHBvcnQgaXRzIHR5cGUgKGZvciBleGFtcGxlLCBgQmFja2dyb3VuZENhbGxzYClcclxuICpcclxuICogLSBgY29uc3QgY2FsbCA9IEFzeW5jQ2FsbDxGb3JlZ3JvdW5kQ2FsbHM+KGJhY2tncm91bmRDYWxscylgXHJcbiAqXHJcbiAqIC0gVGhlbiB5b3UgY2FuIGBjYWxsYCBhbnkgbWV0aG9kIG9uIGBGb3JlZ3JvdW5kQ2FsbHNgXHJcbiAqXHJcbiAqICMgT3RoZXIgc2lkZVxyXG4gKlxyXG4gKiAtIFNob3VsZCBwcm92aWRlIHNvbWUgZnVuY3Rpb25zIHRoZW4gZXhwb3J0IGl0cyB0eXBlIChmb3IgZXhhbXBsZSwgYEZvcmVncm91bmRDYWxsc2ApXHJcbiAqXHJcbiAqIC0gYGNvbnN0IGNhbGwgPSBBc3luY0NhbGw8QmFja2dyb3VuZENhbGxzPihmb3JlZ3JvdW5kQ2FsbHMpYFxyXG4gKlxyXG4gKiAtIFRoZW4geW91IGNhbiBgY2FsbGAgYW55IG1ldGhvZCBvbiBgQmFja2dyb3VuZENhbGxzYFxyXG4gKlxyXG4gKiBOb3RlOiBUd28gc2lkZXMgY2FuIGltcGxlbWVudCB0aGUgc2FtZSBmdW5jdGlvblxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBGb3IgZXhhbXBsZSwgaGVyZSBpcyBhIG1vbm8gcmVwby5cclxuICpcclxuICogQ29kZSBmb3IgVUkgcGFydDpcclxuICogYGBgdHNcclxuICogY29uc3QgVUkgPSB7XHJcbiAqICAgICAgYXN5bmMgZGlhbG9nKHRleHQ6IHN0cmluZykge1xyXG4gKiAgICAgICAgICBhbGVydCh0ZXh0KVxyXG4gKiAgICAgIH0sXHJcbiAqIH1cclxuICogZXhwb3J0IHR5cGUgVUkgPSB0eXBlb2YgVUlcclxuICogY29uc3QgY2FsbHNDbGllbnQgPSBBc3luY0NhbGw8U2VydmVyPihVSSlcclxuICogY2FsbHNDbGllbnQuc2VuZE1haWwoJ2hlbGxvIHdvcmxkJywgJ3doYXQnKVxyXG4gKiBgYGBcclxuICpcclxuICogQ29kZSBmb3Igc2VydmVyIHBhcnRcclxuICogYGBgdHNcclxuICogY29uc3QgU2VydmVyID0ge1xyXG4gKiAgICAgIGFzeW5jIHNlbmRNYWlsKHRleHQ6IHN0cmluZywgdG86IHN0cmluZykge1xyXG4gKiAgICAgICAgICByZXR1cm4gdHJ1ZVxyXG4gKiAgICAgIH1cclxuICogfVxyXG4gKiBleHBvcnQgdHlwZSBTZXJ2ZXIgPSB0eXBlb2YgU2VydmVyXHJcbiAqIGNvbnN0IGNhbGxzID0gQXN5bmNDYWxsPFVJPihTZXJ2ZXIpXHJcbiAqIGNhbGxzLmRpYWxvZygnaGVsbG8nKVxyXG4gKiBgYGBcclxuICpcclxuICogQHBhcmFtIGltcGxlbWVudGF0aW9uIC0gSW1wbGVtZW50YXRpb24gb2YgdGhpcyBzaWRlLlxyXG4gKiBAcGFyYW0gb3B0aW9ucyAtIERlZmluZSB5b3VyIG93biBzZXJpYWxpemVyLCBNZXNzYWdlQ2VudGVyIG9yIG90aGVyIG9wdGlvbnMuXHJcbiAqXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gQXN5bmNDYWxsKGltcGxlbWVudGF0aW9uID0ge30sIG9wdGlvbnMgPSB7fSkge1xyXG4gICAgY29uc3QgeyBzZXJpYWxpemVyLCBrZXksIHN0cmljdCwgbG9nLCBwYXJhbWV0ZXJTdHJ1Y3R1cmVzLCBwcmVmZXJMb2NhbEltcGxlbWVudGF0aW9uIH0gPSB7XHJcbiAgICAgICAgLi4uQXN5bmNDYWxsRGVmYXVsdE9wdGlvbnMsXHJcbiAgICAgICAgLi4ub3B0aW9ucyxcclxuICAgIH07XHJcbiAgICBjb25zdCBtZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlQ2hhbm5lbCB8fCBuZXcgTWVzc2FnZUNlbnRlcigpO1xyXG4gICAgY29uc3QgeyBtZXRob2ROb3RGb3VuZDogYmFuTWV0aG9kTm90Rm91bmQgPSBmYWxzZSwgbm9VbmRlZmluZWQ6IG5vVW5kZWZpbmVkS2VlcGluZyA9IGZhbHNlLCB1bmtub3duTWVzc2FnZTogYmFuVW5rbm93bk1lc3NhZ2UgPSBmYWxzZSwgfSA9IGNhbGNTdHJpY3RPcHRpb25zKHN0cmljdCk7XHJcbiAgICBjb25zdCB7IGJlQ2FsbGVkOiBsb2dCZUNhbGxlZCA9IHRydWUsIGxvY2FsRXJyb3I6IGxvZ0xvY2FsRXJyb3IgPSB0cnVlLCByZW1vdGVFcnJvcjogbG9nUmVtb3RlRXJyb3IgPSB0cnVlLCB0eXBlOiBsb2dUeXBlID0gJ3ByZXR0eScsIHNlbmRMb2NhbFN0YWNrID0gZmFsc2UsIH0gPSBjYWxjTG9nT3B0aW9ucyhsb2cpO1xyXG4gICAgY29uc3QgcmVxdWVzdENvbnRleHQgPSBuZXcgTWFwKCk7XHJcbiAgICBhc3luYyBmdW5jdGlvbiBvblJlcXVlc3QoZGF0YSkge1xyXG4gICAgICAgIGxldCBmcmFtZXdvcmtTdGFjayA9ICcnO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vID8gV2UncmUgbm90IGltcGxlbWVudGluZyBhbnkgSlNPTiBSUEMgZXh0ZW5zaW9uLiBTbyBsZXQgaXQgdG8gYmUgdW5kZWZpbmVkLlxyXG4gICAgICAgICAgICBjb25zdCBrZXkgPSAoZGF0YS5tZXRob2Quc3RhcnRzV2l0aCgncnBjLicpXHJcbiAgICAgICAgICAgICAgICA/IGdldFJQQ1N5bWJvbEZyb21TdHJpbmcoZGF0YS5tZXRob2QpXHJcbiAgICAgICAgICAgICAgICA6IGRhdGEubWV0aG9kKTtcclxuICAgICAgICAgICAgY29uc3QgZXhlY3V0b3IgPSBpbXBsZW1lbnRhdGlvbltrZXldO1xyXG4gICAgICAgICAgICBpZiAoIWV4ZWN1dG9yIHx8IHR5cGVvZiBleGVjdXRvciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFiYW5NZXRob2ROb3RGb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2dMb2NhbEVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNlaXZlIHJlbW90ZSBjYWxsLCBidXQgbm90IGltcGxlbWVudGVkLicsIGtleSwgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFcnJvclJlc3BvbnNlLk1ldGhvZE5vdEZvdW5kKGRhdGEuaWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IGRhdGEucGFyYW1zO1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJhbXMpIHx8ICh0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0JyAmJiBwYXJhbXMgIT09IG51bGwpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhcmdzID0gQXJyYXkuaXNBcnJheShwYXJhbXMpID8gcGFyYW1zIDogW3BhcmFtc107XHJcbiAgICAgICAgICAgICAgICBmcmFtZXdvcmtTdGFjayA9IHJlbW92ZVN0YWNrSGVhZGVyKG5ldyBFcnJvcigpLnN0YWNrKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShleGVjdXRvciguLi5hcmdzKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChsb2dCZUNhbGxlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2dUeXBlID09PSAnYmFzaWMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgJHtvcHRpb25zLmtleX0uJHtkYXRhLm1ldGhvZH0oJHtbLi4uYXJnc10udG9TdHJpbmcoKX0pIEAke2RhdGEuaWR9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxvZ0FyZ3MgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgJHtvcHRpb25zLmtleX0uJWMke2RhdGEubWV0aG9kfSVjKCR7YXJncy5tYXAoKCkgPT4gJyVvJykuam9pbignLCAnKX0lYylcXG4lbyAlY0Ake2RhdGEuaWR9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdjb2xvcjogI2QyYzA1NycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmFyZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnY29sb3I6IGdyYXk7IGZvbnQtc3R5bGU6IGl0YWxpYzsnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5yZW1vdGVTdGFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5ncm91cENvbGxhcHNlZCguLi5sb2dBcmdzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEucmVtb3RlU3RhY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5ncm91cEVuZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKC4uLmxvZ0FyZ3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHByb21pc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ID09PSAkQXN5bmNDYWxsSWdub3JlUmVzcG9uc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdWNjZXNzUmVzcG9uc2UoZGF0YS5pZCwgYXdhaXQgcHJvbWlzZSwgISFub1VuZGVmaW5lZEtlZXBpbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEVycm9yUmVzcG9uc2UuSW52YWxpZFJlcXVlc3QoZGF0YS5pZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgZS5zdGFjayA9IGZyYW1ld29ya1N0YWNrXHJcbiAgICAgICAgICAgICAgICAuc3BsaXQoJ1xcbicpXHJcbiAgICAgICAgICAgICAgICAucmVkdWNlKChzdGFjaywgZnN0YWNrKSA9PiBzdGFjay5yZXBsYWNlKGZzdGFjayArICdcXG4nLCAnJyksIGUuc3RhY2sgfHwgJycpO1xyXG4gICAgICAgICAgICBpZiAobG9nTG9jYWxFcnJvcilcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgIGxldCBuYW1lID0gJ0Vycm9yJztcclxuICAgICAgICAgICAgbmFtZSA9IGUuY29uc3RydWN0b3IubmFtZTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBET01FeGNlcHRpb24gPT09ICdmdW5jdGlvbicgJiYgZSBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbilcclxuICAgICAgICAgICAgICAgIG5hbWUgPSAnRE9NRXhjZXB0aW9uOicgKyBlLm5hbWU7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3JSZXNwb25zZShkYXRhLmlkLCAtMSwgZS5tZXNzYWdlLCBlLnN0YWNrLCBuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBhc3luYyBmdW5jdGlvbiBvblJlc3BvbnNlKGRhdGEpIHtcclxuICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gJycsIHJlbW90ZUVycm9yU3RhY2sgPSAnJywgZXJyb3JDb2RlID0gMCwgZXJyb3JUeXBlID0gJ0Vycm9yJztcclxuICAgICAgICBpZiAoaGFzS2V5KGRhdGEsICdlcnJvcicpKSB7XHJcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGRhdGEuZXJyb3IubWVzc2FnZTtcclxuICAgICAgICAgICAgZXJyb3JDb2RlID0gZGF0YS5lcnJvci5jb2RlO1xyXG4gICAgICAgICAgICByZW1vdGVFcnJvclN0YWNrID0gKGRhdGEuZXJyb3IuZGF0YSAmJiBkYXRhLmVycm9yLmRhdGEuc3RhY2spIHx8ICc8cmVtb3RlIHN0YWNrIG5vdCBhdmFpbGFibGU+JztcclxuICAgICAgICAgICAgZXJyb3JUeXBlID0gKGRhdGEuZXJyb3IuZGF0YSAmJiBkYXRhLmVycm9yLmRhdGEudHlwZSkgfHwgJ0Vycm9yJztcclxuICAgICAgICAgICAgaWYgKGxvZ1JlbW90ZUVycm9yKVxyXG4gICAgICAgICAgICAgICAgbG9nVHlwZSA9PT0gJ2Jhc2ljJ1xyXG4gICAgICAgICAgICAgICAgICAgID8gY29uc29sZS5lcnJvcihgJHtlcnJvclR5cGV9OiAke2Vycm9yTWVzc2FnZX0oJHtlcnJvckNvZGV9KSBAJHtkYXRhLmlkfVxcbiR7cmVtb3RlRXJyb3JTdGFja31gKVxyXG4gICAgICAgICAgICAgICAgICAgIDogY29uc29sZS5lcnJvcihgJHtlcnJvclR5cGV9OiAke2Vycm9yTWVzc2FnZX0oJHtlcnJvckNvZGV9KSAlY0Ake2RhdGEuaWR9XFxuJWMke3JlbW90ZUVycm9yU3RhY2t9YCwgJ2NvbG9yOiBncmF5JywgJycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5pZCA9PT0gbnVsbCB8fCBkYXRhLmlkID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjb25zdCB7IGY6IFtyZXNvbHZlLCByZWplY3RdLCBzdGFjazogbG9jYWxFcnJvclN0YWNrLCB9ID0gcmVxdWVzdENvbnRleHQuZ2V0KGRhdGEuaWQpIHx8IHsgc3RhY2s6ICcnLCBmOiBbbnVsbCwgbnVsbF0gfTtcclxuICAgICAgICBpZiAoIXJlc29sdmUpXHJcbiAgICAgICAgICAgIHJldHVybjsgLy8gZHJvcCB0aGlzIHJlc3BvbnNlXHJcbiAgICAgICAgcmVxdWVzdENvbnRleHQuZGVsZXRlKGRhdGEuaWQpO1xyXG4gICAgICAgIGlmIChoYXNLZXkoZGF0YSwgJ2Vycm9yJykpIHtcclxuICAgICAgICAgICAgcmVqZWN0KFJlY292ZXJFcnJvcihlcnJvclR5cGUsIGVycm9yTWVzc2FnZSwgZXJyb3JDb2RlLCBcclxuICAgICAgICAgICAgLy8gPyBXZSB1c2UgXFx1MDQzMCB3aGljaCBsb29rcyBsaWtlIFwiYVwiIHRvIHByZXZlbnQgYnJvd3NlciB0aGluayBcImF0IEFzeW5jQ2FsbFwiIGlzIGEgcmVhbCBzdGFja1xyXG4gICAgICAgICAgICByZW1vdGVFcnJvclN0YWNrICsgJ1xcbiAgICBcXHUwNDMwdCBBc3luY0NhbGwgKHJwYykgXFxuJyArIGxvY2FsRXJyb3JTdGFjaykpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmVzb2x2ZShkYXRhLnJlc3VsdCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgbWVzc2FnZS5vbihrZXksIGFzeW5jIChfKSA9PiB7XHJcbiAgICAgICAgbGV0IGRhdGE7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBkYXRhID0gYXdhaXQgc2VyaWFsaXplci5kZXNlcmlhbGl6YXRpb24oXyk7XHJcbiAgICAgICAgICAgIGlmIChpc0pTT05SUENPYmplY3QoZGF0YSkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IGhhbmRsZVNpbmdsZU1lc3NhZ2UoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0KVxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNlbmQocmVzdWx0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KGRhdGEpICYmIGRhdGEuZXZlcnkoaXNKU09OUlBDT2JqZWN0KSAmJiBkYXRhLmxlbmd0aCAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5hbGwoZGF0YS5tYXAoaGFuZGxlU2luZ2xlTWVzc2FnZSkpO1xyXG4gICAgICAgICAgICAgICAgLy8gPyBSZXNwb25zZVxyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuZXZlcnkoeCA9PiB4ID09PSB1bmRlZmluZWQpKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHNlbmQocmVzdWx0LmZpbHRlcih4ID0+IHgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmIChiYW5Vbmtub3duTWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNlbmQoRXJyb3JSZXNwb25zZS5JbnZhbGlkUmVxdWVzdChkYXRhLmlkIHx8IG51bGwpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vID8gSWdub3JlIHRoaXMgbWVzc2FnZS4gVGhlIG1lc3NhZ2UgY2hhbm5lbCBtYXliZSBhbHNvIHVzZWQgdG8gdHJhbnNmZXIgb3RoZXIgbWVzc2FnZSB0b28uXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlLCBkYXRhLCByZXN1bHQpO1xyXG4gICAgICAgICAgICBzZW5kKEVycm9yUmVzcG9uc2UuUGFyc2VFcnJvcihlLnN0YWNrKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIHNlbmQocmVzKSB7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlcykpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGx5ID0gcmVzLm1hcCh4ID0+IHgpLmZpbHRlcih4ID0+IHguaWQgIT09IHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVwbHkubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2UuZW1pdChrZXksIGF3YWl0IHNlcmlhbGl6ZXIuc2VyaWFsaXphdGlvbihyZXBseSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFyZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgLy8gPyBUaGlzIGlzIGEgTm90aWZpY2F0aW9uLCB3ZSBNVVNUIG5vdCByZXR1cm4gaXQuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzLmlkID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZS5lbWl0KGtleSwgYXdhaXQgc2VyaWFsaXplci5zZXJpYWxpemF0aW9uKHJlcykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gbmV3IFByb3h5KHt9LCB7XHJcbiAgICAgICAgZ2V0KF90YXJnZXQsIG1ldGhvZCkge1xyXG4gICAgICAgICAgICBsZXQgc3RhY2sgPSByZW1vdmVTdGFja0hlYWRlcihuZXcgRXJyb3IoKS5zdGFjayk7XHJcbiAgICAgICAgICAgIHJldHVybiAoLi4ucGFyYW1zKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnRlcm5hbE1ldGhvZCA9IGdldFN0cmluZ0Zyb21SUENTeW1ib2wobWV0aG9kKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJuYWxNZXRob2QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9IGludGVybmFsTWV0aG9kO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ1tBc3luY0NhbGxdIE9ubHkgc3RyaW5nIGNhbiBiZSB0aGUgbWV0aG9kIG5hbWUnKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChtZXRob2Quc3RhcnRzV2l0aCgncnBjLicpKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKCdbQXN5bmNDYWxsXSBZb3UgY2Fubm90IGNhbGwgSlNPTiBSUEMgaW50ZXJuYWwgbWV0aG9kcyBkaXJlY3RseScpKTtcclxuICAgICAgICAgICAgICAgIGlmIChwcmVmZXJMb2NhbEltcGxlbWVudGF0aW9uICYmIHR5cGVvZiBtZXRob2QgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbG9jYWxJbXBsID0gaW1wbGVtZW50YXRpb25bbWV0aG9kXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobG9jYWxJbXBsICYmIHR5cGVvZiBsb2NhbEltcGwgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShsb2NhbEltcGwoLi4ucGFyYW1zKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpZCA9IGdlbmVyYXRlUmFuZG9tSUQoKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJhbTAgPSBwYXJhbXNbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VuZGluZ1N0YWNrID0gc2VuZExvY2FsU3RhY2sgPyBzdGFjayA6ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtID0gcGFyYW1ldGVyU3RydWN0dXJlcyA9PT0gJ2J5LW5hbWUnICYmIHBhcmFtcy5sZW5ndGggPT09IDEgJiYgaXNPYmplY3QocGFyYW0wKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHBhcmFtMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHBhcmFtcztcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaWQsIG1ldGhvZCwgcGFyYW0sIHNlbmRpbmdTdGFjayk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VyaWFsaXplci5zZXJpYWxpemF0aW9uKHJlcXVlc3QpLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UuZW1pdChrZXksIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0Q29udGV4dC5zZXQoaWQsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGY6IFtyZXNvbHZlLCByZWplY3RdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG4gICAgfSk7XHJcbiAgICBhc3luYyBmdW5jdGlvbiBoYW5kbGVTaW5nbGVNZXNzYWdlKGRhdGEpIHtcclxuICAgICAgICBpZiAoaGFzS2V5KGRhdGEsICdtZXRob2QnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gb25SZXF1ZXN0KGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICgnZXJyb3InIGluIGRhdGEgfHwgJ3Jlc3VsdCcgaW4gZGF0YSkge1xyXG4gICAgICAgICAgICBvblJlc3BvbnNlKGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKCdyZXN1bHRJc1VuZGVmaW5lZCcgaW4gZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5yZXN1bHQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICBvblJlc3BvbnNlKGRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiBFcnJvclJlc3BvbnNlLkludmFsaWRSZXF1ZXN0KGRhdGEuaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG59XHJcbmNvbnN0ICRBc3luY0NhbGxJZ25vcmVSZXNwb25zZSA9IFN5bWJvbCgnVGhpcyByZXNwb25zZSBzaG91bGQgYmUgaWdub3JlZC4nKTtcclxuY29uc3QgJEFzeW5jSXRlcmF0b3JTdGFydFN0cmluZyA9ICdycGMuYXN5bmMtaXRlcmF0b3Iuc3RhcnQnO1xyXG5jb25zdCAkQXN5bmNJdGVyYXRvck5leHRTdHJpbmcgPSAncnBjLmFzeW5jLWl0ZXJhdG9yLm5leHQnO1xyXG5jb25zdCAkQXN5bmNJdGVyYXRvclJldHVyblN0cmluZyA9ICdycGMuYXN5bmMtaXRlcmF0b3IucmV0dXJuJztcclxuY29uc3QgJEFzeW5jSXRlcmF0b3JUaHJvd1N0cmluZyA9ICdycGMuYXN5bmMtaXRlcmF0b3IudGhyb3cnO1xyXG5jb25zdCAkQXN5bmNJdGVyYXRvclN0YXJ0ID0gU3ltYm9sKCRBc3luY0l0ZXJhdG9yU3RhcnRTdHJpbmcpO1xyXG5jb25zdCAkQXN5bmNJdGVyYXRvck5leHQgPSBTeW1ib2woJEFzeW5jSXRlcmF0b3JOZXh0U3RyaW5nKTtcclxuY29uc3QgJEFzeW5jSXRlcmF0b3JSZXR1cm4gPSBTeW1ib2woJEFzeW5jSXRlcmF0b3JSZXR1cm5TdHJpbmcpO1xyXG5jb25zdCAkQXN5bmNJdGVyYXRvclRocm93ID0gU3ltYm9sKCRBc3luY0l0ZXJhdG9yVGhyb3dTdHJpbmcpO1xyXG5jb25zdCBJbnRlcm5hbE1ldGhvZE1hcCA9IHtcclxuICAgIFskQXN5bmNJdGVyYXRvclN0YXJ0XTogJEFzeW5jSXRlcmF0b3JTdGFydFN0cmluZyxcclxuICAgIFskQXN5bmNJdGVyYXRvck5leHRdOiAkQXN5bmNJdGVyYXRvck5leHRTdHJpbmcsXHJcbiAgICBbJEFzeW5jSXRlcmF0b3JSZXR1cm5dOiAkQXN5bmNJdGVyYXRvclJldHVyblN0cmluZyxcclxuICAgIFskQXN5bmNJdGVyYXRvclRocm93XTogJEFzeW5jSXRlcmF0b3JUaHJvd1N0cmluZyxcclxuICAgIC8vIFJldmVyc2UgbWFwXHJcbiAgICBbJEFzeW5jSXRlcmF0b3JTdGFydFN0cmluZ106ICRBc3luY0l0ZXJhdG9yU3RhcnQsXHJcbiAgICBbJEFzeW5jSXRlcmF0b3JOZXh0U3RyaW5nXTogJEFzeW5jSXRlcmF0b3JOZXh0LFxyXG4gICAgWyRBc3luY0l0ZXJhdG9yUmV0dXJuU3RyaW5nXTogJEFzeW5jSXRlcmF0b3JSZXR1cm4sXHJcbiAgICBbJEFzeW5jSXRlcmF0b3JUaHJvd1N0cmluZ106ICRBc3luY0l0ZXJhdG9yVGhyb3csXHJcbiAgICAvLyBlbXB0eVxyXG4gICAgdW5kZWZpbmVkOiBudWxsLFxyXG4gICAgbnVsbDogdW5kZWZpbmVkLFxyXG59O1xyXG5mdW5jdGlvbiBnZW5lcmF0ZVJhbmRvbUlEKCkge1xyXG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKClcclxuICAgICAgICAudG9TdHJpbmcoMzYpXHJcbiAgICAgICAgLnNsaWNlKDIpO1xyXG59XHJcbmZ1bmN0aW9uIGdldFN0cmluZ0Zyb21SUENTeW1ib2woc3ltYm9sKSB7XHJcbiAgICBpZiAodHlwZW9mIHN5bWJvbCAhPT0gJ3N5bWJvbCcpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAvLyBAdHMtaWdub3JlXHJcbiAgICByZXR1cm4gSW50ZXJuYWxNZXRob2RNYXBbc3ltYm9sXTtcclxufVxyXG5mdW5jdGlvbiBnZXRSUENTeW1ib2xGcm9tU3RyaW5nKHN0cmluZykge1xyXG4gICAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgcmV0dXJuIEludGVybmFsTWV0aG9kTWFwW3N0cmluZ107XHJcbn1cclxuLyoqXHJcbiAqIFRoaXMgZnVuY3Rpb24gcHJvdmlkZXMgdGhlIGFzeW5jIGdlbmVyYXRvciB2ZXJzaW9uIG9mIHRoZSBBc3luY0NhbGxcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBBc3luY0dlbmVyYXRvckNhbGwoaW1wbGVtZW50YXRpb24gPSB7fSwgb3B0aW9ucyA9IHt9KSB7XHJcbiAgICBjb25zdCBpdGVyYXRvcnMgPSBuZXcgTWFwKCk7XHJcbiAgICBjb25zdCBzdHJpY3QgPSBjYWxjU3RyaWN0T3B0aW9ucyhvcHRpb25zLnN0cmljdCB8fCBmYWxzZSk7XHJcbiAgICBmdW5jdGlvbiBmaW5kSXRlcmF0b3IoaWQsIGxhYmVsKSB7XHJcbiAgICAgICAgY29uc3QgaXQgPSBpdGVyYXRvcnMuZ2V0KGlkKTtcclxuICAgICAgICBpZiAoIWl0KSB7XHJcbiAgICAgICAgICAgIGlmIChzdHJpY3QubWV0aG9kTm90Rm91bmQpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFJlbW90ZSBpdGVyYXRvciBub3QgZm91bmQgd2hpbGUgZXhlY3V0aW5nICR7bGFiZWx9YCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiAkQXN5bmNDYWxsSWdub3JlUmVzcG9uc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpdDtcclxuICAgIH1cclxuICAgIGNvbnN0IHNlcnZlciA9IHtcclxuICAgICAgICBbJEFzeW5jSXRlcmF0b3JTdGFydF0obWV0aG9kLCBhcmdzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZXJhdG9yR2VuZXJhdG9yID0gUmVmbGVjdC5nZXQoaW1wbGVtZW50YXRpb24sIG1ldGhvZCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlcmF0b3JHZW5lcmF0b3IgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJpY3QubWV0aG9kTm90Rm91bmQpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1ldGhvZCArICcgaXMgbm90IGEgZnVuY3Rpb24nKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJEFzeW5jQ2FsbElnbm9yZVJlc3BvbnNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IGl0ZXJhdG9yID0gaXRlcmF0b3JHZW5lcmF0b3IoLi4uYXJncyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkID0gZ2VuZXJhdGVSYW5kb21JRCgpO1xyXG4gICAgICAgICAgICBpdGVyYXRvcnMuc2V0KGlkLCBpdGVyYXRvcik7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaWQpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgWyRBc3luY0l0ZXJhdG9yTmV4dF0oaWQsIHZhbCkge1xyXG4gICAgICAgICAgICBjb25zdCBpdCA9IGZpbmRJdGVyYXRvcihpZCwgJ25leHQnKTtcclxuICAgICAgICAgICAgaWYgKGl0ICE9PSAkQXN5bmNDYWxsSWdub3JlUmVzcG9uc2UpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXQubmV4dCh2YWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gaXQ7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBbJEFzeW5jSXRlcmF0b3JSZXR1cm5dKGlkLCB2YWwpIHtcclxuICAgICAgICAgICAgY29uc3QgaXQgPSBmaW5kSXRlcmF0b3IoaWQsICdyZXR1cm4nKTtcclxuICAgICAgICAgICAgaWYgKGl0ICE9PSAkQXN5bmNDYWxsSWdub3JlUmVzcG9uc2UpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXQucmV0dXJuKHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiAkQXN5bmNDYWxsSWdub3JlUmVzcG9uc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBbJEFzeW5jSXRlcmF0b3JUaHJvd10oaWQsIHZhbCkge1xyXG4gICAgICAgICAgICBjb25zdCBpdCA9IGZpbmRJdGVyYXRvcihpZCwgJ3Rocm93Jyk7XHJcbiAgICAgICAgICAgIGlmIChpdCAhPT0gJEFzeW5jQ2FsbElnbm9yZVJlc3BvbnNlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0LnRocm93KHZhbCk7XHJcbiAgICAgICAgICAgIHJldHVybiAkQXN5bmNDYWxsSWdub3JlUmVzcG9uc2U7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbiAgICBjb25zdCByZW1vdGUgPSBBc3luY0NhbGwoc2VydmVyLCBvcHRpb25zKTtcclxuICAgIGZ1bmN0aW9uIHByb3h5VHJhcChfdGFyZ2V0LCBrZXkpIHtcclxuICAgICAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1sqQXN5bmNDYWxsXSBPbmx5IHN0cmluZyBjYW4gYmUgdGhlIG1ldGhvZCBuYW1lJyk7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkID0gcmVtb3RlWyRBc3luY0l0ZXJhdG9yU3RhcnRdKGtleSwgYXJncyk7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgKGNsYXNzIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNbU3ltYm9sLnRvU3RyaW5nVGFnXSA9IGtleTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGFzeW5jIHJldHVybih2YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVtb3RlWyRBc3luY0l0ZXJhdG9yUmV0dXJuXShhd2FpdCBpZCwgdmFsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGFzeW5jIG5leHQodmFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbW90ZVskQXN5bmNJdGVyYXRvck5leHRdKGF3YWl0IGlkLCB2YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYXN5bmMgdGhyb3codmFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlbW90ZVskQXN5bmNJdGVyYXRvclRocm93XShhd2FpdCBpZCwgdmFsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFtTeW1ib2wuYXN5bmNJdGVyYXRvcl0oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pKCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgUHJveHkoe30sIHsgZ2V0OiBwcm94eVRyYXAgfSk7XHJcbn1cclxuZnVuY3Rpb24gY2FsY0xvZ09wdGlvbnMobG9nKSB7XHJcbiAgICBjb25zdCBsb2dBbGxPbiA9IHsgYmVDYWxsZWQ6IHRydWUsIGxvY2FsRXJyb3I6IHRydWUsIHJlbW90ZUVycm9yOiB0cnVlLCB0eXBlOiAncHJldHR5JyB9O1xyXG4gICAgY29uc3QgbG9nQWxsT2ZmID0geyBiZUNhbGxlZDogZmFsc2UsIGxvY2FsRXJyb3I6IGZhbHNlLCByZW1vdGVFcnJvcjogZmFsc2UsIHR5cGU6ICdiYXNpYycgfTtcclxuICAgIHJldHVybiB0eXBlb2YgbG9nID09PSAnYm9vbGVhbicgPyAobG9nID8gbG9nQWxsT24gOiBsb2dBbGxPZmYpIDogbG9nO1xyXG59XHJcbmZ1bmN0aW9uIGNhbGNTdHJpY3RPcHRpb25zKHN0cmljdCkge1xyXG4gICAgY29uc3Qgc3RyaWN0QWxsT24gPSB7IG1ldGhvZE5vdEZvdW5kOiB0cnVlLCB1bmtub3duTWVzc2FnZTogdHJ1ZSwgbm9VbmRlZmluZWQ6IHRydWUgfTtcclxuICAgIGNvbnN0IHN0cmljdEFsbE9mZiA9IHsgbWV0aG9kTm90Rm91bmQ6IGZhbHNlLCB1bmtub3duTWVzc2FnZTogZmFsc2UsIG5vVW5kZWZpbmVkOiBmYWxzZSB9O1xyXG4gICAgcmV0dXJuIHR5cGVvZiBzdHJpY3QgPT09ICdib29sZWFuJyA/IChzdHJpY3QgPyBzdHJpY3RBbGxPbiA6IHN0cmljdEFsbE9mZikgOiBzdHJpY3Q7XHJcbn1cclxuY29uc3QganNvbnJwYyA9ICcyLjAnO1xyXG5jbGFzcyBSZXF1ZXN0IHtcclxuICAgIGNvbnN0cnVjdG9yKGlkLCBtZXRob2QsIHBhcmFtcywgcmVtb3RlU3RhY2spIHtcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICAgICAgdGhpcy5tZXRob2QgPSBtZXRob2Q7XHJcbiAgICAgICAgdGhpcy5wYXJhbXMgPSBwYXJhbXM7XHJcbiAgICAgICAgdGhpcy5yZW1vdGVTdGFjayA9IHJlbW90ZVN0YWNrO1xyXG4gICAgICAgIHRoaXMuanNvbnJwYyA9ICcyLjAnO1xyXG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB7IGlkLCBtZXRob2QsIHBhcmFtcywganNvbnJwYywgcmVtb3RlU3RhY2sgfTtcclxuICAgICAgICBpZiAocmVxdWVzdC5yZW1vdGVTdGFjay5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGRlbGV0ZSByZXF1ZXN0LnJlbW90ZVN0YWNrO1xyXG4gICAgICAgIHJldHVybiByZXF1ZXN0O1xyXG4gICAgfVxyXG59XHJcbmNsYXNzIFN1Y2Nlc3NSZXNwb25zZSB7XHJcbiAgICBjb25zdHJ1Y3RvcihpZCwgcmVzdWx0LCBub1VuZGVmaW5lZEtlZXBpbmcpIHtcclxuICAgICAgICB0aGlzLmlkID0gaWQ7XHJcbiAgICAgICAgdGhpcy5yZXN1bHQgPSByZXN1bHQ7XHJcbiAgICAgICAgdGhpcy5qc29ucnBjID0gJzIuMCc7XHJcbiAgICAgICAgY29uc3Qgb2JqID0geyBpZCwganNvbnJwYywgcmVzdWx0OiByZXN1bHQgfHwgbnVsbCB9O1xyXG4gICAgICAgIGlmICghbm9VbmRlZmluZWRLZWVwaW5nICYmIHJlc3VsdCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBvYmoucmVzdWx0SXNVbmRlZmluZWQgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9XHJcbn1cclxuY2xhc3MgRXJyb3JSZXNwb25zZSB7XHJcbiAgICBjb25zdHJ1Y3RvcihpZCwgY29kZSwgbWVzc2FnZSwgc3RhY2ssIHR5cGUgPSAnRXJyb3InKSB7XHJcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xyXG4gICAgICAgIHRoaXMuanNvbnJwYyA9ICcyLjAnO1xyXG4gICAgICAgIGlmIChpZCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICBpZCA9IG51bGw7XHJcbiAgICAgICAgY29kZSA9IE1hdGguZmxvb3IoY29kZSk7XHJcbiAgICAgICAgY29uc3QgZXJyb3IgPSAodGhpcy5lcnJvciA9IHsgY29kZSwgbWVzc2FnZSwgZGF0YTogeyBzdGFjaywgdHlwZSB9IH0pO1xyXG4gICAgICAgIHJldHVybiB7IGVycm9yLCBpZCwganNvbnJwYyB9O1xyXG4gICAgfVxyXG59XHJcbi8vIFByZSBkZWZpbmVkIGVycm9yIGluIHNlY3Rpb24gNS4xXHJcbkVycm9yUmVzcG9uc2UuUGFyc2VFcnJvciA9IChzdGFjayA9ICcnKSA9PiBuZXcgRXJyb3JSZXNwb25zZShudWxsLCAtMzI3MDAsICdQYXJzZSBlcnJvcicsIHN0YWNrKTtcclxuRXJyb3JSZXNwb25zZS5JbnZhbGlkUmVxdWVzdCA9IChpZCkgPT4gbmV3IEVycm9yUmVzcG9uc2UoaWQsIC0zMjYwMCwgJ0ludmFsaWQgUmVxdWVzdCcsICcnKTtcclxuRXJyb3JSZXNwb25zZS5NZXRob2ROb3RGb3VuZCA9IChpZCkgPT4gbmV3IEVycm9yUmVzcG9uc2UoaWQsIC0zMjYwMSwgJ01ldGhvZCBub3QgZm91bmQnLCAnJyk7XHJcbkVycm9yUmVzcG9uc2UuSW52YWxpZFBhcmFtcyA9IChpZCkgPT4gbmV3IEVycm9yUmVzcG9uc2UoaWQsIC0zMjYwMiwgJ0ludmFsaWQgcGFyYW1zJywgJycpO1xyXG5FcnJvclJlc3BvbnNlLkludGVybmFsRXJyb3IgPSAoaWQsIG1lc3NhZ2UgPSAnJykgPT4gbmV3IEVycm9yUmVzcG9uc2UoaWQsIC0zMjYwMywgJ0ludGVybmFsIGVycm9yJyArIG1lc3NhZ2UsICcnKTtcclxuZnVuY3Rpb24gaXNKU09OUlBDT2JqZWN0KGRhdGEpIHtcclxuICAgIGlmICghaXNPYmplY3QoZGF0YSkpXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgaWYgKCFoYXNLZXkoZGF0YSwgJ2pzb25ycGMnKSlcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICBpZiAoZGF0YS5qc29ucnBjICE9PSAnMi4wJylcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICBpZiAoaGFzS2V5KGRhdGEsICdwYXJhbXMnKSkge1xyXG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IGRhdGEucGFyYW1zO1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwYXJhbXMpICYmICFpc09iamVjdChwYXJhbXMpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5mdW5jdGlvbiBpc09iamVjdChwYXJhbXMpIHtcclxuICAgIHJldHVybiB0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0JyAmJiBwYXJhbXMgIT09IG51bGw7XHJcbn1cclxuZnVuY3Rpb24gaGFzS2V5KG9iaiwga2V5KSB7XHJcbiAgICByZXR1cm4ga2V5IGluIG9iajtcclxufVxyXG5jbGFzcyBDdXN0b21FcnJvciBleHRlbmRzIEVycm9yIHtcclxuICAgIGNvbnN0cnVjdG9yKG5hbWUsIG1lc3NhZ2UsIGNvZGUsIHN0YWNrKSB7XHJcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICB0aGlzLmNvZGUgPSBjb2RlO1xyXG4gICAgICAgIHRoaXMuc3RhY2sgPSBzdGFjaztcclxuICAgIH1cclxufVxyXG4vKiogVGhlc2UgRXJyb3IgaXMgZGVmaW5lZCBpbiBFQ01BU2NyaXB0IHNwZWMgKi9cclxuY29uc3QgZXJyb3JzID0ge1xyXG4gICAgRXJyb3IsXHJcbiAgICBFdmFsRXJyb3IsXHJcbiAgICBSYW5nZUVycm9yLFxyXG4gICAgUmVmZXJlbmNlRXJyb3IsXHJcbiAgICBTeW50YXhFcnJvcixcclxuICAgIFR5cGVFcnJvcixcclxuICAgIFVSSUVycm9yLFxyXG59O1xyXG4vKipcclxuICogQXN5bmNDYWxsIHN1cHBvcnQgc29tZWhvdyB0cmFuc2ZlciBFQ01BU2NyaXB0IEVycm9yXHJcbiAqL1xyXG5mdW5jdGlvbiBSZWNvdmVyRXJyb3IodHlwZSwgbWVzc2FnZSwgY29kZSwgc3RhY2spIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgaWYgKHR5cGUuc3RhcnRzV2l0aCgnRE9NRXhjZXB0aW9uOicpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IFtfLCBuYW1lXSA9IHR5cGUuc3BsaXQoJ0RPTUV4Y2VwdGlvbjonKTtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBET01FeGNlcHRpb24obWVzc2FnZSwgbmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHR5cGUgaW4gZXJyb3JzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGUgPSBuZXcgZXJyb3JzW3R5cGVdKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBlLnN0YWNrID0gc3RhY2s7XHJcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZSwgeyBjb2RlIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ3VzdG9tRXJyb3IodHlwZSwgbWVzc2FnZSwgY29kZSwgc3RhY2spO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNhdGNoIChfYSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoYEUke2NvZGV9ICR7dHlwZX06ICR7bWVzc2FnZX1cXG4ke3N0YWNrfWApO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIHJlbW92ZVN0YWNrSGVhZGVyKHN0YWNrID0gJycpIHtcclxuICAgIHJldHVybiBzdGFjay5yZXBsYWNlKC9eLitcXG4uK1xcbi8sICcnKTtcclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1Bc3luY0NhbGwuanMubWFwIiwiaW1wb3J0IG1pdHQgZnJvbSAnbWl0dCc7XHJcbmltcG9ydCB7IE5vU2VyaWFsaXphdGlvbiB9IGZyb20gJy4uL3V0aWwvQXN5bmNDYWxsJztcclxuY29uc3QgTWVzc2FnZUNlbnRlckV2ZW50ID0gJ0hvbG9mbG93cy1LaXQgTWVzc2FnZUNlbnRlcic7XHJcbmNvbnN0IG5vb3AgPSAoKSA9PiB7IH07XHJcbi8qKlxyXG4gKiBTZW5kIGFuZCByZWNlaXZlIG1lc3NhZ2VzIGluIGRpZmZlcmVudCBjb250ZXh0cy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBNZXNzYWdlQ2VudGVyIHtcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIGluc3RhbmNlS2V5IC0gVXNlIHRoaXMgaW5zdGFuY2VLZXkgdG8gZGlzdGluZ3Vpc2ggeW91ciBtZXNzYWdlcyBhbmQgb3RoZXJzLlxyXG4gICAgICogVGhpcyBvcHRpb24gY2Fubm90IG1ha2UgeW91ciBtZXNzYWdlIHNhZmUhXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGluc3RhbmNlS2V5ID0gJycpIHtcclxuICAgICAgICB0aGlzLmluc3RhbmNlS2V5ID0gaW5zdGFuY2VLZXk7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSG93IHNob3VsZCBNZXNzYWdlQ2VudGVyIHNlcmlhbGl6YXRpb24gdGhlIG1lc3NhZ2VcclxuICAgICAgICAgKiBAZGVmYXVsdFZhbHVlIE5vU2VyaWFsaXphdGlvblxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuc2VyaWFsaXphdGlvbiA9IE5vU2VyaWFsaXphdGlvbjtcclxuICAgICAgICB0aGlzLmV2ZW50RW1pdHRlciA9IG5ldyBtaXR0KCk7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IGFzeW5jIChyZXF1ZXN0KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB7IGtleSwgZGF0YSwgaW5zdGFuY2VLZXkgfSA9IGF3YWl0IHRoaXMuc2VyaWFsaXphdGlvbi5kZXNlcmlhbGl6YXRpb24ocmVxdWVzdC5kZXRhaWwgfHwgcmVxdWVzdCk7XHJcbiAgICAgICAgICAgIC8vIE1lc3NhZ2UgaXMgbm90IGZvciB1c1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pbnN0YW5jZUtleSAhPT0gKGluc3RhbmNlS2V5IHx8ICcnKSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKHRoaXMud3JpdGVUb0NvbnNvbGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAlY1JlY2VpdmUlYyAlYyR7a2V5LnRvU3RyaW5nKCl9YCwgJ2JhY2tncm91bmQ6IHJnYmEoMCwgMjU1LCAyNTUsIDAuNik7IGNvbG9yOiBibGFjazsgcGFkZGluZzogMHB4IDZweDsgYm9yZGVyLXJhZGl1czogNHB4OycsICcnLCAndGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmUnLCBkYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmV2ZW50RW1pdHRlci5lbWl0KGtleSwgZGF0YSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTaG91bGQgTWVzc2FnZUNlbnRlciBwcmludHMgYWxsIG1lc3NhZ2VzIHRvIGNvbnNvbGU/XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy53cml0ZVRvQ29uc29sZSA9IGZhbHNlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgYnJvd3NlciAhPT0gJ3VuZGVmaW5lZCcgJiYgYnJvd3Nlci5ydW50aW1lICYmIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhIG1lc3NhZ2UgaXMgc2VudCBmcm9tIGVpdGhlciBhbiBleHRlbnNpb24gcHJvY2VzcyAoYnkgcnVudGltZS5zZW5kTWVzc2FnZSlcclxuICAgICAgICAgICAgLy8gb3IgYSBjb250ZW50IHNjcmlwdCAoYnkgdGFicy5zZW5kTWVzc2FnZSkuXHJcbiAgICAgICAgICAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXIoZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoTWVzc2FnZUNlbnRlckV2ZW50LCB0aGlzLmxpc3RlbmVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvKipcclxuICAgICAqIExpc3RlbiB0byBhbiBldmVudFxyXG4gICAgICogQHBhcmFtIGV2ZW50IC0gTmFtZSBvZiB0aGUgZXZlbnRcclxuICAgICAqIEBwYXJhbSBoYW5kbGVyIC0gSGFuZGxlciBvZiB0aGUgZXZlbnRcclxuICAgICAqIEByZXR1cm5zIGEgZnVuY3Rpb24sIGNhbGwgaXQgdG8gcmVtb3ZlIHRoaXMgbGlzdGVuZXJcclxuICAgICAqL1xyXG4gICAgb24oZXZlbnQsIGhhbmRsZXIpIHtcclxuICAgICAgICB0aGlzLmV2ZW50RW1pdHRlci5vbihldmVudCwgaGFuZGxlcik7XHJcbiAgICAgICAgcmV0dXJuICgpID0+IHRoaXMub2ZmKGV2ZW50LCBoYW5kbGVyKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIHRoZSBsaXN0ZW5lciBvZiBhbiBldmVudFxyXG4gICAgICogQHBhcmFtIGV2ZW50IC0gTmFtZSBvZiB0aGUgZXZlbnRcclxuICAgICAqIEBwYXJhbSBoYW5kbGVyIC0gSGFuZGxlciBvZiB0aGUgZXZlbnRcclxuICAgICAqL1xyXG4gICAgb2ZmKGV2ZW50LCBoYW5kbGVyKSB7XHJcbiAgICAgICAgdGhpcy5ldmVudEVtaXR0ZXIub2ZmKGV2ZW50LCBoYW5kbGVyKTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogU2VuZCBtZXNzYWdlIHRvIGxvY2FsIG9yIG90aGVyIGluc3RhbmNlIG9mIGV4dGVuc2lvblxyXG4gICAgICogQHBhcmFtIGtleSAtIEtleSBvZiB0aGUgbWVzc2FnZVxyXG4gICAgICogQHBhcmFtIGRhdGEgLSBEYXRhIG9mIHRoZSBtZXNzYWdlXHJcbiAgICAgKiBAcGFyYW0gYWxzb1NlbmRUb0RvY3VtZW50IC0gISBTZW5kIG1lc3NhZ2UgdG8gZG9jdW1lbnQuIFRoaXMgbWF5IGxlYWtzIHNlY3JldCEgT25seSBvcGVuIGluIGxvY2FsaG9zdCFcclxuICAgICAqL1xyXG4gICAgYXN5bmMgZW1pdChrZXksIGRhdGEsIGFsc29TZW5kVG9Eb2N1bWVudCA9IGxvY2F0aW9uLmhvc3RuYW1lID09PSAnbG9jYWxob3N0Jykge1xyXG4gICAgICAgIGlmICh0aGlzLndyaXRlVG9Db25zb2xlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAlY1NlbmQlYyAlYyR7a2V5LnRvU3RyaW5nKCl9YCwgJ2JhY2tncm91bmQ6IHJnYmEoMCwgMjU1LCAyNTUsIDAuNik7IGNvbG9yOiBibGFjazsgcGFkZGluZzogMHB4IDZweDsgYm9yZGVyLXJhZGl1czogNHB4OycsICcnLCAndGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmUnLCBkYXRhKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc2VyaWFsaXplZCA9IGF3YWl0IHRoaXMuc2VyaWFsaXphdGlvbi5zZXJpYWxpemF0aW9uKHtcclxuICAgICAgICAgICAgZGF0YSxcclxuICAgICAgICAgICAga2V5LFxyXG4gICAgICAgICAgICBpbnN0YW5jZUtleTogdGhpcy5pbnN0YW5jZUtleSB8fCAnJyxcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAodHlwZW9mIGJyb3dzZXIgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIGlmIChicm93c2VyLnJ1bnRpbWUgJiYgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoc2VyaWFsaXplZCkuY2F0Y2gobm9vcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGJyb3dzZXIudGFicykge1xyXG4gICAgICAgICAgICAgICAgLy8gU2VuZCBtZXNzYWdlIHRvIENvbnRlbnQgU2NyaXB0XHJcbiAgICAgICAgICAgICAgICBicm93c2VyLnRhYnMucXVlcnkoeyBkaXNjYXJkZWQ6IGZhbHNlIH0pLnRoZW4odGFicyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCB0YWIgb2YgdGFicykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFiLmlkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJvd3Nlci50YWJzLnNlbmRNZXNzYWdlKHRhYi5pZCwgc2VyaWFsaXplZCkuY2F0Y2gobm9vcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGFsc29TZW5kVG9Eb2N1bWVudCAmJiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQpIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoTWVzc2FnZUNlbnRlckV2ZW50LCB7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWw6IGF3YWl0IHRoaXMuc2VyaWFsaXphdGlvbi5zZXJpYWxpemF0aW9uKHsgZGF0YSwga2V5IH0pLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiB7QGluaGVyaXRkb2MgTWVzc2FnZUNlbnRlci5lbWl0fVxyXG4gICAgICovXHJcbiAgICBzZW5kKC4uLmFyZ3MpIHtcclxuICAgICAgICByZXR1cm4gUmVmbGVjdC5hcHBseSh0aGlzLmVtaXQsIHRoaXMsIGFyZ3MpO1xyXG4gICAgfVxyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPU1lc3NhZ2VDZW50ZXIuanMubWFwIiwiaW1wb3J0IHsgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uL1JQQydcbnR5cGUgV2ViRXh0ZW5zaW9uSUQgPSBzdHJpbmdcbnR5cGUgTWVzc2FnZUlEID0gc3RyaW5nXG50eXBlIHdlYk5hdmlnYXRpb25PbkNvbW1pdHRlZEFyZ3MgPSBQYXJhbWV0ZXJzPFRoaXNTaWRlSW1wbGVtZW50YXRpb25bJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCddPlxudHlwZSBvbk1lc3NhZ2VBcmdzID0gUGFyYW1ldGVyczxUaGlzU2lkZUltcGxlbWVudGF0aW9uWydvbk1lc3NhZ2UnXT5cbnR5cGUgUG9vbEtleXMgPSAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJyB8ICdicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJ1xuLyoqXG4gKiBVc2VkIGZvciBrZWVwIHJlZmVyZW5jZSB0byBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlXG4gKi9cbmV4cG9ydCBjb25zdCBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyID0gbmV3IE1hcDxNZXNzYWdlSUQsIFsodmFsOiBhbnkpID0+IGFueSwgKHZhbDogYW55KSA9PiBhbnldPigpXG4vKipcbiAqIFRvIHN0b3JlIGxpc3RlbmVyIGZvciBIb3N0IGRpc3BhdGNoZWQgZXZlbnRzLlxuICovXG5leHBvcnQgY29uc3QgRXZlbnRQb29sczogUmVjb3JkPFBvb2xLZXlzLCBNYXA8V2ViRXh0ZW5zaW9uSUQsIFNldDwoLi4uYXJnczogYW55W10pID0+IGFueT4+PiA9IHtcbiAgICAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJzogbmV3IE1hcCgpLFxuICAgICdicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJzogbmV3IE1hcCgpLFxufVxuLyoqXG4gKiBEaXNwYXRjaCBhIG5vcm1hbCBldmVudCAodGhhdCBub3QgaGF2ZSBhIFwicmVzcG9uc2VcIikuXG4gKiBMaWtlIGJyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGlzcGF0Y2hOb3JtYWxFdmVudChldmVudDogUG9vbEtleXMsIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyB8IHN0cmluZ1tdIHwgJyonLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgIGlmICghRXZlbnRQb29sc1tldmVudF0pIHJldHVyblxuICAgIGZvciAoY29uc3QgW2V4dGVuc2lvbklELCBmbnNdIG9mIEV2ZW50UG9vbHNbZXZlbnRdLmVudHJpZXMoKSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0b0V4dGVuc2lvbklEKSAmJiB0b0V4dGVuc2lvbklELmluZGV4T2YoZXh0ZW5zaW9uSUQpID09PSAtMSkgY29udGludWVcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRvRXh0ZW5zaW9uSUQpICYmIHRvRXh0ZW5zaW9uSUQgIT09IGV4dGVuc2lvbklEICYmIHRvRXh0ZW5zaW9uSUQgIT09ICcqJykgY29udGludWVcbiAgICAgICAgZm9yIChjb25zdCBmIG9mIGZucykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmKC4uLmFyZ3MpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuLyoqXG4gKiBDcmVhdGUgYSBgRXZlbnRPYmplY3Q8TGlzdGVuZXJUeXBlPmAgb2JqZWN0LlxuICpcbiAqIENhbiBiZSBzZXQgb24gYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkIGV0Yy4uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXZlbnRMaXN0ZW5lcihleHRlbnNpb25JRDogc3RyaW5nLCBldmVudDogUG9vbEtleXMpIHtcbiAgICBpZiAoIUV2ZW50UG9vbHNbZXZlbnRdLmhhcyhleHRlbnNpb25JRCkpIHtcbiAgICAgICAgRXZlbnRQb29sc1tldmVudF0uc2V0KGV4dGVuc2lvbklELCBuZXcgU2V0KCkpXG4gICAgfVxuICAgIGNvbnN0IHBvb2wgPSBFdmVudFBvb2xzW2V2ZW50XS5nZXQoZXh0ZW5zaW9uSUQpIVxuICAgIGNvbnN0IGhhbmRsZXI6IEV2ZW50T2JqZWN0PCguLi5hcmdzOiBhbnlbXSkgPT4gYW55PiA9IHtcbiAgICAgICAgYWRkTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgZnVuY3Rpb24nKVxuICAgICAgICAgICAgcG9vbC5hZGQoY2FsbGJhY2spXG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUxpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBwb29sLmRlbGV0ZShjYWxsYmFjaylcbiAgICAgICAgfSxcbiAgICAgICAgaGFzTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBwb29sLmhhcyhsaXN0ZW5lcilcbiAgICAgICAgfSxcbiAgICB9XG4gICAgcmV0dXJuIGhhbmRsZXJcbn1cblxuaW50ZXJmYWNlIEV2ZW50T2JqZWN0PFQgZXh0ZW5kcyAoLi4uYXJnczogYW55W10pID0+IGFueT4ge1xuICAgIGFkZExpc3RlbmVyOiAoY2FsbGJhY2s6IFQpID0+IHZvaWRcbiAgICByZW1vdmVMaXN0ZW5lcjogKGxpc3RlbmVyOiBUKSA9PiB2b2lkXG4gICAgaGFzTGlzdGVuZXI6IChsaXN0ZW5lcjogVCkgPT4gYm9vbGVhblxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGRlZXBDbG9uZTxUPihvYmo6IFQpOiBUIHtcbiAgICAvLyB0b2RvOiBjaGFuZ2UgYW5vdGhlciBpbXBsIHBsei5cbiAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmopKVxufVxuIiwiaW1wb3J0IHsgSG9zdCwgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uL1JQQydcblxuaW1wb3J0IHsgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlciwgRXZlbnRQb29scyB9IGZyb20gJy4uL3V0aWxzL0xvY2FsTWVzc2FnZXMnXG5pbXBvcnQgeyBkZWVwQ2xvbmUgfSBmcm9tICcuLi91dGlscy9kZWVwQ2xvbmUnXG4vKipcbiAqIENyZWF0ZSBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoKSBmdW5jdGlvblxuICogQHBhcmFtIGV4dGVuc2lvbklEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSdW50aW1lU2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHRvRXh0ZW5zaW9uSUQ6IHN0cmluZywgbWVzc2FnZTogdW5rbm93blxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9IGV4dGVuc2lvbklEXG4gICAgICAgICAgICBtZXNzYWdlID0gYXJndW1lbnRzWzBdXG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9IGFyZ3VtZW50c1swXVxuICAgICAgICAgICAgbWVzc2FnZSA9IGFyZ3VtZW50c1sxXVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9ICcnXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbmRNZXNzYWdlV2l0aFJlc3BvbnNlKGV4dGVuc2lvbklELCB0b0V4dGVuc2lvbklELCBudWxsLCBtZXNzYWdlKVxuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBzZW5kTWVzc2FnZVdpdGhSZXNwb25zZTxVPihcbiAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICB0YWJJZDogbnVtYmVyIHwgbnVsbCxcbiAgICBtZXNzYWdlOiB1bmtub3duLFxuKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPFU+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgbWVzc2FnZUlEID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygpXG4gICAgICAgIEhvc3Quc2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQsIHRvRXh0ZW5zaW9uSUQsIHRhYklkLCBtZXNzYWdlSUQsIHtcbiAgICAgICAgICAgIHR5cGU6ICdtZXNzYWdlJyxcbiAgICAgICAgICAgIGRhdGE6IG1lc3NhZ2UsXG4gICAgICAgICAgICByZXNwb25zZTogZmFsc2UsXG4gICAgICAgIH0pLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgcmVqZWN0KGUpXG4gICAgICAgICAgICBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmRlbGV0ZShtZXNzYWdlSUQpXG4gICAgICAgIH0pXG4gICAgICAgIFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIuc2V0KG1lc3NhZ2VJRCwgW3Jlc29sdmUsIHJlamVjdF0pXG4gICAgfSlcbn1cblxuLyoqXG4gKiBNZXNzYWdlIGhhbmRsZXIgb2Ygbm9ybWFsIG1lc3NhZ2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uTm9ybWFsTWVzc2FnZShcbiAgICBtZXNzYWdlOiBhbnksXG4gICAgc2VuZGVyOiBicm93c2VyLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcixcbiAgICB0b0V4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtZXNzYWdlSUQ6IHN0cmluZyxcbikge1xuICAgIGNvbnN0IGZuczogU2V0PGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2VFdmVudD4gfCB1bmRlZmluZWQgPSBFdmVudFBvb2xzWydicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJ10uZ2V0KFxuICAgICAgICB0b0V4dGVuc2lvbklELFxuICAgIClcbiAgICBpZiAoIWZucykgcmV0dXJuXG4gICAgbGV0IHJlc3BvbnNlU2VuZCA9IGZhbHNlXG4gICAgZm9yIChjb25zdCBmbiBvZiBmbnMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vID8gZGlzcGF0Y2ggbWVzc2FnZVxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gZm4oZGVlcENsb25lKG1lc3NhZ2UpLCBkZWVwQ2xvbmUoc2VuZGVyKSwgc2VuZFJlc3BvbnNlRGVwcmVjYXRlZClcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIC8vID8gZG8gbm90aGluZ1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgICAgICAvLyAhIGRlcHJlY2F0ZWQgcGF0aCAhXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdvYmplY3QnICYmIHR5cGVvZiByZXN1bHQudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIC8vID8gcmVzcG9uc2UgdGhlIGFuc3dlclxuICAgICAgICAgICAgICAgIHJlc3VsdC50aGVuKChkYXRhOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhID09PSB1bmRlZmluZWQgfHwgcmVzcG9uc2VTZW5kKSByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VTZW5kID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBIb3N0LnNlbmRNZXNzYWdlKHRvRXh0ZW5zaW9uSUQsIGV4dGVuc2lvbklELCBzZW5kZXIudGFiIS5pZCEsIG1lc3NhZ2VJRCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ21lc3NhZ2UnLFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydCB0eXBlIEludGVybmFsTWVzc2FnZSA9XG4gICAgfCB7XG4gICAgICAgICAgZGF0YTogYW55XG4gICAgICAgICAgZXJyb3I/OiB7IG1lc3NhZ2U6IHN0cmluZzsgc3RhY2s6IHN0cmluZyB9XG4gICAgICAgICAgcmVzcG9uc2U6IGJvb2xlYW5cbiAgICAgICAgICB0eXBlOiAnbWVzc2FnZSdcbiAgICAgIH1cbiAgICB8IHtcbiAgICAgICAgICB0eXBlOiAnZXhlY3V0ZVNjcmlwdCdcbiAgICAgIH0gJiBQYXJhbWV0ZXJzPFRoaXNTaWRlSW1wbGVtZW50YXRpb25bJ2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0J10+WzJdXG5cbmZ1bmN0aW9uIHNlbmRSZXNwb25zZURlcHJlY2F0ZWQoKTogYW55IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdSZXR1cm5pbmcgYSBQcm9taXNlIGlzIHRoZSBwcmVmZXJyZWQgd2F5JyArXG4gICAgICAgICAgICAnIHRvIHNlbmQgYSByZXBseSBmcm9tIGFuIG9uTWVzc2FnZS9vbk1lc3NhZ2VFeHRlcm5hbCBsaXN0ZW5lciwgJyArXG4gICAgICAgICAgICAnYXMgdGhlIHNlbmRSZXNwb25zZSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgc3BlY3MgJyArXG4gICAgICAgICAgICAnKFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL01vemlsbGEvQWRkLW9ucy9XZWJFeHRlbnNpb25zL0FQSS9ydW50aW1lL29uTWVzc2FnZSknLFxuICAgIClcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ub2RlX21vZHVsZXMvd2ViLWV4dC10eXBlcy9nbG9iYWwvaW5kZXguZC50c1wiIC8+XG5pbXBvcnQgeyBBc3luY0NhbGwgfSBmcm9tICdAaG9sb2Zsb3dzL2tpdC9lcydcbmltcG9ydCB7IGRpc3BhdGNoTm9ybWFsRXZlbnQsIFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIgfSBmcm9tICcuL3V0aWxzL0xvY2FsTWVzc2FnZXMnXG5pbXBvcnQgeyBJbnRlcm5hbE1lc3NhZ2UsIG9uTm9ybWFsTWVzc2FnZSB9IGZyb20gJy4vc2hpbXMvYnJvd3Nlci5tZXNzYWdlJ1xuaW1wb3J0IHsgcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbiwgbG9hZENvbnRlbnRTY3JpcHQgfSBmcm9tICcuL0V4dGVuc2lvbnMnXG5cbi8qKiBEZWZpbmUgQmxvYiB0eXBlIGluIGNvbW11bmljYXRlIHdpdGggcmVtb3RlICovXG5leHBvcnQgdHlwZSBTdHJpbmdPckJsb2IgPVxuICAgIHwge1xuICAgICAgICAgIHR5cGU6ICd0ZXh0J1xuICAgICAgICAgIGNvbnRlbnQ6IHN0cmluZ1xuICAgICAgfVxuICAgIHwge1xuICAgICAgICAgIHR5cGU6ICdhcnJheSBidWZmZXInXG4gICAgICAgICAgY29udGVudDogc3RyaW5nXG4gICAgICB9XG4gICAgfCB7XG4gICAgICAgICAgdHlwZTogJ2Jsb2InXG4gICAgICAgICAgY29udGVudDogc3RyaW5nXG4gICAgICAgICAgbWltZVR5cGU6IHN0cmluZ1xuICAgICAgfVxuLyoqXG4gKiBUaGlzIGRlc2NyaWJlcyB3aGF0IEpTT05SUEMgY2FsbHMgdGhhdCBOYXRpdmUgc2lkZSBzaG91bGQgaW1wbGVtZW50XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSG9zdCB7XG4gICAgLy8jcmVnaW9uIC8vID8gVVJMLipcbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCBzYXZlIHRoZSBiaW5kaW5nIHdpdGggYHV1aWRgIGFuZCB0aGUgYGRhdGFgXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIFVVSUQgLSBVVUlEIGdlbmVyYXRlZCBieSBKUyBzaWRlLlxuICAgICAqIEBwYXJhbSBkYXRhIC0gZGF0YSBvZiB0aGlzIG9iamVjdC4gTXVzdCBiZSB0eXBlIGBibG9iYFxuICAgICAqL1xuICAgICdVUkwuY3JlYXRlT2JqZWN0VVJMJyhleHRlbnNpb25JRDogc3RyaW5nLCBVVUlEOiBzdHJpbmcsIGRhdGE6IFN0cmluZ09yQmxvYik6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCByZWxlYXNlIHRoZSBiaW5kaW5nIHdpdGggYHV1aWRgIGFuZCB0aGUgYGRhdGFgXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIFVVSUQgLSBVVUlEIGdlbmVyYXRlZCBieSBKUyBzaWRlLlxuICAgICAqL1xuICAgICdVUkwucmV2b2tlT2JqZWN0VVJMJyhleHRlbnNpb25JRDogc3RyaW5nLCBVVUlEOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+XG4gICAgLy8jZW5kcmVnaW9uXG4gICAgLy8jcmVnaW9uIC8vID8gYnJvd3Nlci5kb3dubG9hZHNcbiAgICAvKipcbiAgICAgKiBPcGVuIGEgZGlhbG9nLCBzaGFyZSB0aGUgZmlsZSB0byBzb21ld2hlcmUgZWxzZS5cbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFNlZSBodHRwczovL21kbi5pby9icm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZFxuICAgICAqL1xuICAgICdicm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZCcoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGZpbGVuYW1lOiBzdHJpbmdcbiAgICAgICAgICAgIC8qKiBDb3VsZCBiZSBhIHN0cmluZyByZXR1cm4gYnkgVVJMLmNyZWF0ZU9iamVjdFVSTCgpICovXG4gICAgICAgICAgICB1cmw6IHN0cmluZ1xuICAgICAgICB9LFxuICAgICk6IFByb21pc2U8dm9pZD5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0XG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBpbnRlcm5hbCBzdG9yYWdlIGZvciBgZXh0ZW5zaW9uSURgXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIGtleVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiA+IFN0b3JhZ2U6IGB7IGE6IHsgdmFsdWU6IDIgfSwgYjogeyBuYW1lOiBcInhcIiB9LCBjOiAxIH1gXG4gICAgICpcbiAgICAgKiBnZXQoaWQsICdiJylcbiAgICAgKiA+IFJldHVybiBge25hbWU6IFwieFwifWBcbiAgICAgKlxuICAgICAqIGdldChpZCwgbnVsbClcbiAgICAgKiA+IFJldHVybjogYHsgYTogeyB2YWx1ZTogMiB9LCBiOiB7IG5hbWU6IFwieFwiIH0sIGM6IDEgfWBcbiAgICAgKlxuICAgICAqIGdldChpZCwgW1wiYVwiLCBcImJcIl0pXG4gICAgICogPiBSZXR1cm46IGB7IGE6IHsgdmFsdWU6IDIgfSwgYjogeyBuYW1lOiBcInhcIiB9IH1gXG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQnKGV4dGVuc2lvbklEOiBzdHJpbmcsIGtleTogc3RyaW5nIHwgc3RyaW5nW10gfCBudWxsKTogUHJvbWlzZTxvYmplY3Q+XG4gICAgLyoqXG4gICAgICogSG9zdCBzaG91bGQgc2V0IHRoZSBvYmplY3Qgd2l0aCAxIGxheWVyIG1lcmdpbmcuXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIG9iamVjdFxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiA+IFN0b3JhZ2U6IGB7fWBcbiAgICAgKiBzZXQoaWQsIHsgYTogeyB2YWx1ZTogMSB9LCBiOiB7IG5hbWU6IFwieFwiIH0gfSlcbiAgICAgKiA+IFN0b3JhZ2U6IGB7IGE6IHsgdmFsdWU6IDEgfSwgYjogeyBuYW1lOiBcInhcIiB9IH1gXG4gICAgICogc2V0KGlkLCB7IGE6IHsgdmFsdWU6IDIgfSB9KVxuICAgICAqID4gU3RvcmFnZTogYHsgYTogeyB2YWx1ZTogMiB9LCBiOiB7IG5hbWU6IFwieFwiIH0gfWBcbiAgICAgKi9cbiAgICAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnNldCcoZXh0ZW5zaW9uSUQ6IHN0cmluZywgb2JqZWN0OiBvYmplY3QpOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGtleXMgaW4gdGhlIG9iamVjdFxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKi9cbiAgICAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnJlbW92ZScoZXh0ZW5zaW9uSUQ6IHN0cmluZywga2V5OiBzdHJpbmcgfCBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBEZWxldGUgdGhlIGludGVybmFsIHN0b3JhZ2VcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKi9cbiAgICAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmNsZWFyJyhleHRlbnNpb25JRDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPlxuICAgIC8vI2VuZHJlZ2lvblxuICAgIC8vI3JlZ2lvbiAvLyA/IGJyb3dzZXIudGFic1xuICAgIC8qKlxuICAgICAqIEhvc3Qgc2hvdWxkIGNyZWF0ZSBhIG5ldyB0YWJcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFNlZSBodHRwczovL21kbi5pby9icm93c2VyLnRhYnMuY3JlYXRlXG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy5jcmVhdGUnKGV4dGVuc2lvbklEOiBzdHJpbmcsIG9wdGlvbnM6IHsgYWN0aXZlPzogYm9vbGVhbjsgdXJsPzogc3RyaW5nIH0pOiBQcm9taXNlPGJyb3dzZXIudGFicy5UYWI+XG4gICAgLyoqXG4gICAgICogSG9zdCBzaG91bGQgcmVtb3ZlIHRoZSB0YWJcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gdGFiSWQgLSBTZWUgaHR0cHM6Ly9tZG4uaW8vYnJvd3Nlci50YWJzLnJlbW92ZVxuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMucmVtb3ZlJyhleHRlbnNpb25JRDogc3RyaW5nLCB0YWJJZDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IG9wZW5lZCB0YWJzXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBTZWUgaHR0cHM6Ly9tZG4uaW8vYnJvd3Nlci50YWJzLnF1ZXJ5XG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy5xdWVyeScoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHF1ZXJ5SW5mbzogUGFyYW1ldGVyczx0eXBlb2YgYnJvd3Nlci50YWJzLnF1ZXJ5PlswXSxcbiAgICApOiBQcm9taXNlPGJyb3dzZXIudGFicy5UYWJbXT5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgYSB0YWIncyBwcm9wZXJ0eVxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSB0YWJJZCBJZiBpdCBpcyB1bmRlZmluZWQsIGlnbm9yZSB0aGlzIHJlcXVlc3RcbiAgICAgKiBAcGFyYW0gdXBkYXRlUHJvcGVydGllc1xuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMudXBkYXRlJyhcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdGFiSWQ/OiBudW1iZXIsXG4gICAgICAgIHVwZGF0ZVByb3BlcnRpZXM/OiB7XG4gICAgICAgICAgICB1cmw/OiBzdHJpbmdcbiAgICAgICAgfSxcbiAgICApOiBQcm9taXNlPGJyb3dzZXIudGFicy5UYWI+XG4gICAgLy8jZW5kcmVnaW9uXG4gICAgLy8jcmVnaW9uIC8vID8gTWVzc2FnZVxuICAgIC8qKlxuICAgICAqIFVzZWQgdG8gaW1wbGVtZW50IGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UgYW5kIGJyb3dzZXIudGFicy5vbk1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSUQgLSBXaG8gc2VuZCB0aGlzIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gdG9FeHRlbnNpb25JRCAtIFdobyB3aWxsIHJlY2VpdmUgdGhpcyBtZXNzYWdlXG4gICAgICogQHBhcmFtIHRhYklkIC0gU2VuZCB0aGlzIG1lc3NhZ2UgdG8gdGFiIGlkXG4gICAgICogQHBhcmFtIG1lc3NhZ2VJRCAtIEEgcmFuZG9tIGlkIGdlbmVyYXRlZCBieSBjbGllbnRcbiAgICAgKiBAcGFyYW0gbWVzc2FnZSAtIG1lc3NhZ2Ugb2JqZWN0XG4gICAgICovXG4gICAgc2VuZE1lc3NhZ2UoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdGFiSWQ6IG51bWJlciB8IG51bGwsXG4gICAgICAgIG1lc3NhZ2VJRDogc3RyaW5nLFxuICAgICAgICBtZXNzYWdlOiBJbnRlcm5hbE1lc3NhZ2UsXG4gICAgKTogUHJvbWlzZTx2b2lkPlxuICAgIC8vI2VuZHJlZ2lvblxuICAgIC8vI3JlZ2lvbiAvLyA/IGZldGNoIC8vID8gKHRvIGJ5cGFzcyBjcm9zcyBvcmlnaW4gcmVzdHJpY3Rpb24pXG4gICAgLyoqXG4gICAgICogU2VlOiBodHRwczovL21kbi5pby9mZXRjaFxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSByZXF1ZXN0IC0gVGhlIHJlcXVlc3Qgb2JqZWN0XG4gICAgICovXG4gICAgZmV0Y2goXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICAgIC8qKiBHRVQsIFBPU1QsIC4uLi4gKi9cbiAgICAgICAgICAgIG1ldGhvZDogc3RyaW5nXG4gICAgICAgICAgICB1cmw6IHN0cmluZ1xuICAgICAgICB9LFxuICAgICk6IFByb21pc2U8e1xuICAgICAgICAvKiogcmVzcG9uc2UgY29kZSAqL1xuICAgICAgICBzdGF0dXM6IG51bWJlclxuICAgICAgICAvKiogcmVzcG9uc2UgdGV4dCAqL1xuICAgICAgICBzdGF0dXNUZXh0OiBzdHJpbmdcbiAgICAgICAgZGF0YTogU3RyaW5nT3JCbG9iXG4gICAgfT5cbiAgICAvLyNlbmRyZWdpb25cbn1cbi8qKlxuICogVGhpcyBkZXNjcmliZXMgd2hhdCBKU09OUlBDIGNhbGxzIHRoYXQgSlMgc2lkZSBzaG91bGQgaW1wbGVtZW50XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiB7XG4gICAgLyoqXG4gICAgICogSG9zdCBjYWxsIHRoaXMgdG8gbm90aWZ5IGBicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWRgIGhhcHBlbmVkLlxuICAgICAqXG4gICAgICogQHNlZSBodHRwczovL21kbi5pby9icm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWRcbiAgICAgKiBAcGFyYW0gdGFiIC0gVGhlIGNvbW1pdHRlZCB0YWIgaW5mb1xuICAgICAqL1xuICAgICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnKHRhYjogeyB0YWJJZDogbnVtYmVyOyB1cmw6IHN0cmluZyB9KTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFVzZWQgdG8gaW1wbGVtZW50IGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UgYW5kIGJyb3dzZXIudGFicy5vbk1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSUQgLSBXaG8gc2VuZCB0aGlzIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gdG9FeHRlbnNpb25JRCAtIFdobyB3aWxsIHJlY2VpdmUgdGhpcyBtZXNzYWdlXG4gICAgICogQHBhcmFtIG1lc3NhZ2VJRCAtIEEgcmFuZG9tIGlkIGNyZWF0ZWQgYnkgdGhlIHNlbmRlci4gVXNlZCB0byBpZGVudGlmeSBpZiB0aGUgbWVzc2FnZSBpcyBhIHJlc3BvbnNlLlxuICAgICAqIEBwYXJhbSBtZXNzYWdlIC0gU2VuZCBieSBhbm90aGVyIGNsaWVudFxuICAgICAqIEBwYXJhbSBzZW5kZXIgLSBJbmZvIG9mIHRoZSBzZW5kZXJcbiAgICAgKi9cbiAgICBvbk1lc3NhZ2UoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZUlEOiBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2U6IEludGVybmFsTWVzc2FnZSxcbiAgICAgICAgc2VuZGVyOiBicm93c2VyLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcixcbiAgICApOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogU2hvdWxkIGluamVjdCB0aGUgZ2l2ZW4gc2NyaXB0IGludG8gdGhlIGdpdmVuIHRhYklEXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIHRhYklEIC0gVGFiIGlkIHRoYXQgbmVlZCBpbmplY3Qgc2NyaXB0IHRvXG4gICAgICogQHBhcmFtIGRldGFpbHMgLSBTZWUgaHR0cHM6Ly9tZG4uaW8vYnJvd3Nlci50YWJzLmV4ZWN1dGVTY3JpcHRcbiAgICAgKi9cbiAgICAnYnJvd3Nlci50YWJzLmV4ZWN1dGVTY3JpcHQnKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICB0YWJJRDogbnVtYmVyLFxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgICBjb2RlPzogc3RyaW5nXG4gICAgICAgICAgICBmaWxlPzogc3RyaW5nXG4gICAgICAgICAgICBydW5BdD86ICdkb2N1bWVudF9zdGFydCcgfCAnZG9jdW1lbnRfZW5kJyB8ICdkb2N1bWVudF9pZGxlJ1xuICAgICAgICB9LFxuICAgICk6IFByb21pc2U8dm9pZD5cbn1cblxuY29uc3Qga2V5ID0gJ2hvbG9mbG93c2pzb25ycGMnXG5jb25zdCBpc0RlYnVnID0gbG9jYXRpb24uaHJlZiA9PT0gJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMC8nXG5jbGFzcyBpT1NXZWJraXRDaGFubmVsIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihrZXksIGUgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gKGUgYXMgQ3VzdG9tRXZlbnQ8YW55PikuZGV0YWlsXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGYgb2YgdGhpcy5saXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGYoZGV0YWlsKVxuICAgICAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG4gICAgcHJpdmF0ZSBsaXN0ZW5lcjogQXJyYXk8KGRhdGE6IHVua25vd24pID0+IHZvaWQ+ID0gW11cbiAgICBvbihfOiBzdHJpbmcsIGNiOiAoZGF0YTogYW55KSA9PiB2b2lkKTogdm9pZCB7XG4gICAgICAgIHRoaXMubGlzdGVuZXIucHVzaChjYilcbiAgICB9XG4gICAgZW1pdChfOiBzdHJpbmcsIGRhdGE6IGFueSk6IHZvaWQge1xuICAgICAgICBpZiAoaXNEZWJ1Zykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3NlbmQnLCBkYXRhKVxuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih3aW5kb3csIHtcbiAgICAgICAgICAgICAgICByZXNwb25zZTogKHJlc3BvbnNlOiBhbnkpID0+XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgQ3VzdG9tRXZlbnQ8YW55PihrZXksIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganNvbnJwYzogJzIuMCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBkYXRhLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHJlc3BvbnNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdpbmRvdy53ZWJraXQgJiYgd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnMgJiYgd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnNba2V5XSlcbiAgICAgICAgICAgIHdpbmRvdy53ZWJraXQubWVzc2FnZUhhbmRsZXJzW2tleV0ucG9zdE1lc3NhZ2UoZGF0YSlcbiAgICB9XG59XG5leHBvcnQgY29uc3QgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbjogVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiA9IHtcbiAgICAvLyB0b2RvOiBjaGVjayBkaXNwYXRjaCB0YXJnZXQncyBtYW5pZmVzdFxuICAgICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnOiBkaXNwYXRjaE5vcm1hbEV2ZW50LmJpbmQobnVsbCwgJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCcsICcqJyksXG4gICAgYXN5bmMgb25NZXNzYWdlKGV4dGVuc2lvbklELCB0b0V4dGVuc2lvbklELCBtZXNzYWdlSUQsIG1lc3NhZ2UsIHNlbmRlcikge1xuICAgICAgICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnbWVzc2FnZSc6XG4gICAgICAgICAgICAgICAgLy8gPyB0aGlzIGlzIGEgcmVzcG9uc2UgdG8gdGhlIG1lc3NhZ2VcbiAgICAgICAgICAgICAgICBpZiAoVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5oYXMobWVzc2FnZUlEKSAmJiBtZXNzYWdlLnJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFtyZXNvbHZlLCByZWplY3RdID0gVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5nZXQobWVzc2FnZUlEKSFcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShtZXNzYWdlLmRhdGEpXG4gICAgICAgICAgICAgICAgICAgIFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIuZGVsZXRlKG1lc3NhZ2VJRClcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UucmVzcG9uc2UgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIG9uTm9ybWFsTWVzc2FnZShtZXNzYWdlLmRhdGEsIHNlbmRlciwgdG9FeHRlbnNpb25JRCwgZXh0ZW5zaW9uSUQsIG1lc3NhZ2VJRClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyA/IGRyb3AgdGhlIG1lc3NhZ2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgJ2V4ZWN1dGVTY3JpcHQnOlxuICAgICAgICAgICAgICAgIGNvbnN0IGV4dCA9IHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uZ2V0KGV4dGVuc2lvbklEKSFcbiAgICAgICAgICAgICAgICBpZiAobWVzc2FnZS5jb2RlKSBleHQuZW52aXJvbm1lbnQuZXZhbHVhdGUobWVzc2FnZS5jb2RlKVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1lc3NhZ2UuZmlsZSlcbiAgICAgICAgICAgICAgICAgICAgbG9hZENvbnRlbnRTY3JpcHQoZXh0ZW5zaW9uSUQsIGV4dC5tYW5pZmVzdCwge1xuICAgICAgICAgICAgICAgICAgICAgICAganM6IFttZXNzYWdlLmZpbGVdLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgdGhlIHBlcm1pc3Npb24gdG8gaW5qZWN0IHRoZSBzY3JpcHRcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZXM6IFsnPGFsbF91cmxzPiddLFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jICdicm93c2VyLnRhYnMuZXhlY3V0ZVNjcmlwdCcoZXh0ZW5zaW9uSUQsIHRhYklELCBkZXRhaWxzKSB7XG4gICAgICAgIHJldHVybiBIb3N0LnNlbmRNZXNzYWdlKGV4dGVuc2lvbklELCBleHRlbnNpb25JRCwgdGFiSUQsIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKSwge1xuICAgICAgICAgICAgLi4uZGV0YWlscyxcbiAgICAgICAgICAgIHR5cGU6ICdleGVjdXRlU2NyaXB0JyxcbiAgICAgICAgfSlcbiAgICB9LFxufVxuZXhwb3J0IGNvbnN0IEhvc3QgPSBBc3luY0NhbGw8SG9zdD4oVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiBhcyBhbnksIHtcbiAgICBrZXk6ICcnLFxuICAgIGxvZzogZmFsc2UsXG4gICAgbWVzc2FnZUNoYW5uZWw6IG5ldyBpT1NXZWJraXRDaGFubmVsKCksXG59KVxuIiwiaW1wb3J0IHsgU3RyaW5nT3JCbG9iIH0gZnJvbSAnLi4vUlBDJ1xuXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlU3RyaW5nT3JCbG9iKHZhbDogU3RyaW5nT3JCbG9iKTogQmxvYiB8IHN0cmluZyB8IEFycmF5QnVmZmVyIHwgbnVsbCB7XG4gICAgaWYgKHZhbC50eXBlID09PSAndGV4dCcpIHJldHVybiB2YWwuY29udGVudFxuICAgIGlmICh2YWwudHlwZSA9PT0gJ2Jsb2InKSByZXR1cm4gbmV3IEJsb2IoW3ZhbC5jb250ZW50XSwgeyB0eXBlOiB2YWwubWltZVR5cGUgfSlcbiAgICBpZiAodmFsLnR5cGUgPT09ICdhcnJheSBidWZmZXInKSB7XG4gICAgICAgIHJldHVybiBiYXNlNjREZWNUb0Fycih2YWwuY29udGVudCkuYnVmZmVyXG4gICAgfVxuICAgIHJldHVybiBudWxsXG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5jb2RlU3RyaW5nT3JCbG9iKHZhbDogQmxvYiB8IHN0cmluZyB8IEFycmF5QnVmZmVyKTogUHJvbWlzZTxTdHJpbmdPckJsb2I+IHtcbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHJldHVybiB7IHR5cGU6ICd0ZXh0JywgY29udGVudDogdmFsIH1cbiAgICBpZiAodmFsIGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgICBjb25zdCBidWZmZXIgPSBuZXcgVWludDhBcnJheShhd2FpdCBuZXcgUmVzcG9uc2UodmFsKS5hcnJheUJ1ZmZlcigpKVxuICAgICAgICByZXR1cm4geyB0eXBlOiAnYmxvYicsIG1pbWVUeXBlOiB2YWwudHlwZSwgY29udGVudDogYmFzZTY0RW5jQXJyKGJ1ZmZlcikgfVxuICAgIH1cbiAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ2FycmF5IGJ1ZmZlcicsIGNvbnRlbnQ6IGJhc2U2NEVuY0FycihuZXcgVWludDhBcnJheSh2YWwpKSB9XG4gICAgfVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgZGF0YScpXG59XG5cbi8vI3JlZ2lvbiAvLyA/IENvZGUgZnJvbSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93QmFzZTY0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmcjQXBwZW5kaXguM0FfRGVjb2RlX2FfQmFzZTY0X3N0cmluZ190b19VaW50OEFycmF5X29yX0FycmF5QnVmZmVyXG5mdW5jdGlvbiBiNjRUb1VpbnQ2KG5DaHI6IG51bWJlcikge1xuICAgIHJldHVybiBuQ2hyID4gNjQgJiYgbkNociA8IDkxXG4gICAgICAgID8gbkNociAtIDY1XG4gICAgICAgIDogbkNociA+IDk2ICYmIG5DaHIgPCAxMjNcbiAgICAgICAgPyBuQ2hyIC0gNzFcbiAgICAgICAgOiBuQ2hyID4gNDcgJiYgbkNociA8IDU4XG4gICAgICAgID8gbkNociArIDRcbiAgICAgICAgOiBuQ2hyID09PSA0M1xuICAgICAgICA/IDYyXG4gICAgICAgIDogbkNociA9PT0gNDdcbiAgICAgICAgPyA2M1xuICAgICAgICA6IDBcbn1cblxuZnVuY3Rpb24gYmFzZTY0RGVjVG9BcnIoc0Jhc2U2NDogc3RyaW5nLCBuQmxvY2tTaXplPzogbnVtYmVyKSB7XG4gICAgdmFyIHNCNjRFbmMgPSBzQmFzZTY0LnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXS9nLCAnJyksXG4gICAgICAgIG5JbkxlbiA9IHNCNjRFbmMubGVuZ3RoLFxuICAgICAgICBuT3V0TGVuID0gbkJsb2NrU2l6ZSA/IE1hdGguY2VpbCgoKG5JbkxlbiAqIDMgKyAxKSA+Pj4gMikgLyBuQmxvY2tTaXplKSAqIG5CbG9ja1NpemUgOiAobkluTGVuICogMyArIDEpID4+PiAyLFxuICAgICAgICBhQnl0ZXMgPSBuZXcgVWludDhBcnJheShuT3V0TGVuKVxuXG4gICAgZm9yICh2YXIgbk1vZDMsIG5Nb2Q0LCBuVWludDI0ID0gMCwgbk91dElkeCA9IDAsIG5JbklkeCA9IDA7IG5JbklkeCA8IG5JbkxlbjsgbkluSWR4KyspIHtcbiAgICAgICAgbk1vZDQgPSBuSW5JZHggJiAzXG4gICAgICAgIG5VaW50MjQgfD0gYjY0VG9VaW50NihzQjY0RW5jLmNoYXJDb2RlQXQobkluSWR4KSkgPDwgKDE4IC0gNiAqIG5Nb2Q0KVxuICAgICAgICBpZiAobk1vZDQgPT09IDMgfHwgbkluTGVuIC0gbkluSWR4ID09PSAxKSB7XG4gICAgICAgICAgICBmb3IgKG5Nb2QzID0gMDsgbk1vZDMgPCAzICYmIG5PdXRJZHggPCBuT3V0TGVuOyBuTW9kMysrLCBuT3V0SWR4KyspIHtcbiAgICAgICAgICAgICAgICBhQnl0ZXNbbk91dElkeF0gPSAoblVpbnQyNCA+Pj4gKCgxNiA+Pj4gbk1vZDMpICYgMjQpKSAmIDI1NVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgblVpbnQyNCA9IDBcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhQnl0ZXNcbn1cbmZ1bmN0aW9uIHVpbnQ2VG9CNjQoblVpbnQ2OiBudW1iZXIpIHtcbiAgICByZXR1cm4gblVpbnQ2IDwgMjZcbiAgICAgICAgPyBuVWludDYgKyA2NVxuICAgICAgICA6IG5VaW50NiA8IDUyXG4gICAgICAgID8gblVpbnQ2ICsgNzFcbiAgICAgICAgOiBuVWludDYgPCA2MlxuICAgICAgICA/IG5VaW50NiAtIDRcbiAgICAgICAgOiBuVWludDYgPT09IDYyXG4gICAgICAgID8gNDNcbiAgICAgICAgOiBuVWludDYgPT09IDYzXG4gICAgICAgID8gNDdcbiAgICAgICAgOiA2NVxufVxuXG5mdW5jdGlvbiBiYXNlNjRFbmNBcnIoYUJ5dGVzOiBVaW50OEFycmF5KSB7XG4gICAgdmFyIGVxTGVuID0gKDMgLSAoYUJ5dGVzLmxlbmd0aCAlIDMpKSAlIDMsXG4gICAgICAgIHNCNjRFbmMgPSAnJ1xuXG4gICAgZm9yICh2YXIgbk1vZDMsIG5MZW4gPSBhQnl0ZXMubGVuZ3RoLCBuVWludDI0ID0gMCwgbklkeCA9IDA7IG5JZHggPCBuTGVuOyBuSWR4KyspIHtcbiAgICAgICAgbk1vZDMgPSBuSWR4ICUgM1xuICAgICAgICAvKiBVbmNvbW1lbnQgdGhlIGZvbGxvd2luZyBsaW5lIGluIG9yZGVyIHRvIHNwbGl0IHRoZSBvdXRwdXQgaW4gbGluZXMgNzYtY2hhcmFjdGVyIGxvbmc6ICovXG4gICAgICAgIC8qXG4gICAgICBpZiAobklkeCA+IDAgJiYgKG5JZHggKiA0IC8gMykgJSA3NiA9PT0gMCkgeyBzQjY0RW5jICs9IFwiXFxyXFxuXCI7IH1cbiAgICAgICovXG4gICAgICAgIG5VaW50MjQgfD0gYUJ5dGVzW25JZHhdIDw8ICgoMTYgPj4+IG5Nb2QzKSAmIDI0KVxuICAgICAgICBpZiAobk1vZDMgPT09IDIgfHwgYUJ5dGVzLmxlbmd0aCAtIG5JZHggPT09IDEpIHtcbiAgICAgICAgICAgIHNCNjRFbmMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShcbiAgICAgICAgICAgICAgICB1aW50NlRvQjY0KChuVWludDI0ID4+PiAxOCkgJiA2MyksXG4gICAgICAgICAgICAgICAgdWludDZUb0I2NCgoblVpbnQyNCA+Pj4gMTIpICYgNjMpLFxuICAgICAgICAgICAgICAgIHVpbnQ2VG9CNjQoKG5VaW50MjQgPj4+IDYpICYgNjMpLFxuICAgICAgICAgICAgICAgIHVpbnQ2VG9CNjQoblVpbnQyNCAmIDYzKSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIG5VaW50MjQgPSAwXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZXFMZW4gPT09IDAgPyBzQjY0RW5jIDogc0I2NEVuYy5zdWJzdHJpbmcoMCwgc0I2NEVuYy5sZW5ndGggLSBlcUxlbikgKyAoZXFMZW4gPT09IDEgPyAnPScgOiAnPT0nKVxufVxuIiwiaW1wb3J0IHsgSG9zdCB9IGZyb20gJy4uL1JQQydcbmltcG9ydCB7IGVuY29kZVN0cmluZ09yQmxvYiB9IGZyb20gJy4uL3V0aWxzL1N0cmluZ09yQmxvYidcblxuY29uc3QgeyBjcmVhdGVPYmplY3RVUkwsIHJldm9rZU9iamVjdFVSTCB9ID0gVVJMXG5leHBvcnQgZnVuY3Rpb24gZ2V0SURGcm9tQmxvYlVSTCh4OiBzdHJpbmcpIHtcbiAgICBpZiAoeC5zdGFydHNXaXRoKCdibG9iOicpKSByZXR1cm4gbmV3IFVSTChuZXcgVVJMKHgpLnBhdGhuYW1lKS5wYXRobmFtZS5yZXBsYWNlKC9eXFwvLywgJycpXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxufVxuLyoqXG4gKiBNb2RpZnkgdGhlIGJlaGF2aW9yIG9mIFVSTC4qXG4gKiBMZXQgdGhlIGJsb2I6Ly8gdXJsIGNhbiBiZSByZWNvZ25pemVkIGJ5IEhvc3QuXG4gKlxuICogQHBhcmFtIHVybCBUaGUgb3JpZ2luYWwgVVJMIG9iamVjdFxuICogQHBhcmFtIGV4dGVuc2lvbklEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmhhbmNlVVJMKHVybDogdHlwZW9mIFVSTCwgZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIHVybC5jcmVhdGVPYmplY3RVUkwgPSBjcmVhdGVPYmplY3RVUkxFbmhhbmNlZChleHRlbnNpb25JRClcbiAgICB1cmwucmV2b2tlT2JqZWN0VVJMID0gcmV2b2tlT2JqZWN0VVJMRW5oYW5jZWQoZXh0ZW5zaW9uSUQpXG4gICAgcmV0dXJuIHVybFxufVxuXG5mdW5jdGlvbiByZXZva2VPYmplY3RVUkxFbmhhbmNlZChleHRlbnNpb25JRDogc3RyaW5nKTogKHVybDogc3RyaW5nKSA9PiB2b2lkIHtcbiAgICByZXR1cm4gKHVybDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldm9rZU9iamVjdFVSTCh1cmwpXG4gICAgICAgIGNvbnN0IGlkID0gZ2V0SURGcm9tQmxvYlVSTCh1cmwpIVxuICAgICAgICBIb3N0WydVUkwucmV2b2tlT2JqZWN0VVJMJ10oZXh0ZW5zaW9uSUQsIGlkKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlT2JqZWN0VVJMRW5oYW5jZWQoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6IChvYmplY3Q6IGFueSkgPT4gc3RyaW5nIHtcbiAgICByZXR1cm4gKG9iajogRmlsZSB8IEJsb2IgfCBNZWRpYVNvdXJjZSkgPT4ge1xuICAgICAgICBjb25zdCB1cmwgPSBjcmVhdGVPYmplY3RVUkwob2JqKVxuICAgICAgICBjb25zdCByZXNvdXJjZUlEID0gZ2V0SURGcm9tQmxvYlVSTCh1cmwpIVxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgICAgICAgZW5jb2RlU3RyaW5nT3JCbG9iKG9iaikudGhlbihibG9iID0+IEhvc3RbJ1VSTC5jcmVhdGVPYmplY3RVUkwnXShleHRlbnNpb25JRCwgcmVzb3VyY2VJRCwgYmxvYikpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybFxuICAgIH1cbn1cblxuZnVuY3Rpb24gYmxvYlRvQmFzZTY0KGJsb2I6IEJsb2IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8c3RyaW5nPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWRlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBbaGVhZGVyLCBiYXNlNjRdID0gKHJlYWRlci5yZXN1bHQgYXMgc3RyaW5nKS5zcGxpdCgnLCcpXG4gICAgICAgICAgICByZXNvbHZlKGJhc2U2NClcbiAgICAgICAgfSlcbiAgICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZSA9PiByZWplY3QoZSkpXG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGJsb2IpXG4gICAgfSlcbn1cbiIsImltcG9ydCB7IEhvc3QsIFRoaXNTaWRlSW1wbGVtZW50YXRpb24gfSBmcm9tICcuLi9SUEMnXG5pbXBvcnQgeyBjcmVhdGVFdmVudExpc3RlbmVyIH0gZnJvbSAnLi4vdXRpbHMvTG9jYWxNZXNzYWdlcydcbmltcG9ydCB7IGNyZWF0ZVJ1bnRpbWVTZW5kTWVzc2FnZSwgc2VuZE1lc3NhZ2VXaXRoUmVzcG9uc2UgfSBmcm9tICcuL2Jyb3dzZXIubWVzc2FnZSdcbmltcG9ydCB7IE1hbmlmZXN0IH0gZnJvbSAnLi4vRXh0ZW5zaW9ucydcbmltcG9ydCB7IGdldElERnJvbUJsb2JVUkwgfSBmcm9tICcuL1VSTC5jcmVhdGUrcmV2b2tlT2JqZWN0VVJMJ1xuLyoqXG4gKiBDcmVhdGUgYSBuZXcgYGJyb3dzZXJgIG9iamVjdC5cbiAqIEBwYXJhbSBleHRlbnNpb25JRCAtIEV4dGVuc2lvbiBJRFxuICogQHBhcmFtIG1hbmlmZXN0IC0gTWFuaWZlc3Qgb2YgdGhlIGV4dGVuc2lvblxuICovXG5leHBvcnQgZnVuY3Rpb24gQnJvd3NlckZhY3RvcnkoZXh0ZW5zaW9uSUQ6IHN0cmluZywgbWFuaWZlc3Q6IE1hbmlmZXN0KTogYnJvd3NlciB7XG4gICAgY29uc3QgaW1wbGVtZW50YXRpb246IFBhcnRpYWw8YnJvd3Nlcj4gPSB7XG4gICAgICAgIGRvd25sb2FkczogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci5kb3dubG9hZHM+KHtcbiAgICAgICAgICAgIGRvd25sb2FkOiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5kb3dubG9hZHMuZG93bmxvYWQnKSh7XG4gICAgICAgICAgICAgICAgcGFyYW0ob3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgeyB1cmwsIGZpbGVuYW1lIH0gPSBvcHRpb25zXG4gICAgICAgICAgICAgICAgICAgIGlmIChnZXRJREZyb21CbG9iVVJMKHVybCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IGBob2xvZmxvd3MtYmxvYjovLyR7ZXh0ZW5zaW9uSUR9LyR7Z2V0SURGcm9tQmxvYlVSTCh1cmwpIX1gXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgUGFydGlhbEltcGxlbWVudGVkKG9wdGlvbnMsICdmaWxlbmFtZScsICd1cmwnKVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmcxID0geyB1cmwsIGZpbGVuYW1lOiBmaWxlbmFtZSB8fCAnJyB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYXJnMV1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJldHVybnMoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9KSxcbiAgICAgICAgcnVudGltZTogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci5ydW50aW1lPih7XG4gICAgICAgICAgICBnZXRVUkwocGF0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBgaG9sb2Zsb3dzLWV4dGVuc2lvbjovLyR7ZXh0ZW5zaW9uSUR9LyR7cGF0aH1gXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0TWFuaWZlc3QoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobWFuaWZlc3QpKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uTWVzc2FnZTogY3JlYXRlRXZlbnRMaXN0ZW5lcihleHRlbnNpb25JRCwgJ2Jyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UnKSxcbiAgICAgICAgICAgIHNlbmRNZXNzYWdlOiBjcmVhdGVSdW50aW1lU2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQpLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFiczogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci50YWJzPih7XG4gICAgICAgICAgICBhc3luYyBleGVjdXRlU2NyaXB0KHRhYklELCBkZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgUGFydGlhbEltcGxlbWVudGVkKGRldGFpbHMsICdjb2RlJywgJ2ZpbGUnLCAncnVuQXQnKVxuICAgICAgICAgICAgICAgIGF3YWl0IFRoaXNTaWRlSW1wbGVtZW50YXRpb25bJ2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0J10oXG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbklELFxuICAgICAgICAgICAgICAgICAgICB0YWJJRCA9PT0gdW5kZWZpbmVkID8gLTEgOiB0YWJJRCxcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlscyxcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlOiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci50YWJzLmNyZWF0ZScpKCksXG4gICAgICAgICAgICBhc3luYyByZW1vdmUodGFiSUQpIHtcbiAgICAgICAgICAgICAgICBsZXQgdDogbnVtYmVyW11cbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodGFiSUQpKSB0ID0gW3RhYklEXVxuICAgICAgICAgICAgICAgIGVsc2UgdCA9IHRhYklEXG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodC5tYXAoeCA9PiBIb3N0Wydicm93c2VyLnRhYnMucmVtb3ZlJ10oZXh0ZW5zaW9uSUQsIHgpKSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBxdWVyeTogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIudGFicy5xdWVyeScpKCksXG4gICAgICAgICAgICB1cGRhdGU6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnRhYnMudXBkYXRlJykoKSxcbiAgICAgICAgICAgIGFzeW5jIHNlbmRNZXNzYWdlPFQgPSBhbnksIFUgPSBvYmplY3Q+KFxuICAgICAgICAgICAgICAgIHRhYklkOiBudW1iZXIsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogVCxcbiAgICAgICAgICAgICAgICBvcHRpb25zPzogeyBmcmFtZUlkPzogbnVtYmVyIHwgdW5kZWZpbmVkIH0gfCB1bmRlZmluZWQsXG4gICAgICAgICAgICApOiBQcm9taXNlPHZvaWQgfCBVPiB7XG4gICAgICAgICAgICAgICAgUGFydGlhbEltcGxlbWVudGVkKG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbmRNZXNzYWdlV2l0aFJlc3BvbnNlKGV4dGVuc2lvbklELCBleHRlbnNpb25JRCwgdGFiSWQsIG1lc3NhZ2UpXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICAgc3RvcmFnZToge1xuICAgICAgICAgICAgbG9jYWw6IEltcGxlbWVudHM8dHlwZW9mIGJyb3dzZXIuc3RvcmFnZS5sb2NhbD4oe1xuICAgICAgICAgICAgICAgIGNsZWFyOiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmNsZWFyJykoKSxcbiAgICAgICAgICAgICAgICByZW1vdmU6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnN0b3JhZ2UubG9jYWwucmVtb3ZlJykoKSxcbiAgICAgICAgICAgICAgICBzZXQ6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0JykoKSxcbiAgICAgICAgICAgICAgICBnZXQ6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0Jykoe1xuICAgICAgICAgICAgICAgICAgICAvKiogSG9zdCBub3QgYWNjZXB0aW5nIHsgYTogMSB9IGFzIGtleXMgKi9cbiAgICAgICAgICAgICAgICAgICAgcGFyYW0oa2V5cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5cykpIHJldHVybiBba2V5cyBhcyBzdHJpbmdbXV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Yga2V5cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5cyA9PT0gbnVsbCkgcmV0dXJuIFtudWxsXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbT2JqZWN0LmtleXMoa2V5cyldXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW251bGxdXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJldHVybnMocnRuLCBba2V5XSk6IG9iamVjdCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXkpKSByZXR1cm4gcnRuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyAmJiBrZXkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyAuLi5rZXksIC4uLnJ0biB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnRuXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHN5bmM6IE5vdEltcGxlbWVudGVkUHJveHkoKSxcbiAgICAgICAgICAgIG9uQ2hhbmdlZDogTm90SW1wbGVtZW50ZWRQcm94eSgpLFxuICAgICAgICB9LFxuICAgICAgICB3ZWJOYXZpZ2F0aW9uOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLndlYk5hdmlnYXRpb24+KHtcbiAgICAgICAgICAgIG9uQ29tbWl0dGVkOiBjcmVhdGVFdmVudExpc3RlbmVyKGV4dGVuc2lvbklELCAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJyksXG4gICAgICAgIH0pLFxuICAgICAgICBleHRlbnNpb246IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIuZXh0ZW5zaW9uPih7XG4gICAgICAgICAgICBnZXRCYWNrZ3JvdW5kUGFnZSgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb3h5KFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogbmV3IFVSTChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBgaG9sb2Zsb3dzLWV4dGVuc2lvbjovLyR7ZXh0ZW5zaW9uSUR9L19nZW5lcmF0ZWRfYmFja2dyb3VuZF9wYWdlLmh0bWxgLFxuICAgICAgICAgICAgICAgICAgICAgICAgKSBhcyBQYXJ0aWFsPExvY2F0aW9uPixcbiAgICAgICAgICAgICAgICAgICAgfSBhcyBQYXJ0aWFsPFdpbmRvdz4sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldChfOiBhbnksIGtleTogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9ba2V5XSkgcmV0dXJuIF9ba2V5XVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ05vdCBzdXBwb3J0ZWQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICApIGFzIFdpbmRvd1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAgIHBlcm1pc3Npb25zOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLnBlcm1pc3Npb25zPih7XG4gICAgICAgICAgICByZXF1ZXN0OiBhc3luYyAoKSA9PiB0cnVlLFxuICAgICAgICAgICAgY29udGFpbnM6IGFzeW5jICgpID0+IHRydWUsXG4gICAgICAgICAgICByZW1vdmU6IGFzeW5jICgpID0+IHRydWUsXG4gICAgICAgIH0pLFxuICAgIH1cbiAgICByZXR1cm4gTm90SW1wbGVtZW50ZWRQcm94eTxicm93c2VyPihpbXBsZW1lbnRhdGlvbiwgZmFsc2UpXG59XG50eXBlIGJyb3dzZXIgPSB0eXBlb2YgYnJvd3NlclxuXG5mdW5jdGlvbiBJbXBsZW1lbnRzPFQ+KGltcGxlbWVudGF0aW9uOiBUKSB7XG4gICAgcmV0dXJuIGltcGxlbWVudGF0aW9uXG59XG5mdW5jdGlvbiBOb3RJbXBsZW1lbnRlZFByb3h5PFQgPSBhbnk+KGltcGxlbWVudGVkOiBQYXJ0aWFsPFQ+ID0ge30sIGZpbmFsID0gdHJ1ZSk6IFQge1xuICAgIHJldHVybiBuZXcgUHJveHkoaW1wbGVtZW50ZWQsIHtcbiAgICAgICAgZ2V0KHRhcmdldDogYW55LCBrZXkpIHtcbiAgICAgICAgICAgIGlmICghdGFyZ2V0W2tleV0pIHJldHVybiBmaW5hbCA/IE5vdEltcGxlbWVudGVkIDogTm90SW1wbGVtZW50ZWRQcm94eSgpXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0W2tleV1cbiAgICAgICAgfSxcbiAgICAgICAgYXBwbHkoKSB7XG4gICAgICAgICAgICByZXR1cm4gTm90SW1wbGVtZW50ZWQoKVxuICAgICAgICB9LFxuICAgIH0pXG59XG5mdW5jdGlvbiBOb3RJbXBsZW1lbnRlZCgpOiBhbnkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQhJylcbiAgICB9XG59XG5mdW5jdGlvbiBQYXJ0aWFsSW1wbGVtZW50ZWQ8VD4ob2JqOiBUID0ge30gYXMgYW55LCAuLi5rZXlzOiAoa2V5b2YgVClbXSkge1xuICAgIGNvbnN0IG9iajIgPSB7IC4uLm9iaiB9XG4gICAga2V5cy5mb3JFYWNoKHggPT4gZGVsZXRlIG9iajJbeF0pXG4gICAgaWYgKE9iamVjdC5rZXlzKG9iajIpLmxlbmd0aCkgY29uc29sZS53YXJuKGBOb3QgaW1wbGVtZW50ZWQgb3B0aW9uc2AsIG9iajIsIGBhdGAsIG5ldyBFcnJvcigpLnN0YWNrKVxufVxuXG50eXBlIEhlYWRsZXNzUGFyYW1ldGVyczxUIGV4dGVuZHMgKC4uLmFyZ3M6IGFueSkgPT4gYW55PiA9IFQgZXh0ZW5kcyAoZXh0ZW5zaW9uSUQ6IHN0cmluZywgLi4uYXJnczogaW5mZXIgUCkgPT4gYW55XG4gICAgPyBQXG4gICAgOiBuZXZlclxuLyoqXG4gKiBHZW5lcmF0ZSBiaW5kaW5nIGJldHdlZW4gSG9zdCBhbmQgV2ViRXh0ZW5zaW9uQVBJXG4gKlxuICogQUxMIGdlbmVyaWNzIHNob3VsZCBiZSBpbmZlcnJlZC4gRE8gTk9UIHdyaXRlIGl0IG1hbnVhbGx5LlxuICpcbiAqIElmIHlvdSBhcmUgd3JpdGluZyBvcHRpb25zLCBtYWtlIHN1cmUgeW91IGFkZCB5b3VyIGZ1bmN0aW9uIHRvIGBCcm93c2VyUmVmZXJlbmNlYCB0byBnZXQgdHlwZSB0aXBzLlxuICpcbiAqIEBwYXJhbSBleHRlbnNpb25JRCAtIFRoZSBleHRlbnNpb24gSURcbiAqIEBwYXJhbSBrZXkgLSBUaGUgQVBJIG5hbWUgaW4gdGhlIHR5cGUgb2YgYEhvc3RgIEFORCBgQnJvd3NlclJlZmVyZW5jZWBcbiAqL1xuZnVuY3Rpb24gYmluZGluZzxcbiAgICAvKiogTmFtZSBvZiB0aGUgQVBJIGluIHRoZSBSUEMgYmluZGluZyAqL1xuICAgIEtleSBleHRlbmRzIGtleW9mIEJyb3dzZXJSZWZlcmVuY2UsXG4gICAgLyoqIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBXZWJFeHRlbnNpb25BUEkgc2lkZSAqL1xuICAgIEJyb3dzZXJEZWYgZXh0ZW5kcyBCcm93c2VyUmVmZXJlbmNlW0tleV0sXG4gICAgLyoqIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBIb3N0IHNpZGUgKi9cbiAgICBIb3N0RGVmIGV4dGVuZHMgSG9zdFtLZXldLFxuICAgIC8qKiBBcmd1bWVudHMgb2YgdGhlIGJyb3dzZXIgc2lkZSAqL1xuICAgIEJyb3dzZXJBcmdzIGV4dGVuZHMgUGFyYW1ldGVyczxCcm93c2VyRGVmPixcbiAgICAvKiogUmV0dXJuIHR5cGUgb2YgdGhlIGJyb3dzZXIgc2lkZSAqL1xuICAgIEJyb3dzZXJSZXR1cm4gZXh0ZW5kcyBQcm9taXNlT2Y8UmV0dXJuVHlwZTxCcm93c2VyRGVmPj4sXG4gICAgLyoqIEFyZ3VtZW50cyB0eXBlIG9mIHRoZSBIb3N0IHNpZGUgKi9cbiAgICBIb3N0QXJncyBleHRlbmRzIEhlYWRsZXNzUGFyYW1ldGVyczxIb3N0RGVmPixcbiAgICAvKiogUmV0dXJuIHR5cGUgb2YgdGhlIEhvc3Qgc2lkZSAqL1xuICAgIEhvc3RSZXR1cm4gZXh0ZW5kcyBQcm9taXNlT2Y8UmV0dXJuVHlwZTxIb3N0RGVmPj5cbj4oZXh0ZW5zaW9uSUQ6IHN0cmluZywga2V5OiBLZXkpIHtcbiAgICAvKipcbiAgICAgKiBBbmQgaGVyZSB3ZSBzcGxpdCBpdCBpbnRvIDIgZnVuY3Rpb24sIGlmIHdlIGpvaW4gdGhlbSB0b2dldGhlciBpdCB3aWxsIGJyZWFrIHRoZSBpbmZlciAoYnV0IGlkayB3aHkpXG4gICAgICovXG4gICAgcmV0dXJuIDxcbiAgICAgICAgLyoqIEhlcmUgd2UgaGF2ZSB0byB1c2UgZ2VuZXJpY3Mgd2l0aCBndWFyZCB0byBlbnN1cmUgVHlwZVNjcmlwdCB3aWxsIGluZmVyIHR5cGUgb24gcnVudGltZSAqL1xuICAgICAgICBPcHRpb25zIGV4dGVuZHMge1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAqIEhlcmUgd2Ugd3JpdGUgdGhlIHR5cGUgZ3VhcmQgaW4gdGhlIGdlbmVyaWMsXG4gICAgICAgICAgICAgKiBkb24ndCB1c2UgdHdvIG1vcmUgZ2VuZXJpY3MgdG8gaW5mZXIgdGhlIHJldHVybiB0eXBlIG9mIGBwYXJhbWAgYW5kIGByZXR1cm5zYCxcbiAgICAgICAgICAgICAqIHRoYXQgd2lsbCBicmVhayB0aGUgaW5mZXIgcmVzdWx0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwYXJhbT86ICguLi5hcmdzOiBCcm93c2VyQXJncykgPT4gSG9zdEFyZ3NcbiAgICAgICAgICAgIHJldHVybnM/OiAocmV0dXJuczogSG9zdFJldHVybiwgYnJvd3NlcjogQnJvd3NlckFyZ3MsIGhvc3Q6IEhvc3RBcmdzKSA9PiBCcm93c2VyUmV0dXJuXG4gICAgICAgIH1cbiAgICA+KFxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucy4gWW91IGNhbiB3cml0ZSB0aGUgYnJpZGdlIGJldHdlZW4gSG9zdCBzaWRlIGFuZCBXZWJFeHRlbnNpb24gc2lkZS5cbiAgICAgICAgICovXG4gICAgICAgIG9wdGlvbnM6IE9wdGlvbnMgPSB7fSBhcyBhbnksXG4gICAgKSA9PiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEb24ndCB3cml0ZSB0aGVzZSB0eXBlIGFsaWFzIGluIGdlbmVyaWNzLiB3aWxsIGJyZWFrLiBpZGsgd2h5IGFnYWluLlxuICAgICAgICAgKi9cbiAgICAgICAgdHlwZSBIYXNQYXJhbUZuID0gdW5kZWZpbmVkIGV4dGVuZHMgT3B0aW9uc1sncGFyYW0nXSA/IGZhbHNlIDogdHJ1ZVxuICAgICAgICB0eXBlIEhhc1JldHVybkZuID0gdW5kZWZpbmVkIGV4dGVuZHMgT3B0aW9uc1sncmV0dXJucyddID8gZmFsc2UgOiB0cnVlXG4gICAgICAgIHR5cGUgX19fQXJnc19fXyA9IFJldHVyblR5cGU8Tm9uTnVsbGFibGU8T3B0aW9uc1sncGFyYW0nXT4+XG4gICAgICAgIHR5cGUgX19fUmV0dXJuX19fID0gUmV0dXJuVHlwZTxOb25OdWxsYWJsZTxPcHRpb25zWydyZXR1cm5zJ10+PlxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgdGhlcmUgaXMgYSBicmlkZ2UgZnVuY3Rpb25cbiAgICAgICAgICogLSBpZiBpdHMgcmV0dXJuIHR5cGUgc2F0aXNmaWVkIHRoZSByZXF1aXJlbWVudCwgcmV0dXJuIHRoZSBgQnJvd3NlckFyZ3NgIGVsc2UgcmV0dXJuIGBuZXZlcmBcbiAgICAgICAgICpcbiAgICAgICAgICogcmV0dXJuIHRoZSBgSG9zdEFyZ3NgIGFuZCBsZXQgVHlwZVNjcmlwdCBjaGVjayBpZiBpdCBpcyBzYXRpc2ZpZWQuXG4gICAgICAgICAqL1xuICAgICAgICB0eXBlIEluZmVyQXJnc1Jlc3VsdCA9IEhhc1BhcmFtRm4gZXh0ZW5kcyB0cnVlXG4gICAgICAgICAgICA/IF9fX0FyZ3NfX18gZXh0ZW5kcyBCcm93c2VyQXJnc1xuICAgICAgICAgICAgICAgID8gQnJvd3NlckFyZ3NcbiAgICAgICAgICAgICAgICA6IG5ldmVyXG4gICAgICAgICAgICA6IEhvc3RBcmdzXG4gICAgICAgIC8qKiBKdXN0IGxpa2UgYEluZmVyQXJnc1Jlc3VsdGAgKi9cbiAgICAgICAgdHlwZSBJbmZlclJldHVyblJlc3VsdCA9IEhhc1JldHVybkZuIGV4dGVuZHMgdHJ1ZVxuICAgICAgICAgICAgPyBfX19SZXR1cm5fX18gZXh0ZW5kcyBCcm93c2VyUmV0dXJuXG4gICAgICAgICAgICAgICAgPyBfX19SZXR1cm5fX19cbiAgICAgICAgICAgICAgICA6ICduZXZlciBydG4nXG4gICAgICAgICAgICA6IEhvc3RSZXR1cm5cbiAgICAgICAgY29uc3Qgbm9vcCA9IDxUPih4PzogVCkgPT4geCBhcyBUXG4gICAgICAgIGNvbnN0IG5vb3BBcmdzID0gKC4uLmFyZ3M6IGFueVtdKSA9PiBhcmdzXG4gICAgICAgIGNvbnN0IGhvc3REZWZpbml0aW9uOiAoZXh0ZW5zaW9uSUQ6IHN0cmluZywgLi4uYXJnczogSG9zdEFyZ3MpID0+IFByb21pc2U8SG9zdFJldHVybj4gPSBIb3N0W2tleV0gYXMgYW55XG4gICAgICAgIHJldHVybiAoKGFzeW5jICguLi5hcmdzOiBCcm93c2VyQXJncyk6IFByb21pc2U8QnJvd3NlclJldHVybj4gPT4ge1xuICAgICAgICAgICAgLy8gPyBUcmFuc2Zvcm0gV2ViRXh0ZW5zaW9uIEFQSSBhcmd1bWVudHMgdG8gaG9zdCBhcmd1bWVudHNcbiAgICAgICAgICAgIGNvbnN0IGhvc3RBcmdzID0gKG9wdGlvbnMucGFyYW0gfHwgbm9vcEFyZ3MpKC4uLmFyZ3MpIGFzIEhvc3RBcmdzXG4gICAgICAgICAgICAvLyA/IGV4ZWN1dGVcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhvc3REZWZpbml0aW9uKGV4dGVuc2lvbklELCAuLi5ob3N0QXJncylcbiAgICAgICAgICAgIGNvbnN0IGYgPSBvcHRpb25zLnJldHVybnMgfHwgKG5vb3AgYXMgTm9uTnVsbGFibGU8dHlwZW9mIG9wdGlvbnMucmV0dXJucz4pXG4gICAgICAgICAgICAvLyA/IFRyYW5zZm9ybSBob3N0IHJlc3VsdCB0byBXZWJFeHRlbnNpb24gQVBJIHJlc3VsdFxuICAgICAgICAgICAgY29uc3QgYnJvd3NlclJlc3VsdCA9IGYocmVzdWx0LCBhcmdzLCBob3N0QXJncykgYXMgQnJvd3NlclJldHVyblxuICAgICAgICAgICAgcmV0dXJuIGJyb3dzZXJSZXN1bHRcbiAgICAgICAgfSkgYXMgdW5rbm93bikgYXMgKC4uLmFyZ3M6IEluZmVyQXJnc1Jlc3VsdCkgPT4gUHJvbWlzZTxJbmZlclJldHVyblJlc3VsdD5cbiAgICB9XG59XG4vKipcbiAqIEEgcmVmZXJlbmNlIHRhYmxlIGJldHdlZW4gSG9zdCBhbmQgV2ViRXh0ZW5zaW9uQVBJXG4gKlxuICoga2V5IGlzIGluIHRoZSBob3N0LCByZXN1bHQgdHlwZSBpcyBpbiB0aGUgV2ViRXh0ZW5zaW9uLlxuICovXG50eXBlIEJyb3dzZXJSZWZlcmVuY2UgPSB7IFtrZXkgaW4ga2V5b2YgdHlwZW9mIEhvc3RdOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiBQcm9taXNlPHVua25vd24+IH0gJiB7XG4gICAgJ2Jyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkJzogdHlwZW9mIGJyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkXG4gICAgJ2Jyb3dzZXIudGFicy5jcmVhdGUnOiB0eXBlb2YgYnJvd3Nlci50YWJzLmNyZWF0ZVxufVxudHlwZSBQcm9taXNlT2Y8VD4gPSBUIGV4dGVuZHMgUHJvbWlzZTxpbmZlciBVPiA/IFUgOiBuZXZlclxuIiwiaW1wb3J0IHsgSG9zdCB9IGZyb20gJy4uL1JQQydcbmltcG9ydCB7IGRlY29kZVN0cmluZ09yQmxvYiB9IGZyb20gJy4uL3V0aWxzL1N0cmluZ09yQmxvYidcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZldGNoKGV4dGVuc2lvbklEOiBzdHJpbmcsIG9yaWdGZXRjaDogdHlwZW9mIGZldGNoKTogdHlwZW9mIGZldGNoIHtcbiAgICByZXR1cm4gbmV3IFByb3h5KGZldGNoLCB7XG4gICAgICAgIGFzeW5jIGFwcGx5KHRhcmdldCwgdGhpc0FyZywgW3JlcXVlc3RJbmZvLCByZXF1ZXN0SW5pdF06IFBhcmFtZXRlcnM8dHlwZW9mIGZldGNoPikge1xuICAgICAgICAgICAgY29uc3QgeyBtZXRob2QsIHVybCB9ID0gbmV3IFJlcXVlc3QocmVxdWVzdEluZm8sIHJlcXVlc3RJbml0KVxuICAgICAgICAgICAgaWYgKHVybC5zdGFydHNXaXRoKCdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJyArIGV4dGVuc2lvbklEICsgJy8nKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnRmV0Y2gocmVxdWVzdEluZm8sIHJlcXVlc3RJbml0KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBIb3N0LmZldGNoKGV4dGVuc2lvbklELCB7IG1ldGhvZCwgdXJsIH0pXG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGRlY29kZVN0cmluZ09yQmxvYihyZXN1bHQuZGF0YSlcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKCcnKVxuICAgICAgICAgICAgICAgIGNvbnN0IHJldHVyblZhbHVlID0gbmV3IFJlc3BvbnNlKGRhdGEsIHJlc3VsdClcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9KVxufVxuIiwibGV0IGxhc3RVc2VyQWN0aXZlID0gMFxubGV0IG5vdyA9IERhdGUubm93LmJpbmQoRGF0ZSlcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgJ2NsaWNrJyxcbiAgICAoKSA9PiB7XG4gICAgICAgIGxhc3RVc2VyQWN0aXZlID0gbm93KClcbiAgICB9LFxuICAgIHsgY2FwdHVyZTogdHJ1ZSwgcGFzc2l2ZTogdHJ1ZSB9LFxuKVxuZXhwb3J0IGZ1bmN0aW9uIGhhc1ZhbGlkVXNlckludGVyYWN0aXZlKCkge1xuICAgIHJldHVybiBub3coKSAtIGxhc3RVc2VyQWN0aXZlIDwgMzAwMFxufVxuIiwiaW1wb3J0IHsgSG9zdCB9IGZyb20gJy4uL1JQQydcbmltcG9ydCB7IGhhc1ZhbGlkVXNlckludGVyYWN0aXZlIH0gZnJvbSAnLi4vdXRpbHMvVXNlckludGVyYWN0aXZlJ1xuXG5leHBvcnQgZnVuY3Rpb24gb3BlbkVuaGFuY2VkKGV4dGVuc2lvbklEOiBzdHJpbmcpOiB0eXBlb2Ygb3BlbiB7XG4gICAgcmV0dXJuICh1cmwgPSAnYWJvdXQ6YmxhbmsnLCB0YXJnZXQ/OiBzdHJpbmcsIGZlYXR1cmVzPzogc3RyaW5nLCByZXBsYWNlPzogYm9vbGVhbikgPT4ge1xuICAgICAgICBpZiAoIWhhc1ZhbGlkVXNlckludGVyYWN0aXZlKCkpIHJldHVybiBudWxsXG4gICAgICAgIGlmICgodGFyZ2V0ICYmIHRhcmdldCAhPT0gJ19ibGFuaycpIHx8IGZlYXR1cmVzIHx8IHJlcGxhY2UpXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1Vuc3VwcG9ydGVkIG9wZW4nLCB1cmwsIHRhcmdldCwgZmVhdHVyZXMsIHJlcGxhY2UpXG4gICAgICAgIEhvc3RbJ2Jyb3dzZXIudGFicy5jcmVhdGUnXShleHRlbnNpb25JRCwge1xuICAgICAgICAgICAgYWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgdXJsLFxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsb3NlRW5oYW5jZWQoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6IHR5cGVvZiBjbG9zZSB7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKCFoYXNWYWxpZFVzZXJJbnRlcmFjdGl2ZSgpKSByZXR1cm5cbiAgICAgICAgSG9zdFsnYnJvd3Nlci50YWJzLnF1ZXJ5J10oZXh0ZW5zaW9uSUQsIHsgYWN0aXZlOiB0cnVlIH0pLnRoZW4oaSA9PlxuICAgICAgICAgICAgSG9zdFsnYnJvd3Nlci50YWJzLnJlbW92ZSddKGV4dGVuc2lvbklELCBpWzBdLmlkISksXG4gICAgICAgIClcbiAgICB9XG59XG4iLCIvKipcbiAqIFRoaXMgZmlsZSBwYXJ0bHkgaW1wbGVtZW50cyBYUmF5VmlzaW9uIGluIEZpcmVmb3gncyBXZWJFeHRlbnNpb24gc3RhbmRhcmRcbiAqIGJ5IGNyZWF0ZSBhIHR3by13YXkgSlMgc2FuZGJveCBidXQgc2hhcmVkIERPTSBlbnZpcm9ubWVudC5cbiAqXG4gKiBjbGFzcyBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnQgd2lsbCByZXR1cm4gYSBuZXcgSlMgZW52aXJvbm1lbnRcbiAqIHRoYXQgaGFzIGEgXCJicm93c2VyXCIgdmFyaWFibGUgaW5zaWRlIG9mIGl0IGFuZCBhIGNsb25lIG9mIHRoZSBjdXJyZW50IERPTSBlbnZpcm9ubWVudFxuICogdG8gcHJldmVudCB0aGUgbWFpbiB0aHJlYWQgaGFjayBvbiBwcm90b3R5cGUgdG8gYWNjZXNzIHRoZSBjb250ZW50IG9mIENvbnRlbnRTY3JpcHRzLlxuICpcbiAqICMjIENoZWNrbGlzdDpcbiAqIC0gW29dIENvbnRlbnRTY3JpcHQgY2Fubm90IGFjY2VzcyBtYWluIHRocmVhZFxuICogLSBbP10gTWFpbiB0aHJlYWQgY2Fubm90IGFjY2VzcyBDb250ZW50U2NyaXB0XG4gKiAtIFtvXSBDb250ZW50U2NyaXB0IGNhbiBhY2Nlc3MgbWFpbiB0aHJlYWQncyBET01cbiAqIC0gWyBdIENvbnRlbnRTY3JpcHQgbW9kaWZpY2F0aW9uIG9uIERPTSBwcm90b3R5cGUgaXMgbm90IGRpc2NvdmVyYWJsZSBieSBtYWluIHRocmVhZFxuICogLSBbIF0gTWFpbiB0aHJlYWQgbW9kaWZpY2F0aW9uIG9uIERPTSBwcm90b3R5cGUgaXMgbm90IGRpc2NvdmVyYWJsZSBieSBDb250ZW50U2NyaXB0XG4gKi9cbmltcG9ydCBSZWFsbUNvbnN0cnVjdG9yLCB7IFJlYWxtIH0gZnJvbSAncmVhbG1zLXNoaW0nXG5cbmltcG9ydCB7IEJyb3dzZXJGYWN0b3J5IH0gZnJvbSAnLi9icm93c2VyJ1xuaW1wb3J0IHsgTWFuaWZlc3QgfSBmcm9tICcuLi9FeHRlbnNpb25zJ1xuaW1wb3J0IHsgZW5oYW5jZVVSTCB9IGZyb20gJy4vVVJMLmNyZWF0ZStyZXZva2VPYmplY3RVUkwnXG5pbXBvcnQgeyBjcmVhdGVGZXRjaCB9IGZyb20gJy4vZmV0Y2gnXG5pbXBvcnQgeyBvcGVuRW5oYW5jZWQsIGNsb3NlRW5oYW5jZWQgfSBmcm9tICcuL3dpbmRvdy5vcGVuK2Nsb3NlJ1xuLyoqXG4gKiBSZWN1cnNpdmVseSBnZXQgdGhlIHByb3RvdHlwZSBjaGFpbiBvZiBhbiBPYmplY3RcbiAqIEBwYXJhbSBvIE9iamVjdFxuICovXG5mdW5jdGlvbiBnZXRQcm90b3R5cGVDaGFpbihvOiBhbnksIF86IGFueVtdID0gW10pOiBhbnlbXSB7XG4gICAgaWYgKG8gPT09IHVuZGVmaW5lZCB8fCBvID09PSBudWxsKSByZXR1cm4gX1xuICAgIGNvbnN0IHkgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YobylcbiAgICBpZiAoeSA9PT0gbnVsbCB8fCB5ID09PSB1bmRlZmluZWQgfHwgeSA9PT0gT2JqZWN0LnByb3RvdHlwZSkgcmV0dXJuIF9cbiAgICByZXR1cm4gZ2V0UHJvdG90eXBlQ2hhaW4oT2JqZWN0LmdldFByb3RvdHlwZU9mKHkpLCBbLi4uXywgeV0pXG59XG4vKipcbiAqIEFwcGx5IGFsbCBXZWJBUElzIHRvIHRoZSBjbGVhbiBzYW5kYm94IGNyZWF0ZWQgYnkgUmVhbG1cbiAqL1xuY29uc3QgUHJlcGFyZVdlYkFQSXMgPSAoKCkgPT4ge1xuICAgIC8vID8gcmVwbGFjZSBGdW5jdGlvbiB3aXRoIHBvbGx1dGVkIHZlcnNpb24gYnkgUmVhbG1zXG4gICAgLy8gISB0aGlzIGxlYWtzIHRoZSBzYW5kYm94IVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QuZ2V0UHJvdG90eXBlT2YoKCkgPT4ge30pLCAnY29uc3RydWN0b3InLCB7XG4gICAgICAgIHZhbHVlOiBnbG9iYWxUaGlzLkZ1bmN0aW9uLFxuICAgIH0pXG4gICAgY29uc3QgcmVhbFdpbmRvdyA9IHdpbmRvd1xuICAgIGNvbnN0IHdlYkFQSXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyh3aW5kb3cpXG4gICAgUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh3ZWJBUElzLCAnd2luZG93JylcbiAgICBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHdlYkFQSXMsICdnbG9iYWxUaGlzJylcbiAgICBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHdlYkFQSXMsICdzZWxmJylcbiAgICBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHdlYkFQSXMsICdnbG9iYWwnKVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShEb2N1bWVudC5wcm90b3R5cGUsICdkZWZhdWx0VmlldycsIHtcbiAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9LFxuICAgIH0pXG4gICAgcmV0dXJuIChzYW5kYm94Um9vdDogdHlwZW9mIGdsb2JhbFRoaXMpID0+IHtcbiAgICAgICAgY29uc3QgY2xvbmVkV2ViQVBJcyA9IHsgLi4ud2ViQVBJcyB9XG4gICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHNhbmRib3hSb290KS5mb3JFYWNoKG5hbWUgPT4gUmVmbGVjdC5kZWxldGVQcm9wZXJ0eShjbG9uZWRXZWJBUElzLCBuYW1lKSlcbiAgICAgICAgLy8gPyBDbG9uZSBXZWIgQVBJc1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiB3ZWJBUElzKSB7XG4gICAgICAgICAgICBQYXRjaFRoaXNPZkRlc2NyaXB0b3JUb0dsb2JhbCh3ZWJBUElzW2tleV0sIHJlYWxXaW5kb3cpXG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHNhbmRib3hSb290LCAnd2luZG93Jywge1xuICAgICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICB2YWx1ZTogc2FuZGJveFJvb3QsXG4gICAgICAgIH0pXG4gICAgICAgIE9iamVjdC5hc3NpZ24oc2FuZGJveFJvb3QsIHsgZ2xvYmFsVGhpczogc2FuZGJveFJvb3QgfSlcbiAgICAgICAgY29uc3QgcHJvdG8gPSBnZXRQcm90b3R5cGVDaGFpbihyZWFsV2luZG93KVxuICAgICAgICAgICAgLm1hcChPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycylcbiAgICAgICAgICAgIC5yZWR1Y2VSaWdodCgocHJldmlvdXMsIGN1cnJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb3B5ID0geyAuLi5jdXJyZW50IH1cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBjb3B5KSB7XG4gICAgICAgICAgICAgICAgICAgIFBhdGNoVGhpc09mRGVzY3JpcHRvclRvR2xvYmFsKGNvcHlba2V5XSwgcmVhbFdpbmRvdylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5jcmVhdGUocHJldmlvdXMsIGNvcHkpXG4gICAgICAgICAgICB9LCB7fSlcbiAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHNhbmRib3hSb290LCBwcm90bylcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoc2FuZGJveFJvb3QsIGNsb25lZFdlYkFQSXMpXG4gICAgfVxufSkoKVxuLyoqXG4gKiBFeGVjdXRpb24gZW52aXJvbm1lbnQgb2YgQ29udGVudFNjcmlwdFxuICovXG5leHBvcnQgY2xhc3MgV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50IGltcGxlbWVudHMgUmVhbG08dHlwZW9mIGdsb2JhbFRoaXMgJiB7IGJyb3dzZXI6IHR5cGVvZiBicm93c2VyIH0+IHtcbiAgICBwcml2YXRlIHJlYWxtID0gUmVhbG1Db25zdHJ1Y3Rvci5tYWtlUm9vdFJlYWxtKClcbiAgICBnZXQgZ2xvYmFsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFsbS5nbG9iYWxcbiAgICB9XG4gICAgcmVhZG9ubHkgW1N5bWJvbC50b1N0cmluZ1RhZ10gPSAnUmVhbG0nXG4gICAgLyoqXG4gICAgICogRXZhbHVhdGUgYSBzdHJpbmcgaW4gdGhlIGNvbnRlbnQgc2NyaXB0IGVudmlyb25tZW50XG4gICAgICogQHBhcmFtIHNvdXJjZVRleHQgU291cmNlIHRleHRcbiAgICAgKi9cbiAgICBldmFsdWF0ZShzb3VyY2VUZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhbG0uZXZhbHVhdGUoc291cmNlVGV4dClcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IHJ1bm5pbmcgZXh0ZW5zaW9uIGZvciBhbiBjb250ZW50IHNjcmlwdC5cbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSUQgVGhlIGV4dGVuc2lvbiBJRFxuICAgICAqIEBwYXJhbSBtYW5pZmVzdCBUaGUgbWFuaWZlc3Qgb2YgdGhlIGV4dGVuc2lvblxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBleHRlbnNpb25JRDogc3RyaW5nLCBwdWJsaWMgbWFuaWZlc3Q6IE1hbmlmZXN0KSB7XG4gICAgICAgIHRoaXMuaW5pdCgpXG4gICAgfVxuICAgIHByaXZhdGUgaW5pdCgpIHtcbiAgICAgICAgUHJlcGFyZVdlYkFQSXModGhpcy5nbG9iYWwpXG4gICAgICAgIHRoaXMuZ2xvYmFsLmJyb3dzZXIgPSBCcm93c2VyRmFjdG9yeSh0aGlzLmV4dGVuc2lvbklELCB0aGlzLm1hbmlmZXN0KVxuICAgICAgICB0aGlzLmdsb2JhbC5VUkwgPSBlbmhhbmNlVVJMKHRoaXMuZ2xvYmFsLlVSTCwgdGhpcy5leHRlbnNpb25JRClcbiAgICAgICAgdGhpcy5nbG9iYWwuZmV0Y2ggPSBjcmVhdGVGZXRjaCh0aGlzLmV4dGVuc2lvbklELCB3aW5kb3cuZmV0Y2gpXG4gICAgICAgIHRoaXMuZ2xvYmFsLm9wZW4gPSBvcGVuRW5oYW5jZWQodGhpcy5leHRlbnNpb25JRClcbiAgICAgICAgdGhpcy5nbG9iYWwuY2xvc2UgPSBjbG9zZUVuaGFuY2VkKHRoaXMuZXh0ZW5zaW9uSUQpXG4gICAgfVxufVxuLyoqXG4gKiBNYW55IG1ldGhvZHMgb24gYHdpbmRvd2AgcmVxdWlyZXMgYHRoaXNgIHBvaW50cyB0byBhIFdpbmRvdyBvYmplY3RcbiAqIExpa2UgYGFsZXJ0KClgLiBJZiB5b3UgY2FsbCBhbGVydCBhcyBgY29uc3QgdyA9IHsgYWxlcnQgfTsgdy5hbGVydCgpYCxcbiAqIHRoZXJlIHdpbGwgYmUgYW4gSWxsZWdhbCBpbnZvY2F0aW9uLlxuICpcbiAqIFRvIHByZXZlbnQgYHRoaXNgIGJpbmRpbmcgbG9zdCwgd2UgbmVlZCB0byByZWJpbmQgaXQuXG4gKlxuICogQHBhcmFtIGRlc2MgUHJvcGVydHlEZXNjcmlwdG9yXG4gKiBAcGFyYW0gZ2xvYmFsIFRoZSByZWFsIHdpbmRvd1xuICovXG5mdW5jdGlvbiBQYXRjaFRoaXNPZkRlc2NyaXB0b3JUb0dsb2JhbChkZXNjOiBQcm9wZXJ0eURlc2NyaXB0b3IsIGdsb2JhbDogV2luZG93KSB7XG4gICAgY29uc3QgeyBnZXQsIHNldCwgdmFsdWUgfSA9IGRlc2NcbiAgICBpZiAoZ2V0KSBkZXNjLmdldCA9ICgpID0+IGdldC5hcHBseShnbG9iYWwpXG4gICAgaWYgKHNldCkgZGVzYy5zZXQgPSAodmFsOiBhbnkpID0+IHNldC5hcHBseShnbG9iYWwsIHZhbClcbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNvbnN0IGRlc2MyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnModmFsdWUpXG4gICAgICAgIGRlc2MudmFsdWUgPSBmdW5jdGlvbiguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgaWYgKG5ldy50YXJnZXQpIHJldHVybiBSZWZsZWN0LmNvbnN0cnVjdCh2YWx1ZSwgYXJncywgbmV3LnRhcmdldClcbiAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KHZhbHVlLCBnbG9iYWwsIGFyZ3MpXG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZGVzYy52YWx1ZSwgZGVzYzIpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyA/IEZvciB1bmtub3duIHJlYXNvbiB0aGlzIGZhaWwgZm9yIHNvbWUgb2JqZWN0cyBvbiBTYWZhcmkuXG4gICAgICAgICAgICBkZXNjLnZhbHVlLnByb3RvdHlwZSA9IHZhbHVlLnByb3RvdHlwZVxuICAgICAgICB9IGNhdGNoIHt9XG4gICAgfVxufVxuIiwiY29uc3Qgbm9ybWFsaXplZCA9IFN5bWJvbCgnTm9ybWFsaXplZCByZXNvdXJjZXMnKVxuZnVuY3Rpb24gbm9ybWFsaXplUGF0aChwYXRoOiBzdHJpbmcsIGV4dGVuc2lvbklEOiBzdHJpbmcpIHtcbiAgICBjb25zdCBwcmVmaXggPSBnZXRQcmVmaXgoZXh0ZW5zaW9uSUQpXG4gICAgaWYgKHBhdGguc3RhcnRzV2l0aChwcmVmaXgpKSByZXR1cm4gcGF0aFxuICAgIGVsc2UgcmV0dXJuIG5ldyBVUkwocGF0aCwgcHJlZml4KS50b0pTT04oKVxufVxuZnVuY3Rpb24gZ2V0UHJlZml4KGV4dGVuc2lvbklEOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gJ2hvbG9mbG93cy1leHRlbnNpb246Ly8nICsgZXh0ZW5zaW9uSUQgKyAnLydcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlc291cmNlKGV4dGVuc2lvbklEOiBzdHJpbmcsIHJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiwgcGF0aDogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICAvLyBOb3JtYWxpemF0aW9uIHRoZSByZXNvdXJjZXNcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKCFyZXNvdXJjZXNbbm9ybWFsaXplZF0pIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcmVzb3VyY2VzKSB7XG4gICAgICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgoZ2V0UHJlZml4KGV4dGVuc2lvbklEKSkpIGNvbnRpbnVlXG4gICAgICAgICAgICBjb25zdCBvYmogPSByZXNvdXJjZXNba2V5XVxuICAgICAgICAgICAgZGVsZXRlIHJlc291cmNlc1trZXldXG4gICAgICAgICAgICByZXNvdXJjZXNbbmV3IFVSTChrZXksIGdldFByZWZpeChleHRlbnNpb25JRCkpLnRvSlNPTigpXSA9IG9ialxuICAgICAgICB9XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmVzb3VyY2VzW25vcm1hbGl6ZWRdID0gdHJ1ZVxuICAgIH1cbiAgICByZXR1cm4gcmVzb3VyY2VzW25vcm1hbGl6ZVBhdGgocGF0aCwgZXh0ZW5zaW9uSUQpXVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UmVzb3VyY2VBc3luYyhleHRlbnNpb25JRDogc3RyaW5nLCByZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sIHBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IHByZWxvYWRlZCA9IGdldFJlc291cmNlKGV4dGVuc2lvbklELCByZXNvdXJjZXMsIHBhdGgpXG4gICAgaWYgKHByZWxvYWRlZCkgcmV0dXJuIHByZWxvYWRlZFxuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChub3JtYWxpemVQYXRoKHBhdGgsIGV4dGVuc2lvbklEKSlcbiAgICBpZiAocmVzcG9uc2Uub2spIHJldHVybiByZXNwb25zZS50ZXh0KClcbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG4iLCJpbXBvcnQgeyBtYXRjaGluZ1VSTCB9IGZyb20gJy4vdXRpbHMvVVJMTWF0Y2hlcidcbmltcG9ydCB7IFdlYkV4dGVuc2lvbkNvbnRlbnRTY3JpcHRFbnZpcm9ubWVudCB9IGZyb20gJy4vc2hpbXMvWFJheVZpc2lvbidcbmltcG9ydCB7IEJyb3dzZXJGYWN0b3J5IH0gZnJvbSAnLi9zaGltcy9icm93c2VyJ1xuaW1wb3J0IHsgY3JlYXRlRmV0Y2ggfSBmcm9tICcuL3NoaW1zL2ZldGNoJ1xuaW1wb3J0IHsgZW5oYW5jZVVSTCB9IGZyb20gJy4vc2hpbXMvVVJMLmNyZWF0ZStyZXZva2VPYmplY3RVUkwnXG5pbXBvcnQgeyBvcGVuRW5oYW5jZWQsIGNsb3NlRW5oYW5jZWQgfSBmcm9tICcuL3NoaW1zL3dpbmRvdy5vcGVuK2Nsb3NlJ1xuaW1wb3J0IHsgZ2V0UmVzb3VyY2UsIGdldFJlc291cmNlQXN5bmMgfSBmcm9tICcuL3V0aWxzL1Jlc291cmNlcydcblxuZXhwb3J0IHR5cGUgV2ViRXh0ZW5zaW9uSUQgPSBzdHJpbmdcbmV4cG9ydCB0eXBlIE1hbmlmZXN0ID0gUGFydGlhbDxicm93c2VyLnJ1bnRpbWUuTWFuaWZlc3Q+ICZcbiAgICBQaWNrPGJyb3dzZXIucnVudGltZS5NYW5pZmVzdCwgJ25hbWUnIHwgJ3ZlcnNpb24nIHwgJ21hbmlmZXN0X3ZlcnNpb24nPlxuZXhwb3J0IGludGVyZmFjZSBXZWJFeHRlbnNpb24ge1xuICAgIG1hbmlmZXN0OiBNYW5pZmVzdFxuICAgIGVudmlyb25tZW50OiBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnRcbiAgICBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz5cbn1cbmV4cG9ydCBjb25zdCByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uID0gbmV3IE1hcDxXZWJFeHRlbnNpb25JRCwgV2ViRXh0ZW5zaW9uPigpXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJXZWJFeHRlbnNpb24oXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge30sXG4pIHtcbiAgICBjb25zdCBlbnZpcm9ubWVudDogJ2NvbnRlbnQgc2NyaXB0JyB8ICdiYWNrZ3JvdW5kIHNjcmlwdCcgPVxuICAgICAgICBsb2NhdGlvbi5ocmVmLnN0YXJ0c1dpdGgoJ2hvbG9mbG93cy1leHRlbnNpb246Ly8nKSAmJiBsb2NhdGlvbi5ocmVmLmVuZHNXaXRoKCdfZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZS5odG1sJylcbiAgICAgICAgICAgID8gJ2JhY2tncm91bmQgc2NyaXB0J1xuICAgICAgICAgICAgOiAnY29udGVudCBzY3JpcHQnXG4gICAgY29uc29sZS5kZWJ1ZyhcbiAgICAgICAgYFtXZWJFeHRlbnNpb25dIExvYWRpbmcgZXh0ZW5zaW9uICR7bWFuaWZlc3QubmFtZX0oJHtleHRlbnNpb25JRH0pIHdpdGggbWFuaWZlc3RgLFxuICAgICAgICBtYW5pZmVzdCxcbiAgICAgICAgYGFuZCBwcmVsb2FkZWQgcmVzb3VyY2VgLFxuICAgICAgICBwcmVsb2FkZWRSZXNvdXJjZXMsXG4gICAgICAgIGBpbiAke2Vudmlyb25tZW50fSBtb2RlYCxcbiAgICApXG4gICAgaWYgKGxvY2F0aW9uLnByb3RvY29sID09PSAnaG9sb2Zsb3dzLWV4dGVuc2lvbjonKSBwcmVwYXJlQmFja2dyb3VuZEFuZE9wdGlvbnNQYWdlRW52aXJvbm1lbnQoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0KVxuXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKGVudmlyb25tZW50ID09PSAnY29udGVudCBzY3JpcHQnKSB7XG4gICAgICAgICAgICB1bnRpbERvY3VtZW50UmVhZHkoKS50aGVuKCgpID0+IExvYWRDb250ZW50U2NyaXB0KG1hbmlmZXN0LCBleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzKSlcbiAgICAgICAgfSBlbHNlIGlmIChlbnZpcm9ubWVudCA9PT0gJ2JhY2tncm91bmQgc2NyaXB0Jykge1xuICAgICAgICAgICAgdW50aWxEb2N1bWVudFJlYWR5KCkudGhlbigoKSA9PiBMb2FkQmFja2dyb3VuZFNjcmlwdChtYW5pZmVzdCwgZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcykpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtXZWJFeHRlbnNpb25dIHVua25vd24gcnVubmluZyBlbnZpcm9ubWVudCAke2Vudmlyb25tZW50fWApXG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICB9XG4gICAgcmV0dXJuIHJlZ2lzdGVyZWRXZWJFeHRlbnNpb25cbn1cblxuZnVuY3Rpb24gdW50aWxEb2N1bWVudFJlYWR5KCkge1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCByZXNvbHZlLCB7IG9uY2U6IHRydWUsIHBhc3NpdmU6IHRydWUgfSlcbiAgICB9KVxufVxuXG5hc3luYyBmdW5jdGlvbiBMb2FkQmFja2dyb3VuZFNjcmlwdChcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4pIHtcbiAgICBpZiAoIW1hbmlmZXN0LmJhY2tncm91bmQpIHJldHVyblxuICAgIGNvbnN0IHsgcGFnZSwgc2NyaXB0cyB9ID0gbWFuaWZlc3QuYmFja2dyb3VuZCBhcyBhbnlcbiAgICBpZiAocGFnZSkgcmV0dXJuIGNvbnNvbGUud2FybignW1dlYkV4dGVuc2lvbl0gbWFuaWZlc3QuYmFja2dyb3VuZC5wYWdlIGlzIG5vdCBzdXBwb3J0ZWQgeWV0IScpXG4gICAgaWYgKGxvY2F0aW9uLmhvc3RuYW1lICE9PSAnbG9jYWxob3N0JyAmJiAhbG9jYXRpb24uaHJlZi5zdGFydHNXaXRoKCdob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgQmFja2dyb3VuZCBzY3JpcHQgb25seSBhbGxvd2VkIGluIGxvY2FsaG9zdChmb3IgZGVidWdnaW5nKSBhbmQgaG9sb2Zsb3dzLWV4dGVuc2lvbjovL2ApXG4gICAgfVxuICAgIHtcbiAgICAgICAgY29uc3Qgc3JjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihIVE1MU2NyaXB0RWxlbWVudC5wcm90b3R5cGUsICdzcmMnKSFcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEhUTUxTY3JpcHRFbGVtZW50LnByb3RvdHlwZSwgJ3NyYycsIHtcbiAgICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3JjLmdldCEuY2FsbCh0aGlzKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldChwYXRoKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0xvYWRpbmcgJywgcGF0aClcbiAgICAgICAgICAgICAgICBjb25zdCBwcmVsb2FkZWQgPSBnZXRSZXNvdXJjZShleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzLCBwYXRoKVxuICAgICAgICAgICAgICAgIGlmIChwcmVsb2FkZWQpIFJ1bkluR2xvYmFsU2NvcGUoZXh0ZW5zaW9uSUQsIHByZWxvYWRlZClcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGdldFJlc291cmNlQXN5bmMoZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcywgcGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGNvZGUgPT4gY29kZSB8fCBQcm9taXNlLnJlamVjdDxzdHJpbmc+KCdMb2FkaW5nIHJlc291cmNlIGZhaWxlZCcpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oY29kZSA9PiBSdW5Jbkdsb2JhbFNjb3BlKGV4dGVuc2lvbklELCBjb2RlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlID0+IGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB3aGVuIGxvYWRpbmcgcmVzb3VyY2VgLCBwYXRoKSlcbiAgICAgICAgICAgICAgICBzcmMuc2V0IS5jYWxsKHRoaXMsIHBhdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgfVxuICAgIGZvciAoY29uc3QgcGF0aCBvZiAoc2NyaXB0cyBhcyBzdHJpbmdbXSkgfHwgW10pIHtcbiAgICAgICAgY29uc3QgcHJlbG9hZGVkID0gYXdhaXQgZ2V0UmVzb3VyY2VBc3luYyhleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzLCBwYXRoKVxuICAgICAgICBpZiAocHJlbG9hZGVkKSB7XG4gICAgICAgICAgICAvLyA/IFJ1biBpdCBpbiBnbG9iYWwgc2NvcGUuXG4gICAgICAgICAgICBSdW5Jbkdsb2JhbFNjb3BlKGV4dGVuc2lvbklELCBwcmVsb2FkZWQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBbV2ViRXh0ZW5zaW9uXSBCYWNrZ3JvdW5kIHNjcmlwdHMgbm90IGZvdW5kIGZvciAke21hbmlmZXN0Lm5hbWV9OiAke3BhdGh9YClcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHByZXBhcmVCYWNrZ3JvdW5kQW5kT3B0aW9uc1BhZ2VFbnZpcm9ubWVudChleHRlbnNpb25JRDogc3RyaW5nLCBtYW5pZmVzdDogTWFuaWZlc3QpIHtcbiAgICBPYmplY3QuYXNzaWduKHdpbmRvdywge1xuICAgICAgICBicm93c2VyOiBCcm93c2VyRmFjdG9yeShleHRlbnNpb25JRCwgbWFuaWZlc3QpLFxuICAgICAgICBmZXRjaDogY3JlYXRlRmV0Y2goZXh0ZW5zaW9uSUQsIHdpbmRvdy5mZXRjaCksXG4gICAgICAgIFVSTDogZW5oYW5jZVVSTChVUkwsIGV4dGVuc2lvbklEKSxcbiAgICAgICAgb3Blbjogb3BlbkVuaGFuY2VkKGV4dGVuc2lvbklEKSxcbiAgICAgICAgY2xvc2U6IGNsb3NlRW5oYW5jZWQoZXh0ZW5zaW9uSUQpLFxuICAgIH0gYXMgUGFydGlhbDx0eXBlb2YgZ2xvYmFsVGhpcz4pXG59XG5cbmZ1bmN0aW9uIFJ1bkluR2xvYmFsU2NvcGUoZXh0ZW5zaW9uSUQ6IHN0cmluZywgc3JjOiBzdHJpbmcpIHtcbiAgICBpZiAobG9jYXRpb24ucHJvdG9jb2wgPT09ICdob2xvZmxvd3MtZXh0ZW5zaW9uOicpIHJldHVybiBuZXcgRnVuY3Rpb24oc3JjKSgpXG4gICAgY29uc3QgZiA9IG5ldyBGdW5jdGlvbihgd2l0aCAoXG4gICAgICAgICAgICAgICAgbmV3IFByb3h5KHdpbmRvdywge1xuICAgICAgICAgICAgICAgICAgICBnZXQodGFyZ2V0LCBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09ICdsb2NhdGlvbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVUkwoXCJob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJHtleHRlbnNpb25JRH0vX2dlbmVyYXRlZF9iYWNrZ3JvdW5kX3BhZ2UuaHRtbFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYodHlwZW9mIHRhcmdldFtrZXldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzYzIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyh0YXJnZXRba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBmKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ldy50YXJnZXQpIHJldHVybiBSZWZsZWN0LmNvbnN0cnVjdCh0YXJnZXRba2V5XSwgYXJncywgbmV3LnRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuYXBwbHkodGFyZ2V0W2tleV0sIHdpbmRvdywgYXJncylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZiwgZGVzYzIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZi5wcm90b3R5cGUgPSB0YXJnZXRba2V5XS5wcm90b3R5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtrZXldXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApKSB7XG4gICAgICAgICAgICAgICAgJHtzcmN9XG4gICAgICAgICAgICAgIH1gKVxuICAgIGYoKVxufVxuXG5hc3luYyBmdW5jdGlvbiBMb2FkQ29udGVudFNjcmlwdChtYW5pZmVzdDogTWFuaWZlc3QsIGV4dGVuc2lvbklEOiBzdHJpbmcsIHByZWxvYWRlZFJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPikge1xuICAgIGlmICghcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5oYXMoZXh0ZW5zaW9uSUQpKSB7XG4gICAgICAgIGNvbnN0IGVudmlyb25tZW50ID0gbmV3IFdlYkV4dGVuc2lvbkNvbnRlbnRTY3JpcHRFbnZpcm9ubWVudChleHRlbnNpb25JRCwgbWFuaWZlc3QpXG4gICAgICAgIGNvbnN0IGV4dDogV2ViRXh0ZW5zaW9uID0ge1xuICAgICAgICAgICAgbWFuaWZlc3QsXG4gICAgICAgICAgICBlbnZpcm9ubWVudCxcbiAgICAgICAgICAgIHByZWxvYWRlZFJlc291cmNlcyxcbiAgICAgICAgfVxuICAgICAgICByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uLnNldChleHRlbnNpb25JRCwgZXh0KVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IFtpbmRleCwgY29udGVudF0gb2YgKG1hbmlmZXN0LmNvbnRlbnRfc2NyaXB0cyB8fCBbXSkuZW50cmllcygpKSB7XG4gICAgICAgIHdhcm5pbmdOb3RJbXBsZW1lbnRlZEl0ZW0oY29udGVudCwgaW5kZXgpXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIG1hdGNoaW5nVVJMKFxuICAgICAgICAgICAgICAgIG5ldyBVUkwobG9jYXRpb24uaHJlZiksXG4gICAgICAgICAgICAgICAgY29udGVudC5tYXRjaGVzLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQuZXhjbHVkZV9tYXRjaGVzIHx8IFtdLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQuaW5jbHVkZV9nbG9icyB8fCBbXSxcbiAgICAgICAgICAgICAgICBjb250ZW50LmV4Y2x1ZGVfZ2xvYnMgfHwgW10sXG4gICAgICAgICAgICAgICAgY29udGVudC5tYXRjaF9hYm91dF9ibGFuayxcbiAgICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbV2ViRXh0ZW5zaW9uXSBMb2FkaW5nIGNvbnRlbnQgc2NyaXB0IGZvcmAsIGNvbnRlbnQpXG4gICAgICAgICAgICBhd2FpdCBsb2FkQ29udGVudFNjcmlwdChleHRlbnNpb25JRCwgbWFuaWZlc3QsIGNvbnRlbnQsIHByZWxvYWRlZFJlc291cmNlcylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtXZWJFeHRlbnNpb25dIFVSTCBtaXNtYXRjaGVkLiBTa2lwIGNvbnRlbnQgc2NyaXB0IGZvciwgYCwgY29udGVudClcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvYWRDb250ZW50U2NyaXB0KFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgbWFuaWZlc3Q6IE1hbmlmZXN0LFxuICAgIGNvbnRlbnQ6IE5vbk51bGxhYmxlPE1hbmlmZXN0Wydjb250ZW50X3NjcmlwdHMnXT5bMF0sXG4gICAgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0gcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5oYXMoZXh0ZW5zaW9uSUQpXG4gICAgICAgID8gcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5nZXQoZXh0ZW5zaW9uSUQpIS5wcmVsb2FkZWRSZXNvdXJjZXNcbiAgICAgICAgOiB7fSxcbikge1xuICAgIGNvbnN0IHsgZW52aXJvbm1lbnQgfSA9IHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uZ2V0KGV4dGVuc2lvbklEKSFcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgY29udGVudC5qcyB8fCBbXSkge1xuICAgICAgICBjb25zdCBwcmVsb2FkZWQgPSBhd2FpdCBnZXRSZXNvdXJjZUFzeW5jKGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMsIHBhdGgpXG4gICAgICAgIGlmIChwcmVsb2FkZWQpIHtcbiAgICAgICAgICAgIGVudmlyb25tZW50LmV2YWx1YXRlKHByZWxvYWRlZClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtXZWJFeHRlbnNpb25dIENvbnRlbnQgc2NyaXB0cyBub3QgZm91bmQgZm9yICR7bWFuaWZlc3QubmFtZX06ICR7cGF0aH1gKVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiB3YXJuaW5nTm90SW1wbGVtZW50ZWRJdGVtKGNvbnRlbnQ6IE5vbk51bGxhYmxlPE1hbmlmZXN0Wydjb250ZW50X3NjcmlwdHMnXT5bMF0sIGluZGV4OiBudW1iZXIpIHtcbiAgICBpZiAoY29udGVudC5hbGxfZnJhbWVzKVxuICAgICAgICBjb25zb2xlLndhcm4oYGFsbF9mcmFtZXMgbm90IHN1cHBvcnRlZCB5ZXQuIERlZmluZWQgYXQgbWFuaWZlc3QuY29udGVudF9zY3JpcHRzWyR7aW5kZXh9XS5hbGxfZnJhbWVzYClcbiAgICBpZiAoY29udGVudC5jc3MpIGNvbnNvbGUud2FybihgY3NzIG5vdCBzdXBwb3J0ZWQgeWV0LiBEZWZpbmVkIGF0IG1hbmlmZXN0LmNvbnRlbnRfc2NyaXB0c1ske2luZGV4fV0uY3NzYClcbiAgICBpZiAoY29udGVudC5ydW5fYXQgJiYgY29udGVudC5ydW5fYXQgIT09ICdkb2N1bWVudF9zdGFydCcpXG4gICAgICAgIGNvbnNvbGUud2FybihgcnVuX2F0IG5vdCBzdXBwb3J0ZWQgeWV0LiBEZWZpbmVkIGF0IG1hbmlmZXN0LmNvbnRlbnRfc2NyaXB0c1ske2luZGV4fV0ucnVuX2F0YClcbn1cbiIsImltcG9ydCB7IHJlZ2lzdGVyV2ViRXh0ZW5zaW9uIH0gZnJvbSAnLi9FeHRlbnNpb25zJ1xuY29uc3QgZW52ID1cbiAgICBsb2NhdGlvbi5ocmVmLnN0YXJ0c1dpdGgoJ2hvbG9mbG93cy1leHRlbnNpb246Ly8nKSAmJiBsb2NhdGlvbi5ocmVmLmVuZHNXaXRoKCdfZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZS5odG1sJylcbi8vICMjIEluamVjdCBoZXJlXG4vLyA/IHRvIGF2b2lkIHJlZ2lzdGVyV2ViRXh0ZW5zaW9uIG9taXR0ZWQgYnkgcm9sbHVwXG5yZWdpc3RlcldlYkV4dGVuc2lvbi50b1N0cmluZygpXG5cbi8qKlxuICogcmVnaXN0ZXJXZWJFeHRlbnNpb24oXG4gKiAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gKiAgICAgIG1hbmlmZXN0OiBNYW5pZmVzdCxcbiAqICAgICAgcHJlbG9hZGVkUmVzb3VyY2VzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxuICogKVxuICovXG4iXSwibmFtZXMiOlsidGhpcyIsIlJlcXVlc3QiLCJSZWFsbUNvbnN0cnVjdG9yIl0sIm1hcHBpbmdzIjoiOzs7SUFBQTs7Ozs7Ozs7QUFRQSxhQUFnQixXQUFXLENBQ3ZCLFFBQWEsRUFDYixPQUFpQixFQUNqQixlQUF5QixFQUN6QixhQUF1QixFQUN2QixhQUF1QixFQUN2QixXQUFxQjtRQUVyQixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUE7O1FBRWxCLEtBQUssTUFBTSxJQUFJLElBQUksT0FBTztZQUFFLElBQUksZUFBZSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsV0FB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bEIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzFELElBQUk7SUFDSixHQUFHOztJQUVIO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQSxFQUFFLElBQUksRUFBRSxTQUFTLElBQUksQ0FBQyxJQUFJLFVBQVUsR0FBRyxPQUFPO0lBQzlDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFVLE9BQU8sRUFBRSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN2RSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVFLEdBQUc7SUFDSCxFQUFFLENBQUM7SUFDSCxDQUFDOztJQzVERDtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0FBQ0EsSUFDQTtJQUNBO0lBQ0E7QUFDQSxJQUFPLE1BQU0sZUFBZSxHQUFHO0lBQy9CLElBQUksTUFBTSxhQUFhLENBQUMsSUFBSSxFQUFFO0lBQzlCLFFBQVEsT0FBTyxJQUFJLENBQUM7SUFDcEIsS0FBSztJQUNMLElBQUksTUFBTSxlQUFlLENBQUMsVUFBVSxFQUFFO0lBQ3RDLFFBQVEsT0FBTyxVQUFVLENBQUM7SUFDMUIsS0FBSztJQUNMLENBQUMs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