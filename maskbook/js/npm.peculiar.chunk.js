(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[171],{

/***/ 17:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* reexport */ converters["a" /* AsnIntegerConverter */]; });
__webpack_require__.d(__webpack_exports__, "c", function() { return /* reexport */ AsnProp; });
__webpack_require__.d(__webpack_exports__, "f", function() { return /* reexport */ AsnType; });
__webpack_require__.d(__webpack_exports__, "g", function() { return /* reexport */ enums["b" /* AsnTypeTypes */]; });
__webpack_require__.d(__webpack_exports__, "d", function() { return /* reexport */ enums["a" /* AsnPropTypes */]; });
__webpack_require__.d(__webpack_exports__, "b", function() { return /* reexport */ parser["a" /* AsnParser */]; });
__webpack_require__.d(__webpack_exports__, "e", function() { return /* reexport */ serializer_AsnSerializer; });

// UNUSED EXPORTS: AsnAnyConverter, AsnEnumeratedConverter, AsnIntegerArrayBufferConverter, AsnBitStringConverter, AsnObjectIdentifierConverter, AsnBooleanConverter, AsnOctetStringConverter, AsnUtf8StringConverter, AsnBmpStringConverter, AsnUniversalStringConverter, AsnNumericStringConverter, AsnPrintableStringConverter, AsnTeletexStringConverter, AsnVideotexStringConverter, AsnIA5StringConverter, AsnGraphicStringConverter, AsnVisibleStringConverter, AsnGeneralStringConverter, AsnCharacterStringConverter, AsnUTCTimeConverter, AsnGeneralizedTimeConverter, AsnNullConverter, defaultConverter, BitString, OctetString, AsnSchemaValidationError, AsnArray, AsnConvert

// EXTERNAL MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/converters.js
var converters = __webpack_require__(278);

// EXTERNAL MODULE: ./node_modules/asn1js/build/asn1.js
var asn1 = __webpack_require__(36);

// EXTERNAL MODULE: ./node_modules/pvtsutils/build/index.js
var build = __webpack_require__(41);

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/types/bit_string.js


class bit_string_BitString {
    constructor(params, unusedBits = 0) {
        this.unusedBits = 0;
        this.value = new ArrayBuffer(0);
        if (params) {
            if (typeof params === "number") {
                this.fromNumber(params);
            }
            else if (build["BufferSourceConverter"].isBufferSource(params)) {
                this.unusedBits = unusedBits;
                this.value = build["BufferSourceConverter"].toArrayBuffer(params);
            }
            else {
                throw TypeError("Unsupported type of 'params' argument for BitString");
            }
        }
    }
    fromASN(asn) {
        if (!(asn instanceof asn1["BitString"])) {
            throw new TypeError("Argument 'asn' is not instance of ASN.1 BitString");
        }
        this.unusedBits = asn.valueBlock.unusedBits;
        this.value = asn.valueBlock.valueHex;
        return this;
    }
    toASN() {
        return new asn1["BitString"]({ unusedBits: this.unusedBits, valueHex: this.value });
    }
    toSchema(name) {
        return new asn1["BitString"]({ name });
    }
    toNumber() {
        let res = "";
        const uintArray = new Uint8Array(this.value);
        for (const octet of uintArray) {
            res += octet.toString(2).padStart(8, "0");
        }
        res = res.split("").reverse().join("");
        if (this.unusedBits) {
            res = res.slice(this.unusedBits).padStart(this.unusedBits, "0");
        }
        return parseInt(res, 2);
    }
    fromNumber(value) {
        let bits = value.toString(2);
        const octetSize = (bits.length + 7) >> 3;
        this.unusedBits = (octetSize << 3) - bits.length;
        const octets = new Uint8Array(octetSize);
        bits = bits.padStart(octetSize << 3, "0").split("").reverse().join("");
        let index = 0;
        while (index < octetSize) {
            octets[index] = parseInt(bits.slice(index << 3, (index << 3) + 8), 2);
            index++;
        }
        this.value = octets.buffer;
    }
}

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/types/octet_string.js


class octet_string_OctetString extends ArrayBuffer {
    constructor(param) {
        if (typeof param === "number") {
            super(param);
        }
        else {
            if (build["BufferSourceConverter"].isBufferSource(param)) {
                super(param.byteLength);
                const view = new Uint8Array(this);
                view.set(build["BufferSourceConverter"].toUint8Array(param));
            }
            else if (Array.isArray(param)) {
                var array = new Uint8Array(param);
                super(array.length);
                var view = new Uint8Array(this);
                view.set(array);
            }
            else {
                super(0);
            }
        }
    }
    fromASN(asn) {
        if (!(asn instanceof asn1["OctetString"])) {
            throw new TypeError("Argument 'asn' is not instance of ASN.1 OctetString");
        }
        return new octet_string_OctetString(asn.valueBlock.valueHex);
    }
    toASN() {
        return new asn1["OctetString"]({ valueHex: this });
    }
    toSchema(name) {
        return new asn1["OctetString"]({ name });
    }
}

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/types/index.js



// EXTERNAL MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/storage.js + 1 modules
var storage = __webpack_require__(176);

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/decorators.js


const AsnType = (options) => (target) => {
    let schema;
    if (!storage["a" /* schemaStorage */].has(target)) {
        schema = storage["a" /* schemaStorage */].createDefault(target);
        storage["a" /* schemaStorage */].set(target, schema);
    }
    else {
        schema = storage["a" /* schemaStorage */].get(target);
    }
    Object.assign(schema, options);
};
const AsnProp = (options) => (target, propertyKey) => {
    let schema;
    if (!storage["a" /* schemaStorage */].has(target.constructor)) {
        schema = storage["a" /* schemaStorage */].createDefault(target.constructor);
        storage["a" /* schemaStorage */].set(target.constructor, schema);
    }
    else {
        schema = storage["a" /* schemaStorage */].get(target.constructor);
    }
    const copyOptions = Object.assign({}, options);
    if (typeof copyOptions.type === "number" && !copyOptions.converter) {
        const defaultConverter = converters["b" /* defaultConverter */](options.type);
        if (!defaultConverter) {
            throw new Error(`Cannot get default converter for property '${propertyKey}' of ${target.constructor.name}`);
        }
        copyOptions.converter = defaultConverter;
    }
    schema.items[propertyKey] = copyOptions;
};

