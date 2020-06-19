const assert = require("assert");
const { Readable } = require("stream");
const { transformObject, oleoduc, combine, writeObject } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can create oleoduc from streams", async () => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    await oleoduc(
      source,
      transformObject((data) => data.substring(0, 1)),
      writeObject((data) => chunks.push(data))
    );

    assert.deepStrictEqual(chunks, ["a", "b", "r"]);
  });

  it("can use oleoduc with combined streams", async () => {
    let chunks = [];
    let source = createStream();
    let combined = combine(
      source,
      transformObject((d) => d.substring(0, 1))
    );

    source.push("first");
    source.push(null);

    await oleoduc(
      combined,
      writeObject((d) => chunks.push(d))
    );
    assert.deepStrictEqual(chunks, ["f"]);
  });

  it("oleoduc should propagate error (error from source)", (done) => {
    let source = createStream();

    oleoduc(
      source,
      writeObject(() => ({}))
    )
      .then(() => {
        assert.fail();
        done();
      })
      .catch(() => {
        done();
      });

    source.push("first");
    source.emit("error", "emitted");
  });
});
