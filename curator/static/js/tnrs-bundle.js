(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tnrs = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){
'use strict';

var objectAssign = require('object-assign');

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:
// NB: The URL to the CommonJS spec is kept just for tradition.
//     node-assert has evolved a lot since then, both in API and behavior.

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

// Expose a strict only variant of assert
function strict(value, message) {
  if (!value) fail(value, true, message, '==', strict);
}
assert.strict = objectAssign(strict, assert, {
  equal: assert.strictEqual,
  deepEqual: assert.deepStrictEqual,
  notEqual: assert.notStrictEqual,
  notDeepEqual: assert.notDeepStrictEqual
});
assert.strict.strict = assert.strict;

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"object-assign":11,"util/":4}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":3,"_process":12,"inherits":2}],5:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],6:[function(require,module,exports){
/* Blob.js
 * A Blob implementation.
 * 2014-07-24
 *
 * By Eli Grey, http://eligrey.com
 * By Devin Samarin, https://github.com/dsamarin
 * License: X11/MIT
 *   See https://github.com/eligrey/Blob.js/blob/master/LICENSE.md
 */

/*global self, unescape */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/Blob.js/blob/master/Blob.js */

(function (view) {
	"use strict";

	view.URL = view.URL || view.webkitURL;

	if (view.Blob && view.URL) {
		try {
			new Blob;
			return;
		} catch (e) {}
	}

	// Internally we use a BlobBuilder implementation to base Blob off of
	// in order to support older browsers that only have BlobBuilder
	var BlobBuilder = view.BlobBuilder || view.WebKitBlobBuilder || view.MozBlobBuilder || (function(view) {
		var
			  get_class = function(object) {
				return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
			}
			, FakeBlobBuilder = function BlobBuilder() {
				this.data = [];
			}
			, FakeBlob = function Blob(data, type, encoding) {
				this.data = data;
				this.size = data.length;
				this.type = type;
				this.encoding = encoding;
			}
			, FBB_proto = FakeBlobBuilder.prototype
			, FB_proto = FakeBlob.prototype
			, FileReaderSync = view.FileReaderSync
			, FileException = function(type) {
				this.code = this[this.name = type];
			}
			, file_ex_codes = (
				  "NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR "
				+ "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR"
			).split(" ")
			, file_ex_code = file_ex_codes.length
			, real_URL = view.URL || view.webkitURL || view
			, real_create_object_URL = real_URL.createObjectURL
			, real_revoke_object_URL = real_URL.revokeObjectURL
			, URL = real_URL
			, btoa = view.btoa
			, atob = view.atob

			, ArrayBuffer = view.ArrayBuffer
			, Uint8Array = view.Uint8Array

			, origin = /^[\w-]+:\/*\[?[\w\.:-]+\]?(?::[0-9]+)?/
		;
		FakeBlob.fake = FB_proto.fake = true;
		while (file_ex_code--) {
			FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
		}
		// Polyfill URL
		if (!real_URL.createObjectURL) {
			URL = view.URL = function(uri) {
				var
					  uri_info = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
					, uri_origin
				;
				uri_info.href = uri;
				if (!("origin" in uri_info)) {
					if (uri_info.protocol.toLowerCase() === "data:") {
						uri_info.origin = null;
					} else {
						uri_origin = uri.match(origin);
						uri_info.origin = uri_origin && uri_origin[1];
					}
				}
				return uri_info;
			};
		}
		URL.createObjectURL = function(blob) {
			var
				  type = blob.type
				, data_URI_header
			;
			if (type === null) {
				type = "application/octet-stream";
			}
			if (blob instanceof FakeBlob) {
				data_URI_header = "data:" + type;
				if (blob.encoding === "base64") {
					return data_URI_header + ";base64," + blob.data;
				} else if (blob.encoding === "URI") {
					return data_URI_header + "," + decodeURIComponent(blob.data);
				} if (btoa) {
					return data_URI_header + ";base64," + btoa(blob.data);
				} else {
					return data_URI_header + "," + encodeURIComponent(blob.data);
				}
			} else if (real_create_object_URL) {
				return real_create_object_URL.call(real_URL, blob);
			}
		};
		URL.revokeObjectURL = function(object_URL) {
			if (object_URL.substring(0, 5) !== "data:" && real_revoke_object_URL) {
				real_revoke_object_URL.call(real_URL, object_URL);
			}
		};
		FBB_proto.append = function(data/*, endings*/) {
			var bb = this.data;
			// decode data to a binary string
			if (Uint8Array && (data instanceof ArrayBuffer || data instanceof Uint8Array)) {
				var
					  str = ""
					, buf = new Uint8Array(data)
					, i = 0
					, buf_len = buf.length
				;
				for (; i < buf_len; i++) {
					str += String.fromCharCode(buf[i]);
				}
				bb.push(str);
			} else if (get_class(data) === "Blob" || get_class(data) === "File") {
				if (FileReaderSync) {
					var fr = new FileReaderSync;
					bb.push(fr.readAsBinaryString(data));
				} else {
					// async FileReader won't work as BlobBuilder is sync
					throw new FileException("NOT_READABLE_ERR");
				}
			} else if (data instanceof FakeBlob) {
				if (data.encoding === "base64" && atob) {
					bb.push(atob(data.data));
				} else if (data.encoding === "URI") {
					bb.push(decodeURIComponent(data.data));
				} else if (data.encoding === "raw") {
					bb.push(data.data);
				}
			} else {
				if (typeof data !== "string") {
					data += ""; // convert unsupported types to strings
				}
				// decode UTF-16 to binary string
				bb.push(unescape(encodeURIComponent(data)));
			}
		};
		FBB_proto.getBlob = function(type) {
			if (!arguments.length) {
				type = null;
			}
			return new FakeBlob(this.data.join(""), type, "raw");
		};
		FBB_proto.toString = function() {
			return "[object BlobBuilder]";
		};
		FB_proto.slice = function(start, end, type) {
			var args = arguments.length;
			if (args < 3) {
				type = null;
			}
			return new FakeBlob(
				  this.data.slice(start, args > 1 ? end : this.data.length)
				, type
				, this.encoding
			);
		};
		FB_proto.toString = function() {
			return "[object Blob]";
		};
		FB_proto.close = function() {
			this.size = 0;
			delete this.data;
		};
		return FakeBlobBuilder;
	}(view));

	view.Blob = function(blobParts, options) {
		var type = options ? (options.type || "") : "";
		var builder = new BlobBuilder();
		if (blobParts) {
			for (var i = 0, len = blobParts.length; i < len; i++) {
				if (Uint8Array && blobParts[i] instanceof Uint8Array) {
					builder.append(blobParts[i].buffer);
				}
				else {
					builder.append(blobParts[i]);
				}
			}
		}
		var blob = builder.getBlob(type);
		if (!blob.slice && blob.webkitSlice) {
			blob.slice = blob.webkitSlice;
		}
		return blob;
	};

	var getPrototypeOf = Object.getPrototypeOf || function(object) {
		return object.__proto__;
	};
	view.Blob.prototype = getPrototypeOf(new view.Blob());
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content || this));

},{}],7:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)

},{"base64-js":5,"buffer":7,"ieee754":9}],8:[function(require,module,exports){
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.2
 * 2016-06-16 18:25:19
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
		, is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		, arbitrary_revoke_timeout = 1000 * 40 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, force = type === force_saveable_type
				, object_url
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
							var popup = view.open(url, '_blank');
							if(!popup) view.location.href = url;
							url=undefined; // release reference before dispatching
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (!object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (force) {
						view.location.href = object_url;
					} else {
						var opened = view.open(object_url, "_blank");
						if (!opened) {
							// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
							view.location.href = object_url;
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
			;
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}

			fs_error();
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			name = name || blob.name || "download";

			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name);
		};
	}

	FS_proto.abort = function(){};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
  define("FileSaver.js", function() {
    return saveAs;
  });
}

},{}],9:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],10:[function(require,module,exports){
(function (global,Buffer,setImmediate){(function (){
/*!

JSZip v3.7.0 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/master/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/master/LICENSE
*/

!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).JSZip=e()}}(function(){return function s(o,a,f){function u(r,e){if(!a[r]){if(!o[r]){var t="function"==typeof require&&require;if(!e&&t)return t(r,!0);if(d)return d(r,!0);var n=new Error("Cannot find module '"+r+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[r]={exports:{}};o[r][0].call(i.exports,function(e){var t=o[r][1][e];return u(t||e)},i,i.exports,s,o,a,f)}return a[r].exports}for(var d="function"==typeof require&&require,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(h,t,n){(function(r){!function(e){"object"==typeof n&&void 0!==t?t.exports=e():("undefined"!=typeof window?window:void 0!==r?r:"undefined"!=typeof self?self:this).JSZip=e()}(function(){return function s(o,a,f){function u(t,e){if(!a[t]){if(!o[t]){var r="function"==typeof h&&h;if(!e&&r)return r(t,!0);if(d)return d(t,!0);var n=new Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}var i=a[t]={exports:{}};o[t][0].call(i.exports,function(e){return u(o[t][1][e]||e)},i,i.exports,s,o,a,f)}return a[t].exports}for(var d="function"==typeof h&&h,e=0;e<f.length;e++)u(f[e]);return u}({1:[function(e,t,r){"use strict";var c=e("./utils"),h=e("./support"),p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";r.encode=function(e){for(var t,r,n,i,s,o,a,f=[],u=0,d=e.length,h=d,l="string"!==c.getTypeOf(e);u<e.length;)h=d-u,n=l?(t=e[u++],r=u<d?e[u++]:0,u<d?e[u++]:0):(t=e.charCodeAt(u++),r=u<d?e.charCodeAt(u++):0,u<d?e.charCodeAt(u++):0),i=t>>2,s=(3&t)<<4|r>>4,o=1<h?(15&r)<<2|n>>6:64,a=2<h?63&n:64,f.push(p.charAt(i)+p.charAt(s)+p.charAt(o)+p.charAt(a));return f.join("")},r.decode=function(e){var t,r,n,i,s,o,a=0,f=0;if("data:"===e.substr(0,"data:".length))throw new Error("Invalid base64 input, it looks like a data url.");var u,d=3*(e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"")).length/4;if(e.charAt(e.length-1)===p.charAt(64)&&d--,e.charAt(e.length-2)===p.charAt(64)&&d--,d%1!=0)throw new Error("Invalid base64 input, bad content length.");for(u=h.uint8array?new Uint8Array(0|d):new Array(0|d);a<e.length;)t=p.indexOf(e.charAt(a++))<<2|(i=p.indexOf(e.charAt(a++)))>>4,r=(15&i)<<4|(s=p.indexOf(e.charAt(a++)))>>2,n=(3&s)<<6|(o=p.indexOf(e.charAt(a++))),u[f++]=t,64!==s&&(u[f++]=r),64!==o&&(u[f++]=n);return u}},{"./support":30,"./utils":32}],2:[function(e,t,r){"use strict";var n=e("./external"),i=e("./stream/DataWorker"),s=e("./stream/Crc32Probe"),o=e("./stream/DataLengthProbe");function a(e,t,r,n,i){this.compressedSize=e,this.uncompressedSize=t,this.crc32=r,this.compression=n,this.compressedContent=i}a.prototype={getContentWorker:function(){var e=new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new o("data_length")),t=this;return e.on("end",function(){if(this.streamInfo.data_length!==t.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),e},getCompressedWorker:function(){return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},a.createWorkerFrom=function(e,t,r){return e.pipe(new s).pipe(new o("uncompressedSize")).pipe(t.compressWorker(r)).pipe(new o("compressedSize")).withStreamInfo("compression",t)},t.exports=a},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(e,t,r){"use strict";var n=e("./stream/GenericWorker");r.STORE={magic:"\0\0",compressWorker:function(e){return new n("STORE compression")},uncompressWorker:function(){return new n("STORE decompression")}},r.DEFLATE=e("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(e,t,r){"use strict";var n=e("./utils"),o=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t){return void 0!==e&&e.length?"string"!==n.getTypeOf(e)?function(e,t,r){var n=o,i=0+r;e^=-1;for(var s=0;s<i;s++)e=e>>>8^n[255&(e^t[s])];return-1^e}(0|t,e,e.length):function(e,t,r){var n=o,i=0+r;e^=-1;for(var s=0;s<i;s++)e=e>>>8^n[255&(e^t.charCodeAt(s))];return-1^e}(0|t,e,e.length):0}},{"./utils":32}],5:[function(e,t,r){"use strict";r.base64=!1,r.binary=!1,r.dir=!1,r.createFolders=!0,r.date=null,r.compression=null,r.compressionOptions=null,r.comment=null,r.unixPermissions=null,r.dosPermissions=null},{}],6:[function(e,t,r){"use strict";var n;n="undefined"!=typeof Promise?Promise:e("lie"),t.exports={Promise:n}},{lie:37}],7:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,i=e("pako"),s=e("./utils"),o=e("./stream/GenericWorker"),a=n?"uint8array":"array";function f(e,t){o.call(this,"FlateWorker/"+e),this._pako=null,this._pakoAction=e,this._pakoOptions=t,this.meta={}}r.magic="\b\0",s.inherits(f,o),f.prototype.processChunk=function(e){this.meta=e.meta,null===this._pako&&this._createPako(),this._pako.push(s.transformTo(a,e.data),!1)},f.prototype.flush=function(){o.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],!0)},f.prototype.cleanUp=function(){o.prototype.cleanUp.call(this),this._pako=null},f.prototype._createPako=function(){this._pako=new i[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var t=this;this._pako.onData=function(e){t.push({data:e,meta:t.meta})}},r.compressWorker=function(e){return new f("Deflate",e)},r.uncompressWorker=function(){return new f("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(e,t,r){"use strict";function O(e,t){var r,n="";for(r=0;r<t;r++)n+=String.fromCharCode(255&e),e>>>=8;return n}function i(e,t,r,n,i,s){var o,a,f=e.file,u=e.compression,d=s!==D.utf8encode,h=I.transformTo("string",s(f.name)),l=I.transformTo("string",D.utf8encode(f.name)),c=f.comment,p=I.transformTo("string",s(c)),m=I.transformTo("string",D.utf8encode(c)),_=l.length!==f.name.length,w=m.length!==c.length,v="",g="",y="",b=f.dir,k=f.date,x={crc32:0,compressedSize:0,uncompressedSize:0};t&&!r||(x.crc32=e.crc32,x.compressedSize=e.compressedSize,x.uncompressedSize=e.uncompressedSize);var S=0;t&&(S|=8),d||!_&&!w||(S|=2048);var E,z=0,C=0;b&&(z|=16),"UNIX"===i?(C=798,z|=((E=f.unixPermissions)||(E=b?16893:33204),(65535&E)<<16)):(C=20,z|=63&(f.dosPermissions||0)),o=k.getUTCHours(),o<<=6,o|=k.getUTCMinutes(),o<<=5,o|=k.getUTCSeconds()/2,a=k.getUTCFullYear()-1980,a<<=4,a|=k.getUTCMonth()+1,a<<=5,a|=k.getUTCDate(),_&&(v+="up"+O((g=O(1,1)+O(B(h),4)+l).length,2)+g),w&&(v+="uc"+O((y=O(1,1)+O(B(p),4)+m).length,2)+y);var A="";return A+="\n\0",A+=O(S,2),A+=u.magic,A+=O(o,2),A+=O(a,2),A+=O(x.crc32,4),A+=O(x.compressedSize,4),A+=O(x.uncompressedSize,4),A+=O(h.length,2),A+=O(v.length,2),{fileRecord:T.LOCAL_FILE_HEADER+A+h+v,dirRecord:T.CENTRAL_FILE_HEADER+O(C,2)+A+O(p.length,2)+"\0\0\0\0"+O(z,4)+O(n,4)+h+v+p}}var I=e("../utils"),s=e("../stream/GenericWorker"),D=e("../utf8"),B=e("../crc32"),T=e("../signature");function n(e,t,r,n){s.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=t,this.zipPlatform=r,this.encodeFileName=n,this.streamFiles=e,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}I.inherits(n,s),n.prototype.push=function(e){var t=e.meta.percent||0,r=this.entriesCount,n=this._sources.length;this.accumulate?this.contentBuffer.push(e):(this.bytesWritten+=e.data.length,s.prototype.push.call(this,{data:e.data,meta:{currentFile:this.currentFile,percent:r?(t+100*(r-n-1))/r:100}}))},n.prototype.openedSource=function(e){this.currentSourceOffset=this.bytesWritten,this.currentFile=e.file.name;var t=this.streamFiles&&!e.file.dir;if(t){var r=i(e,t,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:r.fileRecord,meta:{percent:0}})}else this.accumulate=!0},n.prototype.closedSource=function(e){this.accumulate=!1;var t,r=this.streamFiles&&!e.file.dir,n=i(e,r,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(n.dirRecord),r)this.push({data:(t=e,T.DATA_DESCRIPTOR+O(t.crc32,4)+O(t.compressedSize,4)+O(t.uncompressedSize,4)),meta:{percent:100}});else for(this.push({data:n.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},n.prototype.flush=function(){for(var e=this.bytesWritten,t=0;t<this.dirRecords.length;t++)this.push({data:this.dirRecords[t],meta:{percent:100}});var r,n,i,s,o,a,f=this.bytesWritten-e,u=(r=this.dirRecords.length,n=f,i=e,s=this.zipComment,o=this.encodeFileName,a=I.transformTo("string",o(s)),T.CENTRAL_DIRECTORY_END+"\0\0\0\0"+O(r,2)+O(r,2)+O(n,4)+O(i,4)+O(a.length,2)+a);this.push({data:u,meta:{percent:100}})},n.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},n.prototype.registerPrevious=function(e){this._sources.push(e);var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.closedSource(t.previous.streamInfo),t._sources.length?t.prepareNextSource():t.end()}),e.on("error",function(e){t.error(e)}),this},n.prototype.resume=function(){return!!s.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},n.prototype.error=function(e){var t=this._sources;if(!s.prototype.error.call(this,e))return!1;for(var r=0;r<t.length;r++)try{t[r].error(e)}catch(e){}return!0},n.prototype.lock=function(){s.prototype.lock.call(this);for(var e=this._sources,t=0;t<e.length;t++)e[t].lock()},t.exports=n},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(e,t,r){"use strict";var u=e("../compressions"),n=e("./ZipFileWorker");r.generateWorker=function(e,o,t){var a=new n(o.streamFiles,t,o.platform,o.encodeFileName),f=0;try{e.forEach(function(e,t){f++;var r=function(e,t){var r=e||t,n=u[r];if(!n)throw new Error(r+" is not a valid compression method !");return n}(t.options.compression,o.compression),n=t.options.compressionOptions||o.compressionOptions||{},i=t.dir,s=t.date;t._compressWorker(r,n).withStreamInfo("file",{name:e,dir:i,date:s,comment:t.comment||"",unixPermissions:t.unixPermissions,dosPermissions:t.dosPermissions}).pipe(a)}),a.entriesCount=f}catch(e){a.error(e)}return a}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(e,t,r){"use strict";function n(){if(!(this instanceof n))return new n;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files={},this.comment=null,this.root="",this.clone=function(){var e=new n;for(var t in this)"function"!=typeof this[t]&&(e[t]=this[t]);return e}}(n.prototype=e("./object")).loadAsync=e("./load"),n.support=e("./support"),n.defaults=e("./defaults"),n.version="3.5.0",n.loadAsync=function(e,t){return(new n).loadAsync(e,t)},n.external=e("./external"),t.exports=n},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(e,t,r){"use strict";var n=e("./utils"),i=e("./external"),a=e("./utf8"),f=e("./zipEntries"),s=e("./stream/Crc32Probe"),u=e("./nodejsUtils");function d(n){return new i.Promise(function(e,t){var r=n.decompressed.getContentWorker().pipe(new s);r.on("error",function(e){t(e)}).on("end",function(){r.streamInfo.crc32!==n.decompressed.crc32?t(new Error("Corrupted zip : CRC32 mismatch")):e()}).resume()})}t.exports=function(e,s){var o=this;return s=n.extend(s||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:a.utf8decode}),u.isNode&&u.isStream(e)?i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):n.prepareContent("the loaded zip file",e,!0,s.optimizedBinaryString,s.base64).then(function(e){var t=new f(s);return t.load(e),t}).then(function(e){var t=[i.Promise.resolve(e)],r=e.files;if(s.checkCRC32)for(var n=0;n<r.length;n++)t.push(d(r[n]));return i.Promise.all(t)}).then(function(e){for(var t=e.shift(),r=t.files,n=0;n<r.length;n++){var i=r[n];o.file(i.fileNameStr,i.decompressed,{binary:!0,optimizedBinaryString:!0,date:i.date,dir:i.dir,comment:i.fileCommentStr.length?i.fileCommentStr:null,unixPermissions:i.unixPermissions,dosPermissions:i.dosPermissions,createFolders:s.createFolders})}return t.zipComment.length&&(o.comment=t.zipComment),o})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../stream/GenericWorker");function s(e,t){i.call(this,"Nodejs stream input adapter for "+e),this._upstreamEnded=!1,this._bindStream(t)}n.inherits(s,i),s.prototype._bindStream=function(e){var t=this;(this._stream=e).pause(),e.on("data",function(e){t.push({data:e,meta:{percent:0}})}).on("error",function(e){t.isPaused?this.generatedError=e:t.error(e)}).on("end",function(){t.isPaused?t._upstreamEnded=!0:t.end()})},s.prototype.pause=function(){return!!i.prototype.pause.call(this)&&(this._stream.pause(),!0)},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},t.exports=s},{"../stream/GenericWorker":28,"../utils":32}],13:[function(e,t,r){"use strict";var i=e("readable-stream").Readable;function n(e,t,r){i.call(this,t),this._helper=e;var n=this;e.on("data",function(e,t){n.push(e)||n._helper.pause(),r&&r(t)}).on("error",function(e){n.emit("error",e)}).on("end",function(){n.push(null)})}e("../utils").inherits(n,i),n.prototype._read=function(){this._helper.resume()},t.exports=n},{"../utils":32,"readable-stream":16}],14:[function(e,t,r){"use strict";t.exports={isNode:"undefined"!=typeof Buffer,newBufferFrom:function(e,t){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(e,t);if("number"==typeof e)throw new Error('The "data" argument must not be a number');return new Buffer(e,t)},allocBuffer:function(e){if(Buffer.alloc)return Buffer.alloc(e);var t=new Buffer(e);return t.fill(0),t},isBuffer:function(e){return Buffer.isBuffer(e)},isStream:function(e){return e&&"function"==typeof e.on&&"function"==typeof e.pause&&"function"==typeof e.resume}}},{}],15:[function(e,t,r){"use strict";function s(e,t,r){var n,i=d.getTypeOf(t),s=d.extend(r||{},l);s.date=s.date||new Date,null!==s.compression&&(s.compression=s.compression.toUpperCase()),"string"==typeof s.unixPermissions&&(s.unixPermissions=parseInt(s.unixPermissions,8)),s.unixPermissions&&16384&s.unixPermissions&&(s.dir=!0),s.dosPermissions&&16&s.dosPermissions&&(s.dir=!0),s.dir&&(e=u(e)),s.createFolders&&(n=function(e){"/"===e.slice(-1)&&(e=e.substring(0,e.length-1));var t=e.lastIndexOf("/");return 0<t?e.substring(0,t):""}(e))&&w.call(this,n,!0);var o,a="string"===i&&!1===s.binary&&!1===s.base64;r&&void 0!==r.binary||(s.binary=!a),(t instanceof c&&0===t.uncompressedSize||s.dir||!t||0===t.length)&&(s.base64=!1,s.binary=!0,t="",s.compression="STORE",i="string"),o=t instanceof c||t instanceof h?t:m.isNode&&m.isStream(t)?new _(e,t):d.prepareContent(e,t,s.binary,s.optimizedBinaryString,s.base64);var f=new p(e,o,s);this.files[e]=f}function u(e){return"/"!==e.slice(-1)&&(e+="/"),e}var i=e("./utf8"),d=e("./utils"),h=e("./stream/GenericWorker"),o=e("./stream/StreamHelper"),l=e("./defaults"),c=e("./compressedObject"),p=e("./zipObject"),a=e("./generate"),m=e("./nodejsUtils"),_=e("./nodejs/NodejsStreamInputAdapter"),w=function(e,t){return t=void 0!==t?t:l.createFolders,e=u(e),this.files[e]||s.call(this,e,null,{dir:!0,createFolders:t}),this.files[e]};function f(e){return"[object RegExp]"===Object.prototype.toString.call(e)}var n={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(e){var t,r,n;for(t in this.files)this.files.hasOwnProperty(t)&&(n=this.files[t],(r=t.slice(this.root.length,t.length))&&t.slice(0,this.root.length)===this.root&&e(r,n))},filter:function(r){var n=[];return this.forEach(function(e,t){r(e,t)&&n.push(t)}),n},file:function(e,t,r){if(1!==arguments.length)return e=this.root+e,s.call(this,e,t,r),this;if(f(e)){var n=e;return this.filter(function(e,t){return!t.dir&&n.test(e)})}var i=this.files[this.root+e];return i&&!i.dir?i:null},folder:function(r){if(!r)return this;if(f(r))return this.filter(function(e,t){return t.dir&&r.test(e)});var e=this.root+r,t=w.call(this,e),n=this.clone();return n.root=t.name,n},remove:function(r){r=this.root+r;var e=this.files[r];if(e||("/"!==r.slice(-1)&&(r+="/"),e=this.files[r]),e&&!e.dir)delete this.files[r];else for(var t=this.filter(function(e,t){return t.name.slice(0,r.length)===r}),n=0;n<t.length;n++)delete this.files[t[n].name];return this},generate:function(e){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(e){var t,r={};try{if((r=d.extend(e||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:i.utf8encode})).type=r.type.toLowerCase(),r.compression=r.compression.toUpperCase(),"binarystring"===r.type&&(r.type="string"),!r.type)throw new Error("No output type specified.");d.checkSupport(r.type),"darwin"!==r.platform&&"freebsd"!==r.platform&&"linux"!==r.platform&&"sunos"!==r.platform||(r.platform="UNIX"),"win32"===r.platform&&(r.platform="DOS");var n=r.comment||this.comment||"";t=a.generateWorker(this,r,n)}catch(e){(t=new h("error")).error(e)}return new o(t,r.type||"string",r.mimeType)},generateAsync:function(e,t){return this.generateInternalStream(e).accumulate(t)},generateNodeStream:function(e,t){return(e=e||{}).type||(e.type="nodebuffer"),this.generateInternalStream(e).toNodejsStream(t)}};t.exports=n},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(e,t,r){t.exports=e("stream")},{stream:void 0}],17:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e);for(var t=0;t<this.data.length;t++)e[t]=255&e[t]}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data[this.zero+e]},i.prototype.lastIndexOfSignature=function(e){for(var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.length-4;0<=s;--s)if(this.data[s]===t&&this.data[s+1]===r&&this.data[s+2]===n&&this.data[s+3]===i)return s-this.zero;return-1},i.prototype.readAndCheckSignature=function(e){var t=e.charCodeAt(0),r=e.charCodeAt(1),n=e.charCodeAt(2),i=e.charCodeAt(3),s=this.readData(4);return t===s[0]&&r===s[1]&&n===s[2]&&i===s[3]},i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return[];var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],18:[function(e,t,r){"use strict";var n=e("../utils");function i(e){this.data=e,this.length=e.length,this.index=0,this.zero=0}i.prototype={checkOffset:function(e){this.checkIndex(this.index+e)},checkIndex:function(e){if(this.length<this.zero+e||e<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+e+"). Corrupted zip ?")},setIndex:function(e){this.checkIndex(e),this.index=e},skip:function(e){this.setIndex(this.index+e)},byteAt:function(e){},readInt:function(e){var t,r=0;for(this.checkOffset(e),t=this.index+e-1;t>=this.index;t--)r=(r<<8)+this.byteAt(t);return this.index+=e,r},readString:function(e){return n.transformTo("string",this.readData(e))},readData:function(e){},lastIndexOfSignature:function(e){},readAndCheckSignature:function(e){},readDate:function(){var e=this.readInt(4);return new Date(Date.UTC(1980+(e>>25&127),(e>>21&15)-1,e>>16&31,e>>11&31,e>>5&63,(31&e)<<1))}},t.exports=i},{"../utils":32}],19:[function(e,t,r){"use strict";var n=e("./Uint8ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(e,t,r){"use strict";var n=e("./DataReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.byteAt=function(e){return this.data.charCodeAt(this.zero+e)},i.prototype.lastIndexOfSignature=function(e){return this.data.lastIndexOf(e)-this.zero},i.prototype.readAndCheckSignature=function(e){return e===this.readData(4)},i.prototype.readData=function(e){this.checkOffset(e);var t=this.data.slice(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./DataReader":18}],21:[function(e,t,r){"use strict";var n=e("./ArrayReader");function i(e){n.call(this,e)}e("../utils").inherits(i,n),i.prototype.readData=function(e){if(this.checkOffset(e),0===e)return new Uint8Array(0);var t=this.data.subarray(this.zero+this.index,this.zero+this.index+e);return this.index+=e,t},t.exports=i},{"../utils":32,"./ArrayReader":17}],22:[function(e,t,r){"use strict";var n=e("../utils"),i=e("../support"),s=e("./ArrayReader"),o=e("./StringReader"),a=e("./NodeBufferReader"),f=e("./Uint8ArrayReader");t.exports=function(e){var t=n.getTypeOf(e);return n.checkSupport(t),"string"!==t||i.uint8array?"nodebuffer"===t?new a(e):i.uint8array?new f(n.transformTo("uint8array",e)):new s(n.transformTo("array",e)):new o(e)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(e,t,r){"use strict";r.LOCAL_FILE_HEADER="PK",r.CENTRAL_FILE_HEADER="PK",r.CENTRAL_DIRECTORY_END="PK",r.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",r.ZIP64_CENTRAL_DIRECTORY_END="PK",r.DATA_DESCRIPTOR="PK\b"},{}],24:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../utils");function s(e){n.call(this,"ConvertWorker to "+e),this.destType=e}i.inherits(s,n),s.prototype.processChunk=function(e){this.push({data:i.transformTo(this.destType,e.data),meta:e.meta})},t.exports=s},{"../utils":32,"./GenericWorker":28}],25:[function(e,t,r){"use strict";var n=e("./GenericWorker"),i=e("../crc32");function s(){n.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}e("../utils").inherits(s,n),s.prototype.processChunk=function(e){this.streamInfo.crc32=i(e.data,this.streamInfo.crc32||0),this.push(e)},t.exports=s},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataLengthProbe for "+e),this.propName=e,this.withStreamInfo(e,0)}n.inherits(s,i),s.prototype.processChunk=function(e){if(e){var t=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=t+e.data.length}i.prototype.processChunk.call(this,e)},t.exports=s},{"../utils":32,"./GenericWorker":28}],27:[function(e,t,r){"use strict";var n=e("../utils"),i=e("./GenericWorker");function s(e){i.call(this,"DataWorker");var t=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,e.then(function(e){t.dataIsReady=!0,t.data=e,t.max=e&&e.length||0,t.type=n.getTypeOf(e),t.isPaused||t._tickAndRepeat()},function(e){t.error(e)})}n.inherits(s,i),s.prototype.cleanUp=function(){i.prototype.cleanUp.call(this),this.data=null},s.prototype.resume=function(){return!!i.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,n.delay(this._tickAndRepeat,[],this)),!0)},s.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(n.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},s.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var e=null,t=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":e=this.data.substring(this.index,t);break;case"uint8array":e=this.data.subarray(this.index,t);break;case"array":case"nodebuffer":e=this.data.slice(this.index,t)}return this.index=t,this.push({data:e,meta:{percent:this.max?this.index/this.max*100:0}})},t.exports=s},{"../utils":32,"./GenericWorker":28}],28:[function(e,t,r){"use strict";function n(e){this.name=e||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}n.prototype={push:function(e){this.emit("data",e)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(e){this.emit("error",e)}return!0},error:function(e){return!this.isFinished&&(this.isPaused?this.generatedError=e:(this.isFinished=!0,this.emit("error",e),this.previous&&this.previous.error(e),this.cleanUp()),!0)},on:function(e,t){return this._listeners[e].push(t),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(e,t){if(this._listeners[e])for(var r=0;r<this._listeners[e].length;r++)this._listeners[e][r].call(this,t)},pipe:function(e){return e.registerPrevious(this)},registerPrevious:function(e){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=e.streamInfo,this.mergeStreamInfo(),this.previous=e;var t=this;return e.on("data",function(e){t.processChunk(e)}),e.on("end",function(){t.end()}),e.on("error",function(e){t.error(e)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var e=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),e=!0),this.previous&&this.previous.resume(),!e},flush:function(){},processChunk:function(e){this.push(e)},withStreamInfo:function(e,t){return this.extraStreamInfo[e]=t,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var e in this.extraStreamInfo)this.extraStreamInfo.hasOwnProperty(e)&&(this.streamInfo[e]=this.extraStreamInfo[e])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var e="Worker "+this.name;return this.previous?this.previous+" -> "+e:e}},t.exports=n},{}],29:[function(e,t,r){"use strict";var u=e("../utils"),i=e("./ConvertWorker"),s=e("./GenericWorker"),d=e("../base64"),n=e("../support"),o=e("../external"),a=null;if(n.nodestream)try{a=e("../nodejs/NodejsStreamOutputAdapter")}catch(e){}function f(e,t,r){var n=t;switch(t){case"blob":case"arraybuffer":n="uint8array";break;case"base64":n="string"}try{this._internalType=n,this._outputType=t,this._mimeType=r,u.checkSupport(n),this._worker=e.pipe(new i(n)),e.lock()}catch(e){this._worker=new s("error"),this._worker.error(e)}}f.prototype={accumulate:function(e){return a=this,f=e,new o.Promise(function(t,r){var n=[],i=a._internalType,s=a._outputType,o=a._mimeType;a.on("data",function(e,t){n.push(e),f&&f(t)}).on("error",function(e){n=[],r(e)}).on("end",function(){try{var e=function(e,t,r){switch(e){case"blob":return u.newBlob(u.transformTo("arraybuffer",t),r);case"base64":return d.encode(t);default:return u.transformTo(e,t)}}(s,function(e,t){var r,n=0,i=null,s=0;for(r=0;r<t.length;r++)s+=t[r].length;switch(e){case"string":return t.join("");case"array":return Array.prototype.concat.apply([],t);case"uint8array":for(i=new Uint8Array(s),r=0;r<t.length;r++)i.set(t[r],n),n+=t[r].length;return i;case"nodebuffer":return Buffer.concat(t);default:throw new Error("concat : unsupported type '"+e+"'")}}(i,n),o);t(e)}catch(e){r(e)}n=[]}).resume()});var a,f},on:function(e,t){var r=this;return"data"===e?this._worker.on(e,function(e){t.call(r,e.data,e.meta)}):this._worker.on(e,function(){u.delay(t,arguments,r)}),this},resume:function(){return u.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(e){if(u.checkSupport("nodestream"),"nodebuffer"!==this._outputType)throw new Error(this._outputType+" is not supported by this method");return new a(this,{objectMode:"nodebuffer"!==this._outputType},e)}},t.exports=f},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(e,t,r){"use strict";if(r.base64=!0,r.array=!0,r.string=!0,r.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,r.nodebuffer="undefined"!=typeof Buffer,r.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)r.blob=!1;else{var n=new ArrayBuffer(0);try{r.blob=0===new Blob([n],{type:"application/zip"}).size}catch(e){try{var i=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);i.append(n),r.blob=0===i.getBlob("application/zip").size}catch(e){r.blob=!1}}}try{r.nodestream=!!e("readable-stream").Readable}catch(e){r.nodestream=!1}},{"readable-stream":16}],31:[function(e,t,s){"use strict";for(var a=e("./utils"),f=e("./support"),r=e("./nodejsUtils"),n=e("./stream/GenericWorker"),u=new Array(256),i=0;i<256;i++)u[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;function o(){n.call(this,"utf-8 decode"),this.leftOver=null}function d(){n.call(this,"utf-8 encode")}u[254]=u[254]=1,s.utf8encode=function(e){return f.nodebuffer?r.newBufferFrom(e,"utf-8"):function(e){var t,r,n,i,s,o=e.length,a=0;for(i=0;i<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<o&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),a+=r<128?1:r<2048?2:r<65536?3:4;for(t=f.uint8array?new Uint8Array(a):new Array(a),i=s=0;s<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<o&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t}(e)},s.utf8decode=function(e){return f.nodebuffer?a.transformTo("nodebuffer",e).toString("utf-8"):function(e){var t,r,n,i,s=e.length,o=new Array(2*s);for(t=r=0;t<s;)if((n=e[t++])<128)o[r++]=n;else if(4<(i=u[n]))o[r++]=65533,t+=i-1;else{for(n&=2===i?31:3===i?15:7;1<i&&t<s;)n=n<<6|63&e[t++],i--;1<i?o[r++]=65533:n<65536?o[r++]=n:(n-=65536,o[r++]=55296|n>>10&1023,o[r++]=56320|1023&n)}return o.length!==r&&(o.subarray?o=o.subarray(0,r):o.length=r),a.applyFromCharCode(o)}(e=a.transformTo(f.uint8array?"uint8array":"array",e))},a.inherits(o,n),o.prototype.processChunk=function(e){var t=a.transformTo(f.uint8array?"uint8array":"array",e.data);if(this.leftOver&&this.leftOver.length){if(f.uint8array){var r=t;(t=new Uint8Array(r.length+this.leftOver.length)).set(this.leftOver,0),t.set(r,this.leftOver.length)}else t=this.leftOver.concat(t);this.leftOver=null}var n=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}(t),i=t;n!==t.length&&(f.uint8array?(i=t.subarray(0,n),this.leftOver=t.subarray(n,t.length)):(i=t.slice(0,n),this.leftOver=t.slice(n,t.length))),this.push({data:s.utf8decode(i),meta:e.meta})},o.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},s.Utf8DecodeWorker=o,a.inherits(d,n),d.prototype.processChunk=function(e){this.push({data:s.utf8encode(e.data),meta:e.meta})},s.Utf8EncodeWorker=d},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(e,t,a){"use strict";var f=e("./support"),u=e("./base64"),r=e("./nodejsUtils"),n=e("set-immediate-shim"),d=e("./external");function i(e){return e}function h(e,t){for(var r=0;r<e.length;++r)t[r]=255&e.charCodeAt(r);return t}a.newBlob=function(t,r){a.checkSupport("blob");try{return new Blob([t],{type:r})}catch(e){try{var n=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return n.append(t),n.getBlob(r)}catch(e){throw new Error("Bug : can't construct the Blob.")}}};var s={stringifyByChunk:function(e,t,r){var n=[],i=0,s=e.length;if(s<=r)return String.fromCharCode.apply(null,e);for(;i<s;)"array"===t||"nodebuffer"===t?n.push(String.fromCharCode.apply(null,e.slice(i,Math.min(i+r,s)))):n.push(String.fromCharCode.apply(null,e.subarray(i,Math.min(i+r,s)))),i+=r;return n.join("")},stringifyByChar:function(e){for(var t="",r=0;r<e.length;r++)t+=String.fromCharCode(e[r]);return t},applyCanBeUsed:{uint8array:function(){try{return f.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(e){return!1}}(),nodebuffer:function(){try{return f.nodebuffer&&1===String.fromCharCode.apply(null,r.allocBuffer(1)).length}catch(e){return!1}}()}};function o(e){var t=65536,r=a.getTypeOf(e),n=!0;if("uint8array"===r?n=s.applyCanBeUsed.uint8array:"nodebuffer"===r&&(n=s.applyCanBeUsed.nodebuffer),n)for(;1<t;)try{return s.stringifyByChunk(e,r,t)}catch(e){t=Math.floor(t/2)}return s.stringifyByChar(e)}function l(e,t){for(var r=0;r<e.length;r++)t[r]=e[r];return t}a.applyFromCharCode=o;var c={};c.string={string:i,array:function(e){return h(e,new Array(e.length))},arraybuffer:function(e){return c.string.uint8array(e).buffer},uint8array:function(e){return h(e,new Uint8Array(e.length))},nodebuffer:function(e){return h(e,r.allocBuffer(e.length))}},c.array={string:o,array:i,arraybuffer:function(e){return new Uint8Array(e).buffer},uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(e)}},c.arraybuffer={string:function(e){return o(new Uint8Array(e))},array:function(e){return l(new Uint8Array(e),new Array(e.byteLength))},arraybuffer:i,uint8array:function(e){return new Uint8Array(e)},nodebuffer:function(e){return r.newBufferFrom(new Uint8Array(e))}},c.uint8array={string:o,array:function(e){return l(e,new Array(e.length))},arraybuffer:function(e){return e.buffer},uint8array:i,nodebuffer:function(e){return r.newBufferFrom(e)}},c.nodebuffer={string:o,array:function(e){return l(e,new Array(e.length))},arraybuffer:function(e){return c.nodebuffer.uint8array(e).buffer},uint8array:function(e){return l(e,new Uint8Array(e.length))},nodebuffer:i},a.transformTo=function(e,t){if(t=t||"",!e)return t;a.checkSupport(e);var r=a.getTypeOf(t);return c[r][e](t)},a.getTypeOf=function(e){return"string"==typeof e?"string":"[object Array]"===Object.prototype.toString.call(e)?"array":f.nodebuffer&&r.isBuffer(e)?"nodebuffer":f.uint8array&&e instanceof Uint8Array?"uint8array":f.arraybuffer&&e instanceof ArrayBuffer?"arraybuffer":void 0},a.checkSupport=function(e){if(!f[e.toLowerCase()])throw new Error(e+" is not supported by this platform")},a.MAX_VALUE_16BITS=65535,a.MAX_VALUE_32BITS=-1,a.pretty=function(e){var t,r,n="";for(r=0;r<(e||"").length;r++)n+="\\x"+((t=e.charCodeAt(r))<16?"0":"")+t.toString(16).toUpperCase();return n},a.delay=function(e,t,r){n(function(){e.apply(r||null,t||[])})},a.inherits=function(e,t){function r(){}r.prototype=t.prototype,e.prototype=new r},a.extend=function(){var e,t,r={};for(e=0;e<arguments.length;e++)for(t in arguments[e])arguments[e].hasOwnProperty(t)&&void 0===r[t]&&(r[t]=arguments[e][t]);return r},a.prepareContent=function(n,e,i,s,o){return d.Promise.resolve(e).then(function(n){return f.blob&&(n instanceof Blob||-1!==["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(n)))&&"undefined"!=typeof FileReader?new d.Promise(function(t,r){var e=new FileReader;e.onload=function(e){t(e.target.result)},e.onerror=function(e){r(e.target.error)},e.readAsArrayBuffer(n)}):n}).then(function(e){var t,r=a.getTypeOf(e);return r?("arraybuffer"===r?e=a.transformTo("uint8array",e):"string"===r&&(o?e=u.decode(e):i&&!0!==s&&(e=h(t=e,f.uint8array?new Uint8Array(t.length):new Array(t.length)))),e):d.Promise.reject(new Error("Can't read the data of '"+n+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,"set-immediate-shim":54}],33:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),i=e("./utils"),s=e("./signature"),o=e("./zipEntry"),a=(e("./utf8"),e("./support"));function f(e){this.files=[],this.loadOptions=e}f.prototype={checkSignature:function(e){if(!this.reader.readAndCheckSignature(e)){this.reader.index-=4;var t=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+i.pretty(t)+", expected "+i.pretty(e)+")")}},isSignature:function(e,t){var r=this.reader.index;this.reader.setIndex(e);var n=this.reader.readString(4)===t;return this.reader.setIndex(r),n},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var e=this.reader.readData(this.zipCommentLength),t=a.uint8array?"uint8array":"array",r=i.transformTo(t,e);this.zipComment=this.loadOptions.decodeFileName(r)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var e,t,r,n=this.zip64EndOfCentralSize-44;0<n;)e=this.reader.readInt(2),t=this.reader.readInt(4),r=this.reader.readData(t),this.zip64ExtensibleData[e]={id:e,length:t,value:r}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var e,t;for(e=0;e<this.files.length;e++)t=this.files[e],this.reader.setIndex(t.localHeaderOffset),this.checkSignature(s.LOCAL_FILE_HEADER),t.readLocalPart(this.reader),t.handleUTF8(),t.processAttributes()},readCentralDir:function(){var e;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER);)(e=new o({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(e);if(this.centralDirRecords!==this.files.length&&0!==this.centralDirRecords&&0===this.files.length)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var e=this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);if(e<0)throw this.isSignature(0,s.LOCAL_FILE_HEADER)?new Error("Corrupted zip: can't find end of central directory"):new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");this.reader.setIndex(e);var t=e;if(this.checkSignature(s.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===i.MAX_VALUE_16BITS||this.diskWithCentralDirStart===i.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===i.MAX_VALUE_16BITS||this.centralDirRecords===i.MAX_VALUE_16BITS||this.centralDirSize===i.MAX_VALUE_32BITS||this.centralDirOffset===i.MAX_VALUE_32BITS){if(this.zip64=!0,(e=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(e),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,s.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var r=this.centralDirOffset+this.centralDirSize;this.zip64&&(r+=20,r+=12+this.zip64EndOfCentralSize);var n=t-r;if(0<n)this.isSignature(t,s.CENTRAL_FILE_HEADER)||(this.reader.zero=n);else if(n<0)throw new Error("Corrupted zip: missing "+Math.abs(n)+" bytes.")},prepareReader:function(e){this.reader=n(e)},load:function(e){this.prepareReader(e),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},t.exports=f},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utf8":31,"./utils":32,"./zipEntry":34}],34:[function(e,t,r){"use strict";var n=e("./reader/readerFor"),s=e("./utils"),i=e("./compressedObject"),o=e("./crc32"),a=e("./utf8"),f=e("./compressions"),u=e("./support");function d(e,t){this.options=e,this.loadOptions=t}d.prototype={isEncrypted:function(){return 1==(1&this.bitFlag)},useUTF8:function(){return 2048==(2048&this.bitFlag)},readLocalPart:function(e){var t,r;if(e.skip(22),this.fileNameLength=e.readInt(2),r=e.readInt(2),this.fileName=e.readData(this.fileNameLength),e.skip(r),-1===this.compressedSize||-1===this.uncompressedSize)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if(null===(t=function(e){for(var t in f)if(f.hasOwnProperty(t)&&f[t].magic===e)return f[t];return null}(this.compressionMethod)))throw new Error("Corrupted zip : compression "+s.pretty(this.compressionMethod)+" unknown (inner file : "+s.transformTo("string",this.fileName)+")");this.decompressed=new i(this.compressedSize,this.uncompressedSize,this.crc32,t,e.readData(this.compressedSize))},readCentralPart:function(e){this.versionMadeBy=e.readInt(2),e.skip(2),this.bitFlag=e.readInt(2),this.compressionMethod=e.readString(2),this.date=e.readDate(),this.crc32=e.readInt(4),this.compressedSize=e.readInt(4),this.uncompressedSize=e.readInt(4);var t=e.readInt(2);if(this.extraFieldsLength=e.readInt(2),this.fileCommentLength=e.readInt(2),this.diskNumberStart=e.readInt(2),this.internalFileAttributes=e.readInt(2),this.externalFileAttributes=e.readInt(4),this.localHeaderOffset=e.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");e.skip(t),this.readExtraFields(e),this.parseZIP64ExtraField(e),this.fileComment=e.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var e=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),0==e&&(this.dosPermissions=63&this.externalFileAttributes),3==e&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileNameStr.slice(-1)||(this.dir=!0)},parseZIP64ExtraField:function(e){if(this.extraFields[1]){var t=n(this.extraFields[1].value);this.uncompressedSize===s.MAX_VALUE_32BITS&&(this.uncompressedSize=t.readInt(8)),this.compressedSize===s.MAX_VALUE_32BITS&&(this.compressedSize=t.readInt(8)),this.localHeaderOffset===s.MAX_VALUE_32BITS&&(this.localHeaderOffset=t.readInt(8)),this.diskNumberStart===s.MAX_VALUE_32BITS&&(this.diskNumberStart=t.readInt(4))}},readExtraFields:function(e){var t,r,n,i=e.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});e.index+4<i;)t=e.readInt(2),r=e.readInt(2),n=e.readData(r),this.extraFields[t]={id:t,length:r,value:n};e.setIndex(i)},handleUTF8:function(){var e=u.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=a.utf8decode(this.fileName),this.fileCommentStr=a.utf8decode(this.fileComment);else{var t=this.findExtraFieldUnicodePath();if(null!==t)this.fileNameStr=t;else{var r=s.transformTo(e,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(r)}var n=this.findExtraFieldUnicodeComment();if(null!==n)this.fileCommentStr=n;else{var i=s.transformTo(e,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(i)}}},findExtraFieldUnicodePath:function(){var e=this.extraFields[28789];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:o(this.fileName)!==t.readInt(4)?null:a.utf8decode(t.readData(e.length-5))}return null},findExtraFieldUnicodeComment:function(){var e=this.extraFields[25461];if(e){var t=n(e.value);return 1!==t.readInt(1)?null:o(this.fileComment)!==t.readInt(4)?null:a.utf8decode(t.readData(e.length-5))}return null}},t.exports=d},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(e,t,r){"use strict";function n(e,t,r){this.name=e,this.dir=r.dir,this.date=r.date,this.comment=r.comment,this.unixPermissions=r.unixPermissions,this.dosPermissions=r.dosPermissions,this._data=t,this._dataBinary=r.binary,this.options={compression:r.compression,compressionOptions:r.compressionOptions}}var s=e("./stream/StreamHelper"),i=e("./stream/DataWorker"),o=e("./utf8"),a=e("./compressedObject"),f=e("./stream/GenericWorker");n.prototype={internalStream:function(e){var t=null,r="string";try{if(!e)throw new Error("No output type specified.");var n="string"===(r=e.toLowerCase())||"text"===r;"binarystring"!==r&&"text"!==r||(r="string"),t=this._decompressWorker();var i=!this._dataBinary;i&&!n&&(t=t.pipe(new o.Utf8EncodeWorker)),!i&&n&&(t=t.pipe(new o.Utf8DecodeWorker))}catch(e){(t=new f("error")).error(e)}return new s(t,r,"")},async:function(e,t){return this.internalStream(e).accumulate(t)},nodeStream:function(e,t){return this.internalStream(e||"nodebuffer").toNodejsStream(t)},_compressWorker:function(e,t){if(this._data instanceof a&&this._data.compression.magic===e.magic)return this._data.getCompressedWorker();var r=this._decompressWorker();return this._dataBinary||(r=r.pipe(new o.Utf8EncodeWorker)),a.createWorkerFrom(r,e,t)},_decompressWorker:function(){return this._data instanceof a?this._data.getContentWorker():this._data instanceof f?this._data:new i(this._data)}};for(var u=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],d=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},h=0;h<u.length;h++)n.prototype[u[h]]=d;t.exports=n},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(e,d,t){(function(t){"use strict";var r,n,e=t.MutationObserver||t.WebKitMutationObserver;if(e){var i=0,s=new e(u),o=t.document.createTextNode("");s.observe(o,{characterData:!0}),r=function(){o.data=i=++i%2}}else if(t.setImmediate||void 0===t.MessageChannel)r="document"in t&&"onreadystatechange"in t.document.createElement("script")?function(){var e=t.document.createElement("script");e.onreadystatechange=function(){u(),e.onreadystatechange=null,e.parentNode.removeChild(e),e=null},t.document.documentElement.appendChild(e)}:function(){setTimeout(u,0)};else{var a=new t.MessageChannel;a.port1.onmessage=u,r=function(){a.port2.postMessage(0)}}var f=[];function u(){var e,t;n=!0;for(var r=f.length;r;){for(t=f,f=[],e=-1;++e<r;)t[e]();r=f.length}n=!1}d.exports=function(e){1!==f.push(e)||n||r()}}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],37:[function(e,t,r){"use strict";var i=e("immediate");function u(){}var d={},s=["REJECTED"],o=["FULFILLED"],n=["PENDING"];function a(e){if("function"!=typeof e)throw new TypeError("resolver must be a function");this.state=n,this.queue=[],this.outcome=void 0,e!==u&&c(this,e)}function f(e,t,r){this.promise=e,"function"==typeof t&&(this.onFulfilled=t,this.callFulfilled=this.otherCallFulfilled),"function"==typeof r&&(this.onRejected=r,this.callRejected=this.otherCallRejected)}function h(t,r,n){i(function(){var e;try{e=r(n)}catch(e){return d.reject(t,e)}e===t?d.reject(t,new TypeError("Cannot resolve promise with itself")):d.resolve(t,e)})}function l(e){var t=e&&e.then;if(e&&("object"==typeof e||"function"==typeof e)&&"function"==typeof t)return function(){t.apply(e,arguments)}}function c(t,e){var r=!1;function n(e){r||(r=!0,d.reject(t,e))}function i(e){r||(r=!0,d.resolve(t,e))}var s=p(function(){e(i,n)});"error"===s.status&&n(s.value)}function p(e,t){var r={};try{r.value=e(t),r.status="success"}catch(e){r.status="error",r.value=e}return r}(t.exports=a).prototype.finally=function(t){if("function"!=typeof t)return this;var r=this.constructor;return this.then(function(e){return r.resolve(t()).then(function(){return e})},function(e){return r.resolve(t()).then(function(){throw e})})},a.prototype.catch=function(e){return this.then(null,e)},a.prototype.then=function(e,t){if("function"!=typeof e&&this.state===o||"function"!=typeof t&&this.state===s)return this;var r=new this.constructor(u);return this.state!==n?h(r,this.state===o?e:t,this.outcome):this.queue.push(new f(r,e,t)),r},f.prototype.callFulfilled=function(e){d.resolve(this.promise,e)},f.prototype.otherCallFulfilled=function(e){h(this.promise,this.onFulfilled,e)},f.prototype.callRejected=function(e){d.reject(this.promise,e)},f.prototype.otherCallRejected=function(e){h(this.promise,this.onRejected,e)},d.resolve=function(e,t){var r=p(l,t);if("error"===r.status)return d.reject(e,r.value);var n=r.value;if(n)c(e,n);else{e.state=o,e.outcome=t;for(var i=-1,s=e.queue.length;++i<s;)e.queue[i].callFulfilled(t)}return e},d.reject=function(e,t){e.state=s,e.outcome=t;for(var r=-1,n=e.queue.length;++r<n;)e.queue[r].callRejected(t);return e},a.resolve=function(e){return e instanceof this?e:d.resolve(new this(u),e)},a.reject=function(e){var t=new this(u);return d.reject(t,e)},a.all=function(e){var r=this;if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var n=e.length,i=!1;if(!n)return this.resolve([]);for(var s=new Array(n),o=0,t=-1,a=new this(u);++t<n;)f(e[t],t);return a;function f(e,t){r.resolve(e).then(function(e){s[t]=e,++o!==n||i||(i=!0,d.resolve(a,s))},function(e){i||(i=!0,d.reject(a,e))})}},a.race=function(e){if("[object Array]"!==Object.prototype.toString.call(e))return this.reject(new TypeError("must be an array"));var t=e.length,r=!1;if(!t)return this.resolve([]);for(var n,i=-1,s=new this(u);++i<t;)n=e[i],this.resolve(n).then(function(e){r||(r=!0,d.resolve(s,e))},function(e){r||(r=!0,d.reject(s,e))});return s}},{immediate:36}],38:[function(e,t,r){"use strict";var n={};(0,e("./lib/utils/common").assign)(n,e("./lib/deflate"),e("./lib/inflate"),e("./lib/zlib/constants")),t.exports=n},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(e,t,r){"use strict";var o=e("./zlib/deflate"),a=e("./utils/common"),f=e("./utils/strings"),i=e("./zlib/messages"),s=e("./zlib/zstream"),u=Object.prototype.toString,d=0,h=-1,l=0,c=8;function p(e){if(!(this instanceof p))return new p(e);this.options=a.assign({level:h,method:c,chunkSize:16384,windowBits:15,memLevel:8,strategy:l,to:""},e||{});var t=this.options;t.raw&&0<t.windowBits?t.windowBits=-t.windowBits:t.gzip&&0<t.windowBits&&t.windowBits<16&&(t.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new s,this.strm.avail_out=0;var r=o.deflateInit2(this.strm,t.level,t.method,t.windowBits,t.memLevel,t.strategy);if(r!==d)throw new Error(i[r]);if(t.header&&o.deflateSetHeader(this.strm,t.header),t.dictionary){var n;if(n="string"==typeof t.dictionary?f.string2buf(t.dictionary):"[object ArrayBuffer]"===u.call(t.dictionary)?new Uint8Array(t.dictionary):t.dictionary,(r=o.deflateSetDictionary(this.strm,n))!==d)throw new Error(i[r]);this._dict_set=!0}}function n(e,t){var r=new p(t);if(r.push(e,!0),r.err)throw r.msg||i[r.err];return r.result}p.prototype.push=function(e,t){var r,n,i=this.strm,s=this.options.chunkSize;if(this.ended)return!1;n=t===~~t?t:!0===t?4:0,"string"==typeof e?i.input=f.string2buf(e):"[object ArrayBuffer]"===u.call(e)?i.input=new Uint8Array(e):i.input=e,i.next_in=0,i.avail_in=i.input.length;do{if(0===i.avail_out&&(i.output=new a.Buf8(s),i.next_out=0,i.avail_out=s),1!==(r=o.deflate(i,n))&&r!==d)return this.onEnd(r),!(this.ended=!0);0!==i.avail_out&&(0!==i.avail_in||4!==n&&2!==n)||("string"===this.options.to?this.onData(f.buf2binstring(a.shrinkBuf(i.output,i.next_out))):this.onData(a.shrinkBuf(i.output,i.next_out)))}while((0<i.avail_in||0===i.avail_out)&&1!==r);return 4===n?(r=o.deflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===d):2!==n||(this.onEnd(d),!(i.avail_out=0))},p.prototype.onData=function(e){this.chunks.push(e)},p.prototype.onEnd=function(e){e===d&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=a.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Deflate=p,r.deflate=n,r.deflateRaw=function(e,t){return(t=t||{}).raw=!0,n(e,t)},r.gzip=function(e,t){return(t=t||{}).gzip=!0,n(e,t)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(e,t,r){"use strict";var l=e("./zlib/inflate"),c=e("./utils/common"),p=e("./utils/strings"),m=e("./zlib/constants"),n=e("./zlib/messages"),i=e("./zlib/zstream"),s=e("./zlib/gzheader"),_=Object.prototype.toString;function o(e){if(!(this instanceof o))return new o(e);this.options=c.assign({chunkSize:16384,windowBits:0,to:""},e||{});var t=this.options;t.raw&&0<=t.windowBits&&t.windowBits<16&&(t.windowBits=-t.windowBits,0===t.windowBits&&(t.windowBits=-15)),!(0<=t.windowBits&&t.windowBits<16)||e&&e.windowBits||(t.windowBits+=32),15<t.windowBits&&t.windowBits<48&&0==(15&t.windowBits)&&(t.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new i,this.strm.avail_out=0;var r=l.inflateInit2(this.strm,t.windowBits);if(r!==m.Z_OK)throw new Error(n[r]);this.header=new s,l.inflateGetHeader(this.strm,this.header)}function a(e,t){var r=new o(t);if(r.push(e,!0),r.err)throw r.msg||n[r.err];return r.result}o.prototype.push=function(e,t){var r,n,i,s,o,a,f=this.strm,u=this.options.chunkSize,d=this.options.dictionary,h=!1;if(this.ended)return!1;n=t===~~t?t:!0===t?m.Z_FINISH:m.Z_NO_FLUSH,"string"==typeof e?f.input=p.binstring2buf(e):"[object ArrayBuffer]"===_.call(e)?f.input=new Uint8Array(e):f.input=e,f.next_in=0,f.avail_in=f.input.length;do{if(0===f.avail_out&&(f.output=new c.Buf8(u),f.next_out=0,f.avail_out=u),(r=l.inflate(f,m.Z_NO_FLUSH))===m.Z_NEED_DICT&&d&&(a="string"==typeof d?p.string2buf(d):"[object ArrayBuffer]"===_.call(d)?new Uint8Array(d):d,r=l.inflateSetDictionary(this.strm,a)),r===m.Z_BUF_ERROR&&!0===h&&(r=m.Z_OK,h=!1),r!==m.Z_STREAM_END&&r!==m.Z_OK)return this.onEnd(r),!(this.ended=!0);f.next_out&&(0!==f.avail_out&&r!==m.Z_STREAM_END&&(0!==f.avail_in||n!==m.Z_FINISH&&n!==m.Z_SYNC_FLUSH)||("string"===this.options.to?(i=p.utf8border(f.output,f.next_out),s=f.next_out-i,o=p.buf2string(f.output,i),f.next_out=s,f.avail_out=u-s,s&&c.arraySet(f.output,f.output,i,s,0),this.onData(o)):this.onData(c.shrinkBuf(f.output,f.next_out)))),0===f.avail_in&&0===f.avail_out&&(h=!0)}while((0<f.avail_in||0===f.avail_out)&&r!==m.Z_STREAM_END);return r===m.Z_STREAM_END&&(n=m.Z_FINISH),n===m.Z_FINISH?(r=l.inflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===m.Z_OK):n!==m.Z_SYNC_FLUSH||(this.onEnd(m.Z_OK),!(f.avail_out=0))},o.prototype.onData=function(e){this.chunks.push(e)},o.prototype.onEnd=function(e){e===m.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=c.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},r.Inflate=o,r.inflate=a,r.inflateRaw=function(e,t){return(t=t||{}).raw=!0,a(e,t)},r.ungzip=a},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(e,t,r){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;r.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var r=t.shift();if(r){if("object"!=typeof r)throw new TypeError(r+"must be non-object");for(var n in r)r.hasOwnProperty(n)&&(e[n]=r[n])}}return e},r.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var i={arraySet:function(e,t,r,n,i){if(t.subarray&&e.subarray)e.set(t.subarray(r,r+n),i);else for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){var t,r,n,i,s,o;for(t=n=0,r=e.length;t<r;t++)n+=e[t].length;for(o=new Uint8Array(n),t=i=0,r=e.length;t<r;t++)s=e[t],o.set(s,i),i+=s.length;return o}},s={arraySet:function(e,t,r,n,i){for(var s=0;s<n;s++)e[i+s]=t[r+s]},flattenChunks:function(e){return[].concat.apply([],e)}};r.setTyped=function(e){e?(r.Buf8=Uint8Array,r.Buf16=Uint16Array,r.Buf32=Int32Array,r.assign(r,i)):(r.Buf8=Array,r.Buf16=Array,r.Buf32=Array,r.assign(r,s))},r.setTyped(n)},{}],42:[function(e,t,r){"use strict";var f=e("./common"),i=!0,s=!0;try{String.fromCharCode.apply(null,[0])}catch(e){i=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(e){s=!1}for(var u=new f.Buf8(256),n=0;n<256;n++)u[n]=252<=n?6:248<=n?5:240<=n?4:224<=n?3:192<=n?2:1;function d(e,t){if(t<65537&&(e.subarray&&s||!e.subarray&&i))return String.fromCharCode.apply(null,f.shrinkBuf(e,t));for(var r="",n=0;n<t;n++)r+=String.fromCharCode(e[n]);return r}u[254]=u[254]=1,r.string2buf=function(e){var t,r,n,i,s,o=e.length,a=0;for(i=0;i<o;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<o&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),a+=r<128?1:r<2048?2:r<65536?3:4;for(t=new f.Buf8(a),i=s=0;s<a;i++)55296==(64512&(r=e.charCodeAt(i)))&&i+1<o&&56320==(64512&(n=e.charCodeAt(i+1)))&&(r=65536+(r-55296<<10)+(n-56320),i++),r<128?t[s++]=r:(r<2048?t[s++]=192|r>>>6:(r<65536?t[s++]=224|r>>>12:(t[s++]=240|r>>>18,t[s++]=128|r>>>12&63),t[s++]=128|r>>>6&63),t[s++]=128|63&r);return t},r.buf2binstring=function(e){return d(e,e.length)},r.binstring2buf=function(e){for(var t=new f.Buf8(e.length),r=0,n=t.length;r<n;r++)t[r]=e.charCodeAt(r);return t},r.buf2string=function(e,t){var r,n,i,s,o=t||e.length,a=new Array(2*o);for(r=n=0;r<o;)if((i=e[r++])<128)a[n++]=i;else if(4<(s=u[i]))a[n++]=65533,r+=s-1;else{for(i&=2===s?31:3===s?15:7;1<s&&r<o;)i=i<<6|63&e[r++],s--;1<s?a[n++]=65533:i<65536?a[n++]=i:(i-=65536,a[n++]=55296|i>>10&1023,a[n++]=56320|1023&i)}return d(a,n)},r.utf8border=function(e,t){var r;for((t=t||e.length)>e.length&&(t=e.length),r=t-1;0<=r&&128==(192&e[r]);)r--;return r<0?t:0===r?t:r+u[e[r]]>t?r:t}},{"./common":41}],43:[function(e,t,r){"use strict";t.exports=function(e,t,r,n){for(var i=65535&e|0,s=e>>>16&65535|0,o=0;0!==r;){for(r-=o=2e3<r?2e3:r;s=s+(i=i+t[n++]|0)|0,--o;);i%=65521,s%=65521}return i|s<<16|0}},{}],44:[function(e,t,r){"use strict";t.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(e,t,r){"use strict";var a=function(){for(var e,t=[],r=0;r<256;r++){e=r;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[r]=e}return t}();t.exports=function(e,t,r,n){var i=a,s=n+r;e^=-1;for(var o=n;o<s;o++)e=e>>>8^i[255&(e^t[o])];return-1^e}},{}],46:[function(e,t,r){"use strict";var f,l=e("../utils/common"),u=e("./trees"),c=e("./adler32"),p=e("./crc32"),n=e("./messages"),d=0,h=0,m=-2,i=2,_=8,s=286,o=30,a=19,w=2*s+1,v=15,g=3,y=258,b=y+g+1,k=42,x=113;function S(e,t){return e.msg=n[t],t}function E(e){return(e<<1)-(4<e?9:0)}function z(e){for(var t=e.length;0<=--t;)e[t]=0}function C(e){var t=e.state,r=t.pending;r>e.avail_out&&(r=e.avail_out),0!==r&&(l.arraySet(e.output,t.pending_buf,t.pending_out,r,e.next_out),e.next_out+=r,t.pending_out+=r,e.total_out+=r,e.avail_out-=r,t.pending-=r,0===t.pending&&(t.pending_out=0))}function A(e,t){u._tr_flush_block(e,0<=e.block_start?e.block_start:-1,e.strstart-e.block_start,t),e.block_start=e.strstart,C(e.strm)}function O(e,t){e.pending_buf[e.pending++]=t}function I(e,t){e.pending_buf[e.pending++]=t>>>8&255,e.pending_buf[e.pending++]=255&t}function D(e,t){var r,n,i=e.max_chain_length,s=e.strstart,o=e.prev_length,a=e.nice_match,f=e.strstart>e.w_size-b?e.strstart-(e.w_size-b):0,u=e.window,d=e.w_mask,h=e.prev,l=e.strstart+y,c=u[s+o-1],p=u[s+o];e.prev_length>=e.good_match&&(i>>=2),a>e.lookahead&&(a=e.lookahead);do{if(u[(r=t)+o]===p&&u[r+o-1]===c&&u[r]===u[s]&&u[++r]===u[s+1]){s+=2,r++;do{}while(u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&s<l);if(n=y-(l-s),s=l-y,o<n){if(e.match_start=t,a<=(o=n))break;c=u[s+o-1],p=u[s+o]}}}while((t=h[t&d])>f&&0!=--i);return o<=e.lookahead?o:e.lookahead}function B(e){var t,r,n,i,s,o,a,f,u,d,h=e.w_size;do{if(i=e.window_size-e.lookahead-e.strstart,e.strstart>=h+(h-b)){for(l.arraySet(e.window,e.window,h,h,0),e.match_start-=h,e.strstart-=h,e.block_start-=h,t=r=e.hash_size;n=e.head[--t],e.head[t]=h<=n?n-h:0,--r;);for(t=r=h;n=e.prev[--t],e.prev[t]=h<=n?n-h:0,--r;);i+=h}if(0===e.strm.avail_in)break;if(o=e.strm,a=e.window,f=e.strstart+e.lookahead,d=void 0,(u=i)<(d=o.avail_in)&&(d=u),r=0===d?0:(o.avail_in-=d,l.arraySet(a,o.input,o.next_in,d,f),1===o.state.wrap?o.adler=c(o.adler,a,d,f):2===o.state.wrap&&(o.adler=p(o.adler,a,d,f)),o.next_in+=d,o.total_in+=d,d),e.lookahead+=r,e.lookahead+e.insert>=g)for(s=e.strstart-e.insert,e.ins_h=e.window[s],e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+1])&e.hash_mask;e.insert&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[s+g-1])&e.hash_mask,e.prev[s&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=s,s++,e.insert--,!(e.lookahead+e.insert<g)););}while(e.lookahead<b&&0!==e.strm.avail_in)}function T(e,t){for(var r,n;;){if(e.lookahead<b){if(B(e),e.lookahead<b&&t===d)return 1;if(0===e.lookahead)break}if(r=0,e.lookahead>=g&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+g-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!==r&&e.strstart-r<=e.w_size-b&&(e.match_length=D(e,r)),e.match_length>=g)if(n=u._tr_tally(e,e.strstart-e.match_start,e.match_length-g),e.lookahead-=e.match_length,e.match_length<=e.max_lazy_match&&e.lookahead>=g){for(e.match_length--;e.strstart++,e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+g-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart,0!=--e.match_length;);e.strstart++}else e.strstart+=e.match_length,e.match_length=0,e.ins_h=e.window[e.strstart],e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+1])&e.hash_mask;else n=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++;if(n&&(A(e,!1),0===e.strm.avail_out))return 1}return e.insert=e.strstart<g-1?e.strstart:g-1,4===t?(A(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(A(e,!1),0===e.strm.avail_out)?1:2}function R(e,t){for(var r,n,i;;){if(e.lookahead<b){if(B(e),e.lookahead<b&&t===d)return 1;if(0===e.lookahead)break}if(r=0,e.lookahead>=g&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+g-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),e.prev_length=e.match_length,e.prev_match=e.match_start,e.match_length=g-1,0!==r&&e.prev_length<e.max_lazy_match&&e.strstart-r<=e.w_size-b&&(e.match_length=D(e,r),e.match_length<=5&&(1===e.strategy||e.match_length===g&&4096<e.strstart-e.match_start)&&(e.match_length=g-1)),e.prev_length>=g&&e.match_length<=e.prev_length){for(i=e.strstart+e.lookahead-g,n=u._tr_tally(e,e.strstart-1-e.prev_match,e.prev_length-g),e.lookahead-=e.prev_length-1,e.prev_length-=2;++e.strstart<=i&&(e.ins_h=(e.ins_h<<e.hash_shift^e.window[e.strstart+g-1])&e.hash_mask,r=e.prev[e.strstart&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=e.strstart),0!=--e.prev_length;);if(e.match_available=0,e.match_length=g-1,e.strstart++,n&&(A(e,!1),0===e.strm.avail_out))return 1}else if(e.match_available){if((n=u._tr_tally(e,0,e.window[e.strstart-1]))&&A(e,!1),e.strstart++,e.lookahead--,0===e.strm.avail_out)return 1}else e.match_available=1,e.strstart++,e.lookahead--}return e.match_available&&(n=u._tr_tally(e,0,e.window[e.strstart-1]),e.match_available=0),e.insert=e.strstart<g-1?e.strstart:g-1,4===t?(A(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(A(e,!1),0===e.strm.avail_out)?1:2}function F(e,t,r,n,i){this.good_length=e,this.max_lazy=t,this.nice_length=r,this.max_chain=n,this.func=i}function N(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=_,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new l.Buf16(2*w),this.dyn_dtree=new l.Buf16(2*(2*o+1)),this.bl_tree=new l.Buf16(2*(2*a+1)),z(this.dyn_ltree),z(this.dyn_dtree),z(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new l.Buf16(v+1),this.heap=new l.Buf16(2*s+1),z(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new l.Buf16(2*s+1),z(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function U(e){var t;return e&&e.state?(e.total_in=e.total_out=0,e.data_type=i,(t=e.state).pending=0,t.pending_out=0,t.wrap<0&&(t.wrap=-t.wrap),t.status=t.wrap?k:x,e.adler=2===t.wrap?0:1,t.last_flush=d,u._tr_init(t),h):S(e,m)}function L(e){var t,r=U(e);return r===h&&((t=e.state).window_size=2*t.w_size,z(t.head),t.max_lazy_match=f[t.level].max_lazy,t.good_match=f[t.level].good_length,t.nice_match=f[t.level].nice_length,t.max_chain_length=f[t.level].max_chain,t.strstart=0,t.block_start=0,t.lookahead=0,t.insert=0,t.match_length=t.prev_length=g-1,t.match_available=0,t.ins_h=0),r}function P(e,t,r,n,i,s){if(!e)return m;var o=1;if(-1===t&&(t=6),n<0?(o=0,n=-n):15<n&&(o=2,n-=16),i<1||9<i||r!==_||n<8||15<n||t<0||9<t||s<0||4<s)return S(e,m);8===n&&(n=9);var a=new N;return(e.state=a).strm=e,a.wrap=o,a.gzhead=null,a.w_bits=n,a.w_size=1<<a.w_bits,a.w_mask=a.w_size-1,a.hash_bits=i+7,a.hash_size=1<<a.hash_bits,a.hash_mask=a.hash_size-1,a.hash_shift=~~((a.hash_bits+g-1)/g),a.window=new l.Buf8(2*a.w_size),a.head=new l.Buf16(a.hash_size),a.prev=new l.Buf16(a.w_size),a.lit_bufsize=1<<i+6,a.pending_buf_size=4*a.lit_bufsize,a.pending_buf=new l.Buf8(a.pending_buf_size),a.d_buf=1*a.lit_bufsize,a.l_buf=3*a.lit_bufsize,a.level=t,a.strategy=s,a.method=r,L(e)}f=[new F(0,0,0,0,function(e,t){var r=65535;for(r>e.pending_buf_size-5&&(r=e.pending_buf_size-5);;){if(e.lookahead<=1){if(B(e),0===e.lookahead&&t===d)return 1;if(0===e.lookahead)break}e.strstart+=e.lookahead,e.lookahead=0;var n=e.block_start+r;if((0===e.strstart||e.strstart>=n)&&(e.lookahead=e.strstart-n,e.strstart=n,A(e,!1),0===e.strm.avail_out))return 1;if(e.strstart-e.block_start>=e.w_size-b&&(A(e,!1),0===e.strm.avail_out))return 1}return e.insert=0,4===t?(A(e,!0),0===e.strm.avail_out?3:4):(e.strstart>e.block_start&&(A(e,!1),e.strm.avail_out),1)}),new F(4,4,8,4,T),new F(4,5,16,8,T),new F(4,6,32,32,T),new F(4,4,16,16,R),new F(8,16,32,32,R),new F(8,16,128,128,R),new F(8,32,128,256,R),new F(32,128,258,1024,R),new F(32,258,258,4096,R)],r.deflateInit=function(e,t){return P(e,t,_,15,8,0)},r.deflateInit2=P,r.deflateReset=L,r.deflateResetKeep=U,r.deflateSetHeader=function(e,t){return e&&e.state?2!==e.state.wrap?m:(e.state.gzhead=t,h):m},r.deflate=function(e,t){var r,n,i,s;if(!e||!e.state||5<t||t<0)return e?S(e,m):m;if(n=e.state,!e.output||!e.input&&0!==e.avail_in||666===n.status&&4!==t)return S(e,0===e.avail_out?-5:m);if(n.strm=e,r=n.last_flush,n.last_flush=t,n.status===k)if(2===n.wrap)e.adler=0,O(n,31),O(n,139),O(n,8),n.gzhead?(O(n,(n.gzhead.text?1:0)+(n.gzhead.hcrc?2:0)+(n.gzhead.extra?4:0)+(n.gzhead.name?8:0)+(n.gzhead.comment?16:0)),O(n,255&n.gzhead.time),O(n,n.gzhead.time>>8&255),O(n,n.gzhead.time>>16&255),O(n,n.gzhead.time>>24&255),O(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),O(n,255&n.gzhead.os),n.gzhead.extra&&n.gzhead.extra.length&&(O(n,255&n.gzhead.extra.length),O(n,n.gzhead.extra.length>>8&255)),n.gzhead.hcrc&&(e.adler=p(e.adler,n.pending_buf,n.pending,0)),n.gzindex=0,n.status=69):(O(n,0),O(n,0),O(n,0),O(n,0),O(n,0),O(n,9===n.level?2:2<=n.strategy||n.level<2?4:0),O(n,3),n.status=x);else{var o=_+(n.w_bits-8<<4)<<8;o|=(2<=n.strategy||n.level<2?0:n.level<6?1:6===n.level?2:3)<<6,0!==n.strstart&&(o|=32),o+=31-o%31,n.status=x,I(n,o),0!==n.strstart&&(I(n,e.adler>>>16),I(n,65535&e.adler)),e.adler=1}if(69===n.status)if(n.gzhead.extra){for(i=n.pending;n.gzindex<(65535&n.gzhead.extra.length)&&(n.pending!==n.pending_buf_size||(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),C(e),i=n.pending,n.pending!==n.pending_buf_size));)O(n,255&n.gzhead.extra[n.gzindex]),n.gzindex++;n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),n.gzindex===n.gzhead.extra.length&&(n.gzindex=0,n.status=73)}else n.status=73;if(73===n.status)if(n.gzhead.name){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),C(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.name.length?255&n.gzhead.name.charCodeAt(n.gzindex++):0,O(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.gzindex=0,n.status=91)}else n.status=91;if(91===n.status)if(n.gzhead.comment){i=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),C(e),i=n.pending,n.pending===n.pending_buf_size)){s=1;break}s=n.gzindex<n.gzhead.comment.length?255&n.gzhead.comment.charCodeAt(n.gzindex++):0,O(n,s)}while(0!==s);n.gzhead.hcrc&&n.pending>i&&(e.adler=p(e.adler,n.pending_buf,n.pending-i,i)),0===s&&(n.status=103)}else n.status=103;if(103===n.status&&(n.gzhead.hcrc?(n.pending+2>n.pending_buf_size&&C(e),n.pending+2<=n.pending_buf_size&&(O(n,255&e.adler),O(n,e.adler>>8&255),e.adler=0,n.status=x)):n.status=x),0!==n.pending){if(C(e),0===e.avail_out)return n.last_flush=-1,h}else if(0===e.avail_in&&E(t)<=E(r)&&4!==t)return S(e,-5);if(666===n.status&&0!==e.avail_in)return S(e,-5);if(0!==e.avail_in||0!==n.lookahead||t!==d&&666!==n.status){var a=2===n.strategy?function(e,t){for(var r;;){if(0===e.lookahead&&(B(e),0===e.lookahead)){if(t===d)return 1;break}if(e.match_length=0,r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++,r&&(A(e,!1),0===e.strm.avail_out))return 1}return e.insert=0,4===t?(A(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(A(e,!1),0===e.strm.avail_out)?1:2}(n,t):3===n.strategy?function(e,t){for(var r,n,i,s,o=e.window;;){if(e.lookahead<=y){if(B(e),e.lookahead<=y&&t===d)return 1;if(0===e.lookahead)break}if(e.match_length=0,e.lookahead>=g&&0<e.strstart&&(n=o[i=e.strstart-1])===o[++i]&&n===o[++i]&&n===o[++i]){s=e.strstart+y;do{}while(n===o[++i]&&n===o[++i]&&n===o[++i]&&n===o[++i]&&n===o[++i]&&n===o[++i]&&n===o[++i]&&n===o[++i]&&i<s);e.match_length=y-(s-i),e.match_length>e.lookahead&&(e.match_length=e.lookahead)}if(e.match_length>=g?(r=u._tr_tally(e,1,e.match_length-g),e.lookahead-=e.match_length,e.strstart+=e.match_length,e.match_length=0):(r=u._tr_tally(e,0,e.window[e.strstart]),e.lookahead--,e.strstart++),r&&(A(e,!1),0===e.strm.avail_out))return 1}return e.insert=0,4===t?(A(e,!0),0===e.strm.avail_out?3:4):e.last_lit&&(A(e,!1),0===e.strm.avail_out)?1:2}(n,t):f[n.level].func(n,t);if(3!==a&&4!==a||(n.status=666),1===a||3===a)return 0===e.avail_out&&(n.last_flush=-1),h;if(2===a&&(1===t?u._tr_align(n):5!==t&&(u._tr_stored_block(n,0,0,!1),3===t&&(z(n.head),0===n.lookahead&&(n.strstart=0,n.block_start=0,n.insert=0))),C(e),0===e.avail_out))return n.last_flush=-1,h}return 4!==t?h:n.wrap<=0?1:(2===n.wrap?(O(n,255&e.adler),O(n,e.adler>>8&255),O(n,e.adler>>16&255),O(n,e.adler>>24&255),O(n,255&e.total_in),O(n,e.total_in>>8&255),O(n,e.total_in>>16&255),O(n,e.total_in>>24&255)):(I(n,e.adler>>>16),I(n,65535&e.adler)),C(e),0<n.wrap&&(n.wrap=-n.wrap),0!==n.pending?h:1)},r.deflateEnd=function(e){var t;return e&&e.state?(t=e.state.status)!==k&&69!==t&&73!==t&&91!==t&&103!==t&&t!==x&&666!==t?S(e,m):(e.state=null,t===x?S(e,-3):h):m},r.deflateSetDictionary=function(e,t){var r,n,i,s,o,a,f,u,d=t.length;if(!e||!e.state)return m;if(2===(s=(r=e.state).wrap)||1===s&&r.status!==k||r.lookahead)return m;for(1===s&&(e.adler=c(e.adler,t,d,0)),r.wrap=0,d>=r.w_size&&(0===s&&(z(r.head),r.strstart=0,r.block_start=0,r.insert=0),u=new l.Buf8(r.w_size),l.arraySet(u,t,d-r.w_size,r.w_size,0),t=u,d=r.w_size),o=e.avail_in,a=e.next_in,f=e.input,e.avail_in=d,e.next_in=0,e.input=t,B(r);r.lookahead>=g;){for(n=r.strstart,i=r.lookahead-(g-1);r.ins_h=(r.ins_h<<r.hash_shift^r.window[n+g-1])&r.hash_mask,r.prev[n&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=n,n++,--i;);r.strstart=n,r.lookahead=g-1,B(r)}return r.strstart+=r.lookahead,r.block_start=r.strstart,r.insert=r.lookahead,r.lookahead=0,r.match_length=r.prev_length=g-1,r.match_available=0,e.next_in=a,e.input=f,e.avail_in=o,r.wrap=s,h},r.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(e,t,r){"use strict";t.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(e,t,r){"use strict";t.exports=function(e,t){var r,n,i,s,o,a,f,u,d,h,l,c,p,m,_,w,v,g,y,b,k,x,S,E,z;r=e.state,n=e.next_in,E=e.input,i=n+(e.avail_in-5),s=e.next_out,z=e.output,o=s-(t-e.avail_out),a=s+(e.avail_out-257),f=r.dmax,u=r.wsize,d=r.whave,h=r.wnext,l=r.window,c=r.hold,p=r.bits,m=r.lencode,_=r.distcode,w=(1<<r.lenbits)-1,v=(1<<r.distbits)-1;e:do{p<15&&(c+=E[n++]<<p,p+=8,c+=E[n++]<<p,p+=8),g=m[c&w];t:for(;;){if(c>>>=y=g>>>24,p-=y,0==(y=g>>>16&255))z[s++]=65535&g;else{if(!(16&y)){if(0==(64&y)){g=m[(65535&g)+(c&(1<<y)-1)];continue t}if(32&y){r.mode=12;break e}e.msg="invalid literal/length code",r.mode=30;break e}b=65535&g,(y&=15)&&(p<y&&(c+=E[n++]<<p,p+=8),b+=c&(1<<y)-1,c>>>=y,p-=y),p<15&&(c+=E[n++]<<p,p+=8,c+=E[n++]<<p,p+=8),g=_[c&v];r:for(;;){if(c>>>=y=g>>>24,p-=y,!(16&(y=g>>>16&255))){if(0==(64&y)){g=_[(65535&g)+(c&(1<<y)-1)];continue r}e.msg="invalid distance code",r.mode=30;break e}if(k=65535&g,p<(y&=15)&&(c+=E[n++]<<p,(p+=8)<y&&(c+=E[n++]<<p,p+=8)),f<(k+=c&(1<<y)-1)){e.msg="invalid distance too far back",r.mode=30;break e}if(c>>>=y,p-=y,(y=s-o)<k){if(d<(y=k-y)&&r.sane){e.msg="invalid distance too far back",r.mode=30;break e}if(S=l,(x=0)===h){if(x+=u-y,y<b){for(b-=y;z[s++]=l[x++],--y;);x=s-k,S=z}}else if(h<y){if(x+=u+h-y,(y-=h)<b){for(b-=y;z[s++]=l[x++],--y;);if(x=0,h<b){for(b-=y=h;z[s++]=l[x++],--y;);x=s-k,S=z}}}else if(x+=h-y,y<b){for(b-=y;z[s++]=l[x++],--y;);x=s-k,S=z}for(;2<b;)z[s++]=S[x++],z[s++]=S[x++],z[s++]=S[x++],b-=3;b&&(z[s++]=S[x++],1<b&&(z[s++]=S[x++]))}else{for(x=s-k;z[s++]=z[x++],z[s++]=z[x++],z[s++]=z[x++],2<(b-=3););b&&(z[s++]=z[x++],1<b&&(z[s++]=z[x++]))}break}}break}}while(n<i&&s<a);n-=b=p>>3,c&=(1<<(p-=b<<3))-1,e.next_in=n,e.next_out=s,e.avail_in=n<i?i-n+5:5-(n-i),e.avail_out=s<a?a-s+257:257-(s-a),r.hold=c,r.bits=p}},{}],49:[function(e,t,r){"use strict";var O=e("../utils/common"),I=e("./adler32"),D=e("./crc32"),B=e("./inffast"),T=e("./inftrees"),R=1,F=2,N=0,U=-2,L=1,n=852,i=592;function P(e){return(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function s(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new O.Buf16(320),this.work=new O.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function o(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=L,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new O.Buf32(n),t.distcode=t.distdyn=new O.Buf32(i),t.sane=1,t.back=-1,N):U}function a(e){var t;return e&&e.state?((t=e.state).wsize=0,t.whave=0,t.wnext=0,o(e)):U}function f(e,t){var r,n;return e&&e.state?(n=e.state,t<0?(r=0,t=-t):(r=1+(t>>4),t<48&&(t&=15)),t&&(t<8||15<t)?U:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=r,n.wbits=t,a(e))):U}function u(e,t){var r,n;return e?(n=new s,(e.state=n).window=null,(r=f(e,t))!==N&&(e.state=null),r):U}var d,h,l=!0;function j(e){if(l){var t;for(d=new O.Buf32(512),h=new O.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(T(R,e.lens,0,288,d,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;T(F,e.lens,0,32,h,0,e.work,{bits:5}),l=!1}e.lencode=d,e.lenbits=9,e.distcode=h,e.distbits=5}function Z(e,t,r,n){var i,s=e.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new O.Buf8(s.wsize)),n>=s.wsize?(O.arraySet(s.window,t,r-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):(n<(i=s.wsize-s.wnext)&&(i=n),O.arraySet(s.window,t,r-n,i,s.wnext),(n-=i)?(O.arraySet(s.window,t,r-n,n,0),s.wnext=n,s.whave=s.wsize):(s.wnext+=i,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=i))),0}r.inflateReset=a,r.inflateReset2=f,r.inflateResetKeep=o,r.inflateInit=function(e){return u(e,15)},r.inflateInit2=u,r.inflate=function(e,t){var r,n,i,s,o,a,f,u,d,h,l,c,p,m,_,w,v,g,y,b,k,x,S,E,z=0,C=new O.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return U;12===(r=e.state).mode&&(r.mode=13),o=e.next_out,i=e.output,f=e.avail_out,s=e.next_in,n=e.input,a=e.avail_in,u=r.hold,d=r.bits,h=a,l=f,x=N;e:for(;;)switch(r.mode){case L:if(0===r.wrap){r.mode=13;break}for(;d<16;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}if(2&r.wrap&&35615===u){C[r.check=0]=255&u,C[1]=u>>>8&255,r.check=D(r.check,C,2,0),d=u=0,r.mode=2;break}if(r.flags=0,r.head&&(r.head.done=!1),!(1&r.wrap)||(((255&u)<<8)+(u>>8))%31){e.msg="incorrect header check",r.mode=30;break}if(8!=(15&u)){e.msg="unknown compression method",r.mode=30;break}if(d-=4,k=8+(15&(u>>>=4)),0===r.wbits)r.wbits=k;else if(k>r.wbits){e.msg="invalid window size",r.mode=30;break}r.dmax=1<<k,e.adler=r.check=1,r.mode=512&u?10:12,d=u=0;break;case 2:for(;d<16;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}if(r.flags=u,8!=(255&r.flags)){e.msg="unknown compression method",r.mode=30;break}if(57344&r.flags){e.msg="unknown header flags set",r.mode=30;break}r.head&&(r.head.text=u>>8&1),512&r.flags&&(C[0]=255&u,C[1]=u>>>8&255,r.check=D(r.check,C,2,0)),d=u=0,r.mode=3;case 3:for(;d<32;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}r.head&&(r.head.time=u),512&r.flags&&(C[0]=255&u,C[1]=u>>>8&255,C[2]=u>>>16&255,C[3]=u>>>24&255,r.check=D(r.check,C,4,0)),d=u=0,r.mode=4;case 4:for(;d<16;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}r.head&&(r.head.xflags=255&u,r.head.os=u>>8),512&r.flags&&(C[0]=255&u,C[1]=u>>>8&255,r.check=D(r.check,C,2,0)),d=u=0,r.mode=5;case 5:if(1024&r.flags){for(;d<16;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}r.length=u,r.head&&(r.head.extra_len=u),512&r.flags&&(C[0]=255&u,C[1]=u>>>8&255,r.check=D(r.check,C,2,0)),d=u=0}else r.head&&(r.head.extra=null);r.mode=6;case 6:if(1024&r.flags&&(a<(c=r.length)&&(c=a),c&&(r.head&&(k=r.head.extra_len-r.length,r.head.extra||(r.head.extra=new Array(r.head.extra_len)),O.arraySet(r.head.extra,n,s,c,k)),512&r.flags&&(r.check=D(r.check,n,c,s)),a-=c,s+=c,r.length-=c),r.length))break e;r.length=0,r.mode=7;case 7:if(2048&r.flags){if(0===a)break e;for(c=0;k=n[s+c++],r.head&&k&&r.length<65536&&(r.head.name+=String.fromCharCode(k)),k&&c<a;);if(512&r.flags&&(r.check=D(r.check,n,c,s)),a-=c,s+=c,k)break e}else r.head&&(r.head.name=null);r.length=0,r.mode=8;case 8:if(4096&r.flags){if(0===a)break e;for(c=0;k=n[s+c++],r.head&&k&&r.length<65536&&(r.head.comment+=String.fromCharCode(k)),k&&c<a;);if(512&r.flags&&(r.check=D(r.check,n,c,s)),a-=c,s+=c,k)break e}else r.head&&(r.head.comment=null);r.mode=9;case 9:if(512&r.flags){for(;d<16;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}if(u!==(65535&r.check)){e.msg="header crc mismatch",r.mode=30;break}d=u=0}r.head&&(r.head.hcrc=r.flags>>9&1,r.head.done=!0),e.adler=r.check=0,r.mode=12;break;case 10:for(;d<32;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}e.adler=r.check=P(u),d=u=0,r.mode=11;case 11:if(0===r.havedict)return e.next_out=o,e.avail_out=f,e.next_in=s,e.avail_in=a,r.hold=u,r.bits=d,2;e.adler=r.check=1,r.mode=12;case 12:if(5===t||6===t)break e;case 13:if(r.last){u>>>=7&d,d-=7&d,r.mode=27;break}for(;d<3;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}switch(r.last=1&u,d-=1,3&(u>>>=1)){case 0:r.mode=14;break;case 1:if(j(r),r.mode=20,6!==t)break;u>>>=2,d-=2;break e;case 2:r.mode=17;break;case 3:e.msg="invalid block type",r.mode=30}u>>>=2,d-=2;break;case 14:for(u>>>=7&d,d-=7&d;d<32;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}if((65535&u)!=(u>>>16^65535)){e.msg="invalid stored block lengths",r.mode=30;break}if(r.length=65535&u,d=u=0,r.mode=15,6===t)break e;case 15:r.mode=16;case 16:if(c=r.length){if(a<c&&(c=a),f<c&&(c=f),0===c)break e;O.arraySet(i,n,s,c,o),a-=c,s+=c,f-=c,o+=c,r.length-=c;break}r.mode=12;break;case 17:for(;d<14;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}if(r.nlen=257+(31&u),u>>>=5,d-=5,r.ndist=1+(31&u),u>>>=5,d-=5,r.ncode=4+(15&u),u>>>=4,d-=4,286<r.nlen||30<r.ndist){e.msg="too many length or distance symbols",r.mode=30;break}r.have=0,r.mode=18;case 18:for(;r.have<r.ncode;){for(;d<3;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}r.lens[A[r.have++]]=7&u,u>>>=3,d-=3}for(;r.have<19;)r.lens[A[r.have++]]=0;if(r.lencode=r.lendyn,r.lenbits=7,S={bits:r.lenbits},x=T(0,r.lens,0,19,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid code lengths set",r.mode=30;break}r.have=0,r.mode=19;case 19:for(;r.have<r.nlen+r.ndist;){for(;w=(z=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,v=65535&z,!((_=z>>>24)<=d);){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}if(v<16)u>>>=_,d-=_,r.lens[r.have++]=v;else{if(16===v){for(E=_+2;d<E;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}if(u>>>=_,d-=_,0===r.have){e.msg="invalid bit length repeat",r.mode=30;break}k=r.lens[r.have-1],c=3+(3&u),u>>>=2,d-=2}else if(17===v){for(E=_+3;d<E;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}d-=_,k=0,c=3+(7&(u>>>=_)),u>>>=3,d-=3}else{for(E=_+7;d<E;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}d-=_,k=0,c=11+(127&(u>>>=_)),u>>>=7,d-=7}if(r.have+c>r.nlen+r.ndist){e.msg="invalid bit length repeat",r.mode=30;break}for(;c--;)r.lens[r.have++]=k}}if(30===r.mode)break;if(0===r.lens[256]){e.msg="invalid code -- missing end-of-block",r.mode=30;break}if(r.lenbits=9,S={bits:r.lenbits},x=T(R,r.lens,0,r.nlen,r.lencode,0,r.work,S),r.lenbits=S.bits,x){e.msg="invalid literal/lengths set",r.mode=30;break}if(r.distbits=6,r.distcode=r.distdyn,S={bits:r.distbits},x=T(F,r.lens,r.nlen,r.ndist,r.distcode,0,r.work,S),r.distbits=S.bits,x){e.msg="invalid distances set",r.mode=30;break}if(r.mode=20,6===t)break e;case 20:r.mode=21;case 21:if(6<=a&&258<=f){e.next_out=o,e.avail_out=f,e.next_in=s,e.avail_in=a,r.hold=u,r.bits=d,B(e,l),o=e.next_out,i=e.output,f=e.avail_out,s=e.next_in,n=e.input,a=e.avail_in,u=r.hold,d=r.bits,12===r.mode&&(r.back=-1);break}for(r.back=0;w=(z=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,v=65535&z,!((_=z>>>24)<=d);){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}if(w&&0==(240&w)){for(g=_,y=w,b=v;w=(z=r.lencode[b+((u&(1<<g+y)-1)>>g)])>>>16&255,v=65535&z,!(g+(_=z>>>24)<=d);){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}u>>>=g,d-=g,r.back+=g}if(u>>>=_,d-=_,r.back+=_,r.length=v,0===w){r.mode=26;break}if(32&w){r.back=-1,r.mode=12;break}if(64&w){e.msg="invalid literal/length code",r.mode=30;break}r.extra=15&w,r.mode=22;case 22:if(r.extra){for(E=r.extra;d<E;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}r.length+=u&(1<<r.extra)-1,u>>>=r.extra,d-=r.extra,r.back+=r.extra}r.was=r.length,r.mode=23;case 23:for(;w=(z=r.distcode[u&(1<<r.distbits)-1])>>>16&255,v=65535&z,!((_=z>>>24)<=d);){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}if(0==(240&w)){for(g=_,y=w,b=v;w=(z=r.distcode[b+((u&(1<<g+y)-1)>>g)])>>>16&255,v=65535&z,!(g+(_=z>>>24)<=d);){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}u>>>=g,d-=g,r.back+=g}if(u>>>=_,d-=_,r.back+=_,64&w){e.msg="invalid distance code",r.mode=30;break}r.offset=v,r.extra=15&w,r.mode=24;case 24:if(r.extra){for(E=r.extra;d<E;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}r.offset+=u&(1<<r.extra)-1,u>>>=r.extra,d-=r.extra,r.back+=r.extra}if(r.offset>r.dmax){e.msg="invalid distance too far back",r.mode=30;break}r.mode=25;case 25:if(0===f)break e;if(c=l-f,r.offset>c){if((c=r.offset-c)>r.whave&&r.sane){e.msg="invalid distance too far back",r.mode=30;break}p=c>r.wnext?(c-=r.wnext,r.wsize-c):r.wnext-c,c>r.length&&(c=r.length),m=r.window}else m=i,p=o-r.offset,c=r.length;for(f<c&&(c=f),f-=c,r.length-=c;i[o++]=m[p++],--c;);0===r.length&&(r.mode=21);break;case 26:if(0===f)break e;i[o++]=r.length,f--,r.mode=21;break;case 27:if(r.wrap){for(;d<32;){if(0===a)break e;a--,u|=n[s++]<<d,d+=8}if(l-=f,e.total_out+=l,r.total+=l,l&&(e.adler=r.check=r.flags?D(r.check,i,l,o-l):I(r.check,i,l,o-l)),l=f,(r.flags?u:P(u))!==r.check){e.msg="incorrect data check",r.mode=30;break}d=u=0}r.mode=28;case 28:if(r.wrap&&r.flags){for(;d<32;){if(0===a)break e;a--,u+=n[s++]<<d,d+=8}if(u!==(4294967295&r.total)){e.msg="incorrect length check",r.mode=30;break}d=u=0}r.mode=29;case 29:x=1;break e;case 30:x=-3;break e;case 31:return-4;case 32:default:return U}return e.next_out=o,e.avail_out=f,e.next_in=s,e.avail_in=a,r.hold=u,r.bits=d,(r.wsize||l!==e.avail_out&&r.mode<30&&(r.mode<27||4!==t))&&Z(e,e.output,e.next_out,l-e.avail_out)?(r.mode=31,-4):(h-=e.avail_in,l-=e.avail_out,e.total_in+=h,e.total_out+=l,r.total+=l,r.wrap&&l&&(e.adler=r.check=r.flags?D(r.check,i,l,e.next_out-l):I(r.check,i,l,e.next_out-l)),e.data_type=r.bits+(r.last?64:0)+(12===r.mode?128:0)+(20===r.mode||15===r.mode?256:0),(0==h&&0===l||4===t)&&x===N&&(x=-5),x)},r.inflateEnd=function(e){if(!e||!e.state)return U;var t=e.state;return t.window&&(t.window=null),e.state=null,N},r.inflateGetHeader=function(e,t){var r;return e&&e.state?0==(2&(r=e.state).wrap)?U:((r.head=t).done=!1,N):U},r.inflateSetDictionary=function(e,t){var r,n=t.length;return e&&e.state?0!==(r=e.state).wrap&&11!==r.mode?U:11===r.mode&&I(1,t,n,0)!==r.check?-3:Z(e,t,n,n)?(r.mode=31,-4):(r.havedict=1,N):U},r.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(e,t,r){"use strict";var R=e("../utils/common"),F=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],N=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],U=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],L=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];t.exports=function(e,t,r,n,i,s,o,a){var f,u,d,h,l,c,p,m,_,w=a.bits,v=0,g=0,y=0,b=0,k=0,x=0,S=0,E=0,z=0,C=0,A=null,O=0,I=new R.Buf16(16),D=new R.Buf16(16),B=null,T=0;for(v=0;v<=15;v++)I[v]=0;for(g=0;g<n;g++)I[t[r+g]]++;for(k=w,b=15;1<=b&&0===I[b];b--);if(b<k&&(k=b),0===b)return i[s++]=20971520,i[s++]=20971520,a.bits=1,0;for(y=1;y<b&&0===I[y];y++);for(k<y&&(k=y),v=E=1;v<=15;v++)if(E<<=1,(E-=I[v])<0)return-1;if(0<E&&(0===e||1!==b))return-1;for(D[1]=0,v=1;v<15;v++)D[v+1]=D[v]+I[v];for(g=0;g<n;g++)0!==t[r+g]&&(o[D[t[r+g]]++]=g);if(c=0===e?(A=B=o,19):1===e?(A=F,O-=257,B=N,T-=257,256):(A=U,B=L,-1),v=y,l=s,S=g=C=0,d=-1,h=(z=1<<(x=k))-1,1===e&&852<z||2===e&&592<z)return 1;for(;;){for(p=v-S,_=o[g]<c?(m=0,o[g]):o[g]>c?(m=B[T+o[g]],A[O+o[g]]):(m=96,0),f=1<<v-S,y=u=1<<x;i[l+(C>>S)+(u-=f)]=p<<24|m<<16|_|0,0!==u;);for(f=1<<v-1;C&f;)f>>=1;if(0!==f?(C&=f-1,C+=f):C=0,g++,0==--I[v]){if(v===b)break;v=t[r+o[g]]}if(k<v&&(C&h)!==d){for(0===S&&(S=k),l+=y,E=1<<(x=v-S);x+S<b&&!((E-=I[x+S])<=0);)x++,E<<=1;if(z+=1<<x,1===e&&852<z||2===e&&592<z)return 1;i[d=C&h]=k<<24|x<<16|l-s|0}}return 0!==C&&(i[l+C]=v-S<<24|64<<16|0),a.bits=k,0}},{"../utils/common":41}],51:[function(e,t,r){"use strict";t.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(e,t,r){"use strict";var a=e("../utils/common");function n(e){for(var t=e.length;0<=--t;)e[t]=0}var _=15,i=16,f=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],u=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],o=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],d=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],h=new Array(576);n(h);var l=new Array(60);n(l);var c=new Array(512);n(c);var p=new Array(256);n(p);var m=new Array(29);n(m);var w,v,g,y=new Array(30);function b(e,t,r,n,i){this.static_tree=e,this.extra_bits=t,this.extra_base=r,this.elems=n,this.max_length=i,this.has_stree=e&&e.length}function s(e,t){this.dyn_tree=e,this.max_code=0,this.stat_desc=t}function k(e){return e<256?c[e]:c[256+(e>>>7)]}function x(e,t){e.pending_buf[e.pending++]=255&t,e.pending_buf[e.pending++]=t>>>8&255}function S(e,t,r){e.bi_valid>i-r?(e.bi_buf|=t<<e.bi_valid&65535,x(e,e.bi_buf),e.bi_buf=t>>i-e.bi_valid,e.bi_valid+=r-i):(e.bi_buf|=t<<e.bi_valid&65535,e.bi_valid+=r)}function E(e,t,r){S(e,r[2*t],r[2*t+1])}function z(e,t){for(var r=0;r|=1&e,e>>>=1,r<<=1,0<--t;);return r>>>1}function C(e,t,r){var n,i,s=new Array(_+1),o=0;for(n=1;n<=_;n++)s[n]=o=o+r[n-1]<<1;for(i=0;i<=t;i++){var a=e[2*i+1];0!==a&&(e[2*i]=z(s[a]++,a))}}function A(e){var t;for(t=0;t<286;t++)e.dyn_ltree[2*t]=0;for(t=0;t<30;t++)e.dyn_dtree[2*t]=0;for(t=0;t<19;t++)e.bl_tree[2*t]=0;e.dyn_ltree[512]=1,e.opt_len=e.static_len=0,e.last_lit=e.matches=0}function O(e){8<e.bi_valid?x(e,e.bi_buf):0<e.bi_valid&&(e.pending_buf[e.pending++]=e.bi_buf),e.bi_buf=0,e.bi_valid=0}function I(e,t,r,n){var i=2*t,s=2*r;return e[i]<e[s]||e[i]===e[s]&&n[t]<=n[r]}function D(e,t,r){for(var n=e.heap[r],i=r<<1;i<=e.heap_len&&(i<e.heap_len&&I(t,e.heap[i+1],e.heap[i],e.depth)&&i++,!I(t,n,e.heap[i],e.depth));)e.heap[r]=e.heap[i],r=i,i<<=1;e.heap[r]=n}function B(e,t,r){var n,i,s,o,a=0;if(0!==e.last_lit)for(;n=e.pending_buf[e.d_buf+2*a]<<8|e.pending_buf[e.d_buf+2*a+1],i=e.pending_buf[e.l_buf+a],a++,0===n?E(e,i,t):(E(e,(s=p[i])+256+1,t),0!==(o=f[s])&&S(e,i-=m[s],o),E(e,s=k(--n),r),0!==(o=u[s])&&S(e,n-=y[s],o)),a<e.last_lit;);E(e,256,t)}function T(e,t){var r,n,i,s=t.dyn_tree,o=t.stat_desc.static_tree,a=t.stat_desc.has_stree,f=t.stat_desc.elems,u=-1;for(e.heap_len=0,e.heap_max=573,r=0;r<f;r++)0!==s[2*r]?(e.heap[++e.heap_len]=u=r,e.depth[r]=0):s[2*r+1]=0;for(;e.heap_len<2;)s[2*(i=e.heap[++e.heap_len]=u<2?++u:0)]=1,e.depth[i]=0,e.opt_len--,a&&(e.static_len-=o[2*i+1]);for(t.max_code=u,r=e.heap_len>>1;1<=r;r--)D(e,s,r);for(i=f;r=e.heap[1],e.heap[1]=e.heap[e.heap_len--],D(e,s,1),n=e.heap[1],e.heap[--e.heap_max]=r,e.heap[--e.heap_max]=n,s[2*i]=s[2*r]+s[2*n],e.depth[i]=(e.depth[r]>=e.depth[n]?e.depth[r]:e.depth[n])+1,s[2*r+1]=s[2*n+1]=i,e.heap[1]=i++,D(e,s,1),2<=e.heap_len;);e.heap[--e.heap_max]=e.heap[1],function(e,t){var r,n,i,s,o,a,f=t.dyn_tree,u=t.max_code,d=t.stat_desc.static_tree,h=t.stat_desc.has_stree,l=t.stat_desc.extra_bits,c=t.stat_desc.extra_base,p=t.stat_desc.max_length,m=0;for(s=0;s<=_;s++)e.bl_count[s]=0;for(f[2*e.heap[e.heap_max]+1]=0,r=e.heap_max+1;r<573;r++)p<(s=f[2*f[2*(n=e.heap[r])+1]+1]+1)&&(s=p,m++),f[2*n+1]=s,u<n||(e.bl_count[s]++,o=0,c<=n&&(o=l[n-c]),a=f[2*n],e.opt_len+=a*(s+o),h&&(e.static_len+=a*(d[2*n+1]+o)));if(0!==m){do{for(s=p-1;0===e.bl_count[s];)s--;e.bl_count[s]--,e.bl_count[s+1]+=2,e.bl_count[p]--,m-=2}while(0<m);for(s=p;0!==s;s--)for(n=e.bl_count[s];0!==n;)u<(i=e.heap[--r])||(f[2*i+1]!==s&&(e.opt_len+=(s-f[2*i+1])*f[2*i],f[2*i+1]=s),n--)}}(e,t),C(s,u,e.bl_count)}function R(e,t,r){var n,i,s=-1,o=t[1],a=0,f=7,u=4;for(0===o&&(f=138,u=3),t[2*(r+1)+1]=65535,n=0;n<=r;n++)i=o,o=t[2*(n+1)+1],++a<f&&i===o||(a<u?e.bl_tree[2*i]+=a:0!==i?(i!==s&&e.bl_tree[2*i]++,e.bl_tree[32]++):a<=10?e.bl_tree[34]++:e.bl_tree[36]++,s=i,u=(a=0)===o?(f=138,3):i===o?(f=6,3):(f=7,4))}function F(e,t,r){var n,i,s=-1,o=t[1],a=0,f=7,u=4;for(0===o&&(f=138,u=3),n=0;n<=r;n++)if(i=o,o=t[2*(n+1)+1],!(++a<f&&i===o)){if(a<u)for(;E(e,i,e.bl_tree),0!=--a;);else 0!==i?(i!==s&&(E(e,i,e.bl_tree),a--),E(e,16,e.bl_tree),S(e,a-3,2)):a<=10?(E(e,17,e.bl_tree),S(e,a-3,3)):(E(e,18,e.bl_tree),S(e,a-11,7));s=i,u=(a=0)===o?(f=138,3):i===o?(f=6,3):(f=7,4)}}n(y);var N=!1;function U(e,t,r,n){var i,s,o;S(e,0+(n?1:0),3),s=t,o=r,O(i=e),x(i,o),x(i,~o),a.arraySet(i.pending_buf,i.window,s,o,i.pending),i.pending+=o}r._tr_init=function(e){N||(function(){var e,t,r,n,i,s=new Array(_+1);for(n=r=0;n<28;n++)for(m[n]=r,e=0;e<1<<f[n];e++)p[r++]=n;for(p[r-1]=n,n=i=0;n<16;n++)for(y[n]=i,e=0;e<1<<u[n];e++)c[i++]=n;for(i>>=7;n<30;n++)for(y[n]=i<<7,e=0;e<1<<u[n]-7;e++)c[256+i++]=n;for(t=0;t<=_;t++)s[t]=0;for(e=0;e<=143;)h[2*e+1]=8,e++,s[8]++;for(;e<=255;)h[2*e+1]=9,e++,s[9]++;for(;e<=279;)h[2*e+1]=7,e++,s[7]++;for(;e<=287;)h[2*e+1]=8,e++,s[8]++;for(C(h,287,s),e=0;e<30;e++)l[2*e+1]=5,l[2*e]=z(e,5);w=new b(h,f,257,286,_),v=new b(l,u,0,30,_),g=new b(new Array(0),o,0,19,7)}(),N=!0),e.l_desc=new s(e.dyn_ltree,w),e.d_desc=new s(e.dyn_dtree,v),e.bl_desc=new s(e.bl_tree,g),e.bi_buf=0,e.bi_valid=0,A(e)},r._tr_stored_block=U,r._tr_flush_block=function(e,t,r,n){var i,s,o=0;0<e.level?(2===e.strm.data_type&&(e.strm.data_type=function(e){var t,r=4093624447;for(t=0;t<=31;t++,r>>>=1)if(1&r&&0!==e.dyn_ltree[2*t])return 0;if(0!==e.dyn_ltree[18]||0!==e.dyn_ltree[20]||0!==e.dyn_ltree[26])return 1;for(t=32;t<256;t++)if(0!==e.dyn_ltree[2*t])return 1;return 0}(e)),T(e,e.l_desc),T(e,e.d_desc),o=function(e){var t;for(R(e,e.dyn_ltree,e.l_desc.max_code),R(e,e.dyn_dtree,e.d_desc.max_code),T(e,e.bl_desc),t=18;3<=t&&0===e.bl_tree[2*d[t]+1];t--);return e.opt_len+=3*(t+1)+5+5+4,t}(e),i=e.opt_len+3+7>>>3,(s=e.static_len+3+7>>>3)<=i&&(i=s)):i=s=r+5,r+4<=i&&-1!==t?U(e,t,r,n):4===e.strategy||s===i?(S(e,2+(n?1:0),3),B(e,h,l)):(S(e,4+(n?1:0),3),function(e,t,r,n){var i;for(S(e,t-257,5),S(e,r-1,5),S(e,n-4,4),i=0;i<n;i++)S(e,e.bl_tree[2*d[i]+1],3);F(e,e.dyn_ltree,t-1),F(e,e.dyn_dtree,r-1)}(e,e.l_desc.max_code+1,e.d_desc.max_code+1,o+1),B(e,e.dyn_ltree,e.dyn_dtree)),A(e),n&&O(e)},r._tr_tally=function(e,t,r){return e.pending_buf[e.d_buf+2*e.last_lit]=t>>>8&255,e.pending_buf[e.d_buf+2*e.last_lit+1]=255&t,e.pending_buf[e.l_buf+e.last_lit]=255&r,e.last_lit++,0===t?e.dyn_ltree[2*r]++:(e.matches++,t--,e.dyn_ltree[2*(p[r]+256+1)]++,e.dyn_dtree[2*k(t)]++),e.last_lit===e.lit_bufsize-1},r._tr_align=function(e){var t;S(e,2,3),E(e,256,h),16===(t=e).bi_valid?(x(t,t.bi_buf),t.bi_buf=0,t.bi_valid=0):8<=t.bi_valid&&(t.pending_buf[t.pending++]=255&t.bi_buf,t.bi_buf>>=8,t.bi_valid-=8)}},{"../utils/common":41}],53:[function(e,t,r){"use strict";t.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(e,t,r){"use strict";t.exports="function"==typeof setImmediate?setImmediate:function(){var e=[].slice.apply(arguments);e.splice(1,0,0),setTimeout.apply(null,e)}},{}]},{},[10])(10)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,void 0!==r?r:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)})}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)});
}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate)

},{"buffer":7,"timers":13}],11:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],12:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],13:[function(require,module,exports){
// DOM APIs, for completeness

if (typeof setTimeout !== 'undefined') exports.setTimeout = function() { return setTimeout.apply(window, arguments); };
if (typeof clearTimeout !== 'undefined') exports.clearTimeout = function() { clearTimeout.apply(window, arguments); };
if (typeof setInterval !== 'undefined') exports.setInterval = function() { return setInterval.apply(window, arguments); };
if (typeof clearInterval !== 'undefined') exports.clearInterval = function() { clearInterval.apply(window, arguments); };

// TODO: Change to more effiecient list approach used in Node.js
// For now, we just implement the APIs using the primitives above.

exports.enroll = function(item, delay) {
  item._timeoutID = setTimeout(item._onTimeout, delay);
};

exports.unenroll = function(item) {
  clearTimeout(item._timeoutID);
};

exports.active = function(item) {
  // our naive impl doesn't care (correctness is still preserved)
};

exports.setImmediate = require('process/browser.js').nextTick;

},{"process/browser.js":14}],14:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],15:[function(require,module,exports){
/*
@licstart  The following is the entire license notice for the JavaScript code in this page.

    Copyright (c) 2019, Jim Allman

    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.

    Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
    FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
    DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
    SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
    CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
    OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
    OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

@licend  The above is the entire license notice for the JavaScript code in this page.
*/

/*
 * Client-side behavior for the Open Tree name-resolution UI
 *
 * This uses the Open Tree API to resolve large sets of labels to taxonomic names.
 */
var JSZip = require('jszip'),
    FileSaver = require('file-saver'),
    Blob = require('blob-polyfill'),
    assert = require('assert');

/* These variables should already be defined in the main HTML page. We should
 * NOT declare them here, or this will hide their "global" values.
var initialState;
var doTNRSForAutocomplete_url;
var doTNRSForMappingOTUs_url;
var getContextForNames_url;
var render_markdown_url;
*/

// sometimes we use this script in other pages; let's check!
var context;
if (window.location.pathname.indexOf("/curator/tnrs/") === 0) {
    context = 'BULK_TNRS';
} else if (window.location.pathname.indexOf("/curator/study/edit/") === 0) {
    context = 'STUDY_OTU_MAPPING';
} else {
    context = '???';
}

/* Return the data model for a new nameset (our JSON representation) */
var getNewNamesetModel = function(options) {
    if (!options) options = {};
    var obj = {
        'metadata': {
            'name': "Untitled nameset",
            'description': "",
            'authors': [ ],   // assign immediately to this user?
            'date_created': new Date().toISOString(),
            'last_saved': null,
            'save_count': 0,  // use to suggest unique (numbered) filenames
            'previous_filename': null,  // what file we loaded before doing this work
            'latest_ott_version': null
        },
        "mappingHints": {       // OR nameMappingHints?
            "description": "Aids for mapping listed names to OTT taxa",
            "searchContext": "All life",
            "useFuzzyMatching": false,
            "autoAcceptExactMatches": false,
            "substitutions": [
                /* typical values in use
                {
                    "active": false,
                    "old": ".* ([A-Z][a-z]+ [a-z.]+ [A-Z 0-9]+)$",
                    "new": "$1",
                    "valid": true
                },
                */
                /* start with one empty/new substitution */
                {
                    "active": true,
                    "old": "",
                    "new": "",
                    "valid": true
                }
            ],
        },
        'names': [
            // each should include a unique id, original name, manually edited/adjusted name, and any mapped name/taxon
            /* here's a typical example, with an arbitrary/serial ID
            {
                "id": "name23",
                "originalLabel": "Bacteria Proteobacteria Gammaproteobacteria Oceanospirillales Saccharospirillaceae Saccharospirillum impatiens DSM 12546",
                "adjustedLabel": "Proeobacteria",  // WAS '^ot:altLabel'
                "ottTaxonName": "Saccharospirillum impatiens DSM 12546",
                "ottId": 132751,
                "taxonomicSources": ["silva:A16379/#1", "ncbi:2", "worms:6", "gbif:3", "irmng:13"]
            }
            */
        ]
    };
    /* TODO: Apply optional modifications?
    if (options.BLAH) {
        obj.metadata.FOO = 'BAR';
    }
    */
    return obj;
};
function convertToNamesetModel( listText ) {
    /* Test for proper delimited text (TSV or CSV, with a pair of names on each line).
     * The first value on each line is a vernacular label, the second its mapped taxon name.
     */
    var nameset = getNewNamesetModel();  // we'll add name pairs to this
    console.log( listText );
    // test a variety of delimiters to use with this text
    var lineDelimiters = ['\n','\r'];
    var lineDelimFound = null;
    $.each(lineDelimiters, function(i, delim) {
        if (!lineDelimFound) {
            if (listText.split(delim).length > 1) {
                lineDelimFound = delim;
            }
        }
    });
    var itemDelimiters = [',','\t'];
    var itemDelimFound = null;
    $.each(itemDelimiters, function(i, delim) {
        if (!itemDelimFound) {
            if (listText.split(delim).length > 1) {
                itemDelimFound = delim;
            }
        }
    });
    if ((!lineDelimFound) || (!itemDelimFound)) {
        return nameset;  // probably still empty
    }
    // now apply labels and keep count of any duplicate labels
    var foundLabels = [ ];
    var dupeLabelsFound = 0;
    var lines = listText.split(lineDelimFound);
    // filter out empty empty lines, etc.
    lines = $.grep(lines, function(line, i) {
        return $.trim(line) !== "";
    });
    console.warn( lines.length +" lines found with line delimiter '"+ lineDelimFound +"'");
    var localNameNumber = 0;  // these are not imported, so local integers are find
    $.each(lines, function(i, line) {
        var items = line.split(itemDelimFound);
        // filter out empty empty labels and taxa
        items = $.grep(items, function(item, i) {
            return $.trim(item) !== "";
        });
        switch (items.length) {
            case 0:
            case 1:
                return true;  // skip to next line
            default:
                // we assume the same fields as in out nameset output files
                var label = $.trim(items[0]);   // its original, vernacular label
                if (label === 'ORIGINAL LABEL') {
                    // skip the header row, if found
                    return true;
                }
                // skip this label if it's a duplicate
                if (foundLabels.indexOf(label) === -1) {
                    // add this to labels found (test later names against this)
                    foundLabels.push(label);
                } else {
                    // this is a dupe of an earlier name!
                    dupeLabelsFound++;
                    return true;
                }
                var canonicalTaxonName = $.trim(items[1]);  // its mapped taxon name
                // include ottid and any taxonomic sources, if provided
                var taxonID = (items.length > 2) ? items[2] : null;
                var sources = (items.length > 3) ? items[3].split(';') : null;
                // add this information in the expected nameset form
                console.log("...adding label '"+ label +"'...");
                var nameInfo = {
                    "id": ("name"+ localNameNumber++),
                    "originalLabel": label,
                    "ottTaxonName": canonicalTaxonName,
                    "selectedForAction": false
                };
                if (taxonID) {
                    nameInfo["ottId"] = taxonID;
                }
                if (sources) {
                    nameInfo["taxonomicSources"] = [];
                    $.each(sources, function(i, source) {
                        source = $.trim(source);
                        if (source) {  // it's not an empty string
                            nameInfo["taxonomicSources"].push( source );
                        }
                    });
                }
                nameset.names.push( nameInfo );
        }
        return;
    });
    nudgeTickler('VISIBLE_NAME_MAPPINGS');
    var namesAdded = nameset.names.length;
    var msg;
    if (dupeLabelsFound === 0) {
        msg = "Adding "+ namesAdded +" names found in this file...";
    } else {
        msg = "Adding "+ namesAdded +" name"+
            (namesAdded === 1? "" : "s") +" found in this file ("+
            dupeLabelsFound +" duplicate label"+ (dupeLabelsFound === 1? "" : "s")
            +" removed)...";
    }
    // where do we show these messages?
    showInfoMessage(msg);
    return nameset;
}

/* Load and save (to/from ZIP file on the user's filesystem) */

// propose an appropriate filename based on its internal name
function getDefaultArchiveFilename( candidateFileName ) {
    // try to use a candidate name, if provided
    var suggestedFileName = $.trim(candidateFileName) ||
        viewModel.metadata.name() ||
        "UNTITLED_NAMESET";
    // strip extension (if found) and increment as needed
    if (suggestedFileName.toLowerCase().endsWith('.zip')) {
        suggestedFileName = suggestedFileName.substr(0, suggestedFileName.length() - 4);
    }
    // add incrementing counter from viewModel, plus file extension
    if (viewModel.metadata.save_count() > 0) {
        suggestedFileName += "-"+ viewModel.metadata.save_count();
    }
    suggestedFileName += '.zip';
    return suggestedFileName;
}

function saveCurrentNameset( options ) {
    // save a ZIP archive (or just `main.json`) to the filesystem
    options = options || {FULL_ARCHIVE: true};

    /*
     * Update new-save info (timestamp and counter) in the JSON document BEFORE
     * saving it; if the operation fails, we'll revert these properties in the
     * active document.
     */
    var previousSaveTimestamp = viewModel.metadata.last_saved();
    var rightNow = new Date().toISOString();
    viewModel.metadata.last_saved( rightNow );
    var previousSaveCount = viewModel.metadata.save_count();
    viewModel.metadata.save_count( ++previousSaveCount );
    // TODO: Set (tentative/user-suggested) filename in the live viewModel?

    // TODO: add this user to the authors list, if not found?
    // (email and/or userid, so we can link to authors)
    /*
    var userDisplayName = '???';
    var listPos = $.inArray( userDisplayName, viewModel.metadata.authors() );
    if (listPos === -1) {
        viewModel.metadata.authors.push( userDisplayName );
    }
    */

    // TODO: add a "scrubber" as we do for OpenTree studies? 
    // scrubNamesetForTransport(stylist.ill);

    // flatten the current nameset to simple JS using our 
    // Knockout mapping options
    var clonableNameset = ko.mapping.toJS(viewModel);

    // TODO: clear any existing URL? or keep last-known good one?
    //clonableNameset.metadata.url = '';

    // create a Zip archive, add the core document
    var archive = new JSZip();
    archive.file("main.json", JSON.stringify(clonableNameset));

    // TODO: Test all input for repeatable provenance info; if any are lacking a
    // clear source, we should embed the source data here.
    /*
    var staticInputs = TreeIllustrator.gatherStaticInputData();
    if (options.FULL_ARCHIVE || (staticInputs.length > 0)) {
        // add some or all input data for this illustration
        //var inputFolder = archive.folder('input');
        var inputsToStore = options.FULL_ARCHIVE ? TreeIllustrator.gatherAllInputData() : staticInputs;
        $.each(inputsToStore, function(i, inputData) {
            var itsPath = inputData.path;
            var serialized = utils.serializeDataForSavedFile( inputData.value );
            archive.file(itsPath, serialized.value, serialized.options);
        });
    }
    */

    // add any output docs (SVG, PDF)
    var outputFolder = archive.folder('output');
    /* See https://stuk.github.io/jszip/documentation/api_jszip/file_data.html
     * for other ZIP options like copmression settings.
     */
    outputFolder.file('main.tsv', generateTabSeparatedOutput('ALL_NAMES'), {comment: "Tab-delimited text, including unmapped names."});
    outputFolder.file('main.csv', generateCommaSeparatedOutput('ALL_NAMES'), {comment: "Comma-delimited text, including unmapped names."});

    /* NOTE that we have no control over where the browser will save a
     * downloaded file, and we have no direct knowledge of the filesystem!
     * Furthermore, most browsers won't overwrite an existing file with this
     * path+name, and will instead increment the new file, e.g.
     * 'bee-trees-compared.zip' becomes '~/Downloads/bee-trees-compared (2).zip'.
     */
    var $filenameField = $('input#suggested-archive-filename');
    var suggestedFileName = $.trim($filenameField.val());
    if (suggestedFileName === "") {
        suggestedFileName = getDefaultArchiveFilename(suggestedFileName);
    }
    // add missing extension, if it's missing
    if (!(suggestedFileName.toLowerCase().endsWith('.zip'))) {
        suggestedFileName += '.zip';
    }

    archive.generateAsync( {type:"blob"}, 
                           function updateCallback(metadata) {
                               // TODO: Show progress as demonstrated in
                               // https://stuk.github.io/jszip/documentation/examples/downloader.html
                               console.log( metadata.percent.toFixed(2) + " % complete" );
                           } )
           .then( function (blob) {   
                      // success callback
                      FileSaver.saveAs(blob, suggestedFileName);
                  },
                  function (err) {    
                      // failure callback
                      asyncAlert('ERROR generating this ZIP archive:<br/><br/>'+ err);
                      // revert to previous last-save info in the active document
                      viewModel.metadata.last_saved( previousSaveTimestamp );
                      viewModel.metadata.save_count( previousSaveCount );
                  } );

    $('#nameset-local-filesystem-warning').slideDown(); // TODO

    showInfoMessage('Nameset saved to local file.');

    popPageExitWarning('UNSAVED_NAMESET_CHANGES');
    namesetHasUnsavedChanges = false;
    disableSaveButton();
}

function generateTabSeparatedOutput() {
    return generateDelimitedTextOutput('ALL_NAMES', '\t', ';');
}
function generateCommaSeparatedOutput() {
    return generateDelimitedTextOutput('ALL_NAMES', ',', ';');
}
function generateDelimitedTextOutput(mappedOrAllNames, delimiter, minorDelimiter) {
    // render the current nameset (mapped names, or all) as a delimited (TSV, CSV) string
    var output;
    if ($.inArray(mappedOrAllNames, ['MAPPED_NAMES', 'ALL_NAMES']) === -1) {
        var msg = "# ERROR: mappedOrAllNames should be 'MAPPED_NAMES' or 'ALL_NAMES', not '"+ mappedOrAllNames +"'!"
        console.error(msg);
        return msg;
    }
    if (viewModel.names().length === 0) {
        output = "# No names in this nameset were mapped to the OT Taxonomy.";
    } else {
        output = "ORIGINAL LABEL"+ delimiter +"OTT TAXON NAME"+ delimiter +"OTT TAXON ID"+ delimiter +"TAXONOMIC SOURCES\n";
        $.each(viewModel.names(), function(i, name) {
            if ((mappedOrAllNames === 'MAPPED_NAMES') && !name.ottTaxonName) {
                return true;  // skip this un-mapped name
            }
            // N.B. unmapped names won't have most of these properties!
            var combinedSources = (name.taxonomicSources || [ ]).join(minorDelimiter);
            output += (name.originalLabel +delimiter+
                       (name.ottTaxonName || '') +delimiter+
                       (name.ottId || '') +delimiter+
                       combinedSources +"\n");
        });
    }
    return output;
}

function loadListFromChosenFile( vm, evt ) {
    // First param (corresponding view-model data) is probably empty; focus on the event!
    var $hintArea = $('#list-local-filesystem-warning').eq(0);
    $hintArea.html("");  // clear for new results
    var eventTarget = evt.target || evt.srcElement;
    switch(eventTarget.files.length) {
        case (0):
            console.warn('No file(s) selected!');
            return;
        case (1):
        default:  // ignore multiple files for now, just load the first
            var fileInfo = eventTarget.files[0];
            console.warn("fileInfo.name = "+ fileInfo.name);
            console.warn("fileInfo.type = "+ fileInfo.type);
            var isValidList = false;
            switch (fileInfo.type) {
                case 'text/plain':
                case 'text/tab-separated-values':
                    isValidList = true;
                    break;
                case '':
                    // check file extension
                    if (fileInfo.name.match('.(txt|tsv)$')) {
                        isValidList = true;
                    }
                    break;
            }
            if (!isValidList) {
                var msg = "A list of names should end in <code>.txt</code> or <code>.tsv</code>. Choose another file?";
                $hintArea.html(msg).show();
                return;
            }
            // Still here? try to load and parse the list (line- or tab-delimited names)
            console.log('reading list contents...');
            var msg = "Reading list of names...";
            $hintArea.html(msg).show();

            var fr = new FileReader();
            fr.onload = function( evt ) {
                var listText = evt.target.result;
                console.log( listText );
                // test a variety of delimiters to find multiple items
                var names = [ ];
                var multipleNamesFound = false;
                var dupesFound = 0;
                var delimiters = ['\n','\r','\t'];
                $.each(delimiters, function(i, delim) {
                    if (!multipleNamesFound) {
                        names = listText.split(delim);
                        // filter out empty names, empty lines, etc.
                        names = $.grep(names, function(name, i) {
                            return $.trim(name) !== "";
                        });
                        switch (names.length) {
                            case 0:
                                console.warn("No names found with delimiter '"+ delim +"'");
                                break;
                            case 1:
                                console.warn("Just one name found with delimiter '"+ delim +"'");
                                break;
                            default:
                                multipleNamesFound = true;
                                console.warn( names.length +" names found with delimiter '"+ delim +"'");
                                // TODO: unpack names, ignore remaining delimiters
                                $.each(names, function(i, name) {
                                    // add a new name entry to the nameset
                                    console.log("...adding name '"+ name +"'...");
                                    viewModel.names.push({
                                        "id": ("name"+ getNextNameOrdinalNumber()),
                                        "originalLabel": name,
                                        "selectedForAction": true
                                     /* add these only when they're populated!
                                        "adjustedLabel": ""   // WAS '^ot:altLabel'
                                        "ottTaxonName": "Homo sapiens sapiens",
                                        "ottId": 132751
                                        "taxonomicSources": [ ... ]
                                      */
                                    });
                                });
                                // sweep for duplicates
                                var withDupes = viewModel.names().length;
                                removeDuplicateNames(viewModel);
                                var withoutDupes = viewModel.names().length;
                                dupesFound = withDupes - withoutDupes;
                                nudgeTickler('VISIBLE_NAME_MAPPINGS');
                                return;
                        }
                    }
                });
                // still here? there was a problem, report it and bail
                var msg;
                if (multipleNamesFound) {
                    if (dupesFound === 0) {
                        msg = "Adding "+ names.length +" names found in this file...";
                    } else {
                        var namesAdded = names.length - dupesFound;
                        msg = "Adding "+ namesAdded +" name"+
                            (namesAdded === 1? "" : "s") +" found in this file ("+
                            dupesFound +" duplicate name"+ (dupesFound === 1? "" : "s")
                            +" removed)...";
                    }
                } else {
                    msg = "No names (or just one) found in this file! Try again?";
                }
                $hintArea.html(msg).show();
                return;
            };
            //fr.readAsDataURL(fileInfo);
            fr.readAsText(fileInfo);  // default encoding is utf-8
    }
}

function loadNamesetFromChosenFile( vm, evt ) {
    // First param (corresponding view-model data) is probably empty; focus on the event!
    var $hintArea = $('#nameset-local-filesystem-warning').eq(0);
    $hintArea.html("");  // clear for new results
    var eventTarget = evt.target || evt.srcElement;
    switch(eventTarget.files.length) {
        case (0):
            var msg = "No file(s) selected!";
            $hintArea.html(msg).show();
            return;
        case (1):
        default:  // ignore multiple files for now, just load the first
            var fileInfo = eventTarget.files[0];
            console.warn("fileInfo.name = "+ fileInfo.name);
            console.warn("fileInfo.type = "+ fileInfo.type);
            var usesNamesetFileFormat = false;
            var isValidArchive = false;
            if (context === 'BULK_TNRS') {
                switch (fileInfo.type) {
                    case 'application/zip':
                        usesNamesetFileFormat = true;
                        isValidArchive = true;
                        break;
                    case '':
                        // check file extension
                        if (fileInfo.name.match('.(zip|nameset)$')) {
                            usesNamesetFileFormat = true;
                            isValidArchive = true;
                        }
                        break;
                }
                if (!isValidArchive) {
                    var msg = "Archived nameset file should end in <code>.zip</code> or <code>.nameset</code>. Choose another file?";
                    $hintArea.html(msg).show();
                    return;
                }
            } else {  // presumably 'STUDY_OTU_MAPPING'
                switch (fileInfo.type) {
                    case 'application/zip':
                        usesNamesetFileFormat = true;
                        isValidArchive = true;
                        break;
                    case 'text/plain':
                    case 'text/tab-separated-values':
                    case 'text/csv':
                    case 'application/json':
                        usesNamesetFileFormat = true;
                        break;
                    default:
                        // check file extension
                        if (fileInfo.name.match('.(zip|nameset|txt|tsv|csv|json)$')) {
                            usesNamesetFileFormat = true;
                            isValidArchive = true;
                        }
                        break;
                }
                if (!usesNamesetFileFormat) {
                    var msg = "Nameset file should end in one of <code>.zip .nameset .txt .tsv .csv .json</code>. Choose another file?";
                    $hintArea.html(msg).show();
                    return;
                }
            }
            // Still here? try to extract a nameset from the chosen file
            if (isValidArchive) {
                // try to read and unzip this archive!
                JSZip.loadAsync(fileInfo)   // read the Blob
                     .then(function(zip) {  // success callback
                         console.log('reading ZIP contents...');
                         var msg = "Reading nameset contents...";
                         $hintArea.html(msg).show();
                         // How will we know when it's all (async) loaded? Count down as each entry is read!
                         var zipEntriesToLoad = 0;
                         var mainJsonPayloadFound = false;
                         var initialCache = {};
                         for (var p in zip.files) { zipEntriesToLoad++; }
                         // Stash most found data in the cache, but main JSON should be parsed
                         var nameset = null;
                         zip.forEach(function (relativePath, zipEntry) {  // 2) print entries
                             console.log('  '+ zipEntry.name);
                             console.log(zipEntry);
                             // skip directories (nothing to do here)
                             if (zipEntry.dir) {
                                 console.warn("SKIPPING directory "+ zipEntry.name +"...");
                                 zipEntriesToLoad--;
                                 return;
                             }
                             // read and store files
                             zipEntry.async('text', function(metadata) {
                                        // report progress?
                                        var msg = "Reading nameset contents ("+ zipEntry.name +"): "+ metadata.percent.toFixed(2) +" %";
                                        $hintArea.html(msg).show();
                                     })
                                     .then(function success(data) {
                                               console.log("Success unzipping "+ zipEntry.name +":\n"+ data);
                                               zipEntriesToLoad--;
                                               // parse and stash the main JSON data; cache the rest
                                               // NB that this name could include a preceding path!
                                               if ((zipEntry.name === 'main.json') || (zipEntry.name.endsWith('/main.json'))) {
                                                   // this is the expected payload for a ZIPed nameset; try to parse it!
                                                   mainJsonPayloadFound = true;
                                                   try {
                                                       nameset = JSON.parse(data);
                                                   } catch(e) {
                                                       // just swallow this and report below
                                                       nameset = null;
                                                       var msg = "<code>main.json</code> is malformed ("+ e +")!";
                                                       $hintArea.html(msg).show();
                                                   }
                                               } else {
                                                   // it's some other file; copy it to our initial cache
                                                   initialCache[ zipEntry.name ] = data;
                                               }
                                               if (zipEntriesToLoad === 0) {
                                                   // we've read in all the ZIP data! open this nameset
                                                   // (TODO: setting its initial cache) and close this popup
                                                   if (!mainJsonPayloadFound) {
                                                       var msg = "<code>main.json</code> not found in this ZIP!";
                                                       $hintArea.html(msg).show();
                                                       return;
                                                   }

                                                   // Capture some file metadata, in case it's needed in the nameset
                                                   var loadedFileName = fileInfo.name;
                                                   var lastModifiedDate = fileInfo.lastModifiedDate;
                                                   console.log("LOADING FROM FILE '"+ loadedFileName +"', LAST MODIFIED: "+ lastModifiedDate);
                                                   if (context === 'BULK_TNRS') {
                                                       // replace the main view-model on this page
                                                       loadNamesetData( nameset, loadedFileName, lastModifiedDate );
                                                       // N.B. the File API *always* downloads to an unused path+filename
                                                       $('#storage-options-popup').modal('hide');
                                                   } else {  // presumably 'STUDY_OTU_MAPPING'
                                                       // examine and apply these mappings to the OTUs in the current study
                                                       if (nameset) {
                                                           mergeNamesetData( nameset, loadedFileName, lastModifiedDate );
                                                       }
                                                       // NB if it failed to parse, we're showing a deatiled error message above
                                                   }
                                               }
                                           },
                                           function error(e) {
                                               var msg = "Problem unzipping "+ zipEntry.name +":\n"+ e.message;
                                               $hintArea.html(msg).show();
                                           });
                         });
                     },
                     function (e) {         // failure callback
                         var msg = "Error reading <strong>" + fileInfo.name + "</strong>! Is this a proper zip file?";
                         $hintArea.html(msg).show();
                     });
            } else {
                // try to extract nameset from a simple (non-ZIP) file
                var fr = new FileReader();
                fr.onload = function( evt ) {
                    var data = evt.target.result;
                    var nameset = null;
                    console.log( data );
                    if (context === 'BULK_TNRS') {
                        console.error("Unexpected context 'BULK_TNRS' for flat-file nameset!");
                    } else {  // presumably 'STUDY_OTU_MAPPING'
                        // TODO: Try conversion to standard nameset JS object
                        try {
                            nameset = JSON.parse(data);
                        } catch(e) {
                            // IF this fails, try to import TSV/CSV, line-by-line text
                            nameset = convertToNamesetModel(data);
                        }
                        if (nameset) {
                            // examine and apply these mappings to the OTUs in the current study
                            var loadedFileName = fileInfo.name;
                            var lastModifiedDate = fileInfo.lastModifiedDate;
                            mergeNamesetData( nameset, loadedFileName, lastModifiedDate );
                        } else {
                             var msg = "Error reading names from <strong>" + fileInfo.name + "</strong>! Please compare it to examples";
                             $hintArea.html(msg).show();
                        }
                    }
                };
                fr.readAsText(fileInfo);  // default encoding is utf-8
            }
    }
}

// create some isolated observables (as global JS vars!) used to support our mapping UI
var autoMappingInProgress = ko.observable(false);
var currentlyMappingNames = ko.observableArray([]); // drives spinners, etc.
var failedMappingNames = ko.observableArray([]); 
    // ignore these until we have new mapping hints
var proposedNameMappings = ko.observable({}); 
    // stored any labels proposed by server, keyed by name id [TODO?]
var bogusEditedLabelCounter = ko.observable(1);  
    // this just nudges the label-editing UI to refresh!


/* START convert 'OTU' to 'name' throughout? */

function adjustedLabelOrEmpty(label) {
    // We should only display an adjusted label if it's changed from the
    // original; otherwise return an empty string.
    if (typeof(label) === 'function') {
        label = label();
    }
    if (typeof(label) !== 'string') {
        // probably null, nothing to see here
        return "";
    }
    var adjusted = adjustedLabel(label);
    if (adjusted == label) {
        return "";
    }
    return adjusted;
}

function adjustedLabel(label) {
    // apply any active name mapping adjustments to this string
    if (typeof(label) === 'function') {
        label = label();
    }
    if (typeof(label) !== 'string') {
        // probably null
        return label;
    }
    var adjusted = label;
    // apply any active subsitutions in the viewMdel
    var subList = viewModel.mappingHints.substitutions();
    $.each(subList, function(i, subst) {
        if (!subst.active()) {
            return true; // skip to next adjustment
        }
        var oldText = subst.old();
        var newText = subst.new();
        if ($.trim(oldText) === $.trim(newText) === "") {
            return true; // skip to next adjustment
        }
        try {
            //var pattern = new RegExp(oldText, 'g');  // g = replace ALL instances
            // NO, this causes weird repetition in common cases
            var pattern = new RegExp(oldText);
            adjusted = adjusted.replace(pattern, newText);
            // clear any stale invalid-regex marking on this field
            subst.valid(true);
        } catch(e) {
            // there's probably invalid regex in the field... mark it and skip
            subst.valid(false);
        }
    });
    return adjusted;
}

// keep track of the last (de)selected list item (its position)
var lastClickedTogglePosition = null;
function toggleMappingForName(name, evt) {
    var $toggle, newState;
    // allow triggering this from anywhere in the row
    if ($(evt.target).is(':checkbox')) {
        $toggle = $(evt.target);
        // N.B. user's click (or the caller) has already set its state!
        newState = $toggle.is(':checked');
    } else {
        $toggle = $(evt.target).closest('tr').find('input.map-toggle');
        // clicking elsewhere should toggle checkbox state!
        newState = !($toggle.is(':checked'));
        forceToggleCheckbox($toggle, newState);
    }
    // add (or remove) highlight color that works with hover-color
    /* N.B. that this duplicates the effect of Knockout bindings on these table
     * rows! This is deliberate, since we're often toggling *many* rows at
     * once, so we need to update visual style while postponing any tickler
     * nudge 'til we're done.
     */
    if (newState) {
        $toggle.closest('tr').addClass('warning');
    } else {
        $toggle.closest('tr').removeClass('warning');
    }
    // if this is the original click event; check for a range!
    if (typeof(evt.shiftKey) !== 'undefined') {
        // determine the position (nth checkbox) of this name in the visible list
        var $visibleToggles = $toggle.closest('table').find('input.map-toggle');
        var newListPosition = $.inArray( $toggle[0], $visibleToggles);
        if (evt.shiftKey && typeof(lastClickedTogglePosition) === 'number') {
            forceMappingForRangeOfNames( name['selectedForAction'], lastClickedTogglePosition, newListPosition );
        }
        // in any case, make this the new range-starter
        lastClickedTogglePosition = newListPosition;
    }
    evt.stopPropagation();
    return true;  // update the checkbox
}
function forceMappingForRangeOfNames( newState, posA, posB ) {
    // update selected state for all checkboxes in this range
    var $allMappingToggles = $('input.map-toggle');
    var $togglesInRange;
    if (posB > posA) {
        $togglesInRange = $allMappingToggles.slice(posA, posB+1);
    } else {
        $togglesInRange = $allMappingToggles.slice(posB, posA+1);
    }
    $togglesInRange.each(function() {
        forceToggleCheckbox(this, newState);
    });
}

function forceToggleCheckbox(cb, newState) {
    var $cb = $(cb);
    switch(newState) {
        case (true):
            if ($cb.is(':checked') == false) {
                $cb.prop('checked', true);
                $cb.triggerHandler('click');
            }
            break;
        case (false):
            if ($cb.is(':checked')) {
                $cb.prop('checked', false);
                $cb.triggerHandler('click');
            }
            break;
        default:
            console.error("forceToggleCheckbox() invalid newState <"+ typeof(newState) +">:");
            console.error(newState);
            return;
    }
}
function toggleAllMappingCheckboxes(cb) {
    var $bigToggle = $(cb);
    var $allMappingToggles = $('input.map-toggle');
    var newState = $bigToggle.is(':checked');
    $allMappingToggles.each(function() {
        forceToggleCheckbox(this, newState);
    });
    return true;
}

function editNameLabel(name, evt) {
    var nameid = name['id'];
    var originalLabel = name['originalLabel'];
    name['adjustedLabel'] = adjustedLabel(originalLabel);

    // Mark this name as selected for mapping.
    name['selectedForAction'] = true;

    // If we have a proper mouse event, try to move input focus to this field
    // and pre-select its full text.
    //
    // N.B. There's a 'hasFocus' binding with similar behavior, but it's tricky
    // to mark the new field vs. existing ones:
    //   http://knockoutjs.com/documentation/hasfocus-binding.html
    if ('currentTarget' in evt) {
        // capture the current table row before DOM updates
        var $currentRow = $(evt.currentTarget).closest('tr');
        setTimeout(function() {
            var $editField = $currentRow.find('input:text');
            $editField.focus().select();
        }, 50);
    }

    // this should make the editor appear (altering the DOM)
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
    nudgeTickler( 'NAME_MAPPING_HINTS'); // to refresh 'selected' checkbox
}
function modifyEditedLabel(name) {
    // remove its name-id from failed-name list when user makes changes
    var nameid = name['id'];
    failedMappingNames.remove(nameid);
    // nudge to update name list immediately
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
    nudgeAutoMapping();

    nudgeTickler( 'NAME_MAPPING_HINTS');
}
function revertNameLabel(name) {
    // undoes 'editNameLabel', releasing a label to use shared hints
    var nameid = name['id'];
    delete name['adjustedLabel'];
    failedMappingNames.remove(nameid );
    // this should make the editor disappear and revert its adjusted label
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
    nudgeAutoMapping();
}

function proposeNameLabel(nameid, mappingInfo) {
    // stash one (or more) mappings as options for this name
    if ($.isArray( mappingInfo)) {
        proposedNameMappings()[ nameid ] = ko.observableArray( mappingInfo ).extend({ notify: 'always' });
    } else {
        proposedNameMappings()[ nameid ] = ko.observable( mappingInfo ).extend({ notify: 'always' });
    }
    proposedNameMappings.valueHasMutated();
    // this should make the editor appear
}
function proposedMapping( name ) {
    if (!name || typeof name['id'] === 'undefined') {
        console.log("proposedMapping() failed");
        return null;
    }
    var nameid = name['id'];
    var acc = proposedNameMappings()[ nameid ];
    return acc ? acc() : null;
}
function approveProposedNameLabel(name) {
    // undoes 'editNameLabel', releasing a label to use shared hints
    var nameid = name['id'];
    var itsMappingInfo = proposedNameMappings()[ nameid ];
    var approvedMapping = $.isFunction(itsMappingInfo) ?
        itsMappingInfo() :
        itsMappingInfo;
    if ($.isArray(approvedMapping)) {
        // apply the first (only) value
        mapNameToTaxon( nameid, approvedMapping[0] );
    } else {
        // apply the inner value of an observable (accessor) function
        mapNameToTaxon( nameid, ko.unwrap(approvedMapping) );
    }
    delete proposedNameMappings()[ nameid ];
    proposedNameMappings.valueHasMutated();
    nudgeTickler('NAME_MAPPING_HINTS');
    nudgeTickler( 'VISIBLE_NAME_MAPPINGS'); // to refresh status bar
}
function approveProposedNameMappingOption(approvedMapping, selectedIndex) {
    // similar to approveProposedNameLabel, but for a listed option
    var nameid = approvedMapping.nameID;
    mapNameToTaxon( nameid, approvedMapping );
    delete proposedNameMappings()[ nameid ];
    proposedNameMappings.valueHasMutated();
    nudgeTickler('NAME_MAPPING_HINTS');
    nudgeTickler( 'VISIBLE_NAME_MAPPINGS'); // to refresh status bar
}
function rejectProposedNameLabel(name) {
    // undoes 'proposeNameLabel', clearing its value
    var nameid = name['id'];
    delete proposedNameMappings()[ nameid ];
    proposedNameMappings.valueHasMutated();
    nudgeTickler('NAME_MAPPING_HINTS');
    nudgeTickler( 'VISIBLE_NAME_MAPPINGS'); // to refresh status bar
}

function getAllVisibleProposedMappings() {
    // gather any proposed mappings (IDs) that are visible on this page
    var visibleProposedMappings = [];
    var visibleNames = viewModel.filteredNames().pagedItems();
    $.each( visibleNames, function (i, name) {
        if (proposedMapping(name)) {
            // we have a proposed mapping for this name!
            visibleProposedMappings.push( name['id'] );
        }
    });
    return visibleProposedMappings; // return a series of IDs
}
function approveAllVisibleMappings() {
    $.each(getAllVisibleProposedMappings(), function(i, nameid) {
        var itsMappingInfo = proposedNameMappings()[ nameid ];
        var approvedMapping = $.isFunction(itsMappingInfo) ?
            itsMappingInfo() :
            itsMappingInfo;
        if ($.isArray(approvedMapping)) {
            if (approvedMapping.length === 1) {
                // test the first (only) value for possible approval
                var onlyMapping = approvedMapping[0];
                if (onlyMapping.originalMatch.is_synonym) {
                    return;  // synonyms require manual review
                }
                /* N.B. We never present the sole mapping suggestion as a
                 * taxon-name homonym, so just consider the match score to
                 * determine whether it's an "exact match".
                 */
                if (onlyMapping.originalMatch.score < 1.0) {
                    return;  // non-exact matches require manual review
                }
                // still here? then this mapping looks good enough for auto-approval
                delete proposedNameMappings()[ nameid ];
                mapNameToTaxon( nameid, approvedMapping[0], {POSTPONE_UI_CHANGES: true} );
            } else {
                return; // multiple possibilities require manual review
            }
        } else {
            // apply the inner value of an observable (accessor) function
            delete proposedNameMappings()[ nameid ];
            mapNameToTaxon( nameid, ko.unwrap(approvedMapping), {POSTPONE_UI_CHANGES: true} );
        }
    });
    proposedNameMappings.valueHasMutated();
    nudgeTickler('NAME_MAPPING_HINTS');
    nudgeTickler( 'VISIBLE_NAME_MAPPINGS'); // to refresh status bar
    startAutoMapping();
}
function rejectAllVisibleMappings() {
    $.each(getAllVisibleProposedMappings(), function(i, nameid) {
        delete proposedNameMappings()[ nameid ];
    });
    proposedNameMappings.valueHasMutated();
    stopAutoMapping();
    nudgeTickler( 'VISIBLE_NAME_MAPPINGS'); // to refresh status bar
}

function updateMappingStatus() {
    // update mapping status+details based on the current state of things
    var detailsHTML, showBatchApprove, showBatchReject, needsAttention;
    /* TODO: defaults assume nothing particularly interesting going on
    detailsHTML = '';
    showBatchApprove = false;
    showBatchReject = true;
    needsAttention = false;
    */
    var proposedMappingNeedsDecision = false;
    for (var p in proposedNameMappings()) {
        // the presence of anything here means there are proposed mappings
        proposedMappingNeedsDecision = true;
    }

    if (autoMappingInProgress() === true) {
        // auto-mapping is ACTIVE (meaning we have work in hand)
        detailsHTML = ''; // '<p'+'>Mapping in progress...<'+'/p>';
        showBatchApprove = false;
        showBatchReject = false;
        needsAttention = false;
    } else {
        if (getNextUnmappedName()) {
            // IF auto-mapping is PAUSED, but there's more to do on this page
            detailsHTML = '<p'+'>Mapping paused. Select new name or adjust mapping hints, then click the '
                         +'<strong>Map selected name</strong> button above to try again.<'+'/p>';
            showBatchApprove = false;
            showBatchReject = proposedMappingNeedsDecision;
            needsAttention = proposedMappingNeedsDecision;
        } else {
            // auto-mapping is PAUSED and everything's been mapped
            if (proposedMappingNeedsDecision) {
                // there are proposed mappings awaiting a decision
                detailsHTML = '<p'+'>All selected names have been mapped. Use the '
                        +'<span class="btn-group" style="margin: -2px 0;">'
                        +' <button class="btn btn-mini disabled"><i class="icon-ok"></i></button>'
                        +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                        +'</span>'
                        +' buttons to accept or reject each suggested mapping,'
                        +' or the buttons below to accept or reject the suggestions for all visible names.<'+'/p>';
                showBatchApprove = true;
                showBatchReject = true;
                needsAttention = true;
            } else {
                // there are NO proposed mappings awaiting a decision
                //
                /* TODO: check for two possibilities here
                if () {
                    // we can add more by including 'All trees'
                    detailsHTML = '<p'+'><strong>Congrtulations!</strong> '
                            +'Mapping is suspended because all names in this '
                            +'study\'s nominated trees have accepted labels already. To continue, '
                            +'reject some mapped labels with the '
                            +'<span class="btn-group" style="margin: -2px 0;">'
                            +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                            +'</span> '
                            +'button or change the filter to <strong>In any tree</strong>.<'+'/p>';
                    showBatchApprove = false;
                    showBatchReject = false;
                    needsAttention = true;
                } else {
                    // we're truly done with mapping (in all trees)
                    detailsHTML = '<p'+'><strong>Congrtulations!</strong> '
                            +'Mapping is suspended because all names in this study have accepted '
                            +'labels already.. To continue, use the '
                            +'<span class="btn-group" style="margin: -2px 0;">'
                            +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                            +'</span>'
                            +' buttons to reject any label at left.<'+'/p>';
                    showBatchApprove = false;
                    showBatchReject = false;
                    needsAttention = true;
                }
                */

                /* TODO: replace this stuff with if/else block above
                 */
                detailsHTML = '<p'+'>Mapping is suspended because all selected names have accepted '
                        +' labels already. To continue, select additional names to map, or use the '
                        +'<span class="btn-group" style="margin: -2px 0;">'
                        +' <button class="btn btn-mini disabled"><i class="icon-remove"></i></button>'
                        +'</span>'
                        +' buttons to reject any label at left, or change the filter and sort options'
                        +' to bring unmapped names into view.<'+'/p>';
                showBatchApprove = false;
                showBatchReject = false;
                needsAttention = true;
            }
        }
    }

    $('.mapping-details').html(detailsHTML);
    if (showBatchApprove || showBatchReject) {
        $('.mapping-batch-operations').show();
        if (showBatchApprove) {
            $('.mapping-batch-operations #batch-approve').show();
        } else {
            $('.mapping-batch-operations #batch-approve').hide();
        }
        if (showBatchReject) {
            $('.mapping-batch-operations #batch-reject').show();
        } else {
            $('.mapping-batch-operations #batch-reject').hide();
        }
    } else {
        $('.mapping-batch-operations').hide();
    }
    if (needsAttention) {
        $('#mapping-status-panel').addClass('mapping-needs-attention');
    } else {
        $('#mapping-status-panel').removeClass('mapping-needs-attention');
    }
}

function startAutoMapping() {
    // begin a daisy-chain of AJAX operations, mapping 1 label (or more?) to known taxa
    // TODO: what if there was a pending operation when we stopped?
    autoMappingInProgress( true );
    requestTaxonMapping();  // try to grab the first unmapped label in view
    updateMappingStatus();
}
function stopAutoMapping() {
    // TODO: what if there's an operation in progress? get its result, or drop it?
    autoMappingInProgress( false );
    currentlyMappingNames.removeAll();
    recentMappingSpeedBarClass( 'progress progress-info' );   // inactive blue bar
    updateMappingStatus();
}

function updateMappingSpeed( newElapsedTime ) {
    recentMappingTimes.push(newElapsedTime);
    if (recentMappingTimes.length > 5) {
        // keep just the last 5 times
        recentMappingTimes = recentMappingTimes.slice(-5);
    }

    var total = 0;
    $.each(recentMappingTimes, function(i, time) {
        total += time;
    });
    var rollingAverage = total / recentMappingTimes.length;
    var secPerName = rollingAverage / 1000;
    // show a legible number (first significant digit)
    var displaySec;
    if (secPerName >= 0.1) {
        displaySec = secPerName.toFixed(1);
    } else if (secPerName >= 0.01) {
        displaySec = secPerName.toFixed(2);
    } else {
        displaySec = secPerName.toFixed(3);
    }

    recentMappingSpeedLabel( displaySec +" sec / name");

    // use arbitrary speeds here, for bad/fair/good
    if (secPerName < 0.2) {
        recentMappingSpeedBarClass( 'progress progress-success' );  // green bar
    } else if (secPerName < 2.0) {
        recentMappingSpeedBarClass( 'progress progress-warning' );  // orange bar
    } else {
        recentMappingSpeedBarClass( 'progress progress-danger' );   // red bar
    }

    // bar width is approximate, needs ~40% to show its text
    recentMappingSpeedPercent( (40 + Math.min( (0.1 / secPerName) * 60, 60)).toFixed() +"%" );
}


function getNextUnmappedName() {
    var unmappedName = null;
    var visibleNames = viewModel.filteredNames().pagedItems();
    $.each( visibleNames, function (i, name) {
        var isAvailable = name['selectedForAction'] || false;
        // if no such attribute, consider it unavailable
        if (isAvailable) {
            var ottMappingTag = name['ottId'] || null;
            var proposedMappingInfo = proposedMapping(name);
            if (!ottMappingTag && !proposedMappingInfo) {
                // this is an unmapped name!
                if (failedMappingNames.indexOf(name['id']) === -1) {
                    // it hasn't failed mapping (at least not yet)
                    unmappedName = name;
                    return false;
                }
            }
        }
    });
    return unmappedName;
}

/* TNRS requests are sent via POST and cannot be cached by the browser. Keep
 * track of responses in a simple local cache, to avoid extra requests for
 * identical taxon names. (This is common when many similar labels have been
 * "modified for mapping").
 *
 * We'll use a FIFO strategy to keep this to a reasonable size. I believe this
 * will handle the expected case of many labels being modified to the same
 * string.
 */
var TNRSCacheSize = 200;
var TNRSCache = {};
var TNRSCacheKeys = [];
function addToTNRSCache( key, value ) {
    // add (or update) the cache for this key
    if (!(key in TNRSCache)) {
        TNRSCacheKeys.push( key );
    }
    TNRSCache[ key ] = value;
    if (TNRSCacheKeys.length > TNRSCacheSize) {
        // clear the oldest cached item
        var doomedKey = TNRSCacheKeys.shift();
        delete TNRSCache[ doomedKey ];
    }
    console.log(TNRSCache);
}
function clearTNRSCache() {
    TNRSCache = {};
};

function requestTaxonMapping( nameToMap ) {
    // set spinner, make request, handle response, and daisy-chain the next request
    // TODO: send one at a time? or in a batch (5 items)?

    // NOTE that we might be requesting a single name, else find the next unmapped one
    var singleTaxonMapping;
    if (nameToMap) {
        singleTaxonMapping = true;
        failedMappingNames.remove(nameToMap['id'] );
        autoMappingInProgress( true );
    } else {
        singleTaxonMapping = false;
        nameToMap = getNextUnmappedName();
    }
    if (!nameToMap) {
        stopAutoMapping();
        return false;
    }

    updateMappingStatus();
    var nameID = nameToMap['id'];
    var originalLabel = $.trim(nameToMap['originalLabel']) || null;
    // use the manually edited label (if any), or the hint-adjusted version
    var editedLabel = $.trim(nameToMap['adjustedLabel']);
    var searchText = (editedLabel !== '') ? editedLabel : $.trim(adjustedLabel(originalLabel));

    if (searchText.length === 0) {
        console.log("No name to match!"); // TODO
        return false;
    } else if (searchText.length < 2) {
        console.log("Need at least two letters!"); // TODO
        return false;
    }

    // groom trimmed text based on our search rules
    var searchContextName = viewModel.mappingHints.searchContext();
    var usingFuzzyMatching = viewModel.mappingHints.useFuzzyMatching() || false;
    var autoAcceptingExactMatches = viewModel.mappingHints.autoAcceptExactMatches() || false;
    // show spinner alongside this item...
    currentlyMappingNames.push( nameID );

    var mappingStartTime = new Date();

    function tnrsSuccess(data) {
        // IF there's a proper response, assert this as the name and label for this node

        // update the rolling average for the mapping-speed bar
        var mappingStopTime = new Date();
        updateMappingSpeed( mappingStopTime.getTime() - mappingStartTime.getTime() );

        var maxResults = 100;
        var visibleResults = 0;
        var resultSetsFound = (data && ('results' in data) && (data.results.length > 0));
        var candidateMatches = [ ];
        // For now, we want to auto-apply if there's exactly one match
        if (resultSetsFound) {
            switch (data.results.length) {
                case 0:
                    console.warn('NO SEARCH RESULT SETS FOUND!');
                    candidateMatches = [ ];
                    break;

                case 1:
                    // the expected case
                    candidateMatches = data.results[0].matches || [ ];
                    break;

                default:
                    console.warn('MULTIPLE SEARCH RESULT SETS (USING FIRST)');
                    console.warn(data['results']);
                    candidateMatches = data.results[0].matches || [ ];
            }
        }
        // TODO: Filter candidate matches based on their properties, scores, etc.?

        switch (candidateMatches.length) {
            case 0:
                failedMappingNames.push( nameID );
                break;

            /* SKIPPING THIS to provide uniform treatment of all matches
            case 1:
                // choose the first+only match automatically!
                ...
             */

            default:
                // multiple matches found, offer a choice
                // ASSUMES we only get one result set, with n matches

                // TODO: Sort matches based on exact text matches? fractional (matching) scores? synonyms or homonyms?
                /* initial sort on lower taxa (will be overridden by exact matches)
                candidateMatches.sort(function(a,b) {
                    if (a.is_approximate_match === b.is_approximate_match) return 0;
                    if (a.is_approximate_match) return 1;
                    if (b.is_approximate_match) return -1;
                });
                */

                /* TODO: If multiple matches point to a single taxon, show just the "best" match
                 *   - Spelling counts! Show an exact match (e.g. synonym) vs. inexact spelling.
                 *   - TODO: add more rules? or just comment the code below
                 */
                var getPreferredTaxonCandidate = function( candidateA, candidateB ) {
                    // Return whichever is preferred, based on a few criteria:
                    var matchA = candidateA.originalMatch;
                    var matchB = candidateB.originalMatch;
                    // If one is the exact match, that's ideal (but unlikely since 
                    // the TNRS apparently returned multiple candidates).
                    if (!matchA.is_approximate_match) {
                        return candidateA;
                    } else if (!matchB.is_approximate_match) {
                        return candidateB;
                    }
                    // Show the most similar name (or synonym) for this taxon.
                    if (matchA.score > matchB.score) {
                        return candidateA;
                    }
                    return candidateB;
                };
                var getPriorMatchingCandidate = function( ottId, priorCandidates ) {
                    // return any match we've already examined for this taxon
                    var priorMatch = null;
                    $.each(priorCandidates, function(i, c) {
                        if (c.ottId === ottId) {
                            priorMatch = c;
                            return false;  // there should be just one
                        }
                    });
                    return priorMatch;
                };
                var rawMatchToCandidate = function( raw, nameID ) {
                    // simplify the "raw" matches returned by TNRS
                    return {
                        name: raw.taxon['unique_name'] || raw.taxon['name'],       // matched name
                        ottId: raw.taxon['ott_id'],     // matched OTT id (as number!)
                        taxonomicSources: raw.taxon['tax_sources'],   // "upstream" taxonomies
                        //exact: false,                               // boolean (ignoring this for now)
                        //higher: false,                              // boolean
                        // TODO: Use flags for this ? higher: ($.inArray('SIBLING_HIGHER', resultToMap.flags) === -1) ? false : true
                        originalMatch: raw,
                        nameID: nameID
                    };
                }
                var candidateMappingList = [ ];
                $.each(candidateMatches, function(i, match) {
                    // convert to expected structure for proposed mappings
                    var candidate = rawMatchToCandidate( match, nameID );
                    var priorTaxonCandidate = getPriorMatchingCandidate( candidate.ottId, candidateMappingList );
                    if (priorTaxonCandidate) {
                        var priorPosition = $.inArray(priorTaxonCandidate, candidateMappingList);
                        var preferredCandidate = getPreferredTaxonCandidate( candidate, priorTaxonCandidate );
                        var alternateCandidate = (preferredCandidate === candidate) ? priorTaxonCandidate : candidate;
                        // whichever one was chosen will (re)take this place in our array
                        candidateMappingList.splice(priorPosition, 1, preferredCandidate);
                        // the other candidate will be stashed as a child, in case we need it later
                        if ('alternateTaxonCandidates' in preferredCandidate) {
                            preferredCandidate.alternateTaxonCandidates.push( alternateCandidate );
                        } else {
                            preferredCandidate.alternateTaxonCandidates = [ alternateCandidate ];
                        }
                    } else {
                        candidateMappingList.push(candidate);
                    }
                });

                var autoAcceptableMapping = null;
                if (candidateMappingList.length === 1) {
                    var onlyMapping = candidateMappingList[0];
                    /* NB - auto-accept includes synonyms if exact match!
                    if (onlyMapping.originalMatch.is_synonym) {
                        return;
                    }
                    */
                    /* N.B. We never present the sole mapping suggestion as a
                     * taxon-name homonym, so just consider the match score to
                     * determine whether it's an "exact match".
                     */
                    if (onlyMapping.originalMatch.score === 1.0) {
                        autoAcceptableMapping = onlyMapping;
                    }
                }
                if (autoAcceptingExactMatches && autoAcceptableMapping) {
                    // accept the obvious choice (and possibly update UI) immediately
                    mapNameToTaxon( nameID, autoAcceptableMapping, {POSTPONE_UI_CHANGES: true} );
                } else {
                    // postpone actual mapping until user chooses
                    proposeNameLabel(nameID, candidateMappingList);
                }
        }

        currentlyMappingNames.remove( nameID );

        if (singleTaxonMapping) {
            stopAutoMapping();
        } else if (autoMappingInProgress()) {
            // after a brief pause, try for the next available name...
            setTimeout(requestTaxonMapping, 10);
        }

        return false;
    }

    var TNRSQueryAndCacheKey = JSON.stringify({
        "names": [searchText],
        "include_suppressed": false,
        "do_approximate_matching": (singleTaxonMapping || usingFuzzyMatching) ? true : false,
        "context_name": searchContextName
    });

    $.ajax({
        url: doTNRSForMappingOTUs_url,  // NOTE that actual server-side method name might be quite different!
        type: 'POST',
        dataType: 'json',
        data: TNRSQueryAndCacheKey,  // data (asterisk required for completion suggestions)
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        beforeSend: function () {
            // check our local cache to see if this is a repeat
            var cachedResponse = TNRSCache[ TNRSQueryAndCacheKey ];
            if (cachedResponse) {
                tnrsSuccess( cachedResponse );
                return false;
            }
            return true;
        },
        error: function(jqXHR, textStatus, errorThrown) {

            console.log("!!! somethiny went terribly wrong");
            console.log(jqXHR.responseText);

            showErrorMessage("Something went wrong in taxomachine:\n"+ jqXHR.responseText);

            if (!autoMappingInProgress()) {
                // curator has paused all mapping
                return false;
            }

            currentlyMappingNames.remove( nameID );

            // let's hope it's something about this label and try the next one...
            failedMappingNames.push( nameID );
            if (singleTaxonMapping) {
                stopAutoMapping();
            } else if (autoMappingInProgress()) {
                setTimeout(requestTaxonMapping, 100);
            }

        },
        success: function(data) {
            // add this response to the local cache
            addToTNRSCache( TNRSQueryAndCacheKey, data );
            tnrsSuccess(data);
        }
    });

    return false;
}

function getNameByID(id) {
    // return the matching otu, or null if not found
    var matchingName = null;
    $.each( viewModel.names(), function(i, name) {
        if (name.id === id) {  
            matchingName = name;
            return false;
        }
    });
    return matchingName;
    /* TODO: if performance suffers, use fast lookup!
    var lookup = getFastLookup('NAMES_BY_ID');
    return lookup[ id ] || null;
    */
}


function mapNameToTaxon( nameID, mappingInfo, options ) {
    /* Apply this mapping, creating Nexson elements as needed
     *
     * mappingInfo should be an object with these properties:
     * {
     *   "name" : "Centranthus",
     *   "ottId" : "759046",
     *
     *   // these may also be present, but aren't important here
     *     "exact" : false,
     *     "higher" : true
     * }
     *
     * N.B. We *always* add/change/remove these properties in tandem!
     *    ottId
     *    ottTaxonName
     *    taxonomicSources
     */

    // If options.POSTPONE_UI_CHANGES, please do so (else we crawl when
    // approving hundreds of mappings)
    options = options || {};

    // FOR NOW, assume that any leaf node will have a corresponding otu entry;
    // otherwise, we can't have name for the node!
    var name = getNameByID( nameID );

    // De-select this name in the mapping UI
    name['selectedForAction'] = false;

    // add (or update) a metatag mapping this to an OTT id
    name['ottId'] = Number(mappingInfo.ottId);

    // Add/update the OTT name (cached here for performance)
    name['ottTaxonName'] = mappingInfo.name || 'OTT NAME MISSING!';
    // N.B. We always preserve originalLabel for reference

    // add "upstream" taxonomic sources
    name['taxonomicSources'] = mappingInfo.taxonomicSources || 'TAXONOMIC SOURCES MISSING!';

    // Clear any proposed/adjusted label (this is trumped by mapping to OTT)
    delete name['adjustedLabel'];

    if (!options.POSTPONE_UI_CHANGES) {
        nudgeTickler('NAME_MAPPING_HINTS');
    }
}

function unmapNameFromTaxon( nameOrID, options ) {
    // remove this mapping, removing any unneeded Nexson elements

    // If options.POSTPONE_UI_CHANGES, please do so (else we crawl when
    // clearing hundreds of mappings)
    options = options || {};

    var name = (typeof nameOrID === 'object') ? nameOrID : getNameByID( nameOrID );
    // restore its original label (versus mapped label)
    var originalLabel = name['originalLabel'];

    // strip any metatag mapping this to an OTT id
    if ('ottId' in name) {
        delete name['ottId'];
    }
    if ('ottTaxonName' in name) {
        delete name['ottTaxonName'];
    }
    if ('taxonomicSources' in name) {
        delete name['taxonomicSources'];
    }

    if (!options.POSTPONE_UI_CHANGES) {
        nudgeTickler('NAME_MAPPING_HINTS');
        nudgeTickler('VISIBLE_NAME_MAPPINGS');
    }
}

function addMetaTagToParent( parent, props ) {
    // wrap submitted properties to make an observable metatag
    var newTag = cloneFromSimpleObject( props );
    if (!parent.meta) {
        // add a meta collection here
        parent['meta'] = [ ];
    } else if (!$.isArray(parent.meta)) {
        // convert a Badgerfish "singleton" to a proper array
        parent['meta'] = [ parent.meta ];
    }
    parent.meta.push( newTag );
}


function clearSelectedMappings() {
    // TEMPORARY helper to demo mapping tools, clears mapping for the visible (paged) names.
    var visibleNames = viewModel.filteredNames().pagedItems();
    $.each( visibleNames, function (i, name) {
        if (name['selectedForAction']) {
            // clear any "established" mapping (already approved)
            unmapNameFromTaxon( name, {POSTPONE_UI_CHANGES: true} );
            // clear any proposed mapping
            delete proposedNameMappings()[ name['id'] ];
        }
    });
    clearFailedNameList();
    proposedNameMappings.valueHasMutated();
    nudgeTickler('NAME_MAPPING_HINTS');
}

async function clearAllMappings() {
    var allNames = viewModel.names();
    if (await asyncConfirm("WARNING: This will un-map all "+ allNames.length +" names in the current study! Are you sure you want to do this?")) {
        // TEMPORARY helper to demo mapping tools, clears mapping for the visible (paged) names.
        $.each( allNames, function (i, name) {
            // clear any "established" mapping (already approved)
            unmapNameFromTaxon( name, {POSTPONE_UI_CHANGES: true} );
            // clear any proposed mapping
            delete proposedNameMappings()[ name['id'] ];
        });
        clearFailedNameList();
        proposedNameMappings.valueHasMutated();
        nudgeTickler('NAME_MAPPING_HINTS');
    }
}

/* END convert 'OTU' to 'name' throughout? */










/* Define a registry of nudge methods, for use in KO data bindings. Calling
 * a nudge function will update one or more observables to trigger updates
 * in the curation UI. This approach allows us to work without observables,
 * which in turn means we can edit enormous viewmodels.
 */
var nudge = {
    'METADATA': function( data, event ) {
        nudgeTickler( 'METADATA');
        return true;
    },
    'VISIBLE_NAME_MAPPINGS': function( data, event ) {
        nudgeTickler( 'VISIBLE_NAME_MAPPINGS');
        return true;
    },
    'NAME_MAPPING_HINTS': function( data, event ) {
        nudgeTickler( 'NAME_MAPPING_HINTS');
        return true;
    },
    'INPUT_FILES': function( data, event ) {
        nudgeTickler( 'INPUT_FILES');
        return true;
    }
    // TODO: Add more for any ticklers added below
}
function nudgeTickler( name ) {
    if (name === 'ALL') {
        for (var aName in viewModel.ticklers) {
            nudgeTickler( aName );
        }
        return;
    }

    var tickler = viewModel.ticklers[ name ];
    if (!tickler) {
        console.error("No such tickler: '"+ name +"'!");
        return;
    }
    var oldValue = tickler.peek();
    tickler( oldValue + 1 );

    // if this reflects changes to the study, nudge the main 'dirty flag' tickler
    if (name !== 'COLLECTIONS_LIST') {
        viewModel.ticklers.NAMESET_HAS_CHANGED( viewModel.ticklers.NAMESET_HAS_CHANGED.peek() + 1 );
        console.warn('NAMESET_HAS_CHANGED');
    }
}

function showNamesetMetadata() {
    $('#nameset-metadata-prompt').hide();
    $('#nameset-metadata-panel').show();
}
function hideNamesetMetadata() {
    $('#nameset-metadata-panel').hide();
    $('#nameset-metadata-prompt').show();
}

function showMappingOptions() {
    $('#mapping-options-prompt').hide();
    $('#mapping-options-panel').show();
}
function hideMappingOptions() {
    $('#mapping-options-panel').hide();
    $('#mapping-options-prompt').show();
}

function disableSaveButton() {
    var $btn = $('#save-nameset-button');
    $btn.addClass('disabled');
    $btn.unbind('click').click(function(evt) {
        showInfoMessage('There are no unsaved changes.');
        return false;
    });
}
function enableSaveButton() {
    var $btn = $('#save-nameset-button');
    $btn.removeClass('disabled');
    $btn.unbind('click').click(function(evt) {
        if (browserSupportsFileAPI()) {
            showSaveNamesetPopup();
        } else {
            asyncAlert("Sorry, this browser does not support saving to a local file!");
        }
        return false;
    });
}

function showLoadListPopup( ) {
    showFilesystemPopup('#load-list-popup');
}
function showLoadNamesetPopup( ) {
    $('#load-nameset-popup').off('hide').on('hide', function () {
        if (context === 'STUDY_OTU_MAPPING') {
            // clear any prior search input
            clearNamesetUploadWidget();
            clearNamesetPastedText();
        }
    });
    showFilesystemPopup('#load-nameset-popup');
}
function showSaveNamesetPopup( ) {
    showFilesystemPopup('#save-nameset-popup');
}
function showFilesystemPopup( popupSelector ) {
    // expects a valid jQuery selector for the popup in DOM
    var $popup = $(popupSelector);
    $popup.modal('show');

    // (re)bind UI with Knockout
    var $boundElements = $popup.find('.modal-body'); // add other elements?
    $.each($boundElements, function(i, el) {
        ko.cleanNode(el);
        ko.applyBindings({},el);
    });
}

function getMappedNamesTally() {
    // return display-ready tally (mapped/total ratio and percentage)
    var thinSpace = '&#8201;';
    if (!viewModel || !viewModel.names || viewModel.names().length === 0) {
        return '<strong>0</strong><span>'+ thinSpace +'/'+ thinSpace + '0 &nbsp;</span><span style="color: #999;">(0%)</span>';
    }
    var totalNameCount = viewModel.names().length;
    var mappedNameCount = $.grep(viewModel.names(), function(name, i) {
        return (!name.ottId) ? false: true;
    }).length;
    return '<strong>'+ mappedNameCount +'</strong><span>'+ thinSpace +'/'+ thinSpace + totalNameCount +' &nbsp;</span><span style="color: #999;">('+ floatToPercent(mappedNameCount / totalNameCount) +'%)</span>';
}
function mappingProgressAsPercent() {
    if (!viewModel || !viewModel.names || viewModel.names().length === 0) {
        return 0;
    }
    var totalNameCount = viewModel.names().length;
    var mappedNameCount = $.grep( viewModel.names(), function(name, i) {
        return (!name.ottId) ? false: true;
    }).length;
    return floatToPercent(mappedNameCount / totalNameCount);
}
function floatToPercent( dec ) {
    // assumes a float between 0.0 and 1.0
    // EXAMPLE: 0.232 ==> 23%
    return Math.round(dec * 100);
}

function browserSupportsFileAPI() {
    // Can load and manipulate local files in this browser?
    return (window.File && 
            window.FileReader && 
            window.FileList && 
            window.Blob) ? true : false;
}

function addSubstitution( clicked ) {
    var subst = ko.mapping.fromJS({
        'old': "",
        'new': "",
        'active': true,
        'valid': true
    });

    if ($(clicked).is('select')) {
        var chosenSub = $(clicked).val();
        if (chosenSub === '') {
            // do nothing, we're still at the prompt
            return false;
        }
        // add the chosen subsitution
        var parts = chosenSub.split(' =:= ');
        subst.old( parts[0] || '' );
        subst.new( parts[1] || '' );
        subst.valid(true);
        subst.active(true);
        // reset the SELECT widget to its prompt
        $(clicked).val('');
    }
    viewModel.mappingHints.substitutions.push(subst);
    clearFailedNameList();
    nudgeTickler('NAME_MAPPING_HINTS');
}
function removeSubstitution( data ) {
    var subList = viewModel.mappingHints.substitutions();
    removeFromArray( data, subList );
    if (subList.length === 0) {
        // add an inactive substitution with prompts
        addSubstitution();
    } else {
        clearFailedNameList();
        nudgeTickler('NAME_MAPPING_HINTS');
    }
}
function updateMappingHints( data ) {
    // after-effects of changes to search context or any substitution
    clearFailedNameList();
    adjustedLabel("TEST");   // validate all substitutions
    nudgeTickler('NAME_MAPPING_HINTS');
    return true;
}

function getAttrsForMappingOption( optionData, numOptions ) {
    var attrs = {
        'title': parseInt(optionData.originalMatch.score * 100) +"% match of original label",
        'class': "badge ",
        'style': ("opacity: "+ matchScoreToOpacity(optionData.originalMatch.score) +";")
    }
    // for now, use standard colors that will still pop for color-blind users
    if (optionData.originalMatch.is_synonym) {
        attrs.title = ('Matched on synonym '+ optionData.originalMatch.matched_name);
        attrs.class += ' badge-info';
    } else if ((numOptions > 1) && (optionData.originalMatch.matched_name !== optionData.originalMatch.taxon.unique_name)) {
        // Let's assume a single result is the right answer
        attrs.title = ('Taxon-name homonym');
        attrs.class += ' badge-warning';
    } else {
        // keep default label with matching score
        attrs.class += ' badge-success';
    }
    // each should also link to the taxonomy browser
    attrs.href = getTaxobrowserURL(optionData['ottId']);
    attrs.target = '_blank';
    attrs.title += ' (click for more information)'
    return attrs;
}
function matchScoreToOpacity(score) {
    /* Remap scores (generally from 0.75 to 1.0, but 0.1 is possible!) to be more visible
     * This is best accomplished by remapping to a curve, e.g.
     *   OPACITY = SCORE^2 + 0.15
     *   OPACITY = 0.8 * SCORE^2 + 0.2
     *   OPACITY = 0.8 * SCORE + 0.2
     * The effect we want is full opacity (1.0) for a 1.0 score, fading rapidly
     * for the common (higher) scores, with a floor of ~0.2 opacity (enough to
     * show color and maintain legibility).
     */
    return (0.8 * score) + 0.2;
}

// support for a color-coded "speedometer" for server-side mapping (some as JS globals)
var recentMappingTimes = [ ];
recentMappingSpeedLabel = ko.observable(""); // seconds per name, based on rolling average
recentMappingSpeedPercent = ko.observable(0); // affects color of bar, etc
recentMappingSpeedBarClass = ko.observable('progress progress-info');

// this should be cleared whenever something changes in mapping hints
function clearFailedNameList() {
    failedMappingNames.removeAll();
    // nudge to update name list immediately
    bogusEditedLabelCounter( bogusEditedLabelCounter() + 1);
    nudgeAutoMapping();
}
function nudgeAutoMapping() {
    // restart auto-mapping, if enabled
    if (autoMappingInProgress()) {
        if (currentlyMappingNames.length === 0) {
            // looks like we ran out of steam.. try again!
            requestTaxonMapping();
        }
    }
}




function inferSearchContextFromAvailableNames() {
    // Fetch the least inclusive context via AJAX, and update the drop-down menu
    var namesToSubmit = [ ];
    var maxNamesToSubmit = 5000;  // if more than this, drop extra names evenly
    console.log(">> found "+ viewModel.names().length +" names in the nameset");
    var namesToSubmit = $.map(viewModel.names(), function(name, index) {
        return ('ottTaxonName' in name) ? name['ottTaxonName'] : name['originalLabel'];
    });
    if (namesToSubmit.length > maxNamesToSubmit) {
        // reduce the list in a distributed fashion (eg, every fourth item)
        var stepSize = maxNamesToSubmit / namesToSubmit.length;
        ///console.log("TOO MANY NAMES, reducing with step-size "+ stepSize);
        // creep to whole numbers, keeping an item every time we increment by one
        var currentStepTotal = 0.0;
        var nextWholeNumber = 1;
        namesToSubmit = namesToSubmit.filter(function(item, index) {
            if ((currentStepTotal += stepSize) >= nextWholeNumber) {
                nextWholeNumber += 1; // bump to next number
                return true;
            }
            return false;
        });
    }
    console.log(">> submitting "+ namesToSubmit.length +" names in the nameset");
    if (namesToSubmit.length === 0) {
        return; // this is a no-op
    }

    ///showModalScreen("Inferring search context...", {SHOW_BUSY_BAR:true});

    $.ajax({
        type: 'POST',
        dataType: 'json',
        // crossdomain: true,
        contentType: "application/json; charset=utf-8",
        url: getContextForNames_url,
        processData: false,
        data: ('{"names": '+ JSON.stringify(namesToSubmit) +'}'),
        complete: function( jqXHR, textStatus ) {
            // report errors or malformed data, if any
            if (textStatus !== 'success') {
                showErrorMessage('Sorry, there was an error inferring the search context.');
                console.log("ERROR: textStatus !== 'success', but "+ textStatus);
                return;
            }
            var result = JSON.parse( jqXHR.responseText );
            var inferredContext = null;
            if (result && 'context_name' in result) {
                inferredContext = result['context_name'];
            }
            ///console.log(">> inferredContext: "+ inferredContext);
            if (inferredContext) {
                // update BOTH search-context drop-down menus to show this result
                $('select[name=taxon-search-context]').val(inferredContext);
                // Tweak the model's name mapping, then refresh the UI
                // N.B. We check first to avoid adding an unnecessary unsaved-data warning!
                if (viewModel.mappingHints.searchContext() !== inferredContext) {
                    viewModel.mappingHints.searchContext(inferredContext);
                    updateMappingHints();
                }
            } else {
                showErrorMessage('Sorry, no search context was inferred.');
            }
        }
    });
}

// Keep a safe copy of our UI markup, for re-use as a Knockout template (see below)
var $stashedEditArea = null;

// Load a nameset from JS/JSON data (usu. called by convenience functions below)
function loadNamesetData( data, loadedFileName, lastModifiedDate ) {
    /* Parse this data as `nameset` (a simple JS object), then convert this
     * into our primary view model for KnockoutJS  (by convention, it's usually
     * named 'viewModel').
     */
    var nameset;
    switch(typeof data) { 
        case 'object':
            if (!data) {
                // it's null, or undefined? or something dumb
                nameset = getNewNamesetModel();
            } else {
                nameset = data;
            }
            break;
        case 'undefined':
            nameset = getNewNamesetModel();
            break;
        case 'string':
            try {
                nameset = JSON.parse(data);
            } catch(e) {
                // IF this fails, try to import TSV/CSV, line-by-line text
                nameset = convertToNamesetModel(data);
            }
            break;
        default: 
            console.error("Unexpected type for nameset data: "+ (typeof data));
            nameset = null;
    }

    /* "Normalize" the nameset by adding any missing properties and metadata.
     * (This is mainly useful when loading an older archived nameset, to
     * catch up with any changes to the expected data model.)
     */
    if (nameset.metadata['date_created'] === undefined) {
        // creation date is not knowable; match last-saved date from file
        nameset.metadata.date_created = lastModifiedDate.toISOString();
    }
    if (nameset.metadata['last_saved'] === undefined) {
        // assume last-saved date from file is correct
        nameset.metadata.last_saved = lastModifiedDate.toISOString();
    }
    if (nameset.metadata['save_count'] === undefined) {
        // true number of saves is not knowable, but there's been at least one!
        nameset.metadata.save_count = 1;
    }
    if (nameset.metadata['latest_ott_version'] === undefined) {
        nameset.metadata.latest_ott_version = null;
    }
    if (loadedFileName) {
        // We just loaded an archive file! Store its latest filename.
        nameset.metadata.previous_filename = loadedFileName;
    }
    if (nameset.mappingHints['autoAcceptExactMatches'] === undefined) {
        nameset.mappingHints['autoAcceptExactMatches'] = false;
    }

    /* Name and export the new viewmodel. NOTE that we don't create observables
     * for names and their many properties! This should help keep things snappy
     * when woriing with very large lists.
     */
    var knockoutMappingOptions = {
        'copy': ["names"]  // we'll make the 'names' array observable below
    };

    exports.viewModel = viewModel = ko.mapping.fromJS(nameset, knockoutMappingOptions);
    viewModel.names = ko.observableArray(viewModel.names);

    // cleanup of incoming data
    removeDuplicateNames(viewModel);

    // take initial stab at setting search context for TNRS?
    inferSearchContextFromAvailableNames();

    /* 
     * Add observable properties to the model to support the UI. 
     */

    // prettier display dates
    viewModel.displayCreationDate = ko.computed(function() {
        var date = viewModel.metadata.date_created();
        return formatISODate(date);
    });
    viewModel.displayLastSave = ko.computed(function() {
        var date = viewModel.metadata.last_saved();
        if (date) {
            return 'Last saved '+ formatISODate(date);
        } else {
            return 'This nameset has not been saved.';
        }
    });
    viewModel.displayPreviousFilename = ko.computed(function() {
        var fileName = viewModel.metadata.previous_filename();
        if (fileName) {
            return "Loaded from file <code>"+ fileName +"</code>.";
        } else {
            return 'This is a new nameset (no previous filename).';
        }
    });

    // Add a series of observable "ticklers" to signal changes in
    // the model without observable Nexson properties. Each is an
    // integer that creeps up by 1 to signal a change somewhere in
    // related Nexson elements.
    viewModel.ticklers = {
        'METADATA': ko.observable(1),
        'INPUT_FILES': ko.observable(1),
        'NAME_MAPPING_HINTS': ko.observable(1),
        'VISIBLE_NAME_MAPPINGS': ko.observable(1),
        // TODO: add more as needed...
        'NAMESET_HAS_CHANGED': ko.observable(1)
    }

    // support fast lookup of elements by ID, for largest trees
    viewModel.fastLookups = {
        'NAMES_BY_ID': null
    };

    // enable sorting and filtering lists in the editor
    var listFilterDefaults = {
        // track these defaults so we can reset them in history
        'NAMES': {
            // TODO: add 'pagesize'?
            'match': "",
            'order': "Unmapped names first"
        }
    };
    viewModel.filterDelay = 250; // ms to wait for changes before updating filter
    viewModel.listFilters = {
        // UI widgets bound to these variables will trigger the
        // computed display lists below..
        'NAMES': {
            // TODO: add 'pagesize'?
            'match': ko.observable( listFilterDefaults.NAMES.match ),
            'order': ko.observable( listFilterDefaults.NAMES.order )
        }
    };
    // any change to these list filters should reset pagination for the current display list
    // NB this is a streamlined version of the more general fix in study-editor.js!
    $.each(viewModel.listFilters.NAMES, function(filterName, filterObservable) {
        filterObservable.subscribe(function(newValue) {
            // ignore value, just reset pagination (back to page 1)
            viewModel._filteredOTUs.goToPage(1);
        });
    });
 
    // maintain a persistent array to preserve pagination (reset when computed)
    viewModel._filteredNames = ko.observableArray( ).asPaged(500);
    viewModel.filteredNames = ko.computed(function() {
        // filter raw name list, then sort, returning a
        // new (OR MODIFIED??) paged observableArray
        ///var ticklers = [ viewModel.ticklers.NAME_MAPPING_HINTS() ];

        updateClearSearchWidget( '#name-list-filter' );
        //updateListFiltersWithHistory();

        var match = viewModel.listFilters.NAMES.match(),
            matchWithDiacriticals = addDiacriticalVariants(match),
            matchPattern = new RegExp( $.trim(matchWithDiacriticals), 'i' );
        var order = viewModel.listFilters.NAMES.order();

        // capture current positions, to avoid unnecessary "jumping" in the list
        captureDefaultSortOrder(viewModel.names());

        /* TODO: pool all name IDs into a common object?
        var chosenNameIDs = {};
        console.warn(chosenNameIDs);
        if (chosenNameIDs.length > 0) {
            console.warn("Here's the first of chosenNameIDs:");
            console.warn(chosenNameIDs[0]);
        } else {
            console.warn("chosenNameIDs is an empty list!");
        }
        */

        // map old array to new and return it
        var filteredList = ko.utils.arrayFilter(
            viewModel.names(),
            function(name) {
                // match entered text against old or new label
                var originalLabel = name['originalLabel'];
                var modifiedLabel = name['adjustedLabel'] || adjustedLabel(originalLabel);
                var mappedLabel = name['ottTaxonName'];
                if (!matchPattern.test(originalLabel) &&
                    !matchPattern.test(modifiedLabel) &&
                    !matchPattern.test(mappedLabel)) {
                    return false;
                }
                return true;
            }
        );  // END of list filtering

        // apply selected sort order
        switch(order) {
            /* REMINDER: in sort functions, results are as follows:
             *  -1 = a comes before b
             *   0 = no change
             *   1 = b comes before a
             */
            case 'Unmapped names first':
                filteredList.sort(function(a,b) {
                    // N.B. This works even if there's no such property.
                    //if (checkForInterestingStudies(a,b)) { debugger; }
                    var aMapStatus = $.trim(a['ottTaxonName']) !== '';
                    var bMapStatus = $.trim(b['ottTaxonName']) !== '';
                    if (aMapStatus === bMapStatus) {
                        if (!aMapStatus) { // both names are currently un-mapped
                            // Force failed mappings to the bottom of the list
                            var aFailedMapping = (failedMappingNames.indexOf(a['id']) !== -1);
                            var bFailedMapping = (failedMappingNames.indexOf(b['id']) !== -1);
                            if (aFailedMapping === bFailedMapping) {
                                // Try to retain their prior precedence in
                                // the list (avoid items jumping around)
                                /*return (a.priorPosition < b.priorPosition) ? -1:1;
                                 * Should this supercede our typical use of `maintainRelativeListPositions`?
                                 */
                                return maintainRelativeListPositions(a, b);
                            }
                            if (aFailedMapping) {
                                return 1;   // force a (failed) below b
                            }
                            return -1;   // force b (failed) below a
                        } else {
                            //return (a.priorPosition < b.priorPosition) ? -1:1;
                            return maintainRelativeListPositions(a, b);
                        }
                    }
                    if (aMapStatus) return 1;
                    if (bMapStatus) return -1;
                });
                break;

            case 'Mapped names first':
                filteredList.sort(function(a,b) {
                    var aMapStatus = $.trim(a['ottTaxonName']) !== '';
                    var bMapStatus = $.trim(b['ottTaxonName']) !== '';
                    if (aMapStatus === bMapStatus) {
                        return maintainRelativeListPositions(a, b);
                    }
                    if (aMapStatus) return -1;
                    return 1;
                });
                break;

            case 'Original name (A-Z)':
                filteredList.sort(function(a,b) {
                    var aOriginal = $.trim(a['originalLabel']);
                    var bOriginal = $.trim(b['originalLabel']);
                    if (aOriginal === bOriginal) {
                        return maintainRelativeListPositions(a, b);
                    }
                    if (aOriginal < bOriginal) return -1;
                    return 1;
                });
                break;

            case 'Original name (Z-A)':
                filteredList.sort(function(a,b) {
                    var aOriginal = $.trim(a['originalLabel']);
                    var bOriginal = $.trim(b['originalLabel']);
                    if (aOriginal === bOriginal) {
                        return maintainRelativeListPositions(a, b);
                    }
                    if (aOriginal > bOriginal) return -1;
                    return 1;
                });
                break;

            default:
                console.log("Unexpected order for name list: ["+ order +"]");
                return false;

        }

        // Un-select any name that's now out of view (ie, outside of the first page of results)
        var itemsInView = filteredList.slice(0, viewModel._filteredNames.pageSize);
        viewModel.names().map(function(name) {
            if (name['selectedForAction']) {
                var isOutOfView = ($.inArray(name, itemsInView) === -1);
                if (isOutOfView) {
                    name['selectedForAction'] = false;
                }
            }
        });

        // clear any stale last-selected name (it's likely moved)
        lastClickedTogglePosition = null;

        viewModel._filteredNames( filteredList );
        return viewModel._filteredNames;
    }).extend({ throttle: viewModel.filterDelay }); // END of filteredNames

    // Stash the pristine markup before binding our UI for the first time
    if ($stashedEditArea === null) {
        $stashedEditArea = $('#Name-Mapping').clone();
    } else {
        // Replace with pristine markup to avoid weird results when loading a new nameset
        $('#Name-Mapping').contents().replaceWith(
            $stashedEditArea.clone().contents()
        );
    }

    // (re)bind to editor UI with Knockout
    var $boundElements = $('#Name-Mapping, #help-file-api-prompt'); // add other elements?
    $.each($boundElements, function(i, el) {
        ko.cleanNode(el);
        ko.applyBindings(viewModel,el);
    });

    /* Any further changes (*after* initial cleanup) should prompt for a save
     * before leaving this page.
     */
    viewModel.ticklers.NAMESET_HAS_CHANGED.subscribe( function() {
        namesetHasUnsavedChanges = true;
        enableSaveButton();
        pushPageExitWarning('UNSAVED_NAMESET_CHANGES',
                            "WARNING: This nameset has unsaved changes! To preserve your work, you should save a nameset file before leaving or reloading the page.");
    });
    popPageExitWarning('UNSAVED_NAMESET_CHANGES');
    namesetHasUnsavedChanges = false;
    disableSaveButton();
}

// keep track of the largest (and thus next available) name id
var highestNameOrdinalNumber = null;
function findHighestNameOrdinalNumber() {
    // do a one-time scan for the highest ID currently in use
    var highestOrdinalNumber = 0;
    var allNames = viewModel.names();
    for (var i = 0; i < allNames.length; i++) {
        var testName = allNames[i];
        var testID = ko.unwrap(testName['id']) || '';
        if (testID === '') {
            console.error("MISSING ID for this name:");
            console.error(testName);
            continue;  // skip to next element
        }
        if (testID.indexOf('name') === 0) {
            // compare this to the highest ID found so far
            var itsNumber = testID.split( 'name' )[1];
            if ($.isNumeric( itsNumber )) {
                highestOrdinalNumber = Math.max( highestOrdinalNumber, itsNumber );
            }
        }
    }
    return highestOrdinalNumber;
}
function getNextNameOrdinalNumber() {
    // increment and return the next available ordinal number for names; this
    // is typically used to mint a new id, e.g. 23 => 'name23'
    if (highestNameOrdinalNumber === null) {
        highestNameOrdinalNumber = findHighestNameOrdinalNumber();
    }
    // increment the highest ID for faster assignment next time
    highestNameOrdinalNumber++;
    return highestNameOrdinalNumber;
}


function removeDuplicateNames( viewmodel ) {
    /* Call this when loading a nameset *or* adding names!  We should walk the
     * full names array and clobber any later duplicates. This array is always
     * sorted by creation order, so a simple approach should preserve the
     * curator's existing mappings and label adjustments.
     */
    var labelsAlreadyFound = [ ];
    var dupes = [ ];
    $.each( viewModel.names(), function(i, name) {
        var testLabel = $.trim(name.originalLabel);
        if (labelsAlreadyFound.indexOf(testLabel) === -1) {
            // add this to labels found (test later names against this)
            labelsAlreadyFound.push(testLabel);
        } else {
            // this is a dupe of an earlier name!
            dupes.push(name);
        }
    });
    viewModel.names.removeAll( dupes );
}

function formatISODate( dateString, options ) {
    // copied from synth-tree viewer (otu_statistics.html)
    options = options || {includeTime: true};
    var aDate = new moment(dateString);
    // see http://momentjs.com/docs/#/parsing/string/
    if (options.includeTime) {
        return aDate.format('MMMM Do YYYY, hA');
    } else {
        return aDate.format('MMMM Do YYYY');
    }
}

function showPossibleMappingsKey() {
    // explain colors and opacity in a popup (already bound)
    $('#possible-mappings-key').modal('show');
}

$(document).ready(function() {
    switch (context) {
        case 'BULK_TNRS':
            // Always start with an empty set, binding it to the UI
            loadNamesetData( null );
            // auto-select the main (UI) tab
            $('a[href=#Name-Mapping]').tab('show');
            break;
        case 'STUDY_OTU_MAPPING':
            console.log("Anything to do on ready?");
            break;
        case '???':
        default:
            // do nothing for now (possibly study View page)
            break;
    }
});

// export some members as a simple API
var api = [
    'nudge',  // expose ticklers for KO bindings
    'getDefaultArchiveFilename',
    'saveCurrentNameset',
    'loadListFromChosenFile',
    'loadNamesetFromChosenFile',
    'showLoadListPopup',
    'showLoadNamesetPopup',
    'showSaveNamesetPopup',
    'browserSupportsFileAPI',
    'autoMappingInProgress',
    'updateMappingHints',
    'showNamesetMetadata',
    'hideNamesetMetadata',
    'inferSearchContextFromAvailableNames',
    'showMappingOptions',
    'hideMappingOptions',
    'disableSaveButton',
    'enableSaveButton',
    'getAttrsForMappingOption',
    'startAutoMapping',
    'stopAutoMapping',
    'getMappedNamesTally',
    'mappingProgressAsPercent',
    'bogusEditedLabelCounter',
    'toggleMappingForName',
    'toggleAllMappingCheckboxes',
    'proposedMapping',
    'adjustedLabelOrEmpty',
    'currentlyMappingNames',
    'failedMappingNames',
    'editNameLabel',
    'revertNameLabel',
    'modifyEditedLabel',
    'approveProposedNameLabel',
    'approveProposedNameMappingOption',
    'approveAllVisibleMappings',
    'rejectProposedNameLabel',
    'rejectAllVisibleMappings',
    'mapNameToTaxon',
    'unmapNameFromTaxon',
    'clearSelectedMappings',
    'clearAllMappings',
    'showPossibleMappingsKey',
    'addSubstitution',
    'removeSubstitution',
    'formatISODate',
    'convertToNamesetModel',
    'context'
];
$.each(api, function(i, methodName) {
    // populate the default 'module.exports' object
    exports[ methodName ] = eval( methodName );
});

},{"assert":1,"blob-polyfill":6,"file-saver":8,"jszip":10}]},{},[15])(15)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Fzc2VydC9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwibm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ibG9iLXBvbHlmaWxsL0Jsb2IuanMiLCJub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZpbGUtc2F2ZXIvRmlsZVNhdmVyLmpzIiwibm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvanN6aXAvZGlzdC9qc3ppcC5taW4uanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWFzc2lnbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwidG5ycy1tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2p2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb2JqZWN0QXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG4vLyBjb21wYXJlIGFuZCBpc0J1ZmZlciB0YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2Jsb2IvNjgwZTllNWU0ODhmMjJhYWMyNzU5OWE1N2RjODQ0YTYzMTU5MjhkZC9pbmRleC5qc1xuLy8gb3JpZ2luYWwgbm90aWNlOlxuXG4vKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5mdW5jdGlvbiBjb21wYXJlKGEsIGIpIHtcbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIHZhciB4ID0gYS5sZW5ndGg7XG4gIHZhciB5ID0gYi5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV07XG4gICAgICB5ID0gYltpXTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuICBpZiAoeSA8IHgpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGlzQnVmZmVyKGIpIHtcbiAgaWYgKGdsb2JhbC5CdWZmZXIgJiYgdHlwZW9mIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcihiKTtcbiAgfVxuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKTtcbn1cblxuLy8gYmFzZWQgb24gbm9kZSBhc3NlcnQsIG9yaWdpbmFsIG5vdGljZTpcbi8vIE5COiBUaGUgVVJMIHRvIHRoZSBDb21tb25KUyBzcGVjIGlzIGtlcHQganVzdCBmb3IgdHJhZGl0aW9uLlxuLy8gICAgIG5vZGUtYXNzZXJ0IGhhcyBldm9sdmVkIGEgbG90IHNpbmNlIHRoZW4sIGJvdGggaW4gQVBJIGFuZCBiZWhhdmlvci5cblxuLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBmdW5jdGlvbnNIYXZlTmFtZXMgPSAoZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZnVuY3Rpb24gZm9vKCkge30ubmFtZSA9PT0gJ2Zvbyc7XG59KCkpO1xuZnVuY3Rpb24gcFRvU3RyaW5nIChvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopO1xufVxuZnVuY3Rpb24gaXNWaWV3KGFycmJ1Zikge1xuICBpZiAoaXNCdWZmZXIoYXJyYnVmKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIGdsb2JhbC5BcnJheUJ1ZmZlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyLmlzVmlldyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBBcnJheUJ1ZmZlci5pc1ZpZXcoYXJyYnVmKTtcbiAgfVxuICBpZiAoIWFycmJ1Zikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoYXJyYnVmIGluc3RhbmNlb2YgRGF0YVZpZXcpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoYXJyYnVmLmJ1ZmZlciAmJiBhcnJidWYuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG52YXIgcmVnZXggPSAvXFxzKmZ1bmN0aW9uXFxzKyhbXlxcKFxcc10qKVxccyovO1xuLy8gYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2xqaGFyYi9mdW5jdGlvbi5wcm90b3R5cGUubmFtZS9ibG9iL2FkZWVlZWM4YmZjYzYwNjhiMTg3ZDdkOWZiM2Q1YmIxZDNhMzA4OTkvaW1wbGVtZW50YXRpb24uanNcbmZ1bmN0aW9uIGdldE5hbWUoZnVuYykge1xuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihmdW5jKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzKSB7XG4gICAgcmV0dXJuIGZ1bmMubmFtZTtcbiAgfVxuICB2YXIgc3RyID0gZnVuYy50b1N0cmluZygpO1xuICB2YXIgbWF0Y2ggPSBzdHIubWF0Y2gocmVnZXgpO1xuICByZXR1cm4gbWF0Y2ggJiYgbWF0Y2hbMV07XG59XG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH0gZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gZ2V0TmFtZShzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodHlwZW9mIHMgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5mdW5jdGlvbiBpbnNwZWN0KHNvbWV0aGluZykge1xuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzIHx8ICF1dGlsLmlzRnVuY3Rpb24oc29tZXRoaW5nKSkge1xuICAgIHJldHVybiB1dGlsLmluc3BlY3Qoc29tZXRoaW5nKTtcbiAgfVxuICB2YXIgcmF3bmFtZSA9IGdldE5hbWUoc29tZXRoaW5nKTtcbiAgdmFyIG5hbWUgPSByYXduYW1lID8gJzogJyArIHJhd25hbWUgOiAnJztcbiAgcmV0dXJuICdbRnVuY3Rpb24nICsgIG5hbWUgKyAnXSc7XG59XG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKGluc3BlY3Qoc2VsZi5hY3R1YWwpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoaW5zcGVjdChzZWxmLmV4cGVjdGVkKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgZmFsc2UpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmFzc2VydC5kZWVwU3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBkZWVwU3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwU3RyaWN0RXF1YWwnLCBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBzdHJpY3QsIG1lbW9zKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgJiYgaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGNvbXBhcmUoYWN0dWFsLCBleHBlY3RlZCkgPT09IDA7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKChhY3R1YWwgPT09IG51bGwgfHwgdHlwZW9mIGFjdHVhbCAhPT0gJ29iamVjdCcpICYmXG4gICAgICAgICAgICAgKGV4cGVjdGVkID09PSBudWxsIHx8IHR5cGVvZiBleHBlY3RlZCAhPT0gJ29iamVjdCcpKSB7XG4gICAgcmV0dXJuIHN0cmljdCA/IGFjdHVhbCA9PT0gZXhwZWN0ZWQgOiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gSWYgYm90aCB2YWx1ZXMgYXJlIGluc3RhbmNlcyBvZiB0eXBlZCBhcnJheXMsIHdyYXAgdGhlaXIgdW5kZXJseWluZ1xuICAvLyBBcnJheUJ1ZmZlcnMgaW4gYSBCdWZmZXIgZWFjaCB0byBpbmNyZWFzZSBwZXJmb3JtYW5jZVxuICAvLyBUaGlzIG9wdGltaXphdGlvbiByZXF1aXJlcyB0aGUgYXJyYXlzIHRvIGhhdmUgdGhlIHNhbWUgdHlwZSBhcyBjaGVja2VkIGJ5XG4gIC8vIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcgKGFrYSBwVG9TdHJpbmcpLiBOZXZlciBwZXJmb3JtIGJpbmFyeVxuICAvLyBjb21wYXJpc29ucyBmb3IgRmxvYXQqQXJyYXlzLCB0aG91Z2gsIHNpbmNlIGUuZy4gKzAgPT09IC0wIGJ1dCB0aGVpclxuICAvLyBiaXQgcGF0dGVybnMgYXJlIG5vdCBpZGVudGljYWwuXG4gIH0gZWxzZSBpZiAoaXNWaWV3KGFjdHVhbCkgJiYgaXNWaWV3KGV4cGVjdGVkKSAmJlxuICAgICAgICAgICAgIHBUb1N0cmluZyhhY3R1YWwpID09PSBwVG9TdHJpbmcoZXhwZWN0ZWQpICYmXG4gICAgICAgICAgICAgIShhY3R1YWwgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHxcbiAgICAgICAgICAgICAgIGFjdHVhbCBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkpIHtcbiAgICByZXR1cm4gY29tcGFyZShuZXcgVWludDhBcnJheShhY3R1YWwuYnVmZmVyKSxcbiAgICAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShleHBlY3RlZC5idWZmZXIpKSA9PT0gMDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgIT09IGlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBtZW1vcyA9IG1lbW9zIHx8IHthY3R1YWw6IFtdLCBleHBlY3RlZDogW119O1xuXG4gICAgdmFyIGFjdHVhbEluZGV4ID0gbWVtb3MuYWN0dWFsLmluZGV4T2YoYWN0dWFsKTtcbiAgICBpZiAoYWN0dWFsSW5kZXggIT09IC0xKSB7XG4gICAgICBpZiAoYWN0dWFsSW5kZXggPT09IG1lbW9zLmV4cGVjdGVkLmluZGV4T2YoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1lbW9zLmFjdHVhbC5wdXNoKGFjdHVhbCk7XG4gICAgbWVtb3MuZXhwZWN0ZWQucHVzaChleHBlY3RlZCk7XG5cbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgc3RyaWN0LCBtZW1vcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYiwgc3RyaWN0LCBhY3R1YWxWaXNpdGVkT2JqZWN0cykge1xuICBpZiAoYSA9PT0gbnVsbCB8fCBhID09PSB1bmRlZmluZWQgfHwgYiA9PT0gbnVsbCB8fCBiID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBpZiBvbmUgaXMgYSBwcmltaXRpdmUsIHRoZSBvdGhlciBtdXN0IGJlIHNhbWVcbiAgaWYgKHV0aWwuaXNQcmltaXRpdmUoYSkgfHwgdXRpbC5pc1ByaW1pdGl2ZShiKSlcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgaWYgKHN0cmljdCAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYSkgIT09IE9iamVjdC5nZXRQcm90b3R5cGVPZihiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIHZhciBhSXNBcmdzID0gaXNBcmd1bWVudHMoYSk7XG4gIHZhciBiSXNBcmdzID0gaXNBcmd1bWVudHMoYik7XG4gIGlmICgoYUlzQXJncyAmJiAhYklzQXJncykgfHwgKCFhSXNBcmdzICYmIGJJc0FyZ3MpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGFJc0FyZ3MpIHtcbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIsIHN0cmljdCk7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKTtcbiAgdmFyIGtiID0gb2JqZWN0S2V5cyhiKTtcbiAgdmFyIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT09IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldLCBzdHJpY3QsIGFjdHVhbFZpc2l0ZWRPYmplY3RzKSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZhbHNlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG5hc3NlcnQubm90RGVlcFN0cmljdEVxdWFsID0gbm90RGVlcFN0cmljdEVxdWFsO1xuZnVuY3Rpb24gbm90RGVlcFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwU3RyaWN0RXF1YWwnLCBub3REZWVwU3RyaWN0RXF1YWwpO1xuICB9XG59XG5cblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElnbm9yZS4gIFRoZSBpbnN0YW5jZW9mIGNoZWNrIGRvZXNuJ3Qgd29yayBmb3IgYXJyb3cgZnVuY3Rpb25zLlxuICB9XG5cbiAgaWYgKEVycm9yLmlzUHJvdG90eXBlT2YoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWU7XG59XG5cbmZ1bmN0aW9uIF90cnlCbG9jayhibG9jaykge1xuICB2YXIgZXJyb3I7XG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9yID0gZTtcbiAgfVxuICByZXR1cm4gZXJyb3I7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh0eXBlb2YgYmxvY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJsb2NrXCIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnc3RyaW5nJykge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICBhY3R1YWwgPSBfdHJ5QmxvY2soYmxvY2spO1xuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgdmFyIHVzZXJQcm92aWRlZE1lc3NhZ2UgPSB0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZyc7XG4gIHZhciBpc1Vud2FudGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIHV0aWwuaXNFcnJvcihhY3R1YWwpO1xuICB2YXIgaXNVbmV4cGVjdGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIGFjdHVhbCAmJiAhZXhwZWN0ZWQ7XG5cbiAgaWYgKChpc1Vud2FudGVkRXhjZXB0aW9uICYmXG4gICAgICB1c2VyUHJvdmlkZWRNZXNzYWdlICYmXG4gICAgICBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHxcbiAgICAgIGlzVW5leHBlY3RlZEV4Y2VwdGlvbikge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cyh0cnVlLCBibG9jaywgZXJyb3IsIG1lc3NhZ2UpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MoZmFsc2UsIGJsb2NrLCBlcnJvciwgbWVzc2FnZSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB0aHJvdyBlcnI7IH07XG5cbi8vIEV4cG9zZSBhIHN0cmljdCBvbmx5IHZhcmlhbnQgb2YgYXNzZXJ0XG5mdW5jdGlvbiBzdHJpY3QodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09Jywgc3RyaWN0KTtcbn1cbmFzc2VydC5zdHJpY3QgPSBvYmplY3RBc3NpZ24oc3RyaWN0LCBhc3NlcnQsIHtcbiAgZXF1YWw6IGFzc2VydC5zdHJpY3RFcXVhbCxcbiAgZGVlcEVxdWFsOiBhc3NlcnQuZGVlcFN0cmljdEVxdWFsLFxuICBub3RFcXVhbDogYXNzZXJ0Lm5vdFN0cmljdEVxdWFsLFxuICBub3REZWVwRXF1YWw6IGFzc2VydC5ub3REZWVwU3RyaWN0RXF1YWxcbn0pO1xuYXNzZXJ0LnN0cmljdC5zdHJpY3QgPSBhc3NlcnQuc3RyaWN0O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5leHBvcnRzLnRvQnl0ZUFycmF5ID0gdG9CeXRlQXJyYXlcbmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IGZyb21CeXRlQXJyYXlcblxudmFyIGxvb2t1cCA9IFtdXG52YXIgcmV2TG9va3VwID0gW11cbnZhciBBcnIgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgPyBVaW50OEFycmF5IDogQXJyYXlcblxudmFyIGNvZGUgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLydcbmZvciAodmFyIGkgPSAwLCBsZW4gPSBjb2RlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gIGxvb2t1cFtpXSA9IGNvZGVbaV1cbiAgcmV2TG9va3VwW2NvZGUuY2hhckNvZGVBdChpKV0gPSBpXG59XG5cbi8vIFN1cHBvcnQgZGVjb2RpbmcgVVJMLXNhZmUgYmFzZTY0IHN0cmluZ3MsIGFzIE5vZGUuanMgZG9lcy5cbi8vIFNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0I1VSTF9hcHBsaWNhdGlvbnNcbnJldkxvb2t1cFsnLScuY2hhckNvZGVBdCgwKV0gPSA2MlxucmV2TG9va3VwWydfJy5jaGFyQ29kZUF0KDApXSA9IDYzXG5cbmZ1bmN0aW9uIGdldExlbnMgKGI2NCkge1xuICB2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXG4gIGlmIChsZW4gJSA0ID4gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG4gIH1cblxuICAvLyBUcmltIG9mZiBleHRyYSBieXRlcyBhZnRlciBwbGFjZWhvbGRlciBieXRlcyBhcmUgZm91bmRcbiAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYmVhdGdhbW1pdC9iYXNlNjQtanMvaXNzdWVzLzQyXG4gIHZhciB2YWxpZExlbiA9IGI2NC5pbmRleE9mKCc9JylcbiAgaWYgKHZhbGlkTGVuID09PSAtMSkgdmFsaWRMZW4gPSBsZW5cblxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gdmFsaWRMZW4gPT09IGxlblxuICAgID8gMFxuICAgIDogNCAtICh2YWxpZExlbiAlIDQpXG5cbiAgcmV0dXJuIFt2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuXVxufVxuXG4vLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKGI2NCkge1xuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiBfYnl0ZUxlbmd0aCAoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSB7XG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiB0b0J5dGVBcnJheSAoYjY0KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuXG4gIHZhciBhcnIgPSBuZXcgQXJyKF9ieXRlTGVuZ3RoKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikpXG5cbiAgdmFyIGN1ckJ5dGUgPSAwXG5cbiAgLy8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuICB2YXIgbGVuID0gcGxhY2VIb2xkZXJzTGVuID4gMFxuICAgID8gdmFsaWRMZW4gLSA0XG4gICAgOiB2YWxpZExlblxuXG4gIHZhciBpXG4gIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxOCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDEyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPDwgNikgfFxuICAgICAgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAzKV1cbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gMTYpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDIpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldID4+IDQpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAxKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDEwKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgNCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildID4+IDIpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuICByZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gNiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtICYgMHgzRl1cbn1cblxuZnVuY3Rpb24gZW5jb2RlQ2h1bmsgKHVpbnQ4LCBzdGFydCwgZW5kKSB7XG4gIHZhciB0bXBcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAzKSB7XG4gICAgdG1wID1cbiAgICAgICgodWludDhbaV0gPDwgMTYpICYgMHhGRjAwMDApICtcbiAgICAgICgodWludDhbaSArIDFdIDw8IDgpICYgMHhGRjAwKSArXG4gICAgICAodWludDhbaSArIDJdICYgMHhGRilcbiAgICBvdXRwdXQucHVzaCh0cmlwbGV0VG9CYXNlNjQodG1wKSlcbiAgfVxuICByZXR1cm4gb3V0cHV0LmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIGZyb21CeXRlQXJyYXkgKHVpbnQ4KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbiA9IHVpbnQ4Lmxlbmd0aFxuICB2YXIgZXh0cmFCeXRlcyA9IGxlbiAlIDMgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcbiAgdmFyIHBhcnRzID0gW11cbiAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODMgLy8gbXVzdCBiZSBtdWx0aXBsZSBvZiAzXG5cbiAgLy8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuICBmb3IgKHZhciBpID0gMCwgbGVuMiA9IGxlbiAtIGV4dHJhQnl0ZXM7IGkgPCBsZW4yOyBpICs9IG1heENodW5rTGVuZ3RoKSB7XG4gICAgcGFydHMucHVzaChlbmNvZGVDaHVuayhcbiAgICAgIHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aClcbiAgICApKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXSArXG4gICAgICAnPT0nXG4gICAgKVxuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDEwXSArXG4gICAgICBsb29rdXBbKHRtcCA+PiA0KSAmIDB4M0ZdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDIpICYgMHgzRl0gK1xuICAgICAgJz0nXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCIvKiBCbG9iLmpzXG4gKiBBIEJsb2IgaW1wbGVtZW50YXRpb24uXG4gKiAyMDE0LTA3LTI0XG4gKlxuICogQnkgRWxpIEdyZXksIGh0dHA6Ly9lbGlncmV5LmNvbVxuICogQnkgRGV2aW4gU2FtYXJpbiwgaHR0cHM6Ly9naXRodWIuY29tL2RzYW1hcmluXG4gKiBMaWNlbnNlOiBYMTEvTUlUXG4gKiAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9CbG9iLmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0UubWRcbiAqL1xuXG4vKmdsb2JhbCBzZWxmLCB1bmVzY2FwZSAqL1xuLypqc2xpbnQgYml0d2lzZTogdHJ1ZSwgcmVnZXhwOiB0cnVlLCBjb25mdXNpb246IHRydWUsIGVzNTogdHJ1ZSwgdmFyczogdHJ1ZSwgd2hpdGU6IHRydWUsXG4gIHBsdXNwbHVzOiB0cnVlICovXG5cbi8qISBAc291cmNlIGh0dHA6Ly9wdXJsLmVsaWdyZXkuY29tL2dpdGh1Yi9CbG9iLmpzL2Jsb2IvbWFzdGVyL0Jsb2IuanMgKi9cblxuKGZ1bmN0aW9uICh2aWV3KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZpZXcuVVJMID0gdmlldy5VUkwgfHwgdmlldy53ZWJraXRVUkw7XG5cblx0aWYgKHZpZXcuQmxvYiAmJiB2aWV3LlVSTCkge1xuXHRcdHRyeSB7XG5cdFx0XHRuZXcgQmxvYjtcblx0XHRcdHJldHVybjtcblx0XHR9IGNhdGNoIChlKSB7fVxuXHR9XG5cblx0Ly8gSW50ZXJuYWxseSB3ZSB1c2UgYSBCbG9iQnVpbGRlciBpbXBsZW1lbnRhdGlvbiB0byBiYXNlIEJsb2Igb2ZmIG9mXG5cdC8vIGluIG9yZGVyIHRvIHN1cHBvcnQgb2xkZXIgYnJvd3NlcnMgdGhhdCBvbmx5IGhhdmUgQmxvYkJ1aWxkZXJcblx0dmFyIEJsb2JCdWlsZGVyID0gdmlldy5CbG9iQnVpbGRlciB8fCB2aWV3LldlYktpdEJsb2JCdWlsZGVyIHx8IHZpZXcuTW96QmxvYkJ1aWxkZXIgfHwgKGZ1bmN0aW9uKHZpZXcpIHtcblx0XHR2YXJcblx0XHRcdCAgZ2V0X2NsYXNzID0gZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0XHRcdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KS5tYXRjaCgvXlxcW29iamVjdFxccyguKilcXF0kLylbMV07XG5cdFx0XHR9XG5cdFx0XHQsIEZha2VCbG9iQnVpbGRlciA9IGZ1bmN0aW9uIEJsb2JCdWlsZGVyKCkge1xuXHRcdFx0XHR0aGlzLmRhdGEgPSBbXTtcblx0XHRcdH1cblx0XHRcdCwgRmFrZUJsb2IgPSBmdW5jdGlvbiBCbG9iKGRhdGEsIHR5cGUsIGVuY29kaW5nKSB7XG5cdFx0XHRcdHRoaXMuZGF0YSA9IGRhdGE7XG5cdFx0XHRcdHRoaXMuc2l6ZSA9IGRhdGEubGVuZ3RoO1xuXHRcdFx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdFx0XHR0aGlzLmVuY29kaW5nID0gZW5jb2Rpbmc7XG5cdFx0XHR9XG5cdFx0XHQsIEZCQl9wcm90byA9IEZha2VCbG9iQnVpbGRlci5wcm90b3R5cGVcblx0XHRcdCwgRkJfcHJvdG8gPSBGYWtlQmxvYi5wcm90b3R5cGVcblx0XHRcdCwgRmlsZVJlYWRlclN5bmMgPSB2aWV3LkZpbGVSZWFkZXJTeW5jXG5cdFx0XHQsIEZpbGVFeGNlcHRpb24gPSBmdW5jdGlvbih0eXBlKSB7XG5cdFx0XHRcdHRoaXMuY29kZSA9IHRoaXNbdGhpcy5uYW1lID0gdHlwZV07XG5cdFx0XHR9XG5cdFx0XHQsIGZpbGVfZXhfY29kZXMgPSAoXG5cdFx0XHRcdCAgXCJOT1RfRk9VTkRfRVJSIFNFQ1VSSVRZX0VSUiBBQk9SVF9FUlIgTk9UX1JFQURBQkxFX0VSUiBFTkNPRElOR19FUlIgXCJcblx0XHRcdFx0KyBcIk5PX01PRElGSUNBVElPTl9BTExPV0VEX0VSUiBJTlZBTElEX1NUQVRFX0VSUiBTWU5UQVhfRVJSXCJcblx0XHRcdCkuc3BsaXQoXCIgXCIpXG5cdFx0XHQsIGZpbGVfZXhfY29kZSA9IGZpbGVfZXhfY29kZXMubGVuZ3RoXG5cdFx0XHQsIHJlYWxfVVJMID0gdmlldy5VUkwgfHwgdmlldy53ZWJraXRVUkwgfHwgdmlld1xuXHRcdFx0LCByZWFsX2NyZWF0ZV9vYmplY3RfVVJMID0gcmVhbF9VUkwuY3JlYXRlT2JqZWN0VVJMXG5cdFx0XHQsIHJlYWxfcmV2b2tlX29iamVjdF9VUkwgPSByZWFsX1VSTC5yZXZva2VPYmplY3RVUkxcblx0XHRcdCwgVVJMID0gcmVhbF9VUkxcblx0XHRcdCwgYnRvYSA9IHZpZXcuYnRvYVxuXHRcdFx0LCBhdG9iID0gdmlldy5hdG9iXG5cblx0XHRcdCwgQXJyYXlCdWZmZXIgPSB2aWV3LkFycmF5QnVmZmVyXG5cdFx0XHQsIFVpbnQ4QXJyYXkgPSB2aWV3LlVpbnQ4QXJyYXlcblxuXHRcdFx0LCBvcmlnaW4gPSAvXltcXHctXSs6XFwvKlxcWz9bXFx3XFwuOi1dK1xcXT8oPzo6WzAtOV0rKT8vXG5cdFx0O1xuXHRcdEZha2VCbG9iLmZha2UgPSBGQl9wcm90by5mYWtlID0gdHJ1ZTtcblx0XHR3aGlsZSAoZmlsZV9leF9jb2RlLS0pIHtcblx0XHRcdEZpbGVFeGNlcHRpb24ucHJvdG90eXBlW2ZpbGVfZXhfY29kZXNbZmlsZV9leF9jb2RlXV0gPSBmaWxlX2V4X2NvZGUgKyAxO1xuXHRcdH1cblx0XHQvLyBQb2x5ZmlsbCBVUkxcblx0XHRpZiAoIXJlYWxfVVJMLmNyZWF0ZU9iamVjdFVSTCkge1xuXHRcdFx0VVJMID0gdmlldy5VUkwgPSBmdW5jdGlvbih1cmkpIHtcblx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0ICB1cmlfaW5mbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIiwgXCJhXCIpXG5cdFx0XHRcdFx0LCB1cmlfb3JpZ2luXG5cdFx0XHRcdDtcblx0XHRcdFx0dXJpX2luZm8uaHJlZiA9IHVyaTtcblx0XHRcdFx0aWYgKCEoXCJvcmlnaW5cIiBpbiB1cmlfaW5mbykpIHtcblx0XHRcdFx0XHRpZiAodXJpX2luZm8ucHJvdG9jb2wudG9Mb3dlckNhc2UoKSA9PT0gXCJkYXRhOlwiKSB7XG5cdFx0XHRcdFx0XHR1cmlfaW5mby5vcmlnaW4gPSBudWxsO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR1cmlfb3JpZ2luID0gdXJpLm1hdGNoKG9yaWdpbik7XG5cdFx0XHRcdFx0XHR1cmlfaW5mby5vcmlnaW4gPSB1cmlfb3JpZ2luICYmIHVyaV9vcmlnaW5bMV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB1cmlfaW5mbztcblx0XHRcdH07XG5cdFx0fVxuXHRcdFVSTC5jcmVhdGVPYmplY3RVUkwgPSBmdW5jdGlvbihibG9iKSB7XG5cdFx0XHR2YXJcblx0XHRcdFx0ICB0eXBlID0gYmxvYi50eXBlXG5cdFx0XHRcdCwgZGF0YV9VUklfaGVhZGVyXG5cdFx0XHQ7XG5cdFx0XHRpZiAodHlwZSA9PT0gbnVsbCkge1xuXHRcdFx0XHR0eXBlID0gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcblx0XHRcdH1cblx0XHRcdGlmIChibG9iIGluc3RhbmNlb2YgRmFrZUJsb2IpIHtcblx0XHRcdFx0ZGF0YV9VUklfaGVhZGVyID0gXCJkYXRhOlwiICsgdHlwZTtcblx0XHRcdFx0aWYgKGJsb2IuZW5jb2RpbmcgPT09IFwiYmFzZTY0XCIpIHtcblx0XHRcdFx0XHRyZXR1cm4gZGF0YV9VUklfaGVhZGVyICsgXCI7YmFzZTY0LFwiICsgYmxvYi5kYXRhO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGJsb2IuZW5jb2RpbmcgPT09IFwiVVJJXCIpIHtcblx0XHRcdFx0XHRyZXR1cm4gZGF0YV9VUklfaGVhZGVyICsgXCIsXCIgKyBkZWNvZGVVUklDb21wb25lbnQoYmxvYi5kYXRhKTtcblx0XHRcdFx0fSBpZiAoYnRvYSkge1xuXHRcdFx0XHRcdHJldHVybiBkYXRhX1VSSV9oZWFkZXIgKyBcIjtiYXNlNjQsXCIgKyBidG9hKGJsb2IuZGF0YSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGFfVVJJX2hlYWRlciArIFwiLFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KGJsb2IuZGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAocmVhbF9jcmVhdGVfb2JqZWN0X1VSTCkge1xuXHRcdFx0XHRyZXR1cm4gcmVhbF9jcmVhdGVfb2JqZWN0X1VSTC5jYWxsKHJlYWxfVVJMLCBibG9iKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdFVSTC5yZXZva2VPYmplY3RVUkwgPSBmdW5jdGlvbihvYmplY3RfVVJMKSB7XG5cdFx0XHRpZiAob2JqZWN0X1VSTC5zdWJzdHJpbmcoMCwgNSkgIT09IFwiZGF0YTpcIiAmJiByZWFsX3Jldm9rZV9vYmplY3RfVVJMKSB7XG5cdFx0XHRcdHJlYWxfcmV2b2tlX29iamVjdF9VUkwuY2FsbChyZWFsX1VSTCwgb2JqZWN0X1VSTCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRGQkJfcHJvdG8uYXBwZW5kID0gZnVuY3Rpb24oZGF0YS8qLCBlbmRpbmdzKi8pIHtcblx0XHRcdHZhciBiYiA9IHRoaXMuZGF0YTtcblx0XHRcdC8vIGRlY29kZSBkYXRhIHRvIGEgYmluYXJ5IHN0cmluZ1xuXHRcdFx0aWYgKFVpbnQ4QXJyYXkgJiYgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkpIHtcblx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0ICBzdHIgPSBcIlwiXG5cdFx0XHRcdFx0LCBidWYgPSBuZXcgVWludDhBcnJheShkYXRhKVxuXHRcdFx0XHRcdCwgaSA9IDBcblx0XHRcdFx0XHQsIGJ1Zl9sZW4gPSBidWYubGVuZ3RoXG5cdFx0XHRcdDtcblx0XHRcdFx0Zm9yICg7IGkgPCBidWZfbGVuOyBpKyspIHtcblx0XHRcdFx0XHRzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJiLnB1c2goc3RyKTtcblx0XHRcdH0gZWxzZSBpZiAoZ2V0X2NsYXNzKGRhdGEpID09PSBcIkJsb2JcIiB8fCBnZXRfY2xhc3MoZGF0YSkgPT09IFwiRmlsZVwiKSB7XG5cdFx0XHRcdGlmIChGaWxlUmVhZGVyU3luYykge1xuXHRcdFx0XHRcdHZhciBmciA9IG5ldyBGaWxlUmVhZGVyU3luYztcblx0XHRcdFx0XHRiYi5wdXNoKGZyLnJlYWRBc0JpbmFyeVN0cmluZyhkYXRhKSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gYXN5bmMgRmlsZVJlYWRlciB3b24ndCB3b3JrIGFzIEJsb2JCdWlsZGVyIGlzIHN5bmNcblx0XHRcdFx0XHR0aHJvdyBuZXcgRmlsZUV4Y2VwdGlvbihcIk5PVF9SRUFEQUJMRV9FUlJcIik7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIEZha2VCbG9iKSB7XG5cdFx0XHRcdGlmIChkYXRhLmVuY29kaW5nID09PSBcImJhc2U2NFwiICYmIGF0b2IpIHtcblx0XHRcdFx0XHRiYi5wdXNoKGF0b2IoZGF0YS5kYXRhKSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoZGF0YS5lbmNvZGluZyA9PT0gXCJVUklcIikge1xuXHRcdFx0XHRcdGJiLnB1c2goZGVjb2RlVVJJQ29tcG9uZW50KGRhdGEuZGF0YSkpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGRhdGEuZW5jb2RpbmcgPT09IFwicmF3XCIpIHtcblx0XHRcdFx0XHRiYi5wdXNoKGRhdGEuZGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgZGF0YSAhPT0gXCJzdHJpbmdcIikge1xuXHRcdFx0XHRcdGRhdGEgKz0gXCJcIjsgLy8gY29udmVydCB1bnN1cHBvcnRlZCB0eXBlcyB0byBzdHJpbmdzXG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gZGVjb2RlIFVURi0xNiB0byBiaW5hcnkgc3RyaW5nXG5cdFx0XHRcdGJiLnB1c2godW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KGRhdGEpKSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRGQkJfcHJvdG8uZ2V0QmxvYiA9IGZ1bmN0aW9uKHR5cGUpIHtcblx0XHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdFx0XHR0eXBlID0gbnVsbDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBuZXcgRmFrZUJsb2IodGhpcy5kYXRhLmpvaW4oXCJcIiksIHR5cGUsIFwicmF3XCIpO1xuXHRcdH07XG5cdFx0RkJCX3Byb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gXCJbb2JqZWN0IEJsb2JCdWlsZGVyXVwiO1xuXHRcdH07XG5cdFx0RkJfcHJvdG8uc2xpY2UgPSBmdW5jdGlvbihzdGFydCwgZW5kLCB0eXBlKSB7XG5cdFx0XHR2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cdFx0XHRpZiAoYXJncyA8IDMpIHtcblx0XHRcdFx0dHlwZSA9IG51bGw7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbmV3IEZha2VCbG9iKFxuXHRcdFx0XHQgIHRoaXMuZGF0YS5zbGljZShzdGFydCwgYXJncyA+IDEgPyBlbmQgOiB0aGlzLmRhdGEubGVuZ3RoKVxuXHRcdFx0XHQsIHR5cGVcblx0XHRcdFx0LCB0aGlzLmVuY29kaW5nXG5cdFx0XHQpO1xuXHRcdH07XG5cdFx0RkJfcHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBcIltvYmplY3QgQmxvYl1cIjtcblx0XHR9O1xuXHRcdEZCX3Byb3RvLmNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnNpemUgPSAwO1xuXHRcdFx0ZGVsZXRlIHRoaXMuZGF0YTtcblx0XHR9O1xuXHRcdHJldHVybiBGYWtlQmxvYkJ1aWxkZXI7XG5cdH0odmlldykpO1xuXG5cdHZpZXcuQmxvYiA9IGZ1bmN0aW9uKGJsb2JQYXJ0cywgb3B0aW9ucykge1xuXHRcdHZhciB0eXBlID0gb3B0aW9ucyA/IChvcHRpb25zLnR5cGUgfHwgXCJcIikgOiBcIlwiO1xuXHRcdHZhciBidWlsZGVyID0gbmV3IEJsb2JCdWlsZGVyKCk7XG5cdFx0aWYgKGJsb2JQYXJ0cykge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGJsb2JQYXJ0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRpZiAoVWludDhBcnJheSAmJiBibG9iUGFydHNbaV0gaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG5cdFx0XHRcdFx0YnVpbGRlci5hcHBlbmQoYmxvYlBhcnRzW2ldLmJ1ZmZlcik7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0YnVpbGRlci5hcHBlbmQoYmxvYlBhcnRzW2ldKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHR2YXIgYmxvYiA9IGJ1aWxkZXIuZ2V0QmxvYih0eXBlKTtcblx0XHRpZiAoIWJsb2Iuc2xpY2UgJiYgYmxvYi53ZWJraXRTbGljZSkge1xuXHRcdFx0YmxvYi5zbGljZSA9IGJsb2Iud2Via2l0U2xpY2U7XG5cdFx0fVxuXHRcdHJldHVybiBibG9iO1xuXHR9O1xuXG5cdHZhciBnZXRQcm90b3R5cGVPZiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRyZXR1cm4gb2JqZWN0Ll9fcHJvdG9fXztcblx0fTtcblx0dmlldy5CbG9iLnByb3RvdHlwZSA9IGdldFByb3RvdHlwZU9mKG5ldyB2aWV3LkJsb2IoKSk7XG59KHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiICYmIHNlbGYgfHwgdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cgfHwgdGhpcy5jb250ZW50IHx8IHRoaXMpKTtcbiIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuXG52YXIgS19NQVhfTEVOR1RIID0gMHg3ZmZmZmZmZlxuZXhwb3J0cy5rTWF4TGVuZ3RoID0gS19NQVhfTEVOR1RIXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFByaW50IHdhcm5pbmcgYW5kIHJlY29tbWVuZCB1c2luZyBgYnVmZmVyYCB2NC54IHdoaWNoIGhhcyBhbiBPYmplY3RcbiAqICAgICAgICAgICAgICAgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIFdlIHJlcG9ydCB0aGF0IHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGlmIHRoZSBhcmUgbm90IHN1YmNsYXNzYWJsZVxuICogdXNpbmcgX19wcm90b19fLiBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YFxuICogKFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4KS4gSUUgMTAgbGFja3Mgc3VwcG9ydFxuICogZm9yIF9fcHJvdG9fXyBhbmQgaGFzIGEgYnVnZ3kgdHlwZWQgYXJyYXkgaW1wbGVtZW50YXRpb24uXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gdHlwZWRBcnJheVN1cHBvcnQoKVxuXG5pZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gIGNvbnNvbGUuZXJyb3IoXG4gICAgJ1RoaXMgYnJvd3NlciBsYWNrcyB0eXBlZCBhcnJheSAoVWludDhBcnJheSkgc3VwcG9ydCB3aGljaCBpcyByZXF1aXJlZCBieSAnICtcbiAgICAnYGJ1ZmZlcmAgdjUueC4gVXNlIGBidWZmZXJgIHY0LnggaWYgeW91IHJlcXVpcmUgb2xkIGJyb3dzZXIgc3VwcG9ydC4nXG4gIClcbn1cblxuZnVuY3Rpb24gdHlwZWRBcnJheVN1cHBvcnQgKCkge1xuICAvLyBDYW4gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWQ/XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLl9fcHJvdG9fXyA9IHsgX19wcm90b19fOiBVaW50OEFycmF5LnByb3RvdHlwZSwgZm9vOiBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9IH1cbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MlxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdwYXJlbnQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHRoaXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyXG4gIH1cbn0pXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAnb2Zmc2V0Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ5dGVPZmZzZXRcbiAgfVxufSlcblxuZnVuY3Rpb24gY3JlYXRlQnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKGxlbmd0aCA+IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgbGVuZ3RoICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGxlbmd0aClcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG4vKipcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgaGF2ZSB0aGVpclxuICogcHJvdG90eXBlIGNoYW5nZWQgdG8gYEJ1ZmZlci5wcm90b3R5cGVgLiBGdXJ0aGVybW9yZSwgYEJ1ZmZlcmAgaXMgYSBzdWJjbGFzcyBvZlxuICogYFVpbnQ4QXJyYXlgLCBzbyB0aGUgcmV0dXJuZWQgaW5zdGFuY2VzIHdpbGwgaGF2ZSBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgbWV0aG9kc1xuICogYW5kIHRoZSBgVWludDhBcnJheWAgbWV0aG9kcy4gU3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXRcbiAqIHJldHVybnMgYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogVGhlIGBVaW50OEFycmF5YCBwcm90b3R5cGUgcmVtYWlucyB1bm1vZGlmaWVkLlxuICovXG5cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIGlmICh0eXBlb2YgZW5jb2RpbmdPck9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGFsbG9jVW5zYWZlKGFyZylcbiAgfVxuICByZXR1cm4gZnJvbShhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gRml4IHN1YmFycmF5KCkgaW4gRVMyMDE2LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvOTdcbmlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wuc3BlY2llcyAhPSBudWxsICYmXG4gICAgQnVmZmVyW1N5bWJvbC5zcGVjaWVzXSA9PT0gQnVmZmVyKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIsIFN5bWJvbC5zcGVjaWVzLCB7XG4gICAgdmFsdWU6IG51bGwsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KVxufVxuXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxuZnVuY3Rpb24gZnJvbSAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0KVxuICB9XG5cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZSh2YWx1ZSlcbiAgfVxuXG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICAgIClcbiAgfVxuXG4gIGlmIChpc0luc3RhbmNlKHZhbHVlLCBBcnJheUJ1ZmZlcikgfHxcbiAgICAgICh2YWx1ZSAmJiBpc0luc3RhbmNlKHZhbHVlLmJ1ZmZlciwgQXJyYXlCdWZmZXIpKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIG9mIHR5cGUgbnVtYmVyLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICApXG4gIH1cblxuICB2YXIgdmFsdWVPZiA9IHZhbHVlLnZhbHVlT2YgJiYgdmFsdWUudmFsdWVPZigpXG4gIGlmICh2YWx1ZU9mICE9IG51bGwgJiYgdmFsdWVPZiAhPT0gdmFsdWUpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20odmFsdWVPZiwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgdmFyIGIgPSBmcm9tT2JqZWN0KHZhbHVlKVxuICBpZiAoYikgcmV0dXJuIGJcblxuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvUHJpbWl0aXZlICE9IG51bGwgJiZcbiAgICAgIHR5cGVvZiB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFxuICAgICAgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSgnc3RyaW5nJyksIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aFxuICAgIClcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgKVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIEJ1ZmZlcihhcmcsIGVuY29kaW5nKSBidXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gKiBpZiB2YWx1ZSBpcyBhIG51bWJlci5cbiAqIEJ1ZmZlci5mcm9tKHN0clssIGVuY29kaW5nXSlcbiAqIEJ1ZmZlci5mcm9tKGFycmF5KVxuICogQnVmZmVyLmZyb20oYnVmZmVyKVxuICogQnVmZmVyLmZyb20oYXJyYXlCdWZmZXJbLCBieXRlT2Zmc2V0WywgbGVuZ3RoXV0pXG4gKiovXG5CdWZmZXIuZnJvbSA9IGZ1bmN0aW9uICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBmcm9tKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIE5vdGU6IENoYW5nZSBwcm90b3R5cGUgKmFmdGVyKiBCdWZmZXIuZnJvbSBpcyBkZWZpbmVkIHRvIHdvcmthcm91bmQgQ2hyb21lIGJ1Zzpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvMTQ4XG5CdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG5CdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxuXG5mdW5jdGlvbiBhc3NlcnRTaXplIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyJylcbiAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgc2l6ZSArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIGlmIChzaXplIDw9IDApIHtcbiAgICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG4gIH1cbiAgaWYgKGZpbGwgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9ubHkgcGF5IGF0dGVudGlvbiB0byBlbmNvZGluZyBpZiBpdCdzIGEgc3RyaW5nLiBUaGlzXG4gICAgLy8gcHJldmVudHMgYWNjaWRlbnRhbGx5IHNlbmRpbmcgaW4gYSBudW1iZXIgdGhhdCB3b3VsZFxuICAgIC8vIGJlIGludGVycHJldHRlZCBhcyBhIHN0YXJ0IG9mZnNldC5cbiAgICByZXR1cm4gdHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJ1xuICAgICAgPyBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsLCBlbmNvZGluZylcbiAgICAgIDogY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbClcbiAgfVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmaWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogYWxsb2Moc2l6ZVssIGZpbGxbLCBlbmNvZGluZ11dKVxuICoqL1xuQnVmZmVyLmFsbG9jID0gZnVuY3Rpb24gKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIHJldHVybiBhbGxvYyhzaXplLCBmaWxsLCBlbmNvZGluZylcbn1cblxuZnVuY3Rpb24gYWxsb2NVbnNhZmUgKHNpemUpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUgPCAwID8gMCA6IGNoZWNrZWQoc2l6ZSkgfCAwKVxufVxuXG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gQnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gU2xvd0J1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICovXG5CdWZmZXIuYWxsb2NVbnNhZmVTbG93ID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgfVxuXG4gIGlmICghQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICB9XG5cbiAgdmFyIGxlbmd0aCA9IGJ5dGVMZW5ndGgoc3RyaW5nLCBlbmNvZGluZykgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuXG4gIHZhciBhY3R1YWwgPSBidWYud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcblxuICBpZiAoYWN0dWFsICE9PSBsZW5ndGgpIHtcbiAgICAvLyBXcml0aW5nIGEgaGV4IHN0cmluZywgZm9yIGV4YW1wbGUsIHRoYXQgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzIHdpbGxcbiAgICAvLyBjYXVzZSBldmVyeXRoaW5nIGFmdGVyIHRoZSBmaXJzdCBpbnZhbGlkIGNoYXJhY3RlciB0byBiZSBpZ25vcmVkLiAoZS5nLlxuICAgIC8vICdhYnh4Y2QnIHdpbGwgYmUgdHJlYXRlZCBhcyAnYWInKVxuICAgIGJ1ZiA9IGJ1Zi5zbGljZSgwLCBhY3R1YWwpXG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGggPCAwID8gMCA6IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBidWZbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyIChhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmIChieXRlT2Zmc2V0IDwgMCB8fCBhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcIm9mZnNldFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQgKyAobGVuZ3RoIHx8IDApKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wibGVuZ3RoXCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIHZhciBidWZcbiAgaWYgKGJ5dGVPZmZzZXQgPT09IHVuZGVmaW5lZCAmJiBsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5KVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAob2JqKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqKSkge1xuICAgIHZhciBsZW4gPSBjaGVja2VkKG9iai5sZW5ndGgpIHwgMFxuICAgIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuKVxuXG4gICAgaWYgKGJ1Zi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBidWZcbiAgICB9XG5cbiAgICBvYmouY29weShidWYsIDAsIDAsIGxlbilcbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICBpZiAob2JqLmxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBvYmoubGVuZ3RoICE9PSAnbnVtYmVyJyB8fCBudW1iZXJJc05hTihvYmoubGVuZ3RoKSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcigwKVxuICAgIH1cbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmopXG4gIH1cblxuICBpZiAob2JqLnR5cGUgPT09ICdCdWZmZXInICYmIEFycmF5LmlzQXJyYXkob2JqLmRhdGEpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqLmRhdGEpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IEtfTUFYX0xFTkdUSGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsgS19NQVhfTEVOR1RILnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAoK2xlbmd0aCAhPSBsZW5ndGgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICBsZW5ndGggPSAwXG4gIH1cbiAgcmV0dXJuIEJ1ZmZlci5hbGxvYygrbGVuZ3RoKVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyID09PSB0cnVlICYmXG4gICAgYiAhPT0gQnVmZmVyLnByb3RvdHlwZSAvLyBzbyBCdWZmZXIuaXNCdWZmZXIoQnVmZmVyLnByb3RvdHlwZSkgd2lsbCBiZSBmYWxzZVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKGlzSW5zdGFuY2UoYSwgVWludDhBcnJheSkpIGEgPSBCdWZmZXIuZnJvbShhLCBhLm9mZnNldCwgYS5ieXRlTGVuZ3RoKVxuICBpZiAoaXNJbnN0YW5jZShiLCBVaW50OEFycmF5KSkgYiA9IEJ1ZmZlci5mcm9tKGIsIGIub2Zmc2V0LCBiLmJ5dGVMZW5ndGgpXG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcImJ1ZjFcIiwgXCJidWYyXCIgYXJndW1lbnRzIG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXknXG4gICAgKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV1cbiAgICAgIHkgPSBiW2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdsYXRpbjEnOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShsaXN0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gIH1cblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gQnVmZmVyLmFsbG9jKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgIHZhciBidWYgPSBsaXN0W2ldXG4gICAgaWYgKGlzSW5zdGFuY2UoYnVmLCBVaW50OEFycmF5KSkge1xuICAgICAgYnVmID0gQnVmZmVyLmZyb20oYnVmKVxuICAgIH1cbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICAgIH1cbiAgICBidWYuY29weShidWZmZXIsIHBvcylcbiAgICBwb3MgKz0gYnVmLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZmZXJcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN0cmluZykpIHtcbiAgICByZXR1cm4gc3RyaW5nLmxlbmd0aFxuICB9XG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoc3RyaW5nKSB8fCBpc0luc3RhbmNlKHN0cmluZywgQXJyYXlCdWZmZXIpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5ieXRlTGVuZ3RoXG4gIH1cbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBvciBBcnJheUJ1ZmZlci4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIHN0cmluZ1xuICAgIClcbiAgfVxuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBtdXN0TWF0Y2ggPSAoYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdID09PSB0cnVlKVxuICBpZiAoIW11c3RNYXRjaCAmJiBsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHtcbiAgICAgICAgICByZXR1cm4gbXVzdE1hdGNoID8gLTEgOiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICB9XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIC8vIE5vIG5lZWQgdG8gdmVyaWZ5IHRoYXQgXCJ0aGlzLmxlbmd0aCA8PSBNQVhfVUlOVDMyXCIgc2luY2UgaXQncyBhIHJlYWQtb25seVxuICAvLyBwcm9wZXJ0eSBvZiBhIHR5cGVkIGFycmF5LlxuXG4gIC8vIFRoaXMgYmVoYXZlcyBuZWl0aGVyIGxpa2UgU3RyaW5nIG5vciBVaW50OEFycmF5IGluIHRoYXQgd2Ugc2V0IHN0YXJ0L2VuZFxuICAvLyB0byB0aGVpciB1cHBlci9sb3dlciBib3VuZHMgaWYgdGhlIHZhbHVlIHBhc3NlZCBpcyBvdXQgb2YgcmFuZ2UuXG4gIC8vIHVuZGVmaW5lZCBpcyBoYW5kbGVkIHNwZWNpYWxseSBhcyBwZXIgRUNNQS0yNjIgNnRoIEVkaXRpb24sXG4gIC8vIFNlY3Rpb24gMTMuMy4zLjcgUnVudGltZSBTZW1hbnRpY3M6IEtleWVkQmluZGluZ0luaXRpYWxpemF0aW9uLlxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCB8fCBzdGFydCA8IDApIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICAvLyBSZXR1cm4gZWFybHkgaWYgc3RhcnQgPiB0aGlzLmxlbmd0aC4gRG9uZSBoZXJlIHRvIHByZXZlbnQgcG90ZW50aWFsIHVpbnQzMlxuICAvLyBjb2VyY2lvbiBmYWlsIGJlbG93LlxuICBpZiAoc3RhcnQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbmQgPD0gMCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgLy8gRm9yY2UgY29lcnNpb24gdG8gdWludDMyLiBUaGlzIHdpbGwgYWxzbyBjb2VyY2UgZmFsc2V5L05hTiB2YWx1ZXMgdG8gMC5cbiAgZW5kID4+Pj0gMFxuICBzdGFydCA+Pj49IDBcblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuLy8gVGhpcyBwcm9wZXJ0eSBpcyB1c2VkIGJ5IGBCdWZmZXIuaXNCdWZmZXJgIChhbmQgdGhlIGBpcy1idWZmZXJgIG5wbSBwYWNrYWdlKVxuLy8gdG8gZGV0ZWN0IGEgQnVmZmVyIGluc3RhbmNlLiBJdCdzIG5vdCBwb3NzaWJsZSB0byB1c2UgYGluc3RhbmNlb2YgQnVmZmVyYFxuLy8gcmVsaWFibHkgaW4gYSBicm93c2VyaWZ5IGNvbnRleHQgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBkaWZmZXJlbnRcbi8vIGNvcGllcyBvZiB0aGUgJ2J1ZmZlcicgcGFja2FnZSBpbiB1c2UuIFRoaXMgbWV0aG9kIHdvcmtzIGV2ZW4gZm9yIEJ1ZmZlclxuLy8gaW5zdGFuY2VzIHRoYXQgd2VyZSBjcmVhdGVkIGZyb20gYW5vdGhlciBjb3B5IG9mIHRoZSBgYnVmZmVyYCBwYWNrYWdlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTU0XG5CdWZmZXIucHJvdG90eXBlLl9pc0J1ZmZlciA9IHRydWVcblxuZnVuY3Rpb24gc3dhcCAoYiwgbiwgbSkge1xuICB2YXIgaSA9IGJbbl1cbiAgYltuXSA9IGJbbV1cbiAgYlttXSA9IGlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMTYgPSBmdW5jdGlvbiBzd2FwMTYgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDIgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDE2LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAxKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDMyID0gZnVuY3Rpb24gc3dhcDMyICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA0ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAzMi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgMilcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXA2NCA9IGZ1bmN0aW9uIHN3YXA2NCAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgOCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNjQtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gOCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDcpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDYpXG4gICAgc3dhcCh0aGlzLCBpICsgMiwgaSArIDUpXG4gICAgc3dhcCh0aGlzLCBpICsgMywgaSArIDQpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nID0gQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZ1xuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLnJlcGxhY2UoLyguezJ9KS9nLCAnJDEgJykudHJpbSgpXG4gIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAodGFyZ2V0LCBzdGFydCwgZW5kLCB0aGlzU3RhcnQsIHRoaXNFbmQpIHtcbiAgaWYgKGlzSW5zdGFuY2UodGFyZ2V0LCBVaW50OEFycmF5KSkge1xuICAgIHRhcmdldCA9IEJ1ZmZlci5mcm9tKHRhcmdldCwgdGFyZ2V0Lm9mZnNldCwgdGFyZ2V0LmJ5dGVMZW5ndGgpXG4gIH1cbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidGFyZ2V0XCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBCdWZmZXIgb3IgVWludDhBcnJheS4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB0YXJnZXQpXG4gICAgKVxuICB9XG5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICBpZiAoZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmQgPSB0YXJnZXQgPyB0YXJnZXQubGVuZ3RoIDogMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNTdGFydCA9IDBcbiAgfVxuICBpZiAodGhpc0VuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc0VuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoc3RhcnQgPCAwIHx8IGVuZCA+IHRhcmdldC5sZW5ndGggfHwgdGhpc1N0YXJ0IDwgMCB8fCB0aGlzRW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCAmJiBzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmIChzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgc3RhcnQgPj4+PSAwXG4gIGVuZCA+Pj49IDBcbiAgdGhpc1N0YXJ0ID4+Pj0gMFxuICB0aGlzRW5kID4+Pj0gMFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQpIHJldHVybiAwXG5cbiAgdmFyIHggPSB0aGlzRW5kIC0gdGhpc1N0YXJ0XG4gIHZhciB5ID0gZW5kIC0gc3RhcnRcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG5cbiAgdmFyIHRoaXNDb3B5ID0gdGhpcy5zbGljZSh0aGlzU3RhcnQsIHRoaXNFbmQpXG4gIHZhciB0YXJnZXRDb3B5ID0gdGFyZ2V0LnNsaWNlKHN0YXJ0LCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzQ29weVtpXSAhPT0gdGFyZ2V0Q29weVtpXSkge1xuICAgICAgeCA9IHRoaXNDb3B5W2ldXG4gICAgICB5ID0gdGFyZ2V0Q29weVtpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbi8vIEZpbmRzIGVpdGhlciB0aGUgZmlyc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0ID49IGBieXRlT2Zmc2V0YCxcbi8vIE9SIHRoZSBsYXN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA8PSBgYnl0ZU9mZnNldGAuXG4vL1xuLy8gQXJndW1lbnRzOlxuLy8gLSBidWZmZXIgLSBhIEJ1ZmZlciB0byBzZWFyY2hcbi8vIC0gdmFsIC0gYSBzdHJpbmcsIEJ1ZmZlciwgb3IgbnVtYmVyXG4vLyAtIGJ5dGVPZmZzZXQgLSBhbiBpbmRleCBpbnRvIGBidWZmZXJgOyB3aWxsIGJlIGNsYW1wZWQgdG8gYW4gaW50MzJcbi8vIC0gZW5jb2RpbmcgLSBhbiBvcHRpb25hbCBlbmNvZGluZywgcmVsZXZhbnQgaXMgdmFsIGlzIGEgc3RyaW5nXG4vLyAtIGRpciAtIHRydWUgZm9yIGluZGV4T2YsIGZhbHNlIGZvciBsYXN0SW5kZXhPZlxuZnVuY3Rpb24gYmlkaXJlY3Rpb25hbEluZGV4T2YgKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIC8vIEVtcHR5IGJ1ZmZlciBtZWFucyBubyBtYXRjaFxuICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXRcbiAgaWYgKHR5cGVvZiBieXRlT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldFxuICAgIGJ5dGVPZmZzZXQgPSAwXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIHtcbiAgICBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkge1xuICAgIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICB9XG4gIGJ5dGVPZmZzZXQgPSArYnl0ZU9mZnNldCAvLyBDb2VyY2UgdG8gTnVtYmVyLlxuICBpZiAobnVtYmVySXNOYU4oYnl0ZU9mZnNldCkpIHtcbiAgICAvLyBieXRlT2Zmc2V0OiBpdCBpdCdzIHVuZGVmaW5lZCwgbnVsbCwgTmFOLCBcImZvb1wiLCBldGMsIHNlYXJjaCB3aG9sZSBidWZmZXJcbiAgICBieXRlT2Zmc2V0ID0gZGlyID8gMCA6IChidWZmZXIubGVuZ3RoIC0gMSlcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0OiBuZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggKyBieXRlT2Zmc2V0XG4gIGlmIChieXRlT2Zmc2V0ID49IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICBpZiAoZGlyKSByZXR1cm4gLTFcbiAgICBlbHNlIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoIC0gMVxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAwKSB7XG4gICAgaWYgKGRpcikgYnl0ZU9mZnNldCA9IDBcbiAgICBlbHNlIHJldHVybiAtMVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIHZhbFxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWwgPSBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICB9XG5cbiAgLy8gRmluYWxseSwgc2VhcmNoIGVpdGhlciBpbmRleE9mIChpZiBkaXIgaXMgdHJ1ZSkgb3IgbGFzdEluZGV4T2ZcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcvYnVmZmVyIGFsd2F5cyBmYWlsc1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDB4RkYgLy8gU2VhcmNoIGZvciBhIGJ5dGUgdmFsdWUgWzAtMjU1XVxuICAgIGlmICh0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGRpcikge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCBbIHZhbCBdLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgaVxuICBpZiAoZGlyKSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPCBhcnJMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJlYWQoYXJyLCBpKSA9PT0gcmVhZCh2YWwsIGZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4KSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIGZvdW5kSW5kZXggKiBpbmRleFNpemVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ICE9PSAtMSkgaSAtPSBpIC0gZm91bmRJbmRleFxuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJ5dGVPZmZzZXQgKyB2YWxMZW5ndGggPiBhcnJMZW5ndGgpIGJ5dGVPZmZzZXQgPSBhcnJMZW5ndGggLSB2YWxMZW5ndGhcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIGZvdW5kID0gdHJ1ZVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWxMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAocmVhZChhcnIsIGkgKyBqKSAhPT0gcmVhZCh2YWwsIGopKSB7XG4gICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uIGluY2x1ZGVzICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIHRydWUpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiBsYXN0SW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAobnVtYmVySXNOYU4ocGFyc2VkKSkgcmV0dXJuIGlcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGxhdGluMVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggPj4+IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGxhdGluMVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyAoYnl0ZXNbaSArIDFdICogMjU2KSlcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmID0gdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBuZXdCdWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYnVmZmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1widmFsdWVcIiBhcmd1bWVudCBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpIC0gMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgc2hvdWxkIGJlIGEgQnVmZmVyJylcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgdHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmNvcHlXaXRoaW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBVc2UgYnVpbHQtaW4gd2hlbiBhdmFpbGFibGUsIG1pc3NpbmcgZnJvbSBJRTExXG4gICAgdGhpcy5jb3B5V2l0aGluKHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKVxuICB9IGVsc2UgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yICh2YXIgaSA9IGxlbiAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoKGVuY29kaW5nID09PSAndXRmOCcgJiYgY29kZSA8IDEyOCkgfHxcbiAgICAgICAgICBlbmNvZGluZyA9PT0gJ2xhdGluMScpIHtcbiAgICAgICAgLy8gRmFzdCBwYXRoOiBJZiBgdmFsYCBmaXRzIGludG8gYSBzaW5nbGUgYnl0ZSwgdXNlIHRoYXQgbnVtZXJpYyB2YWx1ZS5cbiAgICAgICAgdmFsID0gY29kZVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDI1NVxuICB9XG5cbiAgLy8gSW52YWxpZCByYW5nZXMgYXJlIG5vdCBzZXQgdG8gYSBkZWZhdWx0LCBzbyBjYW4gcmFuZ2UgY2hlY2sgZWFybHkuXG4gIGlmIChzdGFydCA8IDAgfHwgdGhpcy5sZW5ndGggPCBzdGFydCB8fCB0aGlzLmxlbmd0aCA8IGVuZCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdPdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzdGFydCA9IHN0YXJ0ID4+PiAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gdGhpcy5sZW5ndGggOiBlbmQgPj4+IDBcblxuICBpZiAoIXZhbCkgdmFsID0gMFxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICAgIHRoaXNbaV0gPSB2YWxcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gQnVmZmVyLmlzQnVmZmVyKHZhbClcbiAgICAgID8gdmFsXG4gICAgICA6IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyB2YWwgK1xuICAgICAgICAnXCIgaXMgaW52YWxpZCBmb3IgYXJndW1lbnQgXCJ2YWx1ZVwiJylcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGVuZCAtIHN0YXJ0OyArK2kpIHtcbiAgICAgIHRoaXNbaSArIHN0YXJ0XSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSB0YWtlcyBlcXVhbCBzaWducyBhcyBlbmQgb2YgdGhlIEJhc2U2NCBlbmNvZGluZ1xuICBzdHIgPSBzdHIuc3BsaXQoJz0nKVswXVxuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyLnRyaW0oKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbi8vIEFycmF5QnVmZmVyIG9yIFVpbnQ4QXJyYXkgb2JqZWN0cyBmcm9tIG90aGVyIGNvbnRleHRzIChpLmUuIGlmcmFtZXMpIGRvIG5vdCBwYXNzXG4vLyB0aGUgYGluc3RhbmNlb2ZgIGNoZWNrIGJ1dCB0aGV5IHNob3VsZCBiZSB0cmVhdGVkIGFzIG9mIHRoYXQgdHlwZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE2NlxuZnVuY3Rpb24gaXNJbnN0YW5jZSAob2JqLCB0eXBlKSB7XG4gIHJldHVybiBvYmogaW5zdGFuY2VvZiB0eXBlIHx8XG4gICAgKG9iaiAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3RvciAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lICE9IG51bGwgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSB0eXBlLm5hbWUpXG59XG5mdW5jdGlvbiBudW1iZXJJc05hTiAob2JqKSB7XG4gIC8vIEZvciBJRTExIHN1cHBvcnRcbiAgcmV0dXJuIG9iaiAhPT0gb2JqIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG4iLCIvKiBGaWxlU2F2ZXIuanNcbiAqIEEgc2F2ZUFzKCkgRmlsZVNhdmVyIGltcGxlbWVudGF0aW9uLlxuICogMS4zLjJcbiAqIDIwMTYtMDYtMTYgMTg6MjU6MTlcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBMaWNlbnNlOiBNSVRcbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L0ZpbGVTYXZlci5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiAqL1xuLypqc2xpbnQgYml0d2lzZTogdHJ1ZSwgaW5kZW50OiA0LCBsYXhicmVhazogdHJ1ZSwgbGF4Y29tbWE6IHRydWUsIHNtYXJ0dGFiczogdHJ1ZSwgcGx1c3BsdXM6IHRydWUgKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL0ZpbGVTYXZlci5qcy9ibG9iL21hc3Rlci9GaWxlU2F2ZXIuanMgKi9cblxudmFyIHNhdmVBcyA9IHNhdmVBcyB8fCAoZnVuY3Rpb24odmlldykge1xuXHRcInVzZSBzdHJpY3RcIjtcblx0Ly8gSUUgPDEwIGlzIGV4cGxpY2l0bHkgdW5zdXBwb3J0ZWRcblx0aWYgKHR5cGVvZiB2aWV3ID09PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiYgL01TSUUgWzEtOV1cXC4vLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyXG5cdFx0ICBkb2MgPSB2aWV3LmRvY3VtZW50XG5cdFx0ICAvLyBvbmx5IGdldCBVUkwgd2hlbiBuZWNlc3NhcnkgaW4gY2FzZSBCbG9iLmpzIGhhc24ndCBvdmVycmlkZGVuIGl0IHlldFxuXHRcdCwgZ2V0X1VSTCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHZpZXcuVVJMIHx8IHZpZXcud2Via2l0VVJMIHx8IHZpZXc7XG5cdFx0fVxuXHRcdCwgc2F2ZV9saW5rID0gZG9jLmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIiwgXCJhXCIpXG5cdFx0LCBjYW5fdXNlX3NhdmVfbGluayA9IFwiZG93bmxvYWRcIiBpbiBzYXZlX2xpbmtcblx0XHQsIGNsaWNrID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dmFyIGV2ZW50ID0gbmV3IE1vdXNlRXZlbnQoXCJjbGlja1wiKTtcblx0XHRcdG5vZGUuZGlzcGF0Y2hFdmVudChldmVudCk7XG5cdFx0fVxuXHRcdCwgaXNfc2FmYXJpID0gL2NvbnN0cnVjdG9yL2kudGVzdCh2aWV3LkhUTUxFbGVtZW50KSB8fCB2aWV3LnNhZmFyaVxuXHRcdCwgaXNfY2hyb21lX2lvcyA9L0NyaU9TXFwvW1xcZF0rLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpXG5cdFx0LCB0aHJvd19vdXRzaWRlID0gZnVuY3Rpb24oZXgpIHtcblx0XHRcdCh2aWV3LnNldEltbWVkaWF0ZSB8fCB2aWV3LnNldFRpbWVvdXQpKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aHJvdyBleDtcblx0XHRcdH0sIDApO1xuXHRcdH1cblx0XHQsIGZvcmNlX3NhdmVhYmxlX3R5cGUgPSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiXG5cdFx0Ly8gdGhlIEJsb2IgQVBJIGlzIGZ1bmRhbWVudGFsbHkgYnJva2VuIGFzIHRoZXJlIGlzIG5vIFwiZG93bmxvYWRmaW5pc2hlZFwiIGV2ZW50IHRvIHN1YnNjcmliZSB0b1xuXHRcdCwgYXJiaXRyYXJ5X3Jldm9rZV90aW1lb3V0ID0gMTAwMCAqIDQwIC8vIGluIG1zXG5cdFx0LCByZXZva2UgPSBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHR2YXIgcmV2b2tlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAodHlwZW9mIGZpbGUgPT09IFwic3RyaW5nXCIpIHsgLy8gZmlsZSBpcyBhbiBvYmplY3QgVVJMXG5cdFx0XHRcdFx0Z2V0X1VSTCgpLnJldm9rZU9iamVjdFVSTChmaWxlKTtcblx0XHRcdFx0fSBlbHNlIHsgLy8gZmlsZSBpcyBhIEZpbGVcblx0XHRcdFx0XHRmaWxlLnJlbW92ZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0c2V0VGltZW91dChyZXZva2VyLCBhcmJpdHJhcnlfcmV2b2tlX3RpbWVvdXQpO1xuXHRcdH1cblx0XHQsIGRpc3BhdGNoID0gZnVuY3Rpb24oZmlsZXNhdmVyLCBldmVudF90eXBlcywgZXZlbnQpIHtcblx0XHRcdGV2ZW50X3R5cGVzID0gW10uY29uY2F0KGV2ZW50X3R5cGVzKTtcblx0XHRcdHZhciBpID0gZXZlbnRfdHlwZXMubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHR2YXIgbGlzdGVuZXIgPSBmaWxlc2F2ZXJbXCJvblwiICsgZXZlbnRfdHlwZXNbaV1dO1xuXHRcdFx0XHRpZiAodHlwZW9mIGxpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0bGlzdGVuZXIuY2FsbChmaWxlc2F2ZXIsIGV2ZW50IHx8IGZpbGVzYXZlcik7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZXgpIHtcblx0XHRcdFx0XHRcdHRocm93X291dHNpZGUoZXgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHQsIGF1dG9fYm9tID0gZnVuY3Rpb24oYmxvYikge1xuXHRcdFx0Ly8gcHJlcGVuZCBCT00gZm9yIFVURi04IFhNTCBhbmQgdGV4dC8qIHR5cGVzIChpbmNsdWRpbmcgSFRNTClcblx0XHRcdC8vIG5vdGU6IHlvdXIgYnJvd3NlciB3aWxsIGF1dG9tYXRpY2FsbHkgY29udmVydCBVVEYtMTYgVStGRUZGIHRvIEVGIEJCIEJGXG5cdFx0XHRpZiAoL15cXHMqKD86dGV4dFxcL1xcUyp8YXBwbGljYXRpb25cXC94bWx8XFxTKlxcL1xcUypcXCt4bWwpXFxzKjsuKmNoYXJzZXRcXHMqPVxccyp1dGYtOC9pLnRlc3QoYmxvYi50eXBlKSkge1xuXHRcdFx0XHRyZXR1cm4gbmV3IEJsb2IoW1N0cmluZy5mcm9tQ2hhckNvZGUoMHhGRUZGKSwgYmxvYl0sIHt0eXBlOiBibG9iLnR5cGV9KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBibG9iO1xuXHRcdH1cblx0XHQsIEZpbGVTYXZlciA9IGZ1bmN0aW9uKGJsb2IsIG5hbWUsIG5vX2F1dG9fYm9tKSB7XG5cdFx0XHRpZiAoIW5vX2F1dG9fYm9tKSB7XG5cdFx0XHRcdGJsb2IgPSBhdXRvX2JvbShibG9iKTtcblx0XHRcdH1cblx0XHRcdC8vIEZpcnN0IHRyeSBhLmRvd25sb2FkLCB0aGVuIHdlYiBmaWxlc3lzdGVtLCB0aGVuIG9iamVjdCBVUkxzXG5cdFx0XHR2YXJcblx0XHRcdFx0ICBmaWxlc2F2ZXIgPSB0aGlzXG5cdFx0XHRcdCwgdHlwZSA9IGJsb2IudHlwZVxuXHRcdFx0XHQsIGZvcmNlID0gdHlwZSA9PT0gZm9yY2Vfc2F2ZWFibGVfdHlwZVxuXHRcdFx0XHQsIG9iamVjdF91cmxcblx0XHRcdFx0LCBkaXNwYXRjaF9hbGwgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRkaXNwYXRjaChmaWxlc2F2ZXIsIFwid3JpdGVzdGFydCBwcm9ncmVzcyB3cml0ZSB3cml0ZWVuZFwiLnNwbGl0KFwiIFwiKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gb24gYW55IGZpbGVzeXMgZXJyb3JzIHJldmVydCB0byBzYXZpbmcgd2l0aCBvYmplY3QgVVJMc1xuXHRcdFx0XHQsIGZzX2Vycm9yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYgKChpc19jaHJvbWVfaW9zIHx8IChmb3JjZSAmJiBpc19zYWZhcmkpKSAmJiB2aWV3LkZpbGVSZWFkZXIpIHtcblx0XHRcdFx0XHRcdC8vIFNhZmFyaSBkb2Vzbid0IGFsbG93IGRvd25sb2FkaW5nIG9mIGJsb2IgdXJsc1xuXHRcdFx0XHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdFx0XHRcdFx0XHRyZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdHZhciB1cmwgPSBpc19jaHJvbWVfaW9zID8gcmVhZGVyLnJlc3VsdCA6IHJlYWRlci5yZXN1bHQucmVwbGFjZSgvXmRhdGE6W147XSo7LywgJ2RhdGE6YXR0YWNobWVudC9maWxlOycpO1xuXHRcdFx0XHRcdFx0XHR2YXIgcG9wdXAgPSB2aWV3Lm9wZW4odXJsLCAnX2JsYW5rJyk7XG5cdFx0XHRcdFx0XHRcdGlmKCFwb3B1cCkgdmlldy5sb2NhdGlvbi5ocmVmID0gdXJsO1xuXHRcdFx0XHRcdFx0XHR1cmw9dW5kZWZpbmVkOyAvLyByZWxlYXNlIHJlZmVyZW5jZSBiZWZvcmUgZGlzcGF0Y2hpbmdcblx0XHRcdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuRE9ORTtcblx0XHRcdFx0XHRcdFx0ZGlzcGF0Y2hfYWxsKCk7XG5cdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0cmVhZGVyLnJlYWRBc0RhdGFVUkwoYmxvYik7XG5cdFx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5JTklUO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBkb24ndCBjcmVhdGUgbW9yZSBvYmplY3QgVVJMcyB0aGFuIG5lZWRlZFxuXHRcdFx0XHRcdGlmICghb2JqZWN0X3VybCkge1xuXHRcdFx0XHRcdFx0b2JqZWN0X3VybCA9IGdldF9VUkwoKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChmb3JjZSkge1xuXHRcdFx0XHRcdFx0dmlldy5sb2NhdGlvbi5ocmVmID0gb2JqZWN0X3VybDtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dmFyIG9wZW5lZCA9IHZpZXcub3BlbihvYmplY3RfdXJsLCBcIl9ibGFua1wiKTtcblx0XHRcdFx0XHRcdGlmICghb3BlbmVkKSB7XG5cdFx0XHRcdFx0XHRcdC8vIEFwcGxlIGRvZXMgbm90IGFsbG93IHdpbmRvdy5vcGVuLCBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2xpYnJhcnkvc2FmYXJpL2RvY3VtZW50YXRpb24vVG9vbHMvQ29uY2VwdHVhbC9TYWZhcmlFeHRlbnNpb25HdWlkZS9Xb3JraW5nd2l0aFdpbmRvd3NhbmRUYWJzL1dvcmtpbmd3aXRoV2luZG93c2FuZFRhYnMuaHRtbFxuXHRcdFx0XHRcdFx0XHR2aWV3LmxvY2F0aW9uLmhyZWYgPSBvYmplY3RfdXJsO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdGRpc3BhdGNoX2FsbCgpO1xuXHRcdFx0XHRcdHJldm9rZShvYmplY3RfdXJsKTtcblx0XHRcdFx0fVxuXHRcdFx0O1xuXHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuSU5JVDtcblxuXHRcdFx0aWYgKGNhbl91c2Vfc2F2ZV9saW5rKSB7XG5cdFx0XHRcdG9iamVjdF91cmwgPSBnZXRfVVJMKCkuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHNhdmVfbGluay5ocmVmID0gb2JqZWN0X3VybDtcblx0XHRcdFx0XHRzYXZlX2xpbmsuZG93bmxvYWQgPSBuYW1lO1xuXHRcdFx0XHRcdGNsaWNrKHNhdmVfbGluayk7XG5cdFx0XHRcdFx0ZGlzcGF0Y2hfYWxsKCk7XG5cdFx0XHRcdFx0cmV2b2tlKG9iamVjdF91cmwpO1xuXHRcdFx0XHRcdGZpbGVzYXZlci5yZWFkeVN0YXRlID0gZmlsZXNhdmVyLkRPTkU7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGZzX2Vycm9yKCk7XG5cdFx0fVxuXHRcdCwgRlNfcHJvdG8gPSBGaWxlU2F2ZXIucHJvdG90eXBlXG5cdFx0LCBzYXZlQXMgPSBmdW5jdGlvbihibG9iLCBuYW1lLCBub19hdXRvX2JvbSkge1xuXHRcdFx0cmV0dXJuIG5ldyBGaWxlU2F2ZXIoYmxvYiwgbmFtZSB8fCBibG9iLm5hbWUgfHwgXCJkb3dubG9hZFwiLCBub19hdXRvX2JvbSk7XG5cdFx0fVxuXHQ7XG5cdC8vIElFIDEwKyAobmF0aXZlIHNhdmVBcylcblx0aWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiYgbmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oYmxvYiwgbmFtZSwgbm9fYXV0b19ib20pIHtcblx0XHRcdG5hbWUgPSBuYW1lIHx8IGJsb2IubmFtZSB8fCBcImRvd25sb2FkXCI7XG5cblx0XHRcdGlmICghbm9fYXV0b19ib20pIHtcblx0XHRcdFx0YmxvYiA9IGF1dG9fYm9tKGJsb2IpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKGJsb2IsIG5hbWUpO1xuXHRcdH07XG5cdH1cblxuXHRGU19wcm90by5hYm9ydCA9IGZ1bmN0aW9uKCl7fTtcblx0RlNfcHJvdG8ucmVhZHlTdGF0ZSA9IEZTX3Byb3RvLklOSVQgPSAwO1xuXHRGU19wcm90by5XUklUSU5HID0gMTtcblx0RlNfcHJvdG8uRE9ORSA9IDI7XG5cblx0RlNfcHJvdG8uZXJyb3IgPVxuXHRGU19wcm90by5vbndyaXRlc3RhcnQgPVxuXHRGU19wcm90by5vbnByb2dyZXNzID1cblx0RlNfcHJvdG8ub253cml0ZSA9XG5cdEZTX3Byb3RvLm9uYWJvcnQgPVxuXHRGU19wcm90by5vbmVycm9yID1cblx0RlNfcHJvdG8ub253cml0ZWVuZCA9XG5cdFx0bnVsbDtcblxuXHRyZXR1cm4gc2F2ZUFzO1xufShcblx0ICAgdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgJiYgc2VsZlxuXHR8fCB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvd1xuXHR8fCB0aGlzLmNvbnRlbnRcbikpO1xuLy8gYHNlbGZgIGlzIHVuZGVmaW5lZCBpbiBGaXJlZm94IGZvciBBbmRyb2lkIGNvbnRlbnQgc2NyaXB0IGNvbnRleHRcbi8vIHdoaWxlIGB0aGlzYCBpcyBuc0lDb250ZW50RnJhbWVNZXNzYWdlTWFuYWdlclxuLy8gd2l0aCBhbiBhdHRyaWJ1dGUgYGNvbnRlbnRgIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIHdpbmRvd1xuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xuICBtb2R1bGUuZXhwb3J0cy5zYXZlQXMgPSBzYXZlQXM7XG59IGVsc2UgaWYgKCh0eXBlb2YgZGVmaW5lICE9PSBcInVuZGVmaW5lZFwiICYmIGRlZmluZSAhPT0gbnVsbCkgJiYgKGRlZmluZS5hbWQgIT09IG51bGwpKSB7XG4gIGRlZmluZShcIkZpbGVTYXZlci5qc1wiLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2F2ZUFzO1xuICB9KTtcbn1cbiIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gKGUgKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gKG0gKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAoKHZhbHVlICogYykgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsIi8qIVxuXG5KU1ppcCB2My43LjAgLSBBIEphdmFTY3JpcHQgY2xhc3MgZm9yIGdlbmVyYXRpbmcgYW5kIHJlYWRpbmcgemlwIGZpbGVzXG48aHR0cDovL3N0dWFydGsuY29tL2pzemlwPlxuXG4oYykgMjAwOS0yMDE2IFN0dWFydCBLbmlnaHRsZXkgPHN0dWFydCBbYXRdIHN0dWFydGsuY29tPlxuRHVhbCBsaWNlbmNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2Ugb3IgR1BMdjMuIFNlZSBodHRwczovL3Jhdy5naXRodWIuY29tL1N0dWsvanN6aXAvbWFzdGVyL0xJQ0VOU0UubWFya2Rvd24uXG5cbkpTWmlwIHVzZXMgdGhlIGxpYnJhcnkgcGFrbyByZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgOlxuaHR0cHM6Ly9naXRodWIuY29tL25vZGVjYS9wYWtvL2Jsb2IvbWFzdGVyL0xJQ0VOU0VcbiovXG5cbiFmdW5jdGlvbihlKXtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIG1vZHVsZSltb2R1bGUuZXhwb3J0cz1lKCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKFtdLGUpO2Vsc2V7KFwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfX0oZnVuY3Rpb24oKXtyZXR1cm4gZnVuY3Rpb24gcyhvLGEsZil7ZnVuY3Rpb24gdShyLGUpe2lmKCFhW3JdKXtpZighb1tyXSl7dmFyIHQ9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZSYmdClyZXR1cm4gdChyLCEwKTtpZihkKXJldHVybiBkKHIsITApO3ZhciBuPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrcitcIidcIik7dGhyb3cgbi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLG59dmFyIGk9YVtyXT17ZXhwb3J0czp7fX07b1tyXVswXS5jYWxsKGkuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgdD1vW3JdWzFdW2VdO3JldHVybiB1KHR8fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVtyXS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oaCx0LG4peyhmdW5jdGlvbihyKXshZnVuY3Rpb24oZSl7XCJvYmplY3RcIj09dHlwZW9mIG4mJnZvaWQgMCE9PXQ/dC5leHBvcnRzPWUoKTooXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9ZSgpfShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKG8sYSxmKXtmdW5jdGlvbiB1KHQsZSl7aWYoIWFbdF0pe2lmKCFvW3RdKXt2YXIgcj1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoO2lmKCFlJiZyKXJldHVybiByKHQsITApO2lmKGQpcmV0dXJuIGQodCwhMCk7dmFyIG49bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIit0K1wiJ1wiKTt0aHJvdyBuLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsbn12YXIgaT1hW3RdPXtleHBvcnRzOnt9fTtvW3RdWzBdLmNhbGwoaS5leHBvcnRzLGZ1bmN0aW9uKGUpe3JldHVybiB1KG9bdF1bMV1bZV18fGUpfSxpLGkuZXhwb3J0cyxzLG8sYSxmKX1yZXR1cm4gYVt0XS5leHBvcnRzfWZvcih2YXIgZD1cImZ1bmN0aW9uXCI9PXR5cGVvZiBoJiZoLGU9MDtlPGYubGVuZ3RoO2UrKyl1KGZbZV0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3ZhciBjPWUoXCIuL3V0aWxzXCIpLGg9ZShcIi4vc3VwcG9ydFwiKSxwPVwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIjtyLmVuY29kZT1mdW5jdGlvbihlKXtmb3IodmFyIHQscixuLGkscyxvLGEsZj1bXSx1PTAsZD1lLmxlbmd0aCxoPWQsbD1cInN0cmluZ1wiIT09Yy5nZXRUeXBlT2YoZSk7dTxlLmxlbmd0aDspaD1kLXUsbj1sPyh0PWVbdSsrXSxyPXU8ZD9lW3UrK106MCx1PGQ/ZVt1KytdOjApOih0PWUuY2hhckNvZGVBdCh1KyspLHI9dTxkP2UuY2hhckNvZGVBdCh1KyspOjAsdTxkP2UuY2hhckNvZGVBdCh1KyspOjApLGk9dD4+MixzPSgzJnQpPDw0fHI+PjQsbz0xPGg/KDE1JnIpPDwyfG4+PjY6NjQsYT0yPGg/NjMmbjo2NCxmLnB1c2gocC5jaGFyQXQoaSkrcC5jaGFyQXQocykrcC5jaGFyQXQobykrcC5jaGFyQXQoYSkpO3JldHVybiBmLmpvaW4oXCJcIil9LHIuZGVjb2RlPWZ1bmN0aW9uKGUpe3ZhciB0LHIsbixpLHMsbyxhPTAsZj0wO2lmKFwiZGF0YTpcIj09PWUuc3Vic3RyKDAsXCJkYXRhOlwiLmxlbmd0aCkpdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBiYXNlNjQgaW5wdXQsIGl0IGxvb2tzIGxpa2UgYSBkYXRhIHVybC5cIik7dmFyIHUsZD0zKihlPWUucmVwbGFjZSgvW15BLVphLXowLTlcXCtcXC9cXD1dL2csXCJcIikpLmxlbmd0aC80O2lmKGUuY2hhckF0KGUubGVuZ3RoLTEpPT09cC5jaGFyQXQoNjQpJiZkLS0sZS5jaGFyQXQoZS5sZW5ndGgtMik9PT1wLmNoYXJBdCg2NCkmJmQtLSxkJTEhPTApdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBiYXNlNjQgaW5wdXQsIGJhZCBjb250ZW50IGxlbmd0aC5cIik7Zm9yKHU9aC51aW50OGFycmF5P25ldyBVaW50OEFycmF5KDB8ZCk6bmV3IEFycmF5KDB8ZCk7YTxlLmxlbmd0aDspdD1wLmluZGV4T2YoZS5jaGFyQXQoYSsrKSk8PDJ8KGk9cC5pbmRleE9mKGUuY2hhckF0KGErKykpKT4+NCxyPSgxNSZpKTw8NHwocz1wLmluZGV4T2YoZS5jaGFyQXQoYSsrKSkpPj4yLG49KDMmcyk8PDZ8KG89cC5pbmRleE9mKGUuY2hhckF0KGErKykpKSx1W2YrK109dCw2NCE9PXMmJih1W2YrK109ciksNjQhPT1vJiYodVtmKytdPW4pO3JldHVybiB1fX0se1wiLi9zdXBwb3J0XCI6MzAsXCIuL3V0aWxzXCI6MzJ9XSwyOltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG49ZShcIi4vZXh0ZXJuYWxcIiksaT1lKFwiLi9zdHJlYW0vRGF0YVdvcmtlclwiKSxzPWUoXCIuL3N0cmVhbS9DcmMzMlByb2JlXCIpLG89ZShcIi4vc3RyZWFtL0RhdGFMZW5ndGhQcm9iZVwiKTtmdW5jdGlvbiBhKGUsdCxyLG4saSl7dGhpcy5jb21wcmVzc2VkU2l6ZT1lLHRoaXMudW5jb21wcmVzc2VkU2l6ZT10LHRoaXMuY3JjMzI9cix0aGlzLmNvbXByZXNzaW9uPW4sdGhpcy5jb21wcmVzc2VkQ29udGVudD1pfWEucHJvdG90eXBlPXtnZXRDb250ZW50V29ya2VyOmZ1bmN0aW9uKCl7dmFyIGU9bmV3IGkobi5Qcm9taXNlLnJlc29sdmUodGhpcy5jb21wcmVzc2VkQ29udGVudCkpLnBpcGUodGhpcy5jb21wcmVzc2lvbi51bmNvbXByZXNzV29ya2VyKCkpLnBpcGUobmV3IG8oXCJkYXRhX2xlbmd0aFwiKSksdD10aGlzO3JldHVybiBlLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtpZih0aGlzLnN0cmVhbUluZm8uZGF0YV9sZW5ndGghPT10LnVuY29tcHJlc3NlZFNpemUpdGhyb3cgbmV3IEVycm9yKFwiQnVnIDogdW5jb21wcmVzc2VkIGRhdGEgc2l6ZSBtaXNtYXRjaFwiKX0pLGV9LGdldENvbXByZXNzZWRXb3JrZXI6ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IGkobi5Qcm9taXNlLnJlc29sdmUodGhpcy5jb21wcmVzc2VkQ29udGVudCkpLndpdGhTdHJlYW1JbmZvKFwiY29tcHJlc3NlZFNpemVcIix0aGlzLmNvbXByZXNzZWRTaXplKS53aXRoU3RyZWFtSW5mbyhcInVuY29tcHJlc3NlZFNpemVcIix0aGlzLnVuY29tcHJlc3NlZFNpemUpLndpdGhTdHJlYW1JbmZvKFwiY3JjMzJcIix0aGlzLmNyYzMyKS53aXRoU3RyZWFtSW5mbyhcImNvbXByZXNzaW9uXCIsdGhpcy5jb21wcmVzc2lvbil9fSxhLmNyZWF0ZVdvcmtlckZyb209ZnVuY3Rpb24oZSx0LHIpe3JldHVybiBlLnBpcGUobmV3IHMpLnBpcGUobmV3IG8oXCJ1bmNvbXByZXNzZWRTaXplXCIpKS5waXBlKHQuY29tcHJlc3NXb3JrZXIocikpLnBpcGUobmV3IG8oXCJjb21wcmVzc2VkU2l6ZVwiKSkud2l0aFN0cmVhbUluZm8oXCJjb21wcmVzc2lvblwiLHQpfSx0LmV4cG9ydHM9YX0se1wiLi9leHRlcm5hbFwiOjYsXCIuL3N0cmVhbS9DcmMzMlByb2JlXCI6MjUsXCIuL3N0cmVhbS9EYXRhTGVuZ3RoUHJvYmVcIjoyNixcIi4vc3RyZWFtL0RhdGFXb3JrZXJcIjoyN31dLDM6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbj1lKFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKTtyLlNUT1JFPXttYWdpYzpcIlxcMFxcMFwiLGNvbXByZXNzV29ya2VyOmZ1bmN0aW9uKGUpe3JldHVybiBuZXcgbihcIlNUT1JFIGNvbXByZXNzaW9uXCIpfSx1bmNvbXByZXNzV29ya2VyOmZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBuKFwiU1RPUkUgZGVjb21wcmVzc2lvblwiKX19LHIuREVGTEFURT1lKFwiLi9mbGF0ZVwiKX0se1wiLi9mbGF0ZVwiOjcsXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6Mjh9XSw0OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG49ZShcIi4vdXRpbHNcIiksbz1mdW5jdGlvbigpe2Zvcih2YXIgZSx0PVtdLHI9MDtyPDI1NjtyKyspe2U9cjtmb3IodmFyIG49MDtuPDg7bisrKWU9MSZlPzM5ODgyOTIzODReZT4+PjE6ZT4+PjE7dFtyXT1lfXJldHVybiB0fSgpO3QuZXhwb3J0cz1mdW5jdGlvbihlLHQpe3JldHVybiB2b2lkIDAhPT1lJiZlLmxlbmd0aD9cInN0cmluZ1wiIT09bi5nZXRUeXBlT2YoZSk/ZnVuY3Rpb24oZSx0LHIpe3ZhciBuPW8saT0wK3I7ZV49LTE7Zm9yKHZhciBzPTA7czxpO3MrKyllPWU+Pj44Xm5bMjU1JihlXnRbc10pXTtyZXR1cm4tMV5lfSgwfHQsZSxlLmxlbmd0aCk6ZnVuY3Rpb24oZSx0LHIpe3ZhciBuPW8saT0wK3I7ZV49LTE7Zm9yKHZhciBzPTA7czxpO3MrKyllPWU+Pj44Xm5bMjU1JihlXnQuY2hhckNvZGVBdChzKSldO3JldHVybi0xXmV9KDB8dCxlLGUubGVuZ3RoKTowfX0se1wiLi91dGlsc1wiOjMyfV0sNTpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3IuYmFzZTY0PSExLHIuYmluYXJ5PSExLHIuZGlyPSExLHIuY3JlYXRlRm9sZGVycz0hMCxyLmRhdGU9bnVsbCxyLmNvbXByZXNzaW9uPW51bGwsci5jb21wcmVzc2lvbk9wdGlvbnM9bnVsbCxyLmNvbW1lbnQ9bnVsbCxyLnVuaXhQZXJtaXNzaW9ucz1udWxsLHIuZG9zUGVybWlzc2lvbnM9bnVsbH0se31dLDY6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbjtuPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBQcm9taXNlP1Byb21pc2U6ZShcImxpZVwiKSx0LmV4cG9ydHM9e1Byb21pc2U6bn19LHtsaWU6Mzd9XSw3OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG49XCJ1bmRlZmluZWRcIiE9dHlwZW9mIFVpbnQ4QXJyYXkmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50MTZBcnJheSYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIFVpbnQzMkFycmF5LGk9ZShcInBha29cIikscz1lKFwiLi91dGlsc1wiKSxvPWUoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpLGE9bj9cInVpbnQ4YXJyYXlcIjpcImFycmF5XCI7ZnVuY3Rpb24gZihlLHQpe28uY2FsbCh0aGlzLFwiRmxhdGVXb3JrZXIvXCIrZSksdGhpcy5fcGFrbz1udWxsLHRoaXMuX3Bha29BY3Rpb249ZSx0aGlzLl9wYWtvT3B0aW9ucz10LHRoaXMubWV0YT17fX1yLm1hZ2ljPVwiXFxiXFwwXCIscy5pbmhlcml0cyhmLG8pLGYucHJvdG90eXBlLnByb2Nlc3NDaHVuaz1mdW5jdGlvbihlKXt0aGlzLm1ldGE9ZS5tZXRhLG51bGw9PT10aGlzLl9wYWtvJiZ0aGlzLl9jcmVhdGVQYWtvKCksdGhpcy5fcGFrby5wdXNoKHMudHJhbnNmb3JtVG8oYSxlLmRhdGEpLCExKX0sZi5wcm90b3R5cGUuZmx1c2g9ZnVuY3Rpb24oKXtvLnByb3RvdHlwZS5mbHVzaC5jYWxsKHRoaXMpLG51bGw9PT10aGlzLl9wYWtvJiZ0aGlzLl9jcmVhdGVQYWtvKCksdGhpcy5fcGFrby5wdXNoKFtdLCEwKX0sZi5wcm90b3R5cGUuY2xlYW5VcD1mdW5jdGlvbigpe28ucHJvdG90eXBlLmNsZWFuVXAuY2FsbCh0aGlzKSx0aGlzLl9wYWtvPW51bGx9LGYucHJvdG90eXBlLl9jcmVhdGVQYWtvPWZ1bmN0aW9uKCl7dGhpcy5fcGFrbz1uZXcgaVt0aGlzLl9wYWtvQWN0aW9uXSh7cmF3OiEwLGxldmVsOnRoaXMuX3Bha29PcHRpb25zLmxldmVsfHwtMX0pO3ZhciB0PXRoaXM7dGhpcy5fcGFrby5vbkRhdGE9ZnVuY3Rpb24oZSl7dC5wdXNoKHtkYXRhOmUsbWV0YTp0Lm1ldGF9KX19LHIuY29tcHJlc3NXb3JrZXI9ZnVuY3Rpb24oZSl7cmV0dXJuIG5ldyBmKFwiRGVmbGF0ZVwiLGUpfSxyLnVuY29tcHJlc3NXb3JrZXI9ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IGYoXCJJbmZsYXRlXCIse30pfX0se1wiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiOjI4LFwiLi91dGlsc1wiOjMyLHBha286Mzh9XSw4OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gTyhlLHQpe3ZhciByLG49XCJcIjtmb3Iocj0wO3I8dDtyKyspbis9U3RyaW5nLmZyb21DaGFyQ29kZSgyNTUmZSksZT4+Pj04O3JldHVybiBufWZ1bmN0aW9uIGkoZSx0LHIsbixpLHMpe3ZhciBvLGEsZj1lLmZpbGUsdT1lLmNvbXByZXNzaW9uLGQ9cyE9PUQudXRmOGVuY29kZSxoPUkudHJhbnNmb3JtVG8oXCJzdHJpbmdcIixzKGYubmFtZSkpLGw9SS50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLEQudXRmOGVuY29kZShmLm5hbWUpKSxjPWYuY29tbWVudCxwPUkudHJhbnNmb3JtVG8oXCJzdHJpbmdcIixzKGMpKSxtPUkudHJhbnNmb3JtVG8oXCJzdHJpbmdcIixELnV0ZjhlbmNvZGUoYykpLF89bC5sZW5ndGghPT1mLm5hbWUubGVuZ3RoLHc9bS5sZW5ndGghPT1jLmxlbmd0aCx2PVwiXCIsZz1cIlwiLHk9XCJcIixiPWYuZGlyLGs9Zi5kYXRlLHg9e2NyYzMyOjAsY29tcHJlc3NlZFNpemU6MCx1bmNvbXByZXNzZWRTaXplOjB9O3QmJiFyfHwoeC5jcmMzMj1lLmNyYzMyLHguY29tcHJlc3NlZFNpemU9ZS5jb21wcmVzc2VkU2l6ZSx4LnVuY29tcHJlc3NlZFNpemU9ZS51bmNvbXByZXNzZWRTaXplKTt2YXIgUz0wO3QmJihTfD04KSxkfHwhXyYmIXd8fChTfD0yMDQ4KTt2YXIgRSx6PTAsQz0wO2ImJih6fD0xNiksXCJVTklYXCI9PT1pPyhDPTc5OCx6fD0oKEU9Zi51bml4UGVybWlzc2lvbnMpfHwoRT1iPzE2ODkzOjMzMjA0KSwoNjU1MzUmRSk8PDE2KSk6KEM9MjAsenw9NjMmKGYuZG9zUGVybWlzc2lvbnN8fDApKSxvPWsuZ2V0VVRDSG91cnMoKSxvPDw9NixvfD1rLmdldFVUQ01pbnV0ZXMoKSxvPDw9NSxvfD1rLmdldFVUQ1NlY29uZHMoKS8yLGE9ay5nZXRVVENGdWxsWWVhcigpLTE5ODAsYTw8PTQsYXw9ay5nZXRVVENNb250aCgpKzEsYTw8PTUsYXw9ay5nZXRVVENEYXRlKCksXyYmKHYrPVwidXBcIitPKChnPU8oMSwxKStPKEIoaCksNCkrbCkubGVuZ3RoLDIpK2cpLHcmJih2Kz1cInVjXCIrTygoeT1PKDEsMSkrTyhCKHApLDQpK20pLmxlbmd0aCwyKSt5KTt2YXIgQT1cIlwiO3JldHVybiBBKz1cIlxcblxcMFwiLEErPU8oUywyKSxBKz11Lm1hZ2ljLEErPU8obywyKSxBKz1PKGEsMiksQSs9Tyh4LmNyYzMyLDQpLEErPU8oeC5jb21wcmVzc2VkU2l6ZSw0KSxBKz1PKHgudW5jb21wcmVzc2VkU2l6ZSw0KSxBKz1PKGgubGVuZ3RoLDIpLEErPU8odi5sZW5ndGgsMikse2ZpbGVSZWNvcmQ6VC5MT0NBTF9GSUxFX0hFQURFUitBK2grdixkaXJSZWNvcmQ6VC5DRU5UUkFMX0ZJTEVfSEVBREVSK08oQywyKStBK08ocC5sZW5ndGgsMikrXCJcXDBcXDBcXDBcXDBcIitPKHosNCkrTyhuLDQpK2grditwfX12YXIgST1lKFwiLi4vdXRpbHNcIikscz1lKFwiLi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIiksRD1lKFwiLi4vdXRmOFwiKSxCPWUoXCIuLi9jcmMzMlwiKSxUPWUoXCIuLi9zaWduYXR1cmVcIik7ZnVuY3Rpb24gbihlLHQscixuKXtzLmNhbGwodGhpcyxcIlppcEZpbGVXb3JrZXJcIiksdGhpcy5ieXRlc1dyaXR0ZW49MCx0aGlzLnppcENvbW1lbnQ9dCx0aGlzLnppcFBsYXRmb3JtPXIsdGhpcy5lbmNvZGVGaWxlTmFtZT1uLHRoaXMuc3RyZWFtRmlsZXM9ZSx0aGlzLmFjY3VtdWxhdGU9ITEsdGhpcy5jb250ZW50QnVmZmVyPVtdLHRoaXMuZGlyUmVjb3Jkcz1bXSx0aGlzLmN1cnJlbnRTb3VyY2VPZmZzZXQ9MCx0aGlzLmVudHJpZXNDb3VudD0wLHRoaXMuY3VycmVudEZpbGU9bnVsbCx0aGlzLl9zb3VyY2VzPVtdfUkuaW5oZXJpdHMobixzKSxuLnByb3RvdHlwZS5wdXNoPWZ1bmN0aW9uKGUpe3ZhciB0PWUubWV0YS5wZXJjZW50fHwwLHI9dGhpcy5lbnRyaWVzQ291bnQsbj10aGlzLl9zb3VyY2VzLmxlbmd0aDt0aGlzLmFjY3VtdWxhdGU/dGhpcy5jb250ZW50QnVmZmVyLnB1c2goZSk6KHRoaXMuYnl0ZXNXcml0dGVuKz1lLmRhdGEubGVuZ3RoLHMucHJvdG90eXBlLnB1c2guY2FsbCh0aGlzLHtkYXRhOmUuZGF0YSxtZXRhOntjdXJyZW50RmlsZTp0aGlzLmN1cnJlbnRGaWxlLHBlcmNlbnQ6cj8odCsxMDAqKHItbi0xKSkvcjoxMDB9fSkpfSxuLnByb3RvdHlwZS5vcGVuZWRTb3VyY2U9ZnVuY3Rpb24oZSl7dGhpcy5jdXJyZW50U291cmNlT2Zmc2V0PXRoaXMuYnl0ZXNXcml0dGVuLHRoaXMuY3VycmVudEZpbGU9ZS5maWxlLm5hbWU7dmFyIHQ9dGhpcy5zdHJlYW1GaWxlcyYmIWUuZmlsZS5kaXI7aWYodCl7dmFyIHI9aShlLHQsITEsdGhpcy5jdXJyZW50U291cmNlT2Zmc2V0LHRoaXMuemlwUGxhdGZvcm0sdGhpcy5lbmNvZGVGaWxlTmFtZSk7dGhpcy5wdXNoKHtkYXRhOnIuZmlsZVJlY29yZCxtZXRhOntwZXJjZW50OjB9fSl9ZWxzZSB0aGlzLmFjY3VtdWxhdGU9ITB9LG4ucHJvdG90eXBlLmNsb3NlZFNvdXJjZT1mdW5jdGlvbihlKXt0aGlzLmFjY3VtdWxhdGU9ITE7dmFyIHQscj10aGlzLnN0cmVhbUZpbGVzJiYhZS5maWxlLmRpcixuPWkoZSxyLCEwLHRoaXMuY3VycmVudFNvdXJjZU9mZnNldCx0aGlzLnppcFBsYXRmb3JtLHRoaXMuZW5jb2RlRmlsZU5hbWUpO2lmKHRoaXMuZGlyUmVjb3Jkcy5wdXNoKG4uZGlyUmVjb3JkKSxyKXRoaXMucHVzaCh7ZGF0YToodD1lLFQuREFUQV9ERVNDUklQVE9SK08odC5jcmMzMiw0KStPKHQuY29tcHJlc3NlZFNpemUsNCkrTyh0LnVuY29tcHJlc3NlZFNpemUsNCkpLG1ldGE6e3BlcmNlbnQ6MTAwfX0pO2Vsc2UgZm9yKHRoaXMucHVzaCh7ZGF0YTpuLmZpbGVSZWNvcmQsbWV0YTp7cGVyY2VudDowfX0pO3RoaXMuY29udGVudEJ1ZmZlci5sZW5ndGg7KXRoaXMucHVzaCh0aGlzLmNvbnRlbnRCdWZmZXIuc2hpZnQoKSk7dGhpcy5jdXJyZW50RmlsZT1udWxsfSxuLnByb3RvdHlwZS5mbHVzaD1mdW5jdGlvbigpe2Zvcih2YXIgZT10aGlzLmJ5dGVzV3JpdHRlbix0PTA7dDx0aGlzLmRpclJlY29yZHMubGVuZ3RoO3QrKyl0aGlzLnB1c2goe2RhdGE6dGhpcy5kaXJSZWNvcmRzW3RdLG1ldGE6e3BlcmNlbnQ6MTAwfX0pO3ZhciByLG4saSxzLG8sYSxmPXRoaXMuYnl0ZXNXcml0dGVuLWUsdT0ocj10aGlzLmRpclJlY29yZHMubGVuZ3RoLG49ZixpPWUscz10aGlzLnppcENvbW1lbnQsbz10aGlzLmVuY29kZUZpbGVOYW1lLGE9SS50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLG8ocykpLFQuQ0VOVFJBTF9ESVJFQ1RPUllfRU5EK1wiXFwwXFwwXFwwXFwwXCIrTyhyLDIpK08ociwyKStPKG4sNCkrTyhpLDQpK08oYS5sZW5ndGgsMikrYSk7dGhpcy5wdXNoKHtkYXRhOnUsbWV0YTp7cGVyY2VudDoxMDB9fSl9LG4ucHJvdG90eXBlLnByZXBhcmVOZXh0U291cmNlPWZ1bmN0aW9uKCl7dGhpcy5wcmV2aW91cz10aGlzLl9zb3VyY2VzLnNoaWZ0KCksdGhpcy5vcGVuZWRTb3VyY2UodGhpcy5wcmV2aW91cy5zdHJlYW1JbmZvKSx0aGlzLmlzUGF1c2VkP3RoaXMucHJldmlvdXMucGF1c2UoKTp0aGlzLnByZXZpb3VzLnJlc3VtZSgpfSxuLnByb3RvdHlwZS5yZWdpc3RlclByZXZpb3VzPWZ1bmN0aW9uKGUpe3RoaXMuX3NvdXJjZXMucHVzaChlKTt2YXIgdD10aGlzO3JldHVybiBlLm9uKFwiZGF0YVwiLGZ1bmN0aW9uKGUpe3QucHJvY2Vzc0NodW5rKGUpfSksZS5vbihcImVuZFwiLGZ1bmN0aW9uKCl7dC5jbG9zZWRTb3VyY2UodC5wcmV2aW91cy5zdHJlYW1JbmZvKSx0Ll9zb3VyY2VzLmxlbmd0aD90LnByZXBhcmVOZXh0U291cmNlKCk6dC5lbmQoKX0pLGUub24oXCJlcnJvclwiLGZ1bmN0aW9uKGUpe3QuZXJyb3IoZSl9KSx0aGlzfSxuLnByb3RvdHlwZS5yZXN1bWU9ZnVuY3Rpb24oKXtyZXR1cm4hIXMucHJvdG90eXBlLnJlc3VtZS5jYWxsKHRoaXMpJiYoIXRoaXMucHJldmlvdXMmJnRoaXMuX3NvdXJjZXMubGVuZ3RoPyh0aGlzLnByZXBhcmVOZXh0U291cmNlKCksITApOnRoaXMucHJldmlvdXN8fHRoaXMuX3NvdXJjZXMubGVuZ3RofHx0aGlzLmdlbmVyYXRlZEVycm9yP3ZvaWQgMDoodGhpcy5lbmQoKSwhMCkpfSxuLnByb3RvdHlwZS5lcnJvcj1mdW5jdGlvbihlKXt2YXIgdD10aGlzLl9zb3VyY2VzO2lmKCFzLnByb3RvdHlwZS5lcnJvci5jYWxsKHRoaXMsZSkpcmV0dXJuITE7Zm9yKHZhciByPTA7cjx0Lmxlbmd0aDtyKyspdHJ5e3Rbcl0uZXJyb3IoZSl9Y2F0Y2goZSl7fXJldHVybiEwfSxuLnByb3RvdHlwZS5sb2NrPWZ1bmN0aW9uKCl7cy5wcm90b3R5cGUubG9jay5jYWxsKHRoaXMpO2Zvcih2YXIgZT10aGlzLl9zb3VyY2VzLHQ9MDt0PGUubGVuZ3RoO3QrKyllW3RdLmxvY2soKX0sdC5leHBvcnRzPW59LHtcIi4uL2NyYzMyXCI6NCxcIi4uL3NpZ25hdHVyZVwiOjIzLFwiLi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4uL3V0ZjhcIjozMSxcIi4uL3V0aWxzXCI6MzJ9XSw5OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHU9ZShcIi4uL2NvbXByZXNzaW9uc1wiKSxuPWUoXCIuL1ppcEZpbGVXb3JrZXJcIik7ci5nZW5lcmF0ZVdvcmtlcj1mdW5jdGlvbihlLG8sdCl7dmFyIGE9bmV3IG4oby5zdHJlYW1GaWxlcyx0LG8ucGxhdGZvcm0sby5lbmNvZGVGaWxlTmFtZSksZj0wO3RyeXtlLmZvckVhY2goZnVuY3Rpb24oZSx0KXtmKys7dmFyIHI9ZnVuY3Rpb24oZSx0KXt2YXIgcj1lfHx0LG49dVtyXTtpZighbil0aHJvdyBuZXcgRXJyb3IocitcIiBpcyBub3QgYSB2YWxpZCBjb21wcmVzc2lvbiBtZXRob2QgIVwiKTtyZXR1cm4gbn0odC5vcHRpb25zLmNvbXByZXNzaW9uLG8uY29tcHJlc3Npb24pLG49dC5vcHRpb25zLmNvbXByZXNzaW9uT3B0aW9uc3x8by5jb21wcmVzc2lvbk9wdGlvbnN8fHt9LGk9dC5kaXIscz10LmRhdGU7dC5fY29tcHJlc3NXb3JrZXIocixuKS53aXRoU3RyZWFtSW5mbyhcImZpbGVcIix7bmFtZTplLGRpcjppLGRhdGU6cyxjb21tZW50OnQuY29tbWVudHx8XCJcIix1bml4UGVybWlzc2lvbnM6dC51bml4UGVybWlzc2lvbnMsZG9zUGVybWlzc2lvbnM6dC5kb3NQZXJtaXNzaW9uc30pLnBpcGUoYSl9KSxhLmVudHJpZXNDb3VudD1mfWNhdGNoKGUpe2EuZXJyb3IoZSl9cmV0dXJuIGF9fSx7XCIuLi9jb21wcmVzc2lvbnNcIjozLFwiLi9aaXBGaWxlV29ya2VyXCI6OH1dLDEwOltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gbigpe2lmKCEodGhpcyBpbnN0YW5jZW9mIG4pKXJldHVybiBuZXcgbjtpZihhcmd1bWVudHMubGVuZ3RoKXRocm93IG5ldyBFcnJvcihcIlRoZSBjb25zdHJ1Y3RvciB3aXRoIHBhcmFtZXRlcnMgaGFzIGJlZW4gcmVtb3ZlZCBpbiBKU1ppcCAzLjAsIHBsZWFzZSBjaGVjayB0aGUgdXBncmFkZSBndWlkZS5cIik7dGhpcy5maWxlcz17fSx0aGlzLmNvbW1lbnQ9bnVsbCx0aGlzLnJvb3Q9XCJcIix0aGlzLmNsb25lPWZ1bmN0aW9uKCl7dmFyIGU9bmV3IG47Zm9yKHZhciB0IGluIHRoaXMpXCJmdW5jdGlvblwiIT10eXBlb2YgdGhpc1t0XSYmKGVbdF09dGhpc1t0XSk7cmV0dXJuIGV9fShuLnByb3RvdHlwZT1lKFwiLi9vYmplY3RcIikpLmxvYWRBc3luYz1lKFwiLi9sb2FkXCIpLG4uc3VwcG9ydD1lKFwiLi9zdXBwb3J0XCIpLG4uZGVmYXVsdHM9ZShcIi4vZGVmYXVsdHNcIiksbi52ZXJzaW9uPVwiMy41LjBcIixuLmxvYWRBc3luYz1mdW5jdGlvbihlLHQpe3JldHVybihuZXcgbikubG9hZEFzeW5jKGUsdCl9LG4uZXh0ZXJuYWw9ZShcIi4vZXh0ZXJuYWxcIiksdC5leHBvcnRzPW59LHtcIi4vZGVmYXVsdHNcIjo1LFwiLi9leHRlcm5hbFwiOjYsXCIuL2xvYWRcIjoxMSxcIi4vb2JqZWN0XCI6MTUsXCIuL3N1cHBvcnRcIjozMH1dLDExOltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG49ZShcIi4vdXRpbHNcIiksaT1lKFwiLi9leHRlcm5hbFwiKSxhPWUoXCIuL3V0ZjhcIiksZj1lKFwiLi96aXBFbnRyaWVzXCIpLHM9ZShcIi4vc3RyZWFtL0NyYzMyUHJvYmVcIiksdT1lKFwiLi9ub2RlanNVdGlsc1wiKTtmdW5jdGlvbiBkKG4pe3JldHVybiBuZXcgaS5Qcm9taXNlKGZ1bmN0aW9uKGUsdCl7dmFyIHI9bi5kZWNvbXByZXNzZWQuZ2V0Q29udGVudFdvcmtlcigpLnBpcGUobmV3IHMpO3Iub24oXCJlcnJvclwiLGZ1bmN0aW9uKGUpe3QoZSl9KS5vbihcImVuZFwiLGZ1bmN0aW9uKCl7ci5zdHJlYW1JbmZvLmNyYzMyIT09bi5kZWNvbXByZXNzZWQuY3JjMzI/dChuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwIDogQ1JDMzIgbWlzbWF0Y2hcIikpOmUoKX0pLnJlc3VtZSgpfSl9dC5leHBvcnRzPWZ1bmN0aW9uKGUscyl7dmFyIG89dGhpcztyZXR1cm4gcz1uLmV4dGVuZChzfHx7fSx7YmFzZTY0OiExLGNoZWNrQ1JDMzI6ITEsb3B0aW1pemVkQmluYXJ5U3RyaW5nOiExLGNyZWF0ZUZvbGRlcnM6ITEsZGVjb2RlRmlsZU5hbWU6YS51dGY4ZGVjb2RlfSksdS5pc05vZGUmJnUuaXNTdHJlYW0oZSk/aS5Qcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJKU1ppcCBjYW4ndCBhY2NlcHQgYSBzdHJlYW0gd2hlbiBsb2FkaW5nIGEgemlwIGZpbGUuXCIpKTpuLnByZXBhcmVDb250ZW50KFwidGhlIGxvYWRlZCB6aXAgZmlsZVwiLGUsITAscy5vcHRpbWl6ZWRCaW5hcnlTdHJpbmcscy5iYXNlNjQpLnRoZW4oZnVuY3Rpb24oZSl7dmFyIHQ9bmV3IGYocyk7cmV0dXJuIHQubG9hZChlKSx0fSkudGhlbihmdW5jdGlvbihlKXt2YXIgdD1baS5Qcm9taXNlLnJlc29sdmUoZSldLHI9ZS5maWxlcztpZihzLmNoZWNrQ1JDMzIpZm9yKHZhciBuPTA7bjxyLmxlbmd0aDtuKyspdC5wdXNoKGQocltuXSkpO3JldHVybiBpLlByb21pc2UuYWxsKHQpfSkudGhlbihmdW5jdGlvbihlKXtmb3IodmFyIHQ9ZS5zaGlmdCgpLHI9dC5maWxlcyxuPTA7bjxyLmxlbmd0aDtuKyspe3ZhciBpPXJbbl07by5maWxlKGkuZmlsZU5hbWVTdHIsaS5kZWNvbXByZXNzZWQse2JpbmFyeTohMCxvcHRpbWl6ZWRCaW5hcnlTdHJpbmc6ITAsZGF0ZTppLmRhdGUsZGlyOmkuZGlyLGNvbW1lbnQ6aS5maWxlQ29tbWVudFN0ci5sZW5ndGg/aS5maWxlQ29tbWVudFN0cjpudWxsLHVuaXhQZXJtaXNzaW9uczppLnVuaXhQZXJtaXNzaW9ucyxkb3NQZXJtaXNzaW9uczppLmRvc1Blcm1pc3Npb25zLGNyZWF0ZUZvbGRlcnM6cy5jcmVhdGVGb2xkZXJzfSl9cmV0dXJuIHQuemlwQ29tbWVudC5sZW5ndGgmJihvLmNvbW1lbnQ9dC56aXBDb21tZW50KSxvfSl9fSx7XCIuL2V4dGVybmFsXCI6NixcIi4vbm9kZWpzVXRpbHNcIjoxNCxcIi4vc3RyZWFtL0NyYzMyUHJvYmVcIjoyNSxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyLFwiLi96aXBFbnRyaWVzXCI6MzN9XSwxMjpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3ZhciBuPWUoXCIuLi91dGlsc1wiKSxpPWUoXCIuLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKTtmdW5jdGlvbiBzKGUsdCl7aS5jYWxsKHRoaXMsXCJOb2RlanMgc3RyZWFtIGlucHV0IGFkYXB0ZXIgZm9yIFwiK2UpLHRoaXMuX3Vwc3RyZWFtRW5kZWQ9ITEsdGhpcy5fYmluZFN0cmVhbSh0KX1uLmluaGVyaXRzKHMsaSkscy5wcm90b3R5cGUuX2JpbmRTdHJlYW09ZnVuY3Rpb24oZSl7dmFyIHQ9dGhpczsodGhpcy5fc3RyZWFtPWUpLnBhdXNlKCksZS5vbihcImRhdGFcIixmdW5jdGlvbihlKXt0LnB1c2goe2RhdGE6ZSxtZXRhOntwZXJjZW50OjB9fSl9KS5vbihcImVycm9yXCIsZnVuY3Rpb24oZSl7dC5pc1BhdXNlZD90aGlzLmdlbmVyYXRlZEVycm9yPWU6dC5lcnJvcihlKX0pLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXt0LmlzUGF1c2VkP3QuX3Vwc3RyZWFtRW5kZWQ9ITA6dC5lbmQoKX0pfSxzLnByb3RvdHlwZS5wYXVzZT1mdW5jdGlvbigpe3JldHVybiEhaS5wcm90b3R5cGUucGF1c2UuY2FsbCh0aGlzKSYmKHRoaXMuX3N0cmVhbS5wYXVzZSgpLCEwKX0scy5wcm90b3R5cGUucmVzdW1lPWZ1bmN0aW9uKCl7cmV0dXJuISFpLnByb3RvdHlwZS5yZXN1bWUuY2FsbCh0aGlzKSYmKHRoaXMuX3Vwc3RyZWFtRW5kZWQ/dGhpcy5lbmQoKTp0aGlzLl9zdHJlYW0ucmVzdW1lKCksITApfSx0LmV4cG9ydHM9c30se1wiLi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4uL3V0aWxzXCI6MzJ9XSwxMzpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3ZhciBpPWUoXCJyZWFkYWJsZS1zdHJlYW1cIikuUmVhZGFibGU7ZnVuY3Rpb24gbihlLHQscil7aS5jYWxsKHRoaXMsdCksdGhpcy5faGVscGVyPWU7dmFyIG49dGhpcztlLm9uKFwiZGF0YVwiLGZ1bmN0aW9uKGUsdCl7bi5wdXNoKGUpfHxuLl9oZWxwZXIucGF1c2UoKSxyJiZyKHQpfSkub24oXCJlcnJvclwiLGZ1bmN0aW9uKGUpe24uZW1pdChcImVycm9yXCIsZSl9KS5vbihcImVuZFwiLGZ1bmN0aW9uKCl7bi5wdXNoKG51bGwpfSl9ZShcIi4uL3V0aWxzXCIpLmluaGVyaXRzKG4saSksbi5wcm90b3R5cGUuX3JlYWQ9ZnVuY3Rpb24oKXt0aGlzLl9oZWxwZXIucmVzdW1lKCl9LHQuZXhwb3J0cz1ufSx7XCIuLi91dGlsc1wiOjMyLFwicmVhZGFibGUtc3RyZWFtXCI6MTZ9XSwxNDpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3QuZXhwb3J0cz17aXNOb2RlOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBCdWZmZXIsbmV3QnVmZmVyRnJvbTpmdW5jdGlvbihlLHQpe2lmKEJ1ZmZlci5mcm9tJiZCdWZmZXIuZnJvbSE9PVVpbnQ4QXJyYXkuZnJvbSlyZXR1cm4gQnVmZmVyLmZyb20oZSx0KTtpZihcIm51bWJlclwiPT10eXBlb2YgZSl0aHJvdyBuZXcgRXJyb3IoJ1RoZSBcImRhdGFcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBhIG51bWJlcicpO3JldHVybiBuZXcgQnVmZmVyKGUsdCl9LGFsbG9jQnVmZmVyOmZ1bmN0aW9uKGUpe2lmKEJ1ZmZlci5hbGxvYylyZXR1cm4gQnVmZmVyLmFsbG9jKGUpO3ZhciB0PW5ldyBCdWZmZXIoZSk7cmV0dXJuIHQuZmlsbCgwKSx0fSxpc0J1ZmZlcjpmdW5jdGlvbihlKXtyZXR1cm4gQnVmZmVyLmlzQnVmZmVyKGUpfSxpc1N0cmVhbTpmdW5jdGlvbihlKXtyZXR1cm4gZSYmXCJmdW5jdGlvblwiPT10eXBlb2YgZS5vbiYmXCJmdW5jdGlvblwiPT10eXBlb2YgZS5wYXVzZSYmXCJmdW5jdGlvblwiPT10eXBlb2YgZS5yZXN1bWV9fX0se31dLDE1OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcyhlLHQscil7dmFyIG4saT1kLmdldFR5cGVPZih0KSxzPWQuZXh0ZW5kKHJ8fHt9LGwpO3MuZGF0ZT1zLmRhdGV8fG5ldyBEYXRlLG51bGwhPT1zLmNvbXByZXNzaW9uJiYocy5jb21wcmVzc2lvbj1zLmNvbXByZXNzaW9uLnRvVXBwZXJDYXNlKCkpLFwic3RyaW5nXCI9PXR5cGVvZiBzLnVuaXhQZXJtaXNzaW9ucyYmKHMudW5peFBlcm1pc3Npb25zPXBhcnNlSW50KHMudW5peFBlcm1pc3Npb25zLDgpKSxzLnVuaXhQZXJtaXNzaW9ucyYmMTYzODQmcy51bml4UGVybWlzc2lvbnMmJihzLmRpcj0hMCkscy5kb3NQZXJtaXNzaW9ucyYmMTYmcy5kb3NQZXJtaXNzaW9ucyYmKHMuZGlyPSEwKSxzLmRpciYmKGU9dShlKSkscy5jcmVhdGVGb2xkZXJzJiYobj1mdW5jdGlvbihlKXtcIi9cIj09PWUuc2xpY2UoLTEpJiYoZT1lLnN1YnN0cmluZygwLGUubGVuZ3RoLTEpKTt2YXIgdD1lLmxhc3RJbmRleE9mKFwiL1wiKTtyZXR1cm4gMDx0P2Uuc3Vic3RyaW5nKDAsdCk6XCJcIn0oZSkpJiZ3LmNhbGwodGhpcyxuLCEwKTt2YXIgbyxhPVwic3RyaW5nXCI9PT1pJiYhMT09PXMuYmluYXJ5JiYhMT09PXMuYmFzZTY0O3ImJnZvaWQgMCE9PXIuYmluYXJ5fHwocy5iaW5hcnk9IWEpLCh0IGluc3RhbmNlb2YgYyYmMD09PXQudW5jb21wcmVzc2VkU2l6ZXx8cy5kaXJ8fCF0fHwwPT09dC5sZW5ndGgpJiYocy5iYXNlNjQ9ITEscy5iaW5hcnk9ITAsdD1cIlwiLHMuY29tcHJlc3Npb249XCJTVE9SRVwiLGk9XCJzdHJpbmdcIiksbz10IGluc3RhbmNlb2YgY3x8dCBpbnN0YW5jZW9mIGg/dDptLmlzTm9kZSYmbS5pc1N0cmVhbSh0KT9uZXcgXyhlLHQpOmQucHJlcGFyZUNvbnRlbnQoZSx0LHMuYmluYXJ5LHMub3B0aW1pemVkQmluYXJ5U3RyaW5nLHMuYmFzZTY0KTt2YXIgZj1uZXcgcChlLG8scyk7dGhpcy5maWxlc1tlXT1mfWZ1bmN0aW9uIHUoZSl7cmV0dXJuXCIvXCIhPT1lLnNsaWNlKC0xKSYmKGUrPVwiL1wiKSxlfXZhciBpPWUoXCIuL3V0ZjhcIiksZD1lKFwiLi91dGlsc1wiKSxoPWUoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpLG89ZShcIi4vc3RyZWFtL1N0cmVhbUhlbHBlclwiKSxsPWUoXCIuL2RlZmF1bHRzXCIpLGM9ZShcIi4vY29tcHJlc3NlZE9iamVjdFwiKSxwPWUoXCIuL3ppcE9iamVjdFwiKSxhPWUoXCIuL2dlbmVyYXRlXCIpLG09ZShcIi4vbm9kZWpzVXRpbHNcIiksXz1lKFwiLi9ub2RlanMvTm9kZWpzU3RyZWFtSW5wdXRBZGFwdGVyXCIpLHc9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gdD12b2lkIDAhPT10P3Q6bC5jcmVhdGVGb2xkZXJzLGU9dShlKSx0aGlzLmZpbGVzW2VdfHxzLmNhbGwodGhpcyxlLG51bGwse2RpcjohMCxjcmVhdGVGb2xkZXJzOnR9KSx0aGlzLmZpbGVzW2VdfTtmdW5jdGlvbiBmKGUpe3JldHVyblwiW29iamVjdCBSZWdFeHBdXCI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZSl9dmFyIG49e2xvYWQ6ZnVuY3Rpb24oKXt0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLlwiKX0sZm9yRWFjaDpmdW5jdGlvbihlKXt2YXIgdCxyLG47Zm9yKHQgaW4gdGhpcy5maWxlcyl0aGlzLmZpbGVzLmhhc093blByb3BlcnR5KHQpJiYobj10aGlzLmZpbGVzW3RdLChyPXQuc2xpY2UodGhpcy5yb290Lmxlbmd0aCx0Lmxlbmd0aCkpJiZ0LnNsaWNlKDAsdGhpcy5yb290Lmxlbmd0aCk9PT10aGlzLnJvb3QmJmUocixuKSl9LGZpbHRlcjpmdW5jdGlvbihyKXt2YXIgbj1bXTtyZXR1cm4gdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKGUsdCl7cihlLHQpJiZuLnB1c2godCl9KSxufSxmaWxlOmZ1bmN0aW9uKGUsdCxyKXtpZigxIT09YXJndW1lbnRzLmxlbmd0aClyZXR1cm4gZT10aGlzLnJvb3QrZSxzLmNhbGwodGhpcyxlLHQsciksdGhpcztpZihmKGUpKXt2YXIgbj1lO3JldHVybiB0aGlzLmZpbHRlcihmdW5jdGlvbihlLHQpe3JldHVybiF0LmRpciYmbi50ZXN0KGUpfSl9dmFyIGk9dGhpcy5maWxlc1t0aGlzLnJvb3QrZV07cmV0dXJuIGkmJiFpLmRpcj9pOm51bGx9LGZvbGRlcjpmdW5jdGlvbihyKXtpZighcilyZXR1cm4gdGhpcztpZihmKHIpKXJldHVybiB0aGlzLmZpbHRlcihmdW5jdGlvbihlLHQpe3JldHVybiB0LmRpciYmci50ZXN0KGUpfSk7dmFyIGU9dGhpcy5yb290K3IsdD13LmNhbGwodGhpcyxlKSxuPXRoaXMuY2xvbmUoKTtyZXR1cm4gbi5yb290PXQubmFtZSxufSxyZW1vdmU6ZnVuY3Rpb24ocil7cj10aGlzLnJvb3Qrcjt2YXIgZT10aGlzLmZpbGVzW3JdO2lmKGV8fChcIi9cIiE9PXIuc2xpY2UoLTEpJiYocis9XCIvXCIpLGU9dGhpcy5maWxlc1tyXSksZSYmIWUuZGlyKWRlbGV0ZSB0aGlzLmZpbGVzW3JdO2Vsc2UgZm9yKHZhciB0PXRoaXMuZmlsdGVyKGZ1bmN0aW9uKGUsdCl7cmV0dXJuIHQubmFtZS5zbGljZSgwLHIubGVuZ3RoKT09PXJ9KSxuPTA7bjx0Lmxlbmd0aDtuKyspZGVsZXRlIHRoaXMuZmlsZXNbdFtuXS5uYW1lXTtyZXR1cm4gdGhpc30sZ2VuZXJhdGU6ZnVuY3Rpb24oZSl7dGhyb3cgbmV3IEVycm9yKFwiVGhpcyBtZXRob2QgaGFzIGJlZW4gcmVtb3ZlZCBpbiBKU1ppcCAzLjAsIHBsZWFzZSBjaGVjayB0aGUgdXBncmFkZSBndWlkZS5cIil9LGdlbmVyYXRlSW50ZXJuYWxTdHJlYW06ZnVuY3Rpb24oZSl7dmFyIHQscj17fTt0cnl7aWYoKHI9ZC5leHRlbmQoZXx8e30se3N0cmVhbUZpbGVzOiExLGNvbXByZXNzaW9uOlwiU1RPUkVcIixjb21wcmVzc2lvbk9wdGlvbnM6bnVsbCx0eXBlOlwiXCIscGxhdGZvcm06XCJET1NcIixjb21tZW50Om51bGwsbWltZVR5cGU6XCJhcHBsaWNhdGlvbi96aXBcIixlbmNvZGVGaWxlTmFtZTppLnV0ZjhlbmNvZGV9KSkudHlwZT1yLnR5cGUudG9Mb3dlckNhc2UoKSxyLmNvbXByZXNzaW9uPXIuY29tcHJlc3Npb24udG9VcHBlckNhc2UoKSxcImJpbmFyeXN0cmluZ1wiPT09ci50eXBlJiYoci50eXBlPVwic3RyaW5nXCIpLCFyLnR5cGUpdGhyb3cgbmV3IEVycm9yKFwiTm8gb3V0cHV0IHR5cGUgc3BlY2lmaWVkLlwiKTtkLmNoZWNrU3VwcG9ydChyLnR5cGUpLFwiZGFyd2luXCIhPT1yLnBsYXRmb3JtJiZcImZyZWVic2RcIiE9PXIucGxhdGZvcm0mJlwibGludXhcIiE9PXIucGxhdGZvcm0mJlwic3Vub3NcIiE9PXIucGxhdGZvcm18fChyLnBsYXRmb3JtPVwiVU5JWFwiKSxcIndpbjMyXCI9PT1yLnBsYXRmb3JtJiYoci5wbGF0Zm9ybT1cIkRPU1wiKTt2YXIgbj1yLmNvbW1lbnR8fHRoaXMuY29tbWVudHx8XCJcIjt0PWEuZ2VuZXJhdGVXb3JrZXIodGhpcyxyLG4pfWNhdGNoKGUpeyh0PW5ldyBoKFwiZXJyb3JcIikpLmVycm9yKGUpfXJldHVybiBuZXcgbyh0LHIudHlwZXx8XCJzdHJpbmdcIixyLm1pbWVUeXBlKX0sZ2VuZXJhdGVBc3luYzpmdW5jdGlvbihlLHQpe3JldHVybiB0aGlzLmdlbmVyYXRlSW50ZXJuYWxTdHJlYW0oZSkuYWNjdW11bGF0ZSh0KX0sZ2VuZXJhdGVOb2RlU3RyZWFtOmZ1bmN0aW9uKGUsdCl7cmV0dXJuKGU9ZXx8e30pLnR5cGV8fChlLnR5cGU9XCJub2RlYnVmZmVyXCIpLHRoaXMuZ2VuZXJhdGVJbnRlcm5hbFN0cmVhbShlKS50b05vZGVqc1N0cmVhbSh0KX19O3QuZXhwb3J0cz1ufSx7XCIuL2NvbXByZXNzZWRPYmplY3RcIjoyLFwiLi9kZWZhdWx0c1wiOjUsXCIuL2dlbmVyYXRlXCI6OSxcIi4vbm9kZWpzL05vZGVqc1N0cmVhbUlucHV0QWRhcHRlclwiOjEyLFwiLi9ub2RlanNVdGlsc1wiOjE0LFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiOjI4LFwiLi9zdHJlYW0vU3RyZWFtSGVscGVyXCI6MjksXCIuL3V0ZjhcIjozMSxcIi4vdXRpbHNcIjozMixcIi4vemlwT2JqZWN0XCI6MzV9XSwxNjpbZnVuY3Rpb24oZSx0LHIpe3QuZXhwb3J0cz1lKFwic3RyZWFtXCIpfSx7c3RyZWFtOnZvaWQgMH1dLDE3OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG49ZShcIi4vRGF0YVJlYWRlclwiKTtmdW5jdGlvbiBpKGUpe24uY2FsbCh0aGlzLGUpO2Zvcih2YXIgdD0wO3Q8dGhpcy5kYXRhLmxlbmd0aDt0KyspZVt0XT0yNTUmZVt0XX1lKFwiLi4vdXRpbHNcIikuaW5oZXJpdHMoaSxuKSxpLnByb3RvdHlwZS5ieXRlQXQ9ZnVuY3Rpb24oZSl7cmV0dXJuIHRoaXMuZGF0YVt0aGlzLnplcm8rZV19LGkucHJvdG90eXBlLmxhc3RJbmRleE9mU2lnbmF0dXJlPWZ1bmN0aW9uKGUpe2Zvcih2YXIgdD1lLmNoYXJDb2RlQXQoMCkscj1lLmNoYXJDb2RlQXQoMSksbj1lLmNoYXJDb2RlQXQoMiksaT1lLmNoYXJDb2RlQXQoMykscz10aGlzLmxlbmd0aC00OzA8PXM7LS1zKWlmKHRoaXMuZGF0YVtzXT09PXQmJnRoaXMuZGF0YVtzKzFdPT09ciYmdGhpcy5kYXRhW3MrMl09PT1uJiZ0aGlzLmRhdGFbcyszXT09PWkpcmV0dXJuIHMtdGhpcy56ZXJvO3JldHVybi0xfSxpLnByb3RvdHlwZS5yZWFkQW5kQ2hlY2tTaWduYXR1cmU9ZnVuY3Rpb24oZSl7dmFyIHQ9ZS5jaGFyQ29kZUF0KDApLHI9ZS5jaGFyQ29kZUF0KDEpLG49ZS5jaGFyQ29kZUF0KDIpLGk9ZS5jaGFyQ29kZUF0KDMpLHM9dGhpcy5yZWFkRGF0YSg0KTtyZXR1cm4gdD09PXNbMF0mJnI9PT1zWzFdJiZuPT09c1syXSYmaT09PXNbM119LGkucHJvdG90eXBlLnJlYWREYXRhPWZ1bmN0aW9uKGUpe2lmKHRoaXMuY2hlY2tPZmZzZXQoZSksMD09PWUpcmV0dXJuW107dmFyIHQ9dGhpcy5kYXRhLnNsaWNlKHRoaXMuemVybyt0aGlzLmluZGV4LHRoaXMuemVybyt0aGlzLmluZGV4K2UpO3JldHVybiB0aGlzLmluZGV4Kz1lLHR9LHQuZXhwb3J0cz1pfSx7XCIuLi91dGlsc1wiOjMyLFwiLi9EYXRhUmVhZGVyXCI6MTh9XSwxODpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3ZhciBuPWUoXCIuLi91dGlsc1wiKTtmdW5jdGlvbiBpKGUpe3RoaXMuZGF0YT1lLHRoaXMubGVuZ3RoPWUubGVuZ3RoLHRoaXMuaW5kZXg9MCx0aGlzLnplcm89MH1pLnByb3RvdHlwZT17Y2hlY2tPZmZzZXQ6ZnVuY3Rpb24oZSl7dGhpcy5jaGVja0luZGV4KHRoaXMuaW5kZXgrZSl9LGNoZWNrSW5kZXg6ZnVuY3Rpb24oZSl7aWYodGhpcy5sZW5ndGg8dGhpcy56ZXJvK2V8fGU8MCl0aHJvdyBuZXcgRXJyb3IoXCJFbmQgb2YgZGF0YSByZWFjaGVkIChkYXRhIGxlbmd0aCA9IFwiK3RoaXMubGVuZ3RoK1wiLCBhc2tlZCBpbmRleCA9IFwiK2UrXCIpLiBDb3JydXB0ZWQgemlwID9cIil9LHNldEluZGV4OmZ1bmN0aW9uKGUpe3RoaXMuY2hlY2tJbmRleChlKSx0aGlzLmluZGV4PWV9LHNraXA6ZnVuY3Rpb24oZSl7dGhpcy5zZXRJbmRleCh0aGlzLmluZGV4K2UpfSxieXRlQXQ6ZnVuY3Rpb24oZSl7fSxyZWFkSW50OmZ1bmN0aW9uKGUpe3ZhciB0LHI9MDtmb3IodGhpcy5jaGVja09mZnNldChlKSx0PXRoaXMuaW5kZXgrZS0xO3Q+PXRoaXMuaW5kZXg7dC0tKXI9KHI8PDgpK3RoaXMuYnl0ZUF0KHQpO3JldHVybiB0aGlzLmluZGV4Kz1lLHJ9LHJlYWRTdHJpbmc6ZnVuY3Rpb24oZSl7cmV0dXJuIG4udHJhbnNmb3JtVG8oXCJzdHJpbmdcIix0aGlzLnJlYWREYXRhKGUpKX0scmVhZERhdGE6ZnVuY3Rpb24oZSl7fSxsYXN0SW5kZXhPZlNpZ25hdHVyZTpmdW5jdGlvbihlKXt9LHJlYWRBbmRDaGVja1NpZ25hdHVyZTpmdW5jdGlvbihlKXt9LHJlYWREYXRlOmZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5yZWFkSW50KDQpO3JldHVybiBuZXcgRGF0ZShEYXRlLlVUQygxOTgwKyhlPj4yNSYxMjcpLChlPj4yMSYxNSktMSxlPj4xNiYzMSxlPj4xMSYzMSxlPj41JjYzLCgzMSZlKTw8MSkpfX0sdC5leHBvcnRzPWl9LHtcIi4uL3V0aWxzXCI6MzJ9XSwxOTpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3ZhciBuPWUoXCIuL1VpbnQ4QXJyYXlSZWFkZXJcIik7ZnVuY3Rpb24gaShlKXtuLmNhbGwodGhpcyxlKX1lKFwiLi4vdXRpbHNcIikuaW5oZXJpdHMoaSxuKSxpLnByb3RvdHlwZS5yZWFkRGF0YT1mdW5jdGlvbihlKXt0aGlzLmNoZWNrT2Zmc2V0KGUpO3ZhciB0PXRoaXMuZGF0YS5zbGljZSh0aGlzLnplcm8rdGhpcy5pbmRleCx0aGlzLnplcm8rdGhpcy5pbmRleCtlKTtyZXR1cm4gdGhpcy5pbmRleCs9ZSx0fSx0LmV4cG9ydHM9aX0se1wiLi4vdXRpbHNcIjozMixcIi4vVWludDhBcnJheVJlYWRlclwiOjIxfV0sMjA6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbj1lKFwiLi9EYXRhUmVhZGVyXCIpO2Z1bmN0aW9uIGkoZSl7bi5jYWxsKHRoaXMsZSl9ZShcIi4uL3V0aWxzXCIpLmluaGVyaXRzKGksbiksaS5wcm90b3R5cGUuYnl0ZUF0PWZ1bmN0aW9uKGUpe3JldHVybiB0aGlzLmRhdGEuY2hhckNvZGVBdCh0aGlzLnplcm8rZSl9LGkucHJvdG90eXBlLmxhc3RJbmRleE9mU2lnbmF0dXJlPWZ1bmN0aW9uKGUpe3JldHVybiB0aGlzLmRhdGEubGFzdEluZGV4T2YoZSktdGhpcy56ZXJvfSxpLnByb3RvdHlwZS5yZWFkQW5kQ2hlY2tTaWduYXR1cmU9ZnVuY3Rpb24oZSl7cmV0dXJuIGU9PT10aGlzLnJlYWREYXRhKDQpfSxpLnByb3RvdHlwZS5yZWFkRGF0YT1mdW5jdGlvbihlKXt0aGlzLmNoZWNrT2Zmc2V0KGUpO3ZhciB0PXRoaXMuZGF0YS5zbGljZSh0aGlzLnplcm8rdGhpcy5pbmRleCx0aGlzLnplcm8rdGhpcy5pbmRleCtlKTtyZXR1cm4gdGhpcy5pbmRleCs9ZSx0fSx0LmV4cG9ydHM9aX0se1wiLi4vdXRpbHNcIjozMixcIi4vRGF0YVJlYWRlclwiOjE4fV0sMjE6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbj1lKFwiLi9BcnJheVJlYWRlclwiKTtmdW5jdGlvbiBpKGUpe24uY2FsbCh0aGlzLGUpfWUoXCIuLi91dGlsc1wiKS5pbmhlcml0cyhpLG4pLGkucHJvdG90eXBlLnJlYWREYXRhPWZ1bmN0aW9uKGUpe2lmKHRoaXMuY2hlY2tPZmZzZXQoZSksMD09PWUpcmV0dXJuIG5ldyBVaW50OEFycmF5KDApO3ZhciB0PXRoaXMuZGF0YS5zdWJhcnJheSh0aGlzLnplcm8rdGhpcy5pbmRleCx0aGlzLnplcm8rdGhpcy5pbmRleCtlKTtyZXR1cm4gdGhpcy5pbmRleCs9ZSx0fSx0LmV4cG9ydHM9aX0se1wiLi4vdXRpbHNcIjozMixcIi4vQXJyYXlSZWFkZXJcIjoxN31dLDIyOltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG49ZShcIi4uL3V0aWxzXCIpLGk9ZShcIi4uL3N1cHBvcnRcIikscz1lKFwiLi9BcnJheVJlYWRlclwiKSxvPWUoXCIuL1N0cmluZ1JlYWRlclwiKSxhPWUoXCIuL05vZGVCdWZmZXJSZWFkZXJcIiksZj1lKFwiLi9VaW50OEFycmF5UmVhZGVyXCIpO3QuZXhwb3J0cz1mdW5jdGlvbihlKXt2YXIgdD1uLmdldFR5cGVPZihlKTtyZXR1cm4gbi5jaGVja1N1cHBvcnQodCksXCJzdHJpbmdcIiE9PXR8fGkudWludDhhcnJheT9cIm5vZGVidWZmZXJcIj09PXQ/bmV3IGEoZSk6aS51aW50OGFycmF5P25ldyBmKG4udHJhbnNmb3JtVG8oXCJ1aW50OGFycmF5XCIsZSkpOm5ldyBzKG4udHJhbnNmb3JtVG8oXCJhcnJheVwiLGUpKTpuZXcgbyhlKX19LHtcIi4uL3N1cHBvcnRcIjozMCxcIi4uL3V0aWxzXCI6MzIsXCIuL0FycmF5UmVhZGVyXCI6MTcsXCIuL05vZGVCdWZmZXJSZWFkZXJcIjoxOSxcIi4vU3RyaW5nUmVhZGVyXCI6MjAsXCIuL1VpbnQ4QXJyYXlSZWFkZXJcIjoyMX1dLDIzOltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7ci5MT0NBTF9GSUxFX0hFQURFUj1cIlBLXHUwMDAzXHUwMDA0XCIsci5DRU5UUkFMX0ZJTEVfSEVBREVSPVwiUEtcdTAwMDFcdTAwMDJcIixyLkNFTlRSQUxfRElSRUNUT1JZX0VORD1cIlBLXHUwMDA1XHUwMDA2XCIsci5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9MT0NBVE9SPVwiUEtcdTAwMDZcdTAwMDdcIixyLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0VORD1cIlBLXHUwMDA2XHUwMDA2XCIsci5EQVRBX0RFU0NSSVBUT1I9XCJQS1x1MDAwN1xcYlwifSx7fV0sMjQ6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbj1lKFwiLi9HZW5lcmljV29ya2VyXCIpLGk9ZShcIi4uL3V0aWxzXCIpO2Z1bmN0aW9uIHMoZSl7bi5jYWxsKHRoaXMsXCJDb252ZXJ0V29ya2VyIHRvIFwiK2UpLHRoaXMuZGVzdFR5cGU9ZX1pLmluaGVyaXRzKHMsbikscy5wcm90b3R5cGUucHJvY2Vzc0NodW5rPWZ1bmN0aW9uKGUpe3RoaXMucHVzaCh7ZGF0YTppLnRyYW5zZm9ybVRvKHRoaXMuZGVzdFR5cGUsZS5kYXRhKSxtZXRhOmUubWV0YX0pfSx0LmV4cG9ydHM9c30se1wiLi4vdXRpbHNcIjozMixcIi4vR2VuZXJpY1dvcmtlclwiOjI4fV0sMjU6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbj1lKFwiLi9HZW5lcmljV29ya2VyXCIpLGk9ZShcIi4uL2NyYzMyXCIpO2Z1bmN0aW9uIHMoKXtuLmNhbGwodGhpcyxcIkNyYzMyUHJvYmVcIiksdGhpcy53aXRoU3RyZWFtSW5mbyhcImNyYzMyXCIsMCl9ZShcIi4uL3V0aWxzXCIpLmluaGVyaXRzKHMsbikscy5wcm90b3R5cGUucHJvY2Vzc0NodW5rPWZ1bmN0aW9uKGUpe3RoaXMuc3RyZWFtSW5mby5jcmMzMj1pKGUuZGF0YSx0aGlzLnN0cmVhbUluZm8uY3JjMzJ8fDApLHRoaXMucHVzaChlKX0sdC5leHBvcnRzPXN9LHtcIi4uL2NyYzMyXCI6NCxcIi4uL3V0aWxzXCI6MzIsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDI2OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG49ZShcIi4uL3V0aWxzXCIpLGk9ZShcIi4vR2VuZXJpY1dvcmtlclwiKTtmdW5jdGlvbiBzKGUpe2kuY2FsbCh0aGlzLFwiRGF0YUxlbmd0aFByb2JlIGZvciBcIitlKSx0aGlzLnByb3BOYW1lPWUsdGhpcy53aXRoU3RyZWFtSW5mbyhlLDApfW4uaW5oZXJpdHMocyxpKSxzLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24oZSl7aWYoZSl7dmFyIHQ9dGhpcy5zdHJlYW1JbmZvW3RoaXMucHJvcE5hbWVdfHwwO3RoaXMuc3RyZWFtSW5mb1t0aGlzLnByb3BOYW1lXT10K2UuZGF0YS5sZW5ndGh9aS5wcm90b3R5cGUucHJvY2Vzc0NodW5rLmNhbGwodGhpcyxlKX0sdC5leHBvcnRzPXN9LHtcIi4uL3V0aWxzXCI6MzIsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDI3OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG49ZShcIi4uL3V0aWxzXCIpLGk9ZShcIi4vR2VuZXJpY1dvcmtlclwiKTtmdW5jdGlvbiBzKGUpe2kuY2FsbCh0aGlzLFwiRGF0YVdvcmtlclwiKTt2YXIgdD10aGlzO3RoaXMuZGF0YUlzUmVhZHk9ITEsdGhpcy5pbmRleD0wLHRoaXMubWF4PTAsdGhpcy5kYXRhPW51bGwsdGhpcy50eXBlPVwiXCIsdGhpcy5fdGlja1NjaGVkdWxlZD0hMSxlLnRoZW4oZnVuY3Rpb24oZSl7dC5kYXRhSXNSZWFkeT0hMCx0LmRhdGE9ZSx0Lm1heD1lJiZlLmxlbmd0aHx8MCx0LnR5cGU9bi5nZXRUeXBlT2YoZSksdC5pc1BhdXNlZHx8dC5fdGlja0FuZFJlcGVhdCgpfSxmdW5jdGlvbihlKXt0LmVycm9yKGUpfSl9bi5pbmhlcml0cyhzLGkpLHMucHJvdG90eXBlLmNsZWFuVXA9ZnVuY3Rpb24oKXtpLnByb3RvdHlwZS5jbGVhblVwLmNhbGwodGhpcyksdGhpcy5kYXRhPW51bGx9LHMucHJvdG90eXBlLnJlc3VtZT1mdW5jdGlvbigpe3JldHVybiEhaS5wcm90b3R5cGUucmVzdW1lLmNhbGwodGhpcykmJighdGhpcy5fdGlja1NjaGVkdWxlZCYmdGhpcy5kYXRhSXNSZWFkeSYmKHRoaXMuX3RpY2tTY2hlZHVsZWQ9ITAsbi5kZWxheSh0aGlzLl90aWNrQW5kUmVwZWF0LFtdLHRoaXMpKSwhMCl9LHMucHJvdG90eXBlLl90aWNrQW5kUmVwZWF0PWZ1bmN0aW9uKCl7dGhpcy5fdGlja1NjaGVkdWxlZD0hMSx0aGlzLmlzUGF1c2VkfHx0aGlzLmlzRmluaXNoZWR8fCh0aGlzLl90aWNrKCksdGhpcy5pc0ZpbmlzaGVkfHwobi5kZWxheSh0aGlzLl90aWNrQW5kUmVwZWF0LFtdLHRoaXMpLHRoaXMuX3RpY2tTY2hlZHVsZWQ9ITApKX0scy5wcm90b3R5cGUuX3RpY2s9ZnVuY3Rpb24oKXtpZih0aGlzLmlzUGF1c2VkfHx0aGlzLmlzRmluaXNoZWQpcmV0dXJuITE7dmFyIGU9bnVsbCx0PU1hdGgubWluKHRoaXMubWF4LHRoaXMuaW5kZXgrMTYzODQpO2lmKHRoaXMuaW5kZXg+PXRoaXMubWF4KXJldHVybiB0aGlzLmVuZCgpO3N3aXRjaCh0aGlzLnR5cGUpe2Nhc2VcInN0cmluZ1wiOmU9dGhpcy5kYXRhLnN1YnN0cmluZyh0aGlzLmluZGV4LHQpO2JyZWFrO2Nhc2VcInVpbnQ4YXJyYXlcIjplPXRoaXMuZGF0YS5zdWJhcnJheSh0aGlzLmluZGV4LHQpO2JyZWFrO2Nhc2VcImFycmF5XCI6Y2FzZVwibm9kZWJ1ZmZlclwiOmU9dGhpcy5kYXRhLnNsaWNlKHRoaXMuaW5kZXgsdCl9cmV0dXJuIHRoaXMuaW5kZXg9dCx0aGlzLnB1c2goe2RhdGE6ZSxtZXRhOntwZXJjZW50OnRoaXMubWF4P3RoaXMuaW5kZXgvdGhpcy5tYXgqMTAwOjB9fSl9LHQuZXhwb3J0cz1zfSx7XCIuLi91dGlsc1wiOjMyLFwiLi9HZW5lcmljV29ya2VyXCI6Mjh9XSwyODpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIG4oZSl7dGhpcy5uYW1lPWV8fFwiZGVmYXVsdFwiLHRoaXMuc3RyZWFtSW5mbz17fSx0aGlzLmdlbmVyYXRlZEVycm9yPW51bGwsdGhpcy5leHRyYVN0cmVhbUluZm89e30sdGhpcy5pc1BhdXNlZD0hMCx0aGlzLmlzRmluaXNoZWQ9ITEsdGhpcy5pc0xvY2tlZD0hMSx0aGlzLl9saXN0ZW5lcnM9e2RhdGE6W10sZW5kOltdLGVycm9yOltdfSx0aGlzLnByZXZpb3VzPW51bGx9bi5wcm90b3R5cGU9e3B1c2g6ZnVuY3Rpb24oZSl7dGhpcy5lbWl0KFwiZGF0YVwiLGUpfSxlbmQ6ZnVuY3Rpb24oKXtpZih0aGlzLmlzRmluaXNoZWQpcmV0dXJuITE7dGhpcy5mbHVzaCgpO3RyeXt0aGlzLmVtaXQoXCJlbmRcIiksdGhpcy5jbGVhblVwKCksdGhpcy5pc0ZpbmlzaGVkPSEwfWNhdGNoKGUpe3RoaXMuZW1pdChcImVycm9yXCIsZSl9cmV0dXJuITB9LGVycm9yOmZ1bmN0aW9uKGUpe3JldHVybiF0aGlzLmlzRmluaXNoZWQmJih0aGlzLmlzUGF1c2VkP3RoaXMuZ2VuZXJhdGVkRXJyb3I9ZToodGhpcy5pc0ZpbmlzaGVkPSEwLHRoaXMuZW1pdChcImVycm9yXCIsZSksdGhpcy5wcmV2aW91cyYmdGhpcy5wcmV2aW91cy5lcnJvcihlKSx0aGlzLmNsZWFuVXAoKSksITApfSxvbjpmdW5jdGlvbihlLHQpe3JldHVybiB0aGlzLl9saXN0ZW5lcnNbZV0ucHVzaCh0KSx0aGlzfSxjbGVhblVwOmZ1bmN0aW9uKCl7dGhpcy5zdHJlYW1JbmZvPXRoaXMuZ2VuZXJhdGVkRXJyb3I9dGhpcy5leHRyYVN0cmVhbUluZm89bnVsbCx0aGlzLl9saXN0ZW5lcnM9W119LGVtaXQ6ZnVuY3Rpb24oZSx0KXtpZih0aGlzLl9saXN0ZW5lcnNbZV0pZm9yKHZhciByPTA7cjx0aGlzLl9saXN0ZW5lcnNbZV0ubGVuZ3RoO3IrKyl0aGlzLl9saXN0ZW5lcnNbZV1bcl0uY2FsbCh0aGlzLHQpfSxwaXBlOmZ1bmN0aW9uKGUpe3JldHVybiBlLnJlZ2lzdGVyUHJldmlvdXModGhpcyl9LHJlZ2lzdGVyUHJldmlvdXM6ZnVuY3Rpb24oZSl7aWYodGhpcy5pc0xvY2tlZCl0aHJvdyBuZXcgRXJyb3IoXCJUaGUgc3RyZWFtICdcIit0aGlzK1wiJyBoYXMgYWxyZWFkeSBiZWVuIHVzZWQuXCIpO3RoaXMuc3RyZWFtSW5mbz1lLnN0cmVhbUluZm8sdGhpcy5tZXJnZVN0cmVhbUluZm8oKSx0aGlzLnByZXZpb3VzPWU7dmFyIHQ9dGhpcztyZXR1cm4gZS5vbihcImRhdGFcIixmdW5jdGlvbihlKXt0LnByb2Nlc3NDaHVuayhlKX0pLGUub24oXCJlbmRcIixmdW5jdGlvbigpe3QuZW5kKCl9KSxlLm9uKFwiZXJyb3JcIixmdW5jdGlvbihlKXt0LmVycm9yKGUpfSksdGhpc30scGF1c2U6ZnVuY3Rpb24oKXtyZXR1cm4hdGhpcy5pc1BhdXNlZCYmIXRoaXMuaXNGaW5pc2hlZCYmKHRoaXMuaXNQYXVzZWQ9ITAsdGhpcy5wcmV2aW91cyYmdGhpcy5wcmV2aW91cy5wYXVzZSgpLCEwKX0scmVzdW1lOmZ1bmN0aW9uKCl7aWYoIXRoaXMuaXNQYXVzZWR8fHRoaXMuaXNGaW5pc2hlZClyZXR1cm4hMTt2YXIgZT10aGlzLmlzUGF1c2VkPSExO3JldHVybiB0aGlzLmdlbmVyYXRlZEVycm9yJiYodGhpcy5lcnJvcih0aGlzLmdlbmVyYXRlZEVycm9yKSxlPSEwKSx0aGlzLnByZXZpb3VzJiZ0aGlzLnByZXZpb3VzLnJlc3VtZSgpLCFlfSxmbHVzaDpmdW5jdGlvbigpe30scHJvY2Vzc0NodW5rOmZ1bmN0aW9uKGUpe3RoaXMucHVzaChlKX0sd2l0aFN0cmVhbUluZm86ZnVuY3Rpb24oZSx0KXtyZXR1cm4gdGhpcy5leHRyYVN0cmVhbUluZm9bZV09dCx0aGlzLm1lcmdlU3RyZWFtSW5mbygpLHRoaXN9LG1lcmdlU3RyZWFtSW5mbzpmdW5jdGlvbigpe2Zvcih2YXIgZSBpbiB0aGlzLmV4dHJhU3RyZWFtSW5mbyl0aGlzLmV4dHJhU3RyZWFtSW5mby5oYXNPd25Qcm9wZXJ0eShlKSYmKHRoaXMuc3RyZWFtSW5mb1tlXT10aGlzLmV4dHJhU3RyZWFtSW5mb1tlXSl9LGxvY2s6ZnVuY3Rpb24oKXtpZih0aGlzLmlzTG9ja2VkKXRocm93IG5ldyBFcnJvcihcIlRoZSBzdHJlYW0gJ1wiK3RoaXMrXCInIGhhcyBhbHJlYWR5IGJlZW4gdXNlZC5cIik7dGhpcy5pc0xvY2tlZD0hMCx0aGlzLnByZXZpb3VzJiZ0aGlzLnByZXZpb3VzLmxvY2soKX0sdG9TdHJpbmc6ZnVuY3Rpb24oKXt2YXIgZT1cIldvcmtlciBcIit0aGlzLm5hbWU7cmV0dXJuIHRoaXMucHJldmlvdXM/dGhpcy5wcmV2aW91cytcIiAtPiBcIitlOmV9fSx0LmV4cG9ydHM9bn0se31dLDI5OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHU9ZShcIi4uL3V0aWxzXCIpLGk9ZShcIi4vQ29udmVydFdvcmtlclwiKSxzPWUoXCIuL0dlbmVyaWNXb3JrZXJcIiksZD1lKFwiLi4vYmFzZTY0XCIpLG49ZShcIi4uL3N1cHBvcnRcIiksbz1lKFwiLi4vZXh0ZXJuYWxcIiksYT1udWxsO2lmKG4ubm9kZXN0cmVhbSl0cnl7YT1lKFwiLi4vbm9kZWpzL05vZGVqc1N0cmVhbU91dHB1dEFkYXB0ZXJcIil9Y2F0Y2goZSl7fWZ1bmN0aW9uIGYoZSx0LHIpe3ZhciBuPXQ7c3dpdGNoKHQpe2Nhc2VcImJsb2JcIjpjYXNlXCJhcnJheWJ1ZmZlclwiOm49XCJ1aW50OGFycmF5XCI7YnJlYWs7Y2FzZVwiYmFzZTY0XCI6bj1cInN0cmluZ1wifXRyeXt0aGlzLl9pbnRlcm5hbFR5cGU9bix0aGlzLl9vdXRwdXRUeXBlPXQsdGhpcy5fbWltZVR5cGU9cix1LmNoZWNrU3VwcG9ydChuKSx0aGlzLl93b3JrZXI9ZS5waXBlKG5ldyBpKG4pKSxlLmxvY2soKX1jYXRjaChlKXt0aGlzLl93b3JrZXI9bmV3IHMoXCJlcnJvclwiKSx0aGlzLl93b3JrZXIuZXJyb3IoZSl9fWYucHJvdG90eXBlPXthY2N1bXVsYXRlOmZ1bmN0aW9uKGUpe3JldHVybiBhPXRoaXMsZj1lLG5ldyBvLlByb21pc2UoZnVuY3Rpb24odCxyKXt2YXIgbj1bXSxpPWEuX2ludGVybmFsVHlwZSxzPWEuX291dHB1dFR5cGUsbz1hLl9taW1lVHlwZTthLm9uKFwiZGF0YVwiLGZ1bmN0aW9uKGUsdCl7bi5wdXNoKGUpLGYmJmYodCl9KS5vbihcImVycm9yXCIsZnVuY3Rpb24oZSl7bj1bXSxyKGUpfSkub24oXCJlbmRcIixmdW5jdGlvbigpe3RyeXt2YXIgZT1mdW5jdGlvbihlLHQscil7c3dpdGNoKGUpe2Nhc2VcImJsb2JcIjpyZXR1cm4gdS5uZXdCbG9iKHUudHJhbnNmb3JtVG8oXCJhcnJheWJ1ZmZlclwiLHQpLHIpO2Nhc2VcImJhc2U2NFwiOnJldHVybiBkLmVuY29kZSh0KTtkZWZhdWx0OnJldHVybiB1LnRyYW5zZm9ybVRvKGUsdCl9fShzLGZ1bmN0aW9uKGUsdCl7dmFyIHIsbj0wLGk9bnVsbCxzPTA7Zm9yKHI9MDtyPHQubGVuZ3RoO3IrKylzKz10W3JdLmxlbmd0aDtzd2l0Y2goZSl7Y2FzZVwic3RyaW5nXCI6cmV0dXJuIHQuam9pbihcIlwiKTtjYXNlXCJhcnJheVwiOnJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLHQpO2Nhc2VcInVpbnQ4YXJyYXlcIjpmb3IoaT1uZXcgVWludDhBcnJheShzKSxyPTA7cjx0Lmxlbmd0aDtyKyspaS5zZXQodFtyXSxuKSxuKz10W3JdLmxlbmd0aDtyZXR1cm4gaTtjYXNlXCJub2RlYnVmZmVyXCI6cmV0dXJuIEJ1ZmZlci5jb25jYXQodCk7ZGVmYXVsdDp0aHJvdyBuZXcgRXJyb3IoXCJjb25jYXQgOiB1bnN1cHBvcnRlZCB0eXBlICdcIitlK1wiJ1wiKX19KGksbiksbyk7dChlKX1jYXRjaChlKXtyKGUpfW49W119KS5yZXN1bWUoKX0pO3ZhciBhLGZ9LG9uOmZ1bmN0aW9uKGUsdCl7dmFyIHI9dGhpcztyZXR1cm5cImRhdGFcIj09PWU/dGhpcy5fd29ya2VyLm9uKGUsZnVuY3Rpb24oZSl7dC5jYWxsKHIsZS5kYXRhLGUubWV0YSl9KTp0aGlzLl93b3JrZXIub24oZSxmdW5jdGlvbigpe3UuZGVsYXkodCxhcmd1bWVudHMscil9KSx0aGlzfSxyZXN1bWU6ZnVuY3Rpb24oKXtyZXR1cm4gdS5kZWxheSh0aGlzLl93b3JrZXIucmVzdW1lLFtdLHRoaXMuX3dvcmtlciksdGhpc30scGF1c2U6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fd29ya2VyLnBhdXNlKCksdGhpc30sdG9Ob2RlanNTdHJlYW06ZnVuY3Rpb24oZSl7aWYodS5jaGVja1N1cHBvcnQoXCJub2Rlc3RyZWFtXCIpLFwibm9kZWJ1ZmZlclwiIT09dGhpcy5fb3V0cHV0VHlwZSl0aHJvdyBuZXcgRXJyb3IodGhpcy5fb3V0cHV0VHlwZStcIiBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoaXMgbWV0aG9kXCIpO3JldHVybiBuZXcgYSh0aGlzLHtvYmplY3RNb2RlOlwibm9kZWJ1ZmZlclwiIT09dGhpcy5fb3V0cHV0VHlwZX0sZSl9fSx0LmV4cG9ydHM9Zn0se1wiLi4vYmFzZTY0XCI6MSxcIi4uL2V4dGVybmFsXCI6NixcIi4uL25vZGVqcy9Ob2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyXCI6MTMsXCIuLi9zdXBwb3J0XCI6MzAsXCIuLi91dGlsc1wiOjMyLFwiLi9Db252ZXJ0V29ya2VyXCI6MjQsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDMwOltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7aWYoci5iYXNlNjQ9ITAsci5hcnJheT0hMCxyLnN0cmluZz0hMCxyLmFycmF5YnVmZmVyPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBBcnJheUJ1ZmZlciYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIFVpbnQ4QXJyYXksci5ub2RlYnVmZmVyPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBCdWZmZXIsci51aW50OGFycmF5PVwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50OEFycmF5LFwidW5kZWZpbmVkXCI9PXR5cGVvZiBBcnJheUJ1ZmZlcilyLmJsb2I9ITE7ZWxzZXt2YXIgbj1uZXcgQXJyYXlCdWZmZXIoMCk7dHJ5e3IuYmxvYj0wPT09bmV3IEJsb2IoW25dLHt0eXBlOlwiYXBwbGljYXRpb24vemlwXCJ9KS5zaXplfWNhdGNoKGUpe3RyeXt2YXIgaT1uZXcoc2VsZi5CbG9iQnVpbGRlcnx8c2VsZi5XZWJLaXRCbG9iQnVpbGRlcnx8c2VsZi5Nb3pCbG9iQnVpbGRlcnx8c2VsZi5NU0Jsb2JCdWlsZGVyKTtpLmFwcGVuZChuKSxyLmJsb2I9MD09PWkuZ2V0QmxvYihcImFwcGxpY2F0aW9uL3ppcFwiKS5zaXplfWNhdGNoKGUpe3IuYmxvYj0hMX19fXRyeXtyLm5vZGVzdHJlYW09ISFlKFwicmVhZGFibGUtc3RyZWFtXCIpLlJlYWRhYmxlfWNhdGNoKGUpe3Iubm9kZXN0cmVhbT0hMX19LHtcInJlYWRhYmxlLXN0cmVhbVwiOjE2fV0sMzE6W2Z1bmN0aW9uKGUsdCxzKXtcInVzZSBzdHJpY3RcIjtmb3IodmFyIGE9ZShcIi4vdXRpbHNcIiksZj1lKFwiLi9zdXBwb3J0XCIpLHI9ZShcIi4vbm9kZWpzVXRpbHNcIiksbj1lKFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKSx1PW5ldyBBcnJheSgyNTYpLGk9MDtpPDI1NjtpKyspdVtpXT0yNTI8PWk/NjoyNDg8PWk/NToyNDA8PWk/NDoyMjQ8PWk/MzoxOTI8PWk/MjoxO2Z1bmN0aW9uIG8oKXtuLmNhbGwodGhpcyxcInV0Zi04IGRlY29kZVwiKSx0aGlzLmxlZnRPdmVyPW51bGx9ZnVuY3Rpb24gZCgpe24uY2FsbCh0aGlzLFwidXRmLTggZW5jb2RlXCIpfXVbMjU0XT11WzI1NF09MSxzLnV0ZjhlbmNvZGU9ZnVuY3Rpb24oZSl7cmV0dXJuIGYubm9kZWJ1ZmZlcj9yLm5ld0J1ZmZlckZyb20oZSxcInV0Zi04XCIpOmZ1bmN0aW9uKGUpe3ZhciB0LHIsbixpLHMsbz1lLmxlbmd0aCxhPTA7Zm9yKGk9MDtpPG87aSsrKTU1Mjk2PT0oNjQ1MTImKHI9ZS5jaGFyQ29kZUF0KGkpKSkmJmkrMTxvJiY1NjMyMD09KDY0NTEyJihuPWUuY2hhckNvZGVBdChpKzEpKSkmJihyPTY1NTM2KyhyLTU1Mjk2PDwxMCkrKG4tNTYzMjApLGkrKyksYSs9cjwxMjg/MTpyPDIwNDg/MjpyPDY1NTM2PzM6NDtmb3IodD1mLnVpbnQ4YXJyYXk/bmV3IFVpbnQ4QXJyYXkoYSk6bmV3IEFycmF5KGEpLGk9cz0wO3M8YTtpKyspNTUyOTY9PSg2NDUxMiYocj1lLmNoYXJDb2RlQXQoaSkpKSYmaSsxPG8mJjU2MzIwPT0oNjQ1MTImKG49ZS5jaGFyQ29kZUF0KGkrMSkpKSYmKHI9NjU1MzYrKHItNTUyOTY8PDEwKSsobi01NjMyMCksaSsrKSxyPDEyOD90W3MrK109cjoocjwyMDQ4P3RbcysrXT0xOTJ8cj4+PjY6KHI8NjU1MzY/dFtzKytdPTIyNHxyPj4+MTI6KHRbcysrXT0yNDB8cj4+PjE4LHRbcysrXT0xMjh8cj4+PjEyJjYzKSx0W3MrK109MTI4fHI+Pj42JjYzKSx0W3MrK109MTI4fDYzJnIpO3JldHVybiB0fShlKX0scy51dGY4ZGVjb2RlPWZ1bmN0aW9uKGUpe3JldHVybiBmLm5vZGVidWZmZXI/YS50cmFuc2Zvcm1UbyhcIm5vZGVidWZmZXJcIixlKS50b1N0cmluZyhcInV0Zi04XCIpOmZ1bmN0aW9uKGUpe3ZhciB0LHIsbixpLHM9ZS5sZW5ndGgsbz1uZXcgQXJyYXkoMipzKTtmb3IodD1yPTA7dDxzOylpZigobj1lW3QrK10pPDEyOClvW3IrK109bjtlbHNlIGlmKDQ8KGk9dVtuXSkpb1tyKytdPTY1NTMzLHQrPWktMTtlbHNle2ZvcihuJj0yPT09aT8zMTozPT09aT8xNTo3OzE8aSYmdDxzOyluPW48PDZ8NjMmZVt0KytdLGktLTsxPGk/b1tyKytdPTY1NTMzOm48NjU1MzY/b1tyKytdPW46KG4tPTY1NTM2LG9bcisrXT01NTI5NnxuPj4xMCYxMDIzLG9bcisrXT01NjMyMHwxMDIzJm4pfXJldHVybiBvLmxlbmd0aCE9PXImJihvLnN1YmFycmF5P289by5zdWJhcnJheSgwLHIpOm8ubGVuZ3RoPXIpLGEuYXBwbHlGcm9tQ2hhckNvZGUobyl9KGU9YS50cmFuc2Zvcm1UbyhmLnVpbnQ4YXJyYXk/XCJ1aW50OGFycmF5XCI6XCJhcnJheVwiLGUpKX0sYS5pbmhlcml0cyhvLG4pLG8ucHJvdG90eXBlLnByb2Nlc3NDaHVuaz1mdW5jdGlvbihlKXt2YXIgdD1hLnRyYW5zZm9ybVRvKGYudWludDhhcnJheT9cInVpbnQ4YXJyYXlcIjpcImFycmF5XCIsZS5kYXRhKTtpZih0aGlzLmxlZnRPdmVyJiZ0aGlzLmxlZnRPdmVyLmxlbmd0aCl7aWYoZi51aW50OGFycmF5KXt2YXIgcj10Oyh0PW5ldyBVaW50OEFycmF5KHIubGVuZ3RoK3RoaXMubGVmdE92ZXIubGVuZ3RoKSkuc2V0KHRoaXMubGVmdE92ZXIsMCksdC5zZXQocix0aGlzLmxlZnRPdmVyLmxlbmd0aCl9ZWxzZSB0PXRoaXMubGVmdE92ZXIuY29uY2F0KHQpO3RoaXMubGVmdE92ZXI9bnVsbH12YXIgbj1mdW5jdGlvbihlLHQpe3ZhciByO2ZvcigodD10fHxlLmxlbmd0aCk+ZS5sZW5ndGgmJih0PWUubGVuZ3RoKSxyPXQtMTswPD1yJiYxMjg9PSgxOTImZVtyXSk7KXItLTtyZXR1cm4gcjwwP3Q6MD09PXI/dDpyK3VbZVtyXV0+dD9yOnR9KHQpLGk9dDtuIT09dC5sZW5ndGgmJihmLnVpbnQ4YXJyYXk/KGk9dC5zdWJhcnJheSgwLG4pLHRoaXMubGVmdE92ZXI9dC5zdWJhcnJheShuLHQubGVuZ3RoKSk6KGk9dC5zbGljZSgwLG4pLHRoaXMubGVmdE92ZXI9dC5zbGljZShuLHQubGVuZ3RoKSkpLHRoaXMucHVzaCh7ZGF0YTpzLnV0ZjhkZWNvZGUoaSksbWV0YTplLm1ldGF9KX0sby5wcm90b3R5cGUuZmx1c2g9ZnVuY3Rpb24oKXt0aGlzLmxlZnRPdmVyJiZ0aGlzLmxlZnRPdmVyLmxlbmd0aCYmKHRoaXMucHVzaCh7ZGF0YTpzLnV0ZjhkZWNvZGUodGhpcy5sZWZ0T3ZlciksbWV0YTp7fX0pLHRoaXMubGVmdE92ZXI9bnVsbCl9LHMuVXRmOERlY29kZVdvcmtlcj1vLGEuaW5oZXJpdHMoZCxuKSxkLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24oZSl7dGhpcy5wdXNoKHtkYXRhOnMudXRmOGVuY29kZShlLmRhdGEpLG1ldGE6ZS5tZXRhfSl9LHMuVXRmOEVuY29kZVdvcmtlcj1kfSx7XCIuL25vZGVqc1V0aWxzXCI6MTQsXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuL3N1cHBvcnRcIjozMCxcIi4vdXRpbHNcIjozMn1dLDMyOltmdW5jdGlvbihlLHQsYSl7XCJ1c2Ugc3RyaWN0XCI7dmFyIGY9ZShcIi4vc3VwcG9ydFwiKSx1PWUoXCIuL2Jhc2U2NFwiKSxyPWUoXCIuL25vZGVqc1V0aWxzXCIpLG49ZShcInNldC1pbW1lZGlhdGUtc2hpbVwiKSxkPWUoXCIuL2V4dGVybmFsXCIpO2Z1bmN0aW9uIGkoZSl7cmV0dXJuIGV9ZnVuY3Rpb24gaChlLHQpe2Zvcih2YXIgcj0wO3I8ZS5sZW5ndGg7KytyKXRbcl09MjU1JmUuY2hhckNvZGVBdChyKTtyZXR1cm4gdH1hLm5ld0Jsb2I9ZnVuY3Rpb24odCxyKXthLmNoZWNrU3VwcG9ydChcImJsb2JcIik7dHJ5e3JldHVybiBuZXcgQmxvYihbdF0se3R5cGU6cn0pfWNhdGNoKGUpe3RyeXt2YXIgbj1uZXcoc2VsZi5CbG9iQnVpbGRlcnx8c2VsZi5XZWJLaXRCbG9iQnVpbGRlcnx8c2VsZi5Nb3pCbG9iQnVpbGRlcnx8c2VsZi5NU0Jsb2JCdWlsZGVyKTtyZXR1cm4gbi5hcHBlbmQodCksbi5nZXRCbG9iKHIpfWNhdGNoKGUpe3Rocm93IG5ldyBFcnJvcihcIkJ1ZyA6IGNhbid0IGNvbnN0cnVjdCB0aGUgQmxvYi5cIil9fX07dmFyIHM9e3N0cmluZ2lmeUJ5Q2h1bms6ZnVuY3Rpb24oZSx0LHIpe3ZhciBuPVtdLGk9MCxzPWUubGVuZ3RoO2lmKHM8PXIpcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxlKTtmb3IoO2k8czspXCJhcnJheVwiPT09dHx8XCJub2RlYnVmZmVyXCI9PT10P24ucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsZS5zbGljZShpLE1hdGgubWluKGkrcixzKSkpKTpuLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLGUuc3ViYXJyYXkoaSxNYXRoLm1pbihpK3IscykpKSksaSs9cjtyZXR1cm4gbi5qb2luKFwiXCIpfSxzdHJpbmdpZnlCeUNoYXI6ZnVuY3Rpb24oZSl7Zm9yKHZhciB0PVwiXCIscj0wO3I8ZS5sZW5ndGg7cisrKXQrPVN0cmluZy5mcm9tQ2hhckNvZGUoZVtyXSk7cmV0dXJuIHR9LGFwcGx5Q2FuQmVVc2VkOnt1aW50OGFycmF5OmZ1bmN0aW9uKCl7dHJ5e3JldHVybiBmLnVpbnQ4YXJyYXkmJjE9PT1TdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsbmV3IFVpbnQ4QXJyYXkoMSkpLmxlbmd0aH1jYXRjaChlKXtyZXR1cm4hMX19KCksbm9kZWJ1ZmZlcjpmdW5jdGlvbigpe3RyeXtyZXR1cm4gZi5ub2RlYnVmZmVyJiYxPT09U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLHIuYWxsb2NCdWZmZXIoMSkpLmxlbmd0aH1jYXRjaChlKXtyZXR1cm4hMX19KCl9fTtmdW5jdGlvbiBvKGUpe3ZhciB0PTY1NTM2LHI9YS5nZXRUeXBlT2YoZSksbj0hMDtpZihcInVpbnQ4YXJyYXlcIj09PXI/bj1zLmFwcGx5Q2FuQmVVc2VkLnVpbnQ4YXJyYXk6XCJub2RlYnVmZmVyXCI9PT1yJiYobj1zLmFwcGx5Q2FuQmVVc2VkLm5vZGVidWZmZXIpLG4pZm9yKDsxPHQ7KXRyeXtyZXR1cm4gcy5zdHJpbmdpZnlCeUNodW5rKGUscix0KX1jYXRjaChlKXt0PU1hdGguZmxvb3IodC8yKX1yZXR1cm4gcy5zdHJpbmdpZnlCeUNoYXIoZSl9ZnVuY3Rpb24gbChlLHQpe2Zvcih2YXIgcj0wO3I8ZS5sZW5ndGg7cisrKXRbcl09ZVtyXTtyZXR1cm4gdH1hLmFwcGx5RnJvbUNoYXJDb2RlPW87dmFyIGM9e307Yy5zdHJpbmc9e3N0cmluZzppLGFycmF5OmZ1bmN0aW9uKGUpe3JldHVybiBoKGUsbmV3IEFycmF5KGUubGVuZ3RoKSl9LGFycmF5YnVmZmVyOmZ1bmN0aW9uKGUpe3JldHVybiBjLnN0cmluZy51aW50OGFycmF5KGUpLmJ1ZmZlcn0sdWludDhhcnJheTpmdW5jdGlvbihlKXtyZXR1cm4gaChlLG5ldyBVaW50OEFycmF5KGUubGVuZ3RoKSl9LG5vZGVidWZmZXI6ZnVuY3Rpb24oZSl7cmV0dXJuIGgoZSxyLmFsbG9jQnVmZmVyKGUubGVuZ3RoKSl9fSxjLmFycmF5PXtzdHJpbmc6byxhcnJheTppLGFycmF5YnVmZmVyOmZ1bmN0aW9uKGUpe3JldHVybiBuZXcgVWludDhBcnJheShlKS5idWZmZXJ9LHVpbnQ4YXJyYXk6ZnVuY3Rpb24oZSl7cmV0dXJuIG5ldyBVaW50OEFycmF5KGUpfSxub2RlYnVmZmVyOmZ1bmN0aW9uKGUpe3JldHVybiByLm5ld0J1ZmZlckZyb20oZSl9fSxjLmFycmF5YnVmZmVyPXtzdHJpbmc6ZnVuY3Rpb24oZSl7cmV0dXJuIG8obmV3IFVpbnQ4QXJyYXkoZSkpfSxhcnJheTpmdW5jdGlvbihlKXtyZXR1cm4gbChuZXcgVWludDhBcnJheShlKSxuZXcgQXJyYXkoZS5ieXRlTGVuZ3RoKSl9LGFycmF5YnVmZmVyOmksdWludDhhcnJheTpmdW5jdGlvbihlKXtyZXR1cm4gbmV3IFVpbnQ4QXJyYXkoZSl9LG5vZGVidWZmZXI6ZnVuY3Rpb24oZSl7cmV0dXJuIHIubmV3QnVmZmVyRnJvbShuZXcgVWludDhBcnJheShlKSl9fSxjLnVpbnQ4YXJyYXk9e3N0cmluZzpvLGFycmF5OmZ1bmN0aW9uKGUpe3JldHVybiBsKGUsbmV3IEFycmF5KGUubGVuZ3RoKSl9LGFycmF5YnVmZmVyOmZ1bmN0aW9uKGUpe3JldHVybiBlLmJ1ZmZlcn0sdWludDhhcnJheTppLG5vZGVidWZmZXI6ZnVuY3Rpb24oZSl7cmV0dXJuIHIubmV3QnVmZmVyRnJvbShlKX19LGMubm9kZWJ1ZmZlcj17c3RyaW5nOm8sYXJyYXk6ZnVuY3Rpb24oZSl7cmV0dXJuIGwoZSxuZXcgQXJyYXkoZS5sZW5ndGgpKX0sYXJyYXlidWZmZXI6ZnVuY3Rpb24oZSl7cmV0dXJuIGMubm9kZWJ1ZmZlci51aW50OGFycmF5KGUpLmJ1ZmZlcn0sdWludDhhcnJheTpmdW5jdGlvbihlKXtyZXR1cm4gbChlLG5ldyBVaW50OEFycmF5KGUubGVuZ3RoKSl9LG5vZGVidWZmZXI6aX0sYS50cmFuc2Zvcm1Ubz1mdW5jdGlvbihlLHQpe2lmKHQ9dHx8XCJcIiwhZSlyZXR1cm4gdDthLmNoZWNrU3VwcG9ydChlKTt2YXIgcj1hLmdldFR5cGVPZih0KTtyZXR1cm4gY1tyXVtlXSh0KX0sYS5nZXRUeXBlT2Y9ZnVuY3Rpb24oZSl7cmV0dXJuXCJzdHJpbmdcIj09dHlwZW9mIGU/XCJzdHJpbmdcIjpcIltvYmplY3QgQXJyYXldXCI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZSk/XCJhcnJheVwiOmYubm9kZWJ1ZmZlciYmci5pc0J1ZmZlcihlKT9cIm5vZGVidWZmZXJcIjpmLnVpbnQ4YXJyYXkmJmUgaW5zdGFuY2VvZiBVaW50OEFycmF5P1widWludDhhcnJheVwiOmYuYXJyYXlidWZmZXImJmUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcj9cImFycmF5YnVmZmVyXCI6dm9pZCAwfSxhLmNoZWNrU3VwcG9ydD1mdW5jdGlvbihlKXtpZighZltlLnRvTG93ZXJDYXNlKCldKXRocm93IG5ldyBFcnJvcihlK1wiIGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhpcyBwbGF0Zm9ybVwiKX0sYS5NQVhfVkFMVUVfMTZCSVRTPTY1NTM1LGEuTUFYX1ZBTFVFXzMyQklUUz0tMSxhLnByZXR0eT1mdW5jdGlvbihlKXt2YXIgdCxyLG49XCJcIjtmb3Iocj0wO3I8KGV8fFwiXCIpLmxlbmd0aDtyKyspbis9XCJcXFxceFwiKygodD1lLmNoYXJDb2RlQXQocikpPDE2P1wiMFwiOlwiXCIpK3QudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7cmV0dXJuIG59LGEuZGVsYXk9ZnVuY3Rpb24oZSx0LHIpe24oZnVuY3Rpb24oKXtlLmFwcGx5KHJ8fG51bGwsdHx8W10pfSl9LGEuaW5oZXJpdHM9ZnVuY3Rpb24oZSx0KXtmdW5jdGlvbiByKCl7fXIucHJvdG90eXBlPXQucHJvdG90eXBlLGUucHJvdG90eXBlPW5ldyByfSxhLmV4dGVuZD1mdW5jdGlvbigpe3ZhciBlLHQscj17fTtmb3IoZT0wO2U8YXJndW1lbnRzLmxlbmd0aDtlKyspZm9yKHQgaW4gYXJndW1lbnRzW2VdKWFyZ3VtZW50c1tlXS5oYXNPd25Qcm9wZXJ0eSh0KSYmdm9pZCAwPT09clt0XSYmKHJbdF09YXJndW1lbnRzW2VdW3RdKTtyZXR1cm4gcn0sYS5wcmVwYXJlQ29udGVudD1mdW5jdGlvbihuLGUsaSxzLG8pe3JldHVybiBkLlByb21pc2UucmVzb2x2ZShlKS50aGVuKGZ1bmN0aW9uKG4pe3JldHVybiBmLmJsb2ImJihuIGluc3RhbmNlb2YgQmxvYnx8LTEhPT1bXCJbb2JqZWN0IEZpbGVdXCIsXCJbb2JqZWN0IEJsb2JdXCJdLmluZGV4T2YoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG4pKSkmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBGaWxlUmVhZGVyP25ldyBkLlByb21pc2UoZnVuY3Rpb24odCxyKXt2YXIgZT1uZXcgRmlsZVJlYWRlcjtlLm9ubG9hZD1mdW5jdGlvbihlKXt0KGUudGFyZ2V0LnJlc3VsdCl9LGUub25lcnJvcj1mdW5jdGlvbihlKXtyKGUudGFyZ2V0LmVycm9yKX0sZS5yZWFkQXNBcnJheUJ1ZmZlcihuKX0pOm59KS50aGVuKGZ1bmN0aW9uKGUpe3ZhciB0LHI9YS5nZXRUeXBlT2YoZSk7cmV0dXJuIHI/KFwiYXJyYXlidWZmZXJcIj09PXI/ZT1hLnRyYW5zZm9ybVRvKFwidWludDhhcnJheVwiLGUpOlwic3RyaW5nXCI9PT1yJiYobz9lPXUuZGVjb2RlKGUpOmkmJiEwIT09cyYmKGU9aCh0PWUsZi51aW50OGFycmF5P25ldyBVaW50OEFycmF5KHQubGVuZ3RoKTpuZXcgQXJyYXkodC5sZW5ndGgpKSkpLGUpOmQuUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiQ2FuJ3QgcmVhZCB0aGUgZGF0YSBvZiAnXCIrbitcIicuIElzIGl0IGluIGEgc3VwcG9ydGVkIEphdmFTY3JpcHQgdHlwZSAoU3RyaW5nLCBCbG9iLCBBcnJheUJ1ZmZlciwgZXRjKSA/XCIpKX0pfX0se1wiLi9iYXNlNjRcIjoxLFwiLi9leHRlcm5hbFwiOjYsXCIuL25vZGVqc1V0aWxzXCI6MTQsXCIuL3N1cHBvcnRcIjozMCxcInNldC1pbW1lZGlhdGUtc2hpbVwiOjU0fV0sMzM6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbj1lKFwiLi9yZWFkZXIvcmVhZGVyRm9yXCIpLGk9ZShcIi4vdXRpbHNcIikscz1lKFwiLi9zaWduYXR1cmVcIiksbz1lKFwiLi96aXBFbnRyeVwiKSxhPShlKFwiLi91dGY4XCIpLGUoXCIuL3N1cHBvcnRcIikpO2Z1bmN0aW9uIGYoZSl7dGhpcy5maWxlcz1bXSx0aGlzLmxvYWRPcHRpb25zPWV9Zi5wcm90b3R5cGU9e2NoZWNrU2lnbmF0dXJlOmZ1bmN0aW9uKGUpe2lmKCF0aGlzLnJlYWRlci5yZWFkQW5kQ2hlY2tTaWduYXR1cmUoZSkpe3RoaXMucmVhZGVyLmluZGV4LT00O3ZhciB0PXRoaXMucmVhZGVyLnJlYWRTdHJpbmcoNCk7dGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcCBvciBidWc6IHVuZXhwZWN0ZWQgc2lnbmF0dXJlIChcIitpLnByZXR0eSh0KStcIiwgZXhwZWN0ZWQgXCIraS5wcmV0dHkoZSkrXCIpXCIpfX0saXNTaWduYXR1cmU6ZnVuY3Rpb24oZSx0KXt2YXIgcj10aGlzLnJlYWRlci5pbmRleDt0aGlzLnJlYWRlci5zZXRJbmRleChlKTt2YXIgbj10aGlzLnJlYWRlci5yZWFkU3RyaW5nKDQpPT09dDtyZXR1cm4gdGhpcy5yZWFkZXIuc2V0SW5kZXgociksbn0scmVhZEJsb2NrRW5kT2ZDZW50cmFsOmZ1bmN0aW9uKCl7dGhpcy5kaXNrTnVtYmVyPXRoaXMucmVhZGVyLnJlYWRJbnQoMiksdGhpcy5kaXNrV2l0aENlbnRyYWxEaXJTdGFydD10aGlzLnJlYWRlci5yZWFkSW50KDIpLHRoaXMuY2VudHJhbERpclJlY29yZHNPblRoaXNEaXNrPXRoaXMucmVhZGVyLnJlYWRJbnQoMiksdGhpcy5jZW50cmFsRGlyUmVjb3Jkcz10aGlzLnJlYWRlci5yZWFkSW50KDIpLHRoaXMuY2VudHJhbERpclNpemU9dGhpcy5yZWFkZXIucmVhZEludCg0KSx0aGlzLmNlbnRyYWxEaXJPZmZzZXQ9dGhpcy5yZWFkZXIucmVhZEludCg0KSx0aGlzLnppcENvbW1lbnRMZW5ndGg9dGhpcy5yZWFkZXIucmVhZEludCgyKTt2YXIgZT10aGlzLnJlYWRlci5yZWFkRGF0YSh0aGlzLnppcENvbW1lbnRMZW5ndGgpLHQ9YS51aW50OGFycmF5P1widWludDhhcnJheVwiOlwiYXJyYXlcIixyPWkudHJhbnNmb3JtVG8odCxlKTt0aGlzLnppcENvbW1lbnQ9dGhpcy5sb2FkT3B0aW9ucy5kZWNvZGVGaWxlTmFtZShyKX0scmVhZEJsb2NrWmlwNjRFbmRPZkNlbnRyYWw6ZnVuY3Rpb24oKXt0aGlzLnppcDY0RW5kT2ZDZW50cmFsU2l6ZT10aGlzLnJlYWRlci5yZWFkSW50KDgpLHRoaXMucmVhZGVyLnNraXAoNCksdGhpcy5kaXNrTnVtYmVyPXRoaXMucmVhZGVyLnJlYWRJbnQoNCksdGhpcy5kaXNrV2l0aENlbnRyYWxEaXJTdGFydD10aGlzLnJlYWRlci5yZWFkSW50KDQpLHRoaXMuY2VudHJhbERpclJlY29yZHNPblRoaXNEaXNrPXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy5jZW50cmFsRGlyUmVjb3Jkcz10aGlzLnJlYWRlci5yZWFkSW50KDgpLHRoaXMuY2VudHJhbERpclNpemU9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLmNlbnRyYWxEaXJPZmZzZXQ9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLnppcDY0RXh0ZW5zaWJsZURhdGE9e307Zm9yKHZhciBlLHQscixuPXRoaXMuemlwNjRFbmRPZkNlbnRyYWxTaXplLTQ0OzA8bjspZT10aGlzLnJlYWRlci5yZWFkSW50KDIpLHQ9dGhpcy5yZWFkZXIucmVhZEludCg0KSxyPXRoaXMucmVhZGVyLnJlYWREYXRhKHQpLHRoaXMuemlwNjRFeHRlbnNpYmxlRGF0YVtlXT17aWQ6ZSxsZW5ndGg6dCx2YWx1ZTpyfX0scmVhZEJsb2NrWmlwNjRFbmRPZkNlbnRyYWxMb2NhdG9yOmZ1bmN0aW9uKCl7aWYodGhpcy5kaXNrV2l0aFppcDY0Q2VudHJhbERpclN0YXJ0PXRoaXMucmVhZGVyLnJlYWRJbnQoNCksdGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyPXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy5kaXNrc0NvdW50PXRoaXMucmVhZGVyLnJlYWRJbnQoNCksMTx0aGlzLmRpc2tzQ291bnQpdGhyb3cgbmV3IEVycm9yKFwiTXVsdGktdm9sdW1lcyB6aXAgYXJlIG5vdCBzdXBwb3J0ZWRcIil9LHJlYWRMb2NhbEZpbGVzOmZ1bmN0aW9uKCl7dmFyIGUsdDtmb3IoZT0wO2U8dGhpcy5maWxlcy5sZW5ndGg7ZSsrKXQ9dGhpcy5maWxlc1tlXSx0aGlzLnJlYWRlci5zZXRJbmRleCh0LmxvY2FsSGVhZGVyT2Zmc2V0KSx0aGlzLmNoZWNrU2lnbmF0dXJlKHMuTE9DQUxfRklMRV9IRUFERVIpLHQucmVhZExvY2FsUGFydCh0aGlzLnJlYWRlciksdC5oYW5kbGVVVEY4KCksdC5wcm9jZXNzQXR0cmlidXRlcygpfSxyZWFkQ2VudHJhbERpcjpmdW5jdGlvbigpe3ZhciBlO2Zvcih0aGlzLnJlYWRlci5zZXRJbmRleCh0aGlzLmNlbnRyYWxEaXJPZmZzZXQpO3RoaXMucmVhZGVyLnJlYWRBbmRDaGVja1NpZ25hdHVyZShzLkNFTlRSQUxfRklMRV9IRUFERVIpOykoZT1uZXcgbyh7emlwNjQ6dGhpcy56aXA2NH0sdGhpcy5sb2FkT3B0aW9ucykpLnJlYWRDZW50cmFsUGFydCh0aGlzLnJlYWRlciksdGhpcy5maWxlcy5wdXNoKGUpO2lmKHRoaXMuY2VudHJhbERpclJlY29yZHMhPT10aGlzLmZpbGVzLmxlbmd0aCYmMCE9PXRoaXMuY2VudHJhbERpclJlY29yZHMmJjA9PT10aGlzLmZpbGVzLmxlbmd0aCl0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwIG9yIGJ1ZzogZXhwZWN0ZWQgXCIrdGhpcy5jZW50cmFsRGlyUmVjb3JkcytcIiByZWNvcmRzIGluIGNlbnRyYWwgZGlyLCBnb3QgXCIrdGhpcy5maWxlcy5sZW5ndGgpfSxyZWFkRW5kT2ZDZW50cmFsOmZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5yZWFkZXIubGFzdEluZGV4T2ZTaWduYXR1cmUocy5DRU5UUkFMX0RJUkVDVE9SWV9FTkQpO2lmKGU8MCl0aHJvdyB0aGlzLmlzU2lnbmF0dXJlKDAscy5MT0NBTF9GSUxFX0hFQURFUik/bmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcDogY2FuJ3QgZmluZCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnlcIik6bmV3IEVycm9yKFwiQ2FuJ3QgZmluZCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgOiBpcyB0aGlzIGEgemlwIGZpbGUgPyBJZiBpdCBpcywgc2VlIGh0dHBzOi8vc3R1ay5naXRodWIuaW8vanN6aXAvZG9jdW1lbnRhdGlvbi9ob3d0by9yZWFkX3ppcC5odG1sXCIpO3RoaXMucmVhZGVyLnNldEluZGV4KGUpO3ZhciB0PWU7aWYodGhpcy5jaGVja1NpZ25hdHVyZShzLkNFTlRSQUxfRElSRUNUT1JZX0VORCksdGhpcy5yZWFkQmxvY2tFbmRPZkNlbnRyYWwoKSx0aGlzLmRpc2tOdW1iZXI9PT1pLk1BWF9WQUxVRV8xNkJJVFN8fHRoaXMuZGlza1dpdGhDZW50cmFsRGlyU3RhcnQ9PT1pLk1BWF9WQUxVRV8xNkJJVFN8fHRoaXMuY2VudHJhbERpclJlY29yZHNPblRoaXNEaXNrPT09aS5NQVhfVkFMVUVfMTZCSVRTfHx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzPT09aS5NQVhfVkFMVUVfMTZCSVRTfHx0aGlzLmNlbnRyYWxEaXJTaXplPT09aS5NQVhfVkFMVUVfMzJCSVRTfHx0aGlzLmNlbnRyYWxEaXJPZmZzZXQ9PT1pLk1BWF9WQUxVRV8zMkJJVFMpe2lmKHRoaXMuemlwNjQ9ITAsKGU9dGhpcy5yZWFkZXIubGFzdEluZGV4T2ZTaWduYXR1cmUocy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9MT0NBVE9SKSk8MCl0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwOiBjYW4ndCBmaW5kIHRoZSBaSVA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgbG9jYXRvclwiKTtpZih0aGlzLnJlYWRlci5zZXRJbmRleChlKSx0aGlzLmNoZWNrU2lnbmF0dXJlKHMuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfTE9DQVRPUiksdGhpcy5yZWFkQmxvY2taaXA2NEVuZE9mQ2VudHJhbExvY2F0b3IoKSwhdGhpcy5pc1NpZ25hdHVyZSh0aGlzLnJlbGF0aXZlT2Zmc2V0RW5kT2ZaaXA2NENlbnRyYWxEaXIscy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9FTkQpJiYodGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyPXRoaXMucmVhZGVyLmxhc3RJbmRleE9mU2lnbmF0dXJlKHMuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfRU5EKSx0aGlzLnJlbGF0aXZlT2Zmc2V0RW5kT2ZaaXA2NENlbnRyYWxEaXI8MCkpdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcDogY2FuJ3QgZmluZCB0aGUgWklQNjQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5XCIpO3RoaXMucmVhZGVyLnNldEluZGV4KHRoaXMucmVsYXRpdmVPZmZzZXRFbmRPZlppcDY0Q2VudHJhbERpciksdGhpcy5jaGVja1NpZ25hdHVyZShzLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0VORCksdGhpcy5yZWFkQmxvY2taaXA2NEVuZE9mQ2VudHJhbCgpfXZhciByPXRoaXMuY2VudHJhbERpck9mZnNldCt0aGlzLmNlbnRyYWxEaXJTaXplO3RoaXMuemlwNjQmJihyKz0yMCxyKz0xMit0aGlzLnppcDY0RW5kT2ZDZW50cmFsU2l6ZSk7dmFyIG49dC1yO2lmKDA8bil0aGlzLmlzU2lnbmF0dXJlKHQscy5DRU5UUkFMX0ZJTEVfSEVBREVSKXx8KHRoaXMucmVhZGVyLnplcm89bik7ZWxzZSBpZihuPDApdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcDogbWlzc2luZyBcIitNYXRoLmFicyhuKStcIiBieXRlcy5cIil9LHByZXBhcmVSZWFkZXI6ZnVuY3Rpb24oZSl7dGhpcy5yZWFkZXI9bihlKX0sbG9hZDpmdW5jdGlvbihlKXt0aGlzLnByZXBhcmVSZWFkZXIoZSksdGhpcy5yZWFkRW5kT2ZDZW50cmFsKCksdGhpcy5yZWFkQ2VudHJhbERpcigpLHRoaXMucmVhZExvY2FsRmlsZXMoKX19LHQuZXhwb3J0cz1mfSx7XCIuL3JlYWRlci9yZWFkZXJGb3JcIjoyMixcIi4vc2lnbmF0dXJlXCI6MjMsXCIuL3N1cHBvcnRcIjozMCxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyLFwiLi96aXBFbnRyeVwiOjM0fV0sMzQ6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbj1lKFwiLi9yZWFkZXIvcmVhZGVyRm9yXCIpLHM9ZShcIi4vdXRpbHNcIiksaT1lKFwiLi9jb21wcmVzc2VkT2JqZWN0XCIpLG89ZShcIi4vY3JjMzJcIiksYT1lKFwiLi91dGY4XCIpLGY9ZShcIi4vY29tcHJlc3Npb25zXCIpLHU9ZShcIi4vc3VwcG9ydFwiKTtmdW5jdGlvbiBkKGUsdCl7dGhpcy5vcHRpb25zPWUsdGhpcy5sb2FkT3B0aW9ucz10fWQucHJvdG90eXBlPXtpc0VuY3J5cHRlZDpmdW5jdGlvbigpe3JldHVybiAxPT0oMSZ0aGlzLmJpdEZsYWcpfSx1c2VVVEY4OmZ1bmN0aW9uKCl7cmV0dXJuIDIwNDg9PSgyMDQ4JnRoaXMuYml0RmxhZyl9LHJlYWRMb2NhbFBhcnQ6ZnVuY3Rpb24oZSl7dmFyIHQscjtpZihlLnNraXAoMjIpLHRoaXMuZmlsZU5hbWVMZW5ndGg9ZS5yZWFkSW50KDIpLHI9ZS5yZWFkSW50KDIpLHRoaXMuZmlsZU5hbWU9ZS5yZWFkRGF0YSh0aGlzLmZpbGVOYW1lTGVuZ3RoKSxlLnNraXAociksLTE9PT10aGlzLmNvbXByZXNzZWRTaXplfHwtMT09PXRoaXMudW5jb21wcmVzc2VkU2l6ZSl0aHJvdyBuZXcgRXJyb3IoXCJCdWcgb3IgY29ycnVwdGVkIHppcCA6IGRpZG4ndCBnZXQgZW5vdWdoIGluZm9ybWF0aW9uIGZyb20gdGhlIGNlbnRyYWwgZGlyZWN0b3J5IChjb21wcmVzc2VkU2l6ZSA9PT0gLTEgfHwgdW5jb21wcmVzc2VkU2l6ZSA9PT0gLTEpXCIpO2lmKG51bGw9PT0odD1mdW5jdGlvbihlKXtmb3IodmFyIHQgaW4gZilpZihmLmhhc093blByb3BlcnR5KHQpJiZmW3RdLm1hZ2ljPT09ZSlyZXR1cm4gZlt0XTtyZXR1cm4gbnVsbH0odGhpcy5jb21wcmVzc2lvbk1ldGhvZCkpKXRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXAgOiBjb21wcmVzc2lvbiBcIitzLnByZXR0eSh0aGlzLmNvbXByZXNzaW9uTWV0aG9kKStcIiB1bmtub3duIChpbm5lciBmaWxlIDogXCIrcy50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLHRoaXMuZmlsZU5hbWUpK1wiKVwiKTt0aGlzLmRlY29tcHJlc3NlZD1uZXcgaSh0aGlzLmNvbXByZXNzZWRTaXplLHRoaXMudW5jb21wcmVzc2VkU2l6ZSx0aGlzLmNyYzMyLHQsZS5yZWFkRGF0YSh0aGlzLmNvbXByZXNzZWRTaXplKSl9LHJlYWRDZW50cmFsUGFydDpmdW5jdGlvbihlKXt0aGlzLnZlcnNpb25NYWRlQnk9ZS5yZWFkSW50KDIpLGUuc2tpcCgyKSx0aGlzLmJpdEZsYWc9ZS5yZWFkSW50KDIpLHRoaXMuY29tcHJlc3Npb25NZXRob2Q9ZS5yZWFkU3RyaW5nKDIpLHRoaXMuZGF0ZT1lLnJlYWREYXRlKCksdGhpcy5jcmMzMj1lLnJlYWRJbnQoNCksdGhpcy5jb21wcmVzc2VkU2l6ZT1lLnJlYWRJbnQoNCksdGhpcy51bmNvbXByZXNzZWRTaXplPWUucmVhZEludCg0KTt2YXIgdD1lLnJlYWRJbnQoMik7aWYodGhpcy5leHRyYUZpZWxkc0xlbmd0aD1lLnJlYWRJbnQoMiksdGhpcy5maWxlQ29tbWVudExlbmd0aD1lLnJlYWRJbnQoMiksdGhpcy5kaXNrTnVtYmVyU3RhcnQ9ZS5yZWFkSW50KDIpLHRoaXMuaW50ZXJuYWxGaWxlQXR0cmlidXRlcz1lLnJlYWRJbnQoMiksdGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzPWUucmVhZEludCg0KSx0aGlzLmxvY2FsSGVhZGVyT2Zmc2V0PWUucmVhZEludCg0KSx0aGlzLmlzRW5jcnlwdGVkKCkpdGhyb3cgbmV3IEVycm9yKFwiRW5jcnlwdGVkIHppcCBhcmUgbm90IHN1cHBvcnRlZFwiKTtlLnNraXAodCksdGhpcy5yZWFkRXh0cmFGaWVsZHMoZSksdGhpcy5wYXJzZVpJUDY0RXh0cmFGaWVsZChlKSx0aGlzLmZpbGVDb21tZW50PWUucmVhZERhdGEodGhpcy5maWxlQ29tbWVudExlbmd0aCl9LHByb2Nlc3NBdHRyaWJ1dGVzOmZ1bmN0aW9uKCl7dGhpcy51bml4UGVybWlzc2lvbnM9bnVsbCx0aGlzLmRvc1Blcm1pc3Npb25zPW51bGw7dmFyIGU9dGhpcy52ZXJzaW9uTWFkZUJ5Pj44O3RoaXMuZGlyPSEhKDE2JnRoaXMuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcyksMD09ZSYmKHRoaXMuZG9zUGVybWlzc2lvbnM9NjMmdGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzKSwzPT1lJiYodGhpcy51bml4UGVybWlzc2lvbnM9dGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzPj4xNiY2NTUzNSksdGhpcy5kaXJ8fFwiL1wiIT09dGhpcy5maWxlTmFtZVN0ci5zbGljZSgtMSl8fCh0aGlzLmRpcj0hMCl9LHBhcnNlWklQNjRFeHRyYUZpZWxkOmZ1bmN0aW9uKGUpe2lmKHRoaXMuZXh0cmFGaWVsZHNbMV0pe3ZhciB0PW4odGhpcy5leHRyYUZpZWxkc1sxXS52YWx1ZSk7dGhpcy51bmNvbXByZXNzZWRTaXplPT09cy5NQVhfVkFMVUVfMzJCSVRTJiYodGhpcy51bmNvbXByZXNzZWRTaXplPXQucmVhZEludCg4KSksdGhpcy5jb21wcmVzc2VkU2l6ZT09PXMuTUFYX1ZBTFVFXzMyQklUUyYmKHRoaXMuY29tcHJlc3NlZFNpemU9dC5yZWFkSW50KDgpKSx0aGlzLmxvY2FsSGVhZGVyT2Zmc2V0PT09cy5NQVhfVkFMVUVfMzJCSVRTJiYodGhpcy5sb2NhbEhlYWRlck9mZnNldD10LnJlYWRJbnQoOCkpLHRoaXMuZGlza051bWJlclN0YXJ0PT09cy5NQVhfVkFMVUVfMzJCSVRTJiYodGhpcy5kaXNrTnVtYmVyU3RhcnQ9dC5yZWFkSW50KDQpKX19LHJlYWRFeHRyYUZpZWxkczpmdW5jdGlvbihlKXt2YXIgdCxyLG4saT1lLmluZGV4K3RoaXMuZXh0cmFGaWVsZHNMZW5ndGg7Zm9yKHRoaXMuZXh0cmFGaWVsZHN8fCh0aGlzLmV4dHJhRmllbGRzPXt9KTtlLmluZGV4KzQ8aTspdD1lLnJlYWRJbnQoMikscj1lLnJlYWRJbnQoMiksbj1lLnJlYWREYXRhKHIpLHRoaXMuZXh0cmFGaWVsZHNbdF09e2lkOnQsbGVuZ3RoOnIsdmFsdWU6bn07ZS5zZXRJbmRleChpKX0saGFuZGxlVVRGODpmdW5jdGlvbigpe3ZhciBlPXUudWludDhhcnJheT9cInVpbnQ4YXJyYXlcIjpcImFycmF5XCI7aWYodGhpcy51c2VVVEY4KCkpdGhpcy5maWxlTmFtZVN0cj1hLnV0ZjhkZWNvZGUodGhpcy5maWxlTmFtZSksdGhpcy5maWxlQ29tbWVudFN0cj1hLnV0ZjhkZWNvZGUodGhpcy5maWxlQ29tbWVudCk7ZWxzZXt2YXIgdD10aGlzLmZpbmRFeHRyYUZpZWxkVW5pY29kZVBhdGgoKTtpZihudWxsIT09dCl0aGlzLmZpbGVOYW1lU3RyPXQ7ZWxzZXt2YXIgcj1zLnRyYW5zZm9ybVRvKGUsdGhpcy5maWxlTmFtZSk7dGhpcy5maWxlTmFtZVN0cj10aGlzLmxvYWRPcHRpb25zLmRlY29kZUZpbGVOYW1lKHIpfXZhciBuPXRoaXMuZmluZEV4dHJhRmllbGRVbmljb2RlQ29tbWVudCgpO2lmKG51bGwhPT1uKXRoaXMuZmlsZUNvbW1lbnRTdHI9bjtlbHNle3ZhciBpPXMudHJhbnNmb3JtVG8oZSx0aGlzLmZpbGVDb21tZW50KTt0aGlzLmZpbGVDb21tZW50U3RyPXRoaXMubG9hZE9wdGlvbnMuZGVjb2RlRmlsZU5hbWUoaSl9fX0sZmluZEV4dHJhRmllbGRVbmljb2RlUGF0aDpmdW5jdGlvbigpe3ZhciBlPXRoaXMuZXh0cmFGaWVsZHNbMjg3ODldO2lmKGUpe3ZhciB0PW4oZS52YWx1ZSk7cmV0dXJuIDEhPT10LnJlYWRJbnQoMSk/bnVsbDpvKHRoaXMuZmlsZU5hbWUpIT09dC5yZWFkSW50KDQpP251bGw6YS51dGY4ZGVjb2RlKHQucmVhZERhdGEoZS5sZW5ndGgtNSkpfXJldHVybiBudWxsfSxmaW5kRXh0cmFGaWVsZFVuaWNvZGVDb21tZW50OmZ1bmN0aW9uKCl7dmFyIGU9dGhpcy5leHRyYUZpZWxkc1syNTQ2MV07aWYoZSl7dmFyIHQ9bihlLnZhbHVlKTtyZXR1cm4gMSE9PXQucmVhZEludCgxKT9udWxsOm8odGhpcy5maWxlQ29tbWVudCkhPT10LnJlYWRJbnQoNCk/bnVsbDphLnV0ZjhkZWNvZGUodC5yZWFkRGF0YShlLmxlbmd0aC01KSl9cmV0dXJuIG51bGx9fSx0LmV4cG9ydHM9ZH0se1wiLi9jb21wcmVzc2VkT2JqZWN0XCI6MixcIi4vY29tcHJlc3Npb25zXCI6MyxcIi4vY3JjMzJcIjo0LFwiLi9yZWFkZXIvcmVhZGVyRm9yXCI6MjIsXCIuL3N1cHBvcnRcIjozMCxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyfV0sMzU6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBuKGUsdCxyKXt0aGlzLm5hbWU9ZSx0aGlzLmRpcj1yLmRpcix0aGlzLmRhdGU9ci5kYXRlLHRoaXMuY29tbWVudD1yLmNvbW1lbnQsdGhpcy51bml4UGVybWlzc2lvbnM9ci51bml4UGVybWlzc2lvbnMsdGhpcy5kb3NQZXJtaXNzaW9ucz1yLmRvc1Blcm1pc3Npb25zLHRoaXMuX2RhdGE9dCx0aGlzLl9kYXRhQmluYXJ5PXIuYmluYXJ5LHRoaXMub3B0aW9ucz17Y29tcHJlc3Npb246ci5jb21wcmVzc2lvbixjb21wcmVzc2lvbk9wdGlvbnM6ci5jb21wcmVzc2lvbk9wdGlvbnN9fXZhciBzPWUoXCIuL3N0cmVhbS9TdHJlYW1IZWxwZXJcIiksaT1lKFwiLi9zdHJlYW0vRGF0YVdvcmtlclwiKSxvPWUoXCIuL3V0ZjhcIiksYT1lKFwiLi9jb21wcmVzc2VkT2JqZWN0XCIpLGY9ZShcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIik7bi5wcm90b3R5cGU9e2ludGVybmFsU3RyZWFtOmZ1bmN0aW9uKGUpe3ZhciB0PW51bGwscj1cInN0cmluZ1wiO3RyeXtpZighZSl0aHJvdyBuZXcgRXJyb3IoXCJObyBvdXRwdXQgdHlwZSBzcGVjaWZpZWQuXCIpO3ZhciBuPVwic3RyaW5nXCI9PT0ocj1lLnRvTG93ZXJDYXNlKCkpfHxcInRleHRcIj09PXI7XCJiaW5hcnlzdHJpbmdcIiE9PXImJlwidGV4dFwiIT09cnx8KHI9XCJzdHJpbmdcIiksdD10aGlzLl9kZWNvbXByZXNzV29ya2VyKCk7dmFyIGk9IXRoaXMuX2RhdGFCaW5hcnk7aSYmIW4mJih0PXQucGlwZShuZXcgby5VdGY4RW5jb2RlV29ya2VyKSksIWkmJm4mJih0PXQucGlwZShuZXcgby5VdGY4RGVjb2RlV29ya2VyKSl9Y2F0Y2goZSl7KHQ9bmV3IGYoXCJlcnJvclwiKSkuZXJyb3IoZSl9cmV0dXJuIG5ldyBzKHQscixcIlwiKX0sYXN5bmM6ZnVuY3Rpb24oZSx0KXtyZXR1cm4gdGhpcy5pbnRlcm5hbFN0cmVhbShlKS5hY2N1bXVsYXRlKHQpfSxub2RlU3RyZWFtOmZ1bmN0aW9uKGUsdCl7cmV0dXJuIHRoaXMuaW50ZXJuYWxTdHJlYW0oZXx8XCJub2RlYnVmZmVyXCIpLnRvTm9kZWpzU3RyZWFtKHQpfSxfY29tcHJlc3NXb3JrZXI6ZnVuY3Rpb24oZSx0KXtpZih0aGlzLl9kYXRhIGluc3RhbmNlb2YgYSYmdGhpcy5fZGF0YS5jb21wcmVzc2lvbi5tYWdpYz09PWUubWFnaWMpcmV0dXJuIHRoaXMuX2RhdGEuZ2V0Q29tcHJlc3NlZFdvcmtlcigpO3ZhciByPXRoaXMuX2RlY29tcHJlc3NXb3JrZXIoKTtyZXR1cm4gdGhpcy5fZGF0YUJpbmFyeXx8KHI9ci5waXBlKG5ldyBvLlV0ZjhFbmNvZGVXb3JrZXIpKSxhLmNyZWF0ZVdvcmtlckZyb20ocixlLHQpfSxfZGVjb21wcmVzc1dvcmtlcjpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9kYXRhIGluc3RhbmNlb2YgYT90aGlzLl9kYXRhLmdldENvbnRlbnRXb3JrZXIoKTp0aGlzLl9kYXRhIGluc3RhbmNlb2YgZj90aGlzLl9kYXRhOm5ldyBpKHRoaXMuX2RhdGEpfX07Zm9yKHZhciB1PVtcImFzVGV4dFwiLFwiYXNCaW5hcnlcIixcImFzTm9kZUJ1ZmZlclwiLFwiYXNVaW50OEFycmF5XCIsXCJhc0FycmF5QnVmZmVyXCJdLGQ9ZnVuY3Rpb24oKXt0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLlwiKX0saD0wO2g8dS5sZW5ndGg7aCsrKW4ucHJvdG90eXBlW3VbaF1dPWQ7dC5leHBvcnRzPW59LHtcIi4vY29tcHJlc3NlZE9iamVjdFwiOjIsXCIuL3N0cmVhbS9EYXRhV29ya2VyXCI6MjcsXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuL3N0cmVhbS9TdHJlYW1IZWxwZXJcIjoyOSxcIi4vdXRmOFwiOjMxfV0sMzY6W2Z1bmN0aW9uKGUsZCx0KXsoZnVuY3Rpb24odCl7XCJ1c2Ugc3RyaWN0XCI7dmFyIHIsbixlPXQuTXV0YXRpb25PYnNlcnZlcnx8dC5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO2lmKGUpe3ZhciBpPTAscz1uZXcgZSh1KSxvPXQuZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7cy5vYnNlcnZlKG8se2NoYXJhY3RlckRhdGE6ITB9KSxyPWZ1bmN0aW9uKCl7by5kYXRhPWk9KytpJTJ9fWVsc2UgaWYodC5zZXRJbW1lZGlhdGV8fHZvaWQgMD09PXQuTWVzc2FnZUNoYW5uZWwpcj1cImRvY3VtZW50XCJpbiB0JiZcIm9ucmVhZHlzdGF0ZWNoYW5nZVwiaW4gdC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpP2Z1bmN0aW9uKCl7dmFyIGU9dC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO2Uub25yZWFkeXN0YXRlY2hhbmdlPWZ1bmN0aW9uKCl7dSgpLGUub25yZWFkeXN0YXRlY2hhbmdlPW51bGwsZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGUpLGU9bnVsbH0sdC5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoZSl9OmZ1bmN0aW9uKCl7c2V0VGltZW91dCh1LDApfTtlbHNle3ZhciBhPW5ldyB0Lk1lc3NhZ2VDaGFubmVsO2EucG9ydDEub25tZXNzYWdlPXUscj1mdW5jdGlvbigpe2EucG9ydDIucG9zdE1lc3NhZ2UoMCl9fXZhciBmPVtdO2Z1bmN0aW9uIHUoKXt2YXIgZSx0O249ITA7Zm9yKHZhciByPWYubGVuZ3RoO3I7KXtmb3IodD1mLGY9W10sZT0tMTsrK2U8cjspdFtlXSgpO3I9Zi5sZW5ndGh9bj0hMX1kLmV4cG9ydHM9ZnVuY3Rpb24oZSl7MSE9PWYucHVzaChlKXx8bnx8cigpfX0pLmNhbGwodGhpcyx2b2lkIDAhPT1yP3I6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHt9XSwzNzpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3ZhciBpPWUoXCJpbW1lZGlhdGVcIik7ZnVuY3Rpb24gdSgpe312YXIgZD17fSxzPVtcIlJFSkVDVEVEXCJdLG89W1wiRlVMRklMTEVEXCJdLG49W1wiUEVORElOR1wiXTtmdW5jdGlvbiBhKGUpe2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIGUpdGhyb3cgbmV3IFR5cGVFcnJvcihcInJlc29sdmVyIG11c3QgYmUgYSBmdW5jdGlvblwiKTt0aGlzLnN0YXRlPW4sdGhpcy5xdWV1ZT1bXSx0aGlzLm91dGNvbWU9dm9pZCAwLGUhPT11JiZjKHRoaXMsZSl9ZnVuY3Rpb24gZihlLHQscil7dGhpcy5wcm9taXNlPWUsXCJmdW5jdGlvblwiPT10eXBlb2YgdCYmKHRoaXMub25GdWxmaWxsZWQ9dCx0aGlzLmNhbGxGdWxmaWxsZWQ9dGhpcy5vdGhlckNhbGxGdWxmaWxsZWQpLFwiZnVuY3Rpb25cIj09dHlwZW9mIHImJih0aGlzLm9uUmVqZWN0ZWQ9cix0aGlzLmNhbGxSZWplY3RlZD10aGlzLm90aGVyQ2FsbFJlamVjdGVkKX1mdW5jdGlvbiBoKHQscixuKXtpKGZ1bmN0aW9uKCl7dmFyIGU7dHJ5e2U9cihuKX1jYXRjaChlKXtyZXR1cm4gZC5yZWplY3QodCxlKX1lPT09dD9kLnJlamVjdCh0LG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVzb2x2ZSBwcm9taXNlIHdpdGggaXRzZWxmXCIpKTpkLnJlc29sdmUodCxlKX0pfWZ1bmN0aW9uIGwoZSl7dmFyIHQ9ZSYmZS50aGVuO2lmKGUmJihcIm9iamVjdFwiPT10eXBlb2YgZXx8XCJmdW5jdGlvblwiPT10eXBlb2YgZSkmJlwiZnVuY3Rpb25cIj09dHlwZW9mIHQpcmV0dXJuIGZ1bmN0aW9uKCl7dC5hcHBseShlLGFyZ3VtZW50cyl9fWZ1bmN0aW9uIGModCxlKXt2YXIgcj0hMTtmdW5jdGlvbiBuKGUpe3J8fChyPSEwLGQucmVqZWN0KHQsZSkpfWZ1bmN0aW9uIGkoZSl7cnx8KHI9ITAsZC5yZXNvbHZlKHQsZSkpfXZhciBzPXAoZnVuY3Rpb24oKXtlKGksbil9KTtcImVycm9yXCI9PT1zLnN0YXR1cyYmbihzLnZhbHVlKX1mdW5jdGlvbiBwKGUsdCl7dmFyIHI9e307dHJ5e3IudmFsdWU9ZSh0KSxyLnN0YXR1cz1cInN1Y2Nlc3NcIn1jYXRjaChlKXtyLnN0YXR1cz1cImVycm9yXCIsci52YWx1ZT1lfXJldHVybiByfSh0LmV4cG9ydHM9YSkucHJvdG90eXBlLmZpbmFsbHk9ZnVuY3Rpb24odCl7aWYoXCJmdW5jdGlvblwiIT10eXBlb2YgdClyZXR1cm4gdGhpczt2YXIgcj10aGlzLmNvbnN0cnVjdG9yO3JldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24oZSl7cmV0dXJuIHIucmVzb2x2ZSh0KCkpLnRoZW4oZnVuY3Rpb24oKXtyZXR1cm4gZX0pfSxmdW5jdGlvbihlKXtyZXR1cm4gci5yZXNvbHZlKHQoKSkudGhlbihmdW5jdGlvbigpe3Rocm93IGV9KX0pfSxhLnByb3RvdHlwZS5jYXRjaD1mdW5jdGlvbihlKXtyZXR1cm4gdGhpcy50aGVuKG51bGwsZSl9LGEucHJvdG90eXBlLnRoZW49ZnVuY3Rpb24oZSx0KXtpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiBlJiZ0aGlzLnN0YXRlPT09b3x8XCJmdW5jdGlvblwiIT10eXBlb2YgdCYmdGhpcy5zdGF0ZT09PXMpcmV0dXJuIHRoaXM7dmFyIHI9bmV3IHRoaXMuY29uc3RydWN0b3IodSk7cmV0dXJuIHRoaXMuc3RhdGUhPT1uP2gocix0aGlzLnN0YXRlPT09bz9lOnQsdGhpcy5vdXRjb21lKTp0aGlzLnF1ZXVlLnB1c2gobmV3IGYocixlLHQpKSxyfSxmLnByb3RvdHlwZS5jYWxsRnVsZmlsbGVkPWZ1bmN0aW9uKGUpe2QucmVzb2x2ZSh0aGlzLnByb21pc2UsZSl9LGYucHJvdG90eXBlLm90aGVyQ2FsbEZ1bGZpbGxlZD1mdW5jdGlvbihlKXtoKHRoaXMucHJvbWlzZSx0aGlzLm9uRnVsZmlsbGVkLGUpfSxmLnByb3RvdHlwZS5jYWxsUmVqZWN0ZWQ9ZnVuY3Rpb24oZSl7ZC5yZWplY3QodGhpcy5wcm9taXNlLGUpfSxmLnByb3RvdHlwZS5vdGhlckNhbGxSZWplY3RlZD1mdW5jdGlvbihlKXtoKHRoaXMucHJvbWlzZSx0aGlzLm9uUmVqZWN0ZWQsZSl9LGQucmVzb2x2ZT1mdW5jdGlvbihlLHQpe3ZhciByPXAobCx0KTtpZihcImVycm9yXCI9PT1yLnN0YXR1cylyZXR1cm4gZC5yZWplY3QoZSxyLnZhbHVlKTt2YXIgbj1yLnZhbHVlO2lmKG4pYyhlLG4pO2Vsc2V7ZS5zdGF0ZT1vLGUub3V0Y29tZT10O2Zvcih2YXIgaT0tMSxzPWUucXVldWUubGVuZ3RoOysraTxzOyllLnF1ZXVlW2ldLmNhbGxGdWxmaWxsZWQodCl9cmV0dXJuIGV9LGQucmVqZWN0PWZ1bmN0aW9uKGUsdCl7ZS5zdGF0ZT1zLGUub3V0Y29tZT10O2Zvcih2YXIgcj0tMSxuPWUucXVldWUubGVuZ3RoOysrcjxuOyllLnF1ZXVlW3JdLmNhbGxSZWplY3RlZCh0KTtyZXR1cm4gZX0sYS5yZXNvbHZlPWZ1bmN0aW9uKGUpe3JldHVybiBlIGluc3RhbmNlb2YgdGhpcz9lOmQucmVzb2x2ZShuZXcgdGhpcyh1KSxlKX0sYS5yZWplY3Q9ZnVuY3Rpb24oZSl7dmFyIHQ9bmV3IHRoaXModSk7cmV0dXJuIGQucmVqZWN0KHQsZSl9LGEuYWxsPWZ1bmN0aW9uKGUpe3ZhciByPXRoaXM7aWYoXCJbb2JqZWN0IEFycmF5XVwiIT09T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGUpKXJldHVybiB0aGlzLnJlamVjdChuZXcgVHlwZUVycm9yKFwibXVzdCBiZSBhbiBhcnJheVwiKSk7dmFyIG49ZS5sZW5ndGgsaT0hMTtpZighbilyZXR1cm4gdGhpcy5yZXNvbHZlKFtdKTtmb3IodmFyIHM9bmV3IEFycmF5KG4pLG89MCx0PS0xLGE9bmV3IHRoaXModSk7Kyt0PG47KWYoZVt0XSx0KTtyZXR1cm4gYTtmdW5jdGlvbiBmKGUsdCl7ci5yZXNvbHZlKGUpLnRoZW4oZnVuY3Rpb24oZSl7c1t0XT1lLCsrbyE9PW58fGl8fChpPSEwLGQucmVzb2x2ZShhLHMpKX0sZnVuY3Rpb24oZSl7aXx8KGk9ITAsZC5yZWplY3QoYSxlKSl9KX19LGEucmFjZT1mdW5jdGlvbihlKXtpZihcIltvYmplY3QgQXJyYXldXCIhPT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZSkpcmV0dXJuIHRoaXMucmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJtdXN0IGJlIGFuIGFycmF5XCIpKTt2YXIgdD1lLmxlbmd0aCxyPSExO2lmKCF0KXJldHVybiB0aGlzLnJlc29sdmUoW10pO2Zvcih2YXIgbixpPS0xLHM9bmV3IHRoaXModSk7KytpPHQ7KW49ZVtpXSx0aGlzLnJlc29sdmUobikudGhlbihmdW5jdGlvbihlKXtyfHwocj0hMCxkLnJlc29sdmUocyxlKSl9LGZ1bmN0aW9uKGUpe3J8fChyPSEwLGQucmVqZWN0KHMsZSkpfSk7cmV0dXJuIHN9fSx7aW1tZWRpYXRlOjM2fV0sMzg6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbj17fTsoMCxlKFwiLi9saWIvdXRpbHMvY29tbW9uXCIpLmFzc2lnbikobixlKFwiLi9saWIvZGVmbGF0ZVwiKSxlKFwiLi9saWIvaW5mbGF0ZVwiKSxlKFwiLi9saWIvemxpYi9jb25zdGFudHNcIikpLHQuZXhwb3J0cz1ufSx7XCIuL2xpYi9kZWZsYXRlXCI6MzksXCIuL2xpYi9pbmZsYXRlXCI6NDAsXCIuL2xpYi91dGlscy9jb21tb25cIjo0MSxcIi4vbGliL3psaWIvY29uc3RhbnRzXCI6NDR9XSwzOTpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3ZhciBvPWUoXCIuL3psaWIvZGVmbGF0ZVwiKSxhPWUoXCIuL3V0aWxzL2NvbW1vblwiKSxmPWUoXCIuL3V0aWxzL3N0cmluZ3NcIiksaT1lKFwiLi96bGliL21lc3NhZ2VzXCIpLHM9ZShcIi4vemxpYi96c3RyZWFtXCIpLHU9T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxkPTAsaD0tMSxsPTAsYz04O2Z1bmN0aW9uIHAoZSl7aWYoISh0aGlzIGluc3RhbmNlb2YgcCkpcmV0dXJuIG5ldyBwKGUpO3RoaXMub3B0aW9ucz1hLmFzc2lnbih7bGV2ZWw6aCxtZXRob2Q6YyxjaHVua1NpemU6MTYzODQsd2luZG93Qml0czoxNSxtZW1MZXZlbDo4LHN0cmF0ZWd5OmwsdG86XCJcIn0sZXx8e30pO3ZhciB0PXRoaXMub3B0aW9uczt0LnJhdyYmMDx0LndpbmRvd0JpdHM/dC53aW5kb3dCaXRzPS10LndpbmRvd0JpdHM6dC5nemlwJiYwPHQud2luZG93Qml0cyYmdC53aW5kb3dCaXRzPDE2JiYodC53aW5kb3dCaXRzKz0xNiksdGhpcy5lcnI9MCx0aGlzLm1zZz1cIlwiLHRoaXMuZW5kZWQ9ITEsdGhpcy5jaHVua3M9W10sdGhpcy5zdHJtPW5ldyBzLHRoaXMuc3RybS5hdmFpbF9vdXQ9MDt2YXIgcj1vLmRlZmxhdGVJbml0Mih0aGlzLnN0cm0sdC5sZXZlbCx0Lm1ldGhvZCx0LndpbmRvd0JpdHMsdC5tZW1MZXZlbCx0LnN0cmF0ZWd5KTtpZihyIT09ZCl0aHJvdyBuZXcgRXJyb3IoaVtyXSk7aWYodC5oZWFkZXImJm8uZGVmbGF0ZVNldEhlYWRlcih0aGlzLnN0cm0sdC5oZWFkZXIpLHQuZGljdGlvbmFyeSl7dmFyIG47aWYobj1cInN0cmluZ1wiPT10eXBlb2YgdC5kaWN0aW9uYXJ5P2Yuc3RyaW5nMmJ1Zih0LmRpY3Rpb25hcnkpOlwiW29iamVjdCBBcnJheUJ1ZmZlcl1cIj09PXUuY2FsbCh0LmRpY3Rpb25hcnkpP25ldyBVaW50OEFycmF5KHQuZGljdGlvbmFyeSk6dC5kaWN0aW9uYXJ5LChyPW8uZGVmbGF0ZVNldERpY3Rpb25hcnkodGhpcy5zdHJtLG4pKSE9PWQpdGhyb3cgbmV3IEVycm9yKGlbcl0pO3RoaXMuX2RpY3Rfc2V0PSEwfX1mdW5jdGlvbiBuKGUsdCl7dmFyIHI9bmV3IHAodCk7aWYoci5wdXNoKGUsITApLHIuZXJyKXRocm93IHIubXNnfHxpW3IuZXJyXTtyZXR1cm4gci5yZXN1bHR9cC5wcm90b3R5cGUucHVzaD1mdW5jdGlvbihlLHQpe3ZhciByLG4saT10aGlzLnN0cm0scz10aGlzLm9wdGlvbnMuY2h1bmtTaXplO2lmKHRoaXMuZW5kZWQpcmV0dXJuITE7bj10PT09fn50P3Q6ITA9PT10PzQ6MCxcInN0cmluZ1wiPT10eXBlb2YgZT9pLmlucHV0PWYuc3RyaW5nMmJ1ZihlKTpcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI9PT11LmNhbGwoZSk/aS5pbnB1dD1uZXcgVWludDhBcnJheShlKTppLmlucHV0PWUsaS5uZXh0X2luPTAsaS5hdmFpbF9pbj1pLmlucHV0Lmxlbmd0aDtkb3tpZigwPT09aS5hdmFpbF9vdXQmJihpLm91dHB1dD1uZXcgYS5CdWY4KHMpLGkubmV4dF9vdXQ9MCxpLmF2YWlsX291dD1zKSwxIT09KHI9by5kZWZsYXRlKGksbikpJiZyIT09ZClyZXR1cm4gdGhpcy5vbkVuZChyKSwhKHRoaXMuZW5kZWQ9ITApOzAhPT1pLmF2YWlsX291dCYmKDAhPT1pLmF2YWlsX2lufHw0IT09biYmMiE9PW4pfHwoXCJzdHJpbmdcIj09PXRoaXMub3B0aW9ucy50bz90aGlzLm9uRGF0YShmLmJ1ZjJiaW5zdHJpbmcoYS5zaHJpbmtCdWYoaS5vdXRwdXQsaS5uZXh0X291dCkpKTp0aGlzLm9uRGF0YShhLnNocmlua0J1ZihpLm91dHB1dCxpLm5leHRfb3V0KSkpfXdoaWxlKCgwPGkuYXZhaWxfaW58fDA9PT1pLmF2YWlsX291dCkmJjEhPT1yKTtyZXR1cm4gND09PW4/KHI9by5kZWZsYXRlRW5kKHRoaXMuc3RybSksdGhpcy5vbkVuZChyKSx0aGlzLmVuZGVkPSEwLHI9PT1kKToyIT09bnx8KHRoaXMub25FbmQoZCksIShpLmF2YWlsX291dD0wKSl9LHAucHJvdG90eXBlLm9uRGF0YT1mdW5jdGlvbihlKXt0aGlzLmNodW5rcy5wdXNoKGUpfSxwLnByb3RvdHlwZS5vbkVuZD1mdW5jdGlvbihlKXtlPT09ZCYmKFwic3RyaW5nXCI9PT10aGlzLm9wdGlvbnMudG8/dGhpcy5yZXN1bHQ9dGhpcy5jaHVua3Muam9pbihcIlwiKTp0aGlzLnJlc3VsdD1hLmZsYXR0ZW5DaHVua3ModGhpcy5jaHVua3MpKSx0aGlzLmNodW5rcz1bXSx0aGlzLmVycj1lLHRoaXMubXNnPXRoaXMuc3RybS5tc2d9LHIuRGVmbGF0ZT1wLHIuZGVmbGF0ZT1uLHIuZGVmbGF0ZVJhdz1mdW5jdGlvbihlLHQpe3JldHVybih0PXR8fHt9KS5yYXc9ITAsbihlLHQpfSxyLmd6aXA9ZnVuY3Rpb24oZSx0KXtyZXR1cm4odD10fHx7fSkuZ3ppcD0hMCxuKGUsdCl9fSx7XCIuL3V0aWxzL2NvbW1vblwiOjQxLFwiLi91dGlscy9zdHJpbmdzXCI6NDIsXCIuL3psaWIvZGVmbGF0ZVwiOjQ2LFwiLi96bGliL21lc3NhZ2VzXCI6NTEsXCIuL3psaWIvenN0cmVhbVwiOjUzfV0sNDA6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbD1lKFwiLi96bGliL2luZmxhdGVcIiksYz1lKFwiLi91dGlscy9jb21tb25cIikscD1lKFwiLi91dGlscy9zdHJpbmdzXCIpLG09ZShcIi4vemxpYi9jb25zdGFudHNcIiksbj1lKFwiLi96bGliL21lc3NhZ2VzXCIpLGk9ZShcIi4vemxpYi96c3RyZWFtXCIpLHM9ZShcIi4vemxpYi9nemhlYWRlclwiKSxfPU9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7ZnVuY3Rpb24gbyhlKXtpZighKHRoaXMgaW5zdGFuY2VvZiBvKSlyZXR1cm4gbmV3IG8oZSk7dGhpcy5vcHRpb25zPWMuYXNzaWduKHtjaHVua1NpemU6MTYzODQsd2luZG93Qml0czowLHRvOlwiXCJ9LGV8fHt9KTt2YXIgdD10aGlzLm9wdGlvbnM7dC5yYXcmJjA8PXQud2luZG93Qml0cyYmdC53aW5kb3dCaXRzPDE2JiYodC53aW5kb3dCaXRzPS10LndpbmRvd0JpdHMsMD09PXQud2luZG93Qml0cyYmKHQud2luZG93Qml0cz0tMTUpKSwhKDA8PXQud2luZG93Qml0cyYmdC53aW5kb3dCaXRzPDE2KXx8ZSYmZS53aW5kb3dCaXRzfHwodC53aW5kb3dCaXRzKz0zMiksMTU8dC53aW5kb3dCaXRzJiZ0LndpbmRvd0JpdHM8NDgmJjA9PSgxNSZ0LndpbmRvd0JpdHMpJiYodC53aW5kb3dCaXRzfD0xNSksdGhpcy5lcnI9MCx0aGlzLm1zZz1cIlwiLHRoaXMuZW5kZWQ9ITEsdGhpcy5jaHVua3M9W10sdGhpcy5zdHJtPW5ldyBpLHRoaXMuc3RybS5hdmFpbF9vdXQ9MDt2YXIgcj1sLmluZmxhdGVJbml0Mih0aGlzLnN0cm0sdC53aW5kb3dCaXRzKTtpZihyIT09bS5aX09LKXRocm93IG5ldyBFcnJvcihuW3JdKTt0aGlzLmhlYWRlcj1uZXcgcyxsLmluZmxhdGVHZXRIZWFkZXIodGhpcy5zdHJtLHRoaXMuaGVhZGVyKX1mdW5jdGlvbiBhKGUsdCl7dmFyIHI9bmV3IG8odCk7aWYoci5wdXNoKGUsITApLHIuZXJyKXRocm93IHIubXNnfHxuW3IuZXJyXTtyZXR1cm4gci5yZXN1bHR9by5wcm90b3R5cGUucHVzaD1mdW5jdGlvbihlLHQpe3ZhciByLG4saSxzLG8sYSxmPXRoaXMuc3RybSx1PXRoaXMub3B0aW9ucy5jaHVua1NpemUsZD10aGlzLm9wdGlvbnMuZGljdGlvbmFyeSxoPSExO2lmKHRoaXMuZW5kZWQpcmV0dXJuITE7bj10PT09fn50P3Q6ITA9PT10P20uWl9GSU5JU0g6bS5aX05PX0ZMVVNILFwic3RyaW5nXCI9PXR5cGVvZiBlP2YuaW5wdXQ9cC5iaW5zdHJpbmcyYnVmKGUpOlwiW29iamVjdCBBcnJheUJ1ZmZlcl1cIj09PV8uY2FsbChlKT9mLmlucHV0PW5ldyBVaW50OEFycmF5KGUpOmYuaW5wdXQ9ZSxmLm5leHRfaW49MCxmLmF2YWlsX2luPWYuaW5wdXQubGVuZ3RoO2Rve2lmKDA9PT1mLmF2YWlsX291dCYmKGYub3V0cHV0PW5ldyBjLkJ1ZjgodSksZi5uZXh0X291dD0wLGYuYXZhaWxfb3V0PXUpLChyPWwuaW5mbGF0ZShmLG0uWl9OT19GTFVTSCkpPT09bS5aX05FRURfRElDVCYmZCYmKGE9XCJzdHJpbmdcIj09dHlwZW9mIGQ/cC5zdHJpbmcyYnVmKGQpOlwiW29iamVjdCBBcnJheUJ1ZmZlcl1cIj09PV8uY2FsbChkKT9uZXcgVWludDhBcnJheShkKTpkLHI9bC5pbmZsYXRlU2V0RGljdGlvbmFyeSh0aGlzLnN0cm0sYSkpLHI9PT1tLlpfQlVGX0VSUk9SJiYhMD09PWgmJihyPW0uWl9PSyxoPSExKSxyIT09bS5aX1NUUkVBTV9FTkQmJnIhPT1tLlpfT0spcmV0dXJuIHRoaXMub25FbmQociksISh0aGlzLmVuZGVkPSEwKTtmLm5leHRfb3V0JiYoMCE9PWYuYXZhaWxfb3V0JiZyIT09bS5aX1NUUkVBTV9FTkQmJigwIT09Zi5hdmFpbF9pbnx8biE9PW0uWl9GSU5JU0gmJm4hPT1tLlpfU1lOQ19GTFVTSCl8fChcInN0cmluZ1wiPT09dGhpcy5vcHRpb25zLnRvPyhpPXAudXRmOGJvcmRlcihmLm91dHB1dCxmLm5leHRfb3V0KSxzPWYubmV4dF9vdXQtaSxvPXAuYnVmMnN0cmluZyhmLm91dHB1dCxpKSxmLm5leHRfb3V0PXMsZi5hdmFpbF9vdXQ9dS1zLHMmJmMuYXJyYXlTZXQoZi5vdXRwdXQsZi5vdXRwdXQsaSxzLDApLHRoaXMub25EYXRhKG8pKTp0aGlzLm9uRGF0YShjLnNocmlua0J1ZihmLm91dHB1dCxmLm5leHRfb3V0KSkpKSwwPT09Zi5hdmFpbF9pbiYmMD09PWYuYXZhaWxfb3V0JiYoaD0hMCl9d2hpbGUoKDA8Zi5hdmFpbF9pbnx8MD09PWYuYXZhaWxfb3V0KSYmciE9PW0uWl9TVFJFQU1fRU5EKTtyZXR1cm4gcj09PW0uWl9TVFJFQU1fRU5EJiYobj1tLlpfRklOSVNIKSxuPT09bS5aX0ZJTklTSD8ocj1sLmluZmxhdGVFbmQodGhpcy5zdHJtKSx0aGlzLm9uRW5kKHIpLHRoaXMuZW5kZWQ9ITAscj09PW0uWl9PSyk6biE9PW0uWl9TWU5DX0ZMVVNIfHwodGhpcy5vbkVuZChtLlpfT0spLCEoZi5hdmFpbF9vdXQ9MCkpfSxvLnByb3RvdHlwZS5vbkRhdGE9ZnVuY3Rpb24oZSl7dGhpcy5jaHVua3MucHVzaChlKX0sby5wcm90b3R5cGUub25FbmQ9ZnVuY3Rpb24oZSl7ZT09PW0uWl9PSyYmKFwic3RyaW5nXCI9PT10aGlzLm9wdGlvbnMudG8/dGhpcy5yZXN1bHQ9dGhpcy5jaHVua3Muam9pbihcIlwiKTp0aGlzLnJlc3VsdD1jLmZsYXR0ZW5DaHVua3ModGhpcy5jaHVua3MpKSx0aGlzLmNodW5rcz1bXSx0aGlzLmVycj1lLHRoaXMubXNnPXRoaXMuc3RybS5tc2d9LHIuSW5mbGF0ZT1vLHIuaW5mbGF0ZT1hLHIuaW5mbGF0ZVJhdz1mdW5jdGlvbihlLHQpe3JldHVybih0PXR8fHt9KS5yYXc9ITAsYShlLHQpfSxyLnVuZ3ppcD1hfSx7XCIuL3V0aWxzL2NvbW1vblwiOjQxLFwiLi91dGlscy9zdHJpbmdzXCI6NDIsXCIuL3psaWIvY29uc3RhbnRzXCI6NDQsXCIuL3psaWIvZ3poZWFkZXJcIjo0NyxcIi4vemxpYi9pbmZsYXRlXCI6NDksXCIuL3psaWIvbWVzc2FnZXNcIjo1MSxcIi4vemxpYi96c3RyZWFtXCI6NTN9XSw0MTpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3ZhciBuPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50OEFycmF5JiZcInVuZGVmaW5lZFwiIT10eXBlb2YgVWludDE2QXJyYXkmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBJbnQzMkFycmF5O3IuYXNzaWduPWZ1bmN0aW9uKGUpe2Zvcih2YXIgdD1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMSk7dC5sZW5ndGg7KXt2YXIgcj10LnNoaWZ0KCk7aWYocil7aWYoXCJvYmplY3RcIiE9dHlwZW9mIHIpdGhyb3cgbmV3IFR5cGVFcnJvcihyK1wibXVzdCBiZSBub24tb2JqZWN0XCIpO2Zvcih2YXIgbiBpbiByKXIuaGFzT3duUHJvcGVydHkobikmJihlW25dPXJbbl0pfX1yZXR1cm4gZX0sci5zaHJpbmtCdWY9ZnVuY3Rpb24oZSx0KXtyZXR1cm4gZS5sZW5ndGg9PT10P2U6ZS5zdWJhcnJheT9lLnN1YmFycmF5KDAsdCk6KGUubGVuZ3RoPXQsZSl9O3ZhciBpPXthcnJheVNldDpmdW5jdGlvbihlLHQscixuLGkpe2lmKHQuc3ViYXJyYXkmJmUuc3ViYXJyYXkpZS5zZXQodC5zdWJhcnJheShyLHIrbiksaSk7ZWxzZSBmb3IodmFyIHM9MDtzPG47cysrKWVbaStzXT10W3Irc119LGZsYXR0ZW5DaHVua3M6ZnVuY3Rpb24oZSl7dmFyIHQscixuLGkscyxvO2Zvcih0PW49MCxyPWUubGVuZ3RoO3Q8cjt0Kyspbis9ZVt0XS5sZW5ndGg7Zm9yKG89bmV3IFVpbnQ4QXJyYXkobiksdD1pPTAscj1lLmxlbmd0aDt0PHI7dCsrKXM9ZVt0XSxvLnNldChzLGkpLGkrPXMubGVuZ3RoO3JldHVybiBvfX0scz17YXJyYXlTZXQ6ZnVuY3Rpb24oZSx0LHIsbixpKXtmb3IodmFyIHM9MDtzPG47cysrKWVbaStzXT10W3Irc119LGZsYXR0ZW5DaHVua3M6ZnVuY3Rpb24oZSl7cmV0dXJuW10uY29uY2F0LmFwcGx5KFtdLGUpfX07ci5zZXRUeXBlZD1mdW5jdGlvbihlKXtlPyhyLkJ1Zjg9VWludDhBcnJheSxyLkJ1ZjE2PVVpbnQxNkFycmF5LHIuQnVmMzI9SW50MzJBcnJheSxyLmFzc2lnbihyLGkpKTooci5CdWY4PUFycmF5LHIuQnVmMTY9QXJyYXksci5CdWYzMj1BcnJheSxyLmFzc2lnbihyLHMpKX0sci5zZXRUeXBlZChuKX0se31dLDQyOltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGY9ZShcIi4vY29tbW9uXCIpLGk9ITAscz0hMDt0cnl7U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLFswXSl9Y2F0Y2goZSl7aT0hMX10cnl7U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLG5ldyBVaW50OEFycmF5KDEpKX1jYXRjaChlKXtzPSExfWZvcih2YXIgdT1uZXcgZi5CdWY4KDI1Niksbj0wO248MjU2O24rKyl1W25dPTI1Mjw9bj82OjI0ODw9bj81OjI0MDw9bj80OjIyNDw9bj8zOjE5Mjw9bj8yOjE7ZnVuY3Rpb24gZChlLHQpe2lmKHQ8NjU1MzcmJihlLnN1YmFycmF5JiZzfHwhZS5zdWJhcnJheSYmaSkpcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxmLnNocmlua0J1ZihlLHQpKTtmb3IodmFyIHI9XCJcIixuPTA7bjx0O24rKylyKz1TdHJpbmcuZnJvbUNoYXJDb2RlKGVbbl0pO3JldHVybiByfXVbMjU0XT11WzI1NF09MSxyLnN0cmluZzJidWY9ZnVuY3Rpb24oZSl7dmFyIHQscixuLGkscyxvPWUubGVuZ3RoLGE9MDtmb3IoaT0wO2k8bztpKyspNTUyOTY9PSg2NDUxMiYocj1lLmNoYXJDb2RlQXQoaSkpKSYmaSsxPG8mJjU2MzIwPT0oNjQ1MTImKG49ZS5jaGFyQ29kZUF0KGkrMSkpKSYmKHI9NjU1MzYrKHItNTUyOTY8PDEwKSsobi01NjMyMCksaSsrKSxhKz1yPDEyOD8xOnI8MjA0OD8yOnI8NjU1MzY/Mzo0O2Zvcih0PW5ldyBmLkJ1ZjgoYSksaT1zPTA7czxhO2krKyk1NTI5Nj09KDY0NTEyJihyPWUuY2hhckNvZGVBdChpKSkpJiZpKzE8byYmNTYzMjA9PSg2NDUxMiYobj1lLmNoYXJDb2RlQXQoaSsxKSkpJiYocj02NTUzNisoci01NTI5Njw8MTApKyhuLTU2MzIwKSxpKyspLHI8MTI4P3RbcysrXT1yOihyPDIwNDg/dFtzKytdPTE5MnxyPj4+Njoocjw2NTUzNj90W3MrK109MjI0fHI+Pj4xMjoodFtzKytdPTI0MHxyPj4+MTgsdFtzKytdPTEyOHxyPj4+MTImNjMpLHRbcysrXT0xMjh8cj4+PjYmNjMpLHRbcysrXT0xMjh8NjMmcik7cmV0dXJuIHR9LHIuYnVmMmJpbnN0cmluZz1mdW5jdGlvbihlKXtyZXR1cm4gZChlLGUubGVuZ3RoKX0sci5iaW5zdHJpbmcyYnVmPWZ1bmN0aW9uKGUpe2Zvcih2YXIgdD1uZXcgZi5CdWY4KGUubGVuZ3RoKSxyPTAsbj10Lmxlbmd0aDtyPG47cisrKXRbcl09ZS5jaGFyQ29kZUF0KHIpO3JldHVybiB0fSxyLmJ1ZjJzdHJpbmc9ZnVuY3Rpb24oZSx0KXt2YXIgcixuLGkscyxvPXR8fGUubGVuZ3RoLGE9bmV3IEFycmF5KDIqbyk7Zm9yKHI9bj0wO3I8bzspaWYoKGk9ZVtyKytdKTwxMjgpYVtuKytdPWk7ZWxzZSBpZig0PChzPXVbaV0pKWFbbisrXT02NTUzMyxyKz1zLTE7ZWxzZXtmb3IoaSY9Mj09PXM/MzE6Mz09PXM/MTU6NzsxPHMmJnI8bzspaT1pPDw2fDYzJmVbcisrXSxzLS07MTxzP2FbbisrXT02NTUzMzppPDY1NTM2P2FbbisrXT1pOihpLT02NTUzNixhW24rK109NTUyOTZ8aT4+MTAmMTAyMyxhW24rK109NTYzMjB8MTAyMyZpKX1yZXR1cm4gZChhLG4pfSxyLnV0Zjhib3JkZXI9ZnVuY3Rpb24oZSx0KXt2YXIgcjtmb3IoKHQ9dHx8ZS5sZW5ndGgpPmUubGVuZ3RoJiYodD1lLmxlbmd0aCkscj10LTE7MDw9ciYmMTI4PT0oMTkyJmVbcl0pOylyLS07cmV0dXJuIHI8MD90OjA9PT1yP3Q6cit1W2Vbcl1dPnQ/cjp0fX0se1wiLi9jb21tb25cIjo0MX1dLDQzOltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dC5leHBvcnRzPWZ1bmN0aW9uKGUsdCxyLG4pe2Zvcih2YXIgaT02NTUzNSZlfDAscz1lPj4+MTYmNjU1MzV8MCxvPTA7MCE9PXI7KXtmb3Ioci09bz0yZTM8cj8yZTM6cjtzPXMrKGk9aSt0W24rK118MCl8MCwtLW87KTtpJT02NTUyMSxzJT02NTUyMX1yZXR1cm4gaXxzPDwxNnwwfX0se31dLDQ0OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dC5leHBvcnRzPXtaX05PX0ZMVVNIOjAsWl9QQVJUSUFMX0ZMVVNIOjEsWl9TWU5DX0ZMVVNIOjIsWl9GVUxMX0ZMVVNIOjMsWl9GSU5JU0g6NCxaX0JMT0NLOjUsWl9UUkVFUzo2LFpfT0s6MCxaX1NUUkVBTV9FTkQ6MSxaX05FRURfRElDVDoyLFpfRVJSTk86LTEsWl9TVFJFQU1fRVJST1I6LTIsWl9EQVRBX0VSUk9SOi0zLFpfQlVGX0VSUk9SOi01LFpfTk9fQ09NUFJFU1NJT046MCxaX0JFU1RfU1BFRUQ6MSxaX0JFU1RfQ09NUFJFU1NJT046OSxaX0RFRkFVTFRfQ09NUFJFU1NJT046LTEsWl9GSUxURVJFRDoxLFpfSFVGRk1BTl9PTkxZOjIsWl9STEU6MyxaX0ZJWEVEOjQsWl9ERUZBVUxUX1NUUkFURUdZOjAsWl9CSU5BUlk6MCxaX1RFWFQ6MSxaX1VOS05PV046MixaX0RFRkxBVEVEOjh9fSx7fV0sNDU6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgYT1mdW5jdGlvbigpe2Zvcih2YXIgZSx0PVtdLHI9MDtyPDI1NjtyKyspe2U9cjtmb3IodmFyIG49MDtuPDg7bisrKWU9MSZlPzM5ODgyOTIzODReZT4+PjE6ZT4+PjE7dFtyXT1lfXJldHVybiB0fSgpO3QuZXhwb3J0cz1mdW5jdGlvbihlLHQscixuKXt2YXIgaT1hLHM9bityO2VePS0xO2Zvcih2YXIgbz1uO288cztvKyspZT1lPj4+OF5pWzI1NSYoZV50W29dKV07cmV0dXJuLTFeZX19LHt9XSw0NjpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3ZhciBmLGw9ZShcIi4uL3V0aWxzL2NvbW1vblwiKSx1PWUoXCIuL3RyZWVzXCIpLGM9ZShcIi4vYWRsZXIzMlwiKSxwPWUoXCIuL2NyYzMyXCIpLG49ZShcIi4vbWVzc2FnZXNcIiksZD0wLGg9MCxtPS0yLGk9MixfPTgscz0yODYsbz0zMCxhPTE5LHc9MipzKzEsdj0xNSxnPTMseT0yNTgsYj15K2crMSxrPTQyLHg9MTEzO2Z1bmN0aW9uIFMoZSx0KXtyZXR1cm4gZS5tc2c9blt0XSx0fWZ1bmN0aW9uIEUoZSl7cmV0dXJuKGU8PDEpLSg0PGU/OTowKX1mdW5jdGlvbiB6KGUpe2Zvcih2YXIgdD1lLmxlbmd0aDswPD0tLXQ7KWVbdF09MH1mdW5jdGlvbiBDKGUpe3ZhciB0PWUuc3RhdGUscj10LnBlbmRpbmc7cj5lLmF2YWlsX291dCYmKHI9ZS5hdmFpbF9vdXQpLDAhPT1yJiYobC5hcnJheVNldChlLm91dHB1dCx0LnBlbmRpbmdfYnVmLHQucGVuZGluZ19vdXQscixlLm5leHRfb3V0KSxlLm5leHRfb3V0Kz1yLHQucGVuZGluZ19vdXQrPXIsZS50b3RhbF9vdXQrPXIsZS5hdmFpbF9vdXQtPXIsdC5wZW5kaW5nLT1yLDA9PT10LnBlbmRpbmcmJih0LnBlbmRpbmdfb3V0PTApKX1mdW5jdGlvbiBBKGUsdCl7dS5fdHJfZmx1c2hfYmxvY2soZSwwPD1lLmJsb2NrX3N0YXJ0P2UuYmxvY2tfc3RhcnQ6LTEsZS5zdHJzdGFydC1lLmJsb2NrX3N0YXJ0LHQpLGUuYmxvY2tfc3RhcnQ9ZS5zdHJzdGFydCxDKGUuc3RybSl9ZnVuY3Rpb24gTyhlLHQpe2UucGVuZGluZ19idWZbZS5wZW5kaW5nKytdPXR9ZnVuY3Rpb24gSShlLHQpe2UucGVuZGluZ19idWZbZS5wZW5kaW5nKytdPXQ+Pj44JjI1NSxlLnBlbmRpbmdfYnVmW2UucGVuZGluZysrXT0yNTUmdH1mdW5jdGlvbiBEKGUsdCl7dmFyIHIsbixpPWUubWF4X2NoYWluX2xlbmd0aCxzPWUuc3Ryc3RhcnQsbz1lLnByZXZfbGVuZ3RoLGE9ZS5uaWNlX21hdGNoLGY9ZS5zdHJzdGFydD5lLndfc2l6ZS1iP2Uuc3Ryc3RhcnQtKGUud19zaXplLWIpOjAsdT1lLndpbmRvdyxkPWUud19tYXNrLGg9ZS5wcmV2LGw9ZS5zdHJzdGFydCt5LGM9dVtzK28tMV0scD11W3Mrb107ZS5wcmV2X2xlbmd0aD49ZS5nb29kX21hdGNoJiYoaT4+PTIpLGE+ZS5sb29rYWhlYWQmJihhPWUubG9va2FoZWFkKTtkb3tpZih1WyhyPXQpK29dPT09cCYmdVtyK28tMV09PT1jJiZ1W3JdPT09dVtzXSYmdVsrK3JdPT09dVtzKzFdKXtzKz0yLHIrKztkb3t9d2hpbGUodVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnVbKytzXT09PXVbKytyXSYmdVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnVbKytzXT09PXVbKytyXSYmdVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnM8bCk7aWYobj15LShsLXMpLHM9bC15LG88bil7aWYoZS5tYXRjaF9zdGFydD10LGE8PShvPW4pKWJyZWFrO2M9dVtzK28tMV0scD11W3Mrb119fX13aGlsZSgodD1oW3QmZF0pPmYmJjAhPS0taSk7cmV0dXJuIG88PWUubG9va2FoZWFkP286ZS5sb29rYWhlYWR9ZnVuY3Rpb24gQihlKXt2YXIgdCxyLG4saSxzLG8sYSxmLHUsZCxoPWUud19zaXplO2Rve2lmKGk9ZS53aW5kb3dfc2l6ZS1lLmxvb2thaGVhZC1lLnN0cnN0YXJ0LGUuc3Ryc3RhcnQ+PWgrKGgtYikpe2ZvcihsLmFycmF5U2V0KGUud2luZG93LGUud2luZG93LGgsaCwwKSxlLm1hdGNoX3N0YXJ0LT1oLGUuc3Ryc3RhcnQtPWgsZS5ibG9ja19zdGFydC09aCx0PXI9ZS5oYXNoX3NpemU7bj1lLmhlYWRbLS10XSxlLmhlYWRbdF09aDw9bj9uLWg6MCwtLXI7KTtmb3IodD1yPWg7bj1lLnByZXZbLS10XSxlLnByZXZbdF09aDw9bj9uLWg6MCwtLXI7KTtpKz1ofWlmKDA9PT1lLnN0cm0uYXZhaWxfaW4pYnJlYWs7aWYobz1lLnN0cm0sYT1lLndpbmRvdyxmPWUuc3Ryc3RhcnQrZS5sb29rYWhlYWQsZD12b2lkIDAsKHU9aSk8KGQ9by5hdmFpbF9pbikmJihkPXUpLHI9MD09PWQ/MDooby5hdmFpbF9pbi09ZCxsLmFycmF5U2V0KGEsby5pbnB1dCxvLm5leHRfaW4sZCxmKSwxPT09by5zdGF0ZS53cmFwP28uYWRsZXI9YyhvLmFkbGVyLGEsZCxmKToyPT09by5zdGF0ZS53cmFwJiYoby5hZGxlcj1wKG8uYWRsZXIsYSxkLGYpKSxvLm5leHRfaW4rPWQsby50b3RhbF9pbis9ZCxkKSxlLmxvb2thaGVhZCs9cixlLmxvb2thaGVhZCtlLmluc2VydD49Zylmb3Iocz1lLnN0cnN0YXJ0LWUuaW5zZXJ0LGUuaW5zX2g9ZS53aW5kb3dbc10sZS5pbnNfaD0oZS5pbnNfaDw8ZS5oYXNoX3NoaWZ0XmUud2luZG93W3MrMV0pJmUuaGFzaF9tYXNrO2UuaW5zZXJ0JiYoZS5pbnNfaD0oZS5pbnNfaDw8ZS5oYXNoX3NoaWZ0XmUud2luZG93W3MrZy0xXSkmZS5oYXNoX21hc2ssZS5wcmV2W3MmZS53X21hc2tdPWUuaGVhZFtlLmluc19oXSxlLmhlYWRbZS5pbnNfaF09cyxzKyssZS5pbnNlcnQtLSwhKGUubG9va2FoZWFkK2UuaW5zZXJ0PGcpKTspO313aGlsZShlLmxvb2thaGVhZDxiJiYwIT09ZS5zdHJtLmF2YWlsX2luKX1mdW5jdGlvbiBUKGUsdCl7Zm9yKHZhciByLG47Oyl7aWYoZS5sb29rYWhlYWQ8Yil7aWYoQihlKSxlLmxvb2thaGVhZDxiJiZ0PT09ZClyZXR1cm4gMTtpZigwPT09ZS5sb29rYWhlYWQpYnJlYWt9aWYocj0wLGUubG9va2FoZWFkPj1nJiYoZS5pbnNfaD0oZS5pbnNfaDw8ZS5oYXNoX3NoaWZ0XmUud2luZG93W2Uuc3Ryc3RhcnQrZy0xXSkmZS5oYXNoX21hc2sscj1lLnByZXZbZS5zdHJzdGFydCZlLndfbWFza109ZS5oZWFkW2UuaW5zX2hdLGUuaGVhZFtlLmluc19oXT1lLnN0cnN0YXJ0KSwwIT09ciYmZS5zdHJzdGFydC1yPD1lLndfc2l6ZS1iJiYoZS5tYXRjaF9sZW5ndGg9RChlLHIpKSxlLm1hdGNoX2xlbmd0aD49ZylpZihuPXUuX3RyX3RhbGx5KGUsZS5zdHJzdGFydC1lLm1hdGNoX3N0YXJ0LGUubWF0Y2hfbGVuZ3RoLWcpLGUubG9va2FoZWFkLT1lLm1hdGNoX2xlbmd0aCxlLm1hdGNoX2xlbmd0aDw9ZS5tYXhfbGF6eV9tYXRjaCYmZS5sb29rYWhlYWQ+PWcpe2ZvcihlLm1hdGNoX2xlbmd0aC0tO2Uuc3Ryc3RhcnQrKyxlLmluc19oPShlLmluc19oPDxlLmhhc2hfc2hpZnReZS53aW5kb3dbZS5zdHJzdGFydCtnLTFdKSZlLmhhc2hfbWFzayxyPWUucHJldltlLnN0cnN0YXJ0JmUud19tYXNrXT1lLmhlYWRbZS5pbnNfaF0sZS5oZWFkW2UuaW5zX2hdPWUuc3Ryc3RhcnQsMCE9LS1lLm1hdGNoX2xlbmd0aDspO2Uuc3Ryc3RhcnQrK31lbHNlIGUuc3Ryc3RhcnQrPWUubWF0Y2hfbGVuZ3RoLGUubWF0Y2hfbGVuZ3RoPTAsZS5pbnNfaD1lLndpbmRvd1tlLnN0cnN0YXJ0XSxlLmluc19oPShlLmluc19oPDxlLmhhc2hfc2hpZnReZS53aW5kb3dbZS5zdHJzdGFydCsxXSkmZS5oYXNoX21hc2s7ZWxzZSBuPXUuX3RyX3RhbGx5KGUsMCxlLndpbmRvd1tlLnN0cnN0YXJ0XSksZS5sb29rYWhlYWQtLSxlLnN0cnN0YXJ0Kys7aWYobiYmKEEoZSwhMSksMD09PWUuc3RybS5hdmFpbF9vdXQpKXJldHVybiAxfXJldHVybiBlLmluc2VydD1lLnN0cnN0YXJ0PGctMT9lLnN0cnN0YXJ0OmctMSw0PT09dD8oQShlLCEwKSwwPT09ZS5zdHJtLmF2YWlsX291dD8zOjQpOmUubGFzdF9saXQmJihBKGUsITEpLDA9PT1lLnN0cm0uYXZhaWxfb3V0KT8xOjJ9ZnVuY3Rpb24gUihlLHQpe2Zvcih2YXIgcixuLGk7Oyl7aWYoZS5sb29rYWhlYWQ8Yil7aWYoQihlKSxlLmxvb2thaGVhZDxiJiZ0PT09ZClyZXR1cm4gMTtpZigwPT09ZS5sb29rYWhlYWQpYnJlYWt9aWYocj0wLGUubG9va2FoZWFkPj1nJiYoZS5pbnNfaD0oZS5pbnNfaDw8ZS5oYXNoX3NoaWZ0XmUud2luZG93W2Uuc3Ryc3RhcnQrZy0xXSkmZS5oYXNoX21hc2sscj1lLnByZXZbZS5zdHJzdGFydCZlLndfbWFza109ZS5oZWFkW2UuaW5zX2hdLGUuaGVhZFtlLmluc19oXT1lLnN0cnN0YXJ0KSxlLnByZXZfbGVuZ3RoPWUubWF0Y2hfbGVuZ3RoLGUucHJldl9tYXRjaD1lLm1hdGNoX3N0YXJ0LGUubWF0Y2hfbGVuZ3RoPWctMSwwIT09ciYmZS5wcmV2X2xlbmd0aDxlLm1heF9sYXp5X21hdGNoJiZlLnN0cnN0YXJ0LXI8PWUud19zaXplLWImJihlLm1hdGNoX2xlbmd0aD1EKGUsciksZS5tYXRjaF9sZW5ndGg8PTUmJigxPT09ZS5zdHJhdGVneXx8ZS5tYXRjaF9sZW5ndGg9PT1nJiY0MDk2PGUuc3Ryc3RhcnQtZS5tYXRjaF9zdGFydCkmJihlLm1hdGNoX2xlbmd0aD1nLTEpKSxlLnByZXZfbGVuZ3RoPj1nJiZlLm1hdGNoX2xlbmd0aDw9ZS5wcmV2X2xlbmd0aCl7Zm9yKGk9ZS5zdHJzdGFydCtlLmxvb2thaGVhZC1nLG49dS5fdHJfdGFsbHkoZSxlLnN0cnN0YXJ0LTEtZS5wcmV2X21hdGNoLGUucHJldl9sZW5ndGgtZyksZS5sb29rYWhlYWQtPWUucHJldl9sZW5ndGgtMSxlLnByZXZfbGVuZ3RoLT0yOysrZS5zdHJzdGFydDw9aSYmKGUuaW5zX2g9KGUuaW5zX2g8PGUuaGFzaF9zaGlmdF5lLndpbmRvd1tlLnN0cnN0YXJ0K2ctMV0pJmUuaGFzaF9tYXNrLHI9ZS5wcmV2W2Uuc3Ryc3RhcnQmZS53X21hc2tdPWUuaGVhZFtlLmluc19oXSxlLmhlYWRbZS5pbnNfaF09ZS5zdHJzdGFydCksMCE9LS1lLnByZXZfbGVuZ3RoOyk7aWYoZS5tYXRjaF9hdmFpbGFibGU9MCxlLm1hdGNoX2xlbmd0aD1nLTEsZS5zdHJzdGFydCsrLG4mJihBKGUsITEpLDA9PT1lLnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gMX1lbHNlIGlmKGUubWF0Y2hfYXZhaWxhYmxlKXtpZigobj11Ll90cl90YWxseShlLDAsZS53aW5kb3dbZS5zdHJzdGFydC0xXSkpJiZBKGUsITEpLGUuc3Ryc3RhcnQrKyxlLmxvb2thaGVhZC0tLDA9PT1lLnN0cm0uYXZhaWxfb3V0KXJldHVybiAxfWVsc2UgZS5tYXRjaF9hdmFpbGFibGU9MSxlLnN0cnN0YXJ0KyssZS5sb29rYWhlYWQtLX1yZXR1cm4gZS5tYXRjaF9hdmFpbGFibGUmJihuPXUuX3RyX3RhbGx5KGUsMCxlLndpbmRvd1tlLnN0cnN0YXJ0LTFdKSxlLm1hdGNoX2F2YWlsYWJsZT0wKSxlLmluc2VydD1lLnN0cnN0YXJ0PGctMT9lLnN0cnN0YXJ0OmctMSw0PT09dD8oQShlLCEwKSwwPT09ZS5zdHJtLmF2YWlsX291dD8zOjQpOmUubGFzdF9saXQmJihBKGUsITEpLDA9PT1lLnN0cm0uYXZhaWxfb3V0KT8xOjJ9ZnVuY3Rpb24gRihlLHQscixuLGkpe3RoaXMuZ29vZF9sZW5ndGg9ZSx0aGlzLm1heF9sYXp5PXQsdGhpcy5uaWNlX2xlbmd0aD1yLHRoaXMubWF4X2NoYWluPW4sdGhpcy5mdW5jPWl9ZnVuY3Rpb24gTigpe3RoaXMuc3RybT1udWxsLHRoaXMuc3RhdHVzPTAsdGhpcy5wZW5kaW5nX2J1Zj1udWxsLHRoaXMucGVuZGluZ19idWZfc2l6ZT0wLHRoaXMucGVuZGluZ19vdXQ9MCx0aGlzLnBlbmRpbmc9MCx0aGlzLndyYXA9MCx0aGlzLmd6aGVhZD1udWxsLHRoaXMuZ3ppbmRleD0wLHRoaXMubWV0aG9kPV8sdGhpcy5sYXN0X2ZsdXNoPS0xLHRoaXMud19zaXplPTAsdGhpcy53X2JpdHM9MCx0aGlzLndfbWFzaz0wLHRoaXMud2luZG93PW51bGwsdGhpcy53aW5kb3dfc2l6ZT0wLHRoaXMucHJldj1udWxsLHRoaXMuaGVhZD1udWxsLHRoaXMuaW5zX2g9MCx0aGlzLmhhc2hfc2l6ZT0wLHRoaXMuaGFzaF9iaXRzPTAsdGhpcy5oYXNoX21hc2s9MCx0aGlzLmhhc2hfc2hpZnQ9MCx0aGlzLmJsb2NrX3N0YXJ0PTAsdGhpcy5tYXRjaF9sZW5ndGg9MCx0aGlzLnByZXZfbWF0Y2g9MCx0aGlzLm1hdGNoX2F2YWlsYWJsZT0wLHRoaXMuc3Ryc3RhcnQ9MCx0aGlzLm1hdGNoX3N0YXJ0PTAsdGhpcy5sb29rYWhlYWQ9MCx0aGlzLnByZXZfbGVuZ3RoPTAsdGhpcy5tYXhfY2hhaW5fbGVuZ3RoPTAsdGhpcy5tYXhfbGF6eV9tYXRjaD0wLHRoaXMubGV2ZWw9MCx0aGlzLnN0cmF0ZWd5PTAsdGhpcy5nb29kX21hdGNoPTAsdGhpcy5uaWNlX21hdGNoPTAsdGhpcy5keW5fbHRyZWU9bmV3IGwuQnVmMTYoMip3KSx0aGlzLmR5bl9kdHJlZT1uZXcgbC5CdWYxNigyKigyKm8rMSkpLHRoaXMuYmxfdHJlZT1uZXcgbC5CdWYxNigyKigyKmErMSkpLHoodGhpcy5keW5fbHRyZWUpLHoodGhpcy5keW5fZHRyZWUpLHoodGhpcy5ibF90cmVlKSx0aGlzLmxfZGVzYz1udWxsLHRoaXMuZF9kZXNjPW51bGwsdGhpcy5ibF9kZXNjPW51bGwsdGhpcy5ibF9jb3VudD1uZXcgbC5CdWYxNih2KzEpLHRoaXMuaGVhcD1uZXcgbC5CdWYxNigyKnMrMSkseih0aGlzLmhlYXApLHRoaXMuaGVhcF9sZW49MCx0aGlzLmhlYXBfbWF4PTAsdGhpcy5kZXB0aD1uZXcgbC5CdWYxNigyKnMrMSkseih0aGlzLmRlcHRoKSx0aGlzLmxfYnVmPTAsdGhpcy5saXRfYnVmc2l6ZT0wLHRoaXMubGFzdF9saXQ9MCx0aGlzLmRfYnVmPTAsdGhpcy5vcHRfbGVuPTAsdGhpcy5zdGF0aWNfbGVuPTAsdGhpcy5tYXRjaGVzPTAsdGhpcy5pbnNlcnQ9MCx0aGlzLmJpX2J1Zj0wLHRoaXMuYmlfdmFsaWQ9MH1mdW5jdGlvbiBVKGUpe3ZhciB0O3JldHVybiBlJiZlLnN0YXRlPyhlLnRvdGFsX2luPWUudG90YWxfb3V0PTAsZS5kYXRhX3R5cGU9aSwodD1lLnN0YXRlKS5wZW5kaW5nPTAsdC5wZW5kaW5nX291dD0wLHQud3JhcDwwJiYodC53cmFwPS10LndyYXApLHQuc3RhdHVzPXQud3JhcD9rOngsZS5hZGxlcj0yPT09dC53cmFwPzA6MSx0Lmxhc3RfZmx1c2g9ZCx1Ll90cl9pbml0KHQpLGgpOlMoZSxtKX1mdW5jdGlvbiBMKGUpe3ZhciB0LHI9VShlKTtyZXR1cm4gcj09PWgmJigodD1lLnN0YXRlKS53aW5kb3dfc2l6ZT0yKnQud19zaXplLHoodC5oZWFkKSx0Lm1heF9sYXp5X21hdGNoPWZbdC5sZXZlbF0ubWF4X2xhenksdC5nb29kX21hdGNoPWZbdC5sZXZlbF0uZ29vZF9sZW5ndGgsdC5uaWNlX21hdGNoPWZbdC5sZXZlbF0ubmljZV9sZW5ndGgsdC5tYXhfY2hhaW5fbGVuZ3RoPWZbdC5sZXZlbF0ubWF4X2NoYWluLHQuc3Ryc3RhcnQ9MCx0LmJsb2NrX3N0YXJ0PTAsdC5sb29rYWhlYWQ9MCx0Lmluc2VydD0wLHQubWF0Y2hfbGVuZ3RoPXQucHJldl9sZW5ndGg9Zy0xLHQubWF0Y2hfYXZhaWxhYmxlPTAsdC5pbnNfaD0wKSxyfWZ1bmN0aW9uIFAoZSx0LHIsbixpLHMpe2lmKCFlKXJldHVybiBtO3ZhciBvPTE7aWYoLTE9PT10JiYodD02KSxuPDA/KG89MCxuPS1uKToxNTxuJiYobz0yLG4tPTE2KSxpPDF8fDk8aXx8ciE9PV98fG48OHx8MTU8bnx8dDwwfHw5PHR8fHM8MHx8NDxzKXJldHVybiBTKGUsbSk7OD09PW4mJihuPTkpO3ZhciBhPW5ldyBOO3JldHVybihlLnN0YXRlPWEpLnN0cm09ZSxhLndyYXA9byxhLmd6aGVhZD1udWxsLGEud19iaXRzPW4sYS53X3NpemU9MTw8YS53X2JpdHMsYS53X21hc2s9YS53X3NpemUtMSxhLmhhc2hfYml0cz1pKzcsYS5oYXNoX3NpemU9MTw8YS5oYXNoX2JpdHMsYS5oYXNoX21hc2s9YS5oYXNoX3NpemUtMSxhLmhhc2hfc2hpZnQ9fn4oKGEuaGFzaF9iaXRzK2ctMSkvZyksYS53aW5kb3c9bmV3IGwuQnVmOCgyKmEud19zaXplKSxhLmhlYWQ9bmV3IGwuQnVmMTYoYS5oYXNoX3NpemUpLGEucHJldj1uZXcgbC5CdWYxNihhLndfc2l6ZSksYS5saXRfYnVmc2l6ZT0xPDxpKzYsYS5wZW5kaW5nX2J1Zl9zaXplPTQqYS5saXRfYnVmc2l6ZSxhLnBlbmRpbmdfYnVmPW5ldyBsLkJ1ZjgoYS5wZW5kaW5nX2J1Zl9zaXplKSxhLmRfYnVmPTEqYS5saXRfYnVmc2l6ZSxhLmxfYnVmPTMqYS5saXRfYnVmc2l6ZSxhLmxldmVsPXQsYS5zdHJhdGVneT1zLGEubWV0aG9kPXIsTChlKX1mPVtuZXcgRigwLDAsMCwwLGZ1bmN0aW9uKGUsdCl7dmFyIHI9NjU1MzU7Zm9yKHI+ZS5wZW5kaW5nX2J1Zl9zaXplLTUmJihyPWUucGVuZGluZ19idWZfc2l6ZS01KTs7KXtpZihlLmxvb2thaGVhZDw9MSl7aWYoQihlKSwwPT09ZS5sb29rYWhlYWQmJnQ9PT1kKXJldHVybiAxO2lmKDA9PT1lLmxvb2thaGVhZClicmVha31lLnN0cnN0YXJ0Kz1lLmxvb2thaGVhZCxlLmxvb2thaGVhZD0wO3ZhciBuPWUuYmxvY2tfc3RhcnQrcjtpZigoMD09PWUuc3Ryc3RhcnR8fGUuc3Ryc3RhcnQ+PW4pJiYoZS5sb29rYWhlYWQ9ZS5zdHJzdGFydC1uLGUuc3Ryc3RhcnQ9bixBKGUsITEpLDA9PT1lLnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gMTtpZihlLnN0cnN0YXJ0LWUuYmxvY2tfc3RhcnQ+PWUud19zaXplLWImJihBKGUsITEpLDA9PT1lLnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gMX1yZXR1cm4gZS5pbnNlcnQ9MCw0PT09dD8oQShlLCEwKSwwPT09ZS5zdHJtLmF2YWlsX291dD8zOjQpOihlLnN0cnN0YXJ0PmUuYmxvY2tfc3RhcnQmJihBKGUsITEpLGUuc3RybS5hdmFpbF9vdXQpLDEpfSksbmV3IEYoNCw0LDgsNCxUKSxuZXcgRig0LDUsMTYsOCxUKSxuZXcgRig0LDYsMzIsMzIsVCksbmV3IEYoNCw0LDE2LDE2LFIpLG5ldyBGKDgsMTYsMzIsMzIsUiksbmV3IEYoOCwxNiwxMjgsMTI4LFIpLG5ldyBGKDgsMzIsMTI4LDI1NixSKSxuZXcgRigzMiwxMjgsMjU4LDEwMjQsUiksbmV3IEYoMzIsMjU4LDI1OCw0MDk2LFIpXSxyLmRlZmxhdGVJbml0PWZ1bmN0aW9uKGUsdCl7cmV0dXJuIFAoZSx0LF8sMTUsOCwwKX0sci5kZWZsYXRlSW5pdDI9UCxyLmRlZmxhdGVSZXNldD1MLHIuZGVmbGF0ZVJlc2V0S2VlcD1VLHIuZGVmbGF0ZVNldEhlYWRlcj1mdW5jdGlvbihlLHQpe3JldHVybiBlJiZlLnN0YXRlPzIhPT1lLnN0YXRlLndyYXA/bTooZS5zdGF0ZS5nemhlYWQ9dCxoKTptfSxyLmRlZmxhdGU9ZnVuY3Rpb24oZSx0KXt2YXIgcixuLGkscztpZighZXx8IWUuc3RhdGV8fDU8dHx8dDwwKXJldHVybiBlP1MoZSxtKTptO2lmKG49ZS5zdGF0ZSwhZS5vdXRwdXR8fCFlLmlucHV0JiYwIT09ZS5hdmFpbF9pbnx8NjY2PT09bi5zdGF0dXMmJjQhPT10KXJldHVybiBTKGUsMD09PWUuYXZhaWxfb3V0Py01Om0pO2lmKG4uc3RybT1lLHI9bi5sYXN0X2ZsdXNoLG4ubGFzdF9mbHVzaD10LG4uc3RhdHVzPT09aylpZigyPT09bi53cmFwKWUuYWRsZXI9MCxPKG4sMzEpLE8obiwxMzkpLE8obiw4KSxuLmd6aGVhZD8oTyhuLChuLmd6aGVhZC50ZXh0PzE6MCkrKG4uZ3poZWFkLmhjcmM/MjowKSsobi5nemhlYWQuZXh0cmE/NDowKSsobi5nemhlYWQubmFtZT84OjApKyhuLmd6aGVhZC5jb21tZW50PzE2OjApKSxPKG4sMjU1Jm4uZ3poZWFkLnRpbWUpLE8obixuLmd6aGVhZC50aW1lPj44JjI1NSksTyhuLG4uZ3poZWFkLnRpbWU+PjE2JjI1NSksTyhuLG4uZ3poZWFkLnRpbWU+PjI0JjI1NSksTyhuLDk9PT1uLmxldmVsPzI6Mjw9bi5zdHJhdGVneXx8bi5sZXZlbDwyPzQ6MCksTyhuLDI1NSZuLmd6aGVhZC5vcyksbi5nemhlYWQuZXh0cmEmJm4uZ3poZWFkLmV4dHJhLmxlbmd0aCYmKE8obiwyNTUmbi5nemhlYWQuZXh0cmEubGVuZ3RoKSxPKG4sbi5nemhlYWQuZXh0cmEubGVuZ3RoPj44JjI1NSkpLG4uZ3poZWFkLmhjcmMmJihlLmFkbGVyPXAoZS5hZGxlcixuLnBlbmRpbmdfYnVmLG4ucGVuZGluZywwKSksbi5nemluZGV4PTAsbi5zdGF0dXM9NjkpOihPKG4sMCksTyhuLDApLE8obiwwKSxPKG4sMCksTyhuLDApLE8obiw5PT09bi5sZXZlbD8yOjI8PW4uc3RyYXRlZ3l8fG4ubGV2ZWw8Mj80OjApLE8obiwzKSxuLnN0YXR1cz14KTtlbHNle3ZhciBvPV8rKG4ud19iaXRzLTg8PDQpPDw4O298PSgyPD1uLnN0cmF0ZWd5fHxuLmxldmVsPDI/MDpuLmxldmVsPDY/MTo2PT09bi5sZXZlbD8yOjMpPDw2LDAhPT1uLnN0cnN0YXJ0JiYob3w9MzIpLG8rPTMxLW8lMzEsbi5zdGF0dXM9eCxJKG4sbyksMCE9PW4uc3Ryc3RhcnQmJihJKG4sZS5hZGxlcj4+PjE2KSxJKG4sNjU1MzUmZS5hZGxlcikpLGUuYWRsZXI9MX1pZig2OT09PW4uc3RhdHVzKWlmKG4uZ3poZWFkLmV4dHJhKXtmb3IoaT1uLnBlbmRpbmc7bi5nemluZGV4PCg2NTUzNSZuLmd6aGVhZC5leHRyYS5sZW5ndGgpJiYobi5wZW5kaW5nIT09bi5wZW5kaW5nX2J1Zl9zaXplfHwobi5nemhlYWQuaGNyYyYmbi5wZW5kaW5nPmkmJihlLmFkbGVyPXAoZS5hZGxlcixuLnBlbmRpbmdfYnVmLG4ucGVuZGluZy1pLGkpKSxDKGUpLGk9bi5wZW5kaW5nLG4ucGVuZGluZyE9PW4ucGVuZGluZ19idWZfc2l6ZSkpOylPKG4sMjU1Jm4uZ3poZWFkLmV4dHJhW24uZ3ppbmRleF0pLG4uZ3ppbmRleCsrO24uZ3poZWFkLmhjcmMmJm4ucGVuZGluZz5pJiYoZS5hZGxlcj1wKGUuYWRsZXIsbi5wZW5kaW5nX2J1ZixuLnBlbmRpbmctaSxpKSksbi5nemluZGV4PT09bi5nemhlYWQuZXh0cmEubGVuZ3RoJiYobi5nemluZGV4PTAsbi5zdGF0dXM9NzMpfWVsc2Ugbi5zdGF0dXM9NzM7aWYoNzM9PT1uLnN0YXR1cylpZihuLmd6aGVhZC5uYW1lKXtpPW4ucGVuZGluZztkb3tpZihuLnBlbmRpbmc9PT1uLnBlbmRpbmdfYnVmX3NpemUmJihuLmd6aGVhZC5oY3JjJiZuLnBlbmRpbmc+aSYmKGUuYWRsZXI9cChlLmFkbGVyLG4ucGVuZGluZ19idWYsbi5wZW5kaW5nLWksaSkpLEMoZSksaT1uLnBlbmRpbmcsbi5wZW5kaW5nPT09bi5wZW5kaW5nX2J1Zl9zaXplKSl7cz0xO2JyZWFrfXM9bi5nemluZGV4PG4uZ3poZWFkLm5hbWUubGVuZ3RoPzI1NSZuLmd6aGVhZC5uYW1lLmNoYXJDb2RlQXQobi5nemluZGV4KyspOjAsTyhuLHMpfXdoaWxlKDAhPT1zKTtuLmd6aGVhZC5oY3JjJiZuLnBlbmRpbmc+aSYmKGUuYWRsZXI9cChlLmFkbGVyLG4ucGVuZGluZ19idWYsbi5wZW5kaW5nLWksaSkpLDA9PT1zJiYobi5nemluZGV4PTAsbi5zdGF0dXM9OTEpfWVsc2Ugbi5zdGF0dXM9OTE7aWYoOTE9PT1uLnN0YXR1cylpZihuLmd6aGVhZC5jb21tZW50KXtpPW4ucGVuZGluZztkb3tpZihuLnBlbmRpbmc9PT1uLnBlbmRpbmdfYnVmX3NpemUmJihuLmd6aGVhZC5oY3JjJiZuLnBlbmRpbmc+aSYmKGUuYWRsZXI9cChlLmFkbGVyLG4ucGVuZGluZ19idWYsbi5wZW5kaW5nLWksaSkpLEMoZSksaT1uLnBlbmRpbmcsbi5wZW5kaW5nPT09bi5wZW5kaW5nX2J1Zl9zaXplKSl7cz0xO2JyZWFrfXM9bi5nemluZGV4PG4uZ3poZWFkLmNvbW1lbnQubGVuZ3RoPzI1NSZuLmd6aGVhZC5jb21tZW50LmNoYXJDb2RlQXQobi5nemluZGV4KyspOjAsTyhuLHMpfXdoaWxlKDAhPT1zKTtuLmd6aGVhZC5oY3JjJiZuLnBlbmRpbmc+aSYmKGUuYWRsZXI9cChlLmFkbGVyLG4ucGVuZGluZ19idWYsbi5wZW5kaW5nLWksaSkpLDA9PT1zJiYobi5zdGF0dXM9MTAzKX1lbHNlIG4uc3RhdHVzPTEwMztpZigxMDM9PT1uLnN0YXR1cyYmKG4uZ3poZWFkLmhjcmM/KG4ucGVuZGluZysyPm4ucGVuZGluZ19idWZfc2l6ZSYmQyhlKSxuLnBlbmRpbmcrMjw9bi5wZW5kaW5nX2J1Zl9zaXplJiYoTyhuLDI1NSZlLmFkbGVyKSxPKG4sZS5hZGxlcj4+OCYyNTUpLGUuYWRsZXI9MCxuLnN0YXR1cz14KSk6bi5zdGF0dXM9eCksMCE9PW4ucGVuZGluZyl7aWYoQyhlKSwwPT09ZS5hdmFpbF9vdXQpcmV0dXJuIG4ubGFzdF9mbHVzaD0tMSxofWVsc2UgaWYoMD09PWUuYXZhaWxfaW4mJkUodCk8PUUocikmJjQhPT10KXJldHVybiBTKGUsLTUpO2lmKDY2Nj09PW4uc3RhdHVzJiYwIT09ZS5hdmFpbF9pbilyZXR1cm4gUyhlLC01KTtpZigwIT09ZS5hdmFpbF9pbnx8MCE9PW4ubG9va2FoZWFkfHx0IT09ZCYmNjY2IT09bi5zdGF0dXMpe3ZhciBhPTI9PT1uLnN0cmF0ZWd5P2Z1bmN0aW9uKGUsdCl7Zm9yKHZhciByOzspe2lmKDA9PT1lLmxvb2thaGVhZCYmKEIoZSksMD09PWUubG9va2FoZWFkKSl7aWYodD09PWQpcmV0dXJuIDE7YnJlYWt9aWYoZS5tYXRjaF9sZW5ndGg9MCxyPXUuX3RyX3RhbGx5KGUsMCxlLndpbmRvd1tlLnN0cnN0YXJ0XSksZS5sb29rYWhlYWQtLSxlLnN0cnN0YXJ0KyssciYmKEEoZSwhMSksMD09PWUuc3RybS5hdmFpbF9vdXQpKXJldHVybiAxfXJldHVybiBlLmluc2VydD0wLDQ9PT10PyhBKGUsITApLDA9PT1lLnN0cm0uYXZhaWxfb3V0PzM6NCk6ZS5sYXN0X2xpdCYmKEEoZSwhMSksMD09PWUuc3RybS5hdmFpbF9vdXQpPzE6Mn0obix0KTozPT09bi5zdHJhdGVneT9mdW5jdGlvbihlLHQpe2Zvcih2YXIgcixuLGkscyxvPWUud2luZG93Ozspe2lmKGUubG9va2FoZWFkPD15KXtpZihCKGUpLGUubG9va2FoZWFkPD15JiZ0PT09ZClyZXR1cm4gMTtpZigwPT09ZS5sb29rYWhlYWQpYnJlYWt9aWYoZS5tYXRjaF9sZW5ndGg9MCxlLmxvb2thaGVhZD49ZyYmMDxlLnN0cnN0YXJ0JiYobj1vW2k9ZS5zdHJzdGFydC0xXSk9PT1vWysraV0mJm49PT1vWysraV0mJm49PT1vWysraV0pe3M9ZS5zdHJzdGFydCt5O2Rve313aGlsZShuPT09b1srK2ldJiZuPT09b1srK2ldJiZuPT09b1srK2ldJiZuPT09b1srK2ldJiZuPT09b1srK2ldJiZuPT09b1srK2ldJiZuPT09b1srK2ldJiZuPT09b1srK2ldJiZpPHMpO2UubWF0Y2hfbGVuZ3RoPXktKHMtaSksZS5tYXRjaF9sZW5ndGg+ZS5sb29rYWhlYWQmJihlLm1hdGNoX2xlbmd0aD1lLmxvb2thaGVhZCl9aWYoZS5tYXRjaF9sZW5ndGg+PWc/KHI9dS5fdHJfdGFsbHkoZSwxLGUubWF0Y2hfbGVuZ3RoLWcpLGUubG9va2FoZWFkLT1lLm1hdGNoX2xlbmd0aCxlLnN0cnN0YXJ0Kz1lLm1hdGNoX2xlbmd0aCxlLm1hdGNoX2xlbmd0aD0wKToocj11Ll90cl90YWxseShlLDAsZS53aW5kb3dbZS5zdHJzdGFydF0pLGUubG9va2FoZWFkLS0sZS5zdHJzdGFydCsrKSxyJiYoQShlLCExKSwwPT09ZS5zdHJtLmF2YWlsX291dCkpcmV0dXJuIDF9cmV0dXJuIGUuaW5zZXJ0PTAsND09PXQ/KEEoZSwhMCksMD09PWUuc3RybS5hdmFpbF9vdXQ/Mzo0KTplLmxhc3RfbGl0JiYoQShlLCExKSwwPT09ZS5zdHJtLmF2YWlsX291dCk/MToyfShuLHQpOmZbbi5sZXZlbF0uZnVuYyhuLHQpO2lmKDMhPT1hJiY0IT09YXx8KG4uc3RhdHVzPTY2NiksMT09PWF8fDM9PT1hKXJldHVybiAwPT09ZS5hdmFpbF9vdXQmJihuLmxhc3RfZmx1c2g9LTEpLGg7aWYoMj09PWEmJigxPT09dD91Ll90cl9hbGlnbihuKTo1IT09dCYmKHUuX3RyX3N0b3JlZF9ibG9jayhuLDAsMCwhMSksMz09PXQmJih6KG4uaGVhZCksMD09PW4ubG9va2FoZWFkJiYobi5zdHJzdGFydD0wLG4uYmxvY2tfc3RhcnQ9MCxuLmluc2VydD0wKSkpLEMoZSksMD09PWUuYXZhaWxfb3V0KSlyZXR1cm4gbi5sYXN0X2ZsdXNoPS0xLGh9cmV0dXJuIDQhPT10P2g6bi53cmFwPD0wPzE6KDI9PT1uLndyYXA/KE8obiwyNTUmZS5hZGxlciksTyhuLGUuYWRsZXI+PjgmMjU1KSxPKG4sZS5hZGxlcj4+MTYmMjU1KSxPKG4sZS5hZGxlcj4+MjQmMjU1KSxPKG4sMjU1JmUudG90YWxfaW4pLE8obixlLnRvdGFsX2luPj44JjI1NSksTyhuLGUudG90YWxfaW4+PjE2JjI1NSksTyhuLGUudG90YWxfaW4+PjI0JjI1NSkpOihJKG4sZS5hZGxlcj4+PjE2KSxJKG4sNjU1MzUmZS5hZGxlcikpLEMoZSksMDxuLndyYXAmJihuLndyYXA9LW4ud3JhcCksMCE9PW4ucGVuZGluZz9oOjEpfSxyLmRlZmxhdGVFbmQ9ZnVuY3Rpb24oZSl7dmFyIHQ7cmV0dXJuIGUmJmUuc3RhdGU/KHQ9ZS5zdGF0ZS5zdGF0dXMpIT09ayYmNjkhPT10JiY3MyE9PXQmJjkxIT09dCYmMTAzIT09dCYmdCE9PXgmJjY2NiE9PXQ/UyhlLG0pOihlLnN0YXRlPW51bGwsdD09PXg/UyhlLC0zKTpoKTptfSxyLmRlZmxhdGVTZXREaWN0aW9uYXJ5PWZ1bmN0aW9uKGUsdCl7dmFyIHIsbixpLHMsbyxhLGYsdSxkPXQubGVuZ3RoO2lmKCFlfHwhZS5zdGF0ZSlyZXR1cm4gbTtpZigyPT09KHM9KHI9ZS5zdGF0ZSkud3JhcCl8fDE9PT1zJiZyLnN0YXR1cyE9PWt8fHIubG9va2FoZWFkKXJldHVybiBtO2ZvcigxPT09cyYmKGUuYWRsZXI9YyhlLmFkbGVyLHQsZCwwKSksci53cmFwPTAsZD49ci53X3NpemUmJigwPT09cyYmKHooci5oZWFkKSxyLnN0cnN0YXJ0PTAsci5ibG9ja19zdGFydD0wLHIuaW5zZXJ0PTApLHU9bmV3IGwuQnVmOChyLndfc2l6ZSksbC5hcnJheVNldCh1LHQsZC1yLndfc2l6ZSxyLndfc2l6ZSwwKSx0PXUsZD1yLndfc2l6ZSksbz1lLmF2YWlsX2luLGE9ZS5uZXh0X2luLGY9ZS5pbnB1dCxlLmF2YWlsX2luPWQsZS5uZXh0X2luPTAsZS5pbnB1dD10LEIocik7ci5sb29rYWhlYWQ+PWc7KXtmb3Iobj1yLnN0cnN0YXJ0LGk9ci5sb29rYWhlYWQtKGctMSk7ci5pbnNfaD0oci5pbnNfaDw8ci5oYXNoX3NoaWZ0XnIud2luZG93W24rZy0xXSkmci5oYXNoX21hc2ssci5wcmV2W24mci53X21hc2tdPXIuaGVhZFtyLmluc19oXSxyLmhlYWRbci5pbnNfaF09bixuKyssLS1pOyk7ci5zdHJzdGFydD1uLHIubG9va2FoZWFkPWctMSxCKHIpfXJldHVybiByLnN0cnN0YXJ0Kz1yLmxvb2thaGVhZCxyLmJsb2NrX3N0YXJ0PXIuc3Ryc3RhcnQsci5pbnNlcnQ9ci5sb29rYWhlYWQsci5sb29rYWhlYWQ9MCxyLm1hdGNoX2xlbmd0aD1yLnByZXZfbGVuZ3RoPWctMSxyLm1hdGNoX2F2YWlsYWJsZT0wLGUubmV4dF9pbj1hLGUuaW5wdXQ9ZixlLmF2YWlsX2luPW8sci53cmFwPXMsaH0sci5kZWZsYXRlSW5mbz1cInBha28gZGVmbGF0ZSAoZnJvbSBOb2RlY2EgcHJvamVjdClcIn0se1wiLi4vdXRpbHMvY29tbW9uXCI6NDEsXCIuL2FkbGVyMzJcIjo0MyxcIi4vY3JjMzJcIjo0NSxcIi4vbWVzc2FnZXNcIjo1MSxcIi4vdHJlZXNcIjo1Mn1dLDQ3OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dC5leHBvcnRzPWZ1bmN0aW9uKCl7dGhpcy50ZXh0PTAsdGhpcy50aW1lPTAsdGhpcy54ZmxhZ3M9MCx0aGlzLm9zPTAsdGhpcy5leHRyYT1udWxsLHRoaXMuZXh0cmFfbGVuPTAsdGhpcy5uYW1lPVwiXCIsdGhpcy5jb21tZW50PVwiXCIsdGhpcy5oY3JjPTAsdGhpcy5kb25lPSExfX0se31dLDQ4OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dC5leHBvcnRzPWZ1bmN0aW9uKGUsdCl7dmFyIHIsbixpLHMsbyxhLGYsdSxkLGgsbCxjLHAsbSxfLHcsdixnLHksYixrLHgsUyxFLHo7cj1lLnN0YXRlLG49ZS5uZXh0X2luLEU9ZS5pbnB1dCxpPW4rKGUuYXZhaWxfaW4tNSkscz1lLm5leHRfb3V0LHo9ZS5vdXRwdXQsbz1zLSh0LWUuYXZhaWxfb3V0KSxhPXMrKGUuYXZhaWxfb3V0LTI1NyksZj1yLmRtYXgsdT1yLndzaXplLGQ9ci53aGF2ZSxoPXIud25leHQsbD1yLndpbmRvdyxjPXIuaG9sZCxwPXIuYml0cyxtPXIubGVuY29kZSxfPXIuZGlzdGNvZGUsdz0oMTw8ci5sZW5iaXRzKS0xLHY9KDE8PHIuZGlzdGJpdHMpLTE7ZTpkb3twPDE1JiYoYys9RVtuKytdPDxwLHArPTgsYys9RVtuKytdPDxwLHArPTgpLGc9bVtjJnddO3Q6Zm9yKDs7KXtpZihjPj4+PXk9Zz4+PjI0LHAtPXksMD09KHk9Zz4+PjE2JjI1NSkpeltzKytdPTY1NTM1Jmc7ZWxzZXtpZighKDE2JnkpKXtpZigwPT0oNjQmeSkpe2c9bVsoNjU1MzUmZykrKGMmKDE8PHkpLTEpXTtjb250aW51ZSB0fWlmKDMyJnkpe3IubW9kZT0xMjticmVhayBlfWUubXNnPVwiaW52YWxpZCBsaXRlcmFsL2xlbmd0aCBjb2RlXCIsci5tb2RlPTMwO2JyZWFrIGV9Yj02NTUzNSZnLCh5Jj0xNSkmJihwPHkmJihjKz1FW24rK108PHAscCs9OCksYis9YyYoMTw8eSktMSxjPj4+PXkscC09eSkscDwxNSYmKGMrPUVbbisrXTw8cCxwKz04LGMrPUVbbisrXTw8cCxwKz04KSxnPV9bYyZ2XTtyOmZvcig7Oyl7aWYoYz4+Pj15PWc+Pj4yNCxwLT15LCEoMTYmKHk9Zz4+PjE2JjI1NSkpKXtpZigwPT0oNjQmeSkpe2c9X1soNjU1MzUmZykrKGMmKDE8PHkpLTEpXTtjb250aW51ZSByfWUubXNnPVwiaW52YWxpZCBkaXN0YW5jZSBjb2RlXCIsci5tb2RlPTMwO2JyZWFrIGV9aWYoaz02NTUzNSZnLHA8KHkmPTE1KSYmKGMrPUVbbisrXTw8cCwocCs9OCk8eSYmKGMrPUVbbisrXTw8cCxwKz04KSksZjwoays9YyYoMTw8eSktMSkpe2UubXNnPVwiaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2tcIixyLm1vZGU9MzA7YnJlYWsgZX1pZihjPj4+PXkscC09eSwoeT1zLW8pPGspe2lmKGQ8KHk9ay15KSYmci5zYW5lKXtlLm1zZz1cImludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrXCIsci5tb2RlPTMwO2JyZWFrIGV9aWYoUz1sLCh4PTApPT09aCl7aWYoeCs9dS15LHk8Yil7Zm9yKGItPXk7eltzKytdPWxbeCsrXSwtLXk7KTt4PXMtayxTPXp9fWVsc2UgaWYoaDx5KXtpZih4Kz11K2gteSwoeS09aCk8Yil7Zm9yKGItPXk7eltzKytdPWxbeCsrXSwtLXk7KTtpZih4PTAsaDxiKXtmb3IoYi09eT1oO3pbcysrXT1sW3grK10sLS15Oyk7eD1zLWssUz16fX19ZWxzZSBpZih4Kz1oLXkseTxiKXtmb3IoYi09eTt6W3MrK109bFt4KytdLC0teTspO3g9cy1rLFM9en1mb3IoOzI8YjspeltzKytdPVNbeCsrXSx6W3MrK109U1t4KytdLHpbcysrXT1TW3grK10sYi09MztiJiYoeltzKytdPVNbeCsrXSwxPGImJih6W3MrK109U1t4KytdKSl9ZWxzZXtmb3IoeD1zLWs7eltzKytdPXpbeCsrXSx6W3MrK109elt4KytdLHpbcysrXT16W3grK10sMjwoYi09Myk7KTtiJiYoeltzKytdPXpbeCsrXSwxPGImJih6W3MrK109elt4KytdKSl9YnJlYWt9fWJyZWFrfX13aGlsZShuPGkmJnM8YSk7bi09Yj1wPj4zLGMmPSgxPDwocC09Yjw8MykpLTEsZS5uZXh0X2luPW4sZS5uZXh0X291dD1zLGUuYXZhaWxfaW49bjxpP2ktbis1OjUtKG4taSksZS5hdmFpbF9vdXQ9czxhP2EtcysyNTc6MjU3LShzLWEpLHIuaG9sZD1jLHIuYml0cz1wfX0se31dLDQ5OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIE89ZShcIi4uL3V0aWxzL2NvbW1vblwiKSxJPWUoXCIuL2FkbGVyMzJcIiksRD1lKFwiLi9jcmMzMlwiKSxCPWUoXCIuL2luZmZhc3RcIiksVD1lKFwiLi9pbmZ0cmVlc1wiKSxSPTEsRj0yLE49MCxVPS0yLEw9MSxuPTg1MixpPTU5MjtmdW5jdGlvbiBQKGUpe3JldHVybihlPj4+MjQmMjU1KSsoZT4+PjgmNjUyODApKygoNjUyODAmZSk8PDgpKygoMjU1JmUpPDwyNCl9ZnVuY3Rpb24gcygpe3RoaXMubW9kZT0wLHRoaXMubGFzdD0hMSx0aGlzLndyYXA9MCx0aGlzLmhhdmVkaWN0PSExLHRoaXMuZmxhZ3M9MCx0aGlzLmRtYXg9MCx0aGlzLmNoZWNrPTAsdGhpcy50b3RhbD0wLHRoaXMuaGVhZD1udWxsLHRoaXMud2JpdHM9MCx0aGlzLndzaXplPTAsdGhpcy53aGF2ZT0wLHRoaXMud25leHQ9MCx0aGlzLndpbmRvdz1udWxsLHRoaXMuaG9sZD0wLHRoaXMuYml0cz0wLHRoaXMubGVuZ3RoPTAsdGhpcy5vZmZzZXQ9MCx0aGlzLmV4dHJhPTAsdGhpcy5sZW5jb2RlPW51bGwsdGhpcy5kaXN0Y29kZT1udWxsLHRoaXMubGVuYml0cz0wLHRoaXMuZGlzdGJpdHM9MCx0aGlzLm5jb2RlPTAsdGhpcy5ubGVuPTAsdGhpcy5uZGlzdD0wLHRoaXMuaGF2ZT0wLHRoaXMubmV4dD1udWxsLHRoaXMubGVucz1uZXcgTy5CdWYxNigzMjApLHRoaXMud29yaz1uZXcgTy5CdWYxNigyODgpLHRoaXMubGVuZHluPW51bGwsdGhpcy5kaXN0ZHluPW51bGwsdGhpcy5zYW5lPTAsdGhpcy5iYWNrPTAsdGhpcy53YXM9MH1mdW5jdGlvbiBvKGUpe3ZhciB0O3JldHVybiBlJiZlLnN0YXRlPyh0PWUuc3RhdGUsZS50b3RhbF9pbj1lLnRvdGFsX291dD10LnRvdGFsPTAsZS5tc2c9XCJcIix0LndyYXAmJihlLmFkbGVyPTEmdC53cmFwKSx0Lm1vZGU9TCx0Lmxhc3Q9MCx0LmhhdmVkaWN0PTAsdC5kbWF4PTMyNzY4LHQuaGVhZD1udWxsLHQuaG9sZD0wLHQuYml0cz0wLHQubGVuY29kZT10LmxlbmR5bj1uZXcgTy5CdWYzMihuKSx0LmRpc3Rjb2RlPXQuZGlzdGR5bj1uZXcgTy5CdWYzMihpKSx0LnNhbmU9MSx0LmJhY2s9LTEsTik6VX1mdW5jdGlvbiBhKGUpe3ZhciB0O3JldHVybiBlJiZlLnN0YXRlPygodD1lLnN0YXRlKS53c2l6ZT0wLHQud2hhdmU9MCx0LnduZXh0PTAsbyhlKSk6VX1mdW5jdGlvbiBmKGUsdCl7dmFyIHIsbjtyZXR1cm4gZSYmZS5zdGF0ZT8obj1lLnN0YXRlLHQ8MD8ocj0wLHQ9LXQpOihyPTErKHQ+PjQpLHQ8NDgmJih0Jj0xNSkpLHQmJih0PDh8fDE1PHQpP1U6KG51bGwhPT1uLndpbmRvdyYmbi53Yml0cyE9PXQmJihuLndpbmRvdz1udWxsKSxuLndyYXA9cixuLndiaXRzPXQsYShlKSkpOlV9ZnVuY3Rpb24gdShlLHQpe3ZhciByLG47cmV0dXJuIGU/KG49bmV3IHMsKGUuc3RhdGU9bikud2luZG93PW51bGwsKHI9ZihlLHQpKSE9PU4mJihlLnN0YXRlPW51bGwpLHIpOlV9dmFyIGQsaCxsPSEwO2Z1bmN0aW9uIGooZSl7aWYobCl7dmFyIHQ7Zm9yKGQ9bmV3IE8uQnVmMzIoNTEyKSxoPW5ldyBPLkJ1ZjMyKDMyKSx0PTA7dDwxNDQ7KWUubGVuc1t0KytdPTg7Zm9yKDt0PDI1NjspZS5sZW5zW3QrK109OTtmb3IoO3Q8MjgwOyllLmxlbnNbdCsrXT03O2Zvcig7dDwyODg7KWUubGVuc1t0KytdPTg7Zm9yKFQoUixlLmxlbnMsMCwyODgsZCwwLGUud29yayx7Yml0czo5fSksdD0wO3Q8MzI7KWUubGVuc1t0KytdPTU7VChGLGUubGVucywwLDMyLGgsMCxlLndvcmsse2JpdHM6NX0pLGw9ITF9ZS5sZW5jb2RlPWQsZS5sZW5iaXRzPTksZS5kaXN0Y29kZT1oLGUuZGlzdGJpdHM9NX1mdW5jdGlvbiBaKGUsdCxyLG4pe3ZhciBpLHM9ZS5zdGF0ZTtyZXR1cm4gbnVsbD09PXMud2luZG93JiYocy53c2l6ZT0xPDxzLndiaXRzLHMud25leHQ9MCxzLndoYXZlPTAscy53aW5kb3c9bmV3IE8uQnVmOChzLndzaXplKSksbj49cy53c2l6ZT8oTy5hcnJheVNldChzLndpbmRvdyx0LHItcy53c2l6ZSxzLndzaXplLDApLHMud25leHQ9MCxzLndoYXZlPXMud3NpemUpOihuPChpPXMud3NpemUtcy53bmV4dCkmJihpPW4pLE8uYXJyYXlTZXQocy53aW5kb3csdCxyLW4saSxzLnduZXh0KSwobi09aSk/KE8uYXJyYXlTZXQocy53aW5kb3csdCxyLW4sbiwwKSxzLnduZXh0PW4scy53aGF2ZT1zLndzaXplKToocy53bmV4dCs9aSxzLnduZXh0PT09cy53c2l6ZSYmKHMud25leHQ9MCkscy53aGF2ZTxzLndzaXplJiYocy53aGF2ZSs9aSkpKSwwfXIuaW5mbGF0ZVJlc2V0PWEsci5pbmZsYXRlUmVzZXQyPWYsci5pbmZsYXRlUmVzZXRLZWVwPW8sci5pbmZsYXRlSW5pdD1mdW5jdGlvbihlKXtyZXR1cm4gdShlLDE1KX0sci5pbmZsYXRlSW5pdDI9dSxyLmluZmxhdGU9ZnVuY3Rpb24oZSx0KXt2YXIgcixuLGkscyxvLGEsZix1LGQsaCxsLGMscCxtLF8sdyx2LGcseSxiLGsseCxTLEUsej0wLEM9bmV3IE8uQnVmOCg0KSxBPVsxNiwxNywxOCwwLDgsNyw5LDYsMTAsNSwxMSw0LDEyLDMsMTMsMiwxNCwxLDE1XTtpZighZXx8IWUuc3RhdGV8fCFlLm91dHB1dHx8IWUuaW5wdXQmJjAhPT1lLmF2YWlsX2luKXJldHVybiBVOzEyPT09KHI9ZS5zdGF0ZSkubW9kZSYmKHIubW9kZT0xMyksbz1lLm5leHRfb3V0LGk9ZS5vdXRwdXQsZj1lLmF2YWlsX291dCxzPWUubmV4dF9pbixuPWUuaW5wdXQsYT1lLmF2YWlsX2luLHU9ci5ob2xkLGQ9ci5iaXRzLGg9YSxsPWYseD1OO2U6Zm9yKDs7KXN3aXRjaChyLm1vZGUpe2Nhc2UgTDppZigwPT09ci53cmFwKXtyLm1vZGU9MTM7YnJlYWt9Zm9yKDtkPDE2Oyl7aWYoMD09PWEpYnJlYWsgZTthLS0sdSs9bltzKytdPDxkLGQrPTh9aWYoMiZyLndyYXAmJjM1NjE1PT09dSl7Q1tyLmNoZWNrPTBdPTI1NSZ1LENbMV09dT4+PjgmMjU1LHIuY2hlY2s9RChyLmNoZWNrLEMsMiwwKSxkPXU9MCxyLm1vZGU9MjticmVha31pZihyLmZsYWdzPTAsci5oZWFkJiYoci5oZWFkLmRvbmU9ITEpLCEoMSZyLndyYXApfHwoKCgyNTUmdSk8PDgpKyh1Pj44KSklMzEpe2UubXNnPVwiaW5jb3JyZWN0IGhlYWRlciBjaGVja1wiLHIubW9kZT0zMDticmVha31pZig4IT0oMTUmdSkpe2UubXNnPVwidW5rbm93biBjb21wcmVzc2lvbiBtZXRob2RcIixyLm1vZGU9MzA7YnJlYWt9aWYoZC09NCxrPTgrKDE1Jih1Pj4+PTQpKSwwPT09ci53Yml0cylyLndiaXRzPWs7ZWxzZSBpZihrPnIud2JpdHMpe2UubXNnPVwiaW52YWxpZCB3aW5kb3cgc2l6ZVwiLHIubW9kZT0zMDticmVha31yLmRtYXg9MTw8ayxlLmFkbGVyPXIuY2hlY2s9MSxyLm1vZGU9NTEyJnU/MTA6MTIsZD11PTA7YnJlYWs7Y2FzZSAyOmZvcig7ZDwxNjspe2lmKDA9PT1hKWJyZWFrIGU7YS0tLHUrPW5bcysrXTw8ZCxkKz04fWlmKHIuZmxhZ3M9dSw4IT0oMjU1JnIuZmxhZ3MpKXtlLm1zZz1cInVua25vd24gY29tcHJlc3Npb24gbWV0aG9kXCIsci5tb2RlPTMwO2JyZWFrfWlmKDU3MzQ0JnIuZmxhZ3Mpe2UubXNnPVwidW5rbm93biBoZWFkZXIgZmxhZ3Mgc2V0XCIsci5tb2RlPTMwO2JyZWFrfXIuaGVhZCYmKHIuaGVhZC50ZXh0PXU+PjgmMSksNTEyJnIuZmxhZ3MmJihDWzBdPTI1NSZ1LENbMV09dT4+PjgmMjU1LHIuY2hlY2s9RChyLmNoZWNrLEMsMiwwKSksZD11PTAsci5tb2RlPTM7Y2FzZSAzOmZvcig7ZDwzMjspe2lmKDA9PT1hKWJyZWFrIGU7YS0tLHUrPW5bcysrXTw8ZCxkKz04fXIuaGVhZCYmKHIuaGVhZC50aW1lPXUpLDUxMiZyLmZsYWdzJiYoQ1swXT0yNTUmdSxDWzFdPXU+Pj44JjI1NSxDWzJdPXU+Pj4xNiYyNTUsQ1szXT11Pj4+MjQmMjU1LHIuY2hlY2s9RChyLmNoZWNrLEMsNCwwKSksZD11PTAsci5tb2RlPTQ7Y2FzZSA0OmZvcig7ZDwxNjspe2lmKDA9PT1hKWJyZWFrIGU7YS0tLHUrPW5bcysrXTw8ZCxkKz04fXIuaGVhZCYmKHIuaGVhZC54ZmxhZ3M9MjU1JnUsci5oZWFkLm9zPXU+PjgpLDUxMiZyLmZsYWdzJiYoQ1swXT0yNTUmdSxDWzFdPXU+Pj44JjI1NSxyLmNoZWNrPUQoci5jaGVjayxDLDIsMCkpLGQ9dT0wLHIubW9kZT01O2Nhc2UgNTppZigxMDI0JnIuZmxhZ3Mpe2Zvcig7ZDwxNjspe2lmKDA9PT1hKWJyZWFrIGU7YS0tLHUrPW5bcysrXTw8ZCxkKz04fXIubGVuZ3RoPXUsci5oZWFkJiYoci5oZWFkLmV4dHJhX2xlbj11KSw1MTImci5mbGFncyYmKENbMF09MjU1JnUsQ1sxXT11Pj4+OCYyNTUsci5jaGVjaz1EKHIuY2hlY2ssQywyLDApKSxkPXU9MH1lbHNlIHIuaGVhZCYmKHIuaGVhZC5leHRyYT1udWxsKTtyLm1vZGU9NjtjYXNlIDY6aWYoMTAyNCZyLmZsYWdzJiYoYTwoYz1yLmxlbmd0aCkmJihjPWEpLGMmJihyLmhlYWQmJihrPXIuaGVhZC5leHRyYV9sZW4tci5sZW5ndGgsci5oZWFkLmV4dHJhfHwoci5oZWFkLmV4dHJhPW5ldyBBcnJheShyLmhlYWQuZXh0cmFfbGVuKSksTy5hcnJheVNldChyLmhlYWQuZXh0cmEsbixzLGMsaykpLDUxMiZyLmZsYWdzJiYoci5jaGVjaz1EKHIuY2hlY2ssbixjLHMpKSxhLT1jLHMrPWMsci5sZW5ndGgtPWMpLHIubGVuZ3RoKSlicmVhayBlO3IubGVuZ3RoPTAsci5tb2RlPTc7Y2FzZSA3OmlmKDIwNDgmci5mbGFncyl7aWYoMD09PWEpYnJlYWsgZTtmb3IoYz0wO2s9bltzK2MrK10sci5oZWFkJiZrJiZyLmxlbmd0aDw2NTUzNiYmKHIuaGVhZC5uYW1lKz1TdHJpbmcuZnJvbUNoYXJDb2RlKGspKSxrJiZjPGE7KTtpZig1MTImci5mbGFncyYmKHIuY2hlY2s9RChyLmNoZWNrLG4sYyxzKSksYS09YyxzKz1jLGspYnJlYWsgZX1lbHNlIHIuaGVhZCYmKHIuaGVhZC5uYW1lPW51bGwpO3IubGVuZ3RoPTAsci5tb2RlPTg7Y2FzZSA4OmlmKDQwOTYmci5mbGFncyl7aWYoMD09PWEpYnJlYWsgZTtmb3IoYz0wO2s9bltzK2MrK10sci5oZWFkJiZrJiZyLmxlbmd0aDw2NTUzNiYmKHIuaGVhZC5jb21tZW50Kz1TdHJpbmcuZnJvbUNoYXJDb2RlKGspKSxrJiZjPGE7KTtpZig1MTImci5mbGFncyYmKHIuY2hlY2s9RChyLmNoZWNrLG4sYyxzKSksYS09YyxzKz1jLGspYnJlYWsgZX1lbHNlIHIuaGVhZCYmKHIuaGVhZC5jb21tZW50PW51bGwpO3IubW9kZT05O2Nhc2UgOTppZig1MTImci5mbGFncyl7Zm9yKDtkPDE2Oyl7aWYoMD09PWEpYnJlYWsgZTthLS0sdSs9bltzKytdPDxkLGQrPTh9aWYodSE9PSg2NTUzNSZyLmNoZWNrKSl7ZS5tc2c9XCJoZWFkZXIgY3JjIG1pc21hdGNoXCIsci5tb2RlPTMwO2JyZWFrfWQ9dT0wfXIuaGVhZCYmKHIuaGVhZC5oY3JjPXIuZmxhZ3M+PjkmMSxyLmhlYWQuZG9uZT0hMCksZS5hZGxlcj1yLmNoZWNrPTAsci5tb2RlPTEyO2JyZWFrO2Nhc2UgMTA6Zm9yKDtkPDMyOyl7aWYoMD09PWEpYnJlYWsgZTthLS0sdSs9bltzKytdPDxkLGQrPTh9ZS5hZGxlcj1yLmNoZWNrPVAodSksZD11PTAsci5tb2RlPTExO2Nhc2UgMTE6aWYoMD09PXIuaGF2ZWRpY3QpcmV0dXJuIGUubmV4dF9vdXQ9byxlLmF2YWlsX291dD1mLGUubmV4dF9pbj1zLGUuYXZhaWxfaW49YSxyLmhvbGQ9dSxyLmJpdHM9ZCwyO2UuYWRsZXI9ci5jaGVjaz0xLHIubW9kZT0xMjtjYXNlIDEyOmlmKDU9PT10fHw2PT09dClicmVhayBlO2Nhc2UgMTM6aWYoci5sYXN0KXt1Pj4+PTcmZCxkLT03JmQsci5tb2RlPTI3O2JyZWFrfWZvcig7ZDwzOyl7aWYoMD09PWEpYnJlYWsgZTthLS0sdSs9bltzKytdPDxkLGQrPTh9c3dpdGNoKHIubGFzdD0xJnUsZC09MSwzJih1Pj4+PTEpKXtjYXNlIDA6ci5tb2RlPTE0O2JyZWFrO2Nhc2UgMTppZihqKHIpLHIubW9kZT0yMCw2IT09dClicmVhazt1Pj4+PTIsZC09MjticmVhayBlO2Nhc2UgMjpyLm1vZGU9MTc7YnJlYWs7Y2FzZSAzOmUubXNnPVwiaW52YWxpZCBibG9jayB0eXBlXCIsci5tb2RlPTMwfXU+Pj49MixkLT0yO2JyZWFrO2Nhc2UgMTQ6Zm9yKHU+Pj49NyZkLGQtPTcmZDtkPDMyOyl7aWYoMD09PWEpYnJlYWsgZTthLS0sdSs9bltzKytdPDxkLGQrPTh9aWYoKDY1NTM1JnUpIT0odT4+PjE2XjY1NTM1KSl7ZS5tc2c9XCJpbnZhbGlkIHN0b3JlZCBibG9jayBsZW5ndGhzXCIsci5tb2RlPTMwO2JyZWFrfWlmKHIubGVuZ3RoPTY1NTM1JnUsZD11PTAsci5tb2RlPTE1LDY9PT10KWJyZWFrIGU7Y2FzZSAxNTpyLm1vZGU9MTY7Y2FzZSAxNjppZihjPXIubGVuZ3RoKXtpZihhPGMmJihjPWEpLGY8YyYmKGM9ZiksMD09PWMpYnJlYWsgZTtPLmFycmF5U2V0KGksbixzLGMsbyksYS09YyxzKz1jLGYtPWMsbys9YyxyLmxlbmd0aC09YzticmVha31yLm1vZGU9MTI7YnJlYWs7Y2FzZSAxNzpmb3IoO2Q8MTQ7KXtpZigwPT09YSlicmVhayBlO2EtLSx1Kz1uW3MrK108PGQsZCs9OH1pZihyLm5sZW49MjU3KygzMSZ1KSx1Pj4+PTUsZC09NSxyLm5kaXN0PTErKDMxJnUpLHU+Pj49NSxkLT01LHIubmNvZGU9NCsoMTUmdSksdT4+Pj00LGQtPTQsMjg2PHIubmxlbnx8MzA8ci5uZGlzdCl7ZS5tc2c9XCJ0b28gbWFueSBsZW5ndGggb3IgZGlzdGFuY2Ugc3ltYm9sc1wiLHIubW9kZT0zMDticmVha31yLmhhdmU9MCxyLm1vZGU9MTg7Y2FzZSAxODpmb3IoO3IuaGF2ZTxyLm5jb2RlOyl7Zm9yKDtkPDM7KXtpZigwPT09YSlicmVhayBlO2EtLSx1Kz1uW3MrK108PGQsZCs9OH1yLmxlbnNbQVtyLmhhdmUrK11dPTcmdSx1Pj4+PTMsZC09M31mb3IoO3IuaGF2ZTwxOTspci5sZW5zW0Fbci5oYXZlKytdXT0wO2lmKHIubGVuY29kZT1yLmxlbmR5bixyLmxlbmJpdHM9NyxTPXtiaXRzOnIubGVuYml0c30seD1UKDAsci5sZW5zLDAsMTksci5sZW5jb2RlLDAsci53b3JrLFMpLHIubGVuYml0cz1TLmJpdHMseCl7ZS5tc2c9XCJpbnZhbGlkIGNvZGUgbGVuZ3RocyBzZXRcIixyLm1vZGU9MzA7YnJlYWt9ci5oYXZlPTAsci5tb2RlPTE5O2Nhc2UgMTk6Zm9yKDtyLmhhdmU8ci5ubGVuK3IubmRpc3Q7KXtmb3IoO3c9KHo9ci5sZW5jb2RlW3UmKDE8PHIubGVuYml0cyktMV0pPj4+MTYmMjU1LHY9NjU1MzUmeiwhKChfPXo+Pj4yNCk8PWQpOyl7aWYoMD09PWEpYnJlYWsgZTthLS0sdSs9bltzKytdPDxkLGQrPTh9aWYodjwxNil1Pj4+PV8sZC09XyxyLmxlbnNbci5oYXZlKytdPXY7ZWxzZXtpZigxNj09PXYpe2ZvcihFPV8rMjtkPEU7KXtpZigwPT09YSlicmVhayBlO2EtLSx1Kz1uW3MrK108PGQsZCs9OH1pZih1Pj4+PV8sZC09XywwPT09ci5oYXZlKXtlLm1zZz1cImludmFsaWQgYml0IGxlbmd0aCByZXBlYXRcIixyLm1vZGU9MzA7YnJlYWt9az1yLmxlbnNbci5oYXZlLTFdLGM9MysoMyZ1KSx1Pj4+PTIsZC09Mn1lbHNlIGlmKDE3PT09dil7Zm9yKEU9XyszO2Q8RTspe2lmKDA9PT1hKWJyZWFrIGU7YS0tLHUrPW5bcysrXTw8ZCxkKz04fWQtPV8saz0wLGM9MysoNyYodT4+Pj1fKSksdT4+Pj0zLGQtPTN9ZWxzZXtmb3IoRT1fKzc7ZDxFOyl7aWYoMD09PWEpYnJlYWsgZTthLS0sdSs9bltzKytdPDxkLGQrPTh9ZC09XyxrPTAsYz0xMSsoMTI3Jih1Pj4+PV8pKSx1Pj4+PTcsZC09N31pZihyLmhhdmUrYz5yLm5sZW4rci5uZGlzdCl7ZS5tc2c9XCJpbnZhbGlkIGJpdCBsZW5ndGggcmVwZWF0XCIsci5tb2RlPTMwO2JyZWFrfWZvcig7Yy0tOylyLmxlbnNbci5oYXZlKytdPWt9fWlmKDMwPT09ci5tb2RlKWJyZWFrO2lmKDA9PT1yLmxlbnNbMjU2XSl7ZS5tc2c9XCJpbnZhbGlkIGNvZGUgLS0gbWlzc2luZyBlbmQtb2YtYmxvY2tcIixyLm1vZGU9MzA7YnJlYWt9aWYoci5sZW5iaXRzPTksUz17Yml0czpyLmxlbmJpdHN9LHg9VChSLHIubGVucywwLHIubmxlbixyLmxlbmNvZGUsMCxyLndvcmssUyksci5sZW5iaXRzPVMuYml0cyx4KXtlLm1zZz1cImludmFsaWQgbGl0ZXJhbC9sZW5ndGhzIHNldFwiLHIubW9kZT0zMDticmVha31pZihyLmRpc3RiaXRzPTYsci5kaXN0Y29kZT1yLmRpc3RkeW4sUz17Yml0czpyLmRpc3RiaXRzfSx4PVQoRixyLmxlbnMsci5ubGVuLHIubmRpc3Qsci5kaXN0Y29kZSwwLHIud29yayxTKSxyLmRpc3RiaXRzPVMuYml0cyx4KXtlLm1zZz1cImludmFsaWQgZGlzdGFuY2VzIHNldFwiLHIubW9kZT0zMDticmVha31pZihyLm1vZGU9MjAsNj09PXQpYnJlYWsgZTtjYXNlIDIwOnIubW9kZT0yMTtjYXNlIDIxOmlmKDY8PWEmJjI1ODw9Zil7ZS5uZXh0X291dD1vLGUuYXZhaWxfb3V0PWYsZS5uZXh0X2luPXMsZS5hdmFpbF9pbj1hLHIuaG9sZD11LHIuYml0cz1kLEIoZSxsKSxvPWUubmV4dF9vdXQsaT1lLm91dHB1dCxmPWUuYXZhaWxfb3V0LHM9ZS5uZXh0X2luLG49ZS5pbnB1dCxhPWUuYXZhaWxfaW4sdT1yLmhvbGQsZD1yLmJpdHMsMTI9PT1yLm1vZGUmJihyLmJhY2s9LTEpO2JyZWFrfWZvcihyLmJhY2s9MDt3PSh6PXIubGVuY29kZVt1JigxPDxyLmxlbmJpdHMpLTFdKT4+PjE2JjI1NSx2PTY1NTM1JnosISgoXz16Pj4+MjQpPD1kKTspe2lmKDA9PT1hKWJyZWFrIGU7YS0tLHUrPW5bcysrXTw8ZCxkKz04fWlmKHcmJjA9PSgyNDAmdykpe2ZvcihnPV8seT13LGI9djt3PSh6PXIubGVuY29kZVtiKygodSYoMTw8Zyt5KS0xKT4+ZyldKT4+PjE2JjI1NSx2PTY1NTM1JnosIShnKyhfPXo+Pj4yNCk8PWQpOyl7aWYoMD09PWEpYnJlYWsgZTthLS0sdSs9bltzKytdPDxkLGQrPTh9dT4+Pj1nLGQtPWcsci5iYWNrKz1nfWlmKHU+Pj49XyxkLT1fLHIuYmFjays9XyxyLmxlbmd0aD12LDA9PT13KXtyLm1vZGU9MjY7YnJlYWt9aWYoMzImdyl7ci5iYWNrPS0xLHIubW9kZT0xMjticmVha31pZig2NCZ3KXtlLm1zZz1cImludmFsaWQgbGl0ZXJhbC9sZW5ndGggY29kZVwiLHIubW9kZT0zMDticmVha31yLmV4dHJhPTE1Jncsci5tb2RlPTIyO2Nhc2UgMjI6aWYoci5leHRyYSl7Zm9yKEU9ci5leHRyYTtkPEU7KXtpZigwPT09YSlicmVhayBlO2EtLSx1Kz1uW3MrK108PGQsZCs9OH1yLmxlbmd0aCs9dSYoMTw8ci5leHRyYSktMSx1Pj4+PXIuZXh0cmEsZC09ci5leHRyYSxyLmJhY2srPXIuZXh0cmF9ci53YXM9ci5sZW5ndGgsci5tb2RlPTIzO2Nhc2UgMjM6Zm9yKDt3PSh6PXIuZGlzdGNvZGVbdSYoMTw8ci5kaXN0Yml0cyktMV0pPj4+MTYmMjU1LHY9NjU1MzUmeiwhKChfPXo+Pj4yNCk8PWQpOyl7aWYoMD09PWEpYnJlYWsgZTthLS0sdSs9bltzKytdPDxkLGQrPTh9aWYoMD09KDI0MCZ3KSl7Zm9yKGc9Xyx5PXcsYj12O3c9KHo9ci5kaXN0Y29kZVtiKygodSYoMTw8Zyt5KS0xKT4+ZyldKT4+PjE2JjI1NSx2PTY1NTM1JnosIShnKyhfPXo+Pj4yNCk8PWQpOyl7aWYoMD09PWEpYnJlYWsgZTthLS0sdSs9bltzKytdPDxkLGQrPTh9dT4+Pj1nLGQtPWcsci5iYWNrKz1nfWlmKHU+Pj49XyxkLT1fLHIuYmFjays9Xyw2NCZ3KXtlLm1zZz1cImludmFsaWQgZGlzdGFuY2UgY29kZVwiLHIubW9kZT0zMDticmVha31yLm9mZnNldD12LHIuZXh0cmE9MTUmdyxyLm1vZGU9MjQ7Y2FzZSAyNDppZihyLmV4dHJhKXtmb3IoRT1yLmV4dHJhO2Q8RTspe2lmKDA9PT1hKWJyZWFrIGU7YS0tLHUrPW5bcysrXTw8ZCxkKz04fXIub2Zmc2V0Kz11JigxPDxyLmV4dHJhKS0xLHU+Pj49ci5leHRyYSxkLT1yLmV4dHJhLHIuYmFjays9ci5leHRyYX1pZihyLm9mZnNldD5yLmRtYXgpe2UubXNnPVwiaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2tcIixyLm1vZGU9MzA7YnJlYWt9ci5tb2RlPTI1O2Nhc2UgMjU6aWYoMD09PWYpYnJlYWsgZTtpZihjPWwtZixyLm9mZnNldD5jKXtpZigoYz1yLm9mZnNldC1jKT5yLndoYXZlJiZyLnNhbmUpe2UubXNnPVwiaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2tcIixyLm1vZGU9MzA7YnJlYWt9cD1jPnIud25leHQ/KGMtPXIud25leHQsci53c2l6ZS1jKTpyLnduZXh0LWMsYz5yLmxlbmd0aCYmKGM9ci5sZW5ndGgpLG09ci53aW5kb3d9ZWxzZSBtPWkscD1vLXIub2Zmc2V0LGM9ci5sZW5ndGg7Zm9yKGY8YyYmKGM9ZiksZi09YyxyLmxlbmd0aC09YztpW28rK109bVtwKytdLC0tYzspOzA9PT1yLmxlbmd0aCYmKHIubW9kZT0yMSk7YnJlYWs7Y2FzZSAyNjppZigwPT09ZilicmVhayBlO2lbbysrXT1yLmxlbmd0aCxmLS0sci5tb2RlPTIxO2JyZWFrO2Nhc2UgMjc6aWYoci53cmFwKXtmb3IoO2Q8MzI7KXtpZigwPT09YSlicmVhayBlO2EtLSx1fD1uW3MrK108PGQsZCs9OH1pZihsLT1mLGUudG90YWxfb3V0Kz1sLHIudG90YWwrPWwsbCYmKGUuYWRsZXI9ci5jaGVjaz1yLmZsYWdzP0Qoci5jaGVjayxpLGwsby1sKTpJKHIuY2hlY2ssaSxsLG8tbCkpLGw9Ziwoci5mbGFncz91OlAodSkpIT09ci5jaGVjayl7ZS5tc2c9XCJpbmNvcnJlY3QgZGF0YSBjaGVja1wiLHIubW9kZT0zMDticmVha31kPXU9MH1yLm1vZGU9Mjg7Y2FzZSAyODppZihyLndyYXAmJnIuZmxhZ3Mpe2Zvcig7ZDwzMjspe2lmKDA9PT1hKWJyZWFrIGU7YS0tLHUrPW5bcysrXTw8ZCxkKz04fWlmKHUhPT0oNDI5NDk2NzI5NSZyLnRvdGFsKSl7ZS5tc2c9XCJpbmNvcnJlY3QgbGVuZ3RoIGNoZWNrXCIsci5tb2RlPTMwO2JyZWFrfWQ9dT0wfXIubW9kZT0yOTtjYXNlIDI5Ong9MTticmVhayBlO2Nhc2UgMzA6eD0tMzticmVhayBlO2Nhc2UgMzE6cmV0dXJuLTQ7Y2FzZSAzMjpkZWZhdWx0OnJldHVybiBVfXJldHVybiBlLm5leHRfb3V0PW8sZS5hdmFpbF9vdXQ9ZixlLm5leHRfaW49cyxlLmF2YWlsX2luPWEsci5ob2xkPXUsci5iaXRzPWQsKHIud3NpemV8fGwhPT1lLmF2YWlsX291dCYmci5tb2RlPDMwJiYoci5tb2RlPDI3fHw0IT09dCkpJiZaKGUsZS5vdXRwdXQsZS5uZXh0X291dCxsLWUuYXZhaWxfb3V0KT8oci5tb2RlPTMxLC00KTooaC09ZS5hdmFpbF9pbixsLT1lLmF2YWlsX291dCxlLnRvdGFsX2luKz1oLGUudG90YWxfb3V0Kz1sLHIudG90YWwrPWwsci53cmFwJiZsJiYoZS5hZGxlcj1yLmNoZWNrPXIuZmxhZ3M/RChyLmNoZWNrLGksbCxlLm5leHRfb3V0LWwpOkkoci5jaGVjayxpLGwsZS5uZXh0X291dC1sKSksZS5kYXRhX3R5cGU9ci5iaXRzKyhyLmxhc3Q/NjQ6MCkrKDEyPT09ci5tb2RlPzEyODowKSsoMjA9PT1yLm1vZGV8fDE1PT09ci5tb2RlPzI1NjowKSwoMD09aCYmMD09PWx8fDQ9PT10KSYmeD09PU4mJih4PS01KSx4KX0sci5pbmZsYXRlRW5kPWZ1bmN0aW9uKGUpe2lmKCFlfHwhZS5zdGF0ZSlyZXR1cm4gVTt2YXIgdD1lLnN0YXRlO3JldHVybiB0LndpbmRvdyYmKHQud2luZG93PW51bGwpLGUuc3RhdGU9bnVsbCxOfSxyLmluZmxhdGVHZXRIZWFkZXI9ZnVuY3Rpb24oZSx0KXt2YXIgcjtyZXR1cm4gZSYmZS5zdGF0ZT8wPT0oMiYocj1lLnN0YXRlKS53cmFwKT9VOigoci5oZWFkPXQpLmRvbmU9ITEsTik6VX0sci5pbmZsYXRlU2V0RGljdGlvbmFyeT1mdW5jdGlvbihlLHQpe3ZhciByLG49dC5sZW5ndGg7cmV0dXJuIGUmJmUuc3RhdGU/MCE9PShyPWUuc3RhdGUpLndyYXAmJjExIT09ci5tb2RlP1U6MTE9PT1yLm1vZGUmJkkoMSx0LG4sMCkhPT1yLmNoZWNrPy0zOlooZSx0LG4sbik/KHIubW9kZT0zMSwtNCk6KHIuaGF2ZWRpY3Q9MSxOKTpVfSxyLmluZmxhdGVJbmZvPVwicGFrbyBpbmZsYXRlIChmcm9tIE5vZGVjYSBwcm9qZWN0KVwifSx7XCIuLi91dGlscy9jb21tb25cIjo0MSxcIi4vYWRsZXIzMlwiOjQzLFwiLi9jcmMzMlwiOjQ1LFwiLi9pbmZmYXN0XCI6NDgsXCIuL2luZnRyZWVzXCI6NTB9XSw1MDpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3ZhciBSPWUoXCIuLi91dGlscy9jb21tb25cIiksRj1bMyw0LDUsNiw3LDgsOSwxMCwxMSwxMywxNSwxNywxOSwyMywyNywzMSwzNSw0Myw1MSw1OSw2Nyw4Myw5OSwxMTUsMTMxLDE2MywxOTUsMjI3LDI1OCwwLDBdLE49WzE2LDE2LDE2LDE2LDE2LDE2LDE2LDE2LDE3LDE3LDE3LDE3LDE4LDE4LDE4LDE4LDE5LDE5LDE5LDE5LDIwLDIwLDIwLDIwLDIxLDIxLDIxLDIxLDE2LDcyLDc4XSxVPVsxLDIsMyw0LDUsNyw5LDEzLDE3LDI1LDMzLDQ5LDY1LDk3LDEyOSwxOTMsMjU3LDM4NSw1MTMsNzY5LDEwMjUsMTUzNywyMDQ5LDMwNzMsNDA5Nyw2MTQ1LDgxOTMsMTIyODksMTYzODUsMjQ1NzcsMCwwXSxMPVsxNiwxNiwxNiwxNiwxNywxNywxOCwxOCwxOSwxOSwyMCwyMCwyMSwyMSwyMiwyMiwyMywyMywyNCwyNCwyNSwyNSwyNiwyNiwyNywyNywyOCwyOCwyOSwyOSw2NCw2NF07dC5leHBvcnRzPWZ1bmN0aW9uKGUsdCxyLG4saSxzLG8sYSl7dmFyIGYsdSxkLGgsbCxjLHAsbSxfLHc9YS5iaXRzLHY9MCxnPTAseT0wLGI9MCxrPTAseD0wLFM9MCxFPTAsej0wLEM9MCxBPW51bGwsTz0wLEk9bmV3IFIuQnVmMTYoMTYpLEQ9bmV3IFIuQnVmMTYoMTYpLEI9bnVsbCxUPTA7Zm9yKHY9MDt2PD0xNTt2KyspSVt2XT0wO2ZvcihnPTA7ZzxuO2crKylJW3RbcitnXV0rKztmb3Ioaz13LGI9MTU7MTw9YiYmMD09PUlbYl07Yi0tKTtpZihiPGsmJihrPWIpLDA9PT1iKXJldHVybiBpW3MrK109MjA5NzE1MjAsaVtzKytdPTIwOTcxNTIwLGEuYml0cz0xLDA7Zm9yKHk9MTt5PGImJjA9PT1JW3ldO3krKyk7Zm9yKGs8eSYmKGs9eSksdj1FPTE7djw9MTU7disrKWlmKEU8PD0xLChFLT1JW3ZdKTwwKXJldHVybi0xO2lmKDA8RSYmKDA9PT1lfHwxIT09YikpcmV0dXJuLTE7Zm9yKERbMV09MCx2PTE7djwxNTt2KyspRFt2KzFdPURbdl0rSVt2XTtmb3IoZz0wO2c8bjtnKyspMCE9PXRbcitnXSYmKG9bRFt0W3IrZ11dKytdPWcpO2lmKGM9MD09PWU/KEE9Qj1vLDE5KToxPT09ZT8oQT1GLE8tPTI1NyxCPU4sVC09MjU3LDI1Nik6KEE9VSxCPUwsLTEpLHY9eSxsPXMsUz1nPUM9MCxkPS0xLGg9KHo9MTw8KHg9aykpLTEsMT09PWUmJjg1Mjx6fHwyPT09ZSYmNTkyPHopcmV0dXJuIDE7Zm9yKDs7KXtmb3IocD12LVMsXz1vW2ddPGM/KG09MCxvW2ddKTpvW2ddPmM/KG09QltUK29bZ11dLEFbTytvW2ddXSk6KG09OTYsMCksZj0xPDx2LVMseT11PTE8PHg7aVtsKyhDPj5TKSsodS09ZildPXA8PDI0fG08PDE2fF98MCwwIT09dTspO2ZvcihmPTE8PHYtMTtDJmY7KWY+Pj0xO2lmKDAhPT1mPyhDJj1mLTEsQys9Zik6Qz0wLGcrKywwPT0tLUlbdl0pe2lmKHY9PT1iKWJyZWFrO3Y9dFtyK29bZ11dfWlmKGs8diYmKEMmaCkhPT1kKXtmb3IoMD09PVMmJihTPWspLGwrPXksRT0xPDwoeD12LVMpO3grUzxiJiYhKChFLT1JW3grU10pPD0wKTspeCsrLEU8PD0xO2lmKHorPTE8PHgsMT09PWUmJjg1Mjx6fHwyPT09ZSYmNTkyPHopcmV0dXJuIDE7aVtkPUMmaF09azw8MjR8eDw8MTZ8bC1zfDB9fXJldHVybiAwIT09QyYmKGlbbCtDXT12LVM8PDI0fDY0PDwxNnwwKSxhLmJpdHM9aywwfX0se1wiLi4vdXRpbHMvY29tbW9uXCI6NDF9XSw1MTpbZnVuY3Rpb24oZSx0LHIpe1widXNlIHN0cmljdFwiO3QuZXhwb3J0cz17MjpcIm5lZWQgZGljdGlvbmFyeVwiLDE6XCJzdHJlYW0gZW5kXCIsMDpcIlwiLFwiLTFcIjpcImZpbGUgZXJyb3JcIixcIi0yXCI6XCJzdHJlYW0gZXJyb3JcIixcIi0zXCI6XCJkYXRhIGVycm9yXCIsXCItNFwiOlwiaW5zdWZmaWNpZW50IG1lbW9yeVwiLFwiLTVcIjpcImJ1ZmZlciBlcnJvclwiLFwiLTZcIjpcImluY29tcGF0aWJsZSB2ZXJzaW9uXCJ9fSx7fV0sNTI6W2Z1bmN0aW9uKGUsdCxyKXtcInVzZSBzdHJpY3RcIjt2YXIgYT1lKFwiLi4vdXRpbHMvY29tbW9uXCIpO2Z1bmN0aW9uIG4oZSl7Zm9yKHZhciB0PWUubGVuZ3RoOzA8PS0tdDspZVt0XT0wfXZhciBfPTE1LGk9MTYsZj1bMCwwLDAsMCwwLDAsMCwwLDEsMSwxLDEsMiwyLDIsMiwzLDMsMywzLDQsNCw0LDQsNSw1LDUsNSwwXSx1PVswLDAsMCwwLDEsMSwyLDIsMywzLDQsNCw1LDUsNiw2LDcsNyw4LDgsOSw5LDEwLDEwLDExLDExLDEyLDEyLDEzLDEzXSxvPVswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDIsMyw3XSxkPVsxNiwxNywxOCwwLDgsNyw5LDYsMTAsNSwxMSw0LDEyLDMsMTMsMiwxNCwxLDE1XSxoPW5ldyBBcnJheSg1NzYpO24oaCk7dmFyIGw9bmV3IEFycmF5KDYwKTtuKGwpO3ZhciBjPW5ldyBBcnJheSg1MTIpO24oYyk7dmFyIHA9bmV3IEFycmF5KDI1Nik7bihwKTt2YXIgbT1uZXcgQXJyYXkoMjkpO24obSk7dmFyIHcsdixnLHk9bmV3IEFycmF5KDMwKTtmdW5jdGlvbiBiKGUsdCxyLG4saSl7dGhpcy5zdGF0aWNfdHJlZT1lLHRoaXMuZXh0cmFfYml0cz10LHRoaXMuZXh0cmFfYmFzZT1yLHRoaXMuZWxlbXM9bix0aGlzLm1heF9sZW5ndGg9aSx0aGlzLmhhc19zdHJlZT1lJiZlLmxlbmd0aH1mdW5jdGlvbiBzKGUsdCl7dGhpcy5keW5fdHJlZT1lLHRoaXMubWF4X2NvZGU9MCx0aGlzLnN0YXRfZGVzYz10fWZ1bmN0aW9uIGsoZSl7cmV0dXJuIGU8MjU2P2NbZV06Y1syNTYrKGU+Pj43KV19ZnVuY3Rpb24geChlLHQpe2UucGVuZGluZ19idWZbZS5wZW5kaW5nKytdPTI1NSZ0LGUucGVuZGluZ19idWZbZS5wZW5kaW5nKytdPXQ+Pj44JjI1NX1mdW5jdGlvbiBTKGUsdCxyKXtlLmJpX3ZhbGlkPmktcj8oZS5iaV9idWZ8PXQ8PGUuYmlfdmFsaWQmNjU1MzUseChlLGUuYmlfYnVmKSxlLmJpX2J1Zj10Pj5pLWUuYmlfdmFsaWQsZS5iaV92YWxpZCs9ci1pKTooZS5iaV9idWZ8PXQ8PGUuYmlfdmFsaWQmNjU1MzUsZS5iaV92YWxpZCs9cil9ZnVuY3Rpb24gRShlLHQscil7UyhlLHJbMip0XSxyWzIqdCsxXSl9ZnVuY3Rpb24geihlLHQpe2Zvcih2YXIgcj0wO3J8PTEmZSxlPj4+PTEscjw8PTEsMDwtLXQ7KTtyZXR1cm4gcj4+PjF9ZnVuY3Rpb24gQyhlLHQscil7dmFyIG4saSxzPW5ldyBBcnJheShfKzEpLG89MDtmb3Iobj0xO248PV87bisrKXNbbl09bz1vK3Jbbi0xXTw8MTtmb3IoaT0wO2k8PXQ7aSsrKXt2YXIgYT1lWzIqaSsxXTswIT09YSYmKGVbMippXT16KHNbYV0rKyxhKSl9fWZ1bmN0aW9uIEEoZSl7dmFyIHQ7Zm9yKHQ9MDt0PDI4Njt0KyspZS5keW5fbHRyZWVbMip0XT0wO2Zvcih0PTA7dDwzMDt0KyspZS5keW5fZHRyZWVbMip0XT0wO2Zvcih0PTA7dDwxOTt0KyspZS5ibF90cmVlWzIqdF09MDtlLmR5bl9sdHJlZVs1MTJdPTEsZS5vcHRfbGVuPWUuc3RhdGljX2xlbj0wLGUubGFzdF9saXQ9ZS5tYXRjaGVzPTB9ZnVuY3Rpb24gTyhlKXs4PGUuYmlfdmFsaWQ/eChlLGUuYmlfYnVmKTowPGUuYmlfdmFsaWQmJihlLnBlbmRpbmdfYnVmW2UucGVuZGluZysrXT1lLmJpX2J1ZiksZS5iaV9idWY9MCxlLmJpX3ZhbGlkPTB9ZnVuY3Rpb24gSShlLHQscixuKXt2YXIgaT0yKnQscz0yKnI7cmV0dXJuIGVbaV08ZVtzXXx8ZVtpXT09PWVbc10mJm5bdF08PW5bcl19ZnVuY3Rpb24gRChlLHQscil7Zm9yKHZhciBuPWUuaGVhcFtyXSxpPXI8PDE7aTw9ZS5oZWFwX2xlbiYmKGk8ZS5oZWFwX2xlbiYmSSh0LGUuaGVhcFtpKzFdLGUuaGVhcFtpXSxlLmRlcHRoKSYmaSsrLCFJKHQsbixlLmhlYXBbaV0sZS5kZXB0aCkpOyllLmhlYXBbcl09ZS5oZWFwW2ldLHI9aSxpPDw9MTtlLmhlYXBbcl09bn1mdW5jdGlvbiBCKGUsdCxyKXt2YXIgbixpLHMsbyxhPTA7aWYoMCE9PWUubGFzdF9saXQpZm9yKDtuPWUucGVuZGluZ19idWZbZS5kX2J1ZisyKmFdPDw4fGUucGVuZGluZ19idWZbZS5kX2J1ZisyKmErMV0saT1lLnBlbmRpbmdfYnVmW2UubF9idWYrYV0sYSsrLDA9PT1uP0UoZSxpLHQpOihFKGUsKHM9cFtpXSkrMjU2KzEsdCksMCE9PShvPWZbc10pJiZTKGUsaS09bVtzXSxvKSxFKGUscz1rKC0tbiksciksMCE9PShvPXVbc10pJiZTKGUsbi09eVtzXSxvKSksYTxlLmxhc3RfbGl0Oyk7RShlLDI1Nix0KX1mdW5jdGlvbiBUKGUsdCl7dmFyIHIsbixpLHM9dC5keW5fdHJlZSxvPXQuc3RhdF9kZXNjLnN0YXRpY190cmVlLGE9dC5zdGF0X2Rlc2MuaGFzX3N0cmVlLGY9dC5zdGF0X2Rlc2MuZWxlbXMsdT0tMTtmb3IoZS5oZWFwX2xlbj0wLGUuaGVhcF9tYXg9NTczLHI9MDtyPGY7cisrKTAhPT1zWzIqcl0/KGUuaGVhcFsrK2UuaGVhcF9sZW5dPXU9cixlLmRlcHRoW3JdPTApOnNbMipyKzFdPTA7Zm9yKDtlLmhlYXBfbGVuPDI7KXNbMiooaT1lLmhlYXBbKytlLmhlYXBfbGVuXT11PDI/Kyt1OjApXT0xLGUuZGVwdGhbaV09MCxlLm9wdF9sZW4tLSxhJiYoZS5zdGF0aWNfbGVuLT1vWzIqaSsxXSk7Zm9yKHQubWF4X2NvZGU9dSxyPWUuaGVhcF9sZW4+PjE7MTw9cjtyLS0pRChlLHMscik7Zm9yKGk9ZjtyPWUuaGVhcFsxXSxlLmhlYXBbMV09ZS5oZWFwW2UuaGVhcF9sZW4tLV0sRChlLHMsMSksbj1lLmhlYXBbMV0sZS5oZWFwWy0tZS5oZWFwX21heF09cixlLmhlYXBbLS1lLmhlYXBfbWF4XT1uLHNbMippXT1zWzIqcl0rc1syKm5dLGUuZGVwdGhbaV09KGUuZGVwdGhbcl0+PWUuZGVwdGhbbl0/ZS5kZXB0aFtyXTplLmRlcHRoW25dKSsxLHNbMipyKzFdPXNbMipuKzFdPWksZS5oZWFwWzFdPWkrKyxEKGUscywxKSwyPD1lLmhlYXBfbGVuOyk7ZS5oZWFwWy0tZS5oZWFwX21heF09ZS5oZWFwWzFdLGZ1bmN0aW9uKGUsdCl7dmFyIHIsbixpLHMsbyxhLGY9dC5keW5fdHJlZSx1PXQubWF4X2NvZGUsZD10LnN0YXRfZGVzYy5zdGF0aWNfdHJlZSxoPXQuc3RhdF9kZXNjLmhhc19zdHJlZSxsPXQuc3RhdF9kZXNjLmV4dHJhX2JpdHMsYz10LnN0YXRfZGVzYy5leHRyYV9iYXNlLHA9dC5zdGF0X2Rlc2MubWF4X2xlbmd0aCxtPTA7Zm9yKHM9MDtzPD1fO3MrKyllLmJsX2NvdW50W3NdPTA7Zm9yKGZbMiplLmhlYXBbZS5oZWFwX21heF0rMV09MCxyPWUuaGVhcF9tYXgrMTtyPDU3MztyKyspcDwocz1mWzIqZlsyKihuPWUuaGVhcFtyXSkrMV0rMV0rMSkmJihzPXAsbSsrKSxmWzIqbisxXT1zLHU8bnx8KGUuYmxfY291bnRbc10rKyxvPTAsYzw9biYmKG89bFtuLWNdKSxhPWZbMipuXSxlLm9wdF9sZW4rPWEqKHMrbyksaCYmKGUuc3RhdGljX2xlbis9YSooZFsyKm4rMV0rbykpKTtpZigwIT09bSl7ZG97Zm9yKHM9cC0xOzA9PT1lLmJsX2NvdW50W3NdOylzLS07ZS5ibF9jb3VudFtzXS0tLGUuYmxfY291bnRbcysxXSs9MixlLmJsX2NvdW50W3BdLS0sbS09Mn13aGlsZSgwPG0pO2ZvcihzPXA7MCE9PXM7cy0tKWZvcihuPWUuYmxfY291bnRbc107MCE9PW47KXU8KGk9ZS5oZWFwWy0tcl0pfHwoZlsyKmkrMV0hPT1zJiYoZS5vcHRfbGVuKz0ocy1mWzIqaSsxXSkqZlsyKmldLGZbMippKzFdPXMpLG4tLSl9fShlLHQpLEMocyx1LGUuYmxfY291bnQpfWZ1bmN0aW9uIFIoZSx0LHIpe3ZhciBuLGkscz0tMSxvPXRbMV0sYT0wLGY9Nyx1PTQ7Zm9yKDA9PT1vJiYoZj0xMzgsdT0zKSx0WzIqKHIrMSkrMV09NjU1MzUsbj0wO248PXI7bisrKWk9byxvPXRbMioobisxKSsxXSwrK2E8ZiYmaT09PW98fChhPHU/ZS5ibF90cmVlWzIqaV0rPWE6MCE9PWk/KGkhPT1zJiZlLmJsX3RyZWVbMippXSsrLGUuYmxfdHJlZVszMl0rKyk6YTw9MTA/ZS5ibF90cmVlWzM0XSsrOmUuYmxfdHJlZVszNl0rKyxzPWksdT0oYT0wKT09PW8/KGY9MTM4LDMpOmk9PT1vPyhmPTYsMyk6KGY9Nyw0KSl9ZnVuY3Rpb24gRihlLHQscil7dmFyIG4saSxzPS0xLG89dFsxXSxhPTAsZj03LHU9NDtmb3IoMD09PW8mJihmPTEzOCx1PTMpLG49MDtuPD1yO24rKylpZihpPW8sbz10WzIqKG4rMSkrMV0sISgrK2E8ZiYmaT09PW8pKXtpZihhPHUpZm9yKDtFKGUsaSxlLmJsX3RyZWUpLDAhPS0tYTspO2Vsc2UgMCE9PWk/KGkhPT1zJiYoRShlLGksZS5ibF90cmVlKSxhLS0pLEUoZSwxNixlLmJsX3RyZWUpLFMoZSxhLTMsMikpOmE8PTEwPyhFKGUsMTcsZS5ibF90cmVlKSxTKGUsYS0zLDMpKTooRShlLDE4LGUuYmxfdHJlZSksUyhlLGEtMTEsNykpO3M9aSx1PShhPTApPT09bz8oZj0xMzgsMyk6aT09PW8/KGY9NiwzKTooZj03LDQpfX1uKHkpO3ZhciBOPSExO2Z1bmN0aW9uIFUoZSx0LHIsbil7dmFyIGkscyxvO1MoZSwwKyhuPzE6MCksMykscz10LG89cixPKGk9ZSkseChpLG8pLHgoaSx+byksYS5hcnJheVNldChpLnBlbmRpbmdfYnVmLGkud2luZG93LHMsbyxpLnBlbmRpbmcpLGkucGVuZGluZys9b31yLl90cl9pbml0PWZ1bmN0aW9uKGUpe058fChmdW5jdGlvbigpe3ZhciBlLHQscixuLGkscz1uZXcgQXJyYXkoXysxKTtmb3Iobj1yPTA7bjwyODtuKyspZm9yKG1bbl09cixlPTA7ZTwxPDxmW25dO2UrKylwW3IrK109bjtmb3IocFtyLTFdPW4sbj1pPTA7bjwxNjtuKyspZm9yKHlbbl09aSxlPTA7ZTwxPDx1W25dO2UrKyljW2krK109bjtmb3IoaT4+PTc7bjwzMDtuKyspZm9yKHlbbl09aTw8NyxlPTA7ZTwxPDx1W25dLTc7ZSsrKWNbMjU2K2krK109bjtmb3IodD0wO3Q8PV87dCsrKXNbdF09MDtmb3IoZT0wO2U8PTE0MzspaFsyKmUrMV09OCxlKyssc1s4XSsrO2Zvcig7ZTw9MjU1OyloWzIqZSsxXT05LGUrKyxzWzldKys7Zm9yKDtlPD0yNzk7KWhbMiplKzFdPTcsZSsrLHNbN10rKztmb3IoO2U8PTI4NzspaFsyKmUrMV09OCxlKyssc1s4XSsrO2ZvcihDKGgsMjg3LHMpLGU9MDtlPDMwO2UrKylsWzIqZSsxXT01LGxbMiplXT16KGUsNSk7dz1uZXcgYihoLGYsMjU3LDI4NixfKSx2PW5ldyBiKGwsdSwwLDMwLF8pLGc9bmV3IGIobmV3IEFycmF5KDApLG8sMCwxOSw3KX0oKSxOPSEwKSxlLmxfZGVzYz1uZXcgcyhlLmR5bl9sdHJlZSx3KSxlLmRfZGVzYz1uZXcgcyhlLmR5bl9kdHJlZSx2KSxlLmJsX2Rlc2M9bmV3IHMoZS5ibF90cmVlLGcpLGUuYmlfYnVmPTAsZS5iaV92YWxpZD0wLEEoZSl9LHIuX3RyX3N0b3JlZF9ibG9jaz1VLHIuX3RyX2ZsdXNoX2Jsb2NrPWZ1bmN0aW9uKGUsdCxyLG4pe3ZhciBpLHMsbz0wOzA8ZS5sZXZlbD8oMj09PWUuc3RybS5kYXRhX3R5cGUmJihlLnN0cm0uZGF0YV90eXBlPWZ1bmN0aW9uKGUpe3ZhciB0LHI9NDA5MzYyNDQ0Nztmb3IodD0wO3Q8PTMxO3QrKyxyPj4+PTEpaWYoMSZyJiYwIT09ZS5keW5fbHRyZWVbMip0XSlyZXR1cm4gMDtpZigwIT09ZS5keW5fbHRyZWVbMThdfHwwIT09ZS5keW5fbHRyZWVbMjBdfHwwIT09ZS5keW5fbHRyZWVbMjZdKXJldHVybiAxO2Zvcih0PTMyO3Q8MjU2O3QrKylpZigwIT09ZS5keW5fbHRyZWVbMip0XSlyZXR1cm4gMTtyZXR1cm4gMH0oZSkpLFQoZSxlLmxfZGVzYyksVChlLGUuZF9kZXNjKSxvPWZ1bmN0aW9uKGUpe3ZhciB0O2ZvcihSKGUsZS5keW5fbHRyZWUsZS5sX2Rlc2MubWF4X2NvZGUpLFIoZSxlLmR5bl9kdHJlZSxlLmRfZGVzYy5tYXhfY29kZSksVChlLGUuYmxfZGVzYyksdD0xODszPD10JiYwPT09ZS5ibF90cmVlWzIqZFt0XSsxXTt0LS0pO3JldHVybiBlLm9wdF9sZW4rPTMqKHQrMSkrNSs1KzQsdH0oZSksaT1lLm9wdF9sZW4rMys3Pj4+Mywocz1lLnN0YXRpY19sZW4rMys3Pj4+Myk8PWkmJihpPXMpKTppPXM9cis1LHIrNDw9aSYmLTEhPT10P1UoZSx0LHIsbik6ND09PWUuc3RyYXRlZ3l8fHM9PT1pPyhTKGUsMisobj8xOjApLDMpLEIoZSxoLGwpKTooUyhlLDQrKG4/MTowKSwzKSxmdW5jdGlvbihlLHQscixuKXt2YXIgaTtmb3IoUyhlLHQtMjU3LDUpLFMoZSxyLTEsNSksUyhlLG4tNCw0KSxpPTA7aTxuO2krKylTKGUsZS5ibF90cmVlWzIqZFtpXSsxXSwzKTtGKGUsZS5keW5fbHRyZWUsdC0xKSxGKGUsZS5keW5fZHRyZWUsci0xKX0oZSxlLmxfZGVzYy5tYXhfY29kZSsxLGUuZF9kZXNjLm1heF9jb2RlKzEsbysxKSxCKGUsZS5keW5fbHRyZWUsZS5keW5fZHRyZWUpKSxBKGUpLG4mJk8oZSl9LHIuX3RyX3RhbGx5PWZ1bmN0aW9uKGUsdCxyKXtyZXR1cm4gZS5wZW5kaW5nX2J1ZltlLmRfYnVmKzIqZS5sYXN0X2xpdF09dD4+PjgmMjU1LGUucGVuZGluZ19idWZbZS5kX2J1ZisyKmUubGFzdF9saXQrMV09MjU1JnQsZS5wZW5kaW5nX2J1ZltlLmxfYnVmK2UubGFzdF9saXRdPTI1NSZyLGUubGFzdF9saXQrKywwPT09dD9lLmR5bl9sdHJlZVsyKnJdKys6KGUubWF0Y2hlcysrLHQtLSxlLmR5bl9sdHJlZVsyKihwW3JdKzI1NisxKV0rKyxlLmR5bl9kdHJlZVsyKmsodCldKyspLGUubGFzdF9saXQ9PT1lLmxpdF9idWZzaXplLTF9LHIuX3RyX2FsaWduPWZ1bmN0aW9uKGUpe3ZhciB0O1MoZSwyLDMpLEUoZSwyNTYsaCksMTY9PT0odD1lKS5iaV92YWxpZD8oeCh0LHQuYmlfYnVmKSx0LmJpX2J1Zj0wLHQuYmlfdmFsaWQ9MCk6ODw9dC5iaV92YWxpZCYmKHQucGVuZGluZ19idWZbdC5wZW5kaW5nKytdPTI1NSZ0LmJpX2J1Zix0LmJpX2J1Zj4+PTgsdC5iaV92YWxpZC09OCl9fSx7XCIuLi91dGlscy9jb21tb25cIjo0MX1dLDUzOltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dC5leHBvcnRzPWZ1bmN0aW9uKCl7dGhpcy5pbnB1dD1udWxsLHRoaXMubmV4dF9pbj0wLHRoaXMuYXZhaWxfaW49MCx0aGlzLnRvdGFsX2luPTAsdGhpcy5vdXRwdXQ9bnVsbCx0aGlzLm5leHRfb3V0PTAsdGhpcy5hdmFpbF9vdXQ9MCx0aGlzLnRvdGFsX291dD0wLHRoaXMubXNnPVwiXCIsdGhpcy5zdGF0ZT1udWxsLHRoaXMuZGF0YV90eXBlPTIsdGhpcy5hZGxlcj0wfX0se31dLDU0OltmdW5jdGlvbihlLHQscil7XCJ1c2Ugc3RyaWN0XCI7dC5leHBvcnRzPVwiZnVuY3Rpb25cIj09dHlwZW9mIHNldEltbWVkaWF0ZT9zZXRJbW1lZGlhdGU6ZnVuY3Rpb24oKXt2YXIgZT1bXS5zbGljZS5hcHBseShhcmd1bWVudHMpO2Uuc3BsaWNlKDEsMCwwKSxzZXRUaW1lb3V0LmFwcGx5KG51bGwsZSl9fSx7fV19LHt9LFsxMF0pKDEwKX0pfSkuY2FsbCh0aGlzLHZvaWQgMCE9PXI/cjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOlwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93Ont9KX0se31dfSx7fSxbMV0pKDEpfSl9KS5jYWxsKHRoaXMsdm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6e30pfSx7fV19LHt9LFsxXSkoMSl9KX0pLmNhbGwodGhpcyx2b2lkIDAhPT1yP3I6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHt9XX0se30sWzFdKSgxKX0pfSkuY2FsbCh0aGlzLHZvaWQgMCE9PXI/cjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOlwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93Ont9KX0se31dfSx7fSxbMV0pKDEpfSl9KS5jYWxsKHRoaXMsdm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6e30pfSx7fV19LHt9LFsxXSkoMSl9KX0pLmNhbGwodGhpcyx2b2lkIDAhPT1yP3I6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHt9XX0se30sWzFdKSgxKX0pfSkuY2FsbCh0aGlzLHZvaWQgMCE9PXI/cjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOlwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93Ont9KX0se31dfSx7fSxbMV0pKDEpfSl9KS5jYWxsKHRoaXMsdm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6e30pfSx7fV19LHt9LFsxXSkoMSl9KX0pLmNhbGwodGhpcyx2b2lkIDAhPT1yP3I6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHt9XX0se30sWzFdKSgxKX0pfSkuY2FsbCh0aGlzLHZvaWQgMCE9PXI/cjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOlwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93Ont9KX0se31dfSx7fSxbMV0pKDEpfSl9KS5jYWxsKHRoaXMsdm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6e30pfSx7fV19LHt9LFsxXSkoMSl9KX0pLmNhbGwodGhpcyx2b2lkIDAhPT1yP3I6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHt9XX0se30sWzFdKSgxKX0pfSkuY2FsbCh0aGlzLHZvaWQgMCE9PXI/cjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOlwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93Ont9KX0se31dfSx7fSxbMV0pKDEpfSl9KS5jYWxsKHRoaXMsdm9pZCAwIT09cj9yOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6e30pfSx7fV19LHt9LFsxXSkoMSl9KX0pLmNhbGwodGhpcyx2b2lkIDAhPT1yP3I6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHt9XX0se30sWzFdKSgxKX0pfSkuY2FsbCh0aGlzLHZvaWQgMCE9PXI/cjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOlwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93Ont9KX0se31dfSx7fSxbMV0pKDEpfSl9KS5jYWxsKHRoaXMsXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHt9XX0se30sWzFdKSgxKX0pOyIsIi8qXG5vYmplY3QtYXNzaWduXG4oYykgU2luZHJlIFNvcmh1c1xuQGxpY2Vuc2UgTUlUXG4qL1xuXG4ndXNlIHN0cmljdCc7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xudmFyIGdldE93blByb3BlcnR5U3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHM7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHByb3BJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5mdW5jdGlvbiB0b09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZU5hdGl2ZSgpIHtcblx0dHJ5IHtcblx0XHRpZiAoIU9iamVjdC5hc3NpZ24pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgYnVnZ3kgcHJvcGVydHkgZW51bWVyYXRpb24gb3JkZXIgaW4gb2xkZXIgVjggdmVyc2lvbnMuXG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD00MTE4XG5cdFx0dmFyIHRlc3QxID0gbmV3IFN0cmluZygnYWJjJyk7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ldy13cmFwcGVyc1xuXHRcdHRlc3QxWzVdID0gJ2RlJztcblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDEpWzBdID09PSAnNScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QyID0ge307XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHR0ZXN0MlsnXycgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGk7XG5cdFx0fVxuXHRcdHZhciBvcmRlcjIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MikubWFwKGZ1bmN0aW9uIChuKSB7XG5cdFx0XHRyZXR1cm4gdGVzdDJbbl07XG5cdFx0fSk7XG5cdFx0aWYgKG9yZGVyMi5qb2luKCcnKSAhPT0gJzAxMjM0NTY3ODknKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MyA9IHt9O1xuXHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGxldHRlcikge1xuXHRcdFx0dGVzdDNbbGV0dGVyXSA9IGxldHRlcjtcblx0XHR9KTtcblx0XHRpZiAoT2JqZWN0LmtleXMoT2JqZWN0LmFzc2lnbih7fSwgdGVzdDMpKS5qb2luKCcnKSAhPT1cblx0XHRcdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHQvLyBXZSBkb24ndCBleHBlY3QgYW55IG9mIHRoZSBhYm92ZSB0byB0aHJvdywgYnV0IGJldHRlciB0byBiZSBzYWZlLlxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZFVzZU5hdGl2ZSgpID8gT2JqZWN0LmFzc2lnbiA6IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHR2YXIgZnJvbTtcblx0dmFyIHRvID0gdG9PYmplY3QodGFyZ2V0KTtcblx0dmFyIHN5bWJvbHM7XG5cblx0Zm9yICh2YXIgcyA9IDE7IHMgPCBhcmd1bWVudHMubGVuZ3RoOyBzKyspIHtcblx0XHRmcm9tID0gT2JqZWN0KGFyZ3VtZW50c1tzXSk7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuXHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuXHRcdFx0XHR0b1trZXldID0gZnJvbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChnZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcblx0XHRcdHN5bWJvbHMgPSBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZnJvbSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHByb3BJc0VudW1lcmFibGUuY2FsbChmcm9tLCBzeW1ib2xzW2ldKSkge1xuXHRcdFx0XHRcdHRvW3N5bWJvbHNbaV1dID0gZnJvbVtzeW1ib2xzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLy8gRE9NIEFQSXMsIGZvciBjb21wbGV0ZW5lc3NcblxuaWYgKHR5cGVvZiBzZXRUaW1lb3V0ICE9PSAndW5kZWZpbmVkJykgZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7IHJldHVybiBzZXRUaW1lb3V0LmFwcGx5KHdpbmRvdywgYXJndW1lbnRzKTsgfTtcbmlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ICE9PSAndW5kZWZpbmVkJykgZXhwb3J0cy5jbGVhclRpbWVvdXQgPSBmdW5jdGlvbigpIHsgY2xlYXJUaW1lb3V0LmFwcGx5KHdpbmRvdywgYXJndW1lbnRzKTsgfTtcbmlmICh0eXBlb2Ygc2V0SW50ZXJ2YWwgIT09ICd1bmRlZmluZWQnKSBleHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7IHJldHVybiBzZXRJbnRlcnZhbC5hcHBseSh3aW5kb3csIGFyZ3VtZW50cyk7IH07XG5pZiAodHlwZW9mIGNsZWFySW50ZXJ2YWwgIT09ICd1bmRlZmluZWQnKSBleHBvcnRzLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbigpIHsgY2xlYXJJbnRlcnZhbC5hcHBseSh3aW5kb3csIGFyZ3VtZW50cyk7IH07XG5cbi8vIFRPRE86IENoYW5nZSB0byBtb3JlIGVmZmllY2llbnQgbGlzdCBhcHByb2FjaCB1c2VkIGluIE5vZGUuanNcbi8vIEZvciBub3csIHdlIGp1c3QgaW1wbGVtZW50IHRoZSBBUElzIHVzaW5nIHRoZSBwcmltaXRpdmVzIGFib3ZlLlxuXG5leHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIGRlbGF5KSB7XG4gIGl0ZW0uX3RpbWVvdXRJRCA9IHNldFRpbWVvdXQoaXRlbS5fb25UaW1lb3V0LCBkZWxheSk7XG59O1xuXG5leHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5fdGltZW91dElEKTtcbn07XG5cbmV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuICAvLyBvdXIgbmFpdmUgaW1wbCBkb2Vzbid0IGNhcmUgKGNvcnJlY3RuZXNzIGlzIHN0aWxsIHByZXNlcnZlZClcbn07XG5cbmV4cG9ydHMuc2V0SW1tZWRpYXRlID0gcmVxdWlyZSgncHJvY2Vzcy9icm93c2VyLmpzJykubmV4dFRpY2s7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIvKlxuQGxpY3N0YXJ0ICBUaGUgZm9sbG93aW5nIGlzIHRoZSBlbnRpcmUgbGljZW5zZSBub3RpY2UgZm9yIHRoZSBKYXZhU2NyaXB0IGNvZGUgaW4gdGhpcyBwYWdlLlxuXG4gICAgQ29weXJpZ2h0IChjKSAyMDE5LCBKaW0gQWxsbWFuXG5cbiAgICBBbGwgcmlnaHRzIHJlc2VydmVkLlxuXG4gICAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gICAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXNcbiAgICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cblxuICAgIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAgICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uXG4gICAgYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG5cbiAgICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICAgIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEVcbiAgICBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAgICBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFXG4gICAgRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUxcbiAgICBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUlxuICAgIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSXG4gICAgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSxcbiAgICBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRVxuICAgIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG5cbkBsaWNlbmQgIFRoZSBhYm92ZSBpcyB0aGUgZW50aXJlIGxpY2Vuc2Ugbm90aWNlIGZvciB0aGUgSmF2YVNjcmlwdCBjb2RlIGluIHRoaXMgcGFnZS5cbiovXG5cbi8qXG4gKiBDbGllbnQtc2lkZSBiZWhhdmlvciBmb3IgdGhlIE9wZW4gVHJlZSBuYW1lLXJlc29sdXRpb24gVUlcbiAqXG4gKiBUaGlzIHVzZXMgdGhlIE9wZW4gVHJlZSBBUEkgdG8gcmVzb2x2ZSBsYXJnZSBzZXRzIG9mIGxhYmVscyB0byB0YXhvbm9taWMgbmFtZXMuXG4gKi9cbnZhciBKU1ppcCA9IHJlcXVpcmUoJ2pzemlwJyksXG4gICAgRmlsZVNhdmVyID0gcmVxdWlyZSgnZmlsZS1zYXZlcicpLFxuICAgIEJsb2IgPSByZXF1aXJlKCdibG9iLXBvbHlmaWxsJyksXG4gICAgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG5cbi8qIFRoZXNlIHZhcmlhYmxlcyBzaG91bGQgYWxyZWFkeSBiZSBkZWZpbmVkIGluIHRoZSBtYWluIEhUTUwgcGFnZS4gV2Ugc2hvdWxkXG4gKiBOT1QgZGVjbGFyZSB0aGVtIGhlcmUsIG9yIHRoaXMgd2lsbCBoaWRlIHRoZWlyIFwiZ2xvYmFsXCIgdmFsdWVzLlxudmFyIGluaXRpYWxTdGF0ZTtcbnZhciBkb1ROUlNGb3JBdXRvY29tcGxldGVfdXJsO1xudmFyIGRvVE5SU0Zvck1hcHBpbmdPVFVzX3VybDtcbnZhciBnZXRDb250ZXh0Rm9yTmFtZXNfdXJsO1xudmFyIHJlbmRlcl9tYXJrZG93bl91cmw7XG4qL1xuXG4vLyBzb21ldGltZXMgd2UgdXNlIHRoaXMgc2NyaXB0IGluIG90aGVyIHBhZ2VzOyBsZXQncyBjaGVjayFcbnZhciBjb250ZXh0O1xuaWYgKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKFwiL2N1cmF0b3IvdG5ycy9cIikgPT09IDApIHtcbiAgICBjb250ZXh0ID0gJ0JVTEtfVE5SUyc7XG59IGVsc2UgaWYgKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKFwiL2N1cmF0b3Ivc3R1ZHkvZWRpdC9cIikgPT09IDApIHtcbiAgICBjb250ZXh0ID0gJ1NUVURZX09UVV9NQVBQSU5HJztcbn0gZWxzZSB7XG4gICAgY29udGV4dCA9ICc/Pz8nO1xufVxuXG4vKiBSZXR1cm4gdGhlIGRhdGEgbW9kZWwgZm9yIGEgbmV3IG5hbWVzZXQgKG91ciBKU09OIHJlcHJlc2VudGF0aW9uKSAqL1xudmFyIGdldE5ld05hbWVzZXRNb2RlbCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcbiAgICB2YXIgb2JqID0ge1xuICAgICAgICAnbWV0YWRhdGEnOiB7XG4gICAgICAgICAgICAnbmFtZSc6IFwiVW50aXRsZWQgbmFtZXNldFwiLFxuICAgICAgICAgICAgJ2Rlc2NyaXB0aW9uJzogXCJcIixcbiAgICAgICAgICAgICdhdXRob3JzJzogWyBdLCAgIC8vIGFzc2lnbiBpbW1lZGlhdGVseSB0byB0aGlzIHVzZXI/XG4gICAgICAgICAgICAnZGF0ZV9jcmVhdGVkJzogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgJ2xhc3Rfc2F2ZWQnOiBudWxsLFxuICAgICAgICAgICAgJ3NhdmVfY291bnQnOiAwLCAgLy8gdXNlIHRvIHN1Z2dlc3QgdW5pcXVlIChudW1iZXJlZCkgZmlsZW5hbWVzXG4gICAgICAgICAgICAncHJldmlvdXNfZmlsZW5hbWUnOiBudWxsLCAgLy8gd2hhdCBmaWxlIHdlIGxvYWRlZCBiZWZvcmUgZG9pbmcgdGhpcyB3b3JrXG4gICAgICAgICAgICAnbGF0ZXN0X290dF92ZXJzaW9uJzogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBcIm1hcHBpbmdIaW50c1wiOiB7ICAgICAgIC8vIE9SIG5hbWVNYXBwaW5nSGludHM/XG4gICAgICAgICAgICBcImRlc2NyaXB0aW9uXCI6IFwiQWlkcyBmb3IgbWFwcGluZyBsaXN0ZWQgbmFtZXMgdG8gT1RUIHRheGFcIixcbiAgICAgICAgICAgIFwic2VhcmNoQ29udGV4dFwiOiBcIkFsbCBsaWZlXCIsXG4gICAgICAgICAgICBcInVzZUZ1enp5TWF0Y2hpbmdcIjogZmFsc2UsXG4gICAgICAgICAgICBcImF1dG9BY2NlcHRFeGFjdE1hdGNoZXNcIjogZmFsc2UsXG4gICAgICAgICAgICBcInN1YnN0aXR1dGlvbnNcIjogW1xuICAgICAgICAgICAgICAgIC8qIHR5cGljYWwgdmFsdWVzIGluIHVzZVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCJhY3RpdmVcIjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIFwib2xkXCI6IFwiLiogKFtBLVpdW2Etel0rIFthLXouXSsgW0EtWiAwLTldKykkXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibmV3XCI6IFwiJDFcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWxpZFwiOiB0cnVlXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIC8qIHN0YXJ0IHdpdGggb25lIGVtcHR5L25ldyBzdWJzdGl0dXRpb24gKi9cbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFwiYWN0aXZlXCI6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIFwib2xkXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibmV3XCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsaWRcIjogdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgICduYW1lcyc6IFtcbiAgICAgICAgICAgIC8vIGVhY2ggc2hvdWxkIGluY2x1ZGUgYSB1bmlxdWUgaWQsIG9yaWdpbmFsIG5hbWUsIG1hbnVhbGx5IGVkaXRlZC9hZGp1c3RlZCBuYW1lLCBhbmQgYW55IG1hcHBlZCBuYW1lL3RheG9uXG4gICAgICAgICAgICAvKiBoZXJlJ3MgYSB0eXBpY2FsIGV4YW1wbGUsIHdpdGggYW4gYXJiaXRyYXJ5L3NlcmlhbCBJRFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJuYW1lMjNcIixcbiAgICAgICAgICAgICAgICBcIm9yaWdpbmFsTGFiZWxcIjogXCJCYWN0ZXJpYSBQcm90ZW9iYWN0ZXJpYSBHYW1tYXByb3Rlb2JhY3RlcmlhIE9jZWFub3NwaXJpbGxhbGVzIFNhY2NoYXJvc3BpcmlsbGFjZWFlIFNhY2NoYXJvc3BpcmlsbHVtIGltcGF0aWVucyBEU00gMTI1NDZcIixcbiAgICAgICAgICAgICAgICBcImFkanVzdGVkTGFiZWxcIjogXCJQcm9lb2JhY3RlcmlhXCIsICAvLyBXQVMgJ15vdDphbHRMYWJlbCdcbiAgICAgICAgICAgICAgICBcIm90dFRheG9uTmFtZVwiOiBcIlNhY2NoYXJvc3BpcmlsbHVtIGltcGF0aWVucyBEU00gMTI1NDZcIixcbiAgICAgICAgICAgICAgICBcIm90dElkXCI6IDEzMjc1MSxcbiAgICAgICAgICAgICAgICBcInRheG9ub21pY1NvdXJjZXNcIjogW1wic2lsdmE6QTE2Mzc5LyMxXCIsIFwibmNiaToyXCIsIFwid29ybXM6NlwiLCBcImdiaWY6M1wiLCBcImlybW5nOjEzXCJdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAqL1xuICAgICAgICBdXG4gICAgfTtcbiAgICAvKiBUT0RPOiBBcHBseSBvcHRpb25hbCBtb2RpZmljYXRpb25zP1xuICAgIGlmIChvcHRpb25zLkJMQUgpIHtcbiAgICAgICAgb2JqLm1ldGFkYXRhLkZPTyA9ICdCQVInO1xuICAgIH1cbiAgICAqL1xuICAgIHJldHVybiBvYmo7XG59O1xuZnVuY3Rpb24gY29udmVydFRvTmFtZXNldE1vZGVsKCBsaXN0VGV4dCApIHtcbiAgICAvKiBUZXN0IGZvciBwcm9wZXIgZGVsaW1pdGVkIHRleHQgKFRTViBvciBDU1YsIHdpdGggYSBwYWlyIG9mIG5hbWVzIG9uIGVhY2ggbGluZSkuXG4gICAgICogVGhlIGZpcnN0IHZhbHVlIG9uIGVhY2ggbGluZSBpcyBhIHZlcm5hY3VsYXIgbGFiZWwsIHRoZSBzZWNvbmQgaXRzIG1hcHBlZCB0YXhvbiBuYW1lLlxuICAgICAqL1xuICAgIHZhciBuYW1lc2V0ID0gZ2V0TmV3TmFtZXNldE1vZGVsKCk7ICAvLyB3ZSdsbCBhZGQgbmFtZSBwYWlycyB0byB0aGlzXG4gICAgY29uc29sZS5sb2coIGxpc3RUZXh0ICk7XG4gICAgLy8gdGVzdCBhIHZhcmlldHkgb2YgZGVsaW1pdGVycyB0byB1c2Ugd2l0aCB0aGlzIHRleHRcbiAgICB2YXIgbGluZURlbGltaXRlcnMgPSBbJ1xcbicsJ1xcciddO1xuICAgIHZhciBsaW5lRGVsaW1Gb3VuZCA9IG51bGw7XG4gICAgJC5lYWNoKGxpbmVEZWxpbWl0ZXJzLCBmdW5jdGlvbihpLCBkZWxpbSkge1xuICAgICAgICBpZiAoIWxpbmVEZWxpbUZvdW5kKSB7XG4gICAgICAgICAgICBpZiAobGlzdFRleHQuc3BsaXQoZGVsaW0pLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBsaW5lRGVsaW1Gb3VuZCA9IGRlbGltO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGl0ZW1EZWxpbWl0ZXJzID0gWycsJywnXFx0J107XG4gICAgdmFyIGl0ZW1EZWxpbUZvdW5kID0gbnVsbDtcbiAgICAkLmVhY2goaXRlbURlbGltaXRlcnMsIGZ1bmN0aW9uKGksIGRlbGltKSB7XG4gICAgICAgIGlmICghaXRlbURlbGltRm91bmQpIHtcbiAgICAgICAgICAgIGlmIChsaXN0VGV4dC5zcGxpdChkZWxpbSkubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIGl0ZW1EZWxpbUZvdW5kID0gZGVsaW07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoKCFsaW5lRGVsaW1Gb3VuZCkgfHwgKCFpdGVtRGVsaW1Gb3VuZCkpIHtcbiAgICAgICAgcmV0dXJuIG5hbWVzZXQ7ICAvLyBwcm9iYWJseSBzdGlsbCBlbXB0eVxuICAgIH1cbiAgICAvLyBub3cgYXBwbHkgbGFiZWxzIGFuZCBrZWVwIGNvdW50IG9mIGFueSBkdXBsaWNhdGUgbGFiZWxzXG4gICAgdmFyIGZvdW5kTGFiZWxzID0gWyBdO1xuICAgIHZhciBkdXBlTGFiZWxzRm91bmQgPSAwO1xuICAgIHZhciBsaW5lcyA9IGxpc3RUZXh0LnNwbGl0KGxpbmVEZWxpbUZvdW5kKTtcbiAgICAvLyBmaWx0ZXIgb3V0IGVtcHR5IGVtcHR5IGxpbmVzLCBldGMuXG4gICAgbGluZXMgPSAkLmdyZXAobGluZXMsIGZ1bmN0aW9uKGxpbmUsIGkpIHtcbiAgICAgICAgcmV0dXJuICQudHJpbShsaW5lKSAhPT0gXCJcIjtcbiAgICB9KTtcbiAgICBjb25zb2xlLndhcm4oIGxpbmVzLmxlbmd0aCArXCIgbGluZXMgZm91bmQgd2l0aCBsaW5lIGRlbGltaXRlciAnXCIrIGxpbmVEZWxpbUZvdW5kICtcIidcIik7XG4gICAgdmFyIGxvY2FsTmFtZU51bWJlciA9IDA7ICAvLyB0aGVzZSBhcmUgbm90IGltcG9ydGVkLCBzbyBsb2NhbCBpbnRlZ2VycyBhcmUgZmluZFxuICAgICQuZWFjaChsaW5lcywgZnVuY3Rpb24oaSwgbGluZSkge1xuICAgICAgICB2YXIgaXRlbXMgPSBsaW5lLnNwbGl0KGl0ZW1EZWxpbUZvdW5kKTtcbiAgICAgICAgLy8gZmlsdGVyIG91dCBlbXB0eSBlbXB0eSBsYWJlbHMgYW5kIHRheGFcbiAgICAgICAgaXRlbXMgPSAkLmdyZXAoaXRlbXMsIGZ1bmN0aW9uKGl0ZW0sIGkpIHtcbiAgICAgICAgICAgIHJldHVybiAkLnRyaW0oaXRlbSkgIT09IFwiXCI7XG4gICAgICAgIH0pO1xuICAgICAgICBzd2l0Y2ggKGl0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAgLy8gc2tpcCB0byBuZXh0IGxpbmVcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy8gd2UgYXNzdW1lIHRoZSBzYW1lIGZpZWxkcyBhcyBpbiBvdXQgbmFtZXNldCBvdXRwdXQgZmlsZXNcbiAgICAgICAgICAgICAgICB2YXIgbGFiZWwgPSAkLnRyaW0oaXRlbXNbMF0pOyAgIC8vIGl0cyBvcmlnaW5hbCwgdmVybmFjdWxhciBsYWJlbFxuICAgICAgICAgICAgICAgIGlmIChsYWJlbCA9PT0gJ09SSUdJTkFMIExBQkVMJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBza2lwIHRoZSBoZWFkZXIgcm93LCBpZiBmb3VuZFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gc2tpcCB0aGlzIGxhYmVsIGlmIGl0J3MgYSBkdXBsaWNhdGVcbiAgICAgICAgICAgICAgICBpZiAoZm91bmRMYWJlbHMuaW5kZXhPZihsYWJlbCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZCB0aGlzIHRvIGxhYmVscyBmb3VuZCAodGVzdCBsYXRlciBuYW1lcyBhZ2FpbnN0IHRoaXMpXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kTGFiZWxzLnB1c2gobGFiZWwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgaXMgYSBkdXBlIG9mIGFuIGVhcmxpZXIgbmFtZSFcbiAgICAgICAgICAgICAgICAgICAgZHVwZUxhYmVsc0ZvdW5kKys7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY2Fub25pY2FsVGF4b25OYW1lID0gJC50cmltKGl0ZW1zWzFdKTsgIC8vIGl0cyBtYXBwZWQgdGF4b24gbmFtZVxuICAgICAgICAgICAgICAgIC8vIGluY2x1ZGUgb3R0aWQgYW5kIGFueSB0YXhvbm9taWMgc291cmNlcywgaWYgcHJvdmlkZWRcbiAgICAgICAgICAgICAgICB2YXIgdGF4b25JRCA9IChpdGVtcy5sZW5ndGggPiAyKSA/IGl0ZW1zWzJdIDogbnVsbDtcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlcyA9IChpdGVtcy5sZW5ndGggPiAzKSA/IGl0ZW1zWzNdLnNwbGl0KCc7JykgOiBudWxsO1xuICAgICAgICAgICAgICAgIC8vIGFkZCB0aGlzIGluZm9ybWF0aW9uIGluIHRoZSBleHBlY3RlZCBuYW1lc2V0IGZvcm1cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIi4uLmFkZGluZyBsYWJlbCAnXCIrIGxhYmVsICtcIicuLi5cIik7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWVJbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICBcImlkXCI6IChcIm5hbWVcIisgbG9jYWxOYW1lTnVtYmVyKyspLFxuICAgICAgICAgICAgICAgICAgICBcIm9yaWdpbmFsTGFiZWxcIjogbGFiZWwsXG4gICAgICAgICAgICAgICAgICAgIFwib3R0VGF4b25OYW1lXCI6IGNhbm9uaWNhbFRheG9uTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgXCJzZWxlY3RlZEZvckFjdGlvblwiOiBmYWxzZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHRheG9uSUQpIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZUluZm9bXCJvdHRJZFwiXSA9IHRheG9uSUQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVJbmZvW1widGF4b25vbWljU291cmNlc1wiXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2goc291cmNlcywgZnVuY3Rpb24oaSwgc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2UgPSAkLnRyaW0oc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2UpIHsgIC8vIGl0J3Mgbm90IGFuIGVtcHR5IHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVJbmZvW1widGF4b25vbWljU291cmNlc1wiXS5wdXNoKCBzb3VyY2UgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5hbWVzZXQubmFtZXMucHVzaCggbmFtZUluZm8gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfSk7XG4gICAgbnVkZ2VUaWNrbGVyKCdWSVNJQkxFX05BTUVfTUFQUElOR1MnKTtcbiAgICB2YXIgbmFtZXNBZGRlZCA9IG5hbWVzZXQubmFtZXMubGVuZ3RoO1xuICAgIHZhciBtc2c7XG4gICAgaWYgKGR1cGVMYWJlbHNGb3VuZCA9PT0gMCkge1xuICAgICAgICBtc2cgPSBcIkFkZGluZyBcIisgbmFtZXNBZGRlZCArXCIgbmFtZXMgZm91bmQgaW4gdGhpcyBmaWxlLi4uXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbXNnID0gXCJBZGRpbmcgXCIrIG5hbWVzQWRkZWQgK1wiIG5hbWVcIitcbiAgICAgICAgICAgIChuYW1lc0FkZGVkID09PSAxPyBcIlwiIDogXCJzXCIpICtcIiBmb3VuZCBpbiB0aGlzIGZpbGUgKFwiK1xuICAgICAgICAgICAgZHVwZUxhYmVsc0ZvdW5kICtcIiBkdXBsaWNhdGUgbGFiZWxcIisgKGR1cGVMYWJlbHNGb3VuZCA9PT0gMT8gXCJcIiA6IFwic1wiKVxuICAgICAgICAgICAgK1wiIHJlbW92ZWQpLi4uXCI7XG4gICAgfVxuICAgIC8vIHdoZXJlIGRvIHdlIHNob3cgdGhlc2UgbWVzc2FnZXM/XG4gICAgc2hvd0luZm9NZXNzYWdlKG1zZyk7XG4gICAgcmV0dXJuIG5hbWVzZXQ7XG59XG5cbi8qIExvYWQgYW5kIHNhdmUgKHRvL2Zyb20gWklQIGZpbGUgb24gdGhlIHVzZXIncyBmaWxlc3lzdGVtKSAqL1xuXG4vLyBwcm9wb3NlIGFuIGFwcHJvcHJpYXRlIGZpbGVuYW1lIGJhc2VkIG9uIGl0cyBpbnRlcm5hbCBuYW1lXG5mdW5jdGlvbiBnZXREZWZhdWx0QXJjaGl2ZUZpbGVuYW1lKCBjYW5kaWRhdGVGaWxlTmFtZSApIHtcbiAgICAvLyB0cnkgdG8gdXNlIGEgY2FuZGlkYXRlIG5hbWUsIGlmIHByb3ZpZGVkXG4gICAgdmFyIHN1Z2dlc3RlZEZpbGVOYW1lID0gJC50cmltKGNhbmRpZGF0ZUZpbGVOYW1lKSB8fFxuICAgICAgICB2aWV3TW9kZWwubWV0YWRhdGEubmFtZSgpIHx8XG4gICAgICAgIFwiVU5USVRMRURfTkFNRVNFVFwiO1xuICAgIC8vIHN0cmlwIGV4dGVuc2lvbiAoaWYgZm91bmQpIGFuZCBpbmNyZW1lbnQgYXMgbmVlZGVkXG4gICAgaWYgKHN1Z2dlc3RlZEZpbGVOYW1lLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoJy56aXAnKSkge1xuICAgICAgICBzdWdnZXN0ZWRGaWxlTmFtZSA9IHN1Z2dlc3RlZEZpbGVOYW1lLnN1YnN0cigwLCBzdWdnZXN0ZWRGaWxlTmFtZS5sZW5ndGgoKSAtIDQpO1xuICAgIH1cbiAgICAvLyBhZGQgaW5jcmVtZW50aW5nIGNvdW50ZXIgZnJvbSB2aWV3TW9kZWwsIHBsdXMgZmlsZSBleHRlbnNpb25cbiAgICBpZiAodmlld01vZGVsLm1ldGFkYXRhLnNhdmVfY291bnQoKSA+IDApIHtcbiAgICAgICAgc3VnZ2VzdGVkRmlsZU5hbWUgKz0gXCItXCIrIHZpZXdNb2RlbC5tZXRhZGF0YS5zYXZlX2NvdW50KCk7XG4gICAgfVxuICAgIHN1Z2dlc3RlZEZpbGVOYW1lICs9ICcuemlwJztcbiAgICByZXR1cm4gc3VnZ2VzdGVkRmlsZU5hbWU7XG59XG5cbmZ1bmN0aW9uIHNhdmVDdXJyZW50TmFtZXNldCggb3B0aW9ucyApIHtcbiAgICAvLyBzYXZlIGEgWklQIGFyY2hpdmUgKG9yIGp1c3QgYG1haW4uanNvbmApIHRvIHRoZSBmaWxlc3lzdGVtXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge0ZVTExfQVJDSElWRTogdHJ1ZX07XG5cbiAgICAvKlxuICAgICAqIFVwZGF0ZSBuZXctc2F2ZSBpbmZvICh0aW1lc3RhbXAgYW5kIGNvdW50ZXIpIGluIHRoZSBKU09OIGRvY3VtZW50IEJFRk9SRVxuICAgICAqIHNhdmluZyBpdDsgaWYgdGhlIG9wZXJhdGlvbiBmYWlscywgd2UnbGwgcmV2ZXJ0IHRoZXNlIHByb3BlcnRpZXMgaW4gdGhlXG4gICAgICogYWN0aXZlIGRvY3VtZW50LlxuICAgICAqL1xuICAgIHZhciBwcmV2aW91c1NhdmVUaW1lc3RhbXAgPSB2aWV3TW9kZWwubWV0YWRhdGEubGFzdF9zYXZlZCgpO1xuICAgIHZhciByaWdodE5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICB2aWV3TW9kZWwubWV0YWRhdGEubGFzdF9zYXZlZCggcmlnaHROb3cgKTtcbiAgICB2YXIgcHJldmlvdXNTYXZlQ291bnQgPSB2aWV3TW9kZWwubWV0YWRhdGEuc2F2ZV9jb3VudCgpO1xuICAgIHZpZXdNb2RlbC5tZXRhZGF0YS5zYXZlX2NvdW50KCArK3ByZXZpb3VzU2F2ZUNvdW50ICk7XG4gICAgLy8gVE9ETzogU2V0ICh0ZW50YXRpdmUvdXNlci1zdWdnZXN0ZWQpIGZpbGVuYW1lIGluIHRoZSBsaXZlIHZpZXdNb2RlbD9cblxuICAgIC8vIFRPRE86IGFkZCB0aGlzIHVzZXIgdG8gdGhlIGF1dGhvcnMgbGlzdCwgaWYgbm90IGZvdW5kP1xuICAgIC8vIChlbWFpbCBhbmQvb3IgdXNlcmlkLCBzbyB3ZSBjYW4gbGluayB0byBhdXRob3JzKVxuICAgIC8qXG4gICAgdmFyIHVzZXJEaXNwbGF5TmFtZSA9ICc/Pz8nO1xuICAgIHZhciBsaXN0UG9zID0gJC5pbkFycmF5KCB1c2VyRGlzcGxheU5hbWUsIHZpZXdNb2RlbC5tZXRhZGF0YS5hdXRob3JzKCkgKTtcbiAgICBpZiAobGlzdFBvcyA9PT0gLTEpIHtcbiAgICAgICAgdmlld01vZGVsLm1ldGFkYXRhLmF1dGhvcnMucHVzaCggdXNlckRpc3BsYXlOYW1lICk7XG4gICAgfVxuICAgICovXG5cbiAgICAvLyBUT0RPOiBhZGQgYSBcInNjcnViYmVyXCIgYXMgd2UgZG8gZm9yIE9wZW5UcmVlIHN0dWRpZXM/IFxuICAgIC8vIHNjcnViTmFtZXNldEZvclRyYW5zcG9ydChzdHlsaXN0LmlsbCk7XG5cbiAgICAvLyBmbGF0dGVuIHRoZSBjdXJyZW50IG5hbWVzZXQgdG8gc2ltcGxlIEpTIHVzaW5nIG91ciBcbiAgICAvLyBLbm9ja291dCBtYXBwaW5nIG9wdGlvbnNcbiAgICB2YXIgY2xvbmFibGVOYW1lc2V0ID0ga28ubWFwcGluZy50b0pTKHZpZXdNb2RlbCk7XG5cbiAgICAvLyBUT0RPOiBjbGVhciBhbnkgZXhpc3RpbmcgVVJMPyBvciBrZWVwIGxhc3Qta25vd24gZ29vZCBvbmU/XG4gICAgLy9jbG9uYWJsZU5hbWVzZXQubWV0YWRhdGEudXJsID0gJyc7XG5cbiAgICAvLyBjcmVhdGUgYSBaaXAgYXJjaGl2ZSwgYWRkIHRoZSBjb3JlIGRvY3VtZW50XG4gICAgdmFyIGFyY2hpdmUgPSBuZXcgSlNaaXAoKTtcbiAgICBhcmNoaXZlLmZpbGUoXCJtYWluLmpzb25cIiwgSlNPTi5zdHJpbmdpZnkoY2xvbmFibGVOYW1lc2V0KSk7XG5cbiAgICAvLyBUT0RPOiBUZXN0IGFsbCBpbnB1dCBmb3IgcmVwZWF0YWJsZSBwcm92ZW5hbmNlIGluZm87IGlmIGFueSBhcmUgbGFja2luZyBhXG4gICAgLy8gY2xlYXIgc291cmNlLCB3ZSBzaG91bGQgZW1iZWQgdGhlIHNvdXJjZSBkYXRhIGhlcmUuXG4gICAgLypcbiAgICB2YXIgc3RhdGljSW5wdXRzID0gVHJlZUlsbHVzdHJhdG9yLmdhdGhlclN0YXRpY0lucHV0RGF0YSgpO1xuICAgIGlmIChvcHRpb25zLkZVTExfQVJDSElWRSB8fCAoc3RhdGljSW5wdXRzLmxlbmd0aCA+IDApKSB7XG4gICAgICAgIC8vIGFkZCBzb21lIG9yIGFsbCBpbnB1dCBkYXRhIGZvciB0aGlzIGlsbHVzdHJhdGlvblxuICAgICAgICAvL3ZhciBpbnB1dEZvbGRlciA9IGFyY2hpdmUuZm9sZGVyKCdpbnB1dCcpO1xuICAgICAgICB2YXIgaW5wdXRzVG9TdG9yZSA9IG9wdGlvbnMuRlVMTF9BUkNISVZFID8gVHJlZUlsbHVzdHJhdG9yLmdhdGhlckFsbElucHV0RGF0YSgpIDogc3RhdGljSW5wdXRzO1xuICAgICAgICAkLmVhY2goaW5wdXRzVG9TdG9yZSwgZnVuY3Rpb24oaSwgaW5wdXREYXRhKSB7XG4gICAgICAgICAgICB2YXIgaXRzUGF0aCA9IGlucHV0RGF0YS5wYXRoO1xuICAgICAgICAgICAgdmFyIHNlcmlhbGl6ZWQgPSB1dGlscy5zZXJpYWxpemVEYXRhRm9yU2F2ZWRGaWxlKCBpbnB1dERhdGEudmFsdWUgKTtcbiAgICAgICAgICAgIGFyY2hpdmUuZmlsZShpdHNQYXRoLCBzZXJpYWxpemVkLnZhbHVlLCBzZXJpYWxpemVkLm9wdGlvbnMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgKi9cblxuICAgIC8vIGFkZCBhbnkgb3V0cHV0IGRvY3MgKFNWRywgUERGKVxuICAgIHZhciBvdXRwdXRGb2xkZXIgPSBhcmNoaXZlLmZvbGRlcignb3V0cHV0Jyk7XG4gICAgLyogU2VlIGh0dHBzOi8vc3R1ay5naXRodWIuaW8vanN6aXAvZG9jdW1lbnRhdGlvbi9hcGlfanN6aXAvZmlsZV9kYXRhLmh0bWxcbiAgICAgKiBmb3Igb3RoZXIgWklQIG9wdGlvbnMgbGlrZSBjb3BtcmVzc2lvbiBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBvdXRwdXRGb2xkZXIuZmlsZSgnbWFpbi50c3YnLCBnZW5lcmF0ZVRhYlNlcGFyYXRlZE91dHB1dCgnQUxMX05BTUVTJyksIHtjb21tZW50OiBcIlRhYi1kZWxpbWl0ZWQgdGV4dCwgaW5jbHVkaW5nIHVubWFwcGVkIG5hbWVzLlwifSk7XG4gICAgb3V0cHV0Rm9sZGVyLmZpbGUoJ21haW4uY3N2JywgZ2VuZXJhdGVDb21tYVNlcGFyYXRlZE91dHB1dCgnQUxMX05BTUVTJyksIHtjb21tZW50OiBcIkNvbW1hLWRlbGltaXRlZCB0ZXh0LCBpbmNsdWRpbmcgdW5tYXBwZWQgbmFtZXMuXCJ9KTtcblxuICAgIC8qIE5PVEUgdGhhdCB3ZSBoYXZlIG5vIGNvbnRyb2wgb3ZlciB3aGVyZSB0aGUgYnJvd3NlciB3aWxsIHNhdmUgYVxuICAgICAqIGRvd25sb2FkZWQgZmlsZSwgYW5kIHdlIGhhdmUgbm8gZGlyZWN0IGtub3dsZWRnZSBvZiB0aGUgZmlsZXN5c3RlbSFcbiAgICAgKiBGdXJ0aGVybW9yZSwgbW9zdCBicm93c2VycyB3b24ndCBvdmVyd3JpdGUgYW4gZXhpc3RpbmcgZmlsZSB3aXRoIHRoaXNcbiAgICAgKiBwYXRoK25hbWUsIGFuZCB3aWxsIGluc3RlYWQgaW5jcmVtZW50IHRoZSBuZXcgZmlsZSwgZS5nLlxuICAgICAqICdiZWUtdHJlZXMtY29tcGFyZWQuemlwJyBiZWNvbWVzICd+L0Rvd25sb2Fkcy9iZWUtdHJlZXMtY29tcGFyZWQgKDIpLnppcCcuXG4gICAgICovXG4gICAgdmFyICRmaWxlbmFtZUZpZWxkID0gJCgnaW5wdXQjc3VnZ2VzdGVkLWFyY2hpdmUtZmlsZW5hbWUnKTtcbiAgICB2YXIgc3VnZ2VzdGVkRmlsZU5hbWUgPSAkLnRyaW0oJGZpbGVuYW1lRmllbGQudmFsKCkpO1xuICAgIGlmIChzdWdnZXN0ZWRGaWxlTmFtZSA9PT0gXCJcIikge1xuICAgICAgICBzdWdnZXN0ZWRGaWxlTmFtZSA9IGdldERlZmF1bHRBcmNoaXZlRmlsZW5hbWUoc3VnZ2VzdGVkRmlsZU5hbWUpO1xuICAgIH1cbiAgICAvLyBhZGQgbWlzc2luZyBleHRlbnNpb24sIGlmIGl0J3MgbWlzc2luZ1xuICAgIGlmICghKHN1Z2dlc3RlZEZpbGVOYW1lLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoJy56aXAnKSkpIHtcbiAgICAgICAgc3VnZ2VzdGVkRmlsZU5hbWUgKz0gJy56aXAnO1xuICAgIH1cblxuICAgIGFyY2hpdmUuZ2VuZXJhdGVBc3luYygge3R5cGU6XCJibG9iXCJ9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHVwZGF0ZUNhbGxiYWNrKG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogU2hvdyBwcm9ncmVzcyBhcyBkZW1vbnN0cmF0ZWQgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBodHRwczovL3N0dWsuZ2l0aHViLmlvL2pzemlwL2RvY3VtZW50YXRpb24vZXhhbXBsZXMvZG93bmxvYWRlci5odG1sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIG1ldGFkYXRhLnBlcmNlbnQudG9GaXhlZCgyKSArIFwiICUgY29tcGxldGVcIiApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgfSApXG4gICAgICAgICAgIC50aGVuKCBmdW5jdGlvbiAoYmxvYikgeyAgIFxuICAgICAgICAgICAgICAgICAgICAgIC8vIHN1Y2Nlc3MgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgICBGaWxlU2F2ZXIuc2F2ZUFzKGJsb2IsIHN1Z2dlc3RlZEZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZXJyKSB7ICAgIFxuICAgICAgICAgICAgICAgICAgICAgIC8vIGZhaWx1cmUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgICBhc3luY0FsZXJ0KCdFUlJPUiBnZW5lcmF0aW5nIHRoaXMgWklQIGFyY2hpdmU6PGJyLz48YnIvPicrIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gcmV2ZXJ0IHRvIHByZXZpb3VzIGxhc3Qtc2F2ZSBpbmZvIGluIHRoZSBhY3RpdmUgZG9jdW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZWwubWV0YWRhdGEubGFzdF9zYXZlZCggcHJldmlvdXNTYXZlVGltZXN0YW1wICk7XG4gICAgICAgICAgICAgICAgICAgICAgdmlld01vZGVsLm1ldGFkYXRhLnNhdmVfY291bnQoIHByZXZpb3VzU2F2ZUNvdW50ICk7XG4gICAgICAgICAgICAgICAgICB9ICk7XG5cbiAgICAkKCcjbmFtZXNldC1sb2NhbC1maWxlc3lzdGVtLXdhcm5pbmcnKS5zbGlkZURvd24oKTsgLy8gVE9ET1xuXG4gICAgc2hvd0luZm9NZXNzYWdlKCdOYW1lc2V0IHNhdmVkIHRvIGxvY2FsIGZpbGUuJyk7XG5cbiAgICBwb3BQYWdlRXhpdFdhcm5pbmcoJ1VOU0FWRURfTkFNRVNFVF9DSEFOR0VTJyk7XG4gICAgbmFtZXNldEhhc1Vuc2F2ZWRDaGFuZ2VzID0gZmFsc2U7XG4gICAgZGlzYWJsZVNhdmVCdXR0b24oKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVUYWJTZXBhcmF0ZWRPdXRwdXQoKSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlRGVsaW1pdGVkVGV4dE91dHB1dCgnQUxMX05BTUVTJywgJ1xcdCcsICc7Jyk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUNvbW1hU2VwYXJhdGVkT3V0cHV0KCkge1xuICAgIHJldHVybiBnZW5lcmF0ZURlbGltaXRlZFRleHRPdXRwdXQoJ0FMTF9OQU1FUycsICcsJywgJzsnKTtcbn1cbmZ1bmN0aW9uIGdlbmVyYXRlRGVsaW1pdGVkVGV4dE91dHB1dChtYXBwZWRPckFsbE5hbWVzLCBkZWxpbWl0ZXIsIG1pbm9yRGVsaW1pdGVyKSB7XG4gICAgLy8gcmVuZGVyIHRoZSBjdXJyZW50IG5hbWVzZXQgKG1hcHBlZCBuYW1lcywgb3IgYWxsKSBhcyBhIGRlbGltaXRlZCAoVFNWLCBDU1YpIHN0cmluZ1xuICAgIHZhciBvdXRwdXQ7XG4gICAgaWYgKCQuaW5BcnJheShtYXBwZWRPckFsbE5hbWVzLCBbJ01BUFBFRF9OQU1FUycsICdBTExfTkFNRVMnXSkgPT09IC0xKSB7XG4gICAgICAgIHZhciBtc2cgPSBcIiMgRVJST1I6IG1hcHBlZE9yQWxsTmFtZXMgc2hvdWxkIGJlICdNQVBQRURfTkFNRVMnIG9yICdBTExfTkFNRVMnLCBub3QgJ1wiKyBtYXBwZWRPckFsbE5hbWVzICtcIichXCJcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgICByZXR1cm4gbXNnO1xuICAgIH1cbiAgICBpZiAodmlld01vZGVsLm5hbWVzKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIG91dHB1dCA9IFwiIyBObyBuYW1lcyBpbiB0aGlzIG5hbWVzZXQgd2VyZSBtYXBwZWQgdG8gdGhlIE9UIFRheG9ub215LlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG91dHB1dCA9IFwiT1JJR0lOQUwgTEFCRUxcIisgZGVsaW1pdGVyICtcIk9UVCBUQVhPTiBOQU1FXCIrIGRlbGltaXRlciArXCJPVFQgVEFYT04gSURcIisgZGVsaW1pdGVyICtcIlRBWE9OT01JQyBTT1VSQ0VTXFxuXCI7XG4gICAgICAgICQuZWFjaCh2aWV3TW9kZWwubmFtZXMoKSwgZnVuY3Rpb24oaSwgbmFtZSkge1xuICAgICAgICAgICAgaWYgKChtYXBwZWRPckFsbE5hbWVzID09PSAnTUFQUEVEX05BTUVTJykgJiYgIW5hbWUub3R0VGF4b25OYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7ICAvLyBza2lwIHRoaXMgdW4tbWFwcGVkIG5hbWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE4uQi4gdW5tYXBwZWQgbmFtZXMgd29uJ3QgaGF2ZSBtb3N0IG9mIHRoZXNlIHByb3BlcnRpZXMhXG4gICAgICAgICAgICB2YXIgY29tYmluZWRTb3VyY2VzID0gKG5hbWUudGF4b25vbWljU291cmNlcyB8fCBbIF0pLmpvaW4obWlub3JEZWxpbWl0ZXIpO1xuICAgICAgICAgICAgb3V0cHV0ICs9IChuYW1lLm9yaWdpbmFsTGFiZWwgK2RlbGltaXRlcitcbiAgICAgICAgICAgICAgICAgICAgICAgKG5hbWUub3R0VGF4b25OYW1lIHx8ICcnKSArZGVsaW1pdGVyK1xuICAgICAgICAgICAgICAgICAgICAgICAobmFtZS5vdHRJZCB8fCAnJykgK2RlbGltaXRlcitcbiAgICAgICAgICAgICAgICAgICAgICAgY29tYmluZWRTb3VyY2VzICtcIlxcblwiKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG59XG5cbmZ1bmN0aW9uIGxvYWRMaXN0RnJvbUNob3NlbkZpbGUoIHZtLCBldnQgKSB7XG4gICAgLy8gRmlyc3QgcGFyYW0gKGNvcnJlc3BvbmRpbmcgdmlldy1tb2RlbCBkYXRhKSBpcyBwcm9iYWJseSBlbXB0eTsgZm9jdXMgb24gdGhlIGV2ZW50IVxuICAgIHZhciAkaGludEFyZWEgPSAkKCcjbGlzdC1sb2NhbC1maWxlc3lzdGVtLXdhcm5pbmcnKS5lcSgwKTtcbiAgICAkaGludEFyZWEuaHRtbChcIlwiKTsgIC8vIGNsZWFyIGZvciBuZXcgcmVzdWx0c1xuICAgIHZhciBldmVudFRhcmdldCA9IGV2dC50YXJnZXQgfHwgZXZ0LnNyY0VsZW1lbnQ7XG4gICAgc3dpdGNoKGV2ZW50VGFyZ2V0LmZpbGVzLmxlbmd0aCkge1xuICAgICAgICBjYXNlICgwKTpcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignTm8gZmlsZShzKSBzZWxlY3RlZCEnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY2FzZSAoMSk6XG4gICAgICAgIGRlZmF1bHQ6ICAvLyBpZ25vcmUgbXVsdGlwbGUgZmlsZXMgZm9yIG5vdywganVzdCBsb2FkIHRoZSBmaXJzdFxuICAgICAgICAgICAgdmFyIGZpbGVJbmZvID0gZXZlbnRUYXJnZXQuZmlsZXNbMF07XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJmaWxlSW5mby5uYW1lID0gXCIrIGZpbGVJbmZvLm5hbWUpO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmlsZUluZm8udHlwZSA9IFwiKyBmaWxlSW5mby50eXBlKTtcbiAgICAgICAgICAgIHZhciBpc1ZhbGlkTGlzdCA9IGZhbHNlO1xuICAgICAgICAgICAgc3dpdGNoIChmaWxlSW5mby50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dC9wbGFpbic6XG4gICAgICAgICAgICAgICAgY2FzZSAndGV4dC90YWItc2VwYXJhdGVkLXZhbHVlcyc6XG4gICAgICAgICAgICAgICAgICAgIGlzVmFsaWRMaXN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgZmlsZSBleHRlbnNpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVJbmZvLm5hbWUubWF0Y2goJy4odHh0fHRzdikkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWRMaXN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghaXNWYWxpZExpc3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJBIGxpc3Qgb2YgbmFtZXMgc2hvdWxkIGVuZCBpbiA8Y29kZT4udHh0PC9jb2RlPiBvciA8Y29kZT4udHN2PC9jb2RlPi4gQ2hvb3NlIGFub3RoZXIgZmlsZT9cIjtcbiAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBTdGlsbCBoZXJlPyB0cnkgdG8gbG9hZCBhbmQgcGFyc2UgdGhlIGxpc3QgKGxpbmUtIG9yIHRhYi1kZWxpbWl0ZWQgbmFtZXMpXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVhZGluZyBsaXN0IGNvbnRlbnRzLi4uJyk7XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJSZWFkaW5nIGxpc3Qgb2YgbmFtZXMuLi5cIjtcbiAgICAgICAgICAgICRoaW50QXJlYS5odG1sKG1zZykuc2hvdygpO1xuXG4gICAgICAgICAgICB2YXIgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgZnIub25sb2FkID0gZnVuY3Rpb24oIGV2dCApIHtcbiAgICAgICAgICAgICAgICB2YXIgbGlzdFRleHQgPSBldnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggbGlzdFRleHQgKTtcbiAgICAgICAgICAgICAgICAvLyB0ZXN0IGEgdmFyaWV0eSBvZiBkZWxpbWl0ZXJzIHRvIGZpbmQgbXVsdGlwbGUgaXRlbXNcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXMgPSBbIF07XG4gICAgICAgICAgICAgICAgdmFyIG11bHRpcGxlTmFtZXNGb3VuZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHZhciBkdXBlc0ZvdW5kID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgZGVsaW1pdGVycyA9IFsnXFxuJywnXFxyJywnXFx0J107XG4gICAgICAgICAgICAgICAgJC5lYWNoKGRlbGltaXRlcnMsIGZ1bmN0aW9uKGksIGRlbGltKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbXVsdGlwbGVOYW1lc0ZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lcyA9IGxpc3RUZXh0LnNwbGl0KGRlbGltKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpbHRlciBvdXQgZW1wdHkgbmFtZXMsIGVtcHR5IGxpbmVzLCBldGMuXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lcyA9ICQuZ3JlcChuYW1lcywgZnVuY3Rpb24obmFtZSwgaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkLnRyaW0obmFtZSkgIT09IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAobmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJObyBuYW1lcyBmb3VuZCB3aXRoIGRlbGltaXRlciAnXCIrIGRlbGltICtcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiSnVzdCBvbmUgbmFtZSBmb3VuZCB3aXRoIGRlbGltaXRlciAnXCIrIGRlbGltICtcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGxlTmFtZXNGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybiggbmFtZXMubGVuZ3RoICtcIiBuYW1lcyBmb3VuZCB3aXRoIGRlbGltaXRlciAnXCIrIGRlbGltICtcIidcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHVucGFjayBuYW1lcywgaWdub3JlIHJlbWFpbmluZyBkZWxpbWl0ZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChuYW1lcywgZnVuY3Rpb24oaSwgbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWRkIGEgbmV3IG5hbWUgZW50cnkgdG8gdGhlIG5hbWVzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiLi4uYWRkaW5nIG5hbWUgJ1wiKyBuYW1lICtcIicuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZWwubmFtZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiAoXCJuYW1lXCIrIGdldE5leHROYW1lT3JkaW5hbE51bWJlcigpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm9yaWdpbmFsTGFiZWxcIjogbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInNlbGVjdGVkRm9yQWN0aW9uXCI6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBhZGQgdGhlc2Ugb25seSB3aGVuIHRoZXkncmUgcG9wdWxhdGVkIVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYWRqdXN0ZWRMYWJlbFwiOiBcIlwiICAgLy8gV0FTICdeb3Q6YWx0TGFiZWwnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvdHRUYXhvbk5hbWVcIjogXCJIb21vIHNhcGllbnMgc2FwaWVuc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib3R0SWRcIjogMTMyNzUxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0YXhvbm9taWNTb3VyY2VzXCI6IFsgLi4uIF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3dlZXAgZm9yIGR1cGxpY2F0ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHdpdGhEdXBlcyA9IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlRHVwbGljYXRlTmFtZXModmlld01vZGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHdpdGhvdXREdXBlcyA9IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVwZXNGb3VuZCA9IHdpdGhEdXBlcyAtIHdpdGhvdXREdXBlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVkZ2VUaWNrbGVyKCdWSVNJQkxFX05BTUVfTUFQUElOR1MnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gc3RpbGwgaGVyZT8gdGhlcmUgd2FzIGEgcHJvYmxlbSwgcmVwb3J0IGl0IGFuZCBiYWlsXG4gICAgICAgICAgICAgICAgdmFyIG1zZztcbiAgICAgICAgICAgICAgICBpZiAobXVsdGlwbGVOYW1lc0ZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkdXBlc0ZvdW5kID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cgPSBcIkFkZGluZyBcIisgbmFtZXMubGVuZ3RoICtcIiBuYW1lcyBmb3VuZCBpbiB0aGlzIGZpbGUuLi5cIjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lc0FkZGVkID0gbmFtZXMubGVuZ3RoIC0gZHVwZXNGb3VuZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zZyA9IFwiQWRkaW5nIFwiKyBuYW1lc0FkZGVkICtcIiBuYW1lXCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hbWVzQWRkZWQgPT09IDE/IFwiXCIgOiBcInNcIikgK1wiIGZvdW5kIGluIHRoaXMgZmlsZSAoXCIrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVwZXNGb3VuZCArXCIgZHVwbGljYXRlIG5hbWVcIisgKGR1cGVzRm91bmQgPT09IDE/IFwiXCIgOiBcInNcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArXCIgcmVtb3ZlZCkuLi5cIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZyA9IFwiTm8gbmFtZXMgKG9yIGp1c3Qgb25lKSBmb3VuZCBpbiB0aGlzIGZpbGUhIFRyeSBhZ2Fpbj9cIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vZnIucmVhZEFzRGF0YVVSTChmaWxlSW5mbyk7XG4gICAgICAgICAgICBmci5yZWFkQXNUZXh0KGZpbGVJbmZvKTsgIC8vIGRlZmF1bHQgZW5jb2RpbmcgaXMgdXRmLThcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxvYWROYW1lc2V0RnJvbUNob3NlbkZpbGUoIHZtLCBldnQgKSB7XG4gICAgLy8gRmlyc3QgcGFyYW0gKGNvcnJlc3BvbmRpbmcgdmlldy1tb2RlbCBkYXRhKSBpcyBwcm9iYWJseSBlbXB0eTsgZm9jdXMgb24gdGhlIGV2ZW50IVxuICAgIHZhciAkaGludEFyZWEgPSAkKCcjbmFtZXNldC1sb2NhbC1maWxlc3lzdGVtLXdhcm5pbmcnKS5lcSgwKTtcbiAgICAkaGludEFyZWEuaHRtbChcIlwiKTsgIC8vIGNsZWFyIGZvciBuZXcgcmVzdWx0c1xuICAgIHZhciBldmVudFRhcmdldCA9IGV2dC50YXJnZXQgfHwgZXZ0LnNyY0VsZW1lbnQ7XG4gICAgc3dpdGNoKGV2ZW50VGFyZ2V0LmZpbGVzLmxlbmd0aCkge1xuICAgICAgICBjYXNlICgwKTpcbiAgICAgICAgICAgIHZhciBtc2cgPSBcIk5vIGZpbGUocykgc2VsZWN0ZWQhXCI7XG4gICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY2FzZSAoMSk6XG4gICAgICAgIGRlZmF1bHQ6ICAvLyBpZ25vcmUgbXVsdGlwbGUgZmlsZXMgZm9yIG5vdywganVzdCBsb2FkIHRoZSBmaXJzdFxuICAgICAgICAgICAgdmFyIGZpbGVJbmZvID0gZXZlbnRUYXJnZXQuZmlsZXNbMF07XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJmaWxlSW5mby5uYW1lID0gXCIrIGZpbGVJbmZvLm5hbWUpO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmlsZUluZm8udHlwZSA9IFwiKyBmaWxlSW5mby50eXBlKTtcbiAgICAgICAgICAgIHZhciB1c2VzTmFtZXNldEZpbGVGb3JtYXQgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBpc1ZhbGlkQXJjaGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKGNvbnRleHQgPT09ICdCVUxLX1ROUlMnKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChmaWxlSW5mby50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2FwcGxpY2F0aW9uL3ppcCc6XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VzTmFtZXNldEZpbGVGb3JtYXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZEFyY2hpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJyc6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBmaWxlIGV4dGVuc2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVJbmZvLm5hbWUubWF0Y2goJy4oemlwfG5hbWVzZXQpJCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkQXJjaGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkQXJjaGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJBcmNoaXZlZCBuYW1lc2V0IGZpbGUgc2hvdWxkIGVuZCBpbiA8Y29kZT4uemlwPC9jb2RlPiBvciA8Y29kZT4ubmFtZXNldDwvY29kZT4uIENob29zZSBhbm90aGVyIGZpbGU/XCI7XG4gICAgICAgICAgICAgICAgICAgICRoaW50QXJlYS5odG1sKG1zZykuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHsgIC8vIHByZXN1bWFibHkgJ1NUVURZX09UVV9NQVBQSU5HJ1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZmlsZUluZm8udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdhcHBsaWNhdGlvbi96aXAnOlxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWRBcmNoaXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd0ZXh0L3BsYWluJzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndGV4dC90YWItc2VwYXJhdGVkLXZhbHVlcyc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQvY3N2JzpcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYXBwbGljYXRpb24vanNvbic6XG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VzTmFtZXNldEZpbGVGb3JtYXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBmaWxlIGV4dGVuc2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVJbmZvLm5hbWUubWF0Y2goJy4oemlwfG5hbWVzZXR8dHh0fHRzdnxjc3Z8anNvbikkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VzTmFtZXNldEZpbGVGb3JtYXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWRBcmNoaXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXVzZXNOYW1lc2V0RmlsZUZvcm1hdCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJOYW1lc2V0IGZpbGUgc2hvdWxkIGVuZCBpbiBvbmUgb2YgPGNvZGU+LnppcCAubmFtZXNldCAudHh0IC50c3YgLmNzdiAuanNvbjwvY29kZT4uIENob29zZSBhbm90aGVyIGZpbGU/XCI7XG4gICAgICAgICAgICAgICAgICAgICRoaW50QXJlYS5odG1sKG1zZykuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU3RpbGwgaGVyZT8gdHJ5IHRvIGV4dHJhY3QgYSBuYW1lc2V0IGZyb20gdGhlIGNob3NlbiBmaWxlXG4gICAgICAgICAgICBpZiAoaXNWYWxpZEFyY2hpdmUpIHtcbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gcmVhZCBhbmQgdW56aXAgdGhpcyBhcmNoaXZlIVxuICAgICAgICAgICAgICAgIEpTWmlwLmxvYWRBc3luYyhmaWxlSW5mbykgICAvLyByZWFkIHRoZSBCbG9iXG4gICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbih6aXApIHsgIC8vIHN1Y2Nlc3MgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygncmVhZGluZyBaSVAgY29udGVudHMuLi4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJSZWFkaW5nIG5hbWVzZXQgY29udGVudHMuLi5cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIb3cgd2lsbCB3ZSBrbm93IHdoZW4gaXQncyBhbGwgKGFzeW5jKSBsb2FkZWQ/IENvdW50IGRvd24gYXMgZWFjaCBlbnRyeSBpcyByZWFkIVxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB6aXBFbnRyaWVzVG9Mb2FkID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFpbkpzb25QYXlsb2FkRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5pdGlhbENhY2hlID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcCBpbiB6aXAuZmlsZXMpIHsgemlwRW50cmllc1RvTG9hZCsrOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3Rhc2ggbW9zdCBmb3VuZCBkYXRhIGluIHRoZSBjYWNoZSwgYnV0IG1haW4gSlNPTiBzaG91bGQgYmUgcGFyc2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVzZXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgIHppcC5mb3JFYWNoKGZ1bmN0aW9uIChyZWxhdGl2ZVBhdGgsIHppcEVudHJ5KSB7ICAvLyAyKSBwcmludCBlbnRyaWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCcgICcrIHppcEVudHJ5Lm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh6aXBFbnRyeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNraXAgZGlyZWN0b3JpZXMgKG5vdGhpbmcgdG8gZG8gaGVyZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHppcEVudHJ5LmRpcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiU0tJUFBJTkcgZGlyZWN0b3J5IFwiKyB6aXBFbnRyeS5uYW1lICtcIi4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHppcEVudHJpZXNUb0xvYWQtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZWFkIGFuZCBzdG9yZSBmaWxlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6aXBFbnRyeS5hc3luYygndGV4dCcsIGZ1bmN0aW9uKG1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVwb3J0IHByb2dyZXNzP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBcIlJlYWRpbmcgbmFtZXNldCBjb250ZW50cyAoXCIrIHppcEVudHJ5Lm5hbWUgK1wiKTogXCIrIG1ldGFkYXRhLnBlcmNlbnQudG9GaXhlZCgyKSArXCIgJVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRoaW50QXJlYS5odG1sKG1zZykuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gc3VjY2VzcyhkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU3VjY2VzcyB1bnppcHBpbmcgXCIrIHppcEVudHJ5Lm5hbWUgK1wiOlxcblwiKyBkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgemlwRW50cmllc1RvTG9hZC0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzZSBhbmQgc3Rhc2ggdGhlIG1haW4gSlNPTiBkYXRhOyBjYWNoZSB0aGUgcmVzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOQiB0aGF0IHRoaXMgbmFtZSBjb3VsZCBpbmNsdWRlIGEgcHJlY2VkaW5nIHBhdGghXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoemlwRW50cnkubmFtZSA9PT0gJ21haW4uanNvbicpIHx8ICh6aXBFbnRyeS5uYW1lLmVuZHNXaXRoKCcvbWFpbi5qc29uJykpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIHRoZSBleHBlY3RlZCBwYXlsb2FkIGZvciBhIFpJUGVkIG5hbWVzZXQ7IHRyeSB0byBwYXJzZSBpdCFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1haW5Kc29uUGF5bG9hZEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXNldCA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBqdXN0IHN3YWxsb3cgdGhpcyBhbmQgcmVwb3J0IGJlbG93XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXNldCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiPGNvZGU+bWFpbi5qc29uPC9jb2RlPiBpcyBtYWxmb3JtZWQgKFwiKyBlICtcIikhXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpdCdzIHNvbWUgb3RoZXIgZmlsZTsgY29weSBpdCB0byBvdXIgaW5pdGlhbCBjYWNoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbENhY2hlWyB6aXBFbnRyeS5uYW1lIF0gPSBkYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh6aXBFbnRyaWVzVG9Mb2FkID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSd2ZSByZWFkIGluIGFsbCB0aGUgWklQIGRhdGEhIG9wZW4gdGhpcyBuYW1lc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAoVE9ETzogc2V0dGluZyBpdHMgaW5pdGlhbCBjYWNoZSkgYW5kIGNsb3NlIHRoaXMgcG9wdXBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbWFpbkpzb25QYXlsb2FkRm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCI8Y29kZT5tYWluLmpzb248L2NvZGU+IG5vdCBmb3VuZCBpbiB0aGlzIFpJUCFcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhcHR1cmUgc29tZSBmaWxlIG1ldGFkYXRhLCBpbiBjYXNlIGl0J3MgbmVlZGVkIGluIHRoZSBuYW1lc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbG9hZGVkRmlsZU5hbWUgPSBmaWxlSW5mby5uYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RNb2RpZmllZERhdGUgPSBmaWxlSW5mby5sYXN0TW9kaWZpZWREYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJMT0FESU5HIEZST00gRklMRSAnXCIrIGxvYWRlZEZpbGVOYW1lICtcIicsIExBU1QgTU9ESUZJRUQ6IFwiKyBsYXN0TW9kaWZpZWREYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0ID09PSAnQlVMS19UTlJTJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgdGhlIG1haW4gdmlldy1tb2RlbCBvbiB0aGlzIHBhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkTmFtZXNldERhdGEoIG5hbWVzZXQsIGxvYWRlZEZpbGVOYW1lLCBsYXN0TW9kaWZpZWREYXRlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTi5CLiB0aGUgRmlsZSBBUEkgKmFsd2F5cyogZG93bmxvYWRzIHRvIGFuIHVudXNlZCBwYXRoK2ZpbGVuYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnI3N0b3JhZ2Utb3B0aW9ucy1wb3B1cCcpLm1vZGFsKCdoaWRlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAgLy8gcHJlc3VtYWJseSAnU1RVRFlfT1RVX01BUFBJTkcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXhhbWluZSBhbmQgYXBwbHkgdGhlc2UgbWFwcGluZ3MgdG8gdGhlIE9UVXMgaW4gdGhlIGN1cnJlbnQgc3R1ZHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobmFtZXNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXJnZU5hbWVzZXREYXRhKCBuYW1lc2V0LCBsb2FkZWRGaWxlTmFtZSwgbGFzdE1vZGlmaWVkRGF0ZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOQiBpZiBpdCBmYWlsZWQgdG8gcGFyc2UsIHdlJ3JlIHNob3dpbmcgYSBkZWF0aWxlZCBlcnJvciBtZXNzYWdlIGFib3ZlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGVycm9yKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiUHJvYmxlbSB1bnppcHBpbmcgXCIrIHppcEVudHJ5Lm5hbWUgK1wiOlxcblwiKyBlLm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRoaW50QXJlYS5odG1sKG1zZykuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7ICAgICAgICAgLy8gZmFpbHVyZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBcIkVycm9yIHJlYWRpbmcgPHN0cm9uZz5cIiArIGZpbGVJbmZvLm5hbWUgKyBcIjwvc3Ryb25nPiEgSXMgdGhpcyBhIHByb3BlciB6aXAgZmlsZT9cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gZXh0cmFjdCBuYW1lc2V0IGZyb20gYSBzaW1wbGUgKG5vbi1aSVApIGZpbGVcbiAgICAgICAgICAgICAgICB2YXIgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgICAgIGZyLm9ubG9hZCA9IGZ1bmN0aW9uKCBldnQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lc2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGRhdGEgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRleHQgPT09ICdCVUxLX1ROUlMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5leHBlY3RlZCBjb250ZXh0ICdCVUxLX1ROUlMnIGZvciBmbGF0LWZpbGUgbmFtZXNldCFcIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7ICAvLyBwcmVzdW1hYmx5ICdTVFVEWV9PVFVfTUFQUElORydcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFRyeSBjb252ZXJzaW9uIHRvIHN0YW5kYXJkIG5hbWVzZXQgSlMgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUYgdGhpcyBmYWlscywgdHJ5IHRvIGltcG9ydCBUU1YvQ1NWLCBsaW5lLWJ5LWxpbmUgdGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBjb252ZXJ0VG9OYW1lc2V0TW9kZWwoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobmFtZXNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4YW1pbmUgYW5kIGFwcGx5IHRoZXNlIG1hcHBpbmdzIHRvIHRoZSBPVFVzIGluIHRoZSBjdXJyZW50IHN0dWR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvYWRlZEZpbGVOYW1lID0gZmlsZUluZm8ubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdE1vZGlmaWVkRGF0ZSA9IGZpbGVJbmZvLmxhc3RNb2RpZmllZERhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VOYW1lc2V0RGF0YSggbmFtZXNldCwgbG9hZGVkRmlsZU5hbWUsIGxhc3RNb2RpZmllZERhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBcIkVycm9yIHJlYWRpbmcgbmFtZXMgZnJvbSA8c3Ryb25nPlwiICsgZmlsZUluZm8ubmFtZSArIFwiPC9zdHJvbmc+ISBQbGVhc2UgY29tcGFyZSBpdCB0byBleGFtcGxlc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZnIucmVhZEFzVGV4dChmaWxlSW5mbyk7ICAvLyBkZWZhdWx0IGVuY29kaW5nIGlzIHV0Zi04XG4gICAgICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBjcmVhdGUgc29tZSBpc29sYXRlZCBvYnNlcnZhYmxlcyAoYXMgZ2xvYmFsIEpTIHZhcnMhKSB1c2VkIHRvIHN1cHBvcnQgb3VyIG1hcHBpbmcgVUlcbnZhciBhdXRvTWFwcGluZ0luUHJvZ3Jlc3MgPSBrby5vYnNlcnZhYmxlKGZhbHNlKTtcbnZhciBjdXJyZW50bHlNYXBwaW5nTmFtZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pOyAvLyBkcml2ZXMgc3Bpbm5lcnMsIGV0Yy5cbnZhciBmYWlsZWRNYXBwaW5nTmFtZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoW10pOyBcbiAgICAvLyBpZ25vcmUgdGhlc2UgdW50aWwgd2UgaGF2ZSBuZXcgbWFwcGluZyBoaW50c1xudmFyIHByb3Bvc2VkTmFtZU1hcHBpbmdzID0ga28ub2JzZXJ2YWJsZSh7fSk7IFxuICAgIC8vIHN0b3JlZCBhbnkgbGFiZWxzIHByb3Bvc2VkIGJ5IHNlcnZlciwga2V5ZWQgYnkgbmFtZSBpZCBbVE9ETz9dXG52YXIgYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIgPSBrby5vYnNlcnZhYmxlKDEpOyAgXG4gICAgLy8gdGhpcyBqdXN0IG51ZGdlcyB0aGUgbGFiZWwtZWRpdGluZyBVSSB0byByZWZyZXNoIVxuXG5cbi8qIFNUQVJUIGNvbnZlcnQgJ09UVScgdG8gJ25hbWUnIHRocm91Z2hvdXQ/ICovXG5cbmZ1bmN0aW9uIGFkanVzdGVkTGFiZWxPckVtcHR5KGxhYmVsKSB7XG4gICAgLy8gV2Ugc2hvdWxkIG9ubHkgZGlzcGxheSBhbiBhZGp1c3RlZCBsYWJlbCBpZiBpdCdzIGNoYW5nZWQgZnJvbSB0aGVcbiAgICAvLyBvcmlnaW5hbDsgb3RoZXJ3aXNlIHJldHVybiBhbiBlbXB0eSBzdHJpbmcuXG4gICAgaWYgKHR5cGVvZihsYWJlbCkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgbGFiZWwgPSBsYWJlbCgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mKGxhYmVsKSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gcHJvYmFibHkgbnVsbCwgbm90aGluZyB0byBzZWUgaGVyZVxuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgdmFyIGFkanVzdGVkID0gYWRqdXN0ZWRMYWJlbChsYWJlbCk7XG4gICAgaWYgKGFkanVzdGVkID09IGxhYmVsKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICByZXR1cm4gYWRqdXN0ZWQ7XG59XG5cbmZ1bmN0aW9uIGFkanVzdGVkTGFiZWwobGFiZWwpIHtcbiAgICAvLyBhcHBseSBhbnkgYWN0aXZlIG5hbWUgbWFwcGluZyBhZGp1c3RtZW50cyB0byB0aGlzIHN0cmluZ1xuICAgIGlmICh0eXBlb2YobGFiZWwpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGxhYmVsID0gbGFiZWwoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZihsYWJlbCkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIHByb2JhYmx5IG51bGxcbiAgICAgICAgcmV0dXJuIGxhYmVsO1xuICAgIH1cbiAgICB2YXIgYWRqdXN0ZWQgPSBsYWJlbDtcbiAgICAvLyBhcHBseSBhbnkgYWN0aXZlIHN1YnNpdHV0aW9ucyBpbiB0aGUgdmlld01kZWxcbiAgICB2YXIgc3ViTGlzdCA9IHZpZXdNb2RlbC5tYXBwaW5nSGludHMuc3Vic3RpdHV0aW9ucygpO1xuICAgICQuZWFjaChzdWJMaXN0LCBmdW5jdGlvbihpLCBzdWJzdCkge1xuICAgICAgICBpZiAoIXN1YnN0LmFjdGl2ZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gc2tpcCB0byBuZXh0IGFkanVzdG1lbnRcbiAgICAgICAgfVxuICAgICAgICB2YXIgb2xkVGV4dCA9IHN1YnN0Lm9sZCgpO1xuICAgICAgICB2YXIgbmV3VGV4dCA9IHN1YnN0Lm5ldygpO1xuICAgICAgICBpZiAoJC50cmltKG9sZFRleHQpID09PSAkLnRyaW0obmV3VGV4dCkgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBza2lwIHRvIG5leHQgYWRqdXN0bWVudFxuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvL3ZhciBwYXR0ZXJuID0gbmV3IFJlZ0V4cChvbGRUZXh0LCAnZycpOyAgLy8gZyA9IHJlcGxhY2UgQUxMIGluc3RhbmNlc1xuICAgICAgICAgICAgLy8gTk8sIHRoaXMgY2F1c2VzIHdlaXJkIHJlcGV0aXRpb24gaW4gY29tbW9uIGNhc2VzXG4gICAgICAgICAgICB2YXIgcGF0dGVybiA9IG5ldyBSZWdFeHAob2xkVGV4dCk7XG4gICAgICAgICAgICBhZGp1c3RlZCA9IGFkanVzdGVkLnJlcGxhY2UocGF0dGVybiwgbmV3VGV4dCk7XG4gICAgICAgICAgICAvLyBjbGVhciBhbnkgc3RhbGUgaW52YWxpZC1yZWdleCBtYXJraW5nIG9uIHRoaXMgZmllbGRcbiAgICAgICAgICAgIHN1YnN0LnZhbGlkKHRydWUpO1xuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIC8vIHRoZXJlJ3MgcHJvYmFibHkgaW52YWxpZCByZWdleCBpbiB0aGUgZmllbGQuLi4gbWFyayBpdCBhbmQgc2tpcFxuICAgICAgICAgICAgc3Vic3QudmFsaWQoZmFsc2UpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGFkanVzdGVkO1xufVxuXG4vLyBrZWVwIHRyYWNrIG9mIHRoZSBsYXN0IChkZSlzZWxlY3RlZCBsaXN0IGl0ZW0gKGl0cyBwb3NpdGlvbilcbnZhciBsYXN0Q2xpY2tlZFRvZ2dsZVBvc2l0aW9uID0gbnVsbDtcbmZ1bmN0aW9uIHRvZ2dsZU1hcHBpbmdGb3JOYW1lKG5hbWUsIGV2dCkge1xuICAgIHZhciAkdG9nZ2xlLCBuZXdTdGF0ZTtcbiAgICAvLyBhbGxvdyB0cmlnZ2VyaW5nIHRoaXMgZnJvbSBhbnl3aGVyZSBpbiB0aGUgcm93XG4gICAgaWYgKCQoZXZ0LnRhcmdldCkuaXMoJzpjaGVja2JveCcpKSB7XG4gICAgICAgICR0b2dnbGUgPSAkKGV2dC50YXJnZXQpO1xuICAgICAgICAvLyBOLkIuIHVzZXIncyBjbGljayAob3IgdGhlIGNhbGxlcikgaGFzIGFscmVhZHkgc2V0IGl0cyBzdGF0ZSFcbiAgICAgICAgbmV3U3RhdGUgPSAkdG9nZ2xlLmlzKCc6Y2hlY2tlZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICR0b2dnbGUgPSAkKGV2dC50YXJnZXQpLmNsb3Nlc3QoJ3RyJykuZmluZCgnaW5wdXQubWFwLXRvZ2dsZScpO1xuICAgICAgICAvLyBjbGlja2luZyBlbHNld2hlcmUgc2hvdWxkIHRvZ2dsZSBjaGVja2JveCBzdGF0ZSFcbiAgICAgICAgbmV3U3RhdGUgPSAhKCR0b2dnbGUuaXMoJzpjaGVja2VkJykpO1xuICAgICAgICBmb3JjZVRvZ2dsZUNoZWNrYm94KCR0b2dnbGUsIG5ld1N0YXRlKTtcbiAgICB9XG4gICAgLy8gYWRkIChvciByZW1vdmUpIGhpZ2hsaWdodCBjb2xvciB0aGF0IHdvcmtzIHdpdGggaG92ZXItY29sb3JcbiAgICAvKiBOLkIuIHRoYXQgdGhpcyBkdXBsaWNhdGVzIHRoZSBlZmZlY3Qgb2YgS25vY2tvdXQgYmluZGluZ3Mgb24gdGhlc2UgdGFibGVcbiAgICAgKiByb3dzISBUaGlzIGlzIGRlbGliZXJhdGUsIHNpbmNlIHdlJ3JlIG9mdGVuIHRvZ2dsaW5nICptYW55KiByb3dzIGF0XG4gICAgICogb25jZSwgc28gd2UgbmVlZCB0byB1cGRhdGUgdmlzdWFsIHN0eWxlIHdoaWxlIHBvc3Rwb25pbmcgYW55IHRpY2tsZXJcbiAgICAgKiBudWRnZSAndGlsIHdlJ3JlIGRvbmUuXG4gICAgICovXG4gICAgaWYgKG5ld1N0YXRlKSB7XG4gICAgICAgICR0b2dnbGUuY2xvc2VzdCgndHInKS5hZGRDbGFzcygnd2FybmluZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICR0b2dnbGUuY2xvc2VzdCgndHInKS5yZW1vdmVDbGFzcygnd2FybmluZycpO1xuICAgIH1cbiAgICAvLyBpZiB0aGlzIGlzIHRoZSBvcmlnaW5hbCBjbGljayBldmVudDsgY2hlY2sgZm9yIGEgcmFuZ2UhXG4gICAgaWYgKHR5cGVvZihldnQuc2hpZnRLZXkpICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBkZXRlcm1pbmUgdGhlIHBvc2l0aW9uIChudGggY2hlY2tib3gpIG9mIHRoaXMgbmFtZSBpbiB0aGUgdmlzaWJsZSBsaXN0XG4gICAgICAgIHZhciAkdmlzaWJsZVRvZ2dsZXMgPSAkdG9nZ2xlLmNsb3Nlc3QoJ3RhYmxlJykuZmluZCgnaW5wdXQubWFwLXRvZ2dsZScpO1xuICAgICAgICB2YXIgbmV3TGlzdFBvc2l0aW9uID0gJC5pbkFycmF5KCAkdG9nZ2xlWzBdLCAkdmlzaWJsZVRvZ2dsZXMpO1xuICAgICAgICBpZiAoZXZ0LnNoaWZ0S2V5ICYmIHR5cGVvZihsYXN0Q2xpY2tlZFRvZ2dsZVBvc2l0aW9uKSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIGZvcmNlTWFwcGluZ0ZvclJhbmdlT2ZOYW1lcyggbmFtZVsnc2VsZWN0ZWRGb3JBY3Rpb24nXSwgbGFzdENsaWNrZWRUb2dnbGVQb3NpdGlvbiwgbmV3TGlzdFBvc2l0aW9uICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW4gYW55IGNhc2UsIG1ha2UgdGhpcyB0aGUgbmV3IHJhbmdlLXN0YXJ0ZXJcbiAgICAgICAgbGFzdENsaWNrZWRUb2dnbGVQb3NpdGlvbiA9IG5ld0xpc3RQb3NpdGlvbjtcbiAgICB9XG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHJldHVybiB0cnVlOyAgLy8gdXBkYXRlIHRoZSBjaGVja2JveFxufVxuZnVuY3Rpb24gZm9yY2VNYXBwaW5nRm9yUmFuZ2VPZk5hbWVzKCBuZXdTdGF0ZSwgcG9zQSwgcG9zQiApIHtcbiAgICAvLyB1cGRhdGUgc2VsZWN0ZWQgc3RhdGUgZm9yIGFsbCBjaGVja2JveGVzIGluIHRoaXMgcmFuZ2VcbiAgICB2YXIgJGFsbE1hcHBpbmdUb2dnbGVzID0gJCgnaW5wdXQubWFwLXRvZ2dsZScpO1xuICAgIHZhciAkdG9nZ2xlc0luUmFuZ2U7XG4gICAgaWYgKHBvc0IgPiBwb3NBKSB7XG4gICAgICAgICR0b2dnbGVzSW5SYW5nZSA9ICRhbGxNYXBwaW5nVG9nZ2xlcy5zbGljZShwb3NBLCBwb3NCKzEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICR0b2dnbGVzSW5SYW5nZSA9ICRhbGxNYXBwaW5nVG9nZ2xlcy5zbGljZShwb3NCLCBwb3NBKzEpO1xuICAgIH1cbiAgICAkdG9nZ2xlc0luUmFuZ2UuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yY2VUb2dnbGVDaGVja2JveCh0aGlzLCBuZXdTdGF0ZSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGZvcmNlVG9nZ2xlQ2hlY2tib3goY2IsIG5ld1N0YXRlKSB7XG4gICAgdmFyICRjYiA9ICQoY2IpO1xuICAgIHN3aXRjaChuZXdTdGF0ZSkge1xuICAgICAgICBjYXNlICh0cnVlKTpcbiAgICAgICAgICAgIGlmICgkY2IuaXMoJzpjaGVja2VkJykgPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAkY2IucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xuICAgICAgICAgICAgICAgICRjYi50cmlnZ2VySGFuZGxlcignY2xpY2snKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIChmYWxzZSk6XG4gICAgICAgICAgICBpZiAoJGNiLmlzKCc6Y2hlY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgJGNiLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgJGNiLnRyaWdnZXJIYW5kbGVyKCdjbGljaycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZm9yY2VUb2dnbGVDaGVja2JveCgpIGludmFsaWQgbmV3U3RhdGUgPFwiKyB0eXBlb2YobmV3U3RhdGUpICtcIj46XCIpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihuZXdTdGF0ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgfVxufVxuZnVuY3Rpb24gdG9nZ2xlQWxsTWFwcGluZ0NoZWNrYm94ZXMoY2IpIHtcbiAgICB2YXIgJGJpZ1RvZ2dsZSA9ICQoY2IpO1xuICAgIHZhciAkYWxsTWFwcGluZ1RvZ2dsZXMgPSAkKCdpbnB1dC5tYXAtdG9nZ2xlJyk7XG4gICAgdmFyIG5ld1N0YXRlID0gJGJpZ1RvZ2dsZS5pcygnOmNoZWNrZWQnKTtcbiAgICAkYWxsTWFwcGluZ1RvZ2dsZXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yY2VUb2dnbGVDaGVja2JveCh0aGlzLCBuZXdTdGF0ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGVkaXROYW1lTGFiZWwobmFtZSwgZXZ0KSB7XG4gICAgdmFyIG5hbWVpZCA9IG5hbWVbJ2lkJ107XG4gICAgdmFyIG9yaWdpbmFsTGFiZWwgPSBuYW1lWydvcmlnaW5hbExhYmVsJ107XG4gICAgbmFtZVsnYWRqdXN0ZWRMYWJlbCddID0gYWRqdXN0ZWRMYWJlbChvcmlnaW5hbExhYmVsKTtcblxuICAgIC8vIE1hcmsgdGhpcyBuYW1lIGFzIHNlbGVjdGVkIGZvciBtYXBwaW5nLlxuICAgIG5hbWVbJ3NlbGVjdGVkRm9yQWN0aW9uJ10gPSB0cnVlO1xuXG4gICAgLy8gSWYgd2UgaGF2ZSBhIHByb3BlciBtb3VzZSBldmVudCwgdHJ5IHRvIG1vdmUgaW5wdXQgZm9jdXMgdG8gdGhpcyBmaWVsZFxuICAgIC8vIGFuZCBwcmUtc2VsZWN0IGl0cyBmdWxsIHRleHQuXG4gICAgLy9cbiAgICAvLyBOLkIuIFRoZXJlJ3MgYSAnaGFzRm9jdXMnIGJpbmRpbmcgd2l0aCBzaW1pbGFyIGJlaGF2aW9yLCBidXQgaXQncyB0cmlja3lcbiAgICAvLyB0byBtYXJrIHRoZSBuZXcgZmllbGQgdnMuIGV4aXN0aW5nIG9uZXM6XG4gICAgLy8gICBodHRwOi8va25vY2tvdXRqcy5jb20vZG9jdW1lbnRhdGlvbi9oYXNmb2N1cy1iaW5kaW5nLmh0bWxcbiAgICBpZiAoJ2N1cnJlbnRUYXJnZXQnIGluIGV2dCkge1xuICAgICAgICAvLyBjYXB0dXJlIHRoZSBjdXJyZW50IHRhYmxlIHJvdyBiZWZvcmUgRE9NIHVwZGF0ZXNcbiAgICAgICAgdmFyICRjdXJyZW50Um93ID0gJChldnQuY3VycmVudFRhcmdldCkuY2xvc2VzdCgndHInKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciAkZWRpdEZpZWxkID0gJGN1cnJlbnRSb3cuZmluZCgnaW5wdXQ6dGV4dCcpO1xuICAgICAgICAgICAgJGVkaXRGaWVsZC5mb2N1cygpLnNlbGVjdCgpO1xuICAgICAgICB9LCA1MCk7XG4gICAgfVxuXG4gICAgLy8gdGhpcyBzaG91bGQgbWFrZSB0aGUgZWRpdG9yIGFwcGVhciAoYWx0ZXJpbmcgdGhlIERPTSlcbiAgICBib2d1c0VkaXRlZExhYmVsQ291bnRlciggYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoKSArIDEpO1xuICAgIG51ZGdlVGlja2xlciggJ05BTUVfTUFQUElOR19ISU5UUycpOyAvLyB0byByZWZyZXNoICdzZWxlY3RlZCcgY2hlY2tib3hcbn1cbmZ1bmN0aW9uIG1vZGlmeUVkaXRlZExhYmVsKG5hbWUpIHtcbiAgICAvLyByZW1vdmUgaXRzIG5hbWUtaWQgZnJvbSBmYWlsZWQtbmFtZSBsaXN0IHdoZW4gdXNlciBtYWtlcyBjaGFuZ2VzXG4gICAgdmFyIG5hbWVpZCA9IG5hbWVbJ2lkJ107XG4gICAgZmFpbGVkTWFwcGluZ05hbWVzLnJlbW92ZShuYW1laWQpO1xuICAgIC8vIG51ZGdlIHRvIHVwZGF0ZSBuYW1lIGxpc3QgaW1tZWRpYXRlbHlcbiAgICBib2d1c0VkaXRlZExhYmVsQ291bnRlciggYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoKSArIDEpO1xuICAgIG51ZGdlQXV0b01hcHBpbmcoKTtcblxuICAgIG51ZGdlVGlja2xlciggJ05BTUVfTUFQUElOR19ISU5UUycpO1xufVxuZnVuY3Rpb24gcmV2ZXJ0TmFtZUxhYmVsKG5hbWUpIHtcbiAgICAvLyB1bmRvZXMgJ2VkaXROYW1lTGFiZWwnLCByZWxlYXNpbmcgYSBsYWJlbCB0byB1c2Ugc2hhcmVkIGhpbnRzXG4gICAgdmFyIG5hbWVpZCA9IG5hbWVbJ2lkJ107XG4gICAgZGVsZXRlIG5hbWVbJ2FkanVzdGVkTGFiZWwnXTtcbiAgICBmYWlsZWRNYXBwaW5nTmFtZXMucmVtb3ZlKG5hbWVpZCApO1xuICAgIC8vIHRoaXMgc2hvdWxkIG1ha2UgdGhlIGVkaXRvciBkaXNhcHBlYXIgYW5kIHJldmVydCBpdHMgYWRqdXN0ZWQgbGFiZWxcbiAgICBib2d1c0VkaXRlZExhYmVsQ291bnRlciggYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoKSArIDEpO1xuICAgIG51ZGdlQXV0b01hcHBpbmcoKTtcbn1cblxuZnVuY3Rpb24gcHJvcG9zZU5hbWVMYWJlbChuYW1laWQsIG1hcHBpbmdJbmZvKSB7XG4gICAgLy8gc3Rhc2ggb25lIChvciBtb3JlKSBtYXBwaW5ncyBhcyBvcHRpb25zIGZvciB0aGlzIG5hbWVcbiAgICBpZiAoJC5pc0FycmF5KCBtYXBwaW5nSW5mbykpIHtcbiAgICAgICAgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF0gPSBrby5vYnNlcnZhYmxlQXJyYXkoIG1hcHBpbmdJbmZvICkuZXh0ZW5kKHsgbm90aWZ5OiAnYWx3YXlzJyB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXSA9IGtvLm9ic2VydmFibGUoIG1hcHBpbmdJbmZvICkuZXh0ZW5kKHsgbm90aWZ5OiAnYWx3YXlzJyB9KTtcbiAgICB9XG4gICAgcHJvcG9zZWROYW1lTWFwcGluZ3MudmFsdWVIYXNNdXRhdGVkKCk7XG4gICAgLy8gdGhpcyBzaG91bGQgbWFrZSB0aGUgZWRpdG9yIGFwcGVhclxufVxuZnVuY3Rpb24gcHJvcG9zZWRNYXBwaW5nKCBuYW1lICkge1xuICAgIGlmICghbmFtZSB8fCB0eXBlb2YgbmFtZVsnaWQnXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJwcm9wb3NlZE1hcHBpbmcoKSBmYWlsZWRcIik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB2YXIgbmFtZWlkID0gbmFtZVsnaWQnXTtcbiAgICB2YXIgYWNjID0gcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF07XG4gICAgcmV0dXJuIGFjYyA/IGFjYygpIDogbnVsbDtcbn1cbmZ1bmN0aW9uIGFwcHJvdmVQcm9wb3NlZE5hbWVMYWJlbChuYW1lKSB7XG4gICAgLy8gdW5kb2VzICdlZGl0TmFtZUxhYmVsJywgcmVsZWFzaW5nIGEgbGFiZWwgdG8gdXNlIHNoYXJlZCBoaW50c1xuICAgIHZhciBuYW1laWQgPSBuYW1lWydpZCddO1xuICAgIHZhciBpdHNNYXBwaW5nSW5mbyA9IHByb3Bvc2VkTmFtZU1hcHBpbmdzKClbIG5hbWVpZCBdO1xuICAgIHZhciBhcHByb3ZlZE1hcHBpbmcgPSAkLmlzRnVuY3Rpb24oaXRzTWFwcGluZ0luZm8pID9cbiAgICAgICAgaXRzTWFwcGluZ0luZm8oKSA6XG4gICAgICAgIGl0c01hcHBpbmdJbmZvO1xuICAgIGlmICgkLmlzQXJyYXkoYXBwcm92ZWRNYXBwaW5nKSkge1xuICAgICAgICAvLyBhcHBseSB0aGUgZmlyc3QgKG9ubHkpIHZhbHVlXG4gICAgICAgIG1hcE5hbWVUb1RheG9uKCBuYW1laWQsIGFwcHJvdmVkTWFwcGluZ1swXSApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGFwcGx5IHRoZSBpbm5lciB2YWx1ZSBvZiBhbiBvYnNlcnZhYmxlIChhY2Nlc3NvcikgZnVuY3Rpb25cbiAgICAgICAgbWFwTmFtZVRvVGF4b24oIG5hbWVpZCwga28udW53cmFwKGFwcHJvdmVkTWFwcGluZykgKTtcbiAgICB9XG4gICAgZGVsZXRlIHByb3Bvc2VkTmFtZU1hcHBpbmdzKClbIG5hbWVpZCBdO1xuICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG4gICAgbnVkZ2VUaWNrbGVyKCAnVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7IC8vIHRvIHJlZnJlc2ggc3RhdHVzIGJhclxufVxuZnVuY3Rpb24gYXBwcm92ZVByb3Bvc2VkTmFtZU1hcHBpbmdPcHRpb24oYXBwcm92ZWRNYXBwaW5nLCBzZWxlY3RlZEluZGV4KSB7XG4gICAgLy8gc2ltaWxhciB0byBhcHByb3ZlUHJvcG9zZWROYW1lTGFiZWwsIGJ1dCBmb3IgYSBsaXN0ZWQgb3B0aW9uXG4gICAgdmFyIG5hbWVpZCA9IGFwcHJvdmVkTWFwcGluZy5uYW1lSUQ7XG4gICAgbWFwTmFtZVRvVGF4b24oIG5hbWVpZCwgYXBwcm92ZWRNYXBwaW5nICk7XG4gICAgZGVsZXRlIHByb3Bvc2VkTmFtZU1hcHBpbmdzKClbIG5hbWVpZCBdO1xuICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG4gICAgbnVkZ2VUaWNrbGVyKCAnVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7IC8vIHRvIHJlZnJlc2ggc3RhdHVzIGJhclxufVxuZnVuY3Rpb24gcmVqZWN0UHJvcG9zZWROYW1lTGFiZWwobmFtZSkge1xuICAgIC8vIHVuZG9lcyAncHJvcG9zZU5hbWVMYWJlbCcsIGNsZWFyaW5nIGl0cyB2YWx1ZVxuICAgIHZhciBuYW1laWQgPSBuYW1lWydpZCddO1xuICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIG51ZGdlVGlja2xlciggJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUycpOyAvLyB0byByZWZyZXNoIHN0YXR1cyBiYXJcbn1cblxuZnVuY3Rpb24gZ2V0QWxsVmlzaWJsZVByb3Bvc2VkTWFwcGluZ3MoKSB7XG4gICAgLy8gZ2F0aGVyIGFueSBwcm9wb3NlZCBtYXBwaW5ncyAoSURzKSB0aGF0IGFyZSB2aXNpYmxlIG9uIHRoaXMgcGFnZVxuICAgIHZhciB2aXNpYmxlUHJvcG9zZWRNYXBwaW5ncyA9IFtdO1xuICAgIHZhciB2aXNpYmxlTmFtZXMgPSB2aWV3TW9kZWwuZmlsdGVyZWROYW1lcygpLnBhZ2VkSXRlbXMoKTtcbiAgICAkLmVhY2goIHZpc2libGVOYW1lcywgZnVuY3Rpb24gKGksIG5hbWUpIHtcbiAgICAgICAgaWYgKHByb3Bvc2VkTWFwcGluZyhuYW1lKSkge1xuICAgICAgICAgICAgLy8gd2UgaGF2ZSBhIHByb3Bvc2VkIG1hcHBpbmcgZm9yIHRoaXMgbmFtZSFcbiAgICAgICAgICAgIHZpc2libGVQcm9wb3NlZE1hcHBpbmdzLnB1c2goIG5hbWVbJ2lkJ10gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB2aXNpYmxlUHJvcG9zZWRNYXBwaW5nczsgLy8gcmV0dXJuIGEgc2VyaWVzIG9mIElEc1xufVxuZnVuY3Rpb24gYXBwcm92ZUFsbFZpc2libGVNYXBwaW5ncygpIHtcbiAgICAkLmVhY2goZ2V0QWxsVmlzaWJsZVByb3Bvc2VkTWFwcGluZ3MoKSwgZnVuY3Rpb24oaSwgbmFtZWlkKSB7XG4gICAgICAgIHZhciBpdHNNYXBwaW5nSW5mbyA9IHByb3Bvc2VkTmFtZU1hcHBpbmdzKClbIG5hbWVpZCBdO1xuICAgICAgICB2YXIgYXBwcm92ZWRNYXBwaW5nID0gJC5pc0Z1bmN0aW9uKGl0c01hcHBpbmdJbmZvKSA/XG4gICAgICAgICAgICBpdHNNYXBwaW5nSW5mbygpIDpcbiAgICAgICAgICAgIGl0c01hcHBpbmdJbmZvO1xuICAgICAgICBpZiAoJC5pc0FycmF5KGFwcHJvdmVkTWFwcGluZykpIHtcbiAgICAgICAgICAgIGlmIChhcHByb3ZlZE1hcHBpbmcubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgLy8gdGVzdCB0aGUgZmlyc3QgKG9ubHkpIHZhbHVlIGZvciBwb3NzaWJsZSBhcHByb3ZhbFxuICAgICAgICAgICAgICAgIHZhciBvbmx5TWFwcGluZyA9IGFwcHJvdmVkTWFwcGluZ1swXTtcbiAgICAgICAgICAgICAgICBpZiAob25seU1hcHBpbmcub3JpZ2luYWxNYXRjaC5pc19zeW5vbnltKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjsgIC8vIHN5bm9ueW1zIHJlcXVpcmUgbWFudWFsIHJldmlld1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiBOLkIuIFdlIG5ldmVyIHByZXNlbnQgdGhlIHNvbGUgbWFwcGluZyBzdWdnZXN0aW9uIGFzIGFcbiAgICAgICAgICAgICAgICAgKiB0YXhvbi1uYW1lIGhvbW9ueW0sIHNvIGp1c3QgY29uc2lkZXIgdGhlIG1hdGNoIHNjb3JlIHRvXG4gICAgICAgICAgICAgICAgICogZGV0ZXJtaW5lIHdoZXRoZXIgaXQncyBhbiBcImV4YWN0IG1hdGNoXCIuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgaWYgKG9ubHlNYXBwaW5nLm9yaWdpbmFsTWF0Y2guc2NvcmUgPCAxLjApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAgLy8gbm9uLWV4YWN0IG1hdGNoZXMgcmVxdWlyZSBtYW51YWwgcmV2aWV3XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHN0aWxsIGhlcmU/IHRoZW4gdGhpcyBtYXBwaW5nIGxvb2tzIGdvb2QgZW5vdWdoIGZvciBhdXRvLWFwcHJvdmFsXG4gICAgICAgICAgICAgICAgZGVsZXRlIHByb3Bvc2VkTmFtZU1hcHBpbmdzKClbIG5hbWVpZCBdO1xuICAgICAgICAgICAgICAgIG1hcE5hbWVUb1RheG9uKCBuYW1laWQsIGFwcHJvdmVkTWFwcGluZ1swXSwge1BPU1RQT05FX1VJX0NIQU5HRVM6IHRydWV9ICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy8gbXVsdGlwbGUgcG9zc2liaWxpdGllcyByZXF1aXJlIG1hbnVhbCByZXZpZXdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGFwcGx5IHRoZSBpbm5lciB2YWx1ZSBvZiBhbiBvYnNlcnZhYmxlIChhY2Nlc3NvcikgZnVuY3Rpb25cbiAgICAgICAgICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICAgICAgICAgIG1hcE5hbWVUb1RheG9uKCBuYW1laWQsIGtvLnVud3JhcChhcHByb3ZlZE1hcHBpbmcpLCB7UE9TVFBPTkVfVUlfQ0hBTkdFUzogdHJ1ZX0gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG4gICAgbnVkZ2VUaWNrbGVyKCAnVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7IC8vIHRvIHJlZnJlc2ggc3RhdHVzIGJhclxuICAgIHN0YXJ0QXV0b01hcHBpbmcoKTtcbn1cbmZ1bmN0aW9uIHJlamVjdEFsbFZpc2libGVNYXBwaW5ncygpIHtcbiAgICAkLmVhY2goZ2V0QWxsVmlzaWJsZVByb3Bvc2VkTWFwcGluZ3MoKSwgZnVuY3Rpb24oaSwgbmFtZWlkKSB7XG4gICAgICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICB9KTtcbiAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICBzdG9wQXV0b01hcHBpbmcoKTtcbiAgICBudWRnZVRpY2tsZXIoICdWSVNJQkxFX05BTUVfTUFQUElOR1MnKTsgLy8gdG8gcmVmcmVzaCBzdGF0dXMgYmFyXG59XG5cbmZ1bmN0aW9uIHVwZGF0ZU1hcHBpbmdTdGF0dXMoKSB7XG4gICAgLy8gdXBkYXRlIG1hcHBpbmcgc3RhdHVzK2RldGFpbHMgYmFzZWQgb24gdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhpbmdzXG4gICAgdmFyIGRldGFpbHNIVE1MLCBzaG93QmF0Y2hBcHByb3ZlLCBzaG93QmF0Y2hSZWplY3QsIG5lZWRzQXR0ZW50aW9uO1xuICAgIC8qIFRPRE86IGRlZmF1bHRzIGFzc3VtZSBub3RoaW5nIHBhcnRpY3VsYXJseSBpbnRlcmVzdGluZyBnb2luZyBvblxuICAgIGRldGFpbHNIVE1MID0gJyc7XG4gICAgc2hvd0JhdGNoQXBwcm92ZSA9IGZhbHNlO1xuICAgIHNob3dCYXRjaFJlamVjdCA9IHRydWU7XG4gICAgbmVlZHNBdHRlbnRpb24gPSBmYWxzZTtcbiAgICAqL1xuICAgIHZhciBwcm9wb3NlZE1hcHBpbmdOZWVkc0RlY2lzaW9uID0gZmFsc2U7XG4gICAgZm9yICh2YXIgcCBpbiBwcm9wb3NlZE5hbWVNYXBwaW5ncygpKSB7XG4gICAgICAgIC8vIHRoZSBwcmVzZW5jZSBvZiBhbnl0aGluZyBoZXJlIG1lYW5zIHRoZXJlIGFyZSBwcm9wb3NlZCBtYXBwaW5nc1xuICAgICAgICBwcm9wb3NlZE1hcHBpbmdOZWVkc0RlY2lzaW9uID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoYXV0b01hcHBpbmdJblByb2dyZXNzKCkgPT09IHRydWUpIHtcbiAgICAgICAgLy8gYXV0by1tYXBwaW5nIGlzIEFDVElWRSAobWVhbmluZyB3ZSBoYXZlIHdvcmsgaW4gaGFuZClcbiAgICAgICAgZGV0YWlsc0hUTUwgPSAnJzsgLy8gJzxwJysnPk1hcHBpbmcgaW4gcHJvZ3Jlc3MuLi48JysnL3A+JztcbiAgICAgICAgc2hvd0JhdGNoQXBwcm92ZSA9IGZhbHNlO1xuICAgICAgICBzaG93QmF0Y2hSZWplY3QgPSBmYWxzZTtcbiAgICAgICAgbmVlZHNBdHRlbnRpb24gPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZ2V0TmV4dFVubWFwcGVkTmFtZSgpKSB7XG4gICAgICAgICAgICAvLyBJRiBhdXRvLW1hcHBpbmcgaXMgUEFVU0VELCBidXQgdGhlcmUncyBtb3JlIHRvIGRvIG9uIHRoaXMgcGFnZVxuICAgICAgICAgICAgZGV0YWlsc0hUTUwgPSAnPHAnKyc+TWFwcGluZyBwYXVzZWQuIFNlbGVjdCBuZXcgbmFtZSBvciBhZGp1c3QgbWFwcGluZyBoaW50cywgdGhlbiBjbGljayB0aGUgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICsnPHN0cm9uZz5NYXAgc2VsZWN0ZWQgbmFtZTwvc3Ryb25nPiBidXR0b24gYWJvdmUgdG8gdHJ5IGFnYWluLjwnKycvcD4nO1xuICAgICAgICAgICAgc2hvd0JhdGNoQXBwcm92ZSA9IGZhbHNlO1xuICAgICAgICAgICAgc2hvd0JhdGNoUmVqZWN0ID0gcHJvcG9zZWRNYXBwaW5nTmVlZHNEZWNpc2lvbjtcbiAgICAgICAgICAgIG5lZWRzQXR0ZW50aW9uID0gcHJvcG9zZWRNYXBwaW5nTmVlZHNEZWNpc2lvbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGF1dG8tbWFwcGluZyBpcyBQQVVTRUQgYW5kIGV2ZXJ5dGhpbmcncyBiZWVuIG1hcHBlZFxuICAgICAgICAgICAgaWYgKHByb3Bvc2VkTWFwcGluZ05lZWRzRGVjaXNpb24pIHtcbiAgICAgICAgICAgICAgICAvLyB0aGVyZSBhcmUgcHJvcG9zZWQgbWFwcGluZ3MgYXdhaXRpbmcgYSBkZWNpc2lvblxuICAgICAgICAgICAgICAgIGRldGFpbHNIVE1MID0gJzxwJysnPkFsbCBzZWxlY3RlZCBuYW1lcyBoYXZlIGJlZW4gbWFwcGVkLiBVc2UgdGhlICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsnPHNwYW4gY2xhc3M9XCJidG4tZ3JvdXBcIiBzdHlsZT1cIm1hcmdpbjogLTJweCAwO1wiPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tb2tcIj48L2k+PC9idXR0b24+J1xuICAgICAgICAgICAgICAgICAgICAgICAgKycgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tbWluaSBkaXNhYmxlZFwiPjxpIGNsYXNzPVwiaWNvbi1yZW1vdmVcIj48L2k+PC9idXR0b24+J1xuICAgICAgICAgICAgICAgICAgICAgICAgKyc8L3NwYW4+J1xuICAgICAgICAgICAgICAgICAgICAgICAgKycgYnV0dG9ucyB0byBhY2NlcHQgb3IgcmVqZWN0IGVhY2ggc3VnZ2VzdGVkIG1hcHBpbmcsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKycgb3IgdGhlIGJ1dHRvbnMgYmVsb3cgdG8gYWNjZXB0IG9yIHJlamVjdCB0aGUgc3VnZ2VzdGlvbnMgZm9yIGFsbCB2aXNpYmxlIG5hbWVzLjwnKycvcD4nO1xuICAgICAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNob3dCYXRjaFJlamVjdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbmVlZHNBdHRlbnRpb24gPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyB0aGVyZSBhcmUgTk8gcHJvcG9zZWQgbWFwcGluZ3MgYXdhaXRpbmcgYSBkZWNpc2lvblxuICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgLyogVE9ETzogY2hlY2sgZm9yIHR3byBwb3NzaWJpbGl0aWVzIGhlcmVcbiAgICAgICAgICAgICAgICBpZiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIGNhbiBhZGQgbW9yZSBieSBpbmNsdWRpbmcgJ0FsbCB0cmVlcydcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsc0hUTUwgPSAnPHAnKyc+PHN0cm9uZz5Db25ncnR1bGF0aW9ucyE8L3N0cm9uZz4gJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnTWFwcGluZyBpcyBzdXNwZW5kZWQgYmVjYXVzZSBhbGwgbmFtZXMgaW4gdGhpcyAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKydzdHVkeVxcJ3Mgbm9taW5hdGVkIHRyZWVzIGhhdmUgYWNjZXB0ZWQgbGFiZWxzIGFscmVhZHkuIFRvIGNvbnRpbnVlLCAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKydyZWplY3Qgc29tZSBtYXBwZWQgbGFiZWxzIHdpdGggdGhlICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJzxzcGFuIGNsYXNzPVwiYnRuLWdyb3VwXCIgc3R5bGU9XCJtYXJnaW46IC0ycHggMDtcIj4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKycgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tbWluaSBkaXNhYmxlZFwiPjxpIGNsYXNzPVwiaWNvbi1yZW1vdmVcIj48L2k+PC9idXR0b24+J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnPC9zcGFuPiAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKydidXR0b24gb3IgY2hhbmdlIHRoZSBmaWx0ZXIgdG8gPHN0cm9uZz5JbiBhbnkgdHJlZTwvc3Ryb25nPi48JysnL3A+JztcbiAgICAgICAgICAgICAgICAgICAgc2hvd0JhdGNoQXBwcm92ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzaG93QmF0Y2hSZWplY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgbmVlZHNBdHRlbnRpb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHdlJ3JlIHRydWx5IGRvbmUgd2l0aCBtYXBwaW5nIChpbiBhbGwgdHJlZXMpXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbHNIVE1MID0gJzxwJysnPjxzdHJvbmc+Q29uZ3J0dWxhdGlvbnMhPC9zdHJvbmc+ICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJ01hcHBpbmcgaXMgc3VzcGVuZGVkIGJlY2F1c2UgYWxsIG5hbWVzIGluIHRoaXMgc3R1ZHkgaGF2ZSBhY2NlcHRlZCAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKydsYWJlbHMgYWxyZWFkeS4uIFRvIGNvbnRpbnVlLCB1c2UgdGhlICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJzxzcGFuIGNsYXNzPVwiYnRuLWdyb3VwXCIgc3R5bGU9XCJtYXJnaW46IC0ycHggMDtcIj4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKycgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tbWluaSBkaXNhYmxlZFwiPjxpIGNsYXNzPVwiaWNvbi1yZW1vdmVcIj48L2k+PC9idXR0b24+J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnPC9zcGFuPidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJyBidXR0b25zIHRvIHJlamVjdCBhbnkgbGFiZWwgYXQgbGVmdC48JysnL3A+JztcbiAgICAgICAgICAgICAgICAgICAgc2hvd0JhdGNoQXBwcm92ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzaG93QmF0Y2hSZWplY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgbmVlZHNBdHRlbnRpb24gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgLyogVE9ETzogcmVwbGFjZSB0aGlzIHN0dWZmIHdpdGggaWYvZWxzZSBibG9jayBhYm92ZVxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGRldGFpbHNIVE1MID0gJzxwJysnPk1hcHBpbmcgaXMgc3VzcGVuZGVkIGJlY2F1c2UgYWxsIHNlbGVjdGVkIG5hbWVzIGhhdmUgYWNjZXB0ZWQgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKycgbGFiZWxzIGFscmVhZHkuIFRvIGNvbnRpbnVlLCBzZWxlY3QgYWRkaXRpb25hbCBuYW1lcyB0byBtYXAsIG9yIHVzZSB0aGUgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKyc8c3BhbiBjbGFzcz1cImJ0bi1ncm91cFwiIHN0eWxlPVwibWFyZ2luOiAtMnB4IDA7XCI+J1xuICAgICAgICAgICAgICAgICAgICAgICAgKycgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tbWluaSBkaXNhYmxlZFwiPjxpIGNsYXNzPVwiaWNvbi1yZW1vdmVcIj48L2k+PC9idXR0b24+J1xuICAgICAgICAgICAgICAgICAgICAgICAgKyc8L3NwYW4+J1xuICAgICAgICAgICAgICAgICAgICAgICAgKycgYnV0dG9ucyB0byByZWplY3QgYW55IGxhYmVsIGF0IGxlZnQsIG9yIGNoYW5nZSB0aGUgZmlsdGVyIGFuZCBzb3J0IG9wdGlvbnMnXG4gICAgICAgICAgICAgICAgICAgICAgICArJyB0byBicmluZyB1bm1hcHBlZCBuYW1lcyBpbnRvIHZpZXcuPCcrJy9wPic7XG4gICAgICAgICAgICAgICAgc2hvd0JhdGNoQXBwcm92ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHNob3dCYXRjaFJlamVjdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIG5lZWRzQXR0ZW50aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgICQoJy5tYXBwaW5nLWRldGFpbHMnKS5odG1sKGRldGFpbHNIVE1MKTtcbiAgICBpZiAoc2hvd0JhdGNoQXBwcm92ZSB8fCBzaG93QmF0Y2hSZWplY3QpIHtcbiAgICAgICAgJCgnLm1hcHBpbmctYmF0Y2gtb3BlcmF0aW9ucycpLnNob3coKTtcbiAgICAgICAgaWYgKHNob3dCYXRjaEFwcHJvdmUpIHtcbiAgICAgICAgICAgICQoJy5tYXBwaW5nLWJhdGNoLW9wZXJhdGlvbnMgI2JhdGNoLWFwcHJvdmUnKS5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zICNiYXRjaC1hcHByb3ZlJykuaGlkZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaG93QmF0Y2hSZWplY3QpIHtcbiAgICAgICAgICAgICQoJy5tYXBwaW5nLWJhdGNoLW9wZXJhdGlvbnMgI2JhdGNoLXJlamVjdCcpLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJy5tYXBwaW5nLWJhdGNoLW9wZXJhdGlvbnMgI2JhdGNoLXJlamVjdCcpLmhpZGUoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgICQoJy5tYXBwaW5nLWJhdGNoLW9wZXJhdGlvbnMnKS5oaWRlKCk7XG4gICAgfVxuICAgIGlmIChuZWVkc0F0dGVudGlvbikge1xuICAgICAgICAkKCcjbWFwcGluZy1zdGF0dXMtcGFuZWwnKS5hZGRDbGFzcygnbWFwcGluZy1uZWVkcy1hdHRlbnRpb24nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkKCcjbWFwcGluZy1zdGF0dXMtcGFuZWwnKS5yZW1vdmVDbGFzcygnbWFwcGluZy1uZWVkcy1hdHRlbnRpb24nKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0QXV0b01hcHBpbmcoKSB7XG4gICAgLy8gYmVnaW4gYSBkYWlzeS1jaGFpbiBvZiBBSkFYIG9wZXJhdGlvbnMsIG1hcHBpbmcgMSBsYWJlbCAob3IgbW9yZT8pIHRvIGtub3duIHRheGFcbiAgICAvLyBUT0RPOiB3aGF0IGlmIHRoZXJlIHdhcyBhIHBlbmRpbmcgb3BlcmF0aW9uIHdoZW4gd2Ugc3RvcHBlZD9cbiAgICBhdXRvTWFwcGluZ0luUHJvZ3Jlc3MoIHRydWUgKTtcbiAgICByZXF1ZXN0VGF4b25NYXBwaW5nKCk7ICAvLyB0cnkgdG8gZ3JhYiB0aGUgZmlyc3QgdW5tYXBwZWQgbGFiZWwgaW4gdmlld1xuICAgIHVwZGF0ZU1hcHBpbmdTdGF0dXMoKTtcbn1cbmZ1bmN0aW9uIHN0b3BBdXRvTWFwcGluZygpIHtcbiAgICAvLyBUT0RPOiB3aGF0IGlmIHRoZXJlJ3MgYW4gb3BlcmF0aW9uIGluIHByb2dyZXNzPyBnZXQgaXRzIHJlc3VsdCwgb3IgZHJvcCBpdD9cbiAgICBhdXRvTWFwcGluZ0luUHJvZ3Jlc3MoIGZhbHNlICk7XG4gICAgY3VycmVudGx5TWFwcGluZ05hbWVzLnJlbW92ZUFsbCgpO1xuICAgIHJlY2VudE1hcHBpbmdTcGVlZEJhckNsYXNzKCAncHJvZ3Jlc3MgcHJvZ3Jlc3MtaW5mbycgKTsgICAvLyBpbmFjdGl2ZSBibHVlIGJhclxuICAgIHVwZGF0ZU1hcHBpbmdTdGF0dXMoKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlTWFwcGluZ1NwZWVkKCBuZXdFbGFwc2VkVGltZSApIHtcbiAgICByZWNlbnRNYXBwaW5nVGltZXMucHVzaChuZXdFbGFwc2VkVGltZSk7XG4gICAgaWYgKHJlY2VudE1hcHBpbmdUaW1lcy5sZW5ndGggPiA1KSB7XG4gICAgICAgIC8vIGtlZXAganVzdCB0aGUgbGFzdCA1IHRpbWVzXG4gICAgICAgIHJlY2VudE1hcHBpbmdUaW1lcyA9IHJlY2VudE1hcHBpbmdUaW1lcy5zbGljZSgtNSk7XG4gICAgfVxuXG4gICAgdmFyIHRvdGFsID0gMDtcbiAgICAkLmVhY2gocmVjZW50TWFwcGluZ1RpbWVzLCBmdW5jdGlvbihpLCB0aW1lKSB7XG4gICAgICAgIHRvdGFsICs9IHRpbWU7XG4gICAgfSk7XG4gICAgdmFyIHJvbGxpbmdBdmVyYWdlID0gdG90YWwgLyByZWNlbnRNYXBwaW5nVGltZXMubGVuZ3RoO1xuICAgIHZhciBzZWNQZXJOYW1lID0gcm9sbGluZ0F2ZXJhZ2UgLyAxMDAwO1xuICAgIC8vIHNob3cgYSBsZWdpYmxlIG51bWJlciAoZmlyc3Qgc2lnbmlmaWNhbnQgZGlnaXQpXG4gICAgdmFyIGRpc3BsYXlTZWM7XG4gICAgaWYgKHNlY1Blck5hbWUgPj0gMC4xKSB7XG4gICAgICAgIGRpc3BsYXlTZWMgPSBzZWNQZXJOYW1lLnRvRml4ZWQoMSk7XG4gICAgfSBlbHNlIGlmIChzZWNQZXJOYW1lID49IDAuMDEpIHtcbiAgICAgICAgZGlzcGxheVNlYyA9IHNlY1Blck5hbWUudG9GaXhlZCgyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBkaXNwbGF5U2VjID0gc2VjUGVyTmFtZS50b0ZpeGVkKDMpO1xuICAgIH1cblxuICAgIHJlY2VudE1hcHBpbmdTcGVlZExhYmVsKCBkaXNwbGF5U2VjICtcIiBzZWMgLyBuYW1lXCIpO1xuXG4gICAgLy8gdXNlIGFyYml0cmFyeSBzcGVlZHMgaGVyZSwgZm9yIGJhZC9mYWlyL2dvb2RcbiAgICBpZiAoc2VjUGVyTmFtZSA8IDAuMikge1xuICAgICAgICByZWNlbnRNYXBwaW5nU3BlZWRCYXJDbGFzcyggJ3Byb2dyZXNzIHByb2dyZXNzLXN1Y2Nlc3MnICk7ICAvLyBncmVlbiBiYXJcbiAgICB9IGVsc2UgaWYgKHNlY1Blck5hbWUgPCAyLjApIHtcbiAgICAgICAgcmVjZW50TWFwcGluZ1NwZWVkQmFyQ2xhc3MoICdwcm9ncmVzcyBwcm9ncmVzcy13YXJuaW5nJyApOyAgLy8gb3JhbmdlIGJhclxuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlY2VudE1hcHBpbmdTcGVlZEJhckNsYXNzKCAncHJvZ3Jlc3MgcHJvZ3Jlc3MtZGFuZ2VyJyApOyAgIC8vIHJlZCBiYXJcbiAgICB9XG5cbiAgICAvLyBiYXIgd2lkdGggaXMgYXBwcm94aW1hdGUsIG5lZWRzIH40MCUgdG8gc2hvdyBpdHMgdGV4dFxuICAgIHJlY2VudE1hcHBpbmdTcGVlZFBlcmNlbnQoICg0MCArIE1hdGgubWluKCAoMC4xIC8gc2VjUGVyTmFtZSkgKiA2MCwgNjApKS50b0ZpeGVkKCkgK1wiJVwiICk7XG59XG5cblxuZnVuY3Rpb24gZ2V0TmV4dFVubWFwcGVkTmFtZSgpIHtcbiAgICB2YXIgdW5tYXBwZWROYW1lID0gbnVsbDtcbiAgICB2YXIgdmlzaWJsZU5hbWVzID0gdmlld01vZGVsLmZpbHRlcmVkTmFtZXMoKS5wYWdlZEl0ZW1zKCk7XG4gICAgJC5lYWNoKCB2aXNpYmxlTmFtZXMsIGZ1bmN0aW9uIChpLCBuYW1lKSB7XG4gICAgICAgIHZhciBpc0F2YWlsYWJsZSA9IG5hbWVbJ3NlbGVjdGVkRm9yQWN0aW9uJ10gfHwgZmFsc2U7XG4gICAgICAgIC8vIGlmIG5vIHN1Y2ggYXR0cmlidXRlLCBjb25zaWRlciBpdCB1bmF2YWlsYWJsZVxuICAgICAgICBpZiAoaXNBdmFpbGFibGUpIHtcbiAgICAgICAgICAgIHZhciBvdHRNYXBwaW5nVGFnID0gbmFtZVsnb3R0SWQnXSB8fCBudWxsO1xuICAgICAgICAgICAgdmFyIHByb3Bvc2VkTWFwcGluZ0luZm8gPSBwcm9wb3NlZE1hcHBpbmcobmFtZSk7XG4gICAgICAgICAgICBpZiAoIW90dE1hcHBpbmdUYWcgJiYgIXByb3Bvc2VkTWFwcGluZ0luZm8pIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGFuIHVubWFwcGVkIG5hbWUhXG4gICAgICAgICAgICAgICAgaWYgKGZhaWxlZE1hcHBpbmdOYW1lcy5pbmRleE9mKG5hbWVbJ2lkJ10pID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBpdCBoYXNuJ3QgZmFpbGVkIG1hcHBpbmcgKGF0IGxlYXN0IG5vdCB5ZXQpXG4gICAgICAgICAgICAgICAgICAgIHVubWFwcGVkTmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdW5tYXBwZWROYW1lO1xufVxuXG4vKiBUTlJTIHJlcXVlc3RzIGFyZSBzZW50IHZpYSBQT1NUIGFuZCBjYW5ub3QgYmUgY2FjaGVkIGJ5IHRoZSBicm93c2VyLiBLZWVwXG4gKiB0cmFjayBvZiByZXNwb25zZXMgaW4gYSBzaW1wbGUgbG9jYWwgY2FjaGUsIHRvIGF2b2lkIGV4dHJhIHJlcXVlc3RzIGZvclxuICogaWRlbnRpY2FsIHRheG9uIG5hbWVzLiAoVGhpcyBpcyBjb21tb24gd2hlbiBtYW55IHNpbWlsYXIgbGFiZWxzIGhhdmUgYmVlblxuICogXCJtb2RpZmllZCBmb3IgbWFwcGluZ1wiKS5cbiAqXG4gKiBXZSdsbCB1c2UgYSBGSUZPIHN0cmF0ZWd5IHRvIGtlZXAgdGhpcyB0byBhIHJlYXNvbmFibGUgc2l6ZS4gSSBiZWxpZXZlIHRoaXNcbiAqIHdpbGwgaGFuZGxlIHRoZSBleHBlY3RlZCBjYXNlIG9mIG1hbnkgbGFiZWxzIGJlaW5nIG1vZGlmaWVkIHRvIHRoZSBzYW1lXG4gKiBzdHJpbmcuXG4gKi9cbnZhciBUTlJTQ2FjaGVTaXplID0gMjAwO1xudmFyIFROUlNDYWNoZSA9IHt9O1xudmFyIFROUlNDYWNoZUtleXMgPSBbXTtcbmZ1bmN0aW9uIGFkZFRvVE5SU0NhY2hlKCBrZXksIHZhbHVlICkge1xuICAgIC8vIGFkZCAob3IgdXBkYXRlKSB0aGUgY2FjaGUgZm9yIHRoaXMga2V5XG4gICAgaWYgKCEoa2V5IGluIFROUlNDYWNoZSkpIHtcbiAgICAgICAgVE5SU0NhY2hlS2V5cy5wdXNoKCBrZXkgKTtcbiAgICB9XG4gICAgVE5SU0NhY2hlWyBrZXkgXSA9IHZhbHVlO1xuICAgIGlmIChUTlJTQ2FjaGVLZXlzLmxlbmd0aCA+IFROUlNDYWNoZVNpemUpIHtcbiAgICAgICAgLy8gY2xlYXIgdGhlIG9sZGVzdCBjYWNoZWQgaXRlbVxuICAgICAgICB2YXIgZG9vbWVkS2V5ID0gVE5SU0NhY2hlS2V5cy5zaGlmdCgpO1xuICAgICAgICBkZWxldGUgVE5SU0NhY2hlWyBkb29tZWRLZXkgXTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coVE5SU0NhY2hlKTtcbn1cbmZ1bmN0aW9uIGNsZWFyVE5SU0NhY2hlKCkge1xuICAgIFROUlNDYWNoZSA9IHt9O1xufTtcblxuZnVuY3Rpb24gcmVxdWVzdFRheG9uTWFwcGluZyggbmFtZVRvTWFwICkge1xuICAgIC8vIHNldCBzcGlubmVyLCBtYWtlIHJlcXVlc3QsIGhhbmRsZSByZXNwb25zZSwgYW5kIGRhaXN5LWNoYWluIHRoZSBuZXh0IHJlcXVlc3RcbiAgICAvLyBUT0RPOiBzZW5kIG9uZSBhdCBhIHRpbWU/IG9yIGluIGEgYmF0Y2ggKDUgaXRlbXMpP1xuXG4gICAgLy8gTk9URSB0aGF0IHdlIG1pZ2h0IGJlIHJlcXVlc3RpbmcgYSBzaW5nbGUgbmFtZSwgZWxzZSBmaW5kIHRoZSBuZXh0IHVubWFwcGVkIG9uZVxuICAgIHZhciBzaW5nbGVUYXhvbk1hcHBpbmc7XG4gICAgaWYgKG5hbWVUb01hcCkge1xuICAgICAgICBzaW5nbGVUYXhvbk1hcHBpbmcgPSB0cnVlO1xuICAgICAgICBmYWlsZWRNYXBwaW5nTmFtZXMucmVtb3ZlKG5hbWVUb01hcFsnaWQnXSApO1xuICAgICAgICBhdXRvTWFwcGluZ0luUHJvZ3Jlc3MoIHRydWUgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW5nbGVUYXhvbk1hcHBpbmcgPSBmYWxzZTtcbiAgICAgICAgbmFtZVRvTWFwID0gZ2V0TmV4dFVubWFwcGVkTmFtZSgpO1xuICAgIH1cbiAgICBpZiAoIW5hbWVUb01hcCkge1xuICAgICAgICBzdG9wQXV0b01hcHBpbmcoKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHVwZGF0ZU1hcHBpbmdTdGF0dXMoKTtcbiAgICB2YXIgbmFtZUlEID0gbmFtZVRvTWFwWydpZCddO1xuICAgIHZhciBvcmlnaW5hbExhYmVsID0gJC50cmltKG5hbWVUb01hcFsnb3JpZ2luYWxMYWJlbCddKSB8fCBudWxsO1xuICAgIC8vIHVzZSB0aGUgbWFudWFsbHkgZWRpdGVkIGxhYmVsIChpZiBhbnkpLCBvciB0aGUgaGludC1hZGp1c3RlZCB2ZXJzaW9uXG4gICAgdmFyIGVkaXRlZExhYmVsID0gJC50cmltKG5hbWVUb01hcFsnYWRqdXN0ZWRMYWJlbCddKTtcbiAgICB2YXIgc2VhcmNoVGV4dCA9IChlZGl0ZWRMYWJlbCAhPT0gJycpID8gZWRpdGVkTGFiZWwgOiAkLnRyaW0oYWRqdXN0ZWRMYWJlbChvcmlnaW5hbExhYmVsKSk7XG5cbiAgICBpZiAoc2VhcmNoVGV4dC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJObyBuYW1lIHRvIG1hdGNoIVwiKTsgLy8gVE9ET1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChzZWFyY2hUZXh0Lmxlbmd0aCA8IDIpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJOZWVkIGF0IGxlYXN0IHR3byBsZXR0ZXJzIVwiKTsgLy8gVE9ET1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gZ3Jvb20gdHJpbW1lZCB0ZXh0IGJhc2VkIG9uIG91ciBzZWFyY2ggcnVsZXNcbiAgICB2YXIgc2VhcmNoQ29udGV4dE5hbWUgPSB2aWV3TW9kZWwubWFwcGluZ0hpbnRzLnNlYXJjaENvbnRleHQoKTtcbiAgICB2YXIgdXNpbmdGdXp6eU1hdGNoaW5nID0gdmlld01vZGVsLm1hcHBpbmdIaW50cy51c2VGdXp6eU1hdGNoaW5nKCkgfHwgZmFsc2U7XG4gICAgdmFyIGF1dG9BY2NlcHRpbmdFeGFjdE1hdGNoZXMgPSB2aWV3TW9kZWwubWFwcGluZ0hpbnRzLmF1dG9BY2NlcHRFeGFjdE1hdGNoZXMoKSB8fCBmYWxzZTtcbiAgICAvLyBzaG93IHNwaW5uZXIgYWxvbmdzaWRlIHRoaXMgaXRlbS4uLlxuICAgIGN1cnJlbnRseU1hcHBpbmdOYW1lcy5wdXNoKCBuYW1lSUQgKTtcblxuICAgIHZhciBtYXBwaW5nU3RhcnRUaW1lID0gbmV3IERhdGUoKTtcblxuICAgIGZ1bmN0aW9uIHRucnNTdWNjZXNzKGRhdGEpIHtcbiAgICAgICAgLy8gSUYgdGhlcmUncyBhIHByb3BlciByZXNwb25zZSwgYXNzZXJ0IHRoaXMgYXMgdGhlIG5hbWUgYW5kIGxhYmVsIGZvciB0aGlzIG5vZGVcblxuICAgICAgICAvLyB1cGRhdGUgdGhlIHJvbGxpbmcgYXZlcmFnZSBmb3IgdGhlIG1hcHBpbmctc3BlZWQgYmFyXG4gICAgICAgIHZhciBtYXBwaW5nU3RvcFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB1cGRhdGVNYXBwaW5nU3BlZWQoIG1hcHBpbmdTdG9wVGltZS5nZXRUaW1lKCkgLSBtYXBwaW5nU3RhcnRUaW1lLmdldFRpbWUoKSApO1xuXG4gICAgICAgIHZhciBtYXhSZXN1bHRzID0gMTAwO1xuICAgICAgICB2YXIgdmlzaWJsZVJlc3VsdHMgPSAwO1xuICAgICAgICB2YXIgcmVzdWx0U2V0c0ZvdW5kID0gKGRhdGEgJiYgKCdyZXN1bHRzJyBpbiBkYXRhKSAmJiAoZGF0YS5yZXN1bHRzLmxlbmd0aCA+IDApKTtcbiAgICAgICAgdmFyIGNhbmRpZGF0ZU1hdGNoZXMgPSBbIF07XG4gICAgICAgIC8vIEZvciBub3csIHdlIHdhbnQgdG8gYXV0by1hcHBseSBpZiB0aGVyZSdzIGV4YWN0bHkgb25lIG1hdGNoXG4gICAgICAgIGlmIChyZXN1bHRTZXRzRm91bmQpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoZGF0YS5yZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdOTyBTRUFSQ0ggUkVTVUxUIFNFVFMgRk9VTkQhJyk7XG4gICAgICAgICAgICAgICAgICAgIGNhbmRpZGF0ZU1hdGNoZXMgPSBbIF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZXhwZWN0ZWQgY2FzZVxuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVNYXRjaGVzID0gZGF0YS5yZXN1bHRzWzBdLm1hdGNoZXMgfHwgWyBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTVVMVElQTEUgU0VBUkNIIFJFU1VMVCBTRVRTIChVU0lORyBGSVJTVCknKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGRhdGFbJ3Jlc3VsdHMnXSk7XG4gICAgICAgICAgICAgICAgICAgIGNhbmRpZGF0ZU1hdGNoZXMgPSBkYXRhLnJlc3VsdHNbMF0ubWF0Y2hlcyB8fCBbIF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogRmlsdGVyIGNhbmRpZGF0ZSBtYXRjaGVzIGJhc2VkIG9uIHRoZWlyIHByb3BlcnRpZXMsIHNjb3JlcywgZXRjLj9cblxuICAgICAgICBzd2l0Y2ggKGNhbmRpZGF0ZU1hdGNoZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgZmFpbGVkTWFwcGluZ05hbWVzLnB1c2goIG5hbWVJRCApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAvKiBTS0lQUElORyBUSElTIHRvIHByb3ZpZGUgdW5pZm9ybSB0cmVhdG1lbnQgb2YgYWxsIG1hdGNoZXNcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAvLyBjaG9vc2UgdGhlIGZpcnN0K29ubHkgbWF0Y2ggYXV0b21hdGljYWxseSFcbiAgICAgICAgICAgICAgICAuLi5cbiAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIG11bHRpcGxlIG1hdGNoZXMgZm91bmQsIG9mZmVyIGEgY2hvaWNlXG4gICAgICAgICAgICAgICAgLy8gQVNTVU1FUyB3ZSBvbmx5IGdldCBvbmUgcmVzdWx0IHNldCwgd2l0aCBuIG1hdGNoZXNcblxuICAgICAgICAgICAgICAgIC8vIFRPRE86IFNvcnQgbWF0Y2hlcyBiYXNlZCBvbiBleGFjdCB0ZXh0IG1hdGNoZXM/IGZyYWN0aW9uYWwgKG1hdGNoaW5nKSBzY29yZXM/IHN5bm9ueW1zIG9yIGhvbW9ueW1zP1xuICAgICAgICAgICAgICAgIC8qIGluaXRpYWwgc29ydCBvbiBsb3dlciB0YXhhICh3aWxsIGJlIG92ZXJyaWRkZW4gYnkgZXhhY3QgbWF0Y2hlcylcbiAgICAgICAgICAgICAgICBjYW5kaWRhdGVNYXRjaGVzLnNvcnQoZnVuY3Rpb24oYSxiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhLmlzX2FwcHJveGltYXRlX21hdGNoID09PSBiLmlzX2FwcHJveGltYXRlX21hdGNoKSByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGEuaXNfYXBwcm94aW1hdGVfbWF0Y2gpIHJldHVybiAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYi5pc19hcHByb3hpbWF0ZV9tYXRjaCkgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICovXG5cbiAgICAgICAgICAgICAgICAvKiBUT0RPOiBJZiBtdWx0aXBsZSBtYXRjaGVzIHBvaW50IHRvIGEgc2luZ2xlIHRheG9uLCBzaG93IGp1c3QgdGhlIFwiYmVzdFwiIG1hdGNoXG4gICAgICAgICAgICAgICAgICogICAtIFNwZWxsaW5nIGNvdW50cyEgU2hvdyBhbiBleGFjdCBtYXRjaCAoZS5nLiBzeW5vbnltKSB2cy4gaW5leGFjdCBzcGVsbGluZy5cbiAgICAgICAgICAgICAgICAgKiAgIC0gVE9ETzogYWRkIG1vcmUgcnVsZXM/IG9yIGp1c3QgY29tbWVudCB0aGUgY29kZSBiZWxvd1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHZhciBnZXRQcmVmZXJyZWRUYXhvbkNhbmRpZGF0ZSA9IGZ1bmN0aW9uKCBjYW5kaWRhdGVBLCBjYW5kaWRhdGVCICkge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gd2hpY2hldmVyIGlzIHByZWZlcnJlZCwgYmFzZWQgb24gYSBmZXcgY3JpdGVyaWE6XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXRjaEEgPSBjYW5kaWRhdGVBLm9yaWdpbmFsTWF0Y2g7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXRjaEIgPSBjYW5kaWRhdGVCLm9yaWdpbmFsTWF0Y2g7XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIG9uZSBpcyB0aGUgZXhhY3QgbWF0Y2gsIHRoYXQncyBpZGVhbCAoYnV0IHVubGlrZWx5IHNpbmNlIFxuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgVE5SUyBhcHBhcmVudGx5IHJldHVybmVkIG11bHRpcGxlIGNhbmRpZGF0ZXMpLlxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoQS5pc19hcHByb3hpbWF0ZV9tYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZUE7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1hdGNoQi5pc19hcHByb3hpbWF0ZV9tYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZUI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvdyB0aGUgbW9zdCBzaW1pbGFyIG5hbWUgKG9yIHN5bm9ueW0pIGZvciB0aGlzIHRheG9uLlxuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hBLnNjb3JlID4gbWF0Y2hCLnNjb3JlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlQTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlQjtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBnZXRQcmlvck1hdGNoaW5nQ2FuZGlkYXRlID0gZnVuY3Rpb24oIG90dElkLCBwcmlvckNhbmRpZGF0ZXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiBhbnkgbWF0Y2ggd2UndmUgYWxyZWFkeSBleGFtaW5lZCBmb3IgdGhpcyB0YXhvblxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJpb3JNYXRjaCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChwcmlvckNhbmRpZGF0ZXMsIGZ1bmN0aW9uKGksIGMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjLm90dElkID09PSBvdHRJZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW9yTWF0Y2ggPSBjO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgIC8vIHRoZXJlIHNob3VsZCBiZSBqdXN0IG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByaW9yTWF0Y2g7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgcmF3TWF0Y2hUb0NhbmRpZGF0ZSA9IGZ1bmN0aW9uKCByYXcsIG5hbWVJRCApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2ltcGxpZnkgdGhlIFwicmF3XCIgbWF0Y2hlcyByZXR1cm5lZCBieSBUTlJTXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiByYXcudGF4b25bJ3VuaXF1ZV9uYW1lJ10gfHwgcmF3LnRheG9uWyduYW1lJ10sICAgICAgIC8vIG1hdGNoZWQgbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgb3R0SWQ6IHJhdy50YXhvblsnb3R0X2lkJ10sICAgICAvLyBtYXRjaGVkIE9UVCBpZCAoYXMgbnVtYmVyISlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRheG9ub21pY1NvdXJjZXM6IHJhdy50YXhvblsndGF4X3NvdXJjZXMnXSwgICAvLyBcInVwc3RyZWFtXCIgdGF4b25vbWllc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9leGFjdDogZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJvb2xlYW4gKGlnbm9yaW5nIHRoaXMgZm9yIG5vdylcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vaGlnaGVyOiBmYWxzZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBib29sZWFuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBVc2UgZmxhZ3MgZm9yIHRoaXMgPyBoaWdoZXI6ICgkLmluQXJyYXkoJ1NJQkxJTkdfSElHSEVSJywgcmVzdWx0VG9NYXAuZmxhZ3MpID09PSAtMSkgPyBmYWxzZSA6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsTWF0Y2g6IHJhdyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVJRDogbmFtZUlEXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjYW5kaWRhdGVNYXBwaW5nTGlzdCA9IFsgXTtcbiAgICAgICAgICAgICAgICAkLmVhY2goY2FuZGlkYXRlTWF0Y2hlcywgZnVuY3Rpb24oaSwgbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29udmVydCB0byBleHBlY3RlZCBzdHJ1Y3R1cmUgZm9yIHByb3Bvc2VkIG1hcHBpbmdzXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYW5kaWRhdGUgPSByYXdNYXRjaFRvQ2FuZGlkYXRlKCBtYXRjaCwgbmFtZUlEICk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmlvclRheG9uQ2FuZGlkYXRlID0gZ2V0UHJpb3JNYXRjaGluZ0NhbmRpZGF0ZSggY2FuZGlkYXRlLm90dElkLCBjYW5kaWRhdGVNYXBwaW5nTGlzdCApO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJpb3JUYXhvbkNhbmRpZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByaW9yUG9zaXRpb24gPSAkLmluQXJyYXkocHJpb3JUYXhvbkNhbmRpZGF0ZSwgY2FuZGlkYXRlTWFwcGluZ0xpc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZWZlcnJlZENhbmRpZGF0ZSA9IGdldFByZWZlcnJlZFRheG9uQ2FuZGlkYXRlKCBjYW5kaWRhdGUsIHByaW9yVGF4b25DYW5kaWRhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhbHRlcm5hdGVDYW5kaWRhdGUgPSAocHJlZmVycmVkQ2FuZGlkYXRlID09PSBjYW5kaWRhdGUpID8gcHJpb3JUYXhvbkNhbmRpZGF0ZSA6IGNhbmRpZGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdoaWNoZXZlciBvbmUgd2FzIGNob3NlbiB3aWxsIChyZSl0YWtlIHRoaXMgcGxhY2UgaW4gb3VyIGFycmF5XG4gICAgICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVNYXBwaW5nTGlzdC5zcGxpY2UocHJpb3JQb3NpdGlvbiwgMSwgcHJlZmVycmVkQ2FuZGlkYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBvdGhlciBjYW5kaWRhdGUgd2lsbCBiZSBzdGFzaGVkIGFzIGEgY2hpbGQsIGluIGNhc2Ugd2UgbmVlZCBpdCBsYXRlclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCdhbHRlcm5hdGVUYXhvbkNhbmRpZGF0ZXMnIGluIHByZWZlcnJlZENhbmRpZGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZlcnJlZENhbmRpZGF0ZS5hbHRlcm5hdGVUYXhvbkNhbmRpZGF0ZXMucHVzaCggYWx0ZXJuYXRlQ2FuZGlkYXRlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZlcnJlZENhbmRpZGF0ZS5hbHRlcm5hdGVUYXhvbkNhbmRpZGF0ZXMgPSBbIGFsdGVybmF0ZUNhbmRpZGF0ZSBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FuZGlkYXRlTWFwcGluZ0xpc3QucHVzaChjYW5kaWRhdGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgYXV0b0FjY2VwdGFibGVNYXBwaW5nID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoY2FuZGlkYXRlTWFwcGluZ0xpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbmx5TWFwcGluZyA9IGNhbmRpZGF0ZU1hcHBpbmdMaXN0WzBdO1xuICAgICAgICAgICAgICAgICAgICAvKiBOQiAtIGF1dG8tYWNjZXB0IGluY2x1ZGVzIHN5bm9ueW1zIGlmIGV4YWN0IG1hdGNoIVxuICAgICAgICAgICAgICAgICAgICBpZiAob25seU1hcHBpbmcub3JpZ2luYWxNYXRjaC5pc19zeW5vbnltKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgLyogTi5CLiBXZSBuZXZlciBwcmVzZW50IHRoZSBzb2xlIG1hcHBpbmcgc3VnZ2VzdGlvbiBhcyBhXG4gICAgICAgICAgICAgICAgICAgICAqIHRheG9uLW5hbWUgaG9tb255bSwgc28ganVzdCBjb25zaWRlciB0aGUgbWF0Y2ggc2NvcmUgdG9cbiAgICAgICAgICAgICAgICAgICAgICogZGV0ZXJtaW5lIHdoZXRoZXIgaXQncyBhbiBcImV4YWN0IG1hdGNoXCIuXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBpZiAob25seU1hcHBpbmcub3JpZ2luYWxNYXRjaC5zY29yZSA9PT0gMS4wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdXRvQWNjZXB0YWJsZU1hcHBpbmcgPSBvbmx5TWFwcGluZztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXV0b0FjY2VwdGluZ0V4YWN0TWF0Y2hlcyAmJiBhdXRvQWNjZXB0YWJsZU1hcHBpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWNjZXB0IHRoZSBvYnZpb3VzIGNob2ljZSAoYW5kIHBvc3NpYmx5IHVwZGF0ZSBVSSkgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICAgICAgbWFwTmFtZVRvVGF4b24oIG5hbWVJRCwgYXV0b0FjY2VwdGFibGVNYXBwaW5nLCB7UE9TVFBPTkVfVUlfQ0hBTkdFUzogdHJ1ZX0gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBwb3N0cG9uZSBhY3R1YWwgbWFwcGluZyB1bnRpbCB1c2VyIGNob29zZXNcbiAgICAgICAgICAgICAgICAgICAgcHJvcG9zZU5hbWVMYWJlbChuYW1lSUQsIGNhbmRpZGF0ZU1hcHBpbmdMaXN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjdXJyZW50bHlNYXBwaW5nTmFtZXMucmVtb3ZlKCBuYW1lSUQgKTtcblxuICAgICAgICBpZiAoc2luZ2xlVGF4b25NYXBwaW5nKSB7XG4gICAgICAgICAgICBzdG9wQXV0b01hcHBpbmcoKTtcbiAgICAgICAgfSBlbHNlIGlmIChhdXRvTWFwcGluZ0luUHJvZ3Jlc3MoKSkge1xuICAgICAgICAgICAgLy8gYWZ0ZXIgYSBicmllZiBwYXVzZSwgdHJ5IGZvciB0aGUgbmV4dCBhdmFpbGFibGUgbmFtZS4uLlxuICAgICAgICAgICAgc2V0VGltZW91dChyZXF1ZXN0VGF4b25NYXBwaW5nLCAxMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIFROUlNRdWVyeUFuZENhY2hlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBcIm5hbWVzXCI6IFtzZWFyY2hUZXh0XSxcbiAgICAgICAgXCJpbmNsdWRlX3N1cHByZXNzZWRcIjogZmFsc2UsXG4gICAgICAgIFwiZG9fYXBwcm94aW1hdGVfbWF0Y2hpbmdcIjogKHNpbmdsZVRheG9uTWFwcGluZyB8fCB1c2luZ0Z1enp5TWF0Y2hpbmcpID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICBcImNvbnRleHRfbmFtZVwiOiBzZWFyY2hDb250ZXh0TmFtZVxuICAgIH0pO1xuXG4gICAgJC5hamF4KHtcbiAgICAgICAgdXJsOiBkb1ROUlNGb3JNYXBwaW5nT1RVc191cmwsICAvLyBOT1RFIHRoYXQgYWN0dWFsIHNlcnZlci1zaWRlIG1ldGhvZCBuYW1lIG1pZ2h0IGJlIHF1aXRlIGRpZmZlcmVudCFcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICBkYXRhOiBUTlJTUXVlcnlBbmRDYWNoZUtleSwgIC8vIGRhdGEgKGFzdGVyaXNrIHJlcXVpcmVkIGZvciBjb21wbGV0aW9uIHN1Z2dlc3Rpb25zKVxuICAgICAgICBjcm9zc0RvbWFpbjogdHJ1ZSxcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICAgICAgICBiZWZvcmVTZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBjaGVjayBvdXIgbG9jYWwgY2FjaGUgdG8gc2VlIGlmIHRoaXMgaXMgYSByZXBlYXRcbiAgICAgICAgICAgIHZhciBjYWNoZWRSZXNwb25zZSA9IFROUlNDYWNoZVsgVE5SU1F1ZXJ5QW5kQ2FjaGVLZXkgXTtcbiAgICAgICAgICAgIGlmIChjYWNoZWRSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHRucnNTdWNjZXNzKCBjYWNoZWRSZXNwb25zZSApO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBlcnJvcjogZnVuY3Rpb24oanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiISEhIHNvbWV0aGlueSB3ZW50IHRlcnJpYmx5IHdyb25nXCIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coanFYSFIucmVzcG9uc2VUZXh0KTtcblxuICAgICAgICAgICAgc2hvd0Vycm9yTWVzc2FnZShcIlNvbWV0aGluZyB3ZW50IHdyb25nIGluIHRheG9tYWNoaW5lOlxcblwiKyBqcVhIUi5yZXNwb25zZVRleHQpO1xuXG4gICAgICAgICAgICBpZiAoIWF1dG9NYXBwaW5nSW5Qcm9ncmVzcygpKSB7XG4gICAgICAgICAgICAgICAgLy8gY3VyYXRvciBoYXMgcGF1c2VkIGFsbCBtYXBwaW5nXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjdXJyZW50bHlNYXBwaW5nTmFtZXMucmVtb3ZlKCBuYW1lSUQgKTtcblxuICAgICAgICAgICAgLy8gbGV0J3MgaG9wZSBpdCdzIHNvbWV0aGluZyBhYm91dCB0aGlzIGxhYmVsIGFuZCB0cnkgdGhlIG5leHQgb25lLi4uXG4gICAgICAgICAgICBmYWlsZWRNYXBwaW5nTmFtZXMucHVzaCggbmFtZUlEICk7XG4gICAgICAgICAgICBpZiAoc2luZ2xlVGF4b25NYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgc3RvcEF1dG9NYXBwaW5nKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGF1dG9NYXBwaW5nSW5Qcm9ncmVzcygpKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChyZXF1ZXN0VGF4b25NYXBwaW5nLCAxMDApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIC8vIGFkZCB0aGlzIHJlc3BvbnNlIHRvIHRoZSBsb2NhbCBjYWNoZVxuICAgICAgICAgICAgYWRkVG9UTlJTQ2FjaGUoIFROUlNRdWVyeUFuZENhY2hlS2V5LCBkYXRhICk7XG4gICAgICAgICAgICB0bnJzU3VjY2VzcyhkYXRhKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBnZXROYW1lQnlJRChpZCkge1xuICAgIC8vIHJldHVybiB0aGUgbWF0Y2hpbmcgb3R1LCBvciBudWxsIGlmIG5vdCBmb3VuZFxuICAgIHZhciBtYXRjaGluZ05hbWUgPSBudWxsO1xuICAgICQuZWFjaCggdmlld01vZGVsLm5hbWVzKCksIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgICAgaWYgKG5hbWUuaWQgPT09IGlkKSB7ICBcbiAgICAgICAgICAgIG1hdGNoaW5nTmFtZSA9IG5hbWU7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbWF0Y2hpbmdOYW1lO1xuICAgIC8qIFRPRE86IGlmIHBlcmZvcm1hbmNlIHN1ZmZlcnMsIHVzZSBmYXN0IGxvb2t1cCFcbiAgICB2YXIgbG9va3VwID0gZ2V0RmFzdExvb2t1cCgnTkFNRVNfQllfSUQnKTtcbiAgICByZXR1cm4gbG9va3VwWyBpZCBdIHx8IG51bGw7XG4gICAgKi9cbn1cblxuXG5mdW5jdGlvbiBtYXBOYW1lVG9UYXhvbiggbmFtZUlELCBtYXBwaW5nSW5mbywgb3B0aW9ucyApIHtcbiAgICAvKiBBcHBseSB0aGlzIG1hcHBpbmcsIGNyZWF0aW5nIE5leHNvbiBlbGVtZW50cyBhcyBuZWVkZWRcbiAgICAgKlxuICAgICAqIG1hcHBpbmdJbmZvIHNob3VsZCBiZSBhbiBvYmplY3Qgd2l0aCB0aGVzZSBwcm9wZXJ0aWVzOlxuICAgICAqIHtcbiAgICAgKiAgIFwibmFtZVwiIDogXCJDZW50cmFudGh1c1wiLFxuICAgICAqICAgXCJvdHRJZFwiIDogXCI3NTkwNDZcIixcbiAgICAgKlxuICAgICAqICAgLy8gdGhlc2UgbWF5IGFsc28gYmUgcHJlc2VudCwgYnV0IGFyZW4ndCBpbXBvcnRhbnQgaGVyZVxuICAgICAqICAgICBcImV4YWN0XCIgOiBmYWxzZSxcbiAgICAgKiAgICAgXCJoaWdoZXJcIiA6IHRydWVcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBOLkIuIFdlICphbHdheXMqIGFkZC9jaGFuZ2UvcmVtb3ZlIHRoZXNlIHByb3BlcnRpZXMgaW4gdGFuZGVtIVxuICAgICAqICAgIG90dElkXG4gICAgICogICAgb3R0VGF4b25OYW1lXG4gICAgICogICAgdGF4b25vbWljU291cmNlc1xuICAgICAqL1xuXG4gICAgLy8gSWYgb3B0aW9ucy5QT1NUUE9ORV9VSV9DSEFOR0VTLCBwbGVhc2UgZG8gc28gKGVsc2Ugd2UgY3Jhd2wgd2hlblxuICAgIC8vIGFwcHJvdmluZyBodW5kcmVkcyBvZiBtYXBwaW5ncylcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIC8vIEZPUiBOT1csIGFzc3VtZSB0aGF0IGFueSBsZWFmIG5vZGUgd2lsbCBoYXZlIGEgY29ycmVzcG9uZGluZyBvdHUgZW50cnk7XG4gICAgLy8gb3RoZXJ3aXNlLCB3ZSBjYW4ndCBoYXZlIG5hbWUgZm9yIHRoZSBub2RlIVxuICAgIHZhciBuYW1lID0gZ2V0TmFtZUJ5SUQoIG5hbWVJRCApO1xuXG4gICAgLy8gRGUtc2VsZWN0IHRoaXMgbmFtZSBpbiB0aGUgbWFwcGluZyBVSVxuICAgIG5hbWVbJ3NlbGVjdGVkRm9yQWN0aW9uJ10gPSBmYWxzZTtcblxuICAgIC8vIGFkZCAob3IgdXBkYXRlKSBhIG1ldGF0YWcgbWFwcGluZyB0aGlzIHRvIGFuIE9UVCBpZFxuICAgIG5hbWVbJ290dElkJ10gPSBOdW1iZXIobWFwcGluZ0luZm8ub3R0SWQpO1xuXG4gICAgLy8gQWRkL3VwZGF0ZSB0aGUgT1RUIG5hbWUgKGNhY2hlZCBoZXJlIGZvciBwZXJmb3JtYW5jZSlcbiAgICBuYW1lWydvdHRUYXhvbk5hbWUnXSA9IG1hcHBpbmdJbmZvLm5hbWUgfHwgJ09UVCBOQU1FIE1JU1NJTkchJztcbiAgICAvLyBOLkIuIFdlIGFsd2F5cyBwcmVzZXJ2ZSBvcmlnaW5hbExhYmVsIGZvciByZWZlcmVuY2VcblxuICAgIC8vIGFkZCBcInVwc3RyZWFtXCIgdGF4b25vbWljIHNvdXJjZXNcbiAgICBuYW1lWyd0YXhvbm9taWNTb3VyY2VzJ10gPSBtYXBwaW5nSW5mby50YXhvbm9taWNTb3VyY2VzIHx8ICdUQVhPTk9NSUMgU09VUkNFUyBNSVNTSU5HISc7XG5cbiAgICAvLyBDbGVhciBhbnkgcHJvcG9zZWQvYWRqdXN0ZWQgbGFiZWwgKHRoaXMgaXMgdHJ1bXBlZCBieSBtYXBwaW5nIHRvIE9UVClcbiAgICBkZWxldGUgbmFtZVsnYWRqdXN0ZWRMYWJlbCddO1xuXG4gICAgaWYgKCFvcHRpb25zLlBPU1RQT05FX1VJX0NIQU5HRVMpIHtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVubWFwTmFtZUZyb21UYXhvbiggbmFtZU9ySUQsIG9wdGlvbnMgKSB7XG4gICAgLy8gcmVtb3ZlIHRoaXMgbWFwcGluZywgcmVtb3ZpbmcgYW55IHVubmVlZGVkIE5leHNvbiBlbGVtZW50c1xuXG4gICAgLy8gSWYgb3B0aW9ucy5QT1NUUE9ORV9VSV9DSEFOR0VTLCBwbGVhc2UgZG8gc28gKGVsc2Ugd2UgY3Jhd2wgd2hlblxuICAgIC8vIGNsZWFyaW5nIGh1bmRyZWRzIG9mIG1hcHBpbmdzKVxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgdmFyIG5hbWUgPSAodHlwZW9mIG5hbWVPcklEID09PSAnb2JqZWN0JykgPyBuYW1lT3JJRCA6IGdldE5hbWVCeUlEKCBuYW1lT3JJRCApO1xuICAgIC8vIHJlc3RvcmUgaXRzIG9yaWdpbmFsIGxhYmVsICh2ZXJzdXMgbWFwcGVkIGxhYmVsKVxuICAgIHZhciBvcmlnaW5hbExhYmVsID0gbmFtZVsnb3JpZ2luYWxMYWJlbCddO1xuXG4gICAgLy8gc3RyaXAgYW55IG1ldGF0YWcgbWFwcGluZyB0aGlzIHRvIGFuIE9UVCBpZFxuICAgIGlmICgnb3R0SWQnIGluIG5hbWUpIHtcbiAgICAgICAgZGVsZXRlIG5hbWVbJ290dElkJ107XG4gICAgfVxuICAgIGlmICgnb3R0VGF4b25OYW1lJyBpbiBuYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBuYW1lWydvdHRUYXhvbk5hbWUnXTtcbiAgICB9XG4gICAgaWYgKCd0YXhvbm9taWNTb3VyY2VzJyBpbiBuYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBuYW1lWyd0YXhvbm9taWNTb3VyY2VzJ107XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLlBPU1RQT05FX1VJX0NIQU5HRVMpIHtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCdWSVNJQkxFX05BTUVfTUFQUElOR1MnKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFkZE1ldGFUYWdUb1BhcmVudCggcGFyZW50LCBwcm9wcyApIHtcbiAgICAvLyB3cmFwIHN1Ym1pdHRlZCBwcm9wZXJ0aWVzIHRvIG1ha2UgYW4gb2JzZXJ2YWJsZSBtZXRhdGFnXG4gICAgdmFyIG5ld1RhZyA9IGNsb25lRnJvbVNpbXBsZU9iamVjdCggcHJvcHMgKTtcbiAgICBpZiAoIXBhcmVudC5tZXRhKSB7XG4gICAgICAgIC8vIGFkZCBhIG1ldGEgY29sbGVjdGlvbiBoZXJlXG4gICAgICAgIHBhcmVudFsnbWV0YSddID0gWyBdO1xuICAgIH0gZWxzZSBpZiAoISQuaXNBcnJheShwYXJlbnQubWV0YSkpIHtcbiAgICAgICAgLy8gY29udmVydCBhIEJhZGdlcmZpc2ggXCJzaW5nbGV0b25cIiB0byBhIHByb3BlciBhcnJheVxuICAgICAgICBwYXJlbnRbJ21ldGEnXSA9IFsgcGFyZW50Lm1ldGEgXTtcbiAgICB9XG4gICAgcGFyZW50Lm1ldGEucHVzaCggbmV3VGFnICk7XG59XG5cblxuZnVuY3Rpb24gY2xlYXJTZWxlY3RlZE1hcHBpbmdzKCkge1xuICAgIC8vIFRFTVBPUkFSWSBoZWxwZXIgdG8gZGVtbyBtYXBwaW5nIHRvb2xzLCBjbGVhcnMgbWFwcGluZyBmb3IgdGhlIHZpc2libGUgKHBhZ2VkKSBuYW1lcy5cbiAgICB2YXIgdmlzaWJsZU5hbWVzID0gdmlld01vZGVsLmZpbHRlcmVkTmFtZXMoKS5wYWdlZEl0ZW1zKCk7XG4gICAgJC5lYWNoKCB2aXNpYmxlTmFtZXMsIGZ1bmN0aW9uIChpLCBuYW1lKSB7XG4gICAgICAgIGlmIChuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddKSB7XG4gICAgICAgICAgICAvLyBjbGVhciBhbnkgXCJlc3RhYmxpc2hlZFwiIG1hcHBpbmcgKGFscmVhZHkgYXBwcm92ZWQpXG4gICAgICAgICAgICB1bm1hcE5hbWVGcm9tVGF4b24oIG5hbWUsIHtQT1NUUE9ORV9VSV9DSEFOR0VTOiB0cnVlfSApO1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IHByb3Bvc2VkIG1hcHBpbmdcbiAgICAgICAgICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1lWydpZCddIF07XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBjbGVhckZhaWxlZE5hbWVMaXN0KCk7XG4gICAgcHJvcG9zZWROYW1lTWFwcGluZ3MudmFsdWVIYXNNdXRhdGVkKCk7XG4gICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2xlYXJBbGxNYXBwaW5ncygpIHtcbiAgICB2YXIgYWxsTmFtZXMgPSB2aWV3TW9kZWwubmFtZXMoKTtcbiAgICBpZiAoYXdhaXQgYXN5bmNDb25maXJtKFwiV0FSTklORzogVGhpcyB3aWxsIHVuLW1hcCBhbGwgXCIrIGFsbE5hbWVzLmxlbmd0aCArXCIgbmFtZXMgaW4gdGhlIGN1cnJlbnQgc3R1ZHkhIEFyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkbyB0aGlzP1wiKSkge1xuICAgICAgICAvLyBURU1QT1JBUlkgaGVscGVyIHRvIGRlbW8gbWFwcGluZyB0b29scywgY2xlYXJzIG1hcHBpbmcgZm9yIHRoZSB2aXNpYmxlIChwYWdlZCkgbmFtZXMuXG4gICAgICAgICQuZWFjaCggYWxsTmFtZXMsIGZ1bmN0aW9uIChpLCBuYW1lKSB7XG4gICAgICAgICAgICAvLyBjbGVhciBhbnkgXCJlc3RhYmxpc2hlZFwiIG1hcHBpbmcgKGFscmVhZHkgYXBwcm92ZWQpXG4gICAgICAgICAgICB1bm1hcE5hbWVGcm9tVGF4b24oIG5hbWUsIHtQT1NUUE9ORV9VSV9DSEFOR0VTOiB0cnVlfSApO1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IHByb3Bvc2VkIG1hcHBpbmdcbiAgICAgICAgICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1lWydpZCddIF07XG4gICAgICAgIH0pO1xuICAgICAgICBjbGVhckZhaWxlZE5hbWVMaXN0KCk7XG4gICAgICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgICAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIH1cbn1cblxuLyogRU5EIGNvbnZlcnQgJ09UVScgdG8gJ25hbWUnIHRocm91Z2hvdXQ/ICovXG5cblxuXG5cblxuXG5cblxuXG5cbi8qIERlZmluZSBhIHJlZ2lzdHJ5IG9mIG51ZGdlIG1ldGhvZHMsIGZvciB1c2UgaW4gS08gZGF0YSBiaW5kaW5ncy4gQ2FsbGluZ1xuICogYSBudWRnZSBmdW5jdGlvbiB3aWxsIHVwZGF0ZSBvbmUgb3IgbW9yZSBvYnNlcnZhYmxlcyB0byB0cmlnZ2VyIHVwZGF0ZXNcbiAqIGluIHRoZSBjdXJhdGlvbiBVSS4gVGhpcyBhcHByb2FjaCBhbGxvd3MgdXMgdG8gd29yayB3aXRob3V0IG9ic2VydmFibGVzLFxuICogd2hpY2ggaW4gdHVybiBtZWFucyB3ZSBjYW4gZWRpdCBlbm9ybW91cyB2aWV3bW9kZWxzLlxuICovXG52YXIgbnVkZ2UgPSB7XG4gICAgJ01FVEFEQVRBJzogZnVuY3Rpb24oIGRhdGEsIGV2ZW50ICkge1xuICAgICAgICBudWRnZVRpY2tsZXIoICdNRVRBREFUQScpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgICdWSVNJQkxFX05BTUVfTUFQUElOR1MnOiBmdW5jdGlvbiggZGF0YSwgZXZlbnQgKSB7XG4gICAgICAgIG51ZGdlVGlja2xlciggJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUycpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgICdOQU1FX01BUFBJTkdfSElOVFMnOiBmdW5jdGlvbiggZGF0YSwgZXZlbnQgKSB7XG4gICAgICAgIG51ZGdlVGlja2xlciggJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgICdJTlBVVF9GSUxFUyc6IGZ1bmN0aW9uKCBkYXRhLCBldmVudCApIHtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCAnSU5QVVRfRklMRVMnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8vIFRPRE86IEFkZCBtb3JlIGZvciBhbnkgdGlja2xlcnMgYWRkZWQgYmVsb3dcbn1cbmZ1bmN0aW9uIG51ZGdlVGlja2xlciggbmFtZSApIHtcbiAgICBpZiAobmFtZSA9PT0gJ0FMTCcpIHtcbiAgICAgICAgZm9yICh2YXIgYU5hbWUgaW4gdmlld01vZGVsLnRpY2tsZXJzKSB7XG4gICAgICAgICAgICBudWRnZVRpY2tsZXIoIGFOYW1lICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB0aWNrbGVyID0gdmlld01vZGVsLnRpY2tsZXJzWyBuYW1lIF07XG4gICAgaWYgKCF0aWNrbGVyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJObyBzdWNoIHRpY2tsZXI6ICdcIisgbmFtZSArXCInIVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgb2xkVmFsdWUgPSB0aWNrbGVyLnBlZWsoKTtcbiAgICB0aWNrbGVyKCBvbGRWYWx1ZSArIDEgKTtcblxuICAgIC8vIGlmIHRoaXMgcmVmbGVjdHMgY2hhbmdlcyB0byB0aGUgc3R1ZHksIG51ZGdlIHRoZSBtYWluICdkaXJ0eSBmbGFnJyB0aWNrbGVyXG4gICAgaWYgKG5hbWUgIT09ICdDT0xMRUNUSU9OU19MSVNUJykge1xuICAgICAgICB2aWV3TW9kZWwudGlja2xlcnMuTkFNRVNFVF9IQVNfQ0hBTkdFRCggdmlld01vZGVsLnRpY2tsZXJzLk5BTUVTRVRfSEFTX0NIQU5HRUQucGVlaygpICsgMSApO1xuICAgICAgICBjb25zb2xlLndhcm4oJ05BTUVTRVRfSEFTX0NIQU5HRUQnKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNob3dOYW1lc2V0TWV0YWRhdGEoKSB7XG4gICAgJCgnI25hbWVzZXQtbWV0YWRhdGEtcHJvbXB0JykuaGlkZSgpO1xuICAgICQoJyNuYW1lc2V0LW1ldGFkYXRhLXBhbmVsJykuc2hvdygpO1xufVxuZnVuY3Rpb24gaGlkZU5hbWVzZXRNZXRhZGF0YSgpIHtcbiAgICAkKCcjbmFtZXNldC1tZXRhZGF0YS1wYW5lbCcpLmhpZGUoKTtcbiAgICAkKCcjbmFtZXNldC1tZXRhZGF0YS1wcm9tcHQnKS5zaG93KCk7XG59XG5cbmZ1bmN0aW9uIHNob3dNYXBwaW5nT3B0aW9ucygpIHtcbiAgICAkKCcjbWFwcGluZy1vcHRpb25zLXByb21wdCcpLmhpZGUoKTtcbiAgICAkKCcjbWFwcGluZy1vcHRpb25zLXBhbmVsJykuc2hvdygpO1xufVxuZnVuY3Rpb24gaGlkZU1hcHBpbmdPcHRpb25zKCkge1xuICAgICQoJyNtYXBwaW5nLW9wdGlvbnMtcGFuZWwnKS5oaWRlKCk7XG4gICAgJCgnI21hcHBpbmctb3B0aW9ucy1wcm9tcHQnKS5zaG93KCk7XG59XG5cbmZ1bmN0aW9uIGRpc2FibGVTYXZlQnV0dG9uKCkge1xuICAgIHZhciAkYnRuID0gJCgnI3NhdmUtbmFtZXNldC1idXR0b24nKTtcbiAgICAkYnRuLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xuICAgICRidG4udW5iaW5kKCdjbGljaycpLmNsaWNrKGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICBzaG93SW5mb01lc3NhZ2UoJ1RoZXJlIGFyZSBubyB1bnNhdmVkIGNoYW5nZXMuJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGVuYWJsZVNhdmVCdXR0b24oKSB7XG4gICAgdmFyICRidG4gPSAkKCcjc2F2ZS1uYW1lc2V0LWJ1dHRvbicpO1xuICAgICRidG4ucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XG4gICAgJGJ0bi51bmJpbmQoJ2NsaWNrJykuY2xpY2soZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgIGlmIChicm93c2VyU3VwcG9ydHNGaWxlQVBJKCkpIHtcbiAgICAgICAgICAgIHNob3dTYXZlTmFtZXNldFBvcHVwKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhc3luY0FsZXJ0KFwiU29ycnksIHRoaXMgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHNhdmluZyB0byBhIGxvY2FsIGZpbGUhXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2hvd0xvYWRMaXN0UG9wdXAoICkge1xuICAgIHNob3dGaWxlc3lzdGVtUG9wdXAoJyNsb2FkLWxpc3QtcG9wdXAnKTtcbn1cbmZ1bmN0aW9uIHNob3dMb2FkTmFtZXNldFBvcHVwKCApIHtcbiAgICAkKCcjbG9hZC1uYW1lc2V0LXBvcHVwJykub2ZmKCdoaWRlJykub24oJ2hpZGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChjb250ZXh0ID09PSAnU1RVRFlfT1RVX01BUFBJTkcnKSB7XG4gICAgICAgICAgICAvLyBjbGVhciBhbnkgcHJpb3Igc2VhcmNoIGlucHV0XG4gICAgICAgICAgICBjbGVhck5hbWVzZXRVcGxvYWRXaWRnZXQoKTtcbiAgICAgICAgICAgIGNsZWFyTmFtZXNldFBhc3RlZFRleHQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHNob3dGaWxlc3lzdGVtUG9wdXAoJyNsb2FkLW5hbWVzZXQtcG9wdXAnKTtcbn1cbmZ1bmN0aW9uIHNob3dTYXZlTmFtZXNldFBvcHVwKCApIHtcbiAgICBzaG93RmlsZXN5c3RlbVBvcHVwKCcjc2F2ZS1uYW1lc2V0LXBvcHVwJyk7XG59XG5mdW5jdGlvbiBzaG93RmlsZXN5c3RlbVBvcHVwKCBwb3B1cFNlbGVjdG9yICkge1xuICAgIC8vIGV4cGVjdHMgYSB2YWxpZCBqUXVlcnkgc2VsZWN0b3IgZm9yIHRoZSBwb3B1cCBpbiBET01cbiAgICB2YXIgJHBvcHVwID0gJChwb3B1cFNlbGVjdG9yKTtcbiAgICAkcG9wdXAubW9kYWwoJ3Nob3cnKTtcblxuICAgIC8vIChyZSliaW5kIFVJIHdpdGggS25vY2tvdXRcbiAgICB2YXIgJGJvdW5kRWxlbWVudHMgPSAkcG9wdXAuZmluZCgnLm1vZGFsLWJvZHknKTsgLy8gYWRkIG90aGVyIGVsZW1lbnRzP1xuICAgICQuZWFjaCgkYm91bmRFbGVtZW50cywgZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAga28uY2xlYW5Ob2RlKGVsKTtcbiAgICAgICAga28uYXBwbHlCaW5kaW5ncyh7fSxlbCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldE1hcHBlZE5hbWVzVGFsbHkoKSB7XG4gICAgLy8gcmV0dXJuIGRpc3BsYXktcmVhZHkgdGFsbHkgKG1hcHBlZC90b3RhbCByYXRpbyBhbmQgcGVyY2VudGFnZSlcbiAgICB2YXIgdGhpblNwYWNlID0gJyYjODIwMTsnO1xuICAgIGlmICghdmlld01vZGVsIHx8ICF2aWV3TW9kZWwubmFtZXMgfHwgdmlld01vZGVsLm5hbWVzKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiAnPHN0cm9uZz4wPC9zdHJvbmc+PHNwYW4+JysgdGhpblNwYWNlICsnLycrIHRoaW5TcGFjZSArICcwICZuYnNwOzwvc3Bhbj48c3BhbiBzdHlsZT1cImNvbG9yOiAjOTk5O1wiPigwJSk8L3NwYW4+JztcbiAgICB9XG4gICAgdmFyIHRvdGFsTmFtZUNvdW50ID0gdmlld01vZGVsLm5hbWVzKCkubGVuZ3RoO1xuICAgIHZhciBtYXBwZWROYW1lQ291bnQgPSAkLmdyZXAodmlld01vZGVsLm5hbWVzKCksIGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICAgICAgcmV0dXJuICghbmFtZS5vdHRJZCkgPyBmYWxzZTogdHJ1ZTtcbiAgICB9KS5sZW5ndGg7XG4gICAgcmV0dXJuICc8c3Ryb25nPicrIG1hcHBlZE5hbWVDb3VudCArJzwvc3Ryb25nPjxzcGFuPicrIHRoaW5TcGFjZSArJy8nKyB0aGluU3BhY2UgKyB0b3RhbE5hbWVDb3VudCArJyAmbmJzcDs8L3NwYW4+PHNwYW4gc3R5bGU9XCJjb2xvcjogIzk5OTtcIj4oJysgZmxvYXRUb1BlcmNlbnQobWFwcGVkTmFtZUNvdW50IC8gdG90YWxOYW1lQ291bnQpICsnJSk8L3NwYW4+Jztcbn1cbmZ1bmN0aW9uIG1hcHBpbmdQcm9ncmVzc0FzUGVyY2VudCgpIHtcbiAgICBpZiAoIXZpZXdNb2RlbCB8fCAhdmlld01vZGVsLm5hbWVzIHx8IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIHRvdGFsTmFtZUNvdW50ID0gdmlld01vZGVsLm5hbWVzKCkubGVuZ3RoO1xuICAgIHZhciBtYXBwZWROYW1lQ291bnQgPSAkLmdyZXAoIHZpZXdNb2RlbC5uYW1lcygpLCBmdW5jdGlvbihuYW1lLCBpKSB7XG4gICAgICAgIHJldHVybiAoIW5hbWUub3R0SWQpID8gZmFsc2U6IHRydWU7XG4gICAgfSkubGVuZ3RoO1xuICAgIHJldHVybiBmbG9hdFRvUGVyY2VudChtYXBwZWROYW1lQ291bnQgLyB0b3RhbE5hbWVDb3VudCk7XG59XG5mdW5jdGlvbiBmbG9hdFRvUGVyY2VudCggZGVjICkge1xuICAgIC8vIGFzc3VtZXMgYSBmbG9hdCBiZXR3ZWVuIDAuMCBhbmQgMS4wXG4gICAgLy8gRVhBTVBMRTogMC4yMzIgPT0+IDIzJVxuICAgIHJldHVybiBNYXRoLnJvdW5kKGRlYyAqIDEwMCk7XG59XG5cbmZ1bmN0aW9uIGJyb3dzZXJTdXBwb3J0c0ZpbGVBUEkoKSB7XG4gICAgLy8gQ2FuIGxvYWQgYW5kIG1hbmlwdWxhdGUgbG9jYWwgZmlsZXMgaW4gdGhpcyBicm93c2VyP1xuICAgIHJldHVybiAod2luZG93LkZpbGUgJiYgXG4gICAgICAgICAgICB3aW5kb3cuRmlsZVJlYWRlciAmJiBcbiAgICAgICAgICAgIHdpbmRvdy5GaWxlTGlzdCAmJiBcbiAgICAgICAgICAgIHdpbmRvdy5CbG9iKSA/IHRydWUgOiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gYWRkU3Vic3RpdHV0aW9uKCBjbGlja2VkICkge1xuICAgIHZhciBzdWJzdCA9IGtvLm1hcHBpbmcuZnJvbUpTKHtcbiAgICAgICAgJ29sZCc6IFwiXCIsXG4gICAgICAgICduZXcnOiBcIlwiLFxuICAgICAgICAnYWN0aXZlJzogdHJ1ZSxcbiAgICAgICAgJ3ZhbGlkJzogdHJ1ZVxuICAgIH0pO1xuXG4gICAgaWYgKCQoY2xpY2tlZCkuaXMoJ3NlbGVjdCcpKSB7XG4gICAgICAgIHZhciBjaG9zZW5TdWIgPSAkKGNsaWNrZWQpLnZhbCgpO1xuICAgICAgICBpZiAoY2hvc2VuU3ViID09PSAnJykge1xuICAgICAgICAgICAgLy8gZG8gbm90aGluZywgd2UncmUgc3RpbGwgYXQgdGhlIHByb21wdFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIGFkZCB0aGUgY2hvc2VuIHN1YnNpdHV0aW9uXG4gICAgICAgIHZhciBwYXJ0cyA9IGNob3NlblN1Yi5zcGxpdCgnID06PSAnKTtcbiAgICAgICAgc3Vic3Qub2xkKCBwYXJ0c1swXSB8fCAnJyApO1xuICAgICAgICBzdWJzdC5uZXcoIHBhcnRzWzFdIHx8ICcnICk7XG4gICAgICAgIHN1YnN0LnZhbGlkKHRydWUpO1xuICAgICAgICBzdWJzdC5hY3RpdmUodHJ1ZSk7XG4gICAgICAgIC8vIHJlc2V0IHRoZSBTRUxFQ1Qgd2lkZ2V0IHRvIGl0cyBwcm9tcHRcbiAgICAgICAgJChjbGlja2VkKS52YWwoJycpO1xuICAgIH1cbiAgICB2aWV3TW9kZWwubWFwcGluZ0hpbnRzLnN1YnN0aXR1dGlvbnMucHVzaChzdWJzdCk7XG4gICAgY2xlYXJGYWlsZWROYW1lTGlzdCgpO1xuICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG59XG5mdW5jdGlvbiByZW1vdmVTdWJzdGl0dXRpb24oIGRhdGEgKSB7XG4gICAgdmFyIHN1Ykxpc3QgPSB2aWV3TW9kZWwubWFwcGluZ0hpbnRzLnN1YnN0aXR1dGlvbnMoKTtcbiAgICByZW1vdmVGcm9tQXJyYXkoIGRhdGEsIHN1Ykxpc3QgKTtcbiAgICBpZiAoc3ViTGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy8gYWRkIGFuIGluYWN0aXZlIHN1YnN0aXR1dGlvbiB3aXRoIHByb21wdHNcbiAgICAgICAgYWRkU3Vic3RpdHV0aW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY2xlYXJGYWlsZWROYW1lTGlzdCgpO1xuICAgICAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZU1hcHBpbmdIaW50cyggZGF0YSApIHtcbiAgICAvLyBhZnRlci1lZmZlY3RzIG9mIGNoYW5nZXMgdG8gc2VhcmNoIGNvbnRleHQgb3IgYW55IHN1YnN0aXR1dGlvblxuICAgIGNsZWFyRmFpbGVkTmFtZUxpc3QoKTtcbiAgICBhZGp1c3RlZExhYmVsKFwiVEVTVFwiKTsgICAvLyB2YWxpZGF0ZSBhbGwgc3Vic3RpdHV0aW9uc1xuICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGdldEF0dHJzRm9yTWFwcGluZ09wdGlvbiggb3B0aW9uRGF0YSwgbnVtT3B0aW9ucyApIHtcbiAgICB2YXIgYXR0cnMgPSB7XG4gICAgICAgICd0aXRsZSc6IHBhcnNlSW50KG9wdGlvbkRhdGEub3JpZ2luYWxNYXRjaC5zY29yZSAqIDEwMCkgK1wiJSBtYXRjaCBvZiBvcmlnaW5hbCBsYWJlbFwiLFxuICAgICAgICAnY2xhc3MnOiBcImJhZGdlIFwiLFxuICAgICAgICAnc3R5bGUnOiAoXCJvcGFjaXR5OiBcIisgbWF0Y2hTY29yZVRvT3BhY2l0eShvcHRpb25EYXRhLm9yaWdpbmFsTWF0Y2guc2NvcmUpICtcIjtcIilcbiAgICB9XG4gICAgLy8gZm9yIG5vdywgdXNlIHN0YW5kYXJkIGNvbG9ycyB0aGF0IHdpbGwgc3RpbGwgcG9wIGZvciBjb2xvci1ibGluZCB1c2Vyc1xuICAgIGlmIChvcHRpb25EYXRhLm9yaWdpbmFsTWF0Y2guaXNfc3lub255bSkge1xuICAgICAgICBhdHRycy50aXRsZSA9ICgnTWF0Y2hlZCBvbiBzeW5vbnltICcrIG9wdGlvbkRhdGEub3JpZ2luYWxNYXRjaC5tYXRjaGVkX25hbWUpO1xuICAgICAgICBhdHRycy5jbGFzcyArPSAnIGJhZGdlLWluZm8nO1xuICAgIH0gZWxzZSBpZiAoKG51bU9wdGlvbnMgPiAxKSAmJiAob3B0aW9uRGF0YS5vcmlnaW5hbE1hdGNoLm1hdGNoZWRfbmFtZSAhPT0gb3B0aW9uRGF0YS5vcmlnaW5hbE1hdGNoLnRheG9uLnVuaXF1ZV9uYW1lKSkge1xuICAgICAgICAvLyBMZXQncyBhc3N1bWUgYSBzaW5nbGUgcmVzdWx0IGlzIHRoZSByaWdodCBhbnN3ZXJcbiAgICAgICAgYXR0cnMudGl0bGUgPSAoJ1RheG9uLW5hbWUgaG9tb255bScpO1xuICAgICAgICBhdHRycy5jbGFzcyArPSAnIGJhZGdlLXdhcm5pbmcnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGtlZXAgZGVmYXVsdCBsYWJlbCB3aXRoIG1hdGNoaW5nIHNjb3JlXG4gICAgICAgIGF0dHJzLmNsYXNzICs9ICcgYmFkZ2Utc3VjY2Vzcyc7XG4gICAgfVxuICAgIC8vIGVhY2ggc2hvdWxkIGFsc28gbGluayB0byB0aGUgdGF4b25vbXkgYnJvd3NlclxuICAgIGF0dHJzLmhyZWYgPSBnZXRUYXhvYnJvd3NlclVSTChvcHRpb25EYXRhWydvdHRJZCddKTtcbiAgICBhdHRycy50YXJnZXQgPSAnX2JsYW5rJztcbiAgICBhdHRycy50aXRsZSArPSAnIChjbGljayBmb3IgbW9yZSBpbmZvcm1hdGlvbiknXG4gICAgcmV0dXJuIGF0dHJzO1xufVxuZnVuY3Rpb24gbWF0Y2hTY29yZVRvT3BhY2l0eShzY29yZSkge1xuICAgIC8qIFJlbWFwIHNjb3JlcyAoZ2VuZXJhbGx5IGZyb20gMC43NSB0byAxLjAsIGJ1dCAwLjEgaXMgcG9zc2libGUhKSB0byBiZSBtb3JlIHZpc2libGVcbiAgICAgKiBUaGlzIGlzIGJlc3QgYWNjb21wbGlzaGVkIGJ5IHJlbWFwcGluZyB0byBhIGN1cnZlLCBlLmcuXG4gICAgICogICBPUEFDSVRZID0gU0NPUkVeMiArIDAuMTVcbiAgICAgKiAgIE9QQUNJVFkgPSAwLjggKiBTQ09SRV4yICsgMC4yXG4gICAgICogICBPUEFDSVRZID0gMC44ICogU0NPUkUgKyAwLjJcbiAgICAgKiBUaGUgZWZmZWN0IHdlIHdhbnQgaXMgZnVsbCBvcGFjaXR5ICgxLjApIGZvciBhIDEuMCBzY29yZSwgZmFkaW5nIHJhcGlkbHlcbiAgICAgKiBmb3IgdGhlIGNvbW1vbiAoaGlnaGVyKSBzY29yZXMsIHdpdGggYSBmbG9vciBvZiB+MC4yIG9wYWNpdHkgKGVub3VnaCB0b1xuICAgICAqIHNob3cgY29sb3IgYW5kIG1haW50YWluIGxlZ2liaWxpdHkpLlxuICAgICAqL1xuICAgIHJldHVybiAoMC44ICogc2NvcmUpICsgMC4yO1xufVxuXG4vLyBzdXBwb3J0IGZvciBhIGNvbG9yLWNvZGVkIFwic3BlZWRvbWV0ZXJcIiBmb3Igc2VydmVyLXNpZGUgbWFwcGluZyAoc29tZSBhcyBKUyBnbG9iYWxzKVxudmFyIHJlY2VudE1hcHBpbmdUaW1lcyA9IFsgXTtcbnJlY2VudE1hcHBpbmdTcGVlZExhYmVsID0ga28ub2JzZXJ2YWJsZShcIlwiKTsgLy8gc2Vjb25kcyBwZXIgbmFtZSwgYmFzZWQgb24gcm9sbGluZyBhdmVyYWdlXG5yZWNlbnRNYXBwaW5nU3BlZWRQZXJjZW50ID0ga28ub2JzZXJ2YWJsZSgwKTsgLy8gYWZmZWN0cyBjb2xvciBvZiBiYXIsIGV0Y1xucmVjZW50TWFwcGluZ1NwZWVkQmFyQ2xhc3MgPSBrby5vYnNlcnZhYmxlKCdwcm9ncmVzcyBwcm9ncmVzcy1pbmZvJyk7XG5cbi8vIHRoaXMgc2hvdWxkIGJlIGNsZWFyZWQgd2hlbmV2ZXIgc29tZXRoaW5nIGNoYW5nZXMgaW4gbWFwcGluZyBoaW50c1xuZnVuY3Rpb24gY2xlYXJGYWlsZWROYW1lTGlzdCgpIHtcbiAgICBmYWlsZWRNYXBwaW5nTmFtZXMucmVtb3ZlQWxsKCk7XG4gICAgLy8gbnVkZ2UgdG8gdXBkYXRlIG5hbWUgbGlzdCBpbW1lZGlhdGVseVxuICAgIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyKCBib2d1c0VkaXRlZExhYmVsQ291bnRlcigpICsgMSk7XG4gICAgbnVkZ2VBdXRvTWFwcGluZygpO1xufVxuZnVuY3Rpb24gbnVkZ2VBdXRvTWFwcGluZygpIHtcbiAgICAvLyByZXN0YXJ0IGF1dG8tbWFwcGluZywgaWYgZW5hYmxlZFxuICAgIGlmIChhdXRvTWFwcGluZ0luUHJvZ3Jlc3MoKSkge1xuICAgICAgICBpZiAoY3VycmVudGx5TWFwcGluZ05hbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgLy8gbG9va3MgbGlrZSB3ZSByYW4gb3V0IG9mIHN0ZWFtLi4gdHJ5IGFnYWluIVxuICAgICAgICAgICAgcmVxdWVzdFRheG9uTWFwcGluZygpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cblxuXG5mdW5jdGlvbiBpbmZlclNlYXJjaENvbnRleHRGcm9tQXZhaWxhYmxlTmFtZXMoKSB7XG4gICAgLy8gRmV0Y2ggdGhlIGxlYXN0IGluY2x1c2l2ZSBjb250ZXh0IHZpYSBBSkFYLCBhbmQgdXBkYXRlIHRoZSBkcm9wLWRvd24gbWVudVxuICAgIHZhciBuYW1lc1RvU3VibWl0ID0gWyBdO1xuICAgIHZhciBtYXhOYW1lc1RvU3VibWl0ID0gNTAwMDsgIC8vIGlmIG1vcmUgdGhhbiB0aGlzLCBkcm9wIGV4dHJhIG5hbWVzIGV2ZW5seVxuICAgIGNvbnNvbGUubG9nKFwiPj4gZm91bmQgXCIrIHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aCArXCIgbmFtZXMgaW4gdGhlIG5hbWVzZXRcIik7XG4gICAgdmFyIG5hbWVzVG9TdWJtaXQgPSAkLm1hcCh2aWV3TW9kZWwubmFtZXMoKSwgZnVuY3Rpb24obmFtZSwgaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuICgnb3R0VGF4b25OYW1lJyBpbiBuYW1lKSA/IG5hbWVbJ290dFRheG9uTmFtZSddIDogbmFtZVsnb3JpZ2luYWxMYWJlbCddO1xuICAgIH0pO1xuICAgIGlmIChuYW1lc1RvU3VibWl0Lmxlbmd0aCA+IG1heE5hbWVzVG9TdWJtaXQpIHtcbiAgICAgICAgLy8gcmVkdWNlIHRoZSBsaXN0IGluIGEgZGlzdHJpYnV0ZWQgZmFzaGlvbiAoZWcsIGV2ZXJ5IGZvdXJ0aCBpdGVtKVxuICAgICAgICB2YXIgc3RlcFNpemUgPSBtYXhOYW1lc1RvU3VibWl0IC8gbmFtZXNUb1N1Ym1pdC5sZW5ndGg7XG4gICAgICAgIC8vL2NvbnNvbGUubG9nKFwiVE9PIE1BTlkgTkFNRVMsIHJlZHVjaW5nIHdpdGggc3RlcC1zaXplIFwiKyBzdGVwU2l6ZSk7XG4gICAgICAgIC8vIGNyZWVwIHRvIHdob2xlIG51bWJlcnMsIGtlZXBpbmcgYW4gaXRlbSBldmVyeSB0aW1lIHdlIGluY3JlbWVudCBieSBvbmVcbiAgICAgICAgdmFyIGN1cnJlbnRTdGVwVG90YWwgPSAwLjA7XG4gICAgICAgIHZhciBuZXh0V2hvbGVOdW1iZXIgPSAxO1xuICAgICAgICBuYW1lc1RvU3VibWl0ID0gbmFtZXNUb1N1Ym1pdC5maWx0ZXIoZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmICgoY3VycmVudFN0ZXBUb3RhbCArPSBzdGVwU2l6ZSkgPj0gbmV4dFdob2xlTnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgbmV4dFdob2xlTnVtYmVyICs9IDE7IC8vIGJ1bXAgdG8gbmV4dCBudW1iZXJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFwiPj4gc3VibWl0dGluZyBcIisgbmFtZXNUb1N1Ym1pdC5sZW5ndGggK1wiIG5hbWVzIGluIHRoZSBuYW1lc2V0XCIpO1xuICAgIGlmIChuYW1lc1RvU3VibWl0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47IC8vIHRoaXMgaXMgYSBuby1vcFxuICAgIH1cblxuICAgIC8vL3Nob3dNb2RhbFNjcmVlbihcIkluZmVycmluZyBzZWFyY2ggY29udGV4dC4uLlwiLCB7U0hPV19CVVNZX0JBUjp0cnVlfSk7XG5cbiAgICAkLmFqYXgoe1xuICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgIC8vIGNyb3NzZG9tYWluOiB0cnVlLFxuICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gICAgICAgIHVybDogZ2V0Q29udGV4dEZvck5hbWVzX3VybCxcbiAgICAgICAgcHJvY2Vzc0RhdGE6IGZhbHNlLFxuICAgICAgICBkYXRhOiAoJ3tcIm5hbWVzXCI6ICcrIEpTT04uc3RyaW5naWZ5KG5hbWVzVG9TdWJtaXQpICsnfScpLFxuICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24oIGpxWEhSLCB0ZXh0U3RhdHVzICkge1xuICAgICAgICAgICAgLy8gcmVwb3J0IGVycm9ycyBvciBtYWxmb3JtZWQgZGF0YSwgaWYgYW55XG4gICAgICAgICAgICBpZiAodGV4dFN0YXR1cyAhPT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgc2hvd0Vycm9yTWVzc2FnZSgnU29ycnksIHRoZXJlIHdhcyBhbiBlcnJvciBpbmZlcnJpbmcgdGhlIHNlYXJjaCBjb250ZXh0LicpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRVJST1I6IHRleHRTdGF0dXMgIT09ICdzdWNjZXNzJywgYnV0IFwiKyB0ZXh0U3RhdHVzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gSlNPTi5wYXJzZSgganFYSFIucmVzcG9uc2VUZXh0ICk7XG4gICAgICAgICAgICB2YXIgaW5mZXJyZWRDb250ZXh0ID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgJ2NvbnRleHRfbmFtZScgaW4gcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaW5mZXJyZWRDb250ZXh0ID0gcmVzdWx0Wydjb250ZXh0X25hbWUnXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vL2NvbnNvbGUubG9nKFwiPj4gaW5mZXJyZWRDb250ZXh0OiBcIisgaW5mZXJyZWRDb250ZXh0KTtcbiAgICAgICAgICAgIGlmIChpbmZlcnJlZENvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgQk9USCBzZWFyY2gtY29udGV4dCBkcm9wLWRvd24gbWVudXMgdG8gc2hvdyB0aGlzIHJlc3VsdFxuICAgICAgICAgICAgICAgICQoJ3NlbGVjdFtuYW1lPXRheG9uLXNlYXJjaC1jb250ZXh0XScpLnZhbChpbmZlcnJlZENvbnRleHQpO1xuICAgICAgICAgICAgICAgIC8vIFR3ZWFrIHRoZSBtb2RlbCdzIG5hbWUgbWFwcGluZywgdGhlbiByZWZyZXNoIHRoZSBVSVxuICAgICAgICAgICAgICAgIC8vIE4uQi4gV2UgY2hlY2sgZmlyc3QgdG8gYXZvaWQgYWRkaW5nIGFuIHVubmVjZXNzYXJ5IHVuc2F2ZWQtZGF0YSB3YXJuaW5nIVxuICAgICAgICAgICAgICAgIGlmICh2aWV3TW9kZWwubWFwcGluZ0hpbnRzLnNlYXJjaENvbnRleHQoKSAhPT0gaW5mZXJyZWRDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlbC5tYXBwaW5nSGludHMuc2VhcmNoQ29udGV4dChpbmZlcnJlZENvbnRleHQpO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVNYXBwaW5nSGludHMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UoJ1NvcnJ5LCBubyBzZWFyY2ggY29udGV4dCB3YXMgaW5mZXJyZWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLy8gS2VlcCBhIHNhZmUgY29weSBvZiBvdXIgVUkgbWFya3VwLCBmb3IgcmUtdXNlIGFzIGEgS25vY2tvdXQgdGVtcGxhdGUgKHNlZSBiZWxvdylcbnZhciAkc3Rhc2hlZEVkaXRBcmVhID0gbnVsbDtcblxuLy8gTG9hZCBhIG5hbWVzZXQgZnJvbSBKUy9KU09OIGRhdGEgKHVzdS4gY2FsbGVkIGJ5IGNvbnZlbmllbmNlIGZ1bmN0aW9ucyBiZWxvdylcbmZ1bmN0aW9uIGxvYWROYW1lc2V0RGF0YSggZGF0YSwgbG9hZGVkRmlsZU5hbWUsIGxhc3RNb2RpZmllZERhdGUgKSB7XG4gICAgLyogUGFyc2UgdGhpcyBkYXRhIGFzIGBuYW1lc2V0YCAoYSBzaW1wbGUgSlMgb2JqZWN0KSwgdGhlbiBjb252ZXJ0IHRoaXNcbiAgICAgKiBpbnRvIG91ciBwcmltYXJ5IHZpZXcgbW9kZWwgZm9yIEtub2Nrb3V0SlMgIChieSBjb252ZW50aW9uLCBpdCdzIHVzdWFsbHlcbiAgICAgKiBuYW1lZCAndmlld01vZGVsJykuXG4gICAgICovXG4gICAgdmFyIG5hbWVzZXQ7XG4gICAgc3dpdGNoKHR5cGVvZiBkYXRhKSB7IFxuICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy8gaXQncyBudWxsLCBvciB1bmRlZmluZWQ/IG9yIHNvbWV0aGluZyBkdW1iXG4gICAgICAgICAgICAgICAgbmFtZXNldCA9IGdldE5ld05hbWVzZXRNb2RlbCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuYW1lc2V0ID0gZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd1bmRlZmluZWQnOlxuICAgICAgICAgICAgbmFtZXNldCA9IGdldE5ld05hbWVzZXRNb2RlbCgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgLy8gSUYgdGhpcyBmYWlscywgdHJ5IHRvIGltcG9ydCBUU1YvQ1NWLCBsaW5lLWJ5LWxpbmUgdGV4dFxuICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBjb252ZXJ0VG9OYW1lc2V0TW9kZWwoZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDogXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5leHBlY3RlZCB0eXBlIGZvciBuYW1lc2V0IGRhdGE6IFwiKyAodHlwZW9mIGRhdGEpKTtcbiAgICAgICAgICAgIG5hbWVzZXQgPSBudWxsO1xuICAgIH1cblxuICAgIC8qIFwiTm9ybWFsaXplXCIgdGhlIG5hbWVzZXQgYnkgYWRkaW5nIGFueSBtaXNzaW5nIHByb3BlcnRpZXMgYW5kIG1ldGFkYXRhLlxuICAgICAqIChUaGlzIGlzIG1haW5seSB1c2VmdWwgd2hlbiBsb2FkaW5nIGFuIG9sZGVyIGFyY2hpdmVkIG5hbWVzZXQsIHRvXG4gICAgICogY2F0Y2ggdXAgd2l0aCBhbnkgY2hhbmdlcyB0byB0aGUgZXhwZWN0ZWQgZGF0YSBtb2RlbC4pXG4gICAgICovXG4gICAgaWYgKG5hbWVzZXQubWV0YWRhdGFbJ2RhdGVfY3JlYXRlZCddID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gY3JlYXRpb24gZGF0ZSBpcyBub3Qga25vd2FibGU7IG1hdGNoIGxhc3Qtc2F2ZWQgZGF0ZSBmcm9tIGZpbGVcbiAgICAgICAgbmFtZXNldC5tZXRhZGF0YS5kYXRlX2NyZWF0ZWQgPSBsYXN0TW9kaWZpZWREYXRlLnRvSVNPU3RyaW5nKCk7XG4gICAgfVxuICAgIGlmIChuYW1lc2V0Lm1ldGFkYXRhWydsYXN0X3NhdmVkJ10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBhc3N1bWUgbGFzdC1zYXZlZCBkYXRlIGZyb20gZmlsZSBpcyBjb3JyZWN0XG4gICAgICAgIG5hbWVzZXQubWV0YWRhdGEubGFzdF9zYXZlZCA9IGxhc3RNb2RpZmllZERhdGUudG9JU09TdHJpbmcoKTtcbiAgICB9XG4gICAgaWYgKG5hbWVzZXQubWV0YWRhdGFbJ3NhdmVfY291bnQnXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIHRydWUgbnVtYmVyIG9mIHNhdmVzIGlzIG5vdCBrbm93YWJsZSwgYnV0IHRoZXJlJ3MgYmVlbiBhdCBsZWFzdCBvbmUhXG4gICAgICAgIG5hbWVzZXQubWV0YWRhdGEuc2F2ZV9jb3VudCA9IDE7XG4gICAgfVxuICAgIGlmIChuYW1lc2V0Lm1ldGFkYXRhWydsYXRlc3Rfb3R0X3ZlcnNpb24nXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG5hbWVzZXQubWV0YWRhdGEubGF0ZXN0X290dF92ZXJzaW9uID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGxvYWRlZEZpbGVOYW1lKSB7XG4gICAgICAgIC8vIFdlIGp1c3QgbG9hZGVkIGFuIGFyY2hpdmUgZmlsZSEgU3RvcmUgaXRzIGxhdGVzdCBmaWxlbmFtZS5cbiAgICAgICAgbmFtZXNldC5tZXRhZGF0YS5wcmV2aW91c19maWxlbmFtZSA9IGxvYWRlZEZpbGVOYW1lO1xuICAgIH1cbiAgICBpZiAobmFtZXNldC5tYXBwaW5nSGludHNbJ2F1dG9BY2NlcHRFeGFjdE1hdGNoZXMnXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG5hbWVzZXQubWFwcGluZ0hpbnRzWydhdXRvQWNjZXB0RXhhY3RNYXRjaGVzJ10gPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvKiBOYW1lIGFuZCBleHBvcnQgdGhlIG5ldyB2aWV3bW9kZWwuIE5PVEUgdGhhdCB3ZSBkb24ndCBjcmVhdGUgb2JzZXJ2YWJsZXNcbiAgICAgKiBmb3IgbmFtZXMgYW5kIHRoZWlyIG1hbnkgcHJvcGVydGllcyEgVGhpcyBzaG91bGQgaGVscCBrZWVwIHRoaW5ncyBzbmFwcHlcbiAgICAgKiB3aGVuIHdvcmlpbmcgd2l0aCB2ZXJ5IGxhcmdlIGxpc3RzLlxuICAgICAqL1xuICAgIHZhciBrbm9ja291dE1hcHBpbmdPcHRpb25zID0ge1xuICAgICAgICAnY29weSc6IFtcIm5hbWVzXCJdICAvLyB3ZSdsbCBtYWtlIHRoZSAnbmFtZXMnIGFycmF5IG9ic2VydmFibGUgYmVsb3dcbiAgICB9O1xuXG4gICAgZXhwb3J0cy52aWV3TW9kZWwgPSB2aWV3TW9kZWwgPSBrby5tYXBwaW5nLmZyb21KUyhuYW1lc2V0LCBrbm9ja291dE1hcHBpbmdPcHRpb25zKTtcbiAgICB2aWV3TW9kZWwubmFtZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkodmlld01vZGVsLm5hbWVzKTtcblxuICAgIC8vIGNsZWFudXAgb2YgaW5jb21pbmcgZGF0YVxuICAgIHJlbW92ZUR1cGxpY2F0ZU5hbWVzKHZpZXdNb2RlbCk7XG5cbiAgICAvLyB0YWtlIGluaXRpYWwgc3RhYiBhdCBzZXR0aW5nIHNlYXJjaCBjb250ZXh0IGZvciBUTlJTP1xuICAgIGluZmVyU2VhcmNoQ29udGV4dEZyb21BdmFpbGFibGVOYW1lcygpO1xuXG4gICAgLyogXG4gICAgICogQWRkIG9ic2VydmFibGUgcHJvcGVydGllcyB0byB0aGUgbW9kZWwgdG8gc3VwcG9ydCB0aGUgVUkuIFxuICAgICAqL1xuXG4gICAgLy8gcHJldHRpZXIgZGlzcGxheSBkYXRlc1xuICAgIHZpZXdNb2RlbC5kaXNwbGF5Q3JlYXRpb25EYXRlID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRlID0gdmlld01vZGVsLm1ldGFkYXRhLmRhdGVfY3JlYXRlZCgpO1xuICAgICAgICByZXR1cm4gZm9ybWF0SVNPRGF0ZShkYXRlKTtcbiAgICB9KTtcbiAgICB2aWV3TW9kZWwuZGlzcGxheUxhc3RTYXZlID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkYXRlID0gdmlld01vZGVsLm1ldGFkYXRhLmxhc3Rfc2F2ZWQoKTtcbiAgICAgICAgaWYgKGRhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnTGFzdCBzYXZlZCAnKyBmb3JtYXRJU09EYXRlKGRhdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICdUaGlzIG5hbWVzZXQgaGFzIG5vdCBiZWVuIHNhdmVkLic7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2aWV3TW9kZWwuZGlzcGxheVByZXZpb3VzRmlsZW5hbWUgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZpbGVOYW1lID0gdmlld01vZGVsLm1ldGFkYXRhLnByZXZpb3VzX2ZpbGVuYW1lKCk7XG4gICAgICAgIGlmIChmaWxlTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiTG9hZGVkIGZyb20gZmlsZSA8Y29kZT5cIisgZmlsZU5hbWUgK1wiPC9jb2RlPi5cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAnVGhpcyBpcyBhIG5ldyBuYW1lc2V0IChubyBwcmV2aW91cyBmaWxlbmFtZSkuJztcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQWRkIGEgc2VyaWVzIG9mIG9ic2VydmFibGUgXCJ0aWNrbGVyc1wiIHRvIHNpZ25hbCBjaGFuZ2VzIGluXG4gICAgLy8gdGhlIG1vZGVsIHdpdGhvdXQgb2JzZXJ2YWJsZSBOZXhzb24gcHJvcGVydGllcy4gRWFjaCBpcyBhblxuICAgIC8vIGludGVnZXIgdGhhdCBjcmVlcHMgdXAgYnkgMSB0byBzaWduYWwgYSBjaGFuZ2Ugc29tZXdoZXJlIGluXG4gICAgLy8gcmVsYXRlZCBOZXhzb24gZWxlbWVudHMuXG4gICAgdmlld01vZGVsLnRpY2tsZXJzID0ge1xuICAgICAgICAnTUVUQURBVEEnOiBrby5vYnNlcnZhYmxlKDEpLFxuICAgICAgICAnSU5QVVRfRklMRVMnOiBrby5vYnNlcnZhYmxlKDEpLFxuICAgICAgICAnTkFNRV9NQVBQSU5HX0hJTlRTJzoga28ub2JzZXJ2YWJsZSgxKSxcbiAgICAgICAgJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUyc6IGtvLm9ic2VydmFibGUoMSksXG4gICAgICAgIC8vIFRPRE86IGFkZCBtb3JlIGFzIG5lZWRlZC4uLlxuICAgICAgICAnTkFNRVNFVF9IQVNfQ0hBTkdFRCc6IGtvLm9ic2VydmFibGUoMSlcbiAgICB9XG5cbiAgICAvLyBzdXBwb3J0IGZhc3QgbG9va3VwIG9mIGVsZW1lbnRzIGJ5IElELCBmb3IgbGFyZ2VzdCB0cmVlc1xuICAgIHZpZXdNb2RlbC5mYXN0TG9va3VwcyA9IHtcbiAgICAgICAgJ05BTUVTX0JZX0lEJzogbnVsbFxuICAgIH07XG5cbiAgICAvLyBlbmFibGUgc29ydGluZyBhbmQgZmlsdGVyaW5nIGxpc3RzIGluIHRoZSBlZGl0b3JcbiAgICB2YXIgbGlzdEZpbHRlckRlZmF1bHRzID0ge1xuICAgICAgICAvLyB0cmFjayB0aGVzZSBkZWZhdWx0cyBzbyB3ZSBjYW4gcmVzZXQgdGhlbSBpbiBoaXN0b3J5XG4gICAgICAgICdOQU1FUyc6IHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFkZCAncGFnZXNpemUnP1xuICAgICAgICAgICAgJ21hdGNoJzogXCJcIixcbiAgICAgICAgICAgICdvcmRlcic6IFwiVW5tYXBwZWQgbmFtZXMgZmlyc3RcIlxuICAgICAgICB9XG4gICAgfTtcbiAgICB2aWV3TW9kZWwuZmlsdGVyRGVsYXkgPSAyNTA7IC8vIG1zIHRvIHdhaXQgZm9yIGNoYW5nZXMgYmVmb3JlIHVwZGF0aW5nIGZpbHRlclxuICAgIHZpZXdNb2RlbC5saXN0RmlsdGVycyA9IHtcbiAgICAgICAgLy8gVUkgd2lkZ2V0cyBib3VuZCB0byB0aGVzZSB2YXJpYWJsZXMgd2lsbCB0cmlnZ2VyIHRoZVxuICAgICAgICAvLyBjb21wdXRlZCBkaXNwbGF5IGxpc3RzIGJlbG93Li5cbiAgICAgICAgJ05BTUVTJzoge1xuICAgICAgICAgICAgLy8gVE9ETzogYWRkICdwYWdlc2l6ZSc/XG4gICAgICAgICAgICAnbWF0Y2gnOiBrby5vYnNlcnZhYmxlKCBsaXN0RmlsdGVyRGVmYXVsdHMuTkFNRVMubWF0Y2ggKSxcbiAgICAgICAgICAgICdvcmRlcic6IGtvLm9ic2VydmFibGUoIGxpc3RGaWx0ZXJEZWZhdWx0cy5OQU1FUy5vcmRlciApXG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8vIGFueSBjaGFuZ2UgdG8gdGhlc2UgbGlzdCBmaWx0ZXJzIHNob3VsZCByZXNldCBwYWdpbmF0aW9uIGZvciB0aGUgY3VycmVudCBkaXNwbGF5IGxpc3RcbiAgICAvLyBOQiB0aGlzIGlzIGEgc3RyZWFtbGluZWQgdmVyc2lvbiBvZiB0aGUgbW9yZSBnZW5lcmFsIGZpeCBpbiBzdHVkeS1lZGl0b3IuanMhXG4gICAgJC5lYWNoKHZpZXdNb2RlbC5saXN0RmlsdGVycy5OQU1FUywgZnVuY3Rpb24oZmlsdGVyTmFtZSwgZmlsdGVyT2JzZXJ2YWJsZSkge1xuICAgICAgICBmaWx0ZXJPYnNlcnZhYmxlLnN1YnNjcmliZShmdW5jdGlvbihuZXdWYWx1ZSkge1xuICAgICAgICAgICAgLy8gaWdub3JlIHZhbHVlLCBqdXN0IHJlc2V0IHBhZ2luYXRpb24gKGJhY2sgdG8gcGFnZSAxKVxuICAgICAgICAgICAgdmlld01vZGVsLl9maWx0ZXJlZE9UVXMuZ29Ub1BhZ2UoMSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuIFxuICAgIC8vIG1haW50YWluIGEgcGVyc2lzdGVudCBhcnJheSB0byBwcmVzZXJ2ZSBwYWdpbmF0aW9uIChyZXNldCB3aGVuIGNvbXB1dGVkKVxuICAgIHZpZXdNb2RlbC5fZmlsdGVyZWROYW1lcyA9IGtvLm9ic2VydmFibGVBcnJheSggKS5hc1BhZ2VkKDUwMCk7XG4gICAgdmlld01vZGVsLmZpbHRlcmVkTmFtZXMgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gZmlsdGVyIHJhdyBuYW1lIGxpc3QsIHRoZW4gc29ydCwgcmV0dXJuaW5nIGFcbiAgICAgICAgLy8gbmV3IChPUiBNT0RJRklFRD8/KSBwYWdlZCBvYnNlcnZhYmxlQXJyYXlcbiAgICAgICAgLy8vdmFyIHRpY2tsZXJzID0gWyB2aWV3TW9kZWwudGlja2xlcnMuTkFNRV9NQVBQSU5HX0hJTlRTKCkgXTtcblxuICAgICAgICB1cGRhdGVDbGVhclNlYXJjaFdpZGdldCggJyNuYW1lLWxpc3QtZmlsdGVyJyApO1xuICAgICAgICAvL3VwZGF0ZUxpc3RGaWx0ZXJzV2l0aEhpc3RvcnkoKTtcblxuICAgICAgICB2YXIgbWF0Y2ggPSB2aWV3TW9kZWwubGlzdEZpbHRlcnMuTkFNRVMubWF0Y2goKSxcbiAgICAgICAgICAgIG1hdGNoV2l0aERpYWNyaXRpY2FscyA9IGFkZERpYWNyaXRpY2FsVmFyaWFudHMobWF0Y2gpLFxuICAgICAgICAgICAgbWF0Y2hQYXR0ZXJuID0gbmV3IFJlZ0V4cCggJC50cmltKG1hdGNoV2l0aERpYWNyaXRpY2FscyksICdpJyApO1xuICAgICAgICB2YXIgb3JkZXIgPSB2aWV3TW9kZWwubGlzdEZpbHRlcnMuTkFNRVMub3JkZXIoKTtcblxuICAgICAgICAvLyBjYXB0dXJlIGN1cnJlbnQgcG9zaXRpb25zLCB0byBhdm9pZCB1bm5lY2Vzc2FyeSBcImp1bXBpbmdcIiBpbiB0aGUgbGlzdFxuICAgICAgICBjYXB0dXJlRGVmYXVsdFNvcnRPcmRlcih2aWV3TW9kZWwubmFtZXMoKSk7XG5cbiAgICAgICAgLyogVE9ETzogcG9vbCBhbGwgbmFtZSBJRHMgaW50byBhIGNvbW1vbiBvYmplY3Q/XG4gICAgICAgIHZhciBjaG9zZW5OYW1lSURzID0ge307XG4gICAgICAgIGNvbnNvbGUud2FybihjaG9zZW5OYW1lSURzKTtcbiAgICAgICAgaWYgKGNob3Nlbk5hbWVJRHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiSGVyZSdzIHRoZSBmaXJzdCBvZiBjaG9zZW5OYW1lSURzOlwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihjaG9zZW5OYW1lSURzWzBdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImNob3Nlbk5hbWVJRHMgaXMgYW4gZW1wdHkgbGlzdCFcIik7XG4gICAgICAgIH1cbiAgICAgICAgKi9cblxuICAgICAgICAvLyBtYXAgb2xkIGFycmF5IHRvIG5ldyBhbmQgcmV0dXJuIGl0XG4gICAgICAgIHZhciBmaWx0ZXJlZExpc3QgPSBrby51dGlscy5hcnJheUZpbHRlcihcbiAgICAgICAgICAgIHZpZXdNb2RlbC5uYW1lcygpLFxuICAgICAgICAgICAgZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgICAgIC8vIG1hdGNoIGVudGVyZWQgdGV4dCBhZ2FpbnN0IG9sZCBvciBuZXcgbGFiZWxcbiAgICAgICAgICAgICAgICB2YXIgb3JpZ2luYWxMYWJlbCA9IG5hbWVbJ29yaWdpbmFsTGFiZWwnXTtcbiAgICAgICAgICAgICAgICB2YXIgbW9kaWZpZWRMYWJlbCA9IG5hbWVbJ2FkanVzdGVkTGFiZWwnXSB8fCBhZGp1c3RlZExhYmVsKG9yaWdpbmFsTGFiZWwpO1xuICAgICAgICAgICAgICAgIHZhciBtYXBwZWRMYWJlbCA9IG5hbWVbJ290dFRheG9uTmFtZSddO1xuICAgICAgICAgICAgICAgIGlmICghbWF0Y2hQYXR0ZXJuLnRlc3Qob3JpZ2luYWxMYWJlbCkgJiZcbiAgICAgICAgICAgICAgICAgICAgIW1hdGNoUGF0dGVybi50ZXN0KG1vZGlmaWVkTGFiZWwpICYmXG4gICAgICAgICAgICAgICAgICAgICFtYXRjaFBhdHRlcm4udGVzdChtYXBwZWRMYWJlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTsgIC8vIEVORCBvZiBsaXN0IGZpbHRlcmluZ1xuXG4gICAgICAgIC8vIGFwcGx5IHNlbGVjdGVkIHNvcnQgb3JkZXJcbiAgICAgICAgc3dpdGNoKG9yZGVyKSB7XG4gICAgICAgICAgICAvKiBSRU1JTkRFUjogaW4gc29ydCBmdW5jdGlvbnMsIHJlc3VsdHMgYXJlIGFzIGZvbGxvd3M6XG4gICAgICAgICAgICAgKiAgLTEgPSBhIGNvbWVzIGJlZm9yZSBiXG4gICAgICAgICAgICAgKiAgIDAgPSBubyBjaGFuZ2VcbiAgICAgICAgICAgICAqICAgMSA9IGIgY29tZXMgYmVmb3JlIGFcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgY2FzZSAnVW5tYXBwZWQgbmFtZXMgZmlyc3QnOlxuICAgICAgICAgICAgICAgIGZpbHRlcmVkTGlzdC5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgICAgICAvLyBOLkIuIFRoaXMgd29ya3MgZXZlbiBpZiB0aGVyZSdzIG5vIHN1Y2ggcHJvcGVydHkuXG4gICAgICAgICAgICAgICAgICAgIC8vaWYgKGNoZWNrRm9ySW50ZXJlc3RpbmdTdHVkaWVzKGEsYikpIHsgZGVidWdnZXI7IH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGFNYXBTdGF0dXMgPSAkLnRyaW0oYVsnb3R0VGF4b25OYW1lJ10pICE9PSAnJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJNYXBTdGF0dXMgPSAkLnRyaW0oYlsnb3R0VGF4b25OYW1lJ10pICE9PSAnJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFNYXBTdGF0dXMgPT09IGJNYXBTdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYU1hcFN0YXR1cykgeyAvLyBib3RoIG5hbWVzIGFyZSBjdXJyZW50bHkgdW4tbWFwcGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgZmFpbGVkIG1hcHBpbmdzIHRvIHRoZSBib3R0b20gb2YgdGhlIGxpc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYUZhaWxlZE1hcHBpbmcgPSAoZmFpbGVkTWFwcGluZ05hbWVzLmluZGV4T2YoYVsnaWQnXSkgIT09IC0xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYkZhaWxlZE1hcHBpbmcgPSAoZmFpbGVkTWFwcGluZ05hbWVzLmluZGV4T2YoYlsnaWQnXSkgIT09IC0xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYUZhaWxlZE1hcHBpbmcgPT09IGJGYWlsZWRNYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyeSB0byByZXRhaW4gdGhlaXIgcHJpb3IgcHJlY2VkZW5jZSBpblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgbGlzdCAoYXZvaWQgaXRlbXMganVtcGluZyBhcm91bmQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qcmV0dXJuIChhLnByaW9yUG9zaXRpb24gPCBiLnByaW9yUG9zaXRpb24pID8gLTE6MTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICogU2hvdWxkIHRoaXMgc3VwZXJjZWRlIG91ciB0eXBpY2FsIHVzZSBvZiBgbWFpbnRhaW5SZWxhdGl2ZUxpc3RQb3NpdGlvbnNgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1haW50YWluUmVsYXRpdmVMaXN0UG9zaXRpb25zKGEsIGIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYUZhaWxlZE1hcHBpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7ICAgLy8gZm9yY2UgYSAoZmFpbGVkKSBiZWxvdyBiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTsgICAvLyBmb3JjZSBiIChmYWlsZWQpIGJlbG93IGFcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9yZXR1cm4gKGEucHJpb3JQb3NpdGlvbiA8IGIucHJpb3JQb3NpdGlvbikgPyAtMToxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtYWludGFpblJlbGF0aXZlTGlzdFBvc2l0aW9ucyhhLCBiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoYU1hcFN0YXR1cykgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiTWFwU3RhdHVzKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ01hcHBlZCBuYW1lcyBmaXJzdCc6XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRMaXN0LnNvcnQoZnVuY3Rpb24oYSxiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhTWFwU3RhdHVzID0gJC50cmltKGFbJ290dFRheG9uTmFtZSddKSAhPT0gJyc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiTWFwU3RhdHVzID0gJC50cmltKGJbJ290dFRheG9uTmFtZSddKSAhPT0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhTWFwU3RhdHVzID09PSBiTWFwU3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFpbnRhaW5SZWxhdGl2ZUxpc3RQb3NpdGlvbnMoYSwgYik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFNYXBTdGF0dXMpIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ09yaWdpbmFsIG5hbWUgKEEtWiknOlxuICAgICAgICAgICAgICAgIGZpbHRlcmVkTGlzdC5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYU9yaWdpbmFsID0gJC50cmltKGFbJ29yaWdpbmFsTGFiZWwnXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiT3JpZ2luYWwgPSAkLnRyaW0oYlsnb3JpZ2luYWxMYWJlbCddKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFPcmlnaW5hbCA9PT0gYk9yaWdpbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFpbnRhaW5SZWxhdGl2ZUxpc3RQb3NpdGlvbnMoYSwgYik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFPcmlnaW5hbCA8IGJPcmlnaW5hbCkgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnT3JpZ2luYWwgbmFtZSAoWi1BKSc6XG4gICAgICAgICAgICAgICAgZmlsdGVyZWRMaXN0LnNvcnQoZnVuY3Rpb24oYSxiKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhT3JpZ2luYWwgPSAkLnRyaW0oYVsnb3JpZ2luYWxMYWJlbCddKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJPcmlnaW5hbCA9ICQudHJpbShiWydvcmlnaW5hbExhYmVsJ10pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYU9yaWdpbmFsID09PSBiT3JpZ2luYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtYWludGFpblJlbGF0aXZlTGlzdFBvc2l0aW9ucyhhLCBiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoYU9yaWdpbmFsID4gYk9yaWdpbmFsKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVW5leHBlY3RlZCBvcmRlciBmb3IgbmFtZSBsaXN0OiBbXCIrIG9yZGVyICtcIl1cIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBVbi1zZWxlY3QgYW55IG5hbWUgdGhhdCdzIG5vdyBvdXQgb2YgdmlldyAoaWUsIG91dHNpZGUgb2YgdGhlIGZpcnN0IHBhZ2Ugb2YgcmVzdWx0cylcbiAgICAgICAgdmFyIGl0ZW1zSW5WaWV3ID0gZmlsdGVyZWRMaXN0LnNsaWNlKDAsIHZpZXdNb2RlbC5fZmlsdGVyZWROYW1lcy5wYWdlU2l6ZSk7XG4gICAgICAgIHZpZXdNb2RlbC5uYW1lcygpLm1hcChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgICBpZiAobmFtZVsnc2VsZWN0ZWRGb3JBY3Rpb24nXSkge1xuICAgICAgICAgICAgICAgIHZhciBpc091dE9mVmlldyA9ICgkLmluQXJyYXkobmFtZSwgaXRlbXNJblZpZXcpID09PSAtMSk7XG4gICAgICAgICAgICAgICAgaWYgKGlzT3V0T2ZWaWV3KSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVbJ3NlbGVjdGVkRm9yQWN0aW9uJ10gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGNsZWFyIGFueSBzdGFsZSBsYXN0LXNlbGVjdGVkIG5hbWUgKGl0J3MgbGlrZWx5IG1vdmVkKVxuICAgICAgICBsYXN0Q2xpY2tlZFRvZ2dsZVBvc2l0aW9uID0gbnVsbDtcblxuICAgICAgICB2aWV3TW9kZWwuX2ZpbHRlcmVkTmFtZXMoIGZpbHRlcmVkTGlzdCApO1xuICAgICAgICByZXR1cm4gdmlld01vZGVsLl9maWx0ZXJlZE5hbWVzO1xuICAgIH0pLmV4dGVuZCh7IHRocm90dGxlOiB2aWV3TW9kZWwuZmlsdGVyRGVsYXkgfSk7IC8vIEVORCBvZiBmaWx0ZXJlZE5hbWVzXG5cbiAgICAvLyBTdGFzaCB0aGUgcHJpc3RpbmUgbWFya3VwIGJlZm9yZSBiaW5kaW5nIG91ciBVSSBmb3IgdGhlIGZpcnN0IHRpbWVcbiAgICBpZiAoJHN0YXNoZWRFZGl0QXJlYSA9PT0gbnVsbCkge1xuICAgICAgICAkc3Rhc2hlZEVkaXRBcmVhID0gJCgnI05hbWUtTWFwcGluZycpLmNsb25lKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gUmVwbGFjZSB3aXRoIHByaXN0aW5lIG1hcmt1cCB0byBhdm9pZCB3ZWlyZCByZXN1bHRzIHdoZW4gbG9hZGluZyBhIG5ldyBuYW1lc2V0XG4gICAgICAgICQoJyNOYW1lLU1hcHBpbmcnKS5jb250ZW50cygpLnJlcGxhY2VXaXRoKFxuICAgICAgICAgICAgJHN0YXNoZWRFZGl0QXJlYS5jbG9uZSgpLmNvbnRlbnRzKClcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyAocmUpYmluZCB0byBlZGl0b3IgVUkgd2l0aCBLbm9ja291dFxuICAgIHZhciAkYm91bmRFbGVtZW50cyA9ICQoJyNOYW1lLU1hcHBpbmcsICNoZWxwLWZpbGUtYXBpLXByb21wdCcpOyAvLyBhZGQgb3RoZXIgZWxlbWVudHM/XG4gICAgJC5lYWNoKCRib3VuZEVsZW1lbnRzLCBmdW5jdGlvbihpLCBlbCkge1xuICAgICAgICBrby5jbGVhbk5vZGUoZWwpO1xuICAgICAgICBrby5hcHBseUJpbmRpbmdzKHZpZXdNb2RlbCxlbCk7XG4gICAgfSk7XG5cbiAgICAvKiBBbnkgZnVydGhlciBjaGFuZ2VzICgqYWZ0ZXIqIGluaXRpYWwgY2xlYW51cCkgc2hvdWxkIHByb21wdCBmb3IgYSBzYXZlXG4gICAgICogYmVmb3JlIGxlYXZpbmcgdGhpcyBwYWdlLlxuICAgICAqL1xuICAgIHZpZXdNb2RlbC50aWNrbGVycy5OQU1FU0VUX0hBU19DSEFOR0VELnN1YnNjcmliZSggZnVuY3Rpb24oKSB7XG4gICAgICAgIG5hbWVzZXRIYXNVbnNhdmVkQ2hhbmdlcyA9IHRydWU7XG4gICAgICAgIGVuYWJsZVNhdmVCdXR0b24oKTtcbiAgICAgICAgcHVzaFBhZ2VFeGl0V2FybmluZygnVU5TQVZFRF9OQU1FU0VUX0NIQU5HRVMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiV0FSTklORzogVGhpcyBuYW1lc2V0IGhhcyB1bnNhdmVkIGNoYW5nZXMhIFRvIHByZXNlcnZlIHlvdXIgd29yaywgeW91IHNob3VsZCBzYXZlIGEgbmFtZXNldCBmaWxlIGJlZm9yZSBsZWF2aW5nIG9yIHJlbG9hZGluZyB0aGUgcGFnZS5cIik7XG4gICAgfSk7XG4gICAgcG9wUGFnZUV4aXRXYXJuaW5nKCdVTlNBVkVEX05BTUVTRVRfQ0hBTkdFUycpO1xuICAgIG5hbWVzZXRIYXNVbnNhdmVkQ2hhbmdlcyA9IGZhbHNlO1xuICAgIGRpc2FibGVTYXZlQnV0dG9uKCk7XG59XG5cbi8vIGtlZXAgdHJhY2sgb2YgdGhlIGxhcmdlc3QgKGFuZCB0aHVzIG5leHQgYXZhaWxhYmxlKSBuYW1lIGlkXG52YXIgaGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyID0gbnVsbDtcbmZ1bmN0aW9uIGZpbmRIaWdoZXN0TmFtZU9yZGluYWxOdW1iZXIoKSB7XG4gICAgLy8gZG8gYSBvbmUtdGltZSBzY2FuIGZvciB0aGUgaGlnaGVzdCBJRCBjdXJyZW50bHkgaW4gdXNlXG4gICAgdmFyIGhpZ2hlc3RPcmRpbmFsTnVtYmVyID0gMDtcbiAgICB2YXIgYWxsTmFtZXMgPSB2aWV3TW9kZWwubmFtZXMoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsbE5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB0ZXN0TmFtZSA9IGFsbE5hbWVzW2ldO1xuICAgICAgICB2YXIgdGVzdElEID0ga28udW53cmFwKHRlc3ROYW1lWydpZCddKSB8fCAnJztcbiAgICAgICAgaWYgKHRlc3RJRCA9PT0gJycpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJNSVNTSU5HIElEIGZvciB0aGlzIG5hbWU6XCIpO1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcih0ZXN0TmFtZSk7XG4gICAgICAgICAgICBjb250aW51ZTsgIC8vIHNraXAgdG8gbmV4dCBlbGVtZW50XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRlc3RJRC5pbmRleE9mKCduYW1lJykgPT09IDApIHtcbiAgICAgICAgICAgIC8vIGNvbXBhcmUgdGhpcyB0byB0aGUgaGlnaGVzdCBJRCBmb3VuZCBzbyBmYXJcbiAgICAgICAgICAgIHZhciBpdHNOdW1iZXIgPSB0ZXN0SUQuc3BsaXQoICduYW1lJyApWzFdO1xuICAgICAgICAgICAgaWYgKCQuaXNOdW1lcmljKCBpdHNOdW1iZXIgKSkge1xuICAgICAgICAgICAgICAgIGhpZ2hlc3RPcmRpbmFsTnVtYmVyID0gTWF0aC5tYXgoIGhpZ2hlc3RPcmRpbmFsTnVtYmVyLCBpdHNOdW1iZXIgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaGlnaGVzdE9yZGluYWxOdW1iZXI7XG59XG5mdW5jdGlvbiBnZXROZXh0TmFtZU9yZGluYWxOdW1iZXIoKSB7XG4gICAgLy8gaW5jcmVtZW50IGFuZCByZXR1cm4gdGhlIG5leHQgYXZhaWxhYmxlIG9yZGluYWwgbnVtYmVyIGZvciBuYW1lczsgdGhpc1xuICAgIC8vIGlzIHR5cGljYWxseSB1c2VkIHRvIG1pbnQgYSBuZXcgaWQsIGUuZy4gMjMgPT4gJ25hbWUyMydcbiAgICBpZiAoaGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyID09PSBudWxsKSB7XG4gICAgICAgIGhpZ2hlc3ROYW1lT3JkaW5hbE51bWJlciA9IGZpbmRIaWdoZXN0TmFtZU9yZGluYWxOdW1iZXIoKTtcbiAgICB9XG4gICAgLy8gaW5jcmVtZW50IHRoZSBoaWdoZXN0IElEIGZvciBmYXN0ZXIgYXNzaWdubWVudCBuZXh0IHRpbWVcbiAgICBoaWdoZXN0TmFtZU9yZGluYWxOdW1iZXIrKztcbiAgICByZXR1cm4gaGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyO1xufVxuXG5cbmZ1bmN0aW9uIHJlbW92ZUR1cGxpY2F0ZU5hbWVzKCB2aWV3bW9kZWwgKSB7XG4gICAgLyogQ2FsbCB0aGlzIHdoZW4gbG9hZGluZyBhIG5hbWVzZXQgKm9yKiBhZGRpbmcgbmFtZXMhICBXZSBzaG91bGQgd2FsayB0aGVcbiAgICAgKiBmdWxsIG5hbWVzIGFycmF5IGFuZCBjbG9iYmVyIGFueSBsYXRlciBkdXBsaWNhdGVzLiBUaGlzIGFycmF5IGlzIGFsd2F5c1xuICAgICAqIHNvcnRlZCBieSBjcmVhdGlvbiBvcmRlciwgc28gYSBzaW1wbGUgYXBwcm9hY2ggc2hvdWxkIHByZXNlcnZlIHRoZVxuICAgICAqIGN1cmF0b3IncyBleGlzdGluZyBtYXBwaW5ncyBhbmQgbGFiZWwgYWRqdXN0bWVudHMuXG4gICAgICovXG4gICAgdmFyIGxhYmVsc0FscmVhZHlGb3VuZCA9IFsgXTtcbiAgICB2YXIgZHVwZXMgPSBbIF07XG4gICAgJC5lYWNoKCB2aWV3TW9kZWwubmFtZXMoKSwgZnVuY3Rpb24oaSwgbmFtZSkge1xuICAgICAgICB2YXIgdGVzdExhYmVsID0gJC50cmltKG5hbWUub3JpZ2luYWxMYWJlbCk7XG4gICAgICAgIGlmIChsYWJlbHNBbHJlYWR5Rm91bmQuaW5kZXhPZih0ZXN0TGFiZWwpID09PSAtMSkge1xuICAgICAgICAgICAgLy8gYWRkIHRoaXMgdG8gbGFiZWxzIGZvdW5kICh0ZXN0IGxhdGVyIG5hbWVzIGFnYWluc3QgdGhpcylcbiAgICAgICAgICAgIGxhYmVsc0FscmVhZHlGb3VuZC5wdXNoKHRlc3RMYWJlbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB0aGlzIGlzIGEgZHVwZSBvZiBhbiBlYXJsaWVyIG5hbWUhXG4gICAgICAgICAgICBkdXBlcy5wdXNoKG5hbWUpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmlld01vZGVsLm5hbWVzLnJlbW92ZUFsbCggZHVwZXMgKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0SVNPRGF0ZSggZGF0ZVN0cmluZywgb3B0aW9ucyApIHtcbiAgICAvLyBjb3BpZWQgZnJvbSBzeW50aC10cmVlIHZpZXdlciAob3R1X3N0YXRpc3RpY3MuaHRtbClcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7aW5jbHVkZVRpbWU6IHRydWV9O1xuICAgIHZhciBhRGF0ZSA9IG5ldyBtb21lbnQoZGF0ZVN0cmluZyk7XG4gICAgLy8gc2VlIGh0dHA6Ly9tb21lbnRqcy5jb20vZG9jcy8jL3BhcnNpbmcvc3RyaW5nL1xuICAgIGlmIChvcHRpb25zLmluY2x1ZGVUaW1lKSB7XG4gICAgICAgIHJldHVybiBhRGF0ZS5mb3JtYXQoJ01NTU0gRG8gWVlZWSwgaEEnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gYURhdGUuZm9ybWF0KCdNTU1NIERvIFlZWVknKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNob3dQb3NzaWJsZU1hcHBpbmdzS2V5KCkge1xuICAgIC8vIGV4cGxhaW4gY29sb3JzIGFuZCBvcGFjaXR5IGluIGEgcG9wdXAgKGFscmVhZHkgYm91bmQpXG4gICAgJCgnI3Bvc3NpYmxlLW1hcHBpbmdzLWtleScpLm1vZGFsKCdzaG93Jyk7XG59XG5cbiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgIHN3aXRjaCAoY29udGV4dCkge1xuICAgICAgICBjYXNlICdCVUxLX1ROUlMnOlxuICAgICAgICAgICAgLy8gQWx3YXlzIHN0YXJ0IHdpdGggYW4gZW1wdHkgc2V0LCBiaW5kaW5nIGl0IHRvIHRoZSBVSVxuICAgICAgICAgICAgbG9hZE5hbWVzZXREYXRhKCBudWxsICk7XG4gICAgICAgICAgICAvLyBhdXRvLXNlbGVjdCB0aGUgbWFpbiAoVUkpIHRhYlxuICAgICAgICAgICAgJCgnYVtocmVmPSNOYW1lLU1hcHBpbmddJykudGFiKCdzaG93Jyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnU1RVRFlfT1RVX01BUFBJTkcnOlxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBbnl0aGluZyB0byBkbyBvbiByZWFkeT9cIik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnPz8/JzpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmcgZm9yIG5vdyAocG9zc2libHkgc3R1ZHkgVmlldyBwYWdlKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufSk7XG5cbi8vIGV4cG9ydCBzb21lIG1lbWJlcnMgYXMgYSBzaW1wbGUgQVBJXG52YXIgYXBpID0gW1xuICAgICdudWRnZScsICAvLyBleHBvc2UgdGlja2xlcnMgZm9yIEtPIGJpbmRpbmdzXG4gICAgJ2dldERlZmF1bHRBcmNoaXZlRmlsZW5hbWUnLFxuICAgICdzYXZlQ3VycmVudE5hbWVzZXQnLFxuICAgICdsb2FkTGlzdEZyb21DaG9zZW5GaWxlJyxcbiAgICAnbG9hZE5hbWVzZXRGcm9tQ2hvc2VuRmlsZScsXG4gICAgJ3Nob3dMb2FkTGlzdFBvcHVwJyxcbiAgICAnc2hvd0xvYWROYW1lc2V0UG9wdXAnLFxuICAgICdzaG93U2F2ZU5hbWVzZXRQb3B1cCcsXG4gICAgJ2Jyb3dzZXJTdXBwb3J0c0ZpbGVBUEknLFxuICAgICdhdXRvTWFwcGluZ0luUHJvZ3Jlc3MnLFxuICAgICd1cGRhdGVNYXBwaW5nSGludHMnLFxuICAgICdzaG93TmFtZXNldE1ldGFkYXRhJyxcbiAgICAnaGlkZU5hbWVzZXRNZXRhZGF0YScsXG4gICAgJ2luZmVyU2VhcmNoQ29udGV4dEZyb21BdmFpbGFibGVOYW1lcycsXG4gICAgJ3Nob3dNYXBwaW5nT3B0aW9ucycsXG4gICAgJ2hpZGVNYXBwaW5nT3B0aW9ucycsXG4gICAgJ2Rpc2FibGVTYXZlQnV0dG9uJyxcbiAgICAnZW5hYmxlU2F2ZUJ1dHRvbicsXG4gICAgJ2dldEF0dHJzRm9yTWFwcGluZ09wdGlvbicsXG4gICAgJ3N0YXJ0QXV0b01hcHBpbmcnLFxuICAgICdzdG9wQXV0b01hcHBpbmcnLFxuICAgICdnZXRNYXBwZWROYW1lc1RhbGx5JyxcbiAgICAnbWFwcGluZ1Byb2dyZXNzQXNQZXJjZW50JyxcbiAgICAnYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXInLFxuICAgICd0b2dnbGVNYXBwaW5nRm9yTmFtZScsXG4gICAgJ3RvZ2dsZUFsbE1hcHBpbmdDaGVja2JveGVzJyxcbiAgICAncHJvcG9zZWRNYXBwaW5nJyxcbiAgICAnYWRqdXN0ZWRMYWJlbE9yRW1wdHknLFxuICAgICdjdXJyZW50bHlNYXBwaW5nTmFtZXMnLFxuICAgICdmYWlsZWRNYXBwaW5nTmFtZXMnLFxuICAgICdlZGl0TmFtZUxhYmVsJyxcbiAgICAncmV2ZXJ0TmFtZUxhYmVsJyxcbiAgICAnbW9kaWZ5RWRpdGVkTGFiZWwnLFxuICAgICdhcHByb3ZlUHJvcG9zZWROYW1lTGFiZWwnLFxuICAgICdhcHByb3ZlUHJvcG9zZWROYW1lTWFwcGluZ09wdGlvbicsXG4gICAgJ2FwcHJvdmVBbGxWaXNpYmxlTWFwcGluZ3MnLFxuICAgICdyZWplY3RQcm9wb3NlZE5hbWVMYWJlbCcsXG4gICAgJ3JlamVjdEFsbFZpc2libGVNYXBwaW5ncycsXG4gICAgJ21hcE5hbWVUb1RheG9uJyxcbiAgICAndW5tYXBOYW1lRnJvbVRheG9uJyxcbiAgICAnY2xlYXJTZWxlY3RlZE1hcHBpbmdzJyxcbiAgICAnY2xlYXJBbGxNYXBwaW5ncycsXG4gICAgJ3Nob3dQb3NzaWJsZU1hcHBpbmdzS2V5JyxcbiAgICAnYWRkU3Vic3RpdHV0aW9uJyxcbiAgICAncmVtb3ZlU3Vic3RpdHV0aW9uJyxcbiAgICAnZm9ybWF0SVNPRGF0ZScsXG4gICAgJ2NvbnZlcnRUb05hbWVzZXRNb2RlbCcsXG4gICAgJ2NvbnRleHQnXG5dO1xuJC5lYWNoKGFwaSwgZnVuY3Rpb24oaSwgbWV0aG9kTmFtZSkge1xuICAgIC8vIHBvcHVsYXRlIHRoZSBkZWZhdWx0ICdtb2R1bGUuZXhwb3J0cycgb2JqZWN0XG4gICAgZXhwb3J0c1sgbWV0aG9kTmFtZSBdID0gZXZhbCggbWV0aG9kTmFtZSApO1xufSk7XG4iXX0=
