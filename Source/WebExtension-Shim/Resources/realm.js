!function(e,t){(e=e||self).Realm=t()}(this,function(){"use strict";function e(e,t){const n=`please report internal shim error: ${e}`;throw console.error(n),t&&(console.error(`${t}`),console.error(`${t.stack}`)),n}function t(t,n){t||e(n)}function n(e){return e}function r(e,t){const{initRootRealm:n,initCompartment:r,getRealmGlobal:o,realmEvaluate:a}=t,{create:c,defineProperties:i}=Object;new Map([["EvalError",EvalError],["RangeError",RangeError],["ReferenceError",ReferenceError],["SyntaxError",SyntaxError],["TypeError",TypeError],["URIError",URIError]]);function s(e,...t){return e(...t)}class u{constructor(){throw new TypeError("Realm is not a constructor")}static makeRootRealm(t={}){const r=c(u.prototype);return s(n,e,r,t),r}static makeCompartment(t={}){const n=c(u.prototype);return s(r,e,n,t),n}get global(){return s(o,this)}evaluate(e,t,n={}){return s(a,this,e,t,n)}}return i(u,{toString:{value:()=>"function Realm() { [shim code] }",writable:!1,enumerable:!1,configurable:!0}}),i(u.prototype,{toString:{value:()=>"[object Realm]",writable:!1,enumerable:!1,configurable:!0}}),u}const o=n(`'use strict'; (${r})`);const{assign:a,create:c,freeze:i,defineProperties:s,getOwnPropertyDescriptor:u,getOwnPropertyDescriptors:l,getOwnPropertyNames:f,getPrototypeOf:p,setPrototypeOf:y}=Object,{apply:m,ownKeys:d}=Reflect,h=e=>(t,...n)=>m(e,t,n),b=h(Object.prototype.hasOwnProperty),w=h(Array.prototype.filter),v=h(Array.prototype.pop),g=h(Array.prototype.join),E=h(Array.prototype.concat),R=h(RegExp.prototype.test),S=h(String.prototype.includes),x=["Infinity","NaN","undefined"],F=["isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","Array","ArrayBuffer","Boolean","DataView","EvalError","Float32Array","Float64Array","Int8Array","Int16Array","Int32Array","Map","Number","Object","RangeError","ReferenceError","Set","String","Symbol","SyntaxError","TypeError","Uint8Array","Uint8ClampedArray","Uint16Array","Uint32Array","URIError","WeakMap","WeakSet","JSON","Math","Reflect","escape","unescape"],$=["Date","Error","Promise","Proxy","RegExp","Intl"];function _(){const{defineProperty:e,defineProperties:t,getOwnPropertyDescriptor:n,getPrototypeOf:r,prototype:o}=Object;try{(0,o.__lookupGetter__)("x")}catch(e){return}function a(e){if(void 0===e||null===e)throw new TypeError("can't convert undefined or null to object");return Object(e)}function c(e){return"symbol"==typeof e?e:`${e}`}function i(e,t){if("function"!=typeof e)throw TypeError(`invalid ${t} usage`);return e}t(o,{__defineGetter__:{value:function(t,n){const r=a(this);e(r,t,{get:i(n,"getter"),enumerable:!0,configurable:!0})}},__defineSetter__:{value:function(t,n){const r=a(this);e(r,t,{set:i(n,"setter"),enumerable:!0,configurable:!0})}},__lookupGetter__:{value:function(e){let t,o=a(this);for(e=c(e);o&&!(t=n(o,e));)o=r(o);return t&&t.get}},__lookupSetter__:{value:function(e){let t,o=a(this);for(e=c(e);o&&!(t=n(o,e));)o=r(o);return t&&t.set}}})}function O(){const{defineProperties:e,getPrototypeOf:t,setPrototypeOf:n}=Object;function r(r,o){let a;try{a=(0,eval)(o)}catch(e){if(e instanceof SyntaxError)return;throw e}const c=t(a),i=c.constructor;const s=function(){if(function(){const e=(new Error).stack;return!e||-1!==e.indexOf("eval")}())throw new TypeError("Not available");return i.apply(this,arguments)};e(s,{name:{value:r}}),e(c,{constructor:{value:s}}),e(s,{prototype:{value:c}}),s!==Function.prototype.constructor&&n(s,Function.prototype.constructor)}r("Function","(function(){})"),r("GeneratorFunction","(function*(){})"),r("AsyncFunction","(async function(){})"),r("AsyncGeneratorFunction","(async function*(){})")}const A="'use strict'; this",P="(0, eval)(\"'use strict'; this\")";const j=()=>{const e=function(){if("undefined"==typeof document)return;const e=document.createElement("iframe");return e.style.display="none",document.children[0].appendChild(e),e.contentWindow.eval(A)}(),t=function(){if(new Function("try {return this===global}catch(e){return false}")())return(new Symbol).runInNewContext(P)}();if(!e&&!t||e&&t)throw new Error("unexpected platform, unable to create Realm");return e||t};function G(e,n=[]){const r=function(e){const n={};function r(r,o,a,c){for(const i of r){const r=u(e,i);r&&(t("value"in r,`unexpected accessor on global property: ${i}`),n[i]={value:r.value,writable:o,enumerable:a,configurable:c})}}return r(x,!1,!1,!1),r(F,!1,!1,!1),r($,!0,!1,!0),n}(e);return i({unsafeGlobal:e,sharedGlobalDescs:r,unsafeEval:e.eval,unsafeFunction:e.Function,allShims:n})}const I=n(`"use strict"; (${_})();`),k=n(`"use strict"; (${O})();`);const U=/^[a-zA-Z_$][\w$]*$/,T=new Set(["await","break","case","catch","class","const","continue","debugger","default","delete","do","else","export","extends","finally","for","function","if","import","in","instanceof","new","return","super","switch","this","throw","try","typeof","var","void","while","with","yield","let","static","enum","implements","package","protected","interface","private","public","await","null","true","false","this","arguments"]);const C=i({});new Proxy(i({}),{get(t,n){e(`unexpected scope handler trap called: ${n}`)}});const N=new RegExp("(?:\x3c!--|--\x3e)");const D=/\bimport\s*(?:\(|\/[/*])/;const W=/\beval\s*(?:\(|\/[/*])/;function M(e){!function(e){const t=e.search(N);if(-1!==t){const n=e.slice(0,t).split("\n").length;throw new SyntaxError(`possible html comment syntax rejected around line ${n}`)}}(e),function(e){const t=e.search(D);if(-1!==t){const n=e.slice(0,t).split("\n").length;throw new SyntaxError(`possible import expression rejected around line ${n}`)}}(e),function(e){const t=e.search(W);if(-1!==t){const n=e.slice(0,t).split("\n").length;throw new SyntaxError(`possible direct eval expression rejected around line ${n}`)}}(e)}const z={rewrite:e=>(M(e.src),e)};function B(e,t){const{unsafeFunction:n}=e;return n(`\n    with (arguments[0]) {\n      ${function(e){return 0===e.length?"":`const {${g(e,",")}} = this;`}(t)}\n      return function() {\n        'use strict';\n        return eval(arguments[0]);\n      };\n    }\n  `)}function J(n,r,o,a){const{unsafeFunction:i}=n,u=function(e){const t=l(e);return w(f(t),e=>{if("eval"===e||T.has(e)||!R(U,e))return!1;const n=t[e];return!1===n.configurable&&!1===n.writable&&b(n,"value")})}(r),d=B(n,u);return function(u={},f={}){const h=[...f.transforms||[],...o||[],...[z]],w={eval(t){t=`${t}`;const o=h.reduce((e,t)=>t.rewrite?t.rewrite(e):e,{src:t,endowments:u});t=o.src;const i=c(r,l(o.endowments)),s=function(e,t,n){const{unsafeGlobal:r,unsafeEval:o}=e;let a=!1;return{__proto__:C,allowUnsafeEvaluatorOnce(){a=!0},unsafeEvaluatorAllowed:()=>a,get:(e,t)=>"eval"===t?!0===a?(a=!1,o):e.eval:t!==Symbol.unscopables&&t in e?e[t]:void 0,set(e,n,r){if(b(e,n))throw new TypeError(`do not modify endowments like ${String(n)}`);return t[n]=r,!0},has:(e,t)=>!!n||"eval"===t||t in e||t in r}}(n,r,a),f=new Proxy(i,s),p=m(d,r,[f]);let y;s.allowUnsafeEvaluatorOnce();try{return m(p,r,[t])}catch(e){throw y=e,e}finally{s.unsafeEvaluatorAllowed()&&e("handler did not revoke useUnsafeEvaluator",y)}}}.eval;return y(w,i.prototype),t(p(w).constructor!==Function,"hide Function"),t(p(w).constructor!==i,"hide unsafeFunction"),s(w,{toString:{value:w("() => 'function eval' + '() { [shim code] }'"),writable:!1,enumerable:!1,configurable:!0}}),w}}const K=new WeakMap;function V(e){return t(Object(e)===e,"bad object, not a Realm instance"),t(K.has(e),"Realm instance has no record"),K.get(e)}function Z(e,n){t(Object(e)===e,"bad object, not a Realm instance"),t(!K.has(e),"Realm instance already has a record"),K.set(e,n)}function q(e,n,r){const{sharedGlobalDescs:o,unsafeGlobal:a}=e,u=c(a.Object.prototype,o),l=J(e,u,n,r),f=function(e){return e()}(l),m=function(e){return(t,n,r={})=>e(n,r)(t)}(l),d=function(e,n){const{unsafeFunction:r,unsafeGlobal:o}=e,a=function(...e){const t=`${v(e)||""}`;let a=`${g(e,",")}`;if(!R(/^[\w\s,]*$/,a))throw new o.SyntaxError("shim limitation: Function arg must be simple ASCII identifiers, possibly separated by commas: no default values, pattern matches, or non-ASCII parameter names");if(new r(t),S(a,")"))throw new o.SyntaxError("shim limitation: Function arg string contains parenthesis");return a.length>0&&(a+="\n/*``*/"),n(`(function(${a}){\n${t}\n})`)};return y(a,r.prototype),t(p(a).constructor!==Function,"hide Function"),t(p(a).constructor!==r,"hide unsafeFunction"),s(a,{prototype:{value:r.prototype},toString:{value:n("() => 'function Function() { [shim code] }'"),writable:!1,enumerable:!1,configurable:!0}}),a}(e,f);return function(e,t,n){s(e,{eval:{value:t,writable:!0,configurable:!0},Function:{value:n,writable:!0,configurable:!0}})}(u,f,d),i({safeGlobal:u,safeEval:f,safeEvalWhichTakesEndowments:m,safeFunction:d})}const H={initRootRealm:function(e,t,n){const{shims:r,transforms:a,sloppyGlobals:c}=n,i=E(e.allShims,r),s=function(e){const t=j();return t.eval(I),t.eval(k),G(t,e)}(i),u=function(e,t){const{unsafeEval:n}=e;return n(o)(e,t)}(s,H);s.sharedGlobalDescs.Realm={value:u,writable:!0,configurable:!0};const l=q(s,a,c),{safeEvalWhichTakesEndowments:f}=l;for(const e of i)f(e);Z(t,l)},initCompartment:function(e,t,n={}){const{transforms:r,sloppyGlobals:o}=n;Z(t,q(e,r,o))},getRealmGlobal:function(e){const{safeGlobal:t}=V(e);return t},realmEvaluate:function(e,t,n={},r={}){const{safeEvalWhichTakesEndowments:o}=V(e);return o(t,n,r)}};return r(function(){const e=(0,eval)(A);return _(),O(),G(e)}(),H)});