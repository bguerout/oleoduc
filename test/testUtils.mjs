import { Readable } from "stream";

export function delay(callback, delay) {
  return new Promise((resolve) => {
    return setTimeout(async () => {
      resolve(callback());
    }, delay);
  });
}

export function streamArray(items) {
  return new Readable({
    objectMode: true,
    read() {
      this.push(items.length > 0 ? items.shift() : null);
    },
  });
}

export function createStream() {
  return new Readable({
    objectMode: true,
    read() {},
  });
}
