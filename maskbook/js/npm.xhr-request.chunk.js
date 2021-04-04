(globalThis["webpackJsonp"] = globalThis["webpackJsonp"] || []).push([[148],{

/***/ 1438:
/***/ (function(module, exports, __webpack_require__) {

var queryString = __webpack_require__(1439)
var setQuery = __webpack_require__(1442)
var assign = __webpack_require__(252)
var ensureHeader = __webpack_require__(1443)

// this is replaced in the browser
var request = __webpack_require__(1444)

var mimeTypeJson = 'application/json'
var noop = function () {}

module.exports = xhrRequest
function xhrRequest (url, opt, cb) {
  if (!url || typeof url !== 'string') {
    throw new TypeError('must specify a URL')
  }
  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }
  if (cb && typeof cb !== 'function') {
    throw new TypeError('expected cb to be undefined or a function')
  }

  cb = cb || noop
  opt = opt || {}

  var defaultResponse = opt.json ? 'json' : 'text'
  opt = assign({ responseType: defaultResponse }, opt)

  var headers = opt.headers || {}
  var method = (opt.method || 'GET').toUpperCase()
  var query = opt.query
  if (query) {
    if (typeof query !== 'string') {
      query = queryString.stringify(query)
    }
    url = setQuery(url, query)
  }

  // allow json response
  if (opt.responseType === 'json') {
    ensureHeader(headers, 'Accept', mimeTypeJson)
  }

  // if body content is json
  if (opt.json && method !== 'GET' && method !== 'HEAD') {
    ensureHeader(headers, 'Content-Type', mimeTypeJson)
    opt.body = JSON.stringify(opt.body)
  }

  opt.method = method
  opt.url = url
  opt.headers = headers
  delete opt.query
  delete opt.json

  return request(opt, cb)
}


/***/ }),

/***/ 1439:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var strictUriEncode = __webpack_require__(1440);
var objectAssign = __webpack_require__(252);
var decodeComponent = __webpack_require__(1441);

function encoderForArrayFormat(opts) {
	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, index) {
				return value === null ? [
					encode(key, opts),
					'[',
					index,
					']'
				].join('') : [
					encode(key, opts),
					'[',
					encode(index, opts),
					']=',
					encode(value, opts)
				].join('');
			};

		case 'bracket':
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'[]=',
					encode(value, opts)
				].join('');
			};

		default:
			return function (key, value) {
				return value === null ? encode(key, opts) : [
					encode(key, opts),
					'=',
					encode(value, opts)
				].join('');
			};
	}
}

