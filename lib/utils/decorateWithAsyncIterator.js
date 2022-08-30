const { toAsyncIterator } = require("./toAsyncIterator");

function decorateWithAsyncIterator(stream) {
  stream[Symbol.asyncIterator] = () => toAsyncIterator(stream);
}

module.exports = { decorateWithAsyncIterator };
