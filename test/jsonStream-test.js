const assert = require("assert");
const { Readable } = require("stream");
const { oleoduc, writeData, jsonStream } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can stream a json array", async () => {
    let sourceStream = createStream();
    sourceStream.push({ name: "andré" });
    sourceStream.push({ name: "robert" });
    sourceStream.push(null);
    let json = "";

    await oleoduc(
      sourceStream,
      jsonStream(),
      writeData((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), [{ name: "andré" }, { name: "robert" }]);
  });

  it("can stream an empty json array", async () => {
    let sourceStream = createStream();
    sourceStream.push(null);
    let json = "";

    await oleoduc(
      sourceStream,
      jsonStream(),
      writeData((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), []);
  });

  it("can wrap and stream a json array", async () => {
    let sourceStream = createStream();
    sourceStream.push({ name: "andré" });
    sourceStream.push(null);
    let json = "";

    await oleoduc(
      sourceStream,
      jsonStream({ arrayPropertyName: "results" }),
      writeData((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), { results: [{ name: "andré" }] });
  });

  it("can wrap and stream an empty json array", async () => {
    let sourceStream = createStream();
    sourceStream.push(null);
    let json = "";

    await oleoduc(
      sourceStream,
      jsonStream({ arrayPropertyName: "results" }),
      writeData((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), { results: [] });
  });

  it("can wrap and stream a json array into a object", async () => {
    let sourceStream = createStream();
    sourceStream.push({ name: "andré" });
    sourceStream.push(null);
    let json = "";

    await oleoduc(
      sourceStream,
      jsonStream({ arrayWrapper: { preexisting: true }, arrayPropertyName: "results" }),
      writeData((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), { preexisting: true, results: [{ name: "andré" }] });
  });

  it("can wrap and stream an empty json array into a object", async () => {
    let sourceStream = createStream();
    sourceStream.push(null);
    let json = "";

    await oleoduc(
      sourceStream,
      jsonStream({ arrayWrapper: { preexisting: true }, arrayPropertyName: "results" }),
      writeData((data) => (json += data))
    );

    assert.deepStrictEqual(JSON.parse(json), { preexisting: true, results: [] });
  });
});
