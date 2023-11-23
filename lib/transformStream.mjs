import { Transform } from "stream";

class TransformStream extends Transform {
  constructor(handleChunk, options) {
    super(options);
    this.handleChunk = handleChunk;
    this._current = null;
  }

  _transform(chunk, encoding, callback) {
    const res = Promise.resolve(this.handleChunk(chunk));
    const promise = res.then ? res : Promise.resolve(res); //FIXME

    promise
      .then((stream) => {
        stream.on("error", (err) => this.emit("error", err));
        stream.on("data", (data) => {
          this._current = stream;
          const backpressure = !this.push(data);
          if (backpressure) {
            console.log("pause");
            stream.pause();
          }
        });
        stream.on("end", () => {
          this._current = null;
          callback();
        });
      })
      .catch(callback);
  }

  async _read(size) {
    if (this._current) {
      //Ensure every chunks has been consumed from the previous transform
      this._current.resume();
    }
    super._read(size);
  }
}

export function transformStream(handleChunk, options = {}) {
  return new TransformStream(handleChunk, { objectMode: true, ...options });
}
