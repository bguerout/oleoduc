const { Writable } = require("stream");
const cyclist = require("cyclist");
const { inherits } = require("util");

let ParallelWrite = function (maxParallel, opts, onWrite) {
  if (!(this instanceof ParallelWrite)) return new ParallelWrite(maxParallel, opts, onWrite);

  if (typeof maxParallel === "function") {
    onWrite = maxParallel;
    opts = null;
    maxParallel = 1;
  }
  if (typeof opts === "function") {
    onWrite = opts;
    opts = null;
  }

  if (!opts) opts = {};
  if (!opts.highWaterMark) opts.highWaterMark = Math.max(maxParallel, 16);
  if (opts.objectMode !== false) opts.objectMode = true;

  Writable.call(this, opts);

  this._maxParallel = maxParallel;
  this._onWrite = onWrite;
  this._destroyed = false;
  this._flushed = false;
  this._ordered = opts.ordered !== false;
  this._buffer = this._ordered ? cyclist(maxParallel) : [];
  this._top = 0;
  this._bottom = 0;
  this._ondrain = null;
};

inherits(ParallelWrite, Writable);

ParallelWrite.prototype._destroy = function () {
  if (this._destroyed) return;
  this._destroyed = true;
  this.emit("close");
};

ParallelWrite.prototype._write = function (chunk, enc, callback) {
  let self = this;
  let pos = this._top++;

  this._onWrite(chunk, function (err, data) {
    if (self._destroyed) return;
    if (err) {
      self.emit("error", err);
      self.destroy();
      return;
    }
    if (self._ordered) {
      self._buffer.put(pos, data === undefined || data === null ? null : data);
    } else {
      self._buffer.push(data);
    }
    self._drain();
  });

  if (this._top - this._bottom < this._maxParallel) return callback();
  this._ondrain = callback;
};

ParallelWrite.prototype._final = function (callback) {
  this._flushed = true;
  this._ondrain = callback;
  this._drain();
};

ParallelWrite.prototype._drain = function () {
  if (this._ordered) {
    while (this._buffer.get(this._bottom) !== undefined) {
      this._buffer.del(this._bottom++);
    }
  } else {
    while (this._buffer.length > 0) {
      this._buffer.pop();
      this._bottom++;
    }
  }

  if (!this._drained() || !this._ondrain) return;

  let ondrain = this._ondrain;
  this._ondrain = null;
  ondrain();
};

ParallelWrite.prototype._drained = function () {
  let diff = this._top - this._bottom;
  return this._flushed ? !diff : diff < this._maxParallel;
};

module.exports = (handleChunk, options = {}) => {
  return ParallelWrite(options.parallel || 1, { objectMode: true }, async (chunk, callback) => {
    try {
      let res = await handleChunk(chunk);
      callback(null, res);
    } catch (e) {
      callback(e);
    }
  });
};
