(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[183],{

/***/ 169:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GroupDBAccess", function() { return GroupDBAccess; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createUserGroupDatabase", function() { return createUserGroupDatabase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createOrUpdateUserGroupDatabase", function() { return createOrUpdateUserGroupDatabase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "deleteUserGroupDatabase", function() { return deleteUserGroupDatabase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "updateUserGroupDatabase", function() { return updateUserGroupDatabase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryUserGroupDatabase", function() { return queryUserGroupDatabase; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "queryUserGroupsDatabase", function() { return queryUserGroupsDatabase; });
/* harmony import */ var idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(179);
/* harmony import */ var idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _type__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);
/* harmony import */ var _utils_messages__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(55);
/* harmony import */ var _utils_type__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(180);
/* harmony import */ var _helpers_openDB__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(66);
/// <reference path="./global.d.ts" />





//#endregion
const db = Object(_helpers_openDB__WEBPACK_IMPORTED_MODULE_4__[/* createDBAccess */ "a"])(() => {
    return Object(idb_with_async_ittr_cjs__WEBPACK_IMPORTED_MODULE_0__["openDB"])('maskbook-user-groups', 1, {
        upgrade(db, oldVersion, newVersion, transaction) {
            // Out line keys
            db.createObjectStore('groups', { keyPath: 'identifier' });
            transaction.objectStore('groups').createIndex('network', 'network', { unique: false });
        },
    });
});
const GroupDBAccess = db;
/**
 * This function create a new user group
 * It will return a GroupIdentifier
 * @param group GroupIdentifier
 * @param groupName
 */
async function createUserGroupDatabase(group, groupName, t) {
    t = t || (await db()).transaction('groups', 'readwrite');
    await t.objectStore('groups').put({
        groupName,
        identifier: group.toText(),
        members: [],
        network: group.network,
    });
}
async function createOrUpdateUserGroupDatabase(group, type, t) {
    t = t || (await db()).transaction('groups', 'readwrite');
    if (await queryUserGroupDatabase(group.identifier, t))
        return updateUserGroupDatabase(group, type, t);
    else
        return createUserGroupDatabase(group.identifier, group.groupName, t);
}
/**
 * Delete a user group that stored in the Maskbook
 * @param group Group ID
 */
async function deleteUserGroupDatabase(group, t) {
    t = t || (await db()).transaction('groups', 'readwrite');
    await t.objectStore('groups').delete(group.toText());
}
/**
 * Update a user group that stored in the Maskbook
 * @param group Group ID
 * @param type
 */
async function updateUserGroupDatabase(group, type, t) {
    t = t || (await db()).transaction('groups', 'readwrite');
    const orig = await queryUserGroupDatabase(group.identifier, t);
    if (!orig)
        throw new TypeError('User group not found');
    let nextRecord;
    const nonDuplicateNewMembers = [];
    if (type === 'replace') {
        nextRecord = { ...orig, ...group };
    }
    else if (type === 'append') {
        const nextMembers = new Set();
        for (const i of orig.members) {
            nextMembers.add(i.toText());
        }
        for (const i of group.members || []) {
            if (!nextMembers.has(i.toText())) {
                nextMembers.add(i.toText());
                nonDuplicateNewMembers.push(i);
            }
        }
        nextRecord = {
            identifier: group.identifier,
            banned: !orig.banned && !group.banned ? undefined : [...(orig.banned || []), ...(group.banned || [])],
            groupName: group.groupName || orig.groupName,
            members: Array.from(nextMembers)
                .map((x) => _type__WEBPACK_IMPORTED_MODULE_1__["Identifier"].fromString(x, _type__WEBPACK_IMPORTED_MODULE_1__["ProfileIdentifier"]))
                .filter((x) => x.ok)
                .map((x) => x.val),
        };
    }
    else {
        nextRecord = type(orig) || orig;
    }
    await t.objectStore('groups').put(GroupRecordIntoDB(nextRecord));
    if ( true && nonDuplicateNewMembers.length) {
        _utils_messages__WEBPACK_IMPORTED_MODULE_2__[/* MaskMessage */ "a"].events.profileJoinedGroup.sendToAll({
            group: group.identifier,
            newMembers: nonDuplicateNewMembers,
        });
    }
}
/**
 * Query a user group that stored in the Maskbook
 * @param group Group ID
 */
async function queryUserGroupDatabase(group, t) {
    t = t || (await db()).transaction('groups', 'readonly');
    const result = await t.objectStore('groups').get(group.toText());
    if (!result)
        return null;
    return GroupRecordOutDB(result);
}
/**
 * Query user groups that stored in the Maskbook
 * @param query Query ID
 */
async function queryUserGroupsDatabase(query, t) {
    t = t || (await db()).transaction('groups');
    const result = [];
    if (typeof query === 'function') {
        for await (const { value, key } of t.store) {
            const identifier = _type__WEBPACK_IMPORTED_MODULE_1__["Identifier"].fromString(key, _type__WEBPACK_IMPORTED_MODULE_1__["GroupIdentifier"]);
            if (identifier.err) {
                console.warn('Invalid identifier', key);
                continue;
            }
            if (query(identifier.val, value))
                result.push(value);
        }
    }
    else {
        result.push(...(await t.objectStore('groups').index('network').getAll(IDBKeyRange.only(query.network))));
    }
    return result.map(GroupRecordOutDB);
}
function GroupRecordOutDB(x) {
    return {
        ...x,
        identifier: _type__WEBPACK_IMPORTED_MODULE_1__["Identifier"].fromString(x.identifier, _type__WEBPACK_IMPORTED_MODULE_1__["GroupIdentifier"]).unwrap(),
        members: Object(_utils_type__WEBPACK_IMPORTED_MODULE_3__[/* restorePrototypeArray */ "b"])(x.members, _type__WEBPACK_IMPORTED_MODULE_1__["ProfileIdentifier"].prototype),
        banned: Object(_utils_type__WEBPACK_IMPORTED_MODULE_3__[/* restorePrototypeArray */ "b"])(x.banned, _type__WEBPACK_IMPORTED_MODULE_1__["ProfileIdentifier"].prototype),
    };
}
function GroupRecordIntoDB(x) {
    return {
        ...x,
        identifier: x.identifier.toText(),
        network: x.identifier.network,
    };
}


/***/ }),

