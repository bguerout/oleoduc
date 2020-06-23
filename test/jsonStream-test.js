const assert = require("assert");
const { Readable } = require("stream");
const { pipeline, writeObject, jsonStream } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can jsonStream", async () => {
    let source = createStream();
    source.push({ name: "andré" });
    source.push(null);
    let json = "";

    await pipeline(
      source,
      jsonStream(),
      writeObject((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), [{ name: "andré" }]);
  });
});