// EXTERNAL MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/enums.js
var enums = __webpack_require__(79);

// EXTERNAL MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/parser.js
var parser = __webpack_require__(489);

// EXTERNAL MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/helper.js
var helper = __webpack_require__(201);

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/serializer.js





class serializer_AsnSerializer {
    static serialize(obj) {
        if (obj instanceof asn1["BaseBlock"]) {
            return obj.toBER(false);
        }
        return this.toASN(obj).toBER(false);
    }
    static toASN(obj) {
        if (obj && Object(helper["b" /* isConvertible */])(obj.constructor)) {
            return obj.toASN();
        }
        const target = obj.constructor;
        const schema = storage["a" /* schemaStorage */].get(target);
        storage["a" /* schemaStorage */].cache(target);
        let asn1Value = [];
        if (schema.itemType) {
            if (typeof schema.itemType === "number") {
                const converter = converters["b" /* defaultConverter */](schema.itemType);
                if (!converter) {
                    throw new Error(`Cannot get default converter for array item of ${target.name} ASN1 schema`);
                }
                asn1Value = obj.map((o) => converter.toASN(o));
            }
            else {
                asn1Value = obj.map((o) => this.toAsnItem({ type: schema.itemType }, "[]", target, o));
            }
        }
        else {
            for (const key in schema.items) {
                const schemaItem = schema.items[key];
                const objProp = obj[key];
                if (objProp === undefined
                    || schemaItem.defaultValue === objProp
                    || (typeof schemaItem.defaultValue === "object" && typeof objProp === "object"
                        && Object(helper["a" /* isArrayEqual */])(this.serialize(schemaItem.defaultValue), this.serialize(objProp)))) {
                    continue;
                }
                let asn1Item = serializer_AsnSerializer.toAsnItem(schemaItem, key, target, objProp);
                if (typeof schemaItem.context === "number") {
                    if (schemaItem.implicit) {
                        if (!schemaItem.repeated
                            && (typeof schemaItem.type === "number" || Object(helper["b" /* isConvertible */])(schemaItem.type))) {
                            const value = {};
                            value.valueHex = asn1Item.valueBlock.toBER();
                            asn1Value.push(new asn1["Primitive"](Object.assign({ optional: schemaItem.optional, idBlock: {
                                    tagClass: 3,
                                    tagNumber: schemaItem.context,
                                } }, value)));
                        }
                        else {
                            asn1Value.push(new asn1["Constructed"]({
                                optional: schemaItem.optional,
                                idBlock: {
                                    tagClass: 3,
                                    tagNumber: schemaItem.context,
                                },
                                value: asn1Item.valueBlock.value,
                            }));
                        }
                    }
                    else {
                        asn1Value.push(new asn1["Constructed"]({
                            optional: schemaItem.optional,
                            idBlock: {
                                tagClass: 3,
                                tagNumber: schemaItem.context,
                            },
                            value: [asn1Item],
                        }));
                    }
                }
                else if (schemaItem.repeated) {
                    asn1Value = asn1Value.concat(asn1Item);
                }
                else {
                    asn1Value.push(asn1Item);
                }
            }
        }
        let asnSchema;
        switch (schema.type) {
            case enums["b" /* AsnTypeTypes */].Sequence:
                asnSchema = new asn1["Sequence"]({ value: asn1Value });
                break;
            case enums["b" /* AsnTypeTypes */].Set:
                asnSchema = new asn1["Set"]({ value: asn1Value });
                break;
            case enums["b" /* AsnTypeTypes */].Choice:
                if (!asn1Value[0]) {
                    throw new Error(`Schema '${target.name}' has wrong data. Choice cannot be empty.`);
                }
                asnSchema = asn1Value[0];
                break;
        }
        return asnSchema;
    }
    static toAsnItem(schemaItem, key, target, objProp) {
        let asn1Item;
        if (typeof (schemaItem.type) === "number") {
            const converter = schemaItem.converter;
            if (!converter) {
                throw new Error(`Property '${key}' doesn't have converter for type ${enums["a" /* AsnPropTypes */][schemaItem.type]} in schema '${target.name}'`);
            }
            if (schemaItem.repeated) {
                const items = Array.from(objProp, (element) => converter.toASN(element));
                const Container = schemaItem.repeated === "sequence"
                    ? asn1["Sequence"]
                    : asn1["Set"];
                asn1Item = new Container({
                    value: items,
                });
            }
            else {
                asn1Item = converter.toASN(objProp);
            }
        }
        else {
            if (schemaItem.repeated) {
                const items = Array.from(objProp, (element) => this.toASN(element));
                const Container = schemaItem.repeated === "sequence"
                    ? asn1["Sequence"]
                    : asn1["Set"];
                asn1Item = new Container({
                    value: items,
                });
            }
            else {
                asn1Item = this.toASN(objProp);
            }
        }
        return asn1Item;
    }
}

// EXTERNAL MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/errors/index.js + 1 modules
var errors = __webpack_require__(423);

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/objects.js
class AsnArray extends Array {
    constructor(items = []) {
        if (typeof items === "number") {
            super(items);
        }
        else {
            super();
            for (const item of items) {
                this.push(item);
            }
        }
    }
}

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/convert.js


class convert_AsnConvert {
    static serialize(obj) {
        return serializer_AsnSerializer.serialize(obj);
    }
    static parse(data, target) {
        return parser["a" /* AsnParser */].parse(data, target);
    }
}

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/index.js











/***/ }),

/***/ 176:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* binding */ schemaStorage; });

// EXTERNAL MODULE: ./node_modules/asn1js/build/asn1.js
var asn1 = __webpack_require__(36);

// EXTERNAL MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/enums.js
var enums = __webpack_require__(79);

// EXTERNAL MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/helper.js
var helper = __webpack_require__(201);

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/schema.js



