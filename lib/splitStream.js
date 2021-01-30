/**
 *  Adapted from https://www.npmjs.com/package/split
 */
const through = require("through");
const Decoder = require("string_decoder").StringDecoder;

module.exports = (options = {}) => {
  let decoder = new Decoder();
  let soFar = "";
  let maxLength = options.maxLength;
  let trailing = options.trailing !== false;
  let separator = options.separator || /\r?\n/;

  function emit(stream, piece) {
    stream.queue(piece);
  }

  function next(stream, buffer) {
    let pieces = ((soFar != null ? soFar : "") + buffer).split(separator);
    soFar = pieces.pop();

    if (maxLength && soFar.length > maxLength) return stream.emit("error", new Error("maximum buffer reached"));

    for (let i = 0; i < pieces.length; i++) {
      let piece = pieces[i];
      emit(stream, piece);
    }
  }

  return through(
    function (b) {
      next(this, decoder.write(b));
    },
    function () {
      if (decoder.end) next(this, decoder.end());
      if (trailing && soFar != null) {
        emit(this, soFar);
      }
      this.queue(null);
    }
  );
};
