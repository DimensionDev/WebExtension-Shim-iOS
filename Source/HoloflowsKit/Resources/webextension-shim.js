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
                    const req = new Request$1(id, method, params);
                    serializer.serialization(req).then(data => {
                        message.send(CALL, data);
                        map.set(id, [resolve, reject]);
                    }, reject);
                });
            },
        });
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
                update: binding(extensionID, 'browser.tabs.update')(),
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
                encodeStringOrBlob(obj).then(blob => Host['URL.createObjectURL'](extensionID, resourceID, blob));
            }
            return url;
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
            this.global.fetch = createFetch(this.extensionID);
            this.global.WebSocket = createWebSocket(this.extensionID);
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
        // {
        //     const src = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src')!
        //     Object.defineProperty(HTMLScriptElement.prototype, 'src', {
        //         get() {
        //             return src.get!.call(this)
        //         },
        //         set(val) {
        //             console.log('Loading ', val)
        //             if (val in preloadedResources || val.replace(/^\//, '') in preloadedResources) {
        //                 RunInGlobalScope(extensionID, preloadedResources[val] || preloadedResources[val.replace(/^\//, '')])
        //                 return true
        //             }
        //             src.set!.call(this, val)
        //             return true
        //         },
        //     })
        // }
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

    registerWebExtension('##ID##', ##Manifest##, '##Env##', ##Resources##);

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMvVVJMTWF0Y2hlci50cyIsIi4uL25vZGVfbW9kdWxlcy9yZWFsbXMtc2hpbS9kaXN0L3JlYWxtcy1zaGltLnVtZC5qcyIsIi4uL25vZGVfbW9kdWxlcy9AaG9sb2Zsb3dzL2tpdC9lcy9FeHRlbnNpb24vTWVzc2FnZUNlbnRlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9AaG9sb2Zsb3dzL2tpdC9lcy9FeHRlbnNpb24vQXN5bmMtQ2FsbC5qcyIsIi4uL3NyYy91dGlscy9Mb2NhbE1lc3NhZ2VzLnRzIiwiLi4vc3JjL3V0aWxzL2RlZXBDbG9uZS50cyIsIi4uL3NyYy9zaGltcy9icm93c2VyLm1lc3NhZ2UudHMiLCIuLi9zcmMvdXRpbHMvU3RyaW5nT3JCbG9iLnRzIiwiLi4vc3JjL3NoaW1zL1dlYlNvY2tldC50cyIsIi4uL3NyYy9SUEMudHMiLCIuLi9zcmMvc2hpbXMvYnJvd3Nlci50cyIsIi4uL3NyYy9zaGltcy9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTC50cyIsIi4uL3NyYy9zaGltcy9mZXRjaC50cyIsIi4uL3NyYy9zaGltcy9YUmF5VmlzaW9uLnRzIiwiLi4vc3JjL0V4dGVuc2lvbnMudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDaGVjayBpZiB0aGUgY3VycmVudCBsb2NhdGlvbiBtYXRjaGVzLiBVc2VkIGluIG1hbmlmZXN0Lmpzb24gcGFyc2VyXG4gKiBAcGFyYW0gbG9jYXRpb24gQ3VycmVudCBsb2NhdGlvblxuICogQHBhcmFtIG1hdGNoZXNcbiAqIEBwYXJhbSBleGNsdWRlX21hdGNoZXNcbiAqIEBwYXJhbSBpbmNsdWRlX2dsb2JzXG4gKiBAcGFyYW0gZXhjbHVkZV9nbG9ic1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hpbmdVUkwoXG4gICAgbG9jYXRpb246IFVSTCxcbiAgICBtYXRjaGVzOiBzdHJpbmdbXSxcbiAgICBleGNsdWRlX21hdGNoZXM6IHN0cmluZ1tdLFxuICAgIGluY2x1ZGVfZ2xvYnM6IHN0cmluZ1tdLFxuICAgIGV4Y2x1ZGVfZ2xvYnM6IHN0cmluZ1tdLFxuICAgIGFib3V0X2JsYW5rPzogYm9vbGVhbixcbikge1xuICAgIGxldCByZXN1bHQgPSBmYWxzZVxuICAgIC8vID8gV2UgZXZhbCBtYXRjaGVzIGZpcnN0IHRoZW4gZXZhbCBtaXNtYXRjaGVzXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIG1hdGNoZXMpIGlmIChtYXRjaGVzX21hdGNoZXIoaXRlbSwgbG9jYXRpb24sIGFib3V0X2JsYW5rKSkgcmVzdWx0ID0gdHJ1ZVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBleGNsdWRlX21hdGNoZXMpIGlmIChtYXRjaGVzX21hdGNoZXIoaXRlbSwgbG9jYXRpb24pKSByZXN1bHQgPSBmYWxzZVxuICAgIGlmIChpbmNsdWRlX2dsb2JzLmxlbmd0aCkgY29uc29sZS53YXJuKCdpbmNsdWRlX2dsb2JzIG5vdCBzdXBwb3J0ZWQgeWV0LicpXG4gICAgaWYgKGV4Y2x1ZGVfZ2xvYnMubGVuZ3RoKSBjb25zb2xlLndhcm4oJ2V4Y2x1ZGVfZ2xvYnMgbm90IHN1cHBvcnRlZCB5ZXQuJylcbiAgICByZXR1cm4gcmVzdWx0XG59XG4vKipcbiAqIFN1cHBvcnRlZCBwcm90b2NvbHNcbiAqL1xuY29uc3Qgc3VwcG9ydGVkUHJvdG9jb2xzOiByZWFkb25seSBzdHJpbmdbXSA9IFtcbiAgICAnaHR0cDonLFxuICAgICdodHRwczonLFxuICAgIC8vIFwid3M6XCIsXG4gICAgLy8gXCJ3c3M6XCIsXG4gICAgLy8gXCJmdHA6XCIsXG4gICAgLy8gXCJkYXRhOlwiLFxuICAgIC8vIFwiZmlsZTpcIlxuXVxuZnVuY3Rpb24gbWF0Y2hlc19tYXRjaGVyKF86IHN0cmluZywgbG9jYXRpb246IFVSTCwgYWJvdXRfYmxhbms/OiBib29sZWFuKSB7XG4gICAgaWYgKGxvY2F0aW9uLnRvU3RyaW5nKCkgPT09ICdhYm91dDpibGFuaycgJiYgYWJvdXRfYmxhbmspIHJldHVybiB0cnVlXG4gICAgaWYgKF8gPT09ICc8YWxsX3VybHM+Jykge1xuICAgICAgICBpZiAoc3VwcG9ydGVkUHJvdG9jb2xzLmluY2x1ZGVzKGxvY2F0aW9uLnByb3RvY29sKSkgcmV0dXJuIHRydWVcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGNvbnN0IFtydWxlLCB3aWxkY2FyZFByb3RvY29sXSA9IG5vcm1hbGl6ZVVSTChfKVxuICAgIGlmIChydWxlLnBvcnQgIT09ICcnKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoIXByb3RvY29sX21hdGNoZXIocnVsZS5wcm90b2NvbCwgbG9jYXRpb24ucHJvdG9jb2wsIHdpbGRjYXJkUHJvdG9jb2wpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAoIWhvc3RfbWF0Y2hlcihydWxlLmhvc3RuYW1lLCBsb2NhdGlvbi5ob3N0bmFtZSkpIHJldHVybiBmYWxzZVxuICAgIGlmICghcGF0aF9tYXRjaGVyKHJ1bGUucGF0aG5hbWUsIGxvY2F0aW9uLnBhdGhuYW1lLCBsb2NhdGlvbi5zZWFyY2gpKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gdHJ1ZVxufVxuLyoqXG4gKiBOb3JtYWxpemVVUkxcbiAqIEBwYXJhbSBfIC0gVVJMIGRlZmluZWQgaW4gbWFuaWZlc3RcbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplVVJMKF86IHN0cmluZyk6IFtVUkwsIGJvb2xlYW5dIHtcbiAgICBpZiAoXy5zdGFydHNXaXRoKCcqOi8vJykpIHJldHVybiBbbmV3IFVSTChfLnJlcGxhY2UoL15cXCo6LywgJ2h0dHBzOicpKSwgdHJ1ZV1cbiAgICByZXR1cm4gW25ldyBVUkwoXyksIGZhbHNlXVxufVxuZnVuY3Rpb24gcHJvdG9jb2xfbWF0Y2hlcihtYXRjaGVyUHJvdG9jb2w6IHN0cmluZywgY3VycmVudFByb3RvY29sOiBzdHJpbmcsIHdpbGRjYXJkUHJvdG9jb2w6IGJvb2xlYW4pIHtcbiAgICAvLyA/IG9ubHkgYGh0dHA6YCBhbmQgYGh0dHBzOmAgaXMgc3VwcG9ydGVkIGN1cnJlbnRseVxuICAgIGlmICghc3VwcG9ydGVkUHJvdG9jb2xzLmluY2x1ZGVzKGN1cnJlbnRQcm90b2NvbCkpIHJldHVybiBmYWxzZVxuICAgIC8vID8gaWYgd2FudGVkIHByb3RvY29sIGlzIFwiKjpcIiwgbWF0Y2ggZXZlcnl0aGluZ1xuICAgIGlmICh3aWxkY2FyZFByb3RvY29sKSByZXR1cm4gdHJ1ZVxuICAgIGlmIChtYXRjaGVyUHJvdG9jb2wgPT09IGN1cnJlbnRQcm90b2NvbCkgcmV0dXJuIHRydWVcbiAgICByZXR1cm4gZmFsc2Vcbn1cbmZ1bmN0aW9uIGhvc3RfbWF0Y2hlcihtYXRjaGVySG9zdDogc3RyaW5nLCBjdXJyZW50SG9zdDogc3RyaW5nKSB7XG4gICAgLy8gPyAlMkEgaXMgKlxuICAgIGlmIChtYXRjaGVySG9zdCA9PT0gJyUyQScpIHJldHVybiB0cnVlXG4gICAgaWYgKG1hdGNoZXJIb3N0LnN0YXJ0c1dpdGgoJyUyQS4nKSkge1xuICAgICAgICBjb25zdCBwYXJ0ID0gbWF0Y2hlckhvc3QucmVwbGFjZSgvXiUyQS8sICcnKVxuICAgICAgICBpZiAocGFydCA9PT0gY3VycmVudEhvc3QpIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gY3VycmVudEhvc3QuZW5kc1dpdGgocGFydClcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoZXJIb3N0ID09PSBjdXJyZW50SG9zdFxufVxuZnVuY3Rpb24gcGF0aF9tYXRjaGVyKG1hdGNoZXJQYXRoOiBzdHJpbmcsIGN1cnJlbnRQYXRoOiBzdHJpbmcsIGN1cnJlbnRTZWFyY2g6IHN0cmluZykge1xuICAgIGlmICghbWF0Y2hlclBhdGguc3RhcnRzV2l0aCgnLycpKSByZXR1cm4gZmFsc2VcbiAgICBpZiAobWF0Y2hlclBhdGggPT09ICcvKicpIHJldHVybiB0cnVlXG4gICAgLy8gPyAnL2EvYi9jJyBtYXRjaGVzICcvYS9iL2MjMTIzJyBidXQgbm90ICcvYS9iL2M/MTIzJ1xuICAgIGlmIChtYXRjaGVyUGF0aCA9PT0gY3VycmVudFBhdGggJiYgY3VycmVudFNlYXJjaCA9PT0gJycpIHJldHVybiB0cnVlXG4gICAgLy8gPyAnL2EvYi8qJyBtYXRjaGVzIGV2ZXJ5dGhpbmcgc3RhcnRzV2l0aCAnL2EvYi8nXG4gICAgaWYgKG1hdGNoZXJQYXRoLmVuZHNXaXRoKCcqJykgJiYgY3VycmVudFBhdGguc3RhcnRzV2l0aChtYXRjaGVyUGF0aC5zbGljZSh1bmRlZmluZWQsIC0xKSkpIHJldHVybiB0cnVlXG4gICAgaWYgKG1hdGNoZXJQYXRoLmluZGV4T2YoJyonKSA9PT0gLTEpIHJldHVybiBtYXRjaGVyUGF0aCA9PT0gY3VycmVudFBhdGhcbiAgICBjb25zb2xlLndhcm4oJ05vdCBzdXBwb3J0ZWQgcGF0aCBtYXRjaGVyIGluIG1hbmlmZXN0Lmpzb24nLCBtYXRjaGVyUGF0aClcbiAgICByZXR1cm4gdHJ1ZVxufVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZmFjdG9yeSkgOlxuICAoZ2xvYmFsID0gZ2xvYmFsIHx8IHNlbGYsIGdsb2JhbC5SZWFsbSA9IGZhY3RvcnkoKSk7XG59KHRoaXMsIGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIHdlJ2QgbGlrZSB0byBhYmFuZG9uLCBidXQgd2UgY2FuJ3QsIHNvIGp1c3Qgc2NyZWFtIGFuZCBicmVhayBhIGxvdCBvZlxuICAvLyBzdHVmZi4gSG93ZXZlciwgc2luY2Ugd2UgYXJlbid0IHJlYWxseSBhYm9ydGluZyB0aGUgcHJvY2VzcywgYmUgY2FyZWZ1bCB0b1xuICAvLyBub3QgdGhyb3cgYW4gRXJyb3Igb2JqZWN0IHdoaWNoIGNvdWxkIGJlIGNhcHR1cmVkIGJ5IGNoaWxkLVJlYWxtIGNvZGUgYW5kXG4gIC8vIHVzZWQgdG8gYWNjZXNzIHRoZSAodG9vLXBvd2VyZnVsKSBwcmltYWwtcmVhbG0gRXJyb3Igb2JqZWN0LlxuXG4gIGZ1bmN0aW9uIHRocm93VGFudHJ1bShzLCBlcnIgPSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCBtc2cgPSBgcGxlYXNlIHJlcG9ydCBpbnRlcm5hbCBzaGltIGVycm9yOiAke3N9YDtcblxuICAgIC8vIHdlIHdhbnQgdG8gbG9nIHRoZXNlICdzaG91bGQgbmV2ZXIgaGFwcGVuJyB0aGluZ3MuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgaWYgKGVycikge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCR7ZXJyfWApO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCR7ZXJyLnN0YWNrfWApO1xuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1kZWJ1Z2dlclxuICAgIGRlYnVnZ2VyO1xuICAgIHRocm93IG1zZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGFzc2VydChjb25kaXRpb24sIG1lc3NhZ2UpIHtcbiAgICBpZiAoIWNvbmRpdGlvbikge1xuICAgICAgdGhyb3dUYW50cnVtKG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlbW92ZSBjb2RlIG1vZGlmaWNhdGlvbnMuXG4gIGZ1bmN0aW9uIGNsZWFudXBTb3VyY2Uoc3JjKSB7XG4gICAgcmV0dXJuIHNyYztcbiAgfVxuXG4gIC8vIGJ1aWxkQ2hpbGRSZWFsbSBpcyBpbW1lZGlhdGVseSB0dXJuZWQgaW50byBhIHN0cmluZywgYW5kIHRoaXMgZnVuY3Rpb24gaXNcbiAgLy8gbmV2ZXIgcmVmZXJlbmNlZCBhZ2FpbiwgYmVjYXVzZSBpdCBjbG9zZXMgb3ZlciB0aGUgd3JvbmcgaW50cmluc2ljc1xuXG4gIGZ1bmN0aW9uIGJ1aWxkQ2hpbGRSZWFsbSh1bnNhZmVSZWMsIEJhc2VSZWFsbSkge1xuICAgIGNvbnN0IHtcbiAgICAgIGluaXRSb290UmVhbG0sXG4gICAgICBpbml0Q29tcGFydG1lbnQsXG4gICAgICBnZXRSZWFsbUdsb2JhbCxcbiAgICAgIHJlYWxtRXZhbHVhdGVcbiAgICB9ID0gQmFzZVJlYWxtO1xuXG4gICAgLy8gVGhpcyBPYmplY3QgYW5kIFJlZmxlY3QgYXJlIGJyYW5kIG5ldywgZnJvbSBhIG5ldyB1bnNhZmVSZWMsIHNvIG5vIHVzZXJcbiAgICAvLyBjb2RlIGhhcyBiZWVuIHJ1biBvciBoYWQgYSBjaGFuY2UgdG8gbWFuaXB1bGF0ZSB0aGVtLiBXZSBleHRyYWN0IHRoZXNlXG4gICAgLy8gcHJvcGVydGllcyBmb3IgYnJldml0eSwgbm90IGZvciBzZWN1cml0eS4gRG9uJ3QgZXZlciBydW4gdGhpcyBmdW5jdGlvblxuICAgIC8vICphZnRlciogdXNlciBjb2RlIGhhcyBoYWQgYSBjaGFuY2UgdG8gcG9sbHV0ZSBpdHMgZW52aXJvbm1lbnQsIG9yIGl0XG4gICAgLy8gY291bGQgYmUgdXNlZCB0byBnYWluIGFjY2VzcyB0byBCYXNlUmVhbG0gYW5kIHByaW1hbC1yZWFsbSBFcnJvclxuICAgIC8vIG9iamVjdHMuXG4gICAgY29uc3QgeyBjcmVhdGUsIGRlZmluZVByb3BlcnRpZXMgfSA9IE9iamVjdDtcblxuICAgIGNvbnN0IGVycm9yQ29uc3RydWN0b3JzID0gbmV3IE1hcChbXG4gICAgICBbJ0V2YWxFcnJvcicsIEV2YWxFcnJvcl0sXG4gICAgICBbJ1JhbmdlRXJyb3InLCBSYW5nZUVycm9yXSxcbiAgICAgIFsnUmVmZXJlbmNlRXJyb3InLCBSZWZlcmVuY2VFcnJvcl0sXG4gICAgICBbJ1N5bnRheEVycm9yJywgU3ludGF4RXJyb3JdLFxuICAgICAgWydUeXBlRXJyb3InLCBUeXBlRXJyb3JdLFxuICAgICAgWydVUklFcnJvcicsIFVSSUVycm9yXVxuICAgIF0pO1xuXG4gICAgLy8gTGlrZSBSZWFsbS5hcHBseSBleGNlcHQgdGhhdCBpdCBjYXRjaGVzIGFueXRoaW5nIHRocm93biBhbmQgcmV0aHJvd3MgaXRcbiAgICAvLyBhcyBhbiBFcnJvciBmcm9tIHRoaXMgcmVhbG1cbiAgICBmdW5jdGlvbiBjYWxsQW5kV3JhcEVycm9yKHRhcmdldCwgLi4uYXJncykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRhcmdldCguLi5hcmdzKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoT2JqZWN0KGVycikgIT09IGVycikge1xuICAgICAgICAgIC8vIGVyciBpcyBhIHByaW1pdGl2ZSB2YWx1ZSwgd2hpY2ggaXMgc2FmZSB0byByZXRocm93XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgICAgIGxldCBlTmFtZSwgZU1lc3NhZ2UsIGVTdGFjaztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBUaGUgY2hpbGQgZW52aXJvbm1lbnQgbWlnaHQgc2VlayB0byB1c2UgJ2VycicgdG8gcmVhY2ggdGhlXG4gICAgICAgICAgLy8gcGFyZW50J3MgaW50cmluc2ljcyBhbmQgY29ycnVwdCB0aGVtLiBgJHtlcnIubmFtZX1gIHdpbGwgY2F1c2VcbiAgICAgICAgICAvLyBzdHJpbmcgY29lcmNpb24gb2YgJ2Vyci5uYW1lJy4gSWYgZXJyLm5hbWUgaXMgYW4gb2JqZWN0IChwcm9iYWJseVxuICAgICAgICAgIC8vIGEgU3RyaW5nIG9mIHRoZSBwYXJlbnQgUmVhbG0pLCB0aGUgY29lcmNpb24gdXNlc1xuICAgICAgICAgIC8vIGVyci5uYW1lLnRvU3RyaW5nKCksIHdoaWNoIGlzIHVuZGVyIHRoZSBjb250cm9sIG9mIHRoZSBwYXJlbnQuIElmXG4gICAgICAgICAgLy8gZXJyLm5hbWUgd2VyZSBhIHByaW1pdGl2ZSAoZS5nLiBhIG51bWJlciksIGl0IHdvdWxkIHVzZVxuICAgICAgICAgIC8vIE51bWJlci50b1N0cmluZyhlcnIubmFtZSksIHVzaW5nIHRoZSBjaGlsZCdzIHZlcnNpb24gb2YgTnVtYmVyXG4gICAgICAgICAgLy8gKHdoaWNoIHRoZSBjaGlsZCBjb3VsZCBtb2RpZnkgdG8gY2FwdHVyZSBpdHMgYXJndW1lbnQgZm9yIGxhdGVyXG4gICAgICAgICAgLy8gdXNlKSwgaG93ZXZlciBwcmltaXRpdmVzIGRvbid0IGhhdmUgcHJvcGVydGllcyBsaWtlIC5wcm90b3R5cGUgc29cbiAgICAgICAgICAvLyB0aGV5IGFyZW4ndCB1c2VmdWwgZm9yIGFuIGF0dGFjay5cbiAgICAgICAgICBlTmFtZSA9IGAke2Vyci5uYW1lfWA7XG4gICAgICAgICAgZU1lc3NhZ2UgPSBgJHtlcnIubWVzc2FnZX1gO1xuICAgICAgICAgIGVTdGFjayA9IGAke2Vyci5zdGFjayB8fCBlTWVzc2FnZX1gO1xuICAgICAgICAgIC8vIGVOYW1lL2VNZXNzYWdlL2VTdGFjayBhcmUgbm93IGNoaWxkLXJlYWxtIHByaW1pdGl2ZSBzdHJpbmdzLCBhbmRcbiAgICAgICAgICAvLyBzYWZlIHRvIGV4cG9zZVxuICAgICAgICB9IGNhdGNoIChpZ25vcmVkKSB7XG4gICAgICAgICAgLy8gaWYgZXJyLm5hbWUudG9TdHJpbmcoKSB0aHJvd3MsIGtlZXAgdGhlIChwYXJlbnQgcmVhbG0pIEVycm9yIGF3YXlcbiAgICAgICAgICAvLyBmcm9tIHRoZSBjaGlsZFxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndW5rbm93biBlcnJvcicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IEVycm9yQ29uc3RydWN0b3IgPSBlcnJvckNvbnN0cnVjdG9ycy5nZXQoZU5hbWUpIHx8IEVycm9yO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvckNvbnN0cnVjdG9yKGVNZXNzYWdlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyMikge1xuICAgICAgICAgIGVycjIuc3RhY2sgPSBlU3RhY2s7IC8vIHJlcGxhY2Ugd2l0aCB0aGUgY2FwdHVyZWQgaW5uZXIgc3RhY2tcbiAgICAgICAgICB0aHJvdyBlcnIyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY2xhc3MgUmVhbG0ge1xuICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8vIFRoZSBSZWFsbSBjb25zdHJ1Y3RvciBpcyBub3QgaW50ZW5kZWQgdG8gYmUgdXNlZCB3aXRoIHRoZSBuZXcgb3BlcmF0b3JcbiAgICAgICAgLy8gb3IgdG8gYmUgc3ViY2xhc3NlZC4gSXQgbWF5IGJlIHVzZWQgYXMgdGhlIHZhbHVlIG9mIGFuIGV4dGVuZHMgY2xhdXNlXG4gICAgICAgIC8vIG9mIGEgY2xhc3MgZGVmaW5pdGlvbiBidXQgYSBzdXBlciBjYWxsIHRvIHRoZSBSZWFsbSBjb25zdHJ1Y3RvciB3aWxsXG4gICAgICAgIC8vIGNhdXNlIGFuIGV4Y2VwdGlvbi5cblxuICAgICAgICAvLyBXaGVuIFJlYWxtIGlzIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLCBhbiBleGNlcHRpb24gaXMgYWxzbyByYWlzZWQgYmVjYXVzZVxuICAgICAgICAvLyBhIGNsYXNzIGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBpbnZva2VkIHdpdGhvdXQgJ25ldycuXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1JlYWxtIGlzIG5vdCBhIGNvbnN0cnVjdG9yJyk7XG4gICAgICB9XG5cbiAgICAgIHN0YXRpYyBtYWtlUm9vdFJlYWxtKG9wdGlvbnMpIHtcbiAgICAgICAgLy8gVGhpcyBpcyB0aGUgZXhwb3NlZCBpbnRlcmZhY2UuXG4gICAgICAgIG9wdGlvbnMgPSBPYmplY3Qob3B0aW9ucyk7IC8vIHRvZG86IHNhbml0aXplXG5cbiAgICAgICAgLy8gQnlwYXNzIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICAgICAgY29uc3QgciA9IGNyZWF0ZShSZWFsbS5wcm90b3R5cGUpO1xuICAgICAgICBjYWxsQW5kV3JhcEVycm9yKGluaXRSb290UmVhbG0sIHVuc2FmZVJlYywgciwgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiByO1xuICAgICAgfVxuXG4gICAgICBzdGF0aWMgbWFrZUNvbXBhcnRtZW50KCkge1xuICAgICAgICAvLyBCeXBhc3MgdGhlIGNvbnN0cnVjdG9yLlxuICAgICAgICBjb25zdCByID0gY3JlYXRlKFJlYWxtLnByb3RvdHlwZSk7XG4gICAgICAgIGNhbGxBbmRXcmFwRXJyb3IoaW5pdENvbXBhcnRtZW50LCB1bnNhZmVSZWMsIHIpO1xuICAgICAgICByZXR1cm4gcjtcbiAgICAgIH1cblxuICAgICAgLy8gd2Ugb21pdCB0aGUgY29uc3RydWN0b3IgYmVjYXVzZSBpdCBpcyBlbXB0eS4gQWxsIHRoZSBwZXJzb25hbGl6YXRpb25cbiAgICAgIC8vIHRha2VzIHBsYWNlIGluIG9uZSBvZiB0aGUgdHdvIHN0YXRpYyBtZXRob2RzLFxuICAgICAgLy8gbWFrZVJvb3RSZWFsbS9tYWtlQ29tcGFydG1lbnRcblxuICAgICAgZ2V0IGdsb2JhbCgpIHtcbiAgICAgICAgLy8gdGhpcyBpcyBzYWZlIGFnYWluc3QgYmVpbmcgY2FsbGVkIHdpdGggc3RyYW5nZSAndGhpcycgYmVjYXVzZVxuICAgICAgICAvLyBiYXNlR2V0R2xvYmFsIGltbWVkaWF0ZWx5IGRvZXMgYSB0cmFkZW1hcmsgY2hlY2sgKGl0IGZhaWxzIHVubGVzc1xuICAgICAgICAvLyB0aGlzICd0aGlzJyBpcyBwcmVzZW50IGluIGEgd2Vha21hcCB0aGF0IGlzIG9ubHkgcG9wdWxhdGVkIHdpdGhcbiAgICAgICAgLy8gbGVnaXRpbWF0ZSBSZWFsbSBpbnN0YW5jZXMpXG4gICAgICAgIHJldHVybiBjYWxsQW5kV3JhcEVycm9yKGdldFJlYWxtR2xvYmFsLCB0aGlzKTtcbiAgICAgIH1cblxuICAgICAgZXZhbHVhdGUoeCwgZW5kb3dtZW50cykge1xuICAgICAgICAvLyBzYWZlIGFnYWluc3Qgc3RyYW5nZSAndGhpcycsIGFzIGFib3ZlXG4gICAgICAgIHJldHVybiBjYWxsQW5kV3JhcEVycm9yKHJlYWxtRXZhbHVhdGUsIHRoaXMsIHgsIGVuZG93bWVudHMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGRlZmluZVByb3BlcnRpZXMoUmVhbG0sIHtcbiAgICAgIHRvU3RyaW5nOiB7XG4gICAgICAgIHZhbHVlOiAoKSA9PiAnZnVuY3Rpb24gUmVhbG0oKSB7IFtzaGltIGNvZGVdIH0nLFxuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGRlZmluZVByb3BlcnRpZXMoUmVhbG0ucHJvdG90eXBlLCB7XG4gICAgICB0b1N0cmluZzoge1xuICAgICAgICB2YWx1ZTogKCkgPT4gJ1tvYmplY3QgUmVhbG1dJyxcbiAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gUmVhbG07XG4gIH1cblxuICAvLyBUaGUgcGFyZW50aGVzZXMgbWVhbnMgd2UgZG9uJ3QgYmluZCB0aGUgJ2J1aWxkQ2hpbGRSZWFsbScgbmFtZSBpbnNpZGUgdGhlXG4gIC8vIGNoaWxkJ3MgbmFtZXNwYWNlLiB0aGlzIHdvdWxkIGFjY2VwdCBhbiBhbm9ueW1vdXMgZnVuY3Rpb24gZGVjbGFyYXRpb24uXG4gIC8vIGZ1bmN0aW9uIGV4cHJlc3Npb24gKG5vdCBhIGRlY2xhcmF0aW9uKSBzbyBpdCBoYXMgYSBjb21wbGV0aW9uIHZhbHVlLlxuICBjb25zdCBidWlsZENoaWxkUmVhbG1TdHJpbmcgPSBjbGVhbnVwU291cmNlKFxuICAgIGAndXNlIHN0cmljdCc7ICgke2J1aWxkQ2hpbGRSZWFsbX0pYFxuICApO1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZVJlYWxtRmFjYWRlKHVuc2FmZVJlYywgQmFzZVJlYWxtKSB7XG4gICAgY29uc3QgeyB1bnNhZmVFdmFsIH0gPSB1bnNhZmVSZWM7XG5cbiAgICAvLyBUaGUgQmFzZVJlYWxtIGlzIHRoZSBSZWFsbSBjbGFzcyBjcmVhdGVkIGJ5XG4gICAgLy8gdGhlIHNoaW0uIEl0J3Mgb25seSB2YWxpZCBmb3IgdGhlIGNvbnRleHQgd2hlcmVcbiAgICAvLyBpdCB3YXMgcGFyc2VkLlxuXG4gICAgLy8gVGhlIFJlYWxtIGZhY2FkZSBpcyBhIGxpZ2h0d2VpZ2h0IGNsYXNzIGJ1aWx0IGluIHRoZVxuICAgIC8vIGNvbnRleHQgYSBkaWZmZXJlbnQgY29udGV4dCwgdGhhdCBwcm92aWRlIGEgZnVsbHlcbiAgICAvLyBmdW5jdGlvbmFsIFJlYWxtIGNsYXNzIHVzaW5nIHRoZSBpbnRyaXNpY3NcbiAgICAvLyBvZiB0aGF0IGNvbnRleHQuXG5cbiAgICAvLyBUaGlzIHByb2Nlc3MgaXMgc2ltcGxpZmllZCBiZWNhdXNlIGFsbCBtZXRob2RzXG4gICAgLy8gYW5kIHByb3BlcnRpZXMgb24gYSByZWFsbSBpbnN0YW5jZSBhbHJlYWR5IHJldHVyblxuICAgIC8vIHZhbHVlcyB1c2luZyB0aGUgaW50cmluc2ljcyBvZiB0aGUgcmVhbG0ncyBjb250ZXh0LlxuXG4gICAgLy8gSW52b2tlIHRoZSBCYXNlUmVhbG0gY29uc3RydWN0b3Igd2l0aCBSZWFsbSBhcyB0aGUgcHJvdG90eXBlLlxuICAgIHJldHVybiB1bnNhZmVFdmFsKGJ1aWxkQ2hpbGRSZWFsbVN0cmluZykodW5zYWZlUmVjLCBCYXNlUmVhbG0pO1xuICB9XG5cbiAgLy8gRGVjbGFyZSBzaG9ydGhhbmQgZnVuY3Rpb25zLiBTaGFyaW5nIHRoZXNlIGRlY2xhcmF0aW9ucyBhY3Jvc3MgbW9kdWxlc1xuICAvLyBpbXByb3ZlcyBib3RoIGNvbnNpc3RlbmN5IGFuZCBtaW5pZmljYXRpb24uIFVudXNlZCBkZWNsYXJhdGlvbnMgYXJlXG4gIC8vIGRyb3BwZWQgYnkgdGhlIHRyZWUgc2hha2luZyBwcm9jZXNzLlxuXG4gIC8vIHdlIGNhcHR1cmUgdGhlc2UsIG5vdCBqdXN0IGZvciBicmV2aXR5LCBidXQgZm9yIHNlY3VyaXR5LiBJZiBhbnkgY29kZVxuICAvLyBtb2RpZmllcyBPYmplY3QgdG8gY2hhbmdlIHdoYXQgJ2Fzc2lnbicgcG9pbnRzIHRvLCB0aGUgUmVhbG0gc2hpbSB3b3VsZCBiZVxuICAvLyBjb3JydXB0ZWQuXG5cbiAgY29uc3Qge1xuICAgIGFzc2lnbixcbiAgICBjcmVhdGUsXG4gICAgZnJlZXplLFxuICAgIGRlZmluZVByb3BlcnRpZXMsIC8vIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBpcyBhbGxvd2VkIHRvIGZhaWxcbiAgICAvLyBzaWxlbnRsdHksIHVzZSBPYmplY3QuZGVmaW5lUHJvcGVydGllcyBpbnN0ZWFkLlxuICAgIGdldE93blByb3BlcnR5RGVzY3JpcHRvcixcbiAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzLFxuICAgIGdldE93blByb3BlcnR5TmFtZXMsXG4gICAgZ2V0UHJvdG90eXBlT2YsXG4gICAgc2V0UHJvdG90eXBlT2ZcbiAgfSA9IE9iamVjdDtcblxuICBjb25zdCB7XG4gICAgYXBwbHksXG4gICAgb3duS2V5cyAvLyBSZWZsZWN0Lm93bktleXMgaW5jbHVkZXMgU3ltYm9scyBhbmQgdW5lbnVtZXJhYmxlcyxcbiAgICAvLyB1bmxpa2UgT2JqZWN0LmtleXMoKVxuICB9ID0gUmVmbGVjdDtcblxuICAvKipcbiAgICogdW5jdXJyeVRoaXMoKSBTZWVcbiAgICogaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9Y29udmVudGlvbnM6c2FmZV9tZXRhX3Byb2dyYW1taW5nXG4gICAqIHdoaWNoIG9ubHkgbGl2ZXMgYXRcbiAgICogaHR0cDovL3dlYi5hcmNoaXZlLm9yZy93ZWIvMjAxNjA4MDUyMjU3MTAvaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9Y29udmVudGlvbnM6c2FmZV9tZXRhX3Byb2dyYW1taW5nXG4gICAqXG4gICAqIFBlcmZvcm1hbmNlOlxuICAgKiAxLiBUaGUgbmF0aXZlIGNhbGwgaXMgYWJvdXQgMTB4IGZhc3RlciBvbiBGRiB0aGFuIGNocm9tZVxuICAgKiAyLiBUaGUgdmVyc2lvbiB1c2luZyBGdW5jdGlvbi5iaW5kKCkgaXMgYWJvdXQgMTAweCBzbG93ZXIgb24gRkYsXG4gICAqICAgIGVxdWFsIG9uIGNocm9tZSwgMnggc2xvd2VyIG9uIFNhZmFyaVxuICAgKiAzLiBUaGUgdmVyc2lvbiB1c2luZyBhIHNwcmVhZCBhbmQgUmVmbGVjdC5hcHBseSgpIGlzIGFib3V0IDEweFxuICAgKiAgICBzbG93ZXIgb24gRkYsIGVxdWFsIG9uIGNocm9tZSwgMnggc2xvd2VyIG9uIFNhZmFyaVxuICAgKlxuICAgKiBjb25zdCBiaW5kID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQ7XG4gICAqIGNvbnN0IHVuY3VycnlUaGlzID0gYmluZC5iaW5kKGJpbmQuY2FsbCk7XG4gICAqL1xuICBjb25zdCB1bmN1cnJ5VGhpcyA9IGZuID0+ICh0aGlzQXJnLCAuLi5hcmdzKSA9PiBhcHBseShmbiwgdGhpc0FyZywgYXJncyk7XG5cbiAgLy8gV2UgYWxzbyBjYXB0dXJlIHRoZXNlIGZvciBzZWN1cml0eTogY2hhbmdlcyB0byBBcnJheS5wcm90b3R5cGUgYWZ0ZXIgdGhlXG4gIC8vIFJlYWxtIHNoaW0gcnVucyBzaG91bGRuJ3QgYWZmZWN0IHN1YnNlcXVlbnQgUmVhbG0gb3BlcmF0aW9ucy5cbiAgY29uc3Qgb2JqZWN0SGFzT3duUHJvcGVydHkgPSB1bmN1cnJ5VGhpcyhcbiAgICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgICApLFxuICAgIGFycmF5RmlsdGVyID0gdW5jdXJyeVRoaXMoQXJyYXkucHJvdG90eXBlLmZpbHRlciksXG4gICAgYXJyYXlQb3AgPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUucG9wKSxcbiAgICBhcnJheUpvaW4gPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUuam9pbiksXG4gICAgYXJyYXlDb25jYXQgPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUuY29uY2F0KSxcbiAgICByZWdleHBUZXN0ID0gdW5jdXJyeVRoaXMoUmVnRXhwLnByb3RvdHlwZS50ZXN0KSxcbiAgICBzdHJpbmdJbmNsdWRlcyA9IHVuY3VycnlUaGlzKFN0cmluZy5wcm90b3R5cGUuaW5jbHVkZXMpO1xuXG4gIC8vIFRoZXNlIHZhbHVlIHByb3BlcnRpZXMgb2YgdGhlIGdsb2JhbCBvYmplY3QgYXJlIG5vbi13cml0YWJsZSxcbiAgLy8gbm9uLWNvbmZpZ3VyYWJsZSBkYXRhIHByb3BlcnRpZXMuXG4gIGNvbnN0IGZyb3plbkdsb2JhbFByb3BlcnR5TmFtZXMgPSBbXG4gICAgLy8gKioqIDE4LjEgVmFsdWUgUHJvcGVydGllcyBvZiB0aGUgR2xvYmFsIE9iamVjdFxuXG4gICAgJ0luZmluaXR5JyxcbiAgICAnTmFOJyxcbiAgICAndW5kZWZpbmVkJ1xuICBdO1xuXG4gIC8vIEFsbCB0aGUgZm9sbG93aW5nIHN0ZGxpYiBpdGVtcyBoYXZlIHRoZSBzYW1lIG5hbWUgb24gYm90aCBvdXIgaW50cmluc2ljc1xuICAvLyBvYmplY3QgYW5kIG9uIHRoZSBnbG9iYWwgb2JqZWN0LiBVbmxpa2UgSW5maW5pdHkvTmFOL3VuZGVmaW5lZCwgdGhlc2VcbiAgLy8gc2hvdWxkIGFsbCBiZSB3cml0YWJsZSBhbmQgY29uZmlndXJhYmxlLiBUaGlzIGlzIGRpdmlkZWQgaW50byB0d29cbiAgLy8gc2V0cy4gVGhlIHN0YWJsZSBvbmVzIGFyZSB0aG9zZSB0aGUgc2hpbSBjYW4gZnJlZXplIGVhcmx5IGJlY2F1c2VcbiAgLy8gd2UgZG9uJ3QgZXhwZWN0IGFueW9uZSB3aWxsIHdhbnQgdG8gbXV0YXRlIHRoZW0uIFRoZSB1bnN0YWJsZSBvbmVzXG4gIC8vIGFyZSB0aGUgb25lcyB0aGF0IHdlIGNvcnJlY3RseSBpbml0aWFsaXplIHRvIHdyaXRhYmxlIGFuZFxuICAvLyBjb25maWd1cmFibGUgc28gdGhhdCB0aGV5IGNhbiBzdGlsbCBiZSByZXBsYWNlZCBvciByZW1vdmVkLlxuICBjb25zdCBzdGFibGVHbG9iYWxQcm9wZXJ0eU5hbWVzID0gW1xuICAgIC8vICoqKiAxOC4yIEZ1bmN0aW9uIFByb3BlcnRpZXMgb2YgdGhlIEdsb2JhbCBPYmplY3RcblxuICAgIC8vICdldmFsJywgLy8gY29tZXMgZnJvbSBzYWZlRXZhbCBpbnN0ZWFkXG4gICAgJ2lzRmluaXRlJyxcbiAgICAnaXNOYU4nLFxuICAgICdwYXJzZUZsb2F0JyxcbiAgICAncGFyc2VJbnQnLFxuXG4gICAgJ2RlY29kZVVSSScsXG4gICAgJ2RlY29kZVVSSUNvbXBvbmVudCcsXG4gICAgJ2VuY29kZVVSSScsXG4gICAgJ2VuY29kZVVSSUNvbXBvbmVudCcsXG5cbiAgICAvLyAqKiogMTguMyBDb25zdHJ1Y3RvciBQcm9wZXJ0aWVzIG9mIHRoZSBHbG9iYWwgT2JqZWN0XG5cbiAgICAnQXJyYXknLFxuICAgICdBcnJheUJ1ZmZlcicsXG4gICAgJ0Jvb2xlYW4nLFxuICAgICdEYXRhVmlldycsXG4gICAgLy8gJ0RhdGUnLCAgLy8gVW5zdGFibGVcbiAgICAvLyAnRXJyb3InLCAgLy8gVW5zdGFibGVcbiAgICAnRXZhbEVycm9yJyxcbiAgICAnRmxvYXQzMkFycmF5JyxcbiAgICAnRmxvYXQ2NEFycmF5JyxcbiAgICAvLyAnRnVuY3Rpb24nLCAgLy8gY29tZXMgZnJvbSBzYWZlRnVuY3Rpb24gaW5zdGVhZFxuICAgICdJbnQ4QXJyYXknLFxuICAgICdJbnQxNkFycmF5JyxcbiAgICAnSW50MzJBcnJheScsXG4gICAgJ01hcCcsXG4gICAgJ051bWJlcicsXG4gICAgJ09iamVjdCcsXG4gICAgLy8gJ1Byb21pc2UnLCAgLy8gVW5zdGFibGVcbiAgICAvLyAnUHJveHknLCAgLy8gVW5zdGFibGVcbiAgICAnUmFuZ2VFcnJvcicsXG4gICAgJ1JlZmVyZW5jZUVycm9yJyxcbiAgICAvLyAnUmVnRXhwJywgIC8vIFVuc3RhYmxlXG4gICAgJ1NldCcsXG4gICAgLy8gJ1NoYXJlZEFycmF5QnVmZmVyJyAgLy8gcmVtb3ZlZCBvbiBKYW4gNSwgMjAxOFxuICAgICdTdHJpbmcnLFxuICAgICdTeW1ib2wnLFxuICAgICdTeW50YXhFcnJvcicsXG4gICAgJ1R5cGVFcnJvcicsXG4gICAgJ1VpbnQ4QXJyYXknLFxuICAgICdVaW50OENsYW1wZWRBcnJheScsXG4gICAgJ1VpbnQxNkFycmF5JyxcbiAgICAnVWludDMyQXJyYXknLFxuICAgICdVUklFcnJvcicsXG4gICAgJ1dlYWtNYXAnLFxuICAgICdXZWFrU2V0JyxcblxuICAgIC8vICoqKiAxOC40IE90aGVyIFByb3BlcnRpZXMgb2YgdGhlIEdsb2JhbCBPYmplY3RcblxuICAgIC8vICdBdG9taWNzJywgLy8gcmVtb3ZlZCBvbiBKYW4gNSwgMjAxOFxuICAgICdKU09OJyxcbiAgICAnTWF0aCcsXG4gICAgJ1JlZmxlY3QnLFxuXG4gICAgLy8gKioqIEFubmV4IEJcblxuICAgICdlc2NhcGUnLFxuICAgICd1bmVzY2FwZSdcblxuICAgIC8vICoqKiBFQ01BLTQwMlxuXG4gICAgLy8gJ0ludGwnICAvLyBVbnN0YWJsZVxuXG4gICAgLy8gKioqIEVTTmV4dFxuXG4gICAgLy8gJ1JlYWxtJyAvLyBDb21lcyBmcm9tIGNyZWF0ZVJlYWxtR2xvYmFsT2JqZWN0KClcbiAgXTtcblxuICBjb25zdCB1bnN0YWJsZUdsb2JhbFByb3BlcnR5TmFtZXMgPSBbXG4gICAgJ0RhdGUnLFxuICAgICdFcnJvcicsXG4gICAgJ1Byb21pc2UnLFxuICAgICdQcm94eScsXG4gICAgJ1JlZ0V4cCcsXG4gICAgJ0ludGwnXG4gIF07XG5cbiAgZnVuY3Rpb24gZ2V0U2hhcmVkR2xvYmFsRGVzY3ModW5zYWZlR2xvYmFsKSB7XG4gICAgY29uc3QgZGVzY3JpcHRvcnMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGRlc2NyaWJlKG5hbWVzLCB3cml0YWJsZSwgZW51bWVyYWJsZSwgY29uZmlndXJhYmxlKSB7XG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgbmFtZXMpIHtcbiAgICAgICAgY29uc3QgZGVzYyA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcih1bnNhZmVHbG9iYWwsIG5hbWUpO1xuICAgICAgICBpZiAoZGVzYykge1xuICAgICAgICAgIC8vIEFib3J0IGlmIGFuIGFjY2Vzc29yIGlzIGZvdW5kIG9uIHRoZSB1bnNhZmUgZ2xvYmFsIG9iamVjdFxuICAgICAgICAgIC8vIGluc3RlYWQgb2YgYSBkYXRhIHByb3BlcnR5LiBXZSBzaG91bGQgbmV2ZXIgZ2V0IGludG8gdGhpc1xuICAgICAgICAgIC8vIG5vbiBzdGFuZGFyZCBzaXR1YXRpb24uXG4gICAgICAgICAgYXNzZXJ0KFxuICAgICAgICAgICAgJ3ZhbHVlJyBpbiBkZXNjLFxuICAgICAgICAgICAgYHVuZXhwZWN0ZWQgYWNjZXNzb3Igb24gZ2xvYmFsIHByb3BlcnR5OiAke25hbWV9YFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBkZXNjcmlwdG9yc1tuYW1lXSA9IHtcbiAgICAgICAgICAgIHZhbHVlOiBkZXNjLnZhbHVlLFxuICAgICAgICAgICAgd3JpdGFibGUsXG4gICAgICAgICAgICBlbnVtZXJhYmxlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGRlc2NyaWJlKGZyb3plbkdsb2JhbFByb3BlcnR5TmFtZXMsIGZhbHNlLCBmYWxzZSwgZmFsc2UpO1xuICAgIC8vIFRoZSBmb2xsb3dpbmcgaXMgY29ycmVjdCBidXQgZXhwZW5zaXZlLlxuICAgIC8vIGRlc2NyaWJlKHN0YWJsZUdsb2JhbFByb3BlcnR5TmFtZXMsIHRydWUsIGZhbHNlLCB0cnVlKTtcbiAgICAvLyBJbnN0ZWFkLCBmb3Igbm93LCB3ZSBsZXQgdGhlc2UgZ2V0IG9wdGltaXplZC5cbiAgICAvL1xuICAgIC8vIFRPRE86IFdlIHNob3VsZCBwcm92aWRlIGFuIG9wdGlvbiB0byB0dXJuIHRoaXMgb3B0aW1pemF0aW9uIG9mZixcbiAgICAvLyBieSBmZWVkaW5nIFwidHJ1ZSwgZmFsc2UsIHRydWVcIiBoZXJlIGluc3RlYWQuXG4gICAgZGVzY3JpYmUoc3RhYmxlR2xvYmFsUHJvcGVydHlOYW1lcywgZmFsc2UsIGZhbHNlLCBmYWxzZSk7XG4gICAgLy8gVGhlc2Ugd2Uga2VlcCByZXBsYWNlYWJsZSBhbmQgcmVtb3ZhYmxlLCBiZWNhdXNlIHdlIGV4cGVjdFxuICAgIC8vIG90aGVycywgZS5nLiwgU0VTLCBtYXkgd2FudCB0byBkbyBzby5cbiAgICBkZXNjcmliZSh1bnN0YWJsZUdsb2JhbFByb3BlcnR5TmFtZXMsIHRydWUsIGZhbHNlLCB0cnVlKTtcblxuICAgIHJldHVybiBkZXNjcmlwdG9ycztcbiAgfVxuXG4gIC8vIEFkYXB0ZWQgZnJvbSBTRVMvQ2FqYSAtIENvcHlyaWdodCAoQykgMjAxMSBHb29nbGUgSW5jLlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZ29vZ2xlL2NhamEvYmxvYi9tYXN0ZXIvc3JjL2NvbS9nb29nbGUvY2FqYS9zZXMvc3RhcnRTRVMuanNcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9jYWphL2Jsb2IvbWFzdGVyL3NyYy9jb20vZ29vZ2xlL2NhamEvc2VzL3JlcGFpckVTNS5qc1xuXG4gIC8qKlxuICAgKiBSZXBsYWNlIHRoZSBsZWdhY3kgYWNjZXNzb3JzIG9mIE9iamVjdCB0byBjb21wbHkgd2l0aCBzdHJpY3QgbW9kZVxuICAgKiBhbmQgRVMyMDE2IHNlbWFudGljcywgd2UgZG8gdGhpcyBieSByZWRlZmluaW5nIHRoZW0gd2hpbGUgaW4gJ3VzZSBzdHJpY3QnLlxuICAgKlxuICAgKiB0b2RvOiBsaXN0IHRoZSBpc3N1ZXMgcmVzb2x2ZWRcbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiBjYW4gYmUgdXNlZCBpbiB0d28gd2F5czogKDEpIGludm9rZWQgZGlyZWN0bHkgdG8gZml4IHRoZSBwcmltYWxcbiAgICogcmVhbG0ncyBPYmplY3QucHJvdG90eXBlLCBhbmQgKDIpIGNvbnZlcnRlZCB0byBhIHN0cmluZyB0byBiZSBleGVjdXRlZFxuICAgKiBpbnNpZGUgZWFjaCBuZXcgUm9vdFJlYWxtIHRvIGZpeCB0aGVpciBPYmplY3QucHJvdG90eXBlcy4gRXZhbHVhdGlvbiByZXF1aXJlc1xuICAgKiB0aGUgZnVuY3Rpb24gdG8gaGF2ZSBubyBkZXBlbmRlbmNpZXMsIHNvIGRvbid0IGltcG9ydCBhbnl0aGluZyBmcm9tXG4gICAqIHRoZSBvdXRzaWRlLlxuICAgKi9cblxuICAvLyB0b2RvOiB0aGlzIGZpbGUgc2hvdWxkIGJlIG1vdmVkIG91dCB0byBhIHNlcGFyYXRlIHJlcG8gYW5kIG5wbSBtb2R1bGUuXG4gIGZ1bmN0aW9uIHJlcGFpckFjY2Vzc29ycygpIHtcbiAgICBjb25zdCB7XG4gICAgICBkZWZpbmVQcm9wZXJ0eSxcbiAgICAgIGRlZmluZVByb3BlcnRpZXMsXG4gICAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IsXG4gICAgICBnZXRQcm90b3R5cGVPZixcbiAgICAgIHByb3RvdHlwZTogb2JqZWN0UHJvdG90eXBlXG4gICAgfSA9IE9iamVjdDtcblxuICAgIC8vIE9uIHNvbWUgcGxhdGZvcm1zLCB0aGUgaW1wbGVtZW50YXRpb24gb2YgdGhlc2UgZnVuY3Rpb25zIGFjdCBhc1xuICAgIC8vIGlmIHRoZXkgYXJlIGluIHNsb3BweSBtb2RlOiBpZiB0aGV5J3JlIGludm9rZWQgYmFkbHksIHRoZXkgd2lsbFxuICAgIC8vIGV4cG9zZSB0aGUgZ2xvYmFsIG9iamVjdCwgc28gd2UgbmVlZCB0byByZXBhaXIgdGhlc2UgZm9yXG4gICAgLy8gc2VjdXJpdHkuIFRodXMgaXQgaXMgb3VyIHJlc3BvbnNpYmlsaXR5IHRvIGZpeCB0aGlzLCBhbmQgd2UgbmVlZFxuICAgIC8vIHRvIGluY2x1ZGUgcmVwYWlyQWNjZXNzb3JzLiBFLmcuIENocm9tZSBpbiAyMDE2LlxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIFZlcmlmeSB0aGF0IHRoZSBtZXRob2QgaXMgbm90IGNhbGxhYmxlLlxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXJlc3RyaWN0ZWQtcHJvcGVydGllcywgbm8tdW5kZXJzY29yZS1kYW5nbGVcbiAgICAgICgwLCBvYmplY3RQcm90b3R5cGUuX19sb29rdXBHZXR0ZXJfXykoJ3gnKTtcbiAgICB9IGNhdGNoIChpZ25vcmUpIHtcbiAgICAgIC8vIFRocm93cywgbm8gbmVlZCB0byBwYXRjaC5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0b09iamVjdChvYmopIHtcbiAgICAgIGlmIChvYmogPT09IHVuZGVmaW5lZCB8fCBvYmogPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgY2FuJ3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3RgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBPYmplY3Qob2JqKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhc1Byb3BlcnR5TmFtZShvYmopIHtcbiAgICAgIGlmICh0eXBlb2Ygb2JqID09PSAnc3ltYm9sJykge1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGAke29ian1gO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFGdW5jdGlvbihvYmosIGFjY2Vzc29yKSB7XG4gICAgICBpZiAodHlwZW9mIG9iaiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoYGludmFsaWQgJHthY2Nlc3Nvcn0gdXNhZ2VgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG4gICAgZGVmaW5lUHJvcGVydGllcyhvYmplY3RQcm90b3R5cGUsIHtcbiAgICAgIF9fZGVmaW5lR2V0dGVyX186IHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9fZGVmaW5lR2V0dGVyX18ocHJvcCwgZnVuYykge1xuICAgICAgICAgIGNvbnN0IE8gPSB0b09iamVjdCh0aGlzKTtcbiAgICAgICAgICBkZWZpbmVQcm9wZXJ0eShPLCBwcm9wLCB7XG4gICAgICAgICAgICBnZXQ6IGFGdW5jdGlvbihmdW5jLCAnZ2V0dGVyJyksXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBfX2RlZmluZVNldHRlcl9fOiB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBfX2RlZmluZVNldHRlcl9fKHByb3AsIGZ1bmMpIHtcbiAgICAgICAgICBjb25zdCBPID0gdG9PYmplY3QodGhpcyk7XG4gICAgICAgICAgZGVmaW5lUHJvcGVydHkoTywgcHJvcCwge1xuICAgICAgICAgICAgc2V0OiBhRnVuY3Rpb24oZnVuYywgJ3NldHRlcicpLFxuICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgX19sb29rdXBHZXR0ZXJfXzoge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gX19sb29rdXBHZXR0ZXJfXyhwcm9wKSB7XG4gICAgICAgICAgbGV0IE8gPSB0b09iamVjdCh0aGlzKTtcbiAgICAgICAgICBwcm9wID0gYXNQcm9wZXJ0eU5hbWUocHJvcCk7XG4gICAgICAgICAgbGV0IGRlc2M7XG4gICAgICAgICAgd2hpbGUgKE8gJiYgIShkZXNjID0gZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE8sIHByb3ApKSkge1xuICAgICAgICAgICAgTyA9IGdldFByb3RvdHlwZU9mKE8pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZGVzYyAmJiBkZXNjLmdldDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIF9fbG9va3VwU2V0dGVyX186IHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIF9fbG9va3VwU2V0dGVyX18ocHJvcCkge1xuICAgICAgICAgIGxldCBPID0gdG9PYmplY3QodGhpcyk7XG4gICAgICAgICAgcHJvcCA9IGFzUHJvcGVydHlOYW1lKHByb3ApO1xuICAgICAgICAgIGxldCBkZXNjO1xuICAgICAgICAgIHdoaWxlIChPICYmICEoZGVzYyA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcihPLCBwcm9wKSkpIHtcbiAgICAgICAgICAgIE8gPSBnZXRQcm90b3R5cGVPZihPKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGRlc2MgJiYgZGVzYy5zZXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIEFkYXB0ZWQgZnJvbSBTRVMvQ2FqYVxuICAvLyBDb3B5cmlnaHQgKEMpIDIwMTEgR29vZ2xlIEluYy5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZS9jYWphL2Jsb2IvbWFzdGVyL3NyYy9jb20vZ29vZ2xlL2NhamEvc2VzL3N0YXJ0U0VTLmpzXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGUvY2FqYS9ibG9iL21hc3Rlci9zcmMvY29tL2dvb2dsZS9jYWphL3Nlcy9yZXBhaXJFUzUuanNcblxuICAvKipcbiAgICogVGhpcyBibG9jayByZXBsYWNlcyB0aGUgb3JpZ2luYWwgRnVuY3Rpb24gY29uc3RydWN0b3IsIGFuZCB0aGUgb3JpZ2luYWxcbiAgICogJUdlbmVyYXRvckZ1bmN0aW9uJSAlQXN5bmNGdW5jdGlvbiUgYW5kICVBc3luY0dlbmVyYXRvckZ1bmN0aW9uJSwgd2l0aFxuICAgKiBzYWZlIHJlcGxhY2VtZW50cyB0aGF0IHRocm93IGlmIGludm9rZWQuXG4gICAqXG4gICAqIFRoZXNlIGFyZSBhbGwgcmVhY2hhYmxlIHZpYSBzeW50YXgsIHNvIGl0IGlzbid0IHN1ZmZpY2llbnQgdG8ganVzdFxuICAgKiByZXBsYWNlIGdsb2JhbCBwcm9wZXJ0aWVzIHdpdGggc2FmZSB2ZXJzaW9ucy4gT3VyIG1haW4gZ29hbCBpcyB0byBwcmV2ZW50XG4gICAqIGFjY2VzcyB0byB0aGUgRnVuY3Rpb24gY29uc3RydWN0b3IgdGhyb3VnaCB0aGVzZSBzdGFydGluZyBwb2ludHMuXG5cbiAgICogQWZ0ZXIgdGhpcyBibG9jayBpcyBkb25lLCB0aGUgb3JpZ2luYWxzIG11c3Qgbm8gbG9uZ2VyIGJlIHJlYWNoYWJsZSwgdW5sZXNzXG4gICAqIGEgY29weSBoYXMgYmVlbiBtYWRlLCBhbmQgZnVudGlvbnMgY2FuIG9ubHkgYmUgY3JlYXRlZCBieSBzeW50YXggKHVzaW5nIGV2YWwpXG4gICAqIG9yIGJ5IGludm9raW5nIGEgcHJldmlvdXNseSBzYXZlZCByZWZlcmVuY2UgdG8gdGhlIG9yaWdpbmFscy5cbiAgICovXG5cbiAgLy8gdG9kbzogdGhpcyBmaWxlIHNob3VsZCBiZSBtb3ZlZCBvdXQgdG8gYSBzZXBhcmF0ZSByZXBvIGFuZCBucG0gbW9kdWxlLlxuICBmdW5jdGlvbiByZXBhaXJGdW5jdGlvbnMoKSB7XG4gICAgY29uc3QgeyBkZWZpbmVQcm9wZXJ0aWVzLCBnZXRQcm90b3R5cGVPZiwgc2V0UHJvdG90eXBlT2YgfSA9IE9iamVjdDtcblxuICAgIC8qKlxuICAgICAqIFRoZSBwcm9jZXNzIHRvIHJlcGFpciBjb25zdHJ1Y3RvcnM6XG4gICAgICogMS4gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBmdW5jdGlvbiBieSBldmFsdWF0aW5nIHN5bnRheFxuICAgICAqIDIuIE9idGFpbiB0aGUgcHJvdG90eXBlIGZyb20gdGhlIGluc3RhbmNlXG4gICAgICogMy4gQ3JlYXRlIGEgc3Vic3RpdHV0ZSB0YW1lZCBjb25zdHJ1Y3RvclxuICAgICAqIDQuIFJlcGxhY2UgdGhlIG9yaWdpbmFsIGNvbnN0cnVjdG9yIHdpdGggdGhlIHRhbWVkIGNvbnN0cnVjdG9yXG4gICAgICogNS4gUmVwbGFjZSB0YW1lZCBjb25zdHJ1Y3RvciBwcm90b3R5cGUgcHJvcGVydHkgd2l0aCB0aGUgb3JpZ2luYWwgb25lXG4gICAgICogNi4gUmVwbGFjZSBpdHMgW1tQcm90b3R5cGVdXSBzbG90IHdpdGggdGhlIHRhbWVkIGNvbnN0cnVjdG9yIG9mIEZ1bmN0aW9uXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVwYWlyRnVuY3Rpb24obmFtZSwgZGVjbGFyYXRpb24pIHtcbiAgICAgIGxldCBGdW5jdGlvbkluc3RhbmNlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5ldy1mdW5jXG4gICAgICAgIEZ1bmN0aW9uSW5zdGFuY2UgPSAoMCwgZXZhbCkoZGVjbGFyYXRpb24pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIFN5bnRheEVycm9yKSB7XG4gICAgICAgICAgLy8gUHJldmVudCBmYWlsdXJlIG9uIHBsYXRmb3JtcyB3aGVyZSBhc3luYyBhbmQvb3IgZ2VuZXJhdG9yc1xuICAgICAgICAgIC8vIGFyZSBub3Qgc3VwcG9ydGVkLlxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBSZS10aHJvd1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgICAgY29uc3QgRnVuY3Rpb25Qcm90b3R5cGUgPSBnZXRQcm90b3R5cGVPZihGdW5jdGlvbkluc3RhbmNlKTtcblxuICAgICAgLy8gUHJldmVudHMgdGhlIGV2YWx1YXRpb24gb2Ygc291cmNlIHdoZW4gY2FsbGluZyBjb25zdHJ1Y3RvciBvbiB0aGVcbiAgICAgIC8vIHByb3RvdHlwZSBvZiBmdW5jdGlvbnMuXG4gICAgICBjb25zdCBUYW1lZEZ1bmN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ05vdCBhdmFpbGFibGUnKTtcbiAgICAgIH07XG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKFRhbWVkRnVuY3Rpb24sIHsgbmFtZTogeyB2YWx1ZTogbmFtZSB9IH0pO1xuXG4gICAgICAvLyAobmV3IEVycm9yKCkpLmNvbnN0cnVjdG9ycyBkb2VzIG5vdCBpbmhlcml0IGZyb20gRnVuY3Rpb24sIGJlY2F1c2UgRXJyb3JcbiAgICAgIC8vIHdhcyBkZWZpbmVkIGJlZm9yZSBFUzYgY2xhc3Nlcy4gU28gd2UgZG9uJ3QgbmVlZCB0byByZXBhaXIgaXQgdG9vLlxuXG4gICAgICAvLyAoRXJyb3IoKSkuY29uc3RydWN0b3IgaW5oZXJpdCBmcm9tIEZ1bmN0aW9uLCB3aGljaCBnZXRzIGEgdGFtZWRcbiAgICAgIC8vIGNvbnN0cnVjdG9yIGhlcmUuXG5cbiAgICAgIC8vIHRvZG86IGluIGFuIEVTNiBjbGFzcyB0aGF0IGRvZXMgbm90IGluaGVyaXQgZnJvbSBhbnl0aGluZywgd2hhdCBkb2VzIGl0c1xuICAgICAgLy8gY29uc3RydWN0b3IgaW5oZXJpdCBmcm9tPyBXZSB3b3JyeSB0aGF0IGl0IGluaGVyaXRzIGZyb20gRnVuY3Rpb24sIGluXG4gICAgICAvLyB3aGljaCBjYXNlIGluc3RhbmNlcyBjb3VsZCBnaXZlIGFjY2VzcyB0byB1bnNhZmVGdW5jdGlvbi4gbWFya20gc2F5c1xuICAgICAgLy8gd2UncmUgZmluZTogdGhlIGNvbnN0cnVjdG9yIGluaGVyaXRzIGZyb20gT2JqZWN0LnByb3RvdHlwZVxuXG4gICAgICAvLyBUaGlzIGxpbmUgcmVwbGFjZXMgdGhlIG9yaWdpbmFsIGNvbnN0cnVjdG9yIGluIHRoZSBwcm90b3R5cGUgY2hhaW5cbiAgICAgIC8vIHdpdGggdGhlIHRhbWVkIG9uZS4gTm8gY29weSBvZiB0aGUgb3JpZ2luYWwgaXMgcGVzZXJ2ZWQuXG4gICAgICBkZWZpbmVQcm9wZXJ0aWVzKEZ1bmN0aW9uUHJvdG90eXBlLCB7XG4gICAgICAgIGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBUYW1lZEZ1bmN0aW9uIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBUaGlzIGxpbmUgc2V0cyB0aGUgdGFtZWQgY29uc3RydWN0b3IncyBwcm90b3R5cGUgZGF0YSBwcm9wZXJ0eSB0b1xuICAgICAgLy8gdGhlIG9yaWdpbmFsIG9uZS5cbiAgICAgIGRlZmluZVByb3BlcnRpZXMoVGFtZWRGdW5jdGlvbiwge1xuICAgICAgICBwcm90b3R5cGU6IHsgdmFsdWU6IEZ1bmN0aW9uUHJvdG90eXBlIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAoVGFtZWRGdW5jdGlvbiAhPT0gRnVuY3Rpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgIC8vIEVuc3VyZXMgdGhhdCBhbGwgZnVuY3Rpb25zIG1lZXQgXCJpbnN0YW5jZW9mIEZ1bmN0aW9uXCIgaW4gYSByZWFsbS5cbiAgICAgICAgc2V0UHJvdG90eXBlT2YoVGFtZWRGdW5jdGlvbiwgRnVuY3Rpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBIZXJlLCB0aGUgb3JkZXIgb2Ygb3BlcmF0aW9uIGlzIGltcG9ydGFudDogRnVuY3Rpb24gbmVlZHMgdG8gYmUgcmVwYWlyZWRcbiAgICAvLyBmaXJzdCBzaW5jZSB0aGUgb3RoZXIgcmVwYWlyZWQgY29uc3RydWN0b3JzIG5lZWQgdG8gaW5oZXJpdCBmcm9tIHRoZSB0YW1lZFxuICAgIC8vIEZ1bmN0aW9uIGZ1bmN0aW9uIGNvbnN0cnVjdG9yLlxuXG4gICAgLy8gbm90ZTogdGhpcyByZWFsbHkgd2FudHMgdG8gYmUgcGFydCBvZiB0aGUgc3RhbmRhcmQsIGJlY2F1c2UgbmV3XG4gICAgLy8gY29uc3RydWN0b3JzIG1heSBiZSBhZGRlZCBpbiB0aGUgZnV0dXJlLCByZWFjaGFibGUgZnJvbSBzeW50YXgsIGFuZCB0aGlzXG4gICAgLy8gbGlzdCBtdXN0IGJlIHVwZGF0ZWQgdG8gbWF0Y2guXG5cbiAgICAvLyBcInBsYWluIGFycm93IGZ1bmN0aW9uc1wiIGluaGVyaXQgZnJvbSBGdW5jdGlvbi5wcm90b3R5cGVcblxuICAgIHJlcGFpckZ1bmN0aW9uKCdGdW5jdGlvbicsICcoZnVuY3Rpb24oKXt9KScpO1xuICAgIHJlcGFpckZ1bmN0aW9uKCdHZW5lcmF0b3JGdW5jdGlvbicsICcoZnVuY3Rpb24qKCl7fSknKTtcbiAgICByZXBhaXJGdW5jdGlvbignQXN5bmNGdW5jdGlvbicsICcoYXN5bmMgZnVuY3Rpb24oKXt9KScpO1xuICAgIHJlcGFpckZ1bmN0aW9uKCdBc3luY0dlbmVyYXRvckZ1bmN0aW9uJywgJyhhc3luYyBmdW5jdGlvbiooKXt9KScpO1xuICB9XG5cbiAgLy8gdGhpcyBtb2R1bGUgbXVzdCBuZXZlciBiZSBpbXBvcnRhYmxlIG91dHNpZGUgdGhlIFJlYWxtIHNoaW0gaXRzZWxmXG5cbiAgLy8gQSBcImNvbnRleHRcIiBpcyBhIGZyZXNoIHVuc2FmZSBSZWFsbSBhcyBnaXZlbiB0byB1cyBieSBleGlzdGluZyBwbGF0Zm9ybXMuXG4gIC8vIFdlIG5lZWQgdGhpcyB0byBpbXBsZW1lbnQgdGhlIHNoaW0uIEhvd2V2ZXIsIHdoZW4gUmVhbG1zIGxhbmQgZm9yIHJlYWwsXG4gIC8vIHRoaXMgZmVhdHVyZSB3aWxsIGJlIHByb3ZpZGVkIGJ5IHRoZSB1bmRlcmx5aW5nIGVuZ2luZSBpbnN0ZWFkLlxuXG4gIC8vIG5vdGU6IGluIGEgbm9kZSBtb2R1bGUsIHRoZSB0b3AtbGV2ZWwgJ3RoaXMnIGlzIG5vdCB0aGUgZ2xvYmFsIG9iamVjdFxuICAvLyAoaXQncyAqc29tZXRoaW5nKiBidXQgd2UgYXJlbid0IHN1cmUgd2hhdCksIGhvd2V2ZXIgYW4gaW5kaXJlY3QgZXZhbCBvZlxuICAvLyAndGhpcycgd2lsbCBiZSB0aGUgY29ycmVjdCBnbG9iYWwgb2JqZWN0LlxuXG4gIGNvbnN0IHVuc2FmZUdsb2JhbFNyYyA9IFwiJ3VzZSBzdHJpY3QnOyB0aGlzXCI7XG4gIGNvbnN0IHVuc2FmZUdsb2JhbEV2YWxTcmMgPSBgKDAsIGV2YWwpKFwiJ3VzZSBzdHJpY3QnOyB0aGlzXCIpYDtcblxuICAvLyBUaGlzIG1ldGhvZCBpcyBvbmx5IGV4cG9ydGVkIGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuICBmdW5jdGlvbiBjcmVhdGVOZXdVbnNhZmVHbG9iYWxGb3JOb2RlKCkge1xuICAgIC8vIE5vdGUgdGhhdCB3ZWJwYWNrIGFuZCBvdGhlcnMgd2lsbCBzaGltICd2bScgaW5jbHVkaW5nIHRoZSBtZXRob2RcbiAgICAvLyAncnVuSW5OZXdDb250ZXh0Jywgc28gdGhlIHByZXNlbmNlIG9mIHZtIGlzIG5vdCBhIHVzZWZ1bCBjaGVja1xuXG4gICAgLy8gVE9ETzogRmluZCBhIGJldHRlciB0ZXN0IHRoYXQgd29ya3Mgd2l0aCBidW5kbGVyc1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXctZnVuY1xuICAgIGNvbnN0IGlzTm9kZSA9IG5ldyBGdW5jdGlvbihcbiAgICAgICd0cnkge3JldHVybiB0aGlzPT09Z2xvYmFsfWNhdGNoKGUpe3JldHVybiBmYWxzZX0nXG4gICAgKSgpO1xuXG4gICAgaWYgKCFpc05vZGUpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGdsb2JhbC1yZXF1aXJlXG4gICAgY29uc3Qgdm0gPSByZXF1aXJlKCd2bScpO1xuXG4gICAgLy8gVXNlIHVuc2FmZUdsb2JhbEV2YWxTcmMgdG8gZW5zdXJlIHdlIGdldCB0aGUgcmlnaHQgJ3RoaXMnLlxuICAgIGNvbnN0IHVuc2FmZUdsb2JhbCA9IHZtLnJ1bkluTmV3Q29udGV4dCh1bnNhZmVHbG9iYWxFdmFsU3JjKTtcblxuICAgIHJldHVybiB1bnNhZmVHbG9iYWw7XG4gIH1cblxuICAvLyBUaGlzIG1ldGhvZCBpcyBvbmx5IGV4cG9ydGVkIGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuICBmdW5jdGlvbiBjcmVhdGVOZXdVbnNhZmVHbG9iYWxGb3JCcm93c2VyKCkge1xuICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICBpZnJhbWUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcblxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICBjb25zdCB1bnNhZmVHbG9iYWwgPSBpZnJhbWUuY29udGVudFdpbmRvdy5ldmFsKHVuc2FmZUdsb2JhbFNyYyk7XG5cbiAgICAvLyBXZSBrZWVwIHRoZSBpZnJhbWUgYXR0YWNoZWQgdG8gdGhlIERPTSBiZWNhdXNlIHJlbW92aW5nIGl0XG4gICAgLy8gY2F1c2VzIGl0cyBnbG9iYWwgb2JqZWN0IHRvIGxvc2UgaW50cmluc2ljcywgaXRzIGV2YWwoKVxuICAgIC8vIGZ1bmN0aW9uIHRvIGV2YWx1YXRlIGNvZGUsIGV0Yy5cblxuICAgIC8vIFRPRE86IGNhbiB3ZSByZW1vdmUgYW5kIGdhcmJhZ2UtY29sbGVjdCB0aGUgaWZyYW1lcz9cblxuICAgIHJldHVybiB1bnNhZmVHbG9iYWw7XG4gIH1cblxuICBjb25zdCBnZXROZXdVbnNhZmVHbG9iYWwgPSAoKSA9PiB7XG4gICAgY29uc3QgbmV3VW5zYWZlR2xvYmFsRm9yQnJvd3NlciA9IGNyZWF0ZU5ld1Vuc2FmZUdsb2JhbEZvckJyb3dzZXIoKTtcbiAgICBjb25zdCBuZXdVbnNhZmVHbG9iYWxGb3JOb2RlID0gY3JlYXRlTmV3VW5zYWZlR2xvYmFsRm9yTm9kZSgpO1xuICAgIGlmIChcbiAgICAgICghbmV3VW5zYWZlR2xvYmFsRm9yQnJvd3NlciAmJiAhbmV3VW5zYWZlR2xvYmFsRm9yTm9kZSkgfHxcbiAgICAgIChuZXdVbnNhZmVHbG9iYWxGb3JCcm93c2VyICYmIG5ld1Vuc2FmZUdsb2JhbEZvck5vZGUpXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VuZXhwZWN0ZWQgcGxhdGZvcm0sIHVuYWJsZSB0byBjcmVhdGUgUmVhbG0nKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld1Vuc2FmZUdsb2JhbEZvckJyb3dzZXIgfHwgbmV3VW5zYWZlR2xvYmFsRm9yTm9kZTtcbiAgfTtcblxuICAvLyBUaGUgdW5zYWZlUmVjIGlzIHNoaW0tc3BlY2lmaWMuIEl0IGFjdHMgYXMgdGhlIG1lY2hhbmlzbSB0byBvYnRhaW4gYSBmcmVzaFxuICAvLyBzZXQgb2YgaW50cmluc2ljcyB0b2dldGhlciB3aXRoIHRoZWlyIGFzc29jaWF0ZWQgZXZhbCBhbmQgRnVuY3Rpb25cbiAgLy8gZXZhbHVhdG9ycy4gVGhlc2UgbXVzdCBiZSB1c2VkIGFzIGEgbWF0Y2hlZCBzZXQsIHNpbmNlIHRoZSBldmFsdWF0b3JzIGFyZVxuICAvLyB0aWVkIHRvIGEgc2V0IG9mIGludHJpbnNpY3MsIGFrYSB0aGUgXCJ1bmRlbmlhYmxlc1wiLiBJZiBpdCB3ZXJlIHBvc3NpYmxlIHRvXG4gIC8vIG1peC1hbmQtbWF0Y2ggdGhlbSBmcm9tIGRpZmZlcmVudCBjb250ZXh0cywgdGhhdCB3b3VsZCBlbmFibGUgc29tZVxuICAvLyBhdHRhY2tzLlxuICBmdW5jdGlvbiBjcmVhdGVVbnNhZmVSZWModW5zYWZlR2xvYmFsLCBhbGxTaGltcyA9IFtdKSB7XG4gICAgY29uc3Qgc2hhcmVkR2xvYmFsRGVzY3MgPSBnZXRTaGFyZWRHbG9iYWxEZXNjcyh1bnNhZmVHbG9iYWwpO1xuXG4gICAgcmV0dXJuIGZyZWV6ZSh7XG4gICAgICB1bnNhZmVHbG9iYWwsXG4gICAgICBzaGFyZWRHbG9iYWxEZXNjcyxcbiAgICAgIHVuc2FmZUV2YWw6IHVuc2FmZUdsb2JhbC5ldmFsLFxuICAgICAgdW5zYWZlRnVuY3Rpb246IHVuc2FmZUdsb2JhbC5GdW5jdGlvbixcbiAgICAgIGFsbFNoaW1zXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCByZXBhaXJBY2Nlc3NvcnNTaGltID0gY2xlYW51cFNvdXJjZShcbiAgICBgXCJ1c2Ugc3RyaWN0XCI7ICgke3JlcGFpckFjY2Vzc29yc30pKCk7YFxuICApO1xuICBjb25zdCByZXBhaXJGdW5jdGlvbnNTaGltID0gY2xlYW51cFNvdXJjZShcbiAgICBgXCJ1c2Ugc3RyaWN0XCI7ICgke3JlcGFpckZ1bmN0aW9uc30pKCk7YFxuICApO1xuXG4gIC8vIENyZWF0ZSBhIG5ldyB1bnNhZmVSZWMgZnJvbSBhIGJyYW5kIG5ldyBjb250ZXh0LCB3aXRoIG5ldyBpbnRyaW5zaWNzIGFuZCBhXG4gIC8vIG5ldyBnbG9iYWwgb2JqZWN0XG4gIGZ1bmN0aW9uIGNyZWF0ZU5ld1Vuc2FmZVJlYyhhbGxTaGltcykge1xuICAgIGNvbnN0IHVuc2FmZUdsb2JhbCA9IGdldE5ld1Vuc2FmZUdsb2JhbCgpO1xuICAgIHVuc2FmZUdsb2JhbC5ldmFsKHJlcGFpckFjY2Vzc29yc1NoaW0pO1xuICAgIHVuc2FmZUdsb2JhbC5ldmFsKHJlcGFpckZ1bmN0aW9uc1NoaW0pO1xuICAgIHJldHVybiBjcmVhdGVVbnNhZmVSZWModW5zYWZlR2xvYmFsLCBhbGxTaGltcyk7XG4gIH1cblxuICAvLyBDcmVhdGUgYSBuZXcgdW5zYWZlUmVjIGZyb20gdGhlIGN1cnJlbnQgY29udGV4dCwgd2hlcmUgdGhlIFJlYWxtIHNoaW0gaXNcbiAgLy8gYmVpbmcgcGFyc2VkIGFuZCBleGVjdXRlZCwgYWthIHRoZSBcIlByaW1hbCBSZWFsbVwiXG4gIGZ1bmN0aW9uIGNyZWF0ZUN1cnJlbnRVbnNhZmVSZWMoKSB7XG4gICAgY29uc3QgdW5zYWZlR2xvYmFsID0gKDAsIGV2YWwpKHVuc2FmZUdsb2JhbFNyYyk7XG4gICAgcmVwYWlyQWNjZXNzb3JzKCk7XG4gICAgcmVwYWlyRnVuY3Rpb25zKCk7XG4gICAgcmV0dXJuIGNyZWF0ZVVuc2FmZVJlYyh1bnNhZmVHbG9iYWwpO1xuICB9XG5cbiAgLy8gdG9kbzogdGhpbmsgYWJvdXQgaG93IHRoaXMgaW50ZXJhY3RzIHdpdGggZW5kb3dtZW50cywgY2hlY2sgZm9yIGNvbmZsaWN0c1xuICAvLyBiZXR3ZWVuIHRoZSBuYW1lcyBiZWluZyBvcHRpbWl6ZWQgYW5kIHRoZSBvbmVzIGFkZGVkIGJ5IGVuZG93bWVudHNcblxuICAvKipcbiAgICogU2ltcGxpZmllZCB2YWxpZGF0aW9uIG9mIGluZGVudGlmaWVyIG5hbWVzOiBtYXkgb25seSBjb250YWluIGFscGhhbnVtZXJpY1xuICAgKiBjaGFyYWN0ZXJzIChvciBcIiRcIiBvciBcIl9cIiksIGFuZCBtYXkgbm90IHN0YXJ0IHdpdGggYSBkaWdpdC4gVGhpcyBpcyBzYWZlXG4gICAqIGFuZCBkb2VzIG5vdCByZWR1Y2VzIHRoZSBjb21wYXRpYmlsaXR5IG9mIHRoZSBzaGltLiBUaGUgbW90aXZhdGlvbiBmb3JcbiAgICogdGhpcyBsaW1pdGF0aW9uIHdhcyB0byBkZWNyZWFzZSB0aGUgY29tcGxleGl0eSBvZiB0aGUgaW1wbGVtZW50YXRpb24sXG4gICAqIGFuZCB0byBtYWludGFpbiBhIHJlc29uYWJsZSBsZXZlbCBvZiBwZXJmb3JtYW5jZS5cbiAgICogTm90ZTogXFx3IGlzIGVxdWl2YWxlbnQgW2EtekEtWl8wLTldXG4gICAqIFNlZSAxMS42LjEgSWRlbnRpZmllciBOYW1lc1xuICAgKi9cbiAgY29uc3QgaWRlbnRpZmllclBhdHRlcm4gPSAvXlthLXpBLVpfJF1bXFx3JF0qJC87XG5cbiAgLyoqXG4gICAqIEluIEphdmFTY3JpcHQgeW91IGNhbm5vdCB1c2UgdGhlc2UgcmVzZXJ2ZWQgd29yZHMgYXMgdmFyaWFibGVzLlxuICAgKiBTZWUgMTEuNi4xIElkZW50aWZpZXIgTmFtZXNcbiAgICovXG4gIGNvbnN0IGtleXdvcmRzID0gbmV3IFNldChbXG4gICAgLy8gMTEuNi4yLjEgS2V5d29yZHNcbiAgICAnYXdhaXQnLFxuICAgICdicmVhaycsXG4gICAgJ2Nhc2UnLFxuICAgICdjYXRjaCcsXG4gICAgJ2NsYXNzJyxcbiAgICAnY29uc3QnLFxuICAgICdjb250aW51ZScsXG4gICAgJ2RlYnVnZ2VyJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2RvJyxcbiAgICAnZWxzZScsXG4gICAgJ2V4cG9ydCcsXG4gICAgJ2V4dGVuZHMnLFxuICAgICdmaW5hbGx5JyxcbiAgICAnZm9yJyxcbiAgICAnZnVuY3Rpb24nLFxuICAgICdpZicsXG4gICAgJ2ltcG9ydCcsXG4gICAgJ2luJyxcbiAgICAnaW5zdGFuY2VvZicsXG4gICAgJ25ldycsXG4gICAgJ3JldHVybicsXG4gICAgJ3N1cGVyJyxcbiAgICAnc3dpdGNoJyxcbiAgICAndGhpcycsXG4gICAgJ3Rocm93JyxcbiAgICAndHJ5JyxcbiAgICAndHlwZW9mJyxcbiAgICAndmFyJyxcbiAgICAndm9pZCcsXG4gICAgJ3doaWxlJyxcbiAgICAnd2l0aCcsXG4gICAgJ3lpZWxkJyxcblxuICAgIC8vIEFsc28gcmVzZXJ2ZWQgd2hlbiBwYXJzaW5nIHN0cmljdCBtb2RlIGNvZGVcbiAgICAnbGV0JyxcbiAgICAnc3RhdGljJyxcblxuICAgIC8vIDExLjYuMi4yIEZ1dHVyZSBSZXNlcnZlZCBXb3Jkc1xuICAgICdlbnVtJyxcblxuICAgIC8vIEFsc28gcmVzZXJ2ZWQgd2hlbiBwYXJzaW5nIHN0cmljdCBtb2RlIGNvZGVcbiAgICAnaW1wbGVtZW50cycsXG4gICAgJ3BhY2thZ2UnLFxuICAgICdwcm90ZWN0ZWQnLFxuICAgICdpbnRlcmZhY2UnLFxuICAgICdwcml2YXRlJyxcbiAgICAncHVibGljJyxcblxuICAgIC8vIFJlc2VydmVkIGJ1dCBub3QgbWVudGlvbmVkIGluIHNwZWNzXG4gICAgJ2F3YWl0JyxcblxuICAgICdudWxsJyxcbiAgICAndHJ1ZScsXG4gICAgJ2ZhbHNlJyxcblxuICAgICd0aGlzJyxcbiAgICAnYXJndW1lbnRzJ1xuICBdKTtcblxuICAvKipcbiAgICogZ2V0T3B0aW1pemFibGVHbG9iYWxzKClcbiAgICogV2hhdCB2YXJpYWJsZSBuYW1lcyBtaWdodCBpdCBicmluZyBpbnRvIHNjb3BlPyBUaGVzZSBpbmNsdWRlIGFsbFxuICAgKiBwcm9wZXJ0eSBuYW1lcyB3aGljaCBjYW4gYmUgdmFyaWFibGUgbmFtZXMsIGluY2x1ZGluZyB0aGUgbmFtZXNcbiAgICogb2YgaW5oZXJpdGVkIHByb3BlcnRpZXMuIEl0IGV4Y2x1ZGVzIHN5bWJvbHMgYW5kIG5hbWVzIHdoaWNoIGFyZVxuICAgKiBrZXl3b3Jkcy4gV2UgZHJvcCBzeW1ib2xzIHNhZmVseS4gQ3VycmVudGx5LCB0aGlzIHNoaW0gcmVmdXNlc1xuICAgKiBzZXJ2aWNlIGlmIGFueSBvZiB0aGUgbmFtZXMgYXJlIGtleXdvcmRzIG9yIGtleXdvcmQtbGlrZS4gVGhpcyBpc1xuICAgKiBzYWZlIGFuZCBvbmx5IHByZXZlbnQgcGVyZm9ybWFuY2Ugb3B0aW1pemF0aW9uLlxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0T3B0aW1pemFibGVHbG9iYWxzKHNhZmVHbG9iYWwpIHtcbiAgICBjb25zdCBkZXNjcyA9IGdldE93blByb3BlcnR5RGVzY3JpcHRvcnMoc2FmZUdsb2JhbCk7XG5cbiAgICAvLyBnZXRPd25Qcm9wZXJ0eU5hbWVzIGRvZXMgaWdub3JlIFN5bWJvbHMgc28gd2UgZG9uJ3QgbmVlZCB0aGlzIGV4dHJhIGNoZWNrOlxuICAgIC8vIHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJyAmJlxuICAgIGNvbnN0IGNvbnN0YW50cyA9IGFycmF5RmlsdGVyKGdldE93blByb3BlcnR5TmFtZXMoZGVzY3MpLCBuYW1lID0+IHtcbiAgICAgIC8vIEVuc3VyZSB3ZSBoYXZlIGEgdmFsaWQgaWRlbnRpZmllci4gV2UgdXNlIHJlZ2V4cFRlc3QgcmF0aGVyIHRoYW5cbiAgICAgIC8vIC8uLi8udGVzdCgpIHRvIGd1YXJkIGFnYWluc3QgdGhlIGNhc2Ugd2hlcmUgUmVnRXhwIGhhcyBiZWVuIHBvaXNvbmVkLlxuICAgICAgaWYgKFxuICAgICAgICBuYW1lID09PSAnZXZhbCcgfHxcbiAgICAgICAga2V5d29yZHMuaGFzKG5hbWUpIHx8XG4gICAgICAgICFyZWdleHBUZXN0KGlkZW50aWZpZXJQYXR0ZXJuLCBuYW1lKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGVzYyA9IGRlc2NzW25hbWVdO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIGdldHRlcnMgd2lsbCBub3QgaGF2ZSAud3JpdGFibGUsIGRvbid0IGxldCB0aGUgZmFsc3luZXNzIG9mXG4gICAgICAgIC8vICd1bmRlZmluZWQnIHRyaWNrIHVzOiB0ZXN0IHdpdGggPT09IGZhbHNlLCBub3QgISAuIEhvd2V2ZXIgZGVzY3JpcHRvcnNcbiAgICAgICAgLy8gaW5oZXJpdCBmcm9tIHRoZSAocG90ZW50aWFsbHkgcG9pc29uZWQpIGdsb2JhbCBvYmplY3QsIHNvIHdlIG1pZ2h0IHNlZVxuICAgICAgICAvLyBleHRyYSBwcm9wZXJ0aWVzIHdoaWNoIHdlcmVuJ3QgcmVhbGx5IHRoZXJlLiBBY2Nlc3NvciBwcm9wZXJ0aWVzIGhhdmVcbiAgICAgICAgLy8gJ2dldC9zZXQvZW51bWVyYWJsZS9jb25maWd1cmFibGUnLCB3aGlsZSBkYXRhIHByb3BlcnRpZXMgaGF2ZVxuICAgICAgICAvLyAndmFsdWUvd3JpdGFibGUvZW51bWVyYWJsZS9jb25maWd1cmFibGUnLlxuICAgICAgICBkZXNjLmNvbmZpZ3VyYWJsZSA9PT0gZmFsc2UgJiZcbiAgICAgICAgZGVzYy53cml0YWJsZSA9PT0gZmFsc2UgJiZcbiAgICAgICAgLy9cbiAgICAgICAgLy8gQ2hlY2tzIGZvciBkYXRhIHByb3BlcnRpZXMgYmVjYXVzZSB0aGV5J3JlIHRoZSBvbmx5IG9uZXMgd2UgY2FuXG4gICAgICAgIC8vIG9wdGltaXplIChhY2Nlc3NvcnMgYXJlIG1vc3QgbGlrZWx5IG5vbi1jb25zdGFudCkuIERlc2NyaXB0b3JzIGNhbid0XG4gICAgICAgIC8vIGNhbid0IGhhdmUgYWNjZXNzb3JzIGFuZCB2YWx1ZSBwcm9wZXJ0aWVzIGF0IHRoZSBzYW1lIHRpbWUsIHRoZXJlZm9yZVxuICAgICAgICAvLyB0aGlzIGNoZWNrIGlzIHN1ZmZpY2llbnQuIFVzaW5nIGV4cGxpY2l0IG93biBwcm9wZXJ0eSBkZWFsIHdpdGggdGhlXG4gICAgICAgIC8vIGNhc2Ugd2hlcmUgT2JqZWN0LnByb3RvdHlwZSBoYXMgYmVlbiBwb2lzb25lZC5cbiAgICAgICAgb2JqZWN0SGFzT3duUHJvcGVydHkoZGVzYywgJ3ZhbHVlJylcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY29uc3RhbnRzO1xuICB9XG5cbiAgLyoqXG4gICAqIGFsd2F5c1Rocm93SGFuZGxlciBpcyBhIHByb3h5IGhhbmRsZXIgd2hpY2ggdGhyb3dzIG9uIGFueSB0cmFwIGNhbGxlZC5cbiAgICogSXQncyBtYWRlIGZyb20gYSBwcm94eSB3aXRoIGEgZ2V0IHRyYXAgdGhhdCB0aHJvd3MuIEl0cyB0YXJnZXQgaXNcbiAgICogYW4gaW1tdXRhYmxlIChmcm96ZW4pIG9iamVjdCBhbmQgaXMgc2FmZSB0byBzaGFyZS5cbiAgICovXG4gIGNvbnN0IGFsd2F5c1Rocm93SGFuZGxlciA9IG5ldyBQcm94eShmcmVlemUoe30pLCB7XG4gICAgZ2V0KHRhcmdldCwgcHJvcCkge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBgdW5leHBlY3RlZCBzY29wZSBoYW5kbGVyIHRyYXAgY2FsbGVkOiAke3Byb3B9YCxcbiAgICAgICAgbmV3IEVycm9yKCkuc3RhY2tcbiAgICAgICk7XG4gICAgICAvLyB0aHJvd1RhbnRydW0oYHVuZXhwZWN0ZWQgc2NvcGUgaGFuZGxlciB0cmFwIGNhbGxlZDogJHtwcm9wfWApO1xuICAgIH1cbiAgfSk7XG5cbiAgLyoqXG4gICAqIFNjb3BlSGFuZGxlciBtYW5hZ2VzIGEgUHJveHkgd2hpY2ggc2VydmVzIGFzIHRoZSBnbG9iYWwgc2NvcGUgZm9yIHRoZVxuICAgKiBzYWZlRXZhbHVhdG9yIG9wZXJhdGlvbiAodGhlIFByb3h5IGlzIHRoZSBhcmd1bWVudCBvZiBhICd3aXRoJyBiaW5kaW5nKS5cbiAgICogQXMgZGVzY3JpYmVkIGluIGNyZWF0ZVNhZmVFdmFsdWF0b3IoKSwgaXQgaGFzIHNldmVyYWwgZnVuY3Rpb25zOlxuICAgKiAtIGFsbG93IHRoZSB2ZXJ5IGZpcnN0IChhbmQgb25seSB0aGUgdmVyeSBmaXJzdCkgdXNlIG9mICdldmFsJyB0byBtYXAgdG9cbiAgICogICB0aGUgcmVhbCAodW5zYWZlKSBldmFsIGZ1bmN0aW9uLCBzbyBpdCBhY3RzIGFzIGEgJ2RpcmVjdCBldmFsJyBhbmQgY2FuXG4gICAqICAgIGFjY2VzcyBpdHMgbGV4aWNhbCBzY29wZSAod2hpY2ggbWFwcyB0byB0aGUgJ3dpdGgnIGJpbmRpbmcsIHdoaWNoIHRoZVxuICAgKiAgIFNjb3BlSGFuZGxlciBhbHNvIGNvbnRyb2xzKS5cbiAgICogLSBlbnN1cmUgdGhhdCBhbGwgc3Vic2VxdWVudCB1c2VzIG9mICdldmFsJyBtYXAgdG8gdGhlIHNhZmVFdmFsdWF0b3IsXG4gICAqICAgd2hpY2ggbGl2ZXMgYXMgdGhlICdldmFsJyBwcm9wZXJ0eSBvZiB0aGUgc2FmZUdsb2JhbC5cbiAgICogLSByb3V0ZSBhbGwgb3RoZXIgcHJvcGVydHkgbG9va3VwcyBhdCB0aGUgc2FmZUdsb2JhbC5cbiAgICogLSBoaWRlIHRoZSB1bnNhZmVHbG9iYWwgd2hpY2ggbGl2ZXMgb24gdGhlIHNjb3BlIGNoYWluIGFib3ZlIHRoZSAnd2l0aCcuXG4gICAqIC0gZW5zdXJlIHRoZSBQcm94eSBpbnZhcmlhbnRzIGRlc3BpdGUgc29tZSBnbG9iYWwgcHJvcGVydGllcyBiZWluZyBmcm96ZW4uXG4gICAqL1xuICBmdW5jdGlvbiBjcmVhdGVTY29wZUhhbmRsZXIodW5zYWZlUmVjLCBzYWZlR2xvYmFsKSB7XG4gICAgY29uc3QgeyB1bnNhZmVHbG9iYWwsIHVuc2FmZUV2YWwgfSA9IHVuc2FmZVJlYztcblxuICAgIC8vIFRoaXMgZmxhZyBhbGxvdyB1cyB0byBkZXRlcm1pbmUgaWYgdGhlIGV2YWwoKSBjYWxsIGlzIGFuIGRvbmUgYnkgdGhlXG4gICAgLy8gcmVhbG0ncyBjb2RlIG9yIGlmIGl0IGlzIHVzZXItbGFuZCBpbnZvY2F0aW9uLCBzbyB3ZSBjYW4gcmVhY3QgZGlmZmVyZW50bHkuXG4gICAgbGV0IHVzZVVuc2FmZUV2YWx1YXRvciA9IGZhbHNlO1xuICAgIC8vIFRoaXMgZmxhZyBhbGxvdyB1cyB0byBhbGxvdyB1bmRlZmluZWQgYXNzaWdubWVudHMgaW4gbm9uLXN0cmljdCBtb2RlLlxuICAgIC8vIFdoZW4gdGhlIGNvdW50ZXIgY291bnQgZG93biB0byA0LCB3ZSBhbGxvdyBpdCBvbmNlO1xuICAgIGxldCBhbGxvd05vblN0cmljdE1vZGVBc3NpZ25tZW50VGltZXMgPSAwO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC8vIFRoZSBzY29wZSBoYW5kbGVyIHRocm93cyBpZiBhbnkgdHJhcCBvdGhlciB0aGFuIGdldC9zZXQvaGFzIGFyZSBydW5cbiAgICAgIC8vIChlLmcuIGdldE93blByb3BlcnR5RGVzY3JpcHRvcnMsIGFwcGx5LCBnZXRQcm90b3R5cGVPZikuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcHJvdG9cbiAgICAgIF9fcHJvdG9fXzogYWx3YXlzVGhyb3dIYW5kbGVyLFxuXG4gICAgICBhbGxvd1Vuc2FmZUV2YWx1YXRvck9uY2UoKSB7XG4gICAgICAgIHVzZVVuc2FmZUV2YWx1YXRvciA9IHRydWU7XG4gICAgICB9LFxuXG4gICAgICBub25TdHJpY3RNb2RlQXNzaWdubWVudEFsbG93ZWQoKSB7XG4gICAgICAgIHJldHVybiBhbGxvd05vblN0cmljdE1vZGVBc3NpZ25tZW50VGltZXMgPT09IDM7XG4gICAgICB9LFxuXG4gICAgICBhbGxvd05vblN0cmljdE1vZGVBc3NpZ25tZW50KHRpbWVzID0gMSkge1xuICAgICAgICBhbGxvd05vblN0cmljdE1vZGVBc3NpZ25tZW50VGltZXMgPSB0aW1lcztcbiAgICAgIH0sXG5cbiAgICAgIGhhc05vblN0cmljdE1vZGVBc3NpZ25lZCgpIHtcbiAgICAgICAgYWxsb3dOb25TdHJpY3RNb2RlQXNzaWdubWVudFRpbWVzID0gTWF0aC5tYXgoXG4gICAgICAgICAgMCxcbiAgICAgICAgICBhbGxvd05vblN0cmljdE1vZGVBc3NpZ25tZW50VGltZXMgLSAxXG4gICAgICAgICk7XG4gICAgICB9LFxuXG4gICAgICB1bnNhZmVFdmFsdWF0b3JBbGxvd2VkKCkge1xuICAgICAgICByZXR1cm4gdXNlVW5zYWZlRXZhbHVhdG9yO1xuICAgICAgfSxcblxuICAgICAgZ2V0KHRhcmdldCwgcHJvcCkge1xuICAgICAgICAvLyBTcGVjaWFsIHRyZWF0bWVudCBmb3IgZXZhbC4gVGhlIHZlcnkgZmlyc3QgbG9va3VwIG9mICdldmFsJyBnZXRzIHRoZVxuICAgICAgICAvLyB1bnNhZmUgKHJlYWwgZGlyZWN0KSBldmFsLCBzbyBpdCB3aWxsIGdldCB0aGUgbGV4aWNhbCBzY29wZSB0aGF0IHVzZXNcbiAgICAgICAgLy8gdGhlICd3aXRoJyBjb250ZXh0LlxuICAgICAgICBpZiAocHJvcCA9PT0gJ2V2YWwnKSB7XG4gICAgICAgICAgLy8gdGVzdCB0aGF0IGl0IGlzIHRydWUgcmF0aGVyIHRoYW4gbWVyZWx5IHRydXRoeVxuICAgICAgICAgIGlmICh1c2VVbnNhZmVFdmFsdWF0b3IgPT09IHRydWUpIHtcbiAgICAgICAgICAgIC8vIHJldm9rZSBiZWZvcmUgdXNlXG4gICAgICAgICAgICB1c2VVbnNhZmVFdmFsdWF0b3IgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiB1bnNhZmVFdmFsO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGFyZ2V0LmV2YWw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0b2RvOiBzaGltIGludGVncml0eSwgY2FwdHVyZSBTeW1ib2wudW5zY29wYWJsZXNcbiAgICAgICAgaWYgKHByb3AgPT09IFN5bWJvbC51bnNjb3BhYmxlcykge1xuICAgICAgICAgIC8vIFNhZmUgdG8gcmV0dXJuIGEgcHJpbWFsIHJlYWxtIE9iamVjdCBoZXJlIGJlY2F1c2UgdGhlIG9ubHkgY29kZSB0aGF0XG4gICAgICAgICAgLy8gY2FuIGRvIGEgZ2V0KCkgb24gYSBub24tc3RyaW5nIGlzIHRoZSBpbnRlcm5hbHMgb2Ygd2l0aCgpIGl0c2VsZixcbiAgICAgICAgICAvLyBhbmQgdGhlIG9ubHkgdGhpbmcgaXQgZG9lcyBpcyB0byBsb29rIGZvciBwcm9wZXJ0aWVzIG9uIGl0LiBVc2VyXG4gICAgICAgICAgLy8gY29kZSBjYW5ub3QgZG8gYSBsb29rdXAgb24gbm9uLXN0cmluZ3MuXG4gICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByb3BlcnRpZXMgb2YgdGhlIGdsb2JhbC5cbiAgICAgICAgaWYgKHByb3AgaW4gdGFyZ2V0KSB7XG4gICAgICAgICAgcmV0dXJuIHRhcmdldFtwcm9wXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZlbnQgdGhlIGxvb2t1cCBmb3Igb3RoZXIgcHJvcGVydGllcy5cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH0sXG5cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjbGFzcy1tZXRob2RzLXVzZS10aGlzXG4gICAgICBzZXQodGFyZ2V0LCBwcm9wLCB2YWx1ZSkge1xuICAgICAgICAvLyB0b2RvOiBhbGxvdyBtb2RpZmljYXRpb25zIHdoZW4gdGFyZ2V0Lmhhc093blByb3BlcnR5KHByb3ApIGFuZCBpdFxuICAgICAgICAvLyBpcyB3cml0YWJsZSwgYXNzdW1pbmcgd2UndmUgYWxyZWFkeSByZWplY3RlZCBvdmVybGFwIChzZWVcbiAgICAgICAgLy8gY3JlYXRlU2FmZUV2YWx1YXRvckZhY3RvcnkuZmFjdG9yeSkuIFRoaXMgVHlwZUVycm9yIGdldHMgcmVwbGFjZWQgd2l0aFxuICAgICAgICAvLyB0YXJnZXRbcHJvcF0gPSB2YWx1ZVxuICAgICAgICBpZiAob2JqZWN0SGFzT3duUHJvcGVydHkodGFyZ2V0LCBwcm9wKSkge1xuICAgICAgICAgIC8vIHRvZG86IHNoaW0gaW50ZWdyaXR5OiBUeXBlRXJyb3IsIFN0cmluZ1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYGRvIG5vdCBtb2RpZnkgZW5kb3dtZW50cyBsaWtlICR7U3RyaW5nKHByb3ApfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgc2FmZUdsb2JhbFtwcm9wXSA9IHZhbHVlO1xuXG4gICAgICAgIC8vIFJldHVybiB0cnVlIGFmdGVyIHN1Y2Nlc3NmdWwgc2V0LlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG5cbiAgICAgIC8vIHdlIG5lZWQgaGFzKCkgdG8gcmV0dXJuIGZhbHNlIGZvciBzb21lIG5hbWVzIHRvIHByZXZlbnQgdGhlIGxvb2t1cCAgZnJvbVxuICAgICAgLy8gY2xpbWJpbmcgdGhlIHNjb3BlIGNoYWluIGFuZCBldmVudHVhbGx5IHJlYWNoaW5nIHRoZSB1bnNhZmVHbG9iYWxcbiAgICAgIC8vIG9iamVjdCwgd2hpY2ggaXMgYmFkLlxuXG4gICAgICAvLyBub3RlOiB1bnNjb3BhYmxlcyEgZXZlcnkgc3RyaW5nIGluIE9iamVjdFtTeW1ib2wudW5zY29wYWJsZXNdXG5cbiAgICAgIC8vIHRvZG86IHdlJ2QgbGlrZSB0byBqdXN0IGhhdmUgaGFzKCkgcmV0dXJuIHRydWUgZm9yIGV2ZXJ5dGhpbmcsIGFuZCB0aGVuXG4gICAgICAvLyB1c2UgZ2V0KCkgdG8gcmFpc2UgYSBSZWZlcmVuY2VFcnJvciBmb3IgYW55dGhpbmcgbm90IG9uIHRoZSBzYWZlIGdsb2JhbC5cbiAgICAgIC8vIEJ1dCB3ZSB3YW50IHRvIGJlIGNvbXBhdGlibGUgd2l0aCBSZWZlcmVuY2VFcnJvciBpbiB0aGUgbm9ybWFsIGNhc2UgYW5kXG4gICAgICAvLyB0aGUgbGFjayBvZiBSZWZlcmVuY2VFcnJvciBpbiB0aGUgJ3R5cGVvZicgY2FzZS4gTXVzdCBlaXRoZXIgcmVsaWFibHlcbiAgICAgIC8vIGRpc3Rpbmd1aXNoIHRoZXNlIHR3byBjYXNlcyAodGhlIHRyYXAgYmVoYXZpb3IgbWlnaHQgYmUgZGlmZmVyZW50KSwgb3JcbiAgICAgIC8vIHdlIHJlbHkgb24gYSBtYW5kYXRvcnkgc291cmNlLXRvLXNvdXJjZSB0cmFuc2Zvcm0gdG8gY2hhbmdlICd0eXBlb2YgYWJjJ1xuICAgICAgLy8gdG8gWFhYLiBXZSBhbHJlYWR5IG5lZWQgYSBtYW5kYXRvcnkgcGFyc2UgdG8gcHJldmVudCB0aGUgJ2ltcG9ydCcsXG4gICAgICAvLyBzaW5jZSBpdCdzIGEgc3BlY2lhbCBmb3JtIGluc3RlYWQgb2YgbWVyZWx5IGJlaW5nIGEgZ2xvYmFsIHZhcmlhYmxlL1xuXG4gICAgICAvLyBub3RlOiBpZiB3ZSBtYWtlIGhhcygpIHJldHVybiB0cnVlIGFsd2F5cywgdGhlbiB3ZSBtdXN0IGltcGxlbWVudCBhXG4gICAgICAvLyBzZXQoKSB0cmFwIHRvIGF2b2lkIHN1YnZlcnRpbmcgdGhlIHByb3RlY3Rpb24gb2Ygc3RyaWN0IG1vZGUgKGl0IHdvdWxkXG4gICAgICAvLyBhY2NlcHQgYXNzaWdubWVudHMgdG8gdW5kZWZpbmVkIGdsb2JhbHMsIHdoZW4gaXQgb3VnaHQgdG8gdGhyb3dcbiAgICAgIC8vIFJlZmVyZW5jZUVycm9yIGZvciBzdWNoIGFzc2lnbm1lbnRzKVxuXG4gICAgICBoYXModGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgIGlmICh0aGlzLm5vblN0cmljdE1vZGVBc3NpZ25tZW50QWxsb3dlZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcHJveGllcyBzdHJpbmdpZnkgJ3Byb3AnLCBzbyBubyBUT0NUVE9VIGRhbmdlciBoZXJlXG5cbiAgICAgICAgLy8gdW5zYWZlR2xvYmFsOiBoaWRlIGFsbCBwcm9wZXJ0aWVzIG9mIHVuc2FmZUdsb2JhbCBhdCB0aGVcbiAgICAgICAgLy8gZXhwZW5zZSBvZiAndHlwZW9mJyBiZWluZyB3cm9uZyBmb3IgdGhvc2UgcHJvcGVydGllcy4gRm9yXG4gICAgICAgIC8vIGV4YW1wbGUsIGluIHRoZSBicm93c2VyLCBldmFsdWF0aW5nICdkb2N1bWVudCA9IDMnLCB3aWxsIGFkZFxuICAgICAgICAvLyBhIHByb3BlcnR5IHRvIHNhZmVHbG9iYWwgaW5zdGVhZCBvZiB0aHJvd2luZyBhXG4gICAgICAgIC8vIFJlZmVyZW5jZUVycm9yLlxuICAgICAgICBpZiAocHJvcCA9PT0gJ2V2YWwnIHx8IHByb3AgaW4gdGFyZ2V0IHx8IHByb3AgaW4gdW5zYWZlR2xvYmFsKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIGh0dHBzOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvOS4wL2luZGV4Lmh0bWwjc2VjLWh0bWwtbGlrZS1jb21tZW50c1xuXG4gIC8vIFRoZSBzaGltIGNhbm5vdCBjb3JyZWN0bHkgZW11bGF0ZSBhIGRpcmVjdCBldmFsIGFzIGV4cGxhaW5lZCBhdFxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vQWdvcmljL3JlYWxtcy1zaGltL2lzc3Vlcy8xMlxuICAvLyBXaXRob3V0IHJlamVjdGluZyBhcHBhcmVudCBkaXJlY3QgZXZhbCBzeW50YXgsIHdlIHdvdWxkXG4gIC8vIGFjY2lkZW50YWxseSBldmFsdWF0ZSB0aGVzZSB3aXRoIGFuIGVtdWxhdGlvbiBvZiBpbmRpcmVjdCBldmFsLiBUcFxuICAvLyBwcmV2ZW50IGZ1dHVyZSBjb21wYXRpYmlsaXR5IHByb2JsZW1zLCBpbiBzaGlmdGluZyBmcm9tIHVzZSBvZiB0aGVcbiAgLy8gc2hpbSB0byBnZW51aW5lIHBsYXRmb3JtIHN1cHBvcnQgZm9yIHRoZSBwcm9wb3NhbCwgd2Ugc2hvdWxkXG4gIC8vIGluc3RlYWQgc3RhdGljYWxseSByZWplY3QgY29kZSB0aGF0IHNlZW1zIHRvIGNvbnRhaW4gYSBkaXJlY3QgZXZhbFxuICAvLyBleHByZXNzaW9uLlxuICAvL1xuICAvLyBBcyB3aXRoIHRoZSBkeW5hbWljIGltcG9ydCBleHByZXNzaW9uLCB0byBhdm9pZCBhIGZ1bGwgcGFyc2UsIHdlIGRvXG4gIC8vIHRoaXMgYXBwcm94aW1hdGVseSB3aXRoIGEgcmVnZXhwLCB0aGF0IHdpbGwgYWxzbyByZWplY3Qgc3RyaW5nc1xuICAvLyB0aGF0IGFwcGVhciBzYWZlbHkgaW4gY29tbWVudHMgb3Igc3RyaW5ncy4gVW5saWtlIGR5bmFtaWMgaW1wb3J0LFxuICAvLyBpZiB3ZSBtaXNzIHNvbWUsIHRoaXMgb25seSBjcmVhdGVzIGZ1dHVyZSBjb21wYXQgcHJvYmxlbXMsIG5vdFxuICAvLyBzZWN1cml0eSBwcm9ibGVtcy4gVGh1cywgd2UgYXJlIG9ubHkgdHJ5aW5nIHRvIGNhdGNoIGlubm9jZW50XG4gIC8vIG9jY3VycmVuY2VzLCBub3QgbWFsaWNpb3VzIG9uZS4gSW4gcGFydGljdWxhciwgYChldmFsKSguLi4pYCBpc1xuICAvLyBkaXJlY3QgZXZhbCBzeW50YXggdGhhdCB3b3VsZCBub3QgYmUgY2F1Z2h0IGJ5IHRoZSBmb2xsb3dpbmcgcmVnZXhwLlxuXG4gIGNvbnN0IHNvbWVEaXJlY3RFdmFsUGF0dGVybiA9IC9cXGJldmFsXFxzKig/OlxcKHxcXC9bLypdKS87XG5cbiAgZnVuY3Rpb24gcmVqZWN0U29tZURpcmVjdEV2YWxFeHByZXNzaW9ucyhzKSB7XG4gICAgY29uc3QgaW5kZXggPSBzLnNlYXJjaChzb21lRGlyZWN0RXZhbFBhdHRlcm4pO1xuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IGxpbmVudW0gPSBzLnNsaWNlKDAsIGluZGV4KS5zcGxpdCgnXFxuJykubGVuZ3RoOyAvLyBtb3JlIG9yIGxlc3NcbiAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgICAgYHBvc3NpYmxlIGRpcmVjdCBldmFsIGV4cHJlc3Npb24gcmVqZWN0ZWQgYXJvdW5kIGxpbmUgJHtsaW5lbnVtfWBcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVqZWN0RGFuZ2Vyb3VzU291cmNlcyhzKSB7XG4gICAgLy8gcmVqZWN0SHRtbENvbW1lbnRzKHMpO1xuICAgIC8vIHJlamVjdEltcG9ydEV4cHJlc3Npb25zKHMpO1xuICAgIHJlamVjdFNvbWVEaXJlY3RFdmFsRXhwcmVzc2lvbnMocyk7XG4gIH1cblxuICAvLyBQb3J0aW9ucyBhZGFwdGVkIGZyb20gVjggLSBDb3B5cmlnaHQgMjAxNiB0aGUgVjggcHJvamVjdCBhdXRob3JzLlxuXG4gIGZ1bmN0aW9uIGJ1aWxkT3B0aW1pemVyKGNvbnN0YW50cykge1xuICAgIC8vIE5vIG5lZWQgdG8gYnVpbGQgYW4gb3ByaW1pemVyIHdoZW4gdGhlcmUgYXJlIG5vIGNvbnN0YW50cy5cbiAgICBpZiAoY29uc3RhbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnO1xuICAgIC8vIFVzZSAndGhpcycgdG8gYXZvaWQgZ29pbmcgdGhyb3VnaCB0aGUgc2NvcGUgcHJveHksIHdoaWNoIGlzIHVuZWNlc3NhcnlcbiAgICAvLyBzaW5jZSB0aGUgb3B0aW1pemVyIG9ubHkgbmVlZHMgcmVmZXJlbmNlcyB0byB0aGUgc2FmZSBnbG9iYWwuXG4gICAgcmV0dXJuIGBjb25zdCB7JHthcnJheUpvaW4oY29uc3RhbnRzLCAnLCcpfX0gPSB0aGlzO2A7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTY29wZWRFdmFsdWF0b3JGYWN0b3J5KHVuc2FmZVJlYywgY29uc3RhbnRzKSB7XG4gICAgY29uc3QgeyB1bnNhZmVGdW5jdGlvbiB9ID0gdW5zYWZlUmVjO1xuXG4gICAgY29uc3Qgb3B0aW1pemVyID0gYnVpbGRPcHRpbWl6ZXIoY29uc3RhbnRzKTtcblxuICAgIC8vIENyZWF0ZSBhIGZ1bmN0aW9uIGluIHNsb3BweSBtb2RlLCBzbyB0aGF0IHdlIGNhbiB1c2UgJ3dpdGgnLiBJdCByZXR1cm5zXG4gICAgLy8gYSBmdW5jdGlvbiBpbiBzdHJpY3QgbW9kZSB0aGF0IGV2YWx1YXRlcyB0aGUgcHJvdmlkZWQgY29kZSB1c2luZyBkaXJlY3RcbiAgICAvLyBldmFsLCBhbmQgdGh1cyBpbiBzdHJpY3QgbW9kZSBpbiB0aGUgc2FtZSBzY29wZS4gV2UgbXVzdCBiZSB2ZXJ5IGNhcmVmdWxcbiAgICAvLyB0byBub3QgY3JlYXRlIG5ldyBuYW1lcyBpbiB0aGlzIHNjb3BlXG5cbiAgICAvLyAxOiB3ZSB1c2UgJ3dpdGgnIChhcm91bmQgYSBQcm94eSkgdG8gY2F0Y2ggYWxsIGZyZWUgdmFyaWFibGUgbmFtZXMuIFRoZVxuICAgIC8vIGZpcnN0ICdhcmd1bWVudHNbMF0nIGhvbGRzIHRoZSBQcm94eSB3aGljaCBzYWZlbHkgd3JhcHMgdGhlIHNhZmVHbG9iYWxcbiAgICAvLyAyOiAnb3B0aW1pemVyJyBjYXRjaGVzIGNvbW1vbiB2YXJpYWJsZSBuYW1lcyBmb3Igc3BlZWRcbiAgICAvLyAzOiBUaGUgaW5uZXIgc3RyaWN0IGZ1bmN0aW9uIGlzIGVmZmVjdGl2ZWx5IHBhc3NlZCB0d28gcGFyYW1ldGVyczpcbiAgICAvLyAgICBhKSBpdHMgYXJndW1lbnRzWzBdIGlzIHRoZSBzb3VyY2UgdG8gYmUgZGlyZWN0bHkgZXZhbHVhdGVkLlxuICAgIC8vICAgIGIpIGl0cyAndGhpcycgaXMgdGhlIHRoaXMgYmluZGluZyBzZWVuIGJ5IHRoZSBjb2RlIGJlaW5nXG4gICAgLy8gICAgICAgZGlyZWN0bHkgZXZhbHVhdGVkLlxuXG4gICAgLy8gZXZlcnl0aGluZyBpbiB0aGUgJ29wdGltaXplcicgc3RyaW5nIGlzIGxvb2tlZCB1cCBpbiB0aGUgcHJveHlcbiAgICAvLyAoaW5jbHVkaW5nIGFuICdhcmd1bWVudHNbMF0nLCB3aGljaCBwb2ludHMgYXQgdGhlIFByb3h5KS4gJ2Z1bmN0aW9uJyBpc1xuICAgIC8vIGEga2V5d29yZCwgbm90IGEgdmFyaWFibGUsIHNvIGl0IGlzIG5vdCBsb29rZWQgdXAuIHRoZW4gJ2V2YWwnIGlzIGxvb2tlZFxuICAgIC8vIHVwIGluIHRoZSBwcm94eSwgdGhhdCdzIHRoZSBmaXJzdCB0aW1lIGl0IGlzIGxvb2tlZCB1cCBhZnRlclxuICAgIC8vIHVzZVVuc2FmZUV2YWx1YXRvciBpcyB0dXJuZWQgb24sIHNvIHRoZSBwcm94eSByZXR1cm5zIHRoZSByZWFsIHRoZVxuICAgIC8vIHVuc2FmZUV2YWwsIHdoaWNoIHNhdGlzZmllcyB0aGUgSXNEaXJlY3RFdmFsVHJhcCBwcmVkaWNhdGUsIHNvIGl0IHVzZXNcbiAgICAvLyB0aGUgZGlyZWN0IGV2YWwgYW5kIGdldHMgdGhlIGxleGljYWwgc2NvcGUuIFRoZSBzZWNvbmQgJ2FyZ3VtZW50c1swXScgaXNcbiAgICAvLyBsb29rZWQgdXAgaW4gdGhlIGNvbnRleHQgb2YgdGhlIGlubmVyIGZ1bmN0aW9uLiBUaGUgKmNvbnRlbnRzKiBvZlxuICAgIC8vIGFyZ3VtZW50c1swXSwgYmVjYXVzZSB3ZSdyZSB1c2luZyBkaXJlY3QgZXZhbCwgYXJlIGxvb2tlZCB1cCBpbiB0aGVcbiAgICAvLyBQcm94eSwgYnkgd2hpY2ggcG9pbnQgdGhlIHVzZVVuc2FmZUV2YWx1YXRvciBzd2l0Y2ggaGFzIGJlZW4gZmxpcHBlZFxuICAgIC8vIGJhY2sgdG8gJ2ZhbHNlJywgc28gYW55IGluc3RhbmNlcyBvZiAnZXZhbCcgaW4gdGhhdCBzdHJpbmcgd2lsbCBnZXQgdGhlXG4gICAgLy8gc2FmZSBldmFsdWF0b3IuXG5cbiAgICByZXR1cm4gdW5zYWZlRnVuY3Rpb24oYFxuICAgIHdpdGggKGFyZ3VtZW50c1swXSkge1xuICAgICAgJHtvcHRpbWl6ZXJ9XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgcmV0dXJuIGV2YWwoYXJndW1lbnRzWzBdKTtcbiAgICAgIH07XG4gICAgfVxuICBgKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNhZmVFdmFsdWF0b3JGYWN0b3J5KHVuc2FmZVJlYywgc2FmZUdsb2JhbCkge1xuICAgIGNvbnN0IHsgdW5zYWZlRnVuY3Rpb24gfSA9IHVuc2FmZVJlYztcblxuICAgIGNvbnN0IHNjb3BlSGFuZGxlciA9IGNyZWF0ZVNjb3BlSGFuZGxlcih1bnNhZmVSZWMsIHNhZmVHbG9iYWwpO1xuICAgIGNvbnN0IGNvbnN0YW50cyA9IGdldE9wdGltaXphYmxlR2xvYmFscyhzYWZlR2xvYmFsKTtcbiAgICBjb25zdCBzY29wZWRFdmFsdWF0b3JGYWN0b3J5ID0gY3JlYXRlU2NvcGVkRXZhbHVhdG9yRmFjdG9yeShcbiAgICAgIHVuc2FmZVJlYyxcbiAgICAgIGNvbnN0YW50c1xuICAgICk7XG5cbiAgICBmdW5jdGlvbiBmYWN0b3J5KGVuZG93bWVudHMgPSB7fSwgbm9uU3RyaWN0ID0gZmFsc2UpIHtcbiAgICAgIC8vIHRvZG8gKHNoaW0gbGltaXRhdGlvbik6IHNjYW4gZW5kb3dtZW50cywgdGhyb3cgZXJyb3IgaWYgZW5kb3dtZW50XG4gICAgICAvLyBvdmVybGFwcyB3aXRoIHRoZSBjb25zdCBvcHRpbWl6YXRpb24gKHdoaWNoIHdvdWxkIG90aGVyd2lzZVxuICAgICAgLy8gaW5jb3JyZWN0bHkgc2hhZG93IGVuZG93bWVudHMpLCBvciBpZiBlbmRvd21lbnRzIGluY2x1ZGVzICdldmFsJy4gQWxzb1xuICAgICAgLy8gcHJvaGliaXQgYWNjZXNzb3IgcHJvcGVydGllcyAodG8gYmUgYWJsZSB0byBjb25zaXN0ZW50bHkgZXhwbGFpblxuICAgICAgLy8gdGhpbmdzIGluIHRlcm1zIG9mIHNoaW1taW5nIHRoZSBnbG9iYWwgbGV4aWNhbCBzY29wZSkuXG4gICAgICAvLyB3cml0ZWFibGUtdnMtbm9ud3JpdGFibGUgPT0gbGV0LXZzLWNvbnN0LCBidXQgdGhlcmUncyBub1xuICAgICAgLy8gZ2xvYmFsLWxleGljYWwtc2NvcGUgZXF1aXZhbGVudCBvZiBhbiBhY2Nlc3Nvciwgb3V0c2lkZSB3aGF0IHdlIGNhblxuICAgICAgLy8gZXhwbGFpbi9zcGVjXG4gICAgICBjb25zdCBzY29wZVRhcmdldCA9IGNyZWF0ZShcbiAgICAgICAgc2FmZUdsb2JhbCxcbiAgICAgICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhlbmRvd21lbnRzKVxuICAgICAgKTtcbiAgICAgIGNvbnN0IHNjb3BlUHJveHkgPSBuZXcgUHJveHkoc2NvcGVUYXJnZXQsIHNjb3BlSGFuZGxlcik7XG4gICAgICBjb25zdCBzY29wZWRFdmFsdWF0b3IgPSBhcHBseShzY29wZWRFdmFsdWF0b3JGYWN0b3J5LCBzYWZlR2xvYmFsLCBbXG4gICAgICAgIHNjb3BlUHJveHlcbiAgICAgIF0pO1xuXG4gICAgICAvLyBXZSB1c2UgdGhlIHRoZSBjb25jaXNlIG1ldGhvZCBzeW50YXggdG8gY3JlYXRlIGFuIGV2YWwgd2l0aG91dCBhXG4gICAgICAvLyBbW0NvbnN0cnVjdF1dIGJlaGF2aW9yIChzdWNoIHRoYXQgdGhlIGludm9jYXRpb24gXCJuZXcgZXZhbCgpXCIgdGhyb3dzXG4gICAgICAvLyBUeXBlRXJyb3I6IGV2YWwgaXMgbm90IGEgY29uc3RydWN0b3JcIiksIGJ1dCB3aGljaCBzdGlsbCBhY2NlcHRzIGFcbiAgICAgIC8vICd0aGlzJyBiaW5kaW5nLlxuICAgICAgY29uc3Qgc2FmZUV2YWwgPSB7XG4gICAgICAgIGV2YWwoc3JjKSB7XG4gICAgICAgICAgc3JjID0gYCR7c3JjfWA7XG4gICAgICAgICAgcmVqZWN0RGFuZ2Vyb3VzU291cmNlcyhzcmMpO1xuICAgICAgICAgIHNjb3BlSGFuZGxlci5hbGxvd1Vuc2FmZUV2YWx1YXRvck9uY2UoKTtcbiAgICAgICAgICBpZiAobm9uU3RyaWN0ICYmICFzY29wZUhhbmRsZXIubm9uU3RyaWN0TW9kZUFzc2lnbm1lbnRBbGxvd2VkKCkpIHtcbiAgICAgICAgICAgIHNjb3BlSGFuZGxlci5hbGxvd05vblN0cmljdE1vZGVBc3NpZ25tZW50KDUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQgZXJyO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBFbnN1cmUgdGhhdCBcInRoaXNcIiByZXNvbHZlcyB0byB0aGUgc2FmZSBnbG9iYWwuXG4gICAgICAgICAgICByZXR1cm4gYXBwbHkoc2NvcGVkRXZhbHVhdG9yLCBzYWZlR2xvYmFsLCBbc3JjXSk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gc3Rhc2ggdGhlIGNoaWxkLWNvZGUgZXJyb3IgaW4gaG9wZXMgb2YgZGVidWdnaW5nIHRoZSBpbnRlcm5hbCBmYWlsdXJlXG4gICAgICAgICAgICBlcnIgPSBlO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgc2NvcGVIYW5kbGVyLmhhc05vblN0cmljdE1vZGVBc3NpZ25lZCgpO1xuICAgICAgICAgICAgLy8gYmVsdCBhbmQgc3VzcGVuZGVyczogdGhlIHByb3h5IHN3aXRjaGVzIHRoaXMgb2ZmIGltbWVkaWF0ZWx5IGFmdGVyXG4gICAgICAgICAgICAvLyB0aGUgZmlyc3QgYWNjZXNzLCBidXQgaWYgdGhhdCdzIG5vdCB0aGUgY2FzZSB3ZSBhYm9ydC5cbiAgICAgICAgICAgIGlmIChzY29wZUhhbmRsZXIudW5zYWZlRXZhbHVhdG9yQWxsb3dlZCgpKSB7XG4gICAgICAgICAgICAgIHRocm93VGFudHJ1bSgnaGFuZGxlciBkaWQgbm90IHJldm9rZSB1c2VVbnNhZmVFdmFsdWF0b3InLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfS5ldmFsO1xuXG4gICAgICAvLyBzYWZlRXZhbCdzIHByb3RvdHlwZSBpcyBjdXJyZW50bHkgdGhlIHByaW1hbCByZWFsbSdzXG4gICAgICAvLyBGdW5jdGlvbi5wcm90b3R5cGUsIHdoaWNoIHdlIG11c3Qgbm90IGxldCBlc2NhcGUuIFRvIG1ha2UgJ2V2YWxcbiAgICAgIC8vIGluc3RhbmNlb2YgRnVuY3Rpb24nIGJlIHRydWUgaW5zaWRlIHRoZSByZWFsbSwgd2UgbmVlZCB0byBwb2ludCBpdCBhdFxuICAgICAgLy8gdGhlIFJvb3RSZWFsbSdzIHZhbHVlLlxuXG4gICAgICAvLyBFbnN1cmUgdGhhdCBldmFsIGZyb20gYW55IGNvbXBhcnRtZW50IGluIGEgcm9vdCByZWFsbSBpcyBhbiBpbnN0YW5jZVxuICAgICAgLy8gb2YgRnVuY3Rpb24gaW4gYW55IGNvbXBhcnRtZW50IG9mIHRoZSBzYW1lIHJvb3QgcmVhbG0uXG4gICAgICBzZXRQcm90b3R5cGVPZihzYWZlRXZhbCwgdW5zYWZlRnVuY3Rpb24ucHJvdG90eXBlKTtcblxuICAgICAgYXNzZXJ0KGdldFByb3RvdHlwZU9mKHNhZmVFdmFsKS5jb25zdHJ1Y3RvciAhPT0gRnVuY3Rpb24sICdoaWRlIEZ1bmN0aW9uJyk7XG4gICAgICBhc3NlcnQoXG4gICAgICAgIGdldFByb3RvdHlwZU9mKHNhZmVFdmFsKS5jb25zdHJ1Y3RvciAhPT0gdW5zYWZlRnVuY3Rpb24sXG4gICAgICAgICdoaWRlIHVuc2FmZUZ1bmN0aW9uJ1xuICAgICAgKTtcblxuICAgICAgLy8gbm90ZTogYmUgY2FyZWZ1bCB0byBub3QgbGVhayBvdXIgcHJpbWFsIEZ1bmN0aW9uLnByb3RvdHlwZSBieSBzZXR0aW5nXG4gICAgICAvLyB0aGlzIHRvIGEgcGxhaW4gYXJyb3cgZnVuY3Rpb24uIE5vdyB0aGF0IHdlIGhhdmUgc2FmZUV2YWwsIHVzZSBpdC5cbiAgICAgIGRlZmluZVByb3BlcnRpZXMoc2FmZUV2YWwsIHtcbiAgICAgICAgdG9TdHJpbmc6IHtcbiAgICAgICAgICAvLyBXZSBicmVhayB1cCB0aGUgZm9sbG93aW5nIGxpdGVyYWwgc3RyaW5nIHNvIHRoYXQgYW5cbiAgICAgICAgICAvLyBhcHBhcmVudCBkaXJlY3QgZXZhbCBzeW50YXggZG9lcyBub3QgYXBwZWFyIGluIHRoaXNcbiAgICAgICAgICAvLyBmaWxlLiBUaHVzLCB3ZSBhdm9pZCByZWplY3Rpb24gYnkgdGhlIG92ZXJseSBlYWdlclxuICAgICAgICAgIC8vIHJlamVjdERhbmdlcm91c1NvdXJjZXMuXG4gICAgICAgICAgdmFsdWU6IHNhZmVFdmFsKFwiKCkgPT4gJ2Z1bmN0aW9uIGV2YWwnICsgJygpIHsgW3NoaW0gY29kZV0gfSdcIiksXG4gICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHNhZmVFdmFsO1xuICAgIH1cblxuICAgIHJldHVybiBmYWN0b3J5O1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU2FmZUV2YWx1YXRvcihzYWZlRXZhbHVhdG9yRmFjdG9yeSkge1xuICAgIHJldHVybiBzYWZlRXZhbHVhdG9yRmFjdG9yeSgpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU2FmZUV2YWx1YXRvcldoaWNoVGFrZXNFbmRvd21lbnRzKHNhZmVFdmFsdWF0b3JGYWN0b3J5KSB7XG4gICAgcmV0dXJuICh4LCBlbmRvd21lbnRzKSA9PiBzYWZlRXZhbHVhdG9yRmFjdG9yeShlbmRvd21lbnRzKSh4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHNhZmUgdmVyc2lvbiBvZiB0aGUgbmF0aXZlIEZ1bmN0aW9uIHdoaWNoIHJlbGllcyBvblxuICAgKiB0aGUgc2FmZXR5IG9mIGV2YWxFdmFsdWF0b3IgZm9yIGNvbmZpbmVtZW50LlxuICAgKi9cbiAgZnVuY3Rpb24gY3JlYXRlRnVuY3Rpb25FdmFsdWF0b3IoXG4gICAgdW5zYWZlUmVjLFxuICAgIHNhZmVFdmFsRmFjdG9yeSxcbiAgICByZWFsbUdsb2JhbFxuICApIHtcbiAgICBjb25zdCB7IHVuc2FmZUZ1bmN0aW9uLCB1bnNhZmVHbG9iYWwgfSA9IHVuc2FmZVJlYztcblxuICAgIGNvbnN0IHNhZmVFdmFsU3RyaWN0ID0gc2FmZUV2YWxGYWN0b3J5KHVuZGVmaW5lZCwgZmFsc2UpO1xuICAgIGNvbnN0IHNhZmVFdmFsTm9uU3RyaWN0ID0gc2FmZUV2YWxGYWN0b3J5KHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBjb25zdCBzYWZlRnVuY3Rpb24gPSBmdW5jdGlvbiBGdW5jdGlvbiguLi5wYXJhbXMpIHtcbiAgICAgIGNvbnN0IGZ1bmN0aW9uQm9keSA9IGAke2FycmF5UG9wKHBhcmFtcykgfHwgJyd9YDtcbiAgICAgIGxldCBmdW5jdGlvblBhcmFtcyA9IGAke2FycmF5Sm9pbihwYXJhbXMsICcsJyl9YDtcbiAgICAgIGlmICghcmVnZXhwVGVzdCgvXltcXHdcXHMsXSokLywgZnVuY3Rpb25QYXJhbXMpKSB7XG4gICAgICAgIHRocm93IG5ldyB1bnNhZmVHbG9iYWwuU3ludGF4RXJyb3IoXG4gICAgICAgICAgJ3NoaW0gbGltaXRhdGlvbjogRnVuY3Rpb24gYXJnIG11c3QgYmUgc2ltcGxlIEFTQ0lJIGlkZW50aWZpZXJzLCBwb3NzaWJseSBzZXBhcmF0ZWQgYnkgY29tbWFzOiBubyBkZWZhdWx0IHZhbHVlcywgcGF0dGVybiBtYXRjaGVzLCBvciBub24tQVNDSUkgcGFyYW1ldGVyIG5hbWVzJ1xuICAgICAgICApO1xuICAgICAgICAvLyB0aGlzIHByb3RlY3RzIGFnYWluc3QgTWF0dCBBdXN0aW4ncyBjbGV2ZXIgYXR0YWNrOlxuICAgICAgICAvLyBGdW5jdGlvbihcImFyZz1gXCIsIFwiLypib2R5YCl7fSk7KHt4OiB0aGlzLyoqL1wiKVxuICAgICAgICAvLyB3aGljaCB3b3VsZCB0dXJuIGludG9cbiAgICAgICAgLy8gICAgIChmdW5jdGlvbihhcmc9YFxuICAgICAgICAvLyAgICAgLypgYCovKXtcbiAgICAgICAgLy8gICAgICAvKmJvZHlgKXt9KTsoe3g6IHRoaXMvKiovXG4gICAgICAgIC8vICAgICB9KVxuICAgICAgICAvLyB3aGljaCBwYXJzZXMgYXMgYSBkZWZhdWx0IGFyZ3VtZW50IG9mIGBcXG4vKmBgKi8pe1xcbi8qYm9keWAgLCB3aGljaFxuICAgICAgICAvLyBpcyBhIHBhaXIgb2YgdGVtcGxhdGUgbGl0ZXJhbHMgYmFjay10by1iYWNrIChzbyB0aGUgZmlyc3Qgb25lXG4gICAgICAgIC8vIG5vbWluYWxseSBldmFsdWF0ZXMgdG8gdGhlIHBhcnNlciB0byB1c2Ugb24gdGhlIHNlY29uZCBvbmUpLCB3aGljaFxuICAgICAgICAvLyBjYW4ndCBhY3R1YWxseSBleGVjdXRlIChiZWNhdXNlIHRoZSBmaXJzdCBsaXRlcmFsIGV2YWxzIHRvIGEgc3RyaW5nLFxuICAgICAgICAvLyB3aGljaCBjYW4ndCBiZSBhIHBhcnNlciBmdW5jdGlvbiksIGJ1dCB0aGF0IGRvZXNuJ3QgbWF0dGVyIGJlY2F1c2VcbiAgICAgICAgLy8gdGhlIGZ1bmN0aW9uIGlzIGJ5cGFzc2VkIGVudGlyZWx5LiBXaGVuIHRoYXQgZ2V0cyBldmFsdWF0ZWQsIGl0XG4gICAgICAgIC8vIGRlZmluZXMgKGJ1dCBkb2VzIG5vdCBpbnZva2UpIGEgZnVuY3Rpb24sIHRoZW4gZXZhbHVhdGVzIGEgc2ltcGxlXG4gICAgICAgIC8vIHt4OiB0aGlzfSBleHByZXNzaW9uLCBnaXZpbmcgYWNjZXNzIHRvIHRoZSBzYWZlIGdsb2JhbC5cbiAgICAgIH1cblxuICAgICAgLy8gSXMgdGhpcyBhIHJlYWwgZnVuY3Rpb25Cb2R5LCBvciBpcyBzb21lb25lIGF0dGVtcHRpbmcgYW4gaW5qZWN0aW9uXG4gICAgICAvLyBhdHRhY2s/IFRoaXMgd2lsbCB0aHJvdyBhIFN5bnRheEVycm9yIGlmIHRoZSBzdHJpbmcgaXMgbm90IGFjdHVhbGx5IGFcbiAgICAgIC8vIGZ1bmN0aW9uIGJvZHkuIFdlIGNvZXJjZSB0aGUgYm9keSBpbnRvIGEgcmVhbCBzdHJpbmcgYWJvdmUgdG8gcHJldmVudFxuICAgICAgLy8gc29tZW9uZSBmcm9tIHBhc3NpbmcgYW4gb2JqZWN0IHdpdGggYSB0b1N0cmluZygpIHRoYXQgcmV0dXJucyBhIHNhZmVcbiAgICAgIC8vIHN0cmluZyB0aGUgZmlyc3QgdGltZSwgYnV0IGFuIGV2aWwgc3RyaW5nIHRoZSBzZWNvbmQgdGltZS5cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXcsIG5ldy1jYXBcbiAgICAgIG5ldyB1bnNhZmVGdW5jdGlvbihmdW5jdGlvbkJvZHkpO1xuXG4gICAgICBpZiAoc3RyaW5nSW5jbHVkZXMoZnVuY3Rpb25QYXJhbXMsICcpJykpIHtcbiAgICAgICAgLy8gSWYgdGhlIGZvcm1hbCBwYXJhbWV0ZXJzIHN0cmluZyBpbmNsdWRlICkgLSBhbiBpbGxlZ2FsXG4gICAgICAgIC8vIGNoYXJhY3RlciAtIGl0IG1heSBtYWtlIHRoZSBjb21iaW5lZCBmdW5jdGlvbiBleHByZXNzaW9uXG4gICAgICAgIC8vIGNvbXBpbGUuIFdlIGF2b2lkIHRoaXMgcHJvYmxlbSBieSBjaGVja2luZyBmb3IgdGhpcyBlYXJseSBvbi5cblxuICAgICAgICAvLyBub3RlOiB2OCB0aHJvd3MganVzdCBsaWtlIHRoaXMgZG9lcywgYnV0IGNocm9tZSBhY2NlcHRzXG4gICAgICAgIC8vIGUuZy4gJ2EgPSBuZXcgRGF0ZSgpJ1xuICAgICAgICB0aHJvdyBuZXcgdW5zYWZlR2xvYmFsLlN5bnRheEVycm9yKFxuICAgICAgICAgICdzaGltIGxpbWl0YXRpb246IEZ1bmN0aW9uIGFyZyBzdHJpbmcgY29udGFpbnMgcGFyZW50aGVzaXMnXG4gICAgICAgICk7XG4gICAgICAgIC8vIHRvZG86IHNoaW0gaW50ZWdyaXR5IHRocmVhdCBpZiB0aGV5IGNoYW5nZSBTeW50YXhFcnJvclxuICAgICAgfVxuXG4gICAgICAvLyB0b2RvOiBjaGVjayB0byBtYWtlIHN1cmUgdGhpcyAubGVuZ3RoIGlzIHNhZmUuIG1hcmttIHNheXMgc2FmZS5cbiAgICAgIGlmIChmdW5jdGlvblBhcmFtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIElmIHRoZSBmb3JtYWwgcGFyYW1ldGVycyBpbmNsdWRlIGFuIHVuYmFsYW5jZWQgYmxvY2sgY29tbWVudCwgdGhlXG4gICAgICAgIC8vIGZ1bmN0aW9uIG11c3QgYmUgcmVqZWN0ZWQuIFNpbmNlIEphdmFTY3JpcHQgZG9lcyBub3QgYWxsb3cgbmVzdGVkXG4gICAgICAgIC8vIGNvbW1lbnRzIHdlIGNhbiBpbmNsdWRlIGEgdHJhaWxpbmcgYmxvY2sgY29tbWVudCB0byBjYXRjaCB0aGlzLlxuICAgICAgICBmdW5jdGlvblBhcmFtcyArPSAnXFxuLypgYCovJztcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3JjID0gYChmdW5jdGlvbigke2Z1bmN0aW9uUGFyYW1zfSl7XFxuJHtmdW5jdGlvbkJvZHl9XFxufSlgO1xuICAgICAgY29uc3QgaXNTdHJpY3QgPSAhIS9eXFxzKlsnfFwiXXVzZSBzdHJpY3RbJ3xcIl0vLmV4ZWMoZnVuY3Rpb25Cb2R5KTtcbiAgICAgIGlmIChpc1N0cmljdCkge1xuICAgICAgICByZXR1cm4gc2FmZUV2YWxTdHJpY3Qoc3JjKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZuID0gc2FmZUV2YWxOb25TdHJpY3Qoc3JjKTtcbiAgICAgIGlmIChpc1N0cmljdCkge1xuICAgICAgICByZXR1cm4gZm47XG4gICAgICB9XG4gICAgICAvLyB3ZSBmaXggdGhlIGB0aGlzYCBiaW5kaW5nIGluIEZ1bmN0aW9uKCkuXG4gICAgICBjb25zdCBiaW5kVGhpcyA9IGAoZnVuY3Rpb24gKGdsb2JhbFRoaXMsIGYpIHtcbiAgZnVuY3Rpb24gZjIoKSB7XG4gICAgcmV0dXJuIFJlZmxlY3QuYXBwbHkoZiwgdGhpcyB8fCBnbG9iYWxUaGlzLCBhcmd1bWVudHMpO1xuICB9XG4gIGYyLnRvU3RyaW5nID0gKCkgPT4gZi50b1N0cmluZygpO1xuICByZXR1cm4gZjI7XG59KWA7XG4gICAgICBjb25zdCBmbldpdGhUaGlzID0gc2FmZUV2YWxTdHJpY3QoYmluZFRoaXMpKHJlYWxtR2xvYmFsLCBmbik7XG4gICAgICByZXR1cm4gZm5XaXRoVGhpcztcbiAgICB9O1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgRnVuY3Rpb24gZnJvbSBhbnkgY29tcGFydG1lbnQgaW4gYSByb290IHJlYWxtIGNhbiBiZSB1c2VkXG4gICAgLy8gd2l0aCBpbnN0YW5jZSBjaGVja3MgaW4gYW55IGNvbXBhcnRtZW50IG9mIHRoZSBzYW1lIHJvb3QgcmVhbG0uXG4gICAgc2V0UHJvdG90eXBlT2Yoc2FmZUZ1bmN0aW9uLCB1bnNhZmVGdW5jdGlvbi5wcm90b3R5cGUpO1xuXG4gICAgYXNzZXJ0KFxuICAgICAgZ2V0UHJvdG90eXBlT2Yoc2FmZUZ1bmN0aW9uKS5jb25zdHJ1Y3RvciAhPT0gRnVuY3Rpb24sXG4gICAgICAnaGlkZSBGdW5jdGlvbidcbiAgICApO1xuICAgIGFzc2VydChcbiAgICAgIGdldFByb3RvdHlwZU9mKHNhZmVGdW5jdGlvbikuY29uc3RydWN0b3IgIT09IHVuc2FmZUZ1bmN0aW9uLFxuICAgICAgJ2hpZGUgdW5zYWZlRnVuY3Rpb24nXG4gICAgKTtcblxuICAgIGRlZmluZVByb3BlcnRpZXMoc2FmZUZ1bmN0aW9uLCB7XG4gICAgICAvLyBFbnN1cmUgdGhhdCBhbnkgZnVuY3Rpb24gY3JlYXRlZCBpbiBhbnkgY29tcGFydG1lbnQgaW4gYSByb290IHJlYWxtIGlzIGFuXG4gICAgICAvLyBpbnN0YW5jZSBvZiBGdW5jdGlvbiBpbiBhbnkgY29tcGFydG1lbnQgb2YgdGhlIHNhbWUgcm9vdCByYWxtLlxuICAgICAgcHJvdG90eXBlOiB7IHZhbHVlOiB1bnNhZmVGdW5jdGlvbi5wcm90b3R5cGUgfSxcblxuICAgICAgLy8gUHJvdmlkZSBhIGN1c3RvbSBvdXRwdXQgd2l0aG91dCBvdmVyd3JpdGluZyB0aGVcbiAgICAgIC8vIEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZyB3aGljaCBpcyBjYWxsZWQgYnkgc29tZSB0aGlyZC1wYXJ0eVxuICAgICAgLy8gbGlicmFyaWVzLlxuICAgICAgdG9TdHJpbmc6IHtcbiAgICAgICAgdmFsdWU6IHNhZmVFdmFsU3RyaWN0KFwiKCkgPT4gJ2Z1bmN0aW9uIEZ1bmN0aW9uKCkgeyBbc2hpbSBjb2RlXSB9J1wiKSxcbiAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2FmZUZ1bmN0aW9uO1xuICB9XG5cbiAgLy8gTWltaWMgcHJpdmF0ZSBtZW1iZXJzIG9uIHRoZSByZWFsbSBpbnN0YW5jZXMuXG4gIC8vIFdlIGRlZmluZSBpdCBpbiB0aGUgc2FtZSBtb2R1bGUgYW5kIGRvIG5vdCBleHBvcnQgaXQuXG4gIGNvbnN0IFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZSA9IG5ldyBXZWFrTWFwKCk7XG5cbiAgZnVuY3Rpb24gZ2V0UmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHJlYWxtKSB7XG4gICAgLy8gRGV0ZWN0IG5vbi1vYmplY3RzLlxuICAgIGFzc2VydChPYmplY3QocmVhbG0pID09PSByZWFsbSwgJ2JhZCBvYmplY3QsIG5vdCBhIFJlYWxtIGluc3RhbmNlJyk7XG4gICAgLy8gUmVhbG0gaW5zdGFuY2UgaGFzIG5vIHJlYWxtUmVjLiBTaG91bGQgbm90IHByb2NlZWQuXG4gICAgYXNzZXJ0KFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZS5oYXMocmVhbG0pLCAnUmVhbG0gaW5zdGFuY2UgaGFzIG5vIHJlY29yZCcpO1xuXG4gICAgcmV0dXJuIFJlYWxtUmVjRm9yUmVhbG1JbnN0YW5jZS5nZXQocmVhbG0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVnaXN0ZXJSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UocmVhbG0sIHJlYWxtUmVjKSB7XG4gICAgLy8gRGV0ZWN0IG5vbi1vYmplY3RzLlxuICAgIGFzc2VydChPYmplY3QocmVhbG0pID09PSByZWFsbSwgJ2JhZCBvYmplY3QsIG5vdCBhIFJlYWxtIGluc3RhbmNlJyk7XG4gICAgLy8gQXR0ZW1wdCB0byBjaGFuZ2UgYW4gZXhpc3RpbmcgcmVhbG1SZWMgb24gYSByZWFsbSBpbnN0YW5jZS4gU2hvdWxkIG5vdCBwcm9jZWVkLlxuICAgIGFzc2VydChcbiAgICAgICFSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2UuaGFzKHJlYWxtKSxcbiAgICAgICdSZWFsbSBpbnN0YW5jZSBhbHJlYWR5IGhhcyBhIHJlY29yZCdcbiAgICApO1xuXG4gICAgUmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlLnNldChyZWFsbSwgcmVhbG1SZWMpO1xuICB9XG5cbiAgLy8gSW5pdGlhbGl6ZSB0aGUgZ2xvYmFsIHZhcmlhYmxlcyBmb3IgdGhlIG5ldyBSZWFsbS5cbiAgZnVuY3Rpb24gc2V0RGVmYXVsdEJpbmRpbmdzKHNhZmVHbG9iYWwsIHNhZmVFdmFsLCBzYWZlRnVuY3Rpb24pIHtcbiAgICBkZWZpbmVQcm9wZXJ0aWVzKHNhZmVHbG9iYWwsIHtcbiAgICAgIGV2YWw6IHtcbiAgICAgICAgdmFsdWU6IHNhZmVFdmFsLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9LFxuICAgICAgRnVuY3Rpb246IHtcbiAgICAgICAgdmFsdWU6IHNhZmVGdW5jdGlvbixcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlUmVhbG1SZWModW5zYWZlUmVjKSB7XG4gICAgY29uc3QgeyBzaGFyZWRHbG9iYWxEZXNjcywgdW5zYWZlR2xvYmFsIH0gPSB1bnNhZmVSZWM7XG5cbiAgICBjb25zdCBzYWZlR2xvYmFsID0gY3JlYXRlKHVuc2FmZUdsb2JhbC5PYmplY3QucHJvdG90eXBlLCBzaGFyZWRHbG9iYWxEZXNjcyk7XG5cbiAgICBjb25zdCBzYWZlRXZhbHVhdG9yRmFjdG9yeSA9IGNyZWF0ZVNhZmVFdmFsdWF0b3JGYWN0b3J5KFxuICAgICAgdW5zYWZlUmVjLFxuICAgICAgc2FmZUdsb2JhbFxuICAgICk7XG4gICAgY29uc3Qgc2FmZUV2YWwgPSBjcmVhdGVTYWZlRXZhbHVhdG9yKHNhZmVFdmFsdWF0b3JGYWN0b3J5KTtcbiAgICBjb25zdCBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzID0gY3JlYXRlU2FmZUV2YWx1YXRvcldoaWNoVGFrZXNFbmRvd21lbnRzKFxuICAgICAgc2FmZUV2YWx1YXRvckZhY3RvcnlcbiAgICApO1xuICAgIGNvbnN0IHNhZmVGdW5jdGlvbiA9IGNyZWF0ZUZ1bmN0aW9uRXZhbHVhdG9yKFxuICAgICAgdW5zYWZlUmVjLFxuICAgICAgc2FmZUV2YWx1YXRvckZhY3RvcnksXG4gICAgICBzYWZlR2xvYmFsXG4gICAgKTtcblxuICAgIHNldERlZmF1bHRCaW5kaW5ncyhzYWZlR2xvYmFsLCBzYWZlRXZhbCwgc2FmZUZ1bmN0aW9uKTtcblxuICAgIGNvbnN0IHJlYWxtUmVjID0gZnJlZXplKHtcbiAgICAgIHNhZmVHbG9iYWwsXG4gICAgICBzYWZlRXZhbCxcbiAgICAgIHNhZmVFdmFsV2hpY2hUYWtlc0VuZG93bWVudHMsXG4gICAgICBzYWZlRnVuY3Rpb25cbiAgICB9KTtcblxuICAgIHJldHVybiByZWFsbVJlYztcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHJvb3QgcmVhbG0gdXNlcyBhIGZyZXNoIHNldCBvZiBuZXcgaW50cmluaWNzLiBIZXJlIHdlIGZpcnN0IGNyZWF0ZVxuICAgKiBhIG5ldyB1bnNhZmUgcmVjb3JkLCB3aGljaCBpbmhlcml0cyB0aGUgc2hpbXMuIFRoZW4gd2UgcHJvY2VlZCB3aXRoXG4gICAqIHRoZSBjcmVhdGlvbiBvZiB0aGUgcmVhbG0gcmVjb3JkLCBhbmQgd2UgYXBwbHkgdGhlIHNoaW1zLlxuICAgKi9cbiAgZnVuY3Rpb24gaW5pdFJvb3RSZWFsbShwYXJlbnRVbnNhZmVSZWMsIHNlbGYsIG9wdGlvbnMpIHtcbiAgICAvLyBub3RlOiAnc2VsZicgaXMgdGhlIGluc3RhbmNlIG9mIHRoZSBSZWFsbS5cblxuICAgIC8vIHRvZG86IGludmVzdGlnYXRlIGF0dGFja3MgdmlhIEFycmF5LnNwZWNpZXNcbiAgICAvLyB0b2RvOiB0aGlzIGFjY2VwdHMgbmV3U2hpbXM9J3N0cmluZycsIGJ1dCBpdCBzaG91bGQgcmVqZWN0IHRoYXRcbiAgICBjb25zdCB7IHNoaW1zOiBuZXdTaGltcyB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBhbGxTaGltcyA9IGFycmF5Q29uY2F0KHBhcmVudFVuc2FmZVJlYy5hbGxTaGltcywgbmV3U2hpbXMpO1xuXG4gICAgLy8gVGhlIHVuc2FmZSByZWNvcmQgaXMgY3JlYXRlZCBhbHJlYWR5IHJlcGFpcmVkLlxuICAgIGNvbnN0IHVuc2FmZVJlYyA9IGNyZWF0ZU5ld1Vuc2FmZVJlYyhhbGxTaGltcyk7XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICBjb25zdCBSZWFsbSA9IGNyZWF0ZVJlYWxtRmFjYWRlKHVuc2FmZVJlYywgQmFzZVJlYWxtKTtcblxuICAgIC8vIEFkZCBhIFJlYWxtIGRlc2NyaXB0b3IgdG8gc2hhcmVkR2xvYmFsRGVzY3MsIHNvIGl0IGNhbiBiZSBkZWZpbmVkIG9udG8gdGhlXG4gICAgLy8gc2FmZUdsb2JhbCBsaWtlIHRoZSByZXN0IG9mIHRoZSBnbG9iYWxzLlxuICAgIHVuc2FmZVJlYy5zaGFyZWRHbG9iYWxEZXNjcy5SZWFsbSA9IHtcbiAgICAgIHZhbHVlOiBSZWFsbSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfTtcblxuICAgIC8vIENyZWF0aW5nIHRoZSByZWFsbVJlYyBwcm92aWRlcyB0aGUgZ2xvYmFsIG9iamVjdCwgZXZhbCgpIGFuZCBGdW5jdGlvbigpXG4gICAgLy8gdG8gdGhlIHJlYWxtLlxuICAgIGNvbnN0IHJlYWxtUmVjID0gY3JlYXRlUmVhbG1SZWModW5zYWZlUmVjKTtcblxuICAgIC8vIEFwcGx5IGFsbCBzaGltcyBpbiB0aGUgbmV3IFJvb3RSZWFsbS4gV2UgZG9uJ3QgZG8gdGhpcyBmb3IgY29tcGFydG1lbnRzLlxuICAgIGNvbnN0IHsgc2FmZUV2YWxXaGljaFRha2VzRW5kb3dtZW50cyB9ID0gcmVhbG1SZWM7XG4gICAgZm9yIChjb25zdCBzaGltIG9mIGFsbFNoaW1zKSB7XG4gICAgICBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzKHNoaW0pO1xuICAgIH1cblxuICAgIC8vIFRoZSByZWFsbVJlYyBhY3RzIGFzIGEgcHJpdmF0ZSBmaWVsZCBvbiB0aGUgcmVhbG0gaW5zdGFuY2UuXG4gICAgcmVnaXN0ZXJSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2Uoc2VsZiwgcmVhbG1SZWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgY29tcGFydG1lbnQgc2hhcmVzIHRoZSBpbnRyaW5zaWNzIG9mIGl0cyByb290IHJlYWxtLiBIZXJlLCBvbmx5IGFcbiAgICogcmVhbG1SZWMgaXMgbmVjZXNzYXJ5IHRvIGhvbGQgdGhlIGdsb2JhbCBvYmplY3QsIGV2YWwoKSBhbmQgRnVuY3Rpb24oKS5cbiAgICovXG4gIGZ1bmN0aW9uIGluaXRDb21wYXJ0bWVudCh1bnNhZmVSZWMsIHNlbGYpIHtcbiAgICAvLyBub3RlOiAnc2VsZicgaXMgdGhlIGluc3RhbmNlIG9mIHRoZSBSZWFsbS5cblxuICAgIGNvbnN0IHJlYWxtUmVjID0gY3JlYXRlUmVhbG1SZWModW5zYWZlUmVjKTtcblxuICAgIC8vIFRoZSByZWFsbVJlYyBhY3RzIGFzIGEgcHJpdmF0ZSBmaWVsZCBvbiB0aGUgcmVhbG0gaW5zdGFuY2UuXG4gICAgcmVnaXN0ZXJSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2Uoc2VsZiwgcmVhbG1SZWMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVhbG1HbG9iYWwoc2VsZikge1xuICAgIGNvbnN0IHsgc2FmZUdsb2JhbCB9ID0gZ2V0UmVhbG1SZWNGb3JSZWFsbUluc3RhbmNlKHNlbGYpO1xuICAgIHJldHVybiBzYWZlR2xvYmFsO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhbG1FdmFsdWF0ZShzZWxmLCB4LCBlbmRvd21lbnRzID0ge30pIHtcbiAgICAvLyB0b2RvOiBkb24ndCBwYXNzIGluIHByaW1hbC1yZWFsbSBvYmplY3RzIGxpa2Uge30sIGZvciBzYWZldHkuIE9UT0ggaXRzXG4gICAgLy8gcHJvcGVydGllcyBhcmUgY29waWVkIG9udG8gdGhlIG5ldyBnbG9iYWwgJ3RhcmdldCcuXG4gICAgLy8gdG9kbzogZmlndXJlIG91dCBhIHdheSB0byBtZW1icmFuZSBhd2F5IHRoZSBjb250ZW50cyB0byBzYWZldHkuXG4gICAgY29uc3QgeyBzYWZlRXZhbFdoaWNoVGFrZXNFbmRvd21lbnRzIH0gPSBnZXRSZWFsbVJlY0ZvclJlYWxtSW5zdGFuY2Uoc2VsZik7XG4gICAgcmV0dXJuIHNhZmVFdmFsV2hpY2hUYWtlc0VuZG93bWVudHMoeCwgZW5kb3dtZW50cyk7XG4gIH1cblxuICBjb25zdCBCYXNlUmVhbG0gPSB7XG4gICAgaW5pdFJvb3RSZWFsbSxcbiAgICBpbml0Q29tcGFydG1lbnQsXG4gICAgZ2V0UmVhbG1HbG9iYWwsXG4gICAgcmVhbG1FdmFsdWF0ZVxuICB9O1xuXG4gIC8vIENyZWF0ZSB0aGUgY3VycmVudCB1bnNhZmVSZWMgZnJvbSB0aGUgY3VycmVudCBcInByaW1hbFwiIGVudmlyb25tZW50ICh0aGUgcmVhbG1cbiAgLy8gd2hlcmUgdGhlIFJlYWxtIHNoaW0gaXMgbG9hZGVkIGFuZCBleGVjdXRlZCkuXG4gIGNvbnN0IGN1cnJlbnRVbnNhZmVSZWMgPSBjcmVhdGVDdXJyZW50VW5zYWZlUmVjKCk7XG5cbiAgLyoqXG4gICAqIFRoZSBcInByaW1hbFwiIHJlYWxtIGNsYXNzIGlzIGRlZmluZWQgaW4gdGhlIGN1cnJlbnQgXCJwcmltYWxcIiBlbnZpcm9ubWVudCxcbiAgICogYW5kIGlzIHBhcnQgb2YgdGhlIHNoaW0uIFRoZXJlIGlzIG5vIG5lZWQgdG8gZmFjYWRlIHRoaXMgY2xhc3MgdmlhIGV2YWx1YXRpb25cbiAgICogYmVjYXVzZSBib3RoIHNoYXJlIHRoZSBzYW1lIGludHJpbnNpY3MuXG4gICAqL1xuICBjb25zdCBSZWFsbSA9IGJ1aWxkQ2hpbGRSZWFsbShjdXJyZW50VW5zYWZlUmVjLCBCYXNlUmVhbG0pO1xuXG4gIHJldHVybiBSZWFsbTtcblxufSkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cmVhbG1zLXNoaW0udW1kLmpzLm1hcFxuIiwiY29uc3QgTWVzc2FnZUNlbnRlckV2ZW50ID0gJ0hvbG9mbG93cy1LaXQgTWVzc2FnZUNlbnRlcic7XG5jb25zdCBuZXdNZXNzYWdlID0gKGtleSwgZGF0YSkgPT4gbmV3IEN1c3RvbUV2ZW50KE1lc3NhZ2VDZW50ZXJFdmVudCwgeyBkZXRhaWw6IHsgZGF0YSwga2V5IH0gfSk7XG5jb25zdCBub29wID0gKCkgPT4geyB9O1xuLyoqXG4gKiBTZW5kIGFuZCByZWNlaXZlIG1lc3NhZ2VzIGluIGRpZmZlcmVudCBjb250ZXh0cy5cbiAqL1xuZXhwb3J0IGNsYXNzIE1lc3NhZ2VDZW50ZXIge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSBpbnN0YW5jZUtleSAtIFVzZSB0aGlzIGluc3RhbmNlS2V5IHRvIGRpc3Rpbmd1aXNoIHlvdXIgbWVzc2FnZXMgYW5kIG90aGVycy5cbiAgICAgKiBUaGlzIG9wdGlvbiBjYW5ub3QgbWFrZSB5b3VyIG1lc3NhZ2Ugc2FmZSFcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihpbnN0YW5jZUtleSA9ICcnKSB7XG4gICAgICAgIHRoaXMuaW5zdGFuY2VLZXkgPSBpbnN0YW5jZUtleTtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IChyZXF1ZXN0KSA9PiB7XG4gICAgICAgICAgICBsZXQgeyBrZXksIGRhdGEsIGluc3RhbmNlS2V5IH0gPSByZXF1ZXN0LmRldGFpbCB8fCByZXF1ZXN0O1xuICAgICAgICAgICAgLy8gTWVzc2FnZSBpcyBub3QgZm9yIHVzXG4gICAgICAgICAgICBpZiAodGhpcy5pbnN0YW5jZUtleSAhPT0gKGluc3RhbmNlS2V5IHx8ICcnKSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBpZiAodGhpcy53cml0ZVRvQ29uc29sZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAlY1JlY2VpdmUlYyAlYyR7a2V5LnRvU3RyaW5nKCl9YCwgJ2JhY2tncm91bmQ6IHJnYmEoMCwgMjU1LCAyNTUsIDAuNik7IGNvbG9yOiBibGFjazsgcGFkZGluZzogMHB4IDZweDsgYm9yZGVyLXJhZGl1czogNHB4OycsICcnLCAndGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmUnLCBkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmZpbHRlcihpdCA9PiBpdC5rZXkgPT09IGtleSkuZm9yRWFjaChpdCA9PiBpdC5oYW5kbGVyKGRhdGEpKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy53cml0ZVRvQ29uc29sZSA9IGZhbHNlO1xuICAgICAgICBpZiAodHlwZW9mIGJyb3dzZXIgIT09ICd1bmRlZmluZWQnICYmIGJyb3dzZXIucnVudGltZSAmJiBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlKSB7XG4gICAgICAgICAgICAvLyBGaXJlZCB3aGVuIGEgbWVzc2FnZSBpcyBzZW50IGZyb20gZWl0aGVyIGFuIGV4dGVuc2lvbiBwcm9jZXNzIChieSBydW50aW1lLnNlbmRNZXNzYWdlKVxuICAgICAgICAgICAgLy8gb3IgYSBjb250ZW50IHNjcmlwdCAoYnkgdGFicy5zZW5kTWVzc2FnZSkuXG4gICAgICAgICAgICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKHRoaXMubGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoTWVzc2FnZUNlbnRlckV2ZW50LCB0aGlzLmxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBMaXN0ZW4gdG8gYW4gZXZlbnRcbiAgICAgKiBAcGFyYW0gZXZlbnQgLSBOYW1lIG9mIHRoZSBldmVudFxuICAgICAqIEBwYXJhbSBoYW5kbGVyIC0gSGFuZGxlciBvZiB0aGUgZXZlbnRcbiAgICAgKi9cbiAgICBvbihldmVudCwgaGFuZGxlcikge1xuICAgICAgICB0aGlzLmxpc3RlbmVycy5wdXNoKHtcbiAgICAgICAgICAgIGhhbmRsZXI6IGRhdGEgPT4gaGFuZGxlcihkYXRhKSxcbiAgICAgICAgICAgIGtleTogZXZlbnQsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kIG1lc3NhZ2UgdG8gbG9jYWwgb3Igb3RoZXIgaW5zdGFuY2Ugb2YgZXh0ZW5zaW9uXG4gICAgICogQHBhcmFtIGtleSAtIEtleSBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBkYXRhIC0gRGF0YSBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBhbHNvU2VuZFRvRG9jdW1lbnQgLSAhIFNlbmQgbWVzc2FnZSB0byBkb2N1bWVudC4gVGhpcyBtYXkgbGVha3Mgc2VjcmV0ISBPbmx5IG9wZW4gaW4gbG9jYWxob3N0IVxuICAgICAqL1xuICAgIHNlbmQoa2V5LCBkYXRhLCBhbHNvU2VuZFRvRG9jdW1lbnQgPSBsb2NhdGlvbi5ob3N0bmFtZSA9PT0gJ2xvY2FsaG9zdCcpIHtcbiAgICAgICAgaWYgKHRoaXMud3JpdGVUb0NvbnNvbGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAlY1NlbmQlYyAlYyR7a2V5LnRvU3RyaW5nKCl9YCwgJ2JhY2tncm91bmQ6IHJnYmEoMCwgMjU1LCAyNTUsIDAuNik7IGNvbG9yOiBibGFjazsgcGFkZGluZzogMHB4IDZweDsgYm9yZGVyLXJhZGl1czogNHB4OycsICcnLCAndGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmUnLCBkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtc2cgPSB7IGRhdGEsIGtleSwgaW5zdGFuY2VLZXk6IHRoaXMuaW5zdGFuY2VLZXkgfHwgJycgfTtcbiAgICAgICAgaWYgKHR5cGVvZiBicm93c2VyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaWYgKGJyb3dzZXIucnVudGltZSAmJiBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobXNnKS5jYXRjaChub29wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChicm93c2VyLnRhYnMpIHtcbiAgICAgICAgICAgICAgICAvLyBTZW5kIG1lc3NhZ2UgdG8gQ29udGVudCBTY3JpcHRcbiAgICAgICAgICAgICAgICBicm93c2VyLnRhYnMucXVlcnkoeyBkaXNjYXJkZWQ6IGZhbHNlIH0pLnRoZW4odGFicyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgdGFiIG9mIHRhYnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWIuaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJvd3Nlci50YWJzLnNlbmRNZXNzYWdlKHRhYi5pZCwgbXNnKS5jYXRjaChub29wKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbHNvU2VuZFRvRG9jdW1lbnQgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyAmJiBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KSB7XG4gICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ld01lc3NhZ2Uoa2V5LCBkYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1NZXNzYWdlQ2VudGVyLmpzLm1hcCIsIi8qKlxuICogVGhpcyBpcyBhIGxpZ2h0IGltcGxlbWVudGF0aW9uIG9mIEpTT04gUlBDIDIuMFxuICpcbiAqIGh0dHBzOi8vd3d3Lmpzb25ycGMub3JnL3NwZWNpZmljYXRpb25cbiAqXG4gKiAhIE5vdCBpbXBsZW1lbnRlZDpcbiAqIC0gU2VuZCBOb3RpZmljYXRpb24gKHJlY2VpdmUgTm90aWZpY2F0aW9uIGlzIG9rYXkpXG4gKiAtIEJhdGNoIGludm9jYXRpb24gKGRlZmluZWQgaW4gdGhlIHNlY3Rpb24gNiBvZiB0aGUgc3BlYylcbiAqL1xuaW1wb3J0IHsgTWVzc2FnZUNlbnRlciBhcyBIb2xvZmxvd3NNZXNzYWdlQ2VudGVyIH0gZnJvbSAnLi9NZXNzYWdlQ2VudGVyJztcbi8qKlxuICogU2VyaWFsaXphdGlvbiBpbXBsZW1lbnRhdGlvbiB0aGF0IGRvIG5vdGhpbmdcbiAqL1xuZXhwb3J0IGNvbnN0IE5vU2VyaWFsaXphdGlvbiA9IHtcbiAgICBhc3luYyBzZXJpYWxpemF0aW9uKGZyb20pIHtcbiAgICAgICAgcmV0dXJuIGZyb207XG4gICAgfSxcbiAgICBhc3luYyBkZXNlcmlhbGl6YXRpb24oc2VyaWFsaXplZCkge1xuICAgICAgICByZXR1cm4gc2VyaWFsaXplZDtcbiAgICB9LFxufTtcbi8qKlxuICogU2VyaWFsaXphdGlvbiBpbXBsZW1lbnRhdGlvbiBieSBKU09OLnBhcnNlL3N0cmluZ2lmeVxuICpcbiAqIEBwYXJhbSByZXBsYWNlciAtIFJlcGxhY2VyIG9mIEpTT04ucGFyc2Uvc3RyaW5naWZ5XG4gKi9cbmV4cG9ydCBjb25zdCBKU09OU2VyaWFsaXphdGlvbiA9IChyZXBsYWNlciA9IHVuZGVmaW5lZCkgPT4gKHtcbiAgICBhc3luYyBzZXJpYWxpemF0aW9uKGZyb20pIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGZyb20sIHJlcGxhY2VyKTtcbiAgICB9LFxuICAgIGFzeW5jIGRlc2VyaWFsaXphdGlvbihzZXJpYWxpemVkKSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKHNlcmlhbGl6ZWQsIHJlcGxhY2VyKTtcbiAgICB9LFxufSk7XG4vKipcbiAqIEFzeW5jIGNhbGwgYmV0d2VlbiBkaWZmZXJlbnQgY29udGV4dC5cbiAqXG4gKiBAcmVtYXJrc1xuICogQXN5bmMgY2FsbCBpcyBhIGhpZ2ggbGV2ZWwgYWJzdHJhY3Rpb24gb2YgTWVzc2FnZUNlbnRlci5cbiAqXG4gKiAjIFNoYXJlZCBjb2RlXG4gKlxuICogLSBIb3cgdG8gc3RyaW5naWZ5L3BhcnNlIHBhcmFtZXRlcnMvcmV0dXJucyBzaG91bGQgYmUgc2hhcmVkLCBkZWZhdWx0cyB0byBOb1NlcmlhbGl6YXRpb24uXG4gKlxuICogLSBga2V5YCBzaG91bGQgYmUgc2hhcmVkLlxuICpcbiAqICMgT25lIHNpZGVcbiAqXG4gKiAtIFNob3VsZCBwcm92aWRlIHNvbWUgZnVuY3Rpb25zIHRoZW4gZXhwb3J0IGl0cyB0eXBlIChmb3IgZXhhbXBsZSwgYEJhY2tncm91bmRDYWxsc2ApXG4gKlxuICogLSBgY29uc3QgY2FsbCA9IEFzeW5jQ2FsbDxGb3JlZ3JvdW5kQ2FsbHM+KGJhY2tncm91bmRDYWxscylgXG4gKlxuICogLSBUaGVuIHlvdSBjYW4gYGNhbGxgIGFueSBtZXRob2Qgb24gYEZvcmVncm91bmRDYWxsc2BcbiAqXG4gKiAjIE90aGVyIHNpZGVcbiAqXG4gKiAtIFNob3VsZCBwcm92aWRlIHNvbWUgZnVuY3Rpb25zIHRoZW4gZXhwb3J0IGl0cyB0eXBlIChmb3IgZXhhbXBsZSwgYEZvcmVncm91bmRDYWxsc2ApXG4gKlxuICogLSBgY29uc3QgY2FsbCA9IEFzeW5jQ2FsbDxCYWNrZ3JvdW5kQ2FsbHM+KGZvcmVncm91bmRDYWxscylgXG4gKlxuICogLSBUaGVuIHlvdSBjYW4gYGNhbGxgIGFueSBtZXRob2Qgb24gYEJhY2tncm91bmRDYWxsc2BcbiAqXG4gKiBOb3RlOiBUd28gc2lkZXMgY2FuIGltcGxlbWVudCB0aGUgc2FtZSBmdW5jdGlvblxuICpcbiAqIEBleGFtcGxlXG4gKiBGb3IgZXhhbXBsZSwgaGVyZSBpcyBhIG1vbm8gcmVwby5cbiAqXG4gKiBDb2RlIGZvciBVSSBwYXJ0OlxuICogYGBgdHNcbiAqIGNvbnN0IFVJID0ge1xuICogICAgICBhc3luYyBkaWFsb2codGV4dDogc3RyaW5nKSB7XG4gKiAgICAgICAgICBhbGVydCh0ZXh0KVxuICogICAgICB9LFxuICogfVxuICogZXhwb3J0IHR5cGUgVUkgPSB0eXBlb2YgVUlcbiAqIGNvbnN0IGNhbGxzQ2xpZW50ID0gQXN5bmNDYWxsPFNlcnZlcj4oVUkpXG4gKiBjYWxsc0NsaWVudC5zZW5kTWFpbCgnaGVsbG8gd29ybGQnLCAnd2hhdCcpXG4gKiBgYGBcbiAqXG4gKiBDb2RlIGZvciBzZXJ2ZXIgcGFydFxuICogYGBgdHNcbiAqIGNvbnN0IFNlcnZlciA9IHtcbiAqICAgICAgYXN5bmMgc2VuZE1haWwodGV4dDogc3RyaW5nLCB0bzogc3RyaW5nKSB7XG4gKiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICogICAgICB9XG4gKiB9XG4gKiBleHBvcnQgdHlwZSBTZXJ2ZXIgPSB0eXBlb2YgU2VydmVyXG4gKiBjb25zdCBjYWxscyA9IEFzeW5jQ2FsbDxVST4oU2VydmVyKVxuICogY2FsbHMuZGlhbG9nKCdoZWxsbycpXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gaW1wbGVtZW50YXRpb24gLSBJbXBsZW1lbnRhdGlvbiBvZiB0aGlzIHNpZGUuXG4gKiBAcGFyYW0gb3B0aW9ucyAtIERlZmluZSB5b3VyIG93biBzZXJpYWxpemVyLCBNZXNzYWdlQ2VudGVyIG9yIG90aGVyIG9wdGlvbnMuXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gQXN5bmNDYWxsKGltcGxlbWVudGF0aW9uLCBvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCB7IHdyaXRlVG9Db25zb2xlLCBzZXJpYWxpemVyLCBkb250VGhyb3dPbk5vdEltcGxlbWVudGVkLCBNZXNzYWdlQ2VudGVyLCBrZXksIHN0cmljdEpTT05SUEMgfSA9IHtcbiAgICAgICAgTWVzc2FnZUNlbnRlcjogSG9sb2Zsb3dzTWVzc2FnZUNlbnRlcixcbiAgICAgICAgZG9udFRocm93T25Ob3RJbXBsZW1lbnRlZDogdHJ1ZSxcbiAgICAgICAgc2VyaWFsaXplcjogTm9TZXJpYWxpemF0aW9uLFxuICAgICAgICB3cml0ZVRvQ29uc29sZTogdHJ1ZSxcbiAgICAgICAga2V5OiAnZGVmYXVsdCcsXG4gICAgICAgIHN0cmljdEpTT05SUEM6IGZhbHNlLFxuICAgICAgICAuLi5vcHRpb25zLFxuICAgIH07XG4gICAgY29uc3QgbWVzc2FnZSA9IG5ldyBNZXNzYWdlQ2VudGVyKCk7XG4gICAgY29uc3QgQ0FMTCA9IGAke2tleX0tanNvbnJwY2A7XG4gICAgY29uc3QgbWFwID0gbmV3IE1hcCgpO1xuICAgIGFzeW5jIGZ1bmN0aW9uIG9uUmVxdWVzdChkYXRhKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBleGVjdXRvciA9IGltcGxlbWVudGF0aW9uW2RhdGEubWV0aG9kXTtcbiAgICAgICAgICAgIGlmICghZXhlY3V0b3IpIHtcbiAgICAgICAgICAgICAgICBpZiAoZG9udFRocm93T25Ob3RJbXBsZW1lbnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNlaXZlIHJlbW90ZSBjYWxsLCBidXQgbm90IGltcGxlbWVudGVkLicsIGtleSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gRXJyb3JSZXNwb25zZS5NZXRob2ROb3RGb3VuZChkYXRhLmlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBkYXRhLnBhcmFtcztcbiAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSBleGVjdXRvciguLi5hcmdzKTtcbiAgICAgICAgICAgIGlmICh3cml0ZVRvQ29uc29sZSlcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgJHtrZXl9LiVjJHtkYXRhLm1ldGhvZH0lYygke2FyZ3MubWFwKCgpID0+ICclbycpLmpvaW4oJywgJyl9JWMpXFxuJW8gJWNAJHtkYXRhLmlkfWAsICdjb2xvcjogI2QyYzA1NycsICcnLCAuLi5hcmdzLCAnJywgcHJvbWlzZSwgJ2NvbG9yOiBncmF5OyBmb250LXN0eWxlOiBpdGFsaWM7Jyk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFN1Y2Nlc3NSZXNwb25zZShkYXRhLmlkLCBhd2FpdCBwcm9taXNlLCBzdHJpY3RKU09OUlBDKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRXJyb3JSZXNwb25zZShkYXRhLmlkLCAtMSwgZS5tZXNzYWdlLCBlLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBmdW5jdGlvbiBvblJlc3BvbnNlKGRhdGEpIHtcbiAgICAgICAgaWYgKCdlcnJvcicgaW4gZGF0YSAmJiB3cml0ZVRvQ29uc29sZSlcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCR7ZGF0YS5lcnJvci5tZXNzYWdlfSgke2RhdGEuZXJyb3IuY29kZX0pICVjQCR7ZGF0YS5pZH1cXG4lYyR7ZGF0YS5lcnJvci5kYXRhLnN0YWNrfWAsICdjb2xvcjogZ3JheScsICcnKTtcbiAgICAgICAgaWYgKGRhdGEuaWQgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IFtyZXNvbHZlLCByZWplY3RdID0gbWFwLmdldChkYXRhLmlkKSB8fCBbbnVsbCwgbnVsbF07XG4gICAgICAgIGlmICghcmVzb2x2ZSlcbiAgICAgICAgICAgIHJldHVybjsgLy8gZHJvcCB0aGlzIHJlc3BvbnNlXG4gICAgICAgIG1hcC5kZWxldGUoZGF0YS5pZCk7XG4gICAgICAgIGlmICgnZXJyb3InIGluIGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihkYXRhLmVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgICAgZXJyLnN0YWNrID0gZGF0YS5lcnJvci5kYXRhLnN0YWNrO1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXNvbHZlKGRhdGEucmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBtZXNzYWdlLm9uKENBTEwsIGFzeW5jIChfKSA9PiB7XG4gICAgICAgIGxldCBkYXRhO1xuICAgICAgICBsZXQgcmVzdWx0ID0gdW5kZWZpbmVkO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGF0YSA9IGF3YWl0IHNlcmlhbGl6ZXIuZGVzZXJpYWxpemF0aW9uKF8pO1xuICAgICAgICAgICAgaWYgKGlzSlNPTlJQQ09iamVjdChkYXRhKSkge1xuICAgICAgICAgICAgICAgIGlmICgnbWV0aG9kJyBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGF3YWl0IG9uUmVxdWVzdChkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2VuZChyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICgnZXJyb3InIGluIGRhdGEgfHwgJ3Jlc3VsdCcgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBvblJlc3BvbnNlKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCdyZXN1bHRJc1VuZGVmaW5lZCcgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5yZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBvblJlc3BvbnNlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2VuZChFcnJvclJlc3BvbnNlLkludmFsaWRSZXF1ZXN0KGRhdGEuaWQgfHwgbnVsbCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSAmJiBkYXRhLmV2ZXJ5KGlzSlNPTlJQQ09iamVjdCkpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZW5kKEVycm9yUmVzcG9uc2UuSW50ZXJuYWxFcnJvcihudWxsLCBcIjogQXN5bmMtQ2FsbCBpc24ndCBpbXBsZW1lbnQgcGF0Y2gganNvbnJwYyB5ZXQuXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzdHJpY3RKU09OUlBDKSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNlbmQoRXJyb3JSZXNwb25zZS5JbnZhbGlkUmVxdWVzdChkYXRhLmlkIHx8IG51bGwpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vID8gSWdub3JlIHRoaXMgbWVzc2FnZS4gVGhlIG1lc3NhZ2UgY2hhbm5lbCBtYXliZSBhbHNvIHVzZWQgdG8gdHJhbnNmZXIgb3RoZXIgbWVzc2FnZSB0b28uXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUsIGRhdGEsIHJlc3VsdCk7XG4gICAgICAgICAgICBzZW5kKEVycm9yUmVzcG9uc2UuUGFyc2VFcnJvcihlLnN0YWNrKSk7XG4gICAgICAgIH1cbiAgICAgICAgYXN5bmMgZnVuY3Rpb24gc2VuZChyZXMpIHtcbiAgICAgICAgICAgIGlmICghcmVzKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIG1lc3NhZ2Uuc2VuZChDQUxMLCBhd2FpdCBzZXJpYWxpemVyLnNlcmlhbGl6YXRpb24ocmVzKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFByb3h5KHt9LCB7XG4gICAgICAgIGdldCh0YXJnZXQsIG1ldGhvZCwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiAoLi4ucGFyYW1zKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgIT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KCdPbmx5IHN0cmluZyBjYW4gYmUga2V5cycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlkID0gTWF0aC5yYW5kb20oKVxuICAgICAgICAgICAgICAgICAgICAudG9TdHJpbmcoMzYpXG4gICAgICAgICAgICAgICAgICAgIC5zbGljZSgyKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXEgPSBuZXcgUmVxdWVzdChpZCwgbWV0aG9kLCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgIHNlcmlhbGl6ZXIuc2VyaWFsaXphdGlvbihyZXEpLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2Uuc2VuZChDQUxMLCBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgbWFwLnNldChpZCwgW3Jlc29sdmUsIHJlamVjdF0pO1xuICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cbmNvbnN0IGpzb25ycGMgPSAnMi4wJztcbmNsYXNzIFJlcXVlc3Qge1xuICAgIGNvbnN0cnVjdG9yKGlkLCBtZXRob2QsIHBhcmFtcykge1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMubWV0aG9kID0gbWV0aG9kO1xuICAgICAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcztcbiAgICAgICAgdGhpcy5qc29ucnBjID0gJzIuMCc7XG4gICAgICAgIHJldHVybiB7IGlkLCBtZXRob2QsIHBhcmFtcywganNvbnJwYyB9O1xuICAgIH1cbn1cbmNsYXNzIFN1Y2Nlc3NSZXNwb25zZSB7XG4gICAgY29uc3RydWN0b3IoaWQsIHJlc3VsdCwgc3RyaWN0TW9kZSkge1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMucmVzdWx0ID0gcmVzdWx0O1xuICAgICAgICB0aGlzLmpzb25ycGMgPSAnMi4wJztcbiAgICAgICAgY29uc3Qgb2JqID0geyBpZCwganNvbnJwYywgcmVzdWx0OiByZXN1bHQgfHwgbnVsbCB9O1xuICAgICAgICBpZiAoIXN0cmljdE1vZGUgJiYgcmVzdWx0ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBvYmoucmVzdWx0SXNVbmRlZmluZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH1cbn1cbmNsYXNzIEVycm9yUmVzcG9uc2Uge1xuICAgIGNvbnN0cnVjdG9yKGlkLCBjb2RlLCBtZXNzYWdlLCBzdGFjaykge1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMuanNvbnJwYyA9ICcyLjAnO1xuICAgICAgICBjb25zdCBlcnJvciA9ICh0aGlzLmVycm9yID0geyBjb2RlLCBtZXNzYWdlLCBkYXRhOiB7IHN0YWNrIH0gfSk7XG4gICAgICAgIHJldHVybiB7IGVycm9yLCBpZCwganNvbnJwYyB9O1xuICAgIH1cbn1cbi8vIFByZSBkZWZpbmVkIGVycm9yIGluIHNlY3Rpb24gNS4xXG5FcnJvclJlc3BvbnNlLlBhcnNlRXJyb3IgPSAoc3RhY2sgPSAnJykgPT4gbmV3IEVycm9yUmVzcG9uc2UobnVsbCwgLTMyNzAwLCAnUGFyc2UgZXJyb3InLCBzdGFjayk7XG5FcnJvclJlc3BvbnNlLkludmFsaWRSZXF1ZXN0ID0gKGlkKSA9PiBuZXcgRXJyb3JSZXNwb25zZShpZCwgLTMyNjAwLCAnSW52YWxpZCBSZXF1ZXN0JywgJycpO1xuRXJyb3JSZXNwb25zZS5NZXRob2ROb3RGb3VuZCA9IChpZCkgPT4gbmV3IEVycm9yUmVzcG9uc2UoaWQsIC0zMjYwMSwgJ01ldGhvZCBub3QgZm91bmQnLCAnJyk7XG5FcnJvclJlc3BvbnNlLkludmFsaWRQYXJhbXMgPSAoaWQpID0+IG5ldyBFcnJvclJlc3BvbnNlKGlkLCAtMzI2MDIsICdJbnZhbGlkIHBhcmFtcycsICcnKTtcbkVycm9yUmVzcG9uc2UuSW50ZXJuYWxFcnJvciA9IChpZCwgbWVzc2FnZSA9ICcnKSA9PiBuZXcgRXJyb3JSZXNwb25zZShpZCwgLTMyNjAzLCAnSW50ZXJuYWwgZXJyb3InICsgbWVzc2FnZSwgJycpO1xuZnVuY3Rpb24gaXNKU09OUlBDT2JqZWN0KGRhdGEpIHtcbiAgICByZXR1cm4gdHlwZW9mIGRhdGEgPT09ICdvYmplY3QnICYmIGRhdGEgIT09IG51bGwgJiYgJ2pzb25ycGMnIGluIGRhdGEgJiYgZGF0YS5qc29ucnBjID09PSAnMi4wJztcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUFzeW5jLUNhbGwuanMubWFwIiwiaW1wb3J0IHsgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiB9IGZyb20gJy4uL1JQQydcbnR5cGUgV2ViRXh0ZW5zaW9uSUQgPSBzdHJpbmdcbnR5cGUgTWVzc2FnZUlEID0gc3RyaW5nXG50eXBlIHdlYk5hdmlnYXRpb25PbkNvbW1pdHRlZEFyZ3MgPSBQYXJhbWV0ZXJzPFRoaXNTaWRlSW1wbGVtZW50YXRpb25bJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCddPlxudHlwZSBvbk1lc3NhZ2VBcmdzID0gUGFyYW1ldGVyczxUaGlzU2lkZUltcGxlbWVudGF0aW9uWydvbk1lc3NhZ2UnXT5cbnR5cGUgUG9vbEtleXMgPSAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJyB8ICdicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJ1xuLyoqXG4gKiBVc2VkIGZvciBrZWVwIHJlZmVyZW5jZSB0byBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlXG4gKi9cbmV4cG9ydCBjb25zdCBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyID0gbmV3IE1hcDxNZXNzYWdlSUQsIFsodmFsOiBhbnkpID0+IGFueSwgKHZhbDogYW55KSA9PiBhbnldPigpXG4vKipcbiAqIFRvIHN0b3JlIGxpc3RlbmVyIGZvciBIb3N0IGRpc3BhdGNoZWQgZXZlbnRzLlxuICovXG5leHBvcnQgY29uc3QgRXZlbnRQb29sczogUmVjb3JkPFBvb2xLZXlzLCBNYXA8V2ViRXh0ZW5zaW9uSUQsIFNldDwoLi4uYXJnczogYW55W10pID0+IGFueT4+PiA9IHtcbiAgICAnYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkJzogbmV3IE1hcCgpLFxuICAgICdicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlJzogbmV3IE1hcCgpLFxufVxuLyoqXG4gKiBEaXNwYXRjaCBhIG5vcm1hbCBldmVudCAodGhhdCBub3QgaGF2ZSBhIFwicmVzcG9uc2VcIikuXG4gKiBMaWtlIGJyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGlzcGF0Y2hOb3JtYWxFdmVudChldmVudDogUG9vbEtleXMsIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyB8IHN0cmluZ1tdIHwgJyonLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgIGlmICghRXZlbnRQb29sc1tldmVudF0pIHJldHVyblxuICAgIGZvciAoY29uc3QgW2V4dGVuc2lvbklELCBmbnNdIG9mIEV2ZW50UG9vbHNbZXZlbnRdLmVudHJpZXMoKSkge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0b0V4dGVuc2lvbklEKSAmJiB0b0V4dGVuc2lvbklELmluZGV4T2YoZXh0ZW5zaW9uSUQpID09PSAtMSkgY29udGludWVcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRvRXh0ZW5zaW9uSUQpICYmIHRvRXh0ZW5zaW9uSUQgIT09IGV4dGVuc2lvbklEICYmIHRvRXh0ZW5zaW9uSUQgIT09ICcqJykgY29udGludWVcbiAgICAgICAgZm9yIChjb25zdCBmIG9mIGZucykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmKC4uLmFyZ3MpXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuLyoqXG4gKiBDcmVhdGUgYSBgRXZlbnRPYmplY3Q8TGlzdGVuZXJUeXBlPmAgb2JqZWN0LlxuICpcbiAqIENhbiBiZSBzZXQgb24gYnJvd3Nlci53ZWJOYXZpZ2F0aW9uLm9uQ29tbWl0dGVkIGV0Yy4uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXZlbnRMaXN0ZW5lcihleHRlbnNpb25JRDogc3RyaW5nLCBldmVudDogUG9vbEtleXMpIHtcbiAgICBpZiAoIUV2ZW50UG9vbHNbZXZlbnRdLmhhcyhleHRlbnNpb25JRCkpIHtcbiAgICAgICAgRXZlbnRQb29sc1tldmVudF0uc2V0KGV4dGVuc2lvbklELCBuZXcgU2V0KCkpXG4gICAgfVxuICAgIGNvbnN0IHBvb2wgPSBFdmVudFBvb2xzW2V2ZW50XS5nZXQoZXh0ZW5zaW9uSUQpIVxuICAgIGNvbnN0IGhhbmRsZXI6IEV2ZW50T2JqZWN0PCguLi5hcmdzOiBhbnlbXSkgPT4gYW55PiA9IHtcbiAgICAgICAgYWRkTGlzdGVuZXIoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgZnVuY3Rpb24nKVxuICAgICAgICAgICAgcG9vbC5hZGQoY2FsbGJhY2spXG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZUxpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBwb29sLmRlbGV0ZShjYWxsYmFjaylcbiAgICAgICAgfSxcbiAgICAgICAgaGFzTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBwb29sLmhhcyhsaXN0ZW5lcilcbiAgICAgICAgfSxcbiAgICB9XG4gICAgcmV0dXJuIGhhbmRsZXJcbn1cblxuaW50ZXJmYWNlIEV2ZW50T2JqZWN0PFQgZXh0ZW5kcyAoLi4uYXJnczogYW55W10pID0+IGFueT4ge1xuICAgIGFkZExpc3RlbmVyOiAoY2FsbGJhY2s6IFQpID0+IHZvaWRcbiAgICByZW1vdmVMaXN0ZW5lcjogKGxpc3RlbmVyOiBUKSA9PiB2b2lkXG4gICAgaGFzTGlzdGVuZXI6IChsaXN0ZW5lcjogVCkgPT4gYm9vbGVhblxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGRlZXBDbG9uZTxUPihvYmo6IFQpOiBUIHtcbiAgICAvLyB0b2RvOiBjaGFuZ2UgYW5vdGhlciBpbXBsIHBsei5cbiAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmopKVxufVxuIiwiaW1wb3J0IHsgSG9zdCB9IGZyb20gJy4uL1JQQydcblxuaW1wb3J0IHsgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlciwgRXZlbnRQb29scyB9IGZyb20gJy4uL3V0aWxzL0xvY2FsTWVzc2FnZXMnXG5pbXBvcnQgeyBkZWVwQ2xvbmUgfSBmcm9tICcuLi91dGlscy9kZWVwQ2xvbmUnXG4vKipcbiAqIENyZWF0ZSBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoKSBmdW5jdGlvblxuICogQHBhcmFtIGV4dGVuc2lvbklEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZW5kTWVzc2FnZShleHRlbnNpb25JRDogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgdG9FeHRlbnNpb25JRDogc3RyaW5nLCBtZXNzYWdlOiB1bmtub3duLCBvcHRpb25zOiB1bmtub3duXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB0b0V4dGVuc2lvbklEID0gZXh0ZW5zaW9uSURcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBhcmd1bWVudHNbMF1cbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICB0b0V4dGVuc2lvbklEID0gYXJndW1lbnRzWzBdXG4gICAgICAgICAgICBtZXNzYWdlID0gYXJndW1lbnRzWzFdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b0V4dGVuc2lvbklEID0gJydcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZUlEID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygpXG4gICAgICAgICAgICBIb3N0LnNlbmRNZXNzYWdlKGV4dGVuc2lvbklELCB0b0V4dGVuc2lvbklELCBudWxsLCBtZXNzYWdlSUQsIHtcbiAgICAgICAgICAgICAgICBkYXRhOiBtZXNzYWdlLFxuICAgICAgICAgICAgICAgIHJlc3BvbnNlOiBmYWxzZSxcbiAgICAgICAgICAgIH0pLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChlKVxuICAgICAgICAgICAgICAgIFR3b1dheU1lc3NhZ2VQcm9taXNlUmVzb2x2ZXIuZGVsZXRlKG1lc3NhZ2VJRClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLnNldChtZXNzYWdlSUQsIFtyZXNvbHZlLCByZWplY3RdKVxuICAgICAgICB9KVxuICAgIH1cbn1cbi8qKlxuICogTWVzc2FnZSBoYW5kbGVyIG9mIG5vcm1hbCBtZXNzYWdlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvbk5vcm1hbE1lc3NhZ2UoXG4gICAgbWVzc2FnZTogYW55LFxuICAgIHNlbmRlcjogYnJvd3Nlci5ydW50aW1lLk1lc3NhZ2VTZW5kZXIsXG4gICAgdG9FeHRlbnNpb25JRDogc3RyaW5nLFxuICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgbWVzc2FnZUlEOiBzdHJpbmcsXG4pIHtcbiAgICBjb25zdCBmbnM6IFNldDxicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlRXZlbnQ+IHwgdW5kZWZpbmVkID0gRXZlbnRQb29sc1snYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZSddLmdldChcbiAgICAgICAgdG9FeHRlbnNpb25JRCxcbiAgICApXG4gICAgaWYgKCFmbnMpIHJldHVyblxuICAgIGxldCByZXNwb25zZVNlbmQgPSBmYWxzZVxuICAgIGZvciAoY29uc3QgZm4gb2YgZm5zKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyA/IGRpc3BhdGNoIG1lc3NhZ2VcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGZuKGRlZXBDbG9uZShtZXNzYWdlKSwgZGVlcENsb25lKHNlbmRlciksIHNlbmRSZXNwb25zZURlcHJlY2F0ZWQpXG4gICAgICAgICAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAvLyA/IGRvIG5vdGhpbmdcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgICAgLy8gISBkZXByZWNhdGVkIHBhdGggIVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcmVzdWx0ID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcmVzdWx0LnRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAvLyA/IHJlc3BvbnNlIHRoZSBhbnN3ZXJcbiAgICAgICAgICAgICAgICByZXN1bHQudGhlbigoZGF0YTogdW5rbm93bikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PT0gdW5kZWZpbmVkIHx8IHJlc3BvbnNlU2VuZCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlU2VuZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgSG9zdC5zZW5kTWVzc2FnZSh0b0V4dGVuc2lvbklELCBleHRlbnNpb25JRCwgc2VuZGVyLnRhYiEuaWQhLCBtZXNzYWdlSUQsIHsgZGF0YSwgcmVzcG9uc2U6IHRydWUgfSlcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsTWVzc2FnZSB7XG4gICAgZGF0YTogYW55XG4gICAgZXJyb3I/OiB7IG1lc3NhZ2U6IHN0cmluZzsgc3RhY2s6IHN0cmluZyB9XG4gICAgcmVzcG9uc2U6IGJvb2xlYW5cbn1cblxuZnVuY3Rpb24gc2VuZFJlc3BvbnNlRGVwcmVjYXRlZCgpOiBhbnkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ1JldHVybmluZyBhIFByb21pc2UgaXMgdGhlIHByZWZlcnJlZCB3YXknICtcbiAgICAgICAgICAgICcgdG8gc2VuZCBhIHJlcGx5IGZyb20gYW4gb25NZXNzYWdlL29uTWVzc2FnZUV4dGVybmFsIGxpc3RlbmVyLCAnICtcbiAgICAgICAgICAgICdhcyB0aGUgc2VuZFJlc3BvbnNlIHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBzcGVjcyAnICtcbiAgICAgICAgICAgICcoU2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RvY3MvTW96aWxsYS9BZGQtb25zL1dlYkV4dGVuc2lvbnMvQVBJL3J1bnRpbWUvb25NZXNzYWdlKScsXG4gICAgKVxufVxuIiwiaW1wb3J0IHsgU3RyaW5nT3JCbG9iIH0gZnJvbSAnLi4vUlBDJ1xuXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlU3RyaW5nT3JCbG9iKHZhbDogU3RyaW5nT3JCbG9iKTogQmxvYiB8IHN0cmluZyB8IEFycmF5QnVmZmVyIHwgbnVsbCB7XG4gICAgaWYgKHZhbC50eXBlID09PSAndGV4dCcpIHJldHVybiB2YWwuY29udGVudFxuICAgIGlmICh2YWwudHlwZSA9PT0gJ2Jsb2InKSByZXR1cm4gbmV3IEJsb2IoW3ZhbC5jb250ZW50XSwgeyB0eXBlOiB2YWwubWltZVR5cGUgfSlcbiAgICBpZiAodmFsLnR5cGUgPT09ICdhcnJheSBidWZmZXInKSB7XG4gICAgICAgIHJldHVybiBiYXNlNjREZWNUb0Fycih2YWwuY29udGVudCkuYnVmZmVyXG4gICAgfVxuICAgIHJldHVybiBudWxsXG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5jb2RlU3RyaW5nT3JCbG9iKHZhbDogQmxvYiB8IHN0cmluZyB8IEFycmF5QnVmZmVyKTogUHJvbWlzZTxTdHJpbmdPckJsb2I+IHtcbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHJldHVybiB7IHR5cGU6ICd0ZXh0JywgY29udGVudDogdmFsIH1cbiAgICBpZiAodmFsIGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgICBjb25zdCBidWZmZXIgPSBuZXcgVWludDhBcnJheShhd2FpdCBuZXcgUmVzcG9uc2UodmFsKS5hcnJheUJ1ZmZlcigpKVxuICAgICAgICByZXR1cm4geyB0eXBlOiAnYmxvYicsIG1pbWVUeXBlOiB2YWwudHlwZSwgY29udGVudDogYmFzZTY0RW5jQXJyKGJ1ZmZlcikgfVxuICAgIH1cbiAgICBpZiAodmFsIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogJ2FycmF5IGJ1ZmZlcicsIGNvbnRlbnQ6IGJhc2U2NEVuY0FycihuZXcgVWludDhBcnJheSh2YWwpKSB9XG4gICAgfVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgZGF0YScpXG59XG5cbi8vI3JlZ2lvbiAvLyA/IENvZGUgZnJvbSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93QmFzZTY0L0Jhc2U2NF9lbmNvZGluZ19hbmRfZGVjb2RpbmcjQXBwZW5kaXguM0FfRGVjb2RlX2FfQmFzZTY0X3N0cmluZ190b19VaW50OEFycmF5X29yX0FycmF5QnVmZmVyXG5mdW5jdGlvbiBiNjRUb1VpbnQ2KG5DaHI6IG51bWJlcikge1xuICAgIHJldHVybiBuQ2hyID4gNjQgJiYgbkNociA8IDkxXG4gICAgICAgID8gbkNociAtIDY1XG4gICAgICAgIDogbkNociA+IDk2ICYmIG5DaHIgPCAxMjNcbiAgICAgICAgPyBuQ2hyIC0gNzFcbiAgICAgICAgOiBuQ2hyID4gNDcgJiYgbkNociA8IDU4XG4gICAgICAgID8gbkNociArIDRcbiAgICAgICAgOiBuQ2hyID09PSA0M1xuICAgICAgICA/IDYyXG4gICAgICAgIDogbkNociA9PT0gNDdcbiAgICAgICAgPyA2M1xuICAgICAgICA6IDBcbn1cblxuZnVuY3Rpb24gYmFzZTY0RGVjVG9BcnIoc0Jhc2U2NDogc3RyaW5nLCBuQmxvY2tTaXplPzogbnVtYmVyKSB7XG4gICAgdmFyIHNCNjRFbmMgPSBzQmFzZTY0LnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXS9nLCAnJyksXG4gICAgICAgIG5JbkxlbiA9IHNCNjRFbmMubGVuZ3RoLFxuICAgICAgICBuT3V0TGVuID0gbkJsb2NrU2l6ZSA/IE1hdGguY2VpbCgoKG5JbkxlbiAqIDMgKyAxKSA+Pj4gMikgLyBuQmxvY2tTaXplKSAqIG5CbG9ja1NpemUgOiAobkluTGVuICogMyArIDEpID4+PiAyLFxuICAgICAgICBhQnl0ZXMgPSBuZXcgVWludDhBcnJheShuT3V0TGVuKVxuXG4gICAgZm9yICh2YXIgbk1vZDMsIG5Nb2Q0LCBuVWludDI0ID0gMCwgbk91dElkeCA9IDAsIG5JbklkeCA9IDA7IG5JbklkeCA8IG5JbkxlbjsgbkluSWR4KyspIHtcbiAgICAgICAgbk1vZDQgPSBuSW5JZHggJiAzXG4gICAgICAgIG5VaW50MjQgfD0gYjY0VG9VaW50NihzQjY0RW5jLmNoYXJDb2RlQXQobkluSWR4KSkgPDwgKDE4IC0gNiAqIG5Nb2Q0KVxuICAgICAgICBpZiAobk1vZDQgPT09IDMgfHwgbkluTGVuIC0gbkluSWR4ID09PSAxKSB7XG4gICAgICAgICAgICBmb3IgKG5Nb2QzID0gMDsgbk1vZDMgPCAzICYmIG5PdXRJZHggPCBuT3V0TGVuOyBuTW9kMysrLCBuT3V0SWR4KyspIHtcbiAgICAgICAgICAgICAgICBhQnl0ZXNbbk91dElkeF0gPSAoblVpbnQyNCA+Pj4gKCgxNiA+Pj4gbk1vZDMpICYgMjQpKSAmIDI1NVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgblVpbnQyNCA9IDBcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhQnl0ZXNcbn1cbmZ1bmN0aW9uIHVpbnQ2VG9CNjQoblVpbnQ2OiBudW1iZXIpIHtcbiAgICByZXR1cm4gblVpbnQ2IDwgMjZcbiAgICAgICAgPyBuVWludDYgKyA2NVxuICAgICAgICA6IG5VaW50NiA8IDUyXG4gICAgICAgID8gblVpbnQ2ICsgNzFcbiAgICAgICAgOiBuVWludDYgPCA2MlxuICAgICAgICA/IG5VaW50NiAtIDRcbiAgICAgICAgOiBuVWludDYgPT09IDYyXG4gICAgICAgID8gNDNcbiAgICAgICAgOiBuVWludDYgPT09IDYzXG4gICAgICAgID8gNDdcbiAgICAgICAgOiA2NVxufVxuXG5mdW5jdGlvbiBiYXNlNjRFbmNBcnIoYUJ5dGVzOiBVaW50OEFycmF5KSB7XG4gICAgdmFyIGVxTGVuID0gKDMgLSAoYUJ5dGVzLmxlbmd0aCAlIDMpKSAlIDMsXG4gICAgICAgIHNCNjRFbmMgPSAnJ1xuXG4gICAgZm9yICh2YXIgbk1vZDMsIG5MZW4gPSBhQnl0ZXMubGVuZ3RoLCBuVWludDI0ID0gMCwgbklkeCA9IDA7IG5JZHggPCBuTGVuOyBuSWR4KyspIHtcbiAgICAgICAgbk1vZDMgPSBuSWR4ICUgM1xuICAgICAgICAvKiBVbmNvbW1lbnQgdGhlIGZvbGxvd2luZyBsaW5lIGluIG9yZGVyIHRvIHNwbGl0IHRoZSBvdXRwdXQgaW4gbGluZXMgNzYtY2hhcmFjdGVyIGxvbmc6ICovXG4gICAgICAgIC8qXG4gICAgICBpZiAobklkeCA+IDAgJiYgKG5JZHggKiA0IC8gMykgJSA3NiA9PT0gMCkgeyBzQjY0RW5jICs9IFwiXFxyXFxuXCI7IH1cbiAgICAgICovXG4gICAgICAgIG5VaW50MjQgfD0gYUJ5dGVzW25JZHhdIDw8ICgoMTYgPj4+IG5Nb2QzKSAmIDI0KVxuICAgICAgICBpZiAobk1vZDMgPT09IDIgfHwgYUJ5dGVzLmxlbmd0aCAtIG5JZHggPT09IDEpIHtcbiAgICAgICAgICAgIHNCNjRFbmMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShcbiAgICAgICAgICAgICAgICB1aW50NlRvQjY0KChuVWludDI0ID4+PiAxOCkgJiA2MyksXG4gICAgICAgICAgICAgICAgdWludDZUb0I2NCgoblVpbnQyNCA+Pj4gMTIpICYgNjMpLFxuICAgICAgICAgICAgICAgIHVpbnQ2VG9CNjQoKG5VaW50MjQgPj4+IDYpICYgNjMpLFxuICAgICAgICAgICAgICAgIHVpbnQ2VG9CNjQoblVpbnQyNCAmIDYzKSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIG5VaW50MjQgPSAwXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZXFMZW4gPT09IDAgPyBzQjY0RW5jIDogc0I2NEVuYy5zdWJzdHJpbmcoMCwgc0I2NEVuYy5sZW5ndGggLSBlcUxlbikgKyAoZXFMZW4gPT09IDEgPyAnPScgOiAnPT0nKVxufVxuIiwiaW1wb3J0IHsgSG9zdCwgU3RyaW5nT3JCbG9iIH0gZnJvbSAnLi4vUlBDJ1xuaW1wb3J0IHsgZW5jb2RlU3RyaW5nT3JCbG9iLCBkZWNvZGVTdHJpbmdPckJsb2IgfSBmcm9tICcuLi91dGlscy9TdHJpbmdPckJsb2InXG5cbmNvbnN0IHsgQ0xPU0VELCBDTE9TSU5HLCBDT05ORUNUSU5HLCBPUEVOIH0gPSBXZWJTb2NrZXRcbmNvbnN0IFdlYlNvY2tldElEOiBNYXA8V2ViU29ja2V0LCBudW1iZXI+ID0gbmV3IE1hcCgpXG5mdW5jdGlvbiBnZXRJRChpbnN0YW5jZTogV2ViU29ja2V0KSB7XG4gICAgcmV0dXJuIFdlYlNvY2tldElELmdldChpbnN0YW5jZSkhXG59XG5mdW5jdGlvbiBnZXRJbnN0YW5jZShpZDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oV2ViU29ja2V0SUQpLmZpbmQoKFt4LCB5XSkgPT4geSA9PT0gaWQpIVswXVxufVxuY29uc3QgV2ViU29ja2V0UmVhZHlTdGF0ZTogTWFwPFdlYlNvY2tldCwgbnVtYmVyPiA9IG5ldyBNYXAoKVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVdlYlNvY2tldChleHRlbnNpb25JRDogc3RyaW5nKTogdHlwZW9mIFdlYlNvY2tldCB7XG4gICAgLyoqXG4gICAgICogU2VlOiBodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS93ZWItc29ja2V0cy5odG1sXG4gICAgICovXG4gICAgY2xhc3MgV1MgZXh0ZW5kcyBFdmVudFRhcmdldCBpbXBsZW1lbnRzIFdlYlNvY2tldCB7XG4gICAgICAgIC8vI3JlZ2lvbiBDb25zdGFudHNcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IENMT1NFRCA9IENMT1NFRFxuICAgICAgICBzdGF0aWMgcmVhZG9ubHkgQ09OTkVDVElORyA9IENPTk5FQ1RJTkdcbiAgICAgICAgc3RhdGljIHJlYWRvbmx5IE9QRU4gPSBPUEVOXG4gICAgICAgIHN0YXRpYyByZWFkb25seSBDTE9TSU5HID0gQ0xPU0lOR1xuICAgICAgICBDTE9TRUQgPSBDTE9TRURcbiAgICAgICAgQ09OTkVDVElORyA9IENPTk5FQ1RJTkdcbiAgICAgICAgT1BFTiA9IE9QRU5cbiAgICAgICAgQ0xPU0lORyA9IENMT1NJTkdcbiAgICAgICAgLy8jZW5kcmVnaW9uXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSB1cmw6IHN0cmluZywgcHJvdG9jb2xzOiBzdHJpbmcgfCBzdHJpbmdbXSA9IFtdKSB7XG4gICAgICAgICAgICBzdXBlcigpXG4gICAgICAgICAgICBIb3N0Wyd3ZWJzb2NrZXQuY3JlYXRlJ10oZXh0ZW5zaW9uSUQsIHVybCkudGhlbihvbk9wZW4uYmluZCh0aGlzKSwgb25XZWJTb2NrZXRFcnJvci5iaW5kKG51bGwsIDAsICcnKSlcbiAgICAgICAgfVxuICAgICAgICBnZXQgYmluYXJ5VHlwZSgpOiBCaW5hcnlUeXBlIHtcbiAgICAgICAgICAgIHJldHVybiAnYmxvYidcbiAgICAgICAgfVxuICAgICAgICBzZXQgYmluYXJ5VHlwZSh2YWwpIHtcbiAgICAgICAgICAgIC8vIFRvZG9cbiAgICAgICAgfVxuICAgICAgICByZWFkb25seSBidWZmZXJlZEFtb3VudCA9IDBcbiAgICAgICAgZXh0ZW5zaW9ucyA9ICcnXG4gICAgICAgIG9uY2xvc2U6IGFueVxuICAgICAgICBvbmVycm9yOiBhbnlcbiAgICAgICAgb25vcGVuOiBhbnlcbiAgICAgICAgb25tZXNzYWdlOiBhbnlcbiAgICAgICAgZ2V0IHJlYWR5U3RhdGUoKTogbnVtYmVyIHtcbiAgICAgICAgICAgIHJldHVybiBXZWJTb2NrZXRSZWFkeVN0YXRlLmdldCh0aGlzKSFcbiAgICAgICAgfVxuICAgICAgICBwcm90b2NvbDogYW55XG4gICAgICAgIGNsb3NlKGNvZGUgPSAxMDA1LCByZWFzb24gPSAnJykge1xuICAgICAgICAgICAgSG9zdFsnd2Vic29ja2V0LmNsb3NlJ10oZXh0ZW5zaW9uSUQsIFdlYlNvY2tldElELmdldCh0aGlzKSEsIGNvZGUsIHJlYXNvbikudGhlbihcbiAgICAgICAgICAgICAgICBvbldlYlNvY2tldENsb3NlLmJpbmQodGhpcywgZ2V0SUQodGhpcyksIGNvZGUsIHJlYXNvbiwgdHJ1ZSksXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBXZWJTb2NrZXRSZWFkeVN0YXRlLnNldCh0aGlzLCBDTE9TSU5HKVxuICAgICAgICB9XG4gICAgICAgIHNlbmQobWVzc2FnZTogc3RyaW5nIHwgQmxvYiB8IEFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICBlbmNvZGVTdHJpbmdPckJsb2IobWVzc2FnZSkudGhlbihkYXRhID0+IHtcbiAgICAgICAgICAgICAgICBIb3N0Wyd3ZWJzb2NrZXQuc2VuZCddKGV4dGVuc2lvbklELCBXZWJTb2NrZXRJRC5nZXQodGhpcykhLCBkYXRhKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBjb25zdGFudHM6IFByb3BlcnR5RGVzY3JpcHRvck1hcCA9IHtcbiAgICAgICAgQ0xPU0VEOiB7IGNvbmZpZ3VyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZSwgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IENMT1NFRCB9LFxuICAgICAgICBDTE9TSU5HOiB7IGNvbmZpZ3VyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZSwgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IENMT1NJTkcgfSxcbiAgICAgICAgQ09OTkVDVElORzogeyBjb25maWd1cmFibGU6IGZhbHNlLCB3cml0YWJsZTogZmFsc2UsIGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiBDT05ORUNUSU5HIH0sXG4gICAgICAgIE9QRU46IHsgY29uZmlndXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IGZhbHNlLCBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogT1BFTiB9LFxuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhXUywgY29uc3RhbnRzKVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKFdTLnByb3RvdHlwZSwgY29uc3RhbnRzKVxuICAgIHJldHVybiBXU1xufVxuZXhwb3J0IGZ1bmN0aW9uIG9uV2ViU29ja2V0Q2xvc2Uod2Vic29ja2V0SUQ6IG51bWJlciwgY29kZTogbnVtYmVyLCByZWFzb246IHN0cmluZywgd2FzQ2xlYW46IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBjb25zdCB3cyA9IGdldEluc3RhbmNlKHdlYnNvY2tldElEKVxuICAgIGNvbnN0IGUgPSBuZXcgQ2xvc2VFdmVudCgnY2xvc2UnLCB7IHJlYXNvbiwgd2FzQ2xlYW4sIGNvZGUgfSlcbiAgICBXZWJTb2NrZXRSZWFkeVN0YXRlLnNldCh3cywgQ0xPU0VEKVxuICAgIFdlYlNvY2tldElELmRlbGV0ZSh3cylcbiAgICBpZiAodHlwZW9mIHdzLm9uY2xvc2UgPT09ICdmdW5jdGlvbicpIHdzLm9uY2xvc2UoZSlcbiAgICB3cy5kaXNwYXRjaEV2ZW50KGUpXG59XG5mdW5jdGlvbiBvbk9wZW4odGhpczogV2ViU29ja2V0LCB3ZWJzb2NrZXRJRDogbnVtYmVyKSB7XG4gICAgY29uc3QgZSA9IG5ldyBFdmVudCgnb3BlbicpXG4gICAgV2ViU29ja2V0UmVhZHlTdGF0ZS5zZXQodGhpcywgT1BFTilcbiAgICBXZWJTb2NrZXRJRC5zZXQodGhpcywgd2Vic29ja2V0SUQpXG4gICAgaWYgKHR5cGVvZiB0aGlzLm9ub3BlbiA9PT0gJ2Z1bmN0aW9uJykgdGhpcy5vbm9wZW4oZSlcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoZSlcbn1cbmV4cG9ydCBmdW5jdGlvbiBvbldlYlNvY2tldEVycm9yKHdlYnNvY2tldElEOiBudW1iZXIsIHJlYXNvbjogc3RyaW5nKSB7XG4gICAgY29uc3Qgd3MgPSBnZXRJbnN0YW5jZSh3ZWJzb2NrZXRJRClcbiAgICBjb25zdCBlID0gbmV3IEV2ZW50KCdlcnJvcicpXG4gICAgV2ViU29ja2V0UmVhZHlTdGF0ZS5zZXQod3MsIENMT1NFRClcbiAgICBpZiAodHlwZW9mIHdzLm9uZXJyb3IgPT09ICdmdW5jdGlvbicpIHdzLm9uZXJyb3IoZSlcbiAgICB3cy5kaXNwYXRjaEV2ZW50KGUpXG59XG5leHBvcnQgZnVuY3Rpb24gb25XZWJTb2NrZXRNZXNzYWdlKHdlYlNvY2tldElEOiBudW1iZXIsIG1lc3NhZ2U6IFN0cmluZ09yQmxvYikge1xuICAgIGNvbnN0IHdzID0gZ2V0SW5zdGFuY2Uod2ViU29ja2V0SUQpXG4gICAgY29uc3QgZSA9IG5ldyBNZXNzYWdlRXZlbnQoJ21lc3NhZ2UnLCB7IGRhdGE6IGRlY29kZVN0cmluZ09yQmxvYihtZXNzYWdlKSB9KVxuICAgIGlmICh0eXBlb2Ygd3Mub25tZXNzYWdlID09PSAnZnVuY3Rpb24nKSB3cy5vbm1lc3NhZ2UoZSlcbiAgICB3cy5kaXNwYXRjaEV2ZW50KGUpXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vbm9kZV9tb2R1bGVzL3dlYi1leHQtdHlwZXMvZ2xvYmFsL2luZGV4LmQudHNcIiAvPlxuaW1wb3J0IHsgQXN5bmNDYWxsIH0gZnJvbSAnQGhvbG9mbG93cy9raXQvZXMnXG5pbXBvcnQgeyBkaXNwYXRjaE5vcm1hbEV2ZW50LCBUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyIH0gZnJvbSAnLi91dGlscy9Mb2NhbE1lc3NhZ2VzJ1xuaW1wb3J0IHsgSW50ZXJuYWxNZXNzYWdlLCBvbk5vcm1hbE1lc3NhZ2UgfSBmcm9tICcuL3NoaW1zL2Jyb3dzZXIubWVzc2FnZSdcbmltcG9ydCB7IG9uV2ViU29ja2V0Q2xvc2UsIG9uV2ViU29ja2V0RXJyb3IsIG9uV2ViU29ja2V0TWVzc2FnZSB9IGZyb20gJy4vc2hpbXMvV2ViU29ja2V0J1xuXG4vKiogRGVmaW5lIEJsb2IgdHlwZSBpbiBjb21tdW5pY2F0ZSB3aXRoIHJlbW90ZSAqL1xuZXhwb3J0IHR5cGUgU3RyaW5nT3JCbG9iID1cbiAgICB8IHtcbiAgICAgICAgICB0eXBlOiAndGV4dCdcbiAgICAgICAgICBjb250ZW50OiBzdHJpbmdcbiAgICAgIH1cbiAgICB8IHtcbiAgICAgICAgICB0eXBlOiAnYXJyYXkgYnVmZmVyJ1xuICAgICAgICAgIGNvbnRlbnQ6IHN0cmluZ1xuICAgICAgfVxuICAgIHwge1xuICAgICAgICAgIHR5cGU6ICdibG9iJ1xuICAgICAgICAgIGNvbnRlbnQ6IHN0cmluZ1xuICAgICAgICAgIG1pbWVUeXBlOiBzdHJpbmdcbiAgICAgIH1cbi8qKlxuICogVGhpcyBkZXNjcmliZXMgd2hhdCBKU09OUlBDIGNhbGxzIHRoYXQgTmF0aXZlIHNpZGUgc2hvdWxkIGltcGxlbWVudFxuICovXG5leHBvcnQgaW50ZXJmYWNlIEhvc3Qge1xuICAgIC8vI3JlZ2lvbiAvLyA/IFVSTC4qXG4gICAgLyoqXG4gICAgICogSG9zdCBzaG91bGQgc2F2ZSB0aGUgYmluZGluZyB3aXRoIGB1dWlkYCBhbmQgdGhlIGBkYXRhYFxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBVVUlEIC0gVVVJRCBnZW5lcmF0ZWQgYnkgSlMgc2lkZS5cbiAgICAgKiBAcGFyYW0gZGF0YSAtIGRhdGEgb2YgdGhpcyBvYmplY3QuIE11c3QgYmUgdHlwZSBgYmxvYmBcbiAgICAgKi9cbiAgICAnVVJMLmNyZWF0ZU9iamVjdFVSTCcoZXh0ZW5zaW9uSUQ6IHN0cmluZywgVVVJRDogc3RyaW5nLCBkYXRhOiBTdHJpbmdPckJsb2IpOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogSG9zdCBzaG91bGQgcmVsZWFzZSB0aGUgYmluZGluZyB3aXRoIGB1dWlkYCBhbmQgdGhlIGBkYXRhYFxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBVVUlEIC0gVVVJRCBnZW5lcmF0ZWQgYnkgSlMgc2lkZS5cbiAgICAgKi9cbiAgICAnVVJMLnJldm9rZU9iamVjdFVSTCcoZXh0ZW5zaW9uSUQ6IHN0cmluZywgVVVJRDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPlxuICAgIC8vI2VuZHJlZ2lvblxuICAgIC8vI3JlZ2lvbiAvLyA/IGJyb3dzZXIuZG93bmxvYWRzXG4gICAgLyoqXG4gICAgICogT3BlbiBhIGRpYWxvZywgc2hhcmUgdGhlIGZpbGUgdG8gc29tZXdoZXJlIGVsc2UuXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIG9wdGlvbnMgLSBTZWUgaHR0cHM6Ly9tZG4uaW8vYnJvd3Nlci5kb3dubG9hZHMuZG93bmxvYWRcbiAgICAgKi9cbiAgICAnYnJvd3Nlci5kb3dubG9hZHMuZG93bmxvYWQnKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBmaWxlbmFtZTogc3RyaW5nXG4gICAgICAgICAgICAvKiogQ291bGQgYmUgYSBzdHJpbmcgcmV0dXJuIGJ5IFVSTC5jcmVhdGVPYmplY3RVUkwoKSAqL1xuICAgICAgICAgICAgdXJsOiBzdHJpbmdcbiAgICAgICAgfSxcbiAgICApOiBQcm9taXNlPHZvaWQ+XG4gICAgLy8jZW5kcmVnaW9uXG4gICAgLy8jcmVnaW9uIC8vID8gYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldFxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgaW50ZXJuYWwgc3RvcmFnZSBmb3IgYGV4dGVuc2lvbklEYFxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogPiBTdG9yYWdlOiBgeyBhOiB7IHZhbHVlOiAyIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSwgYzogMSB9YFxuICAgICAqXG4gICAgICogZ2V0KGlkLCAnYicpXG4gICAgICogPiBSZXR1cm4gYHtuYW1lOiBcInhcIn1gXG4gICAgICpcbiAgICAgKiBnZXQoaWQsIG51bGwpXG4gICAgICogPiBSZXR1cm46IGB7IGE6IHsgdmFsdWU6IDIgfSwgYjogeyBuYW1lOiBcInhcIiB9LCBjOiAxIH1gXG4gICAgICpcbiAgICAgKiBnZXQoaWQsIFtcImFcIiwgXCJiXCJdKVxuICAgICAqID4gUmV0dXJuOiBgeyBhOiB7IHZhbHVlOiAyIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSB9YFxuICAgICAqL1xuICAgICdicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0JyhleHRlbnNpb25JRDogc3RyaW5nLCBrZXk6IHN0cmluZyB8IHN0cmluZ1tdIHwgbnVsbCk6IFByb21pc2U8b2JqZWN0PlxuICAgIC8qKlxuICAgICAqIEhvc3Qgc2hvdWxkIHNldCB0aGUgb2JqZWN0IHdpdGggMSBsYXllciBtZXJnaW5nLlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBvYmplY3RcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogPiBTdG9yYWdlOiBge31gXG4gICAgICogc2V0KGlkLCB7IGE6IHsgdmFsdWU6IDEgfSwgYjogeyBuYW1lOiBcInhcIiB9IH0pXG4gICAgICogPiBTdG9yYWdlOiBgeyBhOiB7IHZhbHVlOiAxIH0sIGI6IHsgbmFtZTogXCJ4XCIgfSB9YFxuICAgICAqIHNldChpZCwgeyBhOiB7IHZhbHVlOiAyIH0gfSlcbiAgICAgKiA+IFN0b3JhZ2U6IGB7IGE6IHsgdmFsdWU6IDIgfSwgYjogeyBuYW1lOiBcInhcIiB9IH1gXG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQnKGV4dGVuc2lvbklEOiBzdHJpbmcsIG9iamVjdDogb2JqZWN0KTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBrZXlzIGluIHRoZSBvYmplY3RcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0ga2V5XG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5yZW1vdmUnKGV4dGVuc2lvbklEOiBzdHJpbmcsIGtleTogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogRGVsZXRlIHRoZSBpbnRlcm5hbCBzdG9yYWdlXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICovXG4gICAgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5jbGVhcicoZXh0ZW5zaW9uSUQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBicm93c2VyLnRhYnNcbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCBpbmplY3QgdGhlIGdpdmVuIHNjcmlwdCBpbnRvIHRoZSBnaXZlbiB0YWJJRFxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSB0YWJJRCAtIFRhYiBpZCB0aGF0IG5lZWQgaW5qZWN0IHNjcmlwdCB0b1xuICAgICAqIEBwYXJhbSBkZXRhaWxzIC0gU2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0XG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy5leGVjdXRlU2NyaXB0JyhcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdGFiSUQ6IG51bWJlcixcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgICAgY29kZT86IHN0cmluZ1xuICAgICAgICAgICAgZmlsZT86IHN0cmluZ1xuICAgICAgICAgICAgcnVuQXQ/OiAnZG9jdW1lbnRfc3RhcnQnIHwgJ2RvY3VtZW50X2VuZCcgfCAnZG9jdW1lbnRfaWRsZSdcbiAgICAgICAgfSxcbiAgICApOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogSG9zdCBzaG91bGQgY3JlYXRlIGEgbmV3IHRhYlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSBvcHRpb25zIC0gU2VlIGh0dHBzOi8vbWRuLmlvL2Jyb3dzZXIudGFicy5jcmVhdGVcbiAgICAgKi9cbiAgICAnYnJvd3Nlci50YWJzLmNyZWF0ZScoZXh0ZW5zaW9uSUQ6IHN0cmluZywgb3B0aW9uczogeyBhY3RpdmU/OiBib29sZWFuOyB1cmw/OiBzdHJpbmcgfSk6IFByb21pc2U8YnJvd3Nlci50YWJzLlRhYj5cbiAgICAvKipcbiAgICAgKiBIb3N0IHNob3VsZCByZW1vdmUgdGhlIHRhYlxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRFxuICAgICAqIEBwYXJhbSB0YWJJZCAtIFNlZSBodHRwczovL21kbi5pby9icm93c2VyLnRhYnMucmVtb3ZlXG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy5yZW1vdmUnKGV4dGVuc2lvbklEOiBzdHJpbmcsIHRhYklkOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogUXVlcnkgb3BlbmVkIHRhYnNcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSURcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyAtIFNlZSBodHRwczovL21kbi5pby9icm93c2VyLnRhYnMucXVlcnlcbiAgICAgKi9cbiAgICAnYnJvd3Nlci50YWJzLnF1ZXJ5JyhcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgcXVlcnlJbmZvOiBQYXJhbWV0ZXJzPHR5cGVvZiBicm93c2VyLnRhYnMucXVlcnk+WzBdLFxuICAgICk6IFByb21pc2U8YnJvd3Nlci50YWJzLlRhYltdPlxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBhIHRhYidzIHByb3BlcnR5XG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIHRhYklkIElmIGl0IGlzIHVuZGVmaW5lZCwgaWdub3JlIHRoaXMgcmVxdWVzdFxuICAgICAqIEBwYXJhbSB1cGRhdGVQcm9wZXJ0aWVzXG4gICAgICovXG4gICAgJ2Jyb3dzZXIudGFicy51cGRhdGUnKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICB0YWJJZD86IG51bWJlcixcbiAgICAgICAgdXBkYXRlUHJvcGVydGllcz86IHtcbiAgICAgICAgICAgIHVybD86IHN0cmluZ1xuICAgICAgICB9LFxuICAgICk6IFByb21pc2U8YnJvd3Nlci50YWJzLlRhYj5cbiAgICAvLyNlbmRyZWdpb25cbiAgICAvLyNyZWdpb24gLy8gPyBNZXNzYWdlXG4gICAgLyoqXG4gICAgICogVXNlZCB0byBpbXBsZW1lbnQgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZSBhbmQgYnJvd3Nlci50YWJzLm9uTWVzc2FnZVxuICAgICAqIEBwYXJhbSBleHRlbnNpb25JRCAtIFdobyBzZW5kIHRoaXMgbWVzc2FnZVxuICAgICAqIEBwYXJhbSB0b0V4dGVuc2lvbklEIC0gV2hvIHdpbGwgcmVjZWl2ZSB0aGlzIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gdGFiSWQgLSBTZW5kIHRoaXMgbWVzc2FnZSB0byB0YWIgaWRcbiAgICAgKiBAcGFyYW0gbWVzc2FnZUlEIC0gQSByYW5kb20gaWQgZ2VuZXJhdGVkIGJ5IGNsaWVudFxuICAgICAqIEBwYXJhbSBtZXNzYWdlIC0gbWVzc2FnZSBvYmplY3RcbiAgICAgKi9cbiAgICBzZW5kTWVzc2FnZShcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgdG9FeHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICB0YWJJZDogbnVtYmVyIHwgbnVsbCxcbiAgICAgICAgbWVzc2FnZUlEOiBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2U6IEludGVybmFsTWVzc2FnZSxcbiAgICApOiBQcm9taXNlPHZvaWQ+XG4gICAgLy8jZW5kcmVnaW9uXG4gICAgLy8jcmVnaW9uIC8vID8gZmV0Y2ggLy8gPyAodG8gYnlwYXNzIGNyb3NzIG9yaWdpbiByZXN0cmljdGlvbilcbiAgICAvKipcbiAgICAgKiBTZWU6IGh0dHBzOi8vbWRuLmlvL2ZldGNoXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEXG4gICAgICogQHBhcmFtIHJlcXVlc3QgLSBUaGUgcmVxdWVzdCBvYmplY3RcbiAgICAgKi9cbiAgICBmZXRjaChcbiAgICAgICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgcmVxdWVzdDoge1xuICAgICAgICAgICAgLyoqIEdFVCwgUE9TVCwgLi4uLiAqL1xuICAgICAgICAgICAgbWV0aG9kOiBzdHJpbmdcbiAgICAgICAgICAgIHVybDogc3RyaW5nXG4gICAgICAgIH0sXG4gICAgKTogUHJvbWlzZTx7XG4gICAgICAgIC8qKiByZXNwb25zZSBjb2RlICovXG4gICAgICAgIHN0YXR1czogbnVtYmVyXG4gICAgICAgIC8qKiByZXNwb25zZSB0ZXh0ICovXG4gICAgICAgIHN0YXR1c1RleHQ6IHN0cmluZ1xuICAgICAgICBkYXRhOiBTdHJpbmdPckJsb2JcbiAgICB9PlxuICAgIC8vI2VuZHJlZ2lvblxuICAgIC8vI3JlZ2lvbiAvLyA/IFdlYlNvY2tldFxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBXZWJTb2NrZXQgYnkgSG9zdFxuICAgICAqIEByZXR1cm5zIEEgdW5pcXVlIElEIHRoYXQgcmVwcmVzZW50IHRoaXMgV2ViU29ja2V0IGNvbm5lY3Rpb24uXG4gICAgICovXG4gICAgJ3dlYnNvY2tldC5jcmVhdGUnKGV4dGVuc2lvbklEOiBzdHJpbmcsIHVybDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+XG4gICAgLyoqXG4gICAgICogQ2xvc2UgdGhlIFdlYlNvY2tldFxuICAgICAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZG9jcy9XZWIvQVBJL1dlYlNvY2tldC9jbG9zZVxuICAgICAqL1xuICAgICd3ZWJzb2NrZXQuY2xvc2UnKGV4dGVuc2lvbklEOiBzdHJpbmcsIHdlYnNvY2tldElEOiBudW1iZXIsIGNvZGU6IG51bWJlciwgcmVhc29uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogU2VuZCBhIG1lc3NhZ2UgdG8gV2ViU29ja2V0XG4gICAgICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL1dlYi9BUEkvV2ViU29ja2V0L3NlbmRcbiAgICAgKi9cbiAgICAnd2Vic29ja2V0LnNlbmQnKGV4dGVuc2lvbklEOiBzdHJpbmcsIHdlYnNvY2tldElEOiBudW1iZXIsIGRhdGE6IFN0cmluZ09yQmxvYik6IFByb21pc2U8dm9pZD5cbiAgICAvLyNlbmRyZWdpb25cbn1cbi8qKlxuICogVGhpcyBkZXNjcmliZXMgd2hhdCBKU09OUlBDIGNhbGxzIHRoYXQgSlMgc2lkZSBzaG91bGQgaW1wbGVtZW50XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiB7XG4gICAgLyoqXG4gICAgICogSG9zdCBjYWxsIHRoaXMgdG8gbm90aWZ5IGBicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWRgIGhhcHBlbmVkLlxuICAgICAqXG4gICAgICogQHNlZSBodHRwczovL21kbi5pby9icm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWRcbiAgICAgKiBAcGFyYW0gdGFiIC0gVGhlIGNvbW1pdHRlZCB0YWIgaW5mb1xuICAgICAqL1xuICAgICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnKHRhYjogeyB0YWJJZDogbnVtYmVyOyB1cmw6IHN0cmluZyB9KTogUHJvbWlzZTx2b2lkPlxuICAgIC8qKlxuICAgICAqIFVzZWQgdG8gaW1wbGVtZW50IGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UgYW5kIGJyb3dzZXIudGFicy5vbk1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uSUQgLSBXaG8gc2VuZCB0aGlzIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gdG9FeHRlbnNpb25JRCAtIFdobyB3aWxsIHJlY2VpdmUgdGhpcyBtZXNzYWdlXG4gICAgICogQHBhcmFtIG1lc3NhZ2VJRCAtIEEgcmFuZG9tIGlkIGNyZWF0ZWQgYnkgdGhlIHNlbmRlci4gVXNlZCB0byBpZGVudGlmeSBpZiB0aGUgbWVzc2FnZSBpcyBhIHJlc3BvbnNlLlxuICAgICAqIEBwYXJhbSBtZXNzYWdlIC0gU2VuZCBieSBhbm90aGVyIGNsaWVudFxuICAgICAqIEBwYXJhbSBzZW5kZXIgLSBJbmZvIG9mIHRoZSBzZW5kZXJcbiAgICAgKi9cbiAgICBvbk1lc3NhZ2UoXG4gICAgICAgIGV4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIHRvRXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZUlEOiBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2U6IGFueSxcbiAgICAgICAgc2VuZGVyOiBicm93c2VyLnJ1bnRpbWUuTWVzc2FnZVNlbmRlcixcbiAgICApOiBQcm9taXNlPHZvaWQ+XG5cbiAgICAvKipcbiAgICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RvY3MvV2ViL0FQSS9DbG9zZUV2ZW50XG4gICAgICovXG4gICAgJ3dlYnNvY2tldC5vbkNsb3NlJyh3ZWJzb2NrZXRJRDogbnVtYmVyLCBjb2RlOiBudW1iZXIsIHJlYXNvbjogc3RyaW5nLCB3YXNDbGVhbjogYm9vbGVhbik6IFByb21pc2U8dm9pZD5cbiAgICAvKipcbiAgICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RvY3MvV2ViL0FQSS9XZWJTb2NrZXQvb25lcnJvclxuICAgICAqL1xuICAgICd3ZWJzb2NrZXQub25FcnJvcicod2Vic29ja2V0SUQ6IG51bWJlciwgcmVhc29uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+XG4gICAgLyoqXG4gICAgICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL1dlYi9BUEkvV2ViU29ja2V0L29ubWVzc2FnZVxuICAgICAqL1xuICAgICd3ZWJzb2NrZXQub25NZXNzYWdlJyh3ZWJzb2NrZXRJRDogbnVtYmVyLCBkYXRhOiBTdHJpbmdPckJsb2IpOiBQcm9taXNlPHZvaWQ+XG59XG5cbmNvbnN0IGtleSA9ICdob2xvZmxvd3Nqc29ucnBjJ1xuY29uc3QgaXNEZWJ1ZyA9IGxvY2F0aW9uLmhyZWYgPT09ICdodHRwOi8vbG9jYWxob3N0OjUwMDAvJ1xuY2xhc3MgaU9TV2Via2l0Q2hhbm5lbCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoa2V5LCBlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9IChlIGFzIEN1c3RvbUV2ZW50PGFueT4pLmRldGFpbFxuICAgICAgICAgICAgZm9yIChjb25zdCBmIG9mIHRoaXMubGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBmKGRldGFpbClcbiAgICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuICAgIHByaXZhdGUgbGlzdGVuZXI6IEFycmF5PChkYXRhOiB1bmtub3duKSA9PiB2b2lkPiA9IFtdXG4gICAgb24oXzogc3RyaW5nLCBjYjogKGRhdGE6IGFueSkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnB1c2goY2IpXG4gICAgfVxuICAgIHNlbmQoXzogc3RyaW5nLCBkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgaWYgKGlzRGVidWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzZW5kJywgZGF0YSlcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24od2luZG93LCB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2U6IChyZXNwb25zZTogYW55KSA9PlxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEN1c3RvbUV2ZW50PGFueT4oa2V5LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb25ycGM6ICcyLjAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogZGF0YS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiByZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIGlmICh3aW5kb3cud2Via2l0ICYmIHdpbmRvdy53ZWJraXQubWVzc2FnZUhhbmRsZXJzICYmIHdpbmRvdy53ZWJraXQubWVzc2FnZUhhbmRsZXJzW2tleV0pXG4gICAgICAgICAgICB3aW5kb3cud2Via2l0Lm1lc3NhZ2VIYW5kbGVyc1trZXldLnBvc3RNZXNzYWdlKGRhdGEpXG4gICAgfVxufVxuY29uc3QgVGhpc1NpZGVJbXBsZW1lbnRhdGlvbjogVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiA9IHtcbiAgICAvLyB0b2RvOiBjaGVjayBkaXNwYXRjaCB0YXJnZXQncyBtYW5pZmVzdFxuICAgICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnOiBkaXNwYXRjaE5vcm1hbEV2ZW50LmJpbmQobnVsbCwgJ2Jyb3dzZXIud2ViTmF2aWdhdGlvbi5vbkNvbW1pdHRlZCcsICcqJyksXG4gICAgYXN5bmMgb25NZXNzYWdlKFxuICAgICAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgICAgICB0b0V4dGVuc2lvbklEOiBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VJRDogc3RyaW5nLFxuICAgICAgICBtZXNzYWdlOiBJbnRlcm5hbE1lc3NhZ2UsXG4gICAgICAgIHNlbmRlcjogYnJvd3Nlci5ydW50aW1lLk1lc3NhZ2VTZW5kZXIsXG4gICAgKSB7XG4gICAgICAgIC8vID8gdGhpcyBpcyBhIHJlc3BvbnNlIHRvIHRoZSBtZXNzYWdlXG4gICAgICAgIGlmIChUd29XYXlNZXNzYWdlUHJvbWlzZVJlc29sdmVyLmhhcyhtZXNzYWdlSUQpICYmIG1lc3NhZ2UucmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGNvbnN0IFtyZXNvbHZlLCByZWplY3RdID0gVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5nZXQobWVzc2FnZUlEKSFcbiAgICAgICAgICAgIHJlc29sdmUobWVzc2FnZS5kYXRhKVxuICAgICAgICAgICAgVHdvV2F5TWVzc2FnZVByb21pc2VSZXNvbHZlci5kZWxldGUobWVzc2FnZUlEKVxuICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UucmVzcG9uc2UgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBvbk5vcm1hbE1lc3NhZ2UobWVzc2FnZS5kYXRhLCBzZW5kZXIsIHRvRXh0ZW5zaW9uSUQsIGV4dGVuc2lvbklELCBtZXNzYWdlSUQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyA/IGRyb3AgdGhlIG1lc3NhZ2VcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgJ3dlYnNvY2tldC5vbkNsb3NlJyh3ZWJzb2NrZXRJRDogbnVtYmVyLCBjb2RlOiBudW1iZXIsIHJlYXNvbjogc3RyaW5nLCB3YXNDbGVhbjogYm9vbGVhbikge1xuICAgICAgICBvbldlYlNvY2tldENsb3NlKHdlYnNvY2tldElELCBjb2RlLCByZWFzb24sIHdhc0NsZWFuKVxuICAgIH0sXG4gICAgYXN5bmMgJ3dlYnNvY2tldC5vbkVycm9yJyh3ZWJzb2NrZXRJRDogbnVtYmVyLCByZWFzb246IHN0cmluZykge1xuICAgICAgICBvbldlYlNvY2tldEVycm9yKHdlYnNvY2tldElELCByZWFzb24pXG4gICAgfSxcbiAgICBhc3luYyAnd2Vic29ja2V0Lm9uTWVzc2FnZScod2Vic29ja2V0SUQ6IG51bWJlciwgZGF0YTogU3RyaW5nT3JCbG9iKSB7XG4gICAgICAgIG9uV2ViU29ja2V0TWVzc2FnZSh3ZWJzb2NrZXRJRCwgZGF0YSlcbiAgICB9LFxufVxuZXhwb3J0IGNvbnN0IEhvc3QgPSBBc3luY0NhbGw8SG9zdD4oVGhpc1NpZGVJbXBsZW1lbnRhdGlvbiBhcyBhbnksIHtcbiAgICBkb250VGhyb3dPbk5vdEltcGxlbWVudGVkOiBmYWxzZSxcbiAgICBrZXk6ICcnLFxuICAgIHN0cmljdEpTT05SUEM6IHRydWUsXG4gICAgTWVzc2FnZUNlbnRlcjogaU9TV2Via2l0Q2hhbm5lbCxcbn0pXG4iLCJpbXBvcnQgeyBIb3N0IH0gZnJvbSAnLi4vUlBDJ1xuaW1wb3J0IHsgY3JlYXRlRXZlbnRMaXN0ZW5lciB9IGZyb20gJy4uL3V0aWxzL0xvY2FsTWVzc2FnZXMnXG5pbXBvcnQgeyBjcmVhdGVTZW5kTWVzc2FnZSB9IGZyb20gJy4vYnJvd3Nlci5tZXNzYWdlJ1xuaW1wb3J0IHsgTWFuaWZlc3QgfSBmcm9tICcuLi9FeHRlbnNpb25zJ1xuLyoqXG4gKiBDcmVhdGUgYSBuZXcgYGJyb3dzZXJgIG9iamVjdC5cbiAqIEBwYXJhbSBleHRlbnNpb25JRCAtIEV4dGVuc2lvbiBJRFxuICogQHBhcmFtIG1hbmlmZXN0IC0gTWFuaWZlc3Qgb2YgdGhlIGV4dGVuc2lvblxuICovXG5leHBvcnQgZnVuY3Rpb24gQnJvd3NlckZhY3RvcnkoZXh0ZW5zaW9uSUQ6IHN0cmluZywgbWFuaWZlc3Q6IE1hbmlmZXN0KTogYnJvd3NlciB7XG4gICAgY29uc3QgaW1wbGVtZW50YXRpb246IFBhcnRpYWw8YnJvd3Nlcj4gPSB7XG4gICAgICAgIGRvd25sb2FkczogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci5kb3dubG9hZHM+KHtcbiAgICAgICAgICAgIGRvd25sb2FkOiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5kb3dubG9hZHMuZG93bmxvYWQnKSh7XG4gICAgICAgICAgICAgICAgcGFyYW0ob3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHVybCwgZmlsZW5hbWUgfSA9IG9wdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgUGFydGlhbEltcGxlbWVudGVkKG9wdGlvbnMsICdmaWxlbmFtZScsICd1cmwnKVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcmcxID0geyB1cmwsIGZpbGVuYW1lOiBmaWxlbmFtZSB8fCAnJyB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYXJnMV1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJldHVybnMoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICB9KSxcbiAgICAgICAgcnVudGltZTogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci5ydW50aW1lPih7XG4gICAgICAgICAgICBnZXRVUkwocGF0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBgaG9sb2Zsb3dzLWV4dGVuc2lvbjovLyR7ZXh0ZW5zaW9uSUR9LyR7cGF0aH1gXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0TWFuaWZlc3QoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobWFuaWZlc3QpKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uTWVzc2FnZTogY3JlYXRlRXZlbnRMaXN0ZW5lcihleHRlbnNpb25JRCwgJ2Jyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UnKSxcbiAgICAgICAgICAgIHNlbmRNZXNzYWdlOiBjcmVhdGVTZW5kTWVzc2FnZShleHRlbnNpb25JRCksXG4gICAgICAgIH0pLFxuICAgICAgICB0YWJzOiBOb3RJbXBsZW1lbnRlZFByb3h5PHR5cGVvZiBicm93c2VyLnRhYnM+KHtcbiAgICAgICAgICAgIGFzeW5jIGV4ZWN1dGVTY3JpcHQodGFiSUQsIGRldGFpbHMpIHtcbiAgICAgICAgICAgICAgICBQYXJ0aWFsSW1wbGVtZW50ZWQoZGV0YWlscywgJ2NvZGUnLCAnZmlsZScsICdydW5BdCcpXG4gICAgICAgICAgICAgICAgYXdhaXQgSG9zdFsnYnJvd3Nlci50YWJzLmV4ZWN1dGVTY3JpcHQnXShleHRlbnNpb25JRCwgdGFiSUQgPT09IHVuZGVmaW5lZCA/IC0xIDogdGFiSUQsIGRldGFpbHMpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlOiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci50YWJzLmNyZWF0ZScpKCksXG4gICAgICAgICAgICBhc3luYyByZW1vdmUodGFiSUQpIHtcbiAgICAgICAgICAgICAgICBsZXQgdDogbnVtYmVyW11cbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodGFiSUQpKSB0ID0gW3RhYklEXVxuICAgICAgICAgICAgICAgIGVsc2UgdCA9IHRhYklEXG4gICAgICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodC5tYXAoeCA9PiBIb3N0Wydicm93c2VyLnRhYnMucmVtb3ZlJ10oZXh0ZW5zaW9uSUQsIHgpKSlcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBxdWVyeTogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIudGFicy5xdWVyeScpKCksXG4gICAgICAgICAgICB1cGRhdGU6IGJpbmRpbmcoZXh0ZW5zaW9uSUQsICdicm93c2VyLnRhYnMudXBkYXRlJykoKSxcbiAgICAgICAgfSksXG4gICAgICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgICAgIGxvY2FsOiBJbXBsZW1lbnRzPHR5cGVvZiBicm93c2VyLnN0b3JhZ2UubG9jYWw+KHtcbiAgICAgICAgICAgICAgICBjbGVhcjogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5jbGVhcicpKCksXG4gICAgICAgICAgICAgICAgcmVtb3ZlOiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnJlbW92ZScpKCksXG4gICAgICAgICAgICAgICAgc2V0OiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLnNldCcpKCksXG4gICAgICAgICAgICAgICAgZ2V0OiBiaW5kaW5nKGV4dGVuc2lvbklELCAnYnJvd3Nlci5zdG9yYWdlLmxvY2FsLmdldCcpKHtcbiAgICAgICAgICAgICAgICAgICAgLyoqIEhvc3Qgbm90IGFjY2VwdGluZyB7IGE6IDEgfSBhcyBrZXlzICovXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtKGtleXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleXMpKSByZXR1cm4gW2tleXMgYXMgc3RyaW5nW11dXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGtleXMgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleXMgPT09IG51bGwpIHJldHVybiBbbnVsbF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW09iamVjdC5rZXlzKGtleXMpXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtudWxsXVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXR1cm5zKHJ0biwgW2tleV0pOiBvYmplY3Qge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoa2V5KSkgcmV0dXJuIHJ0blxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcgJiYga2V5ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgLi4ua2V5LCAuLi5ydG4gfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ0blxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgV2UncmUgaW1wbGVtZW50aW5nIG5vbi1zdGFuZGFyZCBBUEkgaW4gV2ViRXh0ZW5zaW9uXG4gICAgICAgICAgICAgICAgZ2V0Qnl0ZXNJblVzZTogYmluZGluZyhleHRlbnNpb25JRCwgJ2Jyb3dzZXIuc3RvcmFnZS5sb2NhbC5nZXRCeXRlc0luVXNlJykoKSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgc3luYzogTm90SW1wbGVtZW50ZWRQcm94eSgpLFxuICAgICAgICAgICAgb25DaGFuZ2VkOiBOb3RJbXBsZW1lbnRlZFByb3h5KCksXG4gICAgICAgIH0sXG4gICAgICAgIHdlYk5hdmlnYXRpb246IE5vdEltcGxlbWVudGVkUHJveHk8dHlwZW9mIGJyb3dzZXIud2ViTmF2aWdhdGlvbj4oe1xuICAgICAgICAgICAgb25Db21taXR0ZWQ6IGNyZWF0ZUV2ZW50TGlzdGVuZXIoZXh0ZW5zaW9uSUQsICdicm93c2VyLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQnKSxcbiAgICAgICAgfSksXG4gICAgICAgIGV4dGVuc2lvbjogTm90SW1wbGVtZW50ZWRQcm94eTx0eXBlb2YgYnJvd3Nlci5leHRlbnNpb24+KHtcbiAgICAgICAgICAgIGdldEJhY2tncm91bmRQYWdlKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJveHkoXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBuZXcgVVJMKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJHtleHRlbnNpb25JRH0vX2dlbmVyYXRlZF9iYWNrZ3JvdW5kX3BhZ2UuaHRtbGAsXG4gICAgICAgICAgICAgICAgICAgICAgICApIGFzIFBhcnRpYWw8TG9jYXRpb24+LFxuICAgICAgICAgICAgICAgICAgICB9IGFzIFBhcnRpYWw8V2luZG93PixcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0KF86IGFueSwga2V5OiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoX1trZXldKSByZXR1cm4gX1trZXldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTm90IHN1cHBvcnRlZCcpXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICkgYXMgV2luZG93XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICB9XG4gICAgcmV0dXJuIE5vdEltcGxlbWVudGVkUHJveHk8YnJvd3Nlcj4oaW1wbGVtZW50YXRpb24sIGZhbHNlKVxufVxudHlwZSBicm93c2VyID0gdHlwZW9mIGJyb3dzZXJcblxuZnVuY3Rpb24gSW1wbGVtZW50czxUPihpbXBsZW1lbnRhdGlvbjogVCkge1xuICAgIHJldHVybiBpbXBsZW1lbnRhdGlvblxufVxuZnVuY3Rpb24gTm90SW1wbGVtZW50ZWRQcm94eTxUID0gYW55PihpbXBsZW1lbnRlZDogUGFydGlhbDxUPiA9IHt9LCBmaW5hbCA9IHRydWUpOiBUIHtcbiAgICByZXR1cm4gbmV3IFByb3h5KGltcGxlbWVudGVkLCB7XG4gICAgICAgIGdldCh0YXJnZXQ6IGFueSwga2V5KSB7XG4gICAgICAgICAgICBpZiAoIXRhcmdldFtrZXldKSByZXR1cm4gZmluYWwgPyBOb3RJbXBsZW1lbnRlZCA6IE5vdEltcGxlbWVudGVkUHJveHkoKVxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtrZXldXG4gICAgICAgIH0sXG4gICAgICAgIGFwcGx5KCkge1xuICAgICAgICAgICAgcmV0dXJuIE5vdEltcGxlbWVudGVkKClcbiAgICAgICAgfSxcbiAgICB9KVxufVxuZnVuY3Rpb24gTm90SW1wbGVtZW50ZWQoKTogYW55IHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIScpXG4gICAgfVxufVxuZnVuY3Rpb24gUGFydGlhbEltcGxlbWVudGVkPFQ+KG9iajogVCwgLi4ua2V5czogKGtleW9mIFQpW10pIHtcbiAgICBjb25zdCBvYmoyID0geyAuLi5vYmogfVxuICAgIGtleXMuZm9yRWFjaCh4ID0+IGRlbGV0ZSBvYmoyW3hdKVxuICAgIGlmIChPYmplY3Qua2V5cyhvYmoyKS5sZW5ndGgpIGNvbnNvbGUud2FybihgTm90IGltcGxlbWVudGVkIG9wdGlvbnNgLCBvYmoyLCBgYXRgLCBuZXcgRXJyb3IoKS5zdGFjaylcbn1cblxudHlwZSBIZWFkbGVzc1BhcmFtZXRlcnM8VCBleHRlbmRzICguLi5hcmdzOiBhbnkpID0+IGFueT4gPSBUIGV4dGVuZHMgKGV4dGVuc2lvbklEOiBzdHJpbmcsIC4uLmFyZ3M6IGluZmVyIFApID0+IGFueVxuICAgID8gUFxuICAgIDogbmV2ZXJcbi8qKlxuICogR2VuZXJhdGUgYmluZGluZyBiZXR3ZWVuIEhvc3QgYW5kIFdlYkV4dGVuc2lvbkFQSVxuICpcbiAqIEFMTCBnZW5lcmljcyBzaG91bGQgYmUgaW5mZXJyZWQuIERPIE5PVCB3cml0ZSBpdCBtYW51YWxseS5cbiAqXG4gKiBJZiB5b3UgYXJlIHdyaXRpbmcgb3B0aW9ucywgbWFrZSBzdXJlIHlvdSBhZGQgeW91ciBmdW5jdGlvbiB0byBgQnJvd3NlclJlZmVyZW5jZWAgdG8gZ2V0IHR5cGUgdGlwcy5cbiAqXG4gKiBAcGFyYW0gZXh0ZW5zaW9uSUQgLSBUaGUgZXh0ZW5zaW9uIElEXG4gKiBAcGFyYW0ga2V5IC0gVGhlIEFQSSBuYW1lIGluIHRoZSB0eXBlIG9mIGBIb3N0YCBBTkQgYEJyb3dzZXJSZWZlcmVuY2VgXG4gKi9cbmZ1bmN0aW9uIGJpbmRpbmc8XG4gICAgLyoqIE5hbWUgb2YgdGhlIEFQSSBpbiB0aGUgUlBDIGJpbmRpbmcgKi9cbiAgICBLZXkgZXh0ZW5kcyBrZXlvZiBCcm93c2VyUmVmZXJlbmNlLFxuICAgIC8qKiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgV2ViRXh0ZW5zaW9uQVBJIHNpZGUgKi9cbiAgICBCcm93c2VyRGVmIGV4dGVuZHMgQnJvd3NlclJlZmVyZW5jZVtLZXldLFxuICAgIC8qKiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgSG9zdCBzaWRlICovXG4gICAgSG9zdERlZiBleHRlbmRzIEhvc3RbS2V5XSxcbiAgICAvKiogQXJndW1lbnRzIG9mIHRoZSBicm93c2VyIHNpZGUgKi9cbiAgICBCcm93c2VyQXJncyBleHRlbmRzIFBhcmFtZXRlcnM8QnJvd3NlckRlZj4sXG4gICAgLyoqIFJldHVybiB0eXBlIG9mIHRoZSBicm93c2VyIHNpZGUgKi9cbiAgICBCcm93c2VyUmV0dXJuIGV4dGVuZHMgUHJvbWlzZU9mPFJldHVyblR5cGU8QnJvd3NlckRlZj4+LFxuICAgIC8qKiBBcmd1bWVudHMgdHlwZSBvZiB0aGUgSG9zdCBzaWRlICovXG4gICAgSG9zdEFyZ3MgZXh0ZW5kcyBIZWFkbGVzc1BhcmFtZXRlcnM8SG9zdERlZj4sXG4gICAgLyoqIFJldHVybiB0eXBlIG9mIHRoZSBIb3N0IHNpZGUgKi9cbiAgICBIb3N0UmV0dXJuIGV4dGVuZHMgUHJvbWlzZU9mPFJldHVyblR5cGU8SG9zdERlZj4+XG4+KGV4dGVuc2lvbklEOiBzdHJpbmcsIGtleTogS2V5KSB7XG4gICAgLyoqXG4gICAgICogQW5kIGhlcmUgd2Ugc3BsaXQgaXQgaW50byAyIGZ1bmN0aW9uLCBpZiB3ZSBqb2luIHRoZW0gdG9nZXRoZXIgaXQgd2lsbCBicmVhayB0aGUgaW5mZXIgKGJ1dCBpZGsgd2h5KVxuICAgICAqL1xuICAgIHJldHVybiA8XG4gICAgICAgIC8qKiBIZXJlIHdlIGhhdmUgdG8gdXNlIGdlbmVyaWNzIHdpdGggZ3VhcmQgdG8gZW5zdXJlIFR5cGVTY3JpcHQgd2lsbCBpbmZlciB0eXBlIG9uIHJ1bnRpbWUgKi9cbiAgICAgICAgT3B0aW9ucyBleHRlbmRzIHtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgKiBIZXJlIHdlIHdyaXRlIHRoZSB0eXBlIGd1YXJkIGluIHRoZSBnZW5lcmljLFxuICAgICAgICAgICAgICogZG9uJ3QgdXNlIHR3byBtb3JlIGdlbmVyaWNzIHRvIGluZmVyIHRoZSByZXR1cm4gdHlwZSBvZiBgcGFyYW1gIGFuZCBgcmV0dXJuc2AsXG4gICAgICAgICAgICAgKiB0aGF0IHdpbGwgYnJlYWsgdGhlIGluZmVyIHJlc3VsdC5cbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcGFyYW0/OiAoLi4uYXJnczogQnJvd3NlckFyZ3MpID0+IEhvc3RBcmdzXG4gICAgICAgICAgICByZXR1cm5zPzogKHJldHVybnM6IEhvc3RSZXR1cm4sIGJyb3dzZXI6IEJyb3dzZXJBcmdzLCBob3N0OiBIb3N0QXJncykgPT4gQnJvd3NlclJldHVyblxuICAgICAgICB9XG4gICAgPihcbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMuIFlvdSBjYW4gd3JpdGUgdGhlIGJyaWRnZSBiZXR3ZWVuIEhvc3Qgc2lkZSBhbmQgV2ViRXh0ZW5zaW9uIHNpZGUuXG4gICAgICAgICAqL1xuICAgICAgICBvcHRpb25zOiBPcHRpb25zID0ge30gYXMgYW55LFxuICAgICkgPT4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRG9uJ3Qgd3JpdGUgdGhlc2UgdHlwZSBhbGlhcyBpbiBnZW5lcmljcy4gd2lsbCBicmVhay4gaWRrIHdoeSBhZ2Fpbi5cbiAgICAgICAgICovXG4gICAgICAgIHR5cGUgSGFzUGFyYW1GbiA9IHVuZGVmaW5lZCBleHRlbmRzIE9wdGlvbnNbJ3BhcmFtJ10gPyBmYWxzZSA6IHRydWVcbiAgICAgICAgdHlwZSBIYXNSZXR1cm5GbiA9IHVuZGVmaW5lZCBleHRlbmRzIE9wdGlvbnNbJ3JldHVybnMnXSA/IGZhbHNlIDogdHJ1ZVxuICAgICAgICB0eXBlIF9fX0FyZ3NfX18gPSBSZXR1cm5UeXBlPE5vbk51bGxhYmxlPE9wdGlvbnNbJ3BhcmFtJ10+PlxuICAgICAgICB0eXBlIF9fX1JldHVybl9fXyA9IFJldHVyblR5cGU8Tm9uTnVsbGFibGU8T3B0aW9uc1sncmV0dXJucyddPj5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIHRoZXJlIGlzIGEgYnJpZGdlIGZ1bmN0aW9uXG4gICAgICAgICAqIC0gaWYgaXRzIHJldHVybiB0eXBlIHNhdGlzZmllZCB0aGUgcmVxdWlyZW1lbnQsIHJldHVybiB0aGUgYEJyb3dzZXJBcmdzYCBlbHNlIHJldHVybiBgbmV2ZXJgXG4gICAgICAgICAqXG4gICAgICAgICAqIHJldHVybiB0aGUgYEhvc3RBcmdzYCBhbmQgbGV0IFR5cGVTY3JpcHQgY2hlY2sgaWYgaXQgaXMgc2F0aXNmaWVkLlxuICAgICAgICAgKi9cbiAgICAgICAgdHlwZSBJbmZlckFyZ3NSZXN1bHQgPSBIYXNQYXJhbUZuIGV4dGVuZHMgdHJ1ZVxuICAgICAgICAgICAgPyBfX19BcmdzX19fIGV4dGVuZHMgQnJvd3NlckFyZ3NcbiAgICAgICAgICAgICAgICA/IEJyb3dzZXJBcmdzXG4gICAgICAgICAgICAgICAgOiBuZXZlclxuICAgICAgICAgICAgOiBIb3N0QXJnc1xuICAgICAgICAvKiogSnVzdCBsaWtlIGBJbmZlckFyZ3NSZXN1bHRgICovXG4gICAgICAgIHR5cGUgSW5mZXJSZXR1cm5SZXN1bHQgPSBIYXNSZXR1cm5GbiBleHRlbmRzIHRydWVcbiAgICAgICAgICAgID8gX19fUmV0dXJuX19fIGV4dGVuZHMgQnJvd3NlclJldHVyblxuICAgICAgICAgICAgICAgID8gX19fUmV0dXJuX19fXG4gICAgICAgICAgICAgICAgOiAnbmV2ZXIgcnRuJ1xuICAgICAgICAgICAgOiBIb3N0UmV0dXJuXG4gICAgICAgIGNvbnN0IG5vb3AgPSA8VD4oeD86IFQpID0+IHhcbiAgICAgICAgY29uc3Qgbm9vcEFyZ3MgPSAoLi4uYXJnczogYW55W10pID0+IGFyZ3NcbiAgICAgICAgY29uc3QgaG9zdERlZmluaXRpb246IChleHRlbnNpb25JRDogc3RyaW5nLCAuLi5hcmdzOiBIb3N0QXJncykgPT4gUHJvbWlzZTxIb3N0UmV0dXJuPiA9IEhvc3Rba2V5XSBhcyBhbnlcbiAgICAgICAgcmV0dXJuICgoYXN5bmMgKC4uLmFyZ3M6IEJyb3dzZXJBcmdzKTogUHJvbWlzZTxCcm93c2VyUmV0dXJuPiA9PiB7XG4gICAgICAgICAgICAvLyA/IFRyYW5zZm9ybSBXZWJFeHRlbnNpb24gQVBJIGFyZ3VtZW50cyB0byBob3N0IGFyZ3VtZW50c1xuICAgICAgICAgICAgY29uc3QgaG9zdEFyZ3MgPSAob3B0aW9ucy5wYXJhbSB8fCBub29wQXJncykoLi4uYXJncykgYXMgSG9zdEFyZ3NcbiAgICAgICAgICAgIC8vID8gZXhlY3V0ZVxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaG9zdERlZmluaXRpb24oZXh0ZW5zaW9uSUQsIC4uLmhvc3RBcmdzKVxuICAgICAgICAgICAgLy8gPyBUcmFuc2Zvcm0gaG9zdCByZXN1bHQgdG8gV2ViRXh0ZW5zaW9uIEFQSSByZXN1bHRcbiAgICAgICAgICAgIGNvbnN0IGJyb3dzZXJSZXN1bHQgPSAob3B0aW9ucy5yZXR1cm5zIHx8IG5vb3ApKHJlc3VsdCwgYXJncywgaG9zdEFyZ3MpIGFzIEJyb3dzZXJSZXR1cm5cbiAgICAgICAgICAgIHJldHVybiBicm93c2VyUmVzdWx0XG4gICAgICAgIH0pIGFzIHVua25vd24pIGFzICguLi5hcmdzOiBJbmZlckFyZ3NSZXN1bHQpID0+IFByb21pc2U8SW5mZXJSZXR1cm5SZXN1bHQ+XG4gICAgfVxufVxuLyoqXG4gKiBBIHJlZmVyZW5jZSB0YWJsZSBiZXR3ZWVuIEhvc3QgYW5kIFdlYkV4dGVuc2lvbkFQSVxuICpcbiAqIGtleSBpcyBpbiB0aGUgaG9zdCwgcmVzdWx0IHR5cGUgaXMgaW4gdGhlIFdlYkV4dGVuc2lvbi5cbiAqL1xudHlwZSBCcm93c2VyUmVmZXJlbmNlID0geyBba2V5IGluIGtleW9mIHR5cGVvZiBIb3N0XTogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gUHJvbWlzZTx1bmtub3duPiB9ICYge1xuICAgICdicm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZCc6IHR5cGVvZiBicm93c2VyLmRvd25sb2Fkcy5kb3dubG9hZFxuICAgICdicm93c2VyLnRhYnMuY3JlYXRlJzogdHlwZW9mIGJyb3dzZXIudGFicy5jcmVhdGVcbn1cbnR5cGUgUHJvbWlzZU9mPFQ+ID0gVCBleHRlbmRzIFByb21pc2U8aW5mZXIgVT4gPyBVIDogbmV2ZXJcbiIsImltcG9ydCB7IEhvc3QgfSBmcm9tICcuLi9SUEMnXG5pbXBvcnQgeyBlbmNvZGVTdHJpbmdPckJsb2IgfSBmcm9tICcuLi91dGlscy9TdHJpbmdPckJsb2InXG5cbmNvbnN0IHsgY3JlYXRlT2JqZWN0VVJMLCByZXZva2VPYmplY3RVUkwgfSA9IFVSTFxuZnVuY3Rpb24gZ2V0SURGcm9tQmxvYlVSTCh4OiBzdHJpbmcpIHtcbiAgICByZXR1cm4gbmV3IFVSTChuZXcgVVJMKHgpLnBhdGhuYW1lKS5wYXRobmFtZVxufVxuLyoqXG4gKiBNb2RpZnkgdGhlIGJlaGF2aW9yIG9mIFVSTC4qXG4gKiBMZXQgdGhlIGJsb2I6Ly8gdXJsIGNhbiBiZSByZWNvZ25pemVkIGJ5IEhvc3QuXG4gKlxuICogQHBhcmFtIHVybCBUaGUgb3JpZ2luYWwgVVJMIG9iamVjdFxuICogQHBhcmFtIGV4dGVuc2lvbklEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmhhbmNlVVJMKHVybDogdHlwZW9mIFVSTCwgZXh0ZW5zaW9uSUQ6IHN0cmluZykge1xuICAgIHVybC5jcmVhdGVPYmplY3RVUkwgPSBjcmVhdGVPYmplY3RVUkxFbmhhbmNlZChleHRlbnNpb25JRClcbiAgICB1cmwucmV2b2tlT2JqZWN0VVJMID0gcmV2b2tlT2JqZWN0VVJMRW5oYW5jZWQoZXh0ZW5zaW9uSUQpXG4gICAgcmV0dXJuIHVybFxufVxuXG5mdW5jdGlvbiByZXZva2VPYmplY3RVUkxFbmhhbmNlZChleHRlbnNpb25JRDogc3RyaW5nKTogKHVybDogc3RyaW5nKSA9PiB2b2lkIHtcbiAgICByZXR1cm4gKHVybDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldm9rZU9iamVjdFVSTCh1cmwpXG4gICAgICAgIGNvbnN0IGlkID0gZ2V0SURGcm9tQmxvYlVSTCh1cmwpXG4gICAgICAgIEhvc3RbJ1VSTC5yZXZva2VPYmplY3RVUkwnXShleHRlbnNpb25JRCwgaWQpXG4gICAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVPYmplY3RVUkxFbmhhbmNlZChleHRlbnNpb25JRDogc3RyaW5nKTogKG9iamVjdDogYW55KSA9PiBzdHJpbmcge1xuICAgIHJldHVybiAob2JqOiBGaWxlIHwgQmxvYiB8IE1lZGlhU291cmNlKSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IGNyZWF0ZU9iamVjdFVSTChvYmopXG4gICAgICAgIGNvbnN0IHJlc291cmNlSUQgPSBnZXRJREZyb21CbG9iVVJMKHVybClcbiAgICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgICAgIGVuY29kZVN0cmluZ09yQmxvYihvYmopLnRoZW4oYmxvYiA9PiBIb3N0WydVUkwuY3JlYXRlT2JqZWN0VVJMJ10oZXh0ZW5zaW9uSUQsIHJlc291cmNlSUQsIGJsb2IpKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmxcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGJsb2JUb0Jhc2U2NChibG9iOiBCbG9iKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgW2hlYWRlciwgYmFzZTY0XSA9IChyZWFkZXIucmVzdWx0IGFzIHN0cmluZykuc3BsaXQoJywnKVxuICAgICAgICAgICAgcmVzb2x2ZShiYXNlNjQpXG4gICAgICAgIH0pXG4gICAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGUgPT4gcmVqZWN0KGUpKVxuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKVxuICAgIH0pXG59XG4iLCJpbXBvcnQgeyBIb3N0IH0gZnJvbSAnLi4vUlBDJ1xuaW1wb3J0IHsgZGVjb2RlU3RyaW5nT3JCbG9iIH0gZnJvbSAnLi4vdXRpbHMvU3RyaW5nT3JCbG9iJ1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRmV0Y2goZXh0ZW5zaW9uSUQ6IHN0cmluZyk6IHR5cGVvZiBmZXRjaCB7XG4gICAgcmV0dXJuIG5ldyBQcm94eShmZXRjaCwge1xuICAgICAgICBhc3luYyBhcHBseSh0YXJnZXQsIHRoaXNBcmcsIFtyZXF1ZXN0SW5mbywgcmVxdWVzdEluaXRdOiBQYXJhbWV0ZXJzPHR5cGVvZiBmZXRjaD4pIHtcbiAgICAgICAgICAgIGNvbnN0IHsgYm9keSwgbWV0aG9kLCB1cmwgfSA9IG5ldyBSZXF1ZXN0KHJlcXVlc3RJbmZvLCByZXF1ZXN0SW5pdClcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEhvc3QuZmV0Y2goZXh0ZW5zaW9uSUQsIHsgbWV0aG9kLCB1cmwgfSlcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBkZWNvZGVTdHJpbmdPckJsb2IocmVzdWx0LmRhdGEpXG4gICAgICAgICAgICBpZiAoZGF0YSA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKCcnKVxuICAgICAgICAgICAgY29uc3QgcmV0dXJuVmFsdWUgPSBuZXcgUmVzcG9uc2UoZGF0YSwgcmVzdWx0KVxuICAgICAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlXG4gICAgICAgIH0sXG4gICAgfSlcbn1cbiIsIi8qKlxuICogVGhpcyBmaWxlIHBhcnRseSBpbXBsZW1lbnRzIFhSYXlWaXNpb24gaW4gRmlyZWZveCdzIFdlYkV4dGVuc2lvbiBzdGFuZGFyZFxuICogYnkgY3JlYXRlIGEgdHdvLXdheSBKUyBzYW5kYm94IGJ1dCBzaGFyZWQgRE9NIGVudmlyb25tZW50LlxuICpcbiAqIGNsYXNzIFdlYkV4dGVuc2lvbkNvbnRlbnRTY3JpcHRFbnZpcm9ubWVudCB3aWxsIHJldHVybiBhIG5ldyBKUyBlbnZpcm9ubWVudFxuICogdGhhdCBoYXMgYSBcImJyb3dzZXJcIiB2YXJpYWJsZSBpbnNpZGUgb2YgaXQgYW5kIGEgY2xvbmUgb2YgdGhlIGN1cnJlbnQgRE9NIGVudmlyb25tZW50XG4gKiB0byBwcmV2ZW50IHRoZSBtYWluIHRocmVhZCBoYWNrIG9uIHByb3RvdHlwZSB0byBhY2Nlc3MgdGhlIGNvbnRlbnQgb2YgQ29udGVudFNjcmlwdHMuXG4gKlxuICogIyMgQ2hlY2tsaXN0OlxuICogLSBbb10gQ29udGVudFNjcmlwdCBjYW5ub3QgYWNjZXNzIG1haW4gdGhyZWFkXG4gKiAtIFs/XSBNYWluIHRocmVhZCBjYW5ub3QgYWNjZXNzIENvbnRlbnRTY3JpcHRcbiAqIC0gW29dIENvbnRlbnRTY3JpcHQgY2FuIGFjY2VzcyBtYWluIHRocmVhZCdzIERPTVxuICogLSBbIF0gQ29udGVudFNjcmlwdCBtb2RpZmljYXRpb24gb24gRE9NIHByb3RvdHlwZSBpcyBub3QgZGlzY292ZXJhYmxlIGJ5IG1haW4gdGhyZWFkXG4gKiAtIFsgXSBNYWluIHRocmVhZCBtb2RpZmljYXRpb24gb24gRE9NIHByb3RvdHlwZSBpcyBub3QgZGlzY292ZXJhYmxlIGJ5IENvbnRlbnRTY3JpcHRcbiAqL1xuaW1wb3J0IFJlYWxtQ29uc3RydWN0b3IsIHsgUmVhbG0gfSBmcm9tICdyZWFsbXMtc2hpbSdcblxuaW1wb3J0IHsgQnJvd3NlckZhY3RvcnkgfSBmcm9tICcuL2Jyb3dzZXInXG5pbXBvcnQgeyBNYW5pZmVzdCB9IGZyb20gJy4uL0V4dGVuc2lvbnMnXG5pbXBvcnQgeyBlbmhhbmNlVVJMIH0gZnJvbSAnLi9VUkwuY3JlYXRlK3Jldm9rZU9iamVjdFVSTCdcbmltcG9ydCB7IGNyZWF0ZUZldGNoIH0gZnJvbSAnLi9mZXRjaCdcbmltcG9ydCB7IGNyZWF0ZVdlYlNvY2tldCB9IGZyb20gJy4vV2ViU29ja2V0J1xuLyoqXG4gKiBSZWN1cnNpdmVseSBnZXQgdGhlIHByb3RvdHlwZSBjaGFpbiBvZiBhbiBPYmplY3RcbiAqIEBwYXJhbSBvIE9iamVjdFxuICovXG5mdW5jdGlvbiBnZXRQcm90b3R5cGVDaGFpbihvOiBhbnksIF86IGFueVtdID0gW10pOiBhbnlbXSB7XG4gICAgaWYgKG8gPT09IHVuZGVmaW5lZCB8fCBvID09PSBudWxsKSByZXR1cm4gX1xuICAgIGNvbnN0IHkgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YobylcbiAgICBpZiAoeSA9PT0gbnVsbCB8fCB5ID09PSB1bmRlZmluZWQgfHwgeSA9PT0gT2JqZWN0LnByb3RvdHlwZSkgcmV0dXJuIF9cbiAgICByZXR1cm4gZ2V0UHJvdG90eXBlQ2hhaW4oT2JqZWN0LmdldFByb3RvdHlwZU9mKHkpLCBbLi4uXywgeV0pXG59XG4vKipcbiAqIEFwcGx5IGFsbCBXZWJBUElzIHRvIHRoZSBjbGVhbiBzYW5kYm94IGNyZWF0ZWQgYnkgUmVhbG1cbiAqL1xuY29uc3QgUHJlcGFyZVdlYkFQSXMgPSAoKCkgPT4ge1xuICAgIGNvbnN0IHJlYWxXaW5kb3cgPSB3aW5kb3dcbiAgICBjb25zdCB3ZWJBUElzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMod2luZG93KVxuICAgIFJlZmxlY3QuZGVsZXRlUHJvcGVydHkod2ViQVBJcywgJ3dpbmRvdycpXG4gICAgUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh3ZWJBUElzLCAnZ2xvYmFsVGhpcycpXG4gICAgUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh3ZWJBUElzLCAnc2VsZicpXG4gICAgUmVmbGVjdC5kZWxldGVQcm9wZXJ0eSh3ZWJBUElzLCAnZ2xvYmFsJylcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRG9jdW1lbnQucHJvdG90eXBlLCAnZGVmYXVsdFZpZXcnLCB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfSxcbiAgICB9KVxuICAgIHJldHVybiAoc2FuZGJveFJvb3Q6IHR5cGVvZiBnbG9iYWxUaGlzKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsb25lZFdlYkFQSXMgPSB7IC4uLndlYkFQSXMgfVxuICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhzYW5kYm94Um9vdCkuZm9yRWFjaChuYW1lID0+IFJlZmxlY3QuZGVsZXRlUHJvcGVydHkoY2xvbmVkV2ViQVBJcywgbmFtZSkpXG4gICAgICAgIC8vID8gQ2xvbmUgV2ViIEFQSXNcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gd2ViQVBJcykge1xuICAgICAgICAgICAgUGF0Y2hUaGlzT2ZEZXNjcmlwdG9yVG9HbG9iYWwod2ViQVBJc1trZXldLCByZWFsV2luZG93KVxuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzYW5kYm94Um9vdCwgJ3dpbmRvdycsIHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgdmFsdWU6IHNhbmRib3hSb290LFxuICAgICAgICB9KVxuICAgICAgICBPYmplY3QuYXNzaWduKHNhbmRib3hSb290LCB7IGdsb2JhbFRoaXM6IHNhbmRib3hSb290IH0pXG4gICAgICAgIGNvbnN0IHByb3RvID0gZ2V0UHJvdG90eXBlQ2hhaW4ocmVhbFdpbmRvdylcbiAgICAgICAgICAgIC5tYXAoT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMpXG4gICAgICAgICAgICAucmVkdWNlUmlnaHQoKHByZXZpb3VzLCBjdXJyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29weSA9IHsgLi4uY3VycmVudCB9XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY29weSkge1xuICAgICAgICAgICAgICAgICAgICBQYXRjaFRoaXNPZkRlc2NyaXB0b3JUb0dsb2JhbChjb3B5W2tleV0sIHJlYWxXaW5kb3cpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuY3JlYXRlKHByZXZpb3VzLCBjb3B5KVxuICAgICAgICAgICAgfSwge30pXG4gICAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihzYW5kYm94Um9vdCwgcHJvdG8pXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHNhbmRib3hSb290LCBjbG9uZWRXZWJBUElzKVxuICAgIH1cbn0pKClcbi8qKlxuICogRXhlY3V0aW9uIGVudmlyb25tZW50IG9mIENvbnRlbnRTY3JpcHRcbiAqL1xuZXhwb3J0IGNsYXNzIFdlYkV4dGVuc2lvbkNvbnRlbnRTY3JpcHRFbnZpcm9ubWVudCBpbXBsZW1lbnRzIFJlYWxtPHR5cGVvZiBnbG9iYWxUaGlzICYgeyBicm93c2VyOiB0eXBlb2YgYnJvd3NlciB9PiB7XG4gICAgcHJpdmF0ZSByZWFsbSA9IFJlYWxtQ29uc3RydWN0b3IubWFrZVJvb3RSZWFsbSgpXG4gICAgZ2V0IGdsb2JhbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVhbG0uZ2xvYmFsXG4gICAgfVxuICAgIHJlYWRvbmx5IFtTeW1ib2wudG9TdHJpbmdUYWddID0gJ1JlYWxtJ1xuICAgIC8qKlxuICAgICAqIEV2YWx1YXRlIGEgc3RyaW5nIGluIHRoZSBjb250ZW50IHNjcmlwdCBlbnZpcm9ubWVudFxuICAgICAqIEBwYXJhbSBzb3VyY2VUZXh0IFNvdXJjZSB0ZXh0XG4gICAgICovXG4gICAgZXZhbHVhdGUoc291cmNlVGV4dDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWxtLmV2YWx1YXRlKHNvdXJjZVRleHQpXG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBydW5uaW5nIGV4dGVuc2lvbiBmb3IgYW4gY29udGVudCBzY3JpcHQuXG4gICAgICogQHBhcmFtIGV4dGVuc2lvbklEIFRoZSBleHRlbnNpb24gSURcbiAgICAgKiBAcGFyYW0gbWFuaWZlc3QgVGhlIG1hbmlmZXN0IG9mIHRoZSBleHRlbnNpb25cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZXh0ZW5zaW9uSUQ6IHN0cmluZywgcHVibGljIG1hbmlmZXN0OiBNYW5pZmVzdCkge1xuICAgICAgICB0aGlzLmluaXQoKVxuICAgIH1cbiAgICBwcml2YXRlIGluaXQoKSB7XG4gICAgICAgIFByZXBhcmVXZWJBUElzKHRoaXMuZ2xvYmFsKVxuICAgICAgICB0aGlzLmdsb2JhbC5icm93c2VyID0gQnJvd3NlckZhY3RvcnkodGhpcy5leHRlbnNpb25JRCwgdGhpcy5tYW5pZmVzdClcbiAgICAgICAgdGhpcy5nbG9iYWwuVVJMID0gZW5oYW5jZVVSTCh0aGlzLmdsb2JhbC5VUkwsIHRoaXMuZXh0ZW5zaW9uSUQpXG4gICAgICAgIHRoaXMuZ2xvYmFsLmZldGNoID0gY3JlYXRlRmV0Y2godGhpcy5leHRlbnNpb25JRClcbiAgICAgICAgdGhpcy5nbG9iYWwuV2ViU29ja2V0ID0gY3JlYXRlV2ViU29ja2V0KHRoaXMuZXh0ZW5zaW9uSUQpXG4gICAgfVxufVxuLyoqXG4gKiBNYW55IG1ldGhvZHMgb24gYHdpbmRvd2AgcmVxdWlyZXMgYHRoaXNgIHBvaW50cyB0byBhIFdpbmRvdyBvYmplY3RcbiAqIExpa2UgYGFsZXJ0KClgLiBJZiB5b3UgY2FsbCBhbGVydCBhcyBgY29uc3QgdyA9IHsgYWxlcnQgfTsgdy5hbGVydCgpYCxcbiAqIHRoZXJlIHdpbGwgYmUgYW4gSWxsZWdhbCBpbnZvY2F0aW9uLlxuICpcbiAqIFRvIHByZXZlbnQgYHRoaXNgIGJpbmRpbmcgbG9zdCwgd2UgbmVlZCB0byByZWJpbmQgaXQuXG4gKlxuICogQHBhcmFtIGRlc2MgUHJvcGVydHlEZXNjcmlwdG9yXG4gKiBAcGFyYW0gZ2xvYmFsIFRoZSByZWFsIHdpbmRvd1xuICovXG5mdW5jdGlvbiBQYXRjaFRoaXNPZkRlc2NyaXB0b3JUb0dsb2JhbChkZXNjOiBQcm9wZXJ0eURlc2NyaXB0b3IsIGdsb2JhbDogV2luZG93KSB7XG4gICAgY29uc3QgeyBnZXQsIHNldCwgdmFsdWUgfSA9IGRlc2NcbiAgICBpZiAoZ2V0KSBkZXNjLmdldCA9ICgpID0+IGdldC5hcHBseShnbG9iYWwpXG4gICAgaWYgKHNldCkgZGVzYy5zZXQgPSAodmFsOiBhbnkpID0+IHNldC5hcHBseShnbG9iYWwsIHZhbClcbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNvbnN0IGRlc2MyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnModmFsdWUpXG4gICAgICAgIGRlc2MudmFsdWUgPSBmdW5jdGlvbiguLi5hcmdzOiBhbnlbXSkge1xuICAgICAgICAgICAgaWYgKG5ldy50YXJnZXQpIHJldHVybiBSZWZsZWN0LmNvbnN0cnVjdCh2YWx1ZSwgYXJncywgbmV3LnRhcmdldClcbiAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KHZhbHVlLCBnbG9iYWwsIGFyZ3MpXG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZGVzYy52YWx1ZSwgZGVzYzIpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyA/IEZvciB1bmtub3duIHJlYXNvbiB0aGlzIGZhaWwgZm9yIHNvbWUgb2JqZWN0cyBvbiBTYWZhcmkuXG4gICAgICAgICAgICBkZXNjLnZhbHVlLnByb3RvdHlwZSA9IHZhbHVlLnByb3RvdHlwZVxuICAgICAgICB9IGNhdGNoIHt9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgbWF0Y2hpbmdVUkwgfSBmcm9tICcuL3V0aWxzL1VSTE1hdGNoZXInXG5pbXBvcnQgeyBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnQgfSBmcm9tICcuL3NoaW1zL1hSYXlWaXNpb24nXG5pbXBvcnQgeyBCcm93c2VyRmFjdG9yeSB9IGZyb20gJy4vc2hpbXMvYnJvd3NlcidcbmltcG9ydCB7IGNyZWF0ZUZldGNoIH0gZnJvbSAnLi9zaGltcy9mZXRjaCdcblxuZXhwb3J0IHR5cGUgV2ViRXh0ZW5zaW9uSUQgPSBzdHJpbmdcbmV4cG9ydCB0eXBlIE1hbmlmZXN0ID0gUGFydGlhbDxicm93c2VyLnJ1bnRpbWUuTWFuaWZlc3Q+ICZcbiAgICBQaWNrPGJyb3dzZXIucnVudGltZS5NYW5pZmVzdCwgJ25hbWUnIHwgJ3ZlcnNpb24nIHwgJ21hbmlmZXN0X3ZlcnNpb24nPlxuZXhwb3J0IGludGVyZmFjZSBXZWJFeHRlbnNpb24ge1xuICAgIG1hbmlmZXN0OiBNYW5pZmVzdFxuICAgIGVudmlyb25tZW50OiBXZWJFeHRlbnNpb25Db250ZW50U2NyaXB0RW52aXJvbm1lbnRcbn1cbmV4cG9ydCBjb25zdCByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uID0gbmV3IE1hcDxXZWJFeHRlbnNpb25JRCwgV2ViRXh0ZW5zaW9uPigpXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJXZWJFeHRlbnNpb24oXG4gICAgZXh0ZW5zaW9uSUQ6IHN0cmluZyxcbiAgICBtYW5pZmVzdDogTWFuaWZlc3QsXG4gICAgZW52aXJvbm1lbnQ6ICdjb250ZW50IHNjcmlwdCcgfCAnYmFja2dyb3VuZCBzY3JpcHQnLFxuICAgIHByZWxvYWRlZFJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9LFxuKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhcbiAgICAgICAgYFtXZWJFeHRlbnNpb25dIExvYWRpbmcgZXh0ZW5zaW9uICR7bWFuaWZlc3QubmFtZX0oJHtleHRlbnNpb25JRH0pIHdpdGggbWFuaWZlc3RgLFxuICAgICAgICBtYW5pZmVzdCxcbiAgICAgICAgYGFuZCBwcmVsb2FkZWQgcmVzb3VyY2VgLFxuICAgICAgICBwcmVsb2FkZWRSZXNvdXJjZXMsXG4gICAgICAgIGBpbiAke2Vudmlyb25tZW50fSBtb2RlYCxcbiAgICApXG4gICAgaWYgKGxvY2F0aW9uLnByb3RvY29sID09PSAnaG9sb2Zsb3dzLWV4dGVuc2lvbjonKSBwcmVwYXJlQmFja2dyb3VuZEFuZE9wdGlvbnNQYWdlRW52aXJvbm1lbnQoZXh0ZW5zaW9uSUQsIG1hbmlmZXN0KVxuICAgIHRyeSB7XG4gICAgICAgIGlmIChlbnZpcm9ubWVudCA9PT0gJ2NvbnRlbnQgc2NyaXB0Jykge1xuICAgICAgICAgICAgdW50aWxEb2N1bWVudFJlYWR5KCkudGhlbigoKSA9PiBMb2FkQ29udGVudFNjcmlwdChtYW5pZmVzdCwgZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlcykpXG4gICAgICAgIH0gZWxzZSBpZiAoZW52aXJvbm1lbnQgPT09ICdiYWNrZ3JvdW5kIHNjcmlwdCcpIHtcbiAgICAgICAgICAgIHVudGlsRG9jdW1lbnRSZWFkeSgpLnRoZW4oKCkgPT4gTG9hZEJhY2tncm91bmRTY3JpcHQobWFuaWZlc3QsIGV4dGVuc2lvbklELCBwcmVsb2FkZWRSZXNvdXJjZXMpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBbV2ViRXh0ZW5zaW9uXSB1bmtub3duIHJ1bm5pbmcgZW52aXJvbm1lbnQgJHtlbnZpcm9ubWVudH1gKVxuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgfVxuICAgIHJldHVybiByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uLmdldChleHRlbnNpb25JRClcbn1cblxuZnVuY3Rpb24gdW50aWxEb2N1bWVudFJlYWR5KCkge1xuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCByZXNvbHZlLCB7IG9uY2U6IHRydWUsIHBhc3NpdmU6IHRydWUgfSlcbiAgICB9KVxufVxuXG5mdW5jdGlvbiBMb2FkQmFja2dyb3VuZFNjcmlwdChtYW5pZmVzdDogTWFuaWZlc3QsIGV4dGVuc2lvbklEOiBzdHJpbmcsIHByZWxvYWRlZFJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPikge1xuICAgIGlmICghbWFuaWZlc3QuYmFja2dyb3VuZCkgcmV0dXJuXG4gICAgY29uc3QgeyBwYWdlLCBzY3JpcHRzIH0gPSBtYW5pZmVzdC5iYWNrZ3JvdW5kIGFzIGFueVxuICAgIGlmIChwYWdlKSByZXR1cm4gY29uc29sZS53YXJuKCdbV2ViRXh0ZW5zaW9uXSBtYW5pZmVzdC5iYWNrZ3JvdW5kLnBhZ2UgaXMgbm90IHN1cHBvcnRlZCB5ZXQhJylcbiAgICBpZiAobG9jYXRpb24uaG9zdG5hbWUgIT09ICdsb2NhbGhvc3QnICYmICFsb2NhdGlvbi5ocmVmLnN0YXJ0c1dpdGgoJ2hvbG9mbG93cy1leHRlbnNpb246Ly8nKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBCYWNrZ3JvdW5kIHNjcmlwdCBvbmx5IGFsbG93ZWQgaW4gbG9jYWxob3N0KGZvciBkZWJ1Z2dpbmcpIGFuZCBob2xvZmxvd3MtZXh0ZW5zaW9uOi8vYClcbiAgICB9XG4gICAgLy8ge1xuICAgIC8vICAgICBjb25zdCBzcmMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKEhUTUxTY3JpcHRFbGVtZW50LnByb3RvdHlwZSwgJ3NyYycpIVxuICAgIC8vICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSFRNTFNjcmlwdEVsZW1lbnQucHJvdG90eXBlLCAnc3JjJywge1xuICAgIC8vICAgICAgICAgZ2V0KCkge1xuICAgIC8vICAgICAgICAgICAgIHJldHVybiBzcmMuZ2V0IS5jYWxsKHRoaXMpXG4gICAgLy8gICAgICAgICB9LFxuICAgIC8vICAgICAgICAgc2V0KHZhbCkge1xuICAgIC8vICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdMb2FkaW5nICcsIHZhbClcbiAgICAvLyAgICAgICAgICAgICBpZiAodmFsIGluIHByZWxvYWRlZFJlc291cmNlcyB8fCB2YWwucmVwbGFjZSgvXlxcLy8sICcnKSBpbiBwcmVsb2FkZWRSZXNvdXJjZXMpIHtcbiAgICAvLyAgICAgICAgICAgICAgICAgUnVuSW5HbG9iYWxTY29wZShleHRlbnNpb25JRCwgcHJlbG9hZGVkUmVzb3VyY2VzW3ZhbF0gfHwgcHJlbG9hZGVkUmVzb3VyY2VzW3ZhbC5yZXBsYWNlKC9eXFwvLywgJycpXSlcbiAgICAvLyAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAvLyAgICAgICAgICAgICB9XG4gICAgLy8gICAgICAgICAgICAgc3JjLnNldCEuY2FsbCh0aGlzLCB2YWwpXG4gICAgLy8gICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAvLyAgICAgICAgIH0sXG4gICAgLy8gICAgIH0pXG4gICAgLy8gfVxuICAgIHByZXBhcmVCYWNrZ3JvdW5kQW5kT3B0aW9uc1BhZ2VFbnZpcm9ubWVudChleHRlbnNpb25JRCwgbWFuaWZlc3QpXG4gICAgZm9yIChjb25zdCBwYXRoIG9mIChzY3JpcHRzIGFzIHN0cmluZ1tdKSB8fCBbXSkge1xuICAgICAgICBpZiAodHlwZW9mIHByZWxvYWRlZFJlc291cmNlc1twYXRoXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vID8gUnVuIGl0IGluIGdsb2JhbCBzY29wZS5cbiAgICAgICAgICAgIFJ1bkluR2xvYmFsU2NvcGUoZXh0ZW5zaW9uSUQsIHByZWxvYWRlZFJlc291cmNlc1twYXRoXSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgW1dlYkV4dGVuc2lvbl0gQ29udGVudCBzY3JpcHRzIHByZWxvYWQgbm90IGZvdW5kIGZvciAke21hbmlmZXN0Lm5hbWV9OiAke3BhdGh9YClcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIHByZXBhcmVCYWNrZ3JvdW5kQW5kT3B0aW9uc1BhZ2VFbnZpcm9ubWVudChleHRlbnNpb25JRDogc3RyaW5nLCBtYW5pZmVzdDogTWFuaWZlc3QpIHtcbiAgICBPYmplY3QuYXNzaWduKHdpbmRvdywge1xuICAgICAgICBicm93c2VyOiBCcm93c2VyRmFjdG9yeShleHRlbnNpb25JRCwgbWFuaWZlc3QpLFxuICAgICAgICBmZXRjaDogY3JlYXRlRmV0Y2goZXh0ZW5zaW9uSUQpLFxuICAgIH0gYXMgUGFydGlhbDx0eXBlb2YgZ2xvYmFsVGhpcz4pXG59XG5cbmZ1bmN0aW9uIFJ1bkluR2xvYmFsU2NvcGUoZXh0ZW5zaW9uSUQ6IHN0cmluZywgc3JjOiBzdHJpbmcpIHtcbiAgICBpZiAobG9jYXRpb24ucHJvdG9jb2wgPT09ICdob2xvZmxvd3MtZXh0ZW5zaW9uOicpIHJldHVybiBuZXcgRnVuY3Rpb24oc3JjKSgpXG4gICAgY29uc3QgZiA9IG5ldyBGdW5jdGlvbihgd2l0aCAoXG4gICAgICAgICAgICAgICAgbmV3IFByb3h5KHdpbmRvdywge1xuICAgICAgICAgICAgICAgICAgICBnZXQodGFyZ2V0LCBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXkgPT09ICdsb2NhdGlvbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVUkwoXCJob2xvZmxvd3MtZXh0ZW5zaW9uOi8vJHtleHRlbnNpb25JRH0vX2dlbmVyYXRlZF9iYWNrZ3JvdW5kX3BhZ2UuaHRtbFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYodHlwZW9mIHRhcmdldFtrZXldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzYzIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyh0YXJnZXRba2V5XSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBmKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ldy50YXJnZXQpIHJldHVybiBSZWZsZWN0LmNvbnN0cnVjdCh0YXJnZXRba2V5XSwgYXJncywgbmV3LnRhcmdldClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuYXBwbHkodGFyZ2V0W2tleV0sIHdpbmRvdywgYXJncylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZiwgZGVzYzIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZi5wcm90b3R5cGUgPSB0YXJnZXRba2V5XS5wcm90b3R5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtrZXldXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApKSB7XG4gICAgICAgICAgICAgICAgJHtzcmN9XG4gICAgICAgICAgICAgIH1gKVxuICAgIGYoKVxufVxuXG5mdW5jdGlvbiBMb2FkQ29udGVudFNjcmlwdChtYW5pZmVzdDogTWFuaWZlc3QsIGV4dGVuc2lvbklEOiBzdHJpbmcsIHByZWxvYWRlZFJlc291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPikge1xuICAgIGZvciAoY29uc3QgW2luZGV4LCBjb250ZW50XSBvZiAobWFuaWZlc3QuY29udGVudF9zY3JpcHRzIHx8IFtdKS5lbnRyaWVzKCkpIHtcbiAgICAgICAgd2FybmluZ05vdEltcGxlbWVudGVkSXRlbShjb250ZW50LCBpbmRleClcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgbWF0Y2hpbmdVUkwoXG4gICAgICAgICAgICAgICAgbmV3IFVSTChsb2NhdGlvbi5ocmVmKSxcbiAgICAgICAgICAgICAgICBjb250ZW50Lm1hdGNoZXMsXG4gICAgICAgICAgICAgICAgY29udGVudC5leGNsdWRlX21hdGNoZXMgfHwgW10sXG4gICAgICAgICAgICAgICAgY29udGVudC5pbmNsdWRlX2dsb2JzIHx8IFtdLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQuZXhjbHVkZV9nbG9icyB8fCBbXSxcbiAgICAgICAgICAgICAgICBjb250ZW50Lm1hdGNoX2Fib3V0X2JsYW5rLFxuICAgICAgICAgICAgKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFtXZWJFeHRlbnNpb25dIExvYWRpbmcgY29udGVudCBzY3JpcHQgZm9yYCwgY29udGVudClcbiAgICAgICAgICAgIGxvYWRDb250ZW50U2NyaXB0KGV4dGVuc2lvbklELCBtYW5pZmVzdCwgY29udGVudCwgcHJlbG9hZGVkUmVzb3VyY2VzKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgW1dlYkV4dGVuc2lvbl0gVVJMIG1pc21hdGNoZWQuIFNraXAgY29udGVudCBzY3JpcHQgZm9yLCBgLCBjb250ZW50KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkQ29udGVudFNjcmlwdChcbiAgICBleHRlbnNpb25JRDogc3RyaW5nLFxuICAgIG1hbmlmZXN0OiBNYW5pZmVzdCxcbiAgICBjb250ZW50OiBOb25OdWxsYWJsZTxNYW5pZmVzdFsnY29udGVudF9zY3JpcHRzJ10+WzBdLFxuICAgIGNvbnRlbnRfc2NyaXB0czogUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbikge1xuICAgIGlmICghcmVnaXN0ZXJlZFdlYkV4dGVuc2lvbi5oYXMoZXh0ZW5zaW9uSUQpKSB7XG4gICAgICAgIGNvbnN0IGVudmlyb25tZW50ID0gbmV3IFdlYkV4dGVuc2lvbkNvbnRlbnRTY3JpcHRFbnZpcm9ubWVudChleHRlbnNpb25JRCwgbWFuaWZlc3QpXG4gICAgICAgIGNvbnN0IGV4dDogV2ViRXh0ZW5zaW9uID0ge1xuICAgICAgICAgICAgbWFuaWZlc3QsXG4gICAgICAgICAgICBlbnZpcm9ubWVudCxcbiAgICAgICAgfVxuICAgICAgICByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uLnNldChleHRlbnNpb25JRCwgZXh0KVxuICAgIH1cbiAgICBjb25zdCB7IGVudmlyb25tZW50IH0gPSByZWdpc3RlcmVkV2ViRXh0ZW5zaW9uLmdldChleHRlbnNpb25JRCkhXG4gICAgZm9yIChjb25zdCBwYXRoIG9mIGNvbnRlbnQuanMgfHwgW10pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb250ZW50X3NjcmlwdHNbcGF0aF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBlbnZpcm9ubWVudC5ldmFsdWF0ZShjb250ZW50X3NjcmlwdHNbcGF0aF0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtXZWJFeHRlbnNpb25dIENvbnRlbnQgc2NyaXB0cyBwcmVsb2FkIG5vdCBmb3VuZCBmb3IgJHttYW5pZmVzdC5uYW1lfTogJHtwYXRofWApXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHdhcm5pbmdOb3RJbXBsZW1lbnRlZEl0ZW0oY29udGVudDogTm9uTnVsbGFibGU8TWFuaWZlc3RbJ2NvbnRlbnRfc2NyaXB0cyddPlswXSwgaW5kZXg6IG51bWJlcikge1xuICAgIGlmIChjb250ZW50LmFsbF9mcmFtZXMpXG4gICAgICAgIGNvbnNvbGUud2FybihgYWxsX2ZyYW1lcyBub3Qgc3VwcG9ydGVkIHlldC4gRGVmaW5lZCBhdCBtYW5pZmVzdC5jb250ZW50X3NjcmlwdHNbJHtpbmRleH1dLmFsbF9mcmFtZXNgKVxuICAgIGlmIChjb250ZW50LmNzcykgY29uc29sZS53YXJuKGBjc3Mgbm90IHN1cHBvcnRlZCB5ZXQuIERlZmluZWQgYXQgbWFuaWZlc3QuY29udGVudF9zY3JpcHRzWyR7aW5kZXh9XS5jc3NgKVxuICAgIGlmIChjb250ZW50LnJ1bl9hdCAmJiBjb250ZW50LnJ1bl9hdCAhPT0gJ2RvY3VtZW50X3N0YXJ0JylcbiAgICAgICAgY29uc29sZS53YXJuKGBydW5fYXQgbm90IHN1cHBvcnRlZCB5ZXQuIERlZmluZWQgYXQgbWFuaWZlc3QuY29udGVudF9zY3JpcHRzWyR7aW5kZXh9XS5ydW5fYXRgKVxufVxuIiwiaW1wb3J0IHsgcmVnaXN0ZXJXZWJFeHRlbnNpb24gfSBmcm9tICcuL0V4dGVuc2lvbnMnXG5pbXBvcnQgTWFuaWZlc3QgZnJvbSAnLi9leHRlbnNpb24vbWFuaWZlc3QuanNvbidcblxuY29uc3QgcmVzb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge31cbi8qKlxuICogRHluYW1pY2FsbHkgZ2VuZXJhdGUgY29kZTpcbiAqIGZvciBlYWNoIGZpbGUgaW4gYHNyYy9leHRlbnNpb24vanNgIGFuZCBgc3JjL2V4dGVuc2lvbi9wb2x5ZmlsbGBcbiAqICAgR2VuZXJhdGUgY29kZSBsaWtlIHRoaXM6XG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyBAdHMtaWdub3JlXG4gKiBpbXBvcnQgJFBBVEhOQU1FX0ZJTEVOQU1FIGZyb20gJy4vZXh0ZW5zaW9uL1BBVEhOQU1FL0ZJTEVOQU1FJ1xuICogcmVzb3VyY2VzWydwYXRobmFtZS9maWxlbmFtZSddID0gJFBBVEhOQU1FX0ZJTEVOQU1FXG4gKiBgYGBcbiAqL1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICQwIGZyb20gJy4vZXh0ZW5zaW9uL2luZGV4Lmh0bWwnXG5yZXNvdXJjZXNbJ2luZGV4Lmh0bWwnXSA9ICQwXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgJDEgZnJvbSAnLi9leHRlbnNpb24vanMvNC5jaHVuay5qcydcbnJlc291cmNlc1snanMvNC5jaHVuay5qcyddID0gJDFcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCAkMiBmcm9tICcuL2V4dGVuc2lvbi9qcy81LmNodW5rLmpzJ1xucmVzb3VyY2VzWydqcy81LmNodW5rLmpzJ10gPSAkMlxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICQzIGZyb20gJy4vZXh0ZW5zaW9uL2pzL2FwcC5qcydcbnJlc291cmNlc1snanMvYXBwLmpzJ10gPSAkM1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICQ0IGZyb20gJy4vZXh0ZW5zaW9uL2pzL2JhY2tncm91bmRzZXJ2aWNlLmpzJ1xucmVzb3VyY2VzWydqcy9iYWNrZ3JvdW5kc2VydmljZS5qcyddID0gJDRcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCAkNSBmcm9tICcuL2V4dGVuc2lvbi9qcy9jb250ZW50c2NyaXB0LmpzJ1xucmVzb3VyY2VzWydqcy9jb250ZW50c2NyaXB0LmpzJ10gPSAkNVxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICQ2IGZyb20gJy4vZXh0ZW5zaW9uL2pzL2luamVjdGVkc2NyaXB0LmpzJ1xucmVzb3VyY2VzWydqcy9pbmplY3RlZHNjcmlwdC5qcyddID0gJDZcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCAkNyBmcm9tICcuL2V4dGVuc2lvbi9zdGF0aWMvbWVkaWEvMWEyLmM2YTgwZDUyLmpwZydcbnJlc291cmNlc1snc3RhdGljL21lZGlhLzFhMi5jNmE4MGQ1Mi5qcGcnXSA9ICQ3XG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgJDggZnJvbSAnLi9leHRlbnNpb24vc3RhdGljL21lZGlhLzFhMy5mZTY5MDY0MS5qcGcnXG5yZXNvdXJjZXNbJ3N0YXRpYy9tZWRpYS8xYTMuZmU2OTA2NDEuanBnJ10gPSAkOFxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICQ5IGZyb20gJy4vZXh0ZW5zaW9uL3BvbHlmaWxsL2Jyb3dzZXItcG9seWZpbGwubWluLmpzJ1xucmVzb3VyY2VzWydwb2x5ZmlsbC9icm93c2VyLXBvbHlmaWxsLm1pbi5qcyddID0gJDlcbi8vIEB0cy1pZ25vcmVcbmltcG9ydCAkMTAgZnJvbSAnLi9leHRlbnNpb24vcG9seWZpbGwvd2ViY3J5cHRvLWxpbmVyLnNoaW0uanMnXG5yZXNvdXJjZXNbJ3BvbHlmaWxsL3dlYmNyeXB0by1saW5lci5zaGltLmpzJ10gPSAkMTBcblxuY29uc3QgaWQgPSAnZW9ma2Rna2hmb2ViZWNtYW1samZhZXBja29lY2poaWInXG5jb25zdCBtYW5pZmVzdCA9IEpTT04ucGFyc2UoTWFuaWZlc3QgYXMgYW55KVxuY29uc3QgZW52ID1cbiAgICBsb2NhdGlvbi5ocmVmLnN0YXJ0c1dpdGgoJ2hvbG9mbG93cy1leHRlbnNpb246Ly8nKSAmJiBsb2NhdGlvbi5ocmVmLmVuZHNXaXRoKCdfZ2VuZXJhdGVkX2JhY2tncm91bmRfcGFnZS5odG1sJylcbnJlZ2lzdGVyV2ViRXh0ZW5zaW9uKGlkLCBtYW5pZmVzdCwgZW52ID8gJ2JhY2tncm91bmQgc2NyaXB0JyA6ICdjb250ZW50IHNjcmlwdCcsIHJlc291cmNlcylcbiJdLCJuYW1lcyI6WyJ0aGlzIiwiTWVzc2FnZUNlbnRlciIsIkhvbG9mbG93c01lc3NhZ2VDZW50ZXIiLCJSZXF1ZXN0IiwiUmVhbG1Db25zdHJ1Y3RvciJdLCJtYXBwaW5ncyI6Ijs7O0lBQUE7Ozs7Ozs7O0FBUUEsYUFBZ0IsV0FBVyxDQUN2QixRQUFhLEVBQ2IsT0FBaUIsRUFDakIsZUFBeUIsRUFDekIsYUFBdUIsRUFDdkIsYUFBdUIsRUFDdkIsV0FBcUI7UUFFckIsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFBOztRQUVsQixLQUFLLE1BQU0sSUFBSSxJQUFJLE9BQU87WUFBRSxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQztnQkFBRSxNQUFNLEdBQUcsSUFBSSxDQUFBO1FBQzNGLEtBQUssTUFBTSxJQUFJLElBQUksZUFBZTtZQUFFLElBQUksZUFBZSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUM7Z0JBQUUsTUFBTSxHQUFHLEtBQUssQ0FBQTtRQUN2RixJQUFJLGFBQWEsQ0FBQyxNQUFNO1lBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFBO1FBQzFFLElBQUksYUFBYSxDQUFDLE1BQU07WUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLENBQUE7UUFDMUUsT0FBTyxNQUFNLENBQUE7SUFDakIsQ0FBQztJQUNEOzs7SUFHQSxNQUFNLGtCQUFrQixHQUFzQjtR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