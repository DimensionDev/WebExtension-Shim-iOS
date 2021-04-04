(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[187],{

/***/ 1577:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "mintElectionPacket", function() { return mintElectionPacket; });
/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1814);
/* harmony import */ var jsonwebtoken__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var web3_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(237);
/* harmony import */ var web3_utils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(web3_utils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _extension_service__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(18);
/* harmony import */ var _web3_pipes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(84);
/* harmony import */ var _pipes__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(165);





async function mintElectionPacket(from, stateType, candidateType) {
    const host = 'https://redpacket.gives';
    const x = 'a3323cd1-fa42-44cd-b053-e474365ab3da';
    const chainId = await _extension_service__WEBPACK_IMPORTED_MODULE_2__[/* default */ "b"].Ethereum.getChainId(from);
    const network = Object(_web3_pipes__WEBPACK_IMPORTED_MODULE_3__[/* resolveChainName */ "c"])(chainId).toLowerCase();
    // skip hi
    const auth = await fetch(`${host}/hi?id=${from}&network=${network}`);
    if (!auth.ok)
        throw new Error('Auth failed');
    const verify = await auth.text();
    const jwt_encoded = {
        state: Object(_pipes__WEBPACK_IMPORTED_MODULE_4__[/* resolveStateType */ "e"])(stateType),
        winner: Object(_pipes__WEBPACK_IMPORTED_MODULE_4__[/* resolveCandiateType */ "a"])(candidateType),
        recipient: from,
        validation: Object(web3_utils__WEBPACK_IMPORTED_MODULE_1__["sha3"])(from),
        signature: await _extension_service__WEBPACK_IMPORTED_MODULE_2__[/* default */ "b"].Ethereum.sign(verify, from, chainId),
    };
    const mintResponse = await fetch(`${host}/mrpresident?payload=${jsonwebtoken__WEBPACK_IMPORTED_MODULE_0__["sign"](jwt_encoded, x, { algorithm: 'HS256' })}&network=${network}`);
    if (!mintResponse.ok)
        throw new Error('Claim failed');
    return { mint_transaction_hash: await mintResponse.text() };
}


/***/ })

}]);