class schema_AsnSchemaStorage {
    constructor() {
        this.items = new WeakMap();
    }
    has(target) {
        return this.items.has(target);
    }
    get(target) {
        var _a, _b, _c, _d;
        const schema = this.items.get(target);
        if (!schema) {
            throw new Error(`Cannot get schema for '${(_d = (_c = (_b = (_a = target) === null || _a === void 0 ? void 0 : _a.prototype) === null || _b === void 0 ? void 0 : _b.constructor) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : target}' target`);
        }
        return schema;
    }
    cache(target) {
        const schema = this.get(target);
        if (!schema.schema) {
            schema.schema = this.create(target, true);
        }
    }
    createDefault(target) {
        const schema = {
            type: enums["b" /* AsnTypeTypes */].Sequence,
            items: {},
        };
        const parentSchema = this.findParentSchema(target);
        if (parentSchema) {
            Object.assign(schema, parentSchema);
            schema.items = Object.assign({}, schema.items, parentSchema.items);
        }
        return schema;
    }
    create(target, useNames) {
        const schema = this.items.get(target) || this.createDefault(target);
        const asn1Value = [];
        for (const key in schema.items) {
            const item = schema.items[key];
            const name = useNames ? key : "";
            let asn1Item;
            if (typeof (item.type) === "number") {
                const Asn1TypeName = enums["a" /* AsnPropTypes */][item.type];
                const Asn1Type = asn1[Asn1TypeName];
                if (!Asn1Type) {
                    throw new Error(`Cannot get ASN1 class by name '${Asn1TypeName}'`);
                }
                asn1Item = new Asn1Type({ name });
            }
            else if (Object(helper["b" /* isConvertible */])(item.type)) {
                const instance = new item.type();
                asn1Item = instance.toSchema(name);
            }
            else {
                asn1Item = new asn1["Any"]({ name });
            }
            const optional = !!item.optional || item.defaultValue !== undefined;
            if (item.repeated) {
                asn1Item.name = "";
                const Container = item.repeated === "set"
                    ? asn1["Set"]
                    : asn1["Sequence"];
                asn1Item = new Container({
                    name: "",
                    value: [
                        new asn1["Repeated"]({
                            name,
                            value: asn1Item,
                        }),
                    ],
                });
            }
            if (item.context !== null && item.context !== undefined) {
                if (item.implicit) {
                    if (typeof item.type === "number" || Object(helper["b" /* isConvertible */])(item.type)) {
                        const Container = item.repeated
                            ? asn1["Constructed"]
                            : asn1["Primitive"];
                        asn1Value.push(new Container({
                            name,
                            optional,
                            idBlock: {
                                tagClass: 3,
                                tagNumber: item.context,
                            },
                        }));
                    }
                    else {
                        this.cache(item.type);
                        const isRepeated = !!item.repeated;
                        let value = !isRepeated
                            ? this.get(item.type).schema
                            : asn1Item;
                        value = value.valueBlock ? value.valueBlock.value : value.value;
                        asn1Value.push(new asn1["Constructed"]({
                            name: !isRepeated ? name : "",
                            optional,
                            idBlock: {
                                tagClass: 3,
                                tagNumber: item.context,
                            },
                            value,
                        }));
                    }
                }
                else {
                    asn1Value.push(new asn1["Constructed"]({
                        optional,
                        idBlock: {
                            tagClass: 3,
                            tagNumber: item.context,
                        },
                        value: [asn1Item],
                    }));
                }
            }
            else {
                asn1Item.optional = optional;
                asn1Value.push(asn1Item);
            }
        }
        switch (schema.type) {
            case enums["b" /* AsnTypeTypes */].Sequence:
                return new asn1["Sequence"]({ value: asn1Value, name: "" });
            case enums["b" /* AsnTypeTypes */].Set:
                return new asn1["Set"]({ value: asn1Value, name: "" });
            case enums["b" /* AsnTypeTypes */].Choice:
                return new asn1["Choice"]({ value: asn1Value, name: "" });
            default:
                throw new Error(`Unsupported ASN1 type in use`);
        }
    }
    set(target, schema) {
        this.items.set(target, schema);
        return this;
    }
    findParentSchema(target) {
        const parent = target.__proto__;
        if (parent) {
            const schema = this.items.get(parent);
            return schema || this.findParentSchema(parent);
        }
        return null;
    }
}

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/storage.js

const schemaStorage = new schema_AsnSchemaStorage();


/***/ }),

/***/ 201:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return isConvertible; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return isTypeOfArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return isArrayEqual; });
function isConvertible(target) {
    if (target && target.prototype) {
        if (target.prototype.toASN && target.prototype.fromASN) {
            return true;
        }
        else {
            return isConvertible(target.prototype);
        }
    }
    else {
        return !!(target && target.toASN && target.fromASN);
    }
}
function isTypeOfArray(target) {
    var _a;
    if (target) {
        const proto = Object.getPrototypeOf(target);
        if (((_a = proto === null || proto === void 0 ? void 0 : proto.prototype) === null || _a === void 0 ? void 0 : _a.constructor) === Array) {
            return true;
        }
        return isTypeOfArray(proto);
    }
    return false;
}
function isArrayEqual(bytes1, bytes2) {
    if (!(bytes1 && bytes2)) {
        return false;
    }
    if (bytes1.byteLength !== bytes2.byteLength) {
        return false;
    }
    const b1 = new Uint8Array(bytes1);
    const b2 = new Uint8Array(bytes2);
    for (let i = 0; i < bytes1.byteLength; i++) {
        if (b1[i] !== b2[i]) {
            return false;
        }
    }
    return true;
}


/***/ }),

