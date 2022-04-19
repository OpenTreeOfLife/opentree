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

},{"./support/isBuffer":3,"_process":13,"inherits":2}],5:[function(require,module,exports){
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

},{"buffer":7,"timers":14}],11:[function(require,module,exports){
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
/* @license
Papa Parse
v5.3.2
https://github.com/mholt/PapaParse
License: MIT
*/
!function(e,t){"function"==typeof define&&define.amd?define([],t):"object"==typeof module&&"undefined"!=typeof exports?module.exports=t():e.Papa=t()}(this,function s(){"use strict";var f="undefined"!=typeof self?self:"undefined"!=typeof window?window:void 0!==f?f:{};var n=!f.document&&!!f.postMessage,o=n&&/blob:/i.test((f.location||{}).protocol),a={},h=0,b={parse:function(e,t){var i=(t=t||{}).dynamicTyping||!1;M(i)&&(t.dynamicTypingFunction=i,i={});if(t.dynamicTyping=i,t.transform=!!M(t.transform)&&t.transform,t.worker&&b.WORKERS_SUPPORTED){var r=function(){if(!b.WORKERS_SUPPORTED)return!1;var e=(i=f.URL||f.webkitURL||null,r=s.toString(),b.BLOB_URL||(b.BLOB_URL=i.createObjectURL(new Blob(["(",r,")();"],{type:"text/javascript"})))),t=new f.Worker(e);var i,r;return t.onmessage=_,t.id=h++,a[t.id]=t}();return r.userStep=t.step,r.userChunk=t.chunk,r.userComplete=t.complete,r.userError=t.error,t.step=M(t.step),t.chunk=M(t.chunk),t.complete=M(t.complete),t.error=M(t.error),delete t.worker,void r.postMessage({input:e,config:t,workerId:r.id})}var n=null;b.NODE_STREAM_INPUT,"string"==typeof e?n=t.download?new l(t):new p(t):!0===e.readable&&M(e.read)&&M(e.on)?n=new g(t):(f.File&&e instanceof File||e instanceof Object)&&(n=new c(t));return n.stream(e)},unparse:function(e,t){var n=!1,_=!0,m=",",y="\r\n",s='"',a=s+s,i=!1,r=null,o=!1;!function(){if("object"!=typeof t)return;"string"!=typeof t.delimiter||b.BAD_DELIMITERS.filter(function(e){return-1!==t.delimiter.indexOf(e)}).length||(m=t.delimiter);("boolean"==typeof t.quotes||"function"==typeof t.quotes||Array.isArray(t.quotes))&&(n=t.quotes);"boolean"!=typeof t.skipEmptyLines&&"string"!=typeof t.skipEmptyLines||(i=t.skipEmptyLines);"string"==typeof t.newline&&(y=t.newline);"string"==typeof t.quoteChar&&(s=t.quoteChar);"boolean"==typeof t.header&&(_=t.header);if(Array.isArray(t.columns)){if(0===t.columns.length)throw new Error("Option columns is empty");r=t.columns}void 0!==t.escapeChar&&(a=t.escapeChar+s);("boolean"==typeof t.escapeFormulae||t.escapeFormulae instanceof RegExp)&&(o=t.escapeFormulae instanceof RegExp?t.escapeFormulae:/^[=+\-@\t\r].*$/)}();var h=new RegExp(j(s),"g");"string"==typeof e&&(e=JSON.parse(e));if(Array.isArray(e)){if(!e.length||Array.isArray(e[0]))return u(null,e,i);if("object"==typeof e[0])return u(r||Object.keys(e[0]),e,i)}else if("object"==typeof e)return"string"==typeof e.data&&(e.data=JSON.parse(e.data)),Array.isArray(e.data)&&(e.fields||(e.fields=e.meta&&e.meta.fields||r),e.fields||(e.fields=Array.isArray(e.data[0])?e.fields:"object"==typeof e.data[0]?Object.keys(e.data[0]):[]),Array.isArray(e.data[0])||"object"==typeof e.data[0]||(e.data=[e.data])),u(e.fields||[],e.data||[],i);throw new Error("Unable to serialize unrecognized input");function u(e,t,i){var r="";"string"==typeof e&&(e=JSON.parse(e)),"string"==typeof t&&(t=JSON.parse(t));var n=Array.isArray(e)&&0<e.length,s=!Array.isArray(t[0]);if(n&&_){for(var a=0;a<e.length;a++)0<a&&(r+=m),r+=v(e[a],a);0<t.length&&(r+=y)}for(var o=0;o<t.length;o++){var h=n?e.length:t[o].length,u=!1,f=n?0===Object.keys(t[o]).length:0===t[o].length;if(i&&!n&&(u="greedy"===i?""===t[o].join("").trim():1===t[o].length&&0===t[o][0].length),"greedy"===i&&n){for(var d=[],l=0;l<h;l++){var c=s?e[l]:l;d.push(t[o][c])}u=""===d.join("").trim()}if(!u){for(var p=0;p<h;p++){0<p&&!f&&(r+=m);var g=n&&s?e[p]:p;r+=v(t[o][g],p)}o<t.length-1&&(!i||0<h&&!f)&&(r+=y)}}return r}function v(e,t){if(null==e)return"";if(e.constructor===Date)return JSON.stringify(e).slice(1,25);var i=!1;o&&"string"==typeof e&&o.test(e)&&(e="'"+e,i=!0);var r=e.toString().replace(h,a);return(i=i||!0===n||"function"==typeof n&&n(e,t)||Array.isArray(n)&&n[t]||function(e,t){for(var i=0;i<t.length;i++)if(-1<e.indexOf(t[i]))return!0;return!1}(r,b.BAD_DELIMITERS)||-1<r.indexOf(m)||" "===r.charAt(0)||" "===r.charAt(r.length-1))?s+r+s:r}}};if(b.RECORD_SEP=String.fromCharCode(30),b.UNIT_SEP=String.fromCharCode(31),b.BYTE_ORDER_MARK="\ufeff",b.BAD_DELIMITERS=["\r","\n",'"',b.BYTE_ORDER_MARK],b.WORKERS_SUPPORTED=!n&&!!f.Worker,b.NODE_STREAM_INPUT=1,b.LocalChunkSize=10485760,b.RemoteChunkSize=5242880,b.DefaultDelimiter=",",b.Parser=E,b.ParserHandle=i,b.NetworkStreamer=l,b.FileStreamer=c,b.StringStreamer=p,b.ReadableStreamStreamer=g,f.jQuery){var d=f.jQuery;d.fn.parse=function(o){var i=o.config||{},h=[];return this.each(function(e){if(!("INPUT"===d(this).prop("tagName").toUpperCase()&&"file"===d(this).attr("type").toLowerCase()&&f.FileReader)||!this.files||0===this.files.length)return!0;for(var t=0;t<this.files.length;t++)h.push({file:this.files[t],inputElem:this,instanceConfig:d.extend({},i)})}),e(),this;function e(){if(0!==h.length){var e,t,i,r,n=h[0];if(M(o.before)){var s=o.before(n.file,n.inputElem);if("object"==typeof s){if("abort"===s.action)return e="AbortError",t=n.file,i=n.inputElem,r=s.reason,void(M(o.error)&&o.error({name:e},t,i,r));if("skip"===s.action)return void u();"object"==typeof s.config&&(n.instanceConfig=d.extend(n.instanceConfig,s.config))}else if("skip"===s)return void u()}var a=n.instanceConfig.complete;n.instanceConfig.complete=function(e){M(a)&&a(e,n.file,n.inputElem),u()},b.parse(n.file,n.instanceConfig)}else M(o.complete)&&o.complete()}function u(){h.splice(0,1),e()}}}function u(e){this._handle=null,this._finished=!1,this._completed=!1,this._halted=!1,this._input=null,this._baseIndex=0,this._partialLine="",this._rowCount=0,this._start=0,this._nextChunk=null,this.isFirstChunk=!0,this._completeResults={data:[],errors:[],meta:{}},function(e){var t=w(e);t.chunkSize=parseInt(t.chunkSize),e.step||e.chunk||(t.chunkSize=null);this._handle=new i(t),(this._handle.streamer=this)._config=t}.call(this,e),this.parseChunk=function(e,t){if(this.isFirstChunk&&M(this._config.beforeFirstChunk)){var i=this._config.beforeFirstChunk(e);void 0!==i&&(e=i)}this.isFirstChunk=!1,this._halted=!1;var r=this._partialLine+e;this._partialLine="";var n=this._handle.parse(r,this._baseIndex,!this._finished);if(!this._handle.paused()&&!this._handle.aborted()){var s=n.meta.cursor;this._finished||(this._partialLine=r.substring(s-this._baseIndex),this._baseIndex=s),n&&n.data&&(this._rowCount+=n.data.length);var a=this._finished||this._config.preview&&this._rowCount>=this._config.preview;if(o)f.postMessage({results:n,workerId:b.WORKER_ID,finished:a});else if(M(this._config.chunk)&&!t){if(this._config.chunk(n,this._handle),this._handle.paused()||this._handle.aborted())return void(this._halted=!0);n=void 0,this._completeResults=void 0}return this._config.step||this._config.chunk||(this._completeResults.data=this._completeResults.data.concat(n.data),this._completeResults.errors=this._completeResults.errors.concat(n.errors),this._completeResults.meta=n.meta),this._completed||!a||!M(this._config.complete)||n&&n.meta.aborted||(this._config.complete(this._completeResults,this._input),this._completed=!0),a||n&&n.meta.paused||this._nextChunk(),n}this._halted=!0},this._sendError=function(e){M(this._config.error)?this._config.error(e):o&&this._config.error&&f.postMessage({workerId:b.WORKER_ID,error:e,finished:!1})}}function l(e){var r;(e=e||{}).chunkSize||(e.chunkSize=b.RemoteChunkSize),u.call(this,e),this._nextChunk=n?function(){this._readChunk(),this._chunkLoaded()}:function(){this._readChunk()},this.stream=function(e){this._input=e,this._nextChunk()},this._readChunk=function(){if(this._finished)this._chunkLoaded();else{if(r=new XMLHttpRequest,this._config.withCredentials&&(r.withCredentials=this._config.withCredentials),n||(r.onload=v(this._chunkLoaded,this),r.onerror=v(this._chunkError,this)),r.open(this._config.downloadRequestBody?"POST":"GET",this._input,!n),this._config.downloadRequestHeaders){var e=this._config.downloadRequestHeaders;for(var t in e)r.setRequestHeader(t,e[t])}if(this._config.chunkSize){var i=this._start+this._config.chunkSize-1;r.setRequestHeader("Range","bytes="+this._start+"-"+i)}try{r.send(this._config.downloadRequestBody)}catch(e){this._chunkError(e.message)}n&&0===r.status&&this._chunkError()}},this._chunkLoaded=function(){4===r.readyState&&(r.status<200||400<=r.status?this._chunkError():(this._start+=this._config.chunkSize?this._config.chunkSize:r.responseText.length,this._finished=!this._config.chunkSize||this._start>=function(e){var t=e.getResponseHeader("Content-Range");if(null===t)return-1;return parseInt(t.substring(t.lastIndexOf("/")+1))}(r),this.parseChunk(r.responseText)))},this._chunkError=function(e){var t=r.statusText||e;this._sendError(new Error(t))}}function c(e){var r,n;(e=e||{}).chunkSize||(e.chunkSize=b.LocalChunkSize),u.call(this,e);var s="undefined"!=typeof FileReader;this.stream=function(e){this._input=e,n=e.slice||e.webkitSlice||e.mozSlice,s?((r=new FileReader).onload=v(this._chunkLoaded,this),r.onerror=v(this._chunkError,this)):r=new FileReaderSync,this._nextChunk()},this._nextChunk=function(){this._finished||this._config.preview&&!(this._rowCount<this._config.preview)||this._readChunk()},this._readChunk=function(){var e=this._input;if(this._config.chunkSize){var t=Math.min(this._start+this._config.chunkSize,this._input.size);e=n.call(e,this._start,t)}var i=r.readAsText(e,this._config.encoding);s||this._chunkLoaded({target:{result:i}})},this._chunkLoaded=function(e){this._start+=this._config.chunkSize,this._finished=!this._config.chunkSize||this._start>=this._input.size,this.parseChunk(e.target.result)},this._chunkError=function(){this._sendError(r.error)}}function p(e){var i;u.call(this,e=e||{}),this.stream=function(e){return i=e,this._nextChunk()},this._nextChunk=function(){if(!this._finished){var e,t=this._config.chunkSize;return t?(e=i.substring(0,t),i=i.substring(t)):(e=i,i=""),this._finished=!i,this.parseChunk(e)}}}function g(e){u.call(this,e=e||{});var t=[],i=!0,r=!1;this.pause=function(){u.prototype.pause.apply(this,arguments),this._input.pause()},this.resume=function(){u.prototype.resume.apply(this,arguments),this._input.resume()},this.stream=function(e){this._input=e,this._input.on("data",this._streamData),this._input.on("end",this._streamEnd),this._input.on("error",this._streamError)},this._checkIsFinished=function(){r&&1===t.length&&(this._finished=!0)},this._nextChunk=function(){this._checkIsFinished(),t.length?this.parseChunk(t.shift()):i=!0},this._streamData=v(function(e){try{t.push("string"==typeof e?e:e.toString(this._config.encoding)),i&&(i=!1,this._checkIsFinished(),this.parseChunk(t.shift()))}catch(e){this._streamError(e)}},this),this._streamError=v(function(e){this._streamCleanUp(),this._sendError(e)},this),this._streamEnd=v(function(){this._streamCleanUp(),r=!0,this._streamData("")},this),this._streamCleanUp=v(function(){this._input.removeListener("data",this._streamData),this._input.removeListener("end",this._streamEnd),this._input.removeListener("error",this._streamError)},this)}function i(m){var a,o,h,r=Math.pow(2,53),n=-r,s=/^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/,u=/^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/,t=this,i=0,f=0,d=!1,e=!1,l=[],c={data:[],errors:[],meta:{}};if(M(m.step)){var p=m.step;m.step=function(e){if(c=e,_())g();else{if(g(),0===c.data.length)return;i+=e.data.length,m.preview&&i>m.preview?o.abort():(c.data=c.data[0],p(c,t))}}}function y(e){return"greedy"===m.skipEmptyLines?""===e.join("").trim():1===e.length&&0===e[0].length}function g(){return c&&h&&(k("Delimiter","UndetectableDelimiter","Unable to auto-detect delimiting character; defaulted to '"+b.DefaultDelimiter+"'"),h=!1),m.skipEmptyLines&&(c.data=c.data.filter(function(e){return!y(e)})),_()&&function(){if(!c)return;function e(e,t){M(m.transformHeader)&&(e=m.transformHeader(e,t)),l.push(e)}if(Array.isArray(c.data[0])){for(var t=0;_()&&t<c.data.length;t++)c.data[t].forEach(e);c.data.splice(0,1)}else c.data.forEach(e)}(),function(){if(!c||!m.header&&!m.dynamicTyping&&!m.transform)return c;function e(e,t){var i,r=m.header?{}:[];for(i=0;i<e.length;i++){var n=i,s=e[i];m.header&&(n=i>=l.length?"__parsed_extra":l[i]),m.transform&&(s=m.transform(s,n)),s=v(n,s),"__parsed_extra"===n?(r[n]=r[n]||[],r[n].push(s)):r[n]=s}return m.header&&(i>l.length?k("FieldMismatch","TooManyFields","Too many fields: expected "+l.length+" fields but parsed "+i,f+t):i<l.length&&k("FieldMismatch","TooFewFields","Too few fields: expected "+l.length+" fields but parsed "+i,f+t)),r}var t=1;!c.data.length||Array.isArray(c.data[0])?(c.data=c.data.map(e),t=c.data.length):c.data=e(c.data,0);m.header&&c.meta&&(c.meta.fields=l);return f+=t,c}()}function _(){return m.header&&0===l.length}function v(e,t){return i=e,m.dynamicTypingFunction&&void 0===m.dynamicTyping[i]&&(m.dynamicTyping[i]=m.dynamicTypingFunction(i)),!0===(m.dynamicTyping[i]||m.dynamicTyping)?"true"===t||"TRUE"===t||"false"!==t&&"FALSE"!==t&&(function(e){if(s.test(e)){var t=parseFloat(e);if(n<t&&t<r)return!0}return!1}(t)?parseFloat(t):u.test(t)?new Date(t):""===t?null:t):t;var i}function k(e,t,i,r){var n={type:e,code:t,message:i};void 0!==r&&(n.row=r),c.errors.push(n)}this.parse=function(e,t,i){var r=m.quoteChar||'"';if(m.newline||(m.newline=function(e,t){e=e.substring(0,1048576);var i=new RegExp(j(t)+"([^]*?)"+j(t),"gm"),r=(e=e.replace(i,"")).split("\r"),n=e.split("\n"),s=1<n.length&&n[0].length<r[0].length;if(1===r.length||s)return"\n";for(var a=0,o=0;o<r.length;o++)"\n"===r[o][0]&&a++;return a>=r.length/2?"\r\n":"\r"}(e,r)),h=!1,m.delimiter)M(m.delimiter)&&(m.delimiter=m.delimiter(e),c.meta.delimiter=m.delimiter);else{var n=function(e,t,i,r,n){var s,a,o,h;n=n||[",","\t","|",";",b.RECORD_SEP,b.UNIT_SEP];for(var u=0;u<n.length;u++){var f=n[u],d=0,l=0,c=0;o=void 0;for(var p=new E({comments:r,delimiter:f,newline:t,preview:10}).parse(e),g=0;g<p.data.length;g++)if(i&&y(p.data[g]))c++;else{var _=p.data[g].length;l+=_,void 0!==o?0<_&&(d+=Math.abs(_-o),o=_):o=_}0<p.data.length&&(l/=p.data.length-c),(void 0===a||d<=a)&&(void 0===h||h<l)&&1.99<l&&(a=d,s=f,h=l)}return{successful:!!(m.delimiter=s),bestDelimiter:s}}(e,m.newline,m.skipEmptyLines,m.comments,m.delimitersToGuess);n.successful?m.delimiter=n.bestDelimiter:(h=!0,m.delimiter=b.DefaultDelimiter),c.meta.delimiter=m.delimiter}var s=w(m);return m.preview&&m.header&&s.preview++,a=e,o=new E(s),c=o.parse(a,t,i),g(),d?{meta:{paused:!0}}:c||{meta:{paused:!1}}},this.paused=function(){return d},this.pause=function(){d=!0,o.abort(),a=M(m.chunk)?"":a.substring(o.getCharIndex())},this.resume=function(){t.streamer._halted?(d=!1,t.streamer.parseChunk(a,!0)):setTimeout(t.resume,3)},this.aborted=function(){return e},this.abort=function(){e=!0,o.abort(),c.meta.aborted=!0,M(m.complete)&&m.complete(c),a=""}}function j(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function E(e){var S,O=(e=e||{}).delimiter,x=e.newline,I=e.comments,T=e.step,D=e.preview,A=e.fastMode,L=S=void 0===e.quoteChar||null===e.quoteChar?'"':e.quoteChar;if(void 0!==e.escapeChar&&(L=e.escapeChar),("string"!=typeof O||-1<b.BAD_DELIMITERS.indexOf(O))&&(O=","),I===O)throw new Error("Comment character same as delimiter");!0===I?I="#":("string"!=typeof I||-1<b.BAD_DELIMITERS.indexOf(I))&&(I=!1),"\n"!==x&&"\r"!==x&&"\r\n"!==x&&(x="\n");var F=0,z=!1;this.parse=function(r,t,i){if("string"!=typeof r)throw new Error("Input must be a string");var n=r.length,e=O.length,s=x.length,a=I.length,o=M(T),h=[],u=[],f=[],d=F=0;if(!r)return C();if(A||!1!==A&&-1===r.indexOf(S)){for(var l=r.split(x),c=0;c<l.length;c++){if(f=l[c],F+=f.length,c!==l.length-1)F+=x.length;else if(i)return C();if(!I||f.substring(0,a)!==I){if(o){if(h=[],k(f.split(O)),R(),z)return C()}else k(f.split(O));if(D&&D<=c)return h=h.slice(0,D),C(!0)}}return C()}for(var p=r.indexOf(O,F),g=r.indexOf(x,F),_=new RegExp(j(L)+j(S),"g"),m=r.indexOf(S,F);;)if(r[F]!==S)if(I&&0===f.length&&r.substring(F,F+a)===I){if(-1===g)return C();F=g+s,g=r.indexOf(x,F),p=r.indexOf(O,F)}else if(-1!==p&&(p<g||-1===g))f.push(r.substring(F,p)),F=p+e,p=r.indexOf(O,F);else{if(-1===g)break;if(f.push(r.substring(F,g)),w(g+s),o&&(R(),z))return C();if(D&&h.length>=D)return C(!0)}else for(m=F,F++;;){if(-1===(m=r.indexOf(S,m+1)))return i||u.push({type:"Quotes",code:"MissingQuotes",message:"Quoted field unterminated",row:h.length,index:F}),E();if(m===n-1)return E(r.substring(F,m).replace(_,S));if(S!==L||r[m+1]!==L){if(S===L||0===m||r[m-1]!==L){-1!==p&&p<m+1&&(p=r.indexOf(O,m+1)),-1!==g&&g<m+1&&(g=r.indexOf(x,m+1));var y=b(-1===g?p:Math.min(p,g));if(r.substr(m+1+y,e)===O){f.push(r.substring(F,m).replace(_,S)),r[F=m+1+y+e]!==S&&(m=r.indexOf(S,F)),p=r.indexOf(O,F),g=r.indexOf(x,F);break}var v=b(g);if(r.substring(m+1+v,m+1+v+s)===x){if(f.push(r.substring(F,m).replace(_,S)),w(m+1+v+s),p=r.indexOf(O,F),m=r.indexOf(S,F),o&&(R(),z))return C();if(D&&h.length>=D)return C(!0);break}u.push({type:"Quotes",code:"InvalidQuotes",message:"Trailing quote on quoted field is malformed",row:h.length,index:F}),m++}}else m++}return E();function k(e){h.push(e),d=F}function b(e){var t=0;if(-1!==e){var i=r.substring(m+1,e);i&&""===i.trim()&&(t=i.length)}return t}function E(e){return i||(void 0===e&&(e=r.substring(F)),f.push(e),F=n,k(f),o&&R()),C()}function w(e){F=e,k(f),f=[],g=r.indexOf(x,F)}function C(e){return{data:h,errors:u,meta:{delimiter:O,linebreak:x,aborted:z,truncated:!!e,cursor:d+(t||0)}}}function R(){T(C()),h=[],u=[]}},this.abort=function(){z=!0},this.getCharIndex=function(){return F}}function _(e){var t=e.data,i=a[t.workerId],r=!1;if(t.error)i.userError(t.error,t.file);else if(t.results&&t.results.data){var n={abort:function(){r=!0,m(t.workerId,{data:[],errors:[],meta:{aborted:!0}})},pause:y,resume:y};if(M(i.userStep)){for(var s=0;s<t.results.data.length&&(i.userStep({data:t.results.data[s],errors:t.results.errors,meta:t.results.meta},n),!r);s++);delete t.results}else M(i.userChunk)&&(i.userChunk(t.results,n,t.file),delete t.results)}t.finished&&!r&&m(t.workerId,t.results)}function m(e,t){var i=a[e];M(i.userComplete)&&i.userComplete(t),i.terminate(),delete a[e]}function y(){throw new Error("Not implemented.")}function w(e){if("object"!=typeof e||null===e)return e;var t=Array.isArray(e)?[]:{};for(var i in e)t[i]=w(e[i]);return t}function v(e,t){return function(){e.apply(t,arguments)}}function M(e){return"function"==typeof e}return o&&(f.onmessage=function(e){var t=e.data;void 0===b.WORKER_ID&&t&&(b.WORKER_ID=t.workerId);if("string"==typeof t.input)f.postMessage({workerId:b.WORKER_ID,results:b.parse(t.input,t.config),finished:!0});else if(f.File&&t.input instanceof File||t.input instanceof Object){var i=b.parse(t.input,t.config);i&&f.postMessage({workerId:b.WORKER_ID,results:i,finished:!0})}}),(l.prototype=Object.create(u.prototype)).constructor=l,(c.prototype=Object.create(u.prototype)).constructor=c,(p.prototype=Object.create(p.prototype)).constructor=p,(g.prototype=Object.create(u.prototype)).constructor=g,b});
},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"process/browser.js":13,"timers":14}],15:[function(require,module,exports){
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
    Papa = require('papaparse'),
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

var papaParseConfig = {
    /* Try to accomodate different delimiters, line endings, etc.
     * For all settings and default values, see <https://www.papaparse.com/docs#config>
     */
    delimiter: "",	// auto-detect
	newline: "",	// auto-detect
    escapeChar: "\\",
    skipEmptyLines: 'greedy',  // skip empty AND whitespace-only lines
    //complete: fn  // callback function to receive parse results
    //error: fn     // callback if an error was encountered
    header: false   // detect optional header row and remove after parsing?
}
function convertToNamesetModel( listText ) {
    /* Test for proper delimited text (TSV or CSV, with a pair of names on each line).
     * The first value on each line is a vernacular label, the second its mapped taxon name.
     */
    var nameset = getNewNamesetModel();  // we'll add name pairs to this
    // attempt to parse the delimited text provided
    var parseResults = Papa.parse(listText, papaParseConfig);
    var parseErrorMessage = "";
    if (parseResults.meta.aborted) {
        console.error("Delimited text parsing ABORTED!");
        parseErrorMessage += "Delimited text parsing ABORTED!\n\n";
    }
    // still here? then we at least have some names (or headers) to return
    $.each(parseResults.errors, function(i, parseError) {
        console.error("  Parsing error on line "+ parseError.row +": "+ parseError.code +" ("+ parseError.message +")");
        parseErrorMessage += "  Parsing error on line "+ parseError.row +": "+ parseError.code +" ("+ parseError.message +")\n";
    });
    if (parseResults.meta.aborted) {
        showErrorMessage(parseErrorMessage);
        return nameset;  // probably still empty
    }

    // now apply labels and keep count of any duplicate labels
    var foundLabels = [ ];
    var dupeLabelsFound = 0;
    var rows = parseResults.data;  // an array of parsed rows (each an array of values)
    console.warn( rows.length +" lines found with line delimiter '"+ parseResults.meta.linebreak +"'");

    var localNameNumber = 0;  // these are not imported, so local integers are find
    $.each(rows, function(i, items) {
        // filter out empty items (eg, labels and taxa) on this row
        items = $.grep(items, function(item, i) {
            return $.trim(item) !== "";
        });
        switch (items.length) {
            case 0:
            case 1:
                return true;  // skip to next line
            default:
                // we assume the same fields as in our nameset output files
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

},{"assert":1,"blob-polyfill":6,"file-saver":8,"jszip":10,"papaparse":12}]},{},[15])(15)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Fzc2VydC9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwibm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ibG9iLXBvbHlmaWxsL0Jsb2IuanMiLCJub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZpbGUtc2F2ZXIvRmlsZVNhdmVyLmpzIiwibm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvanN6aXAvZGlzdC9qc3ppcC5taW4uanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWFzc2lnbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYXBhcGFyc2UvcGFwYXBhcnNlLm1pbi5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsInRucnMtbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2p2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIid1c2Ugc3RyaWN0JztcblxudmFyIG9iamVjdEFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxuLy8gY29tcGFyZSBhbmQgaXNCdWZmZXIgdGFrZW4gZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9ibG9iLzY4MGU5ZTVlNDg4ZjIyYWFjMjc1OTlhNTdkYzg0NGE2MzE1OTI4ZGQvaW5kZXguanNcbi8vIG9yaWdpbmFsIG5vdGljZTpcblxuLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuZnVuY3Rpb24gY29tcGFyZShhLCBiKSB7XG4gIGlmIChhID09PSBiKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICB2YXIgeCA9IGEubGVuZ3RoO1xuICB2YXIgeSA9IGIubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldO1xuICAgICAgeSA9IGJbaV07XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKHkgPCB4KSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBpc0J1ZmZlcihiKSB7XG4gIGlmIChnbG9iYWwuQnVmZmVyICYmIHR5cGVvZiBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIoYik7XG4gIH1cbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcik7XG59XG5cbi8vIGJhc2VkIG9uIG5vZGUgYXNzZXJ0LCBvcmlnaW5hbCBub3RpY2U6XG4vLyBOQjogVGhlIFVSTCB0byB0aGUgQ29tbW9uSlMgc3BlYyBpcyBrZXB0IGp1c3QgZm9yIHRyYWRpdGlvbi5cbi8vICAgICBub2RlLWFzc2VydCBoYXMgZXZvbHZlZCBhIGxvdCBzaW5jZSB0aGVuLCBib3RoIGluIEFQSSBhbmQgYmVoYXZpb3IuXG5cbi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgZnVuY3Rpb25zSGF2ZU5hbWVzID0gKGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGZvbygpIHt9Lm5hbWUgPT09ICdmb28nO1xufSgpKTtcbmZ1bmN0aW9uIHBUb1N0cmluZyAob2JqKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKTtcbn1cbmZ1bmN0aW9uIGlzVmlldyhhcnJidWYpIHtcbiAgaWYgKGlzQnVmZmVyKGFycmJ1ZikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHR5cGVvZiBnbG9iYWwuQXJyYXlCdWZmZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlci5pc1ZpZXcgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQXJyYXlCdWZmZXIuaXNWaWV3KGFycmJ1Zik7XG4gIH1cbiAgaWYgKCFhcnJidWYpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGFycmJ1ZiBpbnN0YW5jZW9mIERhdGFWaWV3KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGFycmJ1Zi5idWZmZXIgJiYgYXJyYnVmLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxudmFyIHJlZ2V4ID0gL1xccypmdW5jdGlvblxccysoW15cXChcXHNdKilcXHMqLztcbi8vIGJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9samhhcmIvZnVuY3Rpb24ucHJvdG90eXBlLm5hbWUvYmxvYi9hZGVlZWVjOGJmY2M2MDY4YjE4N2Q3ZDlmYjNkNWJiMWQzYTMwODk5L2ltcGxlbWVudGF0aW9uLmpzXG5mdW5jdGlvbiBnZXROYW1lKGZ1bmMpIHtcbiAgaWYgKCF1dGlsLmlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGZ1bmN0aW9uc0hhdmVOYW1lcykge1xuICAgIHJldHVybiBmdW5jLm5hbWU7XG4gIH1cbiAgdmFyIHN0ciA9IGZ1bmMudG9TdHJpbmcoKTtcbiAgdmFyIG1hdGNoID0gc3RyLm1hdGNoKHJlZ2V4KTtcbiAgcmV0dXJuIG1hdGNoICYmIG1hdGNoWzFdO1xufVxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9IGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IGdldE5hbWUoc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHR5cGVvZiBzID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuZnVuY3Rpb24gaW5zcGVjdChzb21ldGhpbmcpIHtcbiAgaWYgKGZ1bmN0aW9uc0hhdmVOYW1lcyB8fCAhdXRpbC5pc0Z1bmN0aW9uKHNvbWV0aGluZykpIHtcbiAgICByZXR1cm4gdXRpbC5pbnNwZWN0KHNvbWV0aGluZyk7XG4gIH1cbiAgdmFyIHJhd25hbWUgPSBnZXROYW1lKHNvbWV0aGluZyk7XG4gIHZhciBuYW1lID0gcmF3bmFtZSA/ICc6ICcgKyByYXduYW1lIDogJyc7XG4gIHJldHVybiAnW0Z1bmN0aW9uJyArICBuYW1lICsgJ10nO1xufVxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShpbnNwZWN0KHNlbGYuYWN0dWFsKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKGluc3BlY3Qoc2VsZi5leHBlY3RlZCksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZhbHNlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5hc3NlcnQuZGVlcFN0cmljdEVxdWFsID0gZnVuY3Rpb24gZGVlcFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHRydWUpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcFN0cmljdEVxdWFsJywgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgc3RyaWN0LCBtZW1vcykge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChpc0J1ZmZlcihhY3R1YWwpICYmIGlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBjb21wYXJlKGFjdHVhbCwgZXhwZWN0ZWQpID09PSAwO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICgoYWN0dWFsID09PSBudWxsIHx8IHR5cGVvZiBhY3R1YWwgIT09ICdvYmplY3QnKSAmJlxuICAgICAgICAgICAgIChleHBlY3RlZCA9PT0gbnVsbCB8fCB0eXBlb2YgZXhwZWN0ZWQgIT09ICdvYmplY3QnKSkge1xuICAgIHJldHVybiBzdHJpY3QgPyBhY3R1YWwgPT09IGV4cGVjdGVkIDogYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIElmIGJvdGggdmFsdWVzIGFyZSBpbnN0YW5jZXMgb2YgdHlwZWQgYXJyYXlzLCB3cmFwIHRoZWlyIHVuZGVybHlpbmdcbiAgLy8gQXJyYXlCdWZmZXJzIGluIGEgQnVmZmVyIGVhY2ggdG8gaW5jcmVhc2UgcGVyZm9ybWFuY2VcbiAgLy8gVGhpcyBvcHRpbWl6YXRpb24gcmVxdWlyZXMgdGhlIGFycmF5cyB0byBoYXZlIHRoZSBzYW1lIHR5cGUgYXMgY2hlY2tlZCBieVxuICAvLyBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nIChha2EgcFRvU3RyaW5nKS4gTmV2ZXIgcGVyZm9ybSBiaW5hcnlcbiAgLy8gY29tcGFyaXNvbnMgZm9yIEZsb2F0KkFycmF5cywgdGhvdWdoLCBzaW5jZSBlLmcuICswID09PSAtMCBidXQgdGhlaXJcbiAgLy8gYml0IHBhdHRlcm5zIGFyZSBub3QgaWRlbnRpY2FsLlxuICB9IGVsc2UgaWYgKGlzVmlldyhhY3R1YWwpICYmIGlzVmlldyhleHBlY3RlZCkgJiZcbiAgICAgICAgICAgICBwVG9TdHJpbmcoYWN0dWFsKSA9PT0gcFRvU3RyaW5nKGV4cGVjdGVkKSAmJlxuICAgICAgICAgICAgICEoYWN0dWFsIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8XG4gICAgICAgICAgICAgICBhY3R1YWwgaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpKSB7XG4gICAgcmV0dXJuIGNvbXBhcmUobmV3IFVpbnQ4QXJyYXkoYWN0dWFsLmJ1ZmZlciksXG4gICAgICAgICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkoZXhwZWN0ZWQuYnVmZmVyKSkgPT09IDA7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIGlmIChpc0J1ZmZlcihhY3R1YWwpICE9PSBpc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbWVtb3MgPSBtZW1vcyB8fCB7YWN0dWFsOiBbXSwgZXhwZWN0ZWQ6IFtdfTtcblxuICAgIHZhciBhY3R1YWxJbmRleCA9IG1lbW9zLmFjdHVhbC5pbmRleE9mKGFjdHVhbCk7XG4gICAgaWYgKGFjdHVhbEluZGV4ICE9PSAtMSkge1xuICAgICAgaWYgKGFjdHVhbEluZGV4ID09PSBtZW1vcy5leHBlY3RlZC5pbmRleE9mKGV4cGVjdGVkKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBtZW1vcy5hY3R1YWwucHVzaChhY3R1YWwpO1xuICAgIG1lbW9zLmV4cGVjdGVkLnB1c2goZXhwZWN0ZWQpO1xuXG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQsIHN0cmljdCwgbWVtb3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIsIHN0cmljdCwgYWN0dWFsVmlzaXRlZE9iamVjdHMpIHtcbiAgaWYgKGEgPT09IG51bGwgfHwgYSA9PT0gdW5kZWZpbmVkIHx8IGIgPT09IG51bGwgfHwgYiA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gaWYgb25lIGlzIGEgcHJpbWl0aXZlLCB0aGUgb3RoZXIgbXVzdCBiZSBzYW1lXG4gIGlmICh1dGlsLmlzUHJpbWl0aXZlKGEpIHx8IHV0aWwuaXNQcmltaXRpdmUoYikpXG4gICAgcmV0dXJuIGEgPT09IGI7XG4gIGlmIChzdHJpY3QgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKGEpICE9PSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB2YXIgYUlzQXJncyA9IGlzQXJndW1lbnRzKGEpO1xuICB2YXIgYklzQXJncyA9IGlzQXJndW1lbnRzKGIpO1xuICBpZiAoKGFJc0FyZ3MgJiYgIWJJc0FyZ3MpIHx8ICghYUlzQXJncyAmJiBiSXNBcmdzKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhSXNBcmdzKSB7XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiLCBzdHJpY3QpO1xuICB9XG4gIHZhciBrYSA9IG9iamVjdEtleXMoYSk7XG4gIHZhciBrYiA9IG9iamVjdEtleXMoYik7XG4gIHZhciBrZXksIGk7XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT09IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9PSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSwgc3RyaWN0LCBhY3R1YWxWaXNpdGVkT2JqZWN0cykpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBmYWxzZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuYXNzZXJ0Lm5vdERlZXBTdHJpY3RFcXVhbCA9IG5vdERlZXBTdHJpY3RFcXVhbDtcbmZ1bmN0aW9uIG5vdERlZXBTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHRydWUpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcFN0cmljdEVxdWFsJywgbm90RGVlcFN0cmljdEVxdWFsKTtcbiAgfVxufVxuXG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBJZ25vcmUuICBUaGUgaW5zdGFuY2VvZiBjaGVjayBkb2Vzbid0IHdvcmsgZm9yIGFycm93IGZ1bmN0aW9ucy5cbiAgfVxuXG4gIGlmIChFcnJvci5pc1Byb3RvdHlwZU9mKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlO1xufVxuXG5mdW5jdGlvbiBfdHJ5QmxvY2soYmxvY2spIHtcbiAgdmFyIGVycm9yO1xuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlcnJvciA9IGU7XG4gIH1cbiAgcmV0dXJuIGVycm9yO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodHlwZW9mIGJsb2NrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJibG9ja1wiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gJ3N0cmluZycpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgYWN0dWFsID0gX3RyeUJsb2NrKGJsb2NrKTtcblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIHZhciB1c2VyUHJvdmlkZWRNZXNzYWdlID0gdHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnO1xuICB2YXIgaXNVbndhbnRlZEV4Y2VwdGlvbiA9ICFzaG91bGRUaHJvdyAmJiB1dGlsLmlzRXJyb3IoYWN0dWFsKTtcbiAgdmFyIGlzVW5leHBlY3RlZEV4Y2VwdGlvbiA9ICFzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgIWV4cGVjdGVkO1xuXG4gIGlmICgoaXNVbndhbnRlZEV4Y2VwdGlvbiAmJlxuICAgICAgdXNlclByb3ZpZGVkTWVzc2FnZSAmJlxuICAgICAgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8XG4gICAgICBpc1VuZXhwZWN0ZWRFeGNlcHRpb24pIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3ModHJ1ZSwgYmxvY2ssIGVycm9yLCBtZXNzYWdlKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzKGZhbHNlLCBibG9jaywgZXJyb3IsIG1lc3NhZ2UpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikgdGhyb3cgZXJyOyB9O1xuXG4vLyBFeHBvc2UgYSBzdHJpY3Qgb25seSB2YXJpYW50IG9mIGFzc2VydFxuZnVuY3Rpb24gc3RyaWN0KHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIHN0cmljdCk7XG59XG5hc3NlcnQuc3RyaWN0ID0gb2JqZWN0QXNzaWduKHN0cmljdCwgYXNzZXJ0LCB7XG4gIGVxdWFsOiBhc3NlcnQuc3RyaWN0RXF1YWwsXG4gIGRlZXBFcXVhbDogYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCxcbiAgbm90RXF1YWw6IGFzc2VydC5ub3RTdHJpY3RFcXVhbCxcbiAgbm90RGVlcEVxdWFsOiBhc3NlcnQubm90RGVlcFN0cmljdEVxdWFsXG59KTtcbmFzc2VydC5zdHJpY3Quc3RyaWN0ID0gYXNzZXJ0LnN0cmljdDtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbnZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG5mb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICBsb29rdXBbaV0gPSBjb2RlW2ldXG4gIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxufVxuXG4vLyBTdXBwb3J0IGRlY29kaW5nIFVSTC1zYWZlIGJhc2U2NCBzdHJpbmdzLCBhcyBOb2RlLmpzIGRvZXMuXG4vLyBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCNVUkxfYXBwbGljYXRpb25zXG5yZXZMb29rdXBbJy0nLmNoYXJDb2RlQXQoMCldID0gNjJcbnJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xuXG5mdW5jdGlvbiBnZXRMZW5zIChiNjQpIHtcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcblxuICBpZiAobGVuICUgNCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuICB9XG5cbiAgLy8gVHJpbSBvZmYgZXh0cmEgYnl0ZXMgYWZ0ZXIgcGxhY2Vob2xkZXIgYnl0ZXMgYXJlIGZvdW5kXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2JlYXRnYW1taXQvYmFzZTY0LWpzL2lzc3Vlcy80MlxuICB2YXIgdmFsaWRMZW4gPSBiNjQuaW5kZXhPZignPScpXG4gIGlmICh2YWxpZExlbiA9PT0gLTEpIHZhbGlkTGVuID0gbGVuXG5cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IHZhbGlkTGVuID09PSBsZW5cbiAgICA/IDBcbiAgICA6IDQgLSAodmFsaWRMZW4gJSA0KVxuXG4gIHJldHVybiBbdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbl1cbn1cblxuLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChiNjQpIHtcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gX2J5dGVMZW5ndGggKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikge1xuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cblxuICB2YXIgYXJyID0gbmV3IEFycihfYnl0ZUxlbmd0aChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pKVxuXG4gIHZhciBjdXJCeXRlID0gMFxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgdmFyIGxlbiA9IHBsYWNlSG9sZGVyc0xlbiA+IDBcbiAgICA/IHZhbGlkTGVuIC0gNFxuICAgIDogdmFsaWRMZW5cblxuICB2YXIgaVxuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTgpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCAxMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildIDw8IDYpIHxcbiAgICAgIHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMyldXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDE2KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAyKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA+PiA0KVxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMSkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxMCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDQpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA+PiAyKVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcbiAgcmV0dXJuIGxvb2t1cFtudW0gPj4gMTggJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArXG4gICAgbG9va3VwW251bSAmIDB4M0ZdXG59XG5cbmZ1bmN0aW9uIGVuY29kZUNodW5rICh1aW50OCwgc3RhcnQsIGVuZCkge1xuICB2YXIgdG1wXG4gIHZhciBvdXRwdXQgPSBbXVxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkgKz0gMykge1xuICAgIHRtcCA9XG4gICAgICAoKHVpbnQ4W2ldIDw8IDE2KSAmIDB4RkYwMDAwKSArXG4gICAgICAoKHVpbnQ4W2kgKyAxXSA8PCA4KSAmIDB4RkYwMCkgK1xuICAgICAgKHVpbnQ4W2kgKyAyXSAmIDB4RkYpXG4gICAgb3V0cHV0LnB1c2godHJpcGxldFRvQmFzZTY0KHRtcCkpXG4gIH1cbiAgcmV0dXJuIG91dHB1dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmcm9tQnl0ZUFycmF5ICh1aW50OCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW4gPSB1aW50OC5sZW5ndGhcbiAgdmFyIGV4dHJhQnl0ZXMgPSBsZW4gJSAzIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG4gIHZhciBwYXJ0cyA9IFtdXG4gIHZhciBtYXhDaHVua0xlbmd0aCA9IDE2MzgzIC8vIG11c3QgYmUgbXVsdGlwbGUgb2YgM1xuXG4gIC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbjIgPSBsZW4gLSBleHRyYUJ5dGVzOyBpIDwgbGVuMjsgaSArPSBtYXhDaHVua0xlbmd0aCkge1xuICAgIHBhcnRzLnB1c2goZW5jb2RlQ2h1bmsodWludDgsIGksIChpICsgbWF4Q2h1bmtMZW5ndGgpID4gbGVuMiA/IGxlbjIgOiAoaSArIG1heENodW5rTGVuZ3RoKSkpXG4gIH1cblxuICAvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG4gIGlmIChleHRyYUJ5dGVzID09PSAxKSB7XG4gICAgdG1wID0gdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAyXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCA0KSAmIDB4M0ZdICtcbiAgICAgICc9PSdcbiAgICApXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArIHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMTBdICtcbiAgICAgIGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXSArXG4gICAgICAnPSdcbiAgICApXG4gIH1cblxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsIi8qIEJsb2IuanNcbiAqIEEgQmxvYiBpbXBsZW1lbnRhdGlvbi5cbiAqIDIwMTQtMDctMjRcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBCeSBEZXZpbiBTYW1hcmluLCBodHRwczovL2dpdGh1Yi5jb20vZHNhbWFyaW5cbiAqIExpY2Vuc2U6IFgxMS9NSVRcbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L0Jsb2IuanMvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxuICovXG5cbi8qZ2xvYmFsIHNlbGYsIHVuZXNjYXBlICovXG4vKmpzbGludCBiaXR3aXNlOiB0cnVlLCByZWdleHA6IHRydWUsIGNvbmZ1c2lvbjogdHJ1ZSwgZXM1OiB0cnVlLCB2YXJzOiB0cnVlLCB3aGl0ZTogdHJ1ZSxcbiAgcGx1c3BsdXM6IHRydWUgKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL0Jsb2IuanMvYmxvYi9tYXN0ZXIvQmxvYi5qcyAqL1xuXG4oZnVuY3Rpb24gKHZpZXcpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmlldy5VUkwgPSB2aWV3LlVSTCB8fCB2aWV3LndlYmtpdFVSTDtcblxuXHRpZiAodmlldy5CbG9iICYmIHZpZXcuVVJMKSB7XG5cdFx0dHJ5IHtcblx0XHRcdG5ldyBCbG9iO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH0gY2F0Y2ggKGUpIHt9XG5cdH1cblxuXHQvLyBJbnRlcm5hbGx5IHdlIHVzZSBhIEJsb2JCdWlsZGVyIGltcGxlbWVudGF0aW9uIHRvIGJhc2UgQmxvYiBvZmYgb2Zcblx0Ly8gaW4gb3JkZXIgdG8gc3VwcG9ydCBvbGRlciBicm93c2VycyB0aGF0IG9ubHkgaGF2ZSBCbG9iQnVpbGRlclxuXHR2YXIgQmxvYkJ1aWxkZXIgPSB2aWV3LkJsb2JCdWlsZGVyIHx8IHZpZXcuV2ViS2l0QmxvYkJ1aWxkZXIgfHwgdmlldy5Nb3pCbG9iQnVpbGRlciB8fCAoZnVuY3Rpb24odmlldykge1xuXHRcdHZhclxuXHRcdFx0ICBnZXRfY2xhc3MgPSBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRcdFx0cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpLm1hdGNoKC9eXFxbb2JqZWN0XFxzKC4qKVxcXSQvKVsxXTtcblx0XHRcdH1cblx0XHRcdCwgRmFrZUJsb2JCdWlsZGVyID0gZnVuY3Rpb24gQmxvYkJ1aWxkZXIoKSB7XG5cdFx0XHRcdHRoaXMuZGF0YSA9IFtdO1xuXHRcdFx0fVxuXHRcdFx0LCBGYWtlQmxvYiA9IGZ1bmN0aW9uIEJsb2IoZGF0YSwgdHlwZSwgZW5jb2RpbmcpIHtcblx0XHRcdFx0dGhpcy5kYXRhID0gZGF0YTtcblx0XHRcdFx0dGhpcy5zaXplID0gZGF0YS5sZW5ndGg7XG5cdFx0XHRcdHRoaXMudHlwZSA9IHR5cGU7XG5cdFx0XHRcdHRoaXMuZW5jb2RpbmcgPSBlbmNvZGluZztcblx0XHRcdH1cblx0XHRcdCwgRkJCX3Byb3RvID0gRmFrZUJsb2JCdWlsZGVyLnByb3RvdHlwZVxuXHRcdFx0LCBGQl9wcm90byA9IEZha2VCbG9iLnByb3RvdHlwZVxuXHRcdFx0LCBGaWxlUmVhZGVyU3luYyA9IHZpZXcuRmlsZVJlYWRlclN5bmNcblx0XHRcdCwgRmlsZUV4Y2VwdGlvbiA9IGZ1bmN0aW9uKHR5cGUpIHtcblx0XHRcdFx0dGhpcy5jb2RlID0gdGhpc1t0aGlzLm5hbWUgPSB0eXBlXTtcblx0XHRcdH1cblx0XHRcdCwgZmlsZV9leF9jb2RlcyA9IChcblx0XHRcdFx0ICBcIk5PVF9GT1VORF9FUlIgU0VDVVJJVFlfRVJSIEFCT1JUX0VSUiBOT1RfUkVBREFCTEVfRVJSIEVOQ09ESU5HX0VSUiBcIlxuXHRcdFx0XHQrIFwiTk9fTU9ESUZJQ0FUSU9OX0FMTE9XRURfRVJSIElOVkFMSURfU1RBVEVfRVJSIFNZTlRBWF9FUlJcIlxuXHRcdFx0KS5zcGxpdChcIiBcIilcblx0XHRcdCwgZmlsZV9leF9jb2RlID0gZmlsZV9leF9jb2Rlcy5sZW5ndGhcblx0XHRcdCwgcmVhbF9VUkwgPSB2aWV3LlVSTCB8fCB2aWV3LndlYmtpdFVSTCB8fCB2aWV3XG5cdFx0XHQsIHJlYWxfY3JlYXRlX29iamVjdF9VUkwgPSByZWFsX1VSTC5jcmVhdGVPYmplY3RVUkxcblx0XHRcdCwgcmVhbF9yZXZva2Vfb2JqZWN0X1VSTCA9IHJlYWxfVVJMLnJldm9rZU9iamVjdFVSTFxuXHRcdFx0LCBVUkwgPSByZWFsX1VSTFxuXHRcdFx0LCBidG9hID0gdmlldy5idG9hXG5cdFx0XHQsIGF0b2IgPSB2aWV3LmF0b2JcblxuXHRcdFx0LCBBcnJheUJ1ZmZlciA9IHZpZXcuQXJyYXlCdWZmZXJcblx0XHRcdCwgVWludDhBcnJheSA9IHZpZXcuVWludDhBcnJheVxuXG5cdFx0XHQsIG9yaWdpbiA9IC9eW1xcdy1dKzpcXC8qXFxbP1tcXHdcXC46LV0rXFxdPyg/OjpbMC05XSspPy9cblx0XHQ7XG5cdFx0RmFrZUJsb2IuZmFrZSA9IEZCX3Byb3RvLmZha2UgPSB0cnVlO1xuXHRcdHdoaWxlIChmaWxlX2V4X2NvZGUtLSkge1xuXHRcdFx0RmlsZUV4Y2VwdGlvbi5wcm90b3R5cGVbZmlsZV9leF9jb2Rlc1tmaWxlX2V4X2NvZGVdXSA9IGZpbGVfZXhfY29kZSArIDE7XG5cdFx0fVxuXHRcdC8vIFBvbHlmaWxsIFVSTFxuXHRcdGlmICghcmVhbF9VUkwuY3JlYXRlT2JqZWN0VVJMKSB7XG5cdFx0XHRVUkwgPSB2aWV3LlVSTCA9IGZ1bmN0aW9uKHVyaSkge1xuXHRcdFx0XHR2YXJcblx0XHRcdFx0XHQgIHVyaV9pbmZvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiLCBcImFcIilcblx0XHRcdFx0XHQsIHVyaV9vcmlnaW5cblx0XHRcdFx0O1xuXHRcdFx0XHR1cmlfaW5mby5ocmVmID0gdXJpO1xuXHRcdFx0XHRpZiAoIShcIm9yaWdpblwiIGluIHVyaV9pbmZvKSkge1xuXHRcdFx0XHRcdGlmICh1cmlfaW5mby5wcm90b2NvbC50b0xvd2VyQ2FzZSgpID09PSBcImRhdGE6XCIpIHtcblx0XHRcdFx0XHRcdHVyaV9pbmZvLm9yaWdpbiA9IG51bGw7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHVyaV9vcmlnaW4gPSB1cmkubWF0Y2gob3JpZ2luKTtcblx0XHRcdFx0XHRcdHVyaV9pbmZvLm9yaWdpbiA9IHVyaV9vcmlnaW4gJiYgdXJpX29yaWdpblsxXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHVyaV9pbmZvO1xuXHRcdFx0fTtcblx0XHR9XG5cdFx0VVJMLmNyZWF0ZU9iamVjdFVSTCA9IGZ1bmN0aW9uKGJsb2IpIHtcblx0XHRcdHZhclxuXHRcdFx0XHQgIHR5cGUgPSBibG9iLnR5cGVcblx0XHRcdFx0LCBkYXRhX1VSSV9oZWFkZXJcblx0XHRcdDtcblx0XHRcdGlmICh0eXBlID09PSBudWxsKSB7XG5cdFx0XHRcdHR5cGUgPSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGJsb2IgaW5zdGFuY2VvZiBGYWtlQmxvYikge1xuXHRcdFx0XHRkYXRhX1VSSV9oZWFkZXIgPSBcImRhdGE6XCIgKyB0eXBlO1xuXHRcdFx0XHRpZiAoYmxvYi5lbmNvZGluZyA9PT0gXCJiYXNlNjRcIikge1xuXHRcdFx0XHRcdHJldHVybiBkYXRhX1VSSV9oZWFkZXIgKyBcIjtiYXNlNjQsXCIgKyBibG9iLmRhdGE7XG5cdFx0XHRcdH0gZWxzZSBpZiAoYmxvYi5lbmNvZGluZyA9PT0gXCJVUklcIikge1xuXHRcdFx0XHRcdHJldHVybiBkYXRhX1VSSV9oZWFkZXIgKyBcIixcIiArIGRlY29kZVVSSUNvbXBvbmVudChibG9iLmRhdGEpO1xuXHRcdFx0XHR9IGlmIChidG9hKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGFfVVJJX2hlYWRlciArIFwiO2Jhc2U2NCxcIiArIGJ0b2EoYmxvYi5kYXRhKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gZGF0YV9VUklfaGVhZGVyICsgXCIsXCIgKyBlbmNvZGVVUklDb21wb25lbnQoYmxvYi5kYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChyZWFsX2NyZWF0ZV9vYmplY3RfVVJMKSB7XG5cdFx0XHRcdHJldHVybiByZWFsX2NyZWF0ZV9vYmplY3RfVVJMLmNhbGwocmVhbF9VUkwsIGJsb2IpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0VVJMLnJldm9rZU9iamVjdFVSTCA9IGZ1bmN0aW9uKG9iamVjdF9VUkwpIHtcblx0XHRcdGlmIChvYmplY3RfVVJMLnN1YnN0cmluZygwLCA1KSAhPT0gXCJkYXRhOlwiICYmIHJlYWxfcmV2b2tlX29iamVjdF9VUkwpIHtcblx0XHRcdFx0cmVhbF9yZXZva2Vfb2JqZWN0X1VSTC5jYWxsKHJlYWxfVVJMLCBvYmplY3RfVVJMKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdEZCQl9wcm90by5hcHBlbmQgPSBmdW5jdGlvbihkYXRhLyosIGVuZGluZ3MqLykge1xuXHRcdFx0dmFyIGJiID0gdGhpcy5kYXRhO1xuXHRcdFx0Ly8gZGVjb2RlIGRhdGEgdG8gYSBiaW5hcnkgc3RyaW5nXG5cdFx0XHRpZiAoVWludDhBcnJheSAmJiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGRhdGEgaW5zdGFuY2VvZiBVaW50OEFycmF5KSkge1xuXHRcdFx0XHR2YXJcblx0XHRcdFx0XHQgIHN0ciA9IFwiXCJcblx0XHRcdFx0XHQsIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGRhdGEpXG5cdFx0XHRcdFx0LCBpID0gMFxuXHRcdFx0XHRcdCwgYnVmX2xlbiA9IGJ1Zi5sZW5ndGhcblx0XHRcdFx0O1xuXHRcdFx0XHRmb3IgKDsgaSA8IGJ1Zl9sZW47IGkrKykge1xuXHRcdFx0XHRcdHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0YmIucHVzaChzdHIpO1xuXHRcdFx0fSBlbHNlIGlmIChnZXRfY2xhc3MoZGF0YSkgPT09IFwiQmxvYlwiIHx8IGdldF9jbGFzcyhkYXRhKSA9PT0gXCJGaWxlXCIpIHtcblx0XHRcdFx0aWYgKEZpbGVSZWFkZXJTeW5jKSB7XG5cdFx0XHRcdFx0dmFyIGZyID0gbmV3IEZpbGVSZWFkZXJTeW5jO1xuXHRcdFx0XHRcdGJiLnB1c2goZnIucmVhZEFzQmluYXJ5U3RyaW5nKGRhdGEpKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBhc3luYyBGaWxlUmVhZGVyIHdvbid0IHdvcmsgYXMgQmxvYkJ1aWxkZXIgaXMgc3luY1xuXHRcdFx0XHRcdHRocm93IG5ldyBGaWxlRXhjZXB0aW9uKFwiTk9UX1JFQURBQkxFX0VSUlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChkYXRhIGluc3RhbmNlb2YgRmFrZUJsb2IpIHtcblx0XHRcdFx0aWYgKGRhdGEuZW5jb2RpbmcgPT09IFwiYmFzZTY0XCIgJiYgYXRvYikge1xuXHRcdFx0XHRcdGJiLnB1c2goYXRvYihkYXRhLmRhdGEpKTtcblx0XHRcdFx0fSBlbHNlIGlmIChkYXRhLmVuY29kaW5nID09PSBcIlVSSVwiKSB7XG5cdFx0XHRcdFx0YmIucHVzaChkZWNvZGVVUklDb21wb25lbnQoZGF0YS5kYXRhKSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoZGF0YS5lbmNvZGluZyA9PT0gXCJyYXdcIikge1xuXHRcdFx0XHRcdGJiLnB1c2goZGF0YS5kYXRhKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBkYXRhICE9PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRcdFx0ZGF0YSArPSBcIlwiOyAvLyBjb252ZXJ0IHVuc3VwcG9ydGVkIHR5cGVzIHRvIHN0cmluZ3Ncblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBkZWNvZGUgVVRGLTE2IHRvIGJpbmFyeSBzdHJpbmdcblx0XHRcdFx0YmIucHVzaCh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoZGF0YSkpKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdEZCQl9wcm90by5nZXRCbG9iID0gZnVuY3Rpb24odHlwZSkge1xuXHRcdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG5cdFx0XHRcdHR5cGUgPSBudWxsO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG5ldyBGYWtlQmxvYih0aGlzLmRhdGEuam9pbihcIlwiKSwgdHlwZSwgXCJyYXdcIik7XG5cdFx0fTtcblx0XHRGQkJfcHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBcIltvYmplY3QgQmxvYkJ1aWxkZXJdXCI7XG5cdFx0fTtcblx0XHRGQl9wcm90by5zbGljZSA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQsIHR5cGUpIHtcblx0XHRcdHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aDtcblx0XHRcdGlmIChhcmdzIDwgMykge1xuXHRcdFx0XHR0eXBlID0gbnVsbDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBuZXcgRmFrZUJsb2IoXG5cdFx0XHRcdCAgdGhpcy5kYXRhLnNsaWNlKHN0YXJ0LCBhcmdzID4gMSA/IGVuZCA6IHRoaXMuZGF0YS5sZW5ndGgpXG5cdFx0XHRcdCwgdHlwZVxuXHRcdFx0XHQsIHRoaXMuZW5jb2Rpbmdcblx0XHRcdCk7XG5cdFx0fTtcblx0XHRGQl9wcm90by50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFwiW29iamVjdCBCbG9iXVwiO1xuXHRcdH07XG5cdFx0RkJfcHJvdG8uY2xvc2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdHRoaXMuc2l6ZSA9IDA7XG5cdFx0XHRkZWxldGUgdGhpcy5kYXRhO1xuXHRcdH07XG5cdFx0cmV0dXJuIEZha2VCbG9iQnVpbGRlcjtcblx0fSh2aWV3KSk7XG5cblx0dmlldy5CbG9iID0gZnVuY3Rpb24oYmxvYlBhcnRzLCBvcHRpb25zKSB7XG5cdFx0dmFyIHR5cGUgPSBvcHRpb25zID8gKG9wdGlvbnMudHlwZSB8fCBcIlwiKSA6IFwiXCI7XG5cdFx0dmFyIGJ1aWxkZXIgPSBuZXcgQmxvYkJ1aWxkZXIoKTtcblx0XHRpZiAoYmxvYlBhcnRzKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gYmxvYlBhcnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdGlmIChVaW50OEFycmF5ICYmIGJsb2JQYXJ0c1tpXSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcblx0XHRcdFx0XHRidWlsZGVyLmFwcGVuZChibG9iUGFydHNbaV0uYnVmZmVyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRidWlsZGVyLmFwcGVuZChibG9iUGFydHNbaV0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHZhciBibG9iID0gYnVpbGRlci5nZXRCbG9iKHR5cGUpO1xuXHRcdGlmICghYmxvYi5zbGljZSAmJiBibG9iLndlYmtpdFNsaWNlKSB7XG5cdFx0XHRibG9iLnNsaWNlID0gYmxvYi53ZWJraXRTbGljZTtcblx0XHR9XG5cdFx0cmV0dXJuIGJsb2I7XG5cdH07XG5cblx0dmFyIGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mIHx8IGZ1bmN0aW9uKG9iamVjdCkge1xuXHRcdHJldHVybiBvYmplY3QuX19wcm90b19fO1xuXHR9O1xuXHR2aWV3LkJsb2IucHJvdG90eXBlID0gZ2V0UHJvdG90eXBlT2YobmV3IHZpZXcuQmxvYigpKTtcbn0odHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgJiYgc2VsZiB8fCB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdyB8fCB0aGlzLmNvbnRlbnQgfHwgdGhpcykpO1xuIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gU2xvd0J1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5cbnZhciBLX01BWF9MRU5HVEggPSAweDdmZmZmZmZmXG5leHBvcnRzLmtNYXhMZW5ndGggPSBLX01BWF9MRU5HVEhcblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgUHJpbnQgd2FybmluZyBhbmQgcmVjb21tZW5kIHVzaW5nIGBidWZmZXJgIHY0Lnggd2hpY2ggaGFzIGFuIE9iamVjdFxuICogICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogV2UgcmVwb3J0IHRoYXQgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0eXBlZCBhcnJheXMgaWYgdGhlIGFyZSBub3Qgc3ViY2xhc3NhYmxlXG4gKiB1c2luZyBfX3Byb3RvX18uIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgXG4gKiAoU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzgpLiBJRSAxMCBsYWNrcyBzdXBwb3J0XG4gKiBmb3IgX19wcm90b19fIGFuZCBoYXMgYSBidWdneSB0eXBlZCBhcnJheSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSB0eXBlZEFycmF5U3VwcG9ydCgpXG5cbmlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgY29uc29sZS5lcnJvcihcbiAgICAnVGhpcyBicm93c2VyIGxhY2tzIHR5cGVkIGFycmF5IChVaW50OEFycmF5KSBzdXBwb3J0IHdoaWNoIGlzIHJlcXVpcmVkIGJ5ICcgK1xuICAgICdgYnVmZmVyYCB2NS54LiBVc2UgYGJ1ZmZlcmAgdjQueCBpZiB5b3UgcmVxdWlyZSBvbGQgYnJvd3NlciBzdXBwb3J0LidcbiAgKVxufVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIC8vIENhbiB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZD9cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuX19wcm90b19fID0geyBfX3Byb3RvX186IFVpbnQ4QXJyYXkucHJvdG90eXBlLCBmb286IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH0gfVxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ3BhcmVudCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5idWZmZXJcbiAgfVxufSlcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdvZmZzZXQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHRoaXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMuYnl0ZU9mZnNldFxuICB9XG59KVxuXG5mdW5jdGlvbiBjcmVhdGVCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAobGVuZ3RoID4gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBsZW5ndGggKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbi8qKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBoYXZlIHRoZWlyXG4gKiBwcm90b3R5cGUgY2hhbmdlZCB0byBgQnVmZmVyLnByb3RvdHlwZWAuIEZ1cnRoZXJtb3JlLCBgQnVmZmVyYCBpcyBhIHN1YmNsYXNzIG9mXG4gKiBgVWludDhBcnJheWAsIHNvIHRoZSByZXR1cm5lZCBpbnN0YW5jZXMgd2lsbCBoYXZlIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBtZXRob2RzXG4gKiBhbmQgdGhlIGBVaW50OEFycmF5YCBtZXRob2RzLiBTcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdFxuICogcmV0dXJucyBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBUaGUgYFVpbnQ4QXJyYXlgIHByb3RvdHlwZSByZW1haW5zIHVubW9kaWZpZWQuXG4gKi9cblxuZnVuY3Rpb24gQnVmZmVyIChhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZ09yT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgJ1RoZSBcInN0cmluZ1wiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gYWxsb2NVbnNhZmUoYXJnKVxuICB9XG4gIHJldHVybiBmcm9tKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBGaXggc3ViYXJyYXkoKSBpbiBFUzIwMTYuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC85N1xuaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC5zcGVjaWVzICE9IG51bGwgJiZcbiAgICBCdWZmZXJbU3ltYm9sLnNwZWNpZXNdID09PSBCdWZmZXIpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlciwgU3ltYm9sLnNwZWNpZXMsIHtcbiAgICB2YWx1ZTogbnVsbCxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pXG59XG5cbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG5mdW5jdGlvbiBmcm9tICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQpXG4gIH1cblxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKHZhbHVlKVxuICB9XG5cbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gICAgKVxuICB9XG5cbiAgaWYgKGlzSW5zdGFuY2UodmFsdWUsIEFycmF5QnVmZmVyKSB8fFxuICAgICAgKHZhbHVlICYmIGlzSW5zdGFuY2UodmFsdWUuYnVmZmVyLCBBcnJheUJ1ZmZlcikpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInZhbHVlXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgb2YgdHlwZSBudW1iZXIuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgIClcbiAgfVxuXG4gIHZhciB2YWx1ZU9mID0gdmFsdWUudmFsdWVPZiAmJiB2YWx1ZS52YWx1ZU9mKClcbiAgaWYgKHZhbHVlT2YgIT0gbnVsbCAmJiB2YWx1ZU9mICE9PSB2YWx1ZSkge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbSh2YWx1ZU9mLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICB2YXIgYiA9IGZyb21PYmplY3QodmFsdWUpXG4gIGlmIChiKSByZXR1cm4gYlxuXG4gIGlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9QcmltaXRpdmUgIT0gbnVsbCAmJlxuICAgICAgdHlwZW9mIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oXG4gICAgICB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdKCdzdHJpbmcnKSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoXG4gICAgKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICApXG59XG5cbi8qKlxuICogRnVuY3Rpb25hbGx5IGVxdWl2YWxlbnQgdG8gQnVmZmVyKGFyZywgZW5jb2RpbmcpIGJ1dCB0aHJvd3MgYSBUeXBlRXJyb3JcbiAqIGlmIHZhbHVlIGlzIGEgbnVtYmVyLlxuICogQnVmZmVyLmZyb20oc3RyWywgZW5jb2RpbmddKVxuICogQnVmZmVyLmZyb20oYXJyYXkpXG4gKiBCdWZmZXIuZnJvbShidWZmZXIpXG4gKiBCdWZmZXIuZnJvbShhcnJheUJ1ZmZlclssIGJ5dGVPZmZzZXRbLCBsZW5ndGhdXSlcbiAqKi9cbkJ1ZmZlci5mcm9tID0gZnVuY3Rpb24gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGZyb20odmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gTm90ZTogQ2hhbmdlIHByb3RvdHlwZSAqYWZ0ZXIqIEJ1ZmZlci5mcm9tIGlzIGRlZmluZWQgdG8gd29ya2Fyb3VuZCBDaHJvbWUgYnVnOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC8xNDhcbkJ1ZmZlci5wcm90b3R5cGUuX19wcm90b19fID0gVWludDhBcnJheS5wcm90b3R5cGVcbkJ1ZmZlci5fX3Byb3RvX18gPSBVaW50OEFycmF5XG5cbmZ1bmN0aW9uIGFzc2VydFNpemUgKHNpemUpIHtcbiAgaWYgKHR5cGVvZiBzaXplICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wic2l6ZVwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBudW1iZXInKVxuICB9IGVsc2UgaWYgKHNpemUgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBzaXplICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAoc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG59XG5cbi8qKlxuICogRXF1aXZhbGVudCB0byBCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqICovXG5CdWZmZXIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cbi8qKlxuICogRXF1aXZhbGVudCB0byBTbG93QnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICB9XG5cbiAgaWYgKCFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gIH1cblxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG5cbiAgdmFyIGFjdHVhbCA9IGJ1Zi53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuXG4gIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgIC8vIFdyaXRpbmcgYSBoZXggc3RyaW5nLCBmb3IgZXhhbXBsZSwgdGhhdCBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMgd2lsbFxuICAgIC8vIGNhdXNlIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0IGludmFsaWQgY2hhcmFjdGVyIHRvIGJlIGlnbm9yZWQuIChlLmcuXG4gICAgLy8gJ2FieHhjZCcgd2lsbCBiZSB0cmVhdGVkIGFzICdhYicpXG4gICAgYnVmID0gYnVmLnNsaWNlKDAsIGFjdHVhbClcbiAgfVxuXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAoYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGJ1ZltpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwIHx8IGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0KSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wib2Zmc2V0XCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmIChhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCArIChsZW5ndGggfHwgMCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJsZW5ndGhcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgdmFyIGJ1ZlxuICBpZiAoYnl0ZU9mZnNldCA9PT0gdW5kZWZpbmVkICYmIGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXkpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldClcbiAgfSBlbHNlIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tT2JqZWN0IChvYmopIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihvYmopKSB7XG4gICAgdmFyIGxlbiA9IGNoZWNrZWQob2JqLmxlbmd0aCkgfCAwXG4gICAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW4pXG5cbiAgICBpZiAoYnVmLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJ1ZlxuICAgIH1cblxuICAgIG9iai5jb3B5KGJ1ZiwgMCwgMCwgbGVuKVxuICAgIHJldHVybiBidWZcbiAgfVxuXG4gIGlmIChvYmoubGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIG9iai5sZW5ndGggIT09ICdudW1iZXInIHx8IG51bWJlcklzTmFOKG9iai5sZW5ndGgpKSB7XG4gICAgICByZXR1cm4gY3JlYXRlQnVmZmVyKDApXG4gICAgfVxuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iailcbiAgfVxuXG4gIGlmIChvYmoudHlwZSA9PT0gJ0J1ZmZlcicgJiYgQXJyYXkuaXNBcnJheShvYmouZGF0YSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmouZGF0YSlcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwgS19NQVhfTEVOR1RIYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBLX01BWF9MRU5HVEgudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAobGVuZ3RoKSB7XG4gIGlmICgrbGVuZ3RoICE9IGxlbmd0aCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuICAgIGxlbmd0aCA9IDBcbiAgfVxuICByZXR1cm4gQnVmZmVyLmFsbG9jKCtsZW5ndGgpXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiBiICE9IG51bGwgJiYgYi5faXNCdWZmZXIgPT09IHRydWUgJiZcbiAgICBiICE9PSBCdWZmZXIucHJvdG90eXBlIC8vIHNvIEJ1ZmZlci5pc0J1ZmZlcihCdWZmZXIucHJvdG90eXBlKSB3aWxsIGJlIGZhbHNlXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoaXNJbnN0YW5jZShhLCBVaW50OEFycmF5KSkgYSA9IEJ1ZmZlci5mcm9tKGEsIGEub2Zmc2V0LCBhLmJ5dGVMZW5ndGgpXG4gIGlmIChpc0luc3RhbmNlKGIsIFVpbnQ4QXJyYXkpKSBiID0gQnVmZmVyLmZyb20oYiwgYi5vZmZzZXQsIGIuYnl0ZUxlbmd0aClcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwiYnVmMVwiLCBcImJ1ZjJcIiBhcmd1bWVudHMgbXVzdCBiZSBvbmUgb2YgdHlwZSBCdWZmZXIgb3IgVWludDhBcnJheSdcbiAgICApXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXVxuICAgICAgeSA9IGJbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBCdWZmZXIuYWxsb2MoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJ1ZiA9IGxpc3RbaV1cbiAgICBpZiAoaXNJbnN0YW5jZShidWYsIFVpbnQ4QXJyYXkpKSB7XG4gICAgICBidWYgPSBCdWZmZXIuZnJvbShidWYpXG4gICAgfVxuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gICAgfVxuICAgIGJ1Zi5jb3B5KGJ1ZmZlciwgcG9zKVxuICAgIHBvcyArPSBidWYubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoc3RyaW5nKSkge1xuICAgIHJldHVybiBzdHJpbmcubGVuZ3RoXG4gIH1cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhzdHJpbmcpIHx8IGlzSW5zdGFuY2Uoc3RyaW5nLCBBcnJheUJ1ZmZlcikpIHtcbiAgICByZXR1cm4gc3RyaW5nLmJ5dGVMZW5ndGhcbiAgfVxuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInN0cmluZ1wiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIG9yIEFycmF5QnVmZmVyLiAnICtcbiAgICAgICdSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2Ygc3RyaW5nXG4gICAgKVxuICB9XG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIG11c3RNYXRjaCA9IChhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gPT09IHRydWUpXG4gIGlmICghbXVzdE1hdGNoICYmIGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkge1xuICAgICAgICAgIHJldHVybiBtdXN0TWF0Y2ggPyAtMSA6IHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIH1cbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgLy8gTm8gbmVlZCB0byB2ZXJpZnkgdGhhdCBcInRoaXMubGVuZ3RoIDw9IE1BWF9VSU5UMzJcIiBzaW5jZSBpdCdzIGEgcmVhZC1vbmx5XG4gIC8vIHByb3BlcnR5IG9mIGEgdHlwZWQgYXJyYXkuXG5cbiAgLy8gVGhpcyBiZWhhdmVzIG5laXRoZXIgbGlrZSBTdHJpbmcgbm9yIFVpbnQ4QXJyYXkgaW4gdGhhdCB3ZSBzZXQgc3RhcnQvZW5kXG4gIC8vIHRvIHRoZWlyIHVwcGVyL2xvd2VyIGJvdW5kcyBpZiB0aGUgdmFsdWUgcGFzc2VkIGlzIG91dCBvZiByYW5nZS5cbiAgLy8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgc3BlY2lhbGx5IGFzIHBlciBFQ01BLTI2MiA2dGggRWRpdGlvbixcbiAgLy8gU2VjdGlvbiAxMy4zLjMuNyBSdW50aW1lIFNlbWFudGljczogS2V5ZWRCaW5kaW5nSW5pdGlhbGl6YXRpb24uXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkIHx8IHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIC8vIFJldHVybiBlYXJseSBpZiBzdGFydCA+IHRoaXMubGVuZ3RoLiBEb25lIGhlcmUgdG8gcHJldmVudCBwb3RlbnRpYWwgdWludDMyXG4gIC8vIGNvZXJjaW9uIGZhaWwgYmVsb3cuXG4gIGlmIChzdGFydCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVuZCA8PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBGb3JjZSBjb2Vyc2lvbiB0byB1aW50MzIuIFRoaXMgd2lsbCBhbHNvIGNvZXJjZSBmYWxzZXkvTmFOIHZhbHVlcyB0byAwLlxuICBlbmQgPj4+PSAwXG4gIHN0YXJ0ID4+Pj0gMFxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vLyBUaGlzIHByb3BlcnR5IGlzIHVzZWQgYnkgYEJ1ZmZlci5pc0J1ZmZlcmAgKGFuZCB0aGUgYGlzLWJ1ZmZlcmAgbnBtIHBhY2thZ2UpXG4vLyB0byBkZXRlY3QgYSBCdWZmZXIgaW5zdGFuY2UuIEl0J3Mgbm90IHBvc3NpYmxlIHRvIHVzZSBgaW5zdGFuY2VvZiBCdWZmZXJgXG4vLyByZWxpYWJseSBpbiBhIGJyb3dzZXJpZnkgY29udGV4dCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlIGRpZmZlcmVudFxuLy8gY29waWVzIG9mIHRoZSAnYnVmZmVyJyBwYWNrYWdlIGluIHVzZS4gVGhpcyBtZXRob2Qgd29ya3MgZXZlbiBmb3IgQnVmZmVyXG4vLyBpbnN0YW5jZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZnJvbSBhbm90aGVyIGNvcHkgb2YgdGhlIGBidWZmZXJgIHBhY2thZ2UuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNTRcbkJ1ZmZlci5wcm90b3R5cGUuX2lzQnVmZmVyID0gdHJ1ZVxuXG5mdW5jdGlvbiBzd2FwIChiLCBuLCBtKSB7XG4gIHZhciBpID0gYltuXVxuICBiW25dID0gYlttXVxuICBiW21dID0gaVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAxNiA9IGZ1bmN0aW9uIHN3YXAxNiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgMiAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMTYtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDEpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMzIgPSBmdW5jdGlvbiBzd2FwMzIgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAzKVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyAyKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDY0ID0gZnVuY3Rpb24gc3dhcDY0ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA4ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA2NC1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA4KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgNylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgNilcbiAgICBzd2FwKHRoaXMsIGkgKyAyLCBpICsgNSlcbiAgICBzd2FwKHRoaXMsIGkgKyAzLCBpICsgNClcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9Mb2NhbGVTdHJpbmcgPSBCdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nXG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkucmVwbGFjZSgvKC57Mn0pL2csICckMSAnKS50cmltKClcbiAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlICh0YXJnZXQsIHN0YXJ0LCBlbmQsIHRoaXNTdGFydCwgdGhpc0VuZCkge1xuICBpZiAoaXNJbnN0YW5jZSh0YXJnZXQsIFVpbnQ4QXJyYXkpKSB7XG4gICAgdGFyZ2V0ID0gQnVmZmVyLmZyb20odGFyZ2V0LCB0YXJnZXQub2Zmc2V0LCB0YXJnZXQuYnl0ZUxlbmd0aClcbiAgfVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ0YXJnZXRcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5LiAnICtcbiAgICAgICdSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHRhcmdldClcbiAgICApXG4gIH1cblxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuZCA9IHRhcmdldCA/IHRhcmdldC5sZW5ndGggOiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc1N0YXJ0ID0gMFxuICB9XG4gIGlmICh0aGlzRW5kID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzRW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChzdGFydCA8IDAgfHwgZW5kID4gdGFyZ2V0Lmxlbmd0aCB8fCB0aGlzU3RhcnQgPCAwIHx8IHRoaXNFbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kICYmIHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICBzdGFydCA+Pj49IDBcbiAgZW5kID4+Pj0gMFxuICB0aGlzU3RhcnQgPj4+PSAwXG4gIHRoaXNFbmQgPj4+PSAwXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCkgcmV0dXJuIDBcblxuICB2YXIgeCA9IHRoaXNFbmQgLSB0aGlzU3RhcnRcbiAgdmFyIHkgPSBlbmQgLSBzdGFydFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcblxuICB2YXIgdGhpc0NvcHkgPSB0aGlzLnNsaWNlKHRoaXNTdGFydCwgdGhpc0VuZClcbiAgdmFyIHRhcmdldENvcHkgPSB0YXJnZXQuc2xpY2Uoc3RhcnQsIGVuZClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNDb3B5W2ldICE9PSB0YXJnZXRDb3B5W2ldKSB7XG4gICAgICB4ID0gdGhpc0NvcHlbaV1cbiAgICAgIHkgPSB0YXJnZXRDb3B5W2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuLy8gRmluZHMgZWl0aGVyIHRoZSBmaXJzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPj0gYGJ5dGVPZmZzZXRgLFxuLy8gT1IgdGhlIGxhc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0IDw9IGBieXRlT2Zmc2V0YC5cbi8vXG4vLyBBcmd1bWVudHM6XG4vLyAtIGJ1ZmZlciAtIGEgQnVmZmVyIHRvIHNlYXJjaFxuLy8gLSB2YWwgLSBhIHN0cmluZywgQnVmZmVyLCBvciBudW1iZXJcbi8vIC0gYnl0ZU9mZnNldCAtIGFuIGluZGV4IGludG8gYGJ1ZmZlcmA7IHdpbGwgYmUgY2xhbXBlZCB0byBhbiBpbnQzMlxuLy8gLSBlbmNvZGluZyAtIGFuIG9wdGlvbmFsIGVuY29kaW5nLCByZWxldmFudCBpcyB2YWwgaXMgYSBzdHJpbmdcbi8vIC0gZGlyIC0gdHJ1ZSBmb3IgaW5kZXhPZiwgZmFsc2UgZm9yIGxhc3RJbmRleE9mXG5mdW5jdGlvbiBiaWRpcmVjdGlvbmFsSW5kZXhPZiAoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgLy8gRW1wdHkgYnVmZmVyIG1lYW5zIG5vIG1hdGNoXG4gIGlmIChidWZmZXIubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldFxuICBpZiAodHlwZW9mIGJ5dGVPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBieXRlT2Zmc2V0XG4gICAgYnl0ZU9mZnNldCA9IDBcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikge1xuICAgIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSB7XG4gICAgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIH1cbiAgYnl0ZU9mZnNldCA9ICtieXRlT2Zmc2V0IC8vIENvZXJjZSB0byBOdW1iZXIuXG4gIGlmIChudW1iZXJJc05hTihieXRlT2Zmc2V0KSkge1xuICAgIC8vIGJ5dGVPZmZzZXQ6IGl0IGl0J3MgdW5kZWZpbmVkLCBudWxsLCBOYU4sIFwiZm9vXCIsIGV0Yywgc2VhcmNoIHdob2xlIGJ1ZmZlclxuICAgIGJ5dGVPZmZzZXQgPSBkaXIgPyAwIDogKGJ1ZmZlci5sZW5ndGggLSAxKVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXQ6IG5lZ2F0aXZlIG9mZnNldHMgc3RhcnQgZnJvbSB0aGUgZW5kIG9mIHRoZSBidWZmZXJcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwKSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCArIGJ5dGVPZmZzZXRcbiAgaWYgKGJ5dGVPZmZzZXQgPj0gYnVmZmVyLmxlbmd0aCkge1xuICAgIGlmIChkaXIpIHJldHVybiAtMVxuICAgIGVsc2UgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggLSAxXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IDApIHtcbiAgICBpZiAoZGlyKSBieXRlT2Zmc2V0ID0gMFxuICAgIGVsc2UgcmV0dXJuIC0xXG4gIH1cblxuICAvLyBOb3JtYWxpemUgdmFsXG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIHZhbCA9IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gIH1cblxuICAvLyBGaW5hbGx5LCBzZWFyY2ggZWl0aGVyIGluZGV4T2YgKGlmIGRpciBpcyB0cnVlKSBvciBsYXN0SW5kZXhPZlxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbCkpIHtcbiAgICAvLyBTcGVjaWFsIGNhc2U6IGxvb2tpbmcgZm9yIGVtcHR5IHN0cmluZy9idWZmZXIgYWx3YXlzIGZhaWxzXG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMHhGRiAvLyBTZWFyY2ggZm9yIGEgYnl0ZSB2YWx1ZSBbMC0yNTVdXG4gICAgaWYgKHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBpZiAoZGlyKSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIFsgdmFsIF0sIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG5mdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIHZhciBpbmRleFNpemUgPSAxXG4gIHZhciBhcnJMZW5ndGggPSBhcnIubGVuZ3RoXG4gIHZhciB2YWxMZW5ndGggPSB2YWwubGVuZ3RoXG5cbiAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgIGlmIChlbmNvZGluZyA9PT0gJ3VjczInIHx8IGVuY29kaW5nID09PSAndWNzLTInIHx8XG4gICAgICAgIGVuY29kaW5nID09PSAndXRmMTZsZScgfHwgZW5jb2RpbmcgPT09ICd1dGYtMTZsZScpIHtcbiAgICAgIGlmIChhcnIubGVuZ3RoIDwgMiB8fCB2YWwubGVuZ3RoIDwgMikge1xuICAgICAgICByZXR1cm4gLTFcbiAgICAgIH1cbiAgICAgIGluZGV4U2l6ZSA9IDJcbiAgICAgIGFyckxlbmd0aCAvPSAyXG4gICAgICB2YWxMZW5ndGggLz0gMlxuICAgICAgYnl0ZU9mZnNldCAvPSAyXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZCAoYnVmLCBpKSB7XG4gICAgaWYgKGluZGV4U2l6ZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIGJ1ZltpXVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYnVmLnJlYWRVSW50MTZCRShpICogaW5kZXhTaXplKVxuICAgIH1cbiAgfVxuXG4gIHZhciBpXG4gIGlmIChkaXIpIHtcbiAgICB2YXIgZm91bmRJbmRleCA9IC0xXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA8IGFyckxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocmVhZChhcnIsIGkpID09PSByZWFkKHZhbCwgZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXgpKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsTGVuZ3RoKSByZXR1cm4gZm91bmRJbmRleCAqIGluZGV4U2l6ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggIT09IC0xKSBpIC09IGkgLSBmb3VuZEluZGV4XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoYnl0ZU9mZnNldCArIHZhbExlbmd0aCA+IGFyckxlbmd0aCkgYnl0ZU9mZnNldCA9IGFyckxlbmd0aCAtIHZhbExlbmd0aFxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgZm91bmQgPSB0cnVlXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbExlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChyZWFkKGFyciwgaSArIGopICE9PSByZWFkKHZhbCwgaikpIHtcbiAgICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGZvdW5kKSByZXR1cm4gaVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24gaW5jbHVkZXMgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIHRoaXMuaW5kZXhPZih2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSAhPT0gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgdHJ1ZSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uIGxhc3RJbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChudW1iZXJJc05hTihwYXJzZWQpKSByZXR1cm4gaVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gbGF0aW4xV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCA+Pj4gMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ0J1ZmZlci53cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXRbLCBsZW5ndGhdKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkJ1xuICAgIClcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gbGF0aW4xU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIChieXRlc1tpICsgMV0gKiAyNTYpKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMCkgZW5kID0gMFxuICB9IGVsc2UgaWYgKGVuZCA+IGxlbikge1xuICAgIGVuZCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIHZhciBuZXdCdWYgPSB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIG5ld0J1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIHJlYWRJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiByZWFkRG91YmxlTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJidWZmZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgLSAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpICsgMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiB3cml0ZUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gd3JpdGVGbG9hdExFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdhcmd1bWVudCBzaG91bGQgYmUgYSBCdWZmZXInKVxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiB0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuY29weVdpdGhpbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFVzZSBidWlsdC1pbiB3aGVuIGF2YWlsYWJsZSwgbWlzc2luZyBmcm9tIElFMTFcbiAgICB0aGlzLmNvcHlXaXRoaW4odGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpXG4gIH0gZWxzZSBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKHZhciBpID0gbGVuIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIFVpbnQ4QXJyYXkucHJvdG90eXBlLnNldC5jYWxsKFxuICAgICAgdGFyZ2V0LFxuICAgICAgdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSxcbiAgICAgIHRhcmdldFN0YXJ0XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBVc2FnZTpcbi8vICAgIGJ1ZmZlci5maWxsKG51bWJlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoYnVmZmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChzdHJpbmdbLCBvZmZzZXRbLCBlbmRdXVssIGVuY29kaW5nXSlcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbCwgc3RhcnQsIGVuZCwgZW5jb2RpbmcpIHtcbiAgLy8gSGFuZGxlIHN0cmluZyBjYXNlczpcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gc3RhcnRcbiAgICAgIHN0YXJ0ID0gMFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IGVuZFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9XG4gICAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICB9XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBjb2RlID0gdmFsLmNoYXJDb2RlQXQoMClcbiAgICAgIGlmICgoZW5jb2RpbmcgPT09ICd1dGY4JyAmJiBjb2RlIDwgMTI4KSB8fFxuICAgICAgICAgIGVuY29kaW5nID09PSAnbGF0aW4xJykge1xuICAgICAgICAvLyBGYXN0IHBhdGg6IElmIGB2YWxgIGZpdHMgaW50byBhIHNpbmdsZSBieXRlLCB1c2UgdGhhdCBudW1lcmljIHZhbHVlLlxuICAgICAgICB2YWwgPSBjb2RlXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMjU1XG4gIH1cblxuICAvLyBJbnZhbGlkIHJhbmdlcyBhcmUgbm90IHNldCB0byBhIGRlZmF1bHQsIHNvIGNhbiByYW5nZSBjaGVjayBlYXJseS5cbiAgaWYgKHN0YXJ0IDwgMCB8fCB0aGlzLmxlbmd0aCA8IHN0YXJ0IHx8IHRoaXMubGVuZ3RoIDwgZW5kKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghdmFsKSB2YWwgPSAwXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgdGhpc1tpXSA9IHZhbFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSBCdWZmZXIuaXNCdWZmZXIodmFsKVxuICAgICAgPyB2YWxcbiAgICAgIDogQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIHZhbHVlIFwiJyArIHZhbCArXG4gICAgICAgICdcIiBpcyBpbnZhbGlkIGZvciBhcmd1bWVudCBcInZhbHVlXCInKVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7ICsraSkge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXisvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHRha2VzIGVxdWFsIHNpZ25zIGFzIGVuZCBvZiB0aGUgQmFzZTY0IGVuY29kaW5nXG4gIHN0ciA9IHN0ci5zcGxpdCgnPScpWzBdXG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSAobGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCkgKyAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuLy8gQXJyYXlCdWZmZXIgb3IgVWludDhBcnJheSBvYmplY3RzIGZyb20gb3RoZXIgY29udGV4dHMgKGkuZS4gaWZyYW1lcykgZG8gbm90IHBhc3Ncbi8vIHRoZSBgaW5zdGFuY2VvZmAgY2hlY2sgYnV0IHRoZXkgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgb2YgdGhhdCB0eXBlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTY2XG5mdW5jdGlvbiBpc0luc3RhbmNlIChvYmosIHR5cGUpIHtcbiAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIHR5cGUgfHxcbiAgICAob2JqICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgIT0gbnVsbCAmJlxuICAgICAgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09IHR5cGUubmFtZSlcbn1cbmZ1bmN0aW9uIG51bWJlcklzTmFOIChvYmopIHtcbiAgLy8gRm9yIElFMTEgc3VwcG9ydFxuICByZXR1cm4gb2JqICE9PSBvYmogLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmVcbn1cbiIsIi8qIEZpbGVTYXZlci5qc1xuICogQSBzYXZlQXMoKSBGaWxlU2F2ZXIgaW1wbGVtZW50YXRpb24uXG4gKiAxLjMuMlxuICogMjAxNi0wNi0xNiAxODoyNToxOVxuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIExpY2Vuc2U6IE1JVFxuICogICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvRmlsZVNhdmVyLmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0UubWRcbiAqL1xuXG4vKmdsb2JhbCBzZWxmICovXG4vKmpzbGludCBiaXR3aXNlOiB0cnVlLCBpbmRlbnQ6IDQsIGxheGJyZWFrOiB0cnVlLCBsYXhjb21tYTogdHJ1ZSwgc21hcnR0YWJzOiB0cnVlLCBwbHVzcGx1czogdHJ1ZSAqL1xuXG4vKiEgQHNvdXJjZSBodHRwOi8vcHVybC5lbGlncmV5LmNvbS9naXRodWIvRmlsZVNhdmVyLmpzL2Jsb2IvbWFzdGVyL0ZpbGVTYXZlci5qcyAqL1xuXG52YXIgc2F2ZUFzID0gc2F2ZUFzIHx8IChmdW5jdGlvbih2aWV3KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXHQvLyBJRSA8MTAgaXMgZXhwbGljaXRseSB1bnN1cHBvcnRlZFxuXHRpZiAodHlwZW9mIHZpZXcgPT09IFwidW5kZWZpbmVkXCIgfHwgdHlwZW9mIG5hdmlnYXRvciAhPT0gXCJ1bmRlZmluZWRcIiAmJiAvTVNJRSBbMS05XVxcLi8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuXHRcdHJldHVybjtcblx0fVxuXHR2YXJcblx0XHQgIGRvYyA9IHZpZXcuZG9jdW1lbnRcblx0XHQgIC8vIG9ubHkgZ2V0IFVSTCB3aGVuIG5lY2Vzc2FyeSBpbiBjYXNlIEJsb2IuanMgaGFzbid0IG92ZXJyaWRkZW4gaXQgeWV0XG5cdFx0LCBnZXRfVVJMID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdmlldy5VUkwgfHwgdmlldy53ZWJraXRVUkwgfHwgdmlldztcblx0XHR9XG5cdFx0LCBzYXZlX2xpbmsgPSBkb2MuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbFwiLCBcImFcIilcblx0XHQsIGNhbl91c2Vfc2F2ZV9saW5rID0gXCJkb3dubG9hZFwiIGluIHNhdmVfbGlua1xuXHRcdCwgY2xpY2sgPSBmdW5jdGlvbihub2RlKSB7XG5cdFx0XHR2YXIgZXZlbnQgPSBuZXcgTW91c2VFdmVudChcImNsaWNrXCIpO1xuXHRcdFx0bm9kZS5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcblx0XHR9XG5cdFx0LCBpc19zYWZhcmkgPSAvY29uc3RydWN0b3IvaS50ZXN0KHZpZXcuSFRNTEVsZW1lbnQpIHx8IHZpZXcuc2FmYXJpXG5cdFx0LCBpc19jaHJvbWVfaW9zID0vQ3JpT1NcXC9bXFxkXSsvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudClcblx0XHQsIHRocm93X291dHNpZGUgPSBmdW5jdGlvbihleCkge1xuXHRcdFx0KHZpZXcuc2V0SW1tZWRpYXRlIHx8IHZpZXcuc2V0VGltZW91dCkoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHRocm93IGV4O1xuXHRcdFx0fSwgMCk7XG5cdFx0fVxuXHRcdCwgZm9yY2Vfc2F2ZWFibGVfdHlwZSA9IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCJcblx0XHQvLyB0aGUgQmxvYiBBUEkgaXMgZnVuZGFtZW50YWxseSBicm9rZW4gYXMgdGhlcmUgaXMgbm8gXCJkb3dubG9hZGZpbmlzaGVkXCIgZXZlbnQgdG8gc3Vic2NyaWJlIHRvXG5cdFx0LCBhcmJpdHJhcnlfcmV2b2tlX3RpbWVvdXQgPSAxMDAwICogNDAgLy8gaW4gbXNcblx0XHQsIHJldm9rZSA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdHZhciByZXZva2VyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGlmICh0eXBlb2YgZmlsZSA9PT0gXCJzdHJpbmdcIikgeyAvLyBmaWxlIGlzIGFuIG9iamVjdCBVUkxcblx0XHRcdFx0XHRnZXRfVVJMKCkucmV2b2tlT2JqZWN0VVJMKGZpbGUpO1xuXHRcdFx0XHR9IGVsc2UgeyAvLyBmaWxlIGlzIGEgRmlsZVxuXHRcdFx0XHRcdGZpbGUucmVtb3ZlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0XHRzZXRUaW1lb3V0KHJldm9rZXIsIGFyYml0cmFyeV9yZXZva2VfdGltZW91dCk7XG5cdFx0fVxuXHRcdCwgZGlzcGF0Y2ggPSBmdW5jdGlvbihmaWxlc2F2ZXIsIGV2ZW50X3R5cGVzLCBldmVudCkge1xuXHRcdFx0ZXZlbnRfdHlwZXMgPSBbXS5jb25jYXQoZXZlbnRfdHlwZXMpO1xuXHRcdFx0dmFyIGkgPSBldmVudF90eXBlcy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHZhciBsaXN0ZW5lciA9IGZpbGVzYXZlcltcIm9uXCIgKyBldmVudF90eXBlc1tpXV07XG5cdFx0XHRcdGlmICh0eXBlb2YgbGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRsaXN0ZW5lci5jYWxsKGZpbGVzYXZlciwgZXZlbnQgfHwgZmlsZXNhdmVyKTtcblx0XHRcdFx0XHR9IGNhdGNoIChleCkge1xuXHRcdFx0XHRcdFx0dGhyb3dfb3V0c2lkZShleCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdCwgYXV0b19ib20gPSBmdW5jdGlvbihibG9iKSB7XG5cdFx0XHQvLyBwcmVwZW5kIEJPTSBmb3IgVVRGLTggWE1MIGFuZCB0ZXh0LyogdHlwZXMgKGluY2x1ZGluZyBIVE1MKVxuXHRcdFx0Ly8gbm90ZTogeW91ciBicm93c2VyIHdpbGwgYXV0b21hdGljYWxseSBjb252ZXJ0IFVURi0xNiBVK0ZFRkYgdG8gRUYgQkIgQkZcblx0XHRcdGlmICgvXlxccyooPzp0ZXh0XFwvXFxTKnxhcHBsaWNhdGlvblxcL3htbHxcXFMqXFwvXFxTKlxcK3htbClcXHMqOy4qY2hhcnNldFxccyo9XFxzKnV0Zi04L2kudGVzdChibG9iLnR5cGUpKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgQmxvYihbU3RyaW5nLmZyb21DaGFyQ29kZSgweEZFRkYpLCBibG9iXSwge3R5cGU6IGJsb2IudHlwZX0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGJsb2I7XG5cdFx0fVxuXHRcdCwgRmlsZVNhdmVyID0gZnVuY3Rpb24oYmxvYiwgbmFtZSwgbm9fYXV0b19ib20pIHtcblx0XHRcdGlmICghbm9fYXV0b19ib20pIHtcblx0XHRcdFx0YmxvYiA9IGF1dG9fYm9tKGJsb2IpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gRmlyc3QgdHJ5IGEuZG93bmxvYWQsIHRoZW4gd2ViIGZpbGVzeXN0ZW0sIHRoZW4gb2JqZWN0IFVSTHNcblx0XHRcdHZhclxuXHRcdFx0XHQgIGZpbGVzYXZlciA9IHRoaXNcblx0XHRcdFx0LCB0eXBlID0gYmxvYi50eXBlXG5cdFx0XHRcdCwgZm9yY2UgPSB0eXBlID09PSBmb3JjZV9zYXZlYWJsZV90eXBlXG5cdFx0XHRcdCwgb2JqZWN0X3VybFxuXHRcdFx0XHQsIGRpc3BhdGNoX2FsbCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGRpc3BhdGNoKGZpbGVzYXZlciwgXCJ3cml0ZXN0YXJ0IHByb2dyZXNzIHdyaXRlIHdyaXRlZW5kXCIuc3BsaXQoXCIgXCIpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyBvbiBhbnkgZmlsZXN5cyBlcnJvcnMgcmV2ZXJ0IHRvIHNhdmluZyB3aXRoIG9iamVjdCBVUkxzXG5cdFx0XHRcdCwgZnNfZXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRpZiAoKGlzX2Nocm9tZV9pb3MgfHwgKGZvcmNlICYmIGlzX3NhZmFyaSkpICYmIHZpZXcuRmlsZVJlYWRlcikge1xuXHRcdFx0XHRcdFx0Ly8gU2FmYXJpIGRvZXNuJ3QgYWxsb3cgZG93bmxvYWRpbmcgb2YgYmxvYiB1cmxzXG5cdFx0XHRcdFx0XHR2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblx0XHRcdFx0XHRcdHJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0dmFyIHVybCA9IGlzX2Nocm9tZV9pb3MgPyByZWFkZXIucmVzdWx0IDogcmVhZGVyLnJlc3VsdC5yZXBsYWNlKC9eZGF0YTpbXjtdKjsvLCAnZGF0YTphdHRhY2htZW50L2ZpbGU7Jyk7XG5cdFx0XHRcdFx0XHRcdHZhciBwb3B1cCA9IHZpZXcub3Blbih1cmwsICdfYmxhbmsnKTtcblx0XHRcdFx0XHRcdFx0aWYoIXBvcHVwKSB2aWV3LmxvY2F0aW9uLmhyZWYgPSB1cmw7XG5cdFx0XHRcdFx0XHRcdHVybD11bmRlZmluZWQ7IC8vIHJlbGVhc2UgcmVmZXJlbmNlIGJlZm9yZSBkaXNwYXRjaGluZ1xuXHRcdFx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHRcdFx0XHRkaXNwYXRjaF9hbGwoKTtcblx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRyZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTtcblx0XHRcdFx0XHRcdGZpbGVzYXZlci5yZWFkeVN0YXRlID0gZmlsZXNhdmVyLklOSVQ7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIGRvbid0IGNyZWF0ZSBtb3JlIG9iamVjdCBVUkxzIHRoYW4gbmVlZGVkXG5cdFx0XHRcdFx0aWYgKCFvYmplY3RfdXJsKSB7XG5cdFx0XHRcdFx0XHRvYmplY3RfdXJsID0gZ2V0X1VSTCgpLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKGZvcmNlKSB7XG5cdFx0XHRcdFx0XHR2aWV3LmxvY2F0aW9uLmhyZWYgPSBvYmplY3RfdXJsO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR2YXIgb3BlbmVkID0gdmlldy5vcGVuKG9iamVjdF91cmwsIFwiX2JsYW5rXCIpO1xuXHRcdFx0XHRcdFx0aWYgKCFvcGVuZWQpIHtcblx0XHRcdFx0XHRcdFx0Ly8gQXBwbGUgZG9lcyBub3QgYWxsb3cgd2luZG93Lm9wZW4sIHNlZSBodHRwczovL2RldmVsb3Blci5hcHBsZS5jb20vbGlicmFyeS9zYWZhcmkvZG9jdW1lbnRhdGlvbi9Ub29scy9Db25jZXB0dWFsL1NhZmFyaUV4dGVuc2lvbkd1aWRlL1dvcmtpbmd3aXRoV2luZG93c2FuZFRhYnMvV29ya2luZ3dpdGhXaW5kb3dzYW5kVGFicy5odG1sXG5cdFx0XHRcdFx0XHRcdHZpZXcubG9jYXRpb24uaHJlZiA9IG9iamVjdF91cmw7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGZpbGVzYXZlci5yZWFkeVN0YXRlID0gZmlsZXNhdmVyLkRPTkU7XG5cdFx0XHRcdFx0ZGlzcGF0Y2hfYWxsKCk7XG5cdFx0XHRcdFx0cmV2b2tlKG9iamVjdF91cmwpO1xuXHRcdFx0XHR9XG5cdFx0XHQ7XG5cdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5JTklUO1xuXG5cdFx0XHRpZiAoY2FuX3VzZV9zYXZlX2xpbmspIHtcblx0XHRcdFx0b2JqZWN0X3VybCA9IGdldF9VUkwoKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0c2F2ZV9saW5rLmhyZWYgPSBvYmplY3RfdXJsO1xuXHRcdFx0XHRcdHNhdmVfbGluay5kb3dubG9hZCA9IG5hbWU7XG5cdFx0XHRcdFx0Y2xpY2soc2F2ZV9saW5rKTtcblx0XHRcdFx0XHRkaXNwYXRjaF9hbGwoKTtcblx0XHRcdFx0XHRyZXZva2Uob2JqZWN0X3VybCk7XG5cdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuRE9ORTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0ZnNfZXJyb3IoKTtcblx0XHR9XG5cdFx0LCBGU19wcm90byA9IEZpbGVTYXZlci5wcm90b3R5cGVcblx0XHQsIHNhdmVBcyA9IGZ1bmN0aW9uKGJsb2IsIG5hbWUsIG5vX2F1dG9fYm9tKSB7XG5cdFx0XHRyZXR1cm4gbmV3IEZpbGVTYXZlcihibG9iLCBuYW1lIHx8IGJsb2IubmFtZSB8fCBcImRvd25sb2FkXCIsIG5vX2F1dG9fYm9tKTtcblx0XHR9XG5cdDtcblx0Ly8gSUUgMTArIChuYXRpdmUgc2F2ZUFzKVxuXHRpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gXCJ1bmRlZmluZWRcIiAmJiBuYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYikge1xuXHRcdHJldHVybiBmdW5jdGlvbihibG9iLCBuYW1lLCBub19hdXRvX2JvbSkge1xuXHRcdFx0bmFtZSA9IG5hbWUgfHwgYmxvYi5uYW1lIHx8IFwiZG93bmxvYWRcIjtcblxuXHRcdFx0aWYgKCFub19hdXRvX2JvbSkge1xuXHRcdFx0XHRibG9iID0gYXV0b19ib20oYmxvYik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IoYmxvYiwgbmFtZSk7XG5cdFx0fTtcblx0fVxuXG5cdEZTX3Byb3RvLmFib3J0ID0gZnVuY3Rpb24oKXt9O1xuXHRGU19wcm90by5yZWFkeVN0YXRlID0gRlNfcHJvdG8uSU5JVCA9IDA7XG5cdEZTX3Byb3RvLldSSVRJTkcgPSAxO1xuXHRGU19wcm90by5ET05FID0gMjtcblxuXHRGU19wcm90by5lcnJvciA9XG5cdEZTX3Byb3RvLm9ud3JpdGVzdGFydCA9XG5cdEZTX3Byb3RvLm9ucHJvZ3Jlc3MgPVxuXHRGU19wcm90by5vbndyaXRlID1cblx0RlNfcHJvdG8ub25hYm9ydCA9XG5cdEZTX3Byb3RvLm9uZXJyb3IgPVxuXHRGU19wcm90by5vbndyaXRlZW5kID1cblx0XHRudWxsO1xuXG5cdHJldHVybiBzYXZlQXM7XG59KFxuXHQgICB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiAmJiBzZWxmXG5cdHx8IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93XG5cdHx8IHRoaXMuY29udGVudFxuKSk7XG4vLyBgc2VsZmAgaXMgdW5kZWZpbmVkIGluIEZpcmVmb3ggZm9yIEFuZHJvaWQgY29udGVudCBzY3JpcHQgY29udGV4dFxuLy8gd2hpbGUgYHRoaXNgIGlzIG5zSUNvbnRlbnRGcmFtZU1lc3NhZ2VNYW5hZ2VyXG4vLyB3aXRoIGFuIGF0dHJpYnV0ZSBgY29udGVudGAgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgd2luZG93XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gIG1vZHVsZS5leHBvcnRzLnNhdmVBcyA9IHNhdmVBcztcbn0gZWxzZSBpZiAoKHR5cGVvZiBkZWZpbmUgIT09IFwidW5kZWZpbmVkXCIgJiYgZGVmaW5lICE9PSBudWxsKSAmJiAoZGVmaW5lLmFtZCAhPT0gbnVsbCkpIHtcbiAgZGVmaW5lKFwiRmlsZVNhdmVyLmpzXCIsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzYXZlQXM7XG4gIH0pO1xufVxuIiwiLyohIGllZWU3NTQuIEJTRC0zLUNsYXVzZSBMaWNlbnNlLiBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmcvb3BlbnNvdXJjZT4gKi9cbmV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gKGUgKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gKG0gKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAoKHZhbHVlICogYykgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsIi8qIVxuXG5KU1ppcCB2My43LjEgLSBBIEphdmFTY3JpcHQgY2xhc3MgZm9yIGdlbmVyYXRpbmcgYW5kIHJlYWRpbmcgemlwIGZpbGVzXG48aHR0cDovL3N0dWFydGsuY29tL2pzemlwPlxuXG4oYykgMjAwOS0yMDE2IFN0dWFydCBLbmlnaHRsZXkgPHN0dWFydCBbYXRdIHN0dWFydGsuY29tPlxuRHVhbCBsaWNlbmNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2Ugb3IgR1BMdjMuIFNlZSBodHRwczovL3Jhdy5naXRodWIuY29tL1N0dWsvanN6aXAvbWFzdGVyL0xJQ0VOU0UubWFya2Rvd24uXG5cbkpTWmlwIHVzZXMgdGhlIGxpYnJhcnkgcGFrbyByZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgOlxuaHR0cHM6Ly9naXRodWIuY29tL25vZGVjYS9wYWtvL2Jsb2IvbWFzdGVyL0xJQ0VOU0VcbiovXG5cbiFmdW5jdGlvbih0KXtpZihcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIG1vZHVsZSltb2R1bGUuZXhwb3J0cz10KCk7ZWxzZSBpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQpZGVmaW5lKFtdLHQpO2Vsc2V7KFwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6dGhpcykuSlNaaXA9dCgpfX0oZnVuY3Rpb24oKXtyZXR1cm4gZnVuY3Rpb24gcyhhLG8saCl7ZnVuY3Rpb24gdShyLHQpe2lmKCFvW3JdKXtpZighYVtyXSl7dmFyIGU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighdCYmZSlyZXR1cm4gZShyLCEwKTtpZihsKXJldHVybiBsKHIsITApO3ZhciBpPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrcitcIidcIik7dGhyb3cgaS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGl9dmFyIG49b1tyXT17ZXhwb3J0czp7fX07YVtyXVswXS5jYWxsKG4uZXhwb3J0cyxmdW5jdGlvbih0KXt2YXIgZT1hW3JdWzFdW3RdO3JldHVybiB1KGV8fHQpfSxuLG4uZXhwb3J0cyxzLGEsbyxoKX1yZXR1cm4gb1tyXS5leHBvcnRzfWZvcih2YXIgbD1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLHQ9MDt0PGgubGVuZ3RoO3QrKyl1KGhbdF0pO3JldHVybiB1fSh7MTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBjPXQoXCIuL3V0aWxzXCIpLGQ9dChcIi4vc3VwcG9ydFwiKSxwPVwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz1cIjtyLmVuY29kZT1mdW5jdGlvbih0KXtmb3IodmFyIGUscixpLG4scyxhLG8saD1bXSx1PTAsbD10Lmxlbmd0aCxmPWwsZD1cInN0cmluZ1wiIT09Yy5nZXRUeXBlT2YodCk7dTx0Lmxlbmd0aDspZj1sLXUsaT1kPyhlPXRbdSsrXSxyPXU8bD90W3UrK106MCx1PGw/dFt1KytdOjApOihlPXQuY2hhckNvZGVBdCh1KyspLHI9dTxsP3QuY2hhckNvZGVBdCh1KyspOjAsdTxsP3QuY2hhckNvZGVBdCh1KyspOjApLG49ZT4+MixzPSgzJmUpPDw0fHI+PjQsYT0xPGY/KDE1JnIpPDwyfGk+PjY6NjQsbz0yPGY/NjMmaTo2NCxoLnB1c2gocC5jaGFyQXQobikrcC5jaGFyQXQocykrcC5jaGFyQXQoYSkrcC5jaGFyQXQobykpO3JldHVybiBoLmpvaW4oXCJcIil9LHIuZGVjb2RlPWZ1bmN0aW9uKHQpe3ZhciBlLHIsaSxuLHMsYSxvPTAsaD0wLHU9XCJkYXRhOlwiO2lmKHQuc3Vic3RyKDAsdS5sZW5ndGgpPT09dSl0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGJhc2U2NCBpbnB1dCwgaXQgbG9va3MgbGlrZSBhIGRhdGEgdXJsLlwiKTt2YXIgbCxmPTMqKHQ9dC5yZXBsYWNlKC9bXkEtWmEtejAtOVxcK1xcL1xcPV0vZyxcIlwiKSkubGVuZ3RoLzQ7aWYodC5jaGFyQXQodC5sZW5ndGgtMSk9PT1wLmNoYXJBdCg2NCkmJmYtLSx0LmNoYXJBdCh0Lmxlbmd0aC0yKT09PXAuY2hhckF0KDY0KSYmZi0tLGYlMSE9MCl0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGJhc2U2NCBpbnB1dCwgYmFkIGNvbnRlbnQgbGVuZ3RoLlwiKTtmb3IobD1kLnVpbnQ4YXJyYXk/bmV3IFVpbnQ4QXJyYXkoMHxmKTpuZXcgQXJyYXkoMHxmKTtvPHQubGVuZ3RoOyllPXAuaW5kZXhPZih0LmNoYXJBdChvKyspKTw8Mnwobj1wLmluZGV4T2YodC5jaGFyQXQobysrKSkpPj40LHI9KDE1Jm4pPDw0fChzPXAuaW5kZXhPZih0LmNoYXJBdChvKyspKSk+PjIsaT0oMyZzKTw8NnwoYT1wLmluZGV4T2YodC5jaGFyQXQobysrKSkpLGxbaCsrXT1lLDY0IT09cyYmKGxbaCsrXT1yKSw2NCE9PWEmJihsW2grK109aSk7cmV0dXJuIGx9fSx7XCIuL3N1cHBvcnRcIjozMCxcIi4vdXRpbHNcIjozMn1dLDI6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi9leHRlcm5hbFwiKSxuPXQoXCIuL3N0cmVhbS9EYXRhV29ya2VyXCIpLHM9dChcIi4vc3RyZWFtL0NyYzMyUHJvYmVcIiksYT10KFwiLi9zdHJlYW0vRGF0YUxlbmd0aFByb2JlXCIpO2Z1bmN0aW9uIG8odCxlLHIsaSxuKXt0aGlzLmNvbXByZXNzZWRTaXplPXQsdGhpcy51bmNvbXByZXNzZWRTaXplPWUsdGhpcy5jcmMzMj1yLHRoaXMuY29tcHJlc3Npb249aSx0aGlzLmNvbXByZXNzZWRDb250ZW50PW59by5wcm90b3R5cGU9e2dldENvbnRlbnRXb3JrZXI6ZnVuY3Rpb24oKXt2YXIgdD1uZXcgbihpLlByb21pc2UucmVzb2x2ZSh0aGlzLmNvbXByZXNzZWRDb250ZW50KSkucGlwZSh0aGlzLmNvbXByZXNzaW9uLnVuY29tcHJlc3NXb3JrZXIoKSkucGlwZShuZXcgYShcImRhdGFfbGVuZ3RoXCIpKSxlPXRoaXM7cmV0dXJuIHQub24oXCJlbmRcIixmdW5jdGlvbigpe2lmKHRoaXMuc3RyZWFtSW5mby5kYXRhX2xlbmd0aCE9PWUudW5jb21wcmVzc2VkU2l6ZSl0aHJvdyBuZXcgRXJyb3IoXCJCdWcgOiB1bmNvbXByZXNzZWQgZGF0YSBzaXplIG1pc21hdGNoXCIpfSksdH0sZ2V0Q29tcHJlc3NlZFdvcmtlcjpmdW5jdGlvbigpe3JldHVybiBuZXcgbihpLlByb21pc2UucmVzb2x2ZSh0aGlzLmNvbXByZXNzZWRDb250ZW50KSkud2l0aFN0cmVhbUluZm8oXCJjb21wcmVzc2VkU2l6ZVwiLHRoaXMuY29tcHJlc3NlZFNpemUpLndpdGhTdHJlYW1JbmZvKFwidW5jb21wcmVzc2VkU2l6ZVwiLHRoaXMudW5jb21wcmVzc2VkU2l6ZSkud2l0aFN0cmVhbUluZm8oXCJjcmMzMlwiLHRoaXMuY3JjMzIpLndpdGhTdHJlYW1JbmZvKFwiY29tcHJlc3Npb25cIix0aGlzLmNvbXByZXNzaW9uKX19LG8uY3JlYXRlV29ya2VyRnJvbT1mdW5jdGlvbih0LGUscil7cmV0dXJuIHQucGlwZShuZXcgcykucGlwZShuZXcgYShcInVuY29tcHJlc3NlZFNpemVcIikpLnBpcGUoZS5jb21wcmVzc1dvcmtlcihyKSkucGlwZShuZXcgYShcImNvbXByZXNzZWRTaXplXCIpKS53aXRoU3RyZWFtSW5mbyhcImNvbXByZXNzaW9uXCIsZSl9LGUuZXhwb3J0cz1vfSx7XCIuL2V4dGVybmFsXCI6NixcIi4vc3RyZWFtL0NyYzMyUHJvYmVcIjoyNSxcIi4vc3RyZWFtL0RhdGFMZW5ndGhQcm9iZVwiOjI2LFwiLi9zdHJlYW0vRGF0YVdvcmtlclwiOjI3fV0sMzpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpO3IuU1RPUkU9e21hZ2ljOlwiXFwwXFwwXCIsY29tcHJlc3NXb3JrZXI6ZnVuY3Rpb24odCl7cmV0dXJuIG5ldyBpKFwiU1RPUkUgY29tcHJlc3Npb25cIil9LHVuY29tcHJlc3NXb3JrZXI6ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IGkoXCJTVE9SRSBkZWNvbXByZXNzaW9uXCIpfX0sci5ERUZMQVRFPXQoXCIuL2ZsYXRlXCIpfSx7XCIuL2ZsYXRlXCI6NyxcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDQ6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi91dGlsc1wiKTt2YXIgbz1mdW5jdGlvbigpe2Zvcih2YXIgdCxlPVtdLHI9MDtyPDI1NjtyKyspe3Q9cjtmb3IodmFyIGk9MDtpPDg7aSsrKXQ9MSZ0PzM5ODgyOTIzODRedD4+PjE6dD4+PjE7ZVtyXT10fXJldHVybiBlfSgpO2UuZXhwb3J0cz1mdW5jdGlvbih0LGUpe3JldHVybiB2b2lkIDAhPT10JiZ0Lmxlbmd0aD9cInN0cmluZ1wiIT09aS5nZXRUeXBlT2YodCk/ZnVuY3Rpb24odCxlLHIsaSl7dmFyIG49byxzPWkrcjt0Xj0tMTtmb3IodmFyIGE9aTthPHM7YSsrKXQ9dD4+PjheblsyNTUmKHReZVthXSldO3JldHVybi0xXnR9KDB8ZSx0LHQubGVuZ3RoLDApOmZ1bmN0aW9uKHQsZSxyLGkpe3ZhciBuPW8scz1pK3I7dF49LTE7Zm9yKHZhciBhPWk7YTxzO2ErKyl0PXQ+Pj44Xm5bMjU1Jih0XmUuY2hhckNvZGVBdChhKSldO3JldHVybi0xXnR9KDB8ZSx0LHQubGVuZ3RoLDApOjB9fSx7XCIuL3V0aWxzXCI6MzJ9XSw1OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ci5iYXNlNjQ9ITEsci5iaW5hcnk9ITEsci5kaXI9ITEsci5jcmVhdGVGb2xkZXJzPSEwLHIuZGF0ZT1udWxsLHIuY29tcHJlc3Npb249bnVsbCxyLmNvbXByZXNzaW9uT3B0aW9ucz1udWxsLHIuY29tbWVudD1udWxsLHIudW5peFBlcm1pc3Npb25zPW51bGwsci5kb3NQZXJtaXNzaW9ucz1udWxsfSx7fV0sNjpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPW51bGw7aT1cInVuZGVmaW5lZFwiIT10eXBlb2YgUHJvbWlzZT9Qcm9taXNlOnQoXCJsaWVcIiksZS5leHBvcnRzPXtQcm9taXNlOml9fSx7bGllOjM3fV0sNzpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50OEFycmF5JiZcInVuZGVmaW5lZFwiIT10eXBlb2YgVWludDE2QXJyYXkmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50MzJBcnJheSxuPXQoXCJwYWtvXCIpLHM9dChcIi4vdXRpbHNcIiksYT10KFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKSxvPWk/XCJ1aW50OGFycmF5XCI6XCJhcnJheVwiO2Z1bmN0aW9uIGgodCxlKXthLmNhbGwodGhpcyxcIkZsYXRlV29ya2VyL1wiK3QpLHRoaXMuX3Bha289bnVsbCx0aGlzLl9wYWtvQWN0aW9uPXQsdGhpcy5fcGFrb09wdGlvbnM9ZSx0aGlzLm1ldGE9e319ci5tYWdpYz1cIlxcYlxcMFwiLHMuaW5oZXJpdHMoaCxhKSxoLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24odCl7dGhpcy5tZXRhPXQubWV0YSxudWxsPT09dGhpcy5fcGFrbyYmdGhpcy5fY3JlYXRlUGFrbygpLHRoaXMuX3Bha28ucHVzaChzLnRyYW5zZm9ybVRvKG8sdC5kYXRhKSwhMSl9LGgucHJvdG90eXBlLmZsdXNoPWZ1bmN0aW9uKCl7YS5wcm90b3R5cGUuZmx1c2guY2FsbCh0aGlzKSxudWxsPT09dGhpcy5fcGFrbyYmdGhpcy5fY3JlYXRlUGFrbygpLHRoaXMuX3Bha28ucHVzaChbXSwhMCl9LGgucHJvdG90eXBlLmNsZWFuVXA9ZnVuY3Rpb24oKXthLnByb3RvdHlwZS5jbGVhblVwLmNhbGwodGhpcyksdGhpcy5fcGFrbz1udWxsfSxoLnByb3RvdHlwZS5fY3JlYXRlUGFrbz1mdW5jdGlvbigpe3RoaXMuX3Bha289bmV3IG5bdGhpcy5fcGFrb0FjdGlvbl0oe3JhdzohMCxsZXZlbDp0aGlzLl9wYWtvT3B0aW9ucy5sZXZlbHx8LTF9KTt2YXIgZT10aGlzO3RoaXMuX3Bha28ub25EYXRhPWZ1bmN0aW9uKHQpe2UucHVzaCh7ZGF0YTp0LG1ldGE6ZS5tZXRhfSl9fSxyLmNvbXByZXNzV29ya2VyPWZ1bmN0aW9uKHQpe3JldHVybiBuZXcgaChcIkRlZmxhdGVcIix0KX0sci51bmNvbXByZXNzV29ya2VyPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBoKFwiSW5mbGF0ZVwiLHt9KX19LHtcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4vdXRpbHNcIjozMixwYWtvOjM4fV0sODpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIEEodCxlKXt2YXIgcixpPVwiXCI7Zm9yKHI9MDtyPGU7cisrKWkrPVN0cmluZy5mcm9tQ2hhckNvZGUoMjU1JnQpLHQ+Pj49ODtyZXR1cm4gaX1mdW5jdGlvbiBpKHQsZSxyLGksbixzKXt2YXIgYSxvLGg9dC5maWxlLHU9dC5jb21wcmVzc2lvbixsPXMhPT1PLnV0ZjhlbmNvZGUsZj1JLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIscyhoLm5hbWUpKSxkPUkudHJhbnNmb3JtVG8oXCJzdHJpbmdcIixPLnV0ZjhlbmNvZGUoaC5uYW1lKSksYz1oLmNvbW1lbnQscD1JLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIscyhjKSksbT1JLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsTy51dGY4ZW5jb2RlKGMpKSxfPWQubGVuZ3RoIT09aC5uYW1lLmxlbmd0aCxnPW0ubGVuZ3RoIT09Yy5sZW5ndGgsYj1cIlwiLHY9XCJcIix5PVwiXCIsdz1oLmRpcixrPWguZGF0ZSx4PXtjcmMzMjowLGNvbXByZXNzZWRTaXplOjAsdW5jb21wcmVzc2VkU2l6ZTowfTtlJiYhcnx8KHguY3JjMzI9dC5jcmMzMix4LmNvbXByZXNzZWRTaXplPXQuY29tcHJlc3NlZFNpemUseC51bmNvbXByZXNzZWRTaXplPXQudW5jb21wcmVzc2VkU2l6ZSk7dmFyIFM9MDtlJiYoU3w9OCksbHx8IV8mJiFnfHwoU3w9MjA0OCk7dmFyIHo9MCxDPTA7dyYmKHp8PTE2KSxcIlVOSVhcIj09PW4/KEM9Nzk4LHp8PWZ1bmN0aW9uKHQsZSl7dmFyIHI9dDtyZXR1cm4gdHx8KHI9ZT8xNjg5MzozMzIwNCksKDY1NTM1JnIpPDwxNn0oaC51bml4UGVybWlzc2lvbnMsdykpOihDPTIwLHp8PWZ1bmN0aW9uKHQpe3JldHVybiA2MyYodHx8MCl9KGguZG9zUGVybWlzc2lvbnMpKSxhPWsuZ2V0VVRDSG91cnMoKSxhPDw9NixhfD1rLmdldFVUQ01pbnV0ZXMoKSxhPDw9NSxhfD1rLmdldFVUQ1NlY29uZHMoKS8yLG89ay5nZXRVVENGdWxsWWVhcigpLTE5ODAsbzw8PTQsb3w9ay5nZXRVVENNb250aCgpKzEsbzw8PTUsb3w9ay5nZXRVVENEYXRlKCksXyYmKHY9QSgxLDEpK0EoQihmKSw0KStkLGIrPVwidXBcIitBKHYubGVuZ3RoLDIpK3YpLGcmJih5PUEoMSwxKStBKEIocCksNCkrbSxiKz1cInVjXCIrQSh5Lmxlbmd0aCwyKSt5KTt2YXIgRT1cIlwiO3JldHVybiBFKz1cIlxcblxcMFwiLEUrPUEoUywyKSxFKz11Lm1hZ2ljLEUrPUEoYSwyKSxFKz1BKG8sMiksRSs9QSh4LmNyYzMyLDQpLEUrPUEoeC5jb21wcmVzc2VkU2l6ZSw0KSxFKz1BKHgudW5jb21wcmVzc2VkU2l6ZSw0KSxFKz1BKGYubGVuZ3RoLDIpLEUrPUEoYi5sZW5ndGgsMikse2ZpbGVSZWNvcmQ6Ui5MT0NBTF9GSUxFX0hFQURFUitFK2YrYixkaXJSZWNvcmQ6Ui5DRU5UUkFMX0ZJTEVfSEVBREVSK0EoQywyKStFK0EocC5sZW5ndGgsMikrXCJcXDBcXDBcXDBcXDBcIitBKHosNCkrQShpLDQpK2YrYitwfX12YXIgST10KFwiLi4vdXRpbHNcIiksbj10KFwiLi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIiksTz10KFwiLi4vdXRmOFwiKSxCPXQoXCIuLi9jcmMzMlwiKSxSPXQoXCIuLi9zaWduYXR1cmVcIik7ZnVuY3Rpb24gcyh0LGUscixpKXtuLmNhbGwodGhpcyxcIlppcEZpbGVXb3JrZXJcIiksdGhpcy5ieXRlc1dyaXR0ZW49MCx0aGlzLnppcENvbW1lbnQ9ZSx0aGlzLnppcFBsYXRmb3JtPXIsdGhpcy5lbmNvZGVGaWxlTmFtZT1pLHRoaXMuc3RyZWFtRmlsZXM9dCx0aGlzLmFjY3VtdWxhdGU9ITEsdGhpcy5jb250ZW50QnVmZmVyPVtdLHRoaXMuZGlyUmVjb3Jkcz1bXSx0aGlzLmN1cnJlbnRTb3VyY2VPZmZzZXQ9MCx0aGlzLmVudHJpZXNDb3VudD0wLHRoaXMuY3VycmVudEZpbGU9bnVsbCx0aGlzLl9zb3VyY2VzPVtdfUkuaW5oZXJpdHMocyxuKSxzLnByb3RvdHlwZS5wdXNoPWZ1bmN0aW9uKHQpe3ZhciBlPXQubWV0YS5wZXJjZW50fHwwLHI9dGhpcy5lbnRyaWVzQ291bnQsaT10aGlzLl9zb3VyY2VzLmxlbmd0aDt0aGlzLmFjY3VtdWxhdGU/dGhpcy5jb250ZW50QnVmZmVyLnB1c2godCk6KHRoaXMuYnl0ZXNXcml0dGVuKz10LmRhdGEubGVuZ3RoLG4ucHJvdG90eXBlLnB1c2guY2FsbCh0aGlzLHtkYXRhOnQuZGF0YSxtZXRhOntjdXJyZW50RmlsZTp0aGlzLmN1cnJlbnRGaWxlLHBlcmNlbnQ6cj8oZSsxMDAqKHItaS0xKSkvcjoxMDB9fSkpfSxzLnByb3RvdHlwZS5vcGVuZWRTb3VyY2U9ZnVuY3Rpb24odCl7dGhpcy5jdXJyZW50U291cmNlT2Zmc2V0PXRoaXMuYnl0ZXNXcml0dGVuLHRoaXMuY3VycmVudEZpbGU9dC5maWxlLm5hbWU7dmFyIGU9dGhpcy5zdHJlYW1GaWxlcyYmIXQuZmlsZS5kaXI7aWYoZSl7dmFyIHI9aSh0LGUsITEsdGhpcy5jdXJyZW50U291cmNlT2Zmc2V0LHRoaXMuemlwUGxhdGZvcm0sdGhpcy5lbmNvZGVGaWxlTmFtZSk7dGhpcy5wdXNoKHtkYXRhOnIuZmlsZVJlY29yZCxtZXRhOntwZXJjZW50OjB9fSl9ZWxzZSB0aGlzLmFjY3VtdWxhdGU9ITB9LHMucHJvdG90eXBlLmNsb3NlZFNvdXJjZT1mdW5jdGlvbih0KXt0aGlzLmFjY3VtdWxhdGU9ITE7dmFyIGU9dGhpcy5zdHJlYW1GaWxlcyYmIXQuZmlsZS5kaXIscj1pKHQsZSwhMCx0aGlzLmN1cnJlbnRTb3VyY2VPZmZzZXQsdGhpcy56aXBQbGF0Zm9ybSx0aGlzLmVuY29kZUZpbGVOYW1lKTtpZih0aGlzLmRpclJlY29yZHMucHVzaChyLmRpclJlY29yZCksZSl0aGlzLnB1c2goe2RhdGE6ZnVuY3Rpb24odCl7cmV0dXJuIFIuREFUQV9ERVNDUklQVE9SK0EodC5jcmMzMiw0KStBKHQuY29tcHJlc3NlZFNpemUsNCkrQSh0LnVuY29tcHJlc3NlZFNpemUsNCl9KHQpLG1ldGE6e3BlcmNlbnQ6MTAwfX0pO2Vsc2UgZm9yKHRoaXMucHVzaCh7ZGF0YTpyLmZpbGVSZWNvcmQsbWV0YTp7cGVyY2VudDowfX0pO3RoaXMuY29udGVudEJ1ZmZlci5sZW5ndGg7KXRoaXMucHVzaCh0aGlzLmNvbnRlbnRCdWZmZXIuc2hpZnQoKSk7dGhpcy5jdXJyZW50RmlsZT1udWxsfSxzLnByb3RvdHlwZS5mbHVzaD1mdW5jdGlvbigpe2Zvcih2YXIgdD10aGlzLmJ5dGVzV3JpdHRlbixlPTA7ZTx0aGlzLmRpclJlY29yZHMubGVuZ3RoO2UrKyl0aGlzLnB1c2goe2RhdGE6dGhpcy5kaXJSZWNvcmRzW2VdLG1ldGE6e3BlcmNlbnQ6MTAwfX0pO3ZhciByPXRoaXMuYnl0ZXNXcml0dGVuLXQsaT1mdW5jdGlvbih0LGUscixpLG4pe3ZhciBzPUkudHJhbnNmb3JtVG8oXCJzdHJpbmdcIixuKGkpKTtyZXR1cm4gUi5DRU5UUkFMX0RJUkVDVE9SWV9FTkQrXCJcXDBcXDBcXDBcXDBcIitBKHQsMikrQSh0LDIpK0EoZSw0KStBKHIsNCkrQShzLmxlbmd0aCwyKStzfSh0aGlzLmRpclJlY29yZHMubGVuZ3RoLHIsdCx0aGlzLnppcENvbW1lbnQsdGhpcy5lbmNvZGVGaWxlTmFtZSk7dGhpcy5wdXNoKHtkYXRhOmksbWV0YTp7cGVyY2VudDoxMDB9fSl9LHMucHJvdG90eXBlLnByZXBhcmVOZXh0U291cmNlPWZ1bmN0aW9uKCl7dGhpcy5wcmV2aW91cz10aGlzLl9zb3VyY2VzLnNoaWZ0KCksdGhpcy5vcGVuZWRTb3VyY2UodGhpcy5wcmV2aW91cy5zdHJlYW1JbmZvKSx0aGlzLmlzUGF1c2VkP3RoaXMucHJldmlvdXMucGF1c2UoKTp0aGlzLnByZXZpb3VzLnJlc3VtZSgpfSxzLnByb3RvdHlwZS5yZWdpc3RlclByZXZpb3VzPWZ1bmN0aW9uKHQpe3RoaXMuX3NvdXJjZXMucHVzaCh0KTt2YXIgZT10aGlzO3JldHVybiB0Lm9uKFwiZGF0YVwiLGZ1bmN0aW9uKHQpe2UucHJvY2Vzc0NodW5rKHQpfSksdC5vbihcImVuZFwiLGZ1bmN0aW9uKCl7ZS5jbG9zZWRTb3VyY2UoZS5wcmV2aW91cy5zdHJlYW1JbmZvKSxlLl9zb3VyY2VzLmxlbmd0aD9lLnByZXBhcmVOZXh0U291cmNlKCk6ZS5lbmQoKX0pLHQub24oXCJlcnJvclwiLGZ1bmN0aW9uKHQpe2UuZXJyb3IodCl9KSx0aGlzfSxzLnByb3RvdHlwZS5yZXN1bWU9ZnVuY3Rpb24oKXtyZXR1cm4hIW4ucHJvdG90eXBlLnJlc3VtZS5jYWxsKHRoaXMpJiYoIXRoaXMucHJldmlvdXMmJnRoaXMuX3NvdXJjZXMubGVuZ3RoPyh0aGlzLnByZXBhcmVOZXh0U291cmNlKCksITApOnRoaXMucHJldmlvdXN8fHRoaXMuX3NvdXJjZXMubGVuZ3RofHx0aGlzLmdlbmVyYXRlZEVycm9yP3ZvaWQgMDoodGhpcy5lbmQoKSwhMCkpfSxzLnByb3RvdHlwZS5lcnJvcj1mdW5jdGlvbih0KXt2YXIgZT10aGlzLl9zb3VyY2VzO2lmKCFuLnByb3RvdHlwZS5lcnJvci5jYWxsKHRoaXMsdCkpcmV0dXJuITE7Zm9yKHZhciByPTA7cjxlLmxlbmd0aDtyKyspdHJ5e2Vbcl0uZXJyb3IodCl9Y2F0Y2godCl7fXJldHVybiEwfSxzLnByb3RvdHlwZS5sb2NrPWZ1bmN0aW9uKCl7bi5wcm90b3R5cGUubG9jay5jYWxsKHRoaXMpO2Zvcih2YXIgdD10aGlzLl9zb3VyY2VzLGU9MDtlPHQubGVuZ3RoO2UrKyl0W2VdLmxvY2soKX0sZS5leHBvcnRzPXN9LHtcIi4uL2NyYzMyXCI6NCxcIi4uL3NpZ25hdHVyZVwiOjIzLFwiLi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4uL3V0ZjhcIjozMSxcIi4uL3V0aWxzXCI6MzJ9XSw5OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHU9dChcIi4uL2NvbXByZXNzaW9uc1wiKSxpPXQoXCIuL1ppcEZpbGVXb3JrZXJcIik7ci5nZW5lcmF0ZVdvcmtlcj1mdW5jdGlvbih0LGEsZSl7dmFyIG89bmV3IGkoYS5zdHJlYW1GaWxlcyxlLGEucGxhdGZvcm0sYS5lbmNvZGVGaWxlTmFtZSksaD0wO3RyeXt0LmZvckVhY2goZnVuY3Rpb24odCxlKXtoKys7dmFyIHI9ZnVuY3Rpb24odCxlKXt2YXIgcj10fHxlLGk9dVtyXTtpZighaSl0aHJvdyBuZXcgRXJyb3IocitcIiBpcyBub3QgYSB2YWxpZCBjb21wcmVzc2lvbiBtZXRob2QgIVwiKTtyZXR1cm4gaX0oZS5vcHRpb25zLmNvbXByZXNzaW9uLGEuY29tcHJlc3Npb24pLGk9ZS5vcHRpb25zLmNvbXByZXNzaW9uT3B0aW9uc3x8YS5jb21wcmVzc2lvbk9wdGlvbnN8fHt9LG49ZS5kaXIscz1lLmRhdGU7ZS5fY29tcHJlc3NXb3JrZXIocixpKS53aXRoU3RyZWFtSW5mbyhcImZpbGVcIix7bmFtZTp0LGRpcjpuLGRhdGU6cyxjb21tZW50OmUuY29tbWVudHx8XCJcIix1bml4UGVybWlzc2lvbnM6ZS51bml4UGVybWlzc2lvbnMsZG9zUGVybWlzc2lvbnM6ZS5kb3NQZXJtaXNzaW9uc30pLnBpcGUobyl9KSxvLmVudHJpZXNDb3VudD1ofWNhdGNoKHQpe28uZXJyb3IodCl9cmV0dXJuIG99fSx7XCIuLi9jb21wcmVzc2lvbnNcIjozLFwiLi9aaXBGaWxlV29ya2VyXCI6OH1dLDEwOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gaSgpe2lmKCEodGhpcyBpbnN0YW5jZW9mIGkpKXJldHVybiBuZXcgaTtpZihhcmd1bWVudHMubGVuZ3RoKXRocm93IG5ldyBFcnJvcihcIlRoZSBjb25zdHJ1Y3RvciB3aXRoIHBhcmFtZXRlcnMgaGFzIGJlZW4gcmVtb3ZlZCBpbiBKU1ppcCAzLjAsIHBsZWFzZSBjaGVjayB0aGUgdXBncmFkZSBndWlkZS5cIik7dGhpcy5maWxlcz1PYmplY3QuY3JlYXRlKG51bGwpLHRoaXMuY29tbWVudD1udWxsLHRoaXMucm9vdD1cIlwiLHRoaXMuY2xvbmU9ZnVuY3Rpb24oKXt2YXIgdD1uZXcgaTtmb3IodmFyIGUgaW4gdGhpcylcImZ1bmN0aW9uXCIhPXR5cGVvZiB0aGlzW2VdJiYodFtlXT10aGlzW2VdKTtyZXR1cm4gdH19KGkucHJvdG90eXBlPXQoXCIuL29iamVjdFwiKSkubG9hZEFzeW5jPXQoXCIuL2xvYWRcIiksaS5zdXBwb3J0PXQoXCIuL3N1cHBvcnRcIiksaS5kZWZhdWx0cz10KFwiLi9kZWZhdWx0c1wiKSxpLnZlcnNpb249XCIzLjcuMVwiLGkubG9hZEFzeW5jPWZ1bmN0aW9uKHQsZSl7cmV0dXJuKG5ldyBpKS5sb2FkQXN5bmModCxlKX0saS5leHRlcm5hbD10KFwiLi9leHRlcm5hbFwiKSxlLmV4cG9ydHM9aX0se1wiLi9kZWZhdWx0c1wiOjUsXCIuL2V4dGVybmFsXCI6NixcIi4vbG9hZFwiOjExLFwiLi9vYmplY3RcIjoxNSxcIi4vc3VwcG9ydFwiOjMwfV0sMTE6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi91dGlsc1wiKSxuPXQoXCIuL2V4dGVybmFsXCIpLG89dChcIi4vdXRmOFwiKSxoPXQoXCIuL3ppcEVudHJpZXNcIikscz10KFwiLi9zdHJlYW0vQ3JjMzJQcm9iZVwiKSx1PXQoXCIuL25vZGVqc1V0aWxzXCIpO2Z1bmN0aW9uIGwoaSl7cmV0dXJuIG5ldyBuLlByb21pc2UoZnVuY3Rpb24odCxlKXt2YXIgcj1pLmRlY29tcHJlc3NlZC5nZXRDb250ZW50V29ya2VyKCkucGlwZShuZXcgcyk7ci5vbihcImVycm9yXCIsZnVuY3Rpb24odCl7ZSh0KX0pLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtyLnN0cmVhbUluZm8uY3JjMzIhPT1pLmRlY29tcHJlc3NlZC5jcmMzMj9lKG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXAgOiBDUkMzMiBtaXNtYXRjaFwiKSk6dCgpfSkucmVzdW1lKCl9KX1lLmV4cG9ydHM9ZnVuY3Rpb24odCxzKXt2YXIgYT10aGlzO3JldHVybiBzPWkuZXh0ZW5kKHN8fHt9LHtiYXNlNjQ6ITEsY2hlY2tDUkMzMjohMSxvcHRpbWl6ZWRCaW5hcnlTdHJpbmc6ITEsY3JlYXRlRm9sZGVyczohMSxkZWNvZGVGaWxlTmFtZTpvLnV0ZjhkZWNvZGV9KSx1LmlzTm9kZSYmdS5pc1N0cmVhbSh0KT9uLlByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkpTWmlwIGNhbid0IGFjY2VwdCBhIHN0cmVhbSB3aGVuIGxvYWRpbmcgYSB6aXAgZmlsZS5cIikpOmkucHJlcGFyZUNvbnRlbnQoXCJ0aGUgbG9hZGVkIHppcCBmaWxlXCIsdCwhMCxzLm9wdGltaXplZEJpbmFyeVN0cmluZyxzLmJhc2U2NCkudGhlbihmdW5jdGlvbih0KXt2YXIgZT1uZXcgaChzKTtyZXR1cm4gZS5sb2FkKHQpLGV9KS50aGVuKGZ1bmN0aW9uKHQpe3ZhciBlPVtuLlByb21pc2UucmVzb2x2ZSh0KV0scj10LmZpbGVzO2lmKHMuY2hlY2tDUkMzMilmb3IodmFyIGk9MDtpPHIubGVuZ3RoO2krKyllLnB1c2gobChyW2ldKSk7cmV0dXJuIG4uUHJvbWlzZS5hbGwoZSl9KS50aGVuKGZ1bmN0aW9uKHQpe2Zvcih2YXIgZT10LnNoaWZ0KCkscj1lLmZpbGVzLGk9MDtpPHIubGVuZ3RoO2krKyl7dmFyIG49cltpXTthLmZpbGUobi5maWxlTmFtZVN0cixuLmRlY29tcHJlc3NlZCx7YmluYXJ5OiEwLG9wdGltaXplZEJpbmFyeVN0cmluZzohMCxkYXRlOm4uZGF0ZSxkaXI6bi5kaXIsY29tbWVudDpuLmZpbGVDb21tZW50U3RyLmxlbmd0aD9uLmZpbGVDb21tZW50U3RyOm51bGwsdW5peFBlcm1pc3Npb25zOm4udW5peFBlcm1pc3Npb25zLGRvc1Blcm1pc3Npb25zOm4uZG9zUGVybWlzc2lvbnMsY3JlYXRlRm9sZGVyczpzLmNyZWF0ZUZvbGRlcnN9KX1yZXR1cm4gZS56aXBDb21tZW50Lmxlbmd0aCYmKGEuY29tbWVudD1lLnppcENvbW1lbnQpLGF9KX19LHtcIi4vZXh0ZXJuYWxcIjo2LFwiLi9ub2RlanNVdGlsc1wiOjE0LFwiLi9zdHJlYW0vQ3JjMzJQcm9iZVwiOjI1LFwiLi91dGY4XCI6MzEsXCIuL3V0aWxzXCI6MzIsXCIuL3ppcEVudHJpZXNcIjozM31dLDEyOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4uL3V0aWxzXCIpLG49dChcIi4uL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpO2Z1bmN0aW9uIHModCxlKXtuLmNhbGwodGhpcyxcIk5vZGVqcyBzdHJlYW0gaW5wdXQgYWRhcHRlciBmb3IgXCIrdCksdGhpcy5fdXBzdHJlYW1FbmRlZD0hMSx0aGlzLl9iaW5kU3RyZWFtKGUpfWkuaW5oZXJpdHMocyxuKSxzLnByb3RvdHlwZS5fYmluZFN0cmVhbT1mdW5jdGlvbih0KXt2YXIgZT10aGlzOyh0aGlzLl9zdHJlYW09dCkucGF1c2UoKSx0Lm9uKFwiZGF0YVwiLGZ1bmN0aW9uKHQpe2UucHVzaCh7ZGF0YTp0LG1ldGE6e3BlcmNlbnQ6MH19KX0pLm9uKFwiZXJyb3JcIixmdW5jdGlvbih0KXtlLmlzUGF1c2VkP3RoaXMuZ2VuZXJhdGVkRXJyb3I9dDplLmVycm9yKHQpfSkub24oXCJlbmRcIixmdW5jdGlvbigpe2UuaXNQYXVzZWQ/ZS5fdXBzdHJlYW1FbmRlZD0hMDplLmVuZCgpfSl9LHMucHJvdG90eXBlLnBhdXNlPWZ1bmN0aW9uKCl7cmV0dXJuISFuLnByb3RvdHlwZS5wYXVzZS5jYWxsKHRoaXMpJiYodGhpcy5fc3RyZWFtLnBhdXNlKCksITApfSxzLnByb3RvdHlwZS5yZXN1bWU9ZnVuY3Rpb24oKXtyZXR1cm4hIW4ucHJvdG90eXBlLnJlc3VtZS5jYWxsKHRoaXMpJiYodGhpcy5fdXBzdHJlYW1FbmRlZD90aGlzLmVuZCgpOnRoaXMuX3N0cmVhbS5yZXN1bWUoKSwhMCl9LGUuZXhwb3J0cz1zfSx7XCIuLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiOjI4LFwiLi4vdXRpbHNcIjozMn1dLDEzOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG49dChcInJlYWRhYmxlLXN0cmVhbVwiKS5SZWFkYWJsZTtmdW5jdGlvbiBpKHQsZSxyKXtuLmNhbGwodGhpcyxlKSx0aGlzLl9oZWxwZXI9dDt2YXIgaT10aGlzO3Qub24oXCJkYXRhXCIsZnVuY3Rpb24odCxlKXtpLnB1c2godCl8fGkuX2hlbHBlci5wYXVzZSgpLHImJnIoZSl9KS5vbihcImVycm9yXCIsZnVuY3Rpb24odCl7aS5lbWl0KFwiZXJyb3JcIix0KX0pLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtpLnB1c2gobnVsbCl9KX10KFwiLi4vdXRpbHNcIikuaW5oZXJpdHMoaSxuKSxpLnByb3RvdHlwZS5fcmVhZD1mdW5jdGlvbigpe3RoaXMuX2hlbHBlci5yZXN1bWUoKX0sZS5leHBvcnRzPWl9LHtcIi4uL3V0aWxzXCI6MzIsXCJyZWFkYWJsZS1zdHJlYW1cIjoxNn1dLDE0OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZS5leHBvcnRzPXtpc05vZGU6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIEJ1ZmZlcixuZXdCdWZmZXJGcm9tOmZ1bmN0aW9uKHQsZSl7aWYoQnVmZmVyLmZyb20mJkJ1ZmZlci5mcm9tIT09VWludDhBcnJheS5mcm9tKXJldHVybiBCdWZmZXIuZnJvbSh0LGUpO2lmKFwibnVtYmVyXCI9PXR5cGVvZiB0KXRocm93IG5ldyBFcnJvcignVGhlIFwiZGF0YVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIGEgbnVtYmVyJyk7cmV0dXJuIG5ldyBCdWZmZXIodCxlKX0sYWxsb2NCdWZmZXI6ZnVuY3Rpb24odCl7aWYoQnVmZmVyLmFsbG9jKXJldHVybiBCdWZmZXIuYWxsb2ModCk7dmFyIGU9bmV3IEJ1ZmZlcih0KTtyZXR1cm4gZS5maWxsKDApLGV9LGlzQnVmZmVyOmZ1bmN0aW9uKHQpe3JldHVybiBCdWZmZXIuaXNCdWZmZXIodCl9LGlzU3RyZWFtOmZ1bmN0aW9uKHQpe3JldHVybiB0JiZcImZ1bmN0aW9uXCI9PXR5cGVvZiB0Lm9uJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiB0LnBhdXNlJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiB0LnJlc3VtZX19fSx7fV0sMTU6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBzKHQsZSxyKXt2YXIgaSxuPXUuZ2V0VHlwZU9mKGUpLHM9dS5leHRlbmQocnx8e30sZik7cy5kYXRlPXMuZGF0ZXx8bmV3IERhdGUsbnVsbCE9PXMuY29tcHJlc3Npb24mJihzLmNvbXByZXNzaW9uPXMuY29tcHJlc3Npb24udG9VcHBlckNhc2UoKSksXCJzdHJpbmdcIj09dHlwZW9mIHMudW5peFBlcm1pc3Npb25zJiYocy51bml4UGVybWlzc2lvbnM9cGFyc2VJbnQocy51bml4UGVybWlzc2lvbnMsOCkpLHMudW5peFBlcm1pc3Npb25zJiYxNjM4NCZzLnVuaXhQZXJtaXNzaW9ucyYmKHMuZGlyPSEwKSxzLmRvc1Blcm1pc3Npb25zJiYxNiZzLmRvc1Blcm1pc3Npb25zJiYocy5kaXI9ITApLHMuZGlyJiYodD1nKHQpKSxzLmNyZWF0ZUZvbGRlcnMmJihpPV8odCkpJiZiLmNhbGwodGhpcyxpLCEwKTt2YXIgYT1cInN0cmluZ1wiPT09biYmITE9PT1zLmJpbmFyeSYmITE9PT1zLmJhc2U2NDtyJiZ2b2lkIDAhPT1yLmJpbmFyeXx8KHMuYmluYXJ5PSFhKSwoZSBpbnN0YW5jZW9mIGQmJjA9PT1lLnVuY29tcHJlc3NlZFNpemV8fHMuZGlyfHwhZXx8MD09PWUubGVuZ3RoKSYmKHMuYmFzZTY0PSExLHMuYmluYXJ5PSEwLGU9XCJcIixzLmNvbXByZXNzaW9uPVwiU1RPUkVcIixuPVwic3RyaW5nXCIpO3ZhciBvPW51bGw7bz1lIGluc3RhbmNlb2YgZHx8ZSBpbnN0YW5jZW9mIGw/ZTpwLmlzTm9kZSYmcC5pc1N0cmVhbShlKT9uZXcgbSh0LGUpOnUucHJlcGFyZUNvbnRlbnQodCxlLHMuYmluYXJ5LHMub3B0aW1pemVkQmluYXJ5U3RyaW5nLHMuYmFzZTY0KTt2YXIgaD1uZXcgYyh0LG8scyk7dGhpcy5maWxlc1t0XT1ofXZhciBuPXQoXCIuL3V0ZjhcIiksdT10KFwiLi91dGlsc1wiKSxsPXQoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpLGE9dChcIi4vc3RyZWFtL1N0cmVhbUhlbHBlclwiKSxmPXQoXCIuL2RlZmF1bHRzXCIpLGQ9dChcIi4vY29tcHJlc3NlZE9iamVjdFwiKSxjPXQoXCIuL3ppcE9iamVjdFwiKSxvPXQoXCIuL2dlbmVyYXRlXCIpLHA9dChcIi4vbm9kZWpzVXRpbHNcIiksbT10KFwiLi9ub2RlanMvTm9kZWpzU3RyZWFtSW5wdXRBZGFwdGVyXCIpLF89ZnVuY3Rpb24odCl7XCIvXCI9PT10LnNsaWNlKC0xKSYmKHQ9dC5zdWJzdHJpbmcoMCx0Lmxlbmd0aC0xKSk7dmFyIGU9dC5sYXN0SW5kZXhPZihcIi9cIik7cmV0dXJuIDA8ZT90LnN1YnN0cmluZygwLGUpOlwiXCJ9LGc9ZnVuY3Rpb24odCl7cmV0dXJuXCIvXCIhPT10LnNsaWNlKC0xKSYmKHQrPVwiL1wiKSx0fSxiPWZ1bmN0aW9uKHQsZSl7cmV0dXJuIGU9dm9pZCAwIT09ZT9lOmYuY3JlYXRlRm9sZGVycyx0PWcodCksdGhpcy5maWxlc1t0XXx8cy5jYWxsKHRoaXMsdCxudWxsLHtkaXI6ITAsY3JlYXRlRm9sZGVyczplfSksdGhpcy5maWxlc1t0XX07ZnVuY3Rpb24gaCh0KXtyZXR1cm5cIltvYmplY3QgUmVnRXhwXVwiPT09T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHQpfXZhciBpPXtsb2FkOmZ1bmN0aW9uKCl7dGhyb3cgbmV3IEVycm9yKFwiVGhpcyBtZXRob2QgaGFzIGJlZW4gcmVtb3ZlZCBpbiBKU1ppcCAzLjAsIHBsZWFzZSBjaGVjayB0aGUgdXBncmFkZSBndWlkZS5cIil9LGZvckVhY2g6ZnVuY3Rpb24odCl7dmFyIGUscixpO2ZvcihlIGluIHRoaXMuZmlsZXMpaT10aGlzLmZpbGVzW2VdLChyPWUuc2xpY2UodGhpcy5yb290Lmxlbmd0aCxlLmxlbmd0aCkpJiZlLnNsaWNlKDAsdGhpcy5yb290Lmxlbmd0aCk9PT10aGlzLnJvb3QmJnQocixpKX0sZmlsdGVyOmZ1bmN0aW9uKHIpe3ZhciBpPVtdO3JldHVybiB0aGlzLmZvckVhY2goZnVuY3Rpb24odCxlKXtyKHQsZSkmJmkucHVzaChlKX0pLGl9LGZpbGU6ZnVuY3Rpb24odCxlLHIpe2lmKDEhPT1hcmd1bWVudHMubGVuZ3RoKXJldHVybiB0PXRoaXMucm9vdCt0LHMuY2FsbCh0aGlzLHQsZSxyKSx0aGlzO2lmKGgodCkpe3ZhciBpPXQ7cmV0dXJuIHRoaXMuZmlsdGVyKGZ1bmN0aW9uKHQsZSl7cmV0dXJuIWUuZGlyJiZpLnRlc3QodCl9KX12YXIgbj10aGlzLmZpbGVzW3RoaXMucm9vdCt0XTtyZXR1cm4gbiYmIW4uZGlyP246bnVsbH0sZm9sZGVyOmZ1bmN0aW9uKHIpe2lmKCFyKXJldHVybiB0aGlzO2lmKGgocikpcmV0dXJuIHRoaXMuZmlsdGVyKGZ1bmN0aW9uKHQsZSl7cmV0dXJuIGUuZGlyJiZyLnRlc3QodCl9KTt2YXIgdD10aGlzLnJvb3QrcixlPWIuY2FsbCh0aGlzLHQpLGk9dGhpcy5jbG9uZSgpO3JldHVybiBpLnJvb3Q9ZS5uYW1lLGl9LHJlbW92ZTpmdW5jdGlvbihyKXtyPXRoaXMucm9vdCtyO3ZhciB0PXRoaXMuZmlsZXNbcl07aWYodHx8KFwiL1wiIT09ci5zbGljZSgtMSkmJihyKz1cIi9cIiksdD10aGlzLmZpbGVzW3JdKSx0JiYhdC5kaXIpZGVsZXRlIHRoaXMuZmlsZXNbcl07ZWxzZSBmb3IodmFyIGU9dGhpcy5maWx0ZXIoZnVuY3Rpb24odCxlKXtyZXR1cm4gZS5uYW1lLnNsaWNlKDAsci5sZW5ndGgpPT09cn0pLGk9MDtpPGUubGVuZ3RoO2krKylkZWxldGUgdGhpcy5maWxlc1tlW2ldLm5hbWVdO3JldHVybiB0aGlzfSxnZW5lcmF0ZTpmdW5jdGlvbih0KXt0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLlwiKX0sZ2VuZXJhdGVJbnRlcm5hbFN0cmVhbTpmdW5jdGlvbih0KXt2YXIgZSxyPXt9O3RyeXtpZigocj11LmV4dGVuZCh0fHx7fSx7c3RyZWFtRmlsZXM6ITEsY29tcHJlc3Npb246XCJTVE9SRVwiLGNvbXByZXNzaW9uT3B0aW9uczpudWxsLHR5cGU6XCJcIixwbGF0Zm9ybTpcIkRPU1wiLGNvbW1lbnQ6bnVsbCxtaW1lVHlwZTpcImFwcGxpY2F0aW9uL3ppcFwiLGVuY29kZUZpbGVOYW1lOm4udXRmOGVuY29kZX0pKS50eXBlPXIudHlwZS50b0xvd2VyQ2FzZSgpLHIuY29tcHJlc3Npb249ci5jb21wcmVzc2lvbi50b1VwcGVyQ2FzZSgpLFwiYmluYXJ5c3RyaW5nXCI9PT1yLnR5cGUmJihyLnR5cGU9XCJzdHJpbmdcIiksIXIudHlwZSl0aHJvdyBuZXcgRXJyb3IoXCJObyBvdXRwdXQgdHlwZSBzcGVjaWZpZWQuXCIpO3UuY2hlY2tTdXBwb3J0KHIudHlwZSksXCJkYXJ3aW5cIiE9PXIucGxhdGZvcm0mJlwiZnJlZWJzZFwiIT09ci5wbGF0Zm9ybSYmXCJsaW51eFwiIT09ci5wbGF0Zm9ybSYmXCJzdW5vc1wiIT09ci5wbGF0Zm9ybXx8KHIucGxhdGZvcm09XCJVTklYXCIpLFwid2luMzJcIj09PXIucGxhdGZvcm0mJihyLnBsYXRmb3JtPVwiRE9TXCIpO3ZhciBpPXIuY29tbWVudHx8dGhpcy5jb21tZW50fHxcIlwiO2U9by5nZW5lcmF0ZVdvcmtlcih0aGlzLHIsaSl9Y2F0Y2godCl7KGU9bmV3IGwoXCJlcnJvclwiKSkuZXJyb3IodCl9cmV0dXJuIG5ldyBhKGUsci50eXBlfHxcInN0cmluZ1wiLHIubWltZVR5cGUpfSxnZW5lcmF0ZUFzeW5jOmZ1bmN0aW9uKHQsZSl7cmV0dXJuIHRoaXMuZ2VuZXJhdGVJbnRlcm5hbFN0cmVhbSh0KS5hY2N1bXVsYXRlKGUpfSxnZW5lcmF0ZU5vZGVTdHJlYW06ZnVuY3Rpb24odCxlKXtyZXR1cm4odD10fHx7fSkudHlwZXx8KHQudHlwZT1cIm5vZGVidWZmZXJcIiksdGhpcy5nZW5lcmF0ZUludGVybmFsU3RyZWFtKHQpLnRvTm9kZWpzU3RyZWFtKGUpfX07ZS5leHBvcnRzPWl9LHtcIi4vY29tcHJlc3NlZE9iamVjdFwiOjIsXCIuL2RlZmF1bHRzXCI6NSxcIi4vZ2VuZXJhdGVcIjo5LFwiLi9ub2RlanMvTm9kZWpzU3RyZWFtSW5wdXRBZGFwdGVyXCI6MTIsXCIuL25vZGVqc1V0aWxzXCI6MTQsXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuL3N0cmVhbS9TdHJlYW1IZWxwZXJcIjoyOSxcIi4vdXRmOFwiOjMxLFwiLi91dGlsc1wiOjMyLFwiLi96aXBPYmplY3RcIjozNX1dLDE2OltmdW5jdGlvbih0LGUscil7ZS5leHBvcnRzPXQoXCJzdHJlYW1cIil9LHtzdHJlYW06dm9pZCAwfV0sMTc6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi9EYXRhUmVhZGVyXCIpO2Z1bmN0aW9uIG4odCl7aS5jYWxsKHRoaXMsdCk7Zm9yKHZhciBlPTA7ZTx0aGlzLmRhdGEubGVuZ3RoO2UrKyl0W2VdPTI1NSZ0W2VdfXQoXCIuLi91dGlsc1wiKS5pbmhlcml0cyhuLGkpLG4ucHJvdG90eXBlLmJ5dGVBdD1mdW5jdGlvbih0KXtyZXR1cm4gdGhpcy5kYXRhW3RoaXMuemVybyt0XX0sbi5wcm90b3R5cGUubGFzdEluZGV4T2ZTaWduYXR1cmU9ZnVuY3Rpb24odCl7Zm9yKHZhciBlPXQuY2hhckNvZGVBdCgwKSxyPXQuY2hhckNvZGVBdCgxKSxpPXQuY2hhckNvZGVBdCgyKSxuPXQuY2hhckNvZGVBdCgzKSxzPXRoaXMubGVuZ3RoLTQ7MDw9czstLXMpaWYodGhpcy5kYXRhW3NdPT09ZSYmdGhpcy5kYXRhW3MrMV09PT1yJiZ0aGlzLmRhdGFbcysyXT09PWkmJnRoaXMuZGF0YVtzKzNdPT09bilyZXR1cm4gcy10aGlzLnplcm87cmV0dXJuLTF9LG4ucHJvdG90eXBlLnJlYWRBbmRDaGVja1NpZ25hdHVyZT1mdW5jdGlvbih0KXt2YXIgZT10LmNoYXJDb2RlQXQoMCkscj10LmNoYXJDb2RlQXQoMSksaT10LmNoYXJDb2RlQXQoMiksbj10LmNoYXJDb2RlQXQoMykscz10aGlzLnJlYWREYXRhKDQpO3JldHVybiBlPT09c1swXSYmcj09PXNbMV0mJmk9PT1zWzJdJiZuPT09c1szXX0sbi5wcm90b3R5cGUucmVhZERhdGE9ZnVuY3Rpb24odCl7aWYodGhpcy5jaGVja09mZnNldCh0KSwwPT09dClyZXR1cm5bXTt2YXIgZT10aGlzLmRhdGEuc2xpY2UodGhpcy56ZXJvK3RoaXMuaW5kZXgsdGhpcy56ZXJvK3RoaXMuaW5kZXgrdCk7cmV0dXJuIHRoaXMuaW5kZXgrPXQsZX0sZS5leHBvcnRzPW59LHtcIi4uL3V0aWxzXCI6MzIsXCIuL0RhdGFSZWFkZXJcIjoxOH1dLDE4OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4uL3V0aWxzXCIpO2Z1bmN0aW9uIG4odCl7dGhpcy5kYXRhPXQsdGhpcy5sZW5ndGg9dC5sZW5ndGgsdGhpcy5pbmRleD0wLHRoaXMuemVybz0wfW4ucHJvdG90eXBlPXtjaGVja09mZnNldDpmdW5jdGlvbih0KXt0aGlzLmNoZWNrSW5kZXgodGhpcy5pbmRleCt0KX0sY2hlY2tJbmRleDpmdW5jdGlvbih0KXtpZih0aGlzLmxlbmd0aDx0aGlzLnplcm8rdHx8dDwwKXRocm93IG5ldyBFcnJvcihcIkVuZCBvZiBkYXRhIHJlYWNoZWQgKGRhdGEgbGVuZ3RoID0gXCIrdGhpcy5sZW5ndGgrXCIsIGFza2VkIGluZGV4ID0gXCIrdCtcIikuIENvcnJ1cHRlZCB6aXAgP1wiKX0sc2V0SW5kZXg6ZnVuY3Rpb24odCl7dGhpcy5jaGVja0luZGV4KHQpLHRoaXMuaW5kZXg9dH0sc2tpcDpmdW5jdGlvbih0KXt0aGlzLnNldEluZGV4KHRoaXMuaW5kZXgrdCl9LGJ5dGVBdDpmdW5jdGlvbih0KXt9LHJlYWRJbnQ6ZnVuY3Rpb24odCl7dmFyIGUscj0wO2Zvcih0aGlzLmNoZWNrT2Zmc2V0KHQpLGU9dGhpcy5pbmRleCt0LTE7ZT49dGhpcy5pbmRleDtlLS0pcj0ocjw8OCkrdGhpcy5ieXRlQXQoZSk7cmV0dXJuIHRoaXMuaW5kZXgrPXQscn0scmVhZFN0cmluZzpmdW5jdGlvbih0KXtyZXR1cm4gaS50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLHRoaXMucmVhZERhdGEodCkpfSxyZWFkRGF0YTpmdW5jdGlvbih0KXt9LGxhc3RJbmRleE9mU2lnbmF0dXJlOmZ1bmN0aW9uKHQpe30scmVhZEFuZENoZWNrU2lnbmF0dXJlOmZ1bmN0aW9uKHQpe30scmVhZERhdGU6ZnVuY3Rpb24oKXt2YXIgdD10aGlzLnJlYWRJbnQoNCk7cmV0dXJuIG5ldyBEYXRlKERhdGUuVVRDKDE5ODArKHQ+PjI1JjEyNyksKHQ+PjIxJjE1KS0xLHQ+PjE2JjMxLHQ+PjExJjMxLHQ+PjUmNjMsKDMxJnQpPDwxKSl9fSxlLmV4cG9ydHM9bn0se1wiLi4vdXRpbHNcIjozMn1dLDE5OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vVWludDhBcnJheVJlYWRlclwiKTtmdW5jdGlvbiBuKHQpe2kuY2FsbCh0aGlzLHQpfXQoXCIuLi91dGlsc1wiKS5pbmhlcml0cyhuLGkpLG4ucHJvdG90eXBlLnJlYWREYXRhPWZ1bmN0aW9uKHQpe3RoaXMuY2hlY2tPZmZzZXQodCk7dmFyIGU9dGhpcy5kYXRhLnNsaWNlKHRoaXMuemVybyt0aGlzLmluZGV4LHRoaXMuemVybyt0aGlzLmluZGV4K3QpO3JldHVybiB0aGlzLmluZGV4Kz10LGV9LGUuZXhwb3J0cz1ufSx7XCIuLi91dGlsc1wiOjMyLFwiLi9VaW50OEFycmF5UmVhZGVyXCI6MjF9XSwyMDpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL0RhdGFSZWFkZXJcIik7ZnVuY3Rpb24gbih0KXtpLmNhbGwodGhpcyx0KX10KFwiLi4vdXRpbHNcIikuaW5oZXJpdHMobixpKSxuLnByb3RvdHlwZS5ieXRlQXQ9ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMuZGF0YS5jaGFyQ29kZUF0KHRoaXMuemVybyt0KX0sbi5wcm90b3R5cGUubGFzdEluZGV4T2ZTaWduYXR1cmU9ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMuZGF0YS5sYXN0SW5kZXhPZih0KS10aGlzLnplcm99LG4ucHJvdG90eXBlLnJlYWRBbmRDaGVja1NpZ25hdHVyZT1mdW5jdGlvbih0KXtyZXR1cm4gdD09PXRoaXMucmVhZERhdGEoNCl9LG4ucHJvdG90eXBlLnJlYWREYXRhPWZ1bmN0aW9uKHQpe3RoaXMuY2hlY2tPZmZzZXQodCk7dmFyIGU9dGhpcy5kYXRhLnNsaWNlKHRoaXMuemVybyt0aGlzLmluZGV4LHRoaXMuemVybyt0aGlzLmluZGV4K3QpO3JldHVybiB0aGlzLmluZGV4Kz10LGV9LGUuZXhwb3J0cz1ufSx7XCIuLi91dGlsc1wiOjMyLFwiLi9EYXRhUmVhZGVyXCI6MTh9XSwyMTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL0FycmF5UmVhZGVyXCIpO2Z1bmN0aW9uIG4odCl7aS5jYWxsKHRoaXMsdCl9dChcIi4uL3V0aWxzXCIpLmluaGVyaXRzKG4saSksbi5wcm90b3R5cGUucmVhZERhdGE9ZnVuY3Rpb24odCl7aWYodGhpcy5jaGVja09mZnNldCh0KSwwPT09dClyZXR1cm4gbmV3IFVpbnQ4QXJyYXkoMCk7dmFyIGU9dGhpcy5kYXRhLnN1YmFycmF5KHRoaXMuemVybyt0aGlzLmluZGV4LHRoaXMuemVybyt0aGlzLmluZGV4K3QpO3JldHVybiB0aGlzLmluZGV4Kz10LGV9LGUuZXhwb3J0cz1ufSx7XCIuLi91dGlsc1wiOjMyLFwiLi9BcnJheVJlYWRlclwiOjE3fV0sMjI6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi4vdXRpbHNcIiksbj10KFwiLi4vc3VwcG9ydFwiKSxzPXQoXCIuL0FycmF5UmVhZGVyXCIpLGE9dChcIi4vU3RyaW5nUmVhZGVyXCIpLG89dChcIi4vTm9kZUJ1ZmZlclJlYWRlclwiKSxoPXQoXCIuL1VpbnQ4QXJyYXlSZWFkZXJcIik7ZS5leHBvcnRzPWZ1bmN0aW9uKHQpe3ZhciBlPWkuZ2V0VHlwZU9mKHQpO3JldHVybiBpLmNoZWNrU3VwcG9ydChlKSxcInN0cmluZ1wiIT09ZXx8bi51aW50OGFycmF5P1wibm9kZWJ1ZmZlclwiPT09ZT9uZXcgbyh0KTpuLnVpbnQ4YXJyYXk/bmV3IGgoaS50cmFuc2Zvcm1UbyhcInVpbnQ4YXJyYXlcIix0KSk6bmV3IHMoaS50cmFuc2Zvcm1UbyhcImFycmF5XCIsdCkpOm5ldyBhKHQpfX0se1wiLi4vc3VwcG9ydFwiOjMwLFwiLi4vdXRpbHNcIjozMixcIi4vQXJyYXlSZWFkZXJcIjoxNyxcIi4vTm9kZUJ1ZmZlclJlYWRlclwiOjE5LFwiLi9TdHJpbmdSZWFkZXJcIjoyMCxcIi4vVWludDhBcnJheVJlYWRlclwiOjIxfV0sMjM6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtyLkxPQ0FMX0ZJTEVfSEVBREVSPVwiUEtcdTAwMDNcdTAwMDRcIixyLkNFTlRSQUxfRklMRV9IRUFERVI9XCJQS1x1MDAwMVx1MDAwMlwiLHIuQ0VOVFJBTF9ESVJFQ1RPUllfRU5EPVwiUEtcdTAwMDVcdTAwMDZcIixyLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0xPQ0FUT1I9XCJQS1x1MDAwNlx1MDAwN1wiLHIuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfRU5EPVwiUEtcdTAwMDZcdTAwMDZcIixyLkRBVEFfREVTQ1JJUFRPUj1cIlBLXHUwMDA3XFxiXCJ9LHt9XSwyNDpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL0dlbmVyaWNXb3JrZXJcIiksbj10KFwiLi4vdXRpbHNcIik7ZnVuY3Rpb24gcyh0KXtpLmNhbGwodGhpcyxcIkNvbnZlcnRXb3JrZXIgdG8gXCIrdCksdGhpcy5kZXN0VHlwZT10fW4uaW5oZXJpdHMocyxpKSxzLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24odCl7dGhpcy5wdXNoKHtkYXRhOm4udHJhbnNmb3JtVG8odGhpcy5kZXN0VHlwZSx0LmRhdGEpLG1ldGE6dC5tZXRhfSl9LGUuZXhwb3J0cz1zfSx7XCIuLi91dGlsc1wiOjMyLFwiLi9HZW5lcmljV29ya2VyXCI6Mjh9XSwyNTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL0dlbmVyaWNXb3JrZXJcIiksbj10KFwiLi4vY3JjMzJcIik7ZnVuY3Rpb24gcygpe2kuY2FsbCh0aGlzLFwiQ3JjMzJQcm9iZVwiKSx0aGlzLndpdGhTdHJlYW1JbmZvKFwiY3JjMzJcIiwwKX10KFwiLi4vdXRpbHNcIikuaW5oZXJpdHMocyxpKSxzLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24odCl7dGhpcy5zdHJlYW1JbmZvLmNyYzMyPW4odC5kYXRhLHRoaXMuc3RyZWFtSW5mby5jcmMzMnx8MCksdGhpcy5wdXNoKHQpfSxlLmV4cG9ydHM9c30se1wiLi4vY3JjMzJcIjo0LFwiLi4vdXRpbHNcIjozMixcIi4vR2VuZXJpY1dvcmtlclwiOjI4fV0sMjY6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi4vdXRpbHNcIiksbj10KFwiLi9HZW5lcmljV29ya2VyXCIpO2Z1bmN0aW9uIHModCl7bi5jYWxsKHRoaXMsXCJEYXRhTGVuZ3RoUHJvYmUgZm9yIFwiK3QpLHRoaXMucHJvcE5hbWU9dCx0aGlzLndpdGhTdHJlYW1JbmZvKHQsMCl9aS5pbmhlcml0cyhzLG4pLHMucHJvdG90eXBlLnByb2Nlc3NDaHVuaz1mdW5jdGlvbih0KXtpZih0KXt2YXIgZT10aGlzLnN0cmVhbUluZm9bdGhpcy5wcm9wTmFtZV18fDA7dGhpcy5zdHJlYW1JbmZvW3RoaXMucHJvcE5hbWVdPWUrdC5kYXRhLmxlbmd0aH1uLnByb3RvdHlwZS5wcm9jZXNzQ2h1bmsuY2FsbCh0aGlzLHQpfSxlLmV4cG9ydHM9c30se1wiLi4vdXRpbHNcIjozMixcIi4vR2VuZXJpY1dvcmtlclwiOjI4fV0sMjc6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi4vdXRpbHNcIiksbj10KFwiLi9HZW5lcmljV29ya2VyXCIpO2Z1bmN0aW9uIHModCl7bi5jYWxsKHRoaXMsXCJEYXRhV29ya2VyXCIpO3ZhciBlPXRoaXM7dGhpcy5kYXRhSXNSZWFkeT0hMSx0aGlzLmluZGV4PTAsdGhpcy5tYXg9MCx0aGlzLmRhdGE9bnVsbCx0aGlzLnR5cGU9XCJcIix0aGlzLl90aWNrU2NoZWR1bGVkPSExLHQudGhlbihmdW5jdGlvbih0KXtlLmRhdGFJc1JlYWR5PSEwLGUuZGF0YT10LGUubWF4PXQmJnQubGVuZ3RofHwwLGUudHlwZT1pLmdldFR5cGVPZih0KSxlLmlzUGF1c2VkfHxlLl90aWNrQW5kUmVwZWF0KCl9LGZ1bmN0aW9uKHQpe2UuZXJyb3IodCl9KX1pLmluaGVyaXRzKHMsbikscy5wcm90b3R5cGUuY2xlYW5VcD1mdW5jdGlvbigpe24ucHJvdG90eXBlLmNsZWFuVXAuY2FsbCh0aGlzKSx0aGlzLmRhdGE9bnVsbH0scy5wcm90b3R5cGUucmVzdW1lPWZ1bmN0aW9uKCl7cmV0dXJuISFuLnByb3RvdHlwZS5yZXN1bWUuY2FsbCh0aGlzKSYmKCF0aGlzLl90aWNrU2NoZWR1bGVkJiZ0aGlzLmRhdGFJc1JlYWR5JiYodGhpcy5fdGlja1NjaGVkdWxlZD0hMCxpLmRlbGF5KHRoaXMuX3RpY2tBbmRSZXBlYXQsW10sdGhpcykpLCEwKX0scy5wcm90b3R5cGUuX3RpY2tBbmRSZXBlYXQ9ZnVuY3Rpb24oKXt0aGlzLl90aWNrU2NoZWR1bGVkPSExLHRoaXMuaXNQYXVzZWR8fHRoaXMuaXNGaW5pc2hlZHx8KHRoaXMuX3RpY2soKSx0aGlzLmlzRmluaXNoZWR8fChpLmRlbGF5KHRoaXMuX3RpY2tBbmRSZXBlYXQsW10sdGhpcyksdGhpcy5fdGlja1NjaGVkdWxlZD0hMCkpfSxzLnByb3RvdHlwZS5fdGljaz1mdW5jdGlvbigpe2lmKHRoaXMuaXNQYXVzZWR8fHRoaXMuaXNGaW5pc2hlZClyZXR1cm4hMTt2YXIgdD1udWxsLGU9TWF0aC5taW4odGhpcy5tYXgsdGhpcy5pbmRleCsxNjM4NCk7aWYodGhpcy5pbmRleD49dGhpcy5tYXgpcmV0dXJuIHRoaXMuZW5kKCk7c3dpdGNoKHRoaXMudHlwZSl7Y2FzZVwic3RyaW5nXCI6dD10aGlzLmRhdGEuc3Vic3RyaW5nKHRoaXMuaW5kZXgsZSk7YnJlYWs7Y2FzZVwidWludDhhcnJheVwiOnQ9dGhpcy5kYXRhLnN1YmFycmF5KHRoaXMuaW5kZXgsZSk7YnJlYWs7Y2FzZVwiYXJyYXlcIjpjYXNlXCJub2RlYnVmZmVyXCI6dD10aGlzLmRhdGEuc2xpY2UodGhpcy5pbmRleCxlKX1yZXR1cm4gdGhpcy5pbmRleD1lLHRoaXMucHVzaCh7ZGF0YTp0LG1ldGE6e3BlcmNlbnQ6dGhpcy5tYXg/dGhpcy5pbmRleC90aGlzLm1heCoxMDA6MH19KX0sZS5leHBvcnRzPXN9LHtcIi4uL3V0aWxzXCI6MzIsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDI4OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gaSh0KXt0aGlzLm5hbWU9dHx8XCJkZWZhdWx0XCIsdGhpcy5zdHJlYW1JbmZvPXt9LHRoaXMuZ2VuZXJhdGVkRXJyb3I9bnVsbCx0aGlzLmV4dHJhU3RyZWFtSW5mbz17fSx0aGlzLmlzUGF1c2VkPSEwLHRoaXMuaXNGaW5pc2hlZD0hMSx0aGlzLmlzTG9ja2VkPSExLHRoaXMuX2xpc3RlbmVycz17ZGF0YTpbXSxlbmQ6W10sZXJyb3I6W119LHRoaXMucHJldmlvdXM9bnVsbH1pLnByb3RvdHlwZT17cHVzaDpmdW5jdGlvbih0KXt0aGlzLmVtaXQoXCJkYXRhXCIsdCl9LGVuZDpmdW5jdGlvbigpe2lmKHRoaXMuaXNGaW5pc2hlZClyZXR1cm4hMTt0aGlzLmZsdXNoKCk7dHJ5e3RoaXMuZW1pdChcImVuZFwiKSx0aGlzLmNsZWFuVXAoKSx0aGlzLmlzRmluaXNoZWQ9ITB9Y2F0Y2godCl7dGhpcy5lbWl0KFwiZXJyb3JcIix0KX1yZXR1cm4hMH0sZXJyb3I6ZnVuY3Rpb24odCl7cmV0dXJuIXRoaXMuaXNGaW5pc2hlZCYmKHRoaXMuaXNQYXVzZWQ/dGhpcy5nZW5lcmF0ZWRFcnJvcj10Oih0aGlzLmlzRmluaXNoZWQ9ITAsdGhpcy5lbWl0KFwiZXJyb3JcIix0KSx0aGlzLnByZXZpb3VzJiZ0aGlzLnByZXZpb3VzLmVycm9yKHQpLHRoaXMuY2xlYW5VcCgpKSwhMCl9LG9uOmZ1bmN0aW9uKHQsZSl7cmV0dXJuIHRoaXMuX2xpc3RlbmVyc1t0XS5wdXNoKGUpLHRoaXN9LGNsZWFuVXA6ZnVuY3Rpb24oKXt0aGlzLnN0cmVhbUluZm89dGhpcy5nZW5lcmF0ZWRFcnJvcj10aGlzLmV4dHJhU3RyZWFtSW5mbz1udWxsLHRoaXMuX2xpc3RlbmVycz1bXX0sZW1pdDpmdW5jdGlvbih0LGUpe2lmKHRoaXMuX2xpc3RlbmVyc1t0XSlmb3IodmFyIHI9MDtyPHRoaXMuX2xpc3RlbmVyc1t0XS5sZW5ndGg7cisrKXRoaXMuX2xpc3RlbmVyc1t0XVtyXS5jYWxsKHRoaXMsZSl9LHBpcGU6ZnVuY3Rpb24odCl7cmV0dXJuIHQucmVnaXN0ZXJQcmV2aW91cyh0aGlzKX0scmVnaXN0ZXJQcmV2aW91czpmdW5jdGlvbih0KXtpZih0aGlzLmlzTG9ja2VkKXRocm93IG5ldyBFcnJvcihcIlRoZSBzdHJlYW0gJ1wiK3RoaXMrXCInIGhhcyBhbHJlYWR5IGJlZW4gdXNlZC5cIik7dGhpcy5zdHJlYW1JbmZvPXQuc3RyZWFtSW5mbyx0aGlzLm1lcmdlU3RyZWFtSW5mbygpLHRoaXMucHJldmlvdXM9dDt2YXIgZT10aGlzO3JldHVybiB0Lm9uKFwiZGF0YVwiLGZ1bmN0aW9uKHQpe2UucHJvY2Vzc0NodW5rKHQpfSksdC5vbihcImVuZFwiLGZ1bmN0aW9uKCl7ZS5lbmQoKX0pLHQub24oXCJlcnJvclwiLGZ1bmN0aW9uKHQpe2UuZXJyb3IodCl9KSx0aGlzfSxwYXVzZTpmdW5jdGlvbigpe3JldHVybiF0aGlzLmlzUGF1c2VkJiYhdGhpcy5pc0ZpbmlzaGVkJiYodGhpcy5pc1BhdXNlZD0hMCx0aGlzLnByZXZpb3VzJiZ0aGlzLnByZXZpb3VzLnBhdXNlKCksITApfSxyZXN1bWU6ZnVuY3Rpb24oKXtpZighdGhpcy5pc1BhdXNlZHx8dGhpcy5pc0ZpbmlzaGVkKXJldHVybiExO3ZhciB0PXRoaXMuaXNQYXVzZWQ9ITE7cmV0dXJuIHRoaXMuZ2VuZXJhdGVkRXJyb3ImJih0aGlzLmVycm9yKHRoaXMuZ2VuZXJhdGVkRXJyb3IpLHQ9ITApLHRoaXMucHJldmlvdXMmJnRoaXMucHJldmlvdXMucmVzdW1lKCksIXR9LGZsdXNoOmZ1bmN0aW9uKCl7fSxwcm9jZXNzQ2h1bms6ZnVuY3Rpb24odCl7dGhpcy5wdXNoKHQpfSx3aXRoU3RyZWFtSW5mbzpmdW5jdGlvbih0LGUpe3JldHVybiB0aGlzLmV4dHJhU3RyZWFtSW5mb1t0XT1lLHRoaXMubWVyZ2VTdHJlYW1JbmZvKCksdGhpc30sbWVyZ2VTdHJlYW1JbmZvOmZ1bmN0aW9uKCl7Zm9yKHZhciB0IGluIHRoaXMuZXh0cmFTdHJlYW1JbmZvKXRoaXMuZXh0cmFTdHJlYW1JbmZvLmhhc093blByb3BlcnR5KHQpJiYodGhpcy5zdHJlYW1JbmZvW3RdPXRoaXMuZXh0cmFTdHJlYW1JbmZvW3RdKX0sbG9jazpmdW5jdGlvbigpe2lmKHRoaXMuaXNMb2NrZWQpdGhyb3cgbmV3IEVycm9yKFwiVGhlIHN0cmVhbSAnXCIrdGhpcytcIicgaGFzIGFscmVhZHkgYmVlbiB1c2VkLlwiKTt0aGlzLmlzTG9ja2VkPSEwLHRoaXMucHJldmlvdXMmJnRoaXMucHJldmlvdXMubG9jaygpfSx0b1N0cmluZzpmdW5jdGlvbigpe3ZhciB0PVwiV29ya2VyIFwiK3RoaXMubmFtZTtyZXR1cm4gdGhpcy5wcmV2aW91cz90aGlzLnByZXZpb3VzK1wiIC0+IFwiK3Q6dH19LGUuZXhwb3J0cz1pfSx7fV0sMjk6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaD10KFwiLi4vdXRpbHNcIiksbj10KFwiLi9Db252ZXJ0V29ya2VyXCIpLHM9dChcIi4vR2VuZXJpY1dvcmtlclwiKSx1PXQoXCIuLi9iYXNlNjRcIiksaT10KFwiLi4vc3VwcG9ydFwiKSxhPXQoXCIuLi9leHRlcm5hbFwiKSxvPW51bGw7aWYoaS5ub2Rlc3RyZWFtKXRyeXtvPXQoXCIuLi9ub2RlanMvTm9kZWpzU3RyZWFtT3V0cHV0QWRhcHRlclwiKX1jYXRjaCh0KXt9ZnVuY3Rpb24gbCh0LG8pe3JldHVybiBuZXcgYS5Qcm9taXNlKGZ1bmN0aW9uKGUscil7dmFyIGk9W10sbj10Ll9pbnRlcm5hbFR5cGUscz10Ll9vdXRwdXRUeXBlLGE9dC5fbWltZVR5cGU7dC5vbihcImRhdGFcIixmdW5jdGlvbih0LGUpe2kucHVzaCh0KSxvJiZvKGUpfSkub24oXCJlcnJvclwiLGZ1bmN0aW9uKHQpe2k9W10scih0KX0pLm9uKFwiZW5kXCIsZnVuY3Rpb24oKXt0cnl7dmFyIHQ9ZnVuY3Rpb24odCxlLHIpe3N3aXRjaCh0KXtjYXNlXCJibG9iXCI6cmV0dXJuIGgubmV3QmxvYihoLnRyYW5zZm9ybVRvKFwiYXJyYXlidWZmZXJcIixlKSxyKTtjYXNlXCJiYXNlNjRcIjpyZXR1cm4gdS5lbmNvZGUoZSk7ZGVmYXVsdDpyZXR1cm4gaC50cmFuc2Zvcm1Ubyh0LGUpfX0ocyxmdW5jdGlvbih0LGUpe3ZhciByLGk9MCxuPW51bGwscz0wO2ZvcihyPTA7cjxlLmxlbmd0aDtyKyspcys9ZVtyXS5sZW5ndGg7c3dpdGNoKHQpe2Nhc2VcInN0cmluZ1wiOnJldHVybiBlLmpvaW4oXCJcIik7Y2FzZVwiYXJyYXlcIjpyZXR1cm4gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSxlKTtjYXNlXCJ1aW50OGFycmF5XCI6Zm9yKG49bmV3IFVpbnQ4QXJyYXkocykscj0wO3I8ZS5sZW5ndGg7cisrKW4uc2V0KGVbcl0saSksaSs9ZVtyXS5sZW5ndGg7cmV0dXJuIG47Y2FzZVwibm9kZWJ1ZmZlclwiOnJldHVybiBCdWZmZXIuY29uY2F0KGUpO2RlZmF1bHQ6dGhyb3cgbmV3IEVycm9yKFwiY29uY2F0IDogdW5zdXBwb3J0ZWQgdHlwZSAnXCIrdCtcIidcIil9fShuLGkpLGEpO2UodCl9Y2F0Y2godCl7cih0KX1pPVtdfSkucmVzdW1lKCl9KX1mdW5jdGlvbiBmKHQsZSxyKXt2YXIgaT1lO3N3aXRjaChlKXtjYXNlXCJibG9iXCI6Y2FzZVwiYXJyYXlidWZmZXJcIjppPVwidWludDhhcnJheVwiO2JyZWFrO2Nhc2VcImJhc2U2NFwiOmk9XCJzdHJpbmdcIn10cnl7dGhpcy5faW50ZXJuYWxUeXBlPWksdGhpcy5fb3V0cHV0VHlwZT1lLHRoaXMuX21pbWVUeXBlPXIsaC5jaGVja1N1cHBvcnQoaSksdGhpcy5fd29ya2VyPXQucGlwZShuZXcgbihpKSksdC5sb2NrKCl9Y2F0Y2godCl7dGhpcy5fd29ya2VyPW5ldyBzKFwiZXJyb3JcIiksdGhpcy5fd29ya2VyLmVycm9yKHQpfX1mLnByb3RvdHlwZT17YWNjdW11bGF0ZTpmdW5jdGlvbih0KXtyZXR1cm4gbCh0aGlzLHQpfSxvbjpmdW5jdGlvbih0LGUpe3ZhciByPXRoaXM7cmV0dXJuXCJkYXRhXCI9PT10P3RoaXMuX3dvcmtlci5vbih0LGZ1bmN0aW9uKHQpe2UuY2FsbChyLHQuZGF0YSx0Lm1ldGEpfSk6dGhpcy5fd29ya2VyLm9uKHQsZnVuY3Rpb24oKXtoLmRlbGF5KGUsYXJndW1lbnRzLHIpfSksdGhpc30scmVzdW1lOmZ1bmN0aW9uKCl7cmV0dXJuIGguZGVsYXkodGhpcy5fd29ya2VyLnJlc3VtZSxbXSx0aGlzLl93b3JrZXIpLHRoaXN9LHBhdXNlOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX3dvcmtlci5wYXVzZSgpLHRoaXN9LHRvTm9kZWpzU3RyZWFtOmZ1bmN0aW9uKHQpe2lmKGguY2hlY2tTdXBwb3J0KFwibm9kZXN0cmVhbVwiKSxcIm5vZGVidWZmZXJcIiE9PXRoaXMuX291dHB1dFR5cGUpdGhyb3cgbmV3IEVycm9yKHRoaXMuX291dHB1dFR5cGUrXCIgaXMgbm90IHN1cHBvcnRlZCBieSB0aGlzIG1ldGhvZFwiKTtyZXR1cm4gbmV3IG8odGhpcyx7b2JqZWN0TW9kZTpcIm5vZGVidWZmZXJcIiE9PXRoaXMuX291dHB1dFR5cGV9LHQpfX0sZS5leHBvcnRzPWZ9LHtcIi4uL2Jhc2U2NFwiOjEsXCIuLi9leHRlcm5hbFwiOjYsXCIuLi9ub2RlanMvTm9kZWpzU3RyZWFtT3V0cHV0QWRhcHRlclwiOjEzLFwiLi4vc3VwcG9ydFwiOjMwLFwiLi4vdXRpbHNcIjozMixcIi4vQ29udmVydFdvcmtlclwiOjI0LFwiLi9HZW5lcmljV29ya2VyXCI6Mjh9XSwzMDpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2lmKHIuYmFzZTY0PSEwLHIuYXJyYXk9ITAsci5zdHJpbmc9ITAsci5hcnJheWJ1ZmZlcj1cInVuZGVmaW5lZFwiIT10eXBlb2YgQXJyYXlCdWZmZXImJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50OEFycmF5LHIubm9kZWJ1ZmZlcj1cInVuZGVmaW5lZFwiIT10eXBlb2YgQnVmZmVyLHIudWludDhhcnJheT1cInVuZGVmaW5lZFwiIT10eXBlb2YgVWludDhBcnJheSxcInVuZGVmaW5lZFwiPT10eXBlb2YgQXJyYXlCdWZmZXIpci5ibG9iPSExO2Vsc2V7dmFyIGk9bmV3IEFycmF5QnVmZmVyKDApO3RyeXtyLmJsb2I9MD09PW5ldyBCbG9iKFtpXSx7dHlwZTpcImFwcGxpY2F0aW9uL3ppcFwifSkuc2l6ZX1jYXRjaCh0KXt0cnl7dmFyIG49bmV3KHNlbGYuQmxvYkJ1aWxkZXJ8fHNlbGYuV2ViS2l0QmxvYkJ1aWxkZXJ8fHNlbGYuTW96QmxvYkJ1aWxkZXJ8fHNlbGYuTVNCbG9iQnVpbGRlcik7bi5hcHBlbmQoaSksci5ibG9iPTA9PT1uLmdldEJsb2IoXCJhcHBsaWNhdGlvbi96aXBcIikuc2l6ZX1jYXRjaCh0KXtyLmJsb2I9ITF9fX10cnl7ci5ub2Rlc3RyZWFtPSEhdChcInJlYWRhYmxlLXN0cmVhbVwiKS5SZWFkYWJsZX1jYXRjaCh0KXtyLm5vZGVzdHJlYW09ITF9fSx7XCJyZWFkYWJsZS1zdHJlYW1cIjoxNn1dLDMxOltmdW5jdGlvbih0LGUscyl7XCJ1c2Ugc3RyaWN0XCI7Zm9yKHZhciBvPXQoXCIuL3V0aWxzXCIpLGg9dChcIi4vc3VwcG9ydFwiKSxyPXQoXCIuL25vZGVqc1V0aWxzXCIpLGk9dChcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIiksdT1uZXcgQXJyYXkoMjU2KSxuPTA7bjwyNTY7bisrKXVbbl09MjUyPD1uPzY6MjQ4PD1uPzU6MjQwPD1uPzQ6MjI0PD1uPzM6MTkyPD1uPzI6MTt1WzI1NF09dVsyNTRdPTE7ZnVuY3Rpb24gYSgpe2kuY2FsbCh0aGlzLFwidXRmLTggZGVjb2RlXCIpLHRoaXMubGVmdE92ZXI9bnVsbH1mdW5jdGlvbiBsKCl7aS5jYWxsKHRoaXMsXCJ1dGYtOCBlbmNvZGVcIil9cy51dGY4ZW5jb2RlPWZ1bmN0aW9uKHQpe3JldHVybiBoLm5vZGVidWZmZXI/ci5uZXdCdWZmZXJGcm9tKHQsXCJ1dGYtOFwiKTpmdW5jdGlvbih0KXt2YXIgZSxyLGksbixzLGE9dC5sZW5ndGgsbz0wO2ZvcihuPTA7bjxhO24rKyk1NTI5Nj09KDY0NTEyJihyPXQuY2hhckNvZGVBdChuKSkpJiZuKzE8YSYmNTYzMjA9PSg2NDUxMiYoaT10LmNoYXJDb2RlQXQobisxKSkpJiYocj02NTUzNisoci01NTI5Njw8MTApKyhpLTU2MzIwKSxuKyspLG8rPXI8MTI4PzE6cjwyMDQ4PzI6cjw2NTUzNj8zOjQ7Zm9yKGU9aC51aW50OGFycmF5P25ldyBVaW50OEFycmF5KG8pOm5ldyBBcnJheShvKSxuPXM9MDtzPG87bisrKTU1Mjk2PT0oNjQ1MTImKHI9dC5jaGFyQ29kZUF0KG4pKSkmJm4rMTxhJiY1NjMyMD09KDY0NTEyJihpPXQuY2hhckNvZGVBdChuKzEpKSkmJihyPTY1NTM2KyhyLTU1Mjk2PDwxMCkrKGktNTYzMjApLG4rKykscjwxMjg/ZVtzKytdPXI6KHI8MjA0OD9lW3MrK109MTkyfHI+Pj42OihyPDY1NTM2P2VbcysrXT0yMjR8cj4+PjEyOihlW3MrK109MjQwfHI+Pj4xOCxlW3MrK109MTI4fHI+Pj4xMiY2MyksZVtzKytdPTEyOHxyPj4+NiY2MyksZVtzKytdPTEyOHw2MyZyKTtyZXR1cm4gZX0odCl9LHMudXRmOGRlY29kZT1mdW5jdGlvbih0KXtyZXR1cm4gaC5ub2RlYnVmZmVyP28udHJhbnNmb3JtVG8oXCJub2RlYnVmZmVyXCIsdCkudG9TdHJpbmcoXCJ1dGYtOFwiKTpmdW5jdGlvbih0KXt2YXIgZSxyLGksbixzPXQubGVuZ3RoLGE9bmV3IEFycmF5KDIqcyk7Zm9yKGU9cj0wO2U8czspaWYoKGk9dFtlKytdKTwxMjgpYVtyKytdPWk7ZWxzZSBpZig0PChuPXVbaV0pKWFbcisrXT02NTUzMyxlKz1uLTE7ZWxzZXtmb3IoaSY9Mj09PW4/MzE6Mz09PW4/MTU6NzsxPG4mJmU8czspaT1pPDw2fDYzJnRbZSsrXSxuLS07MTxuP2FbcisrXT02NTUzMzppPDY1NTM2P2FbcisrXT1pOihpLT02NTUzNixhW3IrK109NTUyOTZ8aT4+MTAmMTAyMyxhW3IrK109NTYzMjB8MTAyMyZpKX1yZXR1cm4gYS5sZW5ndGghPT1yJiYoYS5zdWJhcnJheT9hPWEuc3ViYXJyYXkoMCxyKTphLmxlbmd0aD1yKSxvLmFwcGx5RnJvbUNoYXJDb2RlKGEpfSh0PW8udHJhbnNmb3JtVG8oaC51aW50OGFycmF5P1widWludDhhcnJheVwiOlwiYXJyYXlcIix0KSl9LG8uaW5oZXJpdHMoYSxpKSxhLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24odCl7dmFyIGU9by50cmFuc2Zvcm1UbyhoLnVpbnQ4YXJyYXk/XCJ1aW50OGFycmF5XCI6XCJhcnJheVwiLHQuZGF0YSk7aWYodGhpcy5sZWZ0T3ZlciYmdGhpcy5sZWZ0T3Zlci5sZW5ndGgpe2lmKGgudWludDhhcnJheSl7dmFyIHI9ZTsoZT1uZXcgVWludDhBcnJheShyLmxlbmd0aCt0aGlzLmxlZnRPdmVyLmxlbmd0aCkpLnNldCh0aGlzLmxlZnRPdmVyLDApLGUuc2V0KHIsdGhpcy5sZWZ0T3Zlci5sZW5ndGgpfWVsc2UgZT10aGlzLmxlZnRPdmVyLmNvbmNhdChlKTt0aGlzLmxlZnRPdmVyPW51bGx9dmFyIGk9ZnVuY3Rpb24odCxlKXt2YXIgcjtmb3IoKGU9ZXx8dC5sZW5ndGgpPnQubGVuZ3RoJiYoZT10Lmxlbmd0aCkscj1lLTE7MDw9ciYmMTI4PT0oMTkyJnRbcl0pOylyLS07cmV0dXJuIHI8MD9lOjA9PT1yP2U6cit1W3Rbcl1dPmU/cjplfShlKSxuPWU7aSE9PWUubGVuZ3RoJiYoaC51aW50OGFycmF5PyhuPWUuc3ViYXJyYXkoMCxpKSx0aGlzLmxlZnRPdmVyPWUuc3ViYXJyYXkoaSxlLmxlbmd0aCkpOihuPWUuc2xpY2UoMCxpKSx0aGlzLmxlZnRPdmVyPWUuc2xpY2UoaSxlLmxlbmd0aCkpKSx0aGlzLnB1c2goe2RhdGE6cy51dGY4ZGVjb2RlKG4pLG1ldGE6dC5tZXRhfSl9LGEucHJvdG90eXBlLmZsdXNoPWZ1bmN0aW9uKCl7dGhpcy5sZWZ0T3ZlciYmdGhpcy5sZWZ0T3Zlci5sZW5ndGgmJih0aGlzLnB1c2goe2RhdGE6cy51dGY4ZGVjb2RlKHRoaXMubGVmdE92ZXIpLG1ldGE6e319KSx0aGlzLmxlZnRPdmVyPW51bGwpfSxzLlV0ZjhEZWNvZGVXb3JrZXI9YSxvLmluaGVyaXRzKGwsaSksbC5wcm90b3R5cGUucHJvY2Vzc0NodW5rPWZ1bmN0aW9uKHQpe3RoaXMucHVzaCh7ZGF0YTpzLnV0ZjhlbmNvZGUodC5kYXRhKSxtZXRhOnQubWV0YX0pfSxzLlV0ZjhFbmNvZGVXb3JrZXI9bH0se1wiLi9ub2RlanNVdGlsc1wiOjE0LFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiOjI4LFwiLi9zdXBwb3J0XCI6MzAsXCIuL3V0aWxzXCI6MzJ9XSwzMjpbZnVuY3Rpb24odCxlLGEpe1widXNlIHN0cmljdFwiO3ZhciBvPXQoXCIuL3N1cHBvcnRcIiksaD10KFwiLi9iYXNlNjRcIikscj10KFwiLi9ub2RlanNVdGlsc1wiKSxpPXQoXCJzZXQtaW1tZWRpYXRlLXNoaW1cIiksdT10KFwiLi9leHRlcm5hbFwiKTtmdW5jdGlvbiBuKHQpe3JldHVybiB0fWZ1bmN0aW9uIGwodCxlKXtmb3IodmFyIHI9MDtyPHQubGVuZ3RoOysrcillW3JdPTI1NSZ0LmNoYXJDb2RlQXQocik7cmV0dXJuIGV9YS5uZXdCbG9iPWZ1bmN0aW9uKGUscil7YS5jaGVja1N1cHBvcnQoXCJibG9iXCIpO3RyeXtyZXR1cm4gbmV3IEJsb2IoW2VdLHt0eXBlOnJ9KX1jYXRjaCh0KXt0cnl7dmFyIGk9bmV3KHNlbGYuQmxvYkJ1aWxkZXJ8fHNlbGYuV2ViS2l0QmxvYkJ1aWxkZXJ8fHNlbGYuTW96QmxvYkJ1aWxkZXJ8fHNlbGYuTVNCbG9iQnVpbGRlcik7cmV0dXJuIGkuYXBwZW5kKGUpLGkuZ2V0QmxvYihyKX1jYXRjaCh0KXt0aHJvdyBuZXcgRXJyb3IoXCJCdWcgOiBjYW4ndCBjb25zdHJ1Y3QgdGhlIEJsb2IuXCIpfX19O3ZhciBzPXtzdHJpbmdpZnlCeUNodW5rOmZ1bmN0aW9uKHQsZSxyKXt2YXIgaT1bXSxuPTAscz10Lmxlbmd0aDtpZihzPD1yKXJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsdCk7Zm9yKDtuPHM7KVwiYXJyYXlcIj09PWV8fFwibm9kZWJ1ZmZlclwiPT09ZT9pLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLHQuc2xpY2UobixNYXRoLm1pbihuK3IscykpKSk6aS5wdXNoKFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCx0LnN1YmFycmF5KG4sTWF0aC5taW4obityLHMpKSkpLG4rPXI7cmV0dXJuIGkuam9pbihcIlwiKX0sc3RyaW5naWZ5QnlDaGFyOmZ1bmN0aW9uKHQpe2Zvcih2YXIgZT1cIlwiLHI9MDtyPHQubGVuZ3RoO3IrKyllKz1TdHJpbmcuZnJvbUNoYXJDb2RlKHRbcl0pO3JldHVybiBlfSxhcHBseUNhbkJlVXNlZDp7dWludDhhcnJheTpmdW5jdGlvbigpe3RyeXtyZXR1cm4gby51aW50OGFycmF5JiYxPT09U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLG5ldyBVaW50OEFycmF5KDEpKS5sZW5ndGh9Y2F0Y2godCl7cmV0dXJuITF9fSgpLG5vZGVidWZmZXI6ZnVuY3Rpb24oKXt0cnl7cmV0dXJuIG8ubm9kZWJ1ZmZlciYmMT09PVN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxyLmFsbG9jQnVmZmVyKDEpKS5sZW5ndGh9Y2F0Y2godCl7cmV0dXJuITF9fSgpfX07ZnVuY3Rpb24gZih0KXt2YXIgZT02NTUzNixyPWEuZ2V0VHlwZU9mKHQpLGk9ITA7aWYoXCJ1aW50OGFycmF5XCI9PT1yP2k9cy5hcHBseUNhbkJlVXNlZC51aW50OGFycmF5Olwibm9kZWJ1ZmZlclwiPT09ciYmKGk9cy5hcHBseUNhbkJlVXNlZC5ub2RlYnVmZmVyKSxpKWZvcig7MTxlOyl0cnl7cmV0dXJuIHMuc3RyaW5naWZ5QnlDaHVuayh0LHIsZSl9Y2F0Y2godCl7ZT1NYXRoLmZsb29yKGUvMil9cmV0dXJuIHMuc3RyaW5naWZ5QnlDaGFyKHQpfWZ1bmN0aW9uIGQodCxlKXtmb3IodmFyIHI9MDtyPHQubGVuZ3RoO3IrKyllW3JdPXRbcl07cmV0dXJuIGV9YS5hcHBseUZyb21DaGFyQ29kZT1mO3ZhciBjPXt9O2Muc3RyaW5nPXtzdHJpbmc6bixhcnJheTpmdW5jdGlvbih0KXtyZXR1cm4gbCh0LG5ldyBBcnJheSh0Lmxlbmd0aCkpfSxhcnJheWJ1ZmZlcjpmdW5jdGlvbih0KXtyZXR1cm4gYy5zdHJpbmcudWludDhhcnJheSh0KS5idWZmZXJ9LHVpbnQ4YXJyYXk6ZnVuY3Rpb24odCl7cmV0dXJuIGwodCxuZXcgVWludDhBcnJheSh0Lmxlbmd0aCkpfSxub2RlYnVmZmVyOmZ1bmN0aW9uKHQpe3JldHVybiBsKHQsci5hbGxvY0J1ZmZlcih0Lmxlbmd0aCkpfX0sYy5hcnJheT17c3RyaW5nOmYsYXJyYXk6bixhcnJheWJ1ZmZlcjpmdW5jdGlvbih0KXtyZXR1cm4gbmV3IFVpbnQ4QXJyYXkodCkuYnVmZmVyfSx1aW50OGFycmF5OmZ1bmN0aW9uKHQpe3JldHVybiBuZXcgVWludDhBcnJheSh0KX0sbm9kZWJ1ZmZlcjpmdW5jdGlvbih0KXtyZXR1cm4gci5uZXdCdWZmZXJGcm9tKHQpfX0sYy5hcnJheWJ1ZmZlcj17c3RyaW5nOmZ1bmN0aW9uKHQpe3JldHVybiBmKG5ldyBVaW50OEFycmF5KHQpKX0sYXJyYXk6ZnVuY3Rpb24odCl7cmV0dXJuIGQobmV3IFVpbnQ4QXJyYXkodCksbmV3IEFycmF5KHQuYnl0ZUxlbmd0aCkpfSxhcnJheWJ1ZmZlcjpuLHVpbnQ4YXJyYXk6ZnVuY3Rpb24odCl7cmV0dXJuIG5ldyBVaW50OEFycmF5KHQpfSxub2RlYnVmZmVyOmZ1bmN0aW9uKHQpe3JldHVybiByLm5ld0J1ZmZlckZyb20obmV3IFVpbnQ4QXJyYXkodCkpfX0sYy51aW50OGFycmF5PXtzdHJpbmc6ZixhcnJheTpmdW5jdGlvbih0KXtyZXR1cm4gZCh0LG5ldyBBcnJheSh0Lmxlbmd0aCkpfSxhcnJheWJ1ZmZlcjpmdW5jdGlvbih0KXtyZXR1cm4gdC5idWZmZXJ9LHVpbnQ4YXJyYXk6bixub2RlYnVmZmVyOmZ1bmN0aW9uKHQpe3JldHVybiByLm5ld0J1ZmZlckZyb20odCl9fSxjLm5vZGVidWZmZXI9e3N0cmluZzpmLGFycmF5OmZ1bmN0aW9uKHQpe3JldHVybiBkKHQsbmV3IEFycmF5KHQubGVuZ3RoKSl9LGFycmF5YnVmZmVyOmZ1bmN0aW9uKHQpe3JldHVybiBjLm5vZGVidWZmZXIudWludDhhcnJheSh0KS5idWZmZXJ9LHVpbnQ4YXJyYXk6ZnVuY3Rpb24odCl7cmV0dXJuIGQodCxuZXcgVWludDhBcnJheSh0Lmxlbmd0aCkpfSxub2RlYnVmZmVyOm59LGEudHJhbnNmb3JtVG89ZnVuY3Rpb24odCxlKXtpZihlPWV8fFwiXCIsIXQpcmV0dXJuIGU7YS5jaGVja1N1cHBvcnQodCk7dmFyIHI9YS5nZXRUeXBlT2YoZSk7cmV0dXJuIGNbcl1bdF0oZSl9LGEuZ2V0VHlwZU9mPWZ1bmN0aW9uKHQpe3JldHVyblwic3RyaW5nXCI9PXR5cGVvZiB0P1wic3RyaW5nXCI6XCJbb2JqZWN0IEFycmF5XVwiPT09T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHQpP1wiYXJyYXlcIjpvLm5vZGVidWZmZXImJnIuaXNCdWZmZXIodCk/XCJub2RlYnVmZmVyXCI6by51aW50OGFycmF5JiZ0IGluc3RhbmNlb2YgVWludDhBcnJheT9cInVpbnQ4YXJyYXlcIjpvLmFycmF5YnVmZmVyJiZ0IGluc3RhbmNlb2YgQXJyYXlCdWZmZXI/XCJhcnJheWJ1ZmZlclwiOnZvaWQgMH0sYS5jaGVja1N1cHBvcnQ9ZnVuY3Rpb24odCl7aWYoIW9bdC50b0xvd2VyQ2FzZSgpXSl0aHJvdyBuZXcgRXJyb3IodCtcIiBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoaXMgcGxhdGZvcm1cIil9LGEuTUFYX1ZBTFVFXzE2QklUUz02NTUzNSxhLk1BWF9WQUxVRV8zMkJJVFM9LTEsYS5wcmV0dHk9ZnVuY3Rpb24odCl7dmFyIGUscixpPVwiXCI7Zm9yKHI9MDtyPCh0fHxcIlwiKS5sZW5ndGg7cisrKWkrPVwiXFxcXHhcIisoKGU9dC5jaGFyQ29kZUF0KHIpKTwxNj9cIjBcIjpcIlwiKStlLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO3JldHVybiBpfSxhLmRlbGF5PWZ1bmN0aW9uKHQsZSxyKXtpKGZ1bmN0aW9uKCl7dC5hcHBseShyfHxudWxsLGV8fFtdKX0pfSxhLmluaGVyaXRzPWZ1bmN0aW9uKHQsZSl7ZnVuY3Rpb24gcigpe31yLnByb3RvdHlwZT1lLnByb3RvdHlwZSx0LnByb3RvdHlwZT1uZXcgcn0sYS5leHRlbmQ9ZnVuY3Rpb24oKXt2YXIgdCxlLHI9e307Zm9yKHQ9MDt0PGFyZ3VtZW50cy5sZW5ndGg7dCsrKWZvcihlIGluIGFyZ3VtZW50c1t0XSlhcmd1bWVudHNbdF0uaGFzT3duUHJvcGVydHkoZSkmJnZvaWQgMD09PXJbZV0mJihyW2VdPWFyZ3VtZW50c1t0XVtlXSk7cmV0dXJuIHJ9LGEucHJlcGFyZUNvbnRlbnQ9ZnVuY3Rpb24ocix0LGksbixzKXtyZXR1cm4gdS5Qcm9taXNlLnJlc29sdmUodCkudGhlbihmdW5jdGlvbihpKXtyZXR1cm4gby5ibG9iJiYoaSBpbnN0YW5jZW9mIEJsb2J8fC0xIT09W1wiW29iamVjdCBGaWxlXVwiLFwiW29iamVjdCBCbG9iXVwiXS5pbmRleE9mKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChpKSkpJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgRmlsZVJlYWRlcj9uZXcgdS5Qcm9taXNlKGZ1bmN0aW9uKGUscil7dmFyIHQ9bmV3IEZpbGVSZWFkZXI7dC5vbmxvYWQ9ZnVuY3Rpb24odCl7ZSh0LnRhcmdldC5yZXN1bHQpfSx0Lm9uZXJyb3I9ZnVuY3Rpb24odCl7cih0LnRhcmdldC5lcnJvcil9LHQucmVhZEFzQXJyYXlCdWZmZXIoaSl9KTppfSkudGhlbihmdW5jdGlvbih0KXt2YXIgZT1hLmdldFR5cGVPZih0KTtyZXR1cm4gZT8oXCJhcnJheWJ1ZmZlclwiPT09ZT90PWEudHJhbnNmb3JtVG8oXCJ1aW50OGFycmF5XCIsdCk6XCJzdHJpbmdcIj09PWUmJihzP3Q9aC5kZWNvZGUodCk6aSYmITAhPT1uJiYodD1mdW5jdGlvbih0KXtyZXR1cm4gbCh0LG8udWludDhhcnJheT9uZXcgVWludDhBcnJheSh0Lmxlbmd0aCk6bmV3IEFycmF5KHQubGVuZ3RoKSl9KHQpKSksdCk6dS5Qcm9taXNlLnJlamVjdChuZXcgRXJyb3IoXCJDYW4ndCByZWFkIHRoZSBkYXRhIG9mICdcIityK1wiJy4gSXMgaXQgaW4gYSBzdXBwb3J0ZWQgSmF2YVNjcmlwdCB0eXBlIChTdHJpbmcsIEJsb2IsIEFycmF5QnVmZmVyLCBldGMpID9cIikpfSl9fSx7XCIuL2Jhc2U2NFwiOjEsXCIuL2V4dGVybmFsXCI6NixcIi4vbm9kZWpzVXRpbHNcIjoxNCxcIi4vc3VwcG9ydFwiOjMwLFwic2V0LWltbWVkaWF0ZS1zaGltXCI6NTR9XSwzMzpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL3JlYWRlci9yZWFkZXJGb3JcIiksbj10KFwiLi91dGlsc1wiKSxzPXQoXCIuL3NpZ25hdHVyZVwiKSxhPXQoXCIuL3ppcEVudHJ5XCIpLG89KHQoXCIuL3V0ZjhcIiksdChcIi4vc3VwcG9ydFwiKSk7ZnVuY3Rpb24gaCh0KXt0aGlzLmZpbGVzPVtdLHRoaXMubG9hZE9wdGlvbnM9dH1oLnByb3RvdHlwZT17Y2hlY2tTaWduYXR1cmU6ZnVuY3Rpb24odCl7aWYoIXRoaXMucmVhZGVyLnJlYWRBbmRDaGVja1NpZ25hdHVyZSh0KSl7dGhpcy5yZWFkZXIuaW5kZXgtPTQ7dmFyIGU9dGhpcy5yZWFkZXIucmVhZFN0cmluZyg0KTt0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwIG9yIGJ1ZzogdW5leHBlY3RlZCBzaWduYXR1cmUgKFwiK24ucHJldHR5KGUpK1wiLCBleHBlY3RlZCBcIituLnByZXR0eSh0KStcIilcIil9fSxpc1NpZ25hdHVyZTpmdW5jdGlvbih0LGUpe3ZhciByPXRoaXMucmVhZGVyLmluZGV4O3RoaXMucmVhZGVyLnNldEluZGV4KHQpO3ZhciBpPXRoaXMucmVhZGVyLnJlYWRTdHJpbmcoNCk9PT1lO3JldHVybiB0aGlzLnJlYWRlci5zZXRJbmRleChyKSxpfSxyZWFkQmxvY2tFbmRPZkNlbnRyYWw6ZnVuY3Rpb24oKXt0aGlzLmRpc2tOdW1iZXI9dGhpcy5yZWFkZXIucmVhZEludCgyKSx0aGlzLmRpc2tXaXRoQ2VudHJhbERpclN0YXJ0PXRoaXMucmVhZGVyLnJlYWRJbnQoMiksdGhpcy5jZW50cmFsRGlyUmVjb3Jkc09uVGhpc0Rpc2s9dGhpcy5yZWFkZXIucmVhZEludCgyKSx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzPXRoaXMucmVhZGVyLnJlYWRJbnQoMiksdGhpcy5jZW50cmFsRGlyU2l6ZT10aGlzLnJlYWRlci5yZWFkSW50KDQpLHRoaXMuY2VudHJhbERpck9mZnNldD10aGlzLnJlYWRlci5yZWFkSW50KDQpLHRoaXMuemlwQ29tbWVudExlbmd0aD10aGlzLnJlYWRlci5yZWFkSW50KDIpO3ZhciB0PXRoaXMucmVhZGVyLnJlYWREYXRhKHRoaXMuemlwQ29tbWVudExlbmd0aCksZT1vLnVpbnQ4YXJyYXk/XCJ1aW50OGFycmF5XCI6XCJhcnJheVwiLHI9bi50cmFuc2Zvcm1UbyhlLHQpO3RoaXMuemlwQ29tbWVudD10aGlzLmxvYWRPcHRpb25zLmRlY29kZUZpbGVOYW1lKHIpfSxyZWFkQmxvY2taaXA2NEVuZE9mQ2VudHJhbDpmdW5jdGlvbigpe3RoaXMuemlwNjRFbmRPZkNlbnRyYWxTaXplPXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy5yZWFkZXIuc2tpcCg0KSx0aGlzLmRpc2tOdW1iZXI9dGhpcy5yZWFkZXIucmVhZEludCg0KSx0aGlzLmRpc2tXaXRoQ2VudHJhbERpclN0YXJ0PXRoaXMucmVhZGVyLnJlYWRJbnQoNCksdGhpcy5jZW50cmFsRGlyUmVjb3Jkc09uVGhpc0Rpc2s9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzPXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy5jZW50cmFsRGlyU2l6ZT10aGlzLnJlYWRlci5yZWFkSW50KDgpLHRoaXMuY2VudHJhbERpck9mZnNldD10aGlzLnJlYWRlci5yZWFkSW50KDgpLHRoaXMuemlwNjRFeHRlbnNpYmxlRGF0YT17fTtmb3IodmFyIHQsZSxyLGk9dGhpcy56aXA2NEVuZE9mQ2VudHJhbFNpemUtNDQ7MDxpOyl0PXRoaXMucmVhZGVyLnJlYWRJbnQoMiksZT10aGlzLnJlYWRlci5yZWFkSW50KDQpLHI9dGhpcy5yZWFkZXIucmVhZERhdGEoZSksdGhpcy56aXA2NEV4dGVuc2libGVEYXRhW3RdPXtpZDp0LGxlbmd0aDplLHZhbHVlOnJ9fSxyZWFkQmxvY2taaXA2NEVuZE9mQ2VudHJhbExvY2F0b3I6ZnVuY3Rpb24oKXtpZih0aGlzLmRpc2tXaXRoWmlwNjRDZW50cmFsRGlyU3RhcnQ9dGhpcy5yZWFkZXIucmVhZEludCg0KSx0aGlzLnJlbGF0aXZlT2Zmc2V0RW5kT2ZaaXA2NENlbnRyYWxEaXI9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLmRpc2tzQ291bnQ9dGhpcy5yZWFkZXIucmVhZEludCg0KSwxPHRoaXMuZGlza3NDb3VudCl0aHJvdyBuZXcgRXJyb3IoXCJNdWx0aS12b2x1bWVzIHppcCBhcmUgbm90IHN1cHBvcnRlZFwiKX0scmVhZExvY2FsRmlsZXM6ZnVuY3Rpb24oKXt2YXIgdCxlO2Zvcih0PTA7dDx0aGlzLmZpbGVzLmxlbmd0aDt0KyspZT10aGlzLmZpbGVzW3RdLHRoaXMucmVhZGVyLnNldEluZGV4KGUubG9jYWxIZWFkZXJPZmZzZXQpLHRoaXMuY2hlY2tTaWduYXR1cmUocy5MT0NBTF9GSUxFX0hFQURFUiksZS5yZWFkTG9jYWxQYXJ0KHRoaXMucmVhZGVyKSxlLmhhbmRsZVVURjgoKSxlLnByb2Nlc3NBdHRyaWJ1dGVzKCl9LHJlYWRDZW50cmFsRGlyOmZ1bmN0aW9uKCl7dmFyIHQ7Zm9yKHRoaXMucmVhZGVyLnNldEluZGV4KHRoaXMuY2VudHJhbERpck9mZnNldCk7dGhpcy5yZWFkZXIucmVhZEFuZENoZWNrU2lnbmF0dXJlKHMuQ0VOVFJBTF9GSUxFX0hFQURFUik7KSh0PW5ldyBhKHt6aXA2NDp0aGlzLnppcDY0fSx0aGlzLmxvYWRPcHRpb25zKSkucmVhZENlbnRyYWxQYXJ0KHRoaXMucmVhZGVyKSx0aGlzLmZpbGVzLnB1c2godCk7aWYodGhpcy5jZW50cmFsRGlyUmVjb3JkcyE9PXRoaXMuZmlsZXMubGVuZ3RoJiYwIT09dGhpcy5jZW50cmFsRGlyUmVjb3JkcyYmMD09PXRoaXMuZmlsZXMubGVuZ3RoKXRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXAgb3IgYnVnOiBleHBlY3RlZCBcIit0aGlzLmNlbnRyYWxEaXJSZWNvcmRzK1wiIHJlY29yZHMgaW4gY2VudHJhbCBkaXIsIGdvdCBcIit0aGlzLmZpbGVzLmxlbmd0aCl9LHJlYWRFbmRPZkNlbnRyYWw6ZnVuY3Rpb24oKXt2YXIgdD10aGlzLnJlYWRlci5sYXN0SW5kZXhPZlNpZ25hdHVyZShzLkNFTlRSQUxfRElSRUNUT1JZX0VORCk7aWYodDwwKXRocm93IXRoaXMuaXNTaWduYXR1cmUoMCxzLkxPQ0FMX0ZJTEVfSEVBREVSKT9uZXcgRXJyb3IoXCJDYW4ndCBmaW5kIGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSA6IGlzIHRoaXMgYSB6aXAgZmlsZSA/IElmIGl0IGlzLCBzZWUgaHR0cHM6Ly9zdHVrLmdpdGh1Yi5pby9qc3ppcC9kb2N1bWVudGF0aW9uL2hvd3RvL3JlYWRfemlwLmh0bWxcIik6bmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcDogY2FuJ3QgZmluZCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnlcIik7dGhpcy5yZWFkZXIuc2V0SW5kZXgodCk7dmFyIGU9dDtpZih0aGlzLmNoZWNrU2lnbmF0dXJlKHMuQ0VOVFJBTF9ESVJFQ1RPUllfRU5EKSx0aGlzLnJlYWRCbG9ja0VuZE9mQ2VudHJhbCgpLHRoaXMuZGlza051bWJlcj09PW4uTUFYX1ZBTFVFXzE2QklUU3x8dGhpcy5kaXNrV2l0aENlbnRyYWxEaXJTdGFydD09PW4uTUFYX1ZBTFVFXzE2QklUU3x8dGhpcy5jZW50cmFsRGlyUmVjb3Jkc09uVGhpc0Rpc2s9PT1uLk1BWF9WQUxVRV8xNkJJVFN8fHRoaXMuY2VudHJhbERpclJlY29yZHM9PT1uLk1BWF9WQUxVRV8xNkJJVFN8fHRoaXMuY2VudHJhbERpclNpemU9PT1uLk1BWF9WQUxVRV8zMkJJVFN8fHRoaXMuY2VudHJhbERpck9mZnNldD09PW4uTUFYX1ZBTFVFXzMyQklUUyl7aWYodGhpcy56aXA2ND0hMCwodD10aGlzLnJlYWRlci5sYXN0SW5kZXhPZlNpZ25hdHVyZShzLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0xPQ0FUT1IpKTwwKXRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXA6IGNhbid0IGZpbmQgdGhlIFpJUDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSBsb2NhdG9yXCIpO2lmKHRoaXMucmVhZGVyLnNldEluZGV4KHQpLHRoaXMuY2hlY2tTaWduYXR1cmUocy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9MT0NBVE9SKSx0aGlzLnJlYWRCbG9ja1ppcDY0RW5kT2ZDZW50cmFsTG9jYXRvcigpLCF0aGlzLmlzU2lnbmF0dXJlKHRoaXMucmVsYXRpdmVPZmZzZXRFbmRPZlppcDY0Q2VudHJhbERpcixzLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0VORCkmJih0aGlzLnJlbGF0aXZlT2Zmc2V0RW5kT2ZaaXA2NENlbnRyYWxEaXI9dGhpcy5yZWFkZXIubGFzdEluZGV4T2ZTaWduYXR1cmUocy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9FTkQpLHRoaXMucmVsYXRpdmVPZmZzZXRFbmRPZlppcDY0Q2VudHJhbERpcjwwKSl0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwOiBjYW4ndCBmaW5kIHRoZSBaSVA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnlcIik7dGhpcy5yZWFkZXIuc2V0SW5kZXgodGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyKSx0aGlzLmNoZWNrU2lnbmF0dXJlKHMuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfRU5EKSx0aGlzLnJlYWRCbG9ja1ppcDY0RW5kT2ZDZW50cmFsKCl9dmFyIHI9dGhpcy5jZW50cmFsRGlyT2Zmc2V0K3RoaXMuY2VudHJhbERpclNpemU7dGhpcy56aXA2NCYmKHIrPTIwLHIrPTEyK3RoaXMuemlwNjRFbmRPZkNlbnRyYWxTaXplKTt2YXIgaT1lLXI7aWYoMDxpKXRoaXMuaXNTaWduYXR1cmUoZSxzLkNFTlRSQUxfRklMRV9IRUFERVIpfHwodGhpcy5yZWFkZXIuemVybz1pKTtlbHNlIGlmKGk8MCl0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwOiBtaXNzaW5nIFwiK01hdGguYWJzKGkpK1wiIGJ5dGVzLlwiKX0scHJlcGFyZVJlYWRlcjpmdW5jdGlvbih0KXt0aGlzLnJlYWRlcj1pKHQpfSxsb2FkOmZ1bmN0aW9uKHQpe3RoaXMucHJlcGFyZVJlYWRlcih0KSx0aGlzLnJlYWRFbmRPZkNlbnRyYWwoKSx0aGlzLnJlYWRDZW50cmFsRGlyKCksdGhpcy5yZWFkTG9jYWxGaWxlcygpfX0sZS5leHBvcnRzPWh9LHtcIi4vcmVhZGVyL3JlYWRlckZvclwiOjIyLFwiLi9zaWduYXR1cmVcIjoyMyxcIi4vc3VwcG9ydFwiOjMwLFwiLi91dGY4XCI6MzEsXCIuL3V0aWxzXCI6MzIsXCIuL3ppcEVudHJ5XCI6MzR9XSwzNDpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL3JlYWRlci9yZWFkZXJGb3JcIikscz10KFwiLi91dGlsc1wiKSxuPXQoXCIuL2NvbXByZXNzZWRPYmplY3RcIiksYT10KFwiLi9jcmMzMlwiKSxvPXQoXCIuL3V0ZjhcIiksaD10KFwiLi9jb21wcmVzc2lvbnNcIiksdT10KFwiLi9zdXBwb3J0XCIpO2Z1bmN0aW9uIGwodCxlKXt0aGlzLm9wdGlvbnM9dCx0aGlzLmxvYWRPcHRpb25zPWV9bC5wcm90b3R5cGU9e2lzRW5jcnlwdGVkOmZ1bmN0aW9uKCl7cmV0dXJuIDE9PSgxJnRoaXMuYml0RmxhZyl9LHVzZVVURjg6ZnVuY3Rpb24oKXtyZXR1cm4gMjA0OD09KDIwNDgmdGhpcy5iaXRGbGFnKX0scmVhZExvY2FsUGFydDpmdW5jdGlvbih0KXt2YXIgZSxyO2lmKHQuc2tpcCgyMiksdGhpcy5maWxlTmFtZUxlbmd0aD10LnJlYWRJbnQoMikscj10LnJlYWRJbnQoMiksdGhpcy5maWxlTmFtZT10LnJlYWREYXRhKHRoaXMuZmlsZU5hbWVMZW5ndGgpLHQuc2tpcChyKSwtMT09PXRoaXMuY29tcHJlc3NlZFNpemV8fC0xPT09dGhpcy51bmNvbXByZXNzZWRTaXplKXRocm93IG5ldyBFcnJvcihcIkJ1ZyBvciBjb3JydXB0ZWQgemlwIDogZGlkbid0IGdldCBlbm91Z2ggaW5mb3JtYXRpb24gZnJvbSB0aGUgY2VudHJhbCBkaXJlY3RvcnkgKGNvbXByZXNzZWRTaXplID09PSAtMSB8fCB1bmNvbXByZXNzZWRTaXplID09PSAtMSlcIik7aWYobnVsbD09PShlPWZ1bmN0aW9uKHQpe2Zvcih2YXIgZSBpbiBoKWlmKGguaGFzT3duUHJvcGVydHkoZSkmJmhbZV0ubWFnaWM9PT10KXJldHVybiBoW2VdO3JldHVybiBudWxsfSh0aGlzLmNvbXByZXNzaW9uTWV0aG9kKSkpdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcCA6IGNvbXByZXNzaW9uIFwiK3MucHJldHR5KHRoaXMuY29tcHJlc3Npb25NZXRob2QpK1wiIHVua25vd24gKGlubmVyIGZpbGUgOiBcIitzLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsdGhpcy5maWxlTmFtZSkrXCIpXCIpO3RoaXMuZGVjb21wcmVzc2VkPW5ldyBuKHRoaXMuY29tcHJlc3NlZFNpemUsdGhpcy51bmNvbXByZXNzZWRTaXplLHRoaXMuY3JjMzIsZSx0LnJlYWREYXRhKHRoaXMuY29tcHJlc3NlZFNpemUpKX0scmVhZENlbnRyYWxQYXJ0OmZ1bmN0aW9uKHQpe3RoaXMudmVyc2lvbk1hZGVCeT10LnJlYWRJbnQoMiksdC5za2lwKDIpLHRoaXMuYml0RmxhZz10LnJlYWRJbnQoMiksdGhpcy5jb21wcmVzc2lvbk1ldGhvZD10LnJlYWRTdHJpbmcoMiksdGhpcy5kYXRlPXQucmVhZERhdGUoKSx0aGlzLmNyYzMyPXQucmVhZEludCg0KSx0aGlzLmNvbXByZXNzZWRTaXplPXQucmVhZEludCg0KSx0aGlzLnVuY29tcHJlc3NlZFNpemU9dC5yZWFkSW50KDQpO3ZhciBlPXQucmVhZEludCgyKTtpZih0aGlzLmV4dHJhRmllbGRzTGVuZ3RoPXQucmVhZEludCgyKSx0aGlzLmZpbGVDb21tZW50TGVuZ3RoPXQucmVhZEludCgyKSx0aGlzLmRpc2tOdW1iZXJTdGFydD10LnJlYWRJbnQoMiksdGhpcy5pbnRlcm5hbEZpbGVBdHRyaWJ1dGVzPXQucmVhZEludCgyKSx0aGlzLmV4dGVybmFsRmlsZUF0dHJpYnV0ZXM9dC5yZWFkSW50KDQpLHRoaXMubG9jYWxIZWFkZXJPZmZzZXQ9dC5yZWFkSW50KDQpLHRoaXMuaXNFbmNyeXB0ZWQoKSl0aHJvdyBuZXcgRXJyb3IoXCJFbmNyeXB0ZWQgemlwIGFyZSBub3Qgc3VwcG9ydGVkXCIpO3Quc2tpcChlKSx0aGlzLnJlYWRFeHRyYUZpZWxkcyh0KSx0aGlzLnBhcnNlWklQNjRFeHRyYUZpZWxkKHQpLHRoaXMuZmlsZUNvbW1lbnQ9dC5yZWFkRGF0YSh0aGlzLmZpbGVDb21tZW50TGVuZ3RoKX0scHJvY2Vzc0F0dHJpYnV0ZXM6ZnVuY3Rpb24oKXt0aGlzLnVuaXhQZXJtaXNzaW9ucz1udWxsLHRoaXMuZG9zUGVybWlzc2lvbnM9bnVsbDt2YXIgdD10aGlzLnZlcnNpb25NYWRlQnk+Pjg7dGhpcy5kaXI9ISEoMTYmdGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzKSwwPT10JiYodGhpcy5kb3NQZXJtaXNzaW9ucz02MyZ0aGlzLmV4dGVybmFsRmlsZUF0dHJpYnV0ZXMpLDM9PXQmJih0aGlzLnVuaXhQZXJtaXNzaW9ucz10aGlzLmV4dGVybmFsRmlsZUF0dHJpYnV0ZXM+PjE2JjY1NTM1KSx0aGlzLmRpcnx8XCIvXCIhPT10aGlzLmZpbGVOYW1lU3RyLnNsaWNlKC0xKXx8KHRoaXMuZGlyPSEwKX0scGFyc2VaSVA2NEV4dHJhRmllbGQ6ZnVuY3Rpb24odCl7aWYodGhpcy5leHRyYUZpZWxkc1sxXSl7dmFyIGU9aSh0aGlzLmV4dHJhRmllbGRzWzFdLnZhbHVlKTt0aGlzLnVuY29tcHJlc3NlZFNpemU9PT1zLk1BWF9WQUxVRV8zMkJJVFMmJih0aGlzLnVuY29tcHJlc3NlZFNpemU9ZS5yZWFkSW50KDgpKSx0aGlzLmNvbXByZXNzZWRTaXplPT09cy5NQVhfVkFMVUVfMzJCSVRTJiYodGhpcy5jb21wcmVzc2VkU2l6ZT1lLnJlYWRJbnQoOCkpLHRoaXMubG9jYWxIZWFkZXJPZmZzZXQ9PT1zLk1BWF9WQUxVRV8zMkJJVFMmJih0aGlzLmxvY2FsSGVhZGVyT2Zmc2V0PWUucmVhZEludCg4KSksdGhpcy5kaXNrTnVtYmVyU3RhcnQ9PT1zLk1BWF9WQUxVRV8zMkJJVFMmJih0aGlzLmRpc2tOdW1iZXJTdGFydD1lLnJlYWRJbnQoNCkpfX0scmVhZEV4dHJhRmllbGRzOmZ1bmN0aW9uKHQpe3ZhciBlLHIsaSxuPXQuaW5kZXgrdGhpcy5leHRyYUZpZWxkc0xlbmd0aDtmb3IodGhpcy5leHRyYUZpZWxkc3x8KHRoaXMuZXh0cmFGaWVsZHM9e30pO3QuaW5kZXgrNDxuOyllPXQucmVhZEludCgyKSxyPXQucmVhZEludCgyKSxpPXQucmVhZERhdGEociksdGhpcy5leHRyYUZpZWxkc1tlXT17aWQ6ZSxsZW5ndGg6cix2YWx1ZTppfTt0LnNldEluZGV4KG4pfSxoYW5kbGVVVEY4OmZ1bmN0aW9uKCl7dmFyIHQ9dS51aW50OGFycmF5P1widWludDhhcnJheVwiOlwiYXJyYXlcIjtpZih0aGlzLnVzZVVURjgoKSl0aGlzLmZpbGVOYW1lU3RyPW8udXRmOGRlY29kZSh0aGlzLmZpbGVOYW1lKSx0aGlzLmZpbGVDb21tZW50U3RyPW8udXRmOGRlY29kZSh0aGlzLmZpbGVDb21tZW50KTtlbHNle3ZhciBlPXRoaXMuZmluZEV4dHJhRmllbGRVbmljb2RlUGF0aCgpO2lmKG51bGwhPT1lKXRoaXMuZmlsZU5hbWVTdHI9ZTtlbHNle3ZhciByPXMudHJhbnNmb3JtVG8odCx0aGlzLmZpbGVOYW1lKTt0aGlzLmZpbGVOYW1lU3RyPXRoaXMubG9hZE9wdGlvbnMuZGVjb2RlRmlsZU5hbWUocil9dmFyIGk9dGhpcy5maW5kRXh0cmFGaWVsZFVuaWNvZGVDb21tZW50KCk7aWYobnVsbCE9PWkpdGhpcy5maWxlQ29tbWVudFN0cj1pO2Vsc2V7dmFyIG49cy50cmFuc2Zvcm1Ubyh0LHRoaXMuZmlsZUNvbW1lbnQpO3RoaXMuZmlsZUNvbW1lbnRTdHI9dGhpcy5sb2FkT3B0aW9ucy5kZWNvZGVGaWxlTmFtZShuKX19fSxmaW5kRXh0cmFGaWVsZFVuaWNvZGVQYXRoOmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy5leHRyYUZpZWxkc1syODc4OV07aWYodCl7dmFyIGU9aSh0LnZhbHVlKTtyZXR1cm4gMSE9PWUucmVhZEludCgxKT9udWxsOmEodGhpcy5maWxlTmFtZSkhPT1lLnJlYWRJbnQoNCk/bnVsbDpvLnV0ZjhkZWNvZGUoZS5yZWFkRGF0YSh0Lmxlbmd0aC01KSl9cmV0dXJuIG51bGx9LGZpbmRFeHRyYUZpZWxkVW5pY29kZUNvbW1lbnQ6ZnVuY3Rpb24oKXt2YXIgdD10aGlzLmV4dHJhRmllbGRzWzI1NDYxXTtpZih0KXt2YXIgZT1pKHQudmFsdWUpO3JldHVybiAxIT09ZS5yZWFkSW50KDEpP251bGw6YSh0aGlzLmZpbGVDb21tZW50KSE9PWUucmVhZEludCg0KT9udWxsOm8udXRmOGRlY29kZShlLnJlYWREYXRhKHQubGVuZ3RoLTUpKX1yZXR1cm4gbnVsbH19LGUuZXhwb3J0cz1sfSx7XCIuL2NvbXByZXNzZWRPYmplY3RcIjoyLFwiLi9jb21wcmVzc2lvbnNcIjozLFwiLi9jcmMzMlwiOjQsXCIuL3JlYWRlci9yZWFkZXJGb3JcIjoyMixcIi4vc3VwcG9ydFwiOjMwLFwiLi91dGY4XCI6MzEsXCIuL3V0aWxzXCI6MzJ9XSwzNTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIGkodCxlLHIpe3RoaXMubmFtZT10LHRoaXMuZGlyPXIuZGlyLHRoaXMuZGF0ZT1yLmRhdGUsdGhpcy5jb21tZW50PXIuY29tbWVudCx0aGlzLnVuaXhQZXJtaXNzaW9ucz1yLnVuaXhQZXJtaXNzaW9ucyx0aGlzLmRvc1Blcm1pc3Npb25zPXIuZG9zUGVybWlzc2lvbnMsdGhpcy5fZGF0YT1lLHRoaXMuX2RhdGFCaW5hcnk9ci5iaW5hcnksdGhpcy5vcHRpb25zPXtjb21wcmVzc2lvbjpyLmNvbXByZXNzaW9uLGNvbXByZXNzaW9uT3B0aW9uczpyLmNvbXByZXNzaW9uT3B0aW9uc319dmFyIHM9dChcIi4vc3RyZWFtL1N0cmVhbUhlbHBlclwiKSxuPXQoXCIuL3N0cmVhbS9EYXRhV29ya2VyXCIpLGE9dChcIi4vdXRmOFwiKSxvPXQoXCIuL2NvbXByZXNzZWRPYmplY3RcIiksaD10KFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKTtpLnByb3RvdHlwZT17aW50ZXJuYWxTdHJlYW06ZnVuY3Rpb24odCl7dmFyIGU9bnVsbCxyPVwic3RyaW5nXCI7dHJ5e2lmKCF0KXRocm93IG5ldyBFcnJvcihcIk5vIG91dHB1dCB0eXBlIHNwZWNpZmllZC5cIik7dmFyIGk9XCJzdHJpbmdcIj09PShyPXQudG9Mb3dlckNhc2UoKSl8fFwidGV4dFwiPT09cjtcImJpbmFyeXN0cmluZ1wiIT09ciYmXCJ0ZXh0XCIhPT1yfHwocj1cInN0cmluZ1wiKSxlPXRoaXMuX2RlY29tcHJlc3NXb3JrZXIoKTt2YXIgbj0hdGhpcy5fZGF0YUJpbmFyeTtuJiYhaSYmKGU9ZS5waXBlKG5ldyBhLlV0ZjhFbmNvZGVXb3JrZXIpKSwhbiYmaSYmKGU9ZS5waXBlKG5ldyBhLlV0ZjhEZWNvZGVXb3JrZXIpKX1jYXRjaCh0KXsoZT1uZXcgaChcImVycm9yXCIpKS5lcnJvcih0KX1yZXR1cm4gbmV3IHMoZSxyLFwiXCIpfSxhc3luYzpmdW5jdGlvbih0LGUpe3JldHVybiB0aGlzLmludGVybmFsU3RyZWFtKHQpLmFjY3VtdWxhdGUoZSl9LG5vZGVTdHJlYW06ZnVuY3Rpb24odCxlKXtyZXR1cm4gdGhpcy5pbnRlcm5hbFN0cmVhbSh0fHxcIm5vZGVidWZmZXJcIikudG9Ob2RlanNTdHJlYW0oZSl9LF9jb21wcmVzc1dvcmtlcjpmdW5jdGlvbih0LGUpe2lmKHRoaXMuX2RhdGEgaW5zdGFuY2VvZiBvJiZ0aGlzLl9kYXRhLmNvbXByZXNzaW9uLm1hZ2ljPT09dC5tYWdpYylyZXR1cm4gdGhpcy5fZGF0YS5nZXRDb21wcmVzc2VkV29ya2VyKCk7dmFyIHI9dGhpcy5fZGVjb21wcmVzc1dvcmtlcigpO3JldHVybiB0aGlzLl9kYXRhQmluYXJ5fHwocj1yLnBpcGUobmV3IGEuVXRmOEVuY29kZVdvcmtlcikpLG8uY3JlYXRlV29ya2VyRnJvbShyLHQsZSl9LF9kZWNvbXByZXNzV29ya2VyOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2RhdGEgaW5zdGFuY2VvZiBvP3RoaXMuX2RhdGEuZ2V0Q29udGVudFdvcmtlcigpOnRoaXMuX2RhdGEgaW5zdGFuY2VvZiBoP3RoaXMuX2RhdGE6bmV3IG4odGhpcy5fZGF0YSl9fTtmb3IodmFyIHU9W1wiYXNUZXh0XCIsXCJhc0JpbmFyeVwiLFwiYXNOb2RlQnVmZmVyXCIsXCJhc1VpbnQ4QXJyYXlcIixcImFzQXJyYXlCdWZmZXJcIl0sbD1mdW5jdGlvbigpe3Rocm93IG5ldyBFcnJvcihcIlRoaXMgbWV0aG9kIGhhcyBiZWVuIHJlbW92ZWQgaW4gSlNaaXAgMy4wLCBwbGVhc2UgY2hlY2sgdGhlIHVwZ3JhZGUgZ3VpZGUuXCIpfSxmPTA7Zjx1Lmxlbmd0aDtmKyspaS5wcm90b3R5cGVbdVtmXV09bDtlLmV4cG9ydHM9aX0se1wiLi9jb21wcmVzc2VkT2JqZWN0XCI6MixcIi4vc3RyZWFtL0RhdGFXb3JrZXJcIjoyNyxcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4vc3RyZWFtL1N0cmVhbUhlbHBlclwiOjI5LFwiLi91dGY4XCI6MzF9XSwzNjpbZnVuY3Rpb24odCxsLGUpeyhmdW5jdGlvbihlKXtcInVzZSBzdHJpY3RcIjt2YXIgcixpLHQ9ZS5NdXRhdGlvbk9ic2VydmVyfHxlLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7aWYodCl7dmFyIG49MCxzPW5ldyB0KHUpLGE9ZS5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtzLm9ic2VydmUoYSx7Y2hhcmFjdGVyRGF0YTohMH0pLHI9ZnVuY3Rpb24oKXthLmRhdGE9bj0rK24lMn19ZWxzZSBpZihlLnNldEltbWVkaWF0ZXx8dm9pZCAwPT09ZS5NZXNzYWdlQ2hhbm5lbClyPVwiZG9jdW1lbnRcImluIGUmJlwib25yZWFkeXN0YXRlY2hhbmdlXCJpbiBlLmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik/ZnVuY3Rpb24oKXt2YXIgdD1lLmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7dC5vbnJlYWR5c3RhdGVjaGFuZ2U9ZnVuY3Rpb24oKXt1KCksdC5vbnJlYWR5c3RhdGVjaGFuZ2U9bnVsbCx0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodCksdD1udWxsfSxlLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZCh0KX06ZnVuY3Rpb24oKXtzZXRUaW1lb3V0KHUsMCl9O2Vsc2V7dmFyIG89bmV3IGUuTWVzc2FnZUNoYW5uZWw7by5wb3J0MS5vbm1lc3NhZ2U9dSxyPWZ1bmN0aW9uKCl7by5wb3J0Mi5wb3N0TWVzc2FnZSgwKX19dmFyIGg9W107ZnVuY3Rpb24gdSgpe3ZhciB0LGU7aT0hMDtmb3IodmFyIHI9aC5sZW5ndGg7cjspe2ZvcihlPWgsaD1bXSx0PS0xOysrdDxyOyllW3RdKCk7cj1oLmxlbmd0aH1pPSExfWwuZXhwb3J0cz1mdW5jdGlvbih0KXsxIT09aC5wdXNoKHQpfHxpfHxyKCl9fSkuY2FsbCh0aGlzLFwidW5kZWZpbmVkXCIhPXR5cGVvZiBnbG9iYWw/Z2xvYmFsOlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6e30pfSx7fV0sMzc6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbj10KFwiaW1tZWRpYXRlXCIpO2Z1bmN0aW9uIHUoKXt9dmFyIGw9e30scz1bXCJSRUpFQ1RFRFwiXSxhPVtcIkZVTEZJTExFRFwiXSxpPVtcIlBFTkRJTkdcIl07ZnVuY3Rpb24gbyh0KXtpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiB0KXRocm93IG5ldyBUeXBlRXJyb3IoXCJyZXNvbHZlciBtdXN0IGJlIGEgZnVuY3Rpb25cIik7dGhpcy5zdGF0ZT1pLHRoaXMucXVldWU9W10sdGhpcy5vdXRjb21lPXZvaWQgMCx0IT09dSYmYyh0aGlzLHQpfWZ1bmN0aW9uIGgodCxlLHIpe3RoaXMucHJvbWlzZT10LFwiZnVuY3Rpb25cIj09dHlwZW9mIGUmJih0aGlzLm9uRnVsZmlsbGVkPWUsdGhpcy5jYWxsRnVsZmlsbGVkPXRoaXMub3RoZXJDYWxsRnVsZmlsbGVkKSxcImZ1bmN0aW9uXCI9PXR5cGVvZiByJiYodGhpcy5vblJlamVjdGVkPXIsdGhpcy5jYWxsUmVqZWN0ZWQ9dGhpcy5vdGhlckNhbGxSZWplY3RlZCl9ZnVuY3Rpb24gZihlLHIsaSl7bihmdW5jdGlvbigpe3ZhciB0O3RyeXt0PXIoaSl9Y2F0Y2godCl7cmV0dXJuIGwucmVqZWN0KGUsdCl9dD09PWU/bC5yZWplY3QoZSxuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHJlc29sdmUgcHJvbWlzZSB3aXRoIGl0c2VsZlwiKSk6bC5yZXNvbHZlKGUsdCl9KX1mdW5jdGlvbiBkKHQpe3ZhciBlPXQmJnQudGhlbjtpZih0JiYoXCJvYmplY3RcIj09dHlwZW9mIHR8fFwiZnVuY3Rpb25cIj09dHlwZW9mIHQpJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiBlKXJldHVybiBmdW5jdGlvbigpe2UuYXBwbHkodCxhcmd1bWVudHMpfX1mdW5jdGlvbiBjKGUsdCl7dmFyIHI9ITE7ZnVuY3Rpb24gaSh0KXtyfHwocj0hMCxsLnJlamVjdChlLHQpKX1mdW5jdGlvbiBuKHQpe3J8fChyPSEwLGwucmVzb2x2ZShlLHQpKX12YXIgcz1wKGZ1bmN0aW9uKCl7dChuLGkpfSk7XCJlcnJvclwiPT09cy5zdGF0dXMmJmkocy52YWx1ZSl9ZnVuY3Rpb24gcCh0LGUpe3ZhciByPXt9O3RyeXtyLnZhbHVlPXQoZSksci5zdGF0dXM9XCJzdWNjZXNzXCJ9Y2F0Y2godCl7ci5zdGF0dXM9XCJlcnJvclwiLHIudmFsdWU9dH1yZXR1cm4gcn0oZS5leHBvcnRzPW8pLnByb3RvdHlwZS5maW5hbGx5PWZ1bmN0aW9uKGUpe2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIGUpcmV0dXJuIHRoaXM7dmFyIHI9dGhpcy5jb25zdHJ1Y3RvcjtyZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uKHQpe3JldHVybiByLnJlc29sdmUoZSgpKS50aGVuKGZ1bmN0aW9uKCl7cmV0dXJuIHR9KX0sZnVuY3Rpb24odCl7cmV0dXJuIHIucmVzb2x2ZShlKCkpLnRoZW4oZnVuY3Rpb24oKXt0aHJvdyB0fSl9KX0sby5wcm90b3R5cGUuY2F0Y2g9ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMudGhlbihudWxsLHQpfSxvLnByb3RvdHlwZS50aGVuPWZ1bmN0aW9uKHQsZSl7aWYoXCJmdW5jdGlvblwiIT10eXBlb2YgdCYmdGhpcy5zdGF0ZT09PWF8fFwiZnVuY3Rpb25cIiE9dHlwZW9mIGUmJnRoaXMuc3RhdGU9PT1zKXJldHVybiB0aGlzO3ZhciByPW5ldyB0aGlzLmNvbnN0cnVjdG9yKHUpO3RoaXMuc3RhdGUhPT1pP2Yocix0aGlzLnN0YXRlPT09YT90OmUsdGhpcy5vdXRjb21lKTp0aGlzLnF1ZXVlLnB1c2gobmV3IGgocix0LGUpKTtyZXR1cm4gcn0saC5wcm90b3R5cGUuY2FsbEZ1bGZpbGxlZD1mdW5jdGlvbih0KXtsLnJlc29sdmUodGhpcy5wcm9taXNlLHQpfSxoLnByb3RvdHlwZS5vdGhlckNhbGxGdWxmaWxsZWQ9ZnVuY3Rpb24odCl7Zih0aGlzLnByb21pc2UsdGhpcy5vbkZ1bGZpbGxlZCx0KX0saC5wcm90b3R5cGUuY2FsbFJlamVjdGVkPWZ1bmN0aW9uKHQpe2wucmVqZWN0KHRoaXMucHJvbWlzZSx0KX0saC5wcm90b3R5cGUub3RoZXJDYWxsUmVqZWN0ZWQ9ZnVuY3Rpb24odCl7Zih0aGlzLnByb21pc2UsdGhpcy5vblJlamVjdGVkLHQpfSxsLnJlc29sdmU9ZnVuY3Rpb24odCxlKXt2YXIgcj1wKGQsZSk7aWYoXCJlcnJvclwiPT09ci5zdGF0dXMpcmV0dXJuIGwucmVqZWN0KHQsci52YWx1ZSk7dmFyIGk9ci52YWx1ZTtpZihpKWModCxpKTtlbHNle3Quc3RhdGU9YSx0Lm91dGNvbWU9ZTtmb3IodmFyIG49LTEscz10LnF1ZXVlLmxlbmd0aDsrK248czspdC5xdWV1ZVtuXS5jYWxsRnVsZmlsbGVkKGUpfXJldHVybiB0fSxsLnJlamVjdD1mdW5jdGlvbih0LGUpe3Quc3RhdGU9cyx0Lm91dGNvbWU9ZTtmb3IodmFyIHI9LTEsaT10LnF1ZXVlLmxlbmd0aDsrK3I8aTspdC5xdWV1ZVtyXS5jYWxsUmVqZWN0ZWQoZSk7cmV0dXJuIHR9LG8ucmVzb2x2ZT1mdW5jdGlvbih0KXtpZih0IGluc3RhbmNlb2YgdGhpcylyZXR1cm4gdDtyZXR1cm4gbC5yZXNvbHZlKG5ldyB0aGlzKHUpLHQpfSxvLnJlamVjdD1mdW5jdGlvbih0KXt2YXIgZT1uZXcgdGhpcyh1KTtyZXR1cm4gbC5yZWplY3QoZSx0KX0sby5hbGw9ZnVuY3Rpb24odCl7dmFyIHI9dGhpcztpZihcIltvYmplY3QgQXJyYXldXCIhPT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodCkpcmV0dXJuIHRoaXMucmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJtdXN0IGJlIGFuIGFycmF5XCIpKTt2YXIgaT10Lmxlbmd0aCxuPSExO2lmKCFpKXJldHVybiB0aGlzLnJlc29sdmUoW10pO3ZhciBzPW5ldyBBcnJheShpKSxhPTAsZT0tMSxvPW5ldyB0aGlzKHUpO2Zvcig7KytlPGk7KWgodFtlXSxlKTtyZXR1cm4gbztmdW5jdGlvbiBoKHQsZSl7ci5yZXNvbHZlKHQpLnRoZW4oZnVuY3Rpb24odCl7c1tlXT10LCsrYSE9PWl8fG58fChuPSEwLGwucmVzb2x2ZShvLHMpKX0sZnVuY3Rpb24odCl7bnx8KG49ITAsbC5yZWplY3Qobyx0KSl9KX19LG8ucmFjZT1mdW5jdGlvbih0KXt2YXIgZT10aGlzO2lmKFwiW29iamVjdCBBcnJheV1cIiE9PU9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0KSlyZXR1cm4gdGhpcy5yZWplY3QobmV3IFR5cGVFcnJvcihcIm11c3QgYmUgYW4gYXJyYXlcIikpO3ZhciByPXQubGVuZ3RoLGk9ITE7aWYoIXIpcmV0dXJuIHRoaXMucmVzb2x2ZShbXSk7dmFyIG49LTEscz1uZXcgdGhpcyh1KTtmb3IoOysrbjxyOylhPXRbbl0sZS5yZXNvbHZlKGEpLnRoZW4oZnVuY3Rpb24odCl7aXx8KGk9ITAsbC5yZXNvbHZlKHMsdCkpfSxmdW5jdGlvbih0KXtpfHwoaT0hMCxsLnJlamVjdChzLHQpKX0pO3ZhciBhO3JldHVybiBzfX0se2ltbWVkaWF0ZTozNn1dLDM4OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9e307KDAsdChcIi4vbGliL3V0aWxzL2NvbW1vblwiKS5hc3NpZ24pKGksdChcIi4vbGliL2RlZmxhdGVcIiksdChcIi4vbGliL2luZmxhdGVcIiksdChcIi4vbGliL3psaWIvY29uc3RhbnRzXCIpKSxlLmV4cG9ydHM9aX0se1wiLi9saWIvZGVmbGF0ZVwiOjM5LFwiLi9saWIvaW5mbGF0ZVwiOjQwLFwiLi9saWIvdXRpbHMvY29tbW9uXCI6NDEsXCIuL2xpYi96bGliL2NvbnN0YW50c1wiOjQ0fV0sMzk6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgYT10KFwiLi96bGliL2RlZmxhdGVcIiksbz10KFwiLi91dGlscy9jb21tb25cIiksaD10KFwiLi91dGlscy9zdHJpbmdzXCIpLG49dChcIi4vemxpYi9tZXNzYWdlc1wiKSxzPXQoXCIuL3psaWIvenN0cmVhbVwiKSx1PU9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsbD0wLGY9LTEsZD0wLGM9ODtmdW5jdGlvbiBwKHQpe2lmKCEodGhpcyBpbnN0YW5jZW9mIHApKXJldHVybiBuZXcgcCh0KTt0aGlzLm9wdGlvbnM9by5hc3NpZ24oe2xldmVsOmYsbWV0aG9kOmMsY2h1bmtTaXplOjE2Mzg0LHdpbmRvd0JpdHM6MTUsbWVtTGV2ZWw6OCxzdHJhdGVneTpkLHRvOlwiXCJ9LHR8fHt9KTt2YXIgZT10aGlzLm9wdGlvbnM7ZS5yYXcmJjA8ZS53aW5kb3dCaXRzP2Uud2luZG93Qml0cz0tZS53aW5kb3dCaXRzOmUuZ3ppcCYmMDxlLndpbmRvd0JpdHMmJmUud2luZG93Qml0czwxNiYmKGUud2luZG93Qml0cys9MTYpLHRoaXMuZXJyPTAsdGhpcy5tc2c9XCJcIix0aGlzLmVuZGVkPSExLHRoaXMuY2h1bmtzPVtdLHRoaXMuc3RybT1uZXcgcyx0aGlzLnN0cm0uYXZhaWxfb3V0PTA7dmFyIHI9YS5kZWZsYXRlSW5pdDIodGhpcy5zdHJtLGUubGV2ZWwsZS5tZXRob2QsZS53aW5kb3dCaXRzLGUubWVtTGV2ZWwsZS5zdHJhdGVneSk7aWYociE9PWwpdGhyb3cgbmV3IEVycm9yKG5bcl0pO2lmKGUuaGVhZGVyJiZhLmRlZmxhdGVTZXRIZWFkZXIodGhpcy5zdHJtLGUuaGVhZGVyKSxlLmRpY3Rpb25hcnkpe3ZhciBpO2lmKGk9XCJzdHJpbmdcIj09dHlwZW9mIGUuZGljdGlvbmFyeT9oLnN0cmluZzJidWYoZS5kaWN0aW9uYXJ5KTpcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI9PT11LmNhbGwoZS5kaWN0aW9uYXJ5KT9uZXcgVWludDhBcnJheShlLmRpY3Rpb25hcnkpOmUuZGljdGlvbmFyeSwocj1hLmRlZmxhdGVTZXREaWN0aW9uYXJ5KHRoaXMuc3RybSxpKSkhPT1sKXRocm93IG5ldyBFcnJvcihuW3JdKTt0aGlzLl9kaWN0X3NldD0hMH19ZnVuY3Rpb24gaSh0LGUpe3ZhciByPW5ldyBwKGUpO2lmKHIucHVzaCh0LCEwKSxyLmVycil0aHJvdyByLm1zZ3x8bltyLmVycl07cmV0dXJuIHIucmVzdWx0fXAucHJvdG90eXBlLnB1c2g9ZnVuY3Rpb24odCxlKXt2YXIgcixpLG49dGhpcy5zdHJtLHM9dGhpcy5vcHRpb25zLmNodW5rU2l6ZTtpZih0aGlzLmVuZGVkKXJldHVybiExO2k9ZT09PX5+ZT9lOiEwPT09ZT80OjAsXCJzdHJpbmdcIj09dHlwZW9mIHQ/bi5pbnB1dD1oLnN0cmluZzJidWYodCk6XCJbb2JqZWN0IEFycmF5QnVmZmVyXVwiPT09dS5jYWxsKHQpP24uaW5wdXQ9bmV3IFVpbnQ4QXJyYXkodCk6bi5pbnB1dD10LG4ubmV4dF9pbj0wLG4uYXZhaWxfaW49bi5pbnB1dC5sZW5ndGg7ZG97aWYoMD09PW4uYXZhaWxfb3V0JiYobi5vdXRwdXQ9bmV3IG8uQnVmOChzKSxuLm5leHRfb3V0PTAsbi5hdmFpbF9vdXQ9cyksMSE9PShyPWEuZGVmbGF0ZShuLGkpKSYmciE9PWwpcmV0dXJuIHRoaXMub25FbmQociksISh0aGlzLmVuZGVkPSEwKTswIT09bi5hdmFpbF9vdXQmJigwIT09bi5hdmFpbF9pbnx8NCE9PWkmJjIhPT1pKXx8KFwic3RyaW5nXCI9PT10aGlzLm9wdGlvbnMudG8/dGhpcy5vbkRhdGEoaC5idWYyYmluc3RyaW5nKG8uc2hyaW5rQnVmKG4ub3V0cHV0LG4ubmV4dF9vdXQpKSk6dGhpcy5vbkRhdGEoby5zaHJpbmtCdWYobi5vdXRwdXQsbi5uZXh0X291dCkpKX13aGlsZSgoMDxuLmF2YWlsX2lufHwwPT09bi5hdmFpbF9vdXQpJiYxIT09cik7cmV0dXJuIDQ9PT1pPyhyPWEuZGVmbGF0ZUVuZCh0aGlzLnN0cm0pLHRoaXMub25FbmQociksdGhpcy5lbmRlZD0hMCxyPT09bCk6MiE9PWl8fCh0aGlzLm9uRW5kKGwpLCEobi5hdmFpbF9vdXQ9MCkpfSxwLnByb3RvdHlwZS5vbkRhdGE9ZnVuY3Rpb24odCl7dGhpcy5jaHVua3MucHVzaCh0KX0scC5wcm90b3R5cGUub25FbmQ9ZnVuY3Rpb24odCl7dD09PWwmJihcInN0cmluZ1wiPT09dGhpcy5vcHRpb25zLnRvP3RoaXMucmVzdWx0PXRoaXMuY2h1bmtzLmpvaW4oXCJcIik6dGhpcy5yZXN1bHQ9by5mbGF0dGVuQ2h1bmtzKHRoaXMuY2h1bmtzKSksdGhpcy5jaHVua3M9W10sdGhpcy5lcnI9dCx0aGlzLm1zZz10aGlzLnN0cm0ubXNnfSxyLkRlZmxhdGU9cCxyLmRlZmxhdGU9aSxyLmRlZmxhdGVSYXc9ZnVuY3Rpb24odCxlKXtyZXR1cm4oZT1lfHx7fSkucmF3PSEwLGkodCxlKX0sci5nemlwPWZ1bmN0aW9uKHQsZSl7cmV0dXJuKGU9ZXx8e30pLmd6aXA9ITAsaSh0LGUpfX0se1wiLi91dGlscy9jb21tb25cIjo0MSxcIi4vdXRpbHMvc3RyaW5nc1wiOjQyLFwiLi96bGliL2RlZmxhdGVcIjo0NixcIi4vemxpYi9tZXNzYWdlc1wiOjUxLFwiLi96bGliL3pzdHJlYW1cIjo1M31dLDQwOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGQ9dChcIi4vemxpYi9pbmZsYXRlXCIpLGM9dChcIi4vdXRpbHMvY29tbW9uXCIpLHA9dChcIi4vdXRpbHMvc3RyaW5nc1wiKSxtPXQoXCIuL3psaWIvY29uc3RhbnRzXCIpLGk9dChcIi4vemxpYi9tZXNzYWdlc1wiKSxuPXQoXCIuL3psaWIvenN0cmVhbVwiKSxzPXQoXCIuL3psaWIvZ3poZWFkZXJcIiksXz1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO2Z1bmN0aW9uIGEodCl7aWYoISh0aGlzIGluc3RhbmNlb2YgYSkpcmV0dXJuIG5ldyBhKHQpO3RoaXMub3B0aW9ucz1jLmFzc2lnbih7Y2h1bmtTaXplOjE2Mzg0LHdpbmRvd0JpdHM6MCx0bzpcIlwifSx0fHx7fSk7dmFyIGU9dGhpcy5vcHRpb25zO2UucmF3JiYwPD1lLndpbmRvd0JpdHMmJmUud2luZG93Qml0czwxNiYmKGUud2luZG93Qml0cz0tZS53aW5kb3dCaXRzLDA9PT1lLndpbmRvd0JpdHMmJihlLndpbmRvd0JpdHM9LTE1KSksISgwPD1lLndpbmRvd0JpdHMmJmUud2luZG93Qml0czwxNil8fHQmJnQud2luZG93Qml0c3x8KGUud2luZG93Qml0cys9MzIpLDE1PGUud2luZG93Qml0cyYmZS53aW5kb3dCaXRzPDQ4JiYwPT0oMTUmZS53aW5kb3dCaXRzKSYmKGUud2luZG93Qml0c3w9MTUpLHRoaXMuZXJyPTAsdGhpcy5tc2c9XCJcIix0aGlzLmVuZGVkPSExLHRoaXMuY2h1bmtzPVtdLHRoaXMuc3RybT1uZXcgbix0aGlzLnN0cm0uYXZhaWxfb3V0PTA7dmFyIHI9ZC5pbmZsYXRlSW5pdDIodGhpcy5zdHJtLGUud2luZG93Qml0cyk7aWYociE9PW0uWl9PSyl0aHJvdyBuZXcgRXJyb3IoaVtyXSk7dGhpcy5oZWFkZXI9bmV3IHMsZC5pbmZsYXRlR2V0SGVhZGVyKHRoaXMuc3RybSx0aGlzLmhlYWRlcil9ZnVuY3Rpb24gbyh0LGUpe3ZhciByPW5ldyBhKGUpO2lmKHIucHVzaCh0LCEwKSxyLmVycil0aHJvdyByLm1zZ3x8aVtyLmVycl07cmV0dXJuIHIucmVzdWx0fWEucHJvdG90eXBlLnB1c2g9ZnVuY3Rpb24odCxlKXt2YXIgcixpLG4scyxhLG8saD10aGlzLnN0cm0sdT10aGlzLm9wdGlvbnMuY2h1bmtTaXplLGw9dGhpcy5vcHRpb25zLmRpY3Rpb25hcnksZj0hMTtpZih0aGlzLmVuZGVkKXJldHVybiExO2k9ZT09PX5+ZT9lOiEwPT09ZT9tLlpfRklOSVNIOm0uWl9OT19GTFVTSCxcInN0cmluZ1wiPT10eXBlb2YgdD9oLmlucHV0PXAuYmluc3RyaW5nMmJ1Zih0KTpcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI9PT1fLmNhbGwodCk/aC5pbnB1dD1uZXcgVWludDhBcnJheSh0KTpoLmlucHV0PXQsaC5uZXh0X2luPTAsaC5hdmFpbF9pbj1oLmlucHV0Lmxlbmd0aDtkb3tpZigwPT09aC5hdmFpbF9vdXQmJihoLm91dHB1dD1uZXcgYy5CdWY4KHUpLGgubmV4dF9vdXQ9MCxoLmF2YWlsX291dD11KSwocj1kLmluZmxhdGUoaCxtLlpfTk9fRkxVU0gpKT09PW0uWl9ORUVEX0RJQ1QmJmwmJihvPVwic3RyaW5nXCI9PXR5cGVvZiBsP3Auc3RyaW5nMmJ1ZihsKTpcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI9PT1fLmNhbGwobCk/bmV3IFVpbnQ4QXJyYXkobCk6bCxyPWQuaW5mbGF0ZVNldERpY3Rpb25hcnkodGhpcy5zdHJtLG8pKSxyPT09bS5aX0JVRl9FUlJPUiYmITA9PT1mJiYocj1tLlpfT0ssZj0hMSksciE9PW0uWl9TVFJFQU1fRU5EJiZyIT09bS5aX09LKXJldHVybiB0aGlzLm9uRW5kKHIpLCEodGhpcy5lbmRlZD0hMCk7aC5uZXh0X291dCYmKDAhPT1oLmF2YWlsX291dCYmciE9PW0uWl9TVFJFQU1fRU5EJiYoMCE9PWguYXZhaWxfaW58fGkhPT1tLlpfRklOSVNIJiZpIT09bS5aX1NZTkNfRkxVU0gpfHwoXCJzdHJpbmdcIj09PXRoaXMub3B0aW9ucy50bz8obj1wLnV0Zjhib3JkZXIoaC5vdXRwdXQsaC5uZXh0X291dCkscz1oLm5leHRfb3V0LW4sYT1wLmJ1ZjJzdHJpbmcoaC5vdXRwdXQsbiksaC5uZXh0X291dD1zLGguYXZhaWxfb3V0PXUtcyxzJiZjLmFycmF5U2V0KGgub3V0cHV0LGgub3V0cHV0LG4scywwKSx0aGlzLm9uRGF0YShhKSk6dGhpcy5vbkRhdGEoYy5zaHJpbmtCdWYoaC5vdXRwdXQsaC5uZXh0X291dCkpKSksMD09PWguYXZhaWxfaW4mJjA9PT1oLmF2YWlsX291dCYmKGY9ITApfXdoaWxlKCgwPGguYXZhaWxfaW58fDA9PT1oLmF2YWlsX291dCkmJnIhPT1tLlpfU1RSRUFNX0VORCk7cmV0dXJuIHI9PT1tLlpfU1RSRUFNX0VORCYmKGk9bS5aX0ZJTklTSCksaT09PW0uWl9GSU5JU0g/KHI9ZC5pbmZsYXRlRW5kKHRoaXMuc3RybSksdGhpcy5vbkVuZChyKSx0aGlzLmVuZGVkPSEwLHI9PT1tLlpfT0spOmkhPT1tLlpfU1lOQ19GTFVTSHx8KHRoaXMub25FbmQobS5aX09LKSwhKGguYXZhaWxfb3V0PTApKX0sYS5wcm90b3R5cGUub25EYXRhPWZ1bmN0aW9uKHQpe3RoaXMuY2h1bmtzLnB1c2godCl9LGEucHJvdG90eXBlLm9uRW5kPWZ1bmN0aW9uKHQpe3Q9PT1tLlpfT0smJihcInN0cmluZ1wiPT09dGhpcy5vcHRpb25zLnRvP3RoaXMucmVzdWx0PXRoaXMuY2h1bmtzLmpvaW4oXCJcIik6dGhpcy5yZXN1bHQ9Yy5mbGF0dGVuQ2h1bmtzKHRoaXMuY2h1bmtzKSksdGhpcy5jaHVua3M9W10sdGhpcy5lcnI9dCx0aGlzLm1zZz10aGlzLnN0cm0ubXNnfSxyLkluZmxhdGU9YSxyLmluZmxhdGU9byxyLmluZmxhdGVSYXc9ZnVuY3Rpb24odCxlKXtyZXR1cm4oZT1lfHx7fSkucmF3PSEwLG8odCxlKX0sci51bmd6aXA9b30se1wiLi91dGlscy9jb21tb25cIjo0MSxcIi4vdXRpbHMvc3RyaW5nc1wiOjQyLFwiLi96bGliL2NvbnN0YW50c1wiOjQ0LFwiLi96bGliL2d6aGVhZGVyXCI6NDcsXCIuL3psaWIvaW5mbGF0ZVwiOjQ5LFwiLi96bGliL21lc3NhZ2VzXCI6NTEsXCIuL3psaWIvenN0cmVhbVwiOjUzfV0sNDE6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT1cInVuZGVmaW5lZFwiIT10eXBlb2YgVWludDhBcnJheSYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIFVpbnQxNkFycmF5JiZcInVuZGVmaW5lZFwiIT10eXBlb2YgSW50MzJBcnJheTtyLmFzc2lnbj1mdW5jdGlvbih0KXtmb3IodmFyIGU9QXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLDEpO2UubGVuZ3RoOyl7dmFyIHI9ZS5zaGlmdCgpO2lmKHIpe2lmKFwib2JqZWN0XCIhPXR5cGVvZiByKXRocm93IG5ldyBUeXBlRXJyb3IocitcIm11c3QgYmUgbm9uLW9iamVjdFwiKTtmb3IodmFyIGkgaW4gcilyLmhhc093blByb3BlcnR5KGkpJiYodFtpXT1yW2ldKX19cmV0dXJuIHR9LHIuc2hyaW5rQnVmPWZ1bmN0aW9uKHQsZSl7cmV0dXJuIHQubGVuZ3RoPT09ZT90OnQuc3ViYXJyYXk/dC5zdWJhcnJheSgwLGUpOih0Lmxlbmd0aD1lLHQpfTt2YXIgbj17YXJyYXlTZXQ6ZnVuY3Rpb24odCxlLHIsaSxuKXtpZihlLnN1YmFycmF5JiZ0LnN1YmFycmF5KXQuc2V0KGUuc3ViYXJyYXkocixyK2kpLG4pO2Vsc2UgZm9yKHZhciBzPTA7czxpO3MrKyl0W24rc109ZVtyK3NdfSxmbGF0dGVuQ2h1bmtzOmZ1bmN0aW9uKHQpe3ZhciBlLHIsaSxuLHMsYTtmb3IoZT1pPTAscj10Lmxlbmd0aDtlPHI7ZSsrKWkrPXRbZV0ubGVuZ3RoO2ZvcihhPW5ldyBVaW50OEFycmF5KGkpLGU9bj0wLHI9dC5sZW5ndGg7ZTxyO2UrKylzPXRbZV0sYS5zZXQocyxuKSxuKz1zLmxlbmd0aDtyZXR1cm4gYX19LHM9e2FycmF5U2V0OmZ1bmN0aW9uKHQsZSxyLGksbil7Zm9yKHZhciBzPTA7czxpO3MrKyl0W24rc109ZVtyK3NdfSxmbGF0dGVuQ2h1bmtzOmZ1bmN0aW9uKHQpe3JldHVybltdLmNvbmNhdC5hcHBseShbXSx0KX19O3Iuc2V0VHlwZWQ9ZnVuY3Rpb24odCl7dD8oci5CdWY4PVVpbnQ4QXJyYXksci5CdWYxNj1VaW50MTZBcnJheSxyLkJ1ZjMyPUludDMyQXJyYXksci5hc3NpZ24ocixuKSk6KHIuQnVmOD1BcnJheSxyLkJ1ZjE2PUFycmF5LHIuQnVmMzI9QXJyYXksci5hc3NpZ24ocixzKSl9LHIuc2V0VHlwZWQoaSl9LHt9XSw0MjpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBoPXQoXCIuL2NvbW1vblwiKSxuPSEwLHM9ITA7dHJ5e1N0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxbMF0pfWNhdGNoKHQpe249ITF9dHJ5e1N0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxuZXcgVWludDhBcnJheSgxKSl9Y2F0Y2godCl7cz0hMX1mb3IodmFyIHU9bmV3IGguQnVmOCgyNTYpLGk9MDtpPDI1NjtpKyspdVtpXT0yNTI8PWk/NjoyNDg8PWk/NToyNDA8PWk/NDoyMjQ8PWk/MzoxOTI8PWk/MjoxO2Z1bmN0aW9uIGwodCxlKXtpZihlPDY1NTM3JiYodC5zdWJhcnJheSYmc3x8IXQuc3ViYXJyYXkmJm4pKXJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsaC5zaHJpbmtCdWYodCxlKSk7Zm9yKHZhciByPVwiXCIsaT0wO2k8ZTtpKyspcis9U3RyaW5nLmZyb21DaGFyQ29kZSh0W2ldKTtyZXR1cm4gcn11WzI1NF09dVsyNTRdPTEsci5zdHJpbmcyYnVmPWZ1bmN0aW9uKHQpe3ZhciBlLHIsaSxuLHMsYT10Lmxlbmd0aCxvPTA7Zm9yKG49MDtuPGE7bisrKTU1Mjk2PT0oNjQ1MTImKHI9dC5jaGFyQ29kZUF0KG4pKSkmJm4rMTxhJiY1NjMyMD09KDY0NTEyJihpPXQuY2hhckNvZGVBdChuKzEpKSkmJihyPTY1NTM2KyhyLTU1Mjk2PDwxMCkrKGktNTYzMjApLG4rKyksbys9cjwxMjg/MTpyPDIwNDg/MjpyPDY1NTM2PzM6NDtmb3IoZT1uZXcgaC5CdWY4KG8pLG49cz0wO3M8bztuKyspNTUyOTY9PSg2NDUxMiYocj10LmNoYXJDb2RlQXQobikpKSYmbisxPGEmJjU2MzIwPT0oNjQ1MTImKGk9dC5jaGFyQ29kZUF0KG4rMSkpKSYmKHI9NjU1MzYrKHItNTUyOTY8PDEwKSsoaS01NjMyMCksbisrKSxyPDEyOD9lW3MrK109cjoocjwyMDQ4P2VbcysrXT0xOTJ8cj4+PjY6KHI8NjU1MzY/ZVtzKytdPTIyNHxyPj4+MTI6KGVbcysrXT0yNDB8cj4+PjE4LGVbcysrXT0xMjh8cj4+PjEyJjYzKSxlW3MrK109MTI4fHI+Pj42JjYzKSxlW3MrK109MTI4fDYzJnIpO3JldHVybiBlfSxyLmJ1ZjJiaW5zdHJpbmc9ZnVuY3Rpb24odCl7cmV0dXJuIGwodCx0Lmxlbmd0aCl9LHIuYmluc3RyaW5nMmJ1Zj1mdW5jdGlvbih0KXtmb3IodmFyIGU9bmV3IGguQnVmOCh0Lmxlbmd0aCkscj0wLGk9ZS5sZW5ndGg7cjxpO3IrKyllW3JdPXQuY2hhckNvZGVBdChyKTtyZXR1cm4gZX0sci5idWYyc3RyaW5nPWZ1bmN0aW9uKHQsZSl7dmFyIHIsaSxuLHMsYT1lfHx0Lmxlbmd0aCxvPW5ldyBBcnJheSgyKmEpO2ZvcihyPWk9MDtyPGE7KWlmKChuPXRbcisrXSk8MTI4KW9baSsrXT1uO2Vsc2UgaWYoNDwocz11W25dKSlvW2krK109NjU1MzMscis9cy0xO2Vsc2V7Zm9yKG4mPTI9PT1zPzMxOjM9PT1zPzE1Ojc7MTxzJiZyPGE7KW49bjw8Nnw2MyZ0W3IrK10scy0tOzE8cz9vW2krK109NjU1MzM6bjw2NTUzNj9vW2krK109bjoobi09NjU1MzYsb1tpKytdPTU1Mjk2fG4+PjEwJjEwMjMsb1tpKytdPTU2MzIwfDEwMjMmbil9cmV0dXJuIGwobyxpKX0sci51dGY4Ym9yZGVyPWZ1bmN0aW9uKHQsZSl7dmFyIHI7Zm9yKChlPWV8fHQubGVuZ3RoKT50Lmxlbmd0aCYmKGU9dC5sZW5ndGgpLHI9ZS0xOzA8PXImJjEyOD09KDE5MiZ0W3JdKTspci0tO3JldHVybiByPDA/ZTowPT09cj9lOnIrdVt0W3JdXT5lP3I6ZX19LHtcIi4vY29tbW9uXCI6NDF9XSw0MzpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2UuZXhwb3J0cz1mdW5jdGlvbih0LGUscixpKXtmb3IodmFyIG49NjU1MzUmdHwwLHM9dD4+PjE2JjY1NTM1fDAsYT0wOzAhPT1yOyl7Zm9yKHItPWE9MmUzPHI/MmUzOnI7cz1zKyhuPW4rZVtpKytdfDApfDAsLS1hOyk7biU9NjU1MjEscyU9NjU1MjF9cmV0dXJuIG58czw8MTZ8MH19LHt9XSw0NDpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2UuZXhwb3J0cz17Wl9OT19GTFVTSDowLFpfUEFSVElBTF9GTFVTSDoxLFpfU1lOQ19GTFVTSDoyLFpfRlVMTF9GTFVTSDozLFpfRklOSVNIOjQsWl9CTE9DSzo1LFpfVFJFRVM6NixaX09LOjAsWl9TVFJFQU1fRU5EOjEsWl9ORUVEX0RJQ1Q6MixaX0VSUk5POi0xLFpfU1RSRUFNX0VSUk9SOi0yLFpfREFUQV9FUlJPUjotMyxaX0JVRl9FUlJPUjotNSxaX05PX0NPTVBSRVNTSU9OOjAsWl9CRVNUX1NQRUVEOjEsWl9CRVNUX0NPTVBSRVNTSU9OOjksWl9ERUZBVUxUX0NPTVBSRVNTSU9OOi0xLFpfRklMVEVSRUQ6MSxaX0hVRkZNQU5fT05MWToyLFpfUkxFOjMsWl9GSVhFRDo0LFpfREVGQVVMVF9TVFJBVEVHWTowLFpfQklOQVJZOjAsWl9URVhUOjEsWl9VTktOT1dOOjIsWl9ERUZMQVRFRDo4fX0se31dLDQ1OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIG89ZnVuY3Rpb24oKXtmb3IodmFyIHQsZT1bXSxyPTA7cjwyNTY7cisrKXt0PXI7Zm9yKHZhciBpPTA7aTw4O2krKyl0PTEmdD8zOTg4MjkyMzg0XnQ+Pj4xOnQ+Pj4xO2Vbcl09dH1yZXR1cm4gZX0oKTtlLmV4cG9ydHM9ZnVuY3Rpb24odCxlLHIsaSl7dmFyIG49byxzPWkrcjt0Xj0tMTtmb3IodmFyIGE9aTthPHM7YSsrKXQ9dD4+PjheblsyNTUmKHReZVthXSldO3JldHVybi0xXnR9fSx7fV0sNDY6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaCxkPXQoXCIuLi91dGlscy9jb21tb25cIiksdT10KFwiLi90cmVlc1wiKSxjPXQoXCIuL2FkbGVyMzJcIikscD10KFwiLi9jcmMzMlwiKSxpPXQoXCIuL21lc3NhZ2VzXCIpLGw9MCxmPTQsbT0wLF89LTIsZz0tMSxiPTQsbj0yLHY9OCx5PTkscz0yODYsYT0zMCxvPTE5LHc9MipzKzEsaz0xNSx4PTMsUz0yNTgsej1TK3grMSxDPTQyLEU9MTEzLEE9MSxJPTIsTz0zLEI9NDtmdW5jdGlvbiBSKHQsZSl7cmV0dXJuIHQubXNnPWlbZV0sZX1mdW5jdGlvbiBUKHQpe3JldHVybih0PDwxKS0oNDx0Pzk6MCl9ZnVuY3Rpb24gRCh0KXtmb3IodmFyIGU9dC5sZW5ndGg7MDw9LS1lOyl0W2VdPTB9ZnVuY3Rpb24gRih0KXt2YXIgZT10LnN0YXRlLHI9ZS5wZW5kaW5nO3I+dC5hdmFpbF9vdXQmJihyPXQuYXZhaWxfb3V0KSwwIT09ciYmKGQuYXJyYXlTZXQodC5vdXRwdXQsZS5wZW5kaW5nX2J1ZixlLnBlbmRpbmdfb3V0LHIsdC5uZXh0X291dCksdC5uZXh0X291dCs9cixlLnBlbmRpbmdfb3V0Kz1yLHQudG90YWxfb3V0Kz1yLHQuYXZhaWxfb3V0LT1yLGUucGVuZGluZy09ciwwPT09ZS5wZW5kaW5nJiYoZS5wZW5kaW5nX291dD0wKSl9ZnVuY3Rpb24gTih0LGUpe3UuX3RyX2ZsdXNoX2Jsb2NrKHQsMDw9dC5ibG9ja19zdGFydD90LmJsb2NrX3N0YXJ0Oi0xLHQuc3Ryc3RhcnQtdC5ibG9ja19zdGFydCxlKSx0LmJsb2NrX3N0YXJ0PXQuc3Ryc3RhcnQsRih0LnN0cm0pfWZ1bmN0aW9uIFUodCxlKXt0LnBlbmRpbmdfYnVmW3QucGVuZGluZysrXT1lfWZ1bmN0aW9uIFAodCxlKXt0LnBlbmRpbmdfYnVmW3QucGVuZGluZysrXT1lPj4+OCYyNTUsdC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmcrK109MjU1JmV9ZnVuY3Rpb24gTCh0LGUpe3ZhciByLGksbj10Lm1heF9jaGFpbl9sZW5ndGgscz10LnN0cnN0YXJ0LGE9dC5wcmV2X2xlbmd0aCxvPXQubmljZV9tYXRjaCxoPXQuc3Ryc3RhcnQ+dC53X3NpemUtej90LnN0cnN0YXJ0LSh0Lndfc2l6ZS16KTowLHU9dC53aW5kb3csbD10LndfbWFzayxmPXQucHJldixkPXQuc3Ryc3RhcnQrUyxjPXVbcythLTFdLHA9dVtzK2FdO3QucHJldl9sZW5ndGg+PXQuZ29vZF9tYXRjaCYmKG4+Pj0yKSxvPnQubG9va2FoZWFkJiYobz10Lmxvb2thaGVhZCk7ZG97aWYodVsocj1lKSthXT09PXAmJnVbcithLTFdPT09YyYmdVtyXT09PXVbc10mJnVbKytyXT09PXVbcysxXSl7cys9MixyKys7ZG97fXdoaWxlKHVbKytzXT09PXVbKytyXSYmdVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnVbKytzXT09PXVbKytyXSYmdVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnVbKytzXT09PXVbKytyXSYmdVsrK3NdPT09dVsrK3JdJiZzPGQpO2lmKGk9Uy0oZC1zKSxzPWQtUyxhPGkpe2lmKHQubWF0Y2hfc3RhcnQ9ZSxvPD0oYT1pKSlicmVhaztjPXVbcythLTFdLHA9dVtzK2FdfX19d2hpbGUoKGU9ZltlJmxdKT5oJiYwIT0tLW4pO3JldHVybiBhPD10Lmxvb2thaGVhZD9hOnQubG9va2FoZWFkfWZ1bmN0aW9uIGoodCl7dmFyIGUscixpLG4scyxhLG8saCx1LGwsZj10Lndfc2l6ZTtkb3tpZihuPXQud2luZG93X3NpemUtdC5sb29rYWhlYWQtdC5zdHJzdGFydCx0LnN0cnN0YXJ0Pj1mKyhmLXopKXtmb3IoZC5hcnJheVNldCh0LndpbmRvdyx0LndpbmRvdyxmLGYsMCksdC5tYXRjaF9zdGFydC09Zix0LnN0cnN0YXJ0LT1mLHQuYmxvY2tfc3RhcnQtPWYsZT1yPXQuaGFzaF9zaXplO2k9dC5oZWFkWy0tZV0sdC5oZWFkW2VdPWY8PWk/aS1mOjAsLS1yOyk7Zm9yKGU9cj1mO2k9dC5wcmV2Wy0tZV0sdC5wcmV2W2VdPWY8PWk/aS1mOjAsLS1yOyk7bis9Zn1pZigwPT09dC5zdHJtLmF2YWlsX2luKWJyZWFrO2lmKGE9dC5zdHJtLG89dC53aW5kb3csaD10LnN0cnN0YXJ0K3QubG9va2FoZWFkLHU9bixsPXZvaWQgMCxsPWEuYXZhaWxfaW4sdTxsJiYobD11KSxyPTA9PT1sPzA6KGEuYXZhaWxfaW4tPWwsZC5hcnJheVNldChvLGEuaW5wdXQsYS5uZXh0X2luLGwsaCksMT09PWEuc3RhdGUud3JhcD9hLmFkbGVyPWMoYS5hZGxlcixvLGwsaCk6Mj09PWEuc3RhdGUud3JhcCYmKGEuYWRsZXI9cChhLmFkbGVyLG8sbCxoKSksYS5uZXh0X2luKz1sLGEudG90YWxfaW4rPWwsbCksdC5sb29rYWhlYWQrPXIsdC5sb29rYWhlYWQrdC5pbnNlcnQ+PXgpZm9yKHM9dC5zdHJzdGFydC10Lmluc2VydCx0Lmluc19oPXQud2luZG93W3NdLHQuaW5zX2g9KHQuaW5zX2g8PHQuaGFzaF9zaGlmdF50LndpbmRvd1tzKzFdKSZ0Lmhhc2hfbWFzazt0Lmluc2VydCYmKHQuaW5zX2g9KHQuaW5zX2g8PHQuaGFzaF9zaGlmdF50LndpbmRvd1tzK3gtMV0pJnQuaGFzaF9tYXNrLHQucHJldltzJnQud19tYXNrXT10LmhlYWRbdC5pbnNfaF0sdC5oZWFkW3QuaW5zX2hdPXMscysrLHQuaW5zZXJ0LS0sISh0Lmxvb2thaGVhZCt0Lmluc2VydDx4KSk7KTt9d2hpbGUodC5sb29rYWhlYWQ8eiYmMCE9PXQuc3RybS5hdmFpbF9pbil9ZnVuY3Rpb24gWih0LGUpe2Zvcih2YXIgcixpOzspe2lmKHQubG9va2FoZWFkPHope2lmKGoodCksdC5sb29rYWhlYWQ8eiYmZT09PWwpcmV0dXJuIEE7aWYoMD09PXQubG9va2FoZWFkKWJyZWFrfWlmKHI9MCx0Lmxvb2thaGVhZD49eCYmKHQuaW5zX2g9KHQuaW5zX2g8PHQuaGFzaF9zaGlmdF50LndpbmRvd1t0LnN0cnN0YXJ0K3gtMV0pJnQuaGFzaF9tYXNrLHI9dC5wcmV2W3Quc3Ryc3RhcnQmdC53X21hc2tdPXQuaGVhZFt0Lmluc19oXSx0LmhlYWRbdC5pbnNfaF09dC5zdHJzdGFydCksMCE9PXImJnQuc3Ryc3RhcnQtcjw9dC53X3NpemUteiYmKHQubWF0Y2hfbGVuZ3RoPUwodCxyKSksdC5tYXRjaF9sZW5ndGg+PXgpaWYoaT11Ll90cl90YWxseSh0LHQuc3Ryc3RhcnQtdC5tYXRjaF9zdGFydCx0Lm1hdGNoX2xlbmd0aC14KSx0Lmxvb2thaGVhZC09dC5tYXRjaF9sZW5ndGgsdC5tYXRjaF9sZW5ndGg8PXQubWF4X2xhenlfbWF0Y2gmJnQubG9va2FoZWFkPj14KXtmb3IodC5tYXRjaF9sZW5ndGgtLTt0LnN0cnN0YXJ0KyssdC5pbnNfaD0odC5pbnNfaDw8dC5oYXNoX3NoaWZ0XnQud2luZG93W3Quc3Ryc3RhcnQreC0xXSkmdC5oYXNoX21hc2sscj10LnByZXZbdC5zdHJzdGFydCZ0LndfbWFza109dC5oZWFkW3QuaW5zX2hdLHQuaGVhZFt0Lmluc19oXT10LnN0cnN0YXJ0LDAhPS0tdC5tYXRjaF9sZW5ndGg7KTt0LnN0cnN0YXJ0Kyt9ZWxzZSB0LnN0cnN0YXJ0Kz10Lm1hdGNoX2xlbmd0aCx0Lm1hdGNoX2xlbmd0aD0wLHQuaW5zX2g9dC53aW5kb3dbdC5zdHJzdGFydF0sdC5pbnNfaD0odC5pbnNfaDw8dC5oYXNoX3NoaWZ0XnQud2luZG93W3Quc3Ryc3RhcnQrMV0pJnQuaGFzaF9tYXNrO2Vsc2UgaT11Ll90cl90YWxseSh0LDAsdC53aW5kb3dbdC5zdHJzdGFydF0pLHQubG9va2FoZWFkLS0sdC5zdHJzdGFydCsrO2lmKGkmJihOKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gQX1yZXR1cm4gdC5pbnNlcnQ9dC5zdHJzdGFydDx4LTE/dC5zdHJzdGFydDp4LTEsZT09PWY/KE4odCwhMCksMD09PXQuc3RybS5hdmFpbF9vdXQ/TzpCKTp0Lmxhc3RfbGl0JiYoTih0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCk/QTpJfWZ1bmN0aW9uIFcodCxlKXtmb3IodmFyIHIsaSxuOzspe2lmKHQubG9va2FoZWFkPHope2lmKGoodCksdC5sb29rYWhlYWQ8eiYmZT09PWwpcmV0dXJuIEE7aWYoMD09PXQubG9va2FoZWFkKWJyZWFrfWlmKHI9MCx0Lmxvb2thaGVhZD49eCYmKHQuaW5zX2g9KHQuaW5zX2g8PHQuaGFzaF9zaGlmdF50LndpbmRvd1t0LnN0cnN0YXJ0K3gtMV0pJnQuaGFzaF9tYXNrLHI9dC5wcmV2W3Quc3Ryc3RhcnQmdC53X21hc2tdPXQuaGVhZFt0Lmluc19oXSx0LmhlYWRbdC5pbnNfaF09dC5zdHJzdGFydCksdC5wcmV2X2xlbmd0aD10Lm1hdGNoX2xlbmd0aCx0LnByZXZfbWF0Y2g9dC5tYXRjaF9zdGFydCx0Lm1hdGNoX2xlbmd0aD14LTEsMCE9PXImJnQucHJldl9sZW5ndGg8dC5tYXhfbGF6eV9tYXRjaCYmdC5zdHJzdGFydC1yPD10Lndfc2l6ZS16JiYodC5tYXRjaF9sZW5ndGg9TCh0LHIpLHQubWF0Y2hfbGVuZ3RoPD01JiYoMT09PXQuc3RyYXRlZ3l8fHQubWF0Y2hfbGVuZ3RoPT09eCYmNDA5Njx0LnN0cnN0YXJ0LXQubWF0Y2hfc3RhcnQpJiYodC5tYXRjaF9sZW5ndGg9eC0xKSksdC5wcmV2X2xlbmd0aD49eCYmdC5tYXRjaF9sZW5ndGg8PXQucHJldl9sZW5ndGgpe2ZvcihuPXQuc3Ryc3RhcnQrdC5sb29rYWhlYWQteCxpPXUuX3RyX3RhbGx5KHQsdC5zdHJzdGFydC0xLXQucHJldl9tYXRjaCx0LnByZXZfbGVuZ3RoLXgpLHQubG9va2FoZWFkLT10LnByZXZfbGVuZ3RoLTEsdC5wcmV2X2xlbmd0aC09MjsrK3Quc3Ryc3RhcnQ8PW4mJih0Lmluc19oPSh0Lmluc19oPDx0Lmhhc2hfc2hpZnRedC53aW5kb3dbdC5zdHJzdGFydCt4LTFdKSZ0Lmhhc2hfbWFzayxyPXQucHJldlt0LnN0cnN0YXJ0JnQud19tYXNrXT10LmhlYWRbdC5pbnNfaF0sdC5oZWFkW3QuaW5zX2hdPXQuc3Ryc3RhcnQpLDAhPS0tdC5wcmV2X2xlbmd0aDspO2lmKHQubWF0Y2hfYXZhaWxhYmxlPTAsdC5tYXRjaF9sZW5ndGg9eC0xLHQuc3Ryc3RhcnQrKyxpJiYoTih0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCkpcmV0dXJuIEF9ZWxzZSBpZih0Lm1hdGNoX2F2YWlsYWJsZSl7aWYoKGk9dS5fdHJfdGFsbHkodCwwLHQud2luZG93W3Quc3Ryc3RhcnQtMV0pKSYmTih0LCExKSx0LnN0cnN0YXJ0KyssdC5sb29rYWhlYWQtLSwwPT09dC5zdHJtLmF2YWlsX291dClyZXR1cm4gQX1lbHNlIHQubWF0Y2hfYXZhaWxhYmxlPTEsdC5zdHJzdGFydCsrLHQubG9va2FoZWFkLS19cmV0dXJuIHQubWF0Y2hfYXZhaWxhYmxlJiYoaT11Ll90cl90YWxseSh0LDAsdC53aW5kb3dbdC5zdHJzdGFydC0xXSksdC5tYXRjaF9hdmFpbGFibGU9MCksdC5pbnNlcnQ9dC5zdHJzdGFydDx4LTE/dC5zdHJzdGFydDp4LTEsZT09PWY/KE4odCwhMCksMD09PXQuc3RybS5hdmFpbF9vdXQ/TzpCKTp0Lmxhc3RfbGl0JiYoTih0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCk/QTpJfWZ1bmN0aW9uIE0odCxlLHIsaSxuKXt0aGlzLmdvb2RfbGVuZ3RoPXQsdGhpcy5tYXhfbGF6eT1lLHRoaXMubmljZV9sZW5ndGg9cix0aGlzLm1heF9jaGFpbj1pLHRoaXMuZnVuYz1ufWZ1bmN0aW9uIEgoKXt0aGlzLnN0cm09bnVsbCx0aGlzLnN0YXR1cz0wLHRoaXMucGVuZGluZ19idWY9bnVsbCx0aGlzLnBlbmRpbmdfYnVmX3NpemU9MCx0aGlzLnBlbmRpbmdfb3V0PTAsdGhpcy5wZW5kaW5nPTAsdGhpcy53cmFwPTAsdGhpcy5nemhlYWQ9bnVsbCx0aGlzLmd6aW5kZXg9MCx0aGlzLm1ldGhvZD12LHRoaXMubGFzdF9mbHVzaD0tMSx0aGlzLndfc2l6ZT0wLHRoaXMud19iaXRzPTAsdGhpcy53X21hc2s9MCx0aGlzLndpbmRvdz1udWxsLHRoaXMud2luZG93X3NpemU9MCx0aGlzLnByZXY9bnVsbCx0aGlzLmhlYWQ9bnVsbCx0aGlzLmluc19oPTAsdGhpcy5oYXNoX3NpemU9MCx0aGlzLmhhc2hfYml0cz0wLHRoaXMuaGFzaF9tYXNrPTAsdGhpcy5oYXNoX3NoaWZ0PTAsdGhpcy5ibG9ja19zdGFydD0wLHRoaXMubWF0Y2hfbGVuZ3RoPTAsdGhpcy5wcmV2X21hdGNoPTAsdGhpcy5tYXRjaF9hdmFpbGFibGU9MCx0aGlzLnN0cnN0YXJ0PTAsdGhpcy5tYXRjaF9zdGFydD0wLHRoaXMubG9va2FoZWFkPTAsdGhpcy5wcmV2X2xlbmd0aD0wLHRoaXMubWF4X2NoYWluX2xlbmd0aD0wLHRoaXMubWF4X2xhenlfbWF0Y2g9MCx0aGlzLmxldmVsPTAsdGhpcy5zdHJhdGVneT0wLHRoaXMuZ29vZF9tYXRjaD0wLHRoaXMubmljZV9tYXRjaD0wLHRoaXMuZHluX2x0cmVlPW5ldyBkLkJ1ZjE2KDIqdyksdGhpcy5keW5fZHRyZWU9bmV3IGQuQnVmMTYoMiooMiphKzEpKSx0aGlzLmJsX3RyZWU9bmV3IGQuQnVmMTYoMiooMipvKzEpKSxEKHRoaXMuZHluX2x0cmVlKSxEKHRoaXMuZHluX2R0cmVlKSxEKHRoaXMuYmxfdHJlZSksdGhpcy5sX2Rlc2M9bnVsbCx0aGlzLmRfZGVzYz1udWxsLHRoaXMuYmxfZGVzYz1udWxsLHRoaXMuYmxfY291bnQ9bmV3IGQuQnVmMTYoaysxKSx0aGlzLmhlYXA9bmV3IGQuQnVmMTYoMipzKzEpLEQodGhpcy5oZWFwKSx0aGlzLmhlYXBfbGVuPTAsdGhpcy5oZWFwX21heD0wLHRoaXMuZGVwdGg9bmV3IGQuQnVmMTYoMipzKzEpLEQodGhpcy5kZXB0aCksdGhpcy5sX2J1Zj0wLHRoaXMubGl0X2J1ZnNpemU9MCx0aGlzLmxhc3RfbGl0PTAsdGhpcy5kX2J1Zj0wLHRoaXMub3B0X2xlbj0wLHRoaXMuc3RhdGljX2xlbj0wLHRoaXMubWF0Y2hlcz0wLHRoaXMuaW5zZXJ0PTAsdGhpcy5iaV9idWY9MCx0aGlzLmJpX3ZhbGlkPTB9ZnVuY3Rpb24gRyh0KXt2YXIgZTtyZXR1cm4gdCYmdC5zdGF0ZT8odC50b3RhbF9pbj10LnRvdGFsX291dD0wLHQuZGF0YV90eXBlPW4sKGU9dC5zdGF0ZSkucGVuZGluZz0wLGUucGVuZGluZ19vdXQ9MCxlLndyYXA8MCYmKGUud3JhcD0tZS53cmFwKSxlLnN0YXR1cz1lLndyYXA/QzpFLHQuYWRsZXI9Mj09PWUud3JhcD8wOjEsZS5sYXN0X2ZsdXNoPWwsdS5fdHJfaW5pdChlKSxtKTpSKHQsXyl9ZnVuY3Rpb24gSyh0KXt2YXIgZT1HKHQpO3JldHVybiBlPT09bSYmZnVuY3Rpb24odCl7dC53aW5kb3dfc2l6ZT0yKnQud19zaXplLEQodC5oZWFkKSx0Lm1heF9sYXp5X21hdGNoPWhbdC5sZXZlbF0ubWF4X2xhenksdC5nb29kX21hdGNoPWhbdC5sZXZlbF0uZ29vZF9sZW5ndGgsdC5uaWNlX21hdGNoPWhbdC5sZXZlbF0ubmljZV9sZW5ndGgsdC5tYXhfY2hhaW5fbGVuZ3RoPWhbdC5sZXZlbF0ubWF4X2NoYWluLHQuc3Ryc3RhcnQ9MCx0LmJsb2NrX3N0YXJ0PTAsdC5sb29rYWhlYWQ9MCx0Lmluc2VydD0wLHQubWF0Y2hfbGVuZ3RoPXQucHJldl9sZW5ndGg9eC0xLHQubWF0Y2hfYXZhaWxhYmxlPTAsdC5pbnNfaD0wfSh0LnN0YXRlKSxlfWZ1bmN0aW9uIFkodCxlLHIsaSxuLHMpe2lmKCF0KXJldHVybiBfO3ZhciBhPTE7aWYoZT09PWcmJihlPTYpLGk8MD8oYT0wLGk9LWkpOjE1PGkmJihhPTIsaS09MTYpLG48MXx8eTxufHxyIT09dnx8aTw4fHwxNTxpfHxlPDB8fDk8ZXx8czwwfHxiPHMpcmV0dXJuIFIodCxfKTs4PT09aSYmKGk9OSk7dmFyIG89bmV3IEg7cmV0dXJuKHQuc3RhdGU9bykuc3RybT10LG8ud3JhcD1hLG8uZ3poZWFkPW51bGwsby53X2JpdHM9aSxvLndfc2l6ZT0xPDxvLndfYml0cyxvLndfbWFzaz1vLndfc2l6ZS0xLG8uaGFzaF9iaXRzPW4rNyxvLmhhc2hfc2l6ZT0xPDxvLmhhc2hfYml0cyxvLmhhc2hfbWFzaz1vLmhhc2hfc2l6ZS0xLG8uaGFzaF9zaGlmdD1+figoby5oYXNoX2JpdHMreC0xKS94KSxvLndpbmRvdz1uZXcgZC5CdWY4KDIqby53X3NpemUpLG8uaGVhZD1uZXcgZC5CdWYxNihvLmhhc2hfc2l6ZSksby5wcmV2PW5ldyBkLkJ1ZjE2KG8ud19zaXplKSxvLmxpdF9idWZzaXplPTE8PG4rNixvLnBlbmRpbmdfYnVmX3NpemU9NCpvLmxpdF9idWZzaXplLG8ucGVuZGluZ19idWY9bmV3IGQuQnVmOChvLnBlbmRpbmdfYnVmX3NpemUpLG8uZF9idWY9MSpvLmxpdF9idWZzaXplLG8ubF9idWY9MypvLmxpdF9idWZzaXplLG8ubGV2ZWw9ZSxvLnN0cmF0ZWd5PXMsby5tZXRob2Q9cixLKHQpfWg9W25ldyBNKDAsMCwwLDAsZnVuY3Rpb24odCxlKXt2YXIgcj02NTUzNTtmb3Iocj50LnBlbmRpbmdfYnVmX3NpemUtNSYmKHI9dC5wZW5kaW5nX2J1Zl9zaXplLTUpOzspe2lmKHQubG9va2FoZWFkPD0xKXtpZihqKHQpLDA9PT10Lmxvb2thaGVhZCYmZT09PWwpcmV0dXJuIEE7aWYoMD09PXQubG9va2FoZWFkKWJyZWFrfXQuc3Ryc3RhcnQrPXQubG9va2FoZWFkLHQubG9va2FoZWFkPTA7dmFyIGk9dC5ibG9ja19zdGFydCtyO2lmKCgwPT09dC5zdHJzdGFydHx8dC5zdHJzdGFydD49aSkmJih0Lmxvb2thaGVhZD10LnN0cnN0YXJ0LWksdC5zdHJzdGFydD1pLE4odCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpKXJldHVybiBBO2lmKHQuc3Ryc3RhcnQtdC5ibG9ja19zdGFydD49dC53X3NpemUteiYmKE4odCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpKXJldHVybiBBfXJldHVybiB0Lmluc2VydD0wLGU9PT1mPyhOKHQsITApLDA9PT10LnN0cm0uYXZhaWxfb3V0P086Qik6KHQuc3Ryc3RhcnQ+dC5ibG9ja19zdGFydCYmKE4odCwhMSksdC5zdHJtLmF2YWlsX291dCksQSl9KSxuZXcgTSg0LDQsOCw0LFopLG5ldyBNKDQsNSwxNiw4LFopLG5ldyBNKDQsNiwzMiwzMixaKSxuZXcgTSg0LDQsMTYsMTYsVyksbmV3IE0oOCwxNiwzMiwzMixXKSxuZXcgTSg4LDE2LDEyOCwxMjgsVyksbmV3IE0oOCwzMiwxMjgsMjU2LFcpLG5ldyBNKDMyLDEyOCwyNTgsMTAyNCxXKSxuZXcgTSgzMiwyNTgsMjU4LDQwOTYsVyldLHIuZGVmbGF0ZUluaXQ9ZnVuY3Rpb24odCxlKXtyZXR1cm4gWSh0LGUsdiwxNSw4LDApfSxyLmRlZmxhdGVJbml0Mj1ZLHIuZGVmbGF0ZVJlc2V0PUssci5kZWZsYXRlUmVzZXRLZWVwPUcsci5kZWZsYXRlU2V0SGVhZGVyPWZ1bmN0aW9uKHQsZSl7cmV0dXJuIHQmJnQuc3RhdGU/MiE9PXQuc3RhdGUud3JhcD9fOih0LnN0YXRlLmd6aGVhZD1lLG0pOl99LHIuZGVmbGF0ZT1mdW5jdGlvbih0LGUpe3ZhciByLGksbixzO2lmKCF0fHwhdC5zdGF0ZXx8NTxlfHxlPDApcmV0dXJuIHQ/Uih0LF8pOl87aWYoaT10LnN0YXRlLCF0Lm91dHB1dHx8IXQuaW5wdXQmJjAhPT10LmF2YWlsX2lufHw2NjY9PT1pLnN0YXR1cyYmZSE9PWYpcmV0dXJuIFIodCwwPT09dC5hdmFpbF9vdXQ/LTU6Xyk7aWYoaS5zdHJtPXQscj1pLmxhc3RfZmx1c2gsaS5sYXN0X2ZsdXNoPWUsaS5zdGF0dXM9PT1DKWlmKDI9PT1pLndyYXApdC5hZGxlcj0wLFUoaSwzMSksVShpLDEzOSksVShpLDgpLGkuZ3poZWFkPyhVKGksKGkuZ3poZWFkLnRleHQ/MTowKSsoaS5nemhlYWQuaGNyYz8yOjApKyhpLmd6aGVhZC5leHRyYT80OjApKyhpLmd6aGVhZC5uYW1lPzg6MCkrKGkuZ3poZWFkLmNvbW1lbnQ/MTY6MCkpLFUoaSwyNTUmaS5nemhlYWQudGltZSksVShpLGkuZ3poZWFkLnRpbWU+PjgmMjU1KSxVKGksaS5nemhlYWQudGltZT4+MTYmMjU1KSxVKGksaS5nemhlYWQudGltZT4+MjQmMjU1KSxVKGksOT09PWkubGV2ZWw/MjoyPD1pLnN0cmF0ZWd5fHxpLmxldmVsPDI/NDowKSxVKGksMjU1JmkuZ3poZWFkLm9zKSxpLmd6aGVhZC5leHRyYSYmaS5nemhlYWQuZXh0cmEubGVuZ3RoJiYoVShpLDI1NSZpLmd6aGVhZC5leHRyYS5sZW5ndGgpLFUoaSxpLmd6aGVhZC5leHRyYS5sZW5ndGg+PjgmMjU1KSksaS5nemhlYWQuaGNyYyYmKHQuYWRsZXI9cCh0LmFkbGVyLGkucGVuZGluZ19idWYsaS5wZW5kaW5nLDApKSxpLmd6aW5kZXg9MCxpLnN0YXR1cz02OSk6KFUoaSwwKSxVKGksMCksVShpLDApLFUoaSwwKSxVKGksMCksVShpLDk9PT1pLmxldmVsPzI6Mjw9aS5zdHJhdGVneXx8aS5sZXZlbDwyPzQ6MCksVShpLDMpLGkuc3RhdHVzPUUpO2Vsc2V7dmFyIGE9disoaS53X2JpdHMtODw8NCk8PDg7YXw9KDI8PWkuc3RyYXRlZ3l8fGkubGV2ZWw8Mj8wOmkubGV2ZWw8Nj8xOjY9PT1pLmxldmVsPzI6Myk8PDYsMCE9PWkuc3Ryc3RhcnQmJihhfD0zMiksYSs9MzEtYSUzMSxpLnN0YXR1cz1FLFAoaSxhKSwwIT09aS5zdHJzdGFydCYmKFAoaSx0LmFkbGVyPj4+MTYpLFAoaSw2NTUzNSZ0LmFkbGVyKSksdC5hZGxlcj0xfWlmKDY5PT09aS5zdGF0dXMpaWYoaS5nemhlYWQuZXh0cmEpe2ZvcihuPWkucGVuZGluZztpLmd6aW5kZXg8KDY1NTM1JmkuZ3poZWFkLmV4dHJhLmxlbmd0aCkmJihpLnBlbmRpbmchPT1pLnBlbmRpbmdfYnVmX3NpemV8fChpLmd6aGVhZC5oY3JjJiZpLnBlbmRpbmc+biYmKHQuYWRsZXI9cCh0LmFkbGVyLGkucGVuZGluZ19idWYsaS5wZW5kaW5nLW4sbikpLEYodCksbj1pLnBlbmRpbmcsaS5wZW5kaW5nIT09aS5wZW5kaW5nX2J1Zl9zaXplKSk7KVUoaSwyNTUmaS5nemhlYWQuZXh0cmFbaS5nemluZGV4XSksaS5nemluZGV4Kys7aS5nemhlYWQuaGNyYyYmaS5wZW5kaW5nPm4mJih0LmFkbGVyPXAodC5hZGxlcixpLnBlbmRpbmdfYnVmLGkucGVuZGluZy1uLG4pKSxpLmd6aW5kZXg9PT1pLmd6aGVhZC5leHRyYS5sZW5ndGgmJihpLmd6aW5kZXg9MCxpLnN0YXR1cz03Myl9ZWxzZSBpLnN0YXR1cz03MztpZig3Mz09PWkuc3RhdHVzKWlmKGkuZ3poZWFkLm5hbWUpe249aS5wZW5kaW5nO2Rve2lmKGkucGVuZGluZz09PWkucGVuZGluZ19idWZfc2l6ZSYmKGkuZ3poZWFkLmhjcmMmJmkucGVuZGluZz5uJiYodC5hZGxlcj1wKHQuYWRsZXIsaS5wZW5kaW5nX2J1ZixpLnBlbmRpbmctbixuKSksRih0KSxuPWkucGVuZGluZyxpLnBlbmRpbmc9PT1pLnBlbmRpbmdfYnVmX3NpemUpKXtzPTE7YnJlYWt9cz1pLmd6aW5kZXg8aS5nemhlYWQubmFtZS5sZW5ndGg/MjU1JmkuZ3poZWFkLm5hbWUuY2hhckNvZGVBdChpLmd6aW5kZXgrKyk6MCxVKGkscyl9d2hpbGUoMCE9PXMpO2kuZ3poZWFkLmhjcmMmJmkucGVuZGluZz5uJiYodC5hZGxlcj1wKHQuYWRsZXIsaS5wZW5kaW5nX2J1ZixpLnBlbmRpbmctbixuKSksMD09PXMmJihpLmd6aW5kZXg9MCxpLnN0YXR1cz05MSl9ZWxzZSBpLnN0YXR1cz05MTtpZig5MT09PWkuc3RhdHVzKWlmKGkuZ3poZWFkLmNvbW1lbnQpe249aS5wZW5kaW5nO2Rve2lmKGkucGVuZGluZz09PWkucGVuZGluZ19idWZfc2l6ZSYmKGkuZ3poZWFkLmhjcmMmJmkucGVuZGluZz5uJiYodC5hZGxlcj1wKHQuYWRsZXIsaS5wZW5kaW5nX2J1ZixpLnBlbmRpbmctbixuKSksRih0KSxuPWkucGVuZGluZyxpLnBlbmRpbmc9PT1pLnBlbmRpbmdfYnVmX3NpemUpKXtzPTE7YnJlYWt9cz1pLmd6aW5kZXg8aS5nemhlYWQuY29tbWVudC5sZW5ndGg/MjU1JmkuZ3poZWFkLmNvbW1lbnQuY2hhckNvZGVBdChpLmd6aW5kZXgrKyk6MCxVKGkscyl9d2hpbGUoMCE9PXMpO2kuZ3poZWFkLmhjcmMmJmkucGVuZGluZz5uJiYodC5hZGxlcj1wKHQuYWRsZXIsaS5wZW5kaW5nX2J1ZixpLnBlbmRpbmctbixuKSksMD09PXMmJihpLnN0YXR1cz0xMDMpfWVsc2UgaS5zdGF0dXM9MTAzO2lmKDEwMz09PWkuc3RhdHVzJiYoaS5nemhlYWQuaGNyYz8oaS5wZW5kaW5nKzI+aS5wZW5kaW5nX2J1Zl9zaXplJiZGKHQpLGkucGVuZGluZysyPD1pLnBlbmRpbmdfYnVmX3NpemUmJihVKGksMjU1JnQuYWRsZXIpLFUoaSx0LmFkbGVyPj44JjI1NSksdC5hZGxlcj0wLGkuc3RhdHVzPUUpKTppLnN0YXR1cz1FKSwwIT09aS5wZW5kaW5nKXtpZihGKHQpLDA9PT10LmF2YWlsX291dClyZXR1cm4gaS5sYXN0X2ZsdXNoPS0xLG19ZWxzZSBpZigwPT09dC5hdmFpbF9pbiYmVChlKTw9VChyKSYmZSE9PWYpcmV0dXJuIFIodCwtNSk7aWYoNjY2PT09aS5zdGF0dXMmJjAhPT10LmF2YWlsX2luKXJldHVybiBSKHQsLTUpO2lmKDAhPT10LmF2YWlsX2lufHwwIT09aS5sb29rYWhlYWR8fGUhPT1sJiY2NjYhPT1pLnN0YXR1cyl7dmFyIG89Mj09PWkuc3RyYXRlZ3k/ZnVuY3Rpb24odCxlKXtmb3IodmFyIHI7Oyl7aWYoMD09PXQubG9va2FoZWFkJiYoaih0KSwwPT09dC5sb29rYWhlYWQpKXtpZihlPT09bClyZXR1cm4gQTticmVha31pZih0Lm1hdGNoX2xlbmd0aD0wLHI9dS5fdHJfdGFsbHkodCwwLHQud2luZG93W3Quc3Ryc3RhcnRdKSx0Lmxvb2thaGVhZC0tLHQuc3Ryc3RhcnQrKyxyJiYoTih0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCkpcmV0dXJuIEF9cmV0dXJuIHQuaW5zZXJ0PTAsZT09PWY/KE4odCwhMCksMD09PXQuc3RybS5hdmFpbF9vdXQ/TzpCKTp0Lmxhc3RfbGl0JiYoTih0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCk/QTpJfShpLGUpOjM9PT1pLnN0cmF0ZWd5P2Z1bmN0aW9uKHQsZSl7Zm9yKHZhciByLGksbixzLGE9dC53aW5kb3c7Oyl7aWYodC5sb29rYWhlYWQ8PVMpe2lmKGoodCksdC5sb29rYWhlYWQ8PVMmJmU9PT1sKXJldHVybiBBO2lmKDA9PT10Lmxvb2thaGVhZClicmVha31pZih0Lm1hdGNoX2xlbmd0aD0wLHQubG9va2FoZWFkPj14JiYwPHQuc3Ryc3RhcnQmJihpPWFbbj10LnN0cnN0YXJ0LTFdKT09PWFbKytuXSYmaT09PWFbKytuXSYmaT09PWFbKytuXSl7cz10LnN0cnN0YXJ0K1M7ZG97fXdoaWxlKGk9PT1hWysrbl0mJmk9PT1hWysrbl0mJmk9PT1hWysrbl0mJmk9PT1hWysrbl0mJmk9PT1hWysrbl0mJmk9PT1hWysrbl0mJmk9PT1hWysrbl0mJmk9PT1hWysrbl0mJm48cyk7dC5tYXRjaF9sZW5ndGg9Uy0ocy1uKSx0Lm1hdGNoX2xlbmd0aD50Lmxvb2thaGVhZCYmKHQubWF0Y2hfbGVuZ3RoPXQubG9va2FoZWFkKX1pZih0Lm1hdGNoX2xlbmd0aD49eD8ocj11Ll90cl90YWxseSh0LDEsdC5tYXRjaF9sZW5ndGgteCksdC5sb29rYWhlYWQtPXQubWF0Y2hfbGVuZ3RoLHQuc3Ryc3RhcnQrPXQubWF0Y2hfbGVuZ3RoLHQubWF0Y2hfbGVuZ3RoPTApOihyPXUuX3RyX3RhbGx5KHQsMCx0LndpbmRvd1t0LnN0cnN0YXJ0XSksdC5sb29rYWhlYWQtLSx0LnN0cnN0YXJ0KyspLHImJihOKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gQX1yZXR1cm4gdC5pbnNlcnQ9MCxlPT09Zj8oTih0LCEwKSwwPT09dC5zdHJtLmF2YWlsX291dD9POkIpOnQubGFzdF9saXQmJihOKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KT9BOkl9KGksZSk6aFtpLmxldmVsXS5mdW5jKGksZSk7aWYobyE9PU8mJm8hPT1CfHwoaS5zdGF0dXM9NjY2KSxvPT09QXx8bz09PU8pcmV0dXJuIDA9PT10LmF2YWlsX291dCYmKGkubGFzdF9mbHVzaD0tMSksbTtpZihvPT09SSYmKDE9PT1lP3UuX3RyX2FsaWduKGkpOjUhPT1lJiYodS5fdHJfc3RvcmVkX2Jsb2NrKGksMCwwLCExKSwzPT09ZSYmKEQoaS5oZWFkKSwwPT09aS5sb29rYWhlYWQmJihpLnN0cnN0YXJ0PTAsaS5ibG9ja19zdGFydD0wLGkuaW5zZXJ0PTApKSksRih0KSwwPT09dC5hdmFpbF9vdXQpKXJldHVybiBpLmxhc3RfZmx1c2g9LTEsbX1yZXR1cm4gZSE9PWY/bTppLndyYXA8PTA/MTooMj09PWkud3JhcD8oVShpLDI1NSZ0LmFkbGVyKSxVKGksdC5hZGxlcj4+OCYyNTUpLFUoaSx0LmFkbGVyPj4xNiYyNTUpLFUoaSx0LmFkbGVyPj4yNCYyNTUpLFUoaSwyNTUmdC50b3RhbF9pbiksVShpLHQudG90YWxfaW4+PjgmMjU1KSxVKGksdC50b3RhbF9pbj4+MTYmMjU1KSxVKGksdC50b3RhbF9pbj4+MjQmMjU1KSk6KFAoaSx0LmFkbGVyPj4+MTYpLFAoaSw2NTUzNSZ0LmFkbGVyKSksRih0KSwwPGkud3JhcCYmKGkud3JhcD0taS53cmFwKSwwIT09aS5wZW5kaW5nP206MSl9LHIuZGVmbGF0ZUVuZD1mdW5jdGlvbih0KXt2YXIgZTtyZXR1cm4gdCYmdC5zdGF0ZT8oZT10LnN0YXRlLnN0YXR1cykhPT1DJiY2OSE9PWUmJjczIT09ZSYmOTEhPT1lJiYxMDMhPT1lJiZlIT09RSYmNjY2IT09ZT9SKHQsXyk6KHQuc3RhdGU9bnVsbCxlPT09RT9SKHQsLTMpOm0pOl99LHIuZGVmbGF0ZVNldERpY3Rpb25hcnk9ZnVuY3Rpb24odCxlKXt2YXIgcixpLG4scyxhLG8saCx1LGw9ZS5sZW5ndGg7aWYoIXR8fCF0LnN0YXRlKXJldHVybiBfO2lmKDI9PT0ocz0ocj10LnN0YXRlKS53cmFwKXx8MT09PXMmJnIuc3RhdHVzIT09Q3x8ci5sb29rYWhlYWQpcmV0dXJuIF87Zm9yKDE9PT1zJiYodC5hZGxlcj1jKHQuYWRsZXIsZSxsLDApKSxyLndyYXA9MCxsPj1yLndfc2l6ZSYmKDA9PT1zJiYoRChyLmhlYWQpLHIuc3Ryc3RhcnQ9MCxyLmJsb2NrX3N0YXJ0PTAsci5pbnNlcnQ9MCksdT1uZXcgZC5CdWY4KHIud19zaXplKSxkLmFycmF5U2V0KHUsZSxsLXIud19zaXplLHIud19zaXplLDApLGU9dSxsPXIud19zaXplKSxhPXQuYXZhaWxfaW4sbz10Lm5leHRfaW4saD10LmlucHV0LHQuYXZhaWxfaW49bCx0Lm5leHRfaW49MCx0LmlucHV0PWUsaihyKTtyLmxvb2thaGVhZD49eDspe2ZvcihpPXIuc3Ryc3RhcnQsbj1yLmxvb2thaGVhZC0oeC0xKTtyLmluc19oPShyLmluc19oPDxyLmhhc2hfc2hpZnReci53aW5kb3dbaSt4LTFdKSZyLmhhc2hfbWFzayxyLnByZXZbaSZyLndfbWFza109ci5oZWFkW3IuaW5zX2hdLHIuaGVhZFtyLmluc19oXT1pLGkrKywtLW47KTtyLnN0cnN0YXJ0PWksci5sb29rYWhlYWQ9eC0xLGoocil9cmV0dXJuIHIuc3Ryc3RhcnQrPXIubG9va2FoZWFkLHIuYmxvY2tfc3RhcnQ9ci5zdHJzdGFydCxyLmluc2VydD1yLmxvb2thaGVhZCxyLmxvb2thaGVhZD0wLHIubWF0Y2hfbGVuZ3RoPXIucHJldl9sZW5ndGg9eC0xLHIubWF0Y2hfYXZhaWxhYmxlPTAsdC5uZXh0X2luPW8sdC5pbnB1dD1oLHQuYXZhaWxfaW49YSxyLndyYXA9cyxtfSxyLmRlZmxhdGVJbmZvPVwicGFrbyBkZWZsYXRlIChmcm9tIE5vZGVjYSBwcm9qZWN0KVwifSx7XCIuLi91dGlscy9jb21tb25cIjo0MSxcIi4vYWRsZXIzMlwiOjQzLFwiLi9jcmMzMlwiOjQ1LFwiLi9tZXNzYWdlc1wiOjUxLFwiLi90cmVlc1wiOjUyfV0sNDc6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtlLmV4cG9ydHM9ZnVuY3Rpb24oKXt0aGlzLnRleHQ9MCx0aGlzLnRpbWU9MCx0aGlzLnhmbGFncz0wLHRoaXMub3M9MCx0aGlzLmV4dHJhPW51bGwsdGhpcy5leHRyYV9sZW49MCx0aGlzLm5hbWU9XCJcIix0aGlzLmNvbW1lbnQ9XCJcIix0aGlzLmhjcmM9MCx0aGlzLmRvbmU9ITF9fSx7fV0sNDg6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtlLmV4cG9ydHM9ZnVuY3Rpb24odCxlKXt2YXIgcixpLG4scyxhLG8saCx1LGwsZixkLGMscCxtLF8sZyxiLHYseSx3LGsseCxTLHosQztyPXQuc3RhdGUsaT10Lm5leHRfaW4sej10LmlucHV0LG49aSsodC5hdmFpbF9pbi01KSxzPXQubmV4dF9vdXQsQz10Lm91dHB1dCxhPXMtKGUtdC5hdmFpbF9vdXQpLG89cysodC5hdmFpbF9vdXQtMjU3KSxoPXIuZG1heCx1PXIud3NpemUsbD1yLndoYXZlLGY9ci53bmV4dCxkPXIud2luZG93LGM9ci5ob2xkLHA9ci5iaXRzLG09ci5sZW5jb2RlLF89ci5kaXN0Y29kZSxnPSgxPDxyLmxlbmJpdHMpLTEsYj0oMTw8ci5kaXN0Yml0cyktMTt0OmRve3A8MTUmJihjKz16W2krK108PHAscCs9OCxjKz16W2krK108PHAscCs9OCksdj1tW2MmZ107ZTpmb3IoOzspe2lmKGM+Pj49eT12Pj4+MjQscC09eSwwPT09KHk9dj4+PjE2JjI1NSkpQ1tzKytdPTY1NTM1JnY7ZWxzZXtpZighKDE2JnkpKXtpZigwPT0oNjQmeSkpe3Y9bVsoNjU1MzUmdikrKGMmKDE8PHkpLTEpXTtjb250aW51ZSBlfWlmKDMyJnkpe3IubW9kZT0xMjticmVhayB0fXQubXNnPVwiaW52YWxpZCBsaXRlcmFsL2xlbmd0aCBjb2RlXCIsci5tb2RlPTMwO2JyZWFrIHR9dz02NTUzNSZ2LCh5Jj0xNSkmJihwPHkmJihjKz16W2krK108PHAscCs9OCksdys9YyYoMTw8eSktMSxjPj4+PXkscC09eSkscDwxNSYmKGMrPXpbaSsrXTw8cCxwKz04LGMrPXpbaSsrXTw8cCxwKz04KSx2PV9bYyZiXTtyOmZvcig7Oyl7aWYoYz4+Pj15PXY+Pj4yNCxwLT15LCEoMTYmKHk9dj4+PjE2JjI1NSkpKXtpZigwPT0oNjQmeSkpe3Y9X1soNjU1MzUmdikrKGMmKDE8PHkpLTEpXTtjb250aW51ZSByfXQubXNnPVwiaW52YWxpZCBkaXN0YW5jZSBjb2RlXCIsci5tb2RlPTMwO2JyZWFrIHR9aWYoaz02NTUzNSZ2LHA8KHkmPTE1KSYmKGMrPXpbaSsrXTw8cCwocCs9OCk8eSYmKGMrPXpbaSsrXTw8cCxwKz04KSksaDwoays9YyYoMTw8eSktMSkpe3QubXNnPVwiaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2tcIixyLm1vZGU9MzA7YnJlYWsgdH1pZihjPj4+PXkscC09eSwoeT1zLWEpPGspe2lmKGw8KHk9ay15KSYmci5zYW5lKXt0Lm1zZz1cImludmFsaWQgZGlzdGFuY2UgdG9vIGZhciBiYWNrXCIsci5tb2RlPTMwO2JyZWFrIHR9aWYoUz1kLCh4PTApPT09Zil7aWYoeCs9dS15LHk8dyl7Zm9yKHctPXk7Q1tzKytdPWRbeCsrXSwtLXk7KTt4PXMtayxTPUN9fWVsc2UgaWYoZjx5KXtpZih4Kz11K2YteSwoeS09Zik8dyl7Zm9yKHctPXk7Q1tzKytdPWRbeCsrXSwtLXk7KTtpZih4PTAsZjx3KXtmb3Iody09eT1mO0NbcysrXT1kW3grK10sLS15Oyk7eD1zLWssUz1DfX19ZWxzZSBpZih4Kz1mLXkseTx3KXtmb3Iody09eTtDW3MrK109ZFt4KytdLC0teTspO3g9cy1rLFM9Q31mb3IoOzI8dzspQ1tzKytdPVNbeCsrXSxDW3MrK109U1t4KytdLENbcysrXT1TW3grK10sdy09Mzt3JiYoQ1tzKytdPVNbeCsrXSwxPHcmJihDW3MrK109U1t4KytdKSl9ZWxzZXtmb3IoeD1zLWs7Q1tzKytdPUNbeCsrXSxDW3MrK109Q1t4KytdLENbcysrXT1DW3grK10sMjwody09Myk7KTt3JiYoQ1tzKytdPUNbeCsrXSwxPHcmJihDW3MrK109Q1t4KytdKSl9YnJlYWt9fWJyZWFrfX13aGlsZShpPG4mJnM8byk7aS09dz1wPj4zLGMmPSgxPDwocC09dzw8MykpLTEsdC5uZXh0X2luPWksdC5uZXh0X291dD1zLHQuYXZhaWxfaW49aTxuP24taSs1OjUtKGktbiksdC5hdmFpbF9vdXQ9czxvP28tcysyNTc6MjU3LShzLW8pLHIuaG9sZD1jLHIuYml0cz1wfX0se31dLDQ5OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIEk9dChcIi4uL3V0aWxzL2NvbW1vblwiKSxPPXQoXCIuL2FkbGVyMzJcIiksQj10KFwiLi9jcmMzMlwiKSxSPXQoXCIuL2luZmZhc3RcIiksVD10KFwiLi9pbmZ0cmVlc1wiKSxEPTEsRj0yLE49MCxVPS0yLFA9MSxpPTg1MixuPTU5MjtmdW5jdGlvbiBMKHQpe3JldHVybih0Pj4+MjQmMjU1KSsodD4+PjgmNjUyODApKygoNjUyODAmdCk8PDgpKygoMjU1JnQpPDwyNCl9ZnVuY3Rpb24gcygpe3RoaXMubW9kZT0wLHRoaXMubGFzdD0hMSx0aGlzLndyYXA9MCx0aGlzLmhhdmVkaWN0PSExLHRoaXMuZmxhZ3M9MCx0aGlzLmRtYXg9MCx0aGlzLmNoZWNrPTAsdGhpcy50b3RhbD0wLHRoaXMuaGVhZD1udWxsLHRoaXMud2JpdHM9MCx0aGlzLndzaXplPTAsdGhpcy53aGF2ZT0wLHRoaXMud25leHQ9MCx0aGlzLndpbmRvdz1udWxsLHRoaXMuaG9sZD0wLHRoaXMuYml0cz0wLHRoaXMubGVuZ3RoPTAsdGhpcy5vZmZzZXQ9MCx0aGlzLmV4dHJhPTAsdGhpcy5sZW5jb2RlPW51bGwsdGhpcy5kaXN0Y29kZT1udWxsLHRoaXMubGVuYml0cz0wLHRoaXMuZGlzdGJpdHM9MCx0aGlzLm5jb2RlPTAsdGhpcy5ubGVuPTAsdGhpcy5uZGlzdD0wLHRoaXMuaGF2ZT0wLHRoaXMubmV4dD1udWxsLHRoaXMubGVucz1uZXcgSS5CdWYxNigzMjApLHRoaXMud29yaz1uZXcgSS5CdWYxNigyODgpLHRoaXMubGVuZHluPW51bGwsdGhpcy5kaXN0ZHluPW51bGwsdGhpcy5zYW5lPTAsdGhpcy5iYWNrPTAsdGhpcy53YXM9MH1mdW5jdGlvbiBhKHQpe3ZhciBlO3JldHVybiB0JiZ0LnN0YXRlPyhlPXQuc3RhdGUsdC50b3RhbF9pbj10LnRvdGFsX291dD1lLnRvdGFsPTAsdC5tc2c9XCJcIixlLndyYXAmJih0LmFkbGVyPTEmZS53cmFwKSxlLm1vZGU9UCxlLmxhc3Q9MCxlLmhhdmVkaWN0PTAsZS5kbWF4PTMyNzY4LGUuaGVhZD1udWxsLGUuaG9sZD0wLGUuYml0cz0wLGUubGVuY29kZT1lLmxlbmR5bj1uZXcgSS5CdWYzMihpKSxlLmRpc3Rjb2RlPWUuZGlzdGR5bj1uZXcgSS5CdWYzMihuKSxlLnNhbmU9MSxlLmJhY2s9LTEsTik6VX1mdW5jdGlvbiBvKHQpe3ZhciBlO3JldHVybiB0JiZ0LnN0YXRlPygoZT10LnN0YXRlKS53c2l6ZT0wLGUud2hhdmU9MCxlLnduZXh0PTAsYSh0KSk6VX1mdW5jdGlvbiBoKHQsZSl7dmFyIHIsaTtyZXR1cm4gdCYmdC5zdGF0ZT8oaT10LnN0YXRlLGU8MD8ocj0wLGU9LWUpOihyPTErKGU+PjQpLGU8NDgmJihlJj0xNSkpLGUmJihlPDh8fDE1PGUpP1U6KG51bGwhPT1pLndpbmRvdyYmaS53Yml0cyE9PWUmJihpLndpbmRvdz1udWxsKSxpLndyYXA9cixpLndiaXRzPWUsbyh0KSkpOlV9ZnVuY3Rpb24gdSh0LGUpe3ZhciByLGk7cmV0dXJuIHQ/KGk9bmV3IHMsKHQuc3RhdGU9aSkud2luZG93PW51bGwsKHI9aCh0LGUpKSE9PU4mJih0LnN0YXRlPW51bGwpLHIpOlV9dmFyIGwsZixkPSEwO2Z1bmN0aW9uIGoodCl7aWYoZCl7dmFyIGU7Zm9yKGw9bmV3IEkuQnVmMzIoNTEyKSxmPW5ldyBJLkJ1ZjMyKDMyKSxlPTA7ZTwxNDQ7KXQubGVuc1tlKytdPTg7Zm9yKDtlPDI1NjspdC5sZW5zW2UrK109OTtmb3IoO2U8MjgwOyl0LmxlbnNbZSsrXT03O2Zvcig7ZTwyODg7KXQubGVuc1tlKytdPTg7Zm9yKFQoRCx0LmxlbnMsMCwyODgsbCwwLHQud29yayx7Yml0czo5fSksZT0wO2U8MzI7KXQubGVuc1tlKytdPTU7VChGLHQubGVucywwLDMyLGYsMCx0Lndvcmsse2JpdHM6NX0pLGQ9ITF9dC5sZW5jb2RlPWwsdC5sZW5iaXRzPTksdC5kaXN0Y29kZT1mLHQuZGlzdGJpdHM9NX1mdW5jdGlvbiBaKHQsZSxyLGkpe3ZhciBuLHM9dC5zdGF0ZTtyZXR1cm4gbnVsbD09PXMud2luZG93JiYocy53c2l6ZT0xPDxzLndiaXRzLHMud25leHQ9MCxzLndoYXZlPTAscy53aW5kb3c9bmV3IEkuQnVmOChzLndzaXplKSksaT49cy53c2l6ZT8oSS5hcnJheVNldChzLndpbmRvdyxlLHItcy53c2l6ZSxzLndzaXplLDApLHMud25leHQ9MCxzLndoYXZlPXMud3NpemUpOihpPChuPXMud3NpemUtcy53bmV4dCkmJihuPWkpLEkuYXJyYXlTZXQocy53aW5kb3csZSxyLWksbixzLnduZXh0KSwoaS09bik/KEkuYXJyYXlTZXQocy53aW5kb3csZSxyLWksaSwwKSxzLnduZXh0PWkscy53aGF2ZT1zLndzaXplKToocy53bmV4dCs9bixzLnduZXh0PT09cy53c2l6ZSYmKHMud25leHQ9MCkscy53aGF2ZTxzLndzaXplJiYocy53aGF2ZSs9bikpKSwwfXIuaW5mbGF0ZVJlc2V0PW8sci5pbmZsYXRlUmVzZXQyPWgsci5pbmZsYXRlUmVzZXRLZWVwPWEsci5pbmZsYXRlSW5pdD1mdW5jdGlvbih0KXtyZXR1cm4gdSh0LDE1KX0sci5pbmZsYXRlSW5pdDI9dSxyLmluZmxhdGU9ZnVuY3Rpb24odCxlKXt2YXIgcixpLG4scyxhLG8saCx1LGwsZixkLGMscCxtLF8sZyxiLHYseSx3LGsseCxTLHosQz0wLEU9bmV3IEkuQnVmOCg0KSxBPVsxNiwxNywxOCwwLDgsNyw5LDYsMTAsNSwxMSw0LDEyLDMsMTMsMiwxNCwxLDE1XTtpZighdHx8IXQuc3RhdGV8fCF0Lm91dHB1dHx8IXQuaW5wdXQmJjAhPT10LmF2YWlsX2luKXJldHVybiBVOzEyPT09KHI9dC5zdGF0ZSkubW9kZSYmKHIubW9kZT0xMyksYT10Lm5leHRfb3V0LG49dC5vdXRwdXQsaD10LmF2YWlsX291dCxzPXQubmV4dF9pbixpPXQuaW5wdXQsbz10LmF2YWlsX2luLHU9ci5ob2xkLGw9ci5iaXRzLGY9byxkPWgseD1OO3Q6Zm9yKDs7KXN3aXRjaChyLm1vZGUpe2Nhc2UgUDppZigwPT09ci53cmFwKXtyLm1vZGU9MTM7YnJlYWt9Zm9yKDtsPDE2Oyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9aWYoMiZyLndyYXAmJjM1NjE1PT09dSl7RVtyLmNoZWNrPTBdPTI1NSZ1LEVbMV09dT4+PjgmMjU1LHIuY2hlY2s9QihyLmNoZWNrLEUsMiwwKSxsPXU9MCxyLm1vZGU9MjticmVha31pZihyLmZsYWdzPTAsci5oZWFkJiYoci5oZWFkLmRvbmU9ITEpLCEoMSZyLndyYXApfHwoKCgyNTUmdSk8PDgpKyh1Pj44KSklMzEpe3QubXNnPVwiaW5jb3JyZWN0IGhlYWRlciBjaGVja1wiLHIubW9kZT0zMDticmVha31pZig4IT0oMTUmdSkpe3QubXNnPVwidW5rbm93biBjb21wcmVzc2lvbiBtZXRob2RcIixyLm1vZGU9MzA7YnJlYWt9aWYobC09NCxrPTgrKDE1Jih1Pj4+PTQpKSwwPT09ci53Yml0cylyLndiaXRzPWs7ZWxzZSBpZihrPnIud2JpdHMpe3QubXNnPVwiaW52YWxpZCB3aW5kb3cgc2l6ZVwiLHIubW9kZT0zMDticmVha31yLmRtYXg9MTw8ayx0LmFkbGVyPXIuY2hlY2s9MSxyLm1vZGU9NTEyJnU/MTA6MTIsbD11PTA7YnJlYWs7Y2FzZSAyOmZvcig7bDwxNjspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWlmKHIuZmxhZ3M9dSw4IT0oMjU1JnIuZmxhZ3MpKXt0Lm1zZz1cInVua25vd24gY29tcHJlc3Npb24gbWV0aG9kXCIsci5tb2RlPTMwO2JyZWFrfWlmKDU3MzQ0JnIuZmxhZ3Mpe3QubXNnPVwidW5rbm93biBoZWFkZXIgZmxhZ3Mgc2V0XCIsci5tb2RlPTMwO2JyZWFrfXIuaGVhZCYmKHIuaGVhZC50ZXh0PXU+PjgmMSksNTEyJnIuZmxhZ3MmJihFWzBdPTI1NSZ1LEVbMV09dT4+PjgmMjU1LHIuY2hlY2s9QihyLmNoZWNrLEUsMiwwKSksbD11PTAsci5tb2RlPTM7Y2FzZSAzOmZvcig7bDwzMjspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fXIuaGVhZCYmKHIuaGVhZC50aW1lPXUpLDUxMiZyLmZsYWdzJiYoRVswXT0yNTUmdSxFWzFdPXU+Pj44JjI1NSxFWzJdPXU+Pj4xNiYyNTUsRVszXT11Pj4+MjQmMjU1LHIuY2hlY2s9QihyLmNoZWNrLEUsNCwwKSksbD11PTAsci5tb2RlPTQ7Y2FzZSA0OmZvcig7bDwxNjspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fXIuaGVhZCYmKHIuaGVhZC54ZmxhZ3M9MjU1JnUsci5oZWFkLm9zPXU+PjgpLDUxMiZyLmZsYWdzJiYoRVswXT0yNTUmdSxFWzFdPXU+Pj44JjI1NSxyLmNoZWNrPUIoci5jaGVjayxFLDIsMCkpLGw9dT0wLHIubW9kZT01O2Nhc2UgNTppZigxMDI0JnIuZmxhZ3Mpe2Zvcig7bDwxNjspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fXIubGVuZ3RoPXUsci5oZWFkJiYoci5oZWFkLmV4dHJhX2xlbj11KSw1MTImci5mbGFncyYmKEVbMF09MjU1JnUsRVsxXT11Pj4+OCYyNTUsci5jaGVjaz1CKHIuY2hlY2ssRSwyLDApKSxsPXU9MH1lbHNlIHIuaGVhZCYmKHIuaGVhZC5leHRyYT1udWxsKTtyLm1vZGU9NjtjYXNlIDY6aWYoMTAyNCZyLmZsYWdzJiYobzwoYz1yLmxlbmd0aCkmJihjPW8pLGMmJihyLmhlYWQmJihrPXIuaGVhZC5leHRyYV9sZW4tci5sZW5ndGgsci5oZWFkLmV4dHJhfHwoci5oZWFkLmV4dHJhPW5ldyBBcnJheShyLmhlYWQuZXh0cmFfbGVuKSksSS5hcnJheVNldChyLmhlYWQuZXh0cmEsaSxzLGMsaykpLDUxMiZyLmZsYWdzJiYoci5jaGVjaz1CKHIuY2hlY2ssaSxjLHMpKSxvLT1jLHMrPWMsci5sZW5ndGgtPWMpLHIubGVuZ3RoKSlicmVhayB0O3IubGVuZ3RoPTAsci5tb2RlPTc7Y2FzZSA3OmlmKDIwNDgmci5mbGFncyl7aWYoMD09PW8pYnJlYWsgdDtmb3IoYz0wO2s9aVtzK2MrK10sci5oZWFkJiZrJiZyLmxlbmd0aDw2NTUzNiYmKHIuaGVhZC5uYW1lKz1TdHJpbmcuZnJvbUNoYXJDb2RlKGspKSxrJiZjPG87KTtpZig1MTImci5mbGFncyYmKHIuY2hlY2s9QihyLmNoZWNrLGksYyxzKSksby09YyxzKz1jLGspYnJlYWsgdH1lbHNlIHIuaGVhZCYmKHIuaGVhZC5uYW1lPW51bGwpO3IubGVuZ3RoPTAsci5tb2RlPTg7Y2FzZSA4OmlmKDQwOTYmci5mbGFncyl7aWYoMD09PW8pYnJlYWsgdDtmb3IoYz0wO2s9aVtzK2MrK10sci5oZWFkJiZrJiZyLmxlbmd0aDw2NTUzNiYmKHIuaGVhZC5jb21tZW50Kz1TdHJpbmcuZnJvbUNoYXJDb2RlKGspKSxrJiZjPG87KTtpZig1MTImci5mbGFncyYmKHIuY2hlY2s9QihyLmNoZWNrLGksYyxzKSksby09YyxzKz1jLGspYnJlYWsgdH1lbHNlIHIuaGVhZCYmKHIuaGVhZC5jb21tZW50PW51bGwpO3IubW9kZT05O2Nhc2UgOTppZig1MTImci5mbGFncyl7Zm9yKDtsPDE2Oyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9aWYodSE9PSg2NTUzNSZyLmNoZWNrKSl7dC5tc2c9XCJoZWFkZXIgY3JjIG1pc21hdGNoXCIsci5tb2RlPTMwO2JyZWFrfWw9dT0wfXIuaGVhZCYmKHIuaGVhZC5oY3JjPXIuZmxhZ3M+PjkmMSxyLmhlYWQuZG9uZT0hMCksdC5hZGxlcj1yLmNoZWNrPTAsci5tb2RlPTEyO2JyZWFrO2Nhc2UgMTA6Zm9yKDtsPDMyOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9dC5hZGxlcj1yLmNoZWNrPUwodSksbD11PTAsci5tb2RlPTExO2Nhc2UgMTE6aWYoMD09PXIuaGF2ZWRpY3QpcmV0dXJuIHQubmV4dF9vdXQ9YSx0LmF2YWlsX291dD1oLHQubmV4dF9pbj1zLHQuYXZhaWxfaW49byxyLmhvbGQ9dSxyLmJpdHM9bCwyO3QuYWRsZXI9ci5jaGVjaz0xLHIubW9kZT0xMjtjYXNlIDEyOmlmKDU9PT1lfHw2PT09ZSlicmVhayB0O2Nhc2UgMTM6aWYoci5sYXN0KXt1Pj4+PTcmbCxsLT03Jmwsci5tb2RlPTI3O2JyZWFrfWZvcig7bDwzOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9c3dpdGNoKHIubGFzdD0xJnUsbC09MSwzJih1Pj4+PTEpKXtjYXNlIDA6ci5tb2RlPTE0O2JyZWFrO2Nhc2UgMTppZihqKHIpLHIubW9kZT0yMCw2IT09ZSlicmVhazt1Pj4+PTIsbC09MjticmVhayB0O2Nhc2UgMjpyLm1vZGU9MTc7YnJlYWs7Y2FzZSAzOnQubXNnPVwiaW52YWxpZCBibG9jayB0eXBlXCIsci5tb2RlPTMwfXU+Pj49MixsLT0yO2JyZWFrO2Nhc2UgMTQ6Zm9yKHU+Pj49NyZsLGwtPTcmbDtsPDMyOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9aWYoKDY1NTM1JnUpIT0odT4+PjE2XjY1NTM1KSl7dC5tc2c9XCJpbnZhbGlkIHN0b3JlZCBibG9jayBsZW5ndGhzXCIsci5tb2RlPTMwO2JyZWFrfWlmKHIubGVuZ3RoPTY1NTM1JnUsbD11PTAsci5tb2RlPTE1LDY9PT1lKWJyZWFrIHQ7Y2FzZSAxNTpyLm1vZGU9MTY7Y2FzZSAxNjppZihjPXIubGVuZ3RoKXtpZihvPGMmJihjPW8pLGg8YyYmKGM9aCksMD09PWMpYnJlYWsgdDtJLmFycmF5U2V0KG4saSxzLGMsYSksby09YyxzKz1jLGgtPWMsYSs9YyxyLmxlbmd0aC09YzticmVha31yLm1vZGU9MTI7YnJlYWs7Y2FzZSAxNzpmb3IoO2w8MTQ7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1pZihyLm5sZW49MjU3KygzMSZ1KSx1Pj4+PTUsbC09NSxyLm5kaXN0PTErKDMxJnUpLHU+Pj49NSxsLT01LHIubmNvZGU9NCsoMTUmdSksdT4+Pj00LGwtPTQsMjg2PHIubmxlbnx8MzA8ci5uZGlzdCl7dC5tc2c9XCJ0b28gbWFueSBsZW5ndGggb3IgZGlzdGFuY2Ugc3ltYm9sc1wiLHIubW9kZT0zMDticmVha31yLmhhdmU9MCxyLm1vZGU9MTg7Y2FzZSAxODpmb3IoO3IuaGF2ZTxyLm5jb2RlOyl7Zm9yKDtsPDM7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1yLmxlbnNbQVtyLmhhdmUrK11dPTcmdSx1Pj4+PTMsbC09M31mb3IoO3IuaGF2ZTwxOTspci5sZW5zW0Fbci5oYXZlKytdXT0wO2lmKHIubGVuY29kZT1yLmxlbmR5bixyLmxlbmJpdHM9NyxTPXtiaXRzOnIubGVuYml0c30seD1UKDAsci5sZW5zLDAsMTksci5sZW5jb2RlLDAsci53b3JrLFMpLHIubGVuYml0cz1TLmJpdHMseCl7dC5tc2c9XCJpbnZhbGlkIGNvZGUgbGVuZ3RocyBzZXRcIixyLm1vZGU9MzA7YnJlYWt9ci5oYXZlPTAsci5tb2RlPTE5O2Nhc2UgMTk6Zm9yKDtyLmhhdmU8ci5ubGVuK3IubmRpc3Q7KXtmb3IoO2c9KEM9ci5sZW5jb2RlW3UmKDE8PHIubGVuYml0cyktMV0pPj4+MTYmMjU1LGI9NjU1MzUmQywhKChfPUM+Pj4yNCk8PWwpOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9aWYoYjwxNil1Pj4+PV8sbC09XyxyLmxlbnNbci5oYXZlKytdPWI7ZWxzZXtpZigxNj09PWIpe2Zvcih6PV8rMjtsPHo7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1pZih1Pj4+PV8sbC09XywwPT09ci5oYXZlKXt0Lm1zZz1cImludmFsaWQgYml0IGxlbmd0aCByZXBlYXRcIixyLm1vZGU9MzA7YnJlYWt9az1yLmxlbnNbci5oYXZlLTFdLGM9MysoMyZ1KSx1Pj4+PTIsbC09Mn1lbHNlIGlmKDE3PT09Yil7Zm9yKHo9XyszO2w8ejspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWwtPV8saz0wLGM9MysoNyYodT4+Pj1fKSksdT4+Pj0zLGwtPTN9ZWxzZXtmb3Ioej1fKzc7bDx6Oyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9bC09XyxrPTAsYz0xMSsoMTI3Jih1Pj4+PV8pKSx1Pj4+PTcsbC09N31pZihyLmhhdmUrYz5yLm5sZW4rci5uZGlzdCl7dC5tc2c9XCJpbnZhbGlkIGJpdCBsZW5ndGggcmVwZWF0XCIsci5tb2RlPTMwO2JyZWFrfWZvcig7Yy0tOylyLmxlbnNbci5oYXZlKytdPWt9fWlmKDMwPT09ci5tb2RlKWJyZWFrO2lmKDA9PT1yLmxlbnNbMjU2XSl7dC5tc2c9XCJpbnZhbGlkIGNvZGUgLS0gbWlzc2luZyBlbmQtb2YtYmxvY2tcIixyLm1vZGU9MzA7YnJlYWt9aWYoci5sZW5iaXRzPTksUz17Yml0czpyLmxlbmJpdHN9LHg9VChELHIubGVucywwLHIubmxlbixyLmxlbmNvZGUsMCxyLndvcmssUyksci5sZW5iaXRzPVMuYml0cyx4KXt0Lm1zZz1cImludmFsaWQgbGl0ZXJhbC9sZW5ndGhzIHNldFwiLHIubW9kZT0zMDticmVha31pZihyLmRpc3RiaXRzPTYsci5kaXN0Y29kZT1yLmRpc3RkeW4sUz17Yml0czpyLmRpc3RiaXRzfSx4PVQoRixyLmxlbnMsci5ubGVuLHIubmRpc3Qsci5kaXN0Y29kZSwwLHIud29yayxTKSxyLmRpc3RiaXRzPVMuYml0cyx4KXt0Lm1zZz1cImludmFsaWQgZGlzdGFuY2VzIHNldFwiLHIubW9kZT0zMDticmVha31pZihyLm1vZGU9MjAsNj09PWUpYnJlYWsgdDtjYXNlIDIwOnIubW9kZT0yMTtjYXNlIDIxOmlmKDY8PW8mJjI1ODw9aCl7dC5uZXh0X291dD1hLHQuYXZhaWxfb3V0PWgsdC5uZXh0X2luPXMsdC5hdmFpbF9pbj1vLHIuaG9sZD11LHIuYml0cz1sLFIodCxkKSxhPXQubmV4dF9vdXQsbj10Lm91dHB1dCxoPXQuYXZhaWxfb3V0LHM9dC5uZXh0X2luLGk9dC5pbnB1dCxvPXQuYXZhaWxfaW4sdT1yLmhvbGQsbD1yLmJpdHMsMTI9PT1yLm1vZGUmJihyLmJhY2s9LTEpO2JyZWFrfWZvcihyLmJhY2s9MDtnPShDPXIubGVuY29kZVt1JigxPDxyLmxlbmJpdHMpLTFdKT4+PjE2JjI1NSxiPTY1NTM1JkMsISgoXz1DPj4+MjQpPD1sKTspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWlmKGcmJjA9PSgyNDAmZykpe2Zvcih2PV8seT1nLHc9YjtnPShDPXIubGVuY29kZVt3KygodSYoMTw8dit5KS0xKT4+dildKT4+PjE2JjI1NSxiPTY1NTM1JkMsISh2KyhfPUM+Pj4yNCk8PWwpOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9dT4+Pj12LGwtPXYsci5iYWNrKz12fWlmKHU+Pj49XyxsLT1fLHIuYmFjays9XyxyLmxlbmd0aD1iLDA9PT1nKXtyLm1vZGU9MjY7YnJlYWt9aWYoMzImZyl7ci5iYWNrPS0xLHIubW9kZT0xMjticmVha31pZig2NCZnKXt0Lm1zZz1cImludmFsaWQgbGl0ZXJhbC9sZW5ndGggY29kZVwiLHIubW9kZT0zMDticmVha31yLmV4dHJhPTE1Jmcsci5tb2RlPTIyO2Nhc2UgMjI6aWYoci5leHRyYSl7Zm9yKHo9ci5leHRyYTtsPHo7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1yLmxlbmd0aCs9dSYoMTw8ci5leHRyYSktMSx1Pj4+PXIuZXh0cmEsbC09ci5leHRyYSxyLmJhY2srPXIuZXh0cmF9ci53YXM9ci5sZW5ndGgsci5tb2RlPTIzO2Nhc2UgMjM6Zm9yKDtnPShDPXIuZGlzdGNvZGVbdSYoMTw8ci5kaXN0Yml0cyktMV0pPj4+MTYmMjU1LGI9NjU1MzUmQywhKChfPUM+Pj4yNCk8PWwpOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9aWYoMD09KDI0MCZnKSl7Zm9yKHY9Xyx5PWcsdz1iO2c9KEM9ci5kaXN0Y29kZVt3KygodSYoMTw8dit5KS0xKT4+dildKT4+PjE2JjI1NSxiPTY1NTM1JkMsISh2KyhfPUM+Pj4yNCk8PWwpOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9dT4+Pj12LGwtPXYsci5iYWNrKz12fWlmKHU+Pj49XyxsLT1fLHIuYmFjays9Xyw2NCZnKXt0Lm1zZz1cImludmFsaWQgZGlzdGFuY2UgY29kZVwiLHIubW9kZT0zMDticmVha31yLm9mZnNldD1iLHIuZXh0cmE9MTUmZyxyLm1vZGU9MjQ7Y2FzZSAyNDppZihyLmV4dHJhKXtmb3Ioej1yLmV4dHJhO2w8ejspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fXIub2Zmc2V0Kz11JigxPDxyLmV4dHJhKS0xLHU+Pj49ci5leHRyYSxsLT1yLmV4dHJhLHIuYmFjays9ci5leHRyYX1pZihyLm9mZnNldD5yLmRtYXgpe3QubXNnPVwiaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2tcIixyLm1vZGU9MzA7YnJlYWt9ci5tb2RlPTI1O2Nhc2UgMjU6aWYoMD09PWgpYnJlYWsgdDtpZihjPWQtaCxyLm9mZnNldD5jKXtpZigoYz1yLm9mZnNldC1jKT5yLndoYXZlJiZyLnNhbmUpe3QubXNnPVwiaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2tcIixyLm1vZGU9MzA7YnJlYWt9cD1jPnIud25leHQ/KGMtPXIud25leHQsci53c2l6ZS1jKTpyLnduZXh0LWMsYz5yLmxlbmd0aCYmKGM9ci5sZW5ndGgpLG09ci53aW5kb3d9ZWxzZSBtPW4scD1hLXIub2Zmc2V0LGM9ci5sZW5ndGg7Zm9yKGg8YyYmKGM9aCksaC09YyxyLmxlbmd0aC09YztuW2ErK109bVtwKytdLC0tYzspOzA9PT1yLmxlbmd0aCYmKHIubW9kZT0yMSk7YnJlYWs7Y2FzZSAyNjppZigwPT09aClicmVhayB0O25bYSsrXT1yLmxlbmd0aCxoLS0sci5tb2RlPTIxO2JyZWFrO2Nhc2UgMjc6aWYoci53cmFwKXtmb3IoO2w8MzI7KXtpZigwPT09bylicmVhayB0O28tLSx1fD1pW3MrK108PGwsbCs9OH1pZihkLT1oLHQudG90YWxfb3V0Kz1kLHIudG90YWwrPWQsZCYmKHQuYWRsZXI9ci5jaGVjaz1yLmZsYWdzP0Ioci5jaGVjayxuLGQsYS1kKTpPKHIuY2hlY2ssbixkLGEtZCkpLGQ9aCwoci5mbGFncz91OkwodSkpIT09ci5jaGVjayl7dC5tc2c9XCJpbmNvcnJlY3QgZGF0YSBjaGVja1wiLHIubW9kZT0zMDticmVha31sPXU9MH1yLm1vZGU9Mjg7Y2FzZSAyODppZihyLndyYXAmJnIuZmxhZ3Mpe2Zvcig7bDwzMjspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWlmKHUhPT0oNDI5NDk2NzI5NSZyLnRvdGFsKSl7dC5tc2c9XCJpbmNvcnJlY3QgbGVuZ3RoIGNoZWNrXCIsci5tb2RlPTMwO2JyZWFrfWw9dT0wfXIubW9kZT0yOTtjYXNlIDI5Ong9MTticmVhayB0O2Nhc2UgMzA6eD0tMzticmVhayB0O2Nhc2UgMzE6cmV0dXJuLTQ7Y2FzZSAzMjpkZWZhdWx0OnJldHVybiBVfXJldHVybiB0Lm5leHRfb3V0PWEsdC5hdmFpbF9vdXQ9aCx0Lm5leHRfaW49cyx0LmF2YWlsX2luPW8sci5ob2xkPXUsci5iaXRzPWwsKHIud3NpemV8fGQhPT10LmF2YWlsX291dCYmci5tb2RlPDMwJiYoci5tb2RlPDI3fHw0IT09ZSkpJiZaKHQsdC5vdXRwdXQsdC5uZXh0X291dCxkLXQuYXZhaWxfb3V0KT8oci5tb2RlPTMxLC00KTooZi09dC5hdmFpbF9pbixkLT10LmF2YWlsX291dCx0LnRvdGFsX2luKz1mLHQudG90YWxfb3V0Kz1kLHIudG90YWwrPWQsci53cmFwJiZkJiYodC5hZGxlcj1yLmNoZWNrPXIuZmxhZ3M/QihyLmNoZWNrLG4sZCx0Lm5leHRfb3V0LWQpOk8oci5jaGVjayxuLGQsdC5uZXh0X291dC1kKSksdC5kYXRhX3R5cGU9ci5iaXRzKyhyLmxhc3Q/NjQ6MCkrKDEyPT09ci5tb2RlPzEyODowKSsoMjA9PT1yLm1vZGV8fDE1PT09ci5tb2RlPzI1NjowKSwoMD09ZiYmMD09PWR8fDQ9PT1lKSYmeD09PU4mJih4PS01KSx4KX0sci5pbmZsYXRlRW5kPWZ1bmN0aW9uKHQpe2lmKCF0fHwhdC5zdGF0ZSlyZXR1cm4gVTt2YXIgZT10LnN0YXRlO3JldHVybiBlLndpbmRvdyYmKGUud2luZG93PW51bGwpLHQuc3RhdGU9bnVsbCxOfSxyLmluZmxhdGVHZXRIZWFkZXI9ZnVuY3Rpb24odCxlKXt2YXIgcjtyZXR1cm4gdCYmdC5zdGF0ZT8wPT0oMiYocj10LnN0YXRlKS53cmFwKT9VOigoci5oZWFkPWUpLmRvbmU9ITEsTik6VX0sci5pbmZsYXRlU2V0RGljdGlvbmFyeT1mdW5jdGlvbih0LGUpe3ZhciByLGk9ZS5sZW5ndGg7cmV0dXJuIHQmJnQuc3RhdGU/MCE9PShyPXQuc3RhdGUpLndyYXAmJjExIT09ci5tb2RlP1U6MTE9PT1yLm1vZGUmJk8oMSxlLGksMCkhPT1yLmNoZWNrPy0zOloodCxlLGksaSk/KHIubW9kZT0zMSwtNCk6KHIuaGF2ZWRpY3Q9MSxOKTpVfSxyLmluZmxhdGVJbmZvPVwicGFrbyBpbmZsYXRlIChmcm9tIE5vZGVjYSBwcm9qZWN0KVwifSx7XCIuLi91dGlscy9jb21tb25cIjo0MSxcIi4vYWRsZXIzMlwiOjQzLFwiLi9jcmMzMlwiOjQ1LFwiLi9pbmZmYXN0XCI6NDgsXCIuL2luZnRyZWVzXCI6NTB9XSw1MDpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBEPXQoXCIuLi91dGlscy9jb21tb25cIiksRj1bMyw0LDUsNiw3LDgsOSwxMCwxMSwxMywxNSwxNywxOSwyMywyNywzMSwzNSw0Myw1MSw1OSw2Nyw4Myw5OSwxMTUsMTMxLDE2MywxOTUsMjI3LDI1OCwwLDBdLE49WzE2LDE2LDE2LDE2LDE2LDE2LDE2LDE2LDE3LDE3LDE3LDE3LDE4LDE4LDE4LDE4LDE5LDE5LDE5LDE5LDIwLDIwLDIwLDIwLDIxLDIxLDIxLDIxLDE2LDcyLDc4XSxVPVsxLDIsMyw0LDUsNyw5LDEzLDE3LDI1LDMzLDQ5LDY1LDk3LDEyOSwxOTMsMjU3LDM4NSw1MTMsNzY5LDEwMjUsMTUzNywyMDQ5LDMwNzMsNDA5Nyw2MTQ1LDgxOTMsMTIyODksMTYzODUsMjQ1NzcsMCwwXSxQPVsxNiwxNiwxNiwxNiwxNywxNywxOCwxOCwxOSwxOSwyMCwyMCwyMSwyMSwyMiwyMiwyMywyMywyNCwyNCwyNSwyNSwyNiwyNiwyNywyNywyOCwyOCwyOSwyOSw2NCw2NF07ZS5leHBvcnRzPWZ1bmN0aW9uKHQsZSxyLGksbixzLGEsbyl7dmFyIGgsdSxsLGYsZCxjLHAsbSxfLGc9by5iaXRzLGI9MCx2PTAseT0wLHc9MCxrPTAseD0wLFM9MCx6PTAsQz0wLEU9MCxBPW51bGwsST0wLE89bmV3IEQuQnVmMTYoMTYpLEI9bmV3IEQuQnVmMTYoMTYpLFI9bnVsbCxUPTA7Zm9yKGI9MDtiPD0xNTtiKyspT1tiXT0wO2Zvcih2PTA7djxpO3YrKylPW2Vbcit2XV0rKztmb3Ioaz1nLHc9MTU7MTw9dyYmMD09PU9bd107dy0tKTtpZih3PGsmJihrPXcpLDA9PT13KXJldHVybiBuW3MrK109MjA5NzE1MjAsbltzKytdPTIwOTcxNTIwLG8uYml0cz0xLDA7Zm9yKHk9MTt5PHcmJjA9PT1PW3ldO3krKyk7Zm9yKGs8eSYmKGs9eSksYj16PTE7Yjw9MTU7YisrKWlmKHo8PD0xLCh6LT1PW2JdKTwwKXJldHVybi0xO2lmKDA8eiYmKDA9PT10fHwxIT09dykpcmV0dXJuLTE7Zm9yKEJbMV09MCxiPTE7YjwxNTtiKyspQltiKzFdPUJbYl0rT1tiXTtmb3Iodj0wO3Y8aTt2KyspMCE9PWVbcit2XSYmKGFbQltlW3Irdl1dKytdPXYpO2lmKGM9MD09PXQ/KEE9Uj1hLDE5KToxPT09dD8oQT1GLEktPTI1NyxSPU4sVC09MjU3LDI1Nik6KEE9VSxSPVAsLTEpLGI9eSxkPXMsUz12PUU9MCxsPS0xLGY9KEM9MTw8KHg9aykpLTEsMT09PXQmJjg1MjxDfHwyPT09dCYmNTkyPEMpcmV0dXJuIDE7Zm9yKDs7KXtmb3IocD1iLVMsXz1hW3ZdPGM/KG09MCxhW3ZdKTphW3ZdPmM/KG09UltUK2Fbdl1dLEFbSSthW3ZdXSk6KG09OTYsMCksaD0xPDxiLVMseT11PTE8PHg7bltkKyhFPj5TKSsodS09aCldPXA8PDI0fG08PDE2fF98MCwwIT09dTspO2ZvcihoPTE8PGItMTtFJmg7KWg+Pj0xO2lmKDAhPT1oPyhFJj1oLTEsRSs9aCk6RT0wLHYrKywwPT0tLU9bYl0pe2lmKGI9PT13KWJyZWFrO2I9ZVtyK2Fbdl1dfWlmKGs8YiYmKEUmZikhPT1sKXtmb3IoMD09PVMmJihTPWspLGQrPXksej0xPDwoeD1iLVMpO3grUzx3JiYhKCh6LT1PW3grU10pPD0wKTspeCsrLHo8PD0xO2lmKEMrPTE8PHgsMT09PXQmJjg1MjxDfHwyPT09dCYmNTkyPEMpcmV0dXJuIDE7bltsPUUmZl09azw8MjR8eDw8MTZ8ZC1zfDB9fXJldHVybiAwIT09RSYmKG5bZCtFXT1iLVM8PDI0fDY0PDwxNnwwKSxvLmJpdHM9aywwfX0se1wiLi4vdXRpbHMvY29tbW9uXCI6NDF9XSw1MTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2UuZXhwb3J0cz17MjpcIm5lZWQgZGljdGlvbmFyeVwiLDE6XCJzdHJlYW0gZW5kXCIsMDpcIlwiLFwiLTFcIjpcImZpbGUgZXJyb3JcIixcIi0yXCI6XCJzdHJlYW0gZXJyb3JcIixcIi0zXCI6XCJkYXRhIGVycm9yXCIsXCItNFwiOlwiaW5zdWZmaWNpZW50IG1lbW9yeVwiLFwiLTVcIjpcImJ1ZmZlciBlcnJvclwiLFwiLTZcIjpcImluY29tcGF0aWJsZSB2ZXJzaW9uXCJ9fSx7fV0sNTI6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbj10KFwiLi4vdXRpbHMvY29tbW9uXCIpLG89MCxoPTE7ZnVuY3Rpb24gaSh0KXtmb3IodmFyIGU9dC5sZW5ndGg7MDw9LS1lOyl0W2VdPTB9dmFyIHM9MCxhPTI5LHU9MjU2LGw9dSsxK2EsZj0zMCxkPTE5LF89MipsKzEsZz0xNSxjPTE2LHA9NyxtPTI1NixiPTE2LHY9MTcseT0xOCx3PVswLDAsMCwwLDAsMCwwLDAsMSwxLDEsMSwyLDIsMiwyLDMsMywzLDMsNCw0LDQsNCw1LDUsNSw1LDBdLGs9WzAsMCwwLDAsMSwxLDIsMiwzLDMsNCw0LDUsNSw2LDYsNyw3LDgsOCw5LDksMTAsMTAsMTEsMTEsMTIsMTIsMTMsMTNdLHg9WzAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMiwzLDddLFM9WzE2LDE3LDE4LDAsOCw3LDksNiwxMCw1LDExLDQsMTIsMywxMywyLDE0LDEsMTVdLHo9bmV3IEFycmF5KDIqKGwrMikpO2koeik7dmFyIEM9bmV3IEFycmF5KDIqZik7aShDKTt2YXIgRT1uZXcgQXJyYXkoNTEyKTtpKEUpO3ZhciBBPW5ldyBBcnJheSgyNTYpO2koQSk7dmFyIEk9bmV3IEFycmF5KGEpO2koSSk7dmFyIE8sQixSLFQ9bmV3IEFycmF5KGYpO2Z1bmN0aW9uIEQodCxlLHIsaSxuKXt0aGlzLnN0YXRpY190cmVlPXQsdGhpcy5leHRyYV9iaXRzPWUsdGhpcy5leHRyYV9iYXNlPXIsdGhpcy5lbGVtcz1pLHRoaXMubWF4X2xlbmd0aD1uLHRoaXMuaGFzX3N0cmVlPXQmJnQubGVuZ3RofWZ1bmN0aW9uIEYodCxlKXt0aGlzLmR5bl90cmVlPXQsdGhpcy5tYXhfY29kZT0wLHRoaXMuc3RhdF9kZXNjPWV9ZnVuY3Rpb24gTih0KXtyZXR1cm4gdDwyNTY/RVt0XTpFWzI1NisodD4+PjcpXX1mdW5jdGlvbiBVKHQsZSl7dC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmcrK109MjU1JmUsdC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmcrK109ZT4+PjgmMjU1fWZ1bmN0aW9uIFAodCxlLHIpe3QuYmlfdmFsaWQ+Yy1yPyh0LmJpX2J1Znw9ZTw8dC5iaV92YWxpZCY2NTUzNSxVKHQsdC5iaV9idWYpLHQuYmlfYnVmPWU+PmMtdC5iaV92YWxpZCx0LmJpX3ZhbGlkKz1yLWMpOih0LmJpX2J1Znw9ZTw8dC5iaV92YWxpZCY2NTUzNSx0LmJpX3ZhbGlkKz1yKX1mdW5jdGlvbiBMKHQsZSxyKXtQKHQsclsyKmVdLHJbMiplKzFdKX1mdW5jdGlvbiBqKHQsZSl7Zm9yKHZhciByPTA7cnw9MSZ0LHQ+Pj49MSxyPDw9MSwwPC0tZTspO3JldHVybiByPj4+MX1mdW5jdGlvbiBaKHQsZSxyKXt2YXIgaSxuLHM9bmV3IEFycmF5KGcrMSksYT0wO2ZvcihpPTE7aTw9ZztpKyspc1tpXT1hPWErcltpLTFdPDwxO2ZvcihuPTA7bjw9ZTtuKyspe3ZhciBvPXRbMipuKzFdOzAhPT1vJiYodFsyKm5dPWooc1tvXSsrLG8pKX19ZnVuY3Rpb24gVyh0KXt2YXIgZTtmb3IoZT0wO2U8bDtlKyspdC5keW5fbHRyZWVbMiplXT0wO2ZvcihlPTA7ZTxmO2UrKyl0LmR5bl9kdHJlZVsyKmVdPTA7Zm9yKGU9MDtlPGQ7ZSsrKXQuYmxfdHJlZVsyKmVdPTA7dC5keW5fbHRyZWVbMiptXT0xLHQub3B0X2xlbj10LnN0YXRpY19sZW49MCx0Lmxhc3RfbGl0PXQubWF0Y2hlcz0wfWZ1bmN0aW9uIE0odCl7ODx0LmJpX3ZhbGlkP1UodCx0LmJpX2J1Zik6MDx0LmJpX3ZhbGlkJiYodC5wZW5kaW5nX2J1Zlt0LnBlbmRpbmcrK109dC5iaV9idWYpLHQuYmlfYnVmPTAsdC5iaV92YWxpZD0wfWZ1bmN0aW9uIEgodCxlLHIsaSl7dmFyIG49MiplLHM9MipyO3JldHVybiB0W25dPHRbc118fHRbbl09PT10W3NdJiZpW2VdPD1pW3JdfWZ1bmN0aW9uIEcodCxlLHIpe2Zvcih2YXIgaT10LmhlYXBbcl0sbj1yPDwxO248PXQuaGVhcF9sZW4mJihuPHQuaGVhcF9sZW4mJkgoZSx0LmhlYXBbbisxXSx0LmhlYXBbbl0sdC5kZXB0aCkmJm4rKywhSChlLGksdC5oZWFwW25dLHQuZGVwdGgpKTspdC5oZWFwW3JdPXQuaGVhcFtuXSxyPW4sbjw8PTE7dC5oZWFwW3JdPWl9ZnVuY3Rpb24gSyh0LGUscil7dmFyIGksbixzLGEsbz0wO2lmKDAhPT10Lmxhc3RfbGl0KWZvcig7aT10LnBlbmRpbmdfYnVmW3QuZF9idWYrMipvXTw8OHx0LnBlbmRpbmdfYnVmW3QuZF9idWYrMipvKzFdLG49dC5wZW5kaW5nX2J1Zlt0LmxfYnVmK29dLG8rKywwPT09aT9MKHQsbixlKTooTCh0LChzPUFbbl0pK3UrMSxlKSwwIT09KGE9d1tzXSkmJlAodCxuLT1JW3NdLGEpLEwodCxzPU4oLS1pKSxyKSwwIT09KGE9a1tzXSkmJlAodCxpLT1UW3NdLGEpKSxvPHQubGFzdF9saXQ7KTtMKHQsbSxlKX1mdW5jdGlvbiBZKHQsZSl7dmFyIHIsaSxuLHM9ZS5keW5fdHJlZSxhPWUuc3RhdF9kZXNjLnN0YXRpY190cmVlLG89ZS5zdGF0X2Rlc2MuaGFzX3N0cmVlLGg9ZS5zdGF0X2Rlc2MuZWxlbXMsdT0tMTtmb3IodC5oZWFwX2xlbj0wLHQuaGVhcF9tYXg9XyxyPTA7cjxoO3IrKykwIT09c1syKnJdPyh0LmhlYXBbKyt0LmhlYXBfbGVuXT11PXIsdC5kZXB0aFtyXT0wKTpzWzIqcisxXT0wO2Zvcig7dC5oZWFwX2xlbjwyOylzWzIqKG49dC5oZWFwWysrdC5oZWFwX2xlbl09dTwyPysrdTowKV09MSx0LmRlcHRoW25dPTAsdC5vcHRfbGVuLS0sbyYmKHQuc3RhdGljX2xlbi09YVsyKm4rMV0pO2ZvcihlLm1heF9jb2RlPXUscj10LmhlYXBfbGVuPj4xOzE8PXI7ci0tKUcodCxzLHIpO2ZvcihuPWg7cj10LmhlYXBbMV0sdC5oZWFwWzFdPXQuaGVhcFt0LmhlYXBfbGVuLS1dLEcodCxzLDEpLGk9dC5oZWFwWzFdLHQuaGVhcFstLXQuaGVhcF9tYXhdPXIsdC5oZWFwWy0tdC5oZWFwX21heF09aSxzWzIqbl09c1syKnJdK3NbMippXSx0LmRlcHRoW25dPSh0LmRlcHRoW3JdPj10LmRlcHRoW2ldP3QuZGVwdGhbcl06dC5kZXB0aFtpXSkrMSxzWzIqcisxXT1zWzIqaSsxXT1uLHQuaGVhcFsxXT1uKyssRyh0LHMsMSksMjw9dC5oZWFwX2xlbjspO3QuaGVhcFstLXQuaGVhcF9tYXhdPXQuaGVhcFsxXSxmdW5jdGlvbih0LGUpe3ZhciByLGksbixzLGEsbyxoPWUuZHluX3RyZWUsdT1lLm1heF9jb2RlLGw9ZS5zdGF0X2Rlc2Muc3RhdGljX3RyZWUsZj1lLnN0YXRfZGVzYy5oYXNfc3RyZWUsZD1lLnN0YXRfZGVzYy5leHRyYV9iaXRzLGM9ZS5zdGF0X2Rlc2MuZXh0cmFfYmFzZSxwPWUuc3RhdF9kZXNjLm1heF9sZW5ndGgsbT0wO2ZvcihzPTA7czw9ZztzKyspdC5ibF9jb3VudFtzXT0wO2ZvcihoWzIqdC5oZWFwW3QuaGVhcF9tYXhdKzFdPTAscj10LmhlYXBfbWF4KzE7cjxfO3IrKylwPChzPWhbMipoWzIqKGk9dC5oZWFwW3JdKSsxXSsxXSsxKSYmKHM9cCxtKyspLGhbMippKzFdPXMsdTxpfHwodC5ibF9jb3VudFtzXSsrLGE9MCxjPD1pJiYoYT1kW2ktY10pLG89aFsyKmldLHQub3B0X2xlbis9byoocythKSxmJiYodC5zdGF0aWNfbGVuKz1vKihsWzIqaSsxXSthKSkpO2lmKDAhPT1tKXtkb3tmb3Iocz1wLTE7MD09PXQuYmxfY291bnRbc107KXMtLTt0LmJsX2NvdW50W3NdLS0sdC5ibF9jb3VudFtzKzFdKz0yLHQuYmxfY291bnRbcF0tLSxtLT0yfXdoaWxlKDA8bSk7Zm9yKHM9cDswIT09cztzLS0pZm9yKGk9dC5ibF9jb3VudFtzXTswIT09aTspdTwobj10LmhlYXBbLS1yXSl8fChoWzIqbisxXSE9PXMmJih0Lm9wdF9sZW4rPShzLWhbMipuKzFdKSpoWzIqbl0saFsyKm4rMV09cyksaS0tKX19KHQsZSksWihzLHUsdC5ibF9jb3VudCl9ZnVuY3Rpb24gWCh0LGUscil7dmFyIGksbixzPS0xLGE9ZVsxXSxvPTAsaD03LHU9NDtmb3IoMD09PWEmJihoPTEzOCx1PTMpLGVbMioocisxKSsxXT02NTUzNSxpPTA7aTw9cjtpKyspbj1hLGE9ZVsyKihpKzEpKzFdLCsrbzxoJiZuPT09YXx8KG88dT90LmJsX3RyZWVbMipuXSs9bzowIT09bj8obiE9PXMmJnQuYmxfdHJlZVsyKm5dKyssdC5ibF90cmVlWzIqYl0rKyk6bzw9MTA/dC5ibF90cmVlWzIqdl0rKzp0LmJsX3RyZWVbMip5XSsrLHM9bix1PShvPTApPT09YT8oaD0xMzgsMyk6bj09PWE/KGg9NiwzKTooaD03LDQpKX1mdW5jdGlvbiBWKHQsZSxyKXt2YXIgaSxuLHM9LTEsYT1lWzFdLG89MCxoPTcsdT00O2ZvcigwPT09YSYmKGg9MTM4LHU9MyksaT0wO2k8PXI7aSsrKWlmKG49YSxhPWVbMiooaSsxKSsxXSwhKCsrbzxoJiZuPT09YSkpe2lmKG88dSlmb3IoO0wodCxuLHQuYmxfdHJlZSksMCE9LS1vOyk7ZWxzZSAwIT09bj8obiE9PXMmJihMKHQsbix0LmJsX3RyZWUpLG8tLSksTCh0LGIsdC5ibF90cmVlKSxQKHQsby0zLDIpKTpvPD0xMD8oTCh0LHYsdC5ibF90cmVlKSxQKHQsby0zLDMpKTooTCh0LHksdC5ibF90cmVlKSxQKHQsby0xMSw3KSk7cz1uLHU9KG89MCk9PT1hPyhoPTEzOCwzKTpuPT09YT8oaD02LDMpOihoPTcsNCl9fWkoVCk7dmFyIHE9ITE7ZnVuY3Rpb24gSih0LGUscixpKXtQKHQsKHM8PDEpKyhpPzE6MCksMyksZnVuY3Rpb24odCxlLHIsaSl7TSh0KSxpJiYoVSh0LHIpLFUodCx+cikpLG4uYXJyYXlTZXQodC5wZW5kaW5nX2J1Zix0LndpbmRvdyxlLHIsdC5wZW5kaW5nKSx0LnBlbmRpbmcrPXJ9KHQsZSxyLCEwKX1yLl90cl9pbml0PWZ1bmN0aW9uKHQpe3F8fChmdW5jdGlvbigpe3ZhciB0LGUscixpLG4scz1uZXcgQXJyYXkoZysxKTtmb3IoaT1yPTA7aTxhLTE7aSsrKWZvcihJW2ldPXIsdD0wO3Q8MTw8d1tpXTt0KyspQVtyKytdPWk7Zm9yKEFbci0xXT1pLGk9bj0wO2k8MTY7aSsrKWZvcihUW2ldPW4sdD0wO3Q8MTw8a1tpXTt0KyspRVtuKytdPWk7Zm9yKG4+Pj03O2k8ZjtpKyspZm9yKFRbaV09bjw8Nyx0PTA7dDwxPDxrW2ldLTc7dCsrKUVbMjU2K24rK109aTtmb3IoZT0wO2U8PWc7ZSsrKXNbZV09MDtmb3IodD0wO3Q8PTE0MzspelsyKnQrMV09OCx0Kyssc1s4XSsrO2Zvcig7dDw9MjU1Oyl6WzIqdCsxXT05LHQrKyxzWzldKys7Zm9yKDt0PD0yNzk7KXpbMip0KzFdPTcsdCsrLHNbN10rKztmb3IoO3Q8PTI4NzspelsyKnQrMV09OCx0Kyssc1s4XSsrO2ZvcihaKHosbCsxLHMpLHQ9MDt0PGY7dCsrKUNbMip0KzFdPTUsQ1syKnRdPWoodCw1KTtPPW5ldyBEKHosdyx1KzEsbCxnKSxCPW5ldyBEKEMsaywwLGYsZyksUj1uZXcgRChuZXcgQXJyYXkoMCkseCwwLGQscCl9KCkscT0hMCksdC5sX2Rlc2M9bmV3IEYodC5keW5fbHRyZWUsTyksdC5kX2Rlc2M9bmV3IEYodC5keW5fZHRyZWUsQiksdC5ibF9kZXNjPW5ldyBGKHQuYmxfdHJlZSxSKSx0LmJpX2J1Zj0wLHQuYmlfdmFsaWQ9MCxXKHQpfSxyLl90cl9zdG9yZWRfYmxvY2s9SixyLl90cl9mbHVzaF9ibG9jaz1mdW5jdGlvbih0LGUscixpKXt2YXIgbixzLGE9MDswPHQubGV2ZWw/KDI9PT10LnN0cm0uZGF0YV90eXBlJiYodC5zdHJtLmRhdGFfdHlwZT1mdW5jdGlvbih0KXt2YXIgZSxyPTQwOTM2MjQ0NDc7Zm9yKGU9MDtlPD0zMTtlKysscj4+Pj0xKWlmKDEmciYmMCE9PXQuZHluX2x0cmVlWzIqZV0pcmV0dXJuIG87aWYoMCE9PXQuZHluX2x0cmVlWzE4XXx8MCE9PXQuZHluX2x0cmVlWzIwXXx8MCE9PXQuZHluX2x0cmVlWzI2XSlyZXR1cm4gaDtmb3IoZT0zMjtlPHU7ZSsrKWlmKDAhPT10LmR5bl9sdHJlZVsyKmVdKXJldHVybiBoO3JldHVybiBvfSh0KSksWSh0LHQubF9kZXNjKSxZKHQsdC5kX2Rlc2MpLGE9ZnVuY3Rpb24odCl7dmFyIGU7Zm9yKFgodCx0LmR5bl9sdHJlZSx0LmxfZGVzYy5tYXhfY29kZSksWCh0LHQuZHluX2R0cmVlLHQuZF9kZXNjLm1heF9jb2RlKSxZKHQsdC5ibF9kZXNjKSxlPWQtMTszPD1lJiYwPT09dC5ibF90cmVlWzIqU1tlXSsxXTtlLS0pO3JldHVybiB0Lm9wdF9sZW4rPTMqKGUrMSkrNSs1KzQsZX0odCksbj10Lm9wdF9sZW4rMys3Pj4+Mywocz10LnN0YXRpY19sZW4rMys3Pj4+Myk8PW4mJihuPXMpKTpuPXM9cis1LHIrNDw9biYmLTEhPT1lP0oodCxlLHIsaSk6ND09PXQuc3RyYXRlZ3l8fHM9PT1uPyhQKHQsMisoaT8xOjApLDMpLEsodCx6LEMpKTooUCh0LDQrKGk/MTowKSwzKSxmdW5jdGlvbih0LGUscixpKXt2YXIgbjtmb3IoUCh0LGUtMjU3LDUpLFAodCxyLTEsNSksUCh0LGktNCw0KSxuPTA7bjxpO24rKylQKHQsdC5ibF90cmVlWzIqU1tuXSsxXSwzKTtWKHQsdC5keW5fbHRyZWUsZS0xKSxWKHQsdC5keW5fZHRyZWUsci0xKX0odCx0LmxfZGVzYy5tYXhfY29kZSsxLHQuZF9kZXNjLm1heF9jb2RlKzEsYSsxKSxLKHQsdC5keW5fbHRyZWUsdC5keW5fZHRyZWUpKSxXKHQpLGkmJk0odCl9LHIuX3RyX3RhbGx5PWZ1bmN0aW9uKHQsZSxyKXtyZXR1cm4gdC5wZW5kaW5nX2J1Zlt0LmRfYnVmKzIqdC5sYXN0X2xpdF09ZT4+PjgmMjU1LHQucGVuZGluZ19idWZbdC5kX2J1ZisyKnQubGFzdF9saXQrMV09MjU1JmUsdC5wZW5kaW5nX2J1Zlt0LmxfYnVmK3QubGFzdF9saXRdPTI1NSZyLHQubGFzdF9saXQrKywwPT09ZT90LmR5bl9sdHJlZVsyKnJdKys6KHQubWF0Y2hlcysrLGUtLSx0LmR5bl9sdHJlZVsyKihBW3JdK3UrMSldKyssdC5keW5fZHRyZWVbMipOKGUpXSsrKSx0Lmxhc3RfbGl0PT09dC5saXRfYnVmc2l6ZS0xfSxyLl90cl9hbGlnbj1mdW5jdGlvbih0KXtQKHQsMiwzKSxMKHQsbSx6KSxmdW5jdGlvbih0KXsxNj09PXQuYmlfdmFsaWQ/KFUodCx0LmJpX2J1ZiksdC5iaV9idWY9MCx0LmJpX3ZhbGlkPTApOjg8PXQuYmlfdmFsaWQmJih0LnBlbmRpbmdfYnVmW3QucGVuZGluZysrXT0yNTUmdC5iaV9idWYsdC5iaV9idWY+Pj04LHQuYmlfdmFsaWQtPTgpfSh0KX19LHtcIi4uL3V0aWxzL2NvbW1vblwiOjQxfV0sNTM6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtlLmV4cG9ydHM9ZnVuY3Rpb24oKXt0aGlzLmlucHV0PW51bGwsdGhpcy5uZXh0X2luPTAsdGhpcy5hdmFpbF9pbj0wLHRoaXMudG90YWxfaW49MCx0aGlzLm91dHB1dD1udWxsLHRoaXMubmV4dF9vdXQ9MCx0aGlzLmF2YWlsX291dD0wLHRoaXMudG90YWxfb3V0PTAsdGhpcy5tc2c9XCJcIix0aGlzLnN0YXRlPW51bGwsdGhpcy5kYXRhX3R5cGU9Mix0aGlzLmFkbGVyPTB9fSx7fV0sNTQ6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtlLmV4cG9ydHM9XCJmdW5jdGlvblwiPT10eXBlb2Ygc2V0SW1tZWRpYXRlP3NldEltbWVkaWF0ZTpmdW5jdGlvbigpe3ZhciB0PVtdLnNsaWNlLmFwcGx5KGFyZ3VtZW50cyk7dC5zcGxpY2UoMSwwLDApLHNldFRpbWVvdXQuYXBwbHkobnVsbCx0KX19LHt9XX0se30sWzEwXSkoMTApfSk7IiwiLypcbm9iamVjdC1hc3NpZ25cbihjKSBTaW5kcmUgU29yaHVzXG5AbGljZW5zZSBNSVRcbiovXG5cbid1c2Ugc3RyaWN0Jztcbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG52YXIgZ2V0T3duUHJvcGVydHlTeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scztcbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcHJvcElzRW51bWVyYWJsZSA9IE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbmZ1bmN0aW9uIHRvT2JqZWN0KHZhbCkge1xuXHRpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignT2JqZWN0LmFzc2lnbiBjYW5ub3QgYmUgY2FsbGVkIHdpdGggbnVsbCBvciB1bmRlZmluZWQnKTtcblx0fVxuXG5cdHJldHVybiBPYmplY3QodmFsKTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkVXNlTmF0aXZlKCkge1xuXHR0cnkge1xuXHRcdGlmICghT2JqZWN0LmFzc2lnbikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIERldGVjdCBidWdneSBwcm9wZXJ0eSBlbnVtZXJhdGlvbiBvcmRlciBpbiBvbGRlciBWOCB2ZXJzaW9ucy5cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTQxMThcblx0XHR2YXIgdGVzdDEgPSBuZXcgU3RyaW5nKCdhYmMnKTsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3LXdyYXBwZXJzXG5cdFx0dGVzdDFbNV0gPSAnZGUnO1xuXHRcdGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MSlbMF0gPT09ICc1Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDIgPSB7fTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspIHtcblx0XHRcdHRlc3QyWydfJyArIFN0cmluZy5mcm9tQ2hhckNvZGUoaSldID0gaTtcblx0XHR9XG5cdFx0dmFyIG9yZGVyMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QyKS5tYXAoZnVuY3Rpb24gKG4pIHtcblx0XHRcdHJldHVybiB0ZXN0MltuXTtcblx0XHR9KTtcblx0XHRpZiAob3JkZXIyLmpvaW4oJycpICE9PSAnMDEyMzQ1Njc4OScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QzID0ge307XG5cdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jy5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbiAobGV0dGVyKSB7XG5cdFx0XHR0ZXN0M1tsZXR0ZXJdID0gbGV0dGVyO1xuXHRcdH0pO1xuXHRcdGlmIChPYmplY3Qua2V5cyhPYmplY3QuYXNzaWduKHt9LCB0ZXN0MykpLmpvaW4oJycpICE9PVxuXHRcdFx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdC8vIFdlIGRvbid0IGV4cGVjdCBhbnkgb2YgdGhlIGFib3ZlIHRvIHRocm93LCBidXQgYmV0dGVyIHRvIGJlIHNhZmUuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2hvdWxkVXNlTmF0aXZlKCkgPyBPYmplY3QuYXNzaWduIDogZnVuY3Rpb24gKHRhcmdldCwgc291cmNlKSB7XG5cdHZhciBmcm9tO1xuXHR2YXIgdG8gPSB0b09iamVjdCh0YXJnZXQpO1xuXHR2YXIgc3ltYm9scztcblxuXHRmb3IgKHZhciBzID0gMTsgcyA8IGFyZ3VtZW50cy5sZW5ndGg7IHMrKykge1xuXHRcdGZyb20gPSBPYmplY3QoYXJndW1lbnRzW3NdKTtcblxuXHRcdGZvciAodmFyIGtleSBpbiBmcm9tKSB7XG5cdFx0XHRpZiAoaGFzT3duUHJvcGVydHkuY2FsbChmcm9tLCBrZXkpKSB7XG5cdFx0XHRcdHRvW2tleV0gPSBmcm9tW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGdldE93blByb3BlcnR5U3ltYm9scykge1xuXHRcdFx0c3ltYm9scyA9IGdldE93blByb3BlcnR5U3ltYm9scyhmcm9tKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3ltYm9scy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAocHJvcElzRW51bWVyYWJsZS5jYWxsKGZyb20sIHN5bWJvbHNbaV0pKSB7XG5cdFx0XHRcdFx0dG9bc3ltYm9sc1tpXV0gPSBmcm9tW3N5bWJvbHNbaV1dO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRvO1xufTtcbiIsIi8qIEBsaWNlbnNlXG5QYXBhIFBhcnNlXG52NS4zLjJcbmh0dHBzOi8vZ2l0aHViLmNvbS9taG9sdC9QYXBhUGFyc2VcbkxpY2Vuc2U6IE1JVFxuKi9cbiFmdW5jdGlvbihlLHQpe1wiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZD9kZWZpbmUoW10sdCk6XCJvYmplY3RcIj09dHlwZW9mIG1vZHVsZSYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGV4cG9ydHM/bW9kdWxlLmV4cG9ydHM9dCgpOmUuUGFwYT10KCl9KHRoaXMsZnVuY3Rpb24gcygpe1widXNlIHN0cmljdFwiO3ZhciBmPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmP3NlbGY6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6dm9pZCAwIT09Zj9mOnt9O3ZhciBuPSFmLmRvY3VtZW50JiYhIWYucG9zdE1lc3NhZ2Usbz1uJiYvYmxvYjovaS50ZXN0KChmLmxvY2F0aW9ufHx7fSkucHJvdG9jb2wpLGE9e30saD0wLGI9e3BhcnNlOmZ1bmN0aW9uKGUsdCl7dmFyIGk9KHQ9dHx8e30pLmR5bmFtaWNUeXBpbmd8fCExO00oaSkmJih0LmR5bmFtaWNUeXBpbmdGdW5jdGlvbj1pLGk9e30pO2lmKHQuZHluYW1pY1R5cGluZz1pLHQudHJhbnNmb3JtPSEhTSh0LnRyYW5zZm9ybSkmJnQudHJhbnNmb3JtLHQud29ya2VyJiZiLldPUktFUlNfU1VQUE9SVEVEKXt2YXIgcj1mdW5jdGlvbigpe2lmKCFiLldPUktFUlNfU1VQUE9SVEVEKXJldHVybiExO3ZhciBlPShpPWYuVVJMfHxmLndlYmtpdFVSTHx8bnVsbCxyPXMudG9TdHJpbmcoKSxiLkJMT0JfVVJMfHwoYi5CTE9CX1VSTD1pLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbXCIoXCIscixcIikoKTtcIl0se3R5cGU6XCJ0ZXh0L2phdmFzY3JpcHRcIn0pKSkpLHQ9bmV3IGYuV29ya2VyKGUpO3ZhciBpLHI7cmV0dXJuIHQub25tZXNzYWdlPV8sdC5pZD1oKyssYVt0LmlkXT10fSgpO3JldHVybiByLnVzZXJTdGVwPXQuc3RlcCxyLnVzZXJDaHVuaz10LmNodW5rLHIudXNlckNvbXBsZXRlPXQuY29tcGxldGUsci51c2VyRXJyb3I9dC5lcnJvcix0LnN0ZXA9TSh0LnN0ZXApLHQuY2h1bms9TSh0LmNodW5rKSx0LmNvbXBsZXRlPU0odC5jb21wbGV0ZSksdC5lcnJvcj1NKHQuZXJyb3IpLGRlbGV0ZSB0Lndvcmtlcix2b2lkIHIucG9zdE1lc3NhZ2Uoe2lucHV0OmUsY29uZmlnOnQsd29ya2VySWQ6ci5pZH0pfXZhciBuPW51bGw7Yi5OT0RFX1NUUkVBTV9JTlBVVCxcInN0cmluZ1wiPT10eXBlb2YgZT9uPXQuZG93bmxvYWQ/bmV3IGwodCk6bmV3IHAodCk6ITA9PT1lLnJlYWRhYmxlJiZNKGUucmVhZCkmJk0oZS5vbik/bj1uZXcgZyh0KTooZi5GaWxlJiZlIGluc3RhbmNlb2YgRmlsZXx8ZSBpbnN0YW5jZW9mIE9iamVjdCkmJihuPW5ldyBjKHQpKTtyZXR1cm4gbi5zdHJlYW0oZSl9LHVucGFyc2U6ZnVuY3Rpb24oZSx0KXt2YXIgbj0hMSxfPSEwLG09XCIsXCIseT1cIlxcclxcblwiLHM9J1wiJyxhPXMrcyxpPSExLHI9bnVsbCxvPSExOyFmdW5jdGlvbigpe2lmKFwib2JqZWN0XCIhPXR5cGVvZiB0KXJldHVybjtcInN0cmluZ1wiIT10eXBlb2YgdC5kZWxpbWl0ZXJ8fGIuQkFEX0RFTElNSVRFUlMuZmlsdGVyKGZ1bmN0aW9uKGUpe3JldHVybi0xIT09dC5kZWxpbWl0ZXIuaW5kZXhPZihlKX0pLmxlbmd0aHx8KG09dC5kZWxpbWl0ZXIpOyhcImJvb2xlYW5cIj09dHlwZW9mIHQucXVvdGVzfHxcImZ1bmN0aW9uXCI9PXR5cGVvZiB0LnF1b3Rlc3x8QXJyYXkuaXNBcnJheSh0LnF1b3RlcykpJiYobj10LnF1b3Rlcyk7XCJib29sZWFuXCIhPXR5cGVvZiB0LnNraXBFbXB0eUxpbmVzJiZcInN0cmluZ1wiIT10eXBlb2YgdC5za2lwRW1wdHlMaW5lc3x8KGk9dC5za2lwRW1wdHlMaW5lcyk7XCJzdHJpbmdcIj09dHlwZW9mIHQubmV3bGluZSYmKHk9dC5uZXdsaW5lKTtcInN0cmluZ1wiPT10eXBlb2YgdC5xdW90ZUNoYXImJihzPXQucXVvdGVDaGFyKTtcImJvb2xlYW5cIj09dHlwZW9mIHQuaGVhZGVyJiYoXz10LmhlYWRlcik7aWYoQXJyYXkuaXNBcnJheSh0LmNvbHVtbnMpKXtpZigwPT09dC5jb2x1bW5zLmxlbmd0aCl0aHJvdyBuZXcgRXJyb3IoXCJPcHRpb24gY29sdW1ucyBpcyBlbXB0eVwiKTtyPXQuY29sdW1uc312b2lkIDAhPT10LmVzY2FwZUNoYXImJihhPXQuZXNjYXBlQ2hhcitzKTsoXCJib29sZWFuXCI9PXR5cGVvZiB0LmVzY2FwZUZvcm11bGFlfHx0LmVzY2FwZUZvcm11bGFlIGluc3RhbmNlb2YgUmVnRXhwKSYmKG89dC5lc2NhcGVGb3JtdWxhZSBpbnN0YW5jZW9mIFJlZ0V4cD90LmVzY2FwZUZvcm11bGFlOi9eWz0rXFwtQFxcdFxccl0uKiQvKX0oKTt2YXIgaD1uZXcgUmVnRXhwKGoocyksXCJnXCIpO1wic3RyaW5nXCI9PXR5cGVvZiBlJiYoZT1KU09OLnBhcnNlKGUpKTtpZihBcnJheS5pc0FycmF5KGUpKXtpZighZS5sZW5ndGh8fEFycmF5LmlzQXJyYXkoZVswXSkpcmV0dXJuIHUobnVsbCxlLGkpO2lmKFwib2JqZWN0XCI9PXR5cGVvZiBlWzBdKXJldHVybiB1KHJ8fE9iamVjdC5rZXlzKGVbMF0pLGUsaSl9ZWxzZSBpZihcIm9iamVjdFwiPT10eXBlb2YgZSlyZXR1cm5cInN0cmluZ1wiPT10eXBlb2YgZS5kYXRhJiYoZS5kYXRhPUpTT04ucGFyc2UoZS5kYXRhKSksQXJyYXkuaXNBcnJheShlLmRhdGEpJiYoZS5maWVsZHN8fChlLmZpZWxkcz1lLm1ldGEmJmUubWV0YS5maWVsZHN8fHIpLGUuZmllbGRzfHwoZS5maWVsZHM9QXJyYXkuaXNBcnJheShlLmRhdGFbMF0pP2UuZmllbGRzOlwib2JqZWN0XCI9PXR5cGVvZiBlLmRhdGFbMF0/T2JqZWN0LmtleXMoZS5kYXRhWzBdKTpbXSksQXJyYXkuaXNBcnJheShlLmRhdGFbMF0pfHxcIm9iamVjdFwiPT10eXBlb2YgZS5kYXRhWzBdfHwoZS5kYXRhPVtlLmRhdGFdKSksdShlLmZpZWxkc3x8W10sZS5kYXRhfHxbXSxpKTt0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gc2VyaWFsaXplIHVucmVjb2duaXplZCBpbnB1dFwiKTtmdW5jdGlvbiB1KGUsdCxpKXt2YXIgcj1cIlwiO1wic3RyaW5nXCI9PXR5cGVvZiBlJiYoZT1KU09OLnBhcnNlKGUpKSxcInN0cmluZ1wiPT10eXBlb2YgdCYmKHQ9SlNPTi5wYXJzZSh0KSk7dmFyIG49QXJyYXkuaXNBcnJheShlKSYmMDxlLmxlbmd0aCxzPSFBcnJheS5pc0FycmF5KHRbMF0pO2lmKG4mJl8pe2Zvcih2YXIgYT0wO2E8ZS5sZW5ndGg7YSsrKTA8YSYmKHIrPW0pLHIrPXYoZVthXSxhKTswPHQubGVuZ3RoJiYocis9eSl9Zm9yKHZhciBvPTA7bzx0Lmxlbmd0aDtvKyspe3ZhciBoPW4/ZS5sZW5ndGg6dFtvXS5sZW5ndGgsdT0hMSxmPW4/MD09PU9iamVjdC5rZXlzKHRbb10pLmxlbmd0aDowPT09dFtvXS5sZW5ndGg7aWYoaSYmIW4mJih1PVwiZ3JlZWR5XCI9PT1pP1wiXCI9PT10W29dLmpvaW4oXCJcIikudHJpbSgpOjE9PT10W29dLmxlbmd0aCYmMD09PXRbb11bMF0ubGVuZ3RoKSxcImdyZWVkeVwiPT09aSYmbil7Zm9yKHZhciBkPVtdLGw9MDtsPGg7bCsrKXt2YXIgYz1zP2VbbF06bDtkLnB1c2godFtvXVtjXSl9dT1cIlwiPT09ZC5qb2luKFwiXCIpLnRyaW0oKX1pZighdSl7Zm9yKHZhciBwPTA7cDxoO3ArKyl7MDxwJiYhZiYmKHIrPW0pO3ZhciBnPW4mJnM/ZVtwXTpwO3IrPXYodFtvXVtnXSxwKX1vPHQubGVuZ3RoLTEmJighaXx8MDxoJiYhZikmJihyKz15KX19cmV0dXJuIHJ9ZnVuY3Rpb24gdihlLHQpe2lmKG51bGw9PWUpcmV0dXJuXCJcIjtpZihlLmNvbnN0cnVjdG9yPT09RGF0ZSlyZXR1cm4gSlNPTi5zdHJpbmdpZnkoZSkuc2xpY2UoMSwyNSk7dmFyIGk9ITE7byYmXCJzdHJpbmdcIj09dHlwZW9mIGUmJm8udGVzdChlKSYmKGU9XCInXCIrZSxpPSEwKTt2YXIgcj1lLnRvU3RyaW5nKCkucmVwbGFjZShoLGEpO3JldHVybihpPWl8fCEwPT09bnx8XCJmdW5jdGlvblwiPT10eXBlb2YgbiYmbihlLHQpfHxBcnJheS5pc0FycmF5KG4pJiZuW3RdfHxmdW5jdGlvbihlLHQpe2Zvcih2YXIgaT0wO2k8dC5sZW5ndGg7aSsrKWlmKC0xPGUuaW5kZXhPZih0W2ldKSlyZXR1cm4hMDtyZXR1cm4hMX0ocixiLkJBRF9ERUxJTUlURVJTKXx8LTE8ci5pbmRleE9mKG0pfHxcIiBcIj09PXIuY2hhckF0KDApfHxcIiBcIj09PXIuY2hhckF0KHIubGVuZ3RoLTEpKT9zK3IrczpyfX19O2lmKGIuUkVDT1JEX1NFUD1TdHJpbmcuZnJvbUNoYXJDb2RlKDMwKSxiLlVOSVRfU0VQPVN0cmluZy5mcm9tQ2hhckNvZGUoMzEpLGIuQllURV9PUkRFUl9NQVJLPVwiXFx1ZmVmZlwiLGIuQkFEX0RFTElNSVRFUlM9W1wiXFxyXCIsXCJcXG5cIiwnXCInLGIuQllURV9PUkRFUl9NQVJLXSxiLldPUktFUlNfU1VQUE9SVEVEPSFuJiYhIWYuV29ya2VyLGIuTk9ERV9TVFJFQU1fSU5QVVQ9MSxiLkxvY2FsQ2h1bmtTaXplPTEwNDg1NzYwLGIuUmVtb3RlQ2h1bmtTaXplPTUyNDI4ODAsYi5EZWZhdWx0RGVsaW1pdGVyPVwiLFwiLGIuUGFyc2VyPUUsYi5QYXJzZXJIYW5kbGU9aSxiLk5ldHdvcmtTdHJlYW1lcj1sLGIuRmlsZVN0cmVhbWVyPWMsYi5TdHJpbmdTdHJlYW1lcj1wLGIuUmVhZGFibGVTdHJlYW1TdHJlYW1lcj1nLGYualF1ZXJ5KXt2YXIgZD1mLmpRdWVyeTtkLmZuLnBhcnNlPWZ1bmN0aW9uKG8pe3ZhciBpPW8uY29uZmlnfHx7fSxoPVtdO3JldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oZSl7aWYoIShcIklOUFVUXCI9PT1kKHRoaXMpLnByb3AoXCJ0YWdOYW1lXCIpLnRvVXBwZXJDYXNlKCkmJlwiZmlsZVwiPT09ZCh0aGlzKS5hdHRyKFwidHlwZVwiKS50b0xvd2VyQ2FzZSgpJiZmLkZpbGVSZWFkZXIpfHwhdGhpcy5maWxlc3x8MD09PXRoaXMuZmlsZXMubGVuZ3RoKXJldHVybiEwO2Zvcih2YXIgdD0wO3Q8dGhpcy5maWxlcy5sZW5ndGg7dCsrKWgucHVzaCh7ZmlsZTp0aGlzLmZpbGVzW3RdLGlucHV0RWxlbTp0aGlzLGluc3RhbmNlQ29uZmlnOmQuZXh0ZW5kKHt9LGkpfSl9KSxlKCksdGhpcztmdW5jdGlvbiBlKCl7aWYoMCE9PWgubGVuZ3RoKXt2YXIgZSx0LGkscixuPWhbMF07aWYoTShvLmJlZm9yZSkpe3ZhciBzPW8uYmVmb3JlKG4uZmlsZSxuLmlucHV0RWxlbSk7aWYoXCJvYmplY3RcIj09dHlwZW9mIHMpe2lmKFwiYWJvcnRcIj09PXMuYWN0aW9uKXJldHVybiBlPVwiQWJvcnRFcnJvclwiLHQ9bi5maWxlLGk9bi5pbnB1dEVsZW0scj1zLnJlYXNvbix2b2lkKE0oby5lcnJvcikmJm8uZXJyb3Ioe25hbWU6ZX0sdCxpLHIpKTtpZihcInNraXBcIj09PXMuYWN0aW9uKXJldHVybiB2b2lkIHUoKTtcIm9iamVjdFwiPT10eXBlb2Ygcy5jb25maWcmJihuLmluc3RhbmNlQ29uZmlnPWQuZXh0ZW5kKG4uaW5zdGFuY2VDb25maWcscy5jb25maWcpKX1lbHNlIGlmKFwic2tpcFwiPT09cylyZXR1cm4gdm9pZCB1KCl9dmFyIGE9bi5pbnN0YW5jZUNvbmZpZy5jb21wbGV0ZTtuLmluc3RhbmNlQ29uZmlnLmNvbXBsZXRlPWZ1bmN0aW9uKGUpe00oYSkmJmEoZSxuLmZpbGUsbi5pbnB1dEVsZW0pLHUoKX0sYi5wYXJzZShuLmZpbGUsbi5pbnN0YW5jZUNvbmZpZyl9ZWxzZSBNKG8uY29tcGxldGUpJiZvLmNvbXBsZXRlKCl9ZnVuY3Rpb24gdSgpe2guc3BsaWNlKDAsMSksZSgpfX19ZnVuY3Rpb24gdShlKXt0aGlzLl9oYW5kbGU9bnVsbCx0aGlzLl9maW5pc2hlZD0hMSx0aGlzLl9jb21wbGV0ZWQ9ITEsdGhpcy5faGFsdGVkPSExLHRoaXMuX2lucHV0PW51bGwsdGhpcy5fYmFzZUluZGV4PTAsdGhpcy5fcGFydGlhbExpbmU9XCJcIix0aGlzLl9yb3dDb3VudD0wLHRoaXMuX3N0YXJ0PTAsdGhpcy5fbmV4dENodW5rPW51bGwsdGhpcy5pc0ZpcnN0Q2h1bms9ITAsdGhpcy5fY29tcGxldGVSZXN1bHRzPXtkYXRhOltdLGVycm9yczpbXSxtZXRhOnt9fSxmdW5jdGlvbihlKXt2YXIgdD13KGUpO3QuY2h1bmtTaXplPXBhcnNlSW50KHQuY2h1bmtTaXplKSxlLnN0ZXB8fGUuY2h1bmt8fCh0LmNodW5rU2l6ZT1udWxsKTt0aGlzLl9oYW5kbGU9bmV3IGkodCksKHRoaXMuX2hhbmRsZS5zdHJlYW1lcj10aGlzKS5fY29uZmlnPXR9LmNhbGwodGhpcyxlKSx0aGlzLnBhcnNlQ2h1bms9ZnVuY3Rpb24oZSx0KXtpZih0aGlzLmlzRmlyc3RDaHVuayYmTSh0aGlzLl9jb25maWcuYmVmb3JlRmlyc3RDaHVuaykpe3ZhciBpPXRoaXMuX2NvbmZpZy5iZWZvcmVGaXJzdENodW5rKGUpO3ZvaWQgMCE9PWkmJihlPWkpfXRoaXMuaXNGaXJzdENodW5rPSExLHRoaXMuX2hhbHRlZD0hMTt2YXIgcj10aGlzLl9wYXJ0aWFsTGluZStlO3RoaXMuX3BhcnRpYWxMaW5lPVwiXCI7dmFyIG49dGhpcy5faGFuZGxlLnBhcnNlKHIsdGhpcy5fYmFzZUluZGV4LCF0aGlzLl9maW5pc2hlZCk7aWYoIXRoaXMuX2hhbmRsZS5wYXVzZWQoKSYmIXRoaXMuX2hhbmRsZS5hYm9ydGVkKCkpe3ZhciBzPW4ubWV0YS5jdXJzb3I7dGhpcy5fZmluaXNoZWR8fCh0aGlzLl9wYXJ0aWFsTGluZT1yLnN1YnN0cmluZyhzLXRoaXMuX2Jhc2VJbmRleCksdGhpcy5fYmFzZUluZGV4PXMpLG4mJm4uZGF0YSYmKHRoaXMuX3Jvd0NvdW50Kz1uLmRhdGEubGVuZ3RoKTt2YXIgYT10aGlzLl9maW5pc2hlZHx8dGhpcy5fY29uZmlnLnByZXZpZXcmJnRoaXMuX3Jvd0NvdW50Pj10aGlzLl9jb25maWcucHJldmlldztpZihvKWYucG9zdE1lc3NhZ2Uoe3Jlc3VsdHM6bix3b3JrZXJJZDpiLldPUktFUl9JRCxmaW5pc2hlZDphfSk7ZWxzZSBpZihNKHRoaXMuX2NvbmZpZy5jaHVuaykmJiF0KXtpZih0aGlzLl9jb25maWcuY2h1bmsobix0aGlzLl9oYW5kbGUpLHRoaXMuX2hhbmRsZS5wYXVzZWQoKXx8dGhpcy5faGFuZGxlLmFib3J0ZWQoKSlyZXR1cm4gdm9pZCh0aGlzLl9oYWx0ZWQ9ITApO249dm9pZCAwLHRoaXMuX2NvbXBsZXRlUmVzdWx0cz12b2lkIDB9cmV0dXJuIHRoaXMuX2NvbmZpZy5zdGVwfHx0aGlzLl9jb25maWcuY2h1bmt8fCh0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZGF0YT10aGlzLl9jb21wbGV0ZVJlc3VsdHMuZGF0YS5jb25jYXQobi5kYXRhKSx0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZXJyb3JzPXRoaXMuX2NvbXBsZXRlUmVzdWx0cy5lcnJvcnMuY29uY2F0KG4uZXJyb3JzKSx0aGlzLl9jb21wbGV0ZVJlc3VsdHMubWV0YT1uLm1ldGEpLHRoaXMuX2NvbXBsZXRlZHx8IWF8fCFNKHRoaXMuX2NvbmZpZy5jb21wbGV0ZSl8fG4mJm4ubWV0YS5hYm9ydGVkfHwodGhpcy5fY29uZmlnLmNvbXBsZXRlKHRoaXMuX2NvbXBsZXRlUmVzdWx0cyx0aGlzLl9pbnB1dCksdGhpcy5fY29tcGxldGVkPSEwKSxhfHxuJiZuLm1ldGEucGF1c2VkfHx0aGlzLl9uZXh0Q2h1bmsoKSxufXRoaXMuX2hhbHRlZD0hMH0sdGhpcy5fc2VuZEVycm9yPWZ1bmN0aW9uKGUpe00odGhpcy5fY29uZmlnLmVycm9yKT90aGlzLl9jb25maWcuZXJyb3IoZSk6byYmdGhpcy5fY29uZmlnLmVycm9yJiZmLnBvc3RNZXNzYWdlKHt3b3JrZXJJZDpiLldPUktFUl9JRCxlcnJvcjplLGZpbmlzaGVkOiExfSl9fWZ1bmN0aW9uIGwoZSl7dmFyIHI7KGU9ZXx8e30pLmNodW5rU2l6ZXx8KGUuY2h1bmtTaXplPWIuUmVtb3RlQ2h1bmtTaXplKSx1LmNhbGwodGhpcyxlKSx0aGlzLl9uZXh0Q2h1bms9bj9mdW5jdGlvbigpe3RoaXMuX3JlYWRDaHVuaygpLHRoaXMuX2NodW5rTG9hZGVkKCl9OmZ1bmN0aW9uKCl7dGhpcy5fcmVhZENodW5rKCl9LHRoaXMuc3RyZWFtPWZ1bmN0aW9uKGUpe3RoaXMuX2lucHV0PWUsdGhpcy5fbmV4dENodW5rKCl9LHRoaXMuX3JlYWRDaHVuaz1mdW5jdGlvbigpe2lmKHRoaXMuX2ZpbmlzaGVkKXRoaXMuX2NodW5rTG9hZGVkKCk7ZWxzZXtpZihyPW5ldyBYTUxIdHRwUmVxdWVzdCx0aGlzLl9jb25maWcud2l0aENyZWRlbnRpYWxzJiYoci53aXRoQ3JlZGVudGlhbHM9dGhpcy5fY29uZmlnLndpdGhDcmVkZW50aWFscyksbnx8KHIub25sb2FkPXYodGhpcy5fY2h1bmtMb2FkZWQsdGhpcyksci5vbmVycm9yPXYodGhpcy5fY2h1bmtFcnJvcix0aGlzKSksci5vcGVuKHRoaXMuX2NvbmZpZy5kb3dubG9hZFJlcXVlc3RCb2R5P1wiUE9TVFwiOlwiR0VUXCIsdGhpcy5faW5wdXQsIW4pLHRoaXMuX2NvbmZpZy5kb3dubG9hZFJlcXVlc3RIZWFkZXJzKXt2YXIgZT10aGlzLl9jb25maWcuZG93bmxvYWRSZXF1ZXN0SGVhZGVycztmb3IodmFyIHQgaW4gZSlyLnNldFJlcXVlc3RIZWFkZXIodCxlW3RdKX1pZih0aGlzLl9jb25maWcuY2h1bmtTaXplKXt2YXIgaT10aGlzLl9zdGFydCt0aGlzLl9jb25maWcuY2h1bmtTaXplLTE7ci5zZXRSZXF1ZXN0SGVhZGVyKFwiUmFuZ2VcIixcImJ5dGVzPVwiK3RoaXMuX3N0YXJ0K1wiLVwiK2kpfXRyeXtyLnNlbmQodGhpcy5fY29uZmlnLmRvd25sb2FkUmVxdWVzdEJvZHkpfWNhdGNoKGUpe3RoaXMuX2NodW5rRXJyb3IoZS5tZXNzYWdlKX1uJiYwPT09ci5zdGF0dXMmJnRoaXMuX2NodW5rRXJyb3IoKX19LHRoaXMuX2NodW5rTG9hZGVkPWZ1bmN0aW9uKCl7ND09PXIucmVhZHlTdGF0ZSYmKHIuc3RhdHVzPDIwMHx8NDAwPD1yLnN0YXR1cz90aGlzLl9jaHVua0Vycm9yKCk6KHRoaXMuX3N0YXJ0Kz10aGlzLl9jb25maWcuY2h1bmtTaXplP3RoaXMuX2NvbmZpZy5jaHVua1NpemU6ci5yZXNwb25zZVRleHQubGVuZ3RoLHRoaXMuX2ZpbmlzaGVkPSF0aGlzLl9jb25maWcuY2h1bmtTaXplfHx0aGlzLl9zdGFydD49ZnVuY3Rpb24oZSl7dmFyIHQ9ZS5nZXRSZXNwb25zZUhlYWRlcihcIkNvbnRlbnQtUmFuZ2VcIik7aWYobnVsbD09PXQpcmV0dXJuLTE7cmV0dXJuIHBhcnNlSW50KHQuc3Vic3RyaW5nKHQubGFzdEluZGV4T2YoXCIvXCIpKzEpKX0ociksdGhpcy5wYXJzZUNodW5rKHIucmVzcG9uc2VUZXh0KSkpfSx0aGlzLl9jaHVua0Vycm9yPWZ1bmN0aW9uKGUpe3ZhciB0PXIuc3RhdHVzVGV4dHx8ZTt0aGlzLl9zZW5kRXJyb3IobmV3IEVycm9yKHQpKX19ZnVuY3Rpb24gYyhlKXt2YXIgcixuOyhlPWV8fHt9KS5jaHVua1NpemV8fChlLmNodW5rU2l6ZT1iLkxvY2FsQ2h1bmtTaXplKSx1LmNhbGwodGhpcyxlKTt2YXIgcz1cInVuZGVmaW5lZFwiIT10eXBlb2YgRmlsZVJlYWRlcjt0aGlzLnN0cmVhbT1mdW5jdGlvbihlKXt0aGlzLl9pbnB1dD1lLG49ZS5zbGljZXx8ZS53ZWJraXRTbGljZXx8ZS5tb3pTbGljZSxzPygocj1uZXcgRmlsZVJlYWRlcikub25sb2FkPXYodGhpcy5fY2h1bmtMb2FkZWQsdGhpcyksci5vbmVycm9yPXYodGhpcy5fY2h1bmtFcnJvcix0aGlzKSk6cj1uZXcgRmlsZVJlYWRlclN5bmMsdGhpcy5fbmV4dENodW5rKCl9LHRoaXMuX25leHRDaHVuaz1mdW5jdGlvbigpe3RoaXMuX2ZpbmlzaGVkfHx0aGlzLl9jb25maWcucHJldmlldyYmISh0aGlzLl9yb3dDb3VudDx0aGlzLl9jb25maWcucHJldmlldyl8fHRoaXMuX3JlYWRDaHVuaygpfSx0aGlzLl9yZWFkQ2h1bms9ZnVuY3Rpb24oKXt2YXIgZT10aGlzLl9pbnB1dDtpZih0aGlzLl9jb25maWcuY2h1bmtTaXplKXt2YXIgdD1NYXRoLm1pbih0aGlzLl9zdGFydCt0aGlzLl9jb25maWcuY2h1bmtTaXplLHRoaXMuX2lucHV0LnNpemUpO2U9bi5jYWxsKGUsdGhpcy5fc3RhcnQsdCl9dmFyIGk9ci5yZWFkQXNUZXh0KGUsdGhpcy5fY29uZmlnLmVuY29kaW5nKTtzfHx0aGlzLl9jaHVua0xvYWRlZCh7dGFyZ2V0OntyZXN1bHQ6aX19KX0sdGhpcy5fY2h1bmtMb2FkZWQ9ZnVuY3Rpb24oZSl7dGhpcy5fc3RhcnQrPXRoaXMuX2NvbmZpZy5jaHVua1NpemUsdGhpcy5fZmluaXNoZWQ9IXRoaXMuX2NvbmZpZy5jaHVua1NpemV8fHRoaXMuX3N0YXJ0Pj10aGlzLl9pbnB1dC5zaXplLHRoaXMucGFyc2VDaHVuayhlLnRhcmdldC5yZXN1bHQpfSx0aGlzLl9jaHVua0Vycm9yPWZ1bmN0aW9uKCl7dGhpcy5fc2VuZEVycm9yKHIuZXJyb3IpfX1mdW5jdGlvbiBwKGUpe3ZhciBpO3UuY2FsbCh0aGlzLGU9ZXx8e30pLHRoaXMuc3RyZWFtPWZ1bmN0aW9uKGUpe3JldHVybiBpPWUsdGhpcy5fbmV4dENodW5rKCl9LHRoaXMuX25leHRDaHVuaz1mdW5jdGlvbigpe2lmKCF0aGlzLl9maW5pc2hlZCl7dmFyIGUsdD10aGlzLl9jb25maWcuY2h1bmtTaXplO3JldHVybiB0PyhlPWkuc3Vic3RyaW5nKDAsdCksaT1pLnN1YnN0cmluZyh0KSk6KGU9aSxpPVwiXCIpLHRoaXMuX2ZpbmlzaGVkPSFpLHRoaXMucGFyc2VDaHVuayhlKX19fWZ1bmN0aW9uIGcoZSl7dS5jYWxsKHRoaXMsZT1lfHx7fSk7dmFyIHQ9W10saT0hMCxyPSExO3RoaXMucGF1c2U9ZnVuY3Rpb24oKXt1LnByb3RvdHlwZS5wYXVzZS5hcHBseSh0aGlzLGFyZ3VtZW50cyksdGhpcy5faW5wdXQucGF1c2UoKX0sdGhpcy5yZXN1bWU9ZnVuY3Rpb24oKXt1LnByb3RvdHlwZS5yZXN1bWUuYXBwbHkodGhpcyxhcmd1bWVudHMpLHRoaXMuX2lucHV0LnJlc3VtZSgpfSx0aGlzLnN0cmVhbT1mdW5jdGlvbihlKXt0aGlzLl9pbnB1dD1lLHRoaXMuX2lucHV0Lm9uKFwiZGF0YVwiLHRoaXMuX3N0cmVhbURhdGEpLHRoaXMuX2lucHV0Lm9uKFwiZW5kXCIsdGhpcy5fc3RyZWFtRW5kKSx0aGlzLl9pbnB1dC5vbihcImVycm9yXCIsdGhpcy5fc3RyZWFtRXJyb3IpfSx0aGlzLl9jaGVja0lzRmluaXNoZWQ9ZnVuY3Rpb24oKXtyJiYxPT09dC5sZW5ndGgmJih0aGlzLl9maW5pc2hlZD0hMCl9LHRoaXMuX25leHRDaHVuaz1mdW5jdGlvbigpe3RoaXMuX2NoZWNrSXNGaW5pc2hlZCgpLHQubGVuZ3RoP3RoaXMucGFyc2VDaHVuayh0LnNoaWZ0KCkpOmk9ITB9LHRoaXMuX3N0cmVhbURhdGE9dihmdW5jdGlvbihlKXt0cnl7dC5wdXNoKFwic3RyaW5nXCI9PXR5cGVvZiBlP2U6ZS50b1N0cmluZyh0aGlzLl9jb25maWcuZW5jb2RpbmcpKSxpJiYoaT0hMSx0aGlzLl9jaGVja0lzRmluaXNoZWQoKSx0aGlzLnBhcnNlQ2h1bmsodC5zaGlmdCgpKSl9Y2F0Y2goZSl7dGhpcy5fc3RyZWFtRXJyb3IoZSl9fSx0aGlzKSx0aGlzLl9zdHJlYW1FcnJvcj12KGZ1bmN0aW9uKGUpe3RoaXMuX3N0cmVhbUNsZWFuVXAoKSx0aGlzLl9zZW5kRXJyb3IoZSl9LHRoaXMpLHRoaXMuX3N0cmVhbUVuZD12KGZ1bmN0aW9uKCl7dGhpcy5fc3RyZWFtQ2xlYW5VcCgpLHI9ITAsdGhpcy5fc3RyZWFtRGF0YShcIlwiKX0sdGhpcyksdGhpcy5fc3RyZWFtQ2xlYW5VcD12KGZ1bmN0aW9uKCl7dGhpcy5faW5wdXQucmVtb3ZlTGlzdGVuZXIoXCJkYXRhXCIsdGhpcy5fc3RyZWFtRGF0YSksdGhpcy5faW5wdXQucmVtb3ZlTGlzdGVuZXIoXCJlbmRcIix0aGlzLl9zdHJlYW1FbmQpLHRoaXMuX2lucHV0LnJlbW92ZUxpc3RlbmVyKFwiZXJyb3JcIix0aGlzLl9zdHJlYW1FcnJvcil9LHRoaXMpfWZ1bmN0aW9uIGkobSl7dmFyIGEsbyxoLHI9TWF0aC5wb3coMiw1Myksbj0tcixzPS9eXFxzKi0/KFxcZCtcXC4/fFxcLlxcZCt8XFxkK1xcLlxcZCspKFtlRV1bLStdP1xcZCspP1xccyokLyx1PS9eKFxcZHs0fS1bMDFdXFxkLVswLTNdXFxkVFswLTJdXFxkOlswLTVdXFxkOlswLTVdXFxkXFwuXFxkKyhbKy1dWzAtMl1cXGQ6WzAtNV1cXGR8WikpfChcXGR7NH0tWzAxXVxcZC1bMC0zXVxcZFRbMC0yXVxcZDpbMC01XVxcZDpbMC01XVxcZChbKy1dWzAtMl1cXGQ6WzAtNV1cXGR8WikpfChcXGR7NH0tWzAxXVxcZC1bMC0zXVxcZFRbMC0yXVxcZDpbMC01XVxcZChbKy1dWzAtMl1cXGQ6WzAtNV1cXGR8WikpJC8sdD10aGlzLGk9MCxmPTAsZD0hMSxlPSExLGw9W10sYz17ZGF0YTpbXSxlcnJvcnM6W10sbWV0YTp7fX07aWYoTShtLnN0ZXApKXt2YXIgcD1tLnN0ZXA7bS5zdGVwPWZ1bmN0aW9uKGUpe2lmKGM9ZSxfKCkpZygpO2Vsc2V7aWYoZygpLDA9PT1jLmRhdGEubGVuZ3RoKXJldHVybjtpKz1lLmRhdGEubGVuZ3RoLG0ucHJldmlldyYmaT5tLnByZXZpZXc/by5hYm9ydCgpOihjLmRhdGE9Yy5kYXRhWzBdLHAoYyx0KSl9fX1mdW5jdGlvbiB5KGUpe3JldHVyblwiZ3JlZWR5XCI9PT1tLnNraXBFbXB0eUxpbmVzP1wiXCI9PT1lLmpvaW4oXCJcIikudHJpbSgpOjE9PT1lLmxlbmd0aCYmMD09PWVbMF0ubGVuZ3RofWZ1bmN0aW9uIGcoKXtyZXR1cm4gYyYmaCYmKGsoXCJEZWxpbWl0ZXJcIixcIlVuZGV0ZWN0YWJsZURlbGltaXRlclwiLFwiVW5hYmxlIHRvIGF1dG8tZGV0ZWN0IGRlbGltaXRpbmcgY2hhcmFjdGVyOyBkZWZhdWx0ZWQgdG8gJ1wiK2IuRGVmYXVsdERlbGltaXRlcitcIidcIiksaD0hMSksbS5za2lwRW1wdHlMaW5lcyYmKGMuZGF0YT1jLmRhdGEuZmlsdGVyKGZ1bmN0aW9uKGUpe3JldHVybiF5KGUpfSkpLF8oKSYmZnVuY3Rpb24oKXtpZighYylyZXR1cm47ZnVuY3Rpb24gZShlLHQpe00obS50cmFuc2Zvcm1IZWFkZXIpJiYoZT1tLnRyYW5zZm9ybUhlYWRlcihlLHQpKSxsLnB1c2goZSl9aWYoQXJyYXkuaXNBcnJheShjLmRhdGFbMF0pKXtmb3IodmFyIHQ9MDtfKCkmJnQ8Yy5kYXRhLmxlbmd0aDt0KyspYy5kYXRhW3RdLmZvckVhY2goZSk7Yy5kYXRhLnNwbGljZSgwLDEpfWVsc2UgYy5kYXRhLmZvckVhY2goZSl9KCksZnVuY3Rpb24oKXtpZighY3x8IW0uaGVhZGVyJiYhbS5keW5hbWljVHlwaW5nJiYhbS50cmFuc2Zvcm0pcmV0dXJuIGM7ZnVuY3Rpb24gZShlLHQpe3ZhciBpLHI9bS5oZWFkZXI/e306W107Zm9yKGk9MDtpPGUubGVuZ3RoO2krKyl7dmFyIG49aSxzPWVbaV07bS5oZWFkZXImJihuPWk+PWwubGVuZ3RoP1wiX19wYXJzZWRfZXh0cmFcIjpsW2ldKSxtLnRyYW5zZm9ybSYmKHM9bS50cmFuc2Zvcm0ocyxuKSkscz12KG4scyksXCJfX3BhcnNlZF9leHRyYVwiPT09bj8ocltuXT1yW25dfHxbXSxyW25dLnB1c2gocykpOnJbbl09c31yZXR1cm4gbS5oZWFkZXImJihpPmwubGVuZ3RoP2soXCJGaWVsZE1pc21hdGNoXCIsXCJUb29NYW55RmllbGRzXCIsXCJUb28gbWFueSBmaWVsZHM6IGV4cGVjdGVkIFwiK2wubGVuZ3RoK1wiIGZpZWxkcyBidXQgcGFyc2VkIFwiK2ksZit0KTppPGwubGVuZ3RoJiZrKFwiRmllbGRNaXNtYXRjaFwiLFwiVG9vRmV3RmllbGRzXCIsXCJUb28gZmV3IGZpZWxkczogZXhwZWN0ZWQgXCIrbC5sZW5ndGgrXCIgZmllbGRzIGJ1dCBwYXJzZWQgXCIraSxmK3QpKSxyfXZhciB0PTE7IWMuZGF0YS5sZW5ndGh8fEFycmF5LmlzQXJyYXkoYy5kYXRhWzBdKT8oYy5kYXRhPWMuZGF0YS5tYXAoZSksdD1jLmRhdGEubGVuZ3RoKTpjLmRhdGE9ZShjLmRhdGEsMCk7bS5oZWFkZXImJmMubWV0YSYmKGMubWV0YS5maWVsZHM9bCk7cmV0dXJuIGYrPXQsY30oKX1mdW5jdGlvbiBfKCl7cmV0dXJuIG0uaGVhZGVyJiYwPT09bC5sZW5ndGh9ZnVuY3Rpb24gdihlLHQpe3JldHVybiBpPWUsbS5keW5hbWljVHlwaW5nRnVuY3Rpb24mJnZvaWQgMD09PW0uZHluYW1pY1R5cGluZ1tpXSYmKG0uZHluYW1pY1R5cGluZ1tpXT1tLmR5bmFtaWNUeXBpbmdGdW5jdGlvbihpKSksITA9PT0obS5keW5hbWljVHlwaW5nW2ldfHxtLmR5bmFtaWNUeXBpbmcpP1widHJ1ZVwiPT09dHx8XCJUUlVFXCI9PT10fHxcImZhbHNlXCIhPT10JiZcIkZBTFNFXCIhPT10JiYoZnVuY3Rpb24oZSl7aWYocy50ZXN0KGUpKXt2YXIgdD1wYXJzZUZsb2F0KGUpO2lmKG48dCYmdDxyKXJldHVybiEwfXJldHVybiExfSh0KT9wYXJzZUZsb2F0KHQpOnUudGVzdCh0KT9uZXcgRGF0ZSh0KTpcIlwiPT09dD9udWxsOnQpOnQ7dmFyIGl9ZnVuY3Rpb24gayhlLHQsaSxyKXt2YXIgbj17dHlwZTplLGNvZGU6dCxtZXNzYWdlOml9O3ZvaWQgMCE9PXImJihuLnJvdz1yKSxjLmVycm9ycy5wdXNoKG4pfXRoaXMucGFyc2U9ZnVuY3Rpb24oZSx0LGkpe3ZhciByPW0ucXVvdGVDaGFyfHwnXCInO2lmKG0ubmV3bGluZXx8KG0ubmV3bGluZT1mdW5jdGlvbihlLHQpe2U9ZS5zdWJzdHJpbmcoMCwxMDQ4NTc2KTt2YXIgaT1uZXcgUmVnRXhwKGoodCkrXCIoW15dKj8pXCIraih0KSxcImdtXCIpLHI9KGU9ZS5yZXBsYWNlKGksXCJcIikpLnNwbGl0KFwiXFxyXCIpLG49ZS5zcGxpdChcIlxcblwiKSxzPTE8bi5sZW5ndGgmJm5bMF0ubGVuZ3RoPHJbMF0ubGVuZ3RoO2lmKDE9PT1yLmxlbmd0aHx8cylyZXR1cm5cIlxcblwiO2Zvcih2YXIgYT0wLG89MDtvPHIubGVuZ3RoO28rKylcIlxcblwiPT09cltvXVswXSYmYSsrO3JldHVybiBhPj1yLmxlbmd0aC8yP1wiXFxyXFxuXCI6XCJcXHJcIn0oZSxyKSksaD0hMSxtLmRlbGltaXRlcilNKG0uZGVsaW1pdGVyKSYmKG0uZGVsaW1pdGVyPW0uZGVsaW1pdGVyKGUpLGMubWV0YS5kZWxpbWl0ZXI9bS5kZWxpbWl0ZXIpO2Vsc2V7dmFyIG49ZnVuY3Rpb24oZSx0LGkscixuKXt2YXIgcyxhLG8saDtuPW58fFtcIixcIixcIlxcdFwiLFwifFwiLFwiO1wiLGIuUkVDT1JEX1NFUCxiLlVOSVRfU0VQXTtmb3IodmFyIHU9MDt1PG4ubGVuZ3RoO3UrKyl7dmFyIGY9blt1XSxkPTAsbD0wLGM9MDtvPXZvaWQgMDtmb3IodmFyIHA9bmV3IEUoe2NvbW1lbnRzOnIsZGVsaW1pdGVyOmYsbmV3bGluZTp0LHByZXZpZXc6MTB9KS5wYXJzZShlKSxnPTA7ZzxwLmRhdGEubGVuZ3RoO2crKylpZihpJiZ5KHAuZGF0YVtnXSkpYysrO2Vsc2V7dmFyIF89cC5kYXRhW2ddLmxlbmd0aDtsKz1fLHZvaWQgMCE9PW8/MDxfJiYoZCs9TWF0aC5hYnMoXy1vKSxvPV8pOm89X30wPHAuZGF0YS5sZW5ndGgmJihsLz1wLmRhdGEubGVuZ3RoLWMpLCh2b2lkIDA9PT1hfHxkPD1hKSYmKHZvaWQgMD09PWh8fGg8bCkmJjEuOTk8bCYmKGE9ZCxzPWYsaD1sKX1yZXR1cm57c3VjY2Vzc2Z1bDohIShtLmRlbGltaXRlcj1zKSxiZXN0RGVsaW1pdGVyOnN9fShlLG0ubmV3bGluZSxtLnNraXBFbXB0eUxpbmVzLG0uY29tbWVudHMsbS5kZWxpbWl0ZXJzVG9HdWVzcyk7bi5zdWNjZXNzZnVsP20uZGVsaW1pdGVyPW4uYmVzdERlbGltaXRlcjooaD0hMCxtLmRlbGltaXRlcj1iLkRlZmF1bHREZWxpbWl0ZXIpLGMubWV0YS5kZWxpbWl0ZXI9bS5kZWxpbWl0ZXJ9dmFyIHM9dyhtKTtyZXR1cm4gbS5wcmV2aWV3JiZtLmhlYWRlciYmcy5wcmV2aWV3KyssYT1lLG89bmV3IEUocyksYz1vLnBhcnNlKGEsdCxpKSxnKCksZD97bWV0YTp7cGF1c2VkOiEwfX06Y3x8e21ldGE6e3BhdXNlZDohMX19fSx0aGlzLnBhdXNlZD1mdW5jdGlvbigpe3JldHVybiBkfSx0aGlzLnBhdXNlPWZ1bmN0aW9uKCl7ZD0hMCxvLmFib3J0KCksYT1NKG0uY2h1bmspP1wiXCI6YS5zdWJzdHJpbmcoby5nZXRDaGFySW5kZXgoKSl9LHRoaXMucmVzdW1lPWZ1bmN0aW9uKCl7dC5zdHJlYW1lci5faGFsdGVkPyhkPSExLHQuc3RyZWFtZXIucGFyc2VDaHVuayhhLCEwKSk6c2V0VGltZW91dCh0LnJlc3VtZSwzKX0sdGhpcy5hYm9ydGVkPWZ1bmN0aW9uKCl7cmV0dXJuIGV9LHRoaXMuYWJvcnQ9ZnVuY3Rpb24oKXtlPSEwLG8uYWJvcnQoKSxjLm1ldGEuYWJvcnRlZD0hMCxNKG0uY29tcGxldGUpJiZtLmNvbXBsZXRlKGMpLGE9XCJcIn19ZnVuY3Rpb24gaihlKXtyZXR1cm4gZS5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZyxcIlxcXFwkJlwiKX1mdW5jdGlvbiBFKGUpe3ZhciBTLE89KGU9ZXx8e30pLmRlbGltaXRlcix4PWUubmV3bGluZSxJPWUuY29tbWVudHMsVD1lLnN0ZXAsRD1lLnByZXZpZXcsQT1lLmZhc3RNb2RlLEw9Uz12b2lkIDA9PT1lLnF1b3RlQ2hhcnx8bnVsbD09PWUucXVvdGVDaGFyPydcIic6ZS5xdW90ZUNoYXI7aWYodm9pZCAwIT09ZS5lc2NhcGVDaGFyJiYoTD1lLmVzY2FwZUNoYXIpLChcInN0cmluZ1wiIT10eXBlb2YgT3x8LTE8Yi5CQURfREVMSU1JVEVSUy5pbmRleE9mKE8pKSYmKE89XCIsXCIpLEk9PT1PKXRocm93IG5ldyBFcnJvcihcIkNvbW1lbnQgY2hhcmFjdGVyIHNhbWUgYXMgZGVsaW1pdGVyXCIpOyEwPT09ST9JPVwiI1wiOihcInN0cmluZ1wiIT10eXBlb2YgSXx8LTE8Yi5CQURfREVMSU1JVEVSUy5pbmRleE9mKEkpKSYmKEk9ITEpLFwiXFxuXCIhPT14JiZcIlxcclwiIT09eCYmXCJcXHJcXG5cIiE9PXgmJih4PVwiXFxuXCIpO3ZhciBGPTAsej0hMTt0aGlzLnBhcnNlPWZ1bmN0aW9uKHIsdCxpKXtpZihcInN0cmluZ1wiIT10eXBlb2Ygcil0aHJvdyBuZXcgRXJyb3IoXCJJbnB1dCBtdXN0IGJlIGEgc3RyaW5nXCIpO3ZhciBuPXIubGVuZ3RoLGU9Ty5sZW5ndGgscz14Lmxlbmd0aCxhPUkubGVuZ3RoLG89TShUKSxoPVtdLHU9W10sZj1bXSxkPUY9MDtpZighcilyZXR1cm4gQygpO2lmKEF8fCExIT09QSYmLTE9PT1yLmluZGV4T2YoUykpe2Zvcih2YXIgbD1yLnNwbGl0KHgpLGM9MDtjPGwubGVuZ3RoO2MrKyl7aWYoZj1sW2NdLEYrPWYubGVuZ3RoLGMhPT1sLmxlbmd0aC0xKUYrPXgubGVuZ3RoO2Vsc2UgaWYoaSlyZXR1cm4gQygpO2lmKCFJfHxmLnN1YnN0cmluZygwLGEpIT09SSl7aWYobyl7aWYoaD1bXSxrKGYuc3BsaXQoTykpLFIoKSx6KXJldHVybiBDKCl9ZWxzZSBrKGYuc3BsaXQoTykpO2lmKEQmJkQ8PWMpcmV0dXJuIGg9aC5zbGljZSgwLEQpLEMoITApfX1yZXR1cm4gQygpfWZvcih2YXIgcD1yLmluZGV4T2YoTyxGKSxnPXIuaW5kZXhPZih4LEYpLF89bmV3IFJlZ0V4cChqKEwpK2ooUyksXCJnXCIpLG09ci5pbmRleE9mKFMsRik7OylpZihyW0ZdIT09UylpZihJJiYwPT09Zi5sZW5ndGgmJnIuc3Vic3RyaW5nKEYsRithKT09PUkpe2lmKC0xPT09ZylyZXR1cm4gQygpO0Y9ZytzLGc9ci5pbmRleE9mKHgsRikscD1yLmluZGV4T2YoTyxGKX1lbHNlIGlmKC0xIT09cCYmKHA8Z3x8LTE9PT1nKSlmLnB1c2goci5zdWJzdHJpbmcoRixwKSksRj1wK2UscD1yLmluZGV4T2YoTyxGKTtlbHNle2lmKC0xPT09ZylicmVhaztpZihmLnB1c2goci5zdWJzdHJpbmcoRixnKSksdyhnK3MpLG8mJihSKCkseikpcmV0dXJuIEMoKTtpZihEJiZoLmxlbmd0aD49RClyZXR1cm4gQyghMCl9ZWxzZSBmb3IobT1GLEYrKzs7KXtpZigtMT09PShtPXIuaW5kZXhPZihTLG0rMSkpKXJldHVybiBpfHx1LnB1c2goe3R5cGU6XCJRdW90ZXNcIixjb2RlOlwiTWlzc2luZ1F1b3Rlc1wiLG1lc3NhZ2U6XCJRdW90ZWQgZmllbGQgdW50ZXJtaW5hdGVkXCIscm93OmgubGVuZ3RoLGluZGV4OkZ9KSxFKCk7aWYobT09PW4tMSlyZXR1cm4gRShyLnN1YnN0cmluZyhGLG0pLnJlcGxhY2UoXyxTKSk7aWYoUyE9PUx8fHJbbSsxXSE9PUwpe2lmKFM9PT1MfHwwPT09bXx8clttLTFdIT09TCl7LTEhPT1wJiZwPG0rMSYmKHA9ci5pbmRleE9mKE8sbSsxKSksLTEhPT1nJiZnPG0rMSYmKGc9ci5pbmRleE9mKHgsbSsxKSk7dmFyIHk9YigtMT09PWc/cDpNYXRoLm1pbihwLGcpKTtpZihyLnN1YnN0cihtKzEreSxlKT09PU8pe2YucHVzaChyLnN1YnN0cmluZyhGLG0pLnJlcGxhY2UoXyxTKSkscltGPW0rMSt5K2VdIT09UyYmKG09ci5pbmRleE9mKFMsRikpLHA9ci5pbmRleE9mKE8sRiksZz1yLmluZGV4T2YoeCxGKTticmVha312YXIgdj1iKGcpO2lmKHIuc3Vic3RyaW5nKG0rMSt2LG0rMSt2K3MpPT09eCl7aWYoZi5wdXNoKHIuc3Vic3RyaW5nKEYsbSkucmVwbGFjZShfLFMpKSx3KG0rMSt2K3MpLHA9ci5pbmRleE9mKE8sRiksbT1yLmluZGV4T2YoUyxGKSxvJiYoUigpLHopKXJldHVybiBDKCk7aWYoRCYmaC5sZW5ndGg+PUQpcmV0dXJuIEMoITApO2JyZWFrfXUucHVzaCh7dHlwZTpcIlF1b3Rlc1wiLGNvZGU6XCJJbnZhbGlkUXVvdGVzXCIsbWVzc2FnZTpcIlRyYWlsaW5nIHF1b3RlIG9uIHF1b3RlZCBmaWVsZCBpcyBtYWxmb3JtZWRcIixyb3c6aC5sZW5ndGgsaW5kZXg6Rn0pLG0rK319ZWxzZSBtKyt9cmV0dXJuIEUoKTtmdW5jdGlvbiBrKGUpe2gucHVzaChlKSxkPUZ9ZnVuY3Rpb24gYihlKXt2YXIgdD0wO2lmKC0xIT09ZSl7dmFyIGk9ci5zdWJzdHJpbmcobSsxLGUpO2kmJlwiXCI9PT1pLnRyaW0oKSYmKHQ9aS5sZW5ndGgpfXJldHVybiB0fWZ1bmN0aW9uIEUoZSl7cmV0dXJuIGl8fCh2b2lkIDA9PT1lJiYoZT1yLnN1YnN0cmluZyhGKSksZi5wdXNoKGUpLEY9bixrKGYpLG8mJlIoKSksQygpfWZ1bmN0aW9uIHcoZSl7Rj1lLGsoZiksZj1bXSxnPXIuaW5kZXhPZih4LEYpfWZ1bmN0aW9uIEMoZSl7cmV0dXJue2RhdGE6aCxlcnJvcnM6dSxtZXRhOntkZWxpbWl0ZXI6TyxsaW5lYnJlYWs6eCxhYm9ydGVkOnosdHJ1bmNhdGVkOiEhZSxjdXJzb3I6ZCsodHx8MCl9fX1mdW5jdGlvbiBSKCl7VChDKCkpLGg9W10sdT1bXX19LHRoaXMuYWJvcnQ9ZnVuY3Rpb24oKXt6PSEwfSx0aGlzLmdldENoYXJJbmRleD1mdW5jdGlvbigpe3JldHVybiBGfX1mdW5jdGlvbiBfKGUpe3ZhciB0PWUuZGF0YSxpPWFbdC53b3JrZXJJZF0scj0hMTtpZih0LmVycm9yKWkudXNlckVycm9yKHQuZXJyb3IsdC5maWxlKTtlbHNlIGlmKHQucmVzdWx0cyYmdC5yZXN1bHRzLmRhdGEpe3ZhciBuPXthYm9ydDpmdW5jdGlvbigpe3I9ITAsbSh0LndvcmtlcklkLHtkYXRhOltdLGVycm9yczpbXSxtZXRhOnthYm9ydGVkOiEwfX0pfSxwYXVzZTp5LHJlc3VtZTp5fTtpZihNKGkudXNlclN0ZXApKXtmb3IodmFyIHM9MDtzPHQucmVzdWx0cy5kYXRhLmxlbmd0aCYmKGkudXNlclN0ZXAoe2RhdGE6dC5yZXN1bHRzLmRhdGFbc10sZXJyb3JzOnQucmVzdWx0cy5lcnJvcnMsbWV0YTp0LnJlc3VsdHMubWV0YX0sbiksIXIpO3MrKyk7ZGVsZXRlIHQucmVzdWx0c31lbHNlIE0oaS51c2VyQ2h1bmspJiYoaS51c2VyQ2h1bmsodC5yZXN1bHRzLG4sdC5maWxlKSxkZWxldGUgdC5yZXN1bHRzKX10LmZpbmlzaGVkJiYhciYmbSh0LndvcmtlcklkLHQucmVzdWx0cyl9ZnVuY3Rpb24gbShlLHQpe3ZhciBpPWFbZV07TShpLnVzZXJDb21wbGV0ZSkmJmkudXNlckNvbXBsZXRlKHQpLGkudGVybWluYXRlKCksZGVsZXRlIGFbZV19ZnVuY3Rpb24geSgpe3Rocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZC5cIil9ZnVuY3Rpb24gdyhlKXtpZihcIm9iamVjdFwiIT10eXBlb2YgZXx8bnVsbD09PWUpcmV0dXJuIGU7dmFyIHQ9QXJyYXkuaXNBcnJheShlKT9bXTp7fTtmb3IodmFyIGkgaW4gZSl0W2ldPXcoZVtpXSk7cmV0dXJuIHR9ZnVuY3Rpb24gdihlLHQpe3JldHVybiBmdW5jdGlvbigpe2UuYXBwbHkodCxhcmd1bWVudHMpfX1mdW5jdGlvbiBNKGUpe3JldHVyblwiZnVuY3Rpb25cIj09dHlwZW9mIGV9cmV0dXJuIG8mJihmLm9ubWVzc2FnZT1mdW5jdGlvbihlKXt2YXIgdD1lLmRhdGE7dm9pZCAwPT09Yi5XT1JLRVJfSUQmJnQmJihiLldPUktFUl9JRD10LndvcmtlcklkKTtpZihcInN0cmluZ1wiPT10eXBlb2YgdC5pbnB1dClmLnBvc3RNZXNzYWdlKHt3b3JrZXJJZDpiLldPUktFUl9JRCxyZXN1bHRzOmIucGFyc2UodC5pbnB1dCx0LmNvbmZpZyksZmluaXNoZWQ6ITB9KTtlbHNlIGlmKGYuRmlsZSYmdC5pbnB1dCBpbnN0YW5jZW9mIEZpbGV8fHQuaW5wdXQgaW5zdGFuY2VvZiBPYmplY3Qpe3ZhciBpPWIucGFyc2UodC5pbnB1dCx0LmNvbmZpZyk7aSYmZi5wb3N0TWVzc2FnZSh7d29ya2VySWQ6Yi5XT1JLRVJfSUQscmVzdWx0czppLGZpbmlzaGVkOiEwfSl9fSksKGwucHJvdG90eXBlPU9iamVjdC5jcmVhdGUodS5wcm90b3R5cGUpKS5jb25zdHJ1Y3Rvcj1sLChjLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKHUucHJvdG90eXBlKSkuY29uc3RydWN0b3I9YywocC5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShwLnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yPXAsKGcucHJvdG90eXBlPU9iamVjdC5jcmVhdGUodS5wcm90b3R5cGUpKS5jb25zdHJ1Y3Rvcj1nLGJ9KTsiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwidmFyIG5leHRUaWNrID0gcmVxdWlyZSgncHJvY2Vzcy9icm93c2VyLmpzJykubmV4dFRpY2s7XG52YXIgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHk7XG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaW1tZWRpYXRlSWRzID0ge307XG52YXIgbmV4dEltbWVkaWF0ZUlkID0gMDtcblxuLy8gRE9NIEFQSXMsIGZvciBjb21wbGV0ZW5lc3NcblxuZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldFRpbWVvdXQsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcbn07XG5leHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFySW50ZXJ2YWwpO1xufTtcbmV4cG9ydHMuY2xlYXJUaW1lb3V0ID1cbmV4cG9ydHMuY2xlYXJJbnRlcnZhbCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHsgdGltZW91dC5jbG9zZSgpOyB9O1xuXG5mdW5jdGlvbiBUaW1lb3V0KGlkLCBjbGVhckZuKSB7XG4gIHRoaXMuX2lkID0gaWQ7XG4gIHRoaXMuX2NsZWFyRm4gPSBjbGVhckZuO1xufVxuVGltZW91dC5wcm90b3R5cGUudW5yZWYgPSBUaW1lb3V0LnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbigpIHt9O1xuVGltZW91dC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fY2xlYXJGbi5jYWxsKHdpbmRvdywgdGhpcy5faWQpO1xufTtcblxuLy8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5leHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcbn07XG5cbmV4cG9ydHMudW5lbnJvbGwgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcbn07XG5cbmV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuICB2YXIgbXNlY3MgPSBpdGVtLl9pZGxlVGltZW91dDtcbiAgaWYgKG1zZWNzID49IDApIHtcbiAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG4gICAgICBpZiAoaXRlbS5fb25UaW1lb3V0KVxuICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcbiAgICB9LCBtc2Vjcyk7XG4gIH1cbn07XG5cbi8vIFRoYXQncyBub3QgaG93IG5vZGUuanMgaW1wbGVtZW50cyBpdCBidXQgdGhlIGV4cG9zZWQgYXBpIGlzIHRoZSBzYW1lLlxuZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBzZXRJbW1lZGlhdGUgOiBmdW5jdGlvbihmbikge1xuICB2YXIgaWQgPSBuZXh0SW1tZWRpYXRlSWQrKztcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGZhbHNlIDogc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIGltbWVkaWF0ZUlkc1tpZF0gPSB0cnVlO1xuXG4gIG5leHRUaWNrKGZ1bmN0aW9uIG9uTmV4dFRpY2soKSB7XG4gICAgaWYgKGltbWVkaWF0ZUlkc1tpZF0pIHtcbiAgICAgIC8vIGZuLmNhbGwoKSBpcyBmYXN0ZXIgc28gd2Ugb3B0aW1pemUgZm9yIHRoZSBjb21tb24gdXNlLWNhc2VcbiAgICAgIC8vIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vY2FsbC1hcHBseS1zZWd1XG4gICAgICBpZiAoYXJncykge1xuICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZuLmNhbGwobnVsbCk7XG4gICAgICB9XG4gICAgICAvLyBQcmV2ZW50IGlkcyBmcm9tIGxlYWtpbmdcbiAgICAgIGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUoaWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGlkO1xufTtcblxuZXhwb3J0cy5jbGVhckltbWVkaWF0ZSA9IHR5cGVvZiBjbGVhckltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gY2xlYXJJbW1lZGlhdGUgOiBmdW5jdGlvbihpZCkge1xuICBkZWxldGUgaW1tZWRpYXRlSWRzW2lkXTtcbn07IiwiLypcbkBsaWNzdGFydCAgVGhlIGZvbGxvd2luZyBpcyB0aGUgZW50aXJlIGxpY2Vuc2Ugbm90aWNlIGZvciB0aGUgSmF2YVNjcmlwdCBjb2RlIGluIHRoaXMgcGFnZS5cblxuICAgIENvcHlyaWdodCAoYykgMjAxOSwgSmltIEFsbG1hblxuXG4gICAgQWxsIHJpZ2h0cyByZXNlcnZlZC5cblxuICAgIFJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dFxuICAgIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuXG4gICAgUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gICAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG5cbiAgICBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gICAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvblxuICAgIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuXG4gICAgVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCJcbiAgICBBTkQgQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gICAgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFXG4gICAgRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRVxuICAgIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMXG4gICAgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1JcbiAgICBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUlxuICAgIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksXG4gICAgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0VcbiAgICBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuXG5AbGljZW5kICBUaGUgYWJvdmUgaXMgdGhlIGVudGlyZSBsaWNlbnNlIG5vdGljZSBmb3IgdGhlIEphdmFTY3JpcHQgY29kZSBpbiB0aGlzIHBhZ2UuXG4qL1xuXG4vKlxuICogQ2xpZW50LXNpZGUgYmVoYXZpb3IgZm9yIHRoZSBPcGVuIFRyZWUgbmFtZS1yZXNvbHV0aW9uIFVJXG4gKlxuICogVGhpcyB1c2VzIHRoZSBPcGVuIFRyZWUgQVBJIHRvIHJlc29sdmUgbGFyZ2Ugc2V0cyBvZiBsYWJlbHMgdG8gdGF4b25vbWljIG5hbWVzLlxuICovXG52YXIgSlNaaXAgPSByZXF1aXJlKCdqc3ppcCcpLFxuICAgIEZpbGVTYXZlciA9IHJlcXVpcmUoJ2ZpbGUtc2F2ZXInKSxcbiAgICBCbG9iID0gcmVxdWlyZSgnYmxvYi1wb2x5ZmlsbCcpLFxuICAgIFBhcGEgPSByZXF1aXJlKCdwYXBhcGFyc2UnKSxcbiAgICBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKTtcblxuLyogVGhlc2UgdmFyaWFibGVzIHNob3VsZCBhbHJlYWR5IGJlIGRlZmluZWQgaW4gdGhlIG1haW4gSFRNTCBwYWdlLiBXZSBzaG91bGRcbiAqIE5PVCBkZWNsYXJlIHRoZW0gaGVyZSwgb3IgdGhpcyB3aWxsIGhpZGUgdGhlaXIgXCJnbG9iYWxcIiB2YWx1ZXMuXG52YXIgaW5pdGlhbFN0YXRlO1xudmFyIGRvVE5SU0ZvckF1dG9jb21wbGV0ZV91cmw7XG52YXIgZG9UTlJTRm9yTWFwcGluZ09UVXNfdXJsO1xudmFyIGdldENvbnRleHRGb3JOYW1lc191cmw7XG52YXIgcmVuZGVyX21hcmtkb3duX3VybDtcbiovXG5cbi8vIHNvbWV0aW1lcyB3ZSB1c2UgdGhpcyBzY3JpcHQgaW4gb3RoZXIgcGFnZXM7IGxldCdzIGNoZWNrIVxudmFyIGNvbnRleHQ7XG5pZiAod2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoXCIvY3VyYXRvci90bnJzL1wiKSA9PT0gMCkge1xuICAgIGNvbnRleHQgPSAnQlVMS19UTlJTJztcbn0gZWxzZSBpZiAod2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoXCIvY3VyYXRvci9zdHVkeS9lZGl0L1wiKSA9PT0gMCkge1xuICAgIGNvbnRleHQgPSAnU1RVRFlfT1RVX01BUFBJTkcnO1xufSBlbHNlIHtcbiAgICBjb250ZXh0ID0gJz8/Pyc7XG59XG5cbi8qIFJldHVybiB0aGUgZGF0YSBtb2RlbCBmb3IgYSBuZXcgbmFtZXNldCAob3VyIEpTT04gcmVwcmVzZW50YXRpb24pICovXG52YXIgZ2V0TmV3TmFtZXNldE1vZGVsID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgIHZhciBvYmogPSB7XG4gICAgICAgICdtZXRhZGF0YSc6IHtcbiAgICAgICAgICAgICduYW1lJzogXCJVbnRpdGxlZCBuYW1lc2V0XCIsXG4gICAgICAgICAgICAnZGVzY3JpcHRpb24nOiBcIlwiLFxuICAgICAgICAgICAgJ2F1dGhvcnMnOiBbIF0sICAgLy8gYXNzaWduIGltbWVkaWF0ZWx5IHRvIHRoaXMgdXNlcj9cbiAgICAgICAgICAgICdkYXRlX2NyZWF0ZWQnOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAnbGFzdF9zYXZlZCc6IG51bGwsXG4gICAgICAgICAgICAnc2F2ZV9jb3VudCc6IDAsICAvLyB1c2UgdG8gc3VnZ2VzdCB1bmlxdWUgKG51bWJlcmVkKSBmaWxlbmFtZXNcbiAgICAgICAgICAgICdwcmV2aW91c19maWxlbmFtZSc6IG51bGwsICAvLyB3aGF0IGZpbGUgd2UgbG9hZGVkIGJlZm9yZSBkb2luZyB0aGlzIHdvcmtcbiAgICAgICAgICAgICdsYXRlc3Rfb3R0X3ZlcnNpb24nOiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIFwibWFwcGluZ0hpbnRzXCI6IHsgICAgICAgLy8gT1IgbmFtZU1hcHBpbmdIaW50cz9cbiAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBaWRzIGZvciBtYXBwaW5nIGxpc3RlZCBuYW1lcyB0byBPVFQgdGF4YVwiLFxuICAgICAgICAgICAgXCJzZWFyY2hDb250ZXh0XCI6IFwiQWxsIGxpZmVcIixcbiAgICAgICAgICAgIFwidXNlRnV6enlNYXRjaGluZ1wiOiBmYWxzZSxcbiAgICAgICAgICAgIFwiYXV0b0FjY2VwdEV4YWN0TWF0Y2hlc1wiOiBmYWxzZSxcbiAgICAgICAgICAgIFwic3Vic3RpdHV0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgLyogdHlwaWNhbCB2YWx1ZXMgaW4gdXNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBcImFjdGl2ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJvbGRcIjogXCIuKiAoW0EtWl1bYS16XSsgW2Etei5dKyBbQS1aIDAtOV0rKSRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJuZXdcIjogXCIkMVwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbGlkXCI6IHRydWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgLyogc3RhcnQgd2l0aCBvbmUgZW1wdHkvbmV3IHN1YnN0aXR1dGlvbiAqL1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCJhY3RpdmVcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgXCJvbGRcIjogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJuZXdcIjogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWxpZFwiOiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgJ25hbWVzJzogW1xuICAgICAgICAgICAgLy8gZWFjaCBzaG91bGQgaW5jbHVkZSBhIHVuaXF1ZSBpZCwgb3JpZ2luYWwgbmFtZSwgbWFudWFsbHkgZWRpdGVkL2FkanVzdGVkIG5hbWUsIGFuZCBhbnkgbWFwcGVkIG5hbWUvdGF4b25cbiAgICAgICAgICAgIC8qIGhlcmUncyBhIHR5cGljYWwgZXhhbXBsZSwgd2l0aCBhbiBhcmJpdHJhcnkvc2VyaWFsIElEXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIm5hbWUyM1wiLFxuICAgICAgICAgICAgICAgIFwib3JpZ2luYWxMYWJlbFwiOiBcIkJhY3RlcmlhIFByb3Rlb2JhY3RlcmlhIEdhbW1hcHJvdGVvYmFjdGVyaWEgT2NlYW5vc3BpcmlsbGFsZXMgU2FjY2hhcm9zcGlyaWxsYWNlYWUgU2FjY2hhcm9zcGlyaWxsdW0gaW1wYXRpZW5zIERTTSAxMjU0NlwiLFxuICAgICAgICAgICAgICAgIFwiYWRqdXN0ZWRMYWJlbFwiOiBcIlByb2VvYmFjdGVyaWFcIiwgIC8vIFdBUyAnXm90OmFsdExhYmVsJ1xuICAgICAgICAgICAgICAgIFwib3R0VGF4b25OYW1lXCI6IFwiU2FjY2hhcm9zcGlyaWxsdW0gaW1wYXRpZW5zIERTTSAxMjU0NlwiLFxuICAgICAgICAgICAgICAgIFwib3R0SWRcIjogMTMyNzUxLFxuICAgICAgICAgICAgICAgIFwidGF4b25vbWljU291cmNlc1wiOiBbXCJzaWx2YTpBMTYzNzkvIzFcIiwgXCJuY2JpOjJcIiwgXCJ3b3Jtczo2XCIsIFwiZ2JpZjozXCIsIFwiaXJtbmc6MTNcIl1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICovXG4gICAgICAgIF1cbiAgICB9O1xuICAgIC8qIFRPRE86IEFwcGx5IG9wdGlvbmFsIG1vZGlmaWNhdGlvbnM/XG4gICAgaWYgKG9wdGlvbnMuQkxBSCkge1xuICAgICAgICBvYmoubWV0YWRhdGEuRk9PID0gJ0JBUic7XG4gICAgfVxuICAgICovXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbnZhciBwYXBhUGFyc2VDb25maWcgPSB7XG4gICAgLyogVHJ5IHRvIGFjY29tb2RhdGUgZGlmZmVyZW50IGRlbGltaXRlcnMsIGxpbmUgZW5kaW5ncywgZXRjLlxuICAgICAqIEZvciBhbGwgc2V0dGluZ3MgYW5kIGRlZmF1bHQgdmFsdWVzLCBzZWUgPGh0dHBzOi8vd3d3LnBhcGFwYXJzZS5jb20vZG9jcyNjb25maWc+XG4gICAgICovXG4gICAgZGVsaW1pdGVyOiBcIlwiLFx0Ly8gYXV0by1kZXRlY3Rcblx0bmV3bGluZTogXCJcIixcdC8vIGF1dG8tZGV0ZWN0XG4gICAgZXNjYXBlQ2hhcjogXCJcXFxcXCIsXG4gICAgc2tpcEVtcHR5TGluZXM6ICdncmVlZHknLCAgLy8gc2tpcCBlbXB0eSBBTkQgd2hpdGVzcGFjZS1vbmx5IGxpbmVzXG4gICAgLy9jb21wbGV0ZTogZm4gIC8vIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlY2VpdmUgcGFyc2UgcmVzdWx0c1xuICAgIC8vZXJyb3I6IGZuICAgICAvLyBjYWxsYmFjayBpZiBhbiBlcnJvciB3YXMgZW5jb3VudGVyZWRcbiAgICBoZWFkZXI6IGZhbHNlICAgLy8gZGV0ZWN0IG9wdGlvbmFsIGhlYWRlciByb3cgYW5kIHJlbW92ZSBhZnRlciBwYXJzaW5nP1xufVxuZnVuY3Rpb24gY29udmVydFRvTmFtZXNldE1vZGVsKCBsaXN0VGV4dCApIHtcbiAgICAvKiBUZXN0IGZvciBwcm9wZXIgZGVsaW1pdGVkIHRleHQgKFRTViBvciBDU1YsIHdpdGggYSBwYWlyIG9mIG5hbWVzIG9uIGVhY2ggbGluZSkuXG4gICAgICogVGhlIGZpcnN0IHZhbHVlIG9uIGVhY2ggbGluZSBpcyBhIHZlcm5hY3VsYXIgbGFiZWwsIHRoZSBzZWNvbmQgaXRzIG1hcHBlZCB0YXhvbiBuYW1lLlxuICAgICAqL1xuICAgIHZhciBuYW1lc2V0ID0gZ2V0TmV3TmFtZXNldE1vZGVsKCk7ICAvLyB3ZSdsbCBhZGQgbmFtZSBwYWlycyB0byB0aGlzXG4gICAgLy8gYXR0ZW1wdCB0byBwYXJzZSB0aGUgZGVsaW1pdGVkIHRleHQgcHJvdmlkZWRcbiAgICB2YXIgcGFyc2VSZXN1bHRzID0gUGFwYS5wYXJzZShsaXN0VGV4dCwgcGFwYVBhcnNlQ29uZmlnKTtcbiAgICB2YXIgcGFyc2VFcnJvck1lc3NhZ2UgPSBcIlwiO1xuICAgIGlmIChwYXJzZVJlc3VsdHMubWV0YS5hYm9ydGVkKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJEZWxpbWl0ZWQgdGV4dCBwYXJzaW5nIEFCT1JURUQhXCIpO1xuICAgICAgICBwYXJzZUVycm9yTWVzc2FnZSArPSBcIkRlbGltaXRlZCB0ZXh0IHBhcnNpbmcgQUJPUlRFRCFcXG5cXG5cIjtcbiAgICB9XG4gICAgLy8gc3RpbGwgaGVyZT8gdGhlbiB3ZSBhdCBsZWFzdCBoYXZlIHNvbWUgbmFtZXMgKG9yIGhlYWRlcnMpIHRvIHJldHVyblxuICAgICQuZWFjaChwYXJzZVJlc3VsdHMuZXJyb3JzLCBmdW5jdGlvbihpLCBwYXJzZUVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCIgIFBhcnNpbmcgZXJyb3Igb24gbGluZSBcIisgcGFyc2VFcnJvci5yb3cgK1wiOiBcIisgcGFyc2VFcnJvci5jb2RlICtcIiAoXCIrIHBhcnNlRXJyb3IubWVzc2FnZSArXCIpXCIpO1xuICAgICAgICBwYXJzZUVycm9yTWVzc2FnZSArPSBcIiAgUGFyc2luZyBlcnJvciBvbiBsaW5lIFwiKyBwYXJzZUVycm9yLnJvdyArXCI6IFwiKyBwYXJzZUVycm9yLmNvZGUgK1wiIChcIisgcGFyc2VFcnJvci5tZXNzYWdlICtcIilcXG5cIjtcbiAgICB9KTtcbiAgICBpZiAocGFyc2VSZXN1bHRzLm1ldGEuYWJvcnRlZCkge1xuICAgICAgICBzaG93RXJyb3JNZXNzYWdlKHBhcnNlRXJyb3JNZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIG5hbWVzZXQ7ICAvLyBwcm9iYWJseSBzdGlsbCBlbXB0eVxuICAgIH1cblxuICAgIC8vIG5vdyBhcHBseSBsYWJlbHMgYW5kIGtlZXAgY291bnQgb2YgYW55IGR1cGxpY2F0ZSBsYWJlbHNcbiAgICB2YXIgZm91bmRMYWJlbHMgPSBbIF07XG4gICAgdmFyIGR1cGVMYWJlbHNGb3VuZCA9IDA7XG4gICAgdmFyIHJvd3MgPSBwYXJzZVJlc3VsdHMuZGF0YTsgIC8vIGFuIGFycmF5IG9mIHBhcnNlZCByb3dzIChlYWNoIGFuIGFycmF5IG9mIHZhbHVlcylcbiAgICBjb25zb2xlLndhcm4oIHJvd3MubGVuZ3RoICtcIiBsaW5lcyBmb3VuZCB3aXRoIGxpbmUgZGVsaW1pdGVyICdcIisgcGFyc2VSZXN1bHRzLm1ldGEubGluZWJyZWFrICtcIidcIik7XG5cbiAgICB2YXIgbG9jYWxOYW1lTnVtYmVyID0gMDsgIC8vIHRoZXNlIGFyZSBub3QgaW1wb3J0ZWQsIHNvIGxvY2FsIGludGVnZXJzIGFyZSBmaW5kXG4gICAgJC5lYWNoKHJvd3MsIGZ1bmN0aW9uKGksIGl0ZW1zKSB7XG4gICAgICAgIC8vIGZpbHRlciBvdXQgZW1wdHkgaXRlbXMgKGVnLCBsYWJlbHMgYW5kIHRheGEpIG9uIHRoaXMgcm93XG4gICAgICAgIGl0ZW1zID0gJC5ncmVwKGl0ZW1zLCBmdW5jdGlvbihpdGVtLCBpKSB7XG4gICAgICAgICAgICByZXR1cm4gJC50cmltKGl0ZW0pICE9PSBcIlwiO1xuICAgICAgICB9KTtcbiAgICAgICAgc3dpdGNoIChpdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgIC8vIHNraXAgdG8gbmV4dCBsaW5lXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIHdlIGFzc3VtZSB0aGUgc2FtZSBmaWVsZHMgYXMgaW4gb3VyIG5hbWVzZXQgb3V0cHV0IGZpbGVzXG4gICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gJC50cmltKGl0ZW1zWzBdKTsgICAvLyBpdHMgb3JpZ2luYWwsIHZlcm5hY3VsYXIgbGFiZWxcbiAgICAgICAgICAgICAgICBpZiAobGFiZWwgPT09ICdPUklHSU5BTCBMQUJFTCcpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCB0aGUgaGVhZGVyIHJvdywgaWYgZm91bmRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHNraXAgdGhpcyBsYWJlbCBpZiBpdCdzIGEgZHVwbGljYXRlXG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kTGFiZWxzLmluZGV4T2YobGFiZWwpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBhZGQgdGhpcyB0byBsYWJlbHMgZm91bmQgKHRlc3QgbGF0ZXIgbmFtZXMgYWdhaW5zdCB0aGlzKVxuICAgICAgICAgICAgICAgICAgICBmb3VuZExhYmVscy5wdXNoKGxhYmVsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGEgZHVwZSBvZiBhbiBlYXJsaWVyIG5hbWUhXG4gICAgICAgICAgICAgICAgICAgIGR1cGVMYWJlbHNGb3VuZCsrO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGNhbm9uaWNhbFRheG9uTmFtZSA9ICQudHJpbShpdGVtc1sxXSk7ICAvLyBpdHMgbWFwcGVkIHRheG9uIG5hbWVcbiAgICAgICAgICAgICAgICAvLyBpbmNsdWRlIG90dGlkIGFuZCBhbnkgdGF4b25vbWljIHNvdXJjZXMsIGlmIHByb3ZpZGVkXG4gICAgICAgICAgICAgICAgdmFyIHRheG9uSUQgPSAoaXRlbXMubGVuZ3RoID4gMikgPyBpdGVtc1syXSA6IG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZXMgPSAoaXRlbXMubGVuZ3RoID4gMykgPyBpdGVtc1szXS5zcGxpdCgnOycpIDogbnVsbDtcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGhpcyBpbmZvcm1hdGlvbiBpbiB0aGUgZXhwZWN0ZWQgbmFtZXNldCBmb3JtXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIuLi5hZGRpbmcgbGFiZWwgJ1wiKyBsYWJlbCArXCInLi4uXCIpO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiAoXCJuYW1lXCIrIGxvY2FsTmFtZU51bWJlcisrKSxcbiAgICAgICAgICAgICAgICAgICAgXCJvcmlnaW5hbExhYmVsXCI6IGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICBcIm90dFRheG9uTmFtZVwiOiBjYW5vbmljYWxUYXhvbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIFwic2VsZWN0ZWRGb3JBY3Rpb25cIjogZmFsc2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmICh0YXhvbklEKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVJbmZvW1wib3R0SWRcIl0gPSB0YXhvbklEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlcykge1xuICAgICAgICAgICAgICAgICAgICBuYW1lSW5mb1tcInRheG9ub21pY1NvdXJjZXNcIl0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHNvdXJjZXMsIGZ1bmN0aW9uKGksIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlID0gJC50cmltKHNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlKSB7ICAvLyBpdCdzIG5vdCBhbiBlbXB0eSBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lSW5mb1tcInRheG9ub21pY1NvdXJjZXNcIl0ucHVzaCggc291cmNlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuYW1lc2V0Lm5hbWVzLnB1c2goIG5hbWVJbmZvICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH0pO1xuICAgIG51ZGdlVGlja2xlcignVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7XG4gICAgdmFyIG5hbWVzQWRkZWQgPSBuYW1lc2V0Lm5hbWVzLmxlbmd0aDtcbiAgICB2YXIgbXNnO1xuICAgIGlmIChkdXBlTGFiZWxzRm91bmQgPT09IDApIHtcbiAgICAgICAgbXNnID0gXCJBZGRpbmcgXCIrIG5hbWVzQWRkZWQgK1wiIG5hbWVzIGZvdW5kIGluIHRoaXMgZmlsZS4uLlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG1zZyA9IFwiQWRkaW5nIFwiKyBuYW1lc0FkZGVkICtcIiBuYW1lXCIrXG4gICAgICAgICAgICAobmFtZXNBZGRlZCA9PT0gMT8gXCJcIiA6IFwic1wiKSArXCIgZm91bmQgaW4gdGhpcyBmaWxlIChcIitcbiAgICAgICAgICAgIGR1cGVMYWJlbHNGb3VuZCArXCIgZHVwbGljYXRlIGxhYmVsXCIrIChkdXBlTGFiZWxzRm91bmQgPT09IDE/IFwiXCIgOiBcInNcIilcbiAgICAgICAgICAgICtcIiByZW1vdmVkKS4uLlwiO1xuICAgIH1cbiAgICAvLyB3aGVyZSBkbyB3ZSBzaG93IHRoZXNlIG1lc3NhZ2VzP1xuICAgIHNob3dJbmZvTWVzc2FnZShtc2cpO1xuICAgIHJldHVybiBuYW1lc2V0O1xufVxuXG4vKiBMb2FkIGFuZCBzYXZlICh0by9mcm9tIFpJUCBmaWxlIG9uIHRoZSB1c2VyJ3MgZmlsZXN5c3RlbSkgKi9cblxuLy8gcHJvcG9zZSBhbiBhcHByb3ByaWF0ZSBmaWxlbmFtZSBiYXNlZCBvbiBpdHMgaW50ZXJuYWwgbmFtZVxuZnVuY3Rpb24gZ2V0RGVmYXVsdEFyY2hpdmVGaWxlbmFtZSggY2FuZGlkYXRlRmlsZU5hbWUgKSB7XG4gICAgLy8gdHJ5IHRvIHVzZSBhIGNhbmRpZGF0ZSBuYW1lLCBpZiBwcm92aWRlZFxuICAgIHZhciBzdWdnZXN0ZWRGaWxlTmFtZSA9ICQudHJpbShjYW5kaWRhdGVGaWxlTmFtZSkgfHxcbiAgICAgICAgdmlld01vZGVsLm1ldGFkYXRhLm5hbWUoKSB8fFxuICAgICAgICBcIlVOVElUTEVEX05BTUVTRVRcIjtcbiAgICAvLyBzdHJpcCBleHRlbnNpb24gKGlmIGZvdW5kKSBhbmQgaW5jcmVtZW50IGFzIG5lZWRlZFxuICAgIGlmIChzdWdnZXN0ZWRGaWxlTmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKCcuemlwJykpIHtcbiAgICAgICAgc3VnZ2VzdGVkRmlsZU5hbWUgPSBzdWdnZXN0ZWRGaWxlTmFtZS5zdWJzdHIoMCwgc3VnZ2VzdGVkRmlsZU5hbWUubGVuZ3RoKCkgLSA0KTtcbiAgICB9XG4gICAgLy8gYWRkIGluY3JlbWVudGluZyBjb3VudGVyIGZyb20gdmlld01vZGVsLCBwbHVzIGZpbGUgZXh0ZW5zaW9uXG4gICAgaWYgKHZpZXdNb2RlbC5tZXRhZGF0YS5zYXZlX2NvdW50KCkgPiAwKSB7XG4gICAgICAgIHN1Z2dlc3RlZEZpbGVOYW1lICs9IFwiLVwiKyB2aWV3TW9kZWwubWV0YWRhdGEuc2F2ZV9jb3VudCgpO1xuICAgIH1cbiAgICBzdWdnZXN0ZWRGaWxlTmFtZSArPSAnLnppcCc7XG4gICAgcmV0dXJuIHN1Z2dlc3RlZEZpbGVOYW1lO1xufVxuXG5mdW5jdGlvbiBzYXZlQ3VycmVudE5hbWVzZXQoIG9wdGlvbnMgKSB7XG4gICAgLy8gc2F2ZSBhIFpJUCBhcmNoaXZlIChvciBqdXN0IGBtYWluLmpzb25gKSB0byB0aGUgZmlsZXN5c3RlbVxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHtGVUxMX0FSQ0hJVkU6IHRydWV9O1xuXG4gICAgLypcbiAgICAgKiBVcGRhdGUgbmV3LXNhdmUgaW5mbyAodGltZXN0YW1wIGFuZCBjb3VudGVyKSBpbiB0aGUgSlNPTiBkb2N1bWVudCBCRUZPUkVcbiAgICAgKiBzYXZpbmcgaXQ7IGlmIHRoZSBvcGVyYXRpb24gZmFpbHMsIHdlJ2xsIHJldmVydCB0aGVzZSBwcm9wZXJ0aWVzIGluIHRoZVxuICAgICAqIGFjdGl2ZSBkb2N1bWVudC5cbiAgICAgKi9cbiAgICB2YXIgcHJldmlvdXNTYXZlVGltZXN0YW1wID0gdmlld01vZGVsLm1ldGFkYXRhLmxhc3Rfc2F2ZWQoKTtcbiAgICB2YXIgcmlnaHROb3cgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgdmlld01vZGVsLm1ldGFkYXRhLmxhc3Rfc2F2ZWQoIHJpZ2h0Tm93ICk7XG4gICAgdmFyIHByZXZpb3VzU2F2ZUNvdW50ID0gdmlld01vZGVsLm1ldGFkYXRhLnNhdmVfY291bnQoKTtcbiAgICB2aWV3TW9kZWwubWV0YWRhdGEuc2F2ZV9jb3VudCggKytwcmV2aW91c1NhdmVDb3VudCApO1xuICAgIC8vIFRPRE86IFNldCAodGVudGF0aXZlL3VzZXItc3VnZ2VzdGVkKSBmaWxlbmFtZSBpbiB0aGUgbGl2ZSB2aWV3TW9kZWw/XG5cbiAgICAvLyBUT0RPOiBhZGQgdGhpcyB1c2VyIHRvIHRoZSBhdXRob3JzIGxpc3QsIGlmIG5vdCBmb3VuZD9cbiAgICAvLyAoZW1haWwgYW5kL29yIHVzZXJpZCwgc28gd2UgY2FuIGxpbmsgdG8gYXV0aG9ycylcbiAgICAvKlxuICAgIHZhciB1c2VyRGlzcGxheU5hbWUgPSAnPz8/JztcbiAgICB2YXIgbGlzdFBvcyA9ICQuaW5BcnJheSggdXNlckRpc3BsYXlOYW1lLCB2aWV3TW9kZWwubWV0YWRhdGEuYXV0aG9ycygpICk7XG4gICAgaWYgKGxpc3RQb3MgPT09IC0xKSB7XG4gICAgICAgIHZpZXdNb2RlbC5tZXRhZGF0YS5hdXRob3JzLnB1c2goIHVzZXJEaXNwbGF5TmFtZSApO1xuICAgIH1cbiAgICAqL1xuXG4gICAgLy8gVE9ETzogYWRkIGEgXCJzY3J1YmJlclwiIGFzIHdlIGRvIGZvciBPcGVuVHJlZSBzdHVkaWVzPyBcbiAgICAvLyBzY3J1Yk5hbWVzZXRGb3JUcmFuc3BvcnQoc3R5bGlzdC5pbGwpO1xuXG4gICAgLy8gZmxhdHRlbiB0aGUgY3VycmVudCBuYW1lc2V0IHRvIHNpbXBsZSBKUyB1c2luZyBvdXIgXG4gICAgLy8gS25vY2tvdXQgbWFwcGluZyBvcHRpb25zXG4gICAgdmFyIGNsb25hYmxlTmFtZXNldCA9IGtvLm1hcHBpbmcudG9KUyh2aWV3TW9kZWwpO1xuXG4gICAgLy8gVE9ETzogY2xlYXIgYW55IGV4aXN0aW5nIFVSTD8gb3Iga2VlcCBsYXN0LWtub3duIGdvb2Qgb25lP1xuICAgIC8vY2xvbmFibGVOYW1lc2V0Lm1ldGFkYXRhLnVybCA9ICcnO1xuXG4gICAgLy8gY3JlYXRlIGEgWmlwIGFyY2hpdmUsIGFkZCB0aGUgY29yZSBkb2N1bWVudFxuICAgIHZhciBhcmNoaXZlID0gbmV3IEpTWmlwKCk7XG4gICAgYXJjaGl2ZS5maWxlKFwibWFpbi5qc29uXCIsIEpTT04uc3RyaW5naWZ5KGNsb25hYmxlTmFtZXNldCkpO1xuXG4gICAgLy8gVE9ETzogVGVzdCBhbGwgaW5wdXQgZm9yIHJlcGVhdGFibGUgcHJvdmVuYW5jZSBpbmZvOyBpZiBhbnkgYXJlIGxhY2tpbmcgYVxuICAgIC8vIGNsZWFyIHNvdXJjZSwgd2Ugc2hvdWxkIGVtYmVkIHRoZSBzb3VyY2UgZGF0YSBoZXJlLlxuICAgIC8qXG4gICAgdmFyIHN0YXRpY0lucHV0cyA9IFRyZWVJbGx1c3RyYXRvci5nYXRoZXJTdGF0aWNJbnB1dERhdGEoKTtcbiAgICBpZiAob3B0aW9ucy5GVUxMX0FSQ0hJVkUgfHwgKHN0YXRpY0lucHV0cy5sZW5ndGggPiAwKSkge1xuICAgICAgICAvLyBhZGQgc29tZSBvciBhbGwgaW5wdXQgZGF0YSBmb3IgdGhpcyBpbGx1c3RyYXRpb25cbiAgICAgICAgLy92YXIgaW5wdXRGb2xkZXIgPSBhcmNoaXZlLmZvbGRlcignaW5wdXQnKTtcbiAgICAgICAgdmFyIGlucHV0c1RvU3RvcmUgPSBvcHRpb25zLkZVTExfQVJDSElWRSA/IFRyZWVJbGx1c3RyYXRvci5nYXRoZXJBbGxJbnB1dERhdGEoKSA6IHN0YXRpY0lucHV0cztcbiAgICAgICAgJC5lYWNoKGlucHV0c1RvU3RvcmUsIGZ1bmN0aW9uKGksIGlucHV0RGF0YSkge1xuICAgICAgICAgICAgdmFyIGl0c1BhdGggPSBpbnB1dERhdGEucGF0aDtcbiAgICAgICAgICAgIHZhciBzZXJpYWxpemVkID0gdXRpbHMuc2VyaWFsaXplRGF0YUZvclNhdmVkRmlsZSggaW5wdXREYXRhLnZhbHVlICk7XG4gICAgICAgICAgICBhcmNoaXZlLmZpbGUoaXRzUGF0aCwgc2VyaWFsaXplZC52YWx1ZSwgc2VyaWFsaXplZC5vcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgICovXG5cbiAgICAvLyBhZGQgYW55IG91dHB1dCBkb2NzIChTVkcsIFBERilcbiAgICB2YXIgb3V0cHV0Rm9sZGVyID0gYXJjaGl2ZS5mb2xkZXIoJ291dHB1dCcpO1xuICAgIC8qIFNlZSBodHRwczovL3N0dWsuZ2l0aHViLmlvL2pzemlwL2RvY3VtZW50YXRpb24vYXBpX2pzemlwL2ZpbGVfZGF0YS5odG1sXG4gICAgICogZm9yIG90aGVyIFpJUCBvcHRpb25zIGxpa2UgY29wbXJlc3Npb24gc2V0dGluZ3MuXG4gICAgICovXG4gICAgb3V0cHV0Rm9sZGVyLmZpbGUoJ21haW4udHN2JywgZ2VuZXJhdGVUYWJTZXBhcmF0ZWRPdXRwdXQoJ0FMTF9OQU1FUycpLCB7Y29tbWVudDogXCJUYWItZGVsaW1pdGVkIHRleHQsIGluY2x1ZGluZyB1bm1hcHBlZCBuYW1lcy5cIn0pO1xuICAgIG91dHB1dEZvbGRlci5maWxlKCdtYWluLmNzdicsIGdlbmVyYXRlQ29tbWFTZXBhcmF0ZWRPdXRwdXQoJ0FMTF9OQU1FUycpLCB7Y29tbWVudDogXCJDb21tYS1kZWxpbWl0ZWQgdGV4dCwgaW5jbHVkaW5nIHVubWFwcGVkIG5hbWVzLlwifSk7XG5cbiAgICAvKiBOT1RFIHRoYXQgd2UgaGF2ZSBubyBjb250cm9sIG92ZXIgd2hlcmUgdGhlIGJyb3dzZXIgd2lsbCBzYXZlIGFcbiAgICAgKiBkb3dubG9hZGVkIGZpbGUsIGFuZCB3ZSBoYXZlIG5vIGRpcmVjdCBrbm93bGVkZ2Ugb2YgdGhlIGZpbGVzeXN0ZW0hXG4gICAgICogRnVydGhlcm1vcmUsIG1vc3QgYnJvd3NlcnMgd29uJ3Qgb3ZlcndyaXRlIGFuIGV4aXN0aW5nIGZpbGUgd2l0aCB0aGlzXG4gICAgICogcGF0aCtuYW1lLCBhbmQgd2lsbCBpbnN0ZWFkIGluY3JlbWVudCB0aGUgbmV3IGZpbGUsIGUuZy5cbiAgICAgKiAnYmVlLXRyZWVzLWNvbXBhcmVkLnppcCcgYmVjb21lcyAnfi9Eb3dubG9hZHMvYmVlLXRyZWVzLWNvbXBhcmVkICgyKS56aXAnLlxuICAgICAqL1xuICAgIHZhciAkZmlsZW5hbWVGaWVsZCA9ICQoJ2lucHV0I3N1Z2dlc3RlZC1hcmNoaXZlLWZpbGVuYW1lJyk7XG4gICAgdmFyIHN1Z2dlc3RlZEZpbGVOYW1lID0gJC50cmltKCRmaWxlbmFtZUZpZWxkLnZhbCgpKTtcbiAgICBpZiAoc3VnZ2VzdGVkRmlsZU5hbWUgPT09IFwiXCIpIHtcbiAgICAgICAgc3VnZ2VzdGVkRmlsZU5hbWUgPSBnZXREZWZhdWx0QXJjaGl2ZUZpbGVuYW1lKHN1Z2dlc3RlZEZpbGVOYW1lKTtcbiAgICB9XG4gICAgLy8gYWRkIG1pc3NpbmcgZXh0ZW5zaW9uLCBpZiBpdCdzIG1pc3NpbmdcbiAgICBpZiAoIShzdWdnZXN0ZWRGaWxlTmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKCcuemlwJykpKSB7XG4gICAgICAgIHN1Z2dlc3RlZEZpbGVOYW1lICs9ICcuemlwJztcbiAgICB9XG5cbiAgICBhcmNoaXZlLmdlbmVyYXRlQXN5bmMoIHt0eXBlOlwiYmxvYlwifSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiB1cGRhdGVDYWxsYmFjayhtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFNob3cgcHJvZ3Jlc3MgYXMgZGVtb25zdHJhdGVkIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9zdHVrLmdpdGh1Yi5pby9qc3ppcC9kb2N1bWVudGF0aW9uL2V4YW1wbGVzL2Rvd25sb2FkZXIuaHRtbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBtZXRhZGF0YS5wZXJjZW50LnRvRml4ZWQoMikgKyBcIiAlIGNvbXBsZXRlXCIgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gKVxuICAgICAgICAgICAudGhlbiggZnVuY3Rpb24gKGJsb2IpIHsgICBcbiAgICAgICAgICAgICAgICAgICAgICAvLyBzdWNjZXNzIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgRmlsZVNhdmVyLnNhdmVBcyhibG9iLCBzdWdnZXN0ZWRGaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycikgeyAgICBcbiAgICAgICAgICAgICAgICAgICAgICAvLyBmYWlsdXJlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgYXN5bmNBbGVydCgnRVJST1IgZ2VuZXJhdGluZyB0aGlzIFpJUCBhcmNoaXZlOjxici8+PGJyLz4nKyBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgIC8vIHJldmVydCB0byBwcmV2aW91cyBsYXN0LXNhdmUgaW5mbyBpbiB0aGUgYWN0aXZlIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgICAgICAgdmlld01vZGVsLm1ldGFkYXRhLmxhc3Rfc2F2ZWQoIHByZXZpb3VzU2F2ZVRpbWVzdGFtcCApO1xuICAgICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlbC5tZXRhZGF0YS5zYXZlX2NvdW50KCBwcmV2aW91c1NhdmVDb3VudCApO1xuICAgICAgICAgICAgICAgICAgfSApO1xuXG4gICAgJCgnI25hbWVzZXQtbG9jYWwtZmlsZXN5c3RlbS13YXJuaW5nJykuc2xpZGVEb3duKCk7IC8vIFRPRE9cblxuICAgIHNob3dJbmZvTWVzc2FnZSgnTmFtZXNldCBzYXZlZCB0byBsb2NhbCBmaWxlLicpO1xuXG4gICAgcG9wUGFnZUV4aXRXYXJuaW5nKCdVTlNBVkVEX05BTUVTRVRfQ0hBTkdFUycpO1xuICAgIG5hbWVzZXRIYXNVbnNhdmVkQ2hhbmdlcyA9IGZhbHNlO1xuICAgIGRpc2FibGVTYXZlQnV0dG9uKCk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlVGFiU2VwYXJhdGVkT3V0cHV0KCkge1xuICAgIHJldHVybiBnZW5lcmF0ZURlbGltaXRlZFRleHRPdXRwdXQoJ0FMTF9OQU1FUycsICdcXHQnLCAnOycpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVDb21tYVNlcGFyYXRlZE91dHB1dCgpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVEZWxpbWl0ZWRUZXh0T3V0cHV0KCdBTExfTkFNRVMnLCAnLCcsICc7Jyk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZURlbGltaXRlZFRleHRPdXRwdXQobWFwcGVkT3JBbGxOYW1lcywgZGVsaW1pdGVyLCBtaW5vckRlbGltaXRlcikge1xuICAgIC8vIHJlbmRlciB0aGUgY3VycmVudCBuYW1lc2V0IChtYXBwZWQgbmFtZXMsIG9yIGFsbCkgYXMgYSBkZWxpbWl0ZWQgKFRTViwgQ1NWKSBzdHJpbmdcbiAgICB2YXIgb3V0cHV0O1xuICAgIGlmICgkLmluQXJyYXkobWFwcGVkT3JBbGxOYW1lcywgWydNQVBQRURfTkFNRVMnLCAnQUxMX05BTUVTJ10pID09PSAtMSkge1xuICAgICAgICB2YXIgbXNnID0gXCIjIEVSUk9SOiBtYXBwZWRPckFsbE5hbWVzIHNob3VsZCBiZSAnTUFQUEVEX05BTUVTJyBvciAnQUxMX05BTUVTJywgbm90ICdcIisgbWFwcGVkT3JBbGxOYW1lcyArXCInIVwiXG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgICAgcmV0dXJuIG1zZztcbiAgICB9XG4gICAgaWYgKHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBvdXRwdXQgPSBcIiMgTm8gbmFtZXMgaW4gdGhpcyBuYW1lc2V0IHdlcmUgbWFwcGVkIHRvIHRoZSBPVCBUYXhvbm9teS5cIjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBvdXRwdXQgPSBcIk9SSUdJTkFMIExBQkVMXCIrIGRlbGltaXRlciArXCJPVFQgVEFYT04gTkFNRVwiKyBkZWxpbWl0ZXIgK1wiT1RUIFRBWE9OIElEXCIrIGRlbGltaXRlciArXCJUQVhPTk9NSUMgU09VUkNFU1xcblwiO1xuICAgICAgICAkLmVhY2godmlld01vZGVsLm5hbWVzKCksIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgICAgICAgIGlmICgobWFwcGVkT3JBbGxOYW1lcyA9PT0gJ01BUFBFRF9OQU1FUycpICYmICFuYW1lLm90dFRheG9uTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAgLy8gc2tpcCB0aGlzIHVuLW1hcHBlZCBuYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOLkIuIHVubWFwcGVkIG5hbWVzIHdvbid0IGhhdmUgbW9zdCBvZiB0aGVzZSBwcm9wZXJ0aWVzIVxuICAgICAgICAgICAgdmFyIGNvbWJpbmVkU291cmNlcyA9IChuYW1lLnRheG9ub21pY1NvdXJjZXMgfHwgWyBdKS5qb2luKG1pbm9yRGVsaW1pdGVyKTtcbiAgICAgICAgICAgIG91dHB1dCArPSAobmFtZS5vcmlnaW5hbExhYmVsICtkZWxpbWl0ZXIrXG4gICAgICAgICAgICAgICAgICAgICAgIChuYW1lLm90dFRheG9uTmFtZSB8fCAnJykgK2RlbGltaXRlcitcbiAgICAgICAgICAgICAgICAgICAgICAgKG5hbWUub3R0SWQgfHwgJycpICtkZWxpbWl0ZXIrXG4gICAgICAgICAgICAgICAgICAgICAgIGNvbWJpbmVkU291cmNlcyArXCJcXG5cIik7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xufVxuXG5mdW5jdGlvbiBsb2FkTGlzdEZyb21DaG9zZW5GaWxlKCB2bSwgZXZ0ICkge1xuICAgIC8vIEZpcnN0IHBhcmFtIChjb3JyZXNwb25kaW5nIHZpZXctbW9kZWwgZGF0YSkgaXMgcHJvYmFibHkgZW1wdHk7IGZvY3VzIG9uIHRoZSBldmVudCFcbiAgICB2YXIgJGhpbnRBcmVhID0gJCgnI2xpc3QtbG9jYWwtZmlsZXN5c3RlbS13YXJuaW5nJykuZXEoMCk7XG4gICAgJGhpbnRBcmVhLmh0bWwoXCJcIik7ICAvLyBjbGVhciBmb3IgbmV3IHJlc3VsdHNcbiAgICB2YXIgZXZlbnRUYXJnZXQgPSBldnQudGFyZ2V0IHx8IGV2dC5zcmNFbGVtZW50O1xuICAgIHN3aXRjaChldmVudFRhcmdldC5maWxlcy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAoMCk6XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIGZpbGUocykgc2VsZWN0ZWQhJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNhc2UgKDEpOlxuICAgICAgICBkZWZhdWx0OiAgLy8gaWdub3JlIG11bHRpcGxlIGZpbGVzIGZvciBub3csIGp1c3QgbG9hZCB0aGUgZmlyc3RcbiAgICAgICAgICAgIHZhciBmaWxlSW5mbyA9IGV2ZW50VGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmlsZUluZm8ubmFtZSA9IFwiKyBmaWxlSW5mby5uYW1lKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImZpbGVJbmZvLnR5cGUgPSBcIisgZmlsZUluZm8udHlwZSk7XG4gICAgICAgICAgICB2YXIgaXNWYWxpZExpc3QgPSBmYWxzZTtcbiAgICAgICAgICAgIHN3aXRjaCAoZmlsZUluZm8udHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQvcGxhaW4nOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQvdGFiLXNlcGFyYXRlZC12YWx1ZXMnOlxuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkTGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJyc6XG4gICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZpbGUgZXh0ZW5zaW9uXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlSW5mby5uYW1lLm1hdGNoKCcuKHR4dHx0c3YpJCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkTGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWlzVmFsaWRMaXN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiQSBsaXN0IG9mIG5hbWVzIHNob3VsZCBlbmQgaW4gPGNvZGU+LnR4dDwvY29kZT4gb3IgPGNvZGU+LnRzdjwvY29kZT4uIENob29zZSBhbm90aGVyIGZpbGU/XCI7XG4gICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU3RpbGwgaGVyZT8gdHJ5IHRvIGxvYWQgYW5kIHBhcnNlIHRoZSBsaXN0IChsaW5lLSBvciB0YWItZGVsaW1pdGVkIG5hbWVzKVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlYWRpbmcgbGlzdCBjb250ZW50cy4uLicpO1xuICAgICAgICAgICAgdmFyIG1zZyA9IFwiUmVhZGluZyBsaXN0IG9mIG5hbWVzLi4uXCI7XG4gICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcblxuICAgICAgICAgICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgIGZyLm9ubG9hZCA9IGZ1bmN0aW9uKCBldnQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3RUZXh0ID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGxpc3RUZXh0ICk7XG4gICAgICAgICAgICAgICAgLy8gdGVzdCBhIHZhcmlldHkgb2YgZGVsaW1pdGVycyB0byBmaW5kIG11bHRpcGxlIGl0ZW1zXG4gICAgICAgICAgICAgICAgdmFyIG5hbWVzID0gWyBdO1xuICAgICAgICAgICAgICAgIHZhciBtdWx0aXBsZU5hbWVzRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgZHVwZXNGb3VuZCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGRlbGltaXRlcnMgPSBbJ1xcbicsJ1xccicsJ1xcdCddO1xuICAgICAgICAgICAgICAgICQuZWFjaChkZWxpbWl0ZXJzLCBmdW5jdGlvbihpLCBkZWxpbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW11bHRpcGxlTmFtZXNGb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXMgPSBsaXN0VGV4dC5zcGxpdChkZWxpbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaWx0ZXIgb3V0IGVtcHR5IG5hbWVzLCBlbXB0eSBsaW5lcywgZXRjLlxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXMgPSAkLmdyZXAobmFtZXMsIGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJC50cmltKG5hbWUpICE9PSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKG5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiTm8gbmFtZXMgZm91bmQgd2l0aCBkZWxpbWl0ZXIgJ1wiKyBkZWxpbSArXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkp1c3Qgb25lIG5hbWUgZm91bmQgd2l0aCBkZWxpbWl0ZXIgJ1wiKyBkZWxpbSArXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZU5hbWVzRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oIG5hbWVzLmxlbmd0aCArXCIgbmFtZXMgZm91bmQgd2l0aCBkZWxpbWl0ZXIgJ1wiKyBkZWxpbSArXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiB1bnBhY2sgbmFtZXMsIGlnbm9yZSByZW1haW5pbmcgZGVsaW1pdGVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gobmFtZXMsIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZCBhIG5ldyBuYW1lIGVudHJ5IHRvIHRoZSBuYW1lc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIi4uLmFkZGluZyBuYW1lICdcIisgbmFtZSArXCInLi4uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGVsLm5hbWVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogKFwibmFtZVwiKyBnZXROZXh0TmFtZU9yZGluYWxOdW1iZXIoKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvcmlnaW5hbExhYmVsXCI6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWxlY3RlZEZvckFjdGlvblwiOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogYWRkIHRoZXNlIG9ubHkgd2hlbiB0aGV5J3JlIHBvcHVsYXRlZCFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFkanVzdGVkTGFiZWxcIjogXCJcIiAgIC8vIFdBUyAnXm90OmFsdExhYmVsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib3R0VGF4b25OYW1lXCI6IFwiSG9tbyBzYXBpZW5zIHNhcGllbnNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm90dElkXCI6IDEzMjc1MVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidGF4b25vbWljU291cmNlc1wiOiBbIC4uLiBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN3ZWVwIGZvciBkdXBsaWNhdGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aXRoRHVwZXMgPSB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUR1cGxpY2F0ZU5hbWVzKHZpZXdNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aXRob3V0RHVwZXMgPSB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cGVzRm91bmQgPSB3aXRoRHVwZXMgLSB3aXRob3V0RHVwZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51ZGdlVGlja2xlcignVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIHN0aWxsIGhlcmU/IHRoZXJlIHdhcyBhIHByb2JsZW0sIHJlcG9ydCBpdCBhbmQgYmFpbFxuICAgICAgICAgICAgICAgIHZhciBtc2c7XG4gICAgICAgICAgICAgICAgaWYgKG11bHRpcGxlTmFtZXNGb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZHVwZXNGb3VuZCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnID0gXCJBZGRpbmcgXCIrIG5hbWVzLmxlbmd0aCArXCIgbmFtZXMgZm91bmQgaW4gdGhpcyBmaWxlLi4uXCI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZXNBZGRlZCA9IG5hbWVzLmxlbmd0aCAtIGR1cGVzRm91bmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cgPSBcIkFkZGluZyBcIisgbmFtZXNBZGRlZCArXCIgbmFtZVwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuYW1lc0FkZGVkID09PSAxPyBcIlwiIDogXCJzXCIpICtcIiBmb3VuZCBpbiB0aGlzIGZpbGUgKFwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cGVzRm91bmQgK1wiIGR1cGxpY2F0ZSBuYW1lXCIrIChkdXBlc0ZvdW5kID09PSAxPyBcIlwiIDogXCJzXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgK1wiIHJlbW92ZWQpLi4uXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtc2cgPSBcIk5vIG5hbWVzIChvciBqdXN0IG9uZSkgZm91bmQgaW4gdGhpcyBmaWxlISBUcnkgYWdhaW4/XCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRoaW50QXJlYS5odG1sKG1zZykuc2hvdygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvL2ZyLnJlYWRBc0RhdGFVUkwoZmlsZUluZm8pO1xuICAgICAgICAgICAgZnIucmVhZEFzVGV4dChmaWxlSW5mbyk7ICAvLyBkZWZhdWx0IGVuY29kaW5nIGlzIHV0Zi04XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkTmFtZXNldEZyb21DaG9zZW5GaWxlKCB2bSwgZXZ0ICkge1xuICAgIC8vIEZpcnN0IHBhcmFtIChjb3JyZXNwb25kaW5nIHZpZXctbW9kZWwgZGF0YSkgaXMgcHJvYmFibHkgZW1wdHk7IGZvY3VzIG9uIHRoZSBldmVudCFcbiAgICB2YXIgJGhpbnRBcmVhID0gJCgnI25hbWVzZXQtbG9jYWwtZmlsZXN5c3RlbS13YXJuaW5nJykuZXEoMCk7XG4gICAgJGhpbnRBcmVhLmh0bWwoXCJcIik7ICAvLyBjbGVhciBmb3IgbmV3IHJlc3VsdHNcbiAgICB2YXIgZXZlbnRUYXJnZXQgPSBldnQudGFyZ2V0IHx8IGV2dC5zcmNFbGVtZW50O1xuICAgIHN3aXRjaChldmVudFRhcmdldC5maWxlcy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAoMCk6XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJObyBmaWxlKHMpIHNlbGVjdGVkIVwiO1xuICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNhc2UgKDEpOlxuICAgICAgICBkZWZhdWx0OiAgLy8gaWdub3JlIG11bHRpcGxlIGZpbGVzIGZvciBub3csIGp1c3QgbG9hZCB0aGUgZmlyc3RcbiAgICAgICAgICAgIHZhciBmaWxlSW5mbyA9IGV2ZW50VGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmlsZUluZm8ubmFtZSA9IFwiKyBmaWxlSW5mby5uYW1lKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImZpbGVJbmZvLnR5cGUgPSBcIisgZmlsZUluZm8udHlwZSk7XG4gICAgICAgICAgICB2YXIgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgaXNWYWxpZEFyY2hpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChjb250ZXh0ID09PSAnQlVMS19UTlJTJykge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZmlsZUluZm8udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdhcHBsaWNhdGlvbi96aXAnOlxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWRBcmNoaXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICcnOlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgZmlsZSBleHRlbnNpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWxlSW5mby5uYW1lLm1hdGNoKCcuKHppcHxuYW1lc2V0KSQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXNOYW1lc2V0RmlsZUZvcm1hdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZEFyY2hpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghaXNWYWxpZEFyY2hpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiQXJjaGl2ZWQgbmFtZXNldCBmaWxlIHNob3VsZCBlbmQgaW4gPGNvZGU+LnppcDwvY29kZT4gb3IgPGNvZGU+Lm5hbWVzZXQ8L2NvZGU+LiBDaG9vc2UgYW5vdGhlciBmaWxlP1wiO1xuICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7ICAvLyBwcmVzdW1hYmx5ICdTVFVEWV9PVFVfTUFQUElORydcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZpbGVJbmZvLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYXBwbGljYXRpb24vemlwJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXNOYW1lc2V0RmlsZUZvcm1hdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkQXJjaGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndGV4dC9wbGFpbic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQvdGFiLXNlcGFyYXRlZC12YWx1ZXMnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICd0ZXh0L2Nzdic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2FwcGxpY2F0aW9uL2pzb24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgZmlsZSBleHRlbnNpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWxlSW5mby5uYW1lLm1hdGNoKCcuKHppcHxuYW1lc2V0fHR4dHx0c3Z8Y3N2fGpzb24pJCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkQXJjaGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF1c2VzTmFtZXNldEZpbGVGb3JtYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiTmFtZXNldCBmaWxlIHNob3VsZCBlbmQgaW4gb25lIG9mIDxjb2RlPi56aXAgLm5hbWVzZXQgLnR4dCAudHN2IC5jc3YgLmpzb248L2NvZGU+LiBDaG9vc2UgYW5vdGhlciBmaWxlP1wiO1xuICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFN0aWxsIGhlcmU/IHRyeSB0byBleHRyYWN0IGEgbmFtZXNldCBmcm9tIHRoZSBjaG9zZW4gZmlsZVxuICAgICAgICAgICAgaWYgKGlzVmFsaWRBcmNoaXZlKSB7XG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIHJlYWQgYW5kIHVuemlwIHRoaXMgYXJjaGl2ZSFcbiAgICAgICAgICAgICAgICBKU1ppcC5sb2FkQXN5bmMoZmlsZUluZm8pICAgLy8gcmVhZCB0aGUgQmxvYlxuICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oemlwKSB7ICAvLyBzdWNjZXNzIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlYWRpbmcgWklQIGNvbnRlbnRzLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiUmVhZGluZyBuYW1lc2V0IGNvbnRlbnRzLi4uXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gSG93IHdpbGwgd2Uga25vdyB3aGVuIGl0J3MgYWxsIChhc3luYykgbG9hZGVkPyBDb3VudCBkb3duIGFzIGVhY2ggZW50cnkgaXMgcmVhZCFcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgemlwRW50cmllc1RvTG9hZCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1haW5Kc29uUGF5bG9hZEZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluaXRpYWxDYWNoZSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHAgaW4gemlwLmZpbGVzKSB7IHppcEVudHJpZXNUb0xvYWQrKzsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXNoIG1vc3QgZm91bmQgZGF0YSBpbiB0aGUgY2FjaGUsIGJ1dCBtYWluIEpTT04gc2hvdWxkIGJlIHBhcnNlZFxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lc2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICB6aXAuZm9yRWFjaChmdW5jdGlvbiAocmVsYXRpdmVQYXRoLCB6aXBFbnRyeSkgeyAgLy8gMikgcHJpbnQgZW50cmllc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnICAnKyB6aXBFbnRyeS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coemlwRW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIGRpcmVjdG9yaWVzIChub3RoaW5nIHRvIGRvIGhlcmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh6aXBFbnRyeS5kaXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlNLSVBQSU5HIGRpcmVjdG9yeSBcIisgemlwRW50cnkubmFtZSArXCIuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6aXBFbnRyaWVzVG9Mb2FkLS07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVhZCBhbmQgc3RvcmUgZmlsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgemlwRW50cnkuYXN5bmMoJ3RleHQnLCBmdW5jdGlvbihtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlcG9ydCBwcm9ncmVzcz9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJSZWFkaW5nIG5hbWVzZXQgY29udGVudHMgKFwiKyB6aXBFbnRyeS5uYW1lICtcIik6IFwiKyBtZXRhZGF0YS5wZXJjZW50LnRvRml4ZWQoMikgK1wiICVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIHN1Y2Nlc3MoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlN1Y2Nlc3MgdW56aXBwaW5nIFwiKyB6aXBFbnRyeS5uYW1lICtcIjpcXG5cIisgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHppcEVudHJpZXNUb0xvYWQtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyc2UgYW5kIHN0YXNoIHRoZSBtYWluIEpTT04gZGF0YTsgY2FjaGUgdGhlIHJlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTkIgdGhhdCB0aGlzIG5hbWUgY291bGQgaW5jbHVkZSBhIHByZWNlZGluZyBwYXRoIVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHppcEVudHJ5Lm5hbWUgPT09ICdtYWluLmpzb24nKSB8fCAoemlwRW50cnkubmFtZS5lbmRzV2l0aCgnL21haW4uanNvbicpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBpcyB0aGUgZXhwZWN0ZWQgcGF5bG9hZCBmb3IgYSBaSVBlZCBuYW1lc2V0OyB0cnkgdG8gcGFyc2UgaXQhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWluSnNvblBheWxvYWRGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8ganVzdCBzd2FsbG93IHRoaXMgYW5kIHJlcG9ydCBiZWxvd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBcIjxjb2RlPm1haW4uanNvbjwvY29kZT4gaXMgbWFsZm9ybWVkIChcIisgZSArXCIpIVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRoaW50QXJlYS5odG1sKG1zZykuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXQncyBzb21lIG90aGVyIGZpbGU7IGNvcHkgaXQgdG8gb3VyIGluaXRpYWwgY2FjaGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxDYWNoZVsgemlwRW50cnkubmFtZSBdID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoemlwRW50cmllc1RvTG9hZCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UndmUgcmVhZCBpbiBhbGwgdGhlIFpJUCBkYXRhISBvcGVuIHRoaXMgbmFtZXNldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gKFRPRE86IHNldHRpbmcgaXRzIGluaXRpYWwgY2FjaGUpIGFuZCBjbG9zZSB0aGlzIHBvcHVwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW1haW5Kc29uUGF5bG9hZEZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiPGNvZGU+bWFpbi5qc29uPC9jb2RlPiBub3QgZm91bmQgaW4gdGhpcyBaSVAhXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYXB0dXJlIHNvbWUgZmlsZSBtZXRhZGF0YSwgaW4gY2FzZSBpdCdzIG5lZWRlZCBpbiB0aGUgbmFtZXNldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvYWRlZEZpbGVOYW1lID0gZmlsZUluZm8ubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0TW9kaWZpZWREYXRlID0gZmlsZUluZm8ubGFzdE1vZGlmaWVkRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTE9BRElORyBGUk9NIEZJTEUgJ1wiKyBsb2FkZWRGaWxlTmFtZSArXCInLCBMQVNUIE1PRElGSUVEOiBcIisgbGFzdE1vZGlmaWVkRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGV4dCA9PT0gJ0JVTEtfVE5SUycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZXBsYWNlIHRoZSBtYWluIHZpZXctbW9kZWwgb24gdGhpcyBwYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZE5hbWVzZXREYXRhKCBuYW1lc2V0LCBsb2FkZWRGaWxlTmFtZSwgbGFzdE1vZGlmaWVkRGF0ZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE4uQi4gdGhlIEZpbGUgQVBJICphbHdheXMqIGRvd25sb2FkcyB0byBhbiB1bnVzZWQgcGF0aCtmaWxlbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJyNzdG9yYWdlLW9wdGlvbnMtcG9wdXAnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgIC8vIHByZXN1bWFibHkgJ1NUVURZX09UVV9NQVBQSU5HJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4YW1pbmUgYW5kIGFwcGx5IHRoZXNlIG1hcHBpbmdzIHRvIHRoZSBPVFVzIGluIHRoZSBjdXJyZW50IHN0dWR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VOYW1lc2V0RGF0YSggbmFtZXNldCwgbG9hZGVkRmlsZU5hbWUsIGxhc3RNb2RpZmllZERhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTkIgaWYgaXQgZmFpbGVkIHRvIHBhcnNlLCB3ZSdyZSBzaG93aW5nIGEgZGVhdGlsZWQgZXJyb3IgbWVzc2FnZSBhYm92ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBlcnJvcihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBcIlByb2JsZW0gdW56aXBwaW5nIFwiKyB6aXBFbnRyeS5uYW1lICtcIjpcXG5cIisgZS5tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZSkgeyAgICAgICAgIC8vIGZhaWx1cmUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJFcnJvciByZWFkaW5nIDxzdHJvbmc+XCIgKyBmaWxlSW5mby5uYW1lICsgXCI8L3N0cm9uZz4hIElzIHRoaXMgYSBwcm9wZXIgemlwIGZpbGU/XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIGV4dHJhY3QgbmFtZXNldCBmcm9tIGEgc2ltcGxlIChub24tWklQKSBmaWxlXG4gICAgICAgICAgICAgICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICBmci5vbmxvYWQgPSBmdW5jdGlvbiggZXZ0ICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGV2dC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZXNldCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBkYXRhICk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0ID09PSAnQlVMS19UTlJTJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuZXhwZWN0ZWQgY29udGV4dCAnQlVMS19UTlJTJyBmb3IgZmxhdC1maWxlIG5hbWVzZXQhXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAgLy8gcHJlc3VtYWJseSAnU1RVRFlfT1RVX01BUFBJTkcnXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBUcnkgY29udmVyc2lvbiB0byBzdGFuZGFyZCBuYW1lc2V0IEpTIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lc2V0ID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElGIHRoaXMgZmFpbHMsIHRyeSB0byBpbXBvcnQgVFNWL0NTViwgbGluZS1ieS1saW5lIHRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lc2V0ID0gY29udmVydFRvTmFtZXNldE1vZGVsKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBleGFtaW5lIGFuZCBhcHBseSB0aGVzZSBtYXBwaW5ncyB0byB0aGUgT1RVcyBpbiB0aGUgY3VycmVudCBzdHVkeVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsb2FkZWRGaWxlTmFtZSA9IGZpbGVJbmZvLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RNb2RpZmllZERhdGUgPSBmaWxlSW5mby5sYXN0TW9kaWZpZWREYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlTmFtZXNldERhdGEoIG5hbWVzZXQsIGxvYWRlZEZpbGVOYW1lLCBsYXN0TW9kaWZpZWREYXRlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJFcnJvciByZWFkaW5nIG5hbWVzIGZyb20gPHN0cm9uZz5cIiArIGZpbGVJbmZvLm5hbWUgKyBcIjwvc3Ryb25nPiEgUGxlYXNlIGNvbXBhcmUgaXQgdG8gZXhhbXBsZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGZyLnJlYWRBc1RleHQoZmlsZUluZm8pOyAgLy8gZGVmYXVsdCBlbmNvZGluZyBpcyB1dGYtOFxuICAgICAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gY3JlYXRlIHNvbWUgaXNvbGF0ZWQgb2JzZXJ2YWJsZXMgKGFzIGdsb2JhbCBKUyB2YXJzISkgdXNlZCB0byBzdXBwb3J0IG91ciBtYXBwaW5nIFVJXG52YXIgYXV0b01hcHBpbmdJblByb2dyZXNzID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG52YXIgY3VycmVudGx5TWFwcGluZ05hbWVzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTsgLy8gZHJpdmVzIHNwaW5uZXJzLCBldGMuXG52YXIgZmFpbGVkTWFwcGluZ05hbWVzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTsgXG4gICAgLy8gaWdub3JlIHRoZXNlIHVudGlsIHdlIGhhdmUgbmV3IG1hcHBpbmcgaGludHNcbnZhciBwcm9wb3NlZE5hbWVNYXBwaW5ncyA9IGtvLm9ic2VydmFibGUoe30pOyBcbiAgICAvLyBzdG9yZWQgYW55IGxhYmVscyBwcm9wb3NlZCBieSBzZXJ2ZXIsIGtleWVkIGJ5IG5hbWUgaWQgW1RPRE8/XVxudmFyIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyID0ga28ub2JzZXJ2YWJsZSgxKTsgIFxuICAgIC8vIHRoaXMganVzdCBudWRnZXMgdGhlIGxhYmVsLWVkaXRpbmcgVUkgdG8gcmVmcmVzaCFcblxuXG4vKiBTVEFSVCBjb252ZXJ0ICdPVFUnIHRvICduYW1lJyB0aHJvdWdob3V0PyAqL1xuXG5mdW5jdGlvbiBhZGp1c3RlZExhYmVsT3JFbXB0eShsYWJlbCkge1xuICAgIC8vIFdlIHNob3VsZCBvbmx5IGRpc3BsYXkgYW4gYWRqdXN0ZWQgbGFiZWwgaWYgaXQncyBjaGFuZ2VkIGZyb20gdGhlXG4gICAgLy8gb3JpZ2luYWw7IG90aGVyd2lzZSByZXR1cm4gYW4gZW1wdHkgc3RyaW5nLlxuICAgIGlmICh0eXBlb2YobGFiZWwpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGxhYmVsID0gbGFiZWwoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZihsYWJlbCkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIHByb2JhYmx5IG51bGwsIG5vdGhpbmcgdG8gc2VlIGhlcmVcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHZhciBhZGp1c3RlZCA9IGFkanVzdGVkTGFiZWwobGFiZWwpO1xuICAgIGlmIChhZGp1c3RlZCA9PSBsYWJlbCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIGFkanVzdGVkO1xufVxuXG5mdW5jdGlvbiBhZGp1c3RlZExhYmVsKGxhYmVsKSB7XG4gICAgLy8gYXBwbHkgYW55IGFjdGl2ZSBuYW1lIG1hcHBpbmcgYWRqdXN0bWVudHMgdG8gdGhpcyBzdHJpbmdcbiAgICBpZiAodHlwZW9mKGxhYmVsKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBsYWJlbCA9IGxhYmVsKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YobGFiZWwpICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBwcm9iYWJseSBudWxsXG4gICAgICAgIHJldHVybiBsYWJlbDtcbiAgICB9XG4gICAgdmFyIGFkanVzdGVkID0gbGFiZWw7XG4gICAgLy8gYXBwbHkgYW55IGFjdGl2ZSBzdWJzaXR1dGlvbnMgaW4gdGhlIHZpZXdNZGVsXG4gICAgdmFyIHN1Ykxpc3QgPSB2aWV3TW9kZWwubWFwcGluZ0hpbnRzLnN1YnN0aXR1dGlvbnMoKTtcbiAgICAkLmVhY2goc3ViTGlzdCwgZnVuY3Rpb24oaSwgc3Vic3QpIHtcbiAgICAgICAgaWYgKCFzdWJzdC5hY3RpdmUoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIHNraXAgdG8gbmV4dCBhZGp1c3RtZW50XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9sZFRleHQgPSBzdWJzdC5vbGQoKTtcbiAgICAgICAgdmFyIG5ld1RleHQgPSBzdWJzdC5uZXcoKTtcbiAgICAgICAgaWYgKCQudHJpbShvbGRUZXh0KSA9PT0gJC50cmltKG5ld1RleHQpID09PSBcIlwiKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gc2tpcCB0byBuZXh0IGFkanVzdG1lbnRcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy92YXIgcGF0dGVybiA9IG5ldyBSZWdFeHAob2xkVGV4dCwgJ2cnKTsgIC8vIGcgPSByZXBsYWNlIEFMTCBpbnN0YW5jZXNcbiAgICAgICAgICAgIC8vIE5PLCB0aGlzIGNhdXNlcyB3ZWlyZCByZXBldGl0aW9uIGluIGNvbW1vbiBjYXNlc1xuICAgICAgICAgICAgdmFyIHBhdHRlcm4gPSBuZXcgUmVnRXhwKG9sZFRleHQpO1xuICAgICAgICAgICAgYWRqdXN0ZWQgPSBhZGp1c3RlZC5yZXBsYWNlKHBhdHRlcm4sIG5ld1RleHQpO1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IHN0YWxlIGludmFsaWQtcmVnZXggbWFya2luZyBvbiB0aGlzIGZpZWxkXG4gICAgICAgICAgICBzdWJzdC52YWxpZCh0cnVlKTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAvLyB0aGVyZSdzIHByb2JhYmx5IGludmFsaWQgcmVnZXggaW4gdGhlIGZpZWxkLi4uIG1hcmsgaXQgYW5kIHNraXBcbiAgICAgICAgICAgIHN1YnN0LnZhbGlkKGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBhZGp1c3RlZDtcbn1cblxuLy8ga2VlcCB0cmFjayBvZiB0aGUgbGFzdCAoZGUpc2VsZWN0ZWQgbGlzdCBpdGVtIChpdHMgcG9zaXRpb24pXG52YXIgbGFzdENsaWNrZWRUb2dnbGVQb3NpdGlvbiA9IG51bGw7XG5mdW5jdGlvbiB0b2dnbGVNYXBwaW5nRm9yTmFtZShuYW1lLCBldnQpIHtcbiAgICB2YXIgJHRvZ2dsZSwgbmV3U3RhdGU7XG4gICAgLy8gYWxsb3cgdHJpZ2dlcmluZyB0aGlzIGZyb20gYW55d2hlcmUgaW4gdGhlIHJvd1xuICAgIGlmICgkKGV2dC50YXJnZXQpLmlzKCc6Y2hlY2tib3gnKSkge1xuICAgICAgICAkdG9nZ2xlID0gJChldnQudGFyZ2V0KTtcbiAgICAgICAgLy8gTi5CLiB1c2VyJ3MgY2xpY2sgKG9yIHRoZSBjYWxsZXIpIGhhcyBhbHJlYWR5IHNldCBpdHMgc3RhdGUhXG4gICAgICAgIG5ld1N0YXRlID0gJHRvZ2dsZS5pcygnOmNoZWNrZWQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkdG9nZ2xlID0gJChldnQudGFyZ2V0KS5jbG9zZXN0KCd0cicpLmZpbmQoJ2lucHV0Lm1hcC10b2dnbGUnKTtcbiAgICAgICAgLy8gY2xpY2tpbmcgZWxzZXdoZXJlIHNob3VsZCB0b2dnbGUgY2hlY2tib3ggc3RhdGUhXG4gICAgICAgIG5ld1N0YXRlID0gISgkdG9nZ2xlLmlzKCc6Y2hlY2tlZCcpKTtcbiAgICAgICAgZm9yY2VUb2dnbGVDaGVja2JveCgkdG9nZ2xlLCBuZXdTdGF0ZSk7XG4gICAgfVxuICAgIC8vIGFkZCAob3IgcmVtb3ZlKSBoaWdobGlnaHQgY29sb3IgdGhhdCB3b3JrcyB3aXRoIGhvdmVyLWNvbG9yXG4gICAgLyogTi5CLiB0aGF0IHRoaXMgZHVwbGljYXRlcyB0aGUgZWZmZWN0IG9mIEtub2Nrb3V0IGJpbmRpbmdzIG9uIHRoZXNlIHRhYmxlXG4gICAgICogcm93cyEgVGhpcyBpcyBkZWxpYmVyYXRlLCBzaW5jZSB3ZSdyZSBvZnRlbiB0b2dnbGluZyAqbWFueSogcm93cyBhdFxuICAgICAqIG9uY2UsIHNvIHdlIG5lZWQgdG8gdXBkYXRlIHZpc3VhbCBzdHlsZSB3aGlsZSBwb3N0cG9uaW5nIGFueSB0aWNrbGVyXG4gICAgICogbnVkZ2UgJ3RpbCB3ZSdyZSBkb25lLlxuICAgICAqL1xuICAgIGlmIChuZXdTdGF0ZSkge1xuICAgICAgICAkdG9nZ2xlLmNsb3Nlc3QoJ3RyJykuYWRkQ2xhc3MoJ3dhcm5pbmcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkdG9nZ2xlLmNsb3Nlc3QoJ3RyJykucmVtb3ZlQ2xhc3MoJ3dhcm5pbmcnKTtcbiAgICB9XG4gICAgLy8gaWYgdGhpcyBpcyB0aGUgb3JpZ2luYWwgY2xpY2sgZXZlbnQ7IGNoZWNrIGZvciBhIHJhbmdlIVxuICAgIGlmICh0eXBlb2YoZXZ0LnNoaWZ0S2V5KSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gZGV0ZXJtaW5lIHRoZSBwb3NpdGlvbiAobnRoIGNoZWNrYm94KSBvZiB0aGlzIG5hbWUgaW4gdGhlIHZpc2libGUgbGlzdFxuICAgICAgICB2YXIgJHZpc2libGVUb2dnbGVzID0gJHRvZ2dsZS5jbG9zZXN0KCd0YWJsZScpLmZpbmQoJ2lucHV0Lm1hcC10b2dnbGUnKTtcbiAgICAgICAgdmFyIG5ld0xpc3RQb3NpdGlvbiA9ICQuaW5BcnJheSggJHRvZ2dsZVswXSwgJHZpc2libGVUb2dnbGVzKTtcbiAgICAgICAgaWYgKGV2dC5zaGlmdEtleSAmJiB0eXBlb2YobGFzdENsaWNrZWRUb2dnbGVQb3NpdGlvbikgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBmb3JjZU1hcHBpbmdGb3JSYW5nZU9mTmFtZXMoIG5hbWVbJ3NlbGVjdGVkRm9yQWN0aW9uJ10sIGxhc3RDbGlja2VkVG9nZ2xlUG9zaXRpb24sIG5ld0xpc3RQb3NpdGlvbiApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGluIGFueSBjYXNlLCBtYWtlIHRoaXMgdGhlIG5ldyByYW5nZS1zdGFydGVyXG4gICAgICAgIGxhc3RDbGlja2VkVG9nZ2xlUG9zaXRpb24gPSBuZXdMaXN0UG9zaXRpb247XG4gICAgfVxuICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICByZXR1cm4gdHJ1ZTsgIC8vIHVwZGF0ZSB0aGUgY2hlY2tib3hcbn1cbmZ1bmN0aW9uIGZvcmNlTWFwcGluZ0ZvclJhbmdlT2ZOYW1lcyggbmV3U3RhdGUsIHBvc0EsIHBvc0IgKSB7XG4gICAgLy8gdXBkYXRlIHNlbGVjdGVkIHN0YXRlIGZvciBhbGwgY2hlY2tib3hlcyBpbiB0aGlzIHJhbmdlXG4gICAgdmFyICRhbGxNYXBwaW5nVG9nZ2xlcyA9ICQoJ2lucHV0Lm1hcC10b2dnbGUnKTtcbiAgICB2YXIgJHRvZ2dsZXNJblJhbmdlO1xuICAgIGlmIChwb3NCID4gcG9zQSkge1xuICAgICAgICAkdG9nZ2xlc0luUmFuZ2UgPSAkYWxsTWFwcGluZ1RvZ2dsZXMuc2xpY2UocG9zQSwgcG9zQisxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkdG9nZ2xlc0luUmFuZ2UgPSAkYWxsTWFwcGluZ1RvZ2dsZXMuc2xpY2UocG9zQiwgcG9zQSsxKTtcbiAgICB9XG4gICAgJHRvZ2dsZXNJblJhbmdlLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvcmNlVG9nZ2xlQ2hlY2tib3godGhpcywgbmV3U3RhdGUpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBmb3JjZVRvZ2dsZUNoZWNrYm94KGNiLCBuZXdTdGF0ZSkge1xuICAgIHZhciAkY2IgPSAkKGNiKTtcbiAgICBzd2l0Y2gobmV3U3RhdGUpIHtcbiAgICAgICAgY2FzZSAodHJ1ZSk6XG4gICAgICAgICAgICBpZiAoJGNiLmlzKCc6Y2hlY2tlZCcpID09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgJGNiLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAkY2IudHJpZ2dlckhhbmRsZXIoJ2NsaWNrJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAoZmFsc2UpOlxuICAgICAgICAgICAgaWYgKCRjYi5pcygnOmNoZWNrZWQnKSkge1xuICAgICAgICAgICAgICAgICRjYi5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICRjYi50cmlnZ2VySGFuZGxlcignY2xpY2snKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImZvcmNlVG9nZ2xlQ2hlY2tib3goKSBpbnZhbGlkIG5ld1N0YXRlIDxcIisgdHlwZW9mKG5ld1N0YXRlKSArXCI+OlwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobmV3U3RhdGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRvZ2dsZUFsbE1hcHBpbmdDaGVja2JveGVzKGNiKSB7XG4gICAgdmFyICRiaWdUb2dnbGUgPSAkKGNiKTtcbiAgICB2YXIgJGFsbE1hcHBpbmdUb2dnbGVzID0gJCgnaW5wdXQubWFwLXRvZ2dsZScpO1xuICAgIHZhciBuZXdTdGF0ZSA9ICRiaWdUb2dnbGUuaXMoJzpjaGVja2VkJyk7XG4gICAgJGFsbE1hcHBpbmdUb2dnbGVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvcmNlVG9nZ2xlQ2hlY2tib3godGhpcywgbmV3U3RhdGUpO1xuICAgIH0pO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBlZGl0TmFtZUxhYmVsKG5hbWUsIGV2dCkge1xuICAgIHZhciBuYW1laWQgPSBuYW1lWydpZCddO1xuICAgIHZhciBvcmlnaW5hbExhYmVsID0gbmFtZVsnb3JpZ2luYWxMYWJlbCddO1xuICAgIG5hbWVbJ2FkanVzdGVkTGFiZWwnXSA9IGFkanVzdGVkTGFiZWwob3JpZ2luYWxMYWJlbCk7XG5cbiAgICAvLyBNYXJrIHRoaXMgbmFtZSBhcyBzZWxlY3RlZCBmb3IgbWFwcGluZy5cbiAgICBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddID0gdHJ1ZTtcblxuICAgIC8vIElmIHdlIGhhdmUgYSBwcm9wZXIgbW91c2UgZXZlbnQsIHRyeSB0byBtb3ZlIGlucHV0IGZvY3VzIHRvIHRoaXMgZmllbGRcbiAgICAvLyBhbmQgcHJlLXNlbGVjdCBpdHMgZnVsbCB0ZXh0LlxuICAgIC8vXG4gICAgLy8gTi5CLiBUaGVyZSdzIGEgJ2hhc0ZvY3VzJyBiaW5kaW5nIHdpdGggc2ltaWxhciBiZWhhdmlvciwgYnV0IGl0J3MgdHJpY2t5XG4gICAgLy8gdG8gbWFyayB0aGUgbmV3IGZpZWxkIHZzLiBleGlzdGluZyBvbmVzOlxuICAgIC8vICAgaHR0cDovL2tub2Nrb3V0anMuY29tL2RvY3VtZW50YXRpb24vaGFzZm9jdXMtYmluZGluZy5odG1sXG4gICAgaWYgKCdjdXJyZW50VGFyZ2V0JyBpbiBldnQpIHtcbiAgICAgICAgLy8gY2FwdHVyZSB0aGUgY3VycmVudCB0YWJsZSByb3cgYmVmb3JlIERPTSB1cGRhdGVzXG4gICAgICAgIHZhciAkY3VycmVudFJvdyA9ICQoZXZ0LmN1cnJlbnRUYXJnZXQpLmNsb3Nlc3QoJ3RyJyk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJGVkaXRGaWVsZCA9ICRjdXJyZW50Um93LmZpbmQoJ2lucHV0OnRleHQnKTtcbiAgICAgICAgICAgICRlZGl0RmllbGQuZm9jdXMoKS5zZWxlY3QoKTtcbiAgICAgICAgfSwgNTApO1xuICAgIH1cblxuICAgIC8vIHRoaXMgc2hvdWxkIG1ha2UgdGhlIGVkaXRvciBhcHBlYXIgKGFsdGVyaW5nIHRoZSBET00pXG4gICAgYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyKCkgKyAxKTtcbiAgICBudWRnZVRpY2tsZXIoICdOQU1FX01BUFBJTkdfSElOVFMnKTsgLy8gdG8gcmVmcmVzaCAnc2VsZWN0ZWQnIGNoZWNrYm94XG59XG5mdW5jdGlvbiBtb2RpZnlFZGl0ZWRMYWJlbChuYW1lKSB7XG4gICAgLy8gcmVtb3ZlIGl0cyBuYW1lLWlkIGZyb20gZmFpbGVkLW5hbWUgbGlzdCB3aGVuIHVzZXIgbWFrZXMgY2hhbmdlc1xuICAgIHZhciBuYW1laWQgPSBuYW1lWydpZCddO1xuICAgIGZhaWxlZE1hcHBpbmdOYW1lcy5yZW1vdmUobmFtZWlkKTtcbiAgICAvLyBudWRnZSB0byB1cGRhdGUgbmFtZSBsaXN0IGltbWVkaWF0ZWx5XG4gICAgYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyKCkgKyAxKTtcbiAgICBudWRnZUF1dG9NYXBwaW5nKCk7XG5cbiAgICBudWRnZVRpY2tsZXIoICdOQU1FX01BUFBJTkdfSElOVFMnKTtcbn1cbmZ1bmN0aW9uIHJldmVydE5hbWVMYWJlbChuYW1lKSB7XG4gICAgLy8gdW5kb2VzICdlZGl0TmFtZUxhYmVsJywgcmVsZWFzaW5nIGEgbGFiZWwgdG8gdXNlIHNoYXJlZCBoaW50c1xuICAgIHZhciBuYW1laWQgPSBuYW1lWydpZCddO1xuICAgIGRlbGV0ZSBuYW1lWydhZGp1c3RlZExhYmVsJ107XG4gICAgZmFpbGVkTWFwcGluZ05hbWVzLnJlbW92ZShuYW1laWQgKTtcbiAgICAvLyB0aGlzIHNob3VsZCBtYWtlIHRoZSBlZGl0b3IgZGlzYXBwZWFyIGFuZCByZXZlcnQgaXRzIGFkanVzdGVkIGxhYmVsXG4gICAgYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyKCkgKyAxKTtcbiAgICBudWRnZUF1dG9NYXBwaW5nKCk7XG59XG5cbmZ1bmN0aW9uIHByb3Bvc2VOYW1lTGFiZWwobmFtZWlkLCBtYXBwaW5nSW5mbykge1xuICAgIC8vIHN0YXNoIG9uZSAob3IgbW9yZSkgbWFwcGluZ3MgYXMgb3B0aW9ucyBmb3IgdGhpcyBuYW1lXG4gICAgaWYgKCQuaXNBcnJheSggbWFwcGluZ0luZm8pKSB7XG4gICAgICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzKClbIG5hbWVpZCBdID0ga28ub2JzZXJ2YWJsZUFycmF5KCBtYXBwaW5nSW5mbyApLmV4dGVuZCh7IG5vdGlmeTogJ2Fsd2F5cycgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF0gPSBrby5vYnNlcnZhYmxlKCBtYXBwaW5nSW5mbyApLmV4dGVuZCh7IG5vdGlmeTogJ2Fsd2F5cycgfSk7XG4gICAgfVxuICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgIC8vIHRoaXMgc2hvdWxkIG1ha2UgdGhlIGVkaXRvciBhcHBlYXJcbn1cbmZ1bmN0aW9uIHByb3Bvc2VkTWFwcGluZyggbmFtZSApIHtcbiAgICBpZiAoIW5hbWUgfHwgdHlwZW9mIG5hbWVbJ2lkJ10gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwicHJvcG9zZWRNYXBwaW5nKCkgZmFpbGVkXCIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIG5hbWVpZCA9IG5hbWVbJ2lkJ107XG4gICAgdmFyIGFjYyA9IHByb3Bvc2VkTmFtZU1hcHBpbmdzKClbIG5hbWVpZCBdO1xuICAgIHJldHVybiBhY2MgPyBhY2MoKSA6IG51bGw7XG59XG5mdW5jdGlvbiBhcHByb3ZlUHJvcG9zZWROYW1lTGFiZWwobmFtZSkge1xuICAgIC8vIHVuZG9lcyAnZWRpdE5hbWVMYWJlbCcsIHJlbGVhc2luZyBhIGxhYmVsIHRvIHVzZSBzaGFyZWQgaGludHNcbiAgICB2YXIgbmFtZWlkID0gbmFtZVsnaWQnXTtcbiAgICB2YXIgaXRzTWFwcGluZ0luZm8gPSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICB2YXIgYXBwcm92ZWRNYXBwaW5nID0gJC5pc0Z1bmN0aW9uKGl0c01hcHBpbmdJbmZvKSA/XG4gICAgICAgIGl0c01hcHBpbmdJbmZvKCkgOlxuICAgICAgICBpdHNNYXBwaW5nSW5mbztcbiAgICBpZiAoJC5pc0FycmF5KGFwcHJvdmVkTWFwcGluZykpIHtcbiAgICAgICAgLy8gYXBwbHkgdGhlIGZpcnN0IChvbmx5KSB2YWx1ZVxuICAgICAgICBtYXBOYW1lVG9UYXhvbiggbmFtZWlkLCBhcHByb3ZlZE1hcHBpbmdbMF0gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhcHBseSB0aGUgaW5uZXIgdmFsdWUgb2YgYW4gb2JzZXJ2YWJsZSAoYWNjZXNzb3IpIGZ1bmN0aW9uXG4gICAgICAgIG1hcE5hbWVUb1RheG9uKCBuYW1laWQsIGtvLnVud3JhcChhcHByb3ZlZE1hcHBpbmcpICk7XG4gICAgfVxuICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIG51ZGdlVGlja2xlciggJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUycpOyAvLyB0byByZWZyZXNoIHN0YXR1cyBiYXJcbn1cbmZ1bmN0aW9uIGFwcHJvdmVQcm9wb3NlZE5hbWVNYXBwaW5nT3B0aW9uKGFwcHJvdmVkTWFwcGluZywgc2VsZWN0ZWRJbmRleCkge1xuICAgIC8vIHNpbWlsYXIgdG8gYXBwcm92ZVByb3Bvc2VkTmFtZUxhYmVsLCBidXQgZm9yIGEgbGlzdGVkIG9wdGlvblxuICAgIHZhciBuYW1laWQgPSBhcHByb3ZlZE1hcHBpbmcubmFtZUlEO1xuICAgIG1hcE5hbWVUb1RheG9uKCBuYW1laWQsIGFwcHJvdmVkTWFwcGluZyApO1xuICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIG51ZGdlVGlja2xlciggJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUycpOyAvLyB0byByZWZyZXNoIHN0YXR1cyBiYXJcbn1cbmZ1bmN0aW9uIHJlamVjdFByb3Bvc2VkTmFtZUxhYmVsKG5hbWUpIHtcbiAgICAvLyB1bmRvZXMgJ3Byb3Bvc2VOYW1lTGFiZWwnLCBjbGVhcmluZyBpdHMgdmFsdWVcbiAgICB2YXIgbmFtZWlkID0gbmFtZVsnaWQnXTtcbiAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF07XG4gICAgcHJvcG9zZWROYW1lTWFwcGluZ3MudmFsdWVIYXNNdXRhdGVkKCk7XG4gICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICBudWRnZVRpY2tsZXIoICdWSVNJQkxFX05BTUVfTUFQUElOR1MnKTsgLy8gdG8gcmVmcmVzaCBzdGF0dXMgYmFyXG59XG5cbmZ1bmN0aW9uIGdldEFsbFZpc2libGVQcm9wb3NlZE1hcHBpbmdzKCkge1xuICAgIC8vIGdhdGhlciBhbnkgcHJvcG9zZWQgbWFwcGluZ3MgKElEcykgdGhhdCBhcmUgdmlzaWJsZSBvbiB0aGlzIHBhZ2VcbiAgICB2YXIgdmlzaWJsZVByb3Bvc2VkTWFwcGluZ3MgPSBbXTtcbiAgICB2YXIgdmlzaWJsZU5hbWVzID0gdmlld01vZGVsLmZpbHRlcmVkTmFtZXMoKS5wYWdlZEl0ZW1zKCk7XG4gICAgJC5lYWNoKCB2aXNpYmxlTmFtZXMsIGZ1bmN0aW9uIChpLCBuYW1lKSB7XG4gICAgICAgIGlmIChwcm9wb3NlZE1hcHBpbmcobmFtZSkpIHtcbiAgICAgICAgICAgIC8vIHdlIGhhdmUgYSBwcm9wb3NlZCBtYXBwaW5nIGZvciB0aGlzIG5hbWUhXG4gICAgICAgICAgICB2aXNpYmxlUHJvcG9zZWRNYXBwaW5ncy5wdXNoKCBuYW1lWydpZCddICk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdmlzaWJsZVByb3Bvc2VkTWFwcGluZ3M7IC8vIHJldHVybiBhIHNlcmllcyBvZiBJRHNcbn1cbmZ1bmN0aW9uIGFwcHJvdmVBbGxWaXNpYmxlTWFwcGluZ3MoKSB7XG4gICAgJC5lYWNoKGdldEFsbFZpc2libGVQcm9wb3NlZE1hcHBpbmdzKCksIGZ1bmN0aW9uKGksIG5hbWVpZCkge1xuICAgICAgICB2YXIgaXRzTWFwcGluZ0luZm8gPSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICAgICAgdmFyIGFwcHJvdmVkTWFwcGluZyA9ICQuaXNGdW5jdGlvbihpdHNNYXBwaW5nSW5mbykgP1xuICAgICAgICAgICAgaXRzTWFwcGluZ0luZm8oKSA6XG4gICAgICAgICAgICBpdHNNYXBwaW5nSW5mbztcbiAgICAgICAgaWYgKCQuaXNBcnJheShhcHByb3ZlZE1hcHBpbmcpKSB7XG4gICAgICAgICAgICBpZiAoYXBwcm92ZWRNYXBwaW5nLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIHRlc3QgdGhlIGZpcnN0IChvbmx5KSB2YWx1ZSBmb3IgcG9zc2libGUgYXBwcm92YWxcbiAgICAgICAgICAgICAgICB2YXIgb25seU1hcHBpbmcgPSBhcHByb3ZlZE1hcHBpbmdbMF07XG4gICAgICAgICAgICAgICAgaWYgKG9ubHlNYXBwaW5nLm9yaWdpbmFsTWF0Y2guaXNfc3lub255bSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47ICAvLyBzeW5vbnltcyByZXF1aXJlIG1hbnVhbCByZXZpZXdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogTi5CLiBXZSBuZXZlciBwcmVzZW50IHRoZSBzb2xlIG1hcHBpbmcgc3VnZ2VzdGlvbiBhcyBhXG4gICAgICAgICAgICAgICAgICogdGF4b24tbmFtZSBob21vbnltLCBzbyBqdXN0IGNvbnNpZGVyIHRoZSBtYXRjaCBzY29yZSB0b1xuICAgICAgICAgICAgICAgICAqIGRldGVybWluZSB3aGV0aGVyIGl0J3MgYW4gXCJleGFjdCBtYXRjaFwiLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGlmIChvbmx5TWFwcGluZy5vcmlnaW5hbE1hdGNoLnNjb3JlIDwgMS4wKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjsgIC8vIG5vbi1leGFjdCBtYXRjaGVzIHJlcXVpcmUgbWFudWFsIHJldmlld1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzdGlsbCBoZXJlPyB0aGVuIHRoaXMgbWFwcGluZyBsb29rcyBnb29kIGVub3VnaCBmb3IgYXV0by1hcHByb3ZhbFxuICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICAgICAgICAgICAgICBtYXBOYW1lVG9UYXhvbiggbmFtZWlkLCBhcHByb3ZlZE1hcHBpbmdbMF0sIHtQT1NUUE9ORV9VSV9DSEFOR0VTOiB0cnVlfSApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm47IC8vIG11bHRpcGxlIHBvc3NpYmlsaXRpZXMgcmVxdWlyZSBtYW51YWwgcmV2aWV3XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhcHBseSB0aGUgaW5uZXIgdmFsdWUgb2YgYW4gb2JzZXJ2YWJsZSAoYWNjZXNzb3IpIGZ1bmN0aW9uXG4gICAgICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF07XG4gICAgICAgICAgICBtYXBOYW1lVG9UYXhvbiggbmFtZWlkLCBrby51bndyYXAoYXBwcm92ZWRNYXBwaW5nKSwge1BPU1RQT05FX1VJX0NIQU5HRVM6IHRydWV9ICk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIG51ZGdlVGlja2xlciggJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUycpOyAvLyB0byByZWZyZXNoIHN0YXR1cyBiYXJcbiAgICBzdGFydEF1dG9NYXBwaW5nKCk7XG59XG5mdW5jdGlvbiByZWplY3RBbGxWaXNpYmxlTWFwcGluZ3MoKSB7XG4gICAgJC5lYWNoKGdldEFsbFZpc2libGVQcm9wb3NlZE1hcHBpbmdzKCksIGZ1bmN0aW9uKGksIG5hbWVpZCkge1xuICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF07XG4gICAgfSk7XG4gICAgcHJvcG9zZWROYW1lTWFwcGluZ3MudmFsdWVIYXNNdXRhdGVkKCk7XG4gICAgc3RvcEF1dG9NYXBwaW5nKCk7XG4gICAgbnVkZ2VUaWNrbGVyKCAnVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7IC8vIHRvIHJlZnJlc2ggc3RhdHVzIGJhclxufVxuXG5mdW5jdGlvbiB1cGRhdGVNYXBwaW5nU3RhdHVzKCkge1xuICAgIC8vIHVwZGF0ZSBtYXBwaW5nIHN0YXR1cytkZXRhaWxzIGJhc2VkIG9uIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoaW5nc1xuICAgIHZhciBkZXRhaWxzSFRNTCwgc2hvd0JhdGNoQXBwcm92ZSwgc2hvd0JhdGNoUmVqZWN0LCBuZWVkc0F0dGVudGlvbjtcbiAgICAvKiBUT0RPOiBkZWZhdWx0cyBhc3N1bWUgbm90aGluZyBwYXJ0aWN1bGFybHkgaW50ZXJlc3RpbmcgZ29pbmcgb25cbiAgICBkZXRhaWxzSFRNTCA9ICcnO1xuICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICBzaG93QmF0Y2hSZWplY3QgPSB0cnVlO1xuICAgIG5lZWRzQXR0ZW50aW9uID0gZmFsc2U7XG4gICAgKi9cbiAgICB2YXIgcHJvcG9zZWRNYXBwaW5nTmVlZHNEZWNpc2lvbiA9IGZhbHNlO1xuICAgIGZvciAodmFyIHAgaW4gcHJvcG9zZWROYW1lTWFwcGluZ3MoKSkge1xuICAgICAgICAvLyB0aGUgcHJlc2VuY2Ugb2YgYW55dGhpbmcgaGVyZSBtZWFucyB0aGVyZSBhcmUgcHJvcG9zZWQgbWFwcGluZ3NcbiAgICAgICAgcHJvcG9zZWRNYXBwaW5nTmVlZHNEZWNpc2lvbiA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGF1dG9NYXBwaW5nSW5Qcm9ncmVzcygpID09PSB0cnVlKSB7XG4gICAgICAgIC8vIGF1dG8tbWFwcGluZyBpcyBBQ1RJVkUgKG1lYW5pbmcgd2UgaGF2ZSB3b3JrIGluIGhhbmQpXG4gICAgICAgIGRldGFpbHNIVE1MID0gJyc7IC8vICc8cCcrJz5NYXBwaW5nIGluIHByb2dyZXNzLi4uPCcrJy9wPic7XG4gICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgc2hvd0JhdGNoUmVqZWN0ID0gZmFsc2U7XG4gICAgICAgIG5lZWRzQXR0ZW50aW9uID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGdldE5leHRVbm1hcHBlZE5hbWUoKSkge1xuICAgICAgICAgICAgLy8gSUYgYXV0by1tYXBwaW5nIGlzIFBBVVNFRCwgYnV0IHRoZXJlJ3MgbW9yZSB0byBkbyBvbiB0aGlzIHBhZ2VcbiAgICAgICAgICAgIGRldGFpbHNIVE1MID0gJzxwJysnPk1hcHBpbmcgcGF1c2VkLiBTZWxlY3QgbmV3IG5hbWUgb3IgYWRqdXN0IG1hcHBpbmcgaGludHMsIHRoZW4gY2xpY2sgdGhlICdcbiAgICAgICAgICAgICAgICAgICAgICAgICArJzxzdHJvbmc+TWFwIHNlbGVjdGVkIG5hbWU8L3N0cm9uZz4gYnV0dG9uIGFib3ZlIHRvIHRyeSBhZ2Fpbi48JysnL3A+JztcbiAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHNob3dCYXRjaFJlamVjdCA9IHByb3Bvc2VkTWFwcGluZ05lZWRzRGVjaXNpb247XG4gICAgICAgICAgICBuZWVkc0F0dGVudGlvbiA9IHByb3Bvc2VkTWFwcGluZ05lZWRzRGVjaXNpb247XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhdXRvLW1hcHBpbmcgaXMgUEFVU0VEIGFuZCBldmVyeXRoaW5nJ3MgYmVlbiBtYXBwZWRcbiAgICAgICAgICAgIGlmIChwcm9wb3NlZE1hcHBpbmdOZWVkc0RlY2lzaW9uKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlcmUgYXJlIHByb3Bvc2VkIG1hcHBpbmdzIGF3YWl0aW5nIGEgZGVjaXNpb25cbiAgICAgICAgICAgICAgICBkZXRhaWxzSFRNTCA9ICc8cCcrJz5BbGwgc2VsZWN0ZWQgbmFtZXMgaGF2ZSBiZWVuIG1hcHBlZC4gVXNlIHRoZSAnXG4gICAgICAgICAgICAgICAgICAgICAgICArJzxzcGFuIGNsYXNzPVwiYnRuLWdyb3VwXCIgc3R5bGU9XCJtYXJnaW46IC0ycHggMDtcIj4nXG4gICAgICAgICAgICAgICAgICAgICAgICArJyA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1taW5pIGRpc2FibGVkXCI+PGkgY2xhc3M9XCJpY29uLW9rXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnPC9zcGFuPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIGJ1dHRvbnMgdG8gYWNjZXB0IG9yIHJlamVjdCBlYWNoIHN1Z2dlc3RlZCBtYXBwaW5nLCdcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIG9yIHRoZSBidXR0b25zIGJlbG93IHRvIGFjY2VwdCBvciByZWplY3QgdGhlIHN1Z2dlc3Rpb25zIGZvciBhbGwgdmlzaWJsZSBuYW1lcy48JysnL3A+JztcbiAgICAgICAgICAgICAgICBzaG93QmF0Y2hBcHByb3ZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzaG93QmF0Y2hSZWplY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG5lZWRzQXR0ZW50aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlcmUgYXJlIE5PIHByb3Bvc2VkIG1hcHBpbmdzIGF3YWl0aW5nIGEgZGVjaXNpb25cbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8qIFRPRE86IGNoZWNrIGZvciB0d28gcG9zc2liaWxpdGllcyBoZXJlXG4gICAgICAgICAgICAgICAgaWYgKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBjYW4gYWRkIG1vcmUgYnkgaW5jbHVkaW5nICdBbGwgdHJlZXMnXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbHNIVE1MID0gJzxwJysnPjxzdHJvbmc+Q29uZ3J0dWxhdGlvbnMhPC9zdHJvbmc+ICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJ01hcHBpbmcgaXMgc3VzcGVuZGVkIGJlY2F1c2UgYWxsIG5hbWVzIGluIHRoaXMgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnc3R1ZHlcXCdzIG5vbWluYXRlZCB0cmVlcyBoYXZlIGFjY2VwdGVkIGxhYmVscyBhbHJlYWR5LiBUbyBjb250aW51ZSwgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsncmVqZWN0IHNvbWUgbWFwcGVkIGxhYmVscyB3aXRoIHRoZSAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyc8c3BhbiBjbGFzcz1cImJ0bi1ncm91cFwiIHN0eWxlPVwibWFyZ2luOiAtMnB4IDA7XCI+J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJzwvc3Bhbj4gJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnYnV0dG9uIG9yIGNoYW5nZSB0aGUgZmlsdGVyIHRvIDxzdHJvbmc+SW4gYW55IHRyZWU8L3N0cm9uZz4uPCcrJy9wPic7XG4gICAgICAgICAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0JhdGNoUmVqZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIG5lZWRzQXR0ZW50aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSB0cnVseSBkb25lIHdpdGggbWFwcGluZyAoaW4gYWxsIHRyZWVzKVxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxzSFRNTCA9ICc8cCcrJz48c3Ryb25nPkNvbmdydHVsYXRpb25zITwvc3Ryb25nPiAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKydNYXBwaW5nIGlzIHN1c3BlbmRlZCBiZWNhdXNlIGFsbCBuYW1lcyBpbiB0aGlzIHN0dWR5IGhhdmUgYWNjZXB0ZWQgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnbGFiZWxzIGFscmVhZHkuLiBUbyBjb250aW51ZSwgdXNlIHRoZSAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyc8c3BhbiBjbGFzcz1cImJ0bi1ncm91cFwiIHN0eWxlPVwibWFyZ2luOiAtMnB4IDA7XCI+J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJzwvc3Bhbj4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKycgYnV0dG9ucyB0byByZWplY3QgYW55IGxhYmVsIGF0IGxlZnQuPCcrJy9wPic7XG4gICAgICAgICAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0JhdGNoUmVqZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIG5lZWRzQXR0ZW50aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgIC8qIFRPRE86IHJlcGxhY2UgdGhpcyBzdHVmZiB3aXRoIGlmL2Vsc2UgYmxvY2sgYWJvdmVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBkZXRhaWxzSFRNTCA9ICc8cCcrJz5NYXBwaW5nIGlzIHN1c3BlbmRlZCBiZWNhdXNlIGFsbCBzZWxlY3RlZCBuYW1lcyBoYXZlIGFjY2VwdGVkICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIGxhYmVscyBhbHJlYWR5LiBUbyBjb250aW51ZSwgc2VsZWN0IGFkZGl0aW9uYWwgbmFtZXMgdG8gbWFwLCBvciB1c2UgdGhlICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsnPHNwYW4gY2xhc3M9XCJidG4tZ3JvdXBcIiBzdHlsZT1cIm1hcmdpbjogLTJweCAwO1wiPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnPC9zcGFuPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIGJ1dHRvbnMgdG8gcmVqZWN0IGFueSBsYWJlbCBhdCBsZWZ0LCBvciBjaGFuZ2UgdGhlIGZpbHRlciBhbmQgc29ydCBvcHRpb25zJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKycgdG8gYnJpbmcgdW5tYXBwZWQgbmFtZXMgaW50byB2aWV3LjwnKycvcD4nO1xuICAgICAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzaG93QmF0Y2hSZWplY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBuZWVkc0F0dGVudGlvbiA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkKCcubWFwcGluZy1kZXRhaWxzJykuaHRtbChkZXRhaWxzSFRNTCk7XG4gICAgaWYgKHNob3dCYXRjaEFwcHJvdmUgfHwgc2hvd0JhdGNoUmVqZWN0KSB7XG4gICAgICAgICQoJy5tYXBwaW5nLWJhdGNoLW9wZXJhdGlvbnMnKS5zaG93KCk7XG4gICAgICAgIGlmIChzaG93QmF0Y2hBcHByb3ZlKSB7XG4gICAgICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zICNiYXRjaC1hcHByb3ZlJykuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnLm1hcHBpbmctYmF0Y2gtb3BlcmF0aW9ucyAjYmF0Y2gtYXBwcm92ZScpLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hvd0JhdGNoUmVqZWN0KSB7XG4gICAgICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zICNiYXRjaC1yZWplY3QnKS5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zICNiYXRjaC1yZWplY3QnKS5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zJykuaGlkZSgpO1xuICAgIH1cbiAgICBpZiAobmVlZHNBdHRlbnRpb24pIHtcbiAgICAgICAgJCgnI21hcHBpbmctc3RhdHVzLXBhbmVsJykuYWRkQ2xhc3MoJ21hcHBpbmctbmVlZHMtYXR0ZW50aW9uJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJCgnI21hcHBpbmctc3RhdHVzLXBhbmVsJykucmVtb3ZlQ2xhc3MoJ21hcHBpbmctbmVlZHMtYXR0ZW50aW9uJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzdGFydEF1dG9NYXBwaW5nKCkge1xuICAgIC8vIGJlZ2luIGEgZGFpc3ktY2hhaW4gb2YgQUpBWCBvcGVyYXRpb25zLCBtYXBwaW5nIDEgbGFiZWwgKG9yIG1vcmU/KSB0byBrbm93biB0YXhhXG4gICAgLy8gVE9ETzogd2hhdCBpZiB0aGVyZSB3YXMgYSBwZW5kaW5nIG9wZXJhdGlvbiB3aGVuIHdlIHN0b3BwZWQ/XG4gICAgYXV0b01hcHBpbmdJblByb2dyZXNzKCB0cnVlICk7XG4gICAgcmVxdWVzdFRheG9uTWFwcGluZygpOyAgLy8gdHJ5IHRvIGdyYWIgdGhlIGZpcnN0IHVubWFwcGVkIGxhYmVsIGluIHZpZXdcbiAgICB1cGRhdGVNYXBwaW5nU3RhdHVzKCk7XG59XG5mdW5jdGlvbiBzdG9wQXV0b01hcHBpbmcoKSB7XG4gICAgLy8gVE9ETzogd2hhdCBpZiB0aGVyZSdzIGFuIG9wZXJhdGlvbiBpbiBwcm9ncmVzcz8gZ2V0IGl0cyByZXN1bHQsIG9yIGRyb3AgaXQ/XG4gICAgYXV0b01hcHBpbmdJblByb2dyZXNzKCBmYWxzZSApO1xuICAgIGN1cnJlbnRseU1hcHBpbmdOYW1lcy5yZW1vdmVBbGwoKTtcbiAgICByZWNlbnRNYXBwaW5nU3BlZWRCYXJDbGFzcyggJ3Byb2dyZXNzIHByb2dyZXNzLWluZm8nICk7ICAgLy8gaW5hY3RpdmUgYmx1ZSBiYXJcbiAgICB1cGRhdGVNYXBwaW5nU3RhdHVzKCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZU1hcHBpbmdTcGVlZCggbmV3RWxhcHNlZFRpbWUgKSB7XG4gICAgcmVjZW50TWFwcGluZ1RpbWVzLnB1c2gobmV3RWxhcHNlZFRpbWUpO1xuICAgIGlmIChyZWNlbnRNYXBwaW5nVGltZXMubGVuZ3RoID4gNSkge1xuICAgICAgICAvLyBrZWVwIGp1c3QgdGhlIGxhc3QgNSB0aW1lc1xuICAgICAgICByZWNlbnRNYXBwaW5nVGltZXMgPSByZWNlbnRNYXBwaW5nVGltZXMuc2xpY2UoLTUpO1xuICAgIH1cblxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgJC5lYWNoKHJlY2VudE1hcHBpbmdUaW1lcywgZnVuY3Rpb24oaSwgdGltZSkge1xuICAgICAgICB0b3RhbCArPSB0aW1lO1xuICAgIH0pO1xuICAgIHZhciByb2xsaW5nQXZlcmFnZSA9IHRvdGFsIC8gcmVjZW50TWFwcGluZ1RpbWVzLmxlbmd0aDtcbiAgICB2YXIgc2VjUGVyTmFtZSA9IHJvbGxpbmdBdmVyYWdlIC8gMTAwMDtcbiAgICAvLyBzaG93IGEgbGVnaWJsZSBudW1iZXIgKGZpcnN0IHNpZ25pZmljYW50IGRpZ2l0KVxuICAgIHZhciBkaXNwbGF5U2VjO1xuICAgIGlmIChzZWNQZXJOYW1lID49IDAuMSkge1xuICAgICAgICBkaXNwbGF5U2VjID0gc2VjUGVyTmFtZS50b0ZpeGVkKDEpO1xuICAgIH0gZWxzZSBpZiAoc2VjUGVyTmFtZSA+PSAwLjAxKSB7XG4gICAgICAgIGRpc3BsYXlTZWMgPSBzZWNQZXJOYW1lLnRvRml4ZWQoMik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZGlzcGxheVNlYyA9IHNlY1Blck5hbWUudG9GaXhlZCgzKTtcbiAgICB9XG5cbiAgICByZWNlbnRNYXBwaW5nU3BlZWRMYWJlbCggZGlzcGxheVNlYyArXCIgc2VjIC8gbmFtZVwiKTtcblxuICAgIC8vIHVzZSBhcmJpdHJhcnkgc3BlZWRzIGhlcmUsIGZvciBiYWQvZmFpci9nb29kXG4gICAgaWYgKHNlY1Blck5hbWUgPCAwLjIpIHtcbiAgICAgICAgcmVjZW50TWFwcGluZ1NwZWVkQmFyQ2xhc3MoICdwcm9ncmVzcyBwcm9ncmVzcy1zdWNjZXNzJyApOyAgLy8gZ3JlZW4gYmFyXG4gICAgfSBlbHNlIGlmIChzZWNQZXJOYW1lIDwgMi4wKSB7XG4gICAgICAgIHJlY2VudE1hcHBpbmdTcGVlZEJhckNsYXNzKCAncHJvZ3Jlc3MgcHJvZ3Jlc3Mtd2FybmluZycgKTsgIC8vIG9yYW5nZSBiYXJcbiAgICB9IGVsc2Uge1xuICAgICAgICByZWNlbnRNYXBwaW5nU3BlZWRCYXJDbGFzcyggJ3Byb2dyZXNzIHByb2dyZXNzLWRhbmdlcicgKTsgICAvLyByZWQgYmFyXG4gICAgfVxuXG4gICAgLy8gYmFyIHdpZHRoIGlzIGFwcHJveGltYXRlLCBuZWVkcyB+NDAlIHRvIHNob3cgaXRzIHRleHRcbiAgICByZWNlbnRNYXBwaW5nU3BlZWRQZXJjZW50KCAoNDAgKyBNYXRoLm1pbiggKDAuMSAvIHNlY1Blck5hbWUpICogNjAsIDYwKSkudG9GaXhlZCgpICtcIiVcIiApO1xufVxuXG5cbmZ1bmN0aW9uIGdldE5leHRVbm1hcHBlZE5hbWUoKSB7XG4gICAgdmFyIHVubWFwcGVkTmFtZSA9IG51bGw7XG4gICAgdmFyIHZpc2libGVOYW1lcyA9IHZpZXdNb2RlbC5maWx0ZXJlZE5hbWVzKCkucGFnZWRJdGVtcygpO1xuICAgICQuZWFjaCggdmlzaWJsZU5hbWVzLCBmdW5jdGlvbiAoaSwgbmFtZSkge1xuICAgICAgICB2YXIgaXNBdmFpbGFibGUgPSBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddIHx8IGZhbHNlO1xuICAgICAgICAvLyBpZiBubyBzdWNoIGF0dHJpYnV0ZSwgY29uc2lkZXIgaXQgdW5hdmFpbGFibGVcbiAgICAgICAgaWYgKGlzQXZhaWxhYmxlKSB7XG4gICAgICAgICAgICB2YXIgb3R0TWFwcGluZ1RhZyA9IG5hbWVbJ290dElkJ10gfHwgbnVsbDtcbiAgICAgICAgICAgIHZhciBwcm9wb3NlZE1hcHBpbmdJbmZvID0gcHJvcG9zZWRNYXBwaW5nKG5hbWUpO1xuICAgICAgICAgICAgaWYgKCFvdHRNYXBwaW5nVGFnICYmICFwcm9wb3NlZE1hcHBpbmdJbmZvKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBhbiB1bm1hcHBlZCBuYW1lIVxuICAgICAgICAgICAgICAgIGlmIChmYWlsZWRNYXBwaW5nTmFtZXMuaW5kZXhPZihuYW1lWydpZCddKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgaGFzbid0IGZhaWxlZCBtYXBwaW5nIChhdCBsZWFzdCBub3QgeWV0KVxuICAgICAgICAgICAgICAgICAgICB1bm1hcHBlZE5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHVubWFwcGVkTmFtZTtcbn1cblxuLyogVE5SUyByZXF1ZXN0cyBhcmUgc2VudCB2aWEgUE9TVCBhbmQgY2Fubm90IGJlIGNhY2hlZCBieSB0aGUgYnJvd3Nlci4gS2VlcFxuICogdHJhY2sgb2YgcmVzcG9uc2VzIGluIGEgc2ltcGxlIGxvY2FsIGNhY2hlLCB0byBhdm9pZCBleHRyYSByZXF1ZXN0cyBmb3JcbiAqIGlkZW50aWNhbCB0YXhvbiBuYW1lcy4gKFRoaXMgaXMgY29tbW9uIHdoZW4gbWFueSBzaW1pbGFyIGxhYmVscyBoYXZlIGJlZW5cbiAqIFwibW9kaWZpZWQgZm9yIG1hcHBpbmdcIikuXG4gKlxuICogV2UnbGwgdXNlIGEgRklGTyBzdHJhdGVneSB0byBrZWVwIHRoaXMgdG8gYSByZWFzb25hYmxlIHNpemUuIEkgYmVsaWV2ZSB0aGlzXG4gKiB3aWxsIGhhbmRsZSB0aGUgZXhwZWN0ZWQgY2FzZSBvZiBtYW55IGxhYmVscyBiZWluZyBtb2RpZmllZCB0byB0aGUgc2FtZVxuICogc3RyaW5nLlxuICovXG52YXIgVE5SU0NhY2hlU2l6ZSA9IDIwMDtcbnZhciBUTlJTQ2FjaGUgPSB7fTtcbnZhciBUTlJTQ2FjaGVLZXlzID0gW107XG5mdW5jdGlvbiBhZGRUb1ROUlNDYWNoZSgga2V5LCB2YWx1ZSApIHtcbiAgICAvLyBhZGQgKG9yIHVwZGF0ZSkgdGhlIGNhY2hlIGZvciB0aGlzIGtleVxuICAgIGlmICghKGtleSBpbiBUTlJTQ2FjaGUpKSB7XG4gICAgICAgIFROUlNDYWNoZUtleXMucHVzaCgga2V5ICk7XG4gICAgfVxuICAgIFROUlNDYWNoZVsga2V5IF0gPSB2YWx1ZTtcbiAgICBpZiAoVE5SU0NhY2hlS2V5cy5sZW5ndGggPiBUTlJTQ2FjaGVTaXplKSB7XG4gICAgICAgIC8vIGNsZWFyIHRoZSBvbGRlc3QgY2FjaGVkIGl0ZW1cbiAgICAgICAgdmFyIGRvb21lZEtleSA9IFROUlNDYWNoZUtleXMuc2hpZnQoKTtcbiAgICAgICAgZGVsZXRlIFROUlNDYWNoZVsgZG9vbWVkS2V5IF07XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFROUlNDYWNoZSk7XG59XG5mdW5jdGlvbiBjbGVhclROUlNDYWNoZSgpIHtcbiAgICBUTlJTQ2FjaGUgPSB7fTtcbn07XG5cbmZ1bmN0aW9uIHJlcXVlc3RUYXhvbk1hcHBpbmcoIG5hbWVUb01hcCApIHtcbiAgICAvLyBzZXQgc3Bpbm5lciwgbWFrZSByZXF1ZXN0LCBoYW5kbGUgcmVzcG9uc2UsIGFuZCBkYWlzeS1jaGFpbiB0aGUgbmV4dCByZXF1ZXN0XG4gICAgLy8gVE9ETzogc2VuZCBvbmUgYXQgYSB0aW1lPyBvciBpbiBhIGJhdGNoICg1IGl0ZW1zKT9cblxuICAgIC8vIE5PVEUgdGhhdCB3ZSBtaWdodCBiZSByZXF1ZXN0aW5nIGEgc2luZ2xlIG5hbWUsIGVsc2UgZmluZCB0aGUgbmV4dCB1bm1hcHBlZCBvbmVcbiAgICB2YXIgc2luZ2xlVGF4b25NYXBwaW5nO1xuICAgIGlmIChuYW1lVG9NYXApIHtcbiAgICAgICAgc2luZ2xlVGF4b25NYXBwaW5nID0gdHJ1ZTtcbiAgICAgICAgZmFpbGVkTWFwcGluZ05hbWVzLnJlbW92ZShuYW1lVG9NYXBbJ2lkJ10gKTtcbiAgICAgICAgYXV0b01hcHBpbmdJblByb2dyZXNzKCB0cnVlICk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2luZ2xlVGF4b25NYXBwaW5nID0gZmFsc2U7XG4gICAgICAgIG5hbWVUb01hcCA9IGdldE5leHRVbm1hcHBlZE5hbWUoKTtcbiAgICB9XG4gICAgaWYgKCFuYW1lVG9NYXApIHtcbiAgICAgICAgc3RvcEF1dG9NYXBwaW5nKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB1cGRhdGVNYXBwaW5nU3RhdHVzKCk7XG4gICAgdmFyIG5hbWVJRCA9IG5hbWVUb01hcFsnaWQnXTtcbiAgICB2YXIgb3JpZ2luYWxMYWJlbCA9ICQudHJpbShuYW1lVG9NYXBbJ29yaWdpbmFsTGFiZWwnXSkgfHwgbnVsbDtcbiAgICAvLyB1c2UgdGhlIG1hbnVhbGx5IGVkaXRlZCBsYWJlbCAoaWYgYW55KSwgb3IgdGhlIGhpbnQtYWRqdXN0ZWQgdmVyc2lvblxuICAgIHZhciBlZGl0ZWRMYWJlbCA9ICQudHJpbShuYW1lVG9NYXBbJ2FkanVzdGVkTGFiZWwnXSk7XG4gICAgdmFyIHNlYXJjaFRleHQgPSAoZWRpdGVkTGFiZWwgIT09ICcnKSA/IGVkaXRlZExhYmVsIDogJC50cmltKGFkanVzdGVkTGFiZWwob3JpZ2luYWxMYWJlbCkpO1xuXG4gICAgaWYgKHNlYXJjaFRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTm8gbmFtZSB0byBtYXRjaCFcIik7IC8vIFRPRE9cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoc2VhcmNoVGV4dC5sZW5ndGggPCAyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTmVlZCBhdCBsZWFzdCB0d28gbGV0dGVycyFcIik7IC8vIFRPRE9cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGdyb29tIHRyaW1tZWQgdGV4dCBiYXNlZCBvbiBvdXIgc2VhcmNoIHJ1bGVzXG4gICAgdmFyIHNlYXJjaENvbnRleHROYW1lID0gdmlld01vZGVsLm1hcHBpbmdIaW50cy5zZWFyY2hDb250ZXh0KCk7XG4gICAgdmFyIHVzaW5nRnV6enlNYXRjaGluZyA9IHZpZXdNb2RlbC5tYXBwaW5nSGludHMudXNlRnV6enlNYXRjaGluZygpIHx8IGZhbHNlO1xuICAgIHZhciBhdXRvQWNjZXB0aW5nRXhhY3RNYXRjaGVzID0gdmlld01vZGVsLm1hcHBpbmdIaW50cy5hdXRvQWNjZXB0RXhhY3RNYXRjaGVzKCkgfHwgZmFsc2U7XG4gICAgLy8gc2hvdyBzcGlubmVyIGFsb25nc2lkZSB0aGlzIGl0ZW0uLi5cbiAgICBjdXJyZW50bHlNYXBwaW5nTmFtZXMucHVzaCggbmFtZUlEICk7XG5cbiAgICB2YXIgbWFwcGluZ1N0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG5cbiAgICBmdW5jdGlvbiB0bnJzU3VjY2VzcyhkYXRhKSB7XG4gICAgICAgIC8vIElGIHRoZXJlJ3MgYSBwcm9wZXIgcmVzcG9uc2UsIGFzc2VydCB0aGlzIGFzIHRoZSBuYW1lIGFuZCBsYWJlbCBmb3IgdGhpcyBub2RlXG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSByb2xsaW5nIGF2ZXJhZ2UgZm9yIHRoZSBtYXBwaW5nLXNwZWVkIGJhclxuICAgICAgICB2YXIgbWFwcGluZ1N0b3BUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgdXBkYXRlTWFwcGluZ1NwZWVkKCBtYXBwaW5nU3RvcFRpbWUuZ2V0VGltZSgpIC0gbWFwcGluZ1N0YXJ0VGltZS5nZXRUaW1lKCkgKTtcblxuICAgICAgICB2YXIgbWF4UmVzdWx0cyA9IDEwMDtcbiAgICAgICAgdmFyIHZpc2libGVSZXN1bHRzID0gMDtcbiAgICAgICAgdmFyIHJlc3VsdFNldHNGb3VuZCA9IChkYXRhICYmICgncmVzdWx0cycgaW4gZGF0YSkgJiYgKGRhdGEucmVzdWx0cy5sZW5ndGggPiAwKSk7XG4gICAgICAgIHZhciBjYW5kaWRhdGVNYXRjaGVzID0gWyBdO1xuICAgICAgICAvLyBGb3Igbm93LCB3ZSB3YW50IHRvIGF1dG8tYXBwbHkgaWYgdGhlcmUncyBleGFjdGx5IG9uZSBtYXRjaFxuICAgICAgICBpZiAocmVzdWx0U2V0c0ZvdW5kKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGRhdGEucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTk8gU0VBUkNIIFJFU1VMVCBTRVRTIEZPVU5EIScpO1xuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVNYXRjaGVzID0gWyBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGV4cGVjdGVkIGNhc2VcbiAgICAgICAgICAgICAgICAgICAgY2FuZGlkYXRlTWF0Y2hlcyA9IGRhdGEucmVzdWx0c1swXS5tYXRjaGVzIHx8IFsgXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ01VTFRJUExFIFNFQVJDSCBSRVNVTFQgU0VUUyAoVVNJTkcgRklSU1QpJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihkYXRhWydyZXN1bHRzJ10pO1xuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVNYXRjaGVzID0gZGF0YS5yZXN1bHRzWzBdLm1hdGNoZXMgfHwgWyBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IEZpbHRlciBjYW5kaWRhdGUgbWF0Y2hlcyBiYXNlZCBvbiB0aGVpciBwcm9wZXJ0aWVzLCBzY29yZXMsIGV0Yy4/XG5cbiAgICAgICAgc3dpdGNoIChjYW5kaWRhdGVNYXRjaGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIGZhaWxlZE1hcHBpbmdOYW1lcy5wdXNoKCBuYW1lSUQgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgLyogU0tJUFBJTkcgVEhJUyB0byBwcm92aWRlIHVuaWZvcm0gdHJlYXRtZW50IG9mIGFsbCBtYXRjaGVzXG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgLy8gY2hvb3NlIHRoZSBmaXJzdCtvbmx5IG1hdGNoIGF1dG9tYXRpY2FsbHkhXG4gICAgICAgICAgICAgICAgLi4uXG4gICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyBtdWx0aXBsZSBtYXRjaGVzIGZvdW5kLCBvZmZlciBhIGNob2ljZVxuICAgICAgICAgICAgICAgIC8vIEFTU1VNRVMgd2Ugb25seSBnZXQgb25lIHJlc3VsdCBzZXQsIHdpdGggbiBtYXRjaGVzXG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBTb3J0IG1hdGNoZXMgYmFzZWQgb24gZXhhY3QgdGV4dCBtYXRjaGVzPyBmcmFjdGlvbmFsIChtYXRjaGluZykgc2NvcmVzPyBzeW5vbnltcyBvciBob21vbnltcz9cbiAgICAgICAgICAgICAgICAvKiBpbml0aWFsIHNvcnQgb24gbG93ZXIgdGF4YSAod2lsbCBiZSBvdmVycmlkZGVuIGJ5IGV4YWN0IG1hdGNoZXMpXG4gICAgICAgICAgICAgICAgY2FuZGlkYXRlTWF0Y2hlcy5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYS5pc19hcHByb3hpbWF0ZV9tYXRjaCA9PT0gYi5pc19hcHByb3hpbWF0ZV9tYXRjaCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhLmlzX2FwcHJveGltYXRlX21hdGNoKSByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGIuaXNfYXBwcm94aW1hdGVfbWF0Y2gpIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgLyogVE9ETzogSWYgbXVsdGlwbGUgbWF0Y2hlcyBwb2ludCB0byBhIHNpbmdsZSB0YXhvbiwgc2hvdyBqdXN0IHRoZSBcImJlc3RcIiBtYXRjaFxuICAgICAgICAgICAgICAgICAqICAgLSBTcGVsbGluZyBjb3VudHMhIFNob3cgYW4gZXhhY3QgbWF0Y2ggKGUuZy4gc3lub255bSkgdnMuIGluZXhhY3Qgc3BlbGxpbmcuXG4gICAgICAgICAgICAgICAgICogICAtIFRPRE86IGFkZCBtb3JlIHJ1bGVzPyBvciBqdXN0IGNvbW1lbnQgdGhlIGNvZGUgYmVsb3dcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB2YXIgZ2V0UHJlZmVycmVkVGF4b25DYW5kaWRhdGUgPSBmdW5jdGlvbiggY2FuZGlkYXRlQSwgY2FuZGlkYXRlQiApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIHdoaWNoZXZlciBpcyBwcmVmZXJyZWQsIGJhc2VkIG9uIGEgZmV3IGNyaXRlcmlhOlxuICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2hBID0gY2FuZGlkYXRlQS5vcmlnaW5hbE1hdGNoO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2hCID0gY2FuZGlkYXRlQi5vcmlnaW5hbE1hdGNoO1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBvbmUgaXMgdGhlIGV4YWN0IG1hdGNoLCB0aGF0J3MgaWRlYWwgKGJ1dCB1bmxpa2VseSBzaW5jZSBcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIFROUlMgYXBwYXJlbnRseSByZXR1cm5lZCBtdWx0aXBsZSBjYW5kaWRhdGVzKS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaEEuaXNfYXBwcm94aW1hdGVfbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGVBO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFtYXRjaEIuaXNfYXBwcm94aW1hdGVfbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGVCO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3cgdGhlIG1vc3Qgc2ltaWxhciBuYW1lIChvciBzeW5vbnltKSBmb3IgdGhpcyB0YXhvbi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoQS5zY29yZSA+IG1hdGNoQi5zY29yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZUE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZUI7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgZ2V0UHJpb3JNYXRjaGluZ0NhbmRpZGF0ZSA9IGZ1bmN0aW9uKCBvdHRJZCwgcHJpb3JDYW5kaWRhdGVzICkge1xuICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gYW55IG1hdGNoIHdlJ3ZlIGFscmVhZHkgZXhhbWluZWQgZm9yIHRoaXMgdGF4b25cbiAgICAgICAgICAgICAgICAgICAgdmFyIHByaW9yTWF0Y2ggPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2gocHJpb3JDYW5kaWRhdGVzLCBmdW5jdGlvbihpLCBjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYy5vdHRJZCA9PT0gb3R0SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmlvck1hdGNoID0gYztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7ICAvLyB0aGVyZSBzaG91bGQgYmUganVzdCBvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmlvck1hdGNoO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdmFyIHJhd01hdGNoVG9DYW5kaWRhdGUgPSBmdW5jdGlvbiggcmF3LCBuYW1lSUQgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNpbXBsaWZ5IHRoZSBcInJhd1wiIG1hdGNoZXMgcmV0dXJuZWQgYnkgVE5SU1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcmF3LnRheG9uWyd1bmlxdWVfbmFtZSddIHx8IHJhdy50YXhvblsnbmFtZSddLCAgICAgICAvLyBtYXRjaGVkIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIG90dElkOiByYXcudGF4b25bJ290dF9pZCddLCAgICAgLy8gbWF0Y2hlZCBPVFQgaWQgKGFzIG51bWJlciEpXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXhvbm9taWNTb3VyY2VzOiByYXcudGF4b25bJ3RheF9zb3VyY2VzJ10sICAgLy8gXCJ1cHN0cmVhbVwiIHRheG9ub21pZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZXhhY3Q6IGZhbHNlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBib29sZWFuIChpZ25vcmluZyB0aGlzIGZvciBub3cpXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2hpZ2hlcjogZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYm9vbGVhblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVXNlIGZsYWdzIGZvciB0aGlzID8gaGlnaGVyOiAoJC5pbkFycmF5KCdTSUJMSU5HX0hJR0hFUicsIHJlc3VsdFRvTWFwLmZsYWdzKSA9PT0gLTEpID8gZmFsc2UgOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbE1hdGNoOiByYXcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lSUQ6IG5hbWVJRFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlTWFwcGluZ0xpc3QgPSBbIF07XG4gICAgICAgICAgICAgICAgJC5lYWNoKGNhbmRpZGF0ZU1hdGNoZXMsIGZ1bmN0aW9uKGksIG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnZlcnQgdG8gZXhwZWN0ZWQgc3RydWN0dXJlIGZvciBwcm9wb3NlZCBtYXBwaW5nc1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlID0gcmF3TWF0Y2hUb0NhbmRpZGF0ZSggbWF0Y2gsIG5hbWVJRCApO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJpb3JUYXhvbkNhbmRpZGF0ZSA9IGdldFByaW9yTWF0Y2hpbmdDYW5kaWRhdGUoIGNhbmRpZGF0ZS5vdHRJZCwgY2FuZGlkYXRlTWFwcGluZ0xpc3QgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByaW9yVGF4b25DYW5kaWRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmlvclBvc2l0aW9uID0gJC5pbkFycmF5KHByaW9yVGF4b25DYW5kaWRhdGUsIGNhbmRpZGF0ZU1hcHBpbmdMaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmVmZXJyZWRDYW5kaWRhdGUgPSBnZXRQcmVmZXJyZWRUYXhvbkNhbmRpZGF0ZSggY2FuZGlkYXRlLCBwcmlvclRheG9uQ2FuZGlkYXRlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWx0ZXJuYXRlQ2FuZGlkYXRlID0gKHByZWZlcnJlZENhbmRpZGF0ZSA9PT0gY2FuZGlkYXRlKSA/IHByaW9yVGF4b25DYW5kaWRhdGUgOiBjYW5kaWRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aGljaGV2ZXIgb25lIHdhcyBjaG9zZW4gd2lsbCAocmUpdGFrZSB0aGlzIHBsYWNlIGluIG91ciBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FuZGlkYXRlTWFwcGluZ0xpc3Quc3BsaWNlKHByaW9yUG9zaXRpb24sIDEsIHByZWZlcnJlZENhbmRpZGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgb3RoZXIgY2FuZGlkYXRlIHdpbGwgYmUgc3Rhc2hlZCBhcyBhIGNoaWxkLCBpbiBjYXNlIHdlIG5lZWQgaXQgbGF0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnYWx0ZXJuYXRlVGF4b25DYW5kaWRhdGVzJyBpbiBwcmVmZXJyZWRDYW5kaWRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmZXJyZWRDYW5kaWRhdGUuYWx0ZXJuYXRlVGF4b25DYW5kaWRhdGVzLnB1c2goIGFsdGVybmF0ZUNhbmRpZGF0ZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmZXJyZWRDYW5kaWRhdGUuYWx0ZXJuYXRlVGF4b25DYW5kaWRhdGVzID0gWyBhbHRlcm5hdGVDYW5kaWRhdGUgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbmRpZGF0ZU1hcHBpbmdMaXN0LnB1c2goY2FuZGlkYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdmFyIGF1dG9BY2NlcHRhYmxlTWFwcGluZyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGNhbmRpZGF0ZU1hcHBpbmdMaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb25seU1hcHBpbmcgPSBjYW5kaWRhdGVNYXBwaW5nTGlzdFswXTtcbiAgICAgICAgICAgICAgICAgICAgLyogTkIgLSBhdXRvLWFjY2VwdCBpbmNsdWRlcyBzeW5vbnltcyBpZiBleGFjdCBtYXRjaCFcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlNYXBwaW5nLm9yaWdpbmFsTWF0Y2guaXNfc3lub255bSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIC8qIE4uQi4gV2UgbmV2ZXIgcHJlc2VudCB0aGUgc29sZSBtYXBwaW5nIHN1Z2dlc3Rpb24gYXMgYVxuICAgICAgICAgICAgICAgICAgICAgKiB0YXhvbi1uYW1lIGhvbW9ueW0sIHNvIGp1c3QgY29uc2lkZXIgdGhlIG1hdGNoIHNjb3JlIHRvXG4gICAgICAgICAgICAgICAgICAgICAqIGRldGVybWluZSB3aGV0aGVyIGl0J3MgYW4gXCJleGFjdCBtYXRjaFwiLlxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlNYXBwaW5nLm9yaWdpbmFsTWF0Y2guc2NvcmUgPT09IDEuMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0FjY2VwdGFibGVNYXBwaW5nID0gb25seU1hcHBpbmc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGF1dG9BY2NlcHRpbmdFeGFjdE1hdGNoZXMgJiYgYXV0b0FjY2VwdGFibGVNYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFjY2VwdCB0aGUgb2J2aW91cyBjaG9pY2UgKGFuZCBwb3NzaWJseSB1cGRhdGUgVUkpIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgIG1hcE5hbWVUb1RheG9uKCBuYW1lSUQsIGF1dG9BY2NlcHRhYmxlTWFwcGluZywge1BPU1RQT05FX1VJX0NIQU5HRVM6IHRydWV9ICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcG9zdHBvbmUgYWN0dWFsIG1hcHBpbmcgdW50aWwgdXNlciBjaG9vc2VzXG4gICAgICAgICAgICAgICAgICAgIHByb3Bvc2VOYW1lTGFiZWwobmFtZUlELCBjYW5kaWRhdGVNYXBwaW5nTGlzdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudGx5TWFwcGluZ05hbWVzLnJlbW92ZSggbmFtZUlEICk7XG5cbiAgICAgICAgaWYgKHNpbmdsZVRheG9uTWFwcGluZykge1xuICAgICAgICAgICAgc3RvcEF1dG9NYXBwaW5nKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYXV0b01hcHBpbmdJblByb2dyZXNzKCkpIHtcbiAgICAgICAgICAgIC8vIGFmdGVyIGEgYnJpZWYgcGF1c2UsIHRyeSBmb3IgdGhlIG5leHQgYXZhaWxhYmxlIG5hbWUuLi5cbiAgICAgICAgICAgIHNldFRpbWVvdXQocmVxdWVzdFRheG9uTWFwcGluZywgMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBUTlJTUXVlcnlBbmRDYWNoZUtleSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgXCJuYW1lc1wiOiBbc2VhcmNoVGV4dF0sXG4gICAgICAgIFwiaW5jbHVkZV9zdXBwcmVzc2VkXCI6IGZhbHNlLFxuICAgICAgICBcImRvX2FwcHJveGltYXRlX21hdGNoaW5nXCI6IChzaW5nbGVUYXhvbk1hcHBpbmcgfHwgdXNpbmdGdXp6eU1hdGNoaW5nKSA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgXCJjb250ZXh0X25hbWVcIjogc2VhcmNoQ29udGV4dE5hbWVcbiAgICB9KTtcblxuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogZG9UTlJTRm9yTWFwcGluZ09UVXNfdXJsLCAgLy8gTk9URSB0aGF0IGFjdHVhbCBzZXJ2ZXItc2lkZSBtZXRob2QgbmFtZSBtaWdodCBiZSBxdWl0ZSBkaWZmZXJlbnQhXG4gICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgZGF0YTogVE5SU1F1ZXJ5QW5kQ2FjaGVLZXksICAvLyBkYXRhIChhc3RlcmlzayByZXF1aXJlZCBmb3IgY29tcGxldGlvbiBzdWdnZXN0aW9ucylcbiAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgICAgICAgYmVmb3JlU2VuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gY2hlY2sgb3VyIGxvY2FsIGNhY2hlIHRvIHNlZSBpZiB0aGlzIGlzIGEgcmVwZWF0XG4gICAgICAgICAgICB2YXIgY2FjaGVkUmVzcG9uc2UgPSBUTlJTQ2FjaGVbIFROUlNRdWVyeUFuZENhY2hlS2V5IF07XG4gICAgICAgICAgICBpZiAoY2FjaGVkUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB0bnJzU3VjY2VzcyggY2FjaGVkUmVzcG9uc2UgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIiEhISBzb21ldGhpbnkgd2VudCB0ZXJyaWJseSB3cm9uZ1wiKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGpxWEhSLnJlc3BvbnNlVGV4dCk7XG5cbiAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UoXCJTb21ldGhpbmcgd2VudCB3cm9uZyBpbiB0YXhvbWFjaGluZTpcXG5cIisganFYSFIucmVzcG9uc2VUZXh0KTtcblxuICAgICAgICAgICAgaWYgKCFhdXRvTWFwcGluZ0luUHJvZ3Jlc3MoKSkge1xuICAgICAgICAgICAgICAgIC8vIGN1cmF0b3IgaGFzIHBhdXNlZCBhbGwgbWFwcGluZ1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VycmVudGx5TWFwcGluZ05hbWVzLnJlbW92ZSggbmFtZUlEICk7XG5cbiAgICAgICAgICAgIC8vIGxldCdzIGhvcGUgaXQncyBzb21ldGhpbmcgYWJvdXQgdGhpcyBsYWJlbCBhbmQgdHJ5IHRoZSBuZXh0IG9uZS4uLlxuICAgICAgICAgICAgZmFpbGVkTWFwcGluZ05hbWVzLnB1c2goIG5hbWVJRCApO1xuICAgICAgICAgICAgaWYgKHNpbmdsZVRheG9uTWFwcGluZykge1xuICAgICAgICAgICAgICAgIHN0b3BBdXRvTWFwcGluZygpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhdXRvTWFwcGluZ0luUHJvZ3Jlc3MoKSkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQocmVxdWVzdFRheG9uTWFwcGluZywgMTAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAvLyBhZGQgdGhpcyByZXNwb25zZSB0byB0aGUgbG9jYWwgY2FjaGVcbiAgICAgICAgICAgIGFkZFRvVE5SU0NhY2hlKCBUTlJTUXVlcnlBbmRDYWNoZUtleSwgZGF0YSApO1xuICAgICAgICAgICAgdG5yc1N1Y2Nlc3MoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZUJ5SUQoaWQpIHtcbiAgICAvLyByZXR1cm4gdGhlIG1hdGNoaW5nIG90dSwgb3IgbnVsbCBpZiBub3QgZm91bmRcbiAgICB2YXIgbWF0Y2hpbmdOYW1lID0gbnVsbDtcbiAgICAkLmVhY2goIHZpZXdNb2RlbC5uYW1lcygpLCBmdW5jdGlvbihpLCBuYW1lKSB7XG4gICAgICAgIGlmIChuYW1lLmlkID09PSBpZCkgeyAgXG4gICAgICAgICAgICBtYXRjaGluZ05hbWUgPSBuYW1lO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG1hdGNoaW5nTmFtZTtcbiAgICAvKiBUT0RPOiBpZiBwZXJmb3JtYW5jZSBzdWZmZXJzLCB1c2UgZmFzdCBsb29rdXAhXG4gICAgdmFyIGxvb2t1cCA9IGdldEZhc3RMb29rdXAoJ05BTUVTX0JZX0lEJyk7XG4gICAgcmV0dXJuIGxvb2t1cFsgaWQgXSB8fCBudWxsO1xuICAgICovXG59XG5cblxuZnVuY3Rpb24gbWFwTmFtZVRvVGF4b24oIG5hbWVJRCwgbWFwcGluZ0luZm8sIG9wdGlvbnMgKSB7XG4gICAgLyogQXBwbHkgdGhpcyBtYXBwaW5nLCBjcmVhdGluZyBOZXhzb24gZWxlbWVudHMgYXMgbmVlZGVkXG4gICAgICpcbiAgICAgKiBtYXBwaW5nSW5mbyBzaG91bGQgYmUgYW4gb2JqZWN0IHdpdGggdGhlc2UgcHJvcGVydGllczpcbiAgICAgKiB7XG4gICAgICogICBcIm5hbWVcIiA6IFwiQ2VudHJhbnRodXNcIixcbiAgICAgKiAgIFwib3R0SWRcIiA6IFwiNzU5MDQ2XCIsXG4gICAgICpcbiAgICAgKiAgIC8vIHRoZXNlIG1heSBhbHNvIGJlIHByZXNlbnQsIGJ1dCBhcmVuJ3QgaW1wb3J0YW50IGhlcmVcbiAgICAgKiAgICAgXCJleGFjdFwiIDogZmFsc2UsXG4gICAgICogICAgIFwiaGlnaGVyXCIgOiB0cnVlXG4gICAgICogfVxuICAgICAqXG4gICAgICogTi5CLiBXZSAqYWx3YXlzKiBhZGQvY2hhbmdlL3JlbW92ZSB0aGVzZSBwcm9wZXJ0aWVzIGluIHRhbmRlbSFcbiAgICAgKiAgICBvdHRJZFxuICAgICAqICAgIG90dFRheG9uTmFtZVxuICAgICAqICAgIHRheG9ub21pY1NvdXJjZXNcbiAgICAgKi9cblxuICAgIC8vIElmIG9wdGlvbnMuUE9TVFBPTkVfVUlfQ0hBTkdFUywgcGxlYXNlIGRvIHNvIChlbHNlIHdlIGNyYXdsIHdoZW5cbiAgICAvLyBhcHByb3ZpbmcgaHVuZHJlZHMgb2YgbWFwcGluZ3MpXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBGT1IgTk9XLCBhc3N1bWUgdGhhdCBhbnkgbGVhZiBub2RlIHdpbGwgaGF2ZSBhIGNvcnJlc3BvbmRpbmcgb3R1IGVudHJ5O1xuICAgIC8vIG90aGVyd2lzZSwgd2UgY2FuJ3QgaGF2ZSBuYW1lIGZvciB0aGUgbm9kZSFcbiAgICB2YXIgbmFtZSA9IGdldE5hbWVCeUlEKCBuYW1lSUQgKTtcblxuICAgIC8vIERlLXNlbGVjdCB0aGlzIG5hbWUgaW4gdGhlIG1hcHBpbmcgVUlcbiAgICBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddID0gZmFsc2U7XG5cbiAgICAvLyBhZGQgKG9yIHVwZGF0ZSkgYSBtZXRhdGFnIG1hcHBpbmcgdGhpcyB0byBhbiBPVFQgaWRcbiAgICBuYW1lWydvdHRJZCddID0gTnVtYmVyKG1hcHBpbmdJbmZvLm90dElkKTtcblxuICAgIC8vIEFkZC91cGRhdGUgdGhlIE9UVCBuYW1lIChjYWNoZWQgaGVyZSBmb3IgcGVyZm9ybWFuY2UpXG4gICAgbmFtZVsnb3R0VGF4b25OYW1lJ10gPSBtYXBwaW5nSW5mby5uYW1lIHx8ICdPVFQgTkFNRSBNSVNTSU5HISc7XG4gICAgLy8gTi5CLiBXZSBhbHdheXMgcHJlc2VydmUgb3JpZ2luYWxMYWJlbCBmb3IgcmVmZXJlbmNlXG5cbiAgICAvLyBhZGQgXCJ1cHN0cmVhbVwiIHRheG9ub21pYyBzb3VyY2VzXG4gICAgbmFtZVsndGF4b25vbWljU291cmNlcyddID0gbWFwcGluZ0luZm8udGF4b25vbWljU291cmNlcyB8fCAnVEFYT05PTUlDIFNPVVJDRVMgTUlTU0lORyEnO1xuXG4gICAgLy8gQ2xlYXIgYW55IHByb3Bvc2VkL2FkanVzdGVkIGxhYmVsICh0aGlzIGlzIHRydW1wZWQgYnkgbWFwcGluZyB0byBPVFQpXG4gICAgZGVsZXRlIG5hbWVbJ2FkanVzdGVkTGFiZWwnXTtcblxuICAgIGlmICghb3B0aW9ucy5QT1NUUE9ORV9VSV9DSEFOR0VTKSB7XG4gICAgICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB1bm1hcE5hbWVGcm9tVGF4b24oIG5hbWVPcklELCBvcHRpb25zICkge1xuICAgIC8vIHJlbW92ZSB0aGlzIG1hcHBpbmcsIHJlbW92aW5nIGFueSB1bm5lZWRlZCBOZXhzb24gZWxlbWVudHNcblxuICAgIC8vIElmIG9wdGlvbnMuUE9TVFBPTkVfVUlfQ0hBTkdFUywgcGxlYXNlIGRvIHNvIChlbHNlIHdlIGNyYXdsIHdoZW5cbiAgICAvLyBjbGVhcmluZyBodW5kcmVkcyBvZiBtYXBwaW5ncylcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHZhciBuYW1lID0gKHR5cGVvZiBuYW1lT3JJRCA9PT0gJ29iamVjdCcpID8gbmFtZU9ySUQgOiBnZXROYW1lQnlJRCggbmFtZU9ySUQgKTtcbiAgICAvLyByZXN0b3JlIGl0cyBvcmlnaW5hbCBsYWJlbCAodmVyc3VzIG1hcHBlZCBsYWJlbClcbiAgICB2YXIgb3JpZ2luYWxMYWJlbCA9IG5hbWVbJ29yaWdpbmFsTGFiZWwnXTtcblxuICAgIC8vIHN0cmlwIGFueSBtZXRhdGFnIG1hcHBpbmcgdGhpcyB0byBhbiBPVFQgaWRcbiAgICBpZiAoJ290dElkJyBpbiBuYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBuYW1lWydvdHRJZCddO1xuICAgIH1cbiAgICBpZiAoJ290dFRheG9uTmFtZScgaW4gbmFtZSkge1xuICAgICAgICBkZWxldGUgbmFtZVsnb3R0VGF4b25OYW1lJ107XG4gICAgfVxuICAgIGlmICgndGF4b25vbWljU291cmNlcycgaW4gbmFtZSkge1xuICAgICAgICBkZWxldGUgbmFtZVsndGF4b25vbWljU291cmNlcyddO1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy5QT1NUUE9ORV9VSV9DSEFOR0VTKSB7XG4gICAgICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG4gICAgICAgIG51ZGdlVGlja2xlcignVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhZGRNZXRhVGFnVG9QYXJlbnQoIHBhcmVudCwgcHJvcHMgKSB7XG4gICAgLy8gd3JhcCBzdWJtaXR0ZWQgcHJvcGVydGllcyB0byBtYWtlIGFuIG9ic2VydmFibGUgbWV0YXRhZ1xuICAgIHZhciBuZXdUYWcgPSBjbG9uZUZyb21TaW1wbGVPYmplY3QoIHByb3BzICk7XG4gICAgaWYgKCFwYXJlbnQubWV0YSkge1xuICAgICAgICAvLyBhZGQgYSBtZXRhIGNvbGxlY3Rpb24gaGVyZVxuICAgICAgICBwYXJlbnRbJ21ldGEnXSA9IFsgXTtcbiAgICB9IGVsc2UgaWYgKCEkLmlzQXJyYXkocGFyZW50Lm1ldGEpKSB7XG4gICAgICAgIC8vIGNvbnZlcnQgYSBCYWRnZXJmaXNoIFwic2luZ2xldG9uXCIgdG8gYSBwcm9wZXIgYXJyYXlcbiAgICAgICAgcGFyZW50WydtZXRhJ10gPSBbIHBhcmVudC5tZXRhIF07XG4gICAgfVxuICAgIHBhcmVudC5tZXRhLnB1c2goIG5ld1RhZyApO1xufVxuXG5cbmZ1bmN0aW9uIGNsZWFyU2VsZWN0ZWRNYXBwaW5ncygpIHtcbiAgICAvLyBURU1QT1JBUlkgaGVscGVyIHRvIGRlbW8gbWFwcGluZyB0b29scywgY2xlYXJzIG1hcHBpbmcgZm9yIHRoZSB2aXNpYmxlIChwYWdlZCkgbmFtZXMuXG4gICAgdmFyIHZpc2libGVOYW1lcyA9IHZpZXdNb2RlbC5maWx0ZXJlZE5hbWVzKCkucGFnZWRJdGVtcygpO1xuICAgICQuZWFjaCggdmlzaWJsZU5hbWVzLCBmdW5jdGlvbiAoaSwgbmFtZSkge1xuICAgICAgICBpZiAobmFtZVsnc2VsZWN0ZWRGb3JBY3Rpb24nXSkge1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IFwiZXN0YWJsaXNoZWRcIiBtYXBwaW5nIChhbHJlYWR5IGFwcHJvdmVkKVxuICAgICAgICAgICAgdW5tYXBOYW1lRnJvbVRheG9uKCBuYW1lLCB7UE9TVFBPTkVfVUlfQ0hBTkdFUzogdHJ1ZX0gKTtcbiAgICAgICAgICAgIC8vIGNsZWFyIGFueSBwcm9wb3NlZCBtYXBwaW5nXG4gICAgICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZVsnaWQnXSBdO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgY2xlYXJGYWlsZWROYW1lTGlzdCgpO1xuICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNsZWFyQWxsTWFwcGluZ3MoKSB7XG4gICAgdmFyIGFsbE5hbWVzID0gdmlld01vZGVsLm5hbWVzKCk7XG4gICAgaWYgKGF3YWl0IGFzeW5jQ29uZmlybShcIldBUk5JTkc6IFRoaXMgd2lsbCB1bi1tYXAgYWxsIFwiKyBhbGxOYW1lcy5sZW5ndGggK1wiIG5hbWVzIGluIHRoZSBjdXJyZW50IHN0dWR5ISBBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZG8gdGhpcz9cIikpIHtcbiAgICAgICAgLy8gVEVNUE9SQVJZIGhlbHBlciB0byBkZW1vIG1hcHBpbmcgdG9vbHMsIGNsZWFycyBtYXBwaW5nIGZvciB0aGUgdmlzaWJsZSAocGFnZWQpIG5hbWVzLlxuICAgICAgICAkLmVhY2goIGFsbE5hbWVzLCBmdW5jdGlvbiAoaSwgbmFtZSkge1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IFwiZXN0YWJsaXNoZWRcIiBtYXBwaW5nIChhbHJlYWR5IGFwcHJvdmVkKVxuICAgICAgICAgICAgdW5tYXBOYW1lRnJvbVRheG9uKCBuYW1lLCB7UE9TVFBPTkVfVUlfQ0hBTkdFUzogdHJ1ZX0gKTtcbiAgICAgICAgICAgIC8vIGNsZWFyIGFueSBwcm9wb3NlZCBtYXBwaW5nXG4gICAgICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZVsnaWQnXSBdO1xuICAgICAgICB9KTtcbiAgICAgICAgY2xlYXJGYWlsZWROYW1lTGlzdCgpO1xuICAgICAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICB9XG59XG5cbi8qIEVORCBjb252ZXJ0ICdPVFUnIHRvICduYW1lJyB0aHJvdWdob3V0PyAqL1xuXG5cblxuXG5cblxuXG5cblxuXG4vKiBEZWZpbmUgYSByZWdpc3RyeSBvZiBudWRnZSBtZXRob2RzLCBmb3IgdXNlIGluIEtPIGRhdGEgYmluZGluZ3MuIENhbGxpbmdcbiAqIGEgbnVkZ2UgZnVuY3Rpb24gd2lsbCB1cGRhdGUgb25lIG9yIG1vcmUgb2JzZXJ2YWJsZXMgdG8gdHJpZ2dlciB1cGRhdGVzXG4gKiBpbiB0aGUgY3VyYXRpb24gVUkuIFRoaXMgYXBwcm9hY2ggYWxsb3dzIHVzIHRvIHdvcmsgd2l0aG91dCBvYnNlcnZhYmxlcyxcbiAqIHdoaWNoIGluIHR1cm4gbWVhbnMgd2UgY2FuIGVkaXQgZW5vcm1vdXMgdmlld21vZGVscy5cbiAqL1xudmFyIG51ZGdlID0ge1xuICAgICdNRVRBREFUQSc6IGZ1bmN0aW9uKCBkYXRhLCBldmVudCApIHtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCAnTUVUQURBVEEnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAnVklTSUJMRV9OQU1FX01BUFBJTkdTJzogZnVuY3Rpb24oIGRhdGEsIGV2ZW50ICkge1xuICAgICAgICBudWRnZVRpY2tsZXIoICdWSVNJQkxFX05BTUVfTUFQUElOR1MnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAnTkFNRV9NQVBQSU5HX0hJTlRTJzogZnVuY3Rpb24oIGRhdGEsIGV2ZW50ICkge1xuICAgICAgICBudWRnZVRpY2tsZXIoICdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAnSU5QVVRfRklMRVMnOiBmdW5jdGlvbiggZGF0YSwgZXZlbnQgKSB7XG4gICAgICAgIG51ZGdlVGlja2xlciggJ0lOUFVUX0ZJTEVTJyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyBUT0RPOiBBZGQgbW9yZSBmb3IgYW55IHRpY2tsZXJzIGFkZGVkIGJlbG93XG59XG5mdW5jdGlvbiBudWRnZVRpY2tsZXIoIG5hbWUgKSB7XG4gICAgaWYgKG5hbWUgPT09ICdBTEwnKSB7XG4gICAgICAgIGZvciAodmFyIGFOYW1lIGluIHZpZXdNb2RlbC50aWNrbGVycykge1xuICAgICAgICAgICAgbnVkZ2VUaWNrbGVyKCBhTmFtZSApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgdGlja2xlciA9IHZpZXdNb2RlbC50aWNrbGVyc1sgbmFtZSBdO1xuICAgIGlmICghdGlja2xlcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTm8gc3VjaCB0aWNrbGVyOiAnXCIrIG5hbWUgK1wiJyFcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG9sZFZhbHVlID0gdGlja2xlci5wZWVrKCk7XG4gICAgdGlja2xlciggb2xkVmFsdWUgKyAxICk7XG5cbiAgICAvLyBpZiB0aGlzIHJlZmxlY3RzIGNoYW5nZXMgdG8gdGhlIHN0dWR5LCBudWRnZSB0aGUgbWFpbiAnZGlydHkgZmxhZycgdGlja2xlclxuICAgIGlmIChuYW1lICE9PSAnQ09MTEVDVElPTlNfTElTVCcpIHtcbiAgICAgICAgdmlld01vZGVsLnRpY2tsZXJzLk5BTUVTRVRfSEFTX0NIQU5HRUQoIHZpZXdNb2RlbC50aWNrbGVycy5OQU1FU0VUX0hBU19DSEFOR0VELnBlZWsoKSArIDEgKTtcbiAgICAgICAgY29uc29sZS53YXJuKCdOQU1FU0VUX0hBU19DSEFOR0VEJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG93TmFtZXNldE1ldGFkYXRhKCkge1xuICAgICQoJyNuYW1lc2V0LW1ldGFkYXRhLXByb21wdCcpLmhpZGUoKTtcbiAgICAkKCcjbmFtZXNldC1tZXRhZGF0YS1wYW5lbCcpLnNob3coKTtcbn1cbmZ1bmN0aW9uIGhpZGVOYW1lc2V0TWV0YWRhdGEoKSB7XG4gICAgJCgnI25hbWVzZXQtbWV0YWRhdGEtcGFuZWwnKS5oaWRlKCk7XG4gICAgJCgnI25hbWVzZXQtbWV0YWRhdGEtcHJvbXB0Jykuc2hvdygpO1xufVxuXG5mdW5jdGlvbiBzaG93TWFwcGluZ09wdGlvbnMoKSB7XG4gICAgJCgnI21hcHBpbmctb3B0aW9ucy1wcm9tcHQnKS5oaWRlKCk7XG4gICAgJCgnI21hcHBpbmctb3B0aW9ucy1wYW5lbCcpLnNob3coKTtcbn1cbmZ1bmN0aW9uIGhpZGVNYXBwaW5nT3B0aW9ucygpIHtcbiAgICAkKCcjbWFwcGluZy1vcHRpb25zLXBhbmVsJykuaGlkZSgpO1xuICAgICQoJyNtYXBwaW5nLW9wdGlvbnMtcHJvbXB0Jykuc2hvdygpO1xufVxuXG5mdW5jdGlvbiBkaXNhYmxlU2F2ZUJ1dHRvbigpIHtcbiAgICB2YXIgJGJ0biA9ICQoJyNzYXZlLW5hbWVzZXQtYnV0dG9uJyk7XG4gICAgJGJ0bi5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAkYnRuLnVuYmluZCgnY2xpY2snKS5jbGljayhmdW5jdGlvbihldnQpIHtcbiAgICAgICAgc2hvd0luZm9NZXNzYWdlKCdUaGVyZSBhcmUgbm8gdW5zYXZlZCBjaGFuZ2VzLicpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBlbmFibGVTYXZlQnV0dG9uKCkge1xuICAgIHZhciAkYnRuID0gJCgnI3NhdmUtbmFtZXNldC1idXR0b24nKTtcbiAgICAkYnRuLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICRidG4udW5iaW5kKCdjbGljaycpLmNsaWNrKGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICBpZiAoYnJvd3NlclN1cHBvcnRzRmlsZUFQSSgpKSB7XG4gICAgICAgICAgICBzaG93U2F2ZU5hbWVzZXRQb3B1cCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXN5bmNBbGVydChcIlNvcnJ5LCB0aGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBzYXZpbmcgdG8gYSBsb2NhbCBmaWxlIVwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNob3dMb2FkTGlzdFBvcHVwKCApIHtcbiAgICBzaG93RmlsZXN5c3RlbVBvcHVwKCcjbG9hZC1saXN0LXBvcHVwJyk7XG59XG5mdW5jdGlvbiBzaG93TG9hZE5hbWVzZXRQb3B1cCggKSB7XG4gICAgJCgnI2xvYWQtbmFtZXNldC1wb3B1cCcpLm9mZignaGlkZScpLm9uKCdoaWRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoY29udGV4dCA9PT0gJ1NUVURZX09UVV9NQVBQSU5HJykge1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IHByaW9yIHNlYXJjaCBpbnB1dFxuICAgICAgICAgICAgY2xlYXJOYW1lc2V0VXBsb2FkV2lkZ2V0KCk7XG4gICAgICAgICAgICBjbGVhck5hbWVzZXRQYXN0ZWRUZXh0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBzaG93RmlsZXN5c3RlbVBvcHVwKCcjbG9hZC1uYW1lc2V0LXBvcHVwJyk7XG59XG5mdW5jdGlvbiBzaG93U2F2ZU5hbWVzZXRQb3B1cCggKSB7XG4gICAgc2hvd0ZpbGVzeXN0ZW1Qb3B1cCgnI3NhdmUtbmFtZXNldC1wb3B1cCcpO1xufVxuZnVuY3Rpb24gc2hvd0ZpbGVzeXN0ZW1Qb3B1cCggcG9wdXBTZWxlY3RvciApIHtcbiAgICAvLyBleHBlY3RzIGEgdmFsaWQgalF1ZXJ5IHNlbGVjdG9yIGZvciB0aGUgcG9wdXAgaW4gRE9NXG4gICAgdmFyICRwb3B1cCA9ICQocG9wdXBTZWxlY3Rvcik7XG4gICAgJHBvcHVwLm1vZGFsKCdzaG93Jyk7XG5cbiAgICAvLyAocmUpYmluZCBVSSB3aXRoIEtub2Nrb3V0XG4gICAgdmFyICRib3VuZEVsZW1lbnRzID0gJHBvcHVwLmZpbmQoJy5tb2RhbC1ib2R5Jyk7IC8vIGFkZCBvdGhlciBlbGVtZW50cz9cbiAgICAkLmVhY2goJGJvdW5kRWxlbWVudHMsIGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICAgIGtvLmNsZWFuTm9kZShlbCk7XG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3Moe30sZWwpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRNYXBwZWROYW1lc1RhbGx5KCkge1xuICAgIC8vIHJldHVybiBkaXNwbGF5LXJlYWR5IHRhbGx5IChtYXBwZWQvdG90YWwgcmF0aW8gYW5kIHBlcmNlbnRhZ2UpXG4gICAgdmFyIHRoaW5TcGFjZSA9ICcmIzgyMDE7JztcbiAgICBpZiAoIXZpZXdNb2RlbCB8fCAhdmlld01vZGVsLm5hbWVzIHx8IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gJzxzdHJvbmc+MDwvc3Ryb25nPjxzcGFuPicrIHRoaW5TcGFjZSArJy8nKyB0aGluU3BhY2UgKyAnMCAmbmJzcDs8L3NwYW4+PHNwYW4gc3R5bGU9XCJjb2xvcjogIzk5OTtcIj4oMCUpPC9zcGFuPic7XG4gICAgfVxuICAgIHZhciB0b3RhbE5hbWVDb3VudCA9IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aDtcbiAgICB2YXIgbWFwcGVkTmFtZUNvdW50ID0gJC5ncmVwKHZpZXdNb2RlbC5uYW1lcygpLCBmdW5jdGlvbihuYW1lLCBpKSB7XG4gICAgICAgIHJldHVybiAoIW5hbWUub3R0SWQpID8gZmFsc2U6IHRydWU7XG4gICAgfSkubGVuZ3RoO1xuICAgIHJldHVybiAnPHN0cm9uZz4nKyBtYXBwZWROYW1lQ291bnQgKyc8L3N0cm9uZz48c3Bhbj4nKyB0aGluU3BhY2UgKycvJysgdGhpblNwYWNlICsgdG90YWxOYW1lQ291bnQgKycgJm5ic3A7PC9zcGFuPjxzcGFuIHN0eWxlPVwiY29sb3I6ICM5OTk7XCI+KCcrIGZsb2F0VG9QZXJjZW50KG1hcHBlZE5hbWVDb3VudCAvIHRvdGFsTmFtZUNvdW50KSArJyUpPC9zcGFuPic7XG59XG5mdW5jdGlvbiBtYXBwaW5nUHJvZ3Jlc3NBc1BlcmNlbnQoKSB7XG4gICAgaWYgKCF2aWV3TW9kZWwgfHwgIXZpZXdNb2RlbC5uYW1lcyB8fCB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciB0b3RhbE5hbWVDb3VudCA9IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aDtcbiAgICB2YXIgbWFwcGVkTmFtZUNvdW50ID0gJC5ncmVwKCB2aWV3TW9kZWwubmFtZXMoKSwgZnVuY3Rpb24obmFtZSwgaSkge1xuICAgICAgICByZXR1cm4gKCFuYW1lLm90dElkKSA/IGZhbHNlOiB0cnVlO1xuICAgIH0pLmxlbmd0aDtcbiAgICByZXR1cm4gZmxvYXRUb1BlcmNlbnQobWFwcGVkTmFtZUNvdW50IC8gdG90YWxOYW1lQ291bnQpO1xufVxuZnVuY3Rpb24gZmxvYXRUb1BlcmNlbnQoIGRlYyApIHtcbiAgICAvLyBhc3N1bWVzIGEgZmxvYXQgYmV0d2VlbiAwLjAgYW5kIDEuMFxuICAgIC8vIEVYQU1QTEU6IDAuMjMyID09PiAyMyVcbiAgICByZXR1cm4gTWF0aC5yb3VuZChkZWMgKiAxMDApO1xufVxuXG5mdW5jdGlvbiBicm93c2VyU3VwcG9ydHNGaWxlQVBJKCkge1xuICAgIC8vIENhbiBsb2FkIGFuZCBtYW5pcHVsYXRlIGxvY2FsIGZpbGVzIGluIHRoaXMgYnJvd3Nlcj9cbiAgICByZXR1cm4gKHdpbmRvdy5GaWxlICYmIFxuICAgICAgICAgICAgd2luZG93LkZpbGVSZWFkZXIgJiYgXG4gICAgICAgICAgICB3aW5kb3cuRmlsZUxpc3QgJiYgXG4gICAgICAgICAgICB3aW5kb3cuQmxvYikgPyB0cnVlIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGFkZFN1YnN0aXR1dGlvbiggY2xpY2tlZCApIHtcbiAgICB2YXIgc3Vic3QgPSBrby5tYXBwaW5nLmZyb21KUyh7XG4gICAgICAgICdvbGQnOiBcIlwiLFxuICAgICAgICAnbmV3JzogXCJcIixcbiAgICAgICAgJ2FjdGl2ZSc6IHRydWUsXG4gICAgICAgICd2YWxpZCc6IHRydWVcbiAgICB9KTtcblxuICAgIGlmICgkKGNsaWNrZWQpLmlzKCdzZWxlY3QnKSkge1xuICAgICAgICB2YXIgY2hvc2VuU3ViID0gJChjbGlja2VkKS52YWwoKTtcbiAgICAgICAgaWYgKGNob3NlblN1YiA9PT0gJycpIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmcsIHdlJ3JlIHN0aWxsIGF0IHRoZSBwcm9tcHRcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBhZGQgdGhlIGNob3NlbiBzdWJzaXR1dGlvblxuICAgICAgICB2YXIgcGFydHMgPSBjaG9zZW5TdWIuc3BsaXQoJyA9Oj0gJyk7XG4gICAgICAgIHN1YnN0Lm9sZCggcGFydHNbMF0gfHwgJycgKTtcbiAgICAgICAgc3Vic3QubmV3KCBwYXJ0c1sxXSB8fCAnJyApO1xuICAgICAgICBzdWJzdC52YWxpZCh0cnVlKTtcbiAgICAgICAgc3Vic3QuYWN0aXZlKHRydWUpO1xuICAgICAgICAvLyByZXNldCB0aGUgU0VMRUNUIHdpZGdldCB0byBpdHMgcHJvbXB0XG4gICAgICAgICQoY2xpY2tlZCkudmFsKCcnKTtcbiAgICB9XG4gICAgdmlld01vZGVsLm1hcHBpbmdIaW50cy5zdWJzdGl0dXRpb25zLnB1c2goc3Vic3QpO1xuICAgIGNsZWFyRmFpbGVkTmFtZUxpc3QoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xufVxuZnVuY3Rpb24gcmVtb3ZlU3Vic3RpdHV0aW9uKCBkYXRhICkge1xuICAgIHZhciBzdWJMaXN0ID0gdmlld01vZGVsLm1hcHBpbmdIaW50cy5zdWJzdGl0dXRpb25zKCk7XG4gICAgcmVtb3ZlRnJvbUFycmF5KCBkYXRhLCBzdWJMaXN0ICk7XG4gICAgaWYgKHN1Ykxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIGFkZCBhbiBpbmFjdGl2ZSBzdWJzdGl0dXRpb24gd2l0aCBwcm9tcHRzXG4gICAgICAgIGFkZFN1YnN0aXR1dGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNsZWFyRmFpbGVkTmFtZUxpc3QoKTtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVNYXBwaW5nSGludHMoIGRhdGEgKSB7XG4gICAgLy8gYWZ0ZXItZWZmZWN0cyBvZiBjaGFuZ2VzIHRvIHNlYXJjaCBjb250ZXh0IG9yIGFueSBzdWJzdGl0dXRpb25cbiAgICBjbGVhckZhaWxlZE5hbWVMaXN0KCk7XG4gICAgYWRqdXN0ZWRMYWJlbChcIlRFU1RcIik7ICAgLy8gdmFsaWRhdGUgYWxsIHN1YnN0aXR1dGlvbnNcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBnZXRBdHRyc0Zvck1hcHBpbmdPcHRpb24oIG9wdGlvbkRhdGEsIG51bU9wdGlvbnMgKSB7XG4gICAgdmFyIGF0dHJzID0ge1xuICAgICAgICAndGl0bGUnOiBwYXJzZUludChvcHRpb25EYXRhLm9yaWdpbmFsTWF0Y2guc2NvcmUgKiAxMDApICtcIiUgbWF0Y2ggb2Ygb3JpZ2luYWwgbGFiZWxcIixcbiAgICAgICAgJ2NsYXNzJzogXCJiYWRnZSBcIixcbiAgICAgICAgJ3N0eWxlJzogKFwib3BhY2l0eTogXCIrIG1hdGNoU2NvcmVUb09wYWNpdHkob3B0aW9uRGF0YS5vcmlnaW5hbE1hdGNoLnNjb3JlKSArXCI7XCIpXG4gICAgfVxuICAgIC8vIGZvciBub3csIHVzZSBzdGFuZGFyZCBjb2xvcnMgdGhhdCB3aWxsIHN0aWxsIHBvcCBmb3IgY29sb3ItYmxpbmQgdXNlcnNcbiAgICBpZiAob3B0aW9uRGF0YS5vcmlnaW5hbE1hdGNoLmlzX3N5bm9ueW0pIHtcbiAgICAgICAgYXR0cnMudGl0bGUgPSAoJ01hdGNoZWQgb24gc3lub255bSAnKyBvcHRpb25EYXRhLm9yaWdpbmFsTWF0Y2gubWF0Y2hlZF9uYW1lKTtcbiAgICAgICAgYXR0cnMuY2xhc3MgKz0gJyBiYWRnZS1pbmZvJztcbiAgICB9IGVsc2UgaWYgKChudW1PcHRpb25zID4gMSkgJiYgKG9wdGlvbkRhdGEub3JpZ2luYWxNYXRjaC5tYXRjaGVkX25hbWUgIT09IG9wdGlvbkRhdGEub3JpZ2luYWxNYXRjaC50YXhvbi51bmlxdWVfbmFtZSkpIHtcbiAgICAgICAgLy8gTGV0J3MgYXNzdW1lIGEgc2luZ2xlIHJlc3VsdCBpcyB0aGUgcmlnaHQgYW5zd2VyXG4gICAgICAgIGF0dHJzLnRpdGxlID0gKCdUYXhvbi1uYW1lIGhvbW9ueW0nKTtcbiAgICAgICAgYXR0cnMuY2xhc3MgKz0gJyBiYWRnZS13YXJuaW5nJztcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBrZWVwIGRlZmF1bHQgbGFiZWwgd2l0aCBtYXRjaGluZyBzY29yZVxuICAgICAgICBhdHRycy5jbGFzcyArPSAnIGJhZGdlLXN1Y2Nlc3MnO1xuICAgIH1cbiAgICAvLyBlYWNoIHNob3VsZCBhbHNvIGxpbmsgdG8gdGhlIHRheG9ub215IGJyb3dzZXJcbiAgICBhdHRycy5ocmVmID0gZ2V0VGF4b2Jyb3dzZXJVUkwob3B0aW9uRGF0YVsnb3R0SWQnXSk7XG4gICAgYXR0cnMudGFyZ2V0ID0gJ19ibGFuayc7XG4gICAgYXR0cnMudGl0bGUgKz0gJyAoY2xpY2sgZm9yIG1vcmUgaW5mb3JtYXRpb24pJ1xuICAgIHJldHVybiBhdHRycztcbn1cbmZ1bmN0aW9uIG1hdGNoU2NvcmVUb09wYWNpdHkoc2NvcmUpIHtcbiAgICAvKiBSZW1hcCBzY29yZXMgKGdlbmVyYWxseSBmcm9tIDAuNzUgdG8gMS4wLCBidXQgMC4xIGlzIHBvc3NpYmxlISkgdG8gYmUgbW9yZSB2aXNpYmxlXG4gICAgICogVGhpcyBpcyBiZXN0IGFjY29tcGxpc2hlZCBieSByZW1hcHBpbmcgdG8gYSBjdXJ2ZSwgZS5nLlxuICAgICAqICAgT1BBQ0lUWSA9IFNDT1JFXjIgKyAwLjE1XG4gICAgICogICBPUEFDSVRZID0gMC44ICogU0NPUkVeMiArIDAuMlxuICAgICAqICAgT1BBQ0lUWSA9IDAuOCAqIFNDT1JFICsgMC4yXG4gICAgICogVGhlIGVmZmVjdCB3ZSB3YW50IGlzIGZ1bGwgb3BhY2l0eSAoMS4wKSBmb3IgYSAxLjAgc2NvcmUsIGZhZGluZyByYXBpZGx5XG4gICAgICogZm9yIHRoZSBjb21tb24gKGhpZ2hlcikgc2NvcmVzLCB3aXRoIGEgZmxvb3Igb2YgfjAuMiBvcGFjaXR5IChlbm91Z2ggdG9cbiAgICAgKiBzaG93IGNvbG9yIGFuZCBtYWludGFpbiBsZWdpYmlsaXR5KS5cbiAgICAgKi9cbiAgICByZXR1cm4gKDAuOCAqIHNjb3JlKSArIDAuMjtcbn1cblxuLy8gc3VwcG9ydCBmb3IgYSBjb2xvci1jb2RlZCBcInNwZWVkb21ldGVyXCIgZm9yIHNlcnZlci1zaWRlIG1hcHBpbmcgKHNvbWUgYXMgSlMgZ2xvYmFscylcbnZhciByZWNlbnRNYXBwaW5nVGltZXMgPSBbIF07XG5yZWNlbnRNYXBwaW5nU3BlZWRMYWJlbCA9IGtvLm9ic2VydmFibGUoXCJcIik7IC8vIHNlY29uZHMgcGVyIG5hbWUsIGJhc2VkIG9uIHJvbGxpbmcgYXZlcmFnZVxucmVjZW50TWFwcGluZ1NwZWVkUGVyY2VudCA9IGtvLm9ic2VydmFibGUoMCk7IC8vIGFmZmVjdHMgY29sb3Igb2YgYmFyLCBldGNcbnJlY2VudE1hcHBpbmdTcGVlZEJhckNsYXNzID0ga28ub2JzZXJ2YWJsZSgncHJvZ3Jlc3MgcHJvZ3Jlc3MtaW5mbycpO1xuXG4vLyB0aGlzIHNob3VsZCBiZSBjbGVhcmVkIHdoZW5ldmVyIHNvbWV0aGluZyBjaGFuZ2VzIGluIG1hcHBpbmcgaGludHNcbmZ1bmN0aW9uIGNsZWFyRmFpbGVkTmFtZUxpc3QoKSB7XG4gICAgZmFpbGVkTWFwcGluZ05hbWVzLnJlbW92ZUFsbCgpO1xuICAgIC8vIG51ZGdlIHRvIHVwZGF0ZSBuYW1lIGxpc3QgaW1tZWRpYXRlbHlcbiAgICBib2d1c0VkaXRlZExhYmVsQ291bnRlciggYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoKSArIDEpO1xuICAgIG51ZGdlQXV0b01hcHBpbmcoKTtcbn1cbmZ1bmN0aW9uIG51ZGdlQXV0b01hcHBpbmcoKSB7XG4gICAgLy8gcmVzdGFydCBhdXRvLW1hcHBpbmcsIGlmIGVuYWJsZWRcbiAgICBpZiAoYXV0b01hcHBpbmdJblByb2dyZXNzKCkpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRseU1hcHBpbmdOYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIC8vIGxvb2tzIGxpa2Ugd2UgcmFuIG91dCBvZiBzdGVhbS4uIHRyeSBhZ2FpbiFcbiAgICAgICAgICAgIHJlcXVlc3RUYXhvbk1hcHBpbmcoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG5cblxuZnVuY3Rpb24gaW5mZXJTZWFyY2hDb250ZXh0RnJvbUF2YWlsYWJsZU5hbWVzKCkge1xuICAgIC8vIEZldGNoIHRoZSBsZWFzdCBpbmNsdXNpdmUgY29udGV4dCB2aWEgQUpBWCwgYW5kIHVwZGF0ZSB0aGUgZHJvcC1kb3duIG1lbnVcbiAgICB2YXIgbmFtZXNUb1N1Ym1pdCA9IFsgXTtcbiAgICB2YXIgbWF4TmFtZXNUb1N1Ym1pdCA9IDUwMDA7ICAvLyBpZiBtb3JlIHRoYW4gdGhpcywgZHJvcCBleHRyYSBuYW1lcyBldmVubHlcbiAgICBjb25zb2xlLmxvZyhcIj4+IGZvdW5kIFwiKyB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGggK1wiIG5hbWVzIGluIHRoZSBuYW1lc2V0XCIpO1xuICAgIHZhciBuYW1lc1RvU3VibWl0ID0gJC5tYXAodmlld01vZGVsLm5hbWVzKCksIGZ1bmN0aW9uKG5hbWUsIGluZGV4KSB7XG4gICAgICAgIHJldHVybiAoJ290dFRheG9uTmFtZScgaW4gbmFtZSkgPyBuYW1lWydvdHRUYXhvbk5hbWUnXSA6IG5hbWVbJ29yaWdpbmFsTGFiZWwnXTtcbiAgICB9KTtcbiAgICBpZiAobmFtZXNUb1N1Ym1pdC5sZW5ndGggPiBtYXhOYW1lc1RvU3VibWl0KSB7XG4gICAgICAgIC8vIHJlZHVjZSB0aGUgbGlzdCBpbiBhIGRpc3RyaWJ1dGVkIGZhc2hpb24gKGVnLCBldmVyeSBmb3VydGggaXRlbSlcbiAgICAgICAgdmFyIHN0ZXBTaXplID0gbWF4TmFtZXNUb1N1Ym1pdCAvIG5hbWVzVG9TdWJtaXQubGVuZ3RoO1xuICAgICAgICAvLy9jb25zb2xlLmxvZyhcIlRPTyBNQU5ZIE5BTUVTLCByZWR1Y2luZyB3aXRoIHN0ZXAtc2l6ZSBcIisgc3RlcFNpemUpO1xuICAgICAgICAvLyBjcmVlcCB0byB3aG9sZSBudW1iZXJzLCBrZWVwaW5nIGFuIGl0ZW0gZXZlcnkgdGltZSB3ZSBpbmNyZW1lbnQgYnkgb25lXG4gICAgICAgIHZhciBjdXJyZW50U3RlcFRvdGFsID0gMC4wO1xuICAgICAgICB2YXIgbmV4dFdob2xlTnVtYmVyID0gMTtcbiAgICAgICAgbmFtZXNUb1N1Ym1pdCA9IG5hbWVzVG9TdWJtaXQuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoKGN1cnJlbnRTdGVwVG90YWwgKz0gc3RlcFNpemUpID49IG5leHRXaG9sZU51bWJlcikge1xuICAgICAgICAgICAgICAgIG5leHRXaG9sZU51bWJlciArPSAxOyAvLyBidW1wIHRvIG5leHQgbnVtYmVyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhcIj4+IHN1Ym1pdHRpbmcgXCIrIG5hbWVzVG9TdWJtaXQubGVuZ3RoICtcIiBuYW1lcyBpbiB0aGUgbmFtZXNldFwiKTtcbiAgICBpZiAobmFtZXNUb1N1Ym1pdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuOyAvLyB0aGlzIGlzIGEgbm8tb3BcbiAgICB9XG5cbiAgICAvLy9zaG93TW9kYWxTY3JlZW4oXCJJbmZlcnJpbmcgc2VhcmNoIGNvbnRleHQuLi5cIiwge1NIT1dfQlVTWV9CQVI6dHJ1ZX0pO1xuXG4gICAgJC5hamF4KHtcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAvLyBjcm9zc2RvbWFpbjogdHJ1ZSxcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICAgICAgICB1cmw6IGdldENvbnRleHRGb3JOYW1lc191cmwsXG4gICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgZGF0YTogKCd7XCJuYW1lc1wiOiAnKyBKU09OLnN0cmluZ2lmeShuYW1lc1RvU3VibWl0KSArJ30nKSxcbiAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcbiAgICAgICAgICAgIC8vIHJlcG9ydCBlcnJvcnMgb3IgbWFsZm9ybWVkIGRhdGEsIGlmIGFueVxuICAgICAgICAgICAgaWYgKHRleHRTdGF0dXMgIT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UoJ1NvcnJ5LCB0aGVyZSB3YXMgYW4gZXJyb3IgaW5mZXJyaW5nIHRoZSBzZWFyY2ggY29udGV4dC4nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVSUk9SOiB0ZXh0U3RhdHVzICE9PSAnc3VjY2VzcycsIGJ1dCBcIisgdGV4dFN0YXR1cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IEpTT04ucGFyc2UoIGpxWEhSLnJlc3BvbnNlVGV4dCApO1xuICAgICAgICAgICAgdmFyIGluZmVycmVkQ29udGV4dCA9IG51bGw7XG4gICAgICAgICAgICBpZiAocmVzdWx0ICYmICdjb250ZXh0X25hbWUnIGluIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGluZmVycmVkQ29udGV4dCA9IHJlc3VsdFsnY29udGV4dF9uYW1lJ107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLy9jb25zb2xlLmxvZyhcIj4+IGluZmVycmVkQ29udGV4dDogXCIrIGluZmVycmVkQ29udGV4dCk7XG4gICAgICAgICAgICBpZiAoaW5mZXJyZWRDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIEJPVEggc2VhcmNoLWNvbnRleHQgZHJvcC1kb3duIG1lbnVzIHRvIHNob3cgdGhpcyByZXN1bHRcbiAgICAgICAgICAgICAgICAkKCdzZWxlY3RbbmFtZT10YXhvbi1zZWFyY2gtY29udGV4dF0nKS52YWwoaW5mZXJyZWRDb250ZXh0KTtcbiAgICAgICAgICAgICAgICAvLyBUd2VhayB0aGUgbW9kZWwncyBuYW1lIG1hcHBpbmcsIHRoZW4gcmVmcmVzaCB0aGUgVUlcbiAgICAgICAgICAgICAgICAvLyBOLkIuIFdlIGNoZWNrIGZpcnN0IHRvIGF2b2lkIGFkZGluZyBhbiB1bm5lY2Vzc2FyeSB1bnNhdmVkLWRhdGEgd2FybmluZyFcbiAgICAgICAgICAgICAgICBpZiAodmlld01vZGVsLm1hcHBpbmdIaW50cy5zZWFyY2hDb250ZXh0KCkgIT09IGluZmVycmVkQ29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZWwubWFwcGluZ0hpbnRzLnNlYXJjaENvbnRleHQoaW5mZXJyZWRDb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlTWFwcGluZ0hpbnRzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzaG93RXJyb3JNZXNzYWdlKCdTb3JyeSwgbm8gc2VhcmNoIGNvbnRleHQgd2FzIGluZmVycmVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8vIEtlZXAgYSBzYWZlIGNvcHkgb2Ygb3VyIFVJIG1hcmt1cCwgZm9yIHJlLXVzZSBhcyBhIEtub2Nrb3V0IHRlbXBsYXRlIChzZWUgYmVsb3cpXG52YXIgJHN0YXNoZWRFZGl0QXJlYSA9IG51bGw7XG5cbi8vIExvYWQgYSBuYW1lc2V0IGZyb20gSlMvSlNPTiBkYXRhICh1c3UuIGNhbGxlZCBieSBjb252ZW5pZW5jZSBmdW5jdGlvbnMgYmVsb3cpXG5mdW5jdGlvbiBsb2FkTmFtZXNldERhdGEoIGRhdGEsIGxvYWRlZEZpbGVOYW1lLCBsYXN0TW9kaWZpZWREYXRlICkge1xuICAgIC8qIFBhcnNlIHRoaXMgZGF0YSBhcyBgbmFtZXNldGAgKGEgc2ltcGxlIEpTIG9iamVjdCksIHRoZW4gY29udmVydCB0aGlzXG4gICAgICogaW50byBvdXIgcHJpbWFyeSB2aWV3IG1vZGVsIGZvciBLbm9ja291dEpTICAoYnkgY29udmVudGlvbiwgaXQncyB1c3VhbGx5XG4gICAgICogbmFtZWQgJ3ZpZXdNb2RlbCcpLlxuICAgICAqL1xuICAgIHZhciBuYW1lc2V0O1xuICAgIHN3aXRjaCh0eXBlb2YgZGF0YSkgeyBcbiAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIGl0J3MgbnVsbCwgb3IgdW5kZWZpbmVkPyBvciBzb21ldGhpbmcgZHVtYlxuICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBnZXROZXdOYW1lc2V0TW9kZWwoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmFtZXNldCA9IGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgICAgICAgIG5hbWVzZXQgPSBnZXROZXdOYW1lc2V0TW9kZWwoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBuYW1lc2V0ID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgIC8vIElGIHRoaXMgZmFpbHMsIHRyeSB0byBpbXBvcnQgVFNWL0NTViwgbGluZS1ieS1saW5lIHRleHRcbiAgICAgICAgICAgICAgICBuYW1lc2V0ID0gY29udmVydFRvTmFtZXNldE1vZGVsKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6IFxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuZXhwZWN0ZWQgdHlwZSBmb3IgbmFtZXNldCBkYXRhOiBcIisgKHR5cGVvZiBkYXRhKSk7XG4gICAgICAgICAgICBuYW1lc2V0ID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKiBcIk5vcm1hbGl6ZVwiIHRoZSBuYW1lc2V0IGJ5IGFkZGluZyBhbnkgbWlzc2luZyBwcm9wZXJ0aWVzIGFuZCBtZXRhZGF0YS5cbiAgICAgKiAoVGhpcyBpcyBtYWlubHkgdXNlZnVsIHdoZW4gbG9hZGluZyBhbiBvbGRlciBhcmNoaXZlZCBuYW1lc2V0LCB0b1xuICAgICAqIGNhdGNoIHVwIHdpdGggYW55IGNoYW5nZXMgdG8gdGhlIGV4cGVjdGVkIGRhdGEgbW9kZWwuKVxuICAgICAqL1xuICAgIGlmIChuYW1lc2V0Lm1ldGFkYXRhWydkYXRlX2NyZWF0ZWQnXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNyZWF0aW9uIGRhdGUgaXMgbm90IGtub3dhYmxlOyBtYXRjaCBsYXN0LXNhdmVkIGRhdGUgZnJvbSBmaWxlXG4gICAgICAgIG5hbWVzZXQubWV0YWRhdGEuZGF0ZV9jcmVhdGVkID0gbGFzdE1vZGlmaWVkRGF0ZS50b0lTT1N0cmluZygpO1xuICAgIH1cbiAgICBpZiAobmFtZXNldC5tZXRhZGF0YVsnbGFzdF9zYXZlZCddID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gYXNzdW1lIGxhc3Qtc2F2ZWQgZGF0ZSBmcm9tIGZpbGUgaXMgY29ycmVjdFxuICAgICAgICBuYW1lc2V0Lm1ldGFkYXRhLmxhc3Rfc2F2ZWQgPSBsYXN0TW9kaWZpZWREYXRlLnRvSVNPU3RyaW5nKCk7XG4gICAgfVxuICAgIGlmIChuYW1lc2V0Lm1ldGFkYXRhWydzYXZlX2NvdW50J10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyB0cnVlIG51bWJlciBvZiBzYXZlcyBpcyBub3Qga25vd2FibGUsIGJ1dCB0aGVyZSdzIGJlZW4gYXQgbGVhc3Qgb25lIVxuICAgICAgICBuYW1lc2V0Lm1ldGFkYXRhLnNhdmVfY291bnQgPSAxO1xuICAgIH1cbiAgICBpZiAobmFtZXNldC5tZXRhZGF0YVsnbGF0ZXN0X290dF92ZXJzaW9uJ10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBuYW1lc2V0Lm1ldGFkYXRhLmxhdGVzdF9vdHRfdmVyc2lvbiA9IG51bGw7XG4gICAgfVxuICAgIGlmIChsb2FkZWRGaWxlTmFtZSkge1xuICAgICAgICAvLyBXZSBqdXN0IGxvYWRlZCBhbiBhcmNoaXZlIGZpbGUhIFN0b3JlIGl0cyBsYXRlc3QgZmlsZW5hbWUuXG4gICAgICAgIG5hbWVzZXQubWV0YWRhdGEucHJldmlvdXNfZmlsZW5hbWUgPSBsb2FkZWRGaWxlTmFtZTtcbiAgICB9XG4gICAgaWYgKG5hbWVzZXQubWFwcGluZ0hpbnRzWydhdXRvQWNjZXB0RXhhY3RNYXRjaGVzJ10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBuYW1lc2V0Lm1hcHBpbmdIaW50c1snYXV0b0FjY2VwdEV4YWN0TWF0Y2hlcyddID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyogTmFtZSBhbmQgZXhwb3J0IHRoZSBuZXcgdmlld21vZGVsLiBOT1RFIHRoYXQgd2UgZG9uJ3QgY3JlYXRlIG9ic2VydmFibGVzXG4gICAgICogZm9yIG5hbWVzIGFuZCB0aGVpciBtYW55IHByb3BlcnRpZXMhIFRoaXMgc2hvdWxkIGhlbHAga2VlcCB0aGluZ3Mgc25hcHB5XG4gICAgICogd2hlbiB3b3JpaW5nIHdpdGggdmVyeSBsYXJnZSBsaXN0cy5cbiAgICAgKi9cbiAgICB2YXIga25vY2tvdXRNYXBwaW5nT3B0aW9ucyA9IHtcbiAgICAgICAgJ2NvcHknOiBbXCJuYW1lc1wiXSAgLy8gd2UnbGwgbWFrZSB0aGUgJ25hbWVzJyBhcnJheSBvYnNlcnZhYmxlIGJlbG93XG4gICAgfTtcblxuICAgIGV4cG9ydHMudmlld01vZGVsID0gdmlld01vZGVsID0ga28ubWFwcGluZy5mcm9tSlMobmFtZXNldCwga25vY2tvdXRNYXBwaW5nT3B0aW9ucyk7XG4gICAgdmlld01vZGVsLm5hbWVzID0ga28ub2JzZXJ2YWJsZUFycmF5KHZpZXdNb2RlbC5uYW1lcyk7XG5cbiAgICAvLyBjbGVhbnVwIG9mIGluY29taW5nIGRhdGFcbiAgICByZW1vdmVEdXBsaWNhdGVOYW1lcyh2aWV3TW9kZWwpO1xuXG4gICAgLy8gdGFrZSBpbml0aWFsIHN0YWIgYXQgc2V0dGluZyBzZWFyY2ggY29udGV4dCBmb3IgVE5SUz9cbiAgICBpbmZlclNlYXJjaENvbnRleHRGcm9tQXZhaWxhYmxlTmFtZXMoKTtcblxuICAgIC8qIFxuICAgICAqIEFkZCBvYnNlcnZhYmxlIHByb3BlcnRpZXMgdG8gdGhlIG1vZGVsIHRvIHN1cHBvcnQgdGhlIFVJLiBcbiAgICAgKi9cblxuICAgIC8vIHByZXR0aWVyIGRpc3BsYXkgZGF0ZXNcbiAgICB2aWV3TW9kZWwuZGlzcGxheUNyZWF0aW9uRGF0ZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0ZSA9IHZpZXdNb2RlbC5tZXRhZGF0YS5kYXRlX2NyZWF0ZWQoKTtcbiAgICAgICAgcmV0dXJuIGZvcm1hdElTT0RhdGUoZGF0ZSk7XG4gICAgfSk7XG4gICAgdmlld01vZGVsLmRpc3BsYXlMYXN0U2F2ZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0ZSA9IHZpZXdNb2RlbC5tZXRhZGF0YS5sYXN0X3NhdmVkKCk7XG4gICAgICAgIGlmIChkYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0xhc3Qgc2F2ZWQgJysgZm9ybWF0SVNPRGF0ZShkYXRlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAnVGhpcyBuYW1lc2V0IGhhcyBub3QgYmVlbiBzYXZlZC4nO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmlld01vZGVsLmRpc3BsYXlQcmV2aW91c0ZpbGVuYW1lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBmaWxlTmFtZSA9IHZpZXdNb2RlbC5tZXRhZGF0YS5wcmV2aW91c19maWxlbmFtZSgpO1xuICAgICAgICBpZiAoZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBcIkxvYWRlZCBmcm9tIGZpbGUgPGNvZGU+XCIrIGZpbGVOYW1lICtcIjwvY29kZT4uXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RoaXMgaXMgYSBuZXcgbmFtZXNldCAobm8gcHJldmlvdXMgZmlsZW5hbWUpLic7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEFkZCBhIHNlcmllcyBvZiBvYnNlcnZhYmxlIFwidGlja2xlcnNcIiB0byBzaWduYWwgY2hhbmdlcyBpblxuICAgIC8vIHRoZSBtb2RlbCB3aXRob3V0IG9ic2VydmFibGUgTmV4c29uIHByb3BlcnRpZXMuIEVhY2ggaXMgYW5cbiAgICAvLyBpbnRlZ2VyIHRoYXQgY3JlZXBzIHVwIGJ5IDEgdG8gc2lnbmFsIGEgY2hhbmdlIHNvbWV3aGVyZSBpblxuICAgIC8vIHJlbGF0ZWQgTmV4c29uIGVsZW1lbnRzLlxuICAgIHZpZXdNb2RlbC50aWNrbGVycyA9IHtcbiAgICAgICAgJ01FVEFEQVRBJzoga28ub2JzZXJ2YWJsZSgxKSxcbiAgICAgICAgJ0lOUFVUX0ZJTEVTJzoga28ub2JzZXJ2YWJsZSgxKSxcbiAgICAgICAgJ05BTUVfTUFQUElOR19ISU5UUyc6IGtvLm9ic2VydmFibGUoMSksXG4gICAgICAgICdWSVNJQkxFX05BTUVfTUFQUElOR1MnOiBrby5vYnNlcnZhYmxlKDEpLFxuICAgICAgICAvLyBUT0RPOiBhZGQgbW9yZSBhcyBuZWVkZWQuLi5cbiAgICAgICAgJ05BTUVTRVRfSEFTX0NIQU5HRUQnOiBrby5vYnNlcnZhYmxlKDEpXG4gICAgfVxuXG4gICAgLy8gc3VwcG9ydCBmYXN0IGxvb2t1cCBvZiBlbGVtZW50cyBieSBJRCwgZm9yIGxhcmdlc3QgdHJlZXNcbiAgICB2aWV3TW9kZWwuZmFzdExvb2t1cHMgPSB7XG4gICAgICAgICdOQU1FU19CWV9JRCc6IG51bGxcbiAgICB9O1xuXG4gICAgLy8gZW5hYmxlIHNvcnRpbmcgYW5kIGZpbHRlcmluZyBsaXN0cyBpbiB0aGUgZWRpdG9yXG4gICAgdmFyIGxpc3RGaWx0ZXJEZWZhdWx0cyA9IHtcbiAgICAgICAgLy8gdHJhY2sgdGhlc2UgZGVmYXVsdHMgc28gd2UgY2FuIHJlc2V0IHRoZW0gaW4gaGlzdG9yeVxuICAgICAgICAnTkFNRVMnOiB7XG4gICAgICAgICAgICAvLyBUT0RPOiBhZGQgJ3BhZ2VzaXplJz9cbiAgICAgICAgICAgICdtYXRjaCc6IFwiXCIsXG4gICAgICAgICAgICAnb3JkZXInOiBcIlVubWFwcGVkIG5hbWVzIGZpcnN0XCJcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmlld01vZGVsLmZpbHRlckRlbGF5ID0gMjUwOyAvLyBtcyB0byB3YWl0IGZvciBjaGFuZ2VzIGJlZm9yZSB1cGRhdGluZyBmaWx0ZXJcbiAgICB2aWV3TW9kZWwubGlzdEZpbHRlcnMgPSB7XG4gICAgICAgIC8vIFVJIHdpZGdldHMgYm91bmQgdG8gdGhlc2UgdmFyaWFibGVzIHdpbGwgdHJpZ2dlciB0aGVcbiAgICAgICAgLy8gY29tcHV0ZWQgZGlzcGxheSBsaXN0cyBiZWxvdy4uXG4gICAgICAgICdOQU1FUyc6IHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFkZCAncGFnZXNpemUnP1xuICAgICAgICAgICAgJ21hdGNoJzoga28ub2JzZXJ2YWJsZSggbGlzdEZpbHRlckRlZmF1bHRzLk5BTUVTLm1hdGNoICksXG4gICAgICAgICAgICAnb3JkZXInOiBrby5vYnNlcnZhYmxlKCBsaXN0RmlsdGVyRGVmYXVsdHMuTkFNRVMub3JkZXIgKVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBhbnkgY2hhbmdlIHRvIHRoZXNlIGxpc3QgZmlsdGVycyBzaG91bGQgcmVzZXQgcGFnaW5hdGlvbiBmb3IgdGhlIGN1cnJlbnQgZGlzcGxheSBsaXN0XG4gICAgLy8gTkIgdGhpcyBpcyBhIHN0cmVhbWxpbmVkIHZlcnNpb24gb2YgdGhlIG1vcmUgZ2VuZXJhbCBmaXggaW4gc3R1ZHktZWRpdG9yLmpzIVxuICAgICQuZWFjaCh2aWV3TW9kZWwubGlzdEZpbHRlcnMuTkFNRVMsIGZ1bmN0aW9uKGZpbHRlck5hbWUsIGZpbHRlck9ic2VydmFibGUpIHtcbiAgICAgICAgZmlsdGVyT2JzZXJ2YWJsZS5zdWJzY3JpYmUoZnVuY3Rpb24obmV3VmFsdWUpIHtcbiAgICAgICAgICAgIC8vIGlnbm9yZSB2YWx1ZSwganVzdCByZXNldCBwYWdpbmF0aW9uIChiYWNrIHRvIHBhZ2UgMSlcbiAgICAgICAgICAgIHZpZXdNb2RlbC5fZmlsdGVyZWRPVFVzLmdvVG9QYWdlKDEpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiBcbiAgICAvLyBtYWludGFpbiBhIHBlcnNpc3RlbnQgYXJyYXkgdG8gcHJlc2VydmUgcGFnaW5hdGlvbiAocmVzZXQgd2hlbiBjb21wdXRlZClcbiAgICB2aWV3TW9kZWwuX2ZpbHRlcmVkTmFtZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoICkuYXNQYWdlZCg1MDApO1xuICAgIHZpZXdNb2RlbC5maWx0ZXJlZE5hbWVzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGZpbHRlciByYXcgbmFtZSBsaXN0LCB0aGVuIHNvcnQsIHJldHVybmluZyBhXG4gICAgICAgIC8vIG5ldyAoT1IgTU9ESUZJRUQ/PykgcGFnZWQgb2JzZXJ2YWJsZUFycmF5XG4gICAgICAgIC8vL3ZhciB0aWNrbGVycyA9IFsgdmlld01vZGVsLnRpY2tsZXJzLk5BTUVfTUFQUElOR19ISU5UUygpIF07XG5cbiAgICAgICAgdXBkYXRlQ2xlYXJTZWFyY2hXaWRnZXQoICcjbmFtZS1saXN0LWZpbHRlcicgKTtcbiAgICAgICAgLy91cGRhdGVMaXN0RmlsdGVyc1dpdGhIaXN0b3J5KCk7XG5cbiAgICAgICAgdmFyIG1hdGNoID0gdmlld01vZGVsLmxpc3RGaWx0ZXJzLk5BTUVTLm1hdGNoKCksXG4gICAgICAgICAgICBtYXRjaFdpdGhEaWFjcml0aWNhbHMgPSBhZGREaWFjcml0aWNhbFZhcmlhbnRzKG1hdGNoKSxcbiAgICAgICAgICAgIG1hdGNoUGF0dGVybiA9IG5ldyBSZWdFeHAoICQudHJpbShtYXRjaFdpdGhEaWFjcml0aWNhbHMpLCAnaScgKTtcbiAgICAgICAgdmFyIG9yZGVyID0gdmlld01vZGVsLmxpc3RGaWx0ZXJzLk5BTUVTLm9yZGVyKCk7XG5cbiAgICAgICAgLy8gY2FwdHVyZSBjdXJyZW50IHBvc2l0aW9ucywgdG8gYXZvaWQgdW5uZWNlc3NhcnkgXCJqdW1waW5nXCIgaW4gdGhlIGxpc3RcbiAgICAgICAgY2FwdHVyZURlZmF1bHRTb3J0T3JkZXIodmlld01vZGVsLm5hbWVzKCkpO1xuXG4gICAgICAgIC8qIFRPRE86IHBvb2wgYWxsIG5hbWUgSURzIGludG8gYSBjb21tb24gb2JqZWN0P1xuICAgICAgICB2YXIgY2hvc2VuTmFtZUlEcyA9IHt9O1xuICAgICAgICBjb25zb2xlLndhcm4oY2hvc2VuTmFtZUlEcyk7XG4gICAgICAgIGlmIChjaG9zZW5OYW1lSURzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkhlcmUncyB0aGUgZmlyc3Qgb2YgY2hvc2VuTmFtZUlEczpcIik7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oY2hvc2VuTmFtZUlEc1swXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJjaG9zZW5OYW1lSURzIGlzIGFuIGVtcHR5IGxpc3QhXCIpO1xuICAgICAgICB9XG4gICAgICAgICovXG5cbiAgICAgICAgLy8gbWFwIG9sZCBhcnJheSB0byBuZXcgYW5kIHJldHVybiBpdFxuICAgICAgICB2YXIgZmlsdGVyZWRMaXN0ID0ga28udXRpbHMuYXJyYXlGaWx0ZXIoXG4gICAgICAgICAgICB2aWV3TW9kZWwubmFtZXMoKSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAvLyBtYXRjaCBlbnRlcmVkIHRleHQgYWdhaW5zdCBvbGQgb3IgbmV3IGxhYmVsXG4gICAgICAgICAgICAgICAgdmFyIG9yaWdpbmFsTGFiZWwgPSBuYW1lWydvcmlnaW5hbExhYmVsJ107XG4gICAgICAgICAgICAgICAgdmFyIG1vZGlmaWVkTGFiZWwgPSBuYW1lWydhZGp1c3RlZExhYmVsJ10gfHwgYWRqdXN0ZWRMYWJlbChvcmlnaW5hbExhYmVsKTtcbiAgICAgICAgICAgICAgICB2YXIgbWFwcGVkTGFiZWwgPSBuYW1lWydvdHRUYXhvbk5hbWUnXTtcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoUGF0dGVybi50ZXN0KG9yaWdpbmFsTGFiZWwpICYmXG4gICAgICAgICAgICAgICAgICAgICFtYXRjaFBhdHRlcm4udGVzdChtb2RpZmllZExhYmVsKSAmJlxuICAgICAgICAgICAgICAgICAgICAhbWF0Y2hQYXR0ZXJuLnRlc3QobWFwcGVkTGFiZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7ICAvLyBFTkQgb2YgbGlzdCBmaWx0ZXJpbmdcblxuICAgICAgICAvLyBhcHBseSBzZWxlY3RlZCBzb3J0IG9yZGVyXG4gICAgICAgIHN3aXRjaChvcmRlcikge1xuICAgICAgICAgICAgLyogUkVNSU5ERVI6IGluIHNvcnQgZnVuY3Rpb25zLCByZXN1bHRzIGFyZSBhcyBmb2xsb3dzOlxuICAgICAgICAgICAgICogIC0xID0gYSBjb21lcyBiZWZvcmUgYlxuICAgICAgICAgICAgICogICAwID0gbm8gY2hhbmdlXG4gICAgICAgICAgICAgKiAgIDEgPSBiIGNvbWVzIGJlZm9yZSBhXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNhc2UgJ1VubWFwcGVkIG5hbWVzIGZpcnN0JzpcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZExpc3Quc29ydChmdW5jdGlvbihhLGIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTi5CLiBUaGlzIHdvcmtzIGV2ZW4gaWYgdGhlcmUncyBubyBzdWNoIHByb3BlcnR5LlxuICAgICAgICAgICAgICAgICAgICAvL2lmIChjaGVja0ZvckludGVyZXN0aW5nU3R1ZGllcyhhLGIpKSB7IGRlYnVnZ2VyOyB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBhTWFwU3RhdHVzID0gJC50cmltKGFbJ290dFRheG9uTmFtZSddKSAhPT0gJyc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiTWFwU3RhdHVzID0gJC50cmltKGJbJ290dFRheG9uTmFtZSddKSAhPT0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhTWFwU3RhdHVzID09PSBiTWFwU3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFNYXBTdGF0dXMpIHsgLy8gYm90aCBuYW1lcyBhcmUgY3VycmVudGx5IHVuLW1hcHBlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvcmNlIGZhaWxlZCBtYXBwaW5ncyB0byB0aGUgYm90dG9tIG9mIHRoZSBsaXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFGYWlsZWRNYXBwaW5nID0gKGZhaWxlZE1hcHBpbmdOYW1lcy5pbmRleE9mKGFbJ2lkJ10pICE9PSAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJGYWlsZWRNYXBwaW5nID0gKGZhaWxlZE1hcHBpbmdOYW1lcy5pbmRleE9mKGJbJ2lkJ10pICE9PSAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFGYWlsZWRNYXBwaW5nID09PSBiRmFpbGVkTWFwcGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUcnkgdG8gcmV0YWluIHRoZWlyIHByaW9yIHByZWNlZGVuY2UgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGxpc3QgKGF2b2lkIGl0ZW1zIGp1bXBpbmcgYXJvdW5kKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKnJldHVybiAoYS5wcmlvclBvc2l0aW9uIDwgYi5wcmlvclBvc2l0aW9uKSA/IC0xOjE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFNob3VsZCB0aGlzIHN1cGVyY2VkZSBvdXIgdHlwaWNhbCB1c2Ugb2YgYG1haW50YWluUmVsYXRpdmVMaXN0UG9zaXRpb25zYD9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtYWludGFpblJlbGF0aXZlTGlzdFBvc2l0aW9ucyhhLCBiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFGYWlsZWRNYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxOyAgIC8vIGZvcmNlIGEgKGZhaWxlZCkgYmVsb3cgYlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7ICAgLy8gZm9yY2UgYiAoZmFpbGVkKSBiZWxvdyBhXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vcmV0dXJuIChhLnByaW9yUG9zaXRpb24gPCBiLnByaW9yUG9zaXRpb24pID8gLTE6MTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFpbnRhaW5SZWxhdGl2ZUxpc3RQb3NpdGlvbnMoYSwgYik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFNYXBTdGF0dXMpIHJldHVybiAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYk1hcFN0YXR1cykgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdNYXBwZWQgbmFtZXMgZmlyc3QnOlxuICAgICAgICAgICAgICAgIGZpbHRlcmVkTGlzdC5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYU1hcFN0YXR1cyA9ICQudHJpbShhWydvdHRUYXhvbk5hbWUnXSkgIT09ICcnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYk1hcFN0YXR1cyA9ICQudHJpbShiWydvdHRUYXhvbk5hbWUnXSkgIT09ICcnO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYU1hcFN0YXR1cyA9PT0gYk1hcFN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1haW50YWluUmVsYXRpdmVMaXN0UG9zaXRpb25zKGEsIGIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChhTWFwU3RhdHVzKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdPcmlnaW5hbCBuYW1lIChBLVopJzpcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZExpc3Quc29ydChmdW5jdGlvbihhLGIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFPcmlnaW5hbCA9ICQudHJpbShhWydvcmlnaW5hbExhYmVsJ10pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYk9yaWdpbmFsID0gJC50cmltKGJbJ29yaWdpbmFsTGFiZWwnXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhT3JpZ2luYWwgPT09IGJPcmlnaW5hbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1haW50YWluUmVsYXRpdmVMaXN0UG9zaXRpb25zKGEsIGIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChhT3JpZ2luYWwgPCBiT3JpZ2luYWwpIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ09yaWdpbmFsIG5hbWUgKFotQSknOlxuICAgICAgICAgICAgICAgIGZpbHRlcmVkTGlzdC5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYU9yaWdpbmFsID0gJC50cmltKGFbJ29yaWdpbmFsTGFiZWwnXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiT3JpZ2luYWwgPSAkLnRyaW0oYlsnb3JpZ2luYWxMYWJlbCddKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFPcmlnaW5hbCA9PT0gYk9yaWdpbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFpbnRhaW5SZWxhdGl2ZUxpc3RQb3NpdGlvbnMoYSwgYik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFPcmlnaW5hbCA+IGJPcmlnaW5hbCkgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVuZXhwZWN0ZWQgb3JkZXIgZm9yIG5hbWUgbGlzdDogW1wiKyBvcmRlciArXCJdXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVW4tc2VsZWN0IGFueSBuYW1lIHRoYXQncyBub3cgb3V0IG9mIHZpZXcgKGllLCBvdXRzaWRlIG9mIHRoZSBmaXJzdCBwYWdlIG9mIHJlc3VsdHMpXG4gICAgICAgIHZhciBpdGVtc0luVmlldyA9IGZpbHRlcmVkTGlzdC5zbGljZSgwLCB2aWV3TW9kZWwuX2ZpbHRlcmVkTmFtZXMucGFnZVNpemUpO1xuICAgICAgICB2aWV3TW9kZWwubmFtZXMoKS5tYXAoZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgaWYgKG5hbWVbJ3NlbGVjdGVkRm9yQWN0aW9uJ10pIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNPdXRPZlZpZXcgPSAoJC5pbkFycmF5KG5hbWUsIGl0ZW1zSW5WaWV3KSA9PT0gLTEpO1xuICAgICAgICAgICAgICAgIGlmIChpc091dE9mVmlldykge1xuICAgICAgICAgICAgICAgICAgICBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBjbGVhciBhbnkgc3RhbGUgbGFzdC1zZWxlY3RlZCBuYW1lIChpdCdzIGxpa2VseSBtb3ZlZClcbiAgICAgICAgbGFzdENsaWNrZWRUb2dnbGVQb3NpdGlvbiA9IG51bGw7XG5cbiAgICAgICAgdmlld01vZGVsLl9maWx0ZXJlZE5hbWVzKCBmaWx0ZXJlZExpc3QgKTtcbiAgICAgICAgcmV0dXJuIHZpZXdNb2RlbC5fZmlsdGVyZWROYW1lcztcbiAgICB9KS5leHRlbmQoeyB0aHJvdHRsZTogdmlld01vZGVsLmZpbHRlckRlbGF5IH0pOyAvLyBFTkQgb2YgZmlsdGVyZWROYW1lc1xuXG4gICAgLy8gU3Rhc2ggdGhlIHByaXN0aW5lIG1hcmt1cCBiZWZvcmUgYmluZGluZyBvdXIgVUkgZm9yIHRoZSBmaXJzdCB0aW1lXG4gICAgaWYgKCRzdGFzaGVkRWRpdEFyZWEgPT09IG51bGwpIHtcbiAgICAgICAgJHN0YXNoZWRFZGl0QXJlYSA9ICQoJyNOYW1lLU1hcHBpbmcnKS5jbG9uZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJlcGxhY2Ugd2l0aCBwcmlzdGluZSBtYXJrdXAgdG8gYXZvaWQgd2VpcmQgcmVzdWx0cyB3aGVuIGxvYWRpbmcgYSBuZXcgbmFtZXNldFxuICAgICAgICAkKCcjTmFtZS1NYXBwaW5nJykuY29udGVudHMoKS5yZXBsYWNlV2l0aChcbiAgICAgICAgICAgICRzdGFzaGVkRWRpdEFyZWEuY2xvbmUoKS5jb250ZW50cygpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gKHJlKWJpbmQgdG8gZWRpdG9yIFVJIHdpdGggS25vY2tvdXRcbiAgICB2YXIgJGJvdW5kRWxlbWVudHMgPSAkKCcjTmFtZS1NYXBwaW5nLCAjaGVscC1maWxlLWFwaS1wcm9tcHQnKTsgLy8gYWRkIG90aGVyIGVsZW1lbnRzP1xuICAgICQuZWFjaCgkYm91bmRFbGVtZW50cywgZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAga28uY2xlYW5Ob2RlKGVsKTtcbiAgICAgICAga28uYXBwbHlCaW5kaW5ncyh2aWV3TW9kZWwsZWwpO1xuICAgIH0pO1xuXG4gICAgLyogQW55IGZ1cnRoZXIgY2hhbmdlcyAoKmFmdGVyKiBpbml0aWFsIGNsZWFudXApIHNob3VsZCBwcm9tcHQgZm9yIGEgc2F2ZVxuICAgICAqIGJlZm9yZSBsZWF2aW5nIHRoaXMgcGFnZS5cbiAgICAgKi9cbiAgICB2aWV3TW9kZWwudGlja2xlcnMuTkFNRVNFVF9IQVNfQ0hBTkdFRC5zdWJzY3JpYmUoIGZ1bmN0aW9uKCkge1xuICAgICAgICBuYW1lc2V0SGFzVW5zYXZlZENoYW5nZXMgPSB0cnVlO1xuICAgICAgICBlbmFibGVTYXZlQnV0dG9uKCk7XG4gICAgICAgIHB1c2hQYWdlRXhpdFdhcm5pbmcoJ1VOU0FWRURfTkFNRVNFVF9DSEFOR0VTJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIldBUk5JTkc6IFRoaXMgbmFtZXNldCBoYXMgdW5zYXZlZCBjaGFuZ2VzISBUbyBwcmVzZXJ2ZSB5b3VyIHdvcmssIHlvdSBzaG91bGQgc2F2ZSBhIG5hbWVzZXQgZmlsZSBiZWZvcmUgbGVhdmluZyBvciByZWxvYWRpbmcgdGhlIHBhZ2UuXCIpO1xuICAgIH0pO1xuICAgIHBvcFBhZ2VFeGl0V2FybmluZygnVU5TQVZFRF9OQU1FU0VUX0NIQU5HRVMnKTtcbiAgICBuYW1lc2V0SGFzVW5zYXZlZENoYW5nZXMgPSBmYWxzZTtcbiAgICBkaXNhYmxlU2F2ZUJ1dHRvbigpO1xufVxuXG4vLyBrZWVwIHRyYWNrIG9mIHRoZSBsYXJnZXN0IChhbmQgdGh1cyBuZXh0IGF2YWlsYWJsZSkgbmFtZSBpZFxudmFyIGhpZ2hlc3ROYW1lT3JkaW5hbE51bWJlciA9IG51bGw7XG5mdW5jdGlvbiBmaW5kSGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyKCkge1xuICAgIC8vIGRvIGEgb25lLXRpbWUgc2NhbiBmb3IgdGhlIGhpZ2hlc3QgSUQgY3VycmVudGx5IGluIHVzZVxuICAgIHZhciBoaWdoZXN0T3JkaW5hbE51bWJlciA9IDA7XG4gICAgdmFyIGFsbE5hbWVzID0gdmlld01vZGVsLm5hbWVzKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGxOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGVzdE5hbWUgPSBhbGxOYW1lc1tpXTtcbiAgICAgICAgdmFyIHRlc3RJRCA9IGtvLnVud3JhcCh0ZXN0TmFtZVsnaWQnXSkgfHwgJyc7XG4gICAgICAgIGlmICh0ZXN0SUQgPT09ICcnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTUlTU0lORyBJRCBmb3IgdGhpcyBuYW1lOlwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGVzdE5hbWUpO1xuICAgICAgICAgICAgY29udGludWU7ICAvLyBza2lwIHRvIG5leHQgZWxlbWVudFxuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXN0SUQuaW5kZXhPZignbmFtZScpID09PSAwKSB7XG4gICAgICAgICAgICAvLyBjb21wYXJlIHRoaXMgdG8gdGhlIGhpZ2hlc3QgSUQgZm91bmQgc28gZmFyXG4gICAgICAgICAgICB2YXIgaXRzTnVtYmVyID0gdGVzdElELnNwbGl0KCAnbmFtZScgKVsxXTtcbiAgICAgICAgICAgIGlmICgkLmlzTnVtZXJpYyggaXRzTnVtYmVyICkpIHtcbiAgICAgICAgICAgICAgICBoaWdoZXN0T3JkaW5hbE51bWJlciA9IE1hdGgubWF4KCBoaWdoZXN0T3JkaW5hbE51bWJlciwgaXRzTnVtYmVyICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGhpZ2hlc3RPcmRpbmFsTnVtYmVyO1xufVxuZnVuY3Rpb24gZ2V0TmV4dE5hbWVPcmRpbmFsTnVtYmVyKCkge1xuICAgIC8vIGluY3JlbWVudCBhbmQgcmV0dXJuIHRoZSBuZXh0IGF2YWlsYWJsZSBvcmRpbmFsIG51bWJlciBmb3IgbmFtZXM7IHRoaXNcbiAgICAvLyBpcyB0eXBpY2FsbHkgdXNlZCB0byBtaW50IGEgbmV3IGlkLCBlLmcuIDIzID0+ICduYW1lMjMnXG4gICAgaWYgKGhpZ2hlc3ROYW1lT3JkaW5hbE51bWJlciA9PT0gbnVsbCkge1xuICAgICAgICBoaWdoZXN0TmFtZU9yZGluYWxOdW1iZXIgPSBmaW5kSGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyKCk7XG4gICAgfVxuICAgIC8vIGluY3JlbWVudCB0aGUgaGlnaGVzdCBJRCBmb3IgZmFzdGVyIGFzc2lnbm1lbnQgbmV4dCB0aW1lXG4gICAgaGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyKys7XG4gICAgcmV0dXJuIGhpZ2hlc3ROYW1lT3JkaW5hbE51bWJlcjtcbn1cblxuXG5mdW5jdGlvbiByZW1vdmVEdXBsaWNhdGVOYW1lcyggdmlld21vZGVsICkge1xuICAgIC8qIENhbGwgdGhpcyB3aGVuIGxvYWRpbmcgYSBuYW1lc2V0ICpvciogYWRkaW5nIG5hbWVzISAgV2Ugc2hvdWxkIHdhbGsgdGhlXG4gICAgICogZnVsbCBuYW1lcyBhcnJheSBhbmQgY2xvYmJlciBhbnkgbGF0ZXIgZHVwbGljYXRlcy4gVGhpcyBhcnJheSBpcyBhbHdheXNcbiAgICAgKiBzb3J0ZWQgYnkgY3JlYXRpb24gb3JkZXIsIHNvIGEgc2ltcGxlIGFwcHJvYWNoIHNob3VsZCBwcmVzZXJ2ZSB0aGVcbiAgICAgKiBjdXJhdG9yJ3MgZXhpc3RpbmcgbWFwcGluZ3MgYW5kIGxhYmVsIGFkanVzdG1lbnRzLlxuICAgICAqL1xuICAgIHZhciBsYWJlbHNBbHJlYWR5Rm91bmQgPSBbIF07XG4gICAgdmFyIGR1cGVzID0gWyBdO1xuICAgICQuZWFjaCggdmlld01vZGVsLm5hbWVzKCksIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgICAgdmFyIHRlc3RMYWJlbCA9ICQudHJpbShuYW1lLm9yaWdpbmFsTGFiZWwpO1xuICAgICAgICBpZiAobGFiZWxzQWxyZWFkeUZvdW5kLmluZGV4T2YodGVzdExhYmVsKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIGFkZCB0aGlzIHRvIGxhYmVscyBmb3VuZCAodGVzdCBsYXRlciBuYW1lcyBhZ2FpbnN0IHRoaXMpXG4gICAgICAgICAgICBsYWJlbHNBbHJlYWR5Rm91bmQucHVzaCh0ZXN0TGFiZWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhpcyBpcyBhIGR1cGUgb2YgYW4gZWFybGllciBuYW1lIVxuICAgICAgICAgICAgZHVwZXMucHVzaChuYW1lKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZpZXdNb2RlbC5uYW1lcy5yZW1vdmVBbGwoIGR1cGVzICk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdElTT0RhdGUoIGRhdGVTdHJpbmcsIG9wdGlvbnMgKSB7XG4gICAgLy8gY29waWVkIGZyb20gc3ludGgtdHJlZSB2aWV3ZXIgKG90dV9zdGF0aXN0aWNzLmh0bWwpXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge2luY2x1ZGVUaW1lOiB0cnVlfTtcbiAgICB2YXIgYURhdGUgPSBuZXcgbW9tZW50KGRhdGVTdHJpbmcpO1xuICAgIC8vIHNlZSBodHRwOi8vbW9tZW50anMuY29tL2RvY3MvIy9wYXJzaW5nL3N0cmluZy9cbiAgICBpZiAob3B0aW9ucy5pbmNsdWRlVGltZSkge1xuICAgICAgICByZXR1cm4gYURhdGUuZm9ybWF0KCdNTU1NIERvIFlZWVksIGhBJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGFEYXRlLmZvcm1hdCgnTU1NTSBEbyBZWVlZJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG93UG9zc2libGVNYXBwaW5nc0tleSgpIHtcbiAgICAvLyBleHBsYWluIGNvbG9ycyBhbmQgb3BhY2l0eSBpbiBhIHBvcHVwIChhbHJlYWR5IGJvdW5kKVxuICAgICQoJyNwb3NzaWJsZS1tYXBwaW5ncy1rZXknKS5tb2RhbCgnc2hvdycpO1xufVxuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBzd2l0Y2ggKGNvbnRleHQpIHtcbiAgICAgICAgY2FzZSAnQlVMS19UTlJTJzpcbiAgICAgICAgICAgIC8vIEFsd2F5cyBzdGFydCB3aXRoIGFuIGVtcHR5IHNldCwgYmluZGluZyBpdCB0byB0aGUgVUlcbiAgICAgICAgICAgIGxvYWROYW1lc2V0RGF0YSggbnVsbCApO1xuICAgICAgICAgICAgLy8gYXV0by1zZWxlY3QgdGhlIG1haW4gKFVJKSB0YWJcbiAgICAgICAgICAgICQoJ2FbaHJlZj0jTmFtZS1NYXBwaW5nXScpLnRhYignc2hvdycpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1NUVURZX09UVV9NQVBQSU5HJzpcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQW55dGhpbmcgdG8gZG8gb24gcmVhZHk/XCIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJz8/Pyc6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nIGZvciBub3cgKHBvc3NpYmx5IHN0dWR5IFZpZXcgcGFnZSlcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn0pO1xuXG4vLyBleHBvcnQgc29tZSBtZW1iZXJzIGFzIGEgc2ltcGxlIEFQSVxudmFyIGFwaSA9IFtcbiAgICAnbnVkZ2UnLCAgLy8gZXhwb3NlIHRpY2tsZXJzIGZvciBLTyBiaW5kaW5nc1xuICAgICdnZXREZWZhdWx0QXJjaGl2ZUZpbGVuYW1lJyxcbiAgICAnc2F2ZUN1cnJlbnROYW1lc2V0JyxcbiAgICAnbG9hZExpc3RGcm9tQ2hvc2VuRmlsZScsXG4gICAgJ2xvYWROYW1lc2V0RnJvbUNob3NlbkZpbGUnLFxuICAgICdzaG93TG9hZExpc3RQb3B1cCcsXG4gICAgJ3Nob3dMb2FkTmFtZXNldFBvcHVwJyxcbiAgICAnc2hvd1NhdmVOYW1lc2V0UG9wdXAnLFxuICAgICdicm93c2VyU3VwcG9ydHNGaWxlQVBJJyxcbiAgICAnYXV0b01hcHBpbmdJblByb2dyZXNzJyxcbiAgICAndXBkYXRlTWFwcGluZ0hpbnRzJyxcbiAgICAnc2hvd05hbWVzZXRNZXRhZGF0YScsXG4gICAgJ2hpZGVOYW1lc2V0TWV0YWRhdGEnLFxuICAgICdpbmZlclNlYXJjaENvbnRleHRGcm9tQXZhaWxhYmxlTmFtZXMnLFxuICAgICdzaG93TWFwcGluZ09wdGlvbnMnLFxuICAgICdoaWRlTWFwcGluZ09wdGlvbnMnLFxuICAgICdkaXNhYmxlU2F2ZUJ1dHRvbicsXG4gICAgJ2VuYWJsZVNhdmVCdXR0b24nLFxuICAgICdnZXRBdHRyc0Zvck1hcHBpbmdPcHRpb24nLFxuICAgICdzdGFydEF1dG9NYXBwaW5nJyxcbiAgICAnc3RvcEF1dG9NYXBwaW5nJyxcbiAgICAnZ2V0TWFwcGVkTmFtZXNUYWxseScsXG4gICAgJ21hcHBpbmdQcm9ncmVzc0FzUGVyY2VudCcsXG4gICAgJ2JvZ3VzRWRpdGVkTGFiZWxDb3VudGVyJyxcbiAgICAndG9nZ2xlTWFwcGluZ0Zvck5hbWUnLFxuICAgICd0b2dnbGVBbGxNYXBwaW5nQ2hlY2tib3hlcycsXG4gICAgJ3Byb3Bvc2VkTWFwcGluZycsXG4gICAgJ2FkanVzdGVkTGFiZWxPckVtcHR5JyxcbiAgICAnY3VycmVudGx5TWFwcGluZ05hbWVzJyxcbiAgICAnZmFpbGVkTWFwcGluZ05hbWVzJyxcbiAgICAnZWRpdE5hbWVMYWJlbCcsXG4gICAgJ3JldmVydE5hbWVMYWJlbCcsXG4gICAgJ21vZGlmeUVkaXRlZExhYmVsJyxcbiAgICAnYXBwcm92ZVByb3Bvc2VkTmFtZUxhYmVsJyxcbiAgICAnYXBwcm92ZVByb3Bvc2VkTmFtZU1hcHBpbmdPcHRpb24nLFxuICAgICdhcHByb3ZlQWxsVmlzaWJsZU1hcHBpbmdzJyxcbiAgICAncmVqZWN0UHJvcG9zZWROYW1lTGFiZWwnLFxuICAgICdyZWplY3RBbGxWaXNpYmxlTWFwcGluZ3MnLFxuICAgICdtYXBOYW1lVG9UYXhvbicsXG4gICAgJ3VubWFwTmFtZUZyb21UYXhvbicsXG4gICAgJ2NsZWFyU2VsZWN0ZWRNYXBwaW5ncycsXG4gICAgJ2NsZWFyQWxsTWFwcGluZ3MnLFxuICAgICdzaG93UG9zc2libGVNYXBwaW5nc0tleScsXG4gICAgJ2FkZFN1YnN0aXR1dGlvbicsXG4gICAgJ3JlbW92ZVN1YnN0aXR1dGlvbicsXG4gICAgJ2Zvcm1hdElTT0RhdGUnLFxuICAgICdjb252ZXJ0VG9OYW1lc2V0TW9kZWwnLFxuICAgICdjb250ZXh0J1xuXTtcbiQuZWFjaChhcGksIGZ1bmN0aW9uKGksIG1ldGhvZE5hbWUpIHtcbiAgICAvLyBwb3B1bGF0ZSB0aGUgZGVmYXVsdCAnbW9kdWxlLmV4cG9ydHMnIG9iamVjdFxuICAgIGV4cG9ydHNbIG1ldGhvZE5hbWUgXSA9IGV2YWwoIG1ldGhvZE5hbWUgKTtcbn0pO1xuIl19
