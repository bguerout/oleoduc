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
  it("can combine streams into a readable one", (done) => {
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

  it("can combine streams and then pipe", (done) => {
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

  it("can combine streams (error propagation)", (done) => {
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

  it("can combine streams (error propagation with promise)", (done) => {
    let source = createStream();

    combine(
      source,
      writeObject(() => ({}))
    )
      .then(() => {
        assert.fail();
        done();
      })
      .catch((e) => {
        assert.strictEqual(e, "emitted");
        done();
      });

    source.emit("error", "emitted");
  });

  it("can combine streams (error propagation from a nested stream)", (done) => {
    let source = createStream();
    source.push("first");

    combine(
      source,
      writeObject(() => {
        throw new Error("write");
      })
    )
      .on("error", (e) => {
        assert.strictEqual(e.message, "write");
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });
  });
});
