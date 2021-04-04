(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[188],{

/***/ 1579:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "fetchMetadata", function() { return /* binding */ fetchMetadata; });

// EXTERNAL MODULE: ./node_modules/ts-results/esm/index.js
var esm = __webpack_require__(70);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Gitcoin/types.tsx
var GitcoinGrantFailedReason;
(function (GitcoinGrantFailedReason) {
    GitcoinGrantFailedReason[GitcoinGrantFailedReason["InvalidURL"] = 0] = "InvalidURL";
    GitcoinGrantFailedReason[GitcoinGrantFailedReason["FetchFailed"] = 1] = "FetchFailed";
})(GitcoinGrantFailedReason || (GitcoinGrantFailedReason = {}));

// EXTERNAL MODULE: ./node_modules/bignumber.js/bignumber.js
var bignumber = __webpack_require__(27);
var bignumber_default = /*#__PURE__*/__webpack_require__.n(bignumber);

// CONCATENATED MODULE: ./packages/maskbook/src/plugins/Gitcoin/service.ts



const domain = 'https://gitcoin.co/';
async function fetchMetadata(url) {
    var _a, _b;
    if (!url.startsWith(domain))
        return Object(esm["a" /* Err */])([GitcoinGrantFailedReason.InvalidURL]);
    const id = (_a = url.match(/\d+/)) === null || _a === void 0 ? void 0 : _a[0];
    if (!id)
        return Object(esm["a" /* Err */])([GitcoinGrantFailedReason.InvalidURL]);
    const data = await fetchData(id);
    if (data.err)
        return data.mapErr((e) => [GitcoinGrantFailedReason.FetchFailed, e]);
    const { val } = data;
    const { title, slug, description, logo: image, admin_address: address } = val.grant;
    const { transactions = [] } = (_b = val.report.grantee.find((x) => x.grant_name === val.grant.title)) !== null && _b !== void 0 ? _b : {};
    const estimatedAmount = transactions.reduce((accumulate, tx) => { var _a; return accumulate.plus(new bignumber_default.a((_a = tx.usd_value) !== null && _a !== void 0 ? _a : 0)); }, new bignumber_default.a(0));
    const daiAmount = transactions.reduce((accumulate, tx) => accumulate.plus(tx.asset === 'DAI' ? tx.amount : 0), new bignumber_default.a(0));
    return Object(esm["b" /* Ok */])({
        estimatedAmount,
        daiAmount,
        transactions: transactions.length,
        description,
        image,
        title,
        address,
        permalink: `${domain}grants/${id}/${slug}`,
    });
}
async function fetchData(id) {
    const fetchGrant = (id) => fetch(`https://gitcoin.provide.maskbook.com/api/v0.1/grants/${id}/`).then((x) => x.json());
    const fetchGrantReport = (address) => fetch(`https://gitcoin.provide.maskbook.com/api/v0.1/grants/report/?eth_address=${address}`).then((x) => x.json());
    try {
        const grant = await fetchGrant(id);
        if (!grant.admin_address)
            return Object(esm["a" /* Err */])(new Error('cannot find the admin address'));
        const report = await fetchGrantReport(grant.admin_address);
        return Object(esm["b" /* Ok */])({
            grant,
            report,
        });
    }
    catch (e) {
        return Object(esm["a" /* Err */])(e);
    }
}


/***/ })

}]);