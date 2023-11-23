import { Duplex } from "stream";

export class Duplexer extends Duplex {
  constructor(input, output, options) {
    super(options || { writableObjectMode: true, readableObjectMode: true });
    this.input = input;
    this.output = output;
    this.output.on("end", () => this.push(null));
    this.output.on("data", (chunk) => {
      const backpressure = !this.push(chunk);
      if (backpressure) {
        this.output.pause();
      }
    });
  }
  _write(chunk, encoding, callback) {
    this.input.write(chunk, encoding, callback);
  }
  _final(callback) {
    this.input.end(null, null, callback);
  }
  _read() {
    this.output.resume();
  }
}