/***/ 278:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export AsnAnyConverter */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AsnIntegerConverter; });
/* unused harmony export AsnEnumeratedConverter */
/* unused harmony export AsnIntegerArrayBufferConverter */
/* unused harmony export AsnBitStringConverter */
/* unused harmony export AsnObjectIdentifierConverter */
/* unused harmony export AsnBooleanConverter */
/* unused harmony export AsnOctetStringConverter */
/* unused harmony export AsnUtf8StringConverter */
/* unused harmony export AsnBmpStringConverter */
/* unused harmony export AsnUniversalStringConverter */
/* unused harmony export AsnNumericStringConverter */
/* unused harmony export AsnPrintableStringConverter */
/* unused harmony export AsnTeletexStringConverter */
/* unused harmony export AsnVideotexStringConverter */
/* unused harmony export AsnIA5StringConverter */
/* unused harmony export AsnGraphicStringConverter */
/* unused harmony export AsnVisibleStringConverter */
/* unused harmony export AsnGeneralStringConverter */
/* unused harmony export AsnCharacterStringConverter */
/* unused harmony export AsnUTCTimeConverter */
/* unused harmony export AsnGeneralizedTimeConverter */
/* unused harmony export AsnNullConverter */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return defaultConverter; });
/* harmony import */ var asn1js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(36);
/* harmony import */ var asn1js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(asn1js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _enums__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79);


const AsnAnyConverter = {
    fromASN: (value) => value instanceof asn1js__WEBPACK_IMPORTED_MODULE_0__["Null"] ? null : value.valueBeforeDecode,
    toASN: (value) => {
        if (value === null) {
            return new asn1js__WEBPACK_IMPORTED_MODULE_0__["Null"]();
        }
        const schema = asn1js__WEBPACK_IMPORTED_MODULE_0__["fromBER"](value);
        if (schema.result.error) {
            throw new Error(schema.result.error);
        }
        return schema.result;
    },
};
const AsnIntegerConverter = {
    fromASN: (value) => value.valueBlock.valueHex.byteLength > 4
        ? value.valueBlock.toString()
        : value.valueBlock.valueDec,
    toASN: (value) => new asn1js__WEBPACK_IMPORTED_MODULE_0__["Integer"]({ value: value }),
};
const AsnEnumeratedConverter = {
    fromASN: (value) => value.valueBlock.valueDec,
    toASN: (value) => new asn1js__WEBPACK_IMPORTED_MODULE_0__["Enumerated"]({ value }),
};
const AsnIntegerArrayBufferConverter = {
    fromASN: (value) => value.valueBlock.valueHex,
    toASN: (value) => new asn1js__WEBPACK_IMPORTED_MODULE_0__["Integer"]({ valueHex: value }),
};
const AsnBitStringConverter = {
    fromASN: (value) => value.valueBlock.valueHex,
    toASN: (value) => new asn1js__WEBPACK_IMPORTED_MODULE_0__["BitString"]({ valueHex: value }),
};
const AsnObjectIdentifierConverter = {
    fromASN: (value) => value.valueBlock.toString(),
    toASN: (value) => new asn1js__WEBPACK_IMPORTED_MODULE_0__["ObjectIdentifier"]({ value }),
};
const AsnBooleanConverter = {
    fromASN: (value) => value.valueBlock.value,
    toASN: (value) => new asn1js__WEBPACK_IMPORTED_MODULE_0__["Boolean"]({ value }),
};
const AsnOctetStringConverter = {
    fromASN: (value) => value.valueBlock.valueHex,
    toASN: (value) => new asn1js__WEBPACK_IMPORTED_MODULE_0__["OctetString"]({ valueHex: value }),
};
function createStringConverter(Asn1Type) {
    return {
        fromASN: (value) => value.valueBlock.value,
        toASN: (value) => new Asn1Type({ value }),
    };
}
const AsnUtf8StringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["Utf8String"]);
const AsnBmpStringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["BmpString"]);
const AsnUniversalStringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["UniversalString"]);
const AsnNumericStringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["NumericString"]);
const AsnPrintableStringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["PrintableString"]);
const AsnTeletexStringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["TeletexString"]);
const AsnVideotexStringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["VideotexString"]);
const AsnIA5StringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["IA5String"]);
const AsnGraphicStringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["GraphicString"]);
const AsnVisibleStringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["VisibleString"]);
const AsnGeneralStringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["GeneralString"]);
const AsnCharacterStringConverter = createStringConverter(asn1js__WEBPACK_IMPORTED_MODULE_0__["CharacterString"]);
const AsnUTCTimeConverter = {
    fromASN: (value) => value.toDate(),
    toASN: (value) => new asn1js__WEBPACK_IMPORTED_MODULE_0__["UTCTime"]({ valueDate: value }),
};
const AsnGeneralizedTimeConverter = {
    fromASN: (value) => value.toDate(),
    toASN: (value) => new asn1js__WEBPACK_IMPORTED_MODULE_0__["GeneralizedTime"]({ valueDate: value }),
};
const AsnNullConverter = {
    fromASN: (value) => null,
    toASN: (value) => {
        return new asn1js__WEBPACK_IMPORTED_MODULE_0__["Null"]();
    },
};
function defaultConverter(type) {
    switch (type) {
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].Any:
            return AsnAnyConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].BitString:
            return AsnBitStringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].BmpString:
            return AsnBmpStringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].Boolean:
            return AsnBooleanConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].CharacterString:
            return AsnCharacterStringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].Enumerated:
            return AsnEnumeratedConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].GeneralString:
            return AsnGeneralStringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].GeneralizedTime:
            return AsnGeneralizedTimeConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].GraphicString:
            return AsnGraphicStringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].IA5String:
            return AsnIA5StringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].Integer:
            return AsnIntegerConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].Null:
            return AsnNullConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].NumericString:
            return AsnNumericStringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].ObjectIdentifier:
            return AsnObjectIdentifierConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].OctetString:
            return AsnOctetStringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].PrintableString:
            return AsnPrintableStringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].TeletexString:
            return AsnTeletexStringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].UTCTime:
            return AsnUTCTimeConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].UniversalString:
            return AsnUniversalStringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].Utf8String:
            return AsnUtf8StringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].VideotexString:
            return AsnVideotexStringConverter;
        case _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"].VisibleString:
            return AsnVisibleStringConverter;
        default:
            return null;
    }
}


/***/ }),

/***/ 423:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, "a", function() { return /* reexport */ AsnSchemaValidationError; });

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/errors/schema_validation.js
class AsnSchemaValidationError extends Error {
    constructor() {
        super(...arguments);
        this.schemas = [];
    }
}

