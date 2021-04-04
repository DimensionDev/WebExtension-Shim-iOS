(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[13],{

/***/ 1007:
/***/ (function(module, exports, __webpack_require__) {

/// <reference types="./full.d.ts" />
((r,t)=>{ true?t(exports):undefined})(this,(function(r){"use strict";class t extends Error{constructor(r,t,e,n){super(t),this.name=r,this.code=e,this.stack=n}}const e={Error,EvalError,RangeError,ReferenceError,SyntaxError,TypeError,URIError},n="DOMException:",o=(r="")=>r.replace(/^.+\n.+\n/,""),s=(()=>{try{return DOMException}catch(r){}})(),i=r=>"string"==typeof r,a=r=>"boolean"==typeof r,c=r=>"function"==typeof r,l=r=>"object"==typeof r&&null!==r,u="Error",f=void 0,d=Object.setPrototypeOf,y=r=>Promise.reject(r),p=r=>Promise.resolve(r),h=Array.isArray,m="2.0",g=(r,t,e,n)=>{r===f&&(r=null),Number.isNaN(t=Math.floor(t))&&(t=-1);const o={jsonrpc:m,id:r,error:{code:t,message:e,data:n}};return $(o.error,"data"),o},w=(r,t,e)=>{const{id:n}=r,{code:o,message:s,data:i}=e(t,r);return g(n,o,s,i)},b=(r="",t=-1)=>e=>{let o="";l(e)&&k(e,"message")&&i(e.message)&&(o=e.message);let f=S(u,((r=e.constructor)=>c(r)&&r.name));return s&&e instanceof s&&(f=n+e.name),(i(e)||"number"==typeof e||a(e)||"bigint"==typeof e)&&(f=u,o=e+""),{code:t,message:o,data:r?{stack:r,type:f}:{type:f}}},E=r=>{if(!l(r))return!1;if(!k(r,"jsonrpc"))return!1;if(r.jsonrpc!==m)return!1;if(k(r,"params")){const t=r.params;if(!h(t)&&!l(t))return!1}return!0},k=(r,t)=>t in r,S=(r,t)=>{let e=r;try{e=t()}catch(r){}return i(e)?e:r},$=(r,t)=>{r[t]===f&&delete r[t]},v={serialization:r=>r,deserialization:r=>r},P="AsyncCall/",j=Symbol.for(P+"ignored"),x=Symbol.for(P+"notify"),_=Symbol.for(P+"batch"),O=(r,t)=>r[t][x],M=()=>Math.random().toString(36).slice(2),N=r=>{if(!a(r)){const{methodNotFound:t,unknownMessage:e}=r;return[t,e]}return[r,r]};function z(r={},d){let S=f;r instanceof Promise?p(r).then((r=>S=r)):S=r;const{serializer:P=v,key:O="jsonrpc",strict:z=!0,log:A=!0,parameterStructures:C="by-position",preferLocalImplementation:R=!1,idGenerator:T=M,mapError:I,logger:W,channel:G}=d,[J,q]=N(z),[D,F,L,U,B,H]=(r=>{if("all"===r)return[!0,!0,!0,!0,!0,!0];if(!a(r)){const{beCalled:t,localError:e,remoteError:n,type:o,requestReplay:s,sendLocalStack:i}=r;return[t,e,n,"basic"!==o,s,i]}return r?[!0,!0,!0,!0]:[]})(A),{log:K,error:Q=K,debug:V=K,groupCollapsed:X=K,groupEnd:Y=K}=W||console,Z=new Map,rr=async r=>{let t;try{if(t=await nr(r),E(t))return await ir(t);if(h(t)&&t.every(E)&&0!==t.length){const r=await Promise.all(t.map(ir));if(t.every((r=>r===f)))return;return r.filter((r=>r))}if(q){let r=t.id;return r===f&&(r=null),(r=>g(r,-32600,"Invalid Request"))(r)}return f}catch(r){return F&&Q(r,t,void 0),((r,t)=>{const e=w({},r,t),n=e.error;return n.code=-32700,n.message="Parse error",e})(r,I||b(r&&r.stack))}},tr=async r=>{if(r){if(h(r)){const t=r.filter((r=>k(r,"id")));if(0===t.length)return;return er(t)}if(k(r,"id"))return er(r)}},er=r=>P.serialization(r),nr=r=>P.deserialization(r);var or;if(k(or=G,"setup")&&c(or.setup)&&G.setup((r=>rr(r).then(tr)),(r=>{const t=nr(r);return!!E(t)||p(t).then(E)})),(r=>k(r,"send")&&c(r.send))(G)){const r=G;r.on&&r.on((t=>rr(t).then(tr).then((t=>t&&r.send(t)))))}async function sr(r,t=!1){t&&(r=[...r]);const e=await er(r);return G.send(e)}const ir=a=>k(a,"method")?(async t=>{S||await r;let e="";try{const{params:r,method:n,id:s,remoteStack:i}=t,a=n.startsWith("rpc.")?Symbol.for(n):n,l=S[a];if(!c(l))return J?g(s,-32601,"Method not found"):void(F&&V("Missing method",a,t));const u=h(r)?r:[r];e=o(Error().stack);const f=new Promise((r=>r(l.apply(S,u))));if(D)if(U){const r=[`${O}.%c${n}%c(${u.map((()=>"%o")).join(", ")}%c)\n%o %c@${s}`,"color: #d2c057","",...u,"",f,"color: gray; font-style: italic;"];B&&r.push((()=>{debugger;return l.apply(S,u)})),i?(X(...r),K(i),Y()):K(...r)}else K(`${O}.${n}(${""+[...u]}) @${s}`);if(await f===j)return;return((r,t)=>{const e={jsonrpc:m,id:r,result:t};return $(e,"id"),e})(s,await f)}catch(r){return l(r)&&k(r,"stack")&&(r.stack=e.split("\n").reduce(((r,t)=>r.replace(t+"\n","")),""+r.stack||"")),F&&Q(r),w(t,r,I||b(H?r.stack:f))}})(a):(async r=>{let o="",a="",c=0,d=u;if(k(r,"error")){const t=r.error;o=t.message,c=t.code;const e=t.data;a=l(e)&&k(e,"stack")&&i(e.stack)?e.stack:"<remote stack not available>",d=l(e)&&k(e,"type")&&i(e.type)?e.type:u,L&&(U?Q(`${d}: ${o}(${c}) %c@${r.id}\n%c${a}`,"color: gray",""):Q(`${d}: ${o}(${c}) @${r.id}\n${a}`))}if(null===r.id||r.id===f)return;const{f:[y,p],stack:h}=Z.get(r.id)||{stack:"",f:[null,null]};y&&(Z.delete(r.id),k(r,"error")?p(((r,o,i,a)=>{try{if(r.startsWith(n)&&s){const[,t]=r.split(n);return new s(o,t)}if(r in e){const t=new e[r](o);return t.stack=a,t.code=i,t}return new t(r,o,i,a)}catch(t){return Error(`E${i} ${r}: ${o}\n${a}`)}})(d,o,c,a+"\n    аt AsyncCall (rpc) \n"+h)):y(r.result))})(a);return new Proxy({__proto__:null},{get(r,t){if(i(t)&&r[t])return r[t];const e=r=>(...e)=>{let n=o(Error().stack),s=f;if(t===_&&(s=e.shift(),t=e.shift()),"symbol"==typeof t){const r=Symbol.keyFor(t)||t.description;if(r){if(!r.startsWith("rpc."))return y("Not start with rpc.");t=r}}else if(t.startsWith("rpc."))return y(new TypeError("No direct call to internal methods"));if(R&&S&&i(t)){const r=S[t];if(r&&c(r))return new Promise((t=>t(r(...e))))}return new Promise(((o,i)=>{const a=T(),[c]=e,u=H?n:"",d="by-name"===C&&1===e.length&&l(c)?c:e,y=((r,t,e,n)=>{const o={jsonrpc:m,id:r,method:t,params:e,remoteStack:n};return $(o,"id"),((r,t)=>{r[t]||delete r[t]})(o,"remoteStack"),o})(r?f:a,t,d,u);if(s?(s.push(y),s.r||(s.r=[()=>sr(s,!0),r=>((r,t)=>{for(const e of r)if(k(e,"id")){const r=Z.get(e.id);r&&r.f[1](t)}})(s,r)])):sr(y).catch(i),r)return o();Z.set(a,{f:[o,i],stack:n})}))},n=e(!1);return n[x]=e(!0),n[x][x]=n[x],i(t)&&Object.defineProperty(r,t,{value:n,configurable:!0}),n}})}const A="rpc.async-iterator.",C=Symbol.for(A+"start"),R=Symbol.for(A+"next"),T=Symbol.for(A+"return"),I=Symbol.for(A+"throw");class W{constructor(r,t){this.r=r,this.i=t,this.d=!1,this.c=async r=>(await J(r,(()=>this.d=!0)),r)}async return(r){return this.d||this.c(this.r[T](await this.i,r)).catch((()=>{})),this.d=!0,q(!0,r)}async next(r){return this.d?q(!0):await this.c(this.r[R](await this.i,r))}async throw(r){if(!this.d)return await this.c(this.r[I](await this.i,r));throw r}}d(W,async function*(){}.constructor.prototype);const G=Object.getPrototypeOf(async function*(){}());d(W.prototype,G);const J=async(r,t)=>{try{const e=await r;e&&e.done&&t()}catch(r){}},q=(r,t)=>({done:r,value:t});r.AsyncCall=z,r.AsyncGeneratorCall=(r={},t)=>{var e;const n=new Map,[o]=N(null===(e=t.strict)||void 0===e||e),{idGenerator:s=M}=t,a=(r,t)=>{const e=n.get(r);if(!e){if(o)throw Error("Missing iter "+r);return j}const s=t(e);return J(s,(()=>n.delete(r))),s},l=z({async[C](t,e){const i=(await r)[t];if(!c(i)){if(o)throw Error(t+" is not a function");return j}const a=i(...e),l=s();return n.set(l,a),p(l)},[R]:(r,t)=>a(r,(r=>r.next(t))),[T]:(r,t)=>a(r,(r=>c(r.return)&&r.return(t))),[I]:(r,t)=>a(r,(r=>c(r.throw)&&r.throw(t)))},t);return new Proxy({__proto__:null},{get:(r,t)=>{if(!i(t))throw new TypeError("Can't call with non-string");if(r[t])return r[t];const e=(...r)=>{const e=l[C](t,r);return new W(l,e)};return Object.defineProperty(r,t,{value:e,configurable:!0}),e}})},r.JSONSerialization=(r=[f,f],t,e="null")=>({serialization(n){if(e&&l(n)&&k(n,"result")&&n.result===f){const r={...n};r.result=null,"keep"===e&&(r.undef=!0),n=r}return JSON.stringify(n,r[0],t)},deserialization(t){const e=JSON.parse(t,r[1]);return l(e)&&k(e,"result")&&null===e.result&&k(e,"undef")&&!0===e.undef&&(e.result=f,delete e.undef),e}}),r.NoSerialization=v,r.batch=r=>{let t=[];return[new Proxy({__proto__:null},{get(e,n){if(i(n)&&e[n])return e[n];const o=(...e)=>r[_](t,n,...e);return(o[x]=(...e)=>r[_][x](t,n,...e))[x]=o[x],i(n)&&Object.defineProperty(e,n,{value:o,configurable:!0}),o}}),(r=t.r)=>r&&r[0](),(r=Error("Aborted"),e=t.r)=>{e&&e[1](r),t=[]}]},r.notify=r=>c(r)?r[x]:new Proxy(r,{get:O}),Object.defineProperty(r,"__esModule",{value:!0})}));


/***/ }),

/***/ 192:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(1007)


/***/ }),

/***/ 475:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return WorkerChannel; });
class WorkerChannel {
    /**
     * @param worker Pass the Worker in the main thread.
     */
    constructor(worker = self) {
        this.worker = worker;
    }
    on(listener) {
        const f = (ev) => listener(ev.data);
        this.worker.addEventListener('message', f);
        return () => this.worker.removeEventListener('message', f);
    }
    send(data) {
        this.worker.postMessage(data);
    }
}


/***/ })

}]);