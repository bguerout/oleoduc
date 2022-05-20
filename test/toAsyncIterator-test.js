const assert = require("assert");
const { Readable } = require("stream");
const toAsyncIterator = require("../lib/utils/toAsyncIterator");
const { transformData, oleoduc } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe("toAsyncIterator", () => {
  it("can convert a readable stream into an iterator", async () => {
    const readable = createStream();
    readable.push("a");
    readable.push("b");
    readable.push("c");
    readable.push(null);

    const chunks = [];
    for await (const chunk of toAsyncIterator(readable)) {
      chunks.push(chunk);
    }

    assert.deepStrictEqual(chunks, ["a", "b", "c"]);
  });

  it("iterator should honor error", async () => {
    const readable = createStream();
    const failingStream = oleoduc(
      readable,
      transformData(() => {
        throw new Error("This is a stream error");
      }),
      { promisify: false }
    );
    readable.push("a");
    readable.push("b");

    try {
      const iterator = toAsyncIterator(failingStream);
      await iterator.next();
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(e.message, "This is a stream error");
    }

    readable.push(null);
  });
});
