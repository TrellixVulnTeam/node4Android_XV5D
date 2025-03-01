'use strict';

const util = require('util');
const process = require('process');
const log = process.binding('log');
const opus = process.binding('Opus_Decode');

function Console(stdout, stderr) {
  if (!(this instanceof Console)) {
    return new Console(stdout, stderr);
  }
  if (!stdout || typeof stdout.write !== 'function') {
    throw new TypeError('Console expects a writable stream instance');
  }
  if (!stderr) {
    stderr = stdout;
  }
  var prop = {
    writable: true,
    enumerable: false,
    configurable: true
  };
  prop.value = stdout;
  Object.defineProperty(this, '_stdout', prop);
  prop.value = stderr;
  Object.defineProperty(this, '_stderr', prop);
  prop.value = new Map();
  Object.defineProperty(this, '_times', prop);

  // bind the prototype functions to this Console instance
  var keys = Object.keys(Console.prototype);
  for (var v = 0; v < keys.length; v++) {
    var k = keys[v];
    this[k] = this[k].bind(this);
  }
}

Console.prototype.log = function() {
  var s = util.format.apply(this, arguments) + '\n';
  this._stdout.write(s);
  log.i(s);
};


Console.prototype.info = Console.prototype.log;

Console.prototype.decode = function() {
  opus.Decode();
}

Console.prototype.warn = function() {
  var s = util.format.apply(this, arguments) + '\n';
  this._stderr.write(s);
  log.w(s);
};

Console.prototype.error = function() {
  var s = util.format.apply(this, arguments) + '\n';
  this._stderr.write(s);
  log.e(s);
};

Console.prototype.dir = function(object, options) {
  this._stdout.write(util.inspect(object, util._extend({
    customInspect: false
  }, options)) + '\n');
};


Console.prototype.time = function(label) {
  this._times.set(label, process.hrtime());
};


Console.prototype.timeEnd = function(label) {
  var time = this._times.get(label);
  if (!time) {
    throw new Error('No such label: ' + label);
  }
  const duration = process.hrtime(time);
  const ms = duration[0] * 1000 + duration[1] / 1e6;
  this.log('%s: %sms', label, ms.toFixed(3));
  this._times.delete(label);
};


Console.prototype.trace = function trace() {
  // TODO probably can to do this better with V8's debug object once that is
  // exposed.
  var err = new Error();
  err.name = 'Trace';
  err.message = util.format.apply(this, arguments);
  Error.captureStackTrace(err, trace);
  this.error(err.stack);
};


Console.prototype.assert = function(expression) {
  if (!expression) {
    var arr = Array.prototype.slice.call(arguments, 1);
    require('assert').ok(false, util.format.apply(this, arr));
  }
};


module.exports = new Console(process.stdout, process.stderr);
module.exports.Console = Console;
