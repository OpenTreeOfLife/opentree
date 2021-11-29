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
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
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
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
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

JSZip v3.7.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/master/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/master/LICENSE
*/

!function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{("undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this).JSZip=t()}}(function(){return function s(a,o,h){function u(r,t){if(!o[r]){if(!a[r]){var e="function"==typeof require&&require;if(!t&&e)return e(r,!0);if(l)return l(r,!0);var i=new Error("Cannot find module '"+r+"'");throw i.code="MODULE_NOT_FOUND",i}var n=o[r]={exports:{}};a[r][0].call(n.exports,function(t){var e=a[r][1][t];return u(e||t)},n,n.exports,s,a,o,h)}return o[r].exports}for(var l="function"==typeof require&&require,t=0;t<h.length;t++)u(h[t]);return u}({1:[function(t,e,r){"use strict";var c=t("./utils"),d=t("./support"),p="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";r.encode=function(t){for(var e,r,i,n,s,a,o,h=[],u=0,l=t.length,f=l,d="string"!==c.getTypeOf(t);u<t.length;)f=l-u,i=d?(e=t[u++],r=u<l?t[u++]:0,u<l?t[u++]:0):(e=t.charCodeAt(u++),r=u<l?t.charCodeAt(u++):0,u<l?t.charCodeAt(u++):0),n=e>>2,s=(3&e)<<4|r>>4,a=1<f?(15&r)<<2|i>>6:64,o=2<f?63&i:64,h.push(p.charAt(n)+p.charAt(s)+p.charAt(a)+p.charAt(o));return h.join("")},r.decode=function(t){var e,r,i,n,s,a,o=0,h=0,u="data:";if(t.substr(0,u.length)===u)throw new Error("Invalid base64 input, it looks like a data url.");var l,f=3*(t=t.replace(/[^A-Za-z0-9\+\/\=]/g,"")).length/4;if(t.charAt(t.length-1)===p.charAt(64)&&f--,t.charAt(t.length-2)===p.charAt(64)&&f--,f%1!=0)throw new Error("Invalid base64 input, bad content length.");for(l=d.uint8array?new Uint8Array(0|f):new Array(0|f);o<t.length;)e=p.indexOf(t.charAt(o++))<<2|(n=p.indexOf(t.charAt(o++)))>>4,r=(15&n)<<4|(s=p.indexOf(t.charAt(o++)))>>2,i=(3&s)<<6|(a=p.indexOf(t.charAt(o++))),l[h++]=e,64!==s&&(l[h++]=r),64!==a&&(l[h++]=i);return l}},{"./support":30,"./utils":32}],2:[function(t,e,r){"use strict";var i=t("./external"),n=t("./stream/DataWorker"),s=t("./stream/Crc32Probe"),a=t("./stream/DataLengthProbe");function o(t,e,r,i,n){this.compressedSize=t,this.uncompressedSize=e,this.crc32=r,this.compression=i,this.compressedContent=n}o.prototype={getContentWorker:function(){var t=new n(i.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")),e=this;return t.on("end",function(){if(this.streamInfo.data_length!==e.uncompressedSize)throw new Error("Bug : uncompressed data size mismatch")}),t},getCompressedWorker:function(){return new n(i.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize",this.compressedSize).withStreamInfo("uncompressedSize",this.uncompressedSize).withStreamInfo("crc32",this.crc32).withStreamInfo("compression",this.compression)}},o.createWorkerFrom=function(t,e,r){return t.pipe(new s).pipe(new a("uncompressedSize")).pipe(e.compressWorker(r)).pipe(new a("compressedSize")).withStreamInfo("compression",e)},e.exports=o},{"./external":6,"./stream/Crc32Probe":25,"./stream/DataLengthProbe":26,"./stream/DataWorker":27}],3:[function(t,e,r){"use strict";var i=t("./stream/GenericWorker");r.STORE={magic:"\0\0",compressWorker:function(t){return new i("STORE compression")},uncompressWorker:function(){return new i("STORE decompression")}},r.DEFLATE=t("./flate")},{"./flate":7,"./stream/GenericWorker":28}],4:[function(t,e,r){"use strict";var i=t("./utils");var o=function(){for(var t,e=[],r=0;r<256;r++){t=r;for(var i=0;i<8;i++)t=1&t?3988292384^t>>>1:t>>>1;e[r]=t}return e}();e.exports=function(t,e){return void 0!==t&&t.length?"string"!==i.getTypeOf(t)?function(t,e,r,i){var n=o,s=i+r;t^=-1;for(var a=i;a<s;a++)t=t>>>8^n[255&(t^e[a])];return-1^t}(0|e,t,t.length,0):function(t,e,r,i){var n=o,s=i+r;t^=-1;for(var a=i;a<s;a++)t=t>>>8^n[255&(t^e.charCodeAt(a))];return-1^t}(0|e,t,t.length,0):0}},{"./utils":32}],5:[function(t,e,r){"use strict";r.base64=!1,r.binary=!1,r.dir=!1,r.createFolders=!0,r.date=null,r.compression=null,r.compressionOptions=null,r.comment=null,r.unixPermissions=null,r.dosPermissions=null},{}],6:[function(t,e,r){"use strict";var i=null;i="undefined"!=typeof Promise?Promise:t("lie"),e.exports={Promise:i}},{lie:37}],7:[function(t,e,r){"use strict";var i="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Uint32Array,n=t("pako"),s=t("./utils"),a=t("./stream/GenericWorker"),o=i?"uint8array":"array";function h(t,e){a.call(this,"FlateWorker/"+t),this._pako=null,this._pakoAction=t,this._pakoOptions=e,this.meta={}}r.magic="\b\0",s.inherits(h,a),h.prototype.processChunk=function(t){this.meta=t.meta,null===this._pako&&this._createPako(),this._pako.push(s.transformTo(o,t.data),!1)},h.prototype.flush=function(){a.prototype.flush.call(this),null===this._pako&&this._createPako(),this._pako.push([],!0)},h.prototype.cleanUp=function(){a.prototype.cleanUp.call(this),this._pako=null},h.prototype._createPako=function(){this._pako=new n[this._pakoAction]({raw:!0,level:this._pakoOptions.level||-1});var e=this;this._pako.onData=function(t){e.push({data:t,meta:e.meta})}},r.compressWorker=function(t){return new h("Deflate",t)},r.uncompressWorker=function(){return new h("Inflate",{})}},{"./stream/GenericWorker":28,"./utils":32,pako:38}],8:[function(t,e,r){"use strict";function A(t,e){var r,i="";for(r=0;r<e;r++)i+=String.fromCharCode(255&t),t>>>=8;return i}function i(t,e,r,i,n,s){var a,o,h=t.file,u=t.compression,l=s!==O.utf8encode,f=I.transformTo("string",s(h.name)),d=I.transformTo("string",O.utf8encode(h.name)),c=h.comment,p=I.transformTo("string",s(c)),m=I.transformTo("string",O.utf8encode(c)),_=d.length!==h.name.length,g=m.length!==c.length,b="",v="",y="",w=h.dir,k=h.date,x={crc32:0,compressedSize:0,uncompressedSize:0};e&&!r||(x.crc32=t.crc32,x.compressedSize=t.compressedSize,x.uncompressedSize=t.uncompressedSize);var S=0;e&&(S|=8),l||!_&&!g||(S|=2048);var z=0,C=0;w&&(z|=16),"UNIX"===n?(C=798,z|=function(t,e){var r=t;return t||(r=e?16893:33204),(65535&r)<<16}(h.unixPermissions,w)):(C=20,z|=function(t){return 63&(t||0)}(h.dosPermissions)),a=k.getUTCHours(),a<<=6,a|=k.getUTCMinutes(),a<<=5,a|=k.getUTCSeconds()/2,o=k.getUTCFullYear()-1980,o<<=4,o|=k.getUTCMonth()+1,o<<=5,o|=k.getUTCDate(),_&&(v=A(1,1)+A(B(f),4)+d,b+="up"+A(v.length,2)+v),g&&(y=A(1,1)+A(B(p),4)+m,b+="uc"+A(y.length,2)+y);var E="";return E+="\n\0",E+=A(S,2),E+=u.magic,E+=A(a,2),E+=A(o,2),E+=A(x.crc32,4),E+=A(x.compressedSize,4),E+=A(x.uncompressedSize,4),E+=A(f.length,2),E+=A(b.length,2),{fileRecord:R.LOCAL_FILE_HEADER+E+f+b,dirRecord:R.CENTRAL_FILE_HEADER+A(C,2)+E+A(p.length,2)+"\0\0\0\0"+A(z,4)+A(i,4)+f+b+p}}var I=t("../utils"),n=t("../stream/GenericWorker"),O=t("../utf8"),B=t("../crc32"),R=t("../signature");function s(t,e,r,i){n.call(this,"ZipFileWorker"),this.bytesWritten=0,this.zipComment=e,this.zipPlatform=r,this.encodeFileName=i,this.streamFiles=t,this.accumulate=!1,this.contentBuffer=[],this.dirRecords=[],this.currentSourceOffset=0,this.entriesCount=0,this.currentFile=null,this._sources=[]}I.inherits(s,n),s.prototype.push=function(t){var e=t.meta.percent||0,r=this.entriesCount,i=this._sources.length;this.accumulate?this.contentBuffer.push(t):(this.bytesWritten+=t.data.length,n.prototype.push.call(this,{data:t.data,meta:{currentFile:this.currentFile,percent:r?(e+100*(r-i-1))/r:100}}))},s.prototype.openedSource=function(t){this.currentSourceOffset=this.bytesWritten,this.currentFile=t.file.name;var e=this.streamFiles&&!t.file.dir;if(e){var r=i(t,e,!1,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);this.push({data:r.fileRecord,meta:{percent:0}})}else this.accumulate=!0},s.prototype.closedSource=function(t){this.accumulate=!1;var e=this.streamFiles&&!t.file.dir,r=i(t,e,!0,this.currentSourceOffset,this.zipPlatform,this.encodeFileName);if(this.dirRecords.push(r.dirRecord),e)this.push({data:function(t){return R.DATA_DESCRIPTOR+A(t.crc32,4)+A(t.compressedSize,4)+A(t.uncompressedSize,4)}(t),meta:{percent:100}});else for(this.push({data:r.fileRecord,meta:{percent:0}});this.contentBuffer.length;)this.push(this.contentBuffer.shift());this.currentFile=null},s.prototype.flush=function(){for(var t=this.bytesWritten,e=0;e<this.dirRecords.length;e++)this.push({data:this.dirRecords[e],meta:{percent:100}});var r=this.bytesWritten-t,i=function(t,e,r,i,n){var s=I.transformTo("string",n(i));return R.CENTRAL_DIRECTORY_END+"\0\0\0\0"+A(t,2)+A(t,2)+A(e,4)+A(r,4)+A(s.length,2)+s}(this.dirRecords.length,r,t,this.zipComment,this.encodeFileName);this.push({data:i,meta:{percent:100}})},s.prototype.prepareNextSource=function(){this.previous=this._sources.shift(),this.openedSource(this.previous.streamInfo),this.isPaused?this.previous.pause():this.previous.resume()},s.prototype.registerPrevious=function(t){this._sources.push(t);var e=this;return t.on("data",function(t){e.processChunk(t)}),t.on("end",function(){e.closedSource(e.previous.streamInfo),e._sources.length?e.prepareNextSource():e.end()}),t.on("error",function(t){e.error(t)}),this},s.prototype.resume=function(){return!!n.prototype.resume.call(this)&&(!this.previous&&this._sources.length?(this.prepareNextSource(),!0):this.previous||this._sources.length||this.generatedError?void 0:(this.end(),!0))},s.prototype.error=function(t){var e=this._sources;if(!n.prototype.error.call(this,t))return!1;for(var r=0;r<e.length;r++)try{e[r].error(t)}catch(t){}return!0},s.prototype.lock=function(){n.prototype.lock.call(this);for(var t=this._sources,e=0;e<t.length;e++)t[e].lock()},e.exports=s},{"../crc32":4,"../signature":23,"../stream/GenericWorker":28,"../utf8":31,"../utils":32}],9:[function(t,e,r){"use strict";var u=t("../compressions"),i=t("./ZipFileWorker");r.generateWorker=function(t,a,e){var o=new i(a.streamFiles,e,a.platform,a.encodeFileName),h=0;try{t.forEach(function(t,e){h++;var r=function(t,e){var r=t||e,i=u[r];if(!i)throw new Error(r+" is not a valid compression method !");return i}(e.options.compression,a.compression),i=e.options.compressionOptions||a.compressionOptions||{},n=e.dir,s=e.date;e._compressWorker(r,i).withStreamInfo("file",{name:t,dir:n,date:s,comment:e.comment||"",unixPermissions:e.unixPermissions,dosPermissions:e.dosPermissions}).pipe(o)}),o.entriesCount=h}catch(t){o.error(t)}return o}},{"../compressions":3,"./ZipFileWorker":8}],10:[function(t,e,r){"use strict";function i(){if(!(this instanceof i))return new i;if(arguments.length)throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");this.files=Object.create(null),this.comment=null,this.root="",this.clone=function(){var t=new i;for(var e in this)"function"!=typeof this[e]&&(t[e]=this[e]);return t}}(i.prototype=t("./object")).loadAsync=t("./load"),i.support=t("./support"),i.defaults=t("./defaults"),i.version="3.7.1",i.loadAsync=function(t,e){return(new i).loadAsync(t,e)},i.external=t("./external"),e.exports=i},{"./defaults":5,"./external":6,"./load":11,"./object":15,"./support":30}],11:[function(t,e,r){"use strict";var i=t("./utils"),n=t("./external"),o=t("./utf8"),h=t("./zipEntries"),s=t("./stream/Crc32Probe"),u=t("./nodejsUtils");function l(i){return new n.Promise(function(t,e){var r=i.decompressed.getContentWorker().pipe(new s);r.on("error",function(t){e(t)}).on("end",function(){r.streamInfo.crc32!==i.decompressed.crc32?e(new Error("Corrupted zip : CRC32 mismatch")):t()}).resume()})}e.exports=function(t,s){var a=this;return s=i.extend(s||{},{base64:!1,checkCRC32:!1,optimizedBinaryString:!1,createFolders:!1,decodeFileName:o.utf8decode}),u.isNode&&u.isStream(t)?n.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")):i.prepareContent("the loaded zip file",t,!0,s.optimizedBinaryString,s.base64).then(function(t){var e=new h(s);return e.load(t),e}).then(function(t){var e=[n.Promise.resolve(t)],r=t.files;if(s.checkCRC32)for(var i=0;i<r.length;i++)e.push(l(r[i]));return n.Promise.all(e)}).then(function(t){for(var e=t.shift(),r=e.files,i=0;i<r.length;i++){var n=r[i];a.file(n.fileNameStr,n.decompressed,{binary:!0,optimizedBinaryString:!0,date:n.date,dir:n.dir,comment:n.fileCommentStr.length?n.fileCommentStr:null,unixPermissions:n.unixPermissions,dosPermissions:n.dosPermissions,createFolders:s.createFolders})}return e.zipComment.length&&(a.comment=e.zipComment),a})}},{"./external":6,"./nodejsUtils":14,"./stream/Crc32Probe":25,"./utf8":31,"./utils":32,"./zipEntries":33}],12:[function(t,e,r){"use strict";var i=t("../utils"),n=t("../stream/GenericWorker");function s(t,e){n.call(this,"Nodejs stream input adapter for "+t),this._upstreamEnded=!1,this._bindStream(e)}i.inherits(s,n),s.prototype._bindStream=function(t){var e=this;(this._stream=t).pause(),t.on("data",function(t){e.push({data:t,meta:{percent:0}})}).on("error",function(t){e.isPaused?this.generatedError=t:e.error(t)}).on("end",function(){e.isPaused?e._upstreamEnded=!0:e.end()})},s.prototype.pause=function(){return!!n.prototype.pause.call(this)&&(this._stream.pause(),!0)},s.prototype.resume=function(){return!!n.prototype.resume.call(this)&&(this._upstreamEnded?this.end():this._stream.resume(),!0)},e.exports=s},{"../stream/GenericWorker":28,"../utils":32}],13:[function(t,e,r){"use strict";var n=t("readable-stream").Readable;function i(t,e,r){n.call(this,e),this._helper=t;var i=this;t.on("data",function(t,e){i.push(t)||i._helper.pause(),r&&r(e)}).on("error",function(t){i.emit("error",t)}).on("end",function(){i.push(null)})}t("../utils").inherits(i,n),i.prototype._read=function(){this._helper.resume()},e.exports=i},{"../utils":32,"readable-stream":16}],14:[function(t,e,r){"use strict";e.exports={isNode:"undefined"!=typeof Buffer,newBufferFrom:function(t,e){if(Buffer.from&&Buffer.from!==Uint8Array.from)return Buffer.from(t,e);if("number"==typeof t)throw new Error('The "data" argument must not be a number');return new Buffer(t,e)},allocBuffer:function(t){if(Buffer.alloc)return Buffer.alloc(t);var e=new Buffer(t);return e.fill(0),e},isBuffer:function(t){return Buffer.isBuffer(t)},isStream:function(t){return t&&"function"==typeof t.on&&"function"==typeof t.pause&&"function"==typeof t.resume}}},{}],15:[function(t,e,r){"use strict";function s(t,e,r){var i,n=u.getTypeOf(e),s=u.extend(r||{},f);s.date=s.date||new Date,null!==s.compression&&(s.compression=s.compression.toUpperCase()),"string"==typeof s.unixPermissions&&(s.unixPermissions=parseInt(s.unixPermissions,8)),s.unixPermissions&&16384&s.unixPermissions&&(s.dir=!0),s.dosPermissions&&16&s.dosPermissions&&(s.dir=!0),s.dir&&(t=g(t)),s.createFolders&&(i=_(t))&&b.call(this,i,!0);var a="string"===n&&!1===s.binary&&!1===s.base64;r&&void 0!==r.binary||(s.binary=!a),(e instanceof d&&0===e.uncompressedSize||s.dir||!e||0===e.length)&&(s.base64=!1,s.binary=!0,e="",s.compression="STORE",n="string");var o=null;o=e instanceof d||e instanceof l?e:p.isNode&&p.isStream(e)?new m(t,e):u.prepareContent(t,e,s.binary,s.optimizedBinaryString,s.base64);var h=new c(t,o,s);this.files[t]=h}var n=t("./utf8"),u=t("./utils"),l=t("./stream/GenericWorker"),a=t("./stream/StreamHelper"),f=t("./defaults"),d=t("./compressedObject"),c=t("./zipObject"),o=t("./generate"),p=t("./nodejsUtils"),m=t("./nodejs/NodejsStreamInputAdapter"),_=function(t){"/"===t.slice(-1)&&(t=t.substring(0,t.length-1));var e=t.lastIndexOf("/");return 0<e?t.substring(0,e):""},g=function(t){return"/"!==t.slice(-1)&&(t+="/"),t},b=function(t,e){return e=void 0!==e?e:f.createFolders,t=g(t),this.files[t]||s.call(this,t,null,{dir:!0,createFolders:e}),this.files[t]};function h(t){return"[object RegExp]"===Object.prototype.toString.call(t)}var i={load:function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},forEach:function(t){var e,r,i;for(e in this.files)i=this.files[e],(r=e.slice(this.root.length,e.length))&&e.slice(0,this.root.length)===this.root&&t(r,i)},filter:function(r){var i=[];return this.forEach(function(t,e){r(t,e)&&i.push(e)}),i},file:function(t,e,r){if(1!==arguments.length)return t=this.root+t,s.call(this,t,e,r),this;if(h(t)){var i=t;return this.filter(function(t,e){return!e.dir&&i.test(t)})}var n=this.files[this.root+t];return n&&!n.dir?n:null},folder:function(r){if(!r)return this;if(h(r))return this.filter(function(t,e){return e.dir&&r.test(t)});var t=this.root+r,e=b.call(this,t),i=this.clone();return i.root=e.name,i},remove:function(r){r=this.root+r;var t=this.files[r];if(t||("/"!==r.slice(-1)&&(r+="/"),t=this.files[r]),t&&!t.dir)delete this.files[r];else for(var e=this.filter(function(t,e){return e.name.slice(0,r.length)===r}),i=0;i<e.length;i++)delete this.files[e[i].name];return this},generate:function(t){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},generateInternalStream:function(t){var e,r={};try{if((r=u.extend(t||{},{streamFiles:!1,compression:"STORE",compressionOptions:null,type:"",platform:"DOS",comment:null,mimeType:"application/zip",encodeFileName:n.utf8encode})).type=r.type.toLowerCase(),r.compression=r.compression.toUpperCase(),"binarystring"===r.type&&(r.type="string"),!r.type)throw new Error("No output type specified.");u.checkSupport(r.type),"darwin"!==r.platform&&"freebsd"!==r.platform&&"linux"!==r.platform&&"sunos"!==r.platform||(r.platform="UNIX"),"win32"===r.platform&&(r.platform="DOS");var i=r.comment||this.comment||"";e=o.generateWorker(this,r,i)}catch(t){(e=new l("error")).error(t)}return new a(e,r.type||"string",r.mimeType)},generateAsync:function(t,e){return this.generateInternalStream(t).accumulate(e)},generateNodeStream:function(t,e){return(t=t||{}).type||(t.type="nodebuffer"),this.generateInternalStream(t).toNodejsStream(e)}};e.exports=i},{"./compressedObject":2,"./defaults":5,"./generate":9,"./nodejs/NodejsStreamInputAdapter":12,"./nodejsUtils":14,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31,"./utils":32,"./zipObject":35}],16:[function(t,e,r){e.exports=t("stream")},{stream:void 0}],17:[function(t,e,r){"use strict";var i=t("./DataReader");function n(t){i.call(this,t);for(var e=0;e<this.data.length;e++)t[e]=255&t[e]}t("../utils").inherits(n,i),n.prototype.byteAt=function(t){return this.data[this.zero+t]},n.prototype.lastIndexOfSignature=function(t){for(var e=t.charCodeAt(0),r=t.charCodeAt(1),i=t.charCodeAt(2),n=t.charCodeAt(3),s=this.length-4;0<=s;--s)if(this.data[s]===e&&this.data[s+1]===r&&this.data[s+2]===i&&this.data[s+3]===n)return s-this.zero;return-1},n.prototype.readAndCheckSignature=function(t){var e=t.charCodeAt(0),r=t.charCodeAt(1),i=t.charCodeAt(2),n=t.charCodeAt(3),s=this.readData(4);return e===s[0]&&r===s[1]&&i===s[2]&&n===s[3]},n.prototype.readData=function(t){if(this.checkOffset(t),0===t)return[];var e=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n},{"../utils":32,"./DataReader":18}],18:[function(t,e,r){"use strict";var i=t("../utils");function n(t){this.data=t,this.length=t.length,this.index=0,this.zero=0}n.prototype={checkOffset:function(t){this.checkIndex(this.index+t)},checkIndex:function(t){if(this.length<this.zero+t||t<0)throw new Error("End of data reached (data length = "+this.length+", asked index = "+t+"). Corrupted zip ?")},setIndex:function(t){this.checkIndex(t),this.index=t},skip:function(t){this.setIndex(this.index+t)},byteAt:function(t){},readInt:function(t){var e,r=0;for(this.checkOffset(t),e=this.index+t-1;e>=this.index;e--)r=(r<<8)+this.byteAt(e);return this.index+=t,r},readString:function(t){return i.transformTo("string",this.readData(t))},readData:function(t){},lastIndexOfSignature:function(t){},readAndCheckSignature:function(t){},readDate:function(){var t=this.readInt(4);return new Date(Date.UTC(1980+(t>>25&127),(t>>21&15)-1,t>>16&31,t>>11&31,t>>5&63,(31&t)<<1))}},e.exports=n},{"../utils":32}],19:[function(t,e,r){"use strict";var i=t("./Uint8ArrayReader");function n(t){i.call(this,t)}t("../utils").inherits(n,i),n.prototype.readData=function(t){this.checkOffset(t);var e=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n},{"../utils":32,"./Uint8ArrayReader":21}],20:[function(t,e,r){"use strict";var i=t("./DataReader");function n(t){i.call(this,t)}t("../utils").inherits(n,i),n.prototype.byteAt=function(t){return this.data.charCodeAt(this.zero+t)},n.prototype.lastIndexOfSignature=function(t){return this.data.lastIndexOf(t)-this.zero},n.prototype.readAndCheckSignature=function(t){return t===this.readData(4)},n.prototype.readData=function(t){this.checkOffset(t);var e=this.data.slice(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n},{"../utils":32,"./DataReader":18}],21:[function(t,e,r){"use strict";var i=t("./ArrayReader");function n(t){i.call(this,t)}t("../utils").inherits(n,i),n.prototype.readData=function(t){if(this.checkOffset(t),0===t)return new Uint8Array(0);var e=this.data.subarray(this.zero+this.index,this.zero+this.index+t);return this.index+=t,e},e.exports=n},{"../utils":32,"./ArrayReader":17}],22:[function(t,e,r){"use strict";var i=t("../utils"),n=t("../support"),s=t("./ArrayReader"),a=t("./StringReader"),o=t("./NodeBufferReader"),h=t("./Uint8ArrayReader");e.exports=function(t){var e=i.getTypeOf(t);return i.checkSupport(e),"string"!==e||n.uint8array?"nodebuffer"===e?new o(t):n.uint8array?new h(i.transformTo("uint8array",t)):new s(i.transformTo("array",t)):new a(t)}},{"../support":30,"../utils":32,"./ArrayReader":17,"./NodeBufferReader":19,"./StringReader":20,"./Uint8ArrayReader":21}],23:[function(t,e,r){"use strict";r.LOCAL_FILE_HEADER="PK",r.CENTRAL_FILE_HEADER="PK",r.CENTRAL_DIRECTORY_END="PK",r.ZIP64_CENTRAL_DIRECTORY_LOCATOR="PK",r.ZIP64_CENTRAL_DIRECTORY_END="PK",r.DATA_DESCRIPTOR="PK\b"},{}],24:[function(t,e,r){"use strict";var i=t("./GenericWorker"),n=t("../utils");function s(t){i.call(this,"ConvertWorker to "+t),this.destType=t}n.inherits(s,i),s.prototype.processChunk=function(t){this.push({data:n.transformTo(this.destType,t.data),meta:t.meta})},e.exports=s},{"../utils":32,"./GenericWorker":28}],25:[function(t,e,r){"use strict";var i=t("./GenericWorker"),n=t("../crc32");function s(){i.call(this,"Crc32Probe"),this.withStreamInfo("crc32",0)}t("../utils").inherits(s,i),s.prototype.processChunk=function(t){this.streamInfo.crc32=n(t.data,this.streamInfo.crc32||0),this.push(t)},e.exports=s},{"../crc32":4,"../utils":32,"./GenericWorker":28}],26:[function(t,e,r){"use strict";var i=t("../utils"),n=t("./GenericWorker");function s(t){n.call(this,"DataLengthProbe for "+t),this.propName=t,this.withStreamInfo(t,0)}i.inherits(s,n),s.prototype.processChunk=function(t){if(t){var e=this.streamInfo[this.propName]||0;this.streamInfo[this.propName]=e+t.data.length}n.prototype.processChunk.call(this,t)},e.exports=s},{"../utils":32,"./GenericWorker":28}],27:[function(t,e,r){"use strict";var i=t("../utils"),n=t("./GenericWorker");function s(t){n.call(this,"DataWorker");var e=this;this.dataIsReady=!1,this.index=0,this.max=0,this.data=null,this.type="",this._tickScheduled=!1,t.then(function(t){e.dataIsReady=!0,e.data=t,e.max=t&&t.length||0,e.type=i.getTypeOf(t),e.isPaused||e._tickAndRepeat()},function(t){e.error(t)})}i.inherits(s,n),s.prototype.cleanUp=function(){n.prototype.cleanUp.call(this),this.data=null},s.prototype.resume=function(){return!!n.prototype.resume.call(this)&&(!this._tickScheduled&&this.dataIsReady&&(this._tickScheduled=!0,i.delay(this._tickAndRepeat,[],this)),!0)},s.prototype._tickAndRepeat=function(){this._tickScheduled=!1,this.isPaused||this.isFinished||(this._tick(),this.isFinished||(i.delay(this._tickAndRepeat,[],this),this._tickScheduled=!0))},s.prototype._tick=function(){if(this.isPaused||this.isFinished)return!1;var t=null,e=Math.min(this.max,this.index+16384);if(this.index>=this.max)return this.end();switch(this.type){case"string":t=this.data.substring(this.index,e);break;case"uint8array":t=this.data.subarray(this.index,e);break;case"array":case"nodebuffer":t=this.data.slice(this.index,e)}return this.index=e,this.push({data:t,meta:{percent:this.max?this.index/this.max*100:0}})},e.exports=s},{"../utils":32,"./GenericWorker":28}],28:[function(t,e,r){"use strict";function i(t){this.name=t||"default",this.streamInfo={},this.generatedError=null,this.extraStreamInfo={},this.isPaused=!0,this.isFinished=!1,this.isLocked=!1,this._listeners={data:[],end:[],error:[]},this.previous=null}i.prototype={push:function(t){this.emit("data",t)},end:function(){if(this.isFinished)return!1;this.flush();try{this.emit("end"),this.cleanUp(),this.isFinished=!0}catch(t){this.emit("error",t)}return!0},error:function(t){return!this.isFinished&&(this.isPaused?this.generatedError=t:(this.isFinished=!0,this.emit("error",t),this.previous&&this.previous.error(t),this.cleanUp()),!0)},on:function(t,e){return this._listeners[t].push(e),this},cleanUp:function(){this.streamInfo=this.generatedError=this.extraStreamInfo=null,this._listeners=[]},emit:function(t,e){if(this._listeners[t])for(var r=0;r<this._listeners[t].length;r++)this._listeners[t][r].call(this,e)},pipe:function(t){return t.registerPrevious(this)},registerPrevious:function(t){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.streamInfo=t.streamInfo,this.mergeStreamInfo(),this.previous=t;var e=this;return t.on("data",function(t){e.processChunk(t)}),t.on("end",function(){e.end()}),t.on("error",function(t){e.error(t)}),this},pause:function(){return!this.isPaused&&!this.isFinished&&(this.isPaused=!0,this.previous&&this.previous.pause(),!0)},resume:function(){if(!this.isPaused||this.isFinished)return!1;var t=this.isPaused=!1;return this.generatedError&&(this.error(this.generatedError),t=!0),this.previous&&this.previous.resume(),!t},flush:function(){},processChunk:function(t){this.push(t)},withStreamInfo:function(t,e){return this.extraStreamInfo[t]=e,this.mergeStreamInfo(),this},mergeStreamInfo:function(){for(var t in this.extraStreamInfo)this.extraStreamInfo.hasOwnProperty(t)&&(this.streamInfo[t]=this.extraStreamInfo[t])},lock:function(){if(this.isLocked)throw new Error("The stream '"+this+"' has already been used.");this.isLocked=!0,this.previous&&this.previous.lock()},toString:function(){var t="Worker "+this.name;return this.previous?this.previous+" -> "+t:t}},e.exports=i},{}],29:[function(t,e,r){"use strict";var h=t("../utils"),n=t("./ConvertWorker"),s=t("./GenericWorker"),u=t("../base64"),i=t("../support"),a=t("../external"),o=null;if(i.nodestream)try{o=t("../nodejs/NodejsStreamOutputAdapter")}catch(t){}function l(t,o){return new a.Promise(function(e,r){var i=[],n=t._internalType,s=t._outputType,a=t._mimeType;t.on("data",function(t,e){i.push(t),o&&o(e)}).on("error",function(t){i=[],r(t)}).on("end",function(){try{var t=function(t,e,r){switch(t){case"blob":return h.newBlob(h.transformTo("arraybuffer",e),r);case"base64":return u.encode(e);default:return h.transformTo(t,e)}}(s,function(t,e){var r,i=0,n=null,s=0;for(r=0;r<e.length;r++)s+=e[r].length;switch(t){case"string":return e.join("");case"array":return Array.prototype.concat.apply([],e);case"uint8array":for(n=new Uint8Array(s),r=0;r<e.length;r++)n.set(e[r],i),i+=e[r].length;return n;case"nodebuffer":return Buffer.concat(e);default:throw new Error("concat : unsupported type '"+t+"'")}}(n,i),a);e(t)}catch(t){r(t)}i=[]}).resume()})}function f(t,e,r){var i=e;switch(e){case"blob":case"arraybuffer":i="uint8array";break;case"base64":i="string"}try{this._internalType=i,this._outputType=e,this._mimeType=r,h.checkSupport(i),this._worker=t.pipe(new n(i)),t.lock()}catch(t){this._worker=new s("error"),this._worker.error(t)}}f.prototype={accumulate:function(t){return l(this,t)},on:function(t,e){var r=this;return"data"===t?this._worker.on(t,function(t){e.call(r,t.data,t.meta)}):this._worker.on(t,function(){h.delay(e,arguments,r)}),this},resume:function(){return h.delay(this._worker.resume,[],this._worker),this},pause:function(){return this._worker.pause(),this},toNodejsStream:function(t){if(h.checkSupport("nodestream"),"nodebuffer"!==this._outputType)throw new Error(this._outputType+" is not supported by this method");return new o(this,{objectMode:"nodebuffer"!==this._outputType},t)}},e.exports=f},{"../base64":1,"../external":6,"../nodejs/NodejsStreamOutputAdapter":13,"../support":30,"../utils":32,"./ConvertWorker":24,"./GenericWorker":28}],30:[function(t,e,r){"use strict";if(r.base64=!0,r.array=!0,r.string=!0,r.arraybuffer="undefined"!=typeof ArrayBuffer&&"undefined"!=typeof Uint8Array,r.nodebuffer="undefined"!=typeof Buffer,r.uint8array="undefined"!=typeof Uint8Array,"undefined"==typeof ArrayBuffer)r.blob=!1;else{var i=new ArrayBuffer(0);try{r.blob=0===new Blob([i],{type:"application/zip"}).size}catch(t){try{var n=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);n.append(i),r.blob=0===n.getBlob("application/zip").size}catch(t){r.blob=!1}}}try{r.nodestream=!!t("readable-stream").Readable}catch(t){r.nodestream=!1}},{"readable-stream":16}],31:[function(t,e,s){"use strict";for(var o=t("./utils"),h=t("./support"),r=t("./nodejsUtils"),i=t("./stream/GenericWorker"),u=new Array(256),n=0;n<256;n++)u[n]=252<=n?6:248<=n?5:240<=n?4:224<=n?3:192<=n?2:1;u[254]=u[254]=1;function a(){i.call(this,"utf-8 decode"),this.leftOver=null}function l(){i.call(this,"utf-8 encode")}s.utf8encode=function(t){return h.nodebuffer?r.newBufferFrom(t,"utf-8"):function(t){var e,r,i,n,s,a=t.length,o=0;for(n=0;n<a;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),o+=r<128?1:r<2048?2:r<65536?3:4;for(e=h.uint8array?new Uint8Array(o):new Array(o),n=s=0;s<o;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),r<128?e[s++]=r:(r<2048?e[s++]=192|r>>>6:(r<65536?e[s++]=224|r>>>12:(e[s++]=240|r>>>18,e[s++]=128|r>>>12&63),e[s++]=128|r>>>6&63),e[s++]=128|63&r);return e}(t)},s.utf8decode=function(t){return h.nodebuffer?o.transformTo("nodebuffer",t).toString("utf-8"):function(t){var e,r,i,n,s=t.length,a=new Array(2*s);for(e=r=0;e<s;)if((i=t[e++])<128)a[r++]=i;else if(4<(n=u[i]))a[r++]=65533,e+=n-1;else{for(i&=2===n?31:3===n?15:7;1<n&&e<s;)i=i<<6|63&t[e++],n--;1<n?a[r++]=65533:i<65536?a[r++]=i:(i-=65536,a[r++]=55296|i>>10&1023,a[r++]=56320|1023&i)}return a.length!==r&&(a.subarray?a=a.subarray(0,r):a.length=r),o.applyFromCharCode(a)}(t=o.transformTo(h.uint8array?"uint8array":"array",t))},o.inherits(a,i),a.prototype.processChunk=function(t){var e=o.transformTo(h.uint8array?"uint8array":"array",t.data);if(this.leftOver&&this.leftOver.length){if(h.uint8array){var r=e;(e=new Uint8Array(r.length+this.leftOver.length)).set(this.leftOver,0),e.set(r,this.leftOver.length)}else e=this.leftOver.concat(e);this.leftOver=null}var i=function(t,e){var r;for((e=e||t.length)>t.length&&(e=t.length),r=e-1;0<=r&&128==(192&t[r]);)r--;return r<0?e:0===r?e:r+u[t[r]]>e?r:e}(e),n=e;i!==e.length&&(h.uint8array?(n=e.subarray(0,i),this.leftOver=e.subarray(i,e.length)):(n=e.slice(0,i),this.leftOver=e.slice(i,e.length))),this.push({data:s.utf8decode(n),meta:t.meta})},a.prototype.flush=function(){this.leftOver&&this.leftOver.length&&(this.push({data:s.utf8decode(this.leftOver),meta:{}}),this.leftOver=null)},s.Utf8DecodeWorker=a,o.inherits(l,i),l.prototype.processChunk=function(t){this.push({data:s.utf8encode(t.data),meta:t.meta})},s.Utf8EncodeWorker=l},{"./nodejsUtils":14,"./stream/GenericWorker":28,"./support":30,"./utils":32}],32:[function(t,e,a){"use strict";var o=t("./support"),h=t("./base64"),r=t("./nodejsUtils"),i=t("set-immediate-shim"),u=t("./external");function n(t){return t}function l(t,e){for(var r=0;r<t.length;++r)e[r]=255&t.charCodeAt(r);return e}a.newBlob=function(e,r){a.checkSupport("blob");try{return new Blob([e],{type:r})}catch(t){try{var i=new(self.BlobBuilder||self.WebKitBlobBuilder||self.MozBlobBuilder||self.MSBlobBuilder);return i.append(e),i.getBlob(r)}catch(t){throw new Error("Bug : can't construct the Blob.")}}};var s={stringifyByChunk:function(t,e,r){var i=[],n=0,s=t.length;if(s<=r)return String.fromCharCode.apply(null,t);for(;n<s;)"array"===e||"nodebuffer"===e?i.push(String.fromCharCode.apply(null,t.slice(n,Math.min(n+r,s)))):i.push(String.fromCharCode.apply(null,t.subarray(n,Math.min(n+r,s)))),n+=r;return i.join("")},stringifyByChar:function(t){for(var e="",r=0;r<t.length;r++)e+=String.fromCharCode(t[r]);return e},applyCanBeUsed:{uint8array:function(){try{return o.uint8array&&1===String.fromCharCode.apply(null,new Uint8Array(1)).length}catch(t){return!1}}(),nodebuffer:function(){try{return o.nodebuffer&&1===String.fromCharCode.apply(null,r.allocBuffer(1)).length}catch(t){return!1}}()}};function f(t){var e=65536,r=a.getTypeOf(t),i=!0;if("uint8array"===r?i=s.applyCanBeUsed.uint8array:"nodebuffer"===r&&(i=s.applyCanBeUsed.nodebuffer),i)for(;1<e;)try{return s.stringifyByChunk(t,r,e)}catch(t){e=Math.floor(e/2)}return s.stringifyByChar(t)}function d(t,e){for(var r=0;r<t.length;r++)e[r]=t[r];return e}a.applyFromCharCode=f;var c={};c.string={string:n,array:function(t){return l(t,new Array(t.length))},arraybuffer:function(t){return c.string.uint8array(t).buffer},uint8array:function(t){return l(t,new Uint8Array(t.length))},nodebuffer:function(t){return l(t,r.allocBuffer(t.length))}},c.array={string:f,array:n,arraybuffer:function(t){return new Uint8Array(t).buffer},uint8array:function(t){return new Uint8Array(t)},nodebuffer:function(t){return r.newBufferFrom(t)}},c.arraybuffer={string:function(t){return f(new Uint8Array(t))},array:function(t){return d(new Uint8Array(t),new Array(t.byteLength))},arraybuffer:n,uint8array:function(t){return new Uint8Array(t)},nodebuffer:function(t){return r.newBufferFrom(new Uint8Array(t))}},c.uint8array={string:f,array:function(t){return d(t,new Array(t.length))},arraybuffer:function(t){return t.buffer},uint8array:n,nodebuffer:function(t){return r.newBufferFrom(t)}},c.nodebuffer={string:f,array:function(t){return d(t,new Array(t.length))},arraybuffer:function(t){return c.nodebuffer.uint8array(t).buffer},uint8array:function(t){return d(t,new Uint8Array(t.length))},nodebuffer:n},a.transformTo=function(t,e){if(e=e||"",!t)return e;a.checkSupport(t);var r=a.getTypeOf(e);return c[r][t](e)},a.getTypeOf=function(t){return"string"==typeof t?"string":"[object Array]"===Object.prototype.toString.call(t)?"array":o.nodebuffer&&r.isBuffer(t)?"nodebuffer":o.uint8array&&t instanceof Uint8Array?"uint8array":o.arraybuffer&&t instanceof ArrayBuffer?"arraybuffer":void 0},a.checkSupport=function(t){if(!o[t.toLowerCase()])throw new Error(t+" is not supported by this platform")},a.MAX_VALUE_16BITS=65535,a.MAX_VALUE_32BITS=-1,a.pretty=function(t){var e,r,i="";for(r=0;r<(t||"").length;r++)i+="\\x"+((e=t.charCodeAt(r))<16?"0":"")+e.toString(16).toUpperCase();return i},a.delay=function(t,e,r){i(function(){t.apply(r||null,e||[])})},a.inherits=function(t,e){function r(){}r.prototype=e.prototype,t.prototype=new r},a.extend=function(){var t,e,r={};for(t=0;t<arguments.length;t++)for(e in arguments[t])arguments[t].hasOwnProperty(e)&&void 0===r[e]&&(r[e]=arguments[t][e]);return r},a.prepareContent=function(r,t,i,n,s){return u.Promise.resolve(t).then(function(i){return o.blob&&(i instanceof Blob||-1!==["[object File]","[object Blob]"].indexOf(Object.prototype.toString.call(i)))&&"undefined"!=typeof FileReader?new u.Promise(function(e,r){var t=new FileReader;t.onload=function(t){e(t.target.result)},t.onerror=function(t){r(t.target.error)},t.readAsArrayBuffer(i)}):i}).then(function(t){var e=a.getTypeOf(t);return e?("arraybuffer"===e?t=a.transformTo("uint8array",t):"string"===e&&(s?t=h.decode(t):i&&!0!==n&&(t=function(t){return l(t,o.uint8array?new Uint8Array(t.length):new Array(t.length))}(t))),t):u.Promise.reject(new Error("Can't read the data of '"+r+"'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"))})}},{"./base64":1,"./external":6,"./nodejsUtils":14,"./support":30,"set-immediate-shim":54}],33:[function(t,e,r){"use strict";var i=t("./reader/readerFor"),n=t("./utils"),s=t("./signature"),a=t("./zipEntry"),o=(t("./utf8"),t("./support"));function h(t){this.files=[],this.loadOptions=t}h.prototype={checkSignature:function(t){if(!this.reader.readAndCheckSignature(t)){this.reader.index-=4;var e=this.reader.readString(4);throw new Error("Corrupted zip or bug: unexpected signature ("+n.pretty(e)+", expected "+n.pretty(t)+")")}},isSignature:function(t,e){var r=this.reader.index;this.reader.setIndex(t);var i=this.reader.readString(4)===e;return this.reader.setIndex(r),i},readBlockEndOfCentral:function(){this.diskNumber=this.reader.readInt(2),this.diskWithCentralDirStart=this.reader.readInt(2),this.centralDirRecordsOnThisDisk=this.reader.readInt(2),this.centralDirRecords=this.reader.readInt(2),this.centralDirSize=this.reader.readInt(4),this.centralDirOffset=this.reader.readInt(4),this.zipCommentLength=this.reader.readInt(2);var t=this.reader.readData(this.zipCommentLength),e=o.uint8array?"uint8array":"array",r=n.transformTo(e,t);this.zipComment=this.loadOptions.decodeFileName(r)},readBlockZip64EndOfCentral:function(){this.zip64EndOfCentralSize=this.reader.readInt(8),this.reader.skip(4),this.diskNumber=this.reader.readInt(4),this.diskWithCentralDirStart=this.reader.readInt(4),this.centralDirRecordsOnThisDisk=this.reader.readInt(8),this.centralDirRecords=this.reader.readInt(8),this.centralDirSize=this.reader.readInt(8),this.centralDirOffset=this.reader.readInt(8),this.zip64ExtensibleData={};for(var t,e,r,i=this.zip64EndOfCentralSize-44;0<i;)t=this.reader.readInt(2),e=this.reader.readInt(4),r=this.reader.readData(e),this.zip64ExtensibleData[t]={id:t,length:e,value:r}},readBlockZip64EndOfCentralLocator:function(){if(this.diskWithZip64CentralDirStart=this.reader.readInt(4),this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8),this.disksCount=this.reader.readInt(4),1<this.disksCount)throw new Error("Multi-volumes zip are not supported")},readLocalFiles:function(){var t,e;for(t=0;t<this.files.length;t++)e=this.files[t],this.reader.setIndex(e.localHeaderOffset),this.checkSignature(s.LOCAL_FILE_HEADER),e.readLocalPart(this.reader),e.handleUTF8(),e.processAttributes()},readCentralDir:function(){var t;for(this.reader.setIndex(this.centralDirOffset);this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER);)(t=new a({zip64:this.zip64},this.loadOptions)).readCentralPart(this.reader),this.files.push(t);if(this.centralDirRecords!==this.files.length&&0!==this.centralDirRecords&&0===this.files.length)throw new Error("Corrupted zip or bug: expected "+this.centralDirRecords+" records in central dir, got "+this.files.length)},readEndOfCentral:function(){var t=this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);if(t<0)throw!this.isSignature(0,s.LOCAL_FILE_HEADER)?new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html"):new Error("Corrupted zip: can't find end of central directory");this.reader.setIndex(t);var e=t;if(this.checkSignature(s.CENTRAL_DIRECTORY_END),this.readBlockEndOfCentral(),this.diskNumber===n.MAX_VALUE_16BITS||this.diskWithCentralDirStart===n.MAX_VALUE_16BITS||this.centralDirRecordsOnThisDisk===n.MAX_VALUE_16BITS||this.centralDirRecords===n.MAX_VALUE_16BITS||this.centralDirSize===n.MAX_VALUE_32BITS||this.centralDirOffset===n.MAX_VALUE_32BITS){if(this.zip64=!0,(t=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR))<0)throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");if(this.reader.setIndex(t),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR),this.readBlockZip64EndOfCentralLocator(),!this.isSignature(this.relativeOffsetEndOfZip64CentralDir,s.ZIP64_CENTRAL_DIRECTORY_END)&&(this.relativeOffsetEndOfZip64CentralDir=this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.relativeOffsetEndOfZip64CentralDir<0))throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir),this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END),this.readBlockZip64EndOfCentral()}var r=this.centralDirOffset+this.centralDirSize;this.zip64&&(r+=20,r+=12+this.zip64EndOfCentralSize);var i=e-r;if(0<i)this.isSignature(e,s.CENTRAL_FILE_HEADER)||(this.reader.zero=i);else if(i<0)throw new Error("Corrupted zip: missing "+Math.abs(i)+" bytes.")},prepareReader:function(t){this.reader=i(t)},load:function(t){this.prepareReader(t),this.readEndOfCentral(),this.readCentralDir(),this.readLocalFiles()}},e.exports=h},{"./reader/readerFor":22,"./signature":23,"./support":30,"./utf8":31,"./utils":32,"./zipEntry":34}],34:[function(t,e,r){"use strict";var i=t("./reader/readerFor"),s=t("./utils"),n=t("./compressedObject"),a=t("./crc32"),o=t("./utf8"),h=t("./compressions"),u=t("./support");function l(t,e){this.options=t,this.loadOptions=e}l.prototype={isEncrypted:function(){return 1==(1&this.bitFlag)},useUTF8:function(){return 2048==(2048&this.bitFlag)},readLocalPart:function(t){var e,r;if(t.skip(22),this.fileNameLength=t.readInt(2),r=t.readInt(2),this.fileName=t.readData(this.fileNameLength),t.skip(r),-1===this.compressedSize||-1===this.uncompressedSize)throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");if(null===(e=function(t){for(var e in h)if(h.hasOwnProperty(e)&&h[e].magic===t)return h[e];return null}(this.compressionMethod)))throw new Error("Corrupted zip : compression "+s.pretty(this.compressionMethod)+" unknown (inner file : "+s.transformTo("string",this.fileName)+")");this.decompressed=new n(this.compressedSize,this.uncompressedSize,this.crc32,e,t.readData(this.compressedSize))},readCentralPart:function(t){this.versionMadeBy=t.readInt(2),t.skip(2),this.bitFlag=t.readInt(2),this.compressionMethod=t.readString(2),this.date=t.readDate(),this.crc32=t.readInt(4),this.compressedSize=t.readInt(4),this.uncompressedSize=t.readInt(4);var e=t.readInt(2);if(this.extraFieldsLength=t.readInt(2),this.fileCommentLength=t.readInt(2),this.diskNumberStart=t.readInt(2),this.internalFileAttributes=t.readInt(2),this.externalFileAttributes=t.readInt(4),this.localHeaderOffset=t.readInt(4),this.isEncrypted())throw new Error("Encrypted zip are not supported");t.skip(e),this.readExtraFields(t),this.parseZIP64ExtraField(t),this.fileComment=t.readData(this.fileCommentLength)},processAttributes:function(){this.unixPermissions=null,this.dosPermissions=null;var t=this.versionMadeBy>>8;this.dir=!!(16&this.externalFileAttributes),0==t&&(this.dosPermissions=63&this.externalFileAttributes),3==t&&(this.unixPermissions=this.externalFileAttributes>>16&65535),this.dir||"/"!==this.fileNameStr.slice(-1)||(this.dir=!0)},parseZIP64ExtraField:function(t){if(this.extraFields[1]){var e=i(this.extraFields[1].value);this.uncompressedSize===s.MAX_VALUE_32BITS&&(this.uncompressedSize=e.readInt(8)),this.compressedSize===s.MAX_VALUE_32BITS&&(this.compressedSize=e.readInt(8)),this.localHeaderOffset===s.MAX_VALUE_32BITS&&(this.localHeaderOffset=e.readInt(8)),this.diskNumberStart===s.MAX_VALUE_32BITS&&(this.diskNumberStart=e.readInt(4))}},readExtraFields:function(t){var e,r,i,n=t.index+this.extraFieldsLength;for(this.extraFields||(this.extraFields={});t.index+4<n;)e=t.readInt(2),r=t.readInt(2),i=t.readData(r),this.extraFields[e]={id:e,length:r,value:i};t.setIndex(n)},handleUTF8:function(){var t=u.uint8array?"uint8array":"array";if(this.useUTF8())this.fileNameStr=o.utf8decode(this.fileName),this.fileCommentStr=o.utf8decode(this.fileComment);else{var e=this.findExtraFieldUnicodePath();if(null!==e)this.fileNameStr=e;else{var r=s.transformTo(t,this.fileName);this.fileNameStr=this.loadOptions.decodeFileName(r)}var i=this.findExtraFieldUnicodeComment();if(null!==i)this.fileCommentStr=i;else{var n=s.transformTo(t,this.fileComment);this.fileCommentStr=this.loadOptions.decodeFileName(n)}}},findExtraFieldUnicodePath:function(){var t=this.extraFields[28789];if(t){var e=i(t.value);return 1!==e.readInt(1)?null:a(this.fileName)!==e.readInt(4)?null:o.utf8decode(e.readData(t.length-5))}return null},findExtraFieldUnicodeComment:function(){var t=this.extraFields[25461];if(t){var e=i(t.value);return 1!==e.readInt(1)?null:a(this.fileComment)!==e.readInt(4)?null:o.utf8decode(e.readData(t.length-5))}return null}},e.exports=l},{"./compressedObject":2,"./compressions":3,"./crc32":4,"./reader/readerFor":22,"./support":30,"./utf8":31,"./utils":32}],35:[function(t,e,r){"use strict";function i(t,e,r){this.name=t,this.dir=r.dir,this.date=r.date,this.comment=r.comment,this.unixPermissions=r.unixPermissions,this.dosPermissions=r.dosPermissions,this._data=e,this._dataBinary=r.binary,this.options={compression:r.compression,compressionOptions:r.compressionOptions}}var s=t("./stream/StreamHelper"),n=t("./stream/DataWorker"),a=t("./utf8"),o=t("./compressedObject"),h=t("./stream/GenericWorker");i.prototype={internalStream:function(t){var e=null,r="string";try{if(!t)throw new Error("No output type specified.");var i="string"===(r=t.toLowerCase())||"text"===r;"binarystring"!==r&&"text"!==r||(r="string"),e=this._decompressWorker();var n=!this._dataBinary;n&&!i&&(e=e.pipe(new a.Utf8EncodeWorker)),!n&&i&&(e=e.pipe(new a.Utf8DecodeWorker))}catch(t){(e=new h("error")).error(t)}return new s(e,r,"")},async:function(t,e){return this.internalStream(t).accumulate(e)},nodeStream:function(t,e){return this.internalStream(t||"nodebuffer").toNodejsStream(e)},_compressWorker:function(t,e){if(this._data instanceof o&&this._data.compression.magic===t.magic)return this._data.getCompressedWorker();var r=this._decompressWorker();return this._dataBinary||(r=r.pipe(new a.Utf8EncodeWorker)),o.createWorkerFrom(r,t,e)},_decompressWorker:function(){return this._data instanceof o?this._data.getContentWorker():this._data instanceof h?this._data:new n(this._data)}};for(var u=["asText","asBinary","asNodeBuffer","asUint8Array","asArrayBuffer"],l=function(){throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.")},f=0;f<u.length;f++)i.prototype[u[f]]=l;e.exports=i},{"./compressedObject":2,"./stream/DataWorker":27,"./stream/GenericWorker":28,"./stream/StreamHelper":29,"./utf8":31}],36:[function(t,l,e){(function(e){"use strict";var r,i,t=e.MutationObserver||e.WebKitMutationObserver;if(t){var n=0,s=new t(u),a=e.document.createTextNode("");s.observe(a,{characterData:!0}),r=function(){a.data=n=++n%2}}else if(e.setImmediate||void 0===e.MessageChannel)r="document"in e&&"onreadystatechange"in e.document.createElement("script")?function(){var t=e.document.createElement("script");t.onreadystatechange=function(){u(),t.onreadystatechange=null,t.parentNode.removeChild(t),t=null},e.document.documentElement.appendChild(t)}:function(){setTimeout(u,0)};else{var o=new e.MessageChannel;o.port1.onmessage=u,r=function(){o.port2.postMessage(0)}}var h=[];function u(){var t,e;i=!0;for(var r=h.length;r;){for(e=h,h=[],t=-1;++t<r;)e[t]();r=h.length}i=!1}l.exports=function(t){1!==h.push(t)||i||r()}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],37:[function(t,e,r){"use strict";var n=t("immediate");function u(){}var l={},s=["REJECTED"],a=["FULFILLED"],i=["PENDING"];function o(t){if("function"!=typeof t)throw new TypeError("resolver must be a function");this.state=i,this.queue=[],this.outcome=void 0,t!==u&&c(this,t)}function h(t,e,r){this.promise=t,"function"==typeof e&&(this.onFulfilled=e,this.callFulfilled=this.otherCallFulfilled),"function"==typeof r&&(this.onRejected=r,this.callRejected=this.otherCallRejected)}function f(e,r,i){n(function(){var t;try{t=r(i)}catch(t){return l.reject(e,t)}t===e?l.reject(e,new TypeError("Cannot resolve promise with itself")):l.resolve(e,t)})}function d(t){var e=t&&t.then;if(t&&("object"==typeof t||"function"==typeof t)&&"function"==typeof e)return function(){e.apply(t,arguments)}}function c(e,t){var r=!1;function i(t){r||(r=!0,l.reject(e,t))}function n(t){r||(r=!0,l.resolve(e,t))}var s=p(function(){t(n,i)});"error"===s.status&&i(s.value)}function p(t,e){var r={};try{r.value=t(e),r.status="success"}catch(t){r.status="error",r.value=t}return r}(e.exports=o).prototype.finally=function(e){if("function"!=typeof e)return this;var r=this.constructor;return this.then(function(t){return r.resolve(e()).then(function(){return t})},function(t){return r.resolve(e()).then(function(){throw t})})},o.prototype.catch=function(t){return this.then(null,t)},o.prototype.then=function(t,e){if("function"!=typeof t&&this.state===a||"function"!=typeof e&&this.state===s)return this;var r=new this.constructor(u);this.state!==i?f(r,this.state===a?t:e,this.outcome):this.queue.push(new h(r,t,e));return r},h.prototype.callFulfilled=function(t){l.resolve(this.promise,t)},h.prototype.otherCallFulfilled=function(t){f(this.promise,this.onFulfilled,t)},h.prototype.callRejected=function(t){l.reject(this.promise,t)},h.prototype.otherCallRejected=function(t){f(this.promise,this.onRejected,t)},l.resolve=function(t,e){var r=p(d,e);if("error"===r.status)return l.reject(t,r.value);var i=r.value;if(i)c(t,i);else{t.state=a,t.outcome=e;for(var n=-1,s=t.queue.length;++n<s;)t.queue[n].callFulfilled(e)}return t},l.reject=function(t,e){t.state=s,t.outcome=e;for(var r=-1,i=t.queue.length;++r<i;)t.queue[r].callRejected(e);return t},o.resolve=function(t){if(t instanceof this)return t;return l.resolve(new this(u),t)},o.reject=function(t){var e=new this(u);return l.reject(e,t)},o.all=function(t){var r=this;if("[object Array]"!==Object.prototype.toString.call(t))return this.reject(new TypeError("must be an array"));var i=t.length,n=!1;if(!i)return this.resolve([]);var s=new Array(i),a=0,e=-1,o=new this(u);for(;++e<i;)h(t[e],e);return o;function h(t,e){r.resolve(t).then(function(t){s[e]=t,++a!==i||n||(n=!0,l.resolve(o,s))},function(t){n||(n=!0,l.reject(o,t))})}},o.race=function(t){var e=this;if("[object Array]"!==Object.prototype.toString.call(t))return this.reject(new TypeError("must be an array"));var r=t.length,i=!1;if(!r)return this.resolve([]);var n=-1,s=new this(u);for(;++n<r;)a=t[n],e.resolve(a).then(function(t){i||(i=!0,l.resolve(s,t))},function(t){i||(i=!0,l.reject(s,t))});var a;return s}},{immediate:36}],38:[function(t,e,r){"use strict";var i={};(0,t("./lib/utils/common").assign)(i,t("./lib/deflate"),t("./lib/inflate"),t("./lib/zlib/constants")),e.exports=i},{"./lib/deflate":39,"./lib/inflate":40,"./lib/utils/common":41,"./lib/zlib/constants":44}],39:[function(t,e,r){"use strict";var a=t("./zlib/deflate"),o=t("./utils/common"),h=t("./utils/strings"),n=t("./zlib/messages"),s=t("./zlib/zstream"),u=Object.prototype.toString,l=0,f=-1,d=0,c=8;function p(t){if(!(this instanceof p))return new p(t);this.options=o.assign({level:f,method:c,chunkSize:16384,windowBits:15,memLevel:8,strategy:d,to:""},t||{});var e=this.options;e.raw&&0<e.windowBits?e.windowBits=-e.windowBits:e.gzip&&0<e.windowBits&&e.windowBits<16&&(e.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new s,this.strm.avail_out=0;var r=a.deflateInit2(this.strm,e.level,e.method,e.windowBits,e.memLevel,e.strategy);if(r!==l)throw new Error(n[r]);if(e.header&&a.deflateSetHeader(this.strm,e.header),e.dictionary){var i;if(i="string"==typeof e.dictionary?h.string2buf(e.dictionary):"[object ArrayBuffer]"===u.call(e.dictionary)?new Uint8Array(e.dictionary):e.dictionary,(r=a.deflateSetDictionary(this.strm,i))!==l)throw new Error(n[r]);this._dict_set=!0}}function i(t,e){var r=new p(e);if(r.push(t,!0),r.err)throw r.msg||n[r.err];return r.result}p.prototype.push=function(t,e){var r,i,n=this.strm,s=this.options.chunkSize;if(this.ended)return!1;i=e===~~e?e:!0===e?4:0,"string"==typeof t?n.input=h.string2buf(t):"[object ArrayBuffer]"===u.call(t)?n.input=new Uint8Array(t):n.input=t,n.next_in=0,n.avail_in=n.input.length;do{if(0===n.avail_out&&(n.output=new o.Buf8(s),n.next_out=0,n.avail_out=s),1!==(r=a.deflate(n,i))&&r!==l)return this.onEnd(r),!(this.ended=!0);0!==n.avail_out&&(0!==n.avail_in||4!==i&&2!==i)||("string"===this.options.to?this.onData(h.buf2binstring(o.shrinkBuf(n.output,n.next_out))):this.onData(o.shrinkBuf(n.output,n.next_out)))}while((0<n.avail_in||0===n.avail_out)&&1!==r);return 4===i?(r=a.deflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===l):2!==i||(this.onEnd(l),!(n.avail_out=0))},p.prototype.onData=function(t){this.chunks.push(t)},p.prototype.onEnd=function(t){t===l&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=o.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg},r.Deflate=p,r.deflate=i,r.deflateRaw=function(t,e){return(e=e||{}).raw=!0,i(t,e)},r.gzip=function(t,e){return(e=e||{}).gzip=!0,i(t,e)}},{"./utils/common":41,"./utils/strings":42,"./zlib/deflate":46,"./zlib/messages":51,"./zlib/zstream":53}],40:[function(t,e,r){"use strict";var d=t("./zlib/inflate"),c=t("./utils/common"),p=t("./utils/strings"),m=t("./zlib/constants"),i=t("./zlib/messages"),n=t("./zlib/zstream"),s=t("./zlib/gzheader"),_=Object.prototype.toString;function a(t){if(!(this instanceof a))return new a(t);this.options=c.assign({chunkSize:16384,windowBits:0,to:""},t||{});var e=this.options;e.raw&&0<=e.windowBits&&e.windowBits<16&&(e.windowBits=-e.windowBits,0===e.windowBits&&(e.windowBits=-15)),!(0<=e.windowBits&&e.windowBits<16)||t&&t.windowBits||(e.windowBits+=32),15<e.windowBits&&e.windowBits<48&&0==(15&e.windowBits)&&(e.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new n,this.strm.avail_out=0;var r=d.inflateInit2(this.strm,e.windowBits);if(r!==m.Z_OK)throw new Error(i[r]);this.header=new s,d.inflateGetHeader(this.strm,this.header)}function o(t,e){var r=new a(e);if(r.push(t,!0),r.err)throw r.msg||i[r.err];return r.result}a.prototype.push=function(t,e){var r,i,n,s,a,o,h=this.strm,u=this.options.chunkSize,l=this.options.dictionary,f=!1;if(this.ended)return!1;i=e===~~e?e:!0===e?m.Z_FINISH:m.Z_NO_FLUSH,"string"==typeof t?h.input=p.binstring2buf(t):"[object ArrayBuffer]"===_.call(t)?h.input=new Uint8Array(t):h.input=t,h.next_in=0,h.avail_in=h.input.length;do{if(0===h.avail_out&&(h.output=new c.Buf8(u),h.next_out=0,h.avail_out=u),(r=d.inflate(h,m.Z_NO_FLUSH))===m.Z_NEED_DICT&&l&&(o="string"==typeof l?p.string2buf(l):"[object ArrayBuffer]"===_.call(l)?new Uint8Array(l):l,r=d.inflateSetDictionary(this.strm,o)),r===m.Z_BUF_ERROR&&!0===f&&(r=m.Z_OK,f=!1),r!==m.Z_STREAM_END&&r!==m.Z_OK)return this.onEnd(r),!(this.ended=!0);h.next_out&&(0!==h.avail_out&&r!==m.Z_STREAM_END&&(0!==h.avail_in||i!==m.Z_FINISH&&i!==m.Z_SYNC_FLUSH)||("string"===this.options.to?(n=p.utf8border(h.output,h.next_out),s=h.next_out-n,a=p.buf2string(h.output,n),h.next_out=s,h.avail_out=u-s,s&&c.arraySet(h.output,h.output,n,s,0),this.onData(a)):this.onData(c.shrinkBuf(h.output,h.next_out)))),0===h.avail_in&&0===h.avail_out&&(f=!0)}while((0<h.avail_in||0===h.avail_out)&&r!==m.Z_STREAM_END);return r===m.Z_STREAM_END&&(i=m.Z_FINISH),i===m.Z_FINISH?(r=d.inflateEnd(this.strm),this.onEnd(r),this.ended=!0,r===m.Z_OK):i!==m.Z_SYNC_FLUSH||(this.onEnd(m.Z_OK),!(h.avail_out=0))},a.prototype.onData=function(t){this.chunks.push(t)},a.prototype.onEnd=function(t){t===m.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=c.flattenChunks(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg},r.Inflate=a,r.inflate=o,r.inflateRaw=function(t,e){return(e=e||{}).raw=!0,o(t,e)},r.ungzip=o},{"./utils/common":41,"./utils/strings":42,"./zlib/constants":44,"./zlib/gzheader":47,"./zlib/inflate":49,"./zlib/messages":51,"./zlib/zstream":53}],41:[function(t,e,r){"use strict";var i="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;r.assign=function(t){for(var e=Array.prototype.slice.call(arguments,1);e.length;){var r=e.shift();if(r){if("object"!=typeof r)throw new TypeError(r+"must be non-object");for(var i in r)r.hasOwnProperty(i)&&(t[i]=r[i])}}return t},r.shrinkBuf=function(t,e){return t.length===e?t:t.subarray?t.subarray(0,e):(t.length=e,t)};var n={arraySet:function(t,e,r,i,n){if(e.subarray&&t.subarray)t.set(e.subarray(r,r+i),n);else for(var s=0;s<i;s++)t[n+s]=e[r+s]},flattenChunks:function(t){var e,r,i,n,s,a;for(e=i=0,r=t.length;e<r;e++)i+=t[e].length;for(a=new Uint8Array(i),e=n=0,r=t.length;e<r;e++)s=t[e],a.set(s,n),n+=s.length;return a}},s={arraySet:function(t,e,r,i,n){for(var s=0;s<i;s++)t[n+s]=e[r+s]},flattenChunks:function(t){return[].concat.apply([],t)}};r.setTyped=function(t){t?(r.Buf8=Uint8Array,r.Buf16=Uint16Array,r.Buf32=Int32Array,r.assign(r,n)):(r.Buf8=Array,r.Buf16=Array,r.Buf32=Array,r.assign(r,s))},r.setTyped(i)},{}],42:[function(t,e,r){"use strict";var h=t("./common"),n=!0,s=!0;try{String.fromCharCode.apply(null,[0])}catch(t){n=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(t){s=!1}for(var u=new h.Buf8(256),i=0;i<256;i++)u[i]=252<=i?6:248<=i?5:240<=i?4:224<=i?3:192<=i?2:1;function l(t,e){if(e<65537&&(t.subarray&&s||!t.subarray&&n))return String.fromCharCode.apply(null,h.shrinkBuf(t,e));for(var r="",i=0;i<e;i++)r+=String.fromCharCode(t[i]);return r}u[254]=u[254]=1,r.string2buf=function(t){var e,r,i,n,s,a=t.length,o=0;for(n=0;n<a;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),o+=r<128?1:r<2048?2:r<65536?3:4;for(e=new h.Buf8(o),n=s=0;s<o;n++)55296==(64512&(r=t.charCodeAt(n)))&&n+1<a&&56320==(64512&(i=t.charCodeAt(n+1)))&&(r=65536+(r-55296<<10)+(i-56320),n++),r<128?e[s++]=r:(r<2048?e[s++]=192|r>>>6:(r<65536?e[s++]=224|r>>>12:(e[s++]=240|r>>>18,e[s++]=128|r>>>12&63),e[s++]=128|r>>>6&63),e[s++]=128|63&r);return e},r.buf2binstring=function(t){return l(t,t.length)},r.binstring2buf=function(t){for(var e=new h.Buf8(t.length),r=0,i=e.length;r<i;r++)e[r]=t.charCodeAt(r);return e},r.buf2string=function(t,e){var r,i,n,s,a=e||t.length,o=new Array(2*a);for(r=i=0;r<a;)if((n=t[r++])<128)o[i++]=n;else if(4<(s=u[n]))o[i++]=65533,r+=s-1;else{for(n&=2===s?31:3===s?15:7;1<s&&r<a;)n=n<<6|63&t[r++],s--;1<s?o[i++]=65533:n<65536?o[i++]=n:(n-=65536,o[i++]=55296|n>>10&1023,o[i++]=56320|1023&n)}return l(o,i)},r.utf8border=function(t,e){var r;for((e=e||t.length)>t.length&&(e=t.length),r=e-1;0<=r&&128==(192&t[r]);)r--;return r<0?e:0===r?e:r+u[t[r]]>e?r:e}},{"./common":41}],43:[function(t,e,r){"use strict";e.exports=function(t,e,r,i){for(var n=65535&t|0,s=t>>>16&65535|0,a=0;0!==r;){for(r-=a=2e3<r?2e3:r;s=s+(n=n+e[i++]|0)|0,--a;);n%=65521,s%=65521}return n|s<<16|0}},{}],44:[function(t,e,r){"use strict";e.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],45:[function(t,e,r){"use strict";var o=function(){for(var t,e=[],r=0;r<256;r++){t=r;for(var i=0;i<8;i++)t=1&t?3988292384^t>>>1:t>>>1;e[r]=t}return e}();e.exports=function(t,e,r,i){var n=o,s=i+r;t^=-1;for(var a=i;a<s;a++)t=t>>>8^n[255&(t^e[a])];return-1^t}},{}],46:[function(t,e,r){"use strict";var h,d=t("../utils/common"),u=t("./trees"),c=t("./adler32"),p=t("./crc32"),i=t("./messages"),l=0,f=4,m=0,_=-2,g=-1,b=4,n=2,v=8,y=9,s=286,a=30,o=19,w=2*s+1,k=15,x=3,S=258,z=S+x+1,C=42,E=113,A=1,I=2,O=3,B=4;function R(t,e){return t.msg=i[e],e}function T(t){return(t<<1)-(4<t?9:0)}function D(t){for(var e=t.length;0<=--e;)t[e]=0}function F(t){var e=t.state,r=e.pending;r>t.avail_out&&(r=t.avail_out),0!==r&&(d.arraySet(t.output,e.pending_buf,e.pending_out,r,t.next_out),t.next_out+=r,e.pending_out+=r,t.total_out+=r,t.avail_out-=r,e.pending-=r,0===e.pending&&(e.pending_out=0))}function N(t,e){u._tr_flush_block(t,0<=t.block_start?t.block_start:-1,t.strstart-t.block_start,e),t.block_start=t.strstart,F(t.strm)}function U(t,e){t.pending_buf[t.pending++]=e}function P(t,e){t.pending_buf[t.pending++]=e>>>8&255,t.pending_buf[t.pending++]=255&e}function L(t,e){var r,i,n=t.max_chain_length,s=t.strstart,a=t.prev_length,o=t.nice_match,h=t.strstart>t.w_size-z?t.strstart-(t.w_size-z):0,u=t.window,l=t.w_mask,f=t.prev,d=t.strstart+S,c=u[s+a-1],p=u[s+a];t.prev_length>=t.good_match&&(n>>=2),o>t.lookahead&&(o=t.lookahead);do{if(u[(r=e)+a]===p&&u[r+a-1]===c&&u[r]===u[s]&&u[++r]===u[s+1]){s+=2,r++;do{}while(u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&u[++s]===u[++r]&&s<d);if(i=S-(d-s),s=d-S,a<i){if(t.match_start=e,o<=(a=i))break;c=u[s+a-1],p=u[s+a]}}}while((e=f[e&l])>h&&0!=--n);return a<=t.lookahead?a:t.lookahead}function j(t){var e,r,i,n,s,a,o,h,u,l,f=t.w_size;do{if(n=t.window_size-t.lookahead-t.strstart,t.strstart>=f+(f-z)){for(d.arraySet(t.window,t.window,f,f,0),t.match_start-=f,t.strstart-=f,t.block_start-=f,e=r=t.hash_size;i=t.head[--e],t.head[e]=f<=i?i-f:0,--r;);for(e=r=f;i=t.prev[--e],t.prev[e]=f<=i?i-f:0,--r;);n+=f}if(0===t.strm.avail_in)break;if(a=t.strm,o=t.window,h=t.strstart+t.lookahead,u=n,l=void 0,l=a.avail_in,u<l&&(l=u),r=0===l?0:(a.avail_in-=l,d.arraySet(o,a.input,a.next_in,l,h),1===a.state.wrap?a.adler=c(a.adler,o,l,h):2===a.state.wrap&&(a.adler=p(a.adler,o,l,h)),a.next_in+=l,a.total_in+=l,l),t.lookahead+=r,t.lookahead+t.insert>=x)for(s=t.strstart-t.insert,t.ins_h=t.window[s],t.ins_h=(t.ins_h<<t.hash_shift^t.window[s+1])&t.hash_mask;t.insert&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[s+x-1])&t.hash_mask,t.prev[s&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=s,s++,t.insert--,!(t.lookahead+t.insert<x)););}while(t.lookahead<z&&0!==t.strm.avail_in)}function Z(t,e){for(var r,i;;){if(t.lookahead<z){if(j(t),t.lookahead<z&&e===l)return A;if(0===t.lookahead)break}if(r=0,t.lookahead>=x&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!==r&&t.strstart-r<=t.w_size-z&&(t.match_length=L(t,r)),t.match_length>=x)if(i=u._tr_tally(t,t.strstart-t.match_start,t.match_length-x),t.lookahead-=t.match_length,t.match_length<=t.max_lazy_match&&t.lookahead>=x){for(t.match_length--;t.strstart++,t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart,0!=--t.match_length;);t.strstart++}else t.strstart+=t.match_length,t.match_length=0,t.ins_h=t.window[t.strstart],t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+1])&t.hash_mask;else i=u._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++;if(i&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=t.strstart<x-1?t.strstart:x-1,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}function W(t,e){for(var r,i,n;;){if(t.lookahead<z){if(j(t),t.lookahead<z&&e===l)return A;if(0===t.lookahead)break}if(r=0,t.lookahead>=x&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),t.prev_length=t.match_length,t.prev_match=t.match_start,t.match_length=x-1,0!==r&&t.prev_length<t.max_lazy_match&&t.strstart-r<=t.w_size-z&&(t.match_length=L(t,r),t.match_length<=5&&(1===t.strategy||t.match_length===x&&4096<t.strstart-t.match_start)&&(t.match_length=x-1)),t.prev_length>=x&&t.match_length<=t.prev_length){for(n=t.strstart+t.lookahead-x,i=u._tr_tally(t,t.strstart-1-t.prev_match,t.prev_length-x),t.lookahead-=t.prev_length-1,t.prev_length-=2;++t.strstart<=n&&(t.ins_h=(t.ins_h<<t.hash_shift^t.window[t.strstart+x-1])&t.hash_mask,r=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!=--t.prev_length;);if(t.match_available=0,t.match_length=x-1,t.strstart++,i&&(N(t,!1),0===t.strm.avail_out))return A}else if(t.match_available){if((i=u._tr_tally(t,0,t.window[t.strstart-1]))&&N(t,!1),t.strstart++,t.lookahead--,0===t.strm.avail_out)return A}else t.match_available=1,t.strstart++,t.lookahead--}return t.match_available&&(i=u._tr_tally(t,0,t.window[t.strstart-1]),t.match_available=0),t.insert=t.strstart<x-1?t.strstart:x-1,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}function M(t,e,r,i,n){this.good_length=t,this.max_lazy=e,this.nice_length=r,this.max_chain=i,this.func=n}function H(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=v,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new d.Buf16(2*w),this.dyn_dtree=new d.Buf16(2*(2*a+1)),this.bl_tree=new d.Buf16(2*(2*o+1)),D(this.dyn_ltree),D(this.dyn_dtree),D(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new d.Buf16(k+1),this.heap=new d.Buf16(2*s+1),D(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new d.Buf16(2*s+1),D(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}function G(t){var e;return t&&t.state?(t.total_in=t.total_out=0,t.data_type=n,(e=t.state).pending=0,e.pending_out=0,e.wrap<0&&(e.wrap=-e.wrap),e.status=e.wrap?C:E,t.adler=2===e.wrap?0:1,e.last_flush=l,u._tr_init(e),m):R(t,_)}function K(t){var e=G(t);return e===m&&function(t){t.window_size=2*t.w_size,D(t.head),t.max_lazy_match=h[t.level].max_lazy,t.good_match=h[t.level].good_length,t.nice_match=h[t.level].nice_length,t.max_chain_length=h[t.level].max_chain,t.strstart=0,t.block_start=0,t.lookahead=0,t.insert=0,t.match_length=t.prev_length=x-1,t.match_available=0,t.ins_h=0}(t.state),e}function Y(t,e,r,i,n,s){if(!t)return _;var a=1;if(e===g&&(e=6),i<0?(a=0,i=-i):15<i&&(a=2,i-=16),n<1||y<n||r!==v||i<8||15<i||e<0||9<e||s<0||b<s)return R(t,_);8===i&&(i=9);var o=new H;return(t.state=o).strm=t,o.wrap=a,o.gzhead=null,o.w_bits=i,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=n+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+x-1)/x),o.window=new d.Buf8(2*o.w_size),o.head=new d.Buf16(o.hash_size),o.prev=new d.Buf16(o.w_size),o.lit_bufsize=1<<n+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new d.Buf8(o.pending_buf_size),o.d_buf=1*o.lit_bufsize,o.l_buf=3*o.lit_bufsize,o.level=e,o.strategy=s,o.method=r,K(t)}h=[new M(0,0,0,0,function(t,e){var r=65535;for(r>t.pending_buf_size-5&&(r=t.pending_buf_size-5);;){if(t.lookahead<=1){if(j(t),0===t.lookahead&&e===l)return A;if(0===t.lookahead)break}t.strstart+=t.lookahead,t.lookahead=0;var i=t.block_start+r;if((0===t.strstart||t.strstart>=i)&&(t.lookahead=t.strstart-i,t.strstart=i,N(t,!1),0===t.strm.avail_out))return A;if(t.strstart-t.block_start>=t.w_size-z&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(N(t,!0),0===t.strm.avail_out?O:B):(t.strstart>t.block_start&&(N(t,!1),t.strm.avail_out),A)}),new M(4,4,8,4,Z),new M(4,5,16,8,Z),new M(4,6,32,32,Z),new M(4,4,16,16,W),new M(8,16,32,32,W),new M(8,16,128,128,W),new M(8,32,128,256,W),new M(32,128,258,1024,W),new M(32,258,258,4096,W)],r.deflateInit=function(t,e){return Y(t,e,v,15,8,0)},r.deflateInit2=Y,r.deflateReset=K,r.deflateResetKeep=G,r.deflateSetHeader=function(t,e){return t&&t.state?2!==t.state.wrap?_:(t.state.gzhead=e,m):_},r.deflate=function(t,e){var r,i,n,s;if(!t||!t.state||5<e||e<0)return t?R(t,_):_;if(i=t.state,!t.output||!t.input&&0!==t.avail_in||666===i.status&&e!==f)return R(t,0===t.avail_out?-5:_);if(i.strm=t,r=i.last_flush,i.last_flush=e,i.status===C)if(2===i.wrap)t.adler=0,U(i,31),U(i,139),U(i,8),i.gzhead?(U(i,(i.gzhead.text?1:0)+(i.gzhead.hcrc?2:0)+(i.gzhead.extra?4:0)+(i.gzhead.name?8:0)+(i.gzhead.comment?16:0)),U(i,255&i.gzhead.time),U(i,i.gzhead.time>>8&255),U(i,i.gzhead.time>>16&255),U(i,i.gzhead.time>>24&255),U(i,9===i.level?2:2<=i.strategy||i.level<2?4:0),U(i,255&i.gzhead.os),i.gzhead.extra&&i.gzhead.extra.length&&(U(i,255&i.gzhead.extra.length),U(i,i.gzhead.extra.length>>8&255)),i.gzhead.hcrc&&(t.adler=p(t.adler,i.pending_buf,i.pending,0)),i.gzindex=0,i.status=69):(U(i,0),U(i,0),U(i,0),U(i,0),U(i,0),U(i,9===i.level?2:2<=i.strategy||i.level<2?4:0),U(i,3),i.status=E);else{var a=v+(i.w_bits-8<<4)<<8;a|=(2<=i.strategy||i.level<2?0:i.level<6?1:6===i.level?2:3)<<6,0!==i.strstart&&(a|=32),a+=31-a%31,i.status=E,P(i,a),0!==i.strstart&&(P(i,t.adler>>>16),P(i,65535&t.adler)),t.adler=1}if(69===i.status)if(i.gzhead.extra){for(n=i.pending;i.gzindex<(65535&i.gzhead.extra.length)&&(i.pending!==i.pending_buf_size||(i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),F(t),n=i.pending,i.pending!==i.pending_buf_size));)U(i,255&i.gzhead.extra[i.gzindex]),i.gzindex++;i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),i.gzindex===i.gzhead.extra.length&&(i.gzindex=0,i.status=73)}else i.status=73;if(73===i.status)if(i.gzhead.name){n=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),F(t),n=i.pending,i.pending===i.pending_buf_size)){s=1;break}s=i.gzindex<i.gzhead.name.length?255&i.gzhead.name.charCodeAt(i.gzindex++):0,U(i,s)}while(0!==s);i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),0===s&&(i.gzindex=0,i.status=91)}else i.status=91;if(91===i.status)if(i.gzhead.comment){n=i.pending;do{if(i.pending===i.pending_buf_size&&(i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),F(t),n=i.pending,i.pending===i.pending_buf_size)){s=1;break}s=i.gzindex<i.gzhead.comment.length?255&i.gzhead.comment.charCodeAt(i.gzindex++):0,U(i,s)}while(0!==s);i.gzhead.hcrc&&i.pending>n&&(t.adler=p(t.adler,i.pending_buf,i.pending-n,n)),0===s&&(i.status=103)}else i.status=103;if(103===i.status&&(i.gzhead.hcrc?(i.pending+2>i.pending_buf_size&&F(t),i.pending+2<=i.pending_buf_size&&(U(i,255&t.adler),U(i,t.adler>>8&255),t.adler=0,i.status=E)):i.status=E),0!==i.pending){if(F(t),0===t.avail_out)return i.last_flush=-1,m}else if(0===t.avail_in&&T(e)<=T(r)&&e!==f)return R(t,-5);if(666===i.status&&0!==t.avail_in)return R(t,-5);if(0!==t.avail_in||0!==i.lookahead||e!==l&&666!==i.status){var o=2===i.strategy?function(t,e){for(var r;;){if(0===t.lookahead&&(j(t),0===t.lookahead)){if(e===l)return A;break}if(t.match_length=0,r=u._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++,r&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}(i,e):3===i.strategy?function(t,e){for(var r,i,n,s,a=t.window;;){if(t.lookahead<=S){if(j(t),t.lookahead<=S&&e===l)return A;if(0===t.lookahead)break}if(t.match_length=0,t.lookahead>=x&&0<t.strstart&&(i=a[n=t.strstart-1])===a[++n]&&i===a[++n]&&i===a[++n]){s=t.strstart+S;do{}while(i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&i===a[++n]&&n<s);t.match_length=S-(s-n),t.match_length>t.lookahead&&(t.match_length=t.lookahead)}if(t.match_length>=x?(r=u._tr_tally(t,1,t.match_length-x),t.lookahead-=t.match_length,t.strstart+=t.match_length,t.match_length=0):(r=u._tr_tally(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++),r&&(N(t,!1),0===t.strm.avail_out))return A}return t.insert=0,e===f?(N(t,!0),0===t.strm.avail_out?O:B):t.last_lit&&(N(t,!1),0===t.strm.avail_out)?A:I}(i,e):h[i.level].func(i,e);if(o!==O&&o!==B||(i.status=666),o===A||o===O)return 0===t.avail_out&&(i.last_flush=-1),m;if(o===I&&(1===e?u._tr_align(i):5!==e&&(u._tr_stored_block(i,0,0,!1),3===e&&(D(i.head),0===i.lookahead&&(i.strstart=0,i.block_start=0,i.insert=0))),F(t),0===t.avail_out))return i.last_flush=-1,m}return e!==f?m:i.wrap<=0?1:(2===i.wrap?(U(i,255&t.adler),U(i,t.adler>>8&255),U(i,t.adler>>16&255),U(i,t.adler>>24&255),U(i,255&t.total_in),U(i,t.total_in>>8&255),U(i,t.total_in>>16&255),U(i,t.total_in>>24&255)):(P(i,t.adler>>>16),P(i,65535&t.adler)),F(t),0<i.wrap&&(i.wrap=-i.wrap),0!==i.pending?m:1)},r.deflateEnd=function(t){var e;return t&&t.state?(e=t.state.status)!==C&&69!==e&&73!==e&&91!==e&&103!==e&&e!==E&&666!==e?R(t,_):(t.state=null,e===E?R(t,-3):m):_},r.deflateSetDictionary=function(t,e){var r,i,n,s,a,o,h,u,l=e.length;if(!t||!t.state)return _;if(2===(s=(r=t.state).wrap)||1===s&&r.status!==C||r.lookahead)return _;for(1===s&&(t.adler=c(t.adler,e,l,0)),r.wrap=0,l>=r.w_size&&(0===s&&(D(r.head),r.strstart=0,r.block_start=0,r.insert=0),u=new d.Buf8(r.w_size),d.arraySet(u,e,l-r.w_size,r.w_size,0),e=u,l=r.w_size),a=t.avail_in,o=t.next_in,h=t.input,t.avail_in=l,t.next_in=0,t.input=e,j(r);r.lookahead>=x;){for(i=r.strstart,n=r.lookahead-(x-1);r.ins_h=(r.ins_h<<r.hash_shift^r.window[i+x-1])&r.hash_mask,r.prev[i&r.w_mask]=r.head[r.ins_h],r.head[r.ins_h]=i,i++,--n;);r.strstart=i,r.lookahead=x-1,j(r)}return r.strstart+=r.lookahead,r.block_start=r.strstart,r.insert=r.lookahead,r.lookahead=0,r.match_length=r.prev_length=x-1,r.match_available=0,t.next_in=o,t.input=h,t.avail_in=a,r.wrap=s,m},r.deflateInfo="pako deflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./messages":51,"./trees":52}],47:[function(t,e,r){"use strict";e.exports=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}},{}],48:[function(t,e,r){"use strict";e.exports=function(t,e){var r,i,n,s,a,o,h,u,l,f,d,c,p,m,_,g,b,v,y,w,k,x,S,z,C;r=t.state,i=t.next_in,z=t.input,n=i+(t.avail_in-5),s=t.next_out,C=t.output,a=s-(e-t.avail_out),o=s+(t.avail_out-257),h=r.dmax,u=r.wsize,l=r.whave,f=r.wnext,d=r.window,c=r.hold,p=r.bits,m=r.lencode,_=r.distcode,g=(1<<r.lenbits)-1,b=(1<<r.distbits)-1;t:do{p<15&&(c+=z[i++]<<p,p+=8,c+=z[i++]<<p,p+=8),v=m[c&g];e:for(;;){if(c>>>=y=v>>>24,p-=y,0===(y=v>>>16&255))C[s++]=65535&v;else{if(!(16&y)){if(0==(64&y)){v=m[(65535&v)+(c&(1<<y)-1)];continue e}if(32&y){r.mode=12;break t}t.msg="invalid literal/length code",r.mode=30;break t}w=65535&v,(y&=15)&&(p<y&&(c+=z[i++]<<p,p+=8),w+=c&(1<<y)-1,c>>>=y,p-=y),p<15&&(c+=z[i++]<<p,p+=8,c+=z[i++]<<p,p+=8),v=_[c&b];r:for(;;){if(c>>>=y=v>>>24,p-=y,!(16&(y=v>>>16&255))){if(0==(64&y)){v=_[(65535&v)+(c&(1<<y)-1)];continue r}t.msg="invalid distance code",r.mode=30;break t}if(k=65535&v,p<(y&=15)&&(c+=z[i++]<<p,(p+=8)<y&&(c+=z[i++]<<p,p+=8)),h<(k+=c&(1<<y)-1)){t.msg="invalid distance too far back",r.mode=30;break t}if(c>>>=y,p-=y,(y=s-a)<k){if(l<(y=k-y)&&r.sane){t.msg="invalid distance too far back",r.mode=30;break t}if(S=d,(x=0)===f){if(x+=u-y,y<w){for(w-=y;C[s++]=d[x++],--y;);x=s-k,S=C}}else if(f<y){if(x+=u+f-y,(y-=f)<w){for(w-=y;C[s++]=d[x++],--y;);if(x=0,f<w){for(w-=y=f;C[s++]=d[x++],--y;);x=s-k,S=C}}}else if(x+=f-y,y<w){for(w-=y;C[s++]=d[x++],--y;);x=s-k,S=C}for(;2<w;)C[s++]=S[x++],C[s++]=S[x++],C[s++]=S[x++],w-=3;w&&(C[s++]=S[x++],1<w&&(C[s++]=S[x++]))}else{for(x=s-k;C[s++]=C[x++],C[s++]=C[x++],C[s++]=C[x++],2<(w-=3););w&&(C[s++]=C[x++],1<w&&(C[s++]=C[x++]))}break}}break}}while(i<n&&s<o);i-=w=p>>3,c&=(1<<(p-=w<<3))-1,t.next_in=i,t.next_out=s,t.avail_in=i<n?n-i+5:5-(i-n),t.avail_out=s<o?o-s+257:257-(s-o),r.hold=c,r.bits=p}},{}],49:[function(t,e,r){"use strict";var I=t("../utils/common"),O=t("./adler32"),B=t("./crc32"),R=t("./inffast"),T=t("./inftrees"),D=1,F=2,N=0,U=-2,P=1,i=852,n=592;function L(t){return(t>>>24&255)+(t>>>8&65280)+((65280&t)<<8)+((255&t)<<24)}function s(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new I.Buf16(320),this.work=new I.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function a(t){var e;return t&&t.state?(e=t.state,t.total_in=t.total_out=e.total=0,t.msg="",e.wrap&&(t.adler=1&e.wrap),e.mode=P,e.last=0,e.havedict=0,e.dmax=32768,e.head=null,e.hold=0,e.bits=0,e.lencode=e.lendyn=new I.Buf32(i),e.distcode=e.distdyn=new I.Buf32(n),e.sane=1,e.back=-1,N):U}function o(t){var e;return t&&t.state?((e=t.state).wsize=0,e.whave=0,e.wnext=0,a(t)):U}function h(t,e){var r,i;return t&&t.state?(i=t.state,e<0?(r=0,e=-e):(r=1+(e>>4),e<48&&(e&=15)),e&&(e<8||15<e)?U:(null!==i.window&&i.wbits!==e&&(i.window=null),i.wrap=r,i.wbits=e,o(t))):U}function u(t,e){var r,i;return t?(i=new s,(t.state=i).window=null,(r=h(t,e))!==N&&(t.state=null),r):U}var l,f,d=!0;function j(t){if(d){var e;for(l=new I.Buf32(512),f=new I.Buf32(32),e=0;e<144;)t.lens[e++]=8;for(;e<256;)t.lens[e++]=9;for(;e<280;)t.lens[e++]=7;for(;e<288;)t.lens[e++]=8;for(T(D,t.lens,0,288,l,0,t.work,{bits:9}),e=0;e<32;)t.lens[e++]=5;T(F,t.lens,0,32,f,0,t.work,{bits:5}),d=!1}t.lencode=l,t.lenbits=9,t.distcode=f,t.distbits=5}function Z(t,e,r,i){var n,s=t.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new I.Buf8(s.wsize)),i>=s.wsize?(I.arraySet(s.window,e,r-s.wsize,s.wsize,0),s.wnext=0,s.whave=s.wsize):(i<(n=s.wsize-s.wnext)&&(n=i),I.arraySet(s.window,e,r-i,n,s.wnext),(i-=n)?(I.arraySet(s.window,e,r-i,i,0),s.wnext=i,s.whave=s.wsize):(s.wnext+=n,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=n))),0}r.inflateReset=o,r.inflateReset2=h,r.inflateResetKeep=a,r.inflateInit=function(t){return u(t,15)},r.inflateInit2=u,r.inflate=function(t,e){var r,i,n,s,a,o,h,u,l,f,d,c,p,m,_,g,b,v,y,w,k,x,S,z,C=0,E=new I.Buf8(4),A=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!t||!t.state||!t.output||!t.input&&0!==t.avail_in)return U;12===(r=t.state).mode&&(r.mode=13),a=t.next_out,n=t.output,h=t.avail_out,s=t.next_in,i=t.input,o=t.avail_in,u=r.hold,l=r.bits,f=o,d=h,x=N;t:for(;;)switch(r.mode){case P:if(0===r.wrap){r.mode=13;break}for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(2&r.wrap&&35615===u){E[r.check=0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0),l=u=0,r.mode=2;break}if(r.flags=0,r.head&&(r.head.done=!1),!(1&r.wrap)||(((255&u)<<8)+(u>>8))%31){t.msg="incorrect header check",r.mode=30;break}if(8!=(15&u)){t.msg="unknown compression method",r.mode=30;break}if(l-=4,k=8+(15&(u>>>=4)),0===r.wbits)r.wbits=k;else if(k>r.wbits){t.msg="invalid window size",r.mode=30;break}r.dmax=1<<k,t.adler=r.check=1,r.mode=512&u?10:12,l=u=0;break;case 2:for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(r.flags=u,8!=(255&r.flags)){t.msg="unknown compression method",r.mode=30;break}if(57344&r.flags){t.msg="unknown header flags set",r.mode=30;break}r.head&&(r.head.text=u>>8&1),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=3;case 3:for(;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.head&&(r.head.time=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,E[2]=u>>>16&255,E[3]=u>>>24&255,r.check=B(r.check,E,4,0)),l=u=0,r.mode=4;case 4:for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.head&&(r.head.xflags=255&u,r.head.os=u>>8),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0,r.mode=5;case 5:if(1024&r.flags){for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.length=u,r.head&&(r.head.extra_len=u),512&r.flags&&(E[0]=255&u,E[1]=u>>>8&255,r.check=B(r.check,E,2,0)),l=u=0}else r.head&&(r.head.extra=null);r.mode=6;case 6:if(1024&r.flags&&(o<(c=r.length)&&(c=o),c&&(r.head&&(k=r.head.extra_len-r.length,r.head.extra||(r.head.extra=new Array(r.head.extra_len)),I.arraySet(r.head.extra,i,s,c,k)),512&r.flags&&(r.check=B(r.check,i,c,s)),o-=c,s+=c,r.length-=c),r.length))break t;r.length=0,r.mode=7;case 7:if(2048&r.flags){if(0===o)break t;for(c=0;k=i[s+c++],r.head&&k&&r.length<65536&&(r.head.name+=String.fromCharCode(k)),k&&c<o;);if(512&r.flags&&(r.check=B(r.check,i,c,s)),o-=c,s+=c,k)break t}else r.head&&(r.head.name=null);r.length=0,r.mode=8;case 8:if(4096&r.flags){if(0===o)break t;for(c=0;k=i[s+c++],r.head&&k&&r.length<65536&&(r.head.comment+=String.fromCharCode(k)),k&&c<o;);if(512&r.flags&&(r.check=B(r.check,i,c,s)),o-=c,s+=c,k)break t}else r.head&&(r.head.comment=null);r.mode=9;case 9:if(512&r.flags){for(;l<16;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(u!==(65535&r.check)){t.msg="header crc mismatch",r.mode=30;break}l=u=0}r.head&&(r.head.hcrc=r.flags>>9&1,r.head.done=!0),t.adler=r.check=0,r.mode=12;break;case 10:for(;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}t.adler=r.check=L(u),l=u=0,r.mode=11;case 11:if(0===r.havedict)return t.next_out=a,t.avail_out=h,t.next_in=s,t.avail_in=o,r.hold=u,r.bits=l,2;t.adler=r.check=1,r.mode=12;case 12:if(5===e||6===e)break t;case 13:if(r.last){u>>>=7&l,l-=7&l,r.mode=27;break}for(;l<3;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}switch(r.last=1&u,l-=1,3&(u>>>=1)){case 0:r.mode=14;break;case 1:if(j(r),r.mode=20,6!==e)break;u>>>=2,l-=2;break t;case 2:r.mode=17;break;case 3:t.msg="invalid block type",r.mode=30}u>>>=2,l-=2;break;case 14:for(u>>>=7&l,l-=7&l;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if((65535&u)!=(u>>>16^65535)){t.msg="invalid stored block lengths",r.mode=30;break}if(r.length=65535&u,l=u=0,r.mode=15,6===e)break t;case 15:r.mode=16;case 16:if(c=r.length){if(o<c&&(c=o),h<c&&(c=h),0===c)break t;I.arraySet(n,i,s,c,a),o-=c,s+=c,h-=c,a+=c,r.length-=c;break}r.mode=12;break;case 17:for(;l<14;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(r.nlen=257+(31&u),u>>>=5,l-=5,r.ndist=1+(31&u),u>>>=5,l-=5,r.ncode=4+(15&u),u>>>=4,l-=4,286<r.nlen||30<r.ndist){t.msg="too many length or distance symbols",r.mode=30;break}r.have=0,r.mode=18;case 18:for(;r.have<r.ncode;){for(;l<3;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.lens[A[r.have++]]=7&u,u>>>=3,l-=3}for(;r.have<19;)r.lens[A[r.have++]]=0;if(r.lencode=r.lendyn,r.lenbits=7,S={bits:r.lenbits},x=T(0,r.lens,0,19,r.lencode,0,r.work,S),r.lenbits=S.bits,x){t.msg="invalid code lengths set",r.mode=30;break}r.have=0,r.mode=19;case 19:for(;r.have<r.nlen+r.ndist;){for(;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(b<16)u>>>=_,l-=_,r.lens[r.have++]=b;else{if(16===b){for(z=_+2;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(u>>>=_,l-=_,0===r.have){t.msg="invalid bit length repeat",r.mode=30;break}k=r.lens[r.have-1],c=3+(3&u),u>>>=2,l-=2}else if(17===b){for(z=_+3;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}l-=_,k=0,c=3+(7&(u>>>=_)),u>>>=3,l-=3}else{for(z=_+7;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}l-=_,k=0,c=11+(127&(u>>>=_)),u>>>=7,l-=7}if(r.have+c>r.nlen+r.ndist){t.msg="invalid bit length repeat",r.mode=30;break}for(;c--;)r.lens[r.have++]=k}}if(30===r.mode)break;if(0===r.lens[256]){t.msg="invalid code -- missing end-of-block",r.mode=30;break}if(r.lenbits=9,S={bits:r.lenbits},x=T(D,r.lens,0,r.nlen,r.lencode,0,r.work,S),r.lenbits=S.bits,x){t.msg="invalid literal/lengths set",r.mode=30;break}if(r.distbits=6,r.distcode=r.distdyn,S={bits:r.distbits},x=T(F,r.lens,r.nlen,r.ndist,r.distcode,0,r.work,S),r.distbits=S.bits,x){t.msg="invalid distances set",r.mode=30;break}if(r.mode=20,6===e)break t;case 20:r.mode=21;case 21:if(6<=o&&258<=h){t.next_out=a,t.avail_out=h,t.next_in=s,t.avail_in=o,r.hold=u,r.bits=l,R(t,d),a=t.next_out,n=t.output,h=t.avail_out,s=t.next_in,i=t.input,o=t.avail_in,u=r.hold,l=r.bits,12===r.mode&&(r.back=-1);break}for(r.back=0;g=(C=r.lencode[u&(1<<r.lenbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(g&&0==(240&g)){for(v=_,y=g,w=b;g=(C=r.lencode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,r.length=b,0===g){r.mode=26;break}if(32&g){r.back=-1,r.mode=12;break}if(64&g){t.msg="invalid literal/length code",r.mode=30;break}r.extra=15&g,r.mode=22;case 22:if(r.extra){for(z=r.extra;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.length+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}r.was=r.length,r.mode=23;case 23:for(;g=(C=r.distcode[u&(1<<r.distbits)-1])>>>16&255,b=65535&C,!((_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(0==(240&g)){for(v=_,y=g,w=b;g=(C=r.distcode[w+((u&(1<<v+y)-1)>>v)])>>>16&255,b=65535&C,!(v+(_=C>>>24)<=l);){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}u>>>=v,l-=v,r.back+=v}if(u>>>=_,l-=_,r.back+=_,64&g){t.msg="invalid distance code",r.mode=30;break}r.offset=b,r.extra=15&g,r.mode=24;case 24:if(r.extra){for(z=r.extra;l<z;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}r.offset+=u&(1<<r.extra)-1,u>>>=r.extra,l-=r.extra,r.back+=r.extra}if(r.offset>r.dmax){t.msg="invalid distance too far back",r.mode=30;break}r.mode=25;case 25:if(0===h)break t;if(c=d-h,r.offset>c){if((c=r.offset-c)>r.whave&&r.sane){t.msg="invalid distance too far back",r.mode=30;break}p=c>r.wnext?(c-=r.wnext,r.wsize-c):r.wnext-c,c>r.length&&(c=r.length),m=r.window}else m=n,p=a-r.offset,c=r.length;for(h<c&&(c=h),h-=c,r.length-=c;n[a++]=m[p++],--c;);0===r.length&&(r.mode=21);break;case 26:if(0===h)break t;n[a++]=r.length,h--,r.mode=21;break;case 27:if(r.wrap){for(;l<32;){if(0===o)break t;o--,u|=i[s++]<<l,l+=8}if(d-=h,t.total_out+=d,r.total+=d,d&&(t.adler=r.check=r.flags?B(r.check,n,d,a-d):O(r.check,n,d,a-d)),d=h,(r.flags?u:L(u))!==r.check){t.msg="incorrect data check",r.mode=30;break}l=u=0}r.mode=28;case 28:if(r.wrap&&r.flags){for(;l<32;){if(0===o)break t;o--,u+=i[s++]<<l,l+=8}if(u!==(4294967295&r.total)){t.msg="incorrect length check",r.mode=30;break}l=u=0}r.mode=29;case 29:x=1;break t;case 30:x=-3;break t;case 31:return-4;case 32:default:return U}return t.next_out=a,t.avail_out=h,t.next_in=s,t.avail_in=o,r.hold=u,r.bits=l,(r.wsize||d!==t.avail_out&&r.mode<30&&(r.mode<27||4!==e))&&Z(t,t.output,t.next_out,d-t.avail_out)?(r.mode=31,-4):(f-=t.avail_in,d-=t.avail_out,t.total_in+=f,t.total_out+=d,r.total+=d,r.wrap&&d&&(t.adler=r.check=r.flags?B(r.check,n,d,t.next_out-d):O(r.check,n,d,t.next_out-d)),t.data_type=r.bits+(r.last?64:0)+(12===r.mode?128:0)+(20===r.mode||15===r.mode?256:0),(0==f&&0===d||4===e)&&x===N&&(x=-5),x)},r.inflateEnd=function(t){if(!t||!t.state)return U;var e=t.state;return e.window&&(e.window=null),t.state=null,N},r.inflateGetHeader=function(t,e){var r;return t&&t.state?0==(2&(r=t.state).wrap)?U:((r.head=e).done=!1,N):U},r.inflateSetDictionary=function(t,e){var r,i=e.length;return t&&t.state?0!==(r=t.state).wrap&&11!==r.mode?U:11===r.mode&&O(1,e,i,0)!==r.check?-3:Z(t,e,i,i)?(r.mode=31,-4):(r.havedict=1,N):U},r.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":41,"./adler32":43,"./crc32":45,"./inffast":48,"./inftrees":50}],50:[function(t,e,r){"use strict";var D=t("../utils/common"),F=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],N=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],U=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],P=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];e.exports=function(t,e,r,i,n,s,a,o){var h,u,l,f,d,c,p,m,_,g=o.bits,b=0,v=0,y=0,w=0,k=0,x=0,S=0,z=0,C=0,E=0,A=null,I=0,O=new D.Buf16(16),B=new D.Buf16(16),R=null,T=0;for(b=0;b<=15;b++)O[b]=0;for(v=0;v<i;v++)O[e[r+v]]++;for(k=g,w=15;1<=w&&0===O[w];w--);if(w<k&&(k=w),0===w)return n[s++]=20971520,n[s++]=20971520,o.bits=1,0;for(y=1;y<w&&0===O[y];y++);for(k<y&&(k=y),b=z=1;b<=15;b++)if(z<<=1,(z-=O[b])<0)return-1;if(0<z&&(0===t||1!==w))return-1;for(B[1]=0,b=1;b<15;b++)B[b+1]=B[b]+O[b];for(v=0;v<i;v++)0!==e[r+v]&&(a[B[e[r+v]]++]=v);if(c=0===t?(A=R=a,19):1===t?(A=F,I-=257,R=N,T-=257,256):(A=U,R=P,-1),b=y,d=s,S=v=E=0,l=-1,f=(C=1<<(x=k))-1,1===t&&852<C||2===t&&592<C)return 1;for(;;){for(p=b-S,_=a[v]<c?(m=0,a[v]):a[v]>c?(m=R[T+a[v]],A[I+a[v]]):(m=96,0),h=1<<b-S,y=u=1<<x;n[d+(E>>S)+(u-=h)]=p<<24|m<<16|_|0,0!==u;);for(h=1<<b-1;E&h;)h>>=1;if(0!==h?(E&=h-1,E+=h):E=0,v++,0==--O[b]){if(b===w)break;b=e[r+a[v]]}if(k<b&&(E&f)!==l){for(0===S&&(S=k),d+=y,z=1<<(x=b-S);x+S<w&&!((z-=O[x+S])<=0);)x++,z<<=1;if(C+=1<<x,1===t&&852<C||2===t&&592<C)return 1;n[l=E&f]=k<<24|x<<16|d-s|0}}return 0!==E&&(n[d+E]=b-S<<24|64<<16|0),o.bits=k,0}},{"../utils/common":41}],51:[function(t,e,r){"use strict";e.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],52:[function(t,e,r){"use strict";var n=t("../utils/common"),o=0,h=1;function i(t){for(var e=t.length;0<=--e;)t[e]=0}var s=0,a=29,u=256,l=u+1+a,f=30,d=19,_=2*l+1,g=15,c=16,p=7,m=256,b=16,v=17,y=18,w=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],k=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],x=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],S=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],z=new Array(2*(l+2));i(z);var C=new Array(2*f);i(C);var E=new Array(512);i(E);var A=new Array(256);i(A);var I=new Array(a);i(I);var O,B,R,T=new Array(f);function D(t,e,r,i,n){this.static_tree=t,this.extra_bits=e,this.extra_base=r,this.elems=i,this.max_length=n,this.has_stree=t&&t.length}function F(t,e){this.dyn_tree=t,this.max_code=0,this.stat_desc=e}function N(t){return t<256?E[t]:E[256+(t>>>7)]}function U(t,e){t.pending_buf[t.pending++]=255&e,t.pending_buf[t.pending++]=e>>>8&255}function P(t,e,r){t.bi_valid>c-r?(t.bi_buf|=e<<t.bi_valid&65535,U(t,t.bi_buf),t.bi_buf=e>>c-t.bi_valid,t.bi_valid+=r-c):(t.bi_buf|=e<<t.bi_valid&65535,t.bi_valid+=r)}function L(t,e,r){P(t,r[2*e],r[2*e+1])}function j(t,e){for(var r=0;r|=1&t,t>>>=1,r<<=1,0<--e;);return r>>>1}function Z(t,e,r){var i,n,s=new Array(g+1),a=0;for(i=1;i<=g;i++)s[i]=a=a+r[i-1]<<1;for(n=0;n<=e;n++){var o=t[2*n+1];0!==o&&(t[2*n]=j(s[o]++,o))}}function W(t){var e;for(e=0;e<l;e++)t.dyn_ltree[2*e]=0;for(e=0;e<f;e++)t.dyn_dtree[2*e]=0;for(e=0;e<d;e++)t.bl_tree[2*e]=0;t.dyn_ltree[2*m]=1,t.opt_len=t.static_len=0,t.last_lit=t.matches=0}function M(t){8<t.bi_valid?U(t,t.bi_buf):0<t.bi_valid&&(t.pending_buf[t.pending++]=t.bi_buf),t.bi_buf=0,t.bi_valid=0}function H(t,e,r,i){var n=2*e,s=2*r;return t[n]<t[s]||t[n]===t[s]&&i[e]<=i[r]}function G(t,e,r){for(var i=t.heap[r],n=r<<1;n<=t.heap_len&&(n<t.heap_len&&H(e,t.heap[n+1],t.heap[n],t.depth)&&n++,!H(e,i,t.heap[n],t.depth));)t.heap[r]=t.heap[n],r=n,n<<=1;t.heap[r]=i}function K(t,e,r){var i,n,s,a,o=0;if(0!==t.last_lit)for(;i=t.pending_buf[t.d_buf+2*o]<<8|t.pending_buf[t.d_buf+2*o+1],n=t.pending_buf[t.l_buf+o],o++,0===i?L(t,n,e):(L(t,(s=A[n])+u+1,e),0!==(a=w[s])&&P(t,n-=I[s],a),L(t,s=N(--i),r),0!==(a=k[s])&&P(t,i-=T[s],a)),o<t.last_lit;);L(t,m,e)}function Y(t,e){var r,i,n,s=e.dyn_tree,a=e.stat_desc.static_tree,o=e.stat_desc.has_stree,h=e.stat_desc.elems,u=-1;for(t.heap_len=0,t.heap_max=_,r=0;r<h;r++)0!==s[2*r]?(t.heap[++t.heap_len]=u=r,t.depth[r]=0):s[2*r+1]=0;for(;t.heap_len<2;)s[2*(n=t.heap[++t.heap_len]=u<2?++u:0)]=1,t.depth[n]=0,t.opt_len--,o&&(t.static_len-=a[2*n+1]);for(e.max_code=u,r=t.heap_len>>1;1<=r;r--)G(t,s,r);for(n=h;r=t.heap[1],t.heap[1]=t.heap[t.heap_len--],G(t,s,1),i=t.heap[1],t.heap[--t.heap_max]=r,t.heap[--t.heap_max]=i,s[2*n]=s[2*r]+s[2*i],t.depth[n]=(t.depth[r]>=t.depth[i]?t.depth[r]:t.depth[i])+1,s[2*r+1]=s[2*i+1]=n,t.heap[1]=n++,G(t,s,1),2<=t.heap_len;);t.heap[--t.heap_max]=t.heap[1],function(t,e){var r,i,n,s,a,o,h=e.dyn_tree,u=e.max_code,l=e.stat_desc.static_tree,f=e.stat_desc.has_stree,d=e.stat_desc.extra_bits,c=e.stat_desc.extra_base,p=e.stat_desc.max_length,m=0;for(s=0;s<=g;s++)t.bl_count[s]=0;for(h[2*t.heap[t.heap_max]+1]=0,r=t.heap_max+1;r<_;r++)p<(s=h[2*h[2*(i=t.heap[r])+1]+1]+1)&&(s=p,m++),h[2*i+1]=s,u<i||(t.bl_count[s]++,a=0,c<=i&&(a=d[i-c]),o=h[2*i],t.opt_len+=o*(s+a),f&&(t.static_len+=o*(l[2*i+1]+a)));if(0!==m){do{for(s=p-1;0===t.bl_count[s];)s--;t.bl_count[s]--,t.bl_count[s+1]+=2,t.bl_count[p]--,m-=2}while(0<m);for(s=p;0!==s;s--)for(i=t.bl_count[s];0!==i;)u<(n=t.heap[--r])||(h[2*n+1]!==s&&(t.opt_len+=(s-h[2*n+1])*h[2*n],h[2*n+1]=s),i--)}}(t,e),Z(s,u,t.bl_count)}function X(t,e,r){var i,n,s=-1,a=e[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),e[2*(r+1)+1]=65535,i=0;i<=r;i++)n=a,a=e[2*(i+1)+1],++o<h&&n===a||(o<u?t.bl_tree[2*n]+=o:0!==n?(n!==s&&t.bl_tree[2*n]++,t.bl_tree[2*b]++):o<=10?t.bl_tree[2*v]++:t.bl_tree[2*y]++,s=n,u=(o=0)===a?(h=138,3):n===a?(h=6,3):(h=7,4))}function V(t,e,r){var i,n,s=-1,a=e[1],o=0,h=7,u=4;for(0===a&&(h=138,u=3),i=0;i<=r;i++)if(n=a,a=e[2*(i+1)+1],!(++o<h&&n===a)){if(o<u)for(;L(t,n,t.bl_tree),0!=--o;);else 0!==n?(n!==s&&(L(t,n,t.bl_tree),o--),L(t,b,t.bl_tree),P(t,o-3,2)):o<=10?(L(t,v,t.bl_tree),P(t,o-3,3)):(L(t,y,t.bl_tree),P(t,o-11,7));s=n,u=(o=0)===a?(h=138,3):n===a?(h=6,3):(h=7,4)}}i(T);var q=!1;function J(t,e,r,i){P(t,(s<<1)+(i?1:0),3),function(t,e,r,i){M(t),i&&(U(t,r),U(t,~r)),n.arraySet(t.pending_buf,t.window,e,r,t.pending),t.pending+=r}(t,e,r,!0)}r._tr_init=function(t){q||(function(){var t,e,r,i,n,s=new Array(g+1);for(i=r=0;i<a-1;i++)for(I[i]=r,t=0;t<1<<w[i];t++)A[r++]=i;for(A[r-1]=i,i=n=0;i<16;i++)for(T[i]=n,t=0;t<1<<k[i];t++)E[n++]=i;for(n>>=7;i<f;i++)for(T[i]=n<<7,t=0;t<1<<k[i]-7;t++)E[256+n++]=i;for(e=0;e<=g;e++)s[e]=0;for(t=0;t<=143;)z[2*t+1]=8,t++,s[8]++;for(;t<=255;)z[2*t+1]=9,t++,s[9]++;for(;t<=279;)z[2*t+1]=7,t++,s[7]++;for(;t<=287;)z[2*t+1]=8,t++,s[8]++;for(Z(z,l+1,s),t=0;t<f;t++)C[2*t+1]=5,C[2*t]=j(t,5);O=new D(z,w,u+1,l,g),B=new D(C,k,0,f,g),R=new D(new Array(0),x,0,d,p)}(),q=!0),t.l_desc=new F(t.dyn_ltree,O),t.d_desc=new F(t.dyn_dtree,B),t.bl_desc=new F(t.bl_tree,R),t.bi_buf=0,t.bi_valid=0,W(t)},r._tr_stored_block=J,r._tr_flush_block=function(t,e,r,i){var n,s,a=0;0<t.level?(2===t.strm.data_type&&(t.strm.data_type=function(t){var e,r=4093624447;for(e=0;e<=31;e++,r>>>=1)if(1&r&&0!==t.dyn_ltree[2*e])return o;if(0!==t.dyn_ltree[18]||0!==t.dyn_ltree[20]||0!==t.dyn_ltree[26])return h;for(e=32;e<u;e++)if(0!==t.dyn_ltree[2*e])return h;return o}(t)),Y(t,t.l_desc),Y(t,t.d_desc),a=function(t){var e;for(X(t,t.dyn_ltree,t.l_desc.max_code),X(t,t.dyn_dtree,t.d_desc.max_code),Y(t,t.bl_desc),e=d-1;3<=e&&0===t.bl_tree[2*S[e]+1];e--);return t.opt_len+=3*(e+1)+5+5+4,e}(t),n=t.opt_len+3+7>>>3,(s=t.static_len+3+7>>>3)<=n&&(n=s)):n=s=r+5,r+4<=n&&-1!==e?J(t,e,r,i):4===t.strategy||s===n?(P(t,2+(i?1:0),3),K(t,z,C)):(P(t,4+(i?1:0),3),function(t,e,r,i){var n;for(P(t,e-257,5),P(t,r-1,5),P(t,i-4,4),n=0;n<i;n++)P(t,t.bl_tree[2*S[n]+1],3);V(t,t.dyn_ltree,e-1),V(t,t.dyn_dtree,r-1)}(t,t.l_desc.max_code+1,t.d_desc.max_code+1,a+1),K(t,t.dyn_ltree,t.dyn_dtree)),W(t),i&&M(t)},r._tr_tally=function(t,e,r){return t.pending_buf[t.d_buf+2*t.last_lit]=e>>>8&255,t.pending_buf[t.d_buf+2*t.last_lit+1]=255&e,t.pending_buf[t.l_buf+t.last_lit]=255&r,t.last_lit++,0===e?t.dyn_ltree[2*r]++:(t.matches++,e--,t.dyn_ltree[2*(A[r]+u+1)]++,t.dyn_dtree[2*N(e)]++),t.last_lit===t.lit_bufsize-1},r._tr_align=function(t){P(t,2,3),L(t,m,z),function(t){16===t.bi_valid?(U(t,t.bi_buf),t.bi_buf=0,t.bi_valid=0):8<=t.bi_valid&&(t.pending_buf[t.pending++]=255&t.bi_buf,t.bi_buf>>=8,t.bi_valid-=8)}(t)}},{"../utils/common":41}],53:[function(t,e,r){"use strict";e.exports=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}},{}],54:[function(t,e,r){"use strict";e.exports="function"==typeof setImmediate?setImmediate:function(){var t=[].slice.apply(arguments);t.splice(1,0,0),setTimeout.apply(null,t)}},{}]},{},[10])(10)});
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
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":12,"timers":13}],14:[function(require,module,exports){
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

},{"assert":1,"blob-polyfill":6,"file-saver":8,"jszip":10}]},{},[14])(14)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Fzc2VydC9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwibm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ibG9iLXBvbHlmaWxsL0Jsb2IuanMiLCJub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZpbGUtc2F2ZXIvRmlsZVNhdmVyLmpzIiwibm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvanN6aXAvZGlzdC9qc3ppcC5taW4uanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWFzc2lnbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsInRucnMtbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2p2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBvYmplY3RBc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbi8vIGNvbXBhcmUgYW5kIGlzQnVmZmVyIHRha2VuIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvYmxvYi82ODBlOWU1ZTQ4OGYyMmFhYzI3NTk5YTU3ZGM4NDRhNjMxNTkyOGRkL2luZGV4LmpzXG4vLyBvcmlnaW5hbCBub3RpY2U6XG5cbi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmUoYSwgYikge1xuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgdmFyIHggPSBhLmxlbmd0aDtcbiAgdmFyIHkgPSBiLmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXTtcbiAgICAgIHkgPSBiW2ldO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmICh5IDwgeCkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuZnVuY3Rpb24gaXNCdWZmZXIoYikge1xuICBpZiAoZ2xvYmFsLkJ1ZmZlciAmJiB0eXBlb2YgZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyKGIpO1xuICB9XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpO1xufVxuXG4vLyBiYXNlZCBvbiBub2RlIGFzc2VydCwgb3JpZ2luYWwgbm90aWNlOlxuLy8gTkI6IFRoZSBVUkwgdG8gdGhlIENvbW1vbkpTIHNwZWMgaXMga2VwdCBqdXN0IGZvciB0cmFkaXRpb24uXG4vLyAgICAgbm9kZS1hc3NlcnQgaGFzIGV2b2x2ZWQgYSBsb3Qgc2luY2UgdGhlbiwgYm90aCBpbiBBUEkgYW5kIGJlaGF2aW9yLlxuXG4vLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGZ1bmN0aW9uc0hhdmVOYW1lcyA9IChmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBmdW5jdGlvbiBmb28oKSB7fS5uYW1lID09PSAnZm9vJztcbn0oKSk7XG5mdW5jdGlvbiBwVG9TdHJpbmcgKG9iaikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaik7XG59XG5mdW5jdGlvbiBpc1ZpZXcoYXJyYnVmKSB7XG4gIGlmIChpc0J1ZmZlcihhcnJidWYpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgZ2xvYmFsLkFycmF5QnVmZmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEFycmF5QnVmZmVyLmlzVmlldyhhcnJidWYpO1xuICB9XG4gIGlmICghYXJyYnVmKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChhcnJidWYgaW5zdGFuY2VvZiBEYXRhVmlldykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChhcnJidWYuYnVmZmVyICYmIGFycmJ1Zi5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbnZhciByZWdleCA9IC9cXHMqZnVuY3Rpb25cXHMrKFteXFwoXFxzXSopXFxzKi87XG4vLyBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vbGpoYXJiL2Z1bmN0aW9uLnByb3RvdHlwZS5uYW1lL2Jsb2IvYWRlZWVlYzhiZmNjNjA2OGIxODdkN2Q5ZmIzZDViYjFkM2EzMDg5OS9pbXBsZW1lbnRhdGlvbi5qc1xuZnVuY3Rpb24gZ2V0TmFtZShmdW5jKSB7XG4gIGlmICghdXRpbC5pc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChmdW5jdGlvbnNIYXZlTmFtZXMpIHtcbiAgICByZXR1cm4gZnVuYy5uYW1lO1xuICB9XG4gIHZhciBzdHIgPSBmdW5jLnRvU3RyaW5nKCk7XG4gIHZhciBtYXRjaCA9IHN0ci5tYXRjaChyZWdleCk7XG4gIHJldHVybiBtYXRjaCAmJiBtYXRjaFsxXTtcbn1cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBnZXROYW1lKHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh0eXBlb2YgcyA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cbmZ1bmN0aW9uIGluc3BlY3Qoc29tZXRoaW5nKSB7XG4gIGlmIChmdW5jdGlvbnNIYXZlTmFtZXMgfHwgIXV0aWwuaXNGdW5jdGlvbihzb21ldGhpbmcpKSB7XG4gICAgcmV0dXJuIHV0aWwuaW5zcGVjdChzb21ldGhpbmcpO1xuICB9XG4gIHZhciByYXduYW1lID0gZ2V0TmFtZShzb21ldGhpbmcpO1xuICB2YXIgbmFtZSA9IHJhd25hbWUgPyAnOiAnICsgcmF3bmFtZSA6ICcnO1xuICByZXR1cm4gJ1tGdW5jdGlvbicgKyAgbmFtZSArICddJztcbn1cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoaW5zcGVjdChzZWxmLmFjdHVhbCksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShpbnNwZWN0KHNlbGYuZXhwZWN0ZWQpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBmYWxzZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIGRlZXBTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCB0cnVlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBTdHJpY3RFcXVhbCcsIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHN0cmljdCwgbWVtb3MpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoaXNCdWZmZXIoYWN0dWFsKSAmJiBpc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gY29tcGFyZShhY3R1YWwsIGV4cGVjdGVkKSA9PT0gMDtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoKGFjdHVhbCA9PT0gbnVsbCB8fCB0eXBlb2YgYWN0dWFsICE9PSAnb2JqZWN0JykgJiZcbiAgICAgICAgICAgICAoZXhwZWN0ZWQgPT09IG51bGwgfHwgdHlwZW9mIGV4cGVjdGVkICE9PSAnb2JqZWN0JykpIHtcbiAgICByZXR1cm4gc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyBJZiBib3RoIHZhbHVlcyBhcmUgaW5zdGFuY2VzIG9mIHR5cGVkIGFycmF5cywgd3JhcCB0aGVpciB1bmRlcmx5aW5nXG4gIC8vIEFycmF5QnVmZmVycyBpbiBhIEJ1ZmZlciBlYWNoIHRvIGluY3JlYXNlIHBlcmZvcm1hbmNlXG4gIC8vIFRoaXMgb3B0aW1pemF0aW9uIHJlcXVpcmVzIHRoZSBhcnJheXMgdG8gaGF2ZSB0aGUgc2FtZSB0eXBlIGFzIGNoZWNrZWQgYnlcbiAgLy8gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyAoYWthIHBUb1N0cmluZykuIE5ldmVyIHBlcmZvcm0gYmluYXJ5XG4gIC8vIGNvbXBhcmlzb25zIGZvciBGbG9hdCpBcnJheXMsIHRob3VnaCwgc2luY2UgZS5nLiArMCA9PT0gLTAgYnV0IHRoZWlyXG4gIC8vIGJpdCBwYXR0ZXJucyBhcmUgbm90IGlkZW50aWNhbC5cbiAgfSBlbHNlIGlmIChpc1ZpZXcoYWN0dWFsKSAmJiBpc1ZpZXcoZXhwZWN0ZWQpICYmXG4gICAgICAgICAgICAgcFRvU3RyaW5nKGFjdHVhbCkgPT09IHBUb1N0cmluZyhleHBlY3RlZCkgJiZcbiAgICAgICAgICAgICAhKGFjdHVhbCBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fFxuICAgICAgICAgICAgICAgYWN0dWFsIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSkge1xuICAgIHJldHVybiBjb21wYXJlKG5ldyBVaW50OEFycmF5KGFjdHVhbC5idWZmZXIpLFxuICAgICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGV4cGVjdGVkLmJ1ZmZlcikpID09PSAwO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSBpZiAoaXNCdWZmZXIoYWN0dWFsKSAhPT0gaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG1lbW9zID0gbWVtb3MgfHwge2FjdHVhbDogW10sIGV4cGVjdGVkOiBbXX07XG5cbiAgICB2YXIgYWN0dWFsSW5kZXggPSBtZW1vcy5hY3R1YWwuaW5kZXhPZihhY3R1YWwpO1xuICAgIGlmIChhY3R1YWxJbmRleCAhPT0gLTEpIHtcbiAgICAgIGlmIChhY3R1YWxJbmRleCA9PT0gbWVtb3MuZXhwZWN0ZWQuaW5kZXhPZihleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbWVtb3MuYWN0dWFsLnB1c2goYWN0dWFsKTtcbiAgICBtZW1vcy5leHBlY3RlZC5wdXNoKGV4cGVjdGVkKTtcblxuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBzdHJpY3QsIG1lbW9zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBzdHJpY3QsIGFjdHVhbFZpc2l0ZWRPYmplY3RzKSB7XG4gIGlmIChhID09PSBudWxsIHx8IGEgPT09IHVuZGVmaW5lZCB8fCBiID09PSBudWxsIHx8IGIgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKVxuICAgIHJldHVybiBhID09PSBiO1xuICBpZiAoc3RyaWN0ICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihhKSAhPT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKTtcbiAgdmFyIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYiwgc3RyaWN0KTtcbiAgfVxuICB2YXIga2EgPSBvYmplY3RLZXlzKGEpO1xuICB2YXIga2IgPSBvYmplY3RLZXlzKGIpO1xuICB2YXIga2V5LCBpO1xuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9PSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIHN0cmljdCwgYWN0dWFsVmlzaXRlZE9iamVjdHMpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgZmFsc2UpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmFzc2VydC5ub3REZWVwU3RyaWN0RXF1YWwgPSBub3REZWVwU3RyaWN0RXF1YWw7XG5mdW5jdGlvbiBub3REZWVwU3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCB0cnVlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBTdHJpY3RFcXVhbCcsIG5vdERlZXBTdHJpY3RFcXVhbCk7XG4gIH1cbn1cblxuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH1cblxuICB0cnkge1xuICAgIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gSWdub3JlLiAgVGhlIGluc3RhbmNlb2YgY2hlY2sgZG9lc24ndCB3b3JrIGZvciBhcnJvdyBmdW5jdGlvbnMuXG4gIH1cblxuICBpZiAoRXJyb3IuaXNQcm90b3R5cGVPZihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gX3RyeUJsb2NrKGJsb2NrKSB7XG4gIHZhciBlcnJvcjtcbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3IgPSBlO1xuICB9XG4gIHJldHVybiBlcnJvcjtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHR5cGVvZiBibG9jayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYmxvY2tcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICdzdHJpbmcnKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIGFjdHVhbCA9IF90cnlCbG9jayhibG9jayk7XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICB2YXIgdXNlclByb3ZpZGVkTWVzc2FnZSA9IHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJztcbiAgdmFyIGlzVW53YW50ZWRFeGNlcHRpb24gPSAhc2hvdWxkVGhyb3cgJiYgdXRpbC5pc0Vycm9yKGFjdHVhbCk7XG4gIHZhciBpc1VuZXhwZWN0ZWRFeGNlcHRpb24gPSAhc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmICFleHBlY3RlZDtcblxuICBpZiAoKGlzVW53YW50ZWRFeGNlcHRpb24gJiZcbiAgICAgIHVzZXJQcm92aWRlZE1lc3NhZ2UgJiZcbiAgICAgIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fFxuICAgICAgaXNVbmV4cGVjdGVkRXhjZXB0aW9uKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzKHRydWUsIGJsb2NrLCBlcnJvciwgbWVzc2FnZSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cyhmYWxzZSwgYmxvY2ssIGVycm9yLCBtZXNzYWdlKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHRocm93IGVycjsgfTtcblxuLy8gRXhwb3NlIGEgc3RyaWN0IG9ubHkgdmFyaWFudCBvZiBhc3NlcnRcbmZ1bmN0aW9uIHN0cmljdCh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBzdHJpY3QpO1xufVxuYXNzZXJ0LnN0cmljdCA9IG9iamVjdEFzc2lnbihzdHJpY3QsIGFzc2VydCwge1xuICBlcXVhbDogYXNzZXJ0LnN0cmljdEVxdWFsLFxuICBkZWVwRXF1YWw6IGFzc2VydC5kZWVwU3RyaWN0RXF1YWwsXG4gIG5vdEVxdWFsOiBhc3NlcnQubm90U3RyaWN0RXF1YWwsXG4gIG5vdERlZXBFcXVhbDogYXNzZXJ0Lm5vdERlZXBTdHJpY3RFcXVhbFxufSk7XG5hc3NlcnQuc3RyaWN0LnN0cmljdCA9IGFzc2VydC5zdHJpY3Q7XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcbmV4cG9ydHMudG9CeXRlQXJyYXkgPSB0b0J5dGVBcnJheVxuZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gZnJvbUJ5dGVBcnJheVxuXG52YXIgbG9va3VwID0gW11cbnZhciByZXZMb29rdXAgPSBbXVxudmFyIEFyciA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyA/IFVpbnQ4QXJyYXkgOiBBcnJheVxuXG52YXIgY29kZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvZGUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgbG9va3VwW2ldID0gY29kZVtpXVxuICByZXZMb29rdXBbY29kZS5jaGFyQ29kZUF0KGkpXSA9IGlcbn1cblxuLy8gU3VwcG9ydCBkZWNvZGluZyBVUkwtc2FmZSBiYXNlNjQgc3RyaW5ncywgYXMgTm9kZS5qcyBkb2VzLlxuLy8gU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQjVVJMX2FwcGxpY2F0aW9uc1xucmV2TG9va3VwWyctJy5jaGFyQ29kZUF0KDApXSA9IDYyXG5yZXZMb29rdXBbJ18nLmNoYXJDb2RlQXQoMCldID0gNjNcblxuZnVuY3Rpb24gZ2V0TGVucyAoYjY0KSB7XG4gIHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cbiAgaWYgKGxlbiAlIDQgPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0JylcbiAgfVxuXG4gIC8vIFRyaW0gb2ZmIGV4dHJhIGJ5dGVzIGFmdGVyIHBsYWNlaG9sZGVyIGJ5dGVzIGFyZSBmb3VuZFxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9iZWF0Z2FtbWl0L2Jhc2U2NC1qcy9pc3N1ZXMvNDJcbiAgdmFyIHZhbGlkTGVuID0gYjY0LmluZGV4T2YoJz0nKVxuICBpZiAodmFsaWRMZW4gPT09IC0xKSB2YWxpZExlbiA9IGxlblxuXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSB2YWxpZExlbiA9PT0gbGVuXG4gICAgPyAwXG4gICAgOiA0IC0gKHZhbGlkTGVuICUgNClcblxuICByZXR1cm4gW3ZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW5dXG59XG5cbi8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoYjY0KSB7XG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIF9ieXRlTGVuZ3RoIChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pIHtcbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIHRvQnl0ZUFycmF5IChiNjQpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG5cbiAgdmFyIGFyciA9IG5ldyBBcnIoX2J5dGVMZW5ndGgoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSlcblxuICB2YXIgY3VyQnl0ZSA9IDBcblxuICAvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG4gIHZhciBsZW4gPSBwbGFjZUhvbGRlcnNMZW4gPiAwXG4gICAgPyB2YWxpZExlbiAtIDRcbiAgICA6IHZhbGlkTGVuXG5cbiAgdmFyIGlcbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDE4KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgMTIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA8PCA2KSB8XG4gICAgICByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDMpXVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiAxNikgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMikge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPj4gNClcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDEpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTApIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCA0KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPj4gMilcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG4gIHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gMTIgJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gJiAweDNGXVxufVxuXG5mdW5jdGlvbiBlbmNvZGVDaHVuayAodWludDgsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHRtcFxuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpICs9IDMpIHtcbiAgICB0bXAgPVxuICAgICAgKCh1aW50OFtpXSA8PCAxNikgJiAweEZGMDAwMCkgK1xuICAgICAgKCh1aW50OFtpICsgMV0gPDwgOCkgJiAweEZGMDApICtcbiAgICAgICh1aW50OFtpICsgMl0gJiAweEZGKVxuICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKVxuICB9XG4gIHJldHVybiBvdXRwdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZnJvbUJ5dGVBcnJheSAodWludDgpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVuID0gdWludDgubGVuZ3RoXG4gIHZhciBleHRyYUJ5dGVzID0gbGVuICUgMyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICB2YXIgcGFydHMgPSBbXVxuICB2YXIgbWF4Q2h1bmtMZW5ndGggPSAxNjM4MyAvLyBtdXN0IGJlIG11bHRpcGxlIG9mIDNcblxuICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4yID0gbGVuIC0gZXh0cmFCeXRlczsgaSA8IGxlbjI7IGkgKz0gbWF4Q2h1bmtMZW5ndGgpIHtcbiAgICBwYXJ0cy5wdXNoKGVuY29kZUNodW5rKHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aCkpKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXSArXG4gICAgICAnPT0nXG4gICAgKVxuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDEwXSArXG4gICAgICBsb29rdXBbKHRtcCA+PiA0KSAmIDB4M0ZdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDIpICYgMHgzRl0gK1xuICAgICAgJz0nXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCIvKiBCbG9iLmpzXG4gKiBBIEJsb2IgaW1wbGVtZW50YXRpb24uXG4gKiAyMDE0LTA3LTI0XG4gKlxuICogQnkgRWxpIEdyZXksIGh0dHA6Ly9lbGlncmV5LmNvbVxuICogQnkgRGV2aW4gU2FtYXJpbiwgaHR0cHM6Ly9naXRodWIuY29tL2RzYW1hcmluXG4gKiBMaWNlbnNlOiBYMTEvTUlUXG4gKiAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9CbG9iLmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0UubWRcbiAqL1xuXG4vKmdsb2JhbCBzZWxmLCB1bmVzY2FwZSAqL1xuLypqc2xpbnQgYml0d2lzZTogdHJ1ZSwgcmVnZXhwOiB0cnVlLCBjb25mdXNpb246IHRydWUsIGVzNTogdHJ1ZSwgdmFyczogdHJ1ZSwgd2hpdGU6IHRydWUsXG4gIHBsdXNwbHVzOiB0cnVlICovXG5cbi8qISBAc291cmNlIGh0dHA6Ly9wdXJsLmVsaWdyZXkuY29tL2dpdGh1Yi9CbG9iLmpzL2Jsb2IvbWFzdGVyL0Jsb2IuanMgKi9cblxuKGZ1bmN0aW9uICh2aWV3KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZpZXcuVVJMID0gdmlldy5VUkwgfHwgdmlldy53ZWJraXRVUkw7XG5cblx0aWYgKHZpZXcuQmxvYiAmJiB2aWV3LlVSTCkge1xuXHRcdHRyeSB7XG5cdFx0XHRuZXcgQmxvYjtcblx0XHRcdHJldHVybjtcblx0XHR9IGNhdGNoIChlKSB7fVxuXHR9XG5cblx0Ly8gSW50ZXJuYWxseSB3ZSB1c2UgYSBCbG9iQnVpbGRlciBpbXBsZW1lbnRhdGlvbiB0byBiYXNlIEJsb2Igb2ZmIG9mXG5cdC8vIGluIG9yZGVyIHRvIHN1cHBvcnQgb2xkZXIgYnJvd3NlcnMgdGhhdCBvbmx5IGhhdmUgQmxvYkJ1aWxkZXJcblx0dmFyIEJsb2JCdWlsZGVyID0gdmlldy5CbG9iQnVpbGRlciB8fCB2aWV3LldlYktpdEJsb2JCdWlsZGVyIHx8IHZpZXcuTW96QmxvYkJ1aWxkZXIgfHwgKGZ1bmN0aW9uKHZpZXcpIHtcblx0XHR2YXJcblx0XHRcdCAgZ2V0X2NsYXNzID0gZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0XHRcdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KS5tYXRjaCgvXlxcW29iamVjdFxccyguKilcXF0kLylbMV07XG5cdFx0XHR9XG5cdFx0XHQsIEZha2VCbG9iQnVpbGRlciA9IGZ1bmN0aW9uIEJsb2JCdWlsZGVyKCkge1xuXHRcdFx0XHR0aGlzLmRhdGEgPSBbXTtcblx0XHRcdH1cblx0XHRcdCwgRmFrZUJsb2IgPSBmdW5jdGlvbiBCbG9iKGRhdGEsIHR5cGUsIGVuY29kaW5nKSB7XG5cdFx0XHRcdHRoaXMuZGF0YSA9IGRhdGE7XG5cdFx0XHRcdHRoaXMuc2l6ZSA9IGRhdGEubGVuZ3RoO1xuXHRcdFx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdFx0XHR0aGlzLmVuY29kaW5nID0gZW5jb2Rpbmc7XG5cdFx0XHR9XG5cdFx0XHQsIEZCQl9wcm90byA9IEZha2VCbG9iQnVpbGRlci5wcm90b3R5cGVcblx0XHRcdCwgRkJfcHJvdG8gPSBGYWtlQmxvYi5wcm90b3R5cGVcblx0XHRcdCwgRmlsZVJlYWRlclN5bmMgPSB2aWV3LkZpbGVSZWFkZXJTeW5jXG5cdFx0XHQsIEZpbGVFeGNlcHRpb24gPSBmdW5jdGlvbih0eXBlKSB7XG5cdFx0XHRcdHRoaXMuY29kZSA9IHRoaXNbdGhpcy5uYW1lID0gdHlwZV07XG5cdFx0XHR9XG5cdFx0XHQsIGZpbGVfZXhfY29kZXMgPSAoXG5cdFx0XHRcdCAgXCJOT1RfRk9VTkRfRVJSIFNFQ1VSSVRZX0VSUiBBQk9SVF9FUlIgTk9UX1JFQURBQkxFX0VSUiBFTkNPRElOR19FUlIgXCJcblx0XHRcdFx0KyBcIk5PX01PRElGSUNBVElPTl9BTExPV0VEX0VSUiBJTlZBTElEX1NUQVRFX0VSUiBTWU5UQVhfRVJSXCJcblx0XHRcdCkuc3BsaXQoXCIgXCIpXG5cdFx0XHQsIGZpbGVfZXhfY29kZSA9IGZpbGVfZXhfY29kZXMubGVuZ3RoXG5cdFx0XHQsIHJlYWxfVVJMID0gdmlldy5VUkwgfHwgdmlldy53ZWJraXRVUkwgfHwgdmlld1xuXHRcdFx0LCByZWFsX2NyZWF0ZV9vYmplY3RfVVJMID0gcmVhbF9VUkwuY3JlYXRlT2JqZWN0VVJMXG5cdFx0XHQsIHJlYWxfcmV2b2tlX29iamVjdF9VUkwgPSByZWFsX1VSTC5yZXZva2VPYmplY3RVUkxcblx0XHRcdCwgVVJMID0gcmVhbF9VUkxcblx0XHRcdCwgYnRvYSA9IHZpZXcuYnRvYVxuXHRcdFx0LCBhdG9iID0gdmlldy5hdG9iXG5cblx0XHRcdCwgQXJyYXlCdWZmZXIgPSB2aWV3LkFycmF5QnVmZmVyXG5cdFx0XHQsIFVpbnQ4QXJyYXkgPSB2aWV3LlVpbnQ4QXJyYXlcblxuXHRcdFx0LCBvcmlnaW4gPSAvXltcXHctXSs6XFwvKlxcWz9bXFx3XFwuOi1dK1xcXT8oPzo6WzAtOV0rKT8vXG5cdFx0O1xuXHRcdEZha2VCbG9iLmZha2UgPSBGQl9wcm90by5mYWtlID0gdHJ1ZTtcblx0XHR3aGlsZSAoZmlsZV9leF9jb2RlLS0pIHtcblx0XHRcdEZpbGVFeGNlcHRpb24ucHJvdG90eXBlW2ZpbGVfZXhfY29kZXNbZmlsZV9leF9jb2RlXV0gPSBmaWxlX2V4X2NvZGUgKyAxO1xuXHRcdH1cblx0XHQvLyBQb2x5ZmlsbCBVUkxcblx0XHRpZiAoIXJlYWxfVVJMLmNyZWF0ZU9iamVjdFVSTCkge1xuXHRcdFx0VVJMID0gdmlldy5VUkwgPSBmdW5jdGlvbih1cmkpIHtcblx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0ICB1cmlfaW5mbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIiwgXCJhXCIpXG5cdFx0XHRcdFx0LCB1cmlfb3JpZ2luXG5cdFx0XHRcdDtcblx0XHRcdFx0dXJpX2luZm8uaHJlZiA9IHVyaTtcblx0XHRcdFx0aWYgKCEoXCJvcmlnaW5cIiBpbiB1cmlfaW5mbykpIHtcblx0XHRcdFx0XHRpZiAodXJpX2luZm8ucHJvdG9jb2wudG9Mb3dlckNhc2UoKSA9PT0gXCJkYXRhOlwiKSB7XG5cdFx0XHRcdFx0XHR1cmlfaW5mby5vcmlnaW4gPSBudWxsO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR1cmlfb3JpZ2luID0gdXJpLm1hdGNoKG9yaWdpbik7XG5cdFx0XHRcdFx0XHR1cmlfaW5mby5vcmlnaW4gPSB1cmlfb3JpZ2luICYmIHVyaV9vcmlnaW5bMV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB1cmlfaW5mbztcblx0XHRcdH07XG5cdFx0fVxuXHRcdFVSTC5jcmVhdGVPYmplY3RVUkwgPSBmdW5jdGlvbihibG9iKSB7XG5cdFx0XHR2YXJcblx0XHRcdFx0ICB0eXBlID0gYmxvYi50eXBlXG5cdFx0XHRcdCwgZGF0YV9VUklfaGVhZGVyXG5cdFx0XHQ7XG5cdFx0XHRpZiAodHlwZSA9PT0gbnVsbCkge1xuXHRcdFx0XHR0eXBlID0gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcblx0XHRcdH1cblx0XHRcdGlmIChibG9iIGluc3RhbmNlb2YgRmFrZUJsb2IpIHtcblx0XHRcdFx0ZGF0YV9VUklfaGVhZGVyID0gXCJkYXRhOlwiICsgdHlwZTtcblx0XHRcdFx0aWYgKGJsb2IuZW5jb2RpbmcgPT09IFwiYmFzZTY0XCIpIHtcblx0XHRcdFx0XHRyZXR1cm4gZGF0YV9VUklfaGVhZGVyICsgXCI7YmFzZTY0LFwiICsgYmxvYi5kYXRhO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGJsb2IuZW5jb2RpbmcgPT09IFwiVVJJXCIpIHtcblx0XHRcdFx0XHRyZXR1cm4gZGF0YV9VUklfaGVhZGVyICsgXCIsXCIgKyBkZWNvZGVVUklDb21wb25lbnQoYmxvYi5kYXRhKTtcblx0XHRcdFx0fSBpZiAoYnRvYSkge1xuXHRcdFx0XHRcdHJldHVybiBkYXRhX1VSSV9oZWFkZXIgKyBcIjtiYXNlNjQsXCIgKyBidG9hKGJsb2IuZGF0YSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGFfVVJJX2hlYWRlciArIFwiLFwiICsgZW5jb2RlVVJJQ29tcG9uZW50KGJsb2IuZGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAocmVhbF9jcmVhdGVfb2JqZWN0X1VSTCkge1xuXHRcdFx0XHRyZXR1cm4gcmVhbF9jcmVhdGVfb2JqZWN0X1VSTC5jYWxsKHJlYWxfVVJMLCBibG9iKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdFVSTC5yZXZva2VPYmplY3RVUkwgPSBmdW5jdGlvbihvYmplY3RfVVJMKSB7XG5cdFx0XHRpZiAob2JqZWN0X1VSTC5zdWJzdHJpbmcoMCwgNSkgIT09IFwiZGF0YTpcIiAmJiByZWFsX3Jldm9rZV9vYmplY3RfVVJMKSB7XG5cdFx0XHRcdHJlYWxfcmV2b2tlX29iamVjdF9VUkwuY2FsbChyZWFsX1VSTCwgb2JqZWN0X1VSTCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRGQkJfcHJvdG8uYXBwZW5kID0gZnVuY3Rpb24oZGF0YS8qLCBlbmRpbmdzKi8pIHtcblx0XHRcdHZhciBiYiA9IHRoaXMuZGF0YTtcblx0XHRcdC8vIGRlY29kZSBkYXRhIHRvIGEgYmluYXJ5IHN0cmluZ1xuXHRcdFx0aWYgKFVpbnQ4QXJyYXkgJiYgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkpIHtcblx0XHRcdFx0dmFyXG5cdFx0XHRcdFx0ICBzdHIgPSBcIlwiXG5cdFx0XHRcdFx0LCBidWYgPSBuZXcgVWludDhBcnJheShkYXRhKVxuXHRcdFx0XHRcdCwgaSA9IDBcblx0XHRcdFx0XHQsIGJ1Zl9sZW4gPSBidWYubGVuZ3RoXG5cdFx0XHRcdDtcblx0XHRcdFx0Zm9yICg7IGkgPCBidWZfbGVuOyBpKyspIHtcblx0XHRcdFx0XHRzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJiLnB1c2goc3RyKTtcblx0XHRcdH0gZWxzZSBpZiAoZ2V0X2NsYXNzKGRhdGEpID09PSBcIkJsb2JcIiB8fCBnZXRfY2xhc3MoZGF0YSkgPT09IFwiRmlsZVwiKSB7XG5cdFx0XHRcdGlmIChGaWxlUmVhZGVyU3luYykge1xuXHRcdFx0XHRcdHZhciBmciA9IG5ldyBGaWxlUmVhZGVyU3luYztcblx0XHRcdFx0XHRiYi5wdXNoKGZyLnJlYWRBc0JpbmFyeVN0cmluZyhkYXRhKSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gYXN5bmMgRmlsZVJlYWRlciB3b24ndCB3b3JrIGFzIEJsb2JCdWlsZGVyIGlzIHN5bmNcblx0XHRcdFx0XHR0aHJvdyBuZXcgRmlsZUV4Y2VwdGlvbihcIk5PVF9SRUFEQUJMRV9FUlJcIik7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIEZha2VCbG9iKSB7XG5cdFx0XHRcdGlmIChkYXRhLmVuY29kaW5nID09PSBcImJhc2U2NFwiICYmIGF0b2IpIHtcblx0XHRcdFx0XHRiYi5wdXNoKGF0b2IoZGF0YS5kYXRhKSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoZGF0YS5lbmNvZGluZyA9PT0gXCJVUklcIikge1xuXHRcdFx0XHRcdGJiLnB1c2goZGVjb2RlVVJJQ29tcG9uZW50KGRhdGEuZGF0YSkpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGRhdGEuZW5jb2RpbmcgPT09IFwicmF3XCIpIHtcblx0XHRcdFx0XHRiYi5wdXNoKGRhdGEuZGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgZGF0YSAhPT0gXCJzdHJpbmdcIikge1xuXHRcdFx0XHRcdGRhdGEgKz0gXCJcIjsgLy8gY29udmVydCB1bnN1cHBvcnRlZCB0eXBlcyB0byBzdHJpbmdzXG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gZGVjb2RlIFVURi0xNiB0byBiaW5hcnkgc3RyaW5nXG5cdFx0XHRcdGJiLnB1c2godW5lc2NhcGUoZW5jb2RlVVJJQ29tcG9uZW50KGRhdGEpKSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRGQkJfcHJvdG8uZ2V0QmxvYiA9IGZ1bmN0aW9uKHR5cGUpIHtcblx0XHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdFx0XHR0eXBlID0gbnVsbDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBuZXcgRmFrZUJsb2IodGhpcy5kYXRhLmpvaW4oXCJcIiksIHR5cGUsIFwicmF3XCIpO1xuXHRcdH07XG5cdFx0RkJCX3Byb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gXCJbb2JqZWN0IEJsb2JCdWlsZGVyXVwiO1xuXHRcdH07XG5cdFx0RkJfcHJvdG8uc2xpY2UgPSBmdW5jdGlvbihzdGFydCwgZW5kLCB0eXBlKSB7XG5cdFx0XHR2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cdFx0XHRpZiAoYXJncyA8IDMpIHtcblx0XHRcdFx0dHlwZSA9IG51bGw7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbmV3IEZha2VCbG9iKFxuXHRcdFx0XHQgIHRoaXMuZGF0YS5zbGljZShzdGFydCwgYXJncyA+IDEgPyBlbmQgOiB0aGlzLmRhdGEubGVuZ3RoKVxuXHRcdFx0XHQsIHR5cGVcblx0XHRcdFx0LCB0aGlzLmVuY29kaW5nXG5cdFx0XHQpO1xuXHRcdH07XG5cdFx0RkJfcHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBcIltvYmplY3QgQmxvYl1cIjtcblx0XHR9O1xuXHRcdEZCX3Byb3RvLmNsb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLnNpemUgPSAwO1xuXHRcdFx0ZGVsZXRlIHRoaXMuZGF0YTtcblx0XHR9O1xuXHRcdHJldHVybiBGYWtlQmxvYkJ1aWxkZXI7XG5cdH0odmlldykpO1xuXG5cdHZpZXcuQmxvYiA9IGZ1bmN0aW9uKGJsb2JQYXJ0cywgb3B0aW9ucykge1xuXHRcdHZhciB0eXBlID0gb3B0aW9ucyA/IChvcHRpb25zLnR5cGUgfHwgXCJcIikgOiBcIlwiO1xuXHRcdHZhciBidWlsZGVyID0gbmV3IEJsb2JCdWlsZGVyKCk7XG5cdFx0aWYgKGJsb2JQYXJ0cykge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGxlbiA9IGJsb2JQYXJ0cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRpZiAoVWludDhBcnJheSAmJiBibG9iUGFydHNbaV0gaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG5cdFx0XHRcdFx0YnVpbGRlci5hcHBlbmQoYmxvYlBhcnRzW2ldLmJ1ZmZlcik7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0YnVpbGRlci5hcHBlbmQoYmxvYlBhcnRzW2ldKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHR2YXIgYmxvYiA9IGJ1aWxkZXIuZ2V0QmxvYih0eXBlKTtcblx0XHRpZiAoIWJsb2Iuc2xpY2UgJiYgYmxvYi53ZWJraXRTbGljZSkge1xuXHRcdFx0YmxvYi5zbGljZSA9IGJsb2Iud2Via2l0U2xpY2U7XG5cdFx0fVxuXHRcdHJldHVybiBibG9iO1xuXHR9O1xuXG5cdHZhciBnZXRQcm90b3R5cGVPZiA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRyZXR1cm4gb2JqZWN0Ll9fcHJvdG9fXztcblx0fTtcblx0dmlldy5CbG9iLnByb3RvdHlwZSA9IGdldFByb3RvdHlwZU9mKG5ldyB2aWV3LkJsb2IoKSk7XG59KHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiICYmIHNlbGYgfHwgdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cgfHwgdGhpcy5jb250ZW50IHx8IHRoaXMpKTtcbiIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuXG52YXIgS19NQVhfTEVOR1RIID0gMHg3ZmZmZmZmZlxuZXhwb3J0cy5rTWF4TGVuZ3RoID0gS19NQVhfTEVOR1RIXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFByaW50IHdhcm5pbmcgYW5kIHJlY29tbWVuZCB1c2luZyBgYnVmZmVyYCB2NC54IHdoaWNoIGhhcyBhbiBPYmplY3RcbiAqICAgICAgICAgICAgICAgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIFdlIHJlcG9ydCB0aGF0IHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGlmIHRoZSBhcmUgbm90IHN1YmNsYXNzYWJsZVxuICogdXNpbmcgX19wcm90b19fLiBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YFxuICogKFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4KS4gSUUgMTAgbGFja3Mgc3VwcG9ydFxuICogZm9yIF9fcHJvdG9fXyBhbmQgaGFzIGEgYnVnZ3kgdHlwZWQgYXJyYXkgaW1wbGVtZW50YXRpb24uXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gdHlwZWRBcnJheVN1cHBvcnQoKVxuXG5pZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gIGNvbnNvbGUuZXJyb3IoXG4gICAgJ1RoaXMgYnJvd3NlciBsYWNrcyB0eXBlZCBhcnJheSAoVWludDhBcnJheSkgc3VwcG9ydCB3aGljaCBpcyByZXF1aXJlZCBieSAnICtcbiAgICAnYGJ1ZmZlcmAgdjUueC4gVXNlIGBidWZmZXJgIHY0LnggaWYgeW91IHJlcXVpcmUgb2xkIGJyb3dzZXIgc3VwcG9ydC4nXG4gIClcbn1cblxuZnVuY3Rpb24gdHlwZWRBcnJheVN1cHBvcnQgKCkge1xuICAvLyBDYW4gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWQ/XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLl9fcHJvdG9fXyA9IHsgX19wcm90b19fOiBVaW50OEFycmF5LnByb3RvdHlwZSwgZm9vOiBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9IH1cbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MlxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdwYXJlbnQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHRoaXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyXG4gIH1cbn0pXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAnb2Zmc2V0Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ5dGVPZmZzZXRcbiAgfVxufSlcblxuZnVuY3Rpb24gY3JlYXRlQnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKGxlbmd0aCA+IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgbGVuZ3RoICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGxlbmd0aClcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG4vKipcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgaGF2ZSB0aGVpclxuICogcHJvdG90eXBlIGNoYW5nZWQgdG8gYEJ1ZmZlci5wcm90b3R5cGVgLiBGdXJ0aGVybW9yZSwgYEJ1ZmZlcmAgaXMgYSBzdWJjbGFzcyBvZlxuICogYFVpbnQ4QXJyYXlgLCBzbyB0aGUgcmV0dXJuZWQgaW5zdGFuY2VzIHdpbGwgaGF2ZSBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgbWV0aG9kc1xuICogYW5kIHRoZSBgVWludDhBcnJheWAgbWV0aG9kcy4gU3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXRcbiAqIHJldHVybnMgYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogVGhlIGBVaW50OEFycmF5YCBwcm90b3R5cGUgcmVtYWlucyB1bm1vZGlmaWVkLlxuICovXG5cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIGlmICh0eXBlb2YgZW5jb2RpbmdPck9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGFsbG9jVW5zYWZlKGFyZylcbiAgfVxuICByZXR1cm4gZnJvbShhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gRml4IHN1YmFycmF5KCkgaW4gRVMyMDE2LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvOTdcbmlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wuc3BlY2llcyAhPSBudWxsICYmXG4gICAgQnVmZmVyW1N5bWJvbC5zcGVjaWVzXSA9PT0gQnVmZmVyKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIsIFN5bWJvbC5zcGVjaWVzLCB7XG4gICAgdmFsdWU6IG51bGwsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KVxufVxuXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxuZnVuY3Rpb24gZnJvbSAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0KVxuICB9XG5cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZSh2YWx1ZSlcbiAgfVxuXG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICAgIClcbiAgfVxuXG4gIGlmIChpc0luc3RhbmNlKHZhbHVlLCBBcnJheUJ1ZmZlcikgfHxcbiAgICAgICh2YWx1ZSAmJiBpc0luc3RhbmNlKHZhbHVlLmJ1ZmZlciwgQXJyYXlCdWZmZXIpKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIG9mIHR5cGUgbnVtYmVyLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICApXG4gIH1cblxuICB2YXIgdmFsdWVPZiA9IHZhbHVlLnZhbHVlT2YgJiYgdmFsdWUudmFsdWVPZigpXG4gIGlmICh2YWx1ZU9mICE9IG51bGwgJiYgdmFsdWVPZiAhPT0gdmFsdWUpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20odmFsdWVPZiwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgdmFyIGIgPSBmcm9tT2JqZWN0KHZhbHVlKVxuICBpZiAoYikgcmV0dXJuIGJcblxuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvUHJpbWl0aXZlICE9IG51bGwgJiZcbiAgICAgIHR5cGVvZiB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFxuICAgICAgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSgnc3RyaW5nJyksIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aFxuICAgIClcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgKVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIEJ1ZmZlcihhcmcsIGVuY29kaW5nKSBidXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gKiBpZiB2YWx1ZSBpcyBhIG51bWJlci5cbiAqIEJ1ZmZlci5mcm9tKHN0clssIGVuY29kaW5nXSlcbiAqIEJ1ZmZlci5mcm9tKGFycmF5KVxuICogQnVmZmVyLmZyb20oYnVmZmVyKVxuICogQnVmZmVyLmZyb20oYXJyYXlCdWZmZXJbLCBieXRlT2Zmc2V0WywgbGVuZ3RoXV0pXG4gKiovXG5CdWZmZXIuZnJvbSA9IGZ1bmN0aW9uICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBmcm9tKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIE5vdGU6IENoYW5nZSBwcm90b3R5cGUgKmFmdGVyKiBCdWZmZXIuZnJvbSBpcyBkZWZpbmVkIHRvIHdvcmthcm91bmQgQ2hyb21lIGJ1Zzpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvMTQ4XG5CdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG5CdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxuXG5mdW5jdGlvbiBhc3NlcnRTaXplIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyJylcbiAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgc2l6ZSArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIGlmIChzaXplIDw9IDApIHtcbiAgICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG4gIH1cbiAgaWYgKGZpbGwgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9ubHkgcGF5IGF0dGVudGlvbiB0byBlbmNvZGluZyBpZiBpdCdzIGEgc3RyaW5nLiBUaGlzXG4gICAgLy8gcHJldmVudHMgYWNjaWRlbnRhbGx5IHNlbmRpbmcgaW4gYSBudW1iZXIgdGhhdCB3b3VsZFxuICAgIC8vIGJlIGludGVycHJldHRlZCBhcyBhIHN0YXJ0IG9mZnNldC5cbiAgICByZXR1cm4gdHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJ1xuICAgICAgPyBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsLCBlbmNvZGluZylcbiAgICAgIDogY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbClcbiAgfVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmaWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogYWxsb2Moc2l6ZVssIGZpbGxbLCBlbmNvZGluZ11dKVxuICoqL1xuQnVmZmVyLmFsbG9jID0gZnVuY3Rpb24gKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIHJldHVybiBhbGxvYyhzaXplLCBmaWxsLCBlbmNvZGluZylcbn1cblxuZnVuY3Rpb24gYWxsb2NVbnNhZmUgKHNpemUpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUgPCAwID8gMCA6IGNoZWNrZWQoc2l6ZSkgfCAwKVxufVxuXG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gQnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gU2xvd0J1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICovXG5CdWZmZXIuYWxsb2NVbnNhZmVTbG93ID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgfVxuXG4gIGlmICghQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICB9XG5cbiAgdmFyIGxlbmd0aCA9IGJ5dGVMZW5ndGgoc3RyaW5nLCBlbmNvZGluZykgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuXG4gIHZhciBhY3R1YWwgPSBidWYud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcblxuICBpZiAoYWN0dWFsICE9PSBsZW5ndGgpIHtcbiAgICAvLyBXcml0aW5nIGEgaGV4IHN0cmluZywgZm9yIGV4YW1wbGUsIHRoYXQgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzIHdpbGxcbiAgICAvLyBjYXVzZSBldmVyeXRoaW5nIGFmdGVyIHRoZSBmaXJzdCBpbnZhbGlkIGNoYXJhY3RlciB0byBiZSBpZ25vcmVkLiAoZS5nLlxuICAgIC8vICdhYnh4Y2QnIHdpbGwgYmUgdHJlYXRlZCBhcyAnYWInKVxuICAgIGJ1ZiA9IGJ1Zi5zbGljZSgwLCBhY3R1YWwpXG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGggPCAwID8gMCA6IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBidWZbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyIChhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmIChieXRlT2Zmc2V0IDwgMCB8fCBhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcIm9mZnNldFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQgKyAobGVuZ3RoIHx8IDApKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wibGVuZ3RoXCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIHZhciBidWZcbiAgaWYgKGJ5dGVPZmZzZXQgPT09IHVuZGVmaW5lZCAmJiBsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5KVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAob2JqKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqKSkge1xuICAgIHZhciBsZW4gPSBjaGVja2VkKG9iai5sZW5ndGgpIHwgMFxuICAgIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuKVxuXG4gICAgaWYgKGJ1Zi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBidWZcbiAgICB9XG5cbiAgICBvYmouY29weShidWYsIDAsIDAsIGxlbilcbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICBpZiAob2JqLmxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBvYmoubGVuZ3RoICE9PSAnbnVtYmVyJyB8fCBudW1iZXJJc05hTihvYmoubGVuZ3RoKSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcigwKVxuICAgIH1cbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmopXG4gIH1cblxuICBpZiAob2JqLnR5cGUgPT09ICdCdWZmZXInICYmIEFycmF5LmlzQXJyYXkob2JqLmRhdGEpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqLmRhdGEpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IEtfTUFYX0xFTkdUSGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsgS19NQVhfTEVOR1RILnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAoK2xlbmd0aCAhPSBsZW5ndGgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICBsZW5ndGggPSAwXG4gIH1cbiAgcmV0dXJuIEJ1ZmZlci5hbGxvYygrbGVuZ3RoKVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyID09PSB0cnVlICYmXG4gICAgYiAhPT0gQnVmZmVyLnByb3RvdHlwZSAvLyBzbyBCdWZmZXIuaXNCdWZmZXIoQnVmZmVyLnByb3RvdHlwZSkgd2lsbCBiZSBmYWxzZVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKGlzSW5zdGFuY2UoYSwgVWludDhBcnJheSkpIGEgPSBCdWZmZXIuZnJvbShhLCBhLm9mZnNldCwgYS5ieXRlTGVuZ3RoKVxuICBpZiAoaXNJbnN0YW5jZShiLCBVaW50OEFycmF5KSkgYiA9IEJ1ZmZlci5mcm9tKGIsIGIub2Zmc2V0LCBiLmJ5dGVMZW5ndGgpXG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcImJ1ZjFcIiwgXCJidWYyXCIgYXJndW1lbnRzIG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXknXG4gICAgKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV1cbiAgICAgIHkgPSBiW2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdsYXRpbjEnOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShsaXN0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gIH1cblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gQnVmZmVyLmFsbG9jKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgIHZhciBidWYgPSBsaXN0W2ldXG4gICAgaWYgKGlzSW5zdGFuY2UoYnVmLCBVaW50OEFycmF5KSkge1xuICAgICAgYnVmID0gQnVmZmVyLmZyb20oYnVmKVxuICAgIH1cbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICAgIH1cbiAgICBidWYuY29weShidWZmZXIsIHBvcylcbiAgICBwb3MgKz0gYnVmLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZmZXJcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN0cmluZykpIHtcbiAgICByZXR1cm4gc3RyaW5nLmxlbmd0aFxuICB9XG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoc3RyaW5nKSB8fCBpc0luc3RhbmNlKHN0cmluZywgQXJyYXlCdWZmZXIpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5ieXRlTGVuZ3RoXG4gIH1cbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBvciBBcnJheUJ1ZmZlci4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIHN0cmluZ1xuICAgIClcbiAgfVxuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBtdXN0TWF0Y2ggPSAoYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdID09PSB0cnVlKVxuICBpZiAoIW11c3RNYXRjaCAmJiBsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHtcbiAgICAgICAgICByZXR1cm4gbXVzdE1hdGNoID8gLTEgOiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICB9XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIC8vIE5vIG5lZWQgdG8gdmVyaWZ5IHRoYXQgXCJ0aGlzLmxlbmd0aCA8PSBNQVhfVUlOVDMyXCIgc2luY2UgaXQncyBhIHJlYWQtb25seVxuICAvLyBwcm9wZXJ0eSBvZiBhIHR5cGVkIGFycmF5LlxuXG4gIC8vIFRoaXMgYmVoYXZlcyBuZWl0aGVyIGxpa2UgU3RyaW5nIG5vciBVaW50OEFycmF5IGluIHRoYXQgd2Ugc2V0IHN0YXJ0L2VuZFxuICAvLyB0byB0aGVpciB1cHBlci9sb3dlciBib3VuZHMgaWYgdGhlIHZhbHVlIHBhc3NlZCBpcyBvdXQgb2YgcmFuZ2UuXG4gIC8vIHVuZGVmaW5lZCBpcyBoYW5kbGVkIHNwZWNpYWxseSBhcyBwZXIgRUNNQS0yNjIgNnRoIEVkaXRpb24sXG4gIC8vIFNlY3Rpb24gMTMuMy4zLjcgUnVudGltZSBTZW1hbnRpY3M6IEtleWVkQmluZGluZ0luaXRpYWxpemF0aW9uLlxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCB8fCBzdGFydCA8IDApIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICAvLyBSZXR1cm4gZWFybHkgaWYgc3RhcnQgPiB0aGlzLmxlbmd0aC4gRG9uZSBoZXJlIHRvIHByZXZlbnQgcG90ZW50aWFsIHVpbnQzMlxuICAvLyBjb2VyY2lvbiBmYWlsIGJlbG93LlxuICBpZiAoc3RhcnQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbmQgPD0gMCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgLy8gRm9yY2UgY29lcnNpb24gdG8gdWludDMyLiBUaGlzIHdpbGwgYWxzbyBjb2VyY2UgZmFsc2V5L05hTiB2YWx1ZXMgdG8gMC5cbiAgZW5kID4+Pj0gMFxuICBzdGFydCA+Pj49IDBcblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuLy8gVGhpcyBwcm9wZXJ0eSBpcyB1c2VkIGJ5IGBCdWZmZXIuaXNCdWZmZXJgIChhbmQgdGhlIGBpcy1idWZmZXJgIG5wbSBwYWNrYWdlKVxuLy8gdG8gZGV0ZWN0IGEgQnVmZmVyIGluc3RhbmNlLiBJdCdzIG5vdCBwb3NzaWJsZSB0byB1c2UgYGluc3RhbmNlb2YgQnVmZmVyYFxuLy8gcmVsaWFibHkgaW4gYSBicm93c2VyaWZ5IGNvbnRleHQgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBkaWZmZXJlbnRcbi8vIGNvcGllcyBvZiB0aGUgJ2J1ZmZlcicgcGFja2FnZSBpbiB1c2UuIFRoaXMgbWV0aG9kIHdvcmtzIGV2ZW4gZm9yIEJ1ZmZlclxuLy8gaW5zdGFuY2VzIHRoYXQgd2VyZSBjcmVhdGVkIGZyb20gYW5vdGhlciBjb3B5IG9mIHRoZSBgYnVmZmVyYCBwYWNrYWdlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTU0XG5CdWZmZXIucHJvdG90eXBlLl9pc0J1ZmZlciA9IHRydWVcblxuZnVuY3Rpb24gc3dhcCAoYiwgbiwgbSkge1xuICB2YXIgaSA9IGJbbl1cbiAgYltuXSA9IGJbbV1cbiAgYlttXSA9IGlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMTYgPSBmdW5jdGlvbiBzd2FwMTYgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDIgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDE2LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAxKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDMyID0gZnVuY3Rpb24gc3dhcDMyICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA0ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAzMi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgMilcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXA2NCA9IGZ1bmN0aW9uIHN3YXA2NCAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgOCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNjQtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gOCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDcpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDYpXG4gICAgc3dhcCh0aGlzLCBpICsgMiwgaSArIDUpXG4gICAgc3dhcCh0aGlzLCBpICsgMywgaSArIDQpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nID0gQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZ1xuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLnJlcGxhY2UoLyguezJ9KS9nLCAnJDEgJykudHJpbSgpXG4gIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAodGFyZ2V0LCBzdGFydCwgZW5kLCB0aGlzU3RhcnQsIHRoaXNFbmQpIHtcbiAgaWYgKGlzSW5zdGFuY2UodGFyZ2V0LCBVaW50OEFycmF5KSkge1xuICAgIHRhcmdldCA9IEJ1ZmZlci5mcm9tKHRhcmdldCwgdGFyZ2V0Lm9mZnNldCwgdGFyZ2V0LmJ5dGVMZW5ndGgpXG4gIH1cbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidGFyZ2V0XCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBCdWZmZXIgb3IgVWludDhBcnJheS4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB0YXJnZXQpXG4gICAgKVxuICB9XG5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICBpZiAoZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmQgPSB0YXJnZXQgPyB0YXJnZXQubGVuZ3RoIDogMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNTdGFydCA9IDBcbiAgfVxuICBpZiAodGhpc0VuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc0VuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoc3RhcnQgPCAwIHx8IGVuZCA+IHRhcmdldC5sZW5ndGggfHwgdGhpc1N0YXJ0IDwgMCB8fCB0aGlzRW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCAmJiBzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmIChzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgc3RhcnQgPj4+PSAwXG4gIGVuZCA+Pj49IDBcbiAgdGhpc1N0YXJ0ID4+Pj0gMFxuICB0aGlzRW5kID4+Pj0gMFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQpIHJldHVybiAwXG5cbiAgdmFyIHggPSB0aGlzRW5kIC0gdGhpc1N0YXJ0XG4gIHZhciB5ID0gZW5kIC0gc3RhcnRcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG5cbiAgdmFyIHRoaXNDb3B5ID0gdGhpcy5zbGljZSh0aGlzU3RhcnQsIHRoaXNFbmQpXG4gIHZhciB0YXJnZXRDb3B5ID0gdGFyZ2V0LnNsaWNlKHN0YXJ0LCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzQ29weVtpXSAhPT0gdGFyZ2V0Q29weVtpXSkge1xuICAgICAgeCA9IHRoaXNDb3B5W2ldXG4gICAgICB5ID0gdGFyZ2V0Q29weVtpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbi8vIEZpbmRzIGVpdGhlciB0aGUgZmlyc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0ID49IGBieXRlT2Zmc2V0YCxcbi8vIE9SIHRoZSBsYXN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA8PSBgYnl0ZU9mZnNldGAuXG4vL1xuLy8gQXJndW1lbnRzOlxuLy8gLSBidWZmZXIgLSBhIEJ1ZmZlciB0byBzZWFyY2hcbi8vIC0gdmFsIC0gYSBzdHJpbmcsIEJ1ZmZlciwgb3IgbnVtYmVyXG4vLyAtIGJ5dGVPZmZzZXQgLSBhbiBpbmRleCBpbnRvIGBidWZmZXJgOyB3aWxsIGJlIGNsYW1wZWQgdG8gYW4gaW50MzJcbi8vIC0gZW5jb2RpbmcgLSBhbiBvcHRpb25hbCBlbmNvZGluZywgcmVsZXZhbnQgaXMgdmFsIGlzIGEgc3RyaW5nXG4vLyAtIGRpciAtIHRydWUgZm9yIGluZGV4T2YsIGZhbHNlIGZvciBsYXN0SW5kZXhPZlxuZnVuY3Rpb24gYmlkaXJlY3Rpb25hbEluZGV4T2YgKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIC8vIEVtcHR5IGJ1ZmZlciBtZWFucyBubyBtYXRjaFxuICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXRcbiAgaWYgKHR5cGVvZiBieXRlT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldFxuICAgIGJ5dGVPZmZzZXQgPSAwXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIHtcbiAgICBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkge1xuICAgIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICB9XG4gIGJ5dGVPZmZzZXQgPSArYnl0ZU9mZnNldCAvLyBDb2VyY2UgdG8gTnVtYmVyLlxuICBpZiAobnVtYmVySXNOYU4oYnl0ZU9mZnNldCkpIHtcbiAgICAvLyBieXRlT2Zmc2V0OiBpdCBpdCdzIHVuZGVmaW5lZCwgbnVsbCwgTmFOLCBcImZvb1wiLCBldGMsIHNlYXJjaCB3aG9sZSBidWZmZXJcbiAgICBieXRlT2Zmc2V0ID0gZGlyID8gMCA6IChidWZmZXIubGVuZ3RoIC0gMSlcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0OiBuZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggKyBieXRlT2Zmc2V0XG4gIGlmIChieXRlT2Zmc2V0ID49IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICBpZiAoZGlyKSByZXR1cm4gLTFcbiAgICBlbHNlIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoIC0gMVxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAwKSB7XG4gICAgaWYgKGRpcikgYnl0ZU9mZnNldCA9IDBcbiAgICBlbHNlIHJldHVybiAtMVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIHZhbFxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWwgPSBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICB9XG5cbiAgLy8gRmluYWxseSwgc2VhcmNoIGVpdGhlciBpbmRleE9mIChpZiBkaXIgaXMgdHJ1ZSkgb3IgbGFzdEluZGV4T2ZcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcvYnVmZmVyIGFsd2F5cyBmYWlsc1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDB4RkYgLy8gU2VhcmNoIGZvciBhIGJ5dGUgdmFsdWUgWzAtMjU1XVxuICAgIGlmICh0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGRpcikge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCBbIHZhbCBdLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgaVxuICBpZiAoZGlyKSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPCBhcnJMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJlYWQoYXJyLCBpKSA9PT0gcmVhZCh2YWwsIGZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4KSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIGZvdW5kSW5kZXggKiBpbmRleFNpemVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ICE9PSAtMSkgaSAtPSBpIC0gZm91bmRJbmRleFxuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJ5dGVPZmZzZXQgKyB2YWxMZW5ndGggPiBhcnJMZW5ndGgpIGJ5dGVPZmZzZXQgPSBhcnJMZW5ndGggLSB2YWxMZW5ndGhcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIGZvdW5kID0gdHJ1ZVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWxMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAocmVhZChhcnIsIGkgKyBqKSAhPT0gcmVhZCh2YWwsIGopKSB7XG4gICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uIGluY2x1ZGVzICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIHRydWUpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiBsYXN0SW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAobnVtYmVySXNOYU4ocGFyc2VkKSkgcmV0dXJuIGlcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGxhdGluMVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggPj4+IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGxhdGluMVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyAoYnl0ZXNbaSArIDFdICogMjU2KSlcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmID0gdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBuZXdCdWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYnVmZmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1widmFsdWVcIiBhcmd1bWVudCBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpIC0gMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgc2hvdWxkIGJlIGEgQnVmZmVyJylcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgdHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmNvcHlXaXRoaW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBVc2UgYnVpbHQtaW4gd2hlbiBhdmFpbGFibGUsIG1pc3NpbmcgZnJvbSBJRTExXG4gICAgdGhpcy5jb3B5V2l0aGluKHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKVxuICB9IGVsc2UgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yICh2YXIgaSA9IGxlbiAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoKGVuY29kaW5nID09PSAndXRmOCcgJiYgY29kZSA8IDEyOCkgfHxcbiAgICAgICAgICBlbmNvZGluZyA9PT0gJ2xhdGluMScpIHtcbiAgICAgICAgLy8gRmFzdCBwYXRoOiBJZiBgdmFsYCBmaXRzIGludG8gYSBzaW5nbGUgYnl0ZSwgdXNlIHRoYXQgbnVtZXJpYyB2YWx1ZS5cbiAgICAgICAgdmFsID0gY29kZVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDI1NVxuICB9XG5cbiAgLy8gSW52YWxpZCByYW5nZXMgYXJlIG5vdCBzZXQgdG8gYSBkZWZhdWx0LCBzbyBjYW4gcmFuZ2UgY2hlY2sgZWFybHkuXG4gIGlmIChzdGFydCA8IDAgfHwgdGhpcy5sZW5ndGggPCBzdGFydCB8fCB0aGlzLmxlbmd0aCA8IGVuZCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdPdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzdGFydCA9IHN0YXJ0ID4+PiAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gdGhpcy5sZW5ndGggOiBlbmQgPj4+IDBcblxuICBpZiAoIXZhbCkgdmFsID0gMFxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICAgIHRoaXNbaV0gPSB2YWxcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gQnVmZmVyLmlzQnVmZmVyKHZhbClcbiAgICAgID8gdmFsXG4gICAgICA6IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyB2YWwgK1xuICAgICAgICAnXCIgaXMgaW52YWxpZCBmb3IgYXJndW1lbnQgXCJ2YWx1ZVwiJylcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGVuZCAtIHN0YXJ0OyArK2kpIHtcbiAgICAgIHRoaXNbaSArIHN0YXJ0XSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSB0YWtlcyBlcXVhbCBzaWducyBhcyBlbmQgb2YgdGhlIEJhc2U2NCBlbmNvZGluZ1xuICBzdHIgPSBzdHIuc3BsaXQoJz0nKVswXVxuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyLnRyaW0oKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbi8vIEFycmF5QnVmZmVyIG9yIFVpbnQ4QXJyYXkgb2JqZWN0cyBmcm9tIG90aGVyIGNvbnRleHRzIChpLmUuIGlmcmFtZXMpIGRvIG5vdCBwYXNzXG4vLyB0aGUgYGluc3RhbmNlb2ZgIGNoZWNrIGJ1dCB0aGV5IHNob3VsZCBiZSB0cmVhdGVkIGFzIG9mIHRoYXQgdHlwZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE2NlxuZnVuY3Rpb24gaXNJbnN0YW5jZSAob2JqLCB0eXBlKSB7XG4gIHJldHVybiBvYmogaW5zdGFuY2VvZiB0eXBlIHx8XG4gICAgKG9iaiAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3RvciAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lICE9IG51bGwgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSB0eXBlLm5hbWUpXG59XG5mdW5jdGlvbiBudW1iZXJJc05hTiAob2JqKSB7XG4gIC8vIEZvciBJRTExIHN1cHBvcnRcbiAgcmV0dXJuIG9iaiAhPT0gb2JqIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG4iLCIvKiBGaWxlU2F2ZXIuanNcbiAqIEEgc2F2ZUFzKCkgRmlsZVNhdmVyIGltcGxlbWVudGF0aW9uLlxuICogMS4zLjJcbiAqIDIwMTYtMDYtMTYgMTg6MjU6MTlcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBMaWNlbnNlOiBNSVRcbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L0ZpbGVTYXZlci5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiAqL1xuLypqc2xpbnQgYml0d2lzZTogdHJ1ZSwgaW5kZW50OiA0LCBsYXhicmVhazogdHJ1ZSwgbGF4Y29tbWE6IHRydWUsIHNtYXJ0dGFiczogdHJ1ZSwgcGx1c3BsdXM6IHRydWUgKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL0ZpbGVTYXZlci5qcy9ibG9iL21hc3Rlci9GaWxlU2F2ZXIuanMgKi9cblxudmFyIHNhdmVBcyA9IHNhdmVBcyB8fCAoZnVuY3Rpb24odmlldykge1xuXHRcInVzZSBzdHJpY3RcIjtcblx0Ly8gSUUgPDEwIGlzIGV4cGxpY2l0bHkgdW5zdXBwb3J0ZWRcblx0aWYgKHR5cGVvZiB2aWV3ID09PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiYgL01TSUUgWzEtOV1cXC4vLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyXG5cdFx0ICBkb2MgPSB2aWV3LmRvY3VtZW50XG5cdFx0ICAvLyBvbmx5IGdldCBVUkwgd2hlbiBuZWNlc3NhcnkgaW4gY2FzZSBCbG9iLmpzIGhhc24ndCBvdmVycmlkZGVuIGl0IHlldFxuXHRcdCwgZ2V0X1VSTCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHZpZXcuVVJMIHx8IHZpZXcud2Via2l0VVJMIHx8IHZpZXc7XG5cdFx0fVxuXHRcdCwgc2F2ZV9saW5rID0gZG9jLmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIiwgXCJhXCIpXG5cdFx0LCBjYW5fdXNlX3NhdmVfbGluayA9IFwiZG93bmxvYWRcIiBpbiBzYXZlX2xpbmtcblx0XHQsIGNsaWNrID0gZnVuY3Rpb24obm9kZSkge1xuXHRcdFx0dmFyIGV2ZW50ID0gbmV3IE1vdXNlRXZlbnQoXCJjbGlja1wiKTtcblx0XHRcdG5vZGUuZGlzcGF0Y2hFdmVudChldmVudCk7XG5cdFx0fVxuXHRcdCwgaXNfc2FmYXJpID0gL2NvbnN0cnVjdG9yL2kudGVzdCh2aWV3LkhUTUxFbGVtZW50KSB8fCB2aWV3LnNhZmFyaVxuXHRcdCwgaXNfY2hyb21lX2lvcyA9L0NyaU9TXFwvW1xcZF0rLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpXG5cdFx0LCB0aHJvd19vdXRzaWRlID0gZnVuY3Rpb24oZXgpIHtcblx0XHRcdCh2aWV3LnNldEltbWVkaWF0ZSB8fCB2aWV3LnNldFRpbWVvdXQpKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aHJvdyBleDtcblx0XHRcdH0sIDApO1xuXHRcdH1cblx0XHQsIGZvcmNlX3NhdmVhYmxlX3R5cGUgPSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiXG5cdFx0Ly8gdGhlIEJsb2IgQVBJIGlzIGZ1bmRhbWVudGFsbHkgYnJva2VuIGFzIHRoZXJlIGlzIG5vIFwiZG93bmxvYWRmaW5pc2hlZFwiIGV2ZW50IHRvIHN1YnNjcmliZSB0b1xuXHRcdCwgYXJiaXRyYXJ5X3Jldm9rZV90aW1lb3V0ID0gMTAwMCAqIDQwIC8vIGluIG1zXG5cdFx0LCByZXZva2UgPSBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHR2YXIgcmV2b2tlciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAodHlwZW9mIGZpbGUgPT09IFwic3RyaW5nXCIpIHsgLy8gZmlsZSBpcyBhbiBvYmplY3QgVVJMXG5cdFx0XHRcdFx0Z2V0X1VSTCgpLnJldm9rZU9iamVjdFVSTChmaWxlKTtcblx0XHRcdFx0fSBlbHNlIHsgLy8gZmlsZSBpcyBhIEZpbGVcblx0XHRcdFx0XHRmaWxlLnJlbW92ZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdFx0c2V0VGltZW91dChyZXZva2VyLCBhcmJpdHJhcnlfcmV2b2tlX3RpbWVvdXQpO1xuXHRcdH1cblx0XHQsIGRpc3BhdGNoID0gZnVuY3Rpb24oZmlsZXNhdmVyLCBldmVudF90eXBlcywgZXZlbnQpIHtcblx0XHRcdGV2ZW50X3R5cGVzID0gW10uY29uY2F0KGV2ZW50X3R5cGVzKTtcblx0XHRcdHZhciBpID0gZXZlbnRfdHlwZXMubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHR2YXIgbGlzdGVuZXIgPSBmaWxlc2F2ZXJbXCJvblwiICsgZXZlbnRfdHlwZXNbaV1dO1xuXHRcdFx0XHRpZiAodHlwZW9mIGxpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0bGlzdGVuZXIuY2FsbChmaWxlc2F2ZXIsIGV2ZW50IHx8IGZpbGVzYXZlcik7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZXgpIHtcblx0XHRcdFx0XHRcdHRocm93X291dHNpZGUoZXgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHQsIGF1dG9fYm9tID0gZnVuY3Rpb24oYmxvYikge1xuXHRcdFx0Ly8gcHJlcGVuZCBCT00gZm9yIFVURi04IFhNTCBhbmQgdGV4dC8qIHR5cGVzIChpbmNsdWRpbmcgSFRNTClcblx0XHRcdC8vIG5vdGU6IHlvdXIgYnJvd3NlciB3aWxsIGF1dG9tYXRpY2FsbHkgY29udmVydCBVVEYtMTYgVStGRUZGIHRvIEVGIEJCIEJGXG5cdFx0XHRpZiAoL15cXHMqKD86dGV4dFxcL1xcUyp8YXBwbGljYXRpb25cXC94bWx8XFxTKlxcL1xcUypcXCt4bWwpXFxzKjsuKmNoYXJzZXRcXHMqPVxccyp1dGYtOC9pLnRlc3QoYmxvYi50eXBlKSkge1xuXHRcdFx0XHRyZXR1cm4gbmV3IEJsb2IoW1N0cmluZy5mcm9tQ2hhckNvZGUoMHhGRUZGKSwgYmxvYl0sIHt0eXBlOiBibG9iLnR5cGV9KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBibG9iO1xuXHRcdH1cblx0XHQsIEZpbGVTYXZlciA9IGZ1bmN0aW9uKGJsb2IsIG5hbWUsIG5vX2F1dG9fYm9tKSB7XG5cdFx0XHRpZiAoIW5vX2F1dG9fYm9tKSB7XG5cdFx0XHRcdGJsb2IgPSBhdXRvX2JvbShibG9iKTtcblx0XHRcdH1cblx0XHRcdC8vIEZpcnN0IHRyeSBhLmRvd25sb2FkLCB0aGVuIHdlYiBmaWxlc3lzdGVtLCB0aGVuIG9iamVjdCBVUkxzXG5cdFx0XHR2YXJcblx0XHRcdFx0ICBmaWxlc2F2ZXIgPSB0aGlzXG5cdFx0XHRcdCwgdHlwZSA9IGJsb2IudHlwZVxuXHRcdFx0XHQsIGZvcmNlID0gdHlwZSA9PT0gZm9yY2Vfc2F2ZWFibGVfdHlwZVxuXHRcdFx0XHQsIG9iamVjdF91cmxcblx0XHRcdFx0LCBkaXNwYXRjaF9hbGwgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRkaXNwYXRjaChmaWxlc2F2ZXIsIFwid3JpdGVzdGFydCBwcm9ncmVzcyB3cml0ZSB3cml0ZWVuZFwiLnNwbGl0KFwiIFwiKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gb24gYW55IGZpbGVzeXMgZXJyb3JzIHJldmVydCB0byBzYXZpbmcgd2l0aCBvYmplY3QgVVJMc1xuXHRcdFx0XHQsIGZzX2Vycm9yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0aWYgKChpc19jaHJvbWVfaW9zIHx8IChmb3JjZSAmJiBpc19zYWZhcmkpKSAmJiB2aWV3LkZpbGVSZWFkZXIpIHtcblx0XHRcdFx0XHRcdC8vIFNhZmFyaSBkb2Vzbid0IGFsbG93IGRvd25sb2FkaW5nIG9mIGJsb2IgdXJsc1xuXHRcdFx0XHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdFx0XHRcdFx0XHRyZWFkZXIub25sb2FkZW5kID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdHZhciB1cmwgPSBpc19jaHJvbWVfaW9zID8gcmVhZGVyLnJlc3VsdCA6IHJlYWRlci5yZXN1bHQucmVwbGFjZSgvXmRhdGE6W147XSo7LywgJ2RhdGE6YXR0YWNobWVudC9maWxlOycpO1xuXHRcdFx0XHRcdFx0XHR2YXIgcG9wdXAgPSB2aWV3Lm9wZW4odXJsLCAnX2JsYW5rJyk7XG5cdFx0XHRcdFx0XHRcdGlmKCFwb3B1cCkgdmlldy5sb2NhdGlvbi5ocmVmID0gdXJsO1xuXHRcdFx0XHRcdFx0XHR1cmw9dW5kZWZpbmVkOyAvLyByZWxlYXNlIHJlZmVyZW5jZSBiZWZvcmUgZGlzcGF0Y2hpbmdcblx0XHRcdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuRE9ORTtcblx0XHRcdFx0XHRcdFx0ZGlzcGF0Y2hfYWxsKCk7XG5cdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0cmVhZGVyLnJlYWRBc0RhdGFVUkwoYmxvYik7XG5cdFx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5JTklUO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBkb24ndCBjcmVhdGUgbW9yZSBvYmplY3QgVVJMcyB0aGFuIG5lZWRlZFxuXHRcdFx0XHRcdGlmICghb2JqZWN0X3VybCkge1xuXHRcdFx0XHRcdFx0b2JqZWN0X3VybCA9IGdldF9VUkwoKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChmb3JjZSkge1xuXHRcdFx0XHRcdFx0dmlldy5sb2NhdGlvbi5ocmVmID0gb2JqZWN0X3VybDtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dmFyIG9wZW5lZCA9IHZpZXcub3BlbihvYmplY3RfdXJsLCBcIl9ibGFua1wiKTtcblx0XHRcdFx0XHRcdGlmICghb3BlbmVkKSB7XG5cdFx0XHRcdFx0XHRcdC8vIEFwcGxlIGRvZXMgbm90IGFsbG93IHdpbmRvdy5vcGVuLCBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL2xpYnJhcnkvc2FmYXJpL2RvY3VtZW50YXRpb24vVG9vbHMvQ29uY2VwdHVhbC9TYWZhcmlFeHRlbnNpb25HdWlkZS9Xb3JraW5nd2l0aFdpbmRvd3NhbmRUYWJzL1dvcmtpbmd3aXRoV2luZG93c2FuZFRhYnMuaHRtbFxuXHRcdFx0XHRcdFx0XHR2aWV3LmxvY2F0aW9uLmhyZWYgPSBvYmplY3RfdXJsO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdGRpc3BhdGNoX2FsbCgpO1xuXHRcdFx0XHRcdHJldm9rZShvYmplY3RfdXJsKTtcblx0XHRcdFx0fVxuXHRcdFx0O1xuXHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuSU5JVDtcblxuXHRcdFx0aWYgKGNhbl91c2Vfc2F2ZV9saW5rKSB7XG5cdFx0XHRcdG9iamVjdF91cmwgPSBnZXRfVVJMKCkuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHNhdmVfbGluay5ocmVmID0gb2JqZWN0X3VybDtcblx0XHRcdFx0XHRzYXZlX2xpbmsuZG93bmxvYWQgPSBuYW1lO1xuXHRcdFx0XHRcdGNsaWNrKHNhdmVfbGluayk7XG5cdFx0XHRcdFx0ZGlzcGF0Y2hfYWxsKCk7XG5cdFx0XHRcdFx0cmV2b2tlKG9iamVjdF91cmwpO1xuXHRcdFx0XHRcdGZpbGVzYXZlci5yZWFkeVN0YXRlID0gZmlsZXNhdmVyLkRPTkU7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGZzX2Vycm9yKCk7XG5cdFx0fVxuXHRcdCwgRlNfcHJvdG8gPSBGaWxlU2F2ZXIucHJvdG90eXBlXG5cdFx0LCBzYXZlQXMgPSBmdW5jdGlvbihibG9iLCBuYW1lLCBub19hdXRvX2JvbSkge1xuXHRcdFx0cmV0dXJuIG5ldyBGaWxlU2F2ZXIoYmxvYiwgbmFtZSB8fCBibG9iLm5hbWUgfHwgXCJkb3dubG9hZFwiLCBub19hdXRvX2JvbSk7XG5cdFx0fVxuXHQ7XG5cdC8vIElFIDEwKyAobmF0aXZlIHNhdmVBcylcblx0aWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiYgbmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oYmxvYiwgbmFtZSwgbm9fYXV0b19ib20pIHtcblx0XHRcdG5hbWUgPSBuYW1lIHx8IGJsb2IubmFtZSB8fCBcImRvd25sb2FkXCI7XG5cblx0XHRcdGlmICghbm9fYXV0b19ib20pIHtcblx0XHRcdFx0YmxvYiA9IGF1dG9fYm9tKGJsb2IpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKGJsb2IsIG5hbWUpO1xuXHRcdH07XG5cdH1cblxuXHRGU19wcm90by5hYm9ydCA9IGZ1bmN0aW9uKCl7fTtcblx0RlNfcHJvdG8ucmVhZHlTdGF0ZSA9IEZTX3Byb3RvLklOSVQgPSAwO1xuXHRGU19wcm90by5XUklUSU5HID0gMTtcblx0RlNfcHJvdG8uRE9ORSA9IDI7XG5cblx0RlNfcHJvdG8uZXJyb3IgPVxuXHRGU19wcm90by5vbndyaXRlc3RhcnQgPVxuXHRGU19wcm90by5vbnByb2dyZXNzID1cblx0RlNfcHJvdG8ub253cml0ZSA9XG5cdEZTX3Byb3RvLm9uYWJvcnQgPVxuXHRGU19wcm90by5vbmVycm9yID1cblx0RlNfcHJvdG8ub253cml0ZWVuZCA9XG5cdFx0bnVsbDtcblxuXHRyZXR1cm4gc2F2ZUFzO1xufShcblx0ICAgdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgJiYgc2VsZlxuXHR8fCB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvd1xuXHR8fCB0aGlzLmNvbnRlbnRcbikpO1xuLy8gYHNlbGZgIGlzIHVuZGVmaW5lZCBpbiBGaXJlZm94IGZvciBBbmRyb2lkIGNvbnRlbnQgc2NyaXB0IGNvbnRleHRcbi8vIHdoaWxlIGB0aGlzYCBpcyBuc0lDb250ZW50RnJhbWVNZXNzYWdlTWFuYWdlclxuLy8gd2l0aCBhbiBhdHRyaWJ1dGUgYGNvbnRlbnRgIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIHdpbmRvd1xuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykge1xuICBtb2R1bGUuZXhwb3J0cy5zYXZlQXMgPSBzYXZlQXM7XG59IGVsc2UgaWYgKCh0eXBlb2YgZGVmaW5lICE9PSBcInVuZGVmaW5lZFwiICYmIGRlZmluZSAhPT0gbnVsbCkgJiYgKGRlZmluZS5hbWQgIT09IG51bGwpKSB7XG4gIGRlZmluZShcIkZpbGVTYXZlci5qc1wiLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2F2ZUFzO1xuICB9KTtcbn1cbiIsIi8qISBpZWVlNzU0LiBCU0QtMy1DbGF1c2UgTGljZW5zZS4gRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnL29wZW5zb3VyY2U+ICovXG5leHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IChlICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IChtICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKCh2YWx1ZSAqIGMpIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCIvKiFcblxuSlNaaXAgdjMuNy4xIC0gQSBKYXZhU2NyaXB0IGNsYXNzIGZvciBnZW5lcmF0aW5nIGFuZCByZWFkaW5nIHppcCBmaWxlc1xuPGh0dHA6Ly9zdHVhcnRrLmNvbS9qc3ppcD5cblxuKGMpIDIwMDktMjAxNiBTdHVhcnQgS25pZ2h0bGV5IDxzdHVhcnQgW2F0XSBzdHVhcnRrLmNvbT5cbkR1YWwgbGljZW5jZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIG9yIEdQTHYzLiBTZWUgaHR0cHM6Ly9yYXcuZ2l0aHViLmNvbS9TdHVrL2pzemlwL21hc3Rlci9MSUNFTlNFLm1hcmtkb3duLlxuXG5KU1ppcCB1c2VzIHRoZSBsaWJyYXJ5IHBha28gcmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIDpcbmh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvcGFrby9ibG9iL21hc3Rlci9MSUNFTlNFXG4qL1xuXG4hZnVuY3Rpb24odCl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBtb2R1bGUpbW9kdWxlLmV4cG9ydHM9dCgpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShbXSx0KTtlbHNleyhcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2dsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOnRoaXMpLkpTWmlwPXQoKX19KGZ1bmN0aW9uKCl7cmV0dXJuIGZ1bmN0aW9uIHMoYSxvLGgpe2Z1bmN0aW9uIHUocix0KXtpZighb1tyXSl7aWYoIWFbcl0pe3ZhciBlPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIXQmJmUpcmV0dXJuIGUociwhMCk7aWYobClyZXR1cm4gbChyLCEwKTt2YXIgaT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK3IrXCInXCIpO3Rocm93IGkuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixpfXZhciBuPW9bcl09e2V4cG9ydHM6e319O2Fbcl1bMF0uY2FsbChuLmV4cG9ydHMsZnVuY3Rpb24odCl7dmFyIGU9YVtyXVsxXVt0XTtyZXR1cm4gdShlfHx0KX0sbixuLmV4cG9ydHMscyxhLG8saCl9cmV0dXJuIG9bcl0uZXhwb3J0c31mb3IodmFyIGw9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSx0PTA7dDxoLmxlbmd0aDt0KyspdShoW3RdKTtyZXR1cm4gdX0oezE6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgYz10KFwiLi91dGlsc1wiKSxkPXQoXCIuL3N1cHBvcnRcIikscD1cIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky89XCI7ci5lbmNvZGU9ZnVuY3Rpb24odCl7Zm9yKHZhciBlLHIsaSxuLHMsYSxvLGg9W10sdT0wLGw9dC5sZW5ndGgsZj1sLGQ9XCJzdHJpbmdcIiE9PWMuZ2V0VHlwZU9mKHQpO3U8dC5sZW5ndGg7KWY9bC11LGk9ZD8oZT10W3UrK10scj11PGw/dFt1KytdOjAsdTxsP3RbdSsrXTowKTooZT10LmNoYXJDb2RlQXQodSsrKSxyPXU8bD90LmNoYXJDb2RlQXQodSsrKTowLHU8bD90LmNoYXJDb2RlQXQodSsrKTowKSxuPWU+PjIscz0oMyZlKTw8NHxyPj40LGE9MTxmPygxNSZyKTw8MnxpPj42OjY0LG89MjxmPzYzJmk6NjQsaC5wdXNoKHAuY2hhckF0KG4pK3AuY2hhckF0KHMpK3AuY2hhckF0KGEpK3AuY2hhckF0KG8pKTtyZXR1cm4gaC5qb2luKFwiXCIpfSxyLmRlY29kZT1mdW5jdGlvbih0KXt2YXIgZSxyLGksbixzLGEsbz0wLGg9MCx1PVwiZGF0YTpcIjtpZih0LnN1YnN0cigwLHUubGVuZ3RoKT09PXUpdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBiYXNlNjQgaW5wdXQsIGl0IGxvb2tzIGxpa2UgYSBkYXRhIHVybC5cIik7dmFyIGwsZj0zKih0PXQucmVwbGFjZSgvW15BLVphLXowLTlcXCtcXC9cXD1dL2csXCJcIikpLmxlbmd0aC80O2lmKHQuY2hhckF0KHQubGVuZ3RoLTEpPT09cC5jaGFyQXQoNjQpJiZmLS0sdC5jaGFyQXQodC5sZW5ndGgtMik9PT1wLmNoYXJBdCg2NCkmJmYtLSxmJTEhPTApdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBiYXNlNjQgaW5wdXQsIGJhZCBjb250ZW50IGxlbmd0aC5cIik7Zm9yKGw9ZC51aW50OGFycmF5P25ldyBVaW50OEFycmF5KDB8Zik6bmV3IEFycmF5KDB8Zik7bzx0Lmxlbmd0aDspZT1wLmluZGV4T2YodC5jaGFyQXQobysrKSk8PDJ8KG49cC5pbmRleE9mKHQuY2hhckF0KG8rKykpKT4+NCxyPSgxNSZuKTw8NHwocz1wLmluZGV4T2YodC5jaGFyQXQobysrKSkpPj4yLGk9KDMmcyk8PDZ8KGE9cC5pbmRleE9mKHQuY2hhckF0KG8rKykpKSxsW2grK109ZSw2NCE9PXMmJihsW2grK109ciksNjQhPT1hJiYobFtoKytdPWkpO3JldHVybiBsfX0se1wiLi9zdXBwb3J0XCI6MzAsXCIuL3V0aWxzXCI6MzJ9XSwyOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vZXh0ZXJuYWxcIiksbj10KFwiLi9zdHJlYW0vRGF0YVdvcmtlclwiKSxzPXQoXCIuL3N0cmVhbS9DcmMzMlByb2JlXCIpLGE9dChcIi4vc3RyZWFtL0RhdGFMZW5ndGhQcm9iZVwiKTtmdW5jdGlvbiBvKHQsZSxyLGksbil7dGhpcy5jb21wcmVzc2VkU2l6ZT10LHRoaXMudW5jb21wcmVzc2VkU2l6ZT1lLHRoaXMuY3JjMzI9cix0aGlzLmNvbXByZXNzaW9uPWksdGhpcy5jb21wcmVzc2VkQ29udGVudD1ufW8ucHJvdG90eXBlPXtnZXRDb250ZW50V29ya2VyOmZ1bmN0aW9uKCl7dmFyIHQ9bmV3IG4oaS5Qcm9taXNlLnJlc29sdmUodGhpcy5jb21wcmVzc2VkQ29udGVudCkpLnBpcGUodGhpcy5jb21wcmVzc2lvbi51bmNvbXByZXNzV29ya2VyKCkpLnBpcGUobmV3IGEoXCJkYXRhX2xlbmd0aFwiKSksZT10aGlzO3JldHVybiB0Lm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtpZih0aGlzLnN0cmVhbUluZm8uZGF0YV9sZW5ndGghPT1lLnVuY29tcHJlc3NlZFNpemUpdGhyb3cgbmV3IEVycm9yKFwiQnVnIDogdW5jb21wcmVzc2VkIGRhdGEgc2l6ZSBtaXNtYXRjaFwiKX0pLHR9LGdldENvbXByZXNzZWRXb3JrZXI6ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IG4oaS5Qcm9taXNlLnJlc29sdmUodGhpcy5jb21wcmVzc2VkQ29udGVudCkpLndpdGhTdHJlYW1JbmZvKFwiY29tcHJlc3NlZFNpemVcIix0aGlzLmNvbXByZXNzZWRTaXplKS53aXRoU3RyZWFtSW5mbyhcInVuY29tcHJlc3NlZFNpemVcIix0aGlzLnVuY29tcHJlc3NlZFNpemUpLndpdGhTdHJlYW1JbmZvKFwiY3JjMzJcIix0aGlzLmNyYzMyKS53aXRoU3RyZWFtSW5mbyhcImNvbXByZXNzaW9uXCIsdGhpcy5jb21wcmVzc2lvbil9fSxvLmNyZWF0ZVdvcmtlckZyb209ZnVuY3Rpb24odCxlLHIpe3JldHVybiB0LnBpcGUobmV3IHMpLnBpcGUobmV3IGEoXCJ1bmNvbXByZXNzZWRTaXplXCIpKS5waXBlKGUuY29tcHJlc3NXb3JrZXIocikpLnBpcGUobmV3IGEoXCJjb21wcmVzc2VkU2l6ZVwiKSkud2l0aFN0cmVhbUluZm8oXCJjb21wcmVzc2lvblwiLGUpfSxlLmV4cG9ydHM9b30se1wiLi9leHRlcm5hbFwiOjYsXCIuL3N0cmVhbS9DcmMzMlByb2JlXCI6MjUsXCIuL3N0cmVhbS9EYXRhTGVuZ3RoUHJvYmVcIjoyNixcIi4vc3RyZWFtL0RhdGFXb3JrZXJcIjoyN31dLDM6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKTtyLlNUT1JFPXttYWdpYzpcIlxcMFxcMFwiLGNvbXByZXNzV29ya2VyOmZ1bmN0aW9uKHQpe3JldHVybiBuZXcgaShcIlNUT1JFIGNvbXByZXNzaW9uXCIpfSx1bmNvbXByZXNzV29ya2VyOmZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBpKFwiU1RPUkUgZGVjb21wcmVzc2lvblwiKX19LHIuREVGTEFURT10KFwiLi9mbGF0ZVwiKX0se1wiLi9mbGF0ZVwiOjcsXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6Mjh9XSw0OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vdXRpbHNcIik7dmFyIG89ZnVuY3Rpb24oKXtmb3IodmFyIHQsZT1bXSxyPTA7cjwyNTY7cisrKXt0PXI7Zm9yKHZhciBpPTA7aTw4O2krKyl0PTEmdD8zOTg4MjkyMzg0XnQ+Pj4xOnQ+Pj4xO2Vbcl09dH1yZXR1cm4gZX0oKTtlLmV4cG9ydHM9ZnVuY3Rpb24odCxlKXtyZXR1cm4gdm9pZCAwIT09dCYmdC5sZW5ndGg/XCJzdHJpbmdcIiE9PWkuZ2V0VHlwZU9mKHQpP2Z1bmN0aW9uKHQsZSxyLGkpe3ZhciBuPW8scz1pK3I7dF49LTE7Zm9yKHZhciBhPWk7YTxzO2ErKyl0PXQ+Pj44Xm5bMjU1Jih0XmVbYV0pXTtyZXR1cm4tMV50fSgwfGUsdCx0Lmxlbmd0aCwwKTpmdW5jdGlvbih0LGUscixpKXt2YXIgbj1vLHM9aStyO3RePS0xO2Zvcih2YXIgYT1pO2E8czthKyspdD10Pj4+OF5uWzI1NSYodF5lLmNoYXJDb2RlQXQoYSkpXTtyZXR1cm4tMV50fSgwfGUsdCx0Lmxlbmd0aCwwKTowfX0se1wiLi91dGlsc1wiOjMyfV0sNTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3IuYmFzZTY0PSExLHIuYmluYXJ5PSExLHIuZGlyPSExLHIuY3JlYXRlRm9sZGVycz0hMCxyLmRhdGU9bnVsbCxyLmNvbXByZXNzaW9uPW51bGwsci5jb21wcmVzc2lvbk9wdGlvbnM9bnVsbCxyLmNvbW1lbnQ9bnVsbCxyLnVuaXhQZXJtaXNzaW9ucz1udWxsLHIuZG9zUGVybWlzc2lvbnM9bnVsbH0se31dLDY6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT1udWxsO2k9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIFByb21pc2U/UHJvbWlzZTp0KFwibGllXCIpLGUuZXhwb3J0cz17UHJvbWlzZTppfX0se2xpZTozN31dLDc6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT1cInVuZGVmaW5lZFwiIT10eXBlb2YgVWludDhBcnJheSYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIFVpbnQxNkFycmF5JiZcInVuZGVmaW5lZFwiIT10eXBlb2YgVWludDMyQXJyYXksbj10KFwicGFrb1wiKSxzPXQoXCIuL3V0aWxzXCIpLGE9dChcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIiksbz1pP1widWludDhhcnJheVwiOlwiYXJyYXlcIjtmdW5jdGlvbiBoKHQsZSl7YS5jYWxsKHRoaXMsXCJGbGF0ZVdvcmtlci9cIit0KSx0aGlzLl9wYWtvPW51bGwsdGhpcy5fcGFrb0FjdGlvbj10LHRoaXMuX3Bha29PcHRpb25zPWUsdGhpcy5tZXRhPXt9fXIubWFnaWM9XCJcXGJcXDBcIixzLmluaGVyaXRzKGgsYSksaC5wcm90b3R5cGUucHJvY2Vzc0NodW5rPWZ1bmN0aW9uKHQpe3RoaXMubWV0YT10Lm1ldGEsbnVsbD09PXRoaXMuX3Bha28mJnRoaXMuX2NyZWF0ZVBha28oKSx0aGlzLl9wYWtvLnB1c2gocy50cmFuc2Zvcm1UbyhvLHQuZGF0YSksITEpfSxoLnByb3RvdHlwZS5mbHVzaD1mdW5jdGlvbigpe2EucHJvdG90eXBlLmZsdXNoLmNhbGwodGhpcyksbnVsbD09PXRoaXMuX3Bha28mJnRoaXMuX2NyZWF0ZVBha28oKSx0aGlzLl9wYWtvLnB1c2goW10sITApfSxoLnByb3RvdHlwZS5jbGVhblVwPWZ1bmN0aW9uKCl7YS5wcm90b3R5cGUuY2xlYW5VcC5jYWxsKHRoaXMpLHRoaXMuX3Bha289bnVsbH0saC5wcm90b3R5cGUuX2NyZWF0ZVBha289ZnVuY3Rpb24oKXt0aGlzLl9wYWtvPW5ldyBuW3RoaXMuX3Bha29BY3Rpb25dKHtyYXc6ITAsbGV2ZWw6dGhpcy5fcGFrb09wdGlvbnMubGV2ZWx8fC0xfSk7dmFyIGU9dGhpczt0aGlzLl9wYWtvLm9uRGF0YT1mdW5jdGlvbih0KXtlLnB1c2goe2RhdGE6dCxtZXRhOmUubWV0YX0pfX0sci5jb21wcmVzc1dvcmtlcj1mdW5jdGlvbih0KXtyZXR1cm4gbmV3IGgoXCJEZWZsYXRlXCIsdCl9LHIudW5jb21wcmVzc1dvcmtlcj1mdW5jdGlvbigpe3JldHVybiBuZXcgaChcIkluZmxhdGVcIix7fSl9fSx7XCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuL3V0aWxzXCI6MzIscGFrbzozOH1dLDg6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBBKHQsZSl7dmFyIHIsaT1cIlwiO2ZvcihyPTA7cjxlO3IrKylpKz1TdHJpbmcuZnJvbUNoYXJDb2RlKDI1NSZ0KSx0Pj4+PTg7cmV0dXJuIGl9ZnVuY3Rpb24gaSh0LGUscixpLG4scyl7dmFyIGEsbyxoPXQuZmlsZSx1PXQuY29tcHJlc3Npb24sbD1zIT09Ty51dGY4ZW5jb2RlLGY9SS50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLHMoaC5uYW1lKSksZD1JLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsTy51dGY4ZW5jb2RlKGgubmFtZSkpLGM9aC5jb21tZW50LHA9SS50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLHMoYykpLG09SS50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLE8udXRmOGVuY29kZShjKSksXz1kLmxlbmd0aCE9PWgubmFtZS5sZW5ndGgsZz1tLmxlbmd0aCE9PWMubGVuZ3RoLGI9XCJcIix2PVwiXCIseT1cIlwiLHc9aC5kaXIsaz1oLmRhdGUseD17Y3JjMzI6MCxjb21wcmVzc2VkU2l6ZTowLHVuY29tcHJlc3NlZFNpemU6MH07ZSYmIXJ8fCh4LmNyYzMyPXQuY3JjMzIseC5jb21wcmVzc2VkU2l6ZT10LmNvbXByZXNzZWRTaXplLHgudW5jb21wcmVzc2VkU2l6ZT10LnVuY29tcHJlc3NlZFNpemUpO3ZhciBTPTA7ZSYmKFN8PTgpLGx8fCFfJiYhZ3x8KFN8PTIwNDgpO3ZhciB6PTAsQz0wO3cmJih6fD0xNiksXCJVTklYXCI9PT1uPyhDPTc5OCx6fD1mdW5jdGlvbih0LGUpe3ZhciByPXQ7cmV0dXJuIHR8fChyPWU/MTY4OTM6MzMyMDQpLCg2NTUzNSZyKTw8MTZ9KGgudW5peFBlcm1pc3Npb25zLHcpKTooQz0yMCx6fD1mdW5jdGlvbih0KXtyZXR1cm4gNjMmKHR8fDApfShoLmRvc1Blcm1pc3Npb25zKSksYT1rLmdldFVUQ0hvdXJzKCksYTw8PTYsYXw9ay5nZXRVVENNaW51dGVzKCksYTw8PTUsYXw9ay5nZXRVVENTZWNvbmRzKCkvMixvPWsuZ2V0VVRDRnVsbFllYXIoKS0xOTgwLG88PD00LG98PWsuZ2V0VVRDTW9udGgoKSsxLG88PD01LG98PWsuZ2V0VVRDRGF0ZSgpLF8mJih2PUEoMSwxKStBKEIoZiksNCkrZCxiKz1cInVwXCIrQSh2Lmxlbmd0aCwyKSt2KSxnJiYoeT1BKDEsMSkrQShCKHApLDQpK20sYis9XCJ1Y1wiK0EoeS5sZW5ndGgsMikreSk7dmFyIEU9XCJcIjtyZXR1cm4gRSs9XCJcXG5cXDBcIixFKz1BKFMsMiksRSs9dS5tYWdpYyxFKz1BKGEsMiksRSs9QShvLDIpLEUrPUEoeC5jcmMzMiw0KSxFKz1BKHguY29tcHJlc3NlZFNpemUsNCksRSs9QSh4LnVuY29tcHJlc3NlZFNpemUsNCksRSs9QShmLmxlbmd0aCwyKSxFKz1BKGIubGVuZ3RoLDIpLHtmaWxlUmVjb3JkOlIuTE9DQUxfRklMRV9IRUFERVIrRStmK2IsZGlyUmVjb3JkOlIuQ0VOVFJBTF9GSUxFX0hFQURFUitBKEMsMikrRStBKHAubGVuZ3RoLDIpK1wiXFwwXFwwXFwwXFwwXCIrQSh6LDQpK0EoaSw0KStmK2IrcH19dmFyIEk9dChcIi4uL3V0aWxzXCIpLG49dChcIi4uL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpLE89dChcIi4uL3V0ZjhcIiksQj10KFwiLi4vY3JjMzJcIiksUj10KFwiLi4vc2lnbmF0dXJlXCIpO2Z1bmN0aW9uIHModCxlLHIsaSl7bi5jYWxsKHRoaXMsXCJaaXBGaWxlV29ya2VyXCIpLHRoaXMuYnl0ZXNXcml0dGVuPTAsdGhpcy56aXBDb21tZW50PWUsdGhpcy56aXBQbGF0Zm9ybT1yLHRoaXMuZW5jb2RlRmlsZU5hbWU9aSx0aGlzLnN0cmVhbUZpbGVzPXQsdGhpcy5hY2N1bXVsYXRlPSExLHRoaXMuY29udGVudEJ1ZmZlcj1bXSx0aGlzLmRpclJlY29yZHM9W10sdGhpcy5jdXJyZW50U291cmNlT2Zmc2V0PTAsdGhpcy5lbnRyaWVzQ291bnQ9MCx0aGlzLmN1cnJlbnRGaWxlPW51bGwsdGhpcy5fc291cmNlcz1bXX1JLmluaGVyaXRzKHMsbikscy5wcm90b3R5cGUucHVzaD1mdW5jdGlvbih0KXt2YXIgZT10Lm1ldGEucGVyY2VudHx8MCxyPXRoaXMuZW50cmllc0NvdW50LGk9dGhpcy5fc291cmNlcy5sZW5ndGg7dGhpcy5hY2N1bXVsYXRlP3RoaXMuY29udGVudEJ1ZmZlci5wdXNoKHQpOih0aGlzLmJ5dGVzV3JpdHRlbis9dC5kYXRhLmxlbmd0aCxuLnByb3RvdHlwZS5wdXNoLmNhbGwodGhpcyx7ZGF0YTp0LmRhdGEsbWV0YTp7Y3VycmVudEZpbGU6dGhpcy5jdXJyZW50RmlsZSxwZXJjZW50OnI/KGUrMTAwKihyLWktMSkpL3I6MTAwfX0pKX0scy5wcm90b3R5cGUub3BlbmVkU291cmNlPWZ1bmN0aW9uKHQpe3RoaXMuY3VycmVudFNvdXJjZU9mZnNldD10aGlzLmJ5dGVzV3JpdHRlbix0aGlzLmN1cnJlbnRGaWxlPXQuZmlsZS5uYW1lO3ZhciBlPXRoaXMuc3RyZWFtRmlsZXMmJiF0LmZpbGUuZGlyO2lmKGUpe3ZhciByPWkodCxlLCExLHRoaXMuY3VycmVudFNvdXJjZU9mZnNldCx0aGlzLnppcFBsYXRmb3JtLHRoaXMuZW5jb2RlRmlsZU5hbWUpO3RoaXMucHVzaCh7ZGF0YTpyLmZpbGVSZWNvcmQsbWV0YTp7cGVyY2VudDowfX0pfWVsc2UgdGhpcy5hY2N1bXVsYXRlPSEwfSxzLnByb3RvdHlwZS5jbG9zZWRTb3VyY2U9ZnVuY3Rpb24odCl7dGhpcy5hY2N1bXVsYXRlPSExO3ZhciBlPXRoaXMuc3RyZWFtRmlsZXMmJiF0LmZpbGUuZGlyLHI9aSh0LGUsITAsdGhpcy5jdXJyZW50U291cmNlT2Zmc2V0LHRoaXMuemlwUGxhdGZvcm0sdGhpcy5lbmNvZGVGaWxlTmFtZSk7aWYodGhpcy5kaXJSZWNvcmRzLnB1c2goci5kaXJSZWNvcmQpLGUpdGhpcy5wdXNoKHtkYXRhOmZ1bmN0aW9uKHQpe3JldHVybiBSLkRBVEFfREVTQ1JJUFRPUitBKHQuY3JjMzIsNCkrQSh0LmNvbXByZXNzZWRTaXplLDQpK0EodC51bmNvbXByZXNzZWRTaXplLDQpfSh0KSxtZXRhOntwZXJjZW50OjEwMH19KTtlbHNlIGZvcih0aGlzLnB1c2goe2RhdGE6ci5maWxlUmVjb3JkLG1ldGE6e3BlcmNlbnQ6MH19KTt0aGlzLmNvbnRlbnRCdWZmZXIubGVuZ3RoOyl0aGlzLnB1c2godGhpcy5jb250ZW50QnVmZmVyLnNoaWZ0KCkpO3RoaXMuY3VycmVudEZpbGU9bnVsbH0scy5wcm90b3R5cGUuZmx1c2g9ZnVuY3Rpb24oKXtmb3IodmFyIHQ9dGhpcy5ieXRlc1dyaXR0ZW4sZT0wO2U8dGhpcy5kaXJSZWNvcmRzLmxlbmd0aDtlKyspdGhpcy5wdXNoKHtkYXRhOnRoaXMuZGlyUmVjb3Jkc1tlXSxtZXRhOntwZXJjZW50OjEwMH19KTt2YXIgcj10aGlzLmJ5dGVzV3JpdHRlbi10LGk9ZnVuY3Rpb24odCxlLHIsaSxuKXt2YXIgcz1JLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsbihpKSk7cmV0dXJuIFIuQ0VOVFJBTF9ESVJFQ1RPUllfRU5EK1wiXFwwXFwwXFwwXFwwXCIrQSh0LDIpK0EodCwyKStBKGUsNCkrQShyLDQpK0Eocy5sZW5ndGgsMikrc30odGhpcy5kaXJSZWNvcmRzLmxlbmd0aCxyLHQsdGhpcy56aXBDb21tZW50LHRoaXMuZW5jb2RlRmlsZU5hbWUpO3RoaXMucHVzaCh7ZGF0YTppLG1ldGE6e3BlcmNlbnQ6MTAwfX0pfSxzLnByb3RvdHlwZS5wcmVwYXJlTmV4dFNvdXJjZT1mdW5jdGlvbigpe3RoaXMucHJldmlvdXM9dGhpcy5fc291cmNlcy5zaGlmdCgpLHRoaXMub3BlbmVkU291cmNlKHRoaXMucHJldmlvdXMuc3RyZWFtSW5mbyksdGhpcy5pc1BhdXNlZD90aGlzLnByZXZpb3VzLnBhdXNlKCk6dGhpcy5wcmV2aW91cy5yZXN1bWUoKX0scy5wcm90b3R5cGUucmVnaXN0ZXJQcmV2aW91cz1mdW5jdGlvbih0KXt0aGlzLl9zb3VyY2VzLnB1c2godCk7dmFyIGU9dGhpcztyZXR1cm4gdC5vbihcImRhdGFcIixmdW5jdGlvbih0KXtlLnByb2Nlc3NDaHVuayh0KX0pLHQub24oXCJlbmRcIixmdW5jdGlvbigpe2UuY2xvc2VkU291cmNlKGUucHJldmlvdXMuc3RyZWFtSW5mbyksZS5fc291cmNlcy5sZW5ndGg/ZS5wcmVwYXJlTmV4dFNvdXJjZSgpOmUuZW5kKCl9KSx0Lm9uKFwiZXJyb3JcIixmdW5jdGlvbih0KXtlLmVycm9yKHQpfSksdGhpc30scy5wcm90b3R5cGUucmVzdW1lPWZ1bmN0aW9uKCl7cmV0dXJuISFuLnByb3RvdHlwZS5yZXN1bWUuY2FsbCh0aGlzKSYmKCF0aGlzLnByZXZpb3VzJiZ0aGlzLl9zb3VyY2VzLmxlbmd0aD8odGhpcy5wcmVwYXJlTmV4dFNvdXJjZSgpLCEwKTp0aGlzLnByZXZpb3VzfHx0aGlzLl9zb3VyY2VzLmxlbmd0aHx8dGhpcy5nZW5lcmF0ZWRFcnJvcj92b2lkIDA6KHRoaXMuZW5kKCksITApKX0scy5wcm90b3R5cGUuZXJyb3I9ZnVuY3Rpb24odCl7dmFyIGU9dGhpcy5fc291cmNlcztpZighbi5wcm90b3R5cGUuZXJyb3IuY2FsbCh0aGlzLHQpKXJldHVybiExO2Zvcih2YXIgcj0wO3I8ZS5sZW5ndGg7cisrKXRyeXtlW3JdLmVycm9yKHQpfWNhdGNoKHQpe31yZXR1cm4hMH0scy5wcm90b3R5cGUubG9jaz1mdW5jdGlvbigpe24ucHJvdG90eXBlLmxvY2suY2FsbCh0aGlzKTtmb3IodmFyIHQ9dGhpcy5fc291cmNlcyxlPTA7ZTx0Lmxlbmd0aDtlKyspdFtlXS5sb2NrKCl9LGUuZXhwb3J0cz1zfSx7XCIuLi9jcmMzMlwiOjQsXCIuLi9zaWduYXR1cmVcIjoyMyxcIi4uL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuLi91dGY4XCI6MzEsXCIuLi91dGlsc1wiOjMyfV0sOTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciB1PXQoXCIuLi9jb21wcmVzc2lvbnNcIiksaT10KFwiLi9aaXBGaWxlV29ya2VyXCIpO3IuZ2VuZXJhdGVXb3JrZXI9ZnVuY3Rpb24odCxhLGUpe3ZhciBvPW5ldyBpKGEuc3RyZWFtRmlsZXMsZSxhLnBsYXRmb3JtLGEuZW5jb2RlRmlsZU5hbWUpLGg9MDt0cnl7dC5mb3JFYWNoKGZ1bmN0aW9uKHQsZSl7aCsrO3ZhciByPWZ1bmN0aW9uKHQsZSl7dmFyIHI9dHx8ZSxpPXVbcl07aWYoIWkpdGhyb3cgbmV3IEVycm9yKHIrXCIgaXMgbm90IGEgdmFsaWQgY29tcHJlc3Npb24gbWV0aG9kICFcIik7cmV0dXJuIGl9KGUub3B0aW9ucy5jb21wcmVzc2lvbixhLmNvbXByZXNzaW9uKSxpPWUub3B0aW9ucy5jb21wcmVzc2lvbk9wdGlvbnN8fGEuY29tcHJlc3Npb25PcHRpb25zfHx7fSxuPWUuZGlyLHM9ZS5kYXRlO2UuX2NvbXByZXNzV29ya2VyKHIsaSkud2l0aFN0cmVhbUluZm8oXCJmaWxlXCIse25hbWU6dCxkaXI6bixkYXRlOnMsY29tbWVudDplLmNvbW1lbnR8fFwiXCIsdW5peFBlcm1pc3Npb25zOmUudW5peFBlcm1pc3Npb25zLGRvc1Blcm1pc3Npb25zOmUuZG9zUGVybWlzc2lvbnN9KS5waXBlKG8pfSksby5lbnRyaWVzQ291bnQ9aH1jYXRjaCh0KXtvLmVycm9yKHQpfXJldHVybiBvfX0se1wiLi4vY29tcHJlc3Npb25zXCI6MyxcIi4vWmlwRmlsZVdvcmtlclwiOjh9XSwxMDpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGkoKXtpZighKHRoaXMgaW5zdGFuY2VvZiBpKSlyZXR1cm4gbmV3IGk7aWYoYXJndW1lbnRzLmxlbmd0aCl0aHJvdyBuZXcgRXJyb3IoXCJUaGUgY29uc3RydWN0b3Igd2l0aCBwYXJhbWV0ZXJzIGhhcyBiZWVuIHJlbW92ZWQgaW4gSlNaaXAgMy4wLCBwbGVhc2UgY2hlY2sgdGhlIHVwZ3JhZGUgZ3VpZGUuXCIpO3RoaXMuZmlsZXM9T2JqZWN0LmNyZWF0ZShudWxsKSx0aGlzLmNvbW1lbnQ9bnVsbCx0aGlzLnJvb3Q9XCJcIix0aGlzLmNsb25lPWZ1bmN0aW9uKCl7dmFyIHQ9bmV3IGk7Zm9yKHZhciBlIGluIHRoaXMpXCJmdW5jdGlvblwiIT10eXBlb2YgdGhpc1tlXSYmKHRbZV09dGhpc1tlXSk7cmV0dXJuIHR9fShpLnByb3RvdHlwZT10KFwiLi9vYmplY3RcIikpLmxvYWRBc3luYz10KFwiLi9sb2FkXCIpLGkuc3VwcG9ydD10KFwiLi9zdXBwb3J0XCIpLGkuZGVmYXVsdHM9dChcIi4vZGVmYXVsdHNcIiksaS52ZXJzaW9uPVwiMy43LjFcIixpLmxvYWRBc3luYz1mdW5jdGlvbih0LGUpe3JldHVybihuZXcgaSkubG9hZEFzeW5jKHQsZSl9LGkuZXh0ZXJuYWw9dChcIi4vZXh0ZXJuYWxcIiksZS5leHBvcnRzPWl9LHtcIi4vZGVmYXVsdHNcIjo1LFwiLi9leHRlcm5hbFwiOjYsXCIuL2xvYWRcIjoxMSxcIi4vb2JqZWN0XCI6MTUsXCIuL3N1cHBvcnRcIjozMH1dLDExOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vdXRpbHNcIiksbj10KFwiLi9leHRlcm5hbFwiKSxvPXQoXCIuL3V0ZjhcIiksaD10KFwiLi96aXBFbnRyaWVzXCIpLHM9dChcIi4vc3RyZWFtL0NyYzMyUHJvYmVcIiksdT10KFwiLi9ub2RlanNVdGlsc1wiKTtmdW5jdGlvbiBsKGkpe3JldHVybiBuZXcgbi5Qcm9taXNlKGZ1bmN0aW9uKHQsZSl7dmFyIHI9aS5kZWNvbXByZXNzZWQuZ2V0Q29udGVudFdvcmtlcigpLnBpcGUobmV3IHMpO3Iub24oXCJlcnJvclwiLGZ1bmN0aW9uKHQpe2UodCl9KS5vbihcImVuZFwiLGZ1bmN0aW9uKCl7ci5zdHJlYW1JbmZvLmNyYzMyIT09aS5kZWNvbXByZXNzZWQuY3JjMzI/ZShuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwIDogQ1JDMzIgbWlzbWF0Y2hcIikpOnQoKX0pLnJlc3VtZSgpfSl9ZS5leHBvcnRzPWZ1bmN0aW9uKHQscyl7dmFyIGE9dGhpcztyZXR1cm4gcz1pLmV4dGVuZChzfHx7fSx7YmFzZTY0OiExLGNoZWNrQ1JDMzI6ITEsb3B0aW1pemVkQmluYXJ5U3RyaW5nOiExLGNyZWF0ZUZvbGRlcnM6ITEsZGVjb2RlRmlsZU5hbWU6by51dGY4ZGVjb2RlfSksdS5pc05vZGUmJnUuaXNTdHJlYW0odCk/bi5Qcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJKU1ppcCBjYW4ndCBhY2NlcHQgYSBzdHJlYW0gd2hlbiBsb2FkaW5nIGEgemlwIGZpbGUuXCIpKTppLnByZXBhcmVDb250ZW50KFwidGhlIGxvYWRlZCB6aXAgZmlsZVwiLHQsITAscy5vcHRpbWl6ZWRCaW5hcnlTdHJpbmcscy5iYXNlNjQpLnRoZW4oZnVuY3Rpb24odCl7dmFyIGU9bmV3IGgocyk7cmV0dXJuIGUubG9hZCh0KSxlfSkudGhlbihmdW5jdGlvbih0KXt2YXIgZT1bbi5Qcm9taXNlLnJlc29sdmUodCldLHI9dC5maWxlcztpZihzLmNoZWNrQ1JDMzIpZm9yKHZhciBpPTA7aTxyLmxlbmd0aDtpKyspZS5wdXNoKGwocltpXSkpO3JldHVybiBuLlByb21pc2UuYWxsKGUpfSkudGhlbihmdW5jdGlvbih0KXtmb3IodmFyIGU9dC5zaGlmdCgpLHI9ZS5maWxlcyxpPTA7aTxyLmxlbmd0aDtpKyspe3ZhciBuPXJbaV07YS5maWxlKG4uZmlsZU5hbWVTdHIsbi5kZWNvbXByZXNzZWQse2JpbmFyeTohMCxvcHRpbWl6ZWRCaW5hcnlTdHJpbmc6ITAsZGF0ZTpuLmRhdGUsZGlyOm4uZGlyLGNvbW1lbnQ6bi5maWxlQ29tbWVudFN0ci5sZW5ndGg/bi5maWxlQ29tbWVudFN0cjpudWxsLHVuaXhQZXJtaXNzaW9uczpuLnVuaXhQZXJtaXNzaW9ucyxkb3NQZXJtaXNzaW9uczpuLmRvc1Blcm1pc3Npb25zLGNyZWF0ZUZvbGRlcnM6cy5jcmVhdGVGb2xkZXJzfSl9cmV0dXJuIGUuemlwQ29tbWVudC5sZW5ndGgmJihhLmNvbW1lbnQ9ZS56aXBDb21tZW50KSxhfSl9fSx7XCIuL2V4dGVybmFsXCI6NixcIi4vbm9kZWpzVXRpbHNcIjoxNCxcIi4vc3RyZWFtL0NyYzMyUHJvYmVcIjoyNSxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyLFwiLi96aXBFbnRyaWVzXCI6MzN9XSwxMjpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuLi91dGlsc1wiKSxuPXQoXCIuLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKTtmdW5jdGlvbiBzKHQsZSl7bi5jYWxsKHRoaXMsXCJOb2RlanMgc3RyZWFtIGlucHV0IGFkYXB0ZXIgZm9yIFwiK3QpLHRoaXMuX3Vwc3RyZWFtRW5kZWQ9ITEsdGhpcy5fYmluZFN0cmVhbShlKX1pLmluaGVyaXRzKHMsbikscy5wcm90b3R5cGUuX2JpbmRTdHJlYW09ZnVuY3Rpb24odCl7dmFyIGU9dGhpczsodGhpcy5fc3RyZWFtPXQpLnBhdXNlKCksdC5vbihcImRhdGFcIixmdW5jdGlvbih0KXtlLnB1c2goe2RhdGE6dCxtZXRhOntwZXJjZW50OjB9fSl9KS5vbihcImVycm9yXCIsZnVuY3Rpb24odCl7ZS5pc1BhdXNlZD90aGlzLmdlbmVyYXRlZEVycm9yPXQ6ZS5lcnJvcih0KX0pLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtlLmlzUGF1c2VkP2UuX3Vwc3RyZWFtRW5kZWQ9ITA6ZS5lbmQoKX0pfSxzLnByb3RvdHlwZS5wYXVzZT1mdW5jdGlvbigpe3JldHVybiEhbi5wcm90b3R5cGUucGF1c2UuY2FsbCh0aGlzKSYmKHRoaXMuX3N0cmVhbS5wYXVzZSgpLCEwKX0scy5wcm90b3R5cGUucmVzdW1lPWZ1bmN0aW9uKCl7cmV0dXJuISFuLnByb3RvdHlwZS5yZXN1bWUuY2FsbCh0aGlzKSYmKHRoaXMuX3Vwc3RyZWFtRW5kZWQ/dGhpcy5lbmQoKTp0aGlzLl9zdHJlYW0ucmVzdW1lKCksITApfSxlLmV4cG9ydHM9c30se1wiLi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4uL3V0aWxzXCI6MzJ9XSwxMzpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBuPXQoXCJyZWFkYWJsZS1zdHJlYW1cIikuUmVhZGFibGU7ZnVuY3Rpb24gaSh0LGUscil7bi5jYWxsKHRoaXMsZSksdGhpcy5faGVscGVyPXQ7dmFyIGk9dGhpczt0Lm9uKFwiZGF0YVwiLGZ1bmN0aW9uKHQsZSl7aS5wdXNoKHQpfHxpLl9oZWxwZXIucGF1c2UoKSxyJiZyKGUpfSkub24oXCJlcnJvclwiLGZ1bmN0aW9uKHQpe2kuZW1pdChcImVycm9yXCIsdCl9KS5vbihcImVuZFwiLGZ1bmN0aW9uKCl7aS5wdXNoKG51bGwpfSl9dChcIi4uL3V0aWxzXCIpLmluaGVyaXRzKGksbiksaS5wcm90b3R5cGUuX3JlYWQ9ZnVuY3Rpb24oKXt0aGlzLl9oZWxwZXIucmVzdW1lKCl9LGUuZXhwb3J0cz1pfSx7XCIuLi91dGlsc1wiOjMyLFwicmVhZGFibGUtc3RyZWFtXCI6MTZ9XSwxNDpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2UuZXhwb3J0cz17aXNOb2RlOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBCdWZmZXIsbmV3QnVmZmVyRnJvbTpmdW5jdGlvbih0LGUpe2lmKEJ1ZmZlci5mcm9tJiZCdWZmZXIuZnJvbSE9PVVpbnQ4QXJyYXkuZnJvbSlyZXR1cm4gQnVmZmVyLmZyb20odCxlKTtpZihcIm51bWJlclwiPT10eXBlb2YgdCl0aHJvdyBuZXcgRXJyb3IoJ1RoZSBcImRhdGFcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBhIG51bWJlcicpO3JldHVybiBuZXcgQnVmZmVyKHQsZSl9LGFsbG9jQnVmZmVyOmZ1bmN0aW9uKHQpe2lmKEJ1ZmZlci5hbGxvYylyZXR1cm4gQnVmZmVyLmFsbG9jKHQpO3ZhciBlPW5ldyBCdWZmZXIodCk7cmV0dXJuIGUuZmlsbCgwKSxlfSxpc0J1ZmZlcjpmdW5jdGlvbih0KXtyZXR1cm4gQnVmZmVyLmlzQnVmZmVyKHQpfSxpc1N0cmVhbTpmdW5jdGlvbih0KXtyZXR1cm4gdCYmXCJmdW5jdGlvblwiPT10eXBlb2YgdC5vbiYmXCJmdW5jdGlvblwiPT10eXBlb2YgdC5wYXVzZSYmXCJmdW5jdGlvblwiPT10eXBlb2YgdC5yZXN1bWV9fX0se31dLDE1OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcyh0LGUscil7dmFyIGksbj11LmdldFR5cGVPZihlKSxzPXUuZXh0ZW5kKHJ8fHt9LGYpO3MuZGF0ZT1zLmRhdGV8fG5ldyBEYXRlLG51bGwhPT1zLmNvbXByZXNzaW9uJiYocy5jb21wcmVzc2lvbj1zLmNvbXByZXNzaW9uLnRvVXBwZXJDYXNlKCkpLFwic3RyaW5nXCI9PXR5cGVvZiBzLnVuaXhQZXJtaXNzaW9ucyYmKHMudW5peFBlcm1pc3Npb25zPXBhcnNlSW50KHMudW5peFBlcm1pc3Npb25zLDgpKSxzLnVuaXhQZXJtaXNzaW9ucyYmMTYzODQmcy51bml4UGVybWlzc2lvbnMmJihzLmRpcj0hMCkscy5kb3NQZXJtaXNzaW9ucyYmMTYmcy5kb3NQZXJtaXNzaW9ucyYmKHMuZGlyPSEwKSxzLmRpciYmKHQ9Zyh0KSkscy5jcmVhdGVGb2xkZXJzJiYoaT1fKHQpKSYmYi5jYWxsKHRoaXMsaSwhMCk7dmFyIGE9XCJzdHJpbmdcIj09PW4mJiExPT09cy5iaW5hcnkmJiExPT09cy5iYXNlNjQ7ciYmdm9pZCAwIT09ci5iaW5hcnl8fChzLmJpbmFyeT0hYSksKGUgaW5zdGFuY2VvZiBkJiYwPT09ZS51bmNvbXByZXNzZWRTaXplfHxzLmRpcnx8IWV8fDA9PT1lLmxlbmd0aCkmJihzLmJhc2U2ND0hMSxzLmJpbmFyeT0hMCxlPVwiXCIscy5jb21wcmVzc2lvbj1cIlNUT1JFXCIsbj1cInN0cmluZ1wiKTt2YXIgbz1udWxsO289ZSBpbnN0YW5jZW9mIGR8fGUgaW5zdGFuY2VvZiBsP2U6cC5pc05vZGUmJnAuaXNTdHJlYW0oZSk/bmV3IG0odCxlKTp1LnByZXBhcmVDb250ZW50KHQsZSxzLmJpbmFyeSxzLm9wdGltaXplZEJpbmFyeVN0cmluZyxzLmJhc2U2NCk7dmFyIGg9bmV3IGModCxvLHMpO3RoaXMuZmlsZXNbdF09aH12YXIgbj10KFwiLi91dGY4XCIpLHU9dChcIi4vdXRpbHNcIiksbD10KFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKSxhPXQoXCIuL3N0cmVhbS9TdHJlYW1IZWxwZXJcIiksZj10KFwiLi9kZWZhdWx0c1wiKSxkPXQoXCIuL2NvbXByZXNzZWRPYmplY3RcIiksYz10KFwiLi96aXBPYmplY3RcIiksbz10KFwiLi9nZW5lcmF0ZVwiKSxwPXQoXCIuL25vZGVqc1V0aWxzXCIpLG09dChcIi4vbm9kZWpzL05vZGVqc1N0cmVhbUlucHV0QWRhcHRlclwiKSxfPWZ1bmN0aW9uKHQpe1wiL1wiPT09dC5zbGljZSgtMSkmJih0PXQuc3Vic3RyaW5nKDAsdC5sZW5ndGgtMSkpO3ZhciBlPXQubGFzdEluZGV4T2YoXCIvXCIpO3JldHVybiAwPGU/dC5zdWJzdHJpbmcoMCxlKTpcIlwifSxnPWZ1bmN0aW9uKHQpe3JldHVyblwiL1wiIT09dC5zbGljZSgtMSkmJih0Kz1cIi9cIiksdH0sYj1mdW5jdGlvbih0LGUpe3JldHVybiBlPXZvaWQgMCE9PWU/ZTpmLmNyZWF0ZUZvbGRlcnMsdD1nKHQpLHRoaXMuZmlsZXNbdF18fHMuY2FsbCh0aGlzLHQsbnVsbCx7ZGlyOiEwLGNyZWF0ZUZvbGRlcnM6ZX0pLHRoaXMuZmlsZXNbdF19O2Z1bmN0aW9uIGgodCl7cmV0dXJuXCJbb2JqZWN0IFJlZ0V4cF1cIj09PU9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0KX12YXIgaT17bG9hZDpmdW5jdGlvbigpe3Rocm93IG5ldyBFcnJvcihcIlRoaXMgbWV0aG9kIGhhcyBiZWVuIHJlbW92ZWQgaW4gSlNaaXAgMy4wLCBwbGVhc2UgY2hlY2sgdGhlIHVwZ3JhZGUgZ3VpZGUuXCIpfSxmb3JFYWNoOmZ1bmN0aW9uKHQpe3ZhciBlLHIsaTtmb3IoZSBpbiB0aGlzLmZpbGVzKWk9dGhpcy5maWxlc1tlXSwocj1lLnNsaWNlKHRoaXMucm9vdC5sZW5ndGgsZS5sZW5ndGgpKSYmZS5zbGljZSgwLHRoaXMucm9vdC5sZW5ndGgpPT09dGhpcy5yb290JiZ0KHIsaSl9LGZpbHRlcjpmdW5jdGlvbihyKXt2YXIgaT1bXTtyZXR1cm4gdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHQsZSl7cih0LGUpJiZpLnB1c2goZSl9KSxpfSxmaWxlOmZ1bmN0aW9uKHQsZSxyKXtpZigxIT09YXJndW1lbnRzLmxlbmd0aClyZXR1cm4gdD10aGlzLnJvb3QrdCxzLmNhbGwodGhpcyx0LGUsciksdGhpcztpZihoKHQpKXt2YXIgaT10O3JldHVybiB0aGlzLmZpbHRlcihmdW5jdGlvbih0LGUpe3JldHVybiFlLmRpciYmaS50ZXN0KHQpfSl9dmFyIG49dGhpcy5maWxlc1t0aGlzLnJvb3QrdF07cmV0dXJuIG4mJiFuLmRpcj9uOm51bGx9LGZvbGRlcjpmdW5jdGlvbihyKXtpZighcilyZXR1cm4gdGhpcztpZihoKHIpKXJldHVybiB0aGlzLmZpbHRlcihmdW5jdGlvbih0LGUpe3JldHVybiBlLmRpciYmci50ZXN0KHQpfSk7dmFyIHQ9dGhpcy5yb290K3IsZT1iLmNhbGwodGhpcyx0KSxpPXRoaXMuY2xvbmUoKTtyZXR1cm4gaS5yb290PWUubmFtZSxpfSxyZW1vdmU6ZnVuY3Rpb24ocil7cj10aGlzLnJvb3Qrcjt2YXIgdD10aGlzLmZpbGVzW3JdO2lmKHR8fChcIi9cIiE9PXIuc2xpY2UoLTEpJiYocis9XCIvXCIpLHQ9dGhpcy5maWxlc1tyXSksdCYmIXQuZGlyKWRlbGV0ZSB0aGlzLmZpbGVzW3JdO2Vsc2UgZm9yKHZhciBlPXRoaXMuZmlsdGVyKGZ1bmN0aW9uKHQsZSl7cmV0dXJuIGUubmFtZS5zbGljZSgwLHIubGVuZ3RoKT09PXJ9KSxpPTA7aTxlLmxlbmd0aDtpKyspZGVsZXRlIHRoaXMuZmlsZXNbZVtpXS5uYW1lXTtyZXR1cm4gdGhpc30sZ2VuZXJhdGU6ZnVuY3Rpb24odCl7dGhyb3cgbmV3IEVycm9yKFwiVGhpcyBtZXRob2QgaGFzIGJlZW4gcmVtb3ZlZCBpbiBKU1ppcCAzLjAsIHBsZWFzZSBjaGVjayB0aGUgdXBncmFkZSBndWlkZS5cIil9LGdlbmVyYXRlSW50ZXJuYWxTdHJlYW06ZnVuY3Rpb24odCl7dmFyIGUscj17fTt0cnl7aWYoKHI9dS5leHRlbmQodHx8e30se3N0cmVhbUZpbGVzOiExLGNvbXByZXNzaW9uOlwiU1RPUkVcIixjb21wcmVzc2lvbk9wdGlvbnM6bnVsbCx0eXBlOlwiXCIscGxhdGZvcm06XCJET1NcIixjb21tZW50Om51bGwsbWltZVR5cGU6XCJhcHBsaWNhdGlvbi96aXBcIixlbmNvZGVGaWxlTmFtZTpuLnV0ZjhlbmNvZGV9KSkudHlwZT1yLnR5cGUudG9Mb3dlckNhc2UoKSxyLmNvbXByZXNzaW9uPXIuY29tcHJlc3Npb24udG9VcHBlckNhc2UoKSxcImJpbmFyeXN0cmluZ1wiPT09ci50eXBlJiYoci50eXBlPVwic3RyaW5nXCIpLCFyLnR5cGUpdGhyb3cgbmV3IEVycm9yKFwiTm8gb3V0cHV0IHR5cGUgc3BlY2lmaWVkLlwiKTt1LmNoZWNrU3VwcG9ydChyLnR5cGUpLFwiZGFyd2luXCIhPT1yLnBsYXRmb3JtJiZcImZyZWVic2RcIiE9PXIucGxhdGZvcm0mJlwibGludXhcIiE9PXIucGxhdGZvcm0mJlwic3Vub3NcIiE9PXIucGxhdGZvcm18fChyLnBsYXRmb3JtPVwiVU5JWFwiKSxcIndpbjMyXCI9PT1yLnBsYXRmb3JtJiYoci5wbGF0Zm9ybT1cIkRPU1wiKTt2YXIgaT1yLmNvbW1lbnR8fHRoaXMuY29tbWVudHx8XCJcIjtlPW8uZ2VuZXJhdGVXb3JrZXIodGhpcyxyLGkpfWNhdGNoKHQpeyhlPW5ldyBsKFwiZXJyb3JcIikpLmVycm9yKHQpfXJldHVybiBuZXcgYShlLHIudHlwZXx8XCJzdHJpbmdcIixyLm1pbWVUeXBlKX0sZ2VuZXJhdGVBc3luYzpmdW5jdGlvbih0LGUpe3JldHVybiB0aGlzLmdlbmVyYXRlSW50ZXJuYWxTdHJlYW0odCkuYWNjdW11bGF0ZShlKX0sZ2VuZXJhdGVOb2RlU3RyZWFtOmZ1bmN0aW9uKHQsZSl7cmV0dXJuKHQ9dHx8e30pLnR5cGV8fCh0LnR5cGU9XCJub2RlYnVmZmVyXCIpLHRoaXMuZ2VuZXJhdGVJbnRlcm5hbFN0cmVhbSh0KS50b05vZGVqc1N0cmVhbShlKX19O2UuZXhwb3J0cz1pfSx7XCIuL2NvbXByZXNzZWRPYmplY3RcIjoyLFwiLi9kZWZhdWx0c1wiOjUsXCIuL2dlbmVyYXRlXCI6OSxcIi4vbm9kZWpzL05vZGVqc1N0cmVhbUlucHV0QWRhcHRlclwiOjEyLFwiLi9ub2RlanNVdGlsc1wiOjE0LFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiOjI4LFwiLi9zdHJlYW0vU3RyZWFtSGVscGVyXCI6MjksXCIuL3V0ZjhcIjozMSxcIi4vdXRpbHNcIjozMixcIi4vemlwT2JqZWN0XCI6MzV9XSwxNjpbZnVuY3Rpb24odCxlLHIpe2UuZXhwb3J0cz10KFwic3RyZWFtXCIpfSx7c3RyZWFtOnZvaWQgMH1dLDE3OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vRGF0YVJlYWRlclwiKTtmdW5jdGlvbiBuKHQpe2kuY2FsbCh0aGlzLHQpO2Zvcih2YXIgZT0wO2U8dGhpcy5kYXRhLmxlbmd0aDtlKyspdFtlXT0yNTUmdFtlXX10KFwiLi4vdXRpbHNcIikuaW5oZXJpdHMobixpKSxuLnByb3RvdHlwZS5ieXRlQXQ9ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMuZGF0YVt0aGlzLnplcm8rdF19LG4ucHJvdG90eXBlLmxhc3RJbmRleE9mU2lnbmF0dXJlPWZ1bmN0aW9uKHQpe2Zvcih2YXIgZT10LmNoYXJDb2RlQXQoMCkscj10LmNoYXJDb2RlQXQoMSksaT10LmNoYXJDb2RlQXQoMiksbj10LmNoYXJDb2RlQXQoMykscz10aGlzLmxlbmd0aC00OzA8PXM7LS1zKWlmKHRoaXMuZGF0YVtzXT09PWUmJnRoaXMuZGF0YVtzKzFdPT09ciYmdGhpcy5kYXRhW3MrMl09PT1pJiZ0aGlzLmRhdGFbcyszXT09PW4pcmV0dXJuIHMtdGhpcy56ZXJvO3JldHVybi0xfSxuLnByb3RvdHlwZS5yZWFkQW5kQ2hlY2tTaWduYXR1cmU9ZnVuY3Rpb24odCl7dmFyIGU9dC5jaGFyQ29kZUF0KDApLHI9dC5jaGFyQ29kZUF0KDEpLGk9dC5jaGFyQ29kZUF0KDIpLG49dC5jaGFyQ29kZUF0KDMpLHM9dGhpcy5yZWFkRGF0YSg0KTtyZXR1cm4gZT09PXNbMF0mJnI9PT1zWzFdJiZpPT09c1syXSYmbj09PXNbM119LG4ucHJvdG90eXBlLnJlYWREYXRhPWZ1bmN0aW9uKHQpe2lmKHRoaXMuY2hlY2tPZmZzZXQodCksMD09PXQpcmV0dXJuW107dmFyIGU9dGhpcy5kYXRhLnNsaWNlKHRoaXMuemVybyt0aGlzLmluZGV4LHRoaXMuemVybyt0aGlzLmluZGV4K3QpO3JldHVybiB0aGlzLmluZGV4Kz10LGV9LGUuZXhwb3J0cz1ufSx7XCIuLi91dGlsc1wiOjMyLFwiLi9EYXRhUmVhZGVyXCI6MTh9XSwxODpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuLi91dGlsc1wiKTtmdW5jdGlvbiBuKHQpe3RoaXMuZGF0YT10LHRoaXMubGVuZ3RoPXQubGVuZ3RoLHRoaXMuaW5kZXg9MCx0aGlzLnplcm89MH1uLnByb3RvdHlwZT17Y2hlY2tPZmZzZXQ6ZnVuY3Rpb24odCl7dGhpcy5jaGVja0luZGV4KHRoaXMuaW5kZXgrdCl9LGNoZWNrSW5kZXg6ZnVuY3Rpb24odCl7aWYodGhpcy5sZW5ndGg8dGhpcy56ZXJvK3R8fHQ8MCl0aHJvdyBuZXcgRXJyb3IoXCJFbmQgb2YgZGF0YSByZWFjaGVkIChkYXRhIGxlbmd0aCA9IFwiK3RoaXMubGVuZ3RoK1wiLCBhc2tlZCBpbmRleCA9IFwiK3QrXCIpLiBDb3JydXB0ZWQgemlwID9cIil9LHNldEluZGV4OmZ1bmN0aW9uKHQpe3RoaXMuY2hlY2tJbmRleCh0KSx0aGlzLmluZGV4PXR9LHNraXA6ZnVuY3Rpb24odCl7dGhpcy5zZXRJbmRleCh0aGlzLmluZGV4K3QpfSxieXRlQXQ6ZnVuY3Rpb24odCl7fSxyZWFkSW50OmZ1bmN0aW9uKHQpe3ZhciBlLHI9MDtmb3IodGhpcy5jaGVja09mZnNldCh0KSxlPXRoaXMuaW5kZXgrdC0xO2U+PXRoaXMuaW5kZXg7ZS0tKXI9KHI8PDgpK3RoaXMuYnl0ZUF0KGUpO3JldHVybiB0aGlzLmluZGV4Kz10LHJ9LHJlYWRTdHJpbmc6ZnVuY3Rpb24odCl7cmV0dXJuIGkudHJhbnNmb3JtVG8oXCJzdHJpbmdcIix0aGlzLnJlYWREYXRhKHQpKX0scmVhZERhdGE6ZnVuY3Rpb24odCl7fSxsYXN0SW5kZXhPZlNpZ25hdHVyZTpmdW5jdGlvbih0KXt9LHJlYWRBbmRDaGVja1NpZ25hdHVyZTpmdW5jdGlvbih0KXt9LHJlYWREYXRlOmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy5yZWFkSW50KDQpO3JldHVybiBuZXcgRGF0ZShEYXRlLlVUQygxOTgwKyh0Pj4yNSYxMjcpLCh0Pj4yMSYxNSktMSx0Pj4xNiYzMSx0Pj4xMSYzMSx0Pj41JjYzLCgzMSZ0KTw8MSkpfX0sZS5leHBvcnRzPW59LHtcIi4uL3V0aWxzXCI6MzJ9XSwxOTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL1VpbnQ4QXJyYXlSZWFkZXJcIik7ZnVuY3Rpb24gbih0KXtpLmNhbGwodGhpcyx0KX10KFwiLi4vdXRpbHNcIikuaW5oZXJpdHMobixpKSxuLnByb3RvdHlwZS5yZWFkRGF0YT1mdW5jdGlvbih0KXt0aGlzLmNoZWNrT2Zmc2V0KHQpO3ZhciBlPXRoaXMuZGF0YS5zbGljZSh0aGlzLnplcm8rdGhpcy5pbmRleCx0aGlzLnplcm8rdGhpcy5pbmRleCt0KTtyZXR1cm4gdGhpcy5pbmRleCs9dCxlfSxlLmV4cG9ydHM9bn0se1wiLi4vdXRpbHNcIjozMixcIi4vVWludDhBcnJheVJlYWRlclwiOjIxfV0sMjA6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi9EYXRhUmVhZGVyXCIpO2Z1bmN0aW9uIG4odCl7aS5jYWxsKHRoaXMsdCl9dChcIi4uL3V0aWxzXCIpLmluaGVyaXRzKG4saSksbi5wcm90b3R5cGUuYnl0ZUF0PWZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLmRhdGEuY2hhckNvZGVBdCh0aGlzLnplcm8rdCl9LG4ucHJvdG90eXBlLmxhc3RJbmRleE9mU2lnbmF0dXJlPWZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLmRhdGEubGFzdEluZGV4T2YodCktdGhpcy56ZXJvfSxuLnByb3RvdHlwZS5yZWFkQW5kQ2hlY2tTaWduYXR1cmU9ZnVuY3Rpb24odCl7cmV0dXJuIHQ9PT10aGlzLnJlYWREYXRhKDQpfSxuLnByb3RvdHlwZS5yZWFkRGF0YT1mdW5jdGlvbih0KXt0aGlzLmNoZWNrT2Zmc2V0KHQpO3ZhciBlPXRoaXMuZGF0YS5zbGljZSh0aGlzLnplcm8rdGhpcy5pbmRleCx0aGlzLnplcm8rdGhpcy5pbmRleCt0KTtyZXR1cm4gdGhpcy5pbmRleCs9dCxlfSxlLmV4cG9ydHM9bn0se1wiLi4vdXRpbHNcIjozMixcIi4vRGF0YVJlYWRlclwiOjE4fV0sMjE6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi9BcnJheVJlYWRlclwiKTtmdW5jdGlvbiBuKHQpe2kuY2FsbCh0aGlzLHQpfXQoXCIuLi91dGlsc1wiKS5pbmhlcml0cyhuLGkpLG4ucHJvdG90eXBlLnJlYWREYXRhPWZ1bmN0aW9uKHQpe2lmKHRoaXMuY2hlY2tPZmZzZXQodCksMD09PXQpcmV0dXJuIG5ldyBVaW50OEFycmF5KDApO3ZhciBlPXRoaXMuZGF0YS5zdWJhcnJheSh0aGlzLnplcm8rdGhpcy5pbmRleCx0aGlzLnplcm8rdGhpcy5pbmRleCt0KTtyZXR1cm4gdGhpcy5pbmRleCs9dCxlfSxlLmV4cG9ydHM9bn0se1wiLi4vdXRpbHNcIjozMixcIi4vQXJyYXlSZWFkZXJcIjoxN31dLDIyOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4uL3V0aWxzXCIpLG49dChcIi4uL3N1cHBvcnRcIikscz10KFwiLi9BcnJheVJlYWRlclwiKSxhPXQoXCIuL1N0cmluZ1JlYWRlclwiKSxvPXQoXCIuL05vZGVCdWZmZXJSZWFkZXJcIiksaD10KFwiLi9VaW50OEFycmF5UmVhZGVyXCIpO2UuZXhwb3J0cz1mdW5jdGlvbih0KXt2YXIgZT1pLmdldFR5cGVPZih0KTtyZXR1cm4gaS5jaGVja1N1cHBvcnQoZSksXCJzdHJpbmdcIiE9PWV8fG4udWludDhhcnJheT9cIm5vZGVidWZmZXJcIj09PWU/bmV3IG8odCk6bi51aW50OGFycmF5P25ldyBoKGkudHJhbnNmb3JtVG8oXCJ1aW50OGFycmF5XCIsdCkpOm5ldyBzKGkudHJhbnNmb3JtVG8oXCJhcnJheVwiLHQpKTpuZXcgYSh0KX19LHtcIi4uL3N1cHBvcnRcIjozMCxcIi4uL3V0aWxzXCI6MzIsXCIuL0FycmF5UmVhZGVyXCI6MTcsXCIuL05vZGVCdWZmZXJSZWFkZXJcIjoxOSxcIi4vU3RyaW5nUmVhZGVyXCI6MjAsXCIuL1VpbnQ4QXJyYXlSZWFkZXJcIjoyMX1dLDIzOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ci5MT0NBTF9GSUxFX0hFQURFUj1cIlBLXHUwMDAzXHUwMDA0XCIsci5DRU5UUkFMX0ZJTEVfSEVBREVSPVwiUEtcdTAwMDFcdTAwMDJcIixyLkNFTlRSQUxfRElSRUNUT1JZX0VORD1cIlBLXHUwMDA1XHUwMDA2XCIsci5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9MT0NBVE9SPVwiUEtcdTAwMDZcdTAwMDdcIixyLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0VORD1cIlBLXHUwMDA2XHUwMDA2XCIsci5EQVRBX0RFU0NSSVBUT1I9XCJQS1x1MDAwN1xcYlwifSx7fV0sMjQ6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi9HZW5lcmljV29ya2VyXCIpLG49dChcIi4uL3V0aWxzXCIpO2Z1bmN0aW9uIHModCl7aS5jYWxsKHRoaXMsXCJDb252ZXJ0V29ya2VyIHRvIFwiK3QpLHRoaXMuZGVzdFR5cGU9dH1uLmluaGVyaXRzKHMsaSkscy5wcm90b3R5cGUucHJvY2Vzc0NodW5rPWZ1bmN0aW9uKHQpe3RoaXMucHVzaCh7ZGF0YTpuLnRyYW5zZm9ybVRvKHRoaXMuZGVzdFR5cGUsdC5kYXRhKSxtZXRhOnQubWV0YX0pfSxlLmV4cG9ydHM9c30se1wiLi4vdXRpbHNcIjozMixcIi4vR2VuZXJpY1dvcmtlclwiOjI4fV0sMjU6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi9HZW5lcmljV29ya2VyXCIpLG49dChcIi4uL2NyYzMyXCIpO2Z1bmN0aW9uIHMoKXtpLmNhbGwodGhpcyxcIkNyYzMyUHJvYmVcIiksdGhpcy53aXRoU3RyZWFtSW5mbyhcImNyYzMyXCIsMCl9dChcIi4uL3V0aWxzXCIpLmluaGVyaXRzKHMsaSkscy5wcm90b3R5cGUucHJvY2Vzc0NodW5rPWZ1bmN0aW9uKHQpe3RoaXMuc3RyZWFtSW5mby5jcmMzMj1uKHQuZGF0YSx0aGlzLnN0cmVhbUluZm8uY3JjMzJ8fDApLHRoaXMucHVzaCh0KX0sZS5leHBvcnRzPXN9LHtcIi4uL2NyYzMyXCI6NCxcIi4uL3V0aWxzXCI6MzIsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDI2OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4uL3V0aWxzXCIpLG49dChcIi4vR2VuZXJpY1dvcmtlclwiKTtmdW5jdGlvbiBzKHQpe24uY2FsbCh0aGlzLFwiRGF0YUxlbmd0aFByb2JlIGZvciBcIit0KSx0aGlzLnByb3BOYW1lPXQsdGhpcy53aXRoU3RyZWFtSW5mbyh0LDApfWkuaW5oZXJpdHMocyxuKSxzLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24odCl7aWYodCl7dmFyIGU9dGhpcy5zdHJlYW1JbmZvW3RoaXMucHJvcE5hbWVdfHwwO3RoaXMuc3RyZWFtSW5mb1t0aGlzLnByb3BOYW1lXT1lK3QuZGF0YS5sZW5ndGh9bi5wcm90b3R5cGUucHJvY2Vzc0NodW5rLmNhbGwodGhpcyx0KX0sZS5leHBvcnRzPXN9LHtcIi4uL3V0aWxzXCI6MzIsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDI3OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4uL3V0aWxzXCIpLG49dChcIi4vR2VuZXJpY1dvcmtlclwiKTtmdW5jdGlvbiBzKHQpe24uY2FsbCh0aGlzLFwiRGF0YVdvcmtlclwiKTt2YXIgZT10aGlzO3RoaXMuZGF0YUlzUmVhZHk9ITEsdGhpcy5pbmRleD0wLHRoaXMubWF4PTAsdGhpcy5kYXRhPW51bGwsdGhpcy50eXBlPVwiXCIsdGhpcy5fdGlja1NjaGVkdWxlZD0hMSx0LnRoZW4oZnVuY3Rpb24odCl7ZS5kYXRhSXNSZWFkeT0hMCxlLmRhdGE9dCxlLm1heD10JiZ0Lmxlbmd0aHx8MCxlLnR5cGU9aS5nZXRUeXBlT2YodCksZS5pc1BhdXNlZHx8ZS5fdGlja0FuZFJlcGVhdCgpfSxmdW5jdGlvbih0KXtlLmVycm9yKHQpfSl9aS5pbmhlcml0cyhzLG4pLHMucHJvdG90eXBlLmNsZWFuVXA9ZnVuY3Rpb24oKXtuLnByb3RvdHlwZS5jbGVhblVwLmNhbGwodGhpcyksdGhpcy5kYXRhPW51bGx9LHMucHJvdG90eXBlLnJlc3VtZT1mdW5jdGlvbigpe3JldHVybiEhbi5wcm90b3R5cGUucmVzdW1lLmNhbGwodGhpcykmJighdGhpcy5fdGlja1NjaGVkdWxlZCYmdGhpcy5kYXRhSXNSZWFkeSYmKHRoaXMuX3RpY2tTY2hlZHVsZWQ9ITAsaS5kZWxheSh0aGlzLl90aWNrQW5kUmVwZWF0LFtdLHRoaXMpKSwhMCl9LHMucHJvdG90eXBlLl90aWNrQW5kUmVwZWF0PWZ1bmN0aW9uKCl7dGhpcy5fdGlja1NjaGVkdWxlZD0hMSx0aGlzLmlzUGF1c2VkfHx0aGlzLmlzRmluaXNoZWR8fCh0aGlzLl90aWNrKCksdGhpcy5pc0ZpbmlzaGVkfHwoaS5kZWxheSh0aGlzLl90aWNrQW5kUmVwZWF0LFtdLHRoaXMpLHRoaXMuX3RpY2tTY2hlZHVsZWQ9ITApKX0scy5wcm90b3R5cGUuX3RpY2s9ZnVuY3Rpb24oKXtpZih0aGlzLmlzUGF1c2VkfHx0aGlzLmlzRmluaXNoZWQpcmV0dXJuITE7dmFyIHQ9bnVsbCxlPU1hdGgubWluKHRoaXMubWF4LHRoaXMuaW5kZXgrMTYzODQpO2lmKHRoaXMuaW5kZXg+PXRoaXMubWF4KXJldHVybiB0aGlzLmVuZCgpO3N3aXRjaCh0aGlzLnR5cGUpe2Nhc2VcInN0cmluZ1wiOnQ9dGhpcy5kYXRhLnN1YnN0cmluZyh0aGlzLmluZGV4LGUpO2JyZWFrO2Nhc2VcInVpbnQ4YXJyYXlcIjp0PXRoaXMuZGF0YS5zdWJhcnJheSh0aGlzLmluZGV4LGUpO2JyZWFrO2Nhc2VcImFycmF5XCI6Y2FzZVwibm9kZWJ1ZmZlclwiOnQ9dGhpcy5kYXRhLnNsaWNlKHRoaXMuaW5kZXgsZSl9cmV0dXJuIHRoaXMuaW5kZXg9ZSx0aGlzLnB1c2goe2RhdGE6dCxtZXRhOntwZXJjZW50OnRoaXMubWF4P3RoaXMuaW5kZXgvdGhpcy5tYXgqMTAwOjB9fSl9LGUuZXhwb3J0cz1zfSx7XCIuLi91dGlsc1wiOjMyLFwiLi9HZW5lcmljV29ya2VyXCI6Mjh9XSwyODpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGkodCl7dGhpcy5uYW1lPXR8fFwiZGVmYXVsdFwiLHRoaXMuc3RyZWFtSW5mbz17fSx0aGlzLmdlbmVyYXRlZEVycm9yPW51bGwsdGhpcy5leHRyYVN0cmVhbUluZm89e30sdGhpcy5pc1BhdXNlZD0hMCx0aGlzLmlzRmluaXNoZWQ9ITEsdGhpcy5pc0xvY2tlZD0hMSx0aGlzLl9saXN0ZW5lcnM9e2RhdGE6W10sZW5kOltdLGVycm9yOltdfSx0aGlzLnByZXZpb3VzPW51bGx9aS5wcm90b3R5cGU9e3B1c2g6ZnVuY3Rpb24odCl7dGhpcy5lbWl0KFwiZGF0YVwiLHQpfSxlbmQ6ZnVuY3Rpb24oKXtpZih0aGlzLmlzRmluaXNoZWQpcmV0dXJuITE7dGhpcy5mbHVzaCgpO3RyeXt0aGlzLmVtaXQoXCJlbmRcIiksdGhpcy5jbGVhblVwKCksdGhpcy5pc0ZpbmlzaGVkPSEwfWNhdGNoKHQpe3RoaXMuZW1pdChcImVycm9yXCIsdCl9cmV0dXJuITB9LGVycm9yOmZ1bmN0aW9uKHQpe3JldHVybiF0aGlzLmlzRmluaXNoZWQmJih0aGlzLmlzUGF1c2VkP3RoaXMuZ2VuZXJhdGVkRXJyb3I9dDoodGhpcy5pc0ZpbmlzaGVkPSEwLHRoaXMuZW1pdChcImVycm9yXCIsdCksdGhpcy5wcmV2aW91cyYmdGhpcy5wcmV2aW91cy5lcnJvcih0KSx0aGlzLmNsZWFuVXAoKSksITApfSxvbjpmdW5jdGlvbih0LGUpe3JldHVybiB0aGlzLl9saXN0ZW5lcnNbdF0ucHVzaChlKSx0aGlzfSxjbGVhblVwOmZ1bmN0aW9uKCl7dGhpcy5zdHJlYW1JbmZvPXRoaXMuZ2VuZXJhdGVkRXJyb3I9dGhpcy5leHRyYVN0cmVhbUluZm89bnVsbCx0aGlzLl9saXN0ZW5lcnM9W119LGVtaXQ6ZnVuY3Rpb24odCxlKXtpZih0aGlzLl9saXN0ZW5lcnNbdF0pZm9yKHZhciByPTA7cjx0aGlzLl9saXN0ZW5lcnNbdF0ubGVuZ3RoO3IrKyl0aGlzLl9saXN0ZW5lcnNbdF1bcl0uY2FsbCh0aGlzLGUpfSxwaXBlOmZ1bmN0aW9uKHQpe3JldHVybiB0LnJlZ2lzdGVyUHJldmlvdXModGhpcyl9LHJlZ2lzdGVyUHJldmlvdXM6ZnVuY3Rpb24odCl7aWYodGhpcy5pc0xvY2tlZCl0aHJvdyBuZXcgRXJyb3IoXCJUaGUgc3RyZWFtICdcIit0aGlzK1wiJyBoYXMgYWxyZWFkeSBiZWVuIHVzZWQuXCIpO3RoaXMuc3RyZWFtSW5mbz10LnN0cmVhbUluZm8sdGhpcy5tZXJnZVN0cmVhbUluZm8oKSx0aGlzLnByZXZpb3VzPXQ7dmFyIGU9dGhpcztyZXR1cm4gdC5vbihcImRhdGFcIixmdW5jdGlvbih0KXtlLnByb2Nlc3NDaHVuayh0KX0pLHQub24oXCJlbmRcIixmdW5jdGlvbigpe2UuZW5kKCl9KSx0Lm9uKFwiZXJyb3JcIixmdW5jdGlvbih0KXtlLmVycm9yKHQpfSksdGhpc30scGF1c2U6ZnVuY3Rpb24oKXtyZXR1cm4hdGhpcy5pc1BhdXNlZCYmIXRoaXMuaXNGaW5pc2hlZCYmKHRoaXMuaXNQYXVzZWQ9ITAsdGhpcy5wcmV2aW91cyYmdGhpcy5wcmV2aW91cy5wYXVzZSgpLCEwKX0scmVzdW1lOmZ1bmN0aW9uKCl7aWYoIXRoaXMuaXNQYXVzZWR8fHRoaXMuaXNGaW5pc2hlZClyZXR1cm4hMTt2YXIgdD10aGlzLmlzUGF1c2VkPSExO3JldHVybiB0aGlzLmdlbmVyYXRlZEVycm9yJiYodGhpcy5lcnJvcih0aGlzLmdlbmVyYXRlZEVycm9yKSx0PSEwKSx0aGlzLnByZXZpb3VzJiZ0aGlzLnByZXZpb3VzLnJlc3VtZSgpLCF0fSxmbHVzaDpmdW5jdGlvbigpe30scHJvY2Vzc0NodW5rOmZ1bmN0aW9uKHQpe3RoaXMucHVzaCh0KX0sd2l0aFN0cmVhbUluZm86ZnVuY3Rpb24odCxlKXtyZXR1cm4gdGhpcy5leHRyYVN0cmVhbUluZm9bdF09ZSx0aGlzLm1lcmdlU3RyZWFtSW5mbygpLHRoaXN9LG1lcmdlU3RyZWFtSW5mbzpmdW5jdGlvbigpe2Zvcih2YXIgdCBpbiB0aGlzLmV4dHJhU3RyZWFtSW5mbyl0aGlzLmV4dHJhU3RyZWFtSW5mby5oYXNPd25Qcm9wZXJ0eSh0KSYmKHRoaXMuc3RyZWFtSW5mb1t0XT10aGlzLmV4dHJhU3RyZWFtSW5mb1t0XSl9LGxvY2s6ZnVuY3Rpb24oKXtpZih0aGlzLmlzTG9ja2VkKXRocm93IG5ldyBFcnJvcihcIlRoZSBzdHJlYW0gJ1wiK3RoaXMrXCInIGhhcyBhbHJlYWR5IGJlZW4gdXNlZC5cIik7dGhpcy5pc0xvY2tlZD0hMCx0aGlzLnByZXZpb3VzJiZ0aGlzLnByZXZpb3VzLmxvY2soKX0sdG9TdHJpbmc6ZnVuY3Rpb24oKXt2YXIgdD1cIldvcmtlciBcIit0aGlzLm5hbWU7cmV0dXJuIHRoaXMucHJldmlvdXM/dGhpcy5wcmV2aW91cytcIiAtPiBcIit0OnR9fSxlLmV4cG9ydHM9aX0se31dLDI5OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGg9dChcIi4uL3V0aWxzXCIpLG49dChcIi4vQ29udmVydFdvcmtlclwiKSxzPXQoXCIuL0dlbmVyaWNXb3JrZXJcIiksdT10KFwiLi4vYmFzZTY0XCIpLGk9dChcIi4uL3N1cHBvcnRcIiksYT10KFwiLi4vZXh0ZXJuYWxcIiksbz1udWxsO2lmKGkubm9kZXN0cmVhbSl0cnl7bz10KFwiLi4vbm9kZWpzL05vZGVqc1N0cmVhbU91dHB1dEFkYXB0ZXJcIil9Y2F0Y2godCl7fWZ1bmN0aW9uIGwodCxvKXtyZXR1cm4gbmV3IGEuUHJvbWlzZShmdW5jdGlvbihlLHIpe3ZhciBpPVtdLG49dC5faW50ZXJuYWxUeXBlLHM9dC5fb3V0cHV0VHlwZSxhPXQuX21pbWVUeXBlO3Qub24oXCJkYXRhXCIsZnVuY3Rpb24odCxlKXtpLnB1c2godCksbyYmbyhlKX0pLm9uKFwiZXJyb3JcIixmdW5jdGlvbih0KXtpPVtdLHIodCl9KS5vbihcImVuZFwiLGZ1bmN0aW9uKCl7dHJ5e3ZhciB0PWZ1bmN0aW9uKHQsZSxyKXtzd2l0Y2godCl7Y2FzZVwiYmxvYlwiOnJldHVybiBoLm5ld0Jsb2IoaC50cmFuc2Zvcm1UbyhcImFycmF5YnVmZmVyXCIsZSkscik7Y2FzZVwiYmFzZTY0XCI6cmV0dXJuIHUuZW5jb2RlKGUpO2RlZmF1bHQ6cmV0dXJuIGgudHJhbnNmb3JtVG8odCxlKX19KHMsZnVuY3Rpb24odCxlKXt2YXIgcixpPTAsbj1udWxsLHM9MDtmb3Iocj0wO3I8ZS5sZW5ndGg7cisrKXMrPWVbcl0ubGVuZ3RoO3N3aXRjaCh0KXtjYXNlXCJzdHJpbmdcIjpyZXR1cm4gZS5qb2luKFwiXCIpO2Nhc2VcImFycmF5XCI6cmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sZSk7Y2FzZVwidWludDhhcnJheVwiOmZvcihuPW5ldyBVaW50OEFycmF5KHMpLHI9MDtyPGUubGVuZ3RoO3IrKyluLnNldChlW3JdLGkpLGkrPWVbcl0ubGVuZ3RoO3JldHVybiBuO2Nhc2VcIm5vZGVidWZmZXJcIjpyZXR1cm4gQnVmZmVyLmNvbmNhdChlKTtkZWZhdWx0OnRocm93IG5ldyBFcnJvcihcImNvbmNhdCA6IHVuc3VwcG9ydGVkIHR5cGUgJ1wiK3QrXCInXCIpfX0obixpKSxhKTtlKHQpfWNhdGNoKHQpe3IodCl9aT1bXX0pLnJlc3VtZSgpfSl9ZnVuY3Rpb24gZih0LGUscil7dmFyIGk9ZTtzd2l0Y2goZSl7Y2FzZVwiYmxvYlwiOmNhc2VcImFycmF5YnVmZmVyXCI6aT1cInVpbnQ4YXJyYXlcIjticmVhaztjYXNlXCJiYXNlNjRcIjppPVwic3RyaW5nXCJ9dHJ5e3RoaXMuX2ludGVybmFsVHlwZT1pLHRoaXMuX291dHB1dFR5cGU9ZSx0aGlzLl9taW1lVHlwZT1yLGguY2hlY2tTdXBwb3J0KGkpLHRoaXMuX3dvcmtlcj10LnBpcGUobmV3IG4oaSkpLHQubG9jaygpfWNhdGNoKHQpe3RoaXMuX3dvcmtlcj1uZXcgcyhcImVycm9yXCIpLHRoaXMuX3dvcmtlci5lcnJvcih0KX19Zi5wcm90b3R5cGU9e2FjY3VtdWxhdGU6ZnVuY3Rpb24odCl7cmV0dXJuIGwodGhpcyx0KX0sb246ZnVuY3Rpb24odCxlKXt2YXIgcj10aGlzO3JldHVyblwiZGF0YVwiPT09dD90aGlzLl93b3JrZXIub24odCxmdW5jdGlvbih0KXtlLmNhbGwocix0LmRhdGEsdC5tZXRhKX0pOnRoaXMuX3dvcmtlci5vbih0LGZ1bmN0aW9uKCl7aC5kZWxheShlLGFyZ3VtZW50cyxyKX0pLHRoaXN9LHJlc3VtZTpmdW5jdGlvbigpe3JldHVybiBoLmRlbGF5KHRoaXMuX3dvcmtlci5yZXN1bWUsW10sdGhpcy5fd29ya2VyKSx0aGlzfSxwYXVzZTpmdW5jdGlvbigpe3JldHVybiB0aGlzLl93b3JrZXIucGF1c2UoKSx0aGlzfSx0b05vZGVqc1N0cmVhbTpmdW5jdGlvbih0KXtpZihoLmNoZWNrU3VwcG9ydChcIm5vZGVzdHJlYW1cIiksXCJub2RlYnVmZmVyXCIhPT10aGlzLl9vdXRwdXRUeXBlKXRocm93IG5ldyBFcnJvcih0aGlzLl9vdXRwdXRUeXBlK1wiIGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhpcyBtZXRob2RcIik7cmV0dXJuIG5ldyBvKHRoaXMse29iamVjdE1vZGU6XCJub2RlYnVmZmVyXCIhPT10aGlzLl9vdXRwdXRUeXBlfSx0KX19LGUuZXhwb3J0cz1mfSx7XCIuLi9iYXNlNjRcIjoxLFwiLi4vZXh0ZXJuYWxcIjo2LFwiLi4vbm9kZWpzL05vZGVqc1N0cmVhbU91dHB1dEFkYXB0ZXJcIjoxMyxcIi4uL3N1cHBvcnRcIjozMCxcIi4uL3V0aWxzXCI6MzIsXCIuL0NvbnZlcnRXb3JrZXJcIjoyNCxcIi4vR2VuZXJpY1dvcmtlclwiOjI4fV0sMzA6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtpZihyLmJhc2U2ND0hMCxyLmFycmF5PSEwLHIuc3RyaW5nPSEwLHIuYXJyYXlidWZmZXI9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIEFycmF5QnVmZmVyJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgVWludDhBcnJheSxyLm5vZGVidWZmZXI9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIEJ1ZmZlcixyLnVpbnQ4YXJyYXk9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIFVpbnQ4QXJyYXksXCJ1bmRlZmluZWRcIj09dHlwZW9mIEFycmF5QnVmZmVyKXIuYmxvYj0hMTtlbHNle3ZhciBpPW5ldyBBcnJheUJ1ZmZlcigwKTt0cnl7ci5ibG9iPTA9PT1uZXcgQmxvYihbaV0se3R5cGU6XCJhcHBsaWNhdGlvbi96aXBcIn0pLnNpemV9Y2F0Y2godCl7dHJ5e3ZhciBuPW5ldyhzZWxmLkJsb2JCdWlsZGVyfHxzZWxmLldlYktpdEJsb2JCdWlsZGVyfHxzZWxmLk1vekJsb2JCdWlsZGVyfHxzZWxmLk1TQmxvYkJ1aWxkZXIpO24uYXBwZW5kKGkpLHIuYmxvYj0wPT09bi5nZXRCbG9iKFwiYXBwbGljYXRpb24vemlwXCIpLnNpemV9Y2F0Y2godCl7ci5ibG9iPSExfX19dHJ5e3Iubm9kZXN0cmVhbT0hIXQoXCJyZWFkYWJsZS1zdHJlYW1cIikuUmVhZGFibGV9Y2F0Y2godCl7ci5ub2Rlc3RyZWFtPSExfX0se1wicmVhZGFibGUtc3RyZWFtXCI6MTZ9XSwzMTpbZnVuY3Rpb24odCxlLHMpe1widXNlIHN0cmljdFwiO2Zvcih2YXIgbz10KFwiLi91dGlsc1wiKSxoPXQoXCIuL3N1cHBvcnRcIikscj10KFwiLi9ub2RlanNVdGlsc1wiKSxpPXQoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpLHU9bmV3IEFycmF5KDI1Niksbj0wO248MjU2O24rKyl1W25dPTI1Mjw9bj82OjI0ODw9bj81OjI0MDw9bj80OjIyNDw9bj8zOjE5Mjw9bj8yOjE7dVsyNTRdPXVbMjU0XT0xO2Z1bmN0aW9uIGEoKXtpLmNhbGwodGhpcyxcInV0Zi04IGRlY29kZVwiKSx0aGlzLmxlZnRPdmVyPW51bGx9ZnVuY3Rpb24gbCgpe2kuY2FsbCh0aGlzLFwidXRmLTggZW5jb2RlXCIpfXMudXRmOGVuY29kZT1mdW5jdGlvbih0KXtyZXR1cm4gaC5ub2RlYnVmZmVyP3IubmV3QnVmZmVyRnJvbSh0LFwidXRmLThcIik6ZnVuY3Rpb24odCl7dmFyIGUscixpLG4scyxhPXQubGVuZ3RoLG89MDtmb3Iobj0wO248YTtuKyspNTUyOTY9PSg2NDUxMiYocj10LmNoYXJDb2RlQXQobikpKSYmbisxPGEmJjU2MzIwPT0oNjQ1MTImKGk9dC5jaGFyQ29kZUF0KG4rMSkpKSYmKHI9NjU1MzYrKHItNTUyOTY8PDEwKSsoaS01NjMyMCksbisrKSxvKz1yPDEyOD8xOnI8MjA0OD8yOnI8NjU1MzY/Mzo0O2ZvcihlPWgudWludDhhcnJheT9uZXcgVWludDhBcnJheShvKTpuZXcgQXJyYXkobyksbj1zPTA7czxvO24rKyk1NTI5Nj09KDY0NTEyJihyPXQuY2hhckNvZGVBdChuKSkpJiZuKzE8YSYmNTYzMjA9PSg2NDUxMiYoaT10LmNoYXJDb2RlQXQobisxKSkpJiYocj02NTUzNisoci01NTI5Njw8MTApKyhpLTU2MzIwKSxuKyspLHI8MTI4P2VbcysrXT1yOihyPDIwNDg/ZVtzKytdPTE5MnxyPj4+Njoocjw2NTUzNj9lW3MrK109MjI0fHI+Pj4xMjooZVtzKytdPTI0MHxyPj4+MTgsZVtzKytdPTEyOHxyPj4+MTImNjMpLGVbcysrXT0xMjh8cj4+PjYmNjMpLGVbcysrXT0xMjh8NjMmcik7cmV0dXJuIGV9KHQpfSxzLnV0ZjhkZWNvZGU9ZnVuY3Rpb24odCl7cmV0dXJuIGgubm9kZWJ1ZmZlcj9vLnRyYW5zZm9ybVRvKFwibm9kZWJ1ZmZlclwiLHQpLnRvU3RyaW5nKFwidXRmLThcIik6ZnVuY3Rpb24odCl7dmFyIGUscixpLG4scz10Lmxlbmd0aCxhPW5ldyBBcnJheSgyKnMpO2ZvcihlPXI9MDtlPHM7KWlmKChpPXRbZSsrXSk8MTI4KWFbcisrXT1pO2Vsc2UgaWYoNDwobj11W2ldKSlhW3IrK109NjU1MzMsZSs9bi0xO2Vsc2V7Zm9yKGkmPTI9PT1uPzMxOjM9PT1uPzE1Ojc7MTxuJiZlPHM7KWk9aTw8Nnw2MyZ0W2UrK10sbi0tOzE8bj9hW3IrK109NjU1MzM6aTw2NTUzNj9hW3IrK109aTooaS09NjU1MzYsYVtyKytdPTU1Mjk2fGk+PjEwJjEwMjMsYVtyKytdPTU2MzIwfDEwMjMmaSl9cmV0dXJuIGEubGVuZ3RoIT09ciYmKGEuc3ViYXJyYXk/YT1hLnN1YmFycmF5KDAscik6YS5sZW5ndGg9ciksby5hcHBseUZyb21DaGFyQ29kZShhKX0odD1vLnRyYW5zZm9ybVRvKGgudWludDhhcnJheT9cInVpbnQ4YXJyYXlcIjpcImFycmF5XCIsdCkpfSxvLmluaGVyaXRzKGEsaSksYS5wcm90b3R5cGUucHJvY2Vzc0NodW5rPWZ1bmN0aW9uKHQpe3ZhciBlPW8udHJhbnNmb3JtVG8oaC51aW50OGFycmF5P1widWludDhhcnJheVwiOlwiYXJyYXlcIix0LmRhdGEpO2lmKHRoaXMubGVmdE92ZXImJnRoaXMubGVmdE92ZXIubGVuZ3RoKXtpZihoLnVpbnQ4YXJyYXkpe3ZhciByPWU7KGU9bmV3IFVpbnQ4QXJyYXkoci5sZW5ndGgrdGhpcy5sZWZ0T3Zlci5sZW5ndGgpKS5zZXQodGhpcy5sZWZ0T3ZlciwwKSxlLnNldChyLHRoaXMubGVmdE92ZXIubGVuZ3RoKX1lbHNlIGU9dGhpcy5sZWZ0T3Zlci5jb25jYXQoZSk7dGhpcy5sZWZ0T3Zlcj1udWxsfXZhciBpPWZ1bmN0aW9uKHQsZSl7dmFyIHI7Zm9yKChlPWV8fHQubGVuZ3RoKT50Lmxlbmd0aCYmKGU9dC5sZW5ndGgpLHI9ZS0xOzA8PXImJjEyOD09KDE5MiZ0W3JdKTspci0tO3JldHVybiByPDA/ZTowPT09cj9lOnIrdVt0W3JdXT5lP3I6ZX0oZSksbj1lO2khPT1lLmxlbmd0aCYmKGgudWludDhhcnJheT8obj1lLnN1YmFycmF5KDAsaSksdGhpcy5sZWZ0T3Zlcj1lLnN1YmFycmF5KGksZS5sZW5ndGgpKToobj1lLnNsaWNlKDAsaSksdGhpcy5sZWZ0T3Zlcj1lLnNsaWNlKGksZS5sZW5ndGgpKSksdGhpcy5wdXNoKHtkYXRhOnMudXRmOGRlY29kZShuKSxtZXRhOnQubWV0YX0pfSxhLnByb3RvdHlwZS5mbHVzaD1mdW5jdGlvbigpe3RoaXMubGVmdE92ZXImJnRoaXMubGVmdE92ZXIubGVuZ3RoJiYodGhpcy5wdXNoKHtkYXRhOnMudXRmOGRlY29kZSh0aGlzLmxlZnRPdmVyKSxtZXRhOnt9fSksdGhpcy5sZWZ0T3Zlcj1udWxsKX0scy5VdGY4RGVjb2RlV29ya2VyPWEsby5pbmhlcml0cyhsLGkpLGwucHJvdG90eXBlLnByb2Nlc3NDaHVuaz1mdW5jdGlvbih0KXt0aGlzLnB1c2goe2RhdGE6cy51dGY4ZW5jb2RlKHQuZGF0YSksbWV0YTp0Lm1ldGF9KX0scy5VdGY4RW5jb2RlV29ya2VyPWx9LHtcIi4vbm9kZWpzVXRpbHNcIjoxNCxcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4vc3VwcG9ydFwiOjMwLFwiLi91dGlsc1wiOjMyfV0sMzI6W2Z1bmN0aW9uKHQsZSxhKXtcInVzZSBzdHJpY3RcIjt2YXIgbz10KFwiLi9zdXBwb3J0XCIpLGg9dChcIi4vYmFzZTY0XCIpLHI9dChcIi4vbm9kZWpzVXRpbHNcIiksaT10KFwic2V0LWltbWVkaWF0ZS1zaGltXCIpLHU9dChcIi4vZXh0ZXJuYWxcIik7ZnVuY3Rpb24gbih0KXtyZXR1cm4gdH1mdW5jdGlvbiBsKHQsZSl7Zm9yKHZhciByPTA7cjx0Lmxlbmd0aDsrK3IpZVtyXT0yNTUmdC5jaGFyQ29kZUF0KHIpO3JldHVybiBlfWEubmV3QmxvYj1mdW5jdGlvbihlLHIpe2EuY2hlY2tTdXBwb3J0KFwiYmxvYlwiKTt0cnl7cmV0dXJuIG5ldyBCbG9iKFtlXSx7dHlwZTpyfSl9Y2F0Y2godCl7dHJ5e3ZhciBpPW5ldyhzZWxmLkJsb2JCdWlsZGVyfHxzZWxmLldlYktpdEJsb2JCdWlsZGVyfHxzZWxmLk1vekJsb2JCdWlsZGVyfHxzZWxmLk1TQmxvYkJ1aWxkZXIpO3JldHVybiBpLmFwcGVuZChlKSxpLmdldEJsb2Iocil9Y2F0Y2godCl7dGhyb3cgbmV3IEVycm9yKFwiQnVnIDogY2FuJ3QgY29uc3RydWN0IHRoZSBCbG9iLlwiKX19fTt2YXIgcz17c3RyaW5naWZ5QnlDaHVuazpmdW5jdGlvbih0LGUscil7dmFyIGk9W10sbj0wLHM9dC5sZW5ndGg7aWYoczw9cilyZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLHQpO2Zvcig7bjxzOylcImFycmF5XCI9PT1lfHxcIm5vZGVidWZmZXJcIj09PWU/aS5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCx0LnNsaWNlKG4sTWF0aC5taW4obityLHMpKSkpOmkucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsdC5zdWJhcnJheShuLE1hdGgubWluKG4rcixzKSkpKSxuKz1yO3JldHVybiBpLmpvaW4oXCJcIil9LHN0cmluZ2lmeUJ5Q2hhcjpmdW5jdGlvbih0KXtmb3IodmFyIGU9XCJcIixyPTA7cjx0Lmxlbmd0aDtyKyspZSs9U3RyaW5nLmZyb21DaGFyQ29kZSh0W3JdKTtyZXR1cm4gZX0sYXBwbHlDYW5CZVVzZWQ6e3VpbnQ4YXJyYXk6ZnVuY3Rpb24oKXt0cnl7cmV0dXJuIG8udWludDhhcnJheSYmMT09PVN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxuZXcgVWludDhBcnJheSgxKSkubGVuZ3RofWNhdGNoKHQpe3JldHVybiExfX0oKSxub2RlYnVmZmVyOmZ1bmN0aW9uKCl7dHJ5e3JldHVybiBvLm5vZGVidWZmZXImJjE9PT1TdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsci5hbGxvY0J1ZmZlcigxKSkubGVuZ3RofWNhdGNoKHQpe3JldHVybiExfX0oKX19O2Z1bmN0aW9uIGYodCl7dmFyIGU9NjU1MzYscj1hLmdldFR5cGVPZih0KSxpPSEwO2lmKFwidWludDhhcnJheVwiPT09cj9pPXMuYXBwbHlDYW5CZVVzZWQudWludDhhcnJheTpcIm5vZGVidWZmZXJcIj09PXImJihpPXMuYXBwbHlDYW5CZVVzZWQubm9kZWJ1ZmZlciksaSlmb3IoOzE8ZTspdHJ5e3JldHVybiBzLnN0cmluZ2lmeUJ5Q2h1bmsodCxyLGUpfWNhdGNoKHQpe2U9TWF0aC5mbG9vcihlLzIpfXJldHVybiBzLnN0cmluZ2lmeUJ5Q2hhcih0KX1mdW5jdGlvbiBkKHQsZSl7Zm9yKHZhciByPTA7cjx0Lmxlbmd0aDtyKyspZVtyXT10W3JdO3JldHVybiBlfWEuYXBwbHlGcm9tQ2hhckNvZGU9Zjt2YXIgYz17fTtjLnN0cmluZz17c3RyaW5nOm4sYXJyYXk6ZnVuY3Rpb24odCl7cmV0dXJuIGwodCxuZXcgQXJyYXkodC5sZW5ndGgpKX0sYXJyYXlidWZmZXI6ZnVuY3Rpb24odCl7cmV0dXJuIGMuc3RyaW5nLnVpbnQ4YXJyYXkodCkuYnVmZmVyfSx1aW50OGFycmF5OmZ1bmN0aW9uKHQpe3JldHVybiBsKHQsbmV3IFVpbnQ4QXJyYXkodC5sZW5ndGgpKX0sbm9kZWJ1ZmZlcjpmdW5jdGlvbih0KXtyZXR1cm4gbCh0LHIuYWxsb2NCdWZmZXIodC5sZW5ndGgpKX19LGMuYXJyYXk9e3N0cmluZzpmLGFycmF5Om4sYXJyYXlidWZmZXI6ZnVuY3Rpb24odCl7cmV0dXJuIG5ldyBVaW50OEFycmF5KHQpLmJ1ZmZlcn0sdWludDhhcnJheTpmdW5jdGlvbih0KXtyZXR1cm4gbmV3IFVpbnQ4QXJyYXkodCl9LG5vZGVidWZmZXI6ZnVuY3Rpb24odCl7cmV0dXJuIHIubmV3QnVmZmVyRnJvbSh0KX19LGMuYXJyYXlidWZmZXI9e3N0cmluZzpmdW5jdGlvbih0KXtyZXR1cm4gZihuZXcgVWludDhBcnJheSh0KSl9LGFycmF5OmZ1bmN0aW9uKHQpe3JldHVybiBkKG5ldyBVaW50OEFycmF5KHQpLG5ldyBBcnJheSh0LmJ5dGVMZW5ndGgpKX0sYXJyYXlidWZmZXI6bix1aW50OGFycmF5OmZ1bmN0aW9uKHQpe3JldHVybiBuZXcgVWludDhBcnJheSh0KX0sbm9kZWJ1ZmZlcjpmdW5jdGlvbih0KXtyZXR1cm4gci5uZXdCdWZmZXJGcm9tKG5ldyBVaW50OEFycmF5KHQpKX19LGMudWludDhhcnJheT17c3RyaW5nOmYsYXJyYXk6ZnVuY3Rpb24odCl7cmV0dXJuIGQodCxuZXcgQXJyYXkodC5sZW5ndGgpKX0sYXJyYXlidWZmZXI6ZnVuY3Rpb24odCl7cmV0dXJuIHQuYnVmZmVyfSx1aW50OGFycmF5Om4sbm9kZWJ1ZmZlcjpmdW5jdGlvbih0KXtyZXR1cm4gci5uZXdCdWZmZXJGcm9tKHQpfX0sYy5ub2RlYnVmZmVyPXtzdHJpbmc6ZixhcnJheTpmdW5jdGlvbih0KXtyZXR1cm4gZCh0LG5ldyBBcnJheSh0Lmxlbmd0aCkpfSxhcnJheWJ1ZmZlcjpmdW5jdGlvbih0KXtyZXR1cm4gYy5ub2RlYnVmZmVyLnVpbnQ4YXJyYXkodCkuYnVmZmVyfSx1aW50OGFycmF5OmZ1bmN0aW9uKHQpe3JldHVybiBkKHQsbmV3IFVpbnQ4QXJyYXkodC5sZW5ndGgpKX0sbm9kZWJ1ZmZlcjpufSxhLnRyYW5zZm9ybVRvPWZ1bmN0aW9uKHQsZSl7aWYoZT1lfHxcIlwiLCF0KXJldHVybiBlO2EuY2hlY2tTdXBwb3J0KHQpO3ZhciByPWEuZ2V0VHlwZU9mKGUpO3JldHVybiBjW3JdW3RdKGUpfSxhLmdldFR5cGVPZj1mdW5jdGlvbih0KXtyZXR1cm5cInN0cmluZ1wiPT10eXBlb2YgdD9cInN0cmluZ1wiOlwiW29iamVjdCBBcnJheV1cIj09PU9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0KT9cImFycmF5XCI6by5ub2RlYnVmZmVyJiZyLmlzQnVmZmVyKHQpP1wibm9kZWJ1ZmZlclwiOm8udWludDhhcnJheSYmdCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXk/XCJ1aW50OGFycmF5XCI6by5hcnJheWJ1ZmZlciYmdCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyP1wiYXJyYXlidWZmZXJcIjp2b2lkIDB9LGEuY2hlY2tTdXBwb3J0PWZ1bmN0aW9uKHQpe2lmKCFvW3QudG9Mb3dlckNhc2UoKV0pdGhyb3cgbmV3IEVycm9yKHQrXCIgaXMgbm90IHN1cHBvcnRlZCBieSB0aGlzIHBsYXRmb3JtXCIpfSxhLk1BWF9WQUxVRV8xNkJJVFM9NjU1MzUsYS5NQVhfVkFMVUVfMzJCSVRTPS0xLGEucHJldHR5PWZ1bmN0aW9uKHQpe3ZhciBlLHIsaT1cIlwiO2ZvcihyPTA7cjwodHx8XCJcIikubGVuZ3RoO3IrKylpKz1cIlxcXFx4XCIrKChlPXQuY2hhckNvZGVBdChyKSk8MTY/XCIwXCI6XCJcIikrZS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtyZXR1cm4gaX0sYS5kZWxheT1mdW5jdGlvbih0LGUscil7aShmdW5jdGlvbigpe3QuYXBwbHkocnx8bnVsbCxlfHxbXSl9KX0sYS5pbmhlcml0cz1mdW5jdGlvbih0LGUpe2Z1bmN0aW9uIHIoKXt9ci5wcm90b3R5cGU9ZS5wcm90b3R5cGUsdC5wcm90b3R5cGU9bmV3IHJ9LGEuZXh0ZW5kPWZ1bmN0aW9uKCl7dmFyIHQsZSxyPXt9O2Zvcih0PTA7dDxhcmd1bWVudHMubGVuZ3RoO3QrKylmb3IoZSBpbiBhcmd1bWVudHNbdF0pYXJndW1lbnRzW3RdLmhhc093blByb3BlcnR5KGUpJiZ2b2lkIDA9PT1yW2VdJiYocltlXT1hcmd1bWVudHNbdF1bZV0pO3JldHVybiByfSxhLnByZXBhcmVDb250ZW50PWZ1bmN0aW9uKHIsdCxpLG4scyl7cmV0dXJuIHUuUHJvbWlzZS5yZXNvbHZlKHQpLnRoZW4oZnVuY3Rpb24oaSl7cmV0dXJuIG8uYmxvYiYmKGkgaW5zdGFuY2VvZiBCbG9ifHwtMSE9PVtcIltvYmplY3QgRmlsZV1cIixcIltvYmplY3QgQmxvYl1cIl0uaW5kZXhPZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaSkpKSYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIEZpbGVSZWFkZXI/bmV3IHUuUHJvbWlzZShmdW5jdGlvbihlLHIpe3ZhciB0PW5ldyBGaWxlUmVhZGVyO3Qub25sb2FkPWZ1bmN0aW9uKHQpe2UodC50YXJnZXQucmVzdWx0KX0sdC5vbmVycm9yPWZ1bmN0aW9uKHQpe3IodC50YXJnZXQuZXJyb3IpfSx0LnJlYWRBc0FycmF5QnVmZmVyKGkpfSk6aX0pLnRoZW4oZnVuY3Rpb24odCl7dmFyIGU9YS5nZXRUeXBlT2YodCk7cmV0dXJuIGU/KFwiYXJyYXlidWZmZXJcIj09PWU/dD1hLnRyYW5zZm9ybVRvKFwidWludDhhcnJheVwiLHQpOlwic3RyaW5nXCI9PT1lJiYocz90PWguZGVjb2RlKHQpOmkmJiEwIT09biYmKHQ9ZnVuY3Rpb24odCl7cmV0dXJuIGwodCxvLnVpbnQ4YXJyYXk/bmV3IFVpbnQ4QXJyYXkodC5sZW5ndGgpOm5ldyBBcnJheSh0Lmxlbmd0aCkpfSh0KSkpLHQpOnUuUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiQ2FuJ3QgcmVhZCB0aGUgZGF0YSBvZiAnXCIrcitcIicuIElzIGl0IGluIGEgc3VwcG9ydGVkIEphdmFTY3JpcHQgdHlwZSAoU3RyaW5nLCBCbG9iLCBBcnJheUJ1ZmZlciwgZXRjKSA/XCIpKX0pfX0se1wiLi9iYXNlNjRcIjoxLFwiLi9leHRlcm5hbFwiOjYsXCIuL25vZGVqc1V0aWxzXCI6MTQsXCIuL3N1cHBvcnRcIjozMCxcInNldC1pbW1lZGlhdGUtc2hpbVwiOjU0fV0sMzM6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi9yZWFkZXIvcmVhZGVyRm9yXCIpLG49dChcIi4vdXRpbHNcIikscz10KFwiLi9zaWduYXR1cmVcIiksYT10KFwiLi96aXBFbnRyeVwiKSxvPSh0KFwiLi91dGY4XCIpLHQoXCIuL3N1cHBvcnRcIikpO2Z1bmN0aW9uIGgodCl7dGhpcy5maWxlcz1bXSx0aGlzLmxvYWRPcHRpb25zPXR9aC5wcm90b3R5cGU9e2NoZWNrU2lnbmF0dXJlOmZ1bmN0aW9uKHQpe2lmKCF0aGlzLnJlYWRlci5yZWFkQW5kQ2hlY2tTaWduYXR1cmUodCkpe3RoaXMucmVhZGVyLmluZGV4LT00O3ZhciBlPXRoaXMucmVhZGVyLnJlYWRTdHJpbmcoNCk7dGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcCBvciBidWc6IHVuZXhwZWN0ZWQgc2lnbmF0dXJlIChcIituLnByZXR0eShlKStcIiwgZXhwZWN0ZWQgXCIrbi5wcmV0dHkodCkrXCIpXCIpfX0saXNTaWduYXR1cmU6ZnVuY3Rpb24odCxlKXt2YXIgcj10aGlzLnJlYWRlci5pbmRleDt0aGlzLnJlYWRlci5zZXRJbmRleCh0KTt2YXIgaT10aGlzLnJlYWRlci5yZWFkU3RyaW5nKDQpPT09ZTtyZXR1cm4gdGhpcy5yZWFkZXIuc2V0SW5kZXgociksaX0scmVhZEJsb2NrRW5kT2ZDZW50cmFsOmZ1bmN0aW9uKCl7dGhpcy5kaXNrTnVtYmVyPXRoaXMucmVhZGVyLnJlYWRJbnQoMiksdGhpcy5kaXNrV2l0aENlbnRyYWxEaXJTdGFydD10aGlzLnJlYWRlci5yZWFkSW50KDIpLHRoaXMuY2VudHJhbERpclJlY29yZHNPblRoaXNEaXNrPXRoaXMucmVhZGVyLnJlYWRJbnQoMiksdGhpcy5jZW50cmFsRGlyUmVjb3Jkcz10aGlzLnJlYWRlci5yZWFkSW50KDIpLHRoaXMuY2VudHJhbERpclNpemU9dGhpcy5yZWFkZXIucmVhZEludCg0KSx0aGlzLmNlbnRyYWxEaXJPZmZzZXQ9dGhpcy5yZWFkZXIucmVhZEludCg0KSx0aGlzLnppcENvbW1lbnRMZW5ndGg9dGhpcy5yZWFkZXIucmVhZEludCgyKTt2YXIgdD10aGlzLnJlYWRlci5yZWFkRGF0YSh0aGlzLnppcENvbW1lbnRMZW5ndGgpLGU9by51aW50OGFycmF5P1widWludDhhcnJheVwiOlwiYXJyYXlcIixyPW4udHJhbnNmb3JtVG8oZSx0KTt0aGlzLnppcENvbW1lbnQ9dGhpcy5sb2FkT3B0aW9ucy5kZWNvZGVGaWxlTmFtZShyKX0scmVhZEJsb2NrWmlwNjRFbmRPZkNlbnRyYWw6ZnVuY3Rpb24oKXt0aGlzLnppcDY0RW5kT2ZDZW50cmFsU2l6ZT10aGlzLnJlYWRlci5yZWFkSW50KDgpLHRoaXMucmVhZGVyLnNraXAoNCksdGhpcy5kaXNrTnVtYmVyPXRoaXMucmVhZGVyLnJlYWRJbnQoNCksdGhpcy5kaXNrV2l0aENlbnRyYWxEaXJTdGFydD10aGlzLnJlYWRlci5yZWFkSW50KDQpLHRoaXMuY2VudHJhbERpclJlY29yZHNPblRoaXNEaXNrPXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy5jZW50cmFsRGlyUmVjb3Jkcz10aGlzLnJlYWRlci5yZWFkSW50KDgpLHRoaXMuY2VudHJhbERpclNpemU9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLmNlbnRyYWxEaXJPZmZzZXQ9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLnppcDY0RXh0ZW5zaWJsZURhdGE9e307Zm9yKHZhciB0LGUscixpPXRoaXMuemlwNjRFbmRPZkNlbnRyYWxTaXplLTQ0OzA8aTspdD10aGlzLnJlYWRlci5yZWFkSW50KDIpLGU9dGhpcy5yZWFkZXIucmVhZEludCg0KSxyPXRoaXMucmVhZGVyLnJlYWREYXRhKGUpLHRoaXMuemlwNjRFeHRlbnNpYmxlRGF0YVt0XT17aWQ6dCxsZW5ndGg6ZSx2YWx1ZTpyfX0scmVhZEJsb2NrWmlwNjRFbmRPZkNlbnRyYWxMb2NhdG9yOmZ1bmN0aW9uKCl7aWYodGhpcy5kaXNrV2l0aFppcDY0Q2VudHJhbERpclN0YXJ0PXRoaXMucmVhZGVyLnJlYWRJbnQoNCksdGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyPXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy5kaXNrc0NvdW50PXRoaXMucmVhZGVyLnJlYWRJbnQoNCksMTx0aGlzLmRpc2tzQ291bnQpdGhyb3cgbmV3IEVycm9yKFwiTXVsdGktdm9sdW1lcyB6aXAgYXJlIG5vdCBzdXBwb3J0ZWRcIil9LHJlYWRMb2NhbEZpbGVzOmZ1bmN0aW9uKCl7dmFyIHQsZTtmb3IodD0wO3Q8dGhpcy5maWxlcy5sZW5ndGg7dCsrKWU9dGhpcy5maWxlc1t0XSx0aGlzLnJlYWRlci5zZXRJbmRleChlLmxvY2FsSGVhZGVyT2Zmc2V0KSx0aGlzLmNoZWNrU2lnbmF0dXJlKHMuTE9DQUxfRklMRV9IRUFERVIpLGUucmVhZExvY2FsUGFydCh0aGlzLnJlYWRlciksZS5oYW5kbGVVVEY4KCksZS5wcm9jZXNzQXR0cmlidXRlcygpfSxyZWFkQ2VudHJhbERpcjpmdW5jdGlvbigpe3ZhciB0O2Zvcih0aGlzLnJlYWRlci5zZXRJbmRleCh0aGlzLmNlbnRyYWxEaXJPZmZzZXQpO3RoaXMucmVhZGVyLnJlYWRBbmRDaGVja1NpZ25hdHVyZShzLkNFTlRSQUxfRklMRV9IRUFERVIpOykodD1uZXcgYSh7emlwNjQ6dGhpcy56aXA2NH0sdGhpcy5sb2FkT3B0aW9ucykpLnJlYWRDZW50cmFsUGFydCh0aGlzLnJlYWRlciksdGhpcy5maWxlcy5wdXNoKHQpO2lmKHRoaXMuY2VudHJhbERpclJlY29yZHMhPT10aGlzLmZpbGVzLmxlbmd0aCYmMCE9PXRoaXMuY2VudHJhbERpclJlY29yZHMmJjA9PT10aGlzLmZpbGVzLmxlbmd0aCl0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwIG9yIGJ1ZzogZXhwZWN0ZWQgXCIrdGhpcy5jZW50cmFsRGlyUmVjb3JkcytcIiByZWNvcmRzIGluIGNlbnRyYWwgZGlyLCBnb3QgXCIrdGhpcy5maWxlcy5sZW5ndGgpfSxyZWFkRW5kT2ZDZW50cmFsOmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy5yZWFkZXIubGFzdEluZGV4T2ZTaWduYXR1cmUocy5DRU5UUkFMX0RJUkVDVE9SWV9FTkQpO2lmKHQ8MCl0aHJvdyF0aGlzLmlzU2lnbmF0dXJlKDAscy5MT0NBTF9GSUxFX0hFQURFUik/bmV3IEVycm9yKFwiQ2FuJ3QgZmluZCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgOiBpcyB0aGlzIGEgemlwIGZpbGUgPyBJZiBpdCBpcywgc2VlIGh0dHBzOi8vc3R1ay5naXRodWIuaW8vanN6aXAvZG9jdW1lbnRhdGlvbi9ob3d0by9yZWFkX3ppcC5odG1sXCIpOm5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXA6IGNhbid0IGZpbmQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5XCIpO3RoaXMucmVhZGVyLnNldEluZGV4KHQpO3ZhciBlPXQ7aWYodGhpcy5jaGVja1NpZ25hdHVyZShzLkNFTlRSQUxfRElSRUNUT1JZX0VORCksdGhpcy5yZWFkQmxvY2tFbmRPZkNlbnRyYWwoKSx0aGlzLmRpc2tOdW1iZXI9PT1uLk1BWF9WQUxVRV8xNkJJVFN8fHRoaXMuZGlza1dpdGhDZW50cmFsRGlyU3RhcnQ9PT1uLk1BWF9WQUxVRV8xNkJJVFN8fHRoaXMuY2VudHJhbERpclJlY29yZHNPblRoaXNEaXNrPT09bi5NQVhfVkFMVUVfMTZCSVRTfHx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzPT09bi5NQVhfVkFMVUVfMTZCSVRTfHx0aGlzLmNlbnRyYWxEaXJTaXplPT09bi5NQVhfVkFMVUVfMzJCSVRTfHx0aGlzLmNlbnRyYWxEaXJPZmZzZXQ9PT1uLk1BWF9WQUxVRV8zMkJJVFMpe2lmKHRoaXMuemlwNjQ9ITAsKHQ9dGhpcy5yZWFkZXIubGFzdEluZGV4T2ZTaWduYXR1cmUocy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9MT0NBVE9SKSk8MCl0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwOiBjYW4ndCBmaW5kIHRoZSBaSVA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgbG9jYXRvclwiKTtpZih0aGlzLnJlYWRlci5zZXRJbmRleCh0KSx0aGlzLmNoZWNrU2lnbmF0dXJlKHMuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfTE9DQVRPUiksdGhpcy5yZWFkQmxvY2taaXA2NEVuZE9mQ2VudHJhbExvY2F0b3IoKSwhdGhpcy5pc1NpZ25hdHVyZSh0aGlzLnJlbGF0aXZlT2Zmc2V0RW5kT2ZaaXA2NENlbnRyYWxEaXIscy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9FTkQpJiYodGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyPXRoaXMucmVhZGVyLmxhc3RJbmRleE9mU2lnbmF0dXJlKHMuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfRU5EKSx0aGlzLnJlbGF0aXZlT2Zmc2V0RW5kT2ZaaXA2NENlbnRyYWxEaXI8MCkpdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcDogY2FuJ3QgZmluZCB0aGUgWklQNjQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5XCIpO3RoaXMucmVhZGVyLnNldEluZGV4KHRoaXMucmVsYXRpdmVPZmZzZXRFbmRPZlppcDY0Q2VudHJhbERpciksdGhpcy5jaGVja1NpZ25hdHVyZShzLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0VORCksdGhpcy5yZWFkQmxvY2taaXA2NEVuZE9mQ2VudHJhbCgpfXZhciByPXRoaXMuY2VudHJhbERpck9mZnNldCt0aGlzLmNlbnRyYWxEaXJTaXplO3RoaXMuemlwNjQmJihyKz0yMCxyKz0xMit0aGlzLnppcDY0RW5kT2ZDZW50cmFsU2l6ZSk7dmFyIGk9ZS1yO2lmKDA8aSl0aGlzLmlzU2lnbmF0dXJlKGUscy5DRU5UUkFMX0ZJTEVfSEVBREVSKXx8KHRoaXMucmVhZGVyLnplcm89aSk7ZWxzZSBpZihpPDApdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcDogbWlzc2luZyBcIitNYXRoLmFicyhpKStcIiBieXRlcy5cIil9LHByZXBhcmVSZWFkZXI6ZnVuY3Rpb24odCl7dGhpcy5yZWFkZXI9aSh0KX0sbG9hZDpmdW5jdGlvbih0KXt0aGlzLnByZXBhcmVSZWFkZXIodCksdGhpcy5yZWFkRW5kT2ZDZW50cmFsKCksdGhpcy5yZWFkQ2VudHJhbERpcigpLHRoaXMucmVhZExvY2FsRmlsZXMoKX19LGUuZXhwb3J0cz1ofSx7XCIuL3JlYWRlci9yZWFkZXJGb3JcIjoyMixcIi4vc2lnbmF0dXJlXCI6MjMsXCIuL3N1cHBvcnRcIjozMCxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyLFwiLi96aXBFbnRyeVwiOjM0fV0sMzQ6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi9yZWFkZXIvcmVhZGVyRm9yXCIpLHM9dChcIi4vdXRpbHNcIiksbj10KFwiLi9jb21wcmVzc2VkT2JqZWN0XCIpLGE9dChcIi4vY3JjMzJcIiksbz10KFwiLi91dGY4XCIpLGg9dChcIi4vY29tcHJlc3Npb25zXCIpLHU9dChcIi4vc3VwcG9ydFwiKTtmdW5jdGlvbiBsKHQsZSl7dGhpcy5vcHRpb25zPXQsdGhpcy5sb2FkT3B0aW9ucz1lfWwucHJvdG90eXBlPXtpc0VuY3J5cHRlZDpmdW5jdGlvbigpe3JldHVybiAxPT0oMSZ0aGlzLmJpdEZsYWcpfSx1c2VVVEY4OmZ1bmN0aW9uKCl7cmV0dXJuIDIwNDg9PSgyMDQ4JnRoaXMuYml0RmxhZyl9LHJlYWRMb2NhbFBhcnQ6ZnVuY3Rpb24odCl7dmFyIGUscjtpZih0LnNraXAoMjIpLHRoaXMuZmlsZU5hbWVMZW5ndGg9dC5yZWFkSW50KDIpLHI9dC5yZWFkSW50KDIpLHRoaXMuZmlsZU5hbWU9dC5yZWFkRGF0YSh0aGlzLmZpbGVOYW1lTGVuZ3RoKSx0LnNraXAociksLTE9PT10aGlzLmNvbXByZXNzZWRTaXplfHwtMT09PXRoaXMudW5jb21wcmVzc2VkU2l6ZSl0aHJvdyBuZXcgRXJyb3IoXCJCdWcgb3IgY29ycnVwdGVkIHppcCA6IGRpZG4ndCBnZXQgZW5vdWdoIGluZm9ybWF0aW9uIGZyb20gdGhlIGNlbnRyYWwgZGlyZWN0b3J5IChjb21wcmVzc2VkU2l6ZSA9PT0gLTEgfHwgdW5jb21wcmVzc2VkU2l6ZSA9PT0gLTEpXCIpO2lmKG51bGw9PT0oZT1mdW5jdGlvbih0KXtmb3IodmFyIGUgaW4gaClpZihoLmhhc093blByb3BlcnR5KGUpJiZoW2VdLm1hZ2ljPT09dClyZXR1cm4gaFtlXTtyZXR1cm4gbnVsbH0odGhpcy5jb21wcmVzc2lvbk1ldGhvZCkpKXRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXAgOiBjb21wcmVzc2lvbiBcIitzLnByZXR0eSh0aGlzLmNvbXByZXNzaW9uTWV0aG9kKStcIiB1bmtub3duIChpbm5lciBmaWxlIDogXCIrcy50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLHRoaXMuZmlsZU5hbWUpK1wiKVwiKTt0aGlzLmRlY29tcHJlc3NlZD1uZXcgbih0aGlzLmNvbXByZXNzZWRTaXplLHRoaXMudW5jb21wcmVzc2VkU2l6ZSx0aGlzLmNyYzMyLGUsdC5yZWFkRGF0YSh0aGlzLmNvbXByZXNzZWRTaXplKSl9LHJlYWRDZW50cmFsUGFydDpmdW5jdGlvbih0KXt0aGlzLnZlcnNpb25NYWRlQnk9dC5yZWFkSW50KDIpLHQuc2tpcCgyKSx0aGlzLmJpdEZsYWc9dC5yZWFkSW50KDIpLHRoaXMuY29tcHJlc3Npb25NZXRob2Q9dC5yZWFkU3RyaW5nKDIpLHRoaXMuZGF0ZT10LnJlYWREYXRlKCksdGhpcy5jcmMzMj10LnJlYWRJbnQoNCksdGhpcy5jb21wcmVzc2VkU2l6ZT10LnJlYWRJbnQoNCksdGhpcy51bmNvbXByZXNzZWRTaXplPXQucmVhZEludCg0KTt2YXIgZT10LnJlYWRJbnQoMik7aWYodGhpcy5leHRyYUZpZWxkc0xlbmd0aD10LnJlYWRJbnQoMiksdGhpcy5maWxlQ29tbWVudExlbmd0aD10LnJlYWRJbnQoMiksdGhpcy5kaXNrTnVtYmVyU3RhcnQ9dC5yZWFkSW50KDIpLHRoaXMuaW50ZXJuYWxGaWxlQXR0cmlidXRlcz10LnJlYWRJbnQoMiksdGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzPXQucmVhZEludCg0KSx0aGlzLmxvY2FsSGVhZGVyT2Zmc2V0PXQucmVhZEludCg0KSx0aGlzLmlzRW5jcnlwdGVkKCkpdGhyb3cgbmV3IEVycm9yKFwiRW5jcnlwdGVkIHppcCBhcmUgbm90IHN1cHBvcnRlZFwiKTt0LnNraXAoZSksdGhpcy5yZWFkRXh0cmFGaWVsZHModCksdGhpcy5wYXJzZVpJUDY0RXh0cmFGaWVsZCh0KSx0aGlzLmZpbGVDb21tZW50PXQucmVhZERhdGEodGhpcy5maWxlQ29tbWVudExlbmd0aCl9LHByb2Nlc3NBdHRyaWJ1dGVzOmZ1bmN0aW9uKCl7dGhpcy51bml4UGVybWlzc2lvbnM9bnVsbCx0aGlzLmRvc1Blcm1pc3Npb25zPW51bGw7dmFyIHQ9dGhpcy52ZXJzaW9uTWFkZUJ5Pj44O3RoaXMuZGlyPSEhKDE2JnRoaXMuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcyksMD09dCYmKHRoaXMuZG9zUGVybWlzc2lvbnM9NjMmdGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzKSwzPT10JiYodGhpcy51bml4UGVybWlzc2lvbnM9dGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzPj4xNiY2NTUzNSksdGhpcy5kaXJ8fFwiL1wiIT09dGhpcy5maWxlTmFtZVN0ci5zbGljZSgtMSl8fCh0aGlzLmRpcj0hMCl9LHBhcnNlWklQNjRFeHRyYUZpZWxkOmZ1bmN0aW9uKHQpe2lmKHRoaXMuZXh0cmFGaWVsZHNbMV0pe3ZhciBlPWkodGhpcy5leHRyYUZpZWxkc1sxXS52YWx1ZSk7dGhpcy51bmNvbXByZXNzZWRTaXplPT09cy5NQVhfVkFMVUVfMzJCSVRTJiYodGhpcy51bmNvbXByZXNzZWRTaXplPWUucmVhZEludCg4KSksdGhpcy5jb21wcmVzc2VkU2l6ZT09PXMuTUFYX1ZBTFVFXzMyQklUUyYmKHRoaXMuY29tcHJlc3NlZFNpemU9ZS5yZWFkSW50KDgpKSx0aGlzLmxvY2FsSGVhZGVyT2Zmc2V0PT09cy5NQVhfVkFMVUVfMzJCSVRTJiYodGhpcy5sb2NhbEhlYWRlck9mZnNldD1lLnJlYWRJbnQoOCkpLHRoaXMuZGlza051bWJlclN0YXJ0PT09cy5NQVhfVkFMVUVfMzJCSVRTJiYodGhpcy5kaXNrTnVtYmVyU3RhcnQ9ZS5yZWFkSW50KDQpKX19LHJlYWRFeHRyYUZpZWxkczpmdW5jdGlvbih0KXt2YXIgZSxyLGksbj10LmluZGV4K3RoaXMuZXh0cmFGaWVsZHNMZW5ndGg7Zm9yKHRoaXMuZXh0cmFGaWVsZHN8fCh0aGlzLmV4dHJhRmllbGRzPXt9KTt0LmluZGV4KzQ8bjspZT10LnJlYWRJbnQoMikscj10LnJlYWRJbnQoMiksaT10LnJlYWREYXRhKHIpLHRoaXMuZXh0cmFGaWVsZHNbZV09e2lkOmUsbGVuZ3RoOnIsdmFsdWU6aX07dC5zZXRJbmRleChuKX0saGFuZGxlVVRGODpmdW5jdGlvbigpe3ZhciB0PXUudWludDhhcnJheT9cInVpbnQ4YXJyYXlcIjpcImFycmF5XCI7aWYodGhpcy51c2VVVEY4KCkpdGhpcy5maWxlTmFtZVN0cj1vLnV0ZjhkZWNvZGUodGhpcy5maWxlTmFtZSksdGhpcy5maWxlQ29tbWVudFN0cj1vLnV0ZjhkZWNvZGUodGhpcy5maWxlQ29tbWVudCk7ZWxzZXt2YXIgZT10aGlzLmZpbmRFeHRyYUZpZWxkVW5pY29kZVBhdGgoKTtpZihudWxsIT09ZSl0aGlzLmZpbGVOYW1lU3RyPWU7ZWxzZXt2YXIgcj1zLnRyYW5zZm9ybVRvKHQsdGhpcy5maWxlTmFtZSk7dGhpcy5maWxlTmFtZVN0cj10aGlzLmxvYWRPcHRpb25zLmRlY29kZUZpbGVOYW1lKHIpfXZhciBpPXRoaXMuZmluZEV4dHJhRmllbGRVbmljb2RlQ29tbWVudCgpO2lmKG51bGwhPT1pKXRoaXMuZmlsZUNvbW1lbnRTdHI9aTtlbHNle3ZhciBuPXMudHJhbnNmb3JtVG8odCx0aGlzLmZpbGVDb21tZW50KTt0aGlzLmZpbGVDb21tZW50U3RyPXRoaXMubG9hZE9wdGlvbnMuZGVjb2RlRmlsZU5hbWUobil9fX0sZmluZEV4dHJhRmllbGRVbmljb2RlUGF0aDpmdW5jdGlvbigpe3ZhciB0PXRoaXMuZXh0cmFGaWVsZHNbMjg3ODldO2lmKHQpe3ZhciBlPWkodC52YWx1ZSk7cmV0dXJuIDEhPT1lLnJlYWRJbnQoMSk/bnVsbDphKHRoaXMuZmlsZU5hbWUpIT09ZS5yZWFkSW50KDQpP251bGw6by51dGY4ZGVjb2RlKGUucmVhZERhdGEodC5sZW5ndGgtNSkpfXJldHVybiBudWxsfSxmaW5kRXh0cmFGaWVsZFVuaWNvZGVDb21tZW50OmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy5leHRyYUZpZWxkc1syNTQ2MV07aWYodCl7dmFyIGU9aSh0LnZhbHVlKTtyZXR1cm4gMSE9PWUucmVhZEludCgxKT9udWxsOmEodGhpcy5maWxlQ29tbWVudCkhPT1lLnJlYWRJbnQoNCk/bnVsbDpvLnV0ZjhkZWNvZGUoZS5yZWFkRGF0YSh0Lmxlbmd0aC01KSl9cmV0dXJuIG51bGx9fSxlLmV4cG9ydHM9bH0se1wiLi9jb21wcmVzc2VkT2JqZWN0XCI6MixcIi4vY29tcHJlc3Npb25zXCI6MyxcIi4vY3JjMzJcIjo0LFwiLi9yZWFkZXIvcmVhZGVyRm9yXCI6MjIsXCIuL3N1cHBvcnRcIjozMCxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyfV0sMzU6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBpKHQsZSxyKXt0aGlzLm5hbWU9dCx0aGlzLmRpcj1yLmRpcix0aGlzLmRhdGU9ci5kYXRlLHRoaXMuY29tbWVudD1yLmNvbW1lbnQsdGhpcy51bml4UGVybWlzc2lvbnM9ci51bml4UGVybWlzc2lvbnMsdGhpcy5kb3NQZXJtaXNzaW9ucz1yLmRvc1Blcm1pc3Npb25zLHRoaXMuX2RhdGE9ZSx0aGlzLl9kYXRhQmluYXJ5PXIuYmluYXJ5LHRoaXMub3B0aW9ucz17Y29tcHJlc3Npb246ci5jb21wcmVzc2lvbixjb21wcmVzc2lvbk9wdGlvbnM6ci5jb21wcmVzc2lvbk9wdGlvbnN9fXZhciBzPXQoXCIuL3N0cmVhbS9TdHJlYW1IZWxwZXJcIiksbj10KFwiLi9zdHJlYW0vRGF0YVdvcmtlclwiKSxhPXQoXCIuL3V0ZjhcIiksbz10KFwiLi9jb21wcmVzc2VkT2JqZWN0XCIpLGg9dChcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIik7aS5wcm90b3R5cGU9e2ludGVybmFsU3RyZWFtOmZ1bmN0aW9uKHQpe3ZhciBlPW51bGwscj1cInN0cmluZ1wiO3RyeXtpZighdCl0aHJvdyBuZXcgRXJyb3IoXCJObyBvdXRwdXQgdHlwZSBzcGVjaWZpZWQuXCIpO3ZhciBpPVwic3RyaW5nXCI9PT0ocj10LnRvTG93ZXJDYXNlKCkpfHxcInRleHRcIj09PXI7XCJiaW5hcnlzdHJpbmdcIiE9PXImJlwidGV4dFwiIT09cnx8KHI9XCJzdHJpbmdcIiksZT10aGlzLl9kZWNvbXByZXNzV29ya2VyKCk7dmFyIG49IXRoaXMuX2RhdGFCaW5hcnk7biYmIWkmJihlPWUucGlwZShuZXcgYS5VdGY4RW5jb2RlV29ya2VyKSksIW4mJmkmJihlPWUucGlwZShuZXcgYS5VdGY4RGVjb2RlV29ya2VyKSl9Y2F0Y2godCl7KGU9bmV3IGgoXCJlcnJvclwiKSkuZXJyb3IodCl9cmV0dXJuIG5ldyBzKGUscixcIlwiKX0sYXN5bmM6ZnVuY3Rpb24odCxlKXtyZXR1cm4gdGhpcy5pbnRlcm5hbFN0cmVhbSh0KS5hY2N1bXVsYXRlKGUpfSxub2RlU3RyZWFtOmZ1bmN0aW9uKHQsZSl7cmV0dXJuIHRoaXMuaW50ZXJuYWxTdHJlYW0odHx8XCJub2RlYnVmZmVyXCIpLnRvTm9kZWpzU3RyZWFtKGUpfSxfY29tcHJlc3NXb3JrZXI6ZnVuY3Rpb24odCxlKXtpZih0aGlzLl9kYXRhIGluc3RhbmNlb2YgbyYmdGhpcy5fZGF0YS5jb21wcmVzc2lvbi5tYWdpYz09PXQubWFnaWMpcmV0dXJuIHRoaXMuX2RhdGEuZ2V0Q29tcHJlc3NlZFdvcmtlcigpO3ZhciByPXRoaXMuX2RlY29tcHJlc3NXb3JrZXIoKTtyZXR1cm4gdGhpcy5fZGF0YUJpbmFyeXx8KHI9ci5waXBlKG5ldyBhLlV0ZjhFbmNvZGVXb3JrZXIpKSxvLmNyZWF0ZVdvcmtlckZyb20ocix0LGUpfSxfZGVjb21wcmVzc1dvcmtlcjpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9kYXRhIGluc3RhbmNlb2Ygbz90aGlzLl9kYXRhLmdldENvbnRlbnRXb3JrZXIoKTp0aGlzLl9kYXRhIGluc3RhbmNlb2YgaD90aGlzLl9kYXRhOm5ldyBuKHRoaXMuX2RhdGEpfX07Zm9yKHZhciB1PVtcImFzVGV4dFwiLFwiYXNCaW5hcnlcIixcImFzTm9kZUJ1ZmZlclwiLFwiYXNVaW50OEFycmF5XCIsXCJhc0FycmF5QnVmZmVyXCJdLGw9ZnVuY3Rpb24oKXt0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLlwiKX0sZj0wO2Y8dS5sZW5ndGg7ZisrKWkucHJvdG90eXBlW3VbZl1dPWw7ZS5leHBvcnRzPWl9LHtcIi4vY29tcHJlc3NlZE9iamVjdFwiOjIsXCIuL3N0cmVhbS9EYXRhV29ya2VyXCI6MjcsXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuL3N0cmVhbS9TdHJlYW1IZWxwZXJcIjoyOSxcIi4vdXRmOFwiOjMxfV0sMzY6W2Z1bmN0aW9uKHQsbCxlKXsoZnVuY3Rpb24oZSl7XCJ1c2Ugc3RyaWN0XCI7dmFyIHIsaSx0PWUuTXV0YXRpb25PYnNlcnZlcnx8ZS5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO2lmKHQpe3ZhciBuPTAscz1uZXcgdCh1KSxhPWUuZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7cy5vYnNlcnZlKGEse2NoYXJhY3RlckRhdGE6ITB9KSxyPWZ1bmN0aW9uKCl7YS5kYXRhPW49KytuJTJ9fWVsc2UgaWYoZS5zZXRJbW1lZGlhdGV8fHZvaWQgMD09PWUuTWVzc2FnZUNoYW5uZWwpcj1cImRvY3VtZW50XCJpbiBlJiZcIm9ucmVhZHlzdGF0ZWNoYW5nZVwiaW4gZS5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpP2Z1bmN0aW9uKCl7dmFyIHQ9ZS5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2NyaXB0XCIpO3Qub25yZWFkeXN0YXRlY2hhbmdlPWZ1bmN0aW9uKCl7dSgpLHQub25yZWFkeXN0YXRlY2hhbmdlPW51bGwsdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHQpLHQ9bnVsbH0sZS5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXBwZW5kQ2hpbGQodCl9OmZ1bmN0aW9uKCl7c2V0VGltZW91dCh1LDApfTtlbHNle3ZhciBvPW5ldyBlLk1lc3NhZ2VDaGFubmVsO28ucG9ydDEub25tZXNzYWdlPXUscj1mdW5jdGlvbigpe28ucG9ydDIucG9zdE1lc3NhZ2UoMCl9fXZhciBoPVtdO2Z1bmN0aW9uIHUoKXt2YXIgdCxlO2k9ITA7Zm9yKHZhciByPWgubGVuZ3RoO3I7KXtmb3IoZT1oLGg9W10sdD0tMTsrK3Q8cjspZVt0XSgpO3I9aC5sZW5ndGh9aT0hMX1sLmV4cG9ydHM9ZnVuY3Rpb24odCl7MSE9PWgucHVzaCh0KXx8aXx8cigpfX0pLmNhbGwodGhpcyxcInVuZGVmaW5lZFwiIT10eXBlb2YgZ2xvYmFsP2dsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZj9zZWxmOlwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93Ont9KX0se31dLDM3OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG49dChcImltbWVkaWF0ZVwiKTtmdW5jdGlvbiB1KCl7fXZhciBsPXt9LHM9W1wiUkVKRUNURURcIl0sYT1bXCJGVUxGSUxMRURcIl0saT1bXCJQRU5ESU5HXCJdO2Z1bmN0aW9uIG8odCl7aWYoXCJmdW5jdGlvblwiIT10eXBlb2YgdCl0aHJvdyBuZXcgVHlwZUVycm9yKFwicmVzb2x2ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uXCIpO3RoaXMuc3RhdGU9aSx0aGlzLnF1ZXVlPVtdLHRoaXMub3V0Y29tZT12b2lkIDAsdCE9PXUmJmModGhpcyx0KX1mdW5jdGlvbiBoKHQsZSxyKXt0aGlzLnByb21pc2U9dCxcImZ1bmN0aW9uXCI9PXR5cGVvZiBlJiYodGhpcy5vbkZ1bGZpbGxlZD1lLHRoaXMuY2FsbEZ1bGZpbGxlZD10aGlzLm90aGVyQ2FsbEZ1bGZpbGxlZCksXCJmdW5jdGlvblwiPT10eXBlb2YgciYmKHRoaXMub25SZWplY3RlZD1yLHRoaXMuY2FsbFJlamVjdGVkPXRoaXMub3RoZXJDYWxsUmVqZWN0ZWQpfWZ1bmN0aW9uIGYoZSxyLGkpe24oZnVuY3Rpb24oKXt2YXIgdDt0cnl7dD1yKGkpfWNhdGNoKHQpe3JldHVybiBsLnJlamVjdChlLHQpfXQ9PT1lP2wucmVqZWN0KGUsbmV3IFR5cGVFcnJvcihcIkNhbm5vdCByZXNvbHZlIHByb21pc2Ugd2l0aCBpdHNlbGZcIikpOmwucmVzb2x2ZShlLHQpfSl9ZnVuY3Rpb24gZCh0KXt2YXIgZT10JiZ0LnRoZW47aWYodCYmKFwib2JqZWN0XCI9PXR5cGVvZiB0fHxcImZ1bmN0aW9uXCI9PXR5cGVvZiB0KSYmXCJmdW5jdGlvblwiPT10eXBlb2YgZSlyZXR1cm4gZnVuY3Rpb24oKXtlLmFwcGx5KHQsYXJndW1lbnRzKX19ZnVuY3Rpb24gYyhlLHQpe3ZhciByPSExO2Z1bmN0aW9uIGkodCl7cnx8KHI9ITAsbC5yZWplY3QoZSx0KSl9ZnVuY3Rpb24gbih0KXtyfHwocj0hMCxsLnJlc29sdmUoZSx0KSl9dmFyIHM9cChmdW5jdGlvbigpe3QobixpKX0pO1wiZXJyb3JcIj09PXMuc3RhdHVzJiZpKHMudmFsdWUpfWZ1bmN0aW9uIHAodCxlKXt2YXIgcj17fTt0cnl7ci52YWx1ZT10KGUpLHIuc3RhdHVzPVwic3VjY2Vzc1wifWNhdGNoKHQpe3Iuc3RhdHVzPVwiZXJyb3JcIixyLnZhbHVlPXR9cmV0dXJuIHJ9KGUuZXhwb3J0cz1vKS5wcm90b3R5cGUuZmluYWxseT1mdW5jdGlvbihlKXtpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiBlKXJldHVybiB0aGlzO3ZhciByPXRoaXMuY29uc3RydWN0b3I7cmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbih0KXtyZXR1cm4gci5yZXNvbHZlKGUoKSkudGhlbihmdW5jdGlvbigpe3JldHVybiB0fSl9LGZ1bmN0aW9uKHQpe3JldHVybiByLnJlc29sdmUoZSgpKS50aGVuKGZ1bmN0aW9uKCl7dGhyb3cgdH0pfSl9LG8ucHJvdG90eXBlLmNhdGNoPWZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLnRoZW4obnVsbCx0KX0sby5wcm90b3R5cGUudGhlbj1mdW5jdGlvbih0LGUpe2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIHQmJnRoaXMuc3RhdGU9PT1hfHxcImZ1bmN0aW9uXCIhPXR5cGVvZiBlJiZ0aGlzLnN0YXRlPT09cylyZXR1cm4gdGhpczt2YXIgcj1uZXcgdGhpcy5jb25zdHJ1Y3Rvcih1KTt0aGlzLnN0YXRlIT09aT9mKHIsdGhpcy5zdGF0ZT09PWE/dDplLHRoaXMub3V0Y29tZSk6dGhpcy5xdWV1ZS5wdXNoKG5ldyBoKHIsdCxlKSk7cmV0dXJuIHJ9LGgucHJvdG90eXBlLmNhbGxGdWxmaWxsZWQ9ZnVuY3Rpb24odCl7bC5yZXNvbHZlKHRoaXMucHJvbWlzZSx0KX0saC5wcm90b3R5cGUub3RoZXJDYWxsRnVsZmlsbGVkPWZ1bmN0aW9uKHQpe2YodGhpcy5wcm9taXNlLHRoaXMub25GdWxmaWxsZWQsdCl9LGgucHJvdG90eXBlLmNhbGxSZWplY3RlZD1mdW5jdGlvbih0KXtsLnJlamVjdCh0aGlzLnByb21pc2UsdCl9LGgucHJvdG90eXBlLm90aGVyQ2FsbFJlamVjdGVkPWZ1bmN0aW9uKHQpe2YodGhpcy5wcm9taXNlLHRoaXMub25SZWplY3RlZCx0KX0sbC5yZXNvbHZlPWZ1bmN0aW9uKHQsZSl7dmFyIHI9cChkLGUpO2lmKFwiZXJyb3JcIj09PXIuc3RhdHVzKXJldHVybiBsLnJlamVjdCh0LHIudmFsdWUpO3ZhciBpPXIudmFsdWU7aWYoaSljKHQsaSk7ZWxzZXt0LnN0YXRlPWEsdC5vdXRjb21lPWU7Zm9yKHZhciBuPS0xLHM9dC5xdWV1ZS5sZW5ndGg7KytuPHM7KXQucXVldWVbbl0uY2FsbEZ1bGZpbGxlZChlKX1yZXR1cm4gdH0sbC5yZWplY3Q9ZnVuY3Rpb24odCxlKXt0LnN0YXRlPXMsdC5vdXRjb21lPWU7Zm9yKHZhciByPS0xLGk9dC5xdWV1ZS5sZW5ndGg7KytyPGk7KXQucXVldWVbcl0uY2FsbFJlamVjdGVkKGUpO3JldHVybiB0fSxvLnJlc29sdmU9ZnVuY3Rpb24odCl7aWYodCBpbnN0YW5jZW9mIHRoaXMpcmV0dXJuIHQ7cmV0dXJuIGwucmVzb2x2ZShuZXcgdGhpcyh1KSx0KX0sby5yZWplY3Q9ZnVuY3Rpb24odCl7dmFyIGU9bmV3IHRoaXModSk7cmV0dXJuIGwucmVqZWN0KGUsdCl9LG8uYWxsPWZ1bmN0aW9uKHQpe3ZhciByPXRoaXM7aWYoXCJbb2JqZWN0IEFycmF5XVwiIT09T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHQpKXJldHVybiB0aGlzLnJlamVjdChuZXcgVHlwZUVycm9yKFwibXVzdCBiZSBhbiBhcnJheVwiKSk7dmFyIGk9dC5sZW5ndGgsbj0hMTtpZighaSlyZXR1cm4gdGhpcy5yZXNvbHZlKFtdKTt2YXIgcz1uZXcgQXJyYXkoaSksYT0wLGU9LTEsbz1uZXcgdGhpcyh1KTtmb3IoOysrZTxpOyloKHRbZV0sZSk7cmV0dXJuIG87ZnVuY3Rpb24gaCh0LGUpe3IucmVzb2x2ZSh0KS50aGVuKGZ1bmN0aW9uKHQpe3NbZV09dCwrK2EhPT1pfHxufHwobj0hMCxsLnJlc29sdmUobyxzKSl9LGZ1bmN0aW9uKHQpe258fChuPSEwLGwucmVqZWN0KG8sdCkpfSl9fSxvLnJhY2U9ZnVuY3Rpb24odCl7dmFyIGU9dGhpcztpZihcIltvYmplY3QgQXJyYXldXCIhPT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodCkpcmV0dXJuIHRoaXMucmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJtdXN0IGJlIGFuIGFycmF5XCIpKTt2YXIgcj10Lmxlbmd0aCxpPSExO2lmKCFyKXJldHVybiB0aGlzLnJlc29sdmUoW10pO3ZhciBuPS0xLHM9bmV3IHRoaXModSk7Zm9yKDsrK248cjspYT10W25dLGUucmVzb2x2ZShhKS50aGVuKGZ1bmN0aW9uKHQpe2l8fChpPSEwLGwucmVzb2x2ZShzLHQpKX0sZnVuY3Rpb24odCl7aXx8KGk9ITAsbC5yZWplY3Qocyx0KSl9KTt2YXIgYTtyZXR1cm4gc319LHtpbW1lZGlhdGU6MzZ9XSwzODpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXt9OygwLHQoXCIuL2xpYi91dGlscy9jb21tb25cIikuYXNzaWduKShpLHQoXCIuL2xpYi9kZWZsYXRlXCIpLHQoXCIuL2xpYi9pbmZsYXRlXCIpLHQoXCIuL2xpYi96bGliL2NvbnN0YW50c1wiKSksZS5leHBvcnRzPWl9LHtcIi4vbGliL2RlZmxhdGVcIjozOSxcIi4vbGliL2luZmxhdGVcIjo0MCxcIi4vbGliL3V0aWxzL2NvbW1vblwiOjQxLFwiLi9saWIvemxpYi9jb25zdGFudHNcIjo0NH1dLDM5OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGE9dChcIi4vemxpYi9kZWZsYXRlXCIpLG89dChcIi4vdXRpbHMvY29tbW9uXCIpLGg9dChcIi4vdXRpbHMvc3RyaW5nc1wiKSxuPXQoXCIuL3psaWIvbWVzc2FnZXNcIikscz10KFwiLi96bGliL3pzdHJlYW1cIiksdT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLGw9MCxmPS0xLGQ9MCxjPTg7ZnVuY3Rpb24gcCh0KXtpZighKHRoaXMgaW5zdGFuY2VvZiBwKSlyZXR1cm4gbmV3IHAodCk7dGhpcy5vcHRpb25zPW8uYXNzaWduKHtsZXZlbDpmLG1ldGhvZDpjLGNodW5rU2l6ZToxNjM4NCx3aW5kb3dCaXRzOjE1LG1lbUxldmVsOjgsc3RyYXRlZ3k6ZCx0bzpcIlwifSx0fHx7fSk7dmFyIGU9dGhpcy5vcHRpb25zO2UucmF3JiYwPGUud2luZG93Qml0cz9lLndpbmRvd0JpdHM9LWUud2luZG93Qml0czplLmd6aXAmJjA8ZS53aW5kb3dCaXRzJiZlLndpbmRvd0JpdHM8MTYmJihlLndpbmRvd0JpdHMrPTE2KSx0aGlzLmVycj0wLHRoaXMubXNnPVwiXCIsdGhpcy5lbmRlZD0hMSx0aGlzLmNodW5rcz1bXSx0aGlzLnN0cm09bmV3IHMsdGhpcy5zdHJtLmF2YWlsX291dD0wO3ZhciByPWEuZGVmbGF0ZUluaXQyKHRoaXMuc3RybSxlLmxldmVsLGUubWV0aG9kLGUud2luZG93Qml0cyxlLm1lbUxldmVsLGUuc3RyYXRlZ3kpO2lmKHIhPT1sKXRocm93IG5ldyBFcnJvcihuW3JdKTtpZihlLmhlYWRlciYmYS5kZWZsYXRlU2V0SGVhZGVyKHRoaXMuc3RybSxlLmhlYWRlciksZS5kaWN0aW9uYXJ5KXt2YXIgaTtpZihpPVwic3RyaW5nXCI9PXR5cGVvZiBlLmRpY3Rpb25hcnk/aC5zdHJpbmcyYnVmKGUuZGljdGlvbmFyeSk6XCJbb2JqZWN0IEFycmF5QnVmZmVyXVwiPT09dS5jYWxsKGUuZGljdGlvbmFyeSk/bmV3IFVpbnQ4QXJyYXkoZS5kaWN0aW9uYXJ5KTplLmRpY3Rpb25hcnksKHI9YS5kZWZsYXRlU2V0RGljdGlvbmFyeSh0aGlzLnN0cm0saSkpIT09bCl0aHJvdyBuZXcgRXJyb3IobltyXSk7dGhpcy5fZGljdF9zZXQ9ITB9fWZ1bmN0aW9uIGkodCxlKXt2YXIgcj1uZXcgcChlKTtpZihyLnB1c2godCwhMCksci5lcnIpdGhyb3cgci5tc2d8fG5bci5lcnJdO3JldHVybiByLnJlc3VsdH1wLnByb3RvdHlwZS5wdXNoPWZ1bmN0aW9uKHQsZSl7dmFyIHIsaSxuPXRoaXMuc3RybSxzPXRoaXMub3B0aW9ucy5jaHVua1NpemU7aWYodGhpcy5lbmRlZClyZXR1cm4hMTtpPWU9PT1+fmU/ZTohMD09PWU/NDowLFwic3RyaW5nXCI9PXR5cGVvZiB0P24uaW5wdXQ9aC5zdHJpbmcyYnVmKHQpOlwiW29iamVjdCBBcnJheUJ1ZmZlcl1cIj09PXUuY2FsbCh0KT9uLmlucHV0PW5ldyBVaW50OEFycmF5KHQpOm4uaW5wdXQ9dCxuLm5leHRfaW49MCxuLmF2YWlsX2luPW4uaW5wdXQubGVuZ3RoO2Rve2lmKDA9PT1uLmF2YWlsX291dCYmKG4ub3V0cHV0PW5ldyBvLkJ1Zjgocyksbi5uZXh0X291dD0wLG4uYXZhaWxfb3V0PXMpLDEhPT0ocj1hLmRlZmxhdGUobixpKSkmJnIhPT1sKXJldHVybiB0aGlzLm9uRW5kKHIpLCEodGhpcy5lbmRlZD0hMCk7MCE9PW4uYXZhaWxfb3V0JiYoMCE9PW4uYXZhaWxfaW58fDQhPT1pJiYyIT09aSl8fChcInN0cmluZ1wiPT09dGhpcy5vcHRpb25zLnRvP3RoaXMub25EYXRhKGguYnVmMmJpbnN0cmluZyhvLnNocmlua0J1ZihuLm91dHB1dCxuLm5leHRfb3V0KSkpOnRoaXMub25EYXRhKG8uc2hyaW5rQnVmKG4ub3V0cHV0LG4ubmV4dF9vdXQpKSl9d2hpbGUoKDA8bi5hdmFpbF9pbnx8MD09PW4uYXZhaWxfb3V0KSYmMSE9PXIpO3JldHVybiA0PT09aT8ocj1hLmRlZmxhdGVFbmQodGhpcy5zdHJtKSx0aGlzLm9uRW5kKHIpLHRoaXMuZW5kZWQ9ITAscj09PWwpOjIhPT1pfHwodGhpcy5vbkVuZChsKSwhKG4uYXZhaWxfb3V0PTApKX0scC5wcm90b3R5cGUub25EYXRhPWZ1bmN0aW9uKHQpe3RoaXMuY2h1bmtzLnB1c2godCl9LHAucHJvdG90eXBlLm9uRW5kPWZ1bmN0aW9uKHQpe3Q9PT1sJiYoXCJzdHJpbmdcIj09PXRoaXMub3B0aW9ucy50bz90aGlzLnJlc3VsdD10aGlzLmNodW5rcy5qb2luKFwiXCIpOnRoaXMucmVzdWx0PW8uZmxhdHRlbkNodW5rcyh0aGlzLmNodW5rcykpLHRoaXMuY2h1bmtzPVtdLHRoaXMuZXJyPXQsdGhpcy5tc2c9dGhpcy5zdHJtLm1zZ30sci5EZWZsYXRlPXAsci5kZWZsYXRlPWksci5kZWZsYXRlUmF3PWZ1bmN0aW9uKHQsZSl7cmV0dXJuKGU9ZXx8e30pLnJhdz0hMCxpKHQsZSl9LHIuZ3ppcD1mdW5jdGlvbih0LGUpe3JldHVybihlPWV8fHt9KS5nemlwPSEwLGkodCxlKX19LHtcIi4vdXRpbHMvY29tbW9uXCI6NDEsXCIuL3V0aWxzL3N0cmluZ3NcIjo0MixcIi4vemxpYi9kZWZsYXRlXCI6NDYsXCIuL3psaWIvbWVzc2FnZXNcIjo1MSxcIi4vemxpYi96c3RyZWFtXCI6NTN9XSw0MDpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBkPXQoXCIuL3psaWIvaW5mbGF0ZVwiKSxjPXQoXCIuL3V0aWxzL2NvbW1vblwiKSxwPXQoXCIuL3V0aWxzL3N0cmluZ3NcIiksbT10KFwiLi96bGliL2NvbnN0YW50c1wiKSxpPXQoXCIuL3psaWIvbWVzc2FnZXNcIiksbj10KFwiLi96bGliL3pzdHJlYW1cIikscz10KFwiLi96bGliL2d6aGVhZGVyXCIpLF89T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztmdW5jdGlvbiBhKHQpe2lmKCEodGhpcyBpbnN0YW5jZW9mIGEpKXJldHVybiBuZXcgYSh0KTt0aGlzLm9wdGlvbnM9Yy5hc3NpZ24oe2NodW5rU2l6ZToxNjM4NCx3aW5kb3dCaXRzOjAsdG86XCJcIn0sdHx8e30pO3ZhciBlPXRoaXMub3B0aW9ucztlLnJhdyYmMDw9ZS53aW5kb3dCaXRzJiZlLndpbmRvd0JpdHM8MTYmJihlLndpbmRvd0JpdHM9LWUud2luZG93Qml0cywwPT09ZS53aW5kb3dCaXRzJiYoZS53aW5kb3dCaXRzPS0xNSkpLCEoMDw9ZS53aW5kb3dCaXRzJiZlLndpbmRvd0JpdHM8MTYpfHx0JiZ0LndpbmRvd0JpdHN8fChlLndpbmRvd0JpdHMrPTMyKSwxNTxlLndpbmRvd0JpdHMmJmUud2luZG93Qml0czw0OCYmMD09KDE1JmUud2luZG93Qml0cykmJihlLndpbmRvd0JpdHN8PTE1KSx0aGlzLmVycj0wLHRoaXMubXNnPVwiXCIsdGhpcy5lbmRlZD0hMSx0aGlzLmNodW5rcz1bXSx0aGlzLnN0cm09bmV3IG4sdGhpcy5zdHJtLmF2YWlsX291dD0wO3ZhciByPWQuaW5mbGF0ZUluaXQyKHRoaXMuc3RybSxlLndpbmRvd0JpdHMpO2lmKHIhPT1tLlpfT0spdGhyb3cgbmV3IEVycm9yKGlbcl0pO3RoaXMuaGVhZGVyPW5ldyBzLGQuaW5mbGF0ZUdldEhlYWRlcih0aGlzLnN0cm0sdGhpcy5oZWFkZXIpfWZ1bmN0aW9uIG8odCxlKXt2YXIgcj1uZXcgYShlKTtpZihyLnB1c2godCwhMCksci5lcnIpdGhyb3cgci5tc2d8fGlbci5lcnJdO3JldHVybiByLnJlc3VsdH1hLnByb3RvdHlwZS5wdXNoPWZ1bmN0aW9uKHQsZSl7dmFyIHIsaSxuLHMsYSxvLGg9dGhpcy5zdHJtLHU9dGhpcy5vcHRpb25zLmNodW5rU2l6ZSxsPXRoaXMub3B0aW9ucy5kaWN0aW9uYXJ5LGY9ITE7aWYodGhpcy5lbmRlZClyZXR1cm4hMTtpPWU9PT1+fmU/ZTohMD09PWU/bS5aX0ZJTklTSDptLlpfTk9fRkxVU0gsXCJzdHJpbmdcIj09dHlwZW9mIHQ/aC5pbnB1dD1wLmJpbnN0cmluZzJidWYodCk6XCJbb2JqZWN0IEFycmF5QnVmZmVyXVwiPT09Xy5jYWxsKHQpP2guaW5wdXQ9bmV3IFVpbnQ4QXJyYXkodCk6aC5pbnB1dD10LGgubmV4dF9pbj0wLGguYXZhaWxfaW49aC5pbnB1dC5sZW5ndGg7ZG97aWYoMD09PWguYXZhaWxfb3V0JiYoaC5vdXRwdXQ9bmV3IGMuQnVmOCh1KSxoLm5leHRfb3V0PTAsaC5hdmFpbF9vdXQ9dSksKHI9ZC5pbmZsYXRlKGgsbS5aX05PX0ZMVVNIKSk9PT1tLlpfTkVFRF9ESUNUJiZsJiYobz1cInN0cmluZ1wiPT10eXBlb2YgbD9wLnN0cmluZzJidWYobCk6XCJbb2JqZWN0IEFycmF5QnVmZmVyXVwiPT09Xy5jYWxsKGwpP25ldyBVaW50OEFycmF5KGwpOmwscj1kLmluZmxhdGVTZXREaWN0aW9uYXJ5KHRoaXMuc3RybSxvKSkscj09PW0uWl9CVUZfRVJST1ImJiEwPT09ZiYmKHI9bS5aX09LLGY9ITEpLHIhPT1tLlpfU1RSRUFNX0VORCYmciE9PW0uWl9PSylyZXR1cm4gdGhpcy5vbkVuZChyKSwhKHRoaXMuZW5kZWQ9ITApO2gubmV4dF9vdXQmJigwIT09aC5hdmFpbF9vdXQmJnIhPT1tLlpfU1RSRUFNX0VORCYmKDAhPT1oLmF2YWlsX2lufHxpIT09bS5aX0ZJTklTSCYmaSE9PW0uWl9TWU5DX0ZMVVNIKXx8KFwic3RyaW5nXCI9PT10aGlzLm9wdGlvbnMudG8/KG49cC51dGY4Ym9yZGVyKGgub3V0cHV0LGgubmV4dF9vdXQpLHM9aC5uZXh0X291dC1uLGE9cC5idWYyc3RyaW5nKGgub3V0cHV0LG4pLGgubmV4dF9vdXQ9cyxoLmF2YWlsX291dD11LXMscyYmYy5hcnJheVNldChoLm91dHB1dCxoLm91dHB1dCxuLHMsMCksdGhpcy5vbkRhdGEoYSkpOnRoaXMub25EYXRhKGMuc2hyaW5rQnVmKGgub3V0cHV0LGgubmV4dF9vdXQpKSkpLDA9PT1oLmF2YWlsX2luJiYwPT09aC5hdmFpbF9vdXQmJihmPSEwKX13aGlsZSgoMDxoLmF2YWlsX2lufHwwPT09aC5hdmFpbF9vdXQpJiZyIT09bS5aX1NUUkVBTV9FTkQpO3JldHVybiByPT09bS5aX1NUUkVBTV9FTkQmJihpPW0uWl9GSU5JU0gpLGk9PT1tLlpfRklOSVNIPyhyPWQuaW5mbGF0ZUVuZCh0aGlzLnN0cm0pLHRoaXMub25FbmQociksdGhpcy5lbmRlZD0hMCxyPT09bS5aX09LKTppIT09bS5aX1NZTkNfRkxVU0h8fCh0aGlzLm9uRW5kKG0uWl9PSyksIShoLmF2YWlsX291dD0wKSl9LGEucHJvdG90eXBlLm9uRGF0YT1mdW5jdGlvbih0KXt0aGlzLmNodW5rcy5wdXNoKHQpfSxhLnByb3RvdHlwZS5vbkVuZD1mdW5jdGlvbih0KXt0PT09bS5aX09LJiYoXCJzdHJpbmdcIj09PXRoaXMub3B0aW9ucy50bz90aGlzLnJlc3VsdD10aGlzLmNodW5rcy5qb2luKFwiXCIpOnRoaXMucmVzdWx0PWMuZmxhdHRlbkNodW5rcyh0aGlzLmNodW5rcykpLHRoaXMuY2h1bmtzPVtdLHRoaXMuZXJyPXQsdGhpcy5tc2c9dGhpcy5zdHJtLm1zZ30sci5JbmZsYXRlPWEsci5pbmZsYXRlPW8sci5pbmZsYXRlUmF3PWZ1bmN0aW9uKHQsZSl7cmV0dXJuKGU9ZXx8e30pLnJhdz0hMCxvKHQsZSl9LHIudW5nemlwPW99LHtcIi4vdXRpbHMvY29tbW9uXCI6NDEsXCIuL3V0aWxzL3N0cmluZ3NcIjo0MixcIi4vemxpYi9jb25zdGFudHNcIjo0NCxcIi4vemxpYi9nemhlYWRlclwiOjQ3LFwiLi96bGliL2luZmxhdGVcIjo0OSxcIi4vemxpYi9tZXNzYWdlc1wiOjUxLFwiLi96bGliL3pzdHJlYW1cIjo1M31dLDQxOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIFVpbnQ4QXJyYXkmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50MTZBcnJheSYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIEludDMyQXJyYXk7ci5hc3NpZ249ZnVuY3Rpb24odCl7Zm9yKHZhciBlPUFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywxKTtlLmxlbmd0aDspe3ZhciByPWUuc2hpZnQoKTtpZihyKXtpZihcIm9iamVjdFwiIT10eXBlb2Ygcil0aHJvdyBuZXcgVHlwZUVycm9yKHIrXCJtdXN0IGJlIG5vbi1vYmplY3RcIik7Zm9yKHZhciBpIGluIHIpci5oYXNPd25Qcm9wZXJ0eShpKSYmKHRbaV09cltpXSl9fXJldHVybiB0fSxyLnNocmlua0J1Zj1mdW5jdGlvbih0LGUpe3JldHVybiB0Lmxlbmd0aD09PWU/dDp0LnN1YmFycmF5P3Quc3ViYXJyYXkoMCxlKToodC5sZW5ndGg9ZSx0KX07dmFyIG49e2FycmF5U2V0OmZ1bmN0aW9uKHQsZSxyLGksbil7aWYoZS5zdWJhcnJheSYmdC5zdWJhcnJheSl0LnNldChlLnN1YmFycmF5KHIscitpKSxuKTtlbHNlIGZvcih2YXIgcz0wO3M8aTtzKyspdFtuK3NdPWVbcitzXX0sZmxhdHRlbkNodW5rczpmdW5jdGlvbih0KXt2YXIgZSxyLGksbixzLGE7Zm9yKGU9aT0wLHI9dC5sZW5ndGg7ZTxyO2UrKylpKz10W2VdLmxlbmd0aDtmb3IoYT1uZXcgVWludDhBcnJheShpKSxlPW49MCxyPXQubGVuZ3RoO2U8cjtlKyspcz10W2VdLGEuc2V0KHMsbiksbis9cy5sZW5ndGg7cmV0dXJuIGF9fSxzPXthcnJheVNldDpmdW5jdGlvbih0LGUscixpLG4pe2Zvcih2YXIgcz0wO3M8aTtzKyspdFtuK3NdPWVbcitzXX0sZmxhdHRlbkNodW5rczpmdW5jdGlvbih0KXtyZXR1cm5bXS5jb25jYXQuYXBwbHkoW10sdCl9fTtyLnNldFR5cGVkPWZ1bmN0aW9uKHQpe3Q/KHIuQnVmOD1VaW50OEFycmF5LHIuQnVmMTY9VWludDE2QXJyYXksci5CdWYzMj1JbnQzMkFycmF5LHIuYXNzaWduKHIsbikpOihyLkJ1Zjg9QXJyYXksci5CdWYxNj1BcnJheSxyLkJ1ZjMyPUFycmF5LHIuYXNzaWduKHIscykpfSxyLnNldFR5cGVkKGkpfSx7fV0sNDI6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaD10KFwiLi9jb21tb25cIiksbj0hMCxzPSEwO3RyeXtTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsWzBdKX1jYXRjaCh0KXtuPSExfXRyeXtTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsbmV3IFVpbnQ4QXJyYXkoMSkpfWNhdGNoKHQpe3M9ITF9Zm9yKHZhciB1PW5ldyBoLkJ1ZjgoMjU2KSxpPTA7aTwyNTY7aSsrKXVbaV09MjUyPD1pPzY6MjQ4PD1pPzU6MjQwPD1pPzQ6MjI0PD1pPzM6MTkyPD1pPzI6MTtmdW5jdGlvbiBsKHQsZSl7aWYoZTw2NTUzNyYmKHQuc3ViYXJyYXkmJnN8fCF0LnN1YmFycmF5JiZuKSlyZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLGguc2hyaW5rQnVmKHQsZSkpO2Zvcih2YXIgcj1cIlwiLGk9MDtpPGU7aSsrKXIrPVN0cmluZy5mcm9tQ2hhckNvZGUodFtpXSk7cmV0dXJuIHJ9dVsyNTRdPXVbMjU0XT0xLHIuc3RyaW5nMmJ1Zj1mdW5jdGlvbih0KXt2YXIgZSxyLGksbixzLGE9dC5sZW5ndGgsbz0wO2ZvcihuPTA7bjxhO24rKyk1NTI5Nj09KDY0NTEyJihyPXQuY2hhckNvZGVBdChuKSkpJiZuKzE8YSYmNTYzMjA9PSg2NDUxMiYoaT10LmNoYXJDb2RlQXQobisxKSkpJiYocj02NTUzNisoci01NTI5Njw8MTApKyhpLTU2MzIwKSxuKyspLG8rPXI8MTI4PzE6cjwyMDQ4PzI6cjw2NTUzNj8zOjQ7Zm9yKGU9bmV3IGguQnVmOChvKSxuPXM9MDtzPG87bisrKTU1Mjk2PT0oNjQ1MTImKHI9dC5jaGFyQ29kZUF0KG4pKSkmJm4rMTxhJiY1NjMyMD09KDY0NTEyJihpPXQuY2hhckNvZGVBdChuKzEpKSkmJihyPTY1NTM2KyhyLTU1Mjk2PDwxMCkrKGktNTYzMjApLG4rKykscjwxMjg/ZVtzKytdPXI6KHI8MjA0OD9lW3MrK109MTkyfHI+Pj42OihyPDY1NTM2P2VbcysrXT0yMjR8cj4+PjEyOihlW3MrK109MjQwfHI+Pj4xOCxlW3MrK109MTI4fHI+Pj4xMiY2MyksZVtzKytdPTEyOHxyPj4+NiY2MyksZVtzKytdPTEyOHw2MyZyKTtyZXR1cm4gZX0sci5idWYyYmluc3RyaW5nPWZ1bmN0aW9uKHQpe3JldHVybiBsKHQsdC5sZW5ndGgpfSxyLmJpbnN0cmluZzJidWY9ZnVuY3Rpb24odCl7Zm9yKHZhciBlPW5ldyBoLkJ1ZjgodC5sZW5ndGgpLHI9MCxpPWUubGVuZ3RoO3I8aTtyKyspZVtyXT10LmNoYXJDb2RlQXQocik7cmV0dXJuIGV9LHIuYnVmMnN0cmluZz1mdW5jdGlvbih0LGUpe3ZhciByLGksbixzLGE9ZXx8dC5sZW5ndGgsbz1uZXcgQXJyYXkoMiphKTtmb3Iocj1pPTA7cjxhOylpZigobj10W3IrK10pPDEyOClvW2krK109bjtlbHNlIGlmKDQ8KHM9dVtuXSkpb1tpKytdPTY1NTMzLHIrPXMtMTtlbHNle2ZvcihuJj0yPT09cz8zMTozPT09cz8xNTo3OzE8cyYmcjxhOyluPW48PDZ8NjMmdFtyKytdLHMtLTsxPHM/b1tpKytdPTY1NTMzOm48NjU1MzY/b1tpKytdPW46KG4tPTY1NTM2LG9baSsrXT01NTI5NnxuPj4xMCYxMDIzLG9baSsrXT01NjMyMHwxMDIzJm4pfXJldHVybiBsKG8saSl9LHIudXRmOGJvcmRlcj1mdW5jdGlvbih0LGUpe3ZhciByO2ZvcigoZT1lfHx0Lmxlbmd0aCk+dC5sZW5ndGgmJihlPXQubGVuZ3RoKSxyPWUtMTswPD1yJiYxMjg9PSgxOTImdFtyXSk7KXItLTtyZXR1cm4gcjwwP2U6MD09PXI/ZTpyK3VbdFtyXV0+ZT9yOmV9fSx7XCIuL2NvbW1vblwiOjQxfV0sNDM6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtlLmV4cG9ydHM9ZnVuY3Rpb24odCxlLHIsaSl7Zm9yKHZhciBuPTY1NTM1JnR8MCxzPXQ+Pj4xNiY2NTUzNXwwLGE9MDswIT09cjspe2ZvcihyLT1hPTJlMzxyPzJlMzpyO3M9cysobj1uK2VbaSsrXXwwKXwwLC0tYTspO24lPTY1NTIxLHMlPTY1NTIxfXJldHVybiBufHM8PDE2fDB9fSx7fV0sNDQ6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtlLmV4cG9ydHM9e1pfTk9fRkxVU0g6MCxaX1BBUlRJQUxfRkxVU0g6MSxaX1NZTkNfRkxVU0g6MixaX0ZVTExfRkxVU0g6MyxaX0ZJTklTSDo0LFpfQkxPQ0s6NSxaX1RSRUVTOjYsWl9PSzowLFpfU1RSRUFNX0VORDoxLFpfTkVFRF9ESUNUOjIsWl9FUlJOTzotMSxaX1NUUkVBTV9FUlJPUjotMixaX0RBVEFfRVJST1I6LTMsWl9CVUZfRVJST1I6LTUsWl9OT19DT01QUkVTU0lPTjowLFpfQkVTVF9TUEVFRDoxLFpfQkVTVF9DT01QUkVTU0lPTjo5LFpfREVGQVVMVF9DT01QUkVTU0lPTjotMSxaX0ZJTFRFUkVEOjEsWl9IVUZGTUFOX09OTFk6MixaX1JMRTozLFpfRklYRUQ6NCxaX0RFRkFVTFRfU1RSQVRFR1k6MCxaX0JJTkFSWTowLFpfVEVYVDoxLFpfVU5LTk9XTjoyLFpfREVGTEFURUQ6OH19LHt9XSw0NTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBvPWZ1bmN0aW9uKCl7Zm9yKHZhciB0LGU9W10scj0wO3I8MjU2O3IrKyl7dD1yO2Zvcih2YXIgaT0wO2k8ODtpKyspdD0xJnQ/Mzk4ODI5MjM4NF50Pj4+MTp0Pj4+MTtlW3JdPXR9cmV0dXJuIGV9KCk7ZS5leHBvcnRzPWZ1bmN0aW9uKHQsZSxyLGkpe3ZhciBuPW8scz1pK3I7dF49LTE7Zm9yKHZhciBhPWk7YTxzO2ErKyl0PXQ+Pj44Xm5bMjU1Jih0XmVbYV0pXTtyZXR1cm4tMV50fX0se31dLDQ2OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGgsZD10KFwiLi4vdXRpbHMvY29tbW9uXCIpLHU9dChcIi4vdHJlZXNcIiksYz10KFwiLi9hZGxlcjMyXCIpLHA9dChcIi4vY3JjMzJcIiksaT10KFwiLi9tZXNzYWdlc1wiKSxsPTAsZj00LG09MCxfPS0yLGc9LTEsYj00LG49Mix2PTgseT05LHM9Mjg2LGE9MzAsbz0xOSx3PTIqcysxLGs9MTUseD0zLFM9MjU4LHo9Uyt4KzEsQz00MixFPTExMyxBPTEsST0yLE89MyxCPTQ7ZnVuY3Rpb24gUih0LGUpe3JldHVybiB0Lm1zZz1pW2VdLGV9ZnVuY3Rpb24gVCh0KXtyZXR1cm4odDw8MSktKDQ8dD85OjApfWZ1bmN0aW9uIEQodCl7Zm9yKHZhciBlPXQubGVuZ3RoOzA8PS0tZTspdFtlXT0wfWZ1bmN0aW9uIEYodCl7dmFyIGU9dC5zdGF0ZSxyPWUucGVuZGluZztyPnQuYXZhaWxfb3V0JiYocj10LmF2YWlsX291dCksMCE9PXImJihkLmFycmF5U2V0KHQub3V0cHV0LGUucGVuZGluZ19idWYsZS5wZW5kaW5nX291dCxyLHQubmV4dF9vdXQpLHQubmV4dF9vdXQrPXIsZS5wZW5kaW5nX291dCs9cix0LnRvdGFsX291dCs9cix0LmF2YWlsX291dC09cixlLnBlbmRpbmctPXIsMD09PWUucGVuZGluZyYmKGUucGVuZGluZ19vdXQ9MCkpfWZ1bmN0aW9uIE4odCxlKXt1Ll90cl9mbHVzaF9ibG9jayh0LDA8PXQuYmxvY2tfc3RhcnQ/dC5ibG9ja19zdGFydDotMSx0LnN0cnN0YXJ0LXQuYmxvY2tfc3RhcnQsZSksdC5ibG9ja19zdGFydD10LnN0cnN0YXJ0LEYodC5zdHJtKX1mdW5jdGlvbiBVKHQsZSl7dC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmcrK109ZX1mdW5jdGlvbiBQKHQsZSl7dC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmcrK109ZT4+PjgmMjU1LHQucGVuZGluZ19idWZbdC5wZW5kaW5nKytdPTI1NSZlfWZ1bmN0aW9uIEwodCxlKXt2YXIgcixpLG49dC5tYXhfY2hhaW5fbGVuZ3RoLHM9dC5zdHJzdGFydCxhPXQucHJldl9sZW5ndGgsbz10Lm5pY2VfbWF0Y2gsaD10LnN0cnN0YXJ0PnQud19zaXplLXo/dC5zdHJzdGFydC0odC53X3NpemUteik6MCx1PXQud2luZG93LGw9dC53X21hc2ssZj10LnByZXYsZD10LnN0cnN0YXJ0K1MsYz11W3MrYS0xXSxwPXVbcythXTt0LnByZXZfbGVuZ3RoPj10Lmdvb2RfbWF0Y2gmJihuPj49Miksbz50Lmxvb2thaGVhZCYmKG89dC5sb29rYWhlYWQpO2Rve2lmKHVbKHI9ZSkrYV09PT1wJiZ1W3IrYS0xXT09PWMmJnVbcl09PT11W3NdJiZ1Wysrcl09PT11W3MrMV0pe3MrPTIscisrO2Rve313aGlsZSh1Wysrc109PT11Wysrcl0mJnVbKytzXT09PXVbKytyXSYmdVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnVbKytzXT09PXVbKytyXSYmdVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnVbKytzXT09PXVbKytyXSYmczxkKTtpZihpPVMtKGQtcykscz1kLVMsYTxpKXtpZih0Lm1hdGNoX3N0YXJ0PWUsbzw9KGE9aSkpYnJlYWs7Yz11W3MrYS0xXSxwPXVbcythXX19fXdoaWxlKChlPWZbZSZsXSk+aCYmMCE9LS1uKTtyZXR1cm4gYTw9dC5sb29rYWhlYWQ/YTp0Lmxvb2thaGVhZH1mdW5jdGlvbiBqKHQpe3ZhciBlLHIsaSxuLHMsYSxvLGgsdSxsLGY9dC53X3NpemU7ZG97aWYobj10LndpbmRvd19zaXplLXQubG9va2FoZWFkLXQuc3Ryc3RhcnQsdC5zdHJzdGFydD49ZisoZi16KSl7Zm9yKGQuYXJyYXlTZXQodC53aW5kb3csdC53aW5kb3csZixmLDApLHQubWF0Y2hfc3RhcnQtPWYsdC5zdHJzdGFydC09Zix0LmJsb2NrX3N0YXJ0LT1mLGU9cj10Lmhhc2hfc2l6ZTtpPXQuaGVhZFstLWVdLHQuaGVhZFtlXT1mPD1pP2ktZjowLC0tcjspO2ZvcihlPXI9ZjtpPXQucHJldlstLWVdLHQucHJldltlXT1mPD1pP2ktZjowLC0tcjspO24rPWZ9aWYoMD09PXQuc3RybS5hdmFpbF9pbilicmVhaztpZihhPXQuc3RybSxvPXQud2luZG93LGg9dC5zdHJzdGFydCt0Lmxvb2thaGVhZCx1PW4sbD12b2lkIDAsbD1hLmF2YWlsX2luLHU8bCYmKGw9dSkscj0wPT09bD8wOihhLmF2YWlsX2luLT1sLGQuYXJyYXlTZXQobyxhLmlucHV0LGEubmV4dF9pbixsLGgpLDE9PT1hLnN0YXRlLndyYXA/YS5hZGxlcj1jKGEuYWRsZXIsbyxsLGgpOjI9PT1hLnN0YXRlLndyYXAmJihhLmFkbGVyPXAoYS5hZGxlcixvLGwsaCkpLGEubmV4dF9pbis9bCxhLnRvdGFsX2luKz1sLGwpLHQubG9va2FoZWFkKz1yLHQubG9va2FoZWFkK3QuaW5zZXJ0Pj14KWZvcihzPXQuc3Ryc3RhcnQtdC5pbnNlcnQsdC5pbnNfaD10LndpbmRvd1tzXSx0Lmluc19oPSh0Lmluc19oPDx0Lmhhc2hfc2hpZnRedC53aW5kb3dbcysxXSkmdC5oYXNoX21hc2s7dC5pbnNlcnQmJih0Lmluc19oPSh0Lmluc19oPDx0Lmhhc2hfc2hpZnRedC53aW5kb3dbcyt4LTFdKSZ0Lmhhc2hfbWFzayx0LnByZXZbcyZ0LndfbWFza109dC5oZWFkW3QuaW5zX2hdLHQuaGVhZFt0Lmluc19oXT1zLHMrKyx0Lmluc2VydC0tLCEodC5sb29rYWhlYWQrdC5pbnNlcnQ8eCkpOyk7fXdoaWxlKHQubG9va2FoZWFkPHomJjAhPT10LnN0cm0uYXZhaWxfaW4pfWZ1bmN0aW9uIFoodCxlKXtmb3IodmFyIHIsaTs7KXtpZih0Lmxvb2thaGVhZDx6KXtpZihqKHQpLHQubG9va2FoZWFkPHomJmU9PT1sKXJldHVybiBBO2lmKDA9PT10Lmxvb2thaGVhZClicmVha31pZihyPTAsdC5sb29rYWhlYWQ+PXgmJih0Lmluc19oPSh0Lmluc19oPDx0Lmhhc2hfc2hpZnRedC53aW5kb3dbdC5zdHJzdGFydCt4LTFdKSZ0Lmhhc2hfbWFzayxyPXQucHJldlt0LnN0cnN0YXJ0JnQud19tYXNrXT10LmhlYWRbdC5pbnNfaF0sdC5oZWFkW3QuaW5zX2hdPXQuc3Ryc3RhcnQpLDAhPT1yJiZ0LnN0cnN0YXJ0LXI8PXQud19zaXplLXomJih0Lm1hdGNoX2xlbmd0aD1MKHQscikpLHQubWF0Y2hfbGVuZ3RoPj14KWlmKGk9dS5fdHJfdGFsbHkodCx0LnN0cnN0YXJ0LXQubWF0Y2hfc3RhcnQsdC5tYXRjaF9sZW5ndGgteCksdC5sb29rYWhlYWQtPXQubWF0Y2hfbGVuZ3RoLHQubWF0Y2hfbGVuZ3RoPD10Lm1heF9sYXp5X21hdGNoJiZ0Lmxvb2thaGVhZD49eCl7Zm9yKHQubWF0Y2hfbGVuZ3RoLS07dC5zdHJzdGFydCsrLHQuaW5zX2g9KHQuaW5zX2g8PHQuaGFzaF9zaGlmdF50LndpbmRvd1t0LnN0cnN0YXJ0K3gtMV0pJnQuaGFzaF9tYXNrLHI9dC5wcmV2W3Quc3Ryc3RhcnQmdC53X21hc2tdPXQuaGVhZFt0Lmluc19oXSx0LmhlYWRbdC5pbnNfaF09dC5zdHJzdGFydCwwIT0tLXQubWF0Y2hfbGVuZ3RoOyk7dC5zdHJzdGFydCsrfWVsc2UgdC5zdHJzdGFydCs9dC5tYXRjaF9sZW5ndGgsdC5tYXRjaF9sZW5ndGg9MCx0Lmluc19oPXQud2luZG93W3Quc3Ryc3RhcnRdLHQuaW5zX2g9KHQuaW5zX2g8PHQuaGFzaF9zaGlmdF50LndpbmRvd1t0LnN0cnN0YXJ0KzFdKSZ0Lmhhc2hfbWFzaztlbHNlIGk9dS5fdHJfdGFsbHkodCwwLHQud2luZG93W3Quc3Ryc3RhcnRdKSx0Lmxvb2thaGVhZC0tLHQuc3Ryc3RhcnQrKztpZihpJiYoTih0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCkpcmV0dXJuIEF9cmV0dXJuIHQuaW5zZXJ0PXQuc3Ryc3RhcnQ8eC0xP3Quc3Ryc3RhcnQ6eC0xLGU9PT1mPyhOKHQsITApLDA9PT10LnN0cm0uYXZhaWxfb3V0P086Qik6dC5sYXN0X2xpdCYmKE4odCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpP0E6SX1mdW5jdGlvbiBXKHQsZSl7Zm9yKHZhciByLGksbjs7KXtpZih0Lmxvb2thaGVhZDx6KXtpZihqKHQpLHQubG9va2FoZWFkPHomJmU9PT1sKXJldHVybiBBO2lmKDA9PT10Lmxvb2thaGVhZClicmVha31pZihyPTAsdC5sb29rYWhlYWQ+PXgmJih0Lmluc19oPSh0Lmluc19oPDx0Lmhhc2hfc2hpZnRedC53aW5kb3dbdC5zdHJzdGFydCt4LTFdKSZ0Lmhhc2hfbWFzayxyPXQucHJldlt0LnN0cnN0YXJ0JnQud19tYXNrXT10LmhlYWRbdC5pbnNfaF0sdC5oZWFkW3QuaW5zX2hdPXQuc3Ryc3RhcnQpLHQucHJldl9sZW5ndGg9dC5tYXRjaF9sZW5ndGgsdC5wcmV2X21hdGNoPXQubWF0Y2hfc3RhcnQsdC5tYXRjaF9sZW5ndGg9eC0xLDAhPT1yJiZ0LnByZXZfbGVuZ3RoPHQubWF4X2xhenlfbWF0Y2gmJnQuc3Ryc3RhcnQtcjw9dC53X3NpemUteiYmKHQubWF0Y2hfbGVuZ3RoPUwodCxyKSx0Lm1hdGNoX2xlbmd0aDw9NSYmKDE9PT10LnN0cmF0ZWd5fHx0Lm1hdGNoX2xlbmd0aD09PXgmJjQwOTY8dC5zdHJzdGFydC10Lm1hdGNoX3N0YXJ0KSYmKHQubWF0Y2hfbGVuZ3RoPXgtMSkpLHQucHJldl9sZW5ndGg+PXgmJnQubWF0Y2hfbGVuZ3RoPD10LnByZXZfbGVuZ3RoKXtmb3Iobj10LnN0cnN0YXJ0K3QubG9va2FoZWFkLXgsaT11Ll90cl90YWxseSh0LHQuc3Ryc3RhcnQtMS10LnByZXZfbWF0Y2gsdC5wcmV2X2xlbmd0aC14KSx0Lmxvb2thaGVhZC09dC5wcmV2X2xlbmd0aC0xLHQucHJldl9sZW5ndGgtPTI7Kyt0LnN0cnN0YXJ0PD1uJiYodC5pbnNfaD0odC5pbnNfaDw8dC5oYXNoX3NoaWZ0XnQud2luZG93W3Quc3Ryc3RhcnQreC0xXSkmdC5oYXNoX21hc2sscj10LnByZXZbdC5zdHJzdGFydCZ0LndfbWFza109dC5oZWFkW3QuaW5zX2hdLHQuaGVhZFt0Lmluc19oXT10LnN0cnN0YXJ0KSwwIT0tLXQucHJldl9sZW5ndGg7KTtpZih0Lm1hdGNoX2F2YWlsYWJsZT0wLHQubWF0Y2hfbGVuZ3RoPXgtMSx0LnN0cnN0YXJ0KyssaSYmKE4odCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpKXJldHVybiBBfWVsc2UgaWYodC5tYXRjaF9hdmFpbGFibGUpe2lmKChpPXUuX3RyX3RhbGx5KHQsMCx0LndpbmRvd1t0LnN0cnN0YXJ0LTFdKSkmJk4odCwhMSksdC5zdHJzdGFydCsrLHQubG9va2FoZWFkLS0sMD09PXQuc3RybS5hdmFpbF9vdXQpcmV0dXJuIEF9ZWxzZSB0Lm1hdGNoX2F2YWlsYWJsZT0xLHQuc3Ryc3RhcnQrKyx0Lmxvb2thaGVhZC0tfXJldHVybiB0Lm1hdGNoX2F2YWlsYWJsZSYmKGk9dS5fdHJfdGFsbHkodCwwLHQud2luZG93W3Quc3Ryc3RhcnQtMV0pLHQubWF0Y2hfYXZhaWxhYmxlPTApLHQuaW5zZXJ0PXQuc3Ryc3RhcnQ8eC0xP3Quc3Ryc3RhcnQ6eC0xLGU9PT1mPyhOKHQsITApLDA9PT10LnN0cm0uYXZhaWxfb3V0P086Qik6dC5sYXN0X2xpdCYmKE4odCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpP0E6SX1mdW5jdGlvbiBNKHQsZSxyLGksbil7dGhpcy5nb29kX2xlbmd0aD10LHRoaXMubWF4X2xhenk9ZSx0aGlzLm5pY2VfbGVuZ3RoPXIsdGhpcy5tYXhfY2hhaW49aSx0aGlzLmZ1bmM9bn1mdW5jdGlvbiBIKCl7dGhpcy5zdHJtPW51bGwsdGhpcy5zdGF0dXM9MCx0aGlzLnBlbmRpbmdfYnVmPW51bGwsdGhpcy5wZW5kaW5nX2J1Zl9zaXplPTAsdGhpcy5wZW5kaW5nX291dD0wLHRoaXMucGVuZGluZz0wLHRoaXMud3JhcD0wLHRoaXMuZ3poZWFkPW51bGwsdGhpcy5nemluZGV4PTAsdGhpcy5tZXRob2Q9dix0aGlzLmxhc3RfZmx1c2g9LTEsdGhpcy53X3NpemU9MCx0aGlzLndfYml0cz0wLHRoaXMud19tYXNrPTAsdGhpcy53aW5kb3c9bnVsbCx0aGlzLndpbmRvd19zaXplPTAsdGhpcy5wcmV2PW51bGwsdGhpcy5oZWFkPW51bGwsdGhpcy5pbnNfaD0wLHRoaXMuaGFzaF9zaXplPTAsdGhpcy5oYXNoX2JpdHM9MCx0aGlzLmhhc2hfbWFzaz0wLHRoaXMuaGFzaF9zaGlmdD0wLHRoaXMuYmxvY2tfc3RhcnQ9MCx0aGlzLm1hdGNoX2xlbmd0aD0wLHRoaXMucHJldl9tYXRjaD0wLHRoaXMubWF0Y2hfYXZhaWxhYmxlPTAsdGhpcy5zdHJzdGFydD0wLHRoaXMubWF0Y2hfc3RhcnQ9MCx0aGlzLmxvb2thaGVhZD0wLHRoaXMucHJldl9sZW5ndGg9MCx0aGlzLm1heF9jaGFpbl9sZW5ndGg9MCx0aGlzLm1heF9sYXp5X21hdGNoPTAsdGhpcy5sZXZlbD0wLHRoaXMuc3RyYXRlZ3k9MCx0aGlzLmdvb2RfbWF0Y2g9MCx0aGlzLm5pY2VfbWF0Y2g9MCx0aGlzLmR5bl9sdHJlZT1uZXcgZC5CdWYxNigyKncpLHRoaXMuZHluX2R0cmVlPW5ldyBkLkJ1ZjE2KDIqKDIqYSsxKSksdGhpcy5ibF90cmVlPW5ldyBkLkJ1ZjE2KDIqKDIqbysxKSksRCh0aGlzLmR5bl9sdHJlZSksRCh0aGlzLmR5bl9kdHJlZSksRCh0aGlzLmJsX3RyZWUpLHRoaXMubF9kZXNjPW51bGwsdGhpcy5kX2Rlc2M9bnVsbCx0aGlzLmJsX2Rlc2M9bnVsbCx0aGlzLmJsX2NvdW50PW5ldyBkLkJ1ZjE2KGsrMSksdGhpcy5oZWFwPW5ldyBkLkJ1ZjE2KDIqcysxKSxEKHRoaXMuaGVhcCksdGhpcy5oZWFwX2xlbj0wLHRoaXMuaGVhcF9tYXg9MCx0aGlzLmRlcHRoPW5ldyBkLkJ1ZjE2KDIqcysxKSxEKHRoaXMuZGVwdGgpLHRoaXMubF9idWY9MCx0aGlzLmxpdF9idWZzaXplPTAsdGhpcy5sYXN0X2xpdD0wLHRoaXMuZF9idWY9MCx0aGlzLm9wdF9sZW49MCx0aGlzLnN0YXRpY19sZW49MCx0aGlzLm1hdGNoZXM9MCx0aGlzLmluc2VydD0wLHRoaXMuYmlfYnVmPTAsdGhpcy5iaV92YWxpZD0wfWZ1bmN0aW9uIEcodCl7dmFyIGU7cmV0dXJuIHQmJnQuc3RhdGU/KHQudG90YWxfaW49dC50b3RhbF9vdXQ9MCx0LmRhdGFfdHlwZT1uLChlPXQuc3RhdGUpLnBlbmRpbmc9MCxlLnBlbmRpbmdfb3V0PTAsZS53cmFwPDAmJihlLndyYXA9LWUud3JhcCksZS5zdGF0dXM9ZS53cmFwP0M6RSx0LmFkbGVyPTI9PT1lLndyYXA/MDoxLGUubGFzdF9mbHVzaD1sLHUuX3RyX2luaXQoZSksbSk6Uih0LF8pfWZ1bmN0aW9uIEsodCl7dmFyIGU9Ryh0KTtyZXR1cm4gZT09PW0mJmZ1bmN0aW9uKHQpe3Qud2luZG93X3NpemU9Mip0Lndfc2l6ZSxEKHQuaGVhZCksdC5tYXhfbGF6eV9tYXRjaD1oW3QubGV2ZWxdLm1heF9sYXp5LHQuZ29vZF9tYXRjaD1oW3QubGV2ZWxdLmdvb2RfbGVuZ3RoLHQubmljZV9tYXRjaD1oW3QubGV2ZWxdLm5pY2VfbGVuZ3RoLHQubWF4X2NoYWluX2xlbmd0aD1oW3QubGV2ZWxdLm1heF9jaGFpbix0LnN0cnN0YXJ0PTAsdC5ibG9ja19zdGFydD0wLHQubG9va2FoZWFkPTAsdC5pbnNlcnQ9MCx0Lm1hdGNoX2xlbmd0aD10LnByZXZfbGVuZ3RoPXgtMSx0Lm1hdGNoX2F2YWlsYWJsZT0wLHQuaW5zX2g9MH0odC5zdGF0ZSksZX1mdW5jdGlvbiBZKHQsZSxyLGksbixzKXtpZighdClyZXR1cm4gXzt2YXIgYT0xO2lmKGU9PT1nJiYoZT02KSxpPDA/KGE9MCxpPS1pKToxNTxpJiYoYT0yLGktPTE2KSxuPDF8fHk8bnx8ciE9PXZ8fGk8OHx8MTU8aXx8ZTwwfHw5PGV8fHM8MHx8YjxzKXJldHVybiBSKHQsXyk7OD09PWkmJihpPTkpO3ZhciBvPW5ldyBIO3JldHVybih0LnN0YXRlPW8pLnN0cm09dCxvLndyYXA9YSxvLmd6aGVhZD1udWxsLG8ud19iaXRzPWksby53X3NpemU9MTw8by53X2JpdHMsby53X21hc2s9by53X3NpemUtMSxvLmhhc2hfYml0cz1uKzcsby5oYXNoX3NpemU9MTw8by5oYXNoX2JpdHMsby5oYXNoX21hc2s9by5oYXNoX3NpemUtMSxvLmhhc2hfc2hpZnQ9fn4oKG8uaGFzaF9iaXRzK3gtMSkveCksby53aW5kb3c9bmV3IGQuQnVmOCgyKm8ud19zaXplKSxvLmhlYWQ9bmV3IGQuQnVmMTYoby5oYXNoX3NpemUpLG8ucHJldj1uZXcgZC5CdWYxNihvLndfc2l6ZSksby5saXRfYnVmc2l6ZT0xPDxuKzYsby5wZW5kaW5nX2J1Zl9zaXplPTQqby5saXRfYnVmc2l6ZSxvLnBlbmRpbmdfYnVmPW5ldyBkLkJ1Zjgoby5wZW5kaW5nX2J1Zl9zaXplKSxvLmRfYnVmPTEqby5saXRfYnVmc2l6ZSxvLmxfYnVmPTMqby5saXRfYnVmc2l6ZSxvLmxldmVsPWUsby5zdHJhdGVneT1zLG8ubWV0aG9kPXIsSyh0KX1oPVtuZXcgTSgwLDAsMCwwLGZ1bmN0aW9uKHQsZSl7dmFyIHI9NjU1MzU7Zm9yKHI+dC5wZW5kaW5nX2J1Zl9zaXplLTUmJihyPXQucGVuZGluZ19idWZfc2l6ZS01KTs7KXtpZih0Lmxvb2thaGVhZDw9MSl7aWYoaih0KSwwPT09dC5sb29rYWhlYWQmJmU9PT1sKXJldHVybiBBO2lmKDA9PT10Lmxvb2thaGVhZClicmVha310LnN0cnN0YXJ0Kz10Lmxvb2thaGVhZCx0Lmxvb2thaGVhZD0wO3ZhciBpPXQuYmxvY2tfc3RhcnQrcjtpZigoMD09PXQuc3Ryc3RhcnR8fHQuc3Ryc3RhcnQ+PWkpJiYodC5sb29rYWhlYWQ9dC5zdHJzdGFydC1pLHQuc3Ryc3RhcnQ9aSxOKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gQTtpZih0LnN0cnN0YXJ0LXQuYmxvY2tfc3RhcnQ+PXQud19zaXplLXomJihOKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gQX1yZXR1cm4gdC5pbnNlcnQ9MCxlPT09Zj8oTih0LCEwKSwwPT09dC5zdHJtLmF2YWlsX291dD9POkIpOih0LnN0cnN0YXJ0PnQuYmxvY2tfc3RhcnQmJihOKHQsITEpLHQuc3RybS5hdmFpbF9vdXQpLEEpfSksbmV3IE0oNCw0LDgsNCxaKSxuZXcgTSg0LDUsMTYsOCxaKSxuZXcgTSg0LDYsMzIsMzIsWiksbmV3IE0oNCw0LDE2LDE2LFcpLG5ldyBNKDgsMTYsMzIsMzIsVyksbmV3IE0oOCwxNiwxMjgsMTI4LFcpLG5ldyBNKDgsMzIsMTI4LDI1NixXKSxuZXcgTSgzMiwxMjgsMjU4LDEwMjQsVyksbmV3IE0oMzIsMjU4LDI1OCw0MDk2LFcpXSxyLmRlZmxhdGVJbml0PWZ1bmN0aW9uKHQsZSl7cmV0dXJuIFkodCxlLHYsMTUsOCwwKX0sci5kZWZsYXRlSW5pdDI9WSxyLmRlZmxhdGVSZXNldD1LLHIuZGVmbGF0ZVJlc2V0S2VlcD1HLHIuZGVmbGF0ZVNldEhlYWRlcj1mdW5jdGlvbih0LGUpe3JldHVybiB0JiZ0LnN0YXRlPzIhPT10LnN0YXRlLndyYXA/XzoodC5zdGF0ZS5nemhlYWQ9ZSxtKTpffSxyLmRlZmxhdGU9ZnVuY3Rpb24odCxlKXt2YXIgcixpLG4scztpZighdHx8IXQuc3RhdGV8fDU8ZXx8ZTwwKXJldHVybiB0P1IodCxfKTpfO2lmKGk9dC5zdGF0ZSwhdC5vdXRwdXR8fCF0LmlucHV0JiYwIT09dC5hdmFpbF9pbnx8NjY2PT09aS5zdGF0dXMmJmUhPT1mKXJldHVybiBSKHQsMD09PXQuYXZhaWxfb3V0Py01Ol8pO2lmKGkuc3RybT10LHI9aS5sYXN0X2ZsdXNoLGkubGFzdF9mbHVzaD1lLGkuc3RhdHVzPT09QylpZigyPT09aS53cmFwKXQuYWRsZXI9MCxVKGksMzEpLFUoaSwxMzkpLFUoaSw4KSxpLmd6aGVhZD8oVShpLChpLmd6aGVhZC50ZXh0PzE6MCkrKGkuZ3poZWFkLmhjcmM/MjowKSsoaS5nemhlYWQuZXh0cmE/NDowKSsoaS5nemhlYWQubmFtZT84OjApKyhpLmd6aGVhZC5jb21tZW50PzE2OjApKSxVKGksMjU1JmkuZ3poZWFkLnRpbWUpLFUoaSxpLmd6aGVhZC50aW1lPj44JjI1NSksVShpLGkuZ3poZWFkLnRpbWU+PjE2JjI1NSksVShpLGkuZ3poZWFkLnRpbWU+PjI0JjI1NSksVShpLDk9PT1pLmxldmVsPzI6Mjw9aS5zdHJhdGVneXx8aS5sZXZlbDwyPzQ6MCksVShpLDI1NSZpLmd6aGVhZC5vcyksaS5nemhlYWQuZXh0cmEmJmkuZ3poZWFkLmV4dHJhLmxlbmd0aCYmKFUoaSwyNTUmaS5nemhlYWQuZXh0cmEubGVuZ3RoKSxVKGksaS5nemhlYWQuZXh0cmEubGVuZ3RoPj44JjI1NSkpLGkuZ3poZWFkLmhjcmMmJih0LmFkbGVyPXAodC5hZGxlcixpLnBlbmRpbmdfYnVmLGkucGVuZGluZywwKSksaS5nemluZGV4PTAsaS5zdGF0dXM9NjkpOihVKGksMCksVShpLDApLFUoaSwwKSxVKGksMCksVShpLDApLFUoaSw5PT09aS5sZXZlbD8yOjI8PWkuc3RyYXRlZ3l8fGkubGV2ZWw8Mj80OjApLFUoaSwzKSxpLnN0YXR1cz1FKTtlbHNle3ZhciBhPXYrKGkud19iaXRzLTg8PDQpPDw4O2F8PSgyPD1pLnN0cmF0ZWd5fHxpLmxldmVsPDI/MDppLmxldmVsPDY/MTo2PT09aS5sZXZlbD8yOjMpPDw2LDAhPT1pLnN0cnN0YXJ0JiYoYXw9MzIpLGErPTMxLWElMzEsaS5zdGF0dXM9RSxQKGksYSksMCE9PWkuc3Ryc3RhcnQmJihQKGksdC5hZGxlcj4+PjE2KSxQKGksNjU1MzUmdC5hZGxlcikpLHQuYWRsZXI9MX1pZig2OT09PWkuc3RhdHVzKWlmKGkuZ3poZWFkLmV4dHJhKXtmb3Iobj1pLnBlbmRpbmc7aS5nemluZGV4PCg2NTUzNSZpLmd6aGVhZC5leHRyYS5sZW5ndGgpJiYoaS5wZW5kaW5nIT09aS5wZW5kaW5nX2J1Zl9zaXplfHwoaS5nemhlYWQuaGNyYyYmaS5wZW5kaW5nPm4mJih0LmFkbGVyPXAodC5hZGxlcixpLnBlbmRpbmdfYnVmLGkucGVuZGluZy1uLG4pKSxGKHQpLG49aS5wZW5kaW5nLGkucGVuZGluZyE9PWkucGVuZGluZ19idWZfc2l6ZSkpOylVKGksMjU1JmkuZ3poZWFkLmV4dHJhW2kuZ3ppbmRleF0pLGkuZ3ppbmRleCsrO2kuZ3poZWFkLmhjcmMmJmkucGVuZGluZz5uJiYodC5hZGxlcj1wKHQuYWRsZXIsaS5wZW5kaW5nX2J1ZixpLnBlbmRpbmctbixuKSksaS5nemluZGV4PT09aS5nemhlYWQuZXh0cmEubGVuZ3RoJiYoaS5nemluZGV4PTAsaS5zdGF0dXM9NzMpfWVsc2UgaS5zdGF0dXM9NzM7aWYoNzM9PT1pLnN0YXR1cylpZihpLmd6aGVhZC5uYW1lKXtuPWkucGVuZGluZztkb3tpZihpLnBlbmRpbmc9PT1pLnBlbmRpbmdfYnVmX3NpemUmJihpLmd6aGVhZC5oY3JjJiZpLnBlbmRpbmc+biYmKHQuYWRsZXI9cCh0LmFkbGVyLGkucGVuZGluZ19idWYsaS5wZW5kaW5nLW4sbikpLEYodCksbj1pLnBlbmRpbmcsaS5wZW5kaW5nPT09aS5wZW5kaW5nX2J1Zl9zaXplKSl7cz0xO2JyZWFrfXM9aS5nemluZGV4PGkuZ3poZWFkLm5hbWUubGVuZ3RoPzI1NSZpLmd6aGVhZC5uYW1lLmNoYXJDb2RlQXQoaS5nemluZGV4KyspOjAsVShpLHMpfXdoaWxlKDAhPT1zKTtpLmd6aGVhZC5oY3JjJiZpLnBlbmRpbmc+biYmKHQuYWRsZXI9cCh0LmFkbGVyLGkucGVuZGluZ19idWYsaS5wZW5kaW5nLW4sbikpLDA9PT1zJiYoaS5nemluZGV4PTAsaS5zdGF0dXM9OTEpfWVsc2UgaS5zdGF0dXM9OTE7aWYoOTE9PT1pLnN0YXR1cylpZihpLmd6aGVhZC5jb21tZW50KXtuPWkucGVuZGluZztkb3tpZihpLnBlbmRpbmc9PT1pLnBlbmRpbmdfYnVmX3NpemUmJihpLmd6aGVhZC5oY3JjJiZpLnBlbmRpbmc+biYmKHQuYWRsZXI9cCh0LmFkbGVyLGkucGVuZGluZ19idWYsaS5wZW5kaW5nLW4sbikpLEYodCksbj1pLnBlbmRpbmcsaS5wZW5kaW5nPT09aS5wZW5kaW5nX2J1Zl9zaXplKSl7cz0xO2JyZWFrfXM9aS5nemluZGV4PGkuZ3poZWFkLmNvbW1lbnQubGVuZ3RoPzI1NSZpLmd6aGVhZC5jb21tZW50LmNoYXJDb2RlQXQoaS5nemluZGV4KyspOjAsVShpLHMpfXdoaWxlKDAhPT1zKTtpLmd6aGVhZC5oY3JjJiZpLnBlbmRpbmc+biYmKHQuYWRsZXI9cCh0LmFkbGVyLGkucGVuZGluZ19idWYsaS5wZW5kaW5nLW4sbikpLDA9PT1zJiYoaS5zdGF0dXM9MTAzKX1lbHNlIGkuc3RhdHVzPTEwMztpZigxMDM9PT1pLnN0YXR1cyYmKGkuZ3poZWFkLmhjcmM/KGkucGVuZGluZysyPmkucGVuZGluZ19idWZfc2l6ZSYmRih0KSxpLnBlbmRpbmcrMjw9aS5wZW5kaW5nX2J1Zl9zaXplJiYoVShpLDI1NSZ0LmFkbGVyKSxVKGksdC5hZGxlcj4+OCYyNTUpLHQuYWRsZXI9MCxpLnN0YXR1cz1FKSk6aS5zdGF0dXM9RSksMCE9PWkucGVuZGluZyl7aWYoRih0KSwwPT09dC5hdmFpbF9vdXQpcmV0dXJuIGkubGFzdF9mbHVzaD0tMSxtfWVsc2UgaWYoMD09PXQuYXZhaWxfaW4mJlQoZSk8PVQocikmJmUhPT1mKXJldHVybiBSKHQsLTUpO2lmKDY2Nj09PWkuc3RhdHVzJiYwIT09dC5hdmFpbF9pbilyZXR1cm4gUih0LC01KTtpZigwIT09dC5hdmFpbF9pbnx8MCE9PWkubG9va2FoZWFkfHxlIT09bCYmNjY2IT09aS5zdGF0dXMpe3ZhciBvPTI9PT1pLnN0cmF0ZWd5P2Z1bmN0aW9uKHQsZSl7Zm9yKHZhciByOzspe2lmKDA9PT10Lmxvb2thaGVhZCYmKGoodCksMD09PXQubG9va2FoZWFkKSl7aWYoZT09PWwpcmV0dXJuIEE7YnJlYWt9aWYodC5tYXRjaF9sZW5ndGg9MCxyPXUuX3RyX3RhbGx5KHQsMCx0LndpbmRvd1t0LnN0cnN0YXJ0XSksdC5sb29rYWhlYWQtLSx0LnN0cnN0YXJ0KyssciYmKE4odCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpKXJldHVybiBBfXJldHVybiB0Lmluc2VydD0wLGU9PT1mPyhOKHQsITApLDA9PT10LnN0cm0uYXZhaWxfb3V0P086Qik6dC5sYXN0X2xpdCYmKE4odCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpP0E6SX0oaSxlKTozPT09aS5zdHJhdGVneT9mdW5jdGlvbih0LGUpe2Zvcih2YXIgcixpLG4scyxhPXQud2luZG93Ozspe2lmKHQubG9va2FoZWFkPD1TKXtpZihqKHQpLHQubG9va2FoZWFkPD1TJiZlPT09bClyZXR1cm4gQTtpZigwPT09dC5sb29rYWhlYWQpYnJlYWt9aWYodC5tYXRjaF9sZW5ndGg9MCx0Lmxvb2thaGVhZD49eCYmMDx0LnN0cnN0YXJ0JiYoaT1hW249dC5zdHJzdGFydC0xXSk9PT1hWysrbl0mJmk9PT1hWysrbl0mJmk9PT1hWysrbl0pe3M9dC5zdHJzdGFydCtTO2Rve313aGlsZShpPT09YVsrK25dJiZpPT09YVsrK25dJiZpPT09YVsrK25dJiZpPT09YVsrK25dJiZpPT09YVsrK25dJiZpPT09YVsrK25dJiZpPT09YVsrK25dJiZpPT09YVsrK25dJiZuPHMpO3QubWF0Y2hfbGVuZ3RoPVMtKHMtbiksdC5tYXRjaF9sZW5ndGg+dC5sb29rYWhlYWQmJih0Lm1hdGNoX2xlbmd0aD10Lmxvb2thaGVhZCl9aWYodC5tYXRjaF9sZW5ndGg+PXg/KHI9dS5fdHJfdGFsbHkodCwxLHQubWF0Y2hfbGVuZ3RoLXgpLHQubG9va2FoZWFkLT10Lm1hdGNoX2xlbmd0aCx0LnN0cnN0YXJ0Kz10Lm1hdGNoX2xlbmd0aCx0Lm1hdGNoX2xlbmd0aD0wKToocj11Ll90cl90YWxseSh0LDAsdC53aW5kb3dbdC5zdHJzdGFydF0pLHQubG9va2FoZWFkLS0sdC5zdHJzdGFydCsrKSxyJiYoTih0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCkpcmV0dXJuIEF9cmV0dXJuIHQuaW5zZXJ0PTAsZT09PWY/KE4odCwhMCksMD09PXQuc3RybS5hdmFpbF9vdXQ/TzpCKTp0Lmxhc3RfbGl0JiYoTih0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCk/QTpJfShpLGUpOmhbaS5sZXZlbF0uZnVuYyhpLGUpO2lmKG8hPT1PJiZvIT09Qnx8KGkuc3RhdHVzPTY2Niksbz09PUF8fG89PT1PKXJldHVybiAwPT09dC5hdmFpbF9vdXQmJihpLmxhc3RfZmx1c2g9LTEpLG07aWYobz09PUkmJigxPT09ZT91Ll90cl9hbGlnbihpKTo1IT09ZSYmKHUuX3RyX3N0b3JlZF9ibG9jayhpLDAsMCwhMSksMz09PWUmJihEKGkuaGVhZCksMD09PWkubG9va2FoZWFkJiYoaS5zdHJzdGFydD0wLGkuYmxvY2tfc3RhcnQ9MCxpLmluc2VydD0wKSkpLEYodCksMD09PXQuYXZhaWxfb3V0KSlyZXR1cm4gaS5sYXN0X2ZsdXNoPS0xLG19cmV0dXJuIGUhPT1mP206aS53cmFwPD0wPzE6KDI9PT1pLndyYXA/KFUoaSwyNTUmdC5hZGxlciksVShpLHQuYWRsZXI+PjgmMjU1KSxVKGksdC5hZGxlcj4+MTYmMjU1KSxVKGksdC5hZGxlcj4+MjQmMjU1KSxVKGksMjU1JnQudG90YWxfaW4pLFUoaSx0LnRvdGFsX2luPj44JjI1NSksVShpLHQudG90YWxfaW4+PjE2JjI1NSksVShpLHQudG90YWxfaW4+PjI0JjI1NSkpOihQKGksdC5hZGxlcj4+PjE2KSxQKGksNjU1MzUmdC5hZGxlcikpLEYodCksMDxpLndyYXAmJihpLndyYXA9LWkud3JhcCksMCE9PWkucGVuZGluZz9tOjEpfSxyLmRlZmxhdGVFbmQ9ZnVuY3Rpb24odCl7dmFyIGU7cmV0dXJuIHQmJnQuc3RhdGU/KGU9dC5zdGF0ZS5zdGF0dXMpIT09QyYmNjkhPT1lJiY3MyE9PWUmJjkxIT09ZSYmMTAzIT09ZSYmZSE9PUUmJjY2NiE9PWU/Uih0LF8pOih0LnN0YXRlPW51bGwsZT09PUU/Uih0LC0zKTptKTpffSxyLmRlZmxhdGVTZXREaWN0aW9uYXJ5PWZ1bmN0aW9uKHQsZSl7dmFyIHIsaSxuLHMsYSxvLGgsdSxsPWUubGVuZ3RoO2lmKCF0fHwhdC5zdGF0ZSlyZXR1cm4gXztpZigyPT09KHM9KHI9dC5zdGF0ZSkud3JhcCl8fDE9PT1zJiZyLnN0YXR1cyE9PUN8fHIubG9va2FoZWFkKXJldHVybiBfO2ZvcigxPT09cyYmKHQuYWRsZXI9Yyh0LmFkbGVyLGUsbCwwKSksci53cmFwPTAsbD49ci53X3NpemUmJigwPT09cyYmKEQoci5oZWFkKSxyLnN0cnN0YXJ0PTAsci5ibG9ja19zdGFydD0wLHIuaW5zZXJ0PTApLHU9bmV3IGQuQnVmOChyLndfc2l6ZSksZC5hcnJheVNldCh1LGUsbC1yLndfc2l6ZSxyLndfc2l6ZSwwKSxlPXUsbD1yLndfc2l6ZSksYT10LmF2YWlsX2luLG89dC5uZXh0X2luLGg9dC5pbnB1dCx0LmF2YWlsX2luPWwsdC5uZXh0X2luPTAsdC5pbnB1dD1lLGoocik7ci5sb29rYWhlYWQ+PXg7KXtmb3IoaT1yLnN0cnN0YXJ0LG49ci5sb29rYWhlYWQtKHgtMSk7ci5pbnNfaD0oci5pbnNfaDw8ci5oYXNoX3NoaWZ0XnIud2luZG93W2kreC0xXSkmci5oYXNoX21hc2ssci5wcmV2W2kmci53X21hc2tdPXIuaGVhZFtyLmluc19oXSxyLmhlYWRbci5pbnNfaF09aSxpKyssLS1uOyk7ci5zdHJzdGFydD1pLHIubG9va2FoZWFkPXgtMSxqKHIpfXJldHVybiByLnN0cnN0YXJ0Kz1yLmxvb2thaGVhZCxyLmJsb2NrX3N0YXJ0PXIuc3Ryc3RhcnQsci5pbnNlcnQ9ci5sb29rYWhlYWQsci5sb29rYWhlYWQ9MCxyLm1hdGNoX2xlbmd0aD1yLnByZXZfbGVuZ3RoPXgtMSxyLm1hdGNoX2F2YWlsYWJsZT0wLHQubmV4dF9pbj1vLHQuaW5wdXQ9aCx0LmF2YWlsX2luPWEsci53cmFwPXMsbX0sci5kZWZsYXRlSW5mbz1cInBha28gZGVmbGF0ZSAoZnJvbSBOb2RlY2EgcHJvamVjdClcIn0se1wiLi4vdXRpbHMvY29tbW9uXCI6NDEsXCIuL2FkbGVyMzJcIjo0MyxcIi4vY3JjMzJcIjo0NSxcIi4vbWVzc2FnZXNcIjo1MSxcIi4vdHJlZXNcIjo1Mn1dLDQ3OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZS5leHBvcnRzPWZ1bmN0aW9uKCl7dGhpcy50ZXh0PTAsdGhpcy50aW1lPTAsdGhpcy54ZmxhZ3M9MCx0aGlzLm9zPTAsdGhpcy5leHRyYT1udWxsLHRoaXMuZXh0cmFfbGVuPTAsdGhpcy5uYW1lPVwiXCIsdGhpcy5jb21tZW50PVwiXCIsdGhpcy5oY3JjPTAsdGhpcy5kb25lPSExfX0se31dLDQ4OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZS5leHBvcnRzPWZ1bmN0aW9uKHQsZSl7dmFyIHIsaSxuLHMsYSxvLGgsdSxsLGYsZCxjLHAsbSxfLGcsYix2LHksdyxrLHgsUyx6LEM7cj10LnN0YXRlLGk9dC5uZXh0X2luLHo9dC5pbnB1dCxuPWkrKHQuYXZhaWxfaW4tNSkscz10Lm5leHRfb3V0LEM9dC5vdXRwdXQsYT1zLShlLXQuYXZhaWxfb3V0KSxvPXMrKHQuYXZhaWxfb3V0LTI1NyksaD1yLmRtYXgsdT1yLndzaXplLGw9ci53aGF2ZSxmPXIud25leHQsZD1yLndpbmRvdyxjPXIuaG9sZCxwPXIuYml0cyxtPXIubGVuY29kZSxfPXIuZGlzdGNvZGUsZz0oMTw8ci5sZW5iaXRzKS0xLGI9KDE8PHIuZGlzdGJpdHMpLTE7dDpkb3twPDE1JiYoYys9eltpKytdPDxwLHArPTgsYys9eltpKytdPDxwLHArPTgpLHY9bVtjJmddO2U6Zm9yKDs7KXtpZihjPj4+PXk9dj4+PjI0LHAtPXksMD09PSh5PXY+Pj4xNiYyNTUpKUNbcysrXT02NTUzNSZ2O2Vsc2V7aWYoISgxNiZ5KSl7aWYoMD09KDY0JnkpKXt2PW1bKDY1NTM1JnYpKyhjJigxPDx5KS0xKV07Y29udGludWUgZX1pZigzMiZ5KXtyLm1vZGU9MTI7YnJlYWsgdH10Lm1zZz1cImludmFsaWQgbGl0ZXJhbC9sZW5ndGggY29kZVwiLHIubW9kZT0zMDticmVhayB0fXc9NjU1MzUmdiwoeSY9MTUpJiYocDx5JiYoYys9eltpKytdPDxwLHArPTgpLHcrPWMmKDE8PHkpLTEsYz4+Pj15LHAtPXkpLHA8MTUmJihjKz16W2krK108PHAscCs9OCxjKz16W2krK108PHAscCs9OCksdj1fW2MmYl07cjpmb3IoOzspe2lmKGM+Pj49eT12Pj4+MjQscC09eSwhKDE2Jih5PXY+Pj4xNiYyNTUpKSl7aWYoMD09KDY0JnkpKXt2PV9bKDY1NTM1JnYpKyhjJigxPDx5KS0xKV07Y29udGludWUgcn10Lm1zZz1cImludmFsaWQgZGlzdGFuY2UgY29kZVwiLHIubW9kZT0zMDticmVhayB0fWlmKGs9NjU1MzUmdixwPCh5Jj0xNSkmJihjKz16W2krK108PHAsKHArPTgpPHkmJihjKz16W2krK108PHAscCs9OCkpLGg8KGsrPWMmKDE8PHkpLTEpKXt0Lm1zZz1cImludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrXCIsci5tb2RlPTMwO2JyZWFrIHR9aWYoYz4+Pj15LHAtPXksKHk9cy1hKTxrKXtpZihsPCh5PWsteSkmJnIuc2FuZSl7dC5tc2c9XCJpbnZhbGlkIGRpc3RhbmNlIHRvbyBmYXIgYmFja1wiLHIubW9kZT0zMDticmVhayB0fWlmKFM9ZCwoeD0wKT09PWYpe2lmKHgrPXUteSx5PHcpe2Zvcih3LT15O0NbcysrXT1kW3grK10sLS15Oyk7eD1zLWssUz1DfX1lbHNlIGlmKGY8eSl7aWYoeCs9dStmLXksKHktPWYpPHcpe2Zvcih3LT15O0NbcysrXT1kW3grK10sLS15Oyk7aWYoeD0wLGY8dyl7Zm9yKHctPXk9ZjtDW3MrK109ZFt4KytdLC0teTspO3g9cy1rLFM9Q319fWVsc2UgaWYoeCs9Zi15LHk8dyl7Zm9yKHctPXk7Q1tzKytdPWRbeCsrXSwtLXk7KTt4PXMtayxTPUN9Zm9yKDsyPHc7KUNbcysrXT1TW3grK10sQ1tzKytdPVNbeCsrXSxDW3MrK109U1t4KytdLHctPTM7dyYmKENbcysrXT1TW3grK10sMTx3JiYoQ1tzKytdPVNbeCsrXSkpfWVsc2V7Zm9yKHg9cy1rO0NbcysrXT1DW3grK10sQ1tzKytdPUNbeCsrXSxDW3MrK109Q1t4KytdLDI8KHctPTMpOyk7dyYmKENbcysrXT1DW3grK10sMTx3JiYoQ1tzKytdPUNbeCsrXSkpfWJyZWFrfX1icmVha319d2hpbGUoaTxuJiZzPG8pO2ktPXc9cD4+MyxjJj0oMTw8KHAtPXc8PDMpKS0xLHQubmV4dF9pbj1pLHQubmV4dF9vdXQ9cyx0LmF2YWlsX2luPWk8bj9uLWkrNTo1LShpLW4pLHQuYXZhaWxfb3V0PXM8bz9vLXMrMjU3OjI1Ny0ocy1vKSxyLmhvbGQ9YyxyLmJpdHM9cH19LHt9XSw0OTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBJPXQoXCIuLi91dGlscy9jb21tb25cIiksTz10KFwiLi9hZGxlcjMyXCIpLEI9dChcIi4vY3JjMzJcIiksUj10KFwiLi9pbmZmYXN0XCIpLFQ9dChcIi4vaW5mdHJlZXNcIiksRD0xLEY9MixOPTAsVT0tMixQPTEsaT04NTIsbj01OTI7ZnVuY3Rpb24gTCh0KXtyZXR1cm4odD4+PjI0JjI1NSkrKHQ+Pj44JjY1MjgwKSsoKDY1MjgwJnQpPDw4KSsoKDI1NSZ0KTw8MjQpfWZ1bmN0aW9uIHMoKXt0aGlzLm1vZGU9MCx0aGlzLmxhc3Q9ITEsdGhpcy53cmFwPTAsdGhpcy5oYXZlZGljdD0hMSx0aGlzLmZsYWdzPTAsdGhpcy5kbWF4PTAsdGhpcy5jaGVjaz0wLHRoaXMudG90YWw9MCx0aGlzLmhlYWQ9bnVsbCx0aGlzLndiaXRzPTAsdGhpcy53c2l6ZT0wLHRoaXMud2hhdmU9MCx0aGlzLnduZXh0PTAsdGhpcy53aW5kb3c9bnVsbCx0aGlzLmhvbGQ9MCx0aGlzLmJpdHM9MCx0aGlzLmxlbmd0aD0wLHRoaXMub2Zmc2V0PTAsdGhpcy5leHRyYT0wLHRoaXMubGVuY29kZT1udWxsLHRoaXMuZGlzdGNvZGU9bnVsbCx0aGlzLmxlbmJpdHM9MCx0aGlzLmRpc3RiaXRzPTAsdGhpcy5uY29kZT0wLHRoaXMubmxlbj0wLHRoaXMubmRpc3Q9MCx0aGlzLmhhdmU9MCx0aGlzLm5leHQ9bnVsbCx0aGlzLmxlbnM9bmV3IEkuQnVmMTYoMzIwKSx0aGlzLndvcms9bmV3IEkuQnVmMTYoMjg4KSx0aGlzLmxlbmR5bj1udWxsLHRoaXMuZGlzdGR5bj1udWxsLHRoaXMuc2FuZT0wLHRoaXMuYmFjaz0wLHRoaXMud2FzPTB9ZnVuY3Rpb24gYSh0KXt2YXIgZTtyZXR1cm4gdCYmdC5zdGF0ZT8oZT10LnN0YXRlLHQudG90YWxfaW49dC50b3RhbF9vdXQ9ZS50b3RhbD0wLHQubXNnPVwiXCIsZS53cmFwJiYodC5hZGxlcj0xJmUud3JhcCksZS5tb2RlPVAsZS5sYXN0PTAsZS5oYXZlZGljdD0wLGUuZG1heD0zMjc2OCxlLmhlYWQ9bnVsbCxlLmhvbGQ9MCxlLmJpdHM9MCxlLmxlbmNvZGU9ZS5sZW5keW49bmV3IEkuQnVmMzIoaSksZS5kaXN0Y29kZT1lLmRpc3RkeW49bmV3IEkuQnVmMzIobiksZS5zYW5lPTEsZS5iYWNrPS0xLE4pOlV9ZnVuY3Rpb24gbyh0KXt2YXIgZTtyZXR1cm4gdCYmdC5zdGF0ZT8oKGU9dC5zdGF0ZSkud3NpemU9MCxlLndoYXZlPTAsZS53bmV4dD0wLGEodCkpOlV9ZnVuY3Rpb24gaCh0LGUpe3ZhciByLGk7cmV0dXJuIHQmJnQuc3RhdGU/KGk9dC5zdGF0ZSxlPDA/KHI9MCxlPS1lKToocj0xKyhlPj40KSxlPDQ4JiYoZSY9MTUpKSxlJiYoZTw4fHwxNTxlKT9VOihudWxsIT09aS53aW5kb3cmJmkud2JpdHMhPT1lJiYoaS53aW5kb3c9bnVsbCksaS53cmFwPXIsaS53Yml0cz1lLG8odCkpKTpVfWZ1bmN0aW9uIHUodCxlKXt2YXIgcixpO3JldHVybiB0PyhpPW5ldyBzLCh0LnN0YXRlPWkpLndpbmRvdz1udWxsLChyPWgodCxlKSkhPT1OJiYodC5zdGF0ZT1udWxsKSxyKTpVfXZhciBsLGYsZD0hMDtmdW5jdGlvbiBqKHQpe2lmKGQpe3ZhciBlO2ZvcihsPW5ldyBJLkJ1ZjMyKDUxMiksZj1uZXcgSS5CdWYzMigzMiksZT0wO2U8MTQ0Oyl0LmxlbnNbZSsrXT04O2Zvcig7ZTwyNTY7KXQubGVuc1tlKytdPTk7Zm9yKDtlPDI4MDspdC5sZW5zW2UrK109Nztmb3IoO2U8Mjg4Oyl0LmxlbnNbZSsrXT04O2ZvcihUKEQsdC5sZW5zLDAsMjg4LGwsMCx0Lndvcmsse2JpdHM6OX0pLGU9MDtlPDMyOyl0LmxlbnNbZSsrXT01O1QoRix0LmxlbnMsMCwzMixmLDAsdC53b3JrLHtiaXRzOjV9KSxkPSExfXQubGVuY29kZT1sLHQubGVuYml0cz05LHQuZGlzdGNvZGU9Zix0LmRpc3RiaXRzPTV9ZnVuY3Rpb24gWih0LGUscixpKXt2YXIgbixzPXQuc3RhdGU7cmV0dXJuIG51bGw9PT1zLndpbmRvdyYmKHMud3NpemU9MTw8cy53Yml0cyxzLnduZXh0PTAscy53aGF2ZT0wLHMud2luZG93PW5ldyBJLkJ1Zjgocy53c2l6ZSkpLGk+PXMud3NpemU/KEkuYXJyYXlTZXQocy53aW5kb3csZSxyLXMud3NpemUscy53c2l6ZSwwKSxzLnduZXh0PTAscy53aGF2ZT1zLndzaXplKTooaTwobj1zLndzaXplLXMud25leHQpJiYobj1pKSxJLmFycmF5U2V0KHMud2luZG93LGUsci1pLG4scy53bmV4dCksKGktPW4pPyhJLmFycmF5U2V0KHMud2luZG93LGUsci1pLGksMCkscy53bmV4dD1pLHMud2hhdmU9cy53c2l6ZSk6KHMud25leHQrPW4scy53bmV4dD09PXMud3NpemUmJihzLnduZXh0PTApLHMud2hhdmU8cy53c2l6ZSYmKHMud2hhdmUrPW4pKSksMH1yLmluZmxhdGVSZXNldD1vLHIuaW5mbGF0ZVJlc2V0Mj1oLHIuaW5mbGF0ZVJlc2V0S2VlcD1hLHIuaW5mbGF0ZUluaXQ9ZnVuY3Rpb24odCl7cmV0dXJuIHUodCwxNSl9LHIuaW5mbGF0ZUluaXQyPXUsci5pbmZsYXRlPWZ1bmN0aW9uKHQsZSl7dmFyIHIsaSxuLHMsYSxvLGgsdSxsLGYsZCxjLHAsbSxfLGcsYix2LHksdyxrLHgsUyx6LEM9MCxFPW5ldyBJLkJ1ZjgoNCksQT1bMTYsMTcsMTgsMCw4LDcsOSw2LDEwLDUsMTEsNCwxMiwzLDEzLDIsMTQsMSwxNV07aWYoIXR8fCF0LnN0YXRlfHwhdC5vdXRwdXR8fCF0LmlucHV0JiYwIT09dC5hdmFpbF9pbilyZXR1cm4gVTsxMj09PShyPXQuc3RhdGUpLm1vZGUmJihyLm1vZGU9MTMpLGE9dC5uZXh0X291dCxuPXQub3V0cHV0LGg9dC5hdmFpbF9vdXQscz10Lm5leHRfaW4saT10LmlucHV0LG89dC5hdmFpbF9pbix1PXIuaG9sZCxsPXIuYml0cyxmPW8sZD1oLHg9Tjt0OmZvcig7Oylzd2l0Y2goci5tb2RlKXtjYXNlIFA6aWYoMD09PXIud3JhcCl7ci5tb2RlPTEzO2JyZWFrfWZvcig7bDwxNjspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWlmKDImci53cmFwJiYzNTYxNT09PXUpe0Vbci5jaGVjaz0wXT0yNTUmdSxFWzFdPXU+Pj44JjI1NSxyLmNoZWNrPUIoci5jaGVjayxFLDIsMCksbD11PTAsci5tb2RlPTI7YnJlYWt9aWYoci5mbGFncz0wLHIuaGVhZCYmKHIuaGVhZC5kb25lPSExKSwhKDEmci53cmFwKXx8KCgoMjU1JnUpPDw4KSsodT4+OCkpJTMxKXt0Lm1zZz1cImluY29ycmVjdCBoZWFkZXIgY2hlY2tcIixyLm1vZGU9MzA7YnJlYWt9aWYoOCE9KDE1JnUpKXt0Lm1zZz1cInVua25vd24gY29tcHJlc3Npb24gbWV0aG9kXCIsci5tb2RlPTMwO2JyZWFrfWlmKGwtPTQsaz04KygxNSYodT4+Pj00KSksMD09PXIud2JpdHMpci53Yml0cz1rO2Vsc2UgaWYoaz5yLndiaXRzKXt0Lm1zZz1cImludmFsaWQgd2luZG93IHNpemVcIixyLm1vZGU9MzA7YnJlYWt9ci5kbWF4PTE8PGssdC5hZGxlcj1yLmNoZWNrPTEsci5tb2RlPTUxMiZ1PzEwOjEyLGw9dT0wO2JyZWFrO2Nhc2UgMjpmb3IoO2w8MTY7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1pZihyLmZsYWdzPXUsOCE9KDI1NSZyLmZsYWdzKSl7dC5tc2c9XCJ1bmtub3duIGNvbXByZXNzaW9uIG1ldGhvZFwiLHIubW9kZT0zMDticmVha31pZig1NzM0NCZyLmZsYWdzKXt0Lm1zZz1cInVua25vd24gaGVhZGVyIGZsYWdzIHNldFwiLHIubW9kZT0zMDticmVha31yLmhlYWQmJihyLmhlYWQudGV4dD11Pj44JjEpLDUxMiZyLmZsYWdzJiYoRVswXT0yNTUmdSxFWzFdPXU+Pj44JjI1NSxyLmNoZWNrPUIoci5jaGVjayxFLDIsMCkpLGw9dT0wLHIubW9kZT0zO2Nhc2UgMzpmb3IoO2w8MzI7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1yLmhlYWQmJihyLmhlYWQudGltZT11KSw1MTImci5mbGFncyYmKEVbMF09MjU1JnUsRVsxXT11Pj4+OCYyNTUsRVsyXT11Pj4+MTYmMjU1LEVbM109dT4+PjI0JjI1NSxyLmNoZWNrPUIoci5jaGVjayxFLDQsMCkpLGw9dT0wLHIubW9kZT00O2Nhc2UgNDpmb3IoO2w8MTY7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1yLmhlYWQmJihyLmhlYWQueGZsYWdzPTI1NSZ1LHIuaGVhZC5vcz11Pj44KSw1MTImci5mbGFncyYmKEVbMF09MjU1JnUsRVsxXT11Pj4+OCYyNTUsci5jaGVjaz1CKHIuY2hlY2ssRSwyLDApKSxsPXU9MCxyLm1vZGU9NTtjYXNlIDU6aWYoMTAyNCZyLmZsYWdzKXtmb3IoO2w8MTY7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1yLmxlbmd0aD11LHIuaGVhZCYmKHIuaGVhZC5leHRyYV9sZW49dSksNTEyJnIuZmxhZ3MmJihFWzBdPTI1NSZ1LEVbMV09dT4+PjgmMjU1LHIuY2hlY2s9QihyLmNoZWNrLEUsMiwwKSksbD11PTB9ZWxzZSByLmhlYWQmJihyLmhlYWQuZXh0cmE9bnVsbCk7ci5tb2RlPTY7Y2FzZSA2OmlmKDEwMjQmci5mbGFncyYmKG88KGM9ci5sZW5ndGgpJiYoYz1vKSxjJiYoci5oZWFkJiYoaz1yLmhlYWQuZXh0cmFfbGVuLXIubGVuZ3RoLHIuaGVhZC5leHRyYXx8KHIuaGVhZC5leHRyYT1uZXcgQXJyYXkoci5oZWFkLmV4dHJhX2xlbikpLEkuYXJyYXlTZXQoci5oZWFkLmV4dHJhLGkscyxjLGspKSw1MTImci5mbGFncyYmKHIuY2hlY2s9QihyLmNoZWNrLGksYyxzKSksby09YyxzKz1jLHIubGVuZ3RoLT1jKSxyLmxlbmd0aCkpYnJlYWsgdDtyLmxlbmd0aD0wLHIubW9kZT03O2Nhc2UgNzppZigyMDQ4JnIuZmxhZ3Mpe2lmKDA9PT1vKWJyZWFrIHQ7Zm9yKGM9MDtrPWlbcytjKytdLHIuaGVhZCYmayYmci5sZW5ndGg8NjU1MzYmJihyLmhlYWQubmFtZSs9U3RyaW5nLmZyb21DaGFyQ29kZShrKSksayYmYzxvOyk7aWYoNTEyJnIuZmxhZ3MmJihyLmNoZWNrPUIoci5jaGVjayxpLGMscykpLG8tPWMscys9YyxrKWJyZWFrIHR9ZWxzZSByLmhlYWQmJihyLmhlYWQubmFtZT1udWxsKTtyLmxlbmd0aD0wLHIubW9kZT04O2Nhc2UgODppZig0MDk2JnIuZmxhZ3Mpe2lmKDA9PT1vKWJyZWFrIHQ7Zm9yKGM9MDtrPWlbcytjKytdLHIuaGVhZCYmayYmci5sZW5ndGg8NjU1MzYmJihyLmhlYWQuY29tbWVudCs9U3RyaW5nLmZyb21DaGFyQ29kZShrKSksayYmYzxvOyk7aWYoNTEyJnIuZmxhZ3MmJihyLmNoZWNrPUIoci5jaGVjayxpLGMscykpLG8tPWMscys9YyxrKWJyZWFrIHR9ZWxzZSByLmhlYWQmJihyLmhlYWQuY29tbWVudD1udWxsKTtyLm1vZGU9OTtjYXNlIDk6aWYoNTEyJnIuZmxhZ3Mpe2Zvcig7bDwxNjspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWlmKHUhPT0oNjU1MzUmci5jaGVjaykpe3QubXNnPVwiaGVhZGVyIGNyYyBtaXNtYXRjaFwiLHIubW9kZT0zMDticmVha31sPXU9MH1yLmhlYWQmJihyLmhlYWQuaGNyYz1yLmZsYWdzPj45JjEsci5oZWFkLmRvbmU9ITApLHQuYWRsZXI9ci5jaGVjaz0wLHIubW9kZT0xMjticmVhaztjYXNlIDEwOmZvcig7bDwzMjspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fXQuYWRsZXI9ci5jaGVjaz1MKHUpLGw9dT0wLHIubW9kZT0xMTtjYXNlIDExOmlmKDA9PT1yLmhhdmVkaWN0KXJldHVybiB0Lm5leHRfb3V0PWEsdC5hdmFpbF9vdXQ9aCx0Lm5leHRfaW49cyx0LmF2YWlsX2luPW8sci5ob2xkPXUsci5iaXRzPWwsMjt0LmFkbGVyPXIuY2hlY2s9MSxyLm1vZGU9MTI7Y2FzZSAxMjppZig1PT09ZXx8Nj09PWUpYnJlYWsgdDtjYXNlIDEzOmlmKHIubGFzdCl7dT4+Pj03JmwsbC09NyZsLHIubW9kZT0yNzticmVha31mb3IoO2w8Mzspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fXN3aXRjaChyLmxhc3Q9MSZ1LGwtPTEsMyYodT4+Pj0xKSl7Y2FzZSAwOnIubW9kZT0xNDticmVhaztjYXNlIDE6aWYoaihyKSxyLm1vZGU9MjAsNiE9PWUpYnJlYWs7dT4+Pj0yLGwtPTI7YnJlYWsgdDtjYXNlIDI6ci5tb2RlPTE3O2JyZWFrO2Nhc2UgMzp0Lm1zZz1cImludmFsaWQgYmxvY2sgdHlwZVwiLHIubW9kZT0zMH11Pj4+PTIsbC09MjticmVhaztjYXNlIDE0OmZvcih1Pj4+PTcmbCxsLT03Jmw7bDwzMjspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWlmKCg2NTUzNSZ1KSE9KHU+Pj4xNl42NTUzNSkpe3QubXNnPVwiaW52YWxpZCBzdG9yZWQgYmxvY2sgbGVuZ3Roc1wiLHIubW9kZT0zMDticmVha31pZihyLmxlbmd0aD02NTUzNSZ1LGw9dT0wLHIubW9kZT0xNSw2PT09ZSlicmVhayB0O2Nhc2UgMTU6ci5tb2RlPTE2O2Nhc2UgMTY6aWYoYz1yLmxlbmd0aCl7aWYobzxjJiYoYz1vKSxoPGMmJihjPWgpLDA9PT1jKWJyZWFrIHQ7SS5hcnJheVNldChuLGkscyxjLGEpLG8tPWMscys9YyxoLT1jLGErPWMsci5sZW5ndGgtPWM7YnJlYWt9ci5tb2RlPTEyO2JyZWFrO2Nhc2UgMTc6Zm9yKDtsPDE0Oyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9aWYoci5ubGVuPTI1NysoMzEmdSksdT4+Pj01LGwtPTUsci5uZGlzdD0xKygzMSZ1KSx1Pj4+PTUsbC09NSxyLm5jb2RlPTQrKDE1JnUpLHU+Pj49NCxsLT00LDI4NjxyLm5sZW58fDMwPHIubmRpc3Qpe3QubXNnPVwidG9vIG1hbnkgbGVuZ3RoIG9yIGRpc3RhbmNlIHN5bWJvbHNcIixyLm1vZGU9MzA7YnJlYWt9ci5oYXZlPTAsci5tb2RlPTE4O2Nhc2UgMTg6Zm9yKDtyLmhhdmU8ci5uY29kZTspe2Zvcig7bDwzOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9ci5sZW5zW0Fbci5oYXZlKytdXT03JnUsdT4+Pj0zLGwtPTN9Zm9yKDtyLmhhdmU8MTk7KXIubGVuc1tBW3IuaGF2ZSsrXV09MDtpZihyLmxlbmNvZGU9ci5sZW5keW4sci5sZW5iaXRzPTcsUz17Yml0czpyLmxlbmJpdHN9LHg9VCgwLHIubGVucywwLDE5LHIubGVuY29kZSwwLHIud29yayxTKSxyLmxlbmJpdHM9Uy5iaXRzLHgpe3QubXNnPVwiaW52YWxpZCBjb2RlIGxlbmd0aHMgc2V0XCIsci5tb2RlPTMwO2JyZWFrfXIuaGF2ZT0wLHIubW9kZT0xOTtjYXNlIDE5OmZvcig7ci5oYXZlPHIubmxlbityLm5kaXN0Oyl7Zm9yKDtnPShDPXIubGVuY29kZVt1JigxPDxyLmxlbmJpdHMpLTFdKT4+PjE2JjI1NSxiPTY1NTM1JkMsISgoXz1DPj4+MjQpPD1sKTspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWlmKGI8MTYpdT4+Pj1fLGwtPV8sci5sZW5zW3IuaGF2ZSsrXT1iO2Vsc2V7aWYoMTY9PT1iKXtmb3Ioej1fKzI7bDx6Oyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9aWYodT4+Pj1fLGwtPV8sMD09PXIuaGF2ZSl7dC5tc2c9XCJpbnZhbGlkIGJpdCBsZW5ndGggcmVwZWF0XCIsci5tb2RlPTMwO2JyZWFrfWs9ci5sZW5zW3IuaGF2ZS0xXSxjPTMrKDMmdSksdT4+Pj0yLGwtPTJ9ZWxzZSBpZigxNz09PWIpe2Zvcih6PV8rMztsPHo7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1sLT1fLGs9MCxjPTMrKDcmKHU+Pj49XykpLHU+Pj49MyxsLT0zfWVsc2V7Zm9yKHo9Xys3O2w8ejspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWwtPV8saz0wLGM9MTErKDEyNyYodT4+Pj1fKSksdT4+Pj03LGwtPTd9aWYoci5oYXZlK2M+ci5ubGVuK3IubmRpc3Qpe3QubXNnPVwiaW52YWxpZCBiaXQgbGVuZ3RoIHJlcGVhdFwiLHIubW9kZT0zMDticmVha31mb3IoO2MtLTspci5sZW5zW3IuaGF2ZSsrXT1rfX1pZigzMD09PXIubW9kZSlicmVhaztpZigwPT09ci5sZW5zWzI1Nl0pe3QubXNnPVwiaW52YWxpZCBjb2RlIC0tIG1pc3NpbmcgZW5kLW9mLWJsb2NrXCIsci5tb2RlPTMwO2JyZWFrfWlmKHIubGVuYml0cz05LFM9e2JpdHM6ci5sZW5iaXRzfSx4PVQoRCxyLmxlbnMsMCxyLm5sZW4sci5sZW5jb2RlLDAsci53b3JrLFMpLHIubGVuYml0cz1TLmJpdHMseCl7dC5tc2c9XCJpbnZhbGlkIGxpdGVyYWwvbGVuZ3RocyBzZXRcIixyLm1vZGU9MzA7YnJlYWt9aWYoci5kaXN0Yml0cz02LHIuZGlzdGNvZGU9ci5kaXN0ZHluLFM9e2JpdHM6ci5kaXN0Yml0c30seD1UKEYsci5sZW5zLHIubmxlbixyLm5kaXN0LHIuZGlzdGNvZGUsMCxyLndvcmssUyksci5kaXN0Yml0cz1TLmJpdHMseCl7dC5tc2c9XCJpbnZhbGlkIGRpc3RhbmNlcyBzZXRcIixyLm1vZGU9MzA7YnJlYWt9aWYoci5tb2RlPTIwLDY9PT1lKWJyZWFrIHQ7Y2FzZSAyMDpyLm1vZGU9MjE7Y2FzZSAyMTppZig2PD1vJiYyNTg8PWgpe3QubmV4dF9vdXQ9YSx0LmF2YWlsX291dD1oLHQubmV4dF9pbj1zLHQuYXZhaWxfaW49byxyLmhvbGQ9dSxyLmJpdHM9bCxSKHQsZCksYT10Lm5leHRfb3V0LG49dC5vdXRwdXQsaD10LmF2YWlsX291dCxzPXQubmV4dF9pbixpPXQuaW5wdXQsbz10LmF2YWlsX2luLHU9ci5ob2xkLGw9ci5iaXRzLDEyPT09ci5tb2RlJiYoci5iYWNrPS0xKTticmVha31mb3Ioci5iYWNrPTA7Zz0oQz1yLmxlbmNvZGVbdSYoMTw8ci5sZW5iaXRzKS0xXSk+Pj4xNiYyNTUsYj02NTUzNSZDLCEoKF89Qz4+PjI0KTw9bCk7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1pZihnJiYwPT0oMjQwJmcpKXtmb3Iodj1fLHk9Zyx3PWI7Zz0oQz1yLmxlbmNvZGVbdysoKHUmKDE8PHYreSktMSk+PnYpXSk+Pj4xNiYyNTUsYj02NTUzNSZDLCEodisoXz1DPj4+MjQpPD1sKTspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fXU+Pj49dixsLT12LHIuYmFjays9dn1pZih1Pj4+PV8sbC09XyxyLmJhY2srPV8sci5sZW5ndGg9YiwwPT09Zyl7ci5tb2RlPTI2O2JyZWFrfWlmKDMyJmcpe3IuYmFjaz0tMSxyLm1vZGU9MTI7YnJlYWt9aWYoNjQmZyl7dC5tc2c9XCJpbnZhbGlkIGxpdGVyYWwvbGVuZ3RoIGNvZGVcIixyLm1vZGU9MzA7YnJlYWt9ci5leHRyYT0xNSZnLHIubW9kZT0yMjtjYXNlIDIyOmlmKHIuZXh0cmEpe2Zvcih6PXIuZXh0cmE7bDx6Oyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9ci5sZW5ndGgrPXUmKDE8PHIuZXh0cmEpLTEsdT4+Pj1yLmV4dHJhLGwtPXIuZXh0cmEsci5iYWNrKz1yLmV4dHJhfXIud2FzPXIubGVuZ3RoLHIubW9kZT0yMztjYXNlIDIzOmZvcig7Zz0oQz1yLmRpc3Rjb2RlW3UmKDE8PHIuZGlzdGJpdHMpLTFdKT4+PjE2JjI1NSxiPTY1NTM1JkMsISgoXz1DPj4+MjQpPD1sKTspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWlmKDA9PSgyNDAmZykpe2Zvcih2PV8seT1nLHc9YjtnPShDPXIuZGlzdGNvZGVbdysoKHUmKDE8PHYreSktMSk+PnYpXSk+Pj4xNiYyNTUsYj02NTUzNSZDLCEodisoXz1DPj4+MjQpPD1sKTspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fXU+Pj49dixsLT12LHIuYmFjays9dn1pZih1Pj4+PV8sbC09XyxyLmJhY2srPV8sNjQmZyl7dC5tc2c9XCJpbnZhbGlkIGRpc3RhbmNlIGNvZGVcIixyLm1vZGU9MzA7YnJlYWt9ci5vZmZzZXQ9YixyLmV4dHJhPTE1Jmcsci5tb2RlPTI0O2Nhc2UgMjQ6aWYoci5leHRyYSl7Zm9yKHo9ci5leHRyYTtsPHo7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1yLm9mZnNldCs9dSYoMTw8ci5leHRyYSktMSx1Pj4+PXIuZXh0cmEsbC09ci5leHRyYSxyLmJhY2srPXIuZXh0cmF9aWYoci5vZmZzZXQ+ci5kbWF4KXt0Lm1zZz1cImludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrXCIsci5tb2RlPTMwO2JyZWFrfXIubW9kZT0yNTtjYXNlIDI1OmlmKDA9PT1oKWJyZWFrIHQ7aWYoYz1kLWgsci5vZmZzZXQ+Yyl7aWYoKGM9ci5vZmZzZXQtYyk+ci53aGF2ZSYmci5zYW5lKXt0Lm1zZz1cImludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrXCIsci5tb2RlPTMwO2JyZWFrfXA9Yz5yLnduZXh0PyhjLT1yLnduZXh0LHIud3NpemUtYyk6ci53bmV4dC1jLGM+ci5sZW5ndGgmJihjPXIubGVuZ3RoKSxtPXIud2luZG93fWVsc2UgbT1uLHA9YS1yLm9mZnNldCxjPXIubGVuZ3RoO2ZvcihoPGMmJihjPWgpLGgtPWMsci5sZW5ndGgtPWM7blthKytdPW1bcCsrXSwtLWM7KTswPT09ci5sZW5ndGgmJihyLm1vZGU9MjEpO2JyZWFrO2Nhc2UgMjY6aWYoMD09PWgpYnJlYWsgdDtuW2ErK109ci5sZW5ndGgsaC0tLHIubW9kZT0yMTticmVhaztjYXNlIDI3OmlmKHIud3JhcCl7Zm9yKDtsPDMyOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdXw9aVtzKytdPDxsLGwrPTh9aWYoZC09aCx0LnRvdGFsX291dCs9ZCxyLnRvdGFsKz1kLGQmJih0LmFkbGVyPXIuY2hlY2s9ci5mbGFncz9CKHIuY2hlY2ssbixkLGEtZCk6TyhyLmNoZWNrLG4sZCxhLWQpKSxkPWgsKHIuZmxhZ3M/dTpMKHUpKSE9PXIuY2hlY2spe3QubXNnPVwiaW5jb3JyZWN0IGRhdGEgY2hlY2tcIixyLm1vZGU9MzA7YnJlYWt9bD11PTB9ci5tb2RlPTI4O2Nhc2UgMjg6aWYoci53cmFwJiZyLmZsYWdzKXtmb3IoO2w8MzI7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1pZih1IT09KDQyOTQ5NjcyOTUmci50b3RhbCkpe3QubXNnPVwiaW5jb3JyZWN0IGxlbmd0aCBjaGVja1wiLHIubW9kZT0zMDticmVha31sPXU9MH1yLm1vZGU9Mjk7Y2FzZSAyOTp4PTE7YnJlYWsgdDtjYXNlIDMwOng9LTM7YnJlYWsgdDtjYXNlIDMxOnJldHVybi00O2Nhc2UgMzI6ZGVmYXVsdDpyZXR1cm4gVX1yZXR1cm4gdC5uZXh0X291dD1hLHQuYXZhaWxfb3V0PWgsdC5uZXh0X2luPXMsdC5hdmFpbF9pbj1vLHIuaG9sZD11LHIuYml0cz1sLChyLndzaXplfHxkIT09dC5hdmFpbF9vdXQmJnIubW9kZTwzMCYmKHIubW9kZTwyN3x8NCE9PWUpKSYmWih0LHQub3V0cHV0LHQubmV4dF9vdXQsZC10LmF2YWlsX291dCk/KHIubW9kZT0zMSwtNCk6KGYtPXQuYXZhaWxfaW4sZC09dC5hdmFpbF9vdXQsdC50b3RhbF9pbis9Zix0LnRvdGFsX291dCs9ZCxyLnRvdGFsKz1kLHIud3JhcCYmZCYmKHQuYWRsZXI9ci5jaGVjaz1yLmZsYWdzP0Ioci5jaGVjayxuLGQsdC5uZXh0X291dC1kKTpPKHIuY2hlY2ssbixkLHQubmV4dF9vdXQtZCkpLHQuZGF0YV90eXBlPXIuYml0cysoci5sYXN0PzY0OjApKygxMj09PXIubW9kZT8xMjg6MCkrKDIwPT09ci5tb2RlfHwxNT09PXIubW9kZT8yNTY6MCksKDA9PWYmJjA9PT1kfHw0PT09ZSkmJng9PT1OJiYoeD0tNSkseCl9LHIuaW5mbGF0ZUVuZD1mdW5jdGlvbih0KXtpZighdHx8IXQuc3RhdGUpcmV0dXJuIFU7dmFyIGU9dC5zdGF0ZTtyZXR1cm4gZS53aW5kb3cmJihlLndpbmRvdz1udWxsKSx0LnN0YXRlPW51bGwsTn0sci5pbmZsYXRlR2V0SGVhZGVyPWZ1bmN0aW9uKHQsZSl7dmFyIHI7cmV0dXJuIHQmJnQuc3RhdGU/MD09KDImKHI9dC5zdGF0ZSkud3JhcCk/VTooKHIuaGVhZD1lKS5kb25lPSExLE4pOlV9LHIuaW5mbGF0ZVNldERpY3Rpb25hcnk9ZnVuY3Rpb24odCxlKXt2YXIgcixpPWUubGVuZ3RoO3JldHVybiB0JiZ0LnN0YXRlPzAhPT0ocj10LnN0YXRlKS53cmFwJiYxMSE9PXIubW9kZT9VOjExPT09ci5tb2RlJiZPKDEsZSxpLDApIT09ci5jaGVjaz8tMzpaKHQsZSxpLGkpPyhyLm1vZGU9MzEsLTQpOihyLmhhdmVkaWN0PTEsTik6VX0sci5pbmZsYXRlSW5mbz1cInBha28gaW5mbGF0ZSAoZnJvbSBOb2RlY2EgcHJvamVjdClcIn0se1wiLi4vdXRpbHMvY29tbW9uXCI6NDEsXCIuL2FkbGVyMzJcIjo0MyxcIi4vY3JjMzJcIjo0NSxcIi4vaW5mZmFzdFwiOjQ4LFwiLi9pbmZ0cmVlc1wiOjUwfV0sNTA6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgRD10KFwiLi4vdXRpbHMvY29tbW9uXCIpLEY9WzMsNCw1LDYsNyw4LDksMTAsMTEsMTMsMTUsMTcsMTksMjMsMjcsMzEsMzUsNDMsNTEsNTksNjcsODMsOTksMTE1LDEzMSwxNjMsMTk1LDIyNywyNTgsMCwwXSxOPVsxNiwxNiwxNiwxNiwxNiwxNiwxNiwxNiwxNywxNywxNywxNywxOCwxOCwxOCwxOCwxOSwxOSwxOSwxOSwyMCwyMCwyMCwyMCwyMSwyMSwyMSwyMSwxNiw3Miw3OF0sVT1bMSwyLDMsNCw1LDcsOSwxMywxNywyNSwzMyw0OSw2NSw5NywxMjksMTkzLDI1NywzODUsNTEzLDc2OSwxMDI1LDE1MzcsMjA0OSwzMDczLDQwOTcsNjE0NSw4MTkzLDEyMjg5LDE2Mzg1LDI0NTc3LDAsMF0sUD1bMTYsMTYsMTYsMTYsMTcsMTcsMTgsMTgsMTksMTksMjAsMjAsMjEsMjEsMjIsMjIsMjMsMjMsMjQsMjQsMjUsMjUsMjYsMjYsMjcsMjcsMjgsMjgsMjksMjksNjQsNjRdO2UuZXhwb3J0cz1mdW5jdGlvbih0LGUscixpLG4scyxhLG8pe3ZhciBoLHUsbCxmLGQsYyxwLG0sXyxnPW8uYml0cyxiPTAsdj0wLHk9MCx3PTAsaz0wLHg9MCxTPTAsej0wLEM9MCxFPTAsQT1udWxsLEk9MCxPPW5ldyBELkJ1ZjE2KDE2KSxCPW5ldyBELkJ1ZjE2KDE2KSxSPW51bGwsVD0wO2ZvcihiPTA7Yjw9MTU7YisrKU9bYl09MDtmb3Iodj0wO3Y8aTt2KyspT1tlW3Irdl1dKys7Zm9yKGs9Zyx3PTE1OzE8PXcmJjA9PT1PW3ddO3ctLSk7aWYodzxrJiYoaz13KSwwPT09dylyZXR1cm4gbltzKytdPTIwOTcxNTIwLG5bcysrXT0yMDk3MTUyMCxvLmJpdHM9MSwwO2Zvcih5PTE7eTx3JiYwPT09T1t5XTt5KyspO2ZvcihrPHkmJihrPXkpLGI9ej0xO2I8PTE1O2IrKylpZih6PDw9MSwoei09T1tiXSk8MClyZXR1cm4tMTtpZigwPHomJigwPT09dHx8MSE9PXcpKXJldHVybi0xO2ZvcihCWzFdPTAsYj0xO2I8MTU7YisrKUJbYisxXT1CW2JdK09bYl07Zm9yKHY9MDt2PGk7disrKTAhPT1lW3Irdl0mJihhW0JbZVtyK3ZdXSsrXT12KTtpZihjPTA9PT10PyhBPVI9YSwxOSk6MT09PXQ/KEE9RixJLT0yNTcsUj1OLFQtPTI1NywyNTYpOihBPVUsUj1QLC0xKSxiPXksZD1zLFM9dj1FPTAsbD0tMSxmPShDPTE8PCh4PWspKS0xLDE9PT10JiY4NTI8Q3x8Mj09PXQmJjU5MjxDKXJldHVybiAxO2Zvcig7Oyl7Zm9yKHA9Yi1TLF89YVt2XTxjPyhtPTAsYVt2XSk6YVt2XT5jPyhtPVJbVCthW3ZdXSxBW0krYVt2XV0pOihtPTk2LDApLGg9MTw8Yi1TLHk9dT0xPDx4O25bZCsoRT4+UykrKHUtPWgpXT1wPDwyNHxtPDwxNnxffDAsMCE9PXU7KTtmb3IoaD0xPDxiLTE7RSZoOyloPj49MTtpZigwIT09aD8oRSY9aC0xLEUrPWgpOkU9MCx2KyssMD09LS1PW2JdKXtpZihiPT09dylicmVhaztiPWVbcithW3ZdXX1pZihrPGImJihFJmYpIT09bCl7Zm9yKDA9PT1TJiYoUz1rKSxkKz15LHo9MTw8KHg9Yi1TKTt4K1M8dyYmISgoei09T1t4K1NdKTw9MCk7KXgrKyx6PDw9MTtpZihDKz0xPDx4LDE9PT10JiY4NTI8Q3x8Mj09PXQmJjU5MjxDKXJldHVybiAxO25bbD1FJmZdPWs8PDI0fHg8PDE2fGQtc3wwfX1yZXR1cm4gMCE9PUUmJihuW2QrRV09Yi1TPDwyNHw2NDw8MTZ8MCksby5iaXRzPWssMH19LHtcIi4uL3V0aWxzL2NvbW1vblwiOjQxfV0sNTE6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtlLmV4cG9ydHM9ezI6XCJuZWVkIGRpY3Rpb25hcnlcIiwxOlwic3RyZWFtIGVuZFwiLDA6XCJcIixcIi0xXCI6XCJmaWxlIGVycm9yXCIsXCItMlwiOlwic3RyZWFtIGVycm9yXCIsXCItM1wiOlwiZGF0YSBlcnJvclwiLFwiLTRcIjpcImluc3VmZmljaWVudCBtZW1vcnlcIixcIi01XCI6XCJidWZmZXIgZXJyb3JcIixcIi02XCI6XCJpbmNvbXBhdGlibGUgdmVyc2lvblwifX0se31dLDUyOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG49dChcIi4uL3V0aWxzL2NvbW1vblwiKSxvPTAsaD0xO2Z1bmN0aW9uIGkodCl7Zm9yKHZhciBlPXQubGVuZ3RoOzA8PS0tZTspdFtlXT0wfXZhciBzPTAsYT0yOSx1PTI1NixsPXUrMSthLGY9MzAsZD0xOSxfPTIqbCsxLGc9MTUsYz0xNixwPTcsbT0yNTYsYj0xNix2PTE3LHk9MTgsdz1bMCwwLDAsMCwwLDAsMCwwLDEsMSwxLDEsMiwyLDIsMiwzLDMsMywzLDQsNCw0LDQsNSw1LDUsNSwwXSxrPVswLDAsMCwwLDEsMSwyLDIsMywzLDQsNCw1LDUsNiw2LDcsNyw4LDgsOSw5LDEwLDEwLDExLDExLDEyLDEyLDEzLDEzXSx4PVswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDIsMyw3XSxTPVsxNiwxNywxOCwwLDgsNyw5LDYsMTAsNSwxMSw0LDEyLDMsMTMsMiwxNCwxLDE1XSx6PW5ldyBBcnJheSgyKihsKzIpKTtpKHopO3ZhciBDPW5ldyBBcnJheSgyKmYpO2koQyk7dmFyIEU9bmV3IEFycmF5KDUxMik7aShFKTt2YXIgQT1uZXcgQXJyYXkoMjU2KTtpKEEpO3ZhciBJPW5ldyBBcnJheShhKTtpKEkpO3ZhciBPLEIsUixUPW5ldyBBcnJheShmKTtmdW5jdGlvbiBEKHQsZSxyLGksbil7dGhpcy5zdGF0aWNfdHJlZT10LHRoaXMuZXh0cmFfYml0cz1lLHRoaXMuZXh0cmFfYmFzZT1yLHRoaXMuZWxlbXM9aSx0aGlzLm1heF9sZW5ndGg9bix0aGlzLmhhc19zdHJlZT10JiZ0Lmxlbmd0aH1mdW5jdGlvbiBGKHQsZSl7dGhpcy5keW5fdHJlZT10LHRoaXMubWF4X2NvZGU9MCx0aGlzLnN0YXRfZGVzYz1lfWZ1bmN0aW9uIE4odCl7cmV0dXJuIHQ8MjU2P0VbdF06RVsyNTYrKHQ+Pj43KV19ZnVuY3Rpb24gVSh0LGUpe3QucGVuZGluZ19idWZbdC5wZW5kaW5nKytdPTI1NSZlLHQucGVuZGluZ19idWZbdC5wZW5kaW5nKytdPWU+Pj44JjI1NX1mdW5jdGlvbiBQKHQsZSxyKXt0LmJpX3ZhbGlkPmMtcj8odC5iaV9idWZ8PWU8PHQuYmlfdmFsaWQmNjU1MzUsVSh0LHQuYmlfYnVmKSx0LmJpX2J1Zj1lPj5jLXQuYmlfdmFsaWQsdC5iaV92YWxpZCs9ci1jKToodC5iaV9idWZ8PWU8PHQuYmlfdmFsaWQmNjU1MzUsdC5iaV92YWxpZCs9cil9ZnVuY3Rpb24gTCh0LGUscil7UCh0LHJbMiplXSxyWzIqZSsxXSl9ZnVuY3Rpb24gaih0LGUpe2Zvcih2YXIgcj0wO3J8PTEmdCx0Pj4+PTEscjw8PTEsMDwtLWU7KTtyZXR1cm4gcj4+PjF9ZnVuY3Rpb24gWih0LGUscil7dmFyIGksbixzPW5ldyBBcnJheShnKzEpLGE9MDtmb3IoaT0xO2k8PWc7aSsrKXNbaV09YT1hK3JbaS0xXTw8MTtmb3Iobj0wO248PWU7bisrKXt2YXIgbz10WzIqbisxXTswIT09byYmKHRbMipuXT1qKHNbb10rKyxvKSl9fWZ1bmN0aW9uIFcodCl7dmFyIGU7Zm9yKGU9MDtlPGw7ZSsrKXQuZHluX2x0cmVlWzIqZV09MDtmb3IoZT0wO2U8ZjtlKyspdC5keW5fZHRyZWVbMiplXT0wO2ZvcihlPTA7ZTxkO2UrKyl0LmJsX3RyZWVbMiplXT0wO3QuZHluX2x0cmVlWzIqbV09MSx0Lm9wdF9sZW49dC5zdGF0aWNfbGVuPTAsdC5sYXN0X2xpdD10Lm1hdGNoZXM9MH1mdW5jdGlvbiBNKHQpezg8dC5iaV92YWxpZD9VKHQsdC5iaV9idWYpOjA8dC5iaV92YWxpZCYmKHQucGVuZGluZ19idWZbdC5wZW5kaW5nKytdPXQuYmlfYnVmKSx0LmJpX2J1Zj0wLHQuYmlfdmFsaWQ9MH1mdW5jdGlvbiBIKHQsZSxyLGkpe3ZhciBuPTIqZSxzPTIqcjtyZXR1cm4gdFtuXTx0W3NdfHx0W25dPT09dFtzXSYmaVtlXTw9aVtyXX1mdW5jdGlvbiBHKHQsZSxyKXtmb3IodmFyIGk9dC5oZWFwW3JdLG49cjw8MTtuPD10LmhlYXBfbGVuJiYobjx0LmhlYXBfbGVuJiZIKGUsdC5oZWFwW24rMV0sdC5oZWFwW25dLHQuZGVwdGgpJiZuKyssIUgoZSxpLHQuaGVhcFtuXSx0LmRlcHRoKSk7KXQuaGVhcFtyXT10LmhlYXBbbl0scj1uLG48PD0xO3QuaGVhcFtyXT1pfWZ1bmN0aW9uIEsodCxlLHIpe3ZhciBpLG4scyxhLG89MDtpZigwIT09dC5sYXN0X2xpdClmb3IoO2k9dC5wZW5kaW5nX2J1Zlt0LmRfYnVmKzIqb108PDh8dC5wZW5kaW5nX2J1Zlt0LmRfYnVmKzIqbysxXSxuPXQucGVuZGluZ19idWZbdC5sX2J1ZitvXSxvKyssMD09PWk/TCh0LG4sZSk6KEwodCwocz1BW25dKSt1KzEsZSksMCE9PShhPXdbc10pJiZQKHQsbi09SVtzXSxhKSxMKHQscz1OKC0taSksciksMCE9PShhPWtbc10pJiZQKHQsaS09VFtzXSxhKSksbzx0Lmxhc3RfbGl0Oyk7TCh0LG0sZSl9ZnVuY3Rpb24gWSh0LGUpe3ZhciByLGksbixzPWUuZHluX3RyZWUsYT1lLnN0YXRfZGVzYy5zdGF0aWNfdHJlZSxvPWUuc3RhdF9kZXNjLmhhc19zdHJlZSxoPWUuc3RhdF9kZXNjLmVsZW1zLHU9LTE7Zm9yKHQuaGVhcF9sZW49MCx0LmhlYXBfbWF4PV8scj0wO3I8aDtyKyspMCE9PXNbMipyXT8odC5oZWFwWysrdC5oZWFwX2xlbl09dT1yLHQuZGVwdGhbcl09MCk6c1syKnIrMV09MDtmb3IoO3QuaGVhcF9sZW48Mjspc1syKihuPXQuaGVhcFsrK3QuaGVhcF9sZW5dPXU8Mj8rK3U6MCldPTEsdC5kZXB0aFtuXT0wLHQub3B0X2xlbi0tLG8mJih0LnN0YXRpY19sZW4tPWFbMipuKzFdKTtmb3IoZS5tYXhfY29kZT11LHI9dC5oZWFwX2xlbj4+MTsxPD1yO3ItLSlHKHQscyxyKTtmb3Iobj1oO3I9dC5oZWFwWzFdLHQuaGVhcFsxXT10LmhlYXBbdC5oZWFwX2xlbi0tXSxHKHQscywxKSxpPXQuaGVhcFsxXSx0LmhlYXBbLS10LmhlYXBfbWF4XT1yLHQuaGVhcFstLXQuaGVhcF9tYXhdPWksc1syKm5dPXNbMipyXStzWzIqaV0sdC5kZXB0aFtuXT0odC5kZXB0aFtyXT49dC5kZXB0aFtpXT90LmRlcHRoW3JdOnQuZGVwdGhbaV0pKzEsc1syKnIrMV09c1syKmkrMV09bix0LmhlYXBbMV09bisrLEcodCxzLDEpLDI8PXQuaGVhcF9sZW47KTt0LmhlYXBbLS10LmhlYXBfbWF4XT10LmhlYXBbMV0sZnVuY3Rpb24odCxlKXt2YXIgcixpLG4scyxhLG8saD1lLmR5bl90cmVlLHU9ZS5tYXhfY29kZSxsPWUuc3RhdF9kZXNjLnN0YXRpY190cmVlLGY9ZS5zdGF0X2Rlc2MuaGFzX3N0cmVlLGQ9ZS5zdGF0X2Rlc2MuZXh0cmFfYml0cyxjPWUuc3RhdF9kZXNjLmV4dHJhX2Jhc2UscD1lLnN0YXRfZGVzYy5tYXhfbGVuZ3RoLG09MDtmb3Iocz0wO3M8PWc7cysrKXQuYmxfY291bnRbc109MDtmb3IoaFsyKnQuaGVhcFt0LmhlYXBfbWF4XSsxXT0wLHI9dC5oZWFwX21heCsxO3I8XztyKyspcDwocz1oWzIqaFsyKihpPXQuaGVhcFtyXSkrMV0rMV0rMSkmJihzPXAsbSsrKSxoWzIqaSsxXT1zLHU8aXx8KHQuYmxfY291bnRbc10rKyxhPTAsYzw9aSYmKGE9ZFtpLWNdKSxvPWhbMippXSx0Lm9wdF9sZW4rPW8qKHMrYSksZiYmKHQuc3RhdGljX2xlbis9byoobFsyKmkrMV0rYSkpKTtpZigwIT09bSl7ZG97Zm9yKHM9cC0xOzA9PT10LmJsX2NvdW50W3NdOylzLS07dC5ibF9jb3VudFtzXS0tLHQuYmxfY291bnRbcysxXSs9Mix0LmJsX2NvdW50W3BdLS0sbS09Mn13aGlsZSgwPG0pO2ZvcihzPXA7MCE9PXM7cy0tKWZvcihpPXQuYmxfY291bnRbc107MCE9PWk7KXU8KG49dC5oZWFwWy0tcl0pfHwoaFsyKm4rMV0hPT1zJiYodC5vcHRfbGVuKz0ocy1oWzIqbisxXSkqaFsyKm5dLGhbMipuKzFdPXMpLGktLSl9fSh0LGUpLFoocyx1LHQuYmxfY291bnQpfWZ1bmN0aW9uIFgodCxlLHIpe3ZhciBpLG4scz0tMSxhPWVbMV0sbz0wLGg9Nyx1PTQ7Zm9yKDA9PT1hJiYoaD0xMzgsdT0zKSxlWzIqKHIrMSkrMV09NjU1MzUsaT0wO2k8PXI7aSsrKW49YSxhPWVbMiooaSsxKSsxXSwrK288aCYmbj09PWF8fChvPHU/dC5ibF90cmVlWzIqbl0rPW86MCE9PW4/KG4hPT1zJiZ0LmJsX3RyZWVbMipuXSsrLHQuYmxfdHJlZVsyKmJdKyspOm88PTEwP3QuYmxfdHJlZVsyKnZdKys6dC5ibF90cmVlWzIqeV0rKyxzPW4sdT0obz0wKT09PWE/KGg9MTM4LDMpOm49PT1hPyhoPTYsMyk6KGg9Nyw0KSl9ZnVuY3Rpb24gVih0LGUscil7dmFyIGksbixzPS0xLGE9ZVsxXSxvPTAsaD03LHU9NDtmb3IoMD09PWEmJihoPTEzOCx1PTMpLGk9MDtpPD1yO2krKylpZihuPWEsYT1lWzIqKGkrMSkrMV0sISgrK288aCYmbj09PWEpKXtpZihvPHUpZm9yKDtMKHQsbix0LmJsX3RyZWUpLDAhPS0tbzspO2Vsc2UgMCE9PW4/KG4hPT1zJiYoTCh0LG4sdC5ibF90cmVlKSxvLS0pLEwodCxiLHQuYmxfdHJlZSksUCh0LG8tMywyKSk6bzw9MTA/KEwodCx2LHQuYmxfdHJlZSksUCh0LG8tMywzKSk6KEwodCx5LHQuYmxfdHJlZSksUCh0LG8tMTEsNykpO3M9bix1PShvPTApPT09YT8oaD0xMzgsMyk6bj09PWE/KGg9NiwzKTooaD03LDQpfX1pKFQpO3ZhciBxPSExO2Z1bmN0aW9uIEoodCxlLHIsaSl7UCh0LChzPDwxKSsoaT8xOjApLDMpLGZ1bmN0aW9uKHQsZSxyLGkpe00odCksaSYmKFUodCxyKSxVKHQsfnIpKSxuLmFycmF5U2V0KHQucGVuZGluZ19idWYsdC53aW5kb3csZSxyLHQucGVuZGluZyksdC5wZW5kaW5nKz1yfSh0LGUsciwhMCl9ci5fdHJfaW5pdD1mdW5jdGlvbih0KXtxfHwoZnVuY3Rpb24oKXt2YXIgdCxlLHIsaSxuLHM9bmV3IEFycmF5KGcrMSk7Zm9yKGk9cj0wO2k8YS0xO2krKylmb3IoSVtpXT1yLHQ9MDt0PDE8PHdbaV07dCsrKUFbcisrXT1pO2ZvcihBW3ItMV09aSxpPW49MDtpPDE2O2krKylmb3IoVFtpXT1uLHQ9MDt0PDE8PGtbaV07dCsrKUVbbisrXT1pO2ZvcihuPj49NztpPGY7aSsrKWZvcihUW2ldPW48PDcsdD0wO3Q8MTw8a1tpXS03O3QrKylFWzI1NituKytdPWk7Zm9yKGU9MDtlPD1nO2UrKylzW2VdPTA7Zm9yKHQ9MDt0PD0xNDM7KXpbMip0KzFdPTgsdCsrLHNbOF0rKztmb3IoO3Q8PTI1NTspelsyKnQrMV09OSx0Kyssc1s5XSsrO2Zvcig7dDw9Mjc5Oyl6WzIqdCsxXT03LHQrKyxzWzddKys7Zm9yKDt0PD0yODc7KXpbMip0KzFdPTgsdCsrLHNbOF0rKztmb3IoWih6LGwrMSxzKSx0PTA7dDxmO3QrKylDWzIqdCsxXT01LENbMip0XT1qKHQsNSk7Tz1uZXcgRCh6LHcsdSsxLGwsZyksQj1uZXcgRChDLGssMCxmLGcpLFI9bmV3IEQobmV3IEFycmF5KDApLHgsMCxkLHApfSgpLHE9ITApLHQubF9kZXNjPW5ldyBGKHQuZHluX2x0cmVlLE8pLHQuZF9kZXNjPW5ldyBGKHQuZHluX2R0cmVlLEIpLHQuYmxfZGVzYz1uZXcgRih0LmJsX3RyZWUsUiksdC5iaV9idWY9MCx0LmJpX3ZhbGlkPTAsVyh0KX0sci5fdHJfc3RvcmVkX2Jsb2NrPUosci5fdHJfZmx1c2hfYmxvY2s9ZnVuY3Rpb24odCxlLHIsaSl7dmFyIG4scyxhPTA7MDx0LmxldmVsPygyPT09dC5zdHJtLmRhdGFfdHlwZSYmKHQuc3RybS5kYXRhX3R5cGU9ZnVuY3Rpb24odCl7dmFyIGUscj00MDkzNjI0NDQ3O2ZvcihlPTA7ZTw9MzE7ZSsrLHI+Pj49MSlpZigxJnImJjAhPT10LmR5bl9sdHJlZVsyKmVdKXJldHVybiBvO2lmKDAhPT10LmR5bl9sdHJlZVsxOF18fDAhPT10LmR5bl9sdHJlZVsyMF18fDAhPT10LmR5bl9sdHJlZVsyNl0pcmV0dXJuIGg7Zm9yKGU9MzI7ZTx1O2UrKylpZigwIT09dC5keW5fbHRyZWVbMiplXSlyZXR1cm4gaDtyZXR1cm4gb30odCkpLFkodCx0LmxfZGVzYyksWSh0LHQuZF9kZXNjKSxhPWZ1bmN0aW9uKHQpe3ZhciBlO2ZvcihYKHQsdC5keW5fbHRyZWUsdC5sX2Rlc2MubWF4X2NvZGUpLFgodCx0LmR5bl9kdHJlZSx0LmRfZGVzYy5tYXhfY29kZSksWSh0LHQuYmxfZGVzYyksZT1kLTE7Mzw9ZSYmMD09PXQuYmxfdHJlZVsyKlNbZV0rMV07ZS0tKTtyZXR1cm4gdC5vcHRfbGVuKz0zKihlKzEpKzUrNSs0LGV9KHQpLG49dC5vcHRfbGVuKzMrNz4+PjMsKHM9dC5zdGF0aWNfbGVuKzMrNz4+PjMpPD1uJiYobj1zKSk6bj1zPXIrNSxyKzQ8PW4mJi0xIT09ZT9KKHQsZSxyLGkpOjQ9PT10LnN0cmF0ZWd5fHxzPT09bj8oUCh0LDIrKGk/MTowKSwzKSxLKHQseixDKSk6KFAodCw0KyhpPzE6MCksMyksZnVuY3Rpb24odCxlLHIsaSl7dmFyIG47Zm9yKFAodCxlLTI1Nyw1KSxQKHQsci0xLDUpLFAodCxpLTQsNCksbj0wO248aTtuKyspUCh0LHQuYmxfdHJlZVsyKlNbbl0rMV0sMyk7Vih0LHQuZHluX2x0cmVlLGUtMSksVih0LHQuZHluX2R0cmVlLHItMSl9KHQsdC5sX2Rlc2MubWF4X2NvZGUrMSx0LmRfZGVzYy5tYXhfY29kZSsxLGErMSksSyh0LHQuZHluX2x0cmVlLHQuZHluX2R0cmVlKSksVyh0KSxpJiZNKHQpfSxyLl90cl90YWxseT1mdW5jdGlvbih0LGUscil7cmV0dXJuIHQucGVuZGluZ19idWZbdC5kX2J1ZisyKnQubGFzdF9saXRdPWU+Pj44JjI1NSx0LnBlbmRpbmdfYnVmW3QuZF9idWYrMip0Lmxhc3RfbGl0KzFdPTI1NSZlLHQucGVuZGluZ19idWZbdC5sX2J1Zit0Lmxhc3RfbGl0XT0yNTUmcix0Lmxhc3RfbGl0KyssMD09PWU/dC5keW5fbHRyZWVbMipyXSsrOih0Lm1hdGNoZXMrKyxlLS0sdC5keW5fbHRyZWVbMiooQVtyXSt1KzEpXSsrLHQuZHluX2R0cmVlWzIqTihlKV0rKyksdC5sYXN0X2xpdD09PXQubGl0X2J1ZnNpemUtMX0sci5fdHJfYWxpZ249ZnVuY3Rpb24odCl7UCh0LDIsMyksTCh0LG0seiksZnVuY3Rpb24odCl7MTY9PT10LmJpX3ZhbGlkPyhVKHQsdC5iaV9idWYpLHQuYmlfYnVmPTAsdC5iaV92YWxpZD0wKTo4PD10LmJpX3ZhbGlkJiYodC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmcrK109MjU1JnQuYmlfYnVmLHQuYmlfYnVmPj49OCx0LmJpX3ZhbGlkLT04KX0odCl9fSx7XCIuLi91dGlscy9jb21tb25cIjo0MX1dLDUzOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZS5leHBvcnRzPWZ1bmN0aW9uKCl7dGhpcy5pbnB1dD1udWxsLHRoaXMubmV4dF9pbj0wLHRoaXMuYXZhaWxfaW49MCx0aGlzLnRvdGFsX2luPTAsdGhpcy5vdXRwdXQ9bnVsbCx0aGlzLm5leHRfb3V0PTAsdGhpcy5hdmFpbF9vdXQ9MCx0aGlzLnRvdGFsX291dD0wLHRoaXMubXNnPVwiXCIsdGhpcy5zdGF0ZT1udWxsLHRoaXMuZGF0YV90eXBlPTIsdGhpcy5hZGxlcj0wfX0se31dLDU0OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZS5leHBvcnRzPVwiZnVuY3Rpb25cIj09dHlwZW9mIHNldEltbWVkaWF0ZT9zZXRJbW1lZGlhdGU6ZnVuY3Rpb24oKXt2YXIgdD1bXS5zbGljZS5hcHBseShhcmd1bWVudHMpO3Quc3BsaWNlKDEsMCwwKSxzZXRUaW1lb3V0LmFwcGx5KG51bGwsdCl9fSx7fV19LHt9LFsxMF0pKDEwKX0pOyIsIi8qXG5vYmplY3QtYXNzaWduXG4oYykgU2luZHJlIFNvcmh1c1xuQGxpY2Vuc2UgTUlUXG4qL1xuXG4ndXNlIHN0cmljdCc7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xudmFyIGdldE93blByb3BlcnR5U3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHM7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHByb3BJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5mdW5jdGlvbiB0b09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZU5hdGl2ZSgpIHtcblx0dHJ5IHtcblx0XHRpZiAoIU9iamVjdC5hc3NpZ24pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgYnVnZ3kgcHJvcGVydHkgZW51bWVyYXRpb24gb3JkZXIgaW4gb2xkZXIgVjggdmVyc2lvbnMuXG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD00MTE4XG5cdFx0dmFyIHRlc3QxID0gbmV3IFN0cmluZygnYWJjJyk7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLW5ldy13cmFwcGVyc1xuXHRcdHRlc3QxWzVdID0gJ2RlJztcblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDEpWzBdID09PSAnNScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QyID0ge307XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHR0ZXN0MlsnXycgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGk7XG5cdFx0fVxuXHRcdHZhciBvcmRlcjIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MikubWFwKGZ1bmN0aW9uIChuKSB7XG5cdFx0XHRyZXR1cm4gdGVzdDJbbl07XG5cdFx0fSk7XG5cdFx0aWYgKG9yZGVyMi5qb2luKCcnKSAhPT0gJzAxMjM0NTY3ODknKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MyA9IHt9O1xuXHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGxldHRlcikge1xuXHRcdFx0dGVzdDNbbGV0dGVyXSA9IGxldHRlcjtcblx0XHR9KTtcblx0XHRpZiAoT2JqZWN0LmtleXMoT2JqZWN0LmFzc2lnbih7fSwgdGVzdDMpKS5qb2luKCcnKSAhPT1cblx0XHRcdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHQvLyBXZSBkb24ndCBleHBlY3QgYW55IG9mIHRoZSBhYm92ZSB0byB0aHJvdywgYnV0IGJldHRlciB0byBiZSBzYWZlLlxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZFVzZU5hdGl2ZSgpID8gT2JqZWN0LmFzc2lnbiA6IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHR2YXIgZnJvbTtcblx0dmFyIHRvID0gdG9PYmplY3QodGFyZ2V0KTtcblx0dmFyIHN5bWJvbHM7XG5cblx0Zm9yICh2YXIgcyA9IDE7IHMgPCBhcmd1bWVudHMubGVuZ3RoOyBzKyspIHtcblx0XHRmcm9tID0gT2JqZWN0KGFyZ3VtZW50c1tzXSk7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuXHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuXHRcdFx0XHR0b1trZXldID0gZnJvbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChnZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcblx0XHRcdHN5bWJvbHMgPSBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZnJvbSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHByb3BJc0VudW1lcmFibGUuY2FsbChmcm9tLCBzeW1ib2xzW2ldKSkge1xuXHRcdFx0XHRcdHRvW3N5bWJvbHNbaV1dID0gZnJvbVtzeW1ib2xzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwidmFyIG5leHRUaWNrID0gcmVxdWlyZSgncHJvY2Vzcy9icm93c2VyLmpzJykubmV4dFRpY2s7XG52YXIgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHk7XG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaW1tZWRpYXRlSWRzID0ge307XG52YXIgbmV4dEltbWVkaWF0ZUlkID0gMDtcblxuLy8gRE9NIEFQSXMsIGZvciBjb21wbGV0ZW5lc3NcblxuZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldFRpbWVvdXQsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcbn07XG5leHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFySW50ZXJ2YWwpO1xufTtcbmV4cG9ydHMuY2xlYXJUaW1lb3V0ID1cbmV4cG9ydHMuY2xlYXJJbnRlcnZhbCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHsgdGltZW91dC5jbG9zZSgpOyB9O1xuXG5mdW5jdGlvbiBUaW1lb3V0KGlkLCBjbGVhckZuKSB7XG4gIHRoaXMuX2lkID0gaWQ7XG4gIHRoaXMuX2NsZWFyRm4gPSBjbGVhckZuO1xufVxuVGltZW91dC5wcm90b3R5cGUudW5yZWYgPSBUaW1lb3V0LnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbigpIHt9O1xuVGltZW91dC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fY2xlYXJGbi5jYWxsKHdpbmRvdywgdGhpcy5faWQpO1xufTtcblxuLy8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5leHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcbn07XG5cbmV4cG9ydHMudW5lbnJvbGwgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcbn07XG5cbmV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuICB2YXIgbXNlY3MgPSBpdGVtLl9pZGxlVGltZW91dDtcbiAgaWYgKG1zZWNzID49IDApIHtcbiAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG4gICAgICBpZiAoaXRlbS5fb25UaW1lb3V0KVxuICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcbiAgICB9LCBtc2Vjcyk7XG4gIH1cbn07XG5cbi8vIFRoYXQncyBub3QgaG93IG5vZGUuanMgaW1wbGVtZW50cyBpdCBidXQgdGhlIGV4cG9zZWQgYXBpIGlzIHRoZSBzYW1lLlxuZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBzZXRJbW1lZGlhdGUgOiBmdW5jdGlvbihmbikge1xuICB2YXIgaWQgPSBuZXh0SW1tZWRpYXRlSWQrKztcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGZhbHNlIDogc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIGltbWVkaWF0ZUlkc1tpZF0gPSB0cnVlO1xuXG4gIG5leHRUaWNrKGZ1bmN0aW9uIG9uTmV4dFRpY2soKSB7XG4gICAgaWYgKGltbWVkaWF0ZUlkc1tpZF0pIHtcbiAgICAgIC8vIGZuLmNhbGwoKSBpcyBmYXN0ZXIgc28gd2Ugb3B0aW1pemUgZm9yIHRoZSBjb21tb24gdXNlLWNhc2VcbiAgICAgIC8vIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vY2FsbC1hcHBseS1zZWd1XG4gICAgICBpZiAoYXJncykge1xuICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZuLmNhbGwobnVsbCk7XG4gICAgICB9XG4gICAgICAvLyBQcmV2ZW50IGlkcyBmcm9tIGxlYWtpbmdcbiAgICAgIGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUoaWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGlkO1xufTtcblxuZXhwb3J0cy5jbGVhckltbWVkaWF0ZSA9IHR5cGVvZiBjbGVhckltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gY2xlYXJJbW1lZGlhdGUgOiBmdW5jdGlvbihpZCkge1xuICBkZWxldGUgaW1tZWRpYXRlSWRzW2lkXTtcbn07IiwiLypcbkBsaWNzdGFydCAgVGhlIGZvbGxvd2luZyBpcyB0aGUgZW50aXJlIGxpY2Vuc2Ugbm90aWNlIGZvciB0aGUgSmF2YVNjcmlwdCBjb2RlIGluIHRoaXMgcGFnZS5cblxuICAgIENvcHlyaWdodCAoYykgMjAxOSwgSmltIEFsbG1hblxuXG4gICAgQWxsIHJpZ2h0cyByZXNlcnZlZC5cblxuICAgIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICAgIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuXG4gICAgUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gICAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG5cbiAgICBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gICAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvblxuICAgIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuXG4gICAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCJcbiAgICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gICAgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFXG4gICAgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRVxuICAgIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMXG4gICAgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1JcbiAgICBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUlxuICAgIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksXG4gICAgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0VcbiAgICBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuXG5AbGljZW5kICBUaGUgYWJvdmUgaXMgdGhlIGVudGlyZSBsaWNlbnNlIG5vdGljZSBmb3IgdGhlIEphdmFTY3JpcHQgY29kZSBpbiB0aGlzIHBhZ2UuXG4qL1xuXG4vKlxuICogQ2xpZW50LXNpZGUgYmVoYXZpb3IgZm9yIHRoZSBPcGVuIFRyZWUgbmFtZS1yZXNvbHV0aW9uIFVJXG4gKlxuICogVGhpcyB1c2VzIHRoZSBPcGVuIFRyZWUgQVBJIHRvIHJlc29sdmUgbGFyZ2Ugc2V0cyBvZiBsYWJlbHMgdG8gdGF4b25vbWljIG5hbWVzLlxuICovXG52YXIgSlNaaXAgPSByZXF1aXJlKCdqc3ppcCcpLFxuICAgIEZpbGVTYXZlciA9IHJlcXVpcmUoJ2ZpbGUtc2F2ZXInKSxcbiAgICBCbG9iID0gcmVxdWlyZSgnYmxvYi1wb2x5ZmlsbCcpLFxuICAgIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xuXG4vKiBUaGVzZSB2YXJpYWJsZXMgc2hvdWxkIGFscmVhZHkgYmUgZGVmaW5lZCBpbiB0aGUgbWFpbiBIVE1MIHBhZ2UuIFdlIHNob3VsZFxuICogTk9UIGRlY2xhcmUgdGhlbSBoZXJlLCBvciB0aGlzIHdpbGwgaGlkZSB0aGVpciBcImdsb2JhbFwiIHZhbHVlcy5cbnZhciBpbml0aWFsU3RhdGU7XG52YXIgZG9UTlJTRm9yQXV0b2NvbXBsZXRlX3VybDtcbnZhciBkb1ROUlNGb3JNYXBwaW5nT1RVc191cmw7XG52YXIgZ2V0Q29udGV4dEZvck5hbWVzX3VybDtcbnZhciByZW5kZXJfbWFya2Rvd25fdXJsO1xuKi9cblxuLy8gc29tZXRpbWVzIHdlIHVzZSB0aGlzIHNjcmlwdCBpbiBvdGhlciBwYWdlczsgbGV0J3MgY2hlY2shXG52YXIgY29udGV4dDtcbmlmICh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZihcIi9jdXJhdG9yL3RucnMvXCIpID09PSAwKSB7XG4gICAgY29udGV4dCA9ICdCVUxLX1ROUlMnO1xufSBlbHNlIGlmICh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZihcIi9jdXJhdG9yL3N0dWR5L2VkaXQvXCIpID09PSAwKSB7XG4gICAgY29udGV4dCA9ICdTVFVEWV9PVFVfTUFQUElORyc7XG59IGVsc2Uge1xuICAgIGNvbnRleHQgPSAnPz8/Jztcbn1cblxuLyogUmV0dXJuIHRoZSBkYXRhIG1vZGVsIGZvciBhIG5ldyBuYW1lc2V0IChvdXIgSlNPTiByZXByZXNlbnRhdGlvbikgKi9cbnZhciBnZXROZXdOYW1lc2V0TW9kZWwgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gICAgdmFyIG9iaiA9IHtcbiAgICAgICAgJ21ldGFkYXRhJzoge1xuICAgICAgICAgICAgJ25hbWUnOiBcIlVudGl0bGVkIG5hbWVzZXRcIixcbiAgICAgICAgICAgICdkZXNjcmlwdGlvbic6IFwiXCIsXG4gICAgICAgICAgICAnYXV0aG9ycyc6IFsgXSwgICAvLyBhc3NpZ24gaW1tZWRpYXRlbHkgdG8gdGhpcyB1c2VyP1xuICAgICAgICAgICAgJ2RhdGVfY3JlYXRlZCc6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICdsYXN0X3NhdmVkJzogbnVsbCxcbiAgICAgICAgICAgICdzYXZlX2NvdW50JzogMCwgIC8vIHVzZSB0byBzdWdnZXN0IHVuaXF1ZSAobnVtYmVyZWQpIGZpbGVuYW1lc1xuICAgICAgICAgICAgJ3ByZXZpb3VzX2ZpbGVuYW1lJzogbnVsbCwgIC8vIHdoYXQgZmlsZSB3ZSBsb2FkZWQgYmVmb3JlIGRvaW5nIHRoaXMgd29ya1xuICAgICAgICAgICAgJ2xhdGVzdF9vdHRfdmVyc2lvbic6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgXCJtYXBwaW5nSGludHNcIjogeyAgICAgICAvLyBPUiBuYW1lTWFwcGluZ0hpbnRzP1xuICAgICAgICAgICAgXCJkZXNjcmlwdGlvblwiOiBcIkFpZHMgZm9yIG1hcHBpbmcgbGlzdGVkIG5hbWVzIHRvIE9UVCB0YXhhXCIsXG4gICAgICAgICAgICBcInNlYXJjaENvbnRleHRcIjogXCJBbGwgbGlmZVwiLFxuICAgICAgICAgICAgXCJ1c2VGdXp6eU1hdGNoaW5nXCI6IGZhbHNlLFxuICAgICAgICAgICAgXCJhdXRvQWNjZXB0RXhhY3RNYXRjaGVzXCI6IGZhbHNlLFxuICAgICAgICAgICAgXCJzdWJzdGl0dXRpb25zXCI6IFtcbiAgICAgICAgICAgICAgICAvKiB0eXBpY2FsIHZhbHVlcyBpbiB1c2VcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFwiYWN0aXZlXCI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBcIm9sZFwiOiBcIi4qIChbQS1aXVthLXpdKyBbYS16Ll0rIFtBLVogMC05XSspJFwiLFxuICAgICAgICAgICAgICAgICAgICBcIm5ld1wiOiBcIiQxXCIsXG4gICAgICAgICAgICAgICAgICAgIFwidmFsaWRcIjogdHJ1ZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAvKiBzdGFydCB3aXRoIG9uZSBlbXB0eS9uZXcgc3Vic3RpdHV0aW9uICovXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBcImFjdGl2ZVwiOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBcIm9sZFwiOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBcIm5ld1wiOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbGlkXCI6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICAnbmFtZXMnOiBbXG4gICAgICAgICAgICAvLyBlYWNoIHNob3VsZCBpbmNsdWRlIGEgdW5pcXVlIGlkLCBvcmlnaW5hbCBuYW1lLCBtYW51YWxseSBlZGl0ZWQvYWRqdXN0ZWQgbmFtZSwgYW5kIGFueSBtYXBwZWQgbmFtZS90YXhvblxuICAgICAgICAgICAgLyogaGVyZSdzIGEgdHlwaWNhbCBleGFtcGxlLCB3aXRoIGFuIGFyYml0cmFyeS9zZXJpYWwgSURcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwibmFtZTIzXCIsXG4gICAgICAgICAgICAgICAgXCJvcmlnaW5hbExhYmVsXCI6IFwiQmFjdGVyaWEgUHJvdGVvYmFjdGVyaWEgR2FtbWFwcm90ZW9iYWN0ZXJpYSBPY2Vhbm9zcGlyaWxsYWxlcyBTYWNjaGFyb3NwaXJpbGxhY2VhZSBTYWNjaGFyb3NwaXJpbGx1bSBpbXBhdGllbnMgRFNNIDEyNTQ2XCIsXG4gICAgICAgICAgICAgICAgXCJhZGp1c3RlZExhYmVsXCI6IFwiUHJvZW9iYWN0ZXJpYVwiLCAgLy8gV0FTICdeb3Q6YWx0TGFiZWwnXG4gICAgICAgICAgICAgICAgXCJvdHRUYXhvbk5hbWVcIjogXCJTYWNjaGFyb3NwaXJpbGx1bSBpbXBhdGllbnMgRFNNIDEyNTQ2XCIsXG4gICAgICAgICAgICAgICAgXCJvdHRJZFwiOiAxMzI3NTEsXG4gICAgICAgICAgICAgICAgXCJ0YXhvbm9taWNTb3VyY2VzXCI6IFtcInNpbHZhOkExNjM3OS8jMVwiLCBcIm5jYmk6MlwiLCBcIndvcm1zOjZcIiwgXCJnYmlmOjNcIiwgXCJpcm1uZzoxM1wiXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgKi9cbiAgICAgICAgXVxuICAgIH07XG4gICAgLyogVE9ETzogQXBwbHkgb3B0aW9uYWwgbW9kaWZpY2F0aW9ucz9cbiAgICBpZiAob3B0aW9ucy5CTEFIKSB7XG4gICAgICAgIG9iai5tZXRhZGF0YS5GT08gPSAnQkFSJztcbiAgICB9XG4gICAgKi9cbiAgICByZXR1cm4gb2JqO1xufTtcbmZ1bmN0aW9uIGNvbnZlcnRUb05hbWVzZXRNb2RlbCggbGlzdFRleHQgKSB7XG4gICAgLyogVGVzdCBmb3IgcHJvcGVyIGRlbGltaXRlZCB0ZXh0IChUU1Ygb3IgQ1NWLCB3aXRoIGEgcGFpciBvZiBuYW1lcyBvbiBlYWNoIGxpbmUpLlxuICAgICAqIFRoZSBmaXJzdCB2YWx1ZSBvbiBlYWNoIGxpbmUgaXMgYSB2ZXJuYWN1bGFyIGxhYmVsLCB0aGUgc2Vjb25kIGl0cyBtYXBwZWQgdGF4b24gbmFtZS5cbiAgICAgKi9cbiAgICB2YXIgbmFtZXNldCA9IGdldE5ld05hbWVzZXRNb2RlbCgpOyAgLy8gd2UnbGwgYWRkIG5hbWUgcGFpcnMgdG8gdGhpc1xuICAgIGNvbnNvbGUubG9nKCBsaXN0VGV4dCApO1xuICAgIC8vIHRlc3QgYSB2YXJpZXR5IG9mIGRlbGltaXRlcnMgdG8gdXNlIHdpdGggdGhpcyB0ZXh0XG4gICAgdmFyIGxpbmVEZWxpbWl0ZXJzID0gWydcXG4nLCdcXHInXTtcbiAgICB2YXIgbGluZURlbGltRm91bmQgPSBudWxsO1xuICAgICQuZWFjaChsaW5lRGVsaW1pdGVycywgZnVuY3Rpb24oaSwgZGVsaW0pIHtcbiAgICAgICAgaWYgKCFsaW5lRGVsaW1Gb3VuZCkge1xuICAgICAgICAgICAgaWYgKGxpc3RUZXh0LnNwbGl0KGRlbGltKS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgbGluZURlbGltRm91bmQgPSBkZWxpbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBpdGVtRGVsaW1pdGVycyA9IFsnLCcsJ1xcdCddO1xuICAgIHZhciBpdGVtRGVsaW1Gb3VuZCA9IG51bGw7XG4gICAgJC5lYWNoKGl0ZW1EZWxpbWl0ZXJzLCBmdW5jdGlvbihpLCBkZWxpbSkge1xuICAgICAgICBpZiAoIWl0ZW1EZWxpbUZvdW5kKSB7XG4gICAgICAgICAgICBpZiAobGlzdFRleHQuc3BsaXQoZGVsaW0pLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBpdGVtRGVsaW1Gb3VuZCA9IGRlbGltO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCghbGluZURlbGltRm91bmQpIHx8ICghaXRlbURlbGltRm91bmQpKSB7XG4gICAgICAgIHJldHVybiBuYW1lc2V0OyAgLy8gcHJvYmFibHkgc3RpbGwgZW1wdHlcbiAgICB9XG4gICAgLy8gbm93IGFwcGx5IGxhYmVscyBhbmQga2VlcCBjb3VudCBvZiBhbnkgZHVwbGljYXRlIGxhYmVsc1xuICAgIHZhciBmb3VuZExhYmVscyA9IFsgXTtcbiAgICB2YXIgZHVwZUxhYmVsc0ZvdW5kID0gMDtcbiAgICB2YXIgbGluZXMgPSBsaXN0VGV4dC5zcGxpdChsaW5lRGVsaW1Gb3VuZCk7XG4gICAgLy8gZmlsdGVyIG91dCBlbXB0eSBlbXB0eSBsaW5lcywgZXRjLlxuICAgIGxpbmVzID0gJC5ncmVwKGxpbmVzLCBmdW5jdGlvbihsaW5lLCBpKSB7XG4gICAgICAgIHJldHVybiAkLnRyaW0obGluZSkgIT09IFwiXCI7XG4gICAgfSk7XG4gICAgY29uc29sZS53YXJuKCBsaW5lcy5sZW5ndGggK1wiIGxpbmVzIGZvdW5kIHdpdGggbGluZSBkZWxpbWl0ZXIgJ1wiKyBsaW5lRGVsaW1Gb3VuZCArXCInXCIpO1xuICAgIHZhciBsb2NhbE5hbWVOdW1iZXIgPSAwOyAgLy8gdGhlc2UgYXJlIG5vdCBpbXBvcnRlZCwgc28gbG9jYWwgaW50ZWdlcnMgYXJlIGZpbmRcbiAgICAkLmVhY2gobGluZXMsIGZ1bmN0aW9uKGksIGxpbmUpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gbGluZS5zcGxpdChpdGVtRGVsaW1Gb3VuZCk7XG4gICAgICAgIC8vIGZpbHRlciBvdXQgZW1wdHkgZW1wdHkgbGFiZWxzIGFuZCB0YXhhXG4gICAgICAgIGl0ZW1zID0gJC5ncmVwKGl0ZW1zLCBmdW5jdGlvbihpdGVtLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4gJC50cmltKGl0ZW0pICE9PSBcIlwiO1xuICAgICAgICB9KTtcbiAgICAgICAgc3dpdGNoIChpdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgIC8vIHNraXAgdG8gbmV4dCBsaW5lXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIHdlIGFzc3VtZSB0aGUgc2FtZSBmaWVsZHMgYXMgaW4gb3V0IG5hbWVzZXQgb3V0cHV0IGZpbGVzXG4gICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gJC50cmltKGl0ZW1zWzBdKTsgICAvLyBpdHMgb3JpZ2luYWwsIHZlcm5hY3VsYXIgbGFiZWxcbiAgICAgICAgICAgICAgICBpZiAobGFiZWwgPT09ICdPUklHSU5BTCBMQUJFTCcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCB0aGUgaGVhZGVyIHJvdywgaWYgZm91bmRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHNraXAgdGhpcyBsYWJlbCBpZiBpdCdzIGEgZHVwbGljYXRlXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kTGFiZWxzLmluZGV4T2YobGFiZWwpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhZGQgdGhpcyB0byBsYWJlbHMgZm91bmQgKHRlc3QgbGF0ZXIgbmFtZXMgYWdhaW5zdCB0aGlzKVxuICAgICAgICAgICAgICAgICAgICBmb3VuZExhYmVscy5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGEgZHVwZSBvZiBhbiBlYXJsaWVyIG5hbWUhXG4gICAgICAgICAgICAgICAgICAgIGR1cGVMYWJlbHNGb3VuZCsrO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGNhbm9uaWNhbFRheG9uTmFtZSA9ICQudHJpbShpdGVtc1sxXSk7ICAvLyBpdHMgbWFwcGVkIHRheG9uIG5hbWVcbiAgICAgICAgICAgICAgICAvLyBpbmNsdWRlIG90dGlkIGFuZCBhbnkgdGF4b25vbWljIHNvdXJjZXMsIGlmIHByb3ZpZGVkXG4gICAgICAgICAgICAgICAgdmFyIHRheG9uSUQgPSAoaXRlbXMubGVuZ3RoID4gMikgPyBpdGVtc1syXSA6IG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZXMgPSAoaXRlbXMubGVuZ3RoID4gMykgPyBpdGVtc1szXS5zcGxpdCgnOycpIDogbnVsbDtcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhpcyBpbmZvcm1hdGlvbiBpbiB0aGUgZXhwZWN0ZWQgbmFtZXNldCBmb3JtXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIuLi5hZGRpbmcgbGFiZWwgJ1wiKyBsYWJlbCArXCInLi4uXCIpO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiAoXCJuYW1lXCIrIGxvY2FsTmFtZU51bWJlcisrKSxcbiAgICAgICAgICAgICAgICAgICAgXCJvcmlnaW5hbExhYmVsXCI6IGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICBcIm90dFRheG9uTmFtZVwiOiBjYW5vbmljYWxUYXhvbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIFwic2VsZWN0ZWRGb3JBY3Rpb25cIjogZmFsc2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmICh0YXhvbklEKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVJbmZvW1wib3R0SWRcIl0gPSB0YXhvbklEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlcykge1xuICAgICAgICAgICAgICAgICAgICBuYW1lSW5mb1tcInRheG9ub21pY1NvdXJjZXNcIl0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHNvdXJjZXMsIGZ1bmN0aW9uKGksIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlID0gJC50cmltKHNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlKSB7ICAvLyBpdCdzIG5vdCBhbiBlbXB0eSBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lSW5mb1tcInRheG9ub21pY1NvdXJjZXNcIl0ucHVzaCggc291cmNlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuYW1lc2V0Lm5hbWVzLnB1c2goIG5hbWVJbmZvICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH0pO1xuICAgIG51ZGdlVGlja2xlcignVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7XG4gICAgdmFyIG5hbWVzQWRkZWQgPSBuYW1lc2V0Lm5hbWVzLmxlbmd0aDtcbiAgICB2YXIgbXNnO1xuICAgIGlmIChkdXBlTGFiZWxzRm91bmQgPT09IDApIHtcbiAgICAgICAgbXNnID0gXCJBZGRpbmcgXCIrIG5hbWVzQWRkZWQgK1wiIG5hbWVzIGZvdW5kIGluIHRoaXMgZmlsZS4uLlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG1zZyA9IFwiQWRkaW5nIFwiKyBuYW1lc0FkZGVkICtcIiBuYW1lXCIrXG4gICAgICAgICAgICAobmFtZXNBZGRlZCA9PT0gMT8gXCJcIiA6IFwic1wiKSArXCIgZm91bmQgaW4gdGhpcyBmaWxlIChcIitcbiAgICAgICAgICAgIGR1cGVMYWJlbHNGb3VuZCArXCIgZHVwbGljYXRlIGxhYmVsXCIrIChkdXBlTGFiZWxzRm91bmQgPT09IDE/IFwiXCIgOiBcInNcIilcbiAgICAgICAgICAgICtcIiByZW1vdmVkKS4uLlwiO1xuICAgIH1cbiAgICAvLyB3aGVyZSBkbyB3ZSBzaG93IHRoZXNlIG1lc3NhZ2VzP1xuICAgIHNob3dJbmZvTWVzc2FnZShtc2cpO1xuICAgIHJldHVybiBuYW1lc2V0O1xufVxuXG4vKiBMb2FkIGFuZCBzYXZlICh0by9mcm9tIFpJUCBmaWxlIG9uIHRoZSB1c2VyJ3MgZmlsZXN5c3RlbSkgKi9cblxuLy8gcHJvcG9zZSBhbiBhcHByb3ByaWF0ZSBmaWxlbmFtZSBiYXNlZCBvbiBpdHMgaW50ZXJuYWwgbmFtZVxuZnVuY3Rpb24gZ2V0RGVmYXVsdEFyY2hpdmVGaWxlbmFtZSggY2FuZGlkYXRlRmlsZU5hbWUgKSB7XG4gICAgLy8gdHJ5IHRvIHVzZSBhIGNhbmRpZGF0ZSBuYW1lLCBpZiBwcm92aWRlZFxuICAgIHZhciBzdWdnZXN0ZWRGaWxlTmFtZSA9ICQudHJpbShjYW5kaWRhdGVGaWxlTmFtZSkgfHxcbiAgICAgICAgdmlld01vZGVsLm1ldGFkYXRhLm5hbWUoKSB8fFxuICAgICAgICBcIlVOVElUTEVEX05BTUVTRVRcIjtcbiAgICAvLyBzdHJpcCBleHRlbnNpb24gKGlmIGZvdW5kKSBhbmQgaW5jcmVtZW50IGFzIG5lZWRlZFxuICAgIGlmIChzdWdnZXN0ZWRGaWxlTmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKCcuemlwJykpIHtcbiAgICAgICAgc3VnZ2VzdGVkRmlsZU5hbWUgPSBzdWdnZXN0ZWRGaWxlTmFtZS5zdWJzdHIoMCwgc3VnZ2VzdGVkRmlsZU5hbWUubGVuZ3RoKCkgLSA0KTtcbiAgICB9XG4gICAgLy8gYWRkIGluY3JlbWVudGluZyBjb3VudGVyIGZyb20gdmlld01vZGVsLCBwbHVzIGZpbGUgZXh0ZW5zaW9uXG4gICAgaWYgKHZpZXdNb2RlbC5tZXRhZGF0YS5zYXZlX2NvdW50KCkgPiAwKSB7XG4gICAgICAgIHN1Z2dlc3RlZEZpbGVOYW1lICs9IFwiLVwiKyB2aWV3TW9kZWwubWV0YWRhdGEuc2F2ZV9jb3VudCgpO1xuICAgIH1cbiAgICBzdWdnZXN0ZWRGaWxlTmFtZSArPSAnLnppcCc7XG4gICAgcmV0dXJuIHN1Z2dlc3RlZEZpbGVOYW1lO1xufVxuXG5mdW5jdGlvbiBzYXZlQ3VycmVudE5hbWVzZXQoIG9wdGlvbnMgKSB7XG4gICAgLy8gc2F2ZSBhIFpJUCBhcmNoaXZlIChvciBqdXN0IGBtYWluLmpzb25gKSB0byB0aGUgZmlsZXN5c3RlbVxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHtGVUxMX0FSQ0hJVkU6IHRydWV9O1xuXG4gICAgLypcbiAgICAgKiBVcGRhdGUgbmV3LXNhdmUgaW5mbyAodGltZXN0YW1wIGFuZCBjb3VudGVyKSBpbiB0aGUgSlNPTiBkb2N1bWVudCBCRUZPUkVcbiAgICAgKiBzYXZpbmcgaXQ7IGlmIHRoZSBvcGVyYXRpb24gZmFpbHMsIHdlJ2xsIHJldmVydCB0aGVzZSBwcm9wZXJ0aWVzIGluIHRoZVxuICAgICAqIGFjdGl2ZSBkb2N1bWVudC5cbiAgICAgKi9cbiAgICB2YXIgcHJldmlvdXNTYXZlVGltZXN0YW1wID0gdmlld01vZGVsLm1ldGFkYXRhLmxhc3Rfc2F2ZWQoKTtcbiAgICB2YXIgcmlnaHROb3cgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgdmlld01vZGVsLm1ldGFkYXRhLmxhc3Rfc2F2ZWQoIHJpZ2h0Tm93ICk7XG4gICAgdmFyIHByZXZpb3VzU2F2ZUNvdW50ID0gdmlld01vZGVsLm1ldGFkYXRhLnNhdmVfY291bnQoKTtcbiAgICB2aWV3TW9kZWwubWV0YWRhdGEuc2F2ZV9jb3VudCggKytwcmV2aW91c1NhdmVDb3VudCApO1xuICAgIC8vIFRPRE86IFNldCAodGVudGF0aXZlL3VzZXItc3VnZ2VzdGVkKSBmaWxlbmFtZSBpbiB0aGUgbGl2ZSB2aWV3TW9kZWw/XG5cbiAgICAvLyBUT0RPOiBhZGQgdGhpcyB1c2VyIHRvIHRoZSBhdXRob3JzIGxpc3QsIGlmIG5vdCBmb3VuZD9cbiAgICAvLyAoZW1haWwgYW5kL29yIHVzZXJpZCwgc28gd2UgY2FuIGxpbmsgdG8gYXV0aG9ycylcbiAgICAvKlxuICAgIHZhciB1c2VyRGlzcGxheU5hbWUgPSAnPz8/JztcbiAgICB2YXIgbGlzdFBvcyA9ICQuaW5BcnJheSggdXNlckRpc3BsYXlOYW1lLCB2aWV3TW9kZWwubWV0YWRhdGEuYXV0aG9ycygpICk7XG4gICAgaWYgKGxpc3RQb3MgPT09IC0xKSB7XG4gICAgICAgIHZpZXdNb2RlbC5tZXRhZGF0YS5hdXRob3JzLnB1c2goIHVzZXJEaXNwbGF5TmFtZSApO1xuICAgIH1cbiAgICAqL1xuXG4gICAgLy8gVE9ETzogYWRkIGEgXCJzY3J1YmJlclwiIGFzIHdlIGRvIGZvciBPcGVuVHJlZSBzdHVkaWVzPyBcbiAgICAvLyBzY3J1Yk5hbWVzZXRGb3JUcmFuc3BvcnQoc3R5bGlzdC5pbGwpO1xuXG4gICAgLy8gZmxhdHRlbiB0aGUgY3VycmVudCBuYW1lc2V0IHRvIHNpbXBsZSBKUyB1c2luZyBvdXIgXG4gICAgLy8gS25vY2tvdXQgbWFwcGluZyBvcHRpb25zXG4gICAgdmFyIGNsb25hYmxlTmFtZXNldCA9IGtvLm1hcHBpbmcudG9KUyh2aWV3TW9kZWwpO1xuXG4gICAgLy8gVE9ETzogY2xlYXIgYW55IGV4aXN0aW5nIFVSTD8gb3Iga2VlcCBsYXN0LWtub3duIGdvb2Qgb25lP1xuICAgIC8vY2xvbmFibGVOYW1lc2V0Lm1ldGFkYXRhLnVybCA9ICcnO1xuXG4gICAgLy8gY3JlYXRlIGEgWmlwIGFyY2hpdmUsIGFkZCB0aGUgY29yZSBkb2N1bWVudFxuICAgIHZhciBhcmNoaXZlID0gbmV3IEpTWmlwKCk7XG4gICAgYXJjaGl2ZS5maWxlKFwibWFpbi5qc29uXCIsIEpTT04uc3RyaW5naWZ5KGNsb25hYmxlTmFtZXNldCkpO1xuXG4gICAgLy8gVE9ETzogVGVzdCBhbGwgaW5wdXQgZm9yIHJlcGVhdGFibGUgcHJvdmVuYW5jZSBpbmZvOyBpZiBhbnkgYXJlIGxhY2tpbmcgYVxuICAgIC8vIGNsZWFyIHNvdXJjZSwgd2Ugc2hvdWxkIGVtYmVkIHRoZSBzb3VyY2UgZGF0YSBoZXJlLlxuICAgIC8qXG4gICAgdmFyIHN0YXRpY0lucHV0cyA9IFRyZWVJbGx1c3RyYXRvci5nYXRoZXJTdGF0aWNJbnB1dERhdGEoKTtcbiAgICBpZiAob3B0aW9ucy5GVUxMX0FSQ0hJVkUgfHwgKHN0YXRpY0lucHV0cy5sZW5ndGggPiAwKSkge1xuICAgICAgICAvLyBhZGQgc29tZSBvciBhbGwgaW5wdXQgZGF0YSBmb3IgdGhpcyBpbGx1c3RyYXRpb25cbiAgICAgICAgLy92YXIgaW5wdXRGb2xkZXIgPSBhcmNoaXZlLmZvbGRlcignaW5wdXQnKTtcbiAgICAgICAgdmFyIGlucHV0c1RvU3RvcmUgPSBvcHRpb25zLkZVTExfQVJDSElWRSA/IFRyZWVJbGx1c3RyYXRvci5nYXRoZXJBbGxJbnB1dERhdGEoKSA6IHN0YXRpY0lucHV0cztcbiAgICAgICAgJC5lYWNoKGlucHV0c1RvU3RvcmUsIGZ1bmN0aW9uKGksIGlucHV0RGF0YSkge1xuICAgICAgICAgICAgdmFyIGl0c1BhdGggPSBpbnB1dERhdGEucGF0aDtcbiAgICAgICAgICAgIHZhciBzZXJpYWxpemVkID0gdXRpbHMuc2VyaWFsaXplRGF0YUZvclNhdmVkRmlsZSggaW5wdXREYXRhLnZhbHVlICk7XG4gICAgICAgICAgICBhcmNoaXZlLmZpbGUoaXRzUGF0aCwgc2VyaWFsaXplZC52YWx1ZSwgc2VyaWFsaXplZC5vcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgICovXG5cbiAgICAvLyBhZGQgYW55IG91dHB1dCBkb2NzIChTVkcsIFBERilcbiAgICB2YXIgb3V0cHV0Rm9sZGVyID0gYXJjaGl2ZS5mb2xkZXIoJ291dHB1dCcpO1xuICAgIC8qIFNlZSBodHRwczovL3N0dWsuZ2l0aHViLmlvL2pzemlwL2RvY3VtZW50YXRpb24vYXBpX2pzemlwL2ZpbGVfZGF0YS5odG1sXG4gICAgICogZm9yIG90aGVyIFpJUCBvcHRpb25zIGxpa2UgY29wbXJlc3Npb24gc2V0dGluZ3MuXG4gICAgICovXG4gICAgb3V0cHV0Rm9sZGVyLmZpbGUoJ21haW4udHN2JywgZ2VuZXJhdGVUYWJTZXBhcmF0ZWRPdXRwdXQoJ0FMTF9OQU1FUycpLCB7Y29tbWVudDogXCJUYWItZGVsaW1pdGVkIHRleHQsIGluY2x1ZGluZyB1bm1hcHBlZCBuYW1lcy5cIn0pO1xuICAgIG91dHB1dEZvbGRlci5maWxlKCdtYWluLmNzdicsIGdlbmVyYXRlQ29tbWFTZXBhcmF0ZWRPdXRwdXQoJ0FMTF9OQU1FUycpLCB7Y29tbWVudDogXCJDb21tYS1kZWxpbWl0ZWQgdGV4dCwgaW5jbHVkaW5nIHVubWFwcGVkIG5hbWVzLlwifSk7XG5cbiAgICAvKiBOT1RFIHRoYXQgd2UgaGF2ZSBubyBjb250cm9sIG92ZXIgd2hlcmUgdGhlIGJyb3dzZXIgd2lsbCBzYXZlIGFcbiAgICAgKiBkb3dubG9hZGVkIGZpbGUsIGFuZCB3ZSBoYXZlIG5vIGRpcmVjdCBrbm93bGVkZ2Ugb2YgdGhlIGZpbGVzeXN0ZW0hXG4gICAgICogRnVydGhlcm1vcmUsIG1vc3QgYnJvd3NlcnMgd29uJ3Qgb3ZlcndyaXRlIGFuIGV4aXN0aW5nIGZpbGUgd2l0aCB0aGlzXG4gICAgICogcGF0aCtuYW1lLCBhbmQgd2lsbCBpbnN0ZWFkIGluY3JlbWVudCB0aGUgbmV3IGZpbGUsIGUuZy5cbiAgICAgKiAnYmVlLXRyZWVzLWNvbXBhcmVkLnppcCcgYmVjb21lcyAnfi9Eb3dubG9hZHMvYmVlLXRyZWVzLWNvbXBhcmVkICgyKS56aXAnLlxuICAgICAqL1xuICAgIHZhciAkZmlsZW5hbWVGaWVsZCA9ICQoJ2lucHV0I3N1Z2dlc3RlZC1hcmNoaXZlLWZpbGVuYW1lJyk7XG4gICAgdmFyIHN1Z2dlc3RlZEZpbGVOYW1lID0gJC50cmltKCRmaWxlbmFtZUZpZWxkLnZhbCgpKTtcbiAgICBpZiAoc3VnZ2VzdGVkRmlsZU5hbWUgPT09IFwiXCIpIHtcbiAgICAgICAgc3VnZ2VzdGVkRmlsZU5hbWUgPSBnZXREZWZhdWx0QXJjaGl2ZUZpbGVuYW1lKHN1Z2dlc3RlZEZpbGVOYW1lKTtcbiAgICB9XG4gICAgLy8gYWRkIG1pc3NpbmcgZXh0ZW5zaW9uLCBpZiBpdCdzIG1pc3NpbmdcbiAgICBpZiAoIShzdWdnZXN0ZWRGaWxlTmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKCcuemlwJykpKSB7XG4gICAgICAgIHN1Z2dlc3RlZEZpbGVOYW1lICs9ICcuemlwJztcbiAgICB9XG5cbiAgICBhcmNoaXZlLmdlbmVyYXRlQXN5bmMoIHt0eXBlOlwiYmxvYlwifSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiB1cGRhdGVDYWxsYmFjayhtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFNob3cgcHJvZ3Jlc3MgYXMgZGVtb25zdHJhdGVkIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9zdHVrLmdpdGh1Yi5pby9qc3ppcC9kb2N1bWVudGF0aW9uL2V4YW1wbGVzL2Rvd25sb2FkZXIuaHRtbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBtZXRhZGF0YS5wZXJjZW50LnRvRml4ZWQoMikgKyBcIiAlIGNvbXBsZXRlXCIgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gKVxuICAgICAgICAgICAudGhlbiggZnVuY3Rpb24gKGJsb2IpIHsgICBcbiAgICAgICAgICAgICAgICAgICAgICAvLyBzdWNjZXNzIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgRmlsZVNhdmVyLnNhdmVBcyhibG9iLCBzdWdnZXN0ZWRGaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycikgeyAgICBcbiAgICAgICAgICAgICAgICAgICAgICAvLyBmYWlsdXJlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgYXN5bmNBbGVydCgnRVJST1IgZ2VuZXJhdGluZyB0aGlzIFpJUCBhcmNoaXZlOjxici8+PGJyLz4nKyBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgIC8vIHJldmVydCB0byBwcmV2aW91cyBsYXN0LXNhdmUgaW5mbyBpbiB0aGUgYWN0aXZlIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgICAgICAgdmlld01vZGVsLm1ldGFkYXRhLmxhc3Rfc2F2ZWQoIHByZXZpb3VzU2F2ZVRpbWVzdGFtcCApO1xuICAgICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlbC5tZXRhZGF0YS5zYXZlX2NvdW50KCBwcmV2aW91c1NhdmVDb3VudCApO1xuICAgICAgICAgICAgICAgICAgfSApO1xuXG4gICAgJCgnI25hbWVzZXQtbG9jYWwtZmlsZXN5c3RlbS13YXJuaW5nJykuc2xpZGVEb3duKCk7IC8vIFRPRE9cblxuICAgIHNob3dJbmZvTWVzc2FnZSgnTmFtZXNldCBzYXZlZCB0byBsb2NhbCBmaWxlLicpO1xuXG4gICAgcG9wUGFnZUV4aXRXYXJuaW5nKCdVTlNBVkVEX05BTUVTRVRfQ0hBTkdFUycpO1xuICAgIG5hbWVzZXRIYXNVbnNhdmVkQ2hhbmdlcyA9IGZhbHNlO1xuICAgIGRpc2FibGVTYXZlQnV0dG9uKCk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlVGFiU2VwYXJhdGVkT3V0cHV0KCkge1xuICAgIHJldHVybiBnZW5lcmF0ZURlbGltaXRlZFRleHRPdXRwdXQoJ0FMTF9OQU1FUycsICdcXHQnLCAnOycpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVDb21tYVNlcGFyYXRlZE91dHB1dCgpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVEZWxpbWl0ZWRUZXh0T3V0cHV0KCdBTExfTkFNRVMnLCAnLCcsICc7Jyk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZURlbGltaXRlZFRleHRPdXRwdXQobWFwcGVkT3JBbGxOYW1lcywgZGVsaW1pdGVyLCBtaW5vckRlbGltaXRlcikge1xuICAgIC8vIHJlbmRlciB0aGUgY3VycmVudCBuYW1lc2V0IChtYXBwZWQgbmFtZXMsIG9yIGFsbCkgYXMgYSBkZWxpbWl0ZWQgKFRTViwgQ1NWKSBzdHJpbmdcbiAgICB2YXIgb3V0cHV0O1xuICAgIGlmICgkLmluQXJyYXkobWFwcGVkT3JBbGxOYW1lcywgWydNQVBQRURfTkFNRVMnLCAnQUxMX05BTUVTJ10pID09PSAtMSkge1xuICAgICAgICB2YXIgbXNnID0gXCIjIEVSUk9SOiBtYXBwZWRPckFsbE5hbWVzIHNob3VsZCBiZSAnTUFQUEVEX05BTUVTJyBvciAnQUxMX05BTUVTJywgbm90ICdcIisgbWFwcGVkT3JBbGxOYW1lcyArXCInIVwiXG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgICAgcmV0dXJuIG1zZztcbiAgICB9XG4gICAgaWYgKHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBvdXRwdXQgPSBcIiMgTm8gbmFtZXMgaW4gdGhpcyBuYW1lc2V0IHdlcmUgbWFwcGVkIHRvIHRoZSBPVCBUYXhvbm9teS5cIjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBvdXRwdXQgPSBcIk9SSUdJTkFMIExBQkVMXCIrIGRlbGltaXRlciArXCJPVFQgVEFYT04gTkFNRVwiKyBkZWxpbWl0ZXIgK1wiT1RUIFRBWE9OIElEXCIrIGRlbGltaXRlciArXCJUQVhPTk9NSUMgU09VUkNFU1xcblwiO1xuICAgICAgICAkLmVhY2godmlld01vZGVsLm5hbWVzKCksIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgICAgICAgIGlmICgobWFwcGVkT3JBbGxOYW1lcyA9PT0gJ01BUFBFRF9OQU1FUycpICYmICFuYW1lLm90dFRheG9uTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAgLy8gc2tpcCB0aGlzIHVuLW1hcHBlZCBuYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOLkIuIHVubWFwcGVkIG5hbWVzIHdvbid0IGhhdmUgbW9zdCBvZiB0aGVzZSBwcm9wZXJ0aWVzIVxuICAgICAgICAgICAgdmFyIGNvbWJpbmVkU291cmNlcyA9IChuYW1lLnRheG9ub21pY1NvdXJjZXMgfHwgWyBdKS5qb2luKG1pbm9yRGVsaW1pdGVyKTtcbiAgICAgICAgICAgIG91dHB1dCArPSAobmFtZS5vcmlnaW5hbExhYmVsICtkZWxpbWl0ZXIrXG4gICAgICAgICAgICAgICAgICAgICAgIChuYW1lLm90dFRheG9uTmFtZSB8fCAnJykgK2RlbGltaXRlcitcbiAgICAgICAgICAgICAgICAgICAgICAgKG5hbWUub3R0SWQgfHwgJycpICtkZWxpbWl0ZXIrXG4gICAgICAgICAgICAgICAgICAgICAgIGNvbWJpbmVkU291cmNlcyArXCJcXG5cIik7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xufVxuXG5mdW5jdGlvbiBsb2FkTGlzdEZyb21DaG9zZW5GaWxlKCB2bSwgZXZ0ICkge1xuICAgIC8vIEZpcnN0IHBhcmFtIChjb3JyZXNwb25kaW5nIHZpZXctbW9kZWwgZGF0YSkgaXMgcHJvYmFibHkgZW1wdHk7IGZvY3VzIG9uIHRoZSBldmVudCFcbiAgICB2YXIgJGhpbnRBcmVhID0gJCgnI2xpc3QtbG9jYWwtZmlsZXN5c3RlbS13YXJuaW5nJykuZXEoMCk7XG4gICAgJGhpbnRBcmVhLmh0bWwoXCJcIik7ICAvLyBjbGVhciBmb3IgbmV3IHJlc3VsdHNcbiAgICB2YXIgZXZlbnRUYXJnZXQgPSBldnQudGFyZ2V0IHx8IGV2dC5zcmNFbGVtZW50O1xuICAgIHN3aXRjaChldmVudFRhcmdldC5maWxlcy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAoMCk6XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIGZpbGUocykgc2VsZWN0ZWQhJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNhc2UgKDEpOlxuICAgICAgICBkZWZhdWx0OiAgLy8gaWdub3JlIG11bHRpcGxlIGZpbGVzIGZvciBub3csIGp1c3QgbG9hZCB0aGUgZmlyc3RcbiAgICAgICAgICAgIHZhciBmaWxlSW5mbyA9IGV2ZW50VGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmlsZUluZm8ubmFtZSA9IFwiKyBmaWxlSW5mby5uYW1lKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImZpbGVJbmZvLnR5cGUgPSBcIisgZmlsZUluZm8udHlwZSk7XG4gICAgICAgICAgICB2YXIgaXNWYWxpZExpc3QgPSBmYWxzZTtcbiAgICAgICAgICAgIHN3aXRjaCAoZmlsZUluZm8udHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQvcGxhaW4nOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQvdGFiLXNlcGFyYXRlZC12YWx1ZXMnOlxuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkTGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJyc6XG4gICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZpbGUgZXh0ZW5zaW9uXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlSW5mby5uYW1lLm1hdGNoKCcuKHR4dHx0c3YpJCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkTGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWlzVmFsaWRMaXN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiQSBsaXN0IG9mIG5hbWVzIHNob3VsZCBlbmQgaW4gPGNvZGU+LnR4dDwvY29kZT4gb3IgPGNvZGU+LnRzdjwvY29kZT4uIENob29zZSBhbm90aGVyIGZpbGU/XCI7XG4gICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU3RpbGwgaGVyZT8gdHJ5IHRvIGxvYWQgYW5kIHBhcnNlIHRoZSBsaXN0IChsaW5lLSBvciB0YWItZGVsaW1pdGVkIG5hbWVzKVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlYWRpbmcgbGlzdCBjb250ZW50cy4uLicpO1xuICAgICAgICAgICAgdmFyIG1zZyA9IFwiUmVhZGluZyBsaXN0IG9mIG5hbWVzLi4uXCI7XG4gICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcblxuICAgICAgICAgICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgIGZyLm9ubG9hZCA9IGZ1bmN0aW9uKCBldnQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3RUZXh0ID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGxpc3RUZXh0ICk7XG4gICAgICAgICAgICAgICAgLy8gdGVzdCBhIHZhcmlldHkgb2YgZGVsaW1pdGVycyB0byBmaW5kIG11bHRpcGxlIGl0ZW1zXG4gICAgICAgICAgICAgICAgdmFyIG5hbWVzID0gWyBdO1xuICAgICAgICAgICAgICAgIHZhciBtdWx0aXBsZU5hbWVzRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgZHVwZXNGb3VuZCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGRlbGltaXRlcnMgPSBbJ1xcbicsJ1xccicsJ1xcdCddO1xuICAgICAgICAgICAgICAgICQuZWFjaChkZWxpbWl0ZXJzLCBmdW5jdGlvbihpLCBkZWxpbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW11bHRpcGxlTmFtZXNGb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXMgPSBsaXN0VGV4dC5zcGxpdChkZWxpbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaWx0ZXIgb3V0IGVtcHR5IG5hbWVzLCBlbXB0eSBsaW5lcywgZXRjLlxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXMgPSAkLmdyZXAobmFtZXMsIGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJC50cmltKG5hbWUpICE9PSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKG5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiTm8gbmFtZXMgZm91bmQgd2l0aCBkZWxpbWl0ZXIgJ1wiKyBkZWxpbSArXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkp1c3Qgb25lIG5hbWUgZm91bmQgd2l0aCBkZWxpbWl0ZXIgJ1wiKyBkZWxpbSArXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZU5hbWVzRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oIG5hbWVzLmxlbmd0aCArXCIgbmFtZXMgZm91bmQgd2l0aCBkZWxpbWl0ZXIgJ1wiKyBkZWxpbSArXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiB1bnBhY2sgbmFtZXMsIGlnbm9yZSByZW1haW5pbmcgZGVsaW1pdGVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gobmFtZXMsIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZCBhIG5ldyBuYW1lIGVudHJ5IHRvIHRoZSBuYW1lc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIi4uLmFkZGluZyBuYW1lICdcIisgbmFtZSArXCInLi4uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGVsLm5hbWVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogKFwibmFtZVwiKyBnZXROZXh0TmFtZU9yZGluYWxOdW1iZXIoKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvcmlnaW5hbExhYmVsXCI6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWxlY3RlZEZvckFjdGlvblwiOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogYWRkIHRoZXNlIG9ubHkgd2hlbiB0aGV5J3JlIHBvcHVsYXRlZCFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFkanVzdGVkTGFiZWxcIjogXCJcIiAgIC8vIFdBUyAnXm90OmFsdExhYmVsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib3R0VGF4b25OYW1lXCI6IFwiSG9tbyBzYXBpZW5zIHNhcGllbnNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm90dElkXCI6IDEzMjc1MVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidGF4b25vbWljU291cmNlc1wiOiBbIC4uLiBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN3ZWVwIGZvciBkdXBsaWNhdGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aXRoRHVwZXMgPSB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUR1cGxpY2F0ZU5hbWVzKHZpZXdNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aXRob3V0RHVwZXMgPSB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cGVzRm91bmQgPSB3aXRoRHVwZXMgLSB3aXRob3V0RHVwZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51ZGdlVGlja2xlcignVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIHN0aWxsIGhlcmU/IHRoZXJlIHdhcyBhIHByb2JsZW0sIHJlcG9ydCBpdCBhbmQgYmFpbFxuICAgICAgICAgICAgICAgIHZhciBtc2c7XG4gICAgICAgICAgICAgICAgaWYgKG11bHRpcGxlTmFtZXNGb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZHVwZXNGb3VuZCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnID0gXCJBZGRpbmcgXCIrIG5hbWVzLmxlbmd0aCArXCIgbmFtZXMgZm91bmQgaW4gdGhpcyBmaWxlLi4uXCI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZXNBZGRlZCA9IG5hbWVzLmxlbmd0aCAtIGR1cGVzRm91bmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cgPSBcIkFkZGluZyBcIisgbmFtZXNBZGRlZCArXCIgbmFtZVwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuYW1lc0FkZGVkID09PSAxPyBcIlwiIDogXCJzXCIpICtcIiBmb3VuZCBpbiB0aGlzIGZpbGUgKFwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cGVzRm91bmQgK1wiIGR1cGxpY2F0ZSBuYW1lXCIrIChkdXBlc0ZvdW5kID09PSAxPyBcIlwiIDogXCJzXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgK1wiIHJlbW92ZWQpLi4uXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtc2cgPSBcIk5vIG5hbWVzIChvciBqdXN0IG9uZSkgZm91bmQgaW4gdGhpcyBmaWxlISBUcnkgYWdhaW4/XCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRoaW50QXJlYS5odG1sKG1zZykuc2hvdygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvL2ZyLnJlYWRBc0RhdGFVUkwoZmlsZUluZm8pO1xuICAgICAgICAgICAgZnIucmVhZEFzVGV4dChmaWxlSW5mbyk7ICAvLyBkZWZhdWx0IGVuY29kaW5nIGlzIHV0Zi04XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkTmFtZXNldEZyb21DaG9zZW5GaWxlKCB2bSwgZXZ0ICkge1xuICAgIC8vIEZpcnN0IHBhcmFtIChjb3JyZXNwb25kaW5nIHZpZXctbW9kZWwgZGF0YSkgaXMgcHJvYmFibHkgZW1wdHk7IGZvY3VzIG9uIHRoZSBldmVudCFcbiAgICB2YXIgJGhpbnRBcmVhID0gJCgnI25hbWVzZXQtbG9jYWwtZmlsZXN5c3RlbS13YXJuaW5nJykuZXEoMCk7XG4gICAgJGhpbnRBcmVhLmh0bWwoXCJcIik7ICAvLyBjbGVhciBmb3IgbmV3IHJlc3VsdHNcbiAgICB2YXIgZXZlbnRUYXJnZXQgPSBldnQudGFyZ2V0IHx8IGV2dC5zcmNFbGVtZW50O1xuICAgIHN3aXRjaChldmVudFRhcmdldC5maWxlcy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAoMCk6XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJObyBmaWxlKHMpIHNlbGVjdGVkIVwiO1xuICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNhc2UgKDEpOlxuICAgICAgICBkZWZhdWx0OiAgLy8gaWdub3JlIG11bHRpcGxlIGZpbGVzIGZvciBub3csIGp1c3QgbG9hZCB0aGUgZmlyc3RcbiAgICAgICAgICAgIHZhciBmaWxlSW5mbyA9IGV2ZW50VGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmlsZUluZm8ubmFtZSA9IFwiKyBmaWxlSW5mby5uYW1lKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImZpbGVJbmZvLnR5cGUgPSBcIisgZmlsZUluZm8udHlwZSk7XG4gICAgICAgICAgICB2YXIgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgaXNWYWxpZEFyY2hpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChjb250ZXh0ID09PSAnQlVMS19UTlJTJykge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZmlsZUluZm8udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdhcHBsaWNhdGlvbi96aXAnOlxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWRBcmNoaXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICcnOlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgZmlsZSBleHRlbnNpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWxlSW5mby5uYW1lLm1hdGNoKCcuKHppcHxuYW1lc2V0KSQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXNOYW1lc2V0RmlsZUZvcm1hdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZEFyY2hpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghaXNWYWxpZEFyY2hpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiQXJjaGl2ZWQgbmFtZXNldCBmaWxlIHNob3VsZCBlbmQgaW4gPGNvZGU+LnppcDwvY29kZT4gb3IgPGNvZGU+Lm5hbWVzZXQ8L2NvZGU+LiBDaG9vc2UgYW5vdGhlciBmaWxlP1wiO1xuICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7ICAvLyBwcmVzdW1hYmx5ICdTVFVEWV9PVFVfTUFQUElORydcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZpbGVJbmZvLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYXBwbGljYXRpb24vemlwJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXNOYW1lc2V0RmlsZUZvcm1hdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkQXJjaGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndGV4dC9wbGFpbic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQvdGFiLXNlcGFyYXRlZC12YWx1ZXMnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICd0ZXh0L2Nzdic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2FwcGxpY2F0aW9uL2pzb24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgZmlsZSBleHRlbnNpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWxlSW5mby5uYW1lLm1hdGNoKCcuKHppcHxuYW1lc2V0fHR4dHx0c3Z8Y3N2fGpzb24pJCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkQXJjaGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF1c2VzTmFtZXNldEZpbGVGb3JtYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiTmFtZXNldCBmaWxlIHNob3VsZCBlbmQgaW4gb25lIG9mIDxjb2RlPi56aXAgLm5hbWVzZXQgLnR4dCAudHN2IC5jc3YgLmpzb248L2NvZGU+LiBDaG9vc2UgYW5vdGhlciBmaWxlP1wiO1xuICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFN0aWxsIGhlcmU/IHRyeSB0byBleHRyYWN0IGEgbmFtZXNldCBmcm9tIHRoZSBjaG9zZW4gZmlsZVxuICAgICAgICAgICAgaWYgKGlzVmFsaWRBcmNoaXZlKSB7XG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIHJlYWQgYW5kIHVuemlwIHRoaXMgYXJjaGl2ZSFcbiAgICAgICAgICAgICAgICBKU1ppcC5sb2FkQXN5bmMoZmlsZUluZm8pICAgLy8gcmVhZCB0aGUgQmxvYlxuICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oemlwKSB7ICAvLyBzdWNjZXNzIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlYWRpbmcgWklQIGNvbnRlbnRzLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiUmVhZGluZyBuYW1lc2V0IGNvbnRlbnRzLi4uXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gSG93IHdpbGwgd2Uga25vdyB3aGVuIGl0J3MgYWxsIChhc3luYykgbG9hZGVkPyBDb3VudCBkb3duIGFzIGVhY2ggZW50cnkgaXMgcmVhZCFcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgemlwRW50cmllc1RvTG9hZCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1haW5Kc29uUGF5bG9hZEZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluaXRpYWxDYWNoZSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHAgaW4gemlwLmZpbGVzKSB7IHppcEVudHJpZXNUb0xvYWQrKzsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXNoIG1vc3QgZm91bmQgZGF0YSBpbiB0aGUgY2FjaGUsIGJ1dCBtYWluIEpTT04gc2hvdWxkIGJlIHBhcnNlZFxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lc2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICB6aXAuZm9yRWFjaChmdW5jdGlvbiAocmVsYXRpdmVQYXRoLCB6aXBFbnRyeSkgeyAgLy8gMikgcHJpbnQgZW50cmllc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnICAnKyB6aXBFbnRyeS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coemlwRW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIGRpcmVjdG9yaWVzIChub3RoaW5nIHRvIGRvIGhlcmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh6aXBFbnRyeS5kaXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlNLSVBQSU5HIGRpcmVjdG9yeSBcIisgemlwRW50cnkubmFtZSArXCIuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6aXBFbnRyaWVzVG9Mb2FkLS07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVhZCBhbmQgc3RvcmUgZmlsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgemlwRW50cnkuYXN5bmMoJ3RleHQnLCBmdW5jdGlvbihtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlcG9ydCBwcm9ncmVzcz9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJSZWFkaW5nIG5hbWVzZXQgY29udGVudHMgKFwiKyB6aXBFbnRyeS5uYW1lICtcIik6IFwiKyBtZXRhZGF0YS5wZXJjZW50LnRvRml4ZWQoMikgK1wiICVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIHN1Y2Nlc3MoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlN1Y2Nlc3MgdW56aXBwaW5nIFwiKyB6aXBFbnRyeS5uYW1lICtcIjpcXG5cIisgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHppcEVudHJpZXNUb0xvYWQtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyc2UgYW5kIHN0YXNoIHRoZSBtYWluIEpTT04gZGF0YTsgY2FjaGUgdGhlIHJlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTkIgdGhhdCB0aGlzIG5hbWUgY291bGQgaW5jbHVkZSBhIHByZWNlZGluZyBwYXRoIVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHppcEVudHJ5Lm5hbWUgPT09ICdtYWluLmpzb24nKSB8fCAoemlwRW50cnkubmFtZS5lbmRzV2l0aCgnL21haW4uanNvbicpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBpcyB0aGUgZXhwZWN0ZWQgcGF5bG9hZCBmb3IgYSBaSVBlZCBuYW1lc2V0OyB0cnkgdG8gcGFyc2UgaXQhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWluSnNvblBheWxvYWRGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8ganVzdCBzd2FsbG93IHRoaXMgYW5kIHJlcG9ydCBiZWxvd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBcIjxjb2RlPm1haW4uanNvbjwvY29kZT4gaXMgbWFsZm9ybWVkIChcIisgZSArXCIpIVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRoaW50QXJlYS5odG1sKG1zZykuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXQncyBzb21lIG90aGVyIGZpbGU7IGNvcHkgaXQgdG8gb3VyIGluaXRpYWwgY2FjaGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxDYWNoZVsgemlwRW50cnkubmFtZSBdID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoemlwRW50cmllc1RvTG9hZCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UndmUgcmVhZCBpbiBhbGwgdGhlIFpJUCBkYXRhISBvcGVuIHRoaXMgbmFtZXNldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gKFRPRE86IHNldHRpbmcgaXRzIGluaXRpYWwgY2FjaGUpIGFuZCBjbG9zZSB0aGlzIHBvcHVwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW1haW5Kc29uUGF5bG9hZEZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiPGNvZGU+bWFpbi5qc29uPC9jb2RlPiBub3QgZm91bmQgaW4gdGhpcyBaSVAhXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYXB0dXJlIHNvbWUgZmlsZSBtZXRhZGF0YSwgaW4gY2FzZSBpdCdzIG5lZWRlZCBpbiB0aGUgbmFtZXNldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvYWRlZEZpbGVOYW1lID0gZmlsZUluZm8ubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0TW9kaWZpZWREYXRlID0gZmlsZUluZm8ubGFzdE1vZGlmaWVkRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTE9BRElORyBGUk9NIEZJTEUgJ1wiKyBsb2FkZWRGaWxlTmFtZSArXCInLCBMQVNUIE1PRElGSUVEOiBcIisgbGFzdE1vZGlmaWVkRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGV4dCA9PT0gJ0JVTEtfVE5SUycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZXBsYWNlIHRoZSBtYWluIHZpZXctbW9kZWwgb24gdGhpcyBwYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZE5hbWVzZXREYXRhKCBuYW1lc2V0LCBsb2FkZWRGaWxlTmFtZSwgbGFzdE1vZGlmaWVkRGF0ZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE4uQi4gdGhlIEZpbGUgQVBJICphbHdheXMqIGRvd25sb2FkcyB0byBhbiB1bnVzZWQgcGF0aCtmaWxlbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJyNzdG9yYWdlLW9wdGlvbnMtcG9wdXAnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgIC8vIHByZXN1bWFibHkgJ1NUVURZX09UVV9NQVBQSU5HJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4YW1pbmUgYW5kIGFwcGx5IHRoZXNlIG1hcHBpbmdzIHRvIHRoZSBPVFVzIGluIHRoZSBjdXJyZW50IHN0dWR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VOYW1lc2V0RGF0YSggbmFtZXNldCwgbG9hZGVkRmlsZU5hbWUsIGxhc3RNb2RpZmllZERhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTkIgaWYgaXQgZmFpbGVkIHRvIHBhcnNlLCB3ZSdyZSBzaG93aW5nIGEgZGVhdGlsZWQgZXJyb3IgbWVzc2FnZSBhYm92ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBlcnJvcihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBcIlByb2JsZW0gdW56aXBwaW5nIFwiKyB6aXBFbnRyeS5uYW1lICtcIjpcXG5cIisgZS5tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZSkgeyAgICAgICAgIC8vIGZhaWx1cmUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJFcnJvciByZWFkaW5nIDxzdHJvbmc+XCIgKyBmaWxlSW5mby5uYW1lICsgXCI8L3N0cm9uZz4hIElzIHRoaXMgYSBwcm9wZXIgemlwIGZpbGU/XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIGV4dHJhY3QgbmFtZXNldCBmcm9tIGEgc2ltcGxlIChub24tWklQKSBmaWxlXG4gICAgICAgICAgICAgICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICBmci5vbmxvYWQgPSBmdW5jdGlvbiggZXZ0ICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGV2dC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZXNldCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBkYXRhICk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0ID09PSAnQlVMS19UTlJTJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuZXhwZWN0ZWQgY29udGV4dCAnQlVMS19UTlJTJyBmb3IgZmxhdC1maWxlIG5hbWVzZXQhXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAgLy8gcHJlc3VtYWJseSAnU1RVRFlfT1RVX01BUFBJTkcnXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBUcnkgY29udmVyc2lvbiB0byBzdGFuZGFyZCBuYW1lc2V0IEpTIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lc2V0ID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElGIHRoaXMgZmFpbHMsIHRyeSB0byBpbXBvcnQgVFNWL0NTViwgbGluZS1ieS1saW5lIHRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lc2V0ID0gY29udmVydFRvTmFtZXNldE1vZGVsKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBleGFtaW5lIGFuZCBhcHBseSB0aGVzZSBtYXBwaW5ncyB0byB0aGUgT1RVcyBpbiB0aGUgY3VycmVudCBzdHVkeVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsb2FkZWRGaWxlTmFtZSA9IGZpbGVJbmZvLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RNb2RpZmllZERhdGUgPSBmaWxlSW5mby5sYXN0TW9kaWZpZWREYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlTmFtZXNldERhdGEoIG5hbWVzZXQsIGxvYWRlZEZpbGVOYW1lLCBsYXN0TW9kaWZpZWREYXRlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJFcnJvciByZWFkaW5nIG5hbWVzIGZyb20gPHN0cm9uZz5cIiArIGZpbGVJbmZvLm5hbWUgKyBcIjwvc3Ryb25nPiEgUGxlYXNlIGNvbXBhcmUgaXQgdG8gZXhhbXBsZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGZyLnJlYWRBc1RleHQoZmlsZUluZm8pOyAgLy8gZGVmYXVsdCBlbmNvZGluZyBpcyB1dGYtOFxuICAgICAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gY3JlYXRlIHNvbWUgaXNvbGF0ZWQgb2JzZXJ2YWJsZXMgKGFzIGdsb2JhbCBKUyB2YXJzISkgdXNlZCB0byBzdXBwb3J0IG91ciBtYXBwaW5nIFVJXG52YXIgYXV0b01hcHBpbmdJblByb2dyZXNzID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG52YXIgY3VycmVudGx5TWFwcGluZ05hbWVzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTsgLy8gZHJpdmVzIHNwaW5uZXJzLCBldGMuXG52YXIgZmFpbGVkTWFwcGluZ05hbWVzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTsgXG4gICAgLy8gaWdub3JlIHRoZXNlIHVudGlsIHdlIGhhdmUgbmV3IG1hcHBpbmcgaGludHNcbnZhciBwcm9wb3NlZE5hbWVNYXBwaW5ncyA9IGtvLm9ic2VydmFibGUoe30pOyBcbiAgICAvLyBzdG9yZWQgYW55IGxhYmVscyBwcm9wb3NlZCBieSBzZXJ2ZXIsIGtleWVkIGJ5IG5hbWUgaWQgW1RPRE8/XVxudmFyIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyID0ga28ub2JzZXJ2YWJsZSgxKTsgIFxuICAgIC8vIHRoaXMganVzdCBudWRnZXMgdGhlIGxhYmVsLWVkaXRpbmcgVUkgdG8gcmVmcmVzaCFcblxuXG4vKiBTVEFSVCBjb252ZXJ0ICdPVFUnIHRvICduYW1lJyB0aHJvdWdob3V0PyAqL1xuXG5mdW5jdGlvbiBhZGp1c3RlZExhYmVsT3JFbXB0eShsYWJlbCkge1xuICAgIC8vIFdlIHNob3VsZCBvbmx5IGRpc3BsYXkgYW4gYWRqdXN0ZWQgbGFiZWwgaWYgaXQncyBjaGFuZ2VkIGZyb20gdGhlXG4gICAgLy8gb3JpZ2luYWw7IG90aGVyd2lzZSByZXR1cm4gYW4gZW1wdHkgc3RyaW5nLlxuICAgIGlmICh0eXBlb2YobGFiZWwpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGxhYmVsID0gbGFiZWwoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZihsYWJlbCkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIHByb2JhYmx5IG51bGwsIG5vdGhpbmcgdG8gc2VlIGhlcmVcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHZhciBhZGp1c3RlZCA9IGFkanVzdGVkTGFiZWwobGFiZWwpO1xuICAgIGlmIChhZGp1c3RlZCA9PSBsYWJlbCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIGFkanVzdGVkO1xufVxuXG5mdW5jdGlvbiBhZGp1c3RlZExhYmVsKGxhYmVsKSB7XG4gICAgLy8gYXBwbHkgYW55IGFjdGl2ZSBuYW1lIG1hcHBpbmcgYWRqdXN0bWVudHMgdG8gdGhpcyBzdHJpbmdcbiAgICBpZiAodHlwZW9mKGxhYmVsKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBsYWJlbCA9IGxhYmVsKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YobGFiZWwpICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBwcm9iYWJseSBudWxsXG4gICAgICAgIHJldHVybiBsYWJlbDtcbiAgICB9XG4gICAgdmFyIGFkanVzdGVkID0gbGFiZWw7XG4gICAgLy8gYXBwbHkgYW55IGFjdGl2ZSBzdWJzaXR1dGlvbnMgaW4gdGhlIHZpZXdNZGVsXG4gICAgdmFyIHN1Ykxpc3QgPSB2aWV3TW9kZWwubWFwcGluZ0hpbnRzLnN1YnN0aXR1dGlvbnMoKTtcbiAgICAkLmVhY2goc3ViTGlzdCwgZnVuY3Rpb24oaSwgc3Vic3QpIHtcbiAgICAgICAgaWYgKCFzdWJzdC5hY3RpdmUoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIHNraXAgdG8gbmV4dCBhZGp1c3RtZW50XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9sZFRleHQgPSBzdWJzdC5vbGQoKTtcbiAgICAgICAgdmFyIG5ld1RleHQgPSBzdWJzdC5uZXcoKTtcbiAgICAgICAgaWYgKCQudHJpbShvbGRUZXh0KSA9PT0gJC50cmltKG5ld1RleHQpID09PSBcIlwiKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gc2tpcCB0byBuZXh0IGFkanVzdG1lbnRcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy92YXIgcGF0dGVybiA9IG5ldyBSZWdFeHAob2xkVGV4dCwgJ2cnKTsgIC8vIGcgPSByZXBsYWNlIEFMTCBpbnN0YW5jZXNcbiAgICAgICAgICAgIC8vIE5PLCB0aGlzIGNhdXNlcyB3ZWlyZCByZXBldGl0aW9uIGluIGNvbW1vbiBjYXNlc1xuICAgICAgICAgICAgdmFyIHBhdHRlcm4gPSBuZXcgUmVnRXhwKG9sZFRleHQpO1xuICAgICAgICAgICAgYWRqdXN0ZWQgPSBhZGp1c3RlZC5yZXBsYWNlKHBhdHRlcm4sIG5ld1RleHQpO1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IHN0YWxlIGludmFsaWQtcmVnZXggbWFya2luZyBvbiB0aGlzIGZpZWxkXG4gICAgICAgICAgICBzdWJzdC52YWxpZCh0cnVlKTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAvLyB0aGVyZSdzIHByb2JhYmx5IGludmFsaWQgcmVnZXggaW4gdGhlIGZpZWxkLi4uIG1hcmsgaXQgYW5kIHNraXBcbiAgICAgICAgICAgIHN1YnN0LnZhbGlkKGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBhZGp1c3RlZDtcbn1cblxuLy8ga2VlcCB0cmFjayBvZiB0aGUgbGFzdCAoZGUpc2VsZWN0ZWQgbGlzdCBpdGVtIChpdHMgcG9zaXRpb24pXG52YXIgbGFzdENsaWNrZWRUb2dnbGVQb3NpdGlvbiA9IG51bGw7XG5mdW5jdGlvbiB0b2dnbGVNYXBwaW5nRm9yTmFtZShuYW1lLCBldnQpIHtcbiAgICB2YXIgJHRvZ2dsZSwgbmV3U3RhdGU7XG4gICAgLy8gYWxsb3cgdHJpZ2dlcmluZyB0aGlzIGZyb20gYW55d2hlcmUgaW4gdGhlIHJvd1xuICAgIGlmICgkKGV2dC50YXJnZXQpLmlzKCc6Y2hlY2tib3gnKSkge1xuICAgICAgICAkdG9nZ2xlID0gJChldnQudGFyZ2V0KTtcbiAgICAgICAgLy8gTi5CLiB1c2VyJ3MgY2xpY2sgKG9yIHRoZSBjYWxsZXIpIGhhcyBhbHJlYWR5IHNldCBpdHMgc3RhdGUhXG4gICAgICAgIG5ld1N0YXRlID0gJHRvZ2dsZS5pcygnOmNoZWNrZWQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkdG9nZ2xlID0gJChldnQudGFyZ2V0KS5jbG9zZXN0KCd0cicpLmZpbmQoJ2lucHV0Lm1hcC10b2dnbGUnKTtcbiAgICAgICAgLy8gY2xpY2tpbmcgZWxzZXdoZXJlIHNob3VsZCB0b2dnbGUgY2hlY2tib3ggc3RhdGUhXG4gICAgICAgIG5ld1N0YXRlID0gISgkdG9nZ2xlLmlzKCc6Y2hlY2tlZCcpKTtcbiAgICAgICAgZm9yY2VUb2dnbGVDaGVja2JveCgkdG9nZ2xlLCBuZXdTdGF0ZSk7XG4gICAgfVxuICAgIC8vIGFkZCAob3IgcmVtb3ZlKSBoaWdobGlnaHQgY29sb3IgdGhhdCB3b3JrcyB3aXRoIGhvdmVyLWNvbG9yXG4gICAgLyogTi5CLiB0aGF0IHRoaXMgZHVwbGljYXRlcyB0aGUgZWZmZWN0IG9mIEtub2Nrb3V0IGJpbmRpbmdzIG9uIHRoZXNlIHRhYmxlXG4gICAgICogcm93cyEgVGhpcyBpcyBkZWxpYmVyYXRlLCBzaW5jZSB3ZSdyZSBvZnRlbiB0b2dnbGluZyAqbWFueSogcm93cyBhdFxuICAgICAqIG9uY2UsIHNvIHdlIG5lZWQgdG8gdXBkYXRlIHZpc3VhbCBzdHlsZSB3aGlsZSBwb3N0cG9uaW5nIGFueSB0aWNrbGVyXG4gICAgICogbnVkZ2UgJ3RpbCB3ZSdyZSBkb25lLlxuICAgICAqL1xuICAgIGlmIChuZXdTdGF0ZSkge1xuICAgICAgICAkdG9nZ2xlLmNsb3Nlc3QoJ3RyJykuYWRkQ2xhc3MoJ3dhcm5pbmcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkdG9nZ2xlLmNsb3Nlc3QoJ3RyJykucmVtb3ZlQ2xhc3MoJ3dhcm5pbmcnKTtcbiAgICB9XG4gICAgLy8gaWYgdGhpcyBpcyB0aGUgb3JpZ2luYWwgY2xpY2sgZXZlbnQ7IGNoZWNrIGZvciBhIHJhbmdlIVxuICAgIGlmICh0eXBlb2YoZXZ0LnNoaWZ0S2V5KSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gZGV0ZXJtaW5lIHRoZSBwb3NpdGlvbiAobnRoIGNoZWNrYm94KSBvZiB0aGlzIG5hbWUgaW4gdGhlIHZpc2libGUgbGlzdFxuICAgICAgICB2YXIgJHZpc2libGVUb2dnbGVzID0gJHRvZ2dsZS5jbG9zZXN0KCd0YWJsZScpLmZpbmQoJ2lucHV0Lm1hcC10b2dnbGUnKTtcbiAgICAgICAgdmFyIG5ld0xpc3RQb3NpdGlvbiA9ICQuaW5BcnJheSggJHRvZ2dsZVswXSwgJHZpc2libGVUb2dnbGVzKTtcbiAgICAgICAgaWYgKGV2dC5zaGlmdEtleSAmJiB0eXBlb2YobGFzdENsaWNrZWRUb2dnbGVQb3NpdGlvbikgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBmb3JjZU1hcHBpbmdGb3JSYW5nZU9mTmFtZXMoIG5hbWVbJ3NlbGVjdGVkRm9yQWN0aW9uJ10sIGxhc3RDbGlja2VkVG9nZ2xlUG9zaXRpb24sIG5ld0xpc3RQb3NpdGlvbiApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGluIGFueSBjYXNlLCBtYWtlIHRoaXMgdGhlIG5ldyByYW5nZS1zdGFydGVyXG4gICAgICAgIGxhc3RDbGlja2VkVG9nZ2xlUG9zaXRpb24gPSBuZXdMaXN0UG9zaXRpb247XG4gICAgfVxuICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICByZXR1cm4gdHJ1ZTsgIC8vIHVwZGF0ZSB0aGUgY2hlY2tib3hcbn1cbmZ1bmN0aW9uIGZvcmNlTWFwcGluZ0ZvclJhbmdlT2ZOYW1lcyggbmV3U3RhdGUsIHBvc0EsIHBvc0IgKSB7XG4gICAgLy8gdXBkYXRlIHNlbGVjdGVkIHN0YXRlIGZvciBhbGwgY2hlY2tib3hlcyBpbiB0aGlzIHJhbmdlXG4gICAgdmFyICRhbGxNYXBwaW5nVG9nZ2xlcyA9ICQoJ2lucHV0Lm1hcC10b2dnbGUnKTtcbiAgICB2YXIgJHRvZ2dsZXNJblJhbmdlO1xuICAgIGlmIChwb3NCID4gcG9zQSkge1xuICAgICAgICAkdG9nZ2xlc0luUmFuZ2UgPSAkYWxsTWFwcGluZ1RvZ2dsZXMuc2xpY2UocG9zQSwgcG9zQisxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkdG9nZ2xlc0luUmFuZ2UgPSAkYWxsTWFwcGluZ1RvZ2dsZXMuc2xpY2UocG9zQiwgcG9zQSsxKTtcbiAgICB9XG4gICAgJHRvZ2dsZXNJblJhbmdlLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvcmNlVG9nZ2xlQ2hlY2tib3godGhpcywgbmV3U3RhdGUpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBmb3JjZVRvZ2dsZUNoZWNrYm94KGNiLCBuZXdTdGF0ZSkge1xuICAgIHZhciAkY2IgPSAkKGNiKTtcbiAgICBzd2l0Y2gobmV3U3RhdGUpIHtcbiAgICAgICAgY2FzZSAodHJ1ZSk6XG4gICAgICAgICAgICBpZiAoJGNiLmlzKCc6Y2hlY2tlZCcpID09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgJGNiLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAkY2IudHJpZ2dlckhhbmRsZXIoJ2NsaWNrJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAoZmFsc2UpOlxuICAgICAgICAgICAgaWYgKCRjYi5pcygnOmNoZWNrZWQnKSkge1xuICAgICAgICAgICAgICAgICRjYi5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICRjYi50cmlnZ2VySGFuZGxlcignY2xpY2snKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImZvcmNlVG9nZ2xlQ2hlY2tib3goKSBpbnZhbGlkIG5ld1N0YXRlIDxcIisgdHlwZW9mKG5ld1N0YXRlKSArXCI+OlwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobmV3U3RhdGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRvZ2dsZUFsbE1hcHBpbmdDaGVja2JveGVzKGNiKSB7XG4gICAgdmFyICRiaWdUb2dnbGUgPSAkKGNiKTtcbiAgICB2YXIgJGFsbE1hcHBpbmdUb2dnbGVzID0gJCgnaW5wdXQubWFwLXRvZ2dsZScpO1xuICAgIHZhciBuZXdTdGF0ZSA9ICRiaWdUb2dnbGUuaXMoJzpjaGVja2VkJyk7XG4gICAgJGFsbE1hcHBpbmdUb2dnbGVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvcmNlVG9nZ2xlQ2hlY2tib3godGhpcywgbmV3U3RhdGUpO1xuICAgIH0pO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBlZGl0TmFtZUxhYmVsKG5hbWUsIGV2dCkge1xuICAgIHZhciBuYW1laWQgPSBuYW1lWydpZCddO1xuICAgIHZhciBvcmlnaW5hbExhYmVsID0gbmFtZVsnb3JpZ2luYWxMYWJlbCddO1xuICAgIG5hbWVbJ2FkanVzdGVkTGFiZWwnXSA9IGFkanVzdGVkTGFiZWwob3JpZ2luYWxMYWJlbCk7XG5cbiAgICAvLyBNYXJrIHRoaXMgbmFtZSBhcyBzZWxlY3RlZCBmb3IgbWFwcGluZy5cbiAgICBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddID0gdHJ1ZTtcblxuICAgIC8vIElmIHdlIGhhdmUgYSBwcm9wZXIgbW91c2UgZXZlbnQsIHRyeSB0byBtb3ZlIGlucHV0IGZvY3VzIHRvIHRoaXMgZmllbGRcbiAgICAvLyBhbmQgcHJlLXNlbGVjdCBpdHMgZnVsbCB0ZXh0LlxuICAgIC8vXG4gICAgLy8gTi5CLiBUaGVyZSdzIGEgJ2hhc0ZvY3VzJyBiaW5kaW5nIHdpdGggc2ltaWxhciBiZWhhdmlvciwgYnV0IGl0J3MgdHJpY2t5XG4gICAgLy8gdG8gbWFyayB0aGUgbmV3IGZpZWxkIHZzLiBleGlzdGluZyBvbmVzOlxuICAgIC8vICAgaHR0cDovL2tub2Nrb3V0anMuY29tL2RvY3VtZW50YXRpb24vaGFzZm9jdXMtYmluZGluZy5odG1sXG4gICAgaWYgKCdjdXJyZW50VGFyZ2V0JyBpbiBldnQpIHtcbiAgICAgICAgLy8gY2FwdHVyZSB0aGUgY3VycmVudCB0YWJsZSByb3cgYmVmb3JlIERPTSB1cGRhdGVzXG4gICAgICAgIHZhciAkY3VycmVudFJvdyA9ICQoZXZ0LmN1cnJlbnRUYXJnZXQpLmNsb3Nlc3QoJ3RyJyk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJGVkaXRGaWVsZCA9ICRjdXJyZW50Um93LmZpbmQoJ2lucHV0OnRleHQnKTtcbiAgICAgICAgICAgICRlZGl0RmllbGQuZm9jdXMoKS5zZWxlY3QoKTtcbiAgICAgICAgfSwgNTApO1xuICAgIH1cblxuICAgIC8vIHRoaXMgc2hvdWxkIG1ha2UgdGhlIGVkaXRvciBhcHBlYXIgKGFsdGVyaW5nIHRoZSBET00pXG4gICAgYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyKCkgKyAxKTtcbiAgICBudWRnZVRpY2tsZXIoICdOQU1FX01BUFBJTkdfSElOVFMnKTsgLy8gdG8gcmVmcmVzaCAnc2VsZWN0ZWQnIGNoZWNrYm94XG59XG5mdW5jdGlvbiBtb2RpZnlFZGl0ZWRMYWJlbChuYW1lKSB7XG4gICAgLy8gcmVtb3ZlIGl0cyBuYW1lLWlkIGZyb20gZmFpbGVkLW5hbWUgbGlzdCB3aGVuIHVzZXIgbWFrZXMgY2hhbmdlc1xuICAgIHZhciBuYW1laWQgPSBuYW1lWydpZCddO1xuICAgIGZhaWxlZE1hcHBpbmdOYW1lcy5yZW1vdmUobmFtZWlkKTtcbiAgICAvLyBudWRnZSB0byB1cGRhdGUgbmFtZSBsaXN0IGltbWVkaWF0ZWx5XG4gICAgYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyKCkgKyAxKTtcbiAgICBudWRnZUF1dG9NYXBwaW5nKCk7XG5cbiAgICBudWRnZVRpY2tsZXIoICdOQU1FX01BUFBJTkdfSElOVFMnKTtcbn1cbmZ1bmN0aW9uIHJldmVydE5hbWVMYWJlbChuYW1lKSB7XG4gICAgLy8gdW5kb2VzICdlZGl0TmFtZUxhYmVsJywgcmVsZWFzaW5nIGEgbGFiZWwgdG8gdXNlIHNoYXJlZCBoaW50c1xuICAgIHZhciBuYW1laWQgPSBuYW1lWydpZCddO1xuICAgIGRlbGV0ZSBuYW1lWydhZGp1c3RlZExhYmVsJ107XG4gICAgZmFpbGVkTWFwcGluZ05hbWVzLnJlbW92ZShuYW1laWQgKTtcbiAgICAvLyB0aGlzIHNob3VsZCBtYWtlIHRoZSBlZGl0b3IgZGlzYXBwZWFyIGFuZCByZXZlcnQgaXRzIGFkanVzdGVkIGxhYmVsXG4gICAgYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyKCkgKyAxKTtcbiAgICBudWRnZUF1dG9NYXBwaW5nKCk7XG59XG5cbmZ1bmN0aW9uIHByb3Bvc2VOYW1lTGFiZWwobmFtZWlkLCBtYXBwaW5nSW5mbykge1xuICAgIC8vIHN0YXNoIG9uZSAob3IgbW9yZSkgbWFwcGluZ3MgYXMgb3B0aW9ucyBmb3IgdGhpcyBuYW1lXG4gICAgaWYgKCQuaXNBcnJheSggbWFwcGluZ0luZm8pKSB7XG4gICAgICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzKClbIG5hbWVpZCBdID0ga28ub2JzZXJ2YWJsZUFycmF5KCBtYXBwaW5nSW5mbyApLmV4dGVuZCh7IG5vdGlmeTogJ2Fsd2F5cycgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF0gPSBrby5vYnNlcnZhYmxlKCBtYXBwaW5nSW5mbyApLmV4dGVuZCh7IG5vdGlmeTogJ2Fsd2F5cycgfSk7XG4gICAgfVxuICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgIC8vIHRoaXMgc2hvdWxkIG1ha2UgdGhlIGVkaXRvciBhcHBlYXJcbn1cbmZ1bmN0aW9uIHByb3Bvc2VkTWFwcGluZyggbmFtZSApIHtcbiAgICBpZiAoIW5hbWUgfHwgdHlwZW9mIG5hbWVbJ2lkJ10gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwicHJvcG9zZWRNYXBwaW5nKCkgZmFpbGVkXCIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIG5hbWVpZCA9IG5hbWVbJ2lkJ107XG4gICAgdmFyIGFjYyA9IHByb3Bvc2VkTmFtZU1hcHBpbmdzKClbIG5hbWVpZCBdO1xuICAgIHJldHVybiBhY2MgPyBhY2MoKSA6IG51bGw7XG59XG5mdW5jdGlvbiBhcHByb3ZlUHJvcG9zZWROYW1lTGFiZWwobmFtZSkge1xuICAgIC8vIHVuZG9lcyAnZWRpdE5hbWVMYWJlbCcsIHJlbGVhc2luZyBhIGxhYmVsIHRvIHVzZSBzaGFyZWQgaGludHNcbiAgICB2YXIgbmFtZWlkID0gbmFtZVsnaWQnXTtcbiAgICB2YXIgaXRzTWFwcGluZ0luZm8gPSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICB2YXIgYXBwcm92ZWRNYXBwaW5nID0gJC5pc0Z1bmN0aW9uKGl0c01hcHBpbmdJbmZvKSA/XG4gICAgICAgIGl0c01hcHBpbmdJbmZvKCkgOlxuICAgICAgICBpdHNNYXBwaW5nSW5mbztcbiAgICBpZiAoJC5pc0FycmF5KGFwcHJvdmVkTWFwcGluZykpIHtcbiAgICAgICAgLy8gYXBwbHkgdGhlIGZpcnN0IChvbmx5KSB2YWx1ZVxuICAgICAgICBtYXBOYW1lVG9UYXhvbiggbmFtZWlkLCBhcHByb3ZlZE1hcHBpbmdbMF0gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhcHBseSB0aGUgaW5uZXIgdmFsdWUgb2YgYW4gb2JzZXJ2YWJsZSAoYWNjZXNzb3IpIGZ1bmN0aW9uXG4gICAgICAgIG1hcE5hbWVUb1RheG9uKCBuYW1laWQsIGtvLnVud3JhcChhcHByb3ZlZE1hcHBpbmcpICk7XG4gICAgfVxuICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIG51ZGdlVGlja2xlciggJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUycpOyAvLyB0byByZWZyZXNoIHN0YXR1cyBiYXJcbn1cbmZ1bmN0aW9uIGFwcHJvdmVQcm9wb3NlZE5hbWVNYXBwaW5nT3B0aW9uKGFwcHJvdmVkTWFwcGluZywgc2VsZWN0ZWRJbmRleCkge1xuICAgIC8vIHNpbWlsYXIgdG8gYXBwcm92ZVByb3Bvc2VkTmFtZUxhYmVsLCBidXQgZm9yIGEgbGlzdGVkIG9wdGlvblxuICAgIHZhciBuYW1laWQgPSBhcHByb3ZlZE1hcHBpbmcubmFtZUlEO1xuICAgIG1hcE5hbWVUb1RheG9uKCBuYW1laWQsIGFwcHJvdmVkTWFwcGluZyApO1xuICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIG51ZGdlVGlja2xlciggJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUycpOyAvLyB0byByZWZyZXNoIHN0YXR1cyBiYXJcbn1cbmZ1bmN0aW9uIHJlamVjdFByb3Bvc2VkTmFtZUxhYmVsKG5hbWUpIHtcbiAgICAvLyB1bmRvZXMgJ3Byb3Bvc2VOYW1lTGFiZWwnLCBjbGVhcmluZyBpdHMgdmFsdWVcbiAgICB2YXIgbmFtZWlkID0gbmFtZVsnaWQnXTtcbiAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF07XG4gICAgcHJvcG9zZWROYW1lTWFwcGluZ3MudmFsdWVIYXNNdXRhdGVkKCk7XG4gICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICBudWRnZVRpY2tsZXIoICdWSVNJQkxFX05BTUVfTUFQUElOR1MnKTsgLy8gdG8gcmVmcmVzaCBzdGF0dXMgYmFyXG59XG5cbmZ1bmN0aW9uIGdldEFsbFZpc2libGVQcm9wb3NlZE1hcHBpbmdzKCkge1xuICAgIC8vIGdhdGhlciBhbnkgcHJvcG9zZWQgbWFwcGluZ3MgKElEcykgdGhhdCBhcmUgdmlzaWJsZSBvbiB0aGlzIHBhZ2VcbiAgICB2YXIgdmlzaWJsZVByb3Bvc2VkTWFwcGluZ3MgPSBbXTtcbiAgICB2YXIgdmlzaWJsZU5hbWVzID0gdmlld01vZGVsLmZpbHRlcmVkTmFtZXMoKS5wYWdlZEl0ZW1zKCk7XG4gICAgJC5lYWNoKCB2aXNpYmxlTmFtZXMsIGZ1bmN0aW9uIChpLCBuYW1lKSB7XG4gICAgICAgIGlmIChwcm9wb3NlZE1hcHBpbmcobmFtZSkpIHtcbiAgICAgICAgICAgIC8vIHdlIGhhdmUgYSBwcm9wb3NlZCBtYXBwaW5nIGZvciB0aGlzIG5hbWUhXG4gICAgICAgICAgICB2aXNpYmxlUHJvcG9zZWRNYXBwaW5ncy5wdXNoKCBuYW1lWydpZCddICk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdmlzaWJsZVByb3Bvc2VkTWFwcGluZ3M7IC8vIHJldHVybiBhIHNlcmllcyBvZiBJRHNcbn1cbmZ1bmN0aW9uIGFwcHJvdmVBbGxWaXNpYmxlTWFwcGluZ3MoKSB7XG4gICAgJC5lYWNoKGdldEFsbFZpc2libGVQcm9wb3NlZE1hcHBpbmdzKCksIGZ1bmN0aW9uKGksIG5hbWVpZCkge1xuICAgICAgICB2YXIgaXRzTWFwcGluZ0luZm8gPSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICAgICAgdmFyIGFwcHJvdmVkTWFwcGluZyA9ICQuaXNGdW5jdGlvbihpdHNNYXBwaW5nSW5mbykgP1xuICAgICAgICAgICAgaXRzTWFwcGluZ0luZm8oKSA6XG4gICAgICAgICAgICBpdHNNYXBwaW5nSW5mbztcbiAgICAgICAgaWYgKCQuaXNBcnJheShhcHByb3ZlZE1hcHBpbmcpKSB7XG4gICAgICAgICAgICBpZiAoYXBwcm92ZWRNYXBwaW5nLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIHRlc3QgdGhlIGZpcnN0IChvbmx5KSB2YWx1ZSBmb3IgcG9zc2libGUgYXBwcm92YWxcbiAgICAgICAgICAgICAgICB2YXIgb25seU1hcHBpbmcgPSBhcHByb3ZlZE1hcHBpbmdbMF07XG4gICAgICAgICAgICAgICAgaWYgKG9ubHlNYXBwaW5nLm9yaWdpbmFsTWF0Y2guaXNfc3lub255bSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47ICAvLyBzeW5vbnltcyByZXF1aXJlIG1hbnVhbCByZXZpZXdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogTi5CLiBXZSBuZXZlciBwcmVzZW50IHRoZSBzb2xlIG1hcHBpbmcgc3VnZ2VzdGlvbiBhcyBhXG4gICAgICAgICAgICAgICAgICogdGF4b24tbmFtZSBob21vbnltLCBzbyBqdXN0IGNvbnNpZGVyIHRoZSBtYXRjaCBzY29yZSB0b1xuICAgICAgICAgICAgICAgICAqIGRldGVybWluZSB3aGV0aGVyIGl0J3MgYW4gXCJleGFjdCBtYXRjaFwiLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGlmIChvbmx5TWFwcGluZy5vcmlnaW5hbE1hdGNoLnNjb3JlIDwgMS4wKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjsgIC8vIG5vbi1leGFjdCBtYXRjaGVzIHJlcXVpcmUgbWFudWFsIHJldmlld1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzdGlsbCBoZXJlPyB0aGVuIHRoaXMgbWFwcGluZyBsb29rcyBnb29kIGVub3VnaCBmb3IgYXV0by1hcHByb3ZhbFxuICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICAgICAgICAgICAgICBtYXBOYW1lVG9UYXhvbiggbmFtZWlkLCBhcHByb3ZlZE1hcHBpbmdbMF0sIHtQT1NUUE9ORV9VSV9DSEFOR0VTOiB0cnVlfSApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm47IC8vIG11bHRpcGxlIHBvc3NpYmlsaXRpZXMgcmVxdWlyZSBtYW51YWwgcmV2aWV3XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhcHBseSB0aGUgaW5uZXIgdmFsdWUgb2YgYW4gb2JzZXJ2YWJsZSAoYWNjZXNzb3IpIGZ1bmN0aW9uXG4gICAgICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF07XG4gICAgICAgICAgICBtYXBOYW1lVG9UYXhvbiggbmFtZWlkLCBrby51bndyYXAoYXBwcm92ZWRNYXBwaW5nKSwge1BPU1RQT05FX1VJX0NIQU5HRVM6IHRydWV9ICk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIG51ZGdlVGlja2xlciggJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUycpOyAvLyB0byByZWZyZXNoIHN0YXR1cyBiYXJcbiAgICBzdGFydEF1dG9NYXBwaW5nKCk7XG59XG5mdW5jdGlvbiByZWplY3RBbGxWaXNpYmxlTWFwcGluZ3MoKSB7XG4gICAgJC5lYWNoKGdldEFsbFZpc2libGVQcm9wb3NlZE1hcHBpbmdzKCksIGZ1bmN0aW9uKGksIG5hbWVpZCkge1xuICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF07XG4gICAgfSk7XG4gICAgcHJvcG9zZWROYW1lTWFwcGluZ3MudmFsdWVIYXNNdXRhdGVkKCk7XG4gICAgc3RvcEF1dG9NYXBwaW5nKCk7XG4gICAgbnVkZ2VUaWNrbGVyKCAnVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7IC8vIHRvIHJlZnJlc2ggc3RhdHVzIGJhclxufVxuXG5mdW5jdGlvbiB1cGRhdGVNYXBwaW5nU3RhdHVzKCkge1xuICAgIC8vIHVwZGF0ZSBtYXBwaW5nIHN0YXR1cytkZXRhaWxzIGJhc2VkIG9uIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoaW5nc1xuICAgIHZhciBkZXRhaWxzSFRNTCwgc2hvd0JhdGNoQXBwcm92ZSwgc2hvd0JhdGNoUmVqZWN0LCBuZWVkc0F0dGVudGlvbjtcbiAgICAvKiBUT0RPOiBkZWZhdWx0cyBhc3N1bWUgbm90aGluZyBwYXJ0aWN1bGFybHkgaW50ZXJlc3RpbmcgZ29pbmcgb25cbiAgICBkZXRhaWxzSFRNTCA9ICcnO1xuICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICBzaG93QmF0Y2hSZWplY3QgPSB0cnVlO1xuICAgIG5lZWRzQXR0ZW50aW9uID0gZmFsc2U7XG4gICAgKi9cbiAgICB2YXIgcHJvcG9zZWRNYXBwaW5nTmVlZHNEZWNpc2lvbiA9IGZhbHNlO1xuICAgIGZvciAodmFyIHAgaW4gcHJvcG9zZWROYW1lTWFwcGluZ3MoKSkge1xuICAgICAgICAvLyB0aGUgcHJlc2VuY2Ugb2YgYW55dGhpbmcgaGVyZSBtZWFucyB0aGVyZSBhcmUgcHJvcG9zZWQgbWFwcGluZ3NcbiAgICAgICAgcHJvcG9zZWRNYXBwaW5nTmVlZHNEZWNpc2lvbiA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGF1dG9NYXBwaW5nSW5Qcm9ncmVzcygpID09PSB0cnVlKSB7XG4gICAgICAgIC8vIGF1dG8tbWFwcGluZyBpcyBBQ1RJVkUgKG1lYW5pbmcgd2UgaGF2ZSB3b3JrIGluIGhhbmQpXG4gICAgICAgIGRldGFpbHNIVE1MID0gJyc7IC8vICc8cCcrJz5NYXBwaW5nIGluIHByb2dyZXNzLi4uPCcrJy9wPic7XG4gICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgc2hvd0JhdGNoUmVqZWN0ID0gZmFsc2U7XG4gICAgICAgIG5lZWRzQXR0ZW50aW9uID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGdldE5leHRVbm1hcHBlZE5hbWUoKSkge1xuICAgICAgICAgICAgLy8gSUYgYXV0by1tYXBwaW5nIGlzIFBBVVNFRCwgYnV0IHRoZXJlJ3MgbW9yZSB0byBkbyBvbiB0aGlzIHBhZ2VcbiAgICAgICAgICAgIGRldGFpbHNIVE1MID0gJzxwJysnPk1hcHBpbmcgcGF1c2VkLiBTZWxlY3QgbmV3IG5hbWUgb3IgYWRqdXN0IG1hcHBpbmcgaGludHMsIHRoZW4gY2xpY2sgdGhlICdcbiAgICAgICAgICAgICAgICAgICAgICAgICArJzxzdHJvbmc+TWFwIHNlbGVjdGVkIG5hbWU8L3N0cm9uZz4gYnV0dG9uIGFib3ZlIHRvIHRyeSBhZ2Fpbi48JysnL3A+JztcbiAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHNob3dCYXRjaFJlamVjdCA9IHByb3Bvc2VkTWFwcGluZ05lZWRzRGVjaXNpb247XG4gICAgICAgICAgICBuZWVkc0F0dGVudGlvbiA9IHByb3Bvc2VkTWFwcGluZ05lZWRzRGVjaXNpb247XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhdXRvLW1hcHBpbmcgaXMgUEFVU0VEIGFuZCBldmVyeXRoaW5nJ3MgYmVlbiBtYXBwZWRcbiAgICAgICAgICAgIGlmIChwcm9wb3NlZE1hcHBpbmdOZWVkc0RlY2lzaW9uKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlcmUgYXJlIHByb3Bvc2VkIG1hcHBpbmdzIGF3YWl0aW5nIGEgZGVjaXNpb25cbiAgICAgICAgICAgICAgICBkZXRhaWxzSFRNTCA9ICc8cCcrJz5BbGwgc2VsZWN0ZWQgbmFtZXMgaGF2ZSBiZWVuIG1hcHBlZC4gVXNlIHRoZSAnXG4gICAgICAgICAgICAgICAgICAgICAgICArJzxzcGFuIGNsYXNzPVwiYnRuLWdyb3VwXCIgc3R5bGU9XCJtYXJnaW46IC0ycHggMDtcIj4nXG4gICAgICAgICAgICAgICAgICAgICAgICArJyA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1taW5pIGRpc2FibGVkXCI+PGkgY2xhc3M9XCJpY29uLW9rXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnPC9zcGFuPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIGJ1dHRvbnMgdG8gYWNjZXB0IG9yIHJlamVjdCBlYWNoIHN1Z2dlc3RlZCBtYXBwaW5nLCdcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIG9yIHRoZSBidXR0b25zIGJlbG93IHRvIGFjY2VwdCBvciByZWplY3QgdGhlIHN1Z2dlc3Rpb25zIGZvciBhbGwgdmlzaWJsZSBuYW1lcy48JysnL3A+JztcbiAgICAgICAgICAgICAgICBzaG93QmF0Y2hBcHByb3ZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzaG93QmF0Y2hSZWplY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG5lZWRzQXR0ZW50aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlcmUgYXJlIE5PIHByb3Bvc2VkIG1hcHBpbmdzIGF3YWl0aW5nIGEgZGVjaXNpb25cbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8qIFRPRE86IGNoZWNrIGZvciB0d28gcG9zc2liaWxpdGllcyBoZXJlXG4gICAgICAgICAgICAgICAgaWYgKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBjYW4gYWRkIG1vcmUgYnkgaW5jbHVkaW5nICdBbGwgdHJlZXMnXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbHNIVE1MID0gJzxwJysnPjxzdHJvbmc+Q29uZ3J0dWxhdGlvbnMhPC9zdHJvbmc+ICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJ01hcHBpbmcgaXMgc3VzcGVuZGVkIGJlY2F1c2UgYWxsIG5hbWVzIGluIHRoaXMgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnc3R1ZHlcXCdzIG5vbWluYXRlZCB0cmVlcyBoYXZlIGFjY2VwdGVkIGxhYmVscyBhbHJlYWR5LiBUbyBjb250aW51ZSwgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsncmVqZWN0IHNvbWUgbWFwcGVkIGxhYmVscyB3aXRoIHRoZSAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyc8c3BhbiBjbGFzcz1cImJ0bi1ncm91cFwiIHN0eWxlPVwibWFyZ2luOiAtMnB4IDA7XCI+J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJzwvc3Bhbj4gJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnYnV0dG9uIG9yIGNoYW5nZSB0aGUgZmlsdGVyIHRvIDxzdHJvbmc+SW4gYW55IHRyZWU8L3N0cm9uZz4uPCcrJy9wPic7XG4gICAgICAgICAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0JhdGNoUmVqZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIG5lZWRzQXR0ZW50aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSB0cnVseSBkb25lIHdpdGggbWFwcGluZyAoaW4gYWxsIHRyZWVzKVxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxzSFRNTCA9ICc8cCcrJz48c3Ryb25nPkNvbmdydHVsYXRpb25zITwvc3Ryb25nPiAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKydNYXBwaW5nIGlzIHN1c3BlbmRlZCBiZWNhdXNlIGFsbCBuYW1lcyBpbiB0aGlzIHN0dWR5IGhhdmUgYWNjZXB0ZWQgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnbGFiZWxzIGFscmVhZHkuLiBUbyBjb250aW51ZSwgdXNlIHRoZSAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyc8c3BhbiBjbGFzcz1cImJ0bi1ncm91cFwiIHN0eWxlPVwibWFyZ2luOiAtMnB4IDA7XCI+J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJzwvc3Bhbj4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKycgYnV0dG9ucyB0byByZWplY3QgYW55IGxhYmVsIGF0IGxlZnQuPCcrJy9wPic7XG4gICAgICAgICAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0JhdGNoUmVqZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIG5lZWRzQXR0ZW50aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgIC8qIFRPRE86IHJlcGxhY2UgdGhpcyBzdHVmZiB3aXRoIGlmL2Vsc2UgYmxvY2sgYWJvdmVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBkZXRhaWxzSFRNTCA9ICc8cCcrJz5NYXBwaW5nIGlzIHN1c3BlbmRlZCBiZWNhdXNlIGFsbCBzZWxlY3RlZCBuYW1lcyBoYXZlIGFjY2VwdGVkICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIGxhYmVscyBhbHJlYWR5LiBUbyBjb250aW51ZSwgc2VsZWN0IGFkZGl0aW9uYWwgbmFtZXMgdG8gbWFwLCBvciB1c2UgdGhlICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsnPHNwYW4gY2xhc3M9XCJidG4tZ3JvdXBcIiBzdHlsZT1cIm1hcmdpbjogLTJweCAwO1wiPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnPC9zcGFuPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIGJ1dHRvbnMgdG8gcmVqZWN0IGFueSBsYWJlbCBhdCBsZWZ0LCBvciBjaGFuZ2UgdGhlIGZpbHRlciBhbmQgc29ydCBvcHRpb25zJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKycgdG8gYnJpbmcgdW5tYXBwZWQgbmFtZXMgaW50byB2aWV3LjwnKycvcD4nO1xuICAgICAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzaG93QmF0Y2hSZWplY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBuZWVkc0F0dGVudGlvbiA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkKCcubWFwcGluZy1kZXRhaWxzJykuaHRtbChkZXRhaWxzSFRNTCk7XG4gICAgaWYgKHNob3dCYXRjaEFwcHJvdmUgfHwgc2hvd0JhdGNoUmVqZWN0KSB7XG4gICAgICAgICQoJy5tYXBwaW5nLWJhdGNoLW9wZXJhdGlvbnMnKS5zaG93KCk7XG4gICAgICAgIGlmIChzaG93QmF0Y2hBcHByb3ZlKSB7XG4gICAgICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zICNiYXRjaC1hcHByb3ZlJykuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnLm1hcHBpbmctYmF0Y2gtb3BlcmF0aW9ucyAjYmF0Y2gtYXBwcm92ZScpLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hvd0JhdGNoUmVqZWN0KSB7XG4gICAgICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zICNiYXRjaC1yZWplY3QnKS5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zICNiYXRjaC1yZWplY3QnKS5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zJykuaGlkZSgpO1xuICAgIH1cbiAgICBpZiAobmVlZHNBdHRlbnRpb24pIHtcbiAgICAgICAgJCgnI21hcHBpbmctc3RhdHVzLXBhbmVsJykuYWRkQ2xhc3MoJ21hcHBpbmctbmVlZHMtYXR0ZW50aW9uJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJCgnI21hcHBpbmctc3RhdHVzLXBhbmVsJykucmVtb3ZlQ2xhc3MoJ21hcHBpbmctbmVlZHMtYXR0ZW50aW9uJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzdGFydEF1dG9NYXBwaW5nKCkge1xuICAgIC8vIGJlZ2luIGEgZGFpc3ktY2hhaW4gb2YgQUpBWCBvcGVyYXRpb25zLCBtYXBwaW5nIDEgbGFiZWwgKG9yIG1vcmU/KSB0byBrbm93biB0YXhhXG4gICAgLy8gVE9ETzogd2hhdCBpZiB0aGVyZSB3YXMgYSBwZW5kaW5nIG9wZXJhdGlvbiB3aGVuIHdlIHN0b3BwZWQ/XG4gICAgYXV0b01hcHBpbmdJblByb2dyZXNzKCB0cnVlICk7XG4gICAgcmVxdWVzdFRheG9uTWFwcGluZygpOyAgLy8gdHJ5IHRvIGdyYWIgdGhlIGZpcnN0IHVubWFwcGVkIGxhYmVsIGluIHZpZXdcbiAgICB1cGRhdGVNYXBwaW5nU3RhdHVzKCk7XG59XG5mdW5jdGlvbiBzdG9wQXV0b01hcHBpbmcoKSB7XG4gICAgLy8gVE9ETzogd2hhdCBpZiB0aGVyZSdzIGFuIG9wZXJhdGlvbiBpbiBwcm9ncmVzcz8gZ2V0IGl0cyByZXN1bHQsIG9yIGRyb3AgaXQ/XG4gICAgYXV0b01hcHBpbmdJblByb2dyZXNzKCBmYWxzZSApO1xuICAgIGN1cnJlbnRseU1hcHBpbmdOYW1lcy5yZW1vdmVBbGwoKTtcbiAgICByZWNlbnRNYXBwaW5nU3BlZWRCYXJDbGFzcyggJ3Byb2dyZXNzIHByb2dyZXNzLWluZm8nICk7ICAgLy8gaW5hY3RpdmUgYmx1ZSBiYXJcbiAgICB1cGRhdGVNYXBwaW5nU3RhdHVzKCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZU1hcHBpbmdTcGVlZCggbmV3RWxhcHNlZFRpbWUgKSB7XG4gICAgcmVjZW50TWFwcGluZ1RpbWVzLnB1c2gobmV3RWxhcHNlZFRpbWUpO1xuICAgIGlmIChyZWNlbnRNYXBwaW5nVGltZXMubGVuZ3RoID4gNSkge1xuICAgICAgICAvLyBrZWVwIGp1c3QgdGhlIGxhc3QgNSB0aW1lc1xuICAgICAgICByZWNlbnRNYXBwaW5nVGltZXMgPSByZWNlbnRNYXBwaW5nVGltZXMuc2xpY2UoLTUpO1xuICAgIH1cblxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgJC5lYWNoKHJlY2VudE1hcHBpbmdUaW1lcywgZnVuY3Rpb24oaSwgdGltZSkge1xuICAgICAgICB0b3RhbCArPSB0aW1lO1xuICAgIH0pO1xuICAgIHZhciByb2xsaW5nQXZlcmFnZSA9IHRvdGFsIC8gcmVjZW50TWFwcGluZ1RpbWVzLmxlbmd0aDtcbiAgICB2YXIgc2VjUGVyTmFtZSA9IHJvbGxpbmdBdmVyYWdlIC8gMTAwMDtcbiAgICAvLyBzaG93IGEgbGVnaWJsZSBudW1iZXIgKGZpcnN0IHNpZ25pZmljYW50IGRpZ2l0KVxuICAgIHZhciBkaXNwbGF5U2VjO1xuICAgIGlmIChzZWNQZXJOYW1lID49IDAuMSkge1xuICAgICAgICBkaXNwbGF5U2VjID0gc2VjUGVyTmFtZS50b0ZpeGVkKDEpO1xuICAgIH0gZWxzZSBpZiAoc2VjUGVyTmFtZSA+PSAwLjAxKSB7XG4gICAgICAgIGRpc3BsYXlTZWMgPSBzZWNQZXJOYW1lLnRvRml4ZWQoMik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZGlzcGxheVNlYyA9IHNlY1Blck5hbWUudG9GaXhlZCgzKTtcbiAgICB9XG5cbiAgICByZWNlbnRNYXBwaW5nU3BlZWRMYWJlbCggZGlzcGxheVNlYyArXCIgc2VjIC8gbmFtZVwiKTtcblxuICAgIC8vIHVzZSBhcmJpdHJhcnkgc3BlZWRzIGhlcmUsIGZvciBiYWQvZmFpci9nb29kXG4gICAgaWYgKHNlY1Blck5hbWUgPCAwLjIpIHtcbiAgICAgICAgcmVjZW50TWFwcGluZ1NwZWVkQmFyQ2xhc3MoICdwcm9ncmVzcyBwcm9ncmVzcy1zdWNjZXNzJyApOyAgLy8gZ3JlZW4gYmFyXG4gICAgfSBlbHNlIGlmIChzZWNQZXJOYW1lIDwgMi4wKSB7XG4gICAgICAgIHJlY2VudE1hcHBpbmdTcGVlZEJhckNsYXNzKCAncHJvZ3Jlc3MgcHJvZ3Jlc3Mtd2FybmluZycgKTsgIC8vIG9yYW5nZSBiYXJcbiAgICB9IGVsc2Uge1xuICAgICAgICByZWNlbnRNYXBwaW5nU3BlZWRCYXJDbGFzcyggJ3Byb2dyZXNzIHByb2dyZXNzLWRhbmdlcicgKTsgICAvLyByZWQgYmFyXG4gICAgfVxuXG4gICAgLy8gYmFyIHdpZHRoIGlzIGFwcHJveGltYXRlLCBuZWVkcyB+NDAlIHRvIHNob3cgaXRzIHRleHRcbiAgICByZWNlbnRNYXBwaW5nU3BlZWRQZXJjZW50KCAoNDAgKyBNYXRoLm1pbiggKDAuMSAvIHNlY1Blck5hbWUpICogNjAsIDYwKSkudG9GaXhlZCgpICtcIiVcIiApO1xufVxuXG5cbmZ1bmN0aW9uIGdldE5leHRVbm1hcHBlZE5hbWUoKSB7XG4gICAgdmFyIHVubWFwcGVkTmFtZSA9IG51bGw7XG4gICAgdmFyIHZpc2libGVOYW1lcyA9IHZpZXdNb2RlbC5maWx0ZXJlZE5hbWVzKCkucGFnZWRJdGVtcygpO1xuICAgICQuZWFjaCggdmlzaWJsZU5hbWVzLCBmdW5jdGlvbiAoaSwgbmFtZSkge1xuICAgICAgICB2YXIgaXNBdmFpbGFibGUgPSBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddIHx8IGZhbHNlO1xuICAgICAgICAvLyBpZiBubyBzdWNoIGF0dHJpYnV0ZSwgY29uc2lkZXIgaXQgdW5hdmFpbGFibGVcbiAgICAgICAgaWYgKGlzQXZhaWxhYmxlKSB7XG4gICAgICAgICAgICB2YXIgb3R0TWFwcGluZ1RhZyA9IG5hbWVbJ290dElkJ10gfHwgbnVsbDtcbiAgICAgICAgICAgIHZhciBwcm9wb3NlZE1hcHBpbmdJbmZvID0gcHJvcG9zZWRNYXBwaW5nKG5hbWUpO1xuICAgICAgICAgICAgaWYgKCFvdHRNYXBwaW5nVGFnICYmICFwcm9wb3NlZE1hcHBpbmdJbmZvKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBhbiB1bm1hcHBlZCBuYW1lIVxuICAgICAgICAgICAgICAgIGlmIChmYWlsZWRNYXBwaW5nTmFtZXMuaW5kZXhPZihuYW1lWydpZCddKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgaGFzbid0IGZhaWxlZCBtYXBwaW5nIChhdCBsZWFzdCBub3QgeWV0KVxuICAgICAgICAgICAgICAgICAgICB1bm1hcHBlZE5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHVubWFwcGVkTmFtZTtcbn1cblxuLyogVE5SUyByZXF1ZXN0cyBhcmUgc2VudCB2aWEgUE9TVCBhbmQgY2Fubm90IGJlIGNhY2hlZCBieSB0aGUgYnJvd3Nlci4gS2VlcFxuICogdHJhY2sgb2YgcmVzcG9uc2VzIGluIGEgc2ltcGxlIGxvY2FsIGNhY2hlLCB0byBhdm9pZCBleHRyYSByZXF1ZXN0cyBmb3JcbiAqIGlkZW50aWNhbCB0YXhvbiBuYW1lcy4gKFRoaXMgaXMgY29tbW9uIHdoZW4gbWFueSBzaW1pbGFyIGxhYmVscyBoYXZlIGJlZW5cbiAqIFwibW9kaWZpZWQgZm9yIG1hcHBpbmdcIikuXG4gKlxuICogV2UnbGwgdXNlIGEgRklGTyBzdHJhdGVneSB0byBrZWVwIHRoaXMgdG8gYSByZWFzb25hYmxlIHNpemUuIEkgYmVsaWV2ZSB0aGlzXG4gKiB3aWxsIGhhbmRsZSB0aGUgZXhwZWN0ZWQgY2FzZSBvZiBtYW55IGxhYmVscyBiZWluZyBtb2RpZmllZCB0byB0aGUgc2FtZVxuICogc3RyaW5nLlxuICovXG52YXIgVE5SU0NhY2hlU2l6ZSA9IDIwMDtcbnZhciBUTlJTQ2FjaGUgPSB7fTtcbnZhciBUTlJTQ2FjaGVLZXlzID0gW107XG5mdW5jdGlvbiBhZGRUb1ROUlNDYWNoZSgga2V5LCB2YWx1ZSApIHtcbiAgICAvLyBhZGQgKG9yIHVwZGF0ZSkgdGhlIGNhY2hlIGZvciB0aGlzIGtleVxuICAgIGlmICghKGtleSBpbiBUTlJTQ2FjaGUpKSB7XG4gICAgICAgIFROUlNDYWNoZUtleXMucHVzaCgga2V5ICk7XG4gICAgfVxuICAgIFROUlNDYWNoZVsga2V5IF0gPSB2YWx1ZTtcbiAgICBpZiAoVE5SU0NhY2hlS2V5cy5sZW5ndGggPiBUTlJTQ2FjaGVTaXplKSB7XG4gICAgICAgIC8vIGNsZWFyIHRoZSBvbGRlc3QgY2FjaGVkIGl0ZW1cbiAgICAgICAgdmFyIGRvb21lZEtleSA9IFROUlNDYWNoZUtleXMuc2hpZnQoKTtcbiAgICAgICAgZGVsZXRlIFROUlNDYWNoZVsgZG9vbWVkS2V5IF07XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFROUlNDYWNoZSk7XG59XG5mdW5jdGlvbiBjbGVhclROUlNDYWNoZSgpIHtcbiAgICBUTlJTQ2FjaGUgPSB7fTtcbn07XG5cbmZ1bmN0aW9uIHJlcXVlc3RUYXhvbk1hcHBpbmcoIG5hbWVUb01hcCApIHtcbiAgICAvLyBzZXQgc3Bpbm5lciwgbWFrZSByZXF1ZXN0LCBoYW5kbGUgcmVzcG9uc2UsIGFuZCBkYWlzeS1jaGFpbiB0aGUgbmV4dCByZXF1ZXN0XG4gICAgLy8gVE9ETzogc2VuZCBvbmUgYXQgYSB0aW1lPyBvciBpbiBhIGJhdGNoICg1IGl0ZW1zKT9cblxuICAgIC8vIE5PVEUgdGhhdCB3ZSBtaWdodCBiZSByZXF1ZXN0aW5nIGEgc2luZ2xlIG5hbWUsIGVsc2UgZmluZCB0aGUgbmV4dCB1bm1hcHBlZCBvbmVcbiAgICB2YXIgc2luZ2xlVGF4b25NYXBwaW5nO1xuICAgIGlmIChuYW1lVG9NYXApIHtcbiAgICAgICAgc2luZ2xlVGF4b25NYXBwaW5nID0gdHJ1ZTtcbiAgICAgICAgZmFpbGVkTWFwcGluZ05hbWVzLnJlbW92ZShuYW1lVG9NYXBbJ2lkJ10gKTtcbiAgICAgICAgYXV0b01hcHBpbmdJblByb2dyZXNzKCB0cnVlICk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2luZ2xlVGF4b25NYXBwaW5nID0gZmFsc2U7XG4gICAgICAgIG5hbWVUb01hcCA9IGdldE5leHRVbm1hcHBlZE5hbWUoKTtcbiAgICB9XG4gICAgaWYgKCFuYW1lVG9NYXApIHtcbiAgICAgICAgc3RvcEF1dG9NYXBwaW5nKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB1cGRhdGVNYXBwaW5nU3RhdHVzKCk7XG4gICAgdmFyIG5hbWVJRCA9IG5hbWVUb01hcFsnaWQnXTtcbiAgICB2YXIgb3JpZ2luYWxMYWJlbCA9ICQudHJpbShuYW1lVG9NYXBbJ29yaWdpbmFsTGFiZWwnXSkgfHwgbnVsbDtcbiAgICAvLyB1c2UgdGhlIG1hbnVhbGx5IGVkaXRlZCBsYWJlbCAoaWYgYW55KSwgb3IgdGhlIGhpbnQtYWRqdXN0ZWQgdmVyc2lvblxuICAgIHZhciBlZGl0ZWRMYWJlbCA9ICQudHJpbShuYW1lVG9NYXBbJ2FkanVzdGVkTGFiZWwnXSk7XG4gICAgdmFyIHNlYXJjaFRleHQgPSAoZWRpdGVkTGFiZWwgIT09ICcnKSA/IGVkaXRlZExhYmVsIDogJC50cmltKGFkanVzdGVkTGFiZWwob3JpZ2luYWxMYWJlbCkpO1xuXG4gICAgaWYgKHNlYXJjaFRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTm8gbmFtZSB0byBtYXRjaCFcIik7IC8vIFRPRE9cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoc2VhcmNoVGV4dC5sZW5ndGggPCAyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTmVlZCBhdCBsZWFzdCB0d28gbGV0dGVycyFcIik7IC8vIFRPRE9cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGdyb29tIHRyaW1tZWQgdGV4dCBiYXNlZCBvbiBvdXIgc2VhcmNoIHJ1bGVzXG4gICAgdmFyIHNlYXJjaENvbnRleHROYW1lID0gdmlld01vZGVsLm1hcHBpbmdIaW50cy5zZWFyY2hDb250ZXh0KCk7XG4gICAgdmFyIHVzaW5nRnV6enlNYXRjaGluZyA9IHZpZXdNb2RlbC5tYXBwaW5nSGludHMudXNlRnV6enlNYXRjaGluZygpIHx8IGZhbHNlO1xuICAgIHZhciBhdXRvQWNjZXB0aW5nRXhhY3RNYXRjaGVzID0gdmlld01vZGVsLm1hcHBpbmdIaW50cy5hdXRvQWNjZXB0RXhhY3RNYXRjaGVzKCkgfHwgZmFsc2U7XG4gICAgLy8gc2hvdyBzcGlubmVyIGFsb25nc2lkZSB0aGlzIGl0ZW0uLi5cbiAgICBjdXJyZW50bHlNYXBwaW5nTmFtZXMucHVzaCggbmFtZUlEICk7XG5cbiAgICB2YXIgbWFwcGluZ1N0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG5cbiAgICBmdW5jdGlvbiB0bnJzU3VjY2VzcyhkYXRhKSB7XG4gICAgICAgIC8vIElGIHRoZXJlJ3MgYSBwcm9wZXIgcmVzcG9uc2UsIGFzc2VydCB0aGlzIGFzIHRoZSBuYW1lIGFuZCBsYWJlbCBmb3IgdGhpcyBub2RlXG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSByb2xsaW5nIGF2ZXJhZ2UgZm9yIHRoZSBtYXBwaW5nLXNwZWVkIGJhclxuICAgICAgICB2YXIgbWFwcGluZ1N0b3BUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgdXBkYXRlTWFwcGluZ1NwZWVkKCBtYXBwaW5nU3RvcFRpbWUuZ2V0VGltZSgpIC0gbWFwcGluZ1N0YXJ0VGltZS5nZXRUaW1lKCkgKTtcblxuICAgICAgICB2YXIgbWF4UmVzdWx0cyA9IDEwMDtcbiAgICAgICAgdmFyIHZpc2libGVSZXN1bHRzID0gMDtcbiAgICAgICAgdmFyIHJlc3VsdFNldHNGb3VuZCA9IChkYXRhICYmICgncmVzdWx0cycgaW4gZGF0YSkgJiYgKGRhdGEucmVzdWx0cy5sZW5ndGggPiAwKSk7XG4gICAgICAgIHZhciBjYW5kaWRhdGVNYXRjaGVzID0gWyBdO1xuICAgICAgICAvLyBGb3Igbm93LCB3ZSB3YW50IHRvIGF1dG8tYXBwbHkgaWYgdGhlcmUncyBleGFjdGx5IG9uZSBtYXRjaFxuICAgICAgICBpZiAocmVzdWx0U2V0c0ZvdW5kKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGRhdGEucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTk8gU0VBUkNIIFJFU1VMVCBTRVRTIEZPVU5EIScpO1xuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVNYXRjaGVzID0gWyBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGV4cGVjdGVkIGNhc2VcbiAgICAgICAgICAgICAgICAgICAgY2FuZGlkYXRlTWF0Y2hlcyA9IGRhdGEucmVzdWx0c1swXS5tYXRjaGVzIHx8IFsgXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ01VTFRJUExFIFNFQVJDSCBSRVNVTFQgU0VUUyAoVVNJTkcgRklSU1QpJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihkYXRhWydyZXN1bHRzJ10pO1xuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVNYXRjaGVzID0gZGF0YS5yZXN1bHRzWzBdLm1hdGNoZXMgfHwgWyBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IEZpbHRlciBjYW5kaWRhdGUgbWF0Y2hlcyBiYXNlZCBvbiB0aGVpciBwcm9wZXJ0aWVzLCBzY29yZXMsIGV0Yy4/XG5cbiAgICAgICAgc3dpdGNoIChjYW5kaWRhdGVNYXRjaGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIGZhaWxlZE1hcHBpbmdOYW1lcy5wdXNoKCBuYW1lSUQgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgLyogU0tJUFBJTkcgVEhJUyB0byBwcm92aWRlIHVuaWZvcm0gdHJlYXRtZW50IG9mIGFsbCBtYXRjaGVzXG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgLy8gY2hvb3NlIHRoZSBmaXJzdCtvbmx5IG1hdGNoIGF1dG9tYXRpY2FsbHkhXG4gICAgICAgICAgICAgICAgLi4uXG4gICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyBtdWx0aXBsZSBtYXRjaGVzIGZvdW5kLCBvZmZlciBhIGNob2ljZVxuICAgICAgICAgICAgICAgIC8vIEFTU1VNRVMgd2Ugb25seSBnZXQgb25lIHJlc3VsdCBzZXQsIHdpdGggbiBtYXRjaGVzXG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBTb3J0IG1hdGNoZXMgYmFzZWQgb24gZXhhY3QgdGV4dCBtYXRjaGVzPyBmcmFjdGlvbmFsIChtYXRjaGluZykgc2NvcmVzPyBzeW5vbnltcyBvciBob21vbnltcz9cbiAgICAgICAgICAgICAgICAvKiBpbml0aWFsIHNvcnQgb24gbG93ZXIgdGF4YSAod2lsbCBiZSBvdmVycmlkZGVuIGJ5IGV4YWN0IG1hdGNoZXMpXG4gICAgICAgICAgICAgICAgY2FuZGlkYXRlTWF0Y2hlcy5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYS5pc19hcHByb3hpbWF0ZV9tYXRjaCA9PT0gYi5pc19hcHByb3hpbWF0ZV9tYXRjaCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhLmlzX2FwcHJveGltYXRlX21hdGNoKSByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGIuaXNfYXBwcm94aW1hdGVfbWF0Y2gpIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgLyogVE9ETzogSWYgbXVsdGlwbGUgbWF0Y2hlcyBwb2ludCB0byBhIHNpbmdsZSB0YXhvbiwgc2hvdyBqdXN0IHRoZSBcImJlc3RcIiBtYXRjaFxuICAgICAgICAgICAgICAgICAqICAgLSBTcGVsbGluZyBjb3VudHMhIFNob3cgYW4gZXhhY3QgbWF0Y2ggKGUuZy4gc3lub255bSkgdnMuIGluZXhhY3Qgc3BlbGxpbmcuXG4gICAgICAgICAgICAgICAgICogICAtIFRPRE86IGFkZCBtb3JlIHJ1bGVzPyBvciBqdXN0IGNvbW1lbnQgdGhlIGNvZGUgYmVsb3dcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB2YXIgZ2V0UHJlZmVycmVkVGF4b25DYW5kaWRhdGUgPSBmdW5jdGlvbiggY2FuZGlkYXRlQSwgY2FuZGlkYXRlQiApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIHdoaWNoZXZlciBpcyBwcmVmZXJyZWQsIGJhc2VkIG9uIGEgZmV3IGNyaXRlcmlhOlxuICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2hBID0gY2FuZGlkYXRlQS5vcmlnaW5hbE1hdGNoO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2hCID0gY2FuZGlkYXRlQi5vcmlnaW5hbE1hdGNoO1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBvbmUgaXMgdGhlIGV4YWN0IG1hdGNoLCB0aGF0J3MgaWRlYWwgKGJ1dCB1bmxpa2VseSBzaW5jZSBcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIFROUlMgYXBwYXJlbnRseSByZXR1cm5lZCBtdWx0aXBsZSBjYW5kaWRhdGVzKS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaEEuaXNfYXBwcm94aW1hdGVfbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGVBO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFtYXRjaEIuaXNfYXBwcm94aW1hdGVfbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGVCO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3cgdGhlIG1vc3Qgc2ltaWxhciBuYW1lIChvciBzeW5vbnltKSBmb3IgdGhpcyB0YXhvbi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoQS5zY29yZSA+IG1hdGNoQi5zY29yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZUE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZUI7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgZ2V0UHJpb3JNYXRjaGluZ0NhbmRpZGF0ZSA9IGZ1bmN0aW9uKCBvdHRJZCwgcHJpb3JDYW5kaWRhdGVzICkge1xuICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gYW55IG1hdGNoIHdlJ3ZlIGFscmVhZHkgZXhhbWluZWQgZm9yIHRoaXMgdGF4b25cbiAgICAgICAgICAgICAgICAgICAgdmFyIHByaW9yTWF0Y2ggPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2gocHJpb3JDYW5kaWRhdGVzLCBmdW5jdGlvbihpLCBjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYy5vdHRJZCA9PT0gb3R0SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmlvck1hdGNoID0gYztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7ICAvLyB0aGVyZSBzaG91bGQgYmUganVzdCBvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmlvck1hdGNoO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdmFyIHJhd01hdGNoVG9DYW5kaWRhdGUgPSBmdW5jdGlvbiggcmF3LCBuYW1lSUQgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNpbXBsaWZ5IHRoZSBcInJhd1wiIG1hdGNoZXMgcmV0dXJuZWQgYnkgVE5SU1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcmF3LnRheG9uWyd1bmlxdWVfbmFtZSddIHx8IHJhdy50YXhvblsnbmFtZSddLCAgICAgICAvLyBtYXRjaGVkIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIG90dElkOiByYXcudGF4b25bJ290dF9pZCddLCAgICAgLy8gbWF0Y2hlZCBPVFQgaWQgKGFzIG51bWJlciEpXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXhvbm9taWNTb3VyY2VzOiByYXcudGF4b25bJ3RheF9zb3VyY2VzJ10sICAgLy8gXCJ1cHN0cmVhbVwiIHRheG9ub21pZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZXhhY3Q6IGZhbHNlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBib29sZWFuIChpZ25vcmluZyB0aGlzIGZvciBub3cpXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2hpZ2hlcjogZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYm9vbGVhblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVXNlIGZsYWdzIGZvciB0aGlzID8gaGlnaGVyOiAoJC5pbkFycmF5KCdTSUJMSU5HX0hJR0hFUicsIHJlc3VsdFRvTWFwLmZsYWdzKSA9PT0gLTEpID8gZmFsc2UgOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbE1hdGNoOiByYXcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lSUQ6IG5hbWVJRFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlTWFwcGluZ0xpc3QgPSBbIF07XG4gICAgICAgICAgICAgICAgJC5lYWNoKGNhbmRpZGF0ZU1hdGNoZXMsIGZ1bmN0aW9uKGksIG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnZlcnQgdG8gZXhwZWN0ZWQgc3RydWN0dXJlIGZvciBwcm9wb3NlZCBtYXBwaW5nc1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlID0gcmF3TWF0Y2hUb0NhbmRpZGF0ZSggbWF0Y2gsIG5hbWVJRCApO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJpb3JUYXhvbkNhbmRpZGF0ZSA9IGdldFByaW9yTWF0Y2hpbmdDYW5kaWRhdGUoIGNhbmRpZGF0ZS5vdHRJZCwgY2FuZGlkYXRlTWFwcGluZ0xpc3QgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByaW9yVGF4b25DYW5kaWRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmlvclBvc2l0aW9uID0gJC5pbkFycmF5KHByaW9yVGF4b25DYW5kaWRhdGUsIGNhbmRpZGF0ZU1hcHBpbmdMaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmVmZXJyZWRDYW5kaWRhdGUgPSBnZXRQcmVmZXJyZWRUYXhvbkNhbmRpZGF0ZSggY2FuZGlkYXRlLCBwcmlvclRheG9uQ2FuZGlkYXRlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWx0ZXJuYXRlQ2FuZGlkYXRlID0gKHByZWZlcnJlZENhbmRpZGF0ZSA9PT0gY2FuZGlkYXRlKSA/IHByaW9yVGF4b25DYW5kaWRhdGUgOiBjYW5kaWRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aGljaGV2ZXIgb25lIHdhcyBjaG9zZW4gd2lsbCAocmUpdGFrZSB0aGlzIHBsYWNlIGluIG91ciBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FuZGlkYXRlTWFwcGluZ0xpc3Quc3BsaWNlKHByaW9yUG9zaXRpb24sIDEsIHByZWZlcnJlZENhbmRpZGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgb3RoZXIgY2FuZGlkYXRlIHdpbGwgYmUgc3Rhc2hlZCBhcyBhIGNoaWxkLCBpbiBjYXNlIHdlIG5lZWQgaXQgbGF0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnYWx0ZXJuYXRlVGF4b25DYW5kaWRhdGVzJyBpbiBwcmVmZXJyZWRDYW5kaWRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmZXJyZWRDYW5kaWRhdGUuYWx0ZXJuYXRlVGF4b25DYW5kaWRhdGVzLnB1c2goIGFsdGVybmF0ZUNhbmRpZGF0ZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmZXJyZWRDYW5kaWRhdGUuYWx0ZXJuYXRlVGF4b25DYW5kaWRhdGVzID0gWyBhbHRlcm5hdGVDYW5kaWRhdGUgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbmRpZGF0ZU1hcHBpbmdMaXN0LnB1c2goY2FuZGlkYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdmFyIGF1dG9BY2NlcHRhYmxlTWFwcGluZyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGNhbmRpZGF0ZU1hcHBpbmdMaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb25seU1hcHBpbmcgPSBjYW5kaWRhdGVNYXBwaW5nTGlzdFswXTtcbiAgICAgICAgICAgICAgICAgICAgLyogTkIgLSBhdXRvLWFjY2VwdCBpbmNsdWRlcyBzeW5vbnltcyBpZiBleGFjdCBtYXRjaCFcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlNYXBwaW5nLm9yaWdpbmFsTWF0Y2guaXNfc3lub255bSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIC8qIE4uQi4gV2UgbmV2ZXIgcHJlc2VudCB0aGUgc29sZSBtYXBwaW5nIHN1Z2dlc3Rpb24gYXMgYVxuICAgICAgICAgICAgICAgICAgICAgKiB0YXhvbi1uYW1lIGhvbW9ueW0sIHNvIGp1c3QgY29uc2lkZXIgdGhlIG1hdGNoIHNjb3JlIHRvXG4gICAgICAgICAgICAgICAgICAgICAqIGRldGVybWluZSB3aGV0aGVyIGl0J3MgYW4gXCJleGFjdCBtYXRjaFwiLlxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlNYXBwaW5nLm9yaWdpbmFsTWF0Y2guc2NvcmUgPT09IDEuMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0FjY2VwdGFibGVNYXBwaW5nID0gb25seU1hcHBpbmc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGF1dG9BY2NlcHRpbmdFeGFjdE1hdGNoZXMgJiYgYXV0b0FjY2VwdGFibGVNYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFjY2VwdCB0aGUgb2J2aW91cyBjaG9pY2UgKGFuZCBwb3NzaWJseSB1cGRhdGUgVUkpIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgIG1hcE5hbWVUb1RheG9uKCBuYW1lSUQsIGF1dG9BY2NlcHRhYmxlTWFwcGluZywge1BPU1RQT05FX1VJX0NIQU5HRVM6IHRydWV9ICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcG9zdHBvbmUgYWN0dWFsIG1hcHBpbmcgdW50aWwgdXNlciBjaG9vc2VzXG4gICAgICAgICAgICAgICAgICAgIHByb3Bvc2VOYW1lTGFiZWwobmFtZUlELCBjYW5kaWRhdGVNYXBwaW5nTGlzdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudGx5TWFwcGluZ05hbWVzLnJlbW92ZSggbmFtZUlEICk7XG5cbiAgICAgICAgaWYgKHNpbmdsZVRheG9uTWFwcGluZykge1xuICAgICAgICAgICAgc3RvcEF1dG9NYXBwaW5nKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYXV0b01hcHBpbmdJblByb2dyZXNzKCkpIHtcbiAgICAgICAgICAgIC8vIGFmdGVyIGEgYnJpZWYgcGF1c2UsIHRyeSBmb3IgdGhlIG5leHQgYXZhaWxhYmxlIG5hbWUuLi5cbiAgICAgICAgICAgIHNldFRpbWVvdXQocmVxdWVzdFRheG9uTWFwcGluZywgMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBUTlJTUXVlcnlBbmRDYWNoZUtleSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgXCJuYW1lc1wiOiBbc2VhcmNoVGV4dF0sXG4gICAgICAgIFwiaW5jbHVkZV9zdXBwcmVzc2VkXCI6IGZhbHNlLFxuICAgICAgICBcImRvX2FwcHJveGltYXRlX21hdGNoaW5nXCI6IChzaW5nbGVUYXhvbk1hcHBpbmcgfHwgdXNpbmdGdXp6eU1hdGNoaW5nKSA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgXCJjb250ZXh0X25hbWVcIjogc2VhcmNoQ29udGV4dE5hbWVcbiAgICB9KTtcblxuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogZG9UTlJTRm9yTWFwcGluZ09UVXNfdXJsLCAgLy8gTk9URSB0aGF0IGFjdHVhbCBzZXJ2ZXItc2lkZSBtZXRob2QgbmFtZSBtaWdodCBiZSBxdWl0ZSBkaWZmZXJlbnQhXG4gICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgZGF0YTogVE5SU1F1ZXJ5QW5kQ2FjaGVLZXksICAvLyBkYXRhIChhc3RlcmlzayByZXF1aXJlZCBmb3IgY29tcGxldGlvbiBzdWdnZXN0aW9ucylcbiAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgICAgICAgYmVmb3JlU2VuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gY2hlY2sgb3VyIGxvY2FsIGNhY2hlIHRvIHNlZSBpZiB0aGlzIGlzIGEgcmVwZWF0XG4gICAgICAgICAgICB2YXIgY2FjaGVkUmVzcG9uc2UgPSBUTlJTQ2FjaGVbIFROUlNRdWVyeUFuZENhY2hlS2V5IF07XG4gICAgICAgICAgICBpZiAoY2FjaGVkUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB0bnJzU3VjY2VzcyggY2FjaGVkUmVzcG9uc2UgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIiEhISBzb21ldGhpbnkgd2VudCB0ZXJyaWJseSB3cm9uZ1wiKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGpxWEhSLnJlc3BvbnNlVGV4dCk7XG5cbiAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UoXCJTb21ldGhpbmcgd2VudCB3cm9uZyBpbiB0YXhvbWFjaGluZTpcXG5cIisganFYSFIucmVzcG9uc2VUZXh0KTtcblxuICAgICAgICAgICAgaWYgKCFhdXRvTWFwcGluZ0luUHJvZ3Jlc3MoKSkge1xuICAgICAgICAgICAgICAgIC8vIGN1cmF0b3IgaGFzIHBhdXNlZCBhbGwgbWFwcGluZ1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VycmVudGx5TWFwcGluZ05hbWVzLnJlbW92ZSggbmFtZUlEICk7XG5cbiAgICAgICAgICAgIC8vIGxldCdzIGhvcGUgaXQncyBzb21ldGhpbmcgYWJvdXQgdGhpcyBsYWJlbCBhbmQgdHJ5IHRoZSBuZXh0IG9uZS4uLlxuICAgICAgICAgICAgZmFpbGVkTWFwcGluZ05hbWVzLnB1c2goIG5hbWVJRCApO1xuICAgICAgICAgICAgaWYgKHNpbmdsZVRheG9uTWFwcGluZykge1xuICAgICAgICAgICAgICAgIHN0b3BBdXRvTWFwcGluZygpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhdXRvTWFwcGluZ0luUHJvZ3Jlc3MoKSkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQocmVxdWVzdFRheG9uTWFwcGluZywgMTAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAvLyBhZGQgdGhpcyByZXNwb25zZSB0byB0aGUgbG9jYWwgY2FjaGVcbiAgICAgICAgICAgIGFkZFRvVE5SU0NhY2hlKCBUTlJTUXVlcnlBbmRDYWNoZUtleSwgZGF0YSApO1xuICAgICAgICAgICAgdG5yc1N1Y2Nlc3MoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZUJ5SUQoaWQpIHtcbiAgICAvLyByZXR1cm4gdGhlIG1hdGNoaW5nIG90dSwgb3IgbnVsbCBpZiBub3QgZm91bmRcbiAgICB2YXIgbWF0Y2hpbmdOYW1lID0gbnVsbDtcbiAgICAkLmVhY2goIHZpZXdNb2RlbC5uYW1lcygpLCBmdW5jdGlvbihpLCBuYW1lKSB7XG4gICAgICAgIGlmIChuYW1lLmlkID09PSBpZCkgeyAgXG4gICAgICAgICAgICBtYXRjaGluZ05hbWUgPSBuYW1lO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG1hdGNoaW5nTmFtZTtcbiAgICAvKiBUT0RPOiBpZiBwZXJmb3JtYW5jZSBzdWZmZXJzLCB1c2UgZmFzdCBsb29rdXAhXG4gICAgdmFyIGxvb2t1cCA9IGdldEZhc3RMb29rdXAoJ05BTUVTX0JZX0lEJyk7XG4gICAgcmV0dXJuIGxvb2t1cFsgaWQgXSB8fCBudWxsO1xuICAgICovXG59XG5cblxuZnVuY3Rpb24gbWFwTmFtZVRvVGF4b24oIG5hbWVJRCwgbWFwcGluZ0luZm8sIG9wdGlvbnMgKSB7XG4gICAgLyogQXBwbHkgdGhpcyBtYXBwaW5nLCBjcmVhdGluZyBOZXhzb24gZWxlbWVudHMgYXMgbmVlZGVkXG4gICAgICpcbiAgICAgKiBtYXBwaW5nSW5mbyBzaG91bGQgYmUgYW4gb2JqZWN0IHdpdGggdGhlc2UgcHJvcGVydGllczpcbiAgICAgKiB7XG4gICAgICogICBcIm5hbWVcIiA6IFwiQ2VudHJhbnRodXNcIixcbiAgICAgKiAgIFwib3R0SWRcIiA6IFwiNzU5MDQ2XCIsXG4gICAgICpcbiAgICAgKiAgIC8vIHRoZXNlIG1heSBhbHNvIGJlIHByZXNlbnQsIGJ1dCBhcmVuJ3QgaW1wb3J0YW50IGhlcmVcbiAgICAgKiAgICAgXCJleGFjdFwiIDogZmFsc2UsXG4gICAgICogICAgIFwiaGlnaGVyXCIgOiB0cnVlXG4gICAgICogfVxuICAgICAqXG4gICAgICogTi5CLiBXZSAqYWx3YXlzKiBhZGQvY2hhbmdlL3JlbW92ZSB0aGVzZSBwcm9wZXJ0aWVzIGluIHRhbmRlbSFcbiAgICAgKiAgICBvdHRJZFxuICAgICAqICAgIG90dFRheG9uTmFtZVxuICAgICAqICAgIHRheG9ub21pY1NvdXJjZXNcbiAgICAgKi9cblxuICAgIC8vIElmIG9wdGlvbnMuUE9TVFBPTkVfVUlfQ0hBTkdFUywgcGxlYXNlIGRvIHNvIChlbHNlIHdlIGNyYXdsIHdoZW5cbiAgICAvLyBhcHByb3ZpbmcgaHVuZHJlZHMgb2YgbWFwcGluZ3MpXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBGT1IgTk9XLCBhc3N1bWUgdGhhdCBhbnkgbGVhZiBub2RlIHdpbGwgaGF2ZSBhIGNvcnJlc3BvbmRpbmcgb3R1IGVudHJ5O1xuICAgIC8vIG90aGVyd2lzZSwgd2UgY2FuJ3QgaGF2ZSBuYW1lIGZvciB0aGUgbm9kZSFcbiAgICB2YXIgbmFtZSA9IGdldE5hbWVCeUlEKCBuYW1lSUQgKTtcblxuICAgIC8vIERlLXNlbGVjdCB0aGlzIG5hbWUgaW4gdGhlIG1hcHBpbmcgVUlcbiAgICBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddID0gZmFsc2U7XG5cbiAgICAvLyBhZGQgKG9yIHVwZGF0ZSkgYSBtZXRhdGFnIG1hcHBpbmcgdGhpcyB0byBhbiBPVFQgaWRcbiAgICBuYW1lWydvdHRJZCddID0gTnVtYmVyKG1hcHBpbmdJbmZvLm90dElkKTtcblxuICAgIC8vIEFkZC91cGRhdGUgdGhlIE9UVCBuYW1lIChjYWNoZWQgaGVyZSBmb3IgcGVyZm9ybWFuY2UpXG4gICAgbmFtZVsnb3R0VGF4b25OYW1lJ10gPSBtYXBwaW5nSW5mby5uYW1lIHx8ICdPVFQgTkFNRSBNSVNTSU5HISc7XG4gICAgLy8gTi5CLiBXZSBhbHdheXMgcHJlc2VydmUgb3JpZ2luYWxMYWJlbCBmb3IgcmVmZXJlbmNlXG5cbiAgICAvLyBhZGQgXCJ1cHN0cmVhbVwiIHRheG9ub21pYyBzb3VyY2VzXG4gICAgbmFtZVsndGF4b25vbWljU291cmNlcyddID0gbWFwcGluZ0luZm8udGF4b25vbWljU291cmNlcyB8fCAnVEFYT05PTUlDIFNPVVJDRVMgTUlTU0lORyEnO1xuXG4gICAgLy8gQ2xlYXIgYW55IHByb3Bvc2VkL2FkanVzdGVkIGxhYmVsICh0aGlzIGlzIHRydW1wZWQgYnkgbWFwcGluZyB0byBPVFQpXG4gICAgZGVsZXRlIG5hbWVbJ2FkanVzdGVkTGFiZWwnXTtcblxuICAgIGlmICghb3B0aW9ucy5QT1NUUE9ORV9VSV9DSEFOR0VTKSB7XG4gICAgICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB1bm1hcE5hbWVGcm9tVGF4b24oIG5hbWVPcklELCBvcHRpb25zICkge1xuICAgIC8vIHJlbW92ZSB0aGlzIG1hcHBpbmcsIHJlbW92aW5nIGFueSB1bm5lZWRlZCBOZXhzb24gZWxlbWVudHNcblxuICAgIC8vIElmIG9wdGlvbnMuUE9TVFBPTkVfVUlfQ0hBTkdFUywgcGxlYXNlIGRvIHNvIChlbHNlIHdlIGNyYXdsIHdoZW5cbiAgICAvLyBjbGVhcmluZyBodW5kcmVkcyBvZiBtYXBwaW5ncylcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHZhciBuYW1lID0gKHR5cGVvZiBuYW1lT3JJRCA9PT0gJ29iamVjdCcpID8gbmFtZU9ySUQgOiBnZXROYW1lQnlJRCggbmFtZU9ySUQgKTtcbiAgICAvLyByZXN0b3JlIGl0cyBvcmlnaW5hbCBsYWJlbCAodmVyc3VzIG1hcHBlZCBsYWJlbClcbiAgICB2YXIgb3JpZ2luYWxMYWJlbCA9IG5hbWVbJ29yaWdpbmFsTGFiZWwnXTtcblxuICAgIC8vIHN0cmlwIGFueSBtZXRhdGFnIG1hcHBpbmcgdGhpcyB0byBhbiBPVFQgaWRcbiAgICBpZiAoJ290dElkJyBpbiBuYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBuYW1lWydvdHRJZCddO1xuICAgIH1cbiAgICBpZiAoJ290dFRheG9uTmFtZScgaW4gbmFtZSkge1xuICAgICAgICBkZWxldGUgbmFtZVsnb3R0VGF4b25OYW1lJ107XG4gICAgfVxuICAgIGlmICgndGF4b25vbWljU291cmNlcycgaW4gbmFtZSkge1xuICAgICAgICBkZWxldGUgbmFtZVsndGF4b25vbWljU291cmNlcyddO1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy5QT1NUUE9ORV9VSV9DSEFOR0VTKSB7XG4gICAgICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG4gICAgICAgIG51ZGdlVGlja2xlcignVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhZGRNZXRhVGFnVG9QYXJlbnQoIHBhcmVudCwgcHJvcHMgKSB7XG4gICAgLy8gd3JhcCBzdWJtaXR0ZWQgcHJvcGVydGllcyB0byBtYWtlIGFuIG9ic2VydmFibGUgbWV0YXRhZ1xuICAgIHZhciBuZXdUYWcgPSBjbG9uZUZyb21TaW1wbGVPYmplY3QoIHByb3BzICk7XG4gICAgaWYgKCFwYXJlbnQubWV0YSkge1xuICAgICAgICAvLyBhZGQgYSBtZXRhIGNvbGxlY3Rpb24gaGVyZVxuICAgICAgICBwYXJlbnRbJ21ldGEnXSA9IFsgXTtcbiAgICB9IGVsc2UgaWYgKCEkLmlzQXJyYXkocGFyZW50Lm1ldGEpKSB7XG4gICAgICAgIC8vIGNvbnZlcnQgYSBCYWRnZXJmaXNoIFwic2luZ2xldG9uXCIgdG8gYSBwcm9wZXIgYXJyYXlcbiAgICAgICAgcGFyZW50WydtZXRhJ10gPSBbIHBhcmVudC5tZXRhIF07XG4gICAgfVxuICAgIHBhcmVudC5tZXRhLnB1c2goIG5ld1RhZyApO1xufVxuXG5cbmZ1bmN0aW9uIGNsZWFyU2VsZWN0ZWRNYXBwaW5ncygpIHtcbiAgICAvLyBURU1QT1JBUlkgaGVscGVyIHRvIGRlbW8gbWFwcGluZyB0b29scywgY2xlYXJzIG1hcHBpbmcgZm9yIHRoZSB2aXNpYmxlIChwYWdlZCkgbmFtZXMuXG4gICAgdmFyIHZpc2libGVOYW1lcyA9IHZpZXdNb2RlbC5maWx0ZXJlZE5hbWVzKCkucGFnZWRJdGVtcygpO1xuICAgICQuZWFjaCggdmlzaWJsZU5hbWVzLCBmdW5jdGlvbiAoaSwgbmFtZSkge1xuICAgICAgICBpZiAobmFtZVsnc2VsZWN0ZWRGb3JBY3Rpb24nXSkge1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IFwiZXN0YWJsaXNoZWRcIiBtYXBwaW5nIChhbHJlYWR5IGFwcHJvdmVkKVxuICAgICAgICAgICAgdW5tYXBOYW1lRnJvbVRheG9uKCBuYW1lLCB7UE9TVFBPTkVfVUlfQ0hBTkdFUzogdHJ1ZX0gKTtcbiAgICAgICAgICAgIC8vIGNsZWFyIGFueSBwcm9wb3NlZCBtYXBwaW5nXG4gICAgICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZVsnaWQnXSBdO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgY2xlYXJGYWlsZWROYW1lTGlzdCgpO1xuICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNsZWFyQWxsTWFwcGluZ3MoKSB7XG4gICAgdmFyIGFsbE5hbWVzID0gdmlld01vZGVsLm5hbWVzKCk7XG4gICAgaWYgKGF3YWl0IGFzeW5jQ29uZmlybShcIldBUk5JTkc6IFRoaXMgd2lsbCB1bi1tYXAgYWxsIFwiKyBhbGxOYW1lcy5sZW5ndGggK1wiIG5hbWVzIGluIHRoZSBjdXJyZW50IHN0dWR5ISBBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZG8gdGhpcz9cIikpIHtcbiAgICAgICAgLy8gVEVNUE9SQVJZIGhlbHBlciB0byBkZW1vIG1hcHBpbmcgdG9vbHMsIGNsZWFycyBtYXBwaW5nIGZvciB0aGUgdmlzaWJsZSAocGFnZWQpIG5hbWVzLlxuICAgICAgICAkLmVhY2goIGFsbE5hbWVzLCBmdW5jdGlvbiAoaSwgbmFtZSkge1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IFwiZXN0YWJsaXNoZWRcIiBtYXBwaW5nIChhbHJlYWR5IGFwcHJvdmVkKVxuICAgICAgICAgICAgdW5tYXBOYW1lRnJvbVRheG9uKCBuYW1lLCB7UE9TVFBPTkVfVUlfQ0hBTkdFUzogdHJ1ZX0gKTtcbiAgICAgICAgICAgIC8vIGNsZWFyIGFueSBwcm9wb3NlZCBtYXBwaW5nXG4gICAgICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZVsnaWQnXSBdO1xuICAgICAgICB9KTtcbiAgICAgICAgY2xlYXJGYWlsZWROYW1lTGlzdCgpO1xuICAgICAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICB9XG59XG5cbi8qIEVORCBjb252ZXJ0ICdPVFUnIHRvICduYW1lJyB0aHJvdWdob3V0PyAqL1xuXG5cblxuXG5cblxuXG5cblxuXG4vKiBEZWZpbmUgYSByZWdpc3RyeSBvZiBudWRnZSBtZXRob2RzLCBmb3IgdXNlIGluIEtPIGRhdGEgYmluZGluZ3MuIENhbGxpbmdcbiAqIGEgbnVkZ2UgZnVuY3Rpb24gd2lsbCB1cGRhdGUgb25lIG9yIG1vcmUgb2JzZXJ2YWJsZXMgdG8gdHJpZ2dlciB1cGRhdGVzXG4gKiBpbiB0aGUgY3VyYXRpb24gVUkuIFRoaXMgYXBwcm9hY2ggYWxsb3dzIHVzIHRvIHdvcmsgd2l0aG91dCBvYnNlcnZhYmxlcyxcbiAqIHdoaWNoIGluIHR1cm4gbWVhbnMgd2UgY2FuIGVkaXQgZW5vcm1vdXMgdmlld21vZGVscy5cbiAqL1xudmFyIG51ZGdlID0ge1xuICAgICdNRVRBREFUQSc6IGZ1bmN0aW9uKCBkYXRhLCBldmVudCApIHtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCAnTUVUQURBVEEnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAnVklTSUJMRV9OQU1FX01BUFBJTkdTJzogZnVuY3Rpb24oIGRhdGEsIGV2ZW50ICkge1xuICAgICAgICBudWRnZVRpY2tsZXIoICdWSVNJQkxFX05BTUVfTUFQUElOR1MnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAnTkFNRV9NQVBQSU5HX0hJTlRTJzogZnVuY3Rpb24oIGRhdGEsIGV2ZW50ICkge1xuICAgICAgICBudWRnZVRpY2tsZXIoICdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAnSU5QVVRfRklMRVMnOiBmdW5jdGlvbiggZGF0YSwgZXZlbnQgKSB7XG4gICAgICAgIG51ZGdlVGlja2xlciggJ0lOUFVUX0ZJTEVTJyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyBUT0RPOiBBZGQgbW9yZSBmb3IgYW55IHRpY2tsZXJzIGFkZGVkIGJlbG93XG59XG5mdW5jdGlvbiBudWRnZVRpY2tsZXIoIG5hbWUgKSB7XG4gICAgaWYgKG5hbWUgPT09ICdBTEwnKSB7XG4gICAgICAgIGZvciAodmFyIGFOYW1lIGluIHZpZXdNb2RlbC50aWNrbGVycykge1xuICAgICAgICAgICAgbnVkZ2VUaWNrbGVyKCBhTmFtZSApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgdGlja2xlciA9IHZpZXdNb2RlbC50aWNrbGVyc1sgbmFtZSBdO1xuICAgIGlmICghdGlja2xlcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTm8gc3VjaCB0aWNrbGVyOiAnXCIrIG5hbWUgK1wiJyFcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG9sZFZhbHVlID0gdGlja2xlci5wZWVrKCk7XG4gICAgdGlja2xlciggb2xkVmFsdWUgKyAxICk7XG5cbiAgICAvLyBpZiB0aGlzIHJlZmxlY3RzIGNoYW5nZXMgdG8gdGhlIHN0dWR5LCBudWRnZSB0aGUgbWFpbiAnZGlydHkgZmxhZycgdGlja2xlclxuICAgIGlmIChuYW1lICE9PSAnQ09MTEVDVElPTlNfTElTVCcpIHtcbiAgICAgICAgdmlld01vZGVsLnRpY2tsZXJzLk5BTUVTRVRfSEFTX0NIQU5HRUQoIHZpZXdNb2RlbC50aWNrbGVycy5OQU1FU0VUX0hBU19DSEFOR0VELnBlZWsoKSArIDEgKTtcbiAgICAgICAgY29uc29sZS53YXJuKCdOQU1FU0VUX0hBU19DSEFOR0VEJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG93TmFtZXNldE1ldGFkYXRhKCkge1xuICAgICQoJyNuYW1lc2V0LW1ldGFkYXRhLXByb21wdCcpLmhpZGUoKTtcbiAgICAkKCcjbmFtZXNldC1tZXRhZGF0YS1wYW5lbCcpLnNob3coKTtcbn1cbmZ1bmN0aW9uIGhpZGVOYW1lc2V0TWV0YWRhdGEoKSB7XG4gICAgJCgnI25hbWVzZXQtbWV0YWRhdGEtcGFuZWwnKS5oaWRlKCk7XG4gICAgJCgnI25hbWVzZXQtbWV0YWRhdGEtcHJvbXB0Jykuc2hvdygpO1xufVxuXG5mdW5jdGlvbiBzaG93TWFwcGluZ09wdGlvbnMoKSB7XG4gICAgJCgnI21hcHBpbmctb3B0aW9ucy1wcm9tcHQnKS5oaWRlKCk7XG4gICAgJCgnI21hcHBpbmctb3B0aW9ucy1wYW5lbCcpLnNob3coKTtcbn1cbmZ1bmN0aW9uIGhpZGVNYXBwaW5nT3B0aW9ucygpIHtcbiAgICAkKCcjbWFwcGluZy1vcHRpb25zLXBhbmVsJykuaGlkZSgpO1xuICAgICQoJyNtYXBwaW5nLW9wdGlvbnMtcHJvbXB0Jykuc2hvdygpO1xufVxuXG5mdW5jdGlvbiBkaXNhYmxlU2F2ZUJ1dHRvbigpIHtcbiAgICB2YXIgJGJ0biA9ICQoJyNzYXZlLW5hbWVzZXQtYnV0dG9uJyk7XG4gICAgJGJ0bi5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAkYnRuLnVuYmluZCgnY2xpY2snKS5jbGljayhmdW5jdGlvbihldnQpIHtcbiAgICAgICAgc2hvd0luZm9NZXNzYWdlKCdUaGVyZSBhcmUgbm8gdW5zYXZlZCBjaGFuZ2VzLicpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBlbmFibGVTYXZlQnV0dG9uKCkge1xuICAgIHZhciAkYnRuID0gJCgnI3NhdmUtbmFtZXNldC1idXR0b24nKTtcbiAgICAkYnRuLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICRidG4udW5iaW5kKCdjbGljaycpLmNsaWNrKGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICBpZiAoYnJvd3NlclN1cHBvcnRzRmlsZUFQSSgpKSB7XG4gICAgICAgICAgICBzaG93U2F2ZU5hbWVzZXRQb3B1cCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXN5bmNBbGVydChcIlNvcnJ5LCB0aGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBzYXZpbmcgdG8gYSBsb2NhbCBmaWxlIVwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNob3dMb2FkTGlzdFBvcHVwKCApIHtcbiAgICBzaG93RmlsZXN5c3RlbVBvcHVwKCcjbG9hZC1saXN0LXBvcHVwJyk7XG59XG5mdW5jdGlvbiBzaG93TG9hZE5hbWVzZXRQb3B1cCggKSB7XG4gICAgJCgnI2xvYWQtbmFtZXNldC1wb3B1cCcpLm9mZignaGlkZScpLm9uKCdoaWRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoY29udGV4dCA9PT0gJ1NUVURZX09UVV9NQVBQSU5HJykge1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IHByaW9yIHNlYXJjaCBpbnB1dFxuICAgICAgICAgICAgY2xlYXJOYW1lc2V0VXBsb2FkV2lkZ2V0KCk7XG4gICAgICAgICAgICBjbGVhck5hbWVzZXRQYXN0ZWRUZXh0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBzaG93RmlsZXN5c3RlbVBvcHVwKCcjbG9hZC1uYW1lc2V0LXBvcHVwJyk7XG59XG5mdW5jdGlvbiBzaG93U2F2ZU5hbWVzZXRQb3B1cCggKSB7XG4gICAgc2hvd0ZpbGVzeXN0ZW1Qb3B1cCgnI3NhdmUtbmFtZXNldC1wb3B1cCcpO1xufVxuZnVuY3Rpb24gc2hvd0ZpbGVzeXN0ZW1Qb3B1cCggcG9wdXBTZWxlY3RvciApIHtcbiAgICAvLyBleHBlY3RzIGEgdmFsaWQgalF1ZXJ5IHNlbGVjdG9yIGZvciB0aGUgcG9wdXAgaW4gRE9NXG4gICAgdmFyICRwb3B1cCA9ICQocG9wdXBTZWxlY3Rvcik7XG4gICAgJHBvcHVwLm1vZGFsKCdzaG93Jyk7XG5cbiAgICAvLyAocmUpYmluZCBVSSB3aXRoIEtub2Nrb3V0XG4gICAgdmFyICRib3VuZEVsZW1lbnRzID0gJHBvcHVwLmZpbmQoJy5tb2RhbC1ib2R5Jyk7IC8vIGFkZCBvdGhlciBlbGVtZW50cz9cbiAgICAkLmVhY2goJGJvdW5kRWxlbWVudHMsIGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICAgIGtvLmNsZWFuTm9kZShlbCk7XG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3Moe30sZWwpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRNYXBwZWROYW1lc1RhbGx5KCkge1xuICAgIC8vIHJldHVybiBkaXNwbGF5LXJlYWR5IHRhbGx5IChtYXBwZWQvdG90YWwgcmF0aW8gYW5kIHBlcmNlbnRhZ2UpXG4gICAgdmFyIHRoaW5TcGFjZSA9ICcmIzgyMDE7JztcbiAgICBpZiAoIXZpZXdNb2RlbCB8fCAhdmlld01vZGVsLm5hbWVzIHx8IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gJzxzdHJvbmc+MDwvc3Ryb25nPjxzcGFuPicrIHRoaW5TcGFjZSArJy8nKyB0aGluU3BhY2UgKyAnMCAmbmJzcDs8L3NwYW4+PHNwYW4gc3R5bGU9XCJjb2xvcjogIzk5OTtcIj4oMCUpPC9zcGFuPic7XG4gICAgfVxuICAgIHZhciB0b3RhbE5hbWVDb3VudCA9IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aDtcbiAgICB2YXIgbWFwcGVkTmFtZUNvdW50ID0gJC5ncmVwKHZpZXdNb2RlbC5uYW1lcygpLCBmdW5jdGlvbihuYW1lLCBpKSB7XG4gICAgICAgIHJldHVybiAoIW5hbWUub3R0SWQpID8gZmFsc2U6IHRydWU7XG4gICAgfSkubGVuZ3RoO1xuICAgIHJldHVybiAnPHN0cm9uZz4nKyBtYXBwZWROYW1lQ291bnQgKyc8L3N0cm9uZz48c3Bhbj4nKyB0aGluU3BhY2UgKycvJysgdGhpblNwYWNlICsgdG90YWxOYW1lQ291bnQgKycgJm5ic3A7PC9zcGFuPjxzcGFuIHN0eWxlPVwiY29sb3I6ICM5OTk7XCI+KCcrIGZsb2F0VG9QZXJjZW50KG1hcHBlZE5hbWVDb3VudCAvIHRvdGFsTmFtZUNvdW50KSArJyUpPC9zcGFuPic7XG59XG5mdW5jdGlvbiBtYXBwaW5nUHJvZ3Jlc3NBc1BlcmNlbnQoKSB7XG4gICAgaWYgKCF2aWV3TW9kZWwgfHwgIXZpZXdNb2RlbC5uYW1lcyB8fCB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciB0b3RhbE5hbWVDb3VudCA9IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aDtcbiAgICB2YXIgbWFwcGVkTmFtZUNvdW50ID0gJC5ncmVwKCB2aWV3TW9kZWwubmFtZXMoKSwgZnVuY3Rpb24obmFtZSwgaSkge1xuICAgICAgICByZXR1cm4gKCFuYW1lLm90dElkKSA/IGZhbHNlOiB0cnVlO1xuICAgIH0pLmxlbmd0aDtcbiAgICByZXR1cm4gZmxvYXRUb1BlcmNlbnQobWFwcGVkTmFtZUNvdW50IC8gdG90YWxOYW1lQ291bnQpO1xufVxuZnVuY3Rpb24gZmxvYXRUb1BlcmNlbnQoIGRlYyApIHtcbiAgICAvLyBhc3N1bWVzIGEgZmxvYXQgYmV0d2VlbiAwLjAgYW5kIDEuMFxuICAgIC8vIEVYQU1QTEU6IDAuMjMyID09PiAyMyVcbiAgICByZXR1cm4gTWF0aC5yb3VuZChkZWMgKiAxMDApO1xufVxuXG5mdW5jdGlvbiBicm93c2VyU3VwcG9ydHNGaWxlQVBJKCkge1xuICAgIC8vIENhbiBsb2FkIGFuZCBtYW5pcHVsYXRlIGxvY2FsIGZpbGVzIGluIHRoaXMgYnJvd3Nlcj9cbiAgICByZXR1cm4gKHdpbmRvdy5GaWxlICYmIFxuICAgICAgICAgICAgd2luZG93LkZpbGVSZWFkZXIgJiYgXG4gICAgICAgICAgICB3aW5kb3cuRmlsZUxpc3QgJiYgXG4gICAgICAgICAgICB3aW5kb3cuQmxvYikgPyB0cnVlIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGFkZFN1YnN0aXR1dGlvbiggY2xpY2tlZCApIHtcbiAgICB2YXIgc3Vic3QgPSBrby5tYXBwaW5nLmZyb21KUyh7XG4gICAgICAgICdvbGQnOiBcIlwiLFxuICAgICAgICAnbmV3JzogXCJcIixcbiAgICAgICAgJ2FjdGl2ZSc6IHRydWUsXG4gICAgICAgICd2YWxpZCc6IHRydWVcbiAgICB9KTtcblxuICAgIGlmICgkKGNsaWNrZWQpLmlzKCdzZWxlY3QnKSkge1xuICAgICAgICB2YXIgY2hvc2VuU3ViID0gJChjbGlja2VkKS52YWwoKTtcbiAgICAgICAgaWYgKGNob3NlblN1YiA9PT0gJycpIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmcsIHdlJ3JlIHN0aWxsIGF0IHRoZSBwcm9tcHRcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBhZGQgdGhlIGNob3NlbiBzdWJzaXR1dGlvblxuICAgICAgICB2YXIgcGFydHMgPSBjaG9zZW5TdWIuc3BsaXQoJyA9Oj0gJyk7XG4gICAgICAgIHN1YnN0Lm9sZCggcGFydHNbMF0gfHwgJycgKTtcbiAgICAgICAgc3Vic3QubmV3KCBwYXJ0c1sxXSB8fCAnJyApO1xuICAgICAgICBzdWJzdC52YWxpZCh0cnVlKTtcbiAgICAgICAgc3Vic3QuYWN0aXZlKHRydWUpO1xuICAgICAgICAvLyByZXNldCB0aGUgU0VMRUNUIHdpZGdldCB0byBpdHMgcHJvbXB0XG4gICAgICAgICQoY2xpY2tlZCkudmFsKCcnKTtcbiAgICB9XG4gICAgdmlld01vZGVsLm1hcHBpbmdIaW50cy5zdWJzdGl0dXRpb25zLnB1c2goc3Vic3QpO1xuICAgIGNsZWFyRmFpbGVkTmFtZUxpc3QoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xufVxuZnVuY3Rpb24gcmVtb3ZlU3Vic3RpdHV0aW9uKCBkYXRhICkge1xuICAgIHZhciBzdWJMaXN0ID0gdmlld01vZGVsLm1hcHBpbmdIaW50cy5zdWJzdGl0dXRpb25zKCk7XG4gICAgcmVtb3ZlRnJvbUFycmF5KCBkYXRhLCBzdWJMaXN0ICk7XG4gICAgaWYgKHN1Ykxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIGFkZCBhbiBpbmFjdGl2ZSBzdWJzdGl0dXRpb24gd2l0aCBwcm9tcHRzXG4gICAgICAgIGFkZFN1YnN0aXR1dGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNsZWFyRmFpbGVkTmFtZUxpc3QoKTtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVNYXBwaW5nSGludHMoIGRhdGEgKSB7XG4gICAgLy8gYWZ0ZXItZWZmZWN0cyBvZiBjaGFuZ2VzIHRvIHNlYXJjaCBjb250ZXh0IG9yIGFueSBzdWJzdGl0dXRpb25cbiAgICBjbGVhckZhaWxlZE5hbWVMaXN0KCk7XG4gICAgYWRqdXN0ZWRMYWJlbChcIlRFU1RcIik7ICAgLy8gdmFsaWRhdGUgYWxsIHN1YnN0aXR1dGlvbnNcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBnZXRBdHRyc0Zvck1hcHBpbmdPcHRpb24oIG9wdGlvbkRhdGEsIG51bU9wdGlvbnMgKSB7XG4gICAgdmFyIGF0dHJzID0ge1xuICAgICAgICAndGl0bGUnOiBwYXJzZUludChvcHRpb25EYXRhLm9yaWdpbmFsTWF0Y2guc2NvcmUgKiAxMDApICtcIiUgbWF0Y2ggb2Ygb3JpZ2luYWwgbGFiZWxcIixcbiAgICAgICAgJ2NsYXNzJzogXCJiYWRnZSBcIixcbiAgICAgICAgJ3N0eWxlJzogKFwib3BhY2l0eTogXCIrIG1hdGNoU2NvcmVUb09wYWNpdHkob3B0aW9uRGF0YS5vcmlnaW5hbE1hdGNoLnNjb3JlKSArXCI7XCIpXG4gICAgfVxuICAgIC8vIGZvciBub3csIHVzZSBzdGFuZGFyZCBjb2xvcnMgdGhhdCB3aWxsIHN0aWxsIHBvcCBmb3IgY29sb3ItYmxpbmQgdXNlcnNcbiAgICBpZiAob3B0aW9uRGF0YS5vcmlnaW5hbE1hdGNoLmlzX3N5bm9ueW0pIHtcbiAgICAgICAgYXR0cnMudGl0bGUgPSAoJ01hdGNoZWQgb24gc3lub255bSAnKyBvcHRpb25EYXRhLm9yaWdpbmFsTWF0Y2gubWF0Y2hlZF9uYW1lKTtcbiAgICAgICAgYXR0cnMuY2xhc3MgKz0gJyBiYWRnZS1pbmZvJztcbiAgICB9IGVsc2UgaWYgKChudW1PcHRpb25zID4gMSkgJiYgKG9wdGlvbkRhdGEub3JpZ2luYWxNYXRjaC5tYXRjaGVkX25hbWUgIT09IG9wdGlvbkRhdGEub3JpZ2luYWxNYXRjaC50YXhvbi51bmlxdWVfbmFtZSkpIHtcbiAgICAgICAgLy8gTGV0J3MgYXNzdW1lIGEgc2luZ2xlIHJlc3VsdCBpcyB0aGUgcmlnaHQgYW5zd2VyXG4gICAgICAgIGF0dHJzLnRpdGxlID0gKCdUYXhvbi1uYW1lIGhvbW9ueW0nKTtcbiAgICAgICAgYXR0cnMuY2xhc3MgKz0gJyBiYWRnZS13YXJuaW5nJztcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBrZWVwIGRlZmF1bHQgbGFiZWwgd2l0aCBtYXRjaGluZyBzY29yZVxuICAgICAgICBhdHRycy5jbGFzcyArPSAnIGJhZGdlLXN1Y2Nlc3MnO1xuICAgIH1cbiAgICAvLyBlYWNoIHNob3VsZCBhbHNvIGxpbmsgdG8gdGhlIHRheG9ub215IGJyb3dzZXJcbiAgICBhdHRycy5ocmVmID0gZ2V0VGF4b2Jyb3dzZXJVUkwob3B0aW9uRGF0YVsnb3R0SWQnXSk7XG4gICAgYXR0cnMudGFyZ2V0ID0gJ19ibGFuayc7XG4gICAgYXR0cnMudGl0bGUgKz0gJyAoY2xpY2sgZm9yIG1vcmUgaW5mb3JtYXRpb24pJ1xuICAgIHJldHVybiBhdHRycztcbn1cbmZ1bmN0aW9uIG1hdGNoU2NvcmVUb09wYWNpdHkoc2NvcmUpIHtcbiAgICAvKiBSZW1hcCBzY29yZXMgKGdlbmVyYWxseSBmcm9tIDAuNzUgdG8gMS4wLCBidXQgMC4xIGlzIHBvc3NpYmxlISkgdG8gYmUgbW9yZSB2aXNpYmxlXG4gICAgICogVGhpcyBpcyBiZXN0IGFjY29tcGxpc2hlZCBieSByZW1hcHBpbmcgdG8gYSBjdXJ2ZSwgZS5nLlxuICAgICAqICAgT1BBQ0lUWSA9IFNDT1JFXjIgKyAwLjE1XG4gICAgICogICBPUEFDSVRZID0gMC44ICogU0NPUkVeMiArIDAuMlxuICAgICAqICAgT1BBQ0lUWSA9IDAuOCAqIFNDT1JFICsgMC4yXG4gICAgICogVGhlIGVmZmVjdCB3ZSB3YW50IGlzIGZ1bGwgb3BhY2l0eSAoMS4wKSBmb3IgYSAxLjAgc2NvcmUsIGZhZGluZyByYXBpZGx5XG4gICAgICogZm9yIHRoZSBjb21tb24gKGhpZ2hlcikgc2NvcmVzLCB3aXRoIGEgZmxvb3Igb2YgfjAuMiBvcGFjaXR5IChlbm91Z2ggdG9cbiAgICAgKiBzaG93IGNvbG9yIGFuZCBtYWludGFpbiBsZWdpYmlsaXR5KS5cbiAgICAgKi9cbiAgICByZXR1cm4gKDAuOCAqIHNjb3JlKSArIDAuMjtcbn1cblxuLy8gc3VwcG9ydCBmb3IgYSBjb2xvci1jb2RlZCBcInNwZWVkb21ldGVyXCIgZm9yIHNlcnZlci1zaWRlIG1hcHBpbmcgKHNvbWUgYXMgSlMgZ2xvYmFscylcbnZhciByZWNlbnRNYXBwaW5nVGltZXMgPSBbIF07XG5yZWNlbnRNYXBwaW5nU3BlZWRMYWJlbCA9IGtvLm9ic2VydmFibGUoXCJcIik7IC8vIHNlY29uZHMgcGVyIG5hbWUsIGJhc2VkIG9uIHJvbGxpbmcgYXZlcmFnZVxucmVjZW50TWFwcGluZ1NwZWVkUGVyY2VudCA9IGtvLm9ic2VydmFibGUoMCk7IC8vIGFmZmVjdHMgY29sb3Igb2YgYmFyLCBldGNcbnJlY2VudE1hcHBpbmdTcGVlZEJhckNsYXNzID0ga28ub2JzZXJ2YWJsZSgncHJvZ3Jlc3MgcHJvZ3Jlc3MtaW5mbycpO1xuXG4vLyB0aGlzIHNob3VsZCBiZSBjbGVhcmVkIHdoZW5ldmVyIHNvbWV0aGluZyBjaGFuZ2VzIGluIG1hcHBpbmcgaGludHNcbmZ1bmN0aW9uIGNsZWFyRmFpbGVkTmFtZUxpc3QoKSB7XG4gICAgZmFpbGVkTWFwcGluZ05hbWVzLnJlbW92ZUFsbCgpO1xuICAgIC8vIG51ZGdlIHRvIHVwZGF0ZSBuYW1lIGxpc3QgaW1tZWRpYXRlbHlcbiAgICBib2d1c0VkaXRlZExhYmVsQ291bnRlciggYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoKSArIDEpO1xuICAgIG51ZGdlQXV0b01hcHBpbmcoKTtcbn1cbmZ1bmN0aW9uIG51ZGdlQXV0b01hcHBpbmcoKSB7XG4gICAgLy8gcmVzdGFydCBhdXRvLW1hcHBpbmcsIGlmIGVuYWJsZWRcbiAgICBpZiAoYXV0b01hcHBpbmdJblByb2dyZXNzKCkpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRseU1hcHBpbmdOYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIC8vIGxvb2tzIGxpa2Ugd2UgcmFuIG91dCBvZiBzdGVhbS4uIHRyeSBhZ2FpbiFcbiAgICAgICAgICAgIHJlcXVlc3RUYXhvbk1hcHBpbmcoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG5cblxuZnVuY3Rpb24gaW5mZXJTZWFyY2hDb250ZXh0RnJvbUF2YWlsYWJsZU5hbWVzKCkge1xuICAgIC8vIEZldGNoIHRoZSBsZWFzdCBpbmNsdXNpdmUgY29udGV4dCB2aWEgQUpBWCwgYW5kIHVwZGF0ZSB0aGUgZHJvcC1kb3duIG1lbnVcbiAgICB2YXIgbmFtZXNUb1N1Ym1pdCA9IFsgXTtcbiAgICB2YXIgbWF4TmFtZXNUb1N1Ym1pdCA9IDUwMDA7ICAvLyBpZiBtb3JlIHRoYW4gdGhpcywgZHJvcCBleHRyYSBuYW1lcyBldmVubHlcbiAgICBjb25zb2xlLmxvZyhcIj4+IGZvdW5kIFwiKyB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGggK1wiIG5hbWVzIGluIHRoZSBuYW1lc2V0XCIpO1xuICAgIHZhciBuYW1lc1RvU3VibWl0ID0gJC5tYXAodmlld01vZGVsLm5hbWVzKCksIGZ1bmN0aW9uKG5hbWUsIGluZGV4KSB7XG4gICAgICAgIHJldHVybiAoJ290dFRheG9uTmFtZScgaW4gbmFtZSkgPyBuYW1lWydvdHRUYXhvbk5hbWUnXSA6IG5hbWVbJ29yaWdpbmFsTGFiZWwnXTtcbiAgICB9KTtcbiAgICBpZiAobmFtZXNUb1N1Ym1pdC5sZW5ndGggPiBtYXhOYW1lc1RvU3VibWl0KSB7XG4gICAgICAgIC8vIHJlZHVjZSB0aGUgbGlzdCBpbiBhIGRpc3RyaWJ1dGVkIGZhc2hpb24gKGVnLCBldmVyeSBmb3VydGggaXRlbSlcbiAgICAgICAgdmFyIHN0ZXBTaXplID0gbWF4TmFtZXNUb1N1Ym1pdCAvIG5hbWVzVG9TdWJtaXQubGVuZ3RoO1xuICAgICAgICAvLy9jb25zb2xlLmxvZyhcIlRPTyBNQU5ZIE5BTUVTLCByZWR1Y2luZyB3aXRoIHN0ZXAtc2l6ZSBcIisgc3RlcFNpemUpO1xuICAgICAgICAvLyBjcmVlcCB0byB3aG9sZSBudW1iZXJzLCBrZWVwaW5nIGFuIGl0ZW0gZXZlcnkgdGltZSB3ZSBpbmNyZW1lbnQgYnkgb25lXG4gICAgICAgIHZhciBjdXJyZW50U3RlcFRvdGFsID0gMC4wO1xuICAgICAgICB2YXIgbmV4dFdob2xlTnVtYmVyID0gMTtcbiAgICAgICAgbmFtZXNUb1N1Ym1pdCA9IG5hbWVzVG9TdWJtaXQuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoKGN1cnJlbnRTdGVwVG90YWwgKz0gc3RlcFNpemUpID49IG5leHRXaG9sZU51bWJlcikge1xuICAgICAgICAgICAgICAgIG5leHRXaG9sZU51bWJlciArPSAxOyAvLyBidW1wIHRvIG5leHQgbnVtYmVyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhcIj4+IHN1Ym1pdHRpbmcgXCIrIG5hbWVzVG9TdWJtaXQubGVuZ3RoICtcIiBuYW1lcyBpbiB0aGUgbmFtZXNldFwiKTtcbiAgICBpZiAobmFtZXNUb1N1Ym1pdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuOyAvLyB0aGlzIGlzIGEgbm8tb3BcbiAgICB9XG5cbiAgICAvLy9zaG93TW9kYWxTY3JlZW4oXCJJbmZlcnJpbmcgc2VhcmNoIGNvbnRleHQuLi5cIiwge1NIT1dfQlVTWV9CQVI6dHJ1ZX0pO1xuXG4gICAgJC5hamF4KHtcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAvLyBjcm9zc2RvbWFpbjogdHJ1ZSxcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICAgICAgICB1cmw6IGdldENvbnRleHRGb3JOYW1lc191cmwsXG4gICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgZGF0YTogKCd7XCJuYW1lc1wiOiAnKyBKU09OLnN0cmluZ2lmeShuYW1lc1RvU3VibWl0KSArJ30nKSxcbiAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcbiAgICAgICAgICAgIC8vIHJlcG9ydCBlcnJvcnMgb3IgbWFsZm9ybWVkIGRhdGEsIGlmIGFueVxuICAgICAgICAgICAgaWYgKHRleHRTdGF0dXMgIT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UoJ1NvcnJ5LCB0aGVyZSB3YXMgYW4gZXJyb3IgaW5mZXJyaW5nIHRoZSBzZWFyY2ggY29udGV4dC4nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVSUk9SOiB0ZXh0U3RhdHVzICE9PSAnc3VjY2VzcycsIGJ1dCBcIisgdGV4dFN0YXR1cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IEpTT04ucGFyc2UoIGpxWEhSLnJlc3BvbnNlVGV4dCApO1xuICAgICAgICAgICAgdmFyIGluZmVycmVkQ29udGV4dCA9IG51bGw7XG4gICAgICAgICAgICBpZiAocmVzdWx0ICYmICdjb250ZXh0X25hbWUnIGluIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGluZmVycmVkQ29udGV4dCA9IHJlc3VsdFsnY29udGV4dF9uYW1lJ107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLy9jb25zb2xlLmxvZyhcIj4+IGluZmVycmVkQ29udGV4dDogXCIrIGluZmVycmVkQ29udGV4dCk7XG4gICAgICAgICAgICBpZiAoaW5mZXJyZWRDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIEJPVEggc2VhcmNoLWNvbnRleHQgZHJvcC1kb3duIG1lbnVzIHRvIHNob3cgdGhpcyByZXN1bHRcbiAgICAgICAgICAgICAgICAkKCdzZWxlY3RbbmFtZT10YXhvbi1zZWFyY2gtY29udGV4dF0nKS52YWwoaW5mZXJyZWRDb250ZXh0KTtcbiAgICAgICAgICAgICAgICAvLyBUd2VhayB0aGUgbW9kZWwncyBuYW1lIG1hcHBpbmcsIHRoZW4gcmVmcmVzaCB0aGUgVUlcbiAgICAgICAgICAgICAgICAvLyBOLkIuIFdlIGNoZWNrIGZpcnN0IHRvIGF2b2lkIGFkZGluZyBhbiB1bm5lY2Vzc2FyeSB1bnNhdmVkLWRhdGEgd2FybmluZyFcbiAgICAgICAgICAgICAgICBpZiAodmlld01vZGVsLm1hcHBpbmdIaW50cy5zZWFyY2hDb250ZXh0KCkgIT09IGluZmVycmVkQ29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZWwubWFwcGluZ0hpbnRzLnNlYXJjaENvbnRleHQoaW5mZXJyZWRDb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlTWFwcGluZ0hpbnRzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzaG93RXJyb3JNZXNzYWdlKCdTb3JyeSwgbm8gc2VhcmNoIGNvbnRleHQgd2FzIGluZmVycmVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8vIEtlZXAgYSBzYWZlIGNvcHkgb2Ygb3VyIFVJIG1hcmt1cCwgZm9yIHJlLXVzZSBhcyBhIEtub2Nrb3V0IHRlbXBsYXRlIChzZWUgYmVsb3cpXG52YXIgJHN0YXNoZWRFZGl0QXJlYSA9IG51bGw7XG5cbi8vIExvYWQgYSBuYW1lc2V0IGZyb20gSlMvSlNPTiBkYXRhICh1c3UuIGNhbGxlZCBieSBjb252ZW5pZW5jZSBmdW5jdGlvbnMgYmVsb3cpXG5mdW5jdGlvbiBsb2FkTmFtZXNldERhdGEoIGRhdGEsIGxvYWRlZEZpbGVOYW1lLCBsYXN0TW9kaWZpZWREYXRlICkge1xuICAgIC8qIFBhcnNlIHRoaXMgZGF0YSBhcyBgbmFtZXNldGAgKGEgc2ltcGxlIEpTIG9iamVjdCksIHRoZW4gY29udmVydCB0aGlzXG4gICAgICogaW50byBvdXIgcHJpbWFyeSB2aWV3IG1vZGVsIGZvciBLbm9ja291dEpTICAoYnkgY29udmVudGlvbiwgaXQncyB1c3VhbGx5XG4gICAgICogbmFtZWQgJ3ZpZXdNb2RlbCcpLlxuICAgICAqL1xuICAgIHZhciBuYW1lc2V0O1xuICAgIHN3aXRjaCh0eXBlb2YgZGF0YSkgeyBcbiAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIGl0J3MgbnVsbCwgb3IgdW5kZWZpbmVkPyBvciBzb21ldGhpbmcgZHVtYlxuICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBnZXROZXdOYW1lc2V0TW9kZWwoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmFtZXNldCA9IGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgICAgICAgIG5hbWVzZXQgPSBnZXROZXdOYW1lc2V0TW9kZWwoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBuYW1lc2V0ID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgIC8vIElGIHRoaXMgZmFpbHMsIHRyeSB0byBpbXBvcnQgVFNWL0NTViwgbGluZS1ieS1saW5lIHRleHRcbiAgICAgICAgICAgICAgICBuYW1lc2V0ID0gY29udmVydFRvTmFtZXNldE1vZGVsKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6IFxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuZXhwZWN0ZWQgdHlwZSBmb3IgbmFtZXNldCBkYXRhOiBcIisgKHR5cGVvZiBkYXRhKSk7XG4gICAgICAgICAgICBuYW1lc2V0ID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKiBcIk5vcm1hbGl6ZVwiIHRoZSBuYW1lc2V0IGJ5IGFkZGluZyBhbnkgbWlzc2luZyBwcm9wZXJ0aWVzIGFuZCBtZXRhZGF0YS5cbiAgICAgKiAoVGhpcyBpcyBtYWlubHkgdXNlZnVsIHdoZW4gbG9hZGluZyBhbiBvbGRlciBhcmNoaXZlZCBuYW1lc2V0LCB0b1xuICAgICAqIGNhdGNoIHVwIHdpdGggYW55IGNoYW5nZXMgdG8gdGhlIGV4cGVjdGVkIGRhdGEgbW9kZWwuKVxuICAgICAqL1xuICAgIGlmIChuYW1lc2V0Lm1ldGFkYXRhWydkYXRlX2NyZWF0ZWQnXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNyZWF0aW9uIGRhdGUgaXMgbm90IGtub3dhYmxlOyBtYXRjaCBsYXN0LXNhdmVkIGRhdGUgZnJvbSBmaWxlXG4gICAgICAgIG5hbWVzZXQubWV0YWRhdGEuZGF0ZV9jcmVhdGVkID0gbGFzdE1vZGlmaWVkRGF0ZS50b0lTT1N0cmluZygpO1xuICAgIH1cbiAgICBpZiAobmFtZXNldC5tZXRhZGF0YVsnbGFzdF9zYXZlZCddID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gYXNzdW1lIGxhc3Qtc2F2ZWQgZGF0ZSBmcm9tIGZpbGUgaXMgY29ycmVjdFxuICAgICAgICBuYW1lc2V0Lm1ldGFkYXRhLmxhc3Rfc2F2ZWQgPSBsYXN0TW9kaWZpZWREYXRlLnRvSVNPU3RyaW5nKCk7XG4gICAgfVxuICAgIGlmIChuYW1lc2V0Lm1ldGFkYXRhWydzYXZlX2NvdW50J10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyB0cnVlIG51bWJlciBvZiBzYXZlcyBpcyBub3Qga25vd2FibGUsIGJ1dCB0aGVyZSdzIGJlZW4gYXQgbGVhc3Qgb25lIVxuICAgICAgICBuYW1lc2V0Lm1ldGFkYXRhLnNhdmVfY291bnQgPSAxO1xuICAgIH1cbiAgICBpZiAobmFtZXNldC5tZXRhZGF0YVsnbGF0ZXN0X290dF92ZXJzaW9uJ10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBuYW1lc2V0Lm1ldGFkYXRhLmxhdGVzdF9vdHRfdmVyc2lvbiA9IG51bGw7XG4gICAgfVxuICAgIGlmIChsb2FkZWRGaWxlTmFtZSkge1xuICAgICAgICAvLyBXZSBqdXN0IGxvYWRlZCBhbiBhcmNoaXZlIGZpbGUhIFN0b3JlIGl0cyBsYXRlc3QgZmlsZW5hbWUuXG4gICAgICAgIG5hbWVzZXQubWV0YWRhdGEucHJldmlvdXNfZmlsZW5hbWUgPSBsb2FkZWRGaWxlTmFtZTtcbiAgICB9XG4gICAgaWYgKG5hbWVzZXQubWFwcGluZ0hpbnRzWydhdXRvQWNjZXB0RXhhY3RNYXRjaGVzJ10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBuYW1lc2V0Lm1hcHBpbmdIaW50c1snYXV0b0FjY2VwdEV4YWN0TWF0Y2hlcyddID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyogTmFtZSBhbmQgZXhwb3J0IHRoZSBuZXcgdmlld21vZGVsLiBOT1RFIHRoYXQgd2UgZG9uJ3QgY3JlYXRlIG9ic2VydmFibGVzXG4gICAgICogZm9yIG5hbWVzIGFuZCB0aGVpciBtYW55IHByb3BlcnRpZXMhIFRoaXMgc2hvdWxkIGhlbHAga2VlcCB0aGluZ3Mgc25hcHB5XG4gICAgICogd2hlbiB3b3JpaW5nIHdpdGggdmVyeSBsYXJnZSBsaXN0cy5cbiAgICAgKi9cbiAgICB2YXIga25vY2tvdXRNYXBwaW5nT3B0aW9ucyA9IHtcbiAgICAgICAgJ2NvcHknOiBbXCJuYW1lc1wiXSAgLy8gd2UnbGwgbWFrZSB0aGUgJ25hbWVzJyBhcnJheSBvYnNlcnZhYmxlIGJlbG93XG4gICAgfTtcblxuICAgIGV4cG9ydHMudmlld01vZGVsID0gdmlld01vZGVsID0ga28ubWFwcGluZy5mcm9tSlMobmFtZXNldCwga25vY2tvdXRNYXBwaW5nT3B0aW9ucyk7XG4gICAgdmlld01vZGVsLm5hbWVzID0ga28ub2JzZXJ2YWJsZUFycmF5KHZpZXdNb2RlbC5uYW1lcyk7XG5cbiAgICAvLyBjbGVhbnVwIG9mIGluY29taW5nIGRhdGFcbiAgICByZW1vdmVEdXBsaWNhdGVOYW1lcyh2aWV3TW9kZWwpO1xuXG4gICAgLy8gdGFrZSBpbml0aWFsIHN0YWIgYXQgc2V0dGluZyBzZWFyY2ggY29udGV4dCBmb3IgVE5SUz9cbiAgICBpbmZlclNlYXJjaENvbnRleHRGcm9tQXZhaWxhYmxlTmFtZXMoKTtcblxuICAgIC8qIFxuICAgICAqIEFkZCBvYnNlcnZhYmxlIHByb3BlcnRpZXMgdG8gdGhlIG1vZGVsIHRvIHN1cHBvcnQgdGhlIFVJLiBcbiAgICAgKi9cblxuICAgIC8vIHByZXR0aWVyIGRpc3BsYXkgZGF0ZXNcbiAgICB2aWV3TW9kZWwuZGlzcGxheUNyZWF0aW9uRGF0ZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0ZSA9IHZpZXdNb2RlbC5tZXRhZGF0YS5kYXRlX2NyZWF0ZWQoKTtcbiAgICAgICAgcmV0dXJuIGZvcm1hdElTT0RhdGUoZGF0ZSk7XG4gICAgfSk7XG4gICAgdmlld01vZGVsLmRpc3BsYXlMYXN0U2F2ZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0ZSA9IHZpZXdNb2RlbC5tZXRhZGF0YS5sYXN0X3NhdmVkKCk7XG4gICAgICAgIGlmIChkYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0xhc3Qgc2F2ZWQgJysgZm9ybWF0SVNPRGF0ZShkYXRlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAnVGhpcyBuYW1lc2V0IGhhcyBub3QgYmVlbiBzYXZlZC4nO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmlld01vZGVsLmRpc3BsYXlQcmV2aW91c0ZpbGVuYW1lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBmaWxlTmFtZSA9IHZpZXdNb2RlbC5tZXRhZGF0YS5wcmV2aW91c19maWxlbmFtZSgpO1xuICAgICAgICBpZiAoZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBcIkxvYWRlZCBmcm9tIGZpbGUgPGNvZGU+XCIrIGZpbGVOYW1lICtcIjwvY29kZT4uXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RoaXMgaXMgYSBuZXcgbmFtZXNldCAobm8gcHJldmlvdXMgZmlsZW5hbWUpLic7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEFkZCBhIHNlcmllcyBvZiBvYnNlcnZhYmxlIFwidGlja2xlcnNcIiB0byBzaWduYWwgY2hhbmdlcyBpblxuICAgIC8vIHRoZSBtb2RlbCB3aXRob3V0IG9ic2VydmFibGUgTmV4c29uIHByb3BlcnRpZXMuIEVhY2ggaXMgYW5cbiAgICAvLyBpbnRlZ2VyIHRoYXQgY3JlZXBzIHVwIGJ5IDEgdG8gc2lnbmFsIGEgY2hhbmdlIHNvbWV3aGVyZSBpblxuICAgIC8vIHJlbGF0ZWQgTmV4c29uIGVsZW1lbnRzLlxuICAgIHZpZXdNb2RlbC50aWNrbGVycyA9IHtcbiAgICAgICAgJ01FVEFEQVRBJzoga28ub2JzZXJ2YWJsZSgxKSxcbiAgICAgICAgJ0lOUFVUX0ZJTEVTJzoga28ub2JzZXJ2YWJsZSgxKSxcbiAgICAgICAgJ05BTUVfTUFQUElOR19ISU5UUyc6IGtvLm9ic2VydmFibGUoMSksXG4gICAgICAgICdWSVNJQkxFX05BTUVfTUFQUElOR1MnOiBrby5vYnNlcnZhYmxlKDEpLFxuICAgICAgICAvLyBUT0RPOiBhZGQgbW9yZSBhcyBuZWVkZWQuLi5cbiAgICAgICAgJ05BTUVTRVRfSEFTX0NIQU5HRUQnOiBrby5vYnNlcnZhYmxlKDEpXG4gICAgfVxuXG4gICAgLy8gc3VwcG9ydCBmYXN0IGxvb2t1cCBvZiBlbGVtZW50cyBieSBJRCwgZm9yIGxhcmdlc3QgdHJlZXNcbiAgICB2aWV3TW9kZWwuZmFzdExvb2t1cHMgPSB7XG4gICAgICAgICdOQU1FU19CWV9JRCc6IG51bGxcbiAgICB9O1xuXG4gICAgLy8gZW5hYmxlIHNvcnRpbmcgYW5kIGZpbHRlcmluZyBsaXN0cyBpbiB0aGUgZWRpdG9yXG4gICAgdmFyIGxpc3RGaWx0ZXJEZWZhdWx0cyA9IHtcbiAgICAgICAgLy8gdHJhY2sgdGhlc2UgZGVmYXVsdHMgc28gd2UgY2FuIHJlc2V0IHRoZW0gaW4gaGlzdG9yeVxuICAgICAgICAnTkFNRVMnOiB7XG4gICAgICAgICAgICAvLyBUT0RPOiBhZGQgJ3BhZ2VzaXplJz9cbiAgICAgICAgICAgICdtYXRjaCc6IFwiXCIsXG4gICAgICAgICAgICAnb3JkZXInOiBcIlVubWFwcGVkIG5hbWVzIGZpcnN0XCJcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmlld01vZGVsLmZpbHRlckRlbGF5ID0gMjUwOyAvLyBtcyB0byB3YWl0IGZvciBjaGFuZ2VzIGJlZm9yZSB1cGRhdGluZyBmaWx0ZXJcbiAgICB2aWV3TW9kZWwubGlzdEZpbHRlcnMgPSB7XG4gICAgICAgIC8vIFVJIHdpZGdldHMgYm91bmQgdG8gdGhlc2UgdmFyaWFibGVzIHdpbGwgdHJpZ2dlciB0aGVcbiAgICAgICAgLy8gY29tcHV0ZWQgZGlzcGxheSBsaXN0cyBiZWxvdy4uXG4gICAgICAgICdOQU1FUyc6IHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFkZCAncGFnZXNpemUnP1xuICAgICAgICAgICAgJ21hdGNoJzoga28ub2JzZXJ2YWJsZSggbGlzdEZpbHRlckRlZmF1bHRzLk5BTUVTLm1hdGNoICksXG4gICAgICAgICAgICAnb3JkZXInOiBrby5vYnNlcnZhYmxlKCBsaXN0RmlsdGVyRGVmYXVsdHMuTkFNRVMub3JkZXIgKVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBhbnkgY2hhbmdlIHRvIHRoZXNlIGxpc3QgZmlsdGVycyBzaG91bGQgcmVzZXQgcGFnaW5hdGlvbiBmb3IgdGhlIGN1cnJlbnQgZGlzcGxheSBsaXN0XG4gICAgLy8gTkIgdGhpcyBpcyBhIHN0cmVhbWxpbmVkIHZlcnNpb24gb2YgdGhlIG1vcmUgZ2VuZXJhbCBmaXggaW4gc3R1ZHktZWRpdG9yLmpzIVxuICAgICQuZWFjaCh2aWV3TW9kZWwubGlzdEZpbHRlcnMuTkFNRVMsIGZ1bmN0aW9uKGZpbHRlck5hbWUsIGZpbHRlck9ic2VydmFibGUpIHtcbiAgICAgICAgZmlsdGVyT2JzZXJ2YWJsZS5zdWJzY3JpYmUoZnVuY3Rpb24obmV3VmFsdWUpIHtcbiAgICAgICAgICAgIC8vIGlnbm9yZSB2YWx1ZSwganVzdCByZXNldCBwYWdpbmF0aW9uIChiYWNrIHRvIHBhZ2UgMSlcbiAgICAgICAgICAgIHZpZXdNb2RlbC5fZmlsdGVyZWRPVFVzLmdvVG9QYWdlKDEpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiBcbiAgICAvLyBtYWludGFpbiBhIHBlcnNpc3RlbnQgYXJyYXkgdG8gcHJlc2VydmUgcGFnaW5hdGlvbiAocmVzZXQgd2hlbiBjb21wdXRlZClcbiAgICB2aWV3TW9kZWwuX2ZpbHRlcmVkTmFtZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoICkuYXNQYWdlZCg1MDApO1xuICAgIHZpZXdNb2RlbC5maWx0ZXJlZE5hbWVzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGZpbHRlciByYXcgbmFtZSBsaXN0LCB0aGVuIHNvcnQsIHJldHVybmluZyBhXG4gICAgICAgIC8vIG5ldyAoT1IgTU9ESUZJRUQ/PykgcGFnZWQgb2JzZXJ2YWJsZUFycmF5XG4gICAgICAgIC8vL3ZhciB0aWNrbGVycyA9IFsgdmlld01vZGVsLnRpY2tsZXJzLk5BTUVfTUFQUElOR19ISU5UUygpIF07XG5cbiAgICAgICAgdXBkYXRlQ2xlYXJTZWFyY2hXaWRnZXQoICcjbmFtZS1saXN0LWZpbHRlcicgKTtcbiAgICAgICAgLy91cGRhdGVMaXN0RmlsdGVyc1dpdGhIaXN0b3J5KCk7XG5cbiAgICAgICAgdmFyIG1hdGNoID0gdmlld01vZGVsLmxpc3RGaWx0ZXJzLk5BTUVTLm1hdGNoKCksXG4gICAgICAgICAgICBtYXRjaFdpdGhEaWFjcml0aWNhbHMgPSBhZGREaWFjcml0aWNhbFZhcmlhbnRzKG1hdGNoKSxcbiAgICAgICAgICAgIG1hdGNoUGF0dGVybiA9IG5ldyBSZWdFeHAoICQudHJpbShtYXRjaFdpdGhEaWFjcml0aWNhbHMpLCAnaScgKTtcbiAgICAgICAgdmFyIG9yZGVyID0gdmlld01vZGVsLmxpc3RGaWx0ZXJzLk5BTUVTLm9yZGVyKCk7XG5cbiAgICAgICAgLy8gY2FwdHVyZSBjdXJyZW50IHBvc2l0aW9ucywgdG8gYXZvaWQgdW5uZWNlc3NhcnkgXCJqdW1waW5nXCIgaW4gdGhlIGxpc3RcbiAgICAgICAgY2FwdHVyZURlZmF1bHRTb3J0T3JkZXIodmlld01vZGVsLm5hbWVzKCkpO1xuXG4gICAgICAgIC8qIFRPRE86IHBvb2wgYWxsIG5hbWUgSURzIGludG8gYSBjb21tb24gb2JqZWN0P1xuICAgICAgICB2YXIgY2hvc2VuTmFtZUlEcyA9IHt9O1xuICAgICAgICBjb25zb2xlLndhcm4oY2hvc2VuTmFtZUlEcyk7XG4gICAgICAgIGlmIChjaG9zZW5OYW1lSURzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkhlcmUncyB0aGUgZmlyc3Qgb2YgY2hvc2VuTmFtZUlEczpcIik7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oY2hvc2VuTmFtZUlEc1swXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJjaG9zZW5OYW1lSURzIGlzIGFuIGVtcHR5IGxpc3QhXCIpO1xuICAgICAgICB9XG4gICAgICAgICovXG5cbiAgICAgICAgLy8gbWFwIG9sZCBhcnJheSB0byBuZXcgYW5kIHJldHVybiBpdFxuICAgICAgICB2YXIgZmlsdGVyZWRMaXN0ID0ga28udXRpbHMuYXJyYXlGaWx0ZXIoXG4gICAgICAgICAgICB2aWV3TW9kZWwubmFtZXMoKSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAvLyBtYXRjaCBlbnRlcmVkIHRleHQgYWdhaW5zdCBvbGQgb3IgbmV3IGxhYmVsXG4gICAgICAgICAgICAgICAgdmFyIG9yaWdpbmFsTGFiZWwgPSBuYW1lWydvcmlnaW5hbExhYmVsJ107XG4gICAgICAgICAgICAgICAgdmFyIG1vZGlmaWVkTGFiZWwgPSBuYW1lWydhZGp1c3RlZExhYmVsJ10gfHwgYWRqdXN0ZWRMYWJlbChvcmlnaW5hbExhYmVsKTtcbiAgICAgICAgICAgICAgICB2YXIgbWFwcGVkTGFiZWwgPSBuYW1lWydvdHRUYXhvbk5hbWUnXTtcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoUGF0dGVybi50ZXN0KG9yaWdpbmFsTGFiZWwpICYmXG4gICAgICAgICAgICAgICAgICAgICFtYXRjaFBhdHRlcm4udGVzdChtb2RpZmllZExhYmVsKSAmJlxuICAgICAgICAgICAgICAgICAgICAhbWF0Y2hQYXR0ZXJuLnRlc3QobWFwcGVkTGFiZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7ICAvLyBFTkQgb2YgbGlzdCBmaWx0ZXJpbmdcblxuICAgICAgICAvLyBhcHBseSBzZWxlY3RlZCBzb3J0IG9yZGVyXG4gICAgICAgIHN3aXRjaChvcmRlcikge1xuICAgICAgICAgICAgLyogUkVNSU5ERVI6IGluIHNvcnQgZnVuY3Rpb25zLCByZXN1bHRzIGFyZSBhcyBmb2xsb3dzOlxuICAgICAgICAgICAgICogIC0xID0gYSBjb21lcyBiZWZvcmUgYlxuICAgICAgICAgICAgICogICAwID0gbm8gY2hhbmdlXG4gICAgICAgICAgICAgKiAgIDEgPSBiIGNvbWVzIGJlZm9yZSBhXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNhc2UgJ1VubWFwcGVkIG5hbWVzIGZpcnN0JzpcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZExpc3Quc29ydChmdW5jdGlvbihhLGIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTi5CLiBUaGlzIHdvcmtzIGV2ZW4gaWYgdGhlcmUncyBubyBzdWNoIHByb3BlcnR5LlxuICAgICAgICAgICAgICAgICAgICAvL2lmIChjaGVja0ZvckludGVyZXN0aW5nU3R1ZGllcyhhLGIpKSB7IGRlYnVnZ2VyOyB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBhTWFwU3RhdHVzID0gJC50cmltKGFbJ290dFRheG9uTmFtZSddKSAhPT0gJyc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiTWFwU3RhdHVzID0gJC50cmltKGJbJ290dFRheG9uTmFtZSddKSAhPT0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhTWFwU3RhdHVzID09PSBiTWFwU3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFNYXBTdGF0dXMpIHsgLy8gYm90aCBuYW1lcyBhcmUgY3VycmVudGx5IHVuLW1hcHBlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvcmNlIGZhaWxlZCBtYXBwaW5ncyB0byB0aGUgYm90dG9tIG9mIHRoZSBsaXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFGYWlsZWRNYXBwaW5nID0gKGZhaWxlZE1hcHBpbmdOYW1lcy5pbmRleE9mKGFbJ2lkJ10pICE9PSAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJGYWlsZWRNYXBwaW5nID0gKGZhaWxlZE1hcHBpbmdOYW1lcy5pbmRleE9mKGJbJ2lkJ10pICE9PSAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFGYWlsZWRNYXBwaW5nID09PSBiRmFpbGVkTWFwcGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUcnkgdG8gcmV0YWluIHRoZWlyIHByaW9yIHByZWNlZGVuY2UgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGxpc3QgKGF2b2lkIGl0ZW1zIGp1bXBpbmcgYXJvdW5kKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKnJldHVybiAoYS5wcmlvclBvc2l0aW9uIDwgYi5wcmlvclBvc2l0aW9uKSA/IC0xOjE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFNob3VsZCB0aGlzIHN1cGVyY2VkZSBvdXIgdHlwaWNhbCB1c2Ugb2YgYG1haW50YWluUmVsYXRpdmVMaXN0UG9zaXRpb25zYD9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtYWludGFpblJlbGF0aXZlTGlzdFBvc2l0aW9ucyhhLCBiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFGYWlsZWRNYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxOyAgIC8vIGZvcmNlIGEgKGZhaWxlZCkgYmVsb3cgYlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7ICAgLy8gZm9yY2UgYiAoZmFpbGVkKSBiZWxvdyBhXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vcmV0dXJuIChhLnByaW9yUG9zaXRpb24gPCBiLnByaW9yUG9zaXRpb24pID8gLTE6MTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFpbnRhaW5SZWxhdGl2ZUxpc3RQb3NpdGlvbnMoYSwgYik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFNYXBTdGF0dXMpIHJldHVybiAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYk1hcFN0YXR1cykgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdNYXBwZWQgbmFtZXMgZmlyc3QnOlxuICAgICAgICAgICAgICAgIGZpbHRlcmVkTGlzdC5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYU1hcFN0YXR1cyA9ICQudHJpbShhWydvdHRUYXhvbk5hbWUnXSkgIT09ICcnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYk1hcFN0YXR1cyA9ICQudHJpbShiWydvdHRUYXhvbk5hbWUnXSkgIT09ICcnO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYU1hcFN0YXR1cyA9PT0gYk1hcFN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1haW50YWluUmVsYXRpdmVMaXN0UG9zaXRpb25zKGEsIGIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChhTWFwU3RhdHVzKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdPcmlnaW5hbCBuYW1lIChBLVopJzpcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZExpc3Quc29ydChmdW5jdGlvbihhLGIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFPcmlnaW5hbCA9ICQudHJpbShhWydvcmlnaW5hbExhYmVsJ10pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYk9yaWdpbmFsID0gJC50cmltKGJbJ29yaWdpbmFsTGFiZWwnXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhT3JpZ2luYWwgPT09IGJPcmlnaW5hbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1haW50YWluUmVsYXRpdmVMaXN0UG9zaXRpb25zKGEsIGIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChhT3JpZ2luYWwgPCBiT3JpZ2luYWwpIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ09yaWdpbmFsIG5hbWUgKFotQSknOlxuICAgICAgICAgICAgICAgIGZpbHRlcmVkTGlzdC5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYU9yaWdpbmFsID0gJC50cmltKGFbJ29yaWdpbmFsTGFiZWwnXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiT3JpZ2luYWwgPSAkLnRyaW0oYlsnb3JpZ2luYWxMYWJlbCddKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFPcmlnaW5hbCA9PT0gYk9yaWdpbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFpbnRhaW5SZWxhdGl2ZUxpc3RQb3NpdGlvbnMoYSwgYik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFPcmlnaW5hbCA+IGJPcmlnaW5hbCkgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVuZXhwZWN0ZWQgb3JkZXIgZm9yIG5hbWUgbGlzdDogW1wiKyBvcmRlciArXCJdXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVW4tc2VsZWN0IGFueSBuYW1lIHRoYXQncyBub3cgb3V0IG9mIHZpZXcgKGllLCBvdXRzaWRlIG9mIHRoZSBmaXJzdCBwYWdlIG9mIHJlc3VsdHMpXG4gICAgICAgIHZhciBpdGVtc0luVmlldyA9IGZpbHRlcmVkTGlzdC5zbGljZSgwLCB2aWV3TW9kZWwuX2ZpbHRlcmVkTmFtZXMucGFnZVNpemUpO1xuICAgICAgICB2aWV3TW9kZWwubmFtZXMoKS5tYXAoZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgaWYgKG5hbWVbJ3NlbGVjdGVkRm9yQWN0aW9uJ10pIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNPdXRPZlZpZXcgPSAoJC5pbkFycmF5KG5hbWUsIGl0ZW1zSW5WaWV3KSA9PT0gLTEpO1xuICAgICAgICAgICAgICAgIGlmIChpc091dE9mVmlldykge1xuICAgICAgICAgICAgICAgICAgICBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBjbGVhciBhbnkgc3RhbGUgbGFzdC1zZWxlY3RlZCBuYW1lIChpdCdzIGxpa2VseSBtb3ZlZClcbiAgICAgICAgbGFzdENsaWNrZWRUb2dnbGVQb3NpdGlvbiA9IG51bGw7XG5cbiAgICAgICAgdmlld01vZGVsLl9maWx0ZXJlZE5hbWVzKCBmaWx0ZXJlZExpc3QgKTtcbiAgICAgICAgcmV0dXJuIHZpZXdNb2RlbC5fZmlsdGVyZWROYW1lcztcbiAgICB9KS5leHRlbmQoeyB0aHJvdHRsZTogdmlld01vZGVsLmZpbHRlckRlbGF5IH0pOyAvLyBFTkQgb2YgZmlsdGVyZWROYW1lc1xuXG4gICAgLy8gU3Rhc2ggdGhlIHByaXN0aW5lIG1hcmt1cCBiZWZvcmUgYmluZGluZyBvdXIgVUkgZm9yIHRoZSBmaXJzdCB0aW1lXG4gICAgaWYgKCRzdGFzaGVkRWRpdEFyZWEgPT09IG51bGwpIHtcbiAgICAgICAgJHN0YXNoZWRFZGl0QXJlYSA9ICQoJyNOYW1lLU1hcHBpbmcnKS5jbG9uZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJlcGxhY2Ugd2l0aCBwcmlzdGluZSBtYXJrdXAgdG8gYXZvaWQgd2VpcmQgcmVzdWx0cyB3aGVuIGxvYWRpbmcgYSBuZXcgbmFtZXNldFxuICAgICAgICAkKCcjTmFtZS1NYXBwaW5nJykuY29udGVudHMoKS5yZXBsYWNlV2l0aChcbiAgICAgICAgICAgICRzdGFzaGVkRWRpdEFyZWEuY2xvbmUoKS5jb250ZW50cygpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gKHJlKWJpbmQgdG8gZWRpdG9yIFVJIHdpdGggS25vY2tvdXRcbiAgICB2YXIgJGJvdW5kRWxlbWVudHMgPSAkKCcjTmFtZS1NYXBwaW5nLCAjaGVscC1maWxlLWFwaS1wcm9tcHQnKTsgLy8gYWRkIG90aGVyIGVsZW1lbnRzP1xuICAgICQuZWFjaCgkYm91bmRFbGVtZW50cywgZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAga28uY2xlYW5Ob2RlKGVsKTtcbiAgICAgICAga28uYXBwbHlCaW5kaW5ncyh2aWV3TW9kZWwsZWwpO1xuICAgIH0pO1xuXG4gICAgLyogQW55IGZ1cnRoZXIgY2hhbmdlcyAoKmFmdGVyKiBpbml0aWFsIGNsZWFudXApIHNob3VsZCBwcm9tcHQgZm9yIGEgc2F2ZVxuICAgICAqIGJlZm9yZSBsZWF2aW5nIHRoaXMgcGFnZS5cbiAgICAgKi9cbiAgICB2aWV3TW9kZWwudGlja2xlcnMuTkFNRVNFVF9IQVNfQ0hBTkdFRC5zdWJzY3JpYmUoIGZ1bmN0aW9uKCkge1xuICAgICAgICBuYW1lc2V0SGFzVW5zYXZlZENoYW5nZXMgPSB0cnVlO1xuICAgICAgICBlbmFibGVTYXZlQnV0dG9uKCk7XG4gICAgICAgIHB1c2hQYWdlRXhpdFdhcm5pbmcoJ1VOU0FWRURfTkFNRVNFVF9DSEFOR0VTJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIldBUk5JTkc6IFRoaXMgbmFtZXNldCBoYXMgdW5zYXZlZCBjaGFuZ2VzISBUbyBwcmVzZXJ2ZSB5b3VyIHdvcmssIHlvdSBzaG91bGQgc2F2ZSBhIG5hbWVzZXQgZmlsZSBiZWZvcmUgbGVhdmluZyBvciByZWxvYWRpbmcgdGhlIHBhZ2UuXCIpO1xuICAgIH0pO1xuICAgIHBvcFBhZ2VFeGl0V2FybmluZygnVU5TQVZFRF9OQU1FU0VUX0NIQU5HRVMnKTtcbiAgICBuYW1lc2V0SGFzVW5zYXZlZENoYW5nZXMgPSBmYWxzZTtcbiAgICBkaXNhYmxlU2F2ZUJ1dHRvbigpO1xufVxuXG4vLyBrZWVwIHRyYWNrIG9mIHRoZSBsYXJnZXN0IChhbmQgdGh1cyBuZXh0IGF2YWlsYWJsZSkgbmFtZSBpZFxudmFyIGhpZ2hlc3ROYW1lT3JkaW5hbE51bWJlciA9IG51bGw7XG5mdW5jdGlvbiBmaW5kSGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyKCkge1xuICAgIC8vIGRvIGEgb25lLXRpbWUgc2NhbiBmb3IgdGhlIGhpZ2hlc3QgSUQgY3VycmVudGx5IGluIHVzZVxuICAgIHZhciBoaWdoZXN0T3JkaW5hbE51bWJlciA9IDA7XG4gICAgdmFyIGFsbE5hbWVzID0gdmlld01vZGVsLm5hbWVzKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGxOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGVzdE5hbWUgPSBhbGxOYW1lc1tpXTtcbiAgICAgICAgdmFyIHRlc3RJRCA9IGtvLnVud3JhcCh0ZXN0TmFtZVsnaWQnXSkgfHwgJyc7XG4gICAgICAgIGlmICh0ZXN0SUQgPT09ICcnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTUlTU0lORyBJRCBmb3IgdGhpcyBuYW1lOlwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGVzdE5hbWUpO1xuICAgICAgICAgICAgY29udGludWU7ICAvLyBza2lwIHRvIG5leHQgZWxlbWVudFxuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXN0SUQuaW5kZXhPZignbmFtZScpID09PSAwKSB7XG4gICAgICAgICAgICAvLyBjb21wYXJlIHRoaXMgdG8gdGhlIGhpZ2hlc3QgSUQgZm91bmQgc28gZmFyXG4gICAgICAgICAgICB2YXIgaXRzTnVtYmVyID0gdGVzdElELnNwbGl0KCAnbmFtZScgKVsxXTtcbiAgICAgICAgICAgIGlmICgkLmlzTnVtZXJpYyggaXRzTnVtYmVyICkpIHtcbiAgICAgICAgICAgICAgICBoaWdoZXN0T3JkaW5hbE51bWJlciA9IE1hdGgubWF4KCBoaWdoZXN0T3JkaW5hbE51bWJlciwgaXRzTnVtYmVyICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGhpZ2hlc3RPcmRpbmFsTnVtYmVyO1xufVxuZnVuY3Rpb24gZ2V0TmV4dE5hbWVPcmRpbmFsTnVtYmVyKCkge1xuICAgIC8vIGluY3JlbWVudCBhbmQgcmV0dXJuIHRoZSBuZXh0IGF2YWlsYWJsZSBvcmRpbmFsIG51bWJlciBmb3IgbmFtZXM7IHRoaXNcbiAgICAvLyBpcyB0eXBpY2FsbHkgdXNlZCB0byBtaW50IGEgbmV3IGlkLCBlLmcuIDIzID0+ICduYW1lMjMnXG4gICAgaWYgKGhpZ2hlc3ROYW1lT3JkaW5hbE51bWJlciA9PT0gbnVsbCkge1xuICAgICAgICBoaWdoZXN0TmFtZU9yZGluYWxOdW1iZXIgPSBmaW5kSGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyKCk7XG4gICAgfVxuICAgIC8vIGluY3JlbWVudCB0aGUgaGlnaGVzdCBJRCBmb3IgZmFzdGVyIGFzc2lnbm1lbnQgbmV4dCB0aW1lXG4gICAgaGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyKys7XG4gICAgcmV0dXJuIGhpZ2hlc3ROYW1lT3JkaW5hbE51bWJlcjtcbn1cblxuXG5mdW5jdGlvbiByZW1vdmVEdXBsaWNhdGVOYW1lcyggdmlld21vZGVsICkge1xuICAgIC8qIENhbGwgdGhpcyB3aGVuIGxvYWRpbmcgYSBuYW1lc2V0ICpvciogYWRkaW5nIG5hbWVzISAgV2Ugc2hvdWxkIHdhbGsgdGhlXG4gICAgICogZnVsbCBuYW1lcyBhcnJheSBhbmQgY2xvYmJlciBhbnkgbGF0ZXIgZHVwbGljYXRlcy4gVGhpcyBhcnJheSBpcyBhbHdheXNcbiAgICAgKiBzb3J0ZWQgYnkgY3JlYXRpb24gb3JkZXIsIHNvIGEgc2ltcGxlIGFwcHJvYWNoIHNob3VsZCBwcmVzZXJ2ZSB0aGVcbiAgICAgKiBjdXJhdG9yJ3MgZXhpc3RpbmcgbWFwcGluZ3MgYW5kIGxhYmVsIGFkanVzdG1lbnRzLlxuICAgICAqL1xuICAgIHZhciBsYWJlbHNBbHJlYWR5Rm91bmQgPSBbIF07XG4gICAgdmFyIGR1cGVzID0gWyBdO1xuICAgICQuZWFjaCggdmlld01vZGVsLm5hbWVzKCksIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgICAgdmFyIHRlc3RMYWJlbCA9ICQudHJpbShuYW1lLm9yaWdpbmFsTGFiZWwpO1xuICAgICAgICBpZiAobGFiZWxzQWxyZWFkeUZvdW5kLmluZGV4T2YodGVzdExhYmVsKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIGFkZCB0aGlzIHRvIGxhYmVscyBmb3VuZCAodGVzdCBsYXRlciBuYW1lcyBhZ2FpbnN0IHRoaXMpXG4gICAgICAgICAgICBsYWJlbHNBbHJlYWR5Rm91bmQucHVzaCh0ZXN0TGFiZWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhpcyBpcyBhIGR1cGUgb2YgYW4gZWFybGllciBuYW1lIVxuICAgICAgICAgICAgZHVwZXMucHVzaChuYW1lKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZpZXdNb2RlbC5uYW1lcy5yZW1vdmVBbGwoIGR1cGVzICk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdElTT0RhdGUoIGRhdGVTdHJpbmcsIG9wdGlvbnMgKSB7XG4gICAgLy8gY29waWVkIGZyb20gc3ludGgtdHJlZSB2aWV3ZXIgKG90dV9zdGF0aXN0aWNzLmh0bWwpXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge2luY2x1ZGVUaW1lOiB0cnVlfTtcbiAgICB2YXIgYURhdGUgPSBuZXcgbW9tZW50KGRhdGVTdHJpbmcpO1xuICAgIC8vIHNlZSBodHRwOi8vbW9tZW50anMuY29tL2RvY3MvIy9wYXJzaW5nL3N0cmluZy9cbiAgICBpZiAob3B0aW9ucy5pbmNsdWRlVGltZSkge1xuICAgICAgICByZXR1cm4gYURhdGUuZm9ybWF0KCdNTU1NIERvIFlZWVksIGhBJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGFEYXRlLmZvcm1hdCgnTU1NTSBEbyBZWVlZJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG93UG9zc2libGVNYXBwaW5nc0tleSgpIHtcbiAgICAvLyBleHBsYWluIGNvbG9ycyBhbmQgb3BhY2l0eSBpbiBhIHBvcHVwIChhbHJlYWR5IGJvdW5kKVxuICAgICQoJyNwb3NzaWJsZS1tYXBwaW5ncy1rZXknKS5tb2RhbCgnc2hvdycpO1xufVxuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBzd2l0Y2ggKGNvbnRleHQpIHtcbiAgICAgICAgY2FzZSAnQlVMS19UTlJTJzpcbiAgICAgICAgICAgIC8vIEFsd2F5cyBzdGFydCB3aXRoIGFuIGVtcHR5IHNldCwgYmluZGluZyBpdCB0byB0aGUgVUlcbiAgICAgICAgICAgIGxvYWROYW1lc2V0RGF0YSggbnVsbCApO1xuICAgICAgICAgICAgLy8gYXV0by1zZWxlY3QgdGhlIG1haW4gKFVJKSB0YWJcbiAgICAgICAgICAgICQoJ2FbaHJlZj0jTmFtZS1NYXBwaW5nXScpLnRhYignc2hvdycpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1NUVURZX09UVV9NQVBQSU5HJzpcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQW55dGhpbmcgdG8gZG8gb24gcmVhZHk/XCIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJz8/Pyc6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nIGZvciBub3cgKHBvc3NpYmx5IHN0dWR5IFZpZXcgcGFnZSlcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn0pO1xuXG4vLyBleHBvcnQgc29tZSBtZW1iZXJzIGFzIGEgc2ltcGxlIEFQSVxudmFyIGFwaSA9IFtcbiAgICAnbnVkZ2UnLCAgLy8gZXhwb3NlIHRpY2tsZXJzIGZvciBLTyBiaW5kaW5nc1xuICAgICdnZXREZWZhdWx0QXJjaGl2ZUZpbGVuYW1lJyxcbiAgICAnc2F2ZUN1cnJlbnROYW1lc2V0JyxcbiAgICAnbG9hZExpc3RGcm9tQ2hvc2VuRmlsZScsXG4gICAgJ2xvYWROYW1lc2V0RnJvbUNob3NlbkZpbGUnLFxuICAgICdzaG93TG9hZExpc3RQb3B1cCcsXG4gICAgJ3Nob3dMb2FkTmFtZXNldFBvcHVwJyxcbiAgICAnc2hvd1NhdmVOYW1lc2V0UG9wdXAnLFxuICAgICdicm93c2VyU3VwcG9ydHNGaWxlQVBJJyxcbiAgICAnYXV0b01hcHBpbmdJblByb2dyZXNzJyxcbiAgICAndXBkYXRlTWFwcGluZ0hpbnRzJyxcbiAgICAnc2hvd05hbWVzZXRNZXRhZGF0YScsXG4gICAgJ2hpZGVOYW1lc2V0TWV0YWRhdGEnLFxuICAgICdpbmZlclNlYXJjaENvbnRleHRGcm9tQXZhaWxhYmxlTmFtZXMnLFxuICAgICdzaG93TWFwcGluZ09wdGlvbnMnLFxuICAgICdoaWRlTWFwcGluZ09wdGlvbnMnLFxuICAgICdkaXNhYmxlU2F2ZUJ1dHRvbicsXG4gICAgJ2VuYWJsZVNhdmVCdXR0b24nLFxuICAgICdnZXRBdHRyc0Zvck1hcHBpbmdPcHRpb24nLFxuICAgICdzdGFydEF1dG9NYXBwaW5nJyxcbiAgICAnc3RvcEF1dG9NYXBwaW5nJyxcbiAgICAnZ2V0TWFwcGVkTmFtZXNUYWxseScsXG4gICAgJ21hcHBpbmdQcm9ncmVzc0FzUGVyY2VudCcsXG4gICAgJ2JvZ3VzRWRpdGVkTGFiZWxDb3VudGVyJyxcbiAgICAndG9nZ2xlTWFwcGluZ0Zvck5hbWUnLFxuICAgICd0b2dnbGVBbGxNYXBwaW5nQ2hlY2tib3hlcycsXG4gICAgJ3Byb3Bvc2VkTWFwcGluZycsXG4gICAgJ2FkanVzdGVkTGFiZWxPckVtcHR5JyxcbiAgICAnY3VycmVudGx5TWFwcGluZ05hbWVzJyxcbiAgICAnZmFpbGVkTWFwcGluZ05hbWVzJyxcbiAgICAnZWRpdE5hbWVMYWJlbCcsXG4gICAgJ3JldmVydE5hbWVMYWJlbCcsXG4gICAgJ21vZGlmeUVkaXRlZExhYmVsJyxcbiAgICAnYXBwcm92ZVByb3Bvc2VkTmFtZUxhYmVsJyxcbiAgICAnYXBwcm92ZVByb3Bvc2VkTmFtZU1hcHBpbmdPcHRpb24nLFxuICAgICdhcHByb3ZlQWxsVmlzaWJsZU1hcHBpbmdzJyxcbiAgICAncmVqZWN0UHJvcG9zZWROYW1lTGFiZWwnLFxuICAgICdyZWplY3RBbGxWaXNpYmxlTWFwcGluZ3MnLFxuICAgICdtYXBOYW1lVG9UYXhvbicsXG4gICAgJ3VubWFwTmFtZUZyb21UYXhvbicsXG4gICAgJ2NsZWFyU2VsZWN0ZWRNYXBwaW5ncycsXG4gICAgJ2NsZWFyQWxsTWFwcGluZ3MnLFxuICAgICdzaG93UG9zc2libGVNYXBwaW5nc0tleScsXG4gICAgJ2FkZFN1YnN0aXR1dGlvbicsXG4gICAgJ3JlbW92ZVN1YnN0aXR1dGlvbicsXG4gICAgJ2Zvcm1hdElTT0RhdGUnLFxuICAgICdjb252ZXJ0VG9OYW1lc2V0TW9kZWwnLFxuICAgICdjb250ZXh0J1xuXTtcbiQuZWFjaChhcGksIGZ1bmN0aW9uKGksIG1ldGhvZE5hbWUpIHtcbiAgICAvLyBwb3B1bGF0ZSB0aGUgZGVmYXVsdCAnbW9kdWxlLmV4cG9ydHMnIG9iamVjdFxuICAgIGV4cG9ydHNbIG1ldGhvZE5hbWUgXSA9IGV2YWwoIG1ldGhvZE5hbWUgKTtcbn0pO1xuIl19
