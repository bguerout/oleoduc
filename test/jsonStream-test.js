const assert = require("assert");
const { Readable } = require("stream");
const { multipipe, writeData, jsonStream } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can stream as a json array", async () => {
    let sourceStream = createStream();
    sourceStream.push({ name: "andré" });
    sourceStream.push(null);
    let json = "";

    await multipipe(
      sourceStream,
      jsonStream(),
      writeData((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), [{ name: "andré" }]);
  });

  it("when no results should stream an empty json array", async () => {
    let sourceStream = createStream();
    sourceStream.push(null);
    let json = "";

    await multipipe(
      sourceStream,
      jsonStream(),
      writeData((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), []);
  });

  it("can stream and wrapped json array", async () => {
    let sourceStream = createStream();
    sourceStream.push({ name: "andré" });
    sourceStream.push(null);
    let json = "";

    await multipipe(
      sourceStream,
      jsonStream({ arrayPropertyName: "results" }),
      writeData((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), { results: [{ name: "andré" }] });
  });

  it("can stream and wrapped json array into a preexisting object", async () => {
    let sourceStream = createStream();
    sourceStream.push({ name: "andré" });
    sourceStream.push(null);
    let json = "";

    await multipipe(
      sourceStream,
      jsonStream({ arrayWrapper: { preexisting: true }, arrayPropertyName: "results" }),
      writeData((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), { preexisting: true, results: [{ name: "andré" }] });
  });
});
