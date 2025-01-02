import { Transform, TransformCallback } from "stream";
import { TransformOptions } from "node:stream";

export type TransformStreamCallback<TInput, TOutput extends NodeJS.ReadableStream> = (
  data: TInput,
) => Promise<TOutput> | TOutput;

class TransformStream<TInput, TOutput extends NodeJS.ReadableStream> extends Transform {
  private callback: TransformStreamCallback<TInput, TOutput>;
  private _current: NodeJS.ReadableStream | null;

  constructor(callback: TransformStreamCallback<TInput, TOutput>, options?: TransformOptions) {
    super(options);
    this.callback = callback;
    this._current = null;
  }

  _transform(chunk: TInput, encoding: BufferEncoding, cb: TransformCallback) {
    Promise.resolve(this.callback(chunk))
      .then((stream) => {
        stream.on("error", (err: Error) => this.emit("error", err));
        stream.on("data", (data) => {
          this._current = stream;
          const backpressure = !this.push(data);
          if (backpressure) {
            stream.pause();
          }
        });
        stream.on("end", () => {
          this._current = null;
          cb();
        });
      })
      .catch(cb);
  }

  async _read(size: number) {
    if (this._current) {
      //Ensure every chunks has been consumed from the previous transform
      this._current.resume();
    }
    super._read(size);
  }
}

export function transformStream<TInput, TOutput extends NodeJS.ReadableStream>(
  callback: TransformStreamCallback<TInput, TOutput>,
  options: TransformOptions = {},
) {
  return new TransformStream(callback, { objectMode: true, ...options });
}