// CONCATENATED MODULE: ./node_modules/@peculiar/asn1-schema/build/es2015/errors/index.js



/***/ }),

/***/ 489:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Buffer) {/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AsnParser; });
/* harmony import */ var asn1js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(36);
/* harmony import */ var asn1js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(asn1js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _enums__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79);
/* harmony import */ var _converters__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(278);
/* harmony import */ var _errors__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(423);
/* harmony import */ var _helper__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(201);
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(176);






class AsnParser {
    static parse(data, target) {
        let buf;
        if (data instanceof ArrayBuffer) {
            buf = data;
        }
        else if (typeof Buffer !== undefined && Buffer.isBuffer(data)) {
            buf = new Uint8Array(data).buffer;
        }
        else if (ArrayBuffer.isView(data)) {
            buf = data.buffer;
        }
        else {
            throw new TypeError("Wrong type of 'data' argument");
        }
        const asn1Parsed = asn1js__WEBPACK_IMPORTED_MODULE_0__["fromBER"](buf);
        if (asn1Parsed.result.error) {
            throw new Error(asn1Parsed.result.error);
        }
        const res = this.fromASN(asn1Parsed.result, target);
        return res;
    }
    static fromASN(asn1Schema, target) {
        var _a;
        try {
            if (Object(_helper__WEBPACK_IMPORTED_MODULE_4__[/* isConvertible */ "b"])(target)) {
                const value = new target();
                return value.fromASN(asn1Schema);
            }
            const schema = _storage__WEBPACK_IMPORTED_MODULE_5__[/* schemaStorage */ "a"].get(target);
            _storage__WEBPACK_IMPORTED_MODULE_5__[/* schemaStorage */ "a"].cache(target);
            let targetSchema = schema.schema;
            if (asn1Schema.constructor === asn1js__WEBPACK_IMPORTED_MODULE_0__["Constructed"] && schema.type !== _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnTypeTypes */ "b"].Choice) {
                targetSchema = new asn1js__WEBPACK_IMPORTED_MODULE_0__["Constructed"]({
                    idBlock: {
                        tagClass: 3,
                        tagNumber: asn1Schema.idBlock.tagNumber,
                    },
                    value: schema.schema.valueBlock.value,
                });
                for (const key in schema.items) {
                    delete asn1Schema[key];
                }
            }
            const asn1ComparedSchema = asn1js__WEBPACK_IMPORTED_MODULE_0__["compareSchema"](asn1Schema, asn1Schema, targetSchema);
            if (!asn1ComparedSchema.verified) {
                throw new _errors__WEBPACK_IMPORTED_MODULE_3__[/* AsnSchemaValidationError */ "a"](`Data does not match to ${target.name} ASN1 schema. ${asn1ComparedSchema.result.error}`);
            }
            const res = new target();
            if (Object(_helper__WEBPACK_IMPORTED_MODULE_4__[/* isTypeOfArray */ "c"])(target)) {
                if (typeof schema.itemType === "number") {
                    const converter = _converters__WEBPACK_IMPORTED_MODULE_2__[/* defaultConverter */ "b"](schema.itemType);
                    if (!converter) {
                        throw new Error(`Cannot get default converter for array item of ${target.name} ASN1 schema`);
                    }
                    return target.from(asn1Schema.valueBlock.value, (element) => converter.fromASN(element));
                }
                else {
                    return target.from(asn1Schema.valueBlock.value, (element) => this.fromASN(element, schema.itemType));
                }
            }
            for (const key in schema.items) {
                if (!asn1Schema[key]) {
                    continue;
                }
                const schemaItem = schema.items[key];
                if (typeof (schemaItem.type) === "number" || Object(_helper__WEBPACK_IMPORTED_MODULE_4__[/* isConvertible */ "b"])(schemaItem.type)) {
                    const converter = (_a = schemaItem.converter) !== null && _a !== void 0 ? _a : (Object(_helper__WEBPACK_IMPORTED_MODULE_4__[/* isConvertible */ "b"])(schemaItem.type)
                        ? new schemaItem.type()
                        : null);
                    if (!converter) {
                        throw new Error("Converter is empty");
                    }
                    if (schemaItem.repeated) {
                        if (schemaItem.implicit) {
                            const Container = schemaItem.repeated === "sequence"
                                ? asn1js__WEBPACK_IMPORTED_MODULE_0__["Sequence"]
                                : asn1js__WEBPACK_IMPORTED_MODULE_0__["Set"];
                            const newItem = new Container();
                            newItem.valueBlock = asn1Schema[key].valueBlock;
                            const value = asn1js__WEBPACK_IMPORTED_MODULE_0__["fromBER"](newItem.toBER(false)).result.valueBlock.value;
                            res[key] = Array.from(value, (element) => converter.fromASN(element));
                        }
                        else {
                            res[key] = Array.from(asn1Schema[key], (element) => converter.fromASN(element));
                        }
                    }
                    else {
                        let value = asn1Schema[key];
                        if (schemaItem.implicit) {
                            let newItem;
                            if (Object(_helper__WEBPACK_IMPORTED_MODULE_4__[/* isConvertible */ "b"])(schemaItem.type)) {
                                newItem = new schemaItem.type().toSchema("");
                            }
                            else {
                                const Asn1TypeName = _enums__WEBPACK_IMPORTED_MODULE_1__[/* AsnPropTypes */ "a"][schemaItem.type];
                                const Asn1Type = asn1js__WEBPACK_IMPORTED_MODULE_0__[Asn1TypeName];
                                if (!Asn1Type) {
                                    throw new Error(`Cannot get '${Asn1TypeName}' class from asn1js module`);
                                }
                                newItem = new Asn1Type();
                            }
                            newItem.valueBlock = value.valueBlock;
                            value = asn1js__WEBPACK_IMPORTED_MODULE_0__["fromBER"](newItem.toBER(false)).result;
                        }
                        res[key] = converter.fromASN(value);
                    }
                }
                else {
                    if (schemaItem.repeated) {
                        res[key] = Array.from(asn1Schema[key], (element) => this.fromASN(element, schemaItem.type));
                    }
                    else {
                        res[key] = this.fromASN(asn1Schema[key], schemaItem.type);
                    }
                }
            }
            return res;
        }
        catch (error) {
            if (error instanceof _errors__WEBPACK_IMPORTED_MODULE_3__[/* AsnSchemaValidationError */ "a"]) {
                error.schemas.push(target.name);
            }
            throw error;
        }
    }
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(22).Buffer))

