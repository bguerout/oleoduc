const { Transform } = require("stream");

class FlattenStream extends Transform {
  constructor(options) {
    super(options);
    this._current = null;
  }

  _transform(stream, encoding, callback) {
    const pushData = (data) => {
      this._current = stream;
      let backpressure = !this.push(data);
      if (backpressure) {
        stream.pause();
      }
    };

    if (!this._current) {
      stream.on("error", (err) => this.emit("error", err));
      stream.on("data", pushData);
      stream.on("end", () => {
        this._current = null;
        callback();
      });
    }

    stream.resume();
  }

  _read(size) {
    if (this._current !== null) {
      //Ensure every chunks has been consumed from the previous transform
      this._current.resume();
    }
    super._read(size);
  }
}

function flattenStream(options = {}) {
  return new FlattenStream({ objectMode: true, ...options });
}

module.exports = flattenStream;