/***/ 180:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return restorePrototype; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return restorePrototypeArray; });
function restorePrototype(obj, prototype) {
    if (!obj)
        return obj;
    Object.setPrototypeOf(obj, prototype);
    return obj;
}
function restorePrototypeArray(obj, prototype) {
    if (!obj)
        return obj;
    obj.forEach((x) => Object.setPrototypeOf(x, prototype));
    return obj;
}


/***/ }),

/***/ 230:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return createFriendsGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return createDefaultFriendsGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return addProfileToFriendsGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return removeProfileFromFriendsGroup; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return queryUserGroups; });
/* harmony import */ var _group__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(169);
/* harmony import */ var _type__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);


function createFriendsGroup(who, groupId) {
    return Object(_group__WEBPACK_IMPORTED_MODULE_0__["createUserGroupDatabase"])(_type__WEBPACK_IMPORTED_MODULE_1__["GroupIdentifier"].getFriendsGroupIdentifier(who, groupId), 
    // Put the raw special name in, then UI can display in their own language.
    groupId);
}
function createDefaultFriendsGroup(who) {
    return createFriendsGroup(who, _type__WEBPACK_IMPORTED_MODULE_1__["PreDefinedVirtualGroupNames"].friends);
}
async function addProfileToFriendsGroup(group, newMembers) {
    const memberList = newMembers.map((x) => (x instanceof _type__WEBPACK_IMPORTED_MODULE_1__["ProfileIdentifier"] ? x : x.identifier));
    await Object(_group__WEBPACK_IMPORTED_MODULE_0__["updateUserGroupDatabase"])({ identifier: group, members: memberList }, 'append');
}
function removeProfileFromFriendsGroup(group, removedFriend) {
    const friendList = removedFriend.map((x) => (x instanceof _type__WEBPACK_IMPORTED_MODULE_1__["ProfileIdentifier"] ? x : x.identifier));
    return Object(_group__WEBPACK_IMPORTED_MODULE_0__["updateUserGroupDatabase"])({ identifier: group }, (r) => {
        r.members = r.members.filter((x) => !friendList.some((y) => y.equals(x)));
    });
}
function queryUserGroups(network) {
    return Object(_group__WEBPACK_IMPORTED_MODULE_0__["queryUserGroupsDatabase"])((r) => r.network === network);
}