/***/ }),

/***/ 75:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export JsonError */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return JsonParser; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return JsonProp; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return JsonPropTypes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return JsonSerializer; });
/* unused harmony export KeyError */
/* unused harmony export ParserError */
/* unused harmony export SerializerError */
/* unused harmony export TransformError */
/* unused harmony export ValidationError */
class JsonError extends Error {
    constructor(message, innerError) {
        super(innerError
            ? `${message}. See the inner exception for more details.`
            : message);
        this.message = message;
        this.innerError = innerError;
    }
}

class TransformError extends JsonError {
    constructor(schema, message, innerError) {
        super(message, innerError);
        this.schema = schema;
    }
}

class ParserError extends TransformError {
    constructor(schema, message, innerError) {
        super(schema, `JSON doesn't match to '${schema.target.name}' schema. ${message}`, innerError);
    }
}

class ValidationError extends JsonError {
}

class SerializerError extends JsonError {
    constructor(schemaName, message, innerError) {
        super(`Cannot serialize by '${schemaName}' schema. ${message}`, innerError);
        this.schemaName = schemaName;
    }
}

class KeyError extends ParserError {
    constructor(schema, keys, errors = {}) {
        super(schema, "Some keys doesn't match to schema");
        this.keys = keys;
        this.errors = errors;
    }
}

var JsonPropTypes;
(function (JsonPropTypes) {
    JsonPropTypes[JsonPropTypes["Any"] = 0] = "Any";
    JsonPropTypes[JsonPropTypes["Boolean"] = 1] = "Boolean";
    JsonPropTypes[JsonPropTypes["Number"] = 2] = "Number";
    JsonPropTypes[JsonPropTypes["String"] = 3] = "String";
})(JsonPropTypes || (JsonPropTypes = {}));

function checkType(value, type) {
    switch (type) {
        case JsonPropTypes.Boolean:
            return typeof value === "boolean";
        case JsonPropTypes.Number:
            return typeof value === "number";
        case JsonPropTypes.String:
            return typeof value === "string";
    }
    return true;
}
function throwIfTypeIsWrong(value, type) {
    if (!checkType(value, type)) {
        throw new TypeError(`Value must be ${JsonPropTypes[type]}`);
    }
}
function isConvertible(target) {
    if (target && target.prototype) {
        if (target.prototype.toJSON && target.prototype.fromJSON) {
            return true;
        }
        else {
            return isConvertible(target.prototype);
        }
    }
    else {
        return !!(target && target.toJSON && target.fromJSON);
    }
}

class JsonSchemaStorage {
    constructor() {
        this.items = new Map();
    }
    has(target) {
        return this.items.has(target) || !!this.findParentSchema(target);
    }
    get(target) {
        const schema = this.items.get(target) || this.findParentSchema(target);
        if (!schema) {
            throw new Error("Cannot get schema for current target");
        }
        return schema;
    }
    create(target) {
        const schema = { names: {} };
        const parentSchema = this.findParentSchema(target);
        if (parentSchema) {
            Object.assign(schema, parentSchema);
            schema.names = {};
            for (const name in parentSchema.names) {
                schema.names[name] = Object.assign({}, parentSchema.names[name]);
            }
        }
        schema.target = target;
        return schema;
    }
    set(target, schema) {
        this.items.set(target, schema);
        return this;
    }
    findParentSchema(target) {
        const parent = target.__proto__;
        if (parent) {
            const schema = this.items.get(parent);
            return schema || this.findParentSchema(parent);
        }
        return null;
    }
}

const DEFAULT_SCHEMA = "default";
const schemaStorage = new JsonSchemaStorage();

class PatternValidation {
    constructor(pattern) {
        this.pattern = new RegExp(pattern);
    }
    validate(value) {
        const pattern = new RegExp(this.pattern.source, this.pattern.flags);
        if (typeof value !== "string") {
            throw new ValidationError("Incoming value must be string");
        }
        if (!pattern.exec(value)) {
            throw new ValidationError(`Value doesn't match to pattern '${pattern.toString()}'`);
        }
    }
}

class InclusiveValidation {
    constructor(min = Number.MIN_VALUE, max = Number.MAX_VALUE) {
        this.min = min;
        this.max = max;
    }
    validate(value) {
        throwIfTypeIsWrong(value, JsonPropTypes.Number);
        if (!(this.min <= value && value <= this.max)) {
            const min = this.min === Number.MIN_VALUE ? "MIN" : this.min;
            const max = this.max === Number.MAX_VALUE ? "MAX" : this.max;
            throw new ValidationError(`Value doesn't match to diapason [${min},${max}]`);
        }
    }
}

class ExclusiveValidation {
    constructor(min = Number.MIN_VALUE, max = Number.MAX_VALUE) {
        this.min = min;
        this.max = max;
    }
    validate(value) {
        throwIfTypeIsWrong(value, JsonPropTypes.Number);
        if (!(this.min < value && value < this.max)) {
            const min = this.min === Number.MIN_VALUE ? "MIN" : this.min;
            const max = this.max === Number.MAX_VALUE ? "MAX" : this.max;
            throw new ValidationError(`Value doesn't match to diapason (${min},${max})`);
        }
    }
}

class LengthValidation {
    constructor(length, minLength, maxLength) {
        this.length = length;
        this.minLength = minLength;
        this.maxLength = maxLength;
    }
    validate(value) {
        if (this.length !== undefined) {
            if (value.length !== this.length) {
                throw new ValidationError(`Value length must be exactly ${this.length}.`);
            }
            return;
        }
        if (this.minLength !== undefined) {
            if (value.length < this.minLength) {
                throw new ValidationError(`Value length must be more than ${this.minLength}.`);
            }
        }
        if (this.maxLength !== undefined) {
            if (value.length > this.maxLength) {
                throw new ValidationError(`Value length must be less than ${this.maxLength}.`);
            }
        }
    }
}

