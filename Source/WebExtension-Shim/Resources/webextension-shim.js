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
            return Host.sendMessage(extensionID, extensionID, tabID, Math.random().toString(), Object.assign({}, details, { type: 'executeScript' }));
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
                // ? Transform host result to WebExtension API result
                const browserResult = (options.returns || noop)(result, args, hostArgs);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMvVVJMTWF0Y2hlci50cyIsIi4uL25vZGVfbW9kdWxlcy9yZWFsbXMtc2hpbS9kaXN0L3JlYWxtcy1zaGltLnVtZC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AaG9sb2Zsb3dzL2tpdC9ub2RlX21vZHVsZXMvbWl0dC9kaXN0L21pdHQuZXMuanMiLCIuLi9ub2RlX21vZHVsZXMvQGhvbG9mbG93cy9raXQvZXMvRXh0ZW5zaW9uL01lc3NhZ2VDZW50ZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvQGhvbG9mbG93cy9raXQvZXMvdXRpbC9Bc3luY0NhbGwuanMiLCIuLi9zcmMvdXRpbHMvTG9jYWxNZXNzYWdlcy50cyIsIi4uL3NyYy91dGlscy9kZWVwQ2xvbmUudHMiLCIuLi9zcmMvc2hpbXMvYnJvd3Nlci5tZXNzYWdlLnRzIiwiLi4vc3JjL1JQQy50cyIsIi4uL3NyYy91dGlscy9TdHJpbmdPckJsb2IudHMiLCIuLi9zcmMvc2hpbXMvVVJMLmNyZWF0ZStyZXZva2VPYmplY3RVUkwudHMiLCIuLi9zcmMvc2hpbXMvYnJvd3Nlci50cyIsIi4uL3NyYy9zaGltcy9mZXRjaC50cyIsIi4uL3NyYy91dGlscy9Vc2VySW50ZXJhY3RpdmUudHMiLCIuLi9zcmMvc2hpbXMvd2luZG93Lm9wZW4rY2xvc2UudHMiLCIuLi9zcmMvc2hpbXMvWFJheVZpc2lvbi50cyIsIi4uL3NyYy91dGlscy9SZXNvdXJjZXMudHMiLCIuLi9zcmMvRXh0ZW5zaW9ucy50cyIsIi4uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENoZWNrIGlmIHRoZSBjdXJyZW50IGxvY2F0aW9uIG1hdGNoZXMuIFVzZWQgaW4gbWFuaWZlc3QuanNvbiBwYXJzZXJcbiAqIEBwYXJhbSBsb2NhdGlvbiBDdXJyZW50IGxvY2F0aW9uXG4gKiBAcGFyYW0gbWF0Y2hlc1xuICogQHBhcmFtIGV4Y2x1ZGVfbWF0Y2hlc1xuICogQHBhcmFtIGluY2x1ZGVfZ2xvYnNcbiAqIEBwYXJhbSBleGNsdWRlX2dsb2JzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGluZ1VSTChcbiAgICBsb2NhdGlvbjogVVJMLFxuICAgIG1hdGNoZXM6IHN0cmluZ1tdLFxuICAgIGV4Y2x1ZGVfbWF0Y2hlczogc3RyaW5nW10sXG4gICAgaW5jbHVkZV9nbG9iczogc3RyaW5nW10sXG4gICAgZXhjbHVkZV9nbG9iczogc3RyaW5nW10sXG4gICAgYWJvdXRfYmxhbms/OiBib29sZWFuLFxuKSB7XG4gICAgbGV0IHJlc3VsdCA9IGZhbHNlXG4gICAgLy8gPyBXZSBldmFsIG1hdGNoZXMgZmlyc3QgdGhlbiBldmFsIG1pc21hdGNoZXNcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgbWF0Y2hlcykgaWYgKG1hdGNoZXNfbWF0Y2hlcihpdGVtLCBsb2NhdGlvbiwgYWJvdXRfYmxhbmspKSByZXN1bHQgPSB0cnVlXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIGV4Y2x1ZGVfbWF0Y2hlcykgaWYgKG1hdGNoZXNfbWF0Y2hlcihpdGVtLCBsb2NhdGlvbikpIHJlc3VsdCA9IGZhbHNlXG4gICAgaWYgKGluY2x1ZGVfZ2xvYnMubGVuZ3RoKSBjb25zb2xlLndhcm4oJ2luY2x1ZGVfZ2xvYnMgbm90IHN1cHBvcnRlZCB5ZXQuJylcbiAgICBpZiAoZXhjbHVkZV9nbG9icy5sZW5ndGgpIGNvbnNvbGUud2FybignZXhjbHVkZV9nbG9icyBub3Qgc3VwcG9ydGVkIHlldC4nKVxuICAgIHJldHVybiByZXN1bHRcbn1cbi8qKlxuICogU3VwcG9ydGVkIHByb3RvY29sc1xuICovXG5jb25zdCBzdXBwb3J0ZWRQcm90b2NvbHM6IHJlYWRvbmx5IHN0cmluZ1tdID0gW1xuICAgICdodHRwOicsXG4gICAgJ2h0dHBzOicsXG4gICAgLy8gXCJ3czpcIixcbiAgICAvLyBcIndzczpcIixcbiAgICAvLyBcImZ0cDpcIixcbiAgICAvLyBcImRhdGE6XCIsXG4gICAgLy8gXCJmaWxlOlwiXG5dXG5mdW5jdGlvbiBtYXRjaGVzX21hdGNoZXIoXzogc3RyaW5nLCBsb2NhdGlvbjogVVJMLCBhYm91dF9ibGFuaz86IGJvb2xlYW4pIHtcbiAgICBpZiAobG9jYXRpb24udG9TdHJpbmcoKSA9PT0gJ2Fib3V0OmJsYW5rJyAmJiBhYm91dF9ibGFuaykgcmV0dXJuIHRydWVcbiAgICBpZiAoXyA9PT0gJzxhbGxfdXJscz4nKSB7XG4gICAgICAgIGlmIChzdXBwb3J0ZWRQcm90b2NvbHMuaW5jbHVkZXMobG9jYXRpb24ucHJvdG9jb2wpKSByZXR1cm4gdHJ1ZVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgY29uc3QgW3J1bGUsIHdpbGRjYXJkUHJvdG9jb2xdID0gbm9ybWFsaXplVVJMKF8pXG4gICAgaWYgKHJ1bGUucG9ydCAhPT0gJycpIHJldHVybiBmYWxzZVxuICAgIGlmICghcHJvdG9jb2xfbWF0Y2hlcihydWxlLnByb3RvY29sLCBsb2NhdGlvbi5wcm90b2NvbCwgd2lsZGNhcmRQcm90b2NvbCkpIHJldHVybiBmYWxzZVxuICAgIGlmICghaG9zdF9tYXRjaGVyKHJ1bGUuaG9zdG5hbWUsIGxvY2F0aW9uLmhvc3RuYW1lKSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKCFwYXRoX21hdGNoZXIocnVsZS5wYXRobmFtZSwgbG9jYXRpb24ucGF0aG5hbWUsIGxvY2F0aW9uLnNlYXJjaCkpIHJldHVybiBmYWxzZVxuICAgIHJldHVybiB0cnVlXG59XG4vKipcbiAqIE5vcm1hbGl6ZVVSTFxuICogQHBhcmFtIF8gLSBVUkwgZGVmaW5lZCBpbiBtYW5pZmVzdFxuICovXG5mdW5jdGlvbiBub3JtYWxpemVVUkwoXzogc3RyaW5nKTogW1VSTCwgYm9vbGVhbl0ge1xuICAgIGlmIChfLnN0YXJ0c1dpdGgoJyo6Ly8nKSkgcmV0dXJuIFtuZXcgVVJMKF8ucmVwbGFjZSgvXlxcKjovLCAnaHR0cHM6JykpLCB0cnVlXVxuICAgIHJldHVybiBbbmV3IFVSTChfKSwgZmFsc2VdXG59XG5mdW5jdGlvbiBwcm90b2NvbF9tYXRjaGVyKG1hdGNoZXJQcm90b2NvbDogc3RyaW5nLCBjdXJyZW50UHJvdG9jb2w6IHN0cmluZywgd2lsZGNhcmRQcm90b2NvbDogYm9vbGVhbikge1xuICAgIC8vID8gb25seSBgaHR0cDpgIGFuZCBgaHR0cHM6YCBpcyBzdXBwb3J0ZWQgY3VycmVudGx5XG4gICAgaWYgKCFzdXBwb3J0ZWRQcm90b2NvbHMuaW5jbHVkZXMoY3VycmVudFByb3RvY29sKSkgcmV0dXJuIGZhbHNlXG4gICAgLy8gPyBpZiB3YW50ZWQgcHJvdG9jb2wgaXMgXCIqOlwiLCBtYXRjaCBldmVyeXRoaW5nXG4gICAgaWYgKHdpbGRjYXJkUHJvdG9jb2wpIHJldHVybiB0cnVlXG4gICAgaWYgKG1hdGNoZXJQcm90b2NvbCA9PT0gY3VycmVudFByb3RvY29sKSByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBmYWxzZVxufVxuZnVuY3Rpb24gaG9zdF9tYXRjaGVyKG1hdGNoZXJIb3N0OiBzdHJpbmcsIGN1cnJlbnRIb3N0OiBzdHJpbmcpIHtcbiAgICAvLyA/ICUyQSBpcyAqXG4gICAgaWYgKG1hdGNoZXJIb3N0ID09PSAnJTJBJykgcmV0dXJuIHRydWVcbiAgICBpZiAobWF0Y2hlckhvc3Quc3RhcnRzV2l0aCgnJTJBLicpKSB7XG4gICAgICAgIGNvbnN0IHBhcnQgPSBtYXRjaGVySG9zdC5yZXBsYWNlKC9eJTJBLywgJycpXG4gICAgICAgIGlmIChwYXJ0ID09PSBjdXJyZW50SG9zdCkgcmV0dXJuIGZhbHNlXG4gICAgICAgIHJldHVybiBjdXJyZW50SG9zdC5lbmRzV2l0aChwYXJ0KVxuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hlckhvc3QgPT09IGN1cnJlbnRIb3N0XG59XG5mdW5jdGlvbiBwYXRoX21hdGNoZXIobWF0Y2hlclBhdGg6IHN0cmluZywgY3VycmVudFBhdGg6IHN0cmluZywgY3VycmVudFNlYXJjaDogc3RyaW5nKSB7XG4gICAgaWYgKCFtYXRjaGVyUGF0aC5zdGFydHNXaXRoKCcvJykpIHJldHVybiBmYWxzZVxuICAgIGlmIChtYXRjaGVyUGF0aCA9PT0gJy8qJykgcmV0dXJuIHRydWVcbiAgICAvLyA/ICcvYS9iL2MnIG1hdGNoZXMgJy9hL2IvYyMxMjMnIGJ1dCBub3QgJy9hL2IvYz8xMjMnXG4gICAgaWYgKG1hdGNoZXJQYXRoID09PSBjdXJyZW50UGF0aCAmJiBjdXJyZW50U2VhcmNoID09PSAnJykgcmV0dXJuIHRydWVcbiAgICAvLyA/ICcvYS9iLyonIG1hdGNoZXMgZXZlcnl0aGluZyBzdGFydHNXaXRoICcvYS9iLydcbiAgICBpZiAobWF0Y2hlclBhdGguZW5kc1dpdGgoJyonKSAmJiBjdXJyZW50UGF0aC5zdGFydHNXaXRoKG1hdGNoZXJQYXRoLnNsaWNlKHVuZGVmaW5lZCwgLTEpKSkgcmV0dXJuIHRydWVcbiAgICBpZiAobWF0Y2hlclBhdGguaW5kZXhPZignKicpID09PSAtMSkgcmV0dXJuIG1hdGNoZXJQYXRoID09PSBjdXJyZW50UGF0aFxuICAgIGNvbnNvbGUud2FybignTm90IHN1cHBvcnRlZCBwYXRoIG1hdGNoZXIgaW4gbWFuaWZlc3QuanNvbicsIG1hdGNoZXJQYXRoKVxuICAgIHJldHVybiB0cnVlXG59XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShmYWN0b3J5KSA6XG4gIChnbG9iYWwgPSBnbG9iYWwgfHwgc2VsZiwgZ2xvYmFsLlJlYWxtID0gZmFjdG9yeSgpKTtcbn0odGhpcywgZnVuY3Rpb24gKCkgeyAndXNlIHN0cmljdCc7XG5cbiAgLy8gd2UnZCBsaWtlIHRvIGFiYW5kb24sIGJ1dCB3ZSBjYW4ndCwgc28ganVzdCBzY3JlYW0gYW5kIGJyZWFrIGEgbG90IG9mXG4gIC8vIHN0dWZmLiBIb3dldmVyLCBzaW5jZSB3ZSBhcmVuJ3QgcmVhbGx5IGFib3J0aW5nIHRoZSBwcm9jZXNzLCBiZSBjYXJlZnVsIHRvXG4gIC8vIG5vdCB0aHJvdyBhbiBFcnJvciBvYmplY3Qgd2hpY2ggY291bGQgYmUgY2FwdHVyZWQgYnkgY2hpbGQtUmVhbG0gY29kZSBhbmRcbiAgLy8gdXNlZCB0byBhY2Nlc3MgdGhlICh0b28tcG93ZXJmdWwpIHByaW1hbC1yZWFsbSBFcnJvciBvYmplY3QuXG5cbiAgZnVuY3Rpb24gdGhyb3dUYW50cnVtKHMsIGVyciA9IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IG1zZyA9IGBwbGVhc2UgcmVwb3J0IGludGVybmFsIHNoaW0gZXJyb3I6ICR7c31gO1xuXG4gICAgLy8gd2Ugd2FudCB0byBsb2cgdGhlc2UgJ3Nob3VsZCBuZXZlciBoYXBwZW4nIHRoaW5ncy5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICBpZiAoZXJyKSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgY29uc29sZS5lcnJvcihgJHtlcnJ9YCk7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgY29uc29sZS5lcnJvcihgJHtlcnIuc3RhY2t9YCk7XG4gICAgfVxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWRlYnVnZ2VyXG4gICAgZGVidWdnZXI7XG4gICAgdGhyb3cgbXNnO1xuICB9XG5cbiAgZnVuY3Rpb24gYXNzZXJ0KGNvbmRpdGlvbiwgbWVzc2FnZSkge1xuICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICB0aHJvd1RhbnRydW0obWVzc2FnZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVtb3ZlIGNvZGUgbW9kaWZpY2F0aW9ucy5cbiAgZnVuY3Rpb24gY2xlYW51cFNvdXJjZShzcmMpIHtcbiAgICByZXR1cm4gc3JjO1xuICB9XG5cbiAgLy8gYnVpbGRDaGlsZFJlYWxtIGlzIGltbWVkaWF0ZWx5IHR1cm5lZCBpbnRvIGEgc3RyaW5nLCBhbmQgdGhpcyBmdW5jdGlvbiBpc1xuICAvLyBuZXZlciByZWZlcmVuY2VkIGFnYWluLCBiZWNhdXNlIGl0IGNsb3NlcyBvdmVyIHRoZSB3cm9uZyBpbnRyaW5zaWNzXG5cbiAgZnVuY3Rpb24gYnVpbGRDaGlsZFJlYWxtKHVuc2FmZVJlYywgQmFzZVJlYWxtKSB7XG4gICAgY29uc3Qge1xuICAgICAgaW5pdFJvb3RSZWFsbSxcbiAgICAgIGluaXRDb21wYXJ0bWVudCxcbiAgICAgIGdldFJlYWxtR2xvYmFsLFxuICAgICAgcmVhbG1FdmFsdWF0ZVxuICAgIH0gPSBCYXNlUmVhbG07XG5cbiAgICAvLyBUaGlzIE9iamVjdCBhbmQgUmVmbGVjdCBhcmUgYnJhbmQgbmV3LCBmcm9tIGEgbmV3IHVuc2FmZVJlYywgc28gbm8gdXNlclxuICAgIC8vIGNvZGUgaGFzIGJlZW4gcnVuIG9yIGhhZCBhIGNoYW5jZSB0byBtYW5pcHVsYXRlIHRoZW0uIFdlIGV4dHJhY3QgdGhlc2VcbiAgICAvLyBwcm9wZXJ0aWVzIGZvciBicmV2aXR5LCBub3QgZm9yIHNlY3VyaXR5LiBEb24ndCBldmVyIHJ1biB0aGlzIGZ1bmN0aW9uXG4gICAgLy8gKmFmdGVyKiB1c2VyIGNvZGUgaGFzIGhhZCBhIGNoYW5jZSB0byBwb2xsdXRlIGl0cyBlbnZpcm9ubWVudCwgb3IgaXRcbiAgICAvLyBjb3VsZCBiZSB1c2VkIHRvIGdhaW4gYWNjZXNzIHRvIEJhc2VSZWFsbSBhbmQgcHJpbWFsLXJlYWxtIEVycm9yXG4gICAgLy8gb2JqZWN0cy5cbiAgICBjb25zdCB7IGNyZWF0ZSwgZGVmaW5lUHJvcGVydGllcyB9ID0gT2JqZWN0O1xuXG4gICAgY29uc3QgZXJyb3JDb25zdHJ1Y3RvcnMgPSBuZXcgTWFwKFtcbiAgICAgIFsnRXZhbEVycm9yJywgRXZhbEVycm9yXSxcbiAgICAgIFsnUmFuZ2VFcnJvcicsIFJhbmdlRXJyb3JdLFxuICAgICAgWydSZWZlcmVuY2VFcnJvcicsIFJlZmVyZW5jZUVycm9yXSxcbiAgICAgIFsnU3ludGF4RXJyb3InLCBTeW50YXhFcnJvcl0sXG4gICAgICBbJ1R5cGVFcnJvcicsIFR5cGVFcnJvcl0sXG4gICAgICBbJ1VSSUVycm9yJywgVVJJRXJyb3JdXG4gICAgXSk7XG5cbiAgICAvLyBMaWtlIFJlYWxtLmFwcGx5IGV4Y2VwdCB0aGF0IGl0IGNhdGNoZXMgYW55dGhpbmcgdGhyb3duIGFuZCByZXRocm93cyBpdFxuICAgIC8vIGFzIGFuIEVycm9yIGZyb20gdGhpcyByZWFsbVxuICAgIGZ1bmN0aW9uIGNhbGxBbmRXcmFwRXJyb3IodGFyZ2V0LCAuLi5hcmdzKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gdGFyZ2V0KC4uLmFyZ3MpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGlmIChPYmplY3QoZXJyKSAhPT0gZXJyKSB7XG4gICAgICAgICAgLy8gZXJyIGlzIGEgcHJpbWl0aXZlIHZhbHVlLCB3aGljaCBpcyBzYWZlIHRvIHJldGhyb3dcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGVOYW1lLCBlTWVzc2FnZSwgZVN0YWNrO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIFRoZSBjaGlsZCBlbnZpcm9ubWVudCBtaWdodCBzZWVrIHRvIHVzZSAnZXJyJyB0byByZWFjaCB0aGVcbiAgICAgICAgICAvLyBwYXJlbnQncyBpbnRyaW5zaWNzIGFuZCBjb3JydXB0IHRoZW0uIGAke2Vyci5uYW1lfWAgd2lsbCBjYXVzZVxuICAgICAgICAgIC8vIHN0cmluZyBjb2VyY2lvbiBvZiAnZXJyLm5hbWUnLiBJZiBlcnIubmFtZSBpcyBhbiBvYmplY3QgKHByb2JhYmx5XG4gICAgICAgICAgLy8gYSBTdHJpbmcgb2YgdGhlIHBhcmVudCBSZWFsbSksIHRoZSBjb2VyY2lvbiB1c2VzXG4gICAgICAgICAgLy8gZXJyLm5hbWUudG9TdHJpbmcoKSwgd2hpY2ggaXMgdW5kZXIgdGhlIGNvbnRyb2wgb2YgdGhlIHBhcmVudC4gSWZcbiAgICAgICAgICAvLyBlcnIubmFtZSB3ZXJlIGEgcHJpbWl0aXZlIChlLmcuIGEgbnVtYmVyKSwgaXQgd291bGQgdXNlXG4gICAgICAgICAgLy8gTnVtYmVyLnRvU3RyaW5nKGVyci5uYW1lKSwgdXNpbmcgdGhlIGNoaWxkJ3MgdmVyc2lvbiBvZiBOdW1iZXJcbiAgICAgICAgICAvLyAod2hpY2ggdGhlIGNoaWxkIGNvdWxkIG1vZGlmeSB0byBjYXB0dXJlIGl0cyBhcmd1bWVudCBmb3IgbGF0ZXJcbiAgICAgICAgICAvLyB1c2UpLCBob3dldmVyIHByaW1pdGl2ZXMgZG9uJ3QgaGF2ZSBwcm9wZXJ0aWVzIGxpa2UgLnByb3RvdHlwZSBzb1xuICAgICAgICAgIC8vIHRoZXkgYXJlbid0IHVzZWZ1bCBmb3IgYW4gYXR0YWNrLlxuICAgICAgICAgIGVOYW1lID0gYCR7ZXJyLm5hbWV9YDtcbiAgICAgICAgICBlTWVzc2FnZSA9IGAke2Vyci5tZXNzYWdlfWA7XG4gICAgICAgICAgZVN0YWNrID0gYCR7ZXJyLnN0YWNrIHx8IGVNZXNzYWdlfWA7XG4gICAgICAgICAgLy8gZU5hbWUvZU1lc3NhZ2UvZVN0YWNrIGFyZSBub3cgY2hpbGQtcmVhbG0gcHJpbWl0aXZlIHN0cmluZ3MsIGFuZFxuICAgICAgICAgIC8vIHNhZmUgdG8gZXhwb3NlXG4gICAgICAgIH0gY2F0Y2ggKGlnbm9yZWQpIHtcbiAgICAgICAgICAvLyBpZiBlcnIubmFtZS50b1N0cmluZygpIHRocm93cywga2VlcCB0aGUgKHBhcmVudCByZWFsbSkgRXJyb3IgYXdheVxuICAgICAgICAgIC8vIGZyb20gdGhlIGNoaWxkXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIGVycm9yJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgRXJyb3JDb25zdHJ1Y3RvciA9IGVycm9yQ29uc3RydWN0b3JzLmdldChlTmFtZSkgfHwgRXJyb3I7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yQ29uc3RydWN0b3IoZU1lc3NhZ2UpO1xuICAgICAgICB9IGNhdGNoIChlcnIyKSB7XG4gICAgICAgICAgZXJyMi5zdGFjayA9IGVTdGFjazsgLy8gcmVwbGFjZSB3aXRoIHRoZSBjYXB0dXJlZCBpbm5lciBzdGFja1xuICAgICAgICAgIHRocm93IGVycjI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjbGFzcyBSZWFsbSB7XG4gICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLy8gVGhlIFJlYWxtIGNvbnN0cnVjdG9yIGlzIG5vdCBpbnRlbmRlZCB0byBiZSB1c2VkIHdpdGggdGhlIG5ldyBvcGVyYXRvclxuICAgICAgICAvLyBvciB0byBiZSBzdWJjbGFzc2VkLiBJdCBtYXkgYmUgdXNlZCBhcyB0aGUgdmFsdWUgb2YgYW4gZXh0ZW5kcyBjbGF1c2VcbiAgICAgICAgLy8gb2YgYSBjbGFzcyBkZWZpbml0aW9uIGJ1dCBhIHN1cGVyIGNhbGwgdG8gdGhlIFJlYWxtIGNvbnN0cnVjdG9yIHdpbGxcbiAgICAgICAgLy8gY2F1c2UgYW4gZXhjZXB0aW9uLlxuXG4gICAgICAgIC8vIFdoZW4gUmVhbG0gaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGFuIGV4Y2VwdGlvbiBpcyBhbHNvIHJhaXNlZCBiZWNhdXNlXG4gICAgICAgIC8vIGEgY2xhc3MgY29uc3RydWN0b3IgY2Fubm90IGJlIGludm9rZWQgd2l0aG91dCAnbmV3Jy5cbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVhbG0gaXMgbm90IGEgY29uc3RydWN0b3InKTtcbiAgICAgIH1cblxuICAgICAgc3RhdGljIG1ha2VSb290UmVhbG0ob3B0aW9ucykge1xuICAgICAgICAvLyBUaGlzIGlzIHRoZSBleHBvc2VkIGludGVyZmFjZS5cbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdChvcHRpb25zKTsgLy8gdG9kbzogc2FuaXRpemVcblxuICAgICAgICAvLyBCeXBhc3MgdGhlIGNvbnN0cnVjdG9yLlxuICAgICAgICBjb25zdCByID0gY3JlYXRlKFJlYWxtLnByb3RvdHlwZSk7XG4gICAgICAgIGNhbGxBbmRXcmFwRXJyb3IoaW5pdFJvb3RSZWFsbSwgdW5zYWZlUmVjLCByLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHI7XG4gICAgICB9XG5cbiAgICAgIHN0YXRpYyBtYWtlQ29tcGFydG1lbnQoKSB7XG4gICAgICAgIC8vIEJ5cGFzcyB0aGUgY29uc3RydWN0b3IuXG4gICAgICAgIGNvbnN0IHIgPSBjcmVhdGUoUmVhbG0ucHJvdG90eXBlKTtcbiAgICAgICAgY2FsbEFuZFdyYXBFcnJvcihpbml0Q29tcGFydG1lbnQsIHVuc2FmZVJlYywgcik7XG4gICAgICAgIHJldHVybiByO1xuICAgICAgfVxuXG4gICAgICAvLyB3ZSBvbWl0IHRoZSBjb25zdHJ1Y3RvciBiZWNhdXNlIGl0IGlzIGVtcHR5LiBBbGwgdGhlIHBlcnNvbmFsaXphdGlvblxuICAgICAgLy8gdGFrZXMgcGxhY2UgaW4gb25lIG9mIHRoZSB0d28gc3RhdGljIG1ldGhvZHMsXG4gICAgICAvLyBtYWtlUm9vdFJlYWxtL21ha2VDb21wYXJ0bWVudFxuXG4gICAgICBnZXQgZ2xvYmFsKCkge1xuICAgICAgICAvLyB0aGlzIGlzIHNhZmUgYWdhaW5zdCBiZWluZyBjYWxsZWQgd2l0aCBzdHJhbmdlICd0aGlzJyBiZWNhdXNlXG4gICAgICAgIC8vIGJhc2VHZXRHbG9iYWwgaW1tZWRpYXRlbHkgZG9lcyBhIHRyYWRlbWFyayBjaGVjayAoaXQgZmFpbHMgdW5sZXNzXG4gICAgICAgIC8vIHRoaXMgJ3RoaXMnIGlzIHByZXNlbnQgaW4gYSB3ZWFrbWFwIHRoYXQgaXMgb25seSBwb3B1bGF0ZWQgd2l0aFxuICAgICAgICAvLyBsZWdpdGltYXRlIFJlYWxtIGluc3RhbmNlcylcbiAgICAgICAgcmV0dXJuIGNhbGxBbmRXcmFwRXJyb3IoZ2V0UmVhbG1HbG9iYWwsIHRoaXMpO1xuICAgICAgfVxuXG4gICAgICBldmFsdWF0ZSh4LCBlbmRvd21lbnRzKSB7XG4gICAgICAgIC8vIHNhZmUgYWdhaW5zdCBzdHJhbmdlICd0aGlzJywgYXMgYWJvdmVcbiAgICAgICAgcmV0dXJuIGNhbGxBbmRXcmFwRXJyb3IocmVhbG1FdmFsdWF0ZSwgdGhpcywgeCwgZW5kb3dtZW50cyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGVmaW5lUHJvcGVydGllcyhSZWFsbSwge1xuICAgICAgdG9TdHJpbmc6IHtcbiAgICAgICAgdmFsdWU6ICgpID0+ICdmdW5jdGlvbiBSZWFsbSgpIHsgW3NoaW0gY29kZV0gfScsXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZGVmaW5lUHJvcGVydGllcyhSZWFsbS5wcm90b3R5cGUsIHtcbiAgICAgIHRvU3RyaW5nOiB7XG4gICAgICAgIHZhbHVlOiAoKSA9PiAnW29iamVjdCBSZWFsbV0nLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBSZWFsbTtcbiAgfVxuXG4gIC8vIFRoZSBwYXJlbnRoZXNlcyBtZWFucyB3ZSBkb24ndCBiaW5kIHRoZSAnYnVpbGRDaGlsZFJlYWxtJyBuYW1lIGluc2lkZSB0aGVcbiAgLy8gY2hpbGQncyBuYW1lc3BhY2UuIHRoaXMgd291bGQgYWNjZXB0IGFuIGFub255bW91cyBmdW5jdGlvbiBkZWNsYXJhdGlvbi5cbiAgLy8gZnVuY3Rpb24gZXhwcmVzc2lvbiAobm90IGEgZGVjbGFyYXRpb24pIHNvIGl0IGhhcyBhIGNvbXBsZXRpb24gdmFsdWUuXG4gIGNvbnN0IGJ1aWxkQ2hpbGRSZWFsbVN0cmluZyA9IGNsZWFudXBTb3VyY2UoXG4gICAgYCd1c2Ugc3RyaWN0JzsgKCR7YnVpbGRDaGlsZFJlYWxtfSlgXG4gICk7XG5cbiAgZnVuY3Rpb24gY3JlYXRlUmVhbG1GYWNhZGUodW5zYWZlUmVjLCBCYXNlUmVhbG0pIHtcbiAgICBjb25zdCB7IHVuc2FmZUV2YWwgfSA9IHVuc2FmZVJlYztcblxuICAgIC8vIFRoZSBCYXNlUmVhbG0gaXMgdGhlIFJlYWxtIGNsYXNzIGNyZWF0ZWQgYnlcbiAgICAvLyB0aGUgc2hpbS4gSXQncyBvbmx5IHZhbGlkIGZvciB0aGUgY29udGV4dCB3aGVyZVxuICAgIC8vIGl0IHdhcyBwYXJzZWQuXG5cbiAgICAvLyBUaGUgUmVhbG0gZmFjYWRlIGlzIGEgbGlnaHR3ZWlnaHQgY2xhc3MgYnVpbHQgaW4gdGhlXG4gICAgLy8gY29udGV4dCBhIGRpZmZlcmVudCBjb250ZXh0LCB0aGF0IHByb3ZpZGUgYSBmdWxseVxuICAgIC8vIGZ1bmN0aW9uYWwgUmVhbG0gY2xhc3MgdXNpbmcgdGhlIGludHJpc2ljc1xuICAgIC8vIG9mIHRoYXQgY29udGV4dC5cblxuICAgIC8vIFRoaXMgcHJvY2VzcyBpcyBzaW1wbGlmaWVkIGJlY2F1c2UgYWxsIG1ldGhvZHNcbiAgICAvLyBhbmQgcHJvcGVydGllcyBvbiBhIHJlYWxtIGluc3RhbmNlIGFscmVhZHkgcmV0dXJuXG4gICAgLy8gdmFsdWVzIHVzaW5nIHRoZSBpbnRyaW5zaWNzIG9mIHRoZSByZWFsbSdzIGNvbnRleHQuXG5cbiAgICAvLyBJbnZva2UgdGhlIEJhc2VSZWFsbSBjb25zdHJ1Y3RvciB3aXRoIFJlYWxtIGFzIHRoZSBwcm90b3R5cGUuXG4gICAgcmV0dXJuIHVuc2FmZUV2YWwoYnVpbGRDaGlsZFJlYWxtU3RyaW5nKSh1bnNhZmVSZWMsIEJhc2VSZWFsbSk7XG4gIH1cblxuICAvLyBEZWNsYXJlIHNob3J0aGFuZCBmdW5jdGlvbnMuIFNoYXJpbmcgdGhlc2UgZGVjbGFyYXRpb25zIGFjcm9zcyBtb2R1bGVzXG4gIC8vIGltcHJvdmVzIGJvdGggY29uc2lzdGVuY3kgYW5kIG1pbmlmaWNhdGlvbi4gVW51c2VkIGRlY2xhcmF0aW9ucyBhcmVcbiAgLy8gZHJvcHBlZCBieSB0aGUgdHJlZSBzaGFraW5nIHByb2Nlc3MuXG5cbiAgLy8gd2UgY2FwdHVyZSB0aGVzZSwgbm90IGp1c3QgZm9yIGJyZXZpdHksIGJ1dCBmb3Igc2VjdXJpdHkuIElmIGFueSBjb2RlXG4gIC8vIG1vZGlmaWVzIE9iamVjdCB0byBjaGFuZ2Ugd2hhdCAnYXNzaWduJyBwb2ludHMgdG8sIHRoZSBSZWFsbSBzaGltIHdvdWxkIGJlXG4gIC8vIGNvcnJ1cHRlZC5cblxuICBjb25zdCB7XG4gICAgYXNzaWduLFxuICAgIGNyZWF0ZSxcbiAgICBmcmVlemUsXG4gICAgZGVmaW5lUHJvcGVydGllcywgLy8gT2JqZWN0LmRlZmluZVByb3BlcnR5IGlzIGFsbG93ZWQgdG8gZmFpbFxuICAgIC8vIHNpbGVudGx0eSwgdXNlIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzIGluc3RlYWQuXG4gICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcnMsXG4gICAgZ2V0T3duUHJvcGVydHlOYW1lcyxcbiAgICBnZXRQcm90b3R5cGVPZixcbiAgICBzZXRQcm90b3R5cGVPZlxuICB9ID0gT2JqZWN0O1xuXG4gIGNvbnN0IHtcbiAgICBhcHBseSxcbiAgICBvd25LZXlzIC8vIFJlZmxlY3Qub3duS2V5cyBpbmNsdWRlcyBTeW1ib2xzIGFuZCB1bmVudW1lcmFibGVzLFxuICAgIC8vIHVubGlrZSBPYmplY3Qua2V5cygpXG4gIH0gPSBSZWZsZWN0O1xuXG4gIC8qKlxuICAgKiB1bmN1cnJ5VGhpcygpIFNlZVxuICAgKiBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1jb252ZW50aW9uczpzYWZlX21ldGFfcHJvZ3JhbW1pbmdcbiAgICogd2hpY2ggb25seSBsaXZlcyBhdFxuICAgKiBodHRwOi8vd2ViLmFyY2hpdmUub3JnL3dlYi8yMDE2MDgwNTIyNTcxMC9odHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1jb252ZW50aW9uczpzYWZlX21ldGFfcHJvZ3JhbW1pbmdcbiAgICpcbiAgICogUGVyZm9ybWFuY2U6XG4gICAqIDEuIFRoZSBuYXRpdmUgY2FsbCBpcyBhYm91dCAxMHggZmFzdGVyIG9uIEZGIHRoYW4gY2hyb21lXG4gICAqIDIuIFRoZSB2ZXJzaW9uIHVzaW5nIEZ1bmN0aW9uLmJpbmQoKSBpcyBhYm91dCAxMDB4IHNsb3dlciBvbiBGRixcbiAgICogICAgZXF1YWwgb24gY2hyb21lLCAyeCBzbG93ZXIgb24gU2FmYXJpXG4gICAqIDMuIFRoZSB2ZXJzaW9uIHVzaW5nIGEgc3ByZWFkIGFuZCBSZWZsZWN0LmFwcGx5KCkgaXMgYWJvdXQgMTB4XG4gICAqICAgIHNsb3dlciBvbiBGRiwgZXF1YWwgb24gY2hyb21lLCAyeCBzbG93ZXIgb24gU2FmYXJpXG4gICAqXG4gICAqIGNvbnN0IGJpbmQgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZDtcbiAgICogY29uc3QgdW5jdXJyeVRoaXMgPSBiaW5kLmJpbmQoYmluZC5jYWxsKTtcbiAgICovXG4gIGNvbnN0IHVuY3VycnlUaGlzID0gZm4gPT4gKHRoaXNBcmcsIC4uLmFyZ3MpID0+IGFwcGx5KGZuLCB0aGlzQXJnLCBhcmdzKTtcblxuICAvLyBXZSBhbHNvIGNhcHR1cmUgdGhlc2UgZm9yIHNlY3VyaXR5OiBjaGFuZ2VzIHRvIEFycmF5LnByb3RvdHlwZSBhZnRlciB0aGVcbiAgLy8gUmVhbG0gc2hpbSBydW5zIHNob3VsZG4ndCBhZmZlY3Qgc3Vic2VxdWVudCBSZWFsbSBvcGVyYXRpb25zLlxuICBjb25zdCBvYmplY3RIYXNPd25Qcm9wZXJ0eSA9IHVuY3VycnlUaGlzKFxuICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAgICksXG4gICAgYXJyYXlGaWx0ZXIgPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUuZmlsdGVyKSxcbiAgICBhcnJheVBvcCA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5wb3ApLFxuICAgIGFycmF5Sm9pbiA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5qb2luKSxcbiAgICBhcnJheUNvbmNhdCA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5jb25jYXQpLFxuICAgIHJlZ2V4cFRlc3QgPSB1bmN1cnJ5VGhpcyhSZWdFeHAucHJvdG90eXBlLnRlc3QpLFxuICAgIHN0cmluZ0luY2x1ZGVzID0gdW5jdXJyeVRoaXMoU3RyaW5nLnByb3RvdHlwZS5pbmNsdWRlcyk7XG5cbiAgLy8gVGhlc2UgdmFsdWUgcHJvcGVydGllcyBvZiB0aGUgZ2xvYmFsIG9iamVjdCBhcmUgbm9uLXdyaXRhYmxlLFxuICAvLyBub24tY29uZmlndXJhYmxlIGRhdGEgcHJvcGVydGllcy5cbiAgY29uc3QgZnJvemVuR2xvYmFsUHJvcGVydHlOYW1lcyA9IFtcbiAgICAvLyAqKiogMTguMSBWYWx1ZSBQcm9wZXJ0aWVzIG9mIHRoZSBHbG9iYWwgT2JqZWN0XG5cbiAgICAnSW5maW5pdHknLFxuICAgICdOYU4nLFxuICAgICd1bmRlZmluZWQnXG4gIF07XG5cbiAgLy8gQWxsIHRoZSBmb2xsb3dpbmcgc3RkbGliIGl0ZW1zIGhhdmUgdGhlIHNhbWUgbmFtZSBvbiBib3RoIG91ciBpbnRyaW5zaWNzXG4gIC8vIG9iamVjdCBhbmQgb24gdGhlIGdsb2JhbCBvYmplY3QuIFVubGlrZSBJbmZpbml0eS9OYU4vdW5kZWZpbmVkLCB0aGVzZVxuICAvLyBzaG91bGQgYWxsIGJlIHdyaXRhYmxlIGFuZCBjb25maWd1cmFibGUuIFRoaXMgaXMgZGl2aWRlZCBpbnRvIHR3b1xuICAvLyBzZXRzLiBUaGUgc3RhYmxlIG9uZXMgYXJlIHRob3NlIHRoZSBzaGltIGNhbiBmcmVlemUgZWFybHkgYmVjYXVzZVxuICAvLyB3ZSBkb24ndCBleHBlY3QgYW55b25lIHdpbGwgd2FudCB0byBtdXRhdGUgdGhlbS4gVGhlIHVuc3RhYmxlIG9uZXNcbiAgLy8gYXJlIHRoZSBvbmVzIHRoYXQgd2UgY29ycmVjdGx5IGluaXRpYWxpemUgdG8gd3JpdGFibGUgYW5kXG4gIC8vIGNvbmZpZ3VyYWJsZSBzbyB0aGF0IHRoZXkgY2FuIHN0aWxsIGJlIHJlcGxhY2VkIG9yIHJlbW92ZWQuXG4gIGNvbnN0IHN0YWJsZUdsb2JhbFByb3BlcnR5TmFtZXMgPSBbXG4gICAgLy8gKioqIDE4LjIgRnVuY3Rpb24gUHJvcGVydGllcyBvZiB0aGUgR2xvYmFsIE9iamVjdFxuXG4gICAgLy8gJ2V2YWwnLCAvLyBjb21lcyBmcm9tIHNhZmVFdmFsIGluc3RlYWRcbiAgICAnaXNGaW5pdGUnLFxuICAgICdpc05hTicsXG4gICAgJ3BhcnNlRmxvYXQnLFxuICAgICdwYXJzZUludCcsXG5cbiAgICAnZGVjb2RlVVJJJyxcbiAgICAnZGVjb2RlVVJJQ29tcG9uZW50JyxcbiAgICAnZW5jb2RlVVJJJyxcbiAgICAnZW5jb2RlVVJJQ29tcG9uZW50JyxcblxuICAgIC8vICoqKiAxOC4zIENvbnN0cnVjdG9yIFByb3BlcnRpZXMgb2YgdGhlIEdsb2JhbCBPYmplY3RcblxuICAgICdBcnJheScsXG4gICAgJ0FycmF5QnVmZmVyJyxcbiAgICAnQm9vbGVhbicsXG4gICAgJ0RhdGFWaWV3JyxcbiAgICAvLyAnRGF0ZScsICAvLyBVbnN0YWJsZVxuICAgIC8vICdFcnJvcicsICAvLyBVbnN0YWJsZVxuICAgICdFdmFsRXJyb3InLFxuICAgICdGbG9hdDMyQXJyYXknLFxuICAgICdGbG9hdDY0QXJyYXknLFxuICAgIC8vICdGdW5jdGlvbicsICAvLyBjb21lcyBmcm9tIHNhZmVGdW5jdGlvbiBpbnN0ZWFkXG4gICAgJ0ludDhBcnJheScsXG4gICAgJ0ludDE2QXJyYXknLFxuICAgICdJbnQzMkFycmF5JyxcbiAgICAnTWFwJyxcbiAgICAnTnVtYmVyJyxcbiAgICAnT2JqZWN0JyxcbiAgICAvLyAnUHJvbWlzZScsICAvLyBVbnN0YWJsZVxuICAgIC8vICdQcm94eScsICAvLyBVbnN0YWJsZVxuICAgICdSYW5nZUVycm9yJyxcbiAgICAnUmVmZXJlbmNlRXJyb3InLFxuICAgIC8vICdSZWdFeHAnLCAgLy8gVW5zdGFibGVcbiAgICAnU2V0JyxcbiAgICAvLyAnU2hhcmVkQXJyYXlCdWZmZXInICAvLyByZW1vdmVkIG9uIEphbiA1LCAyMDE4XG4gICAgJ1N0cmluZycsXG4gICAgJ1N5bWJvbCcsXG4gICAgJ1N5bnRheEVycm9yJyxcbiAgICAnVHlwZUVycm9yJyxcbiAgICAnVWludDhBcnJheScsXG4gICAgJ1VpbnQ4Q2xhbXBlZEFycmF5JyxcbiAgICAnVWludDE2QXJyYXknLFxuICAgICdVaW50MzJBcnJheScsXG4gICAgJ1VSSUVycm9yJyxcbiAgICAnV2Vha01hcCcsXG4gICAgJ1dlYWtTZXQnLFxuXG4gICAgLy8gKioqIDE4LjQgT3RoZXIgUHJvcGVydGllcyBvZiB0aGUgR2xvYmFsIE9iamVjdFxuXG4gICAgLy8gJ0F0b21pY3MnLCAvLyByZW1vdmVkIG9uIEphbiA1LCAyMDE4XG4gICAgJ0pTT04nLFxuICAgICdNYXRoJyxcbiAgICAnUmVmbGVjdCcsXG5cbiAgICAvLyAqKiogQW5uZXggQlxuXG4gICAgJ2VzY2FwZScsXG4gICAgJ3VuZXNjYXBlJ1xuXG4gICAgLy8gKioqIEVDTUEtNDAyXG5cbiAgICAvLyAnSW50bCcgIC8vIFVuc3RhYmxlXG5cbiAgICAvLyAqKiogRVNOZXh0XG5cbiAgICAvLyAnUmVhbG0nIC8vIENvbWVzIGZyb20gY3JlYXRlUmVhbG1HbG9iYWxPYmplY3QoKVxuICBdO1xuXG4gIGNvbnN0IHVuc3RhYmxlR2xvYmFsUHJvcGVydHlOYW1lcyA9IFtcbiAgICAnRGF0ZScsXG4gICAgJ0Vycm9yJyxcbiAgICAnUHJvbWlzZScsXG4gICAgJ1Byb3h5JyxcbiAgICAnUmVnRXhwJyxcbiAgICAnSW50bCdcbiAgXTtcblxuICBmdW5jdGlvbiBnZXRTaGFyZWRHbG9iYWxEZXNjcyh1bnNhZmVHbG9iYWwpIHtcbiAgICBjb25zdCBkZXNjcmlwdG9ycyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gZGVzY3JpYmUobmFtZXMsIHdyaXRhYmxlLCBlbnVtZXJhYmxlLCBjb25maWd1cmFibGUpIHtcbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBuYW1lcykge1xuICAgICAgICBjb25zdCBkZXNjID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHVuc2FmZUdsb2JhbCwgbmFtZSk7XG4gICAgICAgIGlmIChkZXNjKSB7XG4gICAgICAgICAgLy8gQWJvcnQgaWYgYW4gYWNjZXNzb3IgaXMgZm91bmQgb24gdGhlIHVuc2FmZSBnbG9iYWwgb2JqZWN0XG4gICAgICAgICAgLy8gaW5zdGVhZCBvZiBhIGRhdGEgcHJvcGVydHkuIFdlIHNob3VsZCBuZXZlciBnZXQgaW50byB0aGlzXG4gICAgICAgICAgLy8gbm9uIHN0YW5kYXJkIHNpdHVhdGlvbi5cbiAgICAgICAgICBhc3NlcnQoXG4gICAgICAgICAgICAndmFsdWUnIGluIGRlc2MsXG4gICAgICAgICAgICBgdW5leHBlY3RlZCBhY2Nlc3NvciBvbiBnbG9iYWwgcHJvcGVydHk6ICR7bmFtZX1gXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGRlc2NyaXB0b3JzW25hbWVdID0ge1xuICAgICAgICAgICAgdmFsdWU6IGRlc2MudmFsdWUsXG4gICAgICAgICAgICB3cml0YWJsZSxcbiAgICAgICAgICAgIGVudW1lcmFibGUsXG4gICAgICAgICAgICBjb25maWd1cmFibGVcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGVzY3JpYmUoZnJvemVuR2xvYmFsUHJvcGVydHlOYW1lcywgZmFsc2UsIGZhbHNlLCBmYWxzZSk7XG4gICAgLy8gVGhlIGZvbGxvd2luZyBpcyBjb3JyZWN0IGJ1dCBleHBlbnNpdmUuXG4gICAgLy8gZGVzY3JpYmUoc3RhYmxlR2xvYmFsUHJvcGVydHlOYW1lcywgdHJ1ZSwgZmFsc2UsIHRydWUpO1xuICAgIC8vIEluc3RlYWQsIGZvciBub3csIHdlIGxldCB0aGVzZSBnZXQgb3B0aW1pemVkLlxuICAgIC8vXG4gICAgLy8gVE9ETzogV2Ugc2hvdWxkIHByb3ZpZGUgYW4gb3B0aW9uIHRvIHR1cm4gdGhpcyBvcHRpbWl6YXRpb24gb2ZmLFxuICAgIC8vIGJ5IGZlZWRpbmcgXCJ0cnVlLCBmYWxzZSwgdHJ1ZVwiIGhlcmUgaW5zdGVhZC5cbiAgICBkZXNjcmliZShzdGFibGVHbG9iYWxQcm9wZXJ0eU5hbWVzLCBmYWxzZSwgZmFsc2UsIGZhbHNlKTtcbiAgICAvLyBUaGVzZSB3ZSBrZWVwIHJlcGxhY2VhYmxlIGFuZCByZW1vdmFibGUsIGJlY2F1c2Ugd2UgZXhwZWN0XG4gICAgLy8gb3RoZXJzLCBlLmcuLCBTRVMsIG1heSB3YW50IHRvIGRvIHNvLlxuICAgIGRlc2NyaWJlKHVuc3RhYmxlR2xvYmFsUHJvcGVydHlOYW1lcywgdHJ1ZSwgZmFsc2UsIHRydWUpO1xuXG4gICAgcmV0dXJuIGRlc2NyaXB0b3JzO1xuICB9XG5cbiAgLy8gQWRhcHRlZCBmcm9tIFNFUy9DYWphIC0gQ29weXJpZ2h0IChDKSAyMDExIEdvb2dsZSBJbmMuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvY2FqYS9ibG9iL21hc3Rlci9zcmMvY29tL2dvb2dsZS9jYWphL3Nlcy9zdGFydFNFUy5qc1xuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2NhamEvYmxvYi9tYXN0ZXIvc3JjL2NvbS9nb29nbGUvY2FqYS9zZXMvcmVwYWlyRVM1LmpzXG5cbiAgLyoqXG4gICAqIFJlcGxhY2UgdGhlIGxlZ2FjeSBhY2Nlc3NvcnMgb2YgT2JqZWN0IHRvIGNvbXBseSB3aXRoIHN0cmljdCBtb2RlXG4gICAqIGFuZCBFUzIwMTYgc2VtYW50aWNzLCB3ZSBkbyB0aGlzIGJ5IHJlZGVmaW5pbmcgdGhlbSB3aGlsZSBpbiAndXNlIHN0cmljdCcuXG4gICAqXG4gICAqIHRvZG86IGxpc3QgdGhlIGlzc3VlcyByZXNvbHZlZFxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGluIHR3byB3YXlzOiAoMSkgaW52b2tlZCBkaXJlY3RseSB0byBmaXggdGhlIHByaW1hbFxuICAgKiByZWFsbSdzIE9iamVjdC5wcm90b3R5cGUsIGFuZCAoMikgY29udmVydGVkIHRvIGEgc3RyaW5nIHRvIGJlIGV4ZWN1dGVkXG4gICAqIGluc2lkZSBlYWNoIG5ldyBSb290UmVhbG0gdG8gZml4IHRoZWlyIE9iamVjdC5wcm90b3R5cGVzLiBFdmFsdWF0aW9uIHJlcXVpcmVzXG4gICAqIHRoZSBmdW5jdGlvbiB0byBoYXZlIG5vIGRlcGVuZGVuY2llcywgc28gZG9uJ3QgaW1wb3J0IGFueXRoaW5nIGZyb21cbiAgICogdGhlIG91dHNpZGUuXG4gICAqL1xuXG4gIC8vIHRvZG86IHRoaXMgZmlsZSBzaG91bGQgYmUgbW92ZWQgb3V0IHRvIGEgc2VwYXJhdGUgcmVwbyBhbmQgbnBtIG1vZHVsZS5cbiAgZnVuY3Rpb24gcmVwYWlyQWNjZXNzb3JzKCkge1xuICAgIGNvbnN0IHtcbiAgICAgIGRlZmluZVByb3BlcnR5LFxuICAgICAgZGVmaW5lUHJvcGVydGllcyxcbiAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICAgIGdldFByb3RvdHlwZU9mLFxuICAgICAgcHJvdG90eXBlOiBvYmplY3RQcm90b3R5cGVcbiAgICB9ID0gT2JqZWN0O1xuXG4gICAgLy8gT24gc29tZSBwbGF0Zm9ybXMsIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGVzZSBmdW5jdGlvbnMgYWN0IGFzXG4gICAgLy8gaWYgdGhleSBhcmUgaW4gc2xvcHB5IG1vZGU6IGlmIHRoZXkncmUgaW52b2tlZCBiYWRseSwgdGhleSB3aWxsXG4gICAgLy8gZXhwb3NlIHRoZSBnbG9iYWwgb2JqZWN0LCBzbyB3ZSBuZWVkIHRvIHJlcGFpciB0aGVzZSBmb3JcbiAgICAvLyBzZWN1cml0eS4gVGh1cyBpdCBpcyBvdXIgcmVzcG9uc2liaWxpdHkgdG8gZml4IHRoaXMsIGFuZCB3ZSBuZWVkXG4gICAgLy8gdG8gaW5jbHVkZSByZXBhaXJBY2Nlc3NvcnMuIEUuZy4gQ2hyb21lIGluIDIwMTYuXG5cbiAgICB0cnkge1xuICAgICAgLy8gVmVyaWZ5IHRoYXQgdGhlIG1ldGhvZCBpcyBub3QgY2FsbGFibGUuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1wcm9wZXJ0aWVzLCBuby11bmRlcnNjb3JlLWRhbmdsZVxuICAgICAgKDAsIG9iamVjdFByb3RvdHlwZS5fX2xvb2t1cEdldHRlcl9fKSgneCcpO1xuICAgIH0gY2F0Y2ggKGlnbm9yZSkge1xuICAgICAgLy8gVGhyb3dzLCBubyBuZWVkIHRvIHBhdGNoLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvT2JqZWN0KG9iaikge1xuICAgICAgaWYgKG9iaiA9PT0gdW5kZWZpbmVkIHx8IG9iaiA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBjYW4ndCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdGApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIE9iamVjdChvYmopO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzUHJvcGVydHlOYW1lKG9iaikge1xuICAgICAgaWYgKHR5cGVvZiBvYmogPT09ICdzeW1ib2wnKSB7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgICB9XG4gICAgICByZXR1cm4gYCR7b2JqfWA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYUZ1bmN0aW9uKG9iaiwgYWNjZXNzb3IpIHtcbiAgICAgIGlmICh0eXBlb2Ygb2JqICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcihgaW52YWxpZCAke2FjY2Vzc29yfSB1c2FnZWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG5cbiAgICBkZWZpbmVQcm9wZXJ0aWVzKG9iamVjdFByb3RvdHlwZSwge1xuICAgICAgX19kZWZpbmVHZXR0ZXJfXzoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX19kZWZpbmVHZXR0ZXJfXyhwcm9wLCBmdW5jKSB7XG4gICAgICAgICAgY29uc3QgTyA9IHRvT2JqZWN0KHRoaXMpO1xuICAgICAgICAgIGRlZmluZVByb3BlcnR5KE8sIHByb3AsIHtcbiAgICAgICAgICAgIGdldDogYUZ1bmN0aW9uKGZ1bmMsICdnZXR0ZXInKSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIF9fZGVmaW5lU2V0dGVyX186IHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9fZGVmaW5lU2V0dGVyX18ocHJvcCwgZnVuYykge1xuICAgICAgICAgIGNvbnN0IE8gPSB0b09iamVjdCh0aGlzKTtcbiAgICAgICAgICBkZWZpbmVQcm9wZXJ0eShPLCBwcm9wLCB7XG4gICAgICAgICAgICBzZXQ6IGFGdW5jdGlvbihmdW5jLCAnc2V0dGVyJyksXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBfX2xvb2t1cEdldHRlcl9fOiB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfX2xvb2t1cEdldHRlcl9fKHByb3ApIHtcbiAgICAgICAgICBsZXQgTyA9IHRvT2JqZWN0KHRoaXMpO1xuICAgICAgICAgIHByb3AgPSBhc1Byb3BlcnR5TmFtZShwcm9wKTtcbiAgICAgICAgICBsZXQgZGVzYztcbiAgICAgICAgICB3aGlsZSAoTyAmJiAhKGRlc2MgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoTywgcHJvcCkpKSB7XG4gICAgICAgICAgICBPID0gZ2V0UHJvdG90eXBlT2YoTyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkZXNjICYmIGRlc2MuZ2V0O1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgX19sb29rdXBTZXR0ZXJfXzoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX19sb29rdXBTZXR0ZXJfXyhwcm9wKSB7XG4gICAgICAgICAgbGV0IE8gPSB0b09iamVjdCh0aGlzKTtcbiAgICAgICAgICBwcm9wID0gYXNQcm9wZXJ0eU5hbWUocHJvcCk7XG4gICAgICAgICAgbGV0IGRlc2M7XG4gICAgICAgICAgd2hpbGUgKE8gJiYgIShkZXNjID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE8sIHByb3ApKSkge1xuICAgICAgICAgICAgTyA9IGdldFByb3RvdHlwZU9mKE8pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZGVzYyAmJiBkZXNjLnNldDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gQWRhcHRlZCBmcm9tIFNFUy9DYWphXG4gIC8vIENvcHlyaWdodCAoQykgMjAxMSBHb29nbGUgSW5jLlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2NhamEvYmxvYi9tYXN0ZXIvc3JjL2NvbS9nb29nbGUvY2FqYS9zZXMvc3RhcnRTRVMuanNcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9jYWphL2Jsb2IvbWFzdGVyL3NyYy9jb20vZ29vZ2xlL2NhamEvc2VzL3JlcGFpckVTNS5qc1xuXG4gIC8qKlxuICAgKiBUaGlzIGJsb2NrIHJlcGxhY2VzIHRoZSBvcmlnaW5hbCBGdW5jdGlvbiBjb25zdHJ1Y3RvciwgYW5kIHRoZSBvcmlnaW5hbFxuICAgKiAlR2VuZXJhdG9yRnVuY3Rpb24lICVBc3luY0Z1bmN0aW9uJSBhbmQgJUFzeW5jR2VuZXJhdG9yRnVuY3Rpb24lLCB3aXRoXG4gICAqIHNhZmUgcmVwbGFjZW1lbnRzIHRoYXQgdGhyb3cgaWYgaW52b2tlZC5cbiAgICpcbiAgICogVGhlc2UgYXJlIGFsbCByZWFjaGFibGUgdmlhIHN5bnRheCwgc28gaXQgaXNuJ3Qgc3VmZmljaWVudCB0byBqdXN0XG4gICAqIHJlcGxhY2UgZ2xvYmFsIHByb3BlcnRpZXMgd2l0aCBzYWZlIHZlcnNpb25zLiBPdXIgbWFpbiBnb2FsIGlzIHRvIHByZXZlbnRcbiAgICogYWNjZXNzIHRvIHRoZSBGdW5jdGlvbiBjb25zdHJ1Y3RvciB0aHJvdWdoIHRoZXNlIHN0YXJ0aW5nIHBvaW50cy5cblxuICAgKiBBZnRlciB0aGlzIGJsb2NrIGlzIGRvbmUsIHRoZSBvcmlnaW5hbHMgbXVzdCBubyBsb25nZXIgYmUgcmVhY2hhYmxlLCB1bmxlc3NcbiAgICogYSBjb3B5IGhhcyBiZWVuIG1hZGUsIGFuZCBmdW50aW9ucyBjYW4gb25seSBiZSBjcmVhdGVkIGJ5IHN5bnRheCAodXNpbmcgZXZhbClcbiAgICogb3IgYnkgaW52b2tpbmcgYSBwcmV2aW91c2x5IHNhdmVkIHJlZmVyZW5jZSB0byB0aGUgb3JpZ2luYWxzLlxuICAgKi9cbiAgLy8gdG9kbzogdGhpcyBmaWxlIHNob3VsZCBiZSBtb3ZlZCBvdXQgdG8gYSBzZXBhcmF0ZSByZXBvIGFuZCBucG0gbW9kdWxlLlxuICBmdW5jdGlvbiByZXBhaXJGdW5jdGlvbnMoKSB7XG4gICAgY29uc3QgeyBkZWZpbmVQcm9wZXJ0aWVzLCBnZXRQcm90b3R5cGVPZiwgc2V0UHJvdG90eXBlT2YgfSA9IE9iamVjdDtcblxuICAgIC8qKlxuICAgICAqIFRoZSBwcm9jZXNzIHRvIHJlcGFpciBjb25zdHJ1Y3RvcnM6XG4gICAgICogMS4gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBmdW5jdGlvbiBieSBldmFsdWF0aW5nIHN5bnRheFxuICAgICAqIDIuIE9idGFpbiB0aGUgcHJvdG90eXBlIGZyb20gdGhlIGluc3RhbmNlXG4gICAgICogMy4gQ3JlYXRlIGEgc3Vic3RpdHV0ZSB0YW1lZCBjb25zdHJ1Y3RvclxuICAgICAqIDQuIFJlcGxhY2UgdGhlIG9yaWdpbmFsIGNvbnN0cnVjdG9yIHdpdGggdGhlIHRhbWVkIGNvbnN0cnVjdG9yXG4gICAgICogNS4gUmVwbGFjZSB0YW1lZCBjb25zdHJ1Y3RvciBwcm90b3R5cGUgcHJvcGVydHkgd2l0aCB0aGUgb3JpZ2luYWwgb25lXG4gICAgICogNi4gUmVwbGFjZSBpdHMgW1tQcm90b3R5cGVdXSBzbG90IHdpdGggdGhlIHRhbWVkIGNvbnN0cnVjdG9yIG9mIEZ1bmN0aW9uXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVwYWlyRnVuY3Rpb24obmFtZSwgZGVjbGFyYXRpb24pIHtcbiAgICAgIGxldCBGdW5jdGlvbkluc3RhbmNlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5ldy1mdW5jXG4gICAgICAgIEZ1bmN0aW9uSW5zdGFuY2UgPSAoMCwgZXZhbCkoZGVjbGFyYXRpb24pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIFN5bnRheEVycm9yKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBmYWlsdXJlIG9uIHBsYXRmb3JtcyB3aGVyZSBhc3luYyBhbmQvb3IgZ2VuZXJhdG9yc1xuICAgICAgICAgIC8vIGFyZSBub3Qgc3VwcG9ydGVkLlxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZS10aHJvd1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgICAgY29uc3QgRnVuY3Rpb25Qcm90b3R5cGUgPSBnZXRQcm90b3R5cGVPZihGdW5jdGlvbkluc3RhbmNlKTtcbiAgICAgIGNvbnN0IG9sZEZ1bmN0aW9uQ29uc3RydWN0b3IgPSBGdW5jdGlvblByb3RvdHlwZS5jb25zdHJ1Y3RvcjtcblxuICAgICAgZnVuY3Rpb24gaXNSdW5uaW5nSW5SZWFsbXMoKSB7XG4gICAgICAgIGNvbnN0IGUgPSBuZXcgRXJyb3IoKS5zdGFjaztcbiAgICAgICAgaWYgKCFlKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGUuaW5kZXhPZignZXZhbCcpICE9PSAtMTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZlbnRzIHRoZSBldmFsdWF0aW9uIG9mIHNvdXJjZSB3aGVuIGNhbGxpbmcgY29uc3RydWN0b3Igb24gdGhlXG4gICAgICAvLyBwcm90b3R5cGUgb2YgZnVuY3Rpb25zLlxuICAgICAgY29uc3QgVGFtZWRGdW5jdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoaXNSdW5uaW5nSW5SZWFsbXMoKSkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ05vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gb2xkRnVuY3Rpb25Db25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgZGVmaW5lUHJvcGVydGllcyhUYW1lZEZ1bmN0aW9uLCB7IG5hbWU6IHsgdmFsdWU6IG5hbWUgfSB9KTtcblxuICAgICAgLy8gKG5ldyBFcnJvcigpKS5jb25zdHJ1Y3RvcnMgZG9lcyBub3QgaW5oZXJpdCBmcm9tIEZ1bmN0aW9uLCBiZWNhdXNlIEVycm9yXG4gICAgICAvLyB3YXMgZGVmaW5lZCBiZWZvcmUgRVM2IGNsYXNzZXMuIFNvIHdlIGRvbid0IG5lZWQgdG8gcmVwYWlyIGl0IHRvby5cblxuICAgICAgLy8gKEVycm9yKCkpLmNvbnN0cnVjdG9yIGluaGVyaXQgZnJvbSBGdW5jdGlvbiwgd2hpY2ggZ2V0cyBhIHRhbWVkXG4gICAgICAvLyBjb25zdHJ1Y3RvciBoZXJlLlxuXG4gICAgICAvLyB0b2RvOiBpbiBhbiBFUzYgY2xhc3MgdGhhdCBkb2VzIG5vdCBpbmhlcml0IGZyb20gYW55dGhpbmcsIHdoYXQgZG9lcyBpdHNcbiAgICAgIC8vIGNvbnN0cnVjdG9yIGluaGVyaXQgZnJvbT8gV2Ugd29ycnkgdGhhdCBpdCBpbmhlcml0cyBmcm9tIEZ1bmN0aW9uLCBpblxuICAgICAgLy8gd2hpY2ggY2FzZSBpbnN0YW5jZXMgY291bGQgZ2l2ZSBhY2Nlc3MgdG8gdW5zYWZlRnVuY3Rpb24uIG1hcmttIHNheXNcbiAgICAgIC8vIHdlJ3JlIGZpbmU6IHRoZSBjb25zdHJ1Y3RvciBpbmhlcml0cyBmcm9tIE9iamVjdC5wcm90b3R5cGVcblxuICAgICAgLy8gVGhpcyBsaW5lIHJlcGxhY2VzIHRoZSBvcmlnaW5hbCBjb25zdHJ1Y3RvciBpbiB0aGUgcHJvdG90eXBlIGNoYWluXG4gICAgICAvLyB3aXRoIHRoZSB0YW1lZCBvbmUuIE5vIGNvcHkgb2YgdGhlIG9yaWdpbmFsIGlzIHBlc2VydmVkLlxuICAgICAgZGVmaW5lUHJvcGVydGllcyhGdW5jdGlvblByb3RvdHlwZSwge1xuICAgICAgICBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogVGFtZWRGdW5jdGlvbiB9XG4gICAgICB9KTtcblxuICAgICAgLy8gVGhpcyBsaW5lIHNldHMgdGhlIHRhbWVkIGNvbnN0cnVjdG9yJ3MgcHJvdG90eXBlIGRhdGEgcHJvcGVydHkgdG9cbiAgICAgIC8vIHRoZSBvcmlnaW5hbCBvbmUuXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKFRhbWVkRnVuY3Rpb24sIHtcbiAgICAgICAgcHJvdG90eXBlOiB7IHZhbHVlOiBGdW5jdGlvblByb3RvdHlwZSB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKFRhbWVkRnVuY3Rpb24gIT09IEZ1bmN0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAvLyBFbnN1cmVzIHRoYXQgYWxsIGZ1bmN0aW9ucyBtZWV0IFwiaW5zdGFuY2VvZiBGdW5jdGlvblwiIGluIGEgcmVhbG0uXG4gICAgICAgIHNldFByb3RvdHlwZU9mKFRhbWVkRnVuY3Rpb24sIEZ1bmN0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3Rvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSGVyZSwgdGhlIG9yZGVyIG9mIG9wZXJhdGlvbiBpcyBpbXBvcnRhbnQ6IEZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJlcGFpcmVkXG4gICAgLy8gZmlyc3Qgc2luY2UgdGhlIG90aGVyIHJlcGFpcmVkIGNvbnN0cnVjdG9ycyBuZWVkIHRvIGluaGVyaXQgZnJvbSB0aGUgdGFtZWRcbiAgICAvLyBGdW5jdGlvbiBmdW5jdGlvbiBjb25zdHJ1Y3Rvci5cblxuICAgIC8vIG5vdGU6IHRoaXMgcmVhbGx5IHdhbnRzIHRvIGJlIHBhcnQgb2YgdGhlIHN0YW5kYXJkLCBiZWNhdXNlIG5ld1xuICAgIC8vIGNvbnN0cnVjdG9ycyBtYXkgYmUgYWRkZWQgaW4gdGhlIGZ1dHVyZSwgcmVhY2hhYmxlIGZyb20gc3ludGF4LCBhbmQgdGhpc1xuICAgIC8vIGxpc3QgbXVzdCBiZSB1cGRhdGVkIHRvIG1hdGNoLlxuXG4gICAgLy8gXCJwbGFpbiBhcnJvdyBmdW5jdGlvbnNcIiBpbmhlcml0IGZyb20gRnVuY3Rpb24ucHJvdG90eXBlXG5cbiAgICByZXBhaXJGdW5jdGlvbignRnVuY3Rpb24nLCAnKGZ1bmN0aW9uKCl7fSknKTtcbiAgICByZXBhaXJGdW5jdGlvbignR2VuZXJhdG9yRnVuY3Rpb24nLCAnKGZ1bmN0aW9uKigpe30pJyk7XG4gICAgcmVwYWlyRnVuY3Rpb24oJ0FzeW5jRnVuY3Rpb24nLCAnKGFzeW5jIGZ1bmN0aW9uKCl7fSknKTtcbiAgICByZXBhaXJGdW5jdGlvbignQXN5bmNHZW5lcmF0b3JGdW5jdGlvbicsICcoYXN5bmMgZnVuY3Rpb24qKCl7fSknKTtcbiAgfVxuXG4gIC8vIHRoaXMgbW9kdWxlIG11c3QgbmV2ZXIgYmUgaW1wb3J0YWJsZSBvdXRzaWRlIHRoZSBSZWFsbSBzaGltIGl0c2VsZlxuXG4gIC8vIEEgXCJjb250ZXh0XCIgaXMgYSBmcmVzaCB1bnNhZmUgUmVhbG0gYXMgZ2l2ZW4gdG8gdXMgYnkgZXhpc3RpbmcgcGxhdGZvcm1zLlxuICAvLyBXZSBuZWVkIHRoaXMgdG8gaW1wbGVtZW50IHRoZSBzaGltLiBIb3dldmVyLCB3aGVuIFJlYWxtcyBsYW5kIGZvciByZWFsLFxuICAvLyB0aGlzIGZlYXR1cmUgd2lsbCBiZSBwcm92aWRlZCBieSB0aGUgdW5kZXJseWluZyBlbmdpbmUgaW5zdGVhZC5cblxuICAvLyBub3RlOiBpbiBhIG5vZGUgbW9kdWxlLCB0aGUgdG9wLWxldmVsICd0aGlzJyBpcyBub3QgdGhlIGdsb2JhbCBvYmplY3RcbiAgLy8gKGl0J3MgKnNvbWV0aGluZyogYnV0IHdlIGFyZW4ndCBzdXJlIHdoYXQpLCBob3dldmVyIGFuIGluZGlyZWN0IGV2YWwgb2ZcbiAgLy8gJ3RoaXMnIHdpbGwgYmUgdGhlIGNvcnJlY3QgZ2xvYmFsIG9iamVjdC5cblxuICBjb25zdCB1bnNhZmVHbG9iYWxTcmMgPSBcIid1c2Ugc3RyaWN0JzsgdGhpc1wiO1xuICBjb25zdCB1bnNhZmVHbG9iYWxFdmFsU3JjID0gYCgwLCBldmFsKShcIid1c2Ugc3RyaWN0JzsgdGhpc1wiKWA7XG5cbiAgLy8gVGhpcyBtZXRob2QgaXMgb25seSBleHBvcnRlZCBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAgZnVuY3Rpb24gY3JlYXRlTmV3VW5zYWZlR2xvYmFsRm9yTm9kZSgpIHtcbiAgICAvLyBOb3RlIHRoYXQgd2VicGFjayBhbmQgb3RoZXJzIHdpbGwgc2hpbSAndm0nIGluY2x1ZGluZyB0aGUgbWV0aG9kXG4gICAgLy8gJ3J1bkluTmV3Q29udGV4dCcsIHNvIHRoZSBwcmVzZW5jZSBvZiB2bSBpcyBub3QgYSB1c2VmdWwgY2hlY2tcblxuICAgIC8vIFRPRE86IEZpbmQgYSBiZXR0ZXIgdGVzdCB0aGF0IHdvcmtzIHdpdGggYnVuZGxlcnNcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LWZ1bmNcbiAgICBjb25zdCBpc05vZGUgPSBuZXcgRnVuY3Rpb24oXG4gICAgICAndHJ5IHtyZXR1cm4gdGhpcz09PWdsb2JhbH1jYXRjaChlKXtyZXR1cm4gZmFsc2V9J1xuICAgICkoKTtcblxuICAgIGlmICghaXNOb2RlKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBnbG9iYWwtcmVxdWlyZVxuICAgIGNvbnN0IHZtID0gcmVxdWlyZSgndm0nKTtcblxuICAgIC8vIFVzZSB1bnNhZmVHbG9iYWxFdmFsU3JjIHRvIGVuc3VyZSB3ZSBnZXQgdGhlIHJpZ2h0ICd0aGlzJy5cbiAgICBjb25zdCB1bnNhZmVHbG9iYWwgPSB2bS5ydW5Jbk5ld0NvbnRleHQodW5zYWZlR2xvYmFsRXZhbFNyYyk7XG5cbiAgICByZXR1cm4gdW5zYWZlR2xvYmFsO1xuICB9XG5cbiAgLy8gVGhpcyBtZXRob2QgaXMgb25seSBleHBvcnRlZCBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAgZnVuY3Rpb24gY3JlYXRlTmV3VW5zYWZlR2xvYmFsRm9yQnJvd3NlcigpIHtcbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgY29uc3QgdW5zYWZlR2xvYmFsID0gaWZyYW1lLmNvbnRlbnRXaW5kb3cuZXZhbCh1bnNhZmVHbG9iYWxTcmMpO1xuXG4gICAgLy8gV2Uga2VlcCB0aGUgaWZyYW1lIGF0dGFjaGVkIHRvIHRoZSBET00gYmVjYXVzZSByZW1vdmluZyBpdFxuICAgIC8vIGNhdXNlcyBpdHMgZ2xvYmFsIG9iamVjdCB0byBsb3NlIGludHJpbnNpY3MsIGl0cyBldmFsKClcbiAgICAvLyBmdW5jdGlvbiB0byBldmFsdWF0ZSBjb2RlLCBldGMuXG5cbiAgICAvLyBUT0RPOiBjYW4gd2UgcmVtb3ZlIGFuZCBnYXJiYWdlLWNvbGxlY3QgdGhlIGlmcmFtZXM/XG5cbiAgICByZXR1cm4gdW5zYWZlR2xvYmFsO1xuICB9XG5cbiAgY29uc3QgZ2V0TmV3VW5zYWZlR2xvYmFsID0gKCkgPT4ge1xuICAgIGNvbnN0IG5ld1Vuc2FmZUdsb2JhbEZvckJyb3dzZXIgPSBjcmVhdGVOZXdVbnNhZmVHbG9iYWxGb3JCcm93c2VyKCk7XG4gICAgY29uc3QgbmV3VW5zYWZlR2xvYmFsRm9yTm9kZSA9IGNyZWF0ZU5ld1Vuc2FmZUdsb2JhbEZvck5vZGUoKTtcbiAgICBpZiAoXG4gICAgICAoIW5ld1Vuc2FmZUdsb2JhbEZvckJyb3dzZXIgJiYgIW5ld1Vuc2FmZUdsb2JhbEZvck5vZGUpIHx8XG4gICAgICAobmV3VW5zYWZlR2xvYmFsRm9yQnJvd3NlciAmJiBuZXdVbnNhZmVHbG9iYWxGb3JOb2RlKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmV4cGVjdGVkIHBsYXRmb3JtLCB1bmFibGUgdG8gY3JlYXRlIFJlYWxtJyk7XG4gICAgfVxuICAgIHJldHVybiBuZXdVbnNhZmVHbG9iYWxGb3JCcm93c2VyIHx8IG5ld1Vuc2FmZUdsb2JhbEZvck5vZGU7XG4gIH07XG5cbiAgLy8gVGhlIHVuc2FmZVJlYyBpcyBzaGltLXNwZWNpZmljLiBJdCBhY3RzIGFzIHRoZSBtZWNoYW5pc20gdG8gb2J0YWluIGEgZnJlc2hcbiAgLy8gc2V0IG9mIGludHJpbnNpY3MgdG9nZXRoZXIgd2l0aCB0aGVpciBhc3NvY2lhdGVkIGV2YWwgYW5kIEZ1bmN0aW9uXG4gIC8vIGV2YWx1YXRvcnMuIFRoZXNlIG11c3QgYmUgdXNlZCBhcyBhIG1hdGNoZWQgc2V0LCBzaW5jZSB0aGUgZXZhbHVhdG9ycyBhcmVcbiAgLy8gdGllZCB0byBhIHNldCBvZiBpbnRyaW5zaWNzLCBha2EgdGhlIFwidW5kZW5pYWJsZXNcIi4gSWYgaXQgd2VyZSBwb3NzaWJsZSB0b1xuICAvLyBtaXgtYW5kLW1hdGNoIHRoZW0gZnJvbSBkaWZmZXJlbnQgY29udGV4dHMsIHRoYXQgd291bGQgZW5hYmxlIHNvbWVcbiAgLy8gYXR0YWNrcy5cbiAgZnVuY3Rpb24gY3JlYXRlVW5zYWZlUmVjKHVuc2FmZUdsb2JhbCwgYWxsU2hpbXMgPSBbXSkge1xuICAgIGNvbnN0IHNoYXJlZEdsb2JhbERlc2NzID0gZ2V0U2hhcmVkR2xvYmFsRGVzY3ModW5zYWZlR2xvYmFsKTtcblxuICAgIHJldHVybiBmcmVlemUoe1xuICAgICAgdW5zYWZlR2xvYmFsLFxuICAgICAgc2hhcmVkR2xvYmFsRGVzY3MsXG4gICAgICB1bnNhZmVFdmFsOiB1bnNhZmVHbG9iYWwuZXZhbCxcbiAgICAgIHVuc2FmZUZ1bmN0aW9uOiB1bnNhZmVHbG9iYWwuRnVuY3Rpb24sXG4gICAgICBhbGxTaGltc1xuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgcmVwYWlyQWNjZXNzb3JzU2hpbSA9IGNsZWFudXBTb3VyY2UoXG4gICAgYFwidXNlIHN0cmljdFwiOyAoJHtyZXBhaXJBY2Nlc3NvcnN9KSgpO2BcbiAgKTtcbiAgY29uc3QgcmVwYWlyRnVuY3Rpb25zU2hpbSA9IGNsZWFudXBTb3VyY2UoXG4gICAgYFwidXNlIHN0cmljdFwiOyAoJHtyZXBhaXJGdW5jdGlvbnN9KSgpO2BcbiAgKTtcblxuICAvLyBDcmVhdGUgYSBuZXcgdW5zYWZlUmVjIGZyb20gYSBicmFuZCBuZXcgY29udGV4dCwgd2l0aCBuZXcgaW50cmluc2ljcyBhbmQgYVxuICAvLyBuZXcgZ2xvYmFsIG9iamVjdFxuICBmdW5jdGlvbiBjcmVhdGVOZXdVbnNhZmVSZWMoYWxsU2hpbXMpIHtcbiAgICBjb25zdCB1bnNhZmVHbG9iYWwgPSBnZXROZXdVbnNhZmVHbG9iYWwoKTtcbiAgICB1bnNhZmVHbG9iYWwuZXZhbChyZXBhaXJBY2Nlc3NvcnNTaGltKTtcbiAgICB1bnNhZmVHbG9iYWwuZXZhbChyZXBhaXJGdW5jdGlvbnNTaGltKTtcbiAgICByZXR1cm4gY3JlYXRlVW5zYWZlUmVjKHVuc2FmZUdsb2JhbCwgYWxsU2hpbXMpO1xuICB9XG5cbiAgLy8gQ3JlYXRlIGEgbmV3IHVuc2FmZVJlYyBmcm9tIHRoZSBjdXJyZW50IGNvbnRleHQsIHdoZXJlIHRoZSBSZWFsbSBzaGltIGlzXG4gIC8vIGJlaW5nIHBhcnNlZCBhbmQgZXhlY3V0ZWQsIGFrYSB0aGUgXCJQcmltYWwgUmVhbG1cIlxuICBmdW5jdGlvbiBjcmVhdGVDdXJyZW50VW5zYWZlUmVjKCkge1xuICAgIGNvbnN0IHVuc2FmZUdsb2JhbCA9ICgwLCBldmFsKSh1bnNhZmVHbG9iYWxTcmMpO1xuICAgIHJlcGFpckFjY2Vzc29ycygpO1xuICAgIHJlcGFpckZ1bmN0aW9ucygpO1xuICAgIHJldHVybiBjcmVhdGVVbnNhZmVSZWModW5zYWZlR2xvYmFsKTtcbiAgfVxuXG4gIC8vIHRvZG86IHRoaW5rIGFib3V0IGhvdyB0aGlzIGludGVyYWN0cyB3aXRoIGVuZG93bWVudHMsIGNoZWNrIGZvciBjb25mbGljdHNcbiAgLy8gYmV0d2VlbiB0aGUgbmFtZXMgYmVpbmcgb3B0aW1pemVkIGFuZCB0aGUgb25lcyBhZGRlZCBieSBlbmRvd21lbnRzXG5cbiAgLyoqXG4gICAqIFNpbXBsaWZpZWQgdmFsaWRhdGlvbiBvZiBpbmRlbnRpZmllciBuYW1lczogbWF5IG9ubHkgY29udGFpbiBhbHBoYW51bWVyaWNcbiAgICogY2hhcmFjdGVycyAob3IgXCIkXCIgb3IgXCJfXCIpLCBhbmQgbWF5IG5vdCBzdGFydCB3aXRoIGEgZGlnaXQuIFRoaXMgaXMgc2FmZVxuICAgKiBhbmQgZG9lcyBub3QgcmVkdWNlcyB0aGUgY29tcGF0aWJpbGl0eSBvZiB0aGUgc2hpbS4gVGhlIG1vdGl2YXRpb24gZm9yXG4gICAqIHRoaXMgbGltaXRhdGlvbiB3YXMgdG8gZGVjcmVhc2UgdGhlIGNvbXBsZXhpdHkgb2YgdGhlIGltcGxlbWVudGF0aW9uLFxuICAgKiBhbmQgdG8gbWFpbnRhaW4gYSByZXNvbmFibGUgbGV2ZWwgb2YgcGVyZm9ybWFuY2UuXG4gICAqIE5vdGU6IFxcdyBpcyBlcXVpdmFsZW50IFthLXpBLVpfMC05XVxuICAgKiBTZWUgMTEuNi4xIElkZW50aWZpZXIgTmFtZXNcbiAgICovXG4gIGNvbnN0IGlkZW50aWZpZXJQYXR0ZXJuID0gL15bYS16QS1aXyRdW1xcdyRdKiQvO1xuXG4gIC8qKlxuICAgKiBJbiBKYXZhU2NyaXB0IHlvdSBjYW5ub3QgdXNlIHRoZXNlIHJlc2VydmVkIHdvcmRzIGFzIHZhcmlhYmxlcy5cbiAgICogU2VlIDExLjYuMSBJZGVudGlmaWVyIE5hbWVzXG4gICAqL1xuICBjb25zdCBrZXl3b3JkcyA9IG5ldyBTZXQoW1xuICAgIC8vIDExLjYuMi4xIEtleXdvcmRzXG4gICAgJ2F3YWl0JyxcbiAgICAnYnJlYWsnLFxuICAgICdjYXNlJyxcbiAgICAnY2F0Y2gnLFxuICAgICdjbGFzcycsXG4gICAgJ2NvbnN0JyxcbiAgICAnY29udGludWUnLFxuICAgICdkZWJ1Z2dlcicsXG4gICAgJ2RlZmF1bHQnLFxuICAgICdkZWxldGUnLFxuICAgICdkbycsXG4gICAgJ2Vsc2UnLFxuICAgICdleHBvcnQnLFxuICAgICdleHRlbmRzJyxcbiAgICAnZmluYWxseScsXG4gICAgJ2ZvcicsXG4gICAgJ2Z1bmN0aW9uJyxcbiAgICAnaWYnLFxuICAgICdpbXBvcnQnLFxuICAgICdpbicsXG4gICAgJ2luc3RhbmNlb2YnLFxuICAgICduZXcnLFxuICAgICdyZXR1cm4nLFxuICAgICdzdXBlcicsXG4gICAgJ3N3aXRjaCcsXG4gICAgJ3RoaXMnLFxuICAgICd0aHJvdycsXG4gICAgJ3RyeScsXG4gICAgJ3R5cGVvZicsXG4gICAgJ3ZhcicsXG4gICAgJ3ZvaWQnLFxuICAgICd3aGlsZScsXG4gICAgJ3dpdGgnLFxuICAgICd5aWVsZCcsXG5cbiAgICAvLyBBbHNvIHJlc2VydmVkIHdoZW4gcGFyc2luZyBzdHJpY3QgbW9kZSBjb2RlXG4gICAgJ2xldCcsXG4gICAgJ3N0YXRpYycsXG5cbiAgICAvLyAxMS42LjIuMiBGdXR1cmUgUmVzZXJ2ZWQgV29yZHNcbiAgICAnZW51bScsXG5cbiAgICAvLyBBbHNvIHJlc2VydmVkIHdoZW4gcGFyc2luZyBzdHJpY3QgbW9kZSBjb2RlXG4gICAgJ2ltcGxlbWVudHMnLFxuICAgICdwYWNrYWdlJyxcbiAgICAncHJvdGVjdGVkJyxcbiAgICAnaW50ZXJmYWNlJyxcbiAgICAncHJpdmF0ZScsXG4gICAgJ3B1YmxpYycsXG5cbiAgICAvLyBSZXNlcnZlZCBidXQgbm90IG1lbnRpb25lZCBpbiBzcGVjc1xuICAgICdhd2FpdCcsXG5cbiAgICAnbnVsbCcsXG4gICAgJ3RydWUnLFxuICAgICdmYWxzZScsXG5cbiAgICAndGhpcycsXG4gICAgJ2FyZ3VtZW50cydcbiAgXSk7XG5cbiAgLyoqXG4gICAqIGdldE9wdGltaXphYmxlR2xvYmFscygpXG4gICAqIFdoYXQgdmFyaWFibGUgbmFtZXMgbWlnaHQgaXQgYnJpbmcgaW50byBzY29wZT8gVGhlc2UgaW5jbHVkZSBhbGxcbiAgICogcHJvcGVydHkgbmFtZXMgd2hpY2ggY2FuIGJlIHZhcmlhYmxlIG5hbWVzLCBpbmNsdWRpbmcgdGhlIG5hbWVzXG4gICAqIG9mIGluaGVyaXRlZCBwcm9wZXJ0aWVzLiBJdCBleGNsdWRlcyBzeW1ib2xzIGFuZCBuYW1lcyB3aGljaCBhcmVcbiAgICoga2V5d29yZHMuIFdlIGRyb3Agc3ltYm9scyBzYWZlbHkuIEN1cnJlbnRseSwgdGhpcyBzaGltIHJlZnVzZXNcbiAgICogc2VydmljZSBpZiBhbnkgb2YgdGhlIG5hbWVzIGFyZSBrZXl3b3JkcyBvciBrZXl3b3JkLWxpa2UuIFRoaXMgaXNcbiAgICogc2FmZSBhbmQgb25seSBwcmV2ZW50IHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIGdldE9wdGltaXphYmxlR2xvYmFscyhzYWZlR2xvYmFsKSB7XG4gICAgY29uc3QgZGVzY3MgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHNhZmVHbG9iYWwpO1xuXG4gICAgLy8gZ2V0T3duUHJvcGVydHlOYW1lcyBkb2VzIGlnbm9yZSBTeW1ib2xzIHNvIHdlIGRvbid0IG5lZWQgdGhpcyBleHRyYSBjaGVjazpcbiAgICAvLyB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgJiZcbiAgICBjb25zdCBjb25zdGFudHMgPSBhcnJheUZpbHRlcihnZXRPd25Qcm9wZXJ0eU5hbWVzKGRlc2NzKSwgbmFtZSA9PiB7XG4gICAgICAvLyBFbnN1cmUgd2UgaGF2ZSBhIHZhbGlkIGlkZW50aWZpZXIuIFdlIHVzZSByZWdleHBUZXN0IHJhdGhlciB0aGFuXG4gICAgICAvLyAvLi4vLnRlc3QoKSB0byBndWFyZCBhZ2FpbnN0IHRoZSBjYXNlIHdoZXJlIFJlZ0V4cCBoYXMgYmVlbiBwb2lzb25lZC5cbiAgICAgIGlmIChcbiAgICAgICAgbmFtZSA9PT0gJ2V2YWwnIHx8XG4gICAgICAgIGtleXdvcmRzLmhhcyhuYW1lKSB8fFxuICAgICAgICAhcmVnZXhwVGVzdChpZGVudGlmaWVyUGF0dGVybiwgbmFtZSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRlc2MgPSBkZXNjc1tuYW1lXTtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBnZXR0ZXJzIHdpbGwgbm90IGhhdmUgLndyaXRhYmxlLCBkb24ndCBsZXQgdGhlIGZhbHN5bmVzcyBvZlxuICAgICAgICAvLyAndW5kZWZpbmVkJyB0cmljayB1czogdGVzdCB3aXRoID09PSBmYWxzZSwgbm90ICEgLiBIb3dldmVyIGRlc2NyaXB0b3JzXG4gICAgICAgIC8vIGluaGVyaXQgZnJvbSB0aGUgKHBvdGVudGlhbGx5IHBvaXNvbmVkKSBnbG9iYWwgb2JqZWN0LCBzbyB3ZSBtaWdodCBzZWVcbiAgICAgICAgLy8gZXh0cmEgcHJvcGVydGllcyB3aGljaCB3ZXJlbid0IHJlYWxseSB0aGVyZS4gQWNjZXNzb3IgcHJvcGVydGllcyBoYXZlXG4gICAgICAgIC8vICdnZXQvc2V0L2VudW1lcmFibGUvY29uZmlndXJhYmxlJywgd2hpbGUgZGF0YSBwcm9wZXJ0aWVzIGhhdmVcbiAgICAgICAgLy8gJ3ZhbHVlL3dyaXRhYmxlL2VudW1lcmFibGUvY29uZmlndXJhYmxlJy5cbiAgICAgICAgZGVzYy5jb25maWd1cmFibGUgPT09IGZhbHNlICYmXG4gICAgICAgIGRlc2Mud3JpdGFibGUgPT09IGZhbHNlICYmXG4gICAgICAgIC8vXG4gICAgICAgIC8vIENoZWNrcyBmb3IgZGF0YSBwcm9wZXJ0aWVzIGJlY2F1c2UgdGhleSdyZSB0aGUgb25seSBvbmVzIHdlIGNhblxuICAgICAgICAvLyBvcHRpbWl6ZSAoYWNjZXNzb3JzIGFyZSBtb3N0IGxpa2VseSBub24tY29uc3RhbnQpLiBEZXNjcmlwdG9ycyBjYW4ndFxuICAgICAgICAvLyBjYW4ndCBoYXZlIGFjY2Vzc29ycyBhbmQgdmFsdWUgcHJvcGVydGllcyBhdCB0aGUgc2FtZSB0aW1lLCB0aGVyZWZvcmVcbiAgICAgICAgLy8gdGhpcyBjaGVjayBpcyBzdWZmaWNpZW50LiBVc2luZyBleHBsaWNpdCBvd24gcHJvcGVydHkgZGVhbCB3aXRoIHRoZVxuICAgICAgICAvLyBjYXNlIHdoZXJlIE9iamVjdC5wcm90b3R5cGUgaGFzIGJlZW4gcG9pc29uZWQuXG4gICAgICAgIG9iamVjdEhhc093blByb3BlcnR5KGRlc2MsICd2YWx1ZScpXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNvbnN0YW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBhbHdheXNUaHJvd0hhbmRsZXIgaXMgYSBwcm94eSBoYW5kbGVyIHdoaWNoIHRocm93cyBvbiBhbnkgdHJhcCBjYWxsZWQuXG4gICAqIEl0J3MgbWFkZSBmcm9tIGEgcHJveHkgd2l0aCBhIGdldCB0cmFwIHRoYXQgdGhyb3dzLiBJdHMgdGFyZ2V0IGlzXG4gICAqIGFuIGltbXV0YWJsZSAoZnJvemVuKSBvYmplY3QgYW5kIGlzIHNhZmUgdG8gc2hhcmUuXG4gICAqL1xuICBjb25zdCBhbHdheXNUaHJvd0hhbmRsZXIgPSBuZXcgUHJveHkoZnJlZXplKHt9KSwge1xuICAgIGdldCh0YXJnZXQsIHByb3ApIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYHVuZXhwZWN0ZWQgc2NvcGUgaGFuZGxlciB0cmFwIGNhbGxlZDogJHtwcm9wfWAsXG4gICAgICAgIG5ldyBFcnJvcigpLnN0YWNrXG4gICAgICApO1xuICAgICAgLy8gdGhyb3dUYW50cnVtKGB1bmV4cGVjdGVkIHNjb3BlIGhhbmRsZXIgdHJhcCBjYWxsZWQ6ICR7cHJvcH1gKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBTY29wZUhhbmRsZXIgbWFuYWdlcyBhIFByb3h5IHdoaWNoIHNlcnZlcyBhcyB0aGUgZ2xvYmFsIHNjb3BlIGZvciB0aGVcbiAgICogc2FmZUV2YWx1YXRvciBvcGVyYXRpb24gKHRoZSBQcm94eSBpcyB0aGUgYXJndW1lbnQgb2YgYSAnd2l0aCcgYmluZGluZykuXG4gICAqIEFzIGRlc2NyaWJlZCBpbiBjcmVhdGVTYWZlRXZhbHVhdG9yKCksIGl0IGhhcyBzZXZlcmFsIGZ1bmN0aW9uczpcbiAgICogLSBhbGxvdyB0aGUgdmVyeSBmaXJzdCAoYW5kIG9ubHkgdGhlIHZlcnkgZmlyc3QpIHVzZSBvZiAnZXZhbCcgdG8gbWFwIHRvXG4gICAqICAgdGhlIHJlYWwgKHVuc2FmZSkgZXZhbCBmdW5jdGlvbiwgc28gaXQgYWN0cyBhcyBhICdkaXJlY3QgZXZhbCcgYW5kIGNhblxuICAgKiAgICBhY2Nlc3MgaXRzIGxleGljYWwgc2NvcGUgKHdoaWNoIG1hcHMgdG8gdGhlICd3aXRoJyBiaW5kaW5nLCB3aGljaCB0aGVcbiAgICogICBTY29wZUhhbmRsZXIgYWxzbyBjb250cm9scykuXG4gICAqIC0gZW5zdXJlIHRoYXQgYWxsIHN1YnNlcXVlbnQgdXNlcyBvZiAnZXZhbCcgbWFwIHRvIHRoZSBzYWZlRXZhbHVhdG9yLFxuICAgKiAgIHdoaWNoIGxpdmVzIGFzIHRoZSAnZXZhbCcgcHJvcGVydHkgb2YgdGhlIHNhZmVHbG9iYWwuXG4gICAqIC0gcm91dGUgYWxsIG90aGVyIHByb3BlcnR5IGxvb2t1cHMgYXQgdGhlIHNhZmVHbG9iYWwuXG4gICAqIC0gaGlkZSB0aGUgdW5zYWZlR2xvYmFsIHdoaWNoIGxpdmVzIG9uIHRoZSBzY29wZSBjaGFpbiBhYm92ZSB0aGUgJ3dpdGgnLlxuICAgKiAtIGVuc3VyZSB0aGUgUHJveHkgaW52YXJpYW50cyBkZXNwaXRlIHNvbWUgZ2xvYmFsIHByb3BlcnRpZXMgYmVpbmcgZnJvemVuLlxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlU2NvcGVIYW5kbGVyKHVuc2FmZVJlYywgc2FmZUdsb2JhbCkge1xuICAgIGNvbnN0IHsgdW5zYWZlR2xvYmFsLCB1bnNhZmVFdmFsIH0gPSB1bnNhZmVSZWM7XG5cbiAgICAvLyBUaGlzIGZsYWcgYWxsb3cgdXMgdG8gZGV0ZXJtaW5lIGlmIHRoZSBldmFsKCkgY2FsbCBpcyBhbiBkb25lIGJ5IHRoZVxuICAgIC8vIHJlYWxtJ3MgY29kZSBvciBpZiBpdCBpcyB1c2VyLWxhbmQgaW52b2NhdGlvbiwgc28gd2UgY2FuIHJlYWN0IGRpZmZlcmVudGx5LlxuICAgIGxldCB1c2VVbnNhZmVFdmFsdWF0b3IgPSBmYWxzZTtcbiAgICAvLyBUaGlzIGZsYWcgYWxsb3cgdXMgdG8gYWxsb3cgdW5kZWZpbmVkIGFzc2lnbm1lbnRzIGluIG5vbi1zdHJpY3QgbW9kZS5cbiAgICAvLyBXaGVuIHRoZSBjb3VudGVyIGNvdW50IGRvd24gdG8gNCwgd2UgYWxsb3cgaXQgb25jZTtcbiAgICBsZXQgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzID0gMDtcblxuICAgIHJldHVybiB7XG4gICAgICAvLyBUaGUgc2NvcGUgaGFuZGxlciB0aHJvd3MgaWYgYW55IHRyYXAgb3RoZXIgdGhhbiBnZXQvc2V0L2hhcyBhcmUgcnVuXG4gICAgICAvLyAoZS5nLiBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzLCBhcHBseSwgZ2V0UHJvdG90eXBlT2YpLlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXByb3RvXG4gICAgICBfX3Byb3RvX186IGFsd2F5c1Rocm93SGFuZGxlcixcblxuICAgICAgYWxsb3dVbnNhZmVFdmFsdWF0b3JPbmNlKCkge1xuICAgICAgICB1c2VVbnNhZmVFdmFsdWF0b3IgPSB0cnVlO1xuICAgICAgfSxcblxuICAgICAgbm9uU3RyaWN0TW9kZUFzc2lnbm1lbnRBbGxvd2VkKCkge1xuICAgICAgICByZXR1cm4gYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzID09PSAzO1xuICAgICAgfSxcblxuICAgICAgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudCh0aW1lcyA9IDEpIHtcbiAgICAgICAgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzID0gdGltZXM7XG4gICAgICB9LFxuXG4gICAgICBoYXNOb25TdHJpY3RNb2RlQXNzaWduZWQoKSB7XG4gICAgICAgIGFsbG93Tm9uU3RyaWN0TW9kZUFzc2lnbm1lbnRUaW1lcyA9IE1hdGgubWF4KFxuICAgICAgICAgIDAsXG4gICAgICAgICAgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzIC0gMVxuICAgICAgICApO1xuICAgICAgfSxcblxuICAgICAgdW5zYWZlRXZhbHVhdG9yQWxsb3dlZCgpIHtcbiAgICAgICAgcmV0dXJuIHVzZVVuc2FmZUV2YWx1YXRvcjtcbiAgICAgIH0sXG5cbiAgICAgIGdldCh0YXJnZXQsIHByb3ApIHtcbiAgICAgICAgLy8gU3BlY2lhbCB0cmVhdG1lbnQgZm9yIGV2YWwuIFRoZSB2ZXJ5IGZpcnN0IGxvb2t1cCBvZiAnZXZhbCcgZ2V0cyB0aGVcbiAgICAgICAgLy8gdW5zYWZlIChyZWFsIGRpcmVjdCkgZXZhbCwgc28gaXQgd2lsbCBnZXQgdGhlIGxleGljYWwgc2NvcGUgdGhhdCB1c2VzXG4gICAgICAgIC8vIHRoZSAnd2l0aCcgY29udGV4dC5cbiAgICAgICAgaWYgKHByb3AgPT09ICdldmFsJykge1xuICAgICAgICAgIC8vIHRlc3QgdGhhdCBpdCBpcyB0cnVlIHJhdGhlciB0aGFuIG1lcmVseSB0cnV0aHlcbiAgICAgICAgICBpZiAodXNlVW5zYWZlRXZhbHVhdG9yID09PSB0cnVlKSB7XG4gICAgICAgICAgICAvLyByZXZva2UgYmVmb3JlIHVzZVxuICAgICAgICAgICAgdXNlVW5zYWZlRXZhbHVhdG9yID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdW5zYWZlRXZhbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRhcmdldC5ldmFsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdG9kbzogc2hpbSBpbnRlZ3JpdHksIGNhcHR1cmUgU3ltYm9sLnVuc2NvcGFibGVzXG4gICAgICAgIGlmIChwcm9wID09PSBTeW1ib2wudW5zY29wYWJsZXMpIHtcbiAgICAgICAgICAvLyBTYWZlIHRvIHJldHVybiBhIHByaW1hbCByZWFsbSBPYmplY3QgaGVyZSBiZWNhdXNlIHRoZSBvbmx5IGNvZGUgdGhhdFxuICAgICAgICAgIC8vIGNhbiBkbyBhIGdldCgpIG9uIGEgbm9uLXN0cmluZyBpcyB0aGUgaW50ZXJuYWxzIG9mIHdpdGgoKSBpdHNlbGYsXG4gICAgICAgICAgLy8gYW5kIHRoZSBvbmx5IHRoaW5nIGl0IGRvZXMgaXMgdG8gbG9vayBmb3IgcHJvcGVydGllcyBvbiBpdC4gVXNlclxuICAgICAgICAgIC8vIGNvZGUgY2Fubm90IGRvIGEgbG9va3VwIG9uIG5vbi1zdHJpbmdzLlxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcm9wZXJ0aWVzIG9mIHRoZSBnbG9iYWwuXG4gICAgICAgIGlmIChwcm9wIGluIHRhcmdldCkge1xuICAgICAgICAgIHJldHVybiB0YXJnZXRbcHJvcF07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2ZW50IHRoZSBsb29rdXAgZm9yIG90aGVyIHByb3BlcnRpZXMuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9LFxuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY2xhc3MtbWV0aG9kcy11c2UtdGhpc1xuICAgICAgc2V0KHRhcmdldCwgcHJvcCwgdmFsdWUpIHtcbiAgICAgICAgLy8gdG9kbzogYWxsb3cgbW9kaWZpY2F0aW9ucyB3aGVuIHRhcmdldC5oYXNPd25Qcm9wZXJ0eShwcm9wKSBhbmQgaXRcbiAgICAgICAgLy8gaXMgd3JpdGFibGUsIGFzc3VtaW5nIHdlJ3ZlIGFscmVhZHkgcmVqZWN0ZWQgb3ZlcmxhcCAoc2VlXG4gICAgICAgIC8vIGNyZWF0ZVNhZmVFdmFsdWF0b3JGYWN0b3J5LmZhY3RvcnkpLiBUaGlzIFR5cGVFcnJvciBnZXRzIHJlcGxhY2VkIHdpdGhcbiAgICAgICAgLy8gdGFyZ2V0W3Byb3BdID0gdmFsdWVcbiAgICAgICAgaWYgKG9iamVjdEhhc093blByb3BlcnR5KHRhcmdldCwgcHJvcCkpIHtcbiAgICAgICAgICAvLyB0b2RvOiBzaGltIGludGVncml0eTogVHlwZUVycm9yLCBTdHJpbmdcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBkbyBub3QgbW9kaWZ5IGVuZG93bWVudHMgbGlrZSAke1N0cmluZyhwcm9wKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNhZmVHbG9iYWxbcHJvcF0gPSB2YWx1ZTtcblxuICAgICAgICAvLyBSZXR1cm4gdHJ1ZSBhZnRlciBzdWNjZXNzZnVsIHNldC5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuXG4gICAgICAvLyB3ZSBuZWVkIGhhcygpIHRvIHJldHVybiBmYWxzZSBmb3Igc29tZSBuYW1lcyB0byBwcmV2ZW50IHRoZSBsb29rdXAgIGZyb21cbiAgICAgIC8vIGNsaW1iaW5nIHRoZSBzY29wZSBjaGFpbiBhbmQgZXZlbnR1YWxseSByZWFjaGluZyB0aGUgdW5zYWZlR2xvYmFsXG4gICAgICAvLyBvYmplY3QsIHdoaWNoIGlzIGJhZC5cblxuICAgICAgLy8gbm90ZTogdW5zY29wYWJsZXMhIGV2ZXJ5IHN0cmluZyBpbiBPYmplY3RbU3ltYm9sLnVuc2NvcGFibGVzXVxuXG4gICAgICAvLyB0b2RvOiB3ZSdkIGxpa2UgdG8ganVzdCBoYXZlIGhhcygpIHJldHVybiB0cnVlIGZvciBldmVyeXRoaW5nLCBhbmQgdGhlblxuICAgICAgLy8gdXNlIGdldCgpIHRvIHJhaXNlIGEgUmVmZXJlbmNlRXJyb3IgZm9yIGFueXRoaW5nIG5vdCBvbiB0aGUgc2FmZSBnbG9iYWwuXG4gICAgICAvLyBCdXQgd2Ugd2FudCB0byBiZSBjb21wYXRpYmxlIHdpdGggUmVmZXJlbmNlRXJyb3IgaW4gdGhlIG5vcm1hbCBjYXNlIGFuZFxuICAgICAgLy8gdGhlIGxhY2sgb2YgUmVmZXJlbmNlRXJyb3IgaW4gdGhlICd0eXBlb2YnIGNhc2UuIE11c3QgZWl0aGVyIHJlbGlhYmx5XG4gICAgICAvLyBkaXN0aW5ndWlzaCB0aGVzZSB0d28gY2FzZXMgKHRoZSB0cmFwIGJlaGF2aW9yIG1pZ2h0IGJlIGRpZmZlcmVudCksIG9yXG4gICAgICAvLyB3ZSByZWx5IG9uIGEgbWFuZGF0b3J5IHNvdXJjZS10by1zb3VyY2UgdHJhbnNmb3JtIHRvIGNoYW5nZSAndHlwZW9mIGFiYydcbiAgICAgIC8vIHRvIFhYWC4gV2UgYWxyZWFkeSBuZWVkIGEgbWFuZGF0b3J5IHBhcnNlIHRvIHByZXZlbnQgdGhlICdpbXBvcnQnLFxuICAgICAgLy8gc2luY2UgaXQncyBhIHNwZWNpYWwgZm9ybSBpbnN0ZWFkIG9mIG1lcmVseSBiZWluZyBhIGdsb2JhbCB2YXJpYWJsZS9cblxuICAgICAgLy8gbm90ZTogaWYgd2UgbWFrZSBoYXMoKSByZXR1cm4gdHJ1ZSBhbHdheXMsIHRoZW4gd2UgbXVzdCBpbXBsZW1lbnQgYVxuICAgICAgLy8gc2V0KCkgdHJhcCB0byBhdm9pZCBzdWJ2ZXJ0aW5nIHRoZSBwcm90ZWN0aW9uIG9mIHN0cmljdCBtb2RlIChpdCB3b3VsZFxuICAgICAgLy8gYWNjZXB0IGFzc2lnbm1lbnRzIHRvIHVuZGVmaW5lZCBnbG9iYWxzLCB3aGVuIGl0IG91Z2h0IHRvIHRocm93XG4gICAgICAvLyBSZWZlcmVuY2VFcnJvciBmb3Igc3VjaCBhc3NpZ25tZW50cylcblxuICAgICAgaGFzKHRhcmdldCwgcHJvcCkge1xuICAgICAgICBpZiAodGhpcy5ub25TdHJpY3RNb2RlQXNzaWdubWVudEFsbG93ZWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIHByb3hpZXMgc3RyaW5naWZ5ICdwcm9wJywgc28gbm8gVE9DVFRPVSBkYW5nZXIgaGVyZVxuXG4gICAgICAgIC8vIHVuc2FmZUdsb2JhbDogaGlkZSBhbGwgcHJvcGVydGllcyBvZiB1bnNhZmVHbG9iYWwgYXQgdGhlXG4gICAgICAgIC8vIGV4cGVuc2Ugb2YgJ3R5cGVvZicgYmVpbmcgd3JvbmcgZm9yIHRob3NlIHByb3BlcnRpZXMuIEZvclxuICAgICAgICAvLyBleGFtcGxlLCBpbiB0aGUgYnJvd3NlciwgZXZhbHVhdGluZyAnZG9jdW1lbnQgPSAzJywgd2lsbCBhZGRcbiAgICAgICAgLy8gYSBwcm9wZXJ0eSB0byBzYWZlR2xvYmFsIGluc3RlYWQgb2YgdGhyb3dpbmcgYVxuICAgICAgICAvLyBSZWZlcmVuY2VFcnJvci5cbiAgICAgICAgaWYgKHByb3AgPT09ICdldmFsJyB8fCBwcm9wIGluIHRhcmdldCB8fCBwcm9wIGluIHVuc2FmZUdsb2JhbCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzkuMC9pbmRleC5odG1sI3NlYy1odG1sLWxpa2UtY29tbWVudHNcblxuICAvLyBUaGUgc2hpbSBjYW5ub3QgY29ycmVjdGx5IGVtdWxhdGUgYSBkaXJlY3QgZXZhbCBhcyBleHBsYWluZWQgYXRcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0Fnb3JpYy9yZWFsbXMtc2hpbS9pc3N1ZXMvMTJcbiAgLy8gV2l0aG91dCByZWplY3RpbmcgYXBwYXJlbnQgZGlyZWN0IGV2YWwgc3ludGF4LCB3ZSB3b3VsZFxuICAvLyBhY2NpZGVudGFsbHkgZXZhbHVhdGUgdGhlc2Ugd2l0aCBhbiBlbXVsYXRpb24gb2YgaW5kaXJlY3QgZXZhbC4gVHBcbiAgLy8gcHJldmVudCBmdXR1cmUgY29tcGF0aWJpbGl0eSBwcm9ibGVtcywgaW4gc2hpZnRpbmcgZnJvbSB1c2Ugb2YgdGhlXG4gIC8vIHNoaW0gdG8gZ2VudWluZSBwbGF0Zm9ybSBzdXBwb3J0IGZvciB0aGUgcHJvcG9zYWwsIHdlIHNob3VsZFxuICAvLyBpbnN0ZWFkIHN0YXRpY2FsbHkgcmVqZWN0IGNvZGUgdGhhdCBzZWVtcyB0byBjb250YWluIGEgZGlyZWN0IGV2YWxcbiAgLy8gZXhwcmVzc2lvbi5cbiAgLy9cbiAgLy8gQXMgd2l0aCB0aGUgZHluYW1pYyBpbXBvcnQgZXhwcmVzc2lvbiwgdG8gYXZvaWQgYSBmdWxsIHBhcnNlLCB3ZSBkb1xuICAvLyB0aGlzIGFwcHJveGltYXRlbHkgd2l0aCBhIHJlZ2V4cCwgdGhhdCB3aWxsIGFsc28gcmVqZWN0IHN0cmluZ3NcbiAgLy8gdGhhdCBhcHBlYXIgc2FmZWx5IGluIGNvbW1lbnRzIG9yIHN0cmluZ3MuIFVubGlrZSBkeW5hbWljIGltcG9ydCxcbiAgLy8gaWYgd2UgbWlzcyBzb21lLCB0aGlzIG9ubHkgY3JlYXRlcyBmdXR1cmUgY29tcGF0IHByb2JsZW1zLCBub3RcbiAgLy8gc2VjdXJpdHkgcHJvYmxlbXMuIFRodXMsIHdlIGFyZSBvbmx5IHRyeWluZyB0byBjYXRjaCBpbm5vY2VudFxuICAvLyBvY2N1cnJlbmNlcywgbm90IG1hbGljaW91cyBvbmUuIEluIHBhcnRpY3VsYXIsIGAoZXZhbCkoLi4uKWAgaXNcbiAgLy8gZGlyZWN0IGV2YWwgc3ludGF4IHRoYXQgd291bGQgbm90IGJlIGNhdWdodCBieSB0aGUgZm9sbG93aW5nIHJlZ2V4cC5cblxuICBjb25zdCBzb21lRGlyZWN0RXZhbFBhdHRlcm4gPSAvXFxiZXZhbFxccyooPzpcXCh8XFwvWy8qXSkvO1xuXG4gIGZ1bmN0aW9uIHJlamVjdFNvbWVEaXJlY3RFdmFsRXhwcmVzc2lvbnMocykge1xuICAgIGNvbnN0IGluZGV4ID0gcy5zZWFyY2goc29tZURpcmVjdEV2YWxQYXR0ZXJuKTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICBjb25zdCBsaW5lbnVtID0gcy5zbGljZSgwLCBpbmRleCkuc3BsaXQoJ1xcbicpLmxlbmd0aDsgLy8gbW9yZSBvciBsZXNzXG4gICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgIGBwb3NzaWJsZSBkaXJlY3QgZXZhbCBleHByZXNzaW9uIHJlamVjdGVkIGFyb3VuZCBsaW5lICR7bGluZW51bX1gXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlamVjdERhbmdlcm91c1NvdXJjZXMocykge1xuICAgIC8vIHJlamVjdEh0bWxDb21tZW50cyhzKTtcbiAgICAvLyByZWplY3RJbXBvcnRFeHByZXNzaW9ucyhzKTtcbiAgICByZWplY3RTb21lRGlyZWN0RXZhbEV4cHJlc3Npb25zKHMpO1xuICB9XG5cbiAgLy8gUG9ydGlvbnMgYWRhcHRlZCBmcm9tIFY4IC0gQ29weXJpZ2h0IDIwMTYgdGhlIFY4IHByb2plY3QgYXV0aG9ycy5cblxuICBmdW5jdGlvbiBidWlsZE9wdGltaXplcihjb25zdGFudHMpIHtcbiAgICAvLyBObyBuZWVkIHRvIGJ1aWxkIGFuIG9wcmltaXplciB3aGVuIHRoZXJlIGFyZSBubyBjb25zdGFudHMuXG4gICAgaWYgKGNvbnN0YW50cy5sZW5ndGggPT09IDApIHJldHVybiAnJztcbiAgICAvLyBVc2UgJ3RoaXMnIHRvIGF2b2lkIGdvaW5nIHRocm91Z2ggdGhlIHNjb3BlIHByb3h5LCB3aGljaCBpcyB1bmVjZXNzYXJ5XG4gICAgLy8gc2luY2UgdGhlIG9wdGltaXplciBvbmx5IG5lZWRzIHJlZmVyZW5jZXMgdG8gdGhlIHNhZmUgZ2xvYmFsLlxuICAgIHJldHVybiBgY29uc3QgeyR7YXJyYXlKb2luKGNvbnN0YW50cywgJywnKX19ID0gdGhpcztgO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU2NvcGVkRXZhbHVhdG9yRmFjdG9yeSh1bnNhZmVSZWMsIGNvbnN0YW50cykge1xuICAgIGNvbnN0IHsgdW5zYWZlRnVuY3Rpb24gfSA9IHVuc2FmZVJlYztcblxuICAgIGNvbnN0IG9wdGltaXplciA9IGJ1aWxkT3B0aW1pemVyKGNvbnN0YW50cyk7XG5cbiAgICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBpbiBzbG9wcHkgbW9kZSwgc28gdGhhdCB3ZSBjYW4gdXNlICd3aXRoJy4gSXQgcmV0dXJuc1xuICAgIC8vIGEgZnVuY3Rpb24gaW4gc3RyaWN0IG1vZGUgdGhhdCBldmFsdWF0ZXMgdGhlIHByb3ZpZGVkIGNvZGUgdXNpbmcgZGlyZWN0XG4gICAgLy8gZXZhbCwgYW5kIHRodXMgaW4gc3RyaWN0IG1vZGUgaW4gdGhlIHNhbWUgc2NvcGUuIFdlIG11c3QgYmUgdmVyeSBjYXJlZnVsXG4gICAgLy8gdG8gbm90IGNyZWF0ZSBuZXcgbmFtZXMgaW4gdGhpcyBzY29wZVxuXG4gICAgLy8gMTogd2UgdXNlICd3aXRoJyAoYXJvdW5kIGEgUHJveHkpIHRvIGNhdGNoIGFsbCBmcmVlIHZhcmlhYmxlIG5hbWVzLiBUaGVcbiAgICAvLyBmaXJzdCAnYXJndW1lbnRzWzBdJyBob2xkcyB0aGUgUHJveHkgd2hpY2ggc2FmZWx5IHdyYXBzIHRoZSBzYWZlR2xvYmFsXG4gICAgLy8gMjogJ29wdGltaXplcicgY2F0Y2hlcyBjb21tb24gdmFyaWFibGUgbmFtZXMgZm9yIHNwZWVkXG4gICAgLy8gMzogVGhlIGlubmVyIHN0cmljdCBmdW5jdGlvbiBpcyBlZmZlY3RpdmVseSBwYXNzZWQgdHdvIHBhcmFtZXRlcnM6XG4gICAgLy8gICAgYSkgaXRzIGFyZ3VtZW50c1swXSBpcyB0aGUgc291cmNlIHRvIGJlIGRpcmVjdGx5IGV2YWx1YXRlZC5cbiAgICAvLyAgICBiKSBpdHMgJ3RoaXMnIGlzIHRoZSB0aGlzIGJpbmRpbmcgc2VlbiBieSB0aGUgY29kZSBiZWluZ1xuICAgIC8vICAgICAgIGRpcmVjdGx5IGV2YWx1YXRlZC5cblxuICAgIC8vIGV2ZXJ5dGhpbmcgaW4gdGhlICdvcHRpbWl6ZXInIHN0cmluZyBpcyBsb29rZWQgdXAgaW4gdGhlIHByb3h5XG4gICAgLy8gKGluY2x1ZGluZyBhbiAnYXJndW1lbnRzWzBdJywgd2hpY2ggcG9pbnRzIGF0IHRoZSBQcm94eSkuICdmdW5jdGlvbicgaXNcbiAgICAvLyBhIGtleXdvcmQsIG5vdCBhIHZhcmlhYmxlLCBzbyBpdCBpcyBub3QgbG9va2VkIHVwLiB0aGVuICdldmFsJyBpcyBsb29rZWRcbiAgICAvLyB1cCBpbiB0aGUgcHJveHksIHRoYXQncyB0aGUgZmlyc3QgdGltZSBpdCBpcyBsb29rZWQgdXAgYWZ0ZXJcbiAgICAvLyB1c2VVbnNhZmVFdmFsdWF0b3IgaXMgdHVybmVkIG9uLCBzbyB0aGUgcHJveHkgcmV0dXJucyB0aGUgcmVhbCB0aGVcbiAgICAvLyB1bnNhZmVFdmFsLCB3aGljaCBzYXRpc2ZpZXMgdGhlIElzRGlyZWN0RXZhbFRyYXAgcHJlZGljYXRlLCBzbyBpdCB1c2VzXG4gICAgLy8gdGhlIGRpcmVjdCBldmFsIGFuZCBnZXRzIHRoZSBsZXhpY2FsIHNjb3BlLiBUaGUgc2Vjb25kICdhcmd1bWVudHNbMF0nIGlzXG4gICAgLy8gbG9va2VkIHVwIGluIHRoZSBjb250ZXh0IG9mIHRoZSBpbm5lciBmdW5jdGlvbi4gVGhlICpjb250ZW50cyogb2ZcbiAgICAvLyBhcmd1bWVudHNbMF0sIGJlY2F1c2Ugd2UncmUgdXNpbmcgZGlyZWN0IGV2YWwsIGFyZSBsb29rZWQgdXAgaW4gdGhlXG4gICAgLy8gUHJveHksIGJ5IHdoaWNoIHBvaW50IHRoZSB1c2VVbnNhZmVFdmFsdWF0b3Igc3dpdGNoIGhhcyBiZWVuIGZsaXBwZWRcbiAgICAvLyBiYWNrIHRvICdmYWxzZScsIHNvIGFueSBpbnN0YW5jZXMgb2YgJ2V2YWwnIGluIHRoYXQgc3RyaW5nIHdpbGwgZ2V0IHRoZVxuICAgIC8vIHNhZmUgZXZhbHVhdG9yLlxuXG4gICAgcmV0dXJuIHVuc2FmZUZ1bmN0aW9uKGBcbiAgICB3aXRoIChhcmd1bWVudHNbMF0pIHtcbiAgICAgICR7b3B0aW1pemVyfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgIHJldHVybiBldmFsKGFyZ3VtZW50c1swXSk7XG4gICAgICB9O1xuICAgIH1cbiAgYCk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTYWZlRXZhbHVhdG9yRmFjdG9yeSh1bnNhZmVSZWMsIHNhZmVHbG9iYWwpIHtcbiAgICBjb25zdCB7IHVuc2FmZUZ1bmN0aW9uIH0gPSB1bnNhZmVSZWM7XG5cbiAgICBjb25zdCBzY29wZUhhbmRsZXIgPSBjcmVhdGVTY29wZUhhbmRsZXIodW5zYWZlUmVjLCBzYWZlR2xvYmFsKTtcbiAgICBjb25zdCBjb25zdGFudHMgPSBnZXRPcHRpbWl6YWJsZUdsb2JhbHMoc2FmZUdsb2JhbCk7XG4gICAgY29uc3Qgc2NvcGVkRXZhbHVhdG9yRmFjdG9yeSA9IGNyZWF0ZVNjb3BlZEV2YWx1YXRvckZhY3RvcnkoXG4gICAgICB1bnNhZmVSZWMsXG4gICAgICBjb25zdGFudHNcbiAgICApO1xuXG4gICAgZnVuY3Rpb24gZmFjdG9yeShlbmRvd21lbnRzID0ge30sIG5vblN0cmljdCA9IGZhbHNlKSB7XG4gICAgICAvLyB0b2RvIChzaGltIGxpbWl0YXRpb24pOiBzY2FuIGVuZG93bWVudHMsIHRocm93IGVycm9yIGlmIGVuZG93bWVudFxuICAgICAgLy8gb3ZlcmxhcHMgd2l0aCB0aGUgY29uc3Qgb3B0aW1pemF0aW9uICh3aGljaCB3b3VsZCBvdGhlcndpc2VcbiAgICAgIC8vIGluY29ycmVjdGx5IHNoYWRvdyBlbmRvd21lbnRzKSwgb3IgaWYgZW5kb3dtZW50cyBpbmNsdWRlcyAnZXZhbCcuIEFsc29cbiAgICAgIC8vIHByb2hpYml0IGFjY2Vzc29yIHByb3BlcnRpZXMgKHRvIGJlIGFibGUgdG8gY29uc2lzdGVudGx5IGV4cGxhaW5cbiAgICAgIC8vIHRoaW5ncyBpbiB0ZXJtcyBvZiBzaGltbWluZyB0aGUgZ2xvYmFsIGxleGljYWwgc2NvcGUpLlxuICAgICAgLy8gd3JpdGVhYmxlLXZzLW5vbndyaXRhYmxlID09IGxldC12cy1jb25zdCwgYnV0IHRoZXJlJ3Mgbm9cbiAgICAgIC8vIGdsb2JhbC1sZXhpY2FsLXNjb3BlIGVxdWl2YWxlbnQgb2YgYW4gYWNjZXNzb3IsIG91dHNpZGUgd2hhdCB3ZSBjYW5cbiAgICAgIC8vIGV4cGxhaW4vc3BlY1xuICAgICAgY29uc3Qgc2NvcGVUYXJnZXQgPSBjcmVhdGUoXG4gICAgICAgIHNhZmVHbG9iYWwsXG4gICAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcnMoZW5kb3dtZW50cylcbiAgICAgICk7XG4gICAgICBjb25zdCBzY29wZVByb3h5ID0gbmV3IFByb3h5KHNjb3BlVGFyZ2V0LCBzY29wZUhhbmRsZXIpO1xuICAgICAgY29uc3Qgc2NvcGVkRXZhbHVhdG9yID0gYXBwbHkoc2NvcGVkRXZhbHVhdG9yRmFjdG9yeSwgc2FmZUdsb2JhbCwgW1xuICAgICAgICBzY29wZVByb3h5XG4gICAgICBdKTtcblxuICAgICAgLy8gV2UgdXNlIHRoZSB0aGUgY29uY2lzZSBtZXRob2Qgc3ludGF4IHRvIGNyZWF0ZSBhbiBldmFsIHdpdGhvdXQgYVxuICAgICAgLy8gW1tDb25zdHJ1Y3RdXSBiZWhhdmlvciAoc3VjaCB0aGF0IHRoZSBpbnZvY2F0aW9uIFwibmV3IGV2YWwoKVwiIHRocm93c1xuICAgICAgLy8gVHlwZUVycm9yOiBldmFsIGlzIG5vdCBhIGNvbnN0cnVjdG9yXCIpLCBidXQgd2hpY2ggc3RpbGwgYWNjZXB0cyBhXG4gICAgICAvLyAndGhpcycgYmluZGluZy5cbiAgICAgIGNvbnN0IHNhZmVFdmFsID0ge1xuICAgICAgICBldmFsKHNyYykge1xuICAgICAgICAgIHNyYyA9IGAke3NyY31gO1xuICAgICAgICAgIHJlamVjdERhbmdlcm91c1NvdXJjZXMoc3JjKTtcbiAgICAgICAgICBzY29wZUhhbmRsZXIuYWxsb3dVbnNhZmVFdmFsdWF0b3JPbmNlKCk7XG4gICAgICAgICAgaWYgKG5vblN0cmljdCAmJiAhc2NvcGVIYW5kbGVyLm5vblN0cmljdE1vZGVBc3NpZ25tZW50QWxsb3dlZCgpKSB7XG4gICAgICAgICAgICBzY29wZUhhbmRsZXIuYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudCg1KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IGVycjtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gRW5zdXJlIHRoYXQgXCJ0aGlzXCIgcmVzb2x2ZXMgdG8gdGhlIHNhZmUgZ2xvYmFsLlxuICAgICAgICAgICAgcmV0dXJuIGFwcGx5KHNjb3BlZEV2YWx1YXRvciwgc2FmZUdsb2JhbCwgW3NyY10pO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIHN0YXNoIHRoZSBjaGlsZC1jb2RlIGVycm9yIGluIGhvcGVzIG9mIGRlYnVnZ2luZyB0aGUgaW50ZXJuYWwgZmFpbHVyZVxuICAgICAgICAgICAgZXJyID0gZTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHNjb3BlSGFuZGxlci5oYXNOb25TdHJpY3RNb2RlQXNzaWduZWQoKTtcbiAgICAgICAgICAgIC8vIGJlbHQgYW5kIHN1c3BlbmRlcnM6IHRoZSBwcm94eSBzd2l0Y2hlcyB0aGlzIG9mZiBpbW1lZGlhdGVseSBhZnRlclxuICAgICAgICAgICAgLy8gdGhlIGZpcnN0IGFjY2VzcywgYnV0IGlmIHRoYXQncyBub3QgdGhlIGNhc2Ugd2UgYWJvcnQuXG4gICAgICAgICAgICBpZiAoc2NvcGVIYW5kbGVyLnVuc2FmZUV2YWx1YXRvckFsbG93ZWQoKSkge1xuICAgICAgICAgICAgICB0aHJvd1RhbnRydW0oJ2hhbmRsZXIgZGlkIG5vdCByZXZva2UgdXNlVW5zYWZlRXZhbHVhdG9yJywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0uZXZhbDtcblxuICAgICAgLy8gc2FmZUV2YWwncyBwcm90b3R5cGUgaXMgY3VycmVudGx5IHRoZSBwcmltYWwgcmVhbG0nc1xuICAgICAgLy8gRnVuY3Rpb24ucHJvdG90eXBlLCB3aGljaCB3ZSBtdXN0IG5vdCBsZXQgZXNjYXBlLiBUbyBtYWtlICdldmFsXG4gICAgICAvLyBpbnN0YW5jZW9mIEZ1bmN0aW9uJyBiZSB0cnVlIGluc2lkZSB0aGUgcmVhbG0sIHdlIG5lZWQgdG8gcG9pbnQgaXQgYXRcbiAgICAgIC8vIHRoZSBSb290UmVhbG0ncyB2YWx1ZS5cblxuICAgICAgLy8gRW5zdXJlIHRoYXQgZXZhbCBmcm9tIGFueSBjb21wYXJ0bWVudCBpbiBhIHJvb3QgcmVhbG0gaXMgYW4gaW5zdGFuY2VcbiAgICAgIC8vIG9mIEZ1bmN0aW9uIGluIGFueSBjb21wYXJ0bWVudCBvZiB0aGUgc2FtZSByb290IHJlYWxtLlxuICAgICAgc2V0UHJvdG90eXBlT2Yoc2FmZUV2YWwsIHVuc2FmZUZ1bmN0aW9uLnByb3RvdHlwZSk7XG5cbiAgICAgIGFzc2VydChnZXRQcm90b3R5cGVPZihzYWZlRXZhbCkuY29uc3RydWN0b3IgIT09IEZ1bmN0aW9uLCAnaGlkZSBGdW5jdGlvbicpO1xuICAgICAgYXNzZXJ0KFxuICAgICAgICBnZXRQcm90b3R5cGVPZihzYWZlRXZhbCkuY29uc3RydWN0b3IgIT09IHVuc2FmZUZ1bmN0aW9uLFxuICAgICAgICAnaGlkZSB1bnNhZmVGdW5jdGlvbidcbiAgICAgICk7XG5cbiAgICAgIC8vIG5vdGU6IGJlIGNhcmVmdWwgdG8gbm90IGxlYWsgb3VyIHByaW1hbCBGdW5jdGlvbi5wcm90b3R5cGUgYnkgc2V0dGluZ1xuICAgICAgLy8gdGhpcyB0byBhIHBsYWluIGFycm93IGZ1bmN0aW9uLiBOb3cgdGhhdCB3ZSBoYXZlIHNhZmVFdmFsLCB1c2UgaXQuXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKHNhZmVFdmFsLCB7XG4gICAgICAgIHRvU3RyaW5nOiB7XG4gICAgICAgICAgLy8gV2UgYnJlYWsgdXAgdGhlIGZvbGxvd2luZyBsaXRlcmFsIHN0cmluZyBzbyB0aGF0IGFuXG4gICAgICAgICAgLy8gYXBwYXJlbnQgZGlyZWN0IGV2YWwgc3ludGF4IGRvZXMgbm90IGFwcGVhciBpbiB0aGlzXG4gICAgICAgICAgLy8gZmlsZS4gVGh1cywgd2UgYXZvaWQgcmVqZWN0aW9uIGJ5IHRoZSBvdmVybHkgZWFnZXJcbiAgICAgICAgICAvLyByZWplY3REYW5nZXJvdXNTb3VyY2VzLlxuICAgICAgICAgIHZhbHVlOiBzYWZlRXZhbChcIigpID0+ICdmdW5jdGlvbiBldmFsJyArICcoKSB7IFtzaGltIGNvZGVdIH0nXCIpLFxuICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBzYWZlRXZhbDtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNhZmVFdmFsdWF0b3Ioc2FmZUV2YWx1YXRvckZhY3RvcnkpIHtcbiAgICByZXR1cm4gc2FmZUV2YWx1YXRvckZhY3RvcnkoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNhZmVFdmFsdWF0b3JXaGljaFRha2VzRW5kb3dtZW50cyhzYWZlRXZhbHVhdG9yRmFjdG9yeSkge1xuICAgIHJldHVybiAoeCwgZW5kb3dtZW50cykgPT4gc2FmZUV2YWx1YXRvckZhY3RvcnkoZW5kb3dtZW50cykoeCk7XG4gIH1cblxuICAvKipcbiAgICogQSBzYWZlIHZlcnNpb24gb2YgdGhlIG5hdGl2ZSBGdW5jdGlvbiB3aGljaCByZWxpZXMgb25cbiAgICogdGhlIHNhZmV0eSBvZiBldmFsRXZhbHVhdG9yIGZvciBjb25maW5lbWVudC5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZUZ1bmN0aW9uRXZhbHVhdG9yKFxuICAgIHVuc2FmZVJlYyxcbiAgICBzYWZlRXZhbEZhY3RvcnksXG4gICAgcmVhbG1HbG9iYWxcbiAgKSB7XG4gICAgY29uc3QgeyB1bnNhZmVGdW5jdGlvbiwgdW5zYWZlR2xvYmFsIH0gPSB1bnNhZmVSZWM7XG5cbiAgICBjb25zdCBzYWZlRXZhbFN0cmljdCA9IHNhZmVFdmFsRmFjdG9yeSh1bmRlZmluZWQsIGZhbHNlKTtcbiAgICBjb25zdCBzYWZlRXZhbE5vblN0cmljdCA9IHNhZmVFdmFsRmFjdG9yeSh1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgY29uc3Qgc2FmZUZ1bmN0aW9uID0gZnVuY3Rpb24gRnVuY3Rpb24oLi4ucGFyYW1zKSB7XG4gICAgICBjb25zdCBmdW5jdGlvbkJvZHkgPSBgJHthcnJheVBvcChwYXJhbXMpIHx8ICcnfWA7XG4gICAgICBsZXQgZnVuY3Rpb25QYXJhbXMgPSBgJHthcnJheUpvaW4ocGFyYW1zLCAnLCcpfWA7XG4gICAgICBpZiAoIXJlZ2V4cFRlc3QoL15bXFx3XFxzLF0qJC8sIGZ1bmN0aW9uUGFyYW1zKSkge1xuICAgICAgICB0aHJvdyBuZXcgdW5zYWZlR2xvYmFsLlN5bnRheEVycm9yKFxuICAgICAgICAgICdzaGltIGxpbWl0YXRpb246IEZ1bmN0aW9uIGFyZyBtdXN0IGJlIHNpbXBsZSBBU0NJSSBpZGVudGlmaWVycywgcG9zc2libHkgc2VwYXJhdGVkIGJ5IGNvbW1hczogbm8gZGVmYXVsdCB2YWx1ZXMsIHBhdHRlcm4gbWF0Y2hlcywgb3Igbm9uLUFTQ0lJIHBhcmFtZXRlciBuYW1lcydcbiAgICAgICAgKTtcbiAgICAgICAgLy8gdGhpcyBwcm90ZWN0cyBhZ2FpbnN0IE1hdHQgQXVzdGluJ3MgY2xldmVyIGF0dGFjazpcbiAgICAgICAgLy8gRnVuY3Rpb24oXCJhcmc9YFwiLCBcIi8qYm9keWApe30pOyh7eDogdGhpcy8qKi9cIilcbiAgICAgICAgLy8gd2hpY2ggd291bGQgdHVybiBpbnRvXG4gICAgICAgIC8vICAgICAoZnVuY3Rpb24oYXJnPWBcbiAgICAgICAgLy8gICAgIC8qYGAqLyl7XG4gICAgICAgIC8vICAgICAgLypib2R5YCl7fSk7KHt4OiB0aGlzLyoqL1xuICAgICAgICAvLyAgICAgfSlcbiAgICAgICAgLy8gd2hpY2ggcGFyc2VzIGFzIGEgZGVmYXVsdCBhcmd1bWVudCBvZiBgXFxuLypgYCovKXtcXG4vKmJvZHlgICwgd2hpY2hcbiAgICAgICAgLy8gaXMgYSBwYWlyIG9mIHRlbXBsYXRlIGxpdGVyYWxzIGJhY2stdG8tYmFjayAoc28gdGhlIGZpcnN0IG9uZVxuICAgICAgICAvLyBub21pbmFsbHkgZXZhbHVhdGVzIHRvIHRoZSBwYXJzZXIgdG8gdXNlIG9uIHRoZSBzZWNvbmQgb25lKSwgd2hpY2hcbiAgICAgICAgLy8gY2FuJ3QgYWN0dWFsbHkgZXhlY3V0ZSAoYmVjYXVzZSB0aGUgZmlyc3QgbGl0ZXJhbCBldmFscyB0byBhIHN0cmluZyxcbiAgICAgICAgLy8gd2hpY2ggY2FuJ3QgYmUgYSBwYXJzZXIgZnVuY3Rpb24pLCBidXQgdGhhdCBkb2Vzbid0IG1hdHRlciBiZWNhdXNlXG4gICAgICAgIC8vIHRoZSBmdW5jdGlvbiBpcyBieXBhc3NlZCBlbnRpcmVseS4gV2hlbiB0aGF0IGdldHMgZXZhbHVhdGVkLCBpdFxuICAgICAgICAvLyBkZWZpbmVzIChidXQgZG9lcyBub3QgaW52b2tlKSBhIGZ1bmN0aW9uLCB0aGVuIGV2YWx1YXRlcyBhIHNpbXBsZVxuICAgICAgICAvLyB7eDogdGhpc30gZXhwcmVzc2lvbiwgZ2l2aW5nIGFjY2VzcyB0byB0aGUgc2FmZSBnbG9iYWwuXG4gICAgICB9XG5cbiAgICAgIC8vIElzIHRoaXMgYSByZWFsIGZ1bmN0aW9uQm9keSwgb3IgaXMgc29tZW9uZSBhdHRlbXB0aW5nIGFuIGluamVjdGlvblxuICAgICAgLy8gYXR0YWNrPyBUaGlzIHdpbGwgdGhyb3cgYSBTeW50YXhFcnJvciBpZiB0aGUgc3RyaW5nIGlzIG5vdCBhY3R1YWxseSBhXG4gICAgICAvLyBmdW5jdGlvbiBib2R5LiBXZSBjb2VyY2UgdGhlIGJvZHkgaW50byBhIHJlYWwgc3RyaW5nIGFib3ZlIHRvIHByZXZlbnRcbiAgICAgIC8vIHNvbWVvbmUgZnJvbSBwYXNzaW5nIGFuIG9iamVjdCB3aXRoIGEgdG9TdHJpbmcoKSB0aGF0IHJldHVybnMgYSBzYWZlXG4gICAgICAvLyBzdHJpbmcgdGhlIGZpcnN0IHRpbWUsIGJ1dCBhbiBldmlsIHN0cmluZyB0aGUgc2Vjb25kIHRpbWUuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LCBuZXctY2FwXG4gICAgICBuZXcgdW5zYWZlRnVuY3Rpb24oZnVuY3Rpb25Cb2R5KTtcblxuICAgICAgaWYgKHN0cmluZ0luY2x1ZGVzKGZ1bmN0aW9uUGFyYW1zLCAnKScpKSB7XG4gICAgICAgIC8vIElmIHRoZSBmb3JtYWwgcGFyYW1ldGVycyBzdHJpbmcgaW5jbHVkZSApIC0gYW4gaWxsZWdhbFxuICAgICAgICAvLyBjaGFyYWN0ZXIgLSBpdCBtYXkgbWFrZSB0aGUgY29tYmluZWQgZnVuY3Rpb24gZXhwcmVzc2lvblxuICAgICAgICAvLyBjb21waWxlLiBXZSBhdm9pZCB0aGlzIHByb2JsZW0gYnkgY2hlY2tpbmcgZm9yIHRoaXMgZWFybHkgb24uXG5cbiAgICAgICAgLy8gbm90ZTogdjggdGhyb3dzIGp1c3QgbGlrZSB0aGlzIGRvZXMsIGJ1dCBjaHJvbWUgYWNjZXB0c1xuICAgICAgICAvLyBlLmcuICdhID0gbmV3IERhdGUoKSdcbiAgICAgICAgdGhyb3cgbmV3IHVuc2FmZUdsb2JhbC5TeW50YXhFcnJvcihcbiAgICAgICAgICAnc2hpbSBsaW1pdGF0aW9uOiBGdW5jdGlvbiBhcmcgc3RyaW5nIGNvbnRhaW5zIHBhcmVudGhlc2lzJ1xuICAgICAgICApO1xuICAgICAgICAvLyB0b2RvOiBzaGltIGludGVncml0eSB0aHJlYXQgaWYgdGhleSBjaGFuZ2UgU3ludGF4RXJyb3JcbiAgICAgIH1cblxuICAgICAgLy8gdG9kbzogY2hlY2sgdG8gbWFrZSBzdXJlIHRoaXMgLmxlbmd0aCBpcyBzYWZlLiBtYXJrbSBzYXlzIHNhZmUuXG4gICAgICBpZiAoZnVuY3Rpb25QYXJhbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBJZiB0aGUgZm9ybWFsIHBhcmFtZXRlcnMgaW5jbHVkZSBhbiB1bmJhbGFuY2VkIGJsb2NrIGNvbW1lbnQsIHRoZVxuICAgICAgICAvLyBmdW5jdGlvbiBtdXN0IGJlIHJlamVjdGVkLiBTaW5jZSBKYXZhU2NyaXB0IGRvZXMgbm90IGFsbG93IG5lc3RlZFxuICAgICAgICAvLyBjb21tZW50cyB3ZSBjYW4gaW5jbHVkZSBhIHRyYWlsaW5nIGJsb2NrIGNvbW1lbnQgdG8gY2F0Y2ggdGhpcy5cbiAgICAgICAgZnVuY3Rpb25QYXJhbXMgKz0gJ1xcbi8qYGAqLyc7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNyYyA9IGAoZnVuY3Rpb24oJHtmdW5jdGlvblBhcmFtc30pe1xcbiR7ZnVuY3Rpb25Cb2R5fVxcbn0pYDtcbiAgICAgIGNvbnN0IGlzU3RyaWN0ID0gISEvXlxccypbJ3xcIl11c2Ugc3RyaWN0Wyd8XCJdLy5leGVjKGZ1bmN0aW9uQm9keSk7XG4gICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgcmV0dXJuIHNhZmVFdmFsU3RyaWN0KHNyYyk7XG4gICAgICB9XG4gICAgICBjb25zdCBmbiA9IHNhZmVFdmFsTm9uU3RyaWN0KHNyYyk7XG4gICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgcmV0dXJuIGZuO1xuICAgICAgfVxuICAgICAgLy8gd2UgZml4IHRoZSBgdGhpc2AgYmluZGluZyBpbiBGdW5jdGlvbigpLlxuICAgICAgY29uc3QgYmluZFRoaXMgPSBgKGZ1bmN0aW9uIChnbG9iYWxUaGlzLCBmKSB7XG4gIGZ1bmN0aW9uIGYyKCkge1xuICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KGYsIHRoaXMgfHwgZ2xvYmFsVGhpcywgYXJndW1lbnRzKTtcbiAgfVxuICBmMi50b1N0cmluZyA9ICgpID0+IGYudG9TdHJpbmcoKTtcbiAgcmV0dXJuIGYyO1xufSlgO1xuICAgICAgY29uc3QgZm5XaXRoVGhpcyA9IHNhZmVFdmFsU3RyaWN0KGJpbmRUaGlzKShyZWFsbUdsb2JhbCwgZm4pO1xuICAgICAgcmV0dXJuIGZuV2l0aFRoaXM7XG4gICAgfTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IEZ1bmN0aW9uIGZyb20gYW55IGNvbXBhcnRtZW50IGluIGEgcm9vdCByZWFsbSBjYW4gYmUgdXNlZFxuICAgIC8vIHdpdGggaW5zdGFuY2UgY2hlY2tzIGluIGFueSBjb21wYXJ0bWVudCBvZiB0aGUgc2FtZSByb290IHJlYWxtLlxuICAgIHNldFByb3RvdHlwZU9mKHNhZmVGdW5jdGlvbiwgdW5zYWZlRnVuY3Rpb24ucHJvdG90eXBlKTtcblxuICAgIGFzc2VydChcbiAgICAgIGdldFByb3RvdHlwZU9mKHNhZmVGdW5jdGlvbikuY29uc3RydWN0b3IgIT09IEZ1bmN0aW9uLFxuICAgICAgJ2hpZGUgRnVuY3Rpb24nXG4gICAgKTtcbiAgICBhc3NlcnQoXG4gICAgICBnZXRQcm90b3R5cGVPZihzYWZlRnVuY3Rpb24pLmNvbnN0cnVjdG9yICE9PSB1bnNhZmVGdW5jdGlvbixcbiAgICAgICdoaWRlIHVuc2FmZUZ1bmN0aW9uJ1xuICAgICk7XG5cbiAgICBkZWZpbmVQcm9wZXJ0aWVzKHNhZmVGdW5jdGlvbiwge1xuICAgICAgLy8gRW5zdXJlIHRoYXQgYW55IGZ1bmN0aW9uIGNyZWF0ZWQgaW4gYW55IGNvbXBhcnRtZW50IGluIGEgcm9vdCByZWFsbSBpcyBhblxuICAgICAgLy8gaW5zdGFuY2Ugb2YgRnVuY3Rpb24gaW4gYW55IGNvbXBhcnRtZW50IG9mIHRoZSBzYW1lIHJvb3QgcmFsbS5cbiAgICAgIHByb3RvdHlwZTogeyB2YWx1ZTogdW5zYWZlRnVuY3Rpb24ucHJvdG90eXBlIH0sXG5cbiAgICAgIC8vIFByb3ZpZGUgYSBjdXN0b20gb3V0cHV0IHdpdGhvdXQgb3ZlcndyaXRpbmcgdGhlXG4gICAgICAvLyBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgd2hpY2ggaXMgY2FsbGVkIGJ5IHNvbWUgdGhpcmQtcGFydHlcbiAgICAgIC8vIGxpYnJhcmllcy5cbiAgICAgIHRvU3RyaW5nOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRXZhbFN0cmljdChcIigpID0+ICdmdW5jdGlvbiBGdW5jdGlvbigpIHsgW3NoaW0gY29kZV0gfSdcIiksXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNhZmVGdW5jdGlvbjtcbiAgfVxuXG4gIC8vIE1pbWljIHByaXZhdGUgbWVtYmVycyBvbiB0aGUgcmVhbG0gaW5zdGFuY2VzLlxuICAvLyBXZSBkZWZpbmUgaXQgaW4gdGhlIHNhbWUgbW9kdWxlIGFuZCBkbyBub3QgZXhwb3J0IGl0LlxuICBjb25zdCBSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UgPSBuZXcgV2Vha01hcCgpO1xuXG4gIGZ1bmN0aW9uIGdldFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZShyZWFsbSkge1xuICAgIC8vIERldGVjdCBub24tb2JqZWN0cy5cbiAgICBhc3NlcnQoT2JqZWN0KHJlYWxtKSA9PT0gcmVhbG0sICdiYWQgb2JqZWN0LCBub3QgYSBSZWFsbSBpbnN0YW5jZScpO1xuICAgIC8vIFJlYWxtIGluc3RhbmNlIGhhcyBubyByZWFsbVJlYy4gU2hvdWxkIG5vdCBwcm9jZWVkLlxuICAgIGFzc2VydChSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UuaGFzKHJlYWxtKSwgJ1JlYWxtIGluc3RhbmNlIGhhcyBubyByZWNvcmQnKTtcblxuICAgIHJldHVybiBSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UuZ2V0KHJlYWxtKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHJlYWxtLCByZWFsbVJlYykge1xuICAgIC8vIERldGVjdCBub24tb2JqZWN0cy5cbiAgICBhc3NlcnQoT2JqZWN0KHJlYWxtKSA9PT0gcmVhbG0sICdiYWQgb2JqZWN0LCBub3QgYSBSZWFsbSBpbnN0YW5jZScpO1xuICAgIC8vIEF0dGVtcHQgdG8gY2hhbmdlIGFuIGV4aXN0aW5nIHJlYWxtUmVjIG9uIGEgcmVhbG0gaW5zdGFuY2UuIFNob3VsZCBub3QgcHJvY2VlZC5cbiAgICBhc3NlcnQoXG4gICAgICAhUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlLmhhcyhyZWFsbSksXG4gICAgICAnUmVhbG0gaW5zdGFuY2UgYWxyZWFkeSBoYXMgYSByZWNvcmQnXG4gICAgKTtcblxuICAgIFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZS5zZXQocmVhbG0sIHJlYWxtUmVjKTtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgdGhlIGdsb2JhbCB2YXJpYWJsZXMgZm9yIHRoZSBuZXcgUmVhbG0uXG4gIGZ1bmN0aW9uIHNldERlZmF1bHRCaW5kaW5ncyhzYWZlR2xvYmFsLCBzYWZlRXZhbCwgc2FmZUZ1bmN0aW9uKSB7XG4gICAgZGVmaW5lUHJvcGVydGllcyhzYWZlR2xvYmFsLCB7XG4gICAgICBldmFsOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRXZhbCxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIEZ1bmN0aW9uOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRnVuY3Rpb24sXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVJlYWxtUmVjKHVuc2FmZVJlYykge1xuICAgIGNvbnN0IHsgc2hhcmVkR2xvYmFsRGVzY3MsIHVuc2FmZUdsb2JhbCB9ID0gdW5zYWZlUmVjO1xuXG4gICAgY29uc3Qgc2FmZUdsb2JhbCA9IGNyZWF0ZSh1bnNhZmVHbG9iYWwuT2JqZWN0LnByb3RvdHlwZSwgc2hhcmVkR2xvYmFsRGVzY3MpO1xuXG4gICAgY29uc3Qgc2FmZUV2YWx1YXRvckZhY3RvcnkgPSBjcmVhdGVTYWZlRXZhbHVhdG9yRmFjdG9yeShcbiAgICAgIHVuc2FmZVJlYyxcbiAgICAgIHNhZmVHbG9iYWxcbiAgICApO1xuICAgIGNvbnN0IHNhZmVFdmFsID0gY3JlYXRlU2FmZUV2YWx1YXRvcihzYWZlRXZhbHVhdG9yRmFjdG9yeSk7XG4gICAgY29uc3Qgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyA9IGNyZWF0ZVNhZmVFdmFsdWF0b3JXaGljaFRha2VzRW5kb3dtZW50cyhcbiAgICAgIHNhZmVFdmFsdWF0b3JGYWN0b3J5XG4gICAgKTtcbiAgICBjb25zdCBzYWZlRnVuY3Rpb24gPSBjcmVhdGVGdW5jdGlvbkV2YWx1YXRvcihcbiAgICAgIHVuc2FmZVJlYyxcbiAgICAgIHNhZmVFdmFsdWF0b3JGYWN0b3J5LFxuICAgICAgc2FmZUdsb2JhbFxuICAgICk7XG5cbiAgICBzZXREZWZhdWx0QmluZGluZ3Moc2FmZUdsb2JhbCwgc2FmZUV2YWwsIHNhZmVGdW5jdGlvbik7XG5cbiAgICBjb25zdCByZWFsbVJlYyA9IGZyZWV6ZSh7XG4gICAgICBzYWZlR2xvYmFsLFxuICAgICAgc2FmZUV2YWwsXG4gICAgICBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzLFxuICAgICAgc2FmZUZ1bmN0aW9uXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVhbG1SZWM7XG4gIH1cblxuICAvKipcbiAgICogQSByb290IHJlYWxtIHVzZXMgYSBmcmVzaCBzZXQgb2YgbmV3IGludHJpbmljcy4gSGVyZSB3ZSBmaXJzdCBjcmVhdGVcbiAgICogYSBuZXcgdW5zYWZlIHJlY29yZCwgd2hpY2ggaW5oZXJpdHMgdGhlIHNoaW1zLiBUaGVuIHdlIHByb2NlZWQgd2l0aFxuICAgKiB0aGUgY3JlYXRpb24gb2YgdGhlIHJlYWxtIHJlY29yZCwgYW5kIHdlIGFwcGx5IHRoZSBzaGltcy5cbiAgICovXG4gIGZ1bmN0aW9uIGluaXRSb290UmVhbG0ocGFyZW50VW5zYWZlUmVjLCBzZWxmLCBvcHRpb25zKSB7XG4gICAgLy8gbm90ZTogJ3NlbGYnIGlzIHRoZSBpbnN0YW5jZSBvZiB0aGUgUmVhbG0uXG5cbiAgICAvLyB0b2RvOiBpbnZlc3RpZ2F0ZSBhdHRhY2tzIHZpYSBBcnJheS5zcGVjaWVzXG4gICAgLy8gdG9kbzogdGhpcyBhY2NlcHRzIG5ld1NoaW1zPSdzdHJpbmcnLCBidXQgaXQgc2hvdWxkIHJlamVjdCB0aGF0XG4gICAgY29uc3QgeyBzaGltczogbmV3U2hpbXMgfSA9IG9wdGlvbnM7XG4gICAgY29uc3QgYWxsU2hpbXMgPSBhcnJheUNvbmNhdChwYXJlbnRVbnNhZmVSZWMuYWxsU2hpbXMsIG5ld1NoaW1zKTtcblxuICAgIC8vIFRoZSB1bnNhZmUgcmVjb3JkIGlzIGNyZWF0ZWQgYWxyZWFkeSByZXBhaXJlZC5cbiAgICBjb25zdCB1bnNhZmVSZWMgPSBjcmVhdGVOZXdVbnNhZmVSZWMoYWxsU2hpbXMpO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgY29uc3QgUmVhbG0gPSBjcmVhdGVSZWFsbUZhY2FkZSh1bnNhZmVSZWMsIEJhc2VSZWFsbSk7XG5cbiAgICAvLyBBZGQgYSBSZWFsbSBkZXNjcmlwdG9yIHRvIHNoYXJlZEdsb2JhbERlc2NzLCBzbyBpdCBjYW4gYmUgZGVmaW5lZCBvbnRvIHRoZVxuICAgIC8vIHNhZmVHbG9iYWwgbGlrZSB0aGUgcmVzdCBvZiB0aGUgZ2xvYmFscy5cbiAgICB1bnNhZmVSZWMuc2hhcmVkR2xvYmFsRGVzY3MuUmVhbG0gPSB7XG4gICAgICB2YWx1ZTogUmVhbG0sXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH07XG5cbiAgICAvLyBDcmVhdGluZyB0aGUgcmVhbG1SZWMgcHJvdmlkZXMgdGhlIGdsb2JhbCBvYmplY3QsIGV2YWwoKSBhbmQgRnVuY3Rpb24oKVxuICAgIC8vIHRvIHRoZSByZWFsbS5cbiAgICBjb25zdCByZWFsbVJlYyA9IGNyZWF0ZVJlYWxtUmVjKHVuc2FmZVJlYyk7XG5cbiAgICAvLyBBcHBseSBhbGwgc2hpbXMgaW4gdGhlIG5ldyBSb290UmVhbG0uIFdlIGRvbid0IGRvIHRoaXMgZm9yIGNvbXBhcnRtZW50cy5cbiAgICBjb25zdCB7IHNhZmVFdmFsV2hpY2hUYWtlc0VuZG93bWVudHMgfSA9IHJlYWxtUmVjO1xuICAgIGZvciAoY29uc3Qgc2hpbSBvZiBhbGxTaGltcykge1xuICAgICAgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyhzaGltKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgcmVhbG1SZWMgYWN0cyBhcyBhIHByaXZhdGUgZmllbGQgb24gdGhlIHJlYWxtIGluc3RhbmNlLlxuICAgIHJlZ2lzdGVyUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHNlbGYsIHJlYWxtUmVjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNvbXBhcnRtZW50IHNoYXJlcyB0aGUgaW50cmluc2ljcyBvZiBpdHMgcm9vdCByZWFsbS4gSGVyZSwgb25seSBhXG4gICAqIHJlYWxtUmVjIGlzIG5lY2Vzc2FyeSB0byBob2xkIHRoZSBnbG9iYWwgb2JqZWN0LCBldmFsKCkgYW5kIEZ1bmN0aW9uKCkuXG4gICAqL1xuICBmdW5jdGlvbiBpbml0Q29tcGFydG1lbnQodW5zYWZlUmVjLCBzZWxmKSB7XG4gICAgLy8gbm90ZTogJ3NlbGYnIGlzIHRoZSBpbnN0YW5jZSBvZiB0aGUgUmVhbG0uXG5cbiAgICBjb25zdCByZWFsbVJlYyA9IGNyZWF0ZVJlYWxtUmVjKHVuc2FmZVJlYyk7XG5cbiAgICAvLyBUaGUgcmVhbG1SZWMgYWN0cyBhcyBhIHByaXZhdGUgZmllbGQgb24gdGhlIHJlYWxtIGluc3RhbmNlLlxuICAgIHJlZ2lzdGVyUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHNlbGYsIHJlYWxtUmVjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlYWxtR2xvYmFsKHNlbGYpIHtcbiAgICBjb25zdCB7IHNhZmVHbG9iYWwgfSA9IGdldFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZShzZWxmKTtcbiAgICByZXR1cm4gc2FmZUdsb2JhbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWxtRXZhbHVhdGUoc2VsZiwgeCwgZW5kb3dtZW50cyA9IHt9KSB7XG4gICAgLy8gdG9kbzogZG9uJ3QgcGFzcyBpbiBwcmltYWwtcmVhbG0gb2JqZWN0cyBsaWtlIHt9LCBmb3Igc2FmZXR5LiBPVE9IIGl0c1xuICAgIC8vIHByb3BlcnRpZXMgYXJlIGNvcGllZCBvbnRvIHRoZSBuZXcgZ2xvYmFsICd0YXJnZXQnLlxuICAgIC8vIHRvZG86IGZpZ3VyZSBvdXQgYSB3YXkgdG8gbWVtYnJhbmUgYXdheSB0aGUgY29udGVudHMgdG8gc2FmZXR5LlxuICAgIGNvbnN0IHsgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyB9ID0gZ2V0UmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHNlbGYpO1xuICAgIHJldHVybiBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzKHgsIGVuZG93bWVudHMpO1xuICB9XG5cbiAgY29uc3QgQmFzZVJlYWxtID0ge1xuICAgIGluaXRSb290UmVhbG0sXG4gICAgaW5pdENvbXBhcnRtZW50LFxuICAgIGdldFJlYWxtR2xvYmFsLFxuICAgIHJlYWxtRXZhbHVhdGVcbiAgfTtcblxuICAvLyBDcmVhdGUgdGhlIGN1cnJlbnQgdW5zYWZlUmVjIGZyb20gdGhlIGN1cnJlbnQgXCJwcmltYWxcIiBlbnZpcm9ubWVudCAodGhlIHJlYWxtXG4gIC8vIHdoZXJlIHRoZSBSZWFsbSBzaGltIGlzIGxvYWRlZCBhbmQgZXhlY3V0ZWQpLlxuICBjb25zdCBjdXJyZW50VW5zYWZlUmVjID0gY3JlYXRlQ3VycmVudFVuc2FmZVJlYygpO1xuXG4gIC8qKlxuICAgKiBUaGUgXCJwcmltYWxcIiByZWFsbSBjbGFzcyBpcyBkZWZpbmVkIGluIHRoZSBjdXJyZW50IFwicHJpbWFsXCIgZW52aXJvbm1lbnQsXG4gICAqIGFuZCBpcyBwYXJ0IG9mIHRoZSBzaGltLiBUaGVyZSBpcyBubyBuZWVkIHRvIGZhY2FkZSB0aGlzIGNsYXNzIHZpYSBldmFsdWF0aW9uXG4gICAqIGJlY2F1c2UgYm90aCBzaGFyZSB0aGUgc2FtZSBpbnRyaW5zaWNzLlxuICAgKi9cbiAgY29uc3QgUmVhbG0gPSBidWlsZENoaWxkUmVhbG0oY3VycmVudFVuc2FmZVJlYywgQmFzZVJlYWxtKTtcblxuICByZXR1cm4gUmVhbG07XG5cbn0pKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlYWxtcy1zaGltLnVtZC5qcy5tYXBcbiIsIi8vICAgICAgXG4vLyBBbiBldmVudCBoYW5kbGVyIGNhbiB0YWtlIGFuIG9wdGlvbmFsIGV2ZW50IGFyZ3VtZW50XG4vLyBhbmQgc2hvdWxkIG5vdCByZXR1cm4gYSB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcblxuLy8gQW4gYXJyYXkgb2YgYWxsIGN1cnJlbnRseSByZWdpc3RlcmVkIGV2ZW50IGhhbmRsZXJzIGZvciBhIHR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbi8vIEEgbWFwIG9mIGV2ZW50IHR5cGVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIGV2ZW50IGhhbmRsZXJzLlxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gIFxuXG4vKiogTWl0dDogVGlueSAofjIwMGIpIGZ1bmN0aW9uYWwgZXZlbnQgZW1pdHRlciAvIHB1YnN1Yi5cbiAqICBAbmFtZSBtaXR0XG4gKiAgQHJldHVybnMge01pdHR9XG4gKi9cbmZ1bmN0aW9uIG1pdHQoYWxsICAgICAgICAgICAgICAgICApIHtcblx0YWxsID0gYWxsIHx8IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cblx0cmV0dXJuIHtcblx0XHQvKipcblx0XHQgKiBSZWdpc3RlciBhbiBldmVudCBoYW5kbGVyIGZvciB0aGUgZ2l2ZW4gdHlwZS5cblx0XHQgKlxuXHRcdCAqIEBwYXJhbSAge1N0cmluZ30gdHlwZVx0VHlwZSBvZiBldmVudCB0byBsaXN0ZW4gZm9yLCBvciBgXCIqXCJgIGZvciBhbGwgZXZlbnRzXG5cdFx0ICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgRnVuY3Rpb24gdG8gY2FsbCBpbiByZXNwb25zZSB0byBnaXZlbiBldmVudFxuXHRcdCAqIEBtZW1iZXJPZiBtaXR0XG5cdFx0ICovXG5cdFx0b246IGZ1bmN0aW9uIG9uKHR5cGUgICAgICAgICwgaGFuZGxlciAgICAgICAgICAgICAgKSB7XG5cdFx0XHQoYWxsW3R5cGVdIHx8IChhbGxbdHlwZV0gPSBbXSkpLnB1c2goaGFuZGxlcik7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyIGZvciB0aGUgZ2l2ZW4gdHlwZS5cblx0XHQgKlxuXHRcdCAqIEBwYXJhbSAge1N0cmluZ30gdHlwZVx0VHlwZSBvZiBldmVudCB0byB1bnJlZ2lzdGVyIGBoYW5kbGVyYCBmcm9tLCBvciBgXCIqXCJgXG5cdFx0ICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgSGFuZGxlciBmdW5jdGlvbiB0byByZW1vdmVcblx0XHQgKiBAbWVtYmVyT2YgbWl0dFxuXHRcdCAqL1xuXHRcdG9mZjogZnVuY3Rpb24gb2ZmKHR5cGUgICAgICAgICwgaGFuZGxlciAgICAgICAgICAgICAgKSB7XG5cdFx0XHRpZiAoYWxsW3R5cGVdKSB7XG5cdFx0XHRcdGFsbFt0eXBlXS5zcGxpY2UoYWxsW3R5cGVdLmluZGV4T2YoaGFuZGxlcikgPj4+IDAsIDEpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBJbnZva2UgYWxsIGhhbmRsZXJzIGZvciB0aGUgZ2l2ZW4gdHlwZS5cblx0XHQgKiBJZiBwcmVzZW50LCBgXCIqXCJgIGhhbmRsZXJzIGFyZSBpbnZva2VkIGFmdGVyIHR5cGUtbWF0Y2hlZCBoYW5kbGVycy5cblx0XHQgKlxuXHRcdCAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlICBUaGUgZXZlbnQgdHlwZSB0byBpbnZva2Vcblx0XHQgKiBAcGFyYW0ge0FueX0gW2V2dF0gIEFueSB2YWx1ZSAob2JqZWN0IGlzIHJlY29tbWVuZGVkIGFuZCBwb3dlcmZ1bCksIHBhc3NlZCB0byBlYWNoIGhhbmRsZXJcblx0XHQgKiBAbWVtYmVyT2YgbWl0dFxuXHRcdCAqL1xuXHRcdGVtaXQ6IGZ1bmN0aW9uIGVtaXQodHlwZSAgICAgICAgLCBldnQgICAgICkge1xuXHRcdFx0KGFsbFt0eXBlXSB8fCBbXSkuc2xpY2UoKS5tYXAoZnVuY3Rpb24gKGhhbmRsZXIpIHsgaGFuZGxlcihldnQpOyB9KTtcblx0XHRcdChhbGxbJyonXSB8fCBbXSkuc2xpY2UoKS5tYXAoZnVuY3Rpb24gKGhhbmRsZXIpIHsgaGFuZGxlcih0eXBlLCBldnQpOyB9KTtcblx0XHR9XG5cdH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IG1pdHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1taXR0LmVzLmpzLm1hcFxuIiwiaW1wb3J0IG1pdHQgZnJvbSAnbWl0dCc7XG5jb25zdCBNZXNzYWdlQ2VudGVyRXZlbnQgPSAnSG9sb2Zsb3dzLUtpdCBNZXNzYWdlQ2VudGVyJztcbmNvbnN0IG5ld01lc3NhZ2UgPSAoa2V5LCBkYXRhKSA9PiBuZXcgQ3VzdG9tRXZlbnQoTWVzc2FnZUNlbnRlckV2ZW50LCB7IGRldGFpbDogeyBkYXRhLCBrZXkgfSB9KTtcbmNvbnN0IG5vb3AgPSAoKSA9PiB7IH07XG4vKipcbiAqIFNlbmQgYW5kIHJlY2VpdmUgbWVzc2FnZXMgaW4gZGlmZmVyZW50IGNvbnRleHRzLlxuICovXG5leHBvcnQgY2xhc3MgTWVzc2FnZUNlbnRlciB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIGluc3RhbmNlS2V5IC0gVXNlIHRoaXMgaW5zdGFuY2VLZXkgdG8gZGlzdGluZ3Vpc2ggeW91ciBtZXNzYWdlcyBhbmQgb3RoZXJzLlxuICAgICAqIFRoaXMgb3B0aW9uIGNhbm5vdCBtYWtlIHlvdXIgbWVzc2FnZSBzYWZlIVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGluc3RhbmNlS2V5ID0gJycpIHtcbiAgICAgICAgdGhpcy5pbnN0YW5jZUtleSA9IGluc3RhbmNlS2V5O1xuICAgICAgICB0aGlzLmV2ZW50RW1pdHRlciA9IG5ldyBtaXR0KCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSAocmVxdWVzdCkgPT4ge1xuICAgICAgICAgICAgbGV0IHsga2V5LCBkYXRhLCBpbnN0YW5jZUtleSB9ID0gcmVxdWVzdC5kZXRhaWwgfHwgcmVxdWVzdDtcbiAgICAgICAgICAgIC8vIE1lc3NhZ2UgaXMgbm90IGZvciB1c1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5zdGFuY2VLZXkgIT09IChpbnN0YW5jZUtleSB8fCAnJykpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMud3JpdGVUb0NvbnNvbGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgJWNSZWNlaXZlJWMgJWMke2tleS50b1N0cmluZygpfWAsICdiYWNrZ3JvdW5kOiByZ2JhKDAsIDI1NSwgMjU1LCAwLjYpOyBjb2xvcjogYmxhY2s7IHBhZGRpbmc6IDBweCA2cHg7IGJvcmRlci1yYWRpdXM6IDRweDsnLCAnJywgJ3RleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lJywgZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmV2ZW50RW1pdHRlci5lbWl0KGtleSwgZGF0YSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc2VuZCA9IHRoaXMuZW1pdDtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNob3VsZCBNZXNzYWdlQ2VudGVyIHByaW50cyBhbGwgbWVzc2FnZXMgdG8gY29uc29sZT9cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMud3JpdGVUb0NvbnNvbGUgPSBmYWxzZTtcbiAgICAgICAgaWYgKHR5cGVvZiBicm93c2VyICE9PSAndW5kZWZpbmVkJyAmJiBicm93c2VyLnJ1bnRpbWUgJiYgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhIG1lc3NhZ2UgaXMgc2VudCBmcm9tIGVpdGhlciBhbiBleHRlbnNpb24gcHJvY2VzcyAoYnkgcnVudGltZS5zZW5kTWVzc2FnZSlcbiAgICAgICAgICAgIC8vIG9yIGEgY29udGVudCBzY3JpcHQgKGJ5IHRhYnMuc2VuZE1lc3NhZ2UpLlxuICAgICAgICAgICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcih0aGlzLmxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKE1lc3NhZ2VDZW50ZXJFdmVudCwgdGhpcy5saXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogTGlzdGVuIHRvIGFuIGV2ZW50XG4gICAgICogQHBhcmFtIGV2ZW50IC0gTmFtZSBvZiB0aGUgZXZlbnRcbiAgICAgKiBAcGFyYW0gaGFuZGxlciAtIEhhbmRsZXIgb2YgdGhlIGV2ZW50XG4gICAgICovXG4gICAgb24oZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgdGhpcy5ldmVudEVtaXR0ZXIub24oZXZlbnQsIGhhbmRsZXIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kIG1lc3NhZ2UgdG8gbG9jYWwgb3Igb3RoZXIgaW5zdGFuY2Ugb2YgZXh0ZW5zaW9uXG4gICAgICogQHBhcmFtIGtleSAtIEtleSBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBkYXRhIC0gRGF0YSBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBhbHNvU2VuZFRvRG9jdW1lbnQgLSAhIFNlbmQgbWVzc2FnZSB0byBkb2N1bWVudC4gVGhpcyBtYXkgbGVha3Mgc2VjcmV0ISBPbmx5IG9wZW4gaW4gbG9jYWxob3N0IVxuICAgICAqL1xuICAgIGVtaXQoa2V5LCBkYXRhLCBhbHNvU2VuZFRvRG9jdW1lbnQgPSBsb2NhdGlvbi5ob3N0bmFtZSA9PT0gJ2xvY2FsaG9zdCcpIHtcbiAgICAgICAgaWYgKHRoaXMud3JpdGVUb0NvbnNvbGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAlY1NlbmQlYyAlYyR7a2V5LnRvU3RyaW5nKCl9YCwgJ2JhY2tncm91bmQ6IHJnYmEoMCwgMjU1LCAyNTUsIDAuNik7IGNvbG9yOiBibGFjazsgcGFkZGluZzogMHB4IDZweDsgYm9yZGVyLXJhZGl1czogNHB4OycsICcnLCAndGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmUnLCBkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtc2cgPSB7IGRhdGEsIGtleSwgaW5zdGFuY2VLZXk6IHRoaXMuaW5zdGFuY2VLZXkgfHwgJycgfTtcbiAgICAgICAgaWYgKHR5cGVvZiBicm93c2VyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKGJyb3dzZXIucnVudGltZSAmJiBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobXNnKS5jYXRjaChub29wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChicm93c2VyLnRhYnMpIHtcbiAgICAgICAgICAgICAgICAvLyBTZW5kIG1lc3NhZ2UgdG8gQ29udGVudCBTY3JpcHRcbiAgICAgICAgICAgICAgICBicm93c2VyLnRhYnMucXVlcnkoeyBkaXNjYXJkZWQ6IGZhbHNlIH0pLnRoZW4odGFicyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdGFiIG9mIHRhYnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWIuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJvd3Nlci50YWJzLnNlbmRNZXNzYWdlKHRhYi5pZCwgbXNnKS5jYXRjaChub29wKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbHNvU2VuZFRvRG9jdW1lbnQgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KSB7XG4gICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ld01lc3NhZ2Uoa2V5LCBkYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1NZXNzYWdlQ2VudGVyLmpzLm1hcCIsIi8qKlxuICogVGhpcyBmaWxlIChBc3luY0NhbGwpIGlzIHVuZGVyIE1JVCBMaWNlbnNlXG4gKlxuICogVGhpcyBpcyBhIGxpZ2h0IGltcGxlbWVudGF0aW9uIG9mIEpTT04gUlBDIDIuMFxuICpcbiAqIGh0dHBzOi8vd3d3Lmpzb25ycGMub3JnL3NwZWNpZmljYXRpb25cbiAqL1xuaW1wb3J0IHsgTWVzc2FnZUNlbnRlciB9IGZyb20gJy4uL0V4dGVuc2lvbi9NZXNzYWdlQ2VudGVyJztcbi8qKlxuICogU2VyaWFsaXphdGlvbiBpbXBsZW1lbnRhdGlvbiB0aGF0IGRvIG5vdGhpbmdcbiAqL1xuZXhwb3J0IGNvbnN0IE5vU2VyaWFsaXphdGlvbiA9IHtcbiAgICBhc3luYyBzZXJpYWxpemF0aW9uKGZyb20pIHtcbiAgICAgICAgcmV0dXJuIGZyb207XG4gICAgfSxcbiAgICBhc3luYyBkZXNlcmlhbGl6YXRpb24oc2VyaWFsaXplZCkge1xuICAgICAgICByZXR1cm4gc2VyaWFsaXplZDtcbiAgICB9LFxufTtcbi8qKlxuICogU2VyaWFsaXphdGlvbiBpbXBsZW1lbnRhdGlvbiBieSBKU09OLnBhcnNlL3N0cmluZ2lmeVxuICpcbiAqIEBwYXJhbSByZXBsYWNlckFuZFJlY2VpdmVyIC0gUmVwbGFjZXIgb2YgSlNPTi5wYXJzZS9zdHJpbmdpZnlcbiAqL1xuZXhwb3J0IGNvbnN0IEpTT05TZXJpYWxpemF0aW9uID0gKFtyZXBsYWNlciwgcmVjZWl2ZXJdID0gW3VuZGVmaW5lZCwgdW5kZWZpbmVkXSwgc3BhY2UpID0+ICh7XG4gICAgYXN5bmMgc2VyaWFsaXphdGlvbihmcm9tKSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShmcm9tLCByZXBsYWNlciwgc3BhY2UpO1xuICAgIH0sXG4gICAgYXN5bmMgZGVzZXJpYWxpemF0aW9uKHNlcmlhbGl6ZWQpIHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2Uoc2VyaWFsaXplZCwgcmVjZWl2ZXIpO1xuICAgIH0sXG59KTtcbi8qKlxuICogQXN5bmMgY2FsbCBiZXR3ZWVuIGRpZmZlcmVudCBjb250ZXh0LlxuICpcbiAqIEByZW1hcmtzXG4gKiBBc3luYyBjYWxsIGlzIGEgaGlnaCBsZXZlbCBhYnN0cmFjdGlvbiBvZiBNZXNzYWdlQ2VudGVyLlxuICpcbiAqICMgU2hhcmVkIGNvZGVcbiAqXG4gKiAtIEhvdyB0byBzdHJpbmdpZnkvcGFyc2UgcGFyYW1ldGVycy9yZXR1cm5zIHNob3VsZCBiZSBzaGFyZWQsIGRlZmF1bHRzIHRvIE5vU2VyaWFsaXphdGlvbi5cbiAqXG4gKiAtIGBrZXlgIHNob3VsZCBiZSBzaGFyZWQuXG4gKlxuICogIyBPbmUgc2lkZVxuICpcbiAqIC0gU2hvdWxkIHByb3ZpZGUgc29tZSBmdW5jdGlvbnMgdGhlbiBleHBvcnQgaXRzIHR5cGUgKGZvciBleGFtcGxlLCBgQmFja2dyb3VuZENhbGxzYClcbiAqXG4gKiAtIGBjb25zdCBjYWxsID0gQXN5bmNDYWxsPEZvcmVncm91bmRDYWxscz4oYmFja2dyb3VuZENhbGxzKWBcbiAqXG4gKiAtIFRoZW4geW91IGNhbiBgY2FsbGAgYW55IG1ldGhvZCBvbiBgRm9yZWdyb3VuZENhbGxzYFxuICpcbiAqICMgT3RoZXIgc2lkZVxuICpcbiAqIC0gU2hvdWxkIHByb3ZpZGUgc29tZSBmdW5jdGlvbnMgdGhlbiBleHBvcnQgaXRzIHR5cGUgKGZvciBleGFtcGxlLCBgRm9yZWdyb3VuZENhbGxzYClcbiAqXG4gKiAtIGBjb25zdCBjYWxsID0gQXN5bmNDYWxsPEJhY2tncm91bmRDYWxscz4oZm9yZWdyb3VuZENhbGxzKWBcbiAqXG4gKiAtIFRoZW4geW91IGNhbiBgY2FsbGAgYW55IG1ldGhvZCBvbiBgQmFja2dyb3VuZENhbGxzYFxuICpcbiAqIE5vdGU6IFR3byBzaWRlcyBjYW4gaW1wbGVtZW50IHRoZSBzYW1lIGZ1bmN0aW9uXG4gKlxuICogQGV4YW1wbGVcbiAqIEZvciBleGFtcGxlLCBoZXJlIGlzIGEgbW9ubyByZXBvLlxuICpcbiAqIENvZGUgZm9yIFVJIHBhcnQ6XG4gKiBgYGB0c1xuICogY29uc3QgVUkgPSB7XG4gKiAgICAgIGFzeW5jIGRpYWxvZyh0ZXh0OiBzdHJpbmcpIHtcbiAqICAgICAgICAgIGFsZXJ0KHRleHQpXG4gKiAgICAgIH0sXG4gKiB9XG4gKiBleHBvcnQgdHlwZSBVSSA9IHR5cGVvZiBVSVxuICogY29uc3QgY2FsbHNDbGllbnQgPSBBc3luY0NhbGw8U2VydmVyPihVSSlcbiAqIGNhbGxzQ2xpZW50LnNlbmRNYWlsKCdoZWxsbyB3b3JsZCcsICd3aGF0JylcbiAqIGBgYFxuICpcbiAqIENvZGUgZm9yIHNlcnZlciBwYXJ0XG4gKiBgYGB0c1xuICogY29uc3QgU2VydmVyID0ge1xuICogICAgICBhc3luYyBzZW5kTWFpbCh0ZXh0OiBzdHJpbmcsIHRvOiBzdHJpbmcpIHtcbiAqICAgICAgICAgIHJldHVybiB0cnVlXG4gKiAgICAgIH1cbiAqIH1cbiAqIGV4cG9ydCB0eXBlIFNlcnZlciA9IHR5cGVvZiBTZXJ2ZXJcbiAqIGNvbnN0IGNhbGxzID0gQXN5bmNDYWxsPFVJPihTZXJ2ZXIpXG4gKiBjYWxscy5kaWFsb2coJ2hlbGxvJylcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBpbXBsZW1lbnRhdGlvbiAtIEltcGxlbWVudGF0aW9uIG9mIHRoaXMgc2lkZS5cbiAqIEBwYXJhbSBvcHRpb25zIC0gRGVmaW5lIHlvdXIgb3duIHNlcmlhbGl6ZXIsIE1lc3NhZ2VDZW50ZXIgb3Igb3RoZXIgb3B0aW9ucy5cbiAqXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBBc3luY0NhbGwoaW1wbGVtZW50YXRpb24gPSB7fSwgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgeyBzZXJpYWxpemVyLCBrZXksIHN0cmljdCwgbG9nLCBwYXJhbWV0ZXJTdHJ1Y3R1cmVzIH0gPSB7XG4gICAgICAgIHNlcmlhbGl6ZXI6IE5vU2VyaWFsaXphdGlvbixcbiAgICAgICAga2V5OiAnZGVmYXVsdC1qc29ucnBjJyxcbiAgICAgICAgc3RyaWN0OiBmYWxzZSxcbiAgICAgICAgbG9nOiB0cnVlLFxuICAgICAgICBwYXJhbWV0ZXJTdHJ1Y3R1cmVzOiAnYnktcG9zaXRpb24nLFxuICAgICAgICAuLi5vcHRpb25zLFxuICAgIH07XG4gICAgY29uc3QgbWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZUNoYW5uZWwgfHwgbmV3IE1lc3NhZ2VDZW50ZXIoKTtcbiAgICBjb25zdCB7IG1ldGhvZE5vdEZvdW5kOiBiYW5NZXRob2ROb3RGb3VuZCA9IGZhbHNlLCBub1VuZGVmaW5lZDogbm9VbmRlZmluZWRLZWVwaW5nID0gZmFsc2UsIHVua25vd25NZXNzYWdlOiBiYW5Vbmtub3duTWVzc2FnZSA9IGZhbHNlLCB9ID0gdHlwZW9mIHN0cmljdCA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgID8gc3RyaWN0XG4gICAgICAgICAgICA/IHsgbWV0aG9kTm90Rm91bmQ6IHRydWUsIHVua25vd25NZXNzYWdlOiB0cnVlLCBub1VuZGVmaW5lZDogdHJ1ZSB9XG4gICAgICAgICAgICA6IHsgbWV0aG9kTm90Rm91bmQ6IGZhbHNlLCB1bmtub3duTWVzc2FnZTogZmFsc2UsIG5vVW5kZWZpbmVkOiBmYWxzZSB9XG4gICAgICAgIDogc3RyaWN0O1xuICAgIGNvbnN0IHsgYmVDYWxsZWQ6IGxvZ0JlQ2FsbGVkID0gdHJ1ZSwgbG9jYWxFcnJvcjogbG9nTG9jYWxFcnJvciA9IHRydWUsIHJlbW90ZUVycm9yOiBsb2dSZW1vdGVFcnJvciA9IHRydWUsIHR5cGU6IGxvZ1R5cGUgPSAncHJldHR5JywgfSA9IHR5cGVvZiBsb2cgPT09ICdib29sZWFuJ1xuICAgICAgICA/IGxvZ1xuICAgICAgICAgICAgPyB7IGJlQ2FsbGVkOiB0cnVlLCBsb2NhbEVycm9yOiB0cnVlLCByZW1vdGVFcnJvcjogdHJ1ZSwgdHlwZTogJ3ByZXR0eScgfVxuICAgICAgICAgICAgOiB7IGJlQ2FsbGVkOiBmYWxzZSwgbG9jYWxFcnJvcjogZmFsc2UsIHJlbW90ZUVycm9yOiBmYWxzZSwgdHlwZTogJ2Jhc2ljJyB9XG4gICAgICAgIDogbG9nO1xuICAgIGNvbnN0IHJlcXVlc3RDb250ZXh0ID0gbmV3IE1hcCgpO1xuICAgIGFzeW5jIGZ1bmN0aW9uIG9uUmVxdWVzdChkYXRhKSB7XG4gICAgICAgIGxldCBmcmFtZXdvcmtTdGFjayA9ICcnO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gPyBXZSdyZSBub3QgaW1wbGVtZW50aW5nIGFueSBKU09OIFJQQyBleHRlbnNpb24uIFNvIGxldCBpdCB0byBiZSB1bmRlZmluZWQuXG4gICAgICAgICAgICBjb25zdCBleGVjdXRvciA9IGRhdGEubWV0aG9kLnN0YXJ0c1dpdGgoJ3JwYy4nKVxuICAgICAgICAgICAgICAgID8gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgOiBpbXBsZW1lbnRhdGlvbltkYXRhLm1ldGhvZF07XG4gICAgICAgICAgICBpZiAoIWV4ZWN1dG9yKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFiYW5NZXRob2ROb3RGb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobG9nTG9jYWxFcnJvcilcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY2VpdmUgcmVtb3RlIGNhbGwsIGJ1dCBub3QgaW1wbGVtZW50ZWQuJywga2V5LCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBFcnJvclJlc3BvbnNlLk1ldGhvZE5vdEZvdW5kKGRhdGEuaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gZGF0YS5wYXJhbXM7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYXJhbXMpIHx8ICh0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0JyAmJiBwYXJhbXMgIT09IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJncyA9IEFycmF5LmlzQXJyYXkocGFyYW1zKSA/IHBhcmFtcyA6IFtwYXJhbXNdO1xuICAgICAgICAgICAgICAgIGZyYW1ld29ya1N0YWNrID0gcmVtb3ZlU3RhY2tIZWFkZXIobmV3IEVycm9yKCkuc3RhY2spO1xuICAgICAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSBleGVjdXRvciguLi5hcmdzKTtcbiAgICAgICAgICAgICAgICBpZiAobG9nQmVDYWxsZWQpXG4gICAgICAgICAgICAgICAgICAgIGxvZ1R5cGUgPT09ICdiYXNpYydcbiAgICAgICAgICAgICAgICAgICAgICAgID8gY29uc29sZS5sb2coYCR7a2V5fS4ke2RhdGEubWV0aG9kfSgke1suLi5hcmdzXS50b1N0cmluZygpfSkgQCR7ZGF0YS5pZH1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBjb25zb2xlLmxvZyhgJHtrZXl9LiVjJHtkYXRhLm1ldGhvZH0lYygke2FyZ3MubWFwKCgpID0+ICclbycpLmpvaW4oJywgJyl9JWMpXFxuJW8gJWNAJHtkYXRhLmlkfWAsICdjb2xvcjogI2QyYzA1NycsICcnLCAuLi5hcmdzLCAnJywgcHJvbWlzZSwgJ2NvbG9yOiBncmF5OyBmb250LXN0eWxlOiBpdGFsaWM7Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdWNjZXNzUmVzcG9uc2UoZGF0YS5pZCwgYXdhaXQgcHJvbWlzZSwgISFub1VuZGVmaW5lZEtlZXBpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEVycm9yUmVzcG9uc2UuSW52YWxpZFJlcXVlc3QoZGF0YS5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGUuc3RhY2sgPSBmcmFtZXdvcmtTdGFja1xuICAgICAgICAgICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgICAgICAgICAucmVkdWNlKChzdGFjaywgZnN0YWNrKSA9PiBzdGFjay5yZXBsYWNlKGZzdGFjayArICdcXG4nLCAnJyksIGUuc3RhY2sgfHwgJycpO1xuICAgICAgICAgICAgaWYgKGxvZ0xvY2FsRXJyb3IpXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIGxldCBuYW1lID0gJ0Vycm9yJztcbiAgICAgICAgICAgIG5hbWUgPSBlLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgICAgICAgICBpZiAodHlwZW9mIERPTUV4Y2VwdGlvbiA9PT0gJ2Z1bmN0aW9uJyAmJiBlIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uKVxuICAgICAgICAgICAgICAgIG5hbWUgPSAnRE9NRXhjZXB0aW9uOicgKyBlLm5hbWU7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yUmVzcG9uc2UoZGF0YS5pZCwgLTEsIGUubWVzc2FnZSwgZS5zdGFjaywgbmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgZnVuY3Rpb24gb25SZXNwb25zZShkYXRhKSB7XG4gICAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSAnJywgcmVtb3RlRXJyb3JTdGFjayA9ICcnLCBlcnJvckNvZGUgPSAwLCBlcnJvclR5cGUgPSAnRXJyb3InO1xuICAgICAgICBpZiAoaGFzS2V5KGRhdGEsICdlcnJvcicpKSB7XG4gICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBkYXRhLmVycm9yLm1lc3NhZ2U7XG4gICAgICAgICAgICBlcnJvckNvZGUgPSBkYXRhLmVycm9yLmNvZGU7XG4gICAgICAgICAgICByZW1vdGVFcnJvclN0YWNrID0gKGRhdGEuZXJyb3IuZGF0YSAmJiBkYXRhLmVycm9yLmRhdGEuc3RhY2spIHx8ICc8cmVtb3RlIHN0YWNrIG5vdCBhdmFpbGFibGU+JztcbiAgICAgICAgICAgIGVycm9yVHlwZSA9IChkYXRhLmVycm9yLmRhdGEgJiYgZGF0YS5lcnJvci5kYXRhLnR5cGUpIHx8ICdFcnJvcic7XG4gICAgICAgICAgICBpZiAobG9nUmVtb3RlRXJyb3IpXG4gICAgICAgICAgICAgICAgbG9nVHlwZSA9PT0gJ2Jhc2ljJ1xuICAgICAgICAgICAgICAgICAgICA/IGNvbnNvbGUuZXJyb3IoYCR7ZXJyb3JUeXBlfTogJHtlcnJvck1lc3NhZ2V9KCR7ZXJyb3JDb2RlfSkgQCR7ZGF0YS5pZH1cXG4ke3JlbW90ZUVycm9yU3RhY2t9YClcbiAgICAgICAgICAgICAgICAgICAgOiBjb25zb2xlLmVycm9yKGAke2Vycm9yVHlwZX06ICR7ZXJyb3JNZXNzYWdlfSgke2Vycm9yQ29kZX0pICVjQCR7ZGF0YS5pZH1cXG4lYyR7cmVtb3RlRXJyb3JTdGFja31gLCAnY29sb3I6IGdyYXknLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEuaWQgPT09IG51bGwgfHwgZGF0YS5pZCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCB7IGY6IFtyZXNvbHZlLCByZWplY3RdLCBzdGFjazogbG9jYWxFcnJvclN0YWNrLCB9ID0gcmVxdWVzdENvbnRleHQuZ2V0KGRhdGEuaWQpIHx8IHsgc3RhY2s6ICcnLCBmOiBbbnVsbCwgbnVsbF0gfTtcbiAgICAgICAgaWYgKCFyZXNvbHZlKVxuICAgICAgICAgICAgcmV0dXJuOyAvLyBkcm9wIHRoaXMgcmVzcG9uc2VcbiAgICAgICAgcmVxdWVzdENvbnRleHQuZGVsZXRlKGRhdGEuaWQpO1xuICAgICAgICBpZiAoaGFzS2V5KGRhdGEsICdlcnJvcicpKSB7XG4gICAgICAgICAgICByZWplY3QoUmVjb3ZlckVycm9yKGVycm9yVHlwZSwgZXJyb3JNZXNzYWdlLCBlcnJvckNvZGUsIFxuICAgICAgICAgICAgLy8gPyBXZSB1c2UgXFx1MDQzMCB3aGljaCBsb29rcyBsaWtlIFwiYVwiIHRvIHByZXZlbnQgYnJvd3NlciB0aGluayBcImF0IEFzeW5jQ2FsbFwiIGlzIGEgcmVhbCBzdGFja1xuICAgICAgICAgICAgcmVtb3RlRXJyb3JTdGFjayArICdcXG4gICAgXFx1MDQzMHQgQXN5bmNDYWxsIChycGMpIFxcbicgKyBsb2NhbEVycm9yU3RhY2spKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc29sdmUoZGF0YS5yZXN1bHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG1lc3NhZ2Uub24oa2V5LCBhc3luYyAoXykgPT4ge1xuICAgICAgICBsZXQgZGF0YTtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRhdGEgPSBhd2FpdCBzZXJpYWxpemVyLmRlc2VyaWFsaXphdGlvbihfKTtcbiAgICAgICAgICAgIGlmIChpc0pTT05SUENPYmplY3QoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoYW5kbGVTaW5nbGVNZXNzYWdlKGRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNlbmQocmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkgJiYgZGF0YS5ldmVyeShpc0pTT05SUENPYmplY3QpICYmIGRhdGEubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5hbGwoZGF0YS5tYXAoaGFuZGxlU2luZ2xlTWVzc2FnZSkpO1xuICAgICAgICAgICAgICAgIC8vID8gUmVzcG9uc2VcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5ldmVyeSh4ID0+IHggPT09IHVuZGVmaW5lZCkpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZW5kKHJlc3VsdC5maWx0ZXIoeCA9PiB4KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoYmFuVW5rbm93bk1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2VuZChFcnJvclJlc3BvbnNlLkludmFsaWRSZXF1ZXN0KGRhdGEuaWQgfHwgbnVsbCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gPyBJZ25vcmUgdGhpcyBtZXNzYWdlLiBUaGUgbWVzc2FnZSBjaGFubmVsIG1heWJlIGFsc28gdXNlZCB0byB0cmFuc2ZlciBvdGhlciBtZXNzYWdlIHRvby5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSwgZGF0YSwgcmVzdWx0KTtcbiAgICAgICAgICAgIHNlbmQoRXJyb3JSZXNwb25zZS5QYXJzZUVycm9yKGUuc3RhY2spKTtcbiAgICAgICAgfVxuICAgICAgICBhc3luYyBmdW5jdGlvbiBzZW5kKHJlcykge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcGx5ID0gcmVzLm1hcCh4ID0+IHgpLmZpbHRlcih4ID0+IHguaWQgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcGx5Lmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UuZW1pdChrZXksIGF3YWl0IHNlcmlhbGl6ZXIuc2VyaWFsaXphdGlvbihyZXBseSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXMpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAvLyA/IFRoaXMgaXMgYSBOb3RpZmljYXRpb24sIHdlIE1VU1Qgbm90IHJldHVybiBpdC5cbiAgICAgICAgICAgICAgICBpZiAocmVzLmlkID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBtZXNzYWdlLmVtaXQoa2V5LCBhd2FpdCBzZXJpYWxpemVyLnNlcmlhbGl6YXRpb24ocmVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFByb3h5KHt9LCB7XG4gICAgICAgIGdldCh0YXJnZXQsIG1ldGhvZCwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICAgIGxldCBzdGFjayA9IHJlbW92ZVN0YWNrSGVhZGVyKG5ldyBFcnJvcigpLnN0YWNrKTtcbiAgICAgICAgICAgIHJldHVybiAoLi4ucGFyYW1zKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgIT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KCdPbmx5IHN0cmluZyBjYW4gYmUga2V5cycpO1xuICAgICAgICAgICAgICAgIGlmIChtZXRob2Quc3RhcnRzV2l0aCgncnBjLicpKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KCdZb3UgY2Fubm90IGNhbGwgSlNPTiBSUEMgaW50ZXJuYWwgbWV0aG9kcyBkaXJlY3RseScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gTWF0aC5yYW5kb20oKVxuICAgICAgICAgICAgICAgICAgICAudG9TdHJpbmcoMzYpXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgyKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXEgPSBwYXJhbWV0ZXJTdHJ1Y3R1cmVzID09PSAnYnktbmFtZScgJiYgcGFyYW1zLmxlbmd0aCA9PT0gMSAmJiBpc09iamVjdChwYXJhbXNbMF0pXG4gICAgICAgICAgICAgICAgICAgID8gbmV3IFJlcXVlc3QoaWQsIG1ldGhvZCwgcGFyYW1zWzBdKVxuICAgICAgICAgICAgICAgICAgICA6IG5ldyBSZXF1ZXN0KGlkLCBtZXRob2QsIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgc2VyaWFsaXplci5zZXJpYWxpemF0aW9uKHJlcSkudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5lbWl0KGtleSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RDb250ZXh0LnNldChpZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZjogW3Jlc29sdmUsIHJlamVjdF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjayxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0pO1xuICAgIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVNpbmdsZU1lc3NhZ2UoZGF0YSkge1xuICAgICAgICBpZiAoaGFzS2V5KGRhdGEsICdtZXRob2QnKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9uUmVxdWVzdChkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgnZXJyb3InIGluIGRhdGEgfHwgJ3Jlc3VsdCcgaW4gZGF0YSkge1xuICAgICAgICAgICAgb25SZXNwb25zZShkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICgncmVzdWx0SXNVbmRlZmluZWQnIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgZGF0YS5yZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgb25SZXNwb25zZShkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gRXJyb3JSZXNwb25zZS5JbnZhbGlkUmVxdWVzdChkYXRhLmlkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbn1cbmNvbnN0IGpzb25ycGMgPSAnMi4wJztcbmNsYXNzIFJlcXVlc3Qge1xuICAgIGNvbnN0cnVjdG9yKGlkLCBtZXRob2QsIHBhcmFtcykge1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMubWV0aG9kID0gbWV0aG9kO1xuICAgICAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcztcbiAgICAgICAgdGhpcy5qc29ucnBjID0gJzIuMCc7XG4gICAgICAgIHJldHVybiB7IGlkLCBtZXRob2QsIHBhcmFtcywganNvbnJwYyB9O1xuICAgIH1cbn1cbmNsYXNzIFN1Y2Nlc3NSZXNwb25zZSB7XG4gICAgY29uc3RydWN0b3IoaWQsIHJlc3VsdCwgbm9VbmRlZmluZWRLZWVwaW5nKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5yZXN1bHQgPSByZXN1bHQ7XG4gICAgICAgIHRoaXMuanNvbnJwYyA9ICcyLjAnO1xuICAgICAgICBjb25zdCBvYmogPSB7IGlkLCBqc29ucnBjLCByZXN1bHQ6IHJlc3VsdCB8fCBudWxsIH07XG4gICAgICAgIGlmICghbm9VbmRlZmluZWRLZWVwaW5nICYmIHJlc3VsdCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgb2JqLnJlc3VsdElzVW5kZWZpbmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG59XG5jbGFzcyBFcnJvclJlc3BvbnNlIHtcbiAgICBjb25zdHJ1Y3RvcihpZCwgY29kZSwgbWVzc2FnZSwgc3RhY2ssIHR5cGUgPSAnRXJyb3InKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5qc29ucnBjID0gJzIuMCc7XG4gICAgICAgIGlmIChpZCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgaWQgPSBudWxsO1xuICAgICAgICBjb2RlID0gTWF0aC5mbG9vcihjb2RlKTtcbiAgICAgICAgY29uc3QgZXJyb3IgPSAodGhpcy5lcnJvciA9IHsgY29kZSwgbWVzc2FnZSwgZGF0YTogeyBzdGFjaywgdHlwZSB9IH0pO1xuICAgICAgICByZXR1cm4geyBlcnJvciwgaWQsIGpzb25ycGMgfTtcbiAgICB9XG59XG4vLyBQcmUgZGVmaW5lZCBlcnJvciBpbiBzZWN0aW9uIDUuMVxuRXJyb3JSZXNwb25zZS5QYXJzZUVycm9yID0gKHN0YWNrID0gJycpID0+IG5ldyBFcnJvclJlc3BvbnNlKG51bGwsIC0zMjcwMCwgJ1BhcnNlIGVycm9yJywgc3RhY2spO1xuRXJyb3JSZXNwb25zZS5JbnZhbGlkUmVxdWVzdCA9IChpZCkgPT4gbmV3IEVycm9yUmVzcG9uc2UoaWQsIC0zMjYwMCwgJ0ludmFsaWQgUmVxdWVzdCcsICcnKTtcbkVycm9yUmVzcG9uc2UuTWV0aG9kTm90Rm91bmQgPSAoaWQpID0+IG5ldyBFcnJvclJlc3BvbnNlKGlkLCAtMzI2MDEsICdNZXRob2Qgbm90IGZvdW5kJywgJycpO1xuRXJyb3JSZXNwb25zZS5JbnZhbGlkUGFyYW1zID0gKGlkKSA9PiBuZXcgRXJyb3JSZXNwb25zZShpZCwgLTMyNjAyLCAnSW52YWxpZCBwYXJhbXMnLCAnJyk7XG5FcnJvclJlc3BvbnNlLkludGVybmFsRXJyb3IgPSAoaWQsIG1lc3NhZ2UgPSAnJykgPT4gbmV3IEVycm9yUmVzcG9uc2UoaWQsIC0zMjYwMywgJ0ludGVybmFsIGVycm9yJyArIG1lc3NhZ2UsICcnKTtcbmZ1bmN0aW9uIGlzSlNPTlJQQ09iamVjdChkYXRhKSB7XG4gICAgaWYgKCFpc09iamVjdChkYXRhKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghaGFzS2V5KGRhdGEsICdqc29ucnBjJykpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAoZGF0YS5qc29ucnBjICE9PSAnMi4wJylcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChoYXNLZXkoZGF0YSwgJ3BhcmFtcycpKSB7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IGRhdGEucGFyYW1zO1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocGFyYW1zKSAmJiAhaXNPYmplY3QocGFyYW1zKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBpc09iamVjdChwYXJhbXMpIHtcbiAgICByZXR1cm4gdHlwZW9mIHBhcmFtcyA9PT0gJ29iamVjdCcgJiYgcGFyYW1zICE9PSBudWxsO1xufVxuZnVuY3Rpb24gaGFzS2V5KG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGtleSBpbiBvYmo7XG59XG5jbGFzcyBDdXN0b21FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3RvcihuYW1lLCBtZXNzYWdlLCBjb2RlLCBzdGFjaykge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICAgICAgdGhpcy5zdGFjayA9IHN0YWNrO1xuICAgIH1cbn1cbi8qKiBUaGVzZSBFcnJvciBpcyBkZWZpbmVkIGluIEVDTUFTY3JpcHQgc3BlYyAqL1xuY29uc3QgZXJyb3JzID0ge1xuICAgIEVycm9yLFxuICAgIEV2YWxFcnJvcixcbiAgICBSYW5nZUVycm9yLFxuICAgIFJlZmVyZW5jZUVycm9yLFxuICAgIFN5bnRheEVycm9yLFxuICAgIFR5cGVFcnJvcixcbiAgICBVUklFcnJvcixcbn07XG4vKipcbiAqIEFzeW5jQ2FsbCBzdXBwb3J0IHNvbWVob3cgdHJhbnNmZXIgRUNNQVNjcmlwdCBFcnJvclxuICovXG5mdW5jdGlvbiBSZWNvdmVyRXJyb3IodHlwZSwgbWVzc2FnZSwgY29kZSwgc3RhY2spIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZS5zdGFydHNXaXRoKCdET01FeGNlcHRpb246JykpIHtcbiAgICAgICAgICAgIGNvbnN0IFtfLCBuYW1lXSA9IHR5cGUuc3BsaXQoJ0RPTUV4Y2VwdGlvbjonKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRE9NRXhjZXB0aW9uKG1lc3NhZ2UsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGUgaW4gZXJyb3JzKSB7XG4gICAgICAgICAgICBjb25zdCBlID0gbmV3IGVycm9yc1t0eXBlXShtZXNzYWdlKTtcbiAgICAgICAgICAgIGUuc3RhY2sgPSBzdGFjaztcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZSwgeyBjb2RlIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEN1c3RvbUVycm9yKHR5cGUsIG1lc3NhZ2UsIGNvZGUsIHN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBFcnJvcihgRSR7Y29kZX0gJHt0eXBlfTogJHttZXNzYWdlfVxcbiR7c3RhY2t9YCk7XG4gICAgfVxufVxuZnVuY3Rpb24gcmVtb3ZlU3RhY2tIZWFkZXIoc3RhY2sgPSAnJykge1xuICAgIHJldHVybiBzdGFjay5yZXBsYWNlKC9eLitcXG4uK1xcbi8sICcnKTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUFzeW5jQ2FsbC5qcy5tYXAiLCJpbXBvcnQgeyBUaGlzU2lkZUltcGxlbWVudGF0aW9uIH0gZnJvbSAnLi4vUlBDJ1xudHlwZSBXZWJFeHRlbnNpb25JRCA9IHN0cmluZ1xudHlwZSBNZXNzYWdlSUQgPSBzdHJpbmdcbnR5cGUgd2ViTmF2aWdhdGlvbk9uQ29tbWl0dGVkQXJncyA9IFBhcmFtZXRlcnM8VGhpc1NpZGVJbXBsZW1lbnRhdGlvblsnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJ10+XG50eXBlIG9uTWVzc2FnZUFyZ3MgPSBQYXJhbWV0ZXJzPFRoaXNTaWRlSW1wbGVtZW50YXRpb25bJ29uTWVzc2FnZSddPlxudHlwZSBQb29sS2V5cyA9ICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnIHwgJ2Jyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UnXG4vKipcbiAqIFVzZWQgZm9yIGtlZXAgcmVmZXJlbmNlIHRvIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2VcbiAqL1xuZXhwb3J0IGNvbnN0IFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIgPSBuZXcgTWFwPE1lc3NhZ2VJRCwgWyh2YWw6IGFueSkgPT4gYW55LCAodmFsOiBhbnkpID0+IGFueV0+KClcbi8qKlxuICogVG8gc3RvcmUgbGlzdGVuZXIgZm9yIEhvc3QgZGlzcGF0Y2hlZCBldmVudHMuXG4gKi9cbmV4cG9ydCBjb25zdCBFdmVudFBvb2xzOiBSZWNvcmQ8UG9vbEtleXMsIE1hcDxXZWJFeHRlbnNpb25JRCwgU2V0PCguLi5hcmdzOiBhbnlbXSkgPT4gYW55Pj4+ID0ge1xuICAgICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnOiBuZXcgTWFwKCksXG4gICAgJ2Jyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UnOiBuZXcgTWFwKCksXG59XG4vKipcbiAqIERpc3BhdGNoIGEgbm9ybWFsIGV2ZW50ICh0aGF0IG5vdCBoYXZlIGEgXCJyZXNwb25zZVwiKS5cbiAqIExpa2UgYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkaXNwYXRjaE5vcm1hbEV2ZW50KGV2ZW50OiBQb29sS2V5cywgdG9FeHRlbnNpb25JRDogc3RyaW5nIHwgc3RyaW5nW10gfCAnKicsIC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgaWYgKCFFdmVudFBvb2xzW2V2ZW50XSkgcmV0dXJuXG4gICAgZm9yIChjb25zdCBbZXh0ZW5zaW9uSUQsIGZuc10gb2YgRXZlbnRQb29sc1tldmVudF0uZW50cmllcygpKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRvRXh0ZW5zaW9uSUQpICYmIHRvRXh0ZW5zaW9uSUQuaW5kZXhPZihleHRlbnNpb25JRCkgPT09IC0xKSBjb250aW51ZVxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodG9FeHRlbnNpb25JRCkgJiYgdG9FeHRlbnNpb25JRCAhPT0gZXh0ZW5zaW9uSUQgJiYgdG9FeHRlbnNpb25JRCAhPT0gJyonKSBjb250aW51ZVxuICAgICAgICBmb3IgKGNvbnN0IGYgb2YgZm5zKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGYoLi4uYXJncylcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4vKipcbiAqIENyZWF0ZSBhIGBFdmVudE9iamVjdDxMaXN0ZW5lclR5cGU+YCBvYmplY3QuXG4gKlxuICogQ2FuIGJlIHNldCBvbiBicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQgZXRjLi4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFdmVudExpc3RlbmVyKGV4dGVuc2lvbklEOiBzdHJpbmcsIGV2ZW50OiBQb29sS2V5cykge1xuICAgIGlmICghRXZlbnRQb29sc1tldmVudF0uaGFzKGV4dGVuc2lvbklEKSkge1xuICAgICAgICBFdmVudFBvb2xzW2V2ZW50XS5zZXQoZXh0ZW5zaW9uSUQsIG5ldyBTZXQoKSlcbiAgICB9XG4gICAgY29uc3QgcG9vbCA9IEV2ZW50UG9vbHNbZXZlbnRdLmdldChleHRlbnNpb25JRCkhXG4gICAgY29uc3QgaGFuZGxlcjogRXZlbnRPYmplY3Q8KC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+ID0ge1xuICAgICAgICBhZGRMaXN0ZW5lcihjYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykgdGhyb3cgbmV3IFR5cGVFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBmdW5jdGlvbicpXG4gICAgICAgICAgICBwb29sLmFkZChjYWxsYmFjaylcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHBvb2wuZGVsZXRlKGNhbGxiYWNrKVxuICAgICAgICB9LFxuICAgICAgICBoYXNMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgICAgICAgICAgcmV0dXJuIHBvb2wuaGFzKGxpc3RlbmVyKVxuICAgICAgICB9LFxuICAgIH1cbiAgICByZXR1cm4gaGFuZGxlclxufVxuXG5pbnRlcmZhY2UgRXZlbnRPYmplY3Q8VCBleHRlbmRzICguLi5hcmdzOiBhbnlbXSkgPT4gYW55PiB7XG4gICAgYWRkTGlzdGVuZXI6IChjYWxsYmFjazogVCkgPT4gdm9pZFxuICAgIHJlbW92ZUxpc3RlbmVyOiAobGlzdGVuZXI6IFQpID0+IHZvaWRcbiAgICBoYXNMaXN0ZW5lcjogKGxpc3RlbmVyOiBUKSA9PiBib29sZWFuXG59XG4iLCJleHBvcnQgZnVuY3Rpb24gZGVlcENsb25lPFQ+KG9iajogVCk6IFQge1xuICAgIC8vIHRvZG86IGNoYW5nZSBhbm90aGVyIGltcGwgcGx6LlxuICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpXG59XG4iLCJpbXBvcnQgeyBIb3N0LCBUaGlzU2lkZUltcGxlbWVudGF0aW9uIH0gZnJvbSAnLi4vUlBDJ1xuXG5pbXBvcnQgeyBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLCBFdmVudFBvb2xzIH0gZnJvbSAnLi4vdXRpbHMvTG9jYWxNZXNzYWdlcydcbmltcG9ydCB7IGRlZXBDbG9uZSB9IGZyb20gJy4uL3V0aWxzL2RlZXBDbG9uZSdcbi8qKlxuICogQ3JlYXRlIGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZSgpIGZ1bmN0aW9uXG4gKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJ1bnRpbWVTZW5kTWVzc2FnZShleHRlbnNpb25JRDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgdG9FeHRlbnNpb25JRDogc3RyaW5nLCBtZXNzYWdlOiB1bmtub3duXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB0b0V4dGVuc2lvbklEID0gZXh0ZW5zaW9uSURcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBhcmd1bWVudHNbMF1cbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICB0b0V4dGVuc2lvbklEID0gYXJndW1lbnRzWzBdXG4gICAgICAgICAgICBtZXNzYWdlID0gYXJndW1lbnRzWzFdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b0V4dGVuc2lvbklEID0gJydcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VuZE1lc3NhZ2VXaXRoUmVzcG9uc2UoZXh0ZW5zaW9uSUQsIHRvRXh0ZW5zaW9uSUQsIG51bGwsIG1lc3NhZ2UpXG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIHNlbmRNZXNzYWdlV2l0aFJlc3BvbnNlPFU+KFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgdG9FeHRlbnNpb25JRDogc3RyaW5nLFxuICAgIHRhYklkOiBudW1iZXIgfCBudWxsLFxuICAgIG1lc3NhZ2U6IHVua25vd24sXG4pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8VT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBtZXNzYWdlSUQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKClcbiAgICAgICAgSG9zdC5zZW5kTWVzc2FnZShleHRlbnNpb25JRCwgdG9FeHRlbnNpb25JRCwgdGFiSWQsIG1lc3NhZ2VJRCwge1xuICAgICAgICAgICAgdHlwZTogJ21lc3NhZ2UnLFxuICAgICAgICAgICAgZGF0YTogbWVzc2FnZSxcbiAgICAgICAgICAgIHJlc3BvbnNlOiBmYWxzZSxcbiAgICAgICAgfSkuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICByZWplY3QoZSlcbiAgICAgICAgICAgIFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIuZGVsZXRlKG1lc3NhZ2VJRClcbiAgICAgICAgfSlcbiAgICAgICAgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5zZXQobWVzc2FnZUlELCBbcmVzb2x2ZSwgcmVqZWN0XSlcbiAgICB9KVxufVxuXG4vKipcbiAqIE1lc3NhZ2UgaGFuZGxlciBvZiBub3JtYWwgbWVzc2FnZVxuICovXG5leHBvcnQgZnVuY3Rpb24gb25Ob3JtYWxNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IGFueSxcbiAgICBzZW5kZXI6IGJyb3dzZXIucnVudGltZS5NZXNzYWdlU2VuZGVyLFxuICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgIG1lc3NhZ2VJRDogc3RyaW5nLFxuKSB7XG4gICAgY29uc3QgZm5zOiBTZXQ8YnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZUV2ZW50PiB8IHVuZGVmaW5lZCA9IEV2ZW50UG9vbHNbJ2Jyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UnXS5nZXQoXG4gICAgICAgIHRvRXh0ZW5zaW9uSUQsXG4gICAgKVxuICAgIGlmICghZm5zKSByZXR1cm5cbiAgICBsZXQgcmVzcG9uc2VTZW5kID0gZmFsc2VcbiAgICBmb3IgKGNvbnN0IGZuIG9mIGZucykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gPyBkaXNwYXRjaCBtZXNzYWdlXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBmbihkZWVwQ2xvbmUobWVzc2FnZSksIGRlZXBDbG9uZShzZW5kZXIpLCBzZW5kUmVzcG9uc2VEZXByZWNhdGVkKVxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgLy8gPyBkbyBub3RoaW5nXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgICAgIC8vICEgZGVwcmVjYXRlZCBwYXRoICFcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHJlc3VsdC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgLy8gPyByZXNwb25zZSB0aGUgYW5zd2VyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oKGRhdGE6IHVua25vd24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgPT09IHVuZGVmaW5lZCB8fCByZXNwb25zZVNlbmQpIHJldHVyblxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIEhvc3Quc2VuZE1lc3NhZ2UodG9FeHRlbnNpb25JRCwgZXh0ZW5zaW9uSUQsIHNlbmRlci50YWIhLmlkISwgbWVzc2FnZUlELCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbWVzc2FnZScsXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IHR5cGUgSW50ZXJuYWxNZXNzYWdlID1cbiAgICB8IHtcbiAgICAgICAgICBkYXRhOiBhbnlcbiAgICAgICAgICBlcnJvcj86IHsgbWVzc2FnZTogc3RyaW5nOyBzdGFjazogc3RyaW5nIH1cbiAgICAgICAgICByZXNwb25zZTogYm9vbGVhblxuICAgICAgICAgIHR5cGU6ICdtZXNzYWdlJ1xuICAgICAgfVxuICAgIHwge1xuICAgICAgICAgIHR5cGU6ICdleGVjdXRlU2NyaXB0J1xuICAgICAgfSAmIFBhcmFtZXRlcnM8VGhpc1NpZGVJbXBsZW1lbnRhdGlvblsnYnJvd3Nlci50YWJzLmV4ZWN1dGVTY3JpcHQnXT5bMl1cblxuZnVuY3Rpb24gc2VuZFJlc3BvbnNlRGVwcmVjYXRlZCgpOiBhbnkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ1JldHVybmluZyBhIFByb21pc2UgaXMgdGhlIHByZWZlcnJlZCB3YXknICtcbiAgICAgICAgICAgICcgdG8gc2VuZCBhIHJlcGx5IGZyb20gYW4gb25NZXNzYWdlL29uTWVzc2FnZUV4dGVybmFsIGxpc3RlbmVyLCAnICtcbiAgICAgICAgICAgICdhcyB0aGUgc2VuZFJlc3BvbnNlIHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBzcGVjcyAnICtcbiAgICAgICAgICAgICcoU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RvY3MvTW96aWxsYS9BZGQtb25zL1dlYkV4dGVuc2lvbnMvQVBJL3J1bnRpbWUvb25NZXNzYWdlKScsXG4gICAgKVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL25vZGVfbW9kdWxlcy93ZWItZXh0LXR5cGVzL2dsb2JhbC9pbmRleC5kLnRzXCIgLz5cbmltcG9ydCB7IEFzeW5jQ2FsbCB9IGZyb20gJ0Bob2xvZmxvd3Mva2l0L2VzJ1xuaW1wb3J0IHsgZGlzcGF0Y2hOb3JtYWxFdmVudCwgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlciB9IGZyb20gJy4vdXRpbHMvTG9jYWxNZXNzYWdlcydcbmltcG9ydCB7IEludGVybmFsTWVzc2FnZSwgb25Ob3JtYWxNZXNzYWdlIH0gZnJvbSAnLi9zaGltcy9icm93c2VyLm1lc3NhZ2UnXG5pbXBvcnQgeyByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uLCBsb2FkQ29udGVudFNjcmlwdCB9IGZyb20gJy4vRXh0ZW5zaW9ucydcblxuLyoqIERlZmluZSBCbG9iIHR5cGUgaW4gY29tbXVuaWNhdGUgd2l0aCByZW1vdGUgKi9cbmV4cG9ydCB0eXBlIFN0cmluZ09yQmxvYiA9XG4gICAgfCB7XG4gICAgICAgICAgdHlwZTogJ3RleHQnXG4gICAgICAgICAgY29udGVudDogc3RyaW5nXG4gICAgICB9XG4gICAgfCB7XG4gICAgICAgICAgdHlwZTogJ2FycmF5IGJ1ZmZlcidcbiAgICAgICAgICBjb250ZW50OiBzdHJpbmdcbiAgICAgIH1cbiAgICB8IHtcbiAgICAgICAgICB0eXBlOiAnYmxvYidcbiAgICAgICAgICBjb250ZW50OiBzdHJpbmdcbiAgICAgICAgICBtaW1lVHlwZTogc3RyaW5nXG4gICAgICB9XG4vKipcbiAqIFRoaXMgZGVzY3JpYmVzIHdoYXQgSlNPTlJQQyBjYWxscyB0aGF0IE5hdGl2ZSBzaWRlIHNob3VsZCBpbXBsZW1lbnRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBIb3N0IHtcbiAgICAvLyNyZWdpb24gLy8gPyBVUkwuKlxuICAgIC8qKlxuICAgICAqIEhvc3Qgc2hvdWxkIHNhdmUgdGhlIGJpbmRpbmcgd2l0aCBgdXVpZGAgYW5kIHRoZSBgZGF0YWBcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gVVVJRCAtIFVVSUQgZ2VuZXJhdGVkIGJ5IEpTIHNpZGUuXG4gICAgICogQHBhcmFtIGRhdGEgLSBkYXRhIG9mIHRoaXMgb2JqZWN0LiBNdXN0IGJlIHR5cGUgYGJsb2JgXG4gICAgICovXG4gICAgJ1VSTC5jcmVhdGVPYmplY3RVUkwnKGV4dGVuc2lvbklEOiBzdHJpbmcsIFVVSUQ6IHN0cmluZywgZGF0YTogU3RyaW5nT3JCbG9iKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIEhvc3Qgc2hvdWxkIHJlbGVhc2UgdGhlIGJpbmRpbmcgd2l0aCBgdXVpZGAgYW5kIHRoZSBgZGF0YWBcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gVVVJRCAtIFVVSUQgZ2VuZXJhdGVkIGJ5IEpTIHNpZGUuXG4gICAgICovXG4gICAgJ1VSTC5yZXZva2VPYmplY3RVUkwnKGV4dGVuc2lvbklEOiBzdHJpbmcsIFVVSUQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBicm93c2VyLmRvd25sb2Fkc1xuICAgIC8qKlxuICAgICAqIE9wZW4gYSBkaWFsb2csIHNoYXJlIHRoZSBmaWxlIHRvIHNvbWV3aGVyZSBlbHNlLlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gU2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkXG4gICAgICovXG4gICAgJ2Jyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkJyhcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgZmlsZW5hbWU6IHN0cmluZ1xuICAgICAgICAgICAgLyoqIENvdWxkIGJlIGEgc3RyaW5nIHJldHVybiBieSBVUkwuY3JlYXRlT2JqZWN0VVJMKCkgKi9cbiAgICAgICAgICAgIHVybDogc3RyaW5nXG4gICAgICAgIH0sXG4gICAgKTogUHJvbWlzZTx2b2lkPlxuICAgIC8vI2VuZHJlZ2lvblxuICAgIC8vI3JlZ2lvbiAvLyA/IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXRcbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGludGVybmFsIHN0b3JhZ2UgZm9yIGBleHRlbnNpb25JRGBcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqID4gU3RvcmFnZTogYHsgYTogeyB2YWx1ZTogMiB9LCBiOiB7IG5hbWU6IFwieFwiIH0sIGM6IDEgfWBcbiAgICAgKlxuICAgICAqIGdldChpZCwgJ2InKVxuICAgICAqID4gUmV0dXJuIGB7bmFtZTogXCJ4XCJ9YFxuICAgICAqXG4gICAgICogZ2V0KGlkLCBudWxsKVxuICAgICAqID4gUmV0dXJuOiBgeyBhOiB7IHZhbHVlOiAyIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSwgYzogMSB9YFxuICAgICAqXG4gICAgICogZ2V0KGlkLCBbXCJhXCIsIFwiYlwiXSlcbiAgICAgKiA+IFJldHVybjogYHsgYTogeyB2YWx1ZTogMiB9LCBiOiB7IG5hbWU6IFwieFwiIH0gfWBcbiAgICAgKi9cbiAgICAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldCcoZXh0ZW5zaW9uSUQ6IHN0cmluZywga2V5OiBzdHJpbmcgfCBzdHJpbmdbXSB8IG51bGwpOiBQcm9taXNlPG9iamVjdD5cbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCBzZXQgdGhlIG9iamVjdCB3aXRoIDEgbGF5ZXIgbWVyZ2luZy5cbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gb2JqZWN0XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqID4gU3RvcmFnZTogYHt9YFxuICAgICAqIHNldChpZCwgeyBhOiB7IHZhbHVlOiAxIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSB9KVxuICAgICAqID4gU3RvcmFnZTogYHsgYTogeyB2YWx1ZTogMSB9LCBiOiB7IG5hbWU6IFwieFwiIH0gfWBcbiAgICAgKiBzZXQoaWQsIHsgYTogeyB2YWx1ZTogMiB9IH0pXG4gICAgICogPiBTdG9yYWdlOiBgeyBhOiB7IHZhbHVlOiAyIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSB9YFxuICAgICAqL1xuICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0JyhleHRlbnNpb25JRDogc3RyaW5nLCBvYmplY3Q6IG9iamVjdCk6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUga2V5cyBpbiB0aGUgb2JqZWN0XG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIGtleVxuICAgICAqL1xuICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwucmVtb3ZlJyhleHRlbnNpb25JRDogc3RyaW5nLCBrZXk6IHN0cmluZyB8IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIERlbGV0ZSB0aGUgaW50ZXJuYWwgc3RvcmFnZVxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqL1xuICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwuY2xlYXInKGV4dGVuc2lvbklEOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+XG4gICAgLy8jZW5kcmVnaW9uXG4gICAgLy8jcmVnaW9uIC8vID8gYnJvd3Nlci50YWJzXG4gICAgLyoqXG4gICAgICogSG9zdCBzaG91bGQgY3JlYXRlIGEgbmV3IHRhYlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gU2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIudGFicy5jcmVhdGVcbiAgICAgKi9cbiAgICAnYnJvd3Nlci50YWJzLmNyZWF0ZScoZXh0ZW5zaW9uSUQ6IHN0cmluZywgb3B0aW9uczogeyBhY3RpdmU/OiBib29sZWFuOyB1cmw/OiBzdHJpbmcgfSk6IFByb21pc2U8YnJvd3Nlci50YWJzLlRhYj5cbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCByZW1vdmUgdGhlIHRhYlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSB0YWJJZCAtIFNlZSBodHRwczovL21kbi5pby9icm93c2VyLnRhYnMucmVtb3ZlXG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy5yZW1vdmUnKGV4dGVuc2lvbklEOiBzdHJpbmcsIHRhYklkOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogUXVlcnkgb3BlbmVkIHRhYnNcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFNlZSBodHRwczovL21kbi5pby9icm93c2VyLnRhYnMucXVlcnlcbiAgICAgKi9cbiAgICAnYnJvd3Nlci50YWJzLnF1ZXJ5JyhcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgcXVlcnlJbmZvOiBQYXJhbWV0ZXJzPHR5cGVvZiBicm93c2VyLnRhYnMucXVlcnk+WzBdLFxuICAgICk6IFByb21pc2U8YnJvd3Nlci50YWJzLlRhYltdPlxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBhIHRhYidzIHByb3BlcnR5XG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIHRhYklkIElmIGl0IGlzIHVuZGVmaW5lZCwgaWdub3JlIHRoaXMgcmVxdWVzdFxuICAgICAqIEBwYXJhbSB1cGRhdGVQcm9wZXJ0aWVzXG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy51cGRhdGUnKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICB0YWJJZD86IG51bWJlcixcbiAgICAgICAgdXBkYXRlUHJvcGVydGllcz86IHtcbiAgICAgICAgICAgIHVybD86IHN0cmluZ1xuICAgICAgICB9LFxuICAgICk6IFByb21pc2U8YnJvd3Nlci50YWJzLlRhYj5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBNZXNzYWdlXG4gICAgLyoqXG4gICAgICogVXNlZCB0byBpbXBsZW1lbnQgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZSBhbmQgYnJvd3Nlci50YWJzLm9uTWVzc2FnZVxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRCAtIFdobyBzZW5kIHRoaXMgbWVzc2FnZVxuICAgICAqIEBwYXJhbSB0b0V4dGVuc2lvbklEIC0gV2hvIHdpbGwgcmVjZWl2ZSB0aGlzIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gdGFiSWQgLSBTZW5kIHRoaXMgbWVzc2FnZSB0byB0YWIgaWRcbiAgICAgKiBAcGFyYW0gbWVzc2FnZUlEIC0gQSByYW5kb20gaWQgZ2VuZXJhdGVkIGJ5IGNsaWVudFxuICAgICAqIEBwYXJhbSBtZXNzYWdlIC0gbWVzc2FnZSBvYmplY3RcbiAgICAgKi9cbiAgICBzZW5kTWVzc2FnZShcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdG9FeHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICB0YWJJZDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgbWVzc2FnZUlEOiBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2U6IEludGVybmFsTWVzc2FnZSxcbiAgICApOiBQcm9taXNlPHZvaWQ+XG4gICAgLy8jZW5kcmVnaW9uXG4gICAgLy8jcmVnaW9uIC8vID8gZmV0Y2ggLy8gPyAodG8gYnlwYXNzIGNyb3NzIG9yaWdpbiByZXN0cmljdGlvbilcbiAgICAvKipcbiAgICAgKiBTZWU6IGh0dHBzOi8vbWRuLmlvL2ZldGNoXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIHJlcXVlc3QgLSBUaGUgcmVxdWVzdCBvYmplY3RcbiAgICAgKi9cbiAgICBmZXRjaChcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgcmVxdWVzdDoge1xuICAgICAgICAgICAgLyoqIEdFVCwgUE9TVCwgLi4uLiAqL1xuICAgICAgICAgICAgbWV0aG9kOiBzdHJpbmdcbiAgICAgICAgICAgIHVybDogc3RyaW5nXG4gICAgICAgIH0sXG4gICAgKTogUHJvbWlzZTx7XG4gICAgICAgIC8qKiByZXNwb25zZSBjb2RlICovXG4gICAgICAgIHN0YXR1czogbnVtYmVyXG4gICAgICAgIC8qKiByZXNwb25zZSB0ZXh0ICovXG4gICAgICAgIHN0YXR1c1RleHQ6IHN0cmluZ1xuICAgICAgICBkYXRhOiBTdHJpbmdPckJsb2JcbiAgICB9PlxuICAgIC8vI2VuZHJlZ2lvblxufVxuLyoqXG4gKiBUaGlzIGRlc2NyaWJlcyB3aGF0IEpTT05SUEMgY2FsbHMgdGhhdCBKUyBzaWRlIHNob3VsZCBpbXBsZW1lbnRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUaGlzU2lkZUltcGxlbWVudGF0aW9uIHtcbiAgICAvKipcbiAgICAgKiBIb3N0IGNhbGwgdGhpcyB0byBub3RpZnkgYGJyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZGAgaGFwcGVuZWQuXG4gICAgICpcbiAgICAgKiBAc2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZFxuICAgICAqIEBwYXJhbSB0YWIgLSBUaGUgY29tbWl0dGVkIHRhYiBpbmZvXG4gICAgICovXG4gICAgJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCcodGFiOiB7IHRhYklkOiBudW1iZXI7IHVybDogc3RyaW5nIH0pOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogVXNlZCB0byBpbXBsZW1lbnQgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZSBhbmQgYnJvd3Nlci50YWJzLm9uTWVzc2FnZVxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRCAtIFdobyBzZW5kIHRoaXMgbWVzc2FnZVxuICAgICAqIEBwYXJhbSB0b0V4dGVuc2lvbklEIC0gV2hvIHdpbGwgcmVjZWl2ZSB0aGlzIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gbWVzc2FnZUlEIC0gQSByYW5kb20gaWQgY3JlYXRlZCBieSB0aGUgc2VuZGVyLiBVc2VkIHRvIGlkZW50aWZ5IGlmIHRoZSBtZXNzYWdlIGlzIGEgcmVzcG9uc2UuXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgLSBTZW5kIGJ5IGFub3RoZXIgY2xpZW50XG4gICAgICogQHBhcmFtIHNlbmRlciAtIEluZm8gb2YgdGhlIHNlbmRlclxuICAgICAqL1xuICAgIG9uTWVzc2FnZShcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdG9FeHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICBtZXNzYWdlSUQ6IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZTogSW50ZXJuYWxNZXNzYWdlLFxuICAgICAgICBzZW5kZXI6IGJyb3dzZXIucnVudGltZS5NZXNzYWdlU2VuZGVyLFxuICAgICk6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBTaG91bGQgaW5qZWN0IHRoZSBnaXZlbiBzY3JpcHQgaW50byB0aGUgZ2l2ZW4gdGFiSURcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gdGFiSUQgLSBUYWIgaWQgdGhhdCBuZWVkIGluamVjdCBzY3JpcHQgdG9cbiAgICAgKiBAcGFyYW0gZGV0YWlscyAtIFNlZSBodHRwczovL21kbi5pby9icm93c2VyLnRhYnMuZXhlY3V0ZVNjcmlwdFxuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMuZXhlY3V0ZVNjcmlwdCcoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRhYklEOiBudW1iZXIsXG4gICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgIGNvZGU/OiBzdHJpbmdcbiAgICAgICAgICAgIGZpbGU/OiBzdHJpbmdcbiAgICAgICAgICAgIHJ1bkF0PzogJ2RvY3VtZW50X3N0YXJ0JyB8ICdkb2N1bWVudF9lbmQnIHwgJ2RvY3VtZW50X2lkbGUnXG4gICAgICAgIH0sXG4gICAgKTogUHJvbWlzZTx2b2lkPlxufVxuXG5jb25zdCBrZXkgPSAnaG9sb2Zsb3dzanNvbnJwYydcbmNvbnN0IGlzRGVidWcgPSBsb2NhdGlvbi5ocmVmID09PSAnaHR0cDovL2xvY2FsaG9zdDo1MDAwLydcbmNsYXNzIGlPU1dlYmtpdENoYW5uZWwge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGtleSwgZSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkZXRhaWwgPSAoZSBhcyBDdXN0b21FdmVudDxhbnk+KS5kZXRhaWxcbiAgICAgICAgICAgIGZvciAoY29uc3QgZiBvZiB0aGlzLmxpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgZihkZXRhaWwpXG4gICAgICAgICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH1cbiAgICBwcml2YXRlIGxpc3RlbmVyOiBBcnJheTwoZGF0YTogdW5rbm93bikgPT4gdm9pZD4gPSBbXVxuICAgIG9uKF86IHN0cmluZywgY2I6IChkYXRhOiBhbnkpID0+IHZvaWQpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5wdXNoKGNiKVxuICAgIH1cbiAgICBlbWl0KF86IHN0cmluZywgZGF0YTogYW55KTogdm9pZCB7XG4gICAgICAgIGlmIChpc0RlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnc2VuZCcsIGRhdGEpXG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHdpbmRvdywge1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlOiAocmVzcG9uc2U6IGFueSkgPT5cbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBDdXN0b21FdmVudDxhbnk+KGtleSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc29ucnBjOiAnMi4wJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGRhdGEuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBpZiAod2luZG93LndlYmtpdCAmJiB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVycyAmJiB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1trZXldKVxuICAgICAgICAgICAgd2luZG93LndlYmtpdC5tZXNzYWdlSGFuZGxlcnNba2V5XS5wb3N0TWVzc2FnZShkYXRhKVxuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBUaGlzU2lkZUltcGxlbWVudGF0aW9uOiBUaGlzU2lkZUltcGxlbWVudGF0aW9uID0ge1xuICAgIC8vIHRvZG86IGNoZWNrIGRpc3BhdGNoIHRhcmdldCdzIG1hbmlmZXN0XG4gICAgJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCc6IGRpc3BhdGNoTm9ybWFsRXZlbnQuYmluZChudWxsLCAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJywgJyonKSxcbiAgICBhc3luYyBvbk1lc3NhZ2UoZXh0ZW5zaW9uSUQsIHRvRXh0ZW5zaW9uSUQsIG1lc3NhZ2VJRCwgbWVzc2FnZSwgc2VuZGVyKSB7XG4gICAgICAgIHN3aXRjaCAobWVzc2FnZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdtZXNzYWdlJzpcbiAgICAgICAgICAgICAgICAvLyA/IHRoaXMgaXMgYSByZXNwb25zZSB0byB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgICAgIGlmIChUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmhhcyhtZXNzYWdlSUQpICYmIG1lc3NhZ2UucmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgW3Jlc29sdmUsIHJlamVjdF0gPSBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmdldChtZXNzYWdlSUQpIVxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG1lc3NhZ2UuZGF0YSlcbiAgICAgICAgICAgICAgICAgICAgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5kZWxldGUobWVzc2FnZUlEKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5yZXNwb25zZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgb25Ob3JtYWxNZXNzYWdlKG1lc3NhZ2UuZGF0YSwgc2VuZGVyLCB0b0V4dGVuc2lvbklELCBleHRlbnNpb25JRCwgbWVzc2FnZUlEKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vID8gZHJvcCB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAnZXhlY3V0ZVNjcmlwdCc6XG4gICAgICAgICAgICAgICAgY29uc3QgZXh0ID0gcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5nZXQoZXh0ZW5zaW9uSUQpIVxuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlLmNvZGUpIGV4dC5lbnZpcm9ubWVudC5ldmFsdWF0ZShtZXNzYWdlLmNvZGUpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobWVzc2FnZS5maWxlKVxuICAgICAgICAgICAgICAgICAgICBsb2FkQ29udGVudFNjcmlwdChleHRlbnNpb25JRCwgZXh0Lm1hbmlmZXN0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBqczogW21lc3NhZ2UuZmlsZV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBjaGVjayB0aGUgcGVybWlzc2lvbiB0byBpbmplY3QgdGhlIHNjcmlwdFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlczogWyc8YWxsX3VybHM+J10sXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgJ2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0JyhleHRlbnNpb25JRCwgdGFiSUQsIGRldGFpbHMpIHtcbiAgICAgICAgcmV0dXJuIEhvc3Quc2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQsIGV4dGVuc2lvbklELCB0YWJJRCwgTWF0aC5yYW5kb20oKS50b1N0cmluZygpLCB7XG4gICAgICAgICAgICAuLi5kZXRhaWxzLFxuICAgICAgICAgICAgdHlwZTogJ2V4ZWN1dGVTY3JpcHQnLFxuICAgICAgICB9KVxuICAgIH0sXG59XG5leHBvcnQgY29uc3QgSG9zdCA9IEFzeW5jQ2FsbDxIb3N0PihUaGlzU2lkZUltcGxlbWVudGF0aW9uIGFzIGFueSwge1xuICAgIGtleTogJycsXG4gICAgbG9nOiBmYWxzZSxcbiAgICBtZXNzYWdlQ2hhbm5lbDogbmV3IGlPU1dlYmtpdENoYW5uZWwoKSxcbn0pXG4iLCJpbXBvcnQgeyBTdHJpbmdPckJsb2IgfSBmcm9tICcuLi9SUEMnXG5cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVTdHJpbmdPckJsb2IodmFsOiBTdHJpbmdPckJsb2IpOiBCbG9iIHwgc3RyaW5nIHwgQXJyYXlCdWZmZXIgfCBudWxsIHtcbiAgICBpZiAodmFsLnR5cGUgPT09ICd0ZXh0JykgcmV0dXJuIHZhbC5jb250ZW50XG4gICAgaWYgKHZhbC50eXBlID09PSAnYmxvYicpIHJldHVybiBuZXcgQmxvYihbdmFsLmNvbnRlbnRdLCB7IHR5cGU6IHZhbC5taW1lVHlwZSB9KVxuICAgIGlmICh2YWwudHlwZSA9PT0gJ2FycmF5IGJ1ZmZlcicpIHtcbiAgICAgICAgcmV0dXJuIGJhc2U2NERlY1RvQXJyKHZhbC5jb250ZW50KS5idWZmZXJcbiAgICB9XG4gICAgcmV0dXJuIG51bGxcbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbmNvZGVTdHJpbmdPckJsb2IodmFsOiBCbG9iIHwgc3RyaW5nIHwgQXJyYXlCdWZmZXIpOiBQcm9taXNlPFN0cmluZ09yQmxvYj4ge1xuICAgIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykgcmV0dXJuIHsgdHlwZTogJ3RleHQnLCBjb250ZW50OiB2YWwgfVxuICAgIGlmICh2YWwgaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGF3YWl0IG5ldyBSZXNwb25zZSh2YWwpLmFycmF5QnVmZmVyKCkpXG4gICAgICAgIHJldHVybiB7IHR5cGU6ICdibG9iJywgbWltZVR5cGU6IHZhbC50eXBlLCBjb250ZW50OiBiYXNlNjRFbmNBcnIoYnVmZmVyKSB9XG4gICAgfVxuICAgIGlmICh2YWwgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgICByZXR1cm4geyB0eXBlOiAnYXJyYXkgYnVmZmVyJywgY29udGVudDogYmFzZTY0RW5jQXJyKG5ldyBVaW50OEFycmF5KHZhbCkpIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBkYXRhJylcbn1cblxuLy8jcmVnaW9uIC8vID8gQ29kZSBmcm9tIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XaW5kb3dCYXNlNjQvQmFzZTY0X2VuY29kaW5nX2FuZF9kZWNvZGluZyNBcHBlbmRpeC4zQV9EZWNvZGVfYV9CYXNlNjRfc3RyaW5nX3RvX1VpbnQ4QXJyYXlfb3JfQXJyYXlCdWZmZXJcbmZ1bmN0aW9uIGI2NFRvVWludDYobkNocjogbnVtYmVyKSB7XG4gICAgcmV0dXJuIG5DaHIgPiA2NCAmJiBuQ2hyIDwgOTFcbiAgICAgICAgPyBuQ2hyIC0gNjVcbiAgICAgICAgOiBuQ2hyID4gOTYgJiYgbkNociA8IDEyM1xuICAgICAgICA/IG5DaHIgLSA3MVxuICAgICAgICA6IG5DaHIgPiA0NyAmJiBuQ2hyIDwgNThcbiAgICAgICAgPyBuQ2hyICsgNFxuICAgICAgICA6IG5DaHIgPT09IDQzXG4gICAgICAgID8gNjJcbiAgICAgICAgOiBuQ2hyID09PSA0N1xuICAgICAgICA/IDYzXG4gICAgICAgIDogMFxufVxuXG5mdW5jdGlvbiBiYXNlNjREZWNUb0FycihzQmFzZTY0OiBzdHJpbmcsIG5CbG9ja1NpemU/OiBudW1iZXIpIHtcbiAgICB2YXIgc0I2NEVuYyA9IHNCYXNlNjQucmVwbGFjZSgvW15BLVphLXowLTlcXCtcXC9dL2csICcnKSxcbiAgICAgICAgbkluTGVuID0gc0I2NEVuYy5sZW5ndGgsXG4gICAgICAgIG5PdXRMZW4gPSBuQmxvY2tTaXplID8gTWF0aC5jZWlsKCgobkluTGVuICogMyArIDEpID4+PiAyKSAvIG5CbG9ja1NpemUpICogbkJsb2NrU2l6ZSA6IChuSW5MZW4gKiAzICsgMSkgPj4+IDIsXG4gICAgICAgIGFCeXRlcyA9IG5ldyBVaW50OEFycmF5KG5PdXRMZW4pXG5cbiAgICBmb3IgKHZhciBuTW9kMywgbk1vZDQsIG5VaW50MjQgPSAwLCBuT3V0SWR4ID0gMCwgbkluSWR4ID0gMDsgbkluSWR4IDwgbkluTGVuOyBuSW5JZHgrKykge1xuICAgICAgICBuTW9kNCA9IG5JbklkeCAmIDNcbiAgICAgICAgblVpbnQyNCB8PSBiNjRUb1VpbnQ2KHNCNjRFbmMuY2hhckNvZGVBdChuSW5JZHgpKSA8PCAoMTggLSA2ICogbk1vZDQpXG4gICAgICAgIGlmIChuTW9kNCA9PT0gMyB8fCBuSW5MZW4gLSBuSW5JZHggPT09IDEpIHtcbiAgICAgICAgICAgIGZvciAobk1vZDMgPSAwOyBuTW9kMyA8IDMgJiYgbk91dElkeCA8IG5PdXRMZW47IG5Nb2QzKyssIG5PdXRJZHgrKykge1xuICAgICAgICAgICAgICAgIGFCeXRlc1tuT3V0SWR4XSA9IChuVWludDI0ID4+PiAoKDE2ID4+PiBuTW9kMykgJiAyNCkpICYgMjU1XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuVWludDI0ID0gMFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFCeXRlc1xufVxuZnVuY3Rpb24gdWludDZUb0I2NChuVWludDY6IG51bWJlcikge1xuICAgIHJldHVybiBuVWludDYgPCAyNlxuICAgICAgICA/IG5VaW50NiArIDY1XG4gICAgICAgIDogblVpbnQ2IDwgNTJcbiAgICAgICAgPyBuVWludDYgKyA3MVxuICAgICAgICA6IG5VaW50NiA8IDYyXG4gICAgICAgID8gblVpbnQ2IC0gNFxuICAgICAgICA6IG5VaW50NiA9PT0gNjJcbiAgICAgICAgPyA0M1xuICAgICAgICA6IG5VaW50NiA9PT0gNjNcbiAgICAgICAgPyA0N1xuICAgICAgICA6IDY1XG59XG5cbmZ1bmN0aW9uIGJhc2U2NEVuY0FycihhQnl0ZXM6IFVpbnQ4QXJyYXkpIHtcbiAgICB2YXIgZXFMZW4gPSAoMyAtIChhQnl0ZXMubGVuZ3RoICUgMykpICUgMyxcbiAgICAgICAgc0I2NEVuYyA9ICcnXG5cbiAgICBmb3IgKHZhciBuTW9kMywgbkxlbiA9IGFCeXRlcy5sZW5ndGgsIG5VaW50MjQgPSAwLCBuSWR4ID0gMDsgbklkeCA8IG5MZW47IG5JZHgrKykge1xuICAgICAgICBuTW9kMyA9IG5JZHggJSAzXG4gICAgICAgIC8qIFVuY29tbWVudCB0aGUgZm9sbG93aW5nIGxpbmUgaW4gb3JkZXIgdG8gc3BsaXQgdGhlIG91dHB1dCBpbiBsaW5lcyA3Ni1jaGFyYWN0ZXIgbG9uZzogKi9cbiAgICAgICAgLypcbiAgICAgIGlmIChuSWR4ID4gMCAmJiAobklkeCAqIDQgLyAzKSAlIDc2ID09PSAwKSB7IHNCNjRFbmMgKz0gXCJcXHJcXG5cIjsgfVxuICAgICAgKi9cbiAgICAgICAgblVpbnQyNCB8PSBhQnl0ZXNbbklkeF0gPDwgKCgxNiA+Pj4gbk1vZDMpICYgMjQpXG4gICAgICAgIGlmIChuTW9kMyA9PT0gMiB8fCBhQnl0ZXMubGVuZ3RoIC0gbklkeCA9PT0gMSkge1xuICAgICAgICAgICAgc0I2NEVuYyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKFxuICAgICAgICAgICAgICAgIHVpbnQ2VG9CNjQoKG5VaW50MjQgPj4+IDE4KSAmIDYzKSxcbiAgICAgICAgICAgICAgICB1aW50NlRvQjY0KChuVWludDI0ID4+PiAxMikgJiA2MyksXG4gICAgICAgICAgICAgICAgdWludDZUb0I2NCgoblVpbnQyNCA+Pj4gNikgJiA2MyksXG4gICAgICAgICAgICAgICAgdWludDZUb0I2NChuVWludDI0ICYgNjMpLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgblVpbnQyNCA9IDBcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBlcUxlbiA9PT0gMCA/IHNCNjRFbmMgOiBzQjY0RW5jLnN1YnN0cmluZygwLCBzQjY0RW5jLmxlbmd0aCAtIGVxTGVuKSArIChlcUxlbiA9PT0gMSA/ICc9JyA6ICc9PScpXG59XG4iLCJpbXBvcnQgeyBIb3N0IH0gZnJvbSAnLi4vUlBDJ1xuaW1wb3J0IHsgZW5jb2RlU3RyaW5nT3JCbG9iIH0gZnJvbSAnLi4vdXRpbHMvU3RyaW5nT3JCbG9iJ1xuXG5jb25zdCB7IGNyZWF0ZU9iamVjdFVSTCwgcmV2b2tlT2JqZWN0VVJMIH0gPSBVUkxcbmV4cG9ydCBmdW5jdGlvbiBnZXRJREZyb21CbG9iVVJMKHg6IHN0cmluZykge1xuICAgIGlmICh4LnN0YXJ0c1dpdGgoJ2Jsb2I6JykpIHJldHVybiBuZXcgVVJMKG5ldyBVUkwoeCkucGF0aG5hbWUpLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8vLCAnJylcbiAgICByZXR1cm4gdW5kZWZpbmVkXG59XG4vKipcbiAqIE1vZGlmeSB0aGUgYmVoYXZpb3Igb2YgVVJMLipcbiAqIExldCB0aGUgYmxvYjovLyB1cmwgY2FuIGJlIHJlY29nbml6ZWQgYnkgSG9zdC5cbiAqXG4gKiBAcGFyYW0gdXJsIFRoZSBvcmlnaW5hbCBVUkwgb2JqZWN0XG4gKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuaGFuY2VVUkwodXJsOiB0eXBlb2YgVVJMLCBleHRlbnNpb25JRDogc3RyaW5nKSB7XG4gICAgdXJsLmNyZWF0ZU9iamVjdFVSTCA9IGNyZWF0ZU9iamVjdFVSTEVuaGFuY2VkKGV4dGVuc2lvbklEKVxuICAgIHVybC5yZXZva2VPYmplY3RVUkwgPSByZXZva2VPYmplY3RVUkxFbmhhbmNlZChleHRlbnNpb25JRClcbiAgICByZXR1cm4gdXJsXG59XG5cbmZ1bmN0aW9uIHJldm9rZU9iamVjdFVSTEVuaGFuY2VkKGV4dGVuc2lvbklEOiBzdHJpbmcpOiAodXJsOiBzdHJpbmcpID0+IHZvaWQge1xuICAgIHJldHVybiAodXJsOiBzdHJpbmcpID0+IHtcbiAgICAgICAgcmV2b2tlT2JqZWN0VVJMKHVybClcbiAgICAgICAgY29uc3QgaWQgPSBnZXRJREZyb21CbG9iVVJMKHVybCkhXG4gICAgICAgIEhvc3RbJ1VSTC5yZXZva2VPYmplY3RVUkwnXShleHRlbnNpb25JRCwgaWQpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVPYmplY3RVUkxFbmhhbmNlZChleHRlbnNpb25JRDogc3RyaW5nKTogKG9iamVjdDogYW55KSA9PiBzdHJpbmcge1xuICAgIHJldHVybiAob2JqOiBGaWxlIHwgQmxvYiB8IE1lZGlhU291cmNlKSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IGNyZWF0ZU9iamVjdFVSTChvYmopXG4gICAgICAgIGNvbnN0IHJlc291cmNlSUQgPSBnZXRJREZyb21CbG9iVVJMKHVybCkhXG4gICAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgICAgICAgICBlbmNvZGVTdHJpbmdPckJsb2Iob2JqKS50aGVuKGJsb2IgPT4gSG9zdFsnVVJMLmNyZWF0ZU9iamVjdFVSTCddKGV4dGVuc2lvbklELCByZXNvdXJjZUlELCBibG9iKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsXG4gICAgfVxufVxuXG5mdW5jdGlvbiBibG9iVG9CYXNlNjQoYmxvYjogQmxvYikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZGVuZCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IFtoZWFkZXIsIGJhc2U2NF0gPSAocmVhZGVyLnJlc3VsdCBhcyBzdHJpbmcpLnNwbGl0KCcsJylcbiAgICAgICAgICAgIHJlc29sdmUoYmFzZTY0KVxuICAgICAgICB9KVxuICAgICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBlID0+IHJlamVjdChlKSlcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoYmxvYilcbiAgICB9KVxufVxuIiwiaW1wb3J0IHsgSG9zdCwgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uL1JQQydcbmltcG9ydCB7IGNyZWF0ZUV2ZW50TGlzdGVuZXIgfSBmcm9tICcuLi91dGlscy9Mb2NhbE1lc3NhZ2VzJ1xuaW1wb3J0IHsgY3JlYXRlUnVudGltZVNlbmRNZXNzYWdlLCBzZW5kTWVzc2FnZVdpdGhSZXNwb25zZSB9IGZyb20gJy4vYnJvd3Nlci5tZXNzYWdlJ1xuaW1wb3J0IHsgTWFuaWZlc3QgfSBmcm9tICcuLi9FeHRlbnNpb25zJ1xuaW1wb3J0IHsgZ2V0SURGcm9tQmxvYlVSTCB9IGZyb20gJy4vVVJMLmNyZWF0ZStyZXZva2VPYmplY3RVUkwnXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBgYnJvd3NlcmAgb2JqZWN0LlxuICogQHBhcmFtIGV4dGVuc2lvbklEIC0gRXh0ZW5zaW9uIElEXG4gKiBAcGFyYW0gbWFuaWZlc3QgLSBNYW5pZmVzdCBvZiB0aGUgZXh0ZW5zaW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBCcm93c2VyRmFjdG9yeShleHRlbnNpb25JRDogc3RyaW5nLCBtYW5pZmVzdDogTWFuaWZlc3QpOiBicm93c2VyIHtcbiAgICBjb25zdCBpbXBsZW1lbnRhdGlvbjogUGFydGlhbDxicm93c2VyPiA9IHtcbiAgICAgICAgZG93bmxvYWRzOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLmRvd25sb2Fkcz4oe1xuICAgICAgICAgICAgZG93bmxvYWQ6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZCcpKHtcbiAgICAgICAgICAgICAgICBwYXJhbShvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB7IHVybCwgZmlsZW5hbWUgfSA9IG9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdldElERnJvbUJsb2JVUkwodXJsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsID0gYGhvbG9mbG93cy1ibG9iOi8vJHtleHRlbnNpb25JRH0vJHtnZXRJREZyb21CbG9iVVJMKHVybCkhfWBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBQYXJ0aWFsSW1wbGVtZW50ZWQob3B0aW9ucywgJ2ZpbGVuYW1lJywgJ3VybCcpXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFyZzEgPSB7IHVybCwgZmlsZW5hbWU6IGZpbGVuYW1lIHx8ICcnIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFthcmcxXVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmV0dXJucygpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSksXG4gICAgICAgIH0pLFxuICAgICAgICBydW50aW1lOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLnJ1bnRpbWU+KHtcbiAgICAgICAgICAgIGdldFVSTChwYXRoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJHtleHRlbnNpb25JRH0vJHtwYXRofWBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXRNYW5pZmVzdCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShtYW5pZmVzdCkpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25NZXNzYWdlOiBjcmVhdGVFdmVudExpc3RlbmVyKGV4dGVuc2lvbklELCAnYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZScpLFxuICAgICAgICAgICAgc2VuZE1lc3NhZ2U6IGNyZWF0ZVJ1bnRpbWVTZW5kTWVzc2FnZShleHRlbnNpb25JRCksXG4gICAgICAgIH0pLFxuICAgICAgICB0YWJzOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLnRhYnM+KHtcbiAgICAgICAgICAgIGFzeW5jIGV4ZWN1dGVTY3JpcHQodGFiSUQsIGRldGFpbHMpIHtcbiAgICAgICAgICAgICAgICBQYXJ0aWFsSW1wbGVtZW50ZWQoZGV0YWlscywgJ2NvZGUnLCAnZmlsZScsICdydW5BdCcpXG4gICAgICAgICAgICAgICAgYXdhaXQgVGhpc1NpZGVJbXBsZW1lbnRhdGlvblsnYnJvd3Nlci50YWJzLmV4ZWN1dGVTY3JpcHQnXShcbiAgICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9uSUQsXG4gICAgICAgICAgICAgICAgICAgIHRhYklEID09PSB1bmRlZmluZWQgPyAtMSA6IHRhYklELFxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxzLFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICByZXR1cm4gW11cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGU6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnRhYnMuY3JlYXRlJykoKSxcbiAgICAgICAgICAgIGFzeW5jIHJlbW92ZSh0YWJJRCkge1xuICAgICAgICAgICAgICAgIGxldCB0OiBudW1iZXJbXVxuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0YWJJRCkpIHQgPSBbdGFiSURdXG4gICAgICAgICAgICAgICAgZWxzZSB0ID0gdGFiSURcbiAgICAgICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0Lm1hcCh4ID0+IEhvc3RbJ2Jyb3dzZXIudGFicy5yZW1vdmUnXShleHRlbnNpb25JRCwgeCkpKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHF1ZXJ5OiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci50YWJzLnF1ZXJ5JykoKSxcbiAgICAgICAgICAgIHVwZGF0ZTogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIudGFicy51cGRhdGUnKSgpLFxuICAgICAgICAgICAgYXN5bmMgc2VuZE1lc3NhZ2U8VCA9IGFueSwgVSA9IG9iamVjdD4oXG4gICAgICAgICAgICAgICAgdGFiSWQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBULFxuICAgICAgICAgICAgICAgIG9wdGlvbnM/OiB7IGZyYW1lSWQ/OiBudW1iZXIgfCB1bmRlZmluZWQgfSB8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICk6IFByb21pc2U8dm9pZCB8IFU+IHtcbiAgICAgICAgICAgICAgICBQYXJ0aWFsSW1wbGVtZW50ZWQob3B0aW9ucylcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VuZE1lc3NhZ2VXaXRoUmVzcG9uc2UoZXh0ZW5zaW9uSUQsIGV4dGVuc2lvbklELCB0YWJJZCwgbWVzc2FnZSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgICBzdG9yYWdlOiB7XG4gICAgICAgICAgICBsb2NhbDogSW1wbGVtZW50czx0eXBlb2YgYnJvd3Nlci5zdG9yYWdlLmxvY2FsPih7XG4gICAgICAgICAgICAgICAgY2xlYXI6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnN0b3JhZ2UubG9jYWwuY2xlYXInKSgpLFxuICAgICAgICAgICAgICAgIHJlbW92ZTogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5yZW1vdmUnKSgpLFxuICAgICAgICAgICAgICAgIHNldDogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQnKSgpLFxuICAgICAgICAgICAgICAgIGdldDogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQnKSh7XG4gICAgICAgICAgICAgICAgICAgIC8qKiBIb3N0IG5vdCBhY2NlcHRpbmcgeyBhOiAxIH0gYXMga2V5cyAqL1xuICAgICAgICAgICAgICAgICAgICBwYXJhbShrZXlzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXlzKSkgcmV0dXJuIFtrZXlzIGFzIHN0cmluZ1tdXVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBrZXlzID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXlzID09PSBudWxsKSByZXR1cm4gW251bGxdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtPYmplY3Qua2V5cyhrZXlzKV1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbbnVsbF1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJucyhydG4sIFtrZXldKTogb2JqZWN0IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleSkpIHJldHVybiBydG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnICYmIGtleSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7IC4uLmtleSwgLi4ucnRuIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBydG5cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgc3luYzogTm90SW1wbGVtZW50ZWRQcm94eSgpLFxuICAgICAgICAgICAgb25DaGFuZ2VkOiBOb3RJbXBsZW1lbnRlZFByb3h5KCksXG4gICAgICAgIH0sXG4gICAgICAgIHdlYk5hdmlnYXRpb246IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIud2ViTmF2aWdhdGlvbj4oe1xuICAgICAgICAgICAgb25Db21taXR0ZWQ6IGNyZWF0ZUV2ZW50TGlzdGVuZXIoZXh0ZW5zaW9uSUQsICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnKSxcbiAgICAgICAgfSksXG4gICAgICAgIGV4dGVuc2lvbjogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci5leHRlbnNpb24+KHtcbiAgICAgICAgICAgIGdldEJhY2tncm91bmRQYWdlKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJveHkoXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBuZXcgVVJMKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJHtleHRlbnNpb25JRH0vX2dlbmVyYXRlZF9iYWNrZ3JvdW5kX3BhZ2UuaHRtbGAsXG4gICAgICAgICAgICAgICAgICAgICAgICApIGFzIFBhcnRpYWw8TG9jYXRpb24+LFxuICAgICAgICAgICAgICAgICAgICB9IGFzIFBhcnRpYWw8V2luZG93PixcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0KF86IGFueSwga2V5OiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoX1trZXldKSByZXR1cm4gX1trZXldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTm90IHN1cHBvcnRlZCcpXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICkgYXMgV2luZG93XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICAgcGVybWlzc2lvbnM6IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIucGVybWlzc2lvbnM+KHtcbiAgICAgICAgICAgIHJlcXVlc3Q6IGFzeW5jICgpID0+IHRydWUsXG4gICAgICAgICAgICBjb250YWluczogYXN5bmMgKCkgPT4gdHJ1ZSxcbiAgICAgICAgICAgIHJlbW92ZTogYXN5bmMgKCkgPT4gdHJ1ZSxcbiAgICAgICAgfSksXG4gICAgfVxuICAgIHJldHVybiBOb3RJbXBsZW1lbnRlZFByb3h5PGJyb3dzZXI+KGltcGxlbWVudGF0aW9uLCBmYWxzZSlcbn1cbnR5cGUgYnJvd3NlciA9IHR5cGVvZiBicm93c2VyXG5cbmZ1bmN0aW9uIEltcGxlbWVudHM8VD4oaW1wbGVtZW50YXRpb246IFQpIHtcbiAgICByZXR1cm4gaW1wbGVtZW50YXRpb25cbn1cbmZ1bmN0aW9uIE5vdEltcGxlbWVudGVkUHJveHk8VCA9IGFueT4oaW1wbGVtZW50ZWQ6IFBhcnRpYWw8VD4gPSB7fSwgZmluYWwgPSB0cnVlKTogVCB7XG4gICAgcmV0dXJuIG5ldyBQcm94eShpbXBsZW1lbnRlZCwge1xuICAgICAgICBnZXQodGFyZ2V0OiBhbnksIGtleSkge1xuICAgICAgICAgICAgaWYgKCF0YXJnZXRba2V5XSkgcmV0dXJuIGZpbmFsID8gTm90SW1wbGVtZW50ZWQgOiBOb3RJbXBsZW1lbnRlZFByb3h5KClcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXRba2V5XVxuICAgICAgICB9LFxuICAgICAgICBhcHBseSgpIHtcbiAgICAgICAgICAgIHJldHVybiBOb3RJbXBsZW1lbnRlZCgpXG4gICAgICAgIH0sXG4gICAgfSlcbn1cbmZ1bmN0aW9uIE5vdEltcGxlbWVudGVkKCk6IGFueSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCEnKVxuICAgIH1cbn1cbmZ1bmN0aW9uIFBhcnRpYWxJbXBsZW1lbnRlZDxUPihvYmo6IFQgPSB7fSBhcyBhbnksIC4uLmtleXM6IChrZXlvZiBUKVtdKSB7XG4gICAgY29uc3Qgb2JqMiA9IHsgLi4ub2JqIH1cbiAgICBrZXlzLmZvckVhY2goeCA9PiBkZWxldGUgb2JqMlt4XSlcbiAgICBpZiAoT2JqZWN0LmtleXMob2JqMikubGVuZ3RoKSBjb25zb2xlLndhcm4oYE5vdCBpbXBsZW1lbnRlZCBvcHRpb25zYCwgb2JqMiwgYGF0YCwgbmV3IEVycm9yKCkuc3RhY2spXG59XG5cbnR5cGUgSGVhZGxlc3NQYXJhbWV0ZXJzPFQgZXh0ZW5kcyAoLi4uYXJnczogYW55KSA9PiBhbnk+ID0gVCBleHRlbmRzIChleHRlbnNpb25JRDogc3RyaW5nLCAuLi5hcmdzOiBpbmZlciBQKSA9PiBhbnlcbiAgICA/IFBcbiAgICA6IG5ldmVyXG4vKipcbiAqIEdlbmVyYXRlIGJpbmRpbmcgYmV0d2VlbiBIb3N0IGFuZCBXZWJFeHRlbnNpb25BUElcbiAqXG4gKiBBTEwgZ2VuZXJpY3Mgc2hvdWxkIGJlIGluZmVycmVkLiBETyBOT1Qgd3JpdGUgaXQgbWFudWFsbHkuXG4gKlxuICogSWYgeW91IGFyZSB3cml0aW5nIG9wdGlvbnMsIG1ha2Ugc3VyZSB5b3UgYWRkIHlvdXIgZnVuY3Rpb24gdG8gYEJyb3dzZXJSZWZlcmVuY2VgIHRvIGdldCB0eXBlIHRpcHMuXG4gKlxuICogQHBhcmFtIGV4dGVuc2lvbklEIC0gVGhlIGV4dGVuc2lvbiBJRFxuICogQHBhcmFtIGtleSAtIFRoZSBBUEkgbmFtZSBpbiB0aGUgdHlwZSBvZiBgSG9zdGAgQU5EIGBCcm93c2VyUmVmZXJlbmNlYFxuICovXG5mdW5jdGlvbiBiaW5kaW5nPFxuICAgIC8qKiBOYW1lIG9mIHRoZSBBUEkgaW4gdGhlIFJQQyBiaW5kaW5nICovXG4gICAgS2V5IGV4dGVuZHMga2V5b2YgQnJvd3NlclJlZmVyZW5jZSxcbiAgICAvKiogVGhlIGRlZmluaXRpb24gb2YgdGhlIFdlYkV4dGVuc2lvbkFQSSBzaWRlICovXG4gICAgQnJvd3NlckRlZiBleHRlbmRzIEJyb3dzZXJSZWZlcmVuY2VbS2V5XSxcbiAgICAvKiogVGhlIGRlZmluaXRpb24gb2YgdGhlIEhvc3Qgc2lkZSAqL1xuICAgIEhvc3REZWYgZXh0ZW5kcyBIb3N0W0tleV0sXG4gICAgLyoqIEFyZ3VtZW50cyBvZiB0aGUgYnJvd3NlciBzaWRlICovXG4gICAgQnJvd3NlckFyZ3MgZXh0ZW5kcyBQYXJhbWV0ZXJzPEJyb3dzZXJEZWY+LFxuICAgIC8qKiBSZXR1cm4gdHlwZSBvZiB0aGUgYnJvd3NlciBzaWRlICovXG4gICAgQnJvd3NlclJldHVybiBleHRlbmRzIFByb21pc2VPZjxSZXR1cm5UeXBlPEJyb3dzZXJEZWY+PixcbiAgICAvKiogQXJndW1lbnRzIHR5cGUgb2YgdGhlIEhvc3Qgc2lkZSAqL1xuICAgIEhvc3RBcmdzIGV4dGVuZHMgSGVhZGxlc3NQYXJhbWV0ZXJzPEhvc3REZWY+LFxuICAgIC8qKiBSZXR1cm4gdHlwZSBvZiB0aGUgSG9zdCBzaWRlICovXG4gICAgSG9zdFJldHVybiBleHRlbmRzIFByb21pc2VPZjxSZXR1cm5UeXBlPEhvc3REZWY+PlxuPihleHRlbnNpb25JRDogc3RyaW5nLCBrZXk6IEtleSkge1xuICAgIC8qKlxuICAgICAqIEFuZCBoZXJlIHdlIHNwbGl0IGl0IGludG8gMiBmdW5jdGlvbiwgaWYgd2Ugam9pbiB0aGVtIHRvZ2V0aGVyIGl0IHdpbGwgYnJlYWsgdGhlIGluZmVyIChidXQgaWRrIHdoeSlcbiAgICAgKi9cbiAgICByZXR1cm4gPFxuICAgICAgICAvKiogSGVyZSB3ZSBoYXZlIHRvIHVzZSBnZW5lcmljcyB3aXRoIGd1YXJkIHRvIGVuc3VyZSBUeXBlU2NyaXB0IHdpbGwgaW5mZXIgdHlwZSBvbiBydW50aW1lICovXG4gICAgICAgIE9wdGlvbnMgZXh0ZW5kcyB7XG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgICogSGVyZSB3ZSB3cml0ZSB0aGUgdHlwZSBndWFyZCBpbiB0aGUgZ2VuZXJpYyxcbiAgICAgICAgICAgICAqIGRvbid0IHVzZSB0d28gbW9yZSBnZW5lcmljcyB0byBpbmZlciB0aGUgcmV0dXJuIHR5cGUgb2YgYHBhcmFtYCBhbmQgYHJldHVybnNgLFxuICAgICAgICAgICAgICogdGhhdCB3aWxsIGJyZWFrIHRoZSBpbmZlciByZXN1bHQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHBhcmFtPzogKC4uLmFyZ3M6IEJyb3dzZXJBcmdzKSA9PiBIb3N0QXJnc1xuICAgICAgICAgICAgcmV0dXJucz86IChyZXR1cm5zOiBIb3N0UmV0dXJuLCBicm93c2VyOiBCcm93c2VyQXJncywgaG9zdDogSG9zdEFyZ3MpID0+IEJyb3dzZXJSZXR1cm5cbiAgICAgICAgfVxuICAgID4oXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zLiBZb3UgY2FuIHdyaXRlIHRoZSBicmlkZ2UgYmV0d2VlbiBIb3N0IHNpZGUgYW5kIFdlYkV4dGVuc2lvbiBzaWRlLlxuICAgICAgICAgKi9cbiAgICAgICAgb3B0aW9uczogT3B0aW9ucyA9IHt9IGFzIGFueSxcbiAgICApID0+IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERvbid0IHdyaXRlIHRoZXNlIHR5cGUgYWxpYXMgaW4gZ2VuZXJpY3MuIHdpbGwgYnJlYWsuIGlkayB3aHkgYWdhaW4uXG4gICAgICAgICAqL1xuICAgICAgICB0eXBlIEhhc1BhcmFtRm4gPSB1bmRlZmluZWQgZXh0ZW5kcyBPcHRpb25zWydwYXJhbSddID8gZmFsc2UgOiB0cnVlXG4gICAgICAgIHR5cGUgSGFzUmV0dXJuRm4gPSB1bmRlZmluZWQgZXh0ZW5kcyBPcHRpb25zWydyZXR1cm5zJ10gPyBmYWxzZSA6IHRydWVcbiAgICAgICAgdHlwZSBfX19BcmdzX19fID0gUmV0dXJuVHlwZTxOb25OdWxsYWJsZTxPcHRpb25zWydwYXJhbSddPj5cbiAgICAgICAgdHlwZSBfX19SZXR1cm5fX18gPSBSZXR1cm5UeXBlPE5vbk51bGxhYmxlPE9wdGlvbnNbJ3JldHVybnMnXT4+XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiB0aGVyZSBpcyBhIGJyaWRnZSBmdW5jdGlvblxuICAgICAgICAgKiAtIGlmIGl0cyByZXR1cm4gdHlwZSBzYXRpc2ZpZWQgdGhlIHJlcXVpcmVtZW50LCByZXR1cm4gdGhlIGBCcm93c2VyQXJnc2AgZWxzZSByZXR1cm4gYG5ldmVyYFxuICAgICAgICAgKlxuICAgICAgICAgKiByZXR1cm4gdGhlIGBIb3N0QXJnc2AgYW5kIGxldCBUeXBlU2NyaXB0IGNoZWNrIGlmIGl0IGlzIHNhdGlzZmllZC5cbiAgICAgICAgICovXG4gICAgICAgIHR5cGUgSW5mZXJBcmdzUmVzdWx0ID0gSGFzUGFyYW1GbiBleHRlbmRzIHRydWVcbiAgICAgICAgICAgID8gX19fQXJnc19fXyBleHRlbmRzIEJyb3dzZXJBcmdzXG4gICAgICAgICAgICAgICAgPyBCcm93c2VyQXJnc1xuICAgICAgICAgICAgICAgIDogbmV2ZXJcbiAgICAgICAgICAgIDogSG9zdEFyZ3NcbiAgICAgICAgLyoqIEp1c3QgbGlrZSBgSW5mZXJBcmdzUmVzdWx0YCAqL1xuICAgICAgICB0eXBlIEluZmVyUmV0dXJuUmVzdWx0ID0gSGFzUmV0dXJuRm4gZXh0ZW5kcyB0cnVlXG4gICAgICAgICAgICA/IF9fX1JldHVybl9fXyBleHRlbmRzIEJyb3dzZXJSZXR1cm5cbiAgICAgICAgICAgICAgICA/IF9fX1JldHVybl9fX1xuICAgICAgICAgICAgICAgIDogJ25ldmVyIHJ0bidcbiAgICAgICAgICAgIDogSG9zdFJldHVyblxuICAgICAgICBjb25zdCBub29wID0gPFQ+KHg/OiBUKSA9PiB4XG4gICAgICAgIGNvbnN0IG5vb3BBcmdzID0gKC4uLmFyZ3M6IGFueVtdKSA9PiBhcmdzXG4gICAgICAgIGNvbnN0IGhvc3REZWZpbml0aW9uOiAoZXh0ZW5zaW9uSUQ6IHN0cmluZywgLi4uYXJnczogSG9zdEFyZ3MpID0+IFByb21pc2U8SG9zdFJldHVybj4gPSBIb3N0W2tleV0gYXMgYW55XG4gICAgICAgIHJldHVybiAoKGFzeW5jICguLi5hcmdzOiBCcm93c2VyQXJncyk6IFByb21pc2U8QnJvd3NlclJldHVybj4gPT4ge1xuICAgICAgICAgICAgLy8gPyBUcmFuc2Zvcm0gV2ViRXh0ZW5zaW9uIEFQSSBhcmd1bWVudHMgdG8gaG9zdCBhcmd1bWVudHNcbiAgICAgICAgICAgIGNvbnN0IGhvc3RBcmdzID0gKG9wdGlvbnMucGFyYW0gfHwgbm9vcEFyZ3MpKC4uLmFyZ3MpIGFzIEhvc3RBcmdzXG4gICAgICAgICAgICAvLyA/IGV4ZWN1dGVcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGhvc3REZWZpbml0aW9uKGV4dGVuc2lvbklELCAuLi5ob3N0QXJncylcbiAgICAgICAgICAgIC8vID8gVHJhbnNmb3JtIGhvc3QgcmVzdWx0IHRvIFdlYkV4dGVuc2lvbiBBUEkgcmVzdWx0XG4gICAgICAgICAgICBjb25zdCBicm93c2VyUmVzdWx0ID0gKG9wdGlvbnMucmV0dXJucyB8fCBub29wKShyZXN1bHQsIGFyZ3MsIGhvc3RBcmdzKSBhcyBCcm93c2VyUmV0dXJuXG4gICAgICAgICAgICByZXR1cm4gYnJvd3NlclJlc3VsdFxuICAgICAgICB9KSBhcyB1bmtub3duKSBhcyAoLi4uYXJnczogSW5mZXJBcmdzUmVzdWx0KSA9PiBQcm9taXNlPEluZmVyUmV0dXJuUmVzdWx0PlxuICAgIH1cbn1cbi8qKlxuICogQSByZWZlcmVuY2UgdGFibGUgYmV0d2VlbiBIb3N0IGFuZCBXZWJFeHRlbnNpb25BUElcbiAqXG4gKiBrZXkgaXMgaW4gdGhlIGhvc3QsIHJlc3VsdCB0eXBlIGlzIGluIHRoZSBXZWJFeHRlbnNpb24uXG4gKi9cbnR5cGUgQnJvd3NlclJlZmVyZW5jZSA9IHsgW2tleSBpbiBrZXlvZiB0eXBlb2YgSG9zdF06ICguLi5hcmdzOiB1bmtub3duW10pID0+IFByb21pc2U8dW5rbm93bj4gfSAmIHtcbiAgICAnYnJvd3Nlci5kb3dubG9hZHMuZG93bmxvYWQnOiB0eXBlb2YgYnJvd3Nlci5kb3dubG9hZHMuZG93bmxvYWRcbiAgICAnYnJvd3Nlci50YWJzLmNyZWF0ZSc6IHR5cGVvZiBicm93c2VyLnRhYnMuY3JlYXRlXG59XG50eXBlIFByb21pc2VPZjxUPiA9IFQgZXh0ZW5kcyBQcm9taXNlPGluZmVyIFU+ID8gVSA6IG5ldmVyXG4iLCJpbXBvcnQgeyBIb3N0IH0gZnJvbSAnLi4vUlBDJ1xuaW1wb3J0IHsgZGVjb2RlU3RyaW5nT3JCbG9iIH0gZnJvbSAnLi4vdXRpbHMvU3RyaW5nT3JCbG9iJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmV0Y2goZXh0ZW5zaW9uSUQ6IHN0cmluZywgb3JpZ0ZldGNoOiB0eXBlb2YgZmV0Y2gpOiB0eXBlb2YgZmV0Y2gge1xuICAgIHJldHVybiBuZXcgUHJveHkoZmV0Y2gsIHtcbiAgICAgICAgYXN5bmMgYXBwbHkodGFyZ2V0LCB0aGlzQXJnLCBbcmVxdWVzdEluZm8sIHJlcXVlc3RJbml0XTogUGFyYW1ldGVyczx0eXBlb2YgZmV0Y2g+KSB7XG4gICAgICAgICAgICBjb25zdCB7IG1ldGhvZCwgdXJsIH0gPSBuZXcgUmVxdWVzdChyZXF1ZXN0SW5mbywgcmVxdWVzdEluaXQpXG4gICAgICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoJ2hvbG9mbG93cy1leHRlbnNpb246Ly8nICsgZXh0ZW5zaW9uSUQgKyAnLycpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9yaWdGZXRjaChyZXF1ZXN0SW5mbywgcmVxdWVzdEluaXQpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEhvc3QuZmV0Y2goZXh0ZW5zaW9uSUQsIHsgbWV0aG9kLCB1cmwgfSlcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgZGVjb2RlU3RyaW5nT3JCbG9iKHJlc3VsdC5kYXRhKVxuICAgICAgICAgICAgICAgIGlmIChkYXRhID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoJycpXG4gICAgICAgICAgICAgICAgY29uc3QgcmV0dXJuVmFsdWUgPSBuZXcgUmVzcG9uc2UoZGF0YSwgcmVzdWx0KVxuICAgICAgICAgICAgICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0pXG59XG4iLCJsZXQgbGFzdFVzZXJBY3RpdmUgPSAwXG5sZXQgbm93ID0gRGF0ZS5ub3cuYmluZChEYXRlKVxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAnY2xpY2snLFxuICAgICgpID0+IHtcbiAgICAgICAgbGFzdFVzZXJBY3RpdmUgPSBub3coKVxuICAgIH0sXG4gICAgeyBjYXB0dXJlOiB0cnVlLCBwYXNzaXZlOiB0cnVlIH0sXG4pXG5leHBvcnQgZnVuY3Rpb24gaGFzVmFsaWRVc2VySW50ZXJhY3RpdmUoKSB7XG4gICAgcmV0dXJuIG5vdygpIC0gbGFzdFVzZXJBY3RpdmUgPCAzMDAwXG59XG4iLCJpbXBvcnQgeyBIb3N0IH0gZnJvbSAnLi4vUlBDJ1xuaW1wb3J0IHsgaGFzVmFsaWRVc2VySW50ZXJhY3RpdmUgfSBmcm9tICcuLi91dGlscy9Vc2VySW50ZXJhY3RpdmUnXG5cbmV4cG9ydCBmdW5jdGlvbiBvcGVuRW5oYW5jZWQoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6IHR5cGVvZiBvcGVuIHtcbiAgICByZXR1cm4gKHVybCA9ICdhYm91dDpibGFuaycsIHRhcmdldD86IHN0cmluZywgZmVhdHVyZXM/OiBzdHJpbmcsIHJlcGxhY2U/OiBib29sZWFuKSA9PiB7XG4gICAgICAgIGlmICghaGFzVmFsaWRVc2VySW50ZXJhY3RpdmUoKSkgcmV0dXJuIG51bGxcbiAgICAgICAgaWYgKCh0YXJnZXQgJiYgdGFyZ2V0ICE9PSAnX2JsYW5rJykgfHwgZmVhdHVyZXMgfHwgcmVwbGFjZSlcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVW5zdXBwb3J0ZWQgb3BlbicsIHVybCwgdGFyZ2V0LCBmZWF0dXJlcywgcmVwbGFjZSlcbiAgICAgICAgSG9zdFsnYnJvd3Nlci50YWJzLmNyZWF0ZSddKGV4dGVuc2lvbklELCB7XG4gICAgICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgICAgICB1cmwsXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xvc2VFbmhhbmNlZChleHRlbnNpb25JRDogc3RyaW5nKTogdHlwZW9mIGNsb3NlIHtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoIWhhc1ZhbGlkVXNlckludGVyYWN0aXZlKCkpIHJldHVyblxuICAgICAgICBIb3N0Wydicm93c2VyLnRhYnMucXVlcnknXShleHRlbnNpb25JRCwgeyBhY3RpdmU6IHRydWUgfSkudGhlbihpID0+XG4gICAgICAgICAgICBIb3N0Wydicm93c2VyLnRhYnMucmVtb3ZlJ10oZXh0ZW5zaW9uSUQsIGlbMF0uaWQhKSxcbiAgICAgICAgKVxuICAgIH1cbn1cbiIsIi8qKlxuICogVGhpcyBmaWxlIHBhcnRseSBpbXBsZW1lbnRzIFhSYXlWaXNpb24gaW4gRmlyZWZveCdzIFdlYkV4dGVuc2lvbiBzdGFuZGFyZFxuICogYnkgY3JlYXRlIGEgdHdvLXdheSBKUyBzYW5kYm94IGJ1dCBzaGFyZWQgRE9NIGVudmlyb25tZW50LlxuICpcbiAqIGNsYXNzIFdlYkV4dGVuc2lvbkNvbnRlbnRTY3JpcHRFbnZpcm9ubWVudCB3aWxsIHJldHVybiBhIG5ldyBKUyBlbnZpcm9ubWVudFxuICogdGhhdCBoYXMgYSBcImJyb3dzZXJcIiB2YXJpYWJsZSBpbnNpZGUgb2YgaXQgYW5kIGEgY2xvbmUgb2YgdGhlIGN1cnJlbnQgRE9NIGVudmlyb25tZW50XG4gKiB0byBwcmV2ZW50IHRoZSBtYWluIHRocmVhZCBoYWNrIG9uIHByb3RvdHlwZSB0byBhY2Nlc3MgdGhlIGNvbnRlbnQgb2YgQ29udGVudFNjcmlwdHMuXG4gKlxuICogIyMgQ2hlY2tsaXN0OlxuICogLSBbb10gQ29udGVudFNjcmlwdCBjYW5ub3QgYWNjZXNzIG1haW4gdGhyZWFkXG4gKiAtIFs/XSBNYWluIHRocmVhZCBjYW5ub3QgYWNjZXNzIENvbnRlbnRTY3JpcHRcbiAqIC0gW29dIENvbnRlbnRTY3JpcHQgY2FuIGFjY2VzcyBtYWluIHRocmVhZCdzIERPTVxuICogLSBbIF0gQ29udGVudFNjcmlwdCBtb2RpZmljYXRpb24gb24gRE9NIHByb3RvdHlwZSBpcyBub3QgZGlzY292ZXJhYmxlIGJ5IG1haW4gdGhyZWFkXG4gKiAtIFsgXSBNYWluIHRocmVhZCBtb2RpZmljYXRpb24gb24gRE9NIHByb3RvdHlwZSBpcyBub3QgZGlzY292ZXJhYmxlIGJ5IENvbnRlbnRTY3JpcHRcbiAqL1xuaW1wb3J0IFJlYWxtQ29uc3RydWN0b3IsIHsgUmVhbG0gfSBmcm9tICdyZWFsbXMtc2hpbSdcblxuaW1wb3J0IHsgQnJvd3NlckZhY3RvcnkgfSBmcm9tICcuL2Jyb3dzZXInXG5pbXBvcnQgeyBNYW5pZmVzdCB9IGZyb20gJy4uL0V4dGVuc2lvbnMnXG5pbXBvcnQgeyBlbmhhbmNlVVJMIH0gZnJvbSAnLi9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTCdcbmltcG9ydCB7IGNyZWF0ZUZldGNoIH0gZnJvbSAnLi9mZXRjaCdcbmltcG9ydCB7IG9wZW5FbmhhbmNlZCwgY2xvc2VFbmhhbmNlZCB9IGZyb20gJy4vd2luZG93Lm9wZW4rY2xvc2UnXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IGdldCB0aGUgcHJvdG90eXBlIGNoYWluIG9mIGFuIE9iamVjdFxuICogQHBhcmFtIG8gT2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGdldFByb3RvdHlwZUNoYWluKG86IGFueSwgXzogYW55W10gPSBbXSk6IGFueVtdIHtcbiAgICBpZiAobyA9PT0gdW5kZWZpbmVkIHx8IG8gPT09IG51bGwpIHJldHVybiBfXG4gICAgY29uc3QgeSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvKVxuICAgIGlmICh5ID09PSBudWxsIHx8IHkgPT09IHVuZGVmaW5lZCB8fCB5ID09PSBPYmplY3QucHJvdG90eXBlKSByZXR1cm4gX1xuICAgIHJldHVybiBnZXRQcm90b3R5cGVDaGFpbihPYmplY3QuZ2V0UHJvdG90eXBlT2YoeSksIFsuLi5fLCB5XSlcbn1cbi8qKlxuICogQXBwbHkgYWxsIFdlYkFQSXMgdG8gdGhlIGNsZWFuIHNhbmRib3ggY3JlYXRlZCBieSBSZWFsbVxuICovXG5jb25zdCBQcmVwYXJlV2ViQVBJcyA9ICgoKSA9PiB7XG4gICAgLy8gPyByZXBsYWNlIEZ1bmN0aW9uIHdpdGggcG9sbHV0ZWQgdmVyc2lvbiBieSBSZWFsbXNcbiAgICAvLyAhIHRoaXMgbGVha3MgdGhlIHNhbmRib3ghXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdC5nZXRQcm90b3R5cGVPZigoKSA9PiB7fSksICdjb25zdHJ1Y3RvcicsIHtcbiAgICAgICAgdmFsdWU6IGdsb2JhbFRoaXMuRnVuY3Rpb24sXG4gICAgfSlcbiAgICBjb25zdCByZWFsV2luZG93ID0gd2luZG93XG4gICAgY29uc3Qgd2ViQVBJcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHdpbmRvdylcbiAgICBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KHdlYkFQSXMsICd3aW5kb3cnKVxuICAgIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkod2ViQVBJcywgJ2dsb2JhbFRoaXMnKVxuICAgIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkod2ViQVBJcywgJ3NlbGYnKVxuICAgIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkod2ViQVBJcywgJ2dsb2JhbCcpXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KERvY3VtZW50LnByb3RvdHlwZSwgJ2RlZmF1bHRWaWV3Jywge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH0sXG4gICAgfSlcbiAgICByZXR1cm4gKHNhbmRib3hSb290OiB0eXBlb2YgZ2xvYmFsVGhpcykgPT4ge1xuICAgICAgICBjb25zdCBjbG9uZWRXZWJBUElzID0geyAuLi53ZWJBUElzIH1cbiAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoc2FuZGJveFJvb3QpLmZvckVhY2gobmFtZSA9PiBSZWZsZWN0LmRlbGV0ZVByb3BlcnR5KGNsb25lZFdlYkFQSXMsIG5hbWUpKVxuICAgICAgICAvLyA/IENsb25lIFdlYiBBUElzXG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHdlYkFQSXMpIHtcbiAgICAgICAgICAgIFBhdGNoVGhpc09mRGVzY3JpcHRvclRvR2xvYmFsKHdlYkFQSXNba2V5XSwgcmVhbFdpbmRvdylcbiAgICAgICAgfVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2FuZGJveFJvb3QsICd3aW5kb3cnLCB7XG4gICAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIHZhbHVlOiBzYW5kYm94Um9vdCxcbiAgICAgICAgfSlcbiAgICAgICAgT2JqZWN0LmFzc2lnbihzYW5kYm94Um9vdCwgeyBnbG9iYWxUaGlzOiBzYW5kYm94Um9vdCB9KVxuICAgICAgICBjb25zdCBwcm90byA9IGdldFByb3RvdHlwZUNoYWluKHJlYWxXaW5kb3cpXG4gICAgICAgICAgICAubWFwKE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKVxuICAgICAgICAgICAgLnJlZHVjZVJpZ2h0KChwcmV2aW91cywgY3VycmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvcHkgPSB7IC4uLmN1cnJlbnQgfVxuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IGluIGNvcHkpIHtcbiAgICAgICAgICAgICAgICAgICAgUGF0Y2hUaGlzT2ZEZXNjcmlwdG9yVG9HbG9iYWwoY29weVtrZXldLCByZWFsV2luZG93KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShwcmV2aW91cywgY29weSlcbiAgICAgICAgICAgIH0sIHt9KVxuICAgICAgICBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc2FuZGJveFJvb3QsIHByb3RvKVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhzYW5kYm94Um9vdCwgY2xvbmVkV2ViQVBJcylcbiAgICB9XG59KSgpXG4vKipcbiAqIEV4ZWN1dGlvbiBlbnZpcm9ubWVudCBvZiBDb250ZW50U2NyaXB0XG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnQgaW1wbGVtZW50cyBSZWFsbTx0eXBlb2YgZ2xvYmFsVGhpcyAmIHsgYnJvd3NlcjogdHlwZW9mIGJyb3dzZXIgfT4ge1xuICAgIHByaXZhdGUgcmVhbG0gPSBSZWFsbUNvbnN0cnVjdG9yLm1ha2VSb290UmVhbG0oKVxuICAgIGdldCBnbG9iYWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWxtLmdsb2JhbFxuICAgIH1cbiAgICByZWFkb25seSBbU3ltYm9sLnRvU3RyaW5nVGFnXSA9ICdSZWFsbSdcbiAgICAvKipcbiAgICAgKiBFdmFsdWF0ZSBhIHN0cmluZyBpbiB0aGUgY29udGVudCBzY3JpcHQgZW52aXJvbm1lbnRcbiAgICAgKiBAcGFyYW0gc291cmNlVGV4dCBTb3VyY2UgdGV4dFxuICAgICAqL1xuICAgIGV2YWx1YXRlKHNvdXJjZVRleHQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFsbS5ldmFsdWF0ZShzb3VyY2VUZXh0KVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgYSBuZXcgcnVubmluZyBleHRlbnNpb24gZm9yIGFuIGNvbnRlbnQgc2NyaXB0LlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRCBUaGUgZXh0ZW5zaW9uIElEXG4gICAgICogQHBhcmFtIG1hbmlmZXN0IFRoZSBtYW5pZmVzdCBvZiB0aGUgZXh0ZW5zaW9uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHVibGljIGV4dGVuc2lvbklEOiBzdHJpbmcsIHB1YmxpYyBtYW5pZmVzdDogTWFuaWZlc3QpIHtcbiAgICAgICAgdGhpcy5pbml0KClcbiAgICB9XG4gICAgcHJpdmF0ZSBpbml0KCkge1xuICAgICAgICBQcmVwYXJlV2ViQVBJcyh0aGlzLmdsb2JhbClcbiAgICAgICAgdGhpcy5nbG9iYWwuYnJvd3NlciA9IEJyb3dzZXJGYWN0b3J5KHRoaXMuZXh0ZW5zaW9uSUQsIHRoaXMubWFuaWZlc3QpXG4gICAgICAgIHRoaXMuZ2xvYmFsLlVSTCA9IGVuaGFuY2VVUkwodGhpcy5nbG9iYWwuVVJMLCB0aGlzLmV4dGVuc2lvbklEKVxuICAgICAgICB0aGlzLmdsb2JhbC5mZXRjaCA9IGNyZWF0ZUZldGNoKHRoaXMuZXh0ZW5zaW9uSUQsIHdpbmRvdy5mZXRjaClcbiAgICAgICAgdGhpcy5nbG9iYWwub3BlbiA9IG9wZW5FbmhhbmNlZCh0aGlzLmV4dGVuc2lvbklEKVxuICAgICAgICB0aGlzLmdsb2JhbC5jbG9zZSA9IGNsb3NlRW5oYW5jZWQodGhpcy5leHRlbnNpb25JRClcbiAgICB9XG59XG4vKipcbiAqIE1hbnkgbWV0aG9kcyBvbiBgd2luZG93YCByZXF1aXJlcyBgdGhpc2AgcG9pbnRzIHRvIGEgV2luZG93IG9iamVjdFxuICogTGlrZSBgYWxlcnQoKWAuIElmIHlvdSBjYWxsIGFsZXJ0IGFzIGBjb25zdCB3ID0geyBhbGVydCB9OyB3LmFsZXJ0KClgLFxuICogdGhlcmUgd2lsbCBiZSBhbiBJbGxlZ2FsIGludm9jYXRpb24uXG4gKlxuICogVG8gcHJldmVudCBgdGhpc2AgYmluZGluZyBsb3N0LCB3ZSBuZWVkIHRvIHJlYmluZCBpdC5cbiAqXG4gKiBAcGFyYW0gZGVzYyBQcm9wZXJ0eURlc2NyaXB0b3JcbiAqIEBwYXJhbSBnbG9iYWwgVGhlIHJlYWwgd2luZG93XG4gKi9cbmZ1bmN0aW9uIFBhdGNoVGhpc09mRGVzY3JpcHRvclRvR2xvYmFsKGRlc2M6IFByb3BlcnR5RGVzY3JpcHRvciwgZ2xvYmFsOiBXaW5kb3cpIHtcbiAgICBjb25zdCB7IGdldCwgc2V0LCB2YWx1ZSB9ID0gZGVzY1xuICAgIGlmIChnZXQpIGRlc2MuZ2V0ID0gKCkgPT4gZ2V0LmFwcGx5KGdsb2JhbClcbiAgICBpZiAoc2V0KSBkZXNjLnNldCA9ICh2YWw6IGFueSkgPT4gc2V0LmFwcGx5KGdsb2JhbCwgdmFsKVxuICAgIGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY29uc3QgZGVzYzIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyh2YWx1ZSlcbiAgICAgICAgZGVzYy52YWx1ZSA9IGZ1bmN0aW9uKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICBpZiAobmV3LnRhcmdldCkgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KHZhbHVlLCBhcmdzLCBuZXcudGFyZ2V0KVxuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuYXBwbHkodmFsdWUsIGdsb2JhbCwgYXJncylcbiAgICAgICAgfVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhkZXNjLnZhbHVlLCBkZXNjMilcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vID8gRm9yIHVua25vd24gcmVhc29uIHRoaXMgZmFpbCBmb3Igc29tZSBvYmplY3RzIG9uIFNhZmFyaS5cbiAgICAgICAgICAgIGRlc2MudmFsdWUucHJvdG90eXBlID0gdmFsdWUucHJvdG90eXBlXG4gICAgICAgIH0gY2F0Y2gge31cbiAgICB9XG59XG4iLCJjb25zdCBub3JtYWxpemVkID0gU3ltYm9sKCdOb3JtYWxpemVkIHJlc291cmNlcycpXG5mdW5jdGlvbiBub3JtYWxpemVQYXRoKHBhdGg6IHN0cmluZywgZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIGNvbnN0IHByZWZpeCA9IGdldFByZWZpeChleHRlbnNpb25JRClcbiAgICBpZiAocGF0aC5zdGFydHNXaXRoKHByZWZpeCkpIHJldHVybiBwYXRoXG4gICAgZWxzZSByZXR1cm4gbmV3IFVSTChwYXRoLCBwcmVmaXgpLnRvSlNPTigpXG59XG5mdW5jdGlvbiBnZXRQcmVmaXgoZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIHJldHVybiAnaG9sb2Zsb3dzLWV4dGVuc2lvbjovLycgKyBleHRlbnNpb25JRCArICcvJ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzb3VyY2UoZXh0ZW5zaW9uSUQ6IHN0cmluZywgcmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIC8vIE5vcm1hbGl6YXRpb24gdGhlIHJlc291cmNlc1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBpZiAoIXJlc291cmNlc1tub3JtYWxpemVkXSkge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiByZXNvdXJjZXMpIHtcbiAgICAgICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aChnZXRQcmVmaXgoZXh0ZW5zaW9uSUQpKSkgY29udGludWVcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IHJlc291cmNlc1trZXldXG4gICAgICAgICAgICBkZWxldGUgcmVzb3VyY2VzW2tleV1cbiAgICAgICAgICAgIHJlc291cmNlc1tuZXcgVVJMKGtleSwgZ2V0UHJlZml4KGV4dGVuc2lvbklEKSkudG9KU09OKCldID0gb2JqXG4gICAgICAgIH1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXNvdXJjZXNbbm9ybWFsaXplZF0gPSB0cnVlXG4gICAgfVxuICAgIHJldHVybiByZXNvdXJjZXNbbm9ybWFsaXplUGF0aChwYXRoLCBleHRlbnNpb25JRCldXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRSZXNvdXJjZUFzeW5jKGV4dGVuc2lvbklEOiBzdHJpbmcsIHJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiwgcGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgcHJlbG9hZGVkID0gZ2V0UmVzb3VyY2UoZXh0ZW5zaW9uSUQsIHJlc291cmNlcywgcGF0aClcbiAgICBpZiAocHJlbG9hZGVkKSByZXR1cm4gcHJlbG9hZGVkXG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKG5vcm1hbGl6ZVBhdGgocGF0aCwgZXh0ZW5zaW9uSUQpKVxuICAgIGlmIChyZXNwb25zZS5vaykgcmV0dXJuIHJlc3BvbnNlLnRleHQoKVxuICAgIHJldHVybiB1bmRlZmluZWRcbn1cbiIsImltcG9ydCB7IG1hdGNoaW5nVVJMIH0gZnJvbSAnLi91dGlscy9VUkxNYXRjaGVyJ1xuaW1wb3J0IHsgV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50IH0gZnJvbSAnLi9zaGltcy9YUmF5VmlzaW9uJ1xuaW1wb3J0IHsgQnJvd3NlckZhY3RvcnkgfSBmcm9tICcuL3NoaW1zL2Jyb3dzZXInXG5pbXBvcnQgeyBjcmVhdGVGZXRjaCB9IGZyb20gJy4vc2hpbXMvZmV0Y2gnXG5pbXBvcnQgeyBlbmhhbmNlVVJMIH0gZnJvbSAnLi9zaGltcy9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTCdcbmltcG9ydCB7IG9wZW5FbmhhbmNlZCwgY2xvc2VFbmhhbmNlZCB9IGZyb20gJy4vc2hpbXMvd2luZG93Lm9wZW4rY2xvc2UnXG5pbXBvcnQgeyBnZXRSZXNvdXJjZSwgZ2V0UmVzb3VyY2VBc3luYyB9IGZyb20gJy4vdXRpbHMvUmVzb3VyY2VzJ1xuXG5leHBvcnQgdHlwZSBXZWJFeHRlbnNpb25JRCA9IHN0cmluZ1xuZXhwb3J0IHR5cGUgTWFuaWZlc3QgPSBQYXJ0aWFsPGJyb3dzZXIucnVudGltZS5NYW5pZmVzdD4gJlxuICAgIFBpY2s8YnJvd3Nlci5ydW50aW1lLk1hbmlmZXN0LCAnbmFtZScgfCAndmVyc2lvbicgfCAnbWFuaWZlc3RfdmVyc2lvbic+XG5leHBvcnQgaW50ZXJmYWNlIFdlYkV4dGVuc2lvbiB7XG4gICAgbWFuaWZlc3Q6IE1hbmlmZXN0XG4gICAgZW52aXJvbm1lbnQ6IFdlYkV4dGVuc2lvbkNvbnRlbnRTY3JpcHRFbnZpcm9ubWVudFxuICAgIHByZWxvYWRlZFJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPlxufVxuZXhwb3J0IGNvbnN0IHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24gPSBuZXcgTWFwPFdlYkV4dGVuc2lvbklELCBXZWJFeHRlbnNpb24+KClcbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlcldlYkV4dGVuc2lvbihcbiAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgIG1hbmlmZXN0OiBNYW5pZmVzdCxcbiAgICBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fSxcbikge1xuICAgIGNvbnN0IGVudmlyb25tZW50OiAnY29udGVudCBzY3JpcHQnIHwgJ2JhY2tncm91bmQgc2NyaXB0JyA9XG4gICAgICAgIGxvY2F0aW9uLmhyZWYuc3RhcnRzV2l0aCgnaG9sb2Zsb3dzLWV4dGVuc2lvbjovLycpICYmIGxvY2F0aW9uLmhyZWYuZW5kc1dpdGgoJ19nZW5lcmF0ZWRfYmFja2dyb3VuZF9wYWdlLmh0bWwnKVxuICAgICAgICAgICAgPyAnYmFja2dyb3VuZCBzY3JpcHQnXG4gICAgICAgICAgICA6ICdjb250ZW50IHNjcmlwdCdcbiAgICBjb25zb2xlLmRlYnVnKFxuICAgICAgICBgW1dlYkV4dGVuc2lvbl0gTG9hZGluZyBleHRlbnNpb24gJHttYW5pZmVzdC5uYW1lfSgke2V4dGVuc2lvbklEfSkgd2l0aCBtYW5pZmVzdGAsXG4gICAgICAgIG1hbmlmZXN0LFxuICAgICAgICBgYW5kIHByZWxvYWRlZCByZXNvdXJjZWAsXG4gICAgICAgIHByZWxvYWRlZFJlc291cmNlcyxcbiAgICAgICAgYGluICR7ZW52aXJvbm1lbnR9IG1vZGVgLFxuICAgIClcbiAgICBpZiAobG9jYXRpb24ucHJvdG9jb2wgPT09ICdob2xvZmxvd3MtZXh0ZW5zaW9uOicpIHByZXBhcmVCYWNrZ3JvdW5kQW5kT3B0aW9uc1BhZ2VFbnZpcm9ubWVudChleHRlbnNpb25JRCwgbWFuaWZlc3QpXG5cbiAgICB0cnkge1xuICAgICAgICBpZiAoZW52aXJvbm1lbnQgPT09ICdjb250ZW50IHNjcmlwdCcpIHtcbiAgICAgICAgICAgIHVudGlsRG9jdW1lbnRSZWFkeSgpLnRoZW4oKCkgPT4gTG9hZENvbnRlbnRTY3JpcHQobWFuaWZlc3QsIGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMpKVxuICAgICAgICB9IGVsc2UgaWYgKGVudmlyb25tZW50ID09PSAnYmFja2dyb3VuZCBzY3JpcHQnKSB7XG4gICAgICAgICAgICB1bnRpbERvY3VtZW50UmVhZHkoKS50aGVuKCgpID0+IExvYWRCYWNrZ3JvdW5kU2NyaXB0KG1hbmlmZXN0LCBleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1dlYkV4dGVuc2lvbl0gdW5rbm93biBydW5uaW5nIGVudmlyb25tZW50ICR7ZW52aXJvbm1lbnR9YClcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgIH1cbiAgICByZXR1cm4gcmVnaXN0ZXJlZFdlYkV4dGVuc2lvblxufVxuXG5mdW5jdGlvbiB1bnRpbERvY3VtZW50UmVhZHkoKSB7XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIHJlc29sdmUsIHsgb25jZTogdHJ1ZSwgcGFzc2l2ZTogdHJ1ZSB9KVxuICAgIH0pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIExvYWRCYWNrZ3JvdW5kU2NyaXB0KFxuICAgIG1hbmlmZXN0OiBNYW5pZmVzdCxcbiAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgIHByZWxvYWRlZFJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbikge1xuICAgIGlmICghbWFuaWZlc3QuYmFja2dyb3VuZCkgcmV0dXJuXG4gICAgY29uc3QgeyBwYWdlLCBzY3JpcHRzIH0gPSBtYW5pZmVzdC5iYWNrZ3JvdW5kIGFzIGFueVxuICAgIGlmIChwYWdlKSByZXR1cm4gY29uc29sZS53YXJuKCdbV2ViRXh0ZW5zaW9uXSBtYW5pZmVzdC5iYWNrZ3JvdW5kLnBhZ2UgaXMgbm90IHN1cHBvcnRlZCB5ZXQhJylcbiAgICBpZiAobG9jYXRpb24uaG9zdG5hbWUgIT09ICdsb2NhbGhvc3QnICYmICFsb2NhdGlvbi5ocmVmLnN0YXJ0c1dpdGgoJ2hvbG9mbG93cy1leHRlbnNpb246Ly8nKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBCYWNrZ3JvdW5kIHNjcmlwdCBvbmx5IGFsbG93ZWQgaW4gbG9jYWxob3N0KGZvciBkZWJ1Z2dpbmcpIGFuZCBob2xvZmxvd3MtZXh0ZW5zaW9uOi8vYClcbiAgICB9XG4gICAge1xuICAgICAgICBjb25zdCBzcmMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEhUTUxTY3JpcHRFbGVtZW50LnByb3RvdHlwZSwgJ3NyYycpIVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSFRNTFNjcmlwdEVsZW1lbnQucHJvdG90eXBlLCAnc3JjJywge1xuICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzcmMuZ2V0IS5jYWxsKHRoaXMpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHBhdGgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTG9hZGluZyAnLCBwYXRoKVxuICAgICAgICAgICAgICAgIGNvbnN0IHByZWxvYWRlZCA9IGdldFJlc291cmNlKGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMsIHBhdGgpXG4gICAgICAgICAgICAgICAgaWYgKHByZWxvYWRlZCkgUnVuSW5HbG9iYWxTY29wZShleHRlbnNpb25JRCwgcHJlbG9hZGVkKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgZ2V0UmVzb3VyY2VBc3luYyhleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzLCBwYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oY29kZSA9PiBjb2RlIHx8IFByb21pc2UucmVqZWN0PHN0cmluZz4oJ0xvYWRpbmcgcmVzb3VyY2UgZmFpbGVkJykpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihjb2RlID0+IFJ1bkluR2xvYmFsU2NvcGUoZXh0ZW5zaW9uSUQsIGNvZGUpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGUgPT4gY29uc29sZS5lcnJvcihgRmFpbGVkIHdoZW4gbG9hZGluZyByZXNvdXJjZWAsIHBhdGgpKVxuICAgICAgICAgICAgICAgIHNyYy5zZXQhLmNhbGwodGhpcywgcGF0aClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICB9XG4gICAgZm9yIChjb25zdCBwYXRoIG9mIChzY3JpcHRzIGFzIHN0cmluZ1tdKSB8fCBbXSkge1xuICAgICAgICBjb25zdCBwcmVsb2FkZWQgPSBhd2FpdCBnZXRSZXNvdXJjZUFzeW5jKGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMsIHBhdGgpXG4gICAgICAgIGlmIChwcmVsb2FkZWQpIHtcbiAgICAgICAgICAgIC8vID8gUnVuIGl0IGluIGdsb2JhbCBzY29wZS5cbiAgICAgICAgICAgIFJ1bkluR2xvYmFsU2NvcGUoZXh0ZW5zaW9uSUQsIHByZWxvYWRlZClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFtXZWJFeHRlbnNpb25dIEJhY2tncm91bmQgc2NyaXB0cyBub3QgZm91bmQgZm9yICR7bWFuaWZlc3QubmFtZX06ICR7cGF0aH1gKVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gcHJlcGFyZUJhY2tncm91bmRBbmRPcHRpb25zUGFnZUVudmlyb25tZW50KGV4dGVuc2lvbklEOiBzdHJpbmcsIG1hbmlmZXN0OiBNYW5pZmVzdCkge1xuICAgIE9iamVjdC5hc3NpZ24od2luZG93LCB7XG4gICAgICAgIGJyb3dzZXI6IEJyb3dzZXJGYWN0b3J5KGV4dGVuc2lvbklELCBtYW5pZmVzdCksXG4gICAgICAgIGZldGNoOiBjcmVhdGVGZXRjaChleHRlbnNpb25JRCwgd2luZG93LmZldGNoKSxcbiAgICAgICAgVVJMOiBlbmhhbmNlVVJMKFVSTCwgZXh0ZW5zaW9uSUQpLFxuICAgICAgICBvcGVuOiBvcGVuRW5oYW5jZWQoZXh0ZW5zaW9uSUQpLFxuICAgICAgICBjbG9zZTogY2xvc2VFbmhhbmNlZChleHRlbnNpb25JRCksXG4gICAgfSBhcyBQYXJ0aWFsPHR5cGVvZiBnbG9iYWxUaGlzPilcbn1cblxuZnVuY3Rpb24gUnVuSW5HbG9iYWxTY29wZShleHRlbnNpb25JRDogc3RyaW5nLCBzcmM6IHN0cmluZykge1xuICAgIGlmIChsb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2hvbG9mbG93cy1leHRlbnNpb246JykgcmV0dXJuIG5ldyBGdW5jdGlvbihzcmMpKClcbiAgICBjb25zdCBmID0gbmV3IEZ1bmN0aW9uKGB3aXRoIChcbiAgICAgICAgICAgICAgICBuZXcgUHJveHkod2luZG93LCB7XG4gICAgICAgICAgICAgICAgICAgIGdldCh0YXJnZXQsIGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ2xvY2F0aW9uJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFVSTChcImhvbG9mbG93cy1leHRlbnNpb246Ly8ke2V4dGVuc2lvbklEfS9fZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZS5odG1sXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZih0eXBlb2YgdGFyZ2V0W2tleV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXNjMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHRhcmdldFtrZXldKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGYoLi4uYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3LnRhcmdldCkgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KHRhcmdldFtrZXldLCBhcmdzLCBuZXcudGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5hcHBseSh0YXJnZXRba2V5XSwgd2luZG93LCBhcmdzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhmLCBkZXNjMilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmLnByb3RvdHlwZSA9IHRhcmdldFtrZXldLnByb3RvdHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W2tleV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICkpIHtcbiAgICAgICAgICAgICAgICAke3NyY31cbiAgICAgICAgICAgICAgfWApXG4gICAgZigpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIExvYWRDb250ZW50U2NyaXB0KG1hbmlmZXN0OiBNYW5pZmVzdCwgZXh0ZW5zaW9uSUQ6IHN0cmluZywgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSB7XG4gICAgaWYgKCFyZWdpc3RlcmVkV2ViRXh0ZW5zaW9uLmhhcyhleHRlbnNpb25JRCkpIHtcbiAgICAgICAgY29uc3QgZW52aXJvbm1lbnQgPSBuZXcgV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50KGV4dGVuc2lvbklELCBtYW5pZmVzdClcbiAgICAgICAgY29uc3QgZXh0OiBXZWJFeHRlbnNpb24gPSB7XG4gICAgICAgICAgICBtYW5pZmVzdCxcbiAgICAgICAgICAgIGVudmlyb25tZW50LFxuICAgICAgICAgICAgcHJlbG9hZGVkUmVzb3VyY2VzLFxuICAgICAgICB9XG4gICAgICAgIHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uc2V0KGV4dGVuc2lvbklELCBleHQpXG4gICAgfVxuICAgIGZvciAoY29uc3QgW2luZGV4LCBjb250ZW50XSBvZiAobWFuaWZlc3QuY29udGVudF9zY3JpcHRzIHx8IFtdKS5lbnRyaWVzKCkpIHtcbiAgICAgICAgd2FybmluZ05vdEltcGxlbWVudGVkSXRlbShjb250ZW50LCBpbmRleClcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgbWF0Y2hpbmdVUkwoXG4gICAgICAgICAgICAgICAgbmV3IFVSTChsb2NhdGlvbi5ocmVmKSxcbiAgICAgICAgICAgICAgICBjb250ZW50Lm1hdGNoZXMsXG4gICAgICAgICAgICAgICAgY29udGVudC5leGNsdWRlX21hdGNoZXMgfHwgW10sXG4gICAgICAgICAgICAgICAgY29udGVudC5pbmNsdWRlX2dsb2JzIHx8IFtdLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQuZXhjbHVkZV9nbG9icyB8fCBbXSxcbiAgICAgICAgICAgICAgICBjb250ZW50Lm1hdGNoX2Fib3V0X2JsYW5rLFxuICAgICAgICAgICAgKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtXZWJFeHRlbnNpb25dIExvYWRpbmcgY29udGVudCBzY3JpcHQgZm9yYCwgY29udGVudClcbiAgICAgICAgICAgIGF3YWl0IGxvYWRDb250ZW50U2NyaXB0KGV4dGVuc2lvbklELCBtYW5pZmVzdCwgY29udGVudCwgcHJlbG9hZGVkUmVzb3VyY2VzKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW1dlYkV4dGVuc2lvbl0gVVJMIG1pc21hdGNoZWQuIFNraXAgY29udGVudCBzY3JpcHQgZm9yLCBgLCBjb250ZW50KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZENvbnRlbnRTY3JpcHQoXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgY29udGVudDogTm9uTnVsbGFibGU8TWFuaWZlc3RbJ2NvbnRlbnRfc2NyaXB0cyddPlswXSxcbiAgICBwcmVsb2FkZWRSZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uLmhhcyhleHRlbnNpb25JRClcbiAgICAgICAgPyByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uLmdldChleHRlbnNpb25JRCkhLnByZWxvYWRlZFJlc291cmNlc1xuICAgICAgICA6IHt9LFxuKSB7XG4gICAgY29uc3QgeyBlbnZpcm9ubWVudCB9ID0gcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5nZXQoZXh0ZW5zaW9uSUQpIVxuICAgIGZvciAoY29uc3QgcGF0aCBvZiBjb250ZW50LmpzIHx8IFtdKSB7XG4gICAgICAgIGNvbnN0IHByZWxvYWRlZCA9IGF3YWl0IGdldFJlc291cmNlQXN5bmMoZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcywgcGF0aClcbiAgICAgICAgaWYgKHByZWxvYWRlZCkge1xuICAgICAgICAgICAgZW52aXJvbm1lbnQuZXZhbHVhdGUocHJlbG9hZGVkKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW1dlYkV4dGVuc2lvbl0gQ29udGVudCBzY3JpcHRzIG5vdCBmb3VuZCBmb3IgJHttYW5pZmVzdC5uYW1lfTogJHtwYXRofWApXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHdhcm5pbmdOb3RJbXBsZW1lbnRlZEl0ZW0oY29udGVudDogTm9uTnVsbGFibGU8TWFuaWZlc3RbJ2NvbnRlbnRfc2NyaXB0cyddPlswXSwgaW5kZXg6IG51bWJlcikge1xuICAgIGlmIChjb250ZW50LmFsbF9mcmFtZXMpXG4gICAgICAgIGNvbnNvbGUud2FybihgYWxsX2ZyYW1lcyBub3Qgc3VwcG9ydGVkIHlldC4gRGVmaW5lZCBhdCBtYW5pZmVzdC5jb250ZW50X3NjcmlwdHNbJHtpbmRleH1dLmFsbF9mcmFtZXNgKVxuICAgIGlmIChjb250ZW50LmNzcykgY29uc29sZS53YXJuKGBjc3Mgbm90IHN1cHBvcnRlZCB5ZXQuIERlZmluZWQgYXQgbWFuaWZlc3QuY29udGVudF9zY3JpcHRzWyR7aW5kZXh9XS5jc3NgKVxuICAgIGlmIChjb250ZW50LnJ1bl9hdCAmJiBjb250ZW50LnJ1bl9hdCAhPT0gJ2RvY3VtZW50X3N0YXJ0JylcbiAgICAgICAgY29uc29sZS53YXJuKGBydW5fYXQgbm90IHN1cHBvcnRlZCB5ZXQuIERlZmluZWQgYXQgbWFuaWZlc3QuY29udGVudF9zY3JpcHRzWyR7aW5kZXh9XS5ydW5fYXRgKVxufVxuIiwiaW1wb3J0IHsgcmVnaXN0ZXJXZWJFeHRlbnNpb24gfSBmcm9tICcuL0V4dGVuc2lvbnMnXG5jb25zdCBlbnYgPVxuICAgIGxvY2F0aW9uLmhyZWYuc3RhcnRzV2l0aCgnaG9sb2Zsb3dzLWV4dGVuc2lvbjovLycpICYmIGxvY2F0aW9uLmhyZWYuZW5kc1dpdGgoJ19nZW5lcmF0ZWRfYmFja2dyb3VuZF9wYWdlLmh0bWwnKVxuLy8gIyMgSW5qZWN0IGhlcmVcbi8vID8gdG8gYXZvaWQgcmVnaXN0ZXJXZWJFeHRlbnNpb24gb21pdHRlZCBieSByb2xsdXBcbnJlZ2lzdGVyV2ViRXh0ZW5zaW9uLnRvU3RyaW5nKClcblxuLyoqXG4gKiByZWdpc3RlcldlYkV4dGVuc2lvbihcbiAqICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAqICAgICAgbWFuaWZlc3Q6IE1hbmlmZXN0LFxuICogICAgICBwcmVsb2FkZWRSZXNvdXJjZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+XG4gKiApXG4gKi9cbiJdLCJuYW1lcyI6WyJ0aGlzIiwiUmVxdWVzdCIsIlJlYWxtQ29uc3RydWN0b3IiXSwibWFwcGluZ3MiOiI7OztJQUFBOzs7Ozs7OztBQVFBLGFBQWdCLFdBQVcsQ0FDdkIsUUFBYSxFQUNiLE9BQWlCLEVBQ2pCLGVBQXlCLEVBQ3pCLGFBQXVCLEVBQ3ZCLGFBQXVCLEVBQ3ZCLFdBQXFCO1FBRXJCLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQTs7UUFFbEIsS0FBSyxNQUFNLElBQUksSUFBSSxPQUFPO1lBQUUsSUFBSSxlQUFlLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLENBQUM7Z0JBQUUsTUFBTSxHQUFHLElBQUksQ0FBQTtRQUMzRixLQUFLLE1BQU0sSUFBSSxJQUFJLGVBQWU7WUFBRSxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDO2dCQUFFLE1BQU0sR0FBRyxLQUFLLENBQUE7UUFDdkYsSUFBSSxhQUFhLENBQUMsTUFBTTtZQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0NBQWtDLENBQUMsQ0FBQTtRQUMxRSxJQUFJLGFBQWEsQ0FBQyxNQUFNO1lBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFBO1FBQzFFLE9BQU8sTUFBTSxDQUFBO0lBQ2pCLENBQUM7SUFDRDs7O0lBR0EsTUFBTSxrQkFBa0IsR0FBc0I7UUFDMUMsT0FBTztRQUNQLFFBQVE7S0FNWCxDQUFBO0lBQ0QsU0FBUyxlQUFlLENBQUMsQ0FBUyxFQUFFLFFBQWEsRUFBRSxXQUFxQjtRQUNwRSxJQUFJLFFBQVEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxhQUFhLElBQUksV0FBVztZQUFFLE9BQU8sSUFBSSxDQUFBO1FBQ3JFLElBQUksQ0FBQyxLQUFLLFlBQVksRUFBRTtZQUNwQixJQUFJLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO2dCQUFFLE9BQU8sSUFBSSxDQUFBO1lBQy9ELE9BQU8sS0FBSyxDQUFBO1NBQ2Y7UUFDRCxNQUFNLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2hELElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFO1lBQUUsT0FBTyxLQUFLLENBQUE7UUFDbEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsQ0FBQztZQUFFLE9BQU8sS0FBSyxDQUFBO1FBQ3ZGLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDO1lBQUUsT0FBTyxLQUFLLENBQUE7UUFDakUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUFFLE9BQU8sS0FBSyxDQUFBO1FBQ2xGLE9BQU8sSUFBSSxDQUFBO0lBQ2YsQ0FBQztJQUNEOzs7O0lBSUEsU0FBUyxZQUFZLENBQUMsQ0FBUztRQUMzQixJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO1lBQUUsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDN0UsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQzlCLENBQUM7SUFDRCxTQUFTLGdCQUFnQixDQUFDLGVBQXVCLEVBQUUsZUFBdUIsRUFBRSxnQkFBeUI7O1FBRWpHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDO1lBQUUsT0FBTyxLQUFLLENBQUE7O1FBRS9ELElBQUksZ0JBQWdCO1lBQUUsT0FBTyxJQUFJLENBQUE7UUFDakMsSUFBSSxlQUFlLEtBQUssZUFBZTtZQUFFLE9BQU8sSUFBSSxDQUFBO1FBQ3BELE9BQU8sS0FBSyxDQUFBO0lBQ2hCLENBQUM7SUFDRCxTQUFTLFlBQVksQ0FBQyxXQUFtQixFQUFFLFdBQW1COztRQUUxRCxJQUFJLFdBQVcsS0FBSyxLQUFLO1lBQUUsT0FBTyxJQUFJLENBQUE7UUFDdEMsSUFBSSxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ2hDLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQzVDLElBQUksSUFBSSxLQUFLLFdBQVc7Z0JBQUUsT0FBTyxLQUFLLENBQUE7WUFDdEMsT0FBTyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQ3BDO1FBQ0QsT0FBTyxXQUFXLEtBQUssV0FBVyxDQUFBO0lBQ3RDLENBQUM7SUFDRCxTQUFTLFlBQVksQ0FBQyxXQUFtQixFQUFFLFdBQW1CLEVBQUUsYUFBcUI7UUFDakYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO1lBQUUsT0FBTyxLQUFLLENBQUE7UUFDOUMsSUFBSSxXQUFXLEtBQUssSUFBSTtZQUFFLE9BQU8sSUFBSSxDQUFBOztRQUVyQyxJQUFJLFdBQVcsS0FBSyxXQUFXLElBQUksYUFBYSxLQUFLLEVBQUU7WUFBRSxPQUFPLElBQUksQ0FBQTs7UUFFcEUsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFFLE9BQU8sSUFBSSxDQUFBO1FBQ3RHLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFBRSxPQUFPLFdBQVcsS0FBSyxXQUFXLENBQUE7UUFDdkUsT0FBTyxDQUFDLElBQUksQ0FBQyw2Q0FBNkMsRUFBRSxXQUFXLENBQUMsQ0FBQTtRQUN4RSxPQUFPLElBQUksQ0FBQTtJQUNmLENBQUM7Ozs7Ozs7OztJQ3JGRCxDQUFDLFVBQVUsTUFBTSxFQUFFLE9BQU8sRUFBRTtNQUMxQixDQUErRCxjQUFjLEdBQUcsT0FBTyxFQUFFLENBRXRDLENBQUM7S0FDckQsQ0FBQ0EsY0FBSSxFQUFFLFlBQVk7Ozs7OztNQU9sQixTQUFTLFlBQVksQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLFNBQVMsRUFBRTtRQUN4QyxNQUFNLEdBQUcsR0FBRyxDQUFDLG1DQUFtQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7UUFJdEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixJQUFJLEdBQUcsRUFBRTs7VUFFUCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7O1VBRXhCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDL0I7OztRQUdELFNBQVM7UUFDVCxNQUFNLEdBQUcsQ0FBQztPQUNYOztNQUVELFNBQVMsTUFBTSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUU7UUFDbEMsSUFBSSxDQUFDLFNBQVMsRUFBRTtVQUNkLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN2QjtPQUNGOzs7TUFHRCxTQUFTLGFBQWEsQ0FBQyxHQUFHLEVBQUU7UUFDMUIsT0FBTyxHQUFHLENBQUM7T0FDWjs7Ozs7TUFLRCxTQUFTLGVBQWUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFO1FBQzdDLE1BQU07VUFDSixhQUFhO1VBQ2IsZUFBZTtVQUNmLGNBQWM7VUFDZCxhQUFhO1NBQ2QsR0FBRyxTQUFTLENBQUM7Ozs7Ozs7O1FBUWQsTUFBTSxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLE1BQU0sQ0FBQzs7UUFFNUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsQ0FBQztVQUNoQyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUM7VUFDeEIsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDO1VBQzFCLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDO1VBQ2xDLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQztVQUM1QixDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUM7VUFDeEIsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDO1NBQ3ZCLENBQUMsQ0FBQzs7OztRQUlILFNBQVMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxFQUFFO1VBQ3pDLElBQUk7WUFDRixPQUFPLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1dBQ3hCLENBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEVBQUU7O2NBRXZCLE1BQU0sR0FBRyxDQUFDO2FBQ1g7WUFDRCxJQUFJLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDO1lBQzVCLElBQUk7Ozs7Ozs7Ozs7O2NBV0YsS0FBSyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztjQUN0QixRQUFRLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2NBQzVCLE1BQU0sR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDOzs7YUFHckMsQ0FBQyxPQUFPLE9BQU8sRUFBRTs7O2NBR2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7YUFDbEM7WUFDRCxNQUFNLGdCQUFnQixHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUM7WUFDL0QsSUFBSTtjQUNGLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUN0QyxDQUFDLE9BQU8sSUFBSSxFQUFFO2NBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7Y0FDcEIsTUFBTSxJQUFJLENBQUM7YUFDWjtXQUNGO1NBQ0Y7O1FBRUQsTUFBTSxLQUFLLENBQUM7VUFDVixXQUFXLEdBQUc7Ozs7Ozs7O1lBUVosTUFBTSxJQUFJLFNBQVMsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1dBQ25EOztVQUVELE9BQU8sYUFBYSxDQUFDLE9BQU8sRUFBRTs7WUFFNUIsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQzs7O1lBRzFCLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbEMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdkQsT0FBTyxDQUFDLENBQUM7V0FDVjs7VUFFRCxPQUFPLGVBQWUsR0FBRzs7WUFFdkIsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsQyxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hELE9BQU8sQ0FBQyxDQUFDO1dBQ1Y7Ozs7OztVQU1ELElBQUksTUFBTSxHQUFHOzs7OztZQUtYLE9BQU8sZ0JBQWdCLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO1dBQy9DOztVQUVELFFBQVEsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFOztZQUV0QixPQUFPLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1dBQzdEO1NBQ0Y7O1FBRUQsZ0JBQWdCLENBQUMsS0FBSyxFQUFFO1VBQ3RCLFFBQVEsRUFBRTtZQUNSLEtBQUssRUFBRSxNQUFNLGtDQUFrQztZQUMvQyxRQUFRLEVBQUUsS0FBSztZQUNmLFVBQVUsRUFBRSxLQUFLO1lBQ2pCLFlBQVksRUFBRSxJQUFJO1dBQ25CO1NBQ0YsQ0FBQyxDQUFDOztRQUVILGdCQUFnQixDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUU7VUFDaEMsUUFBUSxFQUFFO1lBQ1IsS0FBSyxFQUFFLE1BQU0sZ0JBQWdCO1lBQzdCLFFBQVEsRUFBRSxLQUFLO1lBQ2YsVUFBVSxFQUFFLEtBQUs7WUFDakIsWUFBWSxFQUFFLElBQUk7V0FDbkI7U0FDRixDQUFDLENBQUM7O1FBRUgsT0FBTyxLQUFLLENBQUM7T0FDZDs7Ozs7TUFLRCxNQUFNLHFCQUFxQixHQUFHLGFBQWE7UUFDekMsQ0FBQyxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQztPQUNyQyxDQUFDOztNQUVGLFNBQVMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRTtRQUMvQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsU0FBUyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O1FBZ0JqQyxPQUFPLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztPQUNoRTs7Ozs7Ozs7OztNQVVELE1BQU07UUFDSixNQUFNO1FBQ04sTUFBTTtRQUNOLE1BQU07UUFDTixnQkFBZ0I7O1FBRWhCLHdCQUF3QjtRQUN4Qix5QkFBeUI7UUFDekIsbUJBQW1CO1FBQ25CLGNBQWM7UUFDZCxjQUFjO09BQ2YsR0FBRyxNQUFNLENBQUM7O01BRVgsTUFBTTtRQUNKLEtBQUs7UUFDTCxPQUFPOztPQUVSLEdBQUcsT0FBTyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7TUFrQlosTUFBTSxXQUFXLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDOzs7O01BSXpFLE1BQU0sb0JBQW9CLEdBQUcsV0FBVztVQUNwQyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWM7U0FDaEM7UUFDRCxXQUFXLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1FBQ2pELFFBQVEsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUM7UUFDM0MsU0FBUyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztRQUM3QyxXQUFXLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDO1FBQ2pELFVBQVUsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7UUFDL0MsY0FBYyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDOzs7O01BSTFELE1BQU0seUJBQXlCLEdBQUc7OztRQUdoQyxVQUFVO1FBQ1YsS0FBSztRQUNMLFdBQVc7T0FDWixDQUFDOzs7Ozs7Ozs7TUFTRixNQUFNLHlCQUF5QixHQUFHOzs7O1FBSWhDLFVBQVU7UUFDVixPQUFPO1FBQ1AsWUFBWTtRQUNaLFVBQVU7O1FBRVYsV0FBVztRQUNYLG9CQUFvQjtRQUNwQixXQUFXO1FBQ1gsb0JBQW9COzs7O1FBSXBCLE9BQU87UUFDUCxhQUFhO1FBQ2IsU0FBUztRQUNULFVBQVU7OztRQUdWLFdBQVc7UUFDWCxjQUFjO1FBQ2QsY0FBYzs7UUFFZCxXQUFXO1FBQ1gsWUFBWTtRQUNaLFlBQVk7UUFDWixLQUFLO1FBQ0wsUUFBUTtRQUNSLFFBQVE7OztRQUdSLFlBQVk7UUFDWixnQkFBZ0I7O1FBRWhCLEtBQUs7O1FBRUwsUUFBUTtRQUNSLFFBQVE7UUFDUixhQUFhO1FBQ2IsV0FBVztRQUNYLFlBQVk7UUFDWixtQkFBbUI7UUFDbkIsYUFBYTtRQUNiLGFBQWE7UUFDYixVQUFVO1FBQ1YsU0FBUztRQUNULFNBQVM7Ozs7O1FBS1QsTUFBTTtRQUNOLE1BQU07UUFDTixTQUFTOzs7O1FBSVQsUUFBUTtRQUNSLFVBQVU7Ozs7Ozs7OztPQVNYLENBQUM7O01BRUYsTUFBTSwyQkFBMkIsR0FBRztRQUNsQyxNQUFNO1FBQ04sT0FBTztRQUNQLFNBQVM7UUFDVCxPQUFPO1FBQ1AsUUFBUTtRQUNSLE1BQU07T0FDUCxDQUFDOztNQUVGLFNBQVMsb0JBQW9CLENBQUMsWUFBWSxFQUFFO1FBQzFDLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQzs7UUFFdkIsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFO1VBQzNELEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFO1lBQ3hCLE1BQU0sSUFBSSxHQUFHLHdCQUF3QixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxRCxJQUFJLElBQUksRUFBRTs7OztjQUlSLE1BQU07Z0JBQ0osT0FBTyxJQUFJLElBQUk7Z0JBQ2YsQ0FBQyx3Q0FBd0MsRUFBRSxJQUFJLENBQUMsQ0FBQztlQUNsRCxDQUFDOztjQUVGLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRztnQkFDbEIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO2dCQUNqQixRQUFRO2dCQUNSLFVBQVU7Z0JBQ1YsWUFBWTtlQUNiLENBQUM7YUFDSDtXQUNGO1NBQ0Y7O1FBRUQsUUFBUSxDQUFDLHlCQUF5QixFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7Ozs7Ozs7UUFPekQsUUFBUSxDQUFDLHlCQUF5QixFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7OztRQUd6RCxRQUFRLENBQUMsMkJBQTJCLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQzs7UUFFekQsT0FBTyxXQUFXLENBQUM7T0FDcEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01Bb0JELFNBQVMsZUFBZSxHQUFHO1FBQ3pCLE1BQU07VUFDSixjQUFjO1VBQ2QsZ0JBQWdCO1VBQ2hCLHdCQUF3QjtVQUN4QixjQUFjO1VBQ2QsU0FBUyxFQUFFLGVBQWU7U0FDM0IsR0FBRyxNQUFNLENBQUM7Ozs7Ozs7O1FBUVgsSUFBSTs7O1VBR0YsQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQzVDLENBQUMsT0FBTyxNQUFNLEVBQUU7O1VBRWYsT0FBTztTQUNSOztRQUVELFNBQVMsUUFBUSxDQUFDLEdBQUcsRUFBRTtVQUNyQixJQUFJLEdBQUcsS0FBSyxTQUFTLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtZQUNyQyxNQUFNLElBQUksU0FBUyxDQUFDLENBQUMseUNBQXlDLENBQUMsQ0FBQyxDQUFDO1dBQ2xFO1VBQ0QsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDcEI7O1FBRUQsU0FBUyxjQUFjLENBQUMsR0FBRyxFQUFFO1VBQzNCLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO1lBQzNCLE9BQU8sR0FBRyxDQUFDO1dBQ1o7VUFDRCxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ2pCOztRQUVELFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUU7VUFDaEMsSUFBSSxPQUFPLEdBQUcsS0FBSyxVQUFVLEVBQUU7WUFDN0IsTUFBTSxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7V0FDOUM7VUFDRCxPQUFPLEdBQUcsQ0FBQztTQUNaOztRQUVELGdCQUFnQixDQUFDLGVBQWUsRUFBRTtVQUNoQyxnQkFBZ0IsRUFBRTtZQUNoQixLQUFLLEVBQUUsU0FBUyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO2NBQzNDLE1BQU0sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztjQUN6QixjQUFjLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRTtnQkFDdEIsR0FBRyxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDO2dCQUM5QixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsWUFBWSxFQUFFLElBQUk7ZUFDbkIsQ0FBQyxDQUFDO2FBQ0o7V0FDRjtVQUNELGdCQUFnQixFQUFFO1lBQ2hCLEtBQUssRUFBRSxTQUFTLGdCQUFnQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7Y0FDM0MsTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2NBQ3pCLGNBQWMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFO2dCQUN0QixHQUFHLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUM7Z0JBQzlCLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixZQUFZLEVBQUUsSUFBSTtlQUNuQixDQUFDLENBQUM7YUFDSjtXQUNGO1VBQ0QsZ0JBQWdCLEVBQUU7WUFDaEIsS0FBSyxFQUFFLFNBQVMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFO2NBQ3JDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztjQUN2QixJQUFJLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO2NBQzVCLElBQUksSUFBSSxDQUFDO2NBQ1QsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsd0JBQXdCLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQ3ZELENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7ZUFDdkI7Y0FDRCxPQUFPLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDO2FBQ3pCO1dBQ0Y7VUFDRCxnQkFBZ0IsRUFBRTtZQUNoQixLQUFLLEVBQUUsU0FBUyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUU7Y0FDckMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO2NBQ3ZCLElBQUksR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7Y0FDNUIsSUFBSSxJQUFJLENBQUM7Y0FDVCxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksR0FBRyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRTtnQkFDdkQsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztlQUN2QjtjQUNELE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUM7YUFDekI7V0FDRjtTQUNGLENBQUMsQ0FBQztPQUNKOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUFxQkQsU0FBUyxlQUFlLEdBQUc7UUFDekIsTUFBTSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsR0FBRyxNQUFNLENBQUM7Ozs7Ozs7Ozs7O1FBV3BFLFNBQVMsY0FBYyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7VUFDekMsSUFBSSxnQkFBZ0IsQ0FBQztVQUNyQixJQUFJOztZQUVGLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztXQUMzQyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsSUFBSSxDQUFDLFlBQVksV0FBVyxFQUFFOzs7Y0FHNUIsT0FBTzthQUNSOztZQUVELE1BQU0sQ0FBQyxDQUFDO1dBQ1Q7VUFDRCxNQUFNLGlCQUFpQixHQUFHLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1VBQzNELE1BQU0sc0JBQXNCLEdBQUcsaUJBQWlCLENBQUMsV0FBVyxDQUFDOztVQUU3RCxTQUFTLGlCQUFpQixHQUFHO1lBQzNCLE1BQU0sQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDO1lBQzVCLElBQUksQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUM7WUFDcEIsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1dBQ2pDOzs7VUFHRCxNQUFNLGFBQWEsR0FBRyxXQUFXO1lBQy9CLElBQUksaUJBQWlCLEVBQUUsRUFBRTtjQUN2QixNQUFNLElBQUksU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2FBQ3RDLE1BQU07Y0FDTCxPQUFPLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDdEQ7V0FDRixDQUFDO1VBQ0YsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O1VBZTNELGdCQUFnQixDQUFDLGlCQUFpQixFQUFFO1lBQ2xDLFdBQVcsRUFBRSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUU7V0FDdEMsQ0FBQyxDQUFDOzs7O1VBSUgsZ0JBQWdCLENBQUMsYUFBYSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRTtXQUN4QyxDQUFDLENBQUM7O1VBRUgsSUFBSSxhQUFhLEtBQUssUUFBUSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUU7O1lBRXBELGNBQWMsQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztXQUMvRDtTQUNGOzs7Ozs7Ozs7Ozs7UUFZRCxjQUFjLENBQUMsVUFBVSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDN0MsY0FBYyxDQUFDLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDdkQsY0FBYyxDQUFDLGVBQWUsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3hELGNBQWMsQ0FBQyx3QkFBd0IsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO09BQ25FOzs7Ozs7Ozs7Ozs7TUFZRCxNQUFNLGVBQWUsR0FBRyxvQkFBb0IsQ0FBQztNQUM3QyxNQUFNLG1CQUFtQixHQUFHLENBQUMsK0JBQStCLENBQUMsQ0FBQzs7O01BRzlELFNBQVMsNEJBQTRCLEdBQUc7Ozs7OztRQU10QyxNQUFNLE1BQU0sR0FBRyxJQUFJLFFBQVE7VUFDekIsa0RBQWtEO1NBQ25ELEVBQUUsQ0FBQzs7UUFFSixJQUFJLENBQUMsTUFBTSxFQUFFO1VBQ1gsT0FBTyxTQUFTLENBQUM7U0FDbEI7OztRQUdELE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7O1FBR3pCLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsQ0FBQzs7UUFFN0QsT0FBTyxZQUFZLENBQUM7T0FDckI7OztNQUdELFNBQVMsK0JBQStCLEdBQUc7UUFDekMsSUFBSSxPQUFPLFFBQVEsS0FBSyxXQUFXLEVBQUU7VUFDbkMsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFDRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQzs7UUFFOUIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7Ozs7Ozs7O1FBUWhFLE9BQU8sWUFBWSxDQUFDO09BQ3JCOztNQUVELE1BQU0sa0JBQWtCLEdBQUcsTUFBTTtRQUMvQixNQUFNLHlCQUF5QixHQUFHLCtCQUErQixFQUFFLENBQUM7UUFDcEUsTUFBTSxzQkFBc0IsR0FBRyw0QkFBNEIsRUFBRSxDQUFDO1FBQzlEO1VBQ0UsQ0FBQyxDQUFDLHlCQUF5QixJQUFJLENBQUMsc0JBQXNCO1dBQ3JELHlCQUF5QixJQUFJLHNCQUFzQixDQUFDO1VBQ3JEO1VBQ0EsTUFBTSxJQUFJLEtBQUssQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO1NBQ2hFO1FBQ0QsT0FBTyx5QkFBeUIsSUFBSSxzQkFBc0IsQ0FBQztPQUM1RCxDQUFDOzs7Ozs7OztNQVFGLFNBQVMsZUFBZSxDQUFDLFlBQVksRUFBRSxRQUFRLEdBQUcsRUFBRSxFQUFFO1FBQ3BELE1BQU0saUJBQWlCLEdBQUcsb0JBQW9CLENBQUMsWUFBWSxDQUFDLENBQUM7O1FBRTdELE9BQU8sTUFBTSxDQUFDO1VBQ1osWUFBWTtVQUNaLGlCQUFpQjtVQUNqQixVQUFVLEVBQUUsWUFBWSxDQUFDLElBQUk7VUFDN0IsY0FBYyxFQUFFLFlBQVksQ0FBQyxRQUFRO1VBQ3JDLFFBQVE7U0FDVCxDQUFDLENBQUM7T0FDSjs7TUFFRCxNQUFNLG1CQUFtQixHQUFHLGFBQWE7UUFDdkMsQ0FBQyxlQUFlLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBQztPQUN4QyxDQUFDO01BQ0YsTUFBTSxtQkFBbUIsR0FBRyxhQUFhO1FBQ3ZDLENBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxJQUFJLENBQUM7T0FDeEMsQ0FBQzs7OztNQUlGLFNBQVMsa0JBQWtCLENBQUMsUUFBUSxFQUFFO1FBQ3BDLE1BQU0sWUFBWSxHQUFHLGtCQUFrQixFQUFFLENBQUM7UUFDMUMsWUFBWSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3ZDLFlBQVksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUN2QyxPQUFPLGVBQWUsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7T0FDaEQ7Ozs7TUFJRCxTQUFTLHNCQUFzQixHQUFHO1FBQ2hDLE1BQU0sWUFBWSxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDaEQsZUFBZSxFQUFFLENBQUM7UUFDbEIsZUFBZSxFQUFFLENBQUM7UUFDbEIsT0FBTyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUM7T0FDdEM7Ozs7Ozs7Ozs7Ozs7O01BY0QsTUFBTSxpQkFBaUIsR0FBRyxvQkFBb0IsQ0FBQzs7Ozs7O01BTS9DLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDOztRQUV2QixPQUFPO1FBQ1AsT0FBTztRQUNQLE1BQU07UUFDTixPQUFPO1FBQ1AsT0FBTztRQUNQLE9BQU87UUFDUCxVQUFVO1FBQ1YsVUFBVTtRQUNWLFNBQVM7UUFDVCxRQUFRO1FBQ1IsSUFBSTtRQUNKLE1BQU07UUFDTixRQUFRO1FBQ1IsU0FBUztRQUNULFNBQVM7UUFDVCxLQUFLO1FBQ0wsVUFBVTtRQUNWLElBQUk7UUFDSixRQUFRO1FBQ1IsSUFBSTtRQUNKLFlBQVk7UUFDWixLQUFLO1FBQ0wsUUFBUTtRQUNSLE9BQU87UUFDUCxRQUFRO1FBQ1IsTUFBTTtRQUNOLE9BQU87UUFDUCxLQUFLO1FBQ0wsUUFBUTtRQUNSLEtBQUs7UUFDTCxNQUFNO1FBQ04sT0FBTztRQUNQLE1BQU07UUFDTixPQUFPOzs7UUFHUCxLQUFLO1FBQ0wsUUFBUTs7O1FBR1IsTUFBTTs7O1FBR04sWUFBWTtRQUNaLFNBQVM7UUFDVCxXQUFXO1FBQ1gsV0FBVztRQUNYLFNBQVM7UUFDVCxRQUFROzs7UUFHUixPQUFPOztRQUVQLE1BQU07UUFDTixNQUFNO1FBQ04sT0FBTzs7UUFFUCxNQUFNO1FBQ04sV0FBVztPQUNaLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7TUFXSCxTQUFTLHFCQUFxQixDQUFDLFVBQVUsRUFBRTtRQUN6QyxNQUFNLEtBQUssR0FBRyx5QkFBeUIsQ0FBQyxVQUFVLENBQUMsQ0FBQzs7OztRQUlwRCxNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxJQUFJOzs7VUFHaEU7WUFDRSxJQUFJLEtBQUssTUFBTTtZQUNmLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ2xCLENBQUMsVUFBVSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQztZQUNwQztZQUNBLE9BQU8sS0FBSyxDQUFDO1dBQ2Q7O1VBRUQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1VBQ3pCOzs7Ozs7OztZQVFFLElBQUksQ0FBQyxZQUFZLEtBQUssS0FBSztZQUMzQixJQUFJLENBQUMsUUFBUSxLQUFLLEtBQUs7Ozs7Ozs7WUFPdkIsb0JBQW9CLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQztZQUNuQztTQUNILENBQUMsQ0FBQzs7UUFFSCxPQUFPLFNBQVMsQ0FBQztPQUNsQjs7Ozs7OztNQU9ELE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQy9DLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFO1VBQ2hCLE9BQU8sQ0FBQyxJQUFJO1lBQ1YsQ0FBQyxzQ0FBc0MsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvQyxJQUFJLEtBQUssRUFBRSxDQUFDLEtBQUs7V0FDbEIsQ0FBQzs7U0FFSDtPQUNGLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztNQWdCSCxTQUFTLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUU7UUFDakQsTUFBTSxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsR0FBRyxTQUFTLENBQUM7Ozs7UUFJL0MsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7OztRQUcvQixJQUFJLGlDQUFpQyxHQUFHLENBQUMsQ0FBQzs7UUFFMUMsT0FBTzs7OztVQUlMLFNBQVMsRUFBRSxrQkFBa0I7O1VBRTdCLHdCQUF3QixHQUFHO1lBQ3pCLGtCQUFrQixHQUFHLElBQUksQ0FBQztXQUMzQjs7VUFFRCw4QkFBOEIsR0FBRztZQUMvQixPQUFPLGlDQUFpQyxLQUFLLENBQUMsQ0FBQztXQUNoRDs7VUFFRCw0QkFBNEIsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFO1lBQ3RDLGlDQUFpQyxHQUFHLEtBQUssQ0FBQztXQUMzQzs7VUFFRCx3QkFBd0IsR0FBRztZQUN6QixpQ0FBaUMsR0FBRyxJQUFJLENBQUMsR0FBRztjQUMxQyxDQUFDO2NBQ0QsaUNBQWlDLEdBQUcsQ0FBQzthQUN0QyxDQUFDO1dBQ0g7O1VBRUQsc0JBQXNCLEdBQUc7WUFDdkIsT0FBTyxrQkFBa0IsQ0FBQztXQUMzQjs7VUFFRCxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRTs7OztZQUloQixJQUFJLElBQUksS0FBSyxNQUFNLEVBQUU7O2NBRW5CLElBQUksa0JBQWtCLEtBQUssSUFBSSxFQUFFOztnQkFFL0Isa0JBQWtCLEdBQUcsS0FBSyxDQUFDO2dCQUMzQixPQUFPLFVBQVUsQ0FBQztlQUNuQjtjQUNELE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQzthQUNwQjs7O1lBR0QsSUFBSSxJQUFJLEtBQUssTUFBTSxDQUFDLFdBQVcsRUFBRTs7Ozs7Y0FLL0IsT0FBTyxTQUFTLENBQUM7YUFDbEI7OztZQUdELElBQUksSUFBSSxJQUFJLE1BQU0sRUFBRTtjQUNsQixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNyQjs7O1lBR0QsT0FBTyxTQUFTLENBQUM7V0FDbEI7OztVQUdELEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTs7Ozs7WUFLdkIsSUFBSSxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUU7O2NBRXRDLE1BQU0sSUFBSSxTQUFTLENBQUMsQ0FBQyw4QkFBOEIsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDdEU7O1lBRUQsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQzs7O1lBR3pCLE9BQU8sSUFBSSxDQUFDO1dBQ2I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7VUFzQkQsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUU7WUFDaEIsSUFBSSxJQUFJLENBQUMsOEJBQThCLEVBQUUsRUFBRTtjQUN6QyxPQUFPLElBQUksQ0FBQzthQUNiOzs7Ozs7OztZQVFELElBQUksSUFBSSxLQUFLLE1BQU0sSUFBSSxJQUFJLElBQUksTUFBTSxJQUFJLElBQUksSUFBSSxZQUFZLEVBQUU7Y0FDN0QsT0FBTyxJQUFJLENBQUM7YUFDYjs7WUFFRCxPQUFPLEtBQUssQ0FBQztXQUNkO1NBQ0YsQ0FBQztPQUNIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUFxQkQsTUFBTSxxQkFBcUIsR0FBRyx3QkFBd0IsQ0FBQzs7TUFFdkQsU0FBUywrQkFBK0IsQ0FBQyxDQUFDLEVBQUU7UUFDMUMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQzlDLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFO1VBQ2hCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUM7VUFDckQsTUFBTSxJQUFJLFdBQVc7WUFDbkIsQ0FBQyxxREFBcUQsRUFBRSxPQUFPLENBQUMsQ0FBQztXQUNsRSxDQUFDO1NBQ0g7T0FDRjs7TUFFRCxTQUFTLHNCQUFzQixDQUFDLENBQUMsRUFBRTs7O1FBR2pDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ3BDOzs7O01BSUQsU0FBUyxjQUFjLENBQUMsU0FBUyxFQUFFOztRQUVqQyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDOzs7UUFHdEMsT0FBTyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO09BQ3ZEOztNQUVELFNBQVMsNEJBQTRCLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRTtRQUMxRCxNQUFNLEVBQUUsY0FBYyxFQUFFLEdBQUcsU0FBUyxDQUFDOztRQUVyQyxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUE0QjVDLE9BQU8sY0FBYyxDQUFDLENBQUM7O01BRXJCLEVBQUUsU0FBUyxDQUFDOzs7Ozs7RUFNaEIsQ0FBQyxDQUFDLENBQUM7T0FDRjs7TUFFRCxTQUFTLDBCQUEwQixDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUU7UUFDekQsTUFBTSxFQUFFLGNBQWMsRUFBRSxHQUFHLFNBQVMsQ0FBQzs7UUFFckMsTUFBTSxZQUFZLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sU0FBUyxHQUFHLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sc0JBQXNCLEdBQUcsNEJBQTRCO1VBQ3pELFNBQVM7VUFDVCxTQUFTO1NBQ1YsQ0FBQzs7UUFFRixTQUFTLE9BQU8sQ0FBQyxVQUFVLEdBQUcsRUFBRSxFQUFFLFNBQVMsR0FBRyxLQUFLLEVBQUU7Ozs7Ozs7OztVQVNuRCxNQUFNLFdBQVcsR0FBRyxNQUFNO1lBQ3hCLFVBQVU7WUFDVix5QkFBeUIsQ0FBQyxVQUFVLENBQUM7V0FDdEMsQ0FBQztVQUNGLE1BQU0sVUFBVSxHQUFHLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQztVQUN4RCxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsVUFBVSxFQUFFO1lBQ2hFLFVBQVU7V0FDWCxDQUFDLENBQUM7Ozs7OztVQU1ILE1BQU0sUUFBUSxHQUFHO1lBQ2YsSUFBSSxDQUFDLEdBQUcsRUFBRTtjQUNSLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztjQUNmLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2NBQzVCLFlBQVksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO2NBQ3hDLElBQUksU0FBUyxJQUFJLENBQUMsWUFBWSxDQUFDLDhCQUE4QixFQUFFLEVBQUU7Z0JBQy9ELFlBQVksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztlQUM5QztjQUNELElBQUksR0FBRyxDQUFDO2NBQ1IsSUFBSTs7Z0JBRUYsT0FBTyxLQUFLLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7ZUFDbEQsQ0FBQyxPQUFPLENBQUMsRUFBRTs7Z0JBRVYsR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDUixNQUFNLENBQUMsQ0FBQztlQUNULFNBQVM7Z0JBQ1IsWUFBWSxDQUFDLHdCQUF3QixFQUFFLENBQUM7OztnQkFHeEMsSUFBSSxZQUFZLENBQUMsc0JBQXNCLEVBQUUsRUFBRTtrQkFDekMsWUFBWSxDQUFDLDJDQUEyQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2lCQUNoRTtlQUNGO2FBQ0Y7V0FDRixDQUFDLElBQUksQ0FBQzs7Ozs7Ozs7O1VBU1AsY0FBYyxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7O1VBRW5ELE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxLQUFLLFFBQVEsRUFBRSxlQUFlLENBQUMsQ0FBQztVQUMzRSxNQUFNO1lBQ0osY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsS0FBSyxjQUFjO1lBQ3ZELHFCQUFxQjtXQUN0QixDQUFDOzs7O1VBSUYsZ0JBQWdCLENBQUMsUUFBUSxFQUFFO1lBQ3pCLFFBQVEsRUFBRTs7Ozs7Y0FLUixLQUFLLEVBQUUsUUFBUSxDQUFDLDhDQUE4QyxDQUFDO2NBQy9ELFFBQVEsRUFBRSxLQUFLO2NBQ2YsVUFBVSxFQUFFLEtBQUs7Y0FDakIsWUFBWSxFQUFFLElBQUk7YUFDbkI7V0FDRixDQUFDLENBQUM7O1VBRUgsT0FBTyxRQUFRLENBQUM7U0FDakI7O1FBRUQsT0FBTyxPQUFPLENBQUM7T0FDaEI7O01BRUQsU0FBUyxtQkFBbUIsQ0FBQyxvQkFBb0IsRUFBRTtRQUNqRCxPQUFPLG9CQUFvQixFQUFFLENBQUM7T0FDL0I7O01BRUQsU0FBUyx1Q0FBdUMsQ0FBQyxvQkFBb0IsRUFBRTtRQUNyRSxPQUFPLENBQUMsQ0FBQyxFQUFFLFVBQVUsS0FBSyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUMvRDs7Ozs7O01BTUQsU0FBUyx1QkFBdUI7UUFDOUIsU0FBUztRQUNULGVBQWU7UUFDZixXQUFXO1FBQ1g7UUFDQSxNQUFNLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxHQUFHLFNBQVMsQ0FBQzs7UUFFbkQsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RCxNQUFNLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7O1FBRTNELE1BQU0sWUFBWSxHQUFHLFNBQVMsUUFBUSxDQUFDLEdBQUcsTUFBTSxFQUFFO1VBQ2hELE1BQU0sWUFBWSxHQUFHLENBQUMsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztVQUNqRCxJQUFJLGNBQWMsR0FBRyxDQUFDLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDakQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsY0FBYyxDQUFDLEVBQUU7WUFDN0MsTUFBTSxJQUFJLFlBQVksQ0FBQyxXQUFXO2NBQ2hDLGdLQUFnSzthQUNqSyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O1dBZ0JIOzs7Ozs7OztVQVFELElBQUksY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDOztVQUVqQyxJQUFJLGNBQWMsQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLEVBQUU7Ozs7Ozs7WUFPdkMsTUFBTSxJQUFJLFlBQVksQ0FBQyxXQUFXO2NBQ2hDLDJEQUEyRDthQUM1RCxDQUFDOztXQUVIOzs7VUFHRCxJQUFJLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFOzs7O1lBSTdCLGNBQWMsSUFBSSxVQUFVLENBQUM7V0FDOUI7O1VBRUQsTUFBTSxHQUFHLEdBQUcsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7VUFDakUsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztVQUNqRSxJQUFJLFFBQVEsRUFBRTtZQUNaLE9BQU8sY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1dBQzVCO1VBQ0QsTUFBTSxFQUFFLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7VUFDbEMsSUFBSSxRQUFRLEVBQUU7WUFDWixPQUFPLEVBQUUsQ0FBQztXQUNYOztVQUVELE1BQU0sUUFBUSxHQUFHLENBQUM7Ozs7OztFQU10QixDQUFDLENBQUM7VUFDRSxNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1VBQzdELE9BQU8sVUFBVSxDQUFDO1NBQ25CLENBQUM7Ozs7UUFJRixjQUFjLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7UUFFdkQsTUFBTTtVQUNKLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxXQUFXLEtBQUssUUFBUTtVQUNyRCxlQUFlO1NBQ2hCLENBQUM7UUFDRixNQUFNO1VBQ0osY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDLFdBQVcsS0FBSyxjQUFjO1VBQzNELHFCQUFxQjtTQUN0QixDQUFDOztRQUVGLGdCQUFnQixDQUFDLFlBQVksRUFBRTs7O1VBRzdCLFNBQVMsRUFBRSxFQUFFLEtBQUssRUFBRSxjQUFjLENBQUMsU0FBUyxFQUFFOzs7OztVQUs5QyxRQUFRLEVBQUU7WUFDUixLQUFLLEVBQUUsY0FBYyxDQUFDLDZDQUE2QyxDQUFDO1lBQ3BFLFFBQVEsRUFBRSxLQUFLO1lBQ2YsVUFBVSxFQUFFLEtBQUs7WUFDakIsWUFBWSxFQUFFLElBQUk7V0FDbkI7U0FDRixDQUFDLENBQUM7O1FBRUgsT0FBTyxZQUFZLENBQUM7T0FDckI7Ozs7TUFJRCxNQUFNLHdCQUF3QixHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7O01BRS9DLFNBQVMsMkJBQTJCLENBQUMsS0FBSyxFQUFFOztRQUUxQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEtBQUssRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDOztRQUVwRSxNQUFNLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLDhCQUE4QixDQUFDLENBQUM7O1FBRTVFLE9BQU8sd0JBQXdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO09BQzVDOztNQUVELFNBQVMsZ0NBQWdDLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRTs7UUFFekQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLEVBQUUsa0NBQWtDLENBQUMsQ0FBQzs7UUFFcEUsTUFBTTtVQUNKLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztVQUNwQyxxQ0FBcUM7U0FDdEMsQ0FBQzs7UUFFRix3QkFBd0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO09BQy9DOzs7TUFHRCxTQUFTLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFO1FBQzlELGdCQUFnQixDQUFDLFVBQVUsRUFBRTtVQUMzQixJQUFJLEVBQUU7WUFDSixLQUFLLEVBQUUsUUFBUTtZQUNmLFFBQVEsRUFBRSxJQUFJO1lBQ2QsWUFBWSxFQUFFLElBQUk7V0FDbkI7VUFDRCxRQUFRLEVBQUU7WUFDUixLQUFLLEVBQUUsWUFBWTtZQUNuQixRQUFRLEVBQUUsSUFBSTtZQUNkLFlBQVksRUFBRSxJQUFJO1dBQ25CO1NBQ0YsQ0FBQyxDQUFDO09BQ0o7O01BRUQsU0FBUyxjQUFjLENBQUMsU0FBUyxFQUFFO1FBQ2pDLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsR0FBRyxTQUFTLENBQUM7O1FBRXRELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDOztRQUU1RSxNQUFNLG9CQUFvQixHQUFHLDBCQUEwQjtVQUNyRCxTQUFTO1VBQ1QsVUFBVTtTQUNYLENBQUM7UUFDRixNQUFNLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzNELE1BQU0sNEJBQTRCLEdBQUcsdUNBQXVDO1VBQzFFLG9CQUFvQjtTQUNyQixDQUFDO1FBQ0YsTUFBTSxZQUFZLEdBQUcsdUJBQXVCO1VBQzFDLFNBQVM7VUFDVCxvQkFBb0I7VUFDcEIsVUFBVTtTQUNYLENBQUM7O1FBRUYsa0JBQWtCLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQzs7UUFFdkQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDO1VBQ3RCLFVBQVU7VUFDVixRQUFRO1VBQ1IsNEJBQTRCO1VBQzVCLFlBQVk7U0FDYixDQUFDLENBQUM7O1FBRUgsT0FBTyxRQUFRLENBQUM7T0FDakI7Ozs7Ozs7TUFPRCxTQUFTLGFBQWEsQ0FBQyxlQUFlLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTs7Ozs7UUFLckQsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUM7UUFDcEMsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7OztRQUdqRSxNQUFNLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7O1FBRy9DLE1BQU0sS0FBSyxHQUFHLGlCQUFpQixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQzs7OztRQUl0RCxTQUFTLENBQUMsaUJBQWlCLENBQUMsS0FBSyxHQUFHO1VBQ2xDLEtBQUssRUFBRSxLQUFLO1VBQ1osUUFBUSxFQUFFLElBQUk7VUFDZCxZQUFZLEVBQUUsSUFBSTtTQUNuQixDQUFDOzs7O1FBSUYsTUFBTSxRQUFRLEdBQUcsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7UUFHM0MsTUFBTSxFQUFFLDRCQUE0QixFQUFFLEdBQUcsUUFBUSxDQUFDO1FBQ2xELEtBQUssTUFBTSxJQUFJLElBQUksUUFBUSxFQUFFO1VBQzNCLDRCQUE0QixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3BDOzs7UUFHRCxnQ0FBZ0MsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7T0FDbEQ7Ozs7OztNQU1ELFNBQVMsZUFBZSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUU7OztRQUd4QyxNQUFNLFFBQVEsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7OztRQUczQyxnQ0FBZ0MsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7T0FDbEQ7O01BRUQsU0FBUyxjQUFjLENBQUMsSUFBSSxFQUFFO1FBQzVCLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6RCxPQUFPLFVBQVUsQ0FBQztPQUNuQjs7TUFFRCxTQUFTLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFVBQVUsR0FBRyxFQUFFLEVBQUU7Ozs7UUFJL0MsTUFBTSxFQUFFLDRCQUE0QixFQUFFLEdBQUcsMkJBQTJCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0UsT0FBTyw0QkFBNEIsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7T0FDcEQ7O01BRUQsTUFBTSxTQUFTLEdBQUc7UUFDaEIsYUFBYTtRQUNiLGVBQWU7UUFDZixjQUFjO1FBQ2QsYUFBYTtPQUNkLENBQUM7Ozs7TUFJRixNQUFNLGdCQUFnQixHQUFHLHNCQUFzQixFQUFFLENBQUM7Ozs7Ozs7TUFPbEQsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxDQUFDOztNQUUzRCxPQUFPLEtBQUssQ0FBQzs7S0FFZCxDQUFDLEVBQUU7QUFDdUM7OztJQ2o5QzNDO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7O0lBRUE7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTs7SUFFQTtJQUNBO0lBQ0E7SUFDQTtJQUNBLFNBQVMsSUFBSSxDQUFDLEdBQUcsbUJBQW1CO0lBQ3BDLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOztJQUVsQyxDQUFDLE9BQU87SUFDUjtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLElBQUksVUFBVSxPQUFPLGdCQUFnQjtJQUN2RCxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakQsR0FBRzs7SUFFSDtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBLEVBQUUsR0FBRyxFQUFFLFNBQVMsR0FBRyxDQUFDLElBQUksVUFBVSxPQUFPLGdCQUFnQjtJQUN6RCxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ2xCLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMxRCxJQUFJO0lBQ0osR0FBRzs7SUFFSDtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsRUFBRSxJQUFJLEVBQUUsU0FBUyxJQUFJLENBQUMsSUFBSSxVQUFVLEdBQUcsT0FBTztJQUM5QyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdkUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM1RSxHQUFHO0lBQ0gsRUFBRSxDQUFDO0lBQ0gsQ0FBQzs7SUMzREQsTUFBTSxrQkFBa0IsR0FBRyw2QkFBNkIsQ0FBQztJQUN6RCxNQUFNLFVBQVUsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLEtBQUssSUFBSSxXQUFXLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2pHLE1BQU0sSUFBSSxHQUFHLE1BQU0sR0FBRyxDQUFDO0lBQ3ZCO0lBQ0E7SUFDQTtBQUNBLElBQU8sTUFBTSxhQUFhLENBQUM7SUFDM0I7SUFDQTtJQUNBO0lBQ0E7SUFDQSxJQUFJLFdBQVcsQ0FBQyxXQUFXLEdBQUcsRUFBRSxFQUFFO0lBQ2xDLFFBQVEsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFDdkMsUUFBUSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7SUFDdkMsUUFBUSxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsT0FBTyxLQUFLO0lBQ3JDLFlBQVksSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUM7SUFDdkU7SUFDQSxZQUFZLElBQUksSUFBSSxDQUFDLFdBQVcsTUFBTSxXQUFXLElBQUksRUFBRSxDQUFDO0lBQ3hELGdCQUFnQixPQUFPO0lBQ3ZCLFlBQVksSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO0lBQ3JDLGdCQUFnQixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUseUZBQXlGLEVBQUUsRUFBRSxFQUFFLDRCQUE0QixFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xNLGFBQWE7SUFDYixZQUFZLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM5QyxTQUFTLENBQUM7SUFDVixRQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztJQUM5QjtJQUNBO0lBQ0E7SUFDQSxRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBQ3BDLFFBQVEsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXLElBQUksT0FBTyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtJQUM1RjtJQUNBO0lBQ0EsWUFBWSxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pFLFNBQVM7SUFDVCxRQUFRLElBQUksT0FBTyxRQUFRLEtBQUssV0FBVyxJQUFJLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRTtJQUMxRSxZQUFZLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekUsU0FBUztJQUNULEtBQUs7SUFDTDtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRTtJQUN2QixRQUFRLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM3QyxLQUFLO0lBQ0w7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0EsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsUUFBUSxLQUFLLFdBQVcsRUFBRTtJQUM1RSxRQUFRLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtJQUNqQyxZQUFZLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSx5RkFBeUYsRUFBRSxFQUFFLEVBQUUsNEJBQTRCLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDM0wsU0FBUztJQUNULFFBQVEsTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLEVBQUUsRUFBRSxDQUFDO0lBQ3ZFLFFBQVEsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXLEVBQUU7SUFDNUMsWUFBWSxJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUU7SUFDaEUsZ0JBQWdCLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM3RCxhQUFhO0lBQ2IsWUFBWSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUU7SUFDOUI7SUFDQSxnQkFBZ0IsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJO0lBQ3RFLG9CQUFvQixLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBRTtJQUM1Qyx3QkFBd0IsSUFBSSxHQUFHLENBQUMsRUFBRTtJQUNsQyw0QkFBNEIsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUUscUJBQXFCO0lBQ3JCLGlCQUFpQixDQUFDLENBQUM7SUFDbkIsYUFBYTtJQUNiLFNBQVM7SUFDVCxRQUFRLElBQUksa0JBQWtCLElBQUksT0FBTyxRQUFRLEtBQUssV0FBVyxJQUFJLFFBQVEsQ0FBQyxhQUFhLEVBQUU7SUFDN0YsWUFBWSxRQUFRLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxRCxTQUFTO0lBQ1QsS0FBSztJQUNMLENBQUM7O0lDNUVEO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0FBQ0EsSUFDQTtJQUNBO0lBQ0E7QUFDQSxJQUFPLE1BQU0sZUFBZSxHQUFHO0lBQy9CLElBQUksTUFBTSxhQUFhLENBQUMsSUFBSSxFQUFFO0lBQzlCLFFBQVEsT0FBTyxJQUFJLENBQUM7SUFDcEIsS0FBSztJQUNMLElBQUksTUFBTSxlQUFlLENBQUMsVUFBVSxFQUFFO0lBQ3RDLFFBQVEsT0FBTyxVQUFVLENBQUM7SUFDMUIsS0FBSztJQUNMLENBQUMsQ0FBQztBQUNGLElBYUE7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7QUFDQSxJQUFPLFNBQVMsU0FBUyxDQUFDLGNBQWMsR0FBRyxFQUFFLEVBQUUsT0FBTyxHQUFHLEVBQUUsRUFBRTtJQUM3RCxJQUFJLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsbUJBQW1CLEVBQUUsR0FBRztJQUNsRSxRQUFRLFVBQVUsRUFBRSxlQUFlO0lBQ25DLFFBQVEsR0FBRyxFQUFFLGlCQUFpQjtJQUM5QixRQUFRLE1BQU0sRUFBRSxLQUFLO0lBQ3JCLFFBQVEsR0FBRyxFQUFFLElBQUk7SUFDakIsUUFBUSxtQkFBbUIsRUFBRSxhQUFhO0lBQzFDLFFBQVEsR0FBRyxPQUFPO0lBQ2xCLEtBQUssQ0FBQztJQUNOLElBQUksTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsSUFBSSxJQUFJLGFBQWEsRUFBRSxDQUFDO0lBQ2xFLElBQUksTUFBTSxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsR0FBRyxLQUFLLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixHQUFHLEtBQUssRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEdBQUcsS0FBSyxHQUFHLEdBQUcsT0FBTyxNQUFNLEtBQUssU0FBUztJQUMxSyxVQUFVLE1BQU07SUFDaEIsY0FBYyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFO0lBQy9FLGNBQWMsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRTtJQUNsRixVQUFVLE1BQU0sQ0FBQztJQUNqQixJQUFJLE1BQU0sRUFBRSxRQUFRLEVBQUUsV0FBVyxHQUFHLElBQUksRUFBRSxVQUFVLEVBQUUsYUFBYSxHQUFHLElBQUksRUFBRSxXQUFXLEVBQUUsY0FBYyxHQUFHLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxHQUFHLFFBQVEsR0FBRyxHQUFHLE9BQU8sR0FBRyxLQUFLLFNBQVM7SUFDdEssVUFBVSxHQUFHO0lBQ2IsY0FBYyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUU7SUFDckYsY0FBYyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUU7SUFDdkYsVUFBVSxHQUFHLENBQUM7SUFDZCxJQUFJLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDckMsSUFBSSxlQUFlLFNBQVMsQ0FBQyxJQUFJLEVBQUU7SUFDbkMsUUFBUSxJQUFJLGNBQWMsR0FBRyxFQUFFLENBQUM7SUFDaEMsUUFBUSxJQUFJO0lBQ1o7SUFDQSxZQUFZLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztJQUMzRCxrQkFBa0IsU0FBUztJQUMzQixrQkFBa0IsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM5QyxZQUFZLElBQUksQ0FBQyxRQUFRLEVBQUU7SUFDM0IsZ0JBQWdCLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtJQUN4QyxvQkFBb0IsSUFBSSxhQUFhO0lBQ3JDLHdCQUF3QixPQUFPLENBQUMsS0FBSyxDQUFDLDJDQUEyQyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM5RixvQkFBb0IsT0FBTztJQUMzQixpQkFBaUI7SUFDakI7SUFDQSxvQkFBb0IsT0FBTyxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNqRSxhQUFhO0lBQ2IsWUFBWSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3ZDLFlBQVksSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLE9BQU8sTUFBTSxLQUFLLFFBQVEsSUFBSSxNQUFNLEtBQUssSUFBSSxDQUFDLEVBQUU7SUFDMUYsZ0JBQWdCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkUsZ0JBQWdCLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RFLGdCQUFnQixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUNsRCxnQkFBZ0IsSUFBSSxXQUFXO0lBQy9CLG9CQUFvQixPQUFPLEtBQUssT0FBTztJQUN2QywwQkFBMEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ25HLDBCQUEwQixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsRUFBRSxHQUFHLElBQUksRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLGtDQUFrQyxDQUFDLENBQUM7SUFDM00sZ0JBQWdCLE9BQU8sSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxNQUFNLE9BQU8sRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUN6RixhQUFhO0lBQ2IsaUJBQWlCO0lBQ2pCLGdCQUFnQixPQUFPLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzdELGFBQWE7SUFDYixTQUFTO0lBQ1QsUUFBUSxPQUFPLENBQUMsRUFBRTtJQUNsQixZQUFZLENBQUMsQ0FBQyxLQUFLLEdBQUcsY0FBYztJQUNwQyxpQkFBaUIsS0FBSyxDQUFDLElBQUksQ0FBQztJQUM1QixpQkFBaUIsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sS0FBSyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQztJQUM1RixZQUFZLElBQUksYUFBYTtJQUM3QixnQkFBZ0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqQyxZQUFZLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQztJQUMvQixZQUFZLElBQUksR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztJQUN0QyxZQUFZLElBQUksT0FBTyxZQUFZLEtBQUssVUFBVSxJQUFJLENBQUMsWUFBWSxZQUFZO0lBQy9FLGdCQUFnQixJQUFJLEdBQUcsZUFBZSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDaEQsWUFBWSxPQUFPLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVFLFNBQVM7SUFDVCxLQUFLO0lBQ0wsSUFBSSxlQUFlLFVBQVUsQ0FBQyxJQUFJLEVBQUU7SUFDcEMsUUFBUSxJQUFJLFlBQVksR0FBRyxFQUFFLEVBQUUsZ0JBQWdCLEdBQUcsRUFBRSxFQUFFLFNBQVMsR0FBRyxDQUFDLEVBQUUsU0FBUyxHQUFHLE9BQU8sQ0FBQztJQUN6RixRQUFRLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsRUFBRTtJQUNuQyxZQUFZLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztJQUM5QyxZQUFZLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztJQUN4QyxZQUFZLGdCQUFnQixHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLDhCQUE4QixDQUFDO0lBQzVHLFlBQVksU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQztJQUM3RSxZQUFZLElBQUksY0FBYztJQUM5QixnQkFBZ0IsT0FBTyxLQUFLLE9BQU87SUFDbkMsc0JBQXNCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztJQUNuSCxzQkFBc0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMzSSxTQUFTO0lBQ1QsUUFBUSxJQUFJLElBQUksQ0FBQyxFQUFFLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLEtBQUssU0FBUztJQUNyRCxZQUFZLE9BQU87SUFDbkIsUUFBUSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxlQUFlLEdBQUcsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7SUFDaEksUUFBUSxJQUFJLENBQUMsT0FBTztJQUNwQixZQUFZLE9BQU87SUFDbkIsUUFBUSxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN2QyxRQUFRLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsRUFBRTtJQUNuQyxZQUFZLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxTQUFTO0lBQ2xFO0lBQ0EsWUFBWSxnQkFBZ0IsR0FBRyxrQ0FBa0MsR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDO0lBQ3RGLFNBQVM7SUFDVCxhQUFhO0lBQ2IsWUFBWSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2pDLFNBQVM7SUFDVCxLQUFLO0lBQ0wsSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsS0FBSztJQUNqQyxRQUFRLElBQUksSUFBSSxDQUFDO0lBQ2pCLFFBQVEsSUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDO0lBQy9CLFFBQVEsSUFBSTtJQUNaLFlBQVksSUFBSSxHQUFHLE1BQU0sVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCxZQUFZLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ3ZDLGdCQUFnQixNQUFNLEdBQUcsTUFBTSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6RCxnQkFBZ0IsSUFBSSxNQUFNO0lBQzFCLG9CQUFvQixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2QyxhQUFhO0lBQ2IsaUJBQWlCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0lBQzlGLGdCQUFnQixNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7SUFDaEY7SUFDQSxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssU0FBUyxDQUFDO0lBQ3BELG9CQUFvQixPQUFPO0lBQzNCLGdCQUFnQixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xELGFBQWE7SUFDYixpQkFBaUI7SUFDakIsZ0JBQWdCLElBQUksaUJBQWlCLEVBQUU7SUFDdkMsb0JBQW9CLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzlFLGlCQUFpQjtJQUNqQixxQkFBcUI7SUFDckI7SUFDQSxpQkFBaUI7SUFDakIsYUFBYTtJQUNiLFNBQVM7SUFDVCxRQUFRLE9BQU8sQ0FBQyxFQUFFO0lBQ2xCLFlBQVksT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLFlBQVksSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDcEQsU0FBUztJQUNULFFBQVEsZUFBZSxJQUFJLENBQUMsR0FBRyxFQUFFO0lBQ2pDLFlBQVksSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0lBQ3BDLGdCQUFnQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUM7SUFDOUUsZ0JBQWdCLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDO0lBQ3RDLG9CQUFvQixPQUFPO0lBQzNCLGdCQUFnQixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLFVBQVUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUN6RSxhQUFhO0lBQ2IsaUJBQWlCO0lBQ2pCLGdCQUFnQixJQUFJLENBQUMsR0FBRztJQUN4QixvQkFBb0IsT0FBTztJQUMzQjtJQUNBLGdCQUFnQixJQUFJLEdBQUcsQ0FBQyxFQUFFLEtBQUssU0FBUztJQUN4QyxvQkFBb0IsT0FBTztJQUMzQixnQkFBZ0IsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxVQUFVLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdkUsYUFBYTtJQUNiLFNBQVM7SUFDVCxLQUFLLENBQUMsQ0FBQztJQUNQLElBQUksT0FBTyxJQUFJLEtBQUssQ0FBQyxFQUFFLEVBQUU7SUFDekIsUUFBUSxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUU7SUFDdEMsWUFBWSxJQUFJLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEtBQUssRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdELFlBQVksT0FBTyxDQUFDLEdBQUcsTUFBTSxLQUFLLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sS0FBSztJQUNuRSxnQkFBZ0IsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRO0lBQzlDLG9CQUFvQixPQUFPLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQzdELGdCQUFnQixJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO0lBQzdDLG9CQUFvQixPQUFPLE1BQU0sQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO0lBQ3hGLGdCQUFnQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFO0lBQ3hDLHFCQUFxQixRQUFRLENBQUMsRUFBRSxDQUFDO0lBQ2pDLHFCQUFxQixLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDOUIsZ0JBQWdCLE1BQU0sR0FBRyxHQUFHLG1CQUFtQixLQUFLLFNBQVMsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNHLHNCQUFzQixJQUFJQyxTQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEQsc0JBQXNCLElBQUlBLFNBQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3RELGdCQUFnQixVQUFVLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUk7SUFDM0Qsb0JBQW9CLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVDLG9CQUFvQixjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRTtJQUMzQyx3QkFBd0IsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQztJQUM1Qyx3QkFBd0IsS0FBSztJQUM3QixxQkFBcUIsQ0FBQyxDQUFDO0lBQ3ZCLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNCLGFBQWEsQ0FBQyxDQUFDO0lBQ2YsU0FBUztJQUNULEtBQUssQ0FBQyxDQUFDO0lBQ1AsSUFBSSxlQUFlLG1CQUFtQixDQUFDLElBQUksRUFBRTtJQUM3QyxRQUFRLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBRTtJQUNwQyxZQUFZLE9BQU8sU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25DLFNBQVM7SUFDVCxhQUFhLElBQUksT0FBTyxJQUFJLElBQUksSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFO0lBQ3RELFlBQVksVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLFNBQVM7SUFDVCxhQUFhO0lBQ2IsWUFBWSxJQUFJLG1CQUFtQixJQUFJLElBQUksRUFBRTtBQUM3QyxJQUNBLGdCQUFnQixJQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztJQUN4QyxnQkFBZ0IsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pDLGFBQWE7SUFDYjtJQUNBLGdCQUFnQixPQUFPLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzdELFNBQVM7SUFDVCxRQUFRLE9BQU8sU0FBUyxDQUFDO0lBQ3pCLEtBQUs7SUFDTCxDQUFDO0lBQ0QsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLE1BQU1BLFNBQU8sQ0FBQztJQUNkLElBQUksV0FBVyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFO0lBQ3BDLFFBQVEsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDckIsUUFBUSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUM3QixRQUFRLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQzdCLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDN0IsUUFBUSxPQUFPLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFDL0MsS0FBSztJQUNMLENBQUM7SUFDRCxNQUFNLGVBQWUsQ0FBQztJQUN0QixJQUFJLFdBQVcsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixFQUFFO0lBQ2hELFFBQVEsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDckIsUUFBUSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUM3QixRQUFRLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQzdCLFFBQVEsTUFBTSxHQUFHLEdBQUcsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLElBQUksSUFBSSxFQUFFLENBQUM7SUFDNUQsUUFBUSxJQUFJLENBQUMsa0JBQWtCLElBQUksTUFBTSxLQUFLLFNBQVM7SUFDdkQsWUFBWSxHQUFHLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0lBQ3pDLFFBQVEsT0FBTyxHQUFHLENBQUM7SUFDbkIsS0FBSztJQUNMLENBQUM7SUFDRCxNQUFNLGFBQWEsQ0FBQztJQUNwQixJQUFJLFdBQVcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxHQUFHLE9BQU8sRUFBRTtJQUMxRCxRQUFRLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDN0IsUUFBUSxJQUFJLEVBQUUsS0FBSyxTQUFTO0lBQzVCLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQztJQUN0QixRQUFRLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hDLFFBQVEsTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5RSxRQUFRLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDO0lBQ3RDLEtBQUs7SUFDTCxDQUFDO0lBQ0Q7SUFDQSxhQUFhLENBQUMsVUFBVSxHQUFHLENBQUMsS0FBSyxHQUFHLEVBQUUsS0FBSyxJQUFJLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pHLGFBQWEsQ0FBQyxjQUFjLEdBQUcsQ0FBQyxFQUFFLEtBQUssSUFBSSxhQUFhLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVGLGFBQWEsQ0FBQyxjQUFjLEdBQUcsQ0FBQyxFQUFFLEtBQUssSUFBSSxhQUFhLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzdGLGFBQWEsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxFQUFFLEtBQUssSUFBSSxhQUFhLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzFGLGFBQWEsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxHQUFHLEVBQUUsS0FBSyxJQUFJLGFBQWEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLEdBQUcsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2xILFNBQVMsZUFBZSxDQUFDLElBQUksRUFBRTtJQUMvQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLFFBQVEsT0FBTyxLQUFLLENBQUM7SUFDckIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUM7SUFDaEMsUUFBUSxPQUFPLEtBQUssQ0FBQztJQUNyQixJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxLQUFLO0lBQzlCLFFBQVEsT0FBTyxLQUFLLENBQUM7SUFDckIsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUU7SUFDaEMsUUFBUSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ25DLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO0lBQ3ZELFlBQVksT0FBTyxLQUFLLENBQUM7SUFDekIsS0FBSztJQUNMLElBQUksT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUNELFNBQVMsUUFBUSxDQUFDLE1BQU0sRUFBRTtJQUMxQixJQUFJLE9BQU8sT0FBTyxNQUFNLEtBQUssUUFBUSxJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUM7SUFDekQsQ0FBQztJQUNELFNBQVMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7SUFDMUIsSUFBSSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUM7SUFDdEIsQ0FBQztJQUNELE1BQU0sV0FBVyxTQUFTLEtBQUssQ0FBQztJQUNoQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7SUFDNUMsUUFBUSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkIsUUFBUSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUN6QixRQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ3pCLFFBQVEsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDM0IsS0FBSztJQUNMLENBQUM7SUFDRDtJQUNBLE1BQU0sTUFBTSxHQUFHO0lBQ2YsSUFBSSxLQUFLO0lBQ1QsSUFBSSxTQUFTO0lBQ2IsSUFBSSxVQUFVO0lBQ2QsSUFBSSxjQUFjO0lBQ2xCLElBQUksV0FBVztJQUNmLElBQUksU0FBUztJQUNiLElBQUksUUFBUTtJQUNaLENBQUMsQ0FBQztJQUNGO0lBQ0E7SUFDQTtJQUNBLFNBQVMsWUFBWSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtJQUNsRCxJQUFJLElBQUk7SUFDUixRQUFRLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsRUFBRTtJQUM5QyxZQUFZLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMxRCxZQUFZLE9BQU8sSUFBSSxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ25ELFNBQVM7SUFDVCxhQUFhLElBQUksSUFBSSxJQUFJLE1BQU0sRUFBRTtJQUNqQyxZQUFZLE1BQU0sQ0FBQyxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hELFlBQVksQ0FBQyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDNUIsWUFBWSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdkMsWUFBWSxPQUFPLENBQUMsQ0FBQztJQUNyQixTQUFTO0lBQ1QsYUFBYTtJQUNiLFlBQVksT0FBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMvRCxTQUFTO0lBQ1QsS0FBSztJQUNMLElBQUksT0FBTyxFQUFFLEVBQUU7SUFDZixRQUFRLE9BQU8sSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25FLEtBQUs7SUFDTCxDQUFDO0lBQ0QsU0FBUyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsRUFBRSxFQUFFO0lBQ3ZDLElBQUksT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMxQyxDQUFDOztJQ2xYRDs7O0FBR0EsSUFBTyxNQUFNLDRCQUE0QixHQUFHLElBQUksR0FBRyxFQUFxRCxDQUFBO0lBQ3hHOzs7QUFHQSxJQUFPLE1BQU0sVUFBVSxHQUF3RTtRQUMzRixtQ0FBbUMsRUFBRSxJQUFJLEdBQUcsRUFBRTtRQUM5QywyQkFBMkIsRUFBRSxJQUFJLEdBQUcsRUFBRTtLQUN6QyxDQUFBO0lBQ0Q7Ozs7QUFJQSxJQUFPLGVBQWUsbUJBQW1CLENBQUMsS0FBZSxFQUFFLGFBQXNDLEVBQUUsR0FBRyxJQUFXO1FBQzdHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQUUsT0FBTTtRQUM5QixLQUFLLE1BQU0sQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQzFELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFBRSxTQUFRO1lBQ3ZGLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLGFBQWEsS0FBSyxXQUFXLElBQUksYUFBYSxLQUFLLEdBQUc7Z0JBQUUsU0FBUTtZQUNyRyxLQUFLLE1BQU0sQ0FBQyxJQUFJLEdBQUcsRUFBRTtnQkFDakIsSUFBSTtvQkFDQSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtpQkFDYjtnQkFBQyxPQUFPLENBQUMsRUFBRTtvQkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO2lCQUNuQjthQUNKO1NBQ0o7SUFDTCxDQUFDO0lBQ0Q7Ozs7O0FBS0EsYUFBZ0IsbUJBQW1CLENBQUMsV0FBbUIsRUFBRSxLQUFlO1FBQ3BFLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3JDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQTtTQUNoRDtRQUNELE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFFLENBQUE7UUFDaEQsTUFBTSxPQUFPLEdBQXlDO1lBQ2xELFdBQVcsQ0FBQyxRQUFRO2dCQUNoQixJQUFJLE9BQU8sUUFBUSxLQUFLLFVBQVU7b0JBQUUsTUFBTSxJQUFJLFNBQVMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFBO2dCQUNwRixJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBO2FBQ3JCO1lBQ0QsY0FBYyxDQUFDLFFBQVE7Z0JBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUE7YUFDeEI7WUFDRCxXQUFXLENBQUMsUUFBUTtnQkFDaEIsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBO2FBQzVCO1NBQ0osQ0FBQTtRQUNELE9BQU8sT0FBTyxDQUFBO0lBQ2xCLENBQUM7O2FDMURlLFNBQVMsQ0FBSSxHQUFNOztRQUUvQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO0lBQzFDLENBQUM7O0lDQ0Q7Ozs7QUFJQSxhQUFnQix3QkFBd0IsQ0FBQyxXQUFtQjtRQUN4RCxPQUFPO1lBQ0gsSUFBSSxhQUFxQixFQUFFLE9BQWdCLENBQUE7WUFDM0MsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDeEIsYUFBYSxHQUFHLFdBQVcsQ0FBQTtnQkFDM0IsT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTthQUN6QjtpQkFBTSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUMvQixhQUFhLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUM1QixPQUFPLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFBO2FBQ3pCO2lCQUFNO2dCQUNILGFBQWEsR0FBRyxFQUFFLENBQUE7YUFDckI7WUFDRCxPQUFPLHVCQUF1QixDQUFDLFdBQVcsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1NBQzVFLENBQUE7SUFDTCxDQUFDO0FBQ0QsYUFBZ0IsdUJBQXVCLENBQ25DLFdBQW1CLEVBQ25CLGFBQXFCLEVBQ3JCLEtBQW9CLEVBQ3BCLE9BQWdCO1FBRWhCLE9BQU8sSUFBSSxPQUFPLENBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTTtZQUNsQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDMUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUU7Z0JBQzNELElBQUksRUFBRSxTQUFTO2dCQUNmLElBQUksRUFBRSxPQUFPO2dCQUNiLFFBQVEsRUFBRSxLQUFLO2FBQ2xCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDTixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQ1QsNEJBQTRCLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFBO2FBQ2pELENBQUMsQ0FBQTtZQUNGLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQTtTQUNqRSxDQUFDLENBQUE7SUFDTixDQUFDO0lBRUQ7OztBQUdBLGFBQWdCLGVBQWUsQ0FDM0IsT0FBWSxFQUNaLE1BQXFDLEVBQ3JDLGFBQXFCLEVBQ3JCLFdBQW1CLEVBQ25CLFNBQWlCO1FBRWpCLE1BQU0sR0FBRyxHQUFvRCxVQUFVLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxHQUFHLENBQ3BHLGFBQWEsQ0FDaEIsQ0FBQTtRQUNELElBQUksQ0FBQyxHQUFHO1lBQUUsT0FBTTtRQUNoQixJQUFJLFlBQVksR0FBRyxLQUFLLENBQUE7UUFDeEIsS0FBSyxNQUFNLEVBQUUsSUFBSSxHQUFHLEVBQUU7WUFDbEIsSUFBSTs7Z0JBRUEsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsc0JBQXNCLENBQUMsQ0FBQTtnQkFDaEYsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFOztpQkFFekI7cUJBQU0sSUFBSSxPQUFPLE1BQU0sS0FBSyxTQUFTLEVBQUU7O2lCQUV2QztxQkFBTSxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsSUFBSSxPQUFPLE1BQU0sQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFOztvQkFFeEUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQWE7d0JBQ3RCLElBQUksSUFBSSxLQUFLLFNBQVMsSUFBSSxZQUFZOzRCQUFFLE9BQU07d0JBQzlDLFlBQVksR0FBRyxJQUFJLENBQUE7d0JBQ25CLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxNQUFNLENBQUMsR0FBSSxDQUFDLEVBQUcsRUFBRSxTQUFTLEVBQUU7NEJBQ3JFLElBQUk7NEJBQ0osUUFBUSxFQUFFLElBQUk7NEJBQ2QsSUFBSSxFQUFFLFNBQVM7eUJBQ2xCLENBQUMsQ0FBQTtxQkFDTCxDQUFDLENBQUE7aUJBQ0w7YUFDSjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7YUFDbkI7U0FDSjtJQUNMLENBQUM7SUFZRCxTQUFTLHNCQUFzQjtRQUMzQixNQUFNLElBQUksS0FBSyxDQUNYLDBDQUEwQztZQUN0QyxpRUFBaUU7WUFDakUscURBQXFEO1lBQ3JELDhGQUE4RixDQUNyRyxDQUFBO0lBQ0wsQ0FBQzs7SUNyR0Q7QUFDQSxJQXdOQSxNQUFNLEdBQUcsR0FBRyxrQkFBa0IsQ0FBQTtJQUM5QixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxLQUFLLHdCQUF3QixDQUFBO0lBQzFELE1BQU0sZ0JBQWdCO1FBQ2xCO1lBVVEsYUFBUSxHQUFtQyxFQUFFLENBQUE7WUFUakQsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUM1QixNQUFNLE1BQU0sR0FBSSxDQUFzQixDQUFDLE1BQU0sQ0FBQTtnQkFDN0MsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUMzQixJQUFJO3dCQUNBLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtxQkFDWjtvQkFBQyxXQUFNLEdBQUU7aUJBQ2I7YUFDSixDQUFDLENBQUE7U0FDTDtRQUVELEVBQUUsQ0FBQyxDQUFTLEVBQUUsRUFBdUI7WUFDakMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7U0FDekI7UUFDRCxJQUFJLENBQUMsQ0FBUyxFQUFFLElBQVM7WUFDckIsSUFBSSxPQUFPLEVBQUU7Z0JBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7Z0JBQ3pCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO29CQUNsQixRQUFRLEVBQUUsQ0FBQyxRQUFhLEtBQ3BCLFFBQVEsQ0FBQyxhQUFhLENBQ2xCLElBQUksV0FBVyxDQUFNLEdBQUcsRUFBRTt3QkFDdEIsTUFBTSxFQUFFOzRCQUNKLE9BQU8sRUFBRSxLQUFLOzRCQUNkLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTs0QkFDWCxNQUFNLEVBQUUsUUFBUTt5QkFDbkI7cUJBQ0osQ0FBQyxDQUNMO2lCQUNSLENBQUMsQ0FBQTthQUNMO1lBQ0QsSUFBSSxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsZUFBZSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQztnQkFDcEYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQzNEO0tBQ0o7QUFDRCxJQUFPLE1BQU0sc0JBQXNCLEdBQTJCOztRQUUxRCxtQ0FBbUMsRUFBRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLG1DQUFtQyxFQUFFLEdBQUcsQ0FBQztRQUM3RyxNQUFNLFNBQVMsQ0FBQyxXQUFXLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTTtZQUNsRSxRQUFRLE9BQU8sQ0FBQyxJQUFJO2dCQUNoQixLQUFLLFNBQVM7O29CQUVWLElBQUksNEJBQTRCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUU7d0JBQ2pFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLEdBQUcsNEJBQTRCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBRSxDQUFBO3dCQUN0RSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO3dCQUNyQiw0QkFBNEIsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUE7cUJBQ2pEO3lCQUFNLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxLQUFLLEVBQUU7d0JBQ25DLGVBQWUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFBO3FCQUMvRSxBQUVBO29CQUNELE1BQUs7Z0JBQ1QsS0FBSyxlQUFlO29CQUNoQixNQUFNLEdBQUcsR0FBRyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFFLENBQUE7b0JBQ3BELElBQUksT0FBTyxDQUFDLElBQUk7d0JBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO3lCQUNuRCxJQUFJLE9BQU8sQ0FBQyxJQUFJO3dCQUNqQixpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRTs0QkFDekMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQzs7NEJBRWxCLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQzt5QkFDMUIsQ0FBQyxDQUFBO29CQUNOLE1BQUs7Z0JBQ1Q7b0JBQ0ksTUFBSzthQUNaO1NBQ0o7UUFDRCxNQUFNLDRCQUE0QixDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsT0FBTztZQUMxRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxvQkFDMUUsT0FBTyxJQUNWLElBQUksRUFBRSxlQUFlLElBQ3ZCLENBQUE7U0FDTDtLQUNKLENBQUE7QUFDRCxJQUFPLE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBTyxzQkFBNkIsRUFBRTtRQUMvRCxHQUFHLEVBQUUsRUFBRTtRQUNQLEdBQUcsRUFBRSxLQUFLO1FBQ1YsY0FBYyxFQUFFLElBQUksZ0JBQWdCLEVBQUU7S0FDekMsQ0FBQyxDQUFBOzthQ3RTYyxrQkFBa0IsQ0FBQyxHQUFpQjtRQUNoRCxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssTUFBTTtZQUFFLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQTtRQUMzQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssTUFBTTtZQUFFLE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDL0UsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLGNBQWMsRUFBRTtZQUM3QixPQUFPLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFBO1NBQzVDO1FBQ0QsT0FBTyxJQUFJLENBQUE7SUFDZixDQUFDO0FBQ0QsSUFBTyxlQUFlLGtCQUFrQixDQUFDLEdBQWdDO1FBQ3JFLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTtZQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQTtRQUNsRSxJQUFJLEdBQUcsWUFBWSxJQUFJLEVBQUU7WUFDckIsTUFBTSxNQUFNLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFBO1lBQ3BFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQTtTQUM3RTtRQUNELElBQUksR0FBRyxZQUFZLFdBQVcsRUFBRTtZQUM1QixPQUFPLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtTQUM5RTtRQUNELE1BQU0sSUFBSSxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUE7SUFDdkMsQ0FBQztJQUVEO0lBQ0EsU0FBUyxVQUFVLENBQUMsSUFBWTtRQUM1QixPQUFPLElBQUksR0FBRyxFQUFFLElBQUksSUFBSSxHQUFHLEVBQUU7Y0FDdkIsSUFBSSxHQUFHLEVBQUU7Y0FDVCxJQUFJLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxHQUFHO2tCQUN2QixJQUFJLEdBQUcsRUFBRTtrQkFDVCxJQUFJLEdBQUcsRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFO3NCQUN0QixJQUFJLEdBQUcsQ0FBQztzQkFDUixJQUFJLEtBQUssRUFBRTswQkFDWCxFQUFFOzBCQUNGLElBQUksS0FBSyxFQUFFOzhCQUNYLEVBQUU7OEJBQ0YsQ0FBQyxDQUFBO0lBQ1gsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFDLE9BQWUsRUFBRSxVQUFtQjtRQUN4RCxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQyxFQUNsRCxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFDdkIsT0FBTyxHQUFHLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksVUFBVSxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUM3RyxNQUFNLEdBQUcsSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFcEMsS0FBSyxJQUFJLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxHQUFHLENBQUMsRUFBRSxPQUFPLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNwRixLQUFLLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQTtZQUNsQixPQUFPLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFBO1lBQ3JFLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDdEMsS0FBSyxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDLElBQUksT0FBTyxHQUFHLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRTtvQkFDaEUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxNQUFNLENBQUMsRUFBRSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUE7aUJBQzlEO2dCQUNELE9BQU8sR0FBRyxDQUFDLENBQUE7YUFDZDtTQUNKO1FBRUQsT0FBTyxNQUFNLENBQUE7SUFDakIsQ0FBQztJQUNELFNBQVMsVUFBVSxDQUFDLE1BQWM7UUFDOUIsT0FBTyxNQUFNLEdBQUcsRUFBRTtjQUNaLE1BQU0sR0FBRyxFQUFFO2NBQ1gsTUFBTSxHQUFHLEVBQUU7a0JBQ1gsTUFBTSxHQUFHLEVBQUU7a0JBQ1gsTUFBTSxHQUFHLEVBQUU7c0JBQ1gsTUFBTSxHQUFHLENBQUM7c0JBQ1YsTUFBTSxLQUFLLEVBQUU7MEJBQ2IsRUFBRTswQkFDRixNQUFNLEtBQUssRUFBRTs4QkFDYixFQUFFOzhCQUNGLEVBQUUsQ0FBQTtJQUNaLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBQyxNQUFrQjtRQUNwQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFDckMsT0FBTyxHQUFHLEVBQUUsQ0FBQTtRQUVoQixLQUFLLElBQUksS0FBSyxFQUFFLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLE9BQU8sR0FBRyxDQUFDLEVBQUUsSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFO1lBQzlFLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFBOzs7OztZQUtoQixPQUFPLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQTtZQUNoRCxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFO2dCQUMzQyxPQUFPLElBQUksTUFBTSxDQUFDLFlBQVksQ0FDMUIsVUFBVSxDQUFDLENBQUMsT0FBTyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFDakMsVUFBVSxDQUFDLENBQUMsT0FBTyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFDakMsVUFBVSxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFDaEMsVUFBVSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FDM0IsQ0FBQTtnQkFDRCxPQUFPLEdBQUcsQ0FBQyxDQUFBO2FBQ2Q7U0FDSjtRQUVELE9BQU8sS0FBSyxLQUFLLENBQUMsR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQTtJQUM1RyxDQUFDOztJQzFGRCxNQUFNLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxHQUFHLEdBQUcsQ0FBQTtBQUNoRCxhQUFnQixnQkFBZ0IsQ0FBQyxDQUFTO1FBQ3RDLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUM7WUFBRSxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQzFGLE9BQU8sU0FBUyxDQUFBO0lBQ3BCLENBQUM7SUFDRDs7Ozs7OztBQU9BLGFBQWdCLFVBQVUsQ0FBQyxHQUFlLEVBQUUsV0FBbUI7UUFDM0QsR0FBRyxDQUFDLGVBQWUsR0FBRyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUMxRCxHQUFHLENBQUMsZUFBZSxHQUFHLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQzFELE9BQU8sR0FBRyxDQUFBO0lBQ2QsQ0FBQztJQUVELFNBQVMsdUJBQXVCLENBQUMsV0FBbUI7UUFDaEQsT0FBTyxDQUFDLEdBQVc7WUFDZixlQUFlLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDcEIsTUFBTSxFQUFFLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFFLENBQUE7WUFDakMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1NBQy9DLENBQUE7SUFDTCxDQUFDO0lBRUQsU0FBUyx1QkFBdUIsQ0FBQyxXQUFtQjtRQUNoRCxPQUFPLENBQUMsR0FBOEI7WUFDbEMsTUFBTSxHQUFHLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ2hDLE1BQU0sVUFBVSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBRSxDQUFBO1lBQ3pDLElBQUksR0FBRyxZQUFZLElBQUksRUFBRTtnQkFDckIsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7YUFDbkc7WUFDRCxPQUFPLEdBQUcsQ0FBQTtTQUNiLENBQUE7SUFDTCxDQUFDOztJQ2pDRDs7Ozs7QUFLQSxhQUFnQixjQUFjLENBQUMsV0FBbUIsRUFBRSxRQUFrQjtRQUNsRSxNQUFNLGNBQWMsR0FBcUI7WUFDckMsU0FBUyxFQUFFLG1CQUFtQixDQUEyQjtnQkFDckQsUUFBUSxFQUFFLE9BQU8sQ0FBQyxXQUFXLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztvQkFDekQsS0FBSyxDQUFDLE9BQU87d0JBQ1QsSUFBSSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUE7d0JBQy9CLElBQUksZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEVBQUU7NEJBQ3ZCLEdBQUcsR0FBRyxvQkFBb0IsV0FBVyxJQUFJLGdCQUFnQixDQUFDLEdBQUcsQ0FBRSxFQUFFLENBQUE7eUJBQ3BFO3dCQUNELGtCQUFrQixDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUE7d0JBQzlDLE1BQU0sSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxRQUFRLElBQUksRUFBRSxFQUFFLENBQUE7d0JBQzlDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtxQkFDaEI7b0JBQ0QsT0FBTzt3QkFDSCxPQUFPLENBQUMsQ0FBQTtxQkFDWDtpQkFDSixDQUFDO2FBQ0wsQ0FBQztZQUNGLE9BQU8sRUFBRSxtQkFBbUIsQ0FBeUI7Z0JBQ2pELE1BQU0sQ0FBQyxJQUFJO29CQUNQLE9BQU8seUJBQXlCLFdBQVcsSUFBSSxJQUFJLEVBQUUsQ0FBQTtpQkFDeEQ7Z0JBQ0QsV0FBVztvQkFDUCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO2lCQUM5QztnQkFDRCxTQUFTLEVBQUUsbUJBQW1CLENBQUMsV0FBVyxFQUFFLDJCQUEyQixDQUFDO2dCQUN4RSxXQUFXLEVBQUUsd0JBQXdCLENBQUMsV0FBVyxDQUFDO2FBQ3JELENBQUM7WUFDRixJQUFJLEVBQUUsbUJBQW1CLENBQXNCO2dCQUMzQyxNQUFNLGFBQWEsQ0FBQyxLQUFLLEVBQUUsT0FBTztvQkFDOUIsa0JBQWtCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUE7b0JBQ3BELE1BQU0sc0JBQXNCLENBQUMsNEJBQTRCLENBQUMsQ0FDdEQsV0FBVyxFQUNYLEtBQUssS0FBSyxTQUFTLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxFQUNoQyxPQUFPLENBQ1YsQ0FBQTtvQkFDRCxPQUFPLEVBQUUsQ0FBQTtpQkFDWjtnQkFDRCxNQUFNLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxxQkFBcUIsQ0FBQyxFQUFFO2dCQUNyRCxNQUFNLE1BQU0sQ0FBQyxLQUFLO29CQUNkLElBQUksQ0FBVyxDQUFBO29CQUNmLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQzt3QkFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTs7d0JBQ2pDLENBQUMsR0FBRyxLQUFLLENBQUE7b0JBQ2QsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7aUJBQzdFO2dCQUNELEtBQUssRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLG9CQUFvQixDQUFDLEVBQUU7Z0JBQ25ELE1BQU0sRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLHFCQUFxQixDQUFDLEVBQUU7Z0JBQ3JELE1BQU0sV0FBVyxDQUNiLEtBQWEsRUFDYixPQUFVLEVBQ1YsT0FBc0Q7b0JBRXRELGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFBO29CQUMzQixPQUFPLHVCQUF1QixDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFBO2lCQUMzRTthQUNKLENBQUM7WUFDRixPQUFPLEVBQUU7Z0JBQ0wsS0FBSyxFQUFFLFVBQVUsQ0FBK0I7b0JBQzVDLEtBQUssRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLDZCQUE2QixDQUFDLEVBQUU7b0JBQzVELE1BQU0sRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLDhCQUE4QixDQUFDLEVBQUU7b0JBQzlELEdBQUcsRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLDJCQUEyQixDQUFDLEVBQUU7b0JBQ3hELEdBQUcsRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLDJCQUEyQixDQUFDLENBQUM7O3dCQUVuRCxLQUFLLENBQUMsSUFBSTs0QkFDTixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO2dDQUFFLE9BQU8sQ0FBQyxJQUFnQixDQUFDLENBQUE7NEJBQ2xELElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO2dDQUMxQixJQUFJLElBQUksS0FBSyxJQUFJO29DQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQ0FDaEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTs2QkFDN0I7NEJBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO3lCQUNoQjt3QkFDRCxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDOzRCQUNkLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7Z0NBQUUsT0FBTyxHQUFHLENBQUE7aUNBQzdCLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7Z0NBQzlDLHlCQUFZLEdBQUcsRUFBSyxHQUFHLEVBQUU7NkJBQzVCOzRCQUNELE9BQU8sR0FBRyxDQUFBO3lCQUNiO3FCQUNKLENBQUM7aUJBQ0wsQ0FBQztnQkFDRixJQUFJLEVBQUUsbUJBQW1CLEVBQUU7Z0JBQzNCLFNBQVMsRUFBRSxtQkFBbUIsRUFBRTthQUNuQztZQUNELGFBQWEsRUFBRSxtQkFBbUIsQ0FBK0I7Z0JBQzdELFdBQVcsRUFBRSxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsbUNBQW1DLENBQUM7YUFDckYsQ0FBQztZQUNGLFNBQVMsRUFBRSxtQkFBbUIsQ0FBMkI7Z0JBQ3JELGlCQUFpQjtvQkFDYixPQUFPLElBQUksS0FBSyxDQUNaO3dCQUNJLFFBQVEsRUFBRSxJQUFJLEdBQUcsQ0FDYix5QkFBeUIsV0FBVyxrQ0FBa0MsQ0FDcEQ7cUJBQ04sRUFDcEI7d0JBQ0ksR0FBRyxDQUFDLENBQU0sRUFBRSxHQUFROzRCQUNoQixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUM7Z0NBQUUsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7NEJBQ3pCLE1BQU0sSUFBSSxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUE7eUJBQ3ZDO3FCQUNKLENBQ00sQ0FBQTtpQkFDZDthQUNKLENBQUM7WUFDRixXQUFXLEVBQUUsbUJBQW1CLENBQTZCO2dCQUN6RCxPQUFPLEVBQUUsWUFBWSxJQUFJO2dCQUN6QixRQUFRLEVBQUUsWUFBWSxJQUFJO2dCQUMxQixNQUFNLEVBQUUsWUFBWSxJQUFJO2FBQzNCLENBQUM7U0FDTCxDQUFBO1FBQ0QsT0FBTyxtQkFBbUIsQ0FBVSxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDOUQsQ0FBQztJQUdELFNBQVMsVUFBVSxDQUFJLGNBQWlCO1FBQ3BDLE9BQU8sY0FBYyxDQUFBO0lBQ3pCLENBQUM7SUFDRCxTQUFTLG1CQUFtQixDQUFVLGNBQTBCLEVBQUUsRUFBRSxLQUFLLEdBQUcsSUFBSTtRQUM1RSxPQUFPLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRTtZQUMxQixHQUFHLENBQUMsTUFBVyxFQUFFLEdBQUc7Z0JBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDO29CQUFFLE9BQU8sS0FBSyxHQUFHLGNBQWMsR0FBRyxtQkFBbUIsRUFBRSxDQUFBO2dCQUN2RSxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTthQUNyQjtZQUNELEtBQUs7Z0JBQ0QsT0FBTyxjQUFjLEVBQUUsQ0FBQTthQUMxQjtTQUNKLENBQUMsQ0FBQTtJQUNOLENBQUM7SUFDRCxTQUFTLGNBQWM7UUFDbkIsT0FBTztZQUNILE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtTQUN0QyxDQUFBO0lBQ0wsQ0FBQztJQUNELFNBQVMsa0JBQWtCLENBQUksTUFBUyxFQUFTLEVBQUUsR0FBRyxJQUFpQjtRQUNuRSxNQUFNLElBQUkscUJBQVEsR0FBRyxDQUFFLENBQUE7UUFDdkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNqQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTTtZQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMseUJBQXlCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEtBQUssRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3hHLENBQUM7SUFLRDs7Ozs7Ozs7OztJQVVBLFNBQVMsT0FBTyxDQWVkLFdBQW1CLEVBQUUsR0FBUTs7OztRQUkzQixPQUFPOzs7O1FBZUgsVUFBbUIsRUFBUztZQTBCNUIsTUFBTSxJQUFJLEdBQUcsQ0FBSSxDQUFLLEtBQUssQ0FBQyxDQUFBO1lBQzVCLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBRyxJQUFXLEtBQUssSUFBSSxDQUFBO1lBQ3pDLE1BQU0sY0FBYyxHQUFvRSxJQUFJLENBQUMsR0FBRyxDQUFRLENBQUE7WUFDeEcsUUFBUyxPQUFPLEdBQUcsSUFBaUI7O2dCQUVoQyxNQUFNLFFBQVEsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFhLENBQUE7O2dCQUVqRSxNQUFNLE1BQU0sR0FBRyxNQUFNLGNBQWMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxRQUFRLENBQUMsQ0FBQTs7Z0JBRTdELE1BQU0sYUFBYSxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLENBQWtCLENBQUE7Z0JBQ3hGLE9BQU8sYUFBYSxDQUFBO2FBQ3ZCLEVBQXlFO1NBQzdFLENBQUE7SUFDTCxDQUFDOzthQ3ZPZSxXQUFXLENBQUMsV0FBbUIsRUFBRSxTQUF1QjtRQUNwRSxPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtZQUNwQixNQUFNLEtBQUssQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBMkI7Z0JBQzdFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFBO2dCQUM3RCxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLEdBQUcsV0FBVyxHQUFHLEdBQUcsQ0FBQyxFQUFFO29CQUM5RCxPQUFPLFNBQVMsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUE7aUJBQzdDO3FCQUFNO29CQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQTtvQkFDN0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7b0JBQ2xELElBQUksSUFBSSxLQUFLLElBQUk7d0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtvQkFDdEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO29CQUM5QyxPQUFPLFdBQVcsQ0FBQTtpQkFDckI7YUFDSjtTQUNKLENBQUMsQ0FBQTtJQUNOLENBQUM7O0lDbEJELElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQTtJQUN0QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM3QixRQUFRLENBQUMsZ0JBQWdCLENBQ3JCLE9BQU8sRUFDUDtRQUNJLGNBQWMsR0FBRyxHQUFHLEVBQUUsQ0FBQTtJQUMxQixDQUFDLEVBQ0QsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FDbkMsQ0FBQTtBQUNELGFBQWdCLHVCQUF1QjtRQUNuQyxPQUFPLEdBQUcsRUFBRSxHQUFHLGNBQWMsR0FBRyxJQUFJLENBQUE7SUFDeEMsQ0FBQzs7YUNSZSxZQUFZLENBQUMsV0FBbUI7UUFDNUMsT0FBTyxDQUFDLEdBQUcsR0FBRyxhQUFhLEVBQUUsTUFBZSxFQUFFLFFBQWlCLEVBQUUsT0FBaUI7WUFDOUUsSUFBSSxDQUFDLHVCQUF1QixFQUFFO2dCQUFFLE9BQU8sSUFBSSxDQUFBO1lBQzNDLElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxLQUFLLFFBQVEsS0FBSyxRQUFRLElBQUksT0FBTztnQkFDdEQsT0FBTyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUNwRSxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxXQUFXLEVBQUU7Z0JBQ3JDLE1BQU0sRUFBRSxJQUFJO2dCQUNaLEdBQUc7YUFDTixDQUFDLENBQUE7WUFDRixPQUFPLElBQUksQ0FBQTtTQUNkLENBQUE7SUFDTCxDQUFDO0FBRUQsYUFBZ0IsYUFBYSxDQUFDLFdBQW1CO1FBQzdDLE9BQU87WUFDSCxJQUFJLENBQUMsdUJBQXVCLEVBQUU7Z0JBQUUsT0FBTTtZQUN0QyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUM1RCxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUcsQ0FBQyxDQUNyRCxDQUFBO1NBQ0osQ0FBQTtJQUNMLENBQUM7O0lDdkJEOzs7Ozs7Ozs7Ozs7Ozs7QUFlQSxJQU9BOzs7O0lBSUEsU0FBUyxpQkFBaUIsQ0FBQyxDQUFNLEVBQUUsSUFBVyxFQUFFO1FBQzVDLElBQUksQ0FBQyxLQUFLLFNBQVMsSUFBSSxDQUFDLEtBQUssSUFBSTtZQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQzNDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDbEMsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxTQUFTLElBQUksQ0FBQyxLQUFLLE1BQU0sQ0FBQyxTQUFTO1lBQUUsT0FBTyxDQUFDLENBQUE7UUFDckUsT0FBTyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUNqRSxDQUFDO0lBQ0Q7OztJQUdBLE1BQU0sY0FBYyxHQUFHLENBQUM7OztRQUdwQixNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUSxDQUFDLEVBQUUsYUFBYSxFQUFFO1lBQ2xFLEtBQUssRUFBRSxVQUFVLENBQUMsUUFBUTtTQUM3QixDQUFDLENBQUE7UUFDRixNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUE7UUFDekIsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3hELE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ3pDLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFBO1FBQzdDLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ3ZDLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ3pDLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxhQUFhLEVBQUU7WUFDckQsR0FBRztnQkFDQyxPQUFPLFNBQVMsQ0FBQTthQUNuQjtTQUNKLENBQUMsQ0FBQTtRQUNGLE9BQU8sQ0FBQyxXQUE4QjtZQUNsQyxNQUFNLGFBQWEscUJBQVEsT0FBTyxDQUFFLENBQUE7WUFDcEMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQTs7WUFFcEcsS0FBSyxNQUFNLEdBQUcsSUFBSSxPQUFPLEVBQUU7Z0JBQ3ZCLDZCQUE2QixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQTthQUMxRDtZQUNELE1BQU0sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRTtnQkFDekMsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLFFBQVEsRUFBRSxLQUFLO2dCQUNmLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixLQUFLLEVBQUUsV0FBVzthQUNyQixDQUFDLENBQUE7WUFDRixNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFBO1lBQ3ZELE1BQU0sS0FBSyxHQUFHLGlCQUFpQixDQUFDLFVBQVUsQ0FBQztpQkFDdEMsR0FBRyxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQztpQkFDckMsV0FBVyxDQUFDLENBQUMsUUFBUSxFQUFFLE9BQU87Z0JBQzNCLE1BQU0sSUFBSSxxQkFBUSxPQUFPLENBQUUsQ0FBQTtnQkFDM0IsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLEVBQUU7b0JBQ3BCLDZCQUE2QixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQTtpQkFDdkQ7Z0JBQ0QsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQTthQUN2QyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ1YsTUFBTSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDekMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQTtTQUN0RCxDQUFBO0lBQ0wsQ0FBQyxHQUFHLENBQUE7SUFDSjs7O0FBR0EsVUFBYSxvQ0FBb0M7Ozs7OztRQWtCN0MsWUFBbUIsV0FBbUIsRUFBUyxRQUFrQjtZQUE5QyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUFTLGFBQVEsR0FBUixRQUFRLENBQVU7WUFqQnpELFVBQUssR0FBR0MsY0FBZ0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQTtZQUl2QyxLQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxPQUFPLENBQUE7WUFjbkMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO1NBQ2Q7UUFsQkQsSUFBSSxNQUFNO1lBQ04sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQTtTQUMzQjs7Ozs7UUFNRCxRQUFRLENBQUMsVUFBa0I7WUFDdkIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQTtTQUN6QztRQVNPLElBQUk7WUFDUixjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQzNCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUNyRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQy9ELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUMvRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQ2pELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7U0FDdEQ7S0FDSjtJQUNEOzs7Ozs7Ozs7O0lBVUEsU0FBUyw2QkFBNkIsQ0FBQyxJQUF3QixFQUFFLE1BQWM7UUFDM0UsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFBO1FBQ2hDLElBQUksR0FBRztZQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQzNDLElBQUksR0FBRztZQUFFLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFRLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDeEQsSUFBSSxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssVUFBVSxFQUFFO1lBQ3RDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNyRCxJQUFJLENBQUMsS0FBSyxHQUFHLFVBQVMsR0FBRyxJQUFXO2dCQUNoQyxJQUFJLEdBQUcsQ0FBQyxNQUFNO29CQUFFLE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFDakUsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7YUFDNUMsQ0FBQTtZQUNELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQzFDLElBQUk7O2dCQUVBLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUE7YUFDekM7WUFBQyxXQUFNLEdBQUU7U0FDYjtJQUNMLENBQUM7O0lDMUlELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO0lBQ2pELFNBQVMsYUFBYSxDQUFDLElBQVksRUFBRSxXQUFtQjtRQUNwRCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDckMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUFFLE9BQU8sSUFBSSxDQUFBOztZQUNuQyxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUM5QyxDQUFDO0lBQ0QsU0FBUyxTQUFTLENBQUMsV0FBbUI7UUFDbEMsT0FBTyx3QkFBd0IsR0FBRyxXQUFXLEdBQUcsR0FBRyxDQUFBO0lBQ3ZELENBQUM7QUFFRCxhQUFnQixXQUFXLENBQUMsV0FBbUIsRUFBRSxTQUFpQyxFQUFFLElBQVk7OztRQUc1RixJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3hCLEtBQUssTUFBTSxHQUFHLElBQUksU0FBUyxFQUFFO2dCQUN6QixJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUFFLFNBQVE7Z0JBQ3BELE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDMUIsT0FBTyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQ3JCLFNBQVMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUE7YUFDakU7O1lBRUQsU0FBUyxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQTtTQUMvQjtRQUNELE9BQU8sU0FBUyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQTtJQUN0RCxDQUFDO0FBRUQsSUFBTyxlQUFlLGdCQUFnQixDQUFDLFdBQW1CLEVBQUUsU0FBaUMsRUFBRSxJQUFZO1FBQ3ZHLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQzNELElBQUksU0FBUztZQUFFLE9BQU8sU0FBUyxDQUFBO1FBRS9CLE1BQU0sUUFBUSxHQUFHLE1BQU0sS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQTtRQUM5RCxJQUFJLFFBQVEsQ0FBQyxFQUFFO1lBQUUsT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDdkMsT0FBTyxTQUFTLENBQUE7SUFDcEIsQ0FBQzs7SUNqQk0sTUFBTSxzQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBZ0MsQ0FBQTtBQUM3RSxhQUFnQixvQkFBb0IsQ0FDaEMsV0FBbUIsRUFDbkIsUUFBa0IsRUFDbEIscUJBQTZDLEVBQUU7UUFFL0MsTUFBTSxXQUFXLEdBQ2IsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQ0FBaUMsQ0FBQztjQUN6RyxtQkFBbUI7Y0FDbkIsZ0JBQWdCLENBQUE7UUFDMUIsT0FBTyxDQUFDLEtBQUssQ0FDVCxvQ0FBb0MsUUFBUSxDQUFDLElBQUksSUFBSSxXQUFXLGlCQUFpQixFQUNqRixRQUFRLEVBQ1Isd0JBQXdCLEVBQ3hCLGtCQUFrQixFQUNsQixNQUFNLFdBQVcsT0FBTyxDQUMzQixDQUFBO1FBQ0QsSUFBSSxRQUFRLENBQUMsUUFBUSxLQUFLLHNCQUFzQjtZQUFFLDBDQUEwQyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUVuSCxJQUFJO1lBQ0EsSUFBSSxXQUFXLEtBQUssZ0JBQWdCLEVBQUU7Z0JBQ2xDLGtCQUFrQixFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0saUJBQWlCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUE7YUFDaEc7aUJBQU0sSUFBSSxXQUFXLEtBQUssbUJBQW1CLEVBQUU7Z0JBQzVDLGtCQUFrQixFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sb0JBQW9CLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUE7YUFDbkc7aUJBQU07Z0JBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQyw4Q0FBOEMsV0FBVyxFQUFFLENBQUMsQ0FBQTthQUM1RTtTQUNKO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDUixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQ25CO1FBQ0QsT0FBTyxzQkFBc0IsQ0FBQTtJQUNqQyxDQUFDO0lBRUQsU0FBUyxrQkFBa0I7UUFDdkIsSUFBSSxRQUFRLENBQUMsVUFBVSxLQUFLLFVBQVU7WUFBRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQUNoRSxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU87WUFDdEIsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7U0FDeEYsQ0FBQyxDQUFBO0lBQ04sQ0FBQztJQUVELGVBQWUsb0JBQW9CLENBQy9CLFFBQWtCLEVBQ2xCLFdBQW1CLEVBQ25CLGtCQUEwQztRQUUxQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7WUFBRSxPQUFNO1FBQ2hDLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsUUFBUSxDQUFDLFVBQWlCLENBQUE7UUFDcEQsSUFBSSxJQUFJO1lBQUUsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLCtEQUErRCxDQUFDLENBQUE7UUFDOUYsSUFBSSxRQUFRLENBQUMsUUFBUSxLQUFLLFdBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLEVBQUU7WUFDMUYsTUFBTSxJQUFJLFNBQVMsQ0FBQyx1RkFBdUYsQ0FBQyxDQUFBO1NBQy9HO1FBQ0Q7WUFDSSxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBRSxDQUFBO1lBQ2hGLE1BQU0sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRTtnQkFDdEQsR0FBRztvQkFDQyxPQUFPLEdBQUcsQ0FBQyxHQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO2lCQUM3QjtnQkFDRCxHQUFHLENBQUMsSUFBSTtvQkFDSixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQTtvQkFDN0IsTUFBTSxTQUFTLEdBQUcsV0FBVyxDQUFDLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQTtvQkFDcEUsSUFBSSxTQUFTO3dCQUFFLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQTs7d0JBRW5ELGdCQUFnQixDQUFDLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLENBQUM7NkJBQ2xELElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQVMseUJBQXlCLENBQUMsQ0FBQzs2QkFDdkUsSUFBSSxDQUFDLElBQUksSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7NkJBQ2pELEtBQUssQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFBO29CQUN4RSxHQUFHLENBQUMsR0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7b0JBQ3pCLE9BQU8sSUFBSSxDQUFBO2lCQUNkO2FBQ0osQ0FBQyxDQUFBO1NBQ0w7UUFDRCxLQUFLLE1BQU0sSUFBSSxJQUFLLE9BQW9CLElBQUksRUFBRSxFQUFFO1lBQzVDLE1BQU0sU0FBUyxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsV0FBVyxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFBO1lBQy9FLElBQUksU0FBUyxFQUFFOztnQkFFWCxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUE7YUFDM0M7aUJBQU07Z0JBQ0gsT0FBTyxDQUFDLEtBQUssQ0FBQyxtREFBbUQsUUFBUSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFBO2FBQzdGO1NBQ0o7SUFDTCxDQUFDO0lBQ0QsU0FBUywwQ0FBMEMsQ0FBQyxXQUFtQixFQUFFLFFBQWtCO1FBQ3ZGLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ2xCLE9BQU8sRUFBRSxjQUFjLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQztZQUM5QyxLQUFLLEVBQUUsV0FBVyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQzdDLEdBQUcsRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQztZQUNqQyxJQUFJLEVBQUUsWUFBWSxDQUFDLFdBQVcsQ0FBQztZQUMvQixLQUFLLEVBQUUsYUFBYSxDQUFDLFdBQVcsQ0FBQztTQUNOLENBQUMsQ0FBQTtJQUNwQyxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxXQUFtQixFQUFFLEdBQVc7UUFDdEQsSUFBSSxRQUFRLENBQUMsUUFBUSxLQUFLLHNCQUFzQjtZQUFFLE9BQU8sSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQTtRQUM1RSxNQUFNLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQzs7OztvRUFJeUMsV0FBVzs7Ozs7Ozs7Ozs7Ozs7O2tCQWU3RCxHQUFHO2dCQUNMLENBQUMsQ0FBQTtRQUNiLENBQUMsRUFBRSxDQUFBO0lBQ1AsQ0FBQztJQUVELGVBQWUsaUJBQWlCLENBQUMsUUFBa0IsRUFBRSxXQUFtQixFQUFFLGtCQUEwQztRQUNoSCxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzFDLE1BQU0sV0FBVyxHQUFHLElBQUksb0NBQW9DLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1lBQ25GLE1BQU0sR0FBRyxHQUFpQjtnQkFDdEIsUUFBUTtnQkFDUixXQUFXO2dCQUNYLGtCQUFrQjthQUNyQixDQUFBO1lBQ0Qsc0JBQXNCLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQTtTQUMvQztRQUNELEtBQUssTUFBTSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ3ZFLHlCQUF5QixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUN6QyxJQUNJLFdBQVcsQ0FDUCxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQ3RCLE9BQU8sQ0FBQyxPQUFPLEVBQ2YsT0FBTyxDQUFDLGVBQWUsSUFBSSxFQUFFLEVBQzdCLE9BQU8sQ0FBQyxhQUFhLElBQUksRUFBRSxFQUMzQixPQUFPLENBQUMsYUFBYSxJQUFJLEVBQUUsRUFDM0IsT0FBTyxDQUFDLGlCQUFpQixDQUM1QixFQUNIO2dCQUNFLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkNBQTJDLEVBQUUsT0FBTyxDQUFDLENBQUE7Z0JBQ25FLE1BQU0saUJBQWlCLENBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTthQUM5RTtpQkFBTTtnQkFDSCxPQUFPLENBQUMsS0FBSyxDQUFDLDBEQUEwRCxFQUFFLE9BQU8sQ0FBQyxDQUFBO2FBQ3JGO1NBQ0o7SUFDTCxDQUFDO0FBRUQsSUFBTyxlQUFlLGlCQUFpQixDQUNuQyxXQUFtQixFQUNuQixRQUFrQixFQUNsQixPQUFvRCxFQUNwRCxxQkFBNkMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQztVQUM5RSxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFFLENBQUMsa0JBQWtCO1VBQzNELEVBQUU7UUFFUixNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsc0JBQXNCLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBRSxDQUFBO1FBQ2hFLEtBQUssTUFBTSxJQUFJLElBQUksT0FBTyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDakMsTUFBTSxTQUFTLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFDL0UsSUFBSSxTQUFTLEVBQUU7Z0JBQ1gsV0FBVyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQTthQUNsQztpQkFBTTtnQkFDSCxPQUFPLENBQUMsS0FBSyxDQUFDLGdEQUFnRCxRQUFRLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDLENBQUE7YUFDMUY7U0FDSjtJQUNMLENBQUM7SUFFRCxTQUFTLHlCQUF5QixDQUFDLE9BQW9ELEVBQUUsS0FBYTtRQUNsRyxJQUFJLE9BQU8sQ0FBQyxVQUFVO1lBQ2xCLE9BQU8sQ0FBQyxJQUFJLENBQUMscUVBQXFFLEtBQUssY0FBYyxDQUFDLENBQUE7UUFDMUcsSUFBSSxPQUFPLENBQUMsR0FBRztZQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsOERBQThELEtBQUssT0FBTyxDQUFDLENBQUE7UUFDekcsSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssZ0JBQWdCO1lBQ3JELE9BQU8sQ0FBQyxJQUFJLENBQUMsaUVBQWlFLEtBQUssVUFBVSxDQUFDLENBQUE7SUFDdEcsQ0FBQzs7SUMzTEQsTUFBTSxHQUFHLEdBQ0wsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsd0JBQXdCLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFBO0lBQ25IO0lBQ0E7SUFDQSxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtJQUUvQjs7Ozs7O09BTUc7Ozs7In0=