function parserForArrayFormat(opts) {
	var result;

	switch (opts.arrayFormat) {
		case 'index':
			return function (key, value, accumulator) {
				result = /\[(\d*)\]$/.exec(key);

				key = key.replace(/\[\d*\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				}

				if (accumulator[key] === undefined) {
					accumulator[key] = {};
				}

				accumulator[key][result[1]] = value;
			};

		case 'bracket':
			return function (key, value, accumulator) {
				result = /(\[\])$/.exec(key);
				key = key.replace(/\[\]$/, '');

				if (!result) {
					accumulator[key] = value;
					return;
				} else if (accumulator[key] === undefined) {
					accumulator[key] = [value];
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};

		default:
			return function (key, value, accumulator) {
				if (accumulator[key] === undefined) {
					accumulator[key] = value;
					return;
				}

				accumulator[key] = [].concat(accumulator[key], value);
			};
	}
}

function encode(value, opts) {
	if (opts.encode) {
		return opts.strict ? strictUriEncode(value) : encodeURIComponent(value);
	}

	return value;
}

function keysSorter(input) {
	if (Array.isArray(input)) {
		return input.sort();
	} else if (typeof input === 'object') {
		return keysSorter(Object.keys(input)).sort(function (a, b) {
			return Number(a) - Number(b);
		}).map(function (key) {
			return input[key];
		});
	}

	return input;
}

function extract(str) {
	var queryStart = str.indexOf('?');
	if (queryStart === -1) {
		return '';
	}
	return str.slice(queryStart + 1);
}

function parse(str, opts) {
	opts = objectAssign({arrayFormat: 'none'}, opts);

	var formatter = parserForArrayFormat(opts);

	// Create an object with no prototype
	// https://github.com/sindresorhus/query-string/issues/47
	var ret = Object.create(null);

	if (typeof str !== 'string') {
		return ret;
	}

	str = str.trim().replace(/^[?#&]/, '');

	if (!str) {
		return ret;
	}

	str.split('&').forEach(function (param) {
		var parts = param.replace(/\+/g, ' ').split('=');
		// Firefox (pre 40) decodes `%3D` to `=`
		// https://github.com/sindresorhus/query-string/pull/37
		var key = parts.shift();
		var val = parts.length > 0 ? parts.join('=') : undefined;

		// missing `=` should be `null`:
		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
		val = val === undefined ? null : decodeComponent(val);

		formatter(decodeComponent(key), val, ret);
	});

	return Object.keys(ret).sort().reduce(function (result, key) {
		var val = ret[key];
		if (Boolean(val) && typeof val === 'object' && !Array.isArray(val)) {
			// Sort object keys, not values
			result[key] = keysSorter(val);
		} else {
			result[key] = val;
		}

		return result;
	}, Object.create(null));
}

exports.extract = extract;
exports.parse = parse;

exports.stringify = function (obj, opts) {
	var defaults = {
		encode: true,
		strict: true,
		arrayFormat: 'none'
	};

	opts = objectAssign(defaults, opts);

	if (opts.sort === false) {
		opts.sort = function () {};
	}

	var formatter = encoderForArrayFormat(opts);

	return obj ? Object.keys(obj).sort(opts.sort).map(function (key) {
		var val = obj[key];

		if (val === undefined) {
			return '';
		}

		if (val === null) {
			return encode(key, opts);
		}

		if (Array.isArray(val)) {
			var result = [];

			val.slice().forEach(function (val2) {
				if (val2 === undefined) {
					return;
				}

				result.push(formatter(key, val2, result.length));
			});

			return result.join('&');
		}

		return encode(key, opts) + '=' + encode(val, opts);
	}).filter(function (x) {
		return x.length > 0;
	}).join('&') : '';
};

exports.parseUrl = function (str, opts) {
	return {
		url: str.split('?')[0] || '',
		query: parse(extract(str), opts)
	};
};


/***/ }),

/***/ 1443:
/***/ (function(module, exports) {

module.exports = ensureHeader
function ensureHeader (headers, key, value) {
  var lower = key.toLowerCase()
  if (!headers[key] && !headers[lower]) {
    headers[key] = value
  }
}


/***/ }),

/***/ 1444:
/***/ (function(module, exports, __webpack_require__) {

var xhr = __webpack_require__(1445)
var normalize = __webpack_require__(1449)
var noop = function () {}

module.exports = xhrRequest
function xhrRequest (opt, cb) {
  delete opt.uri

  // for better JSON.parse error handling than xhr module
  var useJson = false
  if (opt.responseType === 'json') {
    opt.responseType = 'text'
    useJson = true
  }

  var req = xhr(opt, function xhrRequestResult (err, resp, body) {
    if (useJson && !err) {
      try {
        var text = resp.rawRequest.responseText
        body = JSON.parse(text)
      } catch (e) {
        err = e
      }
    }

    resp = normalize(opt, resp)
    if (err) cb(err, null, resp)
    else cb(err, body, resp)
    cb = noop
  })

  // Patch abort() so that it also calls the callback, but with an error
  var onabort = req.onabort
  req.onabort = function () {
    var ret = onabort.apply(req, Array.prototype.slice.call(arguments))
    cb(new Error('XHR Aborted'))
    cb = noop
    return ret
  }

  return req
}


/***/ }),

/***/ 1449:
/***/ (function(module, exports) {

module.exports = getResponse
function getResponse (opt, resp) {
  if (!resp) return null
  return {
    statusCode: resp.statusCode,
    headers: resp.headers,
    method: opt.method,
    url: opt.url,
    // the XHR object in browser, http response in Node
    rawRequest: resp.rawRequest ? resp.rawRequest : resp
  }
}


/***/ })

}]);