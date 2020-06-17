const assert = require("assert");
const { Readable } = require("stream");
const { oleoduc, writeObject, jsonStream } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can jsonStream", async () => {
    let sourceStream = createStream();
    sourceStream.push({ name: "andré" });
    sourceStream.push(null);
    let json = "";

    await oleoduc(
      sourceStream,
      jsonStream(),
      writeObject((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), [{ name: "andré" }]);
  });
});
