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
if (window.location.pathname.indexOf("/curator/tnrs") === 0) {
    context = 'BULK_TNRS';
} else if (window.location.pathname.indexOf("/curator/study/edit/") === 0) {
    context = 'STUDY_OTU_MAPPING';
} else if (window.location.pathname.indexOf("/curator/study/view/") === 0) {
    context = 'STUDY_READ_ONLY';
} else {
    context = '???';
    console.error("Unknown context for TNRS! should be one of BULK_TNRS | STUDY_READ_ONLY | STUDY_OTU_MAPPING");
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
    delimitersToGuess: [', ', ',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP],
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
                    // console.log( data );
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
        default:
            // do nothing for now (probably looking at the read-only study view)
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L25vZGVfbW9kdWxlcy91dGlsL3N1cHBvcnQvaXNCdWZmZXJCcm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Fzc2VydC9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwibm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ibG9iLXBvbHlmaWxsL0Jsb2IuanMiLCJub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZpbGUtc2F2ZXIvRmlsZVNhdmVyLmpzIiwibm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvanN6aXAvZGlzdC9qc3ppcC5taW4uanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWFzc2lnbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYXBhcGFyc2UvcGFwYXBhcnNlLm1pbi5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsInRucnMtbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxa0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2p2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb2JqZWN0QXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG4vLyBjb21wYXJlIGFuZCBpc0J1ZmZlciB0YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2Jsb2IvNjgwZTllNWU0ODhmMjJhYWMyNzU5OWE1N2RjODQ0YTYzMTU5MjhkZC9pbmRleC5qc1xuLy8gb3JpZ2luYWwgbm90aWNlOlxuXG4vKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5mdW5jdGlvbiBjb21wYXJlKGEsIGIpIHtcbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIHZhciB4ID0gYS5sZW5ndGg7XG4gIHZhciB5ID0gYi5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV07XG4gICAgICB5ID0gYltpXTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuICBpZiAoeSA8IHgpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGlzQnVmZmVyKGIpIHtcbiAgaWYgKGdsb2JhbC5CdWZmZXIgJiYgdHlwZW9mIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcihiKTtcbiAgfVxuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKTtcbn1cblxuLy8gYmFzZWQgb24gbm9kZSBhc3NlcnQsIG9yaWdpbmFsIG5vdGljZTpcbi8vIE5COiBUaGUgVVJMIHRvIHRoZSBDb21tb25KUyBzcGVjIGlzIGtlcHQganVzdCBmb3IgdHJhZGl0aW9uLlxuLy8gICAgIG5vZGUtYXNzZXJ0IGhhcyBldm9sdmVkIGEgbG90IHNpbmNlIHRoZW4sIGJvdGggaW4gQVBJIGFuZCBiZWhhdmlvci5cblxuLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBmdW5jdGlvbnNIYXZlTmFtZXMgPSAoZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZnVuY3Rpb24gZm9vKCkge30ubmFtZSA9PT0gJ2Zvbyc7XG59KCkpO1xuZnVuY3Rpb24gcFRvU3RyaW5nIChvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopO1xufVxuZnVuY3Rpb24gaXNWaWV3KGFycmJ1Zikge1xuICBpZiAoaXNCdWZmZXIoYXJyYnVmKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIGdsb2JhbC5BcnJheUJ1ZmZlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyLmlzVmlldyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBBcnJheUJ1ZmZlci5pc1ZpZXcoYXJyYnVmKTtcbiAgfVxuICBpZiAoIWFycmJ1Zikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoYXJyYnVmIGluc3RhbmNlb2YgRGF0YVZpZXcpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoYXJyYnVmLmJ1ZmZlciAmJiBhcnJidWYuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG52YXIgcmVnZXggPSAvXFxzKmZ1bmN0aW9uXFxzKyhbXlxcKFxcc10qKVxccyovO1xuLy8gYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2xqaGFyYi9mdW5jdGlvbi5wcm90b3R5cGUubmFtZS9ibG9iL2FkZWVlZWM4YmZjYzYwNjhiMTg3ZDdkOWZiM2Q1YmIxZDNhMzA4OTkvaW1wbGVtZW50YXRpb24uanNcbmZ1bmN0aW9uIGdldE5hbWUoZnVuYykge1xuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihmdW5jKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzKSB7XG4gICAgcmV0dXJuIGZ1bmMubmFtZTtcbiAgfVxuICB2YXIgc3RyID0gZnVuYy50b1N0cmluZygpO1xuICB2YXIgbWF0Y2ggPSBzdHIubWF0Y2gocmVnZXgpO1xuICByZXR1cm4gbWF0Y2ggJiYgbWF0Y2hbMV07XG59XG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH0gZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gZ2V0TmFtZShzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodHlwZW9mIHMgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5mdW5jdGlvbiBpbnNwZWN0KHNvbWV0aGluZykge1xuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzIHx8ICF1dGlsLmlzRnVuY3Rpb24oc29tZXRoaW5nKSkge1xuICAgIHJldHVybiB1dGlsLmluc3BlY3Qoc29tZXRoaW5nKTtcbiAgfVxuICB2YXIgcmF3bmFtZSA9IGdldE5hbWUoc29tZXRoaW5nKTtcbiAgdmFyIG5hbWUgPSByYXduYW1lID8gJzogJyArIHJhd25hbWUgOiAnJztcbiAgcmV0dXJuICdbRnVuY3Rpb24nICsgIG5hbWUgKyAnXSc7XG59XG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKGluc3BlY3Qoc2VsZi5hY3R1YWwpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoaW5zcGVjdChzZWxmLmV4cGVjdGVkKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgZmFsc2UpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmFzc2VydC5kZWVwU3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBkZWVwU3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwU3RyaWN0RXF1YWwnLCBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBzdHJpY3QsIG1lbW9zKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgJiYgaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGNvbXBhcmUoYWN0dWFsLCBleHBlY3RlZCkgPT09IDA7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKChhY3R1YWwgPT09IG51bGwgfHwgdHlwZW9mIGFjdHVhbCAhPT0gJ29iamVjdCcpICYmXG4gICAgICAgICAgICAgKGV4cGVjdGVkID09PSBudWxsIHx8IHR5cGVvZiBleHBlY3RlZCAhPT0gJ29iamVjdCcpKSB7XG4gICAgcmV0dXJuIHN0cmljdCA/IGFjdHVhbCA9PT0gZXhwZWN0ZWQgOiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gSWYgYm90aCB2YWx1ZXMgYXJlIGluc3RhbmNlcyBvZiB0eXBlZCBhcnJheXMsIHdyYXAgdGhlaXIgdW5kZXJseWluZ1xuICAvLyBBcnJheUJ1ZmZlcnMgaW4gYSBCdWZmZXIgZWFjaCB0byBpbmNyZWFzZSBwZXJmb3JtYW5jZVxuICAvLyBUaGlzIG9wdGltaXphdGlvbiByZXF1aXJlcyB0aGUgYXJyYXlzIHRvIGhhdmUgdGhlIHNhbWUgdHlwZSBhcyBjaGVja2VkIGJ5XG4gIC8vIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcgKGFrYSBwVG9TdHJpbmcpLiBOZXZlciBwZXJmb3JtIGJpbmFyeVxuICAvLyBjb21wYXJpc29ucyBmb3IgRmxvYXQqQXJyYXlzLCB0aG91Z2gsIHNpbmNlIGUuZy4gKzAgPT09IC0wIGJ1dCB0aGVpclxuICAvLyBiaXQgcGF0dGVybnMgYXJlIG5vdCBpZGVudGljYWwuXG4gIH0gZWxzZSBpZiAoaXNWaWV3KGFjdHVhbCkgJiYgaXNWaWV3KGV4cGVjdGVkKSAmJlxuICAgICAgICAgICAgIHBUb1N0cmluZyhhY3R1YWwpID09PSBwVG9TdHJpbmcoZXhwZWN0ZWQpICYmXG4gICAgICAgICAgICAgIShhY3R1YWwgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHxcbiAgICAgICAgICAgICAgIGFjdHVhbCBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkpIHtcbiAgICByZXR1cm4gY29tcGFyZShuZXcgVWludDhBcnJheShhY3R1YWwuYnVmZmVyKSxcbiAgICAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShleHBlY3RlZC5idWZmZXIpKSA9PT0gMDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgIT09IGlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBtZW1vcyA9IG1lbW9zIHx8IHthY3R1YWw6IFtdLCBleHBlY3RlZDogW119O1xuXG4gICAgdmFyIGFjdHVhbEluZGV4ID0gbWVtb3MuYWN0dWFsLmluZGV4T2YoYWN0dWFsKTtcbiAgICBpZiAoYWN0dWFsSW5kZXggIT09IC0xKSB7XG4gICAgICBpZiAoYWN0dWFsSW5kZXggPT09IG1lbW9zLmV4cGVjdGVkLmluZGV4T2YoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1lbW9zLmFjdHVhbC5wdXNoKGFjdHVhbCk7XG4gICAgbWVtb3MuZXhwZWN0ZWQucHVzaChleHBlY3RlZCk7XG5cbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgc3RyaWN0LCBtZW1vcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYiwgc3RyaWN0LCBhY3R1YWxWaXNpdGVkT2JqZWN0cykge1xuICBpZiAoYSA9PT0gbnVsbCB8fCBhID09PSB1bmRlZmluZWQgfHwgYiA9PT0gbnVsbCB8fCBiID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBpZiBvbmUgaXMgYSBwcmltaXRpdmUsIHRoZSBvdGhlciBtdXN0IGJlIHNhbWVcbiAgaWYgKHV0aWwuaXNQcmltaXRpdmUoYSkgfHwgdXRpbC5pc1ByaW1pdGl2ZShiKSlcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgaWYgKHN0cmljdCAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYSkgIT09IE9iamVjdC5nZXRQcm90b3R5cGVPZihiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIHZhciBhSXNBcmdzID0gaXNBcmd1bWVudHMoYSk7XG4gIHZhciBiSXNBcmdzID0gaXNBcmd1bWVudHMoYik7XG4gIGlmICgoYUlzQXJncyAmJiAhYklzQXJncykgfHwgKCFhSXNBcmdzICYmIGJJc0FyZ3MpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGFJc0FyZ3MpIHtcbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIsIHN0cmljdCk7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKTtcbiAgdmFyIGtiID0gb2JqZWN0S2V5cyhiKTtcbiAgdmFyIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT09IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldLCBzdHJpY3QsIGFjdHVhbFZpc2l0ZWRPYmplY3RzKSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZhbHNlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG5hc3NlcnQubm90RGVlcFN0cmljdEVxdWFsID0gbm90RGVlcFN0cmljdEVxdWFsO1xuZnVuY3Rpb24gbm90RGVlcFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwU3RyaWN0RXF1YWwnLCBub3REZWVwU3RyaWN0RXF1YWwpO1xuICB9XG59XG5cblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElnbm9yZS4gIFRoZSBpbnN0YW5jZW9mIGNoZWNrIGRvZXNuJ3Qgd29yayBmb3IgYXJyb3cgZnVuY3Rpb25zLlxuICB9XG5cbiAgaWYgKEVycm9yLmlzUHJvdG90eXBlT2YoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWU7XG59XG5cbmZ1bmN0aW9uIF90cnlCbG9jayhibG9jaykge1xuICB2YXIgZXJyb3I7XG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9yID0gZTtcbiAgfVxuICByZXR1cm4gZXJyb3I7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh0eXBlb2YgYmxvY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJsb2NrXCIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnc3RyaW5nJykge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICBhY3R1YWwgPSBfdHJ5QmxvY2soYmxvY2spO1xuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgdmFyIHVzZXJQcm92aWRlZE1lc3NhZ2UgPSB0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZyc7XG4gIHZhciBpc1Vud2FudGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIHV0aWwuaXNFcnJvcihhY3R1YWwpO1xuICB2YXIgaXNVbmV4cGVjdGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIGFjdHVhbCAmJiAhZXhwZWN0ZWQ7XG5cbiAgaWYgKChpc1Vud2FudGVkRXhjZXB0aW9uICYmXG4gICAgICB1c2VyUHJvdmlkZWRNZXNzYWdlICYmXG4gICAgICBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHxcbiAgICAgIGlzVW5leHBlY3RlZEV4Y2VwdGlvbikge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cyh0cnVlLCBibG9jaywgZXJyb3IsIG1lc3NhZ2UpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MoZmFsc2UsIGJsb2NrLCBlcnJvciwgbWVzc2FnZSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB0aHJvdyBlcnI7IH07XG5cbi8vIEV4cG9zZSBhIHN0cmljdCBvbmx5IHZhcmlhbnQgb2YgYXNzZXJ0XG5mdW5jdGlvbiBzdHJpY3QodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09Jywgc3RyaWN0KTtcbn1cbmFzc2VydC5zdHJpY3QgPSBvYmplY3RBc3NpZ24oc3RyaWN0LCBhc3NlcnQsIHtcbiAgZXF1YWw6IGFzc2VydC5zdHJpY3RFcXVhbCxcbiAgZGVlcEVxdWFsOiBhc3NlcnQuZGVlcFN0cmljdEVxdWFsLFxuICBub3RFcXVhbDogYXNzZXJ0Lm5vdFN0cmljdEVxdWFsLFxuICBub3REZWVwRXF1YWw6IGFzc2VydC5ub3REZWVwU3RyaWN0RXF1YWxcbn0pO1xuYXNzZXJ0LnN0cmljdC5zdHJpY3QgPSBhc3NlcnQuc3RyaWN0O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5leHBvcnRzLnRvQnl0ZUFycmF5ID0gdG9CeXRlQXJyYXlcbmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IGZyb21CeXRlQXJyYXlcblxudmFyIGxvb2t1cCA9IFtdXG52YXIgcmV2TG9va3VwID0gW11cbnZhciBBcnIgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgPyBVaW50OEFycmF5IDogQXJyYXlcblxudmFyIGNvZGUgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLydcbmZvciAodmFyIGkgPSAwLCBsZW4gPSBjb2RlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gIGxvb2t1cFtpXSA9IGNvZGVbaV1cbiAgcmV2TG9va3VwW2NvZGUuY2hhckNvZGVBdChpKV0gPSBpXG59XG5cbi8vIFN1cHBvcnQgZGVjb2RpbmcgVVJMLXNhZmUgYmFzZTY0IHN0cmluZ3MsIGFzIE5vZGUuanMgZG9lcy5cbi8vIFNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0I1VSTF9hcHBsaWNhdGlvbnNcbnJldkxvb2t1cFsnLScuY2hhckNvZGVBdCgwKV0gPSA2MlxucmV2TG9va3VwWydfJy5jaGFyQ29kZUF0KDApXSA9IDYzXG5cbmZ1bmN0aW9uIGdldExlbnMgKGI2NCkge1xuICB2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXG4gIGlmIChsZW4gJSA0ID4gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG4gIH1cblxuICAvLyBUcmltIG9mZiBleHRyYSBieXRlcyBhZnRlciBwbGFjZWhvbGRlciBieXRlcyBhcmUgZm91bmRcbiAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYmVhdGdhbW1pdC9iYXNlNjQtanMvaXNzdWVzLzQyXG4gIHZhciB2YWxpZExlbiA9IGI2NC5pbmRleE9mKCc9JylcbiAgaWYgKHZhbGlkTGVuID09PSAtMSkgdmFsaWRMZW4gPSBsZW5cblxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gdmFsaWRMZW4gPT09IGxlblxuICAgID8gMFxuICAgIDogNCAtICh2YWxpZExlbiAlIDQpXG5cbiAgcmV0dXJuIFt2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuXVxufVxuXG4vLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKGI2NCkge1xuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiBfYnl0ZUxlbmd0aCAoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSB7XG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiB0b0J5dGVBcnJheSAoYjY0KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuXG4gIHZhciBhcnIgPSBuZXcgQXJyKF9ieXRlTGVuZ3RoKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikpXG5cbiAgdmFyIGN1ckJ5dGUgPSAwXG5cbiAgLy8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuICB2YXIgbGVuID0gcGxhY2VIb2xkZXJzTGVuID4gMFxuICAgID8gdmFsaWRMZW4gLSA0XG4gICAgOiB2YWxpZExlblxuXG4gIHZhciBpXG4gIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxOCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDEyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPDwgNikgfFxuICAgICAgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAzKV1cbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gMTYpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDIpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldID4+IDQpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAxKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDEwKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgNCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildID4+IDIpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuICByZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gNiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtICYgMHgzRl1cbn1cblxuZnVuY3Rpb24gZW5jb2RlQ2h1bmsgKHVpbnQ4LCBzdGFydCwgZW5kKSB7XG4gIHZhciB0bXBcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAzKSB7XG4gICAgdG1wID1cbiAgICAgICgodWludDhbaV0gPDwgMTYpICYgMHhGRjAwMDApICtcbiAgICAgICgodWludDhbaSArIDFdIDw8IDgpICYgMHhGRjAwKSArXG4gICAgICAodWludDhbaSArIDJdICYgMHhGRilcbiAgICBvdXRwdXQucHVzaCh0cmlwbGV0VG9CYXNlNjQodG1wKSlcbiAgfVxuICByZXR1cm4gb3V0cHV0LmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIGZyb21CeXRlQXJyYXkgKHVpbnQ4KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbiA9IHVpbnQ4Lmxlbmd0aFxuICB2YXIgZXh0cmFCeXRlcyA9IGxlbiAlIDMgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcbiAgdmFyIHBhcnRzID0gW11cbiAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODMgLy8gbXVzdCBiZSBtdWx0aXBsZSBvZiAzXG5cbiAgLy8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuICBmb3IgKHZhciBpID0gMCwgbGVuMiA9IGxlbiAtIGV4dHJhQnl0ZXM7IGkgPCBsZW4yOyBpICs9IG1heENodW5rTGVuZ3RoKSB7XG4gICAgcGFydHMucHVzaChlbmNvZGVDaHVuayh1aW50OCwgaSwgKGkgKyBtYXhDaHVua0xlbmd0aCkgPiBsZW4yID8gbGVuMiA6IChpICsgbWF4Q2h1bmtMZW5ndGgpKSlcbiAgfVxuXG4gIC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcbiAgaWYgKGV4dHJhQnl0ZXMgPT09IDEpIHtcbiAgICB0bXAgPSB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDJdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDQpICYgMHgzRl0gK1xuICAgICAgJz09J1xuICAgIClcbiAgfSBlbHNlIGlmIChleHRyYUJ5dGVzID09PSAyKSB7XG4gICAgdG1wID0gKHVpbnQ4W2xlbiAtIDJdIDw8IDgpICsgdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAxMF0gK1xuICAgICAgbG9va3VwWyh0bXAgPj4gNCkgJiAweDNGXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCAyKSAmIDB4M0ZdICtcbiAgICAgICc9J1xuICAgIClcbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKCcnKVxufVxuIiwiLyogQmxvYi5qc1xuICogQSBCbG9iIGltcGxlbWVudGF0aW9uLlxuICogMjAxNC0wNy0yNFxuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIEJ5IERldmluIFNhbWFyaW4sIGh0dHBzOi8vZ2l0aHViLmNvbS9kc2FtYXJpblxuICogTGljZW5zZTogWDExL01JVFxuICogICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvQmxvYi5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiwgdW5lc2NhcGUgKi9cbi8qanNsaW50IGJpdHdpc2U6IHRydWUsIHJlZ2V4cDogdHJ1ZSwgY29uZnVzaW9uOiB0cnVlLCBlczU6IHRydWUsIHZhcnM6IHRydWUsIHdoaXRlOiB0cnVlLFxuICBwbHVzcGx1czogdHJ1ZSAqL1xuXG4vKiEgQHNvdXJjZSBodHRwOi8vcHVybC5lbGlncmV5LmNvbS9naXRodWIvQmxvYi5qcy9ibG9iL21hc3Rlci9CbG9iLmpzICovXG5cbihmdW5jdGlvbiAodmlldykge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2aWV3LlVSTCA9IHZpZXcuVVJMIHx8IHZpZXcud2Via2l0VVJMO1xuXG5cdGlmICh2aWV3LkJsb2IgJiYgdmlldy5VUkwpIHtcblx0XHR0cnkge1xuXHRcdFx0bmV3IEJsb2I7XG5cdFx0XHRyZXR1cm47XG5cdFx0fSBjYXRjaCAoZSkge31cblx0fVxuXG5cdC8vIEludGVybmFsbHkgd2UgdXNlIGEgQmxvYkJ1aWxkZXIgaW1wbGVtZW50YXRpb24gdG8gYmFzZSBCbG9iIG9mZiBvZlxuXHQvLyBpbiBvcmRlciB0byBzdXBwb3J0IG9sZGVyIGJyb3dzZXJzIHRoYXQgb25seSBoYXZlIEJsb2JCdWlsZGVyXG5cdHZhciBCbG9iQnVpbGRlciA9IHZpZXcuQmxvYkJ1aWxkZXIgfHwgdmlldy5XZWJLaXRCbG9iQnVpbGRlciB8fCB2aWV3Lk1vekJsb2JCdWlsZGVyIHx8IChmdW5jdGlvbih2aWV3KSB7XG5cdFx0dmFyXG5cdFx0XHQgIGdldF9jbGFzcyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuXHRcdFx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkubWF0Y2goL15cXFtvYmplY3RcXHMoLiopXFxdJC8pWzFdO1xuXHRcdFx0fVxuXHRcdFx0LCBGYWtlQmxvYkJ1aWxkZXIgPSBmdW5jdGlvbiBCbG9iQnVpbGRlcigpIHtcblx0XHRcdFx0dGhpcy5kYXRhID0gW107XG5cdFx0XHR9XG5cdFx0XHQsIEZha2VCbG9iID0gZnVuY3Rpb24gQmxvYihkYXRhLCB0eXBlLCBlbmNvZGluZykge1xuXHRcdFx0XHR0aGlzLmRhdGEgPSBkYXRhO1xuXHRcdFx0XHR0aGlzLnNpemUgPSBkYXRhLmxlbmd0aDtcblx0XHRcdFx0dGhpcy50eXBlID0gdHlwZTtcblx0XHRcdFx0dGhpcy5lbmNvZGluZyA9IGVuY29kaW5nO1xuXHRcdFx0fVxuXHRcdFx0LCBGQkJfcHJvdG8gPSBGYWtlQmxvYkJ1aWxkZXIucHJvdG90eXBlXG5cdFx0XHQsIEZCX3Byb3RvID0gRmFrZUJsb2IucHJvdG90eXBlXG5cdFx0XHQsIEZpbGVSZWFkZXJTeW5jID0gdmlldy5GaWxlUmVhZGVyU3luY1xuXHRcdFx0LCBGaWxlRXhjZXB0aW9uID0gZnVuY3Rpb24odHlwZSkge1xuXHRcdFx0XHR0aGlzLmNvZGUgPSB0aGlzW3RoaXMubmFtZSA9IHR5cGVdO1xuXHRcdFx0fVxuXHRcdFx0LCBmaWxlX2V4X2NvZGVzID0gKFxuXHRcdFx0XHQgIFwiTk9UX0ZPVU5EX0VSUiBTRUNVUklUWV9FUlIgQUJPUlRfRVJSIE5PVF9SRUFEQUJMRV9FUlIgRU5DT0RJTkdfRVJSIFwiXG5cdFx0XHRcdCsgXCJOT19NT0RJRklDQVRJT05fQUxMT1dFRF9FUlIgSU5WQUxJRF9TVEFURV9FUlIgU1lOVEFYX0VSUlwiXG5cdFx0XHQpLnNwbGl0KFwiIFwiKVxuXHRcdFx0LCBmaWxlX2V4X2NvZGUgPSBmaWxlX2V4X2NvZGVzLmxlbmd0aFxuXHRcdFx0LCByZWFsX1VSTCA9IHZpZXcuVVJMIHx8IHZpZXcud2Via2l0VVJMIHx8IHZpZXdcblx0XHRcdCwgcmVhbF9jcmVhdGVfb2JqZWN0X1VSTCA9IHJlYWxfVVJMLmNyZWF0ZU9iamVjdFVSTFxuXHRcdFx0LCByZWFsX3Jldm9rZV9vYmplY3RfVVJMID0gcmVhbF9VUkwucmV2b2tlT2JqZWN0VVJMXG5cdFx0XHQsIFVSTCA9IHJlYWxfVVJMXG5cdFx0XHQsIGJ0b2EgPSB2aWV3LmJ0b2Fcblx0XHRcdCwgYXRvYiA9IHZpZXcuYXRvYlxuXG5cdFx0XHQsIEFycmF5QnVmZmVyID0gdmlldy5BcnJheUJ1ZmZlclxuXHRcdFx0LCBVaW50OEFycmF5ID0gdmlldy5VaW50OEFycmF5XG5cblx0XHRcdCwgb3JpZ2luID0gL15bXFx3LV0rOlxcLypcXFs/W1xcd1xcLjotXStcXF0/KD86OlswLTldKyk/L1xuXHRcdDtcblx0XHRGYWtlQmxvYi5mYWtlID0gRkJfcHJvdG8uZmFrZSA9IHRydWU7XG5cdFx0d2hpbGUgKGZpbGVfZXhfY29kZS0tKSB7XG5cdFx0XHRGaWxlRXhjZXB0aW9uLnByb3RvdHlwZVtmaWxlX2V4X2NvZGVzW2ZpbGVfZXhfY29kZV1dID0gZmlsZV9leF9jb2RlICsgMTtcblx0XHR9XG5cdFx0Ly8gUG9seWZpbGwgVVJMXG5cdFx0aWYgKCFyZWFsX1VSTC5jcmVhdGVPYmplY3RVUkwpIHtcblx0XHRcdFVSTCA9IHZpZXcuVVJMID0gZnVuY3Rpb24odXJpKSB7XG5cdFx0XHRcdHZhclxuXHRcdFx0XHRcdCAgdXJpX2luZm8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCIsIFwiYVwiKVxuXHRcdFx0XHRcdCwgdXJpX29yaWdpblxuXHRcdFx0XHQ7XG5cdFx0XHRcdHVyaV9pbmZvLmhyZWYgPSB1cmk7XG5cdFx0XHRcdGlmICghKFwib3JpZ2luXCIgaW4gdXJpX2luZm8pKSB7XG5cdFx0XHRcdFx0aWYgKHVyaV9pbmZvLnByb3RvY29sLnRvTG93ZXJDYXNlKCkgPT09IFwiZGF0YTpcIikge1xuXHRcdFx0XHRcdFx0dXJpX2luZm8ub3JpZ2luID0gbnVsbDtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dXJpX29yaWdpbiA9IHVyaS5tYXRjaChvcmlnaW4pO1xuXHRcdFx0XHRcdFx0dXJpX2luZm8ub3JpZ2luID0gdXJpX29yaWdpbiAmJiB1cmlfb3JpZ2luWzFdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdXJpX2luZm87XG5cdFx0XHR9O1xuXHRcdH1cblx0XHRVUkwuY3JlYXRlT2JqZWN0VVJMID0gZnVuY3Rpb24oYmxvYikge1xuXHRcdFx0dmFyXG5cdFx0XHRcdCAgdHlwZSA9IGJsb2IudHlwZVxuXHRcdFx0XHQsIGRhdGFfVVJJX2hlYWRlclxuXHRcdFx0O1xuXHRcdFx0aWYgKHR5cGUgPT09IG51bGwpIHtcblx0XHRcdFx0dHlwZSA9IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCI7XG5cdFx0XHR9XG5cdFx0XHRpZiAoYmxvYiBpbnN0YW5jZW9mIEZha2VCbG9iKSB7XG5cdFx0XHRcdGRhdGFfVVJJX2hlYWRlciA9IFwiZGF0YTpcIiArIHR5cGU7XG5cdFx0XHRcdGlmIChibG9iLmVuY29kaW5nID09PSBcImJhc2U2NFwiKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGFfVVJJX2hlYWRlciArIFwiO2Jhc2U2NCxcIiArIGJsb2IuZGF0YTtcblx0XHRcdFx0fSBlbHNlIGlmIChibG9iLmVuY29kaW5nID09PSBcIlVSSVwiKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGFfVVJJX2hlYWRlciArIFwiLFwiICsgZGVjb2RlVVJJQ29tcG9uZW50KGJsb2IuZGF0YSk7XG5cdFx0XHRcdH0gaWYgKGJ0b2EpIHtcblx0XHRcdFx0XHRyZXR1cm4gZGF0YV9VUklfaGVhZGVyICsgXCI7YmFzZTY0LFwiICsgYnRvYShibG9iLmRhdGEpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBkYXRhX1VSSV9oZWFkZXIgKyBcIixcIiArIGVuY29kZVVSSUNvbXBvbmVudChibG9iLmRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKHJlYWxfY3JlYXRlX29iamVjdF9VUkwpIHtcblx0XHRcdFx0cmV0dXJuIHJlYWxfY3JlYXRlX29iamVjdF9VUkwuY2FsbChyZWFsX1VSTCwgYmxvYik7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRVUkwucmV2b2tlT2JqZWN0VVJMID0gZnVuY3Rpb24ob2JqZWN0X1VSTCkge1xuXHRcdFx0aWYgKG9iamVjdF9VUkwuc3Vic3RyaW5nKDAsIDUpICE9PSBcImRhdGE6XCIgJiYgcmVhbF9yZXZva2Vfb2JqZWN0X1VSTCkge1xuXHRcdFx0XHRyZWFsX3Jldm9rZV9vYmplY3RfVVJMLmNhbGwocmVhbF9VUkwsIG9iamVjdF9VUkwpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0RkJCX3Byb3RvLmFwcGVuZCA9IGZ1bmN0aW9uKGRhdGEvKiwgZW5kaW5ncyovKSB7XG5cdFx0XHR2YXIgYmIgPSB0aGlzLmRhdGE7XG5cdFx0XHQvLyBkZWNvZGUgZGF0YSB0byBhIGJpbmFyeSBzdHJpbmdcblx0XHRcdGlmIChVaW50OEFycmF5ICYmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHwgZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpKSB7XG5cdFx0XHRcdHZhclxuXHRcdFx0XHRcdCAgc3RyID0gXCJcIlxuXHRcdFx0XHRcdCwgYnVmID0gbmV3IFVpbnQ4QXJyYXkoZGF0YSlcblx0XHRcdFx0XHQsIGkgPSAwXG5cdFx0XHRcdFx0LCBidWZfbGVuID0gYnVmLmxlbmd0aFxuXHRcdFx0XHQ7XG5cdFx0XHRcdGZvciAoOyBpIDwgYnVmX2xlbjsgaSsrKSB7XG5cdFx0XHRcdFx0c3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRiYi5wdXNoKHN0cik7XG5cdFx0XHR9IGVsc2UgaWYgKGdldF9jbGFzcyhkYXRhKSA9PT0gXCJCbG9iXCIgfHwgZ2V0X2NsYXNzKGRhdGEpID09PSBcIkZpbGVcIikge1xuXHRcdFx0XHRpZiAoRmlsZVJlYWRlclN5bmMpIHtcblx0XHRcdFx0XHR2YXIgZnIgPSBuZXcgRmlsZVJlYWRlclN5bmM7XG5cdFx0XHRcdFx0YmIucHVzaChmci5yZWFkQXNCaW5hcnlTdHJpbmcoZGF0YSkpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGFzeW5jIEZpbGVSZWFkZXIgd29uJ3Qgd29yayBhcyBCbG9iQnVpbGRlciBpcyBzeW5jXG5cdFx0XHRcdFx0dGhyb3cgbmV3IEZpbGVFeGNlcHRpb24oXCJOT1RfUkVBREFCTEVfRVJSXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGRhdGEgaW5zdGFuY2VvZiBGYWtlQmxvYikge1xuXHRcdFx0XHRpZiAoZGF0YS5lbmNvZGluZyA9PT0gXCJiYXNlNjRcIiAmJiBhdG9iKSB7XG5cdFx0XHRcdFx0YmIucHVzaChhdG9iKGRhdGEuZGF0YSkpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGRhdGEuZW5jb2RpbmcgPT09IFwiVVJJXCIpIHtcblx0XHRcdFx0XHRiYi5wdXNoKGRlY29kZVVSSUNvbXBvbmVudChkYXRhLmRhdGEpKTtcblx0XHRcdFx0fSBlbHNlIGlmIChkYXRhLmVuY29kaW5nID09PSBcInJhd1wiKSB7XG5cdFx0XHRcdFx0YmIucHVzaChkYXRhLmRhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAodHlwZW9mIGRhdGEgIT09IFwic3RyaW5nXCIpIHtcblx0XHRcdFx0XHRkYXRhICs9IFwiXCI7IC8vIGNvbnZlcnQgdW5zdXBwb3J0ZWQgdHlwZXMgdG8gc3RyaW5nc1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIGRlY29kZSBVVEYtMTYgdG8gYmluYXJ5IHN0cmluZ1xuXHRcdFx0XHRiYi5wdXNoKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChkYXRhKSkpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0RkJCX3Byb3RvLmdldEJsb2IgPSBmdW5jdGlvbih0eXBlKSB7XG5cdFx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRcdFx0dHlwZSA9IG51bGw7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbmV3IEZha2VCbG9iKHRoaXMuZGF0YS5qb2luKFwiXCIpLCB0eXBlLCBcInJhd1wiKTtcblx0XHR9O1xuXHRcdEZCQl9wcm90by50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFwiW29iamVjdCBCbG9iQnVpbGRlcl1cIjtcblx0XHR9O1xuXHRcdEZCX3Byb3RvLnNsaWNlID0gZnVuY3Rpb24oc3RhcnQsIGVuZCwgdHlwZSkge1xuXHRcdFx0dmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoO1xuXHRcdFx0aWYgKGFyZ3MgPCAzKSB7XG5cdFx0XHRcdHR5cGUgPSBudWxsO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG5ldyBGYWtlQmxvYihcblx0XHRcdFx0ICB0aGlzLmRhdGEuc2xpY2Uoc3RhcnQsIGFyZ3MgPiAxID8gZW5kIDogdGhpcy5kYXRhLmxlbmd0aClcblx0XHRcdFx0LCB0eXBlXG5cdFx0XHRcdCwgdGhpcy5lbmNvZGluZ1xuXHRcdFx0KTtcblx0XHR9O1xuXHRcdEZCX3Byb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gXCJbb2JqZWN0IEJsb2JdXCI7XG5cdFx0fTtcblx0XHRGQl9wcm90by5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5zaXplID0gMDtcblx0XHRcdGRlbGV0ZSB0aGlzLmRhdGE7XG5cdFx0fTtcblx0XHRyZXR1cm4gRmFrZUJsb2JCdWlsZGVyO1xuXHR9KHZpZXcpKTtcblxuXHR2aWV3LkJsb2IgPSBmdW5jdGlvbihibG9iUGFydHMsIG9wdGlvbnMpIHtcblx0XHR2YXIgdHlwZSA9IG9wdGlvbnMgPyAob3B0aW9ucy50eXBlIHx8IFwiXCIpIDogXCJcIjtcblx0XHR2YXIgYnVpbGRlciA9IG5ldyBCbG9iQnVpbGRlcigpO1xuXHRcdGlmIChibG9iUGFydHMpIHtcblx0XHRcdGZvciAodmFyIGkgPSAwLCBsZW4gPSBibG9iUGFydHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0aWYgKFVpbnQ4QXJyYXkgJiYgYmxvYlBhcnRzW2ldIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuXHRcdFx0XHRcdGJ1aWxkZXIuYXBwZW5kKGJsb2JQYXJ0c1tpXS5idWZmZXIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdGJ1aWxkZXIuYXBwZW5kKGJsb2JQYXJ0c1tpXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0dmFyIGJsb2IgPSBidWlsZGVyLmdldEJsb2IodHlwZSk7XG5cdFx0aWYgKCFibG9iLnNsaWNlICYmIGJsb2Iud2Via2l0U2xpY2UpIHtcblx0XHRcdGJsb2Iuc2xpY2UgPSBibG9iLndlYmtpdFNsaWNlO1xuXHRcdH1cblx0XHRyZXR1cm4gYmxvYjtcblx0fTtcblxuXHR2YXIgZ2V0UHJvdG90eXBlT2YgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YgfHwgZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0cmV0dXJuIG9iamVjdC5fX3Byb3RvX187XG5cdH07XG5cdHZpZXcuQmxvYi5wcm90b3R5cGUgPSBnZXRQcm90b3R5cGVPZihuZXcgdmlldy5CbG9iKCkpO1xufSh0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiAmJiBzZWxmIHx8IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93IHx8IHRoaXMuY29udGVudCB8fCB0aGlzKSk7XG4iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxudmFyIEtfTUFYX0xFTkdUSCA9IDB4N2ZmZmZmZmZcbmV4cG9ydHMua01heExlbmd0aCA9IEtfTUFYX0xFTkdUSFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBQcmludCB3YXJuaW5nIGFuZCByZWNvbW1lbmQgdXNpbmcgYGJ1ZmZlcmAgdjQueCB3aGljaCBoYXMgYW4gT2JqZWN0XG4gKiAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBXZSByZXBvcnQgdGhhdCB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBpZiB0aGUgYXJlIG5vdCBzdWJjbGFzc2FibGVcbiAqIHVzaW5nIF9fcHJvdG9fXy4gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWBcbiAqIChTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOCkuIElFIDEwIGxhY2tzIHN1cHBvcnRcbiAqIGZvciBfX3Byb3RvX18gYW5kIGhhcyBhIGJ1Z2d5IHR5cGVkIGFycmF5IGltcGxlbWVudGF0aW9uLlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICBjb25zb2xlLmVycm9yKFxuICAgICdUaGlzIGJyb3dzZXIgbGFja3MgdHlwZWQgYXJyYXkgKFVpbnQ4QXJyYXkpIHN1cHBvcnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgJyArXG4gICAgJ2BidWZmZXJgIHY1LnguIFVzZSBgYnVmZmVyYCB2NC54IGlmIHlvdSByZXF1aXJlIG9sZCBicm93c2VyIHN1cHBvcnQuJ1xuICApXG59XG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgLy8gQ2FuIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkP1xuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5fX3Byb3RvX18gPSB7IF9fcHJvdG9fXzogVWludDhBcnJheS5wcm90b3R5cGUsIGZvbzogZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfSB9XG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDJcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAncGFyZW50Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgIT0gbnVsbCAmJlxuICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgIHZhbHVlOiBudWxsLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbmZ1bmN0aW9uIGZyb20gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2UodmFsdWUpXG4gIH1cblxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgICApXG4gIH1cblxuICBpZiAoaXNJbnN0YW5jZSh2YWx1ZSwgQXJyYXlCdWZmZXIpIHx8XG4gICAgICAodmFsdWUgJiYgaXNJbnN0YW5jZSh2YWx1ZS5idWZmZXIsIEFycmF5QnVmZmVyKSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidmFsdWVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBvZiB0eXBlIG51bWJlci4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgKVxuICB9XG5cbiAgdmFyIHZhbHVlT2YgPSB2YWx1ZS52YWx1ZU9mICYmIHZhbHVlLnZhbHVlT2YoKVxuICBpZiAodmFsdWVPZiAhPSBudWxsICYmIHZhbHVlT2YgIT09IHZhbHVlKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHZhbHVlT2YsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIHZhciBiID0gZnJvbU9iamVjdCh2YWx1ZSlcbiAgaWYgKGIpIHJldHVybiBiXG5cbiAgaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1ByaW1pdGl2ZSAhPSBudWxsICYmXG4gICAgICB0eXBlb2YgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShcbiAgICAgIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0oJ3N0cmluZycpLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGhcbiAgICApXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gIClcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBCdWZmZXIoYXJnLCBlbmNvZGluZykgYnV0IHRocm93cyBhIFR5cGVFcnJvclxuICogaWYgdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBCdWZmZXIuZnJvbShzdHJbLCBlbmNvZGluZ10pXG4gKiBCdWZmZXIuZnJvbShhcnJheSlcbiAqIEJ1ZmZlci5mcm9tKGJ1ZmZlcilcbiAqIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyWywgYnl0ZU9mZnNldFssIGxlbmd0aF1dKVxuICoqL1xuQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gZnJvbSh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBOb3RlOiBDaGFuZ2UgcHJvdG90eXBlICphZnRlciogQnVmZmVyLmZyb20gaXMgZGVmaW5lZCB0byB3b3JrYXJvdW5kIENocm9tZSBidWc6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzE0OFxuQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcblxuZnVuY3Rpb24gYXNzZXJ0U2l6ZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIG51bWJlcicpXG4gIH0gZWxzZSBpZiAoc2l6ZSA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIHNpemUgKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvYyAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxuICB9XG4gIGlmIChmaWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPbmx5IHBheSBhdHRlbnRpb24gdG8gZW5jb2RpbmcgaWYgaXQncyBhIHN0cmluZy4gVGhpc1xuICAgIC8vIHByZXZlbnRzIGFjY2lkZW50YWxseSBzZW5kaW5nIGluIGEgbnVtYmVyIHRoYXQgd291bGRcbiAgICAvLyBiZSBpbnRlcnByZXR0ZWQgYXMgYSBzdGFydCBvZmZzZXQuXG4gICAgcmV0dXJuIHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZydcbiAgICAgID8gY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbCwgZW5jb2RpbmcpXG4gICAgICA6IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwpXG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqIGFsbG9jKHNpemVbLCBmaWxsWywgZW5jb2RpbmddXSlcbiAqKi9cbkJ1ZmZlci5hbGxvYyA9IGZ1bmN0aW9uIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICByZXR1cm4gYWxsb2Moc2l6ZSwgZmlsbCwgZW5jb2RpbmcpXG59XG5cbmZ1bmN0aW9uIGFsbG9jVW5zYWZlIChzaXplKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplIDwgMCA/IDAgOiBjaGVja2VkKHNpemUpIHwgMClcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcblxuICB2YXIgYWN0dWFsID0gYnVmLndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG5cbiAgaWYgKGFjdHVhbCAhPT0gbGVuZ3RoKSB7XG4gICAgLy8gV3JpdGluZyBhIGhleCBzdHJpbmcsIGZvciBleGFtcGxlLCB0aGF0IGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycyB3aWxsXG4gICAgLy8gY2F1c2UgZXZlcnl0aGluZyBhZnRlciB0aGUgZmlyc3QgaW52YWxpZCBjaGFyYWN0ZXIgdG8gYmUgaWdub3JlZC4gKGUuZy5cbiAgICAvLyAnYWJ4eGNkJyB3aWxsIGJlIHRyZWF0ZWQgYXMgJ2FiJylcbiAgICBidWYgPSBidWYuc2xpY2UoMCwgYWN0dWFsKVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlIChhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgYnVmW2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJvZmZzZXRcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcImxlbmd0aFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICB2YXIgYnVmXG4gIGlmIChieXRlT2Zmc2V0ID09PSB1bmRlZmluZWQgJiYgbGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSlcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0KVxuICB9IGVsc2Uge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbilcblxuICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnVmXG4gICAgfVxuXG4gICAgb2JqLmNvcHkoYnVmLCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIGJ1ZlxuICB9XG5cbiAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIoMClcbiAgICB9XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqKVxuICB9XG5cbiAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iai5kYXRhKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBLX01BWF9MRU5HVEhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIEtfTUFYX0xFTkdUSC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuIGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlciA9PT0gdHJ1ZSAmJlxuICAgIGIgIT09IEJ1ZmZlci5wcm90b3R5cGUgLy8gc28gQnVmZmVyLmlzQnVmZmVyKEJ1ZmZlci5wcm90b3R5cGUpIHdpbGwgYmUgZmFsc2Vcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmIChpc0luc3RhbmNlKGEsIFVpbnQ4QXJyYXkpKSBhID0gQnVmZmVyLmZyb20oYSwgYS5vZmZzZXQsIGEuYnl0ZUxlbmd0aClcbiAgaWYgKGlzSW5zdGFuY2UoYiwgVWludDhBcnJheSkpIGIgPSBCdWZmZXIuZnJvbShiLCBiLm9mZnNldCwgYi5ieXRlTGVuZ3RoKVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJidWYxXCIsIFwiYnVmMlwiIGFyZ3VtZW50cyBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5J1xuICAgIClcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChpc0luc3RhbmNlKGJ1ZiwgVWludDhBcnJheSkpIHtcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNJbnN0YW5jZShzdHJpbmcsIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgb3IgQXJyYXlCdWZmZXIuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBzdHJpbmdcbiAgICApXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbXVzdE1hdGNoID0gKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSA9PT0gdHJ1ZSlcbiAgaWYgKCFtdXN0TWF0Y2ggJiYgbGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB7XG4gICAgICAgICAgcmV0dXJuIG11c3RNYXRjaCA/IC0xIDogdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgfVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCAoYW5kIHRoZSBgaXMtYnVmZmVyYCBucG0gcGFja2FnZSlcbi8vIHRvIGRldGVjdCBhIEJ1ZmZlciBpbnN0YW5jZS4gSXQncyBub3QgcG9zc2libGUgdG8gdXNlIGBpbnN0YW5jZW9mIEJ1ZmZlcmBcbi8vIHJlbGlhYmx5IGluIGEgYnJvd3NlcmlmeSBjb250ZXh0IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgZGlmZmVyZW50XG4vLyBjb3BpZXMgb2YgdGhlICdidWZmZXInIHBhY2thZ2UgaW4gdXNlLiBUaGlzIG1ldGhvZCB3b3JrcyBldmVuIGZvciBCdWZmZXJcbi8vIGluc3RhbmNlcyB0aGF0IHdlcmUgY3JlYXRlZCBmcm9tIGFub3RoZXIgY29weSBvZiB0aGUgYGJ1ZmZlcmAgcGFja2FnZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE1NFxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmdcblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5yZXBsYWNlKC8oLnsyfSkvZywgJyQxICcpLnRyaW0oKVxuICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmIChpc0luc3RhbmNlKHRhcmdldCwgVWludDhBcnJheSkpIHtcbiAgICB0YXJnZXQgPSBCdWZmZXIuZnJvbSh0YXJnZXQsIHRhcmdldC5vZmZzZXQsIHRhcmdldC5ieXRlTGVuZ3RoKVxuICB9XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInRhcmdldFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdGFyZ2V0KVxuICAgIClcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG4vLyBGaW5kcyBlaXRoZXIgdGhlIGZpcnN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA+PSBgYnl0ZU9mZnNldGAsXG4vLyBPUiB0aGUgbGFzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPD0gYGJ5dGVPZmZzZXRgLlxuLy9cbi8vIEFyZ3VtZW50czpcbi8vIC0gYnVmZmVyIC0gYSBCdWZmZXIgdG8gc2VhcmNoXG4vLyAtIHZhbCAtIGEgc3RyaW5nLCBCdWZmZXIsIG9yIG51bWJlclxuLy8gLSBieXRlT2Zmc2V0IC0gYW4gaW5kZXggaW50byBgYnVmZmVyYDsgd2lsbCBiZSBjbGFtcGVkIHRvIGFuIGludDMyXG4vLyAtIGVuY29kaW5nIC0gYW4gb3B0aW9uYWwgZW5jb2RpbmcsIHJlbGV2YW50IGlzIHZhbCBpcyBhIHN0cmluZ1xuLy8gLSBkaXIgLSB0cnVlIGZvciBpbmRleE9mLCBmYWxzZSBmb3IgbGFzdEluZGV4T2ZcbmZ1bmN0aW9uIGJpZGlyZWN0aW9uYWxJbmRleE9mIChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICAvLyBFbXB0eSBidWZmZXIgbWVhbnMgbm8gbWF0Y2hcbiAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHJldHVybiAtMVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0XG4gIGlmICh0eXBlb2YgYnl0ZU9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IGJ5dGVPZmZzZXRcbiAgICBieXRlT2Zmc2V0ID0gMFxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSB7XG4gICAgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIHtcbiAgICBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgfVxuICBieXRlT2Zmc2V0ID0gK2J5dGVPZmZzZXQgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKG51bWJlcklzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGRpcikge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWFkKGFyciwgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiBmb3VuZEluZGV4ICogaW5kZXhTaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXhcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBmb3VuZCA9IHRydWVcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpICsgaikgIT09IHJlYWQodmFsLCBqKSkge1xuICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gdGhpcy5pbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpICE9PSAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCB0cnVlKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gbGFzdEluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKG51bWJlcklzTmFOKHBhcnNlZCkpIHJldHVybiBpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBsYXRpbjFXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoID4+PiAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQnVmZmVyLndyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldFssIGxlbmd0aF0pIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnXG4gICAgKVxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBsYXRpbjFTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHNob3VsZCBiZSBhIEJ1ZmZlcicpXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5jb3B5V2l0aGluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVXNlIGJ1aWx0LWluIHdoZW4gYXZhaWxhYmxlLCBtaXNzaW5nIGZyb20gSUUxMVxuICAgIHRoaXMuY29weVdpdGhpbih0YXJnZXRTdGFydCwgc3RhcnQsIGVuZClcbiAgfSBlbHNlIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAodmFyIGkgPSBsZW4gLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpLFxuICAgICAgdGFyZ2V0U3RhcnRcbiAgICApXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIFVzYWdlOlxuLy8gICAgYnVmZmVyLmZpbGwobnVtYmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChidWZmZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKHN0cmluZ1ssIG9mZnNldFssIGVuZF1dWywgZW5jb2RpbmddKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsLCBzdGFydCwgZW5kLCBlbmNvZGluZykge1xuICAvLyBIYW5kbGUgc3RyaW5nIGNhc2VzOlxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodHlwZW9mIHN0YXJ0ID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBzdGFydFxuICAgICAgc3RhcnQgPSAwXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVuZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gZW5kXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH1cbiAgICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmNvZGluZyBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZycgJiYgIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgIH1cbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIGNvZGUgPSB2YWwuY2hhckNvZGVBdCgwKVxuICAgICAgaWYgKChlbmNvZGluZyA9PT0gJ3V0ZjgnICYmIGNvZGUgPCAxMjgpIHx8XG4gICAgICAgICAgZW5jb2RpbmcgPT09ICdsYXRpbjEnKSB7XG4gICAgICAgIC8vIEZhc3QgcGF0aDogSWYgYHZhbGAgZml0cyBpbnRvIGEgc2luZ2xlIGJ5dGUsIHVzZSB0aGF0IG51bWVyaWMgdmFsdWUuXG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgdmFsdWUgXCInICsgdmFsICtcbiAgICAgICAgJ1wiIGlzIGludmFsaWQgZm9yIGFyZ3VtZW50IFwidmFsdWVcIicpXG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgKytpKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teKy8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgdGFrZXMgZXF1YWwgc2lnbnMgYXMgZW5kIG9mIHRoZSBCYXNlNjQgZW5jb2RpbmdcbiAgc3RyID0gc3RyLnNwbGl0KCc9JylbMF1cbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0ci50cmltKCkucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG4vLyBBcnJheUJ1ZmZlciBvciBVaW50OEFycmF5IG9iamVjdHMgZnJvbSBvdGhlciBjb250ZXh0cyAoaS5lLiBpZnJhbWVzKSBkbyBub3QgcGFzc1xuLy8gdGhlIGBpbnN0YW5jZW9mYCBjaGVjayBidXQgdGhleSBzaG91bGQgYmUgdHJlYXRlZCBhcyBvZiB0aGF0IHR5cGUuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNjZcbmZ1bmN0aW9uIGlzSW5zdGFuY2UgKG9iaiwgdHlwZSkge1xuICByZXR1cm4gb2JqIGluc3RhbmNlb2YgdHlwZSB8fFxuICAgIChvYmogIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IgIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IubmFtZSAhPSBudWxsICYmXG4gICAgICBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdHlwZS5uYW1lKVxufVxuZnVuY3Rpb24gbnVtYmVySXNOYU4gKG9iaikge1xuICAvLyBGb3IgSUUxMSBzdXBwb3J0XG4gIHJldHVybiBvYmogIT09IG9iaiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuIiwiLyogRmlsZVNhdmVyLmpzXG4gKiBBIHNhdmVBcygpIEZpbGVTYXZlciBpbXBsZW1lbnRhdGlvbi5cbiAqIDEuMy4yXG4gKiAyMDE2LTA2LTE2IDE4OjI1OjE5XG4gKlxuICogQnkgRWxpIEdyZXksIGh0dHA6Ly9lbGlncmV5LmNvbVxuICogTGljZW5zZTogTUlUXG4gKiAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9GaWxlU2F2ZXIuanMvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxuICovXG5cbi8qZ2xvYmFsIHNlbGYgKi9cbi8qanNsaW50IGJpdHdpc2U6IHRydWUsIGluZGVudDogNCwgbGF4YnJlYWs6IHRydWUsIGxheGNvbW1hOiB0cnVlLCBzbWFydHRhYnM6IHRydWUsIHBsdXNwbHVzOiB0cnVlICovXG5cbi8qISBAc291cmNlIGh0dHA6Ly9wdXJsLmVsaWdyZXkuY29tL2dpdGh1Yi9GaWxlU2F2ZXIuanMvYmxvYi9tYXN0ZXIvRmlsZVNhdmVyLmpzICovXG5cbnZhciBzYXZlQXMgPSBzYXZlQXMgfHwgKGZ1bmN0aW9uKHZpZXcpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cdC8vIElFIDwxMCBpcyBleHBsaWNpdGx5IHVuc3VwcG9ydGVkXG5cdGlmICh0eXBlb2YgdmlldyA9PT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2YgbmF2aWdhdG9yICE9PSBcInVuZGVmaW5lZFwiICYmIC9NU0lFIFsxLTldXFwuLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHZhclxuXHRcdCAgZG9jID0gdmlldy5kb2N1bWVudFxuXHRcdCAgLy8gb25seSBnZXQgVVJMIHdoZW4gbmVjZXNzYXJ5IGluIGNhc2UgQmxvYi5qcyBoYXNuJ3Qgb3ZlcnJpZGRlbiBpdCB5ZXRcblx0XHQsIGdldF9VUkwgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB2aWV3LlVSTCB8fCB2aWV3LndlYmtpdFVSTCB8fCB2aWV3O1xuXHRcdH1cblx0XHQsIHNhdmVfbGluayA9IGRvYy5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sXCIsIFwiYVwiKVxuXHRcdCwgY2FuX3VzZV9zYXZlX2xpbmsgPSBcImRvd25sb2FkXCIgaW4gc2F2ZV9saW5rXG5cdFx0LCBjbGljayA9IGZ1bmN0aW9uKG5vZGUpIHtcblx0XHRcdHZhciBldmVudCA9IG5ldyBNb3VzZUV2ZW50KFwiY2xpY2tcIik7XG5cdFx0XHRub2RlLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuXHRcdH1cblx0XHQsIGlzX3NhZmFyaSA9IC9jb25zdHJ1Y3Rvci9pLnRlc3Qodmlldy5IVE1MRWxlbWVudCkgfHwgdmlldy5zYWZhcmlcblx0XHQsIGlzX2Nocm9tZV9pb3MgPS9DcmlPU1xcL1tcXGRdKy8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KVxuXHRcdCwgdGhyb3dfb3V0c2lkZSA9IGZ1bmN0aW9uKGV4KSB7XG5cdFx0XHQodmlldy5zZXRJbW1lZGlhdGUgfHwgdmlldy5zZXRUaW1lb3V0KShmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhyb3cgZXg7XG5cdFx0XHR9LCAwKTtcblx0XHR9XG5cdFx0LCBmb3JjZV9zYXZlYWJsZV90eXBlID0gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIlxuXHRcdC8vIHRoZSBCbG9iIEFQSSBpcyBmdW5kYW1lbnRhbGx5IGJyb2tlbiBhcyB0aGVyZSBpcyBubyBcImRvd25sb2FkZmluaXNoZWRcIiBldmVudCB0byBzdWJzY3JpYmUgdG9cblx0XHQsIGFyYml0cmFyeV9yZXZva2VfdGltZW91dCA9IDEwMDAgKiA0MCAvLyBpbiBtc1xuXHRcdCwgcmV2b2tlID0gZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0dmFyIHJldm9rZXIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBmaWxlID09PSBcInN0cmluZ1wiKSB7IC8vIGZpbGUgaXMgYW4gb2JqZWN0IFVSTFxuXHRcdFx0XHRcdGdldF9VUkwoKS5yZXZva2VPYmplY3RVUkwoZmlsZSk7XG5cdFx0XHRcdH0gZWxzZSB7IC8vIGZpbGUgaXMgYSBGaWxlXG5cdFx0XHRcdFx0ZmlsZS5yZW1vdmUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdHNldFRpbWVvdXQocmV2b2tlciwgYXJiaXRyYXJ5X3Jldm9rZV90aW1lb3V0KTtcblx0XHR9XG5cdFx0LCBkaXNwYXRjaCA9IGZ1bmN0aW9uKGZpbGVzYXZlciwgZXZlbnRfdHlwZXMsIGV2ZW50KSB7XG5cdFx0XHRldmVudF90eXBlcyA9IFtdLmNvbmNhdChldmVudF90eXBlcyk7XG5cdFx0XHR2YXIgaSA9IGV2ZW50X3R5cGVzLmxlbmd0aDtcblx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0dmFyIGxpc3RlbmVyID0gZmlsZXNhdmVyW1wib25cIiArIGV2ZW50X3R5cGVzW2ldXTtcblx0XHRcdFx0aWYgKHR5cGVvZiBsaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGxpc3RlbmVyLmNhbGwoZmlsZXNhdmVyLCBldmVudCB8fCBmaWxlc2F2ZXIpO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGV4KSB7XG5cdFx0XHRcdFx0XHR0aHJvd19vdXRzaWRlKGV4KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0LCBhdXRvX2JvbSA9IGZ1bmN0aW9uKGJsb2IpIHtcblx0XHRcdC8vIHByZXBlbmQgQk9NIGZvciBVVEYtOCBYTUwgYW5kIHRleHQvKiB0eXBlcyAoaW5jbHVkaW5nIEhUTUwpXG5cdFx0XHQvLyBub3RlOiB5b3VyIGJyb3dzZXIgd2lsbCBhdXRvbWF0aWNhbGx5IGNvbnZlcnQgVVRGLTE2IFUrRkVGRiB0byBFRiBCQiBCRlxuXHRcdFx0aWYgKC9eXFxzKig/OnRleHRcXC9cXFMqfGFwcGxpY2F0aW9uXFwveG1sfFxcUypcXC9cXFMqXFwreG1sKVxccyo7LipjaGFyc2V0XFxzKj1cXHMqdXRmLTgvaS50ZXN0KGJsb2IudHlwZSkpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBCbG9iKFtTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkVGRiksIGJsb2JdLCB7dHlwZTogYmxvYi50eXBlfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYmxvYjtcblx0XHR9XG5cdFx0LCBGaWxlU2F2ZXIgPSBmdW5jdGlvbihibG9iLCBuYW1lLCBub19hdXRvX2JvbSkge1xuXHRcdFx0aWYgKCFub19hdXRvX2JvbSkge1xuXHRcdFx0XHRibG9iID0gYXV0b19ib20oYmxvYik7XG5cdFx0XHR9XG5cdFx0XHQvLyBGaXJzdCB0cnkgYS5kb3dubG9hZCwgdGhlbiB3ZWIgZmlsZXN5c3RlbSwgdGhlbiBvYmplY3QgVVJMc1xuXHRcdFx0dmFyXG5cdFx0XHRcdCAgZmlsZXNhdmVyID0gdGhpc1xuXHRcdFx0XHQsIHR5cGUgPSBibG9iLnR5cGVcblx0XHRcdFx0LCBmb3JjZSA9IHR5cGUgPT09IGZvcmNlX3NhdmVhYmxlX3R5cGVcblx0XHRcdFx0LCBvYmplY3RfdXJsXG5cdFx0XHRcdCwgZGlzcGF0Y2hfYWxsID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0ZGlzcGF0Y2goZmlsZXNhdmVyLCBcIndyaXRlc3RhcnQgcHJvZ3Jlc3Mgd3JpdGUgd3JpdGVlbmRcIi5zcGxpdChcIiBcIikpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIG9uIGFueSBmaWxlc3lzIGVycm9ycyByZXZlcnQgdG8gc2F2aW5nIHdpdGggb2JqZWN0IFVSTHNcblx0XHRcdFx0LCBmc19lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGlmICgoaXNfY2hyb21lX2lvcyB8fCAoZm9yY2UgJiYgaXNfc2FmYXJpKSkgJiYgdmlldy5GaWxlUmVhZGVyKSB7XG5cdFx0XHRcdFx0XHQvLyBTYWZhcmkgZG9lc24ndCBhbGxvdyBkb3dubG9hZGluZyBvZiBibG9iIHVybHNcblx0XHRcdFx0XHRcdHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXHRcdFx0XHRcdFx0cmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHR2YXIgdXJsID0gaXNfY2hyb21lX2lvcyA/IHJlYWRlci5yZXN1bHQgOiByZWFkZXIucmVzdWx0LnJlcGxhY2UoL15kYXRhOlteO10qOy8sICdkYXRhOmF0dGFjaG1lbnQvZmlsZTsnKTtcblx0XHRcdFx0XHRcdFx0dmFyIHBvcHVwID0gdmlldy5vcGVuKHVybCwgJ19ibGFuaycpO1xuXHRcdFx0XHRcdFx0XHRpZighcG9wdXApIHZpZXcubG9jYXRpb24uaHJlZiA9IHVybDtcblx0XHRcdFx0XHRcdFx0dXJsPXVuZGVmaW5lZDsgLy8gcmVsZWFzZSByZWZlcmVuY2UgYmVmb3JlIGRpc3BhdGNoaW5nXG5cdFx0XHRcdFx0XHRcdGZpbGVzYXZlci5yZWFkeVN0YXRlID0gZmlsZXNhdmVyLkRPTkU7XG5cdFx0XHRcdFx0XHRcdGRpc3BhdGNoX2FsbCgpO1xuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdHJlYWRlci5yZWFkQXNEYXRhVVJMKGJsb2IpO1xuXHRcdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuSU5JVDtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gZG9uJ3QgY3JlYXRlIG1vcmUgb2JqZWN0IFVSTHMgdGhhbiBuZWVkZWRcblx0XHRcdFx0XHRpZiAoIW9iamVjdF91cmwpIHtcblx0XHRcdFx0XHRcdG9iamVjdF91cmwgPSBnZXRfVVJMKCkuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoZm9yY2UpIHtcblx0XHRcdFx0XHRcdHZpZXcubG9jYXRpb24uaHJlZiA9IG9iamVjdF91cmw7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHZhciBvcGVuZWQgPSB2aWV3Lm9wZW4ob2JqZWN0X3VybCwgXCJfYmxhbmtcIik7XG5cdFx0XHRcdFx0XHRpZiAoIW9wZW5lZCkge1xuXHRcdFx0XHRcdFx0XHQvLyBBcHBsZSBkb2VzIG5vdCBhbGxvdyB3aW5kb3cub3Blbiwgc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLmFwcGxlLmNvbS9saWJyYXJ5L3NhZmFyaS9kb2N1bWVudGF0aW9uL1Rvb2xzL0NvbmNlcHR1YWwvU2FmYXJpRXh0ZW5zaW9uR3VpZGUvV29ya2luZ3dpdGhXaW5kb3dzYW5kVGFicy9Xb3JraW5nd2l0aFdpbmRvd3NhbmRUYWJzLmh0bWxcblx0XHRcdFx0XHRcdFx0dmlldy5sb2NhdGlvbi5ocmVmID0gb2JqZWN0X3VybDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZmlsZXNhdmVyLnJlYWR5U3RhdGUgPSBmaWxlc2F2ZXIuRE9ORTtcblx0XHRcdFx0XHRkaXNwYXRjaF9hbGwoKTtcblx0XHRcdFx0XHRyZXZva2Uob2JqZWN0X3VybCk7XG5cdFx0XHRcdH1cblx0XHRcdDtcblx0XHRcdGZpbGVzYXZlci5yZWFkeVN0YXRlID0gZmlsZXNhdmVyLklOSVQ7XG5cblx0XHRcdGlmIChjYW5fdXNlX3NhdmVfbGluaykge1xuXHRcdFx0XHRvYmplY3RfdXJsID0gZ2V0X1VSTCgpLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRzYXZlX2xpbmsuaHJlZiA9IG9iamVjdF91cmw7XG5cdFx0XHRcdFx0c2F2ZV9saW5rLmRvd25sb2FkID0gbmFtZTtcblx0XHRcdFx0XHRjbGljayhzYXZlX2xpbmspO1xuXHRcdFx0XHRcdGRpc3BhdGNoX2FsbCgpO1xuXHRcdFx0XHRcdHJldm9rZShvYmplY3RfdXJsKTtcblx0XHRcdFx0XHRmaWxlc2F2ZXIucmVhZHlTdGF0ZSA9IGZpbGVzYXZlci5ET05FO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRmc19lcnJvcigpO1xuXHRcdH1cblx0XHQsIEZTX3Byb3RvID0gRmlsZVNhdmVyLnByb3RvdHlwZVxuXHRcdCwgc2F2ZUFzID0gZnVuY3Rpb24oYmxvYiwgbmFtZSwgbm9fYXV0b19ib20pIHtcblx0XHRcdHJldHVybiBuZXcgRmlsZVNhdmVyKGJsb2IsIG5hbWUgfHwgYmxvYi5uYW1lIHx8IFwiZG93bmxvYWRcIiwgbm9fYXV0b19ib20pO1xuXHRcdH1cblx0O1xuXHQvLyBJRSAxMCsgKG5hdGl2ZSBzYXZlQXMpXG5cdGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSBcInVuZGVmaW5lZFwiICYmIG5hdmlnYXRvci5tc1NhdmVPck9wZW5CbG9iKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGJsb2IsIG5hbWUsIG5vX2F1dG9fYm9tKSB7XG5cdFx0XHRuYW1lID0gbmFtZSB8fCBibG9iLm5hbWUgfHwgXCJkb3dubG9hZFwiO1xuXG5cdFx0XHRpZiAoIW5vX2F1dG9fYm9tKSB7XG5cdFx0XHRcdGJsb2IgPSBhdXRvX2JvbShibG9iKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBuYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYihibG9iLCBuYW1lKTtcblx0XHR9O1xuXHR9XG5cblx0RlNfcHJvdG8uYWJvcnQgPSBmdW5jdGlvbigpe307XG5cdEZTX3Byb3RvLnJlYWR5U3RhdGUgPSBGU19wcm90by5JTklUID0gMDtcblx0RlNfcHJvdG8uV1JJVElORyA9IDE7XG5cdEZTX3Byb3RvLkRPTkUgPSAyO1xuXG5cdEZTX3Byb3RvLmVycm9yID1cblx0RlNfcHJvdG8ub253cml0ZXN0YXJ0ID1cblx0RlNfcHJvdG8ub25wcm9ncmVzcyA9XG5cdEZTX3Byb3RvLm9ud3JpdGUgPVxuXHRGU19wcm90by5vbmFib3J0ID1cblx0RlNfcHJvdG8ub25lcnJvciA9XG5cdEZTX3Byb3RvLm9ud3JpdGVlbmQgPVxuXHRcdG51bGw7XG5cblx0cmV0dXJuIHNhdmVBcztcbn0oXG5cdCAgIHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiICYmIHNlbGZcblx0fHwgdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3dcblx0fHwgdGhpcy5jb250ZW50XG4pKTtcbi8vIGBzZWxmYCBpcyB1bmRlZmluZWQgaW4gRmlyZWZveCBmb3IgQW5kcm9pZCBjb250ZW50IHNjcmlwdCBjb250ZXh0XG4vLyB3aGlsZSBgdGhpc2AgaXMgbnNJQ29udGVudEZyYW1lTWVzc2FnZU1hbmFnZXJcbi8vIHdpdGggYW4gYXR0cmlidXRlIGBjb250ZW50YCB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSB3aW5kb3dcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09IFwidW5kZWZpbmVkXCIgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgbW9kdWxlLmV4cG9ydHMuc2F2ZUFzID0gc2F2ZUFzO1xufSBlbHNlIGlmICgodHlwZW9mIGRlZmluZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkZWZpbmUgIT09IG51bGwpICYmIChkZWZpbmUuYW1kICE9PSBudWxsKSkge1xuICBkZWZpbmUoXCJGaWxlU2F2ZXIuanNcIiwgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNhdmVBcztcbiAgfSk7XG59XG4iLCIvKiEgaWVlZTc1NC4gQlNELTMtQ2xhdXNlIExpY2Vuc2UuIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZy9vcGVuc291cmNlPiAqL1xuZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSAoZSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSAobSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICgodmFsdWUgKiBjKSAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiLyohXG5cbkpTWmlwIHYzLjcuMSAtIEEgSmF2YVNjcmlwdCBjbGFzcyBmb3IgZ2VuZXJhdGluZyBhbmQgcmVhZGluZyB6aXAgZmlsZXNcbjxodHRwOi8vc3R1YXJ0ay5jb20vanN6aXA+XG5cbihjKSAyMDA5LTIwMTYgU3R1YXJ0IEtuaWdodGxleSA8c3R1YXJ0IFthdF0gc3R1YXJ0ay5jb20+XG5EdWFsIGxpY2VuY2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBvciBHUEx2My4gU2VlIGh0dHBzOi8vcmF3LmdpdGh1Yi5jb20vU3R1ay9qc3ppcC9tYXN0ZXIvTElDRU5TRS5tYXJrZG93bi5cblxuSlNaaXAgdXNlcyB0aGUgbGlicmFyeSBwYWtvIHJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSA6XG5odHRwczovL2dpdGh1Yi5jb20vbm9kZWNhL3Bha28vYmxvYi9tYXN0ZXIvTElDRU5TRVxuKi9cblxuIWZ1bmN0aW9uKHQpe2lmKFwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgbW9kdWxlKW1vZHVsZS5leHBvcnRzPXQoKTtlbHNlIGlmKFwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZClkZWZpbmUoW10sdCk7ZWxzZXsoXCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdz93aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjp0aGlzKS5KU1ppcD10KCl9fShmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbiBzKGEsbyxoKXtmdW5jdGlvbiB1KHIsdCl7aWYoIW9bcl0pe2lmKCFhW3JdKXt2YXIgZT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCF0JiZlKXJldHVybiBlKHIsITApO2lmKGwpcmV0dXJuIGwociwhMCk7dmFyIGk9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIityK1wiJ1wiKTt0aHJvdyBpLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsaX12YXIgbj1vW3JdPXtleHBvcnRzOnt9fTthW3JdWzBdLmNhbGwobi5leHBvcnRzLGZ1bmN0aW9uKHQpe3ZhciBlPWFbcl1bMV1bdF07cmV0dXJuIHUoZXx8dCl9LG4sbi5leHBvcnRzLHMsYSxvLGgpfXJldHVybiBvW3JdLmV4cG9ydHN9Zm9yKHZhciBsPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsdD0wO3Q8aC5sZW5ndGg7dCsrKXUoaFt0XSk7cmV0dXJuIHV9KHsxOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGM9dChcIi4vdXRpbHNcIiksZD10KFwiLi9zdXBwb3J0XCIpLHA9XCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvPVwiO3IuZW5jb2RlPWZ1bmN0aW9uKHQpe2Zvcih2YXIgZSxyLGksbixzLGEsbyxoPVtdLHU9MCxsPXQubGVuZ3RoLGY9bCxkPVwic3RyaW5nXCIhPT1jLmdldFR5cGVPZih0KTt1PHQubGVuZ3RoOylmPWwtdSxpPWQ/KGU9dFt1KytdLHI9dTxsP3RbdSsrXTowLHU8bD90W3UrK106MCk6KGU9dC5jaGFyQ29kZUF0KHUrKykscj11PGw/dC5jaGFyQ29kZUF0KHUrKyk6MCx1PGw/dC5jaGFyQ29kZUF0KHUrKyk6MCksbj1lPj4yLHM9KDMmZSk8PDR8cj4+NCxhPTE8Zj8oMTUmcik8PDJ8aT4+Njo2NCxvPTI8Zj82MyZpOjY0LGgucHVzaChwLmNoYXJBdChuKStwLmNoYXJBdChzKStwLmNoYXJBdChhKStwLmNoYXJBdChvKSk7cmV0dXJuIGguam9pbihcIlwiKX0sci5kZWNvZGU9ZnVuY3Rpb24odCl7dmFyIGUscixpLG4scyxhLG89MCxoPTAsdT1cImRhdGE6XCI7aWYodC5zdWJzdHIoMCx1Lmxlbmd0aCk9PT11KXRocm93IG5ldyBFcnJvcihcIkludmFsaWQgYmFzZTY0IGlucHV0LCBpdCBsb29rcyBsaWtlIGEgZGF0YSB1cmwuXCIpO3ZhciBsLGY9MyoodD10LnJlcGxhY2UoL1teQS1aYS16MC05XFwrXFwvXFw9XS9nLFwiXCIpKS5sZW5ndGgvNDtpZih0LmNoYXJBdCh0Lmxlbmd0aC0xKT09PXAuY2hhckF0KDY0KSYmZi0tLHQuY2hhckF0KHQubGVuZ3RoLTIpPT09cC5jaGFyQXQoNjQpJiZmLS0sZiUxIT0wKXRocm93IG5ldyBFcnJvcihcIkludmFsaWQgYmFzZTY0IGlucHV0LCBiYWQgY29udGVudCBsZW5ndGguXCIpO2ZvcihsPWQudWludDhhcnJheT9uZXcgVWludDhBcnJheSgwfGYpOm5ldyBBcnJheSgwfGYpO288dC5sZW5ndGg7KWU9cC5pbmRleE9mKHQuY2hhckF0KG8rKykpPDwyfChuPXAuaW5kZXhPZih0LmNoYXJBdChvKyspKSk+PjQscj0oMTUmbik8PDR8KHM9cC5pbmRleE9mKHQuY2hhckF0KG8rKykpKT4+MixpPSgzJnMpPDw2fChhPXAuaW5kZXhPZih0LmNoYXJBdChvKyspKSksbFtoKytdPWUsNjQhPT1zJiYobFtoKytdPXIpLDY0IT09YSYmKGxbaCsrXT1pKTtyZXR1cm4gbH19LHtcIi4vc3VwcG9ydFwiOjMwLFwiLi91dGlsc1wiOjMyfV0sMjpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL2V4dGVybmFsXCIpLG49dChcIi4vc3RyZWFtL0RhdGFXb3JrZXJcIikscz10KFwiLi9zdHJlYW0vQ3JjMzJQcm9iZVwiKSxhPXQoXCIuL3N0cmVhbS9EYXRhTGVuZ3RoUHJvYmVcIik7ZnVuY3Rpb24gbyh0LGUscixpLG4pe3RoaXMuY29tcHJlc3NlZFNpemU9dCx0aGlzLnVuY29tcHJlc3NlZFNpemU9ZSx0aGlzLmNyYzMyPXIsdGhpcy5jb21wcmVzc2lvbj1pLHRoaXMuY29tcHJlc3NlZENvbnRlbnQ9bn1vLnByb3RvdHlwZT17Z2V0Q29udGVudFdvcmtlcjpmdW5jdGlvbigpe3ZhciB0PW5ldyBuKGkuUHJvbWlzZS5yZXNvbHZlKHRoaXMuY29tcHJlc3NlZENvbnRlbnQpKS5waXBlKHRoaXMuY29tcHJlc3Npb24udW5jb21wcmVzc1dvcmtlcigpKS5waXBlKG5ldyBhKFwiZGF0YV9sZW5ndGhcIikpLGU9dGhpcztyZXR1cm4gdC5vbihcImVuZFwiLGZ1bmN0aW9uKCl7aWYodGhpcy5zdHJlYW1JbmZvLmRhdGFfbGVuZ3RoIT09ZS51bmNvbXByZXNzZWRTaXplKXRocm93IG5ldyBFcnJvcihcIkJ1ZyA6IHVuY29tcHJlc3NlZCBkYXRhIHNpemUgbWlzbWF0Y2hcIil9KSx0fSxnZXRDb21wcmVzc2VkV29ya2VyOmZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBuKGkuUHJvbWlzZS5yZXNvbHZlKHRoaXMuY29tcHJlc3NlZENvbnRlbnQpKS53aXRoU3RyZWFtSW5mbyhcImNvbXByZXNzZWRTaXplXCIsdGhpcy5jb21wcmVzc2VkU2l6ZSkud2l0aFN0cmVhbUluZm8oXCJ1bmNvbXByZXNzZWRTaXplXCIsdGhpcy51bmNvbXByZXNzZWRTaXplKS53aXRoU3RyZWFtSW5mbyhcImNyYzMyXCIsdGhpcy5jcmMzMikud2l0aFN0cmVhbUluZm8oXCJjb21wcmVzc2lvblwiLHRoaXMuY29tcHJlc3Npb24pfX0sby5jcmVhdGVXb3JrZXJGcm9tPWZ1bmN0aW9uKHQsZSxyKXtyZXR1cm4gdC5waXBlKG5ldyBzKS5waXBlKG5ldyBhKFwidW5jb21wcmVzc2VkU2l6ZVwiKSkucGlwZShlLmNvbXByZXNzV29ya2VyKHIpKS5waXBlKG5ldyBhKFwiY29tcHJlc3NlZFNpemVcIikpLndpdGhTdHJlYW1JbmZvKFwiY29tcHJlc3Npb25cIixlKX0sZS5leHBvcnRzPW99LHtcIi4vZXh0ZXJuYWxcIjo2LFwiLi9zdHJlYW0vQ3JjMzJQcm9iZVwiOjI1LFwiLi9zdHJlYW0vRGF0YUxlbmd0aFByb2JlXCI6MjYsXCIuL3N0cmVhbS9EYXRhV29ya2VyXCI6Mjd9XSwzOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIik7ci5TVE9SRT17bWFnaWM6XCJcXDBcXDBcIixjb21wcmVzc1dvcmtlcjpmdW5jdGlvbih0KXtyZXR1cm4gbmV3IGkoXCJTVE9SRSBjb21wcmVzc2lvblwiKX0sdW5jb21wcmVzc1dvcmtlcjpmdW5jdGlvbigpe3JldHVybiBuZXcgaShcIlNUT1JFIGRlY29tcHJlc3Npb25cIil9fSxyLkRFRkxBVEU9dChcIi4vZmxhdGVcIil9LHtcIi4vZmxhdGVcIjo3LFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiOjI4fV0sNDpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL3V0aWxzXCIpO3ZhciBvPWZ1bmN0aW9uKCl7Zm9yKHZhciB0LGU9W10scj0wO3I8MjU2O3IrKyl7dD1yO2Zvcih2YXIgaT0wO2k8ODtpKyspdD0xJnQ/Mzk4ODI5MjM4NF50Pj4+MTp0Pj4+MTtlW3JdPXR9cmV0dXJuIGV9KCk7ZS5leHBvcnRzPWZ1bmN0aW9uKHQsZSl7cmV0dXJuIHZvaWQgMCE9PXQmJnQubGVuZ3RoP1wic3RyaW5nXCIhPT1pLmdldFR5cGVPZih0KT9mdW5jdGlvbih0LGUscixpKXt2YXIgbj1vLHM9aStyO3RePS0xO2Zvcih2YXIgYT1pO2E8czthKyspdD10Pj4+OF5uWzI1NSYodF5lW2FdKV07cmV0dXJuLTFedH0oMHxlLHQsdC5sZW5ndGgsMCk6ZnVuY3Rpb24odCxlLHIsaSl7dmFyIG49byxzPWkrcjt0Xj0tMTtmb3IodmFyIGE9aTthPHM7YSsrKXQ9dD4+PjheblsyNTUmKHReZS5jaGFyQ29kZUF0KGEpKV07cmV0dXJuLTFedH0oMHxlLHQsdC5sZW5ndGgsMCk6MH19LHtcIi4vdXRpbHNcIjozMn1dLDU6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtyLmJhc2U2ND0hMSxyLmJpbmFyeT0hMSxyLmRpcj0hMSxyLmNyZWF0ZUZvbGRlcnM9ITAsci5kYXRlPW51bGwsci5jb21wcmVzc2lvbj1udWxsLHIuY29tcHJlc3Npb25PcHRpb25zPW51bGwsci5jb21tZW50PW51bGwsci51bml4UGVybWlzc2lvbnM9bnVsbCxyLmRvc1Blcm1pc3Npb25zPW51bGx9LHt9XSw2OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9bnVsbDtpPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBQcm9taXNlP1Byb21pc2U6dChcImxpZVwiKSxlLmV4cG9ydHM9e1Byb21pc2U6aX19LHtsaWU6Mzd9XSw3OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIFVpbnQ4QXJyYXkmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50MTZBcnJheSYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIFVpbnQzMkFycmF5LG49dChcInBha29cIikscz10KFwiLi91dGlsc1wiKSxhPXQoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpLG89aT9cInVpbnQ4YXJyYXlcIjpcImFycmF5XCI7ZnVuY3Rpb24gaCh0LGUpe2EuY2FsbCh0aGlzLFwiRmxhdGVXb3JrZXIvXCIrdCksdGhpcy5fcGFrbz1udWxsLHRoaXMuX3Bha29BY3Rpb249dCx0aGlzLl9wYWtvT3B0aW9ucz1lLHRoaXMubWV0YT17fX1yLm1hZ2ljPVwiXFxiXFwwXCIscy5pbmhlcml0cyhoLGEpLGgucHJvdG90eXBlLnByb2Nlc3NDaHVuaz1mdW5jdGlvbih0KXt0aGlzLm1ldGE9dC5tZXRhLG51bGw9PT10aGlzLl9wYWtvJiZ0aGlzLl9jcmVhdGVQYWtvKCksdGhpcy5fcGFrby5wdXNoKHMudHJhbnNmb3JtVG8obyx0LmRhdGEpLCExKX0saC5wcm90b3R5cGUuZmx1c2g9ZnVuY3Rpb24oKXthLnByb3RvdHlwZS5mbHVzaC5jYWxsKHRoaXMpLG51bGw9PT10aGlzLl9wYWtvJiZ0aGlzLl9jcmVhdGVQYWtvKCksdGhpcy5fcGFrby5wdXNoKFtdLCEwKX0saC5wcm90b3R5cGUuY2xlYW5VcD1mdW5jdGlvbigpe2EucHJvdG90eXBlLmNsZWFuVXAuY2FsbCh0aGlzKSx0aGlzLl9wYWtvPW51bGx9LGgucHJvdG90eXBlLl9jcmVhdGVQYWtvPWZ1bmN0aW9uKCl7dGhpcy5fcGFrbz1uZXcgblt0aGlzLl9wYWtvQWN0aW9uXSh7cmF3OiEwLGxldmVsOnRoaXMuX3Bha29PcHRpb25zLmxldmVsfHwtMX0pO3ZhciBlPXRoaXM7dGhpcy5fcGFrby5vbkRhdGE9ZnVuY3Rpb24odCl7ZS5wdXNoKHtkYXRhOnQsbWV0YTplLm1ldGF9KX19LHIuY29tcHJlc3NXb3JrZXI9ZnVuY3Rpb24odCl7cmV0dXJuIG5ldyBoKFwiRGVmbGF0ZVwiLHQpfSxyLnVuY29tcHJlc3NXb3JrZXI9ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IGgoXCJJbmZsYXRlXCIse30pfX0se1wiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiOjI4LFwiLi91dGlsc1wiOjMyLHBha286Mzh9XSw4OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQSh0LGUpe3ZhciByLGk9XCJcIjtmb3Iocj0wO3I8ZTtyKyspaSs9U3RyaW5nLmZyb21DaGFyQ29kZSgyNTUmdCksdD4+Pj04O3JldHVybiBpfWZ1bmN0aW9uIGkodCxlLHIsaSxuLHMpe3ZhciBhLG8saD10LmZpbGUsdT10LmNvbXByZXNzaW9uLGw9cyE9PU8udXRmOGVuY29kZSxmPUkudHJhbnNmb3JtVG8oXCJzdHJpbmdcIixzKGgubmFtZSkpLGQ9SS50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLE8udXRmOGVuY29kZShoLm5hbWUpKSxjPWguY29tbWVudCxwPUkudHJhbnNmb3JtVG8oXCJzdHJpbmdcIixzKGMpKSxtPUkudHJhbnNmb3JtVG8oXCJzdHJpbmdcIixPLnV0ZjhlbmNvZGUoYykpLF89ZC5sZW5ndGghPT1oLm5hbWUubGVuZ3RoLGc9bS5sZW5ndGghPT1jLmxlbmd0aCxiPVwiXCIsdj1cIlwiLHk9XCJcIix3PWguZGlyLGs9aC5kYXRlLHg9e2NyYzMyOjAsY29tcHJlc3NlZFNpemU6MCx1bmNvbXByZXNzZWRTaXplOjB9O2UmJiFyfHwoeC5jcmMzMj10LmNyYzMyLHguY29tcHJlc3NlZFNpemU9dC5jb21wcmVzc2VkU2l6ZSx4LnVuY29tcHJlc3NlZFNpemU9dC51bmNvbXByZXNzZWRTaXplKTt2YXIgUz0wO2UmJihTfD04KSxsfHwhXyYmIWd8fChTfD0yMDQ4KTt2YXIgej0wLEM9MDt3JiYoenw9MTYpLFwiVU5JWFwiPT09bj8oQz03OTgsenw9ZnVuY3Rpb24odCxlKXt2YXIgcj10O3JldHVybiB0fHwocj1lPzE2ODkzOjMzMjA0KSwoNjU1MzUmcik8PDE2fShoLnVuaXhQZXJtaXNzaW9ucyx3KSk6KEM9MjAsenw9ZnVuY3Rpb24odCl7cmV0dXJuIDYzJih0fHwwKX0oaC5kb3NQZXJtaXNzaW9ucykpLGE9ay5nZXRVVENIb3VycygpLGE8PD02LGF8PWsuZ2V0VVRDTWludXRlcygpLGE8PD01LGF8PWsuZ2V0VVRDU2Vjb25kcygpLzIsbz1rLmdldFVUQ0Z1bGxZZWFyKCktMTk4MCxvPDw9NCxvfD1rLmdldFVUQ01vbnRoKCkrMSxvPDw9NSxvfD1rLmdldFVUQ0RhdGUoKSxfJiYodj1BKDEsMSkrQShCKGYpLDQpK2QsYis9XCJ1cFwiK0Eodi5sZW5ndGgsMikrdiksZyYmKHk9QSgxLDEpK0EoQihwKSw0KSttLGIrPVwidWNcIitBKHkubGVuZ3RoLDIpK3kpO3ZhciBFPVwiXCI7cmV0dXJuIEUrPVwiXFxuXFwwXCIsRSs9QShTLDIpLEUrPXUubWFnaWMsRSs9QShhLDIpLEUrPUEobywyKSxFKz1BKHguY3JjMzIsNCksRSs9QSh4LmNvbXByZXNzZWRTaXplLDQpLEUrPUEoeC51bmNvbXByZXNzZWRTaXplLDQpLEUrPUEoZi5sZW5ndGgsMiksRSs9QShiLmxlbmd0aCwyKSx7ZmlsZVJlY29yZDpSLkxPQ0FMX0ZJTEVfSEVBREVSK0UrZitiLGRpclJlY29yZDpSLkNFTlRSQUxfRklMRV9IRUFERVIrQShDLDIpK0UrQShwLmxlbmd0aCwyKStcIlxcMFxcMFxcMFxcMFwiK0Eoeiw0KStBKGksNCkrZitiK3B9fXZhciBJPXQoXCIuLi91dGlsc1wiKSxuPXQoXCIuLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKSxPPXQoXCIuLi91dGY4XCIpLEI9dChcIi4uL2NyYzMyXCIpLFI9dChcIi4uL3NpZ25hdHVyZVwiKTtmdW5jdGlvbiBzKHQsZSxyLGkpe24uY2FsbCh0aGlzLFwiWmlwRmlsZVdvcmtlclwiKSx0aGlzLmJ5dGVzV3JpdHRlbj0wLHRoaXMuemlwQ29tbWVudD1lLHRoaXMuemlwUGxhdGZvcm09cix0aGlzLmVuY29kZUZpbGVOYW1lPWksdGhpcy5zdHJlYW1GaWxlcz10LHRoaXMuYWNjdW11bGF0ZT0hMSx0aGlzLmNvbnRlbnRCdWZmZXI9W10sdGhpcy5kaXJSZWNvcmRzPVtdLHRoaXMuY3VycmVudFNvdXJjZU9mZnNldD0wLHRoaXMuZW50cmllc0NvdW50PTAsdGhpcy5jdXJyZW50RmlsZT1udWxsLHRoaXMuX3NvdXJjZXM9W119SS5pbmhlcml0cyhzLG4pLHMucHJvdG90eXBlLnB1c2g9ZnVuY3Rpb24odCl7dmFyIGU9dC5tZXRhLnBlcmNlbnR8fDAscj10aGlzLmVudHJpZXNDb3VudCxpPXRoaXMuX3NvdXJjZXMubGVuZ3RoO3RoaXMuYWNjdW11bGF0ZT90aGlzLmNvbnRlbnRCdWZmZXIucHVzaCh0KToodGhpcy5ieXRlc1dyaXR0ZW4rPXQuZGF0YS5sZW5ndGgsbi5wcm90b3R5cGUucHVzaC5jYWxsKHRoaXMse2RhdGE6dC5kYXRhLG1ldGE6e2N1cnJlbnRGaWxlOnRoaXMuY3VycmVudEZpbGUscGVyY2VudDpyPyhlKzEwMCooci1pLTEpKS9yOjEwMH19KSl9LHMucHJvdG90eXBlLm9wZW5lZFNvdXJjZT1mdW5jdGlvbih0KXt0aGlzLmN1cnJlbnRTb3VyY2VPZmZzZXQ9dGhpcy5ieXRlc1dyaXR0ZW4sdGhpcy5jdXJyZW50RmlsZT10LmZpbGUubmFtZTt2YXIgZT10aGlzLnN0cmVhbUZpbGVzJiYhdC5maWxlLmRpcjtpZihlKXt2YXIgcj1pKHQsZSwhMSx0aGlzLmN1cnJlbnRTb3VyY2VPZmZzZXQsdGhpcy56aXBQbGF0Zm9ybSx0aGlzLmVuY29kZUZpbGVOYW1lKTt0aGlzLnB1c2goe2RhdGE6ci5maWxlUmVjb3JkLG1ldGE6e3BlcmNlbnQ6MH19KX1lbHNlIHRoaXMuYWNjdW11bGF0ZT0hMH0scy5wcm90b3R5cGUuY2xvc2VkU291cmNlPWZ1bmN0aW9uKHQpe3RoaXMuYWNjdW11bGF0ZT0hMTt2YXIgZT10aGlzLnN0cmVhbUZpbGVzJiYhdC5maWxlLmRpcixyPWkodCxlLCEwLHRoaXMuY3VycmVudFNvdXJjZU9mZnNldCx0aGlzLnppcFBsYXRmb3JtLHRoaXMuZW5jb2RlRmlsZU5hbWUpO2lmKHRoaXMuZGlyUmVjb3Jkcy5wdXNoKHIuZGlyUmVjb3JkKSxlKXRoaXMucHVzaCh7ZGF0YTpmdW5jdGlvbih0KXtyZXR1cm4gUi5EQVRBX0RFU0NSSVBUT1IrQSh0LmNyYzMyLDQpK0EodC5jb21wcmVzc2VkU2l6ZSw0KStBKHQudW5jb21wcmVzc2VkU2l6ZSw0KX0odCksbWV0YTp7cGVyY2VudDoxMDB9fSk7ZWxzZSBmb3IodGhpcy5wdXNoKHtkYXRhOnIuZmlsZVJlY29yZCxtZXRhOntwZXJjZW50OjB9fSk7dGhpcy5jb250ZW50QnVmZmVyLmxlbmd0aDspdGhpcy5wdXNoKHRoaXMuY29udGVudEJ1ZmZlci5zaGlmdCgpKTt0aGlzLmN1cnJlbnRGaWxlPW51bGx9LHMucHJvdG90eXBlLmZsdXNoPWZ1bmN0aW9uKCl7Zm9yKHZhciB0PXRoaXMuYnl0ZXNXcml0dGVuLGU9MDtlPHRoaXMuZGlyUmVjb3Jkcy5sZW5ndGg7ZSsrKXRoaXMucHVzaCh7ZGF0YTp0aGlzLmRpclJlY29yZHNbZV0sbWV0YTp7cGVyY2VudDoxMDB9fSk7dmFyIHI9dGhpcy5ieXRlc1dyaXR0ZW4tdCxpPWZ1bmN0aW9uKHQsZSxyLGksbil7dmFyIHM9SS50cmFuc2Zvcm1UbyhcInN0cmluZ1wiLG4oaSkpO3JldHVybiBSLkNFTlRSQUxfRElSRUNUT1JZX0VORCtcIlxcMFxcMFxcMFxcMFwiK0EodCwyKStBKHQsMikrQShlLDQpK0Eociw0KStBKHMubGVuZ3RoLDIpK3N9KHRoaXMuZGlyUmVjb3Jkcy5sZW5ndGgscix0LHRoaXMuemlwQ29tbWVudCx0aGlzLmVuY29kZUZpbGVOYW1lKTt0aGlzLnB1c2goe2RhdGE6aSxtZXRhOntwZXJjZW50OjEwMH19KX0scy5wcm90b3R5cGUucHJlcGFyZU5leHRTb3VyY2U9ZnVuY3Rpb24oKXt0aGlzLnByZXZpb3VzPXRoaXMuX3NvdXJjZXMuc2hpZnQoKSx0aGlzLm9wZW5lZFNvdXJjZSh0aGlzLnByZXZpb3VzLnN0cmVhbUluZm8pLHRoaXMuaXNQYXVzZWQ/dGhpcy5wcmV2aW91cy5wYXVzZSgpOnRoaXMucHJldmlvdXMucmVzdW1lKCl9LHMucHJvdG90eXBlLnJlZ2lzdGVyUHJldmlvdXM9ZnVuY3Rpb24odCl7dGhpcy5fc291cmNlcy5wdXNoKHQpO3ZhciBlPXRoaXM7cmV0dXJuIHQub24oXCJkYXRhXCIsZnVuY3Rpb24odCl7ZS5wcm9jZXNzQ2h1bmsodCl9KSx0Lm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtlLmNsb3NlZFNvdXJjZShlLnByZXZpb3VzLnN0cmVhbUluZm8pLGUuX3NvdXJjZXMubGVuZ3RoP2UucHJlcGFyZU5leHRTb3VyY2UoKTplLmVuZCgpfSksdC5vbihcImVycm9yXCIsZnVuY3Rpb24odCl7ZS5lcnJvcih0KX0pLHRoaXN9LHMucHJvdG90eXBlLnJlc3VtZT1mdW5jdGlvbigpe3JldHVybiEhbi5wcm90b3R5cGUucmVzdW1lLmNhbGwodGhpcykmJighdGhpcy5wcmV2aW91cyYmdGhpcy5fc291cmNlcy5sZW5ndGg/KHRoaXMucHJlcGFyZU5leHRTb3VyY2UoKSwhMCk6dGhpcy5wcmV2aW91c3x8dGhpcy5fc291cmNlcy5sZW5ndGh8fHRoaXMuZ2VuZXJhdGVkRXJyb3I/dm9pZCAwOih0aGlzLmVuZCgpLCEwKSl9LHMucHJvdG90eXBlLmVycm9yPWZ1bmN0aW9uKHQpe3ZhciBlPXRoaXMuX3NvdXJjZXM7aWYoIW4ucHJvdG90eXBlLmVycm9yLmNhbGwodGhpcyx0KSlyZXR1cm4hMTtmb3IodmFyIHI9MDtyPGUubGVuZ3RoO3IrKyl0cnl7ZVtyXS5lcnJvcih0KX1jYXRjaCh0KXt9cmV0dXJuITB9LHMucHJvdG90eXBlLmxvY2s9ZnVuY3Rpb24oKXtuLnByb3RvdHlwZS5sb2NrLmNhbGwodGhpcyk7Zm9yKHZhciB0PXRoaXMuX3NvdXJjZXMsZT0wO2U8dC5sZW5ndGg7ZSsrKXRbZV0ubG9jaygpfSxlLmV4cG9ydHM9c30se1wiLi4vY3JjMzJcIjo0LFwiLi4vc2lnbmF0dXJlXCI6MjMsXCIuLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiOjI4LFwiLi4vdXRmOFwiOjMxLFwiLi4vdXRpbHNcIjozMn1dLDk6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgdT10KFwiLi4vY29tcHJlc3Npb25zXCIpLGk9dChcIi4vWmlwRmlsZVdvcmtlclwiKTtyLmdlbmVyYXRlV29ya2VyPWZ1bmN0aW9uKHQsYSxlKXt2YXIgbz1uZXcgaShhLnN0cmVhbUZpbGVzLGUsYS5wbGF0Zm9ybSxhLmVuY29kZUZpbGVOYW1lKSxoPTA7dHJ5e3QuZm9yRWFjaChmdW5jdGlvbih0LGUpe2grKzt2YXIgcj1mdW5jdGlvbih0LGUpe3ZhciByPXR8fGUsaT11W3JdO2lmKCFpKXRocm93IG5ldyBFcnJvcihyK1wiIGlzIG5vdCBhIHZhbGlkIGNvbXByZXNzaW9uIG1ldGhvZCAhXCIpO3JldHVybiBpfShlLm9wdGlvbnMuY29tcHJlc3Npb24sYS5jb21wcmVzc2lvbiksaT1lLm9wdGlvbnMuY29tcHJlc3Npb25PcHRpb25zfHxhLmNvbXByZXNzaW9uT3B0aW9uc3x8e30sbj1lLmRpcixzPWUuZGF0ZTtlLl9jb21wcmVzc1dvcmtlcihyLGkpLndpdGhTdHJlYW1JbmZvKFwiZmlsZVwiLHtuYW1lOnQsZGlyOm4sZGF0ZTpzLGNvbW1lbnQ6ZS5jb21tZW50fHxcIlwiLHVuaXhQZXJtaXNzaW9uczplLnVuaXhQZXJtaXNzaW9ucyxkb3NQZXJtaXNzaW9uczplLmRvc1Blcm1pc3Npb25zfSkucGlwZShvKX0pLG8uZW50cmllc0NvdW50PWh9Y2F0Y2godCl7by5lcnJvcih0KX1yZXR1cm4gb319LHtcIi4uL2NvbXByZXNzaW9uc1wiOjMsXCIuL1ppcEZpbGVXb3JrZXJcIjo4fV0sMTA6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBpKCl7aWYoISh0aGlzIGluc3RhbmNlb2YgaSkpcmV0dXJuIG5ldyBpO2lmKGFyZ3VtZW50cy5sZW5ndGgpdGhyb3cgbmV3IEVycm9yKFwiVGhlIGNvbnN0cnVjdG9yIHdpdGggcGFyYW1ldGVycyBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLlwiKTt0aGlzLmZpbGVzPU9iamVjdC5jcmVhdGUobnVsbCksdGhpcy5jb21tZW50PW51bGwsdGhpcy5yb290PVwiXCIsdGhpcy5jbG9uZT1mdW5jdGlvbigpe3ZhciB0PW5ldyBpO2Zvcih2YXIgZSBpbiB0aGlzKVwiZnVuY3Rpb25cIiE9dHlwZW9mIHRoaXNbZV0mJih0W2VdPXRoaXNbZV0pO3JldHVybiB0fX0oaS5wcm90b3R5cGU9dChcIi4vb2JqZWN0XCIpKS5sb2FkQXN5bmM9dChcIi4vbG9hZFwiKSxpLnN1cHBvcnQ9dChcIi4vc3VwcG9ydFwiKSxpLmRlZmF1bHRzPXQoXCIuL2RlZmF1bHRzXCIpLGkudmVyc2lvbj1cIjMuNy4xXCIsaS5sb2FkQXN5bmM9ZnVuY3Rpb24odCxlKXtyZXR1cm4obmV3IGkpLmxvYWRBc3luYyh0LGUpfSxpLmV4dGVybmFsPXQoXCIuL2V4dGVybmFsXCIpLGUuZXhwb3J0cz1pfSx7XCIuL2RlZmF1bHRzXCI6NSxcIi4vZXh0ZXJuYWxcIjo2LFwiLi9sb2FkXCI6MTEsXCIuL29iamVjdFwiOjE1LFwiLi9zdXBwb3J0XCI6MzB9XSwxMTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL3V0aWxzXCIpLG49dChcIi4vZXh0ZXJuYWxcIiksbz10KFwiLi91dGY4XCIpLGg9dChcIi4vemlwRW50cmllc1wiKSxzPXQoXCIuL3N0cmVhbS9DcmMzMlByb2JlXCIpLHU9dChcIi4vbm9kZWpzVXRpbHNcIik7ZnVuY3Rpb24gbChpKXtyZXR1cm4gbmV3IG4uUHJvbWlzZShmdW5jdGlvbih0LGUpe3ZhciByPWkuZGVjb21wcmVzc2VkLmdldENvbnRlbnRXb3JrZXIoKS5waXBlKG5ldyBzKTtyLm9uKFwiZXJyb3JcIixmdW5jdGlvbih0KXtlKHQpfSkub24oXCJlbmRcIixmdW5jdGlvbigpe3Iuc3RyZWFtSW5mby5jcmMzMiE9PWkuZGVjb21wcmVzc2VkLmNyYzMyP2UobmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcCA6IENSQzMyIG1pc21hdGNoXCIpKTp0KCl9KS5yZXN1bWUoKX0pfWUuZXhwb3J0cz1mdW5jdGlvbih0LHMpe3ZhciBhPXRoaXM7cmV0dXJuIHM9aS5leHRlbmQoc3x8e30se2Jhc2U2NDohMSxjaGVja0NSQzMyOiExLG9wdGltaXplZEJpbmFyeVN0cmluZzohMSxjcmVhdGVGb2xkZXJzOiExLGRlY29kZUZpbGVOYW1lOm8udXRmOGRlY29kZX0pLHUuaXNOb2RlJiZ1LmlzU3RyZWFtKHQpP24uUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKFwiSlNaaXAgY2FuJ3QgYWNjZXB0IGEgc3RyZWFtIHdoZW4gbG9hZGluZyBhIHppcCBmaWxlLlwiKSk6aS5wcmVwYXJlQ29udGVudChcInRoZSBsb2FkZWQgemlwIGZpbGVcIix0LCEwLHMub3B0aW1pemVkQmluYXJ5U3RyaW5nLHMuYmFzZTY0KS50aGVuKGZ1bmN0aW9uKHQpe3ZhciBlPW5ldyBoKHMpO3JldHVybiBlLmxvYWQodCksZX0pLnRoZW4oZnVuY3Rpb24odCl7dmFyIGU9W24uUHJvbWlzZS5yZXNvbHZlKHQpXSxyPXQuZmlsZXM7aWYocy5jaGVja0NSQzMyKWZvcih2YXIgaT0wO2k8ci5sZW5ndGg7aSsrKWUucHVzaChsKHJbaV0pKTtyZXR1cm4gbi5Qcm9taXNlLmFsbChlKX0pLnRoZW4oZnVuY3Rpb24odCl7Zm9yKHZhciBlPXQuc2hpZnQoKSxyPWUuZmlsZXMsaT0wO2k8ci5sZW5ndGg7aSsrKXt2YXIgbj1yW2ldO2EuZmlsZShuLmZpbGVOYW1lU3RyLG4uZGVjb21wcmVzc2VkLHtiaW5hcnk6ITAsb3B0aW1pemVkQmluYXJ5U3RyaW5nOiEwLGRhdGU6bi5kYXRlLGRpcjpuLmRpcixjb21tZW50Om4uZmlsZUNvbW1lbnRTdHIubGVuZ3RoP24uZmlsZUNvbW1lbnRTdHI6bnVsbCx1bml4UGVybWlzc2lvbnM6bi51bml4UGVybWlzc2lvbnMsZG9zUGVybWlzc2lvbnM6bi5kb3NQZXJtaXNzaW9ucyxjcmVhdGVGb2xkZXJzOnMuY3JlYXRlRm9sZGVyc30pfXJldHVybiBlLnppcENvbW1lbnQubGVuZ3RoJiYoYS5jb21tZW50PWUuemlwQ29tbWVudCksYX0pfX0se1wiLi9leHRlcm5hbFwiOjYsXCIuL25vZGVqc1V0aWxzXCI6MTQsXCIuL3N0cmVhbS9DcmMzMlByb2JlXCI6MjUsXCIuL3V0ZjhcIjozMSxcIi4vdXRpbHNcIjozMixcIi4vemlwRW50cmllc1wiOjMzfV0sMTI6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi4vdXRpbHNcIiksbj10KFwiLi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIik7ZnVuY3Rpb24gcyh0LGUpe24uY2FsbCh0aGlzLFwiTm9kZWpzIHN0cmVhbSBpbnB1dCBhZGFwdGVyIGZvciBcIit0KSx0aGlzLl91cHN0cmVhbUVuZGVkPSExLHRoaXMuX2JpbmRTdHJlYW0oZSl9aS5pbmhlcml0cyhzLG4pLHMucHJvdG90eXBlLl9iaW5kU3RyZWFtPWZ1bmN0aW9uKHQpe3ZhciBlPXRoaXM7KHRoaXMuX3N0cmVhbT10KS5wYXVzZSgpLHQub24oXCJkYXRhXCIsZnVuY3Rpb24odCl7ZS5wdXNoKHtkYXRhOnQsbWV0YTp7cGVyY2VudDowfX0pfSkub24oXCJlcnJvclwiLGZ1bmN0aW9uKHQpe2UuaXNQYXVzZWQ/dGhpcy5nZW5lcmF0ZWRFcnJvcj10OmUuZXJyb3IodCl9KS5vbihcImVuZFwiLGZ1bmN0aW9uKCl7ZS5pc1BhdXNlZD9lLl91cHN0cmVhbUVuZGVkPSEwOmUuZW5kKCl9KX0scy5wcm90b3R5cGUucGF1c2U9ZnVuY3Rpb24oKXtyZXR1cm4hIW4ucHJvdG90eXBlLnBhdXNlLmNhbGwodGhpcykmJih0aGlzLl9zdHJlYW0ucGF1c2UoKSwhMCl9LHMucHJvdG90eXBlLnJlc3VtZT1mdW5jdGlvbigpe3JldHVybiEhbi5wcm90b3R5cGUucmVzdW1lLmNhbGwodGhpcykmJih0aGlzLl91cHN0cmVhbUVuZGVkP3RoaXMuZW5kKCk6dGhpcy5fc3RyZWFtLnJlc3VtZSgpLCEwKX0sZS5leHBvcnRzPXN9LHtcIi4uL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuLi91dGlsc1wiOjMyfV0sMTM6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbj10KFwicmVhZGFibGUtc3RyZWFtXCIpLlJlYWRhYmxlO2Z1bmN0aW9uIGkodCxlLHIpe24uY2FsbCh0aGlzLGUpLHRoaXMuX2hlbHBlcj10O3ZhciBpPXRoaXM7dC5vbihcImRhdGFcIixmdW5jdGlvbih0LGUpe2kucHVzaCh0KXx8aS5faGVscGVyLnBhdXNlKCksciYmcihlKX0pLm9uKFwiZXJyb3JcIixmdW5jdGlvbih0KXtpLmVtaXQoXCJlcnJvclwiLHQpfSkub24oXCJlbmRcIixmdW5jdGlvbigpe2kucHVzaChudWxsKX0pfXQoXCIuLi91dGlsc1wiKS5pbmhlcml0cyhpLG4pLGkucHJvdG90eXBlLl9yZWFkPWZ1bmN0aW9uKCl7dGhpcy5faGVscGVyLnJlc3VtZSgpfSxlLmV4cG9ydHM9aX0se1wiLi4vdXRpbHNcIjozMixcInJlYWRhYmxlLXN0cmVhbVwiOjE2fV0sMTQ6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtlLmV4cG9ydHM9e2lzTm9kZTpcInVuZGVmaW5lZFwiIT10eXBlb2YgQnVmZmVyLG5ld0J1ZmZlckZyb206ZnVuY3Rpb24odCxlKXtpZihCdWZmZXIuZnJvbSYmQnVmZmVyLmZyb20hPT1VaW50OEFycmF5LmZyb20pcmV0dXJuIEJ1ZmZlci5mcm9tKHQsZSk7aWYoXCJudW1iZXJcIj09dHlwZW9mIHQpdGhyb3cgbmV3IEVycm9yKCdUaGUgXCJkYXRhXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgYSBudW1iZXInKTtyZXR1cm4gbmV3IEJ1ZmZlcih0LGUpfSxhbGxvY0J1ZmZlcjpmdW5jdGlvbih0KXtpZihCdWZmZXIuYWxsb2MpcmV0dXJuIEJ1ZmZlci5hbGxvYyh0KTt2YXIgZT1uZXcgQnVmZmVyKHQpO3JldHVybiBlLmZpbGwoMCksZX0saXNCdWZmZXI6ZnVuY3Rpb24odCl7cmV0dXJuIEJ1ZmZlci5pc0J1ZmZlcih0KX0saXNTdHJlYW06ZnVuY3Rpb24odCl7cmV0dXJuIHQmJlwiZnVuY3Rpb25cIj09dHlwZW9mIHQub24mJlwiZnVuY3Rpb25cIj09dHlwZW9mIHQucGF1c2UmJlwiZnVuY3Rpb25cIj09dHlwZW9mIHQucmVzdW1lfX19LHt9XSwxNTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHModCxlLHIpe3ZhciBpLG49dS5nZXRUeXBlT2YoZSkscz11LmV4dGVuZChyfHx7fSxmKTtzLmRhdGU9cy5kYXRlfHxuZXcgRGF0ZSxudWxsIT09cy5jb21wcmVzc2lvbiYmKHMuY29tcHJlc3Npb249cy5jb21wcmVzc2lvbi50b1VwcGVyQ2FzZSgpKSxcInN0cmluZ1wiPT10eXBlb2Ygcy51bml4UGVybWlzc2lvbnMmJihzLnVuaXhQZXJtaXNzaW9ucz1wYXJzZUludChzLnVuaXhQZXJtaXNzaW9ucyw4KSkscy51bml4UGVybWlzc2lvbnMmJjE2Mzg0JnMudW5peFBlcm1pc3Npb25zJiYocy5kaXI9ITApLHMuZG9zUGVybWlzc2lvbnMmJjE2JnMuZG9zUGVybWlzc2lvbnMmJihzLmRpcj0hMCkscy5kaXImJih0PWcodCkpLHMuY3JlYXRlRm9sZGVycyYmKGk9Xyh0KSkmJmIuY2FsbCh0aGlzLGksITApO3ZhciBhPVwic3RyaW5nXCI9PT1uJiYhMT09PXMuYmluYXJ5JiYhMT09PXMuYmFzZTY0O3ImJnZvaWQgMCE9PXIuYmluYXJ5fHwocy5iaW5hcnk9IWEpLChlIGluc3RhbmNlb2YgZCYmMD09PWUudW5jb21wcmVzc2VkU2l6ZXx8cy5kaXJ8fCFlfHwwPT09ZS5sZW5ndGgpJiYocy5iYXNlNjQ9ITEscy5iaW5hcnk9ITAsZT1cIlwiLHMuY29tcHJlc3Npb249XCJTVE9SRVwiLG49XCJzdHJpbmdcIik7dmFyIG89bnVsbDtvPWUgaW5zdGFuY2VvZiBkfHxlIGluc3RhbmNlb2YgbD9lOnAuaXNOb2RlJiZwLmlzU3RyZWFtKGUpP25ldyBtKHQsZSk6dS5wcmVwYXJlQ29udGVudCh0LGUscy5iaW5hcnkscy5vcHRpbWl6ZWRCaW5hcnlTdHJpbmcscy5iYXNlNjQpO3ZhciBoPW5ldyBjKHQsbyxzKTt0aGlzLmZpbGVzW3RdPWh9dmFyIG49dChcIi4vdXRmOFwiKSx1PXQoXCIuL3V0aWxzXCIpLGw9dChcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIiksYT10KFwiLi9zdHJlYW0vU3RyZWFtSGVscGVyXCIpLGY9dChcIi4vZGVmYXVsdHNcIiksZD10KFwiLi9jb21wcmVzc2VkT2JqZWN0XCIpLGM9dChcIi4vemlwT2JqZWN0XCIpLG89dChcIi4vZ2VuZXJhdGVcIikscD10KFwiLi9ub2RlanNVdGlsc1wiKSxtPXQoXCIuL25vZGVqcy9Ob2RlanNTdHJlYW1JbnB1dEFkYXB0ZXJcIiksXz1mdW5jdGlvbih0KXtcIi9cIj09PXQuc2xpY2UoLTEpJiYodD10LnN1YnN0cmluZygwLHQubGVuZ3RoLTEpKTt2YXIgZT10Lmxhc3RJbmRleE9mKFwiL1wiKTtyZXR1cm4gMDxlP3Quc3Vic3RyaW5nKDAsZSk6XCJcIn0sZz1mdW5jdGlvbih0KXtyZXR1cm5cIi9cIiE9PXQuc2xpY2UoLTEpJiYodCs9XCIvXCIpLHR9LGI9ZnVuY3Rpb24odCxlKXtyZXR1cm4gZT12b2lkIDAhPT1lP2U6Zi5jcmVhdGVGb2xkZXJzLHQ9Zyh0KSx0aGlzLmZpbGVzW3RdfHxzLmNhbGwodGhpcyx0LG51bGwse2RpcjohMCxjcmVhdGVGb2xkZXJzOmV9KSx0aGlzLmZpbGVzW3RdfTtmdW5jdGlvbiBoKHQpe3JldHVyblwiW29iamVjdCBSZWdFeHBdXCI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodCl9dmFyIGk9e2xvYWQ6ZnVuY3Rpb24oKXt0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIG1ldGhvZCBoYXMgYmVlbiByZW1vdmVkIGluIEpTWmlwIDMuMCwgcGxlYXNlIGNoZWNrIHRoZSB1cGdyYWRlIGd1aWRlLlwiKX0sZm9yRWFjaDpmdW5jdGlvbih0KXt2YXIgZSxyLGk7Zm9yKGUgaW4gdGhpcy5maWxlcylpPXRoaXMuZmlsZXNbZV0sKHI9ZS5zbGljZSh0aGlzLnJvb3QubGVuZ3RoLGUubGVuZ3RoKSkmJmUuc2xpY2UoMCx0aGlzLnJvb3QubGVuZ3RoKT09PXRoaXMucm9vdCYmdChyLGkpfSxmaWx0ZXI6ZnVuY3Rpb24ocil7dmFyIGk9W107cmV0dXJuIHRoaXMuZm9yRWFjaChmdW5jdGlvbih0LGUpe3IodCxlKSYmaS5wdXNoKGUpfSksaX0sZmlsZTpmdW5jdGlvbih0LGUscil7aWYoMSE9PWFyZ3VtZW50cy5sZW5ndGgpcmV0dXJuIHQ9dGhpcy5yb290K3Qscy5jYWxsKHRoaXMsdCxlLHIpLHRoaXM7aWYoaCh0KSl7dmFyIGk9dDtyZXR1cm4gdGhpcy5maWx0ZXIoZnVuY3Rpb24odCxlKXtyZXR1cm4hZS5kaXImJmkudGVzdCh0KX0pfXZhciBuPXRoaXMuZmlsZXNbdGhpcy5yb290K3RdO3JldHVybiBuJiYhbi5kaXI/bjpudWxsfSxmb2xkZXI6ZnVuY3Rpb24ocil7aWYoIXIpcmV0dXJuIHRoaXM7aWYoaChyKSlyZXR1cm4gdGhpcy5maWx0ZXIoZnVuY3Rpb24odCxlKXtyZXR1cm4gZS5kaXImJnIudGVzdCh0KX0pO3ZhciB0PXRoaXMucm9vdCtyLGU9Yi5jYWxsKHRoaXMsdCksaT10aGlzLmNsb25lKCk7cmV0dXJuIGkucm9vdD1lLm5hbWUsaX0scmVtb3ZlOmZ1bmN0aW9uKHIpe3I9dGhpcy5yb290K3I7dmFyIHQ9dGhpcy5maWxlc1tyXTtpZih0fHwoXCIvXCIhPT1yLnNsaWNlKC0xKSYmKHIrPVwiL1wiKSx0PXRoaXMuZmlsZXNbcl0pLHQmJiF0LmRpcilkZWxldGUgdGhpcy5maWxlc1tyXTtlbHNlIGZvcih2YXIgZT10aGlzLmZpbHRlcihmdW5jdGlvbih0LGUpe3JldHVybiBlLm5hbWUuc2xpY2UoMCxyLmxlbmd0aCk9PT1yfSksaT0wO2k8ZS5sZW5ndGg7aSsrKWRlbGV0ZSB0aGlzLmZpbGVzW2VbaV0ubmFtZV07cmV0dXJuIHRoaXN9LGdlbmVyYXRlOmZ1bmN0aW9uKHQpe3Rocm93IG5ldyBFcnJvcihcIlRoaXMgbWV0aG9kIGhhcyBiZWVuIHJlbW92ZWQgaW4gSlNaaXAgMy4wLCBwbGVhc2UgY2hlY2sgdGhlIHVwZ3JhZGUgZ3VpZGUuXCIpfSxnZW5lcmF0ZUludGVybmFsU3RyZWFtOmZ1bmN0aW9uKHQpe3ZhciBlLHI9e307dHJ5e2lmKChyPXUuZXh0ZW5kKHR8fHt9LHtzdHJlYW1GaWxlczohMSxjb21wcmVzc2lvbjpcIlNUT1JFXCIsY29tcHJlc3Npb25PcHRpb25zOm51bGwsdHlwZTpcIlwiLHBsYXRmb3JtOlwiRE9TXCIsY29tbWVudDpudWxsLG1pbWVUeXBlOlwiYXBwbGljYXRpb24vemlwXCIsZW5jb2RlRmlsZU5hbWU6bi51dGY4ZW5jb2RlfSkpLnR5cGU9ci50eXBlLnRvTG93ZXJDYXNlKCksci5jb21wcmVzc2lvbj1yLmNvbXByZXNzaW9uLnRvVXBwZXJDYXNlKCksXCJiaW5hcnlzdHJpbmdcIj09PXIudHlwZSYmKHIudHlwZT1cInN0cmluZ1wiKSwhci50eXBlKXRocm93IG5ldyBFcnJvcihcIk5vIG91dHB1dCB0eXBlIHNwZWNpZmllZC5cIik7dS5jaGVja1N1cHBvcnQoci50eXBlKSxcImRhcndpblwiIT09ci5wbGF0Zm9ybSYmXCJmcmVlYnNkXCIhPT1yLnBsYXRmb3JtJiZcImxpbnV4XCIhPT1yLnBsYXRmb3JtJiZcInN1bm9zXCIhPT1yLnBsYXRmb3JtfHwoci5wbGF0Zm9ybT1cIlVOSVhcIiksXCJ3aW4zMlwiPT09ci5wbGF0Zm9ybSYmKHIucGxhdGZvcm09XCJET1NcIik7dmFyIGk9ci5jb21tZW50fHx0aGlzLmNvbW1lbnR8fFwiXCI7ZT1vLmdlbmVyYXRlV29ya2VyKHRoaXMscixpKX1jYXRjaCh0KXsoZT1uZXcgbChcImVycm9yXCIpKS5lcnJvcih0KX1yZXR1cm4gbmV3IGEoZSxyLnR5cGV8fFwic3RyaW5nXCIsci5taW1lVHlwZSl9LGdlbmVyYXRlQXN5bmM6ZnVuY3Rpb24odCxlKXtyZXR1cm4gdGhpcy5nZW5lcmF0ZUludGVybmFsU3RyZWFtKHQpLmFjY3VtdWxhdGUoZSl9LGdlbmVyYXRlTm9kZVN0cmVhbTpmdW5jdGlvbih0LGUpe3JldHVybih0PXR8fHt9KS50eXBlfHwodC50eXBlPVwibm9kZWJ1ZmZlclwiKSx0aGlzLmdlbmVyYXRlSW50ZXJuYWxTdHJlYW0odCkudG9Ob2RlanNTdHJlYW0oZSl9fTtlLmV4cG9ydHM9aX0se1wiLi9jb21wcmVzc2VkT2JqZWN0XCI6MixcIi4vZGVmYXVsdHNcIjo1LFwiLi9nZW5lcmF0ZVwiOjksXCIuL25vZGVqcy9Ob2RlanNTdHJlYW1JbnB1dEFkYXB0ZXJcIjoxMixcIi4vbm9kZWpzVXRpbHNcIjoxNCxcIi4vc3RyZWFtL0dlbmVyaWNXb3JrZXJcIjoyOCxcIi4vc3RyZWFtL1N0cmVhbUhlbHBlclwiOjI5LFwiLi91dGY4XCI6MzEsXCIuL3V0aWxzXCI6MzIsXCIuL3ppcE9iamVjdFwiOjM1fV0sMTY6W2Z1bmN0aW9uKHQsZSxyKXtlLmV4cG9ydHM9dChcInN0cmVhbVwiKX0se3N0cmVhbTp2b2lkIDB9XSwxNzpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuL0RhdGFSZWFkZXJcIik7ZnVuY3Rpb24gbih0KXtpLmNhbGwodGhpcyx0KTtmb3IodmFyIGU9MDtlPHRoaXMuZGF0YS5sZW5ndGg7ZSsrKXRbZV09MjU1JnRbZV19dChcIi4uL3V0aWxzXCIpLmluaGVyaXRzKG4saSksbi5wcm90b3R5cGUuYnl0ZUF0PWZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLmRhdGFbdGhpcy56ZXJvK3RdfSxuLnByb3RvdHlwZS5sYXN0SW5kZXhPZlNpZ25hdHVyZT1mdW5jdGlvbih0KXtmb3IodmFyIGU9dC5jaGFyQ29kZUF0KDApLHI9dC5jaGFyQ29kZUF0KDEpLGk9dC5jaGFyQ29kZUF0KDIpLG49dC5jaGFyQ29kZUF0KDMpLHM9dGhpcy5sZW5ndGgtNDswPD1zOy0tcylpZih0aGlzLmRhdGFbc109PT1lJiZ0aGlzLmRhdGFbcysxXT09PXImJnRoaXMuZGF0YVtzKzJdPT09aSYmdGhpcy5kYXRhW3MrM109PT1uKXJldHVybiBzLXRoaXMuemVybztyZXR1cm4tMX0sbi5wcm90b3R5cGUucmVhZEFuZENoZWNrU2lnbmF0dXJlPWZ1bmN0aW9uKHQpe3ZhciBlPXQuY2hhckNvZGVBdCgwKSxyPXQuY2hhckNvZGVBdCgxKSxpPXQuY2hhckNvZGVBdCgyKSxuPXQuY2hhckNvZGVBdCgzKSxzPXRoaXMucmVhZERhdGEoNCk7cmV0dXJuIGU9PT1zWzBdJiZyPT09c1sxXSYmaT09PXNbMl0mJm49PT1zWzNdfSxuLnByb3RvdHlwZS5yZWFkRGF0YT1mdW5jdGlvbih0KXtpZih0aGlzLmNoZWNrT2Zmc2V0KHQpLDA9PT10KXJldHVybltdO3ZhciBlPXRoaXMuZGF0YS5zbGljZSh0aGlzLnplcm8rdGhpcy5pbmRleCx0aGlzLnplcm8rdGhpcy5pbmRleCt0KTtyZXR1cm4gdGhpcy5pbmRleCs9dCxlfSxlLmV4cG9ydHM9bn0se1wiLi4vdXRpbHNcIjozMixcIi4vRGF0YVJlYWRlclwiOjE4fV0sMTg6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi4vdXRpbHNcIik7ZnVuY3Rpb24gbih0KXt0aGlzLmRhdGE9dCx0aGlzLmxlbmd0aD10Lmxlbmd0aCx0aGlzLmluZGV4PTAsdGhpcy56ZXJvPTB9bi5wcm90b3R5cGU9e2NoZWNrT2Zmc2V0OmZ1bmN0aW9uKHQpe3RoaXMuY2hlY2tJbmRleCh0aGlzLmluZGV4K3QpfSxjaGVja0luZGV4OmZ1bmN0aW9uKHQpe2lmKHRoaXMubGVuZ3RoPHRoaXMuemVybyt0fHx0PDApdGhyb3cgbmV3IEVycm9yKFwiRW5kIG9mIGRhdGEgcmVhY2hlZCAoZGF0YSBsZW5ndGggPSBcIit0aGlzLmxlbmd0aCtcIiwgYXNrZWQgaW5kZXggPSBcIit0K1wiKS4gQ29ycnVwdGVkIHppcCA/XCIpfSxzZXRJbmRleDpmdW5jdGlvbih0KXt0aGlzLmNoZWNrSW5kZXgodCksdGhpcy5pbmRleD10fSxza2lwOmZ1bmN0aW9uKHQpe3RoaXMuc2V0SW5kZXgodGhpcy5pbmRleCt0KX0sYnl0ZUF0OmZ1bmN0aW9uKHQpe30scmVhZEludDpmdW5jdGlvbih0KXt2YXIgZSxyPTA7Zm9yKHRoaXMuY2hlY2tPZmZzZXQodCksZT10aGlzLmluZGV4K3QtMTtlPj10aGlzLmluZGV4O2UtLSlyPShyPDw4KSt0aGlzLmJ5dGVBdChlKTtyZXR1cm4gdGhpcy5pbmRleCs9dCxyfSxyZWFkU3RyaW5nOmZ1bmN0aW9uKHQpe3JldHVybiBpLnRyYW5zZm9ybVRvKFwic3RyaW5nXCIsdGhpcy5yZWFkRGF0YSh0KSl9LHJlYWREYXRhOmZ1bmN0aW9uKHQpe30sbGFzdEluZGV4T2ZTaWduYXR1cmU6ZnVuY3Rpb24odCl7fSxyZWFkQW5kQ2hlY2tTaWduYXR1cmU6ZnVuY3Rpb24odCl7fSxyZWFkRGF0ZTpmdW5jdGlvbigpe3ZhciB0PXRoaXMucmVhZEludCg0KTtyZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoMTk4MCsodD4+MjUmMTI3KSwodD4+MjEmMTUpLTEsdD4+MTYmMzEsdD4+MTEmMzEsdD4+NSY2MywoMzEmdCk8PDEpKX19LGUuZXhwb3J0cz1ufSx7XCIuLi91dGlsc1wiOjMyfV0sMTk6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT10KFwiLi9VaW50OEFycmF5UmVhZGVyXCIpO2Z1bmN0aW9uIG4odCl7aS5jYWxsKHRoaXMsdCl9dChcIi4uL3V0aWxzXCIpLmluaGVyaXRzKG4saSksbi5wcm90b3R5cGUucmVhZERhdGE9ZnVuY3Rpb24odCl7dGhpcy5jaGVja09mZnNldCh0KTt2YXIgZT10aGlzLmRhdGEuc2xpY2UodGhpcy56ZXJvK3RoaXMuaW5kZXgsdGhpcy56ZXJvK3RoaXMuaW5kZXgrdCk7cmV0dXJuIHRoaXMuaW5kZXgrPXQsZX0sZS5leHBvcnRzPW59LHtcIi4uL3V0aWxzXCI6MzIsXCIuL1VpbnQ4QXJyYXlSZWFkZXJcIjoyMX1dLDIwOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vRGF0YVJlYWRlclwiKTtmdW5jdGlvbiBuKHQpe2kuY2FsbCh0aGlzLHQpfXQoXCIuLi91dGlsc1wiKS5pbmhlcml0cyhuLGkpLG4ucHJvdG90eXBlLmJ5dGVBdD1mdW5jdGlvbih0KXtyZXR1cm4gdGhpcy5kYXRhLmNoYXJDb2RlQXQodGhpcy56ZXJvK3QpfSxuLnByb3RvdHlwZS5sYXN0SW5kZXhPZlNpZ25hdHVyZT1mdW5jdGlvbih0KXtyZXR1cm4gdGhpcy5kYXRhLmxhc3RJbmRleE9mKHQpLXRoaXMuemVyb30sbi5wcm90b3R5cGUucmVhZEFuZENoZWNrU2lnbmF0dXJlPWZ1bmN0aW9uKHQpe3JldHVybiB0PT09dGhpcy5yZWFkRGF0YSg0KX0sbi5wcm90b3R5cGUucmVhZERhdGE9ZnVuY3Rpb24odCl7dGhpcy5jaGVja09mZnNldCh0KTt2YXIgZT10aGlzLmRhdGEuc2xpY2UodGhpcy56ZXJvK3RoaXMuaW5kZXgsdGhpcy56ZXJvK3RoaXMuaW5kZXgrdCk7cmV0dXJuIHRoaXMuaW5kZXgrPXQsZX0sZS5leHBvcnRzPW59LHtcIi4uL3V0aWxzXCI6MzIsXCIuL0RhdGFSZWFkZXJcIjoxOH1dLDIxOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vQXJyYXlSZWFkZXJcIik7ZnVuY3Rpb24gbih0KXtpLmNhbGwodGhpcyx0KX10KFwiLi4vdXRpbHNcIikuaW5oZXJpdHMobixpKSxuLnByb3RvdHlwZS5yZWFkRGF0YT1mdW5jdGlvbih0KXtpZih0aGlzLmNoZWNrT2Zmc2V0KHQpLDA9PT10KXJldHVybiBuZXcgVWludDhBcnJheSgwKTt2YXIgZT10aGlzLmRhdGEuc3ViYXJyYXkodGhpcy56ZXJvK3RoaXMuaW5kZXgsdGhpcy56ZXJvK3RoaXMuaW5kZXgrdCk7cmV0dXJuIHRoaXMuaW5kZXgrPXQsZX0sZS5leHBvcnRzPW59LHtcIi4uL3V0aWxzXCI6MzIsXCIuL0FycmF5UmVhZGVyXCI6MTd9XSwyMjpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuLi91dGlsc1wiKSxuPXQoXCIuLi9zdXBwb3J0XCIpLHM9dChcIi4vQXJyYXlSZWFkZXJcIiksYT10KFwiLi9TdHJpbmdSZWFkZXJcIiksbz10KFwiLi9Ob2RlQnVmZmVyUmVhZGVyXCIpLGg9dChcIi4vVWludDhBcnJheVJlYWRlclwiKTtlLmV4cG9ydHM9ZnVuY3Rpb24odCl7dmFyIGU9aS5nZXRUeXBlT2YodCk7cmV0dXJuIGkuY2hlY2tTdXBwb3J0KGUpLFwic3RyaW5nXCIhPT1lfHxuLnVpbnQ4YXJyYXk/XCJub2RlYnVmZmVyXCI9PT1lP25ldyBvKHQpOm4udWludDhhcnJheT9uZXcgaChpLnRyYW5zZm9ybVRvKFwidWludDhhcnJheVwiLHQpKTpuZXcgcyhpLnRyYW5zZm9ybVRvKFwiYXJyYXlcIix0KSk6bmV3IGEodCl9fSx7XCIuLi9zdXBwb3J0XCI6MzAsXCIuLi91dGlsc1wiOjMyLFwiLi9BcnJheVJlYWRlclwiOjE3LFwiLi9Ob2RlQnVmZmVyUmVhZGVyXCI6MTksXCIuL1N0cmluZ1JlYWRlclwiOjIwLFwiLi9VaW50OEFycmF5UmVhZGVyXCI6MjF9XSwyMzpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3IuTE9DQUxfRklMRV9IRUFERVI9XCJQS1x1MDAwM1x1MDAwNFwiLHIuQ0VOVFJBTF9GSUxFX0hFQURFUj1cIlBLXHUwMDAxXHUwMDAyXCIsci5DRU5UUkFMX0RJUkVDVE9SWV9FTkQ9XCJQS1x1MDAwNVx1MDAwNlwiLHIuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfTE9DQVRPUj1cIlBLXHUwMDA2XHUwMDA3XCIsci5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9FTkQ9XCJQS1x1MDAwNlx1MDAwNlwiLHIuREFUQV9ERVNDUklQVE9SPVwiUEtcdTAwMDdcXGJcIn0se31dLDI0OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vR2VuZXJpY1dvcmtlclwiKSxuPXQoXCIuLi91dGlsc1wiKTtmdW5jdGlvbiBzKHQpe2kuY2FsbCh0aGlzLFwiQ29udmVydFdvcmtlciB0byBcIit0KSx0aGlzLmRlc3RUeXBlPXR9bi5pbmhlcml0cyhzLGkpLHMucHJvdG90eXBlLnByb2Nlc3NDaHVuaz1mdW5jdGlvbih0KXt0aGlzLnB1c2goe2RhdGE6bi50cmFuc2Zvcm1Ubyh0aGlzLmRlc3RUeXBlLHQuZGF0YSksbWV0YTp0Lm1ldGF9KX0sZS5leHBvcnRzPXN9LHtcIi4uL3V0aWxzXCI6MzIsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDI1OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vR2VuZXJpY1dvcmtlclwiKSxuPXQoXCIuLi9jcmMzMlwiKTtmdW5jdGlvbiBzKCl7aS5jYWxsKHRoaXMsXCJDcmMzMlByb2JlXCIpLHRoaXMud2l0aFN0cmVhbUluZm8oXCJjcmMzMlwiLDApfXQoXCIuLi91dGlsc1wiKS5pbmhlcml0cyhzLGkpLHMucHJvdG90eXBlLnByb2Nlc3NDaHVuaz1mdW5jdGlvbih0KXt0aGlzLnN0cmVhbUluZm8uY3JjMzI9bih0LmRhdGEsdGhpcy5zdHJlYW1JbmZvLmNyYzMyfHwwKSx0aGlzLnB1c2godCl9LGUuZXhwb3J0cz1zfSx7XCIuLi9jcmMzMlwiOjQsXCIuLi91dGlsc1wiOjMyLFwiLi9HZW5lcmljV29ya2VyXCI6Mjh9XSwyNjpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuLi91dGlsc1wiKSxuPXQoXCIuL0dlbmVyaWNXb3JrZXJcIik7ZnVuY3Rpb24gcyh0KXtuLmNhbGwodGhpcyxcIkRhdGFMZW5ndGhQcm9iZSBmb3IgXCIrdCksdGhpcy5wcm9wTmFtZT10LHRoaXMud2l0aFN0cmVhbUluZm8odCwwKX1pLmluaGVyaXRzKHMsbikscy5wcm90b3R5cGUucHJvY2Vzc0NodW5rPWZ1bmN0aW9uKHQpe2lmKHQpe3ZhciBlPXRoaXMuc3RyZWFtSW5mb1t0aGlzLnByb3BOYW1lXXx8MDt0aGlzLnN0cmVhbUluZm9bdGhpcy5wcm9wTmFtZV09ZSt0LmRhdGEubGVuZ3RofW4ucHJvdG90eXBlLnByb2Nlc3NDaHVuay5jYWxsKHRoaXMsdCl9LGUuZXhwb3J0cz1zfSx7XCIuLi91dGlsc1wiOjMyLFwiLi9HZW5lcmljV29ya2VyXCI6Mjh9XSwyNzpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPXQoXCIuLi91dGlsc1wiKSxuPXQoXCIuL0dlbmVyaWNXb3JrZXJcIik7ZnVuY3Rpb24gcyh0KXtuLmNhbGwodGhpcyxcIkRhdGFXb3JrZXJcIik7dmFyIGU9dGhpczt0aGlzLmRhdGFJc1JlYWR5PSExLHRoaXMuaW5kZXg9MCx0aGlzLm1heD0wLHRoaXMuZGF0YT1udWxsLHRoaXMudHlwZT1cIlwiLHRoaXMuX3RpY2tTY2hlZHVsZWQ9ITEsdC50aGVuKGZ1bmN0aW9uKHQpe2UuZGF0YUlzUmVhZHk9ITAsZS5kYXRhPXQsZS5tYXg9dCYmdC5sZW5ndGh8fDAsZS50eXBlPWkuZ2V0VHlwZU9mKHQpLGUuaXNQYXVzZWR8fGUuX3RpY2tBbmRSZXBlYXQoKX0sZnVuY3Rpb24odCl7ZS5lcnJvcih0KX0pfWkuaW5oZXJpdHMocyxuKSxzLnByb3RvdHlwZS5jbGVhblVwPWZ1bmN0aW9uKCl7bi5wcm90b3R5cGUuY2xlYW5VcC5jYWxsKHRoaXMpLHRoaXMuZGF0YT1udWxsfSxzLnByb3RvdHlwZS5yZXN1bWU9ZnVuY3Rpb24oKXtyZXR1cm4hIW4ucHJvdG90eXBlLnJlc3VtZS5jYWxsKHRoaXMpJiYoIXRoaXMuX3RpY2tTY2hlZHVsZWQmJnRoaXMuZGF0YUlzUmVhZHkmJih0aGlzLl90aWNrU2NoZWR1bGVkPSEwLGkuZGVsYXkodGhpcy5fdGlja0FuZFJlcGVhdCxbXSx0aGlzKSksITApfSxzLnByb3RvdHlwZS5fdGlja0FuZFJlcGVhdD1mdW5jdGlvbigpe3RoaXMuX3RpY2tTY2hlZHVsZWQ9ITEsdGhpcy5pc1BhdXNlZHx8dGhpcy5pc0ZpbmlzaGVkfHwodGhpcy5fdGljaygpLHRoaXMuaXNGaW5pc2hlZHx8KGkuZGVsYXkodGhpcy5fdGlja0FuZFJlcGVhdCxbXSx0aGlzKSx0aGlzLl90aWNrU2NoZWR1bGVkPSEwKSl9LHMucHJvdG90eXBlLl90aWNrPWZ1bmN0aW9uKCl7aWYodGhpcy5pc1BhdXNlZHx8dGhpcy5pc0ZpbmlzaGVkKXJldHVybiExO3ZhciB0PW51bGwsZT1NYXRoLm1pbih0aGlzLm1heCx0aGlzLmluZGV4KzE2Mzg0KTtpZih0aGlzLmluZGV4Pj10aGlzLm1heClyZXR1cm4gdGhpcy5lbmQoKTtzd2l0Y2godGhpcy50eXBlKXtjYXNlXCJzdHJpbmdcIjp0PXRoaXMuZGF0YS5zdWJzdHJpbmcodGhpcy5pbmRleCxlKTticmVhaztjYXNlXCJ1aW50OGFycmF5XCI6dD10aGlzLmRhdGEuc3ViYXJyYXkodGhpcy5pbmRleCxlKTticmVhaztjYXNlXCJhcnJheVwiOmNhc2VcIm5vZGVidWZmZXJcIjp0PXRoaXMuZGF0YS5zbGljZSh0aGlzLmluZGV4LGUpfXJldHVybiB0aGlzLmluZGV4PWUsdGhpcy5wdXNoKHtkYXRhOnQsbWV0YTp7cGVyY2VudDp0aGlzLm1heD90aGlzLmluZGV4L3RoaXMubWF4KjEwMDowfX0pfSxlLmV4cG9ydHM9c30se1wiLi4vdXRpbHNcIjozMixcIi4vR2VuZXJpY1dvcmtlclwiOjI4fV0sMjg6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBpKHQpe3RoaXMubmFtZT10fHxcImRlZmF1bHRcIix0aGlzLnN0cmVhbUluZm89e30sdGhpcy5nZW5lcmF0ZWRFcnJvcj1udWxsLHRoaXMuZXh0cmFTdHJlYW1JbmZvPXt9LHRoaXMuaXNQYXVzZWQ9ITAsdGhpcy5pc0ZpbmlzaGVkPSExLHRoaXMuaXNMb2NrZWQ9ITEsdGhpcy5fbGlzdGVuZXJzPXtkYXRhOltdLGVuZDpbXSxlcnJvcjpbXX0sdGhpcy5wcmV2aW91cz1udWxsfWkucHJvdG90eXBlPXtwdXNoOmZ1bmN0aW9uKHQpe3RoaXMuZW1pdChcImRhdGFcIix0KX0sZW5kOmZ1bmN0aW9uKCl7aWYodGhpcy5pc0ZpbmlzaGVkKXJldHVybiExO3RoaXMuZmx1c2goKTt0cnl7dGhpcy5lbWl0KFwiZW5kXCIpLHRoaXMuY2xlYW5VcCgpLHRoaXMuaXNGaW5pc2hlZD0hMH1jYXRjaCh0KXt0aGlzLmVtaXQoXCJlcnJvclwiLHQpfXJldHVybiEwfSxlcnJvcjpmdW5jdGlvbih0KXtyZXR1cm4hdGhpcy5pc0ZpbmlzaGVkJiYodGhpcy5pc1BhdXNlZD90aGlzLmdlbmVyYXRlZEVycm9yPXQ6KHRoaXMuaXNGaW5pc2hlZD0hMCx0aGlzLmVtaXQoXCJlcnJvclwiLHQpLHRoaXMucHJldmlvdXMmJnRoaXMucHJldmlvdXMuZXJyb3IodCksdGhpcy5jbGVhblVwKCkpLCEwKX0sb246ZnVuY3Rpb24odCxlKXtyZXR1cm4gdGhpcy5fbGlzdGVuZXJzW3RdLnB1c2goZSksdGhpc30sY2xlYW5VcDpmdW5jdGlvbigpe3RoaXMuc3RyZWFtSW5mbz10aGlzLmdlbmVyYXRlZEVycm9yPXRoaXMuZXh0cmFTdHJlYW1JbmZvPW51bGwsdGhpcy5fbGlzdGVuZXJzPVtdfSxlbWl0OmZ1bmN0aW9uKHQsZSl7aWYodGhpcy5fbGlzdGVuZXJzW3RdKWZvcih2YXIgcj0wO3I8dGhpcy5fbGlzdGVuZXJzW3RdLmxlbmd0aDtyKyspdGhpcy5fbGlzdGVuZXJzW3RdW3JdLmNhbGwodGhpcyxlKX0scGlwZTpmdW5jdGlvbih0KXtyZXR1cm4gdC5yZWdpc3RlclByZXZpb3VzKHRoaXMpfSxyZWdpc3RlclByZXZpb3VzOmZ1bmN0aW9uKHQpe2lmKHRoaXMuaXNMb2NrZWQpdGhyb3cgbmV3IEVycm9yKFwiVGhlIHN0cmVhbSAnXCIrdGhpcytcIicgaGFzIGFscmVhZHkgYmVlbiB1c2VkLlwiKTt0aGlzLnN0cmVhbUluZm89dC5zdHJlYW1JbmZvLHRoaXMubWVyZ2VTdHJlYW1JbmZvKCksdGhpcy5wcmV2aW91cz10O3ZhciBlPXRoaXM7cmV0dXJuIHQub24oXCJkYXRhXCIsZnVuY3Rpb24odCl7ZS5wcm9jZXNzQ2h1bmsodCl9KSx0Lm9uKFwiZW5kXCIsZnVuY3Rpb24oKXtlLmVuZCgpfSksdC5vbihcImVycm9yXCIsZnVuY3Rpb24odCl7ZS5lcnJvcih0KX0pLHRoaXN9LHBhdXNlOmZ1bmN0aW9uKCl7cmV0dXJuIXRoaXMuaXNQYXVzZWQmJiF0aGlzLmlzRmluaXNoZWQmJih0aGlzLmlzUGF1c2VkPSEwLHRoaXMucHJldmlvdXMmJnRoaXMucHJldmlvdXMucGF1c2UoKSwhMCl9LHJlc3VtZTpmdW5jdGlvbigpe2lmKCF0aGlzLmlzUGF1c2VkfHx0aGlzLmlzRmluaXNoZWQpcmV0dXJuITE7dmFyIHQ9dGhpcy5pc1BhdXNlZD0hMTtyZXR1cm4gdGhpcy5nZW5lcmF0ZWRFcnJvciYmKHRoaXMuZXJyb3IodGhpcy5nZW5lcmF0ZWRFcnJvciksdD0hMCksdGhpcy5wcmV2aW91cyYmdGhpcy5wcmV2aW91cy5yZXN1bWUoKSwhdH0sZmx1c2g6ZnVuY3Rpb24oKXt9LHByb2Nlc3NDaHVuazpmdW5jdGlvbih0KXt0aGlzLnB1c2godCl9LHdpdGhTdHJlYW1JbmZvOmZ1bmN0aW9uKHQsZSl7cmV0dXJuIHRoaXMuZXh0cmFTdHJlYW1JbmZvW3RdPWUsdGhpcy5tZXJnZVN0cmVhbUluZm8oKSx0aGlzfSxtZXJnZVN0cmVhbUluZm86ZnVuY3Rpb24oKXtmb3IodmFyIHQgaW4gdGhpcy5leHRyYVN0cmVhbUluZm8pdGhpcy5leHRyYVN0cmVhbUluZm8uaGFzT3duUHJvcGVydHkodCkmJih0aGlzLnN0cmVhbUluZm9bdF09dGhpcy5leHRyYVN0cmVhbUluZm9bdF0pfSxsb2NrOmZ1bmN0aW9uKCl7aWYodGhpcy5pc0xvY2tlZCl0aHJvdyBuZXcgRXJyb3IoXCJUaGUgc3RyZWFtICdcIit0aGlzK1wiJyBoYXMgYWxyZWFkeSBiZWVuIHVzZWQuXCIpO3RoaXMuaXNMb2NrZWQ9ITAsdGhpcy5wcmV2aW91cyYmdGhpcy5wcmV2aW91cy5sb2NrKCl9LHRvU3RyaW5nOmZ1bmN0aW9uKCl7dmFyIHQ9XCJXb3JrZXIgXCIrdGhpcy5uYW1lO3JldHVybiB0aGlzLnByZXZpb3VzP3RoaXMucHJldmlvdXMrXCIgLT4gXCIrdDp0fX0sZS5leHBvcnRzPWl9LHt9XSwyOTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBoPXQoXCIuLi91dGlsc1wiKSxuPXQoXCIuL0NvbnZlcnRXb3JrZXJcIikscz10KFwiLi9HZW5lcmljV29ya2VyXCIpLHU9dChcIi4uL2Jhc2U2NFwiKSxpPXQoXCIuLi9zdXBwb3J0XCIpLGE9dChcIi4uL2V4dGVybmFsXCIpLG89bnVsbDtpZihpLm5vZGVzdHJlYW0pdHJ5e289dChcIi4uL25vZGVqcy9Ob2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyXCIpfWNhdGNoKHQpe31mdW5jdGlvbiBsKHQsbyl7cmV0dXJuIG5ldyBhLlByb21pc2UoZnVuY3Rpb24oZSxyKXt2YXIgaT1bXSxuPXQuX2ludGVybmFsVHlwZSxzPXQuX291dHB1dFR5cGUsYT10Ll9taW1lVHlwZTt0Lm9uKFwiZGF0YVwiLGZ1bmN0aW9uKHQsZSl7aS5wdXNoKHQpLG8mJm8oZSl9KS5vbihcImVycm9yXCIsZnVuY3Rpb24odCl7aT1bXSxyKHQpfSkub24oXCJlbmRcIixmdW5jdGlvbigpe3RyeXt2YXIgdD1mdW5jdGlvbih0LGUscil7c3dpdGNoKHQpe2Nhc2VcImJsb2JcIjpyZXR1cm4gaC5uZXdCbG9iKGgudHJhbnNmb3JtVG8oXCJhcnJheWJ1ZmZlclwiLGUpLHIpO2Nhc2VcImJhc2U2NFwiOnJldHVybiB1LmVuY29kZShlKTtkZWZhdWx0OnJldHVybiBoLnRyYW5zZm9ybVRvKHQsZSl9fShzLGZ1bmN0aW9uKHQsZSl7dmFyIHIsaT0wLG49bnVsbCxzPTA7Zm9yKHI9MDtyPGUubGVuZ3RoO3IrKylzKz1lW3JdLmxlbmd0aDtzd2l0Y2godCl7Y2FzZVwic3RyaW5nXCI6cmV0dXJuIGUuam9pbihcIlwiKTtjYXNlXCJhcnJheVwiOnJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLGUpO2Nhc2VcInVpbnQ4YXJyYXlcIjpmb3Iobj1uZXcgVWludDhBcnJheShzKSxyPTA7cjxlLmxlbmd0aDtyKyspbi5zZXQoZVtyXSxpKSxpKz1lW3JdLmxlbmd0aDtyZXR1cm4gbjtjYXNlXCJub2RlYnVmZmVyXCI6cmV0dXJuIEJ1ZmZlci5jb25jYXQoZSk7ZGVmYXVsdDp0aHJvdyBuZXcgRXJyb3IoXCJjb25jYXQgOiB1bnN1cHBvcnRlZCB0eXBlICdcIit0K1wiJ1wiKX19KG4saSksYSk7ZSh0KX1jYXRjaCh0KXtyKHQpfWk9W119KS5yZXN1bWUoKX0pfWZ1bmN0aW9uIGYodCxlLHIpe3ZhciBpPWU7c3dpdGNoKGUpe2Nhc2VcImJsb2JcIjpjYXNlXCJhcnJheWJ1ZmZlclwiOmk9XCJ1aW50OGFycmF5XCI7YnJlYWs7Y2FzZVwiYmFzZTY0XCI6aT1cInN0cmluZ1wifXRyeXt0aGlzLl9pbnRlcm5hbFR5cGU9aSx0aGlzLl9vdXRwdXRUeXBlPWUsdGhpcy5fbWltZVR5cGU9cixoLmNoZWNrU3VwcG9ydChpKSx0aGlzLl93b3JrZXI9dC5waXBlKG5ldyBuKGkpKSx0LmxvY2soKX1jYXRjaCh0KXt0aGlzLl93b3JrZXI9bmV3IHMoXCJlcnJvclwiKSx0aGlzLl93b3JrZXIuZXJyb3IodCl9fWYucHJvdG90eXBlPXthY2N1bXVsYXRlOmZ1bmN0aW9uKHQpe3JldHVybiBsKHRoaXMsdCl9LG9uOmZ1bmN0aW9uKHQsZSl7dmFyIHI9dGhpcztyZXR1cm5cImRhdGFcIj09PXQ/dGhpcy5fd29ya2VyLm9uKHQsZnVuY3Rpb24odCl7ZS5jYWxsKHIsdC5kYXRhLHQubWV0YSl9KTp0aGlzLl93b3JrZXIub24odCxmdW5jdGlvbigpe2guZGVsYXkoZSxhcmd1bWVudHMscil9KSx0aGlzfSxyZXN1bWU6ZnVuY3Rpb24oKXtyZXR1cm4gaC5kZWxheSh0aGlzLl93b3JrZXIucmVzdW1lLFtdLHRoaXMuX3dvcmtlciksdGhpc30scGF1c2U6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fd29ya2VyLnBhdXNlKCksdGhpc30sdG9Ob2RlanNTdHJlYW06ZnVuY3Rpb24odCl7aWYoaC5jaGVja1N1cHBvcnQoXCJub2Rlc3RyZWFtXCIpLFwibm9kZWJ1ZmZlclwiIT09dGhpcy5fb3V0cHV0VHlwZSl0aHJvdyBuZXcgRXJyb3IodGhpcy5fb3V0cHV0VHlwZStcIiBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoaXMgbWV0aG9kXCIpO3JldHVybiBuZXcgbyh0aGlzLHtvYmplY3RNb2RlOlwibm9kZWJ1ZmZlclwiIT09dGhpcy5fb3V0cHV0VHlwZX0sdCl9fSxlLmV4cG9ydHM9Zn0se1wiLi4vYmFzZTY0XCI6MSxcIi4uL2V4dGVybmFsXCI6NixcIi4uL25vZGVqcy9Ob2RlanNTdHJlYW1PdXRwdXRBZGFwdGVyXCI6MTMsXCIuLi9zdXBwb3J0XCI6MzAsXCIuLi91dGlsc1wiOjMyLFwiLi9Db252ZXJ0V29ya2VyXCI6MjQsXCIuL0dlbmVyaWNXb3JrZXJcIjoyOH1dLDMwOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7aWYoci5iYXNlNjQ9ITAsci5hcnJheT0hMCxyLnN0cmluZz0hMCxyLmFycmF5YnVmZmVyPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBBcnJheUJ1ZmZlciYmXCJ1bmRlZmluZWRcIiE9dHlwZW9mIFVpbnQ4QXJyYXksci5ub2RlYnVmZmVyPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBCdWZmZXIsci51aW50OGFycmF5PVwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50OEFycmF5LFwidW5kZWZpbmVkXCI9PXR5cGVvZiBBcnJheUJ1ZmZlcilyLmJsb2I9ITE7ZWxzZXt2YXIgaT1uZXcgQXJyYXlCdWZmZXIoMCk7dHJ5e3IuYmxvYj0wPT09bmV3IEJsb2IoW2ldLHt0eXBlOlwiYXBwbGljYXRpb24vemlwXCJ9KS5zaXplfWNhdGNoKHQpe3RyeXt2YXIgbj1uZXcoc2VsZi5CbG9iQnVpbGRlcnx8c2VsZi5XZWJLaXRCbG9iQnVpbGRlcnx8c2VsZi5Nb3pCbG9iQnVpbGRlcnx8c2VsZi5NU0Jsb2JCdWlsZGVyKTtuLmFwcGVuZChpKSxyLmJsb2I9MD09PW4uZ2V0QmxvYihcImFwcGxpY2F0aW9uL3ppcFwiKS5zaXplfWNhdGNoKHQpe3IuYmxvYj0hMX19fXRyeXtyLm5vZGVzdHJlYW09ISF0KFwicmVhZGFibGUtc3RyZWFtXCIpLlJlYWRhYmxlfWNhdGNoKHQpe3Iubm9kZXN0cmVhbT0hMX19LHtcInJlYWRhYmxlLXN0cmVhbVwiOjE2fV0sMzE6W2Z1bmN0aW9uKHQsZSxzKXtcInVzZSBzdHJpY3RcIjtmb3IodmFyIG89dChcIi4vdXRpbHNcIiksaD10KFwiLi9zdXBwb3J0XCIpLHI9dChcIi4vbm9kZWpzVXRpbHNcIiksaT10KFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiKSx1PW5ldyBBcnJheSgyNTYpLG49MDtuPDI1NjtuKyspdVtuXT0yNTI8PW4/NjoyNDg8PW4/NToyNDA8PW4/NDoyMjQ8PW4/MzoxOTI8PW4/MjoxO3VbMjU0XT11WzI1NF09MTtmdW5jdGlvbiBhKCl7aS5jYWxsKHRoaXMsXCJ1dGYtOCBkZWNvZGVcIiksdGhpcy5sZWZ0T3Zlcj1udWxsfWZ1bmN0aW9uIGwoKXtpLmNhbGwodGhpcyxcInV0Zi04IGVuY29kZVwiKX1zLnV0ZjhlbmNvZGU9ZnVuY3Rpb24odCl7cmV0dXJuIGgubm9kZWJ1ZmZlcj9yLm5ld0J1ZmZlckZyb20odCxcInV0Zi04XCIpOmZ1bmN0aW9uKHQpe3ZhciBlLHIsaSxuLHMsYT10Lmxlbmd0aCxvPTA7Zm9yKG49MDtuPGE7bisrKTU1Mjk2PT0oNjQ1MTImKHI9dC5jaGFyQ29kZUF0KG4pKSkmJm4rMTxhJiY1NjMyMD09KDY0NTEyJihpPXQuY2hhckNvZGVBdChuKzEpKSkmJihyPTY1NTM2KyhyLTU1Mjk2PDwxMCkrKGktNTYzMjApLG4rKyksbys9cjwxMjg/MTpyPDIwNDg/MjpyPDY1NTM2PzM6NDtmb3IoZT1oLnVpbnQ4YXJyYXk/bmV3IFVpbnQ4QXJyYXkobyk6bmV3IEFycmF5KG8pLG49cz0wO3M8bztuKyspNTUyOTY9PSg2NDUxMiYocj10LmNoYXJDb2RlQXQobikpKSYmbisxPGEmJjU2MzIwPT0oNjQ1MTImKGk9dC5jaGFyQ29kZUF0KG4rMSkpKSYmKHI9NjU1MzYrKHItNTUyOTY8PDEwKSsoaS01NjMyMCksbisrKSxyPDEyOD9lW3MrK109cjoocjwyMDQ4P2VbcysrXT0xOTJ8cj4+PjY6KHI8NjU1MzY/ZVtzKytdPTIyNHxyPj4+MTI6KGVbcysrXT0yNDB8cj4+PjE4LGVbcysrXT0xMjh8cj4+PjEyJjYzKSxlW3MrK109MTI4fHI+Pj42JjYzKSxlW3MrK109MTI4fDYzJnIpO3JldHVybiBlfSh0KX0scy51dGY4ZGVjb2RlPWZ1bmN0aW9uKHQpe3JldHVybiBoLm5vZGVidWZmZXI/by50cmFuc2Zvcm1UbyhcIm5vZGVidWZmZXJcIix0KS50b1N0cmluZyhcInV0Zi04XCIpOmZ1bmN0aW9uKHQpe3ZhciBlLHIsaSxuLHM9dC5sZW5ndGgsYT1uZXcgQXJyYXkoMipzKTtmb3IoZT1yPTA7ZTxzOylpZigoaT10W2UrK10pPDEyOClhW3IrK109aTtlbHNlIGlmKDQ8KG49dVtpXSkpYVtyKytdPTY1NTMzLGUrPW4tMTtlbHNle2ZvcihpJj0yPT09bj8zMTozPT09bj8xNTo3OzE8biYmZTxzOylpPWk8PDZ8NjMmdFtlKytdLG4tLTsxPG4/YVtyKytdPTY1NTMzOmk8NjU1MzY/YVtyKytdPWk6KGktPTY1NTM2LGFbcisrXT01NTI5NnxpPj4xMCYxMDIzLGFbcisrXT01NjMyMHwxMDIzJmkpfXJldHVybiBhLmxlbmd0aCE9PXImJihhLnN1YmFycmF5P2E9YS5zdWJhcnJheSgwLHIpOmEubGVuZ3RoPXIpLG8uYXBwbHlGcm9tQ2hhckNvZGUoYSl9KHQ9by50cmFuc2Zvcm1UbyhoLnVpbnQ4YXJyYXk/XCJ1aW50OGFycmF5XCI6XCJhcnJheVwiLHQpKX0sby5pbmhlcml0cyhhLGkpLGEucHJvdG90eXBlLnByb2Nlc3NDaHVuaz1mdW5jdGlvbih0KXt2YXIgZT1vLnRyYW5zZm9ybVRvKGgudWludDhhcnJheT9cInVpbnQ4YXJyYXlcIjpcImFycmF5XCIsdC5kYXRhKTtpZih0aGlzLmxlZnRPdmVyJiZ0aGlzLmxlZnRPdmVyLmxlbmd0aCl7aWYoaC51aW50OGFycmF5KXt2YXIgcj1lOyhlPW5ldyBVaW50OEFycmF5KHIubGVuZ3RoK3RoaXMubGVmdE92ZXIubGVuZ3RoKSkuc2V0KHRoaXMubGVmdE92ZXIsMCksZS5zZXQocix0aGlzLmxlZnRPdmVyLmxlbmd0aCl9ZWxzZSBlPXRoaXMubGVmdE92ZXIuY29uY2F0KGUpO3RoaXMubGVmdE92ZXI9bnVsbH12YXIgaT1mdW5jdGlvbih0LGUpe3ZhciByO2ZvcigoZT1lfHx0Lmxlbmd0aCk+dC5sZW5ndGgmJihlPXQubGVuZ3RoKSxyPWUtMTswPD1yJiYxMjg9PSgxOTImdFtyXSk7KXItLTtyZXR1cm4gcjwwP2U6MD09PXI/ZTpyK3VbdFtyXV0+ZT9yOmV9KGUpLG49ZTtpIT09ZS5sZW5ndGgmJihoLnVpbnQ4YXJyYXk/KG49ZS5zdWJhcnJheSgwLGkpLHRoaXMubGVmdE92ZXI9ZS5zdWJhcnJheShpLGUubGVuZ3RoKSk6KG49ZS5zbGljZSgwLGkpLHRoaXMubGVmdE92ZXI9ZS5zbGljZShpLGUubGVuZ3RoKSkpLHRoaXMucHVzaCh7ZGF0YTpzLnV0ZjhkZWNvZGUobiksbWV0YTp0Lm1ldGF9KX0sYS5wcm90b3R5cGUuZmx1c2g9ZnVuY3Rpb24oKXt0aGlzLmxlZnRPdmVyJiZ0aGlzLmxlZnRPdmVyLmxlbmd0aCYmKHRoaXMucHVzaCh7ZGF0YTpzLnV0ZjhkZWNvZGUodGhpcy5sZWZ0T3ZlciksbWV0YTp7fX0pLHRoaXMubGVmdE92ZXI9bnVsbCl9LHMuVXRmOERlY29kZVdvcmtlcj1hLG8uaW5oZXJpdHMobCxpKSxsLnByb3RvdHlwZS5wcm9jZXNzQ2h1bms9ZnVuY3Rpb24odCl7dGhpcy5wdXNoKHtkYXRhOnMudXRmOGVuY29kZSh0LmRhdGEpLG1ldGE6dC5tZXRhfSl9LHMuVXRmOEVuY29kZVdvcmtlcj1sfSx7XCIuL25vZGVqc1V0aWxzXCI6MTQsXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCI6MjgsXCIuL3N1cHBvcnRcIjozMCxcIi4vdXRpbHNcIjozMn1dLDMyOltmdW5jdGlvbih0LGUsYSl7XCJ1c2Ugc3RyaWN0XCI7dmFyIG89dChcIi4vc3VwcG9ydFwiKSxoPXQoXCIuL2Jhc2U2NFwiKSxyPXQoXCIuL25vZGVqc1V0aWxzXCIpLGk9dChcInNldC1pbW1lZGlhdGUtc2hpbVwiKSx1PXQoXCIuL2V4dGVybmFsXCIpO2Z1bmN0aW9uIG4odCl7cmV0dXJuIHR9ZnVuY3Rpb24gbCh0LGUpe2Zvcih2YXIgcj0wO3I8dC5sZW5ndGg7KytyKWVbcl09MjU1JnQuY2hhckNvZGVBdChyKTtyZXR1cm4gZX1hLm5ld0Jsb2I9ZnVuY3Rpb24oZSxyKXthLmNoZWNrU3VwcG9ydChcImJsb2JcIik7dHJ5e3JldHVybiBuZXcgQmxvYihbZV0se3R5cGU6cn0pfWNhdGNoKHQpe3RyeXt2YXIgaT1uZXcoc2VsZi5CbG9iQnVpbGRlcnx8c2VsZi5XZWJLaXRCbG9iQnVpbGRlcnx8c2VsZi5Nb3pCbG9iQnVpbGRlcnx8c2VsZi5NU0Jsb2JCdWlsZGVyKTtyZXR1cm4gaS5hcHBlbmQoZSksaS5nZXRCbG9iKHIpfWNhdGNoKHQpe3Rocm93IG5ldyBFcnJvcihcIkJ1ZyA6IGNhbid0IGNvbnN0cnVjdCB0aGUgQmxvYi5cIil9fX07dmFyIHM9e3N0cmluZ2lmeUJ5Q2h1bms6ZnVuY3Rpb24odCxlLHIpe3ZhciBpPVtdLG49MCxzPXQubGVuZ3RoO2lmKHM8PXIpcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCx0KTtmb3IoO248czspXCJhcnJheVwiPT09ZXx8XCJub2RlYnVmZmVyXCI9PT1lP2kucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsdC5zbGljZShuLE1hdGgubWluKG4rcixzKSkpKTppLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLHQuc3ViYXJyYXkobixNYXRoLm1pbihuK3IscykpKSksbis9cjtyZXR1cm4gaS5qb2luKFwiXCIpfSxzdHJpbmdpZnlCeUNoYXI6ZnVuY3Rpb24odCl7Zm9yKHZhciBlPVwiXCIscj0wO3I8dC5sZW5ndGg7cisrKWUrPVN0cmluZy5mcm9tQ2hhckNvZGUodFtyXSk7cmV0dXJuIGV9LGFwcGx5Q2FuQmVVc2VkOnt1aW50OGFycmF5OmZ1bmN0aW9uKCl7dHJ5e3JldHVybiBvLnVpbnQ4YXJyYXkmJjE9PT1TdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsbmV3IFVpbnQ4QXJyYXkoMSkpLmxlbmd0aH1jYXRjaCh0KXtyZXR1cm4hMX19KCksbm9kZWJ1ZmZlcjpmdW5jdGlvbigpe3RyeXtyZXR1cm4gby5ub2RlYnVmZmVyJiYxPT09U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLHIuYWxsb2NCdWZmZXIoMSkpLmxlbmd0aH1jYXRjaCh0KXtyZXR1cm4hMX19KCl9fTtmdW5jdGlvbiBmKHQpe3ZhciBlPTY1NTM2LHI9YS5nZXRUeXBlT2YodCksaT0hMDtpZihcInVpbnQ4YXJyYXlcIj09PXI/aT1zLmFwcGx5Q2FuQmVVc2VkLnVpbnQ4YXJyYXk6XCJub2RlYnVmZmVyXCI9PT1yJiYoaT1zLmFwcGx5Q2FuQmVVc2VkLm5vZGVidWZmZXIpLGkpZm9yKDsxPGU7KXRyeXtyZXR1cm4gcy5zdHJpbmdpZnlCeUNodW5rKHQscixlKX1jYXRjaCh0KXtlPU1hdGguZmxvb3IoZS8yKX1yZXR1cm4gcy5zdHJpbmdpZnlCeUNoYXIodCl9ZnVuY3Rpb24gZCh0LGUpe2Zvcih2YXIgcj0wO3I8dC5sZW5ndGg7cisrKWVbcl09dFtyXTtyZXR1cm4gZX1hLmFwcGx5RnJvbUNoYXJDb2RlPWY7dmFyIGM9e307Yy5zdHJpbmc9e3N0cmluZzpuLGFycmF5OmZ1bmN0aW9uKHQpe3JldHVybiBsKHQsbmV3IEFycmF5KHQubGVuZ3RoKSl9LGFycmF5YnVmZmVyOmZ1bmN0aW9uKHQpe3JldHVybiBjLnN0cmluZy51aW50OGFycmF5KHQpLmJ1ZmZlcn0sdWludDhhcnJheTpmdW5jdGlvbih0KXtyZXR1cm4gbCh0LG5ldyBVaW50OEFycmF5KHQubGVuZ3RoKSl9LG5vZGVidWZmZXI6ZnVuY3Rpb24odCl7cmV0dXJuIGwodCxyLmFsbG9jQnVmZmVyKHQubGVuZ3RoKSl9fSxjLmFycmF5PXtzdHJpbmc6ZixhcnJheTpuLGFycmF5YnVmZmVyOmZ1bmN0aW9uKHQpe3JldHVybiBuZXcgVWludDhBcnJheSh0KS5idWZmZXJ9LHVpbnQ4YXJyYXk6ZnVuY3Rpb24odCl7cmV0dXJuIG5ldyBVaW50OEFycmF5KHQpfSxub2RlYnVmZmVyOmZ1bmN0aW9uKHQpe3JldHVybiByLm5ld0J1ZmZlckZyb20odCl9fSxjLmFycmF5YnVmZmVyPXtzdHJpbmc6ZnVuY3Rpb24odCl7cmV0dXJuIGYobmV3IFVpbnQ4QXJyYXkodCkpfSxhcnJheTpmdW5jdGlvbih0KXtyZXR1cm4gZChuZXcgVWludDhBcnJheSh0KSxuZXcgQXJyYXkodC5ieXRlTGVuZ3RoKSl9LGFycmF5YnVmZmVyOm4sdWludDhhcnJheTpmdW5jdGlvbih0KXtyZXR1cm4gbmV3IFVpbnQ4QXJyYXkodCl9LG5vZGVidWZmZXI6ZnVuY3Rpb24odCl7cmV0dXJuIHIubmV3QnVmZmVyRnJvbShuZXcgVWludDhBcnJheSh0KSl9fSxjLnVpbnQ4YXJyYXk9e3N0cmluZzpmLGFycmF5OmZ1bmN0aW9uKHQpe3JldHVybiBkKHQsbmV3IEFycmF5KHQubGVuZ3RoKSl9LGFycmF5YnVmZmVyOmZ1bmN0aW9uKHQpe3JldHVybiB0LmJ1ZmZlcn0sdWludDhhcnJheTpuLG5vZGVidWZmZXI6ZnVuY3Rpb24odCl7cmV0dXJuIHIubmV3QnVmZmVyRnJvbSh0KX19LGMubm9kZWJ1ZmZlcj17c3RyaW5nOmYsYXJyYXk6ZnVuY3Rpb24odCl7cmV0dXJuIGQodCxuZXcgQXJyYXkodC5sZW5ndGgpKX0sYXJyYXlidWZmZXI6ZnVuY3Rpb24odCl7cmV0dXJuIGMubm9kZWJ1ZmZlci51aW50OGFycmF5KHQpLmJ1ZmZlcn0sdWludDhhcnJheTpmdW5jdGlvbih0KXtyZXR1cm4gZCh0LG5ldyBVaW50OEFycmF5KHQubGVuZ3RoKSl9LG5vZGVidWZmZXI6bn0sYS50cmFuc2Zvcm1Ubz1mdW5jdGlvbih0LGUpe2lmKGU9ZXx8XCJcIiwhdClyZXR1cm4gZTthLmNoZWNrU3VwcG9ydCh0KTt2YXIgcj1hLmdldFR5cGVPZihlKTtyZXR1cm4gY1tyXVt0XShlKX0sYS5nZXRUeXBlT2Y9ZnVuY3Rpb24odCl7cmV0dXJuXCJzdHJpbmdcIj09dHlwZW9mIHQ/XCJzdHJpbmdcIjpcIltvYmplY3QgQXJyYXldXCI9PT1PYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodCk/XCJhcnJheVwiOm8ubm9kZWJ1ZmZlciYmci5pc0J1ZmZlcih0KT9cIm5vZGVidWZmZXJcIjpvLnVpbnQ4YXJyYXkmJnQgaW5zdGFuY2VvZiBVaW50OEFycmF5P1widWludDhhcnJheVwiOm8uYXJyYXlidWZmZXImJnQgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcj9cImFycmF5YnVmZmVyXCI6dm9pZCAwfSxhLmNoZWNrU3VwcG9ydD1mdW5jdGlvbih0KXtpZighb1t0LnRvTG93ZXJDYXNlKCldKXRocm93IG5ldyBFcnJvcih0K1wiIGlzIG5vdCBzdXBwb3J0ZWQgYnkgdGhpcyBwbGF0Zm9ybVwiKX0sYS5NQVhfVkFMVUVfMTZCSVRTPTY1NTM1LGEuTUFYX1ZBTFVFXzMyQklUUz0tMSxhLnByZXR0eT1mdW5jdGlvbih0KXt2YXIgZSxyLGk9XCJcIjtmb3Iocj0wO3I8KHR8fFwiXCIpLmxlbmd0aDtyKyspaSs9XCJcXFxceFwiKygoZT10LmNoYXJDb2RlQXQocikpPDE2P1wiMFwiOlwiXCIpK2UudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7cmV0dXJuIGl9LGEuZGVsYXk9ZnVuY3Rpb24odCxlLHIpe2koZnVuY3Rpb24oKXt0LmFwcGx5KHJ8fG51bGwsZXx8W10pfSl9LGEuaW5oZXJpdHM9ZnVuY3Rpb24odCxlKXtmdW5jdGlvbiByKCl7fXIucHJvdG90eXBlPWUucHJvdG90eXBlLHQucHJvdG90eXBlPW5ldyByfSxhLmV4dGVuZD1mdW5jdGlvbigpe3ZhciB0LGUscj17fTtmb3IodD0wO3Q8YXJndW1lbnRzLmxlbmd0aDt0KyspZm9yKGUgaW4gYXJndW1lbnRzW3RdKWFyZ3VtZW50c1t0XS5oYXNPd25Qcm9wZXJ0eShlKSYmdm9pZCAwPT09cltlXSYmKHJbZV09YXJndW1lbnRzW3RdW2VdKTtyZXR1cm4gcn0sYS5wcmVwYXJlQ29udGVudD1mdW5jdGlvbihyLHQsaSxuLHMpe3JldHVybiB1LlByb21pc2UucmVzb2x2ZSh0KS50aGVuKGZ1bmN0aW9uKGkpe3JldHVybiBvLmJsb2ImJihpIGluc3RhbmNlb2YgQmxvYnx8LTEhPT1bXCJbb2JqZWN0IEZpbGVdXCIsXCJbb2JqZWN0IEJsb2JdXCJdLmluZGV4T2YoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGkpKSkmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBGaWxlUmVhZGVyP25ldyB1LlByb21pc2UoZnVuY3Rpb24oZSxyKXt2YXIgdD1uZXcgRmlsZVJlYWRlcjt0Lm9ubG9hZD1mdW5jdGlvbih0KXtlKHQudGFyZ2V0LnJlc3VsdCl9LHQub25lcnJvcj1mdW5jdGlvbih0KXtyKHQudGFyZ2V0LmVycm9yKX0sdC5yZWFkQXNBcnJheUJ1ZmZlcihpKX0pOml9KS50aGVuKGZ1bmN0aW9uKHQpe3ZhciBlPWEuZ2V0VHlwZU9mKHQpO3JldHVybiBlPyhcImFycmF5YnVmZmVyXCI9PT1lP3Q9YS50cmFuc2Zvcm1UbyhcInVpbnQ4YXJyYXlcIix0KTpcInN0cmluZ1wiPT09ZSYmKHM/dD1oLmRlY29kZSh0KTppJiYhMCE9PW4mJih0PWZ1bmN0aW9uKHQpe3JldHVybiBsKHQsby51aW50OGFycmF5P25ldyBVaW50OEFycmF5KHQubGVuZ3RoKTpuZXcgQXJyYXkodC5sZW5ndGgpKX0odCkpKSx0KTp1LlByb21pc2UucmVqZWN0KG5ldyBFcnJvcihcIkNhbid0IHJlYWQgdGhlIGRhdGEgb2YgJ1wiK3IrXCInLiBJcyBpdCBpbiBhIHN1cHBvcnRlZCBKYXZhU2NyaXB0IHR5cGUgKFN0cmluZywgQmxvYiwgQXJyYXlCdWZmZXIsIGV0YykgP1wiKSl9KX19LHtcIi4vYmFzZTY0XCI6MSxcIi4vZXh0ZXJuYWxcIjo2LFwiLi9ub2RlanNVdGlsc1wiOjE0LFwiLi9zdXBwb3J0XCI6MzAsXCJzZXQtaW1tZWRpYXRlLXNoaW1cIjo1NH1dLDMzOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vcmVhZGVyL3JlYWRlckZvclwiKSxuPXQoXCIuL3V0aWxzXCIpLHM9dChcIi4vc2lnbmF0dXJlXCIpLGE9dChcIi4vemlwRW50cnlcIiksbz0odChcIi4vdXRmOFwiKSx0KFwiLi9zdXBwb3J0XCIpKTtmdW5jdGlvbiBoKHQpe3RoaXMuZmlsZXM9W10sdGhpcy5sb2FkT3B0aW9ucz10fWgucHJvdG90eXBlPXtjaGVja1NpZ25hdHVyZTpmdW5jdGlvbih0KXtpZighdGhpcy5yZWFkZXIucmVhZEFuZENoZWNrU2lnbmF0dXJlKHQpKXt0aGlzLnJlYWRlci5pbmRleC09NDt2YXIgZT10aGlzLnJlYWRlci5yZWFkU3RyaW5nKDQpO3Rocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXAgb3IgYnVnOiB1bmV4cGVjdGVkIHNpZ25hdHVyZSAoXCIrbi5wcmV0dHkoZSkrXCIsIGV4cGVjdGVkIFwiK24ucHJldHR5KHQpK1wiKVwiKX19LGlzU2lnbmF0dXJlOmZ1bmN0aW9uKHQsZSl7dmFyIHI9dGhpcy5yZWFkZXIuaW5kZXg7dGhpcy5yZWFkZXIuc2V0SW5kZXgodCk7dmFyIGk9dGhpcy5yZWFkZXIucmVhZFN0cmluZyg0KT09PWU7cmV0dXJuIHRoaXMucmVhZGVyLnNldEluZGV4KHIpLGl9LHJlYWRCbG9ja0VuZE9mQ2VudHJhbDpmdW5jdGlvbigpe3RoaXMuZGlza051bWJlcj10aGlzLnJlYWRlci5yZWFkSW50KDIpLHRoaXMuZGlza1dpdGhDZW50cmFsRGlyU3RhcnQ9dGhpcy5yZWFkZXIucmVhZEludCgyKSx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzT25UaGlzRGlzaz10aGlzLnJlYWRlci5yZWFkSW50KDIpLHRoaXMuY2VudHJhbERpclJlY29yZHM9dGhpcy5yZWFkZXIucmVhZEludCgyKSx0aGlzLmNlbnRyYWxEaXJTaXplPXRoaXMucmVhZGVyLnJlYWRJbnQoNCksdGhpcy5jZW50cmFsRGlyT2Zmc2V0PXRoaXMucmVhZGVyLnJlYWRJbnQoNCksdGhpcy56aXBDb21tZW50TGVuZ3RoPXRoaXMucmVhZGVyLnJlYWRJbnQoMik7dmFyIHQ9dGhpcy5yZWFkZXIucmVhZERhdGEodGhpcy56aXBDb21tZW50TGVuZ3RoKSxlPW8udWludDhhcnJheT9cInVpbnQ4YXJyYXlcIjpcImFycmF5XCIscj1uLnRyYW5zZm9ybVRvKGUsdCk7dGhpcy56aXBDb21tZW50PXRoaXMubG9hZE9wdGlvbnMuZGVjb2RlRmlsZU5hbWUocil9LHJlYWRCbG9ja1ppcDY0RW5kT2ZDZW50cmFsOmZ1bmN0aW9uKCl7dGhpcy56aXA2NEVuZE9mQ2VudHJhbFNpemU9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLnJlYWRlci5za2lwKDQpLHRoaXMuZGlza051bWJlcj10aGlzLnJlYWRlci5yZWFkSW50KDQpLHRoaXMuZGlza1dpdGhDZW50cmFsRGlyU3RhcnQ9dGhpcy5yZWFkZXIucmVhZEludCg0KSx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzT25UaGlzRGlzaz10aGlzLnJlYWRlci5yZWFkSW50KDgpLHRoaXMuY2VudHJhbERpclJlY29yZHM9dGhpcy5yZWFkZXIucmVhZEludCg4KSx0aGlzLmNlbnRyYWxEaXJTaXplPXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy5jZW50cmFsRGlyT2Zmc2V0PXRoaXMucmVhZGVyLnJlYWRJbnQoOCksdGhpcy56aXA2NEV4dGVuc2libGVEYXRhPXt9O2Zvcih2YXIgdCxlLHIsaT10aGlzLnppcDY0RW5kT2ZDZW50cmFsU2l6ZS00NDswPGk7KXQ9dGhpcy5yZWFkZXIucmVhZEludCgyKSxlPXRoaXMucmVhZGVyLnJlYWRJbnQoNCkscj10aGlzLnJlYWRlci5yZWFkRGF0YShlKSx0aGlzLnppcDY0RXh0ZW5zaWJsZURhdGFbdF09e2lkOnQsbGVuZ3RoOmUsdmFsdWU6cn19LHJlYWRCbG9ja1ppcDY0RW5kT2ZDZW50cmFsTG9jYXRvcjpmdW5jdGlvbigpe2lmKHRoaXMuZGlza1dpdGhaaXA2NENlbnRyYWxEaXJTdGFydD10aGlzLnJlYWRlci5yZWFkSW50KDQpLHRoaXMucmVsYXRpdmVPZmZzZXRFbmRPZlppcDY0Q2VudHJhbERpcj10aGlzLnJlYWRlci5yZWFkSW50KDgpLHRoaXMuZGlza3NDb3VudD10aGlzLnJlYWRlci5yZWFkSW50KDQpLDE8dGhpcy5kaXNrc0NvdW50KXRocm93IG5ldyBFcnJvcihcIk11bHRpLXZvbHVtZXMgemlwIGFyZSBub3Qgc3VwcG9ydGVkXCIpfSxyZWFkTG9jYWxGaWxlczpmdW5jdGlvbigpe3ZhciB0LGU7Zm9yKHQ9MDt0PHRoaXMuZmlsZXMubGVuZ3RoO3QrKyllPXRoaXMuZmlsZXNbdF0sdGhpcy5yZWFkZXIuc2V0SW5kZXgoZS5sb2NhbEhlYWRlck9mZnNldCksdGhpcy5jaGVja1NpZ25hdHVyZShzLkxPQ0FMX0ZJTEVfSEVBREVSKSxlLnJlYWRMb2NhbFBhcnQodGhpcy5yZWFkZXIpLGUuaGFuZGxlVVRGOCgpLGUucHJvY2Vzc0F0dHJpYnV0ZXMoKX0scmVhZENlbnRyYWxEaXI6ZnVuY3Rpb24oKXt2YXIgdDtmb3IodGhpcy5yZWFkZXIuc2V0SW5kZXgodGhpcy5jZW50cmFsRGlyT2Zmc2V0KTt0aGlzLnJlYWRlci5yZWFkQW5kQ2hlY2tTaWduYXR1cmUocy5DRU5UUkFMX0ZJTEVfSEVBREVSKTspKHQ9bmV3IGEoe3ppcDY0OnRoaXMuemlwNjR9LHRoaXMubG9hZE9wdGlvbnMpKS5yZWFkQ2VudHJhbFBhcnQodGhpcy5yZWFkZXIpLHRoaXMuZmlsZXMucHVzaCh0KTtpZih0aGlzLmNlbnRyYWxEaXJSZWNvcmRzIT09dGhpcy5maWxlcy5sZW5ndGgmJjAhPT10aGlzLmNlbnRyYWxEaXJSZWNvcmRzJiYwPT09dGhpcy5maWxlcy5sZW5ndGgpdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcCBvciBidWc6IGV4cGVjdGVkIFwiK3RoaXMuY2VudHJhbERpclJlY29yZHMrXCIgcmVjb3JkcyBpbiBjZW50cmFsIGRpciwgZ290IFwiK3RoaXMuZmlsZXMubGVuZ3RoKX0scmVhZEVuZE9mQ2VudHJhbDpmdW5jdGlvbigpe3ZhciB0PXRoaXMucmVhZGVyLmxhc3RJbmRleE9mU2lnbmF0dXJlKHMuQ0VOVFJBTF9ESVJFQ1RPUllfRU5EKTtpZih0PDApdGhyb3chdGhpcy5pc1NpZ25hdHVyZSgwLHMuTE9DQUxfRklMRV9IRUFERVIpP25ldyBFcnJvcihcIkNhbid0IGZpbmQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5IDogaXMgdGhpcyBhIHppcCBmaWxlID8gSWYgaXQgaXMsIHNlZSBodHRwczovL3N0dWsuZ2l0aHViLmlvL2pzemlwL2RvY3VtZW50YXRpb24vaG93dG8vcmVhZF96aXAuaHRtbFwiKTpuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwOiBjYW4ndCBmaW5kIGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeVwiKTt0aGlzLnJlYWRlci5zZXRJbmRleCh0KTt2YXIgZT10O2lmKHRoaXMuY2hlY2tTaWduYXR1cmUocy5DRU5UUkFMX0RJUkVDVE9SWV9FTkQpLHRoaXMucmVhZEJsb2NrRW5kT2ZDZW50cmFsKCksdGhpcy5kaXNrTnVtYmVyPT09bi5NQVhfVkFMVUVfMTZCSVRTfHx0aGlzLmRpc2tXaXRoQ2VudHJhbERpclN0YXJ0PT09bi5NQVhfVkFMVUVfMTZCSVRTfHx0aGlzLmNlbnRyYWxEaXJSZWNvcmRzT25UaGlzRGlzaz09PW4uTUFYX1ZBTFVFXzE2QklUU3x8dGhpcy5jZW50cmFsRGlyUmVjb3Jkcz09PW4uTUFYX1ZBTFVFXzE2QklUU3x8dGhpcy5jZW50cmFsRGlyU2l6ZT09PW4uTUFYX1ZBTFVFXzMyQklUU3x8dGhpcy5jZW50cmFsRGlyT2Zmc2V0PT09bi5NQVhfVkFMVUVfMzJCSVRTKXtpZih0aGlzLnppcDY0PSEwLCh0PXRoaXMucmVhZGVyLmxhc3RJbmRleE9mU2lnbmF0dXJlKHMuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfTE9DQVRPUikpPDApdGhyb3cgbmV3IEVycm9yKFwiQ29ycnVwdGVkIHppcDogY2FuJ3QgZmluZCB0aGUgWklQNjQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5IGxvY2F0b3JcIik7aWYodGhpcy5yZWFkZXIuc2V0SW5kZXgodCksdGhpcy5jaGVja1NpZ25hdHVyZShzLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0xPQ0FUT1IpLHRoaXMucmVhZEJsb2NrWmlwNjRFbmRPZkNlbnRyYWxMb2NhdG9yKCksIXRoaXMuaXNTaWduYXR1cmUodGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyLHMuWklQNjRfQ0VOVFJBTF9ESVJFQ1RPUllfRU5EKSYmKHRoaXMucmVsYXRpdmVPZmZzZXRFbmRPZlppcDY0Q2VudHJhbERpcj10aGlzLnJlYWRlci5sYXN0SW5kZXhPZlNpZ25hdHVyZShzLlpJUDY0X0NFTlRSQUxfRElSRUNUT1JZX0VORCksdGhpcy5yZWxhdGl2ZU9mZnNldEVuZE9mWmlwNjRDZW50cmFsRGlyPDApKXRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXA6IGNhbid0IGZpbmQgdGhlIFpJUDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeVwiKTt0aGlzLnJlYWRlci5zZXRJbmRleCh0aGlzLnJlbGF0aXZlT2Zmc2V0RW5kT2ZaaXA2NENlbnRyYWxEaXIpLHRoaXMuY2hlY2tTaWduYXR1cmUocy5aSVA2NF9DRU5UUkFMX0RJUkVDVE9SWV9FTkQpLHRoaXMucmVhZEJsb2NrWmlwNjRFbmRPZkNlbnRyYWwoKX12YXIgcj10aGlzLmNlbnRyYWxEaXJPZmZzZXQrdGhpcy5jZW50cmFsRGlyU2l6ZTt0aGlzLnppcDY0JiYocis9MjAscis9MTIrdGhpcy56aXA2NEVuZE9mQ2VudHJhbFNpemUpO3ZhciBpPWUtcjtpZigwPGkpdGhpcy5pc1NpZ25hdHVyZShlLHMuQ0VOVFJBTF9GSUxFX0hFQURFUil8fCh0aGlzLnJlYWRlci56ZXJvPWkpO2Vsc2UgaWYoaTwwKXRocm93IG5ldyBFcnJvcihcIkNvcnJ1cHRlZCB6aXA6IG1pc3NpbmcgXCIrTWF0aC5hYnMoaSkrXCIgYnl0ZXMuXCIpfSxwcmVwYXJlUmVhZGVyOmZ1bmN0aW9uKHQpe3RoaXMucmVhZGVyPWkodCl9LGxvYWQ6ZnVuY3Rpb24odCl7dGhpcy5wcmVwYXJlUmVhZGVyKHQpLHRoaXMucmVhZEVuZE9mQ2VudHJhbCgpLHRoaXMucmVhZENlbnRyYWxEaXIoKSx0aGlzLnJlYWRMb2NhbEZpbGVzKCl9fSxlLmV4cG9ydHM9aH0se1wiLi9yZWFkZXIvcmVhZGVyRm9yXCI6MjIsXCIuL3NpZ25hdHVyZVwiOjIzLFwiLi9zdXBwb3J0XCI6MzAsXCIuL3V0ZjhcIjozMSxcIi4vdXRpbHNcIjozMixcIi4vemlwRW50cnlcIjozNH1dLDM0OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGk9dChcIi4vcmVhZGVyL3JlYWRlckZvclwiKSxzPXQoXCIuL3V0aWxzXCIpLG49dChcIi4vY29tcHJlc3NlZE9iamVjdFwiKSxhPXQoXCIuL2NyYzMyXCIpLG89dChcIi4vdXRmOFwiKSxoPXQoXCIuL2NvbXByZXNzaW9uc1wiKSx1PXQoXCIuL3N1cHBvcnRcIik7ZnVuY3Rpb24gbCh0LGUpe3RoaXMub3B0aW9ucz10LHRoaXMubG9hZE9wdGlvbnM9ZX1sLnByb3RvdHlwZT17aXNFbmNyeXB0ZWQ6ZnVuY3Rpb24oKXtyZXR1cm4gMT09KDEmdGhpcy5iaXRGbGFnKX0sdXNlVVRGODpmdW5jdGlvbigpe3JldHVybiAyMDQ4PT0oMjA0OCZ0aGlzLmJpdEZsYWcpfSxyZWFkTG9jYWxQYXJ0OmZ1bmN0aW9uKHQpe3ZhciBlLHI7aWYodC5za2lwKDIyKSx0aGlzLmZpbGVOYW1lTGVuZ3RoPXQucmVhZEludCgyKSxyPXQucmVhZEludCgyKSx0aGlzLmZpbGVOYW1lPXQucmVhZERhdGEodGhpcy5maWxlTmFtZUxlbmd0aCksdC5za2lwKHIpLC0xPT09dGhpcy5jb21wcmVzc2VkU2l6ZXx8LTE9PT10aGlzLnVuY29tcHJlc3NlZFNpemUpdGhyb3cgbmV3IEVycm9yKFwiQnVnIG9yIGNvcnJ1cHRlZCB6aXAgOiBkaWRuJ3QgZ2V0IGVub3VnaCBpbmZvcm1hdGlvbiBmcm9tIHRoZSBjZW50cmFsIGRpcmVjdG9yeSAoY29tcHJlc3NlZFNpemUgPT09IC0xIHx8IHVuY29tcHJlc3NlZFNpemUgPT09IC0xKVwiKTtpZihudWxsPT09KGU9ZnVuY3Rpb24odCl7Zm9yKHZhciBlIGluIGgpaWYoaC5oYXNPd25Qcm9wZXJ0eShlKSYmaFtlXS5tYWdpYz09PXQpcmV0dXJuIGhbZV07cmV0dXJuIG51bGx9KHRoaXMuY29tcHJlc3Npb25NZXRob2QpKSl0aHJvdyBuZXcgRXJyb3IoXCJDb3JydXB0ZWQgemlwIDogY29tcHJlc3Npb24gXCIrcy5wcmV0dHkodGhpcy5jb21wcmVzc2lvbk1ldGhvZCkrXCIgdW5rbm93biAoaW5uZXIgZmlsZSA6IFwiK3MudHJhbnNmb3JtVG8oXCJzdHJpbmdcIix0aGlzLmZpbGVOYW1lKStcIilcIik7dGhpcy5kZWNvbXByZXNzZWQ9bmV3IG4odGhpcy5jb21wcmVzc2VkU2l6ZSx0aGlzLnVuY29tcHJlc3NlZFNpemUsdGhpcy5jcmMzMixlLHQucmVhZERhdGEodGhpcy5jb21wcmVzc2VkU2l6ZSkpfSxyZWFkQ2VudHJhbFBhcnQ6ZnVuY3Rpb24odCl7dGhpcy52ZXJzaW9uTWFkZUJ5PXQucmVhZEludCgyKSx0LnNraXAoMiksdGhpcy5iaXRGbGFnPXQucmVhZEludCgyKSx0aGlzLmNvbXByZXNzaW9uTWV0aG9kPXQucmVhZFN0cmluZygyKSx0aGlzLmRhdGU9dC5yZWFkRGF0ZSgpLHRoaXMuY3JjMzI9dC5yZWFkSW50KDQpLHRoaXMuY29tcHJlc3NlZFNpemU9dC5yZWFkSW50KDQpLHRoaXMudW5jb21wcmVzc2VkU2l6ZT10LnJlYWRJbnQoNCk7dmFyIGU9dC5yZWFkSW50KDIpO2lmKHRoaXMuZXh0cmFGaWVsZHNMZW5ndGg9dC5yZWFkSW50KDIpLHRoaXMuZmlsZUNvbW1lbnRMZW5ndGg9dC5yZWFkSW50KDIpLHRoaXMuZGlza051bWJlclN0YXJ0PXQucmVhZEludCgyKSx0aGlzLmludGVybmFsRmlsZUF0dHJpYnV0ZXM9dC5yZWFkSW50KDIpLHRoaXMuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcz10LnJlYWRJbnQoNCksdGhpcy5sb2NhbEhlYWRlck9mZnNldD10LnJlYWRJbnQoNCksdGhpcy5pc0VuY3J5cHRlZCgpKXRocm93IG5ldyBFcnJvcihcIkVuY3J5cHRlZCB6aXAgYXJlIG5vdCBzdXBwb3J0ZWRcIik7dC5za2lwKGUpLHRoaXMucmVhZEV4dHJhRmllbGRzKHQpLHRoaXMucGFyc2VaSVA2NEV4dHJhRmllbGQodCksdGhpcy5maWxlQ29tbWVudD10LnJlYWREYXRhKHRoaXMuZmlsZUNvbW1lbnRMZW5ndGgpfSxwcm9jZXNzQXR0cmlidXRlczpmdW5jdGlvbigpe3RoaXMudW5peFBlcm1pc3Npb25zPW51bGwsdGhpcy5kb3NQZXJtaXNzaW9ucz1udWxsO3ZhciB0PXRoaXMudmVyc2lvbk1hZGVCeT4+ODt0aGlzLmRpcj0hISgxNiZ0aGlzLmV4dGVybmFsRmlsZUF0dHJpYnV0ZXMpLDA9PXQmJih0aGlzLmRvc1Blcm1pc3Npb25zPTYzJnRoaXMuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcyksMz09dCYmKHRoaXMudW5peFBlcm1pc3Npb25zPXRoaXMuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcz4+MTYmNjU1MzUpLHRoaXMuZGlyfHxcIi9cIiE9PXRoaXMuZmlsZU5hbWVTdHIuc2xpY2UoLTEpfHwodGhpcy5kaXI9ITApfSxwYXJzZVpJUDY0RXh0cmFGaWVsZDpmdW5jdGlvbih0KXtpZih0aGlzLmV4dHJhRmllbGRzWzFdKXt2YXIgZT1pKHRoaXMuZXh0cmFGaWVsZHNbMV0udmFsdWUpO3RoaXMudW5jb21wcmVzc2VkU2l6ZT09PXMuTUFYX1ZBTFVFXzMyQklUUyYmKHRoaXMudW5jb21wcmVzc2VkU2l6ZT1lLnJlYWRJbnQoOCkpLHRoaXMuY29tcHJlc3NlZFNpemU9PT1zLk1BWF9WQUxVRV8zMkJJVFMmJih0aGlzLmNvbXByZXNzZWRTaXplPWUucmVhZEludCg4KSksdGhpcy5sb2NhbEhlYWRlck9mZnNldD09PXMuTUFYX1ZBTFVFXzMyQklUUyYmKHRoaXMubG9jYWxIZWFkZXJPZmZzZXQ9ZS5yZWFkSW50KDgpKSx0aGlzLmRpc2tOdW1iZXJTdGFydD09PXMuTUFYX1ZBTFVFXzMyQklUUyYmKHRoaXMuZGlza051bWJlclN0YXJ0PWUucmVhZEludCg0KSl9fSxyZWFkRXh0cmFGaWVsZHM6ZnVuY3Rpb24odCl7dmFyIGUscixpLG49dC5pbmRleCt0aGlzLmV4dHJhRmllbGRzTGVuZ3RoO2Zvcih0aGlzLmV4dHJhRmllbGRzfHwodGhpcy5leHRyYUZpZWxkcz17fSk7dC5pbmRleCs0PG47KWU9dC5yZWFkSW50KDIpLHI9dC5yZWFkSW50KDIpLGk9dC5yZWFkRGF0YShyKSx0aGlzLmV4dHJhRmllbGRzW2VdPXtpZDplLGxlbmd0aDpyLHZhbHVlOml9O3Quc2V0SW5kZXgobil9LGhhbmRsZVVURjg6ZnVuY3Rpb24oKXt2YXIgdD11LnVpbnQ4YXJyYXk/XCJ1aW50OGFycmF5XCI6XCJhcnJheVwiO2lmKHRoaXMudXNlVVRGOCgpKXRoaXMuZmlsZU5hbWVTdHI9by51dGY4ZGVjb2RlKHRoaXMuZmlsZU5hbWUpLHRoaXMuZmlsZUNvbW1lbnRTdHI9by51dGY4ZGVjb2RlKHRoaXMuZmlsZUNvbW1lbnQpO2Vsc2V7dmFyIGU9dGhpcy5maW5kRXh0cmFGaWVsZFVuaWNvZGVQYXRoKCk7aWYobnVsbCE9PWUpdGhpcy5maWxlTmFtZVN0cj1lO2Vsc2V7dmFyIHI9cy50cmFuc2Zvcm1Ubyh0LHRoaXMuZmlsZU5hbWUpO3RoaXMuZmlsZU5hbWVTdHI9dGhpcy5sb2FkT3B0aW9ucy5kZWNvZGVGaWxlTmFtZShyKX12YXIgaT10aGlzLmZpbmRFeHRyYUZpZWxkVW5pY29kZUNvbW1lbnQoKTtpZihudWxsIT09aSl0aGlzLmZpbGVDb21tZW50U3RyPWk7ZWxzZXt2YXIgbj1zLnRyYW5zZm9ybVRvKHQsdGhpcy5maWxlQ29tbWVudCk7dGhpcy5maWxlQ29tbWVudFN0cj10aGlzLmxvYWRPcHRpb25zLmRlY29kZUZpbGVOYW1lKG4pfX19LGZpbmRFeHRyYUZpZWxkVW5pY29kZVBhdGg6ZnVuY3Rpb24oKXt2YXIgdD10aGlzLmV4dHJhRmllbGRzWzI4Nzg5XTtpZih0KXt2YXIgZT1pKHQudmFsdWUpO3JldHVybiAxIT09ZS5yZWFkSW50KDEpP251bGw6YSh0aGlzLmZpbGVOYW1lKSE9PWUucmVhZEludCg0KT9udWxsOm8udXRmOGRlY29kZShlLnJlYWREYXRhKHQubGVuZ3RoLTUpKX1yZXR1cm4gbnVsbH0sZmluZEV4dHJhRmllbGRVbmljb2RlQ29tbWVudDpmdW5jdGlvbigpe3ZhciB0PXRoaXMuZXh0cmFGaWVsZHNbMjU0NjFdO2lmKHQpe3ZhciBlPWkodC52YWx1ZSk7cmV0dXJuIDEhPT1lLnJlYWRJbnQoMSk/bnVsbDphKHRoaXMuZmlsZUNvbW1lbnQpIT09ZS5yZWFkSW50KDQpP251bGw6by51dGY4ZGVjb2RlKGUucmVhZERhdGEodC5sZW5ndGgtNSkpfXJldHVybiBudWxsfX0sZS5leHBvcnRzPWx9LHtcIi4vY29tcHJlc3NlZE9iamVjdFwiOjIsXCIuL2NvbXByZXNzaW9uc1wiOjMsXCIuL2NyYzMyXCI6NCxcIi4vcmVhZGVyL3JlYWRlckZvclwiOjIyLFwiLi9zdXBwb3J0XCI6MzAsXCIuL3V0ZjhcIjozMSxcIi4vdXRpbHNcIjozMn1dLDM1OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gaSh0LGUscil7dGhpcy5uYW1lPXQsdGhpcy5kaXI9ci5kaXIsdGhpcy5kYXRlPXIuZGF0ZSx0aGlzLmNvbW1lbnQ9ci5jb21tZW50LHRoaXMudW5peFBlcm1pc3Npb25zPXIudW5peFBlcm1pc3Npb25zLHRoaXMuZG9zUGVybWlzc2lvbnM9ci5kb3NQZXJtaXNzaW9ucyx0aGlzLl9kYXRhPWUsdGhpcy5fZGF0YUJpbmFyeT1yLmJpbmFyeSx0aGlzLm9wdGlvbnM9e2NvbXByZXNzaW9uOnIuY29tcHJlc3Npb24sY29tcHJlc3Npb25PcHRpb25zOnIuY29tcHJlc3Npb25PcHRpb25zfX12YXIgcz10KFwiLi9zdHJlYW0vU3RyZWFtSGVscGVyXCIpLG49dChcIi4vc3RyZWFtL0RhdGFXb3JrZXJcIiksYT10KFwiLi91dGY4XCIpLG89dChcIi4vY29tcHJlc3NlZE9iamVjdFwiKSxoPXQoXCIuL3N0cmVhbS9HZW5lcmljV29ya2VyXCIpO2kucHJvdG90eXBlPXtpbnRlcm5hbFN0cmVhbTpmdW5jdGlvbih0KXt2YXIgZT1udWxsLHI9XCJzdHJpbmdcIjt0cnl7aWYoIXQpdGhyb3cgbmV3IEVycm9yKFwiTm8gb3V0cHV0IHR5cGUgc3BlY2lmaWVkLlwiKTt2YXIgaT1cInN0cmluZ1wiPT09KHI9dC50b0xvd2VyQ2FzZSgpKXx8XCJ0ZXh0XCI9PT1yO1wiYmluYXJ5c3RyaW5nXCIhPT1yJiZcInRleHRcIiE9PXJ8fChyPVwic3RyaW5nXCIpLGU9dGhpcy5fZGVjb21wcmVzc1dvcmtlcigpO3ZhciBuPSF0aGlzLl9kYXRhQmluYXJ5O24mJiFpJiYoZT1lLnBpcGUobmV3IGEuVXRmOEVuY29kZVdvcmtlcikpLCFuJiZpJiYoZT1lLnBpcGUobmV3IGEuVXRmOERlY29kZVdvcmtlcikpfWNhdGNoKHQpeyhlPW5ldyBoKFwiZXJyb3JcIikpLmVycm9yKHQpfXJldHVybiBuZXcgcyhlLHIsXCJcIil9LGFzeW5jOmZ1bmN0aW9uKHQsZSl7cmV0dXJuIHRoaXMuaW50ZXJuYWxTdHJlYW0odCkuYWNjdW11bGF0ZShlKX0sbm9kZVN0cmVhbTpmdW5jdGlvbih0LGUpe3JldHVybiB0aGlzLmludGVybmFsU3RyZWFtKHR8fFwibm9kZWJ1ZmZlclwiKS50b05vZGVqc1N0cmVhbShlKX0sX2NvbXByZXNzV29ya2VyOmZ1bmN0aW9uKHQsZSl7aWYodGhpcy5fZGF0YSBpbnN0YW5jZW9mIG8mJnRoaXMuX2RhdGEuY29tcHJlc3Npb24ubWFnaWM9PT10Lm1hZ2ljKXJldHVybiB0aGlzLl9kYXRhLmdldENvbXByZXNzZWRXb3JrZXIoKTt2YXIgcj10aGlzLl9kZWNvbXByZXNzV29ya2VyKCk7cmV0dXJuIHRoaXMuX2RhdGFCaW5hcnl8fChyPXIucGlwZShuZXcgYS5VdGY4RW5jb2RlV29ya2VyKSksby5jcmVhdGVXb3JrZXJGcm9tKHIsdCxlKX0sX2RlY29tcHJlc3NXb3JrZXI6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fZGF0YSBpbnN0YW5jZW9mIG8/dGhpcy5fZGF0YS5nZXRDb250ZW50V29ya2VyKCk6dGhpcy5fZGF0YSBpbnN0YW5jZW9mIGg/dGhpcy5fZGF0YTpuZXcgbih0aGlzLl9kYXRhKX19O2Zvcih2YXIgdT1bXCJhc1RleHRcIixcImFzQmluYXJ5XCIsXCJhc05vZGVCdWZmZXJcIixcImFzVWludDhBcnJheVwiLFwiYXNBcnJheUJ1ZmZlclwiXSxsPWZ1bmN0aW9uKCl7dGhyb3cgbmV3IEVycm9yKFwiVGhpcyBtZXRob2QgaGFzIGJlZW4gcmVtb3ZlZCBpbiBKU1ppcCAzLjAsIHBsZWFzZSBjaGVjayB0aGUgdXBncmFkZSBndWlkZS5cIil9LGY9MDtmPHUubGVuZ3RoO2YrKylpLnByb3RvdHlwZVt1W2ZdXT1sO2UuZXhwb3J0cz1pfSx7XCIuL2NvbXByZXNzZWRPYmplY3RcIjoyLFwiLi9zdHJlYW0vRGF0YVdvcmtlclwiOjI3LFwiLi9zdHJlYW0vR2VuZXJpY1dvcmtlclwiOjI4LFwiLi9zdHJlYW0vU3RyZWFtSGVscGVyXCI6MjksXCIuL3V0ZjhcIjozMX1dLDM2OltmdW5jdGlvbih0LGwsZSl7KGZ1bmN0aW9uKGUpe1widXNlIHN0cmljdFwiO3ZhciByLGksdD1lLk11dGF0aW9uT2JzZXJ2ZXJ8fGUuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtpZih0KXt2YXIgbj0wLHM9bmV3IHQodSksYT1lLmRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO3Mub2JzZXJ2ZShhLHtjaGFyYWN0ZXJEYXRhOiEwfSkscj1mdW5jdGlvbigpe2EuZGF0YT1uPSsrbiUyfX1lbHNlIGlmKGUuc2V0SW1tZWRpYXRlfHx2b2lkIDA9PT1lLk1lc3NhZ2VDaGFubmVsKXI9XCJkb2N1bWVudFwiaW4gZSYmXCJvbnJlYWR5c3RhdGVjaGFuZ2VcImluIGUuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKT9mdW5jdGlvbigpe3ZhciB0PWUuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTt0Lm9ucmVhZHlzdGF0ZWNoYW5nZT1mdW5jdGlvbigpe3UoKSx0Lm9ucmVhZHlzdGF0ZWNoYW5nZT1udWxsLHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0KSx0PW51bGx9LGUuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKHQpfTpmdW5jdGlvbigpe3NldFRpbWVvdXQodSwwKX07ZWxzZXt2YXIgbz1uZXcgZS5NZXNzYWdlQ2hhbm5lbDtvLnBvcnQxLm9ubWVzc2FnZT11LHI9ZnVuY3Rpb24oKXtvLnBvcnQyLnBvc3RNZXNzYWdlKDApfX12YXIgaD1bXTtmdW5jdGlvbiB1KCl7dmFyIHQsZTtpPSEwO2Zvcih2YXIgcj1oLmxlbmd0aDtyOyl7Zm9yKGU9aCxoPVtdLHQ9LTE7Kyt0PHI7KWVbdF0oKTtyPWgubGVuZ3RofWk9ITF9bC5leHBvcnRzPWZ1bmN0aW9uKHQpezEhPT1oLnB1c2godCl8fGl8fHIoKX19KS5jYWxsKHRoaXMsXCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9nbG9iYWw6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp7fSl9LHt9XSwzNzpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBuPXQoXCJpbW1lZGlhdGVcIik7ZnVuY3Rpb24gdSgpe312YXIgbD17fSxzPVtcIlJFSkVDVEVEXCJdLGE9W1wiRlVMRklMTEVEXCJdLGk9W1wiUEVORElOR1wiXTtmdW5jdGlvbiBvKHQpe2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIHQpdGhyb3cgbmV3IFR5cGVFcnJvcihcInJlc29sdmVyIG11c3QgYmUgYSBmdW5jdGlvblwiKTt0aGlzLnN0YXRlPWksdGhpcy5xdWV1ZT1bXSx0aGlzLm91dGNvbWU9dm9pZCAwLHQhPT11JiZjKHRoaXMsdCl9ZnVuY3Rpb24gaCh0LGUscil7dGhpcy5wcm9taXNlPXQsXCJmdW5jdGlvblwiPT10eXBlb2YgZSYmKHRoaXMub25GdWxmaWxsZWQ9ZSx0aGlzLmNhbGxGdWxmaWxsZWQ9dGhpcy5vdGhlckNhbGxGdWxmaWxsZWQpLFwiZnVuY3Rpb25cIj09dHlwZW9mIHImJih0aGlzLm9uUmVqZWN0ZWQ9cix0aGlzLmNhbGxSZWplY3RlZD10aGlzLm90aGVyQ2FsbFJlamVjdGVkKX1mdW5jdGlvbiBmKGUscixpKXtuKGZ1bmN0aW9uKCl7dmFyIHQ7dHJ5e3Q9cihpKX1jYXRjaCh0KXtyZXR1cm4gbC5yZWplY3QoZSx0KX10PT09ZT9sLnJlamVjdChlLG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVzb2x2ZSBwcm9taXNlIHdpdGggaXRzZWxmXCIpKTpsLnJlc29sdmUoZSx0KX0pfWZ1bmN0aW9uIGQodCl7dmFyIGU9dCYmdC50aGVuO2lmKHQmJihcIm9iamVjdFwiPT10eXBlb2YgdHx8XCJmdW5jdGlvblwiPT10eXBlb2YgdCkmJlwiZnVuY3Rpb25cIj09dHlwZW9mIGUpcmV0dXJuIGZ1bmN0aW9uKCl7ZS5hcHBseSh0LGFyZ3VtZW50cyl9fWZ1bmN0aW9uIGMoZSx0KXt2YXIgcj0hMTtmdW5jdGlvbiBpKHQpe3J8fChyPSEwLGwucmVqZWN0KGUsdCkpfWZ1bmN0aW9uIG4odCl7cnx8KHI9ITAsbC5yZXNvbHZlKGUsdCkpfXZhciBzPXAoZnVuY3Rpb24oKXt0KG4saSl9KTtcImVycm9yXCI9PT1zLnN0YXR1cyYmaShzLnZhbHVlKX1mdW5jdGlvbiBwKHQsZSl7dmFyIHI9e307dHJ5e3IudmFsdWU9dChlKSxyLnN0YXR1cz1cInN1Y2Nlc3NcIn1jYXRjaCh0KXtyLnN0YXR1cz1cImVycm9yXCIsci52YWx1ZT10fXJldHVybiByfShlLmV4cG9ydHM9bykucHJvdG90eXBlLmZpbmFsbHk9ZnVuY3Rpb24oZSl7aWYoXCJmdW5jdGlvblwiIT10eXBlb2YgZSlyZXR1cm4gdGhpczt2YXIgcj10aGlzLmNvbnN0cnVjdG9yO3JldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24odCl7cmV0dXJuIHIucmVzb2x2ZShlKCkpLnRoZW4oZnVuY3Rpb24oKXtyZXR1cm4gdH0pfSxmdW5jdGlvbih0KXtyZXR1cm4gci5yZXNvbHZlKGUoKSkudGhlbihmdW5jdGlvbigpe3Rocm93IHR9KX0pfSxvLnByb3RvdHlwZS5jYXRjaD1mdW5jdGlvbih0KXtyZXR1cm4gdGhpcy50aGVuKG51bGwsdCl9LG8ucHJvdG90eXBlLnRoZW49ZnVuY3Rpb24odCxlKXtpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiB0JiZ0aGlzLnN0YXRlPT09YXx8XCJmdW5jdGlvblwiIT10eXBlb2YgZSYmdGhpcy5zdGF0ZT09PXMpcmV0dXJuIHRoaXM7dmFyIHI9bmV3IHRoaXMuY29uc3RydWN0b3IodSk7dGhpcy5zdGF0ZSE9PWk/ZihyLHRoaXMuc3RhdGU9PT1hP3Q6ZSx0aGlzLm91dGNvbWUpOnRoaXMucXVldWUucHVzaChuZXcgaChyLHQsZSkpO3JldHVybiByfSxoLnByb3RvdHlwZS5jYWxsRnVsZmlsbGVkPWZ1bmN0aW9uKHQpe2wucmVzb2x2ZSh0aGlzLnByb21pc2UsdCl9LGgucHJvdG90eXBlLm90aGVyQ2FsbEZ1bGZpbGxlZD1mdW5jdGlvbih0KXtmKHRoaXMucHJvbWlzZSx0aGlzLm9uRnVsZmlsbGVkLHQpfSxoLnByb3RvdHlwZS5jYWxsUmVqZWN0ZWQ9ZnVuY3Rpb24odCl7bC5yZWplY3QodGhpcy5wcm9taXNlLHQpfSxoLnByb3RvdHlwZS5vdGhlckNhbGxSZWplY3RlZD1mdW5jdGlvbih0KXtmKHRoaXMucHJvbWlzZSx0aGlzLm9uUmVqZWN0ZWQsdCl9LGwucmVzb2x2ZT1mdW5jdGlvbih0LGUpe3ZhciByPXAoZCxlKTtpZihcImVycm9yXCI9PT1yLnN0YXR1cylyZXR1cm4gbC5yZWplY3QodCxyLnZhbHVlKTt2YXIgaT1yLnZhbHVlO2lmKGkpYyh0LGkpO2Vsc2V7dC5zdGF0ZT1hLHQub3V0Y29tZT1lO2Zvcih2YXIgbj0tMSxzPXQucXVldWUubGVuZ3RoOysrbjxzOyl0LnF1ZXVlW25dLmNhbGxGdWxmaWxsZWQoZSl9cmV0dXJuIHR9LGwucmVqZWN0PWZ1bmN0aW9uKHQsZSl7dC5zdGF0ZT1zLHQub3V0Y29tZT1lO2Zvcih2YXIgcj0tMSxpPXQucXVldWUubGVuZ3RoOysrcjxpOyl0LnF1ZXVlW3JdLmNhbGxSZWplY3RlZChlKTtyZXR1cm4gdH0sby5yZXNvbHZlPWZ1bmN0aW9uKHQpe2lmKHQgaW5zdGFuY2VvZiB0aGlzKXJldHVybiB0O3JldHVybiBsLnJlc29sdmUobmV3IHRoaXModSksdCl9LG8ucmVqZWN0PWZ1bmN0aW9uKHQpe3ZhciBlPW5ldyB0aGlzKHUpO3JldHVybiBsLnJlamVjdChlLHQpfSxvLmFsbD1mdW5jdGlvbih0KXt2YXIgcj10aGlzO2lmKFwiW29iamVjdCBBcnJheV1cIiE9PU9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0KSlyZXR1cm4gdGhpcy5yZWplY3QobmV3IFR5cGVFcnJvcihcIm11c3QgYmUgYW4gYXJyYXlcIikpO3ZhciBpPXQubGVuZ3RoLG49ITE7aWYoIWkpcmV0dXJuIHRoaXMucmVzb2x2ZShbXSk7dmFyIHM9bmV3IEFycmF5KGkpLGE9MCxlPS0xLG89bmV3IHRoaXModSk7Zm9yKDsrK2U8aTspaCh0W2VdLGUpO3JldHVybiBvO2Z1bmN0aW9uIGgodCxlKXtyLnJlc29sdmUodCkudGhlbihmdW5jdGlvbih0KXtzW2VdPXQsKythIT09aXx8bnx8KG49ITAsbC5yZXNvbHZlKG8scykpfSxmdW5jdGlvbih0KXtufHwobj0hMCxsLnJlamVjdChvLHQpKX0pfX0sby5yYWNlPWZ1bmN0aW9uKHQpe3ZhciBlPXRoaXM7aWYoXCJbb2JqZWN0IEFycmF5XVwiIT09T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHQpKXJldHVybiB0aGlzLnJlamVjdChuZXcgVHlwZUVycm9yKFwibXVzdCBiZSBhbiBhcnJheVwiKSk7dmFyIHI9dC5sZW5ndGgsaT0hMTtpZighcilyZXR1cm4gdGhpcy5yZXNvbHZlKFtdKTt2YXIgbj0tMSxzPW5ldyB0aGlzKHUpO2Zvcig7KytuPHI7KWE9dFtuXSxlLnJlc29sdmUoYSkudGhlbihmdW5jdGlvbih0KXtpfHwoaT0hMCxsLnJlc29sdmUocyx0KSl9LGZ1bmN0aW9uKHQpe2l8fChpPSEwLGwucmVqZWN0KHMsdCkpfSk7dmFyIGE7cmV0dXJuIHN9fSx7aW1tZWRpYXRlOjM2fV0sMzg6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgaT17fTsoMCx0KFwiLi9saWIvdXRpbHMvY29tbW9uXCIpLmFzc2lnbikoaSx0KFwiLi9saWIvZGVmbGF0ZVwiKSx0KFwiLi9saWIvaW5mbGF0ZVwiKSx0KFwiLi9saWIvemxpYi9jb25zdGFudHNcIikpLGUuZXhwb3J0cz1pfSx7XCIuL2xpYi9kZWZsYXRlXCI6MzksXCIuL2xpYi9pbmZsYXRlXCI6NDAsXCIuL2xpYi91dGlscy9jb21tb25cIjo0MSxcIi4vbGliL3psaWIvY29uc3RhbnRzXCI6NDR9XSwzOTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBhPXQoXCIuL3psaWIvZGVmbGF0ZVwiKSxvPXQoXCIuL3V0aWxzL2NvbW1vblwiKSxoPXQoXCIuL3V0aWxzL3N0cmluZ3NcIiksbj10KFwiLi96bGliL21lc3NhZ2VzXCIpLHM9dChcIi4vemxpYi96c3RyZWFtXCIpLHU9T2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxsPTAsZj0tMSxkPTAsYz04O2Z1bmN0aW9uIHAodCl7aWYoISh0aGlzIGluc3RhbmNlb2YgcCkpcmV0dXJuIG5ldyBwKHQpO3RoaXMub3B0aW9ucz1vLmFzc2lnbih7bGV2ZWw6ZixtZXRob2Q6YyxjaHVua1NpemU6MTYzODQsd2luZG93Qml0czoxNSxtZW1MZXZlbDo4LHN0cmF0ZWd5OmQsdG86XCJcIn0sdHx8e30pO3ZhciBlPXRoaXMub3B0aW9ucztlLnJhdyYmMDxlLndpbmRvd0JpdHM/ZS53aW5kb3dCaXRzPS1lLndpbmRvd0JpdHM6ZS5nemlwJiYwPGUud2luZG93Qml0cyYmZS53aW5kb3dCaXRzPDE2JiYoZS53aW5kb3dCaXRzKz0xNiksdGhpcy5lcnI9MCx0aGlzLm1zZz1cIlwiLHRoaXMuZW5kZWQ9ITEsdGhpcy5jaHVua3M9W10sdGhpcy5zdHJtPW5ldyBzLHRoaXMuc3RybS5hdmFpbF9vdXQ9MDt2YXIgcj1hLmRlZmxhdGVJbml0Mih0aGlzLnN0cm0sZS5sZXZlbCxlLm1ldGhvZCxlLndpbmRvd0JpdHMsZS5tZW1MZXZlbCxlLnN0cmF0ZWd5KTtpZihyIT09bCl0aHJvdyBuZXcgRXJyb3IobltyXSk7aWYoZS5oZWFkZXImJmEuZGVmbGF0ZVNldEhlYWRlcih0aGlzLnN0cm0sZS5oZWFkZXIpLGUuZGljdGlvbmFyeSl7dmFyIGk7aWYoaT1cInN0cmluZ1wiPT10eXBlb2YgZS5kaWN0aW9uYXJ5P2guc3RyaW5nMmJ1ZihlLmRpY3Rpb25hcnkpOlwiW29iamVjdCBBcnJheUJ1ZmZlcl1cIj09PXUuY2FsbChlLmRpY3Rpb25hcnkpP25ldyBVaW50OEFycmF5KGUuZGljdGlvbmFyeSk6ZS5kaWN0aW9uYXJ5LChyPWEuZGVmbGF0ZVNldERpY3Rpb25hcnkodGhpcy5zdHJtLGkpKSE9PWwpdGhyb3cgbmV3IEVycm9yKG5bcl0pO3RoaXMuX2RpY3Rfc2V0PSEwfX1mdW5jdGlvbiBpKHQsZSl7dmFyIHI9bmV3IHAoZSk7aWYoci5wdXNoKHQsITApLHIuZXJyKXRocm93IHIubXNnfHxuW3IuZXJyXTtyZXR1cm4gci5yZXN1bHR9cC5wcm90b3R5cGUucHVzaD1mdW5jdGlvbih0LGUpe3ZhciByLGksbj10aGlzLnN0cm0scz10aGlzLm9wdGlvbnMuY2h1bmtTaXplO2lmKHRoaXMuZW5kZWQpcmV0dXJuITE7aT1lPT09fn5lP2U6ITA9PT1lPzQ6MCxcInN0cmluZ1wiPT10eXBlb2YgdD9uLmlucHV0PWguc3RyaW5nMmJ1Zih0KTpcIltvYmplY3QgQXJyYXlCdWZmZXJdXCI9PT11LmNhbGwodCk/bi5pbnB1dD1uZXcgVWludDhBcnJheSh0KTpuLmlucHV0PXQsbi5uZXh0X2luPTAsbi5hdmFpbF9pbj1uLmlucHV0Lmxlbmd0aDtkb3tpZigwPT09bi5hdmFpbF9vdXQmJihuLm91dHB1dD1uZXcgby5CdWY4KHMpLG4ubmV4dF9vdXQ9MCxuLmF2YWlsX291dD1zKSwxIT09KHI9YS5kZWZsYXRlKG4saSkpJiZyIT09bClyZXR1cm4gdGhpcy5vbkVuZChyKSwhKHRoaXMuZW5kZWQ9ITApOzAhPT1uLmF2YWlsX291dCYmKDAhPT1uLmF2YWlsX2lufHw0IT09aSYmMiE9PWkpfHwoXCJzdHJpbmdcIj09PXRoaXMub3B0aW9ucy50bz90aGlzLm9uRGF0YShoLmJ1ZjJiaW5zdHJpbmcoby5zaHJpbmtCdWYobi5vdXRwdXQsbi5uZXh0X291dCkpKTp0aGlzLm9uRGF0YShvLnNocmlua0J1ZihuLm91dHB1dCxuLm5leHRfb3V0KSkpfXdoaWxlKCgwPG4uYXZhaWxfaW58fDA9PT1uLmF2YWlsX291dCkmJjEhPT1yKTtyZXR1cm4gND09PWk/KHI9YS5kZWZsYXRlRW5kKHRoaXMuc3RybSksdGhpcy5vbkVuZChyKSx0aGlzLmVuZGVkPSEwLHI9PT1sKToyIT09aXx8KHRoaXMub25FbmQobCksIShuLmF2YWlsX291dD0wKSl9LHAucHJvdG90eXBlLm9uRGF0YT1mdW5jdGlvbih0KXt0aGlzLmNodW5rcy5wdXNoKHQpfSxwLnByb3RvdHlwZS5vbkVuZD1mdW5jdGlvbih0KXt0PT09bCYmKFwic3RyaW5nXCI9PT10aGlzLm9wdGlvbnMudG8/dGhpcy5yZXN1bHQ9dGhpcy5jaHVua3Muam9pbihcIlwiKTp0aGlzLnJlc3VsdD1vLmZsYXR0ZW5DaHVua3ModGhpcy5jaHVua3MpKSx0aGlzLmNodW5rcz1bXSx0aGlzLmVycj10LHRoaXMubXNnPXRoaXMuc3RybS5tc2d9LHIuRGVmbGF0ZT1wLHIuZGVmbGF0ZT1pLHIuZGVmbGF0ZVJhdz1mdW5jdGlvbih0LGUpe3JldHVybihlPWV8fHt9KS5yYXc9ITAsaSh0LGUpfSxyLmd6aXA9ZnVuY3Rpb24odCxlKXtyZXR1cm4oZT1lfHx7fSkuZ3ppcD0hMCxpKHQsZSl9fSx7XCIuL3V0aWxzL2NvbW1vblwiOjQxLFwiLi91dGlscy9zdHJpbmdzXCI6NDIsXCIuL3psaWIvZGVmbGF0ZVwiOjQ2LFwiLi96bGliL21lc3NhZ2VzXCI6NTEsXCIuL3psaWIvenN0cmVhbVwiOjUzfV0sNDA6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgZD10KFwiLi96bGliL2luZmxhdGVcIiksYz10KFwiLi91dGlscy9jb21tb25cIikscD10KFwiLi91dGlscy9zdHJpbmdzXCIpLG09dChcIi4vemxpYi9jb25zdGFudHNcIiksaT10KFwiLi96bGliL21lc3NhZ2VzXCIpLG49dChcIi4vemxpYi96c3RyZWFtXCIpLHM9dChcIi4vemxpYi9nemhlYWRlclwiKSxfPU9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7ZnVuY3Rpb24gYSh0KXtpZighKHRoaXMgaW5zdGFuY2VvZiBhKSlyZXR1cm4gbmV3IGEodCk7dGhpcy5vcHRpb25zPWMuYXNzaWduKHtjaHVua1NpemU6MTYzODQsd2luZG93Qml0czowLHRvOlwiXCJ9LHR8fHt9KTt2YXIgZT10aGlzLm9wdGlvbnM7ZS5yYXcmJjA8PWUud2luZG93Qml0cyYmZS53aW5kb3dCaXRzPDE2JiYoZS53aW5kb3dCaXRzPS1lLndpbmRvd0JpdHMsMD09PWUud2luZG93Qml0cyYmKGUud2luZG93Qml0cz0tMTUpKSwhKDA8PWUud2luZG93Qml0cyYmZS53aW5kb3dCaXRzPDE2KXx8dCYmdC53aW5kb3dCaXRzfHwoZS53aW5kb3dCaXRzKz0zMiksMTU8ZS53aW5kb3dCaXRzJiZlLndpbmRvd0JpdHM8NDgmJjA9PSgxNSZlLndpbmRvd0JpdHMpJiYoZS53aW5kb3dCaXRzfD0xNSksdGhpcy5lcnI9MCx0aGlzLm1zZz1cIlwiLHRoaXMuZW5kZWQ9ITEsdGhpcy5jaHVua3M9W10sdGhpcy5zdHJtPW5ldyBuLHRoaXMuc3RybS5hdmFpbF9vdXQ9MDt2YXIgcj1kLmluZmxhdGVJbml0Mih0aGlzLnN0cm0sZS53aW5kb3dCaXRzKTtpZihyIT09bS5aX09LKXRocm93IG5ldyBFcnJvcihpW3JdKTt0aGlzLmhlYWRlcj1uZXcgcyxkLmluZmxhdGVHZXRIZWFkZXIodGhpcy5zdHJtLHRoaXMuaGVhZGVyKX1mdW5jdGlvbiBvKHQsZSl7dmFyIHI9bmV3IGEoZSk7aWYoci5wdXNoKHQsITApLHIuZXJyKXRocm93IHIubXNnfHxpW3IuZXJyXTtyZXR1cm4gci5yZXN1bHR9YS5wcm90b3R5cGUucHVzaD1mdW5jdGlvbih0LGUpe3ZhciByLGksbixzLGEsbyxoPXRoaXMuc3RybSx1PXRoaXMub3B0aW9ucy5jaHVua1NpemUsbD10aGlzLm9wdGlvbnMuZGljdGlvbmFyeSxmPSExO2lmKHRoaXMuZW5kZWQpcmV0dXJuITE7aT1lPT09fn5lP2U6ITA9PT1lP20uWl9GSU5JU0g6bS5aX05PX0ZMVVNILFwic3RyaW5nXCI9PXR5cGVvZiB0P2guaW5wdXQ9cC5iaW5zdHJpbmcyYnVmKHQpOlwiW29iamVjdCBBcnJheUJ1ZmZlcl1cIj09PV8uY2FsbCh0KT9oLmlucHV0PW5ldyBVaW50OEFycmF5KHQpOmguaW5wdXQ9dCxoLm5leHRfaW49MCxoLmF2YWlsX2luPWguaW5wdXQubGVuZ3RoO2Rve2lmKDA9PT1oLmF2YWlsX291dCYmKGgub3V0cHV0PW5ldyBjLkJ1ZjgodSksaC5uZXh0X291dD0wLGguYXZhaWxfb3V0PXUpLChyPWQuaW5mbGF0ZShoLG0uWl9OT19GTFVTSCkpPT09bS5aX05FRURfRElDVCYmbCYmKG89XCJzdHJpbmdcIj09dHlwZW9mIGw/cC5zdHJpbmcyYnVmKGwpOlwiW29iamVjdCBBcnJheUJ1ZmZlcl1cIj09PV8uY2FsbChsKT9uZXcgVWludDhBcnJheShsKTpsLHI9ZC5pbmZsYXRlU2V0RGljdGlvbmFyeSh0aGlzLnN0cm0sbykpLHI9PT1tLlpfQlVGX0VSUk9SJiYhMD09PWYmJihyPW0uWl9PSyxmPSExKSxyIT09bS5aX1NUUkVBTV9FTkQmJnIhPT1tLlpfT0spcmV0dXJuIHRoaXMub25FbmQociksISh0aGlzLmVuZGVkPSEwKTtoLm5leHRfb3V0JiYoMCE9PWguYXZhaWxfb3V0JiZyIT09bS5aX1NUUkVBTV9FTkQmJigwIT09aC5hdmFpbF9pbnx8aSE9PW0uWl9GSU5JU0gmJmkhPT1tLlpfU1lOQ19GTFVTSCl8fChcInN0cmluZ1wiPT09dGhpcy5vcHRpb25zLnRvPyhuPXAudXRmOGJvcmRlcihoLm91dHB1dCxoLm5leHRfb3V0KSxzPWgubmV4dF9vdXQtbixhPXAuYnVmMnN0cmluZyhoLm91dHB1dCxuKSxoLm5leHRfb3V0PXMsaC5hdmFpbF9vdXQ9dS1zLHMmJmMuYXJyYXlTZXQoaC5vdXRwdXQsaC5vdXRwdXQsbixzLDApLHRoaXMub25EYXRhKGEpKTp0aGlzLm9uRGF0YShjLnNocmlua0J1ZihoLm91dHB1dCxoLm5leHRfb3V0KSkpKSwwPT09aC5hdmFpbF9pbiYmMD09PWguYXZhaWxfb3V0JiYoZj0hMCl9d2hpbGUoKDA8aC5hdmFpbF9pbnx8MD09PWguYXZhaWxfb3V0KSYmciE9PW0uWl9TVFJFQU1fRU5EKTtyZXR1cm4gcj09PW0uWl9TVFJFQU1fRU5EJiYoaT1tLlpfRklOSVNIKSxpPT09bS5aX0ZJTklTSD8ocj1kLmluZmxhdGVFbmQodGhpcy5zdHJtKSx0aGlzLm9uRW5kKHIpLHRoaXMuZW5kZWQ9ITAscj09PW0uWl9PSyk6aSE9PW0uWl9TWU5DX0ZMVVNIfHwodGhpcy5vbkVuZChtLlpfT0spLCEoaC5hdmFpbF9vdXQ9MCkpfSxhLnByb3RvdHlwZS5vbkRhdGE9ZnVuY3Rpb24odCl7dGhpcy5jaHVua3MucHVzaCh0KX0sYS5wcm90b3R5cGUub25FbmQ9ZnVuY3Rpb24odCl7dD09PW0uWl9PSyYmKFwic3RyaW5nXCI9PT10aGlzLm9wdGlvbnMudG8/dGhpcy5yZXN1bHQ9dGhpcy5jaHVua3Muam9pbihcIlwiKTp0aGlzLnJlc3VsdD1jLmZsYXR0ZW5DaHVua3ModGhpcy5jaHVua3MpKSx0aGlzLmNodW5rcz1bXSx0aGlzLmVycj10LHRoaXMubXNnPXRoaXMuc3RybS5tc2d9LHIuSW5mbGF0ZT1hLHIuaW5mbGF0ZT1vLHIuaW5mbGF0ZVJhdz1mdW5jdGlvbih0LGUpe3JldHVybihlPWV8fHt9KS5yYXc9ITAsbyh0LGUpfSxyLnVuZ3ppcD1vfSx7XCIuL3V0aWxzL2NvbW1vblwiOjQxLFwiLi91dGlscy9zdHJpbmdzXCI6NDIsXCIuL3psaWIvY29uc3RhbnRzXCI6NDQsXCIuL3psaWIvZ3poZWFkZXJcIjo0NyxcIi4vemxpYi9pbmZsYXRlXCI6NDksXCIuL3psaWIvbWVzc2FnZXNcIjo1MSxcIi4vemxpYi96c3RyZWFtXCI6NTN9XSw0MTpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBpPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBVaW50OEFycmF5JiZcInVuZGVmaW5lZFwiIT10eXBlb2YgVWludDE2QXJyYXkmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBJbnQzMkFycmF5O3IuYXNzaWduPWZ1bmN0aW9uKHQpe2Zvcih2YXIgZT1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMSk7ZS5sZW5ndGg7KXt2YXIgcj1lLnNoaWZ0KCk7aWYocil7aWYoXCJvYmplY3RcIiE9dHlwZW9mIHIpdGhyb3cgbmV3IFR5cGVFcnJvcihyK1wibXVzdCBiZSBub24tb2JqZWN0XCIpO2Zvcih2YXIgaSBpbiByKXIuaGFzT3duUHJvcGVydHkoaSkmJih0W2ldPXJbaV0pfX1yZXR1cm4gdH0sci5zaHJpbmtCdWY9ZnVuY3Rpb24odCxlKXtyZXR1cm4gdC5sZW5ndGg9PT1lP3Q6dC5zdWJhcnJheT90LnN1YmFycmF5KDAsZSk6KHQubGVuZ3RoPWUsdCl9O3ZhciBuPXthcnJheVNldDpmdW5jdGlvbih0LGUscixpLG4pe2lmKGUuc3ViYXJyYXkmJnQuc3ViYXJyYXkpdC5zZXQoZS5zdWJhcnJheShyLHIraSksbik7ZWxzZSBmb3IodmFyIHM9MDtzPGk7cysrKXRbbitzXT1lW3Irc119LGZsYXR0ZW5DaHVua3M6ZnVuY3Rpb24odCl7dmFyIGUscixpLG4scyxhO2ZvcihlPWk9MCxyPXQubGVuZ3RoO2U8cjtlKyspaSs9dFtlXS5sZW5ndGg7Zm9yKGE9bmV3IFVpbnQ4QXJyYXkoaSksZT1uPTAscj10Lmxlbmd0aDtlPHI7ZSsrKXM9dFtlXSxhLnNldChzLG4pLG4rPXMubGVuZ3RoO3JldHVybiBhfX0scz17YXJyYXlTZXQ6ZnVuY3Rpb24odCxlLHIsaSxuKXtmb3IodmFyIHM9MDtzPGk7cysrKXRbbitzXT1lW3Irc119LGZsYXR0ZW5DaHVua3M6ZnVuY3Rpb24odCl7cmV0dXJuW10uY29uY2F0LmFwcGx5KFtdLHQpfX07ci5zZXRUeXBlZD1mdW5jdGlvbih0KXt0PyhyLkJ1Zjg9VWludDhBcnJheSxyLkJ1ZjE2PVVpbnQxNkFycmF5LHIuQnVmMzI9SW50MzJBcnJheSxyLmFzc2lnbihyLG4pKTooci5CdWY4PUFycmF5LHIuQnVmMTY9QXJyYXksci5CdWYzMj1BcnJheSxyLmFzc2lnbihyLHMpKX0sci5zZXRUeXBlZChpKX0se31dLDQyOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIGg9dChcIi4vY29tbW9uXCIpLG49ITAscz0hMDt0cnl7U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLFswXSl9Y2F0Y2godCl7bj0hMX10cnl7U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLG5ldyBVaW50OEFycmF5KDEpKX1jYXRjaCh0KXtzPSExfWZvcih2YXIgdT1uZXcgaC5CdWY4KDI1NiksaT0wO2k8MjU2O2krKyl1W2ldPTI1Mjw9aT82OjI0ODw9aT81OjI0MDw9aT80OjIyNDw9aT8zOjE5Mjw9aT8yOjE7ZnVuY3Rpb24gbCh0LGUpe2lmKGU8NjU1MzcmJih0LnN1YmFycmF5JiZzfHwhdC5zdWJhcnJheSYmbikpcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCxoLnNocmlua0J1Zih0LGUpKTtmb3IodmFyIHI9XCJcIixpPTA7aTxlO2krKylyKz1TdHJpbmcuZnJvbUNoYXJDb2RlKHRbaV0pO3JldHVybiByfXVbMjU0XT11WzI1NF09MSxyLnN0cmluZzJidWY9ZnVuY3Rpb24odCl7dmFyIGUscixpLG4scyxhPXQubGVuZ3RoLG89MDtmb3Iobj0wO248YTtuKyspNTUyOTY9PSg2NDUxMiYocj10LmNoYXJDb2RlQXQobikpKSYmbisxPGEmJjU2MzIwPT0oNjQ1MTImKGk9dC5jaGFyQ29kZUF0KG4rMSkpKSYmKHI9NjU1MzYrKHItNTUyOTY8PDEwKSsoaS01NjMyMCksbisrKSxvKz1yPDEyOD8xOnI8MjA0OD8yOnI8NjU1MzY/Mzo0O2ZvcihlPW5ldyBoLkJ1Zjgobyksbj1zPTA7czxvO24rKyk1NTI5Nj09KDY0NTEyJihyPXQuY2hhckNvZGVBdChuKSkpJiZuKzE8YSYmNTYzMjA9PSg2NDUxMiYoaT10LmNoYXJDb2RlQXQobisxKSkpJiYocj02NTUzNisoci01NTI5Njw8MTApKyhpLTU2MzIwKSxuKyspLHI8MTI4P2VbcysrXT1yOihyPDIwNDg/ZVtzKytdPTE5MnxyPj4+Njoocjw2NTUzNj9lW3MrK109MjI0fHI+Pj4xMjooZVtzKytdPTI0MHxyPj4+MTgsZVtzKytdPTEyOHxyPj4+MTImNjMpLGVbcysrXT0xMjh8cj4+PjYmNjMpLGVbcysrXT0xMjh8NjMmcik7cmV0dXJuIGV9LHIuYnVmMmJpbnN0cmluZz1mdW5jdGlvbih0KXtyZXR1cm4gbCh0LHQubGVuZ3RoKX0sci5iaW5zdHJpbmcyYnVmPWZ1bmN0aW9uKHQpe2Zvcih2YXIgZT1uZXcgaC5CdWY4KHQubGVuZ3RoKSxyPTAsaT1lLmxlbmd0aDtyPGk7cisrKWVbcl09dC5jaGFyQ29kZUF0KHIpO3JldHVybiBlfSxyLmJ1ZjJzdHJpbmc9ZnVuY3Rpb24odCxlKXt2YXIgcixpLG4scyxhPWV8fHQubGVuZ3RoLG89bmV3IEFycmF5KDIqYSk7Zm9yKHI9aT0wO3I8YTspaWYoKG49dFtyKytdKTwxMjgpb1tpKytdPW47ZWxzZSBpZig0PChzPXVbbl0pKW9baSsrXT02NTUzMyxyKz1zLTE7ZWxzZXtmb3IobiY9Mj09PXM/MzE6Mz09PXM/MTU6NzsxPHMmJnI8YTspbj1uPDw2fDYzJnRbcisrXSxzLS07MTxzP29baSsrXT02NTUzMzpuPDY1NTM2P29baSsrXT1uOihuLT02NTUzNixvW2krK109NTUyOTZ8bj4+MTAmMTAyMyxvW2krK109NTYzMjB8MTAyMyZuKX1yZXR1cm4gbChvLGkpfSxyLnV0Zjhib3JkZXI9ZnVuY3Rpb24odCxlKXt2YXIgcjtmb3IoKGU9ZXx8dC5sZW5ndGgpPnQubGVuZ3RoJiYoZT10Lmxlbmd0aCkscj1lLTE7MDw9ciYmMTI4PT0oMTkyJnRbcl0pOylyLS07cmV0dXJuIHI8MD9lOjA9PT1yP2U6cit1W3Rbcl1dPmU/cjplfX0se1wiLi9jb21tb25cIjo0MX1dLDQzOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZS5leHBvcnRzPWZ1bmN0aW9uKHQsZSxyLGkpe2Zvcih2YXIgbj02NTUzNSZ0fDAscz10Pj4+MTYmNjU1MzV8MCxhPTA7MCE9PXI7KXtmb3Ioci09YT0yZTM8cj8yZTM6cjtzPXMrKG49bitlW2krK118MCl8MCwtLWE7KTtuJT02NTUyMSxzJT02NTUyMX1yZXR1cm4gbnxzPDwxNnwwfX0se31dLDQ0OltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZS5leHBvcnRzPXtaX05PX0ZMVVNIOjAsWl9QQVJUSUFMX0ZMVVNIOjEsWl9TWU5DX0ZMVVNIOjIsWl9GVUxMX0ZMVVNIOjMsWl9GSU5JU0g6NCxaX0JMT0NLOjUsWl9UUkVFUzo2LFpfT0s6MCxaX1NUUkVBTV9FTkQ6MSxaX05FRURfRElDVDoyLFpfRVJSTk86LTEsWl9TVFJFQU1fRVJST1I6LTIsWl9EQVRBX0VSUk9SOi0zLFpfQlVGX0VSUk9SOi01LFpfTk9fQ09NUFJFU1NJT046MCxaX0JFU1RfU1BFRUQ6MSxaX0JFU1RfQ09NUFJFU1NJT046OSxaX0RFRkFVTFRfQ09NUFJFU1NJT046LTEsWl9GSUxURVJFRDoxLFpfSFVGRk1BTl9PTkxZOjIsWl9STEU6MyxaX0ZJWEVEOjQsWl9ERUZBVUxUX1NUUkFURUdZOjAsWl9CSU5BUlk6MCxaX1RFWFQ6MSxaX1VOS05PV046MixaX0RFRkxBVEVEOjh9fSx7fV0sNDU6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgbz1mdW5jdGlvbigpe2Zvcih2YXIgdCxlPVtdLHI9MDtyPDI1NjtyKyspe3Q9cjtmb3IodmFyIGk9MDtpPDg7aSsrKXQ9MSZ0PzM5ODgyOTIzODRedD4+PjE6dD4+PjE7ZVtyXT10fXJldHVybiBlfSgpO2UuZXhwb3J0cz1mdW5jdGlvbih0LGUscixpKXt2YXIgbj1vLHM9aStyO3RePS0xO2Zvcih2YXIgYT1pO2E8czthKyspdD10Pj4+OF5uWzI1NSYodF5lW2FdKV07cmV0dXJuLTFedH19LHt9XSw0NjpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBoLGQ9dChcIi4uL3V0aWxzL2NvbW1vblwiKSx1PXQoXCIuL3RyZWVzXCIpLGM9dChcIi4vYWRsZXIzMlwiKSxwPXQoXCIuL2NyYzMyXCIpLGk9dChcIi4vbWVzc2FnZXNcIiksbD0wLGY9NCxtPTAsXz0tMixnPS0xLGI9NCxuPTIsdj04LHk9OSxzPTI4NixhPTMwLG89MTksdz0yKnMrMSxrPTE1LHg9MyxTPTI1OCx6PVMreCsxLEM9NDIsRT0xMTMsQT0xLEk9MixPPTMsQj00O2Z1bmN0aW9uIFIodCxlKXtyZXR1cm4gdC5tc2c9aVtlXSxlfWZ1bmN0aW9uIFQodCl7cmV0dXJuKHQ8PDEpLSg0PHQ/OTowKX1mdW5jdGlvbiBEKHQpe2Zvcih2YXIgZT10Lmxlbmd0aDswPD0tLWU7KXRbZV09MH1mdW5jdGlvbiBGKHQpe3ZhciBlPXQuc3RhdGUscj1lLnBlbmRpbmc7cj50LmF2YWlsX291dCYmKHI9dC5hdmFpbF9vdXQpLDAhPT1yJiYoZC5hcnJheVNldCh0Lm91dHB1dCxlLnBlbmRpbmdfYnVmLGUucGVuZGluZ19vdXQscix0Lm5leHRfb3V0KSx0Lm5leHRfb3V0Kz1yLGUucGVuZGluZ19vdXQrPXIsdC50b3RhbF9vdXQrPXIsdC5hdmFpbF9vdXQtPXIsZS5wZW5kaW5nLT1yLDA9PT1lLnBlbmRpbmcmJihlLnBlbmRpbmdfb3V0PTApKX1mdW5jdGlvbiBOKHQsZSl7dS5fdHJfZmx1c2hfYmxvY2sodCwwPD10LmJsb2NrX3N0YXJ0P3QuYmxvY2tfc3RhcnQ6LTEsdC5zdHJzdGFydC10LmJsb2NrX3N0YXJ0LGUpLHQuYmxvY2tfc3RhcnQ9dC5zdHJzdGFydCxGKHQuc3RybSl9ZnVuY3Rpb24gVSh0LGUpe3QucGVuZGluZ19idWZbdC5wZW5kaW5nKytdPWV9ZnVuY3Rpb24gUCh0LGUpe3QucGVuZGluZ19idWZbdC5wZW5kaW5nKytdPWU+Pj44JjI1NSx0LnBlbmRpbmdfYnVmW3QucGVuZGluZysrXT0yNTUmZX1mdW5jdGlvbiBMKHQsZSl7dmFyIHIsaSxuPXQubWF4X2NoYWluX2xlbmd0aCxzPXQuc3Ryc3RhcnQsYT10LnByZXZfbGVuZ3RoLG89dC5uaWNlX21hdGNoLGg9dC5zdHJzdGFydD50Lndfc2l6ZS16P3Quc3Ryc3RhcnQtKHQud19zaXplLXopOjAsdT10LndpbmRvdyxsPXQud19tYXNrLGY9dC5wcmV2LGQ9dC5zdHJzdGFydCtTLGM9dVtzK2EtMV0scD11W3MrYV07dC5wcmV2X2xlbmd0aD49dC5nb29kX21hdGNoJiYobj4+PTIpLG8+dC5sb29rYWhlYWQmJihvPXQubG9va2FoZWFkKTtkb3tpZih1WyhyPWUpK2FdPT09cCYmdVtyK2EtMV09PT1jJiZ1W3JdPT09dVtzXSYmdVsrK3JdPT09dVtzKzFdKXtzKz0yLHIrKztkb3t9d2hpbGUodVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnVbKytzXT09PXVbKytyXSYmdVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnVbKytzXT09PXVbKytyXSYmdVsrK3NdPT09dVsrK3JdJiZ1Wysrc109PT11Wysrcl0mJnM8ZCk7aWYoaT1TLShkLXMpLHM9ZC1TLGE8aSl7aWYodC5tYXRjaF9zdGFydD1lLG88PShhPWkpKWJyZWFrO2M9dVtzK2EtMV0scD11W3MrYV19fX13aGlsZSgoZT1mW2UmbF0pPmgmJjAhPS0tbik7cmV0dXJuIGE8PXQubG9va2FoZWFkP2E6dC5sb29rYWhlYWR9ZnVuY3Rpb24gaih0KXt2YXIgZSxyLGksbixzLGEsbyxoLHUsbCxmPXQud19zaXplO2Rve2lmKG49dC53aW5kb3dfc2l6ZS10Lmxvb2thaGVhZC10LnN0cnN0YXJ0LHQuc3Ryc3RhcnQ+PWYrKGYteikpe2ZvcihkLmFycmF5U2V0KHQud2luZG93LHQud2luZG93LGYsZiwwKSx0Lm1hdGNoX3N0YXJ0LT1mLHQuc3Ryc3RhcnQtPWYsdC5ibG9ja19zdGFydC09ZixlPXI9dC5oYXNoX3NpemU7aT10LmhlYWRbLS1lXSx0LmhlYWRbZV09Zjw9aT9pLWY6MCwtLXI7KTtmb3IoZT1yPWY7aT10LnByZXZbLS1lXSx0LnByZXZbZV09Zjw9aT9pLWY6MCwtLXI7KTtuKz1mfWlmKDA9PT10LnN0cm0uYXZhaWxfaW4pYnJlYWs7aWYoYT10LnN0cm0sbz10LndpbmRvdyxoPXQuc3Ryc3RhcnQrdC5sb29rYWhlYWQsdT1uLGw9dm9pZCAwLGw9YS5hdmFpbF9pbix1PGwmJihsPXUpLHI9MD09PWw/MDooYS5hdmFpbF9pbi09bCxkLmFycmF5U2V0KG8sYS5pbnB1dCxhLm5leHRfaW4sbCxoKSwxPT09YS5zdGF0ZS53cmFwP2EuYWRsZXI9YyhhLmFkbGVyLG8sbCxoKToyPT09YS5zdGF0ZS53cmFwJiYoYS5hZGxlcj1wKGEuYWRsZXIsbyxsLGgpKSxhLm5leHRfaW4rPWwsYS50b3RhbF9pbis9bCxsKSx0Lmxvb2thaGVhZCs9cix0Lmxvb2thaGVhZCt0Lmluc2VydD49eClmb3Iocz10LnN0cnN0YXJ0LXQuaW5zZXJ0LHQuaW5zX2g9dC53aW5kb3dbc10sdC5pbnNfaD0odC5pbnNfaDw8dC5oYXNoX3NoaWZ0XnQud2luZG93W3MrMV0pJnQuaGFzaF9tYXNrO3QuaW5zZXJ0JiYodC5pbnNfaD0odC5pbnNfaDw8dC5oYXNoX3NoaWZ0XnQud2luZG93W3MreC0xXSkmdC5oYXNoX21hc2ssdC5wcmV2W3MmdC53X21hc2tdPXQuaGVhZFt0Lmluc19oXSx0LmhlYWRbdC5pbnNfaF09cyxzKyssdC5pbnNlcnQtLSwhKHQubG9va2FoZWFkK3QuaW5zZXJ0PHgpKTspO313aGlsZSh0Lmxvb2thaGVhZDx6JiYwIT09dC5zdHJtLmF2YWlsX2luKX1mdW5jdGlvbiBaKHQsZSl7Zm9yKHZhciByLGk7Oyl7aWYodC5sb29rYWhlYWQ8eil7aWYoaih0KSx0Lmxvb2thaGVhZDx6JiZlPT09bClyZXR1cm4gQTtpZigwPT09dC5sb29rYWhlYWQpYnJlYWt9aWYocj0wLHQubG9va2FoZWFkPj14JiYodC5pbnNfaD0odC5pbnNfaDw8dC5oYXNoX3NoaWZ0XnQud2luZG93W3Quc3Ryc3RhcnQreC0xXSkmdC5oYXNoX21hc2sscj10LnByZXZbdC5zdHJzdGFydCZ0LndfbWFza109dC5oZWFkW3QuaW5zX2hdLHQuaGVhZFt0Lmluc19oXT10LnN0cnN0YXJ0KSwwIT09ciYmdC5zdHJzdGFydC1yPD10Lndfc2l6ZS16JiYodC5tYXRjaF9sZW5ndGg9TCh0LHIpKSx0Lm1hdGNoX2xlbmd0aD49eClpZihpPXUuX3RyX3RhbGx5KHQsdC5zdHJzdGFydC10Lm1hdGNoX3N0YXJ0LHQubWF0Y2hfbGVuZ3RoLXgpLHQubG9va2FoZWFkLT10Lm1hdGNoX2xlbmd0aCx0Lm1hdGNoX2xlbmd0aDw9dC5tYXhfbGF6eV9tYXRjaCYmdC5sb29rYWhlYWQ+PXgpe2Zvcih0Lm1hdGNoX2xlbmd0aC0tO3Quc3Ryc3RhcnQrKyx0Lmluc19oPSh0Lmluc19oPDx0Lmhhc2hfc2hpZnRedC53aW5kb3dbdC5zdHJzdGFydCt4LTFdKSZ0Lmhhc2hfbWFzayxyPXQucHJldlt0LnN0cnN0YXJ0JnQud19tYXNrXT10LmhlYWRbdC5pbnNfaF0sdC5oZWFkW3QuaW5zX2hdPXQuc3Ryc3RhcnQsMCE9LS10Lm1hdGNoX2xlbmd0aDspO3Quc3Ryc3RhcnQrK31lbHNlIHQuc3Ryc3RhcnQrPXQubWF0Y2hfbGVuZ3RoLHQubWF0Y2hfbGVuZ3RoPTAsdC5pbnNfaD10LndpbmRvd1t0LnN0cnN0YXJ0XSx0Lmluc19oPSh0Lmluc19oPDx0Lmhhc2hfc2hpZnRedC53aW5kb3dbdC5zdHJzdGFydCsxXSkmdC5oYXNoX21hc2s7ZWxzZSBpPXUuX3RyX3RhbGx5KHQsMCx0LndpbmRvd1t0LnN0cnN0YXJ0XSksdC5sb29rYWhlYWQtLSx0LnN0cnN0YXJ0Kys7aWYoaSYmKE4odCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpKXJldHVybiBBfXJldHVybiB0Lmluc2VydD10LnN0cnN0YXJ0PHgtMT90LnN0cnN0YXJ0OngtMSxlPT09Zj8oTih0LCEwKSwwPT09dC5zdHJtLmF2YWlsX291dD9POkIpOnQubGFzdF9saXQmJihOKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KT9BOkl9ZnVuY3Rpb24gVyh0LGUpe2Zvcih2YXIgcixpLG47Oyl7aWYodC5sb29rYWhlYWQ8eil7aWYoaih0KSx0Lmxvb2thaGVhZDx6JiZlPT09bClyZXR1cm4gQTtpZigwPT09dC5sb29rYWhlYWQpYnJlYWt9aWYocj0wLHQubG9va2FoZWFkPj14JiYodC5pbnNfaD0odC5pbnNfaDw8dC5oYXNoX3NoaWZ0XnQud2luZG93W3Quc3Ryc3RhcnQreC0xXSkmdC5oYXNoX21hc2sscj10LnByZXZbdC5zdHJzdGFydCZ0LndfbWFza109dC5oZWFkW3QuaW5zX2hdLHQuaGVhZFt0Lmluc19oXT10LnN0cnN0YXJ0KSx0LnByZXZfbGVuZ3RoPXQubWF0Y2hfbGVuZ3RoLHQucHJldl9tYXRjaD10Lm1hdGNoX3N0YXJ0LHQubWF0Y2hfbGVuZ3RoPXgtMSwwIT09ciYmdC5wcmV2X2xlbmd0aDx0Lm1heF9sYXp5X21hdGNoJiZ0LnN0cnN0YXJ0LXI8PXQud19zaXplLXomJih0Lm1hdGNoX2xlbmd0aD1MKHQsciksdC5tYXRjaF9sZW5ndGg8PTUmJigxPT09dC5zdHJhdGVneXx8dC5tYXRjaF9sZW5ndGg9PT14JiY0MDk2PHQuc3Ryc3RhcnQtdC5tYXRjaF9zdGFydCkmJih0Lm1hdGNoX2xlbmd0aD14LTEpKSx0LnByZXZfbGVuZ3RoPj14JiZ0Lm1hdGNoX2xlbmd0aDw9dC5wcmV2X2xlbmd0aCl7Zm9yKG49dC5zdHJzdGFydCt0Lmxvb2thaGVhZC14LGk9dS5fdHJfdGFsbHkodCx0LnN0cnN0YXJ0LTEtdC5wcmV2X21hdGNoLHQucHJldl9sZW5ndGgteCksdC5sb29rYWhlYWQtPXQucHJldl9sZW5ndGgtMSx0LnByZXZfbGVuZ3RoLT0yOysrdC5zdHJzdGFydDw9biYmKHQuaW5zX2g9KHQuaW5zX2g8PHQuaGFzaF9zaGlmdF50LndpbmRvd1t0LnN0cnN0YXJ0K3gtMV0pJnQuaGFzaF9tYXNrLHI9dC5wcmV2W3Quc3Ryc3RhcnQmdC53X21hc2tdPXQuaGVhZFt0Lmluc19oXSx0LmhlYWRbdC5pbnNfaF09dC5zdHJzdGFydCksMCE9LS10LnByZXZfbGVuZ3RoOyk7aWYodC5tYXRjaF9hdmFpbGFibGU9MCx0Lm1hdGNoX2xlbmd0aD14LTEsdC5zdHJzdGFydCsrLGkmJihOKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gQX1lbHNlIGlmKHQubWF0Y2hfYXZhaWxhYmxlKXtpZigoaT11Ll90cl90YWxseSh0LDAsdC53aW5kb3dbdC5zdHJzdGFydC0xXSkpJiZOKHQsITEpLHQuc3Ryc3RhcnQrKyx0Lmxvb2thaGVhZC0tLDA9PT10LnN0cm0uYXZhaWxfb3V0KXJldHVybiBBfWVsc2UgdC5tYXRjaF9hdmFpbGFibGU9MSx0LnN0cnN0YXJ0KyssdC5sb29rYWhlYWQtLX1yZXR1cm4gdC5tYXRjaF9hdmFpbGFibGUmJihpPXUuX3RyX3RhbGx5KHQsMCx0LndpbmRvd1t0LnN0cnN0YXJ0LTFdKSx0Lm1hdGNoX2F2YWlsYWJsZT0wKSx0Lmluc2VydD10LnN0cnN0YXJ0PHgtMT90LnN0cnN0YXJ0OngtMSxlPT09Zj8oTih0LCEwKSwwPT09dC5zdHJtLmF2YWlsX291dD9POkIpOnQubGFzdF9saXQmJihOKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KT9BOkl9ZnVuY3Rpb24gTSh0LGUscixpLG4pe3RoaXMuZ29vZF9sZW5ndGg9dCx0aGlzLm1heF9sYXp5PWUsdGhpcy5uaWNlX2xlbmd0aD1yLHRoaXMubWF4X2NoYWluPWksdGhpcy5mdW5jPW59ZnVuY3Rpb24gSCgpe3RoaXMuc3RybT1udWxsLHRoaXMuc3RhdHVzPTAsdGhpcy5wZW5kaW5nX2J1Zj1udWxsLHRoaXMucGVuZGluZ19idWZfc2l6ZT0wLHRoaXMucGVuZGluZ19vdXQ9MCx0aGlzLnBlbmRpbmc9MCx0aGlzLndyYXA9MCx0aGlzLmd6aGVhZD1udWxsLHRoaXMuZ3ppbmRleD0wLHRoaXMubWV0aG9kPXYsdGhpcy5sYXN0X2ZsdXNoPS0xLHRoaXMud19zaXplPTAsdGhpcy53X2JpdHM9MCx0aGlzLndfbWFzaz0wLHRoaXMud2luZG93PW51bGwsdGhpcy53aW5kb3dfc2l6ZT0wLHRoaXMucHJldj1udWxsLHRoaXMuaGVhZD1udWxsLHRoaXMuaW5zX2g9MCx0aGlzLmhhc2hfc2l6ZT0wLHRoaXMuaGFzaF9iaXRzPTAsdGhpcy5oYXNoX21hc2s9MCx0aGlzLmhhc2hfc2hpZnQ9MCx0aGlzLmJsb2NrX3N0YXJ0PTAsdGhpcy5tYXRjaF9sZW5ndGg9MCx0aGlzLnByZXZfbWF0Y2g9MCx0aGlzLm1hdGNoX2F2YWlsYWJsZT0wLHRoaXMuc3Ryc3RhcnQ9MCx0aGlzLm1hdGNoX3N0YXJ0PTAsdGhpcy5sb29rYWhlYWQ9MCx0aGlzLnByZXZfbGVuZ3RoPTAsdGhpcy5tYXhfY2hhaW5fbGVuZ3RoPTAsdGhpcy5tYXhfbGF6eV9tYXRjaD0wLHRoaXMubGV2ZWw9MCx0aGlzLnN0cmF0ZWd5PTAsdGhpcy5nb29kX21hdGNoPTAsdGhpcy5uaWNlX21hdGNoPTAsdGhpcy5keW5fbHRyZWU9bmV3IGQuQnVmMTYoMip3KSx0aGlzLmR5bl9kdHJlZT1uZXcgZC5CdWYxNigyKigyKmErMSkpLHRoaXMuYmxfdHJlZT1uZXcgZC5CdWYxNigyKigyKm8rMSkpLEQodGhpcy5keW5fbHRyZWUpLEQodGhpcy5keW5fZHRyZWUpLEQodGhpcy5ibF90cmVlKSx0aGlzLmxfZGVzYz1udWxsLHRoaXMuZF9kZXNjPW51bGwsdGhpcy5ibF9kZXNjPW51bGwsdGhpcy5ibF9jb3VudD1uZXcgZC5CdWYxNihrKzEpLHRoaXMuaGVhcD1uZXcgZC5CdWYxNigyKnMrMSksRCh0aGlzLmhlYXApLHRoaXMuaGVhcF9sZW49MCx0aGlzLmhlYXBfbWF4PTAsdGhpcy5kZXB0aD1uZXcgZC5CdWYxNigyKnMrMSksRCh0aGlzLmRlcHRoKSx0aGlzLmxfYnVmPTAsdGhpcy5saXRfYnVmc2l6ZT0wLHRoaXMubGFzdF9saXQ9MCx0aGlzLmRfYnVmPTAsdGhpcy5vcHRfbGVuPTAsdGhpcy5zdGF0aWNfbGVuPTAsdGhpcy5tYXRjaGVzPTAsdGhpcy5pbnNlcnQ9MCx0aGlzLmJpX2J1Zj0wLHRoaXMuYmlfdmFsaWQ9MH1mdW5jdGlvbiBHKHQpe3ZhciBlO3JldHVybiB0JiZ0LnN0YXRlPyh0LnRvdGFsX2luPXQudG90YWxfb3V0PTAsdC5kYXRhX3R5cGU9biwoZT10LnN0YXRlKS5wZW5kaW5nPTAsZS5wZW5kaW5nX291dD0wLGUud3JhcDwwJiYoZS53cmFwPS1lLndyYXApLGUuc3RhdHVzPWUud3JhcD9DOkUsdC5hZGxlcj0yPT09ZS53cmFwPzA6MSxlLmxhc3RfZmx1c2g9bCx1Ll90cl9pbml0KGUpLG0pOlIodCxfKX1mdW5jdGlvbiBLKHQpe3ZhciBlPUcodCk7cmV0dXJuIGU9PT1tJiZmdW5jdGlvbih0KXt0LndpbmRvd19zaXplPTIqdC53X3NpemUsRCh0LmhlYWQpLHQubWF4X2xhenlfbWF0Y2g9aFt0LmxldmVsXS5tYXhfbGF6eSx0Lmdvb2RfbWF0Y2g9aFt0LmxldmVsXS5nb29kX2xlbmd0aCx0Lm5pY2VfbWF0Y2g9aFt0LmxldmVsXS5uaWNlX2xlbmd0aCx0Lm1heF9jaGFpbl9sZW5ndGg9aFt0LmxldmVsXS5tYXhfY2hhaW4sdC5zdHJzdGFydD0wLHQuYmxvY2tfc3RhcnQ9MCx0Lmxvb2thaGVhZD0wLHQuaW5zZXJ0PTAsdC5tYXRjaF9sZW5ndGg9dC5wcmV2X2xlbmd0aD14LTEsdC5tYXRjaF9hdmFpbGFibGU9MCx0Lmluc19oPTB9KHQuc3RhdGUpLGV9ZnVuY3Rpb24gWSh0LGUscixpLG4scyl7aWYoIXQpcmV0dXJuIF87dmFyIGE9MTtpZihlPT09ZyYmKGU9NiksaTwwPyhhPTAsaT0taSk6MTU8aSYmKGE9MixpLT0xNiksbjwxfHx5PG58fHIhPT12fHxpPDh8fDE1PGl8fGU8MHx8OTxlfHxzPDB8fGI8cylyZXR1cm4gUih0LF8pOzg9PT1pJiYoaT05KTt2YXIgbz1uZXcgSDtyZXR1cm4odC5zdGF0ZT1vKS5zdHJtPXQsby53cmFwPWEsby5nemhlYWQ9bnVsbCxvLndfYml0cz1pLG8ud19zaXplPTE8PG8ud19iaXRzLG8ud19tYXNrPW8ud19zaXplLTEsby5oYXNoX2JpdHM9bis3LG8uaGFzaF9zaXplPTE8PG8uaGFzaF9iaXRzLG8uaGFzaF9tYXNrPW8uaGFzaF9zaXplLTEsby5oYXNoX3NoaWZ0PX5+KChvLmhhc2hfYml0cyt4LTEpL3gpLG8ud2luZG93PW5ldyBkLkJ1ZjgoMipvLndfc2l6ZSksby5oZWFkPW5ldyBkLkJ1ZjE2KG8uaGFzaF9zaXplKSxvLnByZXY9bmV3IGQuQnVmMTYoby53X3NpemUpLG8ubGl0X2J1ZnNpemU9MTw8bis2LG8ucGVuZGluZ19idWZfc2l6ZT00Km8ubGl0X2J1ZnNpemUsby5wZW5kaW5nX2J1Zj1uZXcgZC5CdWY4KG8ucGVuZGluZ19idWZfc2l6ZSksby5kX2J1Zj0xKm8ubGl0X2J1ZnNpemUsby5sX2J1Zj0zKm8ubGl0X2J1ZnNpemUsby5sZXZlbD1lLG8uc3RyYXRlZ3k9cyxvLm1ldGhvZD1yLEsodCl9aD1bbmV3IE0oMCwwLDAsMCxmdW5jdGlvbih0LGUpe3ZhciByPTY1NTM1O2ZvcihyPnQucGVuZGluZ19idWZfc2l6ZS01JiYocj10LnBlbmRpbmdfYnVmX3NpemUtNSk7Oyl7aWYodC5sb29rYWhlYWQ8PTEpe2lmKGoodCksMD09PXQubG9va2FoZWFkJiZlPT09bClyZXR1cm4gQTtpZigwPT09dC5sb29rYWhlYWQpYnJlYWt9dC5zdHJzdGFydCs9dC5sb29rYWhlYWQsdC5sb29rYWhlYWQ9MDt2YXIgaT10LmJsb2NrX3N0YXJ0K3I7aWYoKDA9PT10LnN0cnN0YXJ0fHx0LnN0cnN0YXJ0Pj1pKSYmKHQubG9va2FoZWFkPXQuc3Ryc3RhcnQtaSx0LnN0cnN0YXJ0PWksTih0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCkpcmV0dXJuIEE7aWYodC5zdHJzdGFydC10LmJsb2NrX3N0YXJ0Pj10Lndfc2l6ZS16JiYoTih0LCExKSwwPT09dC5zdHJtLmF2YWlsX291dCkpcmV0dXJuIEF9cmV0dXJuIHQuaW5zZXJ0PTAsZT09PWY/KE4odCwhMCksMD09PXQuc3RybS5hdmFpbF9vdXQ/TzpCKToodC5zdHJzdGFydD50LmJsb2NrX3N0YXJ0JiYoTih0LCExKSx0LnN0cm0uYXZhaWxfb3V0KSxBKX0pLG5ldyBNKDQsNCw4LDQsWiksbmV3IE0oNCw1LDE2LDgsWiksbmV3IE0oNCw2LDMyLDMyLFopLG5ldyBNKDQsNCwxNiwxNixXKSxuZXcgTSg4LDE2LDMyLDMyLFcpLG5ldyBNKDgsMTYsMTI4LDEyOCxXKSxuZXcgTSg4LDMyLDEyOCwyNTYsVyksbmV3IE0oMzIsMTI4LDI1OCwxMDI0LFcpLG5ldyBNKDMyLDI1OCwyNTgsNDA5NixXKV0sci5kZWZsYXRlSW5pdD1mdW5jdGlvbih0LGUpe3JldHVybiBZKHQsZSx2LDE1LDgsMCl9LHIuZGVmbGF0ZUluaXQyPVksci5kZWZsYXRlUmVzZXQ9SyxyLmRlZmxhdGVSZXNldEtlZXA9RyxyLmRlZmxhdGVTZXRIZWFkZXI9ZnVuY3Rpb24odCxlKXtyZXR1cm4gdCYmdC5zdGF0ZT8yIT09dC5zdGF0ZS53cmFwP186KHQuc3RhdGUuZ3poZWFkPWUsbSk6X30sci5kZWZsYXRlPWZ1bmN0aW9uKHQsZSl7dmFyIHIsaSxuLHM7aWYoIXR8fCF0LnN0YXRlfHw1PGV8fGU8MClyZXR1cm4gdD9SKHQsXyk6XztpZihpPXQuc3RhdGUsIXQub3V0cHV0fHwhdC5pbnB1dCYmMCE9PXQuYXZhaWxfaW58fDY2Nj09PWkuc3RhdHVzJiZlIT09ZilyZXR1cm4gUih0LDA9PT10LmF2YWlsX291dD8tNTpfKTtpZihpLnN0cm09dCxyPWkubGFzdF9mbHVzaCxpLmxhc3RfZmx1c2g9ZSxpLnN0YXR1cz09PUMpaWYoMj09PWkud3JhcCl0LmFkbGVyPTAsVShpLDMxKSxVKGksMTM5KSxVKGksOCksaS5nemhlYWQ/KFUoaSwoaS5nemhlYWQudGV4dD8xOjApKyhpLmd6aGVhZC5oY3JjPzI6MCkrKGkuZ3poZWFkLmV4dHJhPzQ6MCkrKGkuZ3poZWFkLm5hbWU/ODowKSsoaS5nemhlYWQuY29tbWVudD8xNjowKSksVShpLDI1NSZpLmd6aGVhZC50aW1lKSxVKGksaS5nemhlYWQudGltZT4+OCYyNTUpLFUoaSxpLmd6aGVhZC50aW1lPj4xNiYyNTUpLFUoaSxpLmd6aGVhZC50aW1lPj4yNCYyNTUpLFUoaSw5PT09aS5sZXZlbD8yOjI8PWkuc3RyYXRlZ3l8fGkubGV2ZWw8Mj80OjApLFUoaSwyNTUmaS5nemhlYWQub3MpLGkuZ3poZWFkLmV4dHJhJiZpLmd6aGVhZC5leHRyYS5sZW5ndGgmJihVKGksMjU1JmkuZ3poZWFkLmV4dHJhLmxlbmd0aCksVShpLGkuZ3poZWFkLmV4dHJhLmxlbmd0aD4+OCYyNTUpKSxpLmd6aGVhZC5oY3JjJiYodC5hZGxlcj1wKHQuYWRsZXIsaS5wZW5kaW5nX2J1ZixpLnBlbmRpbmcsMCkpLGkuZ3ppbmRleD0wLGkuc3RhdHVzPTY5KTooVShpLDApLFUoaSwwKSxVKGksMCksVShpLDApLFUoaSwwKSxVKGksOT09PWkubGV2ZWw/MjoyPD1pLnN0cmF0ZWd5fHxpLmxldmVsPDI/NDowKSxVKGksMyksaS5zdGF0dXM9RSk7ZWxzZXt2YXIgYT12KyhpLndfYml0cy04PDw0KTw8ODthfD0oMjw9aS5zdHJhdGVneXx8aS5sZXZlbDwyPzA6aS5sZXZlbDw2PzE6Nj09PWkubGV2ZWw/MjozKTw8NiwwIT09aS5zdHJzdGFydCYmKGF8PTMyKSxhKz0zMS1hJTMxLGkuc3RhdHVzPUUsUChpLGEpLDAhPT1pLnN0cnN0YXJ0JiYoUChpLHQuYWRsZXI+Pj4xNiksUChpLDY1NTM1JnQuYWRsZXIpKSx0LmFkbGVyPTF9aWYoNjk9PT1pLnN0YXR1cylpZihpLmd6aGVhZC5leHRyYSl7Zm9yKG49aS5wZW5kaW5nO2kuZ3ppbmRleDwoNjU1MzUmaS5nemhlYWQuZXh0cmEubGVuZ3RoKSYmKGkucGVuZGluZyE9PWkucGVuZGluZ19idWZfc2l6ZXx8KGkuZ3poZWFkLmhjcmMmJmkucGVuZGluZz5uJiYodC5hZGxlcj1wKHQuYWRsZXIsaS5wZW5kaW5nX2J1ZixpLnBlbmRpbmctbixuKSksRih0KSxuPWkucGVuZGluZyxpLnBlbmRpbmchPT1pLnBlbmRpbmdfYnVmX3NpemUpKTspVShpLDI1NSZpLmd6aGVhZC5leHRyYVtpLmd6aW5kZXhdKSxpLmd6aW5kZXgrKztpLmd6aGVhZC5oY3JjJiZpLnBlbmRpbmc+biYmKHQuYWRsZXI9cCh0LmFkbGVyLGkucGVuZGluZ19idWYsaS5wZW5kaW5nLW4sbikpLGkuZ3ppbmRleD09PWkuZ3poZWFkLmV4dHJhLmxlbmd0aCYmKGkuZ3ppbmRleD0wLGkuc3RhdHVzPTczKX1lbHNlIGkuc3RhdHVzPTczO2lmKDczPT09aS5zdGF0dXMpaWYoaS5nemhlYWQubmFtZSl7bj1pLnBlbmRpbmc7ZG97aWYoaS5wZW5kaW5nPT09aS5wZW5kaW5nX2J1Zl9zaXplJiYoaS5nemhlYWQuaGNyYyYmaS5wZW5kaW5nPm4mJih0LmFkbGVyPXAodC5hZGxlcixpLnBlbmRpbmdfYnVmLGkucGVuZGluZy1uLG4pKSxGKHQpLG49aS5wZW5kaW5nLGkucGVuZGluZz09PWkucGVuZGluZ19idWZfc2l6ZSkpe3M9MTticmVha31zPWkuZ3ppbmRleDxpLmd6aGVhZC5uYW1lLmxlbmd0aD8yNTUmaS5nemhlYWQubmFtZS5jaGFyQ29kZUF0KGkuZ3ppbmRleCsrKTowLFUoaSxzKX13aGlsZSgwIT09cyk7aS5nemhlYWQuaGNyYyYmaS5wZW5kaW5nPm4mJih0LmFkbGVyPXAodC5hZGxlcixpLnBlbmRpbmdfYnVmLGkucGVuZGluZy1uLG4pKSwwPT09cyYmKGkuZ3ppbmRleD0wLGkuc3RhdHVzPTkxKX1lbHNlIGkuc3RhdHVzPTkxO2lmKDkxPT09aS5zdGF0dXMpaWYoaS5nemhlYWQuY29tbWVudCl7bj1pLnBlbmRpbmc7ZG97aWYoaS5wZW5kaW5nPT09aS5wZW5kaW5nX2J1Zl9zaXplJiYoaS5nemhlYWQuaGNyYyYmaS5wZW5kaW5nPm4mJih0LmFkbGVyPXAodC5hZGxlcixpLnBlbmRpbmdfYnVmLGkucGVuZGluZy1uLG4pKSxGKHQpLG49aS5wZW5kaW5nLGkucGVuZGluZz09PWkucGVuZGluZ19idWZfc2l6ZSkpe3M9MTticmVha31zPWkuZ3ppbmRleDxpLmd6aGVhZC5jb21tZW50Lmxlbmd0aD8yNTUmaS5nemhlYWQuY29tbWVudC5jaGFyQ29kZUF0KGkuZ3ppbmRleCsrKTowLFUoaSxzKX13aGlsZSgwIT09cyk7aS5nemhlYWQuaGNyYyYmaS5wZW5kaW5nPm4mJih0LmFkbGVyPXAodC5hZGxlcixpLnBlbmRpbmdfYnVmLGkucGVuZGluZy1uLG4pKSwwPT09cyYmKGkuc3RhdHVzPTEwMyl9ZWxzZSBpLnN0YXR1cz0xMDM7aWYoMTAzPT09aS5zdGF0dXMmJihpLmd6aGVhZC5oY3JjPyhpLnBlbmRpbmcrMj5pLnBlbmRpbmdfYnVmX3NpemUmJkYodCksaS5wZW5kaW5nKzI8PWkucGVuZGluZ19idWZfc2l6ZSYmKFUoaSwyNTUmdC5hZGxlciksVShpLHQuYWRsZXI+PjgmMjU1KSx0LmFkbGVyPTAsaS5zdGF0dXM9RSkpOmkuc3RhdHVzPUUpLDAhPT1pLnBlbmRpbmcpe2lmKEYodCksMD09PXQuYXZhaWxfb3V0KXJldHVybiBpLmxhc3RfZmx1c2g9LTEsbX1lbHNlIGlmKDA9PT10LmF2YWlsX2luJiZUKGUpPD1UKHIpJiZlIT09ZilyZXR1cm4gUih0LC01KTtpZig2NjY9PT1pLnN0YXR1cyYmMCE9PXQuYXZhaWxfaW4pcmV0dXJuIFIodCwtNSk7aWYoMCE9PXQuYXZhaWxfaW58fDAhPT1pLmxvb2thaGVhZHx8ZSE9PWwmJjY2NiE9PWkuc3RhdHVzKXt2YXIgbz0yPT09aS5zdHJhdGVneT9mdW5jdGlvbih0LGUpe2Zvcih2YXIgcjs7KXtpZigwPT09dC5sb29rYWhlYWQmJihqKHQpLDA9PT10Lmxvb2thaGVhZCkpe2lmKGU9PT1sKXJldHVybiBBO2JyZWFrfWlmKHQubWF0Y2hfbGVuZ3RoPTAscj11Ll90cl90YWxseSh0LDAsdC53aW5kb3dbdC5zdHJzdGFydF0pLHQubG9va2FoZWFkLS0sdC5zdHJzdGFydCsrLHImJihOKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KSlyZXR1cm4gQX1yZXR1cm4gdC5pbnNlcnQ9MCxlPT09Zj8oTih0LCEwKSwwPT09dC5zdHJtLmF2YWlsX291dD9POkIpOnQubGFzdF9saXQmJihOKHQsITEpLDA9PT10LnN0cm0uYXZhaWxfb3V0KT9BOkl9KGksZSk6Mz09PWkuc3RyYXRlZ3k/ZnVuY3Rpb24odCxlKXtmb3IodmFyIHIsaSxuLHMsYT10LndpbmRvdzs7KXtpZih0Lmxvb2thaGVhZDw9Uyl7aWYoaih0KSx0Lmxvb2thaGVhZDw9UyYmZT09PWwpcmV0dXJuIEE7aWYoMD09PXQubG9va2FoZWFkKWJyZWFrfWlmKHQubWF0Y2hfbGVuZ3RoPTAsdC5sb29rYWhlYWQ+PXgmJjA8dC5zdHJzdGFydCYmKGk9YVtuPXQuc3Ryc3RhcnQtMV0pPT09YVsrK25dJiZpPT09YVsrK25dJiZpPT09YVsrK25dKXtzPXQuc3Ryc3RhcnQrUztkb3t9d2hpbGUoaT09PWFbKytuXSYmaT09PWFbKytuXSYmaT09PWFbKytuXSYmaT09PWFbKytuXSYmaT09PWFbKytuXSYmaT09PWFbKytuXSYmaT09PWFbKytuXSYmaT09PWFbKytuXSYmbjxzKTt0Lm1hdGNoX2xlbmd0aD1TLShzLW4pLHQubWF0Y2hfbGVuZ3RoPnQubG9va2FoZWFkJiYodC5tYXRjaF9sZW5ndGg9dC5sb29rYWhlYWQpfWlmKHQubWF0Y2hfbGVuZ3RoPj14PyhyPXUuX3RyX3RhbGx5KHQsMSx0Lm1hdGNoX2xlbmd0aC14KSx0Lmxvb2thaGVhZC09dC5tYXRjaF9sZW5ndGgsdC5zdHJzdGFydCs9dC5tYXRjaF9sZW5ndGgsdC5tYXRjaF9sZW5ndGg9MCk6KHI9dS5fdHJfdGFsbHkodCwwLHQud2luZG93W3Quc3Ryc3RhcnRdKSx0Lmxvb2thaGVhZC0tLHQuc3Ryc3RhcnQrKyksciYmKE4odCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpKXJldHVybiBBfXJldHVybiB0Lmluc2VydD0wLGU9PT1mPyhOKHQsITApLDA9PT10LnN0cm0uYXZhaWxfb3V0P086Qik6dC5sYXN0X2xpdCYmKE4odCwhMSksMD09PXQuc3RybS5hdmFpbF9vdXQpP0E6SX0oaSxlKTpoW2kubGV2ZWxdLmZ1bmMoaSxlKTtpZihvIT09TyYmbyE9PUJ8fChpLnN0YXR1cz02NjYpLG89PT1BfHxvPT09TylyZXR1cm4gMD09PXQuYXZhaWxfb3V0JiYoaS5sYXN0X2ZsdXNoPS0xKSxtO2lmKG89PT1JJiYoMT09PWU/dS5fdHJfYWxpZ24oaSk6NSE9PWUmJih1Ll90cl9zdG9yZWRfYmxvY2soaSwwLDAsITEpLDM9PT1lJiYoRChpLmhlYWQpLDA9PT1pLmxvb2thaGVhZCYmKGkuc3Ryc3RhcnQ9MCxpLmJsb2NrX3N0YXJ0PTAsaS5pbnNlcnQ9MCkpKSxGKHQpLDA9PT10LmF2YWlsX291dCkpcmV0dXJuIGkubGFzdF9mbHVzaD0tMSxtfXJldHVybiBlIT09Zj9tOmkud3JhcDw9MD8xOigyPT09aS53cmFwPyhVKGksMjU1JnQuYWRsZXIpLFUoaSx0LmFkbGVyPj44JjI1NSksVShpLHQuYWRsZXI+PjE2JjI1NSksVShpLHQuYWRsZXI+PjI0JjI1NSksVShpLDI1NSZ0LnRvdGFsX2luKSxVKGksdC50b3RhbF9pbj4+OCYyNTUpLFUoaSx0LnRvdGFsX2luPj4xNiYyNTUpLFUoaSx0LnRvdGFsX2luPj4yNCYyNTUpKTooUChpLHQuYWRsZXI+Pj4xNiksUChpLDY1NTM1JnQuYWRsZXIpKSxGKHQpLDA8aS53cmFwJiYoaS53cmFwPS1pLndyYXApLDAhPT1pLnBlbmRpbmc/bToxKX0sci5kZWZsYXRlRW5kPWZ1bmN0aW9uKHQpe3ZhciBlO3JldHVybiB0JiZ0LnN0YXRlPyhlPXQuc3RhdGUuc3RhdHVzKSE9PUMmJjY5IT09ZSYmNzMhPT1lJiY5MSE9PWUmJjEwMyE9PWUmJmUhPT1FJiY2NjYhPT1lP1IodCxfKToodC5zdGF0ZT1udWxsLGU9PT1FP1IodCwtMyk6bSk6X30sci5kZWZsYXRlU2V0RGljdGlvbmFyeT1mdW5jdGlvbih0LGUpe3ZhciByLGksbixzLGEsbyxoLHUsbD1lLmxlbmd0aDtpZighdHx8IXQuc3RhdGUpcmV0dXJuIF87aWYoMj09PShzPShyPXQuc3RhdGUpLndyYXApfHwxPT09cyYmci5zdGF0dXMhPT1DfHxyLmxvb2thaGVhZClyZXR1cm4gXztmb3IoMT09PXMmJih0LmFkbGVyPWModC5hZGxlcixlLGwsMCkpLHIud3JhcD0wLGw+PXIud19zaXplJiYoMD09PXMmJihEKHIuaGVhZCksci5zdHJzdGFydD0wLHIuYmxvY2tfc3RhcnQ9MCxyLmluc2VydD0wKSx1PW5ldyBkLkJ1Zjgoci53X3NpemUpLGQuYXJyYXlTZXQodSxlLGwtci53X3NpemUsci53X3NpemUsMCksZT11LGw9ci53X3NpemUpLGE9dC5hdmFpbF9pbixvPXQubmV4dF9pbixoPXQuaW5wdXQsdC5hdmFpbF9pbj1sLHQubmV4dF9pbj0wLHQuaW5wdXQ9ZSxqKHIpO3IubG9va2FoZWFkPj14Oyl7Zm9yKGk9ci5zdHJzdGFydCxuPXIubG9va2FoZWFkLSh4LTEpO3IuaW5zX2g9KHIuaW5zX2g8PHIuaGFzaF9zaGlmdF5yLndpbmRvd1tpK3gtMV0pJnIuaGFzaF9tYXNrLHIucHJldltpJnIud19tYXNrXT1yLmhlYWRbci5pbnNfaF0sci5oZWFkW3IuaW5zX2hdPWksaSsrLC0tbjspO3Iuc3Ryc3RhcnQ9aSxyLmxvb2thaGVhZD14LTEsaihyKX1yZXR1cm4gci5zdHJzdGFydCs9ci5sb29rYWhlYWQsci5ibG9ja19zdGFydD1yLnN0cnN0YXJ0LHIuaW5zZXJ0PXIubG9va2FoZWFkLHIubG9va2FoZWFkPTAsci5tYXRjaF9sZW5ndGg9ci5wcmV2X2xlbmd0aD14LTEsci5tYXRjaF9hdmFpbGFibGU9MCx0Lm5leHRfaW49byx0LmlucHV0PWgsdC5hdmFpbF9pbj1hLHIud3JhcD1zLG19LHIuZGVmbGF0ZUluZm89XCJwYWtvIGRlZmxhdGUgKGZyb20gTm9kZWNhIHByb2plY3QpXCJ9LHtcIi4uL3V0aWxzL2NvbW1vblwiOjQxLFwiLi9hZGxlcjMyXCI6NDMsXCIuL2NyYzMyXCI6NDUsXCIuL21lc3NhZ2VzXCI6NTEsXCIuL3RyZWVzXCI6NTJ9XSw0NzpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2UuZXhwb3J0cz1mdW5jdGlvbigpe3RoaXMudGV4dD0wLHRoaXMudGltZT0wLHRoaXMueGZsYWdzPTAsdGhpcy5vcz0wLHRoaXMuZXh0cmE9bnVsbCx0aGlzLmV4dHJhX2xlbj0wLHRoaXMubmFtZT1cIlwiLHRoaXMuY29tbWVudD1cIlwiLHRoaXMuaGNyYz0wLHRoaXMuZG9uZT0hMX19LHt9XSw0ODpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2UuZXhwb3J0cz1mdW5jdGlvbih0LGUpe3ZhciByLGksbixzLGEsbyxoLHUsbCxmLGQsYyxwLG0sXyxnLGIsdix5LHcsayx4LFMseixDO3I9dC5zdGF0ZSxpPXQubmV4dF9pbix6PXQuaW5wdXQsbj1pKyh0LmF2YWlsX2luLTUpLHM9dC5uZXh0X291dCxDPXQub3V0cHV0LGE9cy0oZS10LmF2YWlsX291dCksbz1zKyh0LmF2YWlsX291dC0yNTcpLGg9ci5kbWF4LHU9ci53c2l6ZSxsPXIud2hhdmUsZj1yLnduZXh0LGQ9ci53aW5kb3csYz1yLmhvbGQscD1yLmJpdHMsbT1yLmxlbmNvZGUsXz1yLmRpc3Rjb2RlLGc9KDE8PHIubGVuYml0cyktMSxiPSgxPDxyLmRpc3RiaXRzKS0xO3Q6ZG97cDwxNSYmKGMrPXpbaSsrXTw8cCxwKz04LGMrPXpbaSsrXTw8cCxwKz04KSx2PW1bYyZnXTtlOmZvcig7Oyl7aWYoYz4+Pj15PXY+Pj4yNCxwLT15LDA9PT0oeT12Pj4+MTYmMjU1KSlDW3MrK109NjU1MzUmdjtlbHNle2lmKCEoMTYmeSkpe2lmKDA9PSg2NCZ5KSl7dj1tWyg2NTUzNSZ2KSsoYyYoMTw8eSktMSldO2NvbnRpbnVlIGV9aWYoMzImeSl7ci5tb2RlPTEyO2JyZWFrIHR9dC5tc2c9XCJpbnZhbGlkIGxpdGVyYWwvbGVuZ3RoIGNvZGVcIixyLm1vZGU9MzA7YnJlYWsgdH13PTY1NTM1JnYsKHkmPTE1KSYmKHA8eSYmKGMrPXpbaSsrXTw8cCxwKz04KSx3Kz1jJigxPDx5KS0xLGM+Pj49eSxwLT15KSxwPDE1JiYoYys9eltpKytdPDxwLHArPTgsYys9eltpKytdPDxwLHArPTgpLHY9X1tjJmJdO3I6Zm9yKDs7KXtpZihjPj4+PXk9dj4+PjI0LHAtPXksISgxNiYoeT12Pj4+MTYmMjU1KSkpe2lmKDA9PSg2NCZ5KSl7dj1fWyg2NTUzNSZ2KSsoYyYoMTw8eSktMSldO2NvbnRpbnVlIHJ9dC5tc2c9XCJpbnZhbGlkIGRpc3RhbmNlIGNvZGVcIixyLm1vZGU9MzA7YnJlYWsgdH1pZihrPTY1NTM1JnYscDwoeSY9MTUpJiYoYys9eltpKytdPDxwLChwKz04KTx5JiYoYys9eltpKytdPDxwLHArPTgpKSxoPChrKz1jJigxPDx5KS0xKSl7dC5tc2c9XCJpbnZhbGlkIGRpc3RhbmNlIHRvbyBmYXIgYmFja1wiLHIubW9kZT0zMDticmVhayB0fWlmKGM+Pj49eSxwLT15LCh5PXMtYSk8ayl7aWYobDwoeT1rLXkpJiZyLnNhbmUpe3QubXNnPVwiaW52YWxpZCBkaXN0YW5jZSB0b28gZmFyIGJhY2tcIixyLm1vZGU9MzA7YnJlYWsgdH1pZihTPWQsKHg9MCk9PT1mKXtpZih4Kz11LXkseTx3KXtmb3Iody09eTtDW3MrK109ZFt4KytdLC0teTspO3g9cy1rLFM9Q319ZWxzZSBpZihmPHkpe2lmKHgrPXUrZi15LCh5LT1mKTx3KXtmb3Iody09eTtDW3MrK109ZFt4KytdLC0teTspO2lmKHg9MCxmPHcpe2Zvcih3LT15PWY7Q1tzKytdPWRbeCsrXSwtLXk7KTt4PXMtayxTPUN9fX1lbHNlIGlmKHgrPWYteSx5PHcpe2Zvcih3LT15O0NbcysrXT1kW3grK10sLS15Oyk7eD1zLWssUz1DfWZvcig7Mjx3OylDW3MrK109U1t4KytdLENbcysrXT1TW3grK10sQ1tzKytdPVNbeCsrXSx3LT0zO3cmJihDW3MrK109U1t4KytdLDE8dyYmKENbcysrXT1TW3grK10pKX1lbHNle2Zvcih4PXMtaztDW3MrK109Q1t4KytdLENbcysrXT1DW3grK10sQ1tzKytdPUNbeCsrXSwyPCh3LT0zKTspO3cmJihDW3MrK109Q1t4KytdLDE8dyYmKENbcysrXT1DW3grK10pKX1icmVha319YnJlYWt9fXdoaWxlKGk8biYmczxvKTtpLT13PXA+PjMsYyY9KDE8PChwLT13PDwzKSktMSx0Lm5leHRfaW49aSx0Lm5leHRfb3V0PXMsdC5hdmFpbF9pbj1pPG4/bi1pKzU6NS0oaS1uKSx0LmF2YWlsX291dD1zPG8/by1zKzI1NzoyNTctKHMtbyksci5ob2xkPWMsci5iaXRzPXB9fSx7fV0sNDk6W2Z1bmN0aW9uKHQsZSxyKXtcInVzZSBzdHJpY3RcIjt2YXIgST10KFwiLi4vdXRpbHMvY29tbW9uXCIpLE89dChcIi4vYWRsZXIzMlwiKSxCPXQoXCIuL2NyYzMyXCIpLFI9dChcIi4vaW5mZmFzdFwiKSxUPXQoXCIuL2luZnRyZWVzXCIpLEQ9MSxGPTIsTj0wLFU9LTIsUD0xLGk9ODUyLG49NTkyO2Z1bmN0aW9uIEwodCl7cmV0dXJuKHQ+Pj4yNCYyNTUpKyh0Pj4+OCY2NTI4MCkrKCg2NTI4MCZ0KTw8OCkrKCgyNTUmdCk8PDI0KX1mdW5jdGlvbiBzKCl7dGhpcy5tb2RlPTAsdGhpcy5sYXN0PSExLHRoaXMud3JhcD0wLHRoaXMuaGF2ZWRpY3Q9ITEsdGhpcy5mbGFncz0wLHRoaXMuZG1heD0wLHRoaXMuY2hlY2s9MCx0aGlzLnRvdGFsPTAsdGhpcy5oZWFkPW51bGwsdGhpcy53Yml0cz0wLHRoaXMud3NpemU9MCx0aGlzLndoYXZlPTAsdGhpcy53bmV4dD0wLHRoaXMud2luZG93PW51bGwsdGhpcy5ob2xkPTAsdGhpcy5iaXRzPTAsdGhpcy5sZW5ndGg9MCx0aGlzLm9mZnNldD0wLHRoaXMuZXh0cmE9MCx0aGlzLmxlbmNvZGU9bnVsbCx0aGlzLmRpc3Rjb2RlPW51bGwsdGhpcy5sZW5iaXRzPTAsdGhpcy5kaXN0Yml0cz0wLHRoaXMubmNvZGU9MCx0aGlzLm5sZW49MCx0aGlzLm5kaXN0PTAsdGhpcy5oYXZlPTAsdGhpcy5uZXh0PW51bGwsdGhpcy5sZW5zPW5ldyBJLkJ1ZjE2KDMyMCksdGhpcy53b3JrPW5ldyBJLkJ1ZjE2KDI4OCksdGhpcy5sZW5keW49bnVsbCx0aGlzLmRpc3RkeW49bnVsbCx0aGlzLnNhbmU9MCx0aGlzLmJhY2s9MCx0aGlzLndhcz0wfWZ1bmN0aW9uIGEodCl7dmFyIGU7cmV0dXJuIHQmJnQuc3RhdGU/KGU9dC5zdGF0ZSx0LnRvdGFsX2luPXQudG90YWxfb3V0PWUudG90YWw9MCx0Lm1zZz1cIlwiLGUud3JhcCYmKHQuYWRsZXI9MSZlLndyYXApLGUubW9kZT1QLGUubGFzdD0wLGUuaGF2ZWRpY3Q9MCxlLmRtYXg9MzI3NjgsZS5oZWFkPW51bGwsZS5ob2xkPTAsZS5iaXRzPTAsZS5sZW5jb2RlPWUubGVuZHluPW5ldyBJLkJ1ZjMyKGkpLGUuZGlzdGNvZGU9ZS5kaXN0ZHluPW5ldyBJLkJ1ZjMyKG4pLGUuc2FuZT0xLGUuYmFjaz0tMSxOKTpVfWZ1bmN0aW9uIG8odCl7dmFyIGU7cmV0dXJuIHQmJnQuc3RhdGU/KChlPXQuc3RhdGUpLndzaXplPTAsZS53aGF2ZT0wLGUud25leHQ9MCxhKHQpKTpVfWZ1bmN0aW9uIGgodCxlKXt2YXIgcixpO3JldHVybiB0JiZ0LnN0YXRlPyhpPXQuc3RhdGUsZTwwPyhyPTAsZT0tZSk6KHI9MSsoZT4+NCksZTw0OCYmKGUmPTE1KSksZSYmKGU8OHx8MTU8ZSk/VToobnVsbCE9PWkud2luZG93JiZpLndiaXRzIT09ZSYmKGkud2luZG93PW51bGwpLGkud3JhcD1yLGkud2JpdHM9ZSxvKHQpKSk6VX1mdW5jdGlvbiB1KHQsZSl7dmFyIHIsaTtyZXR1cm4gdD8oaT1uZXcgcywodC5zdGF0ZT1pKS53aW5kb3c9bnVsbCwocj1oKHQsZSkpIT09TiYmKHQuc3RhdGU9bnVsbCkscik6VX12YXIgbCxmLGQ9ITA7ZnVuY3Rpb24gaih0KXtpZihkKXt2YXIgZTtmb3IobD1uZXcgSS5CdWYzMig1MTIpLGY9bmV3IEkuQnVmMzIoMzIpLGU9MDtlPDE0NDspdC5sZW5zW2UrK109ODtmb3IoO2U8MjU2Oyl0LmxlbnNbZSsrXT05O2Zvcig7ZTwyODA7KXQubGVuc1tlKytdPTc7Zm9yKDtlPDI4ODspdC5sZW5zW2UrK109ODtmb3IoVChELHQubGVucywwLDI4OCxsLDAsdC53b3JrLHtiaXRzOjl9KSxlPTA7ZTwzMjspdC5sZW5zW2UrK109NTtUKEYsdC5sZW5zLDAsMzIsZiwwLHQud29yayx7Yml0czo1fSksZD0hMX10LmxlbmNvZGU9bCx0LmxlbmJpdHM9OSx0LmRpc3Rjb2RlPWYsdC5kaXN0Yml0cz01fWZ1bmN0aW9uIFoodCxlLHIsaSl7dmFyIG4scz10LnN0YXRlO3JldHVybiBudWxsPT09cy53aW5kb3cmJihzLndzaXplPTE8PHMud2JpdHMscy53bmV4dD0wLHMud2hhdmU9MCxzLndpbmRvdz1uZXcgSS5CdWY4KHMud3NpemUpKSxpPj1zLndzaXplPyhJLmFycmF5U2V0KHMud2luZG93LGUsci1zLndzaXplLHMud3NpemUsMCkscy53bmV4dD0wLHMud2hhdmU9cy53c2l6ZSk6KGk8KG49cy53c2l6ZS1zLnduZXh0KSYmKG49aSksSS5hcnJheVNldChzLndpbmRvdyxlLHItaSxuLHMud25leHQpLChpLT1uKT8oSS5hcnJheVNldChzLndpbmRvdyxlLHItaSxpLDApLHMud25leHQ9aSxzLndoYXZlPXMud3NpemUpOihzLnduZXh0Kz1uLHMud25leHQ9PT1zLndzaXplJiYocy53bmV4dD0wKSxzLndoYXZlPHMud3NpemUmJihzLndoYXZlKz1uKSkpLDB9ci5pbmZsYXRlUmVzZXQ9byxyLmluZmxhdGVSZXNldDI9aCxyLmluZmxhdGVSZXNldEtlZXA9YSxyLmluZmxhdGVJbml0PWZ1bmN0aW9uKHQpe3JldHVybiB1KHQsMTUpfSxyLmluZmxhdGVJbml0Mj11LHIuaW5mbGF0ZT1mdW5jdGlvbih0LGUpe3ZhciByLGksbixzLGEsbyxoLHUsbCxmLGQsYyxwLG0sXyxnLGIsdix5LHcsayx4LFMseixDPTAsRT1uZXcgSS5CdWY4KDQpLEE9WzE2LDE3LDE4LDAsOCw3LDksNiwxMCw1LDExLDQsMTIsMywxMywyLDE0LDEsMTVdO2lmKCF0fHwhdC5zdGF0ZXx8IXQub3V0cHV0fHwhdC5pbnB1dCYmMCE9PXQuYXZhaWxfaW4pcmV0dXJuIFU7MTI9PT0ocj10LnN0YXRlKS5tb2RlJiYoci5tb2RlPTEzKSxhPXQubmV4dF9vdXQsbj10Lm91dHB1dCxoPXQuYXZhaWxfb3V0LHM9dC5uZXh0X2luLGk9dC5pbnB1dCxvPXQuYXZhaWxfaW4sdT1yLmhvbGQsbD1yLmJpdHMsZj1vLGQ9aCx4PU47dDpmb3IoOzspc3dpdGNoKHIubW9kZSl7Y2FzZSBQOmlmKDA9PT1yLndyYXApe3IubW9kZT0xMzticmVha31mb3IoO2w8MTY7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1pZigyJnIud3JhcCYmMzU2MTU9PT11KXtFW3IuY2hlY2s9MF09MjU1JnUsRVsxXT11Pj4+OCYyNTUsci5jaGVjaz1CKHIuY2hlY2ssRSwyLDApLGw9dT0wLHIubW9kZT0yO2JyZWFrfWlmKHIuZmxhZ3M9MCxyLmhlYWQmJihyLmhlYWQuZG9uZT0hMSksISgxJnIud3JhcCl8fCgoKDI1NSZ1KTw8OCkrKHU+PjgpKSUzMSl7dC5tc2c9XCJpbmNvcnJlY3QgaGVhZGVyIGNoZWNrXCIsci5tb2RlPTMwO2JyZWFrfWlmKDghPSgxNSZ1KSl7dC5tc2c9XCJ1bmtub3duIGNvbXByZXNzaW9uIG1ldGhvZFwiLHIubW9kZT0zMDticmVha31pZihsLT00LGs9OCsoMTUmKHU+Pj49NCkpLDA9PT1yLndiaXRzKXIud2JpdHM9aztlbHNlIGlmKGs+ci53Yml0cyl7dC5tc2c9XCJpbnZhbGlkIHdpbmRvdyBzaXplXCIsci5tb2RlPTMwO2JyZWFrfXIuZG1heD0xPDxrLHQuYWRsZXI9ci5jaGVjaz0xLHIubW9kZT01MTImdT8xMDoxMixsPXU9MDticmVhaztjYXNlIDI6Zm9yKDtsPDE2Oyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9aWYoci5mbGFncz11LDghPSgyNTUmci5mbGFncykpe3QubXNnPVwidW5rbm93biBjb21wcmVzc2lvbiBtZXRob2RcIixyLm1vZGU9MzA7YnJlYWt9aWYoNTczNDQmci5mbGFncyl7dC5tc2c9XCJ1bmtub3duIGhlYWRlciBmbGFncyBzZXRcIixyLm1vZGU9MzA7YnJlYWt9ci5oZWFkJiYoci5oZWFkLnRleHQ9dT4+OCYxKSw1MTImci5mbGFncyYmKEVbMF09MjU1JnUsRVsxXT11Pj4+OCYyNTUsci5jaGVjaz1CKHIuY2hlY2ssRSwyLDApKSxsPXU9MCxyLm1vZGU9MztjYXNlIDM6Zm9yKDtsPDMyOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9ci5oZWFkJiYoci5oZWFkLnRpbWU9dSksNTEyJnIuZmxhZ3MmJihFWzBdPTI1NSZ1LEVbMV09dT4+PjgmMjU1LEVbMl09dT4+PjE2JjI1NSxFWzNdPXU+Pj4yNCYyNTUsci5jaGVjaz1CKHIuY2hlY2ssRSw0LDApKSxsPXU9MCxyLm1vZGU9NDtjYXNlIDQ6Zm9yKDtsPDE2Oyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9ci5oZWFkJiYoci5oZWFkLnhmbGFncz0yNTUmdSxyLmhlYWQub3M9dT4+OCksNTEyJnIuZmxhZ3MmJihFWzBdPTI1NSZ1LEVbMV09dT4+PjgmMjU1LHIuY2hlY2s9QihyLmNoZWNrLEUsMiwwKSksbD11PTAsci5tb2RlPTU7Y2FzZSA1OmlmKDEwMjQmci5mbGFncyl7Zm9yKDtsPDE2Oyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9ci5sZW5ndGg9dSxyLmhlYWQmJihyLmhlYWQuZXh0cmFfbGVuPXUpLDUxMiZyLmZsYWdzJiYoRVswXT0yNTUmdSxFWzFdPXU+Pj44JjI1NSxyLmNoZWNrPUIoci5jaGVjayxFLDIsMCkpLGw9dT0wfWVsc2Ugci5oZWFkJiYoci5oZWFkLmV4dHJhPW51bGwpO3IubW9kZT02O2Nhc2UgNjppZigxMDI0JnIuZmxhZ3MmJihvPChjPXIubGVuZ3RoKSYmKGM9byksYyYmKHIuaGVhZCYmKGs9ci5oZWFkLmV4dHJhX2xlbi1yLmxlbmd0aCxyLmhlYWQuZXh0cmF8fChyLmhlYWQuZXh0cmE9bmV3IEFycmF5KHIuaGVhZC5leHRyYV9sZW4pKSxJLmFycmF5U2V0KHIuaGVhZC5leHRyYSxpLHMsYyxrKSksNTEyJnIuZmxhZ3MmJihyLmNoZWNrPUIoci5jaGVjayxpLGMscykpLG8tPWMscys9YyxyLmxlbmd0aC09Yyksci5sZW5ndGgpKWJyZWFrIHQ7ci5sZW5ndGg9MCxyLm1vZGU9NztjYXNlIDc6aWYoMjA0OCZyLmZsYWdzKXtpZigwPT09bylicmVhayB0O2ZvcihjPTA7az1pW3MrYysrXSxyLmhlYWQmJmsmJnIubGVuZ3RoPDY1NTM2JiYoci5oZWFkLm5hbWUrPVN0cmluZy5mcm9tQ2hhckNvZGUoaykpLGsmJmM8bzspO2lmKDUxMiZyLmZsYWdzJiYoci5jaGVjaz1CKHIuY2hlY2ssaSxjLHMpKSxvLT1jLHMrPWMsaylicmVhayB0fWVsc2Ugci5oZWFkJiYoci5oZWFkLm5hbWU9bnVsbCk7ci5sZW5ndGg9MCxyLm1vZGU9ODtjYXNlIDg6aWYoNDA5NiZyLmZsYWdzKXtpZigwPT09bylicmVhayB0O2ZvcihjPTA7az1pW3MrYysrXSxyLmhlYWQmJmsmJnIubGVuZ3RoPDY1NTM2JiYoci5oZWFkLmNvbW1lbnQrPVN0cmluZy5mcm9tQ2hhckNvZGUoaykpLGsmJmM8bzspO2lmKDUxMiZyLmZsYWdzJiYoci5jaGVjaz1CKHIuY2hlY2ssaSxjLHMpKSxvLT1jLHMrPWMsaylicmVhayB0fWVsc2Ugci5oZWFkJiYoci5oZWFkLmNvbW1lbnQ9bnVsbCk7ci5tb2RlPTk7Y2FzZSA5OmlmKDUxMiZyLmZsYWdzKXtmb3IoO2w8MTY7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1pZih1IT09KDY1NTM1JnIuY2hlY2spKXt0Lm1zZz1cImhlYWRlciBjcmMgbWlzbWF0Y2hcIixyLm1vZGU9MzA7YnJlYWt9bD11PTB9ci5oZWFkJiYoci5oZWFkLmhjcmM9ci5mbGFncz4+OSYxLHIuaGVhZC5kb25lPSEwKSx0LmFkbGVyPXIuY2hlY2s9MCxyLm1vZGU9MTI7YnJlYWs7Y2FzZSAxMDpmb3IoO2w8MzI7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH10LmFkbGVyPXIuY2hlY2s9TCh1KSxsPXU9MCxyLm1vZGU9MTE7Y2FzZSAxMTppZigwPT09ci5oYXZlZGljdClyZXR1cm4gdC5uZXh0X291dD1hLHQuYXZhaWxfb3V0PWgsdC5uZXh0X2luPXMsdC5hdmFpbF9pbj1vLHIuaG9sZD11LHIuYml0cz1sLDI7dC5hZGxlcj1yLmNoZWNrPTEsci5tb2RlPTEyO2Nhc2UgMTI6aWYoNT09PWV8fDY9PT1lKWJyZWFrIHQ7Y2FzZSAxMzppZihyLmxhc3Qpe3U+Pj49NyZsLGwtPTcmbCxyLm1vZGU9Mjc7YnJlYWt9Zm9yKDtsPDM7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1zd2l0Y2goci5sYXN0PTEmdSxsLT0xLDMmKHU+Pj49MSkpe2Nhc2UgMDpyLm1vZGU9MTQ7YnJlYWs7Y2FzZSAxOmlmKGoociksci5tb2RlPTIwLDYhPT1lKWJyZWFrO3U+Pj49MixsLT0yO2JyZWFrIHQ7Y2FzZSAyOnIubW9kZT0xNzticmVhaztjYXNlIDM6dC5tc2c9XCJpbnZhbGlkIGJsb2NrIHR5cGVcIixyLm1vZGU9MzB9dT4+Pj0yLGwtPTI7YnJlYWs7Y2FzZSAxNDpmb3IodT4+Pj03JmwsbC09NyZsO2w8MzI7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1pZigoNjU1MzUmdSkhPSh1Pj4+MTZeNjU1MzUpKXt0Lm1zZz1cImludmFsaWQgc3RvcmVkIGJsb2NrIGxlbmd0aHNcIixyLm1vZGU9MzA7YnJlYWt9aWYoci5sZW5ndGg9NjU1MzUmdSxsPXU9MCxyLm1vZGU9MTUsNj09PWUpYnJlYWsgdDtjYXNlIDE1OnIubW9kZT0xNjtjYXNlIDE2OmlmKGM9ci5sZW5ndGgpe2lmKG88YyYmKGM9byksaDxjJiYoYz1oKSwwPT09YylicmVhayB0O0kuYXJyYXlTZXQobixpLHMsYyxhKSxvLT1jLHMrPWMsaC09YyxhKz1jLHIubGVuZ3RoLT1jO2JyZWFrfXIubW9kZT0xMjticmVhaztjYXNlIDE3OmZvcig7bDwxNDspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWlmKHIubmxlbj0yNTcrKDMxJnUpLHU+Pj49NSxsLT01LHIubmRpc3Q9MSsoMzEmdSksdT4+Pj01LGwtPTUsci5uY29kZT00KygxNSZ1KSx1Pj4+PTQsbC09NCwyODY8ci5ubGVufHwzMDxyLm5kaXN0KXt0Lm1zZz1cInRvbyBtYW55IGxlbmd0aCBvciBkaXN0YW5jZSBzeW1ib2xzXCIsci5tb2RlPTMwO2JyZWFrfXIuaGF2ZT0wLHIubW9kZT0xODtjYXNlIDE4OmZvcig7ci5oYXZlPHIubmNvZGU7KXtmb3IoO2w8Mzspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fXIubGVuc1tBW3IuaGF2ZSsrXV09NyZ1LHU+Pj49MyxsLT0zfWZvcig7ci5oYXZlPDE5OylyLmxlbnNbQVtyLmhhdmUrK11dPTA7aWYoci5sZW5jb2RlPXIubGVuZHluLHIubGVuYml0cz03LFM9e2JpdHM6ci5sZW5iaXRzfSx4PVQoMCxyLmxlbnMsMCwxOSxyLmxlbmNvZGUsMCxyLndvcmssUyksci5sZW5iaXRzPVMuYml0cyx4KXt0Lm1zZz1cImludmFsaWQgY29kZSBsZW5ndGhzIHNldFwiLHIubW9kZT0zMDticmVha31yLmhhdmU9MCxyLm1vZGU9MTk7Y2FzZSAxOTpmb3IoO3IuaGF2ZTxyLm5sZW4rci5uZGlzdDspe2Zvcig7Zz0oQz1yLmxlbmNvZGVbdSYoMTw8ci5sZW5iaXRzKS0xXSk+Pj4xNiYyNTUsYj02NTUzNSZDLCEoKF89Qz4+PjI0KTw9bCk7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1pZihiPDE2KXU+Pj49XyxsLT1fLHIubGVuc1tyLmhhdmUrK109YjtlbHNle2lmKDE2PT09Yil7Zm9yKHo9XysyO2w8ejspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fWlmKHU+Pj49XyxsLT1fLDA9PT1yLmhhdmUpe3QubXNnPVwiaW52YWxpZCBiaXQgbGVuZ3RoIHJlcGVhdFwiLHIubW9kZT0zMDticmVha31rPXIubGVuc1tyLmhhdmUtMV0sYz0zKygzJnUpLHU+Pj49MixsLT0yfWVsc2UgaWYoMTc9PT1iKXtmb3Ioej1fKzM7bDx6Oyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9bC09XyxrPTAsYz0zKyg3Jih1Pj4+PV8pKSx1Pj4+PTMsbC09M31lbHNle2Zvcih6PV8rNztsPHo7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1sLT1fLGs9MCxjPTExKygxMjcmKHU+Pj49XykpLHU+Pj49NyxsLT03fWlmKHIuaGF2ZStjPnIubmxlbityLm5kaXN0KXt0Lm1zZz1cImludmFsaWQgYml0IGxlbmd0aCByZXBlYXRcIixyLm1vZGU9MzA7YnJlYWt9Zm9yKDtjLS07KXIubGVuc1tyLmhhdmUrK109a319aWYoMzA9PT1yLm1vZGUpYnJlYWs7aWYoMD09PXIubGVuc1syNTZdKXt0Lm1zZz1cImludmFsaWQgY29kZSAtLSBtaXNzaW5nIGVuZC1vZi1ibG9ja1wiLHIubW9kZT0zMDticmVha31pZihyLmxlbmJpdHM9OSxTPXtiaXRzOnIubGVuYml0c30seD1UKEQsci5sZW5zLDAsci5ubGVuLHIubGVuY29kZSwwLHIud29yayxTKSxyLmxlbmJpdHM9Uy5iaXRzLHgpe3QubXNnPVwiaW52YWxpZCBsaXRlcmFsL2xlbmd0aHMgc2V0XCIsci5tb2RlPTMwO2JyZWFrfWlmKHIuZGlzdGJpdHM9NixyLmRpc3Rjb2RlPXIuZGlzdGR5bixTPXtiaXRzOnIuZGlzdGJpdHN9LHg9VChGLHIubGVucyxyLm5sZW4sci5uZGlzdCxyLmRpc3Rjb2RlLDAsci53b3JrLFMpLHIuZGlzdGJpdHM9Uy5iaXRzLHgpe3QubXNnPVwiaW52YWxpZCBkaXN0YW5jZXMgc2V0XCIsci5tb2RlPTMwO2JyZWFrfWlmKHIubW9kZT0yMCw2PT09ZSlicmVhayB0O2Nhc2UgMjA6ci5tb2RlPTIxO2Nhc2UgMjE6aWYoNjw9byYmMjU4PD1oKXt0Lm5leHRfb3V0PWEsdC5hdmFpbF9vdXQ9aCx0Lm5leHRfaW49cyx0LmF2YWlsX2luPW8sci5ob2xkPXUsci5iaXRzPWwsUih0LGQpLGE9dC5uZXh0X291dCxuPXQub3V0cHV0LGg9dC5hdmFpbF9vdXQscz10Lm5leHRfaW4saT10LmlucHV0LG89dC5hdmFpbF9pbix1PXIuaG9sZCxsPXIuYml0cywxMj09PXIubW9kZSYmKHIuYmFjaz0tMSk7YnJlYWt9Zm9yKHIuYmFjaz0wO2c9KEM9ci5sZW5jb2RlW3UmKDE8PHIubGVuYml0cyktMV0pPj4+MTYmMjU1LGI9NjU1MzUmQywhKChfPUM+Pj4yNCk8PWwpOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9aWYoZyYmMD09KDI0MCZnKSl7Zm9yKHY9Xyx5PWcsdz1iO2c9KEM9ci5sZW5jb2RlW3crKCh1JigxPDx2K3kpLTEpPj52KV0pPj4+MTYmMjU1LGI9NjU1MzUmQywhKHYrKF89Qz4+PjI0KTw9bCk7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH11Pj4+PXYsbC09dixyLmJhY2srPXZ9aWYodT4+Pj1fLGwtPV8sci5iYWNrKz1fLHIubGVuZ3RoPWIsMD09PWcpe3IubW9kZT0yNjticmVha31pZigzMiZnKXtyLmJhY2s9LTEsci5tb2RlPTEyO2JyZWFrfWlmKDY0Jmcpe3QubXNnPVwiaW52YWxpZCBsaXRlcmFsL2xlbmd0aCBjb2RlXCIsci5tb2RlPTMwO2JyZWFrfXIuZXh0cmE9MTUmZyxyLm1vZGU9MjI7Y2FzZSAyMjppZihyLmV4dHJhKXtmb3Ioej1yLmV4dHJhO2w8ejspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHUrPWlbcysrXTw8bCxsKz04fXIubGVuZ3RoKz11JigxPDxyLmV4dHJhKS0xLHU+Pj49ci5leHRyYSxsLT1yLmV4dHJhLHIuYmFjays9ci5leHRyYX1yLndhcz1yLmxlbmd0aCxyLm1vZGU9MjM7Y2FzZSAyMzpmb3IoO2c9KEM9ci5kaXN0Y29kZVt1JigxPDxyLmRpc3RiaXRzKS0xXSk+Pj4xNiYyNTUsYj02NTUzNSZDLCEoKF89Qz4+PjI0KTw9bCk7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH1pZigwPT0oMjQwJmcpKXtmb3Iodj1fLHk9Zyx3PWI7Zz0oQz1yLmRpc3Rjb2RlW3crKCh1JigxPDx2K3kpLTEpPj52KV0pPj4+MTYmMjU1LGI9NjU1MzUmQywhKHYrKF89Qz4+PjI0KTw9bCk7KXtpZigwPT09bylicmVhayB0O28tLSx1Kz1pW3MrK108PGwsbCs9OH11Pj4+PXYsbC09dixyLmJhY2srPXZ9aWYodT4+Pj1fLGwtPV8sci5iYWNrKz1fLDY0Jmcpe3QubXNnPVwiaW52YWxpZCBkaXN0YW5jZSBjb2RlXCIsci5tb2RlPTMwO2JyZWFrfXIub2Zmc2V0PWIsci5leHRyYT0xNSZnLHIubW9kZT0yNDtjYXNlIDI0OmlmKHIuZXh0cmEpe2Zvcih6PXIuZXh0cmE7bDx6Oyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9ci5vZmZzZXQrPXUmKDE8PHIuZXh0cmEpLTEsdT4+Pj1yLmV4dHJhLGwtPXIuZXh0cmEsci5iYWNrKz1yLmV4dHJhfWlmKHIub2Zmc2V0PnIuZG1heCl7dC5tc2c9XCJpbnZhbGlkIGRpc3RhbmNlIHRvbyBmYXIgYmFja1wiLHIubW9kZT0zMDticmVha31yLm1vZGU9MjU7Y2FzZSAyNTppZigwPT09aClicmVhayB0O2lmKGM9ZC1oLHIub2Zmc2V0PmMpe2lmKChjPXIub2Zmc2V0LWMpPnIud2hhdmUmJnIuc2FuZSl7dC5tc2c9XCJpbnZhbGlkIGRpc3RhbmNlIHRvbyBmYXIgYmFja1wiLHIubW9kZT0zMDticmVha31wPWM+ci53bmV4dD8oYy09ci53bmV4dCxyLndzaXplLWMpOnIud25leHQtYyxjPnIubGVuZ3RoJiYoYz1yLmxlbmd0aCksbT1yLndpbmRvd31lbHNlIG09bixwPWEtci5vZmZzZXQsYz1yLmxlbmd0aDtmb3IoaDxjJiYoYz1oKSxoLT1jLHIubGVuZ3RoLT1jO25bYSsrXT1tW3ArK10sLS1jOyk7MD09PXIubGVuZ3RoJiYoci5tb2RlPTIxKTticmVhaztjYXNlIDI2OmlmKDA9PT1oKWJyZWFrIHQ7blthKytdPXIubGVuZ3RoLGgtLSxyLm1vZGU9MjE7YnJlYWs7Y2FzZSAyNzppZihyLndyYXApe2Zvcig7bDwzMjspe2lmKDA9PT1vKWJyZWFrIHQ7by0tLHV8PWlbcysrXTw8bCxsKz04fWlmKGQtPWgsdC50b3RhbF9vdXQrPWQsci50b3RhbCs9ZCxkJiYodC5hZGxlcj1yLmNoZWNrPXIuZmxhZ3M/QihyLmNoZWNrLG4sZCxhLWQpOk8oci5jaGVjayxuLGQsYS1kKSksZD1oLChyLmZsYWdzP3U6TCh1KSkhPT1yLmNoZWNrKXt0Lm1zZz1cImluY29ycmVjdCBkYXRhIGNoZWNrXCIsci5tb2RlPTMwO2JyZWFrfWw9dT0wfXIubW9kZT0yODtjYXNlIDI4OmlmKHIud3JhcCYmci5mbGFncyl7Zm9yKDtsPDMyOyl7aWYoMD09PW8pYnJlYWsgdDtvLS0sdSs9aVtzKytdPDxsLGwrPTh9aWYodSE9PSg0Mjk0OTY3Mjk1JnIudG90YWwpKXt0Lm1zZz1cImluY29ycmVjdCBsZW5ndGggY2hlY2tcIixyLm1vZGU9MzA7YnJlYWt9bD11PTB9ci5tb2RlPTI5O2Nhc2UgMjk6eD0xO2JyZWFrIHQ7Y2FzZSAzMDp4PS0zO2JyZWFrIHQ7Y2FzZSAzMTpyZXR1cm4tNDtjYXNlIDMyOmRlZmF1bHQ6cmV0dXJuIFV9cmV0dXJuIHQubmV4dF9vdXQ9YSx0LmF2YWlsX291dD1oLHQubmV4dF9pbj1zLHQuYXZhaWxfaW49byxyLmhvbGQ9dSxyLmJpdHM9bCwoci53c2l6ZXx8ZCE9PXQuYXZhaWxfb3V0JiZyLm1vZGU8MzAmJihyLm1vZGU8Mjd8fDQhPT1lKSkmJloodCx0Lm91dHB1dCx0Lm5leHRfb3V0LGQtdC5hdmFpbF9vdXQpPyhyLm1vZGU9MzEsLTQpOihmLT10LmF2YWlsX2luLGQtPXQuYXZhaWxfb3V0LHQudG90YWxfaW4rPWYsdC50b3RhbF9vdXQrPWQsci50b3RhbCs9ZCxyLndyYXAmJmQmJih0LmFkbGVyPXIuY2hlY2s9ci5mbGFncz9CKHIuY2hlY2ssbixkLHQubmV4dF9vdXQtZCk6TyhyLmNoZWNrLG4sZCx0Lm5leHRfb3V0LWQpKSx0LmRhdGFfdHlwZT1yLmJpdHMrKHIubGFzdD82NDowKSsoMTI9PT1yLm1vZGU/MTI4OjApKygyMD09PXIubW9kZXx8MTU9PT1yLm1vZGU/MjU2OjApLCgwPT1mJiYwPT09ZHx8ND09PWUpJiZ4PT09TiYmKHg9LTUpLHgpfSxyLmluZmxhdGVFbmQ9ZnVuY3Rpb24odCl7aWYoIXR8fCF0LnN0YXRlKXJldHVybiBVO3ZhciBlPXQuc3RhdGU7cmV0dXJuIGUud2luZG93JiYoZS53aW5kb3c9bnVsbCksdC5zdGF0ZT1udWxsLE59LHIuaW5mbGF0ZUdldEhlYWRlcj1mdW5jdGlvbih0LGUpe3ZhciByO3JldHVybiB0JiZ0LnN0YXRlPzA9PSgyJihyPXQuc3RhdGUpLndyYXApP1U6KChyLmhlYWQ9ZSkuZG9uZT0hMSxOKTpVfSxyLmluZmxhdGVTZXREaWN0aW9uYXJ5PWZ1bmN0aW9uKHQsZSl7dmFyIHIsaT1lLmxlbmd0aDtyZXR1cm4gdCYmdC5zdGF0ZT8wIT09KHI9dC5zdGF0ZSkud3JhcCYmMTEhPT1yLm1vZGU/VToxMT09PXIubW9kZSYmTygxLGUsaSwwKSE9PXIuY2hlY2s/LTM6Wih0LGUsaSxpKT8oci5tb2RlPTMxLC00KTooci5oYXZlZGljdD0xLE4pOlV9LHIuaW5mbGF0ZUluZm89XCJwYWtvIGluZmxhdGUgKGZyb20gTm9kZWNhIHByb2plY3QpXCJ9LHtcIi4uL3V0aWxzL2NvbW1vblwiOjQxLFwiLi9hZGxlcjMyXCI6NDMsXCIuL2NyYzMyXCI6NDUsXCIuL2luZmZhc3RcIjo0OCxcIi4vaW5mdHJlZXNcIjo1MH1dLDUwOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7dmFyIEQ9dChcIi4uL3V0aWxzL2NvbW1vblwiKSxGPVszLDQsNSw2LDcsOCw5LDEwLDExLDEzLDE1LDE3LDE5LDIzLDI3LDMxLDM1LDQzLDUxLDU5LDY3LDgzLDk5LDExNSwxMzEsMTYzLDE5NSwyMjcsMjU4LDAsMF0sTj1bMTYsMTYsMTYsMTYsMTYsMTYsMTYsMTYsMTcsMTcsMTcsMTcsMTgsMTgsMTgsMTgsMTksMTksMTksMTksMjAsMjAsMjAsMjAsMjEsMjEsMjEsMjEsMTYsNzIsNzhdLFU9WzEsMiwzLDQsNSw3LDksMTMsMTcsMjUsMzMsNDksNjUsOTcsMTI5LDE5MywyNTcsMzg1LDUxMyw3NjksMTAyNSwxNTM3LDIwNDksMzA3Myw0MDk3LDYxNDUsODE5MywxMjI4OSwxNjM4NSwyNDU3NywwLDBdLFA9WzE2LDE2LDE2LDE2LDE3LDE3LDE4LDE4LDE5LDE5LDIwLDIwLDIxLDIxLDIyLDIyLDIzLDIzLDI0LDI0LDI1LDI1LDI2LDI2LDI3LDI3LDI4LDI4LDI5LDI5LDY0LDY0XTtlLmV4cG9ydHM9ZnVuY3Rpb24odCxlLHIsaSxuLHMsYSxvKXt2YXIgaCx1LGwsZixkLGMscCxtLF8sZz1vLmJpdHMsYj0wLHY9MCx5PTAsdz0wLGs9MCx4PTAsUz0wLHo9MCxDPTAsRT0wLEE9bnVsbCxJPTAsTz1uZXcgRC5CdWYxNigxNiksQj1uZXcgRC5CdWYxNigxNiksUj1udWxsLFQ9MDtmb3IoYj0wO2I8PTE1O2IrKylPW2JdPTA7Zm9yKHY9MDt2PGk7disrKU9bZVtyK3ZdXSsrO2ZvcihrPWcsdz0xNTsxPD13JiYwPT09T1t3XTt3LS0pO2lmKHc8ayYmKGs9dyksMD09PXcpcmV0dXJuIG5bcysrXT0yMDk3MTUyMCxuW3MrK109MjA5NzE1MjAsby5iaXRzPTEsMDtmb3IoeT0xO3k8dyYmMD09PU9beV07eSsrKTtmb3Ioazx5JiYoaz15KSxiPXo9MTtiPD0xNTtiKyspaWYoejw8PTEsKHotPU9bYl0pPDApcmV0dXJuLTE7aWYoMDx6JiYoMD09PXR8fDEhPT13KSlyZXR1cm4tMTtmb3IoQlsxXT0wLGI9MTtiPDE1O2IrKylCW2IrMV09QltiXStPW2JdO2Zvcih2PTA7djxpO3YrKykwIT09ZVtyK3ZdJiYoYVtCW2Vbcit2XV0rK109dik7aWYoYz0wPT09dD8oQT1SPWEsMTkpOjE9PT10PyhBPUYsSS09MjU3LFI9TixULT0yNTcsMjU2KTooQT1VLFI9UCwtMSksYj15LGQ9cyxTPXY9RT0wLGw9LTEsZj0oQz0xPDwoeD1rKSktMSwxPT09dCYmODUyPEN8fDI9PT10JiY1OTI8QylyZXR1cm4gMTtmb3IoOzspe2ZvcihwPWItUyxfPWFbdl08Yz8obT0wLGFbdl0pOmFbdl0+Yz8obT1SW1QrYVt2XV0sQVtJK2Fbdl1dKToobT05NiwwKSxoPTE8PGItUyx5PXU9MTw8eDtuW2QrKEU+PlMpKyh1LT1oKV09cDw8MjR8bTw8MTZ8X3wwLDAhPT11Oyk7Zm9yKGg9MTw8Yi0xO0UmaDspaD4+PTE7aWYoMCE9PWg/KEUmPWgtMSxFKz1oKTpFPTAsdisrLDA9PS0tT1tiXSl7aWYoYj09PXcpYnJlYWs7Yj1lW3IrYVt2XV19aWYoazxiJiYoRSZmKSE9PWwpe2ZvcigwPT09UyYmKFM9ayksZCs9eSx6PTE8PCh4PWItUyk7eCtTPHcmJiEoKHotPU9beCtTXSk8PTApOyl4Kyssejw8PTE7aWYoQys9MTw8eCwxPT09dCYmODUyPEN8fDI9PT10JiY1OTI8QylyZXR1cm4gMTtuW2w9RSZmXT1rPDwyNHx4PDwxNnxkLXN8MH19cmV0dXJuIDAhPT1FJiYobltkK0VdPWItUzw8MjR8NjQ8PDE2fDApLG8uYml0cz1rLDB9fSx7XCIuLi91dGlscy9jb21tb25cIjo0MX1dLDUxOltmdW5jdGlvbih0LGUscil7XCJ1c2Ugc3RyaWN0XCI7ZS5leHBvcnRzPXsyOlwibmVlZCBkaWN0aW9uYXJ5XCIsMTpcInN0cmVhbSBlbmRcIiwwOlwiXCIsXCItMVwiOlwiZmlsZSBlcnJvclwiLFwiLTJcIjpcInN0cmVhbSBlcnJvclwiLFwiLTNcIjpcImRhdGEgZXJyb3JcIixcIi00XCI6XCJpbnN1ZmZpY2llbnQgbWVtb3J5XCIsXCItNVwiOlwiYnVmZmVyIGVycm9yXCIsXCItNlwiOlwiaW5jb21wYXRpYmxlIHZlcnNpb25cIn19LHt9XSw1MjpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO3ZhciBuPXQoXCIuLi91dGlscy9jb21tb25cIiksbz0wLGg9MTtmdW5jdGlvbiBpKHQpe2Zvcih2YXIgZT10Lmxlbmd0aDswPD0tLWU7KXRbZV09MH12YXIgcz0wLGE9MjksdT0yNTYsbD11KzErYSxmPTMwLGQ9MTksXz0yKmwrMSxnPTE1LGM9MTYscD03LG09MjU2LGI9MTYsdj0xNyx5PTE4LHc9WzAsMCwwLDAsMCwwLDAsMCwxLDEsMSwxLDIsMiwyLDIsMywzLDMsMyw0LDQsNCw0LDUsNSw1LDUsMF0saz1bMCwwLDAsMCwxLDEsMiwyLDMsMyw0LDQsNSw1LDYsNiw3LDcsOCw4LDksOSwxMCwxMCwxMSwxMSwxMiwxMiwxMywxM10seD1bMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwyLDMsN10sUz1bMTYsMTcsMTgsMCw4LDcsOSw2LDEwLDUsMTEsNCwxMiwzLDEzLDIsMTQsMSwxNV0sej1uZXcgQXJyYXkoMioobCsyKSk7aSh6KTt2YXIgQz1uZXcgQXJyYXkoMipmKTtpKEMpO3ZhciBFPW5ldyBBcnJheSg1MTIpO2koRSk7dmFyIEE9bmV3IEFycmF5KDI1Nik7aShBKTt2YXIgST1uZXcgQXJyYXkoYSk7aShJKTt2YXIgTyxCLFIsVD1uZXcgQXJyYXkoZik7ZnVuY3Rpb24gRCh0LGUscixpLG4pe3RoaXMuc3RhdGljX3RyZWU9dCx0aGlzLmV4dHJhX2JpdHM9ZSx0aGlzLmV4dHJhX2Jhc2U9cix0aGlzLmVsZW1zPWksdGhpcy5tYXhfbGVuZ3RoPW4sdGhpcy5oYXNfc3RyZWU9dCYmdC5sZW5ndGh9ZnVuY3Rpb24gRih0LGUpe3RoaXMuZHluX3RyZWU9dCx0aGlzLm1heF9jb2RlPTAsdGhpcy5zdGF0X2Rlc2M9ZX1mdW5jdGlvbiBOKHQpe3JldHVybiB0PDI1Nj9FW3RdOkVbMjU2Kyh0Pj4+NyldfWZ1bmN0aW9uIFUodCxlKXt0LnBlbmRpbmdfYnVmW3QucGVuZGluZysrXT0yNTUmZSx0LnBlbmRpbmdfYnVmW3QucGVuZGluZysrXT1lPj4+OCYyNTV9ZnVuY3Rpb24gUCh0LGUscil7dC5iaV92YWxpZD5jLXI/KHQuYmlfYnVmfD1lPDx0LmJpX3ZhbGlkJjY1NTM1LFUodCx0LmJpX2J1ZiksdC5iaV9idWY9ZT4+Yy10LmJpX3ZhbGlkLHQuYmlfdmFsaWQrPXItYyk6KHQuYmlfYnVmfD1lPDx0LmJpX3ZhbGlkJjY1NTM1LHQuYmlfdmFsaWQrPXIpfWZ1bmN0aW9uIEwodCxlLHIpe1AodCxyWzIqZV0sclsyKmUrMV0pfWZ1bmN0aW9uIGoodCxlKXtmb3IodmFyIHI9MDtyfD0xJnQsdD4+Pj0xLHI8PD0xLDA8LS1lOyk7cmV0dXJuIHI+Pj4xfWZ1bmN0aW9uIFoodCxlLHIpe3ZhciBpLG4scz1uZXcgQXJyYXkoZysxKSxhPTA7Zm9yKGk9MTtpPD1nO2krKylzW2ldPWE9YStyW2ktMV08PDE7Zm9yKG49MDtuPD1lO24rKyl7dmFyIG89dFsyKm4rMV07MCE9PW8mJih0WzIqbl09aihzW29dKyssbykpfX1mdW5jdGlvbiBXKHQpe3ZhciBlO2ZvcihlPTA7ZTxsO2UrKyl0LmR5bl9sdHJlZVsyKmVdPTA7Zm9yKGU9MDtlPGY7ZSsrKXQuZHluX2R0cmVlWzIqZV09MDtmb3IoZT0wO2U8ZDtlKyspdC5ibF90cmVlWzIqZV09MDt0LmR5bl9sdHJlZVsyKm1dPTEsdC5vcHRfbGVuPXQuc3RhdGljX2xlbj0wLHQubGFzdF9saXQ9dC5tYXRjaGVzPTB9ZnVuY3Rpb24gTSh0KXs4PHQuYmlfdmFsaWQ/VSh0LHQuYmlfYnVmKTowPHQuYmlfdmFsaWQmJih0LnBlbmRpbmdfYnVmW3QucGVuZGluZysrXT10LmJpX2J1ZiksdC5iaV9idWY9MCx0LmJpX3ZhbGlkPTB9ZnVuY3Rpb24gSCh0LGUscixpKXt2YXIgbj0yKmUscz0yKnI7cmV0dXJuIHRbbl08dFtzXXx8dFtuXT09PXRbc10mJmlbZV08PWlbcl19ZnVuY3Rpb24gRyh0LGUscil7Zm9yKHZhciBpPXQuaGVhcFtyXSxuPXI8PDE7bjw9dC5oZWFwX2xlbiYmKG48dC5oZWFwX2xlbiYmSChlLHQuaGVhcFtuKzFdLHQuaGVhcFtuXSx0LmRlcHRoKSYmbisrLCFIKGUsaSx0LmhlYXBbbl0sdC5kZXB0aCkpOyl0LmhlYXBbcl09dC5oZWFwW25dLHI9bixuPDw9MTt0LmhlYXBbcl09aX1mdW5jdGlvbiBLKHQsZSxyKXt2YXIgaSxuLHMsYSxvPTA7aWYoMCE9PXQubGFzdF9saXQpZm9yKDtpPXQucGVuZGluZ19idWZbdC5kX2J1ZisyKm9dPDw4fHQucGVuZGluZ19idWZbdC5kX2J1ZisyKm8rMV0sbj10LnBlbmRpbmdfYnVmW3QubF9idWYrb10sbysrLDA9PT1pP0wodCxuLGUpOihMKHQsKHM9QVtuXSkrdSsxLGUpLDAhPT0oYT13W3NdKSYmUCh0LG4tPUlbc10sYSksTCh0LHM9TigtLWkpLHIpLDAhPT0oYT1rW3NdKSYmUCh0LGktPVRbc10sYSkpLG88dC5sYXN0X2xpdDspO0wodCxtLGUpfWZ1bmN0aW9uIFkodCxlKXt2YXIgcixpLG4scz1lLmR5bl90cmVlLGE9ZS5zdGF0X2Rlc2Muc3RhdGljX3RyZWUsbz1lLnN0YXRfZGVzYy5oYXNfc3RyZWUsaD1lLnN0YXRfZGVzYy5lbGVtcyx1PS0xO2Zvcih0LmhlYXBfbGVuPTAsdC5oZWFwX21heD1fLHI9MDtyPGg7cisrKTAhPT1zWzIqcl0/KHQuaGVhcFsrK3QuaGVhcF9sZW5dPXU9cix0LmRlcHRoW3JdPTApOnNbMipyKzFdPTA7Zm9yKDt0LmhlYXBfbGVuPDI7KXNbMioobj10LmhlYXBbKyt0LmhlYXBfbGVuXT11PDI/Kyt1OjApXT0xLHQuZGVwdGhbbl09MCx0Lm9wdF9sZW4tLSxvJiYodC5zdGF0aWNfbGVuLT1hWzIqbisxXSk7Zm9yKGUubWF4X2NvZGU9dSxyPXQuaGVhcF9sZW4+PjE7MTw9cjtyLS0pRyh0LHMscik7Zm9yKG49aDtyPXQuaGVhcFsxXSx0LmhlYXBbMV09dC5oZWFwW3QuaGVhcF9sZW4tLV0sRyh0LHMsMSksaT10LmhlYXBbMV0sdC5oZWFwWy0tdC5oZWFwX21heF09cix0LmhlYXBbLS10LmhlYXBfbWF4XT1pLHNbMipuXT1zWzIqcl0rc1syKmldLHQuZGVwdGhbbl09KHQuZGVwdGhbcl0+PXQuZGVwdGhbaV0/dC5kZXB0aFtyXTp0LmRlcHRoW2ldKSsxLHNbMipyKzFdPXNbMippKzFdPW4sdC5oZWFwWzFdPW4rKyxHKHQscywxKSwyPD10LmhlYXBfbGVuOyk7dC5oZWFwWy0tdC5oZWFwX21heF09dC5oZWFwWzFdLGZ1bmN0aW9uKHQsZSl7dmFyIHIsaSxuLHMsYSxvLGg9ZS5keW5fdHJlZSx1PWUubWF4X2NvZGUsbD1lLnN0YXRfZGVzYy5zdGF0aWNfdHJlZSxmPWUuc3RhdF9kZXNjLmhhc19zdHJlZSxkPWUuc3RhdF9kZXNjLmV4dHJhX2JpdHMsYz1lLnN0YXRfZGVzYy5leHRyYV9iYXNlLHA9ZS5zdGF0X2Rlc2MubWF4X2xlbmd0aCxtPTA7Zm9yKHM9MDtzPD1nO3MrKyl0LmJsX2NvdW50W3NdPTA7Zm9yKGhbMip0LmhlYXBbdC5oZWFwX21heF0rMV09MCxyPXQuaGVhcF9tYXgrMTtyPF87cisrKXA8KHM9aFsyKmhbMiooaT10LmhlYXBbcl0pKzFdKzFdKzEpJiYocz1wLG0rKyksaFsyKmkrMV09cyx1PGl8fCh0LmJsX2NvdW50W3NdKyssYT0wLGM8PWkmJihhPWRbaS1jXSksbz1oWzIqaV0sdC5vcHRfbGVuKz1vKihzK2EpLGYmJih0LnN0YXRpY19sZW4rPW8qKGxbMippKzFdK2EpKSk7aWYoMCE9PW0pe2Rve2ZvcihzPXAtMTswPT09dC5ibF9jb3VudFtzXTspcy0tO3QuYmxfY291bnRbc10tLSx0LmJsX2NvdW50W3MrMV0rPTIsdC5ibF9jb3VudFtwXS0tLG0tPTJ9d2hpbGUoMDxtKTtmb3Iocz1wOzAhPT1zO3MtLSlmb3IoaT10LmJsX2NvdW50W3NdOzAhPT1pOyl1PChuPXQuaGVhcFstLXJdKXx8KGhbMipuKzFdIT09cyYmKHQub3B0X2xlbis9KHMtaFsyKm4rMV0pKmhbMipuXSxoWzIqbisxXT1zKSxpLS0pfX0odCxlKSxaKHMsdSx0LmJsX2NvdW50KX1mdW5jdGlvbiBYKHQsZSxyKXt2YXIgaSxuLHM9LTEsYT1lWzFdLG89MCxoPTcsdT00O2ZvcigwPT09YSYmKGg9MTM4LHU9MyksZVsyKihyKzEpKzFdPTY1NTM1LGk9MDtpPD1yO2krKyluPWEsYT1lWzIqKGkrMSkrMV0sKytvPGgmJm49PT1hfHwobzx1P3QuYmxfdHJlZVsyKm5dKz1vOjAhPT1uPyhuIT09cyYmdC5ibF90cmVlWzIqbl0rKyx0LmJsX3RyZWVbMipiXSsrKTpvPD0xMD90LmJsX3RyZWVbMip2XSsrOnQuYmxfdHJlZVsyKnldKysscz1uLHU9KG89MCk9PT1hPyhoPTEzOCwzKTpuPT09YT8oaD02LDMpOihoPTcsNCkpfWZ1bmN0aW9uIFYodCxlLHIpe3ZhciBpLG4scz0tMSxhPWVbMV0sbz0wLGg9Nyx1PTQ7Zm9yKDA9PT1hJiYoaD0xMzgsdT0zKSxpPTA7aTw9cjtpKyspaWYobj1hLGE9ZVsyKihpKzEpKzFdLCEoKytvPGgmJm49PT1hKSl7aWYobzx1KWZvcig7TCh0LG4sdC5ibF90cmVlKSwwIT0tLW87KTtlbHNlIDAhPT1uPyhuIT09cyYmKEwodCxuLHQuYmxfdHJlZSksby0tKSxMKHQsYix0LmJsX3RyZWUpLFAodCxvLTMsMikpOm88PTEwPyhMKHQsdix0LmJsX3RyZWUpLFAodCxvLTMsMykpOihMKHQseSx0LmJsX3RyZWUpLFAodCxvLTExLDcpKTtzPW4sdT0obz0wKT09PWE/KGg9MTM4LDMpOm49PT1hPyhoPTYsMyk6KGg9Nyw0KX19aShUKTt2YXIgcT0hMTtmdW5jdGlvbiBKKHQsZSxyLGkpe1AodCwoczw8MSkrKGk/MTowKSwzKSxmdW5jdGlvbih0LGUscixpKXtNKHQpLGkmJihVKHQsciksVSh0LH5yKSksbi5hcnJheVNldCh0LnBlbmRpbmdfYnVmLHQud2luZG93LGUscix0LnBlbmRpbmcpLHQucGVuZGluZys9cn0odCxlLHIsITApfXIuX3RyX2luaXQ9ZnVuY3Rpb24odCl7cXx8KGZ1bmN0aW9uKCl7dmFyIHQsZSxyLGksbixzPW5ldyBBcnJheShnKzEpO2ZvcihpPXI9MDtpPGEtMTtpKyspZm9yKElbaV09cix0PTA7dDwxPDx3W2ldO3QrKylBW3IrK109aTtmb3IoQVtyLTFdPWksaT1uPTA7aTwxNjtpKyspZm9yKFRbaV09bix0PTA7dDwxPDxrW2ldO3QrKylFW24rK109aTtmb3Iobj4+PTc7aTxmO2krKylmb3IoVFtpXT1uPDw3LHQ9MDt0PDE8PGtbaV0tNzt0KyspRVsyNTYrbisrXT1pO2ZvcihlPTA7ZTw9ZztlKyspc1tlXT0wO2Zvcih0PTA7dDw9MTQzOyl6WzIqdCsxXT04LHQrKyxzWzhdKys7Zm9yKDt0PD0yNTU7KXpbMip0KzFdPTksdCsrLHNbOV0rKztmb3IoO3Q8PTI3OTspelsyKnQrMV09Nyx0Kyssc1s3XSsrO2Zvcig7dDw9Mjg3Oyl6WzIqdCsxXT04LHQrKyxzWzhdKys7Zm9yKFooeixsKzEscyksdD0wO3Q8Zjt0KyspQ1syKnQrMV09NSxDWzIqdF09aih0LDUpO089bmV3IEQoeix3LHUrMSxsLGcpLEI9bmV3IEQoQyxrLDAsZixnKSxSPW5ldyBEKG5ldyBBcnJheSgwKSx4LDAsZCxwKX0oKSxxPSEwKSx0LmxfZGVzYz1uZXcgRih0LmR5bl9sdHJlZSxPKSx0LmRfZGVzYz1uZXcgRih0LmR5bl9kdHJlZSxCKSx0LmJsX2Rlc2M9bmV3IEYodC5ibF90cmVlLFIpLHQuYmlfYnVmPTAsdC5iaV92YWxpZD0wLFcodCl9LHIuX3RyX3N0b3JlZF9ibG9jaz1KLHIuX3RyX2ZsdXNoX2Jsb2NrPWZ1bmN0aW9uKHQsZSxyLGkpe3ZhciBuLHMsYT0wOzA8dC5sZXZlbD8oMj09PXQuc3RybS5kYXRhX3R5cGUmJih0LnN0cm0uZGF0YV90eXBlPWZ1bmN0aW9uKHQpe3ZhciBlLHI9NDA5MzYyNDQ0Nztmb3IoZT0wO2U8PTMxO2UrKyxyPj4+PTEpaWYoMSZyJiYwIT09dC5keW5fbHRyZWVbMiplXSlyZXR1cm4gbztpZigwIT09dC5keW5fbHRyZWVbMThdfHwwIT09dC5keW5fbHRyZWVbMjBdfHwwIT09dC5keW5fbHRyZWVbMjZdKXJldHVybiBoO2ZvcihlPTMyO2U8dTtlKyspaWYoMCE9PXQuZHluX2x0cmVlWzIqZV0pcmV0dXJuIGg7cmV0dXJuIG99KHQpKSxZKHQsdC5sX2Rlc2MpLFkodCx0LmRfZGVzYyksYT1mdW5jdGlvbih0KXt2YXIgZTtmb3IoWCh0LHQuZHluX2x0cmVlLHQubF9kZXNjLm1heF9jb2RlKSxYKHQsdC5keW5fZHRyZWUsdC5kX2Rlc2MubWF4X2NvZGUpLFkodCx0LmJsX2Rlc2MpLGU9ZC0xOzM8PWUmJjA9PT10LmJsX3RyZWVbMipTW2VdKzFdO2UtLSk7cmV0dXJuIHQub3B0X2xlbis9MyooZSsxKSs1KzUrNCxlfSh0KSxuPXQub3B0X2xlbiszKzc+Pj4zLChzPXQuc3RhdGljX2xlbiszKzc+Pj4zKTw9biYmKG49cykpOm49cz1yKzUscis0PD1uJiYtMSE9PWU/Sih0LGUscixpKTo0PT09dC5zdHJhdGVneXx8cz09PW4/KFAodCwyKyhpPzE6MCksMyksSyh0LHosQykpOihQKHQsNCsoaT8xOjApLDMpLGZ1bmN0aW9uKHQsZSxyLGkpe3ZhciBuO2ZvcihQKHQsZS0yNTcsNSksUCh0LHItMSw1KSxQKHQsaS00LDQpLG49MDtuPGk7bisrKVAodCx0LmJsX3RyZWVbMipTW25dKzFdLDMpO1YodCx0LmR5bl9sdHJlZSxlLTEpLFYodCx0LmR5bl9kdHJlZSxyLTEpfSh0LHQubF9kZXNjLm1heF9jb2RlKzEsdC5kX2Rlc2MubWF4X2NvZGUrMSxhKzEpLEsodCx0LmR5bl9sdHJlZSx0LmR5bl9kdHJlZSkpLFcodCksaSYmTSh0KX0sci5fdHJfdGFsbHk9ZnVuY3Rpb24odCxlLHIpe3JldHVybiB0LnBlbmRpbmdfYnVmW3QuZF9idWYrMip0Lmxhc3RfbGl0XT1lPj4+OCYyNTUsdC5wZW5kaW5nX2J1Zlt0LmRfYnVmKzIqdC5sYXN0X2xpdCsxXT0yNTUmZSx0LnBlbmRpbmdfYnVmW3QubF9idWYrdC5sYXN0X2xpdF09MjU1JnIsdC5sYXN0X2xpdCsrLDA9PT1lP3QuZHluX2x0cmVlWzIqcl0rKzoodC5tYXRjaGVzKyssZS0tLHQuZHluX2x0cmVlWzIqKEFbcl0rdSsxKV0rKyx0LmR5bl9kdHJlZVsyKk4oZSldKyspLHQubGFzdF9saXQ9PT10LmxpdF9idWZzaXplLTF9LHIuX3RyX2FsaWduPWZ1bmN0aW9uKHQpe1AodCwyLDMpLEwodCxtLHopLGZ1bmN0aW9uKHQpezE2PT09dC5iaV92YWxpZD8oVSh0LHQuYmlfYnVmKSx0LmJpX2J1Zj0wLHQuYmlfdmFsaWQ9MCk6ODw9dC5iaV92YWxpZCYmKHQucGVuZGluZ19idWZbdC5wZW5kaW5nKytdPTI1NSZ0LmJpX2J1Zix0LmJpX2J1Zj4+PTgsdC5iaV92YWxpZC09OCl9KHQpfX0se1wiLi4vdXRpbHMvY29tbW9uXCI6NDF9XSw1MzpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2UuZXhwb3J0cz1mdW5jdGlvbigpe3RoaXMuaW5wdXQ9bnVsbCx0aGlzLm5leHRfaW49MCx0aGlzLmF2YWlsX2luPTAsdGhpcy50b3RhbF9pbj0wLHRoaXMub3V0cHV0PW51bGwsdGhpcy5uZXh0X291dD0wLHRoaXMuYXZhaWxfb3V0PTAsdGhpcy50b3RhbF9vdXQ9MCx0aGlzLm1zZz1cIlwiLHRoaXMuc3RhdGU9bnVsbCx0aGlzLmRhdGFfdHlwZT0yLHRoaXMuYWRsZXI9MH19LHt9XSw1NDpbZnVuY3Rpb24odCxlLHIpe1widXNlIHN0cmljdFwiO2UuZXhwb3J0cz1cImZ1bmN0aW9uXCI9PXR5cGVvZiBzZXRJbW1lZGlhdGU/c2V0SW1tZWRpYXRlOmZ1bmN0aW9uKCl7dmFyIHQ9W10uc2xpY2UuYXBwbHkoYXJndW1lbnRzKTt0LnNwbGljZSgxLDAsMCksc2V0VGltZW91dC5hcHBseShudWxsLHQpfX0se31dfSx7fSxbMTBdKSgxMCl9KTsiLCIvKlxub2JqZWN0LWFzc2lnblxuKGMpIFNpbmRyZSBTb3JodXNcbkBsaWNlbnNlIE1JVFxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbnZhciBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwcm9wSXNFbnVtZXJhYmxlID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuZnVuY3Rpb24gdG9PYmplY3QodmFsKSB7XG5cdGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QuYXNzaWduIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHR9XG5cblx0cmV0dXJuIE9iamVjdCh2YWwpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRVc2VOYXRpdmUoKSB7XG5cdHRyeSB7XG5cdFx0aWYgKCFPYmplY3QuYXNzaWduKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gRGV0ZWN0IGJ1Z2d5IHByb3BlcnR5IGVudW1lcmF0aW9uIG9yZGVyIGluIG9sZGVyIFY4IHZlcnNpb25zLlxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9NDExOFxuXHRcdHZhciB0ZXN0MSA9IG5ldyBTdHJpbmcoJ2FiYycpOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXctd3JhcHBlcnNcblx0XHR0ZXN0MVs1XSA9ICdkZSc7XG5cdFx0aWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QxKVswXSA9PT0gJzUnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MiA9IHt9O1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKykge1xuXHRcdFx0dGVzdDJbJ18nICsgU3RyaW5nLmZyb21DaGFyQ29kZShpKV0gPSBpO1xuXHRcdH1cblx0XHR2YXIgb3JkZXIyID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDIpLm1hcChmdW5jdGlvbiAobikge1xuXHRcdFx0cmV0dXJuIHRlc3QyW25dO1xuXHRcdH0pO1xuXHRcdGlmIChvcmRlcjIuam9pbignJykgIT09ICcwMTIzNDU2Nzg5Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDMgPSB7fTtcblx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnLnNwbGl0KCcnKS5mb3JFYWNoKGZ1bmN0aW9uIChsZXR0ZXIpIHtcblx0XHRcdHRlc3QzW2xldHRlcl0gPSBsZXR0ZXI7XG5cdFx0fSk7XG5cdFx0aWYgKE9iamVjdC5rZXlzKE9iamVjdC5hc3NpZ24oe30sIHRlc3QzKSkuam9pbignJykgIT09XG5cdFx0XHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0Ly8gV2UgZG9uJ3QgZXhwZWN0IGFueSBvZiB0aGUgYWJvdmUgdG8gdGhyb3csIGJ1dCBiZXR0ZXIgdG8gYmUgc2FmZS5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGRVc2VOYXRpdmUoKSA/IE9iamVjdC5hc3NpZ24gOiBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcblx0dmFyIGZyb207XG5cdHZhciB0byA9IHRvT2JqZWN0KHRhcmdldCk7XG5cdHZhciBzeW1ib2xzO1xuXG5cdGZvciAodmFyIHMgPSAxOyBzIDwgYXJndW1lbnRzLmxlbmd0aDsgcysrKSB7XG5cdFx0ZnJvbSA9IE9iamVjdChhcmd1bWVudHNbc10pO1xuXG5cdFx0Zm9yICh2YXIga2V5IGluIGZyb20pIHtcblx0XHRcdGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGZyb20sIGtleSkpIHtcblx0XHRcdFx0dG9ba2V5XSA9IGZyb21ba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG5cdFx0XHRzeW1ib2xzID0gZ2V0T3duUHJvcGVydHlTeW1ib2xzKGZyb20pO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzeW1ib2xzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChwcm9wSXNFbnVtZXJhYmxlLmNhbGwoZnJvbSwgc3ltYm9sc1tpXSkpIHtcblx0XHRcdFx0XHR0b1tzeW1ib2xzW2ldXSA9IGZyb21bc3ltYm9sc1tpXV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuIiwiLyogQGxpY2Vuc2VcblBhcGEgUGFyc2VcbnY1LjMuMlxuaHR0cHM6Ly9naXRodWIuY29tL21ob2x0L1BhcGFQYXJzZVxuTGljZW5zZTogTUlUXG4qL1xuIWZ1bmN0aW9uKGUsdCl7XCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kP2RlZmluZShbXSx0KTpcIm9iamVjdFwiPT10eXBlb2YgbW9kdWxlJiZcInVuZGVmaW5lZFwiIT10eXBlb2YgZXhwb3J0cz9tb2R1bGUuZXhwb3J0cz10KCk6ZS5QYXBhPXQoKX0odGhpcyxmdW5jdGlvbiBzKCl7XCJ1c2Ugc3RyaWN0XCI7dmFyIGY9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHNlbGY/c2VsZjpcInVuZGVmaW5lZFwiIT10eXBlb2Ygd2luZG93P3dpbmRvdzp2b2lkIDAhPT1mP2Y6e307dmFyIG49IWYuZG9jdW1lbnQmJiEhZi5wb3N0TWVzc2FnZSxvPW4mJi9ibG9iOi9pLnRlc3QoKGYubG9jYXRpb258fHt9KS5wcm90b2NvbCksYT17fSxoPTAsYj17cGFyc2U6ZnVuY3Rpb24oZSx0KXt2YXIgaT0odD10fHx7fSkuZHluYW1pY1R5cGluZ3x8ITE7TShpKSYmKHQuZHluYW1pY1R5cGluZ0Z1bmN0aW9uPWksaT17fSk7aWYodC5keW5hbWljVHlwaW5nPWksdC50cmFuc2Zvcm09ISFNKHQudHJhbnNmb3JtKSYmdC50cmFuc2Zvcm0sdC53b3JrZXImJmIuV09SS0VSU19TVVBQT1JURUQpe3ZhciByPWZ1bmN0aW9uKCl7aWYoIWIuV09SS0VSU19TVVBQT1JURUQpcmV0dXJuITE7dmFyIGU9KGk9Zi5VUkx8fGYud2Via2l0VVJMfHxudWxsLHI9cy50b1N0cmluZygpLGIuQkxPQl9VUkx8fChiLkJMT0JfVVJMPWkuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtcIihcIixyLFwiKSgpO1wiXSx7dHlwZTpcInRleHQvamF2YXNjcmlwdFwifSkpKSksdD1uZXcgZi5Xb3JrZXIoZSk7dmFyIGkscjtyZXR1cm4gdC5vbm1lc3NhZ2U9Xyx0LmlkPWgrKyxhW3QuaWRdPXR9KCk7cmV0dXJuIHIudXNlclN0ZXA9dC5zdGVwLHIudXNlckNodW5rPXQuY2h1bmssci51c2VyQ29tcGxldGU9dC5jb21wbGV0ZSxyLnVzZXJFcnJvcj10LmVycm9yLHQuc3RlcD1NKHQuc3RlcCksdC5jaHVuaz1NKHQuY2h1bmspLHQuY29tcGxldGU9TSh0LmNvbXBsZXRlKSx0LmVycm9yPU0odC5lcnJvciksZGVsZXRlIHQud29ya2VyLHZvaWQgci5wb3N0TWVzc2FnZSh7aW5wdXQ6ZSxjb25maWc6dCx3b3JrZXJJZDpyLmlkfSl9dmFyIG49bnVsbDtiLk5PREVfU1RSRUFNX0lOUFVULFwic3RyaW5nXCI9PXR5cGVvZiBlP249dC5kb3dubG9hZD9uZXcgbCh0KTpuZXcgcCh0KTohMD09PWUucmVhZGFibGUmJk0oZS5yZWFkKSYmTShlLm9uKT9uPW5ldyBnKHQpOihmLkZpbGUmJmUgaW5zdGFuY2VvZiBGaWxlfHxlIGluc3RhbmNlb2YgT2JqZWN0KSYmKG49bmV3IGModCkpO3JldHVybiBuLnN0cmVhbShlKX0sdW5wYXJzZTpmdW5jdGlvbihlLHQpe3ZhciBuPSExLF89ITAsbT1cIixcIix5PVwiXFxyXFxuXCIscz0nXCInLGE9cytzLGk9ITEscj1udWxsLG89ITE7IWZ1bmN0aW9uKCl7aWYoXCJvYmplY3RcIiE9dHlwZW9mIHQpcmV0dXJuO1wic3RyaW5nXCIhPXR5cGVvZiB0LmRlbGltaXRlcnx8Yi5CQURfREVMSU1JVEVSUy5maWx0ZXIoZnVuY3Rpb24oZSl7cmV0dXJuLTEhPT10LmRlbGltaXRlci5pbmRleE9mKGUpfSkubGVuZ3RofHwobT10LmRlbGltaXRlcik7KFwiYm9vbGVhblwiPT10eXBlb2YgdC5xdW90ZXN8fFwiZnVuY3Rpb25cIj09dHlwZW9mIHQucXVvdGVzfHxBcnJheS5pc0FycmF5KHQucXVvdGVzKSkmJihuPXQucXVvdGVzKTtcImJvb2xlYW5cIiE9dHlwZW9mIHQuc2tpcEVtcHR5TGluZXMmJlwic3RyaW5nXCIhPXR5cGVvZiB0LnNraXBFbXB0eUxpbmVzfHwoaT10LnNraXBFbXB0eUxpbmVzKTtcInN0cmluZ1wiPT10eXBlb2YgdC5uZXdsaW5lJiYoeT10Lm5ld2xpbmUpO1wic3RyaW5nXCI9PXR5cGVvZiB0LnF1b3RlQ2hhciYmKHM9dC5xdW90ZUNoYXIpO1wiYm9vbGVhblwiPT10eXBlb2YgdC5oZWFkZXImJihfPXQuaGVhZGVyKTtpZihBcnJheS5pc0FycmF5KHQuY29sdW1ucykpe2lmKDA9PT10LmNvbHVtbnMubGVuZ3RoKXRocm93IG5ldyBFcnJvcihcIk9wdGlvbiBjb2x1bW5zIGlzIGVtcHR5XCIpO3I9dC5jb2x1bW5zfXZvaWQgMCE9PXQuZXNjYXBlQ2hhciYmKGE9dC5lc2NhcGVDaGFyK3MpOyhcImJvb2xlYW5cIj09dHlwZW9mIHQuZXNjYXBlRm9ybXVsYWV8fHQuZXNjYXBlRm9ybXVsYWUgaW5zdGFuY2VvZiBSZWdFeHApJiYobz10LmVzY2FwZUZvcm11bGFlIGluc3RhbmNlb2YgUmVnRXhwP3QuZXNjYXBlRm9ybXVsYWU6L15bPStcXC1AXFx0XFxyXS4qJC8pfSgpO3ZhciBoPW5ldyBSZWdFeHAoaihzKSxcImdcIik7XCJzdHJpbmdcIj09dHlwZW9mIGUmJihlPUpTT04ucGFyc2UoZSkpO2lmKEFycmF5LmlzQXJyYXkoZSkpe2lmKCFlLmxlbmd0aHx8QXJyYXkuaXNBcnJheShlWzBdKSlyZXR1cm4gdShudWxsLGUsaSk7aWYoXCJvYmplY3RcIj09dHlwZW9mIGVbMF0pcmV0dXJuIHUocnx8T2JqZWN0LmtleXMoZVswXSksZSxpKX1lbHNlIGlmKFwib2JqZWN0XCI9PXR5cGVvZiBlKXJldHVyblwic3RyaW5nXCI9PXR5cGVvZiBlLmRhdGEmJihlLmRhdGE9SlNPTi5wYXJzZShlLmRhdGEpKSxBcnJheS5pc0FycmF5KGUuZGF0YSkmJihlLmZpZWxkc3x8KGUuZmllbGRzPWUubWV0YSYmZS5tZXRhLmZpZWxkc3x8ciksZS5maWVsZHN8fChlLmZpZWxkcz1BcnJheS5pc0FycmF5KGUuZGF0YVswXSk/ZS5maWVsZHM6XCJvYmplY3RcIj09dHlwZW9mIGUuZGF0YVswXT9PYmplY3Qua2V5cyhlLmRhdGFbMF0pOltdKSxBcnJheS5pc0FycmF5KGUuZGF0YVswXSl8fFwib2JqZWN0XCI9PXR5cGVvZiBlLmRhdGFbMF18fChlLmRhdGE9W2UuZGF0YV0pKSx1KGUuZmllbGRzfHxbXSxlLmRhdGF8fFtdLGkpO3Rocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byBzZXJpYWxpemUgdW5yZWNvZ25pemVkIGlucHV0XCIpO2Z1bmN0aW9uIHUoZSx0LGkpe3ZhciByPVwiXCI7XCJzdHJpbmdcIj09dHlwZW9mIGUmJihlPUpTT04ucGFyc2UoZSkpLFwic3RyaW5nXCI9PXR5cGVvZiB0JiYodD1KU09OLnBhcnNlKHQpKTt2YXIgbj1BcnJheS5pc0FycmF5KGUpJiYwPGUubGVuZ3RoLHM9IUFycmF5LmlzQXJyYXkodFswXSk7aWYobiYmXyl7Zm9yKHZhciBhPTA7YTxlLmxlbmd0aDthKyspMDxhJiYocis9bSkscis9dihlW2FdLGEpOzA8dC5sZW5ndGgmJihyKz15KX1mb3IodmFyIG89MDtvPHQubGVuZ3RoO28rKyl7dmFyIGg9bj9lLmxlbmd0aDp0W29dLmxlbmd0aCx1PSExLGY9bj8wPT09T2JqZWN0LmtleXModFtvXSkubGVuZ3RoOjA9PT10W29dLmxlbmd0aDtpZihpJiYhbiYmKHU9XCJncmVlZHlcIj09PWk/XCJcIj09PXRbb10uam9pbihcIlwiKS50cmltKCk6MT09PXRbb10ubGVuZ3RoJiYwPT09dFtvXVswXS5sZW5ndGgpLFwiZ3JlZWR5XCI9PT1pJiZuKXtmb3IodmFyIGQ9W10sbD0wO2w8aDtsKyspe3ZhciBjPXM/ZVtsXTpsO2QucHVzaCh0W29dW2NdKX11PVwiXCI9PT1kLmpvaW4oXCJcIikudHJpbSgpfWlmKCF1KXtmb3IodmFyIHA9MDtwPGg7cCsrKXswPHAmJiFmJiYocis9bSk7dmFyIGc9biYmcz9lW3BdOnA7cis9dih0W29dW2ddLHApfW88dC5sZW5ndGgtMSYmKCFpfHwwPGgmJiFmKSYmKHIrPXkpfX1yZXR1cm4gcn1mdW5jdGlvbiB2KGUsdCl7aWYobnVsbD09ZSlyZXR1cm5cIlwiO2lmKGUuY29uc3RydWN0b3I9PT1EYXRlKXJldHVybiBKU09OLnN0cmluZ2lmeShlKS5zbGljZSgxLDI1KTt2YXIgaT0hMTtvJiZcInN0cmluZ1wiPT10eXBlb2YgZSYmby50ZXN0KGUpJiYoZT1cIidcIitlLGk9ITApO3ZhciByPWUudG9TdHJpbmcoKS5yZXBsYWNlKGgsYSk7cmV0dXJuKGk9aXx8ITA9PT1ufHxcImZ1bmN0aW9uXCI9PXR5cGVvZiBuJiZuKGUsdCl8fEFycmF5LmlzQXJyYXkobikmJm5bdF18fGZ1bmN0aW9uKGUsdCl7Zm9yKHZhciBpPTA7aTx0Lmxlbmd0aDtpKyspaWYoLTE8ZS5pbmRleE9mKHRbaV0pKXJldHVybiEwO3JldHVybiExfShyLGIuQkFEX0RFTElNSVRFUlMpfHwtMTxyLmluZGV4T2YobSl8fFwiIFwiPT09ci5jaGFyQXQoMCl8fFwiIFwiPT09ci5jaGFyQXQoci5sZW5ndGgtMSkpP3MrcitzOnJ9fX07aWYoYi5SRUNPUkRfU0VQPVN0cmluZy5mcm9tQ2hhckNvZGUoMzApLGIuVU5JVF9TRVA9U3RyaW5nLmZyb21DaGFyQ29kZSgzMSksYi5CWVRFX09SREVSX01BUks9XCJcXHVmZWZmXCIsYi5CQURfREVMSU1JVEVSUz1bXCJcXHJcIixcIlxcblwiLCdcIicsYi5CWVRFX09SREVSX01BUktdLGIuV09SS0VSU19TVVBQT1JURUQ9IW4mJiEhZi5Xb3JrZXIsYi5OT0RFX1NUUkVBTV9JTlBVVD0xLGIuTG9jYWxDaHVua1NpemU9MTA0ODU3NjAsYi5SZW1vdGVDaHVua1NpemU9NTI0Mjg4MCxiLkRlZmF1bHREZWxpbWl0ZXI9XCIsXCIsYi5QYXJzZXI9RSxiLlBhcnNlckhhbmRsZT1pLGIuTmV0d29ya1N0cmVhbWVyPWwsYi5GaWxlU3RyZWFtZXI9YyxiLlN0cmluZ1N0cmVhbWVyPXAsYi5SZWFkYWJsZVN0cmVhbVN0cmVhbWVyPWcsZi5qUXVlcnkpe3ZhciBkPWYualF1ZXJ5O2QuZm4ucGFyc2U9ZnVuY3Rpb24obyl7dmFyIGk9by5jb25maWd8fHt9LGg9W107cmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbihlKXtpZighKFwiSU5QVVRcIj09PWQodGhpcykucHJvcChcInRhZ05hbWVcIikudG9VcHBlckNhc2UoKSYmXCJmaWxlXCI9PT1kKHRoaXMpLmF0dHIoXCJ0eXBlXCIpLnRvTG93ZXJDYXNlKCkmJmYuRmlsZVJlYWRlcil8fCF0aGlzLmZpbGVzfHwwPT09dGhpcy5maWxlcy5sZW5ndGgpcmV0dXJuITA7Zm9yKHZhciB0PTA7dDx0aGlzLmZpbGVzLmxlbmd0aDt0KyspaC5wdXNoKHtmaWxlOnRoaXMuZmlsZXNbdF0saW5wdXRFbGVtOnRoaXMsaW5zdGFuY2VDb25maWc6ZC5leHRlbmQoe30saSl9KX0pLGUoKSx0aGlzO2Z1bmN0aW9uIGUoKXtpZigwIT09aC5sZW5ndGgpe3ZhciBlLHQsaSxyLG49aFswXTtpZihNKG8uYmVmb3JlKSl7dmFyIHM9by5iZWZvcmUobi5maWxlLG4uaW5wdXRFbGVtKTtpZihcIm9iamVjdFwiPT10eXBlb2Ygcyl7aWYoXCJhYm9ydFwiPT09cy5hY3Rpb24pcmV0dXJuIGU9XCJBYm9ydEVycm9yXCIsdD1uLmZpbGUsaT1uLmlucHV0RWxlbSxyPXMucmVhc29uLHZvaWQoTShvLmVycm9yKSYmby5lcnJvcih7bmFtZTplfSx0LGkscikpO2lmKFwic2tpcFwiPT09cy5hY3Rpb24pcmV0dXJuIHZvaWQgdSgpO1wib2JqZWN0XCI9PXR5cGVvZiBzLmNvbmZpZyYmKG4uaW5zdGFuY2VDb25maWc9ZC5leHRlbmQobi5pbnN0YW5jZUNvbmZpZyxzLmNvbmZpZykpfWVsc2UgaWYoXCJza2lwXCI9PT1zKXJldHVybiB2b2lkIHUoKX12YXIgYT1uLmluc3RhbmNlQ29uZmlnLmNvbXBsZXRlO24uaW5zdGFuY2VDb25maWcuY29tcGxldGU9ZnVuY3Rpb24oZSl7TShhKSYmYShlLG4uZmlsZSxuLmlucHV0RWxlbSksdSgpfSxiLnBhcnNlKG4uZmlsZSxuLmluc3RhbmNlQ29uZmlnKX1lbHNlIE0oby5jb21wbGV0ZSkmJm8uY29tcGxldGUoKX1mdW5jdGlvbiB1KCl7aC5zcGxpY2UoMCwxKSxlKCl9fX1mdW5jdGlvbiB1KGUpe3RoaXMuX2hhbmRsZT1udWxsLHRoaXMuX2ZpbmlzaGVkPSExLHRoaXMuX2NvbXBsZXRlZD0hMSx0aGlzLl9oYWx0ZWQ9ITEsdGhpcy5faW5wdXQ9bnVsbCx0aGlzLl9iYXNlSW5kZXg9MCx0aGlzLl9wYXJ0aWFsTGluZT1cIlwiLHRoaXMuX3Jvd0NvdW50PTAsdGhpcy5fc3RhcnQ9MCx0aGlzLl9uZXh0Q2h1bms9bnVsbCx0aGlzLmlzRmlyc3RDaHVuaz0hMCx0aGlzLl9jb21wbGV0ZVJlc3VsdHM9e2RhdGE6W10sZXJyb3JzOltdLG1ldGE6e319LGZ1bmN0aW9uKGUpe3ZhciB0PXcoZSk7dC5jaHVua1NpemU9cGFyc2VJbnQodC5jaHVua1NpemUpLGUuc3RlcHx8ZS5jaHVua3x8KHQuY2h1bmtTaXplPW51bGwpO3RoaXMuX2hhbmRsZT1uZXcgaSh0KSwodGhpcy5faGFuZGxlLnN0cmVhbWVyPXRoaXMpLl9jb25maWc9dH0uY2FsbCh0aGlzLGUpLHRoaXMucGFyc2VDaHVuaz1mdW5jdGlvbihlLHQpe2lmKHRoaXMuaXNGaXJzdENodW5rJiZNKHRoaXMuX2NvbmZpZy5iZWZvcmVGaXJzdENodW5rKSl7dmFyIGk9dGhpcy5fY29uZmlnLmJlZm9yZUZpcnN0Q2h1bmsoZSk7dm9pZCAwIT09aSYmKGU9aSl9dGhpcy5pc0ZpcnN0Q2h1bms9ITEsdGhpcy5faGFsdGVkPSExO3ZhciByPXRoaXMuX3BhcnRpYWxMaW5lK2U7dGhpcy5fcGFydGlhbExpbmU9XCJcIjt2YXIgbj10aGlzLl9oYW5kbGUucGFyc2Uocix0aGlzLl9iYXNlSW5kZXgsIXRoaXMuX2ZpbmlzaGVkKTtpZighdGhpcy5faGFuZGxlLnBhdXNlZCgpJiYhdGhpcy5faGFuZGxlLmFib3J0ZWQoKSl7dmFyIHM9bi5tZXRhLmN1cnNvcjt0aGlzLl9maW5pc2hlZHx8KHRoaXMuX3BhcnRpYWxMaW5lPXIuc3Vic3RyaW5nKHMtdGhpcy5fYmFzZUluZGV4KSx0aGlzLl9iYXNlSW5kZXg9cyksbiYmbi5kYXRhJiYodGhpcy5fcm93Q291bnQrPW4uZGF0YS5sZW5ndGgpO3ZhciBhPXRoaXMuX2ZpbmlzaGVkfHx0aGlzLl9jb25maWcucHJldmlldyYmdGhpcy5fcm93Q291bnQ+PXRoaXMuX2NvbmZpZy5wcmV2aWV3O2lmKG8pZi5wb3N0TWVzc2FnZSh7cmVzdWx0czpuLHdvcmtlcklkOmIuV09SS0VSX0lELGZpbmlzaGVkOmF9KTtlbHNlIGlmKE0odGhpcy5fY29uZmlnLmNodW5rKSYmIXQpe2lmKHRoaXMuX2NvbmZpZy5jaHVuayhuLHRoaXMuX2hhbmRsZSksdGhpcy5faGFuZGxlLnBhdXNlZCgpfHx0aGlzLl9oYW5kbGUuYWJvcnRlZCgpKXJldHVybiB2b2lkKHRoaXMuX2hhbHRlZD0hMCk7bj12b2lkIDAsdGhpcy5fY29tcGxldGVSZXN1bHRzPXZvaWQgMH1yZXR1cm4gdGhpcy5fY29uZmlnLnN0ZXB8fHRoaXMuX2NvbmZpZy5jaHVua3x8KHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5kYXRhPXRoaXMuX2NvbXBsZXRlUmVzdWx0cy5kYXRhLmNvbmNhdChuLmRhdGEpLHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5lcnJvcnM9dGhpcy5fY29tcGxldGVSZXN1bHRzLmVycm9ycy5jb25jYXQobi5lcnJvcnMpLHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5tZXRhPW4ubWV0YSksdGhpcy5fY29tcGxldGVkfHwhYXx8IU0odGhpcy5fY29uZmlnLmNvbXBsZXRlKXx8biYmbi5tZXRhLmFib3J0ZWR8fCh0aGlzLl9jb25maWcuY29tcGxldGUodGhpcy5fY29tcGxldGVSZXN1bHRzLHRoaXMuX2lucHV0KSx0aGlzLl9jb21wbGV0ZWQ9ITApLGF8fG4mJm4ubWV0YS5wYXVzZWR8fHRoaXMuX25leHRDaHVuaygpLG59dGhpcy5faGFsdGVkPSEwfSx0aGlzLl9zZW5kRXJyb3I9ZnVuY3Rpb24oZSl7TSh0aGlzLl9jb25maWcuZXJyb3IpP3RoaXMuX2NvbmZpZy5lcnJvcihlKTpvJiZ0aGlzLl9jb25maWcuZXJyb3ImJmYucG9zdE1lc3NhZ2Uoe3dvcmtlcklkOmIuV09SS0VSX0lELGVycm9yOmUsZmluaXNoZWQ6ITF9KX19ZnVuY3Rpb24gbChlKXt2YXIgcjsoZT1lfHx7fSkuY2h1bmtTaXplfHwoZS5jaHVua1NpemU9Yi5SZW1vdGVDaHVua1NpemUpLHUuY2FsbCh0aGlzLGUpLHRoaXMuX25leHRDaHVuaz1uP2Z1bmN0aW9uKCl7dGhpcy5fcmVhZENodW5rKCksdGhpcy5fY2h1bmtMb2FkZWQoKX06ZnVuY3Rpb24oKXt0aGlzLl9yZWFkQ2h1bmsoKX0sdGhpcy5zdHJlYW09ZnVuY3Rpb24oZSl7dGhpcy5faW5wdXQ9ZSx0aGlzLl9uZXh0Q2h1bmsoKX0sdGhpcy5fcmVhZENodW5rPWZ1bmN0aW9uKCl7aWYodGhpcy5fZmluaXNoZWQpdGhpcy5fY2h1bmtMb2FkZWQoKTtlbHNle2lmKHI9bmV3IFhNTEh0dHBSZXF1ZXN0LHRoaXMuX2NvbmZpZy53aXRoQ3JlZGVudGlhbHMmJihyLndpdGhDcmVkZW50aWFscz10aGlzLl9jb25maWcud2l0aENyZWRlbnRpYWxzKSxufHwoci5vbmxvYWQ9dih0aGlzLl9jaHVua0xvYWRlZCx0aGlzKSxyLm9uZXJyb3I9dih0aGlzLl9jaHVua0Vycm9yLHRoaXMpKSxyLm9wZW4odGhpcy5fY29uZmlnLmRvd25sb2FkUmVxdWVzdEJvZHk/XCJQT1NUXCI6XCJHRVRcIix0aGlzLl9pbnB1dCwhbiksdGhpcy5fY29uZmlnLmRvd25sb2FkUmVxdWVzdEhlYWRlcnMpe3ZhciBlPXRoaXMuX2NvbmZpZy5kb3dubG9hZFJlcXVlc3RIZWFkZXJzO2Zvcih2YXIgdCBpbiBlKXIuc2V0UmVxdWVzdEhlYWRlcih0LGVbdF0pfWlmKHRoaXMuX2NvbmZpZy5jaHVua1NpemUpe3ZhciBpPXRoaXMuX3N0YXJ0K3RoaXMuX2NvbmZpZy5jaHVua1NpemUtMTtyLnNldFJlcXVlc3RIZWFkZXIoXCJSYW5nZVwiLFwiYnl0ZXM9XCIrdGhpcy5fc3RhcnQrXCItXCIraSl9dHJ5e3Iuc2VuZCh0aGlzLl9jb25maWcuZG93bmxvYWRSZXF1ZXN0Qm9keSl9Y2F0Y2goZSl7dGhpcy5fY2h1bmtFcnJvcihlLm1lc3NhZ2UpfW4mJjA9PT1yLnN0YXR1cyYmdGhpcy5fY2h1bmtFcnJvcigpfX0sdGhpcy5fY2h1bmtMb2FkZWQ9ZnVuY3Rpb24oKXs0PT09ci5yZWFkeVN0YXRlJiYoci5zdGF0dXM8MjAwfHw0MDA8PXIuc3RhdHVzP3RoaXMuX2NodW5rRXJyb3IoKToodGhpcy5fc3RhcnQrPXRoaXMuX2NvbmZpZy5jaHVua1NpemU/dGhpcy5fY29uZmlnLmNodW5rU2l6ZTpyLnJlc3BvbnNlVGV4dC5sZW5ndGgsdGhpcy5fZmluaXNoZWQ9IXRoaXMuX2NvbmZpZy5jaHVua1NpemV8fHRoaXMuX3N0YXJ0Pj1mdW5jdGlvbihlKXt2YXIgdD1lLmdldFJlc3BvbnNlSGVhZGVyKFwiQ29udGVudC1SYW5nZVwiKTtpZihudWxsPT09dClyZXR1cm4tMTtyZXR1cm4gcGFyc2VJbnQodC5zdWJzdHJpbmcodC5sYXN0SW5kZXhPZihcIi9cIikrMSkpfShyKSx0aGlzLnBhcnNlQ2h1bmsoci5yZXNwb25zZVRleHQpKSl9LHRoaXMuX2NodW5rRXJyb3I9ZnVuY3Rpb24oZSl7dmFyIHQ9ci5zdGF0dXNUZXh0fHxlO3RoaXMuX3NlbmRFcnJvcihuZXcgRXJyb3IodCkpfX1mdW5jdGlvbiBjKGUpe3ZhciByLG47KGU9ZXx8e30pLmNodW5rU2l6ZXx8KGUuY2h1bmtTaXplPWIuTG9jYWxDaHVua1NpemUpLHUuY2FsbCh0aGlzLGUpO3ZhciBzPVwidW5kZWZpbmVkXCIhPXR5cGVvZiBGaWxlUmVhZGVyO3RoaXMuc3RyZWFtPWZ1bmN0aW9uKGUpe3RoaXMuX2lucHV0PWUsbj1lLnNsaWNlfHxlLndlYmtpdFNsaWNlfHxlLm1velNsaWNlLHM/KChyPW5ldyBGaWxlUmVhZGVyKS5vbmxvYWQ9dih0aGlzLl9jaHVua0xvYWRlZCx0aGlzKSxyLm9uZXJyb3I9dih0aGlzLl9jaHVua0Vycm9yLHRoaXMpKTpyPW5ldyBGaWxlUmVhZGVyU3luYyx0aGlzLl9uZXh0Q2h1bmsoKX0sdGhpcy5fbmV4dENodW5rPWZ1bmN0aW9uKCl7dGhpcy5fZmluaXNoZWR8fHRoaXMuX2NvbmZpZy5wcmV2aWV3JiYhKHRoaXMuX3Jvd0NvdW50PHRoaXMuX2NvbmZpZy5wcmV2aWV3KXx8dGhpcy5fcmVhZENodW5rKCl9LHRoaXMuX3JlYWRDaHVuaz1mdW5jdGlvbigpe3ZhciBlPXRoaXMuX2lucHV0O2lmKHRoaXMuX2NvbmZpZy5jaHVua1NpemUpe3ZhciB0PU1hdGgubWluKHRoaXMuX3N0YXJ0K3RoaXMuX2NvbmZpZy5jaHVua1NpemUsdGhpcy5faW5wdXQuc2l6ZSk7ZT1uLmNhbGwoZSx0aGlzLl9zdGFydCx0KX12YXIgaT1yLnJlYWRBc1RleHQoZSx0aGlzLl9jb25maWcuZW5jb2RpbmcpO3N8fHRoaXMuX2NodW5rTG9hZGVkKHt0YXJnZXQ6e3Jlc3VsdDppfX0pfSx0aGlzLl9jaHVua0xvYWRlZD1mdW5jdGlvbihlKXt0aGlzLl9zdGFydCs9dGhpcy5fY29uZmlnLmNodW5rU2l6ZSx0aGlzLl9maW5pc2hlZD0hdGhpcy5fY29uZmlnLmNodW5rU2l6ZXx8dGhpcy5fc3RhcnQ+PXRoaXMuX2lucHV0LnNpemUsdGhpcy5wYXJzZUNodW5rKGUudGFyZ2V0LnJlc3VsdCl9LHRoaXMuX2NodW5rRXJyb3I9ZnVuY3Rpb24oKXt0aGlzLl9zZW5kRXJyb3Ioci5lcnJvcil9fWZ1bmN0aW9uIHAoZSl7dmFyIGk7dS5jYWxsKHRoaXMsZT1lfHx7fSksdGhpcy5zdHJlYW09ZnVuY3Rpb24oZSl7cmV0dXJuIGk9ZSx0aGlzLl9uZXh0Q2h1bmsoKX0sdGhpcy5fbmV4dENodW5rPWZ1bmN0aW9uKCl7aWYoIXRoaXMuX2ZpbmlzaGVkKXt2YXIgZSx0PXRoaXMuX2NvbmZpZy5jaHVua1NpemU7cmV0dXJuIHQ/KGU9aS5zdWJzdHJpbmcoMCx0KSxpPWkuc3Vic3RyaW5nKHQpKTooZT1pLGk9XCJcIiksdGhpcy5fZmluaXNoZWQ9IWksdGhpcy5wYXJzZUNodW5rKGUpfX19ZnVuY3Rpb24gZyhlKXt1LmNhbGwodGhpcyxlPWV8fHt9KTt2YXIgdD1bXSxpPSEwLHI9ITE7dGhpcy5wYXVzZT1mdW5jdGlvbigpe3UucHJvdG90eXBlLnBhdXNlLmFwcGx5KHRoaXMsYXJndW1lbnRzKSx0aGlzLl9pbnB1dC5wYXVzZSgpfSx0aGlzLnJlc3VtZT1mdW5jdGlvbigpe3UucHJvdG90eXBlLnJlc3VtZS5hcHBseSh0aGlzLGFyZ3VtZW50cyksdGhpcy5faW5wdXQucmVzdW1lKCl9LHRoaXMuc3RyZWFtPWZ1bmN0aW9uKGUpe3RoaXMuX2lucHV0PWUsdGhpcy5faW5wdXQub24oXCJkYXRhXCIsdGhpcy5fc3RyZWFtRGF0YSksdGhpcy5faW5wdXQub24oXCJlbmRcIix0aGlzLl9zdHJlYW1FbmQpLHRoaXMuX2lucHV0Lm9uKFwiZXJyb3JcIix0aGlzLl9zdHJlYW1FcnJvcil9LHRoaXMuX2NoZWNrSXNGaW5pc2hlZD1mdW5jdGlvbigpe3ImJjE9PT10Lmxlbmd0aCYmKHRoaXMuX2ZpbmlzaGVkPSEwKX0sdGhpcy5fbmV4dENodW5rPWZ1bmN0aW9uKCl7dGhpcy5fY2hlY2tJc0ZpbmlzaGVkKCksdC5sZW5ndGg/dGhpcy5wYXJzZUNodW5rKHQuc2hpZnQoKSk6aT0hMH0sdGhpcy5fc3RyZWFtRGF0YT12KGZ1bmN0aW9uKGUpe3RyeXt0LnB1c2goXCJzdHJpbmdcIj09dHlwZW9mIGU/ZTplLnRvU3RyaW5nKHRoaXMuX2NvbmZpZy5lbmNvZGluZykpLGkmJihpPSExLHRoaXMuX2NoZWNrSXNGaW5pc2hlZCgpLHRoaXMucGFyc2VDaHVuayh0LnNoaWZ0KCkpKX1jYXRjaChlKXt0aGlzLl9zdHJlYW1FcnJvcihlKX19LHRoaXMpLHRoaXMuX3N0cmVhbUVycm9yPXYoZnVuY3Rpb24oZSl7dGhpcy5fc3RyZWFtQ2xlYW5VcCgpLHRoaXMuX3NlbmRFcnJvcihlKX0sdGhpcyksdGhpcy5fc3RyZWFtRW5kPXYoZnVuY3Rpb24oKXt0aGlzLl9zdHJlYW1DbGVhblVwKCkscj0hMCx0aGlzLl9zdHJlYW1EYXRhKFwiXCIpfSx0aGlzKSx0aGlzLl9zdHJlYW1DbGVhblVwPXYoZnVuY3Rpb24oKXt0aGlzLl9pbnB1dC5yZW1vdmVMaXN0ZW5lcihcImRhdGFcIix0aGlzLl9zdHJlYW1EYXRhKSx0aGlzLl9pbnB1dC5yZW1vdmVMaXN0ZW5lcihcImVuZFwiLHRoaXMuX3N0cmVhbUVuZCksdGhpcy5faW5wdXQucmVtb3ZlTGlzdGVuZXIoXCJlcnJvclwiLHRoaXMuX3N0cmVhbUVycm9yKX0sdGhpcyl9ZnVuY3Rpb24gaShtKXt2YXIgYSxvLGgscj1NYXRoLnBvdygyLDUzKSxuPS1yLHM9L15cXHMqLT8oXFxkK1xcLj98XFwuXFxkK3xcXGQrXFwuXFxkKykoW2VFXVstK10/XFxkKyk/XFxzKiQvLHU9L14oXFxkezR9LVswMV1cXGQtWzAtM11cXGRUWzAtMl1cXGQ6WzAtNV1cXGQ6WzAtNV1cXGRcXC5cXGQrKFsrLV1bMC0yXVxcZDpbMC01XVxcZHxaKSl8KFxcZHs0fS1bMDFdXFxkLVswLTNdXFxkVFswLTJdXFxkOlswLTVdXFxkOlswLTVdXFxkKFsrLV1bMC0yXVxcZDpbMC01XVxcZHxaKSl8KFxcZHs0fS1bMDFdXFxkLVswLTNdXFxkVFswLTJdXFxkOlswLTVdXFxkKFsrLV1bMC0yXVxcZDpbMC01XVxcZHxaKSkkLyx0PXRoaXMsaT0wLGY9MCxkPSExLGU9ITEsbD1bXSxjPXtkYXRhOltdLGVycm9yczpbXSxtZXRhOnt9fTtpZihNKG0uc3RlcCkpe3ZhciBwPW0uc3RlcDttLnN0ZXA9ZnVuY3Rpb24oZSl7aWYoYz1lLF8oKSlnKCk7ZWxzZXtpZihnKCksMD09PWMuZGF0YS5sZW5ndGgpcmV0dXJuO2krPWUuZGF0YS5sZW5ndGgsbS5wcmV2aWV3JiZpPm0ucHJldmlldz9vLmFib3J0KCk6KGMuZGF0YT1jLmRhdGFbMF0scChjLHQpKX19fWZ1bmN0aW9uIHkoZSl7cmV0dXJuXCJncmVlZHlcIj09PW0uc2tpcEVtcHR5TGluZXM/XCJcIj09PWUuam9pbihcIlwiKS50cmltKCk6MT09PWUubGVuZ3RoJiYwPT09ZVswXS5sZW5ndGh9ZnVuY3Rpb24gZygpe3JldHVybiBjJiZoJiYoayhcIkRlbGltaXRlclwiLFwiVW5kZXRlY3RhYmxlRGVsaW1pdGVyXCIsXCJVbmFibGUgdG8gYXV0by1kZXRlY3QgZGVsaW1pdGluZyBjaGFyYWN0ZXI7IGRlZmF1bHRlZCB0byAnXCIrYi5EZWZhdWx0RGVsaW1pdGVyK1wiJ1wiKSxoPSExKSxtLnNraXBFbXB0eUxpbmVzJiYoYy5kYXRhPWMuZGF0YS5maWx0ZXIoZnVuY3Rpb24oZSl7cmV0dXJuIXkoZSl9KSksXygpJiZmdW5jdGlvbigpe2lmKCFjKXJldHVybjtmdW5jdGlvbiBlKGUsdCl7TShtLnRyYW5zZm9ybUhlYWRlcikmJihlPW0udHJhbnNmb3JtSGVhZGVyKGUsdCkpLGwucHVzaChlKX1pZihBcnJheS5pc0FycmF5KGMuZGF0YVswXSkpe2Zvcih2YXIgdD0wO18oKSYmdDxjLmRhdGEubGVuZ3RoO3QrKyljLmRhdGFbdF0uZm9yRWFjaChlKTtjLmRhdGEuc3BsaWNlKDAsMSl9ZWxzZSBjLmRhdGEuZm9yRWFjaChlKX0oKSxmdW5jdGlvbigpe2lmKCFjfHwhbS5oZWFkZXImJiFtLmR5bmFtaWNUeXBpbmcmJiFtLnRyYW5zZm9ybSlyZXR1cm4gYztmdW5jdGlvbiBlKGUsdCl7dmFyIGkscj1tLmhlYWRlcj97fTpbXTtmb3IoaT0wO2k8ZS5sZW5ndGg7aSsrKXt2YXIgbj1pLHM9ZVtpXTttLmhlYWRlciYmKG49aT49bC5sZW5ndGg/XCJfX3BhcnNlZF9leHRyYVwiOmxbaV0pLG0udHJhbnNmb3JtJiYocz1tLnRyYW5zZm9ybShzLG4pKSxzPXYobixzKSxcIl9fcGFyc2VkX2V4dHJhXCI9PT1uPyhyW25dPXJbbl18fFtdLHJbbl0ucHVzaChzKSk6cltuXT1zfXJldHVybiBtLmhlYWRlciYmKGk+bC5sZW5ndGg/ayhcIkZpZWxkTWlzbWF0Y2hcIixcIlRvb01hbnlGaWVsZHNcIixcIlRvbyBtYW55IGZpZWxkczogZXhwZWN0ZWQgXCIrbC5sZW5ndGgrXCIgZmllbGRzIGJ1dCBwYXJzZWQgXCIraSxmK3QpOmk8bC5sZW5ndGgmJmsoXCJGaWVsZE1pc21hdGNoXCIsXCJUb29GZXdGaWVsZHNcIixcIlRvbyBmZXcgZmllbGRzOiBleHBlY3RlZCBcIitsLmxlbmd0aCtcIiBmaWVsZHMgYnV0IHBhcnNlZCBcIitpLGYrdCkpLHJ9dmFyIHQ9MTshYy5kYXRhLmxlbmd0aHx8QXJyYXkuaXNBcnJheShjLmRhdGFbMF0pPyhjLmRhdGE9Yy5kYXRhLm1hcChlKSx0PWMuZGF0YS5sZW5ndGgpOmMuZGF0YT1lKGMuZGF0YSwwKTttLmhlYWRlciYmYy5tZXRhJiYoYy5tZXRhLmZpZWxkcz1sKTtyZXR1cm4gZis9dCxjfSgpfWZ1bmN0aW9uIF8oKXtyZXR1cm4gbS5oZWFkZXImJjA9PT1sLmxlbmd0aH1mdW5jdGlvbiB2KGUsdCl7cmV0dXJuIGk9ZSxtLmR5bmFtaWNUeXBpbmdGdW5jdGlvbiYmdm9pZCAwPT09bS5keW5hbWljVHlwaW5nW2ldJiYobS5keW5hbWljVHlwaW5nW2ldPW0uZHluYW1pY1R5cGluZ0Z1bmN0aW9uKGkpKSwhMD09PShtLmR5bmFtaWNUeXBpbmdbaV18fG0uZHluYW1pY1R5cGluZyk/XCJ0cnVlXCI9PT10fHxcIlRSVUVcIj09PXR8fFwiZmFsc2VcIiE9PXQmJlwiRkFMU0VcIiE9PXQmJihmdW5jdGlvbihlKXtpZihzLnRlc3QoZSkpe3ZhciB0PXBhcnNlRmxvYXQoZSk7aWYobjx0JiZ0PHIpcmV0dXJuITB9cmV0dXJuITF9KHQpP3BhcnNlRmxvYXQodCk6dS50ZXN0KHQpP25ldyBEYXRlKHQpOlwiXCI9PT10P251bGw6dCk6dDt2YXIgaX1mdW5jdGlvbiBrKGUsdCxpLHIpe3ZhciBuPXt0eXBlOmUsY29kZTp0LG1lc3NhZ2U6aX07dm9pZCAwIT09ciYmKG4ucm93PXIpLGMuZXJyb3JzLnB1c2gobil9dGhpcy5wYXJzZT1mdW5jdGlvbihlLHQsaSl7dmFyIHI9bS5xdW90ZUNoYXJ8fCdcIic7aWYobS5uZXdsaW5lfHwobS5uZXdsaW5lPWZ1bmN0aW9uKGUsdCl7ZT1lLnN1YnN0cmluZygwLDEwNDg1NzYpO3ZhciBpPW5ldyBSZWdFeHAoaih0KStcIihbXl0qPylcIitqKHQpLFwiZ21cIikscj0oZT1lLnJlcGxhY2UoaSxcIlwiKSkuc3BsaXQoXCJcXHJcIiksbj1lLnNwbGl0KFwiXFxuXCIpLHM9MTxuLmxlbmd0aCYmblswXS5sZW5ndGg8clswXS5sZW5ndGg7aWYoMT09PXIubGVuZ3RofHxzKXJldHVyblwiXFxuXCI7Zm9yKHZhciBhPTAsbz0wO288ci5sZW5ndGg7bysrKVwiXFxuXCI9PT1yW29dWzBdJiZhKys7cmV0dXJuIGE+PXIubGVuZ3RoLzI/XCJcXHJcXG5cIjpcIlxcclwifShlLHIpKSxoPSExLG0uZGVsaW1pdGVyKU0obS5kZWxpbWl0ZXIpJiYobS5kZWxpbWl0ZXI9bS5kZWxpbWl0ZXIoZSksYy5tZXRhLmRlbGltaXRlcj1tLmRlbGltaXRlcik7ZWxzZXt2YXIgbj1mdW5jdGlvbihlLHQsaSxyLG4pe3ZhciBzLGEsbyxoO249bnx8W1wiLFwiLFwiXFx0XCIsXCJ8XCIsXCI7XCIsYi5SRUNPUkRfU0VQLGIuVU5JVF9TRVBdO2Zvcih2YXIgdT0wO3U8bi5sZW5ndGg7dSsrKXt2YXIgZj1uW3VdLGQ9MCxsPTAsYz0wO289dm9pZCAwO2Zvcih2YXIgcD1uZXcgRSh7Y29tbWVudHM6cixkZWxpbWl0ZXI6ZixuZXdsaW5lOnQscHJldmlldzoxMH0pLnBhcnNlKGUpLGc9MDtnPHAuZGF0YS5sZW5ndGg7ZysrKWlmKGkmJnkocC5kYXRhW2ddKSljKys7ZWxzZXt2YXIgXz1wLmRhdGFbZ10ubGVuZ3RoO2wrPV8sdm9pZCAwIT09bz8wPF8mJihkKz1NYXRoLmFicyhfLW8pLG89Xyk6bz1ffTA8cC5kYXRhLmxlbmd0aCYmKGwvPXAuZGF0YS5sZW5ndGgtYyksKHZvaWQgMD09PWF8fGQ8PWEpJiYodm9pZCAwPT09aHx8aDxsKSYmMS45OTxsJiYoYT1kLHM9ZixoPWwpfXJldHVybntzdWNjZXNzZnVsOiEhKG0uZGVsaW1pdGVyPXMpLGJlc3REZWxpbWl0ZXI6c319KGUsbS5uZXdsaW5lLG0uc2tpcEVtcHR5TGluZXMsbS5jb21tZW50cyxtLmRlbGltaXRlcnNUb0d1ZXNzKTtuLnN1Y2Nlc3NmdWw/bS5kZWxpbWl0ZXI9bi5iZXN0RGVsaW1pdGVyOihoPSEwLG0uZGVsaW1pdGVyPWIuRGVmYXVsdERlbGltaXRlciksYy5tZXRhLmRlbGltaXRlcj1tLmRlbGltaXRlcn12YXIgcz13KG0pO3JldHVybiBtLnByZXZpZXcmJm0uaGVhZGVyJiZzLnByZXZpZXcrKyxhPWUsbz1uZXcgRShzKSxjPW8ucGFyc2UoYSx0LGkpLGcoKSxkP3ttZXRhOntwYXVzZWQ6ITB9fTpjfHx7bWV0YTp7cGF1c2VkOiExfX19LHRoaXMucGF1c2VkPWZ1bmN0aW9uKCl7cmV0dXJuIGR9LHRoaXMucGF1c2U9ZnVuY3Rpb24oKXtkPSEwLG8uYWJvcnQoKSxhPU0obS5jaHVuayk/XCJcIjphLnN1YnN0cmluZyhvLmdldENoYXJJbmRleCgpKX0sdGhpcy5yZXN1bWU9ZnVuY3Rpb24oKXt0LnN0cmVhbWVyLl9oYWx0ZWQ/KGQ9ITEsdC5zdHJlYW1lci5wYXJzZUNodW5rKGEsITApKTpzZXRUaW1lb3V0KHQucmVzdW1lLDMpfSx0aGlzLmFib3J0ZWQ9ZnVuY3Rpb24oKXtyZXR1cm4gZX0sdGhpcy5hYm9ydD1mdW5jdGlvbigpe2U9ITAsby5hYm9ydCgpLGMubWV0YS5hYm9ydGVkPSEwLE0obS5jb21wbGV0ZSkmJm0uY29tcGxldGUoYyksYT1cIlwifX1mdW5jdGlvbiBqKGUpe3JldHVybiBlLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLFwiXFxcXCQmXCIpfWZ1bmN0aW9uIEUoZSl7dmFyIFMsTz0oZT1lfHx7fSkuZGVsaW1pdGVyLHg9ZS5uZXdsaW5lLEk9ZS5jb21tZW50cyxUPWUuc3RlcCxEPWUucHJldmlldyxBPWUuZmFzdE1vZGUsTD1TPXZvaWQgMD09PWUucXVvdGVDaGFyfHxudWxsPT09ZS5xdW90ZUNoYXI/J1wiJzplLnF1b3RlQ2hhcjtpZih2b2lkIDAhPT1lLmVzY2FwZUNoYXImJihMPWUuZXNjYXBlQ2hhciksKFwic3RyaW5nXCIhPXR5cGVvZiBPfHwtMTxiLkJBRF9ERUxJTUlURVJTLmluZGV4T2YoTykpJiYoTz1cIixcIiksST09PU8pdGhyb3cgbmV3IEVycm9yKFwiQ29tbWVudCBjaGFyYWN0ZXIgc2FtZSBhcyBkZWxpbWl0ZXJcIik7ITA9PT1JP0k9XCIjXCI6KFwic3RyaW5nXCIhPXR5cGVvZiBJfHwtMTxiLkJBRF9ERUxJTUlURVJTLmluZGV4T2YoSSkpJiYoST0hMSksXCJcXG5cIiE9PXgmJlwiXFxyXCIhPT14JiZcIlxcclxcblwiIT09eCYmKHg9XCJcXG5cIik7dmFyIEY9MCx6PSExO3RoaXMucGFyc2U9ZnVuY3Rpb24ocix0LGkpe2lmKFwic3RyaW5nXCIhPXR5cGVvZiByKXRocm93IG5ldyBFcnJvcihcIklucHV0IG11c3QgYmUgYSBzdHJpbmdcIik7dmFyIG49ci5sZW5ndGgsZT1PLmxlbmd0aCxzPXgubGVuZ3RoLGE9SS5sZW5ndGgsbz1NKFQpLGg9W10sdT1bXSxmPVtdLGQ9Rj0wO2lmKCFyKXJldHVybiBDKCk7aWYoQXx8ITEhPT1BJiYtMT09PXIuaW5kZXhPZihTKSl7Zm9yKHZhciBsPXIuc3BsaXQoeCksYz0wO2M8bC5sZW5ndGg7YysrKXtpZihmPWxbY10sRis9Zi5sZW5ndGgsYyE9PWwubGVuZ3RoLTEpRis9eC5sZW5ndGg7ZWxzZSBpZihpKXJldHVybiBDKCk7aWYoIUl8fGYuc3Vic3RyaW5nKDAsYSkhPT1JKXtpZihvKXtpZihoPVtdLGsoZi5zcGxpdChPKSksUigpLHopcmV0dXJuIEMoKX1lbHNlIGsoZi5zcGxpdChPKSk7aWYoRCYmRDw9YylyZXR1cm4gaD1oLnNsaWNlKDAsRCksQyghMCl9fXJldHVybiBDKCl9Zm9yKHZhciBwPXIuaW5kZXhPZihPLEYpLGc9ci5pbmRleE9mKHgsRiksXz1uZXcgUmVnRXhwKGooTCkraihTKSxcImdcIiksbT1yLmluZGV4T2YoUyxGKTs7KWlmKHJbRl0hPT1TKWlmKEkmJjA9PT1mLmxlbmd0aCYmci5zdWJzdHJpbmcoRixGK2EpPT09SSl7aWYoLTE9PT1nKXJldHVybiBDKCk7Rj1nK3MsZz1yLmluZGV4T2YoeCxGKSxwPXIuaW5kZXhPZihPLEYpfWVsc2UgaWYoLTEhPT1wJiYocDxnfHwtMT09PWcpKWYucHVzaChyLnN1YnN0cmluZyhGLHApKSxGPXArZSxwPXIuaW5kZXhPZihPLEYpO2Vsc2V7aWYoLTE9PT1nKWJyZWFrO2lmKGYucHVzaChyLnN1YnN0cmluZyhGLGcpKSx3KGcrcyksbyYmKFIoKSx6KSlyZXR1cm4gQygpO2lmKEQmJmgubGVuZ3RoPj1EKXJldHVybiBDKCEwKX1lbHNlIGZvcihtPUYsRisrOzspe2lmKC0xPT09KG09ci5pbmRleE9mKFMsbSsxKSkpcmV0dXJuIGl8fHUucHVzaCh7dHlwZTpcIlF1b3Rlc1wiLGNvZGU6XCJNaXNzaW5nUXVvdGVzXCIsbWVzc2FnZTpcIlF1b3RlZCBmaWVsZCB1bnRlcm1pbmF0ZWRcIixyb3c6aC5sZW5ndGgsaW5kZXg6Rn0pLEUoKTtpZihtPT09bi0xKXJldHVybiBFKHIuc3Vic3RyaW5nKEYsbSkucmVwbGFjZShfLFMpKTtpZihTIT09THx8clttKzFdIT09TCl7aWYoUz09PUx8fDA9PT1tfHxyW20tMV0hPT1MKXstMSE9PXAmJnA8bSsxJiYocD1yLmluZGV4T2YoTyxtKzEpKSwtMSE9PWcmJmc8bSsxJiYoZz1yLmluZGV4T2YoeCxtKzEpKTt2YXIgeT1iKC0xPT09Zz9wOk1hdGgubWluKHAsZykpO2lmKHIuc3Vic3RyKG0rMSt5LGUpPT09Tyl7Zi5wdXNoKHIuc3Vic3RyaW5nKEYsbSkucmVwbGFjZShfLFMpKSxyW0Y9bSsxK3krZV0hPT1TJiYobT1yLmluZGV4T2YoUyxGKSkscD1yLmluZGV4T2YoTyxGKSxnPXIuaW5kZXhPZih4LEYpO2JyZWFrfXZhciB2PWIoZyk7aWYoci5zdWJzdHJpbmcobSsxK3YsbSsxK3Yrcyk9PT14KXtpZihmLnB1c2goci5zdWJzdHJpbmcoRixtKS5yZXBsYWNlKF8sUykpLHcobSsxK3YrcykscD1yLmluZGV4T2YoTyxGKSxtPXIuaW5kZXhPZihTLEYpLG8mJihSKCkseikpcmV0dXJuIEMoKTtpZihEJiZoLmxlbmd0aD49RClyZXR1cm4gQyghMCk7YnJlYWt9dS5wdXNoKHt0eXBlOlwiUXVvdGVzXCIsY29kZTpcIkludmFsaWRRdW90ZXNcIixtZXNzYWdlOlwiVHJhaWxpbmcgcXVvdGUgb24gcXVvdGVkIGZpZWxkIGlzIG1hbGZvcm1lZFwiLHJvdzpoLmxlbmd0aCxpbmRleDpGfSksbSsrfX1lbHNlIG0rK31yZXR1cm4gRSgpO2Z1bmN0aW9uIGsoZSl7aC5wdXNoKGUpLGQ9Rn1mdW5jdGlvbiBiKGUpe3ZhciB0PTA7aWYoLTEhPT1lKXt2YXIgaT1yLnN1YnN0cmluZyhtKzEsZSk7aSYmXCJcIj09PWkudHJpbSgpJiYodD1pLmxlbmd0aCl9cmV0dXJuIHR9ZnVuY3Rpb24gRShlKXtyZXR1cm4gaXx8KHZvaWQgMD09PWUmJihlPXIuc3Vic3RyaW5nKEYpKSxmLnB1c2goZSksRj1uLGsoZiksbyYmUigpKSxDKCl9ZnVuY3Rpb24gdyhlKXtGPWUsayhmKSxmPVtdLGc9ci5pbmRleE9mKHgsRil9ZnVuY3Rpb24gQyhlKXtyZXR1cm57ZGF0YTpoLGVycm9yczp1LG1ldGE6e2RlbGltaXRlcjpPLGxpbmVicmVhazp4LGFib3J0ZWQ6eix0cnVuY2F0ZWQ6ISFlLGN1cnNvcjpkKyh0fHwwKX19fWZ1bmN0aW9uIFIoKXtUKEMoKSksaD1bXSx1PVtdfX0sdGhpcy5hYm9ydD1mdW5jdGlvbigpe3o9ITB9LHRoaXMuZ2V0Q2hhckluZGV4PWZ1bmN0aW9uKCl7cmV0dXJuIEZ9fWZ1bmN0aW9uIF8oZSl7dmFyIHQ9ZS5kYXRhLGk9YVt0LndvcmtlcklkXSxyPSExO2lmKHQuZXJyb3IpaS51c2VyRXJyb3IodC5lcnJvcix0LmZpbGUpO2Vsc2UgaWYodC5yZXN1bHRzJiZ0LnJlc3VsdHMuZGF0YSl7dmFyIG49e2Fib3J0OmZ1bmN0aW9uKCl7cj0hMCxtKHQud29ya2VySWQse2RhdGE6W10sZXJyb3JzOltdLG1ldGE6e2Fib3J0ZWQ6ITB9fSl9LHBhdXNlOnkscmVzdW1lOnl9O2lmKE0oaS51c2VyU3RlcCkpe2Zvcih2YXIgcz0wO3M8dC5yZXN1bHRzLmRhdGEubGVuZ3RoJiYoaS51c2VyU3RlcCh7ZGF0YTp0LnJlc3VsdHMuZGF0YVtzXSxlcnJvcnM6dC5yZXN1bHRzLmVycm9ycyxtZXRhOnQucmVzdWx0cy5tZXRhfSxuKSwhcik7cysrKTtkZWxldGUgdC5yZXN1bHRzfWVsc2UgTShpLnVzZXJDaHVuaykmJihpLnVzZXJDaHVuayh0LnJlc3VsdHMsbix0LmZpbGUpLGRlbGV0ZSB0LnJlc3VsdHMpfXQuZmluaXNoZWQmJiFyJiZtKHQud29ya2VySWQsdC5yZXN1bHRzKX1mdW5jdGlvbiBtKGUsdCl7dmFyIGk9YVtlXTtNKGkudXNlckNvbXBsZXRlKSYmaS51c2VyQ29tcGxldGUodCksaS50ZXJtaW5hdGUoKSxkZWxldGUgYVtlXX1mdW5jdGlvbiB5KCl7dGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkLlwiKX1mdW5jdGlvbiB3KGUpe2lmKFwib2JqZWN0XCIhPXR5cGVvZiBlfHxudWxsPT09ZSlyZXR1cm4gZTt2YXIgdD1BcnJheS5pc0FycmF5KGUpP1tdOnt9O2Zvcih2YXIgaSBpbiBlKXRbaV09dyhlW2ldKTtyZXR1cm4gdH1mdW5jdGlvbiB2KGUsdCl7cmV0dXJuIGZ1bmN0aW9uKCl7ZS5hcHBseSh0LGFyZ3VtZW50cyl9fWZ1bmN0aW9uIE0oZSl7cmV0dXJuXCJmdW5jdGlvblwiPT10eXBlb2YgZX1yZXR1cm4gbyYmKGYub25tZXNzYWdlPWZ1bmN0aW9uKGUpe3ZhciB0PWUuZGF0YTt2b2lkIDA9PT1iLldPUktFUl9JRCYmdCYmKGIuV09SS0VSX0lEPXQud29ya2VySWQpO2lmKFwic3RyaW5nXCI9PXR5cGVvZiB0LmlucHV0KWYucG9zdE1lc3NhZ2Uoe3dvcmtlcklkOmIuV09SS0VSX0lELHJlc3VsdHM6Yi5wYXJzZSh0LmlucHV0LHQuY29uZmlnKSxmaW5pc2hlZDohMH0pO2Vsc2UgaWYoZi5GaWxlJiZ0LmlucHV0IGluc3RhbmNlb2YgRmlsZXx8dC5pbnB1dCBpbnN0YW5jZW9mIE9iamVjdCl7dmFyIGk9Yi5wYXJzZSh0LmlucHV0LHQuY29uZmlnKTtpJiZmLnBvc3RNZXNzYWdlKHt3b3JrZXJJZDpiLldPUktFUl9JRCxyZXN1bHRzOmksZmluaXNoZWQ6ITB9KX19KSwobC5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZSh1LnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yPWwsKGMucHJvdG90eXBlPU9iamVjdC5jcmVhdGUodS5wcm90b3R5cGUpKS5jb25zdHJ1Y3Rvcj1jLChwLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKHAucHJvdG90eXBlKSkuY29uc3RydWN0b3I9cCwoZy5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZSh1LnByb3RvdHlwZSkpLmNvbnN0cnVjdG9yPWcsYn0pOyIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJ2YXIgbmV4dFRpY2sgPSByZXF1aXJlKCdwcm9jZXNzL2Jyb3dzZXIuanMnKS5uZXh0VGljaztcbnZhciBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseTtcbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBpbW1lZGlhdGVJZHMgPSB7fTtcbnZhciBuZXh0SW1tZWRpYXRlSWQgPSAwO1xuXG4vLyBET00gQVBJcywgZm9yIGNvbXBsZXRlbmVzc1xuXG5leHBvcnRzLnNldFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0VGltZW91dCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhclRpbWVvdXQpO1xufTtcbmV4cG9ydHMuc2V0SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0SW50ZXJ2YWwsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG59O1xuZXhwb3J0cy5jbGVhclRpbWVvdXQgPVxuZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkgeyB0aW1lb3V0LmNsb3NlKCk7IH07XG5cbmZ1bmN0aW9uIFRpbWVvdXQoaWQsIGNsZWFyRm4pIHtcbiAgdGhpcy5faWQgPSBpZDtcbiAgdGhpcy5fY2xlYXJGbiA9IGNsZWFyRm47XG59XG5UaW1lb3V0LnByb3RvdHlwZS51bnJlZiA9IFRpbWVvdXQucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge307XG5UaW1lb3V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9jbGVhckZuLmNhbGwod2luZG93LCB0aGlzLl9pZCk7XG59O1xuXG4vLyBEb2VzIG5vdCBzdGFydCB0aGUgdGltZSwganVzdCBzZXRzIHVwIHRoZSBtZW1iZXJzIG5lZWRlZC5cbmV4cG9ydHMuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSwgbXNlY3MpIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IG1zZWNzO1xufTtcblxuZXhwb3J0cy51bmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IC0xO1xufTtcblxuZXhwb3J0cy5fdW5yZWZBY3RpdmUgPSBleHBvcnRzLmFjdGl2ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXG4gIHZhciBtc2VjcyA9IGl0ZW0uX2lkbGVUaW1lb3V0O1xuICBpZiAobXNlY3MgPj0gMCkge1xuICAgIGl0ZW0uX2lkbGVUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIG9uVGltZW91dCgpIHtcbiAgICAgIGlmIChpdGVtLl9vblRpbWVvdXQpXG4gICAgICAgIGl0ZW0uX29uVGltZW91dCgpO1xuICAgIH0sIG1zZWNzKTtcbiAgfVxufTtcblxuLy8gVGhhdCdzIG5vdCBob3cgbm9kZS5qcyBpbXBsZW1lbnRzIGl0IGJ1dCB0aGUgZXhwb3NlZCBhcGkgaXMgdGhlIHNhbWUuXG5leHBvcnRzLnNldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHNldEltbWVkaWF0ZSA6IGZ1bmN0aW9uKGZuKSB7XG4gIHZhciBpZCA9IG5leHRJbW1lZGlhdGVJZCsrO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGggPCAyID8gZmFsc2UgOiBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgaW1tZWRpYXRlSWRzW2lkXSA9IHRydWU7XG5cbiAgbmV4dFRpY2soZnVuY3Rpb24gb25OZXh0VGljaygpIHtcbiAgICBpZiAoaW1tZWRpYXRlSWRzW2lkXSkge1xuICAgICAgLy8gZm4uY2FsbCgpIGlzIGZhc3RlciBzbyB3ZSBvcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiB1c2UtY2FzZVxuICAgICAgLy8gQHNlZSBodHRwOi8vanNwZXJmLmNvbS9jYWxsLWFwcGx5LXNlZ3VcbiAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm4uY2FsbChudWxsKTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZlbnQgaWRzIGZyb20gbGVha2luZ1xuICAgICAgZXhwb3J0cy5jbGVhckltbWVkaWF0ZShpZCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gaWQ7XG59O1xuXG5leHBvcnRzLmNsZWFySW1tZWRpYXRlID0gdHlwZW9mIGNsZWFySW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBjbGVhckltbWVkaWF0ZSA6IGZ1bmN0aW9uKGlkKSB7XG4gIGRlbGV0ZSBpbW1lZGlhdGVJZHNbaWRdO1xufTsiLCIvKlxuQGxpY3N0YXJ0ICBUaGUgZm9sbG93aW5nIGlzIHRoZSBlbnRpcmUgbGljZW5zZSBub3RpY2UgZm9yIHRoZSBKYXZhU2NyaXB0IGNvZGUgaW4gdGhpcyBwYWdlLlxuXG4gICAgQ29weXJpZ2h0IChjKSAyMDE5LCBKaW0gQWxsbWFuXG5cbiAgICBBbGwgcmlnaHRzIHJlc2VydmVkLlxuXG4gICAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gICAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgICBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXNcbiAgICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cblxuICAgIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAgICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uXG4gICAgYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG5cbiAgICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICAgIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEVcbiAgICBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkVcbiAgICBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFXG4gICAgRk9SIEFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUxcbiAgICBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUlxuICAgIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSXG4gICAgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSxcbiAgICBPUiBUT1JUIChJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRVxuICAgIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG5cbkBsaWNlbmQgIFRoZSBhYm92ZSBpcyB0aGUgZW50aXJlIGxpY2Vuc2Ugbm90aWNlIGZvciB0aGUgSmF2YVNjcmlwdCBjb2RlIGluIHRoaXMgcGFnZS5cbiovXG5cbi8qXG4gKiBDbGllbnQtc2lkZSBiZWhhdmlvciBmb3IgdGhlIE9wZW4gVHJlZSBuYW1lLXJlc29sdXRpb24gVUlcbiAqXG4gKiBUaGlzIHVzZXMgdGhlIE9wZW4gVHJlZSBBUEkgdG8gcmVzb2x2ZSBsYXJnZSBzZXRzIG9mIGxhYmVscyB0byB0YXhvbm9taWMgbmFtZXMuXG4gKi9cbnZhciBKU1ppcCA9IHJlcXVpcmUoJ2pzemlwJyksXG4gICAgRmlsZVNhdmVyID0gcmVxdWlyZSgnZmlsZS1zYXZlcicpLFxuICAgIEJsb2IgPSByZXF1aXJlKCdibG9iLXBvbHlmaWxsJyksXG4gICAgUGFwYSA9IHJlcXVpcmUoJ3BhcGFwYXJzZScpLFxuICAgIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xuXG4vKiBUaGVzZSB2YXJpYWJsZXMgc2hvdWxkIGFscmVhZHkgYmUgZGVmaW5lZCBpbiB0aGUgbWFpbiBIVE1MIHBhZ2UuIFdlIHNob3VsZFxuICogTk9UIGRlY2xhcmUgdGhlbSBoZXJlLCBvciB0aGlzIHdpbGwgaGlkZSB0aGVpciBcImdsb2JhbFwiIHZhbHVlcy5cbnZhciBpbml0aWFsU3RhdGU7XG52YXIgZG9UTlJTRm9yQXV0b2NvbXBsZXRlX3VybDtcbnZhciBkb1ROUlNGb3JNYXBwaW5nT1RVc191cmw7XG52YXIgZ2V0Q29udGV4dEZvck5hbWVzX3VybDtcbnZhciByZW5kZXJfbWFya2Rvd25fdXJsO1xuKi9cblxuLy8gc29tZXRpbWVzIHdlIHVzZSB0aGlzIHNjcmlwdCBpbiBvdGhlciBwYWdlczsgbGV0J3MgY2hlY2shXG52YXIgY29udGV4dDtcbmlmICh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZihcIi9jdXJhdG9yL3RucnNcIikgPT09IDApIHtcbiAgICBjb250ZXh0ID0gJ0JVTEtfVE5SUyc7XG59IGVsc2UgaWYgKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKFwiL2N1cmF0b3Ivc3R1ZHkvZWRpdC9cIikgPT09IDApIHtcbiAgICBjb250ZXh0ID0gJ1NUVURZX09UVV9NQVBQSU5HJztcbn0gZWxzZSBpZiAod2luZG93LmxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoXCIvY3VyYXRvci9zdHVkeS92aWV3L1wiKSA9PT0gMCkge1xuICAgIGNvbnRleHQgPSAnU1RVRFlfUkVBRF9PTkxZJztcbn0gZWxzZSB7XG4gICAgY29udGV4dCA9ICc/Pz8nO1xuICAgIGNvbnNvbGUuZXJyb3IoXCJVbmtub3duIGNvbnRleHQgZm9yIFROUlMhIHNob3VsZCBiZSBvbmUgb2YgQlVMS19UTlJTIHwgU1RVRFlfUkVBRF9PTkxZIHwgU1RVRFlfT1RVX01BUFBJTkdcIik7XG59XG5cbi8qIFJldHVybiB0aGUgZGF0YSBtb2RlbCBmb3IgYSBuZXcgbmFtZXNldCAob3VyIEpTT04gcmVwcmVzZW50YXRpb24pICovXG52YXIgZ2V0TmV3TmFtZXNldE1vZGVsID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgIHZhciBvYmogPSB7XG4gICAgICAgICdtZXRhZGF0YSc6IHtcbiAgICAgICAgICAgICduYW1lJzogXCJVbnRpdGxlZCBuYW1lc2V0XCIsXG4gICAgICAgICAgICAnZGVzY3JpcHRpb24nOiBcIlwiLFxuICAgICAgICAgICAgJ2F1dGhvcnMnOiBbIF0sICAgLy8gYXNzaWduIGltbWVkaWF0ZWx5IHRvIHRoaXMgdXNlcj9cbiAgICAgICAgICAgICdkYXRlX2NyZWF0ZWQnOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAnbGFzdF9zYXZlZCc6IG51bGwsXG4gICAgICAgICAgICAnc2F2ZV9jb3VudCc6IDAsICAvLyB1c2UgdG8gc3VnZ2VzdCB1bmlxdWUgKG51bWJlcmVkKSBmaWxlbmFtZXNcbiAgICAgICAgICAgICdwcmV2aW91c19maWxlbmFtZSc6IG51bGwsICAvLyB3aGF0IGZpbGUgd2UgbG9hZGVkIGJlZm9yZSBkb2luZyB0aGlzIHdvcmtcbiAgICAgICAgICAgICdsYXRlc3Rfb3R0X3ZlcnNpb24nOiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIFwibWFwcGluZ0hpbnRzXCI6IHsgICAgICAgLy8gT1IgbmFtZU1hcHBpbmdIaW50cz9cbiAgICAgICAgICAgIFwiZGVzY3JpcHRpb25cIjogXCJBaWRzIGZvciBtYXBwaW5nIGxpc3RlZCBuYW1lcyB0byBPVFQgdGF4YVwiLFxuICAgICAgICAgICAgXCJzZWFyY2hDb250ZXh0XCI6IFwiQWxsIGxpZmVcIixcbiAgICAgICAgICAgIFwidXNlRnV6enlNYXRjaGluZ1wiOiBmYWxzZSxcbiAgICAgICAgICAgIFwiYXV0b0FjY2VwdEV4YWN0TWF0Y2hlc1wiOiBmYWxzZSxcbiAgICAgICAgICAgIFwic3Vic3RpdHV0aW9uc1wiOiBbXG4gICAgICAgICAgICAgICAgLyogdHlwaWNhbCB2YWx1ZXMgaW4gdXNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBcImFjdGl2ZVwiOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgXCJvbGRcIjogXCIuKiAoW0EtWl1bYS16XSsgW2Etei5dKyBbQS1aIDAtOV0rKSRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJuZXdcIjogXCIkMVwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbGlkXCI6IHRydWVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgLyogc3RhcnQgd2l0aCBvbmUgZW1wdHkvbmV3IHN1YnN0aXR1dGlvbiAqL1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgXCJhY3RpdmVcIjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgXCJvbGRcIjogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJuZXdcIjogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ2YWxpZFwiOiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgJ25hbWVzJzogW1xuICAgICAgICAgICAgLy8gZWFjaCBzaG91bGQgaW5jbHVkZSBhIHVuaXF1ZSBpZCwgb3JpZ2luYWwgbmFtZSwgbWFudWFsbHkgZWRpdGVkL2FkanVzdGVkIG5hbWUsIGFuZCBhbnkgbWFwcGVkIG5hbWUvdGF4b25cbiAgICAgICAgICAgIC8qIGhlcmUncyBhIHR5cGljYWwgZXhhbXBsZSwgd2l0aCBhbiBhcmJpdHJhcnkvc2VyaWFsIElEXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIm5hbWUyM1wiLFxuICAgICAgICAgICAgICAgIFwib3JpZ2luYWxMYWJlbFwiOiBcIkJhY3RlcmlhIFByb3Rlb2JhY3RlcmlhIEdhbW1hcHJvdGVvYmFjdGVyaWEgT2NlYW5vc3BpcmlsbGFsZXMgU2FjY2hhcm9zcGlyaWxsYWNlYWUgU2FjY2hhcm9zcGlyaWxsdW0gaW1wYXRpZW5zIERTTSAxMjU0NlwiLFxuICAgICAgICAgICAgICAgIFwiYWRqdXN0ZWRMYWJlbFwiOiBcIlByb2VvYmFjdGVyaWFcIiwgIC8vIFdBUyAnXm90OmFsdExhYmVsJ1xuICAgICAgICAgICAgICAgIFwib3R0VGF4b25OYW1lXCI6IFwiU2FjY2hhcm9zcGlyaWxsdW0gaW1wYXRpZW5zIERTTSAxMjU0NlwiLFxuICAgICAgICAgICAgICAgIFwib3R0SWRcIjogMTMyNzUxLFxuICAgICAgICAgICAgICAgIFwidGF4b25vbWljU291cmNlc1wiOiBbXCJzaWx2YTpBMTYzNzkvIzFcIiwgXCJuY2JpOjJcIiwgXCJ3b3Jtczo2XCIsIFwiZ2JpZjozXCIsIFwiaXJtbmc6MTNcIl1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICovXG4gICAgICAgIF1cbiAgICB9O1xuICAgIC8qIFRPRE86IEFwcGx5IG9wdGlvbmFsIG1vZGlmaWNhdGlvbnM/XG4gICAgaWYgKG9wdGlvbnMuQkxBSCkge1xuICAgICAgICBvYmoubWV0YWRhdGEuRk9PID0gJ0JBUic7XG4gICAgfVxuICAgICovXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbnZhciBwYXBhUGFyc2VDb25maWcgPSB7XG4gICAgLyogVHJ5IHRvIGFjY29tb2RhdGUgZGlmZmVyZW50IGRlbGltaXRlcnMsIGxpbmUgZW5kaW5ncywgZXRjLlxuICAgICAqIEZvciBhbGwgc2V0dGluZ3MgYW5kIGRlZmF1bHQgdmFsdWVzLCBzZWUgPGh0dHBzOi8vd3d3LnBhcGFwYXJzZS5jb20vZG9jcyNjb25maWc+XG4gICAgICovXG4gICAgZGVsaW1pdGVyOiBcIlwiLFx0Ly8gYXV0by1kZXRlY3RcbiAgICBkZWxpbWl0ZXJzVG9HdWVzczogWycsICcsICcsJywgJ1xcdCcsICd8JywgJzsnLCBQYXBhLlJFQ09SRF9TRVAsIFBhcGEuVU5JVF9TRVBdLFxuICAgIG5ld2xpbmU6IFwiXCIsXHQvLyBhdXRvLWRldGVjdFxuICAgIGVzY2FwZUNoYXI6IFwiXFxcXFwiLFxuICAgIHNraXBFbXB0eUxpbmVzOiAnZ3JlZWR5JywgIC8vIHNraXAgZW1wdHkgQU5EIHdoaXRlc3BhY2Utb25seSBsaW5lc1xuICAgIC8vY29tcGxldGU6IGZuICAvLyBjYWxsYmFjayBmdW5jdGlvbiB0byByZWNlaXZlIHBhcnNlIHJlc3VsdHNcbiAgICAvL2Vycm9yOiBmbiAgICAgLy8gY2FsbGJhY2sgaWYgYW4gZXJyb3Igd2FzIGVuY291bnRlcmVkXG4gICAgaGVhZGVyOiBmYWxzZSAgIC8vIGRldGVjdCBvcHRpb25hbCBoZWFkZXIgcm93IGFuZCByZW1vdmUgYWZ0ZXIgcGFyc2luZz9cbn1cbmZ1bmN0aW9uIGNvbnZlcnRUb05hbWVzZXRNb2RlbCggbGlzdFRleHQgKSB7XG4gICAgLyogVGVzdCBmb3IgcHJvcGVyIGRlbGltaXRlZCB0ZXh0IChUU1Ygb3IgQ1NWLCB3aXRoIGEgcGFpciBvZiBuYW1lcyBvbiBlYWNoIGxpbmUpLlxuICAgICAqIFRoZSBmaXJzdCB2YWx1ZSBvbiBlYWNoIGxpbmUgaXMgYSB2ZXJuYWN1bGFyIGxhYmVsLCB0aGUgc2Vjb25kIGl0cyBtYXBwZWQgdGF4b24gbmFtZS5cbiAgICAgKi9cbiAgICB2YXIgbmFtZXNldCA9IGdldE5ld05hbWVzZXRNb2RlbCgpOyAgLy8gd2UnbGwgYWRkIG5hbWUgcGFpcnMgdG8gdGhpc1xuICAgIC8vIGF0dGVtcHQgdG8gcGFyc2UgdGhlIGRlbGltaXRlZCB0ZXh0IHByb3ZpZGVkXG4gICAgdmFyIHBhcnNlUmVzdWx0cyA9IFBhcGEucGFyc2UobGlzdFRleHQsIHBhcGFQYXJzZUNvbmZpZyk7XG4gICAgdmFyIHBhcnNlRXJyb3JNZXNzYWdlID0gXCJcIjtcbiAgICBpZiAocGFyc2VSZXN1bHRzLm1ldGEuYWJvcnRlZCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRGVsaW1pdGVkIHRleHQgcGFyc2luZyBBQk9SVEVEIVwiKTtcbiAgICAgICAgcGFyc2VFcnJvck1lc3NhZ2UgKz0gXCJEZWxpbWl0ZWQgdGV4dCBwYXJzaW5nIEFCT1JURUQhXFxuXFxuXCI7XG4gICAgfVxuICAgIC8vIHN0aWxsIGhlcmU/IHRoZW4gd2UgYXQgbGVhc3QgaGF2ZSBzb21lIG5hbWVzIChvciBoZWFkZXJzKSB0byByZXR1cm5cbiAgICAkLmVhY2gocGFyc2VSZXN1bHRzLmVycm9ycywgZnVuY3Rpb24oaSwgcGFyc2VFcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiICBQYXJzaW5nIGVycm9yIG9uIGxpbmUgXCIrIHBhcnNlRXJyb3Iucm93ICtcIjogXCIrIHBhcnNlRXJyb3IuY29kZSArXCIgKFwiKyBwYXJzZUVycm9yLm1lc3NhZ2UgK1wiKVwiKTtcbiAgICAgICAgcGFyc2VFcnJvck1lc3NhZ2UgKz0gXCIgIFBhcnNpbmcgZXJyb3Igb24gbGluZSBcIisgcGFyc2VFcnJvci5yb3cgK1wiOiBcIisgcGFyc2VFcnJvci5jb2RlICtcIiAoXCIrIHBhcnNlRXJyb3IubWVzc2FnZSArXCIpXFxuXCI7XG4gICAgfSk7XG4gICAgaWYgKHBhcnNlUmVzdWx0cy5tZXRhLmFib3J0ZWQpIHtcbiAgICAgICAgc2hvd0Vycm9yTWVzc2FnZShwYXJzZUVycm9yTWVzc2FnZSk7XG4gICAgICAgIHJldHVybiBuYW1lc2V0OyAgLy8gcHJvYmFibHkgc3RpbGwgZW1wdHlcbiAgICB9XG5cbiAgICAvLyBub3cgYXBwbHkgbGFiZWxzIGFuZCBrZWVwIGNvdW50IG9mIGFueSBkdXBsaWNhdGUgbGFiZWxzXG4gICAgdmFyIGZvdW5kTGFiZWxzID0gWyBdO1xuICAgIHZhciBkdXBlTGFiZWxzRm91bmQgPSAwO1xuICAgIHZhciByb3dzID0gcGFyc2VSZXN1bHRzLmRhdGE7ICAvLyBhbiBhcnJheSBvZiBwYXJzZWQgcm93cyAoZWFjaCBhbiBhcnJheSBvZiB2YWx1ZXMpXG4gICAgY29uc29sZS53YXJuKCByb3dzLmxlbmd0aCArXCIgbGluZXMgZm91bmQgd2l0aCBsaW5lIGRlbGltaXRlciAnXCIrIHBhcnNlUmVzdWx0cy5tZXRhLmxpbmVicmVhayArXCInXCIpO1xuXG4gICAgdmFyIGxvY2FsTmFtZU51bWJlciA9IDA7ICAvLyB0aGVzZSBhcmUgbm90IGltcG9ydGVkLCBzbyBsb2NhbCBpbnRlZ2VycyBhcmUgZmluZFxuICAgICQuZWFjaChyb3dzLCBmdW5jdGlvbihpLCBpdGVtcykge1xuICAgICAgICAvLyBmaWx0ZXIgb3V0IGVtcHR5IGl0ZW1zIChlZywgbGFiZWxzIGFuZCB0YXhhKSBvbiB0aGlzIHJvd1xuICAgICAgICBpdGVtcyA9ICQuZ3JlcChpdGVtcywgZnVuY3Rpb24oaXRlbSwgaSkge1xuICAgICAgICAgICAgcmV0dXJuICQudHJpbShpdGVtKSAhPT0gXCJcIjtcbiAgICAgICAgfSk7XG4gICAgICAgIHN3aXRjaCAoaXRlbXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7ICAvLyBza2lwIHRvIG5leHQgbGluZVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyB3ZSBhc3N1bWUgdGhlIHNhbWUgZmllbGRzIGFzIGluIG91ciBuYW1lc2V0IG91dHB1dCBmaWxlc1xuICAgICAgICAgICAgICAgIHZhciBsYWJlbCA9ICQudHJpbShpdGVtc1swXSk7ICAgLy8gaXRzIG9yaWdpbmFsLCB2ZXJuYWN1bGFyIGxhYmVsXG4gICAgICAgICAgICAgICAgaWYgKGxhYmVsID09PSAnT1JJR0lOQUwgTEFCRUwnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNraXAgdGhlIGhlYWRlciByb3csIGlmIGZvdW5kXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBza2lwIHRoaXMgbGFiZWwgaWYgaXQncyBhIGR1cGxpY2F0ZVxuICAgICAgICAgICAgICAgIGlmIChmb3VuZExhYmVscy5pbmRleE9mKGxhYmVsKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYWRkIHRoaXMgdG8gbGFiZWxzIGZvdW5kICh0ZXN0IGxhdGVyIG5hbWVzIGFnYWluc3QgdGhpcylcbiAgICAgICAgICAgICAgICAgICAgZm91bmRMYWJlbHMucHVzaChsYWJlbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBhIGR1cGUgb2YgYW4gZWFybGllciBuYW1lIVxuICAgICAgICAgICAgICAgICAgICBkdXBlTGFiZWxzRm91bmQrKztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjYW5vbmljYWxUYXhvbk5hbWUgPSAkLnRyaW0oaXRlbXNbMV0pOyAgLy8gaXRzIG1hcHBlZCB0YXhvbiBuYW1lXG4gICAgICAgICAgICAgICAgLy8gaW5jbHVkZSBvdHRpZCBhbmQgYW55IHRheG9ub21pYyBzb3VyY2VzLCBpZiBwcm92aWRlZFxuICAgICAgICAgICAgICAgIHZhciB0YXhvbklEID0gKGl0ZW1zLmxlbmd0aCA+IDIpID8gaXRlbXNbMl0gOiBudWxsO1xuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VzID0gKGl0ZW1zLmxlbmd0aCA+IDMpID8gaXRlbXNbM10uc3BsaXQoJzsnKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgLy8gYWRkIHRoaXMgaW5mb3JtYXRpb24gaW4gdGhlIGV4cGVjdGVkIG5hbWVzZXQgZm9ybVxuICAgICAgICAgICAgICAgIHZhciBuYW1lSW5mbyA9IHtcbiAgICAgICAgICAgICAgICAgICAgXCJpZFwiOiAoXCJuYW1lXCIrIGxvY2FsTmFtZU51bWJlcisrKSxcbiAgICAgICAgICAgICAgICAgICAgXCJvcmlnaW5hbExhYmVsXCI6IGxhYmVsLFxuICAgICAgICAgICAgICAgICAgICBcIm90dFRheG9uTmFtZVwiOiBjYW5vbmljYWxUYXhvbk5hbWUsXG4gICAgICAgICAgICAgICAgICAgIFwic2VsZWN0ZWRGb3JBY3Rpb25cIjogZmFsc2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmICh0YXhvbklEKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWVJbmZvW1wib3R0SWRcIl0gPSB0YXhvbklEO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlcykge1xuICAgICAgICAgICAgICAgICAgICBuYW1lSW5mb1tcInRheG9ub21pY1NvdXJjZXNcIl0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHNvdXJjZXMsIGZ1bmN0aW9uKGksIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlID0gJC50cmltKHNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlKSB7ICAvLyBpdCdzIG5vdCBhbiBlbXB0eSBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lSW5mb1tcInRheG9ub21pY1NvdXJjZXNcIl0ucHVzaCggc291cmNlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuYW1lc2V0Lm5hbWVzLnB1c2goIG5hbWVJbmZvICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH0pO1xuICAgIG51ZGdlVGlja2xlcignVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7XG4gICAgdmFyIG5hbWVzQWRkZWQgPSBuYW1lc2V0Lm5hbWVzLmxlbmd0aDtcbiAgICB2YXIgbXNnO1xuICAgIGlmIChkdXBlTGFiZWxzRm91bmQgPT09IDApIHtcbiAgICAgICAgbXNnID0gXCJBZGRpbmcgXCIrIG5hbWVzQWRkZWQgK1wiIG5hbWVzIGZvdW5kIGluIHRoaXMgZmlsZS4uLlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG1zZyA9IFwiQWRkaW5nIFwiKyBuYW1lc0FkZGVkICtcIiBuYW1lXCIrXG4gICAgICAgICAgICAobmFtZXNBZGRlZCA9PT0gMT8gXCJcIiA6IFwic1wiKSArXCIgZm91bmQgaW4gdGhpcyBmaWxlIChcIitcbiAgICAgICAgICAgIGR1cGVMYWJlbHNGb3VuZCArXCIgZHVwbGljYXRlIGxhYmVsXCIrIChkdXBlTGFiZWxzRm91bmQgPT09IDE/IFwiXCIgOiBcInNcIilcbiAgICAgICAgICAgICtcIiByZW1vdmVkKS4uLlwiO1xuICAgIH1cbiAgICAvLyB3aGVyZSBkbyB3ZSBzaG93IHRoZXNlIG1lc3NhZ2VzP1xuICAgIHNob3dJbmZvTWVzc2FnZShtc2cpO1xuICAgIHJldHVybiBuYW1lc2V0O1xufVxuXG4vKiBMb2FkIGFuZCBzYXZlICh0by9mcm9tIFpJUCBmaWxlIG9uIHRoZSB1c2VyJ3MgZmlsZXN5c3RlbSkgKi9cblxuLy8gcHJvcG9zZSBhbiBhcHByb3ByaWF0ZSBmaWxlbmFtZSBiYXNlZCBvbiBpdHMgaW50ZXJuYWwgbmFtZVxuZnVuY3Rpb24gZ2V0RGVmYXVsdEFyY2hpdmVGaWxlbmFtZSggY2FuZGlkYXRlRmlsZU5hbWUgKSB7XG4gICAgLy8gdHJ5IHRvIHVzZSBhIGNhbmRpZGF0ZSBuYW1lLCBpZiBwcm92aWRlZFxuICAgIHZhciBzdWdnZXN0ZWRGaWxlTmFtZSA9ICQudHJpbShjYW5kaWRhdGVGaWxlTmFtZSkgfHxcbiAgICAgICAgdmlld01vZGVsLm1ldGFkYXRhLm5hbWUoKSB8fFxuICAgICAgICBcIlVOVElUTEVEX05BTUVTRVRcIjtcbiAgICAvLyBzdHJpcCBleHRlbnNpb24gKGlmIGZvdW5kKSBhbmQgaW5jcmVtZW50IGFzIG5lZWRlZFxuICAgIGlmIChzdWdnZXN0ZWRGaWxlTmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKCcuemlwJykpIHtcbiAgICAgICAgc3VnZ2VzdGVkRmlsZU5hbWUgPSBzdWdnZXN0ZWRGaWxlTmFtZS5zdWJzdHIoMCwgc3VnZ2VzdGVkRmlsZU5hbWUubGVuZ3RoKCkgLSA0KTtcbiAgICB9XG4gICAgLy8gYWRkIGluY3JlbWVudGluZyBjb3VudGVyIGZyb20gdmlld01vZGVsLCBwbHVzIGZpbGUgZXh0ZW5zaW9uXG4gICAgaWYgKHZpZXdNb2RlbC5tZXRhZGF0YS5zYXZlX2NvdW50KCkgPiAwKSB7XG4gICAgICAgIHN1Z2dlc3RlZEZpbGVOYW1lICs9IFwiLVwiKyB2aWV3TW9kZWwubWV0YWRhdGEuc2F2ZV9jb3VudCgpO1xuICAgIH1cbiAgICBzdWdnZXN0ZWRGaWxlTmFtZSArPSAnLnppcCc7XG4gICAgcmV0dXJuIHN1Z2dlc3RlZEZpbGVOYW1lO1xufVxuXG5mdW5jdGlvbiBzYXZlQ3VycmVudE5hbWVzZXQoIG9wdGlvbnMgKSB7XG4gICAgLy8gc2F2ZSBhIFpJUCBhcmNoaXZlIChvciBqdXN0IGBtYWluLmpzb25gKSB0byB0aGUgZmlsZXN5c3RlbVxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHtGVUxMX0FSQ0hJVkU6IHRydWV9O1xuXG4gICAgLypcbiAgICAgKiBVcGRhdGUgbmV3LXNhdmUgaW5mbyAodGltZXN0YW1wIGFuZCBjb3VudGVyKSBpbiB0aGUgSlNPTiBkb2N1bWVudCBCRUZPUkVcbiAgICAgKiBzYXZpbmcgaXQ7IGlmIHRoZSBvcGVyYXRpb24gZmFpbHMsIHdlJ2xsIHJldmVydCB0aGVzZSBwcm9wZXJ0aWVzIGluIHRoZVxuICAgICAqIGFjdGl2ZSBkb2N1bWVudC5cbiAgICAgKi9cbiAgICB2YXIgcHJldmlvdXNTYXZlVGltZXN0YW1wID0gdmlld01vZGVsLm1ldGFkYXRhLmxhc3Rfc2F2ZWQoKTtcbiAgICB2YXIgcmlnaHROb3cgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgdmlld01vZGVsLm1ldGFkYXRhLmxhc3Rfc2F2ZWQoIHJpZ2h0Tm93ICk7XG4gICAgdmFyIHByZXZpb3VzU2F2ZUNvdW50ID0gdmlld01vZGVsLm1ldGFkYXRhLnNhdmVfY291bnQoKTtcbiAgICB2aWV3TW9kZWwubWV0YWRhdGEuc2F2ZV9jb3VudCggKytwcmV2aW91c1NhdmVDb3VudCApO1xuICAgIC8vIFRPRE86IFNldCAodGVudGF0aXZlL3VzZXItc3VnZ2VzdGVkKSBmaWxlbmFtZSBpbiB0aGUgbGl2ZSB2aWV3TW9kZWw/XG5cbiAgICAvLyBUT0RPOiBhZGQgdGhpcyB1c2VyIHRvIHRoZSBhdXRob3JzIGxpc3QsIGlmIG5vdCBmb3VuZD9cbiAgICAvLyAoZW1haWwgYW5kL29yIHVzZXJpZCwgc28gd2UgY2FuIGxpbmsgdG8gYXV0aG9ycylcbiAgICAvKlxuICAgIHZhciB1c2VyRGlzcGxheU5hbWUgPSAnPz8/JztcbiAgICB2YXIgbGlzdFBvcyA9ICQuaW5BcnJheSggdXNlckRpc3BsYXlOYW1lLCB2aWV3TW9kZWwubWV0YWRhdGEuYXV0aG9ycygpICk7XG4gICAgaWYgKGxpc3RQb3MgPT09IC0xKSB7XG4gICAgICAgIHZpZXdNb2RlbC5tZXRhZGF0YS5hdXRob3JzLnB1c2goIHVzZXJEaXNwbGF5TmFtZSApO1xuICAgIH1cbiAgICAqL1xuXG4gICAgLy8gVE9ETzogYWRkIGEgXCJzY3J1YmJlclwiIGFzIHdlIGRvIGZvciBPcGVuVHJlZSBzdHVkaWVzPyBcbiAgICAvLyBzY3J1Yk5hbWVzZXRGb3JUcmFuc3BvcnQoc3R5bGlzdC5pbGwpO1xuXG4gICAgLy8gZmxhdHRlbiB0aGUgY3VycmVudCBuYW1lc2V0IHRvIHNpbXBsZSBKUyB1c2luZyBvdXIgXG4gICAgLy8gS25vY2tvdXQgbWFwcGluZyBvcHRpb25zXG4gICAgdmFyIGNsb25hYmxlTmFtZXNldCA9IGtvLm1hcHBpbmcudG9KUyh2aWV3TW9kZWwpO1xuXG4gICAgLy8gVE9ETzogY2xlYXIgYW55IGV4aXN0aW5nIFVSTD8gb3Iga2VlcCBsYXN0LWtub3duIGdvb2Qgb25lP1xuICAgIC8vY2xvbmFibGVOYW1lc2V0Lm1ldGFkYXRhLnVybCA9ICcnO1xuXG4gICAgLy8gY3JlYXRlIGEgWmlwIGFyY2hpdmUsIGFkZCB0aGUgY29yZSBkb2N1bWVudFxuICAgIHZhciBhcmNoaXZlID0gbmV3IEpTWmlwKCk7XG4gICAgYXJjaGl2ZS5maWxlKFwibWFpbi5qc29uXCIsIEpTT04uc3RyaW5naWZ5KGNsb25hYmxlTmFtZXNldCkpO1xuXG4gICAgLy8gVE9ETzogVGVzdCBhbGwgaW5wdXQgZm9yIHJlcGVhdGFibGUgcHJvdmVuYW5jZSBpbmZvOyBpZiBhbnkgYXJlIGxhY2tpbmcgYVxuICAgIC8vIGNsZWFyIHNvdXJjZSwgd2Ugc2hvdWxkIGVtYmVkIHRoZSBzb3VyY2UgZGF0YSBoZXJlLlxuICAgIC8qXG4gICAgdmFyIHN0YXRpY0lucHV0cyA9IFRyZWVJbGx1c3RyYXRvci5nYXRoZXJTdGF0aWNJbnB1dERhdGEoKTtcbiAgICBpZiAob3B0aW9ucy5GVUxMX0FSQ0hJVkUgfHwgKHN0YXRpY0lucHV0cy5sZW5ndGggPiAwKSkge1xuICAgICAgICAvLyBhZGQgc29tZSBvciBhbGwgaW5wdXQgZGF0YSBmb3IgdGhpcyBpbGx1c3RyYXRpb25cbiAgICAgICAgLy92YXIgaW5wdXRGb2xkZXIgPSBhcmNoaXZlLmZvbGRlcignaW5wdXQnKTtcbiAgICAgICAgdmFyIGlucHV0c1RvU3RvcmUgPSBvcHRpb25zLkZVTExfQVJDSElWRSA/IFRyZWVJbGx1c3RyYXRvci5nYXRoZXJBbGxJbnB1dERhdGEoKSA6IHN0YXRpY0lucHV0cztcbiAgICAgICAgJC5lYWNoKGlucHV0c1RvU3RvcmUsIGZ1bmN0aW9uKGksIGlucHV0RGF0YSkge1xuICAgICAgICAgICAgdmFyIGl0c1BhdGggPSBpbnB1dERhdGEucGF0aDtcbiAgICAgICAgICAgIHZhciBzZXJpYWxpemVkID0gdXRpbHMuc2VyaWFsaXplRGF0YUZvclNhdmVkRmlsZSggaW5wdXREYXRhLnZhbHVlICk7XG4gICAgICAgICAgICBhcmNoaXZlLmZpbGUoaXRzUGF0aCwgc2VyaWFsaXplZC52YWx1ZSwgc2VyaWFsaXplZC5vcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgICovXG5cbiAgICAvLyBhZGQgYW55IG91dHB1dCBkb2NzIChTVkcsIFBERilcbiAgICB2YXIgb3V0cHV0Rm9sZGVyID0gYXJjaGl2ZS5mb2xkZXIoJ291dHB1dCcpO1xuICAgIC8qIFNlZSBodHRwczovL3N0dWsuZ2l0aHViLmlvL2pzemlwL2RvY3VtZW50YXRpb24vYXBpX2pzemlwL2ZpbGVfZGF0YS5odG1sXG4gICAgICogZm9yIG90aGVyIFpJUCBvcHRpb25zIGxpa2UgY29wbXJlc3Npb24gc2V0dGluZ3MuXG4gICAgICovXG4gICAgb3V0cHV0Rm9sZGVyLmZpbGUoJ21haW4udHN2JywgZ2VuZXJhdGVUYWJTZXBhcmF0ZWRPdXRwdXQoJ0FMTF9OQU1FUycpLCB7Y29tbWVudDogXCJUYWItZGVsaW1pdGVkIHRleHQsIGluY2x1ZGluZyB1bm1hcHBlZCBuYW1lcy5cIn0pO1xuICAgIG91dHB1dEZvbGRlci5maWxlKCdtYWluLmNzdicsIGdlbmVyYXRlQ29tbWFTZXBhcmF0ZWRPdXRwdXQoJ0FMTF9OQU1FUycpLCB7Y29tbWVudDogXCJDb21tYS1kZWxpbWl0ZWQgdGV4dCwgaW5jbHVkaW5nIHVubWFwcGVkIG5hbWVzLlwifSk7XG5cbiAgICAvKiBOT1RFIHRoYXQgd2UgaGF2ZSBubyBjb250cm9sIG92ZXIgd2hlcmUgdGhlIGJyb3dzZXIgd2lsbCBzYXZlIGFcbiAgICAgKiBkb3dubG9hZGVkIGZpbGUsIGFuZCB3ZSBoYXZlIG5vIGRpcmVjdCBrbm93bGVkZ2Ugb2YgdGhlIGZpbGVzeXN0ZW0hXG4gICAgICogRnVydGhlcm1vcmUsIG1vc3QgYnJvd3NlcnMgd29uJ3Qgb3ZlcndyaXRlIGFuIGV4aXN0aW5nIGZpbGUgd2l0aCB0aGlzXG4gICAgICogcGF0aCtuYW1lLCBhbmQgd2lsbCBpbnN0ZWFkIGluY3JlbWVudCB0aGUgbmV3IGZpbGUsIGUuZy5cbiAgICAgKiAnYmVlLXRyZWVzLWNvbXBhcmVkLnppcCcgYmVjb21lcyAnfi9Eb3dubG9hZHMvYmVlLXRyZWVzLWNvbXBhcmVkICgyKS56aXAnLlxuICAgICAqL1xuICAgIHZhciAkZmlsZW5hbWVGaWVsZCA9ICQoJ2lucHV0I3N1Z2dlc3RlZC1hcmNoaXZlLWZpbGVuYW1lJyk7XG4gICAgdmFyIHN1Z2dlc3RlZEZpbGVOYW1lID0gJC50cmltKCRmaWxlbmFtZUZpZWxkLnZhbCgpKTtcbiAgICBpZiAoc3VnZ2VzdGVkRmlsZU5hbWUgPT09IFwiXCIpIHtcbiAgICAgICAgc3VnZ2VzdGVkRmlsZU5hbWUgPSBnZXREZWZhdWx0QXJjaGl2ZUZpbGVuYW1lKHN1Z2dlc3RlZEZpbGVOYW1lKTtcbiAgICB9XG4gICAgLy8gYWRkIG1pc3NpbmcgZXh0ZW5zaW9uLCBpZiBpdCdzIG1pc3NpbmdcbiAgICBpZiAoIShzdWdnZXN0ZWRGaWxlTmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKCcuemlwJykpKSB7XG4gICAgICAgIHN1Z2dlc3RlZEZpbGVOYW1lICs9ICcuemlwJztcbiAgICB9XG5cbiAgICBhcmNoaXZlLmdlbmVyYXRlQXN5bmMoIHt0eXBlOlwiYmxvYlwifSwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiB1cGRhdGVDYWxsYmFjayhtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFNob3cgcHJvZ3Jlc3MgYXMgZGVtb25zdHJhdGVkIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9zdHVrLmdpdGh1Yi5pby9qc3ppcC9kb2N1bWVudGF0aW9uL2V4YW1wbGVzL2Rvd25sb2FkZXIuaHRtbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBtZXRhZGF0YS5wZXJjZW50LnRvRml4ZWQoMikgKyBcIiAlIGNvbXBsZXRlXCIgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gKVxuICAgICAgICAgICAudGhlbiggZnVuY3Rpb24gKGJsb2IpIHsgICBcbiAgICAgICAgICAgICAgICAgICAgICAvLyBzdWNjZXNzIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgRmlsZVNhdmVyLnNhdmVBcyhibG9iLCBzdWdnZXN0ZWRGaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycikgeyAgICBcbiAgICAgICAgICAgICAgICAgICAgICAvLyBmYWlsdXJlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgYXN5bmNBbGVydCgnRVJST1IgZ2VuZXJhdGluZyB0aGlzIFpJUCBhcmNoaXZlOjxici8+PGJyLz4nKyBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgIC8vIHJldmVydCB0byBwcmV2aW91cyBsYXN0LXNhdmUgaW5mbyBpbiB0aGUgYWN0aXZlIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgICAgICAgdmlld01vZGVsLm1ldGFkYXRhLmxhc3Rfc2F2ZWQoIHByZXZpb3VzU2F2ZVRpbWVzdGFtcCApO1xuICAgICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlbC5tZXRhZGF0YS5zYXZlX2NvdW50KCBwcmV2aW91c1NhdmVDb3VudCApO1xuICAgICAgICAgICAgICAgICAgfSApO1xuXG4gICAgJCgnI25hbWVzZXQtbG9jYWwtZmlsZXN5c3RlbS13YXJuaW5nJykuc2xpZGVEb3duKCk7IC8vIFRPRE9cblxuICAgIHNob3dJbmZvTWVzc2FnZSgnTmFtZXNldCBzYXZlZCB0byBsb2NhbCBmaWxlLicpO1xuXG4gICAgcG9wUGFnZUV4aXRXYXJuaW5nKCdVTlNBVkVEX05BTUVTRVRfQ0hBTkdFUycpO1xuICAgIG5hbWVzZXRIYXNVbnNhdmVkQ2hhbmdlcyA9IGZhbHNlO1xuICAgIGRpc2FibGVTYXZlQnV0dG9uKCk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlVGFiU2VwYXJhdGVkT3V0cHV0KCkge1xuICAgIHJldHVybiBnZW5lcmF0ZURlbGltaXRlZFRleHRPdXRwdXQoJ0FMTF9OQU1FUycsICdcXHQnLCAnOycpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVDb21tYVNlcGFyYXRlZE91dHB1dCgpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVEZWxpbWl0ZWRUZXh0T3V0cHV0KCdBTExfTkFNRVMnLCAnLCcsICc7Jyk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZURlbGltaXRlZFRleHRPdXRwdXQobWFwcGVkT3JBbGxOYW1lcywgZGVsaW1pdGVyLCBtaW5vckRlbGltaXRlcikge1xuICAgIC8vIHJlbmRlciB0aGUgY3VycmVudCBuYW1lc2V0IChtYXBwZWQgbmFtZXMsIG9yIGFsbCkgYXMgYSBkZWxpbWl0ZWQgKFRTViwgQ1NWKSBzdHJpbmdcbiAgICB2YXIgb3V0cHV0O1xuICAgIGlmICgkLmluQXJyYXkobWFwcGVkT3JBbGxOYW1lcywgWydNQVBQRURfTkFNRVMnLCAnQUxMX05BTUVTJ10pID09PSAtMSkge1xuICAgICAgICB2YXIgbXNnID0gXCIjIEVSUk9SOiBtYXBwZWRPckFsbE5hbWVzIHNob3VsZCBiZSAnTUFQUEVEX05BTUVTJyBvciAnQUxMX05BTUVTJywgbm90ICdcIisgbWFwcGVkT3JBbGxOYW1lcyArXCInIVwiXG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgICAgcmV0dXJuIG1zZztcbiAgICB9XG4gICAgaWYgKHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBvdXRwdXQgPSBcIiMgTm8gbmFtZXMgaW4gdGhpcyBuYW1lc2V0IHdlcmUgbWFwcGVkIHRvIHRoZSBPVCBUYXhvbm9teS5cIjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBvdXRwdXQgPSBcIk9SSUdJTkFMIExBQkVMXCIrIGRlbGltaXRlciArXCJPVFQgVEFYT04gTkFNRVwiKyBkZWxpbWl0ZXIgK1wiT1RUIFRBWE9OIElEXCIrIGRlbGltaXRlciArXCJUQVhPTk9NSUMgU09VUkNFU1xcblwiO1xuICAgICAgICAkLmVhY2godmlld01vZGVsLm5hbWVzKCksIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgICAgICAgIGlmICgobWFwcGVkT3JBbGxOYW1lcyA9PT0gJ01BUFBFRF9OQU1FUycpICYmICFuYW1lLm90dFRheG9uTmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAgLy8gc2tpcCB0aGlzIHVuLW1hcHBlZCBuYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBOLkIuIHVubWFwcGVkIG5hbWVzIHdvbid0IGhhdmUgbW9zdCBvZiB0aGVzZSBwcm9wZXJ0aWVzIVxuICAgICAgICAgICAgdmFyIGNvbWJpbmVkU291cmNlcyA9IChuYW1lLnRheG9ub21pY1NvdXJjZXMgfHwgWyBdKS5qb2luKG1pbm9yRGVsaW1pdGVyKTtcbiAgICAgICAgICAgIG91dHB1dCArPSAobmFtZS5vcmlnaW5hbExhYmVsICtkZWxpbWl0ZXIrXG4gICAgICAgICAgICAgICAgICAgICAgIChuYW1lLm90dFRheG9uTmFtZSB8fCAnJykgK2RlbGltaXRlcitcbiAgICAgICAgICAgICAgICAgICAgICAgKG5hbWUub3R0SWQgfHwgJycpICtkZWxpbWl0ZXIrXG4gICAgICAgICAgICAgICAgICAgICAgIGNvbWJpbmVkU291cmNlcyArXCJcXG5cIik7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xufVxuXG5mdW5jdGlvbiBsb2FkTGlzdEZyb21DaG9zZW5GaWxlKCB2bSwgZXZ0ICkge1xuICAgIC8vIEZpcnN0IHBhcmFtIChjb3JyZXNwb25kaW5nIHZpZXctbW9kZWwgZGF0YSkgaXMgcHJvYmFibHkgZW1wdHk7IGZvY3VzIG9uIHRoZSBldmVudCFcbiAgICB2YXIgJGhpbnRBcmVhID0gJCgnI2xpc3QtbG9jYWwtZmlsZXN5c3RlbS13YXJuaW5nJykuZXEoMCk7XG4gICAgJGhpbnRBcmVhLmh0bWwoXCJcIik7ICAvLyBjbGVhciBmb3IgbmV3IHJlc3VsdHNcbiAgICB2YXIgZXZlbnRUYXJnZXQgPSBldnQudGFyZ2V0IHx8IGV2dC5zcmNFbGVtZW50O1xuICAgIHN3aXRjaChldmVudFRhcmdldC5maWxlcy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAoMCk6XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIGZpbGUocykgc2VsZWN0ZWQhJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNhc2UgKDEpOlxuICAgICAgICBkZWZhdWx0OiAgLy8gaWdub3JlIG11bHRpcGxlIGZpbGVzIGZvciBub3csIGp1c3QgbG9hZCB0aGUgZmlyc3RcbiAgICAgICAgICAgIHZhciBmaWxlSW5mbyA9IGV2ZW50VGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmlsZUluZm8ubmFtZSA9IFwiKyBmaWxlSW5mby5uYW1lKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImZpbGVJbmZvLnR5cGUgPSBcIisgZmlsZUluZm8udHlwZSk7XG4gICAgICAgICAgICB2YXIgaXNWYWxpZExpc3QgPSBmYWxzZTtcbiAgICAgICAgICAgIHN3aXRjaCAoZmlsZUluZm8udHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQvcGxhaW4nOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQvdGFiLXNlcGFyYXRlZC12YWx1ZXMnOlxuICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkTGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJyc6XG4gICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrIGZpbGUgZXh0ZW5zaW9uXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlSW5mby5uYW1lLm1hdGNoKCcuKHR4dHx0c3YpJCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkTGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWlzVmFsaWRMaXN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiQSBsaXN0IG9mIG5hbWVzIHNob3VsZCBlbmQgaW4gPGNvZGU+LnR4dDwvY29kZT4gb3IgPGNvZGU+LnRzdjwvY29kZT4uIENob29zZSBhbm90aGVyIGZpbGU/XCI7XG4gICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU3RpbGwgaGVyZT8gdHJ5IHRvIGxvYWQgYW5kIHBhcnNlIHRoZSBsaXN0IChsaW5lLSBvciB0YWItZGVsaW1pdGVkIG5hbWVzKVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlYWRpbmcgbGlzdCBjb250ZW50cy4uLicpO1xuICAgICAgICAgICAgdmFyIG1zZyA9IFwiUmVhZGluZyBsaXN0IG9mIG5hbWVzLi4uXCI7XG4gICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcblxuICAgICAgICAgICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgIGZyLm9ubG9hZCA9IGZ1bmN0aW9uKCBldnQgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3RUZXh0ID0gZXZ0LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgLy8gdGVzdCBhIHZhcmlldHkgb2YgZGVsaW1pdGVycyB0byBmaW5kIG11bHRpcGxlIGl0ZW1zXG4gICAgICAgICAgICAgICAgdmFyIG5hbWVzID0gWyBdO1xuICAgICAgICAgICAgICAgIHZhciBtdWx0aXBsZU5hbWVzRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgZHVwZXNGb3VuZCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGRlbGltaXRlcnMgPSBbJ1xcbicsJ1xccicsJ1xcdCddO1xuICAgICAgICAgICAgICAgICQuZWFjaChkZWxpbWl0ZXJzLCBmdW5jdGlvbihpLCBkZWxpbSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW11bHRpcGxlTmFtZXNGb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXMgPSBsaXN0VGV4dC5zcGxpdChkZWxpbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaWx0ZXIgb3V0IGVtcHR5IG5hbWVzLCBlbXB0eSBsaW5lcywgZXRjLlxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXMgPSAkLmdyZXAobmFtZXMsIGZ1bmN0aW9uKG5hbWUsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJC50cmltKG5hbWUpICE9PSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKG5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiTm8gbmFtZXMgZm91bmQgd2l0aCBkZWxpbWl0ZXIgJ1wiKyBkZWxpbSArXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkp1c3Qgb25lIG5hbWUgZm91bmQgd2l0aCBkZWxpbWl0ZXIgJ1wiKyBkZWxpbSArXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsZU5hbWVzRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oIG5hbWVzLmxlbmd0aCArXCIgbmFtZXMgZm91bmQgd2l0aCBkZWxpbWl0ZXIgJ1wiKyBkZWxpbSArXCInXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiB1bnBhY2sgbmFtZXMsIGlnbm9yZSByZW1haW5pbmcgZGVsaW1pdGVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gobmFtZXMsIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFkZCBhIG5ldyBuYW1lIGVudHJ5IHRvIHRoZSBuYW1lc2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIi4uLmFkZGluZyBuYW1lICdcIisgbmFtZSArXCInLi4uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGVsLm5hbWVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiaWRcIjogKFwibmFtZVwiKyBnZXROZXh0TmFtZU9yZGluYWxOdW1iZXIoKSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvcmlnaW5hbExhYmVsXCI6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzZWxlY3RlZEZvckFjdGlvblwiOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogYWRkIHRoZXNlIG9ubHkgd2hlbiB0aGV5J3JlIHBvcHVsYXRlZCFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFkanVzdGVkTGFiZWxcIjogXCJcIiAgIC8vIFdBUyAnXm90OmFsdExhYmVsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib3R0VGF4b25OYW1lXCI6IFwiSG9tbyBzYXBpZW5zIHNhcGllbnNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm90dElkXCI6IDEzMjc1MVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidGF4b25vbWljU291cmNlc1wiOiBbIC4uLiBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN3ZWVwIGZvciBkdXBsaWNhdGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aXRoRHVwZXMgPSB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUR1cGxpY2F0ZU5hbWVzKHZpZXdNb2RlbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3aXRob3V0RHVwZXMgPSB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cGVzRm91bmQgPSB3aXRoRHVwZXMgLSB3aXRob3V0RHVwZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51ZGdlVGlja2xlcignVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIHN0aWxsIGhlcmU/IHRoZXJlIHdhcyBhIHByb2JsZW0sIHJlcG9ydCBpdCBhbmQgYmFpbFxuICAgICAgICAgICAgICAgIHZhciBtc2c7XG4gICAgICAgICAgICAgICAgaWYgKG11bHRpcGxlTmFtZXNGb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZHVwZXNGb3VuZCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnID0gXCJBZGRpbmcgXCIrIG5hbWVzLmxlbmd0aCArXCIgbmFtZXMgZm91bmQgaW4gdGhpcyBmaWxlLi4uXCI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZXNBZGRlZCA9IG5hbWVzLmxlbmd0aCAtIGR1cGVzRm91bmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cgPSBcIkFkZGluZyBcIisgbmFtZXNBZGRlZCArXCIgbmFtZVwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuYW1lc0FkZGVkID09PSAxPyBcIlwiIDogXCJzXCIpICtcIiBmb3VuZCBpbiB0aGlzIGZpbGUgKFwiK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cGVzRm91bmQgK1wiIGR1cGxpY2F0ZSBuYW1lXCIrIChkdXBlc0ZvdW5kID09PSAxPyBcIlwiIDogXCJzXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgK1wiIHJlbW92ZWQpLi4uXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtc2cgPSBcIk5vIG5hbWVzIChvciBqdXN0IG9uZSkgZm91bmQgaW4gdGhpcyBmaWxlISBUcnkgYWdhaW4/XCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRoaW50QXJlYS5odG1sKG1zZykuc2hvdygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvL2ZyLnJlYWRBc0RhdGFVUkwoZmlsZUluZm8pO1xuICAgICAgICAgICAgZnIucmVhZEFzVGV4dChmaWxlSW5mbyk7ICAvLyBkZWZhdWx0IGVuY29kaW5nIGlzIHV0Zi04XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkTmFtZXNldEZyb21DaG9zZW5GaWxlKCB2bSwgZXZ0ICkge1xuICAgIC8vIEZpcnN0IHBhcmFtIChjb3JyZXNwb25kaW5nIHZpZXctbW9kZWwgZGF0YSkgaXMgcHJvYmFibHkgZW1wdHk7IGZvY3VzIG9uIHRoZSBldmVudCFcbiAgICB2YXIgJGhpbnRBcmVhID0gJCgnI25hbWVzZXQtbG9jYWwtZmlsZXN5c3RlbS13YXJuaW5nJykuZXEoMCk7XG4gICAgJGhpbnRBcmVhLmh0bWwoXCJcIik7ICAvLyBjbGVhciBmb3IgbmV3IHJlc3VsdHNcbiAgICB2YXIgZXZlbnRUYXJnZXQgPSBldnQudGFyZ2V0IHx8IGV2dC5zcmNFbGVtZW50O1xuICAgIHN3aXRjaChldmVudFRhcmdldC5maWxlcy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAoMCk6XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJObyBmaWxlKHMpIHNlbGVjdGVkIVwiO1xuICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNhc2UgKDEpOlxuICAgICAgICBkZWZhdWx0OiAgLy8gaWdub3JlIG11bHRpcGxlIGZpbGVzIGZvciBub3csIGp1c3QgbG9hZCB0aGUgZmlyc3RcbiAgICAgICAgICAgIHZhciBmaWxlSW5mbyA9IGV2ZW50VGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmlsZUluZm8ubmFtZSA9IFwiKyBmaWxlSW5mby5uYW1lKTtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcImZpbGVJbmZvLnR5cGUgPSBcIisgZmlsZUluZm8udHlwZSk7XG4gICAgICAgICAgICB2YXIgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gZmFsc2U7XG4gICAgICAgICAgICB2YXIgaXNWYWxpZEFyY2hpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChjb250ZXh0ID09PSAnQlVMS19UTlJTJykge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZmlsZUluZm8udHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdhcHBsaWNhdGlvbi96aXAnOlxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzVmFsaWRBcmNoaXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICcnOlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgZmlsZSBleHRlbnNpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWxlSW5mby5uYW1lLm1hdGNoKCcuKHppcHxuYW1lc2V0KSQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXNOYW1lc2V0RmlsZUZvcm1hdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNWYWxpZEFyY2hpdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghaXNWYWxpZEFyY2hpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiQXJjaGl2ZWQgbmFtZXNldCBmaWxlIHNob3VsZCBlbmQgaW4gPGNvZGU+LnppcDwvY29kZT4gb3IgPGNvZGU+Lm5hbWVzZXQ8L2NvZGU+LiBDaG9vc2UgYW5vdGhlciBmaWxlP1wiO1xuICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7ICAvLyBwcmVzdW1hYmx5ICdTVFVEWV9PVFVfTUFQUElORydcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGZpbGVJbmZvLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnYXBwbGljYXRpb24vemlwJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXNOYW1lc2V0RmlsZUZvcm1hdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkQXJjaGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndGV4dC9wbGFpbic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQvdGFiLXNlcGFyYXRlZC12YWx1ZXMnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICd0ZXh0L2Nzdic6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2FwcGxpY2F0aW9uL2pzb24nOlxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgZmlsZSBleHRlbnNpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWxlSW5mby5uYW1lLm1hdGNoKCcuKHppcHxuYW1lc2V0fHR4dHx0c3Z8Y3N2fGpzb24pJCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlc05hbWVzZXRGaWxlRm9ybWF0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc1ZhbGlkQXJjaGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCF1c2VzTmFtZXNldEZpbGVGb3JtYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiTmFtZXNldCBmaWxlIHNob3VsZCBlbmQgaW4gb25lIG9mIDxjb2RlPi56aXAgLm5hbWVzZXQgLnR4dCAudHN2IC5jc3YgLmpzb248L2NvZGU+LiBDaG9vc2UgYW5vdGhlciBmaWxlP1wiO1xuICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFN0aWxsIGhlcmU/IHRyeSB0byBleHRyYWN0IGEgbmFtZXNldCBmcm9tIHRoZSBjaG9zZW4gZmlsZVxuICAgICAgICAgICAgaWYgKGlzVmFsaWRBcmNoaXZlKSB7XG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIHJlYWQgYW5kIHVuemlwIHRoaXMgYXJjaGl2ZSFcbiAgICAgICAgICAgICAgICBKU1ppcC5sb2FkQXN5bmMoZmlsZUluZm8pICAgLy8gcmVhZCB0aGUgQmxvYlxuICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oemlwKSB7ICAvLyBzdWNjZXNzIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3JlYWRpbmcgWklQIGNvbnRlbnRzLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiUmVhZGluZyBuYW1lc2V0IGNvbnRlbnRzLi4uXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gSG93IHdpbGwgd2Uga25vdyB3aGVuIGl0J3MgYWxsIChhc3luYykgbG9hZGVkPyBDb3VudCBkb3duIGFzIGVhY2ggZW50cnkgaXMgcmVhZCFcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgemlwRW50cmllc1RvTG9hZCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1haW5Kc29uUGF5bG9hZEZvdW5kID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluaXRpYWxDYWNoZSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHAgaW4gemlwLmZpbGVzKSB7IHppcEVudHJpZXNUb0xvYWQrKzsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXNoIG1vc3QgZm91bmQgZGF0YSBpbiB0aGUgY2FjaGUsIGJ1dCBtYWluIEpTT04gc2hvdWxkIGJlIHBhcnNlZFxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lc2V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICB6aXAuZm9yRWFjaChmdW5jdGlvbiAocmVsYXRpdmVQYXRoLCB6aXBFbnRyeSkgeyAgLy8gMikgcHJpbnQgZW50cmllc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnICAnKyB6aXBFbnRyeS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coemlwRW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIGRpcmVjdG9yaWVzIChub3RoaW5nIHRvIGRvIGhlcmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh6aXBFbnRyeS5kaXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlNLSVBQSU5HIGRpcmVjdG9yeSBcIisgemlwRW50cnkubmFtZSArXCIuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB6aXBFbnRyaWVzVG9Mb2FkLS07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVhZCBhbmQgc3RvcmUgZmlsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgemlwRW50cnkuYXN5bmMoJ3RleHQnLCBmdW5jdGlvbihtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlcG9ydCBwcm9ncmVzcz9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJSZWFkaW5nIG5hbWVzZXQgY29udGVudHMgKFwiKyB6aXBFbnRyeS5uYW1lICtcIik6IFwiKyBtZXRhZGF0YS5wZXJjZW50LnRvRml4ZWQoMikgK1wiICVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIHN1Y2Nlc3MoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlN1Y2Nlc3MgdW56aXBwaW5nIFwiKyB6aXBFbnRyeS5uYW1lICtcIjpcXG5cIisgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHppcEVudHJpZXNUb0xvYWQtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyc2UgYW5kIHN0YXNoIHRoZSBtYWluIEpTT04gZGF0YTsgY2FjaGUgdGhlIHJlc3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTkIgdGhhdCB0aGlzIG5hbWUgY291bGQgaW5jbHVkZSBhIHByZWNlZGluZyBwYXRoIVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHppcEVudHJ5Lm5hbWUgPT09ICdtYWluLmpzb24nKSB8fCAoemlwRW50cnkubmFtZS5lbmRzV2l0aCgnL21haW4uanNvbicpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyBpcyB0aGUgZXhwZWN0ZWQgcGF5bG9hZCBmb3IgYSBaSVBlZCBuYW1lc2V0OyB0cnkgdG8gcGFyc2UgaXQhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWluSnNvblBheWxvYWRGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8ganVzdCBzd2FsbG93IHRoaXMgYW5kIHJlcG9ydCBiZWxvd1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBcIjxjb2RlPm1haW4uanNvbjwvY29kZT4gaXMgbWFsZm9ybWVkIChcIisgZSArXCIpIVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRoaW50QXJlYS5odG1sKG1zZykuc2hvdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXQncyBzb21lIG90aGVyIGZpbGU7IGNvcHkgaXQgdG8gb3VyIGluaXRpYWwgY2FjaGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxDYWNoZVsgemlwRW50cnkubmFtZSBdID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoemlwRW50cmllc1RvTG9hZCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2UndmUgcmVhZCBpbiBhbGwgdGhlIFpJUCBkYXRhISBvcGVuIHRoaXMgbmFtZXNldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gKFRPRE86IHNldHRpbmcgaXRzIGluaXRpYWwgY2FjaGUpIGFuZCBjbG9zZSB0aGlzIHBvcHVwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW1haW5Kc29uUGF5bG9hZEZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiPGNvZGU+bWFpbi5qc29uPC9jb2RlPiBub3QgZm91bmQgaW4gdGhpcyBaSVAhXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYXB0dXJlIHNvbWUgZmlsZSBtZXRhZGF0YSwgaW4gY2FzZSBpdCdzIG5lZWRlZCBpbiB0aGUgbmFtZXNldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvYWRlZEZpbGVOYW1lID0gZmlsZUluZm8ubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0TW9kaWZpZWREYXRlID0gZmlsZUluZm8ubGFzdE1vZGlmaWVkRGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTE9BRElORyBGUk9NIEZJTEUgJ1wiKyBsb2FkZWRGaWxlTmFtZSArXCInLCBMQVNUIE1PRElGSUVEOiBcIisgbGFzdE1vZGlmaWVkRGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29udGV4dCA9PT0gJ0JVTEtfVE5SUycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZXBsYWNlIHRoZSBtYWluIHZpZXctbW9kZWwgb24gdGhpcyBwYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZE5hbWVzZXREYXRhKCBuYW1lc2V0LCBsb2FkZWRGaWxlTmFtZSwgbGFzdE1vZGlmaWVkRGF0ZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE4uQi4gdGhlIEZpbGUgQVBJICphbHdheXMqIGRvd25sb2FkcyB0byBhbiB1bnVzZWQgcGF0aCtmaWxlbmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJyNzdG9yYWdlLW9wdGlvbnMtcG9wdXAnKS5tb2RhbCgnaGlkZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHsgIC8vIHByZXN1bWFibHkgJ1NUVURZX09UVV9NQVBQSU5HJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4YW1pbmUgYW5kIGFwcGx5IHRoZXNlIG1hcHBpbmdzIHRvIHRoZSBPVFVzIGluIHRoZSBjdXJyZW50IHN0dWR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VOYW1lc2V0RGF0YSggbmFtZXNldCwgbG9hZGVkRmlsZU5hbWUsIGxhc3RNb2RpZmllZERhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTkIgaWYgaXQgZmFpbGVkIHRvIHBhcnNlLCB3ZSdyZSBzaG93aW5nIGEgZGVhdGlsZWQgZXJyb3IgbWVzc2FnZSBhYm92ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBlcnJvcihlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBcIlByb2JsZW0gdW56aXBwaW5nIFwiKyB6aXBFbnRyeS5uYW1lICtcIjpcXG5cIisgZS5tZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkaGludEFyZWEuaHRtbChtc2cpLnNob3coKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZSkgeyAgICAgICAgIC8vIGZhaWx1cmUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJFcnJvciByZWFkaW5nIDxzdHJvbmc+XCIgKyBmaWxlSW5mby5uYW1lICsgXCI8L3N0cm9uZz4hIElzIHRoaXMgYSBwcm9wZXIgemlwIGZpbGU/XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIGV4dHJhY3QgbmFtZXNldCBmcm9tIGEgc2ltcGxlIChub24tWklQKSBmaWxlXG4gICAgICAgICAgICAgICAgdmFyIGZyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICBmci5vbmxvYWQgPSBmdW5jdGlvbiggZXZ0ICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGV2dC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZXNldCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCBkYXRhICk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0ID09PSAnQlVMS19UTlJTJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuZXhwZWN0ZWQgY29udGV4dCAnQlVMS19UTlJTJyBmb3IgZmxhdC1maWxlIG5hbWVzZXQhXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAgLy8gcHJlc3VtYWJseSAnU1RVRFlfT1RVX01BUFBJTkcnXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBUcnkgY29udmVyc2lvbiB0byBzdGFuZGFyZCBuYW1lc2V0IEpTIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lc2V0ID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElGIHRoaXMgZmFpbHMsIHRyeSB0byBpbXBvcnQgVFNWL0NTViwgbGluZS1ieS1saW5lIHRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lc2V0ID0gY29udmVydFRvTmFtZXNldE1vZGVsKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVzZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBleGFtaW5lIGFuZCBhcHBseSB0aGVzZSBtYXBwaW5ncyB0byB0aGUgT1RVcyBpbiB0aGUgY3VycmVudCBzdHVkeVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsb2FkZWRGaWxlTmFtZSA9IGZpbGVJbmZvLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RNb2RpZmllZERhdGUgPSBmaWxlSW5mby5sYXN0TW9kaWZpZWREYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lcmdlTmFtZXNldERhdGEoIG5hbWVzZXQsIGxvYWRlZEZpbGVOYW1lLCBsYXN0TW9kaWZpZWREYXRlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCJFcnJvciByZWFkaW5nIG5hbWVzIGZyb20gPHN0cm9uZz5cIiArIGZpbGVJbmZvLm5hbWUgKyBcIjwvc3Ryb25nPiEgUGxlYXNlIGNvbXBhcmUgaXQgdG8gZXhhbXBsZXNcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGhpbnRBcmVhLmh0bWwobXNnKS5zaG93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGZyLnJlYWRBc1RleHQoZmlsZUluZm8pOyAgLy8gZGVmYXVsdCBlbmNvZGluZyBpcyB1dGYtOFxuICAgICAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gY3JlYXRlIHNvbWUgaXNvbGF0ZWQgb2JzZXJ2YWJsZXMgKGFzIGdsb2JhbCBKUyB2YXJzISkgdXNlZCB0byBzdXBwb3J0IG91ciBtYXBwaW5nIFVJXG52YXIgYXV0b01hcHBpbmdJblByb2dyZXNzID0ga28ub2JzZXJ2YWJsZShmYWxzZSk7XG52YXIgY3VycmVudGx5TWFwcGluZ05hbWVzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTsgLy8gZHJpdmVzIHNwaW5uZXJzLCBldGMuXG52YXIgZmFpbGVkTWFwcGluZ05hbWVzID0ga28ub2JzZXJ2YWJsZUFycmF5KFtdKTsgXG4gICAgLy8gaWdub3JlIHRoZXNlIHVudGlsIHdlIGhhdmUgbmV3IG1hcHBpbmcgaGludHNcbnZhciBwcm9wb3NlZE5hbWVNYXBwaW5ncyA9IGtvLm9ic2VydmFibGUoe30pOyBcbiAgICAvLyBzdG9yZWQgYW55IGxhYmVscyBwcm9wb3NlZCBieSBzZXJ2ZXIsIGtleWVkIGJ5IG5hbWUgaWQgW1RPRE8/XVxudmFyIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyID0ga28ub2JzZXJ2YWJsZSgxKTsgIFxuICAgIC8vIHRoaXMganVzdCBudWRnZXMgdGhlIGxhYmVsLWVkaXRpbmcgVUkgdG8gcmVmcmVzaCFcblxuXG4vKiBTVEFSVCBjb252ZXJ0ICdPVFUnIHRvICduYW1lJyB0aHJvdWdob3V0PyAqL1xuXG5mdW5jdGlvbiBhZGp1c3RlZExhYmVsT3JFbXB0eShsYWJlbCkge1xuICAgIC8vIFdlIHNob3VsZCBvbmx5IGRpc3BsYXkgYW4gYWRqdXN0ZWQgbGFiZWwgaWYgaXQncyBjaGFuZ2VkIGZyb20gdGhlXG4gICAgLy8gb3JpZ2luYWw7IG90aGVyd2lzZSByZXR1cm4gYW4gZW1wdHkgc3RyaW5nLlxuICAgIGlmICh0eXBlb2YobGFiZWwpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGxhYmVsID0gbGFiZWwoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZihsYWJlbCkgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIC8vIHByb2JhYmx5IG51bGwsIG5vdGhpbmcgdG8gc2VlIGhlcmVcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHZhciBhZGp1c3RlZCA9IGFkanVzdGVkTGFiZWwobGFiZWwpO1xuICAgIGlmIChhZGp1c3RlZCA9PSBsYWJlbCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgcmV0dXJuIGFkanVzdGVkO1xufVxuXG5mdW5jdGlvbiBhZGp1c3RlZExhYmVsKGxhYmVsKSB7XG4gICAgLy8gYXBwbHkgYW55IGFjdGl2ZSBuYW1lIG1hcHBpbmcgYWRqdXN0bWVudHMgdG8gdGhpcyBzdHJpbmdcbiAgICBpZiAodHlwZW9mKGxhYmVsKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBsYWJlbCA9IGxhYmVsKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YobGFiZWwpICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBwcm9iYWJseSBudWxsXG4gICAgICAgIHJldHVybiBsYWJlbDtcbiAgICB9XG4gICAgdmFyIGFkanVzdGVkID0gbGFiZWw7XG4gICAgLy8gYXBwbHkgYW55IGFjdGl2ZSBzdWJzaXR1dGlvbnMgaW4gdGhlIHZpZXdNZGVsXG4gICAgdmFyIHN1Ykxpc3QgPSB2aWV3TW9kZWwubWFwcGluZ0hpbnRzLnN1YnN0aXR1dGlvbnMoKTtcbiAgICAkLmVhY2goc3ViTGlzdCwgZnVuY3Rpb24oaSwgc3Vic3QpIHtcbiAgICAgICAgaWYgKCFzdWJzdC5hY3RpdmUoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIHNraXAgdG8gbmV4dCBhZGp1c3RtZW50XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9sZFRleHQgPSBzdWJzdC5vbGQoKTtcbiAgICAgICAgdmFyIG5ld1RleHQgPSBzdWJzdC5uZXcoKTtcbiAgICAgICAgaWYgKCQudHJpbShvbGRUZXh0KSA9PT0gJC50cmltKG5ld1RleHQpID09PSBcIlwiKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gc2tpcCB0byBuZXh0IGFkanVzdG1lbnRcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy92YXIgcGF0dGVybiA9IG5ldyBSZWdFeHAob2xkVGV4dCwgJ2cnKTsgIC8vIGcgPSByZXBsYWNlIEFMTCBpbnN0YW5jZXNcbiAgICAgICAgICAgIC8vIE5PLCB0aGlzIGNhdXNlcyB3ZWlyZCByZXBldGl0aW9uIGluIGNvbW1vbiBjYXNlc1xuICAgICAgICAgICAgdmFyIHBhdHRlcm4gPSBuZXcgUmVnRXhwKG9sZFRleHQpO1xuICAgICAgICAgICAgYWRqdXN0ZWQgPSBhZGp1c3RlZC5yZXBsYWNlKHBhdHRlcm4sIG5ld1RleHQpO1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IHN0YWxlIGludmFsaWQtcmVnZXggbWFya2luZyBvbiB0aGlzIGZpZWxkXG4gICAgICAgICAgICBzdWJzdC52YWxpZCh0cnVlKTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAvLyB0aGVyZSdzIHByb2JhYmx5IGludmFsaWQgcmVnZXggaW4gdGhlIGZpZWxkLi4uIG1hcmsgaXQgYW5kIHNraXBcbiAgICAgICAgICAgIHN1YnN0LnZhbGlkKGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBhZGp1c3RlZDtcbn1cblxuLy8ga2VlcCB0cmFjayBvZiB0aGUgbGFzdCAoZGUpc2VsZWN0ZWQgbGlzdCBpdGVtIChpdHMgcG9zaXRpb24pXG52YXIgbGFzdENsaWNrZWRUb2dnbGVQb3NpdGlvbiA9IG51bGw7XG5mdW5jdGlvbiB0b2dnbGVNYXBwaW5nRm9yTmFtZShuYW1lLCBldnQpIHtcbiAgICB2YXIgJHRvZ2dsZSwgbmV3U3RhdGU7XG4gICAgLy8gYWxsb3cgdHJpZ2dlcmluZyB0aGlzIGZyb20gYW55d2hlcmUgaW4gdGhlIHJvd1xuICAgIGlmICgkKGV2dC50YXJnZXQpLmlzKCc6Y2hlY2tib3gnKSkge1xuICAgICAgICAkdG9nZ2xlID0gJChldnQudGFyZ2V0KTtcbiAgICAgICAgLy8gTi5CLiB1c2VyJ3MgY2xpY2sgKG9yIHRoZSBjYWxsZXIpIGhhcyBhbHJlYWR5IHNldCBpdHMgc3RhdGUhXG4gICAgICAgIG5ld1N0YXRlID0gJHRvZ2dsZS5pcygnOmNoZWNrZWQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkdG9nZ2xlID0gJChldnQudGFyZ2V0KS5jbG9zZXN0KCd0cicpLmZpbmQoJ2lucHV0Lm1hcC10b2dnbGUnKTtcbiAgICAgICAgLy8gY2xpY2tpbmcgZWxzZXdoZXJlIHNob3VsZCB0b2dnbGUgY2hlY2tib3ggc3RhdGUhXG4gICAgICAgIG5ld1N0YXRlID0gISgkdG9nZ2xlLmlzKCc6Y2hlY2tlZCcpKTtcbiAgICAgICAgZm9yY2VUb2dnbGVDaGVja2JveCgkdG9nZ2xlLCBuZXdTdGF0ZSk7XG4gICAgfVxuICAgIC8vIGFkZCAob3IgcmVtb3ZlKSBoaWdobGlnaHQgY29sb3IgdGhhdCB3b3JrcyB3aXRoIGhvdmVyLWNvbG9yXG4gICAgLyogTi5CLiB0aGF0IHRoaXMgZHVwbGljYXRlcyB0aGUgZWZmZWN0IG9mIEtub2Nrb3V0IGJpbmRpbmdzIG9uIHRoZXNlIHRhYmxlXG4gICAgICogcm93cyEgVGhpcyBpcyBkZWxpYmVyYXRlLCBzaW5jZSB3ZSdyZSBvZnRlbiB0b2dnbGluZyAqbWFueSogcm93cyBhdFxuICAgICAqIG9uY2UsIHNvIHdlIG5lZWQgdG8gdXBkYXRlIHZpc3VhbCBzdHlsZSB3aGlsZSBwb3N0cG9uaW5nIGFueSB0aWNrbGVyXG4gICAgICogbnVkZ2UgJ3RpbCB3ZSdyZSBkb25lLlxuICAgICAqL1xuICAgIGlmIChuZXdTdGF0ZSkge1xuICAgICAgICAkdG9nZ2xlLmNsb3Nlc3QoJ3RyJykuYWRkQ2xhc3MoJ3dhcm5pbmcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkdG9nZ2xlLmNsb3Nlc3QoJ3RyJykucmVtb3ZlQ2xhc3MoJ3dhcm5pbmcnKTtcbiAgICB9XG4gICAgLy8gaWYgdGhpcyBpcyB0aGUgb3JpZ2luYWwgY2xpY2sgZXZlbnQ7IGNoZWNrIGZvciBhIHJhbmdlIVxuICAgIGlmICh0eXBlb2YoZXZ0LnNoaWZ0S2V5KSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gZGV0ZXJtaW5lIHRoZSBwb3NpdGlvbiAobnRoIGNoZWNrYm94KSBvZiB0aGlzIG5hbWUgaW4gdGhlIHZpc2libGUgbGlzdFxuICAgICAgICB2YXIgJHZpc2libGVUb2dnbGVzID0gJHRvZ2dsZS5jbG9zZXN0KCd0YWJsZScpLmZpbmQoJ2lucHV0Lm1hcC10b2dnbGUnKTtcbiAgICAgICAgdmFyIG5ld0xpc3RQb3NpdGlvbiA9ICQuaW5BcnJheSggJHRvZ2dsZVswXSwgJHZpc2libGVUb2dnbGVzKTtcbiAgICAgICAgaWYgKGV2dC5zaGlmdEtleSAmJiB0eXBlb2YobGFzdENsaWNrZWRUb2dnbGVQb3NpdGlvbikgPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICBmb3JjZU1hcHBpbmdGb3JSYW5nZU9mTmFtZXMoIG5hbWVbJ3NlbGVjdGVkRm9yQWN0aW9uJ10sIGxhc3RDbGlja2VkVG9nZ2xlUG9zaXRpb24sIG5ld0xpc3RQb3NpdGlvbiApO1xuICAgICAgICB9XG4gICAgICAgIC8vIGluIGFueSBjYXNlLCBtYWtlIHRoaXMgdGhlIG5ldyByYW5nZS1zdGFydGVyXG4gICAgICAgIGxhc3RDbGlja2VkVG9nZ2xlUG9zaXRpb24gPSBuZXdMaXN0UG9zaXRpb247XG4gICAgfVxuICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICByZXR1cm4gdHJ1ZTsgIC8vIHVwZGF0ZSB0aGUgY2hlY2tib3hcbn1cbmZ1bmN0aW9uIGZvcmNlTWFwcGluZ0ZvclJhbmdlT2ZOYW1lcyggbmV3U3RhdGUsIHBvc0EsIHBvc0IgKSB7XG4gICAgLy8gdXBkYXRlIHNlbGVjdGVkIHN0YXRlIGZvciBhbGwgY2hlY2tib3hlcyBpbiB0aGlzIHJhbmdlXG4gICAgdmFyICRhbGxNYXBwaW5nVG9nZ2xlcyA9ICQoJ2lucHV0Lm1hcC10b2dnbGUnKTtcbiAgICB2YXIgJHRvZ2dsZXNJblJhbmdlO1xuICAgIGlmIChwb3NCID4gcG9zQSkge1xuICAgICAgICAkdG9nZ2xlc0luUmFuZ2UgPSAkYWxsTWFwcGluZ1RvZ2dsZXMuc2xpY2UocG9zQSwgcG9zQisxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAkdG9nZ2xlc0luUmFuZ2UgPSAkYWxsTWFwcGluZ1RvZ2dsZXMuc2xpY2UocG9zQiwgcG9zQSsxKTtcbiAgICB9XG4gICAgJHRvZ2dsZXNJblJhbmdlLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvcmNlVG9nZ2xlQ2hlY2tib3godGhpcywgbmV3U3RhdGUpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBmb3JjZVRvZ2dsZUNoZWNrYm94KGNiLCBuZXdTdGF0ZSkge1xuICAgIHZhciAkY2IgPSAkKGNiKTtcbiAgICBzd2l0Y2gobmV3U3RhdGUpIHtcbiAgICAgICAgY2FzZSAodHJ1ZSk6XG4gICAgICAgICAgICBpZiAoJGNiLmlzKCc6Y2hlY2tlZCcpID09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgJGNiLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAkY2IudHJpZ2dlckhhbmRsZXIoJ2NsaWNrJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAoZmFsc2UpOlxuICAgICAgICAgICAgaWYgKCRjYi5pcygnOmNoZWNrZWQnKSkge1xuICAgICAgICAgICAgICAgICRjYi5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xuICAgICAgICAgICAgICAgICRjYi50cmlnZ2VySGFuZGxlcignY2xpY2snKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImZvcmNlVG9nZ2xlQ2hlY2tib3goKSBpbnZhbGlkIG5ld1N0YXRlIDxcIisgdHlwZW9mKG5ld1N0YXRlKSArXCI+OlwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobmV3U3RhdGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRvZ2dsZUFsbE1hcHBpbmdDaGVja2JveGVzKGNiKSB7XG4gICAgdmFyICRiaWdUb2dnbGUgPSAkKGNiKTtcbiAgICB2YXIgJGFsbE1hcHBpbmdUb2dnbGVzID0gJCgnaW5wdXQubWFwLXRvZ2dsZScpO1xuICAgIHZhciBuZXdTdGF0ZSA9ICRiaWdUb2dnbGUuaXMoJzpjaGVja2VkJyk7XG4gICAgJGFsbE1hcHBpbmdUb2dnbGVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvcmNlVG9nZ2xlQ2hlY2tib3godGhpcywgbmV3U3RhdGUpO1xuICAgIH0pO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBlZGl0TmFtZUxhYmVsKG5hbWUsIGV2dCkge1xuICAgIHZhciBuYW1laWQgPSBuYW1lWydpZCddO1xuICAgIHZhciBvcmlnaW5hbExhYmVsID0gbmFtZVsnb3JpZ2luYWxMYWJlbCddO1xuICAgIG5hbWVbJ2FkanVzdGVkTGFiZWwnXSA9IGFkanVzdGVkTGFiZWwob3JpZ2luYWxMYWJlbCk7XG5cbiAgICAvLyBNYXJrIHRoaXMgbmFtZSBhcyBzZWxlY3RlZCBmb3IgbWFwcGluZy5cbiAgICBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddID0gdHJ1ZTtcblxuICAgIC8vIElmIHdlIGhhdmUgYSBwcm9wZXIgbW91c2UgZXZlbnQsIHRyeSB0byBtb3ZlIGlucHV0IGZvY3VzIHRvIHRoaXMgZmllbGRcbiAgICAvLyBhbmQgcHJlLXNlbGVjdCBpdHMgZnVsbCB0ZXh0LlxuICAgIC8vXG4gICAgLy8gTi5CLiBUaGVyZSdzIGEgJ2hhc0ZvY3VzJyBiaW5kaW5nIHdpdGggc2ltaWxhciBiZWhhdmlvciwgYnV0IGl0J3MgdHJpY2t5XG4gICAgLy8gdG8gbWFyayB0aGUgbmV3IGZpZWxkIHZzLiBleGlzdGluZyBvbmVzOlxuICAgIC8vICAgaHR0cDovL2tub2Nrb3V0anMuY29tL2RvY3VtZW50YXRpb24vaGFzZm9jdXMtYmluZGluZy5odG1sXG4gICAgaWYgKCdjdXJyZW50VGFyZ2V0JyBpbiBldnQpIHtcbiAgICAgICAgLy8gY2FwdHVyZSB0aGUgY3VycmVudCB0YWJsZSByb3cgYmVmb3JlIERPTSB1cGRhdGVzXG4gICAgICAgIHZhciAkY3VycmVudFJvdyA9ICQoZXZ0LmN1cnJlbnRUYXJnZXQpLmNsb3Nlc3QoJ3RyJyk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJGVkaXRGaWVsZCA9ICRjdXJyZW50Um93LmZpbmQoJ2lucHV0OnRleHQnKTtcbiAgICAgICAgICAgICRlZGl0RmllbGQuZm9jdXMoKS5zZWxlY3QoKTtcbiAgICAgICAgfSwgNTApO1xuICAgIH1cblxuICAgIC8vIHRoaXMgc2hvdWxkIG1ha2UgdGhlIGVkaXRvciBhcHBlYXIgKGFsdGVyaW5nIHRoZSBET00pXG4gICAgYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyKCkgKyAxKTtcbiAgICBudWRnZVRpY2tsZXIoICdOQU1FX01BUFBJTkdfSElOVFMnKTsgLy8gdG8gcmVmcmVzaCAnc2VsZWN0ZWQnIGNoZWNrYm94XG59XG5mdW5jdGlvbiBtb2RpZnlFZGl0ZWRMYWJlbChuYW1lKSB7XG4gICAgLy8gcmVtb3ZlIGl0cyBuYW1lLWlkIGZyb20gZmFpbGVkLW5hbWUgbGlzdCB3aGVuIHVzZXIgbWFrZXMgY2hhbmdlc1xuICAgIHZhciBuYW1laWQgPSBuYW1lWydpZCddO1xuICAgIGZhaWxlZE1hcHBpbmdOYW1lcy5yZW1vdmUobmFtZWlkKTtcbiAgICAvLyBudWRnZSB0byB1cGRhdGUgbmFtZSBsaXN0IGltbWVkaWF0ZWx5XG4gICAgYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyKCkgKyAxKTtcbiAgICBudWRnZUF1dG9NYXBwaW5nKCk7XG5cbiAgICBudWRnZVRpY2tsZXIoICdOQU1FX01BUFBJTkdfSElOVFMnKTtcbn1cbmZ1bmN0aW9uIHJldmVydE5hbWVMYWJlbChuYW1lKSB7XG4gICAgLy8gdW5kb2VzICdlZGl0TmFtZUxhYmVsJywgcmVsZWFzaW5nIGEgbGFiZWwgdG8gdXNlIHNoYXJlZCBoaW50c1xuICAgIHZhciBuYW1laWQgPSBuYW1lWydpZCddO1xuICAgIGRlbGV0ZSBuYW1lWydhZGp1c3RlZExhYmVsJ107XG4gICAgZmFpbGVkTWFwcGluZ05hbWVzLnJlbW92ZShuYW1laWQgKTtcbiAgICAvLyB0aGlzIHNob3VsZCBtYWtlIHRoZSBlZGl0b3IgZGlzYXBwZWFyIGFuZCByZXZlcnQgaXRzIGFkanVzdGVkIGxhYmVsXG4gICAgYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoIGJvZ3VzRWRpdGVkTGFiZWxDb3VudGVyKCkgKyAxKTtcbiAgICBudWRnZUF1dG9NYXBwaW5nKCk7XG59XG5cbmZ1bmN0aW9uIHByb3Bvc2VOYW1lTGFiZWwobmFtZWlkLCBtYXBwaW5nSW5mbykge1xuICAgIC8vIHN0YXNoIG9uZSAob3IgbW9yZSkgbWFwcGluZ3MgYXMgb3B0aW9ucyBmb3IgdGhpcyBuYW1lXG4gICAgaWYgKCQuaXNBcnJheSggbWFwcGluZ0luZm8pKSB7XG4gICAgICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzKClbIG5hbWVpZCBdID0ga28ub2JzZXJ2YWJsZUFycmF5KCBtYXBwaW5nSW5mbyApLmV4dGVuZCh7IG5vdGlmeTogJ2Fsd2F5cycgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF0gPSBrby5vYnNlcnZhYmxlKCBtYXBwaW5nSW5mbyApLmV4dGVuZCh7IG5vdGlmeTogJ2Fsd2F5cycgfSk7XG4gICAgfVxuICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgIC8vIHRoaXMgc2hvdWxkIG1ha2UgdGhlIGVkaXRvciBhcHBlYXJcbn1cbmZ1bmN0aW9uIHByb3Bvc2VkTWFwcGluZyggbmFtZSApIHtcbiAgICBpZiAoIW5hbWUgfHwgdHlwZW9mIG5hbWVbJ2lkJ10gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwicHJvcG9zZWRNYXBwaW5nKCkgZmFpbGVkXCIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIG5hbWVpZCA9IG5hbWVbJ2lkJ107XG4gICAgdmFyIGFjYyA9IHByb3Bvc2VkTmFtZU1hcHBpbmdzKClbIG5hbWVpZCBdO1xuICAgIHJldHVybiBhY2MgPyBhY2MoKSA6IG51bGw7XG59XG5mdW5jdGlvbiBhcHByb3ZlUHJvcG9zZWROYW1lTGFiZWwobmFtZSkge1xuICAgIC8vIHVuZG9lcyAnZWRpdE5hbWVMYWJlbCcsIHJlbGVhc2luZyBhIGxhYmVsIHRvIHVzZSBzaGFyZWQgaGludHNcbiAgICB2YXIgbmFtZWlkID0gbmFtZVsnaWQnXTtcbiAgICB2YXIgaXRzTWFwcGluZ0luZm8gPSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICB2YXIgYXBwcm92ZWRNYXBwaW5nID0gJC5pc0Z1bmN0aW9uKGl0c01hcHBpbmdJbmZvKSA/XG4gICAgICAgIGl0c01hcHBpbmdJbmZvKCkgOlxuICAgICAgICBpdHNNYXBwaW5nSW5mbztcbiAgICBpZiAoJC5pc0FycmF5KGFwcHJvdmVkTWFwcGluZykpIHtcbiAgICAgICAgLy8gYXBwbHkgdGhlIGZpcnN0IChvbmx5KSB2YWx1ZVxuICAgICAgICBtYXBOYW1lVG9UYXhvbiggbmFtZWlkLCBhcHByb3ZlZE1hcHBpbmdbMF0gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhcHBseSB0aGUgaW5uZXIgdmFsdWUgb2YgYW4gb2JzZXJ2YWJsZSAoYWNjZXNzb3IpIGZ1bmN0aW9uXG4gICAgICAgIG1hcE5hbWVUb1RheG9uKCBuYW1laWQsIGtvLnVud3JhcChhcHByb3ZlZE1hcHBpbmcpICk7XG4gICAgfVxuICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIG51ZGdlVGlja2xlciggJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUycpOyAvLyB0byByZWZyZXNoIHN0YXR1cyBiYXJcbn1cbmZ1bmN0aW9uIGFwcHJvdmVQcm9wb3NlZE5hbWVNYXBwaW5nT3B0aW9uKGFwcHJvdmVkTWFwcGluZywgc2VsZWN0ZWRJbmRleCkge1xuICAgIC8vIHNpbWlsYXIgdG8gYXBwcm92ZVByb3Bvc2VkTmFtZUxhYmVsLCBidXQgZm9yIGEgbGlzdGVkIG9wdGlvblxuICAgIHZhciBuYW1laWQgPSBhcHByb3ZlZE1hcHBpbmcubmFtZUlEO1xuICAgIG1hcE5hbWVUb1RheG9uKCBuYW1laWQsIGFwcHJvdmVkTWFwcGluZyApO1xuICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIG51ZGdlVGlja2xlciggJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUycpOyAvLyB0byByZWZyZXNoIHN0YXR1cyBiYXJcbn1cbmZ1bmN0aW9uIHJlamVjdFByb3Bvc2VkTmFtZUxhYmVsKG5hbWUpIHtcbiAgICAvLyB1bmRvZXMgJ3Byb3Bvc2VOYW1lTGFiZWwnLCBjbGVhcmluZyBpdHMgdmFsdWVcbiAgICB2YXIgbmFtZWlkID0gbmFtZVsnaWQnXTtcbiAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF07XG4gICAgcHJvcG9zZWROYW1lTWFwcGluZ3MudmFsdWVIYXNNdXRhdGVkKCk7XG4gICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICBudWRnZVRpY2tsZXIoICdWSVNJQkxFX05BTUVfTUFQUElOR1MnKTsgLy8gdG8gcmVmcmVzaCBzdGF0dXMgYmFyXG59XG5cbmZ1bmN0aW9uIGdldEFsbFZpc2libGVQcm9wb3NlZE1hcHBpbmdzKCkge1xuICAgIC8vIGdhdGhlciBhbnkgcHJvcG9zZWQgbWFwcGluZ3MgKElEcykgdGhhdCBhcmUgdmlzaWJsZSBvbiB0aGlzIHBhZ2VcbiAgICB2YXIgdmlzaWJsZVByb3Bvc2VkTWFwcGluZ3MgPSBbXTtcbiAgICB2YXIgdmlzaWJsZU5hbWVzID0gdmlld01vZGVsLmZpbHRlcmVkTmFtZXMoKS5wYWdlZEl0ZW1zKCk7XG4gICAgJC5lYWNoKCB2aXNpYmxlTmFtZXMsIGZ1bmN0aW9uIChpLCBuYW1lKSB7XG4gICAgICAgIGlmIChwcm9wb3NlZE1hcHBpbmcobmFtZSkpIHtcbiAgICAgICAgICAgIC8vIHdlIGhhdmUgYSBwcm9wb3NlZCBtYXBwaW5nIGZvciB0aGlzIG5hbWUhXG4gICAgICAgICAgICB2aXNpYmxlUHJvcG9zZWRNYXBwaW5ncy5wdXNoKCBuYW1lWydpZCddICk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdmlzaWJsZVByb3Bvc2VkTWFwcGluZ3M7IC8vIHJldHVybiBhIHNlcmllcyBvZiBJRHNcbn1cbmZ1bmN0aW9uIGFwcHJvdmVBbGxWaXNpYmxlTWFwcGluZ3MoKSB7XG4gICAgJC5lYWNoKGdldEFsbFZpc2libGVQcm9wb3NlZE1hcHBpbmdzKCksIGZ1bmN0aW9uKGksIG5hbWVpZCkge1xuICAgICAgICB2YXIgaXRzTWFwcGluZ0luZm8gPSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICAgICAgdmFyIGFwcHJvdmVkTWFwcGluZyA9ICQuaXNGdW5jdGlvbihpdHNNYXBwaW5nSW5mbykgP1xuICAgICAgICAgICAgaXRzTWFwcGluZ0luZm8oKSA6XG4gICAgICAgICAgICBpdHNNYXBwaW5nSW5mbztcbiAgICAgICAgaWYgKCQuaXNBcnJheShhcHByb3ZlZE1hcHBpbmcpKSB7XG4gICAgICAgICAgICBpZiAoYXBwcm92ZWRNYXBwaW5nLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIHRlc3QgdGhlIGZpcnN0IChvbmx5KSB2YWx1ZSBmb3IgcG9zc2libGUgYXBwcm92YWxcbiAgICAgICAgICAgICAgICB2YXIgb25seU1hcHBpbmcgPSBhcHByb3ZlZE1hcHBpbmdbMF07XG4gICAgICAgICAgICAgICAgaWYgKG9ubHlNYXBwaW5nLm9yaWdpbmFsTWF0Y2guaXNfc3lub255bSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47ICAvLyBzeW5vbnltcyByZXF1aXJlIG1hbnVhbCByZXZpZXdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogTi5CLiBXZSBuZXZlciBwcmVzZW50IHRoZSBzb2xlIG1hcHBpbmcgc3VnZ2VzdGlvbiBhcyBhXG4gICAgICAgICAgICAgICAgICogdGF4b24tbmFtZSBob21vbnltLCBzbyBqdXN0IGNvbnNpZGVyIHRoZSBtYXRjaCBzY29yZSB0b1xuICAgICAgICAgICAgICAgICAqIGRldGVybWluZSB3aGV0aGVyIGl0J3MgYW4gXCJleGFjdCBtYXRjaFwiLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIGlmIChvbmx5TWFwcGluZy5vcmlnaW5hbE1hdGNoLnNjb3JlIDwgMS4wKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjsgIC8vIG5vbi1leGFjdCBtYXRjaGVzIHJlcXVpcmUgbWFudWFsIHJldmlld1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzdGlsbCBoZXJlPyB0aGVuIHRoaXMgbWFwcGluZyBsb29rcyBnb29kIGVub3VnaCBmb3IgYXV0by1hcHByb3ZhbFxuICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wb3NlZE5hbWVNYXBwaW5ncygpWyBuYW1laWQgXTtcbiAgICAgICAgICAgICAgICBtYXBOYW1lVG9UYXhvbiggbmFtZWlkLCBhcHByb3ZlZE1hcHBpbmdbMF0sIHtQT1NUUE9ORV9VSV9DSEFOR0VTOiB0cnVlfSApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm47IC8vIG11bHRpcGxlIHBvc3NpYmlsaXRpZXMgcmVxdWlyZSBtYW51YWwgcmV2aWV3XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhcHBseSB0aGUgaW5uZXIgdmFsdWUgb2YgYW4gb2JzZXJ2YWJsZSAoYWNjZXNzb3IpIGZ1bmN0aW9uXG4gICAgICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF07XG4gICAgICAgICAgICBtYXBOYW1lVG9UYXhvbiggbmFtZWlkLCBrby51bndyYXAoYXBwcm92ZWRNYXBwaW5nKSwge1BPU1RQT05FX1VJX0NIQU5HRVM6IHRydWV9ICk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIG51ZGdlVGlja2xlciggJ1ZJU0lCTEVfTkFNRV9NQVBQSU5HUycpOyAvLyB0byByZWZyZXNoIHN0YXR1cyBiYXJcbiAgICBzdGFydEF1dG9NYXBwaW5nKCk7XG59XG5mdW5jdGlvbiByZWplY3RBbGxWaXNpYmxlTWFwcGluZ3MoKSB7XG4gICAgJC5lYWNoKGdldEFsbFZpc2libGVQcm9wb3NlZE1hcHBpbmdzKCksIGZ1bmN0aW9uKGksIG5hbWVpZCkge1xuICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZWlkIF07XG4gICAgfSk7XG4gICAgcHJvcG9zZWROYW1lTWFwcGluZ3MudmFsdWVIYXNNdXRhdGVkKCk7XG4gICAgc3RvcEF1dG9NYXBwaW5nKCk7XG4gICAgbnVkZ2VUaWNrbGVyKCAnVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7IC8vIHRvIHJlZnJlc2ggc3RhdHVzIGJhclxufVxuXG5mdW5jdGlvbiB1cGRhdGVNYXBwaW5nU3RhdHVzKCkge1xuICAgIC8vIHVwZGF0ZSBtYXBwaW5nIHN0YXR1cytkZXRhaWxzIGJhc2VkIG9uIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoaW5nc1xuICAgIHZhciBkZXRhaWxzSFRNTCwgc2hvd0JhdGNoQXBwcm92ZSwgc2hvd0JhdGNoUmVqZWN0LCBuZWVkc0F0dGVudGlvbjtcbiAgICAvKiBUT0RPOiBkZWZhdWx0cyBhc3N1bWUgbm90aGluZyBwYXJ0aWN1bGFybHkgaW50ZXJlc3RpbmcgZ29pbmcgb25cbiAgICBkZXRhaWxzSFRNTCA9ICcnO1xuICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICBzaG93QmF0Y2hSZWplY3QgPSB0cnVlO1xuICAgIG5lZWRzQXR0ZW50aW9uID0gZmFsc2U7XG4gICAgKi9cbiAgICB2YXIgcHJvcG9zZWRNYXBwaW5nTmVlZHNEZWNpc2lvbiA9IGZhbHNlO1xuICAgIGZvciAodmFyIHAgaW4gcHJvcG9zZWROYW1lTWFwcGluZ3MoKSkge1xuICAgICAgICAvLyB0aGUgcHJlc2VuY2Ugb2YgYW55dGhpbmcgaGVyZSBtZWFucyB0aGVyZSBhcmUgcHJvcG9zZWQgbWFwcGluZ3NcbiAgICAgICAgcHJvcG9zZWRNYXBwaW5nTmVlZHNEZWNpc2lvbiA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGF1dG9NYXBwaW5nSW5Qcm9ncmVzcygpID09PSB0cnVlKSB7XG4gICAgICAgIC8vIGF1dG8tbWFwcGluZyBpcyBBQ1RJVkUgKG1lYW5pbmcgd2UgaGF2ZSB3b3JrIGluIGhhbmQpXG4gICAgICAgIGRldGFpbHNIVE1MID0gJyc7IC8vICc8cCcrJz5NYXBwaW5nIGluIHByb2dyZXNzLi4uPCcrJy9wPic7XG4gICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgc2hvd0JhdGNoUmVqZWN0ID0gZmFsc2U7XG4gICAgICAgIG5lZWRzQXR0ZW50aW9uID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGdldE5leHRVbm1hcHBlZE5hbWUoKSkge1xuICAgICAgICAgICAgLy8gSUYgYXV0by1tYXBwaW5nIGlzIFBBVVNFRCwgYnV0IHRoZXJlJ3MgbW9yZSB0byBkbyBvbiB0aGlzIHBhZ2VcbiAgICAgICAgICAgIGRldGFpbHNIVE1MID0gJzxwJysnPk1hcHBpbmcgcGF1c2VkLiBTZWxlY3QgbmV3IG5hbWUgb3IgYWRqdXN0IG1hcHBpbmcgaGludHMsIHRoZW4gY2xpY2sgdGhlICdcbiAgICAgICAgICAgICAgICAgICAgICAgICArJzxzdHJvbmc+TWFwIHNlbGVjdGVkIG5hbWU8L3N0cm9uZz4gYnV0dG9uIGFib3ZlIHRvIHRyeSBhZ2Fpbi48JysnL3A+JztcbiAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHNob3dCYXRjaFJlamVjdCA9IHByb3Bvc2VkTWFwcGluZ05lZWRzRGVjaXNpb247XG4gICAgICAgICAgICBuZWVkc0F0dGVudGlvbiA9IHByb3Bvc2VkTWFwcGluZ05lZWRzRGVjaXNpb247XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhdXRvLW1hcHBpbmcgaXMgUEFVU0VEIGFuZCBldmVyeXRoaW5nJ3MgYmVlbiBtYXBwZWRcbiAgICAgICAgICAgIGlmIChwcm9wb3NlZE1hcHBpbmdOZWVkc0RlY2lzaW9uKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlcmUgYXJlIHByb3Bvc2VkIG1hcHBpbmdzIGF3YWl0aW5nIGEgZGVjaXNpb25cbiAgICAgICAgICAgICAgICBkZXRhaWxzSFRNTCA9ICc8cCcrJz5BbGwgc2VsZWN0ZWQgbmFtZXMgaGF2ZSBiZWVuIG1hcHBlZC4gVXNlIHRoZSAnXG4gICAgICAgICAgICAgICAgICAgICAgICArJzxzcGFuIGNsYXNzPVwiYnRuLWdyb3VwXCIgc3R5bGU9XCJtYXJnaW46IC0ycHggMDtcIj4nXG4gICAgICAgICAgICAgICAgICAgICAgICArJyA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1taW5pIGRpc2FibGVkXCI+PGkgY2xhc3M9XCJpY29uLW9rXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnPC9zcGFuPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIGJ1dHRvbnMgdG8gYWNjZXB0IG9yIHJlamVjdCBlYWNoIHN1Z2dlc3RlZCBtYXBwaW5nLCdcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIG9yIHRoZSBidXR0b25zIGJlbG93IHRvIGFjY2VwdCBvciByZWplY3QgdGhlIHN1Z2dlc3Rpb25zIGZvciBhbGwgdmlzaWJsZSBuYW1lcy48JysnL3A+JztcbiAgICAgICAgICAgICAgICBzaG93QmF0Y2hBcHByb3ZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzaG93QmF0Y2hSZWplY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG5lZWRzQXR0ZW50aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlcmUgYXJlIE5PIHByb3Bvc2VkIG1hcHBpbmdzIGF3YWl0aW5nIGEgZGVjaXNpb25cbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8qIFRPRE86IGNoZWNrIGZvciB0d28gcG9zc2liaWxpdGllcyBoZXJlXG4gICAgICAgICAgICAgICAgaWYgKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBjYW4gYWRkIG1vcmUgYnkgaW5jbHVkaW5nICdBbGwgdHJlZXMnXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbHNIVE1MID0gJzxwJysnPjxzdHJvbmc+Q29uZ3J0dWxhdGlvbnMhPC9zdHJvbmc+ICdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJ01hcHBpbmcgaXMgc3VzcGVuZGVkIGJlY2F1c2UgYWxsIG5hbWVzIGluIHRoaXMgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnc3R1ZHlcXCdzIG5vbWluYXRlZCB0cmVlcyBoYXZlIGFjY2VwdGVkIGxhYmVscyBhbHJlYWR5LiBUbyBjb250aW51ZSwgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsncmVqZWN0IHNvbWUgbWFwcGVkIGxhYmVscyB3aXRoIHRoZSAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyc8c3BhbiBjbGFzcz1cImJ0bi1ncm91cFwiIHN0eWxlPVwibWFyZ2luOiAtMnB4IDA7XCI+J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJzwvc3Bhbj4gJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnYnV0dG9uIG9yIGNoYW5nZSB0aGUgZmlsdGVyIHRvIDxzdHJvbmc+SW4gYW55IHRyZWU8L3N0cm9uZz4uPCcrJy9wPic7XG4gICAgICAgICAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0JhdGNoUmVqZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIG5lZWRzQXR0ZW50aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSdyZSB0cnVseSBkb25lIHdpdGggbWFwcGluZyAoaW4gYWxsIHRyZWVzKVxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxzSFRNTCA9ICc8cCcrJz48c3Ryb25nPkNvbmdydHVsYXRpb25zITwvc3Ryb25nPiAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKydNYXBwaW5nIGlzIHN1c3BlbmRlZCBiZWNhdXNlIGFsbCBuYW1lcyBpbiB0aGlzIHN0dWR5IGhhdmUgYWNjZXB0ZWQgJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnbGFiZWxzIGFscmVhZHkuLiBUbyBjb250aW51ZSwgdXNlIHRoZSAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyc8c3BhbiBjbGFzcz1cImJ0bi1ncm91cFwiIHN0eWxlPVwibWFyZ2luOiAtMnB4IDA7XCI+J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArJzwvc3Bhbj4nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKycgYnV0dG9ucyB0byByZWplY3QgYW55IGxhYmVsIGF0IGxlZnQuPCcrJy9wPic7XG4gICAgICAgICAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc2hvd0JhdGNoUmVqZWN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIG5lZWRzQXR0ZW50aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgICAgIC8qIFRPRE86IHJlcGxhY2UgdGhpcyBzdHVmZiB3aXRoIGlmL2Vsc2UgYmxvY2sgYWJvdmVcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBkZXRhaWxzSFRNTCA9ICc8cCcrJz5NYXBwaW5nIGlzIHN1c3BlbmRlZCBiZWNhdXNlIGFsbCBzZWxlY3RlZCBuYW1lcyBoYXZlIGFjY2VwdGVkICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIGxhYmVscyBhbHJlYWR5LiBUbyBjb250aW51ZSwgc2VsZWN0IGFkZGl0aW9uYWwgbmFtZXMgdG8gbWFwLCBvciB1c2UgdGhlICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsnPHNwYW4gY2xhc3M9XCJidG4tZ3JvdXBcIiBzdHlsZT1cIm1hcmdpbjogLTJweCAwO1wiPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLW1pbmkgZGlzYWJsZWRcIj48aSBjbGFzcz1cImljb24tcmVtb3ZlXCI+PC9pPjwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnPC9zcGFuPidcbiAgICAgICAgICAgICAgICAgICAgICAgICsnIGJ1dHRvbnMgdG8gcmVqZWN0IGFueSBsYWJlbCBhdCBsZWZ0LCBvciBjaGFuZ2UgdGhlIGZpbHRlciBhbmQgc29ydCBvcHRpb25zJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKycgdG8gYnJpbmcgdW5tYXBwZWQgbmFtZXMgaW50byB2aWV3LjwnKycvcD4nO1xuICAgICAgICAgICAgICAgIHNob3dCYXRjaEFwcHJvdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzaG93QmF0Y2hSZWplY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBuZWVkc0F0dGVudGlvbiA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkKCcubWFwcGluZy1kZXRhaWxzJykuaHRtbChkZXRhaWxzSFRNTCk7XG4gICAgaWYgKHNob3dCYXRjaEFwcHJvdmUgfHwgc2hvd0JhdGNoUmVqZWN0KSB7XG4gICAgICAgICQoJy5tYXBwaW5nLWJhdGNoLW9wZXJhdGlvbnMnKS5zaG93KCk7XG4gICAgICAgIGlmIChzaG93QmF0Y2hBcHByb3ZlKSB7XG4gICAgICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zICNiYXRjaC1hcHByb3ZlJykuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCgnLm1hcHBpbmctYmF0Y2gtb3BlcmF0aW9ucyAjYmF0Y2gtYXBwcm92ZScpLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hvd0JhdGNoUmVqZWN0KSB7XG4gICAgICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zICNiYXRjaC1yZWplY3QnKS5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zICNiYXRjaC1yZWplY3QnKS5oaWRlKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAkKCcubWFwcGluZy1iYXRjaC1vcGVyYXRpb25zJykuaGlkZSgpO1xuICAgIH1cbiAgICBpZiAobmVlZHNBdHRlbnRpb24pIHtcbiAgICAgICAgJCgnI21hcHBpbmctc3RhdHVzLXBhbmVsJykuYWRkQ2xhc3MoJ21hcHBpbmctbmVlZHMtYXR0ZW50aW9uJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgJCgnI21hcHBpbmctc3RhdHVzLXBhbmVsJykucmVtb3ZlQ2xhc3MoJ21hcHBpbmctbmVlZHMtYXR0ZW50aW9uJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzdGFydEF1dG9NYXBwaW5nKCkge1xuICAgIC8vIGJlZ2luIGEgZGFpc3ktY2hhaW4gb2YgQUpBWCBvcGVyYXRpb25zLCBtYXBwaW5nIDEgbGFiZWwgKG9yIG1vcmU/KSB0byBrbm93biB0YXhhXG4gICAgLy8gVE9ETzogd2hhdCBpZiB0aGVyZSB3YXMgYSBwZW5kaW5nIG9wZXJhdGlvbiB3aGVuIHdlIHN0b3BwZWQ/XG4gICAgYXV0b01hcHBpbmdJblByb2dyZXNzKCB0cnVlICk7XG4gICAgcmVxdWVzdFRheG9uTWFwcGluZygpOyAgLy8gdHJ5IHRvIGdyYWIgdGhlIGZpcnN0IHVubWFwcGVkIGxhYmVsIGluIHZpZXdcbiAgICB1cGRhdGVNYXBwaW5nU3RhdHVzKCk7XG59XG5mdW5jdGlvbiBzdG9wQXV0b01hcHBpbmcoKSB7XG4gICAgLy8gVE9ETzogd2hhdCBpZiB0aGVyZSdzIGFuIG9wZXJhdGlvbiBpbiBwcm9ncmVzcz8gZ2V0IGl0cyByZXN1bHQsIG9yIGRyb3AgaXQ/XG4gICAgYXV0b01hcHBpbmdJblByb2dyZXNzKCBmYWxzZSApO1xuICAgIGN1cnJlbnRseU1hcHBpbmdOYW1lcy5yZW1vdmVBbGwoKTtcbiAgICByZWNlbnRNYXBwaW5nU3BlZWRCYXJDbGFzcyggJ3Byb2dyZXNzIHByb2dyZXNzLWluZm8nICk7ICAgLy8gaW5hY3RpdmUgYmx1ZSBiYXJcbiAgICB1cGRhdGVNYXBwaW5nU3RhdHVzKCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZU1hcHBpbmdTcGVlZCggbmV3RWxhcHNlZFRpbWUgKSB7XG4gICAgcmVjZW50TWFwcGluZ1RpbWVzLnB1c2gobmV3RWxhcHNlZFRpbWUpO1xuICAgIGlmIChyZWNlbnRNYXBwaW5nVGltZXMubGVuZ3RoID4gNSkge1xuICAgICAgICAvLyBrZWVwIGp1c3QgdGhlIGxhc3QgNSB0aW1lc1xuICAgICAgICByZWNlbnRNYXBwaW5nVGltZXMgPSByZWNlbnRNYXBwaW5nVGltZXMuc2xpY2UoLTUpO1xuICAgIH1cblxuICAgIHZhciB0b3RhbCA9IDA7XG4gICAgJC5lYWNoKHJlY2VudE1hcHBpbmdUaW1lcywgZnVuY3Rpb24oaSwgdGltZSkge1xuICAgICAgICB0b3RhbCArPSB0aW1lO1xuICAgIH0pO1xuICAgIHZhciByb2xsaW5nQXZlcmFnZSA9IHRvdGFsIC8gcmVjZW50TWFwcGluZ1RpbWVzLmxlbmd0aDtcbiAgICB2YXIgc2VjUGVyTmFtZSA9IHJvbGxpbmdBdmVyYWdlIC8gMTAwMDtcbiAgICAvLyBzaG93IGEgbGVnaWJsZSBudW1iZXIgKGZpcnN0IHNpZ25pZmljYW50IGRpZ2l0KVxuICAgIHZhciBkaXNwbGF5U2VjO1xuICAgIGlmIChzZWNQZXJOYW1lID49IDAuMSkge1xuICAgICAgICBkaXNwbGF5U2VjID0gc2VjUGVyTmFtZS50b0ZpeGVkKDEpO1xuICAgIH0gZWxzZSBpZiAoc2VjUGVyTmFtZSA+PSAwLjAxKSB7XG4gICAgICAgIGRpc3BsYXlTZWMgPSBzZWNQZXJOYW1lLnRvRml4ZWQoMik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZGlzcGxheVNlYyA9IHNlY1Blck5hbWUudG9GaXhlZCgzKTtcbiAgICB9XG5cbiAgICByZWNlbnRNYXBwaW5nU3BlZWRMYWJlbCggZGlzcGxheVNlYyArXCIgc2VjIC8gbmFtZVwiKTtcblxuICAgIC8vIHVzZSBhcmJpdHJhcnkgc3BlZWRzIGhlcmUsIGZvciBiYWQvZmFpci9nb29kXG4gICAgaWYgKHNlY1Blck5hbWUgPCAwLjIpIHtcbiAgICAgICAgcmVjZW50TWFwcGluZ1NwZWVkQmFyQ2xhc3MoICdwcm9ncmVzcyBwcm9ncmVzcy1zdWNjZXNzJyApOyAgLy8gZ3JlZW4gYmFyXG4gICAgfSBlbHNlIGlmIChzZWNQZXJOYW1lIDwgMi4wKSB7XG4gICAgICAgIHJlY2VudE1hcHBpbmdTcGVlZEJhckNsYXNzKCAncHJvZ3Jlc3MgcHJvZ3Jlc3Mtd2FybmluZycgKTsgIC8vIG9yYW5nZSBiYXJcbiAgICB9IGVsc2Uge1xuICAgICAgICByZWNlbnRNYXBwaW5nU3BlZWRCYXJDbGFzcyggJ3Byb2dyZXNzIHByb2dyZXNzLWRhbmdlcicgKTsgICAvLyByZWQgYmFyXG4gICAgfVxuXG4gICAgLy8gYmFyIHdpZHRoIGlzIGFwcHJveGltYXRlLCBuZWVkcyB+NDAlIHRvIHNob3cgaXRzIHRleHRcbiAgICByZWNlbnRNYXBwaW5nU3BlZWRQZXJjZW50KCAoNDAgKyBNYXRoLm1pbiggKDAuMSAvIHNlY1Blck5hbWUpICogNjAsIDYwKSkudG9GaXhlZCgpICtcIiVcIiApO1xufVxuXG5cbmZ1bmN0aW9uIGdldE5leHRVbm1hcHBlZE5hbWUoKSB7XG4gICAgdmFyIHVubWFwcGVkTmFtZSA9IG51bGw7XG4gICAgdmFyIHZpc2libGVOYW1lcyA9IHZpZXdNb2RlbC5maWx0ZXJlZE5hbWVzKCkucGFnZWRJdGVtcygpO1xuICAgICQuZWFjaCggdmlzaWJsZU5hbWVzLCBmdW5jdGlvbiAoaSwgbmFtZSkge1xuICAgICAgICB2YXIgaXNBdmFpbGFibGUgPSBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddIHx8IGZhbHNlO1xuICAgICAgICAvLyBpZiBubyBzdWNoIGF0dHJpYnV0ZSwgY29uc2lkZXIgaXQgdW5hdmFpbGFibGVcbiAgICAgICAgaWYgKGlzQXZhaWxhYmxlKSB7XG4gICAgICAgICAgICB2YXIgb3R0TWFwcGluZ1RhZyA9IG5hbWVbJ290dElkJ10gfHwgbnVsbDtcbiAgICAgICAgICAgIHZhciBwcm9wb3NlZE1hcHBpbmdJbmZvID0gcHJvcG9zZWRNYXBwaW5nKG5hbWUpO1xuICAgICAgICAgICAgaWYgKCFvdHRNYXBwaW5nVGFnICYmICFwcm9wb3NlZE1hcHBpbmdJbmZvKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBhbiB1bm1hcHBlZCBuYW1lIVxuICAgICAgICAgICAgICAgIGlmIChmYWlsZWRNYXBwaW5nTmFtZXMuaW5kZXhPZihuYW1lWydpZCddKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgaGFzbid0IGZhaWxlZCBtYXBwaW5nIChhdCBsZWFzdCBub3QgeWV0KVxuICAgICAgICAgICAgICAgICAgICB1bm1hcHBlZE5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHVubWFwcGVkTmFtZTtcbn1cblxuLyogVE5SUyByZXF1ZXN0cyBhcmUgc2VudCB2aWEgUE9TVCBhbmQgY2Fubm90IGJlIGNhY2hlZCBieSB0aGUgYnJvd3Nlci4gS2VlcFxuICogdHJhY2sgb2YgcmVzcG9uc2VzIGluIGEgc2ltcGxlIGxvY2FsIGNhY2hlLCB0byBhdm9pZCBleHRyYSByZXF1ZXN0cyBmb3JcbiAqIGlkZW50aWNhbCB0YXhvbiBuYW1lcy4gKFRoaXMgaXMgY29tbW9uIHdoZW4gbWFueSBzaW1pbGFyIGxhYmVscyBoYXZlIGJlZW5cbiAqIFwibW9kaWZpZWQgZm9yIG1hcHBpbmdcIikuXG4gKlxuICogV2UnbGwgdXNlIGEgRklGTyBzdHJhdGVneSB0byBrZWVwIHRoaXMgdG8gYSByZWFzb25hYmxlIHNpemUuIEkgYmVsaWV2ZSB0aGlzXG4gKiB3aWxsIGhhbmRsZSB0aGUgZXhwZWN0ZWQgY2FzZSBvZiBtYW55IGxhYmVscyBiZWluZyBtb2RpZmllZCB0byB0aGUgc2FtZVxuICogc3RyaW5nLlxuICovXG52YXIgVE5SU0NhY2hlU2l6ZSA9IDIwMDtcbnZhciBUTlJTQ2FjaGUgPSB7fTtcbnZhciBUTlJTQ2FjaGVLZXlzID0gW107XG5mdW5jdGlvbiBhZGRUb1ROUlNDYWNoZSgga2V5LCB2YWx1ZSApIHtcbiAgICAvLyBhZGQgKG9yIHVwZGF0ZSkgdGhlIGNhY2hlIGZvciB0aGlzIGtleVxuICAgIGlmICghKGtleSBpbiBUTlJTQ2FjaGUpKSB7XG4gICAgICAgIFROUlNDYWNoZUtleXMucHVzaCgga2V5ICk7XG4gICAgfVxuICAgIFROUlNDYWNoZVsga2V5IF0gPSB2YWx1ZTtcbiAgICBpZiAoVE5SU0NhY2hlS2V5cy5sZW5ndGggPiBUTlJTQ2FjaGVTaXplKSB7XG4gICAgICAgIC8vIGNsZWFyIHRoZSBvbGRlc3QgY2FjaGVkIGl0ZW1cbiAgICAgICAgdmFyIGRvb21lZEtleSA9IFROUlNDYWNoZUtleXMuc2hpZnQoKTtcbiAgICAgICAgZGVsZXRlIFROUlNDYWNoZVsgZG9vbWVkS2V5IF07XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFROUlNDYWNoZSk7XG59XG5mdW5jdGlvbiBjbGVhclROUlNDYWNoZSgpIHtcbiAgICBUTlJTQ2FjaGUgPSB7fTtcbn07XG5cbmZ1bmN0aW9uIHJlcXVlc3RUYXhvbk1hcHBpbmcoIG5hbWVUb01hcCApIHtcbiAgICAvLyBzZXQgc3Bpbm5lciwgbWFrZSByZXF1ZXN0LCBoYW5kbGUgcmVzcG9uc2UsIGFuZCBkYWlzeS1jaGFpbiB0aGUgbmV4dCByZXF1ZXN0XG4gICAgLy8gVE9ETzogc2VuZCBvbmUgYXQgYSB0aW1lPyBvciBpbiBhIGJhdGNoICg1IGl0ZW1zKT9cblxuICAgIC8vIE5PVEUgdGhhdCB3ZSBtaWdodCBiZSByZXF1ZXN0aW5nIGEgc2luZ2xlIG5hbWUsIGVsc2UgZmluZCB0aGUgbmV4dCB1bm1hcHBlZCBvbmVcbiAgICB2YXIgc2luZ2xlVGF4b25NYXBwaW5nO1xuICAgIGlmIChuYW1lVG9NYXApIHtcbiAgICAgICAgc2luZ2xlVGF4b25NYXBwaW5nID0gdHJ1ZTtcbiAgICAgICAgZmFpbGVkTWFwcGluZ05hbWVzLnJlbW92ZShuYW1lVG9NYXBbJ2lkJ10gKTtcbiAgICAgICAgYXV0b01hcHBpbmdJblByb2dyZXNzKCB0cnVlICk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2luZ2xlVGF4b25NYXBwaW5nID0gZmFsc2U7XG4gICAgICAgIG5hbWVUb01hcCA9IGdldE5leHRVbm1hcHBlZE5hbWUoKTtcbiAgICB9XG4gICAgaWYgKCFuYW1lVG9NYXApIHtcbiAgICAgICAgc3RvcEF1dG9NYXBwaW5nKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB1cGRhdGVNYXBwaW5nU3RhdHVzKCk7XG4gICAgdmFyIG5hbWVJRCA9IG5hbWVUb01hcFsnaWQnXTtcbiAgICB2YXIgb3JpZ2luYWxMYWJlbCA9ICQudHJpbShuYW1lVG9NYXBbJ29yaWdpbmFsTGFiZWwnXSkgfHwgbnVsbDtcbiAgICAvLyB1c2UgdGhlIG1hbnVhbGx5IGVkaXRlZCBsYWJlbCAoaWYgYW55KSwgb3IgdGhlIGhpbnQtYWRqdXN0ZWQgdmVyc2lvblxuICAgIHZhciBlZGl0ZWRMYWJlbCA9ICQudHJpbShuYW1lVG9NYXBbJ2FkanVzdGVkTGFiZWwnXSk7XG4gICAgdmFyIHNlYXJjaFRleHQgPSAoZWRpdGVkTGFiZWwgIT09ICcnKSA/IGVkaXRlZExhYmVsIDogJC50cmltKGFkanVzdGVkTGFiZWwob3JpZ2luYWxMYWJlbCkpO1xuXG4gICAgaWYgKHNlYXJjaFRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTm8gbmFtZSB0byBtYXRjaCFcIik7IC8vIFRPRE9cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoc2VhcmNoVGV4dC5sZW5ndGggPCAyKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTmVlZCBhdCBsZWFzdCB0d28gbGV0dGVycyFcIik7IC8vIFRPRE9cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGdyb29tIHRyaW1tZWQgdGV4dCBiYXNlZCBvbiBvdXIgc2VhcmNoIHJ1bGVzXG4gICAgdmFyIHNlYXJjaENvbnRleHROYW1lID0gdmlld01vZGVsLm1hcHBpbmdIaW50cy5zZWFyY2hDb250ZXh0KCk7XG4gICAgdmFyIHVzaW5nRnV6enlNYXRjaGluZyA9IHZpZXdNb2RlbC5tYXBwaW5nSGludHMudXNlRnV6enlNYXRjaGluZygpIHx8IGZhbHNlO1xuICAgIHZhciBhdXRvQWNjZXB0aW5nRXhhY3RNYXRjaGVzID0gdmlld01vZGVsLm1hcHBpbmdIaW50cy5hdXRvQWNjZXB0RXhhY3RNYXRjaGVzKCkgfHwgZmFsc2U7XG4gICAgLy8gc2hvdyBzcGlubmVyIGFsb25nc2lkZSB0aGlzIGl0ZW0uLi5cbiAgICBjdXJyZW50bHlNYXBwaW5nTmFtZXMucHVzaCggbmFtZUlEICk7XG5cbiAgICB2YXIgbWFwcGluZ1N0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG5cbiAgICBmdW5jdGlvbiB0bnJzU3VjY2VzcyhkYXRhKSB7XG4gICAgICAgIC8vIElGIHRoZXJlJ3MgYSBwcm9wZXIgcmVzcG9uc2UsIGFzc2VydCB0aGlzIGFzIHRoZSBuYW1lIGFuZCBsYWJlbCBmb3IgdGhpcyBub2RlXG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSByb2xsaW5nIGF2ZXJhZ2UgZm9yIHRoZSBtYXBwaW5nLXNwZWVkIGJhclxuICAgICAgICB2YXIgbWFwcGluZ1N0b3BUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgdXBkYXRlTWFwcGluZ1NwZWVkKCBtYXBwaW5nU3RvcFRpbWUuZ2V0VGltZSgpIC0gbWFwcGluZ1N0YXJ0VGltZS5nZXRUaW1lKCkgKTtcblxuICAgICAgICB2YXIgbWF4UmVzdWx0cyA9IDEwMDtcbiAgICAgICAgdmFyIHZpc2libGVSZXN1bHRzID0gMDtcbiAgICAgICAgdmFyIHJlc3VsdFNldHNGb3VuZCA9IChkYXRhICYmICgncmVzdWx0cycgaW4gZGF0YSkgJiYgKGRhdGEucmVzdWx0cy5sZW5ndGggPiAwKSk7XG4gICAgICAgIHZhciBjYW5kaWRhdGVNYXRjaGVzID0gWyBdO1xuICAgICAgICAvLyBGb3Igbm93LCB3ZSB3YW50IHRvIGF1dG8tYXBwbHkgaWYgdGhlcmUncyBleGFjdGx5IG9uZSBtYXRjaFxuICAgICAgICBpZiAocmVzdWx0U2V0c0ZvdW5kKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGRhdGEucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTk8gU0VBUkNIIFJFU1VMVCBTRVRTIEZPVU5EIScpO1xuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVNYXRjaGVzID0gWyBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGV4cGVjdGVkIGNhc2VcbiAgICAgICAgICAgICAgICAgICAgY2FuZGlkYXRlTWF0Y2hlcyA9IGRhdGEucmVzdWx0c1swXS5tYXRjaGVzIHx8IFsgXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ01VTFRJUExFIFNFQVJDSCBSRVNVTFQgU0VUUyAoVVNJTkcgRklSU1QpJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihkYXRhWydyZXN1bHRzJ10pO1xuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVNYXRjaGVzID0gZGF0YS5yZXN1bHRzWzBdLm1hdGNoZXMgfHwgWyBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFRPRE86IEZpbHRlciBjYW5kaWRhdGUgbWF0Y2hlcyBiYXNlZCBvbiB0aGVpciBwcm9wZXJ0aWVzLCBzY29yZXMsIGV0Yy4/XG5cbiAgICAgICAgc3dpdGNoIChjYW5kaWRhdGVNYXRjaGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgIGZhaWxlZE1hcHBpbmdOYW1lcy5wdXNoKCBuYW1lSUQgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgLyogU0tJUFBJTkcgVEhJUyB0byBwcm92aWRlIHVuaWZvcm0gdHJlYXRtZW50IG9mIGFsbCBtYXRjaGVzXG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgLy8gY2hvb3NlIHRoZSBmaXJzdCtvbmx5IG1hdGNoIGF1dG9tYXRpY2FsbHkhXG4gICAgICAgICAgICAgICAgLi4uXG4gICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAvLyBtdWx0aXBsZSBtYXRjaGVzIGZvdW5kLCBvZmZlciBhIGNob2ljZVxuICAgICAgICAgICAgICAgIC8vIEFTU1VNRVMgd2Ugb25seSBnZXQgb25lIHJlc3VsdCBzZXQsIHdpdGggbiBtYXRjaGVzXG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBTb3J0IG1hdGNoZXMgYmFzZWQgb24gZXhhY3QgdGV4dCBtYXRjaGVzPyBmcmFjdGlvbmFsIChtYXRjaGluZykgc2NvcmVzPyBzeW5vbnltcyBvciBob21vbnltcz9cbiAgICAgICAgICAgICAgICAvKiBpbml0aWFsIHNvcnQgb24gbG93ZXIgdGF4YSAod2lsbCBiZSBvdmVycmlkZGVuIGJ5IGV4YWN0IG1hdGNoZXMpXG4gICAgICAgICAgICAgICAgY2FuZGlkYXRlTWF0Y2hlcy5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYS5pc19hcHByb3hpbWF0ZV9tYXRjaCA9PT0gYi5pc19hcHByb3hpbWF0ZV9tYXRjaCkgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhLmlzX2FwcHJveGltYXRlX21hdGNoKSByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGIuaXNfYXBwcm94aW1hdGVfbWF0Y2gpIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAgICAgLyogVE9ETzogSWYgbXVsdGlwbGUgbWF0Y2hlcyBwb2ludCB0byBhIHNpbmdsZSB0YXhvbiwgc2hvdyBqdXN0IHRoZSBcImJlc3RcIiBtYXRjaFxuICAgICAgICAgICAgICAgICAqICAgLSBTcGVsbGluZyBjb3VudHMhIFNob3cgYW4gZXhhY3QgbWF0Y2ggKGUuZy4gc3lub255bSkgdnMuIGluZXhhY3Qgc3BlbGxpbmcuXG4gICAgICAgICAgICAgICAgICogICAtIFRPRE86IGFkZCBtb3JlIHJ1bGVzPyBvciBqdXN0IGNvbW1lbnQgdGhlIGNvZGUgYmVsb3dcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB2YXIgZ2V0UHJlZmVycmVkVGF4b25DYW5kaWRhdGUgPSBmdW5jdGlvbiggY2FuZGlkYXRlQSwgY2FuZGlkYXRlQiApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIHdoaWNoZXZlciBpcyBwcmVmZXJyZWQsIGJhc2VkIG9uIGEgZmV3IGNyaXRlcmlhOlxuICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2hBID0gY2FuZGlkYXRlQS5vcmlnaW5hbE1hdGNoO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2hCID0gY2FuZGlkYXRlQi5vcmlnaW5hbE1hdGNoO1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBvbmUgaXMgdGhlIGV4YWN0IG1hdGNoLCB0aGF0J3MgaWRlYWwgKGJ1dCB1bmxpa2VseSBzaW5jZSBcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIFROUlMgYXBwYXJlbnRseSByZXR1cm5lZCBtdWx0aXBsZSBjYW5kaWRhdGVzKS5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaEEuaXNfYXBwcm94aW1hdGVfbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGVBO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFtYXRjaEIuaXNfYXBwcm94aW1hdGVfbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYW5kaWRhdGVCO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3cgdGhlIG1vc3Qgc2ltaWxhciBuYW1lIChvciBzeW5vbnltKSBmb3IgdGhpcyB0YXhvbi5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoQS5zY29yZSA+IG1hdGNoQi5zY29yZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZUE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZUI7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgZ2V0UHJpb3JNYXRjaGluZ0NhbmRpZGF0ZSA9IGZ1bmN0aW9uKCBvdHRJZCwgcHJpb3JDYW5kaWRhdGVzICkge1xuICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gYW55IG1hdGNoIHdlJ3ZlIGFscmVhZHkgZXhhbWluZWQgZm9yIHRoaXMgdGF4b25cbiAgICAgICAgICAgICAgICAgICAgdmFyIHByaW9yTWF0Y2ggPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAkLmVhY2gocHJpb3JDYW5kaWRhdGVzLCBmdW5jdGlvbihpLCBjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYy5vdHRJZCA9PT0gb3R0SWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmlvck1hdGNoID0gYztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7ICAvLyB0aGVyZSBzaG91bGQgYmUganVzdCBvbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcmlvck1hdGNoO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdmFyIHJhd01hdGNoVG9DYW5kaWRhdGUgPSBmdW5jdGlvbiggcmF3LCBuYW1lSUQgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNpbXBsaWZ5IHRoZSBcInJhd1wiIG1hdGNoZXMgcmV0dXJuZWQgYnkgVE5SU1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcmF3LnRheG9uWyd1bmlxdWVfbmFtZSddIHx8IHJhdy50YXhvblsnbmFtZSddLCAgICAgICAvLyBtYXRjaGVkIG5hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIG90dElkOiByYXcudGF4b25bJ290dF9pZCddLCAgICAgLy8gbWF0Y2hlZCBPVFQgaWQgKGFzIG51bWJlciEpXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXhvbm9taWNTb3VyY2VzOiByYXcudGF4b25bJ3RheF9zb3VyY2VzJ10sICAgLy8gXCJ1cHN0cmVhbVwiIHRheG9ub21pZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vZXhhY3Q6IGZhbHNlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBib29sZWFuIChpZ25vcmluZyB0aGlzIGZvciBub3cpXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2hpZ2hlcjogZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYm9vbGVhblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVXNlIGZsYWdzIGZvciB0aGlzID8gaGlnaGVyOiAoJC5pbkFycmF5KCdTSUJMSU5HX0hJR0hFUicsIHJlc3VsdFRvTWFwLmZsYWdzKSA9PT0gLTEpID8gZmFsc2UgOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbE1hdGNoOiByYXcsXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lSUQ6IG5hbWVJRFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlTWFwcGluZ0xpc3QgPSBbIF07XG4gICAgICAgICAgICAgICAgJC5lYWNoKGNhbmRpZGF0ZU1hdGNoZXMsIGZ1bmN0aW9uKGksIG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnZlcnQgdG8gZXhwZWN0ZWQgc3RydWN0dXJlIGZvciBwcm9wb3NlZCBtYXBwaW5nc1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FuZGlkYXRlID0gcmF3TWF0Y2hUb0NhbmRpZGF0ZSggbWF0Y2gsIG5hbWVJRCApO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJpb3JUYXhvbkNhbmRpZGF0ZSA9IGdldFByaW9yTWF0Y2hpbmdDYW5kaWRhdGUoIGNhbmRpZGF0ZS5vdHRJZCwgY2FuZGlkYXRlTWFwcGluZ0xpc3QgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByaW9yVGF4b25DYW5kaWRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmlvclBvc2l0aW9uID0gJC5pbkFycmF5KHByaW9yVGF4b25DYW5kaWRhdGUsIGNhbmRpZGF0ZU1hcHBpbmdMaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmVmZXJyZWRDYW5kaWRhdGUgPSBnZXRQcmVmZXJyZWRUYXhvbkNhbmRpZGF0ZSggY2FuZGlkYXRlLCBwcmlvclRheG9uQ2FuZGlkYXRlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWx0ZXJuYXRlQ2FuZGlkYXRlID0gKHByZWZlcnJlZENhbmRpZGF0ZSA9PT0gY2FuZGlkYXRlKSA/IHByaW9yVGF4b25DYW5kaWRhdGUgOiBjYW5kaWRhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aGljaGV2ZXIgb25lIHdhcyBjaG9zZW4gd2lsbCAocmUpdGFrZSB0aGlzIHBsYWNlIGluIG91ciBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FuZGlkYXRlTWFwcGluZ0xpc3Quc3BsaWNlKHByaW9yUG9zaXRpb24sIDEsIHByZWZlcnJlZENhbmRpZGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgb3RoZXIgY2FuZGlkYXRlIHdpbGwgYmUgc3Rhc2hlZCBhcyBhIGNoaWxkLCBpbiBjYXNlIHdlIG5lZWQgaXQgbGF0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnYWx0ZXJuYXRlVGF4b25DYW5kaWRhdGVzJyBpbiBwcmVmZXJyZWRDYW5kaWRhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmZXJyZWRDYW5kaWRhdGUuYWx0ZXJuYXRlVGF4b25DYW5kaWRhdGVzLnB1c2goIGFsdGVybmF0ZUNhbmRpZGF0ZSApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVmZXJyZWRDYW5kaWRhdGUuYWx0ZXJuYXRlVGF4b25DYW5kaWRhdGVzID0gWyBhbHRlcm5hdGVDYW5kaWRhdGUgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbmRpZGF0ZU1hcHBpbmdMaXN0LnB1c2goY2FuZGlkYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdmFyIGF1dG9BY2NlcHRhYmxlTWFwcGluZyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGNhbmRpZGF0ZU1hcHBpbmdMaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb25seU1hcHBpbmcgPSBjYW5kaWRhdGVNYXBwaW5nTGlzdFswXTtcbiAgICAgICAgICAgICAgICAgICAgLyogTkIgLSBhdXRvLWFjY2VwdCBpbmNsdWRlcyBzeW5vbnltcyBpZiBleGFjdCBtYXRjaCFcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlNYXBwaW5nLm9yaWdpbmFsTWF0Y2guaXNfc3lub255bSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIC8qIE4uQi4gV2UgbmV2ZXIgcHJlc2VudCB0aGUgc29sZSBtYXBwaW5nIHN1Z2dlc3Rpb24gYXMgYVxuICAgICAgICAgICAgICAgICAgICAgKiB0YXhvbi1uYW1lIGhvbW9ueW0sIHNvIGp1c3QgY29uc2lkZXIgdGhlIG1hdGNoIHNjb3JlIHRvXG4gICAgICAgICAgICAgICAgICAgICAqIGRldGVybWluZSB3aGV0aGVyIGl0J3MgYW4gXCJleGFjdCBtYXRjaFwiLlxuICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9ubHlNYXBwaW5nLm9yaWdpbmFsTWF0Y2guc2NvcmUgPT09IDEuMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b0FjY2VwdGFibGVNYXBwaW5nID0gb25seU1hcHBpbmc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGF1dG9BY2NlcHRpbmdFeGFjdE1hdGNoZXMgJiYgYXV0b0FjY2VwdGFibGVNYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFjY2VwdCB0aGUgb2J2aW91cyBjaG9pY2UgKGFuZCBwb3NzaWJseSB1cGRhdGUgVUkpIGltbWVkaWF0ZWx5XG4gICAgICAgICAgICAgICAgICAgIG1hcE5hbWVUb1RheG9uKCBuYW1lSUQsIGF1dG9BY2NlcHRhYmxlTWFwcGluZywge1BPU1RQT05FX1VJX0NIQU5HRVM6IHRydWV9ICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcG9zdHBvbmUgYWN0dWFsIG1hcHBpbmcgdW50aWwgdXNlciBjaG9vc2VzXG4gICAgICAgICAgICAgICAgICAgIHByb3Bvc2VOYW1lTGFiZWwobmFtZUlELCBjYW5kaWRhdGVNYXBwaW5nTGlzdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY3VycmVudGx5TWFwcGluZ05hbWVzLnJlbW92ZSggbmFtZUlEICk7XG5cbiAgICAgICAgaWYgKHNpbmdsZVRheG9uTWFwcGluZykge1xuICAgICAgICAgICAgc3RvcEF1dG9NYXBwaW5nKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYXV0b01hcHBpbmdJblByb2dyZXNzKCkpIHtcbiAgICAgICAgICAgIC8vIGFmdGVyIGEgYnJpZWYgcGF1c2UsIHRyeSBmb3IgdGhlIG5leHQgYXZhaWxhYmxlIG5hbWUuLi5cbiAgICAgICAgICAgIHNldFRpbWVvdXQocmVxdWVzdFRheG9uTWFwcGluZywgMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBUTlJTUXVlcnlBbmRDYWNoZUtleSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgXCJuYW1lc1wiOiBbc2VhcmNoVGV4dF0sXG4gICAgICAgIFwiaW5jbHVkZV9zdXBwcmVzc2VkXCI6IGZhbHNlLFxuICAgICAgICBcImRvX2FwcHJveGltYXRlX21hdGNoaW5nXCI6IChzaW5nbGVUYXhvbk1hcHBpbmcgfHwgdXNpbmdGdXp6eU1hdGNoaW5nKSA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgXCJjb250ZXh0X25hbWVcIjogc2VhcmNoQ29udGV4dE5hbWVcbiAgICB9KTtcblxuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogZG9UTlJTRm9yTWFwcGluZ09UVXNfdXJsLCAgLy8gTk9URSB0aGF0IGFjdHVhbCBzZXJ2ZXItc2lkZSBtZXRob2QgbmFtZSBtaWdodCBiZSBxdWl0ZSBkaWZmZXJlbnQhXG4gICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgZGF0YTogVE5SU1F1ZXJ5QW5kQ2FjaGVLZXksICAvLyBkYXRhIChhc3RlcmlzayByZXF1aXJlZCBmb3IgY29tcGxldGlvbiBzdWdnZXN0aW9ucylcbiAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXG4gICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgICAgICAgYmVmb3JlU2VuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gY2hlY2sgb3VyIGxvY2FsIGNhY2hlIHRvIHNlZSBpZiB0aGlzIGlzIGEgcmVwZWF0XG4gICAgICAgICAgICB2YXIgY2FjaGVkUmVzcG9uc2UgPSBUTlJTQ2FjaGVbIFROUlNRdWVyeUFuZENhY2hlS2V5IF07XG4gICAgICAgICAgICBpZiAoY2FjaGVkUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB0bnJzU3VjY2VzcyggY2FjaGVkUmVzcG9uc2UgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIiEhISBzb21ldGhpbnkgd2VudCB0ZXJyaWJseSB3cm9uZ1wiKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGpxWEhSLnJlc3BvbnNlVGV4dCk7XG5cbiAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UoXCJTb21ldGhpbmcgd2VudCB3cm9uZyBpbiB0YXhvbWFjaGluZTpcXG5cIisganFYSFIucmVzcG9uc2VUZXh0KTtcblxuICAgICAgICAgICAgaWYgKCFhdXRvTWFwcGluZ0luUHJvZ3Jlc3MoKSkge1xuICAgICAgICAgICAgICAgIC8vIGN1cmF0b3IgaGFzIHBhdXNlZCBhbGwgbWFwcGluZ1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VycmVudGx5TWFwcGluZ05hbWVzLnJlbW92ZSggbmFtZUlEICk7XG5cbiAgICAgICAgICAgIC8vIGxldCdzIGhvcGUgaXQncyBzb21ldGhpbmcgYWJvdXQgdGhpcyBsYWJlbCBhbmQgdHJ5IHRoZSBuZXh0IG9uZS4uLlxuICAgICAgICAgICAgZmFpbGVkTWFwcGluZ05hbWVzLnB1c2goIG5hbWVJRCApO1xuICAgICAgICAgICAgaWYgKHNpbmdsZVRheG9uTWFwcGluZykge1xuICAgICAgICAgICAgICAgIHN0b3BBdXRvTWFwcGluZygpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhdXRvTWFwcGluZ0luUHJvZ3Jlc3MoKSkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQocmVxdWVzdFRheG9uTWFwcGluZywgMTAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9LFxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAvLyBhZGQgdGhpcyByZXNwb25zZSB0byB0aGUgbG9jYWwgY2FjaGVcbiAgICAgICAgICAgIGFkZFRvVE5SU0NhY2hlKCBUTlJTUXVlcnlBbmRDYWNoZUtleSwgZGF0YSApO1xuICAgICAgICAgICAgdG5yc1N1Y2Nlc3MoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZUJ5SUQoaWQpIHtcbiAgICAvLyByZXR1cm4gdGhlIG1hdGNoaW5nIG90dSwgb3IgbnVsbCBpZiBub3QgZm91bmRcbiAgICB2YXIgbWF0Y2hpbmdOYW1lID0gbnVsbDtcbiAgICAkLmVhY2goIHZpZXdNb2RlbC5uYW1lcygpLCBmdW5jdGlvbihpLCBuYW1lKSB7XG4gICAgICAgIGlmIChuYW1lLmlkID09PSBpZCkgeyAgXG4gICAgICAgICAgICBtYXRjaGluZ05hbWUgPSBuYW1lO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG1hdGNoaW5nTmFtZTtcbiAgICAvKiBUT0RPOiBpZiBwZXJmb3JtYW5jZSBzdWZmZXJzLCB1c2UgZmFzdCBsb29rdXAhXG4gICAgdmFyIGxvb2t1cCA9IGdldEZhc3RMb29rdXAoJ05BTUVTX0JZX0lEJyk7XG4gICAgcmV0dXJuIGxvb2t1cFsgaWQgXSB8fCBudWxsO1xuICAgICovXG59XG5cblxuZnVuY3Rpb24gbWFwTmFtZVRvVGF4b24oIG5hbWVJRCwgbWFwcGluZ0luZm8sIG9wdGlvbnMgKSB7XG4gICAgLyogQXBwbHkgdGhpcyBtYXBwaW5nLCBjcmVhdGluZyBOZXhzb24gZWxlbWVudHMgYXMgbmVlZGVkXG4gICAgICpcbiAgICAgKiBtYXBwaW5nSW5mbyBzaG91bGQgYmUgYW4gb2JqZWN0IHdpdGggdGhlc2UgcHJvcGVydGllczpcbiAgICAgKiB7XG4gICAgICogICBcIm5hbWVcIiA6IFwiQ2VudHJhbnRodXNcIixcbiAgICAgKiAgIFwib3R0SWRcIiA6IFwiNzU5MDQ2XCIsXG4gICAgICpcbiAgICAgKiAgIC8vIHRoZXNlIG1heSBhbHNvIGJlIHByZXNlbnQsIGJ1dCBhcmVuJ3QgaW1wb3J0YW50IGhlcmVcbiAgICAgKiAgICAgXCJleGFjdFwiIDogZmFsc2UsXG4gICAgICogICAgIFwiaGlnaGVyXCIgOiB0cnVlXG4gICAgICogfVxuICAgICAqXG4gICAgICogTi5CLiBXZSAqYWx3YXlzKiBhZGQvY2hhbmdlL3JlbW92ZSB0aGVzZSBwcm9wZXJ0aWVzIGluIHRhbmRlbSFcbiAgICAgKiAgICBvdHRJZFxuICAgICAqICAgIG90dFRheG9uTmFtZVxuICAgICAqICAgIHRheG9ub21pY1NvdXJjZXNcbiAgICAgKi9cblxuICAgIC8vIElmIG9wdGlvbnMuUE9TVFBPTkVfVUlfQ0hBTkdFUywgcGxlYXNlIGRvIHNvIChlbHNlIHdlIGNyYXdsIHdoZW5cbiAgICAvLyBhcHByb3ZpbmcgaHVuZHJlZHMgb2YgbWFwcGluZ3MpXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAvLyBGT1IgTk9XLCBhc3N1bWUgdGhhdCBhbnkgbGVhZiBub2RlIHdpbGwgaGF2ZSBhIGNvcnJlc3BvbmRpbmcgb3R1IGVudHJ5O1xuICAgIC8vIG90aGVyd2lzZSwgd2UgY2FuJ3QgaGF2ZSBuYW1lIGZvciB0aGUgbm9kZSFcbiAgICB2YXIgbmFtZSA9IGdldE5hbWVCeUlEKCBuYW1lSUQgKTtcblxuICAgIC8vIERlLXNlbGVjdCB0aGlzIG5hbWUgaW4gdGhlIG1hcHBpbmcgVUlcbiAgICBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddID0gZmFsc2U7XG5cbiAgICAvLyBhZGQgKG9yIHVwZGF0ZSkgYSBtZXRhdGFnIG1hcHBpbmcgdGhpcyB0byBhbiBPVFQgaWRcbiAgICBuYW1lWydvdHRJZCddID0gTnVtYmVyKG1hcHBpbmdJbmZvLm90dElkKTtcblxuICAgIC8vIEFkZC91cGRhdGUgdGhlIE9UVCBuYW1lIChjYWNoZWQgaGVyZSBmb3IgcGVyZm9ybWFuY2UpXG4gICAgbmFtZVsnb3R0VGF4b25OYW1lJ10gPSBtYXBwaW5nSW5mby5uYW1lIHx8ICdPVFQgTkFNRSBNSVNTSU5HISc7XG4gICAgLy8gTi5CLiBXZSBhbHdheXMgcHJlc2VydmUgb3JpZ2luYWxMYWJlbCBmb3IgcmVmZXJlbmNlXG5cbiAgICAvLyBhZGQgXCJ1cHN0cmVhbVwiIHRheG9ub21pYyBzb3VyY2VzXG4gICAgbmFtZVsndGF4b25vbWljU291cmNlcyddID0gbWFwcGluZ0luZm8udGF4b25vbWljU291cmNlcyB8fCAnVEFYT05PTUlDIFNPVVJDRVMgTUlTU0lORyEnO1xuXG4gICAgLy8gQ2xlYXIgYW55IHByb3Bvc2VkL2FkanVzdGVkIGxhYmVsICh0aGlzIGlzIHRydW1wZWQgYnkgbWFwcGluZyB0byBPVFQpXG4gICAgZGVsZXRlIG5hbWVbJ2FkanVzdGVkTGFiZWwnXTtcblxuICAgIGlmICghb3B0aW9ucy5QT1NUUE9ORV9VSV9DSEFOR0VTKSB7XG4gICAgICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB1bm1hcE5hbWVGcm9tVGF4b24oIG5hbWVPcklELCBvcHRpb25zICkge1xuICAgIC8vIHJlbW92ZSB0aGlzIG1hcHBpbmcsIHJlbW92aW5nIGFueSB1bm5lZWRlZCBOZXhzb24gZWxlbWVudHNcblxuICAgIC8vIElmIG9wdGlvbnMuUE9TVFBPTkVfVUlfQ0hBTkdFUywgcGxlYXNlIGRvIHNvIChlbHNlIHdlIGNyYXdsIHdoZW5cbiAgICAvLyBjbGVhcmluZyBodW5kcmVkcyBvZiBtYXBwaW5ncylcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgIHZhciBuYW1lID0gKHR5cGVvZiBuYW1lT3JJRCA9PT0gJ29iamVjdCcpID8gbmFtZU9ySUQgOiBnZXROYW1lQnlJRCggbmFtZU9ySUQgKTtcbiAgICAvLyByZXN0b3JlIGl0cyBvcmlnaW5hbCBsYWJlbCAodmVyc3VzIG1hcHBlZCBsYWJlbClcbiAgICB2YXIgb3JpZ2luYWxMYWJlbCA9IG5hbWVbJ29yaWdpbmFsTGFiZWwnXTtcblxuICAgIC8vIHN0cmlwIGFueSBtZXRhdGFnIG1hcHBpbmcgdGhpcyB0byBhbiBPVFQgaWRcbiAgICBpZiAoJ290dElkJyBpbiBuYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBuYW1lWydvdHRJZCddO1xuICAgIH1cbiAgICBpZiAoJ290dFRheG9uTmFtZScgaW4gbmFtZSkge1xuICAgICAgICBkZWxldGUgbmFtZVsnb3R0VGF4b25OYW1lJ107XG4gICAgfVxuICAgIGlmICgndGF4b25vbWljU291cmNlcycgaW4gbmFtZSkge1xuICAgICAgICBkZWxldGUgbmFtZVsndGF4b25vbWljU291cmNlcyddO1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy5QT1NUUE9ORV9VSV9DSEFOR0VTKSB7XG4gICAgICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG4gICAgICAgIG51ZGdlVGlja2xlcignVklTSUJMRV9OQU1FX01BUFBJTkdTJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhZGRNZXRhVGFnVG9QYXJlbnQoIHBhcmVudCwgcHJvcHMgKSB7XG4gICAgLy8gd3JhcCBzdWJtaXR0ZWQgcHJvcGVydGllcyB0byBtYWtlIGFuIG9ic2VydmFibGUgbWV0YXRhZ1xuICAgIHZhciBuZXdUYWcgPSBjbG9uZUZyb21TaW1wbGVPYmplY3QoIHByb3BzICk7XG4gICAgaWYgKCFwYXJlbnQubWV0YSkge1xuICAgICAgICAvLyBhZGQgYSBtZXRhIGNvbGxlY3Rpb24gaGVyZVxuICAgICAgICBwYXJlbnRbJ21ldGEnXSA9IFsgXTtcbiAgICB9IGVsc2UgaWYgKCEkLmlzQXJyYXkocGFyZW50Lm1ldGEpKSB7XG4gICAgICAgIC8vIGNvbnZlcnQgYSBCYWRnZXJmaXNoIFwic2luZ2xldG9uXCIgdG8gYSBwcm9wZXIgYXJyYXlcbiAgICAgICAgcGFyZW50WydtZXRhJ10gPSBbIHBhcmVudC5tZXRhIF07XG4gICAgfVxuICAgIHBhcmVudC5tZXRhLnB1c2goIG5ld1RhZyApO1xufVxuXG5cbmZ1bmN0aW9uIGNsZWFyU2VsZWN0ZWRNYXBwaW5ncygpIHtcbiAgICAvLyBURU1QT1JBUlkgaGVscGVyIHRvIGRlbW8gbWFwcGluZyB0b29scywgY2xlYXJzIG1hcHBpbmcgZm9yIHRoZSB2aXNpYmxlIChwYWdlZCkgbmFtZXMuXG4gICAgdmFyIHZpc2libGVOYW1lcyA9IHZpZXdNb2RlbC5maWx0ZXJlZE5hbWVzKCkucGFnZWRJdGVtcygpO1xuICAgICQuZWFjaCggdmlzaWJsZU5hbWVzLCBmdW5jdGlvbiAoaSwgbmFtZSkge1xuICAgICAgICBpZiAobmFtZVsnc2VsZWN0ZWRGb3JBY3Rpb24nXSkge1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IFwiZXN0YWJsaXNoZWRcIiBtYXBwaW5nIChhbHJlYWR5IGFwcHJvdmVkKVxuICAgICAgICAgICAgdW5tYXBOYW1lRnJvbVRheG9uKCBuYW1lLCB7UE9TVFBPTkVfVUlfQ0hBTkdFUzogdHJ1ZX0gKTtcbiAgICAgICAgICAgIC8vIGNsZWFyIGFueSBwcm9wb3NlZCBtYXBwaW5nXG4gICAgICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZVsnaWQnXSBdO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgY2xlYXJGYWlsZWROYW1lTGlzdCgpO1xuICAgIHByb3Bvc2VkTmFtZU1hcHBpbmdzLnZhbHVlSGFzTXV0YXRlZCgpO1xuICAgIG51ZGdlVGlja2xlcignTkFNRV9NQVBQSU5HX0hJTlRTJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNsZWFyQWxsTWFwcGluZ3MoKSB7XG4gICAgdmFyIGFsbE5hbWVzID0gdmlld01vZGVsLm5hbWVzKCk7XG4gICAgaWYgKGF3YWl0IGFzeW5jQ29uZmlybShcIldBUk5JTkc6IFRoaXMgd2lsbCB1bi1tYXAgYWxsIFwiKyBhbGxOYW1lcy5sZW5ndGggK1wiIG5hbWVzIGluIHRoZSBjdXJyZW50IHN0dWR5ISBBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZG8gdGhpcz9cIikpIHtcbiAgICAgICAgLy8gVEVNUE9SQVJZIGhlbHBlciB0byBkZW1vIG1hcHBpbmcgdG9vbHMsIGNsZWFycyBtYXBwaW5nIGZvciB0aGUgdmlzaWJsZSAocGFnZWQpIG5hbWVzLlxuICAgICAgICAkLmVhY2goIGFsbE5hbWVzLCBmdW5jdGlvbiAoaSwgbmFtZSkge1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IFwiZXN0YWJsaXNoZWRcIiBtYXBwaW5nIChhbHJlYWR5IGFwcHJvdmVkKVxuICAgICAgICAgICAgdW5tYXBOYW1lRnJvbVRheG9uKCBuYW1lLCB7UE9TVFBPTkVfVUlfQ0hBTkdFUzogdHJ1ZX0gKTtcbiAgICAgICAgICAgIC8vIGNsZWFyIGFueSBwcm9wb3NlZCBtYXBwaW5nXG4gICAgICAgICAgICBkZWxldGUgcHJvcG9zZWROYW1lTWFwcGluZ3MoKVsgbmFtZVsnaWQnXSBdO1xuICAgICAgICB9KTtcbiAgICAgICAgY2xlYXJGYWlsZWROYW1lTGlzdCgpO1xuICAgICAgICBwcm9wb3NlZE5hbWVNYXBwaW5ncy52YWx1ZUhhc011dGF0ZWQoKTtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICB9XG59XG5cbi8qIEVORCBjb252ZXJ0ICdPVFUnIHRvICduYW1lJyB0aHJvdWdob3V0PyAqL1xuXG5cblxuXG5cblxuXG5cblxuXG4vKiBEZWZpbmUgYSByZWdpc3RyeSBvZiBudWRnZSBtZXRob2RzLCBmb3IgdXNlIGluIEtPIGRhdGEgYmluZGluZ3MuIENhbGxpbmdcbiAqIGEgbnVkZ2UgZnVuY3Rpb24gd2lsbCB1cGRhdGUgb25lIG9yIG1vcmUgb2JzZXJ2YWJsZXMgdG8gdHJpZ2dlciB1cGRhdGVzXG4gKiBpbiB0aGUgY3VyYXRpb24gVUkuIFRoaXMgYXBwcm9hY2ggYWxsb3dzIHVzIHRvIHdvcmsgd2l0aG91dCBvYnNlcnZhYmxlcyxcbiAqIHdoaWNoIGluIHR1cm4gbWVhbnMgd2UgY2FuIGVkaXQgZW5vcm1vdXMgdmlld21vZGVscy5cbiAqL1xudmFyIG51ZGdlID0ge1xuICAgICdNRVRBREFUQSc6IGZ1bmN0aW9uKCBkYXRhLCBldmVudCApIHtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCAnTUVUQURBVEEnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAnVklTSUJMRV9OQU1FX01BUFBJTkdTJzogZnVuY3Rpb24oIGRhdGEsIGV2ZW50ICkge1xuICAgICAgICBudWRnZVRpY2tsZXIoICdWSVNJQkxFX05BTUVfTUFQUElOR1MnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAnTkFNRV9NQVBQSU5HX0hJTlRTJzogZnVuY3Rpb24oIGRhdGEsIGV2ZW50ICkge1xuICAgICAgICBudWRnZVRpY2tsZXIoICdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAnSU5QVVRfRklMRVMnOiBmdW5jdGlvbiggZGF0YSwgZXZlbnQgKSB7XG4gICAgICAgIG51ZGdlVGlja2xlciggJ0lOUFVUX0ZJTEVTJyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyBUT0RPOiBBZGQgbW9yZSBmb3IgYW55IHRpY2tsZXJzIGFkZGVkIGJlbG93XG59XG5mdW5jdGlvbiBudWRnZVRpY2tsZXIoIG5hbWUgKSB7XG4gICAgaWYgKG5hbWUgPT09ICdBTEwnKSB7XG4gICAgICAgIGZvciAodmFyIGFOYW1lIGluIHZpZXdNb2RlbC50aWNrbGVycykge1xuICAgICAgICAgICAgbnVkZ2VUaWNrbGVyKCBhTmFtZSApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgdGlja2xlciA9IHZpZXdNb2RlbC50aWNrbGVyc1sgbmFtZSBdO1xuICAgIGlmICghdGlja2xlcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiTm8gc3VjaCB0aWNrbGVyOiAnXCIrIG5hbWUgK1wiJyFcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG9sZFZhbHVlID0gdGlja2xlci5wZWVrKCk7XG4gICAgdGlja2xlciggb2xkVmFsdWUgKyAxICk7XG5cbiAgICAvLyBpZiB0aGlzIHJlZmxlY3RzIGNoYW5nZXMgdG8gdGhlIHN0dWR5LCBudWRnZSB0aGUgbWFpbiAnZGlydHkgZmxhZycgdGlja2xlclxuICAgIGlmIChuYW1lICE9PSAnQ09MTEVDVElPTlNfTElTVCcpIHtcbiAgICAgICAgdmlld01vZGVsLnRpY2tsZXJzLk5BTUVTRVRfSEFTX0NIQU5HRUQoIHZpZXdNb2RlbC50aWNrbGVycy5OQU1FU0VUX0hBU19DSEFOR0VELnBlZWsoKSArIDEgKTtcbiAgICAgICAgY29uc29sZS53YXJuKCdOQU1FU0VUX0hBU19DSEFOR0VEJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG93TmFtZXNldE1ldGFkYXRhKCkge1xuICAgICQoJyNuYW1lc2V0LW1ldGFkYXRhLXByb21wdCcpLmhpZGUoKTtcbiAgICAkKCcjbmFtZXNldC1tZXRhZGF0YS1wYW5lbCcpLnNob3coKTtcbn1cbmZ1bmN0aW9uIGhpZGVOYW1lc2V0TWV0YWRhdGEoKSB7XG4gICAgJCgnI25hbWVzZXQtbWV0YWRhdGEtcGFuZWwnKS5oaWRlKCk7XG4gICAgJCgnI25hbWVzZXQtbWV0YWRhdGEtcHJvbXB0Jykuc2hvdygpO1xufVxuXG5mdW5jdGlvbiBzaG93TWFwcGluZ09wdGlvbnMoKSB7XG4gICAgJCgnI21hcHBpbmctb3B0aW9ucy1wcm9tcHQnKS5oaWRlKCk7XG4gICAgJCgnI21hcHBpbmctb3B0aW9ucy1wYW5lbCcpLnNob3coKTtcbn1cbmZ1bmN0aW9uIGhpZGVNYXBwaW5nT3B0aW9ucygpIHtcbiAgICAkKCcjbWFwcGluZy1vcHRpb25zLXBhbmVsJykuaGlkZSgpO1xuICAgICQoJyNtYXBwaW5nLW9wdGlvbnMtcHJvbXB0Jykuc2hvdygpO1xufVxuXG5mdW5jdGlvbiBkaXNhYmxlU2F2ZUJ1dHRvbigpIHtcbiAgICB2YXIgJGJ0biA9ICQoJyNzYXZlLW5hbWVzZXQtYnV0dG9uJyk7XG4gICAgJGJ0bi5hZGRDbGFzcygnZGlzYWJsZWQnKTtcbiAgICAkYnRuLnVuYmluZCgnY2xpY2snKS5jbGljayhmdW5jdGlvbihldnQpIHtcbiAgICAgICAgc2hvd0luZm9NZXNzYWdlKCdUaGVyZSBhcmUgbm8gdW5zYXZlZCBjaGFuZ2VzLicpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBlbmFibGVTYXZlQnV0dG9uKCkge1xuICAgIHZhciAkYnRuID0gJCgnI3NhdmUtbmFtZXNldC1idXR0b24nKTtcbiAgICAkYnRuLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xuICAgICRidG4udW5iaW5kKCdjbGljaycpLmNsaWNrKGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICBpZiAoYnJvd3NlclN1cHBvcnRzRmlsZUFQSSgpKSB7XG4gICAgICAgICAgICBzaG93U2F2ZU5hbWVzZXRQb3B1cCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXN5bmNBbGVydChcIlNvcnJ5LCB0aGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBzYXZpbmcgdG8gYSBsb2NhbCBmaWxlIVwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNob3dMb2FkTGlzdFBvcHVwKCApIHtcbiAgICBzaG93RmlsZXN5c3RlbVBvcHVwKCcjbG9hZC1saXN0LXBvcHVwJyk7XG59XG5mdW5jdGlvbiBzaG93TG9hZE5hbWVzZXRQb3B1cCggKSB7XG4gICAgJCgnI2xvYWQtbmFtZXNldC1wb3B1cCcpLm9mZignaGlkZScpLm9uKCdoaWRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoY29udGV4dCA9PT0gJ1NUVURZX09UVV9NQVBQSU5HJykge1xuICAgICAgICAgICAgLy8gY2xlYXIgYW55IHByaW9yIHNlYXJjaCBpbnB1dFxuICAgICAgICAgICAgY2xlYXJOYW1lc2V0VXBsb2FkV2lkZ2V0KCk7XG4gICAgICAgICAgICBjbGVhck5hbWVzZXRQYXN0ZWRUZXh0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBzaG93RmlsZXN5c3RlbVBvcHVwKCcjbG9hZC1uYW1lc2V0LXBvcHVwJyk7XG59XG5mdW5jdGlvbiBzaG93U2F2ZU5hbWVzZXRQb3B1cCggKSB7XG4gICAgc2hvd0ZpbGVzeXN0ZW1Qb3B1cCgnI3NhdmUtbmFtZXNldC1wb3B1cCcpO1xufVxuZnVuY3Rpb24gc2hvd0ZpbGVzeXN0ZW1Qb3B1cCggcG9wdXBTZWxlY3RvciApIHtcbiAgICAvLyBleHBlY3RzIGEgdmFsaWQgalF1ZXJ5IHNlbGVjdG9yIGZvciB0aGUgcG9wdXAgaW4gRE9NXG4gICAgdmFyICRwb3B1cCA9ICQocG9wdXBTZWxlY3Rvcik7XG4gICAgJHBvcHVwLm1vZGFsKCdzaG93Jyk7XG5cbiAgICAvLyAocmUpYmluZCBVSSB3aXRoIEtub2Nrb3V0XG4gICAgdmFyICRib3VuZEVsZW1lbnRzID0gJHBvcHVwLmZpbmQoJy5tb2RhbC1ib2R5Jyk7IC8vIGFkZCBvdGhlciBlbGVtZW50cz9cbiAgICAkLmVhY2goJGJvdW5kRWxlbWVudHMsIGZ1bmN0aW9uKGksIGVsKSB7XG4gICAgICAgIGtvLmNsZWFuTm9kZShlbCk7XG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3Moe30sZWwpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRNYXBwZWROYW1lc1RhbGx5KCkge1xuICAgIC8vIHJldHVybiBkaXNwbGF5LXJlYWR5IHRhbGx5IChtYXBwZWQvdG90YWwgcmF0aW8gYW5kIHBlcmNlbnRhZ2UpXG4gICAgdmFyIHRoaW5TcGFjZSA9ICcmIzgyMDE7JztcbiAgICBpZiAoIXZpZXdNb2RlbCB8fCAhdmlld01vZGVsLm5hbWVzIHx8IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gJzxzdHJvbmc+MDwvc3Ryb25nPjxzcGFuPicrIHRoaW5TcGFjZSArJy8nKyB0aGluU3BhY2UgKyAnMCAmbmJzcDs8L3NwYW4+PHNwYW4gc3R5bGU9XCJjb2xvcjogIzk5OTtcIj4oMCUpPC9zcGFuPic7XG4gICAgfVxuICAgIHZhciB0b3RhbE5hbWVDb3VudCA9IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aDtcbiAgICB2YXIgbWFwcGVkTmFtZUNvdW50ID0gJC5ncmVwKHZpZXdNb2RlbC5uYW1lcygpLCBmdW5jdGlvbihuYW1lLCBpKSB7XG4gICAgICAgIHJldHVybiAoIW5hbWUub3R0SWQpID8gZmFsc2U6IHRydWU7XG4gICAgfSkubGVuZ3RoO1xuICAgIHJldHVybiAnPHN0cm9uZz4nKyBtYXBwZWROYW1lQ291bnQgKyc8L3N0cm9uZz48c3Bhbj4nKyB0aGluU3BhY2UgKycvJysgdGhpblNwYWNlICsgdG90YWxOYW1lQ291bnQgKycgJm5ic3A7PC9zcGFuPjxzcGFuIHN0eWxlPVwiY29sb3I6ICM5OTk7XCI+KCcrIGZsb2F0VG9QZXJjZW50KG1hcHBlZE5hbWVDb3VudCAvIHRvdGFsTmFtZUNvdW50KSArJyUpPC9zcGFuPic7XG59XG5mdW5jdGlvbiBtYXBwaW5nUHJvZ3Jlc3NBc1BlcmNlbnQoKSB7XG4gICAgaWYgKCF2aWV3TW9kZWwgfHwgIXZpZXdNb2RlbC5uYW1lcyB8fCB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciB0b3RhbE5hbWVDb3VudCA9IHZpZXdNb2RlbC5uYW1lcygpLmxlbmd0aDtcbiAgICB2YXIgbWFwcGVkTmFtZUNvdW50ID0gJC5ncmVwKCB2aWV3TW9kZWwubmFtZXMoKSwgZnVuY3Rpb24obmFtZSwgaSkge1xuICAgICAgICByZXR1cm4gKCFuYW1lLm90dElkKSA/IGZhbHNlOiB0cnVlO1xuICAgIH0pLmxlbmd0aDtcbiAgICByZXR1cm4gZmxvYXRUb1BlcmNlbnQobWFwcGVkTmFtZUNvdW50IC8gdG90YWxOYW1lQ291bnQpO1xufVxuZnVuY3Rpb24gZmxvYXRUb1BlcmNlbnQoIGRlYyApIHtcbiAgICAvLyBhc3N1bWVzIGEgZmxvYXQgYmV0d2VlbiAwLjAgYW5kIDEuMFxuICAgIC8vIEVYQU1QTEU6IDAuMjMyID09PiAyMyVcbiAgICByZXR1cm4gTWF0aC5yb3VuZChkZWMgKiAxMDApO1xufVxuXG5mdW5jdGlvbiBicm93c2VyU3VwcG9ydHNGaWxlQVBJKCkge1xuICAgIC8vIENhbiBsb2FkIGFuZCBtYW5pcHVsYXRlIGxvY2FsIGZpbGVzIGluIHRoaXMgYnJvd3Nlcj9cbiAgICByZXR1cm4gKHdpbmRvdy5GaWxlICYmIFxuICAgICAgICAgICAgd2luZG93LkZpbGVSZWFkZXIgJiYgXG4gICAgICAgICAgICB3aW5kb3cuRmlsZUxpc3QgJiYgXG4gICAgICAgICAgICB3aW5kb3cuQmxvYikgPyB0cnVlIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGFkZFN1YnN0aXR1dGlvbiggY2xpY2tlZCApIHtcbiAgICB2YXIgc3Vic3QgPSBrby5tYXBwaW5nLmZyb21KUyh7XG4gICAgICAgICdvbGQnOiBcIlwiLFxuICAgICAgICAnbmV3JzogXCJcIixcbiAgICAgICAgJ2FjdGl2ZSc6IHRydWUsXG4gICAgICAgICd2YWxpZCc6IHRydWVcbiAgICB9KTtcblxuICAgIGlmICgkKGNsaWNrZWQpLmlzKCdzZWxlY3QnKSkge1xuICAgICAgICB2YXIgY2hvc2VuU3ViID0gJChjbGlja2VkKS52YWwoKTtcbiAgICAgICAgaWYgKGNob3NlblN1YiA9PT0gJycpIHtcbiAgICAgICAgICAgIC8vIGRvIG5vdGhpbmcsIHdlJ3JlIHN0aWxsIGF0IHRoZSBwcm9tcHRcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBhZGQgdGhlIGNob3NlbiBzdWJzaXR1dGlvblxuICAgICAgICB2YXIgcGFydHMgPSBjaG9zZW5TdWIuc3BsaXQoJyA9Oj0gJyk7XG4gICAgICAgIHN1YnN0Lm9sZCggcGFydHNbMF0gfHwgJycgKTtcbiAgICAgICAgc3Vic3QubmV3KCBwYXJ0c1sxXSB8fCAnJyApO1xuICAgICAgICBzdWJzdC52YWxpZCh0cnVlKTtcbiAgICAgICAgc3Vic3QuYWN0aXZlKHRydWUpO1xuICAgICAgICAvLyByZXNldCB0aGUgU0VMRUNUIHdpZGdldCB0byBpdHMgcHJvbXB0XG4gICAgICAgICQoY2xpY2tlZCkudmFsKCcnKTtcbiAgICB9XG4gICAgdmlld01vZGVsLm1hcHBpbmdIaW50cy5zdWJzdGl0dXRpb25zLnB1c2goc3Vic3QpO1xuICAgIGNsZWFyRmFpbGVkTmFtZUxpc3QoKTtcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xufVxuZnVuY3Rpb24gcmVtb3ZlU3Vic3RpdHV0aW9uKCBkYXRhICkge1xuICAgIHZhciBzdWJMaXN0ID0gdmlld01vZGVsLm1hcHBpbmdIaW50cy5zdWJzdGl0dXRpb25zKCk7XG4gICAgcmVtb3ZlRnJvbUFycmF5KCBkYXRhLCBzdWJMaXN0ICk7XG4gICAgaWYgKHN1Ykxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIGFkZCBhbiBpbmFjdGl2ZSBzdWJzdGl0dXRpb24gd2l0aCBwcm9tcHRzXG4gICAgICAgIGFkZFN1YnN0aXR1dGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNsZWFyRmFpbGVkTmFtZUxpc3QoKTtcbiAgICAgICAgbnVkZ2VUaWNrbGVyKCdOQU1FX01BUFBJTkdfSElOVFMnKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVNYXBwaW5nSGludHMoIGRhdGEgKSB7XG4gICAgLy8gYWZ0ZXItZWZmZWN0cyBvZiBjaGFuZ2VzIHRvIHNlYXJjaCBjb250ZXh0IG9yIGFueSBzdWJzdGl0dXRpb25cbiAgICBjbGVhckZhaWxlZE5hbWVMaXN0KCk7XG4gICAgYWRqdXN0ZWRMYWJlbChcIlRFU1RcIik7ICAgLy8gdmFsaWRhdGUgYWxsIHN1YnN0aXR1dGlvbnNcbiAgICBudWRnZVRpY2tsZXIoJ05BTUVfTUFQUElOR19ISU5UUycpO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBnZXRBdHRyc0Zvck1hcHBpbmdPcHRpb24oIG9wdGlvbkRhdGEsIG51bU9wdGlvbnMgKSB7XG4gICAgdmFyIGF0dHJzID0ge1xuICAgICAgICAndGl0bGUnOiBwYXJzZUludChvcHRpb25EYXRhLm9yaWdpbmFsTWF0Y2guc2NvcmUgKiAxMDApICtcIiUgbWF0Y2ggb2Ygb3JpZ2luYWwgbGFiZWxcIixcbiAgICAgICAgJ2NsYXNzJzogXCJiYWRnZSBcIixcbiAgICAgICAgJ3N0eWxlJzogKFwib3BhY2l0eTogXCIrIG1hdGNoU2NvcmVUb09wYWNpdHkob3B0aW9uRGF0YS5vcmlnaW5hbE1hdGNoLnNjb3JlKSArXCI7XCIpXG4gICAgfVxuICAgIC8vIGZvciBub3csIHVzZSBzdGFuZGFyZCBjb2xvcnMgdGhhdCB3aWxsIHN0aWxsIHBvcCBmb3IgY29sb3ItYmxpbmQgdXNlcnNcbiAgICBpZiAob3B0aW9uRGF0YS5vcmlnaW5hbE1hdGNoLmlzX3N5bm9ueW0pIHtcbiAgICAgICAgYXR0cnMudGl0bGUgPSAoJ01hdGNoZWQgb24gc3lub255bSAnKyBvcHRpb25EYXRhLm9yaWdpbmFsTWF0Y2gubWF0Y2hlZF9uYW1lKTtcbiAgICAgICAgYXR0cnMuY2xhc3MgKz0gJyBiYWRnZS1pbmZvJztcbiAgICB9IGVsc2UgaWYgKChudW1PcHRpb25zID4gMSkgJiYgKG9wdGlvbkRhdGEub3JpZ2luYWxNYXRjaC5tYXRjaGVkX25hbWUgIT09IG9wdGlvbkRhdGEub3JpZ2luYWxNYXRjaC50YXhvbi51bmlxdWVfbmFtZSkpIHtcbiAgICAgICAgLy8gTGV0J3MgYXNzdW1lIGEgc2luZ2xlIHJlc3VsdCBpcyB0aGUgcmlnaHQgYW5zd2VyXG4gICAgICAgIGF0dHJzLnRpdGxlID0gKCdUYXhvbi1uYW1lIGhvbW9ueW0nKTtcbiAgICAgICAgYXR0cnMuY2xhc3MgKz0gJyBiYWRnZS13YXJuaW5nJztcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBrZWVwIGRlZmF1bHQgbGFiZWwgd2l0aCBtYXRjaGluZyBzY29yZVxuICAgICAgICBhdHRycy5jbGFzcyArPSAnIGJhZGdlLXN1Y2Nlc3MnO1xuICAgIH1cbiAgICAvLyBlYWNoIHNob3VsZCBhbHNvIGxpbmsgdG8gdGhlIHRheG9ub215IGJyb3dzZXJcbiAgICBhdHRycy5ocmVmID0gZ2V0VGF4b2Jyb3dzZXJVUkwob3B0aW9uRGF0YVsnb3R0SWQnXSk7XG4gICAgYXR0cnMudGFyZ2V0ID0gJ19ibGFuayc7XG4gICAgYXR0cnMudGl0bGUgKz0gJyAoY2xpY2sgZm9yIG1vcmUgaW5mb3JtYXRpb24pJ1xuICAgIHJldHVybiBhdHRycztcbn1cbmZ1bmN0aW9uIG1hdGNoU2NvcmVUb09wYWNpdHkoc2NvcmUpIHtcbiAgICAvKiBSZW1hcCBzY29yZXMgKGdlbmVyYWxseSBmcm9tIDAuNzUgdG8gMS4wLCBidXQgMC4xIGlzIHBvc3NpYmxlISkgdG8gYmUgbW9yZSB2aXNpYmxlXG4gICAgICogVGhpcyBpcyBiZXN0IGFjY29tcGxpc2hlZCBieSByZW1hcHBpbmcgdG8gYSBjdXJ2ZSwgZS5nLlxuICAgICAqICAgT1BBQ0lUWSA9IFNDT1JFXjIgKyAwLjE1XG4gICAgICogICBPUEFDSVRZID0gMC44ICogU0NPUkVeMiArIDAuMlxuICAgICAqICAgT1BBQ0lUWSA9IDAuOCAqIFNDT1JFICsgMC4yXG4gICAgICogVGhlIGVmZmVjdCB3ZSB3YW50IGlzIGZ1bGwgb3BhY2l0eSAoMS4wKSBmb3IgYSAxLjAgc2NvcmUsIGZhZGluZyByYXBpZGx5XG4gICAgICogZm9yIHRoZSBjb21tb24gKGhpZ2hlcikgc2NvcmVzLCB3aXRoIGEgZmxvb3Igb2YgfjAuMiBvcGFjaXR5IChlbm91Z2ggdG9cbiAgICAgKiBzaG93IGNvbG9yIGFuZCBtYWludGFpbiBsZWdpYmlsaXR5KS5cbiAgICAgKi9cbiAgICByZXR1cm4gKDAuOCAqIHNjb3JlKSArIDAuMjtcbn1cblxuLy8gc3VwcG9ydCBmb3IgYSBjb2xvci1jb2RlZCBcInNwZWVkb21ldGVyXCIgZm9yIHNlcnZlci1zaWRlIG1hcHBpbmcgKHNvbWUgYXMgSlMgZ2xvYmFscylcbnZhciByZWNlbnRNYXBwaW5nVGltZXMgPSBbIF07XG5yZWNlbnRNYXBwaW5nU3BlZWRMYWJlbCA9IGtvLm9ic2VydmFibGUoXCJcIik7IC8vIHNlY29uZHMgcGVyIG5hbWUsIGJhc2VkIG9uIHJvbGxpbmcgYXZlcmFnZVxucmVjZW50TWFwcGluZ1NwZWVkUGVyY2VudCA9IGtvLm9ic2VydmFibGUoMCk7IC8vIGFmZmVjdHMgY29sb3Igb2YgYmFyLCBldGNcbnJlY2VudE1hcHBpbmdTcGVlZEJhckNsYXNzID0ga28ub2JzZXJ2YWJsZSgncHJvZ3Jlc3MgcHJvZ3Jlc3MtaW5mbycpO1xuXG4vLyB0aGlzIHNob3VsZCBiZSBjbGVhcmVkIHdoZW5ldmVyIHNvbWV0aGluZyBjaGFuZ2VzIGluIG1hcHBpbmcgaGludHNcbmZ1bmN0aW9uIGNsZWFyRmFpbGVkTmFtZUxpc3QoKSB7XG4gICAgZmFpbGVkTWFwcGluZ05hbWVzLnJlbW92ZUFsbCgpO1xuICAgIC8vIG51ZGdlIHRvIHVwZGF0ZSBuYW1lIGxpc3QgaW1tZWRpYXRlbHlcbiAgICBib2d1c0VkaXRlZExhYmVsQ291bnRlciggYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXIoKSArIDEpO1xuICAgIG51ZGdlQXV0b01hcHBpbmcoKTtcbn1cbmZ1bmN0aW9uIG51ZGdlQXV0b01hcHBpbmcoKSB7XG4gICAgLy8gcmVzdGFydCBhdXRvLW1hcHBpbmcsIGlmIGVuYWJsZWRcbiAgICBpZiAoYXV0b01hcHBpbmdJblByb2dyZXNzKCkpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRseU1hcHBpbmdOYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIC8vIGxvb2tzIGxpa2Ugd2UgcmFuIG91dCBvZiBzdGVhbS4uIHRyeSBhZ2FpbiFcbiAgICAgICAgICAgIHJlcXVlc3RUYXhvbk1hcHBpbmcoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG5cblxuZnVuY3Rpb24gaW5mZXJTZWFyY2hDb250ZXh0RnJvbUF2YWlsYWJsZU5hbWVzKCkge1xuICAgIC8vIEZldGNoIHRoZSBsZWFzdCBpbmNsdXNpdmUgY29udGV4dCB2aWEgQUpBWCwgYW5kIHVwZGF0ZSB0aGUgZHJvcC1kb3duIG1lbnVcbiAgICB2YXIgbmFtZXNUb1N1Ym1pdCA9IFsgXTtcbiAgICB2YXIgbWF4TmFtZXNUb1N1Ym1pdCA9IDUwMDA7ICAvLyBpZiBtb3JlIHRoYW4gdGhpcywgZHJvcCBleHRyYSBuYW1lcyBldmVubHlcbiAgICBjb25zb2xlLmxvZyhcIj4+IGZvdW5kIFwiKyB2aWV3TW9kZWwubmFtZXMoKS5sZW5ndGggK1wiIG5hbWVzIGluIHRoZSBuYW1lc2V0XCIpO1xuICAgIHZhciBuYW1lc1RvU3VibWl0ID0gJC5tYXAodmlld01vZGVsLm5hbWVzKCksIGZ1bmN0aW9uKG5hbWUsIGluZGV4KSB7XG4gICAgICAgIHJldHVybiAoJ290dFRheG9uTmFtZScgaW4gbmFtZSkgPyBuYW1lWydvdHRUYXhvbk5hbWUnXSA6IG5hbWVbJ29yaWdpbmFsTGFiZWwnXTtcbiAgICB9KTtcbiAgICBpZiAobmFtZXNUb1N1Ym1pdC5sZW5ndGggPiBtYXhOYW1lc1RvU3VibWl0KSB7XG4gICAgICAgIC8vIHJlZHVjZSB0aGUgbGlzdCBpbiBhIGRpc3RyaWJ1dGVkIGZhc2hpb24gKGVnLCBldmVyeSBmb3VydGggaXRlbSlcbiAgICAgICAgdmFyIHN0ZXBTaXplID0gbWF4TmFtZXNUb1N1Ym1pdCAvIG5hbWVzVG9TdWJtaXQubGVuZ3RoO1xuICAgICAgICAvLy9jb25zb2xlLmxvZyhcIlRPTyBNQU5ZIE5BTUVTLCByZWR1Y2luZyB3aXRoIHN0ZXAtc2l6ZSBcIisgc3RlcFNpemUpO1xuICAgICAgICAvLyBjcmVlcCB0byB3aG9sZSBudW1iZXJzLCBrZWVwaW5nIGFuIGl0ZW0gZXZlcnkgdGltZSB3ZSBpbmNyZW1lbnQgYnkgb25lXG4gICAgICAgIHZhciBjdXJyZW50U3RlcFRvdGFsID0gMC4wO1xuICAgICAgICB2YXIgbmV4dFdob2xlTnVtYmVyID0gMTtcbiAgICAgICAgbmFtZXNUb1N1Ym1pdCA9IG5hbWVzVG9TdWJtaXQuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgICAgICBpZiAoKGN1cnJlbnRTdGVwVG90YWwgKz0gc3RlcFNpemUpID49IG5leHRXaG9sZU51bWJlcikge1xuICAgICAgICAgICAgICAgIG5leHRXaG9sZU51bWJlciArPSAxOyAvLyBidW1wIHRvIG5leHQgbnVtYmVyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhcIj4+IHN1Ym1pdHRpbmcgXCIrIG5hbWVzVG9TdWJtaXQubGVuZ3RoICtcIiBuYW1lcyBpbiB0aGUgbmFtZXNldFwiKTtcbiAgICBpZiAobmFtZXNUb1N1Ym1pdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuOyAvLyB0aGlzIGlzIGEgbm8tb3BcbiAgICB9XG5cbiAgICAvLy9zaG93TW9kYWxTY3JlZW4oXCJJbmZlcnJpbmcgc2VhcmNoIGNvbnRleHQuLi5cIiwge1NIT1dfQlVTWV9CQVI6dHJ1ZX0pO1xuXG4gICAgJC5hamF4KHtcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAvLyBjcm9zc2RvbWFpbjogdHJ1ZSxcbiAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICAgICAgICB1cmw6IGdldENvbnRleHRGb3JOYW1lc191cmwsXG4gICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSxcbiAgICAgICAgZGF0YTogKCd7XCJuYW1lc1wiOiAnKyBKU09OLnN0cmluZ2lmeShuYW1lc1RvU3VibWl0KSArJ30nKSxcbiAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uKCBqcVhIUiwgdGV4dFN0YXR1cyApIHtcbiAgICAgICAgICAgIC8vIHJlcG9ydCBlcnJvcnMgb3IgbWFsZm9ybWVkIGRhdGEsIGlmIGFueVxuICAgICAgICAgICAgaWYgKHRleHRTdGF0dXMgIT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UoJ1NvcnJ5LCB0aGVyZSB3YXMgYW4gZXJyb3IgaW5mZXJyaW5nIHRoZSBzZWFyY2ggY29udGV4dC4nKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVSUk9SOiB0ZXh0U3RhdHVzICE9PSAnc3VjY2VzcycsIGJ1dCBcIisgdGV4dFN0YXR1cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IEpTT04ucGFyc2UoIGpxWEhSLnJlc3BvbnNlVGV4dCApO1xuICAgICAgICAgICAgdmFyIGluZmVycmVkQ29udGV4dCA9IG51bGw7XG4gICAgICAgICAgICBpZiAocmVzdWx0ICYmICdjb250ZXh0X25hbWUnIGluIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGluZmVycmVkQ29udGV4dCA9IHJlc3VsdFsnY29udGV4dF9uYW1lJ107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLy9jb25zb2xlLmxvZyhcIj4+IGluZmVycmVkQ29udGV4dDogXCIrIGluZmVycmVkQ29udGV4dCk7XG4gICAgICAgICAgICBpZiAoaW5mZXJyZWRDb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIEJPVEggc2VhcmNoLWNvbnRleHQgZHJvcC1kb3duIG1lbnVzIHRvIHNob3cgdGhpcyByZXN1bHRcbiAgICAgICAgICAgICAgICAkKCdzZWxlY3RbbmFtZT10YXhvbi1zZWFyY2gtY29udGV4dF0nKS52YWwoaW5mZXJyZWRDb250ZXh0KTtcbiAgICAgICAgICAgICAgICAvLyBUd2VhayB0aGUgbW9kZWwncyBuYW1lIG1hcHBpbmcsIHRoZW4gcmVmcmVzaCB0aGUgVUlcbiAgICAgICAgICAgICAgICAvLyBOLkIuIFdlIGNoZWNrIGZpcnN0IHRvIGF2b2lkIGFkZGluZyBhbiB1bm5lY2Vzc2FyeSB1bnNhdmVkLWRhdGEgd2FybmluZyFcbiAgICAgICAgICAgICAgICBpZiAodmlld01vZGVsLm1hcHBpbmdIaW50cy5zZWFyY2hDb250ZXh0KCkgIT09IGluZmVycmVkQ29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZWwubWFwcGluZ0hpbnRzLnNlYXJjaENvbnRleHQoaW5mZXJyZWRDb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlTWFwcGluZ0hpbnRzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzaG93RXJyb3JNZXNzYWdlKCdTb3JyeSwgbm8gc2VhcmNoIGNvbnRleHQgd2FzIGluZmVycmVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8vIEtlZXAgYSBzYWZlIGNvcHkgb2Ygb3VyIFVJIG1hcmt1cCwgZm9yIHJlLXVzZSBhcyBhIEtub2Nrb3V0IHRlbXBsYXRlIChzZWUgYmVsb3cpXG52YXIgJHN0YXNoZWRFZGl0QXJlYSA9IG51bGw7XG5cbi8vIExvYWQgYSBuYW1lc2V0IGZyb20gSlMvSlNPTiBkYXRhICh1c3UuIGNhbGxlZCBieSBjb252ZW5pZW5jZSBmdW5jdGlvbnMgYmVsb3cpXG5mdW5jdGlvbiBsb2FkTmFtZXNldERhdGEoIGRhdGEsIGxvYWRlZEZpbGVOYW1lLCBsYXN0TW9kaWZpZWREYXRlICkge1xuICAgIC8qIFBhcnNlIHRoaXMgZGF0YSBhcyBgbmFtZXNldGAgKGEgc2ltcGxlIEpTIG9iamVjdCksIHRoZW4gY29udmVydCB0aGlzXG4gICAgICogaW50byBvdXIgcHJpbWFyeSB2aWV3IG1vZGVsIGZvciBLbm9ja291dEpTICAoYnkgY29udmVudGlvbiwgaXQncyB1c3VhbGx5XG4gICAgICogbmFtZWQgJ3ZpZXdNb2RlbCcpLlxuICAgICAqL1xuICAgIHZhciBuYW1lc2V0O1xuICAgIHN3aXRjaCh0eXBlb2YgZGF0YSkgeyBcbiAgICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIGl0J3MgbnVsbCwgb3IgdW5kZWZpbmVkPyBvciBzb21ldGhpbmcgZHVtYlxuICAgICAgICAgICAgICAgIG5hbWVzZXQgPSBnZXROZXdOYW1lc2V0TW9kZWwoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmFtZXNldCA9IGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAndW5kZWZpbmVkJzpcbiAgICAgICAgICAgIG5hbWVzZXQgPSBnZXROZXdOYW1lc2V0TW9kZWwoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBuYW1lc2V0ID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgIC8vIElGIHRoaXMgZmFpbHMsIHRyeSB0byBpbXBvcnQgVFNWL0NTViwgbGluZS1ieS1saW5lIHRleHRcbiAgICAgICAgICAgICAgICBuYW1lc2V0ID0gY29udmVydFRvTmFtZXNldE1vZGVsKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6IFxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuZXhwZWN0ZWQgdHlwZSBmb3IgbmFtZXNldCBkYXRhOiBcIisgKHR5cGVvZiBkYXRhKSk7XG4gICAgICAgICAgICBuYW1lc2V0ID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKiBcIk5vcm1hbGl6ZVwiIHRoZSBuYW1lc2V0IGJ5IGFkZGluZyBhbnkgbWlzc2luZyBwcm9wZXJ0aWVzIGFuZCBtZXRhZGF0YS5cbiAgICAgKiAoVGhpcyBpcyBtYWlubHkgdXNlZnVsIHdoZW4gbG9hZGluZyBhbiBvbGRlciBhcmNoaXZlZCBuYW1lc2V0LCB0b1xuICAgICAqIGNhdGNoIHVwIHdpdGggYW55IGNoYW5nZXMgdG8gdGhlIGV4cGVjdGVkIGRhdGEgbW9kZWwuKVxuICAgICAqL1xuICAgIGlmIChuYW1lc2V0Lm1ldGFkYXRhWydkYXRlX2NyZWF0ZWQnXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGNyZWF0aW9uIGRhdGUgaXMgbm90IGtub3dhYmxlOyBtYXRjaCBsYXN0LXNhdmVkIGRhdGUgZnJvbSBmaWxlXG4gICAgICAgIG5hbWVzZXQubWV0YWRhdGEuZGF0ZV9jcmVhdGVkID0gbGFzdE1vZGlmaWVkRGF0ZS50b0lTT1N0cmluZygpO1xuICAgIH1cbiAgICBpZiAobmFtZXNldC5tZXRhZGF0YVsnbGFzdF9zYXZlZCddID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gYXNzdW1lIGxhc3Qtc2F2ZWQgZGF0ZSBmcm9tIGZpbGUgaXMgY29ycmVjdFxuICAgICAgICBuYW1lc2V0Lm1ldGFkYXRhLmxhc3Rfc2F2ZWQgPSBsYXN0TW9kaWZpZWREYXRlLnRvSVNPU3RyaW5nKCk7XG4gICAgfVxuICAgIGlmIChuYW1lc2V0Lm1ldGFkYXRhWydzYXZlX2NvdW50J10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyB0cnVlIG51bWJlciBvZiBzYXZlcyBpcyBub3Qga25vd2FibGUsIGJ1dCB0aGVyZSdzIGJlZW4gYXQgbGVhc3Qgb25lIVxuICAgICAgICBuYW1lc2V0Lm1ldGFkYXRhLnNhdmVfY291bnQgPSAxO1xuICAgIH1cbiAgICBpZiAobmFtZXNldC5tZXRhZGF0YVsnbGF0ZXN0X290dF92ZXJzaW9uJ10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBuYW1lc2V0Lm1ldGFkYXRhLmxhdGVzdF9vdHRfdmVyc2lvbiA9IG51bGw7XG4gICAgfVxuICAgIGlmIChsb2FkZWRGaWxlTmFtZSkge1xuICAgICAgICAvLyBXZSBqdXN0IGxvYWRlZCBhbiBhcmNoaXZlIGZpbGUhIFN0b3JlIGl0cyBsYXRlc3QgZmlsZW5hbWUuXG4gICAgICAgIG5hbWVzZXQubWV0YWRhdGEucHJldmlvdXNfZmlsZW5hbWUgPSBsb2FkZWRGaWxlTmFtZTtcbiAgICB9XG4gICAgaWYgKG5hbWVzZXQubWFwcGluZ0hpbnRzWydhdXRvQWNjZXB0RXhhY3RNYXRjaGVzJ10gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBuYW1lc2V0Lm1hcHBpbmdIaW50c1snYXV0b0FjY2VwdEV4YWN0TWF0Y2hlcyddID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyogTmFtZSBhbmQgZXhwb3J0IHRoZSBuZXcgdmlld21vZGVsLiBOT1RFIHRoYXQgd2UgZG9uJ3QgY3JlYXRlIG9ic2VydmFibGVzXG4gICAgICogZm9yIG5hbWVzIGFuZCB0aGVpciBtYW55IHByb3BlcnRpZXMhIFRoaXMgc2hvdWxkIGhlbHAga2VlcCB0aGluZ3Mgc25hcHB5XG4gICAgICogd2hlbiB3b3JpaW5nIHdpdGggdmVyeSBsYXJnZSBsaXN0cy5cbiAgICAgKi9cbiAgICB2YXIga25vY2tvdXRNYXBwaW5nT3B0aW9ucyA9IHtcbiAgICAgICAgJ2NvcHknOiBbXCJuYW1lc1wiXSAgLy8gd2UnbGwgbWFrZSB0aGUgJ25hbWVzJyBhcnJheSBvYnNlcnZhYmxlIGJlbG93XG4gICAgfTtcblxuICAgIGV4cG9ydHMudmlld01vZGVsID0gdmlld01vZGVsID0ga28ubWFwcGluZy5mcm9tSlMobmFtZXNldCwga25vY2tvdXRNYXBwaW5nT3B0aW9ucyk7XG4gICAgdmlld01vZGVsLm5hbWVzID0ga28ub2JzZXJ2YWJsZUFycmF5KHZpZXdNb2RlbC5uYW1lcyk7XG5cbiAgICAvLyBjbGVhbnVwIG9mIGluY29taW5nIGRhdGFcbiAgICByZW1vdmVEdXBsaWNhdGVOYW1lcyh2aWV3TW9kZWwpO1xuXG4gICAgLy8gdGFrZSBpbml0aWFsIHN0YWIgYXQgc2V0dGluZyBzZWFyY2ggY29udGV4dCBmb3IgVE5SUz9cbiAgICBpbmZlclNlYXJjaENvbnRleHRGcm9tQXZhaWxhYmxlTmFtZXMoKTtcblxuICAgIC8qIFxuICAgICAqIEFkZCBvYnNlcnZhYmxlIHByb3BlcnRpZXMgdG8gdGhlIG1vZGVsIHRvIHN1cHBvcnQgdGhlIFVJLiBcbiAgICAgKi9cblxuICAgIC8vIHByZXR0aWVyIGRpc3BsYXkgZGF0ZXNcbiAgICB2aWV3TW9kZWwuZGlzcGxheUNyZWF0aW9uRGF0ZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0ZSA9IHZpZXdNb2RlbC5tZXRhZGF0YS5kYXRlX2NyZWF0ZWQoKTtcbiAgICAgICAgcmV0dXJuIGZvcm1hdElTT0RhdGUoZGF0ZSk7XG4gICAgfSk7XG4gICAgdmlld01vZGVsLmRpc3BsYXlMYXN0U2F2ZSA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0ZSA9IHZpZXdNb2RlbC5tZXRhZGF0YS5sYXN0X3NhdmVkKCk7XG4gICAgICAgIGlmIChkYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0xhc3Qgc2F2ZWQgJysgZm9ybWF0SVNPRGF0ZShkYXRlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAnVGhpcyBuYW1lc2V0IGhhcyBub3QgYmVlbiBzYXZlZC4nO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmlld01vZGVsLmRpc3BsYXlQcmV2aW91c0ZpbGVuYW1lID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBmaWxlTmFtZSA9IHZpZXdNb2RlbC5tZXRhZGF0YS5wcmV2aW91c19maWxlbmFtZSgpO1xuICAgICAgICBpZiAoZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBcIkxvYWRlZCBmcm9tIGZpbGUgPGNvZGU+XCIrIGZpbGVOYW1lICtcIjwvY29kZT4uXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RoaXMgaXMgYSBuZXcgbmFtZXNldCAobm8gcHJldmlvdXMgZmlsZW5hbWUpLic7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEFkZCBhIHNlcmllcyBvZiBvYnNlcnZhYmxlIFwidGlja2xlcnNcIiB0byBzaWduYWwgY2hhbmdlcyBpblxuICAgIC8vIHRoZSBtb2RlbCB3aXRob3V0IG9ic2VydmFibGUgTmV4c29uIHByb3BlcnRpZXMuIEVhY2ggaXMgYW5cbiAgICAvLyBpbnRlZ2VyIHRoYXQgY3JlZXBzIHVwIGJ5IDEgdG8gc2lnbmFsIGEgY2hhbmdlIHNvbWV3aGVyZSBpblxuICAgIC8vIHJlbGF0ZWQgTmV4c29uIGVsZW1lbnRzLlxuICAgIHZpZXdNb2RlbC50aWNrbGVycyA9IHtcbiAgICAgICAgJ01FVEFEQVRBJzoga28ub2JzZXJ2YWJsZSgxKSxcbiAgICAgICAgJ0lOUFVUX0ZJTEVTJzoga28ub2JzZXJ2YWJsZSgxKSxcbiAgICAgICAgJ05BTUVfTUFQUElOR19ISU5UUyc6IGtvLm9ic2VydmFibGUoMSksXG4gICAgICAgICdWSVNJQkxFX05BTUVfTUFQUElOR1MnOiBrby5vYnNlcnZhYmxlKDEpLFxuICAgICAgICAvLyBUT0RPOiBhZGQgbW9yZSBhcyBuZWVkZWQuLi5cbiAgICAgICAgJ05BTUVTRVRfSEFTX0NIQU5HRUQnOiBrby5vYnNlcnZhYmxlKDEpXG4gICAgfVxuXG4gICAgLy8gc3VwcG9ydCBmYXN0IGxvb2t1cCBvZiBlbGVtZW50cyBieSBJRCwgZm9yIGxhcmdlc3QgdHJlZXNcbiAgICB2aWV3TW9kZWwuZmFzdExvb2t1cHMgPSB7XG4gICAgICAgICdOQU1FU19CWV9JRCc6IG51bGxcbiAgICB9O1xuXG4gICAgLy8gZW5hYmxlIHNvcnRpbmcgYW5kIGZpbHRlcmluZyBsaXN0cyBpbiB0aGUgZWRpdG9yXG4gICAgdmFyIGxpc3RGaWx0ZXJEZWZhdWx0cyA9IHtcbiAgICAgICAgLy8gdHJhY2sgdGhlc2UgZGVmYXVsdHMgc28gd2UgY2FuIHJlc2V0IHRoZW0gaW4gaGlzdG9yeVxuICAgICAgICAnTkFNRVMnOiB7XG4gICAgICAgICAgICAvLyBUT0RPOiBhZGQgJ3BhZ2VzaXplJz9cbiAgICAgICAgICAgICdtYXRjaCc6IFwiXCIsXG4gICAgICAgICAgICAnb3JkZXInOiBcIlVubWFwcGVkIG5hbWVzIGZpcnN0XCJcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmlld01vZGVsLmZpbHRlckRlbGF5ID0gMjUwOyAvLyBtcyB0byB3YWl0IGZvciBjaGFuZ2VzIGJlZm9yZSB1cGRhdGluZyBmaWx0ZXJcbiAgICB2aWV3TW9kZWwubGlzdEZpbHRlcnMgPSB7XG4gICAgICAgIC8vIFVJIHdpZGdldHMgYm91bmQgdG8gdGhlc2UgdmFyaWFibGVzIHdpbGwgdHJpZ2dlciB0aGVcbiAgICAgICAgLy8gY29tcHV0ZWQgZGlzcGxheSBsaXN0cyBiZWxvdy4uXG4gICAgICAgICdOQU1FUyc6IHtcbiAgICAgICAgICAgIC8vIFRPRE86IGFkZCAncGFnZXNpemUnP1xuICAgICAgICAgICAgJ21hdGNoJzoga28ub2JzZXJ2YWJsZSggbGlzdEZpbHRlckRlZmF1bHRzLk5BTUVTLm1hdGNoICksXG4gICAgICAgICAgICAnb3JkZXInOiBrby5vYnNlcnZhYmxlKCBsaXN0RmlsdGVyRGVmYXVsdHMuTkFNRVMub3JkZXIgKVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBhbnkgY2hhbmdlIHRvIHRoZXNlIGxpc3QgZmlsdGVycyBzaG91bGQgcmVzZXQgcGFnaW5hdGlvbiBmb3IgdGhlIGN1cnJlbnQgZGlzcGxheSBsaXN0XG4gICAgLy8gTkIgdGhpcyBpcyBhIHN0cmVhbWxpbmVkIHZlcnNpb24gb2YgdGhlIG1vcmUgZ2VuZXJhbCBmaXggaW4gc3R1ZHktZWRpdG9yLmpzIVxuICAgICQuZWFjaCh2aWV3TW9kZWwubGlzdEZpbHRlcnMuTkFNRVMsIGZ1bmN0aW9uKGZpbHRlck5hbWUsIGZpbHRlck9ic2VydmFibGUpIHtcbiAgICAgICAgZmlsdGVyT2JzZXJ2YWJsZS5zdWJzY3JpYmUoZnVuY3Rpb24obmV3VmFsdWUpIHtcbiAgICAgICAgICAgIC8vIGlnbm9yZSB2YWx1ZSwganVzdCByZXNldCBwYWdpbmF0aW9uIChiYWNrIHRvIHBhZ2UgMSlcbiAgICAgICAgICAgIHZpZXdNb2RlbC5fZmlsdGVyZWRPVFVzLmdvVG9QYWdlKDEpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiBcbiAgICAvLyBtYWludGFpbiBhIHBlcnNpc3RlbnQgYXJyYXkgdG8gcHJlc2VydmUgcGFnaW5hdGlvbiAocmVzZXQgd2hlbiBjb21wdXRlZClcbiAgICB2aWV3TW9kZWwuX2ZpbHRlcmVkTmFtZXMgPSBrby5vYnNlcnZhYmxlQXJyYXkoICkuYXNQYWdlZCg1MDApO1xuICAgIHZpZXdNb2RlbC5maWx0ZXJlZE5hbWVzID0ga28uY29tcHV0ZWQoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGZpbHRlciByYXcgbmFtZSBsaXN0LCB0aGVuIHNvcnQsIHJldHVybmluZyBhXG4gICAgICAgIC8vIG5ldyAoT1IgTU9ESUZJRUQ/PykgcGFnZWQgb2JzZXJ2YWJsZUFycmF5XG4gICAgICAgIC8vL3ZhciB0aWNrbGVycyA9IFsgdmlld01vZGVsLnRpY2tsZXJzLk5BTUVfTUFQUElOR19ISU5UUygpIF07XG5cbiAgICAgICAgdXBkYXRlQ2xlYXJTZWFyY2hXaWRnZXQoICcjbmFtZS1saXN0LWZpbHRlcicgKTtcbiAgICAgICAgLy91cGRhdGVMaXN0RmlsdGVyc1dpdGhIaXN0b3J5KCk7XG5cbiAgICAgICAgdmFyIG1hdGNoID0gdmlld01vZGVsLmxpc3RGaWx0ZXJzLk5BTUVTLm1hdGNoKCksXG4gICAgICAgICAgICBtYXRjaFdpdGhEaWFjcml0aWNhbHMgPSBhZGREaWFjcml0aWNhbFZhcmlhbnRzKG1hdGNoKSxcbiAgICAgICAgICAgIG1hdGNoUGF0dGVybiA9IG5ldyBSZWdFeHAoICQudHJpbShtYXRjaFdpdGhEaWFjcml0aWNhbHMpLCAnaScgKTtcbiAgICAgICAgdmFyIG9yZGVyID0gdmlld01vZGVsLmxpc3RGaWx0ZXJzLk5BTUVTLm9yZGVyKCk7XG5cbiAgICAgICAgLy8gY2FwdHVyZSBjdXJyZW50IHBvc2l0aW9ucywgdG8gYXZvaWQgdW5uZWNlc3NhcnkgXCJqdW1waW5nXCIgaW4gdGhlIGxpc3RcbiAgICAgICAgY2FwdHVyZURlZmF1bHRTb3J0T3JkZXIodmlld01vZGVsLm5hbWVzKCkpO1xuXG4gICAgICAgIC8qIFRPRE86IHBvb2wgYWxsIG5hbWUgSURzIGludG8gYSBjb21tb24gb2JqZWN0P1xuICAgICAgICB2YXIgY2hvc2VuTmFtZUlEcyA9IHt9O1xuICAgICAgICBjb25zb2xlLndhcm4oY2hvc2VuTmFtZUlEcyk7XG4gICAgICAgIGlmIChjaG9zZW5OYW1lSURzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkhlcmUncyB0aGUgZmlyc3Qgb2YgY2hvc2VuTmFtZUlEczpcIik7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oY2hvc2VuTmFtZUlEc1swXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJjaG9zZW5OYW1lSURzIGlzIGFuIGVtcHR5IGxpc3QhXCIpO1xuICAgICAgICB9XG4gICAgICAgICovXG5cbiAgICAgICAgLy8gbWFwIG9sZCBhcnJheSB0byBuZXcgYW5kIHJldHVybiBpdFxuICAgICAgICB2YXIgZmlsdGVyZWRMaXN0ID0ga28udXRpbHMuYXJyYXlGaWx0ZXIoXG4gICAgICAgICAgICB2aWV3TW9kZWwubmFtZXMoKSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAvLyBtYXRjaCBlbnRlcmVkIHRleHQgYWdhaW5zdCBvbGQgb3IgbmV3IGxhYmVsXG4gICAgICAgICAgICAgICAgdmFyIG9yaWdpbmFsTGFiZWwgPSBuYW1lWydvcmlnaW5hbExhYmVsJ107XG4gICAgICAgICAgICAgICAgdmFyIG1vZGlmaWVkTGFiZWwgPSBuYW1lWydhZGp1c3RlZExhYmVsJ10gfHwgYWRqdXN0ZWRMYWJlbChvcmlnaW5hbExhYmVsKTtcbiAgICAgICAgICAgICAgICB2YXIgbWFwcGVkTGFiZWwgPSBuYW1lWydvdHRUYXhvbk5hbWUnXTtcbiAgICAgICAgICAgICAgICBpZiAoIW1hdGNoUGF0dGVybi50ZXN0KG9yaWdpbmFsTGFiZWwpICYmXG4gICAgICAgICAgICAgICAgICAgICFtYXRjaFBhdHRlcm4udGVzdChtb2RpZmllZExhYmVsKSAmJlxuICAgICAgICAgICAgICAgICAgICAhbWF0Y2hQYXR0ZXJuLnRlc3QobWFwcGVkTGFiZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7ICAvLyBFTkQgb2YgbGlzdCBmaWx0ZXJpbmdcblxuICAgICAgICAvLyBhcHBseSBzZWxlY3RlZCBzb3J0IG9yZGVyXG4gICAgICAgIHN3aXRjaChvcmRlcikge1xuICAgICAgICAgICAgLyogUkVNSU5ERVI6IGluIHNvcnQgZnVuY3Rpb25zLCByZXN1bHRzIGFyZSBhcyBmb2xsb3dzOlxuICAgICAgICAgICAgICogIC0xID0gYSBjb21lcyBiZWZvcmUgYlxuICAgICAgICAgICAgICogICAwID0gbm8gY2hhbmdlXG4gICAgICAgICAgICAgKiAgIDEgPSBiIGNvbWVzIGJlZm9yZSBhXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNhc2UgJ1VubWFwcGVkIG5hbWVzIGZpcnN0JzpcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZExpc3Quc29ydChmdW5jdGlvbihhLGIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTi5CLiBUaGlzIHdvcmtzIGV2ZW4gaWYgdGhlcmUncyBubyBzdWNoIHByb3BlcnR5LlxuICAgICAgICAgICAgICAgICAgICAvL2lmIChjaGVja0ZvckludGVyZXN0aW5nU3R1ZGllcyhhLGIpKSB7IGRlYnVnZ2VyOyB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBhTWFwU3RhdHVzID0gJC50cmltKGFbJ290dFRheG9uTmFtZSddKSAhPT0gJyc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiTWFwU3RhdHVzID0gJC50cmltKGJbJ290dFRheG9uTmFtZSddKSAhPT0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhTWFwU3RhdHVzID09PSBiTWFwU3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFNYXBTdGF0dXMpIHsgLy8gYm90aCBuYW1lcyBhcmUgY3VycmVudGx5IHVuLW1hcHBlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvcmNlIGZhaWxlZCBtYXBwaW5ncyB0byB0aGUgYm90dG9tIG9mIHRoZSBsaXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFGYWlsZWRNYXBwaW5nID0gKGZhaWxlZE1hcHBpbmdOYW1lcy5pbmRleE9mKGFbJ2lkJ10pICE9PSAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJGYWlsZWRNYXBwaW5nID0gKGZhaWxlZE1hcHBpbmdOYW1lcy5pbmRleE9mKGJbJ2lkJ10pICE9PSAtMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFGYWlsZWRNYXBwaW5nID09PSBiRmFpbGVkTWFwcGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUcnkgdG8gcmV0YWluIHRoZWlyIHByaW9yIHByZWNlZGVuY2UgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGxpc3QgKGF2b2lkIGl0ZW1zIGp1bXBpbmcgYXJvdW5kKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKnJldHVybiAoYS5wcmlvclBvc2l0aW9uIDwgYi5wcmlvclBvc2l0aW9uKSA/IC0xOjE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIFNob3VsZCB0aGlzIHN1cGVyY2VkZSBvdXIgdHlwaWNhbCB1c2Ugb2YgYG1haW50YWluUmVsYXRpdmVMaXN0UG9zaXRpb25zYD9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtYWludGFpblJlbGF0aXZlTGlzdFBvc2l0aW9ucyhhLCBiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFGYWlsZWRNYXBwaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxOyAgIC8vIGZvcmNlIGEgKGZhaWxlZCkgYmVsb3cgYlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7ICAgLy8gZm9yY2UgYiAoZmFpbGVkKSBiZWxvdyBhXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vcmV0dXJuIChhLnByaW9yUG9zaXRpb24gPCBiLnByaW9yUG9zaXRpb24pID8gLTE6MTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFpbnRhaW5SZWxhdGl2ZUxpc3RQb3NpdGlvbnMoYSwgYik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFNYXBTdGF0dXMpIHJldHVybiAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYk1hcFN0YXR1cykgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdNYXBwZWQgbmFtZXMgZmlyc3QnOlxuICAgICAgICAgICAgICAgIGZpbHRlcmVkTGlzdC5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYU1hcFN0YXR1cyA9ICQudHJpbShhWydvdHRUYXhvbk5hbWUnXSkgIT09ICcnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYk1hcFN0YXR1cyA9ICQudHJpbShiWydvdHRUYXhvbk5hbWUnXSkgIT09ICcnO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYU1hcFN0YXR1cyA9PT0gYk1hcFN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1haW50YWluUmVsYXRpdmVMaXN0UG9zaXRpb25zKGEsIGIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChhTWFwU3RhdHVzKSByZXR1cm4gLTE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdPcmlnaW5hbCBuYW1lIChBLVopJzpcbiAgICAgICAgICAgICAgICBmaWx0ZXJlZExpc3Quc29ydChmdW5jdGlvbihhLGIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFPcmlnaW5hbCA9ICQudHJpbShhWydvcmlnaW5hbExhYmVsJ10pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYk9yaWdpbmFsID0gJC50cmltKGJbJ29yaWdpbmFsTGFiZWwnXSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhT3JpZ2luYWwgPT09IGJPcmlnaW5hbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1haW50YWluUmVsYXRpdmVMaXN0UG9zaXRpb25zKGEsIGIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChhT3JpZ2luYWwgPCBiT3JpZ2luYWwpIHJldHVybiAtMTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ09yaWdpbmFsIG5hbWUgKFotQSknOlxuICAgICAgICAgICAgICAgIGZpbHRlcmVkTGlzdC5zb3J0KGZ1bmN0aW9uKGEsYikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYU9yaWdpbmFsID0gJC50cmltKGFbJ29yaWdpbmFsTGFiZWwnXSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiT3JpZ2luYWwgPSAkLnRyaW0oYlsnb3JpZ2luYWxMYWJlbCddKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFPcmlnaW5hbCA9PT0gYk9yaWdpbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFpbnRhaW5SZWxhdGl2ZUxpc3RQb3NpdGlvbnMoYSwgYik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFPcmlnaW5hbCA+IGJPcmlnaW5hbCkgcmV0dXJuIC0xO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVuZXhwZWN0ZWQgb3JkZXIgZm9yIG5hbWUgbGlzdDogW1wiKyBvcmRlciArXCJdXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVW4tc2VsZWN0IGFueSBuYW1lIHRoYXQncyBub3cgb3V0IG9mIHZpZXcgKGllLCBvdXRzaWRlIG9mIHRoZSBmaXJzdCBwYWdlIG9mIHJlc3VsdHMpXG4gICAgICAgIHZhciBpdGVtc0luVmlldyA9IGZpbHRlcmVkTGlzdC5zbGljZSgwLCB2aWV3TW9kZWwuX2ZpbHRlcmVkTmFtZXMucGFnZVNpemUpO1xuICAgICAgICB2aWV3TW9kZWwubmFtZXMoKS5tYXAoZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgaWYgKG5hbWVbJ3NlbGVjdGVkRm9yQWN0aW9uJ10pIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNPdXRPZlZpZXcgPSAoJC5pbkFycmF5KG5hbWUsIGl0ZW1zSW5WaWV3KSA9PT0gLTEpO1xuICAgICAgICAgICAgICAgIGlmIChpc091dE9mVmlldykge1xuICAgICAgICAgICAgICAgICAgICBuYW1lWydzZWxlY3RlZEZvckFjdGlvbiddID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBjbGVhciBhbnkgc3RhbGUgbGFzdC1zZWxlY3RlZCBuYW1lIChpdCdzIGxpa2VseSBtb3ZlZClcbiAgICAgICAgbGFzdENsaWNrZWRUb2dnbGVQb3NpdGlvbiA9IG51bGw7XG5cbiAgICAgICAgdmlld01vZGVsLl9maWx0ZXJlZE5hbWVzKCBmaWx0ZXJlZExpc3QgKTtcbiAgICAgICAgcmV0dXJuIHZpZXdNb2RlbC5fZmlsdGVyZWROYW1lcztcbiAgICB9KS5leHRlbmQoeyB0aHJvdHRsZTogdmlld01vZGVsLmZpbHRlckRlbGF5IH0pOyAvLyBFTkQgb2YgZmlsdGVyZWROYW1lc1xuXG4gICAgLy8gU3Rhc2ggdGhlIHByaXN0aW5lIG1hcmt1cCBiZWZvcmUgYmluZGluZyBvdXIgVUkgZm9yIHRoZSBmaXJzdCB0aW1lXG4gICAgaWYgKCRzdGFzaGVkRWRpdEFyZWEgPT09IG51bGwpIHtcbiAgICAgICAgJHN0YXNoZWRFZGl0QXJlYSA9ICQoJyNOYW1lLU1hcHBpbmcnKS5jbG9uZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJlcGxhY2Ugd2l0aCBwcmlzdGluZSBtYXJrdXAgdG8gYXZvaWQgd2VpcmQgcmVzdWx0cyB3aGVuIGxvYWRpbmcgYSBuZXcgbmFtZXNldFxuICAgICAgICAkKCcjTmFtZS1NYXBwaW5nJykuY29udGVudHMoKS5yZXBsYWNlV2l0aChcbiAgICAgICAgICAgICRzdGFzaGVkRWRpdEFyZWEuY2xvbmUoKS5jb250ZW50cygpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gKHJlKWJpbmQgdG8gZWRpdG9yIFVJIHdpdGggS25vY2tvdXRcbiAgICB2YXIgJGJvdW5kRWxlbWVudHMgPSAkKCcjTmFtZS1NYXBwaW5nLCAjaGVscC1maWxlLWFwaS1wcm9tcHQnKTsgLy8gYWRkIG90aGVyIGVsZW1lbnRzP1xuICAgICQuZWFjaCgkYm91bmRFbGVtZW50cywgZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgICAga28uY2xlYW5Ob2RlKGVsKTtcbiAgICAgICAga28uYXBwbHlCaW5kaW5ncyh2aWV3TW9kZWwsZWwpO1xuICAgIH0pO1xuXG4gICAgLyogQW55IGZ1cnRoZXIgY2hhbmdlcyAoKmFmdGVyKiBpbml0aWFsIGNsZWFudXApIHNob3VsZCBwcm9tcHQgZm9yIGEgc2F2ZVxuICAgICAqIGJlZm9yZSBsZWF2aW5nIHRoaXMgcGFnZS5cbiAgICAgKi9cbiAgICB2aWV3TW9kZWwudGlja2xlcnMuTkFNRVNFVF9IQVNfQ0hBTkdFRC5zdWJzY3JpYmUoIGZ1bmN0aW9uKCkge1xuICAgICAgICBuYW1lc2V0SGFzVW5zYXZlZENoYW5nZXMgPSB0cnVlO1xuICAgICAgICBlbmFibGVTYXZlQnV0dG9uKCk7XG4gICAgICAgIHB1c2hQYWdlRXhpdFdhcm5pbmcoJ1VOU0FWRURfTkFNRVNFVF9DSEFOR0VTJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIldBUk5JTkc6IFRoaXMgbmFtZXNldCBoYXMgdW5zYXZlZCBjaGFuZ2VzISBUbyBwcmVzZXJ2ZSB5b3VyIHdvcmssIHlvdSBzaG91bGQgc2F2ZSBhIG5hbWVzZXQgZmlsZSBiZWZvcmUgbGVhdmluZyBvciByZWxvYWRpbmcgdGhlIHBhZ2UuXCIpO1xuICAgIH0pO1xuICAgIHBvcFBhZ2VFeGl0V2FybmluZygnVU5TQVZFRF9OQU1FU0VUX0NIQU5HRVMnKTtcbiAgICBuYW1lc2V0SGFzVW5zYXZlZENoYW5nZXMgPSBmYWxzZTtcbiAgICBkaXNhYmxlU2F2ZUJ1dHRvbigpO1xufVxuXG4vLyBrZWVwIHRyYWNrIG9mIHRoZSBsYXJnZXN0IChhbmQgdGh1cyBuZXh0IGF2YWlsYWJsZSkgbmFtZSBpZFxudmFyIGhpZ2hlc3ROYW1lT3JkaW5hbE51bWJlciA9IG51bGw7XG5mdW5jdGlvbiBmaW5kSGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyKCkge1xuICAgIC8vIGRvIGEgb25lLXRpbWUgc2NhbiBmb3IgdGhlIGhpZ2hlc3QgSUQgY3VycmVudGx5IGluIHVzZVxuICAgIHZhciBoaWdoZXN0T3JkaW5hbE51bWJlciA9IDA7XG4gICAgdmFyIGFsbE5hbWVzID0gdmlld01vZGVsLm5hbWVzKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGxOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGVzdE5hbWUgPSBhbGxOYW1lc1tpXTtcbiAgICAgICAgdmFyIHRlc3RJRCA9IGtvLnVud3JhcCh0ZXN0TmFtZVsnaWQnXSkgfHwgJyc7XG4gICAgICAgIGlmICh0ZXN0SUQgPT09ICcnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiTUlTU0lORyBJRCBmb3IgdGhpcyBuYW1lOlwiKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGVzdE5hbWUpO1xuICAgICAgICAgICAgY29udGludWU7ICAvLyBza2lwIHRvIG5leHQgZWxlbWVudFxuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXN0SUQuaW5kZXhPZignbmFtZScpID09PSAwKSB7XG4gICAgICAgICAgICAvLyBjb21wYXJlIHRoaXMgdG8gdGhlIGhpZ2hlc3QgSUQgZm91bmQgc28gZmFyXG4gICAgICAgICAgICB2YXIgaXRzTnVtYmVyID0gdGVzdElELnNwbGl0KCAnbmFtZScgKVsxXTtcbiAgICAgICAgICAgIGlmICgkLmlzTnVtZXJpYyggaXRzTnVtYmVyICkpIHtcbiAgICAgICAgICAgICAgICBoaWdoZXN0T3JkaW5hbE51bWJlciA9IE1hdGgubWF4KCBoaWdoZXN0T3JkaW5hbE51bWJlciwgaXRzTnVtYmVyICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGhpZ2hlc3RPcmRpbmFsTnVtYmVyO1xufVxuZnVuY3Rpb24gZ2V0TmV4dE5hbWVPcmRpbmFsTnVtYmVyKCkge1xuICAgIC8vIGluY3JlbWVudCBhbmQgcmV0dXJuIHRoZSBuZXh0IGF2YWlsYWJsZSBvcmRpbmFsIG51bWJlciBmb3IgbmFtZXM7IHRoaXNcbiAgICAvLyBpcyB0eXBpY2FsbHkgdXNlZCB0byBtaW50IGEgbmV3IGlkLCBlLmcuIDIzID0+ICduYW1lMjMnXG4gICAgaWYgKGhpZ2hlc3ROYW1lT3JkaW5hbE51bWJlciA9PT0gbnVsbCkge1xuICAgICAgICBoaWdoZXN0TmFtZU9yZGluYWxOdW1iZXIgPSBmaW5kSGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyKCk7XG4gICAgfVxuICAgIC8vIGluY3JlbWVudCB0aGUgaGlnaGVzdCBJRCBmb3IgZmFzdGVyIGFzc2lnbm1lbnQgbmV4dCB0aW1lXG4gICAgaGlnaGVzdE5hbWVPcmRpbmFsTnVtYmVyKys7XG4gICAgcmV0dXJuIGhpZ2hlc3ROYW1lT3JkaW5hbE51bWJlcjtcbn1cblxuXG5mdW5jdGlvbiByZW1vdmVEdXBsaWNhdGVOYW1lcyggdmlld21vZGVsICkge1xuICAgIC8qIENhbGwgdGhpcyB3aGVuIGxvYWRpbmcgYSBuYW1lc2V0ICpvciogYWRkaW5nIG5hbWVzISAgV2Ugc2hvdWxkIHdhbGsgdGhlXG4gICAgICogZnVsbCBuYW1lcyBhcnJheSBhbmQgY2xvYmJlciBhbnkgbGF0ZXIgZHVwbGljYXRlcy4gVGhpcyBhcnJheSBpcyBhbHdheXNcbiAgICAgKiBzb3J0ZWQgYnkgY3JlYXRpb24gb3JkZXIsIHNvIGEgc2ltcGxlIGFwcHJvYWNoIHNob3VsZCBwcmVzZXJ2ZSB0aGVcbiAgICAgKiBjdXJhdG9yJ3MgZXhpc3RpbmcgbWFwcGluZ3MgYW5kIGxhYmVsIGFkanVzdG1lbnRzLlxuICAgICAqL1xuICAgIHZhciBsYWJlbHNBbHJlYWR5Rm91bmQgPSBbIF07XG4gICAgdmFyIGR1cGVzID0gWyBdO1xuICAgICQuZWFjaCggdmlld01vZGVsLm5hbWVzKCksIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgICAgdmFyIHRlc3RMYWJlbCA9ICQudHJpbShuYW1lLm9yaWdpbmFsTGFiZWwpO1xuICAgICAgICBpZiAobGFiZWxzQWxyZWFkeUZvdW5kLmluZGV4T2YodGVzdExhYmVsKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIC8vIGFkZCB0aGlzIHRvIGxhYmVscyBmb3VuZCAodGVzdCBsYXRlciBuYW1lcyBhZ2FpbnN0IHRoaXMpXG4gICAgICAgICAgICBsYWJlbHNBbHJlYWR5Rm91bmQucHVzaCh0ZXN0TGFiZWwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhpcyBpcyBhIGR1cGUgb2YgYW4gZWFybGllciBuYW1lIVxuICAgICAgICAgICAgZHVwZXMucHVzaChuYW1lKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZpZXdNb2RlbC5uYW1lcy5yZW1vdmVBbGwoIGR1cGVzICk7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdElTT0RhdGUoIGRhdGVTdHJpbmcsIG9wdGlvbnMgKSB7XG4gICAgLy8gY29waWVkIGZyb20gc3ludGgtdHJlZSB2aWV3ZXIgKG90dV9zdGF0aXN0aWNzLmh0bWwpXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge2luY2x1ZGVUaW1lOiB0cnVlfTtcbiAgICB2YXIgYURhdGUgPSBuZXcgbW9tZW50KGRhdGVTdHJpbmcpO1xuICAgIC8vIHNlZSBodHRwOi8vbW9tZW50anMuY29tL2RvY3MvIy9wYXJzaW5nL3N0cmluZy9cbiAgICBpZiAob3B0aW9ucy5pbmNsdWRlVGltZSkge1xuICAgICAgICByZXR1cm4gYURhdGUuZm9ybWF0KCdNTU1NIERvIFlZWVksIGhBJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGFEYXRlLmZvcm1hdCgnTU1NTSBEbyBZWVlZJyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG93UG9zc2libGVNYXBwaW5nc0tleSgpIHtcbiAgICAvLyBleHBsYWluIGNvbG9ycyBhbmQgb3BhY2l0eSBpbiBhIHBvcHVwIChhbHJlYWR5IGJvdW5kKVxuICAgICQoJyNwb3NzaWJsZS1tYXBwaW5ncy1rZXknKS5tb2RhbCgnc2hvdycpO1xufVxuXG4kKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBzd2l0Y2ggKGNvbnRleHQpIHtcbiAgICAgICAgY2FzZSAnQlVMS19UTlJTJzpcbiAgICAgICAgICAgIC8vIEFsd2F5cyBzdGFydCB3aXRoIGFuIGVtcHR5IHNldCwgYmluZGluZyBpdCB0byB0aGUgVUlcbiAgICAgICAgICAgIGxvYWROYW1lc2V0RGF0YSggbnVsbCApO1xuICAgICAgICAgICAgLy8gYXV0by1zZWxlY3QgdGhlIG1haW4gKFVJKSB0YWJcbiAgICAgICAgICAgICQoJ2FbaHJlZj0jTmFtZS1NYXBwaW5nXScpLnRhYignc2hvdycpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1NUVURZX09UVV9NQVBQSU5HJzpcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQW55dGhpbmcgdG8gZG8gb24gcmVhZHk/XCIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBkbyBub3RoaW5nIGZvciBub3cgKHByb2JhYmx5IGxvb2tpbmcgYXQgdGhlIHJlYWQtb25seSBzdHVkeSB2aWV3KVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufSk7XG5cbi8vIGV4cG9ydCBzb21lIG1lbWJlcnMgYXMgYSBzaW1wbGUgQVBJXG52YXIgYXBpID0gW1xuICAgICdudWRnZScsICAvLyBleHBvc2UgdGlja2xlcnMgZm9yIEtPIGJpbmRpbmdzXG4gICAgJ2dldERlZmF1bHRBcmNoaXZlRmlsZW5hbWUnLFxuICAgICdzYXZlQ3VycmVudE5hbWVzZXQnLFxuICAgICdsb2FkTGlzdEZyb21DaG9zZW5GaWxlJyxcbiAgICAnbG9hZE5hbWVzZXRGcm9tQ2hvc2VuRmlsZScsXG4gICAgJ3Nob3dMb2FkTGlzdFBvcHVwJyxcbiAgICAnc2hvd0xvYWROYW1lc2V0UG9wdXAnLFxuICAgICdzaG93U2F2ZU5hbWVzZXRQb3B1cCcsXG4gICAgJ2Jyb3dzZXJTdXBwb3J0c0ZpbGVBUEknLFxuICAgICdhdXRvTWFwcGluZ0luUHJvZ3Jlc3MnLFxuICAgICd1cGRhdGVNYXBwaW5nSGludHMnLFxuICAgICdzaG93TmFtZXNldE1ldGFkYXRhJyxcbiAgICAnaGlkZU5hbWVzZXRNZXRhZGF0YScsXG4gICAgJ2luZmVyU2VhcmNoQ29udGV4dEZyb21BdmFpbGFibGVOYW1lcycsXG4gICAgJ3Nob3dNYXBwaW5nT3B0aW9ucycsXG4gICAgJ2hpZGVNYXBwaW5nT3B0aW9ucycsXG4gICAgJ2Rpc2FibGVTYXZlQnV0dG9uJyxcbiAgICAnZW5hYmxlU2F2ZUJ1dHRvbicsXG4gICAgJ2dldEF0dHJzRm9yTWFwcGluZ09wdGlvbicsXG4gICAgJ3N0YXJ0QXV0b01hcHBpbmcnLFxuICAgICdzdG9wQXV0b01hcHBpbmcnLFxuICAgICdnZXRNYXBwZWROYW1lc1RhbGx5JyxcbiAgICAnbWFwcGluZ1Byb2dyZXNzQXNQZXJjZW50JyxcbiAgICAnYm9ndXNFZGl0ZWRMYWJlbENvdW50ZXInLFxuICAgICd0b2dnbGVNYXBwaW5nRm9yTmFtZScsXG4gICAgJ3RvZ2dsZUFsbE1hcHBpbmdDaGVja2JveGVzJyxcbiAgICAncHJvcG9zZWRNYXBwaW5nJyxcbiAgICAnYWRqdXN0ZWRMYWJlbE9yRW1wdHknLFxuICAgICdjdXJyZW50bHlNYXBwaW5nTmFtZXMnLFxuICAgICdmYWlsZWRNYXBwaW5nTmFtZXMnLFxuICAgICdlZGl0TmFtZUxhYmVsJyxcbiAgICAncmV2ZXJ0TmFtZUxhYmVsJyxcbiAgICAnbW9kaWZ5RWRpdGVkTGFiZWwnLFxuICAgICdhcHByb3ZlUHJvcG9zZWROYW1lTGFiZWwnLFxuICAgICdhcHByb3ZlUHJvcG9zZWROYW1lTWFwcGluZ09wdGlvbicsXG4gICAgJ2FwcHJvdmVBbGxWaXNpYmxlTWFwcGluZ3MnLFxuICAgICdyZWplY3RQcm9wb3NlZE5hbWVMYWJlbCcsXG4gICAgJ3JlamVjdEFsbFZpc2libGVNYXBwaW5ncycsXG4gICAgJ21hcE5hbWVUb1RheG9uJyxcbiAgICAndW5tYXBOYW1lRnJvbVRheG9uJyxcbiAgICAnY2xlYXJTZWxlY3RlZE1hcHBpbmdzJyxcbiAgICAnY2xlYXJBbGxNYXBwaW5ncycsXG4gICAgJ3Nob3dQb3NzaWJsZU1hcHBpbmdzS2V5JyxcbiAgICAnYWRkU3Vic3RpdHV0aW9uJyxcbiAgICAncmVtb3ZlU3Vic3RpdHV0aW9uJyxcbiAgICAnZm9ybWF0SVNPRGF0ZScsXG4gICAgJ2NvbnZlcnRUb05hbWVzZXRNb2RlbCcsXG4gICAgJ2NvbnRleHQnXG5dO1xuJC5lYWNoKGFwaSwgZnVuY3Rpb24oaSwgbWV0aG9kTmFtZSkge1xuICAgIC8vIHBvcHVsYXRlIHRoZSBkZWZhdWx0ICdtb2R1bGUuZXhwb3J0cycgb2JqZWN0XG4gICAgZXhwb3J0c1sgbWV0aG9kTmFtZSBdID0gZXZhbCggbWV0aG9kTmFtZSApO1xufSk7XG4iXX0=
