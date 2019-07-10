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
            this.listeners = [];
            this.listener = (request) => {
                let { key, data, instanceKey } = request.detail || request;
                // Message is not for us
                if (this.instanceKey !== (instanceKey || ''))
                    return;
                if (this.writeToConsole) {
                    console.log(`%cReceive%c %c${key.toString()}`, 'background: rgba(0, 255, 255, 0.6); color: black; padding: 0px 6px; border-radius: 4px;', '', 'text-decoration: underline', data);
                }
                this.listeners.filter(it => it.key === key).forEach(it => it.handler(data));
            };
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
            this.listeners.push({
                handler: data => handler(data),
                key: event,
            });
        }
        /**
         * Send message to local or other instance of extension
         * @param key - Key of the message
         * @param data - Data of the message
         * @param alsoSendToDocument - ! Send message to document. This may leaks secret! Only open in localhost!
         */
        send(key, data, alsoSendToDocument = location.hostname === 'localhost') {
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
     * This is a light implementation of JSON RPC 2.0
     *
     * https://www.jsonrpc.org/specification
     *
     * ! Not implemented:
     * - Send Notification (receive Notification is okay)
     * - Batch invocation (defined in the section 6 of the spec)
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
    function AsyncCall(implementation, options = {}) {
        const { writeToConsole, serializer, dontThrowOnNotImplemented, MessageCenter: MessageCenter$1, key, strictJSONRPC } = {
            MessageCenter: MessageCenter,
            dontThrowOnNotImplemented: true,
            serializer: NoSerialization,
            writeToConsole: true,
            key: 'default',
            strictJSONRPC: false,
            ...options,
        };
        const message = new MessageCenter$1();
        const CALL = `${key}-jsonrpc`;
        const map = new Map();
        async function onRequest(data) {
            try {
                const executor = implementation[data.method];
                if (!executor) {
                    if (dontThrowOnNotImplemented) {
                        console.debug('Receive remote call, but not implemented.', key, data);
                        return;
                    }
                    else
                        return ErrorResponse.MethodNotFound(data.id);
                }
                const args = data.params;
                const promise = executor(...args);
                if (writeToConsole)
                    console.log(`${key}.%c${data.method}%c(${args.map(() => '%o').join(', ')}%c)\n%o %c@${data.id}`, 'color: #d2c057', '', ...args, '', promise, 'color: gray; font-style: italic;');
                return new SuccessResponse(data.id, await promise, strictJSONRPC);
            }
            catch (e) {
                console.error(e);
                return new ErrorResponse(data.id, -1, e.message, e.stack);
            }
        }
        async function onResponse(data) {
            if ('error' in data && writeToConsole)
                console.error(`${data.error.message}(${data.error.code}) %c@${data.id}\n%c${data.error.data.stack}`, 'color: gray', '');
            if (data.id === null)
                return;
            const [resolve, reject] = map.get(data.id) || [null, null];
            if (!resolve)
                return; // drop this response
            map.delete(data.id);
            if ('error' in data) {
                const err = new Error(data.error.message);
                err.stack = data.error.data.stack;
                reject(err);
            }
            else {
                resolve(data.result);
            }
        }
        message.on(CALL, async (_) => {
            let data;
            let result = undefined;
            try {
                data = await serializer.deserialization(_);
                if (isJSONRPCObject(data)) {
                    if ('method' in data) {
                        result = await onRequest(data);
                        await send(result);
                    }
                    else if ('error' in data || 'result' in data) {
                        onResponse(data);
                    }
                    else {
                        if ('resultIsUndefined' in data) {
                            ;
                            data.result = undefined;
                            onResponse(data);
                        }
                        else {
                            await send(ErrorResponse.InvalidRequest(data.id || null));
                        }
                    }
                }
                else if (Array.isArray(data) && data.every(isJSONRPCObject)) {
                    await send(ErrorResponse.InternalError(null, ": Async-Call isn't implement patch jsonrpc yet."));
                }
                else {
                    if (strictJSONRPC) {
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
                if (!res)
                    return;
                message.send(CALL, await serializer.serialization(res));
            }
        });
        return new Proxy({}, {
            get(target, method, receiver) {
                return (...params) => new Promise((resolve, reject) => {
                    if (typeof method !== 'string')
                        return reject('Only string can be keys');
                    const id = Math.random()
                        .toString(36)
                        .slice(2);
                    const req = new Request(id, method, params);
                    serializer.serialization(req).then(data => {
                        message.send(CALL, data);
                        map.set(id, [resolve, reject]);
                    }, reject);
                });
            },
        });
    }
    const jsonrpc = '2.0';
    class Request {
        constructor(id, method, params) {
            this.id = id;
            this.method = method;
            this.params = params;
            this.jsonrpc = '2.0';
            return { id, method, params, jsonrpc };
        }
    }
    class SuccessResponse {
        constructor(id, result, strictMode) {
            this.id = id;
            this.result = result;
            this.jsonrpc = '2.0';
            const obj = { id, jsonrpc, result: result || null };
            if (!strictMode && result === undefined)
                obj.resultIsUndefined = true;
            return obj;
        }
    }
    class ErrorResponse {
        constructor(id, code, message, stack) {
            this.id = id;
            this.jsonrpc = '2.0';
            const error = (this.error = { code, message, data: { stack } });
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
        return typeof data === 'object' && data !== null && 'jsonrpc' in data && data.jsonrpc === '2.0';
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
    function createSendMessage(extensionID) {
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
            return new Promise((resolve, reject) => {
                const messageID = Math.random().toString();
                Host.sendMessage(extensionID, toExtensionID, null, messageID, {
                    data: message,
                    response: false,
                }).catch(e => {
                    reject(e);
                    TwoWayMessagePromiseResolver.delete(messageID);
                });
                TwoWayMessagePromiseResolver.set(messageID, [resolve, reject]);
            });
        };
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
        send(_, data) {
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
    const Host = AsyncCall({
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
    }, {
        dontThrowOnNotImplemented: false,
        key: '',
        strictJSONRPC: true,
        MessageCenter: iOSWebkitChannel,
    });

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
                        const { url, filename } = options;
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
                sendMessage: createSendMessage(extensionID),
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
                    // @ts-ignore We're implementing non-standard API in WebExtension
                    getBytesInUse: binding(extensionID, 'browser.storage.local.getBytesInUse')(),
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
    function PartialImplemented(obj, ...keys) {
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

    const { createObjectURL, revokeObjectURL } = URL;
    function getIDFromBlobURL(x) {
        return new URL(new URL(x).pathname).pathname;
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
                blobToBase64(obj).then(base64 => Host['URL.createObjectURL'](extensionID, resourceID, base64, obj.type));
            }
            return url;
        };
    }
    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('loadend', () => {
                const [header, base64] = reader.result.split(',');
                resolve(base64);
            });
            reader.addEventListener('error', e => reject(e));
            reader.readAsDataURL(blob);
        });
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
    function registerWebExtension(extensionID, manifest, environment, preloadedResources = {}) {
        console.debug(`[WebExtension] Loading extension ${manifest.name}(${extensionID}) with manifest`, manifest, `and preloaded resource`, preloadedResources, `in ${environment} mode`);
        try {
            if (environment === 'content script') {
                LoadContentScript(manifest, extensionID, preloadedResources);
            }
            else if (environment === 'background script') {
                LoadBackgroundScript(manifest, extensionID, preloadedResources);
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
        Object.assign(window, { browser: BrowserFactory(extensionID, manifest) });
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
    
    registerWebExtension(<ID>, <Manifest>, <Env>, <Resources>);

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMvVVJMTWF0Y2hlci50cyIsIi4uL25vZGVfbW9kdWxlcy9yZWFsbXMtc2hpbS9kaXN0L3JlYWxtcy1zaGltLnVtZC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AaG9sb2Zsb3dzL2tpdC9lcy9FeHRlbnNpb24vTWVzc2FnZUNlbnRlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9AaG9sb2Zsb3dzL2tpdC9lcy9FeHRlbnNpb24vQXN5bmMtQ2FsbC5qcyIsIi4uL3NyYy91dGlscy9Mb2NhbE1lc3NhZ2VzLnRzIiwiLi4vc3JjL3V0aWxzL2RlZXBDbG9uZS50cyIsIi4uL3NyYy9zaGltcy9icm93c2VyLm1lc3NhZ2UudHMiLCIuLi9zcmMvUlBDLnRzIiwiLi4vc3JjL3NoaW1zL2Jyb3dzZXIudHMiLCIuLi9zcmMvc2hpbXMvVVJMLmNyZWF0ZStyZXZva2VPYmplY3RVUkwudHMiLCIuLi9zcmMvc2hpbXMvWFJheVZpc2lvbi50cyIsIi4uL3NyYy9FeHRlbnNpb25zLnRzIiwiLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2hlY2sgaWYgdGhlIGN1cnJlbnQgbG9jYXRpb24gbWF0Y2hlcy4gVXNlZCBpbiBtYW5pZmVzdC5qc29uIHBhcnNlclxuICogQHBhcmFtIGxvY2F0aW9uIEN1cnJlbnQgbG9jYXRpb25cbiAqIEBwYXJhbSBtYXRjaGVzXG4gKiBAcGFyYW0gZXhjbHVkZV9tYXRjaGVzXG4gKiBAcGFyYW0gaW5jbHVkZV9nbG9ic1xuICogQHBhcmFtIGV4Y2x1ZGVfZ2xvYnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoaW5nVVJMKFxuICAgIGxvY2F0aW9uOiBVUkwsXG4gICAgbWF0Y2hlczogc3RyaW5nW10sXG4gICAgZXhjbHVkZV9tYXRjaGVzOiBzdHJpbmdbXSxcbiAgICBpbmNsdWRlX2dsb2JzOiBzdHJpbmdbXSxcbiAgICBleGNsdWRlX2dsb2JzOiBzdHJpbmdbXSxcbiAgICBhYm91dF9ibGFuaz86IGJvb2xlYW4sXG4pIHtcbiAgICBsZXQgcmVzdWx0ID0gZmFsc2VcbiAgICAvLyA/IFdlIGV2YWwgbWF0Y2hlcyBmaXJzdCB0aGVuIGV2YWwgbWlzbWF0Y2hlc1xuICAgIGZvciAoY29uc3QgaXRlbSBvZiBtYXRjaGVzKSBpZiAobWF0Y2hlc19tYXRjaGVyKGl0ZW0sIGxvY2F0aW9uLCBhYm91dF9ibGFuaykpIHJlc3VsdCA9IHRydWVcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZXhjbHVkZV9tYXRjaGVzKSBpZiAobWF0Y2hlc19tYXRjaGVyKGl0ZW0sIGxvY2F0aW9uKSkgcmVzdWx0ID0gZmFsc2VcbiAgICBpZiAoaW5jbHVkZV9nbG9icy5sZW5ndGgpIGNvbnNvbGUud2FybignaW5jbHVkZV9nbG9icyBub3Qgc3VwcG9ydGVkIHlldC4nKVxuICAgIGlmIChleGNsdWRlX2dsb2JzLmxlbmd0aCkgY29uc29sZS53YXJuKCdleGNsdWRlX2dsb2JzIG5vdCBzdXBwb3J0ZWQgeWV0LicpXG4gICAgcmV0dXJuIHJlc3VsdFxufVxuLyoqXG4gKiBTdXBwb3J0ZWQgcHJvdG9jb2xzXG4gKi9cbmNvbnN0IHN1cHBvcnRlZFByb3RvY29sczogcmVhZG9ubHkgc3RyaW5nW10gPSBbXG4gICAgJ2h0dHA6JyxcbiAgICAnaHR0cHM6JyxcbiAgICAvLyBcIndzOlwiLFxuICAgIC8vIFwid3NzOlwiLFxuICAgIC8vIFwiZnRwOlwiLFxuICAgIC8vIFwiZGF0YTpcIixcbiAgICAvLyBcImZpbGU6XCJcbl1cbmZ1bmN0aW9uIG1hdGNoZXNfbWF0Y2hlcihfOiBzdHJpbmcsIGxvY2F0aW9uOiBVUkwsIGFib3V0X2JsYW5rPzogYm9vbGVhbikge1xuICAgIGlmIChsb2NhdGlvbi50b1N0cmluZygpID09PSAnYWJvdXQ6YmxhbmsnICYmIGFib3V0X2JsYW5rKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChfID09PSAnPGFsbF91cmxzPicpIHtcbiAgICAgICAgaWYgKHN1cHBvcnRlZFByb3RvY29scy5pbmNsdWRlcyhsb2NhdGlvbi5wcm90b2NvbCkpIHJldHVybiB0cnVlXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBjb25zdCBbcnVsZSwgd2lsZGNhcmRQcm90b2NvbF0gPSBub3JtYWxpemVVUkwoXylcbiAgICBpZiAocnVsZS5wb3J0ICE9PSAnJykgcmV0dXJuIGZhbHNlXG4gICAgaWYgKCFwcm90b2NvbF9tYXRjaGVyKHJ1bGUucHJvdG9jb2wsIGxvY2F0aW9uLnByb3RvY29sLCB3aWxkY2FyZFByb3RvY29sKSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKCFob3N0X21hdGNoZXIocnVsZS5ob3N0bmFtZSwgbG9jYXRpb24uaG9zdG5hbWUpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoIXBhdGhfbWF0Y2hlcihydWxlLnBhdGhuYW1lLCBsb2NhdGlvbi5wYXRobmFtZSwgbG9jYXRpb24uc2VhcmNoKSkgcmV0dXJuIGZhbHNlXG4gICAgcmV0dXJuIHRydWVcbn1cbi8qKlxuICogTm9ybWFsaXplVVJMXG4gKiBAcGFyYW0gXyAtIFVSTCBkZWZpbmVkIGluIG1hbmlmZXN0XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVVSTChfOiBzdHJpbmcpOiBbVVJMLCBib29sZWFuXSB7XG4gICAgaWYgKF8uc3RhcnRzV2l0aCgnKjovLycpKSByZXR1cm4gW25ldyBVUkwoXy5yZXBsYWNlKC9eXFwqOi8sICdodHRwczonKSksIHRydWVdXG4gICAgcmV0dXJuIFtuZXcgVVJMKF8pLCBmYWxzZV1cbn1cbmZ1bmN0aW9uIHByb3RvY29sX21hdGNoZXIobWF0Y2hlclByb3RvY29sOiBzdHJpbmcsIGN1cnJlbnRQcm90b2NvbDogc3RyaW5nLCB3aWxkY2FyZFByb3RvY29sOiBib29sZWFuKSB7XG4gICAgLy8gPyBvbmx5IGBodHRwOmAgYW5kIGBodHRwczpgIGlzIHN1cHBvcnRlZCBjdXJyZW50bHlcbiAgICBpZiAoIXN1cHBvcnRlZFByb3RvY29scy5pbmNsdWRlcyhjdXJyZW50UHJvdG9jb2wpKSByZXR1cm4gZmFsc2VcbiAgICAvLyA/IGlmIHdhbnRlZCBwcm90b2NvbCBpcyBcIio6XCIsIG1hdGNoIGV2ZXJ5dGhpbmdcbiAgICBpZiAod2lsZGNhcmRQcm90b2NvbCkgcmV0dXJuIHRydWVcbiAgICBpZiAobWF0Y2hlclByb3RvY29sID09PSBjdXJyZW50UHJvdG9jb2wpIHJldHVybiB0cnVlXG4gICAgcmV0dXJuIGZhbHNlXG59XG5mdW5jdGlvbiBob3N0X21hdGNoZXIobWF0Y2hlckhvc3Q6IHN0cmluZywgY3VycmVudEhvc3Q6IHN0cmluZykge1xuICAgIC8vID8gJTJBIGlzICpcbiAgICBpZiAobWF0Y2hlckhvc3QgPT09ICclMkEnKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChtYXRjaGVySG9zdC5zdGFydHNXaXRoKCclMkEuJykpIHtcbiAgICAgICAgY29uc3QgcGFydCA9IG1hdGNoZXJIb3N0LnJlcGxhY2UoL14lMkEvLCAnJylcbiAgICAgICAgaWYgKHBhcnQgPT09IGN1cnJlbnRIb3N0KSByZXR1cm4gZmFsc2VcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRIb3N0LmVuZHNXaXRoKHBhcnQpXG4gICAgfVxuICAgIHJldHVybiBtYXRjaGVySG9zdCA9PT0gY3VycmVudEhvc3Rcbn1cbmZ1bmN0aW9uIHBhdGhfbWF0Y2hlcihtYXRjaGVyUGF0aDogc3RyaW5nLCBjdXJyZW50UGF0aDogc3RyaW5nLCBjdXJyZW50U2VhcmNoOiBzdHJpbmcpIHtcbiAgICBpZiAoIW1hdGNoZXJQYXRoLnN0YXJ0c1dpdGgoJy8nKSkgcmV0dXJuIGZhbHNlXG4gICAgaWYgKG1hdGNoZXJQYXRoID09PSAnLyonKSByZXR1cm4gdHJ1ZVxuICAgIC8vID8gJy9hL2IvYycgbWF0Y2hlcyAnL2EvYi9jIzEyMycgYnV0IG5vdCAnL2EvYi9jPzEyMydcbiAgICBpZiAobWF0Y2hlclBhdGggPT09IGN1cnJlbnRQYXRoICYmIGN1cnJlbnRTZWFyY2ggPT09ICcnKSByZXR1cm4gdHJ1ZVxuICAgIC8vID8gJy9hL2IvKicgbWF0Y2hlcyBldmVyeXRoaW5nIHN0YXJ0c1dpdGggJy9hL2IvJ1xuICAgIGlmIChtYXRjaGVyUGF0aC5lbmRzV2l0aCgnKicpICYmIGN1cnJlbnRQYXRoLnN0YXJ0c1dpdGgobWF0Y2hlclBhdGguc2xpY2UodW5kZWZpbmVkLCAtMSkpKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChtYXRjaGVyUGF0aC5pbmRleE9mKCcqJykgPT09IC0xKSByZXR1cm4gbWF0Y2hlclBhdGggPT09IGN1cnJlbnRQYXRoXG4gICAgY29uc29sZS53YXJuKCdOb3Qgc3VwcG9ydGVkIHBhdGggbWF0Y2hlciBpbiBtYW5pZmVzdC5qc29uJywgbWF0Y2hlclBhdGgpXG4gICAgcmV0dXJuIHRydWVcbn1cbiIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgKGdsb2JhbCA9IGdsb2JhbCB8fCBzZWxmLCBnbG9iYWwuUmVhbG0gPSBmYWN0b3J5KCkpO1xufSh0aGlzLCBmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuICAvLyB3ZSdkIGxpa2UgdG8gYWJhbmRvbiwgYnV0IHdlIGNhbid0LCBzbyBqdXN0IHNjcmVhbSBhbmQgYnJlYWsgYSBsb3Qgb2ZcbiAgLy8gc3R1ZmYuIEhvd2V2ZXIsIHNpbmNlIHdlIGFyZW4ndCByZWFsbHkgYWJvcnRpbmcgdGhlIHByb2Nlc3MsIGJlIGNhcmVmdWwgdG9cbiAgLy8gbm90IHRocm93IGFuIEVycm9yIG9iamVjdCB3aGljaCBjb3VsZCBiZSBjYXB0dXJlZCBieSBjaGlsZC1SZWFsbSBjb2RlIGFuZFxuICAvLyB1c2VkIHRvIGFjY2VzcyB0aGUgKHRvby1wb3dlcmZ1bCkgcHJpbWFsLXJlYWxtIEVycm9yIG9iamVjdC5cblxuICBmdW5jdGlvbiB0aHJvd1RhbnRydW0ocywgZXJyID0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3QgbXNnID0gYHBsZWFzZSByZXBvcnQgaW50ZXJuYWwgc2hpbSBlcnJvcjogJHtzfWA7XG5cbiAgICAvLyB3ZSB3YW50IHRvIGxvZyB0aGVzZSAnc2hvdWxkIG5ldmVyIGhhcHBlbicgdGhpbmdzLlxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgIGlmIChlcnIpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLmVycm9yKGAke2Vycn1gKTtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICBjb25zb2xlLmVycm9yKGAke2Vyci5zdGFja31gKTtcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZGVidWdnZXJcbiAgICBkZWJ1Z2dlcjtcbiAgICB0aHJvdyBtc2c7XG4gIH1cblxuICBmdW5jdGlvbiBhc3NlcnQoY29uZGl0aW9uLCBtZXNzYWdlKSB7XG4gICAgaWYgKCFjb25kaXRpb24pIHtcbiAgICAgIHRocm93VGFudHJ1bShtZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZW1vdmUgY29kZSBtb2RpZmljYXRpb25zLlxuICBmdW5jdGlvbiBjbGVhbnVwU291cmNlKHNyYykge1xuICAgIHJldHVybiBzcmM7XG4gIH1cblxuICAvLyBidWlsZENoaWxkUmVhbG0gaXMgaW1tZWRpYXRlbHkgdHVybmVkIGludG8gYSBzdHJpbmcsIGFuZCB0aGlzIGZ1bmN0aW9uIGlzXG4gIC8vIG5ldmVyIHJlZmVyZW5jZWQgYWdhaW4sIGJlY2F1c2UgaXQgY2xvc2VzIG92ZXIgdGhlIHdyb25nIGludHJpbnNpY3NcblxuICBmdW5jdGlvbiBidWlsZENoaWxkUmVhbG0odW5zYWZlUmVjLCBCYXNlUmVhbG0pIHtcbiAgICBjb25zdCB7XG4gICAgICBpbml0Um9vdFJlYWxtLFxuICAgICAgaW5pdENvbXBhcnRtZW50LFxuICAgICAgZ2V0UmVhbG1HbG9iYWwsXG4gICAgICByZWFsbUV2YWx1YXRlXG4gICAgfSA9IEJhc2VSZWFsbTtcblxuICAgIC8vIFRoaXMgT2JqZWN0IGFuZCBSZWZsZWN0IGFyZSBicmFuZCBuZXcsIGZyb20gYSBuZXcgdW5zYWZlUmVjLCBzbyBubyB1c2VyXG4gICAgLy8gY29kZSBoYXMgYmVlbiBydW4gb3IgaGFkIGEgY2hhbmNlIHRvIG1hbmlwdWxhdGUgdGhlbS4gV2UgZXh0cmFjdCB0aGVzZVxuICAgIC8vIHByb3BlcnRpZXMgZm9yIGJyZXZpdHksIG5vdCBmb3Igc2VjdXJpdHkuIERvbid0IGV2ZXIgcnVuIHRoaXMgZnVuY3Rpb25cbiAgICAvLyAqYWZ0ZXIqIHVzZXIgY29kZSBoYXMgaGFkIGEgY2hhbmNlIHRvIHBvbGx1dGUgaXRzIGVudmlyb25tZW50LCBvciBpdFxuICAgIC8vIGNvdWxkIGJlIHVzZWQgdG8gZ2FpbiBhY2Nlc3MgdG8gQmFzZVJlYWxtIGFuZCBwcmltYWwtcmVhbG0gRXJyb3JcbiAgICAvLyBvYmplY3RzLlxuICAgIGNvbnN0IHsgY3JlYXRlLCBkZWZpbmVQcm9wZXJ0aWVzIH0gPSBPYmplY3Q7XG5cbiAgICBjb25zdCBlcnJvckNvbnN0cnVjdG9ycyA9IG5ldyBNYXAoW1xuICAgICAgWydFdmFsRXJyb3InLCBFdmFsRXJyb3JdLFxuICAgICAgWydSYW5nZUVycm9yJywgUmFuZ2VFcnJvcl0sXG4gICAgICBbJ1JlZmVyZW5jZUVycm9yJywgUmVmZXJlbmNlRXJyb3JdLFxuICAgICAgWydTeW50YXhFcnJvcicsIFN5bnRheEVycm9yXSxcbiAgICAgIFsnVHlwZUVycm9yJywgVHlwZUVycm9yXSxcbiAgICAgIFsnVVJJRXJyb3InLCBVUklFcnJvcl1cbiAgICBdKTtcblxuICAgIC8vIExpa2UgUmVhbG0uYXBwbHkgZXhjZXB0IHRoYXQgaXQgY2F0Y2hlcyBhbnl0aGluZyB0aHJvd24gYW5kIHJldGhyb3dzIGl0XG4gICAgLy8gYXMgYW4gRXJyb3IgZnJvbSB0aGlzIHJlYWxtXG4gICAgZnVuY3Rpb24gY2FsbEFuZFdyYXBFcnJvcih0YXJnZXQsIC4uLmFyZ3MpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0YXJnZXQoLi4uYXJncyk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKE9iamVjdChlcnIpICE9PSBlcnIpIHtcbiAgICAgICAgICAvLyBlcnIgaXMgYSBwcmltaXRpdmUgdmFsdWUsIHdoaWNoIGlzIHNhZmUgdG8gcmV0aHJvd1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZU5hbWUsIGVNZXNzYWdlLCBlU3RhY2s7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gVGhlIGNoaWxkIGVudmlyb25tZW50IG1pZ2h0IHNlZWsgdG8gdXNlICdlcnInIHRvIHJlYWNoIHRoZVxuICAgICAgICAgIC8vIHBhcmVudCdzIGludHJpbnNpY3MgYW5kIGNvcnJ1cHQgdGhlbS4gYCR7ZXJyLm5hbWV9YCB3aWxsIGNhdXNlXG4gICAgICAgICAgLy8gc3RyaW5nIGNvZXJjaW9uIG9mICdlcnIubmFtZScuIElmIGVyci5uYW1lIGlzIGFuIG9iamVjdCAocHJvYmFibHlcbiAgICAgICAgICAvLyBhIFN0cmluZyBvZiB0aGUgcGFyZW50IFJlYWxtKSwgdGhlIGNvZXJjaW9uIHVzZXNcbiAgICAgICAgICAvLyBlcnIubmFtZS50b1N0cmluZygpLCB3aGljaCBpcyB1bmRlciB0aGUgY29udHJvbCBvZiB0aGUgcGFyZW50LiBJZlxuICAgICAgICAgIC8vIGVyci5uYW1lIHdlcmUgYSBwcmltaXRpdmUgKGUuZy4gYSBudW1iZXIpLCBpdCB3b3VsZCB1c2VcbiAgICAgICAgICAvLyBOdW1iZXIudG9TdHJpbmcoZXJyLm5hbWUpLCB1c2luZyB0aGUgY2hpbGQncyB2ZXJzaW9uIG9mIE51bWJlclxuICAgICAgICAgIC8vICh3aGljaCB0aGUgY2hpbGQgY291bGQgbW9kaWZ5IHRvIGNhcHR1cmUgaXRzIGFyZ3VtZW50IGZvciBsYXRlclxuICAgICAgICAgIC8vIHVzZSksIGhvd2V2ZXIgcHJpbWl0aXZlcyBkb24ndCBoYXZlIHByb3BlcnRpZXMgbGlrZSAucHJvdG90eXBlIHNvXG4gICAgICAgICAgLy8gdGhleSBhcmVuJ3QgdXNlZnVsIGZvciBhbiBhdHRhY2suXG4gICAgICAgICAgZU5hbWUgPSBgJHtlcnIubmFtZX1gO1xuICAgICAgICAgIGVNZXNzYWdlID0gYCR7ZXJyLm1lc3NhZ2V9YDtcbiAgICAgICAgICBlU3RhY2sgPSBgJHtlcnIuc3RhY2sgfHwgZU1lc3NhZ2V9YDtcbiAgICAgICAgICAvLyBlTmFtZS9lTWVzc2FnZS9lU3RhY2sgYXJlIG5vdyBjaGlsZC1yZWFsbSBwcmltaXRpdmUgc3RyaW5ncywgYW5kXG4gICAgICAgICAgLy8gc2FmZSB0byBleHBvc2VcbiAgICAgICAgfSBjYXRjaCAoaWdub3JlZCkge1xuICAgICAgICAgIC8vIGlmIGVyci5uYW1lLnRvU3RyaW5nKCkgdGhyb3dzLCBrZWVwIHRoZSAocGFyZW50IHJlYWxtKSBFcnJvciBhd2F5XG4gICAgICAgICAgLy8gZnJvbSB0aGUgY2hpbGRcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gZXJyb3InKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBFcnJvckNvbnN0cnVjdG9yID0gZXJyb3JDb25zdHJ1Y3RvcnMuZ2V0KGVOYW1lKSB8fCBFcnJvcjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3JDb25zdHJ1Y3RvcihlTWVzc2FnZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjIpIHtcbiAgICAgICAgICBlcnIyLnN0YWNrID0gZVN0YWNrOyAvLyByZXBsYWNlIHdpdGggdGhlIGNhcHR1cmVkIGlubmVyIHN0YWNrXG4gICAgICAgICAgdGhyb3cgZXJyMjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNsYXNzIFJlYWxtIHtcbiAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvLyBUaGUgUmVhbG0gY29uc3RydWN0b3IgaXMgbm90IGludGVuZGVkIHRvIGJlIHVzZWQgd2l0aCB0aGUgbmV3IG9wZXJhdG9yXG4gICAgICAgIC8vIG9yIHRvIGJlIHN1YmNsYXNzZWQuIEl0IG1heSBiZSB1c2VkIGFzIHRoZSB2YWx1ZSBvZiBhbiBleHRlbmRzIGNsYXVzZVxuICAgICAgICAvLyBvZiBhIGNsYXNzIGRlZmluaXRpb24gYnV0IGEgc3VwZXIgY2FsbCB0byB0aGUgUmVhbG0gY29uc3RydWN0b3Igd2lsbFxuICAgICAgICAvLyBjYXVzZSBhbiBleGNlcHRpb24uXG5cbiAgICAgICAgLy8gV2hlbiBSZWFsbSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgYW4gZXhjZXB0aW9uIGlzIGFsc28gcmFpc2VkIGJlY2F1c2VcbiAgICAgICAgLy8gYSBjbGFzcyBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgaW52b2tlZCB3aXRob3V0ICduZXcnLlxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWFsbSBpcyBub3QgYSBjb25zdHJ1Y3RvcicpO1xuICAgICAgfVxuXG4gICAgICBzdGF0aWMgbWFrZVJvb3RSZWFsbShvcHRpb25zKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgdGhlIGV4cG9zZWQgaW50ZXJmYWNlLlxuICAgICAgICBvcHRpb25zID0gT2JqZWN0KG9wdGlvbnMpOyAvLyB0b2RvOiBzYW5pdGl6ZVxuXG4gICAgICAgIC8vIEJ5cGFzcyB0aGUgY29uc3RydWN0b3IuXG4gICAgICAgIGNvbnN0IHIgPSBjcmVhdGUoUmVhbG0ucHJvdG90eXBlKTtcbiAgICAgICAgY2FsbEFuZFdyYXBFcnJvcihpbml0Um9vdFJlYWxtLCB1bnNhZmVSZWMsIHIsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gcjtcbiAgICAgIH1cblxuICAgICAgc3RhdGljIG1ha2VDb21wYXJ0bWVudCgpIHtcbiAgICAgICAgLy8gQnlwYXNzIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgICAgY29uc3QgciA9IGNyZWF0ZShSZWFsbS5wcm90b3R5cGUpO1xuICAgICAgICBjYWxsQW5kV3JhcEVycm9yKGluaXRDb21wYXJ0bWVudCwgdW5zYWZlUmVjLCByKTtcbiAgICAgICAgcmV0dXJuIHI7XG4gICAgICB9XG5cbiAgICAgIC8vIHdlIG9taXQgdGhlIGNvbnN0cnVjdG9yIGJlY2F1c2UgaXQgaXMgZW1wdHkuIEFsbCB0aGUgcGVyc29uYWxpemF0aW9uXG4gICAgICAvLyB0YWtlcyBwbGFjZSBpbiBvbmUgb2YgdGhlIHR3byBzdGF0aWMgbWV0aG9kcyxcbiAgICAgIC8vIG1ha2VSb290UmVhbG0vbWFrZUNvbXBhcnRtZW50XG5cbiAgICAgIGdldCBnbG9iYWwoKSB7XG4gICAgICAgIC8vIHRoaXMgaXMgc2FmZSBhZ2FpbnN0IGJlaW5nIGNhbGxlZCB3aXRoIHN0cmFuZ2UgJ3RoaXMnIGJlY2F1c2VcbiAgICAgICAgLy8gYmFzZUdldEdsb2JhbCBpbW1lZGlhdGVseSBkb2VzIGEgdHJhZGVtYXJrIGNoZWNrIChpdCBmYWlscyB1bmxlc3NcbiAgICAgICAgLy8gdGhpcyAndGhpcycgaXMgcHJlc2VudCBpbiBhIHdlYWttYXAgdGhhdCBpcyBvbmx5IHBvcHVsYXRlZCB3aXRoXG4gICAgICAgIC8vIGxlZ2l0aW1hdGUgUmVhbG0gaW5zdGFuY2VzKVxuICAgICAgICByZXR1cm4gY2FsbEFuZFdyYXBFcnJvcihnZXRSZWFsbUdsb2JhbCwgdGhpcyk7XG4gICAgICB9XG5cbiAgICAgIGV2YWx1YXRlKHgsIGVuZG93bWVudHMpIHtcbiAgICAgICAgLy8gc2FmZSBhZ2FpbnN0IHN0cmFuZ2UgJ3RoaXMnLCBhcyBhYm92ZVxuICAgICAgICByZXR1cm4gY2FsbEFuZFdyYXBFcnJvcihyZWFsbUV2YWx1YXRlLCB0aGlzLCB4LCBlbmRvd21lbnRzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBkZWZpbmVQcm9wZXJ0aWVzKFJlYWxtLCB7XG4gICAgICB0b1N0cmluZzoge1xuICAgICAgICB2YWx1ZTogKCkgPT4gJ2Z1bmN0aW9uIFJlYWxtKCkgeyBbc2hpbSBjb2RlXSB9JyxcbiAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBkZWZpbmVQcm9wZXJ0aWVzKFJlYWxtLnByb3RvdHlwZSwge1xuICAgICAgdG9TdHJpbmc6IHtcbiAgICAgICAgdmFsdWU6ICgpID0+ICdbb2JqZWN0IFJlYWxtXScsXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIFJlYWxtO1xuICB9XG5cbiAgLy8gVGhlIHBhcmVudGhlc2VzIG1lYW5zIHdlIGRvbid0IGJpbmQgdGhlICdidWlsZENoaWxkUmVhbG0nIG5hbWUgaW5zaWRlIHRoZVxuICAvLyBjaGlsZCdzIG5hbWVzcGFjZS4gdGhpcyB3b3VsZCBhY2NlcHQgYW4gYW5vbnltb3VzIGZ1bmN0aW9uIGRlY2xhcmF0aW9uLlxuICAvLyBmdW5jdGlvbiBleHByZXNzaW9uIChub3QgYSBkZWNsYXJhdGlvbikgc28gaXQgaGFzIGEgY29tcGxldGlvbiB2YWx1ZS5cbiAgY29uc3QgYnVpbGRDaGlsZFJlYWxtU3RyaW5nID0gY2xlYW51cFNvdXJjZShcbiAgICBgJ3VzZSBzdHJpY3QnOyAoJHtidWlsZENoaWxkUmVhbG19KWBcbiAgKTtcblxuICBmdW5jdGlvbiBjcmVhdGVSZWFsbUZhY2FkZSh1bnNhZmVSZWMsIEJhc2VSZWFsbSkge1xuICAgIGNvbnN0IHsgdW5zYWZlRXZhbCB9ID0gdW5zYWZlUmVjO1xuXG4gICAgLy8gVGhlIEJhc2VSZWFsbSBpcyB0aGUgUmVhbG0gY2xhc3MgY3JlYXRlZCBieVxuICAgIC8vIHRoZSBzaGltLiBJdCdzIG9ubHkgdmFsaWQgZm9yIHRoZSBjb250ZXh0IHdoZXJlXG4gICAgLy8gaXQgd2FzIHBhcnNlZC5cblxuICAgIC8vIFRoZSBSZWFsbSBmYWNhZGUgaXMgYSBsaWdodHdlaWdodCBjbGFzcyBidWlsdCBpbiB0aGVcbiAgICAvLyBjb250ZXh0IGEgZGlmZmVyZW50IGNvbnRleHQsIHRoYXQgcHJvdmlkZSBhIGZ1bGx5XG4gICAgLy8gZnVuY3Rpb25hbCBSZWFsbSBjbGFzcyB1c2luZyB0aGUgaW50cmlzaWNzXG4gICAgLy8gb2YgdGhhdCBjb250ZXh0LlxuXG4gICAgLy8gVGhpcyBwcm9jZXNzIGlzIHNpbXBsaWZpZWQgYmVjYXVzZSBhbGwgbWV0aG9kc1xuICAgIC8vIGFuZCBwcm9wZXJ0aWVzIG9uIGEgcmVhbG0gaW5zdGFuY2UgYWxyZWFkeSByZXR1cm5cbiAgICAvLyB2YWx1ZXMgdXNpbmcgdGhlIGludHJpbnNpY3Mgb2YgdGhlIHJlYWxtJ3MgY29udGV4dC5cblxuICAgIC8vIEludm9rZSB0aGUgQmFzZVJlYWxtIGNvbnN0cnVjdG9yIHdpdGggUmVhbG0gYXMgdGhlIHByb3RvdHlwZS5cbiAgICByZXR1cm4gdW5zYWZlRXZhbChidWlsZENoaWxkUmVhbG1TdHJpbmcpKHVuc2FmZVJlYywgQmFzZVJlYWxtKTtcbiAgfVxuXG4gIC8vIERlY2xhcmUgc2hvcnRoYW5kIGZ1bmN0aW9ucy4gU2hhcmluZyB0aGVzZSBkZWNsYXJhdGlvbnMgYWNyb3NzIG1vZHVsZXNcbiAgLy8gaW1wcm92ZXMgYm90aCBjb25zaXN0ZW5jeSBhbmQgbWluaWZpY2F0aW9uLiBVbnVzZWQgZGVjbGFyYXRpb25zIGFyZVxuICAvLyBkcm9wcGVkIGJ5IHRoZSB0cmVlIHNoYWtpbmcgcHJvY2Vzcy5cblxuICAvLyB3ZSBjYXB0dXJlIHRoZXNlLCBub3QganVzdCBmb3IgYnJldml0eSwgYnV0IGZvciBzZWN1cml0eS4gSWYgYW55IGNvZGVcbiAgLy8gbW9kaWZpZXMgT2JqZWN0IHRvIGNoYW5nZSB3aGF0ICdhc3NpZ24nIHBvaW50cyB0bywgdGhlIFJlYWxtIHNoaW0gd291bGQgYmVcbiAgLy8gY29ycnVwdGVkLlxuXG4gIGNvbnN0IHtcbiAgICBhc3NpZ24sXG4gICAgY3JlYXRlLFxuICAgIGZyZWV6ZSxcbiAgICBkZWZpbmVQcm9wZXJ0aWVzLCAvLyBPYmplY3QuZGVmaW5lUHJvcGVydHkgaXMgYWxsb3dlZCB0byBmYWlsXG4gICAgLy8gc2lsZW50bHR5LCB1c2UgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMgaW5zdGVhZC5cbiAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyxcbiAgICBnZXRPd25Qcm9wZXJ0eU5hbWVzLFxuICAgIGdldFByb3RvdHlwZU9mLFxuICAgIHNldFByb3RvdHlwZU9mXG4gIH0gPSBPYmplY3Q7XG5cbiAgY29uc3Qge1xuICAgIGFwcGx5LFxuICAgIG93bktleXMgLy8gUmVmbGVjdC5vd25LZXlzIGluY2x1ZGVzIFN5bWJvbHMgYW5kIHVuZW51bWVyYWJsZXMsXG4gICAgLy8gdW5saWtlIE9iamVjdC5rZXlzKClcbiAgfSA9IFJlZmxlY3Q7XG5cbiAgLyoqXG4gICAqIHVuY3VycnlUaGlzKCkgU2VlXG4gICAqIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWNvbnZlbnRpb25zOnNhZmVfbWV0YV9wcm9ncmFtbWluZ1xuICAgKiB3aGljaCBvbmx5IGxpdmVzIGF0XG4gICAqIGh0dHA6Ly93ZWIuYXJjaGl2ZS5vcmcvd2ViLzIwMTYwODA1MjI1NzEwL2h0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWNvbnZlbnRpb25zOnNhZmVfbWV0YV9wcm9ncmFtbWluZ1xuICAgKlxuICAgKiBQZXJmb3JtYW5jZTpcbiAgICogMS4gVGhlIG5hdGl2ZSBjYWxsIGlzIGFib3V0IDEweCBmYXN0ZXIgb24gRkYgdGhhbiBjaHJvbWVcbiAgICogMi4gVGhlIHZlcnNpb24gdXNpbmcgRnVuY3Rpb24uYmluZCgpIGlzIGFib3V0IDEwMHggc2xvd2VyIG9uIEZGLFxuICAgKiAgICBlcXVhbCBvbiBjaHJvbWUsIDJ4IHNsb3dlciBvbiBTYWZhcmlcbiAgICogMy4gVGhlIHZlcnNpb24gdXNpbmcgYSBzcHJlYWQgYW5kIFJlZmxlY3QuYXBwbHkoKSBpcyBhYm91dCAxMHhcbiAgICogICAgc2xvd2VyIG9uIEZGLCBlcXVhbCBvbiBjaHJvbWUsIDJ4IHNsb3dlciBvbiBTYWZhcmlcbiAgICpcbiAgICogY29uc3QgYmluZCA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kO1xuICAgKiBjb25zdCB1bmN1cnJ5VGhpcyA9IGJpbmQuYmluZChiaW5kLmNhbGwpO1xuICAgKi9cbiAgY29uc3QgdW5jdXJyeVRoaXMgPSBmbiA9PiAodGhpc0FyZywgLi4uYXJncykgPT4gYXBwbHkoZm4sIHRoaXNBcmcsIGFyZ3MpO1xuXG4gIC8vIFdlIGFsc28gY2FwdHVyZSB0aGVzZSBmb3Igc2VjdXJpdHk6IGNoYW5nZXMgdG8gQXJyYXkucHJvdG90eXBlIGFmdGVyIHRoZVxuICAvLyBSZWFsbSBzaGltIHJ1bnMgc2hvdWxkbid0IGFmZmVjdCBzdWJzZXF1ZW50IFJlYWxtIG9wZXJhdGlvbnMuXG4gIGNvbnN0IG9iamVjdEhhc093blByb3BlcnR5ID0gdW5jdXJyeVRoaXMoXG4gICAgICBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gICAgKSxcbiAgICBhcnJheUZpbHRlciA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5maWx0ZXIpLFxuICAgIGFycmF5UG9wID0gdW5jdXJyeVRoaXMoQXJyYXkucHJvdG90eXBlLnBvcCksXG4gICAgYXJyYXlKb2luID0gdW5jdXJyeVRoaXMoQXJyYXkucHJvdG90eXBlLmpvaW4pLFxuICAgIGFycmF5Q29uY2F0ID0gdW5jdXJyeVRoaXMoQXJyYXkucHJvdG90eXBlLmNvbmNhdCksXG4gICAgcmVnZXhwVGVzdCA9IHVuY3VycnlUaGlzKFJlZ0V4cC5wcm90b3R5cGUudGVzdCksXG4gICAgc3RyaW5nSW5jbHVkZXMgPSB1bmN1cnJ5VGhpcyhTdHJpbmcucHJvdG90eXBlLmluY2x1ZGVzKTtcblxuICAvLyBUaGVzZSB2YWx1ZSBwcm9wZXJ0aWVzIG9mIHRoZSBnbG9iYWwgb2JqZWN0IGFyZSBub24td3JpdGFibGUsXG4gIC8vIG5vbi1jb25maWd1cmFibGUgZGF0YSBwcm9wZXJ0aWVzLlxuICBjb25zdCBmcm96ZW5HbG9iYWxQcm9wZXJ0eU5hbWVzID0gW1xuICAgIC8vICoqKiAxOC4xIFZhbHVlIFByb3BlcnRpZXMgb2YgdGhlIEdsb2JhbCBPYmplY3RcblxuICAgICdJbmZpbml0eScsXG4gICAgJ05hTicsXG4gICAgJ3VuZGVmaW5lZCdcbiAgXTtcblxuICAvLyBBbGwgdGhlIGZvbGxvd2luZyBzdGRsaWIgaXRlbXMgaGF2ZSB0aGUgc2FtZSBuYW1lIG9uIGJvdGggb3VyIGludHJpbnNpY3NcbiAgLy8gb2JqZWN0IGFuZCBvbiB0aGUgZ2xvYmFsIG9iamVjdC4gVW5saWtlIEluZmluaXR5L05hTi91bmRlZmluZWQsIHRoZXNlXG4gIC8vIHNob3VsZCBhbGwgYmUgd3JpdGFibGUgYW5kIGNvbmZpZ3VyYWJsZS4gVGhpcyBpcyBkaXZpZGVkIGludG8gdHdvXG4gIC8vIHNldHMuIFRoZSBzdGFibGUgb25lcyBhcmUgdGhvc2UgdGhlIHNoaW0gY2FuIGZyZWV6ZSBlYXJseSBiZWNhdXNlXG4gIC8vIHdlIGRvbid0IGV4cGVjdCBhbnlvbmUgd2lsbCB3YW50IHRvIG11dGF0ZSB0aGVtLiBUaGUgdW5zdGFibGUgb25lc1xuICAvLyBhcmUgdGhlIG9uZXMgdGhhdCB3ZSBjb3JyZWN0bHkgaW5pdGlhbGl6ZSB0byB3cml0YWJsZSBhbmRcbiAgLy8gY29uZmlndXJhYmxlIHNvIHRoYXQgdGhleSBjYW4gc3RpbGwgYmUgcmVwbGFjZWQgb3IgcmVtb3ZlZC5cbiAgY29uc3Qgc3RhYmxlR2xvYmFsUHJvcGVydHlOYW1lcyA9IFtcbiAgICAvLyAqKiogMTguMiBGdW5jdGlvbiBQcm9wZXJ0aWVzIG9mIHRoZSBHbG9iYWwgT2JqZWN0XG5cbiAgICAvLyAnZXZhbCcsIC8vIGNvbWVzIGZyb20gc2FmZUV2YWwgaW5zdGVhZFxuICAgICdpc0Zpbml0ZScsXG4gICAgJ2lzTmFOJyxcbiAgICAncGFyc2VGbG9hdCcsXG4gICAgJ3BhcnNlSW50JyxcblxuICAgICdkZWNvZGVVUkknLFxuICAgICdkZWNvZGVVUklDb21wb25lbnQnLFxuICAgICdlbmNvZGVVUkknLFxuICAgICdlbmNvZGVVUklDb21wb25lbnQnLFxuXG4gICAgLy8gKioqIDE4LjMgQ29uc3RydWN0b3IgUHJvcGVydGllcyBvZiB0aGUgR2xvYmFsIE9iamVjdFxuXG4gICAgJ0FycmF5JyxcbiAgICAnQXJyYXlCdWZmZXInLFxuICAgICdCb29sZWFuJyxcbiAgICAnRGF0YVZpZXcnLFxuICAgIC8vICdEYXRlJywgIC8vIFVuc3RhYmxlXG4gICAgLy8gJ0Vycm9yJywgIC8vIFVuc3RhYmxlXG4gICAgJ0V2YWxFcnJvcicsXG4gICAgJ0Zsb2F0MzJBcnJheScsXG4gICAgJ0Zsb2F0NjRBcnJheScsXG4gICAgLy8gJ0Z1bmN0aW9uJywgIC8vIGNvbWVzIGZyb20gc2FmZUZ1bmN0aW9uIGluc3RlYWRcbiAgICAnSW50OEFycmF5JyxcbiAgICAnSW50MTZBcnJheScsXG4gICAgJ0ludDMyQXJyYXknLFxuICAgICdNYXAnLFxuICAgICdOdW1iZXInLFxuICAgICdPYmplY3QnLFxuICAgIC8vICdQcm9taXNlJywgIC8vIFVuc3RhYmxlXG4gICAgLy8gJ1Byb3h5JywgIC8vIFVuc3RhYmxlXG4gICAgJ1JhbmdlRXJyb3InLFxuICAgICdSZWZlcmVuY2VFcnJvcicsXG4gICAgLy8gJ1JlZ0V4cCcsICAvLyBVbnN0YWJsZVxuICAgICdTZXQnLFxuICAgIC8vICdTaGFyZWRBcnJheUJ1ZmZlcicgIC8vIHJlbW92ZWQgb24gSmFuIDUsIDIwMThcbiAgICAnU3RyaW5nJyxcbiAgICAnU3ltYm9sJyxcbiAgICAnU3ludGF4RXJyb3InLFxuICAgICdUeXBlRXJyb3InLFxuICAgICdVaW50OEFycmF5JyxcbiAgICAnVWludDhDbGFtcGVkQXJyYXknLFxuICAgICdVaW50MTZBcnJheScsXG4gICAgJ1VpbnQzMkFycmF5JyxcbiAgICAnVVJJRXJyb3InLFxuICAgICdXZWFrTWFwJyxcbiAgICAnV2Vha1NldCcsXG5cbiAgICAvLyAqKiogMTguNCBPdGhlciBQcm9wZXJ0aWVzIG9mIHRoZSBHbG9iYWwgT2JqZWN0XG5cbiAgICAvLyAnQXRvbWljcycsIC8vIHJlbW92ZWQgb24gSmFuIDUsIDIwMThcbiAgICAnSlNPTicsXG4gICAgJ01hdGgnLFxuICAgICdSZWZsZWN0JyxcblxuICAgIC8vICoqKiBBbm5leCBCXG5cbiAgICAnZXNjYXBlJyxcbiAgICAndW5lc2NhcGUnXG5cbiAgICAvLyAqKiogRUNNQS00MDJcblxuICAgIC8vICdJbnRsJyAgLy8gVW5zdGFibGVcblxuICAgIC8vICoqKiBFU05leHRcblxuICAgIC8vICdSZWFsbScgLy8gQ29tZXMgZnJvbSBjcmVhdGVSZWFsbUdsb2JhbE9iamVjdCgpXG4gIF07XG5cbiAgY29uc3QgdW5zdGFibGVHbG9iYWxQcm9wZXJ0eU5hbWVzID0gW1xuICAgICdEYXRlJyxcbiAgICAnRXJyb3InLFxuICAgICdQcm9taXNlJyxcbiAgICAnUHJveHknLFxuICAgICdSZWdFeHAnLFxuICAgICdJbnRsJ1xuICBdO1xuXG4gIGZ1bmN0aW9uIGdldFNoYXJlZEdsb2JhbERlc2NzKHVuc2FmZUdsb2JhbCkge1xuICAgIGNvbnN0IGRlc2NyaXB0b3JzID0ge307XG5cbiAgICBmdW5jdGlvbiBkZXNjcmliZShuYW1lcywgd3JpdGFibGUsIGVudW1lcmFibGUsIGNvbmZpZ3VyYWJsZSkge1xuICAgICAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG4gICAgICAgIGNvbnN0IGRlc2MgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodW5zYWZlR2xvYmFsLCBuYW1lKTtcbiAgICAgICAgaWYgKGRlc2MpIHtcbiAgICAgICAgICAvLyBBYm9ydCBpZiBhbiBhY2Nlc3NvciBpcyBmb3VuZCBvbiB0aGUgdW5zYWZlIGdsb2JhbCBvYmplY3RcbiAgICAgICAgICAvLyBpbnN0ZWFkIG9mIGEgZGF0YSBwcm9wZXJ0eS4gV2Ugc2hvdWxkIG5ldmVyIGdldCBpbnRvIHRoaXNcbiAgICAgICAgICAvLyBub24gc3RhbmRhcmQgc2l0dWF0aW9uLlxuICAgICAgICAgIGFzc2VydChcbiAgICAgICAgICAgICd2YWx1ZScgaW4gZGVzYyxcbiAgICAgICAgICAgIGB1bmV4cGVjdGVkIGFjY2Vzc29yIG9uIGdsb2JhbCBwcm9wZXJ0eTogJHtuYW1lfWBcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgZGVzY3JpcHRvcnNbbmFtZV0gPSB7XG4gICAgICAgICAgICB2YWx1ZTogZGVzYy52YWx1ZSxcbiAgICAgICAgICAgIHdyaXRhYmxlLFxuICAgICAgICAgICAgZW51bWVyYWJsZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBkZXNjcmliZShmcm96ZW5HbG9iYWxQcm9wZXJ0eU5hbWVzLCBmYWxzZSwgZmFsc2UsIGZhbHNlKTtcbiAgICAvLyBUaGUgZm9sbG93aW5nIGlzIGNvcnJlY3QgYnV0IGV4cGVuc2l2ZS5cbiAgICAvLyBkZXNjcmliZShzdGFibGVHbG9iYWxQcm9wZXJ0eU5hbWVzLCB0cnVlLCBmYWxzZSwgdHJ1ZSk7XG4gICAgLy8gSW5zdGVhZCwgZm9yIG5vdywgd2UgbGV0IHRoZXNlIGdldCBvcHRpbWl6ZWQuXG4gICAgLy9cbiAgICAvLyBUT0RPOiBXZSBzaG91bGQgcHJvdmlkZSBhbiBvcHRpb24gdG8gdHVybiB0aGlzIG9wdGltaXphdGlvbiBvZmYsXG4gICAgLy8gYnkgZmVlZGluZyBcInRydWUsIGZhbHNlLCB0cnVlXCIgaGVyZSBpbnN0ZWFkLlxuICAgIGRlc2NyaWJlKHN0YWJsZUdsb2JhbFByb3BlcnR5TmFtZXMsIGZhbHNlLCBmYWxzZSwgZmFsc2UpO1xuICAgIC8vIFRoZXNlIHdlIGtlZXAgcmVwbGFjZWFibGUgYW5kIHJlbW92YWJsZSwgYmVjYXVzZSB3ZSBleHBlY3RcbiAgICAvLyBvdGhlcnMsIGUuZy4sIFNFUywgbWF5IHdhbnQgdG8gZG8gc28uXG4gICAgZGVzY3JpYmUodW5zdGFibGVHbG9iYWxQcm9wZXJ0eU5hbWVzLCB0cnVlLCBmYWxzZSwgdHJ1ZSk7XG5cbiAgICByZXR1cm4gZGVzY3JpcHRvcnM7XG4gIH1cblxuICAvLyBBZGFwdGVkIGZyb20gU0VTL0NhamEgLSBDb3B5cmlnaHQgKEMpIDIwMTEgR29vZ2xlIEluYy5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9jYWphL2Jsb2IvbWFzdGVyL3NyYy9jb20vZ29vZ2xlL2NhamEvc2VzL3N0YXJ0U0VTLmpzXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvY2FqYS9ibG9iL21hc3Rlci9zcmMvY29tL2dvb2dsZS9jYWphL3Nlcy9yZXBhaXJFUzUuanNcblxuICAvKipcbiAgICogUmVwbGFjZSB0aGUgbGVnYWN5IGFjY2Vzc29ycyBvZiBPYmplY3QgdG8gY29tcGx5IHdpdGggc3RyaWN0IG1vZGVcbiAgICogYW5kIEVTMjAxNiBzZW1hbnRpY3MsIHdlIGRvIHRoaXMgYnkgcmVkZWZpbmluZyB0aGVtIHdoaWxlIGluICd1c2Ugc3RyaWN0Jy5cbiAgICpcbiAgICogdG9kbzogbGlzdCB0aGUgaXNzdWVzIHJlc29sdmVkXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gY2FuIGJlIHVzZWQgaW4gdHdvIHdheXM6ICgxKSBpbnZva2VkIGRpcmVjdGx5IHRvIGZpeCB0aGUgcHJpbWFsXG4gICAqIHJlYWxtJ3MgT2JqZWN0LnByb3RvdHlwZSwgYW5kICgyKSBjb252ZXJ0ZWQgdG8gYSBzdHJpbmcgdG8gYmUgZXhlY3V0ZWRcbiAgICogaW5zaWRlIGVhY2ggbmV3IFJvb3RSZWFsbSB0byBmaXggdGhlaXIgT2JqZWN0LnByb3RvdHlwZXMuIEV2YWx1YXRpb24gcmVxdWlyZXNcbiAgICogdGhlIGZ1bmN0aW9uIHRvIGhhdmUgbm8gZGVwZW5kZW5jaWVzLCBzbyBkb24ndCBpbXBvcnQgYW55dGhpbmcgZnJvbVxuICAgKiB0aGUgb3V0c2lkZS5cbiAgICovXG5cbiAgLy8gdG9kbzogdGhpcyBmaWxlIHNob3VsZCBiZSBtb3ZlZCBvdXQgdG8gYSBzZXBhcmF0ZSByZXBvIGFuZCBucG0gbW9kdWxlLlxuICBmdW5jdGlvbiByZXBhaXJBY2Nlc3NvcnMoKSB7XG4gICAgY29uc3Qge1xuICAgICAgZGVmaW5lUHJvcGVydHksXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzLFxuICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yLFxuICAgICAgZ2V0UHJvdG90eXBlT2YsXG4gICAgICBwcm90b3R5cGU6IG9iamVjdFByb3RvdHlwZVxuICAgIH0gPSBPYmplY3Q7XG5cbiAgICAvLyBPbiBzb21lIHBsYXRmb3JtcywgdGhlIGltcGxlbWVudGF0aW9uIG9mIHRoZXNlIGZ1bmN0aW9ucyBhY3QgYXNcbiAgICAvLyBpZiB0aGV5IGFyZSBpbiBzbG9wcHkgbW9kZTogaWYgdGhleSdyZSBpbnZva2VkIGJhZGx5LCB0aGV5IHdpbGxcbiAgICAvLyBleHBvc2UgdGhlIGdsb2JhbCBvYmplY3QsIHNvIHdlIG5lZWQgdG8gcmVwYWlyIHRoZXNlIGZvclxuICAgIC8vIHNlY3VyaXR5LiBUaHVzIGl0IGlzIG91ciByZXNwb25zaWJpbGl0eSB0byBmaXggdGhpcywgYW5kIHdlIG5lZWRcbiAgICAvLyB0byBpbmNsdWRlIHJlcGFpckFjY2Vzc29ycy4gRS5nLiBDaHJvbWUgaW4gMjAxNi5cblxuICAgIHRyeSB7XG4gICAgICAvLyBWZXJpZnkgdGhhdCB0aGUgbWV0aG9kIGlzIG5vdCBjYWxsYWJsZS5cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1yZXN0cmljdGVkLXByb3BlcnRpZXMsIG5vLXVuZGVyc2NvcmUtZGFuZ2xlXG4gICAgICAoMCwgb2JqZWN0UHJvdG90eXBlLl9fbG9va3VwR2V0dGVyX18pKCd4Jyk7XG4gICAgfSBjYXRjaCAoaWdub3JlKSB7XG4gICAgICAvLyBUaHJvd3MsIG5vIG5lZWQgdG8gcGF0Y2guXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdG9PYmplY3Qob2JqKSB7XG4gICAgICBpZiAob2JqID09PSB1bmRlZmluZWQgfHwgb2JqID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYGNhbid0IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0YCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gT2JqZWN0KG9iaik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXNQcm9wZXJ0eU5hbWUob2JqKSB7XG4gICAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ3N5bWJvbCcpIHtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgIH1cbiAgICAgIHJldHVybiBgJHtvYmp9YDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhRnVuY3Rpb24ob2JqLCBhY2Nlc3Nvcikge1xuICAgICAgaWYgKHR5cGVvZiBvYmogIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKGBpbnZhbGlkICR7YWNjZXNzb3J9IHVzYWdlYCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH1cblxuICAgIGRlZmluZVByb3BlcnRpZXMob2JqZWN0UHJvdG90eXBlLCB7XG4gICAgICBfX2RlZmluZUdldHRlcl9fOiB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfX2RlZmluZUdldHRlcl9fKHByb3AsIGZ1bmMpIHtcbiAgICAgICAgICBjb25zdCBPID0gdG9PYmplY3QodGhpcyk7XG4gICAgICAgICAgZGVmaW5lUHJvcGVydHkoTywgcHJvcCwge1xuICAgICAgICAgICAgZ2V0OiBhRnVuY3Rpb24oZnVuYywgJ2dldHRlcicpLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgX19kZWZpbmVTZXR0ZXJfXzoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX19kZWZpbmVTZXR0ZXJfXyhwcm9wLCBmdW5jKSB7XG4gICAgICAgICAgY29uc3QgTyA9IHRvT2JqZWN0KHRoaXMpO1xuICAgICAgICAgIGRlZmluZVByb3BlcnR5KE8sIHByb3AsIHtcbiAgICAgICAgICAgIHNldDogYUZ1bmN0aW9uKGZ1bmMsICdzZXR0ZXInKSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIF9fbG9va3VwR2V0dGVyX186IHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9fbG9va3VwR2V0dGVyX18ocHJvcCkge1xuICAgICAgICAgIGxldCBPID0gdG9PYmplY3QodGhpcyk7XG4gICAgICAgICAgcHJvcCA9IGFzUHJvcGVydHlOYW1lKHByb3ApO1xuICAgICAgICAgIGxldCBkZXNjO1xuICAgICAgICAgIHdoaWxlIChPICYmICEoZGVzYyA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcihPLCBwcm9wKSkpIHtcbiAgICAgICAgICAgIE8gPSBnZXRQcm90b3R5cGVPZihPKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGRlc2MgJiYgZGVzYy5nZXQ7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBfX2xvb2t1cFNldHRlcl9fOiB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfX2xvb2t1cFNldHRlcl9fKHByb3ApIHtcbiAgICAgICAgICBsZXQgTyA9IHRvT2JqZWN0KHRoaXMpO1xuICAgICAgICAgIHByb3AgPSBhc1Byb3BlcnR5TmFtZShwcm9wKTtcbiAgICAgICAgICBsZXQgZGVzYztcbiAgICAgICAgICB3aGlsZSAoTyAmJiAhKGRlc2MgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoTywgcHJvcCkpKSB7XG4gICAgICAgICAgICBPID0gZ2V0UHJvdG90eXBlT2YoTyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBkZXNjICYmIGRlc2Muc2V0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBBZGFwdGVkIGZyb20gU0VTL0NhamFcbiAgLy8gQ29weXJpZ2h0IChDKSAyMDExIEdvb2dsZSBJbmMuXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvY2FqYS9ibG9iL21hc3Rlci9zcmMvY29tL2dvb2dsZS9jYWphL3Nlcy9zdGFydFNFUy5qc1xuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2NhamEvYmxvYi9tYXN0ZXIvc3JjL2NvbS9nb29nbGUvY2FqYS9zZXMvcmVwYWlyRVM1LmpzXG5cbiAgLyoqXG4gICAqIFRoaXMgYmxvY2sgcmVwbGFjZXMgdGhlIG9yaWdpbmFsIEZ1bmN0aW9uIGNvbnN0cnVjdG9yLCBhbmQgdGhlIG9yaWdpbmFsXG4gICAqICVHZW5lcmF0b3JGdW5jdGlvbiUgJUFzeW5jRnVuY3Rpb24lIGFuZCAlQXN5bmNHZW5lcmF0b3JGdW5jdGlvbiUsIHdpdGhcbiAgICogc2FmZSByZXBsYWNlbWVudHMgdGhhdCB0aHJvdyBpZiBpbnZva2VkLlxuICAgKlxuICAgKiBUaGVzZSBhcmUgYWxsIHJlYWNoYWJsZSB2aWEgc3ludGF4LCBzbyBpdCBpc24ndCBzdWZmaWNpZW50IHRvIGp1c3RcbiAgICogcmVwbGFjZSBnbG9iYWwgcHJvcGVydGllcyB3aXRoIHNhZmUgdmVyc2lvbnMuIE91ciBtYWluIGdvYWwgaXMgdG8gcHJldmVudFxuICAgKiBhY2Nlc3MgdG8gdGhlIEZ1bmN0aW9uIGNvbnN0cnVjdG9yIHRocm91Z2ggdGhlc2Ugc3RhcnRpbmcgcG9pbnRzLlxuXG4gICAqIEFmdGVyIHRoaXMgYmxvY2sgaXMgZG9uZSwgdGhlIG9yaWdpbmFscyBtdXN0IG5vIGxvbmdlciBiZSByZWFjaGFibGUsIHVubGVzc1xuICAgKiBhIGNvcHkgaGFzIGJlZW4gbWFkZSwgYW5kIGZ1bnRpb25zIGNhbiBvbmx5IGJlIGNyZWF0ZWQgYnkgc3ludGF4ICh1c2luZyBldmFsKVxuICAgKiBvciBieSBpbnZva2luZyBhIHByZXZpb3VzbHkgc2F2ZWQgcmVmZXJlbmNlIHRvIHRoZSBvcmlnaW5hbHMuXG4gICAqL1xuXG4gIC8vIHRvZG86IHRoaXMgZmlsZSBzaG91bGQgYmUgbW92ZWQgb3V0IHRvIGEgc2VwYXJhdGUgcmVwbyBhbmQgbnBtIG1vZHVsZS5cbiAgZnVuY3Rpb24gcmVwYWlyRnVuY3Rpb25zKCkge1xuICAgIGNvbnN0IHsgZGVmaW5lUHJvcGVydGllcywgZ2V0UHJvdG90eXBlT2YsIHNldFByb3RvdHlwZU9mIH0gPSBPYmplY3Q7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcHJvY2VzcyB0byByZXBhaXIgY29uc3RydWN0b3JzOlxuICAgICAqIDEuIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgZnVuY3Rpb24gYnkgZXZhbHVhdGluZyBzeW50YXhcbiAgICAgKiAyLiBPYnRhaW4gdGhlIHByb3RvdHlwZSBmcm9tIHRoZSBpbnN0YW5jZVxuICAgICAqIDMuIENyZWF0ZSBhIHN1YnN0aXR1dGUgdGFtZWQgY29uc3RydWN0b3JcbiAgICAgKiA0LiBSZXBsYWNlIHRoZSBvcmlnaW5hbCBjb25zdHJ1Y3RvciB3aXRoIHRoZSB0YW1lZCBjb25zdHJ1Y3RvclxuICAgICAqIDUuIFJlcGxhY2UgdGFtZWQgY29uc3RydWN0b3IgcHJvdG90eXBlIHByb3BlcnR5IHdpdGggdGhlIG9yaWdpbmFsIG9uZVxuICAgICAqIDYuIFJlcGxhY2UgaXRzIFtbUHJvdG90eXBlXV0gc2xvdCB3aXRoIHRoZSB0YW1lZCBjb25zdHJ1Y3RvciBvZiBGdW5jdGlvblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlcGFpckZ1bmN0aW9uKG5hbWUsIGRlY2xhcmF0aW9uKSB7XG4gICAgICBsZXQgRnVuY3Rpb25JbnN0YW5jZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXctZnVuY1xuICAgICAgICBGdW5jdGlvbkluc3RhbmNlID0gKDAsIGV2YWwpKGRlY2xhcmF0aW9uKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBTeW50YXhFcnJvcikge1xuICAgICAgICAgIC8vIFByZXZlbnQgZmFpbHVyZSBvbiBwbGF0Zm9ybXMgd2hlcmUgYXN5bmMgYW5kL29yIGdlbmVyYXRvcnNcbiAgICAgICAgICAvLyBhcmUgbm90IHN1cHBvcnRlZC5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gUmUtdGhyb3dcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IEZ1bmN0aW9uUHJvdG90eXBlID0gZ2V0UHJvdG90eXBlT2YoRnVuY3Rpb25JbnN0YW5jZSk7XG5cbiAgICAgIC8vIFByZXZlbnRzIHRoZSBldmFsdWF0aW9uIG9mIHNvdXJjZSB3aGVuIGNhbGxpbmcgY29uc3RydWN0b3Igb24gdGhlXG4gICAgICAvLyBwcm90b3R5cGUgb2YgZnVuY3Rpb25zLlxuICAgICAgY29uc3QgVGFtZWRGdW5jdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdOb3QgYXZhaWxhYmxlJyk7XG4gICAgICB9O1xuICAgICAgZGVmaW5lUHJvcGVydGllcyhUYW1lZEZ1bmN0aW9uLCB7IG5hbWU6IHsgdmFsdWU6IG5hbWUgfSB9KTtcblxuICAgICAgLy8gKG5ldyBFcnJvcigpKS5jb25zdHJ1Y3RvcnMgZG9lcyBub3QgaW5oZXJpdCBmcm9tIEZ1bmN0aW9uLCBiZWNhdXNlIEVycm9yXG4gICAgICAvLyB3YXMgZGVmaW5lZCBiZWZvcmUgRVM2IGNsYXNzZXMuIFNvIHdlIGRvbid0IG5lZWQgdG8gcmVwYWlyIGl0IHRvby5cblxuICAgICAgLy8gKEVycm9yKCkpLmNvbnN0cnVjdG9yIGluaGVyaXQgZnJvbSBGdW5jdGlvbiwgd2hpY2ggZ2V0cyBhIHRhbWVkXG4gICAgICAvLyBjb25zdHJ1Y3RvciBoZXJlLlxuXG4gICAgICAvLyB0b2RvOiBpbiBhbiBFUzYgY2xhc3MgdGhhdCBkb2VzIG5vdCBpbmhlcml0IGZyb20gYW55dGhpbmcsIHdoYXQgZG9lcyBpdHNcbiAgICAgIC8vIGNvbnN0cnVjdG9yIGluaGVyaXQgZnJvbT8gV2Ugd29ycnkgdGhhdCBpdCBpbmhlcml0cyBmcm9tIEZ1bmN0aW9uLCBpblxuICAgICAgLy8gd2hpY2ggY2FzZSBpbnN0YW5jZXMgY291bGQgZ2l2ZSBhY2Nlc3MgdG8gdW5zYWZlRnVuY3Rpb24uIG1hcmttIHNheXNcbiAgICAgIC8vIHdlJ3JlIGZpbmU6IHRoZSBjb25zdHJ1Y3RvciBpbmhlcml0cyBmcm9tIE9iamVjdC5wcm90b3R5cGVcblxuICAgICAgLy8gVGhpcyBsaW5lIHJlcGxhY2VzIHRoZSBvcmlnaW5hbCBjb25zdHJ1Y3RvciBpbiB0aGUgcHJvdG90eXBlIGNoYWluXG4gICAgICAvLyB3aXRoIHRoZSB0YW1lZCBvbmUuIE5vIGNvcHkgb2YgdGhlIG9yaWdpbmFsIGlzIHBlc2VydmVkLlxuICAgICAgZGVmaW5lUHJvcGVydGllcyhGdW5jdGlvblByb3RvdHlwZSwge1xuICAgICAgICBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogVGFtZWRGdW5jdGlvbiB9XG4gICAgICB9KTtcblxuICAgICAgLy8gVGhpcyBsaW5lIHNldHMgdGhlIHRhbWVkIGNvbnN0cnVjdG9yJ3MgcHJvdG90eXBlIGRhdGEgcHJvcGVydHkgdG9cbiAgICAgIC8vIHRoZSBvcmlnaW5hbCBvbmUuXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKFRhbWVkRnVuY3Rpb24sIHtcbiAgICAgICAgcHJvdG90eXBlOiB7IHZhbHVlOiBGdW5jdGlvblByb3RvdHlwZSB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKFRhbWVkRnVuY3Rpb24gIT09IEZ1bmN0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAvLyBFbnN1cmVzIHRoYXQgYWxsIGZ1bmN0aW9ucyBtZWV0IFwiaW5zdGFuY2VvZiBGdW5jdGlvblwiIGluIGEgcmVhbG0uXG4gICAgICAgIHNldFByb3RvdHlwZU9mKFRhbWVkRnVuY3Rpb24sIEZ1bmN0aW9uLnByb3RvdHlwZS5jb25zdHJ1Y3Rvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSGVyZSwgdGhlIG9yZGVyIG9mIG9wZXJhdGlvbiBpcyBpbXBvcnRhbnQ6IEZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJlcGFpcmVkXG4gICAgLy8gZmlyc3Qgc2luY2UgdGhlIG90aGVyIHJlcGFpcmVkIGNvbnN0cnVjdG9ycyBuZWVkIHRvIGluaGVyaXQgZnJvbSB0aGUgdGFtZWRcbiAgICAvLyBGdW5jdGlvbiBmdW5jdGlvbiBjb25zdHJ1Y3Rvci5cblxuICAgIC8vIG5vdGU6IHRoaXMgcmVhbGx5IHdhbnRzIHRvIGJlIHBhcnQgb2YgdGhlIHN0YW5kYXJkLCBiZWNhdXNlIG5ld1xuICAgIC8vIGNvbnN0cnVjdG9ycyBtYXkgYmUgYWRkZWQgaW4gdGhlIGZ1dHVyZSwgcmVhY2hhYmxlIGZyb20gc3ludGF4LCBhbmQgdGhpc1xuICAgIC8vIGxpc3QgbXVzdCBiZSB1cGRhdGVkIHRvIG1hdGNoLlxuXG4gICAgLy8gXCJwbGFpbiBhcnJvdyBmdW5jdGlvbnNcIiBpbmhlcml0IGZyb20gRnVuY3Rpb24ucHJvdG90eXBlXG5cbiAgICByZXBhaXJGdW5jdGlvbignRnVuY3Rpb24nLCAnKGZ1bmN0aW9uKCl7fSknKTtcbiAgICByZXBhaXJGdW5jdGlvbignR2VuZXJhdG9yRnVuY3Rpb24nLCAnKGZ1bmN0aW9uKigpe30pJyk7XG4gICAgcmVwYWlyRnVuY3Rpb24oJ0FzeW5jRnVuY3Rpb24nLCAnKGFzeW5jIGZ1bmN0aW9uKCl7fSknKTtcbiAgICByZXBhaXJGdW5jdGlvbignQXN5bmNHZW5lcmF0b3JGdW5jdGlvbicsICcoYXN5bmMgZnVuY3Rpb24qKCl7fSknKTtcbiAgfVxuXG4gIC8vIHRoaXMgbW9kdWxlIG11c3QgbmV2ZXIgYmUgaW1wb3J0YWJsZSBvdXRzaWRlIHRoZSBSZWFsbSBzaGltIGl0c2VsZlxuXG4gIC8vIEEgXCJjb250ZXh0XCIgaXMgYSBmcmVzaCB1bnNhZmUgUmVhbG0gYXMgZ2l2ZW4gdG8gdXMgYnkgZXhpc3RpbmcgcGxhdGZvcm1zLlxuICAvLyBXZSBuZWVkIHRoaXMgdG8gaW1wbGVtZW50IHRoZSBzaGltLiBIb3dldmVyLCB3aGVuIFJlYWxtcyBsYW5kIGZvciByZWFsLFxuICAvLyB0aGlzIGZlYXR1cmUgd2lsbCBiZSBwcm92aWRlZCBieSB0aGUgdW5kZXJseWluZyBlbmdpbmUgaW5zdGVhZC5cblxuICAvLyBub3RlOiBpbiBhIG5vZGUgbW9kdWxlLCB0aGUgdG9wLWxldmVsICd0aGlzJyBpcyBub3QgdGhlIGdsb2JhbCBvYmplY3RcbiAgLy8gKGl0J3MgKnNvbWV0aGluZyogYnV0IHdlIGFyZW4ndCBzdXJlIHdoYXQpLCBob3dldmVyIGFuIGluZGlyZWN0IGV2YWwgb2ZcbiAgLy8gJ3RoaXMnIHdpbGwgYmUgdGhlIGNvcnJlY3QgZ2xvYmFsIG9iamVjdC5cblxuICBjb25zdCB1bnNhZmVHbG9iYWxTcmMgPSBcIid1c2Ugc3RyaWN0JzsgdGhpc1wiO1xuICBjb25zdCB1bnNhZmVHbG9iYWxFdmFsU3JjID0gYCgwLCBldmFsKShcIid1c2Ugc3RyaWN0JzsgdGhpc1wiKWA7XG5cbiAgLy8gVGhpcyBtZXRob2QgaXMgb25seSBleHBvcnRlZCBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAgZnVuY3Rpb24gY3JlYXRlTmV3VW5zYWZlR2xvYmFsRm9yTm9kZSgpIHtcbiAgICAvLyBOb3RlIHRoYXQgd2VicGFjayBhbmQgb3RoZXJzIHdpbGwgc2hpbSAndm0nIGluY2x1ZGluZyB0aGUgbWV0aG9kXG4gICAgLy8gJ3J1bkluTmV3Q29udGV4dCcsIHNvIHRoZSBwcmVzZW5jZSBvZiB2bSBpcyBub3QgYSB1c2VmdWwgY2hlY2tcblxuICAgIC8vIFRPRE86IEZpbmQgYSBiZXR0ZXIgdGVzdCB0aGF0IHdvcmtzIHdpdGggYnVuZGxlcnNcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LWZ1bmNcbiAgICBjb25zdCBpc05vZGUgPSBuZXcgRnVuY3Rpb24oXG4gICAgICAndHJ5IHtyZXR1cm4gdGhpcz09PWdsb2JhbH1jYXRjaChlKXtyZXR1cm4gZmFsc2V9J1xuICAgICkoKTtcblxuICAgIGlmICghaXNOb2RlKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBnbG9iYWwtcmVxdWlyZVxuICAgIGNvbnN0IHZtID0gcmVxdWlyZSgndm0nKTtcblxuICAgIC8vIFVzZSB1bnNhZmVHbG9iYWxFdmFsU3JjIHRvIGVuc3VyZSB3ZSBnZXQgdGhlIHJpZ2h0ICd0aGlzJy5cbiAgICBjb25zdCB1bnNhZmVHbG9iYWwgPSB2bS5ydW5Jbk5ld0NvbnRleHQodW5zYWZlR2xvYmFsRXZhbFNyYyk7XG5cbiAgICByZXR1cm4gdW5zYWZlR2xvYmFsO1xuICB9XG5cbiAgLy8gVGhpcyBtZXRob2QgaXMgb25seSBleHBvcnRlZCBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAgZnVuY3Rpb24gY3JlYXRlTmV3VW5zYWZlR2xvYmFsRm9yQnJvd3NlcigpIHtcbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgY29uc3QgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgY29uc3QgdW5zYWZlR2xvYmFsID0gaWZyYW1lLmNvbnRlbnRXaW5kb3cuZXZhbCh1bnNhZmVHbG9iYWxTcmMpO1xuXG4gICAgLy8gV2Uga2VlcCB0aGUgaWZyYW1lIGF0dGFjaGVkIHRvIHRoZSBET00gYmVjYXVzZSByZW1vdmluZyBpdFxuICAgIC8vIGNhdXNlcyBpdHMgZ2xvYmFsIG9iamVjdCB0byBsb3NlIGludHJpbnNpY3MsIGl0cyBldmFsKClcbiAgICAvLyBmdW5jdGlvbiB0byBldmFsdWF0ZSBjb2RlLCBldGMuXG5cbiAgICAvLyBUT0RPOiBjYW4gd2UgcmVtb3ZlIGFuZCBnYXJiYWdlLWNvbGxlY3QgdGhlIGlmcmFtZXM/XG5cbiAgICByZXR1cm4gdW5zYWZlR2xvYmFsO1xuICB9XG5cbiAgY29uc3QgZ2V0TmV3VW5zYWZlR2xvYmFsID0gKCkgPT4ge1xuICAgIGNvbnN0IG5ld1Vuc2FmZUdsb2JhbEZvckJyb3dzZXIgPSBjcmVhdGVOZXdVbnNhZmVHbG9iYWxGb3JCcm93c2VyKCk7XG4gICAgY29uc3QgbmV3VW5zYWZlR2xvYmFsRm9yTm9kZSA9IGNyZWF0ZU5ld1Vuc2FmZUdsb2JhbEZvck5vZGUoKTtcbiAgICBpZiAoXG4gICAgICAoIW5ld1Vuc2FmZUdsb2JhbEZvckJyb3dzZXIgJiYgIW5ld1Vuc2FmZUdsb2JhbEZvck5vZGUpIHx8XG4gICAgICAobmV3VW5zYWZlR2xvYmFsRm9yQnJvd3NlciAmJiBuZXdVbnNhZmVHbG9iYWxGb3JOb2RlKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmV4cGVjdGVkIHBsYXRmb3JtLCB1bmFibGUgdG8gY3JlYXRlIFJlYWxtJyk7XG4gICAgfVxuICAgIHJldHVybiBuZXdVbnNhZmVHbG9iYWxGb3JCcm93c2VyIHx8IG5ld1Vuc2FmZUdsb2JhbEZvck5vZGU7XG4gIH07XG5cbiAgLy8gVGhlIHVuc2FmZVJlYyBpcyBzaGltLXNwZWNpZmljLiBJdCBhY3RzIGFzIHRoZSBtZWNoYW5pc20gdG8gb2J0YWluIGEgZnJlc2hcbiAgLy8gc2V0IG9mIGludHJpbnNpY3MgdG9nZXRoZXIgd2l0aCB0aGVpciBhc3NvY2lhdGVkIGV2YWwgYW5kIEZ1bmN0aW9uXG4gIC8vIGV2YWx1YXRvcnMuIFRoZXNlIG11c3QgYmUgdXNlZCBhcyBhIG1hdGNoZWQgc2V0LCBzaW5jZSB0aGUgZXZhbHVhdG9ycyBhcmVcbiAgLy8gdGllZCB0byBhIHNldCBvZiBpbnRyaW5zaWNzLCBha2EgdGhlIFwidW5kZW5pYWJsZXNcIi4gSWYgaXQgd2VyZSBwb3NzaWJsZSB0b1xuICAvLyBtaXgtYW5kLW1hdGNoIHRoZW0gZnJvbSBkaWZmZXJlbnQgY29udGV4dHMsIHRoYXQgd291bGQgZW5hYmxlIHNvbWVcbiAgLy8gYXR0YWNrcy5cbiAgZnVuY3Rpb24gY3JlYXRlVW5zYWZlUmVjKHVuc2FmZUdsb2JhbCwgYWxsU2hpbXMgPSBbXSkge1xuICAgIGNvbnN0IHNoYXJlZEdsb2JhbERlc2NzID0gZ2V0U2hhcmVkR2xvYmFsRGVzY3ModW5zYWZlR2xvYmFsKTtcblxuICAgIHJldHVybiBmcmVlemUoe1xuICAgICAgdW5zYWZlR2xvYmFsLFxuICAgICAgc2hhcmVkR2xvYmFsRGVzY3MsXG4gICAgICB1bnNhZmVFdmFsOiB1bnNhZmVHbG9iYWwuZXZhbCxcbiAgICAgIHVuc2FmZUZ1bmN0aW9uOiB1bnNhZmVHbG9iYWwuRnVuY3Rpb24sXG4gICAgICBhbGxTaGltc1xuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgcmVwYWlyQWNjZXNzb3JzU2hpbSA9IGNsZWFudXBTb3VyY2UoXG4gICAgYFwidXNlIHN0cmljdFwiOyAoJHtyZXBhaXJBY2Nlc3NvcnN9KSgpO2BcbiAgKTtcbiAgY29uc3QgcmVwYWlyRnVuY3Rpb25zU2hpbSA9IGNsZWFudXBTb3VyY2UoXG4gICAgYFwidXNlIHN0cmljdFwiOyAoJHtyZXBhaXJGdW5jdGlvbnN9KSgpO2BcbiAgKTtcblxuICAvLyBDcmVhdGUgYSBuZXcgdW5zYWZlUmVjIGZyb20gYSBicmFuZCBuZXcgY29udGV4dCwgd2l0aCBuZXcgaW50cmluc2ljcyBhbmQgYVxuICAvLyBuZXcgZ2xvYmFsIG9iamVjdFxuICBmdW5jdGlvbiBjcmVhdGVOZXdVbnNhZmVSZWMoYWxsU2hpbXMpIHtcbiAgICBjb25zdCB1bnNhZmVHbG9iYWwgPSBnZXROZXdVbnNhZmVHbG9iYWwoKTtcbiAgICB1bnNhZmVHbG9iYWwuZXZhbChyZXBhaXJBY2Nlc3NvcnNTaGltKTtcbiAgICB1bnNhZmVHbG9iYWwuZXZhbChyZXBhaXJGdW5jdGlvbnNTaGltKTtcbiAgICByZXR1cm4gY3JlYXRlVW5zYWZlUmVjKHVuc2FmZUdsb2JhbCwgYWxsU2hpbXMpO1xuICB9XG5cbiAgLy8gQ3JlYXRlIGEgbmV3IHVuc2FmZVJlYyBmcm9tIHRoZSBjdXJyZW50IGNvbnRleHQsIHdoZXJlIHRoZSBSZWFsbSBzaGltIGlzXG4gIC8vIGJlaW5nIHBhcnNlZCBhbmQgZXhlY3V0ZWQsIGFrYSB0aGUgXCJQcmltYWwgUmVhbG1cIlxuICBmdW5jdGlvbiBjcmVhdGVDdXJyZW50VW5zYWZlUmVjKCkge1xuICAgIGNvbnN0IHVuc2FmZUdsb2JhbCA9ICgwLCBldmFsKSh1bnNhZmVHbG9iYWxTcmMpO1xuICAgIHJlcGFpckFjY2Vzc29ycygpO1xuICAgIHJlcGFpckZ1bmN0aW9ucygpO1xuICAgIHJldHVybiBjcmVhdGVVbnNhZmVSZWModW5zYWZlR2xvYmFsKTtcbiAgfVxuXG4gIC8vIHRvZG86IHRoaW5rIGFib3V0IGhvdyB0aGlzIGludGVyYWN0cyB3aXRoIGVuZG93bWVudHMsIGNoZWNrIGZvciBjb25mbGljdHNcbiAgLy8gYmV0d2VlbiB0aGUgbmFtZXMgYmVpbmcgb3B0aW1pemVkIGFuZCB0aGUgb25lcyBhZGRlZCBieSBlbmRvd21lbnRzXG5cbiAgLyoqXG4gICAqIFNpbXBsaWZpZWQgdmFsaWRhdGlvbiBvZiBpbmRlbnRpZmllciBuYW1lczogbWF5IG9ubHkgY29udGFpbiBhbHBoYW51bWVyaWNcbiAgICogY2hhcmFjdGVycyAob3IgXCIkXCIgb3IgXCJfXCIpLCBhbmQgbWF5IG5vdCBzdGFydCB3aXRoIGEgZGlnaXQuIFRoaXMgaXMgc2FmZVxuICAgKiBhbmQgZG9lcyBub3QgcmVkdWNlcyB0aGUgY29tcGF0aWJpbGl0eSBvZiB0aGUgc2hpbS4gVGhlIG1vdGl2YXRpb24gZm9yXG4gICAqIHRoaXMgbGltaXRhdGlvbiB3YXMgdG8gZGVjcmVhc2UgdGhlIGNvbXBsZXhpdHkgb2YgdGhlIGltcGxlbWVudGF0aW9uLFxuICAgKiBhbmQgdG8gbWFpbnRhaW4gYSByZXNvbmFibGUgbGV2ZWwgb2YgcGVyZm9ybWFuY2UuXG4gICAqIE5vdGU6IFxcdyBpcyBlcXVpdmFsZW50IFthLXpBLVpfMC05XVxuICAgKiBTZWUgMTEuNi4xIElkZW50aWZpZXIgTmFtZXNcbiAgICovXG4gIGNvbnN0IGlkZW50aWZpZXJQYXR0ZXJuID0gL15bYS16QS1aXyRdW1xcdyRdKiQvO1xuXG4gIC8qKlxuICAgKiBJbiBKYXZhU2NyaXB0IHlvdSBjYW5ub3QgdXNlIHRoZXNlIHJlc2VydmVkIHdvcmRzIGFzIHZhcmlhYmxlcy5cbiAgICogU2VlIDExLjYuMSBJZGVudGlmaWVyIE5hbWVzXG4gICAqL1xuICBjb25zdCBrZXl3b3JkcyA9IG5ldyBTZXQoW1xuICAgIC8vIDExLjYuMi4xIEtleXdvcmRzXG4gICAgJ2F3YWl0JyxcbiAgICAnYnJlYWsnLFxuICAgICdjYXNlJyxcbiAgICAnY2F0Y2gnLFxuICAgICdjbGFzcycsXG4gICAgJ2NvbnN0JyxcbiAgICAnY29udGludWUnLFxuICAgICdkZWJ1Z2dlcicsXG4gICAgJ2RlZmF1bHQnLFxuICAgICdkZWxldGUnLFxuICAgICdkbycsXG4gICAgJ2Vsc2UnLFxuICAgICdleHBvcnQnLFxuICAgICdleHRlbmRzJyxcbiAgICAnZmluYWxseScsXG4gICAgJ2ZvcicsXG4gICAgJ2Z1bmN0aW9uJyxcbiAgICAnaWYnLFxuICAgICdpbXBvcnQnLFxuICAgICdpbicsXG4gICAgJ2luc3RhbmNlb2YnLFxuICAgICduZXcnLFxuICAgICdyZXR1cm4nLFxuICAgICdzdXBlcicsXG4gICAgJ3N3aXRjaCcsXG4gICAgJ3RoaXMnLFxuICAgICd0aHJvdycsXG4gICAgJ3RyeScsXG4gICAgJ3R5cGVvZicsXG4gICAgJ3ZhcicsXG4gICAgJ3ZvaWQnLFxuICAgICd3aGlsZScsXG4gICAgJ3dpdGgnLFxuICAgICd5aWVsZCcsXG5cbiAgICAvLyBBbHNvIHJlc2VydmVkIHdoZW4gcGFyc2luZyBzdHJpY3QgbW9kZSBjb2RlXG4gICAgJ2xldCcsXG4gICAgJ3N0YXRpYycsXG5cbiAgICAvLyAxMS42LjIuMiBGdXR1cmUgUmVzZXJ2ZWQgV29yZHNcbiAgICAnZW51bScsXG5cbiAgICAvLyBBbHNvIHJlc2VydmVkIHdoZW4gcGFyc2luZyBzdHJpY3QgbW9kZSBjb2RlXG4gICAgJ2ltcGxlbWVudHMnLFxuICAgICdwYWNrYWdlJyxcbiAgICAncHJvdGVjdGVkJyxcbiAgICAnaW50ZXJmYWNlJyxcbiAgICAncHJpdmF0ZScsXG4gICAgJ3B1YmxpYycsXG5cbiAgICAvLyBSZXNlcnZlZCBidXQgbm90IG1lbnRpb25lZCBpbiBzcGVjc1xuICAgICdhd2FpdCcsXG5cbiAgICAnbnVsbCcsXG4gICAgJ3RydWUnLFxuICAgICdmYWxzZScsXG5cbiAgICAndGhpcycsXG4gICAgJ2FyZ3VtZW50cydcbiAgXSk7XG5cbiAgLyoqXG4gICAqIGdldE9wdGltaXphYmxlR2xvYmFscygpXG4gICAqIFdoYXQgdmFyaWFibGUgbmFtZXMgbWlnaHQgaXQgYnJpbmcgaW50byBzY29wZT8gVGhlc2UgaW5jbHVkZSBhbGxcbiAgICogcHJvcGVydHkgbmFtZXMgd2hpY2ggY2FuIGJlIHZhcmlhYmxlIG5hbWVzLCBpbmNsdWRpbmcgdGhlIG5hbWVzXG4gICAqIG9mIGluaGVyaXRlZCBwcm9wZXJ0aWVzLiBJdCBleGNsdWRlcyBzeW1ib2xzIGFuZCBuYW1lcyB3aGljaCBhcmVcbiAgICoga2V5d29yZHMuIFdlIGRyb3Agc3ltYm9scyBzYWZlbHkuIEN1cnJlbnRseSwgdGhpcyBzaGltIHJlZnVzZXNcbiAgICogc2VydmljZSBpZiBhbnkgb2YgdGhlIG5hbWVzIGFyZSBrZXl3b3JkcyBvciBrZXl3b3JkLWxpa2UuIFRoaXMgaXNcbiAgICogc2FmZSBhbmQgb25seSBwcmV2ZW50IHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIGdldE9wdGltaXphYmxlR2xvYmFscyhzYWZlR2xvYmFsKSB7XG4gICAgY29uc3QgZGVzY3MgPSBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHNhZmVHbG9iYWwpO1xuXG4gICAgLy8gZ2V0T3duUHJvcGVydHlOYW1lcyBkb2VzIGlnbm9yZSBTeW1ib2xzIHNvIHdlIGRvbid0IG5lZWQgdGhpcyBleHRyYSBjaGVjazpcbiAgICAvLyB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgJiZcbiAgICBjb25zdCBjb25zdGFudHMgPSBhcnJheUZpbHRlcihnZXRPd25Qcm9wZXJ0eU5hbWVzKGRlc2NzKSwgbmFtZSA9PiB7XG4gICAgICAvLyBFbnN1cmUgd2UgaGF2ZSBhIHZhbGlkIGlkZW50aWZpZXIuIFdlIHVzZSByZWdleHBUZXN0IHJhdGhlciB0aGFuXG4gICAgICAvLyAvLi4vLnRlc3QoKSB0byBndWFyZCBhZ2FpbnN0IHRoZSBjYXNlIHdoZXJlIFJlZ0V4cCBoYXMgYmVlbiBwb2lzb25lZC5cbiAgICAgIGlmIChcbiAgICAgICAgbmFtZSA9PT0gJ2V2YWwnIHx8XG4gICAgICAgIGtleXdvcmRzLmhhcyhuYW1lKSB8fFxuICAgICAgICAhcmVnZXhwVGVzdChpZGVudGlmaWVyUGF0dGVybiwgbmFtZSlcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRlc2MgPSBkZXNjc1tuYW1lXTtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBnZXR0ZXJzIHdpbGwgbm90IGhhdmUgLndyaXRhYmxlLCBkb24ndCBsZXQgdGhlIGZhbHN5bmVzcyBvZlxuICAgICAgICAvLyAndW5kZWZpbmVkJyB0cmljayB1czogdGVzdCB3aXRoID09PSBmYWxzZSwgbm90ICEgLiBIb3dldmVyIGRlc2NyaXB0b3JzXG4gICAgICAgIC8vIGluaGVyaXQgZnJvbSB0aGUgKHBvdGVudGlhbGx5IHBvaXNvbmVkKSBnbG9iYWwgb2JqZWN0LCBzbyB3ZSBtaWdodCBzZWVcbiAgICAgICAgLy8gZXh0cmEgcHJvcGVydGllcyB3aGljaCB3ZXJlbid0IHJlYWxseSB0aGVyZS4gQWNjZXNzb3IgcHJvcGVydGllcyBoYXZlXG4gICAgICAgIC8vICdnZXQvc2V0L2VudW1lcmFibGUvY29uZmlndXJhYmxlJywgd2hpbGUgZGF0YSBwcm9wZXJ0aWVzIGhhdmVcbiAgICAgICAgLy8gJ3ZhbHVlL3dyaXRhYmxlL2VudW1lcmFibGUvY29uZmlndXJhYmxlJy5cbiAgICAgICAgZGVzYy5jb25maWd1cmFibGUgPT09IGZhbHNlICYmXG4gICAgICAgIGRlc2Mud3JpdGFibGUgPT09IGZhbHNlICYmXG4gICAgICAgIC8vXG4gICAgICAgIC8vIENoZWNrcyBmb3IgZGF0YSBwcm9wZXJ0aWVzIGJlY2F1c2UgdGhleSdyZSB0aGUgb25seSBvbmVzIHdlIGNhblxuICAgICAgICAvLyBvcHRpbWl6ZSAoYWNjZXNzb3JzIGFyZSBtb3N0IGxpa2VseSBub24tY29uc3RhbnQpLiBEZXNjcmlwdG9ycyBjYW4ndFxuICAgICAgICAvLyBjYW4ndCBoYXZlIGFjY2Vzc29ycyBhbmQgdmFsdWUgcHJvcGVydGllcyBhdCB0aGUgc2FtZSB0aW1lLCB0aGVyZWZvcmVcbiAgICAgICAgLy8gdGhpcyBjaGVjayBpcyBzdWZmaWNpZW50LiBVc2luZyBleHBsaWNpdCBvd24gcHJvcGVydHkgZGVhbCB3aXRoIHRoZVxuICAgICAgICAvLyBjYXNlIHdoZXJlIE9iamVjdC5wcm90b3R5cGUgaGFzIGJlZW4gcG9pc29uZWQuXG4gICAgICAgIG9iamVjdEhhc093blByb3BlcnR5KGRlc2MsICd2YWx1ZScpXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNvbnN0YW50cztcbiAgfVxuXG4gIC8qKlxuICAgKiBhbHdheXNUaHJvd0hhbmRsZXIgaXMgYSBwcm94eSBoYW5kbGVyIHdoaWNoIHRocm93cyBvbiBhbnkgdHJhcCBjYWxsZWQuXG4gICAqIEl0J3MgbWFkZSBmcm9tIGEgcHJveHkgd2l0aCBhIGdldCB0cmFwIHRoYXQgdGhyb3dzLiBJdHMgdGFyZ2V0IGlzXG4gICAqIGFuIGltbXV0YWJsZSAoZnJvemVuKSBvYmplY3QgYW5kIGlzIHNhZmUgdG8gc2hhcmUuXG4gICAqL1xuICBjb25zdCBhbHdheXNUaHJvd0hhbmRsZXIgPSBuZXcgUHJveHkoZnJlZXplKHt9KSwge1xuICAgIGdldCh0YXJnZXQsIHByb3ApIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgYHVuZXhwZWN0ZWQgc2NvcGUgaGFuZGxlciB0cmFwIGNhbGxlZDogJHtwcm9wfWAsXG4gICAgICAgIG5ldyBFcnJvcigpLnN0YWNrXG4gICAgICApO1xuICAgICAgLy8gdGhyb3dUYW50cnVtKGB1bmV4cGVjdGVkIHNjb3BlIGhhbmRsZXIgdHJhcCBjYWxsZWQ6ICR7cHJvcH1gKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBTY29wZUhhbmRsZXIgbWFuYWdlcyBhIFByb3h5IHdoaWNoIHNlcnZlcyBhcyB0aGUgZ2xvYmFsIHNjb3BlIGZvciB0aGVcbiAgICogc2FmZUV2YWx1YXRvciBvcGVyYXRpb24gKHRoZSBQcm94eSBpcyB0aGUgYXJndW1lbnQgb2YgYSAnd2l0aCcgYmluZGluZykuXG4gICAqIEFzIGRlc2NyaWJlZCBpbiBjcmVhdGVTYWZlRXZhbHVhdG9yKCksIGl0IGhhcyBzZXZlcmFsIGZ1bmN0aW9uczpcbiAgICogLSBhbGxvdyB0aGUgdmVyeSBmaXJzdCAoYW5kIG9ubHkgdGhlIHZlcnkgZmlyc3QpIHVzZSBvZiAnZXZhbCcgdG8gbWFwIHRvXG4gICAqICAgdGhlIHJlYWwgKHVuc2FmZSkgZXZhbCBmdW5jdGlvbiwgc28gaXQgYWN0cyBhcyBhICdkaXJlY3QgZXZhbCcgYW5kIGNhblxuICAgKiAgICBhY2Nlc3MgaXRzIGxleGljYWwgc2NvcGUgKHdoaWNoIG1hcHMgdG8gdGhlICd3aXRoJyBiaW5kaW5nLCB3aGljaCB0aGVcbiAgICogICBTY29wZUhhbmRsZXIgYWxzbyBjb250cm9scykuXG4gICAqIC0gZW5zdXJlIHRoYXQgYWxsIHN1YnNlcXVlbnQgdXNlcyBvZiAnZXZhbCcgbWFwIHRvIHRoZSBzYWZlRXZhbHVhdG9yLFxuICAgKiAgIHdoaWNoIGxpdmVzIGFzIHRoZSAnZXZhbCcgcHJvcGVydHkgb2YgdGhlIHNhZmVHbG9iYWwuXG4gICAqIC0gcm91dGUgYWxsIG90aGVyIHByb3BlcnR5IGxvb2t1cHMgYXQgdGhlIHNhZmVHbG9iYWwuXG4gICAqIC0gaGlkZSB0aGUgdW5zYWZlR2xvYmFsIHdoaWNoIGxpdmVzIG9uIHRoZSBzY29wZSBjaGFpbiBhYm92ZSB0aGUgJ3dpdGgnLlxuICAgKiAtIGVuc3VyZSB0aGUgUHJveHkgaW52YXJpYW50cyBkZXNwaXRlIHNvbWUgZ2xvYmFsIHByb3BlcnRpZXMgYmVpbmcgZnJvemVuLlxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlU2NvcGVIYW5kbGVyKHVuc2FmZVJlYywgc2FmZUdsb2JhbCkge1xuICAgIGNvbnN0IHsgdW5zYWZlR2xvYmFsLCB1bnNhZmVFdmFsIH0gPSB1bnNhZmVSZWM7XG5cbiAgICAvLyBUaGlzIGZsYWcgYWxsb3cgdXMgdG8gZGV0ZXJtaW5lIGlmIHRoZSBldmFsKCkgY2FsbCBpcyBhbiBkb25lIGJ5IHRoZVxuICAgIC8vIHJlYWxtJ3MgY29kZSBvciBpZiBpdCBpcyB1c2VyLWxhbmQgaW52b2NhdGlvbiwgc28gd2UgY2FuIHJlYWN0IGRpZmZlcmVudGx5LlxuICAgIGxldCB1c2VVbnNhZmVFdmFsdWF0b3IgPSBmYWxzZTtcbiAgICAvLyBUaGlzIGZsYWcgYWxsb3cgdXMgdG8gYWxsb3cgdW5kZWZpbmVkIGFzc2lnbm1lbnRzIGluIG5vbi1zdHJpY3QgbW9kZS5cbiAgICAvLyBXaGVuIHRoZSBjb3VudGVyIGNvdW50IGRvd24gdG8gNCwgd2UgYWxsb3cgaXQgb25jZTtcbiAgICBsZXQgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzID0gMDtcblxuICAgIHJldHVybiB7XG4gICAgICAvLyBUaGUgc2NvcGUgaGFuZGxlciB0aHJvd3MgaWYgYW55IHRyYXAgb3RoZXIgdGhhbiBnZXQvc2V0L2hhcyBhcmUgcnVuXG4gICAgICAvLyAoZS5nLiBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzLCBhcHBseSwgZ2V0UHJvdG90eXBlT2YpLlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXByb3RvXG4gICAgICBfX3Byb3RvX186IGFsd2F5c1Rocm93SGFuZGxlcixcblxuICAgICAgYWxsb3dVbnNhZmVFdmFsdWF0b3JPbmNlKCkge1xuICAgICAgICB1c2VVbnNhZmVFdmFsdWF0b3IgPSB0cnVlO1xuICAgICAgfSxcblxuICAgICAgbm9uU3RyaWN0TW9kZUFzc2lnbm1lbnRBbGxvd2VkKCkge1xuICAgICAgICByZXR1cm4gYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzID09PSAzO1xuICAgICAgfSxcblxuICAgICAgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudCh0aW1lcyA9IDEpIHtcbiAgICAgICAgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzID0gdGltZXM7XG4gICAgICB9LFxuXG4gICAgICBoYXNOb25TdHJpY3RNb2RlQXNzaWduZWQoKSB7XG4gICAgICAgIGFsbG93Tm9uU3RyaWN0TW9kZUFzc2lnbm1lbnRUaW1lcyA9IE1hdGgubWF4KFxuICAgICAgICAgIDAsXG4gICAgICAgICAgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzIC0gMVxuICAgICAgICApO1xuICAgICAgfSxcblxuICAgICAgdW5zYWZlRXZhbHVhdG9yQWxsb3dlZCgpIHtcbiAgICAgICAgcmV0dXJuIHVzZVVuc2FmZUV2YWx1YXRvcjtcbiAgICAgIH0sXG5cbiAgICAgIGdldCh0YXJnZXQsIHByb3ApIHtcbiAgICAgICAgLy8gU3BlY2lhbCB0cmVhdG1lbnQgZm9yIGV2YWwuIFRoZSB2ZXJ5IGZpcnN0IGxvb2t1cCBvZiAnZXZhbCcgZ2V0cyB0aGVcbiAgICAgICAgLy8gdW5zYWZlIChyZWFsIGRpcmVjdCkgZXZhbCwgc28gaXQgd2lsbCBnZXQgdGhlIGxleGljYWwgc2NvcGUgdGhhdCB1c2VzXG4gICAgICAgIC8vIHRoZSAnd2l0aCcgY29udGV4dC5cbiAgICAgICAgaWYgKHByb3AgPT09ICdldmFsJykge1xuICAgICAgICAgIC8vIHRlc3QgdGhhdCBpdCBpcyB0cnVlIHJhdGhlciB0aGFuIG1lcmVseSB0cnV0aHlcbiAgICAgICAgICBpZiAodXNlVW5zYWZlRXZhbHVhdG9yID09PSB0cnVlKSB7XG4gICAgICAgICAgICAvLyByZXZva2UgYmVmb3JlIHVzZVxuICAgICAgICAgICAgdXNlVW5zYWZlRXZhbHVhdG9yID0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdW5zYWZlRXZhbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRhcmdldC5ldmFsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdG9kbzogc2hpbSBpbnRlZ3JpdHksIGNhcHR1cmUgU3ltYm9sLnVuc2NvcGFibGVzXG4gICAgICAgIGlmIChwcm9wID09PSBTeW1ib2wudW5zY29wYWJsZXMpIHtcbiAgICAgICAgICAvLyBTYWZlIHRvIHJldHVybiBhIHByaW1hbCByZWFsbSBPYmplY3QgaGVyZSBiZWNhdXNlIHRoZSBvbmx5IGNvZGUgdGhhdFxuICAgICAgICAgIC8vIGNhbiBkbyBhIGdldCgpIG9uIGEgbm9uLXN0cmluZyBpcyB0aGUgaW50ZXJuYWxzIG9mIHdpdGgoKSBpdHNlbGYsXG4gICAgICAgICAgLy8gYW5kIHRoZSBvbmx5IHRoaW5nIGl0IGRvZXMgaXMgdG8gbG9vayBmb3IgcHJvcGVydGllcyBvbiBpdC4gVXNlclxuICAgICAgICAgIC8vIGNvZGUgY2Fubm90IGRvIGEgbG9va3VwIG9uIG5vbi1zdHJpbmdzLlxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcm9wZXJ0aWVzIG9mIHRoZSBnbG9iYWwuXG4gICAgICAgIGlmIChwcm9wIGluIHRhcmdldCkge1xuICAgICAgICAgIHJldHVybiB0YXJnZXRbcHJvcF07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2ZW50IHRoZSBsb29rdXAgZm9yIG90aGVyIHByb3BlcnRpZXMuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9LFxuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY2xhc3MtbWV0aG9kcy11c2UtdGhpc1xuICAgICAgc2V0KHRhcmdldCwgcHJvcCwgdmFsdWUpIHtcbiAgICAgICAgLy8gdG9kbzogYWxsb3cgbW9kaWZpY2F0aW9ucyB3aGVuIHRhcmdldC5oYXNPd25Qcm9wZXJ0eShwcm9wKSBhbmQgaXRcbiAgICAgICAgLy8gaXMgd3JpdGFibGUsIGFzc3VtaW5nIHdlJ3ZlIGFscmVhZHkgcmVqZWN0ZWQgb3ZlcmxhcCAoc2VlXG4gICAgICAgIC8vIGNyZWF0ZVNhZmVFdmFsdWF0b3JGYWN0b3J5LmZhY3RvcnkpLiBUaGlzIFR5cGVFcnJvciBnZXRzIHJlcGxhY2VkIHdpdGhcbiAgICAgICAgLy8gdGFyZ2V0W3Byb3BdID0gdmFsdWVcbiAgICAgICAgaWYgKG9iamVjdEhhc093blByb3BlcnR5KHRhcmdldCwgcHJvcCkpIHtcbiAgICAgICAgICAvLyB0b2RvOiBzaGltIGludGVncml0eTogVHlwZUVycm9yLCBTdHJpbmdcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBkbyBub3QgbW9kaWZ5IGVuZG93bWVudHMgbGlrZSAke1N0cmluZyhwcm9wKX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNhZmVHbG9iYWxbcHJvcF0gPSB2YWx1ZTtcblxuICAgICAgICAvLyBSZXR1cm4gdHJ1ZSBhZnRlciBzdWNjZXNzZnVsIHNldC5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuXG4gICAgICAvLyB3ZSBuZWVkIGhhcygpIHRvIHJldHVybiBmYWxzZSBmb3Igc29tZSBuYW1lcyB0byBwcmV2ZW50IHRoZSBsb29rdXAgIGZyb21cbiAgICAgIC8vIGNsaW1iaW5nIHRoZSBzY29wZSBjaGFpbiBhbmQgZXZlbnR1YWxseSByZWFjaGluZyB0aGUgdW5zYWZlR2xvYmFsXG4gICAgICAvLyBvYmplY3QsIHdoaWNoIGlzIGJhZC5cblxuICAgICAgLy8gbm90ZTogdW5zY29wYWJsZXMhIGV2ZXJ5IHN0cmluZyBpbiBPYmplY3RbU3ltYm9sLnVuc2NvcGFibGVzXVxuXG4gICAgICAvLyB0b2RvOiB3ZSdkIGxpa2UgdG8ganVzdCBoYXZlIGhhcygpIHJldHVybiB0cnVlIGZvciBldmVyeXRoaW5nLCBhbmQgdGhlblxuICAgICAgLy8gdXNlIGdldCgpIHRvIHJhaXNlIGEgUmVmZXJlbmNlRXJyb3IgZm9yIGFueXRoaW5nIG5vdCBvbiB0aGUgc2FmZSBnbG9iYWwuXG4gICAgICAvLyBCdXQgd2Ugd2FudCB0byBiZSBjb21wYXRpYmxlIHdpdGggUmVmZXJlbmNlRXJyb3IgaW4gdGhlIG5vcm1hbCBjYXNlIGFuZFxuICAgICAgLy8gdGhlIGxhY2sgb2YgUmVmZXJlbmNlRXJyb3IgaW4gdGhlICd0eXBlb2YnIGNhc2UuIE11c3QgZWl0aGVyIHJlbGlhYmx5XG4gICAgICAvLyBkaXN0aW5ndWlzaCB0aGVzZSB0d28gY2FzZXMgKHRoZSB0cmFwIGJlaGF2aW9yIG1pZ2h0IGJlIGRpZmZlcmVudCksIG9yXG4gICAgICAvLyB3ZSByZWx5IG9uIGEgbWFuZGF0b3J5IHNvdXJjZS10by1zb3VyY2UgdHJhbnNmb3JtIHRvIGNoYW5nZSAndHlwZW9mIGFiYydcbiAgICAgIC8vIHRvIFhYWC4gV2UgYWxyZWFkeSBuZWVkIGEgbWFuZGF0b3J5IHBhcnNlIHRvIHByZXZlbnQgdGhlICdpbXBvcnQnLFxuICAgICAgLy8gc2luY2UgaXQncyBhIHNwZWNpYWwgZm9ybSBpbnN0ZWFkIG9mIG1lcmVseSBiZWluZyBhIGdsb2JhbCB2YXJpYWJsZS9cblxuICAgICAgLy8gbm90ZTogaWYgd2UgbWFrZSBoYXMoKSByZXR1cm4gdHJ1ZSBhbHdheXMsIHRoZW4gd2UgbXVzdCBpbXBsZW1lbnQgYVxuICAgICAgLy8gc2V0KCkgdHJhcCB0byBhdm9pZCBzdWJ2ZXJ0aW5nIHRoZSBwcm90ZWN0aW9uIG9mIHN0cmljdCBtb2RlIChpdCB3b3VsZFxuICAgICAgLy8gYWNjZXB0IGFzc2lnbm1lbnRzIHRvIHVuZGVmaW5lZCBnbG9iYWxzLCB3aGVuIGl0IG91Z2h0IHRvIHRocm93XG4gICAgICAvLyBSZWZlcmVuY2VFcnJvciBmb3Igc3VjaCBhc3NpZ25tZW50cylcblxuICAgICAgaGFzKHRhcmdldCwgcHJvcCkge1xuICAgICAgICBpZiAodGhpcy5ub25TdHJpY3RNb2RlQXNzaWdubWVudEFsbG93ZWQoKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIHByb3hpZXMgc3RyaW5naWZ5ICdwcm9wJywgc28gbm8gVE9DVFRPVSBkYW5nZXIgaGVyZVxuXG4gICAgICAgIC8vIHVuc2FmZUdsb2JhbDogaGlkZSBhbGwgcHJvcGVydGllcyBvZiB1bnNhZmVHbG9iYWwgYXQgdGhlXG4gICAgICAgIC8vIGV4cGVuc2Ugb2YgJ3R5cGVvZicgYmVpbmcgd3JvbmcgZm9yIHRob3NlIHByb3BlcnRpZXMuIEZvclxuICAgICAgICAvLyBleGFtcGxlLCBpbiB0aGUgYnJvd3NlciwgZXZhbHVhdGluZyAnZG9jdW1lbnQgPSAzJywgd2lsbCBhZGRcbiAgICAgICAgLy8gYSBwcm9wZXJ0eSB0byBzYWZlR2xvYmFsIGluc3RlYWQgb2YgdGhyb3dpbmcgYVxuICAgICAgICAvLyBSZWZlcmVuY2VFcnJvci5cbiAgICAgICAgaWYgKHByb3AgPT09ICdldmFsJyB8fCBwcm9wIGluIHRhcmdldCB8fCBwcm9wIGluIHVuc2FmZUdsb2JhbCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvLyBodHRwczovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzkuMC9pbmRleC5odG1sI3NlYy1odG1sLWxpa2UtY29tbWVudHNcblxuICAvLyBUaGUgc2hpbSBjYW5ub3QgY29ycmVjdGx5IGVtdWxhdGUgYSBkaXJlY3QgZXZhbCBhcyBleHBsYWluZWQgYXRcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0Fnb3JpYy9yZWFsbXMtc2hpbS9pc3N1ZXMvMTJcbiAgLy8gV2l0aG91dCByZWplY3RpbmcgYXBwYXJlbnQgZGlyZWN0IGV2YWwgc3ludGF4LCB3ZSB3b3VsZFxuICAvLyBhY2NpZGVudGFsbHkgZXZhbHVhdGUgdGhlc2Ugd2l0aCBhbiBlbXVsYXRpb24gb2YgaW5kaXJlY3QgZXZhbC4gVHBcbiAgLy8gcHJldmVudCBmdXR1cmUgY29tcGF0aWJpbGl0eSBwcm9ibGVtcywgaW4gc2hpZnRpbmcgZnJvbSB1c2Ugb2YgdGhlXG4gIC8vIHNoaW0gdG8gZ2VudWluZSBwbGF0Zm9ybSBzdXBwb3J0IGZvciB0aGUgcHJvcG9zYWwsIHdlIHNob3VsZFxuICAvLyBpbnN0ZWFkIHN0YXRpY2FsbHkgcmVqZWN0IGNvZGUgdGhhdCBzZWVtcyB0byBjb250YWluIGEgZGlyZWN0IGV2YWxcbiAgLy8gZXhwcmVzc2lvbi5cbiAgLy9cbiAgLy8gQXMgd2l0aCB0aGUgZHluYW1pYyBpbXBvcnQgZXhwcmVzc2lvbiwgdG8gYXZvaWQgYSBmdWxsIHBhcnNlLCB3ZSBkb1xuICAvLyB0aGlzIGFwcHJveGltYXRlbHkgd2l0aCBhIHJlZ2V4cCwgdGhhdCB3aWxsIGFsc28gcmVqZWN0IHN0cmluZ3NcbiAgLy8gdGhhdCBhcHBlYXIgc2FmZWx5IGluIGNvbW1lbnRzIG9yIHN0cmluZ3MuIFVubGlrZSBkeW5hbWljIGltcG9ydCxcbiAgLy8gaWYgd2UgbWlzcyBzb21lLCB0aGlzIG9ubHkgY3JlYXRlcyBmdXR1cmUgY29tcGF0IHByb2JsZW1zLCBub3RcbiAgLy8gc2VjdXJpdHkgcHJvYmxlbXMuIFRodXMsIHdlIGFyZSBvbmx5IHRyeWluZyB0byBjYXRjaCBpbm5vY2VudFxuICAvLyBvY2N1cnJlbmNlcywgbm90IG1hbGljaW91cyBvbmUuIEluIHBhcnRpY3VsYXIsIGAoZXZhbCkoLi4uKWAgaXNcbiAgLy8gZGlyZWN0IGV2YWwgc3ludGF4IHRoYXQgd291bGQgbm90IGJlIGNhdWdodCBieSB0aGUgZm9sbG93aW5nIHJlZ2V4cC5cblxuICBjb25zdCBzb21lRGlyZWN0RXZhbFBhdHRlcm4gPSAvXFxiZXZhbFxccyooPzpcXCh8XFwvWy8qXSkvO1xuXG4gIGZ1bmN0aW9uIHJlamVjdFNvbWVEaXJlY3RFdmFsRXhwcmVzc2lvbnMocykge1xuICAgIGNvbnN0IGluZGV4ID0gcy5zZWFyY2goc29tZURpcmVjdEV2YWxQYXR0ZXJuKTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICBjb25zdCBsaW5lbnVtID0gcy5zbGljZSgwLCBpbmRleCkuc3BsaXQoJ1xcbicpLmxlbmd0aDsgLy8gbW9yZSBvciBsZXNzXG4gICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgIGBwb3NzaWJsZSBkaXJlY3QgZXZhbCBleHByZXNzaW9uIHJlamVjdGVkIGFyb3VuZCBsaW5lICR7bGluZW51bX1gXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlamVjdERhbmdlcm91c1NvdXJjZXMocykge1xuICAgIC8vIHJlamVjdEh0bWxDb21tZW50cyhzKTtcbiAgICAvLyByZWplY3RJbXBvcnRFeHByZXNzaW9ucyhzKTtcbiAgICByZWplY3RTb21lRGlyZWN0RXZhbEV4cHJlc3Npb25zKHMpO1xuICB9XG5cbiAgLy8gUG9ydGlvbnMgYWRhcHRlZCBmcm9tIFY4IC0gQ29weXJpZ2h0IDIwMTYgdGhlIFY4IHByb2plY3QgYXV0aG9ycy5cblxuICBmdW5jdGlvbiBidWlsZE9wdGltaXplcihjb25zdGFudHMpIHtcbiAgICAvLyBObyBuZWVkIHRvIGJ1aWxkIGFuIG9wcmltaXplciB3aGVuIHRoZXJlIGFyZSBubyBjb25zdGFudHMuXG4gICAgaWYgKGNvbnN0YW50cy5sZW5ndGggPT09IDApIHJldHVybiAnJztcbiAgICAvLyBVc2UgJ3RoaXMnIHRvIGF2b2lkIGdvaW5nIHRocm91Z2ggdGhlIHNjb3BlIHByb3h5LCB3aGljaCBpcyB1bmVjZXNzYXJ5XG4gICAgLy8gc2luY2UgdGhlIG9wdGltaXplciBvbmx5IG5lZWRzIHJlZmVyZW5jZXMgdG8gdGhlIHNhZmUgZ2xvYmFsLlxuICAgIHJldHVybiBgY29uc3QgeyR7YXJyYXlKb2luKGNvbnN0YW50cywgJywnKX19ID0gdGhpcztgO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU2NvcGVkRXZhbHVhdG9yRmFjdG9yeSh1bnNhZmVSZWMsIGNvbnN0YW50cykge1xuICAgIGNvbnN0IHsgdW5zYWZlRnVuY3Rpb24gfSA9IHVuc2FmZVJlYztcblxuICAgIGNvbnN0IG9wdGltaXplciA9IGJ1aWxkT3B0aW1pemVyKGNvbnN0YW50cyk7XG5cbiAgICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBpbiBzbG9wcHkgbW9kZSwgc28gdGhhdCB3ZSBjYW4gdXNlICd3aXRoJy4gSXQgcmV0dXJuc1xuICAgIC8vIGEgZnVuY3Rpb24gaW4gc3RyaWN0IG1vZGUgdGhhdCBldmFsdWF0ZXMgdGhlIHByb3ZpZGVkIGNvZGUgdXNpbmcgZGlyZWN0XG4gICAgLy8gZXZhbCwgYW5kIHRodXMgaW4gc3RyaWN0IG1vZGUgaW4gdGhlIHNhbWUgc2NvcGUuIFdlIG11c3QgYmUgdmVyeSBjYXJlZnVsXG4gICAgLy8gdG8gbm90IGNyZWF0ZSBuZXcgbmFtZXMgaW4gdGhpcyBzY29wZVxuXG4gICAgLy8gMTogd2UgdXNlICd3aXRoJyAoYXJvdW5kIGEgUHJveHkpIHRvIGNhdGNoIGFsbCBmcmVlIHZhcmlhYmxlIG5hbWVzLiBUaGVcbiAgICAvLyBmaXJzdCAnYXJndW1lbnRzWzBdJyBob2xkcyB0aGUgUHJveHkgd2hpY2ggc2FmZWx5IHdyYXBzIHRoZSBzYWZlR2xvYmFsXG4gICAgLy8gMjogJ29wdGltaXplcicgY2F0Y2hlcyBjb21tb24gdmFyaWFibGUgbmFtZXMgZm9yIHNwZWVkXG4gICAgLy8gMzogVGhlIGlubmVyIHN0cmljdCBmdW5jdGlvbiBpcyBlZmZlY3RpdmVseSBwYXNzZWQgdHdvIHBhcmFtZXRlcnM6XG4gICAgLy8gICAgYSkgaXRzIGFyZ3VtZW50c1swXSBpcyB0aGUgc291cmNlIHRvIGJlIGRpcmVjdGx5IGV2YWx1YXRlZC5cbiAgICAvLyAgICBiKSBpdHMgJ3RoaXMnIGlzIHRoZSB0aGlzIGJpbmRpbmcgc2VlbiBieSB0aGUgY29kZSBiZWluZ1xuICAgIC8vICAgICAgIGRpcmVjdGx5IGV2YWx1YXRlZC5cblxuICAgIC8vIGV2ZXJ5dGhpbmcgaW4gdGhlICdvcHRpbWl6ZXInIHN0cmluZyBpcyBsb29rZWQgdXAgaW4gdGhlIHByb3h5XG4gICAgLy8gKGluY2x1ZGluZyBhbiAnYXJndW1lbnRzWzBdJywgd2hpY2ggcG9pbnRzIGF0IHRoZSBQcm94eSkuICdmdW5jdGlvbicgaXNcbiAgICAvLyBhIGtleXdvcmQsIG5vdCBhIHZhcmlhYmxlLCBzbyBpdCBpcyBub3QgbG9va2VkIHVwLiB0aGVuICdldmFsJyBpcyBsb29rZWRcbiAgICAvLyB1cCBpbiB0aGUgcHJveHksIHRoYXQncyB0aGUgZmlyc3QgdGltZSBpdCBpcyBsb29rZWQgdXAgYWZ0ZXJcbiAgICAvLyB1c2VVbnNhZmVFdmFsdWF0b3IgaXMgdHVybmVkIG9uLCBzbyB0aGUgcHJveHkgcmV0dXJucyB0aGUgcmVhbCB0aGVcbiAgICAvLyB1bnNhZmVFdmFsLCB3aGljaCBzYXRpc2ZpZXMgdGhlIElzRGlyZWN0RXZhbFRyYXAgcHJlZGljYXRlLCBzbyBpdCB1c2VzXG4gICAgLy8gdGhlIGRpcmVjdCBldmFsIGFuZCBnZXRzIHRoZSBsZXhpY2FsIHNjb3BlLiBUaGUgc2Vjb25kICdhcmd1bWVudHNbMF0nIGlzXG4gICAgLy8gbG9va2VkIHVwIGluIHRoZSBjb250ZXh0IG9mIHRoZSBpbm5lciBmdW5jdGlvbi4gVGhlICpjb250ZW50cyogb2ZcbiAgICAvLyBhcmd1bWVudHNbMF0sIGJlY2F1c2Ugd2UncmUgdXNpbmcgZGlyZWN0IGV2YWwsIGFyZSBsb29rZWQgdXAgaW4gdGhlXG4gICAgLy8gUHJveHksIGJ5IHdoaWNoIHBvaW50IHRoZSB1c2VVbnNhZmVFdmFsdWF0b3Igc3dpdGNoIGhhcyBiZWVuIGZsaXBwZWRcbiAgICAvLyBiYWNrIHRvICdmYWxzZScsIHNvIGFueSBpbnN0YW5jZXMgb2YgJ2V2YWwnIGluIHRoYXQgc3RyaW5nIHdpbGwgZ2V0IHRoZVxuICAgIC8vIHNhZmUgZXZhbHVhdG9yLlxuXG4gICAgcmV0dXJuIHVuc2FmZUZ1bmN0aW9uKGBcbiAgICB3aXRoIChhcmd1bWVudHNbMF0pIHtcbiAgICAgICR7b3B0aW1pemVyfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgIHJldHVybiBldmFsKGFyZ3VtZW50c1swXSk7XG4gICAgICB9O1xuICAgIH1cbiAgYCk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTYWZlRXZhbHVhdG9yRmFjdG9yeSh1bnNhZmVSZWMsIHNhZmVHbG9iYWwpIHtcbiAgICBjb25zdCB7IHVuc2FmZUZ1bmN0aW9uIH0gPSB1bnNhZmVSZWM7XG5cbiAgICBjb25zdCBzY29wZUhhbmRsZXIgPSBjcmVhdGVTY29wZUhhbmRsZXIodW5zYWZlUmVjLCBzYWZlR2xvYmFsKTtcbiAgICBjb25zdCBjb25zdGFudHMgPSBnZXRPcHRpbWl6YWJsZUdsb2JhbHMoc2FmZUdsb2JhbCk7XG4gICAgY29uc3Qgc2NvcGVkRXZhbHVhdG9yRmFjdG9yeSA9IGNyZWF0ZVNjb3BlZEV2YWx1YXRvckZhY3RvcnkoXG4gICAgICB1bnNhZmVSZWMsXG4gICAgICBjb25zdGFudHNcbiAgICApO1xuXG4gICAgZnVuY3Rpb24gZmFjdG9yeShlbmRvd21lbnRzID0ge30sIG5vblN0cmljdCA9IGZhbHNlKSB7XG4gICAgICAvLyB0b2RvIChzaGltIGxpbWl0YXRpb24pOiBzY2FuIGVuZG93bWVudHMsIHRocm93IGVycm9yIGlmIGVuZG93bWVudFxuICAgICAgLy8gb3ZlcmxhcHMgd2l0aCB0aGUgY29uc3Qgb3B0aW1pemF0aW9uICh3aGljaCB3b3VsZCBvdGhlcndpc2VcbiAgICAgIC8vIGluY29ycmVjdGx5IHNoYWRvdyBlbmRvd21lbnRzKSwgb3IgaWYgZW5kb3dtZW50cyBpbmNsdWRlcyAnZXZhbCcuIEFsc29cbiAgICAgIC8vIHByb2hpYml0IGFjY2Vzc29yIHByb3BlcnRpZXMgKHRvIGJlIGFibGUgdG8gY29uc2lzdGVudGx5IGV4cGxhaW5cbiAgICAgIC8vIHRoaW5ncyBpbiB0ZXJtcyBvZiBzaGltbWluZyB0aGUgZ2xvYmFsIGxleGljYWwgc2NvcGUpLlxuICAgICAgLy8gd3JpdGVhYmxlLXZzLW5vbndyaXRhYmxlID09IGxldC12cy1jb25zdCwgYnV0IHRoZXJlJ3Mgbm9cbiAgICAgIC8vIGdsb2JhbC1sZXhpY2FsLXNjb3BlIGVxdWl2YWxlbnQgb2YgYW4gYWNjZXNzb3IsIG91dHNpZGUgd2hhdCB3ZSBjYW5cbiAgICAgIC8vIGV4cGxhaW4vc3BlY1xuICAgICAgY29uc3Qgc2NvcGVUYXJnZXQgPSBjcmVhdGUoXG4gICAgICAgIHNhZmVHbG9iYWwsXG4gICAgICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcnMoZW5kb3dtZW50cylcbiAgICAgICk7XG4gICAgICBjb25zdCBzY29wZVByb3h5ID0gbmV3IFByb3h5KHNjb3BlVGFyZ2V0LCBzY29wZUhhbmRsZXIpO1xuICAgICAgY29uc3Qgc2NvcGVkRXZhbHVhdG9yID0gYXBwbHkoc2NvcGVkRXZhbHVhdG9yRmFjdG9yeSwgc2FmZUdsb2JhbCwgW1xuICAgICAgICBzY29wZVByb3h5XG4gICAgICBdKTtcblxuICAgICAgLy8gV2UgdXNlIHRoZSB0aGUgY29uY2lzZSBtZXRob2Qgc3ludGF4IHRvIGNyZWF0ZSBhbiBldmFsIHdpdGhvdXQgYVxuICAgICAgLy8gW1tDb25zdHJ1Y3RdXSBiZWhhdmlvciAoc3VjaCB0aGF0IHRoZSBpbnZvY2F0aW9uIFwibmV3IGV2YWwoKVwiIHRocm93c1xuICAgICAgLy8gVHlwZUVycm9yOiBldmFsIGlzIG5vdCBhIGNvbnN0cnVjdG9yXCIpLCBidXQgd2hpY2ggc3RpbGwgYWNjZXB0cyBhXG4gICAgICAvLyAndGhpcycgYmluZGluZy5cbiAgICAgIGNvbnN0IHNhZmVFdmFsID0ge1xuICAgICAgICBldmFsKHNyYykge1xuICAgICAgICAgIHNyYyA9IGAke3NyY31gO1xuICAgICAgICAgIHJlamVjdERhbmdlcm91c1NvdXJjZXMoc3JjKTtcbiAgICAgICAgICBzY29wZUhhbmRsZXIuYWxsb3dVbnNhZmVFdmFsdWF0b3JPbmNlKCk7XG4gICAgICAgICAgaWYgKG5vblN0cmljdCAmJiAhc2NvcGVIYW5kbGVyLm5vblN0cmljdE1vZGVBc3NpZ25tZW50QWxsb3dlZCgpKSB7XG4gICAgICAgICAgICBzY29wZUhhbmRsZXIuYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudCg1KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IGVycjtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gRW5zdXJlIHRoYXQgXCJ0aGlzXCIgcmVzb2x2ZXMgdG8gdGhlIHNhZmUgZ2xvYmFsLlxuICAgICAgICAgICAgcmV0dXJuIGFwcGx5KHNjb3BlZEV2YWx1YXRvciwgc2FmZUdsb2JhbCwgW3NyY10pO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIHN0YXNoIHRoZSBjaGlsZC1jb2RlIGVycm9yIGluIGhvcGVzIG9mIGRlYnVnZ2luZyB0aGUgaW50ZXJuYWwgZmFpbHVyZVxuICAgICAgICAgICAgZXJyID0gZTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHNjb3BlSGFuZGxlci5oYXNOb25TdHJpY3RNb2RlQXNzaWduZWQoKTtcbiAgICAgICAgICAgIC8vIGJlbHQgYW5kIHN1c3BlbmRlcnM6IHRoZSBwcm94eSBzd2l0Y2hlcyB0aGlzIG9mZiBpbW1lZGlhdGVseSBhZnRlclxuICAgICAgICAgICAgLy8gdGhlIGZpcnN0IGFjY2VzcywgYnV0IGlmIHRoYXQncyBub3QgdGhlIGNhc2Ugd2UgYWJvcnQuXG4gICAgICAgICAgICBpZiAoc2NvcGVIYW5kbGVyLnVuc2FmZUV2YWx1YXRvckFsbG93ZWQoKSkge1xuICAgICAgICAgICAgICB0aHJvd1RhbnRydW0oJ2hhbmRsZXIgZGlkIG5vdCByZXZva2UgdXNlVW5zYWZlRXZhbHVhdG9yJywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0uZXZhbDtcblxuICAgICAgLy8gc2FmZUV2YWwncyBwcm90b3R5cGUgaXMgY3VycmVudGx5IHRoZSBwcmltYWwgcmVhbG0nc1xuICAgICAgLy8gRnVuY3Rpb24ucHJvdG90eXBlLCB3aGljaCB3ZSBtdXN0IG5vdCBsZXQgZXNjYXBlLiBUbyBtYWtlICdldmFsXG4gICAgICAvLyBpbnN0YW5jZW9mIEZ1bmN0aW9uJyBiZSB0cnVlIGluc2lkZSB0aGUgcmVhbG0sIHdlIG5lZWQgdG8gcG9pbnQgaXQgYXRcbiAgICAgIC8vIHRoZSBSb290UmVhbG0ncyB2YWx1ZS5cblxuICAgICAgLy8gRW5zdXJlIHRoYXQgZXZhbCBmcm9tIGFueSBjb21wYXJ0bWVudCBpbiBhIHJvb3QgcmVhbG0gaXMgYW4gaW5zdGFuY2VcbiAgICAgIC8vIG9mIEZ1bmN0aW9uIGluIGFueSBjb21wYXJ0bWVudCBvZiB0aGUgc2FtZSByb290IHJlYWxtLlxuICAgICAgc2V0UHJvdG90eXBlT2Yoc2FmZUV2YWwsIHVuc2FmZUZ1bmN0aW9uLnByb3RvdHlwZSk7XG5cbiAgICAgIGFzc2VydChnZXRQcm90b3R5cGVPZihzYWZlRXZhbCkuY29uc3RydWN0b3IgIT09IEZ1bmN0aW9uLCAnaGlkZSBGdW5jdGlvbicpO1xuICAgICAgYXNzZXJ0KFxuICAgICAgICBnZXRQcm90b3R5cGVPZihzYWZlRXZhbCkuY29uc3RydWN0b3IgIT09IHVuc2FmZUZ1bmN0aW9uLFxuICAgICAgICAnaGlkZSB1bnNhZmVGdW5jdGlvbidcbiAgICAgICk7XG5cbiAgICAgIC8vIG5vdGU6IGJlIGNhcmVmdWwgdG8gbm90IGxlYWsgb3VyIHByaW1hbCBGdW5jdGlvbi5wcm90b3R5cGUgYnkgc2V0dGluZ1xuICAgICAgLy8gdGhpcyB0byBhIHBsYWluIGFycm93IGZ1bmN0aW9uLiBOb3cgdGhhdCB3ZSBoYXZlIHNhZmVFdmFsLCB1c2UgaXQuXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKHNhZmVFdmFsLCB7XG4gICAgICAgIHRvU3RyaW5nOiB7XG4gICAgICAgICAgLy8gV2UgYnJlYWsgdXAgdGhlIGZvbGxvd2luZyBsaXRlcmFsIHN0cmluZyBzbyB0aGF0IGFuXG4gICAgICAgICAgLy8gYXBwYXJlbnQgZGlyZWN0IGV2YWwgc3ludGF4IGRvZXMgbm90IGFwcGVhciBpbiB0aGlzXG4gICAgICAgICAgLy8gZmlsZS4gVGh1cywgd2UgYXZvaWQgcmVqZWN0aW9uIGJ5IHRoZSBvdmVybHkgZWFnZXJcbiAgICAgICAgICAvLyByZWplY3REYW5nZXJvdXNTb3VyY2VzLlxuICAgICAgICAgIHZhbHVlOiBzYWZlRXZhbChcIigpID0+ICdmdW5jdGlvbiBldmFsJyArICcoKSB7IFtzaGltIGNvZGVdIH0nXCIpLFxuICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBzYWZlRXZhbDtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNhZmVFdmFsdWF0b3Ioc2FmZUV2YWx1YXRvckZhY3RvcnkpIHtcbiAgICByZXR1cm4gc2FmZUV2YWx1YXRvckZhY3RvcnkoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNhZmVFdmFsdWF0b3JXaGljaFRha2VzRW5kb3dtZW50cyhzYWZlRXZhbHVhdG9yRmFjdG9yeSkge1xuICAgIHJldHVybiAoeCwgZW5kb3dtZW50cykgPT4gc2FmZUV2YWx1YXRvckZhY3RvcnkoZW5kb3dtZW50cykoeCk7XG4gIH1cblxuICAvKipcbiAgICogQSBzYWZlIHZlcnNpb24gb2YgdGhlIG5hdGl2ZSBGdW5jdGlvbiB3aGljaCByZWxpZXMgb25cbiAgICogdGhlIHNhZmV0eSBvZiBldmFsRXZhbHVhdG9yIGZvciBjb25maW5lbWVudC5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZUZ1bmN0aW9uRXZhbHVhdG9yKFxuICAgIHVuc2FmZVJlYyxcbiAgICBzYWZlRXZhbEZhY3RvcnksXG4gICAgcmVhbG1HbG9iYWxcbiAgKSB7XG4gICAgY29uc3QgeyB1bnNhZmVGdW5jdGlvbiwgdW5zYWZlR2xvYmFsIH0gPSB1bnNhZmVSZWM7XG5cbiAgICBjb25zdCBzYWZlRXZhbFN0cmljdCA9IHNhZmVFdmFsRmFjdG9yeSh1bmRlZmluZWQsIGZhbHNlKTtcbiAgICBjb25zdCBzYWZlRXZhbE5vblN0cmljdCA9IHNhZmVFdmFsRmFjdG9yeSh1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgY29uc3Qgc2FmZUZ1bmN0aW9uID0gZnVuY3Rpb24gRnVuY3Rpb24oLi4ucGFyYW1zKSB7XG4gICAgICBjb25zdCBmdW5jdGlvbkJvZHkgPSBgJHthcnJheVBvcChwYXJhbXMpIHx8ICcnfWA7XG4gICAgICBsZXQgZnVuY3Rpb25QYXJhbXMgPSBgJHthcnJheUpvaW4ocGFyYW1zLCAnLCcpfWA7XG4gICAgICBpZiAoIXJlZ2V4cFRlc3QoL15bXFx3XFxzLF0qJC8sIGZ1bmN0aW9uUGFyYW1zKSkge1xuICAgICAgICB0aHJvdyBuZXcgdW5zYWZlR2xvYmFsLlN5bnRheEVycm9yKFxuICAgICAgICAgICdzaGltIGxpbWl0YXRpb246IEZ1bmN0aW9uIGFyZyBtdXN0IGJlIHNpbXBsZSBBU0NJSSBpZGVudGlmaWVycywgcG9zc2libHkgc2VwYXJhdGVkIGJ5IGNvbW1hczogbm8gZGVmYXVsdCB2YWx1ZXMsIHBhdHRlcm4gbWF0Y2hlcywgb3Igbm9uLUFTQ0lJIHBhcmFtZXRlciBuYW1lcydcbiAgICAgICAgKTtcbiAgICAgICAgLy8gdGhpcyBwcm90ZWN0cyBhZ2FpbnN0IE1hdHQgQXVzdGluJ3MgY2xldmVyIGF0dGFjazpcbiAgICAgICAgLy8gRnVuY3Rpb24oXCJhcmc9YFwiLCBcIi8qYm9keWApe30pOyh7eDogdGhpcy8qKi9cIilcbiAgICAgICAgLy8gd2hpY2ggd291bGQgdHVybiBpbnRvXG4gICAgICAgIC8vICAgICAoZnVuY3Rpb24oYXJnPWBcbiAgICAgICAgLy8gICAgIC8qYGAqLyl7XG4gICAgICAgIC8vICAgICAgLypib2R5YCl7fSk7KHt4OiB0aGlzLyoqL1xuICAgICAgICAvLyAgICAgfSlcbiAgICAgICAgLy8gd2hpY2ggcGFyc2VzIGFzIGEgZGVmYXVsdCBhcmd1bWVudCBvZiBgXFxuLypgYCovKXtcXG4vKmJvZHlgICwgd2hpY2hcbiAgICAgICAgLy8gaXMgYSBwYWlyIG9mIHRlbXBsYXRlIGxpdGVyYWxzIGJhY2stdG8tYmFjayAoc28gdGhlIGZpcnN0IG9uZVxuICAgICAgICAvLyBub21pbmFsbHkgZXZhbHVhdGVzIHRvIHRoZSBwYXJzZXIgdG8gdXNlIG9uIHRoZSBzZWNvbmQgb25lKSwgd2hpY2hcbiAgICAgICAgLy8gY2FuJ3QgYWN0dWFsbHkgZXhlY3V0ZSAoYmVjYXVzZSB0aGUgZmlyc3QgbGl0ZXJhbCBldmFscyB0byBhIHN0cmluZyxcbiAgICAgICAgLy8gd2hpY2ggY2FuJ3QgYmUgYSBwYXJzZXIgZnVuY3Rpb24pLCBidXQgdGhhdCBkb2Vzbid0IG1hdHRlciBiZWNhdXNlXG4gICAgICAgIC8vIHRoZSBmdW5jdGlvbiBpcyBieXBhc3NlZCBlbnRpcmVseS4gV2hlbiB0aGF0IGdldHMgZXZhbHVhdGVkLCBpdFxuICAgICAgICAvLyBkZWZpbmVzIChidXQgZG9lcyBub3QgaW52b2tlKSBhIGZ1bmN0aW9uLCB0aGVuIGV2YWx1YXRlcyBhIHNpbXBsZVxuICAgICAgICAvLyB7eDogdGhpc30gZXhwcmVzc2lvbiwgZ2l2aW5nIGFjY2VzcyB0byB0aGUgc2FmZSBnbG9iYWwuXG4gICAgICB9XG5cbiAgICAgIC8vIElzIHRoaXMgYSByZWFsIGZ1bmN0aW9uQm9keSwgb3IgaXMgc29tZW9uZSBhdHRlbXB0aW5nIGFuIGluamVjdGlvblxuICAgICAgLy8gYXR0YWNrPyBUaGlzIHdpbGwgdGhyb3cgYSBTeW50YXhFcnJvciBpZiB0aGUgc3RyaW5nIGlzIG5vdCBhY3R1YWxseSBhXG4gICAgICAvLyBmdW5jdGlvbiBib2R5LiBXZSBjb2VyY2UgdGhlIGJvZHkgaW50byBhIHJlYWwgc3RyaW5nIGFib3ZlIHRvIHByZXZlbnRcbiAgICAgIC8vIHNvbWVvbmUgZnJvbSBwYXNzaW5nIGFuIG9iamVjdCB3aXRoIGEgdG9TdHJpbmcoKSB0aGF0IHJldHVybnMgYSBzYWZlXG4gICAgICAvLyBzdHJpbmcgdGhlIGZpcnN0IHRpbWUsIGJ1dCBhbiBldmlsIHN0cmluZyB0aGUgc2Vjb25kIHRpbWUuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmV3LCBuZXctY2FwXG4gICAgICBuZXcgdW5zYWZlRnVuY3Rpb24oZnVuY3Rpb25Cb2R5KTtcblxuICAgICAgaWYgKHN0cmluZ0luY2x1ZGVzKGZ1bmN0aW9uUGFyYW1zLCAnKScpKSB7XG4gICAgICAgIC8vIElmIHRoZSBmb3JtYWwgcGFyYW1ldGVycyBzdHJpbmcgaW5jbHVkZSApIC0gYW4gaWxsZWdhbFxuICAgICAgICAvLyBjaGFyYWN0ZXIgLSBpdCBtYXkgbWFrZSB0aGUgY29tYmluZWQgZnVuY3Rpb24gZXhwcmVzc2lvblxuICAgICAgICAvLyBjb21waWxlLiBXZSBhdm9pZCB0aGlzIHByb2JsZW0gYnkgY2hlY2tpbmcgZm9yIHRoaXMgZWFybHkgb24uXG5cbiAgICAgICAgLy8gbm90ZTogdjggdGhyb3dzIGp1c3QgbGlrZSB0aGlzIGRvZXMsIGJ1dCBjaHJvbWUgYWNjZXB0c1xuICAgICAgICAvLyBlLmcuICdhID0gbmV3IERhdGUoKSdcbiAgICAgICAgdGhyb3cgbmV3IHVuc2FmZUdsb2JhbC5TeW50YXhFcnJvcihcbiAgICAgICAgICAnc2hpbSBsaW1pdGF0aW9uOiBGdW5jdGlvbiBhcmcgc3RyaW5nIGNvbnRhaW5zIHBhcmVudGhlc2lzJ1xuICAgICAgICApO1xuICAgICAgICAvLyB0b2RvOiBzaGltIGludGVncml0eSB0aHJlYXQgaWYgdGhleSBjaGFuZ2UgU3ludGF4RXJyb3JcbiAgICAgIH1cblxuICAgICAgLy8gdG9kbzogY2hlY2sgdG8gbWFrZSBzdXJlIHRoaXMgLmxlbmd0aCBpcyBzYWZlLiBtYXJrbSBzYXlzIHNhZmUuXG4gICAgICBpZiAoZnVuY3Rpb25QYXJhbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAvLyBJZiB0aGUgZm9ybWFsIHBhcmFtZXRlcnMgaW5jbHVkZSBhbiB1bmJhbGFuY2VkIGJsb2NrIGNvbW1lbnQsIHRoZVxuICAgICAgICAvLyBmdW5jdGlvbiBtdXN0IGJlIHJlamVjdGVkLiBTaW5jZSBKYXZhU2NyaXB0IGRvZXMgbm90IGFsbG93IG5lc3RlZFxuICAgICAgICAvLyBjb21tZW50cyB3ZSBjYW4gaW5jbHVkZSBhIHRyYWlsaW5nIGJsb2NrIGNvbW1lbnQgdG8gY2F0Y2ggdGhpcy5cbiAgICAgICAgZnVuY3Rpb25QYXJhbXMgKz0gJ1xcbi8qYGAqLyc7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNyYyA9IGAoZnVuY3Rpb24oJHtmdW5jdGlvblBhcmFtc30pe1xcbiR7ZnVuY3Rpb25Cb2R5fVxcbn0pYDtcbiAgICAgIGNvbnN0IGlzU3RyaWN0ID0gISEvXlxccypbJ3xcIl11c2Ugc3RyaWN0Wyd8XCJdLy5leGVjKGZ1bmN0aW9uQm9keSk7XG4gICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgcmV0dXJuIHNhZmVFdmFsU3RyaWN0KHNyYyk7XG4gICAgICB9XG4gICAgICBjb25zdCBmbiA9IHNhZmVFdmFsTm9uU3RyaWN0KHNyYyk7XG4gICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgcmV0dXJuIGZuO1xuICAgICAgfVxuICAgICAgLy8gd2UgZml4IHRoZSBgdGhpc2AgYmluZGluZyBpbiBGdW5jdGlvbigpLlxuICAgICAgY29uc3QgYmluZFRoaXMgPSBgKGZ1bmN0aW9uIChnbG9iYWxUaGlzLCBmKSB7XG4gIGZ1bmN0aW9uIGYyKCkge1xuICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KGYsIHRoaXMgfHwgZ2xvYmFsVGhpcywgYXJndW1lbnRzKTtcbiAgfVxuICBmMi50b1N0cmluZyA9ICgpID0+IGYudG9TdHJpbmcoKTtcbiAgcmV0dXJuIGYyO1xufSlgO1xuICAgICAgY29uc3QgZm5XaXRoVGhpcyA9IHNhZmVFdmFsU3RyaWN0KGJpbmRUaGlzKShyZWFsbUdsb2JhbCwgZm4pO1xuICAgICAgcmV0dXJuIGZuV2l0aFRoaXM7XG4gICAgfTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IEZ1bmN0aW9uIGZyb20gYW55IGNvbXBhcnRtZW50IGluIGEgcm9vdCByZWFsbSBjYW4gYmUgdXNlZFxuICAgIC8vIHdpdGggaW5zdGFuY2UgY2hlY2tzIGluIGFueSBjb21wYXJ0bWVudCBvZiB0aGUgc2FtZSByb290IHJlYWxtLlxuICAgIHNldFByb3RvdHlwZU9mKHNhZmVGdW5jdGlvbiwgdW5zYWZlRnVuY3Rpb24ucHJvdG90eXBlKTtcblxuICAgIGFzc2VydChcbiAgICAgIGdldFByb3RvdHlwZU9mKHNhZmVGdW5jdGlvbikuY29uc3RydWN0b3IgIT09IEZ1bmN0aW9uLFxuICAgICAgJ2hpZGUgRnVuY3Rpb24nXG4gICAgKTtcbiAgICBhc3NlcnQoXG4gICAgICBnZXRQcm90b3R5cGVPZihzYWZlRnVuY3Rpb24pLmNvbnN0cnVjdG9yICE9PSB1bnNhZmVGdW5jdGlvbixcbiAgICAgICdoaWRlIHVuc2FmZUZ1bmN0aW9uJ1xuICAgICk7XG5cbiAgICBkZWZpbmVQcm9wZXJ0aWVzKHNhZmVGdW5jdGlvbiwge1xuICAgICAgLy8gRW5zdXJlIHRoYXQgYW55IGZ1bmN0aW9uIGNyZWF0ZWQgaW4gYW55IGNvbXBhcnRtZW50IGluIGEgcm9vdCByZWFsbSBpcyBhblxuICAgICAgLy8gaW5zdGFuY2Ugb2YgRnVuY3Rpb24gaW4gYW55IGNvbXBhcnRtZW50IG9mIHRoZSBzYW1lIHJvb3QgcmFsbS5cbiAgICAgIHByb3RvdHlwZTogeyB2YWx1ZTogdW5zYWZlRnVuY3Rpb24ucHJvdG90eXBlIH0sXG5cbiAgICAgIC8vIFByb3ZpZGUgYSBjdXN0b20gb3V0cHV0IHdpdGhvdXQgb3ZlcndyaXRpbmcgdGhlXG4gICAgICAvLyBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgd2hpY2ggaXMgY2FsbGVkIGJ5IHNvbWUgdGhpcmQtcGFydHlcbiAgICAgIC8vIGxpYnJhcmllcy5cbiAgICAgIHRvU3RyaW5nOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRXZhbFN0cmljdChcIigpID0+ICdmdW5jdGlvbiBGdW5jdGlvbigpIHsgW3NoaW0gY29kZV0gfSdcIiksXG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNhZmVGdW5jdGlvbjtcbiAgfVxuXG4gIC8vIE1pbWljIHByaXZhdGUgbWVtYmVycyBvbiB0aGUgcmVhbG0gaW5zdGFuY2VzLlxuICAvLyBXZSBkZWZpbmUgaXQgaW4gdGhlIHNhbWUgbW9kdWxlIGFuZCBkbyBub3QgZXhwb3J0IGl0LlxuICBjb25zdCBSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UgPSBuZXcgV2Vha01hcCgpO1xuXG4gIGZ1bmN0aW9uIGdldFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZShyZWFsbSkge1xuICAgIC8vIERldGVjdCBub24tb2JqZWN0cy5cbiAgICBhc3NlcnQoT2JqZWN0KHJlYWxtKSA9PT0gcmVhbG0sICdiYWQgb2JqZWN0LCBub3QgYSBSZWFsbSBpbnN0YW5jZScpO1xuICAgIC8vIFJlYWxtIGluc3RhbmNlIGhhcyBubyByZWFsbVJlYy4gU2hvdWxkIG5vdCBwcm9jZWVkLlxuICAgIGFzc2VydChSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UuaGFzKHJlYWxtKSwgJ1JlYWxtIGluc3RhbmNlIGhhcyBubyByZWNvcmQnKTtcblxuICAgIHJldHVybiBSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UuZ2V0KHJlYWxtKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHJlYWxtLCByZWFsbVJlYykge1xuICAgIC8vIERldGVjdCBub24tb2JqZWN0cy5cbiAgICBhc3NlcnQoT2JqZWN0KHJlYWxtKSA9PT0gcmVhbG0sICdiYWQgb2JqZWN0LCBub3QgYSBSZWFsbSBpbnN0YW5jZScpO1xuICAgIC8vIEF0dGVtcHQgdG8gY2hhbmdlIGFuIGV4aXN0aW5nIHJlYWxtUmVjIG9uIGEgcmVhbG0gaW5zdGFuY2UuIFNob3VsZCBub3QgcHJvY2VlZC5cbiAgICBhc3NlcnQoXG4gICAgICAhUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlLmhhcyhyZWFsbSksXG4gICAgICAnUmVhbG0gaW5zdGFuY2UgYWxyZWFkeSBoYXMgYSByZWNvcmQnXG4gICAgKTtcblxuICAgIFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZS5zZXQocmVhbG0sIHJlYWxtUmVjKTtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgdGhlIGdsb2JhbCB2YXJpYWJsZXMgZm9yIHRoZSBuZXcgUmVhbG0uXG4gIGZ1bmN0aW9uIHNldERlZmF1bHRCaW5kaW5ncyhzYWZlR2xvYmFsLCBzYWZlRXZhbCwgc2FmZUZ1bmN0aW9uKSB7XG4gICAgZGVmaW5lUHJvcGVydGllcyhzYWZlR2xvYmFsLCB7XG4gICAgICBldmFsOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRXZhbCxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSxcbiAgICAgIEZ1bmN0aW9uOiB7XG4gICAgICAgIHZhbHVlOiBzYWZlRnVuY3Rpb24sXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVJlYWxtUmVjKHVuc2FmZVJlYykge1xuICAgIGNvbnN0IHsgc2hhcmVkR2xvYmFsRGVzY3MsIHVuc2FmZUdsb2JhbCB9ID0gdW5zYWZlUmVjO1xuXG4gICAgY29uc3Qgc2FmZUdsb2JhbCA9IGNyZWF0ZSh1bnNhZmVHbG9iYWwuT2JqZWN0LnByb3RvdHlwZSwgc2hhcmVkR2xvYmFsRGVzY3MpO1xuXG4gICAgY29uc3Qgc2FmZUV2YWx1YXRvckZhY3RvcnkgPSBjcmVhdGVTYWZlRXZhbHVhdG9yRmFjdG9yeShcbiAgICAgIHVuc2FmZVJlYyxcbiAgICAgIHNhZmVHbG9iYWxcbiAgICApO1xuICAgIGNvbnN0IHNhZmVFdmFsID0gY3JlYXRlU2FmZUV2YWx1YXRvcihzYWZlRXZhbHVhdG9yRmFjdG9yeSk7XG4gICAgY29uc3Qgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyA9IGNyZWF0ZVNhZmVFdmFsdWF0b3JXaGljaFRha2VzRW5kb3dtZW50cyhcbiAgICAgIHNhZmVFdmFsdWF0b3JGYWN0b3J5XG4gICAgKTtcbiAgICBjb25zdCBzYWZlRnVuY3Rpb24gPSBjcmVhdGVGdW5jdGlvbkV2YWx1YXRvcihcbiAgICAgIHVuc2FmZVJlYyxcbiAgICAgIHNhZmVFdmFsdWF0b3JGYWN0b3J5LFxuICAgICAgc2FmZUdsb2JhbFxuICAgICk7XG5cbiAgICBzZXREZWZhdWx0QmluZGluZ3Moc2FmZUdsb2JhbCwgc2FmZUV2YWwsIHNhZmVGdW5jdGlvbik7XG5cbiAgICBjb25zdCByZWFsbVJlYyA9IGZyZWV6ZSh7XG4gICAgICBzYWZlR2xvYmFsLFxuICAgICAgc2FmZUV2YWwsXG4gICAgICBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzLFxuICAgICAgc2FmZUZ1bmN0aW9uXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVhbG1SZWM7XG4gIH1cblxuICAvKipcbiAgICogQSByb290IHJlYWxtIHVzZXMgYSBmcmVzaCBzZXQgb2YgbmV3IGludHJpbmljcy4gSGVyZSB3ZSBmaXJzdCBjcmVhdGVcbiAgICogYSBuZXcgdW5zYWZlIHJlY29yZCwgd2hpY2ggaW5oZXJpdHMgdGhlIHNoaW1zLiBUaGVuIHdlIHByb2NlZWQgd2l0aFxuICAgKiB0aGUgY3JlYXRpb24gb2YgdGhlIHJlYWxtIHJlY29yZCwgYW5kIHdlIGFwcGx5IHRoZSBzaGltcy5cbiAgICovXG4gIGZ1bmN0aW9uIGluaXRSb290UmVhbG0ocGFyZW50VW5zYWZlUmVjLCBzZWxmLCBvcHRpb25zKSB7XG4gICAgLy8gbm90ZTogJ3NlbGYnIGlzIHRoZSBpbnN0YW5jZSBvZiB0aGUgUmVhbG0uXG5cbiAgICAvLyB0b2RvOiBpbnZlc3RpZ2F0ZSBhdHRhY2tzIHZpYSBBcnJheS5zcGVjaWVzXG4gICAgLy8gdG9kbzogdGhpcyBhY2NlcHRzIG5ld1NoaW1zPSdzdHJpbmcnLCBidXQgaXQgc2hvdWxkIHJlamVjdCB0aGF0XG4gICAgY29uc3QgeyBzaGltczogbmV3U2hpbXMgfSA9IG9wdGlvbnM7XG4gICAgY29uc3QgYWxsU2hpbXMgPSBhcnJheUNvbmNhdChwYXJlbnRVbnNhZmVSZWMuYWxsU2hpbXMsIG5ld1NoaW1zKTtcblxuICAgIC8vIFRoZSB1bnNhZmUgcmVjb3JkIGlzIGNyZWF0ZWQgYWxyZWFkeSByZXBhaXJlZC5cbiAgICBjb25zdCB1bnNhZmVSZWMgPSBjcmVhdGVOZXdVbnNhZmVSZWMoYWxsU2hpbXMpO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgY29uc3QgUmVhbG0gPSBjcmVhdGVSZWFsbUZhY2FkZSh1bnNhZmVSZWMsIEJhc2VSZWFsbSk7XG5cbiAgICAvLyBBZGQgYSBSZWFsbSBkZXNjcmlwdG9yIHRvIHNoYXJlZEdsb2JhbERlc2NzLCBzbyBpdCBjYW4gYmUgZGVmaW5lZCBvbnRvIHRoZVxuICAgIC8vIHNhZmVHbG9iYWwgbGlrZSB0aGUgcmVzdCBvZiB0aGUgZ2xvYmFscy5cbiAgICB1bnNhZmVSZWMuc2hhcmVkR2xvYmFsRGVzY3MuUmVhbG0gPSB7XG4gICAgICB2YWx1ZTogUmVhbG0sXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH07XG5cbiAgICAvLyBDcmVhdGluZyB0aGUgcmVhbG1SZWMgcHJvdmlkZXMgdGhlIGdsb2JhbCBvYmplY3QsIGV2YWwoKSBhbmQgRnVuY3Rpb24oKVxuICAgIC8vIHRvIHRoZSByZWFsbS5cbiAgICBjb25zdCByZWFsbVJlYyA9IGNyZWF0ZVJlYWxtUmVjKHVuc2FmZVJlYyk7XG5cbiAgICAvLyBBcHBseSBhbGwgc2hpbXMgaW4gdGhlIG5ldyBSb290UmVhbG0uIFdlIGRvbid0IGRvIHRoaXMgZm9yIGNvbXBhcnRtZW50cy5cbiAgICBjb25zdCB7IHNhZmVFdmFsV2hpY2hUYWtlc0VuZG93bWVudHMgfSA9IHJlYWxtUmVjO1xuICAgIGZvciAoY29uc3Qgc2hpbSBvZiBhbGxTaGltcykge1xuICAgICAgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyhzaGltKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgcmVhbG1SZWMgYWN0cyBhcyBhIHByaXZhdGUgZmllbGQgb24gdGhlIHJlYWxtIGluc3RhbmNlLlxuICAgIHJlZ2lzdGVyUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHNlbGYsIHJlYWxtUmVjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGNvbXBhcnRtZW50IHNoYXJlcyB0aGUgaW50cmluc2ljcyBvZiBpdHMgcm9vdCByZWFsbS4gSGVyZSwgb25seSBhXG4gICAqIHJlYWxtUmVjIGlzIG5lY2Vzc2FyeSB0byBob2xkIHRoZSBnbG9iYWwgb2JqZWN0LCBldmFsKCkgYW5kIEZ1bmN0aW9uKCkuXG4gICAqL1xuICBmdW5jdGlvbiBpbml0Q29tcGFydG1lbnQodW5zYWZlUmVjLCBzZWxmKSB7XG4gICAgLy8gbm90ZTogJ3NlbGYnIGlzIHRoZSBpbnN0YW5jZSBvZiB0aGUgUmVhbG0uXG5cbiAgICBjb25zdCByZWFsbVJlYyA9IGNyZWF0ZVJlYWxtUmVjKHVuc2FmZVJlYyk7XG5cbiAgICAvLyBUaGUgcmVhbG1SZWMgYWN0cyBhcyBhIHByaXZhdGUgZmllbGQgb24gdGhlIHJlYWxtIGluc3RhbmNlLlxuICAgIHJlZ2lzdGVyUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHNlbGYsIHJlYWxtUmVjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlYWxtR2xvYmFsKHNlbGYpIHtcbiAgICBjb25zdCB7IHNhZmVHbG9iYWwgfSA9IGdldFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZShzZWxmKTtcbiAgICByZXR1cm4gc2FmZUdsb2JhbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWxtRXZhbHVhdGUoc2VsZiwgeCwgZW5kb3dtZW50cyA9IHt9KSB7XG4gICAgLy8gdG9kbzogZG9uJ3QgcGFzcyBpbiBwcmltYWwtcmVhbG0gb2JqZWN0cyBsaWtlIHt9LCBmb3Igc2FmZXR5LiBPVE9IIGl0c1xuICAgIC8vIHByb3BlcnRpZXMgYXJlIGNvcGllZCBvbnRvIHRoZSBuZXcgZ2xvYmFsICd0YXJnZXQnLlxuICAgIC8vIHRvZG86IGZpZ3VyZSBvdXQgYSB3YXkgdG8gbWVtYnJhbmUgYXdheSB0aGUgY29udGVudHMgdG8gc2FmZXR5LlxuICAgIGNvbnN0IHsgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyB9ID0gZ2V0UmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHNlbGYpO1xuICAgIHJldHVybiBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzKHgsIGVuZG93bWVudHMpO1xuICB9XG5cbiAgY29uc3QgQmFzZVJlYWxtID0ge1xuICAgIGluaXRSb290UmVhbG0sXG4gICAgaW5pdENvbXBhcnRtZW50LFxuICAgIGdldFJlYWxtR2xvYmFsLFxuICAgIHJlYWxtRXZhbHVhdGVcbiAgfTtcblxuICAvLyBDcmVhdGUgdGhlIGN1cnJlbnQgdW5zYWZlUmVjIGZyb20gdGhlIGN1cnJlbnQgXCJwcmltYWxcIiBlbnZpcm9ubWVudCAodGhlIHJlYWxtXG4gIC8vIHdoZXJlIHRoZSBSZWFsbSBzaGltIGlzIGxvYWRlZCBhbmQgZXhlY3V0ZWQpLlxuICBjb25zdCBjdXJyZW50VW5zYWZlUmVjID0gY3JlYXRlQ3VycmVudFVuc2FmZVJlYygpO1xuXG4gIC8qKlxuICAgKiBUaGUgXCJwcmltYWxcIiByZWFsbSBjbGFzcyBpcyBkZWZpbmVkIGluIHRoZSBjdXJyZW50IFwicHJpbWFsXCIgZW52aXJvbm1lbnQsXG4gICAqIGFuZCBpcyBwYXJ0IG9mIHRoZSBzaGltLiBUaGVyZSBpcyBubyBuZWVkIHRvIGZhY2FkZSB0aGlzIGNsYXNzIHZpYSBldmFsdWF0aW9uXG4gICAqIGJlY2F1c2UgYm90aCBzaGFyZSB0aGUgc2FtZSBpbnRyaW5zaWNzLlxuICAgKi9cbiAgY29uc3QgUmVhbG0gPSBidWlsZENoaWxkUmVhbG0oY3VycmVudFVuc2FmZVJlYywgQmFzZVJlYWxtKTtcblxuICByZXR1cm4gUmVhbG07XG5cbn0pKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJlYWxtcy1zaGltLnVtZC5qcy5tYXBcbiIsImNvbnN0IE1lc3NhZ2VDZW50ZXJFdmVudCA9ICdIb2xvZmxvd3MtS2l0IE1lc3NhZ2VDZW50ZXInO1xuY29uc3QgbmV3TWVzc2FnZSA9IChrZXksIGRhdGEpID0+IG5ldyBDdXN0b21FdmVudChNZXNzYWdlQ2VudGVyRXZlbnQsIHsgZGV0YWlsOiB7IGRhdGEsIGtleSB9IH0pO1xuY29uc3Qgbm9vcCA9ICgpID0+IHsgfTtcbi8qKlxuICogU2VuZCBhbmQgcmVjZWl2ZSBtZXNzYWdlcyBpbiBkaWZmZXJlbnQgY29udGV4dHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZXNzYWdlQ2VudGVyIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0gaW5zdGFuY2VLZXkgLSBVc2UgdGhpcyBpbnN0YW5jZUtleSB0byBkaXN0aW5ndWlzaCB5b3VyIG1lc3NhZ2VzIGFuZCBvdGhlcnMuXG4gICAgICogVGhpcyBvcHRpb24gY2Fubm90IG1ha2UgeW91ciBtZXNzYWdlIHNhZmUhXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoaW5zdGFuY2VLZXkgPSAnJykge1xuICAgICAgICB0aGlzLmluc3RhbmNlS2V5ID0gaW5zdGFuY2VLZXk7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSAocmVxdWVzdCkgPT4ge1xuICAgICAgICAgICAgbGV0IHsga2V5LCBkYXRhLCBpbnN0YW5jZUtleSB9ID0gcmVxdWVzdC5kZXRhaWwgfHwgcmVxdWVzdDtcbiAgICAgICAgICAgIC8vIE1lc3NhZ2UgaXMgbm90IGZvciB1c1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5zdGFuY2VLZXkgIT09IChpbnN0YW5jZUtleSB8fCAnJykpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMud3JpdGVUb0NvbnNvbGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgJWNSZWNlaXZlJWMgJWMke2tleS50b1N0cmluZygpfWAsICdiYWNrZ3JvdW5kOiByZ2JhKDAsIDI1NSwgMjU1LCAwLjYpOyBjb2xvcjogYmxhY2s7IHBhZGRpbmc6IDBweCA2cHg7IGJvcmRlci1yYWRpdXM6IDRweDsnLCAnJywgJ3RleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lJywgZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5maWx0ZXIoaXQgPT4gaXQua2V5ID09PSBrZXkpLmZvckVhY2goaXQgPT4gaXQuaGFuZGxlcihkYXRhKSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMud3JpdGVUb0NvbnNvbGUgPSBmYWxzZTtcbiAgICAgICAgaWYgKHR5cGVvZiBicm93c2VyICE9PSAndW5kZWZpbmVkJyAmJiBicm93c2VyLnJ1bnRpbWUgJiYgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZSkge1xuICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiBhIG1lc3NhZ2UgaXMgc2VudCBmcm9tIGVpdGhlciBhbiBleHRlbnNpb24gcHJvY2VzcyAoYnkgcnVudGltZS5zZW5kTWVzc2FnZSlcbiAgICAgICAgICAgIC8vIG9yIGEgY29udGVudCBzY3JpcHQgKGJ5IHRhYnMuc2VuZE1lc3NhZ2UpLlxuICAgICAgICAgICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcih0aGlzLmxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKE1lc3NhZ2VDZW50ZXJFdmVudCwgdGhpcy5saXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogTGlzdGVuIHRvIGFuIGV2ZW50XG4gICAgICogQHBhcmFtIGV2ZW50IC0gTmFtZSBvZiB0aGUgZXZlbnRcbiAgICAgKiBAcGFyYW0gaGFuZGxlciAtIEhhbmRsZXIgb2YgdGhlIGV2ZW50XG4gICAgICovXG4gICAgb24oZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMucHVzaCh7XG4gICAgICAgICAgICBoYW5kbGVyOiBkYXRhID0+IGhhbmRsZXIoZGF0YSksXG4gICAgICAgICAgICBrZXk6IGV2ZW50LFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZCBtZXNzYWdlIHRvIGxvY2FsIG9yIG90aGVyIGluc3RhbmNlIG9mIGV4dGVuc2lvblxuICAgICAqIEBwYXJhbSBrZXkgLSBLZXkgb2YgdGhlIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gZGF0YSAtIERhdGEgb2YgdGhlIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gYWxzb1NlbmRUb0RvY3VtZW50IC0gISBTZW5kIG1lc3NhZ2UgdG8gZG9jdW1lbnQuIFRoaXMgbWF5IGxlYWtzIHNlY3JldCEgT25seSBvcGVuIGluIGxvY2FsaG9zdCFcbiAgICAgKi9cbiAgICBzZW5kKGtleSwgZGF0YSwgYWxzb1NlbmRUb0RvY3VtZW50ID0gbG9jYXRpb24uaG9zdG5hbWUgPT09ICdsb2NhbGhvc3QnKSB7XG4gICAgICAgIGlmICh0aGlzLndyaXRlVG9Db25zb2xlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgJWNTZW5kJWMgJWMke2tleS50b1N0cmluZygpfWAsICdiYWNrZ3JvdW5kOiByZ2JhKDAsIDI1NSwgMjU1LCAwLjYpOyBjb2xvcjogYmxhY2s7IHBhZGRpbmc6IDBweCA2cHg7IGJvcmRlci1yYWRpdXM6IDRweDsnLCAnJywgJ3RleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lJywgZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbXNnID0geyBkYXRhLCBrZXksIGluc3RhbmNlS2V5OiB0aGlzLmluc3RhbmNlS2V5IHx8ICcnIH07XG4gICAgICAgIGlmICh0eXBlb2YgYnJvd3NlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmIChicm93c2VyLnJ1bnRpbWUgJiYgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKG1zZykuY2F0Y2gobm9vcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYnJvd3Nlci50YWJzKSB7XG4gICAgICAgICAgICAgICAgLy8gU2VuZCBtZXNzYWdlIHRvIENvbnRlbnQgU2NyaXB0XG4gICAgICAgICAgICAgICAgYnJvd3Nlci50YWJzLnF1ZXJ5KHsgZGlzY2FyZGVkOiBmYWxzZSB9KS50aGVuKHRhYnMgPT4ge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHRhYiBvZiB0YWJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFiLmlkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyb3dzZXIudGFicy5zZW5kTWVzc2FnZSh0YWIuaWQsIG1zZykuY2F0Y2gobm9vcCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYWxzb1NlbmRUb0RvY3VtZW50ICYmIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudCkge1xuICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXdNZXNzYWdlKGtleSwgZGF0YSkpO1xuICAgICAgICB9XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TWVzc2FnZUNlbnRlci5qcy5tYXAiLCIvKipcbiAqIFRoaXMgaXMgYSBsaWdodCBpbXBsZW1lbnRhdGlvbiBvZiBKU09OIFJQQyAyLjBcbiAqXG4gKiBodHRwczovL3d3dy5qc29ucnBjLm9yZy9zcGVjaWZpY2F0aW9uXG4gKlxuICogISBOb3QgaW1wbGVtZW50ZWQ6XG4gKiAtIFNlbmQgTm90aWZpY2F0aW9uIChyZWNlaXZlIE5vdGlmaWNhdGlvbiBpcyBva2F5KVxuICogLSBCYXRjaCBpbnZvY2F0aW9uIChkZWZpbmVkIGluIHRoZSBzZWN0aW9uIDYgb2YgdGhlIHNwZWMpXG4gKi9cbmltcG9ydCB7IE1lc3NhZ2VDZW50ZXIgYXMgSG9sb2Zsb3dzTWVzc2FnZUNlbnRlciB9IGZyb20gJy4vTWVzc2FnZUNlbnRlcic7XG4vKipcbiAqIFNlcmlhbGl6YXRpb24gaW1wbGVtZW50YXRpb24gdGhhdCBkbyBub3RoaW5nXG4gKi9cbmV4cG9ydCBjb25zdCBOb1NlcmlhbGl6YXRpb24gPSB7XG4gICAgYXN5bmMgc2VyaWFsaXphdGlvbihmcm9tKSB7XG4gICAgICAgIHJldHVybiBmcm9tO1xuICAgIH0sXG4gICAgYXN5bmMgZGVzZXJpYWxpemF0aW9uKHNlcmlhbGl6ZWQpIHtcbiAgICAgICAgcmV0dXJuIHNlcmlhbGl6ZWQ7XG4gICAgfSxcbn07XG4vKipcbiAqIFNlcmlhbGl6YXRpb24gaW1wbGVtZW50YXRpb24gYnkgSlNPTi5wYXJzZS9zdHJpbmdpZnlcbiAqXG4gKiBAcGFyYW0gcmVwbGFjZXIgLSBSZXBsYWNlciBvZiBKU09OLnBhcnNlL3N0cmluZ2lmeVxuICovXG5leHBvcnQgY29uc3QgSlNPTlNlcmlhbGl6YXRpb24gPSAocmVwbGFjZXIgPSB1bmRlZmluZWQpID0+ICh7XG4gICAgYXN5bmMgc2VyaWFsaXphdGlvbihmcm9tKSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShmcm9tLCByZXBsYWNlcik7XG4gICAgfSxcbiAgICBhc3luYyBkZXNlcmlhbGl6YXRpb24oc2VyaWFsaXplZCkge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShzZXJpYWxpemVkLCByZXBsYWNlcik7XG4gICAgfSxcbn0pO1xuLyoqXG4gKiBBc3luYyBjYWxsIGJldHdlZW4gZGlmZmVyZW50IGNvbnRleHQuXG4gKlxuICogQHJlbWFya3NcbiAqIEFzeW5jIGNhbGwgaXMgYSBoaWdoIGxldmVsIGFic3RyYWN0aW9uIG9mIE1lc3NhZ2VDZW50ZXIuXG4gKlxuICogIyBTaGFyZWQgY29kZVxuICpcbiAqIC0gSG93IHRvIHN0cmluZ2lmeS9wYXJzZSBwYXJhbWV0ZXJzL3JldHVybnMgc2hvdWxkIGJlIHNoYXJlZCwgZGVmYXVsdHMgdG8gTm9TZXJpYWxpemF0aW9uLlxuICpcbiAqIC0gYGtleWAgc2hvdWxkIGJlIHNoYXJlZC5cbiAqXG4gKiAjIE9uZSBzaWRlXG4gKlxuICogLSBTaG91bGQgcHJvdmlkZSBzb21lIGZ1bmN0aW9ucyB0aGVuIGV4cG9ydCBpdHMgdHlwZSAoZm9yIGV4YW1wbGUsIGBCYWNrZ3JvdW5kQ2FsbHNgKVxuICpcbiAqIC0gYGNvbnN0IGNhbGwgPSBBc3luY0NhbGw8Rm9yZWdyb3VuZENhbGxzPihiYWNrZ3JvdW5kQ2FsbHMpYFxuICpcbiAqIC0gVGhlbiB5b3UgY2FuIGBjYWxsYCBhbnkgbWV0aG9kIG9uIGBGb3JlZ3JvdW5kQ2FsbHNgXG4gKlxuICogIyBPdGhlciBzaWRlXG4gKlxuICogLSBTaG91bGQgcHJvdmlkZSBzb21lIGZ1bmN0aW9ucyB0aGVuIGV4cG9ydCBpdHMgdHlwZSAoZm9yIGV4YW1wbGUsIGBGb3JlZ3JvdW5kQ2FsbHNgKVxuICpcbiAqIC0gYGNvbnN0IGNhbGwgPSBBc3luY0NhbGw8QmFja2dyb3VuZENhbGxzPihmb3JlZ3JvdW5kQ2FsbHMpYFxuICpcbiAqIC0gVGhlbiB5b3UgY2FuIGBjYWxsYCBhbnkgbWV0aG9kIG9uIGBCYWNrZ3JvdW5kQ2FsbHNgXG4gKlxuICogTm90ZTogVHdvIHNpZGVzIGNhbiBpbXBsZW1lbnQgdGhlIHNhbWUgZnVuY3Rpb25cbiAqXG4gKiBAZXhhbXBsZVxuICogRm9yIGV4YW1wbGUsIGhlcmUgaXMgYSBtb25vIHJlcG8uXG4gKlxuICogQ29kZSBmb3IgVUkgcGFydDpcbiAqIGBgYHRzXG4gKiBjb25zdCBVSSA9IHtcbiAqICAgICAgYXN5bmMgZGlhbG9nKHRleHQ6IHN0cmluZykge1xuICogICAgICAgICAgYWxlcnQodGV4dClcbiAqICAgICAgfSxcbiAqIH1cbiAqIGV4cG9ydCB0eXBlIFVJID0gdHlwZW9mIFVJXG4gKiBjb25zdCBjYWxsc0NsaWVudCA9IEFzeW5jQ2FsbDxTZXJ2ZXI+KFVJKVxuICogY2FsbHNDbGllbnQuc2VuZE1haWwoJ2hlbGxvIHdvcmxkJywgJ3doYXQnKVxuICogYGBgXG4gKlxuICogQ29kZSBmb3Igc2VydmVyIHBhcnRcbiAqIGBgYHRzXG4gKiBjb25zdCBTZXJ2ZXIgPSB7XG4gKiAgICAgIGFzeW5jIHNlbmRNYWlsKHRleHQ6IHN0cmluZywgdG86IHN0cmluZykge1xuICogICAgICAgICAgcmV0dXJuIHRydWVcbiAqICAgICAgfVxuICogfVxuICogZXhwb3J0IHR5cGUgU2VydmVyID0gdHlwZW9mIFNlcnZlclxuICogY29uc3QgY2FsbHMgPSBBc3luY0NhbGw8VUk+KFNlcnZlcilcbiAqIGNhbGxzLmRpYWxvZygnaGVsbG8nKVxuICogYGBgXG4gKlxuICogQHBhcmFtIGltcGxlbWVudGF0aW9uIC0gSW1wbGVtZW50YXRpb24gb2YgdGhpcyBzaWRlLlxuICogQHBhcmFtIG9wdGlvbnMgLSBEZWZpbmUgeW91ciBvd24gc2VyaWFsaXplciwgTWVzc2FnZUNlbnRlciBvciBvdGhlciBvcHRpb25zLlxuICpcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEFzeW5jQ2FsbChpbXBsZW1lbnRhdGlvbiwgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgeyB3cml0ZVRvQ29uc29sZSwgc2VyaWFsaXplciwgZG9udFRocm93T25Ob3RJbXBsZW1lbnRlZCwgTWVzc2FnZUNlbnRlciwga2V5LCBzdHJpY3RKU09OUlBDIH0gPSB7XG4gICAgICAgIE1lc3NhZ2VDZW50ZXI6IEhvbG9mbG93c01lc3NhZ2VDZW50ZXIsXG4gICAgICAgIGRvbnRUaHJvd09uTm90SW1wbGVtZW50ZWQ6IHRydWUsXG4gICAgICAgIHNlcmlhbGl6ZXI6IE5vU2VyaWFsaXphdGlvbixcbiAgICAgICAgd3JpdGVUb0NvbnNvbGU6IHRydWUsXG4gICAgICAgIGtleTogJ2RlZmF1bHQnLFxuICAgICAgICBzdHJpY3RKU09OUlBDOiBmYWxzZSxcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICB9O1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBuZXcgTWVzc2FnZUNlbnRlcigpO1xuICAgIGNvbnN0IENBTEwgPSBgJHtrZXl9LWpzb25ycGNgO1xuICAgIGNvbnN0IG1hcCA9IG5ldyBNYXAoKTtcbiAgICBhc3luYyBmdW5jdGlvbiBvblJlcXVlc3QoZGF0YSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZXhlY3V0b3IgPSBpbXBsZW1lbnRhdGlvbltkYXRhLm1ldGhvZF07XG4gICAgICAgICAgICBpZiAoIWV4ZWN1dG9yKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvbnRUaHJvd09uTm90SW1wbGVtZW50ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVjZWl2ZSByZW1vdGUgY2FsbCwgYnV0IG5vdCBpbXBsZW1lbnRlZC4nLCBrZXksIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEVycm9yUmVzcG9uc2UuTWV0aG9kTm90Rm91bmQoZGF0YS5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBhcmdzID0gZGF0YS5wYXJhbXM7XG4gICAgICAgICAgICBjb25zdCBwcm9taXNlID0gZXhlY3V0b3IoLi4uYXJncyk7XG4gICAgICAgICAgICBpZiAod3JpdGVUb0NvbnNvbGUpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCR7a2V5fS4lYyR7ZGF0YS5tZXRob2R9JWMoJHthcmdzLm1hcCgoKSA9PiAnJW8nKS5qb2luKCcsICcpfSVjKVxcbiVvICVjQCR7ZGF0YS5pZH1gLCAnY29sb3I6ICNkMmMwNTcnLCAnJywgLi4uYXJncywgJycsIHByb21pc2UsICdjb2xvcjogZ3JheTsgZm9udC1zdHlsZTogaXRhbGljOycpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdWNjZXNzUmVzcG9uc2UoZGF0YS5pZCwgYXdhaXQgcHJvbWlzZSwgc3RyaWN0SlNPTlJQQyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEVycm9yUmVzcG9uc2UoZGF0YS5pZCwgLTEsIGUubWVzc2FnZSwgZS5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgZnVuY3Rpb24gb25SZXNwb25zZShkYXRhKSB7XG4gICAgICAgIGlmICgnZXJyb3InIGluIGRhdGEgJiYgd3JpdGVUb0NvbnNvbGUpXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGAke2RhdGEuZXJyb3IubWVzc2FnZX0oJHtkYXRhLmVycm9yLmNvZGV9KSAlY0Ake2RhdGEuaWR9XFxuJWMke2RhdGEuZXJyb3IuZGF0YS5zdGFja31gLCAnY29sb3I6IGdyYXknLCAnJyk7XG4gICAgICAgIGlmIChkYXRhLmlkID09PSBudWxsKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBbcmVzb2x2ZSwgcmVqZWN0XSA9IG1hcC5nZXQoZGF0YS5pZCkgfHwgW251bGwsIG51bGxdO1xuICAgICAgICBpZiAoIXJlc29sdmUpXG4gICAgICAgICAgICByZXR1cm47IC8vIGRyb3AgdGhpcyByZXNwb25zZVxuICAgICAgICBtYXAuZGVsZXRlKGRhdGEuaWQpO1xuICAgICAgICBpZiAoJ2Vycm9yJyBpbiBkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoZGF0YS5lcnJvci5tZXNzYWdlKTtcbiAgICAgICAgICAgIGVyci5zdGFjayA9IGRhdGEuZXJyb3IuZGF0YS5zdGFjaztcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzb2x2ZShkYXRhLnJlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbWVzc2FnZS5vbihDQUxMLCBhc3luYyAoXykgPT4ge1xuICAgICAgICBsZXQgZGF0YTtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRhdGEgPSBhd2FpdCBzZXJpYWxpemVyLmRlc2VyaWFsaXphdGlvbihfKTtcbiAgICAgICAgICAgIGlmIChpc0pTT05SUENPYmplY3QoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoJ21ldGhvZCcgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBhd2FpdCBvblJlcXVlc3QoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNlbmQocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoJ2Vycm9yJyBpbiBkYXRhIHx8ICdyZXN1bHQnIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgb25SZXNwb25zZShkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgncmVzdWx0SXNVbmRlZmluZWQnIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEucmVzdWx0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgb25SZXNwb25zZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHNlbmQoRXJyb3JSZXNwb25zZS5JbnZhbGlkUmVxdWVzdChkYXRhLmlkIHx8IG51bGwpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkgJiYgZGF0YS5ldmVyeShpc0pTT05SUENPYmplY3QpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2VuZChFcnJvclJlc3BvbnNlLkludGVybmFsRXJyb3IobnVsbCwgXCI6IEFzeW5jLUNhbGwgaXNuJ3QgaW1wbGVtZW50IHBhdGNoIGpzb25ycGMgeWV0LlwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RyaWN0SlNPTlJQQykge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBzZW5kKEVycm9yUmVzcG9uc2UuSW52YWxpZFJlcXVlc3QoZGF0YS5pZCB8fCBudWxsKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyA/IElnbm9yZSB0aGlzIG1lc3NhZ2UuIFRoZSBtZXNzYWdlIGNoYW5uZWwgbWF5YmUgYWxzbyB1c2VkIHRvIHRyYW5zZmVyIG90aGVyIG1lc3NhZ2UgdG9vLlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlLCBkYXRhLCByZXN1bHQpO1xuICAgICAgICAgICAgc2VuZChFcnJvclJlc3BvbnNlLlBhcnNlRXJyb3IoZS5zdGFjaykpO1xuICAgICAgICB9XG4gICAgICAgIGFzeW5jIGZ1bmN0aW9uIHNlbmQocmVzKSB7XG4gICAgICAgICAgICBpZiAoIXJlcylcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBtZXNzYWdlLnNlbmQoQ0FMTCwgYXdhaXQgc2VyaWFsaXplci5zZXJpYWxpemF0aW9uKHJlcykpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBQcm94eSh7fSwge1xuICAgICAgICBnZXQodGFyZ2V0LCBtZXRob2QsIHJlY2VpdmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gKC4uLnBhcmFtcykgPT4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWV0aG9kICE9PSAnc3RyaW5nJylcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdCgnT25seSBzdHJpbmcgY2FuIGJlIGtleXMnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpZCA9IE1hdGgucmFuZG9tKClcbiAgICAgICAgICAgICAgICAgICAgLnRvU3RyaW5nKDM2KVxuICAgICAgICAgICAgICAgICAgICAuc2xpY2UoMik7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVxID0gbmV3IFJlcXVlc3QoaWQsIG1ldGhvZCwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICBzZXJpYWxpemVyLnNlcmlhbGl6YXRpb24ocmVxKS50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLnNlbmQoQ0FMTCwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIG1hcC5zZXQoaWQsIFtyZXNvbHZlLCByZWplY3RdKTtcbiAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSk7XG59XG5jb25zdCBqc29ucnBjID0gJzIuMCc7XG5jbGFzcyBSZXF1ZXN0IHtcbiAgICBjb25zdHJ1Y3RvcihpZCwgbWV0aG9kLCBwYXJhbXMpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLm1ldGhvZCA9IG1ldGhvZDtcbiAgICAgICAgdGhpcy5wYXJhbXMgPSBwYXJhbXM7XG4gICAgICAgIHRoaXMuanNvbnJwYyA9ICcyLjAnO1xuICAgICAgICByZXR1cm4geyBpZCwgbWV0aG9kLCBwYXJhbXMsIGpzb25ycGMgfTtcbiAgICB9XG59XG5jbGFzcyBTdWNjZXNzUmVzcG9uc2Uge1xuICAgIGNvbnN0cnVjdG9yKGlkLCByZXN1bHQsIHN0cmljdE1vZGUpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLnJlc3VsdCA9IHJlc3VsdDtcbiAgICAgICAgdGhpcy5qc29ucnBjID0gJzIuMCc7XG4gICAgICAgIGNvbnN0IG9iaiA9IHsgaWQsIGpzb25ycGMsIHJlc3VsdDogcmVzdWx0IHx8IG51bGwgfTtcbiAgICAgICAgaWYgKCFzdHJpY3RNb2RlICYmIHJlc3VsdCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgb2JqLnJlc3VsdElzVW5kZWZpbmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG59XG5jbGFzcyBFcnJvclJlc3BvbnNlIHtcbiAgICBjb25zdHJ1Y3RvcihpZCwgY29kZSwgbWVzc2FnZSwgc3RhY2spIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLmpzb25ycGMgPSAnMi4wJztcbiAgICAgICAgY29uc3QgZXJyb3IgPSAodGhpcy5lcnJvciA9IHsgY29kZSwgbWVzc2FnZSwgZGF0YTogeyBzdGFjayB9IH0pO1xuICAgICAgICByZXR1cm4geyBlcnJvciwgaWQsIGpzb25ycGMgfTtcbiAgICB9XG59XG4vLyBQcmUgZGVmaW5lZCBlcnJvciBpbiBzZWN0aW9uIDUuMVxuRXJyb3JSZXNwb25zZS5QYXJzZUVycm9yID0gKHN0YWNrID0gJycpID0+IG5ldyBFcnJvclJlc3BvbnNlKG51bGwsIC0zMjcwMCwgJ1BhcnNlIGVycm9yJywgc3RhY2spO1xuRXJyb3JSZXNwb25zZS5JbnZhbGlkUmVxdWVzdCA9IChpZCkgPT4gbmV3IEVycm9yUmVzcG9uc2UoaWQsIC0zMjYwMCwgJ0ludmFsaWQgUmVxdWVzdCcsICcnKTtcbkVycm9yUmVzcG9uc2UuTWV0aG9kTm90Rm91bmQgPSAoaWQpID0+IG5ldyBFcnJvclJlc3BvbnNlKGlkLCAtMzI2MDEsICdNZXRob2Qgbm90IGZvdW5kJywgJycpO1xuRXJyb3JSZXNwb25zZS5JbnZhbGlkUGFyYW1zID0gKGlkKSA9PiBuZXcgRXJyb3JSZXNwb25zZShpZCwgLTMyNjAyLCAnSW52YWxpZCBwYXJhbXMnLCAnJyk7XG5FcnJvclJlc3BvbnNlLkludGVybmFsRXJyb3IgPSAoaWQsIG1lc3NhZ2UgPSAnJykgPT4gbmV3IEVycm9yUmVzcG9uc2UoaWQsIC0zMjYwMywgJ0ludGVybmFsIGVycm9yJyArIG1lc3NhZ2UsICcnKTtcbmZ1bmN0aW9uIGlzSlNPTlJQQ09iamVjdChkYXRhKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBkYXRhID09PSAnb2JqZWN0JyAmJiBkYXRhICE9PSBudWxsICYmICdqc29ucnBjJyBpbiBkYXRhICYmIGRhdGEuanNvbnJwYyA9PT0gJzIuMCc7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Bc3luYy1DYWxsLmpzLm1hcCIsImltcG9ydCB7IEhvc3QgfSBmcm9tICcuLi9SUEMnXG50eXBlIFdlYkV4dGVuc2lvbklEID0gc3RyaW5nXG50eXBlIE1lc3NhZ2VJRCA9IHN0cmluZ1xudHlwZSB3ZWJOYXZpZ2F0aW9uT25Db21taXR0ZWRBcmdzID0gUGFyYW1ldGVyczxIb3N0Wydicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnXT5cbnR5cGUgb25NZXNzYWdlQXJncyA9IFBhcmFtZXRlcnM8SG9zdFsnb25NZXNzYWdlJ10+XG50eXBlIFBvb2xLZXlzID0gJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCcgfCAnYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZSdcbi8qKlxuICogVXNlZCBmb3Iga2VlcCByZWZlcmVuY2UgdG8gYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZVxuICovXG5leHBvcnQgY29uc3QgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlciA9IG5ldyBNYXA8TWVzc2FnZUlELCBbKHZhbDogYW55KSA9PiBhbnksICh2YWw6IGFueSkgPT4gYW55XT4oKVxuLyoqXG4gKiBUbyBzdG9yZSBsaXN0ZW5lciBmb3IgSG9zdCBkaXNwYXRjaGVkIGV2ZW50cy5cbiAqL1xuZXhwb3J0IGNvbnN0IEV2ZW50UG9vbHM6IFJlY29yZDxQb29sS2V5cywgTWFwPFdlYkV4dGVuc2lvbklELCBTZXQ8KC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+Pj4gPSB7XG4gICAgJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCc6IG5ldyBNYXAoKSxcbiAgICAnYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZSc6IG5ldyBNYXAoKSxcbn1cbi8qKlxuICogRGlzcGF0Y2ggYSBub3JtYWwgZXZlbnQgKHRoYXQgbm90IGhhdmUgYSBcInJlc3BvbnNlXCIpLlxuICogTGlrZSBicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRpc3BhdGNoTm9ybWFsRXZlbnQoZXZlbnQ6IFBvb2xLZXlzLCB0b0V4dGVuc2lvbklEOiBzdHJpbmcgfCBzdHJpbmdbXSB8ICcqJywgLi4uYXJnczogYW55W10pIHtcbiAgICBpZiAoIUV2ZW50UG9vbHNbZXZlbnRdKSByZXR1cm5cbiAgICBmb3IgKGNvbnN0IFtleHRlbnNpb25JRCwgZm5zXSBvZiBFdmVudFBvb2xzW2V2ZW50XS5lbnRyaWVzKCkpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodG9FeHRlbnNpb25JRCkgJiYgdG9FeHRlbnNpb25JRC5pbmRleE9mKGV4dGVuc2lvbklEKSA9PT0gLTEpIGNvbnRpbnVlXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0b0V4dGVuc2lvbklEKSAmJiB0b0V4dGVuc2lvbklEICE9PSBleHRlbnNpb25JRCAmJiB0b0V4dGVuc2lvbklEICE9PSAnKicpIGNvbnRpbnVlXG4gICAgICAgIGZvciAoY29uc3QgZiBvZiBmbnMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZiguLi5hcmdzKVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbi8qKlxuICogQ3JlYXRlIGEgYEV2ZW50T2JqZWN0PExpc3RlbmVyVHlwZT5gIG9iamVjdC5cbiAqXG4gKiBDYW4gYmUgc2V0IG9uIGJyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCBldGMuLi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUV2ZW50TGlzdGVuZXIoZXh0ZW5zaW9uSUQ6IHN0cmluZywgZXZlbnQ6IFBvb2xLZXlzKSB7XG4gICAgaWYgKCFFdmVudFBvb2xzW2V2ZW50XS5oYXMoZXh0ZW5zaW9uSUQpKSB7XG4gICAgICAgIEV2ZW50UG9vbHNbZXZlbnRdLnNldChleHRlbnNpb25JRCwgbmV3IFNldCgpKVxuICAgIH1cbiAgICBjb25zdCBwb29sID0gRXZlbnRQb29sc1tldmVudF0uZ2V0KGV4dGVuc2lvbklEKSFcbiAgICBjb25zdCBoYW5kbGVyOiBFdmVudE9iamVjdDwoLi4uYXJnczogYW55W10pID0+IGFueT4gPSB7XG4gICAgICAgIGFkZExpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdMaXN0ZW5lciBtdXN0IGJlIGZ1bmN0aW9uJylcbiAgICAgICAgICAgIHBvb2wuYWRkKGNhbGxiYWNrKVxuICAgICAgICB9LFxuICAgICAgICByZW1vdmVMaXN0ZW5lcihjYWxsYmFjaykge1xuICAgICAgICAgICAgcG9vbC5kZWxldGUoY2FsbGJhY2spXG4gICAgICAgIH0sXG4gICAgICAgIGhhc0xpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcG9vbC5oYXMobGlzdGVuZXIpXG4gICAgICAgIH0sXG4gICAgfVxuICAgIHJldHVybiBoYW5kbGVyXG59XG5cbmludGVyZmFjZSBFdmVudE9iamVjdDxUIGV4dGVuZHMgKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnk+IHtcbiAgICBhZGRMaXN0ZW5lcjogKGNhbGxiYWNrOiBUKSA9PiB2b2lkXG4gICAgcmVtb3ZlTGlzdGVuZXI6IChsaXN0ZW5lcjogVCkgPT4gdm9pZFxuICAgIGhhc0xpc3RlbmVyOiAobGlzdGVuZXI6IFQpID0+IGJvb2xlYW5cbn1cbiIsImV4cG9ydCBmdW5jdGlvbiBkZWVwQ2xvbmU8VD4ob2JqOiBUKTogVCB7XG4gICAgLy8gdG9kbzogY2hhbmdlIGFub3RoZXIgaW1wbCBwbHouXG4gICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkob2JqKSlcbn1cbiIsImltcG9ydCB7IEhvc3QgfSBmcm9tICcuLi9SUEMnXG5cbmltcG9ydCB7IFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIsIEV2ZW50UG9vbHMgfSBmcm9tICcuLi91dGlscy9Mb2NhbE1lc3NhZ2VzJ1xuaW1wb3J0IHsgZGVlcENsb25lIH0gZnJvbSAnLi4vdXRpbHMvZGVlcENsb25lJ1xuLyoqXG4gKiBDcmVhdGUgYnJvd3Nlci5ydW50aW1lLnNlbmRNZXNzYWdlKCkgZnVuY3Rpb25cbiAqIEBwYXJhbSBleHRlbnNpb25JRFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IHRvRXh0ZW5zaW9uSUQ6IHN0cmluZywgbWVzc2FnZTogdW5rbm93biwgb3B0aW9uczogdW5rbm93blxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9IGV4dGVuc2lvbklEXG4gICAgICAgICAgICBtZXNzYWdlID0gYXJndW1lbnRzWzBdXG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9IGFyZ3VtZW50c1swXVxuICAgICAgICAgICAgbWVzc2FnZSA9IGFyZ3VtZW50c1sxXVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9FeHRlbnNpb25JRCA9ICcnXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2VJRCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoKVxuICAgICAgICAgICAgSG9zdC5zZW5kTWVzc2FnZShleHRlbnNpb25JRCwgdG9FeHRlbnNpb25JRCwgbnVsbCwgbWVzc2FnZUlELCB7XG4gICAgICAgICAgICAgICAgZGF0YTogbWVzc2FnZSxcbiAgICAgICAgICAgICAgICByZXNwb25zZTogZmFsc2UsXG4gICAgICAgICAgICB9KS5jYXRjaChlID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSlcbiAgICAgICAgICAgICAgICBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmRlbGV0ZShtZXNzYWdlSUQpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5zZXQobWVzc2FnZUlELCBbcmVzb2x2ZSwgcmVqZWN0XSlcbiAgICAgICAgfSlcbiAgICB9XG59XG4vKipcbiAqIE1lc3NhZ2UgaGFuZGxlciBvZiBub3JtYWwgbWVzc2FnZVxuICovXG5leHBvcnQgZnVuY3Rpb24gb25Ob3JtYWxNZXNzYWdlKFxuICAgIG1lc3NhZ2U6IGFueSxcbiAgICBzZW5kZXI6IGJyb3dzZXIucnVudGltZS5NZXNzYWdlU2VuZGVyLFxuICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgIG1lc3NhZ2VJRDogc3RyaW5nLFxuKSB7XG4gICAgY29uc3QgZm5zOiBTZXQ8YnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZUV2ZW50PiB8IHVuZGVmaW5lZCA9IEV2ZW50UG9vbHNbJ2Jyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UnXS5nZXQoXG4gICAgICAgIHRvRXh0ZW5zaW9uSUQsXG4gICAgKVxuICAgIGlmICghZm5zKSByZXR1cm5cbiAgICBsZXQgcmVzcG9uc2VTZW5kID0gZmFsc2VcbiAgICBmb3IgKGNvbnN0IGZuIG9mIGZucykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gPyBkaXNwYXRjaCBtZXNzYWdlXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBmbihkZWVwQ2xvbmUobWVzc2FnZSksIGRlZXBDbG9uZShzZW5kZXIpLCBzZW5kUmVzcG9uc2VEZXByZWNhdGVkKVxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgLy8gPyBkbyBub3RoaW5nXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgICAgIC8vICEgZGVwcmVjYXRlZCBwYXRoICFcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHJlc3VsdC50aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgLy8gPyByZXNwb25zZSB0aGUgYW5zd2VyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnRoZW4oKGRhdGE6IHVua25vd24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgPT09IHVuZGVmaW5lZCB8fCByZXNwb25zZVNlbmQpIHJldHVyblxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZVNlbmQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIEhvc3Quc2VuZE1lc3NhZ2UodG9FeHRlbnNpb25JRCwgZXh0ZW5zaW9uSUQsIHNlbmRlci50YWIhLmlkISwgbWVzc2FnZUlELCB7IGRhdGEsIHJlc3BvbnNlOiB0cnVlIH0pXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbE1lc3NhZ2Uge1xuICAgIGRhdGE6IGFueVxuICAgIGVycm9yPzogeyBtZXNzYWdlOiBzdHJpbmc7IHN0YWNrOiBzdHJpbmcgfVxuICAgIHJlc3BvbnNlOiBib29sZWFuXG59XG5cbmZ1bmN0aW9uIHNlbmRSZXNwb25zZURlcHJlY2F0ZWQoKTogYW55IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdSZXR1cm5pbmcgYSBQcm9taXNlIGlzIHRoZSBwcmVmZXJyZWQgd2F5JyArXG4gICAgICAgICAgICAnIHRvIHNlbmQgYSByZXBseSBmcm9tIGFuIG9uTWVzc2FnZS9vbk1lc3NhZ2VFeHRlcm5hbCBsaXN0ZW5lciwgJyArXG4gICAgICAgICAgICAnYXMgdGhlIHNlbmRSZXNwb25zZSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgc3BlY3MgJyArXG4gICAgICAgICAgICAnKFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL01vemlsbGEvQWRkLW9ucy9XZWJFeHRlbnNpb25zL0FQSS9ydW50aW1lL29uTWVzc2FnZSknLFxuICAgIClcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9ub2RlX21vZHVsZXMvd2ViLWV4dC10eXBlcy9nbG9iYWwvaW5kZXguZC50c1wiIC8+XG5pbXBvcnQgeyBBc3luY0NhbGwgfSBmcm9tICdAaG9sb2Zsb3dzL2tpdC9lcydcbmltcG9ydCB7IGRpc3BhdGNoTm9ybWFsRXZlbnQsIFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIgfSBmcm9tICcuL3V0aWxzL0xvY2FsTWVzc2FnZXMnXG5pbXBvcnQgeyBJbnRlcm5hbE1lc3NhZ2UsIG9uTm9ybWFsTWVzc2FnZSB9IGZyb20gJy4vc2hpbXMvYnJvd3Nlci5tZXNzYWdlJ1xuXG5leHBvcnQgaW50ZXJmYWNlIEhvc3Qge1xuICAgIC8qKlxuICAgICAqIEZvcm1hdCBsaWtlIFwiaG9sb2Zsb3dzLWJsb2I6Ly8kcHJlZml4LyRVVUlEXCJcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gVVVJRFxuICAgICAqIEBwYXJhbSBibG9iIGJhc2U2NCBlbmNvZGVkIGJpbmFyeVxuICAgICAqIEBwYXJhbSB0eXBlIE1JTkUvdHlwZSBcInRleHQvaHRtbFwiXG4gICAgICovXG4gICAgJ1VSTC5jcmVhdGVPYmplY3RVUkwnKGV4dGVuc2lvbklEOiBzdHJpbmcsIHV1aWQ6IHN0cmluZywgYmxvYjogc3RyaW5nLCBtaW5lVHlwZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPlxuICAgICdVUkwucmV2b2tlT2JqZWN0VVJMJyhleHRlbnNpb25JRDogc3RyaW5nLCB1dWlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogT3BlbiBhIGRpYWxvZywgc2hhcmUgdGhlIGZpbGUgdG8gc29tZXdoZXJlIGVsc2UuXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKi9cbiAgICAnYnJvd3Nlci5kb3dubG9hZHMuZG93bmxvYWQnKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBmaWxlbmFtZTogc3RyaW5nXG4gICAgICAgICAgICAvKiogQ291bGQgYmUgYSBzdHJpbmcgcmV0dXJuIGJ5IFVSTC5jcmVhdGVPYmplY3RVUkwoKSAqL1xuICAgICAgICAgICAgdXJsOiBzdHJpbmdcbiAgICAgICAgfSxcbiAgICApOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogQGhvc3RcbiAgICAgKiBAcGFyYW0gdGFiIFRoZSBjb21taXR0ZWQgdGFiIGluZm9cbiAgICAgKi9cbiAgICAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJyh0YWI6IHsgdGFiSWQ6IG51bWJlcjsgdXJsOiBzdHJpbmcgfSk6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSB0YWJJRCBUaGUgdGFiIG9wZW5lZFxuICAgICAqIEBwYXJhbSBkZXRhaWxzXG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0JyhcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdGFiSUQ6IG51bWJlcixcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgICAgY29kZT86IHN0cmluZ1xuICAgICAgICAgICAgZmlsZT86IHN0cmluZ1xuICAgICAgICAgICAgcnVuQXQ/OiAnZG9jdW1lbnRfc3RhcnQnIHwgJ2RvY3VtZW50X2VuZCcgfCAnZG9jdW1lbnRfaWRsZSdcbiAgICAgICAgfSxcbiAgICApOiBQcm9taXNlPHZvaWQ+XG4gICAgLy8gISBTdG9yYWdlXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBpbnRlcm5hbCBzdG9yYWdlIGZvciBgZXh0ZW5zaW9uSURgXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIGtleVxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiA+IFN0b3JhZ2U6IGB7IGE6IHsgdmFsdWU6IDIgfSwgYjogeyBuYW1lOiBcInhcIiB9LCBjOiAxIH1gXG4gICAgICpcbiAgICAgKiBnZXQoaWQsICdiJylcbiAgICAgKiA+IFJldHVybiBge25hbWU6IFwieFwifWBcbiAgICAgKlxuICAgICAqIGdldChpZCwgbnVsbClcbiAgICAgKiA+IFJldHVybjogYHsgYTogeyB2YWx1ZTogMiB9LCBiOiB7IG5hbWU6IFwieFwiIH0sIGM6IDEgfWBcbiAgICAgKlxuICAgICAqIGdldChpZCwgW1wiYVwiLCBcImJcIl0pXG4gICAgICogPiBSZXR1cm46IGB7IGE6IHsgdmFsdWU6IDIgfSwgYjogeyBuYW1lOiBcInhcIiB9IH1gXG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXQnKGV4dGVuc2lvbklEOiBzdHJpbmcsIGtleTogc3RyaW5nIHwgc3RyaW5nW10gfCBudWxsKTogUHJvbWlzZTxvYmplY3Q+XG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gb2JqZWN0XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqID4gU3RvcmFnZTogYHt9YFxuICAgICAqIHNldChpZCwgeyBhOiB7IHZhbHVlOiAxIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSB9KVxuICAgICAqID4gU3RvcmFnZTogYHsgYTogeyB2YWx1ZTogMSB9LCBiOiB7IG5hbWU6IFwieFwiIH0gfWBcbiAgICAgKiBzZXQoaWQsIHsgYTogeyB2YWx1ZTogMiB9IH0pXG4gICAgICogPiBTdG9yYWdlOiBgeyBhOiB7IHZhbHVlOiAyIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSB9YFxuICAgICAqL1xuICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0JyhleHRlbnNpb25JRDogc3RyaW5nLCBvYmplY3Q6IG9iamVjdCk6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKi9cbiAgICAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnJlbW92ZScoZXh0ZW5zaW9uSUQ6IHN0cmluZywga2V5OiBzdHJpbmcgfCBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBEZWxldGUgdGhlIGludGVybmFsIHN0b3JhZ2VcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKi9cbiAgICAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmNsZWFyJyhleHRlbnNpb25JRDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgYnl0ZXMgb2YgdGhlIGRhdGFcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXRCeXRlc0luVXNlJyhleHRlbnNpb25JRDogc3RyaW5nLCBrZXk6IG51bGwgfCBzdHJpbmcgfCBzdHJpbmdbXSk6IFByb21pc2U8bnVtYmVyPlxuICAgIC8vICEgdGFic1xuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKi9cbiAgICAnYnJvd3Nlci50YWJzLmNyZWF0ZScoZXh0ZW5zaW9uSUQ6IHN0cmluZywgb3B0aW9uczogeyBhY3RpdmU/OiBib29sZWFuOyB1cmw/OiBzdHJpbmcgfSk6IFByb21pc2U8YnJvd3Nlci50YWJzLlRhYj5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMucmVtb3ZlJyhleHRlbnNpb25JRDogc3RyaW5nLCB0YWJJZDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFF1ZXJ5IG9wZW5lZCB0YWJzXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uc1xuICAgICAqL1xuICAgICdicm93c2VyLnRhYnMucXVlcnknKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICBxdWVyeUluZm86IFBhcmFtZXRlcnM8dHlwZW9mIGJyb3dzZXIudGFicy5xdWVyeT5bMF0sXG4gICAgKTogUHJvbWlzZTxicm93c2VyLnRhYnMuVGFiW10+XG4gICAgLyoqXG4gICAgICogVXNlZCB0byBpbXBsZW1lbnQgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZSBhbmQgYnJvd3Nlci50YWJzLm9uTWVzc2FnZVxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRCBXaG8gc2VuZCB0aGlzIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gdG9FeHRlbnNpb25JRCBXaG8gd2lsbCByZWNlaXZlIHRoaXMgbWVzc2FnZVxuICAgICAqIEBwYXJhbSB0YWJJZCBTZW5kIHRoaXMgbWVzc2FnZSB0byB0YWIgaWRcbiAgICAgKiBAcGFyYW0gbWVzc2FnZUlEIEEgcmFuZG9tIGlkIGdlbmVyYXRlZCBieSBjbGllbnRcbiAgICAgKiBAcGFyYW0gbWVzc2FnZSBtZXNzYWdlIG9iamVjdFxuICAgICAqL1xuICAgICdzZW5kTWVzc2FnZScoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdGFiSWQ6IG51bWJlciB8IG51bGwsXG4gICAgICAgIG1lc3NhZ2VJRDogc3RyaW5nLFxuICAgICAgICBtZXNzYWdlOiBJbnRlcm5hbE1lc3NhZ2UsXG4gICAgKTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIEBob3N0XG4gICAgICogVXNlZCB0byBpbXBsZW1lbnQgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZSBhbmQgYnJvd3Nlci50YWJzLm9uTWVzc2FnZVxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRCBXaG8gc2VuZCB0aGlzIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gdG9FeHRlbnNpb25JRCBXaG8gd2lsbCByZWNlaXZlIHRoaXMgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBtZXNzYWdlSUQgQSByYW5kb20gaWQgY3JlYXRlZCBieSB0aGUgc2VuZGVyLiBVc2VkIHRvIGlkZW50aWZ5IGlmIHRoZSBtZXNzYWdlIGlzIGEgcmVzcG9uc2UuXG4gICAgICogQHBhcmFtIG1lc3NhZ2UgU2VuZCBieSBhbm90aGVyIGNsaWVudFxuICAgICAqIEBwYXJhbSBzZW5kZXIgSW5mbyBvZiB0aGUgc2VuZGVyXG4gICAgICovXG4gICAgJ29uTWVzc2FnZScoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZUlEOiBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgc2VuZGVyOiBicm93c2VyLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcixcbiAgICApOiBQcm9taXNlPHZvaWQ+XG59XG5cbmNvbnN0IGtleSA9ICdob2xvZmxvd3Nqc29ucnBjJ1xuY29uc3QgaXNEZWJ1ZyA9IGxvY2F0aW9uLmhyZWYgPT09ICdodHRwOi8vbG9jYWxob3N0OjUwMDAvJ1xuY2xhc3MgaU9TV2Via2l0Q2hhbm5lbCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoa2V5LCBlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9IChlIGFzIEN1c3RvbUV2ZW50PGFueT4pLmRldGFpbFxuICAgICAgICAgICAgZm9yIChjb25zdCBmIG9mIHRoaXMubGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBmKGRldGFpbClcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgIHByaXZhdGUgbGlzdGVuZXI6IEFycmF5PChkYXRhOiB1bmtub3duKSA9PiB2b2lkPiA9IFtdXG4gICAgb24oXzogc3RyaW5nLCBjYjogKGRhdGE6IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnB1c2goY2IpXG4gICAgfVxuICAgIHNlbmQoXzogc3RyaW5nLCBkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgaWYgKGlzRGVidWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZW5kJywgZGF0YSlcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24od2luZG93LCB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2U6IChyZXNwb25zZTogYW55KSA9PlxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEN1c3RvbUV2ZW50PGFueT4oa2V5LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb25ycGM6ICcyLjAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogZGF0YS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiByZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIGlmICh3aW5kb3cud2Via2l0ICYmIHdpbmRvdy53ZWJraXQubWVzc2FnZUhhbmRsZXJzICYmIHdpbmRvdy53ZWJraXQubWVzc2FnZUhhbmRsZXJzW2tleV0pXG4gICAgICAgICAgICB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1trZXldLnBvc3RNZXNzYWdlKGRhdGEpXG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IEhvc3QgPSBBc3luY0NhbGw8SG9zdD4oXG4gICAge1xuICAgICAgICAvLyB0b2RvOiBjaGVjayBkaXNwYXRjaCB0YXJnZXQncyBtYW5pZmVzdFxuICAgICAgICAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJzogZGlzcGF0Y2hOb3JtYWxFdmVudC5iaW5kKG51bGwsICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnLCAnKicpLFxuICAgICAgICBhc3luYyBvbk1lc3NhZ2UoXG4gICAgICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICAgICAgdG9FeHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICAgICAgbWVzc2FnZUlEOiBzdHJpbmcsXG4gICAgICAgICAgICBtZXNzYWdlOiBJbnRlcm5hbE1lc3NhZ2UsXG4gICAgICAgICAgICBzZW5kZXI6IGJyb3dzZXIucnVudGltZS5NZXNzYWdlU2VuZGVyLFxuICAgICAgICApIHtcbiAgICAgICAgICAgIC8vID8gdGhpcyBpcyBhIHJlc3BvbnNlIHRvIHRoZSBtZXNzYWdlXG4gICAgICAgICAgICBpZiAoVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5oYXMobWVzc2FnZUlEKSAmJiBtZXNzYWdlLnJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW3Jlc29sdmUsIHJlamVjdF0gPSBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmdldChtZXNzYWdlSUQpIVxuICAgICAgICAgICAgICAgIHJlc29sdmUobWVzc2FnZS5kYXRhKVxuICAgICAgICAgICAgICAgIFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIuZGVsZXRlKG1lc3NhZ2VJRClcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5yZXNwb25zZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBvbk5vcm1hbE1lc3NhZ2UobWVzc2FnZS5kYXRhLCBzZW5kZXIsIHRvRXh0ZW5zaW9uSUQsIGV4dGVuc2lvbklELCBtZXNzYWdlSUQpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vID8gZHJvcCB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgICBkb250VGhyb3dPbk5vdEltcGxlbWVudGVkOiBmYWxzZSxcbiAgICAgICAga2V5OiAnJyxcbiAgICAgICAgc3RyaWN0SlNPTlJQQzogdHJ1ZSxcbiAgICAgICAgTWVzc2FnZUNlbnRlcjogaU9TV2Via2l0Q2hhbm5lbCxcbiAgICB9LFxuKVxuIiwiaW1wb3J0IHsgSG9zdCB9IGZyb20gJy4uL1JQQydcbmltcG9ydCB7IGNyZWF0ZUV2ZW50TGlzdGVuZXIgfSBmcm9tICcuLi91dGlscy9Mb2NhbE1lc3NhZ2VzJ1xuaW1wb3J0IHsgY3JlYXRlU2VuZE1lc3NhZ2UgfSBmcm9tICcuL2Jyb3dzZXIubWVzc2FnZSdcbmltcG9ydCB7IE1hbmlmZXN0IH0gZnJvbSAnLi4vRXh0ZW5zaW9ucydcbi8qKlxuICogQ3JlYXRlIGEgbmV3IGBicm93c2VyYCBvYmplY3QuXG4gKiBAcGFyYW0gZXh0ZW5zaW9uSUQgLSBFeHRlbnNpb24gSURcbiAqIEBwYXJhbSBtYW5pZmVzdCAtIE1hbmlmZXN0IG9mIHRoZSBleHRlbnNpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEJyb3dzZXJGYWN0b3J5KGV4dGVuc2lvbklEOiBzdHJpbmcsIG1hbmlmZXN0OiBNYW5pZmVzdCk6IGJyb3dzZXIge1xuICAgIGNvbnN0IGltcGxlbWVudGF0aW9uOiBQYXJ0aWFsPGJyb3dzZXI+ID0ge1xuICAgICAgICBkb3dubG9hZHM6IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIuZG93bmxvYWRzPih7XG4gICAgICAgICAgICBkb3dubG9hZDogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkJykoe1xuICAgICAgICAgICAgICAgIHBhcmFtKG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyB1cmwsIGZpbGVuYW1lIH0gPSBvcHRpb25zXG4gICAgICAgICAgICAgICAgICAgIFBhcnRpYWxJbXBsZW1lbnRlZChvcHRpb25zLCAnZmlsZW5hbWUnLCAndXJsJylcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJnMSA9IHsgdXJsLCBmaWxlbmFtZTogZmlsZW5hbWUgfHwgJycgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2FyZzFdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXR1cm5zKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfSksXG4gICAgICAgIHJ1bnRpbWU6IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIucnVudGltZT4oe1xuICAgICAgICAgICAgZ2V0VVJMKHBhdGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGhvbG9mbG93cy1leHRlbnNpb246Ly8ke2V4dGVuc2lvbklEfS8ke3BhdGh9YFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldE1hbmlmZXN0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0KSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvbk1lc3NhZ2U6IGNyZWF0ZUV2ZW50TGlzdGVuZXIoZXh0ZW5zaW9uSUQsICdicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJyksXG4gICAgICAgICAgICBzZW5kTWVzc2FnZTogY3JlYXRlU2VuZE1lc3NhZ2UoZXh0ZW5zaW9uSUQpLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFiczogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci50YWJzPih7XG4gICAgICAgICAgICBhc3luYyBleGVjdXRlU2NyaXB0KHRhYklELCBkZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgUGFydGlhbEltcGxlbWVudGVkKGRldGFpbHMsICdjb2RlJywgJ2ZpbGUnLCAncnVuQXQnKVxuICAgICAgICAgICAgICAgIGF3YWl0IEhvc3RbJ2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0J10oZXh0ZW5zaW9uSUQsIHRhYklEID09PSB1bmRlZmluZWQgPyAtMSA6IHRhYklELCBkZXRhaWxzKVxuICAgICAgICAgICAgICAgIHJldHVybiBbXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZTogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIudGFicy5jcmVhdGUnKSgpLFxuICAgICAgICAgICAgYXN5bmMgcmVtb3ZlKHRhYklEKSB7XG4gICAgICAgICAgICAgICAgbGV0IHQ6IG51bWJlcltdXG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRhYklEKSkgdCA9IFt0YWJJRF1cbiAgICAgICAgICAgICAgICBlbHNlIHQgPSB0YWJJRFxuICAgICAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHQubWFwKHggPT4gSG9zdFsnYnJvd3Nlci50YWJzLnJlbW92ZSddKGV4dGVuc2lvbklELCB4KSkpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcXVlcnk6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnRhYnMucXVlcnknKSgpLFxuICAgICAgICB9KSxcbiAgICAgICAgc3RvcmFnZToge1xuICAgICAgICAgICAgbG9jYWw6IEltcGxlbWVudHM8dHlwZW9mIGJyb3dzZXIuc3RvcmFnZS5sb2NhbD4oe1xuICAgICAgICAgICAgICAgIGNsZWFyOiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmNsZWFyJykoKSxcbiAgICAgICAgICAgICAgICByZW1vdmU6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnN0b3JhZ2UubG9jYWwucmVtb3ZlJykoKSxcbiAgICAgICAgICAgICAgICBzZXQ6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnN0b3JhZ2UubG9jYWwuc2V0JykoKSxcbiAgICAgICAgICAgICAgICBnZXQ6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0Jykoe1xuICAgICAgICAgICAgICAgICAgICAvKiogSG9zdCBub3QgYWNjZXB0aW5nIHsgYTogMSB9IGFzIGtleXMgKi9cbiAgICAgICAgICAgICAgICAgICAgcGFyYW0oa2V5cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5cykpIHJldHVybiBba2V5cyBhcyBzdHJpbmdbXV1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Yga2V5cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5cyA9PT0gbnVsbCkgcmV0dXJuIFtudWxsXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbT2JqZWN0LmtleXMoa2V5cyldXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW251bGxdXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJldHVybnMocnRuLCBba2V5XSk6IG9iamVjdCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShrZXkpKSByZXR1cm4gcnRuXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyAmJiBrZXkgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyAuLi5rZXksIC4uLnJ0biB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnRuXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBXZSdyZSBpbXBsZW1lbnRpbmcgbm9uLXN0YW5kYXJkIEFQSSBpbiBXZWJFeHRlbnNpb25cbiAgICAgICAgICAgICAgICBnZXRCeXRlc0luVXNlOiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldEJ5dGVzSW5Vc2UnKSgpLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBzeW5jOiBOb3RJbXBsZW1lbnRlZFByb3h5KCksXG4gICAgICAgICAgICBvbkNoYW5nZWQ6IE5vdEltcGxlbWVudGVkUHJveHkoKSxcbiAgICAgICAgfSxcbiAgICAgICAgd2ViTmF2aWdhdGlvbjogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci53ZWJOYXZpZ2F0aW9uPih7XG4gICAgICAgICAgICBvbkNvbW1pdHRlZDogY3JlYXRlRXZlbnRMaXN0ZW5lcihleHRlbnNpb25JRCwgJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCcpLFxuICAgICAgICB9KSxcbiAgICAgICAgZXh0ZW5zaW9uOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLmV4dGVuc2lvbj4oe1xuICAgICAgICAgICAgZ2V0QmFja2dyb3VuZFBhZ2UoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm94eShcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IG5ldyBVUkwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYGhvbG9mbG93cy1leHRlbnNpb246Ly8ke2V4dGVuc2lvbklEfS9fZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZS5odG1sYCxcbiAgICAgICAgICAgICAgICAgICAgICAgICkgYXMgUGFydGlhbDxMb2NhdGlvbj4sXG4gICAgICAgICAgICAgICAgICAgIH0gYXMgUGFydGlhbDxXaW5kb3c+LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZXQoXzogYW55LCBrZXk6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfW2tleV0pIHJldHVybiBfW2tleV1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdOb3Qgc3VwcG9ydGVkJylcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKSBhcyBXaW5kb3dcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgIH1cbiAgICByZXR1cm4gTm90SW1wbGVtZW50ZWRQcm94eTxicm93c2VyPihpbXBsZW1lbnRhdGlvbiwgZmFsc2UpXG59XG50eXBlIGJyb3dzZXIgPSB0eXBlb2YgYnJvd3NlclxuXG5mdW5jdGlvbiBJbXBsZW1lbnRzPFQ+KGltcGxlbWVudGF0aW9uOiBUKSB7XG4gICAgcmV0dXJuIGltcGxlbWVudGF0aW9uXG59XG5mdW5jdGlvbiBOb3RJbXBsZW1lbnRlZFByb3h5PFQgPSBhbnk+KGltcGxlbWVudGVkOiBQYXJ0aWFsPFQ+ID0ge30sIGZpbmFsID0gdHJ1ZSk6IFQge1xuICAgIHJldHVybiBuZXcgUHJveHkoaW1wbGVtZW50ZWQsIHtcbiAgICAgICAgZ2V0KHRhcmdldDogYW55LCBrZXkpIHtcbiAgICAgICAgICAgIGlmICghdGFyZ2V0W2tleV0pIHJldHVybiBmaW5hbCA/IE5vdEltcGxlbWVudGVkIDogTm90SW1wbGVtZW50ZWRQcm94eSgpXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0W2tleV1cbiAgICAgICAgfSxcbiAgICAgICAgYXBwbHkoKSB7XG4gICAgICAgICAgICByZXR1cm4gTm90SW1wbGVtZW50ZWQoKVxuICAgICAgICB9LFxuICAgIH0pXG59XG5mdW5jdGlvbiBOb3RJbXBsZW1lbnRlZCgpOiBhbnkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQhJylcbiAgICB9XG59XG5mdW5jdGlvbiBQYXJ0aWFsSW1wbGVtZW50ZWQ8VD4ob2JqOiBULCAuLi5rZXlzOiAoa2V5b2YgVClbXSkge1xuICAgIGNvbnN0IG9iajIgPSB7IC4uLm9iaiB9XG4gICAga2V5cy5mb3JFYWNoKHggPT4gZGVsZXRlIG9iajJbeF0pXG4gICAgaWYgKE9iamVjdC5rZXlzKG9iajIpLmxlbmd0aCkgY29uc29sZS53YXJuKGBOb3QgaW1wbGVtZW50ZWQgb3B0aW9uc2AsIG9iajIsIGBhdGAsIG5ldyBFcnJvcigpLnN0YWNrKVxufVxuXG50eXBlIEhlYWRsZXNzUGFyYW1ldGVyczxUIGV4dGVuZHMgKC4uLmFyZ3M6IGFueSkgPT4gYW55PiA9IFQgZXh0ZW5kcyAoZXh0ZW5zaW9uSUQ6IHN0cmluZywgLi4uYXJnczogaW5mZXIgUCkgPT4gYW55XG4gICAgPyBQXG4gICAgOiBuZXZlclxuLyoqXG4gKiBHZW5lcmF0ZSBiaW5kaW5nIGJldHdlZW4gSG9zdCBhbmQgV2ViRXh0ZW5zaW9uQVBJXG4gKlxuICogQUxMIGdlbmVyaWNzIHNob3VsZCBiZSBpbmZlcnJlZC4gRE8gTk9UIHdyaXRlIGl0IG1hbnVhbGx5LlxuICpcbiAqIElmIHlvdSBhcmUgd3JpdGluZyBvcHRpb25zLCBtYWtlIHN1cmUgeW91IGFkZCB5b3VyIGZ1bmN0aW9uIHRvIGBCcm93c2VyUmVmZXJlbmNlYCB0byBnZXQgdHlwZSB0aXBzLlxuICpcbiAqIEBwYXJhbSBleHRlbnNpb25JRCAtIFRoZSBleHRlbnNpb24gSURcbiAqIEBwYXJhbSBrZXkgLSBUaGUgQVBJIG5hbWUgaW4gdGhlIHR5cGUgb2YgYEhvc3RgIEFORCBgQnJvd3NlclJlZmVyZW5jZWBcbiAqL1xuZnVuY3Rpb24gYmluZGluZzxcbiAgICAvKiogTmFtZSBvZiB0aGUgQVBJIGluIHRoZSBSUEMgYmluZGluZyAqL1xuICAgIEtleSBleHRlbmRzIGtleW9mIEJyb3dzZXJSZWZlcmVuY2UsXG4gICAgLyoqIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBXZWJFeHRlbnNpb25BUEkgc2lkZSAqL1xuICAgIEJyb3dzZXJEZWYgZXh0ZW5kcyBCcm93c2VyUmVmZXJlbmNlW0tleV0sXG4gICAgLyoqIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBIb3N0IHNpZGUgKi9cbiAgICBIb3N0RGVmIGV4dGVuZHMgSG9zdFtLZXldLFxuICAgIC8qKiBBcmd1bWVudHMgb2YgdGhlIGJyb3dzZXIgc2lkZSAqL1xuICAgIEJyb3dzZXJBcmdzIGV4dGVuZHMgUGFyYW1ldGVyczxCcm93c2VyRGVmPixcbiAgICAvKiogUmV0dXJuIHR5cGUgb2YgdGhlIGJyb3dzZXIgc2lkZSAqL1xuICAgIEJyb3dzZXJSZXR1cm4gZXh0ZW5kcyBQcm9taXNlT2Y8UmV0dXJuVHlwZTxCcm93c2VyRGVmPj4sXG4gICAgLyoqIEFyZ3VtZW50cyB0eXBlIG9mIHRoZSBIb3N0IHNpZGUgKi9cbiAgICBIb3N0QXJncyBleHRlbmRzIEhlYWRsZXNzUGFyYW1ldGVyczxIb3N0RGVmPixcbiAgICAvKiogUmV0dXJuIHR5cGUgb2YgdGhlIEhvc3Qgc2lkZSAqL1xuICAgIEhvc3RSZXR1cm4gZXh0ZW5kcyBQcm9taXNlT2Y8UmV0dXJuVHlwZTxIb3N0RGVmPj5cbj4oZXh0ZW5zaW9uSUQ6IHN0cmluZywga2V5OiBLZXkpIHtcbiAgICAvKipcbiAgICAgKiBBbmQgaGVyZSB3ZSBzcGxpdCBpdCBpbnRvIDIgZnVuY3Rpb24sIGlmIHdlIGpvaW4gdGhlbSB0b2dldGhlciBpdCB3aWxsIGJyZWFrIHRoZSBpbmZlciAoYnV0IGlkayB3aHkpXG4gICAgICovXG4gICAgcmV0dXJuIDxcbiAgICAgICAgLyoqIEhlcmUgd2UgaGF2ZSB0byB1c2UgZ2VuZXJpY3Mgd2l0aCBndWFyZCB0byBlbnN1cmUgVHlwZVNjcmlwdCB3aWxsIGluZmVyIHR5cGUgb24gcnVudGltZSAqL1xuICAgICAgICBPcHRpb25zIGV4dGVuZHMge1xuICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAqIEhlcmUgd2Ugd3JpdGUgdGhlIHR5cGUgZ3VhcmQgaW4gdGhlIGdlbmVyaWMsXG4gICAgICAgICAgICAgKiBkb24ndCB1c2UgdHdvIG1vcmUgZ2VuZXJpY3MgdG8gaW5mZXIgdGhlIHJldHVybiB0eXBlIG9mIGBwYXJhbWAgYW5kIGByZXR1cm5zYCxcbiAgICAgICAgICAgICAqIHRoYXQgd2lsbCBicmVhayB0aGUgaW5mZXIgcmVzdWx0LlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBwYXJhbT86ICguLi5hcmdzOiBCcm93c2VyQXJncykgPT4gSG9zdEFyZ3NcbiAgICAgICAgICAgIHJldHVybnM/OiAocmV0dXJuczogSG9zdFJldHVybiwgYnJvd3NlcjogQnJvd3NlckFyZ3MsIGhvc3Q6IEhvc3RBcmdzKSA9PiBCcm93c2VyUmV0dXJuXG4gICAgICAgIH1cbiAgICA+KFxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucy4gWW91IGNhbiB3cml0ZSB0aGUgYnJpZGdlIGJldHdlZW4gSG9zdCBzaWRlIGFuZCBXZWJFeHRlbnNpb24gc2lkZS5cbiAgICAgICAgICovXG4gICAgICAgIG9wdGlvbnM6IE9wdGlvbnMgPSB7fSBhcyBhbnksXG4gICAgKSA9PiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEb24ndCB3cml0ZSB0aGVzZSB0eXBlIGFsaWFzIGluIGdlbmVyaWNzLiB3aWxsIGJyZWFrLiBpZGsgd2h5IGFnYWluLlxuICAgICAgICAgKi9cbiAgICAgICAgdHlwZSBIYXNQYXJhbUZuID0gdW5kZWZpbmVkIGV4dGVuZHMgT3B0aW9uc1sncGFyYW0nXSA/IGZhbHNlIDogdHJ1ZVxuICAgICAgICB0eXBlIEhhc1JldHVybkZuID0gdW5kZWZpbmVkIGV4dGVuZHMgT3B0aW9uc1sncmV0dXJucyddID8gZmFsc2UgOiB0cnVlXG4gICAgICAgIHR5cGUgX19fQXJnc19fXyA9IFJldHVyblR5cGU8Tm9uTnVsbGFibGU8T3B0aW9uc1sncGFyYW0nXT4+XG4gICAgICAgIHR5cGUgX19fUmV0dXJuX19fID0gUmV0dXJuVHlwZTxOb25OdWxsYWJsZTxPcHRpb25zWydyZXR1cm5zJ10+PlxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgdGhlcmUgaXMgYSBicmlkZ2UgZnVuY3Rpb25cbiAgICAgICAgICogLSBpZiBpdHMgcmV0dXJuIHR5cGUgc2F0aXNmaWVkIHRoZSByZXF1aXJlbWVudCwgcmV0dXJuIHRoZSBgQnJvd3NlckFyZ3NgIGVsc2UgcmV0dXJuIGBuZXZlcmBcbiAgICAgICAgICpcbiAgICAgICAgICogcmV0dXJuIHRoZSBgSG9zdEFyZ3NgIGFuZCBsZXQgVHlwZVNjcmlwdCBjaGVjayBpZiBpdCBpcyBzYXRpc2ZpZWQuXG4gICAgICAgICAqL1xuICAgICAgICB0eXBlIEluZmVyQXJnc1Jlc3VsdCA9IEhhc1BhcmFtRm4gZXh0ZW5kcyB0cnVlXG4gICAgICAgICAgICA/IF9fX0FyZ3NfX18gZXh0ZW5kcyBCcm93c2VyQXJnc1xuICAgICAgICAgICAgICAgID8gQnJvd3NlckFyZ3NcbiAgICAgICAgICAgICAgICA6IG5ldmVyXG4gICAgICAgICAgICA6IEhvc3RBcmdzXG4gICAgICAgIC8qKiBKdXN0IGxpa2UgYEluZmVyQXJnc1Jlc3VsdGAgKi9cbiAgICAgICAgdHlwZSBJbmZlclJldHVyblJlc3VsdCA9IEhhc1JldHVybkZuIGV4dGVuZHMgdHJ1ZVxuICAgICAgICAgICAgPyBfX19SZXR1cm5fX18gZXh0ZW5kcyBCcm93c2VyUmV0dXJuXG4gICAgICAgICAgICAgICAgPyBfX19SZXR1cm5fX19cbiAgICAgICAgICAgICAgICA6ICduZXZlciBydG4nXG4gICAgICAgICAgICA6IEhvc3RSZXR1cm5cbiAgICAgICAgY29uc3Qgbm9vcCA9IDxUPih4PzogVCkgPT4geFxuICAgICAgICBjb25zdCBub29wQXJncyA9ICguLi5hcmdzOiBhbnlbXSkgPT4gYXJnc1xuICAgICAgICBjb25zdCBob3N0RGVmaW5pdGlvbjogKGV4dGVuc2lvbklEOiBzdHJpbmcsIC4uLmFyZ3M6IEhvc3RBcmdzKSA9PiBQcm9taXNlPEhvc3RSZXR1cm4+ID0gSG9zdFtrZXldIGFzIGFueVxuICAgICAgICByZXR1cm4gKChhc3luYyAoLi4uYXJnczogQnJvd3NlckFyZ3MpOiBQcm9taXNlPEJyb3dzZXJSZXR1cm4+ID0+IHtcbiAgICAgICAgICAgIC8vID8gVHJhbnNmb3JtIFdlYkV4dGVuc2lvbiBBUEkgYXJndW1lbnRzIHRvIGhvc3QgYXJndW1lbnRzXG4gICAgICAgICAgICBjb25zdCBob3N0QXJncyA9IChvcHRpb25zLnBhcmFtIHx8IG5vb3BBcmdzKSguLi5hcmdzKSBhcyBIb3N0QXJnc1xuICAgICAgICAgICAgLy8gPyBleGVjdXRlXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBob3N0RGVmaW5pdGlvbihleHRlbnNpb25JRCwgLi4uaG9zdEFyZ3MpXG4gICAgICAgICAgICAvLyA/IFRyYW5zZm9ybSBob3N0IHJlc3VsdCB0byBXZWJFeHRlbnNpb24gQVBJIHJlc3VsdFxuICAgICAgICAgICAgY29uc3QgYnJvd3NlclJlc3VsdCA9IChvcHRpb25zLnJldHVybnMgfHwgbm9vcCkocmVzdWx0LCBhcmdzLCBob3N0QXJncykgYXMgQnJvd3NlclJldHVyblxuICAgICAgICAgICAgcmV0dXJuIGJyb3dzZXJSZXN1bHRcbiAgICAgICAgfSkgYXMgdW5rbm93bikgYXMgKC4uLmFyZ3M6IEluZmVyQXJnc1Jlc3VsdCkgPT4gUHJvbWlzZTxJbmZlclJldHVyblJlc3VsdD5cbiAgICB9XG59XG4vKipcbiAqIEEgcmVmZXJlbmNlIHRhYmxlIGJldHdlZW4gSG9zdCBhbmQgV2ViRXh0ZW5zaW9uQVBJXG4gKlxuICoga2V5IGlzIGluIHRoZSBob3N0LCByZXN1bHQgdHlwZSBpcyBpbiB0aGUgV2ViRXh0ZW5zaW9uLlxuICovXG50eXBlIEJyb3dzZXJSZWZlcmVuY2UgPSB7IFtrZXkgaW4ga2V5b2YgdHlwZW9mIEhvc3RdOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiBQcm9taXNlPHVua25vd24+IH0gJiB7XG4gICAgJ2Jyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkJzogdHlwZW9mIGJyb3dzZXIuZG93bmxvYWRzLmRvd25sb2FkXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXRCeXRlc0luVXNlJzogKGtleXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgbnVsbCkgPT4gUHJvbWlzZTxudW1iZXI+XG4gICAgJ2Jyb3dzZXIudGFicy5jcmVhdGUnOiB0eXBlb2YgYnJvd3Nlci50YWJzLmNyZWF0ZVxufVxudHlwZSBQcm9taXNlT2Y8VD4gPSBUIGV4dGVuZHMgUHJvbWlzZTxpbmZlciBVPiA/IFUgOiBuZXZlclxuIiwiaW1wb3J0IHsgSG9zdCB9IGZyb20gJy4uL1JQQydcblxuY29uc3QgeyBjcmVhdGVPYmplY3RVUkwsIHJldm9rZU9iamVjdFVSTCB9ID0gVVJMXG5mdW5jdGlvbiBnZXRJREZyb21CbG9iVVJMKHg6IHN0cmluZykge1xuICAgIHJldHVybiBuZXcgVVJMKG5ldyBVUkwoeCkucGF0aG5hbWUpLnBhdGhuYW1lXG59XG4vKipcbiAqIE1vZGlmeSB0aGUgYmVoYXZpb3Igb2YgVVJMLipcbiAqIExldCB0aGUgYmxvYjovLyB1cmwgY2FuIGJlIHJlY29nbml6ZWQgYnkgSG9zdC5cbiAqXG4gKiBAcGFyYW0gdXJsIFRoZSBvcmlnaW5hbCBVUkwgb2JqZWN0XG4gKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuaGFuY2VVUkwodXJsOiB0eXBlb2YgVVJMLCBleHRlbnNpb25JRDogc3RyaW5nKSB7XG4gICAgdXJsLmNyZWF0ZU9iamVjdFVSTCA9IGNyZWF0ZU9iamVjdFVSTEVuaGFuY2VkKGV4dGVuc2lvbklEKVxuICAgIHVybC5yZXZva2VPYmplY3RVUkwgPSByZXZva2VPYmplY3RVUkxFbmhhbmNlZChleHRlbnNpb25JRClcbiAgICByZXR1cm4gdXJsXG59XG5cbmZ1bmN0aW9uIHJldm9rZU9iamVjdFVSTEVuaGFuY2VkKGV4dGVuc2lvbklEOiBzdHJpbmcpOiAodXJsOiBzdHJpbmcpID0+IHZvaWQge1xuICAgIHJldHVybiAodXJsOiBzdHJpbmcpID0+IHtcbiAgICAgICAgcmV2b2tlT2JqZWN0VVJMKHVybClcbiAgICAgICAgY29uc3QgaWQgPSBnZXRJREZyb21CbG9iVVJMKHVybClcbiAgICAgICAgSG9zdFsnVVJMLnJldm9rZU9iamVjdFVSTCddKGV4dGVuc2lvbklELCBpZClcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU9iamVjdFVSTEVuaGFuY2VkKGV4dGVuc2lvbklEOiBzdHJpbmcpOiAob2JqZWN0OiBhbnkpID0+IHN0cmluZyB7XG4gICAgcmV0dXJuIChvYmo6IEZpbGUgfCBCbG9iIHwgTWVkaWFTb3VyY2UpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gY3JlYXRlT2JqZWN0VVJMKG9iailcbiAgICAgICAgY29uc3QgcmVzb3VyY2VJRCA9IGdldElERnJvbUJsb2JVUkwodXJsKVxuICAgICAgICBpZiAob2JqIGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgICAgICAgYmxvYlRvQmFzZTY0KG9iaikudGhlbihiYXNlNjQgPT4gSG9zdFsnVVJMLmNyZWF0ZU9iamVjdFVSTCddKGV4dGVuc2lvbklELCByZXNvdXJjZUlELCBiYXNlNjQsIG9iai50eXBlKSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsXG4gICAgfVxufVxuXG5mdW5jdGlvbiBibG9iVG9CYXNlNjQoYmxvYjogQmxvYikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZGVuZCcsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IFtoZWFkZXIsIGJhc2U2NF0gPSAocmVhZGVyLnJlc3VsdCBhcyBzdHJpbmcpLnNwbGl0KCcsJylcbiAgICAgICAgICAgIHJlc29sdmUoYmFzZTY0KVxuICAgICAgICB9KVxuICAgICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBlID0+IHJlamVjdChlKSlcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoYmxvYilcbiAgICB9KVxufVxuIiwiLyoqXG4gKiBUaGlzIGZpbGUgcGFydGx5IGltcGxlbWVudHMgWFJheVZpc2lvbiBpbiBGaXJlZm94J3MgV2ViRXh0ZW5zaW9uIHN0YW5kYXJkXG4gKiBieSBjcmVhdGUgYSB0d28td2F5IEpTIHNhbmRib3ggYnV0IHNoYXJlZCBET00gZW52aXJvbm1lbnQuXG4gKlxuICogY2xhc3MgV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50IHdpbGwgcmV0dXJuIGEgbmV3IEpTIGVudmlyb25tZW50XG4gKiB0aGF0IGhhcyBhIFwiYnJvd3NlclwiIHZhcmlhYmxlIGluc2lkZSBvZiBpdCBhbmQgYSBjbG9uZSBvZiB0aGUgY3VycmVudCBET00gZW52aXJvbm1lbnRcbiAqIHRvIHByZXZlbnQgdGhlIG1haW4gdGhyZWFkIGhhY2sgb24gcHJvdG90eXBlIHRvIGFjY2VzcyB0aGUgY29udGVudCBvZiBDb250ZW50U2NyaXB0cy5cbiAqXG4gKiAjIyBDaGVja2xpc3Q6XG4gKiAtIFtvXSBDb250ZW50U2NyaXB0IGNhbm5vdCBhY2Nlc3MgbWFpbiB0aHJlYWRcbiAqIC0gWz9dIE1haW4gdGhyZWFkIGNhbm5vdCBhY2Nlc3MgQ29udGVudFNjcmlwdFxuICogLSBbb10gQ29udGVudFNjcmlwdCBjYW4gYWNjZXNzIG1haW4gdGhyZWFkJ3MgRE9NXG4gKiAtIFsgXSBDb250ZW50U2NyaXB0IG1vZGlmaWNhdGlvbiBvbiBET00gcHJvdG90eXBlIGlzIG5vdCBkaXNjb3ZlcmFibGUgYnkgbWFpbiB0aHJlYWRcbiAqIC0gWyBdIE1haW4gdGhyZWFkIG1vZGlmaWNhdGlvbiBvbiBET00gcHJvdG90eXBlIGlzIG5vdCBkaXNjb3ZlcmFibGUgYnkgQ29udGVudFNjcmlwdFxuICovXG5pbXBvcnQgUmVhbG1Db25zdHJ1Y3RvciwgeyBSZWFsbSB9IGZyb20gJ3JlYWxtcy1zaGltJ1xuXG5pbXBvcnQgeyBCcm93c2VyRmFjdG9yeSB9IGZyb20gJy4vYnJvd3NlcidcbmltcG9ydCB7IE1hbmlmZXN0IH0gZnJvbSAnLi4vRXh0ZW5zaW9ucydcbmltcG9ydCB7IGVuaGFuY2VVUkwgfSBmcm9tICcuL1VSTC5jcmVhdGUrcmV2b2tlT2JqZWN0VVJMJ1xuLyoqXG4gKiBSZWN1cnNpdmVseSBnZXQgdGhlIHByb3RvdHlwZSBjaGFpbiBvZiBhbiBPYmplY3RcbiAqIEBwYXJhbSBvIE9iamVjdFxuICovXG5mdW5jdGlvbiBnZXRQcm90b3R5cGVDaGFpbihvOiBhbnksIF86IGFueVtdID0gW10pOiBhbnlbXSB7XG4gICAgaWYgKG8gPT09IHVuZGVmaW5lZCB8fCBvID09PSBudWxsKSByZXR1cm4gX1xuICAgIGNvbnN0IHkgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YobylcbiAgICBpZiAoeSA9PT0gbnVsbCB8fCB5ID09PSB1bmRlZmluZWQgfHwgeSA9PT0gT2JqZWN0LnByb3RvdHlwZSkgcmV0dXJuIF9cbiAgICByZXR1cm4gZ2V0UHJvdG90eXBlQ2hhaW4oT2JqZWN0LmdldFByb3RvdHlwZU9mKHkpLCBbLi4uXywgeV0pXG59XG4vKipcbiAqIEFwcGx5IGFsbCBXZWJBUElzIHRvIHRoZSBjbGVhbiBzYW5kYm94IGNyZWF0ZWQgYnkgUmVhbG1cbiAqL1xuY29uc3QgUHJlcGFyZVdlYkFQSXMgPSAoKCkgPT4ge1xuICAgIGNvbnN0IHJlYWxXaW5kb3cgPSB3aW5kb3dcbiAgICBjb25zdCB3ZWJBUElzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMod2luZG93KVxuICAgIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkod2ViQVBJcywgJ3dpbmRvdycpXG4gICAgUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh3ZWJBUElzLCAnZ2xvYmFsVGhpcycpXG4gICAgUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh3ZWJBUElzLCAnc2VsZicpXG4gICAgUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh3ZWJBUElzLCAnZ2xvYmFsJylcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRG9jdW1lbnQucHJvdG90eXBlLCAnZGVmYXVsdFZpZXcnLCB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfSxcbiAgICB9KVxuICAgIHJldHVybiAoc2FuZGJveFJvb3Q6IHR5cGVvZiBnbG9iYWxUaGlzKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsb25lZFdlYkFQSXMgPSB7IC4uLndlYkFQSXMgfVxuICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhzYW5kYm94Um9vdCkuZm9yRWFjaChuYW1lID0+IFJlZmxlY3QuZGVsZXRlUHJvcGVydHkoY2xvbmVkV2ViQVBJcywgbmFtZSkpXG4gICAgICAgIC8vID8gQ2xvbmUgV2ViIEFQSXNcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gd2ViQVBJcykge1xuICAgICAgICAgICAgUGF0Y2hUaGlzT2ZEZXNjcmlwdG9yVG9HbG9iYWwod2ViQVBJc1trZXldLCByZWFsV2luZG93KVxuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzYW5kYm94Um9vdCwgJ3dpbmRvdycsIHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgdmFsdWU6IHNhbmRib3hSb290LFxuICAgICAgICB9KVxuICAgICAgICBPYmplY3QuYXNzaWduKHNhbmRib3hSb290LCB7IGdsb2JhbFRoaXM6IHNhbmRib3hSb290IH0pXG4gICAgICAgIGNvbnN0IHByb3RvID0gZ2V0UHJvdG90eXBlQ2hhaW4ocmVhbFdpbmRvdylcbiAgICAgICAgICAgIC5tYXAoT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMpXG4gICAgICAgICAgICAucmVkdWNlUmlnaHQoKHByZXZpb3VzLCBjdXJyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29weSA9IHsgLi4uY3VycmVudCB9XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY29weSkge1xuICAgICAgICAgICAgICAgICAgICBQYXRjaFRoaXNPZkRlc2NyaXB0b3JUb0dsb2JhbChjb3B5W2tleV0sIHJlYWxXaW5kb3cpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuY3JlYXRlKHByZXZpb3VzLCBjb3B5KVxuICAgICAgICAgICAgfSwge30pXG4gICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihzYW5kYm94Um9vdCwgcHJvdG8pXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHNhbmRib3hSb290LCBjbG9uZWRXZWJBUElzKVxuICAgIH1cbn0pKClcbi8qKlxuICogRXhlY3V0aW9uIGVudmlyb25tZW50IG9mIENvbnRlbnRTY3JpcHRcbiAqL1xuZXhwb3J0IGNsYXNzIFdlYkV4dGVuc2lvbkNvbnRlbnRTY3JpcHRFbnZpcm9ubWVudCBpbXBsZW1lbnRzIFJlYWxtPHR5cGVvZiBnbG9iYWxUaGlzICYgeyBicm93c2VyOiB0eXBlb2YgYnJvd3NlciB9PiB7XG4gICAgcHJpdmF0ZSByZWFsbSA9IFJlYWxtQ29uc3RydWN0b3IubWFrZVJvb3RSZWFsbSgpXG4gICAgZ2V0IGdsb2JhbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhbG0uZ2xvYmFsXG4gICAgfVxuICAgIHJlYWRvbmx5IFtTeW1ib2wudG9TdHJpbmdUYWddID0gJ1JlYWxtJ1xuICAgIC8qKlxuICAgICAqIEV2YWx1YXRlIGEgc3RyaW5nIGluIHRoZSBjb250ZW50IHNjcmlwdCBlbnZpcm9ubWVudFxuICAgICAqIEBwYXJhbSBzb3VyY2VUZXh0IFNvdXJjZSB0ZXh0XG4gICAgICovXG4gICAgZXZhbHVhdGUoc291cmNlVGV4dDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWxtLmV2YWx1YXRlKHNvdXJjZVRleHQpXG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBydW5uaW5nIGV4dGVuc2lvbiBmb3IgYW4gY29udGVudCBzY3JpcHQuXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEIFRoZSBleHRlbnNpb24gSURcbiAgICAgKiBAcGFyYW0gbWFuaWZlc3QgVGhlIG1hbmlmZXN0IG9mIHRoZSBleHRlbnNpb25cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZXh0ZW5zaW9uSUQ6IHN0cmluZywgcHVibGljIG1hbmlmZXN0OiBNYW5pZmVzdCkge1xuICAgICAgICB0aGlzLmluaXQoKVxuICAgIH1cbiAgICBwcml2YXRlIGluaXQoKSB7XG4gICAgICAgIFByZXBhcmVXZWJBUElzKHRoaXMuZ2xvYmFsKVxuICAgICAgICB0aGlzLmdsb2JhbC5icm93c2VyID0gQnJvd3NlckZhY3RvcnkodGhpcy5leHRlbnNpb25JRCwgdGhpcy5tYW5pZmVzdClcbiAgICAgICAgdGhpcy5nbG9iYWwuVVJMID0gZW5oYW5jZVVSTCh0aGlzLmdsb2JhbC5VUkwsIHRoaXMuZXh0ZW5zaW9uSUQpXG4gICAgfVxufVxuLyoqXG4gKiBNYW55IG1ldGhvZHMgb24gYHdpbmRvd2AgcmVxdWlyZXMgYHRoaXNgIHBvaW50cyB0byBhIFdpbmRvdyBvYmplY3RcbiAqIExpa2UgYGFsZXJ0KClgLiBJZiB5b3UgY2FsbCBhbGVydCBhcyBgY29uc3QgdyA9IHsgYWxlcnQgfTsgdy5hbGVydCgpYCxcbiAqIHRoZXJlIHdpbGwgYmUgYW4gSWxsZWdhbCBpbnZvY2F0aW9uLlxuICpcbiAqIFRvIHByZXZlbnQgYHRoaXNgIGJpbmRpbmcgbG9zdCwgd2UgbmVlZCB0byByZWJpbmQgaXQuXG4gKlxuICogQHBhcmFtIGRlc2MgUHJvcGVydHlEZXNjcmlwdG9yXG4gKiBAcGFyYW0gZ2xvYmFsIFRoZSByZWFsIHdpbmRvd1xuICovXG5mdW5jdGlvbiBQYXRjaFRoaXNPZkRlc2NyaXB0b3JUb0dsb2JhbChkZXNjOiBQcm9wZXJ0eURlc2NyaXB0b3IsIGdsb2JhbDogV2luZG93KSB7XG4gICAgY29uc3QgeyBnZXQsIHNldCwgdmFsdWUgfSA9IGRlc2NcbiAgICBpZiAoZ2V0KSBkZXNjLmdldCA9ICgpID0+IGdldC5hcHBseShnbG9iYWwpXG4gICAgaWYgKHNldCkgZGVzYy5zZXQgPSAodmFsOiBhbnkpID0+IHNldC5hcHBseShnbG9iYWwsIHZhbClcbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNvbnN0IGRlc2MyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnModmFsdWUpXG4gICAgICAgIGRlc2MudmFsdWUgPSBmdW5jdGlvbiguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgaWYgKG5ldy50YXJnZXQpIHJldHVybiBSZWZsZWN0LmNvbnN0cnVjdCh2YWx1ZSwgYXJncywgbmV3LnRhcmdldClcbiAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KHZhbHVlLCBnbG9iYWwsIGFyZ3MpXG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZGVzYy52YWx1ZSwgZGVzYzIpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyA/IEZvciB1bmtub3duIHJlYXNvbiB0aGlzIGZhaWwgZm9yIHNvbWUgb2JqZWN0cyBvbiBTYWZhcmkuXG4gICAgICAgICAgICBkZXNjLnZhbHVlLnByb3RvdHlwZSA9IHZhbHVlLnByb3RvdHlwZVxuICAgICAgICB9IGNhdGNoIHt9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgbWF0Y2hpbmdVUkwgfSBmcm9tICcuL3V0aWxzL1VSTE1hdGNoZXInXG5pbXBvcnQgeyBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnQgfSBmcm9tICcuL3NoaW1zL1hSYXlWaXNpb24nXG5pbXBvcnQgeyBCcm93c2VyRmFjdG9yeSB9IGZyb20gJy4vc2hpbXMvYnJvd3NlcidcblxuZXhwb3J0IHR5cGUgV2ViRXh0ZW5zaW9uSUQgPSBzdHJpbmdcbmV4cG9ydCB0eXBlIE1hbmlmZXN0ID0gUGFydGlhbDxicm93c2VyLnJ1bnRpbWUuTWFuaWZlc3Q+ICZcbiAgICBQaWNrPGJyb3dzZXIucnVudGltZS5NYW5pZmVzdCwgJ25hbWUnIHwgJ3ZlcnNpb24nIHwgJ21hbmlmZXN0X3ZlcnNpb24nPlxuZXhwb3J0IGludGVyZmFjZSBXZWJFeHRlbnNpb24ge1xuICAgIG1hbmlmZXN0OiBNYW5pZmVzdFxuICAgIGVudmlyb25tZW50OiBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnRcbn1cbmV4cG9ydCBjb25zdCByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uID0gbmV3IE1hcDxXZWJFeHRlbnNpb25JRCwgV2ViRXh0ZW5zaW9uPigpXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJXZWJFeHRlbnNpb24oXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgZW52aXJvbm1lbnQ6ICdjb250ZW50IHNjcmlwdCcgfCAnYmFja2dyb3VuZCBzY3JpcHQnLFxuICAgIHByZWxvYWRlZFJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9LFxuKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhcbiAgICAgICAgYFtXZWJFeHRlbnNpb25dIExvYWRpbmcgZXh0ZW5zaW9uICR7bWFuaWZlc3QubmFtZX0oJHtleHRlbnNpb25JRH0pIHdpdGggbWFuaWZlc3RgLFxuICAgICAgICBtYW5pZmVzdCxcbiAgICAgICAgYGFuZCBwcmVsb2FkZWQgcmVzb3VyY2VgLFxuICAgICAgICBwcmVsb2FkZWRSZXNvdXJjZXMsXG4gICAgICAgIGBpbiAke2Vudmlyb25tZW50fSBtb2RlYCxcbiAgICApXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKGVudmlyb25tZW50ID09PSAnY29udGVudCBzY3JpcHQnKSB7XG4gICAgICAgICAgICBMb2FkQ29udGVudFNjcmlwdChtYW5pZmVzdCwgZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcylcbiAgICAgICAgfSBlbHNlIGlmIChlbnZpcm9ubWVudCA9PT0gJ2JhY2tncm91bmQgc2NyaXB0Jykge1xuICAgICAgICAgICAgTG9hZEJhY2tncm91bmRTY3JpcHQobWFuaWZlc3QsIGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtXZWJFeHRlbnNpb25dIHVua25vd24gcnVubmluZyBlbnZpcm9ubWVudCAke2Vudmlyb25tZW50fWApXG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgICB9XG4gICAgcmV0dXJuIHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uZ2V0KGV4dGVuc2lvbklEKVxufVxuXG5mdW5jdGlvbiBMb2FkQmFja2dyb3VuZFNjcmlwdChtYW5pZmVzdDogTWFuaWZlc3QsIGV4dGVuc2lvbklEOiBzdHJpbmcsIHByZWxvYWRlZFJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPikge1xuICAgIGlmICghbWFuaWZlc3QuYmFja2dyb3VuZCkgcmV0dXJuXG4gICAgY29uc3QgeyBwYWdlLCBzY3JpcHRzIH0gPSBtYW5pZmVzdC5iYWNrZ3JvdW5kIGFzIGFueVxuICAgIGlmIChwYWdlKSByZXR1cm4gY29uc29sZS53YXJuKCdbV2ViRXh0ZW5zaW9uXSBtYW5pZmVzdC5iYWNrZ3JvdW5kLnBhZ2UgaXMgbm90IHN1cHBvcnRlZCB5ZXQhJylcbiAgICBpZiAobG9jYXRpb24uaG9zdG5hbWUgIT09ICdsb2NhbGhvc3QnICYmICFsb2NhdGlvbi5ocmVmLnN0YXJ0c1dpdGgoJ2hvbG9mbG93cy1leHRlbnNpb246Ly8nKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBCYWNrZ3JvdW5kIHNjcmlwdCBvbmx5IGFsbG93ZWQgaW4gbG9jYWxob3N0KGZvciBkZWJ1Z2dpbmcpIGFuZCBob2xvZmxvd3MtZXh0ZW5zaW9uOi8vYClcbiAgICB9XG4gICAge1xuICAgICAgICBjb25zdCBzcmMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEhUTUxTY3JpcHRFbGVtZW50LnByb3RvdHlwZSwgJ3NyYycpIVxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSFRNTFNjcmlwdEVsZW1lbnQucHJvdG90eXBlLCAnc3JjJywge1xuICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzcmMuZ2V0IS5jYWxsKHRoaXMpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdMb2FkaW5nICcsIHZhbClcbiAgICAgICAgICAgICAgICBpZiAodmFsIGluIHByZWxvYWRlZFJlc291cmNlcyB8fCB2YWwucmVwbGFjZSgvXlxcLy8sICcnKSBpbiBwcmVsb2FkZWRSZXNvdXJjZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgUnVuSW5HbG9iYWxTY29wZShleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzW3ZhbF0gfHwgcHJlbG9hZGVkUmVzb3VyY2VzW3ZhbC5yZXBsYWNlKC9eXFwvLywgJycpXSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3JjLnNldCEuY2FsbCh0aGlzLCB2YWwpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgfVxuICAgIE9iamVjdC5hc3NpZ24od2luZG93LCB7IGJyb3dzZXI6IEJyb3dzZXJGYWN0b3J5KGV4dGVuc2lvbklELCBtYW5pZmVzdCkgfSlcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgKHNjcmlwdHMgYXMgc3RyaW5nW10pIHx8IFtdKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJlbG9hZGVkUmVzb3VyY2VzW3BhdGhdID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gPyBSdW4gaXQgaW4gZ2xvYmFsIHNjb3BlLlxuICAgICAgICAgICAgUnVuSW5HbG9iYWxTY29wZShleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzW3BhdGhdKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbV2ViRXh0ZW5zaW9uXSBDb250ZW50IHNjcmlwdHMgcHJlbG9hZCBub3QgZm91bmQgZm9yICR7bWFuaWZlc3QubmFtZX06ICR7cGF0aH1gKVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gUnVuSW5HbG9iYWxTY29wZShleHRlbnNpb25JRDogc3RyaW5nLCBzcmM6IHN0cmluZykge1xuICAgIGlmIChsb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2hvbG9mbG93cy1leHRlbnNpb246JykgcmV0dXJuIG5ldyBGdW5jdGlvbihzcmMpKClcbiAgICBjb25zdCBmID0gbmV3IEZ1bmN0aW9uKGB3aXRoIChcbiAgICAgICAgICAgICAgICBuZXcgUHJveHkod2luZG93LCB7XG4gICAgICAgICAgICAgICAgICAgIGdldCh0YXJnZXQsIGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gJ2xvY2F0aW9uJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFVSTChcImhvbG9mbG93cy1leHRlbnNpb246Ly8ke2V4dGVuc2lvbklEfS9fZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZS5odG1sXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZih0eXBlb2YgdGFyZ2V0W2tleV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXNjMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHRhcmdldFtrZXldKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGYoLi4uYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmV3LnRhcmdldCkgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KHRhcmdldFtrZXldLCBhcmdzLCBuZXcudGFyZ2V0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5hcHBseSh0YXJnZXRba2V5XSwgd2luZG93LCBhcmdzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhmLCBkZXNjMilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmLnByb3RvdHlwZSA9IHRhcmdldFtrZXldLnByb3RvdHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W2tleV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICkpIHtcbiAgICAgICAgICAgICAgICAke3NyY31cbiAgICAgICAgICAgICAgfWApXG4gICAgZigpXG59XG5cbmZ1bmN0aW9uIExvYWRDb250ZW50U2NyaXB0KG1hbmlmZXN0OiBNYW5pZmVzdCwgZXh0ZW5zaW9uSUQ6IHN0cmluZywgcHJlbG9hZGVkUmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSB7XG4gICAgZm9yIChjb25zdCBbaW5kZXgsIGNvbnRlbnRdIG9mIChtYW5pZmVzdC5jb250ZW50X3NjcmlwdHMgfHwgW10pLmVudHJpZXMoKSkge1xuICAgICAgICB3YXJuaW5nTm90SW1wbGVtZW50ZWRJdGVtKGNvbnRlbnQsIGluZGV4KVxuICAgICAgICBpZiAoXG4gICAgICAgICAgICBtYXRjaGluZ1VSTChcbiAgICAgICAgICAgICAgICBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQubWF0Y2hlcyxcbiAgICAgICAgICAgICAgICBjb250ZW50LmV4Y2x1ZGVfbWF0Y2hlcyB8fCBbXSxcbiAgICAgICAgICAgICAgICBjb250ZW50LmluY2x1ZGVfZ2xvYnMgfHwgW10sXG4gICAgICAgICAgICAgICAgY29udGVudC5leGNsdWRlX2dsb2JzIHx8IFtdLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQubWF0Y2hfYWJvdXRfYmxhbmssXG4gICAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW1dlYkV4dGVuc2lvbl0gTG9hZGluZyBjb250ZW50IHNjcmlwdCBmb3JgLCBjb250ZW50KVxuICAgICAgICAgICAgbG9hZENvbnRlbnRTY3JpcHQoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0LCBjb250ZW50LCBwcmVsb2FkZWRSZXNvdXJjZXMpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKGBbV2ViRXh0ZW5zaW9uXSBVUkwgbWlzbWF0Y2hlZC4gU2tpcCBjb250ZW50IHNjcmlwdCBmb3IsIGAsIGNvbnRlbnQpXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWRDb250ZW50U2NyaXB0KFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgbWFuaWZlc3Q6IE1hbmlmZXN0LFxuICAgIGNvbnRlbnQ6IE5vbk51bGxhYmxlPE1hbmlmZXN0Wydjb250ZW50X3NjcmlwdHMnXT5bMF0sXG4gICAgY29udGVudF9zY3JpcHRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuKSB7XG4gICAgaWYgKCFyZWdpc3RlcmVkV2ViRXh0ZW5zaW9uLmhhcyhleHRlbnNpb25JRCkpIHtcbiAgICAgICAgY29uc3QgZW52aXJvbm1lbnQgPSBuZXcgV2ViRXh0ZW5zaW9uQ29udGVudFNjcmlwdEVudmlyb25tZW50KGV4dGVuc2lvbklELCBtYW5pZmVzdClcbiAgICAgICAgY29uc3QgZXh0OiBXZWJFeHRlbnNpb24gPSB7XG4gICAgICAgICAgICBtYW5pZmVzdCxcbiAgICAgICAgICAgIGVudmlyb25tZW50LFxuICAgICAgICB9XG4gICAgICAgIHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uc2V0KGV4dGVuc2lvbklELCBleHQpXG4gICAgfVxuICAgIGNvbnN0IHsgZW52aXJvbm1lbnQgfSA9IHJlZ2lzdGVyZWRXZWJFeHRlbnNpb24uZ2V0KGV4dGVuc2lvbklEKSFcbiAgICBmb3IgKGNvbnN0IHBhdGggb2YgY29udGVudC5qcyB8fCBbXSkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnRlbnRfc2NyaXB0c1twYXRoXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGVudmlyb25tZW50LmV2YWx1YXRlKGNvbnRlbnRfc2NyaXB0c1twYXRoXSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1dlYkV4dGVuc2lvbl0gQ29udGVudCBzY3JpcHRzIHByZWxvYWQgbm90IGZvdW5kIGZvciAke21hbmlmZXN0Lm5hbWV9OiAke3BhdGh9YClcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gd2FybmluZ05vdEltcGxlbWVudGVkSXRlbShjb250ZW50OiBOb25OdWxsYWJsZTxNYW5pZmVzdFsnY29udGVudF9zY3JpcHRzJ10+WzBdLCBpbmRleDogbnVtYmVyKSB7XG4gICAgaWYgKGNvbnRlbnQuYWxsX2ZyYW1lcylcbiAgICAgICAgY29uc29sZS53YXJuKGBhbGxfZnJhbWVzIG5vdCBzdXBwb3J0ZWQgeWV0LiBEZWZpbmVkIGF0IG1hbmlmZXN0LmNvbnRlbnRfc2NyaXB0c1ske2luZGV4fV0uYWxsX2ZyYW1lc2ApXG4gICAgaWYgKGNvbnRlbnQuY3NzKSBjb25zb2xlLndhcm4oYGNzcyBub3Qgc3VwcG9ydGVkIHlldC4gRGVmaW5lZCBhdCBtYW5pZmVzdC5jb250ZW50X3NjcmlwdHNbJHtpbmRleH1dLmNzc2ApXG4gICAgaWYgKGNvbnRlbnQucnVuX2F0ICYmIGNvbnRlbnQucnVuX2F0ICE9PSAnZG9jdW1lbnRfc3RhcnQnKVxuICAgICAgICBjb25zb2xlLndhcm4oYHJ1bl9hdCBub3Qgc3VwcG9ydGVkIHlldC4gRGVmaW5lZCBhdCBtYW5pZmVzdC5jb250ZW50X3NjcmlwdHNbJHtpbmRleH1dLnJ1bl9hdGApXG59XG4iLCJpbXBvcnQgeyByZWdpc3RlcldlYkV4dGVuc2lvbiB9IGZyb20gJy4vRXh0ZW5zaW9ucydcbmltcG9ydCBNYW5pZmVzdCBmcm9tICcuL2V4dGVuc2lvbi9tYW5pZmVzdC5qc29uJ1xuXG5jb25zdCByZXNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fVxuLyoqXG4gKiBEeW5hbWljYWxseSBnZW5lcmF0ZSBjb2RlOlxuICogZm9yIGVhY2ggZmlsZSBpbiBgc3JjL2V4dGVuc2lvbi9qc2AgYW5kIGBzcmMvZXh0ZW5zaW9uL3BvbHlmaWxsYFxuICogICBHZW5lcmF0ZSBjb2RlIGxpa2UgdGhpczpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIC8vIEB0cy1pZ25vcmVcbiAqIGltcG9ydCAkUEFUSE5BTUVfRklMRU5BTUUgZnJvbSAnLi9leHRlbnNpb24vUEFUSE5BTUUvRklMRU5BTUUnXG4gKiByZXNvdXJjZXNbJ3BhdGhuYW1lL2ZpbGVuYW1lJ10gPSAkUEFUSE5BTUVfRklMRU5BTUVcbiAqIGBgYFxuICovXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgJDAgZnJvbSAnLi9leHRlbnNpb24vaW5kZXguaHRtbCdcbnJlc291cmNlc1snaW5kZXguaHRtbCddID0gJDBcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCAkMSBmcm9tICcuL2V4dGVuc2lvbi9qcy80LmNodW5rLmpzJ1xucmVzb3VyY2VzWydqcy80LmNodW5rLmpzJ10gPSAkMVxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICQyIGZyb20gJy4vZXh0ZW5zaW9uL2pzLzUuY2h1bmsuanMnXG5yZXNvdXJjZXNbJ2pzLzUuY2h1bmsuanMnXSA9ICQyXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgJDMgZnJvbSAnLi9leHRlbnNpb24vanMvYXBwLmpzJ1xucmVzb3VyY2VzWydqcy9hcHAuanMnXSA9ICQzXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgJDQgZnJvbSAnLi9leHRlbnNpb24vanMvYmFja2dyb3VuZHNlcnZpY2UuanMnXG5yZXNvdXJjZXNbJ2pzL2JhY2tncm91bmRzZXJ2aWNlLmpzJ10gPSAkNFxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICQ1IGZyb20gJy4vZXh0ZW5zaW9uL2pzL2NvbnRlbnRzY3JpcHQuanMnXG5yZXNvdXJjZXNbJ2pzL2NvbnRlbnRzY3JpcHQuanMnXSA9ICQ1XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgJDYgZnJvbSAnLi9leHRlbnNpb24vanMvaW5qZWN0ZWRzY3JpcHQuanMnXG5yZXNvdXJjZXNbJ2pzL2luamVjdGVkc2NyaXB0LmpzJ10gPSAkNlxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICQ3IGZyb20gJy4vZXh0ZW5zaW9uL3N0YXRpYy9tZWRpYS8xYTIuYzZhODBkNTIuanBnJ1xucmVzb3VyY2VzWydzdGF0aWMvbWVkaWEvMWEyLmM2YTgwZDUyLmpwZyddID0gJDdcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCAkOCBmcm9tICcuL2V4dGVuc2lvbi9zdGF0aWMvbWVkaWEvMWEzLmZlNjkwNjQxLmpwZydcbnJlc291cmNlc1snc3RhdGljL21lZGlhLzFhMy5mZTY5MDY0MS5qcGcnXSA9ICQ4XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgJDkgZnJvbSAnLi9leHRlbnNpb24vcG9seWZpbGwvYnJvd3Nlci1wb2x5ZmlsbC5taW4uanMnXG5yZXNvdXJjZXNbJ3BvbHlmaWxsL2Jyb3dzZXItcG9seWZpbGwubWluLmpzJ10gPSAkOVxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICQxMCBmcm9tICcuL2V4dGVuc2lvbi9wb2x5ZmlsbC93ZWJjcnlwdG8tbGluZXIuc2hpbS5qcydcbnJlc291cmNlc1sncG9seWZpbGwvd2ViY3J5cHRvLWxpbmVyLnNoaW0uanMnXSA9ICQxMFxuXG5jb25zdCBpZCA9ICdlb2ZrZGdraGZvZWJlY21hbWxqZmFlcGNrb2VjamhpYidcbmNvbnN0IG1hbmlmZXN0ID0gSlNPTi5wYXJzZShNYW5pZmVzdCBhcyBhbnkpXG5jb25zdCBlbnYgPVxuICAgIGxvY2F0aW9uLmhyZWYuc3RhcnRzV2l0aCgnaG9sb2Zsb3dzLWV4dGVuc2lvbjovLycpICYmIGxvY2F0aW9uLmhyZWYuZW5kc1dpdGgoJ19nZW5lcmF0ZWRfYmFja2dyb3VuZF9wYWdlLmh0bWwnKVxucmVnaXN0ZXJXZWJFeHRlbnNpb24oaWQsIG1hbmlmZXN0LCBlbnYgPyAnYmFja2dyb3VuZCBzY3JpcHQnIDogJ2NvbnRlbnQgc2NyaXB0JywgcmVzb3VyY2VzKVxuIl0sIm5hbWVzIjpbInRoaXMiLCJNZXNzYWdlQ2VudGVyIiwiSG9sb2Zsb3dzTWVzc2FnZUNlbnRlciIsIlJlYWxtQ29uc3RydWN0b3IiXSwibWFwcGluZ3MiOiI7OztJQUFBOzs7Ozs7OztBQVFBLGFBQWdCLFdBQVcsQ0FDdkIsUUFBYSxFQUNiLE9BQWlCLEVBQ2pCLGVBQXlCLEVBQ3pCLGFBQXVCLEVBQ3ZCLGFBQXVCLEVBQ3ZCLFdBQXFCO1FBRXJCLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQTs7UUFFbEIsS0FBSyxNQUFNLElBQUksSUFBSSxPQUFPO1lBQUUsSUFBSSxlQUFlLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLENBQUM7Z0JBQUUsTUFBTSxHQUFHLElBQUksQ0FBQTtRQUMzRixLQUFLLE1BQU0s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