class EnumerationValidation {
    constructor(enumeration) {
        this.enumeration = enumeration;
    }
    validate(value) {
        throwIfTypeIsWrong(value, JsonPropTypes.String);
        if (!this.enumeration.includes(value)) {
            throw new ValidationError(`Value must be one of ${this.enumeration.map((v) => `'${v}'`).join(", ")}`);
        }
    }
}

class JsonTransform {
    static checkValues(data, schemaItem) {
        const values = Array.isArray(data) ? data : [data];
        for (const value of values) {
            for (const validation of schemaItem.validations) {
                if (validation instanceof LengthValidation && schemaItem.repeated) {
                    validation.validate(data);
                }
                else {
                    validation.validate(value);
                }
            }
        }
    }
    static checkTypes(value, schemaItem) {
        if (schemaItem.repeated && !Array.isArray(value)) {
            throw new TypeError("Value must be Array");
        }
        if (typeof schemaItem.type === "number") {
            const values = Array.isArray(value) ? value : [value];
            for (const v of values) {
                throwIfTypeIsWrong(v, schemaItem.type);
            }
        }
    }
    static getSchemaByName(schema, name = DEFAULT_SCHEMA) {
        return { ...schema.names[DEFAULT_SCHEMA], ...schema.names[name] };
    }
}

class JsonSerializer extends JsonTransform {
    static serialize(obj, options, replacer, space) {
        const json = this.toJSON(obj, options);
        return JSON.stringify(json, replacer, space);
    }
    static toJSON(obj, options = {}) {
        let res;
        let targetSchema = options.targetSchema;
        const schemaName = options.schemaName || DEFAULT_SCHEMA;
        if (isConvertible(obj)) {
            return obj.toJSON();
        }
        if (Array.isArray(obj)) {
            res = [];
            for (const item of obj) {
                res.push(this.toJSON(item, options));
            }
        }
        else if (typeof obj === "object") {
            if (targetSchema && !schemaStorage.has(targetSchema)) {
                throw new JsonError("Cannot get schema for `targetSchema` param");
            }
            targetSchema = (targetSchema || obj.constructor);
            if (schemaStorage.has(targetSchema)) {
                const schema = schemaStorage.get(targetSchema);
                res = {};
                const namedSchema = this.getSchemaByName(schema, schemaName);
                for (const key in namedSchema) {
                    try {
                        const item = namedSchema[key];
                        const objItem = obj[key];
                        let value;
                        if ((item.optional && objItem === undefined)
                            || (item.defaultValue !== undefined && objItem === item.defaultValue)) {
                            continue;
                        }
                        if (!item.optional && objItem === undefined) {
                            throw new SerializerError(targetSchema.name, `Property '${key}' is required.`);
                        }
                        if (typeof item.type === "number") {
                            if (item.converter) {
                                if (item.repeated) {
                                    value = objItem.map((el) => item.converter.toJSON(el, obj));
                                }
                                else {
                                    value = item.converter.toJSON(objItem, obj);
                                }
                            }
                            else {
                                value = objItem;
                            }
                        }
                        else {
                            if (item.repeated) {
                                value = objItem.map((el) => this.toJSON(el, { schemaName }));
                            }
                            else {
                                value = this.toJSON(objItem, { schemaName });
                            }
                        }
                        this.checkTypes(value, item);
                        this.checkValues(value, item);
                        res[item.name || key] = value;
                    }
                    catch (e) {
                        if (e instanceof SerializerError) {
                            throw e;
                        }
                        else {
                            throw new SerializerError(schema.target.name, `Property '${key}' is wrong. ${e.message}`, e);
                        }
                    }
                }
            }
            else {
                res = {};
                for (const key in obj) {
                    res[key] = this.toJSON(obj[key], { schemaName });
                }
            }
        }
        else {
            res = obj;
        }
        return res;
    }
}

class JsonParser extends JsonTransform {
    static parse(data, options) {
        const obj = JSON.parse(data);
        return this.fromJSON(obj, options);
    }
    static fromJSON(target, options) {
        const targetSchema = options.targetSchema;
        const schemaName = options.schemaName || DEFAULT_SCHEMA;
        const obj = new targetSchema();
        if (isConvertible(obj)) {
            return obj.fromJSON(target);
        }
        const schema = schemaStorage.get(targetSchema);
        const namedSchema = this.getSchemaByName(schema, schemaName);
        const keyErrors = {};
        if (options.strictProperty && !Array.isArray(target)) {
            JsonParser.checkStrictProperty(target, namedSchema, schema);
        }
        for (const key in namedSchema) {
            try {
                const item = namedSchema[key];
                const name = item.name || key;
                const value = target[name];
                if (value === undefined && (item.optional || item.defaultValue !== undefined)) {
                    continue;
                }
                if (!item.optional && value === undefined) {
                    throw new ParserError(schema, `Property '${name}' is required.`);
                }
                this.checkTypes(value, item);
                this.checkValues(value, item);
                if (typeof (item.type) === "number") {
                    if (item.converter) {
                        if (item.repeated) {
                            obj[key] = value.map((el) => item.converter.fromJSON(el, obj));
                        }
                        else {
                            obj[key] = item.converter.fromJSON(value, obj);
                        }
                    }
                    else {
                        obj[key] = value;
                    }
                }
                else {
                    const newOptions = {
                        ...options,
                        targetSchema: item.type,
                        schemaName,
                    };
                    if (item.repeated) {
                        obj[key] = value.map((el) => this.fromJSON(el, newOptions));
                    }
                    else {
                        obj[key] = this.fromJSON(value, newOptions);
                    }
                }
            }
            catch (e) {
                if (!(e instanceof ParserError)) {
                    e = new ParserError(schema, `Property '${key}' is wrong. ${e.message}`, e);
                }
                if (options.strictAllKeys) {
                    keyErrors[key] = e;
                }
                else {
                    throw e;
                }
            }
        }
        const keys = Object.keys(keyErrors);
        if (keys.length) {
            throw new KeyError(schema, keys, keyErrors);
        }
        return obj;
    }
    static checkStrictProperty(target, namedSchema, schema) {
        const jsonProps = Object.keys(target);
        const schemaProps = Object.keys(namedSchema);
        const keys = [];
        for (const key of jsonProps) {
            if (schemaProps.indexOf(key) === -1) {
                keys.push(key);
            }
        }
        if (keys.length) {
            throw new KeyError(schema, keys);
        }
    }
}

