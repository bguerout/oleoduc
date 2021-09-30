const { Readable } = require("stream");

function delay(callback, delay) {
  return new Promise((resolve) => {
    return setTimeout(async () => {
      resolve(callback());
    }, delay);
  });
}

function createStream(items) {
  return new Readable({
    objectMode: true,
    read() {
      this.push(items.length === 0 ? null : items.pop());
    },
  });
}

module.exports = {
  createStream,
  delay,
};
