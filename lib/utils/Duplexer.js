const { Duplex } = require("stream");

class Duplexer extends Duplex {
  constructor(input, output, options) {
    super(options || { writableObjectMode: true, readableObjectMode: true });
    this.input = input;
    this.output = output;
    this.output.on("end", () => this.push(null));
    this.output.on("data", (chunk) => {
      let backpressure = !this.push(chunk);
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

module.exports = Duplexer;