function getValidations(item) {
    const validations = [];
    if (item.pattern) {
        validations.push(new PatternValidation(item.pattern));
    }
    if (item.type === JsonPropTypes.Number || item.type === JsonPropTypes.Any) {
        if (item.minInclusive !== undefined || item.maxInclusive !== undefined) {
            validations.push(new InclusiveValidation(item.minInclusive, item.maxInclusive));
        }
        if (item.minExclusive !== undefined || item.maxExclusive !== undefined) {
            validations.push(new ExclusiveValidation(item.minExclusive, item.maxExclusive));
        }
        if (item.enumeration !== undefined) {
            validations.push(new EnumerationValidation(item.enumeration));
        }
    }
    if (item.type === JsonPropTypes.String || item.repeated || item.type === JsonPropTypes.Any) {
        if (item.length !== undefined || item.minLength !== undefined || item.maxLength !== undefined) {
            validations.push(new LengthValidation(item.length, item.minLength, item.maxLength));
        }
    }
    return validations;
}
const JsonProp = (options = {}) => (target, propertyKey) => {
    const errorMessage = `Cannot set type for ${propertyKey} property of ${target.constructor.name} schema`;
    let schema;
    if (!schemaStorage.has(target.constructor)) {
        schema = schemaStorage.create(target.constructor);
        schemaStorage.set(target.constructor, schema);
    }
    else {
        schema = schemaStorage.get(target.constructor);
        if (schema.target !== target.constructor) {
            schema = schemaStorage.create(target.constructor);
            schemaStorage.set(target.constructor, schema);
        }
    }
    const defaultSchema = {
        type: JsonPropTypes.Any,
        validations: [],
    };
    const copyOptions = Object.assign(defaultSchema, options);
    copyOptions.validations = getValidations(copyOptions);
    if (typeof copyOptions.type !== "number") {
        if (!schemaStorage.has(copyOptions.type) && !isConvertible(copyOptions.type)) {
            throw new Error(`${errorMessage}. Assigning type doesn't have schema.`);
        }
    }
    let schemaNames;
    if (Array.isArray(options.schema)) {
        schemaNames = options.schema;
    }
    else {
        schemaNames = [options.schema || DEFAULT_SCHEMA];
    }
    for (const schemaName of schemaNames) {
        if (!schema.names[schemaName]) {
            schema.names[schemaName] = {};
        }
        const namedSchema = schema.names[schemaName];
        namedSchema[propertyKey] = copyOptions;
    }
};




/***/ }),

/***/ 79:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return AsnTypeTypes; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AsnPropTypes; });
var AsnTypeTypes;
(function (AsnTypeTypes) {
    AsnTypeTypes[AsnTypeTypes["Sequence"] = 0] = "Sequence";
    AsnTypeTypes[AsnTypeTypes["Set"] = 1] = "Set";
    AsnTypeTypes[AsnTypeTypes["Choice"] = 2] = "Choice";
})(AsnTypeTypes || (AsnTypeTypes = {}));
var AsnPropTypes;
(function (AsnPropTypes) {
    AsnPropTypes[AsnPropTypes["Any"] = 1] = "Any";
    AsnPropTypes[AsnPropTypes["Boolean"] = 2] = "Boolean";
    AsnPropTypes[AsnPropTypes["OctetString"] = 3] = "OctetString";
    AsnPropTypes[AsnPropTypes["BitString"] = 4] = "BitString";
    AsnPropTypes[AsnPropTypes["Integer"] = 5] = "Integer";
    AsnPropTypes[AsnPropTypes["Enumerated"] = 6] = "Enumerated";
    AsnPropTypes[AsnPropTypes["ObjectIdentifier"] = 7] = "ObjectIdentifier";
    AsnPropTypes[AsnPropTypes["Utf8String"] = 8] = "Utf8String";
    AsnPropTypes[AsnPropTypes["BmpString"] = 9] = "BmpString";
    AsnPropTypes[AsnPropTypes["UniversalString"] = 10] = "UniversalString";
    AsnPropTypes[AsnPropTypes["NumericString"] = 11] = "NumericString";
    AsnPropTypes[AsnPropTypes["PrintableString"] = 12] = "PrintableString";
    AsnPropTypes[AsnPropTypes["TeletexString"] = 13] = "TeletexString";
    AsnPropTypes[AsnPropTypes["VideotexString"] = 14] = "VideotexString";
    AsnPropTypes[AsnPropTypes["IA5String"] = 15] = "IA5String";
    AsnPropTypes[AsnPropTypes["GraphicString"] = 16] = "GraphicString";
    AsnPropTypes[AsnPropTypes["VisibleString"] = 17] = "VisibleString";
    AsnPropTypes[AsnPropTypes["GeneralString"] = 18] = "GeneralString";
    AsnPropTypes[AsnPropTypes["CharacterString"] = 19] = "CharacterString";
    AsnPropTypes[AsnPropTypes["UTCTime"] = 20] = "UTCTime";
    AsnPropTypes[AsnPropTypes["GeneralizedTime"] = 21] = "GeneralizedTime";
    AsnPropTypes[AsnPropTypes["DATE"] = 22] = "DATE";
    AsnPropTypes[AsnPropTypes["TimeOfDay"] = 23] = "TimeOfDay";
    AsnPropTypes[AsnPropTypes["DateTime"] = 24] = "DateTime";
    AsnPropTypes[AsnPropTypes["Duration"] = 25] = "Duration";
    AsnPropTypes[AsnPropTypes["TIME"] = 26] = "TIME";
    AsnPropTypes[AsnPropTypes["Null"] = 27] = "Null";
})(AsnPropTypes || (AsnPropTypes = {}));


/***/ })

}]);