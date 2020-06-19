const assert = require("assert");
const { Readable } = require("stream");
const { transformObject, combine, writeObject } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can merge streams into a readable one", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    combine(
      source,
      transformObject((data) => data.substring(0, 1))
    )
      .pipe(writeObject((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("can pipe streams", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    combine(source)
      .pipe(transformObject((data) => data.substring(0, 1)))
      .pipe(writeObject((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("Ensure error is propagated when combining stream (from emit)", (done) => {
    let source = createStream();
    source.push("andré");

    combine(
      source,
      writeObject(() => ({}))
    )
      .on("error", (e) => {
        assert.strictEqual(e, "Error from source");
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });

    source.emit("error", "Error from source");
  });
});
