const { Readable } = require("stream");

function delay(callback, delay) {
  return new Promise((resolve) => {
    return setTimeout(async () => {
      resolve(callback());
    }, delay);
  });
}

function streamArray(items) {
  return new Readable({
    objectMode: true,
    read() {
      this.push(items.length > 0 ? items.shift() : null);
    },
  });
}

function createStream() {
  return new Readable({
    objectMode: true,
    read() {},
  });
}

module.exports = {
  createStream,
  streamArray,
  delay,
};