/***/ }),

/***/ 453:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);
/* harmony import */ var _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(230);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "addProfileToFriendsGroup", function() { return _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__["a"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "createDefaultFriendsGroup", function() { return _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__["b"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "removeProfileFromFriendsGroup", function() { return _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__["e"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "createFriendsGroup", function() { return _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__["c"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "queryUserGroups", function() { return _database_helpers_group__WEBPACK_IMPORTED_MODULE_1__["d"]; });

/* harmony import */ var _database_group__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(169);
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "queryUserGroup", function() { return _database_group__WEBPACK_IMPORTED_MODULE_2__["queryUserGroupDatabase"]; });


Object(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* assertEnvironment */ "d"])(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* Environment */ "a"].ManifestBackground);




/***/ }),

/***/ 66:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return createDBAccess; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return createDBAccessWithAsyncUpgrade; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return createTransaction; });
/* harmony import */ var _dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);

function createDBAccess(opener) {
    let db = undefined;
    return async () => {
        Object(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* assertEnvironment */ "d"])(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* Environment */ "a"].ManifestBackground);
        if (db)
            return db;
        db = await opener();
        db.addEventListener('close', () => (db = undefined));
        db.addEventListener('error', () => (db = undefined));
        return db;
    };
}
function createDBAccessWithAsyncUpgrade(firstVersionThatRequiresAsyncUpgrade, latestVersion, opener, asyncUpgradePrepare) {
    let db = undefined;
    let pendingOpen = undefined;
    async function open() {
        Object(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* assertEnvironment */ "d"])(_dimensiondev_holoflows_kit__WEBPACK_IMPORTED_MODULE_0__[/* Environment */ "a"].ManifestBackground);
        if ((db === null || db === void 0 ? void 0 : db.version) === latestVersion)
            return db;
        let currentVersion = firstVersionThatRequiresAsyncUpgrade;
        let lastVersionData = undefined;
        while (currentVersion < latestVersion) {
            try {
                db = await opener(currentVersion, lastVersionData);
                // if the open success, the stored version is small or eq than currentTryOpenVersion
                // let's call the prepare function to do all the async jobs
                lastVersionData = await asyncUpgradePrepare(db);
            }
            catch (e) {
                if (currentVersion >= latestVersion)
                    throw e;
                // if the stored database version is bigger than the currentTryOpenVersion
                // It will fail and we just move to next version
            }
            currentVersion += 1;
            db === null || db === void 0 ? void 0 : db.close();
            db = undefined;
        }
        db = await opener(currentVersion, lastVersionData);
        db.addEventListener('close', (e) => (db = undefined));
        if (!db)
            throw new Error('Invalid state');
        return db;
    }
    return () => {
        // Share a Promise to prevent async upgrade for multiple times
        if (pendingOpen)
            return pendingOpen;
        const promise = (pendingOpen = open());
        promise.catch(() => (pendingOpen = undefined));
        return promise;
    };
}
function createTransaction(db, mode) {
    // It must be a high order function to infer the type of UsedStoreName correctly.
    return (...storeNames) => {
        return db.transaction(storeNames, mode);
    };
}


/***/ })

}]);