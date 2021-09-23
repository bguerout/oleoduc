const assert = require("assert");
const { Readable } = require("stream");
const { oleoduc, transformData, asyncReadableIterator } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can consume a stream", async () => {
    let source = createStream();
    source.push("a");
    source.push("b");
    source.push("c");
    source.push(null);

    let chunks = [];
    for await (const chunk of asyncReadableIterator(source)) {
      chunks.push(chunk);
    }

    assert.deepStrictEqual(chunks, ["a", "b", "c"]);
  });

  it("can handle error during consumption", async () => {
    let source = createStream();
    let failingStream = oleoduc(
      source,
      transformData(() => {
        throw new Error("This is a stream error");
      }),
      { promisify: false }
    );
    source.push("a");
    source.push("b");

    try {
      let consumer = asyncReadableIterator(failingStream);
      await consumer.next();
      assert.fail();
    } catch (e) {
      assert.deepStrictEqual(e.message, "This is a stream error");
    }

    source.push(null);
  });